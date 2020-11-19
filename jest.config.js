module.exports = {
  transform: {
    ".(ts|tsx)": "ts-jest"
  },
  testEnvironment: "jsdom",
  "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js"
  ],
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "/test/",
    "/dist/"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  },
  "globals": {
    // "window": {},
    // "document": {}
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/zone.ts",
    "!src/luxonFilled.ts",
    "!src/index.d.ts",
    "!src/types/intl.d.ts"
  ]
};
