import React, { useState } from "react";
import XIcon from "./icons/XIcon";
// Import your new icons here:
import CalendarIcon from "./icons/CalendarIcon";
import UsersIcon from "./icons/UsersIcon";
import SunIcon from "./icons/SunIcon";
import SettingsIcon from "./icons/SettingsIcon";
import LinkIcon from "./icons/LinkIcon";

import "./Modal.css";
import "./WelcomeModal.css";

interface WelcomeModalProps {
    onClose: () => void;
    onDontShowAgain: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onDontShowAgain }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Unispace Calendar",
            icon: <CalendarIcon width={48} height={48} color="var(--text-primary)" />,
            content: (
                <>
                    <p>Plan and visualize your time for the entire year at a glance.</p>
                    <ul>
                        <li>Create calendars for projects, travel, or PTO tracking</li>
                        <li>Track vacation days, personal time, and sick leave</li>
                        <li>Share your calendar with your team via URL</li>
                    </ul>
                </>
            ),
        },
        {
            title: "Creating Calendars",
            icon: <UsersIcon width={48} height={48} color="var(--text-primary)" />,
            content: (
                <>
                    <p><strong>People/Teams</strong> are individual calendars.</p>
                    <ul>
                        <li>Click the <strong>+</strong> button to add a new calendar</li>
                        <li>Each calendar has its own color for easy identification</li>
                        <li>Use as regular calendars OR enable PTO tracking in settings</li>
                    </ul>
                </>
            ),
        },
        {
            title: "Using Regular Calendars",
            icon: <CalendarIcon width={48} height={48} color="var(--text-primary)" />,
            content: (
                <>
                    <p>Mark dates and date ranges on regular calendars:</p>
                    <ul>
                        <li><strong>Short click</strong> on empty date → adds that day</li>
                        <li><strong>Short click</strong> on existing date → opens editor</li>
                        <li><strong>Long press</strong> (500ms) → select multi-day range</li>
                        <li>Add optional descriptions that appear on hover</li>
                    </ul>
                </>
            ),
        },
        {
            title: "Using PTO Calendars",
            icon: <SunIcon width={48} height={48} color="var(--text-primary)" />,
            content: (
                <>
                    <p>Once PTO is enabled, click on any weekday to log time off:</p>
                    <ul>
                        <li><strong>Short click</strong> toggles full day (8h) PTO on/off</li>
                        <li><strong>Long press</strong> (500ms) opens modal for custom hours</li>
                        <li>Choose between full day (8h), half day (4h), or quarter day (2h)</li>
                    </ul>
                </>
            ),
        },
        {
            title: "Understanding PTO Settings",
            icon: <SettingsIcon width={48} height={48} color="var(--text-primary)" />,
            content: (
                <>
                    <p>Configure your PTO allowance in the sidebar:</p>
                    <ul>
                        <li><strong>Years of Service:</strong> Determines annual allowance.</li>
                        <li><strong>Rollover Hours:</strong> Hours carried over from last year.</li>
                    </ul>
                </>
            ),
        },
        {
            title: "Sharing & Saving",
            icon: <LinkIcon width={48} height={48} color="var(--text-primary)" />,
            content: (
                <>
                    <p>Your calendar is automatically saved locally in your browser.</p>
                    <ul>
                        <li>Click <strong>Share</strong> to generate a shareable link</li>
                        <li>Shared links are snapshots - changes won't affect them</li>
                        <li>Your data persists between sessions automatically</li>
                    </ul>
                    <p className="tip"><strong>Tip:</strong> Hover over buttons to see tooltips.</p>
                </>
            ),
        },
    ];

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			onClose();
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleDontShowAgain = () => {
		onDontShowAgain();
		onClose();
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content welcome-modal" onClick={(e) => e.stopPropagation()}>
				<button
					className="modal-close"
					onClick={onClose}
					aria-label="Close welcome modal"
				>
					<XIcon color="var(--text-secondary)" />
				</button>

				<div className="welcome-step">
					<div className="welcome-icon">{steps[currentStep].icon}</div>
					<h2>{steps[currentStep].title}</h2>
					<div className="welcome-content">
						{steps[currentStep].content}
					</div>
				</div>

				<div className="welcome-navigation">
					<div className="step-indicators">
						{steps.map((_, index) => (
							<button
								key={index}
								className={`step-dot ${index === currentStep ? "active" : ""}`}
								onClick={() => setCurrentStep(index)}
								aria-label={`Go to step ${index + 1}`}
							/>
						))}
					</div>

					<div className="welcome-buttons">
						{currentStep > 0 && (
							<button className="welcome-btn secondary" onClick={handlePrev}>
								Back
							</button>
						)}
						<button className="welcome-btn primary" onClick={handleNext}>
							{currentStep === steps.length - 1 ? "Get Started" : "Next"}
						</button>
					</div>
				</div>

				<div className="welcome-footer">
					<button className="dont-show-btn" onClick={handleDontShowAgain}>
						Don't show this again
					</button>
				</div>
			</div>
		</div>
	);
};

export default WelcomeModal;
