---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida del rilascio o dell'accettazione dei pacchetti
    - Cerchi denominazione e cadenza delle versioni
summary: Corsie di release, checklist dell'operatore, box di validazione, denominazione delle versioni e cadenza
title: Criteri di rilascio
x-i18n:
    generated_at: "2026-04-30T09:11:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali pubblici di rilascio:

- stable: rilasci con tag che pubblicano su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: la testa mobile di `main`

## Nomi delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttiva stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l'attuale rilascio stabile npm promosso
- `beta` indica l'attuale destinazione di installazione beta
- I rilasci stabili e correttivi stabili pubblicano su npm `beta` per impostazione predefinita; gli operatori di rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  compilazione/firma/notarizzazione dell'app mac riservate ai rilasci stabili salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima dalla beta
- Il rilascio stabile segue solo dopo che l'ultima beta è stata convalidata
- I manutentori normalmente creano i rilasci da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la convalida e le correzioni del rilascio non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i manutentori creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- Procedura dettagliata di rilascio, approvazioni, credenziali e note di recupero sono
  riservate ai manutentori

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, recupero dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai manutentori.

1. Parti dall'attuale `main`: scarica l'ultima versione, conferma che il commit target sia stato inviato,
   e conferma che la CI dell'attuale `main` sia abbastanza verde da poter creare un branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate agli utenti, esegui il commit, inviala, quindi esegui rebase/pull
   ancora una volta prima di creare il branch.
3. Rivedi i record di compatibilità del rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure annota perché viene
   intenzionalmente mantenuta.
4. Crea `release/YYYY.M.D` dall'attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, quindi esegui il
   preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, e `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   uno SHA completo di 40 caratteri del branch di rilascio è consentito per il preflight
   solo di convalida. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-rilascio con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per i quattro grandi ambienti di test di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio e riesegui il più piccolo
   file, canale, job di workflow, profilo di pacchetto, provider o allowlist di modelli fallito che
   provi la correzione. Riesegui l'ombrello completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, crea il tag `vYYYY.M.D-beta.N`, pubblica con dist-tag npm `beta`, quindi esegui
   l'accettazione del pacchetto post-pubblicazione contro il pacchetto pubblicato `openclaw@YYYY.M.D-beta.N`
   o `openclaw@beta`. Se una beta inviata o pubblicata richiede una correzione, crea
   il `-beta.N` successivo; non eliminare né riscrivere la vecchia beta.
10. Per stable, continua solo dopo che la beta verificata o la candidata al rilascio ha le
    prove di convalida richieste. La pubblicazione npm stabile riutilizza l'artefatto di
    preflight riuscito tramite `preflight_run_id`; la prontezza del rilascio macOS stabile
    richiede anche il `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e il file
    `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram opzionale
    autonomo pubblicato da npm quando hai bisogno di prova del canale post-pubblicazione,
    la promozione del dist-tag quando necessario, le note di rilascio/prerelease GitHub dalla
    sezione completa corrispondente di `CHANGELOG.md`, e i passaggi di annuncio del rilascio.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così il TypeScript dei test resta
  coperto al di fuori del gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli più ampi sui cicli di importazione
  e sui confini architetturali sono verdi al di fuori del gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di rilascio
  `dist/*` previsti e il bundle della Control UI esistono per il passaggio di
  validazione del pacchetto
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per
  avviare tutte le caselle di test pre-rilascio da un unico punto di ingresso. Accetta un branch,
  tag o SHA completo del commit, esegue il dispatch manuale di `CI` ed esegue il dispatch di
  `OpenClaw Release Checks` per install smoke, accettazione pacchetto, suite Docker
  del percorso di rilascio, live/E2E, OpenWebUI, parità QA Lab, Matrix e corsie Telegram.
  Fornisci `npm_telegram_package_spec` solo dopo la pubblicazione di un pacchetto
  e quando deve essere eseguito anche l'E2E Telegram post-pubblicazione. Fornisci
  `evidence_package_spec` quando il report di evidenza privato deve dimostrare che la
  validazione corrisponde a un pacchetto npm pubblicato senza forzare l'E2E Telegram.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova da canale laterale
  per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref`
  per creare il pacchetto da un branch/tag/SHA `package_ref` attendibile con l'harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256
  obbligatorio; oppure `source=artifact` per un tarball caricato da un'altra esecuzione
  di GitHub Actions. Il workflow risolve il candidato in
  `package-under-test`, riutilizza lo scheduler di rilascio Docker E2E contro quel
  tarball e può eseguire la QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: corsie di installazione/canale/agente, rete del Gateway e ricaricamento della configurazione
  - `package`: corsie di pacchetto/aggiornamento/Plugin native dell'artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo pacchetto più canali MCP, pulizia cron/subagente,
    ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura completa della CI normale
  per il candidato di rilascio. I dispatch manuali della CI bypassano lo scoping delle modifiche
  e forzano gli shard Linux Node, gli shard dei Plugin in bundle, i contratti dei canali,
  la compatibilità con Node 22, `check`, `check-additional`, lo smoke di build,
  i controlli della documentazione, le Skills Python, Windows, macOS, Android e le corsie i18n
  della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando validi la telemetria di rilascio. Esercita
  QA-lab tramite un ricevitore OTLP/HTTP locale e verifica i nomi degli span di traccia
  esportati, gli attributi limitati e la redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche il gate di parità mock di QA Lab più il profilo Matrix live
  veloce e la corsia QA Telegram prima dell'approvazione del rilascio. Le corsie live
  usano l'ambiente `qa-live-shared`; Telegram usa anche lease delle credenziali Convex CI.
  Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi l'inventario completo di trasporto
  Matrix, media ed E2EE in parallelo.
- La validazione runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il
  workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il percorso reale di rilascio npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  corsia, così non rallentano o bloccano la pubblicazione
- I controlli di rilascio che portano segreti devono essere inviati tramite `Full Release
Validation` o dal workflow ref `main`/release, così la logica del workflow e
  i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, tag o SHA completo del commit purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Il preflight di sola validazione di `OpenClaw NPM Release` accetta anche lo SHA completo
  di 40 caratteri del commit del branch del workflow corrente senza richiedere un tag pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un tag di rilascio reale
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner
  ospitati da GitHub, mentre il percorso di validazione non mutante può usare i runner Linux
  Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando sia i segreti di workflow `OPENAI_API_KEY` sia `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la corsia separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione
  del registro pubblicato in un prefisso temporaneo pulito
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram e vero E2E Telegram
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente
  le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-poi-promozione:
  - la pubblicazione npm reale deve superare un npm `preflight_run_id` riuscito
  - la pubblicazione npm reale deve essere inviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - i rilasci npm stabili hanno come predefinito `beta`
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione dei dist-tag npm basata su token ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repo pubblico mantiene la pubblicazione solo OIDC
  - il workflow pubblico `macOS Release` è solo di validazione
  - la pubblicazione mac privata reale deve superare il `preflight_run_id`
    e il `validate_run_id` mac privati riusciti
  - i percorsi di pubblicazione reali promuovono artefatti preparati invece di ricompilarli
    di nuovo
- Per rilasci di correzione stabili come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di rilascio non possono lasciare silenziosamente le installazioni globali più vecchie sul
  payload stabile di base
- Il preflight di rilascio npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto,
  così non spediamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che l'installazione dal registro pubblicato
  contenga dipendenze runtime non vuote dei Plugin in bundle sotto il layout root `dist/*`.
  Un rilascio pubblicato con payload delle dipendenze dei Plugin in bundle mancanti o vuoti
  fallisce il verificatore postpublish e non può essere promosso
  a `latest`.
- `pnpm test:install:smoke` applica anche il budget npm pack `unpackedSize` sul
  tarball candidato di aggiornamento, così l'e2e dell'installer rileva rigonfiamenti accidentali del pacchetto
  prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato pianificazione CI, manifest di timing delle estensioni o
  matrici di test delle estensioni, rigenera e rivedi gli output della matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di rilascio non
  descrivono un layout CI obsoleto
- La prontezza del rilascio macOS stabile include anche le superfici dell'updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non debug, un URL del feed Sparkle
    non vuoto e un `CFBundleVersion` pari o superiore al floor canonico della build Sparkle
    per quella versione di rilascio

## Caselle di test di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da
un unico punto di ingresso. Eseguilo dal workflow ref attendibile `main` e passa il branch,
tag o SHA completo del commit di rilascio come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Il workflow risolve il ref di destinazione, esegue il dispatch manuale di `CI` con
`target_ref=<release-ref>`, esegue il dispatch di `OpenClaw Release Checks` e,
facoltativamente, esegue il dispatch dell'E2E Telegram post-pubblicazione autonomo quando
`npm_telegram_package_spec` è impostato. `OpenClaw Release Checks` poi distribuisce
install smoke, controlli di rilascio cross-OS, copertura live/E2E Docker del percorso di rilascio,
Package Acceptance con QA del pacchetto Telegram, parità QA Lab, Matrix live e
Telegram live. Un'esecuzione completa è accettabile solo quando il riepilogo di `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti, e qualunque figlio opzionale
`npm_telegram` è riuscito o intenzionalmente saltato. Il riepilogo finale del
verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
I workflow figli vengono inviati dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch o tag di rilascio più vecchio. Non esiste un input workflow-ref separato per Full Release Validation;
scegli l'harness attendibile scegliendo il ref di esecuzione del workflow.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker più veloce e critico per il rilascio
- `stable`: minimum più copertura stabile di provider/backend per l'approvazione del rilascio
- `full`: stable più ampia copertura consultiva di provider/media

`OpenClaw Release Checks` usa il workflow ref attendibile per risolvere il ref di destinazione
una volta come `release-package-under-test` e riutilizza quell'artefatto sia nei
controlli Docker del percorso di rilascio sia in Package Acceptance. Questo mantiene tutte le
caselle rivolte al pacchetto sugli stessi byte ed evita build ripetute del pacchetto.
L'install smoke cross-OS OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4-mini`, perché questa corsia sta
dimostrando installazione del pacchetto, onboarding, avvio del Gateway e un turno live
dell'agente, non misurando il modello predefinito più lento. La matrice più ampia dei provider
live resta il luogo per la copertura specifica dei modelli.

Usa queste varianti in base alla fase del rilascio:

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

Non usare il flusso di lavoro ombrello completo come prima riesecuzione dopo una correzione mirata. Se un ambiente fallisce, usa il flusso di lavoro figlio, il job, la corsia Docker, il profilo di pacchetto, il provider di modelli o la corsia QA falliti per la prossima prova. Esegui di nuovo l'ombrello completo solo quando la correzione ha modificato l'orchestrazione condivisa del rilascio o ha reso obsolete le prove precedenti di tutti gli ambienti. Il verificatore finale dell'ombrello ricontrolla gli ID registrati delle esecuzioni dei flussi di lavoro figli, quindi dopo la riesecuzione riuscita di un flusso di lavoro figlio, riesegui solo il job padre `Verify full validation` fallito.

Per un recupero delimitato, passa `rerun_group` all'ombrello. `all` è la vera esecuzione del candidato di rilascio, `ci` esegue solo il figlio CI normale, `plugin-prerelease` esegue solo il figlio plugin riservato al rilascio, `release-checks` esegue ogni ambiente di rilascio, e i gruppi di rilascio più ristretti sono `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram` quando viene fornita la corsia Telegram del pacchetto autonoma.

### Vitest

L'ambiente Vitest è il flusso di lavoro figlio manuale `CI`. La CI manuale ignora intenzionalmente lo scoping delle modifiche e forza il grafo di test normale per il candidato di rilascio: shard Linux Node, shard dei plugin inclusi, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke test di build, controlli della documentazione, Skills Python, Windows, macOS, Android e i18n della Control UI.

Usa questo ambiente per rispondere a "l'albero sorgente ha superato la suite di test normale completa?" Non è la stessa cosa della validazione del prodotto sul percorso di rilascio. Prove da conservare:

- riepilogo `Full Release Validation` che mostra l'URL dell'esecuzione `CI` avviata
- esecuzione `CI` riuscita sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI durante l'analisi delle regressioni
- artefatti dei tempi Vitest come `.artifacts/vitest-shard-timings.json` quando un'esecuzione richiede un'analisi delle prestazioni

Esegui direttamente la CI manuale solo quando il rilascio richiede una CI normale deterministica ma non gli ambienti Docker, QA Lab, live, cross-OS o di pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

L'ambiente Docker risiede in `OpenClaw Release Checks` tramite `openclaw-live-and-e2e-checks-reusable.yml`, più il flusso di lavoro `install-smoke` in modalità rilascio. Valida il candidato di rilascio tramite ambienti Docker pacchettizzati invece che solo con test a livello di sorgente.

La copertura Docker del rilascio include:

- smoke test completo di installazione con lo smoke test lento di installazione globale Bun abilitato
- preparazione/riuso dell'immagine per smoke test del Dockerfile root in base allo SHA di destinazione, con job di smoke test QR, root/gateway e installer/Bun eseguiti come shard install-smoke separati
- corsie E2E del repository
- blocchi Docker del percorso di rilascio: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` e `bundled-channels-contracts`
- copertura OpenWebUI all'interno del blocco `plugins-runtime-services` quando richiesta
- corsie delle dipendenze dei canali inclusi suddivise tra i blocchi channel-smoke, update-target e dei contratti setup/runtime invece di un unico grande job bundled-channel
- corsie di installazione/disinstallazione dei plugin inclusi suddivise da `bundled-plugin-install-uninstall-0` fino a `bundled-plugin-install-uninstall-23`
- suite dei provider live/E2E e copertura Docker dei modelli live quando i controlli di rilascio includono suite live

Usa gli artefatti Docker prima di rieseguire. Il pianificatore del percorso di rilascio carica `.artifacts/docker-tests/` con log delle corsie, `summary.json`, `failures.json`, tempi delle fasi, JSON del piano del pianificatore e comandi di riesecuzione. Per un recupero mirato, usa `docker_lanes=<lane[,lane]>` sul flusso di lavoro live/E2E riutilizzabile invece di rieseguire tutti i blocchi di rilascio. I comandi di riesecuzione generati includono il `package_artifact_run_id` precedente e gli input delle immagini Docker preparate quando disponibili, così una corsia fallita può riusare lo stesso tarball e le immagini GHCR.

### QA Lab

L'ambiente QA Lab fa anch'esso parte di `OpenClaw Release Checks`. È il gate di rilascio per il comportamento agentico e a livello di canale, separato da Vitest e dalle meccaniche dei pacchetti Docker.

La copertura QA Lab del rilascio include:

- gate di parità simulato che confronta la corsia candidata OpenAI con la linea base Opus 4.6 usando il pacchetto di parità agentica
- profilo QA Matrix live veloce usando l'ambiente `qa-live-shared`
- corsia QA Telegram live usando lease di credenziali Convex CI
- `pnpm qa:otel:smoke` quando la telemetria del rilascio richiede una prova locale esplicita

Usa questo ambiente per rispondere a "il rilascio si comporta correttamente negli scenari QA e nei flussi di canale live?" Conserva gli URL degli artefatti per le corsie di parità, Matrix e Telegram quando approvi il rilascio. La copertura Matrix completa resta disponibile come esecuzione QA-Lab manuale suddivisa in shard, invece che come corsia predefinita critica per il rilascio.

### Pacchetto

L'ambiente Pacchetto è il gate del prodotto installabile. È supportato da `Package Acceptance` e dal resolver `scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un candidato nel tarball `package-under-test` usato da Docker E2E, valida l'inventario del pacchetto, registra la versione del pacchetto e lo SHA-256, e mantiene separata la ref dell'harness del flusso di lavoro dalla ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw
- `source=ref`: impacchetta un branch, tag o SHA di commit completo attendibile come `package_ref` con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` obbligatorio
- `source=artifact`: riusa un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` e `telegram_mode=mock-openai`. I blocchi Docker del percorso di rilascio coprono le corsie sovrapposte di installazione, aggiornamento e aggiornamento dei plugin; Package Acceptance mantiene la compatibilità dei canali inclusi nativa per gli artefatti, le fixture dei plugin offline e la QA del pacchetto Telegram sullo stesso tarball risolto. È il sostituto nativo di GitHub per la maggior parte della copertura di pacchetto/aggiornamento che prima richiedeva Parallels. I controlli di rilascio cross-OS restano importanti per configurazione iniziale, programma di installazione e comportamento di piattaforma specifici per OS, ma la validazione del prodotto per pacchetto/aggiornamento dovrebbe preferire Package Acceptance.

La tolleranza legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino alla versione `2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate su npm: voci private dell'inventario QA mancanti dal tarball, `gateway install --wrapper` mancante, file di patch mancanti nella fixture git derivata dal tarball, mancanza di `update.channel` persistito, posizioni legacy dei record di installazione dei plugin, mancanza della persistenza dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Il pacchetto `2026.4.26` pubblicato può emettere avvisi per i file locali di marcatura dei metadati di build già distribuiti. I pacchetti successivi devono soddisfare i contratti di pacchetto moderni; le stesse lacune fanno fallire la validazione del rilascio.

Usa profili Package Acceptance più ampi quando la questione del rilascio riguarda un pacchetto installabile effettivo:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Profili di pacchetto comuni:

- `smoke`: corsie rapide per installazione pacchetto/canale/agente, rete Gateway e ricaricamento della configurazione
- `package`: contratti di installazione/aggiornamento/pacchetto plugin senza ClawHub live; questo è il valore predefinito dei controlli di rilascio
- `product`: `package` più canali MCP, pulizia Cron/subagenti, ricerca web OpenAI e OpenWebUI
- `full`: blocchi Docker del percorso di rilascio con OpenWebUI
- `custom`: lista `docker_lanes` esatta per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o `telegram_mode=live-frontier` su Package Acceptance. Il flusso di lavoro passa il tarball `package-under-test` risolto alla corsia Telegram; il flusso di lavoro Telegram autonomo accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Input del flusso di lavoro NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` o `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA di commit completo a 40 caratteri del branch del flusso di lavoro corrente per un controllo preliminare solo di validazione
- `preflight_only`: `true` solo per validazione/compilazione/pacchetto, `false` per il percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale affinché il flusso di lavoro riusi il tarball preparato dall'esecuzione preliminare riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; valore predefinito `beta`

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o SHA di commit completo da validare. I controlli che usano segreti richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio.

Regole:

- I tag stabili e di correzione possono pubblicare su `beta` o `latest`
- I tag di pre-rilascio beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input di SHA di commit completo è consentito solo quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre solo di validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il controllo preliminare; il flusso di lavoro verifica che quei metadati restino validi prima di continuare con la pubblicazione

## Sequenza di rilascio npm stabile

Quando si prepara un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA di commit completo corrente del branch del flusso di lavoro per un'esecuzione di prova solo di validazione del flusso di lavoro preliminare
2. Scegli `npm_dist_tag=beta` per il flusso normale con beta iniziale, oppure `latest` solo quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul branch di rilascio, sul tag di rilascio o sullo SHA di commit completo quando vuoi la CI normale più copertura di cache dei prompt live, Docker, QA Lab, Matrix e Telegram da un unico flusso di lavoro manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece il flusso di lavoro manuale `CI` sulla ref del rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
7. Se il rilascio è stato pubblicato su `beta`, usa il flusso di lavoro privato `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` per promuovere quella versione stabile da `beta` a `latest`
8. Se il rilascio è stato pubblicato intenzionalmente direttamente su `latest` e `beta` dovrebbe seguire immediatamente la stessa build stabile, usa lo stesso flusso di lavoro privato per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione pianificata di auto-riparazione sposti `beta` più tardi

La modifica dei dist-tag risiede nel repo privato per motivi di sicurezza perché richiede ancora `NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene documentati e visibili all'operatore sia il percorso di pubblicazione diretta sia il percorso di promozione con beta iniziale.

Se un manutentore deve ricorrere all'autenticazione npm locale, esegui qualsiasi comando della CLI (`op`) di 1Password solo all'interno di una sessione tmux dedicata. Non chiamare `op` direttamente dalla shell principale dell'agente; mantenerlo all'interno di tmux rende osservabili prompt, avvisi e gestione degli OTP e impedisce avvisi ripetuti dell'host.

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

I manutentori usano la documentazione di rilascio privata in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per la procedura operativa effettiva.

## Correlati

- [Canali di rilascio](/it/install/development-channels)
