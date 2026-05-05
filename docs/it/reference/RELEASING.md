---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della validazione del rilascio o dell'accettazione del pacchetto
    - Cerchi informazioni sulla nomenclatura e sulla cadenza delle versioni
summary: Canali di rilascio, checklist per operatori, box di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-05T01:49:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: rilasci con tag che pubblicano su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: la testa mobile di `main`

## Nomenclatura delle versioni

- Versione del rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione del rilascio stabile correttivo: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione della prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali al mese o al giorno
- `latest` indica il rilascio npm stabile promosso corrente
- `beta` indica il target di installazione beta corrente
- I rilasci stabili e stabili correttivi pubblicano su npm `beta` per impostazione predefinita; gli operatori di rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app Mac riservate allo stabile salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Lo stabile segue solo dopo che l'ultima beta è stata convalidata
- I manutentori normalmente preparano i rilasci da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la convalida del rilascio e le correzioni non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato pushato o pubblicato e richiede una correzione, i manutentori creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- Procedura di rilascio dettagliata, approvazioni, credenziali e note di ripristino sono
  riservate ai soli manutentori

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, recupero dei dist-tag e dettagli di rollback d'emergenza restano nel
runbook di rilascio riservato ai manutentori.

1. Parti dall'attuale `main`: scarica l'ultima versione, conferma che il commit target sia stato pushato
   e conferma che la CI attuale di `main` sia sufficientemente verde per creare il branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci rivolte agli utenti, esegui il commit, il push e fai rebase/pull
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
   uno SHA completo di 40 caratteri del branch di rilascio è consentito per il preflight
   solo di convalida. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-release con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per le quattro grandi test box di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio e riesegui il più piccolo
   file, canale, job di workflow, profilo di pacchetto, provider o allowlist di modelli fallito che
   dimostri la correzione. Riesegui l'umbrella completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per la beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   pubblica prima tutti i pacchetti Plugin pubblicabili su npm, pubblica poi lo stesso
   set su ClawHub come tarball npm-pack ClawPack, quindi promuove l'artefatto
   preflight npm di OpenClaw preparato con il dist-tag corrispondente. Dopo la
   pubblicazione, esegui l'accettazione del pacchetto post-pubblicazione
   contro il pacchetto pubblicato `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta`. Se una prerelease pushata o pubblicata richiede una correzione,
   crea il numero di prerelease corrispondente successivo; non eliminare né riscrivere la vecchia
   prerelease.
10. Per lo stabile, prosegui solo dopo che la beta verificata o il release candidate dispone delle
    prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso
    `OpenClaw Release Publish`, riutilizzando l'artefatto preflight riuscito tramite
    `preflight_run_id`; la preparazione del rilascio stabile macOS richiede anche i
    pacchetti `.zip`, `.dmg`, `.dSYM.zip` e l'`appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram
    standalone opzionale su npm pubblicato quando servono prove del canale post-pubblicazione,
    la promozione dei dist-tag quando necessaria, le note di rilascio/prerelease GitHub dalla
    sezione completa corrispondente di `CHANGELOG.md` e i passaggi di annuncio del rilascio.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight della release, così il TypeScript dei test resta coperto al di fuori del gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight della release, così i controlli più ampi sui cicli di importazione e sui confini architetturali risultano verdi al di fuori del gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di release `dist/*` attesi e il bundle della Control UI esistono per il passaggio di convalida del pacchetto
- Esegui `pnpm plugins:sync` dopo l’incremento della versione root e prima del tagging. Aggiorna le versioni dei pacchetti plugin pubblicabili, i metadati di compatibilità peer/API di OpenClaw, i metadati di build e gli stub dei changelog dei plugin in modo che corrispondano alla versione della release core. `pnpm plugins:sync:check` è la guardia di release non mutante; il workflow di pubblicazione fallisce prima di qualsiasi mutazione del registro se questo passaggio è stato dimenticato.
- Esegui il workflow manuale `Full Release Validation` prima dell’approvazione della release per avviare tutti i test box pre-release da un unico entrypoint. Accetta un branch, un tag o uno SHA completo di commit, invia manualmente `CI` e invia `OpenClaw Release Checks` per smoke di installazione, accettazione del pacchetto, controlli pacchetto cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite mantengono il soak esaustivo live/E2E e del percorso di release Docker dietro `run_release_soak=true`; `release_profile=full` forza l’attivazione del soak. Con `release_profile=full` e `rerun_group=all`, esegue anche il pacchetto Telegram E2E contro l’artefatto `release-package-under-test` dai controlli di release. Fornisci `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso Telegram E2E deve provare anche il pacchetto npm pubblicato. Fornisci `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance deve eseguire la propria matrice pacchetto/aggiornamento contro il pacchetto npm distribuito invece dell’artefatto creato dallo SHA. Fornisci `evidence_package_spec` quando il report di evidenza privato deve dimostrare che la convalida corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E. Esempio: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel per un candidato pacchetto mentre il lavoro di release continua. Usa `source=npm` per `openclaw@beta`, `openclaw@latest` o una versione esatta di release; `source=ref` per impacchettare un branch/tag/SHA `package_ref` attendibile con l’harness `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256 obbligatorio; oppure `source=artifact` per un tarball caricato da un’altra esecuzione GitHub Actions. Il workflow risolve il candidato in `package-under-test`, riusa lo scheduler di release Docker E2E contro quel tarball e può eseguire la QA Telegram contro lo stesso tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le lane Docker selezionate includono `published-upgrade-survivor`, l’artefatto del pacchetto è il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata. Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane di installazione/canale/agente, rete Gateway e ricaricamento configurazione
  - `package`: lane pacchetto/aggiornamento/plugin native dell’artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo pacchetto più canali MCP, pulizia cron/subagente, ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di release Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura CI normale completa per il candidato di release. Gli invii manuali CI bypassano lo scoping per modifiche e forzano le shard Linux Node, le shard dei plugin inclusi, i contratti dei canali, la compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Skills Python, Windows, macOS, Android e lane i18n della Control UI. Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando convalidi la telemetria di release. Esercita QA-lab tramite un ricevitore OTLP/HTTP locale e verifica i nomi degli span di trace esportati, gli attributi limitati e la redazione di contenuto/identificatori senza richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni release con tag
- Esegui `OpenClaw Release Publish` per la sequenza mutante di pubblicazione dopo che il tag esiste. Invialo da `release/YYYY.M.D` (o da `main` quando pubblichi un tag raggiungibile da main), passa il tag di release e il `preflight_run_id` npm OpenClaw riuscito, e mantieni lo scope predefinito di pubblicazione plugin `all-publishable` a meno che tu non stia eseguendo deliberatamente una riparazione mirata. Il workflow serializza la pubblicazione npm dei plugin, la pubblicazione ClawHub dei plugin e la pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato prima dei suoi plugin esternalizzati.
- I controlli di release ora vengono eseguiti in un workflow manuale separato: `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo Matrix live veloce e la lane QA Telegram prima dell’approvazione della release. Le lane live usano l’ambiente `qa-live-shared`; Telegram usa anche i lease delle credenziali Convex CI. Esegui il workflow manuale `QA-Lab - All Lanes` con `matrix_profile=all` e `matrix_shards=true` quando vuoi l’inventario completo di trasporto, media ed E2EE Matrix in parallelo.
- La convalida runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il workflow riutilizzabile `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il percorso reale di release npm breve, deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella propria lane, così non rallentano né bloccano la pubblicazione
- I controlli di release che contengono segreti devono essere inviati tramite `Full Release Validation` o dal workflow ref `main`/release, così la logica del workflow e i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA completo di commit purché il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di release
- Il preflight solo di convalida `OpenClaw NPM Release` accetta anche lo SHA completo a 40 caratteri del commit corrente del branch del workflow senza richiedere un tag inviato
- Quel percorso SHA è solo di convalida e non può essere promosso in una pubblicazione reale
- In modalità SHA, il workflow sintetizza `v<package.json version>` solo per il controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di release
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner ospitati da GitHub, mentre il percorso di convalida non mutante può usare i runner Linux Blacksmith più grandi
- Quel workflow esegue `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando entrambi i segreti di workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di release npm non attende più la lane separata dei controlli di release
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (o il tag beta/correzione corrispondente) prima dell’approvazione
- Dopo la pubblicazione npm, esegui `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (o la versione beta/correzione corrispondente) per verificare il percorso di installazione del registro pubblicato in un prefisso temporaneo fresco
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` per verificare onboarding del pacchetto installato, configurazione Telegram e vero Telegram E2E contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease. Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta post-pubblicazione completo da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L’helper esegue la convalida npm update/fresh-target Parallels, invia `NPM Telegram Beta E2E`, monitora l’esecuzione esatta del workflow, scarica l’artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e non viene eseguito a ogni merge.
- L’automazione di release dei maintainer ora usa preflight-poi-promozione:
  - la pubblicazione reale npm deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione reale npm deve essere inviata dallo stesso branch `main` o `release/YYYY.M.D` dell’esecuzione preflight riuscita
  - le release npm stabili usano come default `beta`
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione npm dist-tag basata su token ora vive in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di convalida; quando un tag vive solo su un branch di release ma il workflow viene inviato da `main`, imposta `public_release_branch=release/YYYY.M.D`
  - la pubblicazione reale privata mac deve superare un `preflight_run_id` e un `validate_run_id` mac privati riusciti
  - i percorsi reali di pubblicazione promuovono artefatti preparati invece di ricostruirli di nuovo
- Per release stabili di correzione come `YYYY.M.D-N`, il verificatore post-pubblicazione controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`, così le correzioni di release non possono lasciare silenziosamente le installazioni globali precedenti sul payload stabile di base
- Il preflight di release npm fallisce in modo chiuso a meno che il tarball includa sia `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`, così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei plugin pubblicati e i metadati dei pacchetti siano presenti nel layout del registro installato. Una release che distribuisce payload runtime dei plugin mancanti fallisce il verificatore postpublish e non può essere promossa a `latest`.
- `pnpm test:install:smoke` applica anche il budget npm pack `unpackedSize` sul tarball di aggiornamento candidato, così l’e2e dell’installer intercetta gonfiori accidentali del pacchetto prima del percorso di pubblicazione della release
- Se il lavoro di release ha toccato la pianificazione CI, i manifest di timing delle estensioni o le matrici di test delle estensioni, rigenera e rivedi gli output della matrice `plugin-prerelease-extension-shard` di proprietà del planner da `.github/workflows/plugin-prerelease.yml` prima dell’approvazione, così le note di release non descrivono un layout CI obsoleto
- La prontezza della release macOS stabile include anche le superfici dell’updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione
  - l’app pacchettizzata deve mantenere un bundle id non debug, un URL del feed Sparkle non vuoto e un `CFBundleVersion` pari o superiore al floor canonico di build Sparkle per quella versione di release

## Test box di release

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-release da un unico entrypoint. Per una prova di commit fissato su un branch che si muove rapidamente, usa l’helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L’helper invia `release-ci/<sha>-...`, invia `Full Release Validation` da quel branch con `ref=<sha>`, verifica che ogni `headSha` del workflow figlio corrisponda al target, quindi elimina il branch temporaneo. Questo evita di provare per errore un’esecuzione figlia di `main` più nuova.

Per la convalida di branch o tag di release, eseguila dal workflow ref attendibile `main` e passa il branch o tag di release come `ref`:

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
artefatto padre `release-package-under-test` per i controlli rivolti al pacchetto ed
esegue il dispatch dell'E2E Telegram del pacchetto standalone quando `release_profile=full` con
`rerun_group=all` o quando `npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di release cross-OS, copertura live/E2E Docker
del percorso di release quando il soak è abilitato, Package Acceptance con QA del pacchetto Telegram,
parità QA Lab, Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il
riepilogo di `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il child `npm_telegram` deve riuscire; fuori da full/all viene saltato
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il riepilogo finale del
verificatore include tabelle dei job più lenti per ogni esecuzione child, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
Vedi [Validazione completa della release](/it/reference/full-release-validation) per la
matrice completa degli stage, i nomi esatti dei job del workflow, le differenze tra profilo stabile e completo,
gli artefatti e gli handle di rerun mirati.
I workflow child vengono eseguiti dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch o tag di release precedente. Non esiste un input separato per il ref del workflow Full Release Validation;
scegli l'harness attendibile scegliendo il ref dell'esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per prove di commit esatte su `main` mobile;
gli SHA grezzi dei commit non possono essere ref di workflow dispatch, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo fissato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker più rapido e critico per la release
- `stable`: minimum più copertura stabile di provider/backend per l'approvazione della release
- `full`: stable più ampia copertura advisory di provider/media

Usa `run_release_soak=true` con `stable` quando le lane bloccanti per la release sono
verdi e vuoi lo sweep esaustivo live/E2E, del percorso di release Docker e
all-since-2026.4.23 upgrade-survivor prima della promozione. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere una volta il ref di destinazione
come `release-package-under-test` e riutilizza quell'artefatto nei controlli cross-OS,
Package Acceptance e Docker del percorso di release quando il soak viene eseguito. Questo mantiene
tutte le box rivolte al pacchetto sugli stessi byte ed evita build ripetute del pacchetto.
L'install smoke cross-OS OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane sta
dimostrando installazione del pacchetto, onboarding, avvio del gateway e un turno live dell'agente
invece di fare benchmark del modello predefinito più lento. La matrice live provider
più ampia resta il luogo per la copertura specifica per modello.

Usa queste varianti a seconda dello stage della release:

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
fallisce, usa il workflow child, il job, la lane Docker, il profilo pacchetto, il provider
del modello o la lane QA falliti per la prova successiva. Esegui di nuovo l'ombrello completo solo quando
la correzione ha modificato l'orchestrazione condivisa della release o ha reso obsolete le prove precedenti
di tutte le box. Il verificatore finale dell'ombrello ricontrolla gli ID registrati delle esecuzioni dei workflow
child, quindi dopo che un workflow child viene rieseguito con successo, riesegui solo il job padre
`Verify full validation` fallito.

Per un recupero limitato, passa `rerun_group` all'ombrello. `all` è la vera
esecuzione del candidato di release, `ci` esegue solo il child CI normale, `plugin-prerelease`
esegue solo il child Plugin solo release, `release-checks` esegue ogni box di release,
e i gruppi di release più ristretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
I rerun mirati di `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l'artefatto pacchetto dei release-checks. I rerun
cross-OS mirati possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti QA dei release-check sono advisory; un fallimento solo QA
non blocca la validazione della release.

### Vitest

La box Vitest è il workflow child manuale `CI`. La CI manuale
bypassa intenzionalmente lo scoping delle modifiche e forza il grafo di test normale per il candidato
di release: shard Linux Node, shard dei bundled Plugin, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows,
macOS, Android e i18n della Control UI.

Usa questa box per rispondere a "l'albero sorgente ha superato la suite di test normale completa?"
Non è la stessa cosa della validazione del prodotto nel percorso di release. Prove da conservare:

- riepilogo di `Full Release Validation` che mostra l'URL dell'esecuzione `CI` inviata
- esecuzione `CI` verde sullo SHA esatto di destinazione
- nomi degli shard falliti o lenti dai job CI quando si indagano regressioni
- artefatti dei tempi Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui direttamente la CI manuale solo quando la release richiede CI normale deterministica ma
non le box Docker, QA Lab, live, cross-OS o pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La box Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow
`install-smoke` in modalità release. Valida il candidato di release tramite ambienti Docker
pacchettizzati invece che solo test a livello sorgente.

La copertura Docker della release include:

- install smoke completo con lo slow smoke di installazione globale Bun abilitato
- preparazione/riuso dell'immagine smoke del Dockerfile root per SHA di destinazione, con job QR,
  root/gateway e installer/Bun smoke eseguiti come shard install-smoke separati
- lane E2E del repository
- chunk Docker del percorso di release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- copertura OpenWebUI dentro il chunk `plugins-runtime-services` quando richiesta
- lane divise di installazione/disinstallazione dei bundled Plugin
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite live/E2E dei provider e copertura del modello live Docker quando i controlli di release
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di release carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
tempi delle fasi, JSON del piano dello scheduler e comandi di rerun. Per recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow riutilizzabile live/E2E invece di
rieseguire tutti i chunk di release. I comandi di rerun generati includono il precedente
`package_artifact_run_id` e gli input dell'immagine Docker preparata quando disponibili, così una
lane fallita può riutilizzare lo stesso tarball e le immagini GHCR.

### QA Lab

La box QA Lab fa anch'essa parte di `OpenClaw Release Checks`. È il gate di release
del comportamento agentico e a livello di canale, separato da Vitest e dai meccanismi
dei pacchetti Docker.

La copertura QA Lab della release include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pack di parità agentica
- profilo QA Matrix live rapido usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease delle credenziali Convex CI
- `pnpm qa:otel:smoke` quando la telemetria di release richiede prova locale esplicita

Usa questa box per rispondere a "la release si comporta correttamente negli scenari QA e
nei flussi di canali live?" Conserva gli URL degli artefatti per le lane parità, Matrix e Telegram
quando approvi la release. La copertura Matrix completa resta disponibile come
esecuzione QA-Lab manuale sharded invece che come lane predefinita critica per la release.

### Pacchetto

La box Package è il gate del prodotto installabile. È supportata da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, valida
l'inventario del pacchetto, registra la versione del pacchetto e lo SHA-256, e mantiene
il ref dell'harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di release OpenClaw
- `source=ref`: impacchetta un branch, tag o SHA completo di commit `package_ref` attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` obbligatorio
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto
preparato del pacchetto di release, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, aggiornamento, pulizia delle
dipendenze Plugin obsolete, fixture Plugin offline, aggiornamento Plugin e QA del pacchetto Telegram
contro lo stesso tarball risolto. I controlli bloccanti per la release usano la baseline
del pacchetto pubblicato latest predefinita; `run_release_soak=true` o
`release_profile=full` espande a ogni baseline stabile pubblicata su npm da
`2026.4.23` fino a `latest` più le fixture dei problemi segnalati. Usa
Package Acceptance con `source=npm` per un candidato già rilasciato, oppure
`source=ref`/`source=artifact` per un tarball npm locale basato su SHA prima della
pubblicazione. È il sostituto nativo GitHub per la maggior parte della copertura
package/update che in precedenza richiedeva Parallels. I controlli di release cross-OS
restano importanti per onboarding, installer e comportamento della piattaforma specifici dell'OS,
ma la validazione del prodotto package/update dovrebbe preferire Package Acceptance.

La checklist canonica per la validazione di aggiornamenti e Plugin è
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o release-check dimostra una
modifica di installazione/aggiornamento Plugin, pulizia doctor o migrazione di pacchetto pubblicato.
La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale separato `Update Migration`, non parte della Full Release CI.

La tolleranza legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per gap di metadati già pubblicati
su npm: voci di inventario QA private mancanti dal tarball, `gateway install --wrapper`
mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel`
persistito mancante, posizioni legacy dei record di installazione Plugin,
persistenza mancante dei record di installazione marketplace e migrazione dei metadati
di configurazione durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può emettere warning
per file di stamp dei metadati di build locali già rilasciati. I pacchetti successivi
devono soddisfare i contratti moderni del pacchetto; quegli stessi gap fanno fallire la validazione
della release.

Usa profili Package Acceptance più ampi quando la domanda sulla release riguarda un
pacchetto installabile effettivo:

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

- `smoke`: corsie rapide di installazione pacchetto/canale/agente, rete del gateway e ricaricamento
  della configurazione
- `package`: contratti di installazione/aggiornamento/pacchetto Plugin senza ClawHub live; questo è il valore
  predefinito dei controlli di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagente, ricerca web OpenAI
  e OpenWebUI
- `full`: blocchi del percorso di rilascio Docker con OpenWebUI
- `custom`: elenco esatto di `docker_lanes` per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` in Package Acceptance. Il flusso di lavoro passa il
tarball `package-under-test` risolto alla corsia Telegram; il flusso di lavoro
Telegram autonomo accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione della pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Orquestra
i flussi di lavoro del trusted publisher nell'ordine richiesto dal rilascio:

1. Esegue il checkout del tag di rilascio e ne risolve lo SHA del commit.
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

Usa i flussi di lavoro di livello inferiore `Plugin NPM Release` e `Plugin ClawHub Release`
solo per interventi mirati di riparazione o ripubblicazione. Per una riparazione di Plugin selezionata, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure avvia direttamente il flusso di lavoro figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del flusso di lavoro NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA del commit
  completo di 40 caratteri del ramo del flusso di lavoro corrente per il preflight di sola validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il flusso di lavoro riutilizza
  il tarball preparato dall'esecuzione di preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; il valore predefinito è `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve già esistere
- `preflight_run_id`: id dell'esecuzione di preflight riuscita di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: il valore predefinito è `all-publishable`; usa `selected` solo
  per interventi mirati di riparazione
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: il valore predefinito è `true`; imposta `false` solo quando usi il
  flusso di lavoro come orchestratore di riparazione solo Plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: ramo, tag o SHA del commit completo da validare. I controlli che usano segreti
  richiedono che il commit risolto sia raggiungibile da un ramo OpenClaw o da un
  tag di rilascio.
- `run_release_soak`: abilita il soak esaustivo live/E2E, del percorso di rilascio Docker e
  dell'upgrade-survivor all-since nei controlli di rilascio stabili/predefiniti. Viene forzato
  da `release_profile=full`.

Regole:

- I tag stabili e di correzione possono pubblicare su `beta` o `latest`
- I tag di prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA del commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il flusso di lavoro verifica quei metadati prima che la pubblicazione continui

## Sequenza di rilascio npm stabile

Quando si prepara un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA del commit completo del ramo del flusso di lavoro
     corrente per una prova a secco di sola validazione del flusso di lavoro di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul ramo di rilascio, sul tag di rilascio o sullo SHA
   del commit completo quando vuoi CI normale più copertura live della cache dei prompt, Docker, QA Lab,
   Matrix e Telegram da un solo flusso di lavoro manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece il
   flusso di lavoro manuale `CI` sul riferimento di rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i Plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se il rilascio è arrivato su `beta`, usa il flusso di lavoro privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se il rilascio è stato pubblicato intenzionalmente direttamente su `latest` e `beta`
   deve seguire immediatamente la stessa build stabile, usa lo stesso flusso di lavoro privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   pianificata di auto-riparazione sposti `beta` più tardi

La mutazione del dist-tag vive nel repo privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretto sia il percorso di promozione beta-first
documentati e visibili all'operatore.

Se un maintainer deve ricorrere all'autenticazione npm locale, esegui qualsiasi comando CLI
1Password (`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; mantenerlo dentro tmux rende prompt,
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

I maintainer usano la documentazione privata dei rilasci in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.

## Correlati

- [Canali di rilascio](/it/install/development-channels)
