import React, { CSSProperties } from "react";

type Props = {
  header: string;
  fontSize?: number;
  sideMenu?: React.ReactNode;
  showSideMenu?: boolean;
};

const Frame: React.FC<Props> = ({
  header,
  fontSize,
  sideMenu,
  showSideMenu,
  children
}) => {
  return (
    <div style={styles.appContainer}>
      <div id="header" style={{ ...styles.header, fontSize: fontSize || 45 }}>
        {header}
        {/* <div style={styles.headerLeft}>
                    {headerLeft}
                </div>
                <div style={styles.headerRight}>
                    {headerRight}
                </div> */}
      </div>

      <div style={styles.page}>{children}</div>
      <div className={`animated ${showSideMenu?'open':'close'}`}
        style={{...styles.sideBar}}>
            {sideMenu}
      </div>
    </div>
  );
};

const styleMap = {
  appContainer: {
    overflow: "hidden"
  },
  header: {
    paddingTop: "8px",
    fontStyle: "normal",
    fontWeight: "normal",
    fontSize: "42px",
    alignItems: "center",
    textAlign: "center",
    letterSpacing: "0.15em",
    left: "50%",
    top: "0px",
    height: "80px",
    transform: "translate(-50%,0px)",
    backgroundColor: "#31B7D6",
    minWidth: "600px",
    position: "absolute"
  },
  page: {
    top: "80px",
    height: "calc(100% - 80px)",
    overflow: "auto"
  },
  sideBar: {
    overflowY: 'scroll',
    overflowX: 'hidden',
    backgroundColor: "rgba(0,0,0,0.7)",
    top: "80px",
    height: "calc(100% - 80px)",
    left: "auto",
    right: "0px"
  }
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Frame;
