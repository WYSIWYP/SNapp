import React, {createContext, useContext, useReducer, useRef} from "react";

export const colorPreferenceStyles = {
    black: "#000000",
    grey: "#777777",
    red: "#FF0000",
    orange: "orange",
    yellow: "#FFFF00",
    green: "#00FF00",
    blue: "#0000FF",
    purple: "purple"
};
export const colorPreferenceOptions = Object.keys(
    colorPreferenceStyles
) as (keyof typeof colorPreferenceStyles)[];
export type colorPreferenceOption = (typeof colorPreferenceOptions)[number];

export const scalePreferenceOptions = ['small', 'medium', 'large'] as const;
export type scalePreferenceOption = (typeof scalePreferenceOptions)[number];

export const spacingPreferenceOptions = ['narrow', 'moderate', 'wide'] as const;
export type spacingPreferenceOption = (typeof spacingPreferenceOptions)[number];

export const noteHeadPreferenceOptions = ["▲", "▼", "●", "○", "⨂","◼", "□"] as const;
export type noteHeadPreferenceOption = (typeof noteHeadPreferenceOptions)[number];

export const measuresPerRowOptions = [1, 2, 3, 4, 5, 6] as const; // TODO: Consider using a slider
export type measuresPerRowOption = (typeof measuresPerRowOptions)[number];

export const accidentalTypeOptions = ['auto', 'sharp', 'flat'] as const;
export type accidentalTypeOption = (typeof accidentalTypeOptions)[number];

export type state = {
    noteDurationColor: colorPreferenceOption;
    noteSymbolColor: colorPreferenceOption;
    staffScale: scalePreferenceOption;
    horizontalSpacing: spacingPreferenceOption;
    verticalSpacing: spacingPreferenceOption;
    noteScale: scalePreferenceOption;
    naturalNoteShape: noteHeadPreferenceOption,
    sharpNoteShape: noteHeadPreferenceOption;
    flatNoteShape: noteHeadPreferenceOption;
    measuresPerRow: measuresPerRowOption;
    accidentalType: accidentalTypeOption
};
export type action = {
    type: "set";
    val: Partial<state>;
};

let initialState: state = {
    noteDurationColor: "grey",
    noteSymbolColor: "black",
    staffScale: 'medium',
    horizontalSpacing: 'moderate',
    verticalSpacing: 'moderate',
    noteScale: 'medium',
    naturalNoteShape: '●',
    sharpNoteShape: '▲',
    flatNoteShape: '▼',
    measuresPerRow: 4,
    accidentalType: 'auto'
};

export const PreferencesContext = createContext(undefined! as [
    state,
    React.Dispatch<action>
]);
export const PreferencesStateProvider: React.FC<{}> = ({children}) => {
    //we need to use a ref here to ensure that the same reducer is always used
    let reducer = useRef(
        (state: state, action: action): state => {
            switch (action.type) {
                case "set":
                    return {...state, ...action.val};
            }
        }
    );
    let [state, dispatch] = useReducer(reducer.current, initialState);
    return (
        <PreferencesContext.Provider value={[state, dispatch]}>
            {children}
        </PreferencesContext.Provider>
    );
};
export const usePreferencesState = () => useContext(PreferencesContext);
