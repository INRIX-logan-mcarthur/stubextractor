

/**
 *
 * @param {string} message
 */
function exLog(message) {
    let doLog = false;
    if (doLog) {
        console.log(message);
    }
}


/**
 *
 * @param {string[]} documentArray
 * @param {int} lineNumber
 * @param {int} charNumber
 */
function getClosingBrace(documentArray, lineNumber, charNumber) {

    return getClosingBlock(documentArray, lineNumber, charNumber, "{", "}");
}

function getClosingBracket(documentArray, lineNumber, charNumber) {
    return getClosingBlock(documentArray, lineNumber, charNumber, "[", "]");
}

function getClosingBlock(documentArray, lineNumber, charNumber, openingChar, closingChar)
{
    // Things that would make the parser ignore a brace
    //  A string literal
    //  A comment
    //  A block comment

    let depth = 0;
    // depth will increment and decrement as the parser finds braces
    let charIndex = charNumber;
    let inBlockComment = false;

    for (let lineIndex = lineNumber; lineIndex < documentArray.length; lineIndex++)
    {
        let line = documentArray[lineIndex];
        let lastChar = "";
        let inStringLiteral = false;
        let inLineComment = false;


//        if (lineIndex === 1126)
//        {
//            console.log("End of class line");
//        }

        while (charIndex < documentArray[lineIndex].length)
        {

            let thisChar = documentArray[lineIndex].charAt(charIndex);

            if (!inBlockComment && (thisChar === "\"" || thisChar === "\'"))
            {
                inStringLiteral = !inStringLiteral;
            }
            if (!inBlockComment && (thisChar === "/" && lastChar === "/"))
            {
                // A line comment
                if (!inStringLiteral)
                {
                    inLineComment = true;
                }

            }
            if (!inStringLiteral && !inLineComment)
            {
                if (lastChar === "*" && thisChar === "/")
                {
                    inBlockComment = false;
                }
                if (lastChar === "/" && thisChar === "*")
                {
                    inBlockComment = true;
                }
            }


            if (!inBlockComment && !inLineComment && !inStringLiteral)
            {
                if (thisChar === openingChar)
                {
                    depth++;
                    exLog("Depth: " + depth + " increments at Character: " + charIndex + " in line: " + lineIndex + " from| " + line);
                }
                if (thisChar === closingChar)
                {
                    depth--;
                    exLog("Depth: " + depth + " decrements at Character: " + charIndex + " in line: " + lineIndex + " from| " + line);
                }
            }

            if (depth === 1)
            {
                //console.log("one");
            }
            if (depth === 0)
            {
                return {
                    lineIndex: lineIndex,
                    charIndex: charIndex
                };
            }

            charIndex++;
            lastChar = thisChar;
        }

        inLineComment = false;
        charIndex = 0;
    }

    return {};
}


/**
 *
 * @param {string} line
 * @returns {string}
 */
function getClosingString(line)
{
    let close = "";
    let stack = [];
    for (let i = 0; i < line.length; i++)
    {
        let thisChar = line.charAt(i);
        switch (thisChar)
        {
            case "(":
            case "[":
            case "{":
                stack.push(thisChar);
                break;
            case ")":
                //if (stack[stack.length-1] === ")")
                stack.pop();
                break;
            case "]":
                //if (stack[stack.length-1] === "]")
                stack.pop();
                break;
            case "}":
                //if (stack[stack.length-1] === "}")
                stack.pop();
                break;
        }
    }

    for (let i = stack.length - 1; i >= 0; i--)
    {
        switch (stack[i])
        {
            case "(":
                close = close + ")";
                break;
            case "[":
                close =close + "]";
                break;
            case "{":
                close = close + "}";
                break;
        }
    }
    return close;
}


/**
 *
 * @param {string} text The string to search through
 * @param {string} token The token to search for
 * @returns {boolean}
 */
function isIn(text, token) {
    return text.indexOf(token) !== -1;
}


module.exports = {
    getClosingBrace: getClosingBrace,
    getClosingBracket: getClosingBracket,
    getClosingString: getClosingString,
    exLog: exLog,
    isIn: isIn
};