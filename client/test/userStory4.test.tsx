import React from 'react';
import {shallow} from 'enzyme';

import {PreferencesStateProvider} from '../src/contexts/Preferences';
import NotFound from '../src/pages/NotFound';

it('renders PreferencesStateProvider and Router correctly', () => {
    let tree = shallow(<PreferencesStateProvider />);
    expect(tree).toMatchSnapshot();
});



it('renders not found page correctly ', () => {
    let tree = shallow(<NotFound />);
    expect(tree).toMatchSnapshot();
});

