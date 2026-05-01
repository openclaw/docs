---
read_when:
    - Devi capire perché un processo CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
summary: Grafo dei job CI, gate di ambito, umbrella di rilascio ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-01T08:28:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: aea06f9f336f9a478a284473b5c5f38730b87837b1acb0390161bf2c455f6c41
    source_path: ci.md
    workflow: 16
---

La CI di OpenClaw viene eseguita a ogni push su `main` e a ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali `workflow_dispatch` aggirano intenzionalmente lo scoping intelligente e distribuiscono l'intero grafo per release candidate e validazioni ampie. Le lane Android restano opt-in tramite `include_android`. La copertura dei plugin riservata alle release vive nel workflow separato [`Plugin Prerelease`](#plugin-prerelease) e viene eseguita solo da [`Full Release Validation`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                        | Quando viene eseguito             |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Rileva modifiche solo alla documentazione, ambiti modificati, extension modificate e costruisce il manifesto della CI | Sempre su push e PR non draft     |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                          | Sempre su push e PR non draft     |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                  | Sempre su push e PR non draft     |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                            | Sempre su push e PR non draft     |
| `check-dependencies`             | Passaggio Knip solo sulle dipendenze di produzione più guardia della allowlist dei file inutilizzati | Modifiche rilevanti per Node       |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli sugli artefatti compilati e artefatti downstream riutilizzabili | Modifiche rilevanti per Node       |
| `checks-fast-core`               | Lane rapide di correttezza Linux, come controlli bundled/plugin-contract/protocol            | Modifiche rilevanti per Node       |
| `checks-fast-contracts-channels` | Controlli sharded dei contratti dei canali con un risultato di controllo aggregato stabile    | Modifiche rilevanti per Node       |
| `checks-node-core-test`          | Shard dei test core Node, escluse le lane canale, bundled, contratti ed extension             | Modifiche rilevanti per Node       |
| `check`                          | Equivalente sharded del gate locale principale: tipi prod, lint, guardie, tipi dei test e smoke rigoroso | Modifiche rilevanti per Node       |
| `check-additional`               | Shard di architettura, boundary, guardie delle superfici delle extension, package-boundary e gateway-watch | Modifiche rilevanti per Node       |
| `build-smoke`                    | Smoke test della CLI compilata e smoke della memoria all'avvio                               | Modifiche rilevanti per Node       |
| `checks`                         | Verificatore per i test canale sugli artefatti compilati                                     | Modifiche rilevanti per Node       |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità con Node 22                                          | Dispatch manuale CI per release    |
| `check-docs`                     | Controlli di formattazione documentazione, lint e link interrotti                            | Documentazione modificata          |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                    | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Test specifici Windows su processi/percorsi più regressioni condivise sugli specifier di import runtime | Modifiche rilevanti per Windows    |
| `macos-node`                     | Lane di test TypeScript macOS usando gli artefatti compilati condivisi                       | Modifiche rilevanti per macOS      |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS      |
| `android`                        | Unit test Android per entrambe le flavor più una build APK debug                             | Modifiche rilevanti per Android    |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti Codex dopo attività attendibile                    | Successo CI su main o dispatch manuale |

## Ordine fail-fast

1. `preflight` decide quali lane esistono effettivamente. Le logiche `docs-scope` e `changed-scope` sono step all'interno di questo job, non job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumatori downstream possono partire appena la build condivisa è pronta.
4. Dopo di ciò vengono distribuite le lane più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare i job superati come `cancelled` quando un push più recente arriva sulla stessa PR o sullo stesso ref `main`. Consideralo rumore della CI, salvo che anche l'esecuzione più recente per lo stesso ref stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()` così segnalano comunque i normali fallimenti degli shard, ma non restano in coda dopo che l'intero workflow è già stato superato. La chiave automatica di concorrenza della CI è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di code non può bloccare indefinitamente le esecuzioni main più recenti. Le esecuzioni manuali della suite completa usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Ambito e instradamento

La logica di ambito vive in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa comportare il manifesto preflight come se ogni area con ambito fosse cambiata.

- **Le modifiche al workflow CI** validano il grafo CI Node più il linting dei workflow, ma da sole non forzano le build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del sorgente di piattaforma.
- **Le modifiche solo di routing CI, modifiche selezionate a fixture economiche dei test core e modifiche ristrette a helper/test-routing dei contratti dei plugin** usano un percorso rapido del manifesto solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei plugin bundled e matrici di guardie aggiuntive quando la modifica è limitata alle superfici di routing o helper che il task rapido esercita direttamente.
- **I controlli Node Windows** sono limitati a wrapper specifici Windows per processi/percorsi, helper runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate così ogni job resta piccolo senza sovra-riservare runner: i contratti dei canali vengono eseguiti come tre shard ponderati, le piccole lane unit core sono abbinate, auto-reply viene eseguito come quattro worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentic gateway/plugin sono distribuite sui job agentic Node esistenti solo sorgente invece di attendere gli artefatti compilati. I test ampi di browser, QA, media e plugin vari usano le rispettive configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. Gli shard include-pattern registrano voci di timing usando il nome dello shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro compile/canary di package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard della guardia boundary esegue le sue piccole guardie indipendenti in parallelo dentro un singolo job. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. La flavor third-party non ha un source set o un manifest separato; la sua lane di unit test compila comunque la flavor con i flag BuildConfig SMS/call-log, evitando al contempo un job duplicato di packaging dell'APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo sulle dipendenze di produzione fissato all'ultima versione di Knip, con l'età minima di release di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i risultati di Knip sui file di produzione inutilizzati con `scripts/deadcode-unused-files.allowlist.mjs`. La guardia sui file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce allowlist obsoleta, preservando al contempo superfici intenzionali di plugin dinamici, generate, di build, live-test e bridge di package che Knip non può risolvere staticamente.

## Dispatch manuali

I dispatch manuali della CI eseguono lo stesso grafo di job della CI normale ma forzano ogni lane con ambito non Android: shard Linux Node, shard dei plugin bundled, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, build smoke, controlli documentazione, Skills Python, Windows, macOS e i18n Control UI. I dispatch manuali CI autonomi eseguono Android solo con `include_android=true`; l'umbrella della release completa abilita Android passando `include_android=true`. I controlli statici di prerelease dei plugin, lo shard `agentic-plugins` solo release, lo sweep batch completo delle extension e le lane Docker di prerelease dei plugin sono esclusi dalla CI. La suite Docker di prerelease viene eseguita solo quando `Full Release Validation` dispatcha il workflow separato `Plugin Prerelease` con il gate release-validation abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa di release candidate non viene annullata da un altro push o da un'esecuzione PR sullo stesso ref. L'input opzionale `target_ref` consente a un chiamante attendibile di eseguire quel grafo rispetto a un branch, tag o SHA di commit completo, usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Esecutore                        | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza rapidi e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratto/bundle, controlli del contratto dei canali suddivisi in shard, shard di `check` tranne lint, shard e aggregati di `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; anche la preflight install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard delle Plugin a peso inferiore, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test delle Plugin in bundle, `android`                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (abbastanza sensibile alla CPU che 8 vCPU costavano più di quanto facessero risparmiare); build Docker install-smoke (il tempo di coda a 32 vCPU costava più di quanto facesse risparmiare)                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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

## Convalida completa della release

`Full Release Validation` è il workflow ombrello manuale per "eseguire tutto prima della release". Accetta un branch, un tag o uno SHA di commit completo, avvia il workflow manuale `CI` con quel target, avvia `Plugin Prerelease` per la prova di soli release Plugin/pacchetto/static/Docker, e avvia `OpenClaw Release Checks` per install smoke, accettazione pacchetto, suite del percorso di release Docker, live/E2E, OpenWebUI, parità QA Lab, Matrix e corsie Telegram. Può anche eseguire il workflow post-pubblicazione `NPM Telegram Beta E2E` quando viene fornita una specifica di pacchetto pubblicata.

Vedi [Convalida completa della release](/it/reference/full-release-validation) per la
matrice degli stage, i nomi esatti dei job del workflow, le differenze tra profili, gli artefatti e
gli handle di riesecuzione mirati.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di release. I
workflow manuali di release usano per impostazione predefinita `stable`; usa `full` solo quando
vuoi intenzionalmente la matrice ampia consultiva provider/media.

- `minimum` mantiene le corsie OpenAI/core più rapide critiche per la release.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue la matrice ampia consultiva provider/media.

L'ombrello registra gli id delle esecuzioni figlie avviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato dell'ombrello e il riepilogo dei tempi.

Per il recupero, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per una candidata release, `ci` solo per il normale figlio CI completo, `plugin-prerelease` solo per il figlio di prerelease delle Plugin, `release-checks` per ogni figlio di release, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene limitata la riesecuzione di una box di release fallita dopo una correzione mirata.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere il ref selezionato una sola volta in un tarball `release-package-under-test`, poi passa quell'artefatto sia al workflow Docker del percorso di release live/E2E sia allo shard di accettazione pacchetto. Questo mantiene coerenti i byte del pacchetto tra le box di release ed evita di ripacchettare lo stesso candidato in più job figli.

Le esecuzioni duplicate di `Full Release Validation` per `ref=main` e `rerun_group=all`
sostituiscono l'ombrello precedente. Il monitor padre annulla qualsiasi workflow figlio che
ha già avviato quando il padre viene annullato, così la convalida main più recente
non resta dietro una vecchia esecuzione di release-check di due ore. La convalida di branch/tag
di release e i gruppi di riesecuzione mirati mantengono `cancel-in-progress: false`.

## Shard live ed E2E

Il figlio live/E2E di release mantiene una copertura nativa ampia di `pnpm test:live`, ma la esegue come shard nominati tramite `scripts/test-live-shard.mjs` invece di un unico job seriale:

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

Questo mantiene la stessa copertura dei file rendendo più semplice rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi aggregati degli shard `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima del setup. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container non sono il posto giusto per avviare test Docker annidati.

Gli shard live model/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per commit selezionato. Il workflow live di release crea e pubblica quell'immagine una sola volta, poi gli shard Docker live model, Gateway suddiviso per provider, backend CLI, bind ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gli shard Docker del Gateway hanno limiti espliciti di `timeout` a livello di script inferiori al timeout del job del workflow, così un container bloccato o un percorso di cleanup fallisce rapidamente invece di consumare l'intero budget dei release-check. Se quegli shard ricompilano indipendentemente il target Docker completo dei sorgenti, l'esecuzione di release è configurata male e sprecherà tempo reale su build immagine duplicate.

## Accettazione pacchetto

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diversa dalla CI normale: la CI normale valida l'albero dei sorgenti, mentre l'accettazione pacchetto valida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo installazione o aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un singolo candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa origine, workflow ref, package ref, versione, SHA-256 e profilo nel riepilogo dello step GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, valida l'inventario del tarball, prepara le immagini Docker con digest del pacchetto quando necessario ed esegue le lane Docker selezionate su quel pacchetto invece di creare il pacchetto dal checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara una sola volta il pacchetto e le immagini condivise, poi distribuisce quelle lane come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; un dispatch Telegram autonomo può comunque installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la lane Telegram facoltativa sono fallite.

### Origini dei candidati

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta, come `openclaw@2026.4.27-beta.2`. Usalo per l'accettazione di beta/stable pubblicate.
- `source=ref` crea il pacchetto da un branch, tag o SHA completo di commit `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in un worktree scollegato e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un singolo `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per gli artefatti condivisi esternamente.

Tieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice attendibile del workflow/harness che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all'harness di test corrente di validare commit sorgente attendibili meno recenti senza eseguire la vecchia logica del workflow.

### Profili della suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocchi completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatte; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura plugin offline, quindi la validazione del pacchetto pubblicato non dipende dalla disponibilità live di ClawHub. La lane Telegram facoltativa riusa l'artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per i dispatch autonomi.

I controlli di rilascio chiamano Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` e `telegram_mode=mock-openai`. I blocchi Docker del percorso di rilascio coprono le lane sovrapposte di pacchetto/aggiornamento/plugin; Package Acceptance mantiene la prova nativa dell'artefatto per compatibilità dei canali in bundle, plugin offline e Telegram sullo stesso tarball di pacchetto risolto. I controlli di rilascio cross-OS continuano a coprire onboarding, installer e comportamento di piattaforma specifici del sistema operativo; la validazione di prodotto per pacchetto/aggiornamento dovrebbe partire da Package Acceptance. La lane Docker `published-upgrade-survivor` valida una baseline di pacchetto pubblicato per esecuzione. In Package Acceptance, il tarball `package-under-test` risolto è sempre il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata, con valore predefinito `openclaw@latest`; i comandi di riesecuzione delle lane fallite preservano quella baseline. Le esecuzioni locali possono impostare `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` su un pacchetto esatto, come `openclaw@2026.4.15`. La lane pubblicata configura la baseline con una ricetta di comando `openclaw config set` incorporata, poi registra gli step della ricetta in `summary.json`. Una copertura più ampia delle versioni precedenti dovrebbe suddividere Package Acceptance su valori esatti di `published_upgrade_survivor_baseline`. Anche le lane Windows per pacchetto e installer fresh verificano che un pacchetto installato possa importare un override del controllo browser da un percorso Windows assoluto grezzo. Lo smoke cross-OS OpenAI per turni agente usa come impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4-mini`, così la prova di installazione e Gateway resta rapida e deterministica.

### Finestre di compatibilità legacy

Package Acceptance ha finestre limitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può eliminare `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e può registrare nei log `update.channel` persistito mancante;
- gli smoke dei plugin possono leggere posizioni legacy dei record di installazione o accettare la persistenza mancante dei record di installazione del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione continuando però a richiedere che il record di installazione e il comportamento senza reinstallazione restino invariati.

Il pacchetto pubblicato `2026.4.26` può anche emettere avvisi per file di timestamp dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di avvisare o saltare.

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

Durante il debug di un'esecuzione Package Acceptance fallita, parti dal riepilogo di `resolve_package` per confermare origine del pacchetto, versione e SHA-256. Poi esamina l'esecuzione figlia `docker_acceptance` e i suoi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di riesecuzione. Preferisci rieseguire il profilo del pacchetto fallito o le lane Docker esatte invece di rieseguire l'intera validazione di rilascio.

## Smoke di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/pacchetto, modifiche a pacchetti/manifest di plugin in bundle o superfici core plugin/canale/Gateway/Plugin SDK esercitate dai job smoke Docker. Le modifiche ai soli sorgenti dei plugin in bundle, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido costruisce una volta l'immagine del Dockerfile root, controlla la CLI, esegue lo smoke CLI di eliminazione agents shared-workspace, esegue l'e2e container gateway-network, verifica un argomento di build per un'estensione in bundle ed esegue il profilo Docker limitato dei plugin in bundle entro un timeout aggregato del comando di 240 secondi (ogni esecuzione Docker di scenario ha un limite separato).
- **Percorso completo** mantiene l'installazione del pacchetto QR e la copertura Docker/aggiornamento dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di rilascio workflow-call e pull request che toccano davvero superfici installer/pacchetto/Docker. In modalità completa, install-smoke prepara o riusa una singola immagine smoke del Dockerfile root GHCR per lo SHA di destinazione, poi esegue installazione del pacchetto QR, smoke del Dockerfile root/Gateway, smoke installer/aggiornamento e l'E2E Docker rapido dei plugin in bundle come job separati, così il lavoro sull'installer non resta in attesa dietro gli smoke dell'immagine root.

I push su `main` (inclusi i merge commit) non forzano il percorso completo; quando la logica di ambito delle modifiche richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di rilascio.

Lo smoke lento del provider di immagini con installazione globale Bun è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di rilascio, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma pull request e push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione.

## E2E Docker locale

`pnpm test:docker:all` precompila una singola immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e costruisce due immagini condivise `scripts/e2e/Dockerfile`:

- un runner Node/Git essenziale per lane installer/aggiornamento/dipendenze plugin;
- un'immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l'immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per le lane normali.                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool finale sensibile ai provider.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti affinché i provider non applichino throttling.                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane di installazione npm concorrenti.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Intervallo tra gli avvii delle lane per evitare picchi di creazione del daemon Docker; imposta `0` per nessun intervallo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout fallback per lane (120 minuti); alcune lane live/finali selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostato | `1` stampa il piano dello scheduler senza eseguire le lane.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostato | Elenco esatto di lane separate da virgole; salta lo smoke di pulizia così gli agenti possono riprodurre una singola lane fallita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché non rilascia capacità. L'aggregato locale esegue i preflight di Docker, rimuove i container E2E OpenClaw obsoleti, emette lo stato delle lane attive, persiste i tempi delle lane per l'ordinamento longest-first e, per impostazione predefinita, interrompe la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quali pacchetto, tipo di immagine, immagine live, lane e copertura credenziali siano necessari. `scripts/docker-e2e.mjs` converte poi quel piano in output e riepiloghi GitHub. In alternativa pacchettizza OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artifact del pacchetto dalla run corrente oppure scarica un artifact del pacchetto da `package_artifact_run_id`; valida l'inventario del tarball; compila e pubblica immagini Docker E2E GHCR bare/functional con tag basati sul digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riutilizza gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti basate sul digest del pacchetto invece di ricompilarle. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream di registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico della CI.

### Chunk del percorso di release

La copertura Docker di release esegue job a chunk più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine di cui ha bisogno ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

I chunk Docker di release attuali sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, da `plugins-runtime-install-a` a `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` e `bundled-channels-contracts`. Il chunk aggregato `bundled-channels` resta disponibile per riesecuzioni manuali one-shot, e `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane dell'installer dei provider. Il chunk `bundled-channels` esegue lane separate `bundled-channel-*` e `bundled-channel-update-*` invece della lane seriale all-in-one `bundled-channel-deps`.

OpenWebUI viene incluso in `plugins-runtime-services` quando la copertura completa release-path lo richiede, e mantiene un chunk autonomo `openwebui` solo per dispatch limitati a OpenWebUI. Le lane di aggiornamento bundled-channel ritentano una volta in caso di errori di rete npm transitori.

Ogni chunk carica `.artifacts/docker-tests/` con log delle lane, tempi, `summary.json`, `failures.json`, tempi di fase, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate sulle immagini preparate invece dei job a chunk, mantenendo il debug delle lane fallite limitato a un job Docker mirato e preparando, scaricando o riutilizzando l'artifact del pacchetto per quella run; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine live-test per quella riesecuzione. I comandi GitHub generati di riesecuzione per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando quei valori esistono, così una lane fallita può riutilizzare esattamente lo stesso pacchetto e le stesse immagini della run fallita.

```bash
pnpm test:docker:rerun <run-id>      # scarica gli artifact Docker e stampa i comandi di riesecuzione mirati combinati/per lane
pnpm test:docker:timings <summary>   # riepiloghi delle lane lente e del percorso critico di fase
```

Il workflow live/E2E pianificato esegue quotidianamente l'intera suite Docker release-path.

## Prerelease dei Plugin

`Plugin Prerelease` è una copertura prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch CI manuali autonomi mantengono quella suite disattivata. Bilancia i test dei plugin in bundle su otto worker extension; quei job shard delle extension eseguono fino a due gruppi di configurazione plugin alla volta, con un worker Vitest per gruppo e un heap Node più grande, così i batch di plugin con import pesanti non creano job CI aggiuntivi. Il percorso prerelease Docker solo release raggruppa lane Docker mirate in piccoli gruppi per evitare di riservare decine di runner per job da uno a tre minuti.

## QA Lab

QA Lab ha lane CI dedicate fuori dal workflow principale smart-scoped.

- Il workflow `Parity gate` viene eseguito su modifiche PR corrispondenti e su dispatch manuale; compila il runtime QA privato e confronta i pack agentici mock GPT-5.5 e Opus 4.6.
- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce in job paralleli il mock parity gate, la lane Matrix live e le lane Telegram e Discord live. I job live usano l'ambiente `qa-live-shared`, e Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza dei modelli live e dal normale startup dei provider-plugin. Il gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI sottoposta a checkout lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; un dispatch manuale `matrix_profile=all` suddivide sempre la copertura Matrix completa nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il relativo gate di parità QA esegue i pack candidate e baseline come job lane paralleli, poi scarica entrambi gli artifact in un piccolo job di report per il confronto finale della parità.

Non mettere il percorso di landing delle PR dietro `Parity gate` a meno che la modifica tocchi davvero il runtime QA, la parità dei model-pack o una superficie di proprietà del workflow di parità. Per normali correzioni di canali, configurazione, documentazione o unit test, trattalo come un segnale opzionale e segui invece le prove CI/check con ambito definito.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non la scansione completa del repository. Le run giornaliere, manuali e di protezione per pull request non draft analizzano il codice dei workflow Actions più le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta confidenza filtrate su `security-severity` high/critical.

La protezione per pull request resta leggera: parte solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. CodeQL Android e macOS restano fuori dai default delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron e baseline gateway                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei plugin di canale, gateway, Plugin SDK, secrets, punti di contatto audit   |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core SSRF, parsing IP, protezione di rete, web-fetch e policy SSRF del Plugin SDK                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione processi, consegna outbound e gate di esecuzione tool degli agenti                                    |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di trust per installazione Plugin, loader, manifest, registry, staging delle dipendenze runtime, caricamento sorgenti e contratto pacchetto Plugin SDK |

### Shard di sicurezza specifici della piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Linux Blacksmith più piccolo accettato dalla sanity del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati di build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Tenuto fuori dai default giornalieri perché la build macOS domina il runtime anche quando è pulita.

### Categorie Critical Quality

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript non di sicurezza con severità errore su superfici ristrette ad alto valore, sul runner Linux Blacksmith più piccolo. La sua protezione per pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione comandi/modelli/tool degli agenti e dispatch delle risposte, codice di schema/migrazione/IO della configurazione, codice auth/secrets/sandbox/security, runtime dei canali core e dei plugin di canale in bundle, protocollo Gateway/server-method, runtime memoria/collante SDK, MCP/processo/consegna outbound, runtime provider/catalogo modelli, diagnostica sessione/code di consegna, loader plugin, contratto Plugin SDK/pacchetto o runtime risposte Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow di qualità eseguono tutti e dodici gli shard di qualità PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Categoria                                               | Superficie                                                                                                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice per confini di sicurezza di autenticazione, segreti, sandbox, cron e gateway                                                                                       |
| `/codeql-critical-quality/config-boundary`              | Schema di configurazione, migrazione, normalizzazione e contratti IO                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione del canale core e del Plugin di canale in bundle                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione dei comandi, dispatch di modelli/provider, dispatch e code di risposta automatica, e contratti runtime del control plane ACP                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK dell'host di memoria, facade runtime della memoria, alias dell'SDK del Plugin di memoria, collante di attivazione runtime della memoria e comandi doctor della memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda di risposta, code di consegna delle sessioni, helper di binding/consegna delle sessioni in uscita, superfici di eventi diagnostici/bundle di log e contratti CLI del doctor delle sessioni |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso dell'SDK del Plugin, helper per payload/chunking/runtime delle risposte, opzioni di risposta del canale, code di consegna e helper di binding sessione/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione del catalogo dei modelli, autenticazione e discovery dei provider, registrazione runtime dei provider, default/cataloghi dei provider e registri web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap dell'interfaccia di controllo, persistenza locale, flussi di controllo del Gateway e contratti runtime del control plane delle attività                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime core per fetch/search web, IO dei media, comprensione dei media, generazione di immagini e generazione di media                                        |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registry, superficie pubblica ed entrypoint dell'SDK del Plugin                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente dell'SDK del Plugin lato pacchetto pubblicato e helper dei contratti dei pacchetti Plugin                                                                        |

La qualità resta separata dalla sicurezza, così i finding di qualità possono essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin in bundle dovrebbe essere aggiunta di nuovo come lavoro successivo con ambito o shard solo dopo che i profili ristretti avranno runtime e segnale stabili.

## Workflow di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una corsia di manutenzione Codex guidata dagli eventi per mantenere la documentazione esistente allineata alle modifiche arrivate di recente. Non ha una schedulazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni da workflow-run vengono saltate quando `main` è avanzato o quando un'altra esecuzione non saltata di Docs Agent è stata creata nell'ultima ora. Quando viene eseguito, esamina l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino all'attuale `main`, quindi un'esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sulla documentazione.

### Test Performance Agent

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex guidata dagli eventi per i test lenti. Non ha una schedulazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate di attività giornaliero. La corsia genera un report delle prestazioni Vitest raggruppato dell'intera suite, consente a Codex di apportare solo piccole correzioni delle prestazioni dei test che preservano la copertura invece di refactor ampi, quindi riesegue il report dell'intera suite e rifiuta le modifiche che riducono il conteggio baseline dei test superati. Se la baseline contiene test in errore, Codex può correggere solo failure ovvie e il report dell'intera suite dopo l'agent deve passare prima che qualsiasi cosa venga committata. Quando `main` avanza prima che il push del bot arrivi, la corsia esegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub, così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

### PR duplicati dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer dedicato alla pulizia dei duplicati dopo il land. Per impostazione predefinita è in dry-run e chiude solo i PR elencati esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che il PR arrivato sia stato mergiato e che ogni duplicato abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle corsie modificate vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ambito ampio della piattaforma CI:

- le modifiche di produzione core eseguono il typecheck di core prod e core test più lint/guard core;
- le modifiche solo ai test core eseguono solo il typecheck dei test core più lint core;
- le modifiche di produzione delle extension eseguono il typecheck di prod extension e test extension più lint extension;
- le modifiche solo ai test delle extension eseguono il typecheck dei test extension più lint extension;
- le modifiche all'SDK del Plugin pubblico o ai contratti dei Plugin si estendono al typecheck delle extension perché le extension dipendono da quei contratti core (gli sweep Vitest delle extension restano lavoro di test esplicito);
- i bump di versione solo dei metadati di release eseguono controlli mirati su versione/configurazione/dipendenze root;
- le modifiche root/config sconosciute falliscono in sicurezza verso tutte le corsie di controllo.

Il routing locale dei test modificati vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono quei test, le modifiche al sorgente preferiscono mapping espliciti, poi test sibling e dipendenti del grafo degli import. La configurazione condivisa di consegna nelle stanze di gruppo è uno dei mapping espliciti: le modifiche alla configurazione delle risposte visibili nel gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema del message-tool passano attraverso i test core delle risposte più le regressioni di consegna Discord e Slack, così una modifica di default condivisa fallisce prima del primo push del PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza ampia sull'harness da rendere l'insieme mappato economico un proxy non affidabile.

## Validazione Testbox

Esegui Testbox dalla root del repo e preferisci una box appena riscaldata per prove ampie. Prima di spendere un gate lento su una box che è stata riutilizzata, scaduta o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro la box.

Il sanity check fallisce rapidamente quando file root richiesti come `pnpm-lock.yaml` sono spariti o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato di sincronizzazione remoto non è una copia affidabile del PR; ferma quella box e riscaldane una nuova invece di fare debug del failure del test di prodotto. Per PR intenzionali con molte eliminazioni, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quella esecuzione di sanity.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sincronizzazione per più di cinque minuti senza output post-sync. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quel guard, oppure usa un valore in millisecondi più grande per diff locali insolitamente grandi.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
