---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test in locale (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-07T08:17:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a25236a707860307cc324f32752ad13a53e448bee9341d8df2e11655561e841c
    source_path: reference/test.md
    workflow: 15
---

# Test

- Kit completo per i test (suite, live, Docker): [Testing](/it/help/testing)

- `pnpm test:force`: termina qualsiasi processo gateway residuo che occupa la porta di controllo predefinita, quindi esegue l'intera suite Vitest con una porta gateway isolata in modo che i test del server non vadano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Le soglie globali sono 70% per linee/branch/funzioni/statement. La copertura esclude gli entrypoint con forte integrazione (wiring CLI, bridge gateway/telegram, server statico webchat) per mantenere l'obiettivo concentrato sulla logica testabile con test unitari.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: espande i percorsi git modificati in lane Vitest mirate quando il diff tocca solo file sorgente/test instradabili. Le modifiche a config/setup continuano invece a usare l'esecuzione nativa dei progetti root, così le modifiche al wiring rilanciano in modo esteso quando necessario.
- `pnpm test`: instrada target espliciti di file/directory attraverso lane Vitest mirate. Le esecuzioni senza target ora eseguono dieci configurazioni shard in sequenza (`vitest.full-core-unit-src.config.ts`, `vitest.full-core-unit-security.config.ts`, `vitest.full-core-unit-ui.config.ts`, `vitest.full-core-unit-support.config.ts`, `vitest.full-core-contracts.config.ts`, `vitest.full-core-bundled.config.ts`, `vitest.full-core-runtime.config.ts`, `vitest.full-agentic.config.ts`, `vitest.full-auto-reply.config.ts`, `vitest.full-extensions.config.ts`) invece di un unico enorme processo root-project.
- I file di test selezionati `plugin-sdk` e `commands` ora vengono instradati attraverso lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi pesanti a runtime nelle lane esistenti.
- Anche i file sorgente helper selezionati `plugin-sdk` e `commands` mappano `pnpm test:changed` su test sibling espliciti in quelle lane leggere, così piccole modifiche agli helper evitano di rieseguire le suite pesanti supportate dal runtime.
- `auto-reply` ora è inoltre suddiviso in tre configurazioni dedicate (`core`, `top-level`, `reply`) così che l'harness reply non domini i test più leggeri di stato/token/helper di livello superiore.
- La configurazione base di Vitest ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le configurazioni del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` esegue `vitest.extensions.config.ts`.
- `pnpm test:extensions`: esegue le suite di estensioni/plugin.
- `pnpm test:perf:imports`: abilita il reporting Vitest della durata degli import e del dettaglio degli import, continuando però a usare l'instradamento per lane mirate per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` misura il percorso changed-mode instradato rispetto all'esecuzione nativa root-project per lo stesso diff git commitato.
- `pnpm test:perf:changed:bench -- --worktree` misura l'insieme di modifiche del worktree corrente senza prima fare commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- Integrazione gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oppure `pnpm test:gateway`.
- `pnpm test:e2e`: esegue i test smoke end-to-end del gateway (pairing WS/HTTP/nodo multi-istanza). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log dettagliati.
- `pnpm test:live`: esegue i test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per togliere lo skip.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI in Docker, effettua l'accesso tramite Open WebUI, controlla `/api/models`, quindi esegue una vera chat proxata tramite `/api/chat/completions`. Richiede una chiave modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine Open WebUI esterna e non è pensato per essere stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway preconfigurato e un secondo container client che avvia `openclaw mcp serve`, quindi verifica il rilevamento della conversazione instradata, la lettura delle trascrizioni, i metadati degli allegati, il comportamento live della coda eventi, l'instradamento degli invii in uscita e le notifiche in stile Claude su canale + permessi attraverso il vero bridge stdio. L'asserzione sulle notifiche Claude legge direttamente i frame MCP stdio grezzi in modo che lo smoke rifletta ciò che il bridge emette davvero.

## Gate PR locale

Per i controlli locali di land/gate della PR, esegui:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` ha flake su un host carico, rilancialo una volta prima di considerarlo una regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facoltativi: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Reply with a single word: ok. No punctuation or extra text.”

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

## Benchmark dell'avvio CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Uso:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: entrambi i preset

L'output include `sampleCount`, avg, p50, p95, min/max, distribuzione di exit-code/signal e riepiloghi del massimo RSS per ogni comando. `--cpu-prof-dir` / `--heap-prof-dir` facoltativi scrivono profili V8 per esecuzione così che misurazione dei tempi e acquisizione dei profili usino lo stesso harness.

Convenzioni per l'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna il fixture baseline versionato in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionato:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con il fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è facoltativo; serve solo per gli smoke test di onboarding in container.

Flusso completo da cold-start in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script pilota il wizard interattivo tramite uno pseudo-tty, verifica i file config/workspace/session, quindi avvia il gateway ed esegue `openclaw health`.

## Smoke dell'import QR (Docker)

Assicura che `qrcode-terminal` venga caricato nei runtime Node Docker supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```
