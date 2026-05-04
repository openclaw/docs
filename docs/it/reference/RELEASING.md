---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Eseguire la convalida del rilascio o l'accettazione del pacchetto
    - Cerchi informazioni sulla denominazione e sulla cadenza delle versioni
summary: Canali di rilascio, elenco di controllo per gli operatori, ambienti di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-04T07:08:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stabile: rilasci con tag che vengono pubblicati su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che vengono pubblicati su npm `beta`
- dev: la punta mobile di `main`

## Nomenclatura delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttivo stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica il rilascio npm stabile promosso corrente
- `beta` indica il target di installazione beta corrente
- I rilasci stabili e correttivi stabili vengono pubblicati su npm `beta` per impostazione predefinita; gli operatori di rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app Mac riservate allo stabile salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci avanzano prima in beta
- Lo stabile segue solo dopo che l'ultima beta è stata convalidata
- I maintainer normalmente creano i rilasci da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la convalida del rilascio e le correzioni non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- Procedura di rilascio dettagliata, approvazioni, credenziali e note di ripristino sono
  riservate ai maintainer

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall'attuale `main`: esegui il pull dell'ultima versione, conferma che il commit di destinazione sia stato inviato
   e conferma che la CI corrente di `main` sia sufficientemente verde per crearne un branch.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci rivolte agli utenti, esegui il commit, invialo ed esegui rebase/pull
   ancora una volta prima di creare il branch.
3. Rivedi i record di compatibilità del rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.D` dall'attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, esegui
   `pnpm plugins:sync` affinché i pacchetti Plugin pubblicabili condividano la versione di rilascio
   e i metadati di compatibilità, quindi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   uno SHA completo di 40 caratteri del branch di rilascio è consentito solo per la convalida
   preflight. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-rilascio con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico entrypoint manuale
   per i quattro grandi box di test di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio e riesegui il più piccolo
   file, canale, job del workflow, profilo pacchetto, provider o allowlist di modelli fallito che
   dimostri la correzione. Riesegui l'umbrella completa solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   pubblica prima tutti i pacchetti Plugin pubblicabili su npm, pubblica poi lo stesso
   insieme su ClawHub come tarball ClawPack npm-pack e quindi promuove l'artefatto
   preflight npm OpenClaw preparato con il dist-tag corrispondente. Dopo la
   pubblicazione, esegui l'accettazione del pacchetto post-pubblicazione contro il pacchetto
   `openclaw@YYYY.M.D-beta.N` o `openclaw@beta` pubblicato. Se una prerelease inviata
   o pubblicata richiede una correzione, crea il numero di prerelease corrispondente successivo;
   non eliminare né riscrivere la vecchia prerelease.
10. Per stabile, continua solo dopo che la beta verificata o il release candidate ha le
    prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso
    `OpenClaw Release Publish`, riutilizzando l'artefatto preflight riuscito tramite
    `preflight_run_id`; la prontezza del rilascio macOS stabile richiede anche
    `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram
    facoltativo su npm pubblicato standalone quando serve prova del canale post-pubblicazione,
    la promozione del dist-tag quando necessaria, le note di rilascio/prerelease GitHub dalla
    sezione completa corrispondente di `CHANGELOG.md` e i passaggi di annuncio del rilascio.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così il TypeScript dei test resta coperto al di fuori del gate locale più rapido `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli più ampi sui cicli di importazione e sui confini architetturali risultano verdi al di fuori del gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di rilascio `dist/*` attesi e il bundle della Control UI esistono per il passaggio di validazione del pack
- Esegui `pnpm plugins:sync` dopo l'aumento della versione root e prima del tagging. Aggiorna le versioni dei pacchetti Plugin pubblicabili, i metadati di compatibilità peer/API di OpenClaw, i metadati di build e gli stub del changelog dei plugin in modo che corrispondano alla versione di rilascio core. `pnpm plugins:sync:check` è la guardia di rilascio non modificante; il workflow di pubblicazione fallisce prima di qualsiasi modifica al registry se questo passaggio è stato dimenticato.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per avviare tutti i box di test pre-release da un unico entrypoint. Accetta un branch, un tag o uno SHA completo di commit, invia manualmente `CI` e invia `OpenClaw Release Checks` per smoke di installazione, accettazione del pacchetto, suite del percorso di rilascio Docker, live/E2E, OpenWebUI, parità QA Lab, Matrix e lane Telegram. Con `release_profile=full` e `rerun_group=all`, esegue anche Telegram E2E del pacchetto contro l'artefatto `release-package-under-test` dei controlli di rilascio. Fornisci `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso Telegram E2E deve dimostrare anche il pacchetto npm pubblicato. Fornisci `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance deve eseguire la propria matrice package/update contro il pacchetto npm consegnato invece dell'artefatto compilato dallo SHA. Fornisci `evidence_package_spec` quando il report di evidenza privato deve dimostrare che la validazione corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E. Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova su canale laterale per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref` per creare un pack da un branch/tag/SHA `package_ref` attendibile con l'harness `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256 obbligatorio; oppure `source=artifact` per un tarball caricato da un'altra esecuzione GitHub Actions. Il workflow risolve il candidato in `package-under-test`, riutilizza lo scheduler di rilascio Docker E2E contro quel tarball e può eseguire la QA Telegram contro lo stesso tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le lane Docker selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto è il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane install/channel/agent, rete Gateway e ricaricamento config
  - `package`: lane package/update/plugin native dell'artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent, ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura CI normale completa per il candidato al rilascio. Gli invii manuali CI bypassano lo scoping delle modifiche e forzano le shard Linux Node, le shard dei plugin bundled, i contratti dei canali, la compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Python skills, Windows, macOS, Android e le lane i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando validi la telemetria di rilascio. Esercita QA-lab tramite un ricevitore OTLP/HTTP locale e verifica i nomi degli span di trace esportati, gli attributi delimitati e la redazione di contenuti/identificatori senza richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio con tag
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione modificante dopo che il tag esiste. Invialo da `release/YYYY.M.D` (o `main` quando pubblichi un tag raggiungibile da main), passa il tag di rilascio e il `preflight_run_id` npm OpenClaw riuscito, e mantieni lo scope di pubblicazione plugin predefinito `all-publishable` a meno che tu non stia eseguendo intenzionalmente una riparazione mirata. Il workflow serializza la pubblicazione npm dei plugin, la pubblicazione ClawHub dei plugin e la pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato prima dei suoi plugin esternalizzati.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo Matrix live rapido e la lane QA Telegram prima dell'approvazione del rilascio. Le lane live usano l'ambiente `qa-live-shared`; Telegram usa anche i lease delle credenziali Convex CI. Esegui il workflow manuale `QA-Lab - All Lanes` con `matrix_profile=all` e `matrix_shards=true` quando vuoi l'intero inventario Matrix transport, media ed E2EE in parallelo.
- La validazione runtime cross-OS di installazione e aggiornamento fa parte di `OpenClaw Release Checks` e `Full Release Validation` pubblici, che chiamano direttamente il workflow riutilizzabile `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il vero percorso di rilascio npm breve, deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro lane, così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che contengono segreti devono essere inviati tramite `Full Release Validation` o dal workflow ref `main`/release, così logica del workflow e segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA completo di commit purché il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Il preflight solo-validazione `OpenClaw NPM Release` accetta anche lo SHA completo a 40 caratteri del commit corrente del branch del workflow senza richiedere un tag pushato
- Quel percorso SHA è solo per validazione e non può essere promosso a una vera pubblicazione
- In modalità SHA, il workflow sintetizza `v<package.json version>` solo per il controllo dei metadati del pacchetto; la vera pubblicazione richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner GitHub-hosted, mentre il percorso di validazione non modificante può usare i runner Blacksmith Linux più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i secret di workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la lane separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione dal registry pubblicato in un prefisso temporaneo nuovo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram e Telegram E2E reale contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease. Le esecuzioni una tantum locali dei maintainer possono omettere le variabili Convex e passare direttamente le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta post-pubblicazione completo da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L'helper esegue la validazione Parallels npm update/fresh-target, invia `NPM Telegram Beta E2E`, interroga l'esecuzione esatta del workflow, scarica l'artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-poi-promozione:
  - la vera pubblicazione npm deve superare un `preflight_run_id` npm riuscito
  - la vera pubblicazione npm deve essere inviata dallo stesso branch `main` o `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - i rilasci npm stable usano `beta` come predefinito
  - la pubblicazione npm stable può indirizzare esplicitamente `latest` tramite input del workflow
  - la mutazione dei dist-tag npm basata su token ora risiede in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il repo pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo-validazione; quando un tag vive solo su un branch di rilascio ma il workflow viene inviato da `main`, imposta `public_release_branch=release/YYYY.M.D`
  - la vera pubblicazione mac privata deve superare `preflight_run_id` e `validate_run_id` mac privati riusciti
  - i veri percorsi di pubblicazione promuovono artefatti preparati invece di ricompilarli
- Per rilasci stable di correzione come `YYYY.M.D-N`, il verificatore post-pubblicazione controlla anche lo stesso percorso di upgrade con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`, così le correzioni di rilascio non possono lasciare silenziosamente installazioni globali più vecchie sul payload stable base
- Il preflight di rilascio npm fallisce in modo chiuso a meno che il tarball includa sia `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`, così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei plugin pubblicati e i metadati dei pacchetti siano presenti nel layout del registry installato. Un rilascio che distribuisce payload runtime dei plugin mancanti fallisce il verificatore postpublish e non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget npm pack `unpackedSize` sul tarball candidato di aggiornamento, così l'e2e dell'installer intercetta rigonfiamenti accidentali del pack prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato pianificazione CI, manifest di timing delle estensioni o matrici di test delle estensioni, rigenera e rivedi gli output di matrice `plugin-prerelease-extension-shard` di proprietà del planner da `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di rilascio non descrivono un layout CI obsoleto
- La prontezza al rilascio stable macOS include anche le superfici dell'updater:
  - la GitHub release deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un URL del feed Sparkle non vuoto e un `CFBundleVersion` pari o superiore al floor canonico di build Sparkle per quella versione di rilascio

## Box di test di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-release da un unico entrypoint. Per una prova su commit fissato su un branch in rapido movimento, usa l'helper in modo che ogni workflow figlio venga eseguito da un branch temporaneo fissato allo SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper pusha `release-ci/<sha>-...`, invia `Full Release Validation` da quel branch con `ref=<sha>`, verifica che ogni `headSha` dei workflow figli corrisponda al target, quindi elimina il branch temporaneo. Questo evita di dimostrare per errore un'esecuzione figlia più recente di `main`.

Per la validazione di un branch di rilascio o di un tag, eseguila dal workflow ref `main` attendibile e passa il branch di rilascio o il tag come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Il workflow risolve il ref di destinazione, esegue il dispatch manuale di `CI` con
`target_ref=<release-ref>`, esegue il dispatch di `OpenClaw Release Checks`, prepara un
artefatto padre `release-package-under-test` per i controlli rivolti ai pacchetti ed
esegue il dispatch dell'E2E Telegram standalone per il pacchetto quando `release_profile=full` con
`rerun_group=all` oppure quando è impostato `npm_telegram_package_spec`. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di rilascio cross-OS, copertura live/E2E Docker
del percorso di rilascio, Package Acceptance con QA del pacchetto Telegram, parità QA Lab,
Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il
riepilogo di `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve riuscire; fuori da full/all viene saltato,
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il riepilogo finale
del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
Vedi [Validazione completa del rilascio](/it/reference/full-release-validation) per la
matrice completa degli stage, i nomi esatti dei job del workflow, le differenze tra profilo
stable e full, gli artefatti e gli handle di riesecuzione mirati.
I workflow figli vengono eseguiti dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch o tag di rilascio più vecchio. Non esiste un input separato per il workflow-ref di Full Release Validation;
scegli l'harness attendibile scegliendo il ref dell'esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per la prova di commit esatta su `main` mobile;
gli SHA di commit grezzi non possono essere ref di dispatch del workflow, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo bloccato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker critico per il rilascio più veloce
- `stable`: minimum più copertura provider/backend stabile per l'approvazione del rilascio
- `full`: stable più ampia copertura provider/media consultiva

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere il ref di destinazione
una sola volta come `release-package-under-test` e riutilizza quell'artefatto sia nei
controlli Docker del percorso di rilascio sia in Package Acceptance. Questo mantiene tutte le
macchine rivolte ai pacchetti sugli stessi byte ed evita build ripetute dei pacchetti.
Lo smoke install cross-OS OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane
sta provando installazione del pacchetto, onboarding, avvio del Gateway e un turno live dell'agente,
non benchmarkando il modello predefinito più lento. La matrice live provider più ampia
rimane il posto per la copertura specifica per modello.

Usa queste varianti in base allo stage di rilascio:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Non usare l'ombrello completo come prima riesecuzione dopo una correzione mirata. Se una macchina
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo del pacchetto, il provider
del modello o la lane QA falliti per la prova successiva. Esegui di nuovo l'ombrello completo solo quando
la correzione ha modificato l'orchestrazione condivisa del rilascio o ha reso obsolete le prove precedenti
su tutte le macchine. Il verificatore finale dell'ombrello ricontrolla gli id registrati delle esecuzioni dei workflow figli,
quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre
`Verify full validation` fallito.

Per un ripristino limitato, passa `rerun_group` all'ombrello. `all` è la vera
esecuzione del release candidate, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio Plugin solo di rilascio, `release-checks` esegue ogni macchina di rilascio
e i gruppi di rilascio più stretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l'artefatto del pacchetto di release-checks.

### Vitest

La macchina Vitest è il workflow figlio manuale `CI`. La CI manuale aggira intenzionalmente
lo scoping delle modifiche e forza il normale grafo di test per il release
candidate: shard Linux Node, shard Plugin inclusi, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli della documentazione, Skills Python,
Windows, macOS, Android e i18n della Control UI.

Usa questa macchina per rispondere a "l'albero sorgente ha superato l'intera suite di test normale?"
Non è la stessa cosa della validazione del prodotto nel percorso di rilascio. Prove da conservare:

- riepilogo `Full Release Validation` che mostra l'URL dell'esecuzione `CI` eseguita
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI quando si indagano regressioni
- artefatti di timing Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui direttamente la CI manuale solo quando il rilascio necessita di una CI normale deterministica ma
non delle macchine Docker, QA Lab, live, cross-OS o package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La macchina Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow
`install-smoke` in modalità release. Valida il release candidate attraverso ambienti Docker
pacchettizzati invece che solo test a livello di sorgente.

La copertura Docker di rilascio include:

- install smoke completo con lo smoke install globale Bun lento abilitato
- preparazione/riuso dell'immagine smoke del Dockerfile radice per SHA di destinazione, con job QR,
  root/gateway e installer/Bun smoke eseguiti come shard install-smoke separati
- lane E2E del repository
- chunk Docker del percorso di rilascio: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- copertura OpenWebUI dentro il chunk `plugins-runtime-services` quando richiesta
- lane divise di installazione/disinstallazione dei Plugin inclusi
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura del modello live Docker quando i controlli di rilascio
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
timing delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per un ripristino mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow riutilizzabile live/E2E invece di
rieseguire tutti i chunk di rilascio. I comandi di riesecuzione generati includono il precedente
`package_artifact_run_id` e gli input delle immagini Docker preparate quando disponibili, così una
lane fallita può riutilizzare lo stesso tarball e le immagini GHCR.

### QA Lab

Anche la macchina QA Lab fa parte di `OpenClaw Release Checks`. È il gate di rilascio
del comportamento agentico e a livello di canale, separato da Vitest e dalla meccanica dei pacchetti Docker.

La copertura QA Lab di rilascio include:

- lane di parità mock che confronta la lane candidate OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live veloce usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease delle credenziali CI Convex
- `pnpm qa:otel:smoke` quando la telemetria di rilascio richiede una prova locale esplicita

Usa questa macchina per rispondere a "il rilascio si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artefatti per le lane parità, Matrix e Telegram
quando approvi il rilascio. La copertura Matrix completa rimane disponibile come
esecuzione QA-Lab sharded manuale invece che come lane critica predefinita per il rilascio.

### Pacchetto

La macchina Package è il gate del prodotto installabile. È supportata da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidate nel tarball `package-under-test` consumato da Docker E2E, valida
l'inventario del pacchetto, registra la versione del pacchetto e lo SHA-256, e mantiene il
ref dell'harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw
- `source=ref`: impacchetta un branch, tag o SHA di commit completo `package_ref` attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` richiesto
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto
del pacchetto di rilascio preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` e
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, aggiornamento, pulizia
delle dipendenze obsolete dei Plugin, fixture Plugin offline, aggiornamento Plugin e QA
del pacchetto Telegram contro lo stesso tarball risolto. La matrice di upgrade copre ogni baseline stabile pubblicata su npm da `2026.4.23` fino a `latest`; usa
Package Acceptance con `source=npm` per un candidate già distribuito, oppure
`source=ref`/`source=artifact` per un tarball npm locale supportato da SHA prima della
pubblicazione. È il sostituto nativo GitHub
per la maggior parte della copertura package/update che in precedenza richiedeva
Parallels. I controlli di rilascio cross-OS restano importanti per onboarding,
installer e comportamento specifici dell'OS, ma la validazione del prodotto package/update dovrebbe
preferire Package Acceptance.

La checklist canonica per la validazione di aggiornamenti e Plugin è
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins). Usala quando
devi decidere quale lane locale, Docker, Package Acceptance o release-check prova una
modifica di installazione/aggiornamento Plugin, pulizia doctor o migrazione di pacchetto pubblicato.
La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale `Update Migration` separato, non parte della Full Release CI.

La tolleranza legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per gap di metadati già pubblicati
su npm: voci di inventario QA private mancanti dal tarball, `gateway install --wrapper`
mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel`
persistito mancante, posizioni legacy dei record di installazione dei Plugin,
persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione
durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può avvisare
per file di timbro dei metadati di build locali già distribuiti. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; quegli stessi gap fanno fallire la validazione
del rilascio.

Usa profili Package Acceptance più ampi quando la domanda di rilascio riguarda un
pacchetto installabile reale:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Profili comuni dei pacchetti:

- `smoke`: percorsi rapidi di installazione pacchetto/canale/agente, rete del gateway e ricaricamento della configurazione
- `package`: contratti di installazione/aggiornamento/pacchetto plugin senza ClawHub live; questo è il valore predefinito del controllo di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI e OpenWebUI
- `full`: blocchi del percorso di rilascio Docker con OpenWebUI
- `custom`: elenco `docker_lanes` esatto per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il
tarball `package-under-test` risolto al percorso Telegram; il workflow Telegram
autonomo accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione della pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Orquestra i workflow trusted-publisher nell'ordine richiesto dal rilascio:

1. Esegui il checkout del tag di rilascio e risolvi il relativo SHA del commit.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegui `pnpm plugins:sync:check`.
4. Esegui il dispatch di `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Esegui il dispatch di `Plugin ClawHub Release` con lo stesso scope e SHA.
6. Esegui il dispatch di `OpenClaw NPM Release` con il tag di rilascio, il dist-tag npm e
   il `preflight_run_id` salvato.

Esempio di pubblicazione beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pubblicazione stabile sul dist-tag beta predefinito:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

La promozione stabile direttamente a `latest` è esplicita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Usa i workflow di livello inferiore `Plugin NPM Release` e `Plugin ClawHub Release`
solo per lavori mirati di riparazione o ripubblicazione. Per una riparazione di plugin selezionata, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure esegui direttamente il dispatch del workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio, come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA del commit corrente
  completo a 40 caratteri del ramo del workflow per un preflight di sola validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il workflow riutilizza
  il tarball preparato dall'esecuzione preflight riuscita
- `npm_dist_tag`: tag di destinazione npm per il percorso di pubblicazione; il valore predefinito è `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve già esistere
- `preflight_run_id`: id dell'esecuzione preflight riuscita di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag di destinazione npm per il pacchetto OpenClaw
- `plugin_publish_scope`: valore predefinito `all-publishable`; usa `selected` solo
  per lavori mirati di riparazione
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: valore predefinito `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazioni solo per plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: ramo, tag o SHA completo del commit da validare. I controlli che richiedono segreti
  richiedono che il commit risolto sia raggiungibile da un ramo OpenClaw o da un
  tag di rilascio.

Regole:

- I tag stabili e di correzione possono pubblicare su `beta` o `latest`
- I tag di prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input dello SHA completo del commit è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima di proseguire con la pubblicazione

## Sequenza di rilascio npm stabile

Quando prepari un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA del commit corrente completo del ramo del workflow
     per un dry run di sola validazione del workflow preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul ramo di rilascio, sul tag di rilascio o sullo SHA completo
   del commit quando vuoi CI normale più cache prompt live, Docker, QA Lab,
   Matrix e copertura Telegram da un unico workflow manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sul ref di rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se il rilascio è arrivato su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se il rilascio è stato pubblicato intenzionalmente direttamente su `latest` e `beta`
   deve seguire subito la stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   self-healing pianificata sposti `beta` in seguito

La mutazione dei dist-tag risiede nel repository privato per sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repository pubblico mantiene una pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

Se un maintainer deve ricorrere all'autenticazione npm locale, esegui qualsiasi comando della CLI 1Password
(`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; tenerlo dentro tmux rende prompt,
avvisi e gestione OTP osservabili e previene avvisi host ripetuti.

## Riferimenti pubblici

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

I maintainer usano la documentazione privata di rilascio in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.

## Correlati

- [Canali di rilascio](/it/install/development-channels)
