# Reforger Mod Solver

A tool that will update and order your server's mods to its dependencies.

## Quickstart

### Installation

1. Ensure you have the necessary permissions to access and modify files in the server directory.
2. Navigate to the folder where your Arma Reforger Server is installed on your computer.  
   _This could be something like `C:\Program Files (x86)\Steam\steamapps\common\Arma Reforger Server` or wherever you specified during the installation
   process._
3. Once in the correct directory, move the correct executable into the directory ready for use.

```sh
.\ReforgerModSolver-windows-x64.exe config.json > config-solved.json
```

### Example

```json
// config.json > game > mods
[
	{
		"modId": "595F2BF2F44836FB",
		"name": "RHS - Status Quo",
		"version": "0.12.4414"
	},
	{
		"modId": "1337C0DE5DABBEEF",
		"name": "RHS - Content Pack 01",
		"version": "0.12.4414"
	},
	{
		"modId": "BADC0DEDABBEDA5E",
		"name": "RHS - Content Pack 02",
		"version": "0.12.4414"
	}
]
```

```json
// config-solved.json > game > mods
[
	{
		"modId": "1337C0DE5DABBEEF",
		"name": "RHS - Content Pack 01",
		"version": "0.14.4886"
	},
	{
		"modId": "BADC0DEDABBEDA5E",
		"name": "RHS - Content Pack 02",
		"version": "0.14.4899"
	},
	{
		"modId": "595F2BF2F44836FB",
		"name": "RHS - Status Quo",
		"version": "0.14.4899"
	}
]
```
