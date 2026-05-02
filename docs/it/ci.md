---
read_when:
    - Devi capire perché un job CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione di rilascio
    - Stai modificando il dispatch di ClawSweeper o l'inoltro dell'attività di GitHub
summary: Grafo dei job CI, gate di ambito, ombrelli di rilascio ed equivalenti dei comandi locali
title: Pipeline di CI
x-i18n:
    generated_at: "2026-05-02T23:39:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e per ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` bypassano intenzionalmente lo scoping intelligente e distribuiscono l’intero grafo per i candidati di rilascio e la validazione ampia. Le lane Android restano opt-in tramite `include_android`. La copertura dei Plugin solo per i rilasci vive nel workflow separato [`Plugin Prerelease`](#plugin-prerelease) e viene eseguita solo da [`Full Release Validation`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                               | Quando viene eseguito             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Rileva modifiche solo ai documenti, ambiti modificati, estensioni modificate e genera il manifest CI                 | Sempre su push e PR non draft     |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                                  | Sempre su push e PR non draft     |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                                         | Sempre su push e PR non draft     |
| `security-fast`                  | Aggregato obbligatorio per i job di sicurezza rapidi                                                                 | Sempre su push e PR non draft     |
| `check-dependencies`             | Passaggio Knip solo dipendenze di produzione più guard della allowlist dei file inutilizzati                         | Modifiche rilevanti per Node      |
| `build-artifacts`                | Genera `dist/`, Control UI, controlli sugli artefatti generati e artefatti downstream riutilizzabili                 | Modifiche rilevanti per Node      |
| `checks-fast-core`               | Lane rapide di correttezza Linux, come controlli bundled/plugin-contract/protocol                                    | Modifiche rilevanti per Node      |
| `checks-fast-contracts-channels` | Controlli sharded dei contratti dei canali con un risultato di controllo aggregato stabile                           | Modifiche rilevanti per Node      |
| `checks-node-core-test`          | Shard dei test core Node, escluse lane canali, bundled, contratti ed estensioni                                      | Modifiche rilevanti per Node      |
| `check`                          | Equivalente sharded del gate locale principale: tipi prod, lint, guard, tipi dei test e smoke rigoroso               | Modifiche rilevanti per Node      |
| `check-additional`               | Architettura, boundary, drift degli snapshot dei prompt, guard delle superfici estensione, package-boundary e shard gateway-watch | Modifiche rilevanti per Node      |
| `build-smoke`                    | Test smoke della CLI generata e smoke della memoria di avvio                                                         | Modifiche rilevanti per Node      |
| `checks`                         | Verificatore per test dei canali sugli artefatti generati                                                            | Modifiche rilevanti per Node      |
| `checks-node-compat-node22`      | Lane di build e smoke per la compatibilità Node 22                                                                   | Dispatch CI manuale per rilasci   |
| `check-docs`                     | Formattazione documenti, lint e controlli sui link interrotti                                                        | Documenti modificati              |
| `skills-python`                  | Ruff + pytest per Skills supportate da Python                                                                        | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Test specifici Windows su processi/percorsi più regressioni condivise degli specifier di import runtime              | Modifiche rilevanti per Windows   |
| `macos-node`                     | Lane di test TypeScript macOS usando gli artefatti generati condivisi                                                | Modifiche rilevanti per macOS     |
| `macos-swift`                    | Swift lint, build e test per l’app macOS                                                                             | Modifiche rilevanti per macOS     |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                                   | Modifiche rilevanti per Android   |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                            | Successo della CI su main o dispatch manuale |
| `openclaw-performance`           | Report giornalieri/on-demand sulle prestazioni runtime Kova con lane mock-provider, deep-profile e live GPT 5.4      | Dispatch pianificato e manuale    |

## Ordine fail-fast

1. `preflight` decide quali lane esistono. La logica `docs-scope` e `changed-scope` è composta da step dentro questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artefatti e matrice piattaforma.
3. `build-artifacts` si sovrappone alle lane Linux rapide così i consumatori downstream possono partire appena la build condivisa è pronta.
4. Le lane piattaforma e runtime più pesanti si distribuiscono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può segnare i job superati come `cancelled` quando un push più recente arriva sulla stessa PR o sul ref `main`. Consideralo rumore CI a meno che anche l’esecuzione più recente per lo stesso ref stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()` così riportano comunque i normali errori degli shard, ma non vengono accodati dopo che l’intero workflow è già stato superato. La chiave di concorrenza CI automatica è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni main più recenti. Le esecuzioni manuali dell’intera suite usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Ambito e instradamento

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa comportare il manifest preflight come se ogni area con ambito fosse cambiata.

- **Le modifiche ai workflow CI** validano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle lane piattaforma restano limitate alle modifiche dei sorgenti piattaforma.
- **Le modifiche solo di routing CI, alcune modifiche economiche a fixture core-test e modifiche ristrette a helper/test-routing dei contratti Plugin** usano un percorso manifest rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard bundled-plugin e matrici di guard aggiuntive quando la modifica è limitata alle superfici di routing o helper esercitate direttamente dal task rapido.
- **I controlli Windows Node** sono limitati a wrapper specifici Windows per processi/percorsi, helper npm/pnpm/UI runner, configurazione del package manager e superfici dei workflow CI che eseguono quella lane; modifiche non correlate a sorgenti, Plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate così ogni job resta piccolo senza riservare runner in eccesso: i contratti dei canali girano come tre shard pesati, le piccole lane unit core sono accoppiate, auto-reply gira come quattro worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing), e le configurazioni agentiche gateway/Plugin sono distribuite tra i job Node agentici esistenti solo sorgenti invece di attendere gli artefatti generati. I test broad browser, QA, media e Plugin miscellanei usano le loro configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard include-pattern registrano voci di timing usando il nome shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un’intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro compile/canary package-boundary e separa l’architettura della topologia runtime dalla copertura gateway watch; lo shard boundary guard esegue in parallelo dentro un solo job i suoi piccoli guard indipendenti, incluso `pnpm prompt:snapshots:check` così il drift dei prompt del percorso felice del runtime Codex viene fissato alla PR che lo ha causato. Gateway watch, test dei canali e shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati generati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi genera l’APK debug Play. Il flavor third-party non ha un source set o manifest separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando però un job duplicato di packaging dell’APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo dipendenze di produzione fissato all’ultima versione di Knip, con l’età minima di rilascio di pnpm disabilitata per l’installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file inutilizzati in produzione con `scripts/deadcode-unused-files.allowlist.mjs`. Il guard dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce stale nella allowlist, preservando al contempo superfici intenzionali di Plugin dinamici, generate, di build, live-test e bridge di pacchetto che Knip non può risolvere staticamente.

## Inoltro attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall’attività del repository OpenClaw verso ClawSweeper. Non fa checkout né esegue codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, poi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste di review precise su issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di review a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l’agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo evento, azione, attore, repository, numero dell’elemento, URL, titolo, stato e brevi estratti per commenti o review quando presenti. Evita intenzionalmente di inoltrare l’intero corpo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l’evento normalizzato nell’hook OpenClaw Gateway per l’agente ClawSweeper.

L’attività generale è osservazione, non consegna predefinita. L’agente ClawSweeper riceve il target Discord nel prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l’evento è sorprendente, azionabile, rischioso o utile operativamente. Aperture di routine, modifiche, churn di bot, rumore di webhook duplicati e traffico normale di review dovrebbero produrre `NO_REPLY`.

Tratta titoli GitHub, commenti, body, testo delle review, nomi dei branch e messaggi di commit come dati non attendibili lungo tutto questo percorso. Sono input per sintesi e triage, non istruzioni per il workflow o il runtime dell’agente.

## Dispatch manuali

Le esecuzioni CI manuali eseguono lo stesso grafo dei job della CI normale, ma forzano l'attivazione di ogni corsia con ambito non Android: shard Linux Node, shard dei plugin inclusi, contratti dei canali, compatibilita Node 22, `check`, `check-additional`, build smoke, controlli della documentazione, Skills Python, Windows, macOS e i18n della Control UI. Le esecuzioni CI manuali autonome eseguono solo Android con `include_android=true`; l'ombrello della release completa abilita Android passando `include_android=true`. I controlli statici di prerelease dei plugin, lo shard solo release `agentic-plugins`, la scansione batch completa delle estensioni e le corsie Docker di prerelease dei plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` avvia il workflow separato `Plugin Prerelease` con il gate di validazione release abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, quindi una suite completa di release candidate non viene annullata da un'altra esecuzione push o PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, tag o SHA completo di commit usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Esecutori

| Esecutore                        | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza rapidi e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratti/inclusi, controlli shard dei contratti di canale, shard `check` tranne lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub, cosi la matrice Blacksmith puo accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard di estensioni piu leggeri, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei plugin inclusi, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU da rendere 8 vCPU piu costosi di quanto facessero risparmiare); build Docker install-smoke (il costo del tempo di coda a 32 vCPU superava il risparmio)                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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

## Prestazioni OpenClaw

`OpenClaw Performance` e il workflow delle prestazioni di prodotto/runtime. Viene eseguito ogni giorno su `main` e puo essere avviato manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Il workflow installa OCM da una release fissata e Kova dall'input fissato `kova_ref`, poi esegue tre corsie:

- `mock-provider`: scenari diagnostici Kova su un runtime con build locale e auth finta deterministica compatibile con OpenAI.
- `mock-deep-profile`: profiling CPU/heap/trace per startup, Gateway e hotspot dei turni agente.
- `live-gpt54`: un turno agente reale OpenAI `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non e disponibile.

La corsia mock-provider esegue anche probe sorgente nativi di OpenClaw dopo il passaggio Kova: tempi di avvio del Gateway e memoria nei casi di startup predefinito, hook e con 50 plugin; cicli hello ripetuti di mock-OpenAI `channel-chat-baseline`; e comandi di startup CLI contro il Gateway avviato. Il riepilogo Markdown dei probe sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni corsia carica artefatti GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` e configurato, il workflow esegue anche il commit di `report.json`, `report.md`, bundle, `index.md` e artefatti dei probe sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Il puntatore del branch corrente viene scritto come `openclaw-performance/<ref>/latest-<lane>.json`.

## Validazione completa della release

`Full Release Validation` e il workflow ombrello manuale per "eseguire tutto prima della release". Accetta un branch, un tag o uno SHA completo di commit, avvia il workflow manuale `CI` con quel target, avvia `Plugin Prerelease` per le prove solo release di plugin/pacchetti/statiche/Docker e avvia `OpenClaw Release Checks` per install smoke, accettazione pacchetti, suite del percorso di release Docker, live/E2E, OpenWebUI, parita QA Lab, Matrix e corsie Telegram. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l'artefatto `release-package-under-test` dai controlli release. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa corsia del pacchetto Telegram contro il pacchetto npm pubblicato.

Consulta [Validazione completa della release](/it/reference/full-release-validation) per la matrice
delle fasi, i nomi esatti dei job del workflow, le differenze tra profili, gli artefatti e
gli handle di riesecuzione mirata.

`OpenClaw Release Publish` e il workflow manuale di release mutante. Avvialo
da `release/YYYY.M.D` o `main` dopo che il tag della release esiste e dopo che il
preflight npm di OpenClaw e riuscito. Verifica `pnpm plugins:sync:check`,
avvia `Plugin NPM Release` per tutti i pacchetti plugin pubblicabili, avvia
`Plugin ClawHub Release` per lo stesso SHA di release, e solo allora avvia
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per una prova di commit fissato su un branch in rapido movimento, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA grezzi di commit. L'
helper pubblica un branch temporaneo `release-ci/<sha>-...` allo SHA target,
avvia `Full Release Validation` da quel ref fissato, verifica che ogni
workflow figlio abbia `headSha` corrispondente al target ed elimina il branch temporaneo quando
l'esecuzione termina. Anche il verificatore ombrello fallisce se un workflow figlio e stato eseguito a
uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli release. I
workflow manuali di release hanno come predefinito `stable`; usa `full` solo quando
vuoi intenzionalmente la matrice ampia consultiva di provider/media.

- `minimum` mantiene le corsie OpenAI/core piu veloci e critiche per la release.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue la matrice ampia consultiva di provider/media.

L'ombrello registra gli ID delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job piu lenti per ciascuna esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease del plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull’ombrello. Questo mantiene limitata la riesecuzione di un box di rilascio non riuscito dopo una correzione mirata.

`OpenClaw Release Checks` usa il riferimento del workflow attendibile per risolvere il riferimento selezionato una sola volta in un tarball `release-package-under-test`, quindi passa quell’artefatto sia al workflow Docker del percorso di rilascio live/E2E sia allo shard di accettazione del pacchetto. Questo mantiene coerenti i byte del pacchetto tra i box di rilascio ed evita di riconfezionare lo stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l’ombrello più vecchio. Il monitor padre annulla qualsiasi workflow figlio che
ha già avviato quando il padre viene annullato, quindi la nuova validazione di main
non resta bloccata dietro una vecchia esecuzione di release-check di due ore. La validazione
di branch/tag di rilascio e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E di rilascio mantiene un’ampia copertura nativa `pnpm test:live`, ma la esegue come shard denominati tramite `scripts/test-live-shard.mjs` invece che come un unico job seriale:

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
- shard media audio/video suddivisi e shard musicali filtrati per provider

Questo mantiene la stessa copertura dei file, rendendo al tempo stesso più facile rieseguire e diagnosticare i guasti lenti dei provider live. I nomi di shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali singole.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, costruita dal workflow `Live Media Runner Image`. Quell’immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job in container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live di modello/backend basati su Docker usano un’immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow di rilascio live costruisce e pubblica quell’immagine una sola volta, quindi gli shard del modello live Docker, del Gateway suddiviso per provider, del backend CLI, del binding ACP e dell’harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway portano limiti espliciti di `timeout` a livello di script sotto il timeout del job del workflow, così un container bloccato o un percorso di pulizia fallisce rapidamente invece di consumare l’intero budget di release-check. Se quegli shard ricostruiscono indipendentemente il target Docker completo dei sorgenti, l’esecuzione di rilascio è configurata male e sprecherà tempo di esecuzione su build duplicate dell’immagine.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è “questo pacchetto OpenClaw installabile funziona come prodotto?”. È diverso dalla CI normale: la CI normale valida l’albero dei sorgenti, mentre l’accettazione del pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo installazione o aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa origine, riferimento del workflow, riferimento del pacchetto, versione, SHA-256 e profilo nel riepilogo del passaggio GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell’artefatto, valida l’inventario del tarball, prepara le immagini Docker package-digest quando necessario ed esegue le corsie Docker selezionate contro quel pacchetto invece di confezionare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, quindi distribuisce quelle corsie come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Accettazione del pacchetto ne ha risolto uno; un dispatch Telegram autonomo può comunque installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l’accettazione Docker o la corsia Telegram facoltativa non sono riuscite.

### Origini dei candidati

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta come `openclaw@2026.4.27-beta.2`. Usalo per l’accettazione di prerelease/stable pubblicati.
- `source=ref` confeziona un branch, tag o SHA di commit completo `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in un worktree detached e lo confeziona con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile del workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene confezionato quando `source=ref`. Questo consente all’harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire la vecchia logica del workflow.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk completi Docker del percorso di rilascio con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura Plugin offline, così la validazione del pacchetto pubblicato non dipende dalla disponibilità live di ClawHub. La corsia Telegram facoltativa riutilizza l’artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per i dispatch autonomi.

Per la policy dedicata di test di aggiornamenti e plugin, inclusi comandi locali,
corsie Docker, input di Accettazione del pacchetto, impostazioni predefinite di rilascio e triage degli errori,
vedi [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Accettazione del pacchetto con `source=artifact`, l’artefatto del pacchetto di rilascio preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Questo mantiene la prova di migrazione del pacchetto, aggiornamento, pulizia delle dipendenze stale dei plugin, riparazione dell’installazione dei plugin configurati, plugin offline, aggiornamento dei plugin e Telegram sullo stesso tarball di pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire la stessa matrice contro un pacchetto npm distribuito invece dell’artefatto costruito da SHA. I controlli di rilascio cross-OS coprono comunque onboarding, installer e comportamento di piattaforma specifici del sistema operativo; la validazione di prodotto per pacchetto/aggiornamento dovrebbe iniziare da Accettazione del pacchetto. La corsia Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione. In Accettazione del pacchetto, il tarball risolto `package-under-test` è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con valore predefinito `openclaw@latest`; i comandi di riesecuzione delle corsie non riuscite preservano quella baseline. Imposta `published_upgrade_survivor_baselines=all-since-2026.4.23` per espandere la CI di rilascio completa su ogni rilascio npm stable da `2026.4.23` fino a `latest`; `release-history` resta disponibile per un campionamento manuale più ampio con il vecchio ancoraggio pre-data. Imposta `published_upgrade_survivor_scenarios=reported-issues` per espandere le stesse baseline su fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di plugin OpenClaw configurati, percorsi di log con tilde e radici di dipendenze di plugin legacy stale. Il workflow separato `Update Migration` usa la corsia Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda è la pulizia esaustiva degli aggiornamenti pubblicati, non l’ampiezza normale della CI di rilascio completa. Le esecuzioni aggregate locali possono passare specifiche di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola corsia con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice degli scenari. La corsia pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e sonda `/healthz`, `/readyz` più lo stato RPC dopo l’avvio del Gateway. Le corsie fresh Windows packaged e installer verificano anche che un pacchetto installato possa importare un override di browser-control da un percorso Windows assoluto grezzo. Lo smoke agent-turn cross-OS OpenAI usa come valore predefinito `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando i valori predefiniti GPT-4.x.

### Finestre di compatibilità legacy

Accettazione del pacchetto ha finestre limitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- le voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e può registrare `update.channel` persistito mancante;
- gli smoke dei plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur richiedendo che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` può anche avvisare per file di timbro dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare avvisi o venire saltate.

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

Quando esegui il debug di un'esecuzione di accettazione pacchetto non riuscita, inizia dal riepilogo `resolve_package` per confermare origine, versione e SHA-256 del pacchetto. Poi ispeziona l'esecuzione figlia `docker_acceptance` e i suoi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo di pacchetto non riuscito o le lane Docker esatte invece di rieseguire l'intera validazione di rilascio.

## Smoke di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest dei plugin inclusi o superfici core di plugin/canale/gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche ai soli sorgenti dei plugin inclusi, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido crea una volta l'immagine dal Dockerfile radice, verifica la CLI, esegue lo smoke CLI di eliminazione agenti con workspace condiviso, esegue l'e2e container gateway-network, verifica un argomento di build per un'estensione inclusa ed esegue il profilo Docker limitato dei plugin inclusi con un timeout aggregato dei comandi di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- **Percorso completo** mantiene l'installazione pacchetto QR e la copertura Docker/update dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di rilascio workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riusa un'immagine smoke GHCR del Dockerfile radice per lo SHA di destinazione, poi esegue installazione pacchetto QR, smoke del Dockerfile radice/gateway, smoke installer/update e l'E2E Docker rapido dei plugin inclusi come job separati, così il lavoro dell'installer non attende gli smoke dell'immagine radice.

I push su `main` (inclusi i merge commit) non forzano il percorso completo; quando la logica di ambito delle modifiche richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di rilascio.

Lo smoke lento del provider di immagini con installazione globale Bun è regolato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di rilascio, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila un'immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e crea due immagini condivise `scripts/e2e/Dockerfile`:

- un runner Node/Git essenziale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, quindi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Conteggio degli slot del pool principale per le lane normali.                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Conteggio degli slot del pool tail sensibile ai provider.                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite delle lane live concorrenti, così i provider non applicano throttling.                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite delle lane concorrenti di installazione npm.                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite delle lane multi-servizio concorrenti.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra gli avvii delle lane per evitare tempeste di creazione del demone Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/tail selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset       | `1` stampa il piano dello scheduler senza eseguire lane.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset       | Elenco esatto di lane separate da virgole; salta lo smoke di cleanup così gli agenti possono riprodurre una lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. Il preflight aggregato locale verifica Docker, rimuove container E2E OpenClaw obsoleti, emette lo stato delle lane attive, persiste i tempi delle lane per l'ordinamento dalle più lunghe alle più brevi e per impostazione predefinita interrompe la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riusabile

Il workflow live/E2E riusabile chiede a `scripts/test-docker-all.mjs --plan-json` quale pacchetto, tipo di immagine, immagine live, lane e copertura credenziali siano richiesti. `scripts/docker-e2e.mjs` converte quindi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto pacchetto dell'esecuzione corrente oppure scarica un artefatto pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; crea e pubblica immagini E2E Docker GHCR bare/funzionali taggate con il digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti con digest del pacchetto invece di ricompilare. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico della CI.

### Chunk del percorso di rilascio

La copertura Docker di rilascio esegue job spezzati più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine necessario ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

I chunk Docker di rilascio attuali sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch esclusivi di OpenWebUI. Le lane di aggiornamento dei canali inclusi ritentano una volta in caso di errori di rete npm transitori.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue lane selezionate contro le immagini preparate invece dei job chunk, mantenendo il debug delle lane non riuscite limitato a un singolo job Docker mirato e preparando, scaricando o riusando l'artefatto pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato crea localmente l'immagine live-test per quella riesecuzione. I comandi GitHub generati di riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando quei valori esistono, così una lane non riuscita può riusare il pacchetto e le immagini esatti dell'esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue ogni giorno l'intera suite Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato dispatchato da `Full Release Validation` o da un operatore esplicito. Pull request normali, push su `main` e dispatch CI manuali autonomi tengono quella suite disattivata. Bilancia i test dei plugin inclusi su otto worker di estensione; quei job shard di estensione eseguono fino a due gruppi di configurazione plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch plugin con molte importazioni non creano job CI aggiuntivi. Il percorso di prerelease Docker solo di rilascio raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con ambito intelligente. La parità agentica è annidata negli harness QA e di rilascio ampi, non in un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve accompagnare un'esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce la lane di parità mock, la lane Matrix live e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared`, mentre Telegram/Discord usano lease Convex.

I controlli di rilascio eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza dei modelli live e dal normale avvio dei provider-plugin. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di rilascio, aggiungendo `--fail-fast` solo quando la CLI sottoposta a checkout lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` divide sempre l'intera copertura Matrix nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per il rilascio prima dell'approvazione del rilascio; il suo gate di parità QA esegue i pacchetti candidato e baseline come job di lane paralleli, poi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale di parità.

Per le PR normali, segui le prove CI/check con ambito invece di trattare la parità come uno stato richiesto.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di prima passata, non una scansione completa del repository. Le esecuzioni giornaliere, manuali e di guardia per pull request non in bozza analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La guardia delle pull request resta leggera: si avvia solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. Android e macOS CodeQL restano fuori dai default delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticazione, segreti, sandbox, Cron e baseline del Gateway                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei Plugin di canale, Gateway, Plugin SDK, segreti, punti di audit         |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core di SSRF, parsing IP, guardia di rete, web-fetch e policy SSRF del Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna in uscita e gate di esecuzione strumenti dell’agente                        |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifest, registro, installazione package-manager, source-loading e contratto pacchetto Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l’app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla workflow sanity. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l’app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Mantenuto fuori dai default giornalieri perché la build macOS domina il tempo di esecuzione anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severità errore su superfici ristrette ad alto valore sul runner Blacksmith Linux più piccolo. La sua guardia per pull request è intenzionalmente più piccola del profilo pianificato: le PR non in bozza eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione comandi/modelli/strumenti dell’agente e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice auth/segreti/sandbox/sicurezza, runtime dei canali core e dei Plugin di canale in bundle, protocollo Gateway/metodi server, collegamento runtime memoria/SDK, MCP/processi/consegna in uscita, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader Plugin, Plugin SDK/contratto pacchetto o runtime risposte Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti i dodici shard di qualità per PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di apprendimento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza per autenticazione, segreti, sandbox, Cron e Gateway                                                                               |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema configurazione, migrazione, normalizzazione e IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale in bundle                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratti runtime per esecuzione comandi, dispatch modello/provider, dispatch e code di risposta automatica e control plane ACP                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias memoria del Plugin SDK, collegamento di attivazione runtime memoria e comandi doctor memoria                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda risposte, code di consegna sessione, helper di binding/consegna sessione in uscita, superfici bundle eventi/log diagnostici e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch risposte in ingresso del Plugin SDK, helper payload/chunking/runtime risposte, opzioni risposta canale, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, autenticazione e discovery provider, registrazione runtime provider, default/cataloghi provider e registri web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistenza locale, flussi di controllo Gateway e contratti runtime del control plane delle attività                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime core per fetch/search web, IO media, comprensione media, generazione immagini e generazione media                                                |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registro, superficie pubblica ed entrypoint Plugin SDK                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK lato pacchetto pubblicato e helper del contratto pacchetto Plugin                                                                              |

La qualità resta separata dalla sicurezza così i risultati di qualità possono essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L’espansione CodeQL per Swift, Python e Plugin in bundle dovrebbe essere riaggiunta come lavoro di follow-up con ambito definito o shardizzato solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una corsia di manutenzione Codex guidata dagli eventi per mantenere la documentazione esistente allineata con le modifiche approdate di recente. Non ha una pianificazione pura: un’esecuzione CI riuscita da push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato o quando un’altra esecuzione Docs Agent non saltata è stata creata nell’ultima ora. Quando viene eseguito, rivede l’intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino a `main` corrente, così un’esecuzione oraria può coprire tutte le modifiche su main accumulate dall’ultimo passaggio sui documenti.

### Test Performance Agent

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex guidata dagli eventi per i test lenti. Non ha una pianificazione pura: un’esecuzione CI riuscita da push non bot su `main` può attivarlo, ma viene saltato se un’altra invocazione workflow-run è già stata eseguita o è in esecuzione nello stesso giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliera. La corsia crea un report prestazionale Vitest raggruppato per l’intera suite, consente a Codex di effettuare solo piccole correzioni prestazionali dei test preservando la copertura invece di refactor ampi, quindi riesegue il report dell’intera suite e rifiuta modifiche che riducono il conteggio baseline dei test superati. Se la baseline ha test falliti, Codex può correggere solo fallimenti ovvi e il report dell’intera suite dopo l’agente deve passare prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot approdi, la corsia esegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l’azione Codex può mantenere la stessa postura di sicurezza drop-sudo dell’agente docs.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia delle duplicate dopo l’approdo. Il default è dry-run e chiude solo PR esplicitamente elencate quando `apply=true`. Prima di modificare GitHub, verifica che la PR approdata sia stata mergiata e che ogni duplicata abbia un issue referenziato condiviso o hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più severo sui confini architetturali rispetto all’ambito ampio della piattaforma CI:

- le modifiche alla produzione core eseguono typecheck core prod e core test più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck core test più lint core;
- le modifiche alla produzione extension eseguono typecheck extension prod e extension test più lint extension;
- le modifiche solo ai test extension eseguono typecheck extension test più lint extension;
- le modifiche pubbliche al Plugin SDK o al contratto plugin si espandono al typecheck delle extension perché le extension dipendono da quei contratti core (le scansioni Vitest delle extension restano lavoro di test esplicito);
- gli incrementi di versione solo per metadati di release eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche sconosciute a root/config falliscono in modo sicuro su tutte le lane di controllo.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono quei test, le modifiche sorgente preferiscono mappature esplicite, poi test sibling e dipendenti dell’import graph. La configurazione condivisa di consegna group-room è una delle mappature esplicite: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna risposte sorgente o al prompt di sistema del message-tool passano attraverso i test core delle risposte più le regressioni di consegna Discord e Slack, così una modifica condivisa al default fallisce prima del primo push PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza estesa a livello di harness da rendere l’insieme mappato economico un proxy non affidabile.

## Validazione Testbox

Esegui Testbox dalla radice del repo e preferisci una box appena preparata per una verifica ampia. Prima di spendere un gate lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` all'interno della box.

Il controllo di sanità fallisce rapidamente quando file radice richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito questo significa che lo stato della sincronizzazione remota non è una copia affidabile della PR; arresta quella box e preparane una nuova invece di debuggare il fallimento del test del prodotto. Per PR con eliminazioni massicce intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quell'esecuzione del controllo di sanità.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output successivo alla sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella protezione, oppure usa un valore più grande in millisecondi per diff locali insolitamente grandi.

Crabbox è il secondo percorso di box remota di proprietà del repo per la verifica su Linux quando Blacksmith non è disponibile o quando è preferibile usare capacità cloud proprietaria. Prepara una box, idratala tramite il workflow del progetto, quindi esegui i comandi tramite la CLI Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` gestisce i valori predefiniti di provider, sincronizzazione e idratazione di GitHub Actions. Esclude `.git` locale, così il checkout idratato di Actions mantiene i propri metadati Git remoti invece di sincronizzare remote e object store locali del maintainer, ed esclude gli artefatti locali di runtime/build che non devono mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` gestisce checkout, configurazione di Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto che i successivi comandi `crabbox run --id <cbx_id>` sorgente.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
