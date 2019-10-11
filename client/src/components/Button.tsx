import React, {CSSProperties} from 'react';
import Radium from 'radium';

type Props = {
    text: string,
    action: ()=>void,
};

const HeaderButton: React.FC<Props> = ({text,action}) => {
    return (
        <div onClick={action} style={styles.button}>
            {text}
        </div>
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
        textAlign: 'center',
        ':hover': {
            backgroundColor: '#aaa',
        },
    },
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Radium(HeaderButton);
