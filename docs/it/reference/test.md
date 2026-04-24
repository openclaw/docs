---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test in locale (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-24T09:01:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- Kit di test completo (suite, live, Docker): [Testing](/it/help/testing)

- `pnpm test:force`: termina qualsiasi processo gateway residuo che occupa la porta di controllo predefinita, poi esegue l'intera suite Vitest con una porta gateway isolata così i test del server non entrano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura unit dei file caricati, non una copertura all-file dell'intero repository. Le soglie sono 70% linee/funzioni/statement e 55% branch. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite unit coverage invece di trattare ogni file sorgente a lane separate come non coperto.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: espande i percorsi git modificati in lane Vitest con scope quando il diff tocca solo file sorgente/test instradabili. Le modifiche a config/setup usano comunque come fallback l'esecuzione dei progetti root nativi, così le modifiche al wiring rilanciano in modo ampio quando necessario.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue il gate intelligente per i file modificati rispetto a `origin/main`. Esegue il lavoro core con lane di test core, il lavoro extension con lane di test extension, il lavoro solo-test con typecheck/test solo di test, espande le modifiche al Plugin SDK pubblico o al contratto plugin in un passaggio di validazione extension e mantiene i bump di versione solo-metadata di release su controlli mirati di versione/config/dipendenze root.
- `pnpm test`: instrada file/directory espliciti tramite lane Vitest con scope. Le esecuzioni senza target usano gruppi shard fissi e si espandono in configurazioni leaf per esecuzione parallela locale; il gruppo extension si espande sempre nelle configurazioni shard per extension invece che in un unico gigantesco processo root-project.
- Le esecuzioni complete e delle shard extension aggiornano i dati temporali locali in `.artifacts/vitest-shard-timings.json`; le esecuzioni successive usano questi tempi per bilanciare shard lente e veloci. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto temporale locale.
- Alcuni file di test `plugin-sdk` e `commands` ora vengono instradati tramite lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi runtime-heavy sulle loro lane esistenti.
- Alcuni file sorgente helper `plugin-sdk` e `commands` mappano anche `pnpm test:changed` a test sibling espliciti in quelle lane leggere, così piccole modifiche agli helper evitano di rieseguire le suite pesanti supportate dal runtime.
- `auto-reply` ora si divide anche in tre configurazioni dedicate (`core`, `top-level`, `reply`) così l'harness di reply non domina i test più leggeri di stato/token/helper a livello superiore.
- La configurazione base Vitest ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le configurazioni del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutte le shard extension/plugin. I plugin di canale pesanti, il plugin browser e OpenAI vengono eseguiti come shard dedicate; gli altri gruppi plugin restano batchati. Usa `pnpm test extensions/<id>` per una singola lane di plugin bundled.
- `pnpm test:perf:imports`: abilita il reporting Vitest di import-duration + import-breakdown, continuando però a usare l'instradamento per lane con scope per target file/directory espliciti.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` esegue il benchmark del percorso changed-mode instradato rispetto all'esecuzione root-project nativa per lo stesso diff git commitato.
- `pnpm test:perf:changed:bench -- --worktree` esegue il benchmark del set di modifiche del worktree corrente senza prima fare commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni configurazione leaf Vitest full-suite e scrive dati di durata raggruppati più artefatti JSON/log per configurazione. Il Test Performance Agent lo usa come baseline prima di tentare correzioni ai test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta i report raggruppati dopo una modifica focalizzata sulle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oppure `pnpm test:gateway`.
- `pnpm test:e2e`: esegue smoke test end-to-end del gateway (multi-instance WS/HTTP/node pairing). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log dettagliati.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (oppure `*_LIVE_TEST=1` specifico del provider) per togliere lo skip.
- `pnpm test:docker:all`: costruisce una sola volta l'immagine condivisa live-test e l'immagine Docker E2E, poi esegue le lane smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` con concorrenza 8 per impostazione predefinita. Regola il pool principale con `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` e il pool finale sensibile ai provider con `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; entrambi hanno valore predefinito 8. Gli avvii delle lane sono sfalsati di 2 secondi per impostazione predefinita per evitare tempeste di create sul demone Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner smette di pianificare nuove lane pooled dopo il primo errore, a meno che `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` non sia impostato, e ogni lane ha un timeout di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. I log per lane vengono scritti sotto `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: avvia OpenClaw dockerizzato + Open WebUI, esegue il login tramite Open WebUI, controlla `/api/models`, poi esegue una vera chat proxy tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile (ad esempio OpenAI in `~/.profile`), scarica un'immagine esterna di Open WebUI e non è pensato per essere stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway con seed e un secondo container client che esegue `openclaw mcp serve`, poi verifica rilevamento delle conversazioni instradate, lettura delle trascrizioni, metadati degli allegati, comportamento della coda eventi live, instradamento dell'invio in uscita e notifiche in stile Claude di canale + permessi sul vero bridge stdio. L'asserzione delle notifiche Claude legge direttamente i frame stdio MCP grezzi così lo smoke riflette ciò che il bridge emette davvero.

## Gate PR locale

Per controlli locali di land/gate PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` flappa su un host carico, rieseguilo una volta prima di considerarlo una regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

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

## Benchmark dell'avvio CLI

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

L'output include `sampleCount`, avg, p50, p95, min/max, distribuzione di exit-code/signal e riepiloghi di max RSS per ciascun comando. Gli argomenti facoltativi `--cpu-prof-dir` / `--heap-prof-dir` scrivono profili V8 per esecuzione in modo che tempi e acquisizione dei profili usino lo stesso harness.

Convenzioni per l'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto full-suite in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna il baseline fixture versionato in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionato:

- `test/fixtures/cli-startup-bench.json`
- Aggiornalo con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con il fixture tramite `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è facoltativo; serve solo per smoke test containerizzati dell'onboarding.

Flusso completo da cold start in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida il wizard interattivo tramite pseudo-tty, verifica file di config/workspace/sessione, poi avvia il gateway ed esegue `openclaw health`.

## Smoke test di import QR (Docker)

Garantisce che l'helper runtime QR mantenuto si carichi con i runtime Node Docker supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
