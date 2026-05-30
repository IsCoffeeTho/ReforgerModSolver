import pkg from "./package.json";

type buildTargetDescriptor = {
	subTargets: string[];
	fileExtension: string;
};

type buildTargets = { [platform: string]: buildTargetDescriptor };

const BUILD_TARGETS: buildTargets = {
	linux: {
		subTargets: ["x64", "arm64"],
		fileExtension: "",
	},
	windows: {
		subTargets: ["x64", "arm64"],
		fileExtension: ".exe",
	},
	darwin: {
		subTargets: ["x64", "arm64"],
		fileExtension: "",
	},
};

const BUILD_DIR = `./build`;

let builds = [];

for (let platform in BUILD_TARGETS) {
	var target = <buildTargetDescriptor>BUILD_TARGETS[platform];
	for (let subtarget of target.subTargets) {
		builds.push((async () => {
			console.log(`Compiling for ${platform} on ${subtarget}`);
			await Bun.build({
				entrypoints: ["./src/main.ts"],
				compile: {
					target: <Bun.Build.CompileTarget>`bun-${platform}-${subtarget}`,
					outfile: `${BUILD_DIR}/v${pkg.version}/ReforgerModSolver-${platform}-${subtarget}${target?.fileExtension}`,
				},
			}),
			console.log(`ReforgerModSolver-${platform}-${subtarget}${target?.fileExtension} Compiled`);
		})());
	}
}

await Promise.allSettled(builds);
