import React, {useEffect, useState} from 'react';
import {RouteComponentProps} from "@reach/router";
import SNView from '../components/SNView';
import {Midi} from '@tonejs/midi';

type Props = {} & RouteComponentProps;

const Menu: React.FC<Props> = () => {
    let [midi,setMidi] = useState<undefined | Midi>(undefined);
    useEffect(()=>{
        let canceled = false;
        (async ()=>{
            //let res = await Midi.fromUrl('black_sheep_1h.mid');
            let res = await Midi.fromUrl('black_sheep.mid');
            //let res = await Midi.fromUrl('bor_ps5.mid');
            if(!canceled){
                console.log(res);
                setMidi(res);
            }
        })();
        return ()=>{canceled = true;}
    },[]);
    return (
        <>
            {midi===undefined?null:<SNView midi={midi} />}
        </>
    );
};

// const styleMap = {
//     boxes: {
//         top: '200px',
//         height: '200px',
//         display: 'flex',
//         flexWrap: 'nowrap',
//         justifyContent: 'space-evenly',
//     },
// } as const;
// const styles: Record<keyof typeof styleMap,CSSProperties> = styleMap;

export default Menu;
