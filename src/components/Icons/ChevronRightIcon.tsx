import React from 'react';

/**
 * Векторная иконка «ChevronRight» (24×24). 
 * Scales with `em`, поэтому наследует цвет и размер от родителя.
 */
export default function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path d="M8.5 4.5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
