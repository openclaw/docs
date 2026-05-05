---
read_when:
    - È necessario capire perché un processo di CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo di GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
    - Stai modificando l'invio di ClawSweeper o l'inoltro dell'attività di GitHub
summary: Grafo dei processi CI, gate di ambito, ombrelli di release ed equivalenti dei comandi locali
title: Flusso di integrazione continua
x-i18n:
    generated_at: "2026-05-05T06:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e per ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` bypassano intenzionalmente lo scoping intelligente ed espandono l'intero grafo per release candidate e validazioni ampie. Le lane Android restano opt-in tramite `include_android`. La copertura dei Plugin solo per release vive nel workflow separato [`Plugin Prerelease`](#plugin-prerelease) e viene eseguita solo da [`Full Release Validation`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                             | Quando viene eseguito                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, ambiti modificati, estensioni modificate e crea il manifest CI         | Sempre su push e PR non draft         |
| `security-scm-fast`              | Rilevamento di chiavi private e audit del workflow tramite `zizmor`                                               | Sempre su push e PR non draft         |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze contro gli advisory npm                                         | Sempre su push e PR non draft         |
| `security-fast`                  | Aggregato obbligatorio per i job di sicurezza rapidi                                                              | Sempre su push e PR non draft         |
| `check-dependencies`             | Passaggio Knip solo dipendenze di produzione più guard della allowlist dei file inutilizzati                       | Modifiche rilevanti per Node          |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli degli artefatti compilati e artefatti downstream riutilizzabili            | Modifiche rilevanti per Node          |
| `checks-fast-core`               | Lane rapide di correttezza Linux come controlli bundled/contratto-Plugin/protocollo                               | Modifiche rilevanti per Node          |
| `checks-fast-contracts-channels` | Controlli sharded dei contratti dei canali con un risultato di controllo aggregato stabile                        | Modifiche rilevanti per Node          |
| `checks-node-core-test`          | Shard dei test core Node, escluse le lane di canali, bundled, contratti ed estensioni                             | Modifiche rilevanti per Node          |
| `check`                          | Equivalente sharded del gate locale principale: tipi prod, lint, guard, tipi test e smoke rigoroso                | Modifiche rilevanti per Node          |
| `check-additional`               | Architettura, drift sharded di boundary/prompt, guard estensioni, boundary pacchetti e gateway watch              | Modifiche rilevanti per Node          |
| `build-smoke`                    | Test smoke della CLI compilata e smoke della memoria di avvio                                                     | Modifiche rilevanti per Node          |
| `checks`                         | Verificatore per i test dei canali sugli artefatti compilati                                                      | Modifiche rilevanti per Node          |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                                   | Dispatch CI manuale per release       |
| `check-docs`                     | Formattazione documentazione, lint e controlli dei link interrotti                                                | Documentazione modificata             |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                                         | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Test specifici Windows per processi/percorsi più regressioni condivise sugli specificatori di import runtime      | Modifiche rilevanti per Windows       |
| `macos-node`                     | Lane di test TypeScript macOS usando gli artefatti compilati condivisi                                            | Modifiche rilevanti per macOS         |
| `macos-swift`                    | Swift lint, build e test per l'app macOS                                                                          | Modifiche rilevanti per macOS         |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                                | Modifiche rilevanti per Android       |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                         | Successo CI main o dispatch manuale   |
| `openclaw-performance`           | Report prestazionali giornalieri/on-demand del runtime Kova con lane mock-provider, deep-profile e GPT 5.4 live  | Dispatch pianificato e manuale        |

## Ordine fail-fast

1. `preflight` decide quali lane esistono effettivamente. Le logiche `docs-scope` e `changed-scope` sono step dentro questo job, non job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artefatti e matrice piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer downstream possono partire appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforme e runtime si espandono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può marcare i job superati come `cancelled` quando un push più recente arriva sulla stessa PR o ref `main`. Trattalo come rumore CI, a meno che anche l'esecuzione più recente per la stessa ref stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()` così segnalano comunque i normali fallimenti degli shard, ma non vengono messi in coda dopo che l'intero workflow è già stato superato. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`), quindi uno zombie lato GitHub in un vecchio gruppo di code non può bloccare indefinitamente le esecuzioni main più recenti. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Ambito e instradamento

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifest preflight come se ogni area con ambito fosse cambiata.

- **Le modifiche al workflow CI** validano il grafo CI Node più il linting del workflow, ma non forzano da sole le build native Windows, Android o macOS; queste lane di piattaforma restano limitate alle modifiche del sorgente di piattaforma.
- **Le modifiche solo di instradamento CI, le modifiche selezionate a fixture economiche dei test core e le modifiche ristrette a helper/test-routing del contratto Plugin** usano un percorso manifest rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard Plugin bundled e matrici di guard aggiuntive quando la modifica è limitata alle superfici di instradamento o helper esercitate direttamente dal task rapido.
- **I controlli Node Windows** sono limitati a wrapper specifici Windows per processi/percorsi, helper runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, Plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti dei canali girano come tre shard pesati, le lane core unit fast/support girano separatamente, l'infrastruttura runtime core è divisa tra shard state e process/config, auto-reply gira come worker bilanciati (con il subtree reply diviso in shard agent-runner, dispatch e commands/state-routing), e le configurazioni agentiche Gateway/server sono divise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti compilati. I test ampi browser, QA, media e Plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard include-pattern registrano voci di timing usando il nome shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro compile/canary package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; l'elenco dei boundary guard è distribuito su quattro shard di matrice, ognuno esegue guard indipendenti selezionati in parallelo e stampa i timing per controllo, incluso `pnpm prompt:snapshots:check`, così il drift dei prompt del happy path del runtime Codex viene fissato alla PR che lo ha causato. Gateway watch, test dei canali e lo shard core support-boundary girano in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

Android CI esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor third-party non ha source set o manifest separati; la sua lane di test unitari compila comunque il flavor con i flag SMS/call-log BuildConfig, evitando al tempo stesso un job duplicato di packaging APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo dipendenze di produzione fissato all'ultima versione Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. Il guard dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al contempo superfici intenzionali di Plugin dinamici, generate, di build, live-test e bridge di pacchetti che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato target dall'attività del repository OpenClaw verso ClawSweeper. Non esegue checkout né codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, quindi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di revisione issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o revisioni quando presenti. Evita intenzionalmente di inoltrare l'intero corpo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato nell'hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o utile operativamente. Aperture di routine, modifiche, churn di bot, rumore da webhook duplicati e normale traffico di revisione dovrebbero produrre `NO_REPLY`.

Tratta titoli, commenti, corpi, testo di revisione, nomi di branch e messaggi di commit GitHub come dati non attendibili lungo tutto questo percorso. Sono input per riepilogo e triage, non istruzioni per il workflow o il runtime agente.

## Dispatch manuali

I dispatch CI manuali eseguono lo stesso grafo di job della CI normale, ma forzano l’attivazione di ogni lane con ambito non Android: shard Node Linux, shard dei plugin integrati, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke test della build, controlli della documentazione, Skills Python, Windows, macOS e i18n della Control UI. I dispatch CI manuali autonomi eseguono solo Android con `include_android=true`; l’ombrello di release completo abilita Android passando `include_android=true`. I controlli statici di prerelease dei Plugin, lo shard solo release `agentic-plugins`, lo sweep completo in batch delle estensioni e le lane Docker di prerelease dei Plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` avvia il workflow separato `Plugin Prerelease` con il gate di validazione della release abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa per release candidate non viene annullata da un’altra esecuzione push o PR sullo stesso ref. L’input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo rispetto a un branch, tag o SHA di commit completo usando al contempo il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza rapidi e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratto/integrati, controlli shardati dei contratti dei canali, shard `check` tranne lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub, così la matrice Blacksmith può essere messa in coda prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard di estensioni a peso inferiore, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Node Linux, shard dei test dei plugin integrati, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU che 8 vCPU costavano più di quanto facessero risparmiare); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ricadono su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ricadono su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` è il workflow di prestazioni di prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere avviato manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Il dispatch manuale normalmente misura il ref del workflow. Imposta `target_ref` per misurare un tag di release o un altro branch con l’implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori più recenti sono indicizzati in base al ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref Kova, profilo, modalità di autenticazione della lane, modello, conteggio ripetizioni e filtri degli scenari.

Il workflow installa OCM da una release fissata e Kova da `openclaw/Kova` all’input `kova_ref` fissato, quindi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova rispetto a un runtime di build locale con autenticazione fittizia deterministica compatibile con OpenAI.
- `mock-deep-profile`: profilazione CPU/heap/trace per punti caldi di avvio, Gateway e turni dell’agente.
- `live-gpt54`: un vero turno agente OpenAI `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche probe sorgente nativi OpenClaw dopo il passaggio Kova: timing di avvio Gateway e memoria nei casi di avvio predefinito, con hook e con 50 plugin; loop hello ripetuti mock-OpenAI `channel-chat-baseline`; e comandi di avvio CLI contro il Gateway avviato. Il riepilogo Markdown dei probe sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artifact GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow effettua anche il commit di `report.json`, `report.md`, bundle, `index.md` e artifact dei probe sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione completa della release

`Full Release Validation` è il workflow ombrello manuale per “eseguire tutto prima della release”. Accetta un branch, tag o SHA di commit completo, avvia il workflow manuale `CI` con quel target, avvia `Plugin Prerelease` per prove solo release di plugin/pacchetti/statiche/Docker e avvia `OpenClaw Release Checks` per smoke test di installazione, package acceptance, controlli pacchetto cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite mantengono la copertura live/E2E esaustiva e del percorso di release Docker dietro `run_release_soak=true`; `release_profile=full` forza l’attivazione di quella copertura soak, così la validazione consultiva ampia resta ampia. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l’artifact `release-package-under-test` dei controlli di release. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa lane del pacchetto Telegram contro il pacchetto npm pubblicato.

Consulta [validazione completa della release](/it/reference/full-release-validation) per la
matrice delle fasi, i nomi esatti dei job workflow, le differenze tra profili, gli artifact e
gli handle per riesecuzioni mirate.

`OpenClaw Release Publish` è il workflow di release manuale che modifica lo stato. Avvialo
da `release/YYYY.M.D` o `main` dopo che il tag di release esiste e dopo che il
preflight npm OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
avvia `Plugin NPM Release` per tutti i pacchetti plugin pubblicabili, avvia
`Plugin ClawHub Release` per lo stesso SHA di release e solo dopo avvia
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per una prova su commit fissato in un branch che si muove rapidamente, usa l’helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L’helper
invia un branch temporaneo `release-ci/<sha>-...` allo SHA target,
avvia `Full Release Validation` da quel ref fissato, verifica che ogni `headSha` dei workflow
figli corrisponda al target ed elimina il branch temporaneo quando
l’esecuzione viene completata. Il verificatore ombrello fallisce anche se un workflow figlio è stato eseguito a uno
SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di release. I
workflow di release manuali usano per impostazione predefinita `stable`; usa `full` solo quando
vuoi intenzionalmente l'ampia matrice consultiva di provider/media. `run_release_soak`
controlla se i controlli di release stable/predefiniti eseguono il soak esaustivo live/E2E e
del percorso di release Docker; `full` forza l'attivazione del soak.

- `minimum` mantiene le lane OpenAI/core critiche per la release più veloci.
- `stable` aggiunge l'insieme stable di provider/backend.
- `full` esegue l'ampia matrice consultiva di provider/media.

L'umbrella registra gli id delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato umbrella e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di release, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease dei Plugin, `release-checks` per ogni figlio di release, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'umbrella. Questo mantiene delimitata la riesecuzione di un box di release non riuscito dopo una correzione mirata. Per una sola lane cross-OS non riuscita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, per esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe di heartbeat e i riepiloghi packaged-upgrade includono tempi per fase. Le lane QA dei controlli di release sono consultive, quindi gli errori solo QA generano avvisi ma non bloccano il verificatore dei controlli di release.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere una volta il ref selezionato in un tarball `release-package-under-test`, poi passa quell'artefatto ai controlli cross-OS e all'Accettazione del pacchetto, più al workflow Docker live/E2E del percorso di release quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra i box di release ed evita di ricreare lo stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'umbrella precedente. Il monitor padre annulla qualsiasi workflow figlio che
ha già avviato quando il padre viene annullato, così la validazione più recente di main
non resta dietro a un'esecuzione obsoleta di due ore dei controlli di release. La validazione di branch/tag di release
e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E di release mantiene un'ampia copertura nativa `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece che come un job seriale:

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
- shard media audio/video separati e shard musicali filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più semplice rieseguire e diagnosticare i lenti errori dei provider live. I nomi shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali singole.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container non sono il posto giusto per avviare test Docker annidati.

Gli shard live model/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit selezionato. Il workflow di release live crea e pubblica quell'immagine una volta, poi gli shard Docker live model, Gateway partizionati per provider, backend CLI, bind ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Gateway Docker hanno limiti `timeout` espliciti a livello di script sotto il timeout del job del workflow, così un container bloccato o un percorso di pulizia fallisce rapidamente invece di consumare tutto il budget dei controlli di release. Se questi shard ricostruiscono indipendentemente l'intero target Docker sorgente, l'esecuzione di release è configurata male e sprecherà tempo reale in build immagine duplicate.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale valida l'albero sorgente, mentre l'accettazione del pacchetto valida un singolo tarball attraverso lo stesso harness Docker E2E che gli utenti esercitano dopo installazione o aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa origine, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara immagini Docker con digest del pacchetto quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di creare il pacchetto dal checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara una volta il pacchetto e le immagini condivise, poi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando l'Accettazione del pacchetto ne ha risolto uno; il dispatch Telegram autonomo può ancora installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram facoltativa non sono riuscite.

### Origini dei candidati

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione esatta di release OpenClaw come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione prerelease/stable pubblicata.
- `source=ref` crea il pacchetto da un branch, tag o SHA commit completo `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di release, installa le dipendenze in un worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile di workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire la logica di workflow vecchia.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocchi completi del percorso di release Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura Plugin offline così la validazione del pacchetto pubblicato non dipende dalla disponibilità live di ClawHub. La lane Telegram facoltativa riutilizza l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per i dispatch autonomi.

Per la policy dedicata di aggiornamento e test dei Plugin, inclusi comandi locali,
lane Docker, input di Accettazione del pacchetto, impostazioni predefinite di release e triage degli errori,
vedi [Testare aggiornamenti e Plugin](/it/help/testing-updates-plugins).

I controlli di release chiamano l'Accettazione del pacchetto con `source=artifact`, l'artefatto del pacchetto di release preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene le prove di migrazione del pacchetto, aggiornamento, pulizia di dipendenze stale dei Plugin, riparazione dell'installazione di Plugin configurati, Plugin offline, aggiornamento dei Plugin e Telegram sullo stesso tarball di pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire la stessa matrice contro un pacchetto npm distribuito invece dell'artefatto costruito da SHA. I controlli di release cross-OS coprono ancora onboarding, installer e comportamento di piattaforma specifici per OS; la validazione product di pacchetto/aggiornamento dovrebbe iniziare dall'Accettazione del pacchetto. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione nel percorso di release bloccante. Nell'Accettazione del pacchetto, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con valore predefinito `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Full Release Validation con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` per espandere sulle quattro release npm stable più recenti più release limite fissate per compatibilità Plugin e fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di Plugin OpenClaw configurate, percorsi di log con tilde e radici di dipendenze Plugin legacy stale. Le selezioni multi-baseline published-upgrade survivor vengono partizionate per baseline in job Docker runner mirati separati. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda una pulizia esaustiva degli aggiornamenti pubblicati, non l'ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare specifiche esatte dei pacchetti con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una sola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e sonda `/healthz`, `/readyz`, più lo stato RPC dopo l'avvio del Gateway. Le lane Windows packaged e installer fresh verificano anche che un pacchetto installato possa importare un override di browser-control da un percorso Windows assoluto raw. Lo smoke del turno agente cross-OS OpenAI usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando impostazioni predefinite GPT-4.x.

### Finestre di compatibilità legacy

L'Accettazione del pacchetto ha finestre limitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- le voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e può registrare `update.channel` persistito mancante;
- gli smoke dei Plugin possono leggere posizioni legacy dei record di installazione o accettare persistenza mancante dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur richiedendo ancora che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` potrebbe anche mostrare avvisi per file stamp di metadati di build locali che erano gia stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare un avviso o essere ignorate.

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

Quando esegui il debug di un'esecuzione di accettazione pacchetto non riuscita, parti dal riepilogo `resolve_package` per confermare origine, versione e SHA-256 del pacchetto. Poi ispeziona l'esecuzione figlia `docker_acceptance` e i suoi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo pacchetto non riuscito o le lane Docker esatte invece di rieseguire la validazione completa della release.

## Smoke installazione

Il workflow separato `Install Smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- Il **percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche a pacchetto/manifest di Plugin in bundle, oppure superfici core Plugin/channel/gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche solo al sorgente dei Plugin in bundle, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido crea una volta l'immagine Dockerfile root, controlla la CLI, esegue lo smoke CLI di eliminazione agenti con workspace condiviso, esegue l'e2e container gateway-network, verifica un argomento di build di un'estensione in bundle ed esegue il profilo Docker limitato dei Plugin in bundle con un timeout aggregato dei comandi di 240 secondi (ogni esecuzione Docker dello scenario e limitata separatamente).
- Il **percorso completo** mantiene l'installazione pacchetto QR e la copertura Docker/update dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di release workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalita completa, install-smoke prepara o riusa una immagine smoke GHCR root Dockerfile per lo SHA target, poi esegue installazione pacchetto QR, smoke root Dockerfile/gateway, smoke installer/update e l'E2E Docker rapido dei Plugin in bundle come job separati, cosi il lavoro installer non attende dietro agli smoke dell'immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica di ambito modifiche richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di release.

Lo smoke lento del provider immagine con installazione globale Bun e controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila una immagine live-test condivisa, pacchettizza OpenClaw una sola volta come tarball npm e crea due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git essenziale per lane installer/update/plugin-dependency;
- una immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalita normali.

Le definizioni delle lane Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                                  |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool finale sensibile ai provider.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti affinche i provider non applichino throttling.                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane di installazione npm concorrenti.                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Scaglionamento tra avvii di lane per evitare tempeste di creazione del demone Docker; imposta `0` per nessuno scaglionamento. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/finali selezionate usano limiti piu stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostata | `1` stampa il piano dello scheduler senza eseguire lane.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostata | Elenco esatto di lane separate da virgole; salta lo smoke di pulizia cosi gli agenti possono riprodurre una lane non riuscita. |

Una lane piu pesante del proprio limite effettivo puo comunque avviarsi da un pool vuoto, poi viene eseguita da sola finche non rilascia capacita. I preflight aggregati locali controllano Docker, rimuovono container E2E OpenClaw obsoleti, emettono lo stato delle lane attive, persistono i tempi delle lane per l'ordinamento dalla piu lunga alla piu breve e per impostazione predefinita smettono di pianificare nuove lane in pool dopo il primo fallimento.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale pacchetto, tipo di immagine, immagine live, lane e copertura credenziali siano richiesti. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Pacchettizza OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto pacchetto dell'esecuzione corrente oppure scarica un artefatto pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; crea e pubblica immagini E2E Docker GHCR bare/functional taggate con il digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti con digest del pacchetto invece di ricrearle. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, cosi uno stream registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico CI.

### Chunk del percorso release

La copertura Docker di release esegue job piu piccoli a chunk con `OPENCLAW_SKIP_DOCKER_BUILD=1`, cosi ogni chunk scarica solo il tipo di immagine di cui ha bisogno ed esegue piu lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

I chunk Docker di release correnti sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati Plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incorporato in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch dedicati esclusivamente a OpenWebUI. Le lane di aggiornamento dei channel in bundle ritentano una volta in caso di errori transitori di rete npm.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job chunk, mantenendo il debug delle lane non riuscite limitato a un job Docker mirato e preparando, scaricando o riusando l'artefatto pacchetto per quell'esecuzione; se una lane selezionata e una lane Docker live, il job mirato crea localmente l'immagine live-test per quella riesecuzione. I comandi GitHub generati per riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando quei valori esistono, cosi una lane non riuscita puo riusare il pacchetto e le immagini esatte dell'esecuzione fallita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue ogni giorno la suite Docker completa release-path.

## Prerelease Plugin

`Plugin Prerelease` e una copertura prodotto/pacchetto piu costosa, quindi e un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le pull request normali, i push su `main` e i dispatch CI manuali autonomi tengono disattivata quella suite. Bilancia i test dei Plugin in bundle su otto worker di estensione; quei job shard di estensione eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node piu grande, cosi i batch Plugin con import pesanti non creano job CI aggiuntivi. Il percorso prerelease Docker solo release raggruppa le lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con ambito smart. La parita agentica e annidata sotto gli harness ampi QA e release, non e un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parita deve accompagnare una esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce la lane di parita mock, la lane live Matrix e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), cosi il contratto channel e isolato dalla latenza del modello live e dal normale avvio del provider-plugin. Il gateway di trasporto live disabilita la ricerca in memoria perche la parita QA copre separatamente il comportamento della memoria; la connettivita dei provider e coperta dalle suite separate live model, provider nativo e provider Docker.

Matrix usa `--profile fast` per gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il predefinito CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parita QA esegue i pacchetti candidate e baseline come job lane paralleli, poi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale di parita.

Per le PR normali, segui le prove di CI/check con ambito definito invece di trattare la parità come uno stato obbligatorio.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non una scansione completa del repository. Le esecuzioni di guardia giornaliere, manuali e per pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più alto con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La guardia delle pull request resta leggera: si avvia solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. Android e macOS CodeQL restano fuori dai default delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticazione, segreti, sandbox, Cron e baseline del Gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei Plugin di canale, Gateway, Plugin SDK, segreti, punti di audit       |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici SSRF core, parsing IP, protezione di rete, web-fetch e policy SSRF del Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna in uscita e gate di esecuzione degli strumenti degli agenti               |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifesto, registro, installazione package-manager, caricamento sorgenti e contratto di pacchetto del Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla sanity del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai default giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript con severità errore e non di sicurezza su superfici ristrette ad alto valore sul runner Blacksmith Linux più piccolo. La sua guardia delle pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione comandi/modelli/strumenti degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice auth/segreti/sandbox/sicurezza, runtime dei canali core e dei Plugin di canale inclusi, protocollo/metodo-server del Gateway, runtime memoria/collante SDK, consegna MCP/processi/in uscita, catalogo runtime/modelli dei provider, diagnostica sessione/code di consegna, loader Plugin, Plugin SDK/contratto-pacchetto o runtime di risposta del Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti i dodici shard di qualità PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di apprendimento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Codice dei confini di sicurezza per autenticazione, segreti, sandbox, Cron e Gateway                                                                               |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema di configurazione, migrazione, normalizzazione e IO                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale inclusi                                                                                         |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione comandi, dispatch modello/provider, dispatch e code di risposta automatica, e contratti runtime del piano di controllo ACP                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias del Plugin SDK memoria, collante di attivazione runtime memoria e comandi doctor memoria                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda risposte, code di consegna sessione, helper di binding/consegna sessione in uscita, superfici bundle evento/log diagnostici e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch risposte in ingresso del Plugin SDK, helper runtime/payload/chunking delle risposte, opzioni di risposta canale, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, autenticazione e discovery provider, registrazione runtime provider, default/cataloghi provider e registri web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistenza locale, flussi di controllo Gateway e contratti runtime del piano di controllo task                                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime per fetch/search web core, IO media, comprensione media, generazione immagini e generazione media                                                  |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registro, superficie pubblica ed entrypoint del Plugin SDK                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente del Plugin SDK lato pacchetto pubblicato e helper del contratto del pacchetto Plugin                                                                       |

La qualità resta separata dalla sicurezza così che i risultati di qualità possano essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere riaggiunta come lavoro successivo con ambito definito o shard solo dopo che i profili ristretti hanno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche atterrate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato o quando un'altra esecuzione Docs Agent non saltata è stata creata nell'ultima ora. Quando viene eseguito, rivede l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino all'attuale `main`, quindi un'esecuzione oraria può coprire tutte le modifiche di main accumulate dall'ultimo passaggio sulla documentazione.

### Test Performance Agent

Il workflow `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel gate di attività giornaliero. La lane costruisce un report di prestazioni Vitest raggruppato sull'intera suite, consente a Codex di apportare solo piccole correzioni di prestazioni dei test che preservano la copertura invece di refactor ampi, quindi riesegue il report sull'intera suite e rifiuta modifiche che riducono il conteggio baseline dei test superati. Se la baseline ha test falliti, Codex può correggere solo fallimenti ovvi e il report sull'intera suite dopo l'agente deve passare prima che venga creato qualsiasi commit. Quando `main` avanza prima che il push del bot atterri, la lane esegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo dell'agente docs.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia dei duplicati dopo l'atterraggio. Per default è in dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di mutare GitHub, verifica che la PR atterrata sia stata mergiata e che ogni duplicato abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di check locali e routing delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di check locale è più rigoroso sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche di produzione core eseguono typecheck prod core e test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck test core più lint core;
- le modifiche di produzione delle extension eseguono typecheck prod extension e test extension più lint extension;
- le modifiche solo ai test extension eseguono typecheck test extension più lint extension;
- le modifiche pubbliche al Plugin SDK o al contratto Plugin si espandono al typecheck extension perché le extension dipendono da quei contratti core (le sweep Vitest delle extension restano lavoro di test esplicito);
- i bump di versione solo metadata di release eseguono check mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro su tutte le lane di check.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono sé stesse, le modifiche sorgente preferiscono mapping espliciti, poi test sibling e dipendenti dell'import-graph. La configurazione di consegna shared group-room è uno dei mapping espliciti: le modifiche alla configurazione di risposta visibile del gruppo, alla modalità di consegna della risposta sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test di risposta core più le regressioni di consegna Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia nell'harness che il set mappato economico non è un proxy affidabile.

## Validazione Testbox

Esegui Testbox dalla radice del repository e preferisci una box appena riscaldata per una prova ampia. Prima di spendere un gate lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il controllo di integrità fallisce rapidamente quando file radice richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato della sincronizzazione remota non è una copia affidabile della PR; ferma quella box e riscaldane una nuova invece di fare debug dell'errore del test di prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di integrità.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella protezione, oppure usa un valore in millisecondi più alto per diff locali insolitamente grandi.

Crabbox è il wrapper per box remota di proprietà del repository per le prove Linux dei manutentori. Usalo quando un controllo è troppo ampio per un ciclo di modifica locale, quando conta la parità con la CI, o quando la prova richiede segreti, Docker, lane di pacchetti, box riutilizzabili o log remoti. Il normale backend OpenClaw è `blacksmith-testbox`; la capacità AWS/Hetzner di proprietà è un fallback per interruzioni di Blacksmith, problemi di quota o test espliciti su capacità di proprietà.

Prima di una prima esecuzione, controlla il wrapper dalla radice del repository:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repository rifiuta un binario Crabbox obsoleto che non dichiara `blacksmith-testbox`. Passa il provider esplicitamente anche se `.crabbox.yaml` contiene impostazioni predefinite per cloud di proprietà.

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

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Le esecuzioni Crabbox una tantum supportate da Blacksmith dovrebbero fermare automaticamente la Testbox; se un'esecuzione viene interrotta o la pulizia non è chiara, ispeziona le box attive e ferma solo quelle che hai creato:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Usa il riutilizzo solo quando hai intenzionalmente bisogno di più comandi sulla stessa box già idratata:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Se Crabbox è il livello rotto ma Blacksmith funziona, usa Blacksmith diretto come fallback limitato:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Passa alla capacità Crabbox di proprietà solo quando Blacksmith è non disponibile, limitato dalla quota, privo dell'ambiente necessario, oppure quando la capacità di proprietà è esplicitamente l'obiettivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` gestisce le impostazioni predefinite di provider, sincronizzazione e idratazione GitHub Actions per le lane cloud di proprietà. Esclude `.git` locale così il checkout Actions idratato mantiene i propri metadati Git remoti invece di sincronizzare remoti e object store locali dei manutentori, ed esclude artefatti locali di runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` gestisce checkout, configurazione Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto per i comandi `crabbox run --id <cbx_id>` su cloud di proprietà.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
