# typescript-compiler

typescript-compiler is an extension for the code editor CodeTasty that adds automatic compilation of TypeScript files upon saving.


### Compile Options

TypeScript compile options can be set in the first line of the edited file:

    // out: ../js/module.js

out: compiled file destination

    // out: ., module.js, ../module.js
    // . - same path with js extension
    // something.ts - will compile this file instead
    
All other compile options should be set in /tsconfig.json file in the root of a workspace.

    {
        "compilerOptions": {
            "target": "es5",
            "module": "system",
            "sourceMap": true,
            "emitDecoratorMetadata": true,
            "experimentalDecorators": true,
            "removeComments": false,
            "noImplicitAny": false
        },
            "exclude": [
            "node_modules",
            "typings/main",
            "typings/main.d.ts"
        ]
    }