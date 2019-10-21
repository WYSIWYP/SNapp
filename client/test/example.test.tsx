import React from 'react';
import {shallow} from 'enzyme';

import Frame from '../src/components/Frame';
import Router from '../src/Router';

it('renders correctly ...', () => {
    let tree = shallow(<Frame header="Header Text"/>);
    expect(tree).toMatchSnapshot();

    tree = shallow(<Router/>);
    expect(tree).toMatchSnapshot();

});
