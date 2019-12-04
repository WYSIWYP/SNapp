import React from 'react';
import {Router as ReachRouter} from '@reach/router';
import Convert from './pages/Convert';
import NotFound from './pages/NotFound';
import GlobalStateProvider from './contexts/Global';
import Global from './components/global/Global';
import Menu from './pages/Menu';

const Router: React.FC = () => {
    return (
        <GlobalStateProvider>
            <ReachRouter>
                <Menu path="/" />
                <Convert path="/convert" />
                <NotFound path="/*" />
            </ReachRouter>
            <Global />
        </GlobalStateProvider>
    );
};

export default Router;
