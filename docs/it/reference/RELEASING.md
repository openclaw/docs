---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida della release o dell'accettazione del pacchetto
    - Ricerca della denominazione e della cadenza delle versioni
summary: Canali di rilascio, lista di controllo dell'operatore, box di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-01T08:32:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stabile: rilasci con tag pubblicati su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease pubblicati su npm `beta`
- dev: l'head mobile di `main`

## Denominazione delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttivo stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica il rilascio npm stabile attualmente promosso
- `beta` indica la destinazione di installazione beta corrente
- I rilasci stabili e correttivi stabili vengono pubblicati su npm `beta` per impostazione predefinita; gli operatori di rilascio possono scegliere esplicitamente `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app mac riservati ai rilasci stabili salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Il rilascio stabile segue solo dopo la convalida della beta più recente
- I maintainer normalmente preparano i rilasci da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la convalida e le correzioni di rilascio non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e necessita di una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- Procedura dettagliata di rilascio, approvazioni, credenziali e note di ripristino sono
  riservate ai maintainer

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall'attuale `main`: esegui il pull dell'ultima versione, conferma che il commit target sia stato inviato,
   e conferma che la CI dell'attuale `main` sia sufficientemente verde per creare un branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci rivolte agli utenti, esegui il commit, il push e un altro rebase/pull
   prima di creare il branch.
3. Rivedi i record di compatibilità del rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.D` dall'attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, quindi esegui il
   preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, e `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   per il preflight di sola convalida è consentito uno SHA completo di 40 caratteri del branch di rilascio.
   Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-rilascio con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per i quattro grandi ambienti di test di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio e riesegui il più piccolo
   file, canale, job di workflow, profilo di pacchetto, provider o allowlist di modelli fallito che
   dimostra la correzione. Riesegui l'intero ombrello solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, tagga `vYYYY.M.D-beta.N`, pubblica con dist-tag npm `beta`, quindi esegui
   l'accettazione del pacchetto post-pubblicazione contro il pacchetto pubblicato `openclaw@YYYY.M.D-beta.N`
   o `openclaw@beta`. Se una beta inviata o pubblicata necessita di una correzione, crea
   il `-beta.N` successivo; non eliminare né riscrivere la vecchia beta.
10. Per stabile, continua solo dopo che la beta verificata o la release candidate dispone delle
    prove di convalida richieste. La pubblicazione npm stabile riutilizza l'artefatto di
    preflight riuscito tramite `preflight_run_id`; la prontezza del rilascio macOS stabile
    richiede inoltre il `.zip`, il `.dmg`, il `.dSYM.zip` pacchettizzati e
    `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram pubblicato-npm
    standalone facoltativo quando serve prova del canale post-pubblicazione,
    la promozione dei dist-tag quando necessario, le note di rilascio/prerelease GitHub dalla
    sezione completa corrispondente di `CHANGELOG.md`, e i passaggi di annuncio del rilascio.

## Preflight di rilascio

- Esegui `pnpm check:test-types` prima della preflight di rilascio, così il TypeScript dei test resta coperto fuori dal gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima della preflight di rilascio, così i controlli più ampi sui cicli di importazione e sui confini architetturali sono verdi fuori dal gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di rilascio `dist/*` attesi e il bundle della Control UI esistono per il passaggio di convalida del pacchetto
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per avviare tutti i box di test pre-rilascio da un unico punto di ingresso. Accetta un branch, un tag o uno SHA completo di commit, invia il `CI` manuale e invia `OpenClaw Release Checks` per install smoke, package acceptance, suite del percorso di rilascio Docker, live/E2E, OpenWebUI, parità QA Lab, Matrix e lane Telegram. Fornisci `npm_telegram_package_spec` solo dopo la pubblicazione di un pacchetto e quando deve essere eseguito anche l'E2E Telegram post-pubblicazione. Fornisci `evidence_package_spec` quando il report privato delle evidenze deve dimostrare che la convalida corrisponde a un pacchetto npm pubblicato senza forzare l'E2E Telegram.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref` per impacchettare un branch/tag/SHA `package_ref` attendibile con l'harness `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256 obbligatorio; oppure `source=artifact` per un tarball caricato da un'altra esecuzione di GitHub Actions. Il workflow risolve il candidato in `package-under-test`, riusa lo scheduler di rilascio Docker E2E contro quel tarball e può eseguire la QA Telegram contro lo stesso tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le lane Docker selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto è il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane di installazione/canale/agente, rete Gateway e ricaricamento della configurazione
  - `package`: lane package/update/plugin native dell'artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagente, ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione focalizzata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura completa della CI normale per il candidato di rilascio. Gli invii manuali della CI bypassano lo scoping dei file modificati e forzano gli shard Linux Node, gli shard dei Plugin inclusi, i contratti dei canali, la compatibilità Node 22, `check`, `check-additional`, build smoke, controlli dei documenti, Skills Python, Windows, macOS, Android e le lane i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando convalidi la telemetria di rilascio. Esercita QA-lab tramite un ricevitore OTLP/HTTP locale e verifica i nomi degli span di trace esportati, gli attributi limitati e la redazione di contenuti/identificatori senza richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche il gate di parità mock QA Lab più il profilo Matrix live veloce e la lane QA Telegram prima dell'approvazione del rilascio. Le lane live usano l'ambiente `qa-live-shared`; Telegram usa anche lease di credenziali Convex CI. Esegui il workflow manuale `QA-Lab - All Lanes` con `matrix_profile=all` e `matrix_shards=true` quando vuoi l'inventario completo di trasporto Matrix, media ed E2EE in parallelo.
- La convalida runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il workflow riutilizzabile `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa divisione è intenzionale: mantieni il vero percorso di rilascio npm breve, deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella propria lane così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che contengono segreti devono essere inviati tramite `Full Release Validation` o dal ref del workflow `main`/release, così la logica del workflow e i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA completo di commit purché il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- La preflight solo di convalida di `OpenClaw NPM Release` accetta anche lo SHA completo di 40 caratteri del commit corrente del branch del workflow senza richiedere un tag pushato
- Quel percorso SHA è solo di convalida e non può essere promosso a una pubblicazione reale
- In modalità SHA, il workflow sintetizza `v<package.json version>` solo per il controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner GitHub-hosted, mentre il percorso di convalida non mutante può usare i runner Linux Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti di workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- La preflight del rilascio npm non attende più la lane separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correction corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correction corrispondente) per verificare il percorso di installazione dal registro pubblicato in un prefisso temporaneo pulito
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram ed E2E Telegram reale contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease. I test una tantum locali dei maintainer possono omettere le variabili Convex e passare direttamente le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-then-promote:
  - la pubblicazione npm reale deve passare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere inviata dallo stesso branch `main` o `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - i rilasci npm stabili usano `beta` come predefinito
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione di npm dist-tag basata su token ora vive in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il repository pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di convalida; quando un tag vive solo su un branch di rilascio ma il workflow viene inviato da `main`, imposta `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve passare `preflight_run_id` e `validate_run_id` mac privati riusciti
  - i percorsi di pubblicazione reali promuovono gli artefatti preparati invece di ricostruirli di nuovo
- Per rilasci stabili correttivi come `YYYY.M.D-N`, il verificatore post-pubblicazione controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`, così le correzioni di rilascio non possono lasciare silenziosamente le installazioni globali più vecchie sul payload stabile di base
- La preflight del rilascio npm fallisce in modo chiuso a meno che il tarball includa sia `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto, così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che l'installazione dal registro pubblicato contenga dipendenze runtime dei Plugin inclusi non vuote sotto il layout root `dist/*`. Un rilascio distribuito con payload di dipendenze dei Plugin inclusi mancanti o vuoti fallisce il verificatore postpublish e non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` del pacchetto npm sul tarball candidato di aggiornamento, così l'e2e dell'installer intercetta aumenti accidentali delle dimensioni del pacchetto prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest di timing delle estensioni o le matrici di test delle estensioni, rigenera e rivedi gli output della matrice `plugin-prerelease-extension-shard` di proprietà del planner da `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di rilascio non descrivono un layout CI obsoleto
- La preparazione del rilascio macOS stabile include anche le superfici dell'updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un URL del feed Sparkle non vuoto e un `CFBundleVersion` pari o superiore al limite canonico di build Sparkle per quella versione di rilascio

## Box di test di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da un unico punto di ingresso. Eseguilo dal ref di workflow attendibile `main` e passa il branch di rilascio, il tag o lo SHA completo di commit come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Il workflow risolve il ref target, invia il `CI` manuale con `target_ref=<release-ref>`, invia `OpenClaw Release Checks` e, opzionalmente, invia l'E2E Telegram post-pubblicazione standalone quando `npm_telegram_package_spec` è impostato. `OpenClaw Release Checks` poi espande install smoke, controlli di rilascio cross-OS, copertura live/E2E Docker del percorso di rilascio, Package Acceptance con QA del pacchetto Telegram, parità QA Lab, Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il riepilogo di `Full Release Validation` mostra `normal_ci` e `release_checks` riusciti, e qualsiasi figlio opzionale `npm_telegram` è riuscito oppure saltato intenzionalmente. Il riepilogo finale del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release manager può vedere il percorso critico corrente senza scaricare i log.
Vedi [Convalida completa del rilascio](/it/reference/full-release-validation) per la matrice completa delle fasi, i nomi esatti dei job del workflow, le differenze tra profilo stabile e completo, gli artefatti e gli handle di riesecuzione focalizzata.
I workflow figli vengono inviati dal ref attendibile che esegue `Full Release Validation`, normalmente `--ref main`, anche quando il `ref` target punta a un branch o tag di rilascio più vecchio. Non esiste un input separato del ref di workflow per Full Release Validation; scegli l'harness attendibile scegliendo il ref di esecuzione del workflow.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker più veloce e critico per il rilascio
- `stable`: minimum più copertura stabile provider/backend per l'approvazione del rilascio
- `full`: stable più ampia copertura advisory provider/media

`OpenClaw Release Checks` usa il riferimento del workflow attendibile per risolvere il riferimento di destinazione una sola volta come `release-package-under-test` e riutilizza quell'artefatto sia nei controlli Docker del percorso di rilascio sia in Package Acceptance. Questo mantiene tutti gli ambienti orientati al pacchetto sugli stessi byte ed evita build ripetute del pacchetto. Lo smoke di installazione OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la variabile del repo/org è impostata, altrimenti `openai/gpt-5.4-mini`, perché questa lane dimostra l'installazione del pacchetto, l'onboarding, l'avvio del Gateway e un turno live dell'agente, invece di eseguire benchmark del modello predefinito più lento. La matrice live provider più ampia resta il luogo per la copertura specifica dei modelli.

Usa queste varianti a seconda della fase del rilascio:

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Non usare l'ombrello completo come prima riesecuzione dopo una correzione mirata. Se un ambiente fallisce, usa il workflow figlio, il job, la lane Docker, il profilo del pacchetto, il provider del modello o la lane QA che ha fallito per la prova successiva. Riesegui l'ombrello completo solo quando la correzione ha modificato l'orchestrazione condivisa del rilascio o ha reso obsoleta la precedente evidenza di tutti gli ambienti. Il verificatore finale dell'ombrello ricontrolla gli ID registrati delle esecuzioni dei workflow figli, quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre `Verify full validation` fallito.

Per un recupero delimitato, passa `rerun_group` all'ombrello. `all` è la vera esecuzione del release candidate, `ci` esegue solo il normale figlio CI, `plugin-prerelease` esegue solo il figlio Plugin riservato al rilascio, `release-checks` esegue ogni ambiente di rilascio, e i gruppi di rilascio più ristretti sono `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram` quando viene fornita la lane Telegram autonoma del pacchetto.

### Vitest

L'ambiente Vitest è il workflow figlio manuale `CI`. La CI manuale aggira intenzionalmente lo scoping delle modifiche e forza il normale grafo dei test per il release candidate: shard Linux Node, shard dei Plugin in bundle, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Skills Python, Windows, macOS, Android e i18n della Control UI.

Usa questo ambiente per rispondere a "l'albero sorgente ha superato la suite di test normale completa?" Non è uguale alla validazione del prodotto sul percorso di rilascio. Evidenza da conservare:

- riepilogo di `Full Release Validation` che mostra l'URL dell'esecuzione `CI` inviata
- esecuzione `CI` verde sull'esatto SHA di destinazione
- nomi degli shard falliti o lenti dai job CI quando si analizzano regressioni
- artefatti di tempistica Vitest come `.artifacts/vitest-shard-timings.json` quando un'esecuzione richiede analisi delle prestazioni

Esegui la CI manuale direttamente solo quando il rilascio richiede una CI normale deterministica ma non gli ambienti Docker, QA Lab, live, cross-OS o pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

L'ambiente Docker vive in `OpenClaw Release Checks` tramite `openclaw-live-and-e2e-checks-reusable.yml`, più il workflow `install-smoke` in modalità rilascio. Valida il release candidate tramite ambienti Docker pacchettizzati invece che solo con test a livello sorgente.

La copertura Docker del rilascio include:

- smoke di installazione completo con lo smoke di installazione globale Bun lento abilitato
- preparazione/riuso dell'immagine smoke Dockerfile di root per SHA di destinazione, con job smoke QR, root/gateway e installer/Bun eseguiti come shard install-smoke separati
- lane E2E del repository
- chunk Docker del percorso di rilascio: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` e
  `bundled-channels-contracts`
- copertura OpenWebUI dentro il chunk `plugins-runtime-services` quando richiesta
- lane delle dipendenze dei canali in bundle divise tra chunk channel-smoke, update-target e contratti setup/runtime invece di un unico grande job per i canali in bundle
- lane di installazione/disinstallazione dei Plugin in bundle divise da
  `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura modello live Docker quando i controlli di rilascio includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica `.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`, tempistiche delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per il recupero mirato, usa `docker_lanes=<lane[,lane]>` sul workflow riutilizzabile live/E2E invece di rieseguire tutti i chunk di rilascio. I comandi di riesecuzione generati includono, quando disponibili, il precedente `package_artifact_run_id` e gli input dell'immagine Docker preparata, quindi una lane fallita può riutilizzare lo stesso tarball e le stesse immagini GHCR.

### QA Lab

L'ambiente QA Lab fa anch'esso parte di `OpenClaw Release Checks`. È il gate di rilascio per il comportamento agentico e a livello di canale, separato da Vitest e dalla meccanica dei pacchetti Docker.

La copertura QA Lab del rilascio include:

- gate di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6 usando il pacchetto di parità agentica
- profilo QA Matrix live veloce usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease di credenziali Convex CI
- `pnpm qa:otel:smoke` quando la telemetria di rilascio richiede prova locale esplicita

Usa questo ambiente per rispondere a "il rilascio si comporta correttamente negli scenari QA e nei flussi live dei canali?" Conserva gli URL degli artefatti per le lane di parità, Matrix e Telegram quando approvi il rilascio. La copertura Matrix completa resta disponibile come esecuzione QA-Lab shardata manuale, invece che come lane critica di rilascio predefinita.

### Pacchetto

L'ambiente Pacchetto è il gate del prodotto installabile. È supportato da `Package Acceptance` e dal risolutore `scripts/resolve-openclaw-package-candidate.mjs`. Il risolutore normalizza un candidato nel tarball `package-under-test` consumato da Docker E2E, valida l'inventario del pacchetto, registra la versione del pacchetto e lo SHA-256, e mantiene il riferimento dell'harness del workflow separato dal riferimento sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw
- `source=ref`: pacchettizza un branch, tag o SHA completo del commit `package_ref` attendibile con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` obbligatorio
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` e `telegram_mode=mock-openai`. I chunk Docker del percorso di rilascio coprono le lane sovrapposte di installazione, aggiornamento e aggiornamento Plugin; Package Acceptance mantiene compatibilità dei canali in bundle nativa degli artefatti, fixture Plugin offline e QA del pacchetto Telegram contro lo stesso tarball risolto. È il sostituto nativo GitHub per la maggior parte della copertura package/update che in precedenza richiedeva Parallels. I controlli di rilascio cross-OS restano importanti per onboarding, installer e comportamento della piattaforma specifici del sistema operativo, ma la validazione del prodotto package/update dovrebbe preferire Package Acceptance.

La permissività legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a `2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate su npm: voci private dell'inventario QA mancanti dal tarball, `gateway install --wrapper` mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione Plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può generare avvisi per file di timbro dei metadati di build locali già distribuiti. I pacchetti successivi devono soddisfare i contratti moderni dei pacchetti; quelle stesse lacune fanno fallire la validazione del rilascio.

Usa profili Package Acceptance più ampi quando la domanda sul rilascio riguarda un pacchetto realmente installabile:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Profili pacchetto comuni:

- `smoke`: installazione rapida del pacchetto/canale/agente, rete Gateway e lane di ricaricamento della configurazione
- `package`: contratti di installazione/aggiornamento/pacchetto Plugin senza ClawHub live; questo è il valore predefinito dei controlli di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI e OpenWebUI
- `full`: chunk Docker del percorso di rilascio con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o `telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il tarball `package-under-test` risolto alla lane Telegram; il workflow Telegram autonomo accetta ancora una specifica npm pubblicata per controlli post-pubblicazione.

## Input workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` o `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA completo a 40 caratteri del commit corrente del branch del workflow per un preflight di sola validazione
- `preflight_only`: `true` per sola validazione/build/pacchetto, `false` per il vero percorso di pubblicazione
- `preflight_run_id`: obbligatorio nel vero percorso di pubblicazione affinché il workflow riutilizzi il tarball preparato dall'esecuzione preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; valore predefinito `beta`

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o SHA completo del commit da validare. I controlli con segreti richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio.

Regole:

- I tag stabili e di correzione possono pubblicare su `beta` o `latest`
- I tag prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input con SHA completo del commit è consentito solo quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre solo di validazione
- Il vero percorso di pubblicazione deve usare lo stesso `npm_dist_tag` usato durante il preflight; il workflow verifica che i metadati prima della pubblicazione continuino a corrispondere

## Sequenza di rilascio npm stabile

Quando si prepara un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA del commit completo corrente del ramo del workflow
     per un dry run di sola convalida del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul ramo di release, sul tag di release o sullo SHA
   completo del commit quando vuoi la CI normale più copertura live di prompt cache, Docker, QA Lab,
   Matrix e Telegram da un unico workflow manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sul ref di release
5. Salva il `preflight_run_id` riuscito
6. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso
   `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
7. Se la release è arrivata su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se la release è stata pubblicata intenzionalmente direttamente su `latest` e `beta`
   deve seguire subito la stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   pianificata di autoriparazione sposti `beta` in seguito

La mutazione dei dist-tag vive nel repository privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repository pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

Se un maintainer deve ripiegare sull'autenticazione npm locale, esegui qualsiasi comando della CLI
1Password (`op`) solo all'interno di una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; tenerlo dentro tmux rende prompt,
avvisi e gestione OTP osservabili e previene avvisi ripetuti dell'host.

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

I maintainer usano la documentazione privata di release in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.

## Correlati

- [Canali di release](/it/install/development-channels)
