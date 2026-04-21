---
read_when:
    - Eseguire o correggere i test
summary: Come eseguire i test in locale (Vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-21T08:29:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# Test

- Kit completo di testing (suite, live, Docker): [Testing](/it/help/testing)

- `pnpm test:force`: termina qualsiasi processo gateway residuo che occupa la porta di controllo predefinita, poi esegue l'intera suite Vitest con una porta gateway isolata così i test del server non entrano in collisione con un'istanza in esecuzione. Usalo quando una precedente esecuzione del gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Questa è una soglia di copertura unit sui file caricati, non una copertura all-file dell'intero repo. Le soglie sono 70% linee/funzioni/statement e 55% branch. Poiché `coverage.all` è false, la soglia misura i file caricati dalla suite di copertura unit invece di trattare ogni file sorgente dei lane suddivisi come non coperto.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: espande i percorsi git modificati in lane Vitest circoscritti quando il diff tocca solo file sorgente/test instradabili. Le modifiche a config/setup ricadono comunque nell'esecuzione nativa dei progetti root, così le modifiche al wiring riattivano esecuzioni ampie quando necessario.
- `pnpm changed:lanes`: mostra i lane architetturali attivati dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue la smart changed gate per il diff rispetto a `origin/main`. Esegue il lavoro core con i lane di test core, il lavoro sulle extension con i lane di test extension, il lavoro solo-test con solo typecheck/test dei test, ed espande le modifiche al Plugin SDK pubblico o al contratto dei plugin alla validazione delle extension.
- `pnpm test`: instrada target espliciti file/directory tramite lane Vitest circoscritti. Le esecuzioni senza target usano gruppi shard fissi e si espandono in config foglia per l'esecuzione parallela locale; il gruppo extension si espande sempre nelle config shard per extension invece che in un unico enorme processo root-project.
- Le esecuzioni complete e quelle sugli shard delle extension aggiornano i dati locali di timing in `.artifacts/vitest-shard-timings.json`; le esecuzioni successive usano quei timing per bilanciare shard lenti e veloci. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto di timing locale.
- Alcuni file di test `plugin-sdk` e `commands` ora vengono instradati tramite lane leggeri dedicati che mantengono solo `test/setup.ts`, lasciando i casi pesanti a runtime nei lane esistenti.
- Alcuni file sorgente helper `plugin-sdk` e `commands` mappano inoltre `pnpm test:changed` a test sibling espliciti in quei lane leggeri, così piccole modifiche agli helper evitano di rieseguire le suite pesanti supportate da runtime.
- `auto-reply` ora è anche suddiviso in tre config dedicate (`core`, `top-level`, `reply`) così l'harness reply non domina i test più leggeri su status/token/helper di primo livello.
- La config base di Vitest ora usa per default `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le config del repo.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard di extension/plugin. Le extension di canale pesanti e OpenAI vengono eseguite come shard dedicati; gli altri gruppi di extension restano raggruppati. Usa `pnpm test extensions/<id>` per il lane di un solo plugin incluso.
- `pnpm test:perf:imports`: abilita i report Vitest su durata degli import + breakdown degli import, continuando però a usare il routing dei lane circoscritti per target espliciti file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` misura il percorso changed-mode instradato rispetto all'esecuzione nativa root-project per lo stesso diff git già committato.
- `pnpm test:perf:changed:bench -- --worktree` misura l'insieme di modifiche del worktree corrente senza dover prima committare.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue i test smoke end-to-end del gateway (pairing WS/HTTP/node multi-istanza). Per default usa `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log verbosi.
- `pnpm test:live`: esegue i test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per togliere lo skip.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI in Docker, effettua il sign-in tramite Open WebUI, controlla `/api/models`, poi esegue una vera chat proxata tramite `/api/chat/completions`. Richiede una chiave valida per un modello live (ad esempio OpenAI in `~/.profile`), scarica un'immagine Open WebUI esterna e non è pensato per essere stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway preconfigurato e un secondo container client che avvia `openclaw mcp serve`, poi verifica individuazione delle conversazioni instradate, letture delle trascrizioni, metadati degli allegati, comportamento della coda eventi live, routing dell'invio outbound e notifiche in stile Claude di canale + permessi sul vero bridge stdio. L'asserzione della notifica Claude legge direttamente i frame MCP grezzi stdio così lo smoke riflette ciò che il bridge emette davvero.

## Gate PR locale

Per i controlli locali di land/gate PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` è instabile su un host carico, rieseguilo una volta prima di trattarlo come regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilizzo:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facoltativi: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Reply with a single word: ok. No punctuation or extra text.”

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

## Benchmark di avvio CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Utilizzo:

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

L'output include `sampleCount`, avg, p50, p95, min/max, distribuzione di exit-code/signal e riepiloghi del massimo RSS per ogni comando. `--cpu-prof-dir` / `--heap-prof-dir` facoltativi scrivono profili V8 per esecuzione così timing e raccolta dei profili usano lo stesso harness.

Convenzioni per l'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline versionata in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionata:

- `test/fixtures/cli-startup-bench.json`
- Aggiornala con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture tramite `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è opzionale; questo serve solo per i test smoke di onboarding containerizzato.

Flusso completo di cold-start in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite uno pseudo-tty, verifica i file di config/workspace/session, poi avvia il gateway ed esegue `openclaw health`.

## Smoke di importazione QR (Docker)

Garantisce che `qrcode-terminal` venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```
