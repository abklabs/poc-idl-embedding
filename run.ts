import * as process from "node:process";

import { Program, type Idl } from "@coral-xyz/anchor";
import * as sol from "@solana/web3.js";
import * as elfinfo from "elfinfo";

const log = {
	info: (...args: any) => console.log("INFO:", ...args),
	warning: (...args: any) => console.log("WARNING:", ...args),	
	error: (...args: any) => console.log("ERROR:", ...args),
}

if (process.argv.length < 3) {
	throw new Error("program address required as argument!");
}

const connURL = "http://127.0.0.1:8899";
const programAddr = process.argv[2];

const conn = new sol.Connection(connURL, "confirmed");

const programInfo = await conn.getAccountInfo(new sol.PublicKey(programAddr))

if (programInfo === null) {
	throw new Error(`no account info found for ${programAddr}!`);
}

log.info("found program info", programInfo);

const programDataAddr = programInfo.data.subarray(4);

const programDataInfo = await conn.getAccountInfo(new sol.PublicKey(programDataAddr))
if (programDataInfo === null) {
	throw new Error(`no info found for program data at ${programAddr}!`);
}

// Remove data header, and get to the meat of the ELF binary
const elfRawData = programDataInfo.data.subarray(45)

const parseResult = await elfinfo.open(elfRawData);
const sections = parseResult.elf?.sections;

if (!parseResult.success || sections === undefined) {
	log.error("failed to parse ELF file", parseResult.errors);	
	throw new Error("failed to parse ELF file");
}

if (parseResult.warnings.length > 0) {
	log.warning("warnings found parsing ELF file", parseResult.warnings);
}

function findSection(sectionName: string) {
	for (let section of sections!) {
		if (section.name === sectionName ) {
			return section;
		}
	}

	return undefined;
}

function extractJSONSection(sectionName: string) {
	const section = findSection(sectionName)

	if (section === undefined) {
		throw new Error(`failed to find section '${sectionName}'!`);
	}

	return JSON.parse(elfRawData.subarray(section.offset, section.offset + section.size).toString());
}

const manifest = extractJSONSection('solana.manifest');

log.info("manifest is:", manifest);

let idl: object | undefined;

for (const [name, section] of Object.entries(manifest.sections)) {
	if ((<any>section).type !== "AnchorIDL") {
		continue;
	}

	idl = extractJSONSection(name);
}

if (idl === undefined) {
	console.log(`ERROR: couldn't find IDL!`);
	process.exit(1);
}

log.info("discovered IDL is:", idl);

export const program = new Program(idl as Idl);
const counterAccount = new sol.Keypair();

await program.methods.initializeCounter().accounts({
	counter: counterAccount.publicKey
}).signers([counterAccount]).rpc();


for (let i = 0; i < 5; i ++) {
	await program.methods
		.increment()
		.accounts({
			counter: counterAccount.publicKey
		})
		.rpc();

	log.info("account:", await program.account["counter"].fetch(counterAccount.publicKey));
}

log.info("done running");
