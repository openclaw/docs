---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida del rilascio o dell'accettazione del pacchetto
    - Cerchi la nomenclatura e la cadenza delle versioni
summary: Corsie di rilascio, checklist dell'operatore, box di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-06T18:00:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stabile: rilasci con tag che pubblicano su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag di pre-rilascio che pubblicano su npm `beta`
- dev: la punta mobile di `main`

## Nomenclatura delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttiva stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di pre-rilascio beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali al mese o al giorno
- `latest` indica l'attuale rilascio stabile npm promosso
- `beta` indica l'attuale destinazione di installazione beta
- I rilasci stabili e correttivi stabili pubblicano su npm `beta` per impostazione predefinita; gli operatori del rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app Mac riservati allo stabile salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Lo stabile segue solo dopo la convalida dell'ultima beta
- I maintainer normalmente preparano i rilasci da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la convalida del rilascio e le correzioni non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e necessita di una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- Procedura di rilascio dettagliata, approvazioni, credenziali e note di recupero sono
  riservate ai maintainer

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, recupero dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall'attuale `main`: scarica l'ultima versione, conferma che il commit di destinazione sia stato inviato,
   e conferma che la CI dell'attuale `main` sia abbastanza verde per creare un branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate agli utenti, committala, inviala e fai rebase/pull
   ancora una volta prima di creare il branch.
3. Rivedi i record di compatibilità del rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.D` dall'attuale `main`; non fare il normale lavoro di rilascio
   direttamente su `main`.
5. Incrementa ogni posizione di versione richiesta per il tag previsto, esegui
   `pnpm plugins:sync` in modo che i pacchetti Plugin pubblicabili condividano la versione di rilascio
   e i metadati di compatibilità, quindi esegui la preflight deterministica locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   per la preflight di sola convalida è consentito uno SHA completo a 40 caratteri del branch di rilascio.
   Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test di pre-rilascio con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per le quattro grandi caselle di test del rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio e riesegui il file, il canale,
   il job di workflow, il profilo del pacchetto, il provider o l'allowlist di modelli più piccoli che
   dimostrano la correzione. Riesegui l'ombrello completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per la beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   invia tutti i pacchetti Plugin pubblicabili a npm e lo stesso insieme a
   ClawHub in parallelo, quindi promuove l'artefatto di preflight npm OpenClaw preparato
   con il dist-tag corrispondente non appena la pubblicazione npm dei Plugin riesce.
   La pubblicazione su ClawHub può essere ancora in corso mentre OpenClaw npm viene pubblicato, ma il
   workflow di pubblicazione del rilascio non termina finché entrambi i percorsi di pubblicazione dei Plugin e
   il percorso di pubblicazione npm di OpenClaw non sono stati completati con successo. Dopo la pubblicazione, esegui
   l'accettazione del pacchetto post-pubblicazione contro il pacchetto pubblicato
   `openclaw@YYYY.M.D-beta.N` o `openclaw@beta`. Se un pre-rilascio inviato o pubblicato necessita di una correzione,
   crea il numero di pre-rilascio corrispondente successivo; non eliminare né riscrivere il vecchio
   pre-rilascio.
10. Per lo stabile, continua solo dopo che la beta verificata o il candidato al rilascio dispone delle
    prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso
    `OpenClaw Release Publish`, riutilizzando l'artefatto di preflight riuscito tramite
    `preflight_run_id`; la preparazione del rilascio macOS stabile richiede anche
    `.zip`, `.dmg`, `.dSYM.zip` confezionati e `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram standalone
    opzionale su npm pubblicato quando ti serve una prova del canale post-pubblicazione,
    la promozione del dist-tag quando necessario, le note di rilascio/pre-rilascio GitHub dalla
    sezione `CHANGELOG.md` corrispondente completa e i passaggi di annuncio del rilascio.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight di release, così il TypeScript dei test resta
  coperto fuori dal gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di release, così i controlli più ampi sui cicli di import
  e sui confini architetturali sono verdi fuori dal gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di release
  `dist/*` previsti e il bundle della Control UI esistono per il passaggio di validazione
  del pack
- Esegui `pnpm plugins:sync` dopo l’incremento della versione root e prima del tagging. Aggiorna
  le versioni dei pacchetti Plugin pubblicabili, i metadati di compatibilità
  peer/API di OpenClaw, i metadati di build e gli stub dei changelog dei Plugin in modo che corrispondano alla versione
  della release core. `pnpm plugins:sync:check` è la protezione di release non mutante;
  il workflow di pubblicazione fallisce prima di qualsiasi mutazione del registro se questo passaggio è stato
  dimenticato.
- Esegui il workflow manuale `Full Release Validation` prima dell’approvazione della release per
  avviare tutti i test box pre-release da un unico entrypoint. Accetta un branch,
  un tag o uno SHA di commit completo, invia manualmente `CI` e invia
  `OpenClaw Release Checks` per smoke di installazione, accettazione pacchetto, controlli pacchetto
  cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili/predefinite
  mantengono il soak live/E2E esaustivo e del percorso di release Docker dietro
  `run_release_soak=true`; `release_profile=full` forza il soak. Con
  `release_profile=full` e `rerun_group=all`, esegue anche l’E2E Telegram del pacchetto
  contro l’artefatto `release-package-under-test` dai controlli di release.
  Fornisci `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso
  E2E Telegram deve provare anche il pacchetto npm pubblicato. Fornisci
  `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance
  deve eseguire la sua matrice package/update contro il pacchetto npm distribuito invece
  dell’artefatto costruito dallo SHA. Fornisci
  `evidence_package_spec` quando il report di evidenza privato deve provare che la
  validazione corrisponde a un pacchetto npm pubblicato senza forzare l’E2E Telegram.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel
  per un candidato pacchetto mentre il lavoro di release continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di release esatta; `source=ref`
  per creare un pack da un branch/tag/SHA `package_ref` attendibile con l’harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256
  obbligatorio; oppure `source=artifact` per un tarball caricato da un’altra esecuzione
  GitHub Actions. Il workflow risolve il candidato in
  `package-under-test`, riusa lo scheduler di release Docker E2E contro quel
  tarball e può eseguire la QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le
  lane Docker selezionate includono `published-upgrade-survivor`, l’artefatto
  del pacchetto è il candidato e `published_upgrade_survivor_baseline` seleziona
  la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato come
  CLI installata e come package-under-test, così esercita il percorso di riavvio
  gestito del comando di aggiornamento del candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane installazione/canale/agente, rete Gateway e ricaricamento configurazione
  - `package`: lane package/update/restart/plugin native dell’artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagente,
    ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di release Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura CI normale
  completa per il candidato di release. Gli invii manuali di CI bypassano lo
  scoping delle modifiche e forzano gli shard Linux Node, gli shard dei Plugin
  inclusi, i contratti canale, la compatibilità Node 22, `check`, `check-additional`, smoke di build,
  controlli docs, Skills Python, Windows, macOS, Android e le lane i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando validi la telemetria di release. Esercita
  QA-lab attraverso un ricevitore OTLP/HTTP locale e verifica i nomi degli span
  di trace esportati, gli attributi limitati e la redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni release taggata
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Avvialo da `release/YYYY.M.D` (o da `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di release e il `preflight_run_id`
  npm OpenClaw riuscito, e mantieni lo scope predefinito di pubblicazione dei Plugin
  `all-publishable` a meno che tu non stia eseguendo deliberatamente una riparazione mirata. Il
  workflow serializza la pubblicazione npm dei Plugin, la pubblicazione ClawHub dei Plugin e la pubblicazione
  npm di OpenClaw, così il pacchetto core non viene pubblicato prima dei suoi Plugin
  esternalizzati.
- I controlli di release ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo
  Matrix live veloce e la lane QA Telegram prima dell’approvazione della release. Le lane live
  usano l’ambiente `qa-live-shared`; Telegram usa anche lease di credenziali Convex CI.
  Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi l’inventario completo di trasporto
  Matrix, media ed E2EE in parallelo.
- La validazione runtime di installazione e upgrade cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente
  il workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa divisione è intenzionale: mantenere il percorso reale di release npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  lane così non rallentano né bloccano la pubblicazione
- I controlli di release con segreti devono essere avviati tramite `Full Release
Validation` o dal ref del workflow `main`/release, così la logica del workflow e i
  segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA di commit completo purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di release
- Anche il preflight solo di validazione `OpenClaw NPM Release` accetta lo SHA completo
  di 40 caratteri del commit del branch workflow corrente senza richiedere un tag inviato
- Quel percorso SHA è solo di validazione e non può essere promosso in una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un tag di release reale
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner
  ospitati da GitHub, mentre il percorso di validazione non mutante può usare i runner
  Blacksmith Linux più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di release npm non attende più la lane separata dei controlli di release
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell’approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione
  dal registro pubblicato in un nuovo prefisso temporaneo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare l’onboarding del pacchetto installato, la configurazione Telegram e l’E2E Telegram reale
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente le tre
  credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta post-pubblicazione completo da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L’helper esegue la validazione npm update/fresh-target su Parallels, avvia `NPM Telegram Beta E2E`, esegue il polling dell’esecuzione workflow esatta, scarica l’artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L’automazione di release dei maintainer ora usa preflight-poi-promote:
  - la pubblicazione npm reale deve passare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere avviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell’esecuzione preflight riuscita
  - le release npm stabili impostano per impostazione predefinita `beta`
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione npm dist-tag basata su token ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repo pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di validazione; quando un tag vive solo su un
    branch di release ma il workflow viene avviato da `main`, imposta
    `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve passare i `preflight_run_id` e
    `validate_run_id` mac privati riusciti
  - i percorsi di pubblicazione reale promuovono gli artefatti preparati invece di ricostruirli
    di nuovo
- Per release di correzione stabili come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di upgrade con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di release non possono lasciare silenziosamente installazioni globali più vecchie sul
  payload stabile di base
- Il preflight di release npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto,
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei Plugin pubblicati e
  i metadati dei pacchetti siano presenti nel layout del registro installato. Una release che
  distribuisce payload runtime dei Plugin mancanti fallisce il verificatore postpublish e
  non può essere promossa a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` del pack npm sul
  tarball candidato di aggiornamento, così l’e2e dell’installer intercetta un rigonfiamento accidentale del pack
  prima del percorso di pubblicazione della release
- Se il lavoro di release ha toccato la pianificazione CI, i manifest di timing delle estensioni o
  le matrici di test delle estensioni, rigenera e rivedi gli output della matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell’approvazione, così le note di release non
  descrivono un layout CI obsoleto
- La prontezza della release macOS stabile include anche le superfici dell’updater:
  - la release GitHub deve finire con i `.zip`, `.dmg` e `.dSYM.zip` pacchettizzati
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione
  - l’app pacchettizzata deve mantenere un bundle id non di debug, un URL del feed Sparkle
    non vuoto e un `CFBundleVersion` uguale o superiore al floor canonico di build Sparkle
    per quella versione di release

## Test box di release

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-release da
un unico entrypoint. Per una prova su commit fissato in un branch che si muove velocemente, usa
l’helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L’helper esegue il push di `release-ci/<sha>-...`, avvia `Full Release Validation`
da quel branch con `ref=<sha>`, verifica che ogni `headSha` dei workflow figli
corrisponda al target, poi elimina il branch temporaneo. Questo evita di provare per errore
un’esecuzione figlia più recente di `main`.

Per la validazione di branch o tag di release, eseguila dal ref workflow `main` attendibile
e passa il branch o tag di release come `ref`:

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
artefatto padre `release-package-under-test` per i controlli rivolti ai pacchetti, ed
esegue il dispatch dell'E2E Telegram standalone del pacchetto quando `release_profile=full` con
`rerun_group=all` o quando `npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di release cross-OS, copertura live/E2E Docker
del percorso di release quando il soak è abilitato, Package Acceptance con QA del pacchetto Telegram,
parità QA Lab, Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il
riepilogo di `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve essere riuscito; fuori da full/all viene saltato
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il riepilogo
finale del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
Vedi [Validazione completa della release](/it/reference/full-release-validation) per la
matrice completa degli stadi, i nomi esatti dei job del workflow, le differenze tra profilo stable e full,
gli artefatti e gli handle di riesecuzione mirati.
I workflow figli vengono eseguiti dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch o tag di release più vecchio. Non esiste un input separato per il workflow-ref di Full Release Validation;
scegli l'harness attendibile scegliendo il ref di esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per la prova di commit esatto su `main` in movimento;
gli SHA di commit grezzi non possono essere ref di dispatch del workflow, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo bloccato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker critico per la release più veloce
- `stable`: minimum più copertura stabile di provider/backend per l'approvazione della release
- `full`: stable più ampia copertura consultiva provider/media

Usa `run_release_soak=true` con `stable` quando le lane bloccanti per la release sono
verdi e vuoi lo sweep esaustivo live/E2E, del percorso di release Docker e
limitato di upgrade-survivor pubblicati prima della promozione. Quello sweep copre
gli ultimi quattro pacchetti stable più le baseline bloccate `2026.4.23` e `2026.5.2`
più la copertura più vecchia `2026.4.15`, con baseline duplicate rimosse e
ogni baseline suddivisa nel proprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa il ref attendibile del workflow per risolvere il ref di destinazione
una sola volta come `release-package-under-test` e riusa quell'artefatto nei controlli cross-OS,
Package Acceptance e Docker del percorso di release quando il soak viene eseguito. Questo mantiene
tutti gli ambienti rivolti ai pacchetti sugli stessi byte ed evita build ripetute del pacchetto.
L'install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane sta
dimostrando installazione del pacchetto, onboarding, avvio del Gateway e un turno live dell'agente
anziché misurare il modello predefinito più lento. La matrice live più ampia dei provider
rimane il luogo per la copertura specifica del modello.

Usa queste varianti in base allo stadio della release:

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
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo pacchetto, il provider
del modello o la lane QA falliti per la prova successiva. Esegui di nuovo l'umbrella completa solo quando
la correzione ha modificato l'orchestrazione condivisa della release o ha reso obsolete le prove precedenti
su tutti gli ambienti. Il verificatore finale dell'umbrella ricontrolla gli id delle esecuzioni dei workflow figli
registrati, quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre
`Verify full validation` fallito.

Per il recupero limitato, passa `rerun_group` all'umbrella. `all` è la vera
esecuzione del release candidate, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio Plugin solo-release, `release-checks` esegue ogni ambiente di release,
e i gruppi di release più ristretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate di `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l'artefatto pacchetto di release-checks. Le riesecuzioni
cross-OS mirate possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti QA di release-check sono consultivi; un fallimento solo QA
non blocca la validazione della release.

### Vitest

L'ambiente Vitest è il workflow figlio manuale `CI`. La CI manuale intenzionalmente
aggira lo scoping delle modifiche e forza il normale grafo di test per il release
candidate: shard Linux Node, shard dei Plugin in bundle, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS, Android e Control UI i18n.

Usa questo ambiente per rispondere a "l'albero sorgente ha superato l'intera suite di test normale?"
Non è la stessa cosa della validazione prodotto del percorso di release. Prove da conservare:

- riepilogo di `Full Release Validation` che mostra l'URL dell'esecuzione `CI` inviata
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi di shard falliti o lenti dai job CI quando si indagano regressioni
- artefatti di timing Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui la CI manuale direttamente solo quando la release richiede una CI normale deterministica ma
non gli ambienti Docker, QA Lab, live, cross-OS o pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

L'ambiente Docker vive in `OpenClaw Release Checks` attraverso
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow
`install-smoke` in modalità release. Valida il release candidate tramite ambienti
Docker pacchettizzati anziché solo test a livello di sorgente.

La copertura Docker della release include:

- install smoke completo con lo smoke lento dell'installazione globale Bun abilitato
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
- lane divise di installazione/disinstallazione dei Plugin in bundle
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura del modello live Docker quando i controlli di release
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di release carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
timing delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow live/E2E riutilizzabile invece di
rieseguire tutti i chunk di release. I comandi di riesecuzione generati includono il precedente
`package_artifact_run_id` e gli input dell'immagine Docker preparata quando disponibili, così una
lane fallita può riusare lo stesso tarball e le stesse immagini GHCR.

### QA Lab

L'ambiente QA Lab fa anch'esso parte di `OpenClaw Release Checks`. È il gate di release
del comportamento agentico e a livello di canale, separato da Vitest e dalla meccanica
dei pacchetti Docker.

La copertura QA Lab della release include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live veloce usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease di credenziali Convex CI
- `pnpm qa:otel:smoke` quando la telemetria di release richiede prova locale esplicita

Usa questo ambiente per rispondere a "la release si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artefatti per le lane di parità, Matrix e Telegram
quando approvi la release. La copertura Matrix completa rimane disponibile come
esecuzione QA-Lab manuale shardata anziché come lane predefinita critica per la release.

### Pacchetto

L'ambiente Pacchetto è il gate del prodotto installabile. È supportato da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidate nel tarball `package-under-test` consumato da Docker E2E, valida
l'inventario del pacchetto, registra la versione del pacchetto e lo SHA-256 e mantiene
il ref dell'harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di release OpenClaw
- `source=ref`: pacchettizza un branch, tag o SHA di commit completo `package_ref` attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` obbligatorio
- `source=artifact`: riusa un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`,
l'artefatto pacchetto di release preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, update,
riavvio dopo update con auth configurata, pulizia di dipendenze stale dei Plugin, fixture di Plugin offline,
update dei Plugin e QA del pacchetto Telegram contro lo stesso tarball risolto. I controlli bloccanti di release usano
la baseline predefinita dell'ultimo pacchetto pubblicato; `run_release_soak=true` o
`release_profile=full` espande a ogni baseline stable pubblicata su npm da
`2026.4.23` fino a `latest` più le fixture di issue segnalate. Usa
Package Acceptance con `source=npm` per un candidate già spedito, oppure
`source=ref`/`source=artifact` per un tarball npm locale basato su SHA prima della
pubblicazione. È il sostituto nativo GitHub
per la maggior parte della copertura package/update che prima richiedeva
Parallels. I controlli di release cross-OS restano importanti per onboarding,
installer e comportamento di piattaforma specifici per OS, ma la validazione prodotto di package/update dovrebbe
preferire Package Acceptance.

La checklist canonica per la validazione di update e Plugin è
[Test di update e Plugin](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o release-check dimostra una
installazione/update di Plugin, pulizia doctor o modifica di migrazione di pacchetto pubblicato.
La migrazione esaustiva degli update pubblicati da ogni pacchetto stable `2026.4.23+` è
un workflow manuale `Update Migration` separato, non parte della Full Release CI.

La tolleranza legacy per l'accettazione dei pacchetti è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci private dell'inventario QA mancanti dal tarball, `gateway install --wrapper`
mancante, file patch mancanti nella fixture git derivata dal tarball,
`update.channel` persistito mancante, posizioni legacy dei record di installazione dei Plugin,
persistenza mancante dei record di installazione del marketplace, e migrazione dei metadati
di configurazione durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può emettere
avvisi per file di timbro dei metadati di build locali che erano già stati distribuiti. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; le stesse lacune fanno fallire la
validazione del rilascio.

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

- `smoke`: corsie rapide di installazione pacchetto/canale/agente, rete Gateway e ricaricamento
  della configurazione
- `package`: contratti di installazione/aggiornamento/riavvio/pacchetto Plugin senza
  ClawHub live; questo è il valore predefinito del controllo di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI
  e OpenWebUI
- `full`: blocchi del percorso di rilascio Docker con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram di un candidato pacchetto, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` in Package Acceptance. Il workflow passa il tarball
risolto `package-under-test` nella corsia Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione della pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Orchestra
i workflow trusted-publisher nell'ordine richiesto dal rilascio:

1. Esegue il checkout del tag di rilascio e ne risolve lo SHA del commit.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegue `pnpm plugins:sync:check`.
4. Avvia `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Avvia `Plugin ClawHub Release` con lo stesso scope e SHA.
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
solo per lavori mirati di riparazione o ripubblicazione. Per una riparazione di Plugin selezionato, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure avvia direttamente il workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio, ad esempio `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA di commit
  completo di 40 caratteri del branch del workflow corrente per un preflight di sola validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il workflow riusa
  il tarball preparato dalla riuscita esecuzione di preflight
- `npm_dist_tag`: tag di destinazione npm per il percorso di pubblicazione; predefinito `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve già esistere
- `preflight_run_id`: id di esecuzione preflight riuscita di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag di destinazione npm per il pacchetto OpenClaw
- `plugin_publish_scope`: predefinito `all-publishable`; usa `selected` solo
  per lavori mirati di riparazione
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: predefinito `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione solo Plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o SHA di commit completo da validare. I controlli che contengono segreti
  richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un
  tag di rilascio.
- `run_release_soak`: abilita soak esaustivo live/E2E, percorso di rilascio Docker e
  upgrade-survivor all-since nei controlli di rilascio stabile/predefinito. È forzato
  da `release_profile=full`.

Regole:

- I tag stabili e di correzione possono pubblicare su `beta` o `latest`
- I tag prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA di commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima che la pubblicazione continui

## Sequenza di rilascio npm stabile

Quando prepari un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA di commit completo del branch del workflow corrente
     per una prova a secco di sola validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul branch di rilascio, sul tag di rilascio o sullo SHA
   di commit completo quando vuoi CI normale più copertura live prompt cache, Docker, QA Lab,
   Matrix e Telegram da un unico workflow manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sul ref di rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i Plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se il rilascio è arrivato su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se il rilascio è stato pubblicato intenzionalmente direttamente su `latest` e `beta`
   deve seguire subito la stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   programmata di self-healing sposti `beta` in seguito

La mutazione dei dist-tag risiede nel repository privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repository pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili all'operatore.

Se un maintainer deve ripiegare sull'autenticazione npm locale, esegui qualunque comando della
CLI 1Password (`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; tenerlo dentro tmux rende prompt,
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
