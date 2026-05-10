---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida del rilascio o dell'accettazione del pacchetto
    - Cerchi denominazione e cadenza delle versioni
summary: Canali di rilascio, checklist dell'operatore, riquadri di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-10T19:50:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: rilasci con tag che pubblicano su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag prerelease che pubblicano su npm `beta`
- dev: la head in movimento di `main`

## Denominazione delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttivo stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l'attuale rilascio npm stabile promosso
- `beta` indica l'attuale destinazione di installazione beta
- I rilasci stabili e correttivi stabili pubblicano su npm `beta` per impostazione predefinita; gli operatori del rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta convalidata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app Mac riservate ai rilasci stabili salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Lo stabile segue solo dopo la convalida dell'ultima beta
- I maintainer normalmente preparano i rilasci da un branch `release/YYYY.M.D` creato
  da `main` corrente, in modo che la convalida e le correzioni del rilascio non blocchino il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e necessita di una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- Procedura di rilascio dettagliata, approvazioni, credenziali e note di ripristino sono
  riservate ai maintainer

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti da `main` corrente: scarica l'ultima versione, conferma che il commit target sia stato inviato,
   e conferma che la CI corrente di `main` sia abbastanza verde da poterne creare un branch.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci rivolte agli utenti, fai il commit, inviala, e fai rebase/pull
   ancora una volta prima di creare il branch.
3. Rivedi i record di compatibilita' del rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la
   compatibilita' scaduta solo quando il percorso di upgrade resta coperto, oppure registra perche' viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.D` da `main` corrente; non eseguire il normale lavoro di rilascio
   direttamente su `main`.
5. Incrementa ogni posizione di versione richiesta per il tag previsto, poi esegui
   `pnpm release:prep`. Aggiorna versioni dei plugin, inventario dei plugin, schema di config,
   metadati di config dei canali inclusi, baseline della documentazione di config, esportazioni del plugin SDK
   e baseline dell'API del plugin SDK nell'ordine corretto. Fai il commit di ogni deriva generata
   prima del tagging. Poi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, e `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   per il preflight solo di convalida e' consentito uno SHA completo di 40 caratteri del branch di rilascio.
   Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-release con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo e' l'unico punto di ingresso manuale
   per i quattro grandi ambienti di test del rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio ed esegui di nuovo il piu' piccolo
   file, canale, job del workflow, profilo di pacchetto, provider o allowlist di modelli fallito che
   dimostri la correzione. Riesegui l'umbrella completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, tagga `vYYYY.M.D-beta.N`, poi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   invia tutti i pacchetti plugin pubblicabili a npm e lo stesso insieme a
   ClawHub in parallelo, e poi promuove l'artefatto di preflight npm OpenClaw preparato
   con il dist-tag corrispondente non appena la pubblicazione npm dei plugin riesce.
   Dopo il successo del child di pubblicazione npm di OpenClaw, crea o aggiorna la
   pagina GitHub release/prerelease corrispondente dalla sezione completa corrispondente di
   `CHANGELOG.md`. I rilasci stabili pubblicati su npm `latest` diventano il
   rilascio GitHub latest; i rilasci di manutenzione stabili mantenuti su npm `beta` sono
   creati con GitHub `latest=false`.
   La pubblicazione su ClawHub potrebbe essere ancora in esecuzione mentre OpenClaw npm pubblica, ma il
   workflow di pubblicazione del rilascio stampa immediatamente gli ID delle esecuzioni child. Per impostazione predefinita
   non attende ClawHub dopo averla inviata, quindi la disponibilita' npm di OpenClaw
   non e' bloccata da approvazioni ClawHub o lavoro sul registry piu' lenti; imposta
   `wait_for_clawhub=true` quando ClawHub deve bloccare il completamento del workflow. Il
   percorso ClawHub riprova gli errori temporanei di installazione delle dipendenze CLI, pubblica
   i plugin che superano la preview anche quando una cella preview ha un flaky failure, e termina con
   la verifica del registry per ogni versione di plugin attesa, cosi' le pubblicazioni parziali
   restano visibili e ritentabili. Dopo la pubblicazione, esegui
   l'accettazione del pacchetto post-pubblicazione
   contro il pacchetto pubblicato `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta`. Se una prerelease inviata o pubblicata necessita di una correzione,
   crea il numero di prerelease corrispondente successivo; non eliminare o riscrivere la vecchia
   prerelease.
10. Per stable, continua solo dopo che la beta o release candidate convalidata ha le
    prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso
    `OpenClaw Release Publish`, riutilizzando l'artefatto di preflight riuscito tramite
    `preflight_run_id`; la prontezza del rilascio macOS stabile richiede anche
    `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
    Il workflow privato di pubblicazione macOS pubblica automaticamente l'appcast firmato su `main`
    pubblico dopo la verifica degli asset di rilascio; se la protezione del branch blocca
    il push diretto, apre o aggiorna una PR appcast.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram standalone opzionale
    su npm pubblicato quando servono prove del canale post-pubblicazione,
    la promozione del dist-tag quando necessaria, verifica la pagina GitHub release generata,
    ed esegui i passaggi di annuncio del rilascio.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio, in modo che il TypeScript dei test resti
  coperto al di fuori del gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, in modo che i controlli più ampi sui
  cicli di importazione e sui confini architetturali siano verdi al di fuori del gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, in modo che gli artefatti di rilascio
  `dist/*` attesi e il bundle della Control UI esistano per il passaggio di validazione del pacchetto
- Esegui `pnpm release:prep` dopo l’aumento della versione root e prima del tagging. Esegue
  tutti i generatori di rilascio deterministici che comunemente divergono dopo una modifica di
  versione/configurazione/API: versioni dei plugin, inventario dei plugin, schema di configurazione base,
  metadati di configurazione dei canali inclusi, baseline dei documenti di configurazione, export del plugin SDK
  e baseline dell’API del plugin SDK. `pnpm release:check` riesegue queste verifiche
  in modalità check e segnala in un solo passaggio ogni errore di drift generato che trova
  prima di eseguire i controlli di rilascio del pacchetto.
- Esegui il workflow manuale `Full Release Validation` prima dell’approvazione del rilascio per
  avviare tutti i test box pre-rilascio da un unico punto di ingresso. Accetta un branch,
  un tag o uno SHA completo di commit, invia manualmente `CI` e invia
  `OpenClaw Release Checks` per smoke di installazione, accettazione del pacchetto, controlli del pacchetto
  cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite
  mantengono il soak esaustivo live/E2E e del percorso di rilascio Docker dietro
  `run_release_soak=true`; `release_profile=full` forza l’attivazione del soak. Con
  `release_profile=full` e `rerun_group=all`, esegue anche l’E2E Telegram del pacchetto
  contro l’artefatto `release-package-under-test` dai controlli di rilascio.
  Fornisci `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso
  E2E Telegram deve provare anche il pacchetto npm pubblicato. Fornisci
  `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance
  deve eseguire la propria matrice package/update contro il pacchetto npm distribuito invece
  dell’artefatto costruito dallo SHA. Fornisci
  `evidence_package_spec` quando il report di evidenza privato deve provare che la
  validazione corrisponde a un pacchetto npm pubblicato senza forzare l’E2E Telegram.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova da canale laterale
  per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref`
  per impacchettare un branch/tag/SHA `package_ref` attendibile con l’harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256
  obbligatorio; oppure `source=artifact` per un tarball caricato da un’altra esecuzione di GitHub
  Actions. Il workflow risolve il candidato in
  `package-under-test`, riusa lo scheduler di rilascio Docker E2E contro quel
  tarball e può eseguire la QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le
  lane Docker selezionate includono `published-upgrade-survivor`, l’artefatto
  del pacchetto è il candidato e `published_upgrade_survivor_baseline` seleziona
  la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato come
  CLI installata e come package-under-test, così esercita il percorso di riavvio
  gestito del comando di aggiornamento del candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane di installazione/canale/agente, rete Gateway e ricaricamento configurazione
  - `package`: lane package/update/restart/plugin native dell’artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent,
    ricerca web OpenAI e OpenWebUI
  - `full`: segmenti del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la normale copertura CI completa
  per il candidato al rilascio. Gli invii manuali di CI bypassano lo scoping delle modifiche
  e forzano gli shard Linux Node, gli shard dei plugin inclusi, i contratti dei canali,
  la compatibilità Node 22, `check`, `check-additional`, smoke di build,
  controlli docs, Skills Python, Windows, macOS, Android e lane i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando validi la telemetria di rilascio. Esercita
  QA-lab tramite un ricevitore locale OTLP/HTTP e verifica i nomi degli span di trace
  esportati, gli attributi limitati e la redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Avvialo da `release/YYYY.M.D` (o da `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di rilascio e il
  `preflight_run_id` npm OpenClaw riuscito, e mantieni l’ambito predefinito di pubblicazione dei plugin
  `all-publishable` a meno che tu stia eseguendo deliberatamente una riparazione mirata. Il
  workflow serializza la pubblicazione npm dei plugin, la pubblicazione ClawHub dei plugin e la pubblicazione npm di OpenClaw
  in modo che il pacchetto core non venga pubblicato prima dei suoi plugin esternalizzati.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo
  Matrix live rapido e la lane QA Telegram prima dell’approvazione del rilascio. Le lane live
  usano l’ambiente `qa-live-shared`; Telegram usa anche lease di credenziali CI Convex.
  Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi l’inventario completo di trasporto,
  media ed E2EE Matrix in parallelo.
- La validazione runtime di installazione e upgrade cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente
  il workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il vero percorso di rilascio npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  lane così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che usano segreti devono essere inviati tramite `Full Release
Validation` o dal workflow ref `main`/release, così logica del workflow e
  segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA completo di commit purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Anche il preflight solo di validazione `OpenClaw NPM Release` accetta lo SHA completo
  di 40 caratteri del commit del branch di workflow corrente senza richiedere un tag pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una vera pubblicazione
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la vera pubblicazione richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il vero percorso di pubblicazione e promozione su runner GitHub-hosted,
  mentre il percorso di validazione non mutante può usare i runner Blacksmith Linux più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti di workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la lane separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell’approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione
  del registro pubblicato in un nuovo prefisso temporaneo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram ed E2E Telegram reale
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Gli one-off locali dei maintainer possono omettere le variabili Convex e passare direttamente le tre
  credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta post-pubblicazione completo da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L’helper esegue la validazione Parallels di aggiornamento npm/target fresco, invia `NPM Telegram Beta E2E`, interroga l’esecuzione esatta del workflow, scarica l’artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L’automazione di rilascio dei maintainer ora usa preflight-poi-promozione:
  - la vera pubblicazione npm deve superare un `preflight_run_id` npm riuscito
  - la vera pubblicazione npm deve essere inviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell’esecuzione preflight riuscita
  - i rilasci npm stabili usano per impostazione predefinita `beta`
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione token-based dei dist-tag npm ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repository pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di validazione; quando un tag vive solo su un
    branch di rilascio ma il workflow viene inviato da `main`, imposta
    `public_release_branch=release/YYYY.M.D`
  - la vera pubblicazione mac privata deve superare `preflight_run_id` e `validate_run_id`
    mac privati riusciti
  - i veri percorsi di pubblicazione promuovono gli artefatti preparati invece di ricostruirli
    di nuovo
- Per rilasci stabili di correzione come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di upgrade con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di rilascio non possono lasciare silenziosamente installazioni globali più vecchie
  sul payload stabile base
- Il preflight di rilascio npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`,
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che entrypoint dei plugin pubblicati e
  metadati del pacchetto siano presenti nel layout del registro installato. Un rilascio che
  distribuisce payload runtime di plugin mancanti fallisce il verificatore postpublish e
  non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` del pack npm sul
  tarball candidato di aggiornamento, così l’e2e dell’installer intercetta il gonfiamento accidentale del pacchetto
  prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato pianificazione CI, manifest di timing delle estensioni o
  matrici di test delle estensioni, rigenera e rivedi gli output della matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell’approvazione, così le note di rilascio non
  descrivono un layout CI obsoleto
- La prontezza del rilascio stabile macOS include anche le superfici dell’updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione; il
    workflow privato di pubblicazione macOS lo committa automaticamente, oppure apre una PR appcast
    quando il push diretto è bloccato
  - l’app pacchettizzata deve mantenere un bundle id non-debug, un URL feed Sparkle
    non vuoto e un `CFBundleVersion` uguale o superiore al floor di build Sparkle canonico
    per quella versione di rilascio

## Test box di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da
un unico punto di ingresso. Per una prova di commit fissato su un branch che si muove rapidamente, usa
l’helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper esegue il push di `release-ci/<sha>-...`, invia `Full Release Validation`
da quel branch con `ref=<sha>`, verifica che ogni workflow figlio `headSha`
corrisponda al target, quindi elimina il branch temporaneo. Questo evita di dimostrare per errore
un'esecuzione figlia di `main` più recente.

Per la validazione di un branch o tag di rilascio, eseguila dal workflow
ref `main` attendibile e passa il branch o tag di rilascio come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Il workflow risolve il ref target, invia manualmente `CI` con
`target_ref=<release-ref>`, invia `OpenClaw Release Checks`, prepara un artefatto
padre `release-package-under-test` per i controlli rivolti al package, e invia
l'E2E Telegram del package standalone quando `release_profile=full` con
`rerun_group=all` o quando `npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` poi distribuisce install smoke, controlli di rilascio cross-OS, copertura live/E2E Docker
del percorso di rilascio quando il soak è abilitato, Package Acceptance con QA del package
Telegram, parità QA Lab, Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il
riepilogo di `Full Release Validation`
mostra `normal_ci` e `release_checks` riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve riuscire; fuori da full/all viene saltato
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il
riepilogo finale del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
Consulta [Validazione completa del rilascio](/it/reference/full-release-validation) per la
matrice completa degli stadi, i nomi esatti dei job del workflow, le differenze
tra profilo stable e full, gli artefatti e gli handle di riesecuzione mirati.
I workflow figli vengono inviati dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` target punta a un
branch o tag di rilascio precedente. Non esiste un input separato per il workflow-ref di Full Release Validation;
scegli l'harness attendibile scegliendo il ref dell'esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per la prova esatta di un commit su `main` in movimento;
gli SHA di commit grezzi non possono essere ref di workflow dispatch, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo bloccato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker più veloce e critico per il rilascio
- `stable`: minimum più copertura stable di provider/backend per l'approvazione del rilascio
- `full`: stable più copertura ampia consultiva di provider/media

Usa `run_release_soak=true` con `stable` quando le lane bloccanti per il rilascio sono
verdi e vuoi la sweep esaustiva live/E2E, del percorso di rilascio Docker e
limitata di sopravvivenza agli upgrade pubblicati prima della promozione. Quella sweep copre
gli ultimi quattro package stable più le baseline bloccate `2026.4.23` e `2026.5.2`
più la copertura precedente `2026.4.15`, con le baseline duplicate rimosse e
ogni baseline suddivisa nel proprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa il ref attendibile del workflow per risolvere il ref target
una volta come `release-package-under-test` e riusa quell'artefatto nei controlli cross-OS,
Package Acceptance e Docker del percorso di rilascio quando il soak viene eseguito. Questo mantiene
tutti gli ambienti rivolti al package sugli stessi byte ed evita build ripetute del package.
L'install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane sta
dimostrando installazione del package, onboarding, avvio del gateway e un turno agente live
anziché fare benchmark del modello predefinito più lento. La matrice live provider
più ampia resta il luogo per la copertura specifica del modello.

Usa queste varianti a seconda dello stadio del rilascio:

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

Non usare l'umbrella completa come prima riesecuzione dopo una correzione mirata. Se un ambiente
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo del package, il provider
del modello o la lane QA falliti per la prova successiva. Esegui di nuovo l'umbrella completa solo quando
la correzione ha modificato l'orchestrazione di rilascio condivisa o ha reso obsolete le evidenze precedenti
di tutti gli ambienti. Il verificatore finale dell'umbrella ricontrolla gli id registrati delle esecuzioni dei workflow figli,
quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre
`Verify full validation` fallito.

Per un recupero limitato, passa `rerun_group` all'umbrella. `all` è la vera
esecuzione del release candidate, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio Plugin solo-rilascio, `release-checks` esegue ogni ambiente di rilascio,
e i gruppi di rilascio più stretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l'artefatto package di release-checks. Le riesecuzioni mirate
cross-OS possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti QA in release-checks sono consultivi; un fallimento solo QA
non blocca la validazione del rilascio.

### Vitest

L'ambiente Vitest è il workflow figlio manuale `CI`. La CI manuale bypassa intenzionalmente
lo scoping delle modifiche e forza il grafo di test normale per il release
candidate: shard Linux Node, shard dei Plugin inclusi, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS, Android
e i18n della Control UI.

Usa questo ambiente per rispondere a "l'albero sorgente ha superato la suite di test normale completa?"
Non è la stessa cosa della validazione di prodotto del percorso di rilascio. Evidenze da conservare:

- riepilogo `Full Release Validation` che mostra l'URL dell'esecuzione `CI` inviata
- esecuzione `CI` verde sullo SHA target esatto
- nomi degli shard falliti o lenti dai job CI quando si indagano regressioni
- artefatti di tempistica Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui la CI manuale direttamente solo quando il rilascio richiede CI normale deterministica ma
non gli ambienti Docker, QA Lab, live, cross-OS o package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

L'ambiente Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow
`install-smoke` in modalità rilascio. Valida il release candidate attraverso ambienti Docker
pacchettizzati invece che solo test a livello sorgente.

La copertura Docker di rilascio include:

- install smoke completo con lo slow Bun global install smoke abilitato
- preparazione/riuso dell'immagine smoke del Dockerfile root per SHA target, con job QR,
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
- lane separate di installazione/disinstallazione dei Plugin inclusi
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura modello live Docker quando i controlli di rilascio
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
tempistiche di fase, JSON del piano dello scheduler e comandi di riesecuzione. Per il recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow live/E2E riusabile invece di
rieseguire tutti i chunk di rilascio. I comandi di riesecuzione generati includono i precedenti
`package_artifact_run_id` e gli input delle immagini Docker preparate quando disponibili, così una
lane fallita può riusare lo stesso tarball e le stesse immagini GHCR.

### QA Lab

L'ambiente QA Lab fa anch'esso parte di `OpenClaw Release Checks`. È il gate di rilascio
del comportamento agentico e a livello di canale, separato da Vitest e dalla meccanica
dei package Docker.

La copertura QA Lab di rilascio include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live veloce usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease di credenziali CI Convex
- `pnpm qa:otel:smoke` quando la telemetria di rilascio richiede prova locale esplicita

Usa questo ambiente per rispondere a "il rilascio si comporta correttamente negli scenari QA e
nei flussi di canali live?" Conserva gli URL degli artefatti per le lane parità, Matrix e Telegram
quando approvi il rilascio. La copertura Matrix completa resta disponibile come esecuzione QA-Lab
manuale suddivisa in shard anziché come lane critica predefinita per il rilascio.

### Package

L'ambiente Package è il gate del prodotto installabile. È supportato da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, valida
l'inventario del package, registra la versione del package e lo SHA-256, e mantiene
il ref dell'harness del workflow separato dal ref del sorgente del package.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw
  esatta
- `source=ref`: pacchettizza un branch, tag o SHA di commit completo `package_ref` attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` richiesto
- `source=artifact`: riusa un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto
package di rilascio preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, update,
riavvio di update con auth configurata, installazione live di Skill ClawHub, pulizia delle dipendenze dei Plugin obsolete, fixture Plugin offline,
aggiornamento Plugin e QA del package Telegram contro lo stesso tarball risolto.
I controlli bloccanti di rilascio usano la baseline predefinita dell'ultimo package pubblicato;
`run_release_soak=true` o
`release_profile=full` si espande a ogni baseline stable pubblicata su npm da
`2026.4.23` fino a `latest` più le fixture di problemi segnalati. Usa
Package Acceptance con `source=npm` per un candidato già rilasciato, o
`source=ref`/`source=artifact` per un tarball npm locale supportato da SHA prima della
pubblicazione. È il sostituto nativo GitHub
per la maggior parte della copertura package/update che in precedenza richiedeva
Parallels. I controlli di rilascio cross-OS restano importanti per onboarding,
installer e comportamento specifici dell'OS, ma la validazione di prodotto package/update dovrebbe
preferire Package Acceptance.

La checklist canonica per la validazione degli aggiornamenti e dei Plugin è
[Testing updates and plugins](/it/help/testing-updates-plugins). Usala quando
devi decidere quale corsia locale, Docker, Package Acceptance o release-check dimostra una
installazione/aggiornamento di Plugin, una pulizia di doctor o una modifica di migrazione di
un pacchetto pubblicato. La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale separato `Update Migration`, non parte della Full Release CI.

La tolleranza legacy della package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci dell'inventario QA privato mancanti dal tarball, `gateway install --wrapper` mancante, file di patch mancanti nel fixture git derivato dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione dei Plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può emettere un avviso
per i file di stamp dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; quelle stesse lacune fanno fallire la validazione della release.

Usa profili Package Acceptance più ampi quando la domanda di release riguarda un
pacchetto effettivamente installabile:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Profili di pacchetto comuni:

- `smoke`: corsie rapide di installazione pacchetto/canale/agent, rete Gateway e ricaricamento
  della configurazione
- `package`: contratti di installazione/aggiornamento/riavvio/pacchetto Plugin più prova live dell'installazione Skills da ClawHub; questo è il default del release-check
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI e
  OpenWebUI
- `full`: blocchi Docker del percorso di release con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per rerun mirati

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il tarball
`package-under-test` risolto nella corsia Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione di pubblicazione della release

`OpenClaw Release Publish` è il normale entrypoint mutante di pubblicazione. Orquestra
i workflow trusted-publisher nell'ordine richiesto dalla release:

1. Esegue il checkout del tag di release e ne risolve il commit SHA.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegue `pnpm plugins:sync:check`.
4. Dispone `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Dispone `Plugin ClawHub Release` con lo stesso ambito e SHA.
6. Dispone `OpenClaw NPM Release` con il tag di release, il dist-tag npm e
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
solo per lavori mirati di riparazione o ripubblicazione. Per una riparazione di Plugin selezionata, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure disponi direttamente il workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere il commit SHA completo di 40 caratteri del branch del workflow corrente per un preflight di sola validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio sul percorso di pubblicazione reale, così il workflow riusa
  il tarball preparato dal run di preflight riuscito
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; default `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio; deve già esistere
- `preflight_run_id`: id del run di preflight `OpenClaw NPM Release` riuscito;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: default `all-publishable`; usa `selected` solo
  per lavori mirati di riparazione
- `plugins`: nomi di pacchetto `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: default `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione solo per Plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o commit SHA completo da validare. I controlli con segreti
  richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un
  tag di release.
- `run_release_soak`: abilita soak esaustivo live/E2E, percorso di release Docker e
  all-since upgrade-survivor sui controlli di release stabile/default. Viene forzato
  da `release_profile=full`.

Regole:

- I tag stabili e di correzione possono pubblicare sia su `beta` sia su `latest`
- I tag di prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input commit SHA completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima che la pubblicazione continui

## Sequenza di release npm stabile

Quando si prepara una release npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare il commit SHA completo corrente del branch del workflow
     per una prova a secco di sola validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul branch di release, sul tag di release o sul commit SHA completo
   quando vuoi CI normale più copertura live della prompt cache, Docker, QA Lab,
   Matrix e Telegram da un solo workflow manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sulla ref della release
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i Plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se la release è approdata su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se la release è stata pubblicata intenzionalmente direttamente su `latest` e `beta`
   deve seguire immediatamente la stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   self-healing pianificata sposti `beta` più tardi

La mutazione dei dist-tag vive nel repo privato per sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

Se un maintainer deve ripiegare sull'autenticazione npm locale, esegui qualsiasi comando della
CLI 1Password (`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agent; tenerlo dentro tmux rende prompt,
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

I maintainer usano la documentazione privata di release in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.

## Correlati

- [Canali di release](/it/install/development-channels)
