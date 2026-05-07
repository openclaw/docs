---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della validazione della release o dell'accettazione del pacchetto
    - Ricerca della denominazione e della cadenza delle versioni
    - Pianificazione delle linee di rilascio di supporto mensile o LTS
summary: Canali di rilascio, lista di controllo dell'operatore, box di convalida, denominazione delle versioni, linee di supporto mensile pianificate e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-07T01:53:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: rilasci con tag che vengono pubblicati su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che vengono pubblicati su npm `beta`
- dev: la testata mobile di `main`

## Denominazione delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio legacy di correzione stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l’attuale rilascio npm stabile promosso
- `beta` indica l’attuale target di installazione beta
- I rilasci stabili e di correzione legacy vengono pubblicati su npm `beta` per impostazione predefinita; gli operatori di rilascio possono scegliere esplicitamente `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l’app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell’app Mac riservate ai rilasci stabili salvo richiesta esplicita

### Versionamento pianificato del supporto mensile

OpenClaw non ha ancora un canale LTS o di supporto mensile. I maintainer stanno
lavorando a linee di supporto mensile compatibili con SemVer, ma i canali di
aggiornamento distribuiti oggi sono ancora `stable`, `beta` e `dev`.

La forma di versione pianificata è `YYYY.M.PATCH`:

- `YYYY` è l’anno.
- `M` è la linea di rilascio mensile, senza zero iniziale.
- `PATCH` incrementa all’interno di quella linea mensile e può crescere quanto necessario.

Ad esempio, `2026.6.0`, `2026.6.1` e `2026.6.2` sarebbero tutti sulla linea di giugno
2026. Un futuro dist-tag di supporto mensile come `stable-2026-6` o
`lts-2026-6` potrebbe puntare a quella linea, mentre `latest` continua a muoversi rapidamente.

Questo modello futuro sostituisce la necessità di nuovi rilasci di correzione
`YYYY.M.D-N`. Le versioni di correzione legacy esistenti restano riconosciute, così i pacchetti
più vecchi e i percorsi di aggiornamento continuano a funzionare.

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Il rilascio stabile segue solo dopo la convalida dell’ultima beta
- I maintainer normalmente preparano i rilasci da un branch `release/YYYY.M.D` creato
  dall’attuale `main`, così la convalida e le correzioni del rilascio non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i maintainer preparano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura di rilascio dettagliata, le approvazioni, le credenziali e le note di ripristino sono
  riservate ai maintainer

## Checklist dell’operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall’attuale `main`: scarica l’ultima versione, conferma che il commit target sia stato inviato
   e conferma che la CI attuale di `main` sia abbastanza verde da usarlo come base del branch.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate agli utenti, esegui il commit, invialo e fai rebase/pull
   ancora una volta prima di creare il branch.
3. Esamina i record di compatibilità dei rilasci in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.D` dall’attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, esegui
   `pnpm plugins:sync` così i pacchetti Plugin pubblicabili condividono la versione di rilascio
   e i metadati di compatibilità, quindi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   per il preflight di sola convalida è consentito uno SHA completo di 40 caratteri del branch di rilascio.
   Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-rilascio con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l’unico punto di ingresso manuale
   per le quattro grandi test box di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio e riesegui il file, la lane,
   il job del workflow, il profilo del pacchetto, il provider o l’allowlist di modelli più piccolo che
   dimostri la correzione. Riesegui l’umbrella completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   invia tutti i pacchetti Plugin pubblicabili a npm e lo stesso insieme a
   ClawHub in parallelo, quindi promuove l’artefatto di preflight npm di OpenClaw preparato
   con il dist-tag corrispondente non appena la pubblicazione npm dei Plugin riesce.
   La pubblicazione su ClawHub potrebbe essere ancora in esecuzione mentre OpenClaw npm viene pubblicato, ma il
   workflow di pubblicazione del rilascio non termina finché entrambi i percorsi di pubblicazione dei Plugin e
   il percorso di pubblicazione npm di OpenClaw non sono completati correttamente. Dopo la pubblicazione, esegui
   l’accettazione del pacchetto post-pubblicazione
   contro il pacchetto `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta` pubblicato. Se una prerelease inviata o pubblicata richiede una correzione,
   prepara il numero di prerelease corrispondente successivo; non eliminare né riscrivere la vecchia
   prerelease.
10. Per stable, continua solo dopo che la beta verificata o il release candidate dispone delle
    prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso
    `OpenClaw Release Publish`, riutilizzando l’artefatto di preflight riuscito tramite
    `preflight_run_id`; la preparazione del rilascio macOS stabile richiede anche
    i pacchetti `.zip`, `.dmg`, `.dSYM.zip` e `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l’E2E Telegram standalone
    opzionale su npm pubblicato quando serve una prova del canale post-pubblicazione,
    la promozione del dist-tag quando necessario, le note di rilascio/prerelease GitHub dalla
    sezione completa corrispondente di `CHANGELOG.md` e i passaggi di annuncio del rilascio.

## Preflight di rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio in modo che il TypeScript dei test resti
  coperto fuori dal gate locale più rapido `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio in modo che i controlli più ampi sui
  cicli di import e sui confini architetturali siano verdi fuori dal gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` in modo che gli artefatti di rilascio
  `dist/*` previsti e il bundle della Control UI esistano per il passaggio di convalida del pacchetto
- Esegui `pnpm plugins:sync` dopo l'aumento della versione root e prima del tagging. Aggiorna
  le versioni dei pacchetti Plugin pubblicabili, i metadati di compatibilità peer/API di OpenClaw,
  i metadati di build e gli stub del changelog dei Plugin per farli corrispondere alla versione
  di rilascio core. `pnpm plugins:sync:check` è la guardia di rilascio non mutante;
  il workflow di pubblicazione fallisce prima di qualsiasi mutazione del registro se questo passaggio è stato
  dimenticato.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per
  avviare tutte le test box pre-rilascio da un unico punto di ingresso. Accetta un branch,
  tag o SHA completo di commit, avvia manualmente `CI` e avvia
  `OpenClaw Release Checks` per install smoke, package acceptance, controlli dei pacchetti cross-OS,
  parità QA Lab, Matrix e lane Telegram. Le esecuzioni stable/predefinite
  mantengono il soak live/E2E esaustivo e del percorso di rilascio Docker dietro
  `run_release_soak=true`; `release_profile=full` forza l'attivazione del soak. Con
  `release_profile=full` e `rerun_group=all`, esegue anche l'E2E Telegram del pacchetto
  contro l'artefatto `release-package-under-test` dai controlli di rilascio.
  Fornisci `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso E2E
  Telegram deve provare anche il pacchetto npm pubblicato. Fornisci
  `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance
  deve eseguire la propria matrice pacchetto/aggiornamento contro il pacchetto npm distribuito invece
  dell'artefatto costruito dallo SHA. Fornisci
  `evidence_package_spec` quando il report di evidenza privato deve provare che la
  convalida corrisponde a un pacchetto npm pubblicato senza forzare l'E2E Telegram.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel
  per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref`
  per impacchettare un branch/tag/SHA `package_ref` attendibile con l'harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256
  obbligatorio; oppure `source=artifact` per un tarball caricato da un'altra esecuzione di GitHub
  Actions. Il workflow risolve il candidato in
  `package-under-test`, riusa lo scheduler di rilascio Docker E2E contro quel
  tarball e può eseguire QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le lane Docker
  selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto
  è il candidato e `published_upgrade_survivor_baseline` seleziona la baseline
  pubblicata. `update-restart-auth` usa il pacchetto candidato sia come CLI installata
  sia come package-under-test, così esercita il percorso di riavvio gestito del comando
  di aggiornamento del candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane di installazione/canale/agente, rete Gateway e ricaricamento configurazione
  - `package`: lane native dell'artefatto per pacchetto/aggiornamento/riavvio/Plugin senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent,
    ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura completa della CI normale
  per il candidato rilascio. Gli avvii manuali della CI bypassano lo scope delle modifiche
  e forzano gli shard Linux Node, gli shard dei Plugin in bundle, i contratti dei canali,
  la compatibilità Node 22, `check`, `check-additional`, build smoke,
  controlli docs, Skills Python, Windows, macOS, Android e le lane i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando convalidi la telemetria di rilascio. Esercita
  QA-lab tramite un ricevitore locale OTLP/HTTP e verifica i nomi degli span
  delle trace esportate, gli attributi limitati e la redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio con tag
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Avvialo da `release/YYYY.M.D` (o da `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di rilascio e il `preflight_run_id`
  npm di OpenClaw riuscito e mantieni lo scope di pubblicazione Plugin predefinito
  `all-publishable` salvo che tu stia eseguendo deliberatamente una riparazione mirata. Il
  workflow serializza la pubblicazione npm dei Plugin, la pubblicazione ClawHub dei Plugin e la pubblicazione npm di OpenClaw,
  così il pacchetto core non viene pubblicato prima dei suoi Plugin esternalizzati.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo live
  Matrix rapido e la lane QA Telegram prima dell'approvazione del rilascio. Le lane live
  usano l'ambiente `qa-live-shared`; Telegram usa anche lease di credenziali Convex CI.
  Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi inventario completo Matrix
  di trasporto, media ed E2EE in parallelo.
- La convalida runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il
  workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantenere il vero percorso di rilascio npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  lane, così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che contengono segreti devono essere avviati tramite `Full Release
Validation` o dal workflow ref `main`/release, così la logica del workflow e
  i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, tag o SHA completo di commit purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Il preflight solo convalida di `OpenClaw NPM Release` accetta anche lo SHA completo
  di 40 caratteri del commit del branch workflow corrente senza richiedere un tag pushato
- Quel percorso SHA è solo per convalida e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner
  ospitati da GitHub, mentre il percorso di convalida non mutante può usare i runner
  Blacksmith Linux più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i secret del workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la lane separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione dal registro
  pubblicato in un prefisso temporaneo nuovo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram ed E2E reale Telegram
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente
  le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire il beta smoke completo post-pubblicazione da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L'helper esegue la convalida Parallels npm update/fresh-target, avvia `NPM Telegram Beta E2E`, interroga l'esecuzione esatta del workflow, scarica l'artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-poi-promuovi:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere avviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - i rilasci npm stable usano `beta` per impostazione predefinita
  - la pubblicazione npm stable può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione del dist-tag npm basata su token ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repository pubblico mantiene la pubblicazione solo OIDC
  - il `macOS Release` pubblico è solo convalida; quando un tag vive solo su un
    branch di rilascio ma il workflow viene avviato da `main`, imposta
    `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve superare il `preflight_run_id` e il
    `validate_run_id` mac privati riusciti
  - i percorsi di pubblicazione reali promuovono artefatti preparati invece di ricostruirli
    di nuovo
- Per i rilasci legacy di correzione stable come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di rilascio non possono lasciare silenziosamente installazioni globali più vecchie sul
  payload stable di base
- Il preflight di rilascio npm fallisce in modo chiuso salvo che il tarball includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`,
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei Plugin pubblicati e
  i metadati dei pacchetti siano presenti nel layout del registro installato. Un rilascio che
  distribuisce payload runtime dei Plugin mancanti fallisce il verificatore postpublish e
  non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget npm pack `unpackedSize` sul
  tarball di aggiornamento candidato, così l'e2e dell'installer intercetta il rigonfiamento accidentale del pacchetto
  prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato pianificazione CI, manifest di timing delle estensioni o
  matrici di test delle estensioni, rigenera e revisiona gli output di matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di rilascio non
  descrivono un layout CI obsoleto
- La preparazione del rilascio macOS stable include anche le superfici dell'updater:
  - il rilascio GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un URL feed Sparkle
    non vuoto e un `CFBundleVersion` pari o superiore alla soglia canonica di build Sparkle
    per quella versione di rilascio

## Test box di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da
un unico punto di ingresso. Per una prova di commit fissato su un branch in rapido movimento, usa
l'helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper pusha `release-ci/<sha>-...`, avvia `Full Release Validation`
da quel branch con `ref=<sha>`, verifica che ogni `headSha` del workflow figlio
corrisponda al target, poi elimina il branch temporaneo. Questo evita di provare per errore
un'esecuzione figlia più recente di `main`.

Per la convalida di branch o tag di rilascio, eseguila dal workflow ref `main`
attendibile e passa il branch o tag di rilascio come `ref`:

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
artifact padre `release-package-under-test` per i controlli rivolti ai pacchetti, ed
esegue il dispatch dell’E2E Telegram pacchetto standalone quando `release_profile=full` con
`rerun_group=all` o quando `npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di release cross-OS, copertura live/E2E Docker
del percorso di release quando il soak è abilitato, Package Acceptance con QA pacchetto Telegram, parità QA Lab, Matrix live e Telegram live. Un’esecuzione completa è accettabile solo quando il
riepilogo di
`Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve riuscire; al di fuori di full/all viene saltato
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il riepilogo finale
del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
Vedi [Validazione completa della release](/it/reference/full-release-validation) per la
matrice completa degli stadi, i nomi esatti dei job del workflow, le differenze tra profilo stable e full,
gli artifact e gli handle per rerun mirati.
I workflow figli vengono eseguiti dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch o tag di release precedente. Non esiste un input workflow-ref separato per Full Release Validation; scegli l’harness attendibile scegliendo il ref di esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per la prova di commit esatta su `main` mobile;
gli SHA di commit raw non possono essere ref di workflow dispatch, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo fissato.

Usa `release_profile` per selezionare l’ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker più rapido e critico per la release
- `stable`: minimum più copertura provider/backend stabile per l’approvazione della release
- `full`: stable più ampia copertura advisory di provider/media

Usa `run_release_soak=true` con `stable` quando le lane bloccanti per la release sono
verdi e vuoi lo sweep esaustivo live/E2E, del percorso di release Docker e
bounded published upgrade-survivor prima della promozione. Quello sweep copre
gli ultimi quattro pacchetti stable più le baseline fissate `2026.4.23` e `2026.5.2`
più la copertura precedente `2026.4.15`, con le baseline duplicate rimosse e
ogni baseline divisa nel proprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa il ref di workflow attendibile per risolvere il ref di destinazione
una volta come `release-package-under-test` e riusa quell’artifact nei controlli cross-OS,
Package Acceptance e Docker del percorso di release quando il soak viene eseguito. Questo mantiene
tutte le macchine rivolte ai pacchetti sugli stessi byte ed evita build ripetute del pacchetto.
L’install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane sta
dimostrando installazione del pacchetto, onboarding, avvio del Gateway e un turno live dell’agente,
non il benchmarking del modello predefinito più lento. La matrice provider live più ampia
rimane il posto per la copertura specifica del modello.

Usa queste varianti a seconda dello stadio della release:

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

Non usare l’ombrello completo come primo rerun dopo una correzione mirata. Se una macchina
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo pacchetto, il provider
modello o la lane QA falliti per la prossima prova. Esegui di nuovo l’ombrello completo solo quando
la correzione ha cambiato l’orchestrazione di release condivisa o ha reso obsoleta l’evidenza precedente
di tutte le macchine. Il verificatore finale dell’ombrello ricontrolla gli id registrati delle esecuzioni dei workflow figli, quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre fallito
`Verify full validation`.

Per il recupero bounded, passa `rerun_group` all’ombrello. `all` è la vera
esecuzione release-candidate, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio Plugin solo-release, `release-checks` esegue ogni macchina di release,
e i gruppi di release più ristretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
I rerun mirati `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l’artifact pacchetto di release-checks. I rerun
cross-OS mirati possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti QA release-check sono advisory; un fallimento solo QA
non blocca la validazione della release.

### Vitest

La macchina Vitest è il workflow figlio manuale `CI`. La CI manuale intenzionalmente
bypassa lo scoping changed e forza il normale grafo di test per la release
candidate: shard Linux Node, shard Plugin bundled, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS, Android e i18n Control UI.

Usa questa macchina per rispondere a "l’albero dei sorgenti ha superato l’intera suite di test normale?"
Non è la stessa cosa della validazione prodotto del percorso di release. Evidenza da conservare:

- riepilogo `Full Release Validation` che mostra l’URL dell’esecuzione `CI` dispatchata
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI quando si indagano regressioni
- artifact di timing Vitest come `.artifacts/vitest-shard-timings.json` quando
  un’esecuzione richiede analisi delle prestazioni

Esegui la CI manuale direttamente solo quando la release ha bisogno di CI normale deterministica ma
non delle macchine Docker, QA Lab, live, cross-OS o pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La macchina Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow `install-smoke`
in modalità release. Valida la release candidate tramite ambienti Docker pacchettizzati
invece dei soli test a livello sorgente.

La copertura Docker di release include:

- install smoke completo con lo smoke lento di installazione globale Bun abilitato
- preparazione/riuso dell’immagine smoke Dockerfile root per SHA di destinazione, con QR,
  root/gateway e job smoke installer/Bun eseguiti come shard install-smoke separati
- lane E2E del repository
- chunk Docker del percorso di release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- copertura OpenWebUI dentro il chunk `plugins-runtime-services` quando richiesta
- lane divise di installazione/disinstallazione Plugin bundled
  `bundled-plugin-install-uninstall-0` fino a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura modelli live Docker quando i release check
  includono suite live

Usa gli artifact Docker prima di rieseguire. Lo scheduler del percorso di release carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
timing di fase, JSON del piano dello scheduler e comandi di rerun. Per il recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow live/E2E riutilizzabile invece di
rieseguire tutti i chunk di release. I comandi di rerun generati includono il precedente
`package_artifact_run_id` e gli input dell’immagine Docker preparata quando disponibili, così una
lane fallita può riusare lo stesso tarball e le immagini GHCR.

### QA Lab

Anche la macchina QA Lab fa parte di `OpenClaw Release Checks`. È il gate di release
agentico e a livello canale, separato da Vitest e dalla meccanica dei pacchetti Docker.

La copertura QA Lab di release include:

- lane di parità mock che confronta la lane candidate OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live rapido usando l’ambiente `qa-live-shared`
- lane QA Telegram live usando lease di credenziali Convex CI
- `pnpm qa:otel:smoke` quando la telemetria di release richiede prova locale esplicita

Usa questa macchina per rispondere a "la release si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artifact per le lane parità, Matrix e Telegram
quando approvi la release. La copertura Matrix completa rimane disponibile come
esecuzione QA-Lab manuale sharded invece che come lane predefinita critica per la release.

### Pacchetto

La macchina Package è il gate del prodotto installabile. È supportata da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza una
candidate nel tarball `package-under-test` consumato da Docker E2E, valida
l’inventario del pacchetto, registra la versione del pacchetto e lo SHA-256, e mantiene il
ref dell’harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione di release OpenClaw esatta
- `source=ref`: pacchettizza un branch, tag o SHA di commit completo `package_ref` attendibile
  con l’harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` richiesto
- `source=artifact`: riusa un `.tgz` caricato da un’altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l’artifact
pacchetto di release preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, update,
riavvio update con auth configurata, pulizia di dipendenze Plugin stale, fixture Plugin offline,
update Plugin e QA pacchetto Telegram contro lo stesso tarball risolto. I release check bloccanti usano
la baseline predefinita dell’ultimo pacchetto pubblicato; `run_release_soak=true` o
`release_profile=full` espande a ogni baseline stable pubblicata su npm da
`2026.4.23` fino a `latest` più le fixture degli issue segnalati. Usa
Package Acceptance con `source=npm` per una candidate già distribuita, oppure
`source=ref`/`source=artifact` per un tarball npm locale supportato da SHA prima della
pubblicazione. È il sostituto GitHub-native
per gran parte della copertura package/update che in precedenza richiedeva
Parallels. I controlli di release cross-OS restano importanti per onboarding,
installer e comportamento piattaforma specifici per OS, ma la validazione prodotto package/update dovrebbe
preferire Package Acceptance.

La checklist canonica per validazione update e Plugin è
[Testare update e Plugin](/it/help/testing-updates-plugins). Usala quando
devi decidere quale lane locale, Docker, Package Acceptance o release-check prova un
cambiamento di install/update Plugin, pulizia doctor o migrazione di pacchetto pubblicato.
La migrazione update pubblicata esaustiva da ogni pacchetto stable `2026.4.23+` è
un workflow manuale `Update Migration` separato, non parte della Full Release CI.

La tolleranza legacy dell'accettazione dei pacchetti è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci private dell'inventario QA mancanti dal tarball, assenza di
`gateway install --wrapper`, file patch mancanti nella fixture git derivata dal tarball,
`update.channel` persistito mancante, posizioni legacy dei record di installazione dei plugin,
persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione
durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può avvisare
per file di marcatura dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; quelle stesse lacune fanno fallire la
validazione della release.

Usa profili Package Acceptance più ampi quando la domanda sulla release riguarda un
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

- `smoke`: lane rapide di installazione pacchetto/canale/agente, rete Gateway e
  ricaricamento della configurazione
- `package`: contratti di installazione/aggiornamento/riavvio/pacchetto plugin senza ClawHub
  live; è il valore predefinito dei controlli di release
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI
  e OpenWebUI
- `full`: segmenti del percorso di release Docker con OpenWebUI
- `custom`: elenco esatto di `docker_lanes` per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il tarball
`package-under-test` risolto nella lane Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione della pubblicazione della release

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Orchestra
i workflow trusted-publisher nell'ordine richiesto dalla release:

1. Esegue il checkout del tag di release e ne risolve lo SHA del commit.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegue `pnpm plugins:sync:check`.
4. Avvia `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Avvia `Plugin ClawHub Release` con lo stesso ambito e SHA.
6. Avvia `OpenClaw NPM Release` con il tag di release, il dist-tag npm e
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
solo per lavori mirati di riparazione o ripubblicazione. Per la riparazione di un plugin selezionato, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure avvia direttamente il workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA del commit
  completo di 40 caratteri del ramo del workflow corrente per un preflight solo di validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il workflow riutilizza
  il tarball preparato dall'esecuzione di preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; predefinito `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio; deve già esistere
- `preflight_run_id`: id dell'esecuzione di preflight `OpenClaw NPM Release` riuscita;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: predefinito `all-publishable`; usa `selected` solo
  per lavori di riparazione mirati
- `plugins`: nomi di pacchetto `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: predefinito `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione per soli plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: ramo, tag o SHA del commit completo da validare. I controlli con segreti
  richiedono che il commit risolto sia raggiungibile da un ramo OpenClaw o da un
  tag di release.
- `run_release_soak`: abilita soak esaustivo live/E2E, del percorso di release Docker e
  upgrade-survivor all-since sui controlli di release stabili/predefiniti. Viene forzato
  da `release_profile=full`.

Regole:

- I tag stabili e di correzione possono pubblicare su `beta` o `latest`
- I tag prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA del commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima che la pubblicazione continui

## Sequenza di release npm stabile

Quando si prepara una release npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA del commit completo del ramo del workflow corrente
     per una prova a secco solo di validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul ramo di release, sul tag di release o sullo SHA del
   commit completo quando vuoi CI normale più copertura live prompt cache, Docker, QA Lab,
   Matrix e Telegram da un unico workflow manuale
4. Se ti serve intenzionalmente solo il grafo di test normale deterministico, esegui invece
   il workflow manuale `CI` sul riferimento di release
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se la release è arrivata su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se la release è stata intenzionalmente pubblicata direttamente su `latest` e `beta`
   deve puntare subito alla stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   programmata di auto-riparazione sposti `beta` in seguito

La modifica del dist-tag risiede nel repo privato per sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene documentati e visibili agli operatori sia il percorso di pubblicazione diretta sia
il percorso di promozione beta-first.

Se un maintainer deve ripiegare sull'autenticazione npm locale, esegui tutti i comandi della
CLI 1Password (`op`) solo all'interno di una sessione tmux dedicata. Non chiamare `op`
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

I maintainer usano la documentazione privata delle release in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.

## Correlati

- [Canali di release](/it/install/development-channels)
