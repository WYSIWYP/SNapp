import React, {useEffect, useState, CSSProperties} from 'react';
import {useDialogState} from '../../contexts/Dialog';
import Button from '../Button';

type Props = {};

const Dialog: React.FC<Props> = () => {
    
    let [dialog, dispatchDialog] = useDialogState();
    let data = dialog.data!;

    let [drag, setDrag] = useState({active: false, startX: 0, startY: 0, mouseX: 0, mouseY: 0, x: 0, y: 0});

    useEffect(()=>{
        if(drag.x !== 0 && drag.y !== 0 && !dialog.shown){
            setDrag({...drag, x: 0, y: 0});
        }
    },[drag,dialog.shown]);

    return (
        !dialog.shown?null:<div
            style={styles.bg}
            onMouseMove={(e)=>{setDrag({...drag, mouseX: e.clientX, mouseY: e.clientY, ...(drag.active?{x: drag.mouseX-drag.startX, y: drag.mouseY-drag.startY}:{})});}}
            onMouseUp={()=>{setDrag({...drag, active: false});}}
            onMouseLeave={()=>{setDrag({...drag, active: false});}}
        >
            <div style={{
                ...styles.frame,
                top: `calc(50% + ${drag.y}px)`,
                left: `calc(50% + ${drag.x}px)`,
            }}>
                <div style={{...styles.header, fontSize: 35 || 45}}
                    onMouseDown={()=>{setDrag({...drag, active: true, startX: drag.mouseX-drag.x, startY: drag.mouseY-drag.y});}}
                >
                    {data.title}
                    <div style={styles.headerRight}>
                        {undefined || ''}
                    </div>
                </div>
                <div style={styles.body}>
                    <div style={{
                        ...styles.page,
                    }}>
                        {data.contents}
                    </div>
                    <div style={styles.buttons}><Button text={data.buttons[0].text} action={data.buttons[0].action || (()=>{dispatchDialog({type: 'close'})})} /></div>
                </div>
            </div>
        </div>
    );
};

const styleMap = {
    bg: {
        position: 'fixed',
        backgroundColor: '#00000099',
    },
    frame: {
        width: '600px',
        height: '400px',
        border: '2px solid #444',
        overflow: 'hidden',
        transform: 'translate(-50%,-50%)',
        borderRadius: '10px',
    },
    header: {
        height: '50px',
        backgroundColor: '#ddd',
        lineHeight: '50px',
        textAlign: 'center',
        userSelect: 'none',
        borderBottom: '1px solid #444',
    },
    headerRight: {
        left: 'auto',
        right: '20px',
        width: 'auto',
        fontSize: '15px',
    },
    body: {
        top: '50px',
        backgroundColor: '#fff',
        height: 'calc(100% - 50px)',
    },
    page: {
        top: 'calc(50% - 40px)',
        left: '50%',
        height: 'auto',
        width: '85%',
        maxHeight: 'calc(100% - 120px)',
        textAlign: 'center',
        fontSize: '25px',
        transform: 'translate(-50%, -50%)',
        overflowY: 'auto',
    },
    buttons: {
        top: 'auto',
        bottom: '20px',
        left: '50%',
        width: '200px',
        height: '60px',
        transform: 'translate(-50%, 0px)',
    },
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Dialog;
