---
read_when:
    - Devi capire perché un processo di CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
    - Stai modificando il dispatch di ClawSweeper o l'inoltro dell'attività GitHub
summary: Grafo delle attività CI, controlli di ambito, coperture di release ed equivalenti locali dei comandi
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-10T19:25:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguito a ogni push su `main` e a ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` bypassano intenzionalmente lo scoping intelligente ed espandono l'intero grafo per i candidati di rilascio e la validazione ampia. Le lane Android restano opt-in tramite `include_android`. La copertura dei Plugin solo per il rilascio si trova nel workflow separato [`Plugin Prerelease`](#plugin-prerelease) e viene eseguita solo da [`Full Release Validation`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                     | Quando viene eseguito              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, ambiti modificati, estensioni modificate e genera il manifesto CI | Sempre su push e PR non in bozza   |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                       | Sempre su push e PR non in bozza   |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                              | Sempre su push e PR non in bozza   |
| `security-fast`                  | Aggregato obbligatorio per i job di sicurezza rapidi                                                     | Sempre su push e PR non in bozza   |
| `check-dependencies`             | Passaggio Knip di sola dipendenza di produzione più guardia dell'allowlist dei file inutilizzati          | Modifiche rilevanti per Node        |
| `build-artifacts`                | Genera `dist/`, Control UI, controlli sugli artefatti generati e artefatti downstream riutilizzabili      | Modifiche rilevanti per Node        |
| `checks-fast-core`               | Lane rapide di correttezza Linux, come controlli bundled/plugin-contract/protocol                         | Modifiche rilevanti per Node        |
| `checks-fast-contracts-channels` | Controlli shardati dei contratti dei canali con un risultato di controllo aggregato stabile               | Modifiche rilevanti per Node        |
| `checks-node-core-test`          | Shard dei test Node core, escluse le lane di canali, bundled, contratti ed estensioni                     | Modifiche rilevanti per Node        |
| `check`                          | Equivalente shardato del gate locale principale: tipi prod, lint, guardie, tipi dei test e smoke rigoroso | Modifiche rilevanti per Node        |
| `check-additional`               | Architettura, drift shardato di boundary/prompt, guardie delle estensioni, boundary del package e gateway watch | Modifiche rilevanti per Node   |
| `build-smoke`                    | Test smoke della CLI generata e smoke della memoria di avvio                                             | Modifiche rilevanti per Node        |
| `checks`                         | Verificatore per i test dei canali sugli artefatti generati                                              | Modifiche rilevanti per Node        |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                          | Dispatch CI manuale per i rilasci   |
| `check-docs`                     | Formattazione della documentazione, lint e controlli dei link interrotti                                 | Documentazione modificata           |
| `skills-python`                  | Ruff + pytest per Skills supportate da Python                                                            | Modifiche rilevanti per Skill Python |
| `checks-windows`                 | Test specifici di processo/percorso per Windows più regressioni condivise degli specificatori di import runtime | Modifiche rilevanti per Windows |
| `macos-node`                     | Lane di test TypeScript su macOS usando gli artefatti generati condivisi                                 | Modifiche rilevanti per macOS       |
| `macos-swift`                    | Swift lint, build e test per l'app macOS                                                                 | Modifiche rilevanti per macOS       |
| `android`                        | Test unitari Android per entrambe le flavor più una build APK di debug                                   | Modifiche rilevanti per Android     |
| `test-performance-agent`         | Ottimizzazione quotidiana dei test lenti di Codex dopo attività attendibile                              | Successo della CI su main o dispatch manuale |
| `openclaw-performance`           | Report di performance runtime Kova giornalieri/su richiesta con lane mock-provider, deep-profile e GPT 5.4 live | Dispatch pianificato e manuale |

## Ordine fail-fast

1. `preflight` decide quali lane esistono effettivamente. La logica `docs-scope` e `changed-scope` è costituita da step all'interno di questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice di artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer downstream possono partire appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime si espandono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job sostituiti come `cancelled` quando un push più recente arriva sulla stessa PR o sullo stesso ref `main`. Consideralo rumore CI a meno che anche l'esecuzione più recente per lo stesso ref non stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()` così segnalano comunque i normali errori degli shard, ma non si accodano dopo che l'intero workflow è già stato sostituito. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni più recenti su main. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

Il job `ci-timings-summary` carica un artefatto compatto `ci-timings-summary` per ogni esecuzione CI non in bozza. Registra wall time, tempo in coda, job più lenti e job falliti per l'esecuzione corrente, così i controlli di salute della CI non devono effettuare ripetutamente lo scraping del payload Actions completo.

## Ambito e routing

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifesto preflight come se ogni area con ambito fosse cambiata.

- **Le modifiche ai workflow CI** validano il grafo CI Node più il linting dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del codice sorgente della piattaforma.
- **Le modifiche solo al routing CI, modifiche selezionate a fixture economiche dei test core e modifiche ristrette a helper/test-routing dei contratti dei plugin** usano un percorso manifesto rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei plugin bundled e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper esercitate direttamente dal task rapido.
- **I controlli Node Windows** sono limitati a wrapper di processo/percorso specifici per Windows, helper di runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono suddivise o bilanciate così ogni job resta piccolo senza prenotare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard pesati supportati da Blacksmith con fallback al runner GitHub standard, le lane core unit fast/support vengono eseguite separatamente, l'infrastruttura runtime core è divisa tra shard state, process/config, cron e shared, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentic gateway/server sono divise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti generati. I test ampi di browser, QA, media e plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. Gli shard include-pattern registrano voci di timing usando il nome shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` tiene insieme il lavoro compile/canary del package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; l'elenco delle guardie boundary è distribuito su quattro shard di matrice, ognuno dei quali esegue in parallelo guardie indipendenti selezionate e stampa i tempi per controllo. Il costoso controllo di drift degli snapshot dei prompt happy-path di Codex viene eseguito come job aggiuntivo autonomo per la CI manuale e solo per modifiche che incidono sui prompt, così le normali modifiche Node non correlate non attendono la generazione a freddo degli snapshot dei prompt e gli shard boundary restano bilanciati mentre il drift dei prompt rimane comunque ancorato alla PR che lo ha causato; lo stesso flag salta la generazione Vitest degli snapshot dei prompt all'interno dello shard core support-boundary sugli artefatti generati. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in parallelo all'interno di `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati generati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi genera l'APK Play di debug. La flavor di terze parti non ha un source set o manifesto separato; la sua lane di test unitari compila comunque la flavor con i flag SMS/call-log BuildConfig, evitando al contempo un job duplicato di packaging APK di debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip di sola dipendenza di produzione fissato alla versione Knip più recente, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip dei file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al contempo superfici intenzionali dinamiche di plugin, generate, di build, live-test e bridge di package che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato target dall'attività del repository OpenClaw a ClawSweeper. Non effettua checkout né esegue codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, poi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di revisione di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o revisioni quando presenti. Evita intenzionalmente di inoltrare il corpo completo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sull'hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel suo prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o operativamente utile. Aperture di routine, modifiche, churn di bot, rumore di webhook duplicati e traffico normale di review dovrebbero risultare in `NO_REPLY`.

Tratta titoli, commenti, corpi, testo delle review, nomi di branch e messaggi di commit di GitHub come dati non attendibili in tutto questo percorso. Sono input per la sintesi e il triage, non istruzioni per il workflow o per il runtime dell'agente.

## Dispatch manuali

I dispatch manuali della CI eseguono lo stesso grafo di job della CI normale, ma forzano l'attivazione di ogni lane con ambito non Android: shard Linux Node, shard dei Plugin in bundle, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Skills Python, Windows, macOS e i18n della Control UI. I dispatch CI manuali autonomi eseguono solo Android con `include_android=true`; l'umbrella completo del rilascio abilita Android passando `include_android=true`. I controlli statici di pre-release dei Plugin, lo shard solo per il rilascio `agentic-plugins`, lo sweep batch completo delle estensioni e le lane Docker di pre-release dei Plugin sono esclusi dalla CI. La suite Docker di pre-release viene eseguita solo quando `Full Release Validation` invia il workflow separato `Plugin Prerelease` con il gate di convalida del rilascio abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa di release candidate non viene annullata da un'altra esecuzione push o PR sullo stesso ref. L'input facoltativo `target_ref` consente a un chiamante attendibile di eseguire quel grafo contro un branch, un tag o uno SHA completo di commit usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza veloci (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli veloci di protocollo/contratto/bundle, controlli shardati dei contratti dei canali, shard di `check` tranne lint, aggregati `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard di estensioni a peso inferiore, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shard di test Linux Node, shard di test dei Plugin in bundle, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (abbastanza sensibile alla CPU che 8 vCPU costavano più di quanto facessero risparmiare); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

La CI del repository canonico mantiene Blacksmith come percorso Runner predefinito. Durante `preflight`, `scripts/ci-runner-labels.mjs` controlla le esecuzioni Actions recenti in coda e in corso per individuare job Blacksmith accodati. Se una specifica etichetta Blacksmith ha già job in coda, i job a valle che userebbero quella stessa etichetta ripiegano sul Runner GitHub-hosted corrispondente (`ubuntu-24.04`, `windows-2025` o `macos-latest`) solo per quell'esecuzione. Le altre dimensioni Blacksmith nella stessa famiglia OS restano sulle loro etichette primarie. Se la sonda API fallisce, non viene applicato alcun fallback.

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

## Prestazioni di OpenClaw

`OpenClaw Performance` è il workflow di prestazioni del prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere inviato manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Il dispatch manuale normalmente esegue benchmark sul ref del workflow. Imposta `target_ref` per eseguire benchmark su un tag di rilascio o su un altro branch con l'implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori latest sono indicizzati dal ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref Kova, profilo, modalità auth della lane, modello, conteggio delle ripetizioni e filtri degli scenari.

Il workflow installa OCM da un rilascio fissato e Kova da `openclaw/Kova` all'input `kova_ref` fissato, quindi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova contro un runtime di build locale con auth fittizia deterministica compatibile con OpenAI.
- `mock-deep-profile`: profilazione CPU/heap/trace per hotspot di avvio, Gateway e turno dell'agente.
- `live-gpt54`: un turno reale di agente OpenAI `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche sonde sorgente native OpenClaw dopo il passaggio Kova: timing di avvio del Gateway e memoria nei casi di avvio predefinito, con hook e con 50 Plugin; cicli hello ripetuti `channel-chat-baseline` mock-OpenAI; e comandi di avvio CLI contro il Gateway avviato. Il riepilogo Markdown delle sonde sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artifact GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow esegue anche commit di `report.json`, `report.md`, bundle, `index.md` e artifact delle sonde sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Convalida completa del rilascio

`Full Release Validation` è il workflow umbrella manuale per "eseguire tutto prima del rilascio". Accetta un branch, un tag o uno SHA completo di commit, invia il workflow manuale `CI` con quel target, invia `Plugin Prerelease` per la prova solo rilascio di Plugin/pacchetti/statici/Docker e invia `OpenClaw Release Checks` per smoke di installazione, accettazione pacchetto, controlli pacchetto cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite mantengono la copertura live/E2E esaustiva e del percorso di rilascio Docker dietro `run_release_soak=true`; `release_profile=full` forza l'attivazione di quella copertura soak così la convalida consultiva ampia resta ampia. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l'artifact `release-package-under-test` dei controlli di rilascio. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa lane del pacchetto Telegram contro il pacchetto npm pubblicato.

Consulta [Convalida completa del rilascio](/it/reference/full-release-validation) per la
matrice degli stage, i nomi esatti dei job del workflow, le differenze tra profili, gli artifact e
gli handle di riesecuzione mirati.

`OpenClaw Release Publish` è il workflow manuale di rilascio mutante. Invialo
da `release/YYYY.M.D` o `main` dopo che il tag di rilascio esiste e dopo che il
preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
invia `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, invia
`Plugin ClawHub Release` per lo stesso SHA di rilascio, e solo dopo invia
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

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L'helper invia un branch temporaneo `release-ci/<sha>-...` allo SHA di destinazione, esegue il dispatch di `Full Release Validation` da quel ref fissato, verifica che ogni `headSha` dei workflow figli corrisponda alla destinazione ed elimina il branch temporaneo al completamento dell'esecuzione. Anche il verificatore ombrello fallisce se un workflow figlio è stato eseguito a uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di rilascio. I workflow di rilascio manuali usano per impostazione predefinita `stable`; usa `full` solo quando vuoi intenzionalmente l'ampia matrice consultiva di provider/media. `run_release_soak` controlla se i controlli di rilascio stable/predefiniti eseguono il soak esaustivo live/E2E e Docker del percorso di rilascio; `full` forza l'attivazione del soak.

- `minimum` mantiene le lane OpenAI/core critiche per il rilascio più rapide.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva di provider/media.

L'ombrello registra gli ID delle esecuzioni figlie inviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato dell'ombrello e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di pre-rilascio del Plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene limitata la riesecuzione di un box di rilascio fallito dopo una correzione mirata. Per una singola lane cross-OS fallita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, per esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe di Heartbeat e i riepiloghi packaged-upgrade includono tempi per fase. Le lane QA dei controlli di rilascio sono consultive, quindi i fallimenti solo QA avvisano ma non bloccano il verificatore dei controlli di rilascio.

`OpenClaw Release Checks` usa il ref di workflow attendibile per risolvere una sola volta il ref selezionato in un tarball `release-package-under-test`, poi passa quell'artefatto ai controlli cross-OS e a Package Acceptance, oltre al workflow Docker live/E2E del percorso di rilascio quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra i box di rilascio ed evita di ricreare lo stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'ombrello più vecchio. Il monitor padre annulla qualsiasi workflow figlio che ha già inviato quando il padre viene annullato, quindi la validazione più recente di main non resta in coda dietro un'esecuzione obsoleta di controlli di rilascio da due ore. La validazione di branch/tag di rilascio e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E di rilascio mantiene un'ampia copertura nativa `pnpm test:live`, ma la esegue come shard denominati tramite `scripts/test-live-shard.mjs` invece che come un unico job seriale:

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
- shard media audio/video divisi e shard musicali filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più semplice rieseguire e diagnosticare i fallimenti dei provider live lenti. I nomi degli shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima del setup. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live modello/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit selezionato. Il workflow live di rilascio crea e invia quell'immagine una sola volta, poi gli shard modello live Docker, Gateway divisi per provider, backend CLI, bind ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway portano limiti espliciti di `timeout` a livello di script inferiori al timeout del job del workflow, così un container bloccato o un percorso di cleanup fallisce rapidamente invece di consumare l'intero budget dei controlli di rilascio. Se quegli shard ricostruiscono indipendentemente il target Docker sorgente completo, l'esecuzione di rilascio è configurata male e sprecherà tempo reale in build di immagini duplicate.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale valida l'albero sorgente, mentre l'accettazione del pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato di pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa sorgente, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara immagini Docker package-digest quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, poi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; il dispatch Telegram autonomo può ancora installare una spec npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram facoltativa è fallita.

### Sorgenti candidate

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta come `openclaw@2026.4.27-beta.2`. Usa questo per l'accettazione di prerelease/stable pubblicati.
- `source=ref` impacchetta un branch, tag o SHA di commit completo `package_ref` attendibile. Il risolutore recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in una worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile di workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire logica di workflow vecchia.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk Docker completi del percorso di rilascio con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura Plugin offline, così la validazione del pacchetto pubblicato non è vincolata alla disponibilità live di ClawHub. La lane Telegram facoltativa riusa l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della spec npm pubblicata per i dispatch autonomi.

Per la policy dedicata di aggiornamento e test dei Plugin, inclusi comandi locali, lane Docker, input di Package Acceptance, impostazioni predefinite di rilascio e triage dei fallimenti, vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Package Acceptance con `source=artifact`, l'artefatto del pacchetto di rilascio preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene la migrazione del pacchetto, l'aggiornamento, l'installazione live di Skills ClawHub, il cleanup di dipendenze obsolete dei Plugin, la riparazione dell'installazione di Plugin configurati, Plugin offline, aggiornamento dei Plugin e prova Telegram sullo stesso tarball di pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire la stessa matrice contro un pacchetto npm distribuito invece che contro l'artefatto costruito dallo SHA. I controlli di rilascio cross-OS coprono comunque onboarding, installer e comportamento di piattaforma specifici del sistema operativo; la validazione del prodotto per pacchetto/aggiornamento dovrebbe iniziare con Package Acceptance. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione nel percorso di rilascio bloccante. In Package Acceptance, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, per impostazione predefinita `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Full Release Validation con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` per espandere sui quattro ultimi rilasci stable npm più rilasci di confine fissati per la compatibilità dei Plugin e fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni configurate del Plugin OpenClaw, percorsi di log con tilde e root obsolete di dipendenze legacy dei Plugin. Le selezioni published-upgrade survivor multi-baseline sono suddivise per baseline in job runner Docker mirati separati. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda è il cleanup esaustivo degli aggiornamenti pubblicati, non l'ampiezza normale della Full Release CI. Le esecuzioni aggregate locali possono passare spec di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` integrata, registra i passaggi della ricetta in `summary.json` e sonda `/healthz`, `/readyz` più lo stato RPC dopo l'avvio del Gateway. Le lane Windows packaged e installer fresh verificano anche che un pacchetto installato possa importare un override browser-control da un percorso Windows assoluto grezzo. Lo smoke cross-OS agent-turn di OpenAI usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando impostazioni predefinite GPT-4.x.

### Finestre di compatibilità legacy

L'Accettazione dei pacchetti ha finestre di compatibilità legacy limitate per i pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- le voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può rimuovere le `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e può registrare la mancanza di `update.channel` persistito;
- gli smoke test dei plugin possono leggere posizioni legacy dei record di installazione o accettare la mancanza della persistenza dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur continuando a richiedere che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` può anche emettere avvisi per i file di timbro dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare avvisi o venire saltate.

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

Quando esegui il debug di un'esecuzione di accettazione dei pacchetti non riuscita, parti dal riepilogo `resolve_package` per confermare origine del pacchetto, versione e SHA-256. Poi ispeziona l'esecuzione figlia `docker_acceptance` e i relativi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo del pacchetto non riuscito o le lane Docker esatte invece di rieseguire l'intera validazione di rilascio.

## Smoke test di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per le pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest di plugin inclusi o superfici core plugin/canale/Gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche ai soli sorgenti dei plugin inclusi, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido crea una volta l'immagine del Dockerfile radice, controlla la CLI, esegue lo smoke della CLI di eliminazione agenti in workspace condiviso, esegue l'e2e gateway-network del container, verifica un argomento di build di una estensione inclusa ed esegue il profilo Docker limitato dei plugin inclusi entro un timeout complessivo dei comandi di 240 secondi (ogni esecuzione Docker dello scenario ha un limite separato).
- **Percorso completo** mantiene l'installazione pacchetto QR e la copertura Docker/update dell'installer per le esecuzioni programmate notturne, i dispatch manuali, i controlli di rilascio tramite workflow-call e le pull request che toccano realmente superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riusa un'immagine smoke GHCR del Dockerfile radice per lo SHA di destinazione, quindi esegue installazione pacchetto QR, smoke del Dockerfile radice/Gateway, smoke installer/update e Docker E2E rapido dei plugin inclusi come job separati, così il lavoro dell'installer non resta in attesa degli smoke dell'immagine radice.

I push su `main` (inclusi i merge commit) non forzano il percorso completo; quando la logica degli ambiti modificati richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke completo di installazione alla validazione notturna o di rilascio.

Lo smoke lento del provider di immagini per installazione globale Bun è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di rilascio, e i dispatch manuali di `Install Smoke` possono abilitarlo esplicitamente, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila una immagine live-test condivisa, impacchetta OpenClaw una sola volta come tarball npm e crea due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git minimale per le lane installer/update/plugin-dependency;
- una immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del pianificatore vive in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, quindi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool di coda sensibile ai provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite delle lane live concorrenti affinché i provider non applichino throttling.              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite delle lane di installazione npm concorrenti.                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite delle lane multi-servizio concorrenti.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra gli avvii delle lane per evitare tempeste di creazione del daemon Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/tail selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostato | `1` stampa il piano dello scheduler senza eseguire le lane.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostato | Elenco esatto di lane separato da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. Il preflight aggregato locale controlla Docker, rimuove i container OpenClaw E2E obsoleti, emette lo stato delle lane attive, persiste i tempi delle lane per l'ordinamento dalla più lunga e, per impostazione predefinita, smette di pianificare nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quali pacchetto, tipo di immagine, immagine live, lane e copertura delle credenziali siano necessari. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto pacchetto dell'esecuzione corrente oppure scarica un artefatto pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; crea e invia immagini Docker E2E GHCR bare/funzionali taggate con il digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti basate sul digest del pacchetto invece di ricrearle. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico della CI.

### Segmenti del percorso di rilascio

La copertura Docker di rilascio esegue job segmentati più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni segmento scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

I segmenti Docker di rilascio correnti sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa del percorso di rilascio lo richiede, e mantiene un segmento autonomo `openwebui` solo per dispatch specifici di OpenWebUI. Le lane di aggiornamento dei canali inclusi ritentano una volta in caso di errori transitori di rete npm.

Ogni segmento carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job a segmenti, mantenendo il debug delle lane non riuscite limitato a un job Docker mirato e preparando, scaricando o riusando l'artefatto pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato crea localmente l'immagine live-test per quella riesecuzione. I comandi GitHub generati per la riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando quei valori esistono, così una lane non riuscita può riusare il pacchetto e le immagini esatti dell'esecuzione fallita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E programmato esegue quotidianamente l'intera suite Docker del percorso di rilascio.

## Prerelease dei Plugin

`Plugin Prerelease` è una copertura di prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le pull request normali, i push su `main` e i dispatch CI manuali autonomi mantengono disattivata quella suite. Bilancia i test dei plugin inclusi su otto worker di estensione; quei job shard di estensione eseguono fino a due gruppi di configurazione plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di plugin con import pesanti non creano job CI aggiuntivi. Il percorso prerelease Docker solo per il rilascio raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab dispone di lane CI dedicate al di fuori del workflow principale con ambito intelligente. La parità agentica è annidata sotto gli harness QA ampi e di rilascio, non in un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve viaggiare con una esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; espande la lane di parità mock, la lane Matrix live e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared`, mentre Telegram/Discord usano lease Convex.

I controlli di rilascio eseguono le lane di trasporto live di Matrix e Telegram con il provider mock deterministico e i modelli qualificati per mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`) così che il contratto del canale sia isolato dalla latenza del modello live e dal normale avvio del Plugin del provider. Il gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività del provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di rilascio, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input del workflow manuale restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura completa di Matrix nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per il rilascio prima dell'approvazione del rilascio; il suo gate di parità QA esegue i pacchetti candidato e baseline come job di lane paralleli, quindi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale della parità.

Per le PR normali, segui le prove CI/di controllo con ambito definito invece di trattare la parità come uno stato obbligatorio.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non una scansione completa del repository. Le esecuzioni di guardia giornaliere, manuali e per pull request non in bozza analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La guardia per pull request resta leggera: si avvia solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. Android e macOS CodeQL restano fuori dai valori predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segreti, sandbox, cron e baseline del gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei Plugin di canale, Gateway, Plugin SDK, segreti, punti di contatto audit |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici SSRF core, parsing IP, guardia di rete, web-fetch e policy SSRF del Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna in uscita e gate di esecuzione strumenti degli agenti                       |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifest, registry, installazione package manager, caricamento sorgenti e contratto dei pacchetti del Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla verifica di sanità del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai valori predefiniti giornalieri perché la build macOS domina il tempo di esecuzione anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript con severità errore e non di sicurezza su superfici ristrette ad alto valore sul runner Blacksmith Linux più piccolo. La sua guardia per pull request è intenzionalmente più piccola del profilo pianificato: le PR non in bozza eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione comandi/modelli/strumenti degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice auth/segreti/sandbox/sicurezza, runtime dei canali core e dei Plugin di canale inclusi, protocollo Gateway/metodi server, runtime memoria/collante SDK, MCP/processi/consegna in uscita, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader Plugin, Plugin SDK/contratto dei pacchetti o runtime di risposta del Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità per PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di apprendimento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice dei confini di sicurezza per auth, segreti, sandbox, cron e gateway                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Schema di configurazione, migrazione, normalizzazione e contratti IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale inclusi                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratti runtime di esecuzione comandi, dispatch modelli/provider, dispatch e code di risposta automatica e piano di controllo ACP                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facciate runtime memoria, alias memoria del Plugin SDK, collante di attivazione del runtime memoria e comandi doctor della memoria               |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda di risposta, code di consegna sessione, helper di binding/consegna sessione in uscita, superfici bundle eventi/log diagnostici e contratti CLI doctor della sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso del Plugin SDK, helper payload/chunking/runtime delle risposte, opzioni di risposta dei canali, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, auth e discovery provider, registrazione runtime provider, impostazioni predefinite/cataloghi provider e registri web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI di controllo, persistenza locale, flussi di controllo Gateway e contratti runtime del piano di controllo task                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime per fetch/search web core, IO media, comprensione media, generazione immagini e generazione media                                                |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registry, superficie pubblica ed entrypoint Plugin SDK                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK lato pacchetto pubblicato e helper del contratto dei pacchetti Plugin                                                                         |

La qualità resta separata dalla sicurezza così che i risultati di qualità possano essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere riaggiunta come lavoro di follow-up con ambito definito o suddiviso in shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche approdate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita su `main` per push non bot può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato o quando un'altra esecuzione Docs Agent non saltata è stata creata nell'ultima ora. Quando viene eseguito, rivede l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato all'attuale `main`, così una singola esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sulla documentazione.

### Test Performance Agent

Il workflow `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita su `main` per push non bot può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliero. La lane costruisce un report prestazionale Vitest raggruppato dell'intera suite, permette a Codex di apportare solo piccole correzioni delle prestazioni dei test che preservano la copertura invece di refactor ampi, quindi riesegue il report dell'intera suite e rifiuta modifiche che riducono il conteggio baseline dei test passati. Se la baseline ha test falliti, Codex può correggere solo fallimenti ovvi e il report dell'intera suite post-agente deve passare prima che venga eseguito qualunque commit. Quando `main` avanza prima che il push del bot approdi, la lane riesegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così che l'azione Codex possa mantenere la stessa postura di sicurezza drop-sudo dell'agente della documentazione.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia dei duplicati dopo l'approdo. Per impostazione predefinita è dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di mutare GitHub, verifica che la PR approdata sia stata mergiata e che ogni duplicato abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche di produzione del core eseguono il typecheck di produzione del core e quello dei test del core, più lint/guard del core;
- le modifiche solo ai test del core eseguono solo il typecheck dei test del core, più il lint del core;
- le modifiche di produzione delle estensioni eseguono il typecheck di produzione delle estensioni e quello dei test delle estensioni, più il lint delle estensioni;
- le modifiche solo ai test delle estensioni eseguono il typecheck dei test delle estensioni, più il lint delle estensioni;
- le modifiche all’SDK Plugin pubblico o ai contratti dei Plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti del core (gli sweep Vitest delle estensioni restano lavoro di test esplicito);
- gli incrementi di versione solo dei metadati di release eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro verso tutte le corsie di controllo.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente meno costoso di `check:changed`: le modifiche dirette ai test eseguono i test stessi, le modifiche al sorgente preferiscono mapping espliciti, poi test fratelli e dipendenti del grafo degli import. La configurazione condivisa di consegna delle stanze di gruppo è uno dei mapping espliciti: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test delle risposte del core più le regressioni di consegna Discord e Slack, così una modifica predefinita condivisa fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza estesa a tutto l’harness da rendere l’insieme mappato economico un proxy non affidabile.

## Convalida Testbox

Esegui Testbox dalla root del repo e preferisci una box nuova già scaldata per prove ampie. Prima di spendere un gate lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il sanity check fallisce rapidamente quando file root richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato di sincronizzazione remoto non è una copia affidabile della PR; ferma quella box e scaldane una nuova invece di eseguire il debug del fallimento del test del prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quell’esecuzione sanity.

`pnpm testbox:run` termina anche un’invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella guardia, oppure usa un valore in millisecondi più grande per diff locali insolitamente grandi.

Crabbox è il wrapper di remote box di proprietà del repo per la prova Linux dei maintainer. Usalo quando un controllo è troppo ampio per un ciclo di modifica locale, quando la parità con CI è importante o quando la prova richiede segreti, Docker, corsie di pacchetti, box riutilizzabili o log remoti. Il normale backend OpenClaw è `blacksmith-testbox`; la capacità AWS/Hetzner di proprietà è un fallback per outage di Blacksmith, problemi di quota o test espliciti su capacità di proprietà.

Prima di una prima esecuzione, controlla il wrapper dalla root del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox obsoleto che non dichiara `blacksmith-testbox`. Passa esplicitamente il provider anche se `.crabbox.yaml` ha default owned-cloud.

Gate modificato:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Riesecuzione di test mirata:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Suite completa:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Le esecuzioni Crabbox one-shot basate su Blacksmith dovrebbero fermare automaticamente Testbox; se un’esecuzione viene interrotta o la pulizia non è chiara, ispeziona le box live e ferma solo le box che hai creato:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa il riutilizzo solo quando hai intenzionalmente bisogno di più comandi sulla stessa box idratata:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se Crabbox è il livello rotto ma Blacksmith stesso funziona, usa Blacksmith diretto come fallback ristretto:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Se `blacksmith testbox list --all` e `blacksmith testbox status` funzionano ma i nuovi warmup restano `queued` senza IP o URL di esecuzione Actions dopo un paio di minuti, trattalo come pressione del provider Blacksmith, della coda, della fatturazione o dei limiti dell’organizzazione. Ferma gli ID in coda che hai creato, evita di avviare altre Testbox e sposta la prova sul percorso di capacità Crabbox di proprietà qui sotto mentre qualcuno controlla la dashboard Blacksmith, la fatturazione e i limiti dell’organizzazione.

Passa alla capacità Crabbox di proprietà solo quando Blacksmith è giù, limitato da quota, manca dell’ambiente necessario o la capacità di proprietà è esplicitamente l’obiettivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sotto pressione AWS, evita `class=beast` a meno che il task non richieda davvero CPU di classe 48xlarge. Una richiesta `beast` parte da 192 vCPU ed è il modo più facile per far scattare la quota regionale EC2 Spot o On-Demand Standard. I default `.crabbox.yaml` di proprietà del repo sono `standard`, più regioni di capacità e `capacity.hints: true`, così i lease AWS intermediati stampano regione/mercato selezionati, pressione di quota, fallback Spot e avvisi di classe ad alta pressione. Usa `fast` per controlli ampi più pesanti, `large` solo dopo che standard/fast non sono sufficienti e `beast` solo per corsie eccezionali vincolate alla CPU come suite completa o matrici Docker di tutti i Plugin, convalida esplicita di release/bloccanti o profiling delle prestazioni ad alto numero di core. Non usare `beast` per `pnpm check:changed`, test mirati, lavoro solo sui documenti, lint/typecheck ordinari, piccole riproduzioni E2E o triage di outage Blacksmith. Usa `--market on-demand` per la diagnosi di capacità, così la variabilità del mercato Spot non si mescola al segnale.

`.crabbox.yaml` possiede i default di provider, sincronizzazione e idratazione GitHub Actions per le corsie owned-cloud. Esclude `.git` locale così il checkout Actions idratato conserva i propri metadati Git remoti invece di sincronizzare remoti e object store locali del maintainer, ed esclude artefatti locali di runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione Node/pnpm, fetch di `origin/main` e passaggio dell’ambiente non segreto per i comandi owned-cloud `crabbox run --id <cbx_id>`.

## Correlati

- [Panoramica dell’installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
