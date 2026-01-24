import React from 'react';

/**
 * Векторная иконка «ChevronLeft» (24×24). 
 * Scales with `em`, поэтому наследует цвет и размер от родителя.
 */
export default function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>): React.ReactElement {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path d="M15.5 19.5l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
