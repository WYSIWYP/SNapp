import React, {CSSProperties} from 'react';

type Props = {
    header: string,
    fontSize?: number,
    headerLeft?: React.ReactNode,
    headerRight?: React.ReactNode,
};

const Frame: React.FC<Props> = ({header,fontSize,headerLeft,headerRight,children}) => {
    
    return (
        <div style={styles.appContainer}>
            <div style={{...styles.header, fontSize: fontSize || 45}}>
                <div style={styles.headerLeft}>
                    {headerLeft}
                </div>
                {header}
                <div style={styles.headerRight}>
                    {headerRight}
                </div>
            </div>
            <div style={styles.page}>
                {children}
            </div>
        </div>
    );
};

const styleMap = {
    appContainer: {
        overflow: 'hidden',
    },
    header: {
        left: '50%',
        height: '100px',
        transform: 'translate(-50%,0px)',
        backgroundColor: '#31B7D6',
        lineHeight: '100px',
        minWidth: '600px',
        textAlign: 'center',
    },
    headerLeft: {
        left: '20px',
        width: 'auto',
    },
    headerRight: {
        left: 'auto',
        right: '20px',
        width: 'auto',
    },
    page: {
        top: '100px',
        height: 'calc(100% - 100px)',
    },
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Frame;
