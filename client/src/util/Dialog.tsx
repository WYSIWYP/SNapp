import React, {CSSProperties} from "react";
import {action as DialogAction} from '../contexts/Dialog';

export const close = ()=>{
    return {type: 'close'} as DialogAction;
}

export const showMessage = (title: string, body: any, buttonText: string, buttonAction: ()=>void): DialogAction =>{
    return {type: 'open', val: {title, width: 400, height: 275, contents: <div style={styles.body}>
        <div style={styles.space} />
        <div style={styles.top}>
            {body}
        </div>
        <div style={styles.space} />
        <div style={styles.bottom}>
            <span style={styles.link} onClick={buttonAction}>
                {buttonText}
            </span>
        </div>
    </div>}};
}

const styleMap = {
    body: {
        display: 'flex',
        flexDirection: 'column',
    },
    top: {
        position: 'initial',
        top: 'auto',
        left: 'auto',
        height: 'auto',
        fontSize: '20px',
        textAlign: 'center',
        flex: '0 1 auto',
        padding: '30px',
        overflowX: 'hidden',
        overflowY: 'auto',
    },
    bottom: {
        position: 'initial',
        top: 'auto',
        left: 'auto',
        height: 'auto',
        textAlign: 'center',
        flex: '0 0 auto',
        paddingBottom: '20px',
    },
    space: {
        position: 'initial',
        top: 'auto',
        left: 'auto',
        height: 'auto',
        flex: '1 0 auto',
    },
    link: {
        color: '#31B7D6',
        cursor: 'pointer',
        fontSize: '28px',
        fontWeight: 'bold',
    }
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;
