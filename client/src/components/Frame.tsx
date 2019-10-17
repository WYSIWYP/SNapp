import React, {CSSProperties, useState, useEffect, useRef} from 'react';

type Props = {
    header: string,
    fontSize?: number,
    sideMenu?: React.ReactNode,    
    showSideMenu?: boolean,
};

const Frame: React.FC<Props> = ({header,fontSize,sideMenu,showSideMenu,children}) => {
    
    let [sideMenuWidth,setSideMenuWidth] = useState(0);

    let animation = useRef<{
        state: number,
    }>({
        state: 0,
    });

    let easeInQuad = function (t: number) { return t<0?0:t*t };
    
    

    useEffect(()=>{
        let a = animation.current;

        let duration = 300;
        let lastTime: number = undefined!;
        let cancel = false;

        const animate = (time: number)=>{
            let dt = lastTime===undefined?0:time-lastTime;
            lastTime = time;
    
            if(showSideMenu){
                a.state = Math.min(a.state+dt/duration,1);
            } else {
                a.state = Math.max(a.state-dt/duration,0);
            }

            setSideMenuWidth(easeInQuad(a.state));
    
            if(!cancel && ((showSideMenu && a.state < 1) || (!showSideMenu && a.state > 0))){
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
        
        return ()=>{
            cancel = true;
        }
    },[showSideMenu]);

    

    return (
        <div style={styles.appContainer}>
            <div id="header" style={{...styles.header, fontSize: fontSize || 45}}>
                {header}
                {/* <div style={styles.headerLeft}>
                    {headerLeft}
                </div>
                <div style={styles.headerRight}>
                    {headerRight}
                </div> */}
            </div>

            <div style={{...styles.sideBar, ...({width: `${sideMenuWidth*350}px`, opacity: sideMenuWidth})}}>
                {sideMenuWidth!==0?sideMenu:null}
            </div>
            <div style={{...styles.page, ...({width: `calc(100% - ${sideMenuWidth*350}px)`})}}>
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
        paddingTop: '8px',
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
        top: '80px',
        height: 'calc(100% - 80px)',
        overflow: 'auto',
    },
    sideBar:{
        boxShadow: '0px 1px 9px rgba(0, 0, 0, 0.15)',
        top: '80px',
        height: 'calc(100% - 80px)',
        borderLeft: '1px solid #BBBBBB',
        left: 'auto',
        right: '0px',
    },
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Frame;
