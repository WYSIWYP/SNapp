import React, {createContext, useContext, useReducer, useRef} from 'react';

export const colorPreferenceStyles = {
    black: "#000000",
    grey: "#777777",
    red: "#FF0000",
    orange: "orange",
    yellow: "#FFFF00",
    green: "#00FF00",
    blue: "#0000FF",
    purple: "purple",
}
export const colorPreferenceOptions = Object.keys(colorPreferenceStyles) as (keyof typeof colorPreferenceStyles)[];
type colorPreferenceOption = keyof typeof colorPreferenceStyles;
export type state = {
    noteDurationColor: colorPreferenceOption,
    noteSymbolColor: colorPreferenceOption
};
export type action = {
    type: 'set', val: Partial<state>,
};

let initialState: state = {
    noteDurationColor: 'grey',
    noteSymbolColor: 'black',
};

export const PreferencesContext = createContext(undefined! as [state, React.Dispatch<action>]);
export const PreferencesStateProvider: React.FC<{}> = ({children}) => {
    //we need to use a ref here to ensure that the same reducer is always used
    let reducer = useRef((state: state, action: action): state => {
        switch (action.type) {
            case 'set':
                return {...state, ...action.val};
        }
    });
    let [state, dispatch] = useReducer(reducer.current, initialState);
    return (
        <PreferencesContext.Provider value={[state, dispatch]}>
            {children}
        </PreferencesContext.Provider>
    );
};
export const usePreferencesState = () => useContext(PreferencesContext);
