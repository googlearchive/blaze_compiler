// https://github.com/substack/node-optimist
// sourced from https://github.com/soywiz/typescript-node-definitions/blob/master/optimist.d.ts
// rehacked by @Bartvds

declare module optimist {
	export interface Argv {
		_: string[];
	}
	export interface optimist {
		default(name: string, value: any): optimist;
		default(args: any): optimist;

		boolean(name: string): optimist;
		boolean(names: string[]): optimist;

		string(name: string): optimist;
		string(names: string[]): optimist;

		wrap(columns): optimist;

		help(): optimist;
		showHelp(fn?: Function): optimist;

		usage(message: string): optimist;

		demand(key: string): optimist;
		demand(key: number): optimist;
		demand(key: string[]): optimist;

		alias(key: string, alias: string): optimist;

		describe(key: string, desc: string): optimist;

		options(key: string, opt: any): optimist;

		check(fn: Function);

		parse(args: string[]): optimist;

		argv: Argv;
	}
}
interface optimist extends optimist.optimist {
	(args: string[]): optimist.optimist;
}
declare module 'optimist' {
	export = optimist;
}