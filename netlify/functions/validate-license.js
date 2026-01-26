function getAllowedOrigin(origin) {
	if (!origin) return null;
	if (origin.endsWith("unispace-pto-calendar.netlify.app")) return origin;
	if (
		origin.startsWith("http://localhost") ||
		origin.startsWith("https://localhost")
	)
		return origin;
	return null;
}

exports.handler = async function (event) {
	const origin = event.headers.origin || event.headers.Origin;
	const allowedOrigin = getAllowedOrigin(origin);

	if (event.httpMethod !== "POST") {
		return {
			statusCode: 405,
			headers: allowedOrigin
				? {
						"Access-Control-Allow-Origin": allowedOrigin,
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
				  }
				: {},
			body: "Method Not Allowed",
		};
	}

	try {
		const { licenseKey, action, instanceName } = JSON.parse(event.body);
		if (!licenseKey) {
			return {
				statusCode: 200,
				headers: allowedOrigin
					? { "Access-Control-Allow-Origin": allowedOrigin }
					: {},
				body: JSON.stringify({ valid: false }),
			};
		}

		let apiUrl, apiBody;
		if (action === "activate") {
			apiUrl = "https://api.lemonsqueezy.com/v1/licenses/activate";
			apiBody = {
				license_key: licenseKey,
				instance_name: instanceName || "pocketcal-web",
				product_id: process.env.LEMON_SQUEEZY_PRODUCT_ID,
			};
		} else {
			apiUrl = "https://api.lemonsqueezy.com/v1/licenses/validate";
			apiBody = {
				license_key: licenseKey,
				product_id: process.env.LEMON_SQUEEZY_PRODUCT_ID,
			};
		}

		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
			},
			body: JSON.stringify(apiBody),
		});

		const data = await response.json();
		return {
			statusCode: 200,
			headers: allowedOrigin
				? { "Access-Control-Allow-Origin": allowedOrigin }
				: {},
			body: JSON.stringify(data),
		};
	} catch (error) {
		return {
			statusCode: 200,
			headers: allowedOrigin
				? { "Access-Control-Allow-Origin": allowedOrigin }
				: {},
			body: JSON.stringify({ valid: false, error: error.message }),
		};
	}
};
