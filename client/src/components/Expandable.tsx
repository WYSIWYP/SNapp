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
    return (
        <div style={styles.group}>
            <div style={styles.title} onClick={() => {setExpanded(s => !s)}}>
                {`${expanded ? '▽' : '▷'} ${title}`}
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
