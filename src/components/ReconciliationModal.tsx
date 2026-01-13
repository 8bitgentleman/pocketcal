import React from "react";
import InfoIcon from "./icons/InfoIcon";
import "./Modal.css";

interface ReconciliationModalProps {
	onUseLocal: () => void;
	onUseUrl: () => void;
}

const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
	onUseLocal,
	onUseUrl,
}) => {
	return (
		<div className="modal-overlay">
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<h2>
					<InfoIcon color="var(--text-primary)" width={28} height={28} /> Calendar Conflict
				</h2>

				<p className="reconciliation-description">
					You have both a saved calendar and a shared link. Which would you like to use?
				</p>

				<div className="reconciliation-options">
					<button onClick={onUseLocal} className="btn btn-primary">
						Use My Saved Calendar
					</button>
					<button onClick={onUseUrl} className="btn btn-secondary">
						Use Shared Link
					</button>
				</div>

				<p className="reconciliation-warning">
					<strong>Warning:</strong> Choosing the shared link will replace your saved calendar.
				</p>
			</div>
		</div>
	);
};

export default ReconciliationModal;
