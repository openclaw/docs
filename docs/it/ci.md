---
read_when:
    - È necessario capire perché un processo di CI è stato eseguito o non è stato eseguito
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
summary: Grafo delle attività CI, controlli di ambito, ombrelli di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-30T18:38:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e per ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo scoping intelligente ed espandono l'intero grafo per i candidati al rilascio e la validazione ampia. Le lane Android restano opt-in tramite `include_android`. La copertura Plugin solo per il rilascio risiede nel workflow separato [`Pre-release Plugin`](#plugin-prerelease) e viene eseguita solo da [`Validazione completa del rilascio`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                 | Quando viene eseguito                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, ambiti modificati, estensioni modificate e crea il manifest CI | Sempre su push non draft e PR                 |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                   | Sempre su push non draft e PR                 |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze contro gli advisory npm                             | Sempre su push non draft e PR                 |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                                     | Sempre su push non draft e PR                 |
| `check-dependencies`             | Passaggio Knip solo sulle dipendenze di produzione più guardia allowlist per file inutilizzati         | Modifiche rilevanti per Node                  |
| `build-artifacts`                | Crea `dist/`, Control UI, controlli sugli artefatti compilati e artefatti riutilizzabili a valle      | Modifiche rilevanti per Node                  |
| `checks-fast-core`               | Lane di correttezza Linux rapide come controlli bundled/contratti Plugin/protocollo                   | Modifiche rilevanti per Node                  |
| `checks-fast-contracts-channels` | Controlli dei contratti dei canali in shard con risultato di controllo aggregato stabile              | Modifiche rilevanti per Node                  |
| `checks-node-core-test`          | Shard dei test core Node, esclusi canali, bundled, contratti e lane delle estensioni                  | Modifiche rilevanti per Node                  |
| `check`                          | Equivalente del gate locale principale in shard: tipi prod, lint, guardie, tipi test e smoke rigoroso | Modifiche rilevanti per Node                  |
| `check-additional`               | Shard di architettura, boundary, guardie sulla superficie delle estensioni, package-boundary e gateway-watch | Modifiche rilevanti per Node                  |
| `build-smoke`                    | Smoke test della CLI compilata e smoke sulla memoria di avvio                                         | Modifiche rilevanti per Node                  |
| `checks`                         | Verificatore per i test dei canali sugli artefatti compilati                                          | Modifiche rilevanti per Node                  |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                       | Dispatch CI manuale per i rilasci             |
| `check-docs`                     | Formattazione, lint e controlli dei link interrotti della documentazione                              | Documentazione modificata                     |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                             | Modifiche rilevanti per Skills Python         |
| `checks-windows`                 | Test specifici Windows per processi/percorsi più regressioni condivise degli specificatori di import runtime | Modifiche rilevanti per Windows               |
| `macos-node`                     | Lane di test TypeScript macOS che usa gli artefatti compilati condivisi                               | Modifiche rilevanti per macOS                 |
| `macos-swift`                    | Swift lint, build e test per l'app macOS                                                              | Modifiche rilevanti per macOS                 |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                    | Modifiche rilevanti per Android               |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                             | Successo della CI su main o dispatch manuale  |

## Ordine fail-fast

1. `preflight` decide quali lane esistono effettivamente. La logica `docs-scope` e `changed-scope` è composta da step dentro questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artefatti e matrice piattaforma.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer a valle possono partire appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime si espandono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando arriva un push più recente sulla stessa PR o sullo stesso ref `main`. Trattalo come rumore della CI a meno che anche l'esecuzione più recente per lo stesso ref stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()`, quindi riportano ancora i normali fallimenti degli shard ma non vengono messi in coda dopo che l'intero workflow è già stato superato. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`) in modo che uno zombie lato GitHub in un vecchio gruppo di coda non possa bloccare indefinitamente le esecuzioni più recenti su main. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Ambito e routing

La logica di ambito si trova in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa sì che il manifest preflight si comporti come se ogni area con ambito fosse cambiata.

- **Le modifiche ai workflow CI** validano il grafo CI Node più il linting dei workflow, ma non forzano da sole build native Windows, Android o macOS; queste lane piattaforma restano limitate alle modifiche al codice sorgente della piattaforma.
- **Le modifiche solo al routing CI, alcune modifiche economiche selezionate alle fixture dei test core e modifiche ristrette a helper/test-routing dei contratti Plugin** usano un percorso manifest rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei Plugin bundled e matrici di guardia aggiuntive quando la modifica è limitata alle superfici di routing o helper che il task rapido esercita direttamente.
- **I controlli Node Windows** sono limitati a wrapper specifici Windows per processi/percorsi, helper dei runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a codice sorgente, Plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard pesati, le piccole lane unit core sono accoppiate, auto-reply gira come quattro worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentiche gateway/Plugin sono distribuite tra i job Node agentici esistenti solo sorgente invece di attendere gli artefatti compilati. I test ampi browser, QA, media e Plugin miscellanei usano le loro configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard include-pattern registrano voci di timing usando il nome dello shard CI, quindi `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro compile/canary package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard della guardia boundary esegue le sue piccole guardie indipendenti in parallelo dentro un unico job. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor di terze parti non ha un source set o manifest separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando al contempo un job duplicato di packaging dell'APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo sulle dipendenze di produzione fissato all'ultima versione di Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia sui file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al contempo superfici intenzionali dinamiche Plugin, generate, di build, live-test e bridge di pacchetti che Knip non può risolvere staticamente.

## Dispatch manuali

I dispatch CI manuali eseguono lo stesso grafo di job della CI normale ma forzano l'attivazione di ogni lane con ambito non Android: shard Linux Node, shard Plugin bundled, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, build smoke, controlli documentazione, Skills Python, Windows, macOS e i18n Control UI. I dispatch CI manuali autonomi eseguono Android solo con `include_android=true`; l'ombrello di rilascio completo abilita Android passando `include_android=true`. I controlli statici di pre-release Plugin, lo shard solo rilascio `agentic-plugins`, la sweep batch completa delle estensioni e le lane Docker di pre-release Plugin sono esclusi dalla CI. La suite Docker di pre-release viene eseguita solo quando `Full Release Validation` invia il workflow separato `Plugin Prerelease` con il gate release-validation abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, quindi una suite completa per un candidato al rilascio non viene annullata da un altro push o da un'esecuzione PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo contro un branch, un tag o uno SHA completo di commit usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Esecutore                        | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza rapidi e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratti/bundled, controlli shardati dei contratti dei canali, shard di `check` tranne lint, shard e aggregati di `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche la preflight di install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può entrare in coda prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard dei Plugin a peso inferiore, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Node su Linux, shard dei test dei Plugin bundled, `android`                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU perché 8 vCPU costassero più di quanto facessero risparmiare); build Docker di install-smoke (il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

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
```

## Validazione completa del rilascio

`Full Release Validation` è il workflow ombrello manuale per "eseguire tutto prima del rilascio". Accetta un branch, un tag o uno SHA completo di commit, avvia il workflow manuale `CI` con quel target, avvia `Plugin Prerelease` per prove solo di rilascio su Plugin/pacchetti/statico/Docker e avvia `OpenClaw Release Checks` per smoke test di installazione, accettazione del pacchetto, suite Docker del percorso di rilascio, live/E2E, OpenWebUI, parità QA Lab, Matrix e corsie Telegram. Può anche eseguire il workflow post-pubblicazione `NPM Telegram Beta E2E` quando viene fornita una specifica di pacchetto pubblicata.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di rilascio:

- `minimum` mantiene le corsie più rapide OpenAI/core critiche per il rilascio.
- `stable` aggiunge il set stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva di provider/media.

L'ombrello registra gli id delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato dell'ombrello e il riepilogo dei tempi.

Per il recupero, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene delimitata la riesecuzione di un box di rilascio fallito dopo una correzione mirata.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere il ref selezionato una sola volta in un tarball `release-package-under-test`, poi passa quell'artefatto sia al workflow Docker live/E2E del percorso di rilascio sia allo shard di accettazione del pacchetto. Questo mantiene coerenti i byte del pacchetto tra i box di rilascio ed evita di reimpacchettare lo stesso candidato in più job figli.

## Shard live ed E2E

Il figlio live/E2E di rilascio mantiene un'ampia copertura nativa `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece che come un unico job seriale:

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
- shard separati media audio/video e shard musicali filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più facile rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi aggregati degli shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali esecutori Blacksmith: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live di modello/backend basati su Docker usano un'immagine separata condivisa `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow di rilascio live crea e pubblica quell'immagine una volta, poi gli shard Docker live di modello, Gateway, backend CLI, bind ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Se questi shard ricreano indipendentemente il target Docker completo dai sorgenti, l'esecuzione di rilascio è configurata male e sprecherà tempo di calendario in build di immagini duplicate.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale valida l'albero dei sorgenti, mentre l'accettazione del pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa origine, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo del passaggio GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara immagini Docker con digest del pacchetto quando necessario ed esegue le corsie Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara una sola volta il pacchetto e le immagini condivise, poi distribuisce quelle corsie come job Docker mirati in parallelo con artefatti unici.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; l'avvio standalone di Telegram può comunque installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la corsia Telegram facoltativa sono fallite.

### Origini dei candidati

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio di OpenClaw, come `openclaw@2026.4.27-beta.2`. Usa questa opzione per l'accettazione di beta/stable pubblicate.
- `source=ref` crea un pacchetto da un branch, tag o SHA completo di commit `package_ref` attendibile. Il resolver recupera branch/tag di OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in un worktree scollegato e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice del workflow/harness attendibile che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire vecchia logica di workflow.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatto; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa la copertura dei plugin offline, quindi la validazione dei pacchetti pubblicati non dipende dalla disponibilità live di ClawHub. La lane facoltativa di Telegram riusa l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per dispatch autonomi.

I controlli di rilascio chiamano Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` e `telegram_mode=mock-openai`. I chunk Docker del percorso di rilascio coprono le lane sovrapposte package/update/plugin; Package Acceptance mantiene la compatibilità nativa dell'artefatto per bundled-channel, plugin offline e la prova Telegram sullo stesso tarball di pacchetto risolto. I controlli di rilascio cross-OS continuano a coprire onboarding, installer e comportamento della piattaforma specifici per OS; la validazione product di package/update dovrebbe iniziare con Package Acceptance. Le lane Windows packaged e installer fresh verificano inoltre che un pacchetto installato possa importare un override browser-control da un percorso Windows assoluto grezzo. Lo smoke cross-OS agent-turn di OpenAI usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4-mini`, così la prova di installazione e Gateway resta veloce e deterministica.

### Finestre di compatibilità legacy

Package Acceptance ha finestre limitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare `pnpm.patchedDependencies` mancanti dalla fixture git finta derivata dal tarball e può registrare `update.channel` persistito mancante;
- gli smoke dei plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur continuando a richiedere che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` può anche avvisare per file di timbro dei metadati di build locali già distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare avvisi o salti.

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

Quando fai debug di un'esecuzione Package Acceptance non riuscita, parti dal riepilogo `resolve_package` per confermare origine, versione e SHA-256 del pacchetto. Poi ispeziona l'esecuzione figlia `docker_acceptance` e i suoi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo di package fallito o le lane Docker esatte invece di rieseguire l'intera validazione di rilascio.

## Smoke di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso veloce** viene eseguito per pull request che toccano superfici Docker/package, modifiche a pacchetti/manifest di plugin in bundle o superfici core di plugin/canale/Gateway/Plugin SDK esercitate dai job smoke Docker. Modifiche ai soli sorgenti di plugin in bundle, modifiche solo ai test e modifiche solo alla documentazione non riservano worker Docker. Il percorso veloce compila una volta l'immagine Dockerfile root, controlla la CLI, esegue lo smoke CLI agents delete shared-workspace, esegue l'e2e container gateway-network, verifica un build arg di estensione in bundle ed esegue il profilo Docker limitato dei plugin in bundle entro un timeout aggregato del comando di 240 secondi (con ogni esecuzione Docker di scenario limitata separatamente).
- **Percorso completo** mantiene l'installazione QR package e la copertura Docker/update dell'installer per esecuzioni notturne pianificate, dispatch manuali, controlli di rilascio workflow-call e pull request che toccano davvero superfici installer/package/Docker. In modalità completa, install-smoke prepara o riusa una singola immagine smoke GHCR root Dockerfile al target-SHA, poi esegue installazione QR package, smoke root Dockerfile/Gateway, smoke installer/update e Docker E2E veloce dei plugin in bundle come job separati, così il lavoro dell'installer non attende dietro agli smoke dell'immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica changed-scope richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker veloce e lascia lo smoke completo di installazione alla validazione notturna o di rilascio.

Lo smoke lento del provider di immagini con installazione globale Bun è governato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di rilascio, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma pull request e push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## Docker E2E locale

`pnpm test:docker:all` precompila una singola immagine di live-test condivisa, impacchetta OpenClaw una volta come tarball npm e compila due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git essenziale per lane installer/update/plugin-dependency;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normale.

Le definizioni delle lane Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, quindi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri configurabili

| Variabile                              | Default | Scopo                                                                                         |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Numero di slot del pool principale per lane normali.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Numero di slot del pool tail sensibile ai provider.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limite di lane live concorrenti, così i provider non applicano throttling.                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limite di lane concorrenti di installazione npm.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limite di lane multi-servizio concorrenti.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Ritardo tra avvii delle lane per evitare tempeste di create del daemon Docker; imposta `0` per nessun ritardo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout di fallback per lane (120 minuti); lane live/tail selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` stampa il piano dello scheduler senza eseguire lane.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Elenco separato da virgole di lane esatte; salta lo smoke di cleanup così gli agenti possono riprodurre una lane fallita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. Il preflight aggregato locale controlla Docker, rimuove container OpenClaw E2E obsoleti, emette lo stato delle lane attive, persiste i tempi delle lane per l'ordinamento longest-first e per impostazione predefinita smette di pianificare nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale pacchetto, tipo di immagine, immagine live, lane e copertura credenziali siano richiesti. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. O impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto di pacchetto dell'esecuzione corrente o scarica un artefatto di pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; compila e pubblica immagini GHCR Docker E2E bare/funzionali taggate con digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riusa input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti con digest del pacchetto invece di ricompilare. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream di registry/cache bloccato ritenta rapidamente invece di consumare gran parte del percorso critico CI.

### Chunk del percorso di rilascio

La copertura Docker di rilascio esegue job in chunk più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine necessario ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

I chunk Docker della release corrente sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, da `plugins-runtime-install-a` a `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` e `bundled-channels-contracts`. Il chunk aggregato `bundled-channels` resta disponibile per riesecuzioni manuali una tantum, e `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati di plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane degli installer dei provider. Il chunk `bundled-channels` esegue lane suddivise `bundled-channel-*` e `bundled-channel-update-*` invece della lane seriale tutto-in-uno `bundled-channel-deps`.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa del percorso di release lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch limitati a OpenWebUI. Le lane di aggiornamento dei canali in bundle ritentano una volta in caso di errori transitori di rete npm.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate sulle immagini preparate invece dei job dei chunk, mantenendo il debug delle lane fallite limitato a un solo job Docker mirato e preparando, scaricando o riutilizzando l'artefatto del pacchetto per quella esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine dei test live per quella riesecuzione. I comandi di riesecuzione GitHub generati per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando tali valori esistono, così una lane fallita può riutilizzare esattamente il pacchetto e le immagini dell'esecuzione fallita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue ogni giorno l'intera suite Docker del percorso di release.

## Prerelease dei Plugin

`Plugin Prerelease` è una copertura di prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le pull request normali, i push su `main` e i dispatch CI manuali autonomi mantengono quella suite disattivata. Bilancia i test dei plugin in bundle su otto worker di estensione; questi job shard di estensione eseguono fino a due gruppi di configurazione plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di plugin pesanti sugli import non creano job CI aggiuntivi.

## QA Lab

QA Lab dispone di lane CI dedicate al di fuori del workflow principale con ambito intelligente.

- Il workflow `Parity gate` viene eseguito su modifiche PR corrispondenti e dispatch manuale; compila il runtime QA privato e confronta i pack agentici mock GPT-5.5 e Opus 4.6.
- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce il gate di parità mock, la lane Matrix live e le lane Telegram e Discord live come job paralleli. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`) così il contratto del canale è isolato dalla latenza dei modelli live e dal normale avvio dei plugin provider. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pack candidato e baseline come job lane paralleli, poi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale della parità.

Non mettere il percorso di landing della PR dietro `Parity gate` a meno che la modifica non tocchi effettivamente il runtime QA, la parità dei model pack o una superficie posseduta dal workflow di parità. Per normali correzioni di canali, configurazione, documentazione o unit test, trattalo come un segnale opzionale e segui invece le evidenze CI/controlli con ambito.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non la scansione completa del repository. Le esecuzioni giornaliere, manuali e di protezione per pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La protezione per pull request resta leggera: parte solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. CodeQL per Android e macOS resta fuori dai valori predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segreti, sandbox, cron e baseline del gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei plugin di canale, gateway, Plugin SDK, segreti, punti di contatto audit   |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core SSRF, parsing IP, protezione di rete, web-fetch e policy SSRF del Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione processi, consegna in uscita e gate di esecuzione strumenti degli agenti                              |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifest, registry, staging delle dipendenze runtime, caricamento sorgenti e contratto pacchetto Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard pianificato per la sicurezza Android. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dal controllo di sanità del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai valori predefiniti giornalieri perché la build macOS domina il tempo di esecuzione anche quando è pulita.

### Categorie Critical Quality

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severità errore su superfici ristrette ad alto valore sul runner Blacksmith Linux più piccolo. La sua protezione per pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di comando/modello/esecuzione strumenti degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice auth/segreti/sandbox/sicurezza, runtime dei canali core e dei plugin canale in bundle, protocollo Gateway/metodi server, runtime memoria/collante SDK, MCP/processi/consegna in uscita, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader plugin, Plugin SDK/contratto pacchetto o runtime risposte Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza per autenticazione, segreti, sandbox, cron e Gateway                                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Schema di configurazione, migrazione, normalizzazione e contratti di I/O                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi del server                                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione del canale core e del Plugin di canale in bundle                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratti runtime per esecuzione dei comandi, dispatch di modello/provider, dispatch e code di risposta automatica, e control plane ACP                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione dei processi e contratti di recapito in uscita                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host della memoria, facade runtime della memoria, alias dell'SDK Plugin della memoria, glue di attivazione runtime della memoria e comandi doctor della memoria                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda di risposta, code di recapito sessione, helper di binding/recapito delle sessioni in uscita, superfici di eventi diagnostici/bundle di log e contratti CLI doctor della sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso dell'SDK Plugin, helper di payload/chunking/runtime delle risposte, opzioni di risposta del canale, code di recapito e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione del catalogo dei modelli, autenticazione e discovery dei provider, registrazione runtime dei provider, default/cataloghi dei provider e registri web/ricerca/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap dell'interfaccia di controllo, persistenza locale, flussi di controllo del Gateway e contratti runtime del control plane delle attività                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime per fetch/ricerca web core, I/O dei media, comprensione dei media, generazione di immagini e generazione di media                                                  |
| `/codeql-critical-quality/plugin-boundary`              | Contratti del loader, del registro, della superficie pubblica e degli entrypoint dell'SDK Plugin                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente dell'SDK Plugin lato pacchetto pubblicato e helper dei contratti dei pacchetti Plugin                                                                                       |

La qualità resta separata dalla sicurezza in modo che i rilievi sulla qualità possano essere pianificati, misurati, disabilitati o ampliati senza offuscare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin in bundle dovrebbe essere riaggiunta come lavoro di follow-up con ambito definito o suddiviso in shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una lane di manutenzione Codex basata su eventi per mantenere la documentazione esistente allineata alle modifiche approdate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è andato avanti o quando un'altra esecuzione Docs Agent non saltata è stata creata nell'ultima ora. Quando viene eseguito, esamina l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino all'attuale `main`, quindi un'unica esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sulla documentazione.

### Test Performance Agent

Il workflow `Test Performance Agent` è una lane di manutenzione Codex basata su eventi per i test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel gate di attività giornaliero. La lane genera un report completo delle prestazioni Vitest raggruppato per l'intera suite, consente a Codex di apportare solo piccole correzioni alle prestazioni dei test che preservano la copertura invece di refactor ampi, quindi riesegue il report completo della suite e rifiuta le modifiche che riducono il conteggio di baseline dei test superati. Se la baseline ha test in errore, Codex può correggere solo errori evidenti e il report completo della suite post-agent deve passare prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot approdi, la lane esegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub in modo che l'azione Codex possa mantenere la stessa postura di sicurezza drop-sudo dell'agent della documentazione.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia delle duplicazioni dopo l'approdo. Per impostazione predefinita è in dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR approdata sia stata mergiata e che ogni duplicato abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e instradamento delle modifiche

La logica locale delle lane modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche alla produzione core eseguono typecheck di produzione core e test core più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck dei test core più lint core;
- le modifiche alla produzione delle estensioni eseguono typecheck di produzione estensione e test estensione più lint estensione;
- le modifiche solo ai test delle estensioni eseguono typecheck dei test estensione più lint estensione;
- le modifiche all'SDK Plugin pubblico o ai contratti dei plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti core (gli sweep Vitest delle estensioni restano lavoro di test esplicito);
- gli incrementi di versione solo sui metadati di release eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in sicurezza verso tutte le lane di controllo.

L'instradamento locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono quei test, le modifiche al sorgente preferiscono mapping espliciti, poi test fratelli e dipendenti nel grafo degli import. La configurazione condivisa di recapito group-room è uno dei mapping espliciti: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di recapito delle risposte sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test core delle risposte più le regressioni di recapito Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sul test harness da rendere il set mappato economico non affidabile come proxy.

## Validazione Testbox

Esegui Testbox dalla root del repo e preferisci una box nuova e riscaldata per prove ampie. Prima di spendere un gate lento su una box riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il controllo di sanità fallisce rapidamente quando file root richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato di sincronizzazione remota non è una copia affidabile della PR; ferma quella box e riscaldane una nuova invece di eseguire il debug del fallimento del test di prodotto. Per PR intenzionali con grandi eliminazioni, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di sanità.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output post-sync. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella guardia, oppure usa un valore in millisecondi più grande per diff locali insolitamente grandi.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
