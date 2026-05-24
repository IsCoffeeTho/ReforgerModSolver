import solveFile from "./solver";

async function main() {
	let args = process.argv.slice(2);
	
	let configFile = "";
	
	for (let arg of args) {
		if (configFile) {
			console.error(`More than one config file was provided, will not proceed.`);
			return 1;
		}
		configFile = arg;
	}
	
	if (!configFile) {
		console.error(`No config file was provided.`);
		return 1;
	}
		
	return await solveFile(configFile);
}

process.exit(await main() ?? 0);