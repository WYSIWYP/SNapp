/**
 * This file contains types used for the MusicXML parser.
 */

// Track and staff types
export type TrackType = 'instrument' | 'lyrics'; // part types that app currently handles
export type StaffType = 'treble' | 'bass';

// Directions
const dynamicsArray = ['f', 'ff', 'fff', 'ffff', 'ffff', 'ffffff', 'fp', 'fz', 'mf', 'mp', 'p', 'pp', 'ppp', 'pppp', 'ppppp', 'pppppp', 'rf', 'rfz', 'sf', 'sffz', 'sfp', 'sfpp', 'sfz'] as const;
export type Dynamics = (typeof dynamicsArray)[number];
export let isDynamics = ((str: string): str is Dynamics => dynamicsArray.some(dynamic => dynamic === str));

export type Pedal = 'start' | 'end';

export type Wedge = 'crescendo' | 'diminuendo' | 'stop';

export type Direction = {
    dynamics?: Dynamics,
    pedal?: Pedal,
    wedge?: Wedge,
    time: number
}; // Directions are used for expression marks that are not tied to a particular note.

export type Directions = Direction[];

// Note attributes
export type Tie = 'start' | 'end';

export type Slur = 'start' | 'end';

// Notes
export type Note = {
    time: number,
    duration: number,
    midi: number,
    fingering: string,
    setFingering: (x: number) => void,
    staff: StaffType,
    attributes: {
        tie?: Tie,
        slur?: Slur,
        lyrics?: string
    }
};
export type Notes = Note[];

// Signatures
export type TimeSignature = {
    measure: number,
    beats: number,
    beatTypes: number,
};

export type KeySignature = {
    measure: number,
    fifths: number,
    mode: any
};

// Tracks and scores
export type Track = {
    measures: Notes[],
    directions: Directions[]
    timeSignatures: TimeSignature[],
    keySignatures: KeySignature[],
    trackTypes: TrackType[], // we use an array here because a track might contain both lyrics and piano part.
    bassStaffOnly?: boolean // whether the piece only has a bass staff
};

export type Tracks = Track[];

export type Score = {
    tracks: Tracks,
    tempo?: number
};
