---
read_when:
    - Devi capire perché un'attività CI è stata eseguita o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
    - Stai modificando l'invio di ClawSweeper o l'inoltro dell'attività GitHub
summary: Grafo delle attività CI, gate di ambito, ombrelli di rilascio ed equivalenti dei comandi locali
title: Flusso di integrazione continua
x-i18n:
    generated_at: "2026-05-03T21:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e a ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo scoping intelligente ed espandono l'intero grafo per i candidati alla release e la convalida ampia. Le lane Android restano opt-in tramite `include_android`. La copertura dei Plugin solo per la release vive nel workflow separato [`Pre-release dei Plugin`](#plugin-prerelease) e viene eseguita solo da [`Convalida completa della release`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                      | Quando viene eseguito              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, ambiti modificati, estensioni modificate e crea il manifest CI  | Sempre su push e PR non draft |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                        | Sempre su push e PR non draft |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli avvisi npm                                 | Sempre su push e PR non draft |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                                          | Sempre su push e PR non draft |
| `check-dependencies`             | Passaggio Knip solo dipendenze di produzione più guardia dell'allowlist dei file inutilizzati              | Modifiche rilevanti per Node              |
| `build-artifacts`                | Crea `dist/`, Control UI, controlli sugli artefatti compilati e artefatti riutilizzabili a valle          | Modifiche rilevanti per Node              |
| `checks-fast-core`               | Lane di correttezza Linux rapide, come controlli bundled/contratto-Plugin/protocollo                       | Modifiche rilevanti per Node              |
| `checks-fast-contracts-channels` | Controlli dei contratti dei canali con shard e risultato di controllo aggregato stabile                    | Modifiche rilevanti per Node              |
| `checks-node-core-test`          | Shard dei test core Node, esclusi canali, bundled, contratti e lane delle estensioni                       | Modifiche rilevanti per Node              |
| `check`                          | Equivalente del gate locale principale con shard: tipi prod, lint, guardie, tipi test e smoke rigoroso    | Modifiche rilevanti per Node              |
| `check-additional`               | Architettura, drift di boundary/prompt con shard, guardie delle estensioni, boundary di pacchetto e gateway watch | Modifiche rilevanti per Node              |
| `build-smoke`                    | Smoke test della CLI compilata e smoke della memoria di avvio                                             | Modifiche rilevanti per Node              |
| `checks`                         | Verificatore per test dei canali sugli artefatti compilati                                                | Modifiche rilevanti per Node              |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                           | Dispatch CI manuale per le release    |
| `check-docs`                     | Formattazione della documentazione, lint e controlli dei link interrotti                                  | Documentazione modificata                       |
| `skills-python`                  | Ruff + pytest per Skills supportate da Python                                                             | Modifiche rilevanti per Skills Python      |
| `checks-windows`                 | Test specifici per processi/percorsi Windows più regressioni condivise degli specificatori di import runtime | Modifiche rilevanti per Windows           |
| `macos-node`                     | Lane di test TypeScript macOS usando gli artefatti compilati condivisi                                    | Modifiche rilevanti per macOS             |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                                   | Modifiche rilevanti per macOS             |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                        | Modifiche rilevanti per Android           |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                 | Successo della CI principale o dispatch manuale |
| `openclaw-performance`           | Report giornalieri/su richiesta sulle prestazioni runtime Kova con lane mock-provider, deep-profile e GPT 5.4 live | Pianificato e dispatch manuale      |

## Ordine fail-fast

1. `preflight` decide quali lane esistono. La logica `docs-scope` e `changed-scope` è composta da passaggi dentro questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice di artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer a valle possono iniziare non appena la build condivisa è pronta.
4. Le lane di piattaforma e runtime più pesanti si espandono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job sostituiti come `cancelled` quando un push più recente arriva sulla stessa PR o sullo stesso ref `main`. Consideralo rumore CI a meno che anche l'esecuzione più recente per lo stesso ref non stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()` così continuano a riportare i normali fallimenti degli shard, ma non si accodano dopo che l'intero workflow è già stato sostituito. La chiave automatica di concorrenza CI è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le nuove esecuzioni su main. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Ambito e instradamento

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifest di preflight come se ogni area con ambito fosse cambiata.

- **Modifiche ai workflow CI** convalidano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del sorgente di piattaforma.
- **Modifiche solo di instradamento CI, modifiche a fixture economiche selezionate dei test core e modifiche ristrette a helper/test-routing dei contratti Plugin** usano un percorso di manifest rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei Plugin bundled e matrici di guardia aggiuntive quando la modifica è limitata alle superfici di instradamento o helper che il task rapido esercita direttamente.
- **Controlli Node Windows** sono limitati a wrapper di processo/percorso specifici per Windows, helper dei runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; sorgente non correlato, Plugin, install-smoke e modifiche solo ai test restano sulle lane Node Linux.

Le famiglie di test Node più lente sono divise o bilanciate così ogni job resta piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard pesati, le lane core unit fast/support vengono eseguite separatamente, l'infrastruttura runtime core è divisa tra shard state e process/config, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentiche Gateway/server sono divise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti compilati. I test ampi di browser, QA, media e Plugin vari usano le rispettive configurazioni Vitest dedicate invece del catch-all condiviso dei Plugin. Gli shard include-pattern registrano voci di timing usando il nome shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` tiene insieme il lavoro di compilazione/canary del boundary di pacchetto e separa l'architettura della topologia runtime dalla copertura gateway watch; l'elenco delle guardie di boundary è distribuito su quattro shard di matrice, ognuno esegue guardie indipendenti selezionate in parallelo e stampa i timing per controllo, incluso `pnpm prompt:snapshots:check`, così il drift dei prompt del percorso felice del runtime Codex è fissato alla PR che lo ha causato. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

Android CI esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor third-party non ha un source set o manifest separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando al tempo stesso un job duplicato di packaging dell'APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo dipendenze di produzione fissato all'ultima versione di Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al contempo superfici intenzionali di Plugin dinamici, generate, di build, live-test e bridge di pacchetto che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall'attività del repository OpenClaw verso ClawSweeper. Non esegue checkout né codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, quindi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di revisione di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello di commit sui push a `main`;
- `github_activity` per attività generale GitHub che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o revisioni quando presenti. Evita intenzionalmente di inoltrare l'intero corpo del Webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sull'hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel suo prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, attuabile, rischioso o utile operativamente. Aperture di routine, modifiche, rumore da bot, duplicati Webhook e traffico normale di review dovrebbero produrre `NO_REPLY`.

Tratta titoli, commenti, corpi, testo di review, nomi di branch e messaggi di commit di GitHub come dati non attendibili lungo tutto questo percorso. Sono input per riepilogo e triage, non istruzioni per il workflow o il runtime dell'agente.

## Dispatch manuali

Le dispatch manuali di CI eseguono lo stesso grafo di job della CI normale, ma forzano l'attivazione di ogni lane con ambito non Android: shard Linux Node, shard dei Plugin in bundle, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli della documentazione, Skills Python, Windows, macOS e i18n della Control UI. I dispatch manuali standalone della CI eseguono solo Android con `include_android=true`; l'umbrella della release completa abilita Android passando `include_android=true`. I controlli statici di prerelease dei Plugin, lo shard solo release `agentic-plugins`, lo sweep batch completo delle estensioni e le lane Docker di prerelease dei Plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` esegue il dispatch del workflow separato `Plugin Prerelease` con il gate di validazione release abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, quindi una suite completa di release candidate non viene annullata da un'altra esecuzione push o PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, tag o SHA di commit completo usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza rapidi e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratti/bundle, controlli dei contratti dei canali in shard, shard `check` tranne lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight di install-smoke usa Ubuntu ospitato da GitHub, così la matrice Blacksmith può mettersi in coda prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard delle estensioni più leggeri, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei Plugin in bundle, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU che 8 vCPU costavano più di quanto facessero risparmiare); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Equivalenti locali

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` è il workflow di performance di prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere eseguito manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Il dispatch manuale normalmente misura il benchmark del ref del workflow. Imposta `target_ref` per misurare un tag di release o un altro branch con l'implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori latest sono indicizzati per ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref Kova, profilo, modalità di autenticazione lane, modello, conteggio ripetizioni e filtri degli scenari.

Il workflow installa OCM da una release fissata e Kova da `openclaw/Kova` all'input `kova_ref` fissato, quindi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova contro un runtime di build locale con autenticazione falsa deterministica compatibile con OpenAI.
- `mock-deep-profile`: profilazione CPU/heap/trace per hotspot di avvio, Gateway e turni agente.
- `live-gpt54`: un turno agente reale OpenAI `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche probe sorgente nativi OpenClaw dopo il passaggio Kova: tempi di avvio e memoria del Gateway nei casi di avvio predefinito, hook e 50 Plugin; cicli hello ripetuti mock-OpenAI `channel-chat-baseline`; e comandi di avvio CLI contro il Gateway avviato. Il riepilogo Markdown del probe sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artifact GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow esegue anche il commit di `report.json`, `report.md`, bundle, `index.md` e artifact dei probe sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` è il workflow umbrella manuale per "eseguire tutto prima della release." Accetta un branch, tag o SHA di commit completo, esegue il dispatch del workflow manuale `CI` con quel target, esegue il dispatch di `Plugin Prerelease` per prove solo release di Plugin/pacchetto/statiche/Docker ed esegue il dispatch di `OpenClaw Release Checks` per smoke di installazione, accettazione pacchetto, suite Docker del percorso di release, live/E2E, OpenWebUI, parità QA Lab, Matrix e lane Telegram. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l'artifact `release-package-under-test` dai controlli di release. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa lane del pacchetto Telegram contro il pacchetto npm pubblicato.

Vedi [validazione completa della release](/it/reference/full-release-validation) per la
matrice delle fasi, i nomi esatti dei job workflow, le differenze tra profili, gli artifact e
gli handle di riesecuzione mirati.

`OpenClaw Release Publish` è il workflow di release mutante manuale. Esegui il dispatch
da `release/YYYY.M.D` o `main` dopo che il tag di release esiste e dopo che il
preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
esegue il dispatch di `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, esegue il dispatch di
`Plugin ClawHub Release` per lo stesso SHA di release, e solo allora esegue il dispatch di
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per la prova di commit fissato su un branch in rapido movimento, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L'
helper invia un branch temporaneo `release-ci/<sha>-...` allo SHA target,
esegue il dispatch di `Full Release Validation` da quel ref fissato, verifica che ogni
workflow figlio `headSha` corrisponda al target ed elimina il branch temporaneo quando
l'esecuzione completa. Il verificatore umbrella fallisce anche se qualsiasi workflow figlio è stato eseguito a uno
SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di release. I workflow di release manuali usano per impostazione predefinita `stable`; usa `full` solo quando vuoi intenzionalmente la matrice ampia consultiva di provider/media.

- `minimum` mantiene le lane OpenAI/core critiche per la release piu rapide.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue la matrice ampia consultiva di provider/media.

L'ombrello registra gli ID delle esecuzioni child avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni child e aggiunge tabelle dei job piu lenti per ogni esecuzione child. Se un workflow child viene rieseguito e diventa verde, riesegui solo il job verifier parent per aggiornare il risultato dell'ombrello e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di release, `ci` solo per il normale child CI completo, `plugin-prerelease` solo per il child prerelease dei plugin, `release-checks` per ogni child di release, oppure un gruppo piu ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene delimitata la riesecuzione di un box di release non riuscito dopo una correzione mirata.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere il ref selezionato una volta in un tarball `release-package-under-test`, quindi passa quell'artefatto sia al workflow Docker del percorso di release live/E2E sia allo shard di accettazione del pacchetto. Questo mantiene coerenti i byte del pacchetto tra i box di release ed evita di impacchettare di nuovo lo stesso candidato in piu job child.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all` sostituiscono l'ombrello precedente. Il monitor parent annulla qualsiasi workflow child che abbia gia avviato quando il parent viene annullato, cosi la validazione piu recente di main non resta in coda dietro a una vecchia esecuzione di release-check di due ore. La validazione di branch/tag di release e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il child live/E2E di release mantiene un'ampia copertura nativa di `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece che come un unico job seriale:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` filtrati per provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard media audio/video divisi e shard musica filtrati per provider

Questo mantiene la stessa copertura dei file rendendo piu facile rieseguire e diagnosticare gli errori dei provider live lenti. I nomi degli shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, costruito dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui runner Blacksmith normali: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live model/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow live di release costruisce e pubblica quell'immagine una volta, poi gli shard Docker live model, Gateway diviso per provider, backend CLI, bind ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway hanno cap espliciti di `timeout` a livello di script inferiori al timeout del job del workflow, cosi un container bloccato o un percorso di cleanup fallisce rapidamente invece di consumare tutto il budget dei release-check. Se quegli shard ricostruiscono indipendentemente il target Docker completo dei sorgenti, l'esecuzione di release e configurata male e sprechera tempo reale in build di immagini duplicate.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda e "questo pacchetto OpenClaw installabile funziona come prodotto?" E diversa dalla CI normale: la CI normale valida l'albero dei sorgenti, mentre l'accettazione del pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo installazione o aggiornamento.

### Job

1. `resolve_package` fa checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa origine, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara le immagini Docker package-digest quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona piu `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una volta, poi distribuisce quelle lane come job Docker mirati paralleli con artefatti unici.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non e `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; l'avvio standalone di Telegram puo comunque installare una spec npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram facoltativa non sono riuscite.

### Origini dei candidati

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di release OpenClaw esatta come `openclaw@2026.4.27-beta.2`. Usa questa opzione per l'accettazione di prerelease/stable pubblicate.
- `source=ref` impacchetta un branch, tag o SHA di commit completo `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di release, installa le dipendenze in una worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` e obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` e facoltativo ma dovrebbe essere fornito per gli artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` e il codice attendibile del workflow/harness che esegue il test. `package_ref` e il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili piu vecchi senza eseguire la vecchia logica del workflow.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` piu `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk Docker completi del percorso di release con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura plugin offline, cosi la validazione del pacchetto pubblicato non e vincolata alla disponibilita live di ClawHub. La lane Telegram facoltativa riusa l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della spec npm pubblicata per gli avvii standalone.

Per la policy dedicata di test di aggiornamenti e plugin, inclusi comandi locali, lane Docker, input di Package Acceptance, impostazioni predefinite di release e triage degli errori, vedi [Testare aggiornamenti e plugin](/it/help/testing-updates-plugins).

I controlli di release chiamano Package Acceptance con `source=artifact`, l'artefatto del pacchetto di release preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Questo mantiene la prova di migrazione del pacchetto, aggiornamento, cleanup delle dipendenze plugin obsolete, riparazione dell'installazione di plugin configurati, plugin offline, aggiornamento plugin e Telegram sullo stesso tarball di pacchetto risolto. Imposta `package_acceptance_package_spec` in Full Release Validation o OpenClaw Release Checks per eseguire la stessa matrice contro un pacchetto npm pubblicato invece che contro l'artefatto costruito da SHA. I controlli di release cross-OS coprono comunque onboarding, installer e comportamento di piattaforma specifici per OS; la validazione prodotto di pacchetto/aggiornamento dovrebbe partire da Package Acceptance. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicata per ogni esecuzione. In Package Acceptance, il tarball `package-under-test` risolto e sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con valore predefinito `openclaw@latest`; i comandi di riesecuzione delle lane non riuscite preservano quella baseline. Imposta `published_upgrade_survivor_baselines=all-since-2026.4.23` per espandere la CI Full Release su ogni release npm stabile da `2026.4.23` fino a `latest`; `release-history` resta disponibile per campionamenti manuali piu ampi con il vecchio anchor precedente alla data. Imposta `published_upgrade_survivor_scenarios=reported-issues` per espandere le stesse baseline su fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di plugin OpenClaw configurati, percorsi log con tilde e radici di dipendenze plugin legacy obsolete. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda il cleanup esaustivo degli aggiornamenti pubblicati, non l'ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare spec pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice degli scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e interroga `/healthz`, `/readyz` piu lo stato RPC dopo l'avvio del Gateway. Le lane Windows di pacchetto e installer fresh verificano inoltre che un pacchetto installato possa importare un override browser-control da un percorso Windows assoluto raw. Lo smoke cross-OS agent-turn OpenAI usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando e impostato, altrimenti `openai/gpt-5.4`, cosi la prova di installazione e Gateway resta su un modello di test GPT-5 evitando default GPT-4.x.

### Finestre di compatibilita legacy

Package Acceptance ha finestre delimitate di compatibilita legacy per pacchetti gia pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilita:

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` puo saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` puo potare `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e puo registrare `update.channel` persistito mancante;
- gli smoke dei plugin possono leggere posizioni legacy degli install-record o accettare la persistenza mancante degli install-record del marketplace;
- `plugin-update` puo consentire la migrazione dei metadati di configurazione pur richiedendo comunque che l'install record e il comportamento no-reinstall restino invariati.

Anche il pacchetto pubblicato `2026.4.26` puo emettere avvisi per file di stamp metadati di build locali gia distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di avvisare o saltare.

### Esempi

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Quando esegui il debug di un'esecuzione di accettazione del pacchetto non riuscita, inizia dal riepilogo `resolve_package` per confermare l'origine, la versione e lo SHA-256 del pacchetto. Quindi ispeziona l'esecuzione figlia `docker_acceptance` e i relativi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo del pacchetto non riuscito o le lane Docker esatte invece di rieseguire la validazione completa della release.

## Smoke di installazione

Il workflow separato `Install Smoke` riutilizza lo stesso script di ambito tramite il proprio job `preflight`. Suddivide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest di Plugin inclusi o superfici del core Plugin/canale/gateway/SDK Plugin esercitate dai job smoke Docker. Le modifiche solo al sorgente dei Plugin inclusi, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido compila una volta l'immagine Dockerfile root, controlla la CLI, esegue lo smoke CLI di eliminazione agenti con workspace condiviso, esegue l'e2e gateway-network del container, verifica un argomento di build di un Plugin incluso ed esegue il profilo Docker delimitato per Plugin inclusi con un timeout aggregato del comando di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- **Percorso completo** mantiene l'installazione del pacchetto QR e la copertura Docker/update dell'installer per esecuzioni programmate notturne, dispatch manuali, controlli di release workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riutilizza un'immagine smoke Dockerfile root GHCR a SHA target, quindi esegue installazione pacchetto QR, smoke Dockerfile/gateway root, smoke installer/update e l'E2E Docker rapido dei Plugin inclusi come job separati, così il lavoro dell'installer non resta in attesa degli smoke dell'immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica dell'ambito delle modifiche richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di release.

Lo smoke lento del provider di immagini con installazione globale Bun è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali di `Install Smoke` possono includerlo esplicitamente, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila un'immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e compila due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git minimale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del pianificatore si trova in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                                      |
| -------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per lane normali.                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool finale sensibile ai provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti, così i provider non applicano throttling.                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane di installazione npm concorrenti.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra avvii delle lane per evitare tempeste di creazione del demone Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/finali selezionate usano limiti più stretti.  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset       | `1` stampa il piano dello scheduler senza eseguire lane.                                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset       | Elenco esatto di lane separato da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane non riuscita. |

Una lane più pesante del proprio limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. I preflight aggregati locali verificano Docker, rimuovono container E2E OpenClaw obsoleti, emettono lo stato delle lane attive, persistono i tempi delle lane per l'ordinamento dalla più lunga alla più breve e, per impostazione predefinita, interrompono la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale copertura di pacchetto, tipo di immagine, immagine live, lane e credenziali è richiesta. `scripts/docker-e2e.mjs` converte quindi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto pacchetto dell'esecuzione corrente oppure scarica un artefatto pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; compila e invia immagini E2E Docker GHCR bare/funzionali taggate con digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riutilizza input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti con digest del pacchetto invece di ricompilare. I pull delle immagini Docker vengono ritentati con un timeout delimitato di 180 secondi per tentativo, così uno stream di registro/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico della CI.

### Segmenti del percorso di release

La copertura Docker di release esegue job segmentati più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni segmento scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Gli attuali segmenti Docker di release sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati per plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un segmento autonomo `openwebui` solo per dispatch esclusivi di OpenWebUI. Le lane di aggiornamento dei canali inclusi ritentano una volta in caso di errori temporanei di rete npm.

Ogni segmento carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job a segmenti, mantenendo il debug delle lane non riuscite delimitato a un solo job Docker mirato e preparando, scaricando o riutilizzando l'artefatto pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine live-test per quella riesecuzione. I comandi di riesecuzione GitHub generati per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando quei valori esistono, così una lane non riuscita può riutilizzare il pacchetto e le immagini esatti dell'esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E programmato esegue quotidianamente la suite Docker completa release-path.

## Prerelease dei Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch CI manuali autonomi mantengono disattivata quella suite. Bilancia i test dei Plugin inclusi su otto worker di estensione; questi job di shard delle estensioni eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di Plugin con import pesanti non creano job CI aggiuntivi. Il percorso prerelease Docker riservato alla release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con ambito intelligente. La parità agentica è annidata negli harness ampi di QA e release, non in un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve accompagnare un'esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce la lane di parità mock, la lane Matrix live e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza dei modelli live e dal normale avvio dei plugin provider. Il Gateway di trasporto live disabilita la ricerca memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per gate programmati e di release, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pacchetti candidato e baseline come job lane paralleli, poi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale di parità.

Per PR normali, segui le prove CI/check con ambito invece di trattare la parità come uno stato richiesto.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non una scansione completa del repository. Le esecuzioni di guardia giornaliere, manuali e per pull request non in bozza analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato, con query di sicurezza ad alta affidabilità filtrate su `security-severity` alta/critica.

La guardia delle pull request resta leggera: si avvia solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta affidabilità del workflow pianificato. CodeQL per Android e macOS resta fuori dai valori predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segreti, sandbox, cron e baseline del gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti dell’implementazione core dei canali più runtime del plugin di canale, gateway, Plugin SDK, segreti, punti di audit    |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici SSRF core, parsing IP, guardia di rete, web-fetch e criteri SSRF del Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione processi, consegna in uscita e gate di esecuzione strumenti degli agenti                         |
| `/codeql-security-high/plugin-trust-boundary`     | Installazione Plugin, loader, manifest, registry, installazione tramite package manager, caricamento sorgenti e superfici di fiducia del contratto di pacchetto Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l’app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla sanità del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l’app macOS per CodeQL su Blacksmith macOS, esclude dai SARIF caricati i risultati di build delle dipendenze e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai valori predefiniti giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript con gravità errore e non di sicurezza su superfici ristrette ad alto valore, sul runner Blacksmith Linux più piccolo. La sua guardia per pull request è intenzionalmente più piccola del profilo pianificato: le PR non in bozza eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione comandi/modelli/strumenti degli agenti e di dispatch delle risposte, al codice di schema/migrazione/IO della configurazione, al codice auth/segreti/sandbox/sicurezza, al runtime core dei canali e dei plugin di canale in bundle, al protocollo Gateway/metodi server, al runtime memoria/collante SDK, a MCP/processi/consegna in uscita, al catalogo runtime/modelli dei provider, alla diagnostica di sessione/code di consegna, al loader dei plugin, al contratto Plugin SDK/pacchetto o al runtime risposte del Plugin SDK. Le modifiche alla configurazione CodeQL e ai workflow di qualità eseguono tutti e dodici gli shard di qualità per PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di apprendimento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza per auth, segreti, sandbox, cron e gateway                                                                                       |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema della configurazione, migrazione, normalizzazione e IO                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione del canale core e dei plugin di canale in bundle                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione comandi, dispatch di modelli/provider, dispatch e code di risposta automatica e contratti runtime del piano di controllo ACP                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione processi e contratti di consegna in uscita                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host della memoria, facciate runtime della memoria, alias memoria del Plugin SDK, collante di attivazione runtime della memoria e comandi doctor della memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni delle code di risposta, code di consegna sessione, helper di binding/consegna sessione in uscita, superfici di eventi diagnostici/bundle di log e contratti CLI del doctor di sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso del Plugin SDK, helper per payload/chunking/runtime delle risposte, opzioni di risposta dei canali, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione del catalogo modelli, auth e discovery dei provider, registrazione runtime dei provider, valori predefiniti/cataloghi dei provider e registry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap dell’interfaccia di controllo, persistenza locale, flussi di controllo Gateway e contratti runtime del piano di controllo task                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web core, IO media, comprensione media, generazione immagini e contratti runtime di generazione media                                                |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registry, superficie pubblica ed entrypoint Plugin SDK                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK lato pacchetto pubblicato e helper del contratto del pacchetto plugin                                                                        |

La qualità resta separata dalla sicurezza, così i risultati di qualità possono essere pianificati, misurati, disabilitati o ampliati senza offuscare il segnale di sicurezza. L’espansione CodeQL per Swift, Python e plugin in bundle dovrebbe essere riaggiunta come lavoro successivo con ambito o shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una corsia di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche appena approdate. Non ha una pianificazione pura: un’esecuzione CI riuscita per push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni tramite workflow-run vengono saltate quando `main` è avanzato o quando un’altra esecuzione Docs Agent non saltata è stata creata nell’ultima ora. Quando viene eseguito, rivede l’intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino all’attuale `main`, così un’esecuzione oraria può coprire tutte le modifiche a main accumulate dall’ultimo passaggio sulla documentazione.

### Test Performance Agent

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: un’esecuzione CI riuscita per push non bot su `main` può attivarlo, ma viene saltato se un’altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel gate di attività giornaliera. La corsia crea un report prestazionale Vitest raggruppato dell’intera suite, consente a Codex di applicare solo piccole correzioni alle prestazioni dei test che preservano la copertura invece di refactoring ampi, quindi riesegue il report dell’intera suite e rifiuta le modifiche che riducono il conteggio baseline dei test passati. Se la baseline ha test non riusciti, Codex può correggere solo fallimenti ovvi e il report dell’intera suite dopo l’agente deve passare prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot approdi, la corsia fa rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete con conflitti vengono saltate. Usa Ubuntu ospitato da GitHub così l’azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer destinato alla pulizia delle duplicazioni dopo l’approdo. Per impostazione predefinita è in dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR approdata sia stata mergiata e che ogni duplicato abbia un issue referenziato condiviso o hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locale e instradamento delle modifiche

La logica locale delle corsie modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all’ambito ampio della piattaforma CI:

- le modifiche di produzione core eseguono typecheck di produzione core e test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck dei test core più lint core;
- le modifiche di produzione delle estensioni eseguono typecheck di produzione estensioni e test estensioni più lint estensioni;
- le modifiche solo ai test delle estensioni eseguono typecheck dei test estensioni più lint estensioni;
- le modifiche pubbliche al Plugin SDK o al contratto dei plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti core (le scansioni Vitest delle estensioni restano lavoro di test esplicito);
- gli incrementi di versione solo dei metadati di rilascio eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo conservativo verso tutte le corsie di controllo.

L’instradamento locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono sé stesse, le modifiche ai sorgenti preferiscono mappature esplicite, poi test fratelli e dipendenti nel grafo degli import. La configurazione condivisa della consegna nelle stanze di gruppo è una delle mappature esplicite: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test core delle risposte più le regressioni di consegna Discord e Slack, così una modifica condivisa predefinita fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia a livello di harness da rendere l’insieme mappato economico non affidabile come proxy.

## Validazione Testbox

Esegui Testbox dalla radice del repo e preferisci una box appena preparata per le verifiche ampie. Prima di spendere un gate lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il controllo di sanità fallisce rapidamente quando file root richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato di sincronizzazione remoto non è una copia affidabile della PR; ferma quella box e preparane una nuova invece di eseguire il debug del fallimento del test del prodotto. Per PR con intenzionali eliminazioni massicce, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di sanità.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella protezione, oppure usa un valore in millisecondi più grande per diff locali insolitamente estesi.

Crabbox è il secondo percorso di box remota di proprietà del repo per la verifica su Linux quando Blacksmith non è disponibile o quando è preferibile usare capacità cloud proprietaria. Prepara una box, idratala tramite il workflow del progetto, poi esegui i comandi tramite la CLI Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` possiede i valori predefiniti per provider, sincronizzazione e idratazione di GitHub Actions. Esclude `.git` locale così il checkout idratato di Actions mantiene i propri metadati Git remoti invece di sincronizzare remote e object store locali del maintainer, ed esclude gli artefatti locali di runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione di Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto che i successivi comandi `crabbox run --id <cbx_id>` caricano.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
