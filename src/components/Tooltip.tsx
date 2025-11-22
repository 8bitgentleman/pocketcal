import React from "react";
import "./WelcomeModal.css"; // Tooltip styles are in here

interface TooltipProps {
	content: string;
	children: React.ReactNode;
	position?: "top" | "right" | "left";
}

/**
 * Tooltip component that shows explanatory text on hover.
 * Use this to explain settings and concepts to non-technical users.
 */
const Tooltip: React.FC<TooltipProps> = ({ content, children, position = "top" }) => {
	const positionClass = position !== "top" ? `tooltip-${position}` : "";

	return (
		<span className="tooltip-wrapper">
			<span className="tooltip-trigger">{children}</span>
			<span className={`tooltip-content ${positionClass}`}>{content}</span>
		</span>
	);
};

export default Tooltip;
