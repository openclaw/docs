---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test in locale (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-05T14:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# Test

- Kit completo di test (suite, live, Docker): [Testing](/help/testing)

- `pnpm test:force`: termina qualunque processo gateway rimasto attivo che occupa la porta di controllo predefinita, poi esegue l'intera suite Vitest con una porta gateway isolata così i test del server non entrano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Le soglie globali sono 70% per linee/branch/funzioni/statement. La copertura esclude gli entrypoint ricchi di integrazione (wiring CLI, bridge gateway/telegram, server statico webchat) per mantenere l'obiettivo concentrato sulla logica testabile a livello unitario.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: esegue la config nativa dei progetti Vitest con `--changed origin/main`. La config base tratta i file dei progetti/config come `forceRerunTriggers` così le modifiche al wiring riattivano comunque riesecuzioni ampie quando necessario.
- `pnpm test`: esegue direttamente la config root nativa dei progetti Vitest. I filtri file funzionano in modo nativo tra i progetti configurati.
- La config base Vitest ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le config del repo.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` esegue `vitest.extensions.config.ts`.
- `pnpm test:extensions`: esegue le suite di extension/plugin.
- `pnpm test:perf:imports`: abilita in Vitest il reporting di durata degli import + dettaglio degli import per l'esecuzione root nativa dei progetti.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oppure `pnpm test:gateway`.
- `pnpm test:e2e`: esegue i test smoke end-to-end del gateway (pairing multi-istanza WS/HTTP/node). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log dettagliati.
- `pnpm test:live`: esegue i test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per togliere lo skip.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI in Docker, accede tramite Open WebUI, controlla `/api/models`, poi esegue una vera chat proxata tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile (ad esempio OpenAI in `~/.profile`), scarica un'immagine esterna di Open WebUI e non è pensato per essere stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway inizializzato e un secondo container client che avvia `openclaw mcp serve`, poi verifica rilevamento delle conversazioni instradate, lettura delle trascrizioni, metadati degli allegati, comportamento della coda di eventi live, instradamento dell'invio in uscita e notifiche in stile Claude su canale + permessi tramite il vero bridge stdio. L'asserzione delle notifiche Claude legge direttamente i frame MCP stdio grezzi così lo smoke rifletta ciò che il bridge emette davvero.

## Gate PR locale

Per i controlli locali di land/gate delle PR, esegui:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` ha esiti intermittenti su un host carico, rieseguilo una volta prima di trattarlo come una regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark di latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facoltative: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Reply with a single word: ok. No punctuation or extra text.”

Ultima esecuzione (2025-12-31, 20 run):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

## Benchmark di avvio CLI

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

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione di exit-code/signal e riepiloghi del massimo RSS per ogni comando. L'uso facoltativo di `--cpu-prof-dir` / `--heap-prof-dir` scrive profili V8 per ogni run, così misurazione dei tempi e acquisizione dei profili usano lo stesso harness.

Convenzioni di output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna il fixture baseline versionato in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionato:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con il fixture tramite `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è facoltativo; serve solo per i test smoke di onboarding containerizzati.

Flusso completo a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite una pseudo-tty, verifica i file di config/workspace/sessione, poi avvia il gateway ed esegue `openclaw health`.

## Smoke di importazione QR (Docker)

Garantisce che `qrcode-terminal` venga caricato sotto i runtime Node Docker supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```
