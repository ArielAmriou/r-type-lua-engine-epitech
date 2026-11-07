import * as vscode from 'vscode';
import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const basicConf: string = `windowFPS = 60
windowWidth = 800
windowHeight = 600
windowName = MyGame
srcDirectory = src
modules = Window, Keyboard, Mouse`;

const basicLua: string = `local function update(gm)
    if gm:windowShouldClose() then
        gm:stop()
    end
end

function start(gm)
    gm:createSystem(update)
end
`;

const logs = vscode.window.createOutputChannel('R-Type Engine');

function runCommand(command: string, startMessage: string, successMessage: string): void {
	const options = { maxBuffer: 64 * 1024 * 1024 };

	vscode.window.showInformationMessage(startMessage);
	logs.show();

	const child = exec(command, options, (error) => {
		if (error) {
			vscode.window.showErrorMessage(`Error: ${error.message}`);
			return;
		}
		vscode.window.showInformationMessage(successMessage);
	});

	child.stdout?.on('data', (data) => logs.append(data));
	child.stderr?.on('data', (data) => logs.append(data));
}

function getGameBinary(context: vscode.ExtensionContext): string {
	const home: string = os.homedir();
	const debugMode: boolean = context.globalState.get('debugMode', false);

	if (debugMode) {
		return `${home}/.local/bin/game-debug`;
	}
	return `${home}/.local/bin/game`;
}

export function activate(context: vscode.ExtensionContext) {
	const home: string = os.homedir();

	const install = vscode.commands.registerCommand('r-type-lua-engine-epitech.installEngine', () => {
		runCommand(`
			rm -rf /tmp/R-Type &&
			git clone git@github.com:pierrick-simon/R-Type.git /tmp/R-Type &&
			cd /tmp/R-Type &&
			cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_RPATH=${home}/.local/lib &&
			cmake --build build -j &&
			cmake --install build --prefix ${home}/.local &&
			cmake -B build-debug -DCMAKE_CXX_FLAGS="-D__DEBUG__" -DCMAKE_INSTALL_RPATH=${home}/.local/lib &&
			cmake --build build-debug -j --target game &&
			cp Games/game ${home}/.local/bin/game-debug &&
			touch ~/.bashrc ~/.zshrc &&
			(grep -qF '.local/lib' ~/.bashrc || echo 'export LD_LIBRARY_PATH=$HOME/.local/lib:$LD_LIBRARY_PATH' >> ~/.bashrc) &&
			(grep -qF '.local/lib' ~/.zshrc || echo 'export LD_LIBRARY_PATH=$HOME/.local/lib:$LD_LIBRARY_PATH' >> ~/.zshrc) &&
			echo "Installation complete!"
			`,
			'Installing R-Type engine...',
			'R-Type engine installed'
		);
	});

	const update = vscode.commands.registerCommand('r-type-lua-engine-epitech.updateEngine', () => {
		runCommand(`
			cd /tmp/R-Type &&
			git pull &&
			rm -rf build build-debug &&
			cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_RPATH=${home}/.local/lib &&
			cmake --build build -j &&
			cmake --install build --prefix ${home}/.local &&
			cmake -B build-debug -DCMAKE_CXX_FLAGS="-D__DEBUG__" -DCMAKE_INSTALL_RPATH=${home}/.local/lib &&
			cmake --build build-debug -j --target game &&
			cp Games/game ${home}/.local/bin/game-debug &&
			echo "Update complete!"
			`,
			'Updating R-Type engine...',
			'R-Type engine updated'
		);
	});

	const createProject = vscode.commands.registerCommand('r-type-lua-engine-epitech.createProject', async () => {
		const name = await vscode.window.showInputBox({ prompt: 'Project name' });
		if (!name) {
			return;
		}

		const projectDir: string = `${home}/Documents/LuaEngineProjects/${name}`;

		if (fs.existsSync(projectDir)) {
			vscode.window.showErrorMessage(`Project ${name} already exists`);
			return;
		}

		try {
			fs.mkdirSync(`${projectDir}/src`, { recursive: true });
			fs.copyFileSync(getGameBinary(context), `${projectDir}/${name}`);
			fs.writeFileSync(`${projectDir}/config.conf`, basicConf);
			fs.writeFileSync(`${projectDir}/src/game.lua`, basicLua);
		} catch (error) {
			vscode.window.showErrorMessage(`Error: ${error}`);
			return;
		}

		const initGit = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Initialize a git repository?' });
		if (initGit === 'Yes') {
			try {
				fs.writeFileSync(`${projectDir}/.gitignore`, `${name}\n`);
				execSync('git init', { cwd: projectDir });
			} catch (error) {
				vscode.window.showErrorMessage(`Git init failed: ${error}`);
			}
		}

		vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectDir));
	});

	const openProject = vscode.commands.registerCommand('r-type-lua-engine-epitech.openProject', async () => {
		const projectsDir: string = `${home}/Documents/LuaEngineProjects`;

		if (!fs.existsSync(projectsDir)) {
			vscode.window.showErrorMessage(`No project found in ${projectsDir}`);
			return;
		}

		const projects: string[] = fs.readdirSync(projectsDir);
		const name = await vscode.window.showQuickPick(projects, { placeHolder: 'Project to open' });
		if (!name) {
			return;
		}

		vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(`${projectsDir}/${name}`));
	});

	const runGame = vscode.commands.registerCommand('r-type-lua-engine-epitech.runGame', () => {
		const projectDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

		if (!projectDir || !projectDir.startsWith(`${home}/Documents/LuaEngineProjects/`)) {
			vscode.window.showErrorMessage(`Open a project located in ${home}/Documents/LuaEngineProjects/`);
			return;
		}

		const name: string = path.basename(projectDir);

		runCommand(`
			cd ${projectDir} &&
			cp ${getGameBinary(context)} ./${name} &&
			./${name}
			`,
			`Launching ${name}...`,
			`${name} exited`
		);
	});

	const openDoc = vscode.commands.registerCommand('r-type-lua-engine-epitech.openDoc', () => {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/pierrick-simon/R-Type/wiki/Lua-Scripting-Guide'));
	});

	const toggleDebug = vscode.commands.registerCommand('r-type-lua-engine-epitech.toggleDebug', () => {
		const debugMode: boolean = context.globalState.get('debugMode', false);

		context.globalState.update('debugMode', !debugMode);
		if (debugMode) {
			vscode.window.showInformationMessage('Debug mode disabled');
		} else {
			vscode.window.showInformationMessage('Debug mode enabled');
		}
	});

	context.subscriptions.push(logs);
	context.subscriptions.push(install);
	context.subscriptions.push(update);
	context.subscriptions.push(createProject);
	context.subscriptions.push(openProject);
	context.subscriptions.push(runGame);
	context.subscriptions.push(openDoc);
	context.subscriptions.push(toggleDebug);
    
}

export function deactivate() {}
