---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della validazione della release o dell'accettazione del pacchetto
    - Cerchi la denominazione e la cadenza delle versioni
summary: Canali di rilascio, checklist dell'operatore, ambienti di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-03T21:43:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: rilasci con tag che pubblicano su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di pre-release che pubblicano su npm `beta`
- dev: la testa mobile di `main`

## Denominazione delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttivo stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di pre-release beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica il rilascio npm stabile attualmente promosso
- `beta` indica la destinazione di installazione beta corrente
- I rilasci stabili e correttivi stabili pubblicano su npm `beta` per impostazione predefinita; gli operatori del rilascio possono scegliere esplicitamente `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app Mac riservate allo stabile salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima dalla beta
- Lo stabile segue solo dopo che l'ultima beta è stata convalidata
- I maintainer normalmente preparano i rilasci da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la convalida e le correzioni del rilascio non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura di rilascio dettagliata, le approvazioni, le credenziali e le note di recupero sono
  riservate ai maintainer

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, recupero dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall'attuale `main`: recupera gli ultimi aggiornamenti, conferma che il commit di destinazione sia stato inviato,
   e conferma che la CI dell'attuale `main` sia sufficientemente verde per creare un branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate agli utenti, esegui il commit, invialo, ed esegui rebase/pull
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
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, e
   `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   uno SHA completo di 40 caratteri del branch di rilascio è consentito solo per la convalida
   preflight. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-release con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per i quattro grandi ambienti di test di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio e riesegui il file,
   canale, job del workflow, profilo di pacchetto, provider o allowlist di modelli fallito più piccolo che
   dimostri la correzione. Riesegui l'ombrello completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   pubblica prima su npm tutti i pacchetti Plugin pubblicabili, pubblica poi lo stesso
   insieme su ClawHub come tarball npm-pack ClawPack, quindi promuove l'artefatto
   preflight npm OpenClaw preparato con il dist-tag corrispondente. Dopo la
   pubblicazione, esegui l'accettazione del pacchetto post-pubblicazione
   rispetto al pacchetto `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta` pubblicato. Se una pre-release inviata o pubblicata richiede una correzione,
   crea il numero di pre-release corrispondente successivo; non eliminare o riscrivere la vecchia
   pre-release.
10. Per stabile, continua solo dopo che la beta verificata o il candidato di rilascio dispone delle
    prove di convalida richieste. Anche la pubblicazione npm stabile passa da
    `OpenClaw Release Publish`, riutilizzando l'artefatto preflight riuscito tramite
    `preflight_run_id`; la preparazione del rilascio macOS stabile richiede anche il
    `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram standalone
    opzionale su npm pubblicato quando serve prova del canale post-pubblicazione,
    la promozione del dist-tag quando necessario, le note di rilascio/pre-release GitHub dalla
    sezione completa corrispondente di `CHANGELOG.md`, e i passaggi di annuncio
    del rilascio.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così il TypeScript dei test resta
  coperto al di fuori del gate locale più rapido `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli più ampi sui cicli di
  import e sui confini architetturali sono verdi al di fuori del gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di rilascio
  `dist/*` attesi e il bundle della Control UI esistono per il passaggio di validazione
  del pacchetto
- Esegui `pnpm plugins:sync` dopo l'incremento della versione root e prima del tagging. Aggiorna
  le versioni dei pacchetti Plugin pubblicabili, i metadati di compatibilità peer/API di OpenClaw,
  i metadati di build e gli stub dei changelog dei Plugin in modo che corrispondano alla versione di rilascio
  core. `pnpm plugins:sync:check` è la guardia di rilascio non mutante;
  il workflow di pubblicazione fallisce prima di qualsiasi mutazione del registry se questo passaggio è stato
  dimenticato.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per
  avviare tutte le test box pre-rilascio da un unico punto di ingresso. Accetta un branch,
  un tag o uno SHA di commit completo, invia il `CI` manuale e invia
  `OpenClaw Release Checks` per install smoke, package acceptance, suite del percorso di rilascio Docker,
  live/E2E, OpenWebUI, parità QA Lab, Matrix e lane Telegram. Con
  `release_profile=full` e `rerun_group=all`, esegue anche il package
  Telegram E2E contro l'artefatto `release-package-under-test` dai controlli di rilascio.
  Fornisci `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso
  Telegram E2E deve provare anche il pacchetto npm pubblicato. Fornisci
  `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance
  deve eseguire la sua matrice package/update contro il pacchetto npm rilasciato invece
  dell'artefatto compilato dallo SHA. Fornisci
  `evidence_package_spec` quando il report di evidenza privato deve provare che la
  validazione corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova laterale
  per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref`
  per impacchettare un branch/tag/SHA `package_ref` attendibile con l'harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con un
  SHA-256 richiesto; oppure `source=artifact` per un tarball caricato da un'altra esecuzione di GitHub
  Actions. Il workflow risolve il candidato in
  `package-under-test`, riusa lo scheduler di rilascio Docker E2E contro quel
  tarball e può eseguire la QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le
  lane Docker selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto
  è il candidato e `published_upgrade_survivor_baseline` seleziona
  la baseline pubblicata.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane di installazione/canale/agent, rete Gateway e ricarica della configurazione
  - `package`: lane package/update/Plugin native dell'artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent,
    ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione focalizzata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura CI normale completa
  per il candidato di rilascio. Gli invii manuali CI bypassano lo scoping delle modifiche
  e forzano gli shard Linux Node, gli shard dei Plugin inclusi, i contratti dei canali,
  la compatibilità Node 22, `check`, `check-additional`, build smoke,
  controlli docs, Skills Python, Windows, macOS, Android e lane i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando validi la telemetria di rilascio. Esercita
  QA-lab attraverso un ricevitore OTLP/HTTP locale e verifica i nomi degli span di traccia
  esportati, gli attributi delimitati e la redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Invialo da `release/YYYY.M.D` (o da `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di rilascio e il `preflight_run_id`
  npm OpenClaw riuscito, e mantieni lo scope di pubblicazione Plugin predefinito
  `all-publishable` a meno che tu non stia eseguendo deliberatamente una riparazione mirata. Il
  workflow serializza la pubblicazione npm dei Plugin, la pubblicazione ClawHub dei Plugin e la pubblicazione npm di OpenClaw
  in modo che il pacchetto core non venga pubblicato prima dei suoi Plugin
  esternalizzati.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo Matrix
  live veloce e la lane QA Telegram prima dell'approvazione del rilascio. Le lane live
  usano l'ambiente `qa-live-shared`; Telegram usa anche i lease delle credenziali Convex CI.
  Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi l'inventario completo di trasporto Matrix,
  media ed E2EE in parallelo.
- La validazione runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente
  il workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il percorso di rilascio npm reale breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  lane, così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che contengono segreti devono essere inviati tramite `Full Release
Validation` o dal ref del workflow `main`/release, così la logica del workflow e
  i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA di commit completo purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Anche il preflight solo di validazione `OpenClaw NPM Release` accetta lo SHA corrente
  completo a 40 caratteri del commit del branch di workflow senza richiedere un tag pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una pubblicazione reale
- In modalità SHA, il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner ospitati da GitHub,
  mentre il percorso di validazione non mutante può usare i runner Linux Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti di workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight del rilascio npm non attende più la lane separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correction corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correction corrispondente) per verificare il percorso di installazione dal registry pubblicato
  in un nuovo prefisso temporaneo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare l'onboarding del pacchetto installato, la configurazione di Telegram e l'E2E Telegram reale
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente
  le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-poi-promozione:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere inviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - i rilasci npm stabili usano `beta` come predefinito
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione dei dist-tag npm basata su token ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repo pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di validazione; quando un tag vive solo su un
    branch di rilascio ma il workflow è inviato da `main`, imposta
    `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve superare `preflight_run_id` e `validate_run_id`
    mac privati riusciti
  - i percorsi di pubblicazione reali promuovono artefatti preparati invece di ricompilarli
    di nuovo
- Per i rilasci di correzione stabili come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di rilascio non possono lasciare silenziosamente le installazioni globali più vecchie sul
  payload stabile base
- Il preflight del rilascio npm fallisce in modalità chiusa a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`,
  così non pubblichiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei Plugin pubblicati e
  i metadati del pacchetto siano presenti nel layout del registry installato. Un rilascio che
  distribuisce payload runtime dei Plugin mancanti fallisce il verificatore postpublish e
  non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` del pack npm sul
  tarball candidato per l'aggiornamento, così l'e2e dell'installer intercetta il rigonfiamento accidentale del pacchetto
  prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest di timing delle estensioni o
  le matrici dei test delle estensioni, rigenera e rivedi gli output della matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di rilascio non
  descrivono un layout CI obsoleto
- La prontezza del rilascio macOS stabile include anche le superfici dell'updater:
  - la release GitHub deve finire con i `.zip`, `.dmg` e `.dSYM.zip` impacchettati
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione
  - l'app impacchettata deve mantenere un bundle id non di debug, un URL del feed Sparkle
    non vuoto e un `CFBundleVersion` pari o superiore al floor di build Sparkle canonico
    per quella versione di rilascio

## Test box di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da
un unico punto di ingresso. Per una prova con commit fissato su un branch in rapido movimento, usa
l'helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA
di destinazione:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper pusha `release-ci/<sha>-...`, invia `Full Release Validation`
da quel branch con `ref=<sha>`, verifica che ogni `headSha` dei workflow figli
corrisponda al target, quindi elimina il branch temporaneo. Questo evita di provare per errore
un'esecuzione figlia più recente di `main`.

Per la validazione di branch o tag di rilascio, eseguila dal ref workflow `main` attendibile
e passa il branch o tag di rilascio come `ref`:

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
`target_ref=<release-ref>`, avvia `OpenClaw Release Checks`, prepara un
artefatto padre `release-package-under-test` per i controlli rivolti ai pacchetti
e avvia il pacchetto Telegram E2E autonomo quando `release_profile=full` con
`rerun_group=all` oppure quando è impostato `npm_telegram_package_spec`.
`OpenClaw Release Checks` poi distribuisce install smoke, controlli di rilascio
cross-OS, copertura live/E2E Docker del percorso di rilascio, Package Acceptance
con QA del pacchetto Telegram, parità QA Lab, Matrix live e Telegram live.
Un’esecuzione completa è accettabile solo quando il riepilogo
`Full Release Validation` mostra `normal_ci` e `release_checks` come riusciti.
In modalità full/all, anche il figlio `npm_telegram` deve riuscire; fuori da
full/all viene saltato, a meno che non sia stato fornito un
`npm_telegram_package_spec` pubblicato. Il riepilogo finale del verificatore
include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico attuale senza scaricare i log.
Vedi [validazione completa del rilascio](/it/reference/full-release-validation) per
la matrice completa delle fasi, i nomi esatti dei job del workflow, le
differenze tra profilo stable e full, gli artefatti e gli handle di riesecuzione
mirati.
I workflow figli vengono avviati dal ref attendibile che esegue
`Full Release Validation`, normalmente `--ref main`, anche quando il `ref` di
destinazione punta a un branch o tag di rilascio precedente. Non esiste un input
separato per il ref del workflow Full Release Validation; scegli l’harness
attendibile scegliendo il ref di esecuzione del workflow. Non usare
`--ref main -f ref=<sha>` per la prova di un commit esatto su `main` in
movimento; gli SHA di commit grezzi non possono essere ref di dispatch del
workflow, quindi usa `pnpm ci:full-release --sha <sha>` per creare il branch
temporaneo fissato.

Usa `release_profile` per selezionare l’ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker più rapido e critico per il rilascio
- `stable`: minimum più copertura provider/backend stabile per l’approvazione del rilascio
- `full`: stable più ampia copertura consultiva di provider/media

`OpenClaw Release Checks` usa il ref attendibile del workflow per risolvere una
sola volta il ref di destinazione come `release-package-under-test` e riutilizza
quell’artefatto sia nei controlli Docker del percorso di rilascio sia in Package
Acceptance. Questo mantiene tutte le box rivolte ai pacchetti sugli stessi byte
ed evita build ripetute del pacchetto. Lo smoke OpenAI cross-OS usa
`OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la variabile del repo/org è impostata,
altrimenti `openai/gpt-5.4`, perché questa lane dimostra installazione del
pacchetto, onboarding, avvio del Gateway e un turno live dell’agente, invece di
fare benchmarking del modello predefinito più lento. La matrice più ampia dei
provider live rimane il luogo per la copertura specifica dei modelli.

Usa queste varianti in base alla fase di rilascio:

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

Non usare l’ombrello completo come prima riesecuzione dopo una correzione
mirata. Se una box fallisce, usa il workflow figlio, il job, la lane Docker, il
profilo del pacchetto, il provider del modello o la lane QA falliti per la prova
successiva. Esegui di nuovo l’ombrello completo solo quando la correzione ha
modificato l’orchestrazione condivisa del rilascio o ha reso obsoleta la prova
precedente di tutte le box. Il verificatore finale dell’ombrello ricontrolla gli
ID registrati delle esecuzioni dei workflow figli, quindi dopo che un workflow
figlio è stato rieseguito con successo, riesegui solo il job padre fallito
`Verify full validation`.

Per un recupero delimitato, passa `rerun_group` all’ombrello. `all` è la vera
esecuzione del release candidate, `ci` esegue solo il figlio CI normale,
`plugin-prerelease` esegue solo il figlio Plugin esclusivo del rilascio,
`release-checks` esegue ogni box di rilascio e i gruppi di rilascio più stretti
sono `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`,
`qa-live` e `npm-telegram`. Le riesecuzioni mirate `npm-telegram` richiedono
`npm_telegram_package_spec`; le esecuzioni full/all con `release_profile=full`
usano l’artefatto del pacchetto di release-checks.

### Vitest

La box Vitest è il workflow figlio manuale `CI`. La CI manuale bypassa
intenzionalmente lo scoping delle modifiche e forza il normale grafo di test per
il release candidate: shard Linux Node, shard dei Plugin in bundle, contratti dei
canali, compatibilità Node 22, `check`, `check-additional`, build smoke,
controlli della documentazione, Skills Python, Windows, macOS, Android e i18n
della Control UI.

Usa questa box per rispondere a “l’albero sorgente ha superato l’intera suite di
test normale?” Non è la stessa cosa della validazione del prodotto nel percorso
di rilascio. Prove da conservare:

- riepilogo `Full Release Validation` che mostra l’URL dell’esecuzione `CI` avviata
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI durante l’analisi delle regressioni
- artefatti di temporizzazione Vitest come `.artifacts/vitest-shard-timings.json` quando un’esecuzione richiede analisi delle prestazioni

Esegui manualmente la CI diretta solo quando il rilascio richiede una CI normale
deterministica ma non le box Docker, QA Lab, live, cross-OS o package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La box Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow `install-smoke` in
modalità di rilascio. Valida il release candidate attraverso ambienti Docker
pacchettizzati invece che solo con test a livello sorgente.

La copertura Docker del rilascio include:

- install smoke completo con lo smoke lento dell’installazione globale Bun abilitato
- preparazione/riutilizzo dell’immagine smoke del Dockerfile radice per SHA di destinazione, con job smoke QR, root/gateway e installer/Bun eseguiti come shard install-smoke separati
- lane E2E del repository
- chunk Docker del percorso di rilascio: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` e `plugins-runtime-install-h`
- copertura OpenWebUI dentro il chunk `plugins-runtime-services` quando richiesta
- lane separate di installazione/disinstallazione dei Plugin in bundle da `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura del modello live Docker quando i controlli di rilascio includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di
rilascio carica `.artifacts/docker-tests/` con log delle lane, `summary.json`,
`failures.json`, tempi delle fasi, JSON del piano dello scheduler e comandi di
riesecuzione. Per un recupero mirato, usa `docker_lanes=<lane[,lane]>` sul
workflow live/E2E riutilizzabile invece di rieseguire tutti i chunk di rilascio.
I comandi di riesecuzione generati includono il precedente
`package_artifact_run_id` e gli input dell’immagine Docker preparata quando
disponibili, così una lane fallita può riutilizzare lo stesso tarball e le
immagini GHCR.

### QA Lab

La box QA Lab fa anch’essa parte di `OpenClaw Release Checks`. È il gate di
rilascio per il comportamento agentico e a livello di canale, separato da Vitest
e dalla meccanica dei pacchetti Docker.

La copertura QA Lab del rilascio include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6 usando il pacchetto di parità agentico
- profilo QA Matrix live rapido usando l’ambiente `qa-live-shared`
- lane QA Telegram live usando lease di credenziali CI Convex
- `pnpm qa:otel:smoke` quando la telemetria di rilascio richiede una prova locale esplicita

Usa questa box per rispondere a “il rilascio si comporta correttamente negli
scenari QA e nei flussi di canale live?” Conserva gli URL degli artefatti per le
lane parità, Matrix e Telegram quando approvi il rilascio. La copertura Matrix
completa rimane disponibile come esecuzione manuale QA-Lab shardata, invece che
come lane predefinita critica per il rilascio.

### Pacchetto

La box Package è il gate del prodotto installabile. È supportata da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, valida
l’inventario del pacchetto, registra la versione del pacchetto e lo SHA-256, e
mantiene il ref dell’harness del workflow separato dal ref sorgente del
pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw
- `source=ref`: crea un pacchetto da un branch `package_ref`, tag o SHA di commit completo attendibile con l’harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` obbligatorio
- `source=artifact`: riutilizza un `.tgz` caricato da un’altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`,
l’artefatto preparato del pacchetto di rilascio, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` e
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione,
aggiornamento, pulizia delle dipendenze stale dei Plugin, fixture dei Plugin
offline, aggiornamento dei Plugin e QA del pacchetto Telegram contro lo stesso
tarball risolto. La matrice di upgrade copre ogni baseline stabile pubblicata su
npm da `2026.4.23` fino a `latest`; usa Package Acceptance con `source=npm` per
un candidato già distribuito, oppure `source=ref`/`source=artifact` per un
tarball npm locale supportato da SHA prima della pubblicazione. È la
sostituzione nativa GitHub per la maggior parte della copertura
package/update che in precedenza richiedeva Parallels. I controlli di rilascio
cross-OS restano importanti per onboarding, installer e comportamento di
piattaforma specifici del sistema operativo, ma la validazione del prodotto
package/update dovrebbe preferire Package Acceptance.

La checklist canonica per la validazione degli aggiornamenti e dei Plugin è
[test di aggiornamenti e Plugin](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o release-check dimostra
un’installazione/aggiornamento di Plugin, una pulizia doctor o una modifica di
migrazione di un pacchetto pubblicato. La migrazione esaustiva degli
aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è un workflow
manuale `Update Migration` separato, non parte della Full Release CI.

La tolleranza legacy di package-acceptance è intenzionalmente limitata nel
tempo. I pacchetti fino a `2026.4.25` possono usare il percorso di compatibilità
per lacune nei metadati già pubblicate su npm: voci di inventario QA private
mancanti dal tarball, `gateway install --wrapper` mancante, file di patch
mancanti nella fixture git derivata dal tarball, `update.channel` persistito
mancante, posizioni legacy dei record di installazione dei Plugin, persistenza
mancante dei record di installazione del marketplace e migrazione dei metadati
di configurazione durante `plugins update`. Il pacchetto pubblicato `2026.4.26`
può emettere avvisi per file di marcatura dei metadati di build locale già
distribuiti. I pacchetti successivi devono soddisfare i contratti moderni dei
pacchetti; quelle stesse lacune fanno fallire la validazione del rilascio.

Usa profili Package Acceptance più ampi quando la domanda di rilascio riguarda
un pacchetto effettivamente installabile:

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

- `smoke`: installazione rapida del pacchetto/canale/agent, rete del Gateway e lane di
  ricaricamento della configurazione
- `package`: contratti di installazione/aggiornamento/pacchetto Plugin senza ClawHub live; questo è il
  valore predefinito del controllo di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI
  e OpenWebUI
- `full`: blocchi del percorso di rilascio Docker con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` in Package Acceptance. Il workflow passa il tarball
risolto `package-under-test` nella lane Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione di pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Esso
orchestra i workflow del trusted-publisher nell'ordine richiesto dal rilascio:

1. Esegue il checkout del tag di rilascio e ne risolve il commit SHA.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegue `pnpm plugins:sync:check`.
4. Esegue il dispatch di `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Esegue il dispatch di `Plugin ClawHub Release` con lo stesso scope e SHA.
6. Esegue il dispatch di `OpenClaw NPM Release` con il tag di rilascio, il dist-tag npm e
   il `preflight_run_id` salvato.

Esempio di pubblicazione beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pubblicazione stable sul dist-tag beta predefinito:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

La promozione stable direttamente a `latest` è esplicita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Usa i workflow di livello inferiore `Plugin NPM Release` e `Plugin ClawHub Release`
solo per attività mirate di riparazione o ripubblicazione. Per riparare un plugin selezionato, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure esegui direttamente il dispatch del workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA di commit completo
  di 40 caratteri del branch del workflow corrente per un preflight solo di validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale affinché il workflow riutilizzi
  il tarball preparato dalla riuscita esecuzione di preflight
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; il valore predefinito è `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve esistere già
- `preflight_run_id`: id della riuscita esecuzione di preflight di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: il valore predefinito è `all-publishable`; usa `selected` solo
  per attività mirate di riparazione
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: il valore predefinito è `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione solo per plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o SHA di commit completo da validare. I controlli che contengono segreti
  richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un
  tag di rilascio.

Regole:

- I tag stable e di correzione possono pubblicare su `beta` o `latest`
- I tag prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA di commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima che la pubblicazione continui

## Sequenza di rilascio npm stable

Quando si prepara un rilascio npm stable:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA di commit completo del branch del workflow corrente
     per una prova generale solo di validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso prima beta, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stable diretta
3. Esegui `Full Release Validation` sul branch di rilascio, sul tag di rilascio o sullo SHA di
   commit completo quando vuoi CI normale più copertura live di prompt cache, Docker, QA Lab,
   Matrix e Telegram da un unico workflow manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sulla ref di rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se il rilascio è arrivato su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stable da `beta` a `latest`
8. Se il rilascio è stato pubblicato intenzionalmente direttamente su `latest` e `beta`
   deve puntare subito alla stessa build stable, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stable, oppure lascia che la sua sincronizzazione pianificata
   di auto-riparazione sposti `beta` in seguito

La mutazione del dist-tag vive nel repo privato per sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione prima beta
documentati e visibili all'operatore.

Se un maintainer deve ricorrere all'autenticazione npm locale, esegui qualsiasi comando della
CLI 1Password (`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell dell'agent principale; mantenerlo dentro tmux rende prompt,
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
