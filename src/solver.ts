import { semver } from "bun";
import { readFileSync, writeFileSync } from "fs";

type Mod = {
	modId: string;
	name: string;
	version: string;
};

type ModData = Mod & {
	dependants: ModData[];
	gen: number;
};

function wrap(fn: () => any, errormsg: string) {
	try {
		let v = fn();
		return v;
	} catch (_) {
		throw errormsg;
	}
}

async function getModData(id: string) {
	let response = await fetch(`https://reforger.armaplatform.com/workshop/${id}`);
	if (!response.ok) throw `Couldn't retrieve mod "${id}" from workshop.`;
	let body = await response.text();
	let nextDataIdx = body.indexOf("__NEXT_DATA__");
	if (nextDataIdx == -1) throw `Couldn't retrieve mod "${id}" from workshop.`;
	body = body.slice(nextDataIdx);
	let startSection = body.indexOf(">");
	if (startSection == -1) throw `Couldn't retrieve mod "${id}" from workshop.`;
	body = body.slice(startSection + 1);
	let endSection = body.indexOf("</script>");
	if (endSection == -1) throw `Couldn't retrieve mod "${id}" from workshop.`;
	body = body.slice(0, endSection);
	return JSON.parse(body).props.pageProps.asset;
}

function removeDuplicates<T extends ModData | Mod>(mods: T[]) {
	let unique: T[] = [];
	for (let mod of mods) {
		let uniqueIdx = unique.findIndex(m => m.modId == <string>mod.modId);
		if (uniqueIdx != -1) continue;
		unique.push(mod);
	}
	return unique;
}

function convertModsToModData(mods: Mod[]) {
	return mods.map(m => ({
		modId: m.modId,
		name: m.name,
		version: m.version,
		dependants: [],
		gen: 0,
	}));
}

function convertModDataToMods(mods: ModData[]) {
	return mods.map(m => ({
		modId: m.modId,
		name: m.name,
		version: m.version,
	}));
}

async function addDependencies(unindexed: ModData[]) {
	let mods: ModData[] = [];
	while (unindexed.length > 0) {
		let mod = <ModData>unindexed.pop();
		let data = await getModData(mod.modId);
		mod.name = data.name;
		if (!mod.version || (semver.order(mod.version, data.currentVersionNumber) == -1))
			mod.version = data.currentVersionNumber;
		for (let dependency of data.dependencies) {
			let modIdx = mods.findIndex(m => m.modId == <string>dependency.asset.id);
			if (modIdx != -1) {
				(<ModData>mods[modIdx]).dependants.push(mod);
				continue;
			}
			let unindexedIdx = unindexed.findIndex(m => m.modId == <string>dependency.asset.id);
			if (unindexedIdx != -1) {
				(<ModData>unindexed[unindexedIdx]).dependants.push(mod);
				continue;
			}
			unindexed.push({
				modId: <string>dependency.asset.id,
				name: <string>dependency.asset.name,
				version: <string>dependency.version,
				dependants: [mod],
				gen: 0,
			});
		}
		mods.push(mod);
	}
	return mods;
}

function determineLineage(mods: ModData[]) {
	let changedThisIteration: boolean = true;
	const HARD_ITER_LIMIT = 100;
	// hard limit 1000 iterations

	for (var i = 0; i < HARD_ITER_LIMIT; i++) {
		if (changedThisIteration == false) break;
		changedThisIteration = false;
		for (let mod of mods) {
			(() => {
				if (mod.dependants.length <= 0) return;
				for (let dependant of mod.dependants) {
					if (dependant.gen > mod.gen) continue;
					changedThisIteration = true;
					dependant.gen = mod.gen + 1;
				}
			})();
		}
	}
}

export default async function solveFile(configFile: string, outputFile: string) {
	try {
		let configText = wrap(() => readFileSync(configFile).toString("utf8"), "Failed to open config file.");
		let config = wrap(() => JSON.parse(configText), "Failed to parse config file.");
		let uniqueMods = removeDuplicates(config.game.mods);
		let mods: ModData[] = convertModsToModData(uniqueMods);
		mods = await addDependencies(mods);
		determineLineage(mods);
		mods.sort((a, b) => {
			let genHeuristic = a.gen - b.gen;
			if (genHeuristic != 0) return genHeuristic;
			return a.name.localeCompare(b.name);
		});
		config.game.mods = convertModDataToMods(mods);
		writeFileSync(outputFile, JSON.stringify(config, null, "\t"));
	} catch (err) {
		console.error(err);
		return 2;
	}
}
