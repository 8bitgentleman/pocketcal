import React from "react";
import { IconProps } from "./SharedProps";

const InfoIcon: React.FC<IconProps> = ({
	color = "#000",
	width = 16,
	height = 16,
}) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 24 24"
		fill="none"
		stroke={color}
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="16" x2="12" y2="12" />
		<line x1="12" y1="8" x2="12.01" y2="8" />
	</svg>
);

export default InfoIcon;
