import React from 'react';
import {shallow, mount} from 'enzyme';

import GlobalStateProvider from '../src/contexts/Global';
import Menu from '../src/pages/Menu';
import Convert from '../src/pages/Convert';

it('renders Menu correctly...', () => {
    let tree = mount(
        <GlobalStateProvider>
            <Menu />
        </GlobalStateProvider>
    );
    expect(tree).toMatchSnapshot();
});

it('renders convert page correctly ...', () => {
    let tree = mount(
        <GlobalStateProvider>
            <Convert />
        </GlobalStateProvider>
    );
    expect(tree).toMatchSnapshot();
});

it('clicking buttons on convert page work correctly ...', () => {
    let tree = mount(
        <GlobalStateProvider>
            <Convert />
        </GlobalStateProvider>
    );
    expect(tree.find('#preference').simulate('click').length).toEqual(1);
    //expect(tree.find('#snview').simulate('click').length).toEqual(1);
    expect(tree.find('#home').simulate('click').length).toEqual(1);
    expect(tree.find('#close').simulate('click').length).toEqual(1);
});
