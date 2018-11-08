module.exports = function(config) {
  config.set({
    testRunner: "mocha",
    mutator: "typescript",
    transpilers: ["typescript"],
    tsconfigFile: "tsconfig.json",
    reporters: ["clear-text", "progress", "html"],
    testFramework: "mocha",
    coverageAnalysis: "off",
    // logLevel: "trace",
    mutate: ["lib/**/*.ts", "!lib/decorators.ts"],
    mochaOptions: {
      files: ["dist/tests/**/*.js"]
    },
    thresholds: {break: 50, high: 80, low: 60}
  });
};
