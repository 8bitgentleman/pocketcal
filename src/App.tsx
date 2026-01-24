import { useEffect, useState } from "react";
import "./App.css";
import { useStore } from "./store";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";
import ChevronIcon from "./components/icons/ChevronIcon";
import HelpModal from "./components/HelpModal";
import LicenseModal from "./components/LicenseModal";
import WelcomeModal from "./components/WelcomeModal";
import ShareModal from "./components/ShareModal";
import ReconciliationModal from "./components/ReconciliationModal";

const WELCOME_DISMISSED_KEY = "pocketcal_welcome_dismissed";

function App() {
	const [isSidebarHidden, setIsSidebarHidden] = useState(false);
	const [showLicenseModal, setShowLicenseModal] = useState(false);
	const [showWelcomeModal, setShowWelcomeModal] = useState(false);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showReconciliationModal, setShowReconciliationModal] = useState(false);
	const getAppStateFromUrl = useStore((state) => state.getAppStateFromUrl);
	const checkInitializationState = useStore((state) => state.checkInitializationState);
	const loadFromLocalStorage = useStore((state) => state.loadFromLocalStorage);
	const loadFromUrlAndMigrate = useStore((state) => state.loadFromUrlAndMigrate);
	const showHelpModal = useStore((state) => state.showHelpModal);
	const setShowHelpModal = useStore((state) => state.setShowHelpModal);
	const validateLicenseKey = useStore((state) => state.validateLicenseKey);
	const licenseKey = useStore((state) => state.licenseKey);
	const isDarkMode = useStore((state) => state.isDarkMode);

	// Load state on initial mount - handle 4 cases
	useEffect(() => {
		const { hasLocalStorage, hasUrlHash } = checkInitializationState();

		if (hasLocalStorage && hasUrlHash) {
			// Case 1: Both exist - show reconciliation modal
			setShowReconciliationModal(true);
		} else if (hasLocalStorage && !hasUrlHash) {
			// Case 2: Only localStorage - load from it
			loadFromLocalStorage();
		} else if (!hasLocalStorage && hasUrlHash) {
			// Case 3: Only URL hash - load from URL and migrate to localStorage
			loadFromUrlAndMigrate();
		} else {
			// Case 4: Neither - use default state
			getAppStateFromUrl();
		}

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

		// Show welcome modal for first-time visitors
		const welcomeDismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
		if (!welcomeDismissed) {
			setShowWelcomeModal(true);
		}
	}, [checkInitializationState, loadFromLocalStorage, loadFromUrlAndMigrate, getAppStateFromUrl, validateLicenseKey, licenseKey]);

	// Handle dismissing the welcome modal permanently
	const handleDismissWelcome = () => {
		localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
	};

	// Allow re-opening the welcome modal (for the info button)
	const handleShowWelcome = () => {
		setShowWelcomeModal(true);
	};

	// Handle reconciliation modal choices
	const handleUseLocalStorage = () => {
		loadFromLocalStorage();
		// Clear URL hash
		window.history.replaceState(null, "", window.location.pathname + window.location.search);
		setShowReconciliationModal(false);
	};

	const handleUseUrl = () => {
		loadFromUrlAndMigrate();
		setShowReconciliationModal(false);
	};

	// Apply dark mode class to document root
	useEffect(() => {
		const root = document.documentElement;
		if (isDarkMode) {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
	}, [isDarkMode]);


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
			<Sidebar
				onShowWelcome={handleShowWelcome}
				onShowShareModal={() => setShowShareModal(true)}
			/>
			<Calendar />
			{showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
			{showLicenseModal && (
				<LicenseModal onClose={() => setShowLicenseModal(false)} />
			)}
			{showWelcomeModal && (
				<WelcomeModal
					onClose={() => setShowWelcomeModal(false)}
					onDontShowAgain={handleDismissWelcome}
				/>
			)}
			{showShareModal && (
				<ShareModal onClose={() => setShowShareModal(false)} />
			)}
			{showReconciliationModal && (
				<ReconciliationModal
					onUseLocal={handleUseLocalStorage}
					onUseUrl={handleUseUrl}
				/>
			)}
		</div>
	);
}

export default App;
