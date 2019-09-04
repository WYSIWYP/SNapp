import React from 'react';

const Global: React.FC<{}> = ({children}) => {
    //we need to use a ref here to ensure that the same reducer is always used
    let components = [] as React.FunctionComponent[];
    components.forEach(x=>{
        children = x({children});
    });
    return <>{components.map((X,i)=><X key={i}></X>)}</>;
};
export default Global;
