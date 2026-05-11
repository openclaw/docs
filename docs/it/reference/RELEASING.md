---
read_when:
    - Alla ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della validazione del rilascio o dell'accettazione del pacchetto
    - Ricerca della denominazione e della cadenza delle versioni
summary: Canali di rilascio, checklist dell'operatore, riquadri di convalida, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-11T20:34:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: rilasci con tag che pubblicano su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: la testa mobile di `main`

## Nomenclatura delle versioni

- Versione di rilascio stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttivo stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali al mese o al giorno
- `latest` indica l'attuale rilascio npm stable promosso
- `beta` indica l'attuale destinazione di installazione beta
- I rilasci stable e correttivi stable pubblicano su npm `beta` per impostazione predefinita; gli operatori di rilascio possono scegliere esplicitamente `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stable di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente validano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app Mac riservate ai rilasci stable, salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima da beta
- Stable segue solo dopo la validazione dell'ultima beta
- I maintainer normalmente preparano i rilasci da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la validazione e le correzioni del rilascio non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i maintainer preparano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- Procedura di rilascio dettagliata, approvazioni, credenziali e note di recupero sono
  riservate ai maintainer

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, recupero dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall'attuale `main`: scarica l'ultimo aggiornamento, conferma che il commit di destinazione sia stato inviato,
   e conferma che la CI dell'attuale `main` sia sufficientemente verde per creare un branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate agli utenti, fai il commit, invialo, ed esegui rebase/pull
   un'altra volta prima di creare il branch.
3. Rivedi i record di compatibilità di rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la
   compatibilità scaduta solo quando il percorso di upgrade resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.D` dall'attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, quindi esegui
   `pnpm release:prep`. Aggiorna versioni dei Plugin, inventario dei Plugin, schema di configurazione,
   metadati di configurazione dei canali inclusi, baseline della documentazione di configurazione, export dell'SDK dei Plugin
   e baseline API dell'SDK dei Plugin nell'ordine corretto. Esegui il commit di qualsiasi
   divergenza generata prima di creare il tag. Poi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, e `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   per il solo preflight di validazione è consentito uno SHA di branch di rilascio completo da 40 caratteri.
   Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-release con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per i quattro grandi ambienti di test del rilascio: Vitest, Docker, QA Lab e Package.
8. Se la validazione fallisce, correggi sul branch di rilascio e riesegui il più piccolo
   file, canale, job di workflow, profilo di pacchetto, provider o allowlist di modelli fallito che
   dimostri la correzione. Riesegui l'umbrella completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   invia tutti i pacchetti Plugin pubblicabili a npm e lo stesso insieme a
   ClawHub in parallelo, e poi promuove l'artefatto di preflight npm OpenClaw preparato
   con il dist-tag corrispondente non appena la pubblicazione npm dei Plugin riesce.
   Dopo il successo del processo figlio di pubblicazione npm di OpenClaw, crea o aggiorna la
   pagina di rilascio/prerelease GitHub corrispondente dalla sezione completa corrispondente di
   `CHANGELOG.md`. I rilasci stable pubblicati su npm `latest` diventano il
   rilascio GitHub latest; i rilasci di manutenzione stable mantenuti su npm `beta` sono
   creati con GitHub `latest=false`.
   La pubblicazione su ClawHub potrebbe essere ancora in esecuzione mentre OpenClaw pubblica su npm, ma il
   workflow di pubblicazione del rilascio stampa immediatamente gli ID delle esecuzioni figlie. Per impostazione predefinita
   non attende ClawHub dopo averla inviata, quindi la disponibilità npm di OpenClaw
   non è bloccata da approvazioni ClawHub o lavoro di registry più lenti; imposta
   `wait_for_clawhub=true` quando ClawHub deve bloccare il completamento del workflow. Il
   percorso ClawHub ritenta gli errori transitori di installazione delle dipendenze della CLI, pubblica
   i Plugin che superano la preview anche quando una cella di preview ha un errore intermittente, e termina con
   la verifica del registry per ogni versione di Plugin prevista, così le pubblicazioni parziali
   restano visibili e ritentabili. Dopo la pubblicazione, esegui
   l'accettazione del pacchetto post-pubblicazione
   contro il pacchetto pubblicato `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta`. Se una prerelease inviata o pubblicata richiede una correzione,
   prepara il numero di prerelease corrispondente successivo; non eliminare né riscrivere la vecchia
   prerelease.
10. Per stable, continua solo dopo che la beta verificata o la release candidate ha le
    prove di validazione richieste. Anche la pubblicazione npm stable passa attraverso
    `OpenClaw Release Publish`, riutilizzando l'artefatto di preflight riuscito tramite
    `preflight_run_id`; la preparazione del rilascio macOS stable richiede anche il
    `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
    Il workflow privato di pubblicazione macOS pubblica automaticamente l'appcast firmato su `main`
    pubblico dopo la verifica degli asset di rilascio; se la protezione del branch blocca
    il push diretto, apre o aggiorna una PR per l'appcast.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram
    opzionale standalone da npm pubblicato quando ti serve una prova del canale post-pubblicazione,
    la promozione dei dist-tag quando necessario, verifica la pagina di rilascio GitHub generata,
    ed esegui i passaggi di annuncio del rilascio.

## Preflight di rilascio

- Esegui `pnpm check:test-types` prima del preflight di release, così il TypeScript dei test resta
  coperto al di fuori del gate locale più rapido `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di release, così i controlli più ampi sui
  cicli di import e sui confini architetturali risultano verdi al di fuori del gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di release
  attesi `dist/*` e il bundle della Control UI esistono per il passaggio di
  validazione del pacchetto
- Esegui `pnpm release:prep` dopo l’aumento della versione root e prima del tagging. Esegue
  ogni generatore di release deterministico che comunemente deriva dopo una
  modifica di versione/configurazione/API: versioni dei Plugin, inventario dei Plugin, schema
  della configurazione di base, metadati di configurazione dei canali inclusi in bundle,
  baseline dei documenti di configurazione, export dell’SDK Plugin e baseline API dell’SDK Plugin.
  `pnpm release:check` riesegue questi controlli in modalità check e segnala ogni errore di deriva
  generata che trova in un solo passaggio prima di eseguire i controlli di release del pacchetto.
- Esegui il workflow manuale `Full Release Validation` prima dell’approvazione della release per
  avviare tutti i test box pre-release da un unico entrypoint. Accetta un branch,
  un tag o uno SHA di commit completo, esegue il dispatch manuale di `CI` ed esegue il dispatch di
  `OpenClaw Release Checks` per install smoke, package acceptance, controlli pacchetto cross-OS,
  parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite
  mantengono il soak live/E2E e Docker del percorso di release esaustivo dietro
  `run_release_soak=true`; `release_profile=full` forza l’attivazione del soak. Con
  `release_profile=full` e `rerun_group=all`, esegue anche il Telegram E2E del pacchetto
  contro l’artefatto `release-package-under-test` dai controlli di release.
  Fornisci `release_package_spec` dopo la pubblicazione di una beta per riutilizzare il pacchetto
  npm pubblicato tra controlli di release, Package Acceptance e Telegram E2E del pacchetto
  senza ricostruire il tarball di release. Fornisci
  `npm_telegram_package_spec` solo quando Telegram deve usare un pacchetto pubblicato
  diverso dal resto della validazione di release. Fornisci
  `package_acceptance_package_spec` quando Package Acceptance deve usare un
  pacchetto pubblicato diverso dalla specifica del pacchetto di release. Fornisci
  `evidence_package_spec` quando il report di evidenza privato deve dimostrare che la
  validazione corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel
  per un candidato pacchetto mentre il lavoro di release continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di release esatta; `source=ref`
  per crearere un pacchetto da branch/tag/SHA `package_ref` attendibile con l’harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256 obbligatorio;
  oppure `source=artifact` per un tarball caricato da un’altra esecuzione di GitHub
  Actions. Il workflow risolve il candidato in
  `package-under-test`, riutilizza lo scheduler di release Docker E2E contro quel
  tarball e può eseguire la QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le
  lane Docker selezionate includono `published-upgrade-survivor`, l’artefatto del pacchetto
  è il candidato e `published_upgrade_survivor_baseline` seleziona
  la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato come
  CLI installata e come package-under-test, così esercita il percorso di riavvio gestito
  del comando di aggiornamento candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane installazione/canale/agente, rete Gateway e ricaricamento configurazione
  - `package`: lane native dell’artefatto per pacchetto/aggiornamento/riavvio/Plugin senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent,
    ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di release Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura completa della CI normale
  per il candidato di release. I dispatch manuali di CI bypassano lo scoping delle modifiche
  e forzano gli shard Linux Node, gli shard dei Plugin inclusi in bundle, i contratti dei canali,
  la compatibilità Node 22, `check`, `check-additional`, build smoke,
  controlli docs, Skills Python, Windows, macOS, Android e lane i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` durante la validazione della telemetria di release. Esercita
  QA-lab tramite un receiver OTLP/HTTP locale e verifica i nomi degli span delle trace esportate,
  attributi limitati e redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni release taggata
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Eseguilo da `release/YYYY.M.D` (o da `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di release e il `preflight_run_id`
  npm OpenClaw riuscito, e mantieni l’ambito di pubblicazione Plugin predefinito
  `all-publishable` salvo che tu stia eseguendo intenzionalmente una riparazione mirata. Il
  workflow serializza la pubblicazione npm dei Plugin, la pubblicazione ClawHub dei Plugin
  e la pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato prima dei suoi
  Plugin esternalizzati.
- I controlli di release ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo
  live Matrix rapido e la lane QA Telegram prima dell’approvazione della release. Le lane live
  usano l’ambiente `qa-live-shared`; Telegram usa anche lease di credenziali CI
  Convex. Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi l’inventario completo di trasporto,
  media ed E2EE Matrix in parallelo.
- La validazione runtime cross-OS di installazione e aggiornamento fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano
  direttamente il workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantieni il percorso reale di release npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  lane, così non rallentano né bloccano la pubblicazione
- I controlli di release con segreti devono essere avviati tramite `Full Release
Validation` o dal workflow ref `main`/release, così la logica dei workflow e
  i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA di commit completo purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di release
- Il preflight di sola validazione `OpenClaw NPM Release` accetta anche lo SHA di commit completo
  a 40 caratteri del branch del workflow corrente senza richiedere un tag pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un tag di release reale
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione su runner
  ospitati da GitHub, mentre il percorso di validazione non mutante può usare i runner Linux
  Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando sia i secret del workflow `OPENAI_API_KEY` sia `ANTHROPIC_API_KEY`
- Il preflight di release npm non attende più la lane separata dei controlli di release
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell’approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione
  del registry pubblicato in un prefisso temporaneo pulito
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram e vero Telegram E2E
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente
  le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta post-pubblicazione completo da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L’helper esegue la validazione Parallels per aggiornamento npm/target pulito, esegue il dispatch di `NPM Telegram Beta E2E`, interroga l’esecuzione esatta del workflow, scarica l’artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L’automazione di release dei maintainer ora usa preflight-poi-promozione:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere avviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell’esecuzione preflight riuscita
  - le release npm stabili hanno come predefinito `beta`
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione npm dist-tag basata su token ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repository pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di validazione; quando un tag esiste solo su un
    branch di release ma il workflow viene avviato da `main`, imposta
    `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve superare i `preflight_run_id` e
    `validate_run_id` mac privati riusciti
  - i percorsi di pubblicazione reali promuovono artefatti preparati invece di ricostruirli
    di nuovo
- Per release di correzione stabili come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di release non possono lasciare silenziosamente installazioni globali più vecchie
  sul payload stabile di base
- Il preflight di release npm fallisce in modo chiuso salvo che il tarball includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`,
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei Plugin pubblicati e
  i metadati dei pacchetti siano presenti nel layout del registry installato. Una release che
  distribuisce payload runtime dei Plugin mancanti fallisce il verificatore postpublish e
  non può essere promossa a `latest`.
- `pnpm test:install:smoke` applica anche il budget npm pack `unpackedSize` sul
  tarball di aggiornamento candidato, così l’e2e dell’installer intercetta aumenti accidentali delle dimensioni del pacchetto
  prima del percorso di pubblicazione della release
- Se il lavoro di release ha toccato la pianificazione CI, i manifest di timing delle extension o
  le matrici di test delle extension, rigenera e rivedi gli output della matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell’approvazione, così le note di release non
  descrivono un layout CI obsoleto
- La prontezza della release macOS stabile include anche le superfici dell’updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione; il
    workflow privato di pubblicazione macOS lo committa automaticamente, oppure apre una PR appcast
    quando il push diretto è bloccato
  - l’app pacchettizzata deve mantenere un bundle id non di debug, un URL feed Sparkle
    non vuoto e un `CFBundleVersion` pari o superiore al floor canonico della build Sparkle
    per quella versione di release

## Box di test di release

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-release da
un unico entrypoint. Per una prova su commit fissato su un branch in rapido movimento, usa
l’helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper invia `release-ci/<sha>-...`, avvia `Full Release Validation`
da quel ramo con `ref=<sha>`, verifica che ogni workflow figlio `headSha`
corrisponda al target, quindi elimina il ramo temporaneo. Questo evita di dimostrare
per errore un'esecuzione figlia più recente di `main`.

Per la validazione di un ramo o tag di release, eseguila dal ref del workflow
`main` attendibile e passa il ramo o tag di release come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Il workflow risolve il ref target, avvia manualmente `CI` con
`target_ref=<release-ref>`, avvia `OpenClaw Release Checks`, prepara un artefatto
padre `release-package-under-test` per i controlli rivolti al pacchetto e avvia
l'E2E Telegram del pacchetto standalone quando `release_profile=full` con
`rerun_group=all` oppure quando `release_package_spec` o
`npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di release cross-OS, copertura live/E2E Docker
del percorso di release quando il soak è abilitato, Package Acceptance con QA
del pacchetto Telegram, parità QA Lab, Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il
riepilogo di `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve riuscire; fuori da full/all viene saltato
a meno che non sia stato fornito un `release_package_spec` o
`npm_telegram_package_spec` pubblicato. Il riepilogo finale
del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
Consulta [Validazione completa della release](/it/reference/full-release-validation) per la
matrice completa degli stage, i nomi esatti dei job del workflow, le differenze
tra profilo stable e full, gli artefatti e gli handle di riesecuzione mirati.
I workflow figli vengono avviati dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` target punta a un
ramo o tag di release precedente. Non esiste un input separato per il ref del workflow
Full Release Validation; scegli l'harness attendibile scegliendo il ref dell'esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per la prova esatta di commit su `main` in movimento;
gli SHA di commit grezzi non possono essere ref di workflow dispatch, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il ramo temporaneo fissato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker critico per la release più rapido
- `stable`: minimum più copertura stabile provider/backend per l'approvazione della release
- `full`: stable più copertura ampia di provider/media consultiva

Usa `run_release_soak=true` con `stable` quando le lane bloccanti per la release sono
verdi e vuoi lo sweep esaustivo live/E2E, del percorso di release Docker e
limitato di sopravvivenza agli upgrade pubblicati prima della promozione. Quello sweep copre
gli ultimi quattro pacchetti stable più le baseline fissate `2026.4.23` e `2026.5.2`
più la copertura precedente `2026.4.15`, con baseline duplicate rimosse e
ogni baseline suddivisa nel proprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere una sola volta il ref target
come `release-package-under-test` e riutilizza quell'artefatto in cross-OS,
Package Acceptance e controlli Docker del percorso di release quando viene eseguito il soak. Questo mantiene
tutti gli ambienti rivolti al pacchetto sugli stessi byte ed evita build ripetute del pacchetto.
Dopo che una beta è già su npm, imposta `release_package_spec=openclaw@YYYY.M.D-beta.N`
così i controlli di release scaricano una sola volta il pacchetto distribuito, estraggono il suo SHA
sorgente di build da `dist/build-info.json` e riutilizzano quell'artefatto per cross-OS,
Package Acceptance, Docker del percorso di release e lane Telegram del pacchetto.
L'install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane sta
dimostrando installazione del pacchetto, onboarding, avvio del Gateway e un turno live dell'agente
invece di fare benchmarking del modello predefinito più lento. La matrice live provider
più ampia resta il posto per la copertura specifica dei modelli.

Usa queste varianti in base allo stage della release:

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Non usare l'umbrella completo come prima riesecuzione dopo una correzione mirata. Se un ambiente
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo pacchetto, il provider
del modello o la lane QA falliti per la prova successiva. Esegui di nuovo l'umbrella completo solo quando
la correzione ha modificato l'orchestrazione condivisa della release o ha reso obsolete le prove precedenti
su tutti gli ambienti. Il verificatore finale dell'umbrella ricontrolla gli id registrati delle esecuzioni
dei workflow figli, quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre
`Verify full validation` fallito.

Per un recupero limitato, passa `rerun_group` all'umbrella. `all` è la vera
esecuzione del release candidate, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio Plugin solo per release, `release-checks` esegue ogni ambiente di release
e i gruppi di release più ristretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate `npm-telegram` richiedono `release_package_spec` o
`npm_telegram_package_spec`; le esecuzioni full/all con `release_profile=full` usano l'artefatto
del pacchetto dei release-checks. Le riesecuzioni mirate
cross-OS possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti QA dei release-check sono consultivi; un fallimento solo QA
non blocca la validazione della release.

### Vitest

L'ambiente Vitest è il workflow figlio manuale `CI`. La CI manuale
bypassa intenzionalmente lo scoping delle modifiche e forza il normale grafo di test per il release
candidate: shard Linux Node, shard dei Plugin inclusi, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, Skills Python,
Windows, macOS, Android e i18n della Control UI.

Usa questo ambiente per rispondere a "l'albero sorgente ha superato l'intera suite di test normale?"
Non è la stessa cosa della validazione prodotto del percorso di release. Prove da conservare:

- riepilogo di `Full Release Validation` che mostra l'URL dell'esecuzione `CI` avviata
- esecuzione `CI` verde sullo SHA target esatto
- nomi degli shard falliti o lenti dai job CI durante l'indagine sulle regressioni
- artefatti di timing Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui la CI manuale direttamente solo quando la release richiede una CI normale deterministica ma
non gli ambienti Docker, QA Lab, live, cross-OS o pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

L'ambiente Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow
`install-smoke` in modalità release. Valida il release candidate tramite ambienti
Docker pacchettizzati invece che solo test a livello sorgente.

La copertura Docker della release include:

- install smoke completo con lo smoke dell'installazione globale Bun lenta abilitato
- preparazione/riutilizzo dell'immagine smoke del Dockerfile root per SHA target, con QR,
  root/Gateway e job smoke installer/Bun eseguiti come shard install-smoke separati
- lane E2E del repository
- chunk Docker del percorso di release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- copertura OpenWebUI dentro il chunk `plugins-runtime-services` quando richiesta
- lane divise di installazione/disinstallazione dei Plugin inclusi
  `bundled-plugin-install-uninstall-0` fino a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura dei modelli live Docker quando i controlli di release
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di release carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
timing delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow riutilizzabile live/E2E invece di
rieseguire tutti i chunk di release. I comandi di riesecuzione generati includono i precedenti
`package_artifact_run_id` e gli input delle immagini Docker preparate quando disponibili, così una
lane fallita può riutilizzare lo stesso tarball e le immagini GHCR.

### QA Lab

Anche l'ambiente QA Lab fa parte di `OpenClaw Release Checks`. È il gate di release
del comportamento agentico e a livello di canale, separato da Vitest e dalla meccanica
dei pacchetti Docker.

La copertura QA Lab della release include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pack di parità agentica
- profilo QA Matrix live rapido che usa l'ambiente `qa-live-shared`
- lane QA Telegram live che usa lease delle credenziali Convex CI
- `pnpm qa:otel:smoke` quando la telemetria di release richiede prova locale esplicita

Usa questo ambiente per rispondere a "la release si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artefatti per le lane parità, Matrix e Telegram
quando approvi la release. La copertura Matrix completa resta disponibile come esecuzione manuale
QA-Lab sharded invece che come lane predefinita critica per la release.

### Pacchetto

L'ambiente Package è il gate del prodotto installabile. È sostenuto da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, valida
l'inventario del pacchetto, registra la versione del pacchetto e SHA-256 e mantiene il
ref dell'harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di release OpenClaw
- `source=ref`: pacchettizza un ramo, tag o SHA completo di commit `package_ref` attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` richiesto
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto
del pacchetto di release preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, aggiornamento,
riavvio con auth configurata dopo aggiornamento, installazione live di Skills ClawHub, pulizia delle dipendenze stale dei Plugin, fixture di Plugin offline,
aggiornamento dei Plugin e QA del pacchetto Telegram contro lo stesso tarball risolto.
I controlli di release bloccanti usano la baseline predefinita dell'ultimo pacchetto pubblicato;
`run_release_soak=true` o
`release_profile=full` espande a ogni baseline stable pubblicata su npm da
`2026.4.23` fino a `latest` più fixture di problemi segnalati. Usa
Package Acceptance con `source=npm` per un candidato già distribuito, oppure
`source=ref`/`source=artifact` per un tarball npm locale supportato da SHA prima della
pubblicazione. È il sostituto nativo GitHub
per la maggior parte della copertura pacchetto/aggiornamento che in precedenza richiedeva
Parallels. I controlli di release cross-OS restano importanti per onboarding,
installer e comportamento specifici dell'OS, ma la validazione prodotto pacchetto/aggiornamento dovrebbe
preferire Package Acceptance.

La checklist canonica per la convalida degli aggiornamenti e dei plugin è
[Test degli aggiornamenti e dei plugin](/it/help/testing-updates-plugins). Usala quando
devi decidere quale lane locale, Docker, Package Acceptance o release-check dimostra
una modifica di installazione/aggiornamento di un plugin, di pulizia tramite doctor
o di migrazione di un pacchetto pubblicato. La migrazione esaustiva degli aggiornamenti
pubblicati da ogni pacchetto stabile `2026.4.23+` è un workflow manuale `Update Migration`
separato, non parte della Full Release CI.

La tolleranza legacy della package acceptance è intenzionalmente limitata nel tempo.
I pacchetti fino alla versione `2026.4.25` possono usare il percorso di compatibilità
per lacune nei metadati già pubblicate su npm: voci private dell'inventario QA mancanti
dal tarball, `gateway install --wrapper` mancante, file di patch mancanti nella fixture
git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei
record di installazione dei plugin, persistenza mancante dei record di installazione
del marketplace e migrazione dei metadati di configurazione durante `plugins update`.
Il pacchetto pubblicato `2026.4.26` può emettere avvisi per i file di timbro dei
metadati della build locale già distribuiti. I pacchetti successivi devono soddisfare
i contratti moderni dei pacchetti; quelle stesse lacune fanno fallire la convalida
del rilascio.

Usa profili Package Acceptance più ampi quando la domanda sul rilascio riguarda un
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

Profili comuni dei pacchetti:

- `smoke`: lane rapide per installazione di pacchetti/canali/agenti, rete Gateway
  e ricaricamento della configurazione
- `package`: contratti di installazione/aggiornamento/riavvio/pacchetto plugin più
  prova di installazione Skills live da ClawHub; questo è il valore predefinito
  del release-check
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI
  e OpenWebUI
- `full`: blocchi Docker del percorso di rilascio con OpenWebUI
- `custom`: elenco esatto di `docker_lanes` per riesecuzioni mirate

Per la prova Telegram di un pacchetto candidato, abilita `telegram_mode=mock-openai`
o `telegram_mode=live-frontier` in Package Acceptance. Il workflow passa il tarball
`package-under-test` risolto nella lane Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione della pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione.
Orchestra i workflow trusted-publisher nell'ordine richiesto dal rilascio:

1. Esegue il checkout del tag di rilascio e ne risolve il commit SHA.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegue `pnpm plugins:sync:check`.
4. Avvia `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Avvia `Plugin ClawHub Release` con lo stesso ambito e SHA.
6. Avvia `OpenClaw NPM Release` con il tag di rilascio, il dist-tag npm e
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
solo per interventi mirati di riparazione o ripubblicazione. Per una riparazione
di un plugin selezionato, passa `plugin_publish_scope=selected` e `plugins=@openclaw/name`
a `OpenClaw Release Publish`, oppure avvia direttamente il workflow figlio quando
il pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio, ad esempio `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere il commit SHA
  completo di 40 caratteri del branch del workflow corrente per un preflight solo
  di convalida
- `preflight_only`: `true` solo per convalida/build/package, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il
  workflow riutilizza il tarball preparato dalla run di preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione;
  predefinito: `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve già esistere
- `preflight_run_id`: id della run di preflight riuscita di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: predefinito: `all-publishable`; usa `selected` solo
  per interventi mirati di riparazione
- `plugins`: nomi dei pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: predefinito: `true`; imposta `false` solo quando usi
  il workflow come orchestratore di riparazioni solo per plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o commit SHA completo da convalidare. I controlli che usano
  segreti richiedono che il commit risolto sia raggiungibile da un branch OpenClaw
  o da un tag di rilascio.
- `run_release_soak`: abilita il soak esaustivo live/E2E, del percorso di rilascio
  Docker e upgrade-survivor all-since sui controlli di rilascio stabili/predefiniti.
  Viene forzato da `release_profile=full`.

Regole:

- I tag stabili e di correzione possono essere pubblicati su `beta` o `latest`
- I tag prerelease beta possono essere pubblicati solo su `beta`
- Per `OpenClaw NPM Release`, l'input del commit SHA completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre solo di convalida
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante
  il preflight; il workflow verifica quei metadati prima di continuare la pubblicazione

## Sequenza di rilascio npm stabile

Quando si prepara un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare il commit SHA completo del branch del workflow
     corrente per una prova a secco solo di convalida del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul branch di rilascio, sul tag di rilascio o sul
   commit SHA completo quando vuoi la normale CI più copertura di live prompt cache,
   Docker, QA Lab, Matrix e Telegram da un unico workflow manuale
4. Se ti serve intenzionalmente solo il grafo di test normale deterministico, esegui
   invece il workflow manuale `CI` sul ref di rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se il rilascio è arrivato su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se il rilascio è stato intenzionalmente pubblicato direttamente su `latest` e `beta`
   deve puntare subito alla stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua
   sincronizzazione pianificata di auto-riparazione sposti `beta` in seguito

La mutazione del dist-tag vive nel repo privato per sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene documentati e visibili agli operatori sia il percorso di pubblicazione
diretta sia il percorso di promozione beta-first.

Se un maintainer deve ripiegare sull'autenticazione npm locale, esegui qualsiasi comando
della CLI 1Password (`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; mantenerlo dentro tmux rende osservabili
prompt, avvisi e gestione OTP e previene avvisi host ripetuti.

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

I maintainer usano la documentazione privata dei rilasci in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.

## Correlati

- [Canali di rilascio](/it/install/development-channels)
