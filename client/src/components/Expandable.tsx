import React, {CSSProperties, useState, useRef} from "react";

type Props = {
    title: string;
};

const Frame: React.FC<Props> = ({
    title,
    children
}) => {
    let [expanded, setExpanded] = useState(false);
    let ref = useRef(undefined! as HTMLDivElement);
    let downArrow = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -3 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
    let rightArrow = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -3 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
    return (
        <div style={styles.group}>
            <div style={styles.title} onClick={() => {setExpanded(s => !s);}}>
                {expanded ? downArrow : rightArrow} {title}
            </div>
            <div className={`animated-height`} style={{...styles.children, height: `${expanded ? Math.ceil(ref === undefined ? 0 : ref.current.clientHeight + 30) : 0}px`}}>
                <div ref={ref} style={styles.childrenWrapper}>
                    {children}
                </div>
            </div>
        </div >
    );
};

const styleMap = {
    group: {
        paddingLeft: '10px',
        height: 'auto',
        position: 'relative',
    },
    title: {
        position: 'relative',
        height: '40px',
        marginTop: '30px',
        alignItems: 'baseline',
        display: 'flex',
        width: '100%',
        lineHeight: '40px',
        fontSize: '23px',
    },
    children: {
        position: 'relative',
        paddingLeft: '15px',
        marginBottom: '30px',
        overflow: 'hidden',
    },
    childrenWrapper: {
        position: 'relative',
        height: 'auto',
    }
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Frame;
