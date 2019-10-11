import React from 'react';

const GlobalStateProvider: React.FC<{}> = ({children}) => {
    //we need to use a ref here to ensure that the same reducer is always used
    let stateProviders = [] as React.FunctionComponent[];
    stateProviders.forEach(x=>{
        children = x({children});
    });
    return <>{children}</>;
};
export default GlobalStateProvider;
