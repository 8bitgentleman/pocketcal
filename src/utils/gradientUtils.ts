/**
 * Gradient utilities for creating dynamic color gradients
 *
 * This file contains the logic for generating gradients from calendar colors.
 * Tweak the values here to adjust gradient appearance across the entire app.
 */

export interface GradientConfig {
	/** Angle of the gradient in degrees (e.g., 135 for diagonal top-left to bottom-right) */
	angle: number;
	/** How much lighter the second color should be (0-1, where 0.3 = 30% lighter) */
	lightenAmount: number;
}

/** Default gradient configuration - adjust these to change all gradients */
export const DEFAULT_GRADIENT_CONFIG: GradientConfig = {
	angle: 135,           // 135° diagonal gradient (like the mockup)
	lightenAmount: 0.3,   // 30% lighter for the second color
};

/**
 * Creates a CSS gradient string from a base hex color
 *
 * @param baseColor - Hex color string (e.g., "#ff6b35" or "ff6b35")
 * @param config - Optional gradient configuration (uses defaults if not provided)
 * @returns CSS gradient string (e.g., "linear-gradient(135deg, rgb(...), rgb(...))")
 *
 * @example
 * ```ts
 * createGradientFromColor("#ff6b35")
 * // Returns: "linear-gradient(135deg, rgb(255, 107, 53), rgb(255, 156, 127))"
 * ```
 */
export function createGradientFromColor(
	baseColor: string,
	config: GradientConfig = DEFAULT_GRADIENT_CONFIG
): string {
	// Parse the hex color to RGB
	const hex = baseColor.replace('#', '');
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	// Create a lighter/brighter version by moving toward white
	// Formula: newColor = baseColor + (255 - baseColor) * lightenAmount
	const r2 = Math.min(255, Math.floor(r + (255 - r) * config.lightenAmount));
	const g2 = Math.min(255, Math.floor(g + (255 - g) * config.lightenAmount));
	const b2 = Math.min(255, Math.floor(b + (255 - b) * config.lightenAmount));

	// Create gradient from original to lighter version
	return `linear-gradient(${config.angle}deg, rgb(${r}, ${g}, ${b}), rgb(${r2}, ${g2}, ${b2}))`;
}

/**
 * Alternative gradient styles you can try:
 *
 * For a more subtle gradient:
 * { angle: 135, lightenAmount: 0.15 }
 *
 * For a more dramatic gradient:
 * { angle: 135, lightenAmount: 0.5 }
 *
 * For a vertical gradient:
 * { angle: 180, lightenAmount: 0.3 }
 *
 * For a horizontal gradient:
 * { angle: 90, lightenAmount: 0.3 }
 */
