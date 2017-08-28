
utils = require("./Utility Functions.js");
fs = require("fs");

let doPrintFunctionClosure = false;

class FilePrinter
{
    constructor()
    {
        this.stringAccumulator = "";

    }
    /**
     *
     * @param {string} line
     */
    writeLine(line) {
        this.constructor.stringAccumulator += line + "\n";
    }

    /**
     *
     * @param fileName
     * @param {ExtractionResult} result
     * @param {string[]} documentArray
     */
    printToFile(fileName, result, documentArray)
    {
        this.constructor.stringAccumulator = "";

        result.docComments.forEach(function (comment) {
            this.printCommentBlock(documentArray, comment);
        }, this);

        if (doPrintFunctionClosure && result.inFunctionClosure)
        {
            this.writeLine("(function(result){");
        }

        let classes = result.classDeclarations;
        for (let i = 0; i < classes.length; i++)
        {
            if (this.shouldPrintClass(classes[i]))
                this.printClass(documentArray, classes[i]);
            //classFunctions += classes[i].classBlock.functions.length;
        }
        let vars = result.varDeclarations;
        for (let i = 0; i < vars.length; i++)
        {
            if (this.shouldPrintVar(vars[i]))
                this.printVar(documentArray, vars[i]);
            //varFunctions += vars[i].varBlock.functions.length;
            //varProperties += vars[i].varBlock.properties.length;
        }
        let functions = result.looseFunctions;
        for (let i = 0; i < functions.length; i++)
        {
            if (this.shouldPrintLooseFunction(functions[i]))
                this.printLooseFunction(documentArray, functions[i]);
        }

        if (doPrintFunctionClosure && result.inFunctionClosure)
        {
            this.writeLine(result.returnStatement);
            this.writeLine("});");
        }

        if (this.constructor.stringAccumulator.length > 0)
            fs.writeFileSync(fileName, this.constructor.stringAccumulator, "utf8");
    }

    /**
     *
     * @param {VarDeclaration} varDeclaration
     * @returns {boolean}
     */
    shouldPrintVar(varDeclaration)
    {
        let result = true;

        if (typeof varDeclaration.comment !== "undefined")
            result = result && !varDeclaration.comment.tags.includes("@private");

        return result;
    }

    /**
     *
     * @param {ClassDeclaration} classDeclaration
     * @returns {boolean}
     */
    shouldPrintClass(classDeclaration)
    {
        let result = true;
        if (typeof classDeclaration.comment !== "undefined")
            result = result && !classDeclaration.comment.tags.includes("@private");

        return result;
    }

    /**
     *
     * @param {string[]} documentArray
     * @param {FunctionDeclaration} funct
     */
    printLooseFunction(documentArray, funct)
    {
        //if (this.shouldPrintLooseFunction(funct))
            this.printFunction(documentArray, funct);

//        if (funct.hasPrototype || funct.prototype)
//            if (this.shouldPrintFunction(funct))
//                this.printFunction(documentArray, funct);
    }


    /**
     *
     * @param {FunctionDeclaration} functionDeclaration
     * @returns {boolean}
     */
    shouldPrintLooseFunction(functionDeclaration)
    {
        let result = false;
        result = result || (functionDeclaration.hasPrototype || functionDeclaration.prototype);

        if (typeof functionDeclaration.comment !== "undefined")
            result = result || functionDeclaration.comment.tags.includes("@classdesc");

        return result && this.shouldPrintFunction(functionDeclaration);
    }

    /**
     *
     * @param {FunctionDeclaration} functionDeclaration
     * @returns {boolean}
     */
    shouldPrintFunction(functionDeclaration)
    {
        let result = true;

        if (typeof functionDeclaration.comment !== "undefined")
            result = result && !functionDeclaration.comment.tags.includes("@private");
        result = result && !functionDeclaration.funct.declaration.startsWith("_");
        //result = result && !functionDeclaration.tags.includes("@hidden");

        return result;
    }

    /**
     *
     * @param {string[]} documentArray
     * @param {ClassDeclaration} classDeclaration
     */
    printClass(documentArray, classDeclaration)
    {
        if (classDeclaration.comment !== null)
        {
            this.printCommentBlock(documentArray, classDeclaration.comment);
        }

        if (classDeclaration.tags.length > 0)
        {
            for (let i = 0; i < classDeclaration.tags.length; i++)
            {
                this.writeLine(classDeclaration.tags[i]);
                console.log("Found tags!");
            }
        }
        if (!doPrintFunctionClosure)
        {
            if (classDeclaration.classBlock.declaration.startsWith("return"))
            {
                classDeclaration.classBlock.declaration =
                    classDeclaration.classBlock.declaration.substring(classDeclaration.classBlock.declaration.indexOf("class "));
            }
        }
        this.writeLine(classDeclaration.classBlock.declaration);

        /**
         *
         * @type {FunctionDeclaration[]}
         */
        let functions = classDeclaration.classBlock.functions;
        for (let i = 0; i < functions.length; i++)
        {
            if (this.shouldPrintFunction(functions[i]))
            {
                if (functions[i].constructor)
                {
                    this.printConstructor(documentArray, functions[i], classDeclaration.child);
                }
                else
                    this.printFunction(documentArray, functions[i]);
            }
        }
        let closer = "}";
        if (utils.isIn(classDeclaration.classBlock.declaration, "="))
        {
            closer = closer + ";";
        }

        this.writeLine(closer);

        let memberFunctions = classDeclaration.memberFunctions;
        for (let i = 0; i < memberFunctions.length; i++)
        {
            this.printFunction(documentArray, memberFunctions[i]);
        }

        let memberProperties = classDeclaration.memberProperties;
        for (let i = 0; i < memberProperties.length; i++)
        {
            this.printVar(documentArray, memberProperties[i]);
        }
    }

    /**
     *
     * @param documentArray
     * @param {VarDeclaration} varDeclaration
     */
    printVar(documentArray, varDeclaration)
    {
        if (varDeclaration.comment !== null)
        {
            this.printCommentBlock(documentArray, varDeclaration.comment);
        }
        let closing = utils.getClosingString(varDeclaration.varBlock.declaration);

        this.writeLine(varDeclaration.varBlock.declaration);

        let functions = varDeclaration.varBlock.functions;
        let properties = varDeclaration.varBlock.properties;


        for (let i = 0; i < functions.length; i++)
        {
            if (this.shouldPrintFunction(functions[i]))
            {
                this.printFunction(documentArray, functions[i]);
                if ((i < functions.length - 1 || properties.length > 0) && !functions[i].funct.declaration.endsWith(","))
                    this.writeLine(",");

            }
        }

        this.printVarProperties(documentArray, properties);
        this.writeLine(closing + ";");
    }

    /**
     *
     * @param {string[]} documentArray
     * @param {PropertyDeclaration[]} properties
     */
    printVarProperties(documentArray, properties)
    {
        for (let i = 0; i < properties.length; i++)
        {
            if (properties[i].comment === null)
            {
                //console.log(varDeclaration.varBlock.declaration);
                //console.log("        " + properties[i].property);
            }
            if (typeof properties[i].comment !== "undefined")
            {
                if (properties[i].comment.tags.includes("@private"))
                {
                    continue;
                }
                this.printCommentBlock(documentArray, properties[i].comment);
            }
            let comma = "";
            if (i < properties.length - 1)
                comma = ",";

            if (typeof properties[i].value === "undefined")
            {
                this.writeLine(properties[i].property + comma);
                continue;
            }

            if (properties[i].value instanceof Array)
            {
                this.writeLine(properties[i].property + " : {");
                this.printVarProperties(documentArray, properties[i].value);
                this.writeLine("}" + comma);
            }
            else {
                if (properties[i].value.endsWith(","))
                    comma = "";
                this.writeLine(properties[i].property + " : " + properties[i].value + comma);
            }
        }
    }

    /**
     *
     * @param {string[]} documentArray
     * @param {FunctionDeclaration} functionDeclaration
     * @param {boolean} child
     */
    printConstructor(documentArray, functionDeclaration, child)
    {
        if (functionDeclaration.comment !== undefined)
        {
            this.printCommentBlock(documentArray, functionDeclaration.comment);
        }

        let closer = "";
        if (child)
        {
            closer = closer + "super();";
        }
        closer = closer + "}";
        this.writeLine(functionDeclaration.funct.declaration + closer);// + "}\n");

//        this.writeLine("}");
    }
    /**
     *
     * @param {string[]} documentArray
     * @param {FunctionDeclaration} functionDeclaration
     */
    printFunction(documentArray, functionDeclaration)
    {

        this.printCommentBlock(documentArray, functionDeclaration.comment);
        if (functionDeclaration.funct === undefined)
        {
            console.log("Undefined");
            return;
        }

        for (let i = 0; i < functionDeclaration.tags.length; i++)
        {
            this.writeLine(functionDeclaration.tags[i]);
        }

        let closer = utils.getClosingString(functionDeclaration.funct.declaration);

        if (functionDeclaration.prototype)
        {
            closer += ";"
        }

        this.writeLine(functionDeclaration.funct.declaration + closer);

    }


    /**
     *
     * @param {string[]} documentArray
     * @param {CommentBlock} commentBlock
     */
    printCommentBlock(documentArray, commentBlock)
    {
        if (typeof commentBlock === "undefined")
        {
            utils.exLog("Undefined comment block.");
            return;
        }
        for (let index = commentBlock.startLine; index <= commentBlock.endLine; index++)
        {
            this.writeLine(documentArray[index].trim());
        }
    }
}

module.exports = new FilePrinter();