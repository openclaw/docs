---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida del rilascio o dell'accettazione del pacchetto
    - Cerchi informazioni sulla denominazione delle versioni e sulla cadenza
summary: Corsie di rilascio, checklist dell'operatore, ambienti di validazione, denominazione delle versioni e cadenza
title: Criteri di rilascio
x-i18n:
    generated_at: "2026-05-02T23:39:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: rilasci con tag pubblicati su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease pubblicati su npm `beta`
- dev: la testa mobile di `main`

## Nomi delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttivo stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali al mese o al giorno
- `latest` indica il rilascio stabile npm attualmente promosso
- `beta` indica il target di installazione beta corrente
- I rilasci stabili e correttivi stabili vengono pubblicati su npm `beta` per impostazione predefinita; gli operatori di rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l’app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell’app Mac riservati ai rilasci stabili salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Il rilascio stabile segue solo dopo la convalida della beta più recente
- I maintainer normalmente preparano i rilasci da un branch `release/YYYY.M.D` creato
  dal `main` corrente, così la convalida e le correzioni del rilascio non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e necessita di una correzione, i maintainer preparano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura dettagliata di rilascio, le approvazioni, le credenziali e le note di recupero sono
  riservate ai maintainer

## Checklist dell’operatore di rilascio

Questa checklist rappresenta la forma pubblica del flusso di rilascio. Le credenziali private,
la firma, la notarizzazione, il recupero dei dist-tag e i dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dal `main` corrente: scarica l’ultima versione, conferma che il commit target sia stato inviato,
   e conferma che la CI del `main` corrente sia abbastanza verde da poter creare un branch da lì.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate all’utente, committala, inviala, ed esegui rebase/pull
   ancora una volta prima di creare il branch.
3. Rivedi i record di compatibilità del rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   intenzionalmente mantenuta.
4. Crea `release/YYYY.M.D` dal `main` corrente; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Incrementa ogni posizione di versione richiesta per il tag previsto, esegui
   `pnpm plugins:sync` così i pacchetti Plugin pubblicabili condividono la versione di rilascio
   e i metadati di compatibilità, quindi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, e
   `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   è consentito usare uno SHA completo di 40 caratteri del branch di rilascio solo per la convalida
   preflight. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-release con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l’unico punto di ingresso manuale
   per i quattro grandi ambienti di test del rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio ed esegui di nuovo il file, canale, job del workflow, profilo pacchetto, provider o allowlist di modelli fallito più piccolo che
   dimostri la correzione. Esegui di nuovo l’ombrello completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   pubblica prima tutti i pacchetti Plugin pubblicabili su npm, pubblica lo stesso
   insieme su ClawHub per secondo, quindi promuove l’artefatto preflight npm di OpenClaw preparato
   con il dist-tag corrispondente. Dopo la pubblicazione, esegui l’accettazione pacchetto post-pubblicazione
   contro il pacchetto pubblicato `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta`. Se una prerelease inviata o pubblicata necessita di una correzione,
   prepara il numero di prerelease corrispondente successivo; non eliminare né riscrivere la vecchia
   prerelease.
10. Per stable, continua solo dopo che la beta o la release candidate verificata ha le
    prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso
    `OpenClaw Release Publish`, riutilizzando l’artefatto preflight riuscito tramite
    `preflight_run_id`; la preparazione del rilascio macOS stabile richiede anche
    il `.zip`, il `.dmg`, il `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l’E2E Telegram standalone
    opzionale per npm pubblicato quando serve una prova del canale post-pubblicazione,
    la promozione del dist-tag quando necessaria, le note di rilascio/prerelease GitHub dalla
    sezione completa corrispondente di `CHANGELOG.md`, e i passaggi di annuncio del rilascio.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così il TypeScript dei test resta
  coperto al di fuori del gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli più ampi sui cicli di importazione
  e sui confini architetturali sono verdi al di fuori del gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di rilascio
  `dist/*` attesi e il bundle della Control UI esistono per il passaggio di
  validazione del pacchetto
- Esegui `pnpm plugins:sync` dopo l’incremento della versione root e prima del tagging. Aggiorna
  le versioni dei pacchetti Plugin pubblicabili, i metadati di compatibilità
  peer/API di OpenClaw, i metadati di build e gli stub del changelog dei Plugin in modo che corrispondano alla versione di rilascio
  core. `pnpm plugins:sync:check` è il guardiano di rilascio non mutante;
  il workflow di pubblicazione fallisce prima di qualsiasi mutazione del registry se questo passaggio è stato
  dimenticato.
- Esegui il workflow manuale `Full Release Validation` prima dell’approvazione del rilascio per
  avviare tutte le test box pre-rilascio da un unico punto di ingresso. Accetta un branch,
  un tag o uno SHA completo di commit, esegue il dispatch manuale di `CI` ed esegue il dispatch di
  `OpenClaw Release Checks` per install smoke, package acceptance, suite del percorso di rilascio Docker,
  live/E2E, OpenWebUI, parità QA Lab, Matrix e corsie Telegram. Con
  `release_profile=full` e `rerun_group=all`, esegue anche Telegram E2E del pacchetto
  contro l’artefatto `release-package-under-test` dai controlli di rilascio. Fornisci
  `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso Telegram E2E deve dimostrare anche il pacchetto npm
  pubblicato. Fornisci
  `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance
  deve eseguire la propria matrice di pacchetto/aggiornamento contro il pacchetto npm distribuito invece
  dell’artefatto costruito dallo SHA. Fornisci
  `evidence_package_spec` quando il report di evidenza privato deve dimostrare che la
  validazione corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova su canale laterale
  per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref`
  per impacchettare un branch/tag/SHA `package_ref` attendibile con l’harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256 obbligatorio;
  oppure `source=artifact` per un tarball caricato da un’altra esecuzione di GitHub
  Actions. Il workflow risolve il candidato in
  `package-under-test`, riusa lo scheduler di rilascio Docker E2E contro quel
  tarball e può eseguire QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le
  corsie Docker selezionate includono `published-upgrade-survivor`, l’artefatto del pacchetto
  è il candidato e `published_upgrade_survivor_baseline` seleziona
  la baseline pubblicata.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: corsie di installazione/canale/agente, rete del Gateway e ricaricamento della configurazione
  - `package`: corsie pacchetto/aggiornamento/Plugin native dell’artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagente,
    ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura completa della CI normale
  per il candidato di rilascio. I dispatch manuali della CI bypassano lo scoping delle modifiche
  e forzano gli shard Linux Node, gli shard dei Plugin in bundle, i contratti dei canali,
  la compatibilità Node 22, `check`, `check-additional`, build smoke,
  controlli della documentazione, Skills Python, Windows, macOS, Android e le corsie i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando validi la telemetria di rilascio. Esercita
  QA-lab tramite un ricevitore OTLP/HTTP locale e verifica i nomi degli span delle tracce
  esportate, gli attributi limitati e la redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Eseguilo da `release/YYYY.M.D` (o da `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di rilascio e il `preflight_run_id` npm
  OpenClaw riuscito, e mantieni lo scope predefinito di pubblicazione dei Plugin
  `all-publishable` a meno che tu stia eseguendo intenzionalmente una riparazione mirata. Il
  workflow serializza la pubblicazione npm dei Plugin, la pubblicazione dei Plugin su ClawHub e la pubblicazione npm di OpenClaw
  così il pacchetto core non viene pubblicato prima dei suoi
  Plugin esternalizzati.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la corsia di parità mock QA Lab più il profilo
  live Matrix veloce e la corsia QA Telegram prima dell’approvazione del rilascio. Le corsie live
  usano l’ambiente `qa-live-shared`; Telegram usa anche lease di credenziali Convex CI.
  Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi l’inventario completo in parallelo
  di trasporto Matrix, media ed E2EE.
- La validazione runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il
  workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il percorso reale di rilascio npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  corsia in modo da non rallentare o bloccare la pubblicazione
- I controlli di rilascio che contengono segreti dovrebbero essere eseguiti tramite `Full Release
Validation` o dal workflow ref `main`/release, così la logica del workflow e
  i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA completo di commit purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Anche il preflight solo di validazione `OpenClaw NPM Release` accetta lo SHA completo
  a 40 caratteri del commit corrente del branch del workflow senza richiedere un tag pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner
  GitHub-hosted, mentre il percorso di validazione non mutante può usare i runner
  Blacksmith Linux più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti del workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la corsia separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell’approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione dal registry
  pubblicato in un prefisso temporaneo nuovo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione di Telegram ed E2E Telegram reale
  contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  I maintainer locali per esecuzioni una tantum possono omettere le variabili Convex e passare direttamente le tre
  credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L’automazione di rilascio dei maintainer ora usa preflight-poi-promozione:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere eseguita dallo stesso branch `main` o
    `release/YYYY.M.D` dell’esecuzione preflight riuscita
  - i rilasci npm stabili hanno come predefinito `beta`
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione dei dist-tag npm basata su token ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repo pubblico mantiene la pubblicazione solo OIDC
  - il `macOS Release` pubblico è solo di validazione; quando un tag esiste solo su un
    branch di rilascio ma il workflow viene eseguito da `main`, imposta
    `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve superare `preflight_run_id` e `validate_run_id`
    mac privati riusciti
  - i percorsi di pubblicazione reali promuovono artefatti preparati invece di ricostruirli
    di nuovo
- Per rilasci stabili di correzione come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così le correzioni di rilascio non possono lasciare silenziosamente le installazioni globali più vecchie sul
  payload stabile di base
- Il preflight di rilascio npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`,
  così non spediamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei Plugin pubblicati e
  i metadati dei pacchetti siano presenti nel layout del registry installato. Un rilascio che
  distribuisce payload runtime dei Plugin mancanti fallisce il verificatore postpublish e
  non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget npm pack `unpackedSize` sul
  tarball di aggiornamento candidato, così l’e2e dell’installer intercetta un ingrossamento accidentale del pacchetto
  prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest di timing delle estensioni o
  le matrici di test delle estensioni, rigenera e rivedi gli output della matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell’approvazione, così le note di rilascio non
  descrivono un layout CI obsoleto
- La prontezza del rilascio stabile macOS include anche le superfici dell’updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione
  - l’app pacchettizzata deve mantenere un bundle id non debug, un URL del feed Sparkle
    non vuoto e un `CFBundleVersion` pari o superiore al floor canonico di build Sparkle
    per quella versione di rilascio

## Test box di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da
un unico punto di ingresso. Per una prova di commit fissato su un branch in rapido movimento, usa l’
helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA
target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L’helper pusha `release-ci/<sha>-...`, esegue il dispatch di `Full Release Validation`
da quel branch con `ref=<sha>`, verifica che ogni workflow figlio `headSha`
corrisponda al target, poi elimina il branch temporaneo. Questo evita di dimostrare per errore
un’esecuzione figlia più recente di `main`.

Per la validazione di branch o tag di rilascio, eseguilo dal workflow ref `main`
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
l’E2E Telegram del pacchetto standalone quando `release_profile=full` con
`rerun_group=all` o quando `npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` poi distribuisce install smoke, controlli di release cross-OS, copertura live/E2E Docker
del percorso di release, Package Acceptance con QA del pacchetto Telegram, parità QA Lab,
Matrix live e Telegram live. Un’esecuzione completa è accettabile solo quando il
riepilogo `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve riuscire; fuori da full/all viene saltato
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il
riepilogo finale del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il responsabile della release può vedere il percorso critico attuale senza scaricare i log.
Consulta [Validazione completa della release](/it/reference/full-release-validation) per la
matrice completa delle fasi, i nomi esatti dei job del workflow, le differenze tra profilo stabile e completo, gli artefatti e gli handle di riesecuzione mirati.
I workflow figli vengono avviati dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
ramo o tag di release precedente. Non esiste un input separato per il ref del workflow Full Release Validation; scegli l’harness attendibile scegliendo il ref dell’esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per la prova di commit esatto su `main` mobile;
gli SHA di commit grezzi non possono essere ref di workflow dispatch, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il ramo temporaneo fissato.

Usa `release_profile` per selezionare l’ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker più rapido e critico per la release
- `stable`: minimum più copertura stabile di provider/backend per l’approvazione della release
- `full`: stable più ampia copertura consultiva di provider/media

`OpenClaw Release Checks` usa il ref attendibile del workflow per risolvere una sola volta il ref di destinazione come `release-package-under-test` e riutilizza quell’artefatto sia nei controlli Docker del percorso di release sia in Package Acceptance. Questo mantiene tutte le box rivolte al pacchetto sugli stessi byte ed evita build ripetute del pacchetto.
L’install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane
dimostra installazione del pacchetto, onboarding, avvio del gateway e un turno di agente live
anziché fare benchmarking del modello predefinito più lento. La matrice live provider
più ampia resta il luogo per la copertura specifica dei modelli.

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

Non usare l’ombrello completo come prima riesecuzione dopo una correzione mirata. Se una box
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo del pacchetto, il provider
del modello o la lane QA falliti per la prova successiva. Esegui di nuovo l’ombrello completo solo quando
la correzione ha modificato l’orchestrazione condivisa della release o ha reso obsolete le prove precedenti
su tutte le box. Il verificatore finale dell’ombrello ricontrolla gli id registrati delle esecuzioni dei workflow figli, quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre
`Verify full validation` fallito.

Per un recupero limitato, passa `rerun_group` all’ombrello. `all` è la vera
esecuzione del candidato di release, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio Plugin solo-release, `release-checks` esegue ogni box di release, e i gruppi di release più ristretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate di `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l’artefatto del pacchetto release-checks.

### Vitest

La box Vitest è il workflow figlio manuale `CI`. La CI manuale bypassa intenzionalmente
lo scoping delle modifiche e forza il grafo di test normale per il candidato di release: shard Linux Node, shard dei plugin integrati, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, build smoke, controlli docs, Python
skills, Windows, macOS, Android e i18n della Control UI.

Usa questa box per rispondere a "l’albero sorgente ha superato la suite di test normale completa?"
Non è la stessa cosa della validazione del prodotto nel percorso di release. Prove da conservare:

- riepilogo `Full Release Validation` che mostra l’URL dell’esecuzione `CI` avviata
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI durante l’indagine sulle regressioni
- artefatti di timing Vitest come `.artifacts/vitest-shard-timings.json` quando
  un’esecuzione richiede analisi delle prestazioni

Esegui direttamente la CI manuale solo quando la release richiede CI normale deterministica ma
non le box Docker, QA Lab, live, cross-OS o pacchetto:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La box Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow `install-smoke`
in modalità release. Valida il candidato di release tramite ambienti Docker pacchettizzati
invece che solo con test a livello sorgente.

La copertura Docker di release include:

- install smoke completo con lo smoke di installazione globale Bun lento abilitato
- preparazione/riutilizzo dell’immagine smoke del Dockerfile root per SHA di destinazione, con job smoke QR,
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
- lane divise di installazione/disinstallazione dei plugin integrati
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura modello live Docker quando i controlli di release
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di release carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
timing delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per il recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow live/E2E riutilizzabile invece di
rieseguire tutti i chunk di release. I comandi di riesecuzione generati includono il precedente
`package_artifact_run_id` e gli input delle immagini Docker preparate quando disponibili, così una
lane fallita può riutilizzare lo stesso tarball e le stesse immagini GHCR.

### QA Lab

Anche la box QA Lab fa parte di `OpenClaw Release Checks`. È il gate di release
per il comportamento agentico e a livello canale, separato da Vitest e dalle meccaniche del pacchetto Docker.

La copertura QA Lab di release include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pack di parità agentica
- profilo QA Matrix live rapido usando l’ambiente `qa-live-shared`
- lane QA Telegram live usando lease delle credenziali CI Convex
- `pnpm qa:otel:smoke` quando la telemetria di release richiede prova locale esplicita

Usa questa box per rispondere a "la release si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artefatti per le lane di parità, Matrix e Telegram
quando approvi la release. La copertura Matrix completa resta disponibile come
esecuzione QA-Lab shardata manuale anziché come lane critica di release predefinita.

### Pacchetto

La box Pacchetto è il gate del prodotto installabile. È supportata da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, valida
l’inventario del pacchetto, registra la versione del pacchetto e lo SHA-256, e mantiene il
ref dell’harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidato supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di release OpenClaw
- `source=ref`: pacchettizza un ramo, tag o SHA di commit completo `package_ref` attendibile
  con l’harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` richiesto
- `source=artifact`: riutilizza un `.tgz` caricato da un’altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l’artefatto
del pacchetto di release preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` e
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, aggiornamento, pulizia delle dipendenze obsolete dei plugin, fixture offline dei plugin, aggiornamento plugin e QA del pacchetto Telegram contro lo stesso tarball risolto. La matrice di upgrade copre ogni baseline stabile pubblicata su npm da `2026.4.23` a `latest`; usa
Package Acceptance con `source=npm` per un candidato già rilasciato, oppure
`source=ref`/`source=artifact` per un tarball npm locale supportato da SHA prima della
pubblicazione. È il sostituto nativo di GitHub
per gran parte della copertura package/update che in precedenza richiedeva
Parallels. I controlli di release cross-OS contano ancora per onboarding,
installer e comportamento di piattaforma specifici per OS, ma la validazione del prodotto package/update dovrebbe
preferire Package Acceptance.

La checklist canonica per la validazione di aggiornamenti e plugin è
[Testare aggiornamenti e plugin](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o release-check dimostra una
modifica di installazione/aggiornamento plugin, pulizia doctor o migrazione di pacchetto pubblicato.
La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale `Update Migration` separato, non parte della Full Release CI.

La tolleranza legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune di metadati già pubblicate
su npm: voci private dell’inventario QA mancanti dal tarball, `gateway install --wrapper`
mancante, file di patch mancanti nella fixture git derivata dal tarball,
`update.channel` persistito mancante, posizioni legacy dei record di installazione dei plugin,
persistenza mancante dei record di installazione marketplace e migrazione dei metadati di configurazione
durante `plugins update`. Il pacchetto `2026.4.26` pubblicato può avvisare
per i file stamp dei metadati di build locale già rilasciati. I pacchetti successivi
devono soddisfare i contratti di pacchetto moderni; quelle stesse lacune fanno fallire la
validazione della release.

Usa profili Package Acceptance più ampi quando la domanda di release riguarda un
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

- `smoke`: installazione rapida del pacchetto/canale/agente, rete gateway e lane di
  ricaricamento configurazione
- `package`: contratti di installazione/aggiornamento/plugin del pacchetto senza ClawHub live; questo è il valore predefinito dei release-check
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI e OpenWebUI
- `full`: chunk Docker del percorso di release con OpenWebUI
- `custom`: lista esatta di `docker_lanes` per riesecuzioni mirate

Per la prova Telegram del candidato pacchetto, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il tarball
`package-under-test` risolto alla corsia Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione della pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Orquestra
i workflow trusted-publisher nell'ordine richiesto dal rilascio:

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

Usa i workflow di livello inferiore `Plugin NPM Release` e `Plugin ClawHub Release`
solo per attività mirate di riparazione o ripubblicazione. Per una riparazione di Plugin selezionata, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure avvia direttamente il workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere l'attuale
  SHA completo di 40 caratteri del commit del ramo workflow per un preflight
  di sola convalida
- `preflight_only`: `true` solo per convalida/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale affinché il workflow riutilizzi
  il tarball preparato dall'esecuzione di preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; predefinito a `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve esistere già
- `preflight_run_id`: id dell'esecuzione di preflight riuscita di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: predefinito a `all-publishable`; usa `selected` solo
  per attività mirate di riparazione
- `plugins`: nomi dei pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: predefinito a `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione solo per Plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: ramo, tag o SHA completo del commit da convalidare. I controlli con segreti
  richiedono che il commit risolto sia raggiungibile da un ramo OpenClaw o da un
  tag di rilascio.

Regole:

- I tag stabili e di correzione possono essere pubblicati su `beta` o `latest`
- I tag prerelease beta possono essere pubblicati solo su `beta`
- Per `OpenClaw NPM Release`, l'input con SHA completo del commit è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  di sola convalida
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima di continuare la pubblicazione

## Sequenza di rilascio npm stabile

Quando si prepara un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA completo del commit del ramo workflow corrente
     per una prova a secco di sola convalida del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul ramo di rilascio, sul tag di rilascio o sullo
   SHA completo del commit quando vuoi la normale CI più copertura live per prompt cache,
   Docker, QA Lab, Matrix e Telegram da un unico workflow manuale
4. Se intenzionalmente ti serve solo il grafo deterministico dei test normali, esegui invece il
   workflow manuale `CI` sul riferimento di rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`,
   e il `preflight_run_id` salvato; pubblica i Plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se il rilascio è arrivato su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se il rilascio è stato pubblicato intenzionalmente direttamente su `latest` e `beta`
   deve puntare subito alla stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   pianificata di autoriparazione sposti `beta` più tardi

La mutazione del dist-tag vive nel repository privato per sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repository pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

Se un manutentore deve ripiegare sull'autenticazione npm locale, esegui qualsiasi comando
CLI (`op`) di 1Password solo dentro una sessione tmux dedicata. Non chiamare `op`
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

I manutentori usano la documentazione privata dei rilasci in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.

## Correlati

- [Canali di rilascio](/it/install/development-channels)
