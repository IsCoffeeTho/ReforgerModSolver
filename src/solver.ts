import { readFileSync } from "fs";

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

export default async function solveFile(configFile: string) {
	try {
		let configText = wrap(() => readFileSync(configFile).toString("utf8"), "Failed to open config file.");
		let config = wrap(() => JSON.parse(configText), "Failed to parse config file.");
		let mods: ModData[] = [];
		let unindexed: ModData[] = [];
		for (let mod of config.game.mods) {
			let unindexedIdx = unindexed.findIndex(m => m.modId == <string>mod.modId);
			if (unindexedIdx != -1)
				continue;
			let data: ModData = {
				modId: mod.modId,
				name: mod.name,
				version: mod.version,
				dependants: [],
				gen: 0,
			};
			unindexed.push(data);
		}
		while (unindexed.length > 0) {
			let mod = <ModData>unindexed.pop();
			let data = await getModData(mod.modId);
			mod.name = data.name;
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
		let changedThisIteration: boolean = true;
		
		const HARD_ITER_LIMIT = 1;
		
		for (var i = 0; i < HARD_ITER_LIMIT; i++) { // hard limit 1000 iterations
			if (changedThisIteration == false)
				break;
			changedThisIteration = false;
			for (let mod of mods) {
				if (mod.dependants.length > 0) {
					for (let dependant of mod.dependants) {
						if (dependant.gen <= mod.gen) {
							changedThisIteration = true;
							dependant.gen = mod.gen + 1;
						}
					}
				}
			}
		}
		mods.sort((a, b) => a.gen - b.gen);
		config.game.mods = [];
		for (let mod of mods) {
			config.game.mods.push({
				modId: mod.modId,
				name: mod.name,
				version: mod.version,
			});
		}
		console.log(JSON.stringify(config,null,"\t"));
	} catch (err) {
		console.error(err);
		return 2;
	}
}
