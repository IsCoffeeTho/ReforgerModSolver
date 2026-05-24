import solveFile from "./solver";

async function main() {
	let args = process.argv.slice(2);

	let configFile = "";
	let outputFile = "";

	for (let arg of args) {
		if (!configFile) {
			configFile = arg;
			continue;
		}
		if (!outputFile) {
			outputFile = arg;
			continue;
		}
		if (outputFile) {
			console.error(`More than one config file was provided, will not proceed.`);
			return 1;
		}
	}

	if (!configFile) {
		console.error(`No config file was provided.`);
		return 1;
	}
	if (!outputFile) {
		outputFile = configFile;
	}

	return await solveFile(configFile, outputFile);
}

process.exit((await main()) ?? 0);
