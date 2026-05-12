---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida del rilascio o dell'accettazione del pacchetto
    - Cerchi informazioni sulla denominazione e sulla cadenza delle versioni
summary: Corsie di rilascio, checklist dell'operatore, riquadri di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-05-12T08:46:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stabile: rilasci con tag pubblicati su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag prerelease pubblicati su npm `beta`
- sviluppo: l'head mobile di `main`

## Denominazione delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttivo stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali al mese o al giorno
- `latest` indica l'attuale rilascio stabile npm promosso
- `beta` indica l'attuale destinazione di installazione beta
- I rilasci stabili e correttivi stabili vengono pubblicati su npm `beta` per impostazione predefinita; gli operatori di rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app mac riservati allo stabile salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Lo stabile segue solo dopo che l'ultima beta è stata convalidata
- I manutentori normalmente preparano i rilasci da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la convalida del rilascio e le correzioni non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e necessita di una correzione, i manutentori creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura di rilascio dettagliata, le approvazioni, le credenziali e le note di ripristino sono
  riservate ai manutentori

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai manutentori.

1. Parti dall'attuale `main`: esegui il pull dell'ultima versione, conferma che il commit di destinazione sia stato inviato
   e conferma che la CI dell'attuale `main` sia abbastanza verde da poter creare il branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate agli utenti, esegui il commit, invialo e fai rebase/pull
   ancora una volta prima di creare il branch.
3. Rivedi i record di compatibilità dei rilasci in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   intenzionalmente mantenuta.
4. Crea `release/YYYY.M.D` dall'attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Incrementa ogni posizione di versione richiesta per il tag previsto, quindi esegui
   `pnpm release:prep`. Aggiorna versioni dei Plugin, inventario dei Plugin, schema di
   configurazione, metadati della configurazione dei canali inclusi, baseline della
   documentazione di configurazione, export dell'SDK dei Plugin e baseline API dell'SDK
   dei Plugin nell'ordine corretto. Esegui il commit di qualunque deriva generata prima
   del tagging. Poi esegui il preflight locale deterministico:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   uno SHA completo a 40 caratteri del branch di rilascio è consentito per il preflight
   solo di convalida. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-release con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per le quattro grandi test box di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio ed esegui di nuovo il file,
   canale, job del workflow, profilo del pacchetto, provider o allowlist di modelli fallito più piccolo che
   dimostri la correzione. Riesegui l'ombrello completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per la beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   invia tutti i pacchetti Plugin pubblicabili su npm e lo stesso insieme a
   ClawHub in parallelo, quindi promuove l'artefatto di preflight npm di OpenClaw preparato
   con il dist-tag corrispondente non appena la pubblicazione npm dei Plugin riesce.
   Dopo che il child di pubblicazione npm di OpenClaw riesce, crea o aggiorna la
   pagina di rilascio/prerelease GitHub corrispondente dalla sezione completa corrispondente di
   `CHANGELOG.md`. I rilasci stabili pubblicati su npm `latest` diventano il
   rilascio latest di GitHub; i rilasci di manutenzione stabili mantenuti su npm `beta` sono
   creati con GitHub `latest=false`.
   La pubblicazione su ClawHub potrebbe essere ancora in esecuzione mentre OpenClaw npm pubblica, ma il
   workflow di pubblicazione del rilascio stampa immediatamente gli ID delle esecuzioni child. Per impostazione predefinita
   non attende ClawHub dopo averlo inviato, quindi la disponibilità npm di OpenClaw
   non è bloccata da approvazioni ClawHub o lavori di registro più lenti; imposta
   `wait_for_clawhub=true` quando ClawHub deve bloccare il completamento del workflow. Il
   percorso ClawHub ritenta i fallimenti transitori di installazione delle dipendenze CLI, pubblica
   i Plugin che superano la preview anche quando una cella di preview presenta un flake, e termina con
   la verifica del registro per ogni versione attesa dei Plugin, così le pubblicazioni parziali
   restano visibili e ripetibili. Dopo la pubblicazione, esegui
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   per verificare con un solo comando la prerelease GitHub, i dist-tag npm `beta`, l'integrità npm,
   il percorso di installazione pubblicato, le versioni esatte su ClawHub, gli artefatti ClawHub e le conclusioni
   dei workflow child. Aggiungi `--rerun-failed-clawhub` quando il sidecar
   ClawHub è fallito solo in job ritentabili e deve essere rieseguito sul posto.
   Quindi esegui l'accettazione del pacchetto post-pubblicazione contro il pacchetto pubblicato
   `openclaw@YYYY.M.D-beta.N` oppure
   `openclaw@beta`. Se una prerelease inviata o pubblicata necessita di una correzione,
   crea il numero di prerelease corrispondente successivo; non eliminare né riscrivere la vecchia
   prerelease.
10. Per lo stabile, continua solo dopo che la beta verificata o il candidato di rilascio dispone delle
    prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso
    `OpenClaw Release Publish`, riutilizzando l'artefatto di preflight riuscito tramite
    `preflight_run_id`; la prontezza del rilascio macOS stabile richiede anche i pacchetti
    `.zip`, `.dmg`, `.dSYM.zip` e `appcast.xml` aggiornato su `main`.
    Il workflow privato di pubblicazione macOS pubblica automaticamente l'appcast firmato su `main`
    pubblico dopo la verifica degli asset di rilascio; se la protezione del branch blocca
    il push diretto, apre o aggiorna una PR appcast.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram npm pubblicato
    autonomo facoltativo quando hai bisogno di prova del canale post-pubblicazione,
    la promozione del dist-tag quando necessaria, verifica la pagina di rilascio GitHub generata
    ed esegui i passaggi di annuncio del rilascio.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima della preflight di release in modo che il TypeScript dei test resti
  coperto al di fuori del gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima della preflight di release in modo che i controlli più ampi sui
  cicli di importazione e sui confini architetturali siano verdi al di fuori del gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` in modo che gli artefatti di release
  `dist/*` attesi e il bundle Control UI esistano per il passaggio di validazione del pacchetto
- Esegui `pnpm release:prep` dopo l'incremento della versione root e prima del tagging. Esegue
  ogni generatore di release deterministico che tende a divergere dopo una modifica di
  versione/configurazione/API: versioni dei plugin, inventario dei plugin, schema della configurazione base,
  metadati della configurazione dei canali inclusi, baseline della documentazione di configurazione, export
  dell'SDK dei plugin e baseline API dell'SDK dei plugin. `pnpm release:check` riesegue quei
  guard in modalità controllo e segnala in un solo passaggio ogni errore di deriva generata che trova
  prima di eseguire i controlli di release del pacchetto.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione della release per
  avviare tutte le test box pre-release da un unico punto di ingresso. Accetta un branch,
  tag o SHA completo di commit, avvia manualmente `CI` e avvia
  `OpenClaw Release Checks` per install smoke, accettazione pacchetto, controlli pacchetto
  cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stable/predefinite
  mantengono live/E2E esaustivi e soak Docker del percorso di release dietro
  `run_release_soak=true`; `release_profile=full` forza il soak. Con
  `release_profile=full` e `rerun_group=all`, esegue anche il pacchetto Telegram
  E2E contro l'artefatto `release-package-under-test` dei controlli di release.
  Fornisci `release_package_spec` dopo aver pubblicato una beta per riusare il pacchetto
  npm rilasciato nei controlli di release, Package Acceptance e pacchetto Telegram
  E2E senza ricostruire il tarball di release. Fornisci
  `npm_telegram_package_spec` solo quando Telegram deve usare un pacchetto pubblicato
  diverso dal resto della validazione di release. Fornisci
  `package_acceptance_package_spec` quando Package Acceptance deve usare un pacchetto
  pubblicato diverso dalla specifica del pacchetto di release. Fornisci
  `evidence_package_spec` quando il report privato delle prove deve dimostrare che la
  validazione corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel
  per un candidato pacchetto mentre il lavoro di release continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di release esatta; `source=ref`
  per impacchettare un branch/tag/SHA `package_ref` affidabile con l'harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256 obbligatorio;
  oppure `source=artifact` per un tarball caricato da un'altra esecuzione di GitHub
  Actions. Il workflow risolve il candidato in
  `package-under-test`, riusa lo scheduler di release Docker E2E contro quel
  tarball e può eseguire la QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le lane
  Docker selezionate includono `published-upgrade-survivor`, l'artefatto del
  pacchetto è il candidato e `published_upgrade_survivor_baseline` seleziona
  la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato sia
  come CLI installata sia come package-under-test, quindi esercita il percorso
  di restart gestito del comando di aggiornamento candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane install/channel/agent, rete Gateway e reload configurazione
  - `package`: lane native dell'artefatto per pacchetto/aggiornamento/restart/plugin senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent,
    ricerca web OpenAI e OpenWebUI
  - `full`: chunk Docker del percorso di release con OpenWebUI
  - `custom`: selezione esatta `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura CI normale completa
  per il candidato release. Gli avvii manuali di CI bypassano lo scoping delle modifiche
  e forzano gli shard Linux Node, gli shard dei plugin inclusi, i contratti dei canali,
  compatibilità Node 22, `check`, `check-additional`, build smoke,
  controlli docs, Skills Python, Windows, macOS, Android e lane i18n Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando validi la telemetria di release. Esercita
  QA-lab tramite un ricevitore OTLP/HTTP locale e verifica i nomi degli span di trace
  esportati, gli attributi limitati e la redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni release taggata
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Avvialo da `release/YYYY.M.D` (o da `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di release e il `preflight_run_id`
  npm OpenClaw riuscito, e mantieni lo scope predefinito di pubblicazione plugin
  `all-publishable` a meno che tu stia deliberatamente eseguendo una riparazione mirata. Il
  workflow serializza la pubblicazione npm dei plugin, la pubblicazione ClawHub dei plugin e la
  pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato prima dei suoi
  plugin esternalizzati.
- I controlli di release ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo
  Matrix live veloce e la lane QA Telegram prima dell'approvazione della release. Le lane live
  usano l'ambiente `qa-live-shared`; Telegram usa anche i lease delle credenziali CI
  Convex. Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi l'inventario completo Matrix
  di trasporto, media ed E2EE in parallelo.
- La validazione runtime cross-OS di installazione e aggiornamento fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il
  workflow riusabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa divisione è intenzionale: mantenere il percorso reale di release npm breve,
  deterministico e centrato sugli artefatti, mentre i controlli live più lenti restano nella propria
  lane così non rallentano né bloccano la pubblicazione
- I controlli di release con segreti devono essere avviati tramite `Full Release
Validation` o dal workflow ref `main`/release, così logica del workflow e
  segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, tag o SHA completo di commit purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di release
- Anche la preflight solo di validazione `OpenClaw NPM Release` accetta lo SHA completo
  di 40 caratteri del commit del branch del workflow corrente senza richiedere un tag inviato
- Quel percorso SHA è solo per validazione e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un tag di release reale
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione su runner
  GitHub-hosted, mentre il percorso di validazione non mutante può usare i runner Linux
  Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti del workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- La preflight di release npm non attende più la lane separata dei controlli di release
- Prima di taggare localmente un candidato release, esegui
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`. L'helper
  esegue i guardrail veloci di release, i controlli di release npm/ClawHub dei plugin, build,
  build UI e `release:openclaw:npm:check` nell'ordine che intercetta gli errori comuni
  bloccanti per l'approvazione prima che inizi il workflow di pubblicazione GitHub.
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione
  dal registry pubblicato in un prefisso temporaneo pulito
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram ed E2E Telegram reale
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente
  le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta post-pubblicazione completo da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L'helper esegue la validazione Parallels npm update/fresh-target, avvia `NPM Telegram Beta E2E`, interroga l'esecuzione esatta del workflow, scarica l'artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione di release dei maintainer ora usa preflight-then-promote:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere avviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - le release npm stable usano `beta` come predefinito
  - la pubblicazione npm stable può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione dei dist-tag npm basata su token ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repository pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di validazione; quando un tag vive solo su un
    branch di release ma il workflow è avviato da `main`, imposta
    `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve superare `preflight_run_id` e `validate_run_id`
    mac privati riusciti
  - i percorsi di pubblicazione reali promuovono artefatti preparati invece di ricostruirli
    di nuovo
- Per release correttive stable come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di upgrade con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di release non possono lasciare silenziosamente installazioni globali più vecchie sul
  payload stable base
- La preflight di release npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`,
  così non spediamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che entrypoint dei plugin pubblicati e
  metadati del pacchetto siano presenti nel layout installato dal registry. Una release che
  spedisce payload runtime dei plugin mancanti fallisce il verificatore postpublish e
  non può essere promossa a `latest`.
- `pnpm test:install:smoke` applica anche il budget npm pack `unpackedSize` sul
  tarball di aggiornamento candidato, così l'e2e dell'installer intercetta aumenti accidentali del pacchetto
  prima del percorso di pubblicazione release
- Se il lavoro di release ha toccato la pianificazione CI, i manifest di timing delle estensioni o
  le matrici di test delle estensioni, rigenera e rivedi gli output della matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di release non
  descrivono un layout CI obsoleto
- La prontezza della release macOS stable include anche le superfici dell'updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione; il
    workflow privato di pubblicazione macOS lo committa automaticamente, oppure apre una PR appcast
    quando il push diretto è bloccato
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un URL del feed Sparkle
    non vuoto e un `CFBundleVersion` pari o superiore al floor canonico di build Sparkle
    per quella versione di release

## Macchine di test per il rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da
un unico punto di ingresso. Per una prova di commit fissato su un ramo in rapido movimento, usa
l'helper in modo che ogni workflow figlio venga eseguito da un ramo temporaneo fissato allo
SHA di destinazione:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper invia `release-ci/<sha>-...`, avvia `Full Release Validation`
da quel ramo con `ref=<sha>`, verifica che ogni `headSha` del workflow figlio
corrisponda alla destinazione, quindi elimina il ramo temporaneo. Questo evita di provare per errore
un'esecuzione figlia di `main` più recente.

Per la validazione di un ramo o tag di rilascio, eseguila dal ref del workflow `main`
attendibile e passa il ramo o tag di rilascio come `ref`:

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
padre `release-package-under-test` per i controlli rivolti ai pacchetti e
avvia l'E2E Telegram del pacchetto standalone quando `release_profile=full` con
`rerun_group=all` o quando è impostato `release_package_spec` oppure
`npm_telegram_package_spec`. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di rilascio cross-OS, copertura live/E2E Docker
del percorso di rilascio quando il soak è abilitato, Package Acceptance con QA del pacchetto
Telegram, parità QA Lab, Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il
riepilogo di `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve riuscire; fuori da full/all viene saltato
a meno che non sia stato fornito un `release_package_spec` o
`npm_telegram_package_spec` pubblicato. Il riepilogo finale del verificatore
include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
Vedi [Validazione completa del rilascio](/it/reference/full-release-validation) per la
matrice completa delle fasi, i nomi esatti dei job del workflow, le differenze
tra profilo stabile e completo, gli artefatti e gli handle per rerun mirati.
I workflow figli vengono avviati dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
ramo o tag di rilascio più vecchio. Non esiste un input separato per il ref del workflow
Full Release Validation; scegli l'harness attendibile scegliendo il ref dell'esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per una prova esatta del commit su `main` in movimento;
gli SHA di commit grezzi non possono essere ref di dispatch del workflow, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il ramo temporaneo fissato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: il percorso live e Docker OpenAI/core critico per il rilascio più veloce
- `stable`: minimum più copertura stabile di provider/backend per l'approvazione del rilascio
- `full`: stable più ampia copertura advisory di provider/media

Usa `run_release_soak=true` con `stable` quando le lane bloccanti per il rilascio sono
verdi e vuoi l'esecuzione esaustiva live/E2E, il percorso di rilascio Docker e
lo sweep limitato di sopravvivenza all'upgrade pubblicato prima della promozione. Questo sweep copre
gli ultimi quattro pacchetti stabili più le baseline fissate `2026.4.23` e `2026.5.2`
più la copertura precedente `2026.4.15`, con baseline duplicate rimosse e
ogni baseline suddivisa nel proprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere il ref di destinazione
una volta come `release-package-under-test` e riutilizza quell'artefatto nei controlli cross-OS,
Package Acceptance e Docker del percorso di rilascio quando il soak viene eseguito. Questo mantiene
tutte le macchine rivolte ai pacchetti sugli stessi byte ed evita build ripetute del pacchetto.
Dopo che una beta è già su npm, imposta `release_package_spec=openclaw@YYYY.M.D-beta.N`
in modo che i controlli di rilascio scarichino una volta il pacchetto rilasciato, estraggano il suo SHA
sorgente di build da `dist/build-info.json` e riutilizzino quell'artefatto per le lane cross-OS,
Package Acceptance, Docker del percorso di rilascio e Telegram del pacchetto.
L'install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando è impostata la
variabile di repo/org, altrimenti `openai/gpt-5.4`, perché questa lane sta
provando installazione del pacchetto, onboarding, avvio del Gateway e un turno live dell'agente
anziché misurare il modello predefinito più lento. La matrice più ampia dei provider live
rimane il posto per la copertura specifica per modello.

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
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Non usare l'ombrello completo come primo rerun dopo una correzione mirata. Se una macchina
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo del pacchetto, il provider
del modello o la lane QA non riusciti per la prova successiva. Esegui di nuovo l'ombrello completo solo quando
la correzione ha cambiato l'orchestrazione condivisa del rilascio o ha reso obsolete le prove precedenti di tutte le macchine.
Il verificatore finale dell'ombrello ricontrolla gli id registrati delle esecuzioni dei workflow figli,
quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre non riuscito
`Verify full validation`.

Per un recupero limitato, passa `rerun_group` all'ombrello. `all` è la vera
esecuzione del candidato al rilascio, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio Plugin solo per rilascio, `release-checks` esegue ogni macchina di rilascio,
e i gruppi di rilascio più ristretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
I rerun mirati `npm-telegram` richiedono `release_package_spec` o
`npm_telegram_package_spec`; le esecuzioni full/all con `release_profile=full` usano
l'artefatto del pacchetto dei release-checks. I rerun cross-OS mirati possono aggiungere
`cross_os_suite_filter=windows/packaged-upgrade` o un altro filtro OS/suite.
I fallimenti QA dei release-checks sono advisory; un fallimento solo QA non
blocca la validazione del rilascio.

### Vitest

La macchina Vitest è il workflow figlio manuale `CI`. La CI manuale bypassa intenzionalmente
lo scoping delle modifiche e forza il grafo di test normale per il candidato al rilascio:
shard Linux Node, shard dei Plugin bundled, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS,
Android e i18n della Control UI.

Usa questa macchina per rispondere a "l'albero sorgente ha superato l'intera suite di test normale?"
Non è la stessa cosa della validazione del prodotto sul percorso di rilascio. Prove da conservare:

- riepilogo di `Full Release Validation` che mostra l'URL dell'esecuzione `CI` avviata
- esecuzione `CI` verde sull'esatto SHA di destinazione
- nomi degli shard falliti o lenti dai job CI quando si indagano regressioni
- artefatti dei tempi Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui la CI manuale direttamente solo quando il rilascio richiede una CI normale deterministica ma
non le macchine Docker, QA Lab, live, cross-OS o pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La macchina Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow `install-smoke`
in modalità rilascio. Valida il candidato al rilascio tramite ambienti Docker
pacchettizzati invece che solo con test a livello sorgente.

La copertura Docker del rilascio include:

- install smoke completo con lo smoke di installazione globale Bun lento abilitato
- preparazione/riutilizzo dell'immagine smoke Dockerfile root per SHA di destinazione, con job QR,
  root/Gateway e installer/Bun smoke eseguiti come shard install-smoke separati
- lane E2E del repository
- chunk Docker del percorso di rilascio: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- copertura OpenWebUI dentro il chunk `plugins-runtime-services` quando richiesta
- lane split di installazione/disinstallazione dei Plugin bundled
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura del modello live Docker quando i controlli di rilascio
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica
`.artifacts/docker-tests/` con log di lane, `summary.json`, `failures.json`,
tempi di fase, JSON del piano dello scheduler e comandi di rerun. Per un recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow riutilizzabile live/E2E invece di
rieseguire tutti i chunk di rilascio. I comandi di rerun generati includono i precedenti
`package_artifact_run_id` e gli input delle immagini Docker preparate quando disponibili, così una
lane non riuscita può riutilizzare lo stesso tarball e le stesse immagini GHCR.

### QA Lab

La macchina QA Lab fa anch'essa parte di `OpenClaw Release Checks`. È il gate di rilascio
per il comportamento agentico e a livello di canale, separato da Vitest e dai meccanismi
dei pacchetti Docker.

La copertura QA Lab del rilascio include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pack di parità agentica
- profilo QA Matrix live veloce usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease di credenziali CI Convex
- `pnpm qa:otel:smoke` quando la telemetria di rilascio richiede prova locale esplicita

Usa questa macchina per rispondere a "il rilascio si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artefatti per le lane parità, Matrix e Telegram
quando approvi il rilascio. La copertura completa Matrix rimane disponibile come
esecuzione QA-Lab manuale suddivisa in shard anziché come lane critica predefinita per il rilascio.

### Pacchetto

La macchina Package è il gate del prodotto installabile. È supportata da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, valida
l'inventario del pacchetto, registra la versione del pacchetto e SHA-256, e mantiene il
ref dell'harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw
- `source=ref`: pacchettizza un ramo `package_ref`, tag o SHA di commit completo attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` richiesto
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto del
pacchetto di rilascio preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, aggiornamento,
riavvio dell'aggiornamento con autenticazione configurata, installazione live di Skill ClawHub, pulizia delle dipendenze obsolete dei Plugin, fixture dei Plugin offline, aggiornamento dei Plugin e QA del pacchetto Telegram rispetto allo stesso
tarball risolto. I controlli di rilascio bloccanti usano la baseline predefinita dell'ultimo pacchetto pubblicato;
`run_release_soak=true` o
`release_profile=full` si espande a ogni baseline stabile pubblicata su npm da
`2026.4.23` fino a `latest` più le fixture dei problemi segnalati. Usa
Package Acceptance con `source=npm` per un candidato già distribuito, oppure
`source=ref`/`source=artifact` per un tarball npm locale basato su SHA prima della
pubblicazione. È il sostituto nativo di GitHub
per la maggior parte della copertura di pacchetto/aggiornamento che in precedenza richiedeva
Parallels. I controlli di rilascio cross-OS restano importanti per onboarding,
installer e comportamento di piattaforma specifici del sistema operativo, ma la convalida prodotto di pacchetto/aggiornamento dovrebbe
preferire Package Acceptance.

La checklist canonica per la convalida di aggiornamenti e Plugin è
[Test degli aggiornamenti e dei Plugin](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o di controllo rilascio dimostra una
modifica di installazione/aggiornamento di Plugin, pulizia doctor o migrazione di pacchetto pubblicato.
La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale `Update Migration` separato, non parte della Full Release CI.

La tolleranza legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci dell'inventario QA privato assenti dal tarball, `gateway install --wrapper` mancante, file di patch mancanti nella fixture git derivata dal tarball, `update.channel` persistito mancante, posizioni legacy dei record di installazione dei Plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Il pacchetto `2026.4.26` pubblicato può avvisare
per file di timbro dei metadati di build locali già distribuiti. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; quelle stesse lacune fanno fallire la
convalida del rilascio.

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

- `smoke`: lane rapide di installazione pacchetto/canale/agente, rete Gateway e ricaricamento
  della configurazione
- `package`: contratti di pacchetto per installazione/aggiornamento/riavvio/Plugin più prova live di installazione
  Skill ClawHub; è il valore predefinito dei controlli di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI
  e OpenWebUI
- `full`: chunk Docker del percorso di rilascio con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram di un candidato pacchetto, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` in Package Acceptance. Il workflow passa il
tarball `package-under-test` risolto nella lane Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per controlli post-pubblicazione.

## Automazione della pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Orchestri
i workflow trusted-publisher nell'ordine richiesto dal rilascio:

1. Esegue il checkout del tag di rilascio e ne risolve lo SHA del commit.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegue `pnpm plugins:sync:check`.
4. Esegue il dispatch di `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Esegue il dispatch di `Plugin ClawHub Release` con lo stesso ambito e SHA.
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
`OpenClaw Release Publish`, oppure esegui direttamente il dispatch del workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può essere anche lo SHA di commit completo
  a 40 caratteri del branch del workflow corrente per un preflight di sola convalida
- `preflight_only`: `true` solo per convalida/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale affinché il workflow riutilizzi
  il tarball preparato dalla run di preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; il valore predefinito è `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve già esistere
- `preflight_run_id`: id della run di preflight `OpenClaw NPM Release` riuscita;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: valore predefinito `all-publishable`; usa `selected` solo
  per lavori di riparazione mirati
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: valore predefinito `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione solo Plugin
- `wait_for_clawhub`: valore predefinito `false`, così la disponibilità npm non è bloccata dal
  sidecar ClawHub; imposta `true` solo quando il completamento del workflow deve includere
  il completamento di ClawHub

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o SHA di commit completo da convalidare. I controlli che richiedono segreti
  richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un
  tag di rilascio.
- `run_release_soak`: abilita soak esaustivo live/E2E, percorso di rilascio Docker e
  upgrade-survivor da tutte le versioni sui controlli di rilascio stabili/predefiniti. Viene forzato
  da `release_profile=full`.

Regole:

- I tag stabili e di correzione possono essere pubblicati su `beta` o `latest`
- I tag di prerelease beta possono essere pubblicati solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA di commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di convalida
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima che la pubblicazione continui

## Sequenza di rilascio npm stabile

Quando prepari un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA di commit completo del branch del workflow corrente
     per una prova generale di sola convalida del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul branch di rilascio, sul tag di rilascio o sullo SHA di commit completo
   quando vuoi CI normale più copertura live di prompt cache, Docker, QA Lab,
   Matrix e Telegram da un unico workflow manuale
4. Se hai intenzionalmente bisogno solo del grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sul ref di rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i Plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se il rilascio è arrivato su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se il rilascio è stato intenzionalmente pubblicato direttamente su `latest` e `beta`
   dovrebbe seguire immediatamente la stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   self-healing pianificata sposti `beta` più tardi

La mutazione del dist-tag vive nel repository privato per sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repository pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili all'operatore.

Se un maintainer deve ripiegare sull'autenticazione npm locale, esegui qualsiasi comando
1Password CLI (`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell dell'agente principale; tenerlo dentro tmux rende prompt,
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
