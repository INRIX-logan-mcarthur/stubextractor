let utils = require('./Utility Functions.js');

/**
 * @typedef {object} CommentBlock
 * @property {int} startLine
 * @property {int} endLine
 * @property {string[]} tags
 */

/**
 * @typedef {object} FunctionBlock
 * @property {int} startLine
 * @property {int} endLine
 * @property {string} declaration
 */

/**
 * @typedef {object} FunctionDeclaration
 * @property {CommentBlock} comment
 * @property {FunctionBlock} funct
 * @property {boolean} constructor
 * @property {boolean} hasPrototype
 * @property {boolean} prototype
 * @property {string[]} tags
 */

/**
 * @typedef {object} ClassBlock
 * @property {int} startLine
 * @property {int} endLine
 * @property {FunctionDeclaration[]} functions
 * @property {string} declaration
 */

/**
 * @typedef {object} ClassDeclaration
 * @property {CommentBlock} comment
 * @property {ClassBlock} classBlock
 * @property {boolean} child
 * @property {string[]} tags
 * @property {string} name
 * @property {FunctionDeclaration[]} memberFunctions
 * @property {VarDeclaration[]} memberProperties
 */


/**
 * @typedef {object} PropertyDeclaration
 * @property {CommentBlock} comment
 * @property {string} property
 * @property {string|PropertyDeclaration[]} value
 */

/**
 * @typedef {object} VarBlock
 * @property {int} startLine
 * @property {int} endLine
 * @property {FunctionDeclaration[]} functions
 * @property {PropertyDeclaration[]} properties
 * @property {string} declaration
 */

/**
 * @typedef {object} VarDeclaration
 * @property {CommentBlock} comment
 * @property {VarBlock} varBlock
 * @property {string[]} tags
 */

/**
 * @typedef {object} ExtractionResult
 * @property {ClassDeclaration[]} classDeclarations
 * @property {VarDeclaration[]} varDeclarations
 * @property {FunctionDeclaration[]} looseFunctions
 * @property {boolean} inFunctionClosure
 * @property {string} returnStatement
 * @property {CommentBlock[]} docComments
 */

/**
 * @typedef {object} ProcessResult
 * @property {int} classes
 * @property {int} classFunctions
 * @property {int} vars
 * @property {int} varFunctions
 * @property {int} varProperties
 * @property {int} looseFunctions
 * @property {ExtractionResult} extraction
 */


/**
 *
 */
class FileProcessor {

    constructor() {
        /**
         *
         * @type {CommentBlock[]}
         */
        this.docComments = [];
    }

    /**
     * The main function that will be called from the outside.
     * This function kicks off everything else in the class.
     *
     * @param {string[]} documentArray
     * @returns {ProcessResult}
     */
    processFile(documentArray) {

        this.docComments = [];
        let classFunctions = 0;
        let varFunctions = 0;
        let varProperties = 0;

        /**
         * @type {ExtractionResult}
         */
        let result = this.extract(documentArray);

        let classes = result.classDeclarations;
        for (let i = 0; i < classes.length; i++) {
            //this.printClass(documentArray, classes[i]);
            classFunctions += classes[i].classBlock.functions.length;
        }
        let vars = result.varDeclarations;
        for (let i = 0; i < vars.length; i++) {
            //this.printVar(documentArray, vars[i]);
            varFunctions += vars[i].varBlock.functions.length;
            varProperties += vars[i].varBlock.properties.length;
        }
        let functions = result.looseFunctions;
        for (let i = 0; i < functions.length; i++) {
            //this.printFunction(documentArray, functions[i]);
        }


        return {
            classes: classes.length,
            classFunctions: classFunctions,
            vars: vars.length,
            varFunctions: varFunctions,
            varProperties: varProperties,
            looseFunctions: functions.length,
            extraction: result
        };
    }


    /**
     * Given the document array and the line number that the comment block starts on
     *  this function assembles and return an object that can be used to identify the comment
     *  block later on.
     *
     * @param {string[]} documentArray
     * @param {int} lineIndex
     * @returns {CommentBlock}
     */
     processCommentBlock(documentArray, lineIndex) {
        // Find the size of the comment block and return it
        let endPoint = lineIndex;
        let commentTags = [];

        for (let index = lineIndex; index < documentArray.length; index++) {
            // Iterating over each line
            let line = documentArray[index].trim();

            // Check if the comment block has ended
            if (utils.isIn(line, "*/")) {
                endPoint = index;
                break;
            }
            // Include the annotations so that they can be used to judge the comment block
            if (utils.isIn(line, "@")) {
                commentTags.push(line.substring(line.indexOf("@")));
            }
        }
        return {
            startLine: lineIndex,
            endLine: endPoint,
            tags: commentTags
        }
    }


    /**
     * Given the document array and the index the function starts on, this function assembles an object to represent
     * the function.
     *
     * @param {string[]} documentArray
     * @param {int} lineIndex
     * @returns {FunctionBlock}
     */
     processFunctionBlock(documentArray, lineIndex) {
        //let declare = documentArray[lineIndex].trim();
        let declare = documentArray[lineIndex].trim();
        if (!utils.isIn(declare, "{")) {
            declare = declare + documentArray[lineIndex + 1].trim();
        }

        // My thinking is that if the function is declared all on one line, then there won't be a closing string
        if (!utils.getClosingString(declare).startsWith("}")) {
            // Add one to include the brace
            declare = declare.substring(0, declare.indexOf("{") + 1);
        }

        let endPoint = utils.getClosingBrace(documentArray, lineIndex, documentArray[lineIndex].lastIndexOf("{")).lineIndex;

        return {
            startLine: lineIndex,
            endLine: endPoint,
            declaration: declare
        };
    }


    /**
     * Will examine the given string to see if it contains any of the reserved keywords.
     * This is because they follow the same structure as a function call and it was triggering false positives
     *
     * @param {string} line
     * @returns {boolean}
     */
     checkAgainstReservedWords(line) {
        let result = false;
        result = result || line.search(/(if\s*\().*(\)\s*{)/) !== -1;

        result = result || line.search(/(while\s*\().*(\)\s*{)/) !== -1;

        result = result || line.search(/(for\s*\().*(\)\s*{)/) !== -1;
        result = result || line.search(/(catch\s*\().*(\)\s*{)/) !== -1;

        result = result || line.search(/(switch\s*\().*(\)\s*{)/) !== -1;

        return result;
    }

    /**
     * An iterative search and parse function that moves from lineIndex to endIndex and extracts each function that it
     *  comes across.
     *
     * @param {string[]} documentArray
     * @param {int} lineIndex
     * @param {int} endIndex
     * @returns {FunctionDeclaration[]}
     */
    extractFunctionDeclarations(documentArray, lineIndex, endIndex) {
        /**
         * @type {FunctionDeclaration[]} functions
         */
        let functions = [];

        /**
         * @type {string[]} looseTags
         */
        let looseTags = [];

        for (let index = lineIndex; index < documentArray.length && index < endIndex; index++) {

            index = this.getNextIndex(documentArray, index, looseTags);
            let line = documentArray[index].trim();

            // Was previously === 0, but that had been changed from !== -1
            if (line.search(/(\w+\s*\().*(\)\s*{)/) !== -1) {
                if (this.checkAgainstReservedWords(line)) {
                    // I can move the lineIndex forward
                    if (utils.isIn(line, "{")) {
                        index = utils.getClosingBrace(documentArray, lineIndex, documentArray[lineIndex].lastIndexOf("{")).lineNumber;
                    }
                    continue;
                }


                // Do not add the function because it is a property
                //
                // That regex is for 1 or more words followed by any amount of space, then a colon
                // That means it is used for finding a property
                // search looks for the regex and returns the index, or -1 if not found, meaning that
                // the if statement is will run if it is found
                if (line.search(/\w+\s*:/) !== -1) {
                    index = utils.getClosingBrace(documentArray, index, documentArray[index].lastIndexOf("{")).lineIndex;
                    continue;
                }

                let comment = this.getMatchedComment(index, looseTags);
                let funct = this.processFunctionBlock(documentArray, index);


                functions.push({
                    comment: comment,
                    funct: funct,
                    constructor: utils.isIn(funct.declaration, "constructor"),
                    hasPrototype: false,
                    prototype: utils.isIn(funct.declaration, "prototype"),
                    tags: looseTags
                });

                looseTags = [];

                index = funct.endLine;
                //continue;
            }
        }

        return functions;
    }

    /**
     * A function to iterate over the array of function declarations and match prototypes together with the function
     *  they are based from.
     *
     * @param {FunctionDeclaration[]} functions
     */
     updateFunctionPrototypes(functions) {
        for (let functionIndex = 0; functionIndex < functions.length; functionIndex++) {
            if (functions[functionIndex].prototype) {
                let origin = functions[functionIndex].funct.declaration.split(".")[0].trim();
                for (let i = 0; i < functions.length; i++) {
                    if (utils.isIn(functions[i].funct.declaration, origin)
                        && !utils.isIn(functions[i].funct.declaration, "prototype")) {
                        functions[i].hasPrototype = true;
                        break;
                    }
                }
            }
        }
    }


    /**
     * A loop to iterate through the document array and process comments, empty lines and loose tags.
     *
     * @param {string[]} documentArray
     * @param {int} index
     * @param {string[]} looseTags
     * @returns {int}
     */
     getNextIndex(documentArray, index, looseTags) {
        let newIndex = index;

        // Rapidly move through and incorporate the comments and tags
        do {
            index = newIndex;
            newIndex = this.handleCommentsAndTags(documentArray, index, looseTags);
        } while (newIndex < documentArray.length && newIndex !== index);

        return index;
    }

    /**
     *
     * @param {string[]} documentArray
     * @param {int} lineIndex
     * @param {int} endIndex
     * @returns {PropertyDeclaration[]}
     */
    extractVarProperties(documentArray, lineIndex, endIndex) {
        /**
         * @type {string[]}
         */
        let looseTags = [];
        /**
         * @type {PropertyDeclaration[]}
         */
        let properties = [];
        for (let index = lineIndex; index < documentArray.length && index < endIndex; index++) {

            index = this.getNextIndex(documentArray, index, looseTags);
            let line = documentArray[index].trim();

            if (index >= endIndex)
                break;

            if (utils.isIn(line, "=>")) {
                let endPoint = utils.getClosingBrace(documentArray, index, documentArray[index].lastIndexOf("{")).lineIndex;
                index = endPoint;
                continue;
            }

            if (utils.isIn(line, ":")) {
                let splitText = line.split(/\s*:\s*/);
                // A left and right side
                let prop = splitText[0];//.trim();

                if (utils.isIn(splitText[1], "function")) {
                    let endPoint = utils.getClosingBrace(documentArray, index, documentArray[index].lastIndexOf("{")).lineIndex;
                    let closing = utils.getClosingString(line);
                    properties.push({
                        comment: this.getMatchedComment(index, looseTags),
                        property: prop,
                        value: splitText[1] + closing
                    });

                    looseTags = [];
                    index = endPoint;
                    continue;
                }
                else if (utils.isIn(splitText[1], "{")) {
                    let endPoint = utils.getClosingBrace(documentArray, index, documentArray[index].lastIndexOf("{")).lineIndex;
                    let comment = this.getMatchedComment(index, looseTags);
                    let value = this.extractVarProperties(documentArray, index + 1, endPoint);

                    properties.push({
                        comment: comment,
                        property: prop,
                        value: value
                    });
                    looseTags = [];
                    index = endPoint;
                    continue;
                }
                else if (utils.isIn(splitText[1], "[")) {
                    let endPoint = utils.getClosingBracket(documentArray, index, documentArray[index].lastIndexOf("[")).lineIndex;
                    // TODO Consider if I want to include the array type properties or not
                    let value = "[]";

                    properties.push({
                        comment: this.getMatchedComment(index, looseTags),
                        property: prop,
                        value: value
                    });
                    looseTags = [];
                    index = endPoint;
                    continue;
                }
                else {
                    let offset = 0;
                    if (splitText[1].endsWith(","))
                        offset = 1;
                    let value = splitText[1].substring(0, splitText[1].length - offset);
                    properties.push({
                        comment: this.getMatchedComment(index, looseTags),
                        property: prop,
                        value: value
                    });
                    looseTags = [];
                    continue;
                }
                continue;
            }
            else {
                //if (line.endsWith("{"))
                if (utils.isIn(line, "{")) {
                    let endPoint = utils.getClosingBrace(documentArray, index, documentArray[index].lastIndexOf("{")).lineIndex;
                    index = endPoint;
                    continue;
                }

                // It would be possible to declare the value property, but we can just check when we print
                properties.push({
                    comment: this.getMatchedComment(index, looseTags),
                    property: line.substring(0, line.length - 1)

                });
                looseTags = [];
                continue;
            }
        }

        return properties;
    }


    /**
     *
     * @param {string[]} documentArray
     * @param {int} lineIndex
     * @returns {VarBlock}
     */
    extractVarBlock(documentArray, lineIndex) {
        // Var doesn't necessarily mean it's an object
        let declare = documentArray[lineIndex].trim();

        let braceChar = 0;//documentArray[lineIndex].lastIndexOf("{");
        let endPoint = 0;//utils.getClosingBrace(documentArray, lineIndex, braceChar).lineIndex;

        let increment = 1;
        if (!utils.isIn(declare, "{") && !utils.isIn(declare, ";") && !utils.isIn(declare, "[")) {

            declare = declare + documentArray[lineIndex + 1].trim();
            increment++;
            braceChar = documentArray[lineIndex + 1].lastIndexOf("{");
            endPoint = utils.getClosingBrace(documentArray, lineIndex + 1, braceChar).lineIndex;
        }
        else {
            braceChar = documentArray[lineIndex].lastIndexOf("{");
            endPoint = utils.getClosingBrace(documentArray, lineIndex, braceChar).lineIndex;
        }
        /**
         * Add one to the lineIndex to prevent registering the var declaration as a function within it
         * @type {FunctionDeclaration[]}
         */
        let functions = this.extractFunctionDeclarations(documentArray, lineIndex + increment, endPoint);

        let properties = this.extractVarProperties(documentArray, lineIndex + increment, endPoint);

        return {
            startLine: lineIndex,
            endLine: endPoint,
            functions: functions,
            properties: properties,
            declaration: declare
        }
    }

    /**
     *
     * @param {string[]} documentArray
     * @param {int} lineIndex
     * @returns {ClassBlock}
     */
    extractClassBlock(documentArray, lineIndex) {
        let braceChar = documentArray[lineIndex].lastIndexOf("{");
        let endPoint = utils.getClosingBrace(documentArray, lineIndex, braceChar).lineIndex;

        let isChildClass = utils.isIn(documentArray[lineIndex], "extends");

        let declare = documentArray[lineIndex].trim();

        if (!utils.isIn(declare, "{")) {
            declare = declare + documentArray[lineIndex + 1].trim();
        }

        let functions = this.extractFunctionDeclarations(documentArray, lineIndex + 1, endPoint);

        return {
            startLine: lineIndex,
            endLine: endPoint,
            functions: functions,
            child: isChildClass,
            declaration: declare
        };
        //return functions;
    }



    /**
     * Parses through the string array one line at a time and identifies and extracts doc comments and their method stubs.
     *
     * @param {string[]} documentArray
     */
    extract(documentArray) {


        /**
         * @type {FunctionDeclaration[]} looseFunctions
         */
        let looseFunctions = [];

        /**
         * @type {VarDeclaration[]}
         */
        let vars = [];
        /**
         * @type {string[]}
         */
        let looseTags = [];

        let inFunctionClosure = false;
        let returnStatement = "";
        let classReturnStatement = false;
        /**
         *
         * @type {ClassDeclaration[]}
         */
        let classes = [];

        this.collectDocComments(documentArray);

        for (let lineIndex = 0; lineIndex < documentArray.length; lineIndex++) {

            lineIndex = this.getNextIndex(documentArray, lineIndex, looseTags);
            let line = documentArray[lineIndex].trim();



            if (line.startsWith("define(")) {
                inFunctionClosure = true;
            }

            if (line.startsWith("return")) {
                if (inFunctionClosure && !classReturnStatement) {
                    if (utils.isIn(line, "class")) {
                        classReturnStatement = true;
                    }
                    else {
                        returnStatement = line + utils.getClosingString(line) + ";";
                    }

                }
            }

            ///////////////////////////////////

            let otherType = ( (utils.isIn(line, "=") || utils.isIn(line, "return ")) && utils.isIn(line, "class "));

            if (line.startsWith("class ") || otherType) {

                let comment = this.getMatchedComment(lineIndex, looseTags);
                let classBlock = this.extractClassBlock(documentArray, lineIndex);

                let splitText = classBlock.declaration.split(/\s*class\s*/);

                let classSplit = splitText[1].split(/\s+/);


                let className = classSplit[0];
                if (className === "extends")
                    className = "";

                if (otherType)
                    className = splitText[0].split(/\s+/)[1];

                classes.push({
                    comment: comment,
                    classBlock: classBlock,
                    child: utils.isIn(classBlock.declaration, "extends"),
                    tags: looseTags,
                    name: className,
                    memberFunctions: [],
                    memberProperties: []
                });

                looseTags = [];
                lineIndex = classBlock.endLine;
                continue;
            }

            /////////////////////////////////

            if (line.startsWith("var") || line.startsWith("const") || line.startsWith("let")) {

                if (!line.endsWith("{")) {
                    if (line.endsWith(";") || line.endsWith(",")) {
                        continue;
                    }
                    if (!documentArray[lineIndex + 1].trim().startsWith("{")) {
                        // The next line doesn't have the brace
                        continue;
                    }
                    if (!utils.isIn(line, "=")) {
                        continue;
                    }
                }

                if (utils.isIn(line, "function")) {

                    let comment = this.getMatchedComment(lineIndex, looseTags);

                    let funct = this.processFunctionBlock(documentArray, lineIndex);

                    looseFunctions.push({
                        comment: comment,
                        funct: funct,
                        constructor: utils.isIn(funct.declaration, "constructor"),
                        hasPrototype: false,
                        prototype: utils.isIn(funct.declaration, "prototype"),
                        tags: looseTags
                    });

                    looseTags = [];

                    lineIndex = funct.endLine;

                    continue;
                }


                let varDec = this.extractVar(documentArray, lineIndex, looseTags);
                vars.push(varDec);

                looseTags = [];
                lineIndex = varDec.varBlock.endLine;

                continue;
            }

            ///////////////////////

            if (line.startsWith("define(") && !utils.isIn(line, "function")) {
                lineIndex = lineIndex + 1;
                continue;
            }

            /////////////////////////

            if (line.startsWith("function") || utils.isIn(line, "prototype.")) {
                if (this.checkAgainstReservedWords(line))
                    continue;
                let functionDec = this.extractLooseFunction(documentArray, lineIndex, looseTags);
                looseFunctions.push(functionDec);

                looseTags = [];

                lineIndex = functionDec.funct.endLine;
                continue;
            }

            /////////////////////

            let endPoint = 0;

            for (let i = 0; i < classes.length; i++) {
                if (typeof classes[i].name === "undefined") {
                    continue;
                }
                if (line.startsWith(classes[i].name)) {
                    //console.log(line);
                    if (utils.isIn(line, "function")) {
                        let looseFunct = this.extractLooseFunction(documentArray, lineIndex, looseTags);
                        classes[i].memberFunctions.push(looseFunct);
                        endPoint = looseFunct.funct.endLine;
                        looseTags = [];
                        break;

                    }
                    else// if (line.endsWith("{"))
                    {
                        let looseVar = this.extractVar(documentArray, lineIndex, looseTags);
                        classes[i].memberProperties.push(looseVar);
                        endPoint = looseVar.varBlock.endLine;
                        looseTags = [];
                        break;
                    }
                }
            }

            if (endPoint > 0) {
                lineIndex = endPoint;
                continue;
            }

            ////////////////////

            if (line.endsWith("{") && !utils.isIn(line, "define") && !line.startsWith("function") && !line.startsWith("(function"))//!utils.isIn(line, "function"))
            {
                lineIndex = utils.getClosingBrace(documentArray, lineIndex, documentArray[lineIndex].lastIndexOf("{")).lineIndex;
                continue;
            }


        }


        this.updateFunctionPrototypes(looseFunctions);

        return {
            classDeclarations: classes,
            varDeclarations: vars,
            looseFunctions: looseFunctions,
            inFunctionClosure: inFunctionClosure,
            returnStatement: returnStatement,
            docComments: this.docComments
        };
    }

    /**
     *
     * @param {string[]} documentArray
     * @param {int} lineIndex
     * @param {string[]} looseTags
     * @returns {FunctionDeclaration}
     */
    extractLooseFunction(documentArray, lineIndex, looseTags) {
        let functionBlock = this.processFunctionBlock(documentArray, lineIndex);
        let comment = this.getMatchedComment(functionBlock.startLine, looseTags);

        return {
            comment: comment,
            funct: functionBlock,
            constructor: false,
            hasPrototype: false,
            prototype: utils.isIn(documentArray[lineIndex], "prototype"),
            tags: looseTags
        };
    }

    /**
     *
     * @param {string[]} documentArray
     * @param {int} lineIndex
     * @param {string[]} looseTags
     * @returns {VarDeclaration}
     */
    extractVar(documentArray, lineIndex, looseTags) {
        let comment = this.getMatchedComment(lineIndex, looseTags);

        let varBlock = this.extractVarBlock(documentArray, lineIndex);


        return {
            comment: comment,
            varBlock: varBlock,
            tags: looseTags
        };

    }

    /**
     * Finds, removes, and returns the doc comment that matches with the line given
     *
     * @param {int} startLine
     * @param {string[]} looseTags
     * @returns {CommentBlock}
     */
    getMatchedComment(startLine, looseTags) {

        let index = this.docComments.findIndex(function (docComment) {
            let commentEnd = docComment.endLine;
            let diff = (startLine - commentEnd) - (looseTags.length + 1);

            return (diff === 0 || diff === 1)
        });

        if (index < 0)
        {
            return undefined;
        }
        let splice = this.docComments.splice(index, 1);
        return splice[0];
    }

    /**
     * Evaluates a line of the document array and will process comments, tags and empty lines,
     *  while advancing the lineIndex when it finishes.
     *
     * @param {string[]} documentArray
     * @param {int} lineIndex
     * @param {string[]} looseTags
     * @returns {int}
     */
    handleCommentsAndTags(documentArray, lineIndex, looseTags) {
        if (lineIndex >= documentArray.length) {
            utils.exLog("Out of bounds on " + lineIndex);
            return -1;
        }
        let line = documentArray[lineIndex].trim();

        if (line.length === 0) {
            // It's empty, so nothing should happen
            // But we increment lineIndex so that the caller will
            lineIndex++;
        }
        if (line.startsWith("/*")) {
            let endPoint = lineIndex;
            for (let i = lineIndex; i < documentArray.length; i++) {
                if (utils.isIn(documentArray[i], "*/")) {
                    endPoint = i;
                    break;
                }
            }
            lineIndex = endPoint + 1;

        }
        if (line.startsWith("//")) {
            lineIndex++;
        }
        if (line.startsWith("@")) {
            let splits = line.split(/\s+/);
            if (splits.length === 1)
            {
                looseTags.push(line);
                utils.exLog("Found tag: " + line);
                lineIndex++;
            }
        }

        return lineIndex;
    }

    /**
     *
     * @param documentArray
     * @param lineIndex
     */
    collectDocComments(documentArray, lineIndex)
    {
        for (let lineIndex = 0; lineIndex < documentArray.length; lineIndex++)
        {

        let line = documentArray[lineIndex].trim();
        if (line.startsWith("/**")) {
            this.docComments.push(this.processCommentBlock(documentArray, lineIndex));
            lineIndex = this.docComments[this.docComments.length - 1].endLine + 1;

            }
        }

    }
}

module.exports = new FileProcessor();