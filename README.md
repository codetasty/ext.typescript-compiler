# TypeScript compiler

typescript-compiler is an extension for the code editor CodeTasty that adds automatic compilation of TypeScript files upon saving.

## Configuration

### 1, Configuration file (recommended)

Create or edit **codetasty.json** file in the workspace root.

```
{
    "extension": {
        "typescript-compiler": {
            "files": {
                "source": [
                    "js/main.coffee",
                    "js/app.coffee"
                ],
                "output": "bundle.js"
            }
        }
    }
}
```

#### files
Type: `Array|Object`

Can be also array to compile multiple bundles.

#### files.source
Type: `Array`, Required

List of files to compile, these file will be watched and auto compiled on save.

#### files.output
Type: `String`, Required

Destination where the compiled output is saved.


### 2, Inline comment (deprecated)

Compile options can be set in the first line of the edited file, separated by comma.

    # out: ../js/main.js

#### out
Type: `String`, Required

Sets output file.

    # out: ., app.js, ../main.js
    # . - same path with js extension


## TypeScript Configuration
All other compile options should be set in **tsconfig.json** file in the workspace root.

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