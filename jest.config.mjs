export default {
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true
            }
        ]
    },
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    testEnvironment: "node",
    testRegex: "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
    moduleFileExtensions: [
        "ts",
        "tsx",
        "js"
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/test/",
        "/dist/",
        "/src/impl/english.ts"
    ],
    coverageThreshold: {
        "global": {
            "branches": 90,
            "functions": 95,
            "lines": 95,
            "statements": 95
        }
    },
    globals: {},
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/zone.ts"
    ]
};
