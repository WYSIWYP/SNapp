import React, {createContext, useContext, useReducer, useRef} from 'react';

export type state = {
    shown: boolean,
    data?: {
        title: string,
        contents: any,
        width: number,
        height: number,
    }
};
export type action = {
    type: 'open', val: state['data'],
} | {
    type: 'close',
};

let initialState: state = {
    shown: false,
};

export const DialogContext = createContext(undefined! as [state, React.Dispatch<action>]);
export const DialogStateProvider: React.FC<{}> = ({children}) => {
    //we need to use a ref here to ensure that the same reducer is always used
    let reducer = useRef((state: state, action: action): state => {
        switch (action.type) {
            case 'open':
                return {
                    shown: true,
                    data: action.val,
                };
            case 'close':
                return {shown: false};
        }
    });
    let [state, dispatch] = useReducer(reducer.current, initialState);
    return (
        <DialogContext.Provider value={[state, dispatch]}>
            {children}
        </DialogContext.Provider>
    );
};
export const useDialogState = () => useContext(DialogContext);
