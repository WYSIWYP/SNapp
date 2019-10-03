import React, {CSSProperties} from 'react';
import {Link} from "@reach/router";
import Radium from 'radium';

type Props = {
    text: string,
    link: string,
};

const HeaderButton: React.FC<Props> = ({text,link}) => {
    return (
        <Link to={link}>
            <div style={styles.button}>
                {text}
            </div>
        </Link>
    );
};

const styleMap = {
    button: {
        top: '50%',
        left: 'auto',
        width: '200px',
        height: '60px',
        transform: 'translate(0px,-50%)',
        lineHeight: '60px',
        fontSize: '30px',
        borderRadius: '10px',
        backgroundColor: '#bbb',
        fontWeight: 'bold',
        cursor: 'pointer',
        color: 'black',
        ':hover': {
            backgroundColor: '#aaa',
        },
    },
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Radium(HeaderButton);
