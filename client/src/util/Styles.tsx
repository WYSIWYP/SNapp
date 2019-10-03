import {CSSProperties} from 'react';

type RadiumStyleProp = CSSProperties | undefined | null | boolean;

export function style(styles: RadiumStyleProp | RadiumStyleProp[]): CSSProperties {
    return styles as any;
}

type StyleRules = {
    ':hover'?: React.CSSProperties;
}

export type Style = CSSProperties & StyleRules;
