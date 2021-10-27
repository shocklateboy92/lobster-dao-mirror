import { LogLevel, LogService } from "@sorunome/matrix-bot-sdk";

const MATRIX_KEY = process.env.MATRIX_KEY || keyRequiredError("MATRIX_KEY");
const MATRIX_HOST = process.env.MATRIX_HOST || keyRequiredError("MATRIX_HOST");
const BLOB_STORAGE_KEY =
    process.env.BLOB_STORAGE_KEY || keyRequiredError("BLOB_STORAGE_KEY");
const STORAGE_DIR = process.env.STORAGE_DIR || "./";

function keyRequiredError(name: string): string {
    throw new Error(`Environment variable ${name} is required`);
}

LogService.setLevel(LogLevel.WARN);

console.log("Hello world");
