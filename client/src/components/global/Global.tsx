import React from 'react';
import Dialog from './Dialog';

type Props = {
    children?: any,
};

const Global: React.FC<Props> = ({children}) => {
    //we need to use a ref here to ensure that the same reducer is always used
    let components = [Dialog] as React.FunctionComponent[];
    components.forEach(x=>{
        children = x({children});
    });
    return <>{components.map((X,i)=><X key={i}></X>)}</>;
};
export default Global;
