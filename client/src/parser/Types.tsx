/**
 * This file contains types shared across all parsers.
 */

// Track and staff types
export type TrackType = 'Instrument' | 'Lyrics'; // part types that app currently handles
export type StaffType = 'treble' | 'bass';

// Directions
const dynamicsArray = ['f', 'ff', 'fff', 'ffff', 'ffff', 'ffffff', 'fp', 'fz', 'mf', 'mp', 'p', 'pp', 'ppp', 'pppp', 'ppppp', 'pppppp', 'rf', 'rfz', 'sf', 'sffz', 'sfp', 'sfpp', 'sfz'] as const;
export type Dynamics = (typeof dynamicsArray)[number];
export let isDynamics = ((str: string): str is Dynamics => dynamicsArray.some(dynamic => dynamic === str));

export type Pedal = 'pedalStart' | 'pedalEnd';

export type Direction = {
    dynamics?: Dynamics,
    pedal?: Pedal,
    time: number
}; // Directions are used for expression marks that are not clearly tied to a particular note.
export type Directions = Direction[];

// Note attributes
export enum Tie {
    Start = "START",
    Stop = "STOP",
}

export type Slur = 'start' | 'end';

// Note
export type Note = {
    time: number,
    duration: number,
    midi: number,
    fingering: string,
    setFingering: (x: number)=>void,
    staff: StaffType,
    attributes: {
        ties: Tie[],
        slur?: Slur,
        lyrics?: string
    }
};
export type Notes = Note[]; // note: each part should have 1 staff or 2 staves (for piano)

// Signatures
export type TimeSignature = {
    measure: number,
    beats: number,
    beatTypes: number,
};

export type KeySignature = {
    measure: number,
    fifths: number
};

export type Track = {
    measures: Notes[],
    directions: Directions[]
    timeSignatures: TimeSignature[],
    keySignatures: KeySignature[],
    trackTypes: TrackType[] // we use an array here because a track might contain both lyrics and piano part.
};

export type Tracks = Track[];

export type Score = {
    tracks: Tracks,
    tempo?: number
};
