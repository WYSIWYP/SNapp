import React, {CSSProperties, useState, useRef, useContext, useEffect} from 'react';

type Props = {
    header: string,
    fontSize?: number,
    SideMenu?: React.ReactNode,
    ShowSideMenu?: boolean,
};

const Frame: React.FC<Props> = ({header,fontSize,SideMenu,ShowSideMenu,children}) => {
    

    return (
        <div style={styles.appContainer}>
            <div style={{...styles.header, fontSize: fontSize || 45}}>
                {header}
                {/* <div style={styles.headerLeft}>
                    {headerLeft}
                </div>
                <div style={styles.headerRight}>
                    {headerRight}
                </div> */}
            </div>

            
            <div style={styles.sideBar}>
                    <div style={styles.sideBarTop}>
                        Export 
                        Import
                        Close X
                    </div>
                    <div style={styles.sideBarContent}>
                        <div style={styles.line}>
                            <div style={styles.name}>Staff Scale</div>
                            <div style={styles.option}>Medium </div>
                        </div>

                        <div style={styles.line}>
                            <div style={styles.name}>Horizontal Spacing</div>
                            <div style={styles.option}>10 px </div>
                        </div>

                        <div style={styles.line}>
                            <div style={styles.name}>Vertical Spacing</div>
                            <div style={styles.option}> 20 px </div>
                        </div>


                    </div>
            </div>


            <div style={styles.page}>
                {children}

                
            </div>
        </div>
    );
};

const styleMap = {
    name:{
        position:'relative',
        width: '50%',
        paddingTop: '6%',
    },
    option:{
        paddingTop: '5%',
        background: '#F5F5F5',
        border: '1px solid #6F6F6F',
        boxSizing: 'border-box',
        borderRadius: '10px',
        position:'relative',
        width: '50%',
        textAlign:'center',

    },
    line:{

        margin: '30px 0px',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        position:'relative',
        height:'50px',


    },
    sideBarContent:{
        padding: '0 20px',
        position:'relative',
        marginTop: '40px',
    },
    appContainer: {
        overflow: 'hidden',
    },
    header: {
        // fontFamily: 'open sans',
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontSize: '42px',
        alignItems: 'center',
        textAlign: 'center',
        letterSpacing: '0.15em',
        left: '50%',
        top:'0px',
        height: '80px',
        transform: 'translate(-50%,0px)',
        backgroundColor: '#31B7D6',
        minWidth: '600px',
        position: 'absolute',
    },
   
    page: {
        top: '100px',
        height: 'calc(100% - 100px)',
    },
    sideBar:{
        top: '80px',
        height: 'calc(100% - 100px)',

        borderLeft: '1px solid #6F6F6F',
        boxSizing: 'border-box',
        position:'relative',

        width:'20%',
        float:'right',

    },

    sideBarTop:{
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: '1px solid #6F6F6F',
        boxSizing: 'border-box',
        height: '80px',
        display:'flex',
        color:'#31B7D6',
        fontSize: '25px',
        fontWeight:'bold',
        cursor: 'pointer',
        position: 'relative',
        width: 'auto',
    }


} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Frame;
