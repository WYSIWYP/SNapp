import React, {CSSProperties, useState, useRef, useContext, useEffect} from 'react';

type Props = {
    header: string,
    fontSize?: number,
    SideMenu?: React.ReactNode,    
    ShowSideMenu?: boolean,
};

const Frame: React.FC<Props> = ({header,fontSize,SideMenu: SideBar,ShowSideMenu,children}) => {
    
    let [sideBarWidth,setSideBarWidth] = useState(0);

    let easeInOutCubic = function (t: number) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 };
    useEffect(()=>{
        let width = sideBarWidth;
        let interval = setInterval(()=>{
            if(ShowSideMenu && width < 1){
                width += .1;
                setSideBarWidth(width);
            } else if(!ShowSideMenu && width > 0){
                width -= .1;
                setSideBarWidth(width);
            } else {
                clearInterval(interval);
            }
        },20);
        return ()=>{
            clearInterval(interval);
        }
    },[ShowSideMenu]);

    

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

            <div style={{...styles.sideBar, ...({width: `${easeInOutCubic(sideBarWidth)*300}px`})}}>
                {ShowSideMenu||sideBarWidth!=0?SideBar:null}
            </div>
            <div style={{...styles.page, ...({width: `calc(100% - ${easeInOutCubic(sideBarWidth)*300}px)`})}}>
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
        height: '100px',
        transform: 'translate(-50%,0px)',
        backgroundColor: '#31B7D6',
        minWidth: '600px',
        position: 'absolute',
    },
   
    page: {
        top: '100px',
        height: 'calc(100% - 100px)',
        overflow: 'auto',
    },
    sideBar:{
        top: '100px',
        height: 'calc(100% - 100px)',
        borderLeft: '1px solid #6F6F6F',
        left: 'auto',
        right: '0px',
    },



} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Frame;
