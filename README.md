IDL Embedding Proof Of Concept
====

# Introduction

This project shows a rough proof-of-concept of how to embed Anchor
IDLs inside deployed programs on the Solana block chain.  It uses new
ELF sections to store additional meta-data about the program, as well
as the Anchor IDL itself.  The manifest serves as the root description
for discovering other traits about the binary, that are outside the
scope of the ELF standard.

This is part of a bigger solution we're building, but it demonstrates
how we're starting to think about the problem of including more
information inside deployed programs.

## Future Considerations

- [ ] Compressed sections using `SHF_COMPRESSED` rather than plain-text.
- [ ] Better definition of the manifest structure (e.g. JSON schema).

# Prerequisites

In order to try this demo, you need the following in your path:

- `node`
  https://nodejs.org/en

- `pnpm`
  https://pnpm.io

- `solana` CLI and `anchor`
  https://solana.com/docs/intro/installation

- LLVM's tooling (the build that comes with Solana's tooling works, but so should other builds)g

# Running The Demo

1. Install npm packages i.e. `pnpm install`

1. Run the build i.e. `./build`

1. Run a Solana test validator e.g. `solana-test-validator`

1. Deploy the Anchor project i.e. `(cd counter_anchor && anchor deploy)`

1. Run the demo e.g. `ANCHOR_WALLET=$HOME/.config/solana/id.json npx tsx run.ts idpSeYFgfK6oheFdXciWNDZHmmDwuHvetG4gJWTwopX`

You should see the Anchor program's IDL discovered from the binary in the validator, and instructions should be executed against it.
