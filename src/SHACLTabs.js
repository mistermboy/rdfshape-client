import React from 'react';
import InputTabs from "./InputTabs";

class SHACLTabs extends React.Component {
    render() {
        return (
            <InputTabs name="SHACL Shapes graph"
                       byTextPlaceholder="RDF data"
                       byURLPlaceholder="http://..."
            />
        );
    }
}

export default SHACLTabs;