import { useEffect, useState } from "react";
import "./App.css";
import { useStore } from "./store";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";
import ChevronIcon from "./components/icons/ChevronIcon";
import HelpModal from "./components/HelpModal";
import LicenseModal from "./components/LicenseModal";
import PTOSelectionModal from "./components/PTOSelectionModal";

function App() {
	const [isSidebarHidden, setIsSidebarHidden] = useState(false);
	const [showLicenseModal, setShowLicenseModal] = useState(false);
	const [showPTOModal, setShowPTOModal] = useState(false);
	const [selectedPTODate, setSelectedPTODate] = useState<string>("");
	const [selectedPTOEndDate, setSelectedPTOEndDate] = useState<string | undefined>();
	const getAppStateFromUrl = useStore((state) => state.getAppStateFromUrl);
	const generateShareableUrl = useStore((state) => state.generateShareableUrl);
	const showHelpModal = useStore((state) => state.showHelpModal);
	const setShowHelpModal = useStore((state) => state.setShowHelpModal);
	const validateLicenseKey = useStore((state) => state.validateLicenseKey);
	const licenseKey = useStore((state) => state.licenseKey);
	const getSelectedGroupPTOConfig = useStore((state) => state.getSelectedGroupPTOConfig);

	// Select individual state pieces needed for the URL
	const startDate = useStore((state) => state.startDate);
	const includeWeekends = useStore((state) => state.includeWeekends);
	const showToday = useStore((state) => state.showToday);
	const eventGroups = useStore((state) => state.eventGroups);

	// Load state from URL on initial mount
	useEffect(() => {
		getAppStateFromUrl();

		// Check license validity on load (with cache)
		if (licenseKey) {
			const lastValidated = localStorage.getItem("pocketcal_pro_validated");
			const daysSinceValidation = lastValidated
				? (Date.now() - parseInt(lastValidated)) / (1000 * 60 * 60 * 24)
				: Infinity;
			// Re-validate every 7 days
			if (daysSinceValidation > 7) {
				validateLicenseKey(licenseKey);
			} else {
				useStore.setState({ isProUser: true });
			}
		}
	}, [getAppStateFromUrl, validateLicenseKey, licenseKey]);

	// Handle PTO date selection from Calendar
	const handlePTODateSelection = (dateStr: string, endDateStr?: string) => {
		const ptoConfig = getSelectedGroupPTOConfig();
		if (ptoConfig?.isEnabled) {
			setSelectedPTODate(dateStr);
			setSelectedPTOEndDate(endDateStr);
			setShowPTOModal(true);
		}
	};

	// Set up global PTO date selection handler
	useEffect(() => {
		const handlePTODateSelect = (event: CustomEvent) => {
			handlePTODateSelection(event.detail.date, event.detail.endDate);
		};

		window.addEventListener('ptoDateSelect' as any, handlePTODateSelect);
		return () => window.removeEventListener('ptoDateSelect' as any, handlePTODateSelect);
	}, [getSelectedGroupPTOConfig]);

	// Update URL whenever relevant state pieces change
	useEffect(() => {
		const newUrl = generateShareableUrl();
		window.history.replaceState(null, "", newUrl);
	}, [
		startDate,
		includeWeekends,
		showToday,
		eventGroups,
		generateShareableUrl,
	]);

	const toggleSidebar = () => {
		const sidebar = document.querySelector(".sidebar");

		if (!isSidebarHidden && sidebar) {
			sidebar.scrollTop = 0;
			sidebar.scrollTo({ top: 0, behavior: "smooth" });

			setTimeout(() => {
				setIsSidebarHidden(true);
			}, 300);
		} else {
			setIsSidebarHidden(false);
		}
	};

	return (
		<div className={`app-container ${isSidebarHidden ? "sidebar-hidden" : ""}`}>
			<button
				className="sidebar-toggle"
				onClick={toggleSidebar}
				aria-label={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
				aria-expanded={!isSidebarHidden}
			>
				<ChevronIcon color="black" />
			</button>
			<Sidebar setShowLicenseModal={setShowLicenseModal} />
			<Calendar />
			{showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
			{showLicenseModal && (
				<LicenseModal onClose={() => setShowLicenseModal(false)} />
			)}
			{showPTOModal && selectedPTODate && (
				<PTOSelectionModal 
					selectedDate={selectedPTODate}
					initialEndDate={selectedPTOEndDate}
					onClose={() => {
						setShowPTOModal(false);
						setSelectedPTODate("");
						setSelectedPTOEndDate(undefined);
					}} 
				/>
			)}
		</div>
	);
}

export default App;
