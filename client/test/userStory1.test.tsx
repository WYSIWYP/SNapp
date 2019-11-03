import React from 'react';
import {shallow, mount} from 'enzyme';
import sample from './sampleMusicXML';

import Frame from '../src/components/Frame';
import Router from '../src/Router';
import GlobalStateProvider from '../src/contexts/Global';
import SNView from '../src/components/SNView';

it('renders frame correctly ...', () => {
    let tree = shallow(<Frame header="Header Text" />);
    expect(tree).toMatchSnapshot();

    tree = shallow(<Router />);
    expect(tree).toMatchSnapshot();
});

it('renders SNVIEW correctly ...', () => {
    let tree = mount(
        <GlobalStateProvider>
            <SNView xml={sample as any} forcedWidth={500} />
        </GlobalStateProvider>
    );
    expect(tree).toMatchSnapshot();
});

it('renders router correctly ...', () => {
    let tree = mount(
        <Router />
    );
    expect(tree).toMatchSnapshot();
});
