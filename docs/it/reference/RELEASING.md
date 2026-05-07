---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida della release o dell'accettazione del pacchetto
    - Cerchi denominazione e cadenza delle versioni
summary: Canali di rilascio, lista di controllo dell'operatore, ambienti di convalida, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-07T13:25:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stabile: release con tag che pubblicano su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: la testa mobile di `main`

## Denominazione delle versioni

- Versione di release stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di release correttiva stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica la release npm stabile attualmente promossa
- `beta` indica la destinazione di installazione beta corrente
- Le release stabili e le release correttive stabili pubblicano su npm `beta` per impostazione predefinita; gli operatori di release possono scegliere esplicitamente `latest`, oppure promuovere in seguito una build beta verificata
- Ogni release stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  le release beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app Mac riservate alle release stabili salvo richiesta esplicita

## Cadenza di rilascio

- Le release procedono prima dalla beta
- La stabile segue solo dopo che l'ultima beta è stata convalidata
- I maintainer normalmente creano le release da un branch `release/YYYY.M.D` creato
  da `main` corrente, così la convalida della release e le correzioni non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- Procedura di rilascio dettagliata, approvazioni, credenziali e note di ripristino sono
  riservate ai maintainer

## Checklist dell'operatore di release

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti da `main` corrente: esegui il pull dell'ultima versione, conferma che il commit di destinazione sia stato inviato
   e conferma che la CI corrente di `main` sia abbastanza verde per creare un branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate agli utenti, esegui il commit, invialo, quindi fai rebase/pull
   ancora una volta prima di creare il branch.
3. Esamina i record di compatibilità delle release in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.D` da `main` corrente; non svolgere il normale lavoro di release
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, esegui
   `pnpm plugins:sync` affinché i pacchetti Plugin pubblicabili condividano la versione di release
   e i metadati di compatibilità, quindi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   è consentito uno SHA completo di 40 caratteri del branch di release per il preflight
   di sola convalida. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-release con `Full Release Validation` per il
   branch di release, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per i quattro grandi box di test della release: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di release e riesegui il file, il canale,
   il job del workflow, il profilo del pacchetto, il provider o l'allowlist di modelli più piccolo che
   dimostra la correzione. Riesegui l'ombrello completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   invia in parallelo tutti i pacchetti Plugin pubblicabili a npm e lo stesso insieme a
   ClawHub, quindi promuove l'artefatto di preflight npm di OpenClaw preparato
   con il dist-tag corrispondente non appena la pubblicazione npm dei Plugin riesce.
   La pubblicazione su ClawHub potrebbe essere ancora in corso mentre OpenClaw npm pubblica, ma il
   workflow di pubblicazione della release non termina finché entrambi i percorsi di pubblicazione dei Plugin e
   il percorso di pubblicazione npm di OpenClaw non sono stati completati con successo. Dopo la pubblicazione, esegui
   l'accettazione del pacchetto post-pubblicazione
   contro il pacchetto `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta` pubblicato. Se una prerelease inviata o pubblicata richiede una correzione,
   crea il numero di prerelease corrispondente successivo; non eliminare né riscrivere la vecchia
   prerelease.
10. Per stabile, prosegui solo dopo che la beta o la release candidate verificata dispone delle
    prove di convalida richieste. Anche la pubblicazione npm stabile passa da
    `OpenClaw Release Publish`, riutilizzando l'artefatto di preflight riuscito tramite
    `preflight_run_id`; la prontezza della release macOS stabile richiede anche gli
    `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram
    pubblicato-npm standalone opzionale quando serve una prova del canale post-pubblicazione,
    la promozione del dist-tag quando necessario, le note di release/prerelease GitHub dalla
    sezione completa corrispondente di `CHANGELOG.md` e i passaggi di annuncio della release.

## Preflight di release

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così il TypeScript dei test resta coperto fuori dal gate locale più rapido `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli più ampi sui cicli di importazione e sui confini architetturali risultano verdi fuori dal gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di rilascio `dist/*` attesi e il bundle Control UI esistono per il passaggio di convalida del pack
- Esegui `pnpm plugins:sync` dopo l'aumento della versione root e prima del tagging. Aggiorna le versioni dei pacchetti Plugin pubblicabili, i metadati di compatibilità peer/API OpenClaw, i metadati di build e gli stub dei changelog dei Plugin in modo che corrispondano alla versione di rilascio core. `pnpm plugins:sync:check` è la guardia di rilascio non mutante; il workflow di pubblicazione fallisce prima di qualsiasi mutazione del registry se questo passaggio è stato dimenticato.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per avviare tutti i test box pre-release da un unico entrypoint. Accetta un branch, tag o SHA di commit completo, esegue il dispatch manuale di `CI` e il dispatch di `OpenClaw Release Checks` per install smoke, package acceptance, controlli pacchetto cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stable/default mantengono il soak esaustivo live/E2E e Docker release-path dietro `run_release_soak=true`; `release_profile=full` forza il soak. Con `release_profile=full` e `rerun_group=all`, esegue anche il package Telegram E2E contro l'artefatto `release-package-under-test` dei controlli di rilascio. Fornisci `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso Telegram E2E deve provare anche il pacchetto npm pubblicato. Fornisci `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance deve eseguire la sua matrice package/update contro il pacchetto npm distribuito invece che contro l'artefatto creato dallo SHA. Fornisci `evidence_package_spec` quando il report di evidenza privato deve provare che la convalida corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E. Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel per un candidato pacchetto mentre il lavoro di rilascio prosegue. Usa `source=npm` per `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref` per impacchettare un branch/tag/SHA `package_ref` attendibile con l'harness `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256 obbligatorio; oppure `source=artifact` per un tarball caricato da un'altra esecuzione GitHub Actions. Il workflow risolve il candidato in `package-under-test`, riutilizza lo scheduler Docker E2E di rilascio contro quel tarball e può eseguire la QA Telegram contro lo stesso tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le lane Docker selezionate includono `published-upgrade-survivor`, l'artefatto package è il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato sia come CLI installata sia come package-under-test, così esercita il percorso di riavvio gestito del comando update candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane install/channel/agent, rete Gateway e ricaricamento config
  - `package`: lane package/update/restart/plugin native dell'artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent, ricerca web OpenAI e OpenWebUI
  - `full`: blocchi Docker release-path con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando hai bisogno solo della normale copertura CI completa per il candidato di rilascio. I dispatch manuali CI bypassano lo scoping dei cambiamenti e forzano le shard Linux Node, le shard dei Plugin bundled, i contratti channel, la compatibilità Node 22, `check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS, Android e lane Control UI i18n.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando convalidi la telemetria di rilascio. Esercita QA-lab tramite un ricevitore OTLP/HTTP locale e verifica i nomi degli span di trace esportati, gli attributi delimitati e la redazione di contenuti/identificatori senza richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio con tag
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il tag esiste. Eseguilo da `release/YYYY.M.D` (o da `main` quando pubblichi un tag raggiungibile da main), passa il tag di rilascio e il `preflight_run_id` npm OpenClaw riuscito, e mantieni lo scope di pubblicazione Plugin predefinito `all-publishable` a meno che tu non stia eseguendo deliberatamente una riparazione mirata. Il workflow serializza la pubblicazione npm dei Plugin, la pubblicazione ClawHub dei Plugin e la pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato prima dei suoi Plugin esternalizzati.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo live Matrix rapido e la lane QA Telegram prima dell'approvazione del rilascio. Le lane live usano l'ambiente `qa-live-shared`; Telegram usa anche lease di credenziali Convex CI. Esegui il workflow manuale `QA-Lab - All Lanes` con `matrix_profile=all` e `matrix_shards=true` quando vuoi l'inventario completo di trasporto Matrix, media ed E2EE in parallelo.
- La convalida runtime di installazione e upgrade cross-OS fa parte di `OpenClaw Release Checks` e `Full Release Validation` pubblici, che chiamano direttamente il workflow riutilizzabile `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il vero percorso di rilascio npm breve, deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro lane, così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che contengono segreti devono essere eseguiti tramite `Full Release Validation` o dal workflow ref `main`/release, così la logica del workflow e i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, tag o SHA di commit completo purché il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Anche il preflight solo convalida `OpenClaw NPM Release` accetta lo SHA completo di 40 caratteri del commit del branch workflow corrente senza richiedere un tag pushato
- Quel percorso SHA è solo di convalida e non può essere promosso in una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il vero percorso di pubblicazione e promozione sui runner ospitati da GitHub, mentre il percorso di convalida non mutante può usare i runner Linux Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando sia i secret workflow `OPENAI_API_KEY` sia `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la lane separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correction corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correction corrispondente) per verificare il percorso di installazione dal registry pubblicato in un nuovo prefix temporaneo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare l'onboarding del pacchetto installato, la configurazione Telegram e il vero Telegram E2E contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram con lease. Esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire il beta smoke completo post-pubblicazione da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L'helper esegue la convalida Parallels npm update/fresh-target, esegue il dispatch di `NPM Telegram Beta E2E`, effettua il polling dell'esecuzione workflow esatta, scarica l'artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-then-promote:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere eseguita dallo stesso branch `main` o `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - i rilasci npm stable hanno come default `beta`
  - la pubblicazione npm stable può puntare esplicitamente a `latest` tramite input workflow
  - la mutazione npm dist-tag basata su token ora vive in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` per sicurezza, perché `npm dist-tag add` ha ancora bisogno di `NPM_TOKEN` mentre il repo pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di convalida; quando un tag vive solo su un branch di rilascio ma il workflow viene eseguito da `main`, imposta `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve superare `preflight_run_id` e `validate_run_id` mac privati riusciti
  - i percorsi di pubblicazione reali promuovono artefatti preparati invece di ricostruirli di nuovo
- Per rilasci di correzione stable come `YYYY.M.D-N`, il verificatore post-pubblicazione controlla anche lo stesso percorso di upgrade con prefix temporaneo da `YYYY.M.D` a `YYYY.M.D-N`, così le correzioni di rilascio non possono lasciare silenziosamente installazioni globali più vecchie sul payload stable di base
- Il preflight di rilascio npm fallisce in modo chiuso a meno che il tarball includa sia `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto, così non spediamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei Plugin pubblicati e i metadati del pacchetto siano presenti nel layout registry installato. Un rilascio che spedisce payload runtime Plugin mancanti fallisce il verificatore postpublish e non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` del pack npm sul tarball candidato di update, così l'e2e installer intercetta rigonfiamenti accidentali del pack prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest di timing dei Plugin o le matrici di test dei Plugin, rigenera e revisiona gli output matrice `plugin-prerelease-extension-shard` di proprietà del planner da `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di rilascio non descrivono un layout CI obsoleto
- La readiness del rilascio macOS stable include anche le superfici updater:
  - la release GitHub deve finire con i `.zip`, `.dmg` e `.dSYM.zip` pacchettizzati
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non debug, un URL feed Sparkle non vuoto e un `CFBundleVersion` pari o superiore al build floor Sparkle canonico per quella versione di rilascio

## Test box di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-release da un unico entrypoint. Per una prova di commit fissato su un branch in rapido movimento, usa l'helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper pusha `release-ci/<sha>-...`, esegue il dispatch di `Full Release Validation` da quel branch con `ref=<sha>`, verifica che ogni `headSha` dei workflow figli corrisponda al target, quindi elimina il branch temporaneo. Questo evita di provare per errore un'esecuzione figlia di `main` più recente.

Per la convalida di branch o tag di rilascio, eseguila dal workflow ref attendibile `main` e passa il branch o tag di rilascio come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Il workflow risolve il ref di destinazione, avvia manualmente `CI` con
`target_ref=<release-ref>`, avvia `OpenClaw Release Checks`, prepara un artefatto
padre `release-package-under-test` per i controlli rivolti ai pacchetti e avvia
l’E2E Telegram autonomo del pacchetto quando `release_profile=full` con
`rerun_group=all` oppure quando `npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di release cross-OS, copertura live/E2E Docker
del percorso di release quando il soak è abilitato, Package Acceptance con QA del pacchetto Telegram,
parità QA Lab, Matrix live e Telegram live. Un’esecuzione completa è accettabile solo quando il
riepilogo di `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il child `npm_telegram` deve riuscire; fuori da full/all viene saltato
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il riepilogo finale
del verificatore include tabelle dei job più lenti per ogni esecuzione child, così il release
manager può vedere il percorso critico attuale senza scaricare i log.
Consulta [Validazione completa della release](/it/reference/full-release-validation) per la
matrice completa degli stage, i nomi esatti dei job del workflow, le differenze
tra profili stable e full, gli artefatti e gli handle per riesecuzioni mirate.
I workflow child vengono avviati dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch o tag di release precedente. Non esiste un input separato per il workflow-ref di Full Release Validation;
scegli l’harness attendibile scegliendo il ref dell’esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per la prova di un commit esatto su `main` mobile;
gli SHA di commit grezzi non possono essere ref di dispatch del workflow, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo fissato.

Usa `release_profile` per selezionare l’ampiezza live/provider:

- `minimum`: il percorso OpenAI/core live e Docker più veloce e critico per la release
- `stable`: minimum più copertura stabile di provider/backend per l’approvazione della release
- `full`: stable più ampia copertura consultiva di provider/media

Usa `run_release_soak=true` con `stable` quando le lane bloccanti per la release sono
verdi e vuoi la sweep esaustiva live/E2E, del percorso di release Docker e
limitata degli upgrade-survivor pubblicati prima della promozione. Questa sweep copre
gli ultimi quattro pacchetti stabili più le baseline fissate `2026.4.23` e `2026.5.2`
più la copertura precedente `2026.4.15`, con baseline duplicate rimosse e
ogni baseline suddivisa nel proprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa il ref attendibile del workflow per risolvere il ref di destinazione
una volta come `release-package-under-test` e riusa quell’artefatto nei controlli cross-OS,
Package Acceptance e Docker del percorso di release quando il soak viene eseguito. Questo mantiene
tutti i box rivolti ai pacchetti sugli stessi byte ed evita build ripetute del pacchetto.
L’install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile del repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane sta
provando installazione del pacchetto, onboarding, avvio del Gateway e un turno live dell’agente
anziché fare benchmark del modello predefinito più lento. La matrice più ampia dei provider live
rimane il luogo per la copertura specifica dei modelli.

Usa queste varianti in base alla fase della release:

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

Non usare l’ombrello completo come prima riesecuzione dopo una correzione mirata. Se un box
fallisce, usa il workflow child, il job, la lane Docker, il profilo del pacchetto, il provider
del modello o la lane QA falliti per la prova successiva. Riesegui l’ombrello completo solo quando
la correzione ha modificato l’orchestrazione condivisa della release o ha reso obsoleta l’evidenza
precedente su tutti i box. Il verificatore finale dell’ombrello ricontrolla gli id delle esecuzioni
dei workflow child registrati, quindi dopo che un workflow child è stato rieseguito con successo,
riesegui solo il job parent `Verify full validation` fallito.

Per un recupero limitato, passa `rerun_group` all’ombrello. `all` è la vera
esecuzione da release-candidate, `ci` esegue solo il child CI normale, `plugin-prerelease`
esegue solo il child Plugin solo-release, `release-checks` esegue ogni box di release,
e i gruppi di release più stretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate di `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l’artefatto del pacchetto di release-checks. Le riesecuzioni
cross-OS mirate possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti QA di release-check sono consultivi; un fallimento solo QA
non blocca la validazione della release.

### Vitest

Il box Vitest è il workflow child manuale `CI`. CI manuale aggira intenzionalmente
lo scoping dei cambiamenti e forza il grafo di test normale per la release
candidate: shard Linux Node, shard dei Plugin in bundle, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS,
Android e i18n della Control UI.

Usa questo box per rispondere a “il source tree ha superato la suite completa di test normale?”
Non è la stessa cosa della validazione del prodotto sul percorso di release. Evidenza da conservare:

- riepilogo di `Full Release Validation` che mostra l’URL dell’esecuzione `CI` avviata
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI durante l’indagine di regressioni
- artefatti di temporizzazione Vitest come `.artifacts/vitest-shard-timings.json` quando
  un’esecuzione richiede analisi delle prestazioni

Esegui CI manuale direttamente solo quando la release richiede CI normale deterministica ma
non i box Docker, QA Lab, live, cross-OS o pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Il box Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow `install-smoke`
in modalità release. Valida la release candidate attraverso ambienti Docker
impacchettati invece che solo test a livello di sorgente.

La copertura Docker di release include:

- install smoke completo con lo smoke lento dell’installazione globale Bun abilitato
- preparazione/riuso dell’immagine smoke del Dockerfile root per SHA di destinazione, con job smoke QR,
  root/gateway e installer/Bun eseguiti come shard install-smoke separati
- lane E2E del repository
- chunk Docker del percorso di release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- copertura OpenWebUI dentro il chunk `plugins-runtime-services` quando richiesta
- lane divise di installazione/disinstallazione dei Plugin in bundle
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura dei modelli live Docker quando i release check
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di release carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
tempi delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per il recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow riutilizzabile live/E2E invece di
rieseguire tutti i chunk di release. I comandi di riesecuzione generati includono il precedente
`package_artifact_run_id` e gli input delle immagini Docker preparate quando disponibili, così una
lane fallita può riusare lo stesso tarball e le stesse immagini GHCR.

### QA Lab

Il box QA Lab fa anch’esso parte di `OpenClaw Release Checks`. È il gate di release
per il comportamento agentico e a livello di canale, separato da Vitest e dalla
meccanica dei pacchetti Docker.

La copertura QA Lab di release include:

- lane di parità mock che confronta la lane candidate OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live veloce usando l’ambiente `qa-live-shared`
- lane QA Telegram live usando lease di credenziali Convex CI
- `pnpm qa:otel:smoke` quando la telemetria di release richiede una prova locale esplicita

Usa questo box per rispondere a “la release si comporta correttamente negli scenari QA e
nei flussi di canali live?” Conserva gli URL degli artefatti per le lane parità, Matrix e Telegram
quando approvi la release. La copertura Matrix completa rimane disponibile come esecuzione manuale
QA-Lab shardata anziché come lane critica predefinita per la release.

### Pacchetto

Il box Pacchetto è il gate del prodotto installabile. È supportato da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza una
candidate nel tarball `package-under-test` consumato da Docker E2E, valida
l’inventario del pacchetto, registra la versione del pacchetto e lo SHA-256 e mantiene
il ref dell’harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di release OpenClaw
- `source=ref`: crea il pacchetto da un branch, tag o SHA completo di commit `package_ref` attendibile
  con l’harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` obbligatorio
- `source=artifact`: riusa un `.tgz` caricato da un’altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l’artefatto
del pacchetto di release preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, update,
riavvio update con auth configurata, pulizia di dipendenze Plugin obsolete, fixture Plugin
offline, update Plugin e QA del pacchetto Telegram contro lo stesso tarball risolto.
I release check bloccanti usano la baseline predefinita dell’ultimo pacchetto pubblicato;
`run_release_soak=true` o
`release_profile=full` si espande a ogni baseline stabile pubblicata su npm da
`2026.4.23` a `latest` più fixture di problemi segnalati. Usa
Package Acceptance con `source=npm` per una candidate già distribuita, oppure
`source=ref`/`source=artifact` per un tarball npm locale supportato da SHA prima della
pubblicazione. È il sostituto nativo GitHub per la maggior parte della copertura
pacchetto/update che prima richiedeva Parallels. I controlli di release cross-OS contano ancora
per onboarding, installer e comportamento di piattaforma specifici dell’OS, ma la validazione
di prodotto pacchetto/update dovrebbe preferire Package Acceptance.

La checklist canonica per la validazione di update e Plugin è
[Test di update e Plugin](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o release-check prova una modifica di
installazione/update Plugin, pulizia doctor o migrazione di pacchetto pubblicato.
La migrazione esaustiva di update pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale separato `Update Migration`, non parte di Full Release CI.

La permissività legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci private dell'inventario QA mancanti dal tarball, assenza di
`gateway install --wrapper`, file patch mancanti nella fixture git derivata dal tarball,
assenza di `update.channel` persistito, posizioni legacy dei record di installazione dei Plugin,
assenza della persistenza dei record di installazione del marketplace e migrazione dei metadati
di configurazione durante `plugins update`. Il pacchetto `2026.4.26` pubblicato può emettere avvisi
per i file di marcatura dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; quelle stesse lacune fanno fallire la
validazione di rilascio.

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

Profili di pacchetto comuni:

- `smoke`: corsie rapide per installazione pacchetto/canale/agente, rete Gateway e
  ricaricamento della configurazione
- `package`: contratti di installazione/aggiornamento/riavvio/pacchetto Plugin senza ClawHub
  live; è il valore predefinito dei controlli di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagente, ricerca web OpenAI
  e OpenWebUI
- `full`: segmenti del percorso di rilascio Docker con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` oppure
`telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il tarball
`package-under-test` risolto alla corsia Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione di pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Orchestra i workflow trusted-publisher nell'ordine necessario al rilascio:

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
solo per interventi mirati di riparazione o ripubblicazione. Per una riparazione di un Plugin selezionato, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure avvia direttamente il workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` oppure
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere il commit SHA
  completo a 40 caratteri del branch del workflow corrente per un preflight solo di validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il workflow riusa
  il tarball preparato dalla riuscita esecuzione di preflight
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; valore predefinito `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve già esistere
- `preflight_run_id`: id dell'esecuzione di preflight riuscita di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: valore predefinito `all-publishable`; usa `selected` solo
  per interventi mirati di riparazione
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: valore predefinito `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione solo per Plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o commit SHA completo da validare. I controlli con segreti
  richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un
  tag di rilascio.
- `run_release_soak`: attiva soak esaustivo live/E2E, percorso di rilascio Docker e
  all-since upgrade-survivor sui controlli di rilascio stabili/predefiniti. Viene forzato
  da `release_profile=full`.

Regole:

- I tag stabili e di correzione possono essere pubblicati su `beta` o `latest`
- I tag di prerelease beta possono essere pubblicati solo su `beta`
- Per `OpenClaw NPM Release`, l'input commit SHA completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima di proseguire con la pubblicazione

## Sequenza di rilascio npm stabile

Quando si prepara un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare il commit SHA completo corrente del branch del workflow
     per una prova a secco solo di validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul branch di rilascio, sul tag di rilascio o sul commit SHA completo
   quando vuoi CI normale più copertura live della cache dei prompt, Docker, QA Lab,
   Matrix e Telegram da un unico workflow manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sulla ref di rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i Plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se il rilascio è arrivato su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se il rilascio è stato intenzionalmente pubblicato direttamente su `latest` e `beta`
   deve seguire immediatamente la stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   pianificata di self-healing sposti `beta` in seguito

La mutazione dei dist-tag risiede nel repo privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo tramite OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

Se un maintainer deve ricorrere all'autenticazione npm locale, esegui qualsiasi comando 1Password
CLI (`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; tenerlo dentro tmux rende osservabili prompt,
avvisi e gestione OTP e previene avvisi ripetuti dell'host.

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
