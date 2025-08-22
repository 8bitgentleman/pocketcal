import React from "react";
import { useStore } from "../store";
import MoonIcon from "./icons/MoonIcon";
import SunIcon from "./icons/SunIcon";

const DarkModeToggle: React.FC = () => {
	const isDarkMode = useStore((state) => state.isDarkMode);
	const setIsDarkMode = useStore((state) => state.setIsDarkMode);

	const toggleDarkMode = () => {
		setIsDarkMode(!isDarkMode);
	};

	return (
		<button
			onClick={toggleDarkMode}
			className="dark-mode-toggle"
			aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
			title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
		>
			{isDarkMode ? (
				<SunIcon width={20} height={20} color="currentColor" />
			) : (
				<MoonIcon width={20} height={20} color="currentColor" />
			)}
		</button>
	);
};

export default DarkModeToggle;