var fs = require('fs');
var regex = /<key>className<\/key>\W*<string>(.*)<\/string>\W*<key>displayName<\/key>\W*<string>(.*)<\/string>/g;
var currentClass = null;
var classesToParse = [];

// ## Exit if invalid usage
if (!((process.argv.length == 4 && process.argv[2] == '-i') || (process.argv.length == 6 && process.argv[2] == '-i' && process.argv[4] == '-c'))) {
  console.log("Usage: node index.js -i input.txt [-c classes.txt]");
  process.exit();
}

// ## Read Classes File
if(process.argv[5]) {
  var lineReader = require('readline').createInterface({
    input: fs.createReadStream(process.argv[5])
  });

  lineReader.on('line', function (line) {
    classesToParse.push(line);
  });

  lineReader.on('close', function () {
    console.log("// Parsing Classes: " + classesToParse);
    parseFile();
  });
} else {
    parseFile();
}


// ## Parse .dat File
function parseFile() {
  fs.readFile(process.argv[3], 'utf8', function(err, contents) {
    var isFinished = false;
    while (isFinished == false) {
      var entry = getNextEntry(contents);
      if(!entry) {
        isFinished = true;
        if(currentClass !== null) console.log("%end");
        break;
      }
      if(classesToParse.length == 0 || classesToParse.indexOf(entry[1]) !== -1) {
        if(currentClass !== entry[1]) {
          if(currentClass != null) {
            console.log("%end");
            console.log("");
          }
          currentClass = entry[1];
          console.log("%hook " + currentClass);
        }
        // # print method
        var methodDeclaration = "";
        var method = entry[2];
        if(method.indexOf(".") == -1) {
          var paramRegex = /\W([a-zA-Z0-9_.-]*):(\([a-zA-Z0-9_.\s\?\*]*\))/g
          if(method.match(paramRegex)) {
            var counter = 97;
            method = method.replace(paramRegex, function(a) {
              return a.replace(paramRegex, " $1:" + "$2" + String.fromCharCode(counter++));
            });
          }
          if(/(\+|-)\(void\)/g.test(method)) {
            methodDeclaration = method + ' {\n\t%log;\n\t%orig;\n\t}\n';
          } else {
            var match = /(\+|-)\(([\w\s]*)\)/g.exec(method);
            if(match && match[2]) {
              var type = match[2];
              methodDeclaration = method + ' {\n\t%log;\n\t' + type + ' value = %orig;\n\tNSLog(@"' + method + ' returned: ' + getLogFormatterFor(type) + '", value);\n\treturn value;\n}\n';
            }
          }
          console.log(methodDeclaration);
        }
      }
    }
  });
}

// ## Get Log Formatter
function getLogFormatterFor(type) {
  switch (type) {
    case "int":
    return "%d";
    case "float":
    return "%f";
    case "double":
    return "%f";
    case "long int":
    return "%li";
    case "short int":
    return "%i";
    case "char":
    return "%c";
    case "signed int":
    return "%i";
    case "unsigned int":
    return "%u";
    case "unsigned short":
    return "%hu";
    case "octal":
    return "%o";
    case "hexa":
    return "%X";
    case "long long":
    return "%lld";
    case "long double":
    return "%Lf";
    case "unsigned long long":
    return "%llu";
    case "bool":
    return "%d";
    case "id":
    return "%@";
    default:
    return "%@";
  }
}

// ## Gets the next entry
function getNextEntry(contents) {
  var matched = regex.exec(contents);
  if(!matched) return null;
  return matched;
}
