// The engine's Lua API, from the Lua scripting guide:
// https://github.com/pierrick-simon/R-Type/wiki/Lua-Scripting-Guide

export interface LuaFunction {
	name: string;
	signature: string;
	snippet: string;
	doc: string;
}

export interface LuaComponent {
	name: string;
	fields: string[];
	doc: string;
}

export interface LuaSystem {
	name: string;
	doc: string;
}

export const components: LuaComponent[] = [
	{ name: 'Position2D', fields: ['x', 'y'], doc: 'Position in pixels, (0, 0) at the top-left corner.' },
	{ name: 'Velocity2D', fields: ['x', 'y'], doc: 'Speed in pixels per second.' },
	{ name: 'Origin2D', fields: ['x', 'y'], doc: 'Origin point.' },
	{ name: 'Size2D', fields: ['width', 'height'], doc: 'Size in pixels.' },
	{ name: 'Friction2D', fields: ['f'], doc: 'Slows a `Velocity2D` down.' },
	{ name: 'GravityField2D', fields: ['x', 'y', 'g'], doc: 'Pulls a `Velocity2D` in a direction.' },
	{ name: 'Clock', fields: ['speed'], doc: 'An entity\'s own clock. Read its time with `clock:elapsed()`.' },
	{ name: 'Texture2D', fields: ['path'], doc: 'An image, loaded from `path` (required).' },
	{ name: 'Sprite2D', fields: ['scale', 'rotation', 'flip'], doc: 'Draws the entity\'s `Texture2D`.' },
	{ name: 'SpriteSheet2D', fields: ['rows', 'columns', 'currentTile', 'frameDuration', 'animation', 'scale', 'rotation', 'flip'], doc: 'Draws and animates one tile of the `Texture2D` at a time.' },
	{ name: 'Font', fields: ['path'], doc: 'A font, loaded from `path` (required).' },
	{ name: 'Text2D', fields: ['str', 'fontSize', 'rotation', 'spacing'], doc: 'Draws a text with the entity\'s `Font`.' },
	{ name: 'Position3D', fields: ['x', 'y', 'z'], doc: 'Position in 3D space.' },
	{ name: 'Model3D', fields: ['path'], doc: 'A 3D model, loaded from `path` (required).' },
	{ name: 'ModelAnimation3D', fields: ['path'], doc: 'The animations of a 3D model, loaded from `path` (required).' },
	{ name: 'Sprite3D', fields: ['scale'], doc: 'Draws the entity\'s `Model3D`.' },
	{ name: 'SpriteSheet3D', fields: ['index', 'frameDuration', 'animation', 'scale'], doc: 'Plays an animation of the `Model3D`.' },
	{ name: 'Sound', fields: ['path', 'state', 'loop', 'stereo', 'attenuation', 'minDistance', 'maxDistance'], doc: 'A sound, loaded from `path` (required). Needs the `Audio` module.' },
];

export const systems: LuaSystem[] = [
	{ name: 'MasterVelocity2D', doc: 'Moves `Position2D` + `Velocity2D`, with the game\'s clock.' },
	{ name: 'Velocity2D', doc: 'Moves `Velocity2D` + `Position2D` + `Clock`, with their own clock.' },
	{ name: 'MasterFriction2D', doc: 'Slows down `Velocity2D` + `Friction2D`, with the game\'s clock.' },
	{ name: 'Friction2D', doc: 'Slows down `Friction2D` + `Velocity2D` + `Clock`, with their own clock.' },
	{ name: 'MasterGravityField2D', doc: 'Applies the gravity to `Velocity2D` + `GravityField2D`, with the game\'s clock.' },
	{ name: 'GravityField2D', doc: 'Applies the gravity to `GravityField2D` + `Velocity2D` + `Clock`, with their own clock.' },
	{ name: 'Clock', doc: 'Advances the entities\' own `Clock`.' },
	{ name: 'DrawSprite2D', doc: 'Draws `Sprite2D` + `Texture2D` + `Position2D`.' },
	{ name: 'DrawSpriteSheet2D', doc: 'Draws the current tile of `SpriteSheet2D` + `Texture2D` + `Position2D`.' },
	{ name: 'MasterAnimateSpriteSheet2D', doc: 'Animates `SpriteSheet2D`, with the game\'s clock.' },
	{ name: 'AnimateSpriteSheet2D', doc: 'Animates `SpriteSheet2D` + `Clock`, with their own clock.' },
	{ name: 'DrawText2D', doc: 'Draws the text of `Text2D` + `Font` + `Position2D`.' },
	{ name: 'DrawSprite3D', doc: 'Draws `Sprite3D` + `Model3D` + `Position3D` in 3D.' },
	{ name: 'DrawSpriteSheet3D', doc: 'Draws `SpriteSheet3D` + `Model3D` + `Position3D` in 3D, animated.' },
	{ name: 'MasterAnimateSpriteSheet3D', doc: 'Animates `SpriteSheet3D` + `Model3D` + `ModelAnimation3D`, with the game\'s clock.' },
	{ name: 'AnimateSpriteSheet3D', doc: 'Animates `SpriteSheet3D` + `Model3D` + `ModelAnimation3D` + `Clock`, with their own clock.' },
	{ name: 'Sound2D', doc: 'Puts the `stereo` sounds at their entity\'s `Position2D`.' },
	{ name: 'KeyboardManagerClear', doc: 'Empties the keys read this frame.' },
];

// Snippet choice lists, e.g. ${2|Position2D,Velocity2D,...|}
const componentChoice: string = components.map((c) => c.name).join(',');
const systemChoice: string = systems.map((s) => s.name).join(',');

// Functions called on the GameManager: gm:...
export const gmFunctions: LuaFunction[] = [
	{ name: 'createEntity', signature: 'createEntity()', snippet: 'createEntity()', doc: 'Creates an entity and returns it.' },
	{ name: 'destroyEntity', signature: 'destroyEntity(e)', snippet: 'destroyEntity(${1:e})', doc: 'Destroys an entity and its components.' },
	{ name: 'hasEntity', signature: 'hasEntity(e)', snippet: 'hasEntity(${1:e})', doc: 'Whether the entity exists.' },
	{ name: 'stop', signature: 'stop()', snippet: 'stop()', doc: 'Stops the game after the current frame.' },
	{ name: 'windowShouldClose', signature: 'windowShouldClose()', snippet: 'windowShouldClose()', doc: 'Whether the close button or `Escape` was pressed. Needs the `Window` module.' },
	{ name: 'addComponent', signature: 'addComponent(e, name [, fields])', snippet: `addComponent(\${1:e}, '\${2|${componentChoice}|}')`, doc: 'Adds a component, built from the optional table of fields.' },
	{ name: 'getComponent', signature: 'getComponent(e, name)', snippet: `getComponent(\${1:e}, '\${2|${componentChoice}|}')`, doc: 'The real component (not a copy).' },
	{ name: 'hasComponent', signature: 'hasComponent(e, name)', snippet: `hasComponent(\${1:e}, '\${2|${componentChoice}|}')`, doc: 'Whether the entity has the component.' },
	{ name: 'removeComponent', signature: 'removeComponent(e, name)', snippet: `removeComponent(\${1:e}, '\${2|${componentChoice}|}')`, doc: 'Removes the component.' },
	{ name: 'countComponents', signature: 'countComponents(name)', snippet: `countComponents('\${1|${componentChoice}|}')`, doc: 'How many entities have the component.' },
	{ name: 'createSystem', signature: 'createSystem(func)', snippet: 'createSystem(${1:func})', doc: 'Calls `func(gm)` every frame. Returns the system id. Only from `start`.' },
	{ name: 'createSystem', signature: 'createSystem({names}, func)', snippet: 'createSystem({${1}}, ${2:func})', doc: 'Calls `func(gm, e, components...)` every frame, for every entity that has the components. Returns the system id. Only from `start`.' },
	{ name: 'addSystem', signature: 'addSystem(name)', snippet: `addSystem('\${1|${systemChoice}|}')`, doc: 'Adds one of the engine\'s systems. Returns the system id. Only from `start`.' },
	{ name: 'destroySystem', signature: 'destroySystem(id)', snippet: 'destroySystem(${1:id})', doc: 'Stops a system, with the id returned by `createSystem` or `addSystem`.' },
	{ name: 'hasSystem', signature: 'hasSystem(id)', snippet: 'hasSystem(${1:id})', doc: 'Whether the system exists.' },
	{ name: 'keyboard', signature: 'keyboard()', snippet: 'keyboard()', doc: 'The keyboard: `isPressed`, `isDown`, `isReleased` with a `Key` value. Needs the `Keyboard` module.' },
	{ name: 'mouse', signature: 'mouse()', snippet: 'mouse()', doc: 'The mouse: `isPressed`, `isDown`, `isReleased` with a `MouseButton` value, and `x`, `y`, `wheel`. Needs the `Mouse` module.' },
	{ name: 'elapsed', signature: 'elapsed()', snippet: 'elapsed()', doc: 'The milliseconds of the previous frame, by the game\'s clock.' },
	{ name: 'view', signature: 'view({names})', snippet: 'view({${1}})', doc: 'Loops over the entities that have the components: `for e, components... in gm:view({names}) do`.' },
];

// Functions called on the keyboard, the mouse and some components: kb:..., clock:..., sound:...
export const otherFunctions: LuaFunction[] = [
	{ name: 'isPressed', signature: 'isPressed(key)', snippet: 'isPressed(${1:Key.Space})', doc: 'Keyboard / mouse: the key or button was pressed **during this frame**.' },
	{ name: 'isDown', signature: 'isDown(key)', snippet: 'isDown(${1:Key.Space})', doc: 'Keyboard / mouse: the key or button is **held**.' },
	{ name: 'isReleased', signature: 'isReleased(key)', snippet: 'isReleased(${1:Key.Space})', doc: 'Keyboard / mouse: the key or button was released **during this frame**.' },
	{ name: 'elapsed', signature: 'elapsed()', snippet: 'elapsed()', doc: '`Clock` component: the time of the entity\'s own clock.' },
	{ name: 'setVolume', signature: 'setVolume(v)', snippet: 'setVolume(${1:1})', doc: '`Sound` component: sets the volume (`1` by default).' },
	{ name: 'setPitch', signature: 'setPitch(p)', snippet: 'setPitch(${1:1})', doc: '`Sound` component: sets the pitch (`1` by default).' },
];

function keys(): string[] {
	const result: string[] = [];

	for (let i = 0; i < 26; i++) {
		result.push(String.fromCharCode(65 + i));	// A to Z
	}
	for (let i = 0; i <= 9; i++) {
		result.push(`Num${i}`);
	}
	result.push('Left', 'Right', 'Up', 'Down', 'Space', 'Enter', 'Escape', 'Tab', 'Backspace', 'LShift', 'LControl', 'LAlt');
	for (let i = 0; i <= 9; i++) {
		result.push(`Numpad${i}`);
	}
	for (let i = 1; i <= 15; i++) {
		result.push(`F${i}`);
	}
	return result;
}

// Global tables of constants: Key.Space, MouseButton.Left...
export const enums: { [table: string]: string[] } = {
	Key: keys(),
	MouseButton: ['Left', 'Right', 'Middle', 'Side', 'Extra', 'Forward', 'Back'],
	SoundState: ['PLAY', 'START', 'PAUSED', 'STOP', 'PLAYING'],
	Attenuation: ['NONE', 'INVERSE', 'LINEAR', 'EXPONENTIAL'],
};
