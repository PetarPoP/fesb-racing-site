import { bindings, defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "fesb-racing-cms",
		compatibilityDate: "2025-08-15",
		compatibilityFlags: [
			"nodejs_compat",
			"global_fetch_strictly_public",
		],
		entrypoint: ".open-next/worker.js",
		env: {
			D1: bindings.d1({
				name: "fesb-racing-cms",
				id: "PLACEHOLDER_D1_DATABASE_ID",
				dev: {
					remote: true,
				},
			}),
			R2: bindings.r2({
				name: "placeholder-fesb-racing-media",
			}),
			ASSETS: bindings.assets(),
		},
	},
});
