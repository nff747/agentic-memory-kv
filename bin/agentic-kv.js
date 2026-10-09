#!/usr/bin/env node
import { runCLI } from '../src/cli.js';
const code = runCLI(process.argv);
process.exit(code);
