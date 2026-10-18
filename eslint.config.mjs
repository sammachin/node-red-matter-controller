import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                process: "readonly",
                console: "readonly",
                Buffer: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                Promise: "readonly",
                BigInt: "readonly",
                URL: "readonly",
            },
        },
        rules: {
            "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
            "no-empty": ["error", { allowEmptyCatch: true }],
        },
    },
    {
        // Browser-side editor scripts loaded as <script> tags.
        // Functions/constants are intentionally global for cross-file use.
        files: ["resources/**/*.js"],
        languageOptions: {
            sourceType: "script",
            globals: {
                document: "readonly",
                window: "readonly",
                $: "readonly",
                console: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "off",
            "no-redeclare": "off",
        },
    },
    {
        // Test files
        files: ["test/**/*.js"],
        languageOptions: {
            globals: {
                describe: "readonly",
                it: "readonly",
                before: "readonly",
                after: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
            },
        },
        rules: {
            // should.js is required for side effects (augments Object.prototype)
            "no-unused-vars": ["error", { args: "none", caughtErrors: "none", varsIgnorePattern: "^should$" }],
        },
    },
    {
        ignores: ["node_modules/", "repl.js", "example.js", "eslint.config.mjs"],
    },
];
