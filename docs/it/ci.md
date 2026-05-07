---
read_when:
    - È necessario capire perché un processo CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
    - Stai modificando l’invio di ClawSweeper o l’inoltro dell’attività di GitHub
summary: Grafo delle attività CI, controlli di ambito, aggregatori di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-07T01:51:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguita a ogni push su `main` e per ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali tramite `workflow_dispatch` bypassano intenzionalmente lo smart scoping e distribuiscono l’intero grafo per release candidate e validazioni ampie. Le lane Android restano opt-in tramite `include_android`. La copertura dei Plugin solo per le release si trova nel workflow separato [`Plugin Prerelease`](#plugin-prerelease) e viene eseguita solo da [`Full Release Validation`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                                      | Quando viene eseguito                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, scope modificati, estensioni modificate e crea il manifest CI   | Sempre su push e PR non draft         |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                                        | Sempre su push e PR non draft         |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                               | Sempre su push e PR non draft         |
| `security-fast`                  | Aggregato obbligatorio per i job di sicurezza rapidi                                                       | Sempre su push e PR non draft         |
| `check-dependencies`             | Passaggio Knip solo dipendenze di produzione più guardia allowlist dei file inutilizzati                   | Modifiche rilevanti per Node          |
| `build-artifacts`                | Build di `dist/`, Control UI, controlli sugli artefatti compilati e artefatti downstream riutilizzabili    | Modifiche rilevanti per Node          |
| `checks-fast-core`               | Lane Linux rapide di correttezza come controlli bundled/contratto-Plugin/protocollo                       | Modifiche rilevanti per Node          |
| `checks-fast-contracts-channels` | Controlli dei contratti dei canali suddivisi in shard con risultato aggregato stabile                      | Modifiche rilevanti per Node          |
| `checks-node-core-test`          | Shard dei test core Node, escluse le lane canali, bundled, contratti ed estensioni                         | Modifiche rilevanti per Node          |
| `check`                          | Equivalente del gate locale principale suddiviso in shard: tipi prod, lint, guardie, tipi test e smoke strict | Modifiche rilevanti per Node       |
| `check-additional`               | Architettura, drift boundary/prompt suddiviso in shard, guardie estensioni, boundary pacchetti e gateway watch | Modifiche rilevanti per Node       |
| `build-smoke`                    | Test smoke della CLI compilata e smoke della memoria di avvio                                             | Modifiche rilevanti per Node          |
| `checks`                         | Verificatore per test dei canali su artefatti compilati                                                   | Modifiche rilevanti per Node          |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                                           | Dispatch CI manuale per release       |
| `check-docs`                     | Formattazione documentazione, lint e controlli dei link interrotti                                        | Documentazione modificata             |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                                 | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Test specifici Windows su processi/percorsi più regressioni condivise degli specifier di import runtime   | Modifiche rilevanti per Windows       |
| `macos-node`                     | Lane di test TypeScript macOS usando gli artefatti compilati condivisi                                    | Modifiche rilevanti per macOS         |
| `macos-swift`                    | Lint, build e test Swift per l’app macOS                                                                  | Modifiche rilevanti per macOS         |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                                        | Modifiche rilevanti per Android       |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                                 | Successo della CI main o dispatch manuale |
| `openclaw-performance`           | Report giornalieri/on-demand sulle prestazioni runtime Kova con lane mock-provider, deep-profile e GPT 5.4 live | Dispatch pianificato e manuale  |

## Ordine fail-fast

1. `preflight` decide quali lane esistono davvero. Le logiche `docs-scope` e `changed-scope` sono step dentro questo job, non job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti di artefatti e matrici di piattaforma.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer downstream possono partire appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime si diramano dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando arriva un push più recente sulla stessa PR o sul ref `main`. Trattalo come rumore della CI a meno che anche l’esecuzione più recente per lo stesso ref stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()`, quindi segnalano comunque i normali fallimenti degli shard ma non vengono accodati dopo che l’intero workflow è già stato superato. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni più recenti su main. Le esecuzioni manuali dell’intera suite usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

Il job `ci-timings-summary` carica un artefatto compatto `ci-timings-summary` per ogni esecuzione CI non draft. Registra durata complessiva, tempo in coda, job più lenti e job falliti per l’esecuzione corrente, così i controlli di salute della CI non devono raschiare ripetutamente l’intero payload di Actions.

## Scope e routing

La logica di scope si trova in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifest preflight come se ogni area con scope fosse cambiata.

- **Le modifiche ai workflow CI** validano il grafo CI Node più il lint dei workflow, ma da sole non forzano le build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del sorgente della piattaforma.
- **Le modifiche solo al routing CI, alcune modifiche economiche alle fixture core-test e modifiche ristrette ad helper/test-routing dei contratti Plugin** usano un percorso di manifest rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei Plugin bundled e matrici di guardia aggiuntive quando la modifica è limitata alle superfici di routing o helper esercitate direttamente dal task rapido.
- **I controlli Node Windows** sono limitati a wrapper specifici Windows per processi/percorsi, helper runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, Plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate affinché ogni job resti piccolo senza prenotare troppi runner: i contratti dei canali vengono eseguiti come tre shard ponderati, le lane core unit fast/support vengono eseguite separatamente, l’infrastruttura runtime core è divisa tra shard state, process/config, cron e shared, auto-reply viene eseguito come worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentic gateway/server sono divise tra lane chat/auth/model/http-plugin/runtime/startup invece di attendere gli artefatti compilati. I test browser, QA, media e Plugin vari di ampio respiro usano le loro configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard include-pattern registrano le voci di timing usando il nome dello shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un’intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro di compilazione/canary package-boundary e separa l’architettura della topologia runtime dalla copertura gateway watch; l’elenco delle guardie boundary è distribuito su quattro shard di matrice, ciascuno esegue guardie indipendenti selezionate in parallelo e stampa i timing per controllo. Il costoso controllo drift degli snapshot prompt happy-path Codex viene eseguito solo per la CI manuale e per modifiche che influenzano i prompt, quindi le normali modifiche Node non correlate non aspettano dietro la generazione a freddo degli snapshot prompt mentre il drift dei prompt resta comunque ancorato alla PR che lo ha causato; lo stesso flag salta la generazione Vitest degli snapshot prompt dentro lo shard core support-boundary degli artefatti compilati. Gateway watch, test dei canali e shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest`, quindi compila l’APK debug Play. Il flavor third-party non ha un source set o un manifest separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig SMS/call-log, evitando però un job duplicato di packaging APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo dipendenze di produzione fissato all’ultima versione di Knip, con età minima di rilascio di pnpm disabilitata per l’installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al contempo le superfici intenzionali di Plugin dinamici, generazione, build, live-test e bridge pacchetti che Knip non può risolvere staticamente.

## Inoltro dell’attività ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` è il bridge lato destinazione dall’attività del repository OpenClaw verso ClawSweeper. Non esegue checkout né codice di pull request non attendibile. Il workflow crea un token GitHub App da `CLAWSWEEPER_APP_PRIVATE_KEY`, quindi invia payload `repository_dispatch` compatti a `openclaw/clawsweeper`.

Il workflow ha quattro lane:

- `clawsweeper_item` per richieste esatte di review di issue e pull request;
- `clawsweeper_comment` per comandi ClawSweeper espliciti nei commenti delle issue;
- `clawsweeper_commit_review` per richieste di review a livello di commit sui push a `main`;
- `github_activity` per attività GitHub generale che l’agente ClawSweeper può ispezionare.

La lane `github_activity` inoltra solo metadati normalizzati: tipo di evento, azione, attore, repository, numero dell’elemento, URL, titolo, stato e brevi estratti per commenti o review quando presenti. Evita intenzionalmente di inoltrare l’intero corpo del Webhook. Il workflow ricevente in `openclaw/clawsweeper` è `.github/workflows/github-activity.yml`, che pubblica l’evento normalizzato sull’hook OpenClaw Gateway per l’agente ClawSweeper.

L’attività generale è osservazione, non consegna predefinita. L’agente ClawSweeper riceve il target Discord nel suo prompt e dovrebbe pubblicare su `#clawsweeper` solo quando l’evento è sorprendente, azionabile, rischioso o utile operativamente. Aperture di routine, modifiche, churn dei bot, rumore Webhook duplicato e normale traffico di review dovrebbero risultare in `NO_REPLY`.

I titoli, i commenti, i corpi, il testo delle review, i nomi dei branch e i messaggi di commit di GitHub devono essere trattati come dati non attendibili in tutto questo percorso. Sono input per riepilogo e triage, non istruzioni per il workflow o il runtime dell'agente.

## Dispatch manuali

I dispatch CI manuali eseguono lo stesso grafo di job della CI normale, ma forzano l'attivazione di ogni lane con ambito non Android: shard Linux Node, shard dei plugin in bundle, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS e i18n della Control UI. I dispatch CI manuali autonomi eseguono solo Android con `include_android=true`; l'umbrella completo di rilascio abilita Android passando `include_android=true`. I controlli statici di prerelease dei plugin, lo shard solo rilascio `agentic-plugins`, lo sweep batch completo delle estensioni e le lane Docker di prerelease dei plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` invia il workflow separato `Plugin Prerelease` con il gate di validazione del rilascio abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza unico, quindi una suite completa di release candidate non viene annullata da un'altra esecuzione push o PR sullo stesso ref. L'input facoltativo `target_ref` consente a un chiamante attendibile di eseguire quel grafo rispetto a un branch, tag o SHA completo di commit usando il file del workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza rapidi e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratti/bundle, controlli dei contratti dei canali shardati, shard `check` tranne lint, aggregati `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard di estensione più leggeri, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei plugin in bundle, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU che 8 vCPU costavano più di quanto facessero risparmiare); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |

La CI del repository canonico mantiene Blacksmith come percorso runner predefinito. Durante `preflight`, `scripts/ci-runner-labels.mjs` controlla le esecuzioni Actions recenti in coda e in corso per i job Blacksmith in coda. Se una specifica etichetta Blacksmith ha già job in coda, i job a valle che userebbero quella stessa etichetta ripiegano sul runner GitHub-hosted corrispondente (`ubuntu-24.04`, `windows-2025` o `macos-latest`) solo per quell'esecuzione. Le altre dimensioni Blacksmith nella stessa famiglia di OS rimangono sulle loro etichette primarie. Se il probe API fallisce, non viene applicato alcun fallback.

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

`OpenClaw Performance` è il workflow delle prestazioni di prodotto/runtime. Viene eseguito quotidianamente su `main` e può essere inviato manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Il dispatch manuale normalmente esegue benchmark del ref del workflow. Imposta `target_ref` per eseguire benchmark di un tag di rilascio o di un altro branch con l'implementazione corrente del workflow. I percorsi dei report pubblicati e i puntatori più recenti sono indicizzati per ref testato, e ogni `index.md` registra ref/SHA testato, ref/SHA del workflow, ref Kova, profilo, modalità di autenticazione della lane, modello, numero di ripetizioni e filtri degli scenari.

Il workflow installa OCM da un rilascio bloccato e Kova da `openclaw/Kova` all'input `kova_ref` bloccato, poi esegue tre lane:

- `mock-provider`: scenari diagnostici Kova rispetto a un runtime build locale con auth fittizia deterministica compatibile con OpenAI.
- `mock-deep-profile`: profilazione CPU/heap/trace per hotspot di avvio, gateway e turno agente.
- `live-gpt54`: un turno agente reale OpenAI `openai/gpt-5.4`, saltato quando `OPENAI_API_KEY` non è disponibile.

La lane mock-provider esegue anche probe sorgente nativi OpenClaw dopo il passaggio Kova: tempi di boot e memoria del Gateway nei casi di avvio predefinito, hook e con 50 plugin; cicli hello ripetuti di `channel-chat-baseline` mock-OpenAI; e comandi di avvio CLI rispetto al Gateway avviato. Il riepilogo Markdown del probe sorgente vive in `source/index.md` nel bundle del report, con il JSON grezzo accanto.

Ogni lane carica artefatti GitHub. Quando `CLAWGRIT_REPORTS_TOKEN` è configurato, il workflow esegue anche il commit di `report.json`, `report.md`, bundle, `index.md` e artefatti source-probe in `openclaw/clawgrit-reports` sotto `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Il puntatore corrente del ref testato viene scritto come `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validazione completa del rilascio

`Full Release Validation` è il workflow umbrella manuale per "eseguire tutto prima del rilascio". Accetta un branch, tag o SHA completo di commit, invia il workflow manuale `CI` con quel target, invia `Plugin Prerelease` per prove solo rilascio di plugin/pacchetto/statiche/Docker e invia `OpenClaw Release Checks` per install smoke, accettazione pacchetti, controlli pacchetto cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite mantengono la copertura live/E2E esaustiva e del percorso di rilascio Docker dietro `run_release_soak=true`; `release_profile=full` forza l'attivazione di quella copertura soak così la validazione ampia degli advisory rimane ampia. Con `rerun_group=all` e `release_profile=full`, esegue anche `NPM Telegram Beta E2E` rispetto all'artefatto `release-package-under-test` dai controlli di rilascio. Dopo la pubblicazione, passa `npm_telegram_package_spec` per rieseguire la stessa lane pacchetto Telegram rispetto al pacchetto npm pubblicato.

Vedi [Validazione completa del rilascio](/it/reference/full-release-validation) per la
matrice degli stage, i nomi esatti dei job workflow, le differenze di profilo, gli artefatti e
gli handle di riesecuzione mirata.

`OpenClaw Release Publish` è il workflow manuale mutante di rilascio. Invialo
da `release/YYYY.M.D` o `main` dopo che il tag di rilascio esiste e dopo che il
preflight npm di OpenClaw è riuscito. Verifica `pnpm plugins:sync:check`,
invia `Plugin NPM Release` per tutti i pacchetti plugin pubblicabili, invia
`Plugin ClawHub Release` per lo stesso SHA di rilascio e solo allora invia
`OpenClaw NPM Release` con il `preflight_run_id` salvato.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Per la prova di un commit fissato su un ramo in rapido movimento, usa l'helper invece di
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

I ref di dispatch dei workflow GitHub devono essere rami o tag, non SHA di commit grezzi. L'helper invia un ramo temporaneo `release-ci/<sha>-...` allo SHA di destinazione, esegue il dispatch di `Full Release Validation` da quel ref fissato, verifica che ogni `headSha` dei workflow figli corrisponda alla destinazione ed elimina il ramo temporaneo al completamento dell'esecuzione. Anche il verificatore ombrello fallisce se un workflow figlio è stato eseguito a uno SHA diverso.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di rilascio. I workflow di rilascio manuali usano per impostazione predefinita `stable`; usa `full` solo quando vuoi intenzionalmente la matrice ampia di provider/media consultiva. `run_release_soak` controlla se i controlli di rilascio stable/predefiniti eseguono il soak esaustivo live/E2E e del percorso di rilascio Docker; `full` forza l'attivazione del soak.

- `minimum` mantiene le lane OpenAI/core più rapide e critiche per il rilascio.
- `stable` aggiunge il set stabile di provider/backend.
- `full` esegue la matrice ampia di provider/media consultiva.

L'ombrello registra gli ID delle esecuzioni figlie inviate e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato dell'ombrello e il riepilogo dei tempi.

Per il recupero, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease dei plugin, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene limitata la riesecuzione di un box di rilascio non riuscito dopo una correzione mirata. Per una singola lane cross-OS non riuscita, combina `rerun_group=cross-os` con `cross_os_suite_filter`, ad esempio `windows/packaged-upgrade`; i comandi cross-OS lunghi emettono righe Heartbeat e i riepiloghi packaged-upgrade includono tempi per fase. Le lane QA dei release-check sono consultive, quindi i fallimenti solo QA avvisano ma non bloccano il verificatore dei release-check.

`OpenClaw Release Checks` usa il ref di workflow attendibile per risolvere una sola volta il ref selezionato in un tarball `release-package-under-test`, poi passa quell'artefatto ai controlli cross-OS e a Package Acceptance, più al workflow Docker live/E2E del percorso di rilascio quando viene eseguita la copertura soak. Questo mantiene coerenti i byte del pacchetto tra i box di rilascio ed evita di ripacchettare lo stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'ombrello precedente. Il monitor padre annulla qualsiasi workflow figlio già inviato quando il padre viene annullato, quindi la validazione più recente di main non rimane in coda dietro a un'esecuzione obsoleta di release-check da due ore. La validazione di rami/tag di rilascio e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

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
- shard media audio/video separati e shard musica filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più semplice rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi degli shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima del setup. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live model/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow live di rilascio crea e invia quell'immagine una sola volta, poi gli shard Docker live model, gateway suddiviso per provider, backend CLI, bind ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Gateway Docker portano limiti `timeout` espliciti a livello di script sotto il timeout del job workflow, così un container bloccato o un percorso di pulizia fallisce rapidamente invece di consumare tutto il budget dei release-check. Se questi shard ricostruiscono indipendentemente il target Docker completo dei sorgenti, l'esecuzione di rilascio è configurata male e sprecherà tempo di clock su build di immagini duplicate.

## Package Acceptance

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale valida l'albero sorgente, mentre Package Acceptance valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` fa il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa origine, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo del passaggio GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara le immagini Docker con digest del pacchetto quando necessario ed esegue le lane Docker selezionate contro quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una volta, poi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama opzionalmente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; il dispatch Telegram standalone può ancora installare una spec npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram opzionale sono fallite.

### Origini dei candidati

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione di prerelease/stable pubblicati.
- `source=ref` impacchetta un ramo, tag o SHA di commit completo `package_ref` attendibile. Il resolver recupera rami/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei rami del repository o da un tag di rilascio, installa le dipendenze in un worktree distaccato e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è opzionale ma dovrebbe essere fornito per artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice workflow/harness attendibile che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire la vecchia logica di workflow.

### Profili suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; richiesto quando `suite_profile=custom`

Il profilo `package` usa copertura offline dei plugin, così la validazione del pacchetto pubblicato non è bloccata dalla disponibilità live di ClawHub. La lane Telegram opzionale riutilizza l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della spec npm pubblicata per i dispatch standalone.

Per la policy dedicata di aggiornamenti e test dei plugin, inclusi comandi locali, lane Docker, input di Package Acceptance, impostazioni predefinite di rilascio e triage dei fallimenti, vedi [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins).

I controlli di rilascio chiamano Package Acceptance con `source=artifact`, l'artefatto del pacchetto di rilascio preparato, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` e `telegram_mode=mock-openai`. Questo mantiene la prova di migrazione del pacchetto, aggiornamento, pulizia delle dipendenze obsolete dei plugin, riparazione dell'installazione dei plugin configurati, plugin offline, plugin-update e Telegram sullo stesso tarball del pacchetto risolto. Imposta `package_acceptance_package_spec` su Full Release Validation o OpenClaw Release Checks per eseguire la stessa matrice contro un pacchetto npm distribuito invece dell'artefatto creato dallo SHA. I controlli di rilascio cross-OS coprono ancora onboarding, installer e comportamento della piattaforma specifici per OS; la validazione prodotto di pacchetto/aggiornamento dovrebbe iniziare con Package Acceptance. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione nel percorso di rilascio bloccante. In Package Acceptance, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata di fallback, predefinita a `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Full Release Validation con `run_release_soak=true` o `release_profile=full` imposta `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` e `published_upgrade_survivor_scenarios=reported-issues` per espandere la copertura alle quattro ultime release npm stable più release fissate di confine per la compatibilità dei plugin e fixture modellate su issue per configurazione Feishu, file bootstrap/persona preservati, installazioni di plugin OpenClaw configurati, percorsi log con tilde e radici di dipendenze obsolete dei plugin legacy. Le selezioni multi-baseline di published-upgrade survivor vengono suddivise per baseline in job runner Docker mirati separati. Il workflow separato `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` e `plugin-deps-cleanup` quando la domanda riguarda una pulizia esaustiva degli aggiornamenti pubblicati, non l'ampiezza normale della CI di Full Release. Le esecuzioni aggregate locali possono passare spec di pacchetto esatte con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantenere una singola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` come `openclaw@2026.4.15`, oppure impostare `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` per la matrice di scenari. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, registra i passaggi della ricetta in `summary.json` e sonda `/healthz`, `/readyz`, più lo stato RPC dopo l'avvio del Gateway. Anche le lane Windows packaged e installer fresh verificano che un pacchetto installato possa importare un override di browser-control da un percorso Windows assoluto grezzo. Lo smoke agent-turn cross-OS OpenAI usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4`, così la prova di installazione e Gateway resta su un modello di test GPT-5 evitando le impostazioni predefinite GPT-4.x.

### Finestre di compatibilità legacy

Package Acceptance ha finestre di compatibilità legacy delimitate per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- le voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e può registrare `update.channel` persistito mancante;
- gli smoke test dei plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione pur richiedendo ancora che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto `2026.4.26` pubblicato può anche avvisare per file di timbro dei metadati di build locali già distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare avvisi o essere saltate.

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

Durante il debug di un’esecuzione Package Acceptance non riuscita, inizia dal riepilogo `resolve_package` per confermare origine del pacchetto, versione e SHA-256. Poi ispeziona l’esecuzione figlia `docker_acceptance` e i relativi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo del pacchetto non riuscito o le lane Docker esatte invece di rieseguire la validazione completa della release.

## Smoke test di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest di plugin in bundle, o superfici core plugin/canale/gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche solo sorgente ai plugin in bundle, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido compila una volta l’immagine Dockerfile root, controlla la CLI, esegue lo smoke CLI agents delete shared-workspace, esegue l’e2e gateway-network del container, verifica un argomento di build di un’estensione in bundle ed esegue il profilo Docker delimitato dei plugin in bundle con un timeout aggregato dei comandi di 240 secondi (ogni esecuzione Docker dello scenario è limitata separatamente).
- **Percorso completo** mantiene l’installazione del pacchetto QR e la copertura Docker/update dell’installer per esecuzioni pianificate notturne, dispatch manuali, controlli di release via workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riusa una immagine smoke GHCR del Dockerfile root per lo SHA target, poi esegue installazione pacchetto QR, smoke del Dockerfile root/gateway, smoke installer/update e l’E2E Docker rapido dei plugin in bundle come job separati, così il lavoro sull’installer non attende dietro gli smoke dell’immagine root.

I push su `main` (inclusi i commit di merge) non forzano il percorso completo; quando la logica dell’ambito modificato richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di release.

Lo smoke lento del provider di immagini con installazione globale Bun è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di release, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma le pull request e i push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile orientati all’installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila una immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e compila due immagini `scripts/e2e/Dockerfile` condivise:

- un runner Node/Git essenziale per lane installer/update/plugin-dependency;
- una immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normale.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l’immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool di coda sensibile ai provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti per evitare throttling dei provider.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane di installazione npm concorrenti.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra gli avvii delle lane per evitare tempeste di creazione del daemon Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); le lane live/coda selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostato | `1` stampa il piano dello scheduler senza eseguire le lane.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostato | Elenco esatto di lane separate da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una lane non riuscita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. I preflight aggregati locali controllano Docker, rimuovono container E2E OpenClaw obsoleti, emettono lo stato delle lane attive, persistono i tempi delle lane per l’ordinamento dalla più lunga alla più breve e, per impostazione predefinita, interrompono la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riusabile

Il workflow live/E2E riusabile chiede a `scripts/test-docker-all.mjs --plan-json` quale copertura di pacchetto, tipo di immagine, immagine live, lane e credenziali è richiesta. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto pacchetto dell’esecuzione corrente oppure scarica un artefatto pacchetto da `package_artifact_run_id`; valida l’inventario del tarball; compila e pubblica immagini E2E Docker GHCR bare/funzionali etichettate con digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti basate sul digest del pacchetto invece di ricompilarle. I pull delle immagini Docker vengono ritentati con un timeout delimitato di 180 secondi per tentativo, così uno stream di registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico CI.

### Chunk del percorso di release

La copertura Docker di release esegue job spezzati in chunk più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler pesato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Gli attuali chunk Docker di release sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` e da `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati plugin/runtime. L’alias di lane `install-e2e` resta l’alias aggregato di riesecuzione manuale per entrambe le lane installer dei provider.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura release-path completa lo richiede e mantiene un chunk autonomo `openwebui` solo per dispatch esclusivi di OpenWebUI. Le lane di aggiornamento dei canali in bundle ritentano una volta in caso di errori di rete npm transitori.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L’input `docker_lanes` del workflow esegue le lane selezionate contro le immagini preparate invece dei job chunk, mantenendo il debug delle lane non riuscite delimitato a un job Docker mirato e preparando, scaricando o riusando l’artefatto pacchetto per quell’esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l’immagine live-test per quella riesecuzione. I comandi GitHub generati di riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando questi valori esistono, così una lane non riuscita può riusare il pacchetto e le immagini esatti dell’esecuzione non riuscita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue ogni giorno l’intera suite Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch CI manuali autonomi tengono disattivata quella suite. Bilancia i test dei plugin in bundle su otto worker di estensione; questi job shard di estensione eseguono fino a due gruppi di configurazione plugin alla volta con un worker Vitest per gruppo e un heap Node più grande, così i batch di plugin con import pesanti non creano job CI aggiuntivi. Il percorso prerelease Docker solo per release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale con ambito smart. La parità agentica è annidata sotto gli harness ampi di QA e release, non è un workflow PR autonomo. Usa `Full Release Validation` con `rerun_group=qa-parity` quando la parità deve viaggiare con un’esecuzione di validazione ampia.

- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce a ventaglio la lane di parità mock, la lane Matrix live e le lane live Telegram e Discord come job paralleli. I job live usano l’ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di rilascio eseguono le corsie di trasporto in tempo reale Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza dei modelli live e dal normale avvio del Plugin provider. Il gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modelli live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di rilascio, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l’input del workflow manuale restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa in job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le corsie QA Lab critiche per il rilascio prima dell’approvazione del rilascio; il suo gate di parità QA esegue i pacchetti candidato e baseline come job di corsia paralleli, poi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale di parità.

Per le PR normali, segui le prove CI/check con ambito limitato invece di trattare la parità come stato obbligatorio.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non una scansione completa del repository. Le esecuzioni giornaliere, manuali e di protezione delle pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più alto con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La protezione delle pull request resta leggera: parte solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. Android e macOS CodeQL restano fuori dai valori predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, segreti, sandbox, Cron e baseline del Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime del Plugin di canale, Gateway, Plugin SDK, segreti, punti di contatto audit |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core per SSRF, parsing IP, protezione di rete, web-fetch e policy SSRF del Plugin SDK                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione dei processi, consegna in uscita e gate di esecuzione strumenti degli agenti                       |
| `/codeql-security-high/plugin-trust-boundary`     | Installazione Plugin, loader, manifest, registry, installazione package-manager, caricamento sorgenti e superfici di fiducia del contratto pacchetto Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l’app Android per CodeQL sul runner Linux Blacksmith più piccolo accettato dalla sanity del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l’app macOS per CodeQL su Blacksmith macOS, filtra dai SARIF caricati i risultati di build delle dipendenze e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai valori predefiniti giornalieri perché la build macOS domina il tempo di esecuzione anche quando è pulita.

### Categorie Critical Quality

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severità errore su superfici ristrette di alto valore sul runner Linux Blacksmith più piccolo. La sua protezione per pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione comandi/modelli/strumenti degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della config, codice auth/segreti/sandbox/sicurezza, canale core e runtime del Plugin di canale incluso, protocollo Gateway/metodo server, runtime memoria/collante SDK, MCP/processo/consegna in uscita, catalogo runtime/modelli provider, diagnostica sessione/code di consegna, loader Plugin, Plugin SDK/contratto pacchetto o runtime risposte Plugin SDK. Le modifiche alla config CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, segreti, sandbox, Cron e codice del perimetro di sicurezza del Gateway                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Schema config, migrazione, normalizzazione e contratti IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione dei canali core e dei Plugin di canale inclusi                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione comandi, dispatch modello/provider, dispatch e code di risposta automatica, e contratti runtime del piano di controllo ACP                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memoria, facade runtime memoria, alias memoria Plugin SDK, collante di attivazione runtime memoria e comandi doctor memoria                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda risposte, code di consegna sessione, helper di binding/consegna sessione in uscita, superfici bundle eventi/log diagnostici e contratti CLI doctor sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch risposte in ingresso Plugin SDK, helper runtime/payload/chunking risposte, opzioni risposta canale, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione catalogo modelli, auth e discovery provider, registrazione runtime provider, valori predefiniti/cataloghi provider e registry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, persistenza locale, flussi di controllo Gateway e contratti runtime del piano di controllo task                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web core, IO media, comprensione media, generazione immagini e contratti runtime di generazione media                                                |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, superficie pubblica e contratti entrypoint Plugin SDK                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente Plugin SDK lato pacchetto pubblicato e helper del contratto pacchetto Plugin                                                                             |

La qualità resta separata dalla sicurezza così i finding di qualità possono essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L’espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere reintrodotta come lavoro successivo con ambito o shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una corsia di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche atterrate di recente. Non ha una pianificazione pura: un’esecuzione CI riuscita da push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato o quando un’altra esecuzione Docs Agent non saltata è stata creata nell’ultima ora. Quando viene eseguito, rivede l’intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato all’attuale `main`, così una singola esecuzione oraria può coprire tutte le modifiche su main accumulate dall’ultimo passaggio documentazione.

### Test Performance Agent

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex guidata da eventi per test lenti. Non ha una pianificazione pura: un’esecuzione CI riuscita da push non bot su `main` può attivarlo, ma viene saltato se un’altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel gate di attività giornaliera. La corsia costruisce un report di performance Vitest raggruppato per suite completa, consente a Codex di apportare solo piccole correzioni di performance dei test che preservano la copertura invece di refactor ampi, poi riesegue il report della suite completa e rifiuta modifiche che riducono il conteggio baseline dei test passanti. Se la baseline ha test falliti, Codex può correggere solo fallimenti ovvi e il report della suite completa dopo l’agente deve passare prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot atterri, la corsia esegue rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l’azione Codex può mantenere la stessa postura di sicurezza drop-sudo dell’agente documentazione.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia post-land delle duplicate. Il valore predefinito è dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR atterrata sia stata mergiata e che ogni duplicata abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle corsie modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più severo sui perimetri architetturali rispetto all’ambito ampio della piattaforma CI:

- le modifiche di produzione al core eseguono il controllo tipi di produzione del core e dei test del core, più lint/guard del core;
- le modifiche solo ai test del core eseguono solo il controllo tipi dei test del core più il lint del core;
- le modifiche di produzione alle estensioni eseguono il controllo tipi di produzione e dei test delle estensioni più il lint delle estensioni;
- le modifiche solo ai test delle estensioni eseguono il controllo tipi dei test delle estensioni più il lint delle estensioni;
- le modifiche al Plugin SDK pubblico o ai contratti dei plugin si estendono al controllo tipi delle estensioni perché le estensioni dipendono da quei contratti del core (gli sweep delle estensioni Vitest restano lavoro di test esplicito);
- i soli incrementi di versione dei metadati di release eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in modo sicuro su tutte le lane di controllo.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono i test stessi, le modifiche al sorgente preferiscono mappature esplicite, poi test sibling e dipendenti dal grafo degli import. La configurazione condivisa di consegna nelle group room è una delle mappature esplicite: le modifiche alla configurazione delle risposte visibili al gruppo, alla modalità di consegna delle risposte dal sorgente o al prompt di sistema dello strumento messaggi passano attraverso i test delle risposte del core più le regressioni di consegna Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sull’harness da rendere il set mappato economico un proxy non affidabile.

## Validazione Testbox

Esegui Testbox dalla root del repo e preferisci una box appena riscaldata per prove ampie. Prima di spendere una gate lenta su una box riutilizzata, scaduta o che ha appena riportato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il controllo di sanità fallisce rapidamente quando file root richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato della sincronizzazione remota non è una copia affidabile della PR; ferma quella box e riscaldane una nuova invece di debuggare il fallimento del test del prodotto. Per PR con grandi eliminazioni intenzionali, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di sanità.

`pnpm testbox:run` termina anche un’invocazione locale della Blacksmith CLI che resta nella fase di sincronizzazione per più di cinque minuti senza output post-sincronizzazione. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quella guard, oppure usa un valore in millisecondi più alto per diff locali insolitamente grandi.

Crabbox è il wrapper di box remota posseduto dal repo per le prove Linux dei maintainer. Usalo quando un controllo è troppo ampio per un local loopback di modifica, quando conta la parità con la CI, o quando la prova richiede segreti, Docker, lane di pacchetti, box riutilizzabili o log remoti. Il backend normale di OpenClaw è `blacksmith-testbox`; la capacità AWS/Hetzner posseduta è un fallback per outage di Blacksmith, problemi di quota o test espliciti su capacità posseduta.

Prima di una prima esecuzione, controlla il wrapper dalla root del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Il wrapper del repo rifiuta un binario Crabbox obsoleto che non dichiara `blacksmith-testbox`. Passa esplicitamente il provider anche se `.crabbox.yaml` contiene default per cloud posseduto.

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

Leggi il riepilogo JSON finale. I campi utili sono `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` e `totalMs`. Le esecuzioni una tantum di Crabbox con backend Blacksmith dovrebbero fermare automaticamente la Testbox; se un’esecuzione viene interrotta o la pulizia non è chiara, ispeziona le box live e ferma solo le box che hai creato:

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

Se Crabbox è il livello rotto ma Blacksmith stesso funziona, usa Blacksmith direttamente come fallback ristretto:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Se `blacksmith testbox list --all` e `blacksmith testbox status` funzionano ma i nuovi warmup restano `queued` senza IP o URL della run Actions dopo un paio di minuti, trattalo come pressione su provider Blacksmith, coda, fatturazione o limite dell’organizzazione. Ferma gli id in coda che hai creato, evita di avviare altre Testbox e sposta la prova sul percorso di capacità Crabbox posseduta qui sotto mentre qualcuno controlla dashboard, fatturazione e limiti dell’organizzazione di Blacksmith.

Escala alla capacità Crabbox posseduta solo quando Blacksmith non è disponibile, è limitato dalla quota, manca dell’ambiente necessario o la capacità posseduta è esplicitamente l’obiettivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sotto pressione AWS, evita `class=beast` a meno che l’attività richieda davvero CPU di classe 48xlarge. Una richiesta `beast` parte da 192 vCPU ed è il modo più facile per raggiungere la quota regionale EC2 Spot o On-Demand Standard. I default di `.crabbox.yaml` posseduto dal repo sono `standard`, più regioni di capacità e `capacity.hints: true`, così i lease AWS negoziati stampano regione/market selezionati, pressione sulla quota, fallback Spot e avvisi di classe sotto alta pressione. Usa `fast` per controlli ampi più pesanti, `large` solo dopo che standard/fast non bastano, e `beast` solo per lane eccezionali CPU-bound come suite completa o matrici Docker di tutti i plugin, validazione esplicita di release/bloccanti o profiling delle prestazioni ad alto numero di core. Non usare `beast` per `pnpm check:changed`, test focalizzati, lavoro solo docs, lint/controllo tipi ordinari, piccole riproduzioni E2E o triage di outage Blacksmith. Usa `--market on-demand` per la diagnosi della capacità, così la volatilità del market Spot non viene mescolata al segnale.

`.crabbox.yaml` possiede i default di provider, sincronizzazione e idratazione GitHub Actions per le lane cloud possedute. Esclude `.git` locale, così il checkout Actions idratato mantiene i propri metadati Git remoti invece di sincronizzare remoti e object store locali del maintainer, ed esclude artefatti locali di runtime/build che non devono mai essere trasferiti. `.github/workflows/crabbox-hydrate.yml` possiede checkout, configurazione Node/pnpm, fetch di `origin/main` e passaggio dell’ambiente non segreto per i comandi cloud posseduti `crabbox run --id <cbx_id>`.

## Correlati

- [Panoramica dell’installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
