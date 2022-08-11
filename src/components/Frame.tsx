import React, {CSSProperties} from "react";

type Props = {
    header?: string,
    fontSize?: number,
    sideMenu?: React.ReactNode,
    showSideMenu?: boolean,
    children?: any,
};

const Frame: React.FC<Props> = ({
    header,
    fontSize,
    sideMenu,
    showSideMenu,
    children,
}) => {
    return (
        <div style={styles.appContainer}>

            {header === undefined ? null : <div id="header" style={{...styles.header, fontSize: fontSize || 40}}>
                {header}
            </div>}

            <div style={{...styles.page, ...(header === undefined ? {top: '0px', height: '100%'} : {})}}>{children}</div>
            <div className={`animated ${showSideMenu ? 'open' : 'close'}`}
                style={{...styles.sideBar, ...(header === undefined ? {top: '0px', height: '100%'} : {})}}>
                {sideMenu}
            </div>
        </div>
    );
};

const styleMap = {
    appContainer: {
        overflow: "hidden",
    },
    header: {
        fontStyle: "normal",
        fontWeight: "normal",
        fontSize: "42px",
        textAlign: "center",
        letterSpacing: "0.05em",
        left: "50%",
        height: "80px",
        lineHeight: "80px",
        transform: "translate(-50%,0px)",
        backgroundColor: "#31B7D6",
        minWidth: "600px",
        position: "absolute",
        overflow: 'hidden',
    },
    page: {
        top: "80px",
        height: "calc(100% - 80px)",
        overflow: "auto",
    },
    sideBar: {
        backgroundColor: "rgba(0,0,0,0.7)",
        top: "80px",
        height: "calc(100% - 80px)",
        left: "auto",
        right: "0px",
    }
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Frame;
