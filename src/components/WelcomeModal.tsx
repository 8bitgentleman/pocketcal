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
            title: "Welcome to Unispace PTO Calculator",
            icon: <CalendarIcon width={48} height={48} color="var(--text-primary)" />,
            content: (
                <>
                    <p>Plan and visualize your PTO for the entire year at a glance.</p>
                    <ul>
                        <li>Track vacation days, personal time, and sick leave</li>
                        <li>See your remaining PTO balance in real-time</li>
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
                        <li>Enable PTO tracking per calendar in the settings below</li>
                    </ul>
                </>
            ),
        },
        {
            title: "Logging PTO",
            icon: <SunIcon width={48} height={48} color="var(--text-primary)" />,
            content: (
                <>
                    <p>Once PTO is enabled, click or drag on any weekday to log time off.</p>
                    <ul>
                        <li><strong>Click</strong> a date to log a single day</li>
                        <li><strong>Drag</strong> across dates to select multiple days</li>
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
                    <p>Your calendar data is automatically saved in the URL.</p>
                    <ul>
                        <li>Click <strong>Copy URL</strong> to share your calendar</li>
                        <li>Bookmark the URL to save your calendar for later</li>
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
