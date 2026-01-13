/**
 * Advanced Gradient utilities for Unispace-style dynamic colors.
 *
 * Instead of just lightening a color, this utility shifts the HUE and
 * adjusts SATURATION/LIGHTNESS to create professional, vibrant gradients
 * that match the high-contrast design mockup.
 */

export interface GradientConfig {
	/** Angle of the gradient in degrees */
	angle: number;
	/** Degrees to rotate the hue (e.g., 20-40 creates a vibrant shift) */
	hueShift: number;
	/** Multiplier for saturation in the second color (1.2 = 20% more saturated) */
	saturationBoost: number;
	/** Amount to adjust lightness of the second color (positive or negative) */
	lightnessShift: number;
}

/**
 * Unispace Default Config
 * Designed to create that "Cyan-to-Purple" or "Orange-to-Pink" energy
 */
export const DEFAULT_GRADIENT_CONFIG: GradientConfig = {
	angle: 135,
	hueShift: -35,        // Shifts color along the wheel for depth
	saturationBoost: 1.1, // Keeps colors from looking gray
	lightnessShift: 10,   // Slight lift for the end-point
};

/**
 * Converts Hex to HSL for better mathematical manipulation of color
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
	// Remove # if present and validate
	const cleanHex = hex.replace('#', '');
	if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
		console.warn(`Invalid hex color: ${hex}, using fallback`);
		return { h: 0, s: 0, l: 50 };
	}

	const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
	const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
	const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h = 0, s, l = (max + min) / 2;

	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}
	return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Creates a CSS gradient string from a base hex color using HSL manipulation.
 *
 * @param baseColor - Hex color string (e.g., "#eb4888")
 * @param config - Optional configuration for the "energy" of the shift
 * @returns CSS gradient string using HSL colors
 *
 * @example
 * ```ts
 * createGradientFromColor("#ff6b35")
 * // Returns: "linear-gradient(135deg, hsl(...), hsl(...))"
 * ```
 */
export function createGradientFromColor(
	baseColor: string,
	config: GradientConfig = DEFAULT_GRADIENT_CONFIG
): string {
	if (!baseColor.startsWith('#')) baseColor = `#${baseColor}`;

	const start = hexToHsl(baseColor);

	// Calculate end color by shifting Hue, Saturation, and Lightness
	const endH = (start.h + config.hueShift + 360) % 360;
	const endS = Math.min(100, start.s * config.saturationBoost);
	const endL = Math.min(95, Math.max(5, start.l + config.lightnessShift));

	const startStyle = `hsl(${Math.round(start.h)}, ${Math.round(start.s)}%, ${Math.round(start.l)}%)`;
	const endStyle = `hsl(${Math.round(endH)}, ${Math.round(endS)}%, ${Math.round(endL)}%)`;

	return `linear-gradient(${config.angle}deg, ${startStyle}, ${endStyle})`;
}

/**
 * Specifically for the "PTO" and "CTA" style in the mockup which often
 * uses the primary Unispace brand colors.
 */
export const UNISPACE_BRAND_GRADIENTS = {
	primary: createGradientFromColor("#00d4ff", {
		angle: 135,
		hueShift: 45,
		saturationBoost: 1.0,
		lightnessShift: 0
	}),
	cta: "linear-gradient(135deg, #00d4ff, #8b5cf6, #ff6b35)",
	button: createGradientFromColor("#ff6b35", {
		angle: 135,
		hueShift: -20,
		saturationBoost: 1.05,
		lightnessShift: 5
	}),
	// Hardcoded mapping for GROUP_COLORS to ensure they look perfect
	green: createGradientFromColor("#24d05a", {
		...DEFAULT_GRADIENT_CONFIG,
		hueShift: 40
	}),
	blue: createGradientFromColor("#10a2f5", {
		...DEFAULT_GRADIENT_CONFIG,
		hueShift: -40
	}),
};
