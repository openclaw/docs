---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della validazione del rilascio o dell'accettazione del pacchetto
    - Ricerca della denominazione delle versioni e della cadenza
summary: Canali di rilascio, lista di controllo per l’operatore, ambienti di validazione, denominazione delle versioni e cadenza
title: Criteri di rilascio
x-i18n:
    generated_at: "2026-05-05T06:18:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: rilasci con tag pubblicati su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease pubblicati su npm `beta`
- dev: la punta mobile di `main`

## Denominazione delle versioni

- Versione di rilascio stabile: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio correttivo stabile: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l'attuale rilascio npm stabile promosso
- `beta` indica l'attuale destinazione di installazione beta
- I rilasci stabili e correttivi stabili vengono pubblicati su npm `beta` per impostazione predefinita; gli operatori di rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stabile di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  i rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, con
  build/firma/notarizzazione dell'app Mac riservate allo stabile salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima dalla beta
- Lo stabile segue solo dopo la convalida dell'ultima beta
- I maintainer normalmente creano i rilasci da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la convalida del rilascio e le correzioni non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- Procedura di rilascio dettagliata, approvazioni, credenziali e note di ripristino sono
  riservate ai maintainer

## Checklist per l'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall'attuale `main`: scarica l'ultima versione, conferma che il commit di destinazione sia stato inviato
   e conferma che la CI dell'attuale `main` sia abbastanza verde da poterne creare un branch.
2. Riscrivi la sezione superiore di `CHANGELOG.md` dalla cronologia reale dei commit con
   `/changelog`, mantieni le voci orientate agli utenti, crea un commit, invialo ed esegui di nuovo rebase/pull
   prima di creare il branch.
3. Rivedi i record di compatibilità del rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di aggiornamento resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.D` dall'attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, esegui
   `pnpm plugins:sync` affinché i pacchetti Plugin pubblicabili condividano la versione di rilascio
   e i metadati di compatibilità, quindi esegui la verifica preliminare deterministica locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` e
   `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   è consentito uno SHA completo di 40 caratteri del branch di rilascio per la sola convalida
   preliminare. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-rilascio con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico punto di ingresso manuale
   per le quattro grandi box di test di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio e riesegui il file,
   canale, job del workflow, profilo del pacchetto, provider o elenco di modelli consentiti più piccolo che
   dimostri la correzione. Riesegui l'ombrello completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per la beta, crea il tag `vYYYY.M.D-beta.N`, quindi esegui `OpenClaw Release Publish` dal
   branch `release/YYYY.M.D` corrispondente. Verifica `pnpm plugins:sync:check`,
   pubblica prima tutti i pacchetti Plugin pubblicabili su npm, pubblica poi lo stesso
   insieme su ClawHub come tarball npm-pack ClawPack, quindi promuove l'artefatto
   preliminare npm OpenClaw preparato con il dist-tag corrispondente. Dopo
   la pubblicazione, esegui l'accettazione del pacchetto post-pubblicazione
   contro il pacchetto `openclaw@YYYY.M.D-beta.N` o
   `openclaw@beta` pubblicato. Se una prerelease inviata o pubblicata richiede una correzione,
   crea il numero di prerelease corrispondente successivo; non eliminare o riscrivere la vecchia
   prerelease.
10. Per lo stabile, continua solo dopo che la beta verificata o il candidato al rilascio ha le
    prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso
    `OpenClaw Release Publish`, riutilizzando l'artefatto preliminare riuscito tramite
    `preflight_run_id`; la prontezza del rilascio macOS stabile richiede anche i
    pacchetti `.zip`, `.dmg`, `.dSYM.zip` e `appcast.xml` aggiornato su `main`.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram
    opzionale su npm pubblicato standalone quando serve una prova del canale post-pubblicazione,
    la promozione dei dist-tag quando necessaria, le note di release/prerelease GitHub dalla
    sezione `CHANGELOG.md` corrispondente completa e i passaggi di annuncio del rilascio.

## Verifica preliminare del rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così TypeScript dei test rimane coperto al di fuori del gate locale più rapido `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli più ampi sui cicli di importazione e sui confini architetturali risultano verdi al di fuori del gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti di rilascio `dist/*` attesi e il bundle della Control UI esistono per il passaggio di convalida del pacchetto
- Esegui `pnpm plugins:sync` dopo l'aumento della versione root e prima del tagging. Aggiorna le versioni dei pacchetti plugin pubblicabili, i metadati di compatibilità peer/API di OpenClaw, i metadati di build e gli stub dei changelog dei plugin in modo che corrispondano alla versione di rilascio core. `pnpm plugins:sync:check` è la guardia di rilascio non mutante; il workflow di pubblicazione fallisce prima di qualsiasi mutazione del registro se questo passaggio è stato dimenticato.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per avviare tutti i test box pre-release da un unico punto di ingresso. Accetta un branch, un tag o uno SHA di commit completo, effettua il dispatch manuale di `CI` ed effettua il dispatch di `OpenClaw Release Checks` per smoke di installazione, accettazione del pacchetto, controlli cross-OS del pacchetto, parità QA Lab, Matrix e corsie Telegram. Le esecuzioni stabili/predefinite mantengono il soak esaustivo live/E2E e del percorso di rilascio Docker dietro `run_release_soak=true`; `release_profile=full` forza l'attivazione del soak. Con `release_profile=full` e `rerun_group=all`, esegue anche Telegram E2E del pacchetto contro l'artefatto `release-package-under-test` dai controlli di rilascio. Fornisci `npm_telegram_package_spec` dopo la pubblicazione quando lo stesso Telegram E2E deve provare anche il pacchetto npm pubblicato. Fornisci `package_acceptance_package_spec` dopo la pubblicazione quando Package Acceptance deve eseguire la propria matrice pacchetto/aggiornamento contro il pacchetto npm distribuito invece dell'artefatto generato dallo SHA. Fornisci `evidence_package_spec` quando il report di evidenza privato deve provare che la convalida corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E. Esempio: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova su canale laterale per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref` per impacchettare un branch/tag/SHA `package_ref` attendibile con l'harness `workflow_ref` corrente; `source=url` per un tarball HTTPS con SHA-256 richiesto; oppure `source=artifact` per un tarball caricato da un'altra esecuzione GitHub Actions. Il workflow risolve il candidato in `package-under-test`, riutilizza lo scheduler di rilascio Docker E2E contro quel tarball e può eseguire QA Telegram contro lo stesso tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le corsie Docker selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto è il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato sia come CLI installata sia come package-under-test, così esercita il percorso di riavvio gestito del comando di aggiornamento del candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: corsie di installazione/canale/agente, rete Gateway e ricaricamento della configurazione
  - `package`: corsie pacchetto/aggiornamento/riavvio/plugin native dell'artefatto senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagente, ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo la copertura completa della CI normale per il candidato rilascio. I dispatch manuali della CI aggirano lo scoping delle modifiche e forzano gli shard Linux Node, gli shard dei plugin in bundle, i contratti dei canali, la compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Skills Python, Windows, macOS, Android e corsie i18n della Control UI.
  Esempio: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Esegui `pnpm qa:otel:smoke` quando convalidi la telemetria di rilascio. Esercita QA-lab tramite un ricevitore OTLP/HTTP locale e verifica i nomi degli span delle trace esportate, gli attributi limitati e la redazione di contenuti/identificatori senza richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il tag esiste. Effettua il dispatch da `release/YYYY.M.D` (o da `main` quando pubblichi un tag raggiungibile da main), passa il tag di rilascio e il `preflight_run_id` npm OpenClaw riuscito, e mantieni l'ambito predefinito di pubblicazione dei plugin `all-publishable` salvo che tu stia eseguendo intenzionalmente una riparazione mirata. Il workflow serializza pubblicazione npm dei plugin, pubblicazione ClawHub dei plugin e pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato prima dei suoi plugin esternalizzati.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la corsia di parità mock QA Lab più il profilo Matrix live rapido e la corsia QA Telegram prima dell'approvazione del rilascio. Le corsie live usano l'ambiente `qa-live-shared`; Telegram usa anche lease di credenziali Convex CI. Esegui il workflow manuale `QA-Lab - All Lanes` con `matrix_profile=all` e `matrix_shards=true` quando vuoi l'inventario completo di trasporto, media ed E2EE Matrix in parallelo.
- La convalida runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il workflow riutilizzabile `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il percorso reale di rilascio npm breve, deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella propria corsia, così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che contengono segreti devono essere dispatchati tramite `Full Release Validation` o dal workflow ref `main`/release, così la logica del workflow e i segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA di commit completo purché il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Anche il preflight solo di convalida `OpenClaw NPM Release` accetta lo SHA di commit completo a 40 caratteri del branch workflow corrente senza richiedere un tag pushato
- Quel percorso SHA è solo di convalida e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner GitHub-hosted, mentre il percorso di convalida non mutante può usare i runner Linux Blacksmith più grandi
- Quel workflow esegue `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando entrambi i secret workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight del rilascio npm non attende più la corsia separata dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (o la versione beta/correzione corrispondente) per verificare il percorso di installazione dal registro pubblicato in un prefisso temporaneo nuovo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` per verificare onboarding del pacchetto installato, configurazione Telegram e Telegram E2E reale contro il pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease. Le esecuzioni una tantum locali dei maintainer possono omettere le variabili Convex e passare direttamente le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta completo post-pubblicazione da una macchina di maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L'helper esegue la convalida npm update/fresh-target su Parallels, effettua il dispatch di `NPM Telegram Beta E2E`, esegue il polling dell'esecuzione esatta del workflow, scarica l'artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-poi-promozione:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere dispatchata dallo stesso branch `main` o `release/YYYY.M.D` dell'esecuzione preflight riuscita
  - i rilasci npm stabili usano `beta` come valore predefinito
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione del dist-tag npm basata su token ora vive in `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` per sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il repo pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di convalida; quando un tag esiste solo su un branch di rilascio ma il workflow viene dispatchato da `main`, imposta `public_release_branch=release/YYYY.M.D`
  - la pubblicazione mac privata reale deve superare `preflight_run_id` e `validate_run_id` mac privati riusciti
  - i percorsi di pubblicazione reale promuovono gli artefatti preparati invece di ricostruirli di nuovo
- Per i rilasci stabili di correzione come `YYYY.M.D-N`, il verificatore post-pubblicazione controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`, così le correzioni di rilascio non possono lasciare silenziosamente installazioni globali più vecchie sul payload stabile di base
- Il preflight del rilascio npm fallisce in modo chiuso salvo che il tarball includa sia `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto, così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei plugin pubblicati e i metadati dei pacchetti siano presenti nel layout del registro installato. Un rilascio che distribuisce payload runtime dei plugin mancanti fallisce il verificatore postpublish e non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` del pacchetto npm sul tarball di aggiornamento candidato, così l'e2e dell'installer intercetta l'ingrossamento accidentale del pacchetto prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest di timing delle estensioni o le matrici di test delle estensioni, rigenera e rivedi gli output matrice `plugin-prerelease-extension-shard` di proprietà del planner da `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di rilascio non descrivono un layout CI obsoleto
- La readiness del rilascio stabile macOS include anche le superfici dell'updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un URL feed Sparkle non vuoto e un `CFBundleVersion` pari o superiore al floor canonico della build Sparkle per quella versione di rilascio

## Test box di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-release da un unico punto di ingresso. Per una prova di commit fissato su un branch in rapido movimento, usa l'helper in modo che ogni workflow figlio venga eseguito da un branch temporaneo fissato allo SHA target:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper pusha `release-ci/<sha>-...`, effettua il dispatch di `Full Release Validation` da quel branch con `ref=<sha>`, verifica che ogni `headSha` dei workflow figli corrisponda al target, quindi elimina il branch temporaneo. Questo evita di provare per errore un'esecuzione figlia di `main` più recente.

Per la convalida di branch o tag di rilascio, eseguilo dal workflow ref `main` attendibile e passa il branch o tag di rilascio come `ref`:

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
esegue il dispatch del pacchetto Telegram E2E autonomo quando `release_profile=full` con
`rerun_group=all` o quando `npm_telegram_package_spec` è impostato. `OpenClaw Release
Checks` quindi distribuisce install smoke, controlli di rilascio cross-OS, copertura live/E2E Docker
del percorso di rilascio quando il soak è abilitato, Package Acceptance con QA del pacchetto Telegram, parità QA Lab, Matrix live e Telegram live. Un'esecuzione completa è accettabile solo quando il
riepilogo di `Full Release Validation`
mostra `normal_ci` e `release_checks` come riusciti. In modalità full/all,
anche il figlio `npm_telegram` deve riuscire; fuori da full/all viene saltato
a meno che non sia stato fornito un `npm_telegram_package_spec` pubblicato. Il riepilogo finale del
verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il responsabile del rilascio
può vedere il percorso critico corrente senza scaricare i log.
Consulta [Validazione completa del rilascio](/it/reference/full-release-validation) per la
matrice completa degli stadi, i nomi esatti dei job del workflow, le differenze
tra profilo stable e full, gli artefatti e gli handle per riesecuzioni mirate.
I workflow figli vengono eseguiti dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
ramo o tag di rilascio precedente. Non esiste un input separato per il ref del workflow Full Release Validation; scegli l'harness attendibile scegliendo il ref di esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per la prova esatta di commit su `main` mobile;
gli SHA grezzi dei commit non possono essere ref di dispatch del workflow, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il ramo temporaneo fissato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso live e Docker OpenAI/core critico per il rilascio più veloce
- `stable`: minimum più copertura provider/backend stable per l'approvazione del rilascio
- `full`: stable più ampia copertura consultiva provider/media

Usa `run_release_soak=true` con `stable` quando le lane bloccanti per il rilascio sono
verdi e vuoi l'esauriente sweep live/E2E, del percorso di rilascio Docker e
limitato dei sopravvissuti agli upgrade pubblicati prima della promozione. Quello sweep copre
gli ultimi quattro pacchetti stable più le baseline fissate `2026.4.23` e `2026.5.2`
più la copertura precedente `2026.4.15`, con le baseline duplicate rimosse e
ogni baseline suddivisa nel proprio job runner Docker. `full` implica
`run_release_soak=true`.

`OpenClaw Release Checks` usa il ref attendibile del workflow per risolvere una sola volta il ref di destinazione
come `release-package-under-test` e riutilizza quell'artefatto nei controlli cross-OS,
Package Acceptance e Docker del percorso di rilascio quando il soak viene eseguito. Questo mantiene
tutti i box rivolti al pacchetto sugli stessi byte ed evita build ripetute del pacchetto.
Lo smoke di installazione OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane
dimostra installazione del pacchetto, onboarding, avvio del Gateway e un turno live dell'agente
anziché fare benchmark del modello predefinito più lento. La matrice live provider
più ampia resta il posto per la copertura specifica del modello.

Usa queste varianti in base allo stadio del rilascio:

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

Non usare l'ombrello completo come prima riesecuzione dopo una correzione mirata. Se un box
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo del pacchetto, il provider
del modello o la lane QA falliti per la prova successiva. Esegui di nuovo l'ombrello completo solo quando
la correzione ha modificato l'orchestrazione condivisa del rilascio o ha reso obsolete le prove precedenti
di tutti i box. Il verificatore finale dell'ombrello ricontrolla gli id registrati delle esecuzioni dei workflow figli,
quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre
`Verify full validation` fallito.

Per un recupero limitato, passa `rerun_group` all'ombrello. `all` è la vera
esecuzione del candidato al rilascio, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio plugin esclusivo del rilascio, `release-checks` esegue ogni box di rilascio
e i gruppi di rilascio più stretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate `npm-telegram` richiedono `npm_telegram_package_spec`; le esecuzioni full/all
con `release_profile=full` usano l'artefatto del pacchetto di release-checks. Le riesecuzioni
cross-OS mirate possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti QA di release-check sono consultivi; un fallimento solo QA
non blocca la validazione del rilascio.

### Vitest

Il box Vitest è il workflow figlio manuale `CI`. La CI manuale aggira intenzionalmente
lo scoping delle modifiche e forza il normale grafo di test per il candidato al rilascio:
shard Linux Node, shard dei Plugin inclusi, contratti dei canali, compatibilità Node 22,
`check`, `check-additional`, build smoke, controlli docs, Skills Python, Windows, macOS,
Android e i18n della Control UI.

Usa questo box per rispondere a "l'albero sorgente ha superato la suite completa di test normale?"
Non è la stessa cosa della validazione di prodotto del percorso di rilascio. Prove da conservare:

- riepilogo di `Full Release Validation` che mostra l'URL dell'esecuzione `CI` eseguita
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI quando si indagano regressioni
- artefatti di temporizzazione Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui direttamente la CI manuale solo quando il rilascio richiede CI normale deterministica ma
non i box Docker, QA Lab, live, cross-OS o package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Il box Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow
`install-smoke` in modalità rilascio. Valida il candidato al rilascio tramite ambienti Docker
pacchettizzati anziché solo test a livello di sorgente.

La copertura Docker del rilascio include:

- install smoke completo con lo smoke lento di installazione globale Bun abilitato
- preparazione/riutilizzo dell'immagine smoke del Dockerfile root per SHA di destinazione, con job smoke QR,
  root/gateway e installer/Bun eseguiti come shard install-smoke separati
- lane E2E del repository
- chunk Docker del percorso di rilascio: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- copertura OpenWebUI dentro il chunk `plugins-runtime-services` quando richiesta
- lane separate di installazione/disinstallazione dei Plugin inclusi
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura del modello live Docker quando i release check
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
tempi delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per il recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow riutilizzabile live/E2E invece di
rieseguire tutti i chunk di rilascio. I comandi di riesecuzione generati includono il precedente
`package_artifact_run_id` e gli input delle immagini Docker preparate quando disponibili, così una
lane fallita può riutilizzare lo stesso tarball e le immagini GHCR.

### QA Lab

Anche il box QA Lab fa parte di `OpenClaw Release Checks`. È il gate di rilascio
del comportamento agentico e a livello di canale, separato da Vitest e dalla
meccanica dei pacchetti Docker.

La copertura QA Lab del rilascio include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live veloce usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease di credenziali CI Convex
- `pnpm qa:otel:smoke` quando la telemetria del rilascio richiede una prova locale esplicita

Usa questo box per rispondere a "il rilascio si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artefatti per le lane di parità, Matrix e Telegram
quando approvi il rilascio. La copertura Matrix completa resta disponibile come esecuzione manuale
QA-Lab suddivisa in shard anziché come lane predefinita critica per il rilascio.

### Pacchetto

Il box Pacchetto è il gate del prodotto installabile. È supportato da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, valida
l'inventario del pacchetto, registra la versione del pacchetto e lo SHA-256 e mantiene il
ref dell'harness del workflow separato dal ref sorgente del pacchetto.

Fonti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta di rilascio OpenClaw
- `source=ref`: crea un pacchetto da un ramo, tag o SHA completo di commit `package_ref` attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS con `package_sha256` obbligatorio
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'
artefatto del pacchetto di rilascio preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene migrazione, aggiornamento,
riavvio aggiornamento con autenticazione configurata, pulizia di dipendenze Plugin obsolete, fixture Plugin offline, aggiornamento Plugin e QA del pacchetto Telegram contro lo stesso
tarball risolto. I release check bloccanti usano la baseline predefinita dell'ultimo pacchetto pubblicato;
`run_release_soak=true` o
`release_profile=full` si espande a ogni baseline stable pubblicata su npm da
`2026.4.23` fino a `latest` più le fixture degli issue segnalati. Usa
Package Acceptance con `source=npm` per un candidato già distribuito, oppure
`source=ref`/`source=artifact` per un tarball npm locale basato su SHA prima della
pubblicazione. È il sostituto nativo GitHub
per la maggior parte della copertura package/update che in precedenza richiedeva
Parallels. I release check cross-OS restano importanti per onboarding, installer
e comportamento della piattaforma specifici del sistema operativo, ma la validazione del prodotto package/update dovrebbe
preferire Package Acceptance.

La checklist canonica per la validazione di aggiornamenti e Plugin è
[Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o release-check dimostra una
installazione/aggiornamento Plugin, pulizia doctor o modifica di migrazione di pacchetto pubblicato.
La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stable `2026.4.23+` è
un workflow manuale `Update Migration` separato, non parte della Full Release CI.

La tolleranza legacy per l'accettazione dei pacchetti ha intenzionalmente una finestra temporale limitata. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci private dell'inventario QA mancanti dal tarball, `gateway install --wrapper`
mancante, file patch mancanti nella fixture git derivata dal tarball, `update.channel`
persistito mancante, posizioni legacy dei record di installazione dei plugin,
persistenza mancante dei record di installazione del marketplace e migrazione dei metadati
di configurazione durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può emettere avvisi
per i file di marcatura dei metadati di build locale già distribuiti. I pacchetti successivi
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

- `smoke`: percorsi rapidi di installazione pacchetto/canale/agent, rete Gateway e ricaricamento
  della configurazione
- `package`: contratti di installazione/aggiornamento/riavvio/pacchetto plugin senza ClawHub
  live; è il valore predefinito del controllo di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI
  e OpenWebUI
- `full`: blocchi del percorso di rilascio Docker con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram di un pacchetto candidato, abilita `telegram_mode=mock-openai` o
`telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il tarball
`package-under-test` risolto nel percorso Telegram; il workflow Telegram autonomo
accetta ancora una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione della pubblicazione del rilascio

`OpenClaw Release Publish` è il normale punto di ingresso mutante per la pubblicazione. Orchestra
i workflow trusted-publisher nell'ordine richiesto dal rilascio:

1. Esegue il checkout del tag di rilascio e ne risolve lo SHA del commit.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegue `pnpm plugins:sync:check`.
4. Invia `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Invia `Plugin ClawHub Release` con lo stesso ambito e lo stesso SHA.
6. Invia `OpenClaw NPM Release` con il tag di rilascio, il dist-tag npm e
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
solo per interventi mirati di riparazione o ripubblicazione. Per la riparazione di un plugin selezionato, passa
`plugin_publish_scope=selected` e `plugins=@openclaw/name` a
`OpenClaw Release Publish`, oppure invia direttamente il workflow figlio quando il
pacchetto OpenClaw non deve essere pubblicato.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA
  completo di 40 caratteri del commit del ramo workflow corrente per un preflight
  di sola validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il workflow riusa
  il tarball preparato dall'esecuzione di preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; il valore predefinito è `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve esistere già
- `preflight_run_id`: id dell'esecuzione di preflight `OpenClaw NPM Release` riuscita;
  obbligatorio quando `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: valore predefinito `all-publishable`; usa `selected` solo
  per interventi mirati di riparazione
- `plugins`: nomi dei pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: valore predefinito `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione per soli plugin

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: ramo, tag o SHA completo del commit da validare. I controlli con segreti
  richiedono che il commit risolto sia raggiungibile da un ramo OpenClaw o da un
  tag di rilascio.
- `run_release_soak`: abilita il soak esaustivo live/E2E, del percorso di rilascio Docker e
  dell'upgrade-survivor all-since sui controlli di rilascio stabili/predefiniti. È forzato
  da `release_profile=full`.

Regole:

- I tag stabili e di correzione possono pubblicare su `beta` o `latest`
- I tag prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input dello SHA completo del commit è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima che la pubblicazione prosegua

## Sequenza di rilascio npm stabile

Quando prepari un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA completo del commit del ramo workflow
     corrente per un dry run di sola validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso prima beta, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul ramo di rilascio, sul tag di rilascio o sullo SHA
   completo del commit quando vuoi CI normale più copertura live di prompt cache, Docker, QA Lab,
   Matrix e Telegram da un unico workflow manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sul ref di rilascio
5. Salva il `preflight_run_id` riuscito
6. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`
   e il `preflight_run_id` salvato; pubblica i plugin esternalizzati su npm
   e ClawHub prima di promuovere il pacchetto npm OpenClaw
7. Se il rilascio è arrivato su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
8. Se il rilascio ha pubblicato intenzionalmente direttamente su `latest` e `beta`
   deve seguire subito la stessa build stabile, usa lo stesso workflow privato
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua sincronizzazione
   programmata di autoriparazione sposti `beta` in seguito

La mutazione dei dist-tag vive nel repo privato per sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene documentati e visibili agli operatori sia il percorso di pubblicazione diretta
sia il percorso di promozione prima beta.

Se un maintainer deve ripiegare sull'autenticazione npm locale, esegui qualsiasi comando
CLI 1Password (`op`) solo dentro una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agent; tenerlo dentro tmux rende prompt,
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

I maintainer usano la documentazione privata del rilascio in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.

## Correlati

- [Canali di rilascio](/it/install/development-channels)
