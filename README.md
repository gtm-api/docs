# gtm-docs

Developer documentation for gtm-api, served at [docs.gtm-api.com](https://docs.gtm-api.com):
quickstart, guides, MCP setup, and the generated reference for the whole public contract. The
largest part is the LinkedIn API reference (150 endpoints: accounts, people and company search,
messaging, enrichment, mass actions), next to the identity and orchestration services.

Related:

- [docs.gtm-api.com](https://docs.gtm-api.com) - the live site
- [linkedin-api-examples](https://github.com/gtm-api/linkedin-api-examples) - runnable curl and
  TypeScript snippets for the LinkedIn endpoints
- [linkedin-mcp](https://github.com/gtm-api/linkedin-mcp) - the same LinkedIn API packaged as an
  MCP server for AI agents
- [LinkedIn API in 2026: The Developer Guide](https://gtm-api.com/linkedin-api/) - how the
  official, third-party and MCP options compare
- [LinkedIn MCP Server](https://gtm-api.com/linkedin-mcp-server/) - when MCP beats calling the
  REST API directly

## Layout

```
gtm.docs/
├── docs.json                  # navigation, theme, branding
├── index.mdx …                # hand-written pages (Guides, MCP, Changelog tabs)
├── api-reference/
│   ├── overview.mdx           # hand-written intro to the reference
│   └── {linkedin,id,orchestration}/openapi.yaml   # GENERATED, synced copies
├── sync-openapi.sh            # pulls the specs in from gtm.openapi.public
└── logo/, favicon.svg         # brand assets (same set as the app)
```

## The api-reference specs are generated. Do not edit them here.

The three `openapi.yaml` files are byte-identical copies of
`product/openapi/gtm.openapi.public/services/<svc>/openapi.yaml`, which is itself projected
from the Zod MCP tool registry in `product/mcp/gtm.mcp`. The chain is one-way:

```
Zod registry  →  pnpm openapi:public  →  gtm.openapi.public  →  ./sync-openapi.sh  →  here
```

To update the reference: change the tool definition, regenerate
(`cd product/mcp/gtm.mcp && pnpm openapi:public`), then run `./sync-openapi.sh`.
`./sync-openapi.sh --check` fails on any drift between the copies and the source; run it
before committing.

## Request examples are executed, not just read

Every request example on these pages is sent, at test time, to the backend it documents:
each service's suite (`tests/Feature/Docs/DocsExamplesTest` in gtm.service.linkedin, id and
orchestration) lifts the examples with `gtm.lib.common` `Core/Testing/DocsExamples` and posts
them to the service's validate twin (`api/_validate/...`), where the request is authenticated
and validated exactly as on the real route and the action never runs. An example the backend
would refuse turns that service's pipeline red, naming the page and line. The suite reads
this checkout from the monorepo on a developer's machine and clones this public repo in CI.

For an example to count it must have one of two shapes; anything else is prose to the gate:

- a `bash` block with a `curl` command against `https://app.gtm-api.com/<service>/v4/<path>`,
  using `-X`, `-H` and `-d '<json>'` (a comment line above the command is fine);
- a `json` block whose fence title is the request line, for example
  ```` ```json POST /orchestration/v4/api/mass-actions/preview ````. Mintlify shows the title
  as the block's label, so the reader sees what the test sees. A `json` block without one is a
  response sample and is never sent.

Ids in an example are placeholders of the form `<prefix>_YOUR_<NAME>` (`ln_ac_YOUR_ACCOUNT`,
`bl_sb_YOUR_SUB`); the suite replaces them with rows it creates. Routes outside `/api`
(`/auth/*`, `/oauth/*`) have no twin and are left out.

## Preview locally

```bash
npm i -g mint
mint dev
```

`mint dev` serves the site on `http://localhost:3000` and validates `docs.json` on start.

## Writing rules

Every page ships under the monorepo writing rules (root `CLAUDE.md` "Writing style: no LLM
tells" and `marketing/BRAND_RULES.md`): no em or en dash as punctuation, no filler
vocabulary, no legacy-brand references, and the brand name is `gtm-api` everywhere. Run the
hard-fail greps from `marketing/aeo/articles/04-ARTICLE-CHECKLIST.md` §1 and §2 over changed
pages before publishing.

## Deploying

Push to `main` and the site rebuilds. That is the whole flow: Mintlify watches this repo
through its GitHub App, runs a `Mintlify Deployment` check on the push, and
[docs.gtm-api.com](https://docs.gtm-api.com) picks the build up within about a minute.

This directory IS the standalone GitHub repo Mintlify watches: **`github.com/gtm-api/docs`**,
branch **`main`** (the branch is `main`, not `master` like the rest of the monorepo, because
Mintlify's connect wizard creates the repo itself from its template and seeds it that way).
The working copy lives inside the monorepo checkout at `marketing/docs/gtm.docs/`, gitignored
by the umbrella repo, so `sync-openapi.sh` keeps working: the monorepo checkout is its
expected home.

Workspace details, the domain setup and the connect-flow gotchas are in
`marketing/aeo/DOCS_MINTLIFY_RUNBOOK.md`.
