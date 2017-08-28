/**
 * @type {FileProcessor}
 */
let fileProc = require('./StubExtraction/FileProcessor.js');
let filePrint = require('./StubExtraction/FilePrinter.js');

fs = require('fs');

let testFile = "AudioPlayer";

let inputFile = "../test/" + testFile + ".js";
let outputFile = "../output/" + testFile + ".js";

let docText = fs.readFileSync(inputFile, "utf8");
let documentArray = docText.split("\n");
let procResult = fileProc.processFile(documentArray);

//fileProc.printToFile(outputFile);
filePrint.printToFile(outputFile, procResult.extraction, documentArray);

console.log(procResult);
//fs.writeFileSync(outputFile, fileProc.processFile(inputFile), "utf8");
