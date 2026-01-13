import React from "react";
import { IconProps } from "./SharedProps";

const CalendarIcon: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    color = "currentColor",
}) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Main body of the calendar */}
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            
            {/* Top vertical markers (the "rings") */}
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            
            {/* Horizontal divider line */}
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
};

export default CalendarIcon;