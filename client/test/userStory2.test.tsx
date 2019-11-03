import React from 'react';
import {shallow} from 'enzyme';

import Frame from '../src/components/Frame';

it('renders Frame and Router correctly ...', () => {
    let tree = shallow(<Frame header="Header Text"/>);
    expect(tree).toMatchSnapshot();

});
