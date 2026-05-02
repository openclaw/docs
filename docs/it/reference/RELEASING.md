---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida della release o dell'accettazione del pacchetto
    - Ricerca della denominazione e della cadenza delle versioni
summary: Corsie di rilascio, checklist dell'operatore, ambienti di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-02T08:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre corsie di rilascio pubbliche:

- stable: rilasci con tag che vengono pubblicati su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che vengono pubblicati su npm `beta`
- dev: la testa mobile di `main`

## Nomenclatura delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio di correzione stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali al mese o al giorno
- `latest` indica il rilascio npm stabile attualmente promosso
- `beta` indica la destinazione di installazione beta corrente
- I rilasci stabili e di correzione stabile vengono pubblicati su npm `beta` per impostazione predefinita; gli operatori di rilascio possono scegliere esplicitamente `latest`, oppure promuovere in seguito una build beta convalidata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app Mac riservate ai rilasci stabili salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Il rilascio stabile segue solo dopo la convalida dell'ultima beta
- I maintainer normalmente creano i rilasci da un ramo `release/YYYY.M.D` creato
  dall'attuale `main`, così la convalida del rilascio e le correzioni non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura dettagliata di rilascio, le approvazioni, le credenziali e le note di recupero sono
  riservate ai maintainer

## Checklist dell'operatore di rilascio

Questa checklist rappresenta la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, recupero dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall'attuale `main`: recupera l'ultima versione, conferma che il commit di destinazione sia stato inviato,
   e conferma che la CI corrente di `main` sia abbastanza verde da poter creare un ramo da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate agli utenti, committala, inviala, ed esegui rebase/pull
   ancora una volta prima di creare il ramo.
3. Rivedi i record di compatibilità dei rilasci in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.D` dall'attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, esegui
   `pnpm plugins:sync` affinché i pacchetti Plugin pubblicabili condividano la versione
   di rilascio e i metadati di compatibilità, quindi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, e
   `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   per il preflight solo di convalida è consentito uno SHA completo di 40 caratteri del ramo di rilascio.
   Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test di pre-rilascio con `Full Release Validation` per il
   ramo di rilascio, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per le quattro grandi caselle di test di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul ramo di rilascio ed esegui di nuovo il file, la corsia,
   il job di workflow, il profilo pacchetto, il provider o l'elenco consentito di modelli fallito più piccolo che
   dimostri la correzione. Esegui di nuovo l'intero contenitore solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per la beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   ramo `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   pubblica prima su npm tutti i pacchetti Plugin pubblicabili, pubblica lo stesso
   insieme su ClawHub per secondo, quindi promuove l'artefatto preflight npm di OpenClaw preparato
   con dist-tag `beta`. Dopo la pubblicazione, esegui l'accettazione del pacchetto post-pubblicazione
   rispetto al pacchetto pubblicato `openclaw@YYYY.M.D-beta.N` o `openclaw@beta`.
   Se una beta inviata o pubblicata richiede una correzione, crea il `-beta.N` successivo;
   non eliminare né riscrivere la vecchia beta.
10. Per lo stabile, continua solo dopo che la beta verificata o il candidato al rilascio dispone delle
    prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso
    `OpenClaw Release Publish`, riutilizzando l'artefatto preflight riuscito tramite
    `preflight_run_id`; la preparazione del rilascio stabile macOS richiede anche gli
    `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram
    opzionale autonomo su npm pubblicato quando servono prove del canale post-pubblicazione,
    la promozione del dist-tag quando necessario, le note di rilascio/prerelease di GitHub dalla
    sezione completa corrispondente di `CHANGELOG.md`, e i passaggi di annuncio del rilascio.

## Preflight di rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così il TypeScript dei test resta
  coperto al di fuori del gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli più ampi sui
  cicli di importazione e sui confini architetturali sono verdi al di fuori del gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di rilascio
  `dist/*` attesi e il bundle della Control UI esistono per il passaggio di validazione del pack
- Esegui `pnpm plugins:sync` dopo il bump della versione root e prima del tagging. Aggiorna le
  versioni dei pacchetti Plugin pubblicabili, i metadati di compatibilità peer/API di OpenClaw,
  i metadati di build e gli stub dei changelog dei Plugin per farli corrispondere alla versione di
  rilascio core. `pnpm plugins:sync:check` è il controllo di rilascio non mutante; il workflow di
  pubblicazione fallisce prima di qualunque mutazione del registro se questo passaggio è stato
  dimenticato.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per
  avviare tutte le test box pre-rilascio da un unico entrypoint. Accetta un branch,
  un tag o uno SHA completo di commit, avvia manualmente `CI` e avvia
  `OpenClaw Release Checks` per install smoke, package acceptance, suite del percorso di rilascio Docker,
  live/E2E, OpenWebUI, parità QA Lab, Matrix e lane Telegram. Con
  `release_profile=full` e `rerun_group=all`, esegue anche il pacchetto Telegram E2E contro
  l'artefatto `release-package-under-test` dei controlli di rilascio. Fornisci
  `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso Telegram E2E deve provare anche
  il pacchetto npm pubblicato. Fornisci `evidence_package_spec` quando il report di evidenza privato
  deve provare che la validazione corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel per un candidato
  pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref`
  per impacchettare un branch/tag/SHA `package_ref` attendibile con l'harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con uno SHA-256 obbligatorio;
  oppure `source=artifact` per un tarball caricato da un'altra esecuzione di GitHub
  Actions. Il workflow risolve il candidato in
  `package-under-test`, riusa lo scheduler di rilascio Docker E2E contro quel
  tarball e può eseguire QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le lane Docker
  selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto è il candidato e
  `published_upgrade_survivor_baseline` seleziona la baseline pubblicata.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane di installazione/canale/agent, rete Gateway e ricarica configurazione
  - `package`: lane native dell'artefatto per pacchetto/aggiornamento/Plugin senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent,
    ricerca web OpenAI e OpenWebUI
  - `full`: chunk del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura completa della CI
  normale per il candidato rilascio. Gli avvii manuali della CI bypassano lo scoping dei cambiamenti
  e forzano gli shard Linux Node, gli shard dei Plugin in bundle, i contratti dei canali,
  la compatibilità Node 22, `check`, `check-additional`, build smoke,
  controlli docs, Skills Python, Windows, macOS, Android e le lane i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando validi la telemetria di rilascio. Esercita
  QA-lab tramite un ricevitore OTLP/HTTP locale e verifica i nomi degli span delle trace esportate,
  gli attributi limitati e la redazione di contenuti/identificatori senza richiedere
  Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio con tag
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Avvialo da `release/YYYY.M.D` (o da `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di rilascio e il `preflight_run_id` npm
  OpenClaw riuscito, e mantieni lo scope di pubblicazione Plugin predefinito
  `all-publishable` a meno che tu non stia eseguendo deliberatamente una riparazione mirata. Il
  workflow serializza la pubblicazione npm dei Plugin, la pubblicazione ClawHub dei Plugin e la
  pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato prima dei suoi
  Plugin esternalizzati.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche il gate di parità mock QA Lab più il profilo
  Matrix live rapido e la lane QA Telegram prima dell'approvazione del rilascio. Le lane live
  usano l'ambiente `qa-live-shared`; Telegram usa anche lease delle credenziali CI Convex.
  Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi l'inventario completo di trasporto,
  media ed E2EE Matrix in parallelo.
- La validazione runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il
  workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il vero percorso di rilascio npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella propria
  lane, così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che contengono segreti devono essere avviati tramite `Full Release
Validation` o dal ref del workflow `main`/release, così la logica del workflow e
  i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA completo di commit purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Anche il preflight solo di validazione `OpenClaw NPM Release` accetta lo SHA completo
  di 40 caratteri del commit del branch del workflow corrente senza richiedere un tag pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il controllo dei
  metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner
  GitHub-hosted, mentre il percorso di validazione non mutante può usare i runner Linux
  Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti del workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la lane separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione dal
  registro pubblicato in un prefisso temporaneo pulito
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram e Telegram E2E reale
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare
  direttamente le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-poi-promozione:
  - la pubblicazione npm reale deve passare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere avviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - i rilasci npm stabili hanno come valore predefinito `beta`
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione token-based dei dist-tag npm ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repository pubblico mantiene una pubblicazione solo OIDC
  - il `macOS Release` pubblico è solo di validazione; quando un tag vive solo su un
    branch di rilascio ma il workflow viene avviato da `main`, imposta
    `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve passare un `preflight_run_id` mac privato e un
    `validate_run_id` riusciti
  - i percorsi di pubblicazione reale promuovono artefatti preparati invece di ricostruirli
    di nuovo
- Per rilasci di correzione stabili come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di rilascio non possono lasciare silenziosamente le installazioni globali più vecchie sul
  payload stabile di base
- Il preflight di rilascio npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`,
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei Plugin pubblicati e i
  metadati del pacchetto siano presenti nel layout del registro installato. Un rilascio che
  distribuisce payload runtime dei Plugin mancanti fallisce il verificatore postpublish e
  non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` del pack npm sul
  tarball di aggiornamento candidato, così l'e2e dell'installer intercetta gonfiori accidentali del pack
  prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest di timing dei Plugin o
  le matrici dei test dei Plugin, rigenera e rivedi gli output di matrice
  `plugin-prerelease-extension-shard` posseduti dal planner da
  `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di rilascio non
  descrivono un layout CI obsoleto
- La preparazione del rilascio macOS stabile include anche le superfici dell'updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un URL del feed Sparkle
    non vuoto e un `CFBundleVersion` pari o superiore al floor canonico della build Sparkle
    per quella versione di rilascio

## Test box di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da
un unico entrypoint. Per una prova su commit fissato in un branch che si muove rapidamente, usa
l'helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper pusha `release-ci/<sha>-...`, avvia `Full Release Validation`
da quel branch con `ref=<sha>`, verifica che ogni `headSha` del workflow figlio
corrisponda al target, poi elimina il branch temporaneo. Questo evita di provare per errore
un'esecuzione figlia più recente di `main`.

Per la validazione di branch o tag di rilascio, eseguila dal ref del workflow `main`
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

Il workflow risolve il ref di destinazione, avvia manualmente `CI` con
`target_ref=<release-ref>`, avvia `OpenClaw Release Checks` e avvia
l'E2E Telegram del pacchetto autonomo quando `release_profile=full` con
`rerun_group=all` oppure quando `npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di rilascio cross-OS, copertura live/E2E Docker
del percorso di rilascio, Package Acceptance con QA del pacchetto Telegram, parità QA Lab,
Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il riepilogo
`Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve riuscire; fuori da full/all viene saltato
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il riepilogo
finale del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
Consulta [Convalida completa del rilascio](/it/reference/full-release-validation) per la
matrice completa delle fasi, i nomi esatti dei job del workflow, le differenze tra profilo stabile e completo,
gli artefatti e gli handle per riesecuzioni mirate.
I workflow figli vengono avviati dal ref fidato che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch o tag di rilascio precedente. Non esiste un input separato per il ref del workflow
Full Release Validation; scegli l'harness fidato scegliendo il ref dell'esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per una prova esatta del commit su `main` mobile;
gli SHA dei commit grezzi non possono essere ref di dispatch del workflow, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo fissato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso live e Docker OpenAI/core critico per il rilascio più veloce
- `stable`: minimum più copertura stabile di provider/backend per l'approvazione del rilascio
- `full`: stable più ampia copertura consultiva di provider/media

`OpenClaw Release Checks` usa il ref del workflow fidato per risolvere una volta il ref di destinazione
come `release-package-under-test` e riusa quell'artefatto sia nei controlli Docker
del percorso di rilascio sia in Package Acceptance. Questo mantiene tutte le box rivolte ai pacchetti
sugli stessi byte ed evita build ripetute del pacchetto.
L'install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.5`, perché questa lane
dimostra installazione del pacchetto, onboarding, avvio del Gateway e un turno live dell'agente,
non il benchmark del modello predefinito più lento. La matrice più ampia dei provider live
resta il luogo per la copertura specifica dei modelli.

Usa queste varianti a seconda della fase di rilascio:

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

Non usare l'umbrella completo come prima riesecuzione dopo una correzione mirata. Se una box
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo del pacchetto, il provider
del modello o la lane QA falliti per la prossima prova. Esegui di nuovo l'umbrella completo solo quando
la correzione ha modificato l'orchestrazione condivisa del rilascio o ha reso obsolete le prove precedenti
di tutte le box. Il verificatore finale dell'umbrella ricontrolla gli ID registrati delle esecuzioni dei workflow
figli, quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre
`Verify full validation` fallito.

Per un recupero delimitato, passa `rerun_group` all'umbrella. `all` è la vera
esecuzione del release candidate, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio di solo rilascio del Plugin, `release-checks` esegue ogni box di rilascio
e i gruppi di rilascio più ristretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l'artefatto del pacchetto di release-checks.

### Vitest

La box Vitest è il workflow figlio manuale `CI`. La CI manuale ignora intenzionalmente
lo scoping delle modifiche e forza il grafo di test normale per il release
candidate: shard Linux Node, shard dei Plugin inclusi, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS, Android
e Control UI i18n.

Usa questa box per rispondere a "l'albero sorgente ha superato l'intera suite di test normale?"
Non è la stessa cosa della convalida del prodotto sul percorso di rilascio. Prove da conservare:

- riepilogo `Full Release Validation` che mostra l'URL dell'esecuzione `CI` avviata
- esecuzione `CI` verde sullo SHA esatto di destinazione
- nomi degli shard CI falliti o lenti durante l'indagine sulle regressioni
- artefatti di timing Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui la CI manuale direttamente solo quando il rilascio richiede una CI normale deterministica ma
non le box Docker, QA Lab, live, cross-OS o pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La box Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow `install-smoke`
in modalità rilascio. Convalida il release candidate tramite ambienti Docker
pacchettizzati invece che solo test a livello sorgente.

La copertura Docker di rilascio include:

- install smoke completo con lo slow Bun global install smoke abilitato
- preparazione/riuso dell'immagine smoke Dockerfile root per SHA di destinazione, con job QR,
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
- lane divise di installazione/disinstallazione dei Plugin inclusi
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura dei modelli live Docker quando i controlli di rilascio
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
timing delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per un recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow riutilizzabile live/E2E invece di
rieseguire tutti i chunk di rilascio. I comandi di riesecuzione generati includono gli input precedenti
`package_artifact_run_id` e dell'immagine Docker preparata quando disponibili, così una
lane fallita può riusare lo stesso tarball e le immagini GHCR.

### QA Lab

Anche la box QA Lab fa parte di `OpenClaw Release Checks`. È il gate di rilascio
del comportamento agentico e a livello di canale, separato da Vitest e dalla meccanica
dei pacchetti Docker.

La copertura QA Lab di rilascio include:

- gate di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live veloce usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease delle credenziali Convex CI
- `pnpm qa:otel:smoke` quando la telemetria di rilascio richiede una prova locale esplicita

Usa questa box per rispondere a "il rilascio si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artefatti per le lane di parità, Matrix e Telegram
quando approvi il rilascio. La copertura Matrix completa resta disponibile come esecuzione QA-Lab
manuale shardata invece che come lane predefinita critica per il rilascio.

### Pacchetto

La box Package è il gate del prodotto installabile. È supportata da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, convalida
l'inventario del pacchetto, registra la versione del pacchetto e SHA-256, e mantiene il
ref dell'harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw
- `source=ref`: impacchetta un branch, tag o SHA completo di commit `package_ref` fidato
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` obbligatorio
- `source=artifact`: riusa un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto
del pacchetto di rilascio preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` e
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, update, pulizia delle dipendenze
stale dei Plugin, fixture Plugin offline, update dei Plugin e QA del pacchetto Telegram
contro lo stesso tarball risolto. È la sostituzione nativa GitHub
per gran parte della copertura package/update che in precedenza richiedeva
Parallels. I controlli di rilascio cross-OS restano importanti per onboarding,
installer e comportamento specifici del sistema operativo, ma la convalida del prodotto package/update dovrebbe
preferire Package Acceptance.

La checklist canonica per la convalida di update e Plugin è
[Testare aggiornamenti e Plugin](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o di release-check dimostra una
installazione/update di Plugin, pulizia doctor o modifica di migrazione di un pacchetto pubblicato.
La migrazione esaustiva degli update pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale `Update Migration` separato, non parte della Full Release CI.

La tolleranza legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci dell'inventario QA private mancanti dal tarball, mancanza di
`gateway install --wrapper`, file patch mancanti nella fixture git derivata dal tarball,
`update.channel` persistito mancante, posizioni legacy dei record di installazione dei Plugin,
persistenza del record di installazione marketplace mancante e migrazione dei metadati di configurazione
durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può avvisare
per file stamp di metadati della build locale che erano già stati spediti. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; le stesse lacune fanno fallire la convalida
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

Profili di pacchetto comuni:

- `smoke`: lane rapide per installazione pacchetto/canale/agente, rete Gateway e ricaricamento
  config
- `package`: contratti di pacchetto install/update/Plugin senza ClawHub live; questo è il valore predefinito
  dei release-check
- `product`: `package` più canali MCP, pulizia cron/subagente, ricerca web OpenAI
  e OpenWebUI
- `full`: chunk Docker del percorso di rilascio con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` in Package Acceptance. Il workflow passa il tarball
`package-under-test` risolto nella lane Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione della pubblicazione delle release

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Orchestra i workflow trusted-publisher nell'ordine richiesto dalla release:

1. Esegue il check-out del tag di release e ne risolve lo SHA del commit.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegue `pnpm plugins:sync:check`.
4. Invia `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Invia `Plugin ClawHub Release` con lo stesso ambito e SHA.
6. Invia `OpenClaw NPM Release` con il tag di release, il dist-tag npm e
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
solo per interventi mirati di riparazione o ripubblicazione. Per una riparazione di un plugin selezionato, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure invia direttamente il workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio, ad esempio `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA completo
  a 40 caratteri del commit del branch del workflow corrente per un preflight solo di convalida
- `preflight_only`: `true` solo per convalida/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale affinché il workflow riutilizzi
  il tarball preparato dall'esecuzione preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; valore predefinito `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio; deve già esistere
- `preflight_run_id`: id dell'esecuzione preflight riuscita di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: valore predefinito `all-publishable`; usa `selected` solo
  per interventi mirati di riparazione
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: valore predefinito `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione solo plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o SHA completo del commit da convalidare. I controlli che usano segreti
  richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un
  tag di release.

Regole:

- I tag stabili e di correzione possono essere pubblicati su `beta` o `latest`
- I tag di prerelease beta possono essere pubblicati solo su `beta`
- Per `OpenClaw NPM Release`, l'input con SHA completo del commit è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di convalida
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica questi metadati prima che la pubblicazione continui

## Sequenza di release npm stabile

Quando si prepara una release npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA completo del commit del branch del workflow corrente
     per una prova a secco solo di convalida del workflow preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul branch di release, sul tag di release o sullo SHA completo
   del commit quando vuoi CI normale più copertura live della cache dei prompt, Docker, QA Lab,
   Matrix e Telegram da un unico workflow manuale
4. Se ti serve intenzionalmente solo il grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sulla ref di release
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se la release è arrivata su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se la release è stata pubblicata intenzionalmente direttamente su `latest` e `beta`
   deve seguire subito la stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione pianificata
   di self-healing sposti `beta` in seguito

La mutazione del dist-tag risiede nel repo privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo tramite OIDC.

Questo mantiene documentati e visibili agli operatori sia il percorso di pubblicazione diretta sia
il percorso di promozione beta-first.

Se un maintainer deve ripiegare sull'autenticazione npm locale, esegui eventuali comandi della CLI 1Password
(`op`) solo all'interno di una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; tenerlo dentro tmux rende prompt,
avvisi e gestione OTP osservabili e impedisce avvisi ripetuti dall'host.

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

- [Canali di rilascio](/it/install/development-channels)
