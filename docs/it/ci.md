---
read_when:
    - È necessario capire perché un processo di CI sia stato eseguito o meno
    - Stai eseguendo il debug di un controllo di GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
    - Stai modificando il dispatch di ClawSweeper o l'inoltro dell'attività GitHub
summary: Grafo dei job CI, gate di ambito, ombrelli di release ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-02T08:17:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e a ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` bypassano intenzionalmente lo scoping intelligente e aprono l'intero grafo per i release candidate e la validazione ampia. Le lane Android restano opt-in tramite `include_android`. La copertura dei plugin solo per release vive nel workflow separato [`Prerelease Plugin`](#plugin-prerelease) e viene eseguita solo da [`Validazione completa della release`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                      | Quando viene eseguito                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, scope modificati, estensioni modificate e crea il manifest CI      | Sempre su push e PR non draft |
| `security-scm-fast`              | Rilevamento di chiavi private e audit del workflow tramite `zizmor`                                        | Sempre su push e PR non draft |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                             | Sempre su push e PR non draft |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                                | Sempre su push e PR non draft |
| `check-dependencies`             | Passaggio Knip solo sulle dipendenze di produzione più guardia dell'allowlist dei file inutilizzati                    | Modifiche rilevanti per Node              |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli sugli artefatti compilati e artefatti downstream riutilizzabili          | Modifiche rilevanti per Node              |
| `checks-fast-core`               | Lane rapide di correttezza Linux, come controlli bundled/plugin-contract/protocol                 | Modifiche rilevanti per Node              |
| `checks-fast-contracts-channels` | Controlli sharded dei contratti dei canali con un risultato aggregato stabile                         | Modifiche rilevanti per Node              |
| `checks-node-core-test`          | Shard dei test core Node, escludendo lane di canali, bundled, contratti ed estensioni             | Modifiche rilevanti per Node              |
| `check`                          | Equivalente sharded del gate locale principale: tipi prod, lint, guardie, tipi dei test e smoke strict   | Modifiche rilevanti per Node              |
| `check-additional`               | Shard di architettura, boundary, guardie della superficie delle estensioni, package-boundary e gateway-watch | Modifiche rilevanti per Node              |
| `build-smoke`                    | Smoke test della CLI compilata e smoke della memoria di avvio                                               | Modifiche rilevanti per Node              |
| `checks`                         | Verificatore per i test dei canali sugli artefatti compilati                                                    | Modifiche rilevanti per Node              |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                   | Dispatch CI manuale per release    |
| `check-docs`                     | Formattazione, lint e controlli sui link interrotti della documentazione                                                | Documentazione modificata                       |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                       | Modifiche rilevanti per skill Python      |
| `checks-windows`                 | Test specifici per Windows su processi/percorsi più regressioni condivise degli specificatori di import runtime         | Modifiche rilevanti per Windows           |
| `macos-node`                     | Lane di test TypeScript macOS che usa gli artefatti compilati condivisi                                  | Modifiche rilevanti per macOS             |
| `macos-swift`                    | Swift lint, build e test per l'app macOS                                               | Modifiche rilevanti per macOS             |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                 | Modifiche rilevanti per Android           |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                    | Successo della CI su main o dispatch manuale |

## Ordine fail-fast

1. `preflight` decide quali lane esistono. Le logiche `docs-scope` e `changed-scope` sono step dentro questo job, non job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice di artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumatori downstream possono iniziare appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime si aprono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando un push più recente arriva sulla stessa PR o sul ref `main`. Consideralo rumore della CI, a meno che anche l'esecuzione più recente per lo stesso ref non stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()`, quindi riportano comunque i normali fallimenti degli shard ma non vengono accodati dopo che l'intero workflow è già stato superato. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni main più recenti. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Scope e routing

La logica di scope vive in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifest preflight come se ogni area scoped fosse cambiata.

- **Le modifiche al workflow CI** validano il grafo CI Node più il linting dei workflow, ma non forzano da sole build native Windows, Android o macOS; queste lane di piattaforma restano scoped alle modifiche del sorgente di piattaforma.
- **Le modifiche solo al routing CI, modifiche selezionate a fixture economiche dei test core e modifiche ristrette a helper/test-routing dei contratti plugin** usano un percorso manifest rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei plugin bundled e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper che il task rapido esercita direttamente.
- **I controlli Windows Node** sono scoped a wrapper di processi/percorsi specifici per Windows, helper dei runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard pesati, le piccole lane unit core sono accoppiate, auto-reply viene eseguito come quattro worker bilanciati (con il subtree reply diviso in shard agent-runner, dispatch e commands/state-routing), e le configurazioni agentic di Gateway/plugin sono distribuite nei job Node agentic esistenti solo sorgente invece di attendere gli artefatti compilati. I test ampi browser, QA, media e plugin miscellanei usano le loro configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. Gli shard include-pattern registrano voci di timing usando il nome dello shard CI, quindi `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro di compile/canary package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard boundary guard esegue le sue piccole guardie indipendenti in parallelo dentro un singolo job. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor third-party non ha un source set o manifest separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando però un job duplicato di packaging dell'APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo sulle dipendenze di produzione fissato all'ultima versione di Knip, con l'età minima di release di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce stale nell'allowlist, preservando al tempo stesso superfici intenzionali di plugin dinamici, generate, build, live-test e bridge di pacchetto che Knip non può risolvere staticamente.

## Inoltro dell'attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato target dall'attività del repository OpenClaw verso ClawSweeper. Non fa checkout né esegue codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, quindi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di review di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di review a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l'agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, attore, repository, numero dell'elemento, URL, titolo, stato e brevi estratti per commenti o review quando presenti. Evita intenzionalmente di inoltrare l'intero corpo del webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l'evento normalizzato sull'hook OpenClaw Gateway per l'agente ClawSweeper.

L'attività generale è osservazione, non consegna predefinita. L'agente ClawSweeper riceve il target Discord nel suo prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l'evento è sorprendente, azionabile, rischioso o operativamente utile. Aperture di routine, modifiche, churn di bot, rumore duplicato da webhook e traffico normale di review dovrebbero produrre `NO_REPLY`.

Tratta titoli, commenti, body, testo delle review, nomi dei branch e messaggi di commit di GitHub come dati non attendibili lungo tutto questo percorso. Sono input per riepilogo e triage, non istruzioni per il workflow o il runtime dell'agente.

## Dispatch manuali

I dispatch manuali della CI eseguono lo stesso grafo di job della CI normale ma forzano l'attivazione di ogni lane scoped non Android: shard Linux Node, shard dei plugin bundled, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS e i18n Control UI. I dispatch CI manuali standalone eseguono Android solo con `include_android=true`; l'ombrello completo di release abilita Android passando `include_android=true`. I controlli statici prerelease dei plugin, lo shard `agentic-plugins` solo release, lo sweep batch completo delle estensioni e le lane Docker prerelease dei plugin sono esclusi dalla CI. La suite Docker prerelease viene eseguita solo quando `Full Release Validation` invia il workflow separato `Plugin Prerelease` con il gate di validazione della release abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa di release candidate non viene annullata da un altro push o da un'esecuzione PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo su un branch, tag o SHA commit completo usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Esecutori

| Esecutore                        | Processi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, processi di sicurezza rapidi e aggregazioni (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratto/bundle, controlli shardati dei contratti dei canali, shard di `check` escluso lint, shard e aggregazioni `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; il preflight install-smoke usa anche Ubuntu ospitato da GitHub così la matrice Blacksmith può accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard Plugin a peso minore, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Node Linux, shard dei test dei Plugin in bundle, `android`                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU da rendere 8 vCPU più costosi di quanto facessero risparmiare); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                       |

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

## Validazione completa della release

`Full Release Validation` è il workflow ombrello manuale per "eseguire tutto prima della release". Accetta un branch, un tag o uno SHA completo di commit, avvia il workflow manuale `CI` con quel target, avvia `Plugin Prerelease` per la prova solo di release di Plugin/pacchetti/statico/Docker e avvia `OpenClaw Release Checks` per install smoke, accettazione pacchetto, suite Docker del percorso di release, live/E2E, OpenWebUI, parità QA Lab, Matrix e corsie Telegram. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` contro l'artefatto `release-package-under-test` dai controlli di release. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa corsia del pacchetto Telegram contro il pacchetto npm pubblicato.

Vedi [Validazione completa della release](/it/reference/full-release-validation) per la
matrice degli stage, i nomi esatti dei job del workflow, le differenze tra profili, gli artefatti e
gli handle per riesecuzioni mirate.

`OpenClaw Release Publish` è il workflow manuale mutante di release. Avvialo
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

Per una prova con commit fissato su un branch in rapido movimento, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I riferimenti di dispatch dei workflow GitHub devono essere branch o tag, non SHA grezzi di commit. L'helper effettua il push di un branch temporaneo `release-ci/<sha>-...` allo SHA target,
avvia `Full Release Validation` da quel riferimento fissato, verifica che ogni `headSha` dei workflow figli corrisponda al target ed elimina il branch temporaneo quando l'esecuzione è completata. Il verificatore ombrello fallisce anche se qualunque workflow figlio è stato eseguito a uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di release. I
workflow manuali di release usano per impostazione predefinita `stable`; usa `full` solo quando vuoi intenzionalmente l'ampia matrice consultiva provider/media.

- `minimum` mantiene le corsie OpenAI/core critiche per la release più veloci.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva provider/media.

L'ombrello registra gli id delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il recupero, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di release, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease dei Plugin, `release-checks` per ogni figlio di release o un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene limitata la riesecuzione di un box di release fallito dopo una correzione mirata.

`OpenClaw Release Checks` usa il riferimento attendibile del workflow per risolvere una volta il riferimento selezionato in un tarball `release-package-under-test`, poi passa quell'artefatto sia al workflow Docker live/E2E del percorso di release sia allo shard di accettazione pacchetto. Questo mantiene coerenti i byte del pacchetto tra i box di release ed evita di ricreare lo stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'ombrello più vecchio. Il monitor padre annulla qualunque workflow figlio
che abbia già avviato quando il padre viene annullato, quindi la validazione main più recente
non resta dietro a una vecchia esecuzione di release-check di due ore. La validazione di branch/tag di release
e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E di release mantiene un'ampia copertura nativa `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece di un unico job seriale:

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

Questo mantiene la stessa copertura dei file rendendo al contempo più facile rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi aggregati degli shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali singole.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job in container sono il posto sbagliato per avviare test Docker annidati.

Gli shard di modelli/backend live supportati da Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow di rilascio live crea e pubblica quell'immagine una sola volta, poi gli shard del modello live Docker, del Gateway suddiviso per provider, del backend CLI, del bind ACP e dell'harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway hanno limiti `timeout` espliciti a livello di script inferiori al timeout del job del workflow, così un container bloccato o un percorso di cleanup fallisce rapidamente invece di consumare l'intero budget dei controlli di rilascio. Se questi shard ricostruiscono indipendentemente il target Docker completo del sorgente, l'esecuzione del rilascio è configurata in modo errato e sprecherà tempo reale in build di immagini duplicate.

## Accettazione del pacchetto

Usa `Package Acceptance` quando la domanda è: "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale valida l'albero sorgente, mentre l'accettazione del pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artifact `package-under-test` e stampa origine, workflow ref, package ref, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artifact, valida l'inventario del tarball, prepara immagini Docker con digest del pacchetto quando necessario ed esegue le corsie Docker selezionate su quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una sola volta, poi distribuisce quelle corsie come job Docker mirati paralleli con artifact univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artifact `package-under-test` quando Package Acceptance ne ha risolto uno; un dispatch Telegram autonomo può comunque installare una spec npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la corsia Telegram facoltativa non sono riuscite.

### Origini dei candidati

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione beta/stabile pubblicata.
- `source=ref` impacchetta un branch, tag o SHA completo di commit `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in un worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per artifact condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile di workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire la logica dei workflow vecchi.

### Profili della suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocchi completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura plugin offline, così la validazione del pacchetto pubblicato non dipende dalla disponibilità live di ClawHub. La corsia Telegram facoltativa riusa l'artifact `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della spec npm pubblicata per i dispatch autonomi.

Per la policy dedicata di test di aggiornamenti e plugin, inclusi comandi locali,
corsie Docker, input di Package Acceptance, default di rilascio e triage degli errori,
vedi [Testare aggiornamenti e plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Package Acceptance con `source=artifact`, l'artifact del pacchetto di rilascio preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` e `telegram_mode=mock-openai`. Questo mantiene la prova di migrazione del pacchetto, aggiornamento, cleanup di dipendenze plugin obsolete, plugin offline, plugin-update e Telegram sullo stesso tarball di pacchetto risolto. I controlli di rilascio cross-OS coprono ancora onboarding, installer e comportamento di piattaforma specifici del sistema operativo; la validazione prodotto di pacchetto/aggiornamento dovrebbe iniziare da Package Acceptance. La corsia Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione. In Package Acceptance, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, con default `openclaw@latest`; i comandi di riesecuzione della corsia fallita preservano quella baseline. Imposta `published_upgrade_survivor_baselines=release-history` per espandere la corsia su una matrice di cronologia deduplicata: gli ultimi sei rilasci stabili, `2026.4.23` e l'ultimo rilascio stabile prima del `2026-03-15`. Imposta `published_upgrade_survivor_scenarios=reported-issues` per espandere le stesse baseline su fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, percorsi di log con tilde e radici di dipendenze plugin legacy obsolete. Il workflow separato `Update Migration` usa la corsia Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda un cleanup esaustivo degli aggiornamenti pubblicati, non l'ampiezza normale della CI Full Release. Le esecuzioni aggregate locali possono passare spec di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola corsia con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15` o impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La corsia pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e controlla `/healthz`, `/readyz` più lo stato RPC dopo l'avvio del Gateway. Le corsie Windows di pacchetto e installer fresh verificano anche che un pacchetto installato possa importare un override di browser-control da un percorso Windows assoluto grezzo. Lo smoke agent-turn cross-OS OpenAI usa per default `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.5`, così la prova di installazione e Gateway resta sul modello di test GPT-5 preferito.

### Finestre di compatibilità legacy

Package Acceptance ha finestre delimitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare `pnpm.patchedDependencies` mancanti dalla fixture git finta derivata dal tarball e può registrare nel log `update.channel` persistito mancante;
- gli smoke dei plugin possono leggere posizioni legacy degli install-record o accettare la persistenza mancante degli install-record del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur richiedendo che il comportamento install record e no-reinstall rimanga invariato.

Anche il pacchetto pubblicato `2026.4.26` può avvisare per file di timbro dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare avvisi o venire saltate.

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

Quando esegui il debug di un'esecuzione di accettazione pacchetto fallita, inizia dal riepilogo di `resolve_package` per confermare origine del pacchetto, versione e SHA-256. Poi ispeziona l'esecuzione figlia `docker_acceptance` e i suoi artifact Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle corsie, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo pacchetto fallito o le corsie Docker esatte invece di rieseguire la validazione di rilascio completa.

## Smoke di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche ai pacchetti/manifest di plugin inclusi o superfici core plugin/canale/Gateway/Plugin SDK esercitate dai job smoke Docker. Modifiche solo sorgente ai plugin inclusi, modifiche solo ai test e modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido crea una volta l'immagine Dockerfile root, controlla la CLI, esegue lo smoke CLI agents delete shared-workspace, esegue l'e2e container gateway-network, verifica un build arg di un'estensione inclusa ed esegue il profilo Docker dei plugin inclusi delimitato sotto un timeout aggregato del comando di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- **Percorso completo** mantiene installazione pacchetto QR e copertura Docker/update dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di rilascio workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riusa un'immagine smoke GHCR del Dockerfile root per il target SHA, poi esegue installazione pacchetto QR, smoke Dockerfile root/Gateway, smoke installer/update e l'E2E Docker rapido dei plugin inclusi come job separati, così il lavoro dell'installer non aspetta gli smoke dell'immagine root.

I push su `main` (inclusi i merge commit) non forzano il percorso completo; quando la logica changed-scope richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di rilascio.

Lo smoke lento del provider immagine con installazione globale Bun è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di rilascio, e i dispatch manuali di `Install Smoke` possono includerlo, ma pull request e push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## Docker E2E locale

`pnpm test:docker:all` precrea una singola immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e crea due immagini condivise `scripts/e2e/Dockerfile`:

- un runner Node/Git essenziale per corsie installer/update/dipendenze plugin;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le corsie di funzionalità normali.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, quindi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                                      |
| -------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool di coda sensibile ai provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti per evitare che i provider applichino throttling.                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane di installazione npm concorrenti.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra gli avvii delle lane per evitare picchi di create del daemon Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); alcune lane live/di coda selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostato | `1` stampa il piano dello scheduler senza eseguire le lane.                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostato | Elenco esatto di lane separato da virgole; salta lo smoke di pulizia così gli agent possono riprodurre una lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, quindi viene eseguita da sola finché non rilascia capacità. L'aggregato locale esegue i preflight di Docker, rimuove i container OpenClaw E2E obsoleti, emette lo stato delle lane attive, persiste i tempi delle lane per l'ordinamento dalla più lunga alla più breve e, per impostazione predefinita, interrompe la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quali pacchetto, tipo di immagine, immagine live, lane e copertura delle credenziali sono richiesti. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto di pacchetto dell'esecuzione corrente oppure scarica un artefatto di pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; compila e invia immagini Docker E2E bare/funzionali GHCR taggate con digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riutilizza gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti con digest del pacchetto invece di ricompilare. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così un flusso di registro/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico CI.

### Chunk del percorso di release

La copertura Docker di release esegue job più piccoli a chunk con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk esegue il pull solo del tipo di immagine necessario ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

I chunk Docker di release correnti sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati di plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane di installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa release-path lo richiede e mantiene un chunk autonomo `openwebui` solo per dispatch limitati a OpenWebUI. Le lane di aggiornamento dei canali in bundle ritentano una volta in caso di errori di rete npm transitori.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job a chunk, mantenendo il debug delle lane non riuscite limitato a un solo job Docker mirato e preparando, scaricando o riutilizzando l'artefatto di pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine live-test per quella riesecuzione. I comandi GitHub di riesecuzione generati per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando quei valori esistono, così una lane non riuscita può riutilizzare esattamente il pacchetto e le immagini dell'esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # scarica gli artefatti Docker e stampa comandi di riesecuzione mirati combinati/per lane
pnpm test:docker:timings <summary>   # riepiloghi delle lane lente e del percorso critico delle fasi
```

Il workflow live/E2E pianificato esegue quotidianamente l'intera suite Docker release-path.

## Prerelease dei Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch CI manuali autonomi mantengono quella suite disattivata. Bilancia i test dei plugin in bundle su otto worker extension; questi job shard extension eseguono fino a due gruppi di configurazione plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di plugin con molte importazioni non creano job CI aggiuntivi. Il percorso prerelease Docker solo release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con scope intelligente.

- Il workflow `Parity gate` viene eseguito su modifiche PR corrispondenti e su dispatch manuale; compila il runtime QA privato e confronta i pack agentic mock GPT-5.5 e Opus 4.6.
- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce il parity gate mock, la lane Matrix live e le lane Telegram e Discord live come job paralleli. I job live usano l'ambiente `qa-live-shared` e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza del modello live e dal normale avvio del provider-plugin. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività del provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; un dispatch manuale con `matrix_profile=all` sharda sempre la copertura Matrix completa in job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pack candidato e baseline come job lane paralleli, quindi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale della parità.

Non mettere il percorso di landing delle PR dietro `Parity gate` a meno che la modifica non tocchi effettivamente il runtime QA, la parità dei model-pack o una superficie posseduta dal workflow di parità. Per normali correzioni di canale, configurazione, documentazione o unit test, trattalo come un segnale opzionale e segui invece le prove CI/check con scope.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza di primo passaggio ristretto, non una scansione completa del repository. Le esecuzioni quotidiane, manuali e di guardia su pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a più alto rischio con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La guardia delle pull request resta leggera: parte solo per modifiche in `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. Android e macOS CodeQL restano fuori dai valori predefiniti per le PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, Cron e baseline del Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei Plugin di canale, Gateway, Plugin SDK, secret, punti di contatto audit |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici SSRF core, parsing IP, guard di rete, web-fetch e policy SSRF del Plugin SDK                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione processi, consegna outbound e gate di esecuzione strumenti degli agent                             |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di trust di installazione Plugin, loader, manifest, registry, installazione package-manager, caricamento sorgenti e contratto pacchetto Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard pianificato di sicurezza Android. Compila manualmente l'app Android per CodeQL sul runner Linux Blacksmith più piccolo accettato dalla sanity del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra dai SARIF caricati i risultati di build delle dipendenze e carica sotto `/codeql-critical-security/macos`. Mantenuto fuori dai valori predefiniti quotidiani perché la build macOS domina il tempo di esecuzione anche quando è pulita.

### Categorie Critical Quality

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript con severità errore e non di sicurezza su superfici ristrette ad alto valore, sul runner Linux Blacksmith più piccolo. La sua guardia per pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche a codice di esecuzione comandi/modelli/strumenti degli agent e dispatch delle risposte, schema/migrazione/IO di configurazione, codice auth/secret/sandbox/sicurezza, runtime dei canali core e dei plugin di canale in bundle, protocollo Gateway/metodo server, runtime memoria/collante SDK, MCP/processi/consegna outbound, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader plugin, Plugin SDK/contratto pacchetto o runtime di risposta Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti i dodici shard di qualità PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice di confine di sicurezza per autenticazione, segreti, sandbox, Cron e Gateway                                                                                                     |
| `/codeql-critical-quality/config-boundary`              | Schema di configurazione, migrazione, normalizzazione e contratti di IO                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale inclusi                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione dei comandi, dispatch di modelli/provider, dispatch e code di risposta automatica, e contratti runtime del piano di controllo ACP                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK dell'host di memoria, facade runtime della memoria, alias dell'SDK di memoria per Plugin, collante di attivazione runtime della memoria e comandi doctor della memoria              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda di risposte, code di consegna sessione, helper di associazione/consegna sessione in uscita, superfici di eventi diagnostici/bundle di log e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso dell'SDK Plugin, helper per payload/frammentazione/runtime delle risposte, opzioni di risposta dei canali, code di consegna e helper di associazione sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione del catalogo modelli, autenticazione e discovery dei provider, registrazione runtime dei provider, impostazioni predefinite/cataloghi dei provider e registri web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap dell'interfaccia di controllo, persistenza locale, flussi di controllo Gateway e contratti runtime del piano di controllo delle attività                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime per fetch/search web core, IO dei media, comprensione dei media, generazione di immagini e generazione di media                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registro, superficie pubblica ed entrypoint dell'SDK Plugin                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente dell'SDK Plugin lato pacchetto pubblicato e helper dei contratti dei pacchetti Plugin                                                                                          |

La qualità resta separata dalla sicurezza in modo che i risultati sulla qualità possano essere pianificati, misurati, disabilitati o ampliati senza offuscare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere riaggiunta come lavoro successivo con ambito o shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Agente documentazione

Il workflow `Docs Agent` è una corsia di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche atterrate di recente. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni da workflow-run vengono saltate quando `main` è avanzato o quando un'altra esecuzione `Docs Agent` non saltata è stata creata nell'ultima ora. Quando viene eseguito, esamina l'intervallo di commit dallo SHA sorgente del precedente `Docs Agent` non saltato fino al `main` corrente, quindi una singola esecuzione oraria può coprire tutte le modifiche a main accumulate dall'ultimo passaggio sulla documentazione.

### Agente prestazioni dei test

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione da workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliero. La corsia costruisce un report completo e raggruppato delle prestazioni Vitest, consente a Codex di apportare solo piccole correzioni alle prestazioni dei test preservando la copertura invece di ampi refactor, quindi riesegue il report completo e rifiuta modifiche che riducono il conteggio baseline dei test superati. Se la baseline ha test falliti, Codex può correggere solo fallimenti ovvi e il report completo post-agente deve passare prima che venga creato qualsiasi commit. Quando `main` avanza prima che il push del bot atterri, la corsia esegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza senza sudo dell'agente documentazione.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer dedicato alla pulizia delle duplicate dopo l'atterraggio. Per impostazione predefinita è un dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR atterrata sia stata mergiata e che ciascuna duplicata abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e instradamento delle modifiche

La logica locale delle corsie modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche di produzione core eseguono il typecheck di produzione core e dei test core più lint/guard core;
- le modifiche solo ai test core eseguono solo il typecheck dei test core più il lint core;
- le modifiche di produzione alle estensioni eseguono il typecheck di produzione estensione e dei test estensione più il lint estensione;
- le modifiche solo ai test estensione eseguono il typecheck dei test estensione più il lint estensione;
- le modifiche all'SDK Plugin pubblico o ai contratti dei Plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti core (gli sweep Vitest delle estensioni restano lavoro di test esplicito);
- gli incrementi di versione solo sui metadati di rilascio eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche sconosciute a root/configurazione falliscono in sicurezza verso tutte le corsie di controllo.

L'instradamento locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono quei test, le modifiche ai sorgenti preferiscono mappature esplicite, poi test fratelli e dipendenti nel grafo degli import. La configurazione condivisa della consegna nelle stanze di gruppo è una delle mappature esplicite: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema dello strumento messaggi passano dai test core delle risposte più regressioni di consegna Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sull'harness da rendere l'insieme mappato economico un proxy non affidabile.

## Validazione Testbox

Esegui Testbox dalla root del repository e preferisci una box appena riscaldata per prove ampie. Prima di spendere un gate lento su una box riutilizzata, scaduta o che ha appena riportato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il controllo di sanità fallisce rapidamente quando file root richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato di sincronizzazione remota non è una copia affidabile della PR; ferma quella box e riscaldane una nuova invece di debuggare il fallimento del test di prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quell'esecuzione di sanità.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella guardia, oppure usa un valore in millisecondi più grande per diff locali insolitamente grandi.

Crabbox è il secondo percorso di box remota di proprietà del repository per prove Linux quando Blacksmith non è disponibile o quando è preferibile capacità cloud di proprietà. Riscalda una box, idratala tramite il workflow del progetto, quindi esegui i comandi tramite la CLI Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` possiede i default di provider, sincronizzazione e idratazione di GitHub Actions. Esclude `.git` locale così il checkout Actions idratato mantiene i propri metadati Git remoti invece di sincronizzare remoti e archivi oggetti locali del maintainer, ed esclude artefatti locali runtime/build che non dovrebbero mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, setup Node/pnpm, fetch di `origin/main` e passaggio dell'ambiente non segreto che i successivi comandi `crabbox run --id <cbx_id>` caricano.

## Correlati

- [Panoramica installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
