import axios from "axios";
import qs from "query-string";
import React, { Fragment, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import ImageIcon from "react-open-iconic-svg/dist/ImageIcon";
import ZoomInIcon from "react-open-iconic-svg/dist/ZoomInIcon";
import ZoomOutIcon from "react-open-iconic-svg/dist/ZoomOutIcon";
import API from "../API";
import { mkPermalinkLong, params2Form, Permalink } from "../Permalink";
import ResultShExVisualize from "../results/ResultShExVisualize";
import {
  getShexText,
  InitialShEx,
  mkShExTabs,
  paramsFromStateShEx,
  shExParamsFromQueryParams,
  updateStateShEx
} from "./ShEx";

function ShExVisualize(props) {
  const [shex, setShex] = useState(InitialShEx);

  const [result, setResult] = useState("");

  const [params, setParams] = useState(null);
  const [lastParams, setLastParams] = useState(null);

  const [permalink, setPermalink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [svgZoom, setSvgZoom] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [imageLink, setImageLink] = useState(null);

  const url = API.schemaVisualize;

  const minSvgZoom = API.minSvgZoom;
  const maxSvgZoom = API.maxSvgZoom;
  const svgZoomStep = API.svgZoomStep;

  useEffect(() => {
    if (props.location?.search) {
      const queryParams = qs.parse(props.location.search);
      let paramsShEx = {};

      if (
        queryParams.schema ||
        queryParams.schemaURL ||
        queryParams.schemaFile
      ) {
        const schemaParams = shExParamsFromQueryParams(queryParams);
        const finalSchema = updateStateShEx(schemaParams, shex) || shex;
        setShex(finalSchema);
        paramsShEx = finalSchema;
      }

      let params = {
        ...paramsFromStateShEx(paramsShEx),
        schemaEngine: "ShEx",
      };
      setParams(params);
      setLastParams(params);
    }
  }, [props.location?.search]);

  useEffect(() => {
    if (params && !loading) {
      if (
        params.schema ||
        params.schemaURL ||
        (params.schemaFile && params.schemaFile.name)
      ) {
        resetState();
        setUpHistory();
        postVisualize();
      } else {
        setError("No ShEx schema provided");
      }
      window.scrollTo(0, 0);
    }
  }, [params]);

  function handleSubmit(event) {
    event.preventDefault();
    setParams({
      ...paramsFromStateShEx(shex),
      schemaEngine: "ShEx",
    });
  }

  function zoomSvg(zoomIn) {
    if (zoomIn) {
      const zoom = Math.min(maxSvgZoom, svgZoom + svgZoomStep);
      setSvgZoom(zoom);
    } else {
      const zoom = Math.max(minSvgZoom, svgZoom - svgZoomStep);
      setSvgZoom(zoom);
    }
  }

  function postVisualize(cb) {
    setLoading(true);
    setProgressPercent(20);
    const formData = params2Form(params);

    axios
      .post(url, formData)
      .then((response) => response.data)
      .then(async (data) => {
        setProgressPercent(70);
        setResult(data);
        setPermalink(mkPermalinkLong(API.shExVisualizeRoute, params));
        setImageLink(mkPermalinkLong(API.shExVisualizeRouteRaw, params));
        setProgressPercent(90);
        if (cb) cb();
        setProgressPercent(100);
      })
      .catch(function(error) {
        setError(`Error doing request to ${url}: ${error}`);
      })
      .finally(() => setLoading(false));
  }

  function setUpHistory() {
    // Store the last search URL in the browser history to allow going back
    if (
      params &&
      lastParams &&
      JSON.stringify(params) !== JSON.stringify(lastParams)
    ) {
      // eslint-disable-next-line no-restricted-globals
      history.pushState(
        null,
        document.title,
        mkPermalinkLong(API.shExVisualizeRoute, lastParams)
      );
    }
    // Change current url for shareable links
    // eslint-disable-next-line no-restricted-globals
    history.replaceState(
      null,
      document.title,
      mkPermalinkLong(API.shExVisualizeRoute, params)
    );

    setLastParams(params);
  }

  function resetState() {
    setResult(null);
    setPermalink(null);
    setImageLink(null);
    setError(null);
    setProgressPercent(0);
  }

  return (
    <Container fluid={true}>
      <Row>
        <h1>ShEx: Visualize ShEx schemas</h1>
      </Row>
      <Row>
        <Col className={"half-col border-right"}>
          <Form onSubmit={handleSubmit}>
            {mkShExTabs(shex, setShex, "ShEx Input")}
            <hr />
            <Button
              variant="primary"
              type="submit"
              className={"btn-with-icon " + (loading ? "disabled" : "")}
              disabled={loading}
            >
              Visualize
            </Button>
          </Form>
        </Col>
        {loading || result || permalink || error ? (
          <Col className="half-col visual-column">
            <Fragment>
              {permalink && !error && !result?.error ? (
                <div className={"d-flex"} style={{ flexWrap: "wrap" }}>
                  <Permalink
                    url={permalink}
                    disabled={
                      getShexText(shex).length > API.byTextCharacterLimit
                        ? API.byTextTab
                        : shex.activeTab === API.byFileTab
                        ? API.byFileTab
                        : false
                    }
                  />
                  {imageLink && (
                    <Permalink
                      style={{ marginLeft: "5px" }}
                      icon={<ImageIcon className="white-icon" />}
                      shorten={false}
                      text={"Embed"}
                      url={imageLink}
                      disabled={
                        getShexText(shex).length > API.byTextCharacterLimit
                          ? API.byTextTab
                          : shex.activeTab === API.byFileTab
                          ? API.byFileTab
                          : false
                      }
                    />
                  )}
                  <div className="divider"></div>
                  <Button
                    onClick={() => zoomSvg(false)}
                    className="btn-zoom"
                    variant="secondary"
                    disabled={svgZoom <= minSvgZoom}
                  >
                    <ZoomOutIcon className="white-icon" />
                  </Button>
                  <Button
                    onClick={() => zoomSvg(true)}
                    style={{ marginLeft: "1px" }}
                    className="btn-zoom"
                    variant="secondary"
                    disabled={svgZoom >= maxSvgZoom}
                  >
                    <ZoomInIcon className="white-icon" />
                  </Button>
                </div>
              ) : null}
              {loading ? (
                <ProgressBar
                  striped
                  animated
                  variant="info"
                  now={progressPercent}
                />
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : result ? (
                !result.error ? (
                  <div
                    style={{ overflow: "auto" }}
                    className={"width-100 height-100 border"}
                  >
                    <ResultShExVisualize
                      result={result}
                      zoom={svgZoom}
                      showDetails={false}
                    />
                  </div>
                ) : (
                  <div>
                    <ResultShExVisualize result={result} showDetails={true} />
                  </div>
                )
              ) : null}
            </Fragment>
          </Col>
        ) : (
          <Col className={"half-col"}>
            <Alert variant="info">Visualizations will appear here</Alert>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default ShExVisualize;
