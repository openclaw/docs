---
read_when:
    - È necessario capire perché un job CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
    - Stai modificando lo smistamento di ClawSweeper o l'inoltro dell'attività GitHub
summary: Grafo dei job di CI, gate di ambito, ombrelli di rilascio e comandi locali equivalenti
title: Pipeline di CI
x-i18n:
    generated_at: "2026-05-06T08:42:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

La CI di OpenClaw viene eseguita a ogni push su `main` e per ogni richiesta pull. Il processo `preflight` classifica il diff e disattiva i percorsi costosi quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo scoping intelligente ed espandono l'intero grafo per i candidati di rilascio e la validazione ampia. I percorsi Android restano opzionali tramite `include_android`. La copertura Plugin riservata ai rilasci vive nel workflow separato [`Plugin Prerelease`](#plugin-prerelease) e viene eseguita solo da [`Full Release Validation`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Processo                         | Scopo                                                                                                               | Quando viene eseguito              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, ambiti modificati, estensioni modificate e crea il manifesto della CI     | Sempre su push e PR non bozza      |
| `security-scm-fast`              | Rilevamento di chiavi private e audit del workflow tramite `zizmor`                                                 | Sempre su push e PR non bozza      |
| `security-dependency-audit`      | Audit del lockfile di produzione, senza dipendenze installate, rispetto agli advisory npm                           | Sempre su push e PR non bozza      |
| `security-fast`                  | Aggregato richiesto per i processi di sicurezza rapidi                                                              | Sempre su push e PR non bozza      |
| `check-dependencies`             | Passaggio Knip solo sulle dipendenze di produzione più guardia della allowlist dei file inutilizzati                 | Modifiche rilevanti per Node       |
| `build-artifacts`                | Crea `dist/`, Control UI, controlli sugli artefatti compilati e artefatti downstream riutilizzabili                 | Modifiche rilevanti per Node       |
| `checks-fast-core`               | Percorsi rapidi di correttezza Linux come controlli bundled/plugin-contract/protocol                                | Modifiche rilevanti per Node       |
| `checks-fast-contracts-channels` | Controlli sharded dei contratti dei canali con un risultato aggregato stabile                                       | Modifiche rilevanti per Node       |
| `checks-node-core-test`          | Shard dei test core Node, esclusi percorsi canale, bundled, contratto ed estensione                                 | Modifiche rilevanti per Node       |
| `check`                          | Equivalente sharded del gate locale principale: tipi prod, lint, guardie, tipi dei test e smoke rigoroso            | Modifiche rilevanti per Node       |
| `check-additional`               | Architettura, drift sharded di boundary/prompt, guardie delle estensioni, boundary dei pacchetti e gateway watch     | Modifiche rilevanti per Node       |
| `build-smoke`                    | Smoke test della CLI compilata e smoke della memoria di avvio                                                       | Modifiche rilevanti per Node       |
| `checks`                         | Verificatore per i test dei canali sugli artefatti compilati                                                        | Modifiche rilevanti per Node       |
| `checks-node-compat-node22`      | Percorso di build e smoke per compatibilità Node 22                                                                 | Dispatch CI manuale per i rilasci  |
| `check-docs`                     | Formattazione, lint e controlli dei link interrotti della documentazione                                            | Documentazione modificata          |
| `skills-python`                  | Ruff + pytest per Skills con backend Python                                                                         | Modifiche rilevanti per Skill Python |
| `checks-windows`                 | Test specifici per processi/percorsi Windows più regressioni condivise degli specificatori di import runtime         | Modifiche rilevanti per Windows    |
| `macos-node`                     | Percorso di test TypeScript macOS usando gli artefatti compilati condivisi                                          | Modifiche rilevanti per macOS      |
| `macos-swift`                    | Swift lint, build e test per l'app macOS                                                                            | Modifiche rilevanti per macOS      |
| `android`                        | Test unitari Android per entrambe le varianti più una build APK debug                                               | Modifiche rilevanti per Android    |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                           | Successo della CI main o dispatch manuale |
| `openclaw-performance`           | Report giornalieri/su richiesta sulle prestazioni runtime Kova con percorsi mock-provider, deep-profile e live GPT 5.4 | Dispatch pianificato e manuale     |

## Ordine fail-fast

1. `preflight` decide quali percorsi esistono del tutto. La logica `docs-scope` e `changed-scope` è composta da passaggi dentro questo processo, non da processi autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i processi più pesanti di artefatti e matrice di piattaforma.
3. `build-artifacts` si sovrappone ai percorsi Linux rapidi così i consumatori downstream possono partire appena la build condivisa è pronta.
4. I percorsi più pesanti di piattaforma e runtime si espandono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i processi superati come `cancelled` quando un push più recente arriva sulla stessa PR o sullo stesso ref `main`. Trattalo come rumore della CI, a meno che anche l'esecuzione più recente per lo stesso ref non stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()` così riportano comunque i normali errori degli shard, ma non vengono messi in coda dopo che l'intero workflow è già stato superato. La chiave automatica di concorrenza della CI è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni più recenti su main. Le esecuzioni manuali dell'intera suite usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Ambito e instradamento

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifesto preflight come se ogni area con ambito fosse cambiata.

- **Le modifiche al workflow CI** validano il grafo CI Node più il linting del workflow, ma da sole non forzano build native Windows, Android o macOS; quei percorsi di piattaforma restano limitati alle modifiche del sorgente di piattaforma.
- **Le modifiche solo di instradamento CI, alcune modifiche economiche alle fixture dei test core e modifiche ristrette a helper/test-routing del contratto Plugin** usano un percorso manifesto rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei Plugin bundled e matrici aggiuntive di guardie quando la modifica è limitata alle superfici di instradamento o helper esercitate direttamente dal task rapido.
- **I controlli Node Windows** sono limitati a wrapper specifici Windows per processi/percorsi, helper dei runner npm/pnpm/UI, configurazione del gestore pacchetti e superfici del workflow CI che eseguono quel percorso; modifiche non correlate a sorgente, Plugin, install-smoke e solo test restano sui percorsi Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate così ogni processo resta piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard pesati, i percorsi core unit fast/support vengono eseguiti separatamente, l'infrastruttura runtime core è divisa tra shard stato e processo/config, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentic gateway/server sono divise tra percorsi chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti compilati. I test browser, QA, media e Plugin vari usano le rispettive configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard con pattern di inclusione registrano voci di timing usando il nome shard della CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` tiene insieme il lavoro di compilazione/canary del boundary dei pacchetti e separa l'architettura della topologia runtime dalla copertura gateway watch; l'elenco delle guardie di boundary è suddiviso su quattro shard di matrice, ciascuno esegue guardie indipendenti selezionate in parallelo e stampa i tempi per controllo, incluso `pnpm prompt:snapshots:check`, così il drift dei prompt del percorso riuscito del runtime Codex viene attribuito alla PR che lo ha causato. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati creati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi crea l'APK debug Play. La variante third-party non ha un source set o manifesto separato; il suo percorso di test unitari compila comunque la variante con i flag BuildConfig per SMS/call-log, evitando al tempo stesso un processo duplicato di packaging dell'APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo sulle dipendenze di produzione fissato all'ultima versione di Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip dei file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce obsoleta nella allowlist, preservando al contempo superfici intenzionali di Plugin dinamici, generate, di build, live-test e bridge di pacchetto che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall'attività del repository OpenClaw a ClawSweeper. Non esegue checkout né codice non attendibile delle richieste pull. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, poi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro percorsi:

- `clawsweeper_item` per richieste esatte di revisione di issue e richieste pull;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

Il percorso `github_activity` inoltra solo metadati normalizzati: tipo evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o revisioni quando presenti. Evita intenzionalmente di inoltrare il corpo completo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sull'hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o utile a livello operativo. Aperture, modifiche, attività ripetitiva di bot, rumore da webhook duplicati e normale traffico di revisione dovrebbero produrre `NO_REPLY`.

Tratta titoli, commenti, corpi, testo delle revisioni, nomi dei branch e messaggi di commit GitHub come dati non attendibili in tutto questo percorso. Sono input per sintesi e triage, non istruzioni per il workflow o il runtime dell'agente.

## Dispatch manuali

I dispatch manuali di CI eseguono lo stesso grafo di job della CI normale, ma forzano l'attivazione di ogni corsia con ambito non Android: shard Linux Node, shard dei Plugin in bundle, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli della documentazione, Skills Python, Windows, macOS e i18n della Control UI. I dispatch manuali di CI autonomi eseguono solo Android con `include_android=true`; l'ombrello completo di release abilita Android passando `include_android=true`. I controlli statici di prerelease dei Plugin, lo shard solo release `agentic-plugins`, lo sweep batch completo delle extension e le corsie Docker di prerelease dei Plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` avvia il workflow separato `Plugin Prerelease` con il gate di validazione release abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa di release candidate non viene annullata da un'altra esecuzione push o PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, tag o SHA completo di commit usando il file del workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza rapidi (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratto/in bundle, controlli shard dei contratti dei canali, shard `check` tranne lint, aggregati `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard extension più leggeri, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei Plugin in bundle, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU da far costare 8 vCPU più di quanto risparmiassero); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto risparmiasse)                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |

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

Il dispatch manuale normalmente esegue benchmark sul ref del workflow. Imposta `target_ref` per eseguire benchmark su un tag di release o su un altro branch con l'implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori latest sono indicizzati dal ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref Kova, profilo, modalità di autenticazione della corsia, modello, conteggio delle ripetizioni e filtri degli scenari.

Il workflow installa OCM da una release fissata e Kova da `openclaw/Kova` all'input fissato `kova_ref`, quindi esegue tre corsie:

- `mock-provider`: scenari diagnostici Kova contro un runtime di build locale con autenticazione falsa deterministica compatibile con OpenAI.
- `mock-deep-profile`: profiling CPU/heap/trace per startup, Gateway e hotspot dei turni agente.
- `live-gpt54`: un turno agente OpenAI reale `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La corsia mock-provider esegue anche probe sorgente nativi OpenClaw dopo il passaggio Kova: tempi di avvio del Gateway e memoria nei casi di startup predefinito, hook e con 50 Plugin; cicli hello ripetuti di mock-OpenAI `channel-chat-baseline`; e comandi di startup CLI contro il Gateway avviato. Il riepilogo Markdown dei probe sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni corsia carica artefatti GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow committa anche `report.json`, `report.md`, bundle, `index.md` e artefatti dei probe sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione completa della release

`Full Release Validation` è il workflow ombrello manuale per "eseguire tutto prima della release". Accetta un branch, tag o SHA completo di commit, avvia il workflow manuale `CI` con quel target, avvia `Plugin Prerelease` per prove solo release di Plugin/pacchetto/statiche/Docker e avvia `OpenClaw Release Checks` per smoke di installazione, accettazione pacchetti, controlli pacchetti cross-OS, parità QA Lab, Matrix e corsie Telegram. Le esecuzioni stabili/predefinite mantengono la copertura live/E2E esaustiva e del percorso release Docker dietro `run_release_soak=true`; `release_profile=full` forza l'attivazione di quella copertura soak, così la validazione ampia degli advisory resta ampia. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l'artefatto `release-package-under-test` dai controlli release. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa corsia pacchetto Telegram contro il pacchetto npm pubblicato.

Vedi [Validazione completa della release](/it/reference/full-release-validation) per la
matrice degli stage, i nomi esatti dei job del workflow, le differenze tra profili, gli artefatti e
gli handle di riesecuzione mirati.

`OpenClaw Release Publish` è il workflow manuale di release mutante. Avvialo
da `release/YYYY.M.D` o `main` dopo che il tag di release esiste e dopo che il
preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
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

Per la prova di un commit fissato su un branch che si muove rapidamente, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L'helper invia un branch temporaneo `release-ci/<sha>-...` allo SHA target, avvia `Full Release Validation` da quel ref fissato, verifica che ogni workflow figlio abbia `headSha` uguale al target ed elimina il branch temporaneo quando l'esecuzione termina. Il verificatore ombrello fallisce anche se un workflow figlio è stato eseguito a uno SHA diverso.

`release_profile` controlla l'ampiezza delle verifiche live/provider passata ai controlli di rilascio. I
workflow di rilascio manuali usano `stable` come impostazione predefinita; usa `full` solo quando
vuoi intenzionalmente l'ampia matrice consultiva di provider/media. `run_release_soak`
controlla se i controlli di rilascio stable/predefiniti eseguono il soak esaustivo live/E2E e
del percorso di rilascio Docker; `full` forza l'attivazione del soak.

- `minimum` mantiene le lane OpenAI/core critiche per il rilascio piu' rapide.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva di provider/media.

L'umbrella registra gli ID delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job piu' lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato umbrella e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease dei Plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo piu' ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'umbrella. Questo mantiene delimitata la riesecuzione di un box di rilascio non riuscito dopo una correzione mirata. Per una singola lane cross-OS non riuscita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, per esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe di Heartbeat e i riepiloghi packaged-upgrade includono i tempi per fase. Le lane QA dei controlli di rilascio sono consultive, quindi gli errori solo QA avvisano ma non bloccano il verificatore dei controlli di rilascio.

`OpenClaw Release Checks` usa il riferimento del workflow attendibile per risolvere il riferimento selezionato una sola volta in un tarball `release-package-under-test`, quindi passa quell'artefatto ai controlli cross-OS e a Package Acceptance, oltre al workflow Docker live/E2E del percorso di rilascio quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra i box di rilascio ed evita di reimpacchettare lo stesso candidato in piu' job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'umbrella piu' vecchio. Il monitor padre annulla qualsiasi workflow figlio che
ha gia' avviato quando il padre viene annullato, quindi la validazione piu' recente di main
non resta dietro a un'esecuzione obsoleta di due ore dei controlli di rilascio. La validazione
di branch/tag di rilascio e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

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
- shard audio/video media separati e shard musica filtrati per provider

Questo mantiene la stessa copertura dei file rendendo piu' facile rieseguire e diagnosticare gli errori lenti dei provider live. I nomi di shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live modello/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow di rilascio live crea e pubblica quell'immagine una sola volta, poi gli shard del modello live Docker, del Gateway suddiviso per provider, del backend CLI, del bind ACP e dell'harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway hanno limiti espliciti di `timeout` a livello di script inferiori al timeout del job del workflow, cosi' un container bloccato o un percorso di pulizia fallisce rapidamente invece di consumare l'intero budget dei controlli di rilascio. Se quegli shard ricostruiscono indipendentemente il target Docker completo dai sorgenti, l'esecuzione di rilascio e' configurata in modo errato e sprechera' tempo su build di immagini duplicate.

## Package Acceptance

Usa `Package Acceptance` quando la domanda e' "questo pacchetto OpenClaw installabile funziona come prodotto?" E' diverso dalla CI normale: la CI normale valida l'albero dei sorgenti, mentre Package Acceptance valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa sorgente, riferimento del workflow, riferimento del pacchetto, versione, SHA-256 e profilo nel riepilogo del passaggio GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara immagini Docker con digest del pacchetto quando necessario ed esegue le lane Docker selezionate su quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona piu' `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, quindi distribuisce quelle lane come job Docker mirati paralleli con artefatti unici.
3. `package_telegram` chiama opzionalmente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non e' `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; una dispatch Telegram autonoma puo' comunque installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram opzionale non sono riuscite.

### Sorgenti candidate

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta come `openclaw@2026.4.27-beta.2`. Usa questa opzione per l'accettazione di prerelease/stable pubblicate.
- `source=ref` impacchetta un branch, tag o SHA completo di commit `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in un worktree scollegato e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` e' obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` e' opzionale ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` e' il codice workflow/harness attendibile che esegue il test. `package_ref` e' il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili piu' vecchi senza eseguire la logica vecchia del workflow.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` piu' `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocchi completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura offline dei Plugin, cosi' la validazione del pacchetto pubblicato non dipende dalla disponibilita' live di ClawHub. La lane Telegram opzionale riutilizza l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per dispatch autonome.

Per la policy dedicata di aggiornamento e test dei Plugin, inclusi comandi locali,
lane Docker, input di Package Acceptance, impostazioni predefinite di rilascio e triage degli errori,
vedi [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Package Acceptance con `source=artifact`, l'artefatto del pacchetto di rilascio preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene la migrazione del pacchetto, l'aggiornamento, la pulizia delle dipendenze obsolete dei Plugin, la riparazione dell'installazione dei Plugin configurati, i Plugin offline, l'aggiornamento dei Plugin e la prova Telegram sullo stesso tarball di pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire la stessa matrice contro un pacchetto npm distribuito invece dell'artefatto costruito dallo SHA. I controlli di rilascio cross-OS coprono ancora onboarding, installer e comportamento della piattaforma specifici dell'OS; la validazione prodotto di pacchetto/aggiornamento dovrebbe iniziare da Package Acceptance. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione nel percorso di rilascio bloccante. In Package Acceptance, il tarball `package-under-test` risolto e' sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con valore predefinito `openclaw@latest`; i comandi di riesecuzione delle lane non riuscite preservano quella baseline. Full Release Validation con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` per espandere l'esecuzione alle quattro ultime release npm stable piu' release fissate di confine per la compatibilita' dei Plugin e fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di Plugin OpenClaw configurate, percorsi log con tilde e root di dipendenze obsolete dei Plugin legacy. Le selezioni published-upgrade survivor multi-baseline vengono suddivise per baseline in job Docker runner mirati separati. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda la pulizia esaustiva degli aggiornamenti pubblicati, non l'ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare specifiche di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e sonda `/healthz`, `/readyz` piu' lo stato RPC dopo l'avvio del Gateway. Le lane Windows packaged e fresh installer verificano anche che un pacchetto installato possa importare un override browser-control da un percorso Windows assoluto grezzo. Lo smoke cross-OS OpenAI agent-turn usa come impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, cosi' la prova di installazione e Gateway resta su un modello di test GPT-5 evitando impostazioni predefinite GPT-4.x.

### Finestre di compatibilita' legacy

Package Acceptance ha finestre delimitate di compatibilita' legacy per pacchetti gia' pubblicati. I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono usare il percorso di compatibilita':

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` puo' saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` puo' eliminare `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e puo' registrare `update.channel` persistito mancante;
- gli smoke dei Plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` puo' consentire la migrazione dei metadati di configurazione pur richiedendo che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto `2026.4.26` pubblicato può anche emettere avvisi per file di stamp di metadati di build locale che erano già stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di emettere un avviso o essere saltate.

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

Quando si esegue il debug di un'esecuzione di accettazione del pacchetto non riuscita, partire dal riepilogo `resolve_package` per confermare origine del pacchetto, versione e SHA-256. Quindi ispezionare l'esecuzione figlia `docker_acceptance` e i relativi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferire la riesecuzione del profilo di pacchetto non riuscito o delle lane Docker esatte invece di rieseguire la validazione completa del rilascio.

## Smoke di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Suddivide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest di plugin inclusi oppure superfici core di plugin/canale/gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche solo al codice sorgente dei plugin inclusi, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido crea una volta l'immagine dal Dockerfile root, controlla la CLI, esegue lo smoke CLI per l'eliminazione degli agenti nello spazio di lavoro condiviso, esegue l'e2e del gateway-network del container, verifica un argomento di build per un'estensione inclusa ed esegue il profilo Docker limitato dei plugin inclusi entro un timeout aggregato dei comandi di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- **Percorso completo** mantiene l'installazione del pacchetto QR e la copertura Docker/update dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di rilascio workflow-call e pull request che toccano realmente superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riusa un'immagine smoke GHCR dal Dockerfile root per lo SHA di destinazione, quindi esegue installazione del pacchetto QR, smoke del Dockerfile root/gateway, smoke installer/update e il rapido Docker E2E dei plugin inclusi come job separati, così il lavoro sull'installer non attende dietro agli smoke dell'immagine root.

I push su `main` (inclusi i merge commit) non forzano il percorso completo; quando la logica di ambito delle modifiche richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di rilascio.

Lo smoke lento del provider di immagini con installazione globale Bun è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di rilascio, e i dispatch manuali di `Install Smoke` possono includerlo, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila un'unica immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e crea due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git essenziale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normale.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del pianificatore si trova in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, quindi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool finale sensibile ai provider.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti per evitare che i provider applichino throttling.              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane di installazione npm concorrenti.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra avvii delle lane per evitare tempeste di create del demone Docker; impostare `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); lane live/finali selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostato | `1` stampa il piano dello scheduler senza eseguire le lane.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostato | Elenco esatto di lane separato da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, quindi viene eseguita da sola finché non rilascia capacità. I preflight aggregati locali controllano Docker, rimuovono container OpenClaw E2E obsoleti, emettono lo stato delle lane attive, persistono i tempi delle lane per l'ordinamento dalla più lunga alla più breve e, per impostazione predefinita, smettono di pianificare nuove lane del pool dopo il primo errore.

### Workflow live/E2E riusabile

Il workflow live/E2E riusabile chiede a `scripts/test-docker-all.mjs --plan-json` quali coperture di pacchetto, tipo di immagine, immagine live, lane e credenziali sono richieste. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto di pacchetto dell'esecuzione corrente oppure scarica un artefatto di pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; crea e invia immagini Docker E2E GHCR bare/funzionali taggate con il digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti basate sul digest del pacchetto invece di ricostruirle. I pull delle immagini Docker vengono ritentati con un timeout limitato a 180 secondi per tentativo, così uno stream di registry/cache bloccato ritenta rapidamente invece di consumare gran parte del percorso critico della CI.

### Chunk del percorso di rilascio

La copertura Docker di rilascio esegue job suddivisi in chunk più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine necessario ed esegue più lane tramite lo stesso scheduler pesato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Gli attuali chunk Docker di rilascio sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer provider.

OpenWebUI viene incorporato in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch specifici di OpenWebUI. Le lane di aggiornamento dei canali inclusi ritentano una volta per errori di rete npm transitori.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job chunk, mantenendo il debug delle lane non riuscite limitato a un unico job Docker mirato e preparando, scaricando o riusando l'artefatto del pacchetto per quella esecuzione; se una lane selezionata è una lane Docker live, il job mirato crea localmente l'immagine live-test per quella riesecuzione. I comandi GitHub generati per riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e input delle immagini preparate quando tali valori esistono, così una lane non riuscita può riusare il pacchetto e le immagini esatti dell'esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue quotidianamente l'intera suite Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch CI manuali autonomi tengono disattivata quella suite. Bilancia i test dei plugin inclusi su otto worker di estensione; questi job shard di estensione eseguono fino a due gruppi di configurazione plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di plugin con molti import non creano job CI aggiuntivi. Il percorso Docker prerelease solo per il rilascio raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con ambito intelligente. La parità agentica è annidata negli harness ampi di QA e rilascio, non in un workflow PR autonomo. Usare `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve viaggiare insieme a un'esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce la lane di parità mock, la lane live Matrix e le lane live Telegram e Discord come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di rilascio eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza dei modelli live e dal normale avvio dei provider-plugin. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate live model, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di rilascio, aggiungendo `--fail-fast` solo quando la CLI sottoposta a checkout lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ed `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per il rilascio prima dell'approvazione del rilascio; il suo gate di parità QA esegue i pacchetti candidato e baseline come job di lane paralleli, quindi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale della parità.

Per le PR normali, segui le prove di CI/check con ambito invece di trattare la parità come uno stato obbligatorio.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non una scansione completa del repository. Le esecuzioni di controllo giornaliere, manuali e per pull request non in bozza analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato, con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

Il controllo delle pull request resta leggero: parte solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. Android e macOS CodeQL restano fuori dai default delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Baseline di autenticazione, segreti, sandbox, cron e gateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei plugin di canale, gateway, Plugin SDK, segreti, punti di audit               |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core di policy SSRF, parsing IP, guardia di rete, web-fetch e Plugin SDK SSRF                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna in uscita e gate di esecuzione strumenti degli agenti                             |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di attendibilità per installazione Plugin, loader, manifest, registry, installazione tramite package manager, caricamento sorgenti e contratto pacchetto Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla sanity del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai default giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severità errore su superfici ristrette ad alto valore, sul runner Blacksmith Linux più piccolo. Il suo controllo per pull request è intenzionalmente più piccolo del profilo pianificato: le PR non in bozza eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche a codice di esecuzione di comandi/modelli/strumenti degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice di autenticazione/segreti/sandbox/sicurezza, runtime core dei canali e dei plugin di canale inclusi, protocollo/metodo server del gateway, runtime memoria/collante SDK, MCP/processi/consegna in uscita, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader plugin, contratto Plugin SDK/pacchetto o runtime risposte Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità per PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire un singolo shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza per autenticazione, segreti, sandbox, cron e gateway                                                                                       |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema della configurazione, migrazione, normalizzazione e IO                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei plugin di canale inclusi                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione comandi, dispatch modello/provider, dispatch e code di risposta automatica, e contratti runtime del piano di controllo ACP                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias Plugin SDK memoria, collante di attivazione runtime memoria e comandi doctor memoria                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda risposte, code di consegna sessione, helper di binding/consegna delle sessioni in uscita, superfici bundle eventi/log diagnostici e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch risposte in ingresso Plugin SDK, helper payload/chunking/runtime delle risposte, opzioni risposta canale, code di consegna e helper di binding sessione/thread     |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, autenticazione e discovery provider, registrazione runtime provider, default/cataloghi provider e registry web/search/fetch/embedding     |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI di controllo, persistenza locale, flussi di controllo gateway e contratti runtime del piano di controllo task                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime core per fetch/search web, IO media, comprensione media, generazione di immagini e generazione media                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registry, superficie pubblica ed entrypoint Plugin SDK                                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK lato pacchetto pubblicato e helper del contratto pacchetto plugin                                                                                       |

La qualità resta separata dalla sicurezza così che i finding di qualità possano essere pianificati, misurati, disabilitati o ampliati senza offuscare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e plugin inclusi dovrebbe essere aggiunta di nuovo come lavoro di follow-up con ambito o shard solo dopo che i profili ristretti hanno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere i documenti esistenti allineati con le modifiche approdate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni da workflow-run vengono saltate quando `main` è andato avanti o quando un'altra esecuzione Docs Agent non saltata è stata creata nell'ultima ora. Quando viene eseguito, rivede l'intervallo di commit dal precedente SHA sorgente Docs Agent non saltato fino al `main` corrente, così una singola esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sui documenti.

### Test Performance Agent

Il workflow `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita su push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel gate di attività giornaliero. La lane crea un report prestazionale Vitest raggruppato dell'intera suite, permette a Codex di apportare solo piccole correzioni prestazionali ai test preservando la copertura invece di ampi refactor, quindi riesegue il report dell'intera suite e rifiuta modifiche che riducono il conteggio baseline dei test passanti. Se la baseline ha test falliti, Codex può correggere solo errori ovvi e il report dell'intera suite dopo l'agente deve passare prima che venga committato qualcosa. Quando `main` avanza prima che il push del bot approdi, la lane ribasa la patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia dei duplicati dopo l'approdo. Il default è dry-run e chiude solo PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR approdata sia stata unita e che ogni duplicato abbia o un issue referenziato condiviso o hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di check locali e routing delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di check locale è più severo sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche di produzione core eseguono typecheck di produzione core e test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck dei test core più lint core;
- le modifiche di produzione alle estensioni eseguono typecheck di produzione estensioni e test estensioni più lint estensioni;
- le modifiche solo ai test delle estensioni eseguono typecheck dei test estensioni più lint estensioni;
- le modifiche al Plugin SDK pubblico o al contratto plugin si espandono al typecheck estensioni perché le estensioni dipendono da quei contratti core (le scansioni Vitest delle estensioni restano lavoro di test esplicito);
- gli incrementi di versione solo dei metadati di release eseguono check mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in sicurezza verso tutte le lane di check.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono i test stessi, le modifiche sorgente preferiscono mapping espliciti, poi test sibling e dipendenti nel grafo degli import. La configurazione condivisa di consegna per group-room è uno dei mapping espliciti: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test core delle risposte più regressioni di consegna Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sull'harness da rendere il set mappato economico un proxy non affidabile.

## Convalida Testbox

Esegui Testbox dalla radice del repo e preferisci una box appena riscaldata per prove ampie. Prima di usare un gate lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il controllo di sanità fallisce rapidamente quando file richiesti nella radice, come `pnpm-lock.yaml`, sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato di sincronizzazione remoto non è una copia affidabile della PR; arresta quella box e riscaldane una nuova invece di fare debug dell’errore del test del prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di sanità.

`pnpm testbox:run` termina anche un’invocazione locale della CLI Blacksmith che rimane nella fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella protezione, oppure usa un valore in millisecondi più grande per diff locali insolitamente grandi.

Crabbox è il wrapper di box remota di proprietà del repo per le prove Linux dei maintainer. Usalo quando un controllo è troppo ampio per un local loopback di modifica, quando conta la parità con la CI o quando la prova richiede segreti, Docker, lane di pacchetti, box riutilizzabili o log remoti. Il backend normale di OpenClaw è `blacksmith-testbox`; la capacità AWS/Hetzner di proprietà è un fallback per interruzioni di Blacksmith, problemi di quota o test espliciti su capacità di proprietà.

Prima di una prima esecuzione, controlla il wrapper dalla radice del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox obsoleto che non annuncia `blacksmith-testbox`. Passa il provider esplicitamente anche se `.crabbox.yaml` ha default owned-cloud.

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

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Le esecuzioni Crabbox one-shot basate su Blacksmith dovrebbero arrestare automaticamente Testbox; se un’esecuzione viene interrotta o la pulizia non è chiara, ispeziona le box live e arresta solo le box che hai creato:

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

Escala alla capacità Crabbox di proprietà solo quando Blacksmith non è disponibile, è limitato dalla quota, non ha l’ambiente necessario o la capacità di proprietà è esplicitamente l’obiettivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` possiede i default di provider, sincronizzazione e idratazione GitHub Actions per le lane owned-cloud. Esclude `.git` locale così il checkout Actions idratato mantiene i propri metadati Git remoti invece di sincronizzare remoti e object store locali del maintainer, ed esclude artefatti runtime/build locali che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione Node/pnpm, fetch di `origin/main` e passaggio dell’ambiente non segreto per i comandi owned-cloud `crabbox run --id <cbx_id>`.

## Correlati

- [Panoramica dell’installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
