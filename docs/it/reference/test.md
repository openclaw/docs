---
read_when:
    - Eseguire o correggere i test
summary: Come eseguire i test in locale (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-23T13:58:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Test

- Kit di test completo (suite, live, Docker): [Testing](/it/help/testing)

- `pnpm test:force`: termina qualsiasi processo gateway residuo che mantiene occupata la porta di controllo predefinita, quindi esegue l'intera suite Vitest con una porta gateway isolata così i test del server non entrano in collisione con un'istanza in esecuzione. Usalo quando una precedente esecuzione del gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura unit dei file caricati, non una copertura di tutti i file dell'intero repository. Le soglie sono 70% righe/funzioni/statement e 55% branch. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite di copertura unit invece di trattare ogni file sorgente delle corsie suddivise come non coperto.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: espande i percorsi git modificati in corsie Vitest con scope quando la diff tocca solo file sorgente/test instradabili. Le modifiche a config/setup continuano invece a ripiegare sull'esecuzione nativa dei progetti root così le modifiche di wiring rilanciano in modo ampio quando necessario.
- `pnpm changed:lanes`: mostra le corsie architetturali attivate dalla diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue il gate intelligente dei file modificati per la diff rispetto a `origin/main`. Esegue il lavoro core con le corsie di test core, il lavoro delle extension con le corsie di test delle extension, il lavoro solo test con solo typecheck/test dei test, estende le modifiche pubbliche al Plugin SDK o al contratto dei plugin alla validazione delle extension e mantiene i version bump che toccano solo i metadati di release su controlli mirati di versione/config/dipendenze root.
- `pnpm test`: instrada target espliciti file/directory tramite corsie Vitest con scope. Le esecuzioni senza target usano gruppi di shard fissi ed espandono a config foglia per l'esecuzione parallela locale; il gruppo extension si espande sempre nelle config shard per-extension invece che in un unico enorme processo root-project.
- Le esecuzioni complete e degli shard delle extension aggiornano i dati locali di timing in `.artifacts/vitest-shard-timings.json`; le esecuzioni successive usano quei timing per bilanciare shard lenti e veloci. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artifact locale dei timing.
- Alcuni file di test `plugin-sdk` e `commands` ora vengono instradati tramite corsie leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi con runtime pesante nelle loro corsie esistenti.
- Anche alcuni file sorgente helper di `plugin-sdk` e `commands` mappano `pnpm test:changed` verso test sibling espliciti in quelle corsie leggere, così piccole modifiche agli helper evitano di rieseguire le suite pesanti supportate dal runtime.
- `auto-reply` ora è suddiviso anche in tre config dedicate (`core`, `top-level`, `reply`) così l'harness delle reply non domina i test più leggeri di stato/token/helper di livello superiore.
- La config base di Vitest ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le config del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard delle extension/plugin. Le extension di canale pesanti e OpenAI vengono eseguite come shard dedicati; gli altri gruppi di extension restano batchati. Usa `pnpm test extensions/<id>` per una singola corsia di plugin incluso.
- `pnpm test:perf:imports`: abilita il reporting della durata degli import + breakdown degli import di Vitest, continuando a usare l'instradamento per corsie con scope per target espliciti file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` misura il percorso instradato in modalità changed rispetto all'esecuzione nativa dei progetti root per la stessa diff git già commitata.
- `pnpm test:perf:changed:bench -- --worktree` misura l'attuale insieme di modifiche del worktree senza fare prima commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue smoke test end-to-end del gateway (pairing multiistanza WS/HTTP/node). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log verbosi.
- `pnpm test:live`: esegue test live del provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non saltarli.
- `pnpm test:docker:all`: compila una sola volta l'immagine condivisa dei test live e l'immagine Docker E2E, quindi esegue le corsie smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` e concorrenza 4 per impostazione predefinita. Regola con `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Il runner smette di pianificare nuove corsie nel pool dopo il primo errore, a meno che non sia impostato `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, e ogni corsia ha un timeout di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Le corsie sensibili all'avvio o al provider vengono eseguite in esclusiva dopo il pool parallelo. I log per corsia vengono scritti in `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI in Docker, effettua il login tramite Open WebUI, controlla `/api/models`, quindi esegue una vera chat proxata tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine Open WebUI esterna e non è pensato per essere stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway inizializzato e un secondo container client che avvia `openclaw mcp serve`, quindi verifica discovery delle conversazioni instradate, letture della trascrizione, metadati degli allegati, comportamento live della coda eventi, instradamento dell'invio in uscita e notifiche in stile Claude di canale + permessi sul vero bridge stdio. L'asserzione sulle notifiche Claude legge direttamente i frame MCP stdio grezzi così lo smoke riflette ciò che il bridge emette davvero.

## Gate PR locale

Per i controlli locali di land/gate PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` è flaky su un host sotto carico, rieseguilo una volta prima di trattarlo come una regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opzionali: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Rispondi con una sola parola: ok. Nessuna punteggiatura o testo aggiuntivo.”

Ultima esecuzione (2025-12-31, 20 esecuzioni):

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

L'output include `sampleCount`, avg, p50, p95, min/max, distribuzione di exit-code/signal e riepiloghi max RSS per ogni comando. `--cpu-prof-dir` / `--heap-prof-dir` opzionali scrivono profili V8 per esecuzione così timing e acquisizione del profilo usano lo stesso harness.

Convenzioni per l'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artifact smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artifact della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la baseline fixture versionata in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionata:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è opzionale; questo serve solo per gli smoke test di onboarding containerizzati.

Flusso completo da avvio a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite uno pseudo-tty, verifica i file di config/workspace/session, quindi avvia il gateway ed esegue `openclaw health`.

## Smoke di import QR (Docker)

Garantisce che `qrcode-terminal` si carichi sotto i runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```
