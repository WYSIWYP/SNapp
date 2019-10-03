import React, {CSSProperties} from 'react';
import {RouteComponentProps} from "@reach/router";

type Props = {} & RouteComponentProps;

const NotFound: React.FC<Props> = () => {
    return (
        <div style={styles.body}>
            That page could not be found
        </div>
    );
};

const styleMap = {
    body: {
        top: '50%',
        height: 'auto',
        transform: 'translate(0px,-50px)',
        textAlign: 'center',
        fontSize: '22px',
    },
} as const;
const styles: Record<keyof typeof styleMap,CSSProperties> = styleMap;

export default NotFound;
