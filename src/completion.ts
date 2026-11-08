import * as vscode from 'vscode';
import { LuaFunction, components, systems, gmFunctions, otherFunctions, enums } from './luaApi';

function functionItems(functions: LuaFunction[]): vscode.CompletionItem[] {
	return functions.map((f) => {
		const item = new vscode.CompletionItem(f.signature, vscode.CompletionItemKind.Method);

		item.filterText = f.name;
		item.insertText = new vscode.SnippetString(f.snippet);
		item.documentation = new vscode.MarkdownString(f.doc);
		return item;
	});
}

function componentItems(): vscode.CompletionItem[] {
	return components.map((c) => {
		const item = new vscode.CompletionItem(c.name, vscode.CompletionItemKind.Class);

		item.detail = `fields: ${c.fields.join(', ')}`;
		item.documentation = new vscode.MarkdownString(c.doc);
		return item;
	});
}

function systemItems(): vscode.CompletionItem[] {
	return systems.map((s) => {
		const item = new vscode.CompletionItem(s.name, vscode.CompletionItemKind.Function);

		item.documentation = new vscode.MarkdownString(s.doc);
		return item;
	});
}

function fieldItems(componentName: string): vscode.CompletionItem[] {
	const component = components.find((c) => c.name === componentName);

	if (!component) {
		return [];
	}
	return component.fields.map((field) => {
		const item = new vscode.CompletionItem(field, vscode.CompletionItemKind.Field);

		item.insertText = new vscode.SnippetString(`${field} = \${1}`);
		return item;
	});
}

function enumItems(table: string): vscode.CompletionItem[] {
	return enums[table].map((value) => new vscode.CompletionItem(value, vscode.CompletionItemKind.EnumMember));
}

function globalItems(): vscode.CompletionItem[] {
	const items: vscode.CompletionItem[] = [];
	const start = new vscode.CompletionItem('start', vscode.CompletionItemKind.Snippet);

	start.insertText = new vscode.SnippetString('function start(gm)\n\t${1}\nend');
	start.documentation = new vscode.MarkdownString('Called once by the engine with the `GameManager`. Every script must define it.');
	items.push(start);

	for (const table in enums) {
		items.push(new vscode.CompletionItem(table, vscode.CompletionItemKind.Enum));
	}
	return items;
}

function provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
	// The text of the line, up to the cursor
	const line: string = document.lineAt(position).text.substring(0, position.character);

	// Key.Sp, MouseButton.Le...
	const enumMatch = line.match(/\b(Key|MouseButton|SoundState|Attenuation)\.\w*$/);
	if (enumMatch) {
		return enumItems(enumMatch[1]);
	}

	// gm:addComponent(e, 'Position2D', {x = 1, y...
	const fieldMatch = line.match(/addComponent\(.*['"](\w+)['"]\s*,\s*\{[^}'"]*$/);
	if (fieldMatch) {
		return fieldItems(fieldMatch[1]);
	}

	// gm:addSystem('Draw...
	if (/addSystem\(\s*['"]\w*$/.test(line)) {
		return systemItems();
	}

	// Any other string: a component name, e.g. gm:getComponent(e, 'Pos... or {'Position2D', 'Vel...
	if (/['"]\w*$/.test(line)) {
		return componentItems();
	}

	// gm:create...
	if (/\bgm\s*:\w*$/.test(line)) {
		return functionItems(gmFunctions);
	}

	// kb:isDown, gm:keyboard():isPressed, clock:elapsed, sound:setVolume...
	if (/(\w|\))\s*:\w*$/.test(line)) {
		return functionItems(otherFunctions);
	}

	return globalItems();
}

export function registerLuaCompletion(context: vscode.ExtensionContext): void {
	const provider = vscode.languages.registerCompletionItemProvider(
		'lua',
		{ provideCompletionItems },
		':', '.', '\'', '"', '{', ','
	);

	context.subscriptions.push(provider);
}
