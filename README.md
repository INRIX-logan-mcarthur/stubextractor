# Stub Extractor

A utiltity to parse through a directory of JavaScript files and to print out stubs of all of the classes, functions, and variables present in the directory.

# Usage

The parser requires Node.js to run, and takes two arguments from the command line for the input and output directories.

```
node src/FileTreeExtractor.js (Input) (Output)
```

# Cautions

Due to being an automated parser, there will be a degree of manual cleanup required when the codebase does not align with the parser's functionality.

For instance, anonymous classes are not properly output, and require manually giving a class name in the stubbed file.

There are also the risks that potentially sensitive information could be leaked when sharing the output of this parser.

For instance, API Keys that are hard-coded into variable properties can end up included in the output.

There are also concerns that private functions and variables could be exposed, as the parser must make a decision on whether or not a class should be documented.

It is recommended to load the stubbed files into an IDE and run a code inspection on them. Doing so should reveal any syntax errors that have crept in due to the parser.

