import babel from 'rollup-plugin-babel';
import copy from 'rollup-plugin-copy';
import pkg from './package.json';

export default [
	{
		input: 'index.mjs',
		external: ['ncp', 'fs', 'path', 'util'],
		output: [{
			file: pkg.main,
			format: 'cjs'
		},
		{
			file: pkg.module,
			format: 'es'
		}
		],
		plugins: [
			babel({
				exclude: ['node_modules/**']
			}),
			copy({
				targets: [
					{ src: 'react/**/*', dest: 'dist/react' }
				],
				flatten: false
			})
		]
	}
];