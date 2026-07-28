# gtm-docs

Developer documentation for the GTM API, served at [docs.gtm-api.com](https://docs.gtm-api.com):
quickstart, guides, MCP setup, and the generated reference for the whole public contract. The
largest part is the LinkedIn API reference (150 endpoints: accounts, people and company search,
messaging, enrichment, mass actions), next to the identity and orchestration services.

Related:

- [docs.gtm-api.com](https://docs.gtm-api.com) - the live site
- [linkedin-mcp](https://github.com/gtm-api/linkedin-mcp) - the same LinkedIn API packaged as an
  MCP server for AI agents
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

## Preview locally

```bash
npm i -g mint
mint dev
```

`mint dev` serves the site on `http://localhost:3000` and validates `docs.json` on start.

## Writing rules

Every page ships under the monorepo writing rules (root `CLAUDE.md` "Writing style: no LLM
tells" and `marketing/BRAND_RULES.md`): no em or en dash as punctuation, no filler
vocabulary, no legacy-brand references, and the brand name is `GTM API` everywhere. Run the
hard-fail greps from `marketing/aeo/articles/04-ARTICLE-CHECKLIST.md` §1 and §2 over changed
pages before publishing.

## Deploying

Mintlify deploys this directory through its GitHub App on push. The rollout steps (workspace
subdomain rename, GitHub repo creation, custom domain `docs.gtm-api.com`, redirects for the
old `/docs/*` links) live in `marketing/aeo/DOCS_MINTLIFY_RUNBOOK.md`.

This directory IS the standalone GitHub repo the Mintlify GitHub App watches:
`github.com/gtm-api/gtm-docs` (Mintlify deploys from GitHub, not Bitbucket). The working
copy lives inside the monorepo checkout at `marketing/docs/gtm.docs/`, gitignored by the
umbrella repo (same pattern as `product/openapi/gtm.openapi.tech`), so `sync-openapi.sh`
keeps working: the monorepo checkout is its expected home. Push to `master` to deploy.
