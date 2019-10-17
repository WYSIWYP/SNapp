import React from 'react';
import {DialogStateProvider} from './Dialog';
import {CurrentFileStateProvider} from './CurrentFile';
import {PreferencesStateProvider} from './Preferences';

const GlobalStateProvider: React.FC<{}> = ({children}) => {
    //we need to use a ref here to ensure that the same reducer is always used
    let stateProviders = [DialogStateProvider, CurrentFileStateProvider, PreferencesStateProvider] as React.FunctionComponent[];
    stateProviders.forEach(x=>{
        children = x({children});
    });
    return <>{children}</>;
};
export default GlobalStateProvider;
