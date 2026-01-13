import React, { useState, useEffect } from "react";
import XIcon from "./icons/XIcon";
import CopyIcon from "./icons/CopyIcon";
import ShareIcon from "./icons/ShareIcon";
import { useStore } from "../store";
import "./Modal.css";

interface ShareModalProps {
	onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ onClose }) => {
	const { generateShareableUrl } = useStore();
	const [shareUrl, setShareUrl] = useState("");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		// Generate shareable URL when modal opens
		const url = generateShareableUrl();
		setShareUrl(url);
	}, [generateShareableUrl]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<button
					className="modal-close"
					onClick={onClose}
					aria-label="Close share modal"
				>
					<XIcon color="var(--text-secondary)" />
				</button>
				<h2>
					<ShareIcon color="var(--text-primary)" width={28} height={28} /> Share Calendar
				</h2>

				<p className="share-description">
					This is a <strong>snapshot</strong> of your calendar at this moment. Changes you make after sharing won't affect this link.
				</p>

				<div className="share-url-container">
					<input
						type="text"
						value={shareUrl}
						readOnly
						className="share-url-input"
						onClick={(e) => e.currentTarget.select()}
					/>
					<button
						onClick={handleCopy}
						className="btn"
						aria-label="Copy to clipboard"
					>
						<CopyIcon width={18} height={18} />
						{copied ? "Copied!" : "Copy"}
					</button>
				</div>

				<p className="share-note">
					Recipients will see a frozen copy of your calendar, not live edits.
				</p>
			</div>
		</div>
	);
};

export default ShareModal;
