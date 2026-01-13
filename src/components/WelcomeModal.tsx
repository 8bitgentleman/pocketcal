import React, { useState } from "react";
import XIcon from "./icons/XIcon";
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
			icon: "📅",
			content: (
				<>
					<p>
						Plan and visualize your PTO (Paid Time Off) for the entire year at a glance.
					</p>
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
			icon: "👥",
			content: (
				<>
					<p>
						<strong>People/Teams</strong> are individual calendars. Each person or team gets their own PTO settings and calendar.
					</p>
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
			icon: "🏝️",
			content: (
				<>
					<p>
						Once PTO is enabled for a calendar, click or drag on any weekday to log time off.
					</p>
					<ul>
						<li><strong>Click</strong> a date to log a single day</li>
						<li><strong>Drag</strong> across dates to select multiple days</li>
						<li>Choose between full day (8h), half day (4h), or quarter day (2h)</li>
						<li>Weekends are automatically excluded from PTO</li>
					</ul>
				</>
			),
		},
		{
			title: "Understanding PTO Settings",
			icon: "⚙️",
			content: (
				<>
					<p>Configure your PTO allowance in the sidebar:</p>
					<ul>
						<li>
							<strong>Years of Service:</strong> How long you've worked at the company.
							This determines your annual PTO allowance (21 days for {"<"}5 years, 26 days for 5+ years).
						</li>
						<li>
							<strong>Rollover Hours:</strong> Unused PTO hours carried over from the previous year.
						</li>
					</ul>
				</>
			),
		},
		{
			title: "Sharing & Saving",
			icon: "🔗",
			content: (
				<>
					<p>
						Your calendar data is automatically saved in the URL. No account required!
					</p>
					<ul>
						<li>Click <strong>Copy URL</strong> to share your calendar</li>
						<li>Bookmark the URL to save your calendar for later</li>
						<li>Anyone with the URL can view (and edit) the calendar</li>
					</ul>
					<p className="tip">
						<strong>Tip:</strong> Hover over any setting or button to see helpful tooltips.
					</p>
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
