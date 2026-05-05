---
read_when:
    - Devi capire perché un'attività di CI è stata eseguita o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
    - Stai modificando il dispatch di ClawSweeper o l'inoltro dell'attività di GitHub
summary: Grafo dei job CI, gate di ambito, ombrelli di release ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-05T01:44:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguito a ogni push su `main` e a ogni richiesta pull. Il job `preflight` classifica la diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo scope intelligente e aprono l'intero grafo per i candidati al rilascio e la validazione ampia. Le lane Android restano opzionali tramite `include_android`. La copertura Plugin solo per i rilasci si trova nel workflow separato [`Prerelease Plugin`](#plugin-prerelease) e viene eseguita solo da [`Validazione completa del rilascio`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                     | Quando viene eseguito              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, scope modificati, estensioni modificate e compila il manifesto CI | Sempre su push e PR non bozza      |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                       | Sempre su push e PR non bozza      |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli avvisi npm                                | Sempre su push e PR non bozza      |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                                         | Sempre su push e PR non bozza      |
| `check-dependencies`             | Passaggio Knip solo per dipendenze di produzione più guardia dell'allowlist dei file inutilizzati          | Modifiche rilevanti per Node       |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli sugli artefatti compilati e artefatti downstream riutilizzabili    | Modifiche rilevanti per Node       |
| `checks-fast-core`               | Lane rapide di correttezza Linux come controlli bundled/plugin-contract/protocol                          | Modifiche rilevanti per Node       |
| `checks-fast-contracts-channels` | Controlli dei contratti dei canali in shard con un risultato aggregato stabile                            | Modifiche rilevanti per Node       |
| `checks-node-core-test`          | Shard di test Node core, esclusi canali, bundled, contratti e lane delle estensioni                       | Modifiche rilevanti per Node       |
| `check`                          | Equivalente del gate locale principale in shard: tipi prod, lint, guardie, tipi di test e smoke rigoroso  | Modifiche rilevanti per Node       |
| `check-additional`               | Architettura, drift boundary/prompt in shard, guardie delle estensioni, boundary dei pacchetti e gateway watch | Modifiche rilevanti per Node       |
| `build-smoke`                    | Test smoke della CLI compilata e smoke della memoria di avvio                                             | Modifiche rilevanti per Node       |
| `checks`                         | Verificatore per i test dei canali sugli artefatti compilati                                              | Modifiche rilevanti per Node       |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                           | Dispatch CI manuale per i rilasci  |
| `check-docs`                     | Formattazione, lint e controlli dei link interrotti della documentazione                                  | Documentazione modificata          |
| `skills-python`                  | Ruff + pytest per Skill basate su Python                                                                  | Modifiche rilevanti per Skill Python |
| `checks-windows`                 | Test specifici Windows per processi/percorsi più regressioni condivise degli specificatori di import runtime | Modifiche rilevanti per Windows    |
| `macos-node`                     | Lane di test TypeScript macOS che usa gli artefatti compilati condivisi                                   | Modifiche rilevanti per macOS      |
| `macos-swift`                    | Swift lint, build e test per l'app macOS                                                                  | Modifiche rilevanti per macOS      |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                        | Modifiche rilevanti per Android    |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti di Codex dopo attività attendibile                              | Successo CI principale o dispatch manuale |
| `openclaw-performance`           | Report prestazionali Kova runtime giornalieri/su richiesta con lane mock-provider, deep-profile e GPT 5.4 live | Dispatch pianificato e manuale     |

## Ordine fail-fast

1. `preflight` decide quali lane esistono del tutto. La logica `docs-scope` e `changed-scope` è composta da step dentro questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artefatti e matrice piattaforma.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumatori downstream possono partire appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime si aprono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando un push più recente arriva sulla stessa PR o sul riferimento `main`. Consideralo rumore CI a meno che anche l'esecuzione più recente per lo stesso riferimento non stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()` così segnalano comunque i normali fallimenti degli shard ma non si accodano dopo che l'intero workflow è già stato superato. La chiave di concorrenza CI automatica è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le nuove esecuzioni main. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Scope e routing

La logica di scope vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifesto preflight come se ogni area con scope fosse cambiata.

- **Le modifiche al workflow CI** validano il grafo CI Node più il lint dei workflow, ma da sole non forzano le build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del codice sorgente di piattaforma.
- **Le modifiche solo al routing CI, alcune modifiche economiche ai fixture dei test core e modifiche ristrette agli helper/test-routing dei contratti Plugin** usano un percorso manifesto rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei Plugin bundled e matrici di guardia aggiuntive quando la modifica è limitata alle superfici di routing o helper che il task rapido esercita direttamente.
- **I controlli Node Windows** sono limitati a wrapper specifici Windows per processi/percorsi, helper di runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, Plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard ponderati, le lane core unit fast/support vengono eseguite separatamente, l'infrastruttura core runtime è divisa tra shard state e process/config, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentic gateway/server sono divise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti compilati. I test broad browser, QA, media e Plugin vari usano le rispettive configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard con pattern di inclusione registrano voci di timing usando il nome dello shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro compile/canary del boundary dei pacchetti e separa l'architettura della topologia runtime dalla copertura gateway watch; l'elenco delle guardie boundary è distribuito su quattro shard di matrice, ciascuno esegue guardie indipendenti selezionate in parallelo e stampa i timing per controllo, incluso `pnpm prompt:snapshots:check` così il drift dei prompt del percorso felice del runtime Codex viene fissato alla PR che lo ha causato. Gateway watch, test dei canali e shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

Android CI esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor di terze parti non ha un set sorgente o manifesto separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando al tempo stesso un job duplicato di packaging APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo per dipendenze di produzione fissato all'ultima versione di Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al tempo stesso superfici Plugin dinamiche, generate, di build, live-test e bridge di pacchetto intenzionali che Knip non può risolvere staticamente.

## Inoltro attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall'attività del repository OpenClaw a ClawSweeper. Non fa checkout né esegue codice non attendibile di richieste pull. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, quindi invia dispatch con payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di revisione di issue e richieste pull;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo evento, azione, attore, repository, numero elemento, URL, titolo, stato e brevi estratti per commenti o revisioni quando presenti. Evita intenzionalmente di inoltrare il corpo completo del Webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sull'hook di OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o utile operativamente. Aperture di routine, modifiche, rumore di bot, rumore duplicato di Webhook e normale traffico di revisione dovrebbero produrre `NO_REPLY`.

Tratta titoli, commenti, corpi, testo di revisione, nomi di branch e messaggi di commit GitHub come dati non attendibili lungo tutto questo percorso. Sono input per sintesi e triage, non istruzioni per il workflow o il runtime dell'agente.

## Dispatch manuali

Le esecuzioni CI manuali eseguono lo stesso grafo di job della CI normale, ma forzano l’attivazione di ogni lane con ambito non Android: shard Linux Node, shard dei bundled-plugin, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, build smoke, controlli della documentazione, Python skills, Windows, macOS e Control UI i18n. Le esecuzioni CI manuali standalone eseguono solo Android con `include_android=true`; l’ombrello della release completa abilita Android passando `include_android=true`. I controlli statici di prerelease dei Plugin, lo shard solo release `agentic-plugins`, lo sweep batch completo delle estensioni e le lane Docker di prerelease dei Plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` avvia il workflow separato `Plugin Prerelease` con il gate di validazione release abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa di release candidate non viene annullata da un’altra esecuzione push o PR sullo stesso ref. L’input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, tag o SHA di commit completo usando il file del workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza rapidi (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratto/bundled, controlli dei contratti dei canali in shard, shard di `check` tranne lint, shard e aggregati di `check-additional`, verificatori degli aggregati dei test Node, controlli della documentazione, Python skills, workflow-sanity, labeler, auto-response; anche la preflight install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard di estensioni più leggeri, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard di test Linux Node, shard di test dei bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU che 8 vCPU costavano più di quanto facessero risparmiare); build Docker install-smoke (il tempo in coda da 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` è il workflow di prestazioni del prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere avviato manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Il dispatch manuale normalmente misura il ref del workflow. Imposta `target_ref` per misurare un tag di release o un altro branch con l’implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori più recenti sono indicizzati dal ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref Kova, profilo, modalità di autenticazione della lane, modello, conteggio delle ripetizioni e filtri degli scenari.

Il workflow installa OCM da una release fissata e Kova da `openclaw/Kova` all’input fissato `kova_ref`, poi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova su un runtime di build locale con autenticazione fittizia deterministica compatibile con OpenAI.
- `mock-deep-profile`: profiling CPU/heap/trace per hotspot di startup, gateway e turno agente.
- `live-gpt54`: un turno agente OpenAI reale `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche sonde sorgente native di OpenClaw dopo il passaggio Kova: tempi di avvio del Gateway e memoria nei casi di startup predefinito, hook e 50 Plugin; loop hello ripetuti `channel-chat-baseline` mock-OpenAI; e comandi di startup CLI contro il Gateway avviato. Il riepilogo Markdown delle sonde sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artifact GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow committa anche `report.json`, `report.md`, bundle, `index.md` e artifact delle sonde sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione completa della release

`Full Release Validation` è il workflow ombrello manuale per “eseguire tutto prima della release”. Accetta un branch, tag o SHA di commit completo, avvia il workflow manuale `CI` con quel target, avvia `Plugin Prerelease` per prove solo release di Plugin/pacchetti/statiche/Docker e avvia `OpenClaw Release Checks` per install smoke, accettazione dei pacchetti, controlli pacchetto cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stable/predefinite mantengono la copertura live/E2E esaustiva e dei percorsi di release Docker dietro `run_release_soak=true`; `release_profile=full` forza l’attivazione di quella copertura soak, così la validazione ampia degli advisory resta ampia. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l’artifact `release-package-under-test` dai controlli di release. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa lane del pacchetto Telegram contro il pacchetto npm pubblicato.

Consulta [Validazione completa della release](/it/reference/full-release-validation) per la
matrice degli stage, i nomi esatti dei job del workflow, le differenze tra profili, gli artifact e
gli handle di riesecuzione mirati.

`OpenClaw Release Publish` è il workflow manuale mutante di release. Avvialo
da `release/YYYY.M.D` o `main` dopo che il tag della release esiste e dopo che la
preflight npm di OpenClaw è riuscita. Verifica `pnpm plugins:sync:check`,
avvia `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, avvia
`Plugin ClawHub Release` per lo stesso SHA di release e solo allora avvia
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per la prova di commit fissato su un branch in rapido movimento, usa l’helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L’helper invia un branch temporaneo `release-ci/<sha>-...` allo SHA target, avvia `Full Release Validation` da quel ref fissato, verifica che ogni `headSha` dei workflow figli corrisponda al target ed elimina il branch temporaneo quando l’esecuzione completa. Anche il verificatore ombrello fallisce se un workflow figlio è stato eseguito a uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di rilascio. I
flussi di lavoro di rilascio manuali usano `stable` per impostazione predefinita; usa `full` solo quando
vuoi intenzionalmente l'ampia matrice consultiva di provider/media. `run_release_soak`
controlla se i controlli di rilascio stable/predefiniti eseguono il soak esaustivo live/E2E e
del percorso di rilascio Docker; `full` forza l'attivazione del soak.

- `minimum` mantiene le lane OpenAI/core critiche per il rilascio piu rapide.
- `stable` aggiunge il set stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva di provider/media.

L'ombrello registra gli id delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job piu lenti per ogni esecuzione figlia. Se un flusso di lavoro figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato dell'ombrello e il riepilogo dei tempi.

Per il recupero, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease dei Plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo piu ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene limitata la riesecuzione di una box di rilascio fallita dopo una correzione mirata. Per una singola lane cross-OS fallita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, per esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe di Heartbeat e i riepiloghi packaged-upgrade includono tempi per fase. Le lane QA dei controlli di rilascio sono consultive, quindi i fallimenti solo QA avvisano ma non bloccano il verificatore dei controlli di rilascio.

`OpenClaw Release Checks` usa il riferimento trusted del flusso di lavoro per risolvere il riferimento selezionato una sola volta in un tarball `release-package-under-test`, quindi passa quell'artefatto ai controlli cross-OS e ad Accettazione del pacchetto, oltre al flusso di lavoro Docker del percorso di rilascio live/E2E quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra le box di rilascio ed evita di impacchettare nuovamente lo stesso candidato in piu job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'ombrello piu vecchio. Il monitor padre annulla qualsiasi flusso di lavoro figlio
che ha gia avviato quando il padre viene annullato, quindi la validazione piu recente di main
non resta dietro a una vecchia esecuzione di due ore dei controlli di rilascio. La validazione di branch/tag
di rilascio e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

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

Questo mantiene la stessa copertura dei file rendendo al contempo piu facile rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi aggregati degli shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, costruita dal flusso di lavoro `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container sono il posto sbagliato per avviare test Docker nidificati.

Gli shard live di modello/backend basati su Docker usano un'immagine separata condivisa `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit selezionato. Il flusso di lavoro live di rilascio costruisce e pubblica quell'immagine una sola volta, quindi gli shard Docker live per modello, Gateway suddiviso per provider, backend CLI, bind ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway portano limiti `timeout` espliciti a livello di script sotto il timeout del job del flusso di lavoro, cosi un container bloccato o un percorso di pulizia bloccato fallisce rapidamente invece di consumare l'intero budget dei controlli di rilascio. Se questi shard ricostruiscono indipendentemente l'intero target Docker sorgente, l'esecuzione di rilascio e configurata male e sprechera tempo di calendario in build duplicate dell'immagine.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda e "questo pacchetto OpenClaw installabile funziona come prodotto?" E diversa dalla CI normale: la CI normale valida l'albero sorgente, mentre l'accettazione del pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo installazione o aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa origine, riferimento del flusso di lavoro, riferimento del pacchetto, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il flusso di lavoro riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara immagini Docker con digest del pacchetto quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del flusso di lavoro. Quando un profilo seleziona piu `docker_lanes` mirate, il flusso di lavoro riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, quindi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non e `none` e installa lo stesso artefatto `package-under-test` quando Accettazione del pacchetto ne ha risolto uno; un dispatch Telegram autonomo puo ancora installare una specifica npm pubblicata.
4. `summary` fa fallire il flusso di lavoro se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram facoltativa sono fallite.

### Origini dei candidati

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw come `openclaw@2026.4.27-beta.2`. Usa questa opzione per l'accettazione di prerelease/stable pubblicate.
- `source=ref` impacchetta un branch, un tag o uno SHA completo di commit trusted `package_ref`. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in un worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` e obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` e facoltativo ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` e il codice trusted del flusso di lavoro/harness che esegue il test. `package_ref` e il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente trusted piu vecchi senza eseguire vecchia logica di workflow.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` piu `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa la copertura dei Plugin offline, cosi la validazione dei pacchetti pubblicati non e vincolata alla disponibilita live di ClawHub. La lane Telegram facoltativa riusa l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per dispatch autonomi.

Per la policy dedicata di aggiornamento e test dei Plugin, inclusi comandi locali,
lane Docker, input di Accettazione del pacchetto, default di rilascio e triage dei fallimenti,
vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Accettazione del pacchetto con `source=artifact`, l'artefatto preparato del pacchetto di rilascio, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene le prove di migrazione del pacchetto, aggiornamento, pulizia delle dipendenze di Plugin obsolete, riparazione dell'installazione di Plugin configurati, Plugin offline, aggiornamento dei Plugin e Telegram sullo stesso tarball di pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire la stessa matrice contro un pacchetto npm distribuito invece dell'artefatto costruito da SHA. I controlli di rilascio cross-OS coprono ancora onboarding, installer e comportamento di piattaforma specifici del sistema operativo; la validazione di prodotto per pacchetto/aggiornamento dovrebbe iniziare con Accettazione del pacchetto. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione nel percorso di rilascio bloccante. In Accettazione del pacchetto, il tarball `package-under-test` risolto e sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con valore predefinito `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Full Release Validation con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines=all-since-2026.4.23` e `published_upgrade_survivor_scenarios=reported-issues` per espandere su ogni rilascio npm stabile da `2026.4.23` fino a `latest` e su fixture modellate come issue per configurazione Feishu, file bootstrap/persona preservati, installazioni configurate dei Plugin OpenClaw, percorsi log con tilde e radici di dipendenze obsolete dei Plugin legacy. Il flusso di lavoro separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda la pulizia esaustiva degli aggiornamenti pubblicati, non l'ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare specifiche di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra gli step della ricetta in `summary.json` e sonda `/healthz`, `/readyz`, piu lo stato RPC dopo l'avvio del Gateway. Le lane Windows packaged e installer fresh verificano anche che un pacchetto installato possa importare un override browser-control da un percorso Windows assoluto raw. Lo smoke agent-turn cross-OS OpenAI usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, cosi la prova di installazione e Gateway resta su un modello di test GPT-5 evitando i default GPT-4.x.

### Finestre di compatibilita legacy

Accettazione del pacchetto ha finestre limitate di compatibilita legacy per pacchetti gia pubblicati. I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono usare il percorso di compatibilita:

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` puo saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` puo eliminare `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e puo registrare `update.channel` persistito mancante;
- gli smoke dei Plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` puo consentire la migrazione dei metadati di configurazione pur richiedendo che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` puo anche avvisare per file di stamp di metadati di build locali che erano gia stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di avvisare o saltare.

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

Quando esegui il debug di un'esecuzione di accettazione del pacchetto non riuscita, inizia dal riepilogo `resolve_package` per confermare l'origine, la versione e lo SHA-256 del pacchetto. Poi esamina l'esecuzione figlia `docker_acceptance` e i relativi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo del pacchetto non riuscito o le esatte lane Docker invece di rieseguire la validazione completa della release.

## Smoke di installazione

Il workflow separato `Install Smoke` riutilizza lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per le pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest di Plugin inclusi o superfici core Plugin/canale/Gateway/Plugin SDK esercitate dai job smoke Docker. Modifiche solo al sorgente di Plugin inclusi, modifiche solo ai test e modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido compila una volta l'immagine del Dockerfile root, controlla la CLI, esegue lo smoke CLI agents delete shared-workspace, esegue l'e2e gateway-network del container, verifica un argomento di build per un'estensione inclusa ed esegue il profilo Docker limitato dei Plugin inclusi con un timeout aggregato dei comandi di 240 secondi (ogni esecuzione Docker dello scenario ha un limite separato).
- **Percorso completo** mantiene l'installazione del pacchetto QR e la copertura Docker/update dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di release workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riutilizza un'immagine smoke GHCR del Dockerfile root con SHA di destinazione, poi esegue installazione del pacchetto QR, smoke del Dockerfile root/Gateway, smoke installer/update e l'E2E Docker rapido dei Plugin inclusi come job separati, in modo che il lavoro sull'installer non attenda dietro agli smoke dell'immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica di ambito delle modifiche richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke completo di installazione alla validazione notturna o di release.

Lo smoke lento del provider immagini con installazione globale Bun è regolato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila una singola immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e compila due immagini condivise `scripts/e2e/Dockerfile`:

- un runner Node/Git minimale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del pianificatore si trova in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool tail sensibile ai provider.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti per evitare throttling dei provider.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane concorrenti di installazione npm.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane concorrenti multi-servizio.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Ritardo tra gli avvii delle lane per evitare picchi di creazione del demone Docker; imposta `0` per nessun ritardo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/tail selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset       | `1` stampa il piano dello scheduler senza eseguire le lane.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset       | Elenco separato da virgole di lane esatte; salta lo smoke di pulizia così gli agenti possono riprodurre una singola lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. Le preflight aggregate locali verificano Docker, rimuovono container E2E OpenClaw obsoleti, emettono lo stato delle lane attive, persistono i tempi delle lane per l'ordinamento dalla più lunga alla più breve e interrompono per impostazione predefinita la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale copertura di pacchetto, tipo di immagine, immagine live, lane e credenziali è richiesta. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto pacchetto dell'esecuzione corrente oppure scarica un artefatto pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; compila e pubblica immagini Docker E2E bare/funzionali GHCR taggate con il digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riutilizza gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o le immagini con digest del pacchetto esistenti invece di ricompilare. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico della CI.

### Chunk del percorso di release

La copertura Docker di release esegue job suddivisi in chunk più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine necessario ed esegue più lane tramite lo stesso scheduler pesato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Gli attuali chunk Docker di release sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch limitati a OpenWebUI. Le lane di aggiornamento dei canali inclusi ritentano una volta in caso di errori temporanei di rete npm.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue lane selezionate contro le immagini preparate invece dei job chunk, mantenendo il debug di lane non riuscite limitato a un singolo job Docker mirato e preparando, scaricando o riutilizzando l'artefatto del pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine live-test per quella riesecuzione. I comandi GitHub di riesecuzione generati per lane includono `package_artifact_run_id`, `package_artifact_name` e input delle immagini preparate quando quei valori esistono, così una lane non riuscita può riutilizzare esattamente il pacchetto e le immagini dell'esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue quotidianamente l'intera suite Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le pull request normali, i push su `main` e i dispatch CI manuali autonomi mantengono disattivata quella suite. Bilancia i test dei Plugin inclusi tra otto worker di estensione; quei job di shard di estensione eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di Plugin con import pesanti non creano job CI aggiuntivi. Il percorso prerelease Docker solo release raggruppa le lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con ambito smart. La parità agentica è annidata negli harness ampi QA e release, non in un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve accompagnare un'esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e con dispatch manuale; distribuisce la lane di parità mock, la lane Matrix live e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza del modello live e dal normale avvio del Plugin provider. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI in checkout lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre l'intera copertura Matrix nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pacchetti candidato e baseline come job di lane paralleli, poi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale di parità.

Per le PR normali, segui le prove CI/check con ambito invece di trattare la parità come uno stato richiesto.

## CodeQL

Il flusso di lavoro `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non la scansione completa del repository. Le esecuzioni giornaliere, manuali e di guardia per le pull request non draft analizzano il codice dei flussi di lavoro Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La guardia delle pull request rimane leggera: si avvia solo per modifiche in `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src` ed esegue la stessa matrice di sicurezza ad alta confidenza del flusso di lavoro pianificato. Android e macOS CodeQL restano fuori dai valori predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Base di riferimento per auth, segreti, sandbox, cron e gateway                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione del canale core più runtime del Plugin di canale, gateway, Plugin SDK, segreti, punti di contatto audit |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core SSRF, parsing IP, guardia di rete, web-fetch e policy SSRF del Plugin SDK                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna in uscita e gate di esecuzione degli strumenti agent                         |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifest, registry, installazione package-manager, caricamento sorgenti e contratto di package del Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla sanity del flusso di lavoro. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai valori predefiniti giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severity errore su superfici ristrette ad alto valore sul runner Blacksmith Linux più piccolo. La sua guardia per pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche a codice di esecuzione comandi/modelli/strumenti agent e dispatch delle risposte, schema/migrazione/IO della config, codice auth/segreti/sandbox/sicurezza, runtime del canale core e del Plugin di canale incluso, protocollo/metodo server del gateway, runtime memoria/collante SDK, MCP/processo/consegna in uscita, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader Plugin, Plugin SDK/contratto di package o runtime di risposta del Plugin SDK. Le modifiche alla config CodeQL e al flusso di lavoro di qualità eseguono tutti e dodici gli shard di qualità per PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook didattici/di iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza per auth, segreti, sandbox, cron e gateway                                                                                            |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema config, migrazione, normalizzazione e IO                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione del canale core e del Plugin di canale incluso                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione dei comandi, dispatch modello/provider, dispatch e code di risposta automatica e contratti runtime del control plane ACP                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias memoria del Plugin SDK, collante di attivazione runtime memoria e comandi doctor memoria                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda di risposta, code di consegna sessione, helper di binding/consegna sessione in uscita, superfici bundle di eventi/log diagnostici e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso del Plugin SDK, helper payload/chunking/runtime delle risposte, opzioni di risposta canale, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, auth e discovery provider, registrazione runtime provider, default/cataloghi provider e registry web/search/fetch/embedding          |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap della UI di controllo, persistenza locale, flussi di controllo gateway e contratti runtime del control plane delle attività                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime core per web fetch/search, media IO, comprensione media, generazione immagini e generazione media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registry, superficie pubblica ed entrypoint del Plugin SDK                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente del Plugin SDK lato package pubblicato e helper del contratto di package del Plugin                                                                           |

La qualità resta separata dalla sicurezza così che i risultati di qualità possano essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere riaggiunta come lavoro di follow-up con ambito o shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Flussi di lavoro di manutenzione

### Docs Agent

Il flusso di lavoro `Docs Agent` è una corsia di manutenzione Codex guidata da eventi per mantenere i documenti esistenti allineati con le modifiche atterrate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni da workflow-run vengono saltate quando `main` è avanzato o quando un'altra esecuzione non saltata di Docs Agent è stata creata nell'ultima ora. Quando viene eseguito, rivede l'intervallo di commit dal precedente SHA sorgente di Docs Agent non saltato fino all'attuale `main`, così una singola esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sui documenti.

### Test Performance Agent

Il flusso di lavoro `Test Performance Agent` è una corsia di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione da workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliero. La corsia costruisce un report completo delle prestazioni Vitest raggruppato dell'intera suite, consente a Codex di apportare solo piccole correzioni alle prestazioni dei test preservando la copertura invece di refactor ampi, quindi riesegue il report dell'intera suite e rifiuta modifiche che riducono il conteggio baseline dei test superati. Se la baseline contiene test falliti, Codex può correggere solo fallimenti ovvi e il report dell'intera suite dopo l'agent deve passare prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot atterri, la corsia esegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

### PR duplicate dopo il merge

Il flusso di lavoro `Duplicate PRs After Merge` è un flusso di lavoro manuale per maintainer per la pulizia dei duplicati post-atterraggio. Per impostazione predefinita è dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR atterrata sia stata mergiata e che ogni duplicato abbia un issue referenziato condiviso o hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locale e routing delle modifiche

La logica locale delle changed-lane vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche alla produzione core eseguono typecheck prod core e test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck dei test core più lint core;
- le modifiche alla produzione delle extension eseguono typecheck prod extension e test extension più lint extension;
- le modifiche solo ai test extension eseguono typecheck dei test extension più lint extension;
- le modifiche pubbliche al Plugin SDK o al contratto dei Plugin si espandono al typecheck delle extension perché le extension dipendono da quei contratti core (le scansioni Vitest delle extension restano lavoro di test esplicito);
- i bump di versione solo di metadati di release eseguono controlli mirati su versione/config/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro su tutte le lane di controllo.

Il routing locale changed-test vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono se stesse, le modifiche ai sorgenti preferiscono mapping espliciti, poi test sibling e dipendenti del grafo di import. La config condivisa di consegna group-room è uno dei mapping espliciti: le modifiche alla config delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema del message-tool passano attraverso i test core sulle risposte più regressioni di consegna Discord e Slack, così una modifica condivisa del default fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sul harness da rendere il set mappato economico un proxy non affidabile.

## Validazione Testbox

Esegui Testbox dalla radice del repo e preferisci una box appena preparata per una verifica ampia. Prima di spendere un gate lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` all'interno della box.

Il controllo di sanità fallisce rapidamente quando file root richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato di sincronizzazione remoto non è una copia affidabile della PR; ferma quella box e preparane una nuova invece di eseguire il debug dell'errore del test del prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di sanità.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che rimane nella fase di sincronizzazione per più di cinque minuti senza output successivo alla sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella protezione, oppure usa un valore in millisecondi più grande per diff locali insolitamente ampi.

Crabbox è il wrapper di box remote di proprietà del repo per la verifica Linux dei manutentori. Usalo quando un controllo è troppo ampio per un ciclo di modifica locale, quando la parità con la CI è importante o quando la verifica richiede segreti, Docker, lane di pacchetti, box riutilizzabili o log remoti. Il backend OpenClaw normale è `blacksmith-testbox`; la capacità AWS/Hetzner proprietaria è un fallback per interruzioni di Blacksmith, problemi di quota o test espliciti su capacità proprietaria.

Prima di una prima esecuzione, controlla il wrapper dalla radice del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox obsoleto che non pubblicizza `blacksmith-testbox`. Passa esplicitamente il provider anche se `.crabbox.yaml` ha impostazioni predefinite owned-cloud.

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

Riesecuzione mirata dei test:

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

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Le esecuzioni Crabbox monouso basate su Blacksmith dovrebbero fermare automaticamente Testbox; se un'esecuzione viene interrotta o la pulizia non è chiara, ispeziona le box attive e ferma solo le box che hai creato:

```bash
blacksmith testbox list
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

Passa alla capacità Crabbox proprietaria solo quando Blacksmith non è disponibile, è limitato dalla quota, non ha l'ambiente necessario oppure la capacità proprietaria è esplicitamente l'obiettivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` controlla provider, sincronizzazione e impostazioni predefinite di idratazione GitHub Actions per le lane owned-cloud. Esclude `.git` locale, così il checkout Actions idratato mantiene i propri metadati Git remoti invece di sincronizzare remote e object store locali dei manutentori, ed esclude artefatti locali di runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` controlla checkout, configurazione Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto per i comandi owned-cloud `crabbox run --id <cbx_id>`.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
