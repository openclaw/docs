---
read_when:
    - È necessario capire perché un job di CI è stato eseguito oppure no
    - Stai diagnosticando un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione di validazione del rilascio
    - Stai modificando lo smistamento di ClawSweeper o l'inoltro delle attività di GitHub
summary: Grafo dei job CI, gate di ambito, raggruppamenti di rilascio ed equivalenti dei comandi locali
title: Flusso di CI
x-i18n:
    generated_at: "2026-05-11T20:22:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e per ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` bypassano intenzionalmente lo scoping intelligente e aprono l’intero grafo per i candidati di release e la validazione ampia. Le lane Android restano opt-in tramite `include_android`. La copertura dei Plugin solo per release vive nel workflow separato [`pre-release dei Plugin`](#plugin-prerelease) e viene eseguita solo da [`validazione completa della release`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                     | Quando viene eseguito             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Rileva modifiche solo ai documenti, ambiti modificati, estensioni modificate e genera il manifesto CI      | Sempre su push e PR non draft     |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                        | Sempre su push e PR non draft     |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                               | Sempre su push e PR non draft     |
| `security-fast`                  | Aggregato obbligatorio per i job di sicurezza rapidi                                                       | Sempre su push e PR non draft     |
| `check-dependencies`             | Passaggio Knip solo dipendenze di produzione più guardia allowlist dei file inutilizzati                   | Modifiche rilevanti per Node      |
| `build-artifacts`                | Build di `dist/`, Control UI, controlli degli artefatti buildati e artefatti downstream riutilizzabili     | Modifiche rilevanti per Node      |
| `checks-fast-core`               | Lane rapide di correttezza Linux, come controlli bundled/contratti dei Plugin/protocollo                  | Modifiche rilevanti per Node      |
| `checks-fast-contracts-channels` | Controlli sharded dei contratti dei canali con un risultato aggregato stabile                             | Modifiche rilevanti per Node      |
| `checks-node-core-test`          | Shard dei test core Node, escluse le lane canali, bundled, contratti ed estensioni                        | Modifiche rilevanti per Node      |
| `check`                          | Equivalente sharded del gate locale principale: tipi prod, lint, guardie, tipi test e smoke rigoroso       | Modifiche rilevanti per Node      |
| `check-additional`               | Architettura, drift sharded di boundary/prompt, guardie estensioni, boundary package e gateway watch       | Modifiche rilevanti per Node      |
| `build-smoke`                    | Smoke test della CLI buildata e smoke della memoria di avvio                                               | Modifiche rilevanti per Node      |
| `checks`                         | Verificatore per i test canale degli artefatti buildati                                                    | Modifiche rilevanti per Node      |
| `checks-node-compat-node22`      | Build di compatibilità Node 22 e lane smoke                                                                | Dispatch CI manuale per release   |
| `check-docs`                     | Formattazione, lint e controlli link interrotti dei documenti                                              | Documenti modificati              |
| `skills-python`                  | Ruff + pytest per Skills supportate da Python                                                             | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Test specifici Windows su processi/percorsi più regressioni condivise sugli specifier di import runtime    | Modifiche rilevanti per Windows   |
| `macos-node`                     | Lane di test TypeScript macOS che usa gli artefatti buildati condivisi                                     | Modifiche rilevanti per macOS     |
| `macos-swift`                    | Lint, build e test Swift per l’app macOS                                                                   | Modifiche rilevanti per macOS     |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                         | Modifiche rilevanti per Android   |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                 | Successo CI main o dispatch manuale |
| `openclaw-performance`           | Report prestazionali runtime Kova giornalieri/on-demand con lane mock-provider, deep-profile e GPT 5.4 live | Pianificato e dispatch manuale    |

## Ordine fail-fast

1. `preflight` decide quali lane esistono effettivamente. La logica `docs-scope` e `changed-scope` è costituita da step dentro questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumatori downstream possono iniziare non appena la build condivisa è pronta.
4. Le lane di piattaforma e runtime più pesanti si aprono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può marcare come `cancelled` i job superati quando un push più recente arriva sulla stessa PR o sullo stesso ref `main`. Trattalo come rumore CI, a meno che anche l’esecuzione più recente per lo stesso ref stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()`, quindi riportano comunque i normali fallimenti degli shard ma non si accodano dopo che l’intero workflow è già stato superato. La chiave di concorrenza CI automatica è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni main più recenti. Le esecuzioni manuali dell’intera suite usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

Il job `ci-timings-summary` carica un artefatto compatto `ci-timings-summary` per ogni esecuzione CI non draft. Registra tempo wall-clock, tempo in coda, job più lenti e job falliti per l’esecuzione corrente, così i controlli di salute CI non devono raschiare ripetutamente l’intero payload Actions.

## Ambito e routing

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa comportare il manifesto preflight come se ogni area scoped fosse cambiata.

- **Le modifiche ai workflow CI** validano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle lane di piattaforma restano scoped alle modifiche del sorgente di piattaforma.
- **Le modifiche solo al routing CI, modifiche selezionate a fixture economiche dei core-test e modifiche ristrette a helper/test-routing dei contratti Plugin** usano un percorso manifesto rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti canale, shard core completi, shard dei Plugin bundled e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper esercitate direttamente dal task rapido.
- **I controlli Node Windows** sono scoped ai wrapper specifici Windows per processi/percorsi, helper runner npm/pnpm/UI, configurazione del package manager e superfici dei workflow CI che eseguono quella lane; modifiche non correlate a sorgenti, Plugin, install-smoke e sole modifiche ai test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti canale vengono eseguiti come tre shard pesati con backend Blacksmith e fallback al runner GitHub standard, le lane core unit fast/support vengono eseguite separatamente, l’infrastruttura runtime core è divisa tra shard state, process/config, cron e shared, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing), e le configurazioni agentic gateway/server sono divise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti buildati. I test ampi browser, QA, media e Plugin vari usano le proprie configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard include-pattern registrano voci di timing usando il nome shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un’intera configurazione da uno shard filtrato. `check-additional` tiene insieme il lavoro di compile/canary del package-boundary e separa l’architettura della topologia runtime dalla copertura gateway watch; l’elenco delle guardie boundary è distribuito su quattro shard di matrice, ciascuno esegue guardie indipendenti selezionate in parallelo e stampa i timing per controllo. Il costoso controllo di drift dello snapshot prompt del percorso felice Codex viene eseguito come job aggiuntivo autonomo per la CI manuale e solo per modifiche che influiscono sui prompt, così le normali modifiche Node non correlate non restano in attesa dietro la generazione a freddo dello snapshot prompt e gli shard boundary restano bilanciati mentre il drift dei prompt è comunque attribuito alla PR che lo ha causato; lo stesso flag salta la generazione Vitest degli snapshot prompt dentro lo shard core support-boundary degli artefatti buildati. Gateway watch, test canale e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati buildati.

Android CI esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi builda l’APK Play debug. Il flavor third-party non ha un source set o un manifest separato; la sua lane di test unitari compila comunque il flavor con i flag SMS/call-log BuildConfig, evitando al tempo stesso un job duplicato di packaging dell’APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo dipendenze di produzione fissato alla versione Knip più recente, con l’età minima di rilascio di pnpm disabilitata per l’installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia unused-file fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al contempo le superfici intenzionali di Plugin dinamici, generate, di build, live-test e bridge package che Knip non può risolvere staticamente.

## Inoltro attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato target dall’attività del repository OpenClaw verso ClawSweeper. Non fa checkout né esegue codice non attendibile di pull request. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, poi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di review di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di review a livello commit sui push a `main`;
- `github_activity` per attività GitHub generale che l’agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo evento, azione, attore, repository, numero dell’elemento, URL, titolo, stato e brevi estratti per commenti o review quando presenti. Evita intenzionalmente di inoltrare l’intero corpo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che invia l’evento normalizzato all’hook OpenClaw Gateway per l’agente ClawSweeper.

L’attività generale è osservazione, non consegna predefinita. L’agente ClawSweeper riceve il target Discord nel proprio prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l’evento è sorprendente, azionabile, rischioso o utile operativamente. Aperture ordinarie, modifiche, churn dei bot, rumore da Webhook duplicati e normale traffico di review dovrebbero produrre `NO_REPLY`.

Tratta titoli, commenti, corpi, testo di review, nomi di branch e messaggi di commit di GitHub come dati non attendibili in tutto questo percorso. Sono input per riepilogo e triage, non istruzioni per il flusso di lavoro o il runtime dell'agente.

## Esecuzioni manuali

Le esecuzioni manuali della CI eseguono lo stesso grafo di job della CI normale, ma forzano l'attivazione di ogni lane con ambito non Android: shard Linux Node, shard dei Plugin inclusi, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli della documentazione, Skills Python, Windows, macOS e i18n della Control UI. Le esecuzioni CI manuali autonome eseguono solo Android con `include_android=true`; l'ombrello completo di release abilita Android passando `include_android=true`. I controlli statici prerelease dei Plugin, lo shard `agentic-plugins` solo per release, la scansione batch completa delle estensioni e le lane Docker prerelease dei Plugin sono esclusi dalla CI. La suite Docker prerelease viene eseguita solo quando `Full Release Validation` invia il workflow separato `Plugin Prerelease` con il gate di validazione della release abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa di release candidate non viene annullata da un'altra esecuzione push o PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, tag o SHA completo di commit, usando al tempo stesso il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza rapidi (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratti/inclusi, controlli shard dei contratti dei canali, shard di `check` tranne lint, aggregati `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche la preflight install-smoke usa Ubuntu ospitato da GitHub, così la matrice Blacksmith può mettersi in coda prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard delle estensioni a peso inferiore, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shard dei test Linux Node, shard dei test dei Plugin inclusi, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (abbastanza sensibile alla CPU da far costare 8 vCPU più di quanto abbiano risparmiato); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto risparmiasse)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

La CI del repository canonico mantiene Blacksmith come percorso runner predefinito. Durante `preflight`, `scripts/ci-runner-labels.mjs` controlla le esecuzioni Actions recenti in coda e in corso per individuare job Blacksmith in coda. Se una specifica etichetta Blacksmith ha già job in coda, i job a valle che userebbero quella stessa etichetta ripiegano sul runner ospitato da GitHub corrispondente (`ubuntu-24.04`, `windows-2025` o `macos-latest`) solo per quell'esecuzione. Le altre dimensioni Blacksmith nella stessa famiglia di OS restano sulle loro etichette primarie. Se la sonda API fallisce, non viene applicato alcun fallback.

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

Il dispatch manuale normalmente esegue il benchmark del ref del workflow. Imposta `target_ref` per eseguire il benchmark di un tag di release o di un altro branch con l'implementazione attuale del workflow. I percorsi dei report pubblicati e i puntatori più recenti sono indicizzati in base al ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref di Kova, profilo, modalità auth della lane, modello, conteggio di ripetizioni e filtri degli scenari.

Il workflow installa OCM da una release bloccata e Kova da `openclaw/Kova` all'input `kova_ref` bloccato, poi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova contro un runtime di build locale con auth falsa deterministica compatibile con OpenAI.
- `mock-deep-profile`: profiling CPU/heap/trace per hotspot di avvio, Gateway e turno agente.
- `live-gpt54`: un turno agente OpenAI reale `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche sonde di sorgente native OpenClaw dopo il passaggio Kova: tempi di avvio del Gateway e memoria nei casi di avvio predefinito, hook e con 50 Plugin; cicli hello ripetuti `channel-chat-baseline` con mock OpenAI; e comandi di avvio CLI contro il Gateway avviato. Il riepilogo Markdown della sonda sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artefatti GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow committa anche `report.json`, `report.md`, bundle, `index.md` e artefatti delle sonde sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione completa della release

`Full Release Validation` è il workflow ombrello manuale per "eseguire tutto prima della release". Accetta un branch, tag o SHA completo di commit, invia il workflow manuale `CI` con quel target, invia `Plugin Prerelease` per la prova di Plugin/pacchetti/statico/Docker solo per release, e invia `OpenClaw Release Checks` per install smoke, accettazione pacchetto, controlli pacchetto cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite mantengono la copertura live/E2E esaustiva e del percorso di release Docker dietro `run_release_soak=true`; `release_profile=full` forza l'attivazione di quella copertura soak, così la validazione ampia degli advisory resta ampia. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l'artefatto `release-package-under-test` dei controlli di release. Dopo la pubblicazione, passa `release_package_spec` per riutilizzare il pacchetto npm distribuito tra controlli di release, Package Acceptance, Docker, cross-OS e Telegram senza ricostruire. Usa `npm_telegram_package_spec` solo quando Telegram deve provare un pacchetto diverso.

Vedi [Validazione completa della release](/it/reference/full-release-validation) per la
matrice degli stage, i nomi esatti dei job del workflow, le differenze tra profili, gli artefatti e
gli handle di riesecuzione mirata.

`OpenClaw Release Publish` è il workflow manuale mutante per la release. Invialo
da `release/YYYY.M.D` o `main` dopo che il tag di release esiste e dopo che la
preflight npm di OpenClaw è riuscita. Verifica `pnpm plugins:sync:check`,
invia `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, invia
`Plugin ClawHub Release` per lo stesso SHA di release, e solo allora invia
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per la prova con commit fissato su un ramo in rapido movimento, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I riferimenti di dispatch dei workflow GitHub devono essere rami o tag, non SHA di commit grezzi. L'helper invia un ramo temporaneo `release-ci/<sha>-...` allo SHA di destinazione, esegue il dispatch di `Full Release Validation` da quel riferimento fissato, verifica che ogni workflow figlio abbia `headSha` corrispondente alla destinazione ed elimina il ramo temporaneo quando l'esecuzione termina. Anche il verificatore ombrello fallisce se un workflow figlio è stato eseguito a uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di rilascio. I workflow di rilascio manuali usano per impostazione predefinita `stable`; usa `full` solo quando vuoi intenzionalmente l'ampia matrice consultiva di provider/media. `run_release_soak` controlla se i controlli di rilascio stabili/predefiniti eseguono il soak esaustivo live/E2E e Docker del percorso di rilascio; `full` forza il soak.

- `minimum` mantiene le lane OpenAI/core più rapide e critiche per il rilascio.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva di provider/media.

L'ombrello registra gli ID delle esecuzioni figlie avviate e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ciascuna esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease del Plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene limitata la riesecuzione di un box di rilascio fallito dopo una correzione mirata. Per una singola lane cross-OS fallita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, per esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe Heartbeat e i riepiloghi packaged-upgrade includono tempi per fase. Le lane dei controlli di rilascio QA sono consultive, quindi i fallimenti solo QA avvisano ma non bloccano il verificatore dei controlli di rilascio.

`OpenClaw Release Checks` usa il riferimento del workflow attendibile per risolvere una sola volta il riferimento selezionato in un tarball `release-package-under-test`, quindi passa quell'artefatto ai controlli cross-OS e a Package Acceptance, oltre al workflow Docker live/E2E del percorso di rilascio quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra i box di rilascio ed evita di ricreare il pacchetto dello stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'ombrello più vecchio. Il monitor padre annulla qualsiasi workflow figlio
che ha già avviato quando il padre viene annullato, così la validazione più recente di main
non rimane in coda dietro una vecchia esecuzione dei controlli di rilascio di due ore. La validazione di rami/tag
di rilascio e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E di rilascio mantiene un'ampia copertura nativa `pnpm test:live`, ma la esegue come shard denominati tramite `scripts/test-live-shard.mjs` invece che come un singolo job seriale:

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
- shard media audio/video separati e shard musica filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più semplice rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` rimangono validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container non sono il posto giusto per avviare test Docker annidati.

Gli shard live modello/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow di rilascio live crea e invia quell'immagine una sola volta, poi gli shard modello live Docker, Gateway filtrati per provider, backend CLI, bind ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker Gateway hanno limiti `timeout` espliciti a livello di script inferiori al timeout del job del workflow, così un container bloccato o un percorso di pulizia fallisce rapidamente invece di consumare l'intero budget dei controlli di rilascio. Se quegli shard ricreano indipendentemente il target Docker completo dal sorgente, l'esecuzione di rilascio è configurata male e sprecherà tempo su build di immagini duplicate.

## Package Acceptance

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale valida l'albero sorgente, mentre Package Acceptance valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa origine, riferimento del workflow, riferimento del pacchetto, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara immagini Docker package-digest quando necessario ed esegue le lane Docker selezionate su quel pacchetto invece di pacchettizzare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, poi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; il dispatch Telegram autonomo può comunque installare una spec npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram facoltativa sono fallite.

### Origini dei candidati

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione di prerelease/stable pubblicati.
- `source=ref` pacchettizza un ramo, tag o SHA di commit completo `package_ref` attendibile. Il resolver recupera rami/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei rami del repository o da un tag di rilascio, installa le dipendenze in un worktree detached e lo pacchettizza con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è richiesto.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice workflow/harness attendibile che esegue il test. `package_ref` è il commit sorgente che viene pacchettizzato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire la vecchia logica del workflow.

### Profili suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk completi Docker del percorso di rilascio con OpenWebUI
- `custom` — `docker_lanes` esatte; richiesto quando `suite_profile=custom`

Il profilo `package` usa copertura Plugin offline, così la validazione del pacchetto pubblicato non dipende dalla disponibilità live di ClawHub. La lane Telegram facoltativa riutilizza l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, con il percorso della spec npm pubblicata mantenuto per i dispatch autonomi.

Per la policy dedicata di aggiornamento e test dei Plugin, inclusi comandi locali,
lane Docker, input di Package Acceptance, impostazioni predefinite di rilascio e triage dei fallimenti,
vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

I controlli di release chiamano Accettazione del pacchetto con `source=artifact`, l’artefatto del pacchetto di release preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene la migrazione del pacchetto, l’aggiornamento, l’installazione live delle skill di ClawHub, la pulizia delle dipendenze di Plugin obsolete, la riparazione dell’installazione del Plugin configurato, il Plugin offline, l’aggiornamento del Plugin e la prova di Telegram sullo stesso tarball di pacchetto risolto. Imposta `release_package_spec` su Validazione completa della release o Controlli di release OpenClaw dopo aver pubblicato una beta per eseguire la stessa matrice sul pacchetto npm distribuito senza ricostruire; imposta `package_acceptance_package_spec` solo quando Accettazione del pacchetto richiede un pacchetto diverso dal resto della validazione della release. I controlli di release cross-OS coprono ancora onboarding, installer e comportamento di piattaforma specifici per sistema operativo; la validazione di prodotto per pacchetto/aggiornamento dovrebbe iniziare da Accettazione del pacchetto. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione nel percorso di release bloccante. In Accettazione del pacchetto, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con valore predefinito `openclaw@latest`; i comandi di riesecuzione delle lane non riuscite preservano quella baseline. La Validazione completa della release con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` per espandere la copertura alle quattro ultime release npm stabili più le release limite fissate per la compatibilità dei Plugin e fixture modellate sugli issue per la configurazione Feishu, i file di bootstrap/persona preservati, le installazioni configurate di Plugin OpenClaw, i percorsi di log con tilde e le root obsolete delle dipendenze di Plugin legacy. Le selezioni survivor published-upgrade multi-baseline sono suddivise per baseline in job runner Docker mirati separati. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda una pulizia esaustiva degli aggiornamenti pubblicati, non l’ampiezza normale della CI di Validazione completa della release. Le esecuzioni aggregate locali possono passare specifiche di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15` oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice degli scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e sonda `/healthz`, `/readyz`, oltre allo stato RPC dopo l’avvio del Gateway. Le lane fresh del pacchetto Windows e dell’installer verificano anche che un pacchetto installato possa importare un override di controllo del browser da un percorso Windows assoluto raw. Lo smoke agent-turn cross-OS OpenAI usa come predefinito `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, così la prova di installazione e Gateway rimane su un modello di test GPT-5 evitando i default GPT-4.x.

### Finestre di compatibilità legacy

Accettazione del pacchetto ha finestre di compatibilità legacy limitate per i pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- le voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può rimuovere `patchedDependencies` pnpm mancanti dalla fixture git fittizia derivata dal tarball e può registrare `update.channel` persistito mancante;
- gli smoke dei Plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur richiedendo che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` può anche avvisare per file di timbro dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare avvisi o essere saltate.

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

Quando esegui il debug di un’esecuzione di accettazione del pacchetto non riuscita, inizia dal riepilogo `resolve_package` per confermare origine, versione e SHA-256 del pacchetto. Poi ispeziona l’esecuzione figlia `docker_acceptance` e i suoi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo del pacchetto non riuscito o le lane Docker esatte invece di rieseguire l’intera validazione della release.

## Smoke test di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche a pacchetto/manifest di Plugin in bundle o superfici core Plugin/canale/Gateway/Plugin SDK esercitate dai job smoke Docker. Modifiche solo al codice sorgente di Plugin in bundle, modifiche solo ai test e modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido costruisce una volta l’immagine del Dockerfile root, controlla la CLI, esegue lo smoke CLI degli agenti che eliminano lo spazio di lavoro condiviso, esegue l’e2e gateway-network del container, verifica un argomento di build per estensione in bundle ed esegue il profilo Docker limitato dei Plugin in bundle entro un timeout aggregato di comando di 240 secondi (ogni esecuzione Docker di scenario è limitata separatamente).
- **Percorso completo** mantiene la copertura di installazione pacchetto QR e Docker/aggiornamento dell’installer per esecuzioni pianificate notturne, dispatch manuali, controlli di release workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riusa un’immagine smoke GHCR del Dockerfile root con SHA target, quindi esegue installazione pacchetto QR, smoke del Dockerfile root/Gateway, smoke di installer/aggiornamento e l’E2E Docker rapido dei Plugin in bundle come job separati, così il lavoro dell’installer non attende dietro gli smoke dell’immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica dello scope modificato richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke completo di installazione alla validazione notturna o di release.

Lo smoke lento dell’installazione globale Bun per image-provider è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull’installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila una singola immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e costruisce due immagini condivise `scripts/e2e/Dockerfile`:

- un runner Node/Git minimale per lane di installer/aggiornamento/dipendenze Plugin;
- un’immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner in `scripts/lib/docker-e2e-plan.mjs`, e il runner esegue solo il piano selezionato. Lo scheduler seleziona l’immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Default | Scopo                                                                                         |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Numero di slot del pool di coda sensibile ai provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite di lane live concorrenti affinché i provider non applichino throttling.                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limite di lane di installazione npm concorrenti.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite di lane multi-servizio concorrenti.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervallo tra gli avvii delle lane per evitare tempeste di creazione del demone Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout di fallback per lane (120 minuti); lane live/coda selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` stampa il piano dello scheduler senza eseguire le lane.                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Elenco esatto di lane separate da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. L’aggregato locale esegue i preflight di Docker, rimuove i container E2E OpenClaw obsoleti, emette lo stato delle lane attive, persiste i tempi delle lane per l’ordinamento longest-first e interrompe per impostazione predefinita la schedulazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riusabile

Il workflow live/E2E riusabile chiede a `scripts/test-docker-all.mjs --plan-json` quale copertura di pacchetto, tipo di immagine, immagine live, lane e credenziali è richiesta. `scripts/docker-e2e.mjs` converte quindi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto di pacchetto dell’esecuzione corrente oppure scarica un artefatto di pacchetto da `package_artifact_run_id`; valida l’inventario del tarball; costruisce e pubblica immagini Docker E2E GHCR bare/funzionali taggate con il digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti con digest del pacchetto invece di ricostruire. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato ritenta rapidamente invece di consumare la maggior parte del percorso critico della CI.

### Chunk del percorso di release

La copertura Docker di release esegue job più piccoli a chunk con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler pesato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

I chunk Docker della release corrente sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati di Plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di rilancio manuale per entrambe le lane degli installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa del percorso di release lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch esclusivi di OpenWebUI. Le lane di aggiornamento dei canali inclusi riprovano una volta in caso di errori di rete npm temporanei.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di rilancio per lane. L'input `docker_lanes` del workflow esegue le lane selezionate sulle immagini preparate invece dei job dei chunk, mantenendo il debug delle lane fallite limitato a un solo job Docker mirato e preparando, scaricando o riutilizzando l'artefatto del pacchetto per quella esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine dei test live per quel rilancio. I comandi GitHub di rilancio generati per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando quei valori esistono, così una lane fallita può riutilizzare il pacchetto e le immagini esatti dell'esecuzione fallita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue ogni giorno la suite Docker completa del percorso di release.

## Prerelease dei Plugin

`Plugin Prerelease` è una copertura di prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch CI manuali autonomi mantengono quella suite disattivata. Bilancia i test dei Plugin inclusi su otto worker di estensione; quei job di shard di estensione eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di Plugin pesanti in import non creano job CI aggiuntivi. Il percorso di prerelease Docker riservato alla release raggruppa le lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno-tre minuti. Il workflow carica anche un artefatto informativo `plugin-inspector-advisory` da `@openclaw/plugin-inspector`; i risultati dell'inspector sono input di triage e non modificano il gate bloccante di Plugin Prerelease.

## QA Lab

QA Lab ha lane CI dedicate fuori dal principale workflow con ambito intelligente. La parità agentica è annidata negli harness QA e release ampi, non in un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve accompagnare una run di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce la lane di parità mock, la lane Matrix live e le lane Telegram e Discord live come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati per mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza del modello live e dal normale avvio del Plugin provider. Il Gateway di trasporto live disabilita la ricerca nella memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività del provider è coperta dalle suite separate di modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` divide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pacchetti candidato e baseline come job di lane paralleli, poi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale di parità.

Per le PR normali, segui le evidenze di CI/controlli con ambito invece di trattare la parità come uno stato obbligatorio.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non una scansione completa del repository. Le run giornaliere, manuali e di guardia per pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta affidabilità filtrate su `security-severity` alta/critica.

La guardia delle pull request resta leggera: si avvia solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta affidabilità del workflow pianificato. Android e macOS CodeQL restano fuori dai valori predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Baseline di auth, segreti, sandbox, cron e Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime del Plugin di canale, Gateway, Plugin SDK, segreti, punti di audit         |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici SSRF core, parsing IP, guardia di rete, web-fetch e policy SSRF del Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione processi, consegna in uscita e gate di esecuzione strumenti degli agenti                           |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di attendibilità di installazione Plugin, loader, manifest, registry, installazione package-manager, caricamento sorgenti e contratto pacchetto del Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla sanity del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai valori predefiniti giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie di Qualità Critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severità errore su superfici ristrette ad alto valore sul runner Blacksmith Linux più piccolo. La sua guardia delle pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche a codice di esecuzione comandi/modelli/strumenti degli agenti e dispatch delle risposte, schema/migrazione/IO della config, codice auth/segreti/sandbox/sicurezza, runtime dei canali core e dei Plugin di canale inclusi, protocollo Gateway/metodi server, runtime memoria/collante SDK, MCP/processi/consegna in uscita, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader Plugin, Plugin SDK/contratto pacchetto o runtime risposte del Plugin SDK. Le modifiche alla config CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                                | Superficie                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, segreti, sandbox, Cron e codice del confine di sicurezza del Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schema di configurazione, migrazione, normalizzazione e contratti di IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Canale core e contratti di implementazione dei Plugin di canale inclusi                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione dei comandi, dispatch di modello/provider, dispatch e code di risposta automatica, e contratti runtime del piano di controllo ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK dell'host di memoria, facade runtime della memoria, alias dell'SDK Plugin per la memoria, collante di attivazione del runtime di memoria e comandi doctor della memoria                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda di risposta, code di consegna delle sessioni, helper di binding/consegna delle sessioni in uscita, superfici di eventi diagnostici/bundle di log e contratti CLI del doctor di sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso dell'SDK Plugin, helper di payload/chunking/runtime delle risposte, opzioni di risposta del canale, code di consegna e helper di binding sessione/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione del catalogo dei modelli, auth e discovery dei provider, registrazione runtime dei provider, default/cataloghi dei provider e registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap dell'interfaccia di controllo, persistenza locale, flussi di controllo del Gateway e contratti runtime del piano di controllo dei task                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web core, IO media, comprensione dei media, generazione di immagini e contratti runtime di generazione dei media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, superficie pubblica e contratti degli entrypoint dell'SDK Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente pubblicata dell'SDK Plugin lato package e helper dei contratti dei package Plugin                                                                                      |

La qualità resta separata dalla sicurezza, così i finding di qualità possono essere pianificati, misurati, disabilitati o ampliati senza offuscare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere reinserita come lavoro successivo con ambito definito o suddiviso in shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Flussi di lavoro di manutenzione

### Docs Agent

Il flusso di lavoro `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche approdate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non-bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato o quando un'altra esecuzione non saltata di Docs Agent è stata creata nell'ultima ora. Quando viene eseguito, rivede l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino all'attuale `main`, così un'esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sulla documentazione.

### Test Performance Agent

Il flusso di lavoro `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non-bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel gate di attività giornaliero. La lane genera un report delle prestazioni Vitest raggruppato sull'intera suite, consente a Codex di apportare solo piccole correzioni prestazionali ai test che preservano la copertura invece di refactor ampi, quindi riesegue il report sull'intera suite e rifiuta le modifiche che riducono il numero baseline di test passanti. Se la baseline ha test falliti, Codex può correggere solo fallimenti ovvi e il report post-agent sull'intera suite deve passare prima che qualcosa venga committato. Quando `main` avanza prima che il push del bot approdi, la lane esegue rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub, così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

### PR duplicate dopo il merge

Il flusso di lavoro `Duplicate PRs After Merge` è un flusso manuale per maintainer destinato alla pulizia delle duplicate dopo il land. Per default è in dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di mutare GitHub, verifica che la PR approdata sia stata unita e che ogni duplicata abbia o una issue referenziata in comune o hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle changed-lane vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più severo sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche di produzione core eseguono typecheck prod core e test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck test core più lint core;
- le modifiche di produzione delle estensioni eseguono typecheck prod estensioni e test estensioni più lint estensioni;
- le modifiche solo ai test delle estensioni eseguono typecheck test estensioni più lint estensioni;
- le modifiche all'SDK Plugin pubblico o ai contratti dei Plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti core (gli sweep Vitest delle estensioni restano lavoro di test esplicito);
- i bump di versione solo metadata di release eseguono controlli mirati su versione/config/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro su tutte le lane di controllo.

Il routing locale dei changed-test vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono i test stessi, le modifiche al sorgente preferiscono mapping espliciti, poi test sibling e dipendenti nell'import graph. La configurazione condivisa della consegna group-room è uno dei mapping espliciti: le modifiche alla config delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test core delle risposte più le regressioni di consegna Discord e Slack, così una modifica di default condivisa fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sul harness che il set mappato economico non è un proxy affidabile.

## Validazione Testbox

Crabbox è il wrapper di remote-box di proprietà del repo per le prove Linux dei maintainer. Usalo
dalla root del repo quando un controllo è troppo ampio per un loop di modifica locale, quando la parità
con CI conta o quando la prova richiede segreti, Docker, lane di package,
box riutilizzabili o log remoti. Il backend OpenClaw normale è
`blacksmith-testbox`; la capacità AWS/Hetzner di proprietà è un fallback per outage di Blacksmith,
problemi di quota o test espliciti su capacità di proprietà.

Le esecuzioni Blacksmith supportate da Crabbox riscaldano, acquisiscono, sincronizzano, eseguono, riportano e puliscono
Testbox one-shot. Il sanity check di sincronizzazione integrato fallisce rapidamente quando file root
richiesti come `pnpm-lock.yaml` scompaiono o quando `git status --short`
mostra almeno 200 eliminazioni tracciate. Per PR con grandi eliminazioni intenzionali, imposta
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per il comando remoto.

Crabbox termina anche un'invocazione locale della CLI Blacksmith che resta nella
fase di sync per più di cinque minuti senza output post-sync. Imposta
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` per disabilitare quel guard, oppure usa un valore
in millisecondi più grande per diff locali insolitamente ampi.

Prima di una prima esecuzione, controlla il wrapper dalla root del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox stale che non pubblicizza `blacksmith-testbox`. Passa il provider esplicitamente anche se `.crabbox.yaml` ha default owned-cloud.

Gate delle modifiche:

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

Riesecuzione di test focalizzata:

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

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Le esecuzioni Crabbox one-shot supportate da Blacksmith dovrebbero fermare automaticamente il Testbox; se un'esecuzione viene interrotta o la pulizia non è chiara, ispeziona le box live e ferma solo quelle che hai creato:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa il riuso solo quando hai intenzionalmente bisogno di più comandi sulla stessa box idratata:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se Crabbox è lo strato rotto ma Blacksmith stesso funziona, usa Blacksmith diretto
solo per diagnostica come `list`, `status` e cleanup. Correggi il percorso
Crabbox prima di trattare un'esecuzione diretta Blacksmith come prova da maintainer.

Se `blacksmith testbox list --all` e `blacksmith testbox status` funzionano ma nuovi
warmup restano `queued` senza IP o URL dell'esecuzione Actions dopo un paio di minuti,
trattalo come pressione su provider Blacksmith, coda, billing o limiti dell'organizzazione. Ferma gli
ID in coda che hai creato, evita di avviare altri Testbox e sposta la prova sul
percorso di capacità Crabbox di proprietà sotto mentre qualcuno controlla la dashboard Blacksmith,
billing e limiti dell'organizzazione.

Escala alla capacità Crabbox di proprietà solo quando Blacksmith è inattivo, limitato dalla quota, non ha l'ambiente necessario o la capacità di proprietà è esplicitamente l'obiettivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

In condizioni di pressione su AWS, evita `class=beast` a meno che l'attività non abbia davvero bisogno di CPU di classe 48xlarge. Una richiesta `beast` parte da 192 vCPU ed è il modo più semplice per raggiungere la quota regionale EC2 Spot o On-Demand Standard. Il file `.crabbox.yaml` di proprietà del repository usa come valori predefiniti `standard`, più regioni di capacità e `capacity.hints: true`, così i lease AWS mediati stampano regione/mercato selezionati, pressione sulle quote, fallback Spot e avvisi sulle classi ad alta pressione. Usa `fast` per controlli ampi più pesanti, `large` solo dopo che standard/fast non sono sufficienti e `beast` solo per percorsi eccezionali vincolati dalla CPU, come matrici Docker full-suite o all-plugin, validazione esplicita di release/bloccanti o profiling delle prestazioni ad alto numero di core. Non usare `beast` per `pnpm check:changed`, test mirati, lavoro solo sulla documentazione, lint/typecheck ordinari, piccole riproduzioni E2E o triage di interruzioni Blacksmith. Usa `--market on-demand` per la diagnosi della capacità, così la variabilità del mercato Spot non viene mescolata nel segnale.

`.crabbox.yaml` gestisce i valori predefiniti di provider, sincronizzazione e hydration di GitHub Actions per i percorsi cloud proprietari. Esclude `.git` locale, così il checkout Actions idratato mantiene i propri metadati Git remoti invece di sincronizzare remoti e object store locali del maintainer, ed esclude gli artefatti locali di runtime/build che non devono mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` gestisce checkout, configurazione di Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto per i comandi cloud proprietari `crabbox run --id <cbx_id>`.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
