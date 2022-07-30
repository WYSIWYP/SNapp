import React, {createContext, useContext, useReducer, useRef} from 'react';
import MusicXML from 'musicxml-interfaces';

export type state = {
    id?: string,
    file_name?: string,
    data?: MusicXML.ScoreTimewise
};
export type action = {
    type: 'set', val: state,
};

let initialState: state = {};

type Props = {
    children?: any,
};

export const CurrentFileContext = createContext(undefined! as [state, React.Dispatch<action>]);
export const CurrentFileStateProvider: React.FC<Props> = ({children}) => {
    //we need to use a ref here to ensure that the same reducer is always used
    let reducer = useRef((state: state, action: action): state => {
        switch (action.type) {
            case 'set':
                return action.val;
        }
    });
    let [state, dispatch] = useReducer(reducer.current, initialState);
    return (
        <CurrentFileContext.Provider value={[state, dispatch]}>
            {children}
        </CurrentFileContext.Provider>
    );
};
export const useCurrentFileState = () => useContext(CurrentFileContext);
