# R-Type Lua Engine

A VS Code extension to install the [R-Type](https://github.com/pierrick-simon/R-Type) engine and to create, open and run Lua games made with it, without leaving the editor.

## Features

- **Install / update the engine**: clones, builds and installs the engine in `~/.local` (no `sudo` needed).
- **Create a project**: generates a ready-to-run Lua project, and can initialize a git repository for it.
- **Open a project**: pick one of your projects from a list.
- **Run the game**: launches the game of the open project, with its output shown in VS Code.

Everything is available from:
- the **Lua Engine** icon in the left sidebar,
- the **▶ button** at the top right of the editor (run game),
- the Command Palette (`Ctrl+Shift+P`).

## Requirements

- Linux
- `git`, with SSH access to `git@github.com:pierrick-simon/R-Type.git`
- `cmake` and a C++ compiler (`g++` or `clang++`)
- VS Code 1.143 or newer

## Commands

| Command | What it does |
|---|---|
| **Install engine** | Clones the engine into `/tmp/R-Type`, builds it in Release and installs it in `~/.local`. Also adds `~/.local/lib` to `LD_LIBRARY_PATH` in `~/.bashrc` and `~/.zshrc`. |
| **Update engine** | Pulls the latest engine sources in `/tmp/R-Type`, then rebuilds and reinstalls it. |
| **Create lua project** | Asks for a name, creates the project in `~/Documents/LuaEngineProjects/<name>`, optionally runs `git init`, then opens it. |
| **Open lua project** | Lists the projects in `~/Documents/LuaEngineProjects` and opens the one you pick. |
| **Run lua game** | Copies the installed engine into the open project as `./<name>`, then runs it. |

Command output (build logs, game logs, errors) is shown in the **Output** panel, channel **R-Type Engine**.

## Project layout

A project created by the extension looks like this:

```
~/Documents/LuaEngineProjects/<name>/
├── <name>          # game binary (copy of the engine, not versioned)
├── config.conf     # window and engine settings
├── src/
│   └── game.lua    # your game code
└── .gitignore      # only if git init was chosen; ignores <name>
```

**`config.conf`**

```
windowFPS = 60
windowWidth = 800
windowHeight = 600
windowName = MyGame
srcDirectory = src
modules = Window, Keyboard, Mouse
```

**`src/game.lua`** — `start` is called once by the engine. It registers an `update` system, called every frame, which stops the game when the window is closed.

```lua
local function update(gm)
    if gm:windowShouldClose() then
        gm:stop()
    end
end

function start(gm)
    gm:createSystem(update)
end
```

## Working on a project with others

The game binary is not committed (it is in `.gitignore`). To work on a cloned project:

1. Run **Install engine** once.
2. Clone the project into `~/Documents/LuaEngineProjects/`, keeping the project name as the folder name.
3. Open it and click **Run game**: the binary is copied from the installed engine before each run.

This also means every project always runs the latest installed version of the engine.

## Troubleshooting

**`error while loading shared libraries: libengine-*.so`**
The engine libraries are in `~/.local/lib`. Reinstall the engine with the extension (it sets the library path in the binary), or open a new terminal so that `LD_LIBRARY_PATH` from `~/.bashrc` / `~/.zshrc` is loaded.

**Update engine fails with `cd: /tmp/R-Type: No such file or directory`**
`/tmp` is cleared when the computer restarts. Run **Install engine** again.

**Run game says "Open a project located in ..."**
The open folder must be inside `~/Documents/LuaEngineProjects/`.

**Create project fails with `ENOENT ... .local/bin/game`**
The engine is not installed. Run **Install engine** first.

## Development

```sh
npm install
npm run compile   # type-check, lint and build into dist/
```

Press **F5** in VS Code to open an *Extension Development Host* window with the extension loaded. Restart it after changing `package.json`.

The whole extension is in [src/extension.ts](src/extension.ts); commands, sidebar and buttons are declared in [package.json](package.json).
