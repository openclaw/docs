---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della validazione della release o dell'accettazione del pacchetto
    - Ricerca della denominazione e della cadenza delle versioni
summary: Corsie di rilascio, checklist dell’operatore, box di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-07T15:08:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: rilasci con tag che pubblicano su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag di pre-release che pubblicano su npm `beta`
- dev: la testa mobile di `main`

## Denominazione delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio di correzione stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di pre-release beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` significa l’attuale rilascio npm stabile promosso
- `beta` significa l’attuale destinazione di installazione beta
- I rilasci stabili e di correzione stabile pubblicano su npm `beta` per impostazione predefinita; gli operatori del rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l’app macOS;
  i rilasci beta normalmente validano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell’app Mac riservate allo stabile salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Lo stabile segue solo dopo che l’ultima beta è stata validata
- I manutentori normalmente tagliano i rilasci da un branch `release/YYYY.M.D` creato
  dall’attuale `main`, così la validazione e le correzioni del rilascio non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i manutentori tagliano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura di rilascio dettagliata, le approvazioni, le credenziali e le note di ripristino sono
  riservate ai manutentori

## Checklist dell’operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai manutentori.

1. Parti dall’attuale `main`: esegui il pull dell’ultima versione, conferma che il commit di destinazione sia stato inviato,
   e conferma che la CI dell’attuale `main` sia abbastanza verde da poter creare il branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci rivolte agli utenti, fai il commit, esegui il push e fai rebase/pull
   ancora una volta prima di creare il branch.
3. Rivedi i record di compatibilità del rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   intenzionalmente mantenuta.
4. Crea `release/YYYY.M.D` dall’attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Incrementa ogni posizione di versione richiesta per il tag previsto, poi esegui
   `pnpm release:prep`. Aggiorna le versioni dei Plugin, l’inventario dei Plugin, lo schema di
   configurazione, i metadati di configurazione dei canali inclusi, la baseline dei documenti di
   configurazione, gli export dell’SDK dei Plugin e la baseline API dell’SDK dei Plugin nell’ordine corretto.
   Fai il commit di qualsiasi deriva generata prima del tag. Poi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   uno SHA completo di 40 caratteri del branch di rilascio è consentito solo per la
   validazione preflight. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test di pre-release con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l’unico entrypoint manuale
   per i quattro grandi ambienti di test del rilascio: Vitest, Docker, QA Lab e Package.
8. Se la validazione fallisce, correggi sul branch di rilascio e riesegui il più piccolo
   file, canale, job di workflow, profilo pacchetto, provider o allowlist di modelli fallito che
   dimostri la correzione. Riesegui l’ombrello completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   invia tutti i pacchetti Plugin pubblicabili a npm e lo stesso insieme a
   ClawHub in parallelo, quindi promuove l’artefatto preflight npm di OpenClaw preparato
   con il dist-tag corrispondente non appena la pubblicazione npm dei Plugin riesce.
   La pubblicazione ClawHub potrebbe essere ancora in esecuzione mentre OpenClaw npm pubblica, ma il
   workflow di pubblicazione del rilascio stampa immediatamente gli ID delle esecuzioni figlie. Per impostazione predefinita
   non attende ClawHub dopo averlo inviato, quindi la disponibilità npm di OpenClaw
   non è bloccata da approvazioni ClawHub o lavoro sul registry più lenti; imposta
   `wait_for_clawhub=true` quando ClawHub deve bloccare il completamento del workflow. Il
   percorso ClawHub ritenta i fallimenti transitori di installazione delle dipendenze CLI, pubblica
   i Plugin che superano la preview anche quando una cella di preview ha un flake, e termina con
   la verifica del registry per ogni versione Plugin attesa così le pubblicazioni parziali
   restano visibili e ritentabili. Dopo la pubblicazione, esegui
   l’accettazione pacchetto post-pubblicazione
   contro il pacchetto pubblicato `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta`. Se una pre-release inviata o pubblicata richiede una correzione,
   taglia il numero di pre-release corrispondente successivo; non eliminare né riscrivere la vecchia
   pre-release.
10. Per stabile, continua solo dopo che la beta verificata o la release candidate ha le
    prove di validazione richieste. Anche la pubblicazione npm stabile passa da
    `OpenClaw Release Publish`, riutilizzando l’artefatto preflight riuscito tramite
    `preflight_run_id`; la prontezza del rilascio macOS stabile richiede anche gli artefatti
    `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l’E2E Telegram
    pubblicato su npm standalone opzionale quando ti serve prova del canale post-pubblicazione,
    la promozione dei dist-tag quando necessario, le note di rilascio/pre-release GitHub dalla
    sezione `CHANGELOG.md` completa corrispondente, e i passaggi di annuncio del rilascio.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così TypeScript dei test resta
  coperto fuori dal gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli più ampi sui
  cicli di importazione e sui confini architetturali sono verdi fuori dal gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di rilascio
  `dist/*` attesi e il bundle della Control UI esistono per il passaggio di
  convalida del pacchetto
- Esegui `pnpm release:prep` dopo l'aumento di versione root e prima del tagging. Esegue
  ogni generatore di rilascio deterministico che comunemente deriva dopo una
  modifica di versione/config/API: versioni dei plugin, inventario dei plugin, schema
  della configurazione base, metadati della configurazione dei canali inclusi, baseline dei documenti di configurazione, esportazioni del plugin SDK
  e baseline API del plugin SDK. `pnpm release:check` riesegue quei
  controlli in modalità check e segnala in un solo passaggio ogni errore di deriva generata che trova
  prima di eseguire i controlli di rilascio del pacchetto.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per
  avviare tutti i test box pre-rilascio da un unico punto di ingresso. Accetta un branch,
  un tag o uno SHA di commit completo, avvia manualmente `CI` e avvia
  `OpenClaw Release Checks` per install smoke, package acceptance, controlli dei pacchetti cross-OS,
  parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite
  mantengono l'esauriente soak live/E2E e del percorso di rilascio Docker dietro
  `run_release_soak=true`; `release_profile=full` forza l'attivazione del soak. Con
  `release_profile=full` e `rerun_group=all`, esegue anche l'E2E Telegram del pacchetto
  contro l'artefatto `release-package-under-test` dei controlli di rilascio.
  Fornisci `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso
  E2E Telegram deve provare anche il pacchetto npm pubblicato. Fornisci
  `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance
  deve eseguire la sua matrice pacchetto/aggiornamento contro il pacchetto npm rilasciato invece
  dell'artefatto creato dallo SHA. Fornisci
  `evidence_package_spec` quando il report di evidenza privato deve provare che la
  convalida corrisponde a un pacchetto npm pubblicato senza forzare l'E2E Telegram.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel
  per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref`
  per pacchettizzare un branch/tag/SHA `package_ref` attendibile con l'harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256
  obbligatorio; oppure `source=artifact` per un tarball caricato da un'altra esecuzione di GitHub
  Actions. Il workflow risolve il candidato in
  `package-under-test`, riusa lo scheduler di rilascio Docker E2E contro quel
  tarball e può eseguire la QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le
  lane Docker selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto
  è il candidato e `published_upgrade_survivor_baseline` seleziona
  la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato come
  CLI installata e come package-under-test, così esercita il percorso di riavvio gestito
  del comando di aggiornamento candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane installazione/canale/agent, rete Gateway e ricaricamento configurazione
  - `package`: lane native dell'artefatto per pacchetto/aggiornamento/riavvio/plugin senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent,
    ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura CI normale completa
  per il candidato di rilascio. Gli avvii manuali di CI bypassano lo scoping delle modifiche
  e forzano le shard Linux Node, le shard dei plugin inclusi, i contratti dei canali,
  la compatibilità Node 22, `check`, `check-additional`, build smoke,
  controlli docs, Skills Python, Windows, macOS, Android e lane i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando convalidi la telemetria di rilascio. Esercita
  QA-lab tramite un receiver OTLP/HTTP locale e verifica i nomi degli span di trace esportati,
  gli attributi limitati e la redazione di contenuto/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio con tag
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Avvialo da `release/YYYY.M.D` (o da `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di rilascio e il `preflight_run_id`
  npm OpenClaw riuscito, e mantieni lo scope predefinito di pubblicazione plugin
  `all-publishable` a meno che tu non stia eseguendo deliberatamente una riparazione mirata. Il
  workflow serializza la pubblicazione npm dei plugin, la pubblicazione ClawHub dei plugin e la pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato prima dei suoi
  plugin esternalizzati.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo
  Matrix live veloce e la lane QA Telegram prima dell'approvazione del rilascio. Le lane live
  usano l'ambiente `qa-live-shared`; Telegram usa anche lease delle credenziali Convex CI.
  Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi inventario completo in parallelo
  per trasporto Matrix, media ed E2EE.
- La convalida runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il
  workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il percorso reale di rilascio npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  lane, così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che contengono segreti devono essere avviati tramite `Full Release
Validation` o dal ref del workflow `main`/release, così la logica del workflow e
  i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA di commit completo purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Il preflight solo di convalida `OpenClaw NPM Release` accetta anche lo SHA di commit completo
  a 40 caratteri del branch del workflow corrente senza richiedere un tag pushato
- Quel percorso SHA è solo di convalida e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner ospitati da GitHub,
  mentre il percorso di convalida non mutante può usare i runner Linux Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando sia i secret del workflow `OPENAI_API_KEY` sia `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la lane separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione dal registry pubblicato
  in un prefisso temporaneo nuovo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare l'onboarding del pacchetto installato, la configurazione Telegram e un E2E Telegram reale
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente le tre
  credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta completo post-pubblicazione da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L'helper esegue la convalida Parallels di aggiornamento npm/target nuovo, avvia `NPM Telegram Beta E2E`, fa polling dell'esecuzione workflow esatta, scarica l'artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-poi-promozione:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere avviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - i rilasci npm stabili hanno come default `beta`
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione del dist-tag npm basata su token ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repository pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di convalida; quando un tag vive solo su un
    branch di rilascio ma il workflow viene avviato da `main`, imposta
    `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve superare `preflight_run_id` e
    `validate_run_id` mac privati riusciti
  - i percorsi di pubblicazione reali promuovono artefatti preparati invece di ricrearli
    di nuovo
- Per rilasci di correzione stabili come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di rilascio non possono lasciare silenziosamente le vecchie installazioni globali sul
  payload stabile base
- Il preflight di rilascio npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto,
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che entrypoint dei plugin pubblicati e
  metadati del pacchetto siano presenti nel layout installato dal registry. Un rilascio che
  distribuisce payload runtime dei plugin mancanti fallisce il verificatore postpublish e
  non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget npm pack `unpackedSize` al
  tarball di aggiornamento candidato, così l'e2e dell'installer intercetta gonfiori accidentali del pacchetto
  prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest di timing delle estensioni o
  le matrici di test delle estensioni, rigenera e rivedi gli output di matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di rilascio non
  descrivono un layout CI obsoleto
- La prontezza del rilascio stabile macOS include anche le superfici updater:
  - la release GitHub deve finire con i `.zip`, `.dmg` e `.dSYM.zip` pacchettizzati
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non-debug, un URL feed Sparkle
    non vuoto e un `CFBundleVersion` pari o superiore al floor canonico di build Sparkle
    per quella versione di rilascio

## Test box di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da
un unico punto di ingresso. Per una prova su commit fissato in un branch che si muove velocemente, usa
l'helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper pusha `release-ci/<sha>-...`, avvia `Full Release Validation`
da quel branch con `ref=<sha>`, verifica che ogni `headSha` del workflow figlio
corrisponda al target, poi elimina il branch temporaneo. Questo evita di provare per errore
un'esecuzione figlia più nuova di `main`.

Per la convalida di un branch di rilascio o di un tag, eseguila dal ref del workflow `main`
attendibile e passa il branch di rilascio o il tag come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Il workflow risolve il ref di destinazione, invia il `CI` manuale con
`target_ref=<release-ref>`, invia `OpenClaw Release Checks`, prepara un artefatto
padre `release-package-under-test` per i controlli rivolti al pacchetto e
invia il package Telegram E2E autonomo quando `release_profile=full` con
`rerun_group=all` o quando `npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di rilascio cross-OS, copertura live/E2E Docker
del percorso di rilascio quando il soak è abilitato, Package Acceptance con QA del pacchetto Telegram,
parità QA Lab, Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il
riepilogo `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve riuscire; al di fuori di full/all viene saltato
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il riepilogo finale del
verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico attuale senza scaricare i log.
Consulta [Convalida completa del rilascio](/it/reference/full-release-validation) per la
matrice completa degli stage, i nomi esatti dei job del workflow, le differenze tra profilo stable e full,
gli artefatti e gli handle per rerun mirati.
I workflow figli vengono inviati dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch di rilascio o tag precedente. Non esiste un input separato del ref del workflow
Full Release Validation; scegli l'harness attendibile scegliendo il ref dell'esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per la prova esatta di commit su `main` in movimento;
gli SHA commit grezzi non possono essere ref di workflow dispatch, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo bloccato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker critico per il rilascio più veloce
- `stable`: minimum più copertura provider/backend stabile per l'approvazione del rilascio
- `full`: stable più ampia copertura advisory provider/media

Usa `run_release_soak=true` con `stable` quando le lane bloccanti per il rilascio sono
verdi e vuoi l'esaustivo live/E2E, il percorso di rilascio Docker e
lo sweep limitato dei survivor di upgrade pubblicati prima della promozione. Quello sweep copre
gli ultimi quattro pacchetti stabili più le baseline bloccate `2026.4.23` e `2026.5.2`
più la copertura precedente `2026.4.15`, con baseline duplicate rimosse e
ogni baseline suddivisa nel proprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere il target
ref una sola volta come `release-package-under-test` e riutilizza quell'artefatto nei controlli cross-OS,
Package Acceptance e Docker del percorso di rilascio quando il soak viene eseguito. Questo mantiene
tutte le box rivolte al pacchetto sugli stessi byte ed evita build ripetute del pacchetto.
L'install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane sta
provando installazione del pacchetto, onboarding, avvio del gateway e un turno agente live
anziché misurare il modello predefinito più lento. La più ampia matrice provider live
rimane il luogo per la copertura specifica per modello.

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Non usare l'ombrello completo come primo rerun dopo una correzione mirata. Se una box
fallisce, usa il workflow figlio, job, lane Docker, profilo del pacchetto, provider
del modello o lane QA non riusciti per la prossima prova. Esegui di nuovo l'ombrello completo solo quando
la correzione ha modificato l'orchestrazione di rilascio condivisa o ha reso obsolete le prove precedenti
di tutte le box. Il verificatore finale dell'ombrello ricontrolla gli id delle esecuzioni dei workflow figli
registrati, quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre
`Verify full validation` non riuscito.

Per un recupero limitato, passa `rerun_group` all'ombrello. `all` è la vera
esecuzione del release candidate, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio plugin solo-rilascio, `release-checks` esegue ogni box di rilascio
e i gruppi di rilascio più stretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
I rerun mirati `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l'artefatto del pacchetto release-checks. I rerun
cross-OS mirati possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti dei release-check QA sono advisory; un fallimento solo QA
non blocca la convalida del rilascio.

### Vitest

La box Vitest è il workflow figlio `CI` manuale. Il CI manuale intenzionalmente
bypassa lo scoping changed e forza il normale grafo di test per il release
candidate: shard Linux Node, shard dei plugin inclusi, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, skills Python,
Windows, macOS, Android e Control UI i18n.

Usa questa box per rispondere a "l'albero sorgente ha superato la suite di test normale completa?"
Non è la stessa cosa della convalida prodotto del percorso di rilascio. Prove da conservare:

- riepilogo `Full Release Validation` che mostra l'URL dell'esecuzione `CI` inviata
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI quando si indagano regressioni
- artefatti di timing Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione necessita di analisi delle prestazioni

Esegui il CI manuale direttamente solo quando il rilascio richiede CI normale deterministico ma
non le box Docker, QA Lab, live, cross-OS o package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La box Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow
`install-smoke` in modalità rilascio. Convalida il release candidate tramite ambienti
Docker pacchettizzati invece che solo test a livello di sorgente.

La copertura Docker del rilascio include:

- install smoke completo con lo smoke lento di installazione globale Bun abilitato
- preparazione/riutilizzo dell'immagine smoke del Dockerfile root per SHA di destinazione, con job QR,
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
- lane separate di installazione/disinstallazione dei plugin inclusi
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura dei modelli live Docker quando i controlli di rilascio
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
timing delle fasi, JSON del piano dello scheduler e comandi di rerun. Per il recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow riutilizzabile live/E2E invece di
rieseguire tutti i chunk di rilascio. I comandi di rerun generati includono il precedente
`package_artifact_run_id` e input delle immagini Docker preparate quando disponibili, così una
lane fallita può riutilizzare lo stesso tarball e le immagini GHCR.

### QA Lab

Anche la box QA Lab fa parte di `OpenClaw Release Checks`. È il gate di rilascio
del comportamento agentico e a livello di canale, separato da Vitest e dalla meccanica
dei pacchetti Docker.

La copertura QA Lab del rilascio include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live rapido usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease delle credenziali Convex CI
- `pnpm qa:otel:smoke` quando la telemetria del rilascio richiede prova locale esplicita

Usa questa box per rispondere a "il rilascio si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artefatti per le lane di parità, Matrix e Telegram
quando approvi il rilascio. La copertura Matrix completa rimane disponibile come esecuzione manuale
QA-Lab sharded anziché come lane critica per il rilascio predefinita.

### Pacchetto

La box Package è il gate del prodotto installabile. È supportata da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, convalida
l'inventario del pacchetto, registra la versione del pacchetto e SHA-256 e mantiene
il ref dell'harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw
- `source=ref`: confeziona un branch, tag o SHA commit completo `package_ref` attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` obbligatorio
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto
del pacchetto di rilascio preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, aggiornamento,
riavvio aggiornamento con auth configurata, pulizia delle dipendenze dei plugin obsolete, fixture plugin offline,
aggiornamento plugin e QA del pacchetto Telegram contro lo stesso tarball risolto.
I controlli bloccanti del rilascio usano la baseline predefinita dell'ultimo pacchetto pubblicato;
`run_release_soak=true` o
`release_profile=full` espande a ogni baseline stabile pubblicata su npm da
`2026.4.23` a `latest` più fixture di problemi segnalati. Usa
Package Acceptance con `source=npm` per un candidato già distribuito, oppure
`source=ref`/`source=artifact` per un tarball npm locale supportato da SHA prima della
pubblicazione. È il sostituto nativo GitHub
per gran parte della copertura package/update che in precedenza richiedeva
Parallels. I controlli di rilascio cross-OS restano importanti per onboarding,
installer e comportamento della piattaforma specifici per OS, ma la convalida prodotto package/update dovrebbe
preferire Package Acceptance.

La checklist canonica per la convalida di aggiornamenti e plugin è
[Testare aggiornamenti e plugin](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o release-check prova una
installazione/aggiornamento plugin, pulizia doctor o modifica di migrazione di un pacchetto pubblicato.
La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale `Update Migration` separato, non parte di Full Release CI.

La tolleranza legacy dell’accettazione dei pacchetti è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci private dell’inventario QA mancanti dal tarball, assenza di
`gateway install --wrapper`, file di patch mancanti nella fixture git derivata dal tarball,
assenza di `update.channel` persistito, posizioni legacy dei record di installazione dei plugin,
assenza della persistenza dei record di installazione del marketplace e migrazione dei metadati
di configurazione durante `plugins update`. Il pacchetto `2026.4.26` pubblicato può emettere avvisi
per file di marcatura dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; quelle stesse lacune fanno fallire la validazione
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

- `smoke`: lane rapide per installazione pacchetto/canale/agente, rete del Gateway e ricaricamento
  della configurazione
- `package`: contratti installazione/aggiornamento/riavvio/pacchetto plugin senza ClawHub
  live; è il valore predefinito del controllo di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI
  e OpenWebUI
- `full`: blocchi del percorso di rilascio Docker con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il tarball
`package-under-test` risolto alla lane Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione della pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Esso
orchestra i workflow trusted-publisher nell’ordine richiesto dal rilascio:

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

Pubblicazione stabile verso il dist-tag beta predefinito:

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
solo per lavori mirati di riparazione o ripubblicazione. Per una riparazione di un plugin selezionato, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure avvia direttamente il workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall’operatore:

- `tag`: tag di rilascio obbligatorio, come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere l’attuale
  commit SHA completo di 40 caratteri del branch del workflow per il preflight
  di sola validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il workflow riutilizza
  il tarball preparato dalla riuscita esecuzione di preflight
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; il valore predefinito è `beta`

`OpenClaw Release Publish` accetta questi input controllati dall’operatore:

- `tag`: tag di rilascio obbligatorio; deve esistere già
- `preflight_run_id`: id di esecuzione preflight riuscita di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: il valore predefinito è `all-publishable`; usa `selected` solo
  per lavori mirati di riparazione
- `plugins`: nomi dei pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: il valore predefinito è `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazioni solo per plugin

`OpenClaw Release Checks` accetta questi input controllati dall’operatore:

- `ref`: branch, tag o commit SHA completo da validare. I controlli che richiedono segreti
  richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un
  tag di rilascio.
- `run_release_soak`: abilita il soak esaustivo live/E2E, del percorso di rilascio Docker e
  upgrade-survivor all-since sui controlli di rilascio stabili/predefiniti. È forzato
  da `release_profile=full`.

Regole:

- I tag stabili e di correzione possono pubblicare sia su `beta` sia su `latest`
- I tag prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l’input commit SHA completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  di sola validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima che la pubblicazione continui

## Sequenza di rilascio npm stabile

Quando prepari un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare l’attuale commit SHA completo del branch del workflow
     per una prova a secco di sola validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul branch di rilascio, sul tag di rilascio o sul
   commit SHA completo quando vuoi la CI normale più copertura live della prompt cache,
   Docker, QA Lab, Matrix e Telegram da un singolo workflow manuale
4. Se ti serve intenzionalmente solo il grafo di test normale deterministico, esegui invece il
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
   programmata di auto-riparazione sposti `beta` in seguito

La mutazione dei dist-tag risiede nel repository privato per sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repository pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretto sia il percorso di promozione beta-first
documentati e visibili all’operatore.

Se un maintainer deve ricorrere all’autenticazione npm locale, esegui qualunque comando
1Password CLI (`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell’agente; mantenerlo dentro tmux rende prompt,
avvisi e gestione OTP osservabili e impedisce avvisi host ripetuti.

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
