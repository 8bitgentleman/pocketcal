import React from "react";
import XIcon from "./icons/XIcon";
import { MAX_GROUPS } from "../store";
import "./Modal.css";

interface HelpModalProps {
	onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<button
					className="modal-close"
					onClick={onClose}
					aria-label="Close instructions"
				>
					<XIcon color="var(--text-secondary)" />
				</button>
				<h2>
					Unispace PTO Calculator Instructions
				</h2>
				<div className="instructions-content">
					<h3>Features</h3>
					<ul>
						<li>
							Create up to {MAX_GROUPS} event groups with different colors
						</li>
						<li>Your data is saved automatically in your browser</li>
						<li>Generate shareable snapshot links that won't change when you update your calendar</li>
					</ul>
					<h3>Navigation</h3>
					<ul>
						<li>
							<strong>Quick click</strong> on any date to toggle full-day (8h) PTO
						</li>
						<li>
							<strong>Long press</strong> (hold 500ms) to open modal for custom hours
						</li>
						<li>
							<strong>Arrow keys</strong> to move between dates when calendar is
							focused
						</li>
						<li>
							<strong>Enter</strong> or <strong>Space</strong> to toggle the
							selected date
						</li>
					</ul>
					<h3>About</h3>
					<p className="footer">
						Unispace PTO Calculator is built by <span style={{ color: "var(--cyan)", fontWeight: "bold" }}>Matt Vogel and cassidoo</span>{" "}
						and is open source on{" "}
						<a href="https://github.com/8bitgentleman/pocketcal">GitHub</a>.
					</p>
				</div>
			</div>
		</div>
	);
};

export default HelpModal;
