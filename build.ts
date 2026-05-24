import pkg from "./package.json";

type buildTargetDescriptor = {
	subTargets: string[],
	fileExtension: string
};

const BUILD_TARGETS: { [platform:string]: buildTargetDescriptor } = {
	"linux": {
		subTargets: [
			"x64",
			"arm64"
		],
		fileExtension: ""
	},
	"windows": {
		subTargets: [
			"x64",
			"arm64"
		],
		fileExtension: ".exe"
	},
	"darwin-arm64": {
		subTargets: [
			"x64",
			"arm64"
		],
		fileExtension: ""
	},
};

const BUILD_DIR = `./build`;

let builds = [];

for (let platform in BUILD_TARGETS) {
	var target = <buildTargetDescriptor>BUILD_TARGETS[platform];
	for (let subtarget of target.subTargets) {
		builds.push(Bun.build({
			entrypoints: ["./src/main.ts"],
			compile: {
				target: <Bun.Build.CompileTarget>`bun-${platform}-${subtarget}`,
				outfile: `${BUILD_DIR}/v${pkg.verison}/ReforgerModSolver-${platform}-${subtarget}${target?.fileExtension}`
			}
		}))
	}
}

await Promise.allSettled(builds);
