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

export const naturalNoteHeadPreferenceOptions = ["●", "○"] as const; 
export type naturalNoteHeadPreferenceOption = (typeof naturalNoteHeadPreferenceOptions)[number];

export const sharpNoteHeadPreferenceOptions = ["▲", "△", "#"] as const;
export type sharpNoteHeadPreferenceOption = (typeof sharpNoteHeadPreferenceOptions)[number];

export const flatNoteHeadPreferenceOptions = ["▼", "▽", "b"] as const; 
export type flatNoteHeadPreferenceOption = (typeof flatNoteHeadPreferenceOptions)[number];

export const clefPreferenceOptions = ["WYSIWYP","Traditional"] as const;
export type clefPreferenceOptions = (typeof clefPreferenceOptions)[number];

export const measuresPerRowOptions = [1, 2, 3, 4, 5, 6, 7, 8] as const; // TODO: Consider using a slider  // 21 June 2021 increase to 8
export type measuresPerRowOption = (typeof measuresPerRowOptions)[number];

export const accidentalTypeOptions = ['auto', 'sharps', 'flats'] as const;
export type accidentalTypeOption = (typeof accidentalTypeOptions)[number];

export const lyricsFontSizeOptions = ['small', 'medium', 'large'] as const;
export type lyricsFontSizeOption = (typeof lyricsFontSizeOptions)[number];

export type state = {
    noteDurationColor: colorPreferenceOption;
    noteSymbolColor: colorPreferenceOption;
    staffScale: scalePreferenceOption;
    horizontalSpacing: spacingPreferenceOption;
    verticalSpacing: spacingPreferenceOption;
    noteScale: scalePreferenceOption;
    naturalNoteShape: naturalNoteHeadPreferenceOption,
    sharpNoteShape: sharpNoteHeadPreferenceOption;
    flatNoteShape: flatNoteHeadPreferenceOption;
    clefSymbols: clefPreferenceOptions;
    measuresPerRow: measuresPerRowOption;
    accidentalType: accidentalTypeOption;
    lyricsFontSize: lyricsFontSizeOption
};
export type action = {
    type: "set";
    val: Partial<state>;
};

let initialState: state = {
    noteDurationColor: "grey",
    noteSymbolColor: "black",
    staffScale: 'medium',
    horizontalSpacing: 'narrow',  // 21 June 2021  changed from medium
    verticalSpacing: 'narrow',    // 21 June 2021  changed from medium
    noteScale: 'medium',
    naturalNoteShape: '●',
    sharpNoteShape: '▲',
    flatNoteShape: '▼',
    clefSymbols: 'WYSIWYP',
    measuresPerRow: 4,
    accidentalType: 'auto',
    lyricsFontSize: 'small'
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
