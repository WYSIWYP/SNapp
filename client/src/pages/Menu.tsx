import React, {CSSProperties} from 'react';
import {RouteComponentProps, Link} from "@reach/router";
import Frame from '../components/Frame';

type Props = {} & RouteComponentProps;

const Menu: React.FC<Props> = () => {
    return (
        <Frame header="SNapp" fontSize={55}>
            <div style={styles.centeredText}>
                This is an example of a page with a header... <br />
                <Link style={styles.link} to="convert">This is a link to the convert page...</Link>
            </div>
        </Frame>
    );
};

const styleMap = {
    centeredText: {
        top: '200px',
        height: 'auto',
        textAlign: 'center',
    },
    link: {
        color: 'blue',
        textDecoration: 'underline',
    }
} as const;
const styles: Record<keyof typeof styleMap,CSSProperties> = styleMap;

export default Menu;
