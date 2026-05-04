---
read_when:
    - È necessario capire perché un job di CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della convalida del rilascio
    - Stai modificando l'invio di ClawSweeper o l'inoltro dell'attività GitHub
summary: Grafo dei processi CI, controlli di ambito, raggruppamenti di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-04T07:03:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e per ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo scoping intelligente e distribuiscono l'intero grafo per i candidati di rilascio e la validazione ampia. Le lane Android restano opt-in tramite `include_android`. La copertura Plugin riservata al rilascio si trova nel workflow separato [`Pre-rilascio Plugin`](#plugin-prerelease) e viene eseguita solo da [`Validazione completa del rilascio`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                      | Quando viene eseguito              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rileva modifiche solo ai documenti, scope modificati, estensioni modificate e genera il manifest CI        | Sempre su push e PR non draft      |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                        | Sempre su push e PR non draft      |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                               | Sempre su push e PR non draft      |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                                          | Sempre su push e PR non draft      |
| `check-dependencies`             | Passaggio Knip solo sulle dipendenze di produzione più guardia della allowlist dei file inutilizzati        | Modifiche rilevanti per Node       |
| `build-artifacts`                | Compila `dist/`, UI di controllo, controlli sugli artefatti compilati e artefatti downstream riutilizzabili | Modifiche rilevanti per Node       |
| `checks-fast-core`               | Lane rapide di correttezza Linux come controlli bundled/Plugin-contract/protocol                           | Modifiche rilevanti per Node       |
| `checks-fast-contracts-channels` | Controlli di contratto dei canali suddivisi in shard con un risultato aggregato stabile                    | Modifiche rilevanti per Node       |
| `checks-node-core-test`          | Shard dei test core Node, escludendo lane di canali, bundled, contratti ed estensioni                      | Modifiche rilevanti per Node       |
| `check`                          | Equivalente del gate locale principale suddiviso in shard: tipi prod, lint, guardie, tipi test e smoke rigoroso | Modifiche rilevanti per Node   |
| `check-additional`               | Architettura, drift boundary/prompt suddivisi in shard, guardie estensioni, boundary pacchetto e gateway watch | Modifiche rilevanti per Node   |
| `build-smoke`                    | Smoke test della CLI compilata e smoke della memoria di avvio                                              | Modifiche rilevanti per Node       |
| `checks`                         | Verificatore per i test canale sugli artefatti compilati                                                   | Modifiche rilevanti per Node       |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                            | Dispatch CI manuale per rilasci    |
| `check-docs`                     | Formattazione documenti, lint e controlli dei link interrotti                                              | Documenti modificati               |
| `skills-python`                  | Ruff + pytest per skills basate su Python                                                                  | Modifiche rilevanti per skill Python |
| `checks-windows`                 | Test specifici per processi/percorsi Windows più regressioni condivise degli specificatori di import runtime | Modifiche rilevanti per Windows  |
| `macos-node`                     | Lane di test TypeScript macOS usando gli artefatti compilati condivisi                                     | Modifiche rilevanti per macOS      |
| `macos-swift`                    | Swift lint, build e test per l'app macOS                                                                   | Modifiche rilevanti per macOS      |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                         | Modifiche rilevanti per Android    |
| `test-performance-agent`         | Ottimizzazione giornaliera Codex dei test lenti dopo attività attendibile                                  | Successo della CI principale o dispatch manuale |
| `openclaw-performance`           | Report giornalieri/on-demand sulle prestazioni runtime Kova con lane mock-provider, deep-profile e GPT 5.4 live | Dispatch pianificato e manuale |

## Ordine fail-fast

1. `preflight` decide quali lane esistono effettivamente. La logica `docs-scope` e `changed-scope` è composta da passaggi all'interno di questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artefatti e matrice piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumatori downstream possono iniziare appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime si distribuiscono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando un push più recente arriva sulla stessa PR o ref `main`. Trattalo come rumore della CI a meno che anche l'esecuzione più recente per la stessa ref stia fallendo. I controlli shard aggregati usano `!cancelled() && always()`, quindi segnalano comunque i normali fallimenti degli shard ma non si accodano dopo che l'intero workflow è già stato superato. La chiave di concorrenza CI automatica è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le nuove esecuzioni main. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Scope e routing

La logica di scope si trova in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa sì che il manifest preflight si comporti come se ogni area con scope fosse cambiata.

- **Le modifiche ai workflow CI** validano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, Android o macOS; queste lane piattaforma restano limitate alle modifiche del sorgente piattaforma.
- **Le modifiche solo al routing CI, alcune modifiche economiche a fixture dei core-test e modifiche strette a helper/test-routing dei contratti Plugin** usano un percorso manifest rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti canale, shard core completi, shard dei Plugin bundled e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper esercitate direttamente dal task rapido.
- **I controlli Node Windows** sono limitati a wrapper specifici per processi/percorsi Windows, helper di runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, Plugin, install-smoke e solo test restano sulle lane Node Linux.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti canale vengono eseguiti come tre shard ponderati, le lane core unit fast/support vengono eseguite separatamente, l'infrastruttura runtime core è divisa tra shard state e process/config, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentic gateway/server sono divise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti compilati. I test ampi di browser, QA, media e Plugin vari usano le rispettive configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard include-pattern registrano voci di timing usando il nome shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro di compile/canary package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; l'elenco delle guardie boundary è distribuito su quattro shard di matrice, ognuno esegue guardie indipendenti selezionate in parallelo e stampa i timing per controllo, incluso `pnpm prompt:snapshots:check`, così il drift dei prompt del percorso felice del runtime Codex viene fissato alla PR che lo ha causato. Gateway watch, test canale e shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

Android CI esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor di terze parti non ha un source set o manifest separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando però un job duplicato di packaging APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo sulle dipendenze di produzione, fissato all'ultima versione di Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al contempo superfici intenzionali di Plugin dinamici, generate, build, live-test e bridge di pacchetto che Knip non può risolvere staticamente.

## Inoltro attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall'attività del repository OpenClaw a ClawSweeper. Non esegue checkout né codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, quindi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di revisione di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o review quando presenti. Evita intenzionalmente di inoltrare il corpo completo del Webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sul hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel suo prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o operativamente utile. Aperture di routine, modifiche, churn di bot, rumore da Webhook duplicati e traffico di review normale dovrebbero risultare in `NO_REPLY`.

Tratta titoli, commenti, body, testo delle review, nomi di branch e messaggi di commit di GitHub come dati non attendibili lungo tutto questo percorso. Sono input per sintesi e triage, non istruzioni per il workflow o il runtime dell'agente.

## Dispatch manuali

I dispatch CI manuali eseguono lo stesso grafo di job della CI normale, ma forzano l’attivazione di ogni lane con ambito non Android: shard Linux Node, shard dei Plugin inclusi, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke test della build, controlli della documentazione, Skills Python, Windows, macOS e i18n della Control UI. I dispatch CI manuali autonomi eseguono solo Android con `include_android=true`; l’ombrello di rilascio completo abilita Android passando `include_android=true`. I controlli statici di pre-release dei Plugin, lo shard solo per release `agentic-plugins`, lo sweep completo in batch delle estensioni e le lane Docker di pre-release dei Plugin sono esclusi dalla CI. La suite Docker di pre-release viene eseguita solo quando `Full Release Validation` esegue il dispatch del workflow separato `Plugin Prerelease` con il gate di validazione del rilascio abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa per release candidate non viene annullata da un’altra esecuzione push o PR sullo stesso ref. L’input facoltativo `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, un tag o uno SHA di commit completo usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Esecutori

| Esecutore                         | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                    | `preflight`, job e aggregati di sicurezza rapidi (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratto/Plugin inclusi, controlli dei contratti dei canali suddivisi in shard, shard `check` tranne lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub, così la matrice Blacksmith può entrare in coda prima |
| `blacksmith-4vcpu-ubuntu-2404`    | `CodeQL Critical Quality`, shard delle estensioni a peso inferiore, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`    | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei Plugin inclusi, `android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`   | `check-lint` (abbastanza sensibile alla CPU perché 8 vCPU costassero più di quanto facessero risparmiare); build Docker install-smoke (il tempo in coda a 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025`  | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`   | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest`  | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

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

`OpenClaw Performance` è il workflow delle prestazioni di prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere eseguito manualmente tramite dispatch:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Il dispatch manuale misura normalmente il ref del workflow. Imposta `target_ref` per misurare un tag di rilascio o un altro branch con l’implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori più recenti sono indicizzati in base al ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref Kova, profilo, modalità di autenticazione della lane, modello, numero di ripetizioni e filtri degli scenari.

Il workflow installa OCM da una release fissata e Kova da `openclaw/Kova` all’input `kova_ref` fissato, quindi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova contro un runtime con build locale e autenticazione fittizia deterministica compatibile con OpenAI.
- `mock-deep-profile`: profilazione CPU/heap/trace per gli hotspot di avvio, Gateway e turni agente.
- `live-gpt54`: un turno agente OpenAI reale `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche probe sorgente nativi di OpenClaw dopo il passaggio Kova: tempi di avvio e memoria del Gateway nei casi di avvio predefinito, con hook e con 50 Plugin; cicli hello ripetuti con mock OpenAI `channel-chat-baseline`; e comandi di avvio CLI contro il Gateway avviato. Il riepilogo Markdown del probe sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artefatti GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow esegue anche il commit di `report.json`, `report.md`, bundle, `index.md` e artefatti del probe sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione Completa del Rilascio

`Full Release Validation` è il workflow ombrello manuale per “eseguire tutto prima del rilascio”. Accetta un branch, un tag o uno SHA di commit completo, esegue il dispatch del workflow manuale `CI` con quel target, esegue il dispatch di `Plugin Prerelease` per prove solo release di Plugin/pacchetti/statiche/Docker, ed esegue il dispatch di `OpenClaw Release Checks` per smoke test di installazione, accettazione pacchetto, suite del percorso di rilascio Docker, live/E2E, OpenWebUI, parità QA Lab, Matrix e lane Telegram. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l’artefatto `release-package-under-test` dai controlli di rilascio. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa lane del pacchetto Telegram contro il pacchetto npm pubblicato.

Consulta [Validazione completa del rilascio](/it/reference/full-release-validation) per la
matrice delle fasi, i nomi esatti dei job del workflow, le differenze tra profili, gli artefatti e
gli handle di riesecuzione mirata.

`OpenClaw Release Publish` è il workflow manuale mutante di rilascio. Eseguilo
da `release/YYYY.M.D` o `main` dopo che il tag di rilascio esiste e dopo che il
preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
esegue il dispatch di `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, esegue il dispatch di
`Plugin ClawHub Release` per lo stesso SHA di rilascio, e solo allora esegue il dispatch di
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per la prova di un commit fissato su un branch che si muove rapidamente, usa l’helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L’helper
pusha un branch temporaneo `release-ci/<sha>-...` allo SHA target,
esegue il dispatch di `Full Release Validation` da quel ref fissato, verifica che ogni
`headSha` del workflow figlio corrisponda al target ed elimina il branch temporaneo quando
l’esecuzione è completata. Il verificatore ombrello fallisce anche se un workflow figlio è stato eseguito a
uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di release. I
workflow di release manuali usano per impostazione predefinita `stable`; usa `full` solo quando
vuoi intenzionalmente l'ampia matrice consultiva di provider/media.

- `minimum` mantiene le lane OpenAI/core critiche per la release più rapide.
- `stable` aggiunge il set stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva di provider/media.

L'umbrella registra gli id delle esecuzioni child inviate e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni child e aggiunge tabelle dei job più lenti per ogni esecuzione child. Se un workflow child viene rieseguito e diventa verde, riesegui solo il job verifier parent per aggiornare il risultato umbrella e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di release, `ci` solo per il normale child CI completo, `plugin-prerelease` solo per il child di prerelease dei plugin, `release-checks` per ogni child di release, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'umbrella. Questo mantiene delimitata la riesecuzione di una release box non riuscita dopo una correzione mirata.

`OpenClaw Release Checks` usa il riferimento del workflow attendibile per risolvere una sola volta il riferimento selezionato in un tarball `release-package-under-test`, quindi passa quell'artefatto sia al workflow Docker live/E2E del percorso di release sia allo shard di accettazione del pacchetto. Questo mantiene coerenti i byte del pacchetto tra le release box ed evita di ricreare lo stesso candidato in più job child.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'umbrella precedente. Il monitor parent annulla qualsiasi workflow child che
ha già inviato quando il parent viene annullato, quindi una validazione main più recente
non resta in attesa dietro a un'esecuzione stale di due ore dei controlli di release. La validazione
di branch/tag di release e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il child live/E2E di release mantiene un'ampia copertura nativa `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece che come un job seriale:

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
- shard media audio/video divisi e shard music filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più facile rieseguire e diagnosticare gli errori lenti dei provider live. I nomi aggregati degli shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali singole.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, generato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima del setup. Mantieni le suite live supportate da Docker sui normali runner Blacksmith — i job container non sono il posto giusto per avviare test Docker annidati.

Gli shard live modello/backend supportati da Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit selezionato. Il workflow live di release genera e pubblica quell'immagine una volta, poi gli shard Docker live model, Gateway sharded per provider, backend CLI, ACP bind e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway portano limiti `timeout` espliciti a livello di script sotto il timeout del job del workflow, così un container o un percorso di cleanup bloccato fallisce rapidamente invece di consumare l'intero budget dei controlli di release. Se questi shard ricreano in modo indipendente il target Docker completo dei sorgenti, l'esecuzione di release è configurata male e sprecherà tempo reale in build duplicate dell'immagine.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale valida l'albero dei sorgenti, mentre l'accettazione del pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato di pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa sorgente, riferimento del workflow, riferimento del pacchetto, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara le immagini Docker package-digest quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una volta, poi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama opzionalmente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; un invio Telegram standalone può ancora installare una spec npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram opzionale non sono riuscite.

### Sorgenti candidate

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di release OpenClaw esatta come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione di prerelease/stable pubblicate.
- `source=ref` impacchetta un branch, tag o SHA completo di commit `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di release, installa le dipendenze in un worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è opzionale ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile del workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire logica di workflow vecchia.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk Docker completi del percorso di release con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura offline dei plugin, così la validazione dei pacchetti pubblicati non dipende dalla disponibilità live di ClawHub. La lane Telegram opzionale riutilizza l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della spec npm pubblicata per gli invii standalone.

Per la policy dedicata di aggiornamento e test dei plugin, inclusi comandi locali,
lane Docker, input di Package Acceptance, valori predefiniti di release e triage degli errori,
vedi [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins).

I controlli di release chiamano Package Acceptance con `source=artifact`, l'artefatto del pacchetto di release preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Questo mantiene le prove di migrazione del pacchetto, aggiornamento, cleanup delle dipendenze stale dei plugin, riparazione dell'installazione dei plugin configurati, plugin offline, aggiornamento plugin e Telegram sullo stesso tarball di pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire quella stessa matrice contro un pacchetto npm già distribuito invece che contro l'artefatto generato dallo SHA. I controlli di release cross-OS coprono ancora onboarding, installer e comportamento di piattaforma specifici del sistema operativo; la validazione di prodotto package/update dovrebbe iniziare con Package Acceptance. La lane Docker `published-upgrade-survivor` valida un baseline di pacchetto pubblicato per esecuzione. In Package Acceptance, il tarball risolto `package-under-test` è sempre il candidato e `published_upgrade_survivor_baseline` seleziona il baseline pubblicato di fallback, con valore predefinito `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quel baseline. Imposta `published_upgrade_survivor_baselines=all-since-2026.4.23` per espandere la CI Full Release su ogni release npm stable da `2026.4.23` fino a `latest`; `release-history` resta disponibile per un campionamento manuale più ampio con l'ancora pre-data precedente. Imposta `published_upgrade_survivor_scenarios=reported-issues` per espandere gli stessi baseline su fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di plugin OpenClaw configurati, percorsi di log con tilde e root di dipendenze di plugin legacy stale. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda è il cleanup esaustivo degli aggiornamenti pubblicati, non l'ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare spec di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura il baseline con una ricetta di comando `openclaw config set` incorporata, registra gli step della ricetta in `summary.json` e sonda `/healthz`, `/readyz`, più lo stato RPC dopo l'avvio del Gateway. Le lane fresh per pacchetto e installer Windows verificano anche che un pacchetto installato possa importare un override di browser-control da un percorso Windows assoluto raw. Lo smoke agent-turn cross-OS OpenAI usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando valori predefiniti GPT-4.x.

### Finestre di compatibilità legacy

Package Acceptance ha finestre limitate di compatibilità legacy per i pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- le voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare i `pnpm.patchedDependencies` mancanti dalla fixture git finta derivata dal tarball e può registrare nel log `update.channel` persistente mancante;
- gli smoke dei plugin possono leggere posizioni legacy degli install-record o accettare la persistenza mancante degli install-record del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur richiedendo ancora che il record di installazione e il comportamento no-reinstall restino invariati.

Il pacchetto pubblicato `2026.4.26` può anche avvisare per file di stamp dei metadati di build locale che erano già stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di avvisare o saltare.

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

Quando esegui il debug di un'esecuzione di accettazione del pacchetto non riuscita, inizia dal riepilogo `resolve_package` per confermare origine, versione e SHA-256 del pacchetto. Poi ispeziona l'esecuzione figlia `docker_acceptance` e i relativi artifact Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo del pacchetto non riuscito o le lane Docker esatte invece di rieseguire la validazione completa della release.

## Smoke di installazione

Il workflow separato `Install Smoke` riutilizza lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke tra `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest di Plugin in bundle, oppure superfici core Plugin/canale/Gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche solo al sorgente dei Plugin in bundle, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido compila una volta l'immagine Dockerfile root, controlla la CLI, esegue lo smoke CLI di eliminazione agenti per workspace condiviso, esegue l'e2e del Gateway di rete del container, verifica un argomento di build di un'estensione in bundle ed esegue il profilo Docker limitato dei Plugin in bundle sotto un timeout aggregato del comando di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- **Percorso completo** mantiene la copertura di installazione del pacchetto QR e Docker/update dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di release tramite workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riutilizza un'immagine smoke GHCR del Dockerfile root per lo SHA target, poi esegue installazione del pacchetto QR, smoke del Dockerfile root/Gateway, smoke installer/update e l'E2E Docker rapido dei Plugin in bundle come job separati, così il lavoro sull'installer non attende gli smoke dell'immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica dell'ambito modificato richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di release.

Lo smoke lento del provider di immagini con installazione globale Bun è regolato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila un'immagine live-test condivisa, pacchettizza OpenClaw una volta come tarball npm e compila due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git essenziale per lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per lane normali.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool finale sensibile ai provider.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti per evitare throttling dei provider.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane di installazione npm concorrenti.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra avvii di lane per evitare tempeste di creazione del daemon Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/finali selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset       | `1` stampa il piano dello scheduler senza eseguire lane.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset       | Elenco esatto di lane separato da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una singola lane non riuscita. |

Una lane più pesante del proprio limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. I preflight aggregati locali controllano Docker, rimuovono container E2E OpenClaw obsoleti, emettono lo stato delle lane attive, persistono i tempi delle lane per l'ordinamento dalla più lunga alla più breve e, per impostazione predefinita, smettono di pianificare nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale pacchetto, tipo di immagine, immagine live, lane e copertura credenziali sono richiesti. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Pacchettizza OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artifact di pacchetto dell'esecuzione corrente oppure scarica un artifact di pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; compila e invia immagini Docker E2E bare/funzionali GHCR taggate con digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riutilizza input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini con digest di pacchetto esistenti invece di ricompilare. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico CI.

### Chunk del percorso di release

La copertura Docker di release esegue job suddivisi in chunk più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Gli attuali chunk Docker di release sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch esclusivi di OpenWebUI. Le lane di aggiornamento dei canali in bundle ritentano una volta in caso di errori di rete npm transitori.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job a chunk, mantenendo il debug delle lane non riuscite limitato a un solo job Docker mirato e preparando, scaricando o riutilizzando l'artifact del pacchetto per quella esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine live-test per quella riesecuzione. I comandi GitHub di riesecuzione generati per lane includono `package_artifact_run_id`, `package_artifact_name` e input delle immagini preparate quando tali valori esistono, così una lane non riuscita può riutilizzare esattamente pacchetto e immagini dell'esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue quotidianamente la suite Docker release-path completa.

## Prerelease Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch CI manuali autonomi mantengono disattivata quella suite. Bilancia i test dei Plugin in bundle su otto worker di estensione; quei job shard di estensione eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di Plugin con molti import non creano job CI aggiuntivi. Il percorso prerelease Docker solo per release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con smart-scope. La parità agentica è annidata negli harness ampi di QA e release, non in un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve viaggiare con un'esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce la lane di parità mock, la lane Matrix live e le lane Telegram e Discord live come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza dei modelli live e dal normale avvio del Plugin provider. Il Gateway di trasporto live disabilita la ricerca memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pacchetti candidate e baseline come job lane paralleli, poi scarica entrambi gli artifact in un piccolo job di report per il confronto finale di parità.

Per PR normali, segui le prove CI/check con ambito invece di trattare la parità come uno stato richiesto.

## CodeQL

Il flusso di lavoro `CodeQL` è intenzionalmente uno scanner di sicurezza iniziale e ristretto, non una scansione completa del repository. Le esecuzioni giornaliere, manuali e di protezione delle pull request non in bozza analizzano il codice dei flussi di lavoro Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La protezione per le pull request resta leggera: si avvia solo per modifiche in `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del flusso di lavoro pianificato. Android e macOS CodeQL restano esclusi dalle impostazioni predefinite delle PR.

### Categorie di sicurezza

| Categoria                                        | Superficie                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segreti, sandbox, Cron e baseline del Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei Plugin di canale, Gateway, Plugin SDK, segreti, punti di contatto di audit |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core SSRF, parsing IP, protezione di rete, web-fetch e policy SSRF del Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione processi, consegna in uscita e gate di esecuzione strumenti degli agenti                           |
| `/codeql-security-high/plugin-trust-boundary`     | Installazione Plugin, loader, manifest, registry, installazione del package manager, caricamento sorgenti e superfici di fiducia del contratto package del Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dal controllo di sanità del flusso di lavoro. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra dai SARIF caricati i risultati di compilazione delle dipendenze e carica sotto `/codeql-critical-security/macos`. Mantenuto fuori dalle impostazioni predefinite giornaliere perché la build macOS domina il tempo di esecuzione anche quando è pulita.

### Categorie Critical Quality

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript con gravità errore e non di sicurezza su superfici ristrette ad alto valore, sul runner Blacksmith Linux più piccolo. La sua protezione per le pull request è intenzionalmente più piccola del profilo pianificato: le PR non in bozza eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione comandi/modelli/strumenti degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice di auth/segreti/sandbox/sicurezza, runtime core dei canali e dei Plugin di canale inclusi, protocollo Gateway/metodi server, runtime memoria/collante SDK, consegna MCP/processi/in uscita, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader Plugin, Plugin SDK/contratto package o runtime di risposta del Plugin SDK. Le modifiche alla configurazione CodeQL e al flusso di lavoro di qualità eseguono tutti e dodici gli shard qualità delle PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard qualità in isolamento.

| Categoria                                              | Superficie                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza di auth, segreti, sandbox, Cron e Gateway                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Schema di configurazione, migrazione, normalizzazione e contratti IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale inclusi                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione comandi, dispatch modelli/provider, dispatch e code di risposta automatica e contratti runtime del control-plane ACP                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge strumenti, helper di supervisione processi e contratti di consegna in uscita                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facciate runtime memoria, alias memoria del Plugin SDK, collante di attivazione runtime memoria e comandi doctor della memoria                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda risposte, code di consegna sessione, helper di binding/consegna sessione in uscita, superfici bundle eventi/log diagnostici e contratti CLI doctor di sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch risposte in ingresso del Plugin SDK, helper di payload/chunking/runtime delle risposte, opzioni di risposta canale, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, auth e discovery provider, registrazione runtime provider, default/cataloghi provider e registry web/ricerca/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap della UI di controllo, persistenza locale, flussi di controllo del Gateway e contratti runtime del control-plane dei task                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/ricerca web core, IO media, comprensione media, generazione immagini e contratti runtime di generazione media                                                |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, superficie pubblica e contratti degli entrypoint del Plugin SDK                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK lato package pubblicato e helper del contratto package dei plugin                                                                              |

La qualità resta separata dalla sicurezza così i risultati di qualità possono essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere riaggiunta come lavoro successivo con scope o shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Flussi di lavoro di manutenzione

### Docs Agent

Il flusso di lavoro `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche approdate di recente. Non ha una pianificazione pura: una run CI riuscita su push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni da workflow-run vengono saltate quando `main` è avanzato o quando un'altra run `Docs Agent` non saltata è stata creata nell'ultima ora. Quando viene eseguito, rivede l'intervallo di commit dal precedente SHA sorgente non saltato di `Docs Agent` all'attuale `main`, quindi una run oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sulla documentazione.

### Test Performance Agent

Il flusso di lavoro `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: una run CI riuscita su push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione da workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliero. La lane crea un report prestazionale Vitest raggruppato dell'intera suite, consente a Codex di apportare solo piccole correzioni prestazionali ai test preservando la copertura invece di refactor ampi, quindi riesegue il report dell'intera suite e rifiuta modifiche che riducono il conteggio baseline dei test passati. Se la baseline ha test falliti, Codex può correggere solo fallimenti ovvi e il report dell'intera suite dopo l'agente deve passare prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot approdi, la lane esegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo dell'agente docs.

### PR duplicate dopo il merge

Il flusso di lavoro `Duplicate PRs After Merge` è un flusso di lavoro manuale per manutentori per la pulizia dei duplicati dopo l'approdo. Per impostazione predefinita è in dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR approdata sia stata mergiata e che ogni duplicato abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto allo scope ampio della piattaforma CI:

- le modifiche di produzione core eseguono typecheck core prod e core test più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck core test più lint core;
- le modifiche di produzione extension eseguono typecheck extension prod e extension test più lint extension;
- le modifiche solo ai test extension eseguono typecheck extension test più lint extension;
- le modifiche pubbliche al Plugin SDK o al contratto plugin si espandono al typecheck extension perché le extension dipendono da quei contratti core (le scansioni Vitest delle extension restano lavoro di test esplicito);
- i bump di versione solo di metadati di release eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro su tutte le lane di controllo.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono sé stesse, le modifiche ai sorgenti preferiscono mapping espliciti, poi test sibling e dipendenti dell'import graph. La configurazione condivisa di consegna nelle group-room è uno dei mapping espliciti: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema del message-tool passano attraverso i test core delle risposte più le regressioni di consegna Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica riguarda l'intero harness al punto che l'insieme mappato economico non è un proxy affidabile.

## Validazione Testbox

Esegui Testbox dalla radice del repo e preferisci un box riscaldato nuovo per prove ampie. Prima di spendere un gate lento su un box riutilizzato, scaduto o che ha appena segnalato una sincronizzazione insolitamente grande, esegui prima `pnpm testbox:sanity` dentro il box.

Il controllo di sanità fallisce rapidamente quando file radice obbligatori come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato della sincronizzazione remota non è una copia affidabile della PR; arresta quel box e riscaldane uno nuovo invece di eseguire il debug dell'errore del test di prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di sanità.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output successivo alla sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella protezione, oppure usa un valore in millisecondi più grande per diff locali insolitamente grandi.

Crabbox è il wrapper per box remoti di proprietà del repo per le prove Linux dei maintainer. Usalo quando un controllo è troppo ampio per un ciclo di modifica locale, quando la parità con la CI è importante, o quando la prova richiede segreti, Docker, lane di pacchetti, box riutilizzabili o log remoti. Il backend OpenClaw normale è `blacksmith-testbox`; la capacità AWS/Hetzner di proprietà è un fallback per interruzioni di Blacksmith, problemi di quota o test espliciti su capacità di proprietà.

Prima di una prima esecuzione, controlla il wrapper dalla radice del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox obsoleto che non dichiara `blacksmith-testbox`. Passa il provider esplicitamente anche se `.crabbox.yaml` ha valori predefiniti owned-cloud.

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

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Le esecuzioni Crabbox one-shot supportate da Blacksmith dovrebbero arrestare automaticamente il Testbox; se un'esecuzione viene interrotta o la pulizia non è chiara, ispeziona i box live e arresta solo i box che hai creato:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Usa il riutilizzo solo quando hai intenzionalmente bisogno di più comandi sullo stesso box idratato:

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

Passa alla capacità Crabbox di proprietà solo quando Blacksmith non è disponibile, è limitato dalla quota, non ha l'ambiente necessario, oppure la capacità di proprietà è esplicitamente l'obiettivo:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` possiede i valori predefiniti di provider, sincronizzazione e idratazione GitHub Actions per le lane owned-cloud. Esclude `.git` locale, così il checkout Actions idratato conserva i propri metadati Git remoti invece di sincronizzare remote e object store locali del maintainer, ed esclude artefatti runtime/build locali che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione di Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto per i comandi owned-cloud `crabbox run --id <cbx_id>`.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
