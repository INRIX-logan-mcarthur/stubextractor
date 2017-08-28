/**
 * @type {FileProcessor}
 */
let fileProc = require('./StubExtraction/FileProcessor.js');
let filePrint = require('./StubExtraction/FilePrinter.js');

fs = require('fs');

let targetDirectory = "./testFiles/common";
let outputDirectory = "./output/common";

if (process.argv.length > 2)
{
    targetDirectory = process.argv[2];
    outputDirectory = process.argv[3];
}

let maxDepth = 10;
let printEachFileResult = false;
let doPrint = true;

/**
 *
 * @type {ProcessResult}
 */
let grandResult = {
    classes: 0,
    classFunctions: 0,
    vars: 0,
    varFunctions: 0,
    varProperties: 0,
    looseFunctions: 0,
    extraction: {}
};

/**
 *
 * @param {string} targetDir
 * @param {string} outputDir
 * @param {int} depth
 */
function recurseDirectory(targetDir, outputDir, depth)
{
    //console.log(targetDir);
    if (depth === 0)
    {
        console.log("Reached maximum depth before completion.");
        return;
    }
    if (!fs.existsSync(outputDir))
    {
        fs.mkDirSync(outputDir);
    }
    if (fs.existsSync(targetDir))
    {
        let files = fs.readdirSync(targetDir, "utf8");
        for ( let fileIndex = 0; fileIndex < files.length; fileIndex++)
        {
            let target = targetDir + "/" + files[fileIndex];
            let stats = fs.lstatSync(target);
            if (stats.isDirectory())
            {
                if (!fs.existsSync(outputDir + "/" + files[fileIndex]))
                {
                    fs.mkdirSync(outputDir + "/" + files[fileIndex]);
                }
                //console.log(targetDir + " is directory");
                recurseDirectory(target,outputDir + "/" + files[fileIndex], depth-1);
                continue;
            }
            console.log(files[fileIndex]);
            if (target.endsWith(".js"))
            {
                let docText = fs.readFileSync(target, "utf8");
                let documentArray = docText.split("\n");
                let processResult = fileProc.processFile(documentArray);

                grandResult.varFunctions += processResult.varFunctions;
                grandResult.classes += processResult.classes;
                grandResult.classFunctions += processResult.classFunctions;
                grandResult.vars += processResult.vars;
                grandResult.looseFunctions += processResult.looseFunctions;
                grandResult.varProperties += processResult.varProperties;

                if (processResult.classFunctions + processResult.varFunctions
                    + processResult.varProperties + processResult.looseFunctions === 0)
                {
//                    console.log(files[fileIndex] + " does not have any data in it");
//                    console.log(target + " does not have any data in it.");
                }

                if (printEachFileResult)
                    console.log(processResult);
                if (doPrint)
                    filePrint.printToFile(outputDir + "/" + files[fileIndex], processResult.extraction, documentArray);
            }

        }
    }
}

recurseDirectory(targetDirectory, outputDirectory, maxDepth);

console.log("End result: ");
console.log(grandResult);
console.log("Printed files: " + doPrint);