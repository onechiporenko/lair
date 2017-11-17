module.exports = function(config) {
  config.set({
    files: [],
    testRunner: "mocha",
    mutator: "typescript",
    transpilers: ["typescript"],
    tsconfigFile: "tsconfig.json",
    reporter: ["clear-text", "progress", "html"],
    testFramework: "mocha",
    coverageAnalysis: "off",
    // logLevel: "trace",
    mutate: ["lib/**/*.ts", "!lib/decorators.ts"]
  });
};
