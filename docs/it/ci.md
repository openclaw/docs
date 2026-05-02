---
read_when:
    - Devi capire perché un job di CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
    - Stai modificando l'invio di ClawSweeper o l'inoltro dell'attività GitHub
summary: Grafo dei job CI, gate di ambito, umbrella di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-02T20:42:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e per ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo scoping intelligente e distribuiscono l'intero grafo per release candidate e validazioni ampie. Le lane Android restano opt-in tramite `include_android`. La copertura dei plugin solo per le release vive nel workflow separato [`Plugin Prerelease`](#plugin-prerelease) e viene eseguita solo da [`Full Release Validation`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                     | Quando viene eseguito              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rileva modifiche solo ai documenti, ambiti modificati, estensioni modificate e crea il manifesto CI       | Sempre su push e PR non in bozza   |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                       | Sempre su push e PR non in bozza   |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli avvisi npm                                | Sempre su push e PR non in bozza   |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                                         | Sempre su push e PR non in bozza   |
| `check-dependencies`             | Passaggio Knip solo per dipendenze di produzione più guardia dell'allowlist dei file inutilizzati         | Modifiche rilevanti per Node       |
| `build-artifacts`                | Crea `dist/`, Control UI, controlli sugli artefatti compilati e artefatti riutilizzabili a valle          | Modifiche rilevanti per Node       |
| `checks-fast-core`               | Lane rapide di correttezza Linux come controlli bundled/plugin-contract/protocol                          | Modifiche rilevanti per Node       |
| `checks-fast-contracts-channels` | Controlli di contratto dei canali shardati con un risultato di controllo aggregato stabile                | Modifiche rilevanti per Node       |
| `checks-node-core-test`          | Shard dei test core Node, escluse le lane canali, bundled, contratti ed estensioni                        | Modifiche rilevanti per Node       |
| `check`                          | Equivalente shardato del gate locale principale: tipi prod, lint, guardie, tipi test e smoke rigoroso     | Modifiche rilevanti per Node       |
| `check-additional`               | Shard di architettura, confini, guardie delle superfici di estensione, confini package e gateway-watch    | Modifiche rilevanti per Node       |
| `build-smoke`                    | Smoke test della CLI compilata e smoke della memoria all'avvio                                            | Modifiche rilevanti per Node       |
| `checks`                         | Verificatore per i test dei canali sugli artefatti compilati                                              | Modifiche rilevanti per Node       |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                           | Dispatch CI manuale per release    |
| `check-docs`                     | Formattazione, lint e controlli dei link interrotti della documentazione                                  | Documentazione modificata          |
| `skills-python`                  | Ruff + pytest per skills basate su Python                                                                 | Modifiche rilevanti per skill Python |
| `checks-windows`                 | Test specifici per processi/percorsi Windows più regressioni condivise degli specificatori di import runtime | Modifiche rilevanti per Windows |
| `macos-node`                     | Lane di test TypeScript macOS usando gli artefatti compilati condivisi                                    | Modifiche rilevanti per macOS      |
| `macos-swift`                    | Swift lint, build e test per l'app macOS                                                                  | Modifiche rilevanti per macOS      |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                        | Modifiche rilevanti per Android    |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                 | Successo CI su main o dispatch manuale |
| `openclaw-performance`           | Report giornalieri/on-demand sulle prestazioni runtime Kova con lane mock-provider, deep-profile e GPT 5.4 live | Dispatch pianificato e manuale |

## Ordine fail-fast

1. `preflight` decide quali lane esistono. La logica `docs-scope` e `changed-scope` è composta da passaggi dentro questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice di artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer a valle possono iniziare non appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime si distribuiscono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando un push più recente arriva sulla stessa PR o ref `main`. Consideralo rumore della CI, a meno che anche l'esecuzione più recente per la stessa ref non stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()`, quindi riportano comunque i normali fallimenti degli shard ma non vengono accodati dopo che l'intero workflow è già stato superato. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni main più recenti. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Ambito e routing

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifesto preflight come se ogni area con ambito fosse cambiata.

- **Le modifiche ai workflow CI** validano il grafo CI Node più il linting dei workflow, ma non forzano da sole le build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche al codice sorgente di piattaforma.
- **Le modifiche solo al routing CI, alcune modifiche economiche a fixture di core-test e modifiche ristrette a helper/test-routing dei contratti plugin** usano un percorso rapido del manifesto solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei plugin bundled e matrici di guardia aggiuntive quando la modifica è limitata alle superfici di routing o helper che il task rapido esercita direttamente.
- **I controlli Windows Node** sono limitati a wrapper specifici Windows per processi/percorsi, helper runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a codice sorgente, plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard ponderati, le piccole lane unit core sono accoppiate, auto-reply viene eseguito come quattro worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing), e le configurazioni agentiche gateway/plugin sono distribuite tra i job Node agentici solo sorgente esistenti invece di attendere gli artefatti compilati. Test ampi di browser, QA, media e plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all plugin condiviso. Gli shard con include-pattern registrano voci di timing usando il nome shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro di compilazione/canary sui confini dei package e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard della guardia dei confini esegue le sue piccole guardie indipendenti in parallelo dentro un singolo job. Gateway watch, test dei canali e shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor di terze parti non ha source set o manifest separati; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando al tempo stesso un job duplicato di packaging dell'APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo per dipendenze di produzione fissato all'ultima versione di Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce obsoleta nell'allowlist, preservando al tempo stesso superfici intenzionali di plugin dinamici, generazione, build, live-test e bridge package che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall'attività del repository OpenClaw a ClawSweeper. Non esegue il checkout né codice non attendibile delle pull request. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, poi invia payload compatti `repository_dispatch` a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste di revisione esatte di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di revisione a livello commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o revisioni quando presenti. Evita intenzionalmente di inoltrare l'intero corpo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sull'hook Gateway OpenClaw per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o utile operativamente. Aperture di routine, modifiche, churn dei bot, rumore da webhook duplicati e normale traffico di review dovrebbero produrre `NO_REPLY`.

Tratta titoli, commenti, corpi, testo delle review, nomi dei branch e messaggi di commit GitHub come dati non attendibili lungo tutto questo percorso. Sono input per riepilogo e triage, non istruzioni per il workflow o il runtime dell'agente.

## Dispatch manuali

Le esecuzioni CI manuali eseguono lo stesso grafo di job della CI normale, ma forzano l'attivazione di ogni lane con ambito non Android: shard Linux Node, shard dei Plugin integrati, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, build smoke, controlli della documentazione, Skills Python, Windows, macOS e i18n della Control UI. Le esecuzioni CI manuali autonome eseguono solo Android con `include_android=true`; l'ombrello di rilascio completo abilita Android passando `include_android=true`. I controlli statici di prerelease dei Plugin, lo shard solo release `agentic-plugins`, la scansione batch completa delle estensioni e le lane Docker di prerelease dei Plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` invia il workflow separato `Plugin Prerelease` con il gate di validazione del rilascio abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, quindi una suite completa release-candidate non viene annullata da un'altra esecuzione push o PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante fidato di eseguire quel grafo su un branch, un tag o uno SHA di commit completo usando il file di workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Esecutori

| Esecutore                        | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza rapidi (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratto/integrati, controlli dei contratti dei canali suddivisi in shard, shard di `check` tranne lint, shard e aggregati di `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; il preflight install-smoke usa anche Ubuntu ospitato da GitHub così la matrice Blacksmith può mettersi in coda prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard delle estensioni più leggeri, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei Plugin integrati, `android`                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU che 8 vCPU costavano più di quanto facessero risparmiare); build Docker install-smoke (il tempo di coda da 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
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

`OpenClaw Performance` è il workflow di prestazioni del prodotto/runtime. Viene eseguito ogni giorno su `main` e può essere inviato manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Il workflow installa OCM da una release fissata e Kova dall'input `kova_ref` fissato, quindi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova su un runtime con build locale e autenticazione finta compatibile con OpenAI deterministica.
- `mock-deep-profile`: profiling CPU/heap/trace per hotspot di avvio, gateway e turno agente.
- `live-gpt54`: un turno agente OpenAI reale `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche probe sorgente nativi di OpenClaw dopo il passaggio Kova: timing di avvio e memoria del Gateway nei casi di avvio predefinito, hook e con 50 Plugin; cicli hello ripetuti mock-OpenAI `channel-chat-baseline`; e comandi di avvio CLI contro il Gateway avviato. Il riepilogo Markdown dei probe sorgente si trova in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artefatti GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow esegue anche il commit di `report.json`, `report.md`, bundle, `index.md` e artefatti dei probe sorgente in `openclaw/clawgrit-reports` sotto `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Il puntatore al branch corrente viene scritto come `openclaw-performance/<ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` è il workflow ombrello manuale per "eseguire tutto prima del rilascio". Accetta un branch, un tag o uno SHA di commit completo, invia il workflow manuale `CI` con quel target, invia `Plugin Prerelease` per le prove solo release di Plugin/pacchetti/statiche/Docker e invia `OpenClaw Release Checks` per install smoke, accettazione dei pacchetti, suite del percorso di rilascio Docker, live/E2E, OpenWebUI, parità QA Lab, Matrix e lane Telegram. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l'artefatto `release-package-under-test` dai controlli di rilascio. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa lane del pacchetto Telegram contro il pacchetto npm pubblicato.

Vedi [Validazione del rilascio completa](/it/reference/full-release-validation) per la
matrice delle fasi, i nomi esatti dei job del workflow, le differenze tra profili, gli artefatti e
gli handle di riesecuzione mirati.

`OpenClaw Release Publish` è il workflow di rilascio mutante manuale. Invialo
da `release/YYYY.M.D` o `main` dopo che il tag di rilascio esiste e dopo che il
preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
invia `Plugin NPM Release` per tutti i pacchetti Plugin pubblicabili, invia
`Plugin ClawHub Release` per lo stesso SHA di rilascio e solo allora invia
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per la prova di commit fissato su un branch che si muove rapidamente, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere branch o tag, non SHA di commit grezzi. L'helper
esegue il push di un branch temporaneo `release-ci/<sha>-...` allo SHA target,
invia `Full Release Validation` da quel ref fissato, verifica che ogni `headSha`
dei workflow figli corrisponda al target ed elimina il branch temporaneo quando
l'esecuzione completa. Il verificatore ombrello fallisce anche se un workflow figlio è stato eseguito a uno
SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di rilascio. I
workflow di rilascio manuali usano per impostazione predefinita `stable`; usa `full` solo quando
vuoi intenzionalmente la matrice ampia di provider/media consultiva.

- `minimum` mantiene le lane OpenAI/core critiche per il rilascio più rapide.
- `stable` aggiunge il set stabile di provider/backend.
- `full` esegue la matrice ampia di provider/media consultiva.

L'ombrello registra gli ID delle esecuzioni figlie inviate e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease del plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull’ombrello. Questo mantiene delimitata la riesecuzione di una macchina di rilascio non riuscita dopo una correzione mirata.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere una sola volta il ref selezionato in un tarball `release-package-under-test`, quindi passa quell’artefatto sia al workflow Docker live/E2E del percorso di rilascio sia allo shard di accettazione del pacchetto. Questo mantiene coerenti i byte del pacchetto tra le macchine di rilascio ed evita di ricreare lo stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l’ombrello più vecchio. Il monitor padre annulla qualsiasi workflow figlio che
ha già inviato quando il padre viene annullato, quindi la validazione più recente di main
non resta in attesa dietro una vecchia esecuzione di release-check di due ore. La validazione
di branch/tag di rilascio e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E del rilascio mantiene un’ampia copertura nativa di `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece che come un unico job seriale:

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
- shard audio/video multimediali separati e shard musicali filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più facile rieseguire e diagnosticare gli errori lenti dei provider live. I nomi degli shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali singole.

Gli shard multimediali live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell’immagine preinstalla `ffmpeg` e `ffprobe`; i job multimediali verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith — i job container non sono il posto adatto per avviare test Docker annidati.

Gli shard live di modelli/backend basati su Docker usano un’immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow live di rilascio crea e pubblica quell’immagine una sola volta, quindi gli shard del modello live Docker, del Gateway diviso per provider, del backend CLI, del binding ACP e dell’harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway includono limiti espliciti di `timeout` a livello di script inferiori al timeout del job del workflow, così un container bloccato o un percorso di pulizia si interrompe rapidamente invece di consumare l’intero budget dei release-check. Se quegli shard ricreano indipendentemente il target Docker completo dai sorgenti, l’esecuzione di rilascio è configurata in modo errato e sprecherà tempo su build di immagini duplicate.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è “questo pacchetto OpenClaw installabile funziona come prodotto?”. È diverso dalla normale CI: la CI normale valida l’albero dei sorgenti, mentre l’accettazione del pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l’installazione o l’aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa sorgente, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell’artefatto, valida l’inventario del tarball, prepara le immagini Docker con digest del pacchetto quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, quindi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; l’invio Telegram autonomo può comunque installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l’accettazione Docker o la lane Telegram facoltativa sono fallite.

### Sorgenti candidate

- `source=npm` accetta solo `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw come `openclaw@2026.4.27-beta.2`. Usalo per l’accettazione di prerelease/stabili pubblicate.
- `source=ref` impacchetta un branch, tag o SHA di commit completo `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in un worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile del workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all’harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire vecchia logica di workflow.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocchi completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura offline dei plugin, quindi la validazione del pacchetto pubblicato non dipende dalla disponibilità live di ClawHub. La lane Telegram facoltativa riusa l’artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per gli invii autonomi.

Per la policy dedicata di test di aggiornamenti e plugin, inclusi comandi locali,
lane Docker, input di Package Acceptance, valori predefiniti di rilascio e triage degli errori,
vedi [Testare aggiornamenti e plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Package Acceptance con `source=artifact`, l’artefatto del pacchetto di rilascio preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Questo mantiene la prova di migrazione del pacchetto, aggiornamento, pulizia delle dipendenze obsolete dei plugin, riparazione dell’installazione di plugin configurati, plugin offline, aggiornamento dei plugin e Telegram sullo stesso tarball di pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire la stessa matrice contro un pacchetto npm già distribuito invece dell’artefatto costruito dallo SHA. I controlli di rilascio cross-OS coprono ancora onboarding, installer e comportamento di piattaforma specifici del sistema operativo; la validazione prodotto di pacchetto/aggiornamento dovrebbe iniziare con Package Acceptance. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione. In Package Acceptance, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con valore predefinito `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Imposta `published_upgrade_survivor_baselines=all-since-2026.4.23` per espandere la CI Full Release su ogni rilascio npm stabile da `2026.4.23` fino a `latest`; `release-history` resta disponibile per un campionamento manuale più ampio con il vecchio ancoraggio precedente alla data. Imposta `published_upgrade_survivor_scenarios=reported-issues` per espandere le stesse baseline su fixture simili a issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di plugin OpenClaw configurati, percorsi di log con tilde e radici di dipendenze legacy obsolete dei plugin. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda la pulizia esaustiva degli aggiornamenti pubblicati, non l’ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare specifiche di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e sonda `/healthz`, `/readyz` più lo stato RPC dopo l’avvio del Gateway. Le lane Windows per pacchetto e nuova installazione verificano anche che un pacchetto installato possa importare un override di browser-control da un percorso Windows assoluto grezzo. Lo smoke del turno agente OpenAI cross-OS usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando i default GPT-4.x.

### Finestre di compatibilità legacy

Package Acceptance ha finestre delimitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può rimuovere `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e può registrare `update.channel` persistente mancante;
- gli smoke dei plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur richiedendo che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto `2026.4.26` pubblicato può anche generare avvisi per file di stampo dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare avvisi o essere saltate.

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

Quando esegui il debug di un'esecuzione di accettazione del pacchetto non riuscita, parti dal riepilogo `resolve_package` per confermare l'origine del pacchetto, la versione e lo SHA-256. Quindi ispeziona l'esecuzione figlia `docker_acceptance` e i relativi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, i log delle lane, i tempi delle fasi e i comandi di riesecuzione. Preferisci rieseguire il profilo del pacchetto non riuscito o le lane Docker esatte invece di rieseguire la validazione completa della release.

## Smoke di installazione

Il workflow separato `Install Smoke` riutilizza lo stesso script di ambito tramite il proprio job `preflight`. Suddivide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest di Plugin in bundle o superfici core di Plugin/canale/Gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche solo al sorgente dei Plugin in bundle, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido crea una volta l'immagine del Dockerfile radice, controlla la CLI, esegue lo smoke CLI di eliminazione degli agenti per lo spazio di lavoro condiviso, esegue l'e2e gateway-network del container, verifica un argomento di build di un'estensione in bundle ed esegue il profilo Docker limitato dei Plugin in bundle entro un timeout aggregato del comando di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- **Percorso completo** mantiene l'installazione del pacchetto QR e la copertura Docker/update dell'installer per le esecuzioni notturne programmate, gli avvii manuali, i controlli di release tramite workflow-call e le pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riutilizza una singola immagine smoke GHCR del Dockerfile radice per lo SHA di destinazione, quindi esegue l'installazione del pacchetto QR, gli smoke del Dockerfile radice/Gateway, gli smoke installer/update e l'E2E Docker rapido dei Plugin in bundle come job separati, così il lavoro dell'installer non attende dietro agli smoke dell'immagine radice.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica dell'ambito delle modifiche richiederebbe la copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di release.

Lo smoke lento Bun di installazione globale image-provider è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e gli avvii manuali di `Install Smoke` possono abilitarlo esplicitamente, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precostruisce una singola immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e crea due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git minimale per le lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normale.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, quindi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                                 |
| -------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool di coda sensibile ai provider.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti per evitare che i provider applichino throttling.                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane di installazione npm concorrenti.                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra gli avvii delle lane per evitare tempeste di creazione del demone Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); le lane live/di coda selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset       | `1` stampa il piano dello scheduler senza eseguire le lane.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset       | Elenco esatto di lane separato da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. Il preflight aggregato locale controlla Docker, rimuove i container OpenClaw E2E obsoleti, emette lo stato delle lane attive, persiste i tempi delle lane per l'ordinamento dalla più lunga alla più breve e, per impostazione predefinita, interrompe la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale pacchetto, tipo di immagine, immagine live, lane e copertura delle credenziali siano necessari. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto di pacchetto dell'esecuzione corrente oppure scarica un artefatto di pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; crea e pubblica immagini Docker E2E GHCR bare/funzionali con tag basato sul digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riutilizza gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti basate sul digest del pacchetto invece di ricostruirle. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico della CI.

### Chunk del percorso di release

La copertura Docker di release esegue job chunk più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Gli attuali chunk Docker di release sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati Plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un chunk autonomo `openwebui` solo per avvii limitati a OpenWebUI. Le lane di aggiornamento dei canali in bundle ritentano una volta in caso di errori transitori della rete npm.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate sulle immagini preparate invece dei job chunk, mantenendo il debug delle lane non riuscite limitato a un singolo job Docker mirato e preparando, scaricando o riutilizzando l'artefatto del pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato crea localmente l'immagine live-test per quella riesecuzione. I comandi GitHub generati di riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando tali valori esistono, così una lane non riuscita può riutilizzare il pacchetto e le immagini esatti dell'esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E programmato esegue quotidianamente la suite Docker completa release-path.

## Pre-release Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le pull request normali, i push su `main` e gli avvii manuali CI autonomi mantengono disattivata quella suite. Bilancia i test dei Plugin in bundle su otto worker di estensione; quei job shard di estensione eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di Plugin con import pesanti non creano job CI aggiuntivi. Il percorso pre-release Docker solo per release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## Laboratorio QA

Il laboratorio QA ha lane CI dedicate al di fuori del workflow principale con ambito intelligente. La parità agentica è annidata sotto gli harness QA e release ampi, non è un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve accompagnare un'esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su avvio manuale; distribuisce la lane di parità mock, la lane Matrix live e le lane Telegram e Discord live come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza dei modelli live e dal normale avvio dei Plugin provider. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modelli live, provider nativi e provider Docker.

Matrix usa `--profile fast` per i gate programmati e di release, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; l'avvio manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane critiche di release del laboratorio QA prima dell'approvazione della release; il suo gate di parità QA esegue i pacchetti candidate e baseline come job di lane paralleli, quindi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale della parità.

Per le PR normali, segui le prove di CI/check con ambito invece di trattare la parità come uno stato obbligatorio.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza di primo passaggio ristretto, non la scansione completa del repository. Le esecuzioni giornaliere, manuali e di guardia per pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta affidabilità filtrate su `security-severity` alta/critica.

La guardia per pull request rimane leggera: parte solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta affidabilità del workflow pianificato. Android e macOS CodeQL restano fuori dai default delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segreti, sandbox, Cron e baseline del Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime del Plugin del canale, Gateway, Plugin SDK, segreti, punti di audit        |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core di policy SSRF, parsing IP, guardia di rete, web-fetch e Plugin SDK SSRF                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna in uscita e gate di esecuzione tool degli agenti                            |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifest, registry, installazione package-manager, source-loading e contratto pacchetto Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard pianificato di sicurezza Android. Compila manualmente l'app Android per CodeQL sul runner Linux Blacksmith più piccolo accettato dalla verifica di sanità del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Mantenuto fuori dai default giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severità errore su superfici ristrette ad alto valore sul runner Linux Blacksmith più piccolo. La sua guardia per pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche a codice di esecuzione di comandi/modelli/tool degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice auth/segreti/sandbox/sicurezza, runtime dei canali core e dei Plugin di canale inclusi, protocollo Gateway/metodi server, runtime memoria/collante SDK, consegna MCP/processi/in uscita, catalogo runtime/modelli dei provider, diagnostica sessione/code di consegna, loader Plugin, Plugin SDK/contratto pacchetto o runtime risposte del Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità per PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del perimetro di sicurezza per auth, segreti, sandbox, Cron e Gateway                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Contratti di schema, migrazione, normalizzazione e IO della configurazione                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale inclusi                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione dei comandi, dispatch di modelli/provider, dispatch e code di risposta automatica, e contratti runtime del control plane ACP                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge tool, helper di supervisione dei processi e contratti di consegna in uscita                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias del Plugin SDK memoria, collante di attivazione runtime memoria e comandi doctor memoria                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda risposte, code di consegna sessione, helper di binding/consegna sessione in uscita, superfici bundle eventi/log diagnostici e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch risposte in ingresso del Plugin SDK, payload risposte/helper di chunking/runtime, opzioni di risposta canale, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione del catalogo modelli, auth e discovery dei provider, registrazione runtime dei provider, default/cataloghi dei provider e registry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap della UI di controllo, persistenza locale, flussi di controllo Gateway e contratti runtime del control plane dei task                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime per fetch/search web core, IO media, comprensione media, generazione immagini e generazione media                                                |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registry, superficie pubblica ed entrypoint del Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente lato pacchetto pubblicato del Plugin SDK e helper del contratto pacchetto Plugin                                                                         |

La qualità resta separata dalla sicurezza in modo che i finding di qualità possano essere pianificati, misurati, disabilitati o ampliati senza offuscare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere riaggiunta come lavoro successivo con ambito o shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una lane di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche atterrate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato o quando un'altra esecuzione Docs Agent non saltata è stata creata nell'ultima ora. Quando viene eseguito, revisiona l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino al `main` corrente, quindi una singola esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio docs.

### Test Performance Agent

Il workflow `Test Performance Agent` è una lane di manutenzione Codex guidata da eventi per test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel gate di attività giornaliero. La lane crea un report delle prestazioni Vitest raggruppato per la suite completa, consente a Codex di apportare solo piccole correzioni di prestazioni dei test che preservano la copertura invece di refactor ampi, quindi riesegue il report della suite completa e rifiuta modifiche che riducono il conteggio baseline dei test passati. Se la baseline ha test falliti, Codex può correggere solo errori ovvi e il report della suite completa post-agent deve passare prima che qualsiasi cosa venga committata. Quando `main` avanza prima che il push del bot atterri, la lane ribasa la patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia dei duplicati dopo l'atterraggio. Di default è dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR atterrata sia stata mergiata e che ogni duplicato abbia un issue referenziato condiviso o hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche di produzione core eseguono typecheck prod core e test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck dei test core più lint core;
- le modifiche di produzione alle estensioni eseguono typecheck prod estensioni e test estensioni più lint estensioni;
- le modifiche solo ai test delle estensioni eseguono typecheck test estensioni più lint estensioni;
- le modifiche pubbliche al Plugin SDK o ai contratti Plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti core (le sweep Vitest delle estensioni restano lavoro di test esplicito);
- i bump di versione solo metadata di release eseguono controlli mirati su versione/config/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro verso tutte le lane di controllo.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono se stesse, le modifiche al sorgente preferiscono mapping espliciti, poi test sibling e dipendenti dell'import graph. La configurazione condivisa di consegna group-room è uno dei mapping espliciti: le modifiche alla configurazione di risposta visibile di gruppo, alla modalità di consegna risposta sorgente o al prompt di sistema del message-tool passano attraverso i test core di risposta più le regressioni di consegna Discord e Slack, così una modifica condivisa di default fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sull'harness da rendere il set mappato economico un proxy non affidabile.

## Validazione Testbox

Esegui Testbox dalla radice del repository e preferisci una box preriscaldata nuova per una verifica ampia. Prima di spendere un controllo lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il controllo di sanità fallisce rapidamente quando file radice obbligatori come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Questo di solito significa che lo stato della sincronizzazione remota non è una copia affidabile della PR; arresta quella box e preriscaldane una nuova invece di eseguire il debug del fallimento del test del prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quell'esecuzione di sanità.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output successivo alla sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella protezione, oppure usa un valore in millisecondi più grande per diff locali insolitamente grandi.

Crabbox è il secondo percorso di box remota di proprietà del repository per la verifica su Linux quando Blacksmith non è disponibile o quando è preferibile usare capacità cloud di proprietà. Preriscalda una box, idratala tramite il workflow di progetto, quindi esegui i comandi tramite la CLI Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` possiede le impostazioni predefinite di provider, sincronizzazione e idratazione di GitHub Actions. Esclude `.git` locale in modo che il checkout idratato di Actions mantenga i propri metadati Git remoti invece di sincronizzare remoti e archivi di oggetti locali del maintainer, ed esclude artefatti locali di runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione di Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto da cui i comandi successivi `crabbox run --id <cbx_id>` leggono.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
