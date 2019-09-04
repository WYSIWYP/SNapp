import React from 'react';
import {Router as ReachRouter} from '@reach/router';
import Menu from './pages/Convert';
import NotFound from './pages/NotFound';
import GlobalStateProvider from './contexts/Global';
import Global from './components/global/Global';

const Router: React.FC = () => {
    return (
        <GlobalStateProvider>
            <Global />
            <ReachRouter>
                <Menu path="/" />
                <NotFound path="/*" />
            </ReachRouter>
        </GlobalStateProvider>
    );
}

export default Router;
