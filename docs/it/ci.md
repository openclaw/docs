---
read_when:
    - È necessario capire perché un job CI è stato eseguito o meno
    - Stai eseguendo il debug di un controllo GitHub Actions non riuscito
    - Stai coordinando un'esecuzione o una riesecuzione della validazione del rilascio
summary: Grafo dei job CI, gate di ambito, ombrelli di release ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-30T08:41:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI viene eseguito a ogni push su `main` e per ogni pull request. Il job `preflight` classifica il diff e disattiva le lane costose quando sono cambiate solo aree non correlate. Le esecuzioni manuali tramite `workflow_dispatch` ignorano intenzionalmente lo smart scoping ed espandono l'intero grafo per candidati di release e convalide ampie. Le lane Android restano facoltative tramite `include_android`. La copertura dei Plugin solo per release si trova nel workflow separato [`Plugin Prerelease`](#plugin-prerelease) e viene eseguita solo da [`Full Release Validation`](#full-release-validation) o da un dispatch manuale esplicito.

## Panoramica della pipeline

| Job                              | Scopo                                                                                        | Quando viene eseguito               |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Rileva modifiche solo ai documenti, ambiti modificati, estensioni modificate e crea il manifest CI | Sempre su push e PR non draft       |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                          | Sempre su push e PR non draft       |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli avvisi npm                   | Sempre su push e PR non draft       |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                            | Sempre su push e PR non draft       |
| `check-dependencies`             | Passaggio Knip solo sulle dipendenze di produzione più guard dell'allowlist dei file inutilizzati | Modifiche rilevanti per Node        |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli sugli artefatti compilati e artefatti downstream riutilizzabili | Modifiche rilevanti per Node        |
| `checks-fast-core`               | Lane rapide di correttezza Linux, come controlli bundled/plugin-contract/protocol            | Modifiche rilevanti per Node        |
| `checks-fast-contracts-channels` | Controlli sharded dei contratti dei canali con risultato di controllo aggregato stabile      | Modifiche rilevanti per Node        |
| `checks-node-core-test`          | Shard dei test core Node, esclusi canali, bundled, contratti e lane delle estensioni         | Modifiche rilevanti per Node        |
| `check`                          | Equivalente sharded del gate locale principale: tipi prod, lint, guard, tipi dei test e smoke rigoroso | Modifiche rilevanti per Node        |
| `check-additional`               | Shard per architettura, boundary, guard della superficie delle estensioni, package-boundary e gateway-watch | Modifiche rilevanti per Node        |
| `build-smoke`                    | Smoke test della CLI compilata e smoke sulla memoria di avvio                                | Modifiche rilevanti per Node        |
| `checks`                         | Verificatore per i test dei canali sugli artefatti compilati                                 | Modifiche rilevanti per Node        |
| `checks-node-compat-node22`      | Lane di build e smoke per compatibilità Node 22                                              | Dispatch CI manuale per release     |
| `check-docs`                     | Formattazione, lint e controlli dei link interrotti della documentazione                     | Documentazione modificata           |
| `skills-python`                  | Ruff + pytest per Skills con backend Python                                                  | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Test specifici Windows su processi/percorsi più regressioni condivise degli import specifier runtime | Modifiche rilevanti per Windows     |
| `macos-node`                     | Lane di test TypeScript su macOS usando gli artefatti compilati condivisi                    | Modifiche rilevanti per macOS       |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS       |
| `android`                        | Test unitari Android per entrambi i flavor più una build APK debug                           | Modifiche rilevanti per Android     |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti con Codex dopo attività attendibile                | Successo della CI su main o dispatch manuale |

## Ordine fail-fast

1. `preflight` decide quali lane esistono. La logica `docs-scope` e `changed-scope` è composta da step all'interno di questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice di artefatti e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide, così i consumer downstream possono partire appena la build condivisa è pronta.
4. Le lane più pesanti di piattaforma e runtime si espandono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

GitHub può contrassegnare job superati come `cancelled` quando un push più recente arriva sulla stessa PR o sul ref `main`. Consideralo rumore CI, a meno che anche l'esecuzione più recente per lo stesso ref stia fallendo. I controlli aggregati degli shard usano `!cancelled() && always()`, quindi segnalano comunque i normali fallimenti degli shard, ma non si accodano dopo che l'intero workflow è già stato superato. La chiave di concorrenza automatica della CI è versionata (`CI-v7-*`), così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le nuove esecuzioni su main. Le esecuzioni manuali dell'intera suite usano `CI-manual-v1-*` e non annullano le esecuzioni in corso.

## Ambito e instradamento

La logica di ambito si trova in `scripts/ci-changed-scope.mjs` ed è coperta da test unitari in `src/scripts/ci-changed-scope.test.ts`. Il dispatch manuale salta il rilevamento changed-scope e fa agire il manifest preflight come se ogni area con ambito fosse cambiata.

- **Le modifiche ai workflow CI** convalidano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle lane di piattaforma restano limitate alle modifiche del sorgente della piattaforma.
- **Le modifiche solo all'instradamento CI, alcune modifiche economiche ai fixture dei core-test e modifiche ristrette agli helper/test-routing dei contratti Plugin** usano un percorso manifest rapido solo Node: `preflight`, sicurezza e un singolo task `checks-fast-core`. Quel percorso salta artefatti di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei Plugin bundled e matrici di guard aggiuntive quando la modifica è limitata alle superfici di instradamento o helper esercitate direttamente dal task rapido.
- **I controlli Node Windows** sono limitati a wrapper specifici Windows per processi/percorsi, helper dei runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella lane; modifiche non correlate a sorgente, Plugin, install-smoke e solo test restano sulle lane Linux Node.

Le famiglie di test Node più lente sono divise o bilanciate così ogni job resta piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard ponderati, le piccole lane unit core sono accoppiate, auto-reply viene eseguito come quattro worker bilanciati (con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing) e le configurazioni agentic gateway/Plugin sono distribuite tra i job Node agentic esistenti solo sorgente invece di attendere gli artefatti compilati. I test ampi browser, QA, media e Plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all Plugin condiviso. Gli shard include-pattern registrano voci di timing usando il nome dello shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` mantiene insieme il lavoro di compilazione/canary package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard del guard boundary esegue i suoi piccoli guard indipendenti in parallelo dentro un singolo job. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in parallelo dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati.

La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest` e poi compila l'APK debug Play. Il flavor di terze parti non ha un source set o manifest separato; la sua lane di test unitari compila comunque il flavor con i flag BuildConfig per SMS/call-log, evitando al contempo un job duplicato di packaging APK debug a ogni push rilevante per Android.

Lo shard `check-dependencies` esegue `pnpm deadcode:dependencies` (un passaggio Knip solo sulle dipendenze di produzione fissato all'ultima versione di Knip, con l'età minima di rilascio di pnpm disabilitata per l'installazione `dlx`) e `pnpm deadcode:unused-files`, che confronta i rilevamenti di file inutilizzati di produzione di Knip con `scripts/deadcode-unused-files.allowlist.mjs`. Il guard dei file inutilizzati fallisce quando una PR aggiunge un nuovo file inutilizzato non revisionato o lascia una voce obsoleta nell'allowlist, preservando al tempo stesso le superfici intenzionali di Plugin dinamici, generati, build, test live e bridge di pacchetti che Knip non può risolvere staticamente.

## Dispatch manuali

I dispatch manuali della CI eseguono lo stesso grafo di job della CI normale, ma forzano tutte le lane con ambito non Android: shard Linux Node, shard dei Plugin bundled, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, build smoke, controlli della documentazione, Skills Python, Windows, macOS e i18n della Control UI. I dispatch CI manuali autonomi eseguono Android solo con `include_android=true`; l'ombrello di release completa abilita Android passando `include_android=true`. I controlli statici di prerelease dei Plugin, lo shard `agentic-plugins` solo per release, la scansione batch completa delle estensioni e le lane Docker di prerelease dei Plugin sono esclusi dalla CI. La suite Docker prerelease viene eseguita solo quando `Full Release Validation` invia il workflow separato `Plugin Prerelease` con il gate release-validation abilitato.

Le esecuzioni manuali usano un gruppo di concorrenza univoco, così una suite completa per candidato di release non viene annullata da un altro push o da un'esecuzione PR sullo stesso ref. L'input facoltativo `target_ref` consente a un chiamante attendibile di eseguire quel grafo rispetto a un branch, tag o SHA di commit completo usando il file workflow dal ref di dispatch selezionato.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Esecutori

| Esecutore                         | Attività                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                    | `preflight`, job di sicurezza veloci e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli veloci di protocollo/contratto/bundled, controlli sharded dei contratti dei canali, shard di `check` tranne lint, shard e aggregati di `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; il preflight di install-smoke usa anche Ubuntu ospitato da GitHub, così la matrice Blacksmith può accodarsi prima |
| `blacksmith-4vcpu-ubuntu-2404`    | `CodeQL Critical Quality`, shard Plugin a peso inferiore, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` e `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`    | `build-artifacts`, build-smoke, shard dei test Node Linux, shard dei test dei Plugin bundled, `android`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`   | `check-lint` (abbastanza sensibile alla CPU che 8 vCPU costavano più di quanto facessero risparmiare); build Docker install-smoke (il costo del tempo di coda a 32 vCPU era superiore al risparmio ottenuto)                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025`  | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`   | `macos-node` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest`  | `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## Convalida completa del rilascio

`Full Release Validation` è il workflow manuale ombrello per "eseguire tutto prima del rilascio". Accetta un ramo, un tag o uno SHA completo di commit, esegue il dispatch del workflow manuale `CI` con quel target, esegue il dispatch di `Plugin Prerelease` per la prova solo di rilascio di Plugin/pacchetto/statico/Docker, ed esegue il dispatch di `OpenClaw Release Checks` per install smoke, package acceptance, suite del percorso di rilascio Docker, live/E2E, OpenWebUI, parità QA Lab, Matrix e corsie Telegram. Può anche eseguire il workflow post-pubblicazione `NPM Telegram Beta E2E` quando viene fornita una specifica di pacchetto pubblicata.

`release_profile` controlla l'ampiezza live/provider passata ai controlli di rilascio:

- `minimum` mantiene le corsie OpenAI/core più veloci e critiche per il rilascio.
- `stable` aggiunge l'insieme stabile di provider/backend.
- `full` esegue l'ampia matrice consultiva provider/media.

L'ombrello registra gli ID delle esecuzioni figlie inviate, e il job finale `Verify full validation` ricontrolla le conclusioni correnti delle esecuzioni figlie e aggiunge tabelle dei job più lenti per ogni esecuzione figlia. Se un workflow figlio viene rieseguito e diventa verde, riesegui solo il job verificatore padre per aggiornare il risultato ombrello e il riepilogo dei tempi.

Per il ripristino, sia `Full Release Validation` sia `OpenClaw Release Checks` accettano `rerun_group`. Usa `all` per un candidato di rilascio, `ci` solo per il normale figlio CI completo, `release-checks` per ogni figlio di rilascio, oppure un gruppo più ristretto: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` sull'ombrello. Questo mantiene delimitata la riesecuzione di un box di rilascio fallito dopo una correzione mirata.

`OpenClaw Release Checks` usa il ref attendibile del workflow per risolvere una volta il ref selezionato in un tarball `release-package-under-test`, poi passa quell'artefatto sia al workflow Docker live/E2E del percorso di rilascio sia allo shard di package acceptance. Questo mantiene coerenti i byte del pacchetto tra i box di rilascio ed evita di impacchettare di nuovo lo stesso candidato in più job figli.

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
- shard media audio/video separati e shard musicali filtrati per provider

Questo mantiene la stessa copertura dei file rendendo più facile rieseguire e diagnosticare i fallimenti lenti dei provider live. I nomi degli shard aggregati `native-live-extensions-o-z`, `native-live-extensions-media` e `native-live-extensions-media-music` restano validi per riesecuzioni manuali una tantum.

Gli shard media live nativi vengono eseguiti in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creato dal workflow `Live Media Runner Image`. Quell'immagine preinstalla `ffmpeg` e `ffprobe`; i job media verificano solo i binari prima della configurazione. Mantieni le suite live basate su Docker sui normali runner Blacksmith: i job container sono il posto sbagliato per avviare test Docker annidati.

Gli shard live model/backend basati su Docker usano un'immagine condivisa separata `ghcr.io/openclaw/openclaw-live-test:<sha>` per ogni commit selezionato. Il workflow live di rilascio crea e pubblica quell'immagine una volta, poi gli shard Docker live model, Gateway, backend CLI, bind ACP e harness Codex vengono eseguiti con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Se questi shard ricostruiscono indipendentemente il target Docker completo del sorgente, l'esecuzione di rilascio è configurata in modo errato e sprecherà tempo reale in build di immagini duplicate.

## Package Acceptance

Usa `Package Acceptance` quando la domanda è "questo pacchetto OpenClaw installabile funziona come prodotto?" È diverso dalla CI normale: la CI normale convalida l'albero sorgente, mentre package acceptance convalida un singolo tarball tramite lo stesso harness Docker E2E che gli utenti esercitano dopo l'installazione o l'aggiornamento.

### Job

1. `resolve_package` esegue il checkout di `workflow_ref`, risolve un candidato pacchetto, scrive `.artifacts/docker-e2e-package/openclaw-current.tgz`, scrive `.artifacts/docker-e2e-package/package-candidate.json`, carica entrambi come artefatto `package-under-test` e stampa sorgente, ref del workflow, ref del pacchetto, versione, SHA-256 e profilo nel riepilogo del passaggio GitHub.
2. `docker_acceptance` chiama `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` e `package_artifact_name=package-under-test`. Il workflow riutilizzabile scarica quell'artefatto, convalida l'inventario del tarball, prepara immagini Docker package-digest quando necessario ed esegue le corsie Docker selezionate rispetto a quel pacchetto invece di impacchettare il checkout del workflow. Quando un profilo seleziona più `docker_lanes` mirate, il workflow riutilizzabile prepara il pacchetto e le immagini condivise una volta, poi distribuisce quelle corsie come job Docker mirati paralleli con artefatti univoci.
3. `package_telegram` chiama facoltativamente `NPM Telegram Beta E2E`. Viene eseguito quando `telegram_mode` non è `none` e installa lo stesso artefatto `package-under-test` quando Package Acceptance ne ha risolto uno; il dispatch Telegram autonomo può comunque installare una specifica npm pubblicata.
4. `summary` fa fallire il workflow se la risoluzione del pacchetto, l'accettazione Docker o la corsia Telegram facoltativa non sono riuscite.

### Sorgenti candidate

- `source=npm` accetta solo `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw come `openclaw@2026.4.27-beta.2`. Usalo per l’accettazione beta/stabile pubblicata.
- `source=ref` impacchetta un branch, tag o SHA di commit completo `package_ref` attendibile. Il resolver recupera branch/tag OpenClaw, verifica che il commit selezionato sia raggiungibile dalla cronologia dei branch del repository o da un tag di rilascio, installa le dipendenze in una worktree detached e lo impacchetta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` scarica un `.tgz` HTTPS; `package_sha256` è obbligatorio.
- `source=artifact` scarica un `.tgz` da `artifact_run_id` e `artifact_name`; `package_sha256` è facoltativo ma dovrebbe essere fornito per gli artefatti condivisi esternamente.

Mantieni separati `workflow_ref` e `package_ref`. `workflow_ref` è il codice del workflow/harness attendibile che esegue il test. `package_ref` è il commit sorgente che viene impacchettato quando `source=ref`. Questo consente all’harness di test corrente di validare commit sorgente attendibili più vecchi senza eseguire vecchia logica di workflow.

### Profili di suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` più `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk completi del percorso di rilascio Docker con OpenWebUI
- `custom` — `docker_lanes` esatti; obbligatorio quando `suite_profile=custom`

Il profilo `package` usa copertura offline dei plugin, così la validazione del pacchetto pubblicato non dipende dalla disponibilità live di ClawHub. La lane Telegram facoltativa riusa l’artefatto `package-under-test` in `NPM Telegram Beta E2E`, mantenendo il percorso della specifica npm pubblicata per dispatch standalone.

I controlli di rilascio chiamano Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` e `telegram_mode=mock-openai`. I chunk Docker del percorso di rilascio coprono le lane sovrapposte di package/update/plugin; Package Acceptance mantiene la prova di compatibilità bundled-channel nativa dell’artefatto, offline plugin e Telegram contro lo stesso tarball di pacchetto risolto. I controlli di rilascio cross-OS coprono ancora onboarding specifico per OS, installer e comportamento della piattaforma; la validazione product package/update dovrebbe iniziare con Package Acceptance. Le lane Windows packaged e installer fresh verificano anche che un pacchetto installato possa importare un override browser-control da un percorso Windows assoluto grezzo. Lo smoke OpenAI cross-OS agent-turn usa per impostazione predefinita `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando impostato, altrimenti `openai/gpt-5.4-mini`, così la prova di installazione e Gateway resta rapida e deterministica.

### Finestre di compatibilità legacy

Package Acceptance ha finestre limitate di compatibilità legacy per pacchetti già pubblicati. I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono usare il percorso di compatibilità:

- le voci QA private note in `dist/postinstall-inventory.json` possono puntare a file omessi dal tarball;
- `doctor-switch` può saltare il sottocaso di persistenza `gateway install --wrapper` quando il pacchetto non espone quel flag;
- `update-channel-switch` può potare `pnpm.patchedDependencies` mancanti dalla fixture git fittizia derivata dal tarball e può registrare `update.channel` persistito mancante;
- gli smoke dei plugin possono leggere posizioni legacy degli install-record o accettare la persistenza mancante dell’install-record del marketplace;
- `plugin-update` può consentire la migrazione dei metadati di configurazione continuando a richiedere che il comportamento di install record e no-reinstall resti invariato.

Anche il pacchetto pubblicato `2026.4.26` può emettere avvisi per file di stamp dei metadati di build locali che erano già stati rilasciati. I pacchetti successivi devono soddisfare i contratti moderni; le stesse condizioni falliscono invece di generare un avviso o venire saltate.

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

Quando esegui il debug di una run di package acceptance fallita, inizia dal riepilogo `resolve_package` per confermare sorgente del pacchetto, versione e SHA-256. Poi esamina la run figlia `docker_acceptance` e i suoi artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle lane, tempi delle fasi e comandi di rerun. Preferisci rieseguire il profilo package fallito o le lane Docker esatte invece di rieseguire l’intera validazione di rilascio.

## Smoke di installazione

Il workflow separato `Install Smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`.

- **Percorso rapido** viene eseguito per pull request che toccano superfici Docker/package, modifiche a pacchetti/manifest di plugin in bundle o superfici core plugin/channel/gateway/Plugin SDK esercitate dai job smoke Docker. Modifiche solo sorgente ai plugin in bundle, modifiche solo ai test e modifiche solo alla documentazione non riservano worker Docker. Il percorso rapido compila una volta l’immagine Dockerfile root, controlla la CLI, esegue lo smoke CLI agents delete shared-workspace, esegue l’e2e container gateway-network, verifica un argomento di build di un’estensione in bundle ed esegue il profilo Docker limitato bundled-plugin con un timeout aggregato del comando di 240 secondi (ogni run Docker dello scenario ha un limite separato).
- **Percorso completo** mantiene installazione del pacchetto QR e copertura Docker/update dell’installer per run pianificate notturne, dispatch manuali, controlli di rilascio workflow-call e pull request che toccano davvero superfici installer/package/Docker. In modalità completa, install-smoke prepara o riusa un’immagine smoke GHCR root Dockerfile per lo SHA target, poi esegue installazione del pacchetto QR, smoke root Dockerfile/gateway, smoke installer/update e il Docker E2E rapido bundled-plugin come job separati, così il lavoro dell’installer non resta in attesa dietro gli smoke dell’immagine root.

I push su `main` (inclusi i merge commit) non forzano il percorso completo; quando la logica changed-scope richiederebbe copertura completa su un push, il workflow mantiene lo smoke Docker rapido e lascia lo smoke di installazione completo alla validazione notturna o di rilascio.

Lo smoke lento Bun global install image-provider è controllato separatamente da `run_bun_global_install_smoke`. Viene eseguito nella pianificazione notturna e dal workflow dei controlli di rilascio, e i dispatch manuali di `Install Smoke` possono abilitarlo, ma pull request e push su `main` no. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull’installazione.

## Docker E2E locale

`pnpm test:docker:all` precompila un’immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm e compila due immagini condivise `scripts/e2e/Dockerfile`:

- un runner Node/Git minimale per lane installer/update/plugin-dependency;
- un’immagine funzionale che installa lo stesso tarball in `/app` per le lane di funzionalità normali.

Le definizioni delle lane Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`, la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs` e il runner esegue solo il piano selezionato. Lo scheduler seleziona l’immagine per lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` e `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, poi esegue le lane con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametri regolabili

| Variabile                              | Predefinito | Scopo                                                                                         |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | Numero di slot del pool principale per lane normali.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | Numero di slot del pool di coda sensibile ai provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | Limite di lane live concorrenti così i provider non applicano throttling.                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | Limite di lane concorrenti di installazione npm.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | Limite di lane multi-servizio concorrenti.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | Sfalsamento tra avvii di lane per evitare tempeste di create del demone Docker; imposta `0` per nessuno sfalsamento. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | Timeout di fallback per lane (120 minuti); lane live/tail selezionate usano limiti più stretti. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non impostato | `1` stampa il piano dello scheduler senza eseguire lane.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | non impostato | Elenco separato da virgole di lane esatte; salta lo smoke di cleanup così gli agenti possono riprodurre una lane fallita. |

Una lane più pesante del suo limite effettivo può comunque partire da un pool vuoto, poi viene eseguita da sola finché rilascia capacità. I preflight aggregati locali controllano Docker, rimuovono container OpenClaw E2E obsoleti, emettono lo stato delle lane attive, persistono i tempi delle lane per l’ordinamento longest-first e, per impostazione predefinita, interrompono la pianificazione di nuove lane in pool dopo il primo errore.

### Workflow live/E2E riutilizzabile

Il workflow live/E2E riutilizzabile chiede a `scripts/test-docker-all.mjs --plan-json` quale pacchetto, tipo di immagine, immagine live, lane e copertura credenziali sono richiesti. `scripts/docker-e2e.mjs` converte quindi quel piano in output e riepiloghi GitHub. Impacchetta OpenClaw tramite `scripts/package-openclaw-for-docker.mjs`, scarica un artefatto package della run corrente oppure scarica un artefatto package da `package_artifact_run_id`; valida l’inventario del tarball; compila e pubblica immagini Docker E2E GHCR bare/functional taggate con digest del pacchetto tramite la cache dei layer Docker di Blacksmith quando il piano richiede lane con pacchetto installato; e riusa gli input `docker_e2e_bare_image`/`docker_e2e_functional_image` forniti o immagini esistenti con digest del pacchetto invece di ricompilare. I pull delle immagini Docker vengono ritentati con un timeout limitato di 180 secondi per tentativo, così uno stream registry/cache bloccato viene ritentato rapidamente invece di consumare gran parte del percorso critico CI.

### Chunk del percorso di rilascio

La copertura Docker di rilascio esegue job chunked più piccoli con `OPENCLAW_SKIP_DOCKER_BUILD=1`, così ogni chunk scarica solo il tipo di immagine necessario ed esegue più lane tramite lo stesso scheduler ponderato:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Gli attuali chunk Docker della release sono `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, da `plugins-runtime-install-a` a `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` e `bundled-channels-contracts`. Il chunk aggregato `bundled-channels` resta disponibile per riesecuzioni manuali one-shot, e `plugins-runtime-core`, `plugins-runtime` e `plugins-integrations` restano alias aggregati di plugin/runtime. L'alias di lane `install-e2e` resta l'alias aggregato di riesecuzione manuale per entrambe le lane di installazione dei provider. Il chunk `bundled-channels` esegue lane suddivise `bundled-channel-*` e `bundled-channel-update-*` invece della lane seriale all-in-one `bundled-channel-deps`.

OpenWebUI viene incluso in `plugins-runtime-services` quando lo richiedono le coperture complete del percorso di release, e mantiene un chunk autonomo `openwebui` solo per dispatch esclusivi di OpenWebUI. Le lane di aggiornamento dei canali in bundle ritentano una volta in caso di errori di rete npm transitori.

Ogni chunk carica `.artifacts/docker-tests/` con log di lane, tempi, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano dello scheduler, tabelle delle lane lente e comandi di riesecuzione per lane. L'input `docker_lanes` del workflow esegue le lane selezionate sulle immagini preparate invece dei job dei chunk, mantenendo il debug delle lane fallite limitato a un job Docker mirato e preparando, scaricando o riutilizzando l'artefatto del pacchetto per quell'esecuzione; se una lane selezionata è una lane Docker live, il job mirato compila localmente l'immagine dei test live per quella riesecuzione. I comandi di riesecuzione GitHub generati per lane includono `package_artifact_run_id`, `package_artifact_name` e gli input delle immagini preparate quando tali valori esistono, così una lane fallita può riutilizzare esattamente il pacchetto e le immagini dell'esecuzione fallita.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Il workflow live/E2E pianificato esegue quotidianamente l'intera suite Docker del percorso di release.

## Prerelease Plugin

`Plugin Prerelease` è una copertura di prodotto/pacchetto più costosa, quindi è un workflow separato avviato da `Full Release Validation` o da un operatore esplicito. Le normali pull request, i push su `main` e i dispatch CI manuali autonomi tengono disattivata quella suite. Bilancia i test dei plugin in bundle su otto worker di estensione; questi job di shard delle estensioni eseguono fino a due gruppi di configurazione plugin alla volta, con un worker Vitest per gruppo e un heap Node più grande, così i batch di plugin con import pesanti non creano job CI aggiuntivi.

## QA Lab

QA Lab dispone di lane CI dedicate al di fuori del workflow principale con scope intelligente.

- Il workflow `Parity gate` viene eseguito sulle modifiche PR corrispondenti e su dispatch manuale; compila il runtime QA privato e confronta i pack agentic mock GPT-5.5 e Opus 4.6.
- Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su dispatch manuale; distribuisce il gate di parità mock, la lane Matrix live e le lane Telegram e Discord live come job paralleli. I job live usano l'ambiente `qa-live-shared`, mentre Telegram/Discord usano lease Convex.

I controlli di release eseguono le lane di trasporto live Matrix e Telegram con il provider mock deterministico e modelli qualificati mock (`mock-openai/gpt-5.5` e `mock-openai/gpt-5.5-alt`), così il contratto del canale è isolato dalla latenza dei modelli live e dal normale avvio dei provider-plugin. Il Gateway di trasporto live disabilita la ricerca in memoria perché la parità QA copre separatamente il comportamento della memoria; la connettività dei provider è coperta dalle suite separate per modello live, provider nativo e provider Docker.

Matrix usa `--profile fast` per i gate pianificati e di release, aggiungendo `--fail-fast` solo quando la CLI estratta lo supporta. Il valore predefinito della CLI e l'input manuale del workflow restano `all`; il dispatch manuale `matrix_profile=all` suddivide sempre la copertura completa Matrix nei job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`.

`OpenClaw Release Checks` esegue anche le lane QA Lab critiche per la release prima dell'approvazione della release; il suo gate di parità QA esegue i pack candidato e baseline come job di lane paralleli, quindi scarica entrambi gli artefatti in un piccolo job di report per il confronto finale della parità.

Non mettere il percorso di landing della PR dietro `Parity gate` a meno che la modifica non tocchi davvero il runtime QA, la parità dei pack modello o una superficie posseduta dal workflow di parità. Per normali fix di canali, configurazione, documentazione o test unitari, trattalo come un segnale opzionale e segui invece le evidenze di CI/controlli con scope.

## CodeQL

Il workflow `CodeQL` è intenzionalmente uno scanner di sicurezza ristretto di primo passaggio, non la scansione completa del repository. Le esecuzioni quotidiane, manuali e di guardia per pull request non draft analizzano il codice dei workflow Actions e le superfici JavaScript/TypeScript a rischio più elevato con query di sicurezza ad alta confidenza filtrate su `security-severity` alta/critica.

La guardia per pull request resta leggera: si avvia solo per modifiche sotto `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, ed esegue la stessa matrice di sicurezza ad alta confidenza del workflow pianificato. Android e macOS CodeQL restano fuori dai valori predefiniti delle PR.

### Categorie di sicurezza

| Categoria                                         | Superficie                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Baseline per auth, segreti, sandbox, cron e gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Contratti di implementazione dei canali core più runtime dei Plugin di canale, gateway, Plugin SDK, segreti, punti di contatto audit   |
| `/codeql-security-high/network-ssrf-boundary`     | Superfici core SSRF, parsing IP, guardia di rete, web-fetch e policy SSRF del Plugin SDK                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper di esecuzione processi, consegna outbound e gate di esecuzione strumenti degli agenti                               |
| `/codeql-security-high/plugin-trust-boundary`     | Superfici di fiducia per installazione Plugin, loader, manifest, registry, staging delle dipendenze runtime, caricamento sorgenti e contratto pacchetto Plugin SDK |

### Shard di sicurezza specifici per piattaforma

- `CodeQL Android Critical Security` — shard di sicurezza Android pianificato. Compila manualmente l'app Android per CodeQL sul runner Blacksmith Linux più piccolo accettato dalla sanity del workflow. Carica sotto `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard di sicurezza macOS settimanale/manuale. Compila manualmente l'app macOS per CodeQL su Blacksmith macOS, filtra i risultati della build delle dipendenze dal SARIF caricato e carica sotto `/codeql-critical-security/macos`. Mantenuto fuori dai valori predefiniti quotidiani perché la build macOS domina il runtime anche quando è pulita.

### Categorie di qualità critica

`CodeQL Critical Quality` è lo shard non di sicurezza corrispondente. Esegue solo query di qualità JavaScript/TypeScript con severità errore e non di sicurezza su superfici ristrette ad alto valore, sul runner Blacksmith Linux più piccolo. La sua guardia per pull request è intenzionalmente più piccola del profilo pianificato: le PR non draft eseguono solo gli shard corrispondenti `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` e `plugin-sdk-reply-runtime` per modifiche al codice di esecuzione di comandi/modelli/strumenti degli agenti e dispatch delle risposte, al codice di schema/migrazione/IO della configurazione, al codice auth/segreti/sandbox/sicurezza, al runtime dei canali core e dei Plugin di canale in bundle, al metodo server/protocollo del gateway, al glue runtime memoria/SDK, a MCP/processi/consegna outbound, al catalogo runtime/modelli dei provider, a diagnostica sessione/code di consegna, al loader dei Plugin, al contratto pacchetto/Plugin SDK o al runtime di risposta del Plugin SDK. Le modifiche alla configurazione CodeQL e al workflow qualità eseguono tutti e dodici gli shard qualità PR.

Il dispatch manuale accetta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

I profili ristretti sono hook di insegnamento/iterazione per eseguire uno shard di qualità in isolamento.

| Category                                                | Surface                                                                                                                                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Codice del confine di sicurezza per auth, secrets, sandbox, Cron e Gateway                                                                                                                            |
| `/codeql-critical-quality/config-boundary`              | Schema di configurazione, migrazione, normalizzazione e contratti IO                                                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schemi del protocollo Gateway e contratti dei metodi server                                                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratti di implementazione del canale core e dei Plugin di canale inclusi                                                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | Esecuzione dei comandi, dispatch di modelli/provider, dispatch e code di risposta automatica, e contratti runtime del control plane ACP                                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP e bridge degli strumenti, helper di supervisione dei processi e contratti di consegna in uscita                                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK dell'host della memoria, facade runtime della memoria, alias del Plugin SDK della memoria, collante di attivazione del runtime della memoria e comandi doctor della memoria                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interni della coda di risposta, code di consegna delle sessioni, helper di binding/consegna delle sessioni in uscita, superfici di bundle di eventi/log diagnostici e contratti CLI doctor di sessione |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch delle risposte in ingresso del Plugin SDK, helper per payload/chunking/runtime delle risposte, opzioni di risposta dei canali, code di consegna e helper di binding sessione/thread          |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizzazione del catalogo modelli, auth e discovery dei provider, registrazione del runtime dei provider, default/cataloghi dei provider e registri web/search/fetch/embedding                     |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap della UI di controllo, persistenza locale, flussi di controllo del Gateway e contratti runtime del control plane dei task                                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratti runtime di web fetch/search core, IO media, comprensione dei media, generazione di immagini e generazione di media                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | Contratti di loader, registro, superficie pubblica ed entrypoint del Plugin SDK                                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sorgente del Plugin SDK lato package pubblicato e helper dei contratti dei package Plugin                                                                                                             |

La qualità resta separata dalla sicurezza, così i finding di qualità possono essere pianificati, misurati, disabilitati o ampliati senza oscurare il segnale di sicurezza. L'espansione CodeQL per Swift, Python e Plugin inclusi dovrebbe essere reintrodotta come lavoro successivo con ambito o shard solo dopo che i profili ristretti hanno runtime e segnale stabili.

## Flussi di lavoro di manutenzione

### Docs Agent

Il workflow `Docs Agent` è una lane di manutenzione Codex basata su eventi per mantenere la documentazione esistente allineata alle modifiche integrate di recente. Non ha una schedulazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, e il dispatch manuale può eseguirlo direttamente. Le invocazioni da workflow-run vengono saltate quando `main` è avanzato o quando nell'ultima ora è stata creata un'altra esecuzione Docs Agent non saltata. Quando viene eseguito, revisiona l'intervallo di commit dalla precedente SHA sorgente Docs Agent non saltata fino all'attuale `main`, così una singola esecuzione oraria può coprire tutte le modifiche su main accumulate dall'ultimo passaggio sulla documentazione.

### Test Performance Agent

Il workflow `Test Performance Agent` è una lane di manutenzione Codex basata su eventi per i test lenti. Non ha una schedulazione pura: un'esecuzione CI riuscita da push non bot su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale bypassa quel gate di attività giornaliero. La lane crea un report delle prestazioni Vitest raggruppato per l'intera suite, consente a Codex di apportare solo piccole correzioni di prestazioni dei test che preservano la copertura invece di ampi refactor, quindi riesegue il report dell'intera suite e rifiuta le modifiche che riducono il conteggio baseline dei test superati. Se la baseline ha test falliti, Codex può correggere solo errori evidenti e il report dell'intera suite dopo l'agent deve passare prima che venga fatto qualsiasi commit. Quando `main` avanza prima che il push del bot venga integrato, la lane esegue il rebase della patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch stale in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

### PR duplicate dopo il merge

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per la pulizia dei duplicati post-land. Il default è dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR integrata sia stata mergiata e che ogni duplicata abbia un issue referenziato condiviso o hunk modificati sovrapposti.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate di controllo locali e routing delle modifiche

La logica locale delle changed-lane vive in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate di controllo locale è più rigoroso sui confini architetturali rispetto all'ambito della piattaforma CI ampia:

- le modifiche alla produzione core eseguono typecheck di core prod e core test più lint/guard core;
- le modifiche solo ai test core eseguono solo typecheck dei test core più lint core;
- le modifiche alla produzione delle estensioni eseguono typecheck di extension prod ed extension test più lint delle estensioni;
- le modifiche solo ai test delle estensioni eseguono typecheck dei test delle estensioni più lint delle estensioni;
- le modifiche al Plugin SDK pubblico o ai contratti Plugin si espandono al typecheck delle estensioni perché le estensioni dipendono da quei contratti core (gli sweep Vitest delle estensioni restano lavoro di test esplicito);
- i bump di versione solo dei metadati di release eseguono controlli mirati su versione/config/dipendenze root;
- le modifiche root/config sconosciute falliscono in sicurezza verso tutte le lane di controllo.

Il routing locale dei changed-test vive in `scripts/test-projects.test-support.mjs` ed è intenzionalmente più economico di `check:changed`: le modifiche dirette ai test eseguono se stesse, le modifiche al sorgente preferiscono mapping espliciti, poi test sibling e dipendenti dell'import-graph. La configurazione condivisa di consegna delle group-room è uno dei mapping espliciti: le modifiche alla configurazione delle visible-reply di gruppo, alla modalità di consegna delle risposte sorgente o al prompt di sistema del message-tool passano attraverso i test core delle risposte più regressioni di consegna Discord e Slack, così una modifica a un default condiviso fallisce prima del primo push della PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo quando la modifica è abbastanza estesa all'harness da rendere il set mappato economico un proxy non affidabile.

## Validazione Testbox

Esegui Testbox dalla root del repository e preferisci un box fresco già riscaldato per prove ampie. Prima di spendere un gate lento su un box riutilizzato, scaduto o che ha appena segnalato una sincronizzazione inaspettatamente grande, esegui prima `pnpm testbox:sanity` dentro il box.

Il sanity check fallisce rapidamente quando file root richiesti come `pnpm-lock.yaml` sono scomparsi o quando `git status --short` mostra almeno 200 eliminazioni tracciate. Di solito significa che lo stato di sync remoto non è una copia affidabile della PR; ferma quel box e riscaldane uno nuovo invece di debuggare il fallimento dei test del prodotto. Per PR intenzionali con grandi eliminazioni, imposta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` per quell'esecuzione sanity.

`pnpm testbox:run` termina anche un'invocazione locale della CLI Blacksmith che resta nella fase di sync per più di cinque minuti senza output post-sync. Imposta `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` per disabilitare quel guard, oppure usa un valore in millisecondi più grande per diff locali insolitamente ampi.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
