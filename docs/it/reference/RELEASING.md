---
read_when:
    - Ricerca delle definizioni dei canali di release pubblici
    - Esecuzione della convalida di rilascio o dell’accettazione del pacchetto
    - In cerca della denominazione delle versioni e della cadenza
summary: Canali di rilascio, checklist dell'operatore, riquadri di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-06-27T18:11:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: rilasci con tag che pubblicano su npm `beta` per impostazione predefinita, o su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: l'head mobile di `main`

## Denominazione delle versioni

- Versione di rilascio stable: `YYYY.M.PATCH`
  - Tag Git: `vYYYY.M.PATCH`
- Versione di rilascio correttivo stable: `YYYY.M.PATCH-N`
  - Tag Git: `vYYYY.M.PATCH-N`
- Versione di prerelease beta: `YYYY.M.PATCH-beta.N`
  - Tag Git: `vYYYY.M.PATCH-beta.N`
- Non aggiungere zeri iniziali al mese o alla patch
- A partire dall'aggiornamento del processo di rilascio di giugno 2026, il terzo componente è un
  numero sequenziale mensile del release train, non un giorno di calendario. I rilasci stable e beta
  determinano il train corrente; i tag solo alpha non consumano né
  avanzano il numero di patch beta/stable. I tag e le versioni npm precedenti all'aggiornamento mantengono
  i loro nomi esistenti e restano validi; l'automazione dei rilasci continua a
  confrontarli per anno, mese, patch, canale e numero di prerelease o correzione.
- Le build alpha/nightly usano il successivo patch train non rilasciato e incrementano solo
  `alpha.N` per build ripetute. Una volta che quella patch ha una beta, le nuove build alpha
  passano alla patch successiva. Ignora i tag legacy solo alpha con numeri di patch
  più alti quando selezioni un train beta o stable.
- Le versioni npm sono immutabili. Se un tag beta è già stato pubblicato, non
  eliminarlo, ripubblicarlo o riutilizzarlo; crea il numero beta successivo o la patch
  mensile successiva. Poiché `2026.6.5-beta.1` è già stato pubblicato durante la
  transizione, i release train di giugno 2026 devono usare la patch `5` o superiore. Non
  pubblicare nuovi train stable o beta di giugno 2026 come `2026.6.2`, `2026.6.3` o
  `2026.6.4`.
- Dopo la stable `2026.6.5`, il successivo nuovo train beta è `2026.6.6-beta.1`, anche
  se esistono già tag automatizzati solo alpha con numeri di patch più alti.
- `latest` indica l'attuale rilascio npm stable promosso
- `beta` indica l'attuale destinazione di installazione beta
- I rilasci stable e correttivi stable pubblicano su npm `beta` per impostazione predefinita; gli operatori di rilascio possono indirizzare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni rilascio stable di OpenClaw distribuisce insieme il pacchetto npm, l'app macOS e gli installer firmati
  di Windows Hub; i rilasci beta normalmente convalidano e pubblicano
  prima il percorso npm/pacchetto, con build/firma/notarizzazione/promozione dell'app nativa
  riservate alla stable salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- La stable segue solo dopo la convalida dell'ultima beta
- I maintainer normalmente creano i rilasci da un branch `release/YYYY.M.PATCH` creato
  dall'attuale `main`, in modo che la convalida e le correzioni del rilascio non blocchino il nuovo
  sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura dettagliata di rilascio, approvazioni, credenziali e note di ripristino sono
  riservate ai maintainer

## Checklist dell'operatore di rilascio

Questa checklist è la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall'attuale `main`: esegui il pull dell'ultima versione, conferma che il commit di destinazione sia stato pushato
   e conferma che la CI dell'attuale `main` sia sufficientemente verde per creare un branch da lì.
2. Genera la sezione superiore di `CHANGELOG.md` dai PR uniti e da tutti i commit diretti
   dall'ultimo tag di rilascio raggiungibile. Mantieni le voci orientate all'utente,
   elimina i duplicati tra voci di PR e commit diretti sovrapposte, committa la riscrittura, pushala
   ed esegui rebase/pull ancora una volta prima di creare il branch.
3. Rivedi i record di compatibilità del rilascio in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta
   solo quando il percorso di upgrade resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.PATCH` dall'attuale `main`; non svolgere il normale lavoro di rilascio
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, quindi esegui
   `pnpm release:prep`. Aggiorna le versioni dei Plugin, l'inventario dei Plugin, lo schema di configurazione,
   i metadati della configurazione dei canali bundled, la baseline della documentazione di configurazione, gli export del Plugin SDK
   e la baseline API del Plugin SDK nell'ordine corretto. Committa qualsiasi
   deriva generata prima di creare il tag. Quindi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   uno SHA completo di 40 caratteri del branch di rilascio è consentito per il preflight
   solo di convalida. Il preflight genera prove di rilascio delle dipendenze per il
   grafo delle dipendenze esatto sottoposto a checkout e le archivia nell'artefatto di preflight npm.
   Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test di pre-rilascio con `Full Release Validation` per il
   branch di rilascio, il tag o lo SHA completo del commit. Questo è l'unico entrypoint manuale
   per i quattro grandi test box di rilascio: Vitest, Docker, QA Lab e Package.
8. Se la convalida fallisce, correggi sul branch di rilascio e riesegui il file, lane,
   job del workflow, profilo del pacchetto, provider o allowlist di modelli fallito più piccolo che
   dimostri la correzione. Riesegui l'ombrello completo solo quando la superficie modificata rende
   obsolete le prove precedenti.
9. Per un candidato beta con tag, esegui
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` dal branch
   `release/YYYY.M.PATCH` corrispondente. Per stable, passa anche il rilascio sorgente Windows
   richiesto:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   L'helper esegue i controlli locali generati per il rilascio, avvia o verifica
   la convalida completa del rilascio e le prove del preflight npm, esegue la prova Parallels
   fresh/update contro il tarball preparato esatto più la prova del pacchetto Telegram,
   registra i piani npm dei Plugin e ClawHub e stampa il comando esatto
   `OpenClaw Release Publish` solo dopo che il bundle di prove è verde.
   `OpenClaw Release Publish` avvia in parallelo la pubblicazione su npm dei pacchetti Plugin
   selezionati o tutti quelli pubblicabili e lo stesso insieme su ClawHub, quindi promuove
   l'artefatto di preflight npm OpenClaw preparato con il dist-tag corrispondente non appena
   la pubblicazione npm dei Plugin riesce.
   Dopo il successo del processo figlio di pubblicazione npm di OpenClaw, crea o aggiorna la
   pagina di rilascio/prerelease GitHub corrispondente dalla sezione completa corrispondente di
   `CHANGELOG.md`. I rilasci stable pubblicati su npm `latest` diventano il
   rilascio GitHub latest; i rilasci di manutenzione stable mantenuti su npm `beta` sono
   creati con GitHub `latest=false`. Il workflow carica anche le prove di dipendenza
   del preflight, il manifesto di convalida completa e le prove di verifica del registro
   postpubblicazione nel rilascio GitHub per la risposta agli incidenti post-rilascio.
   Il workflow di pubblicazione stampa immediatamente gli ID delle esecuzioni figlie, approva automaticamente
   i gate dell'ambiente di rilascio che il token del workflow è autorizzato ad approvare, riepiloga
   i job figli falliti con le code dei log, chiude il rilascio GitHub e le prove di dipendenza
   non appena la pubblicazione npm di OpenClaw riesce, attende ClawHub ogni volta che
   OpenClaw npm viene pubblicato, quindi esegue `pnpm release:verify-beta` e
   carica le prove postpubblicazione per il rilascio GitHub, il pacchetto npm, i pacchetti npm dei Plugin
   selezionati, i pacchetti ClawHub selezionati, gli ID delle esecuzioni dei workflow figli e
   l'ID opzionale dell'esecuzione NPM Telegram. Il percorso ClawHub ritenta i fallimenti transitori di installazione
   delle dipendenze CLI, pubblica i Plugin che passano la preview anche quando una
   cella di preview è instabile e termina con la verifica del registro per ogni versione
   Plugin prevista, così le pubblicazioni parziali restano visibili e ritentabili. Quindi esegui l'accettazione del pacchetto
   post-pubblicazione contro il pacchetto pubblicato
   `openclaw@YYYY.M.PATCH-beta.N` o
   `openclaw@beta`. Se una prerelease pushata o pubblicata richiede una correzione,
   crea il numero di prerelease corrispondente successivo; non eliminare né riscrivere la vecchia
   prerelease.
10. Per stable, continua solo dopo che la beta verificata o il candidato di rilascio dispone delle
    prove di convalida richieste. Anche la pubblicazione npm stable passa attraverso
    `OpenClaw Release Publish`, riutilizzando l'artefatto di preflight riuscito tramite
    `preflight_run_id`; la preparazione del rilascio macOS stable richiede anche i file
    `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
    Il workflow di pubblicazione macOS pubblica automaticamente l'appcast firmato su `main`
    pubblico dopo la verifica degli asset di rilascio; se la protezione del branch blocca il
    push diretto, apre o aggiorna un PR appcast. La preparazione di Windows Hub stable
    richiede gli asset firmati `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` e
    `OpenClawCompanion-SHA256SUMS.txt` nel rilascio GitHub di OpenClaw.
    Passa il tag esatto del rilascio firmato `openclaw/openclaw-windows-node` come
    `windows_node_tag` e la sua mappa di digest degli installer approvata dal candidato come
    `windows_node_installer_digests`; `OpenClaw Release Publish` mantiene la
    bozza di rilascio, avvia `Windows Node Release` e verifica tutti e tre
    gli asset prima della pubblicazione.
11. Dopo la pubblicazione, esegui il verificatore npm post-pubblicazione, l'E2E Telegram npm pubblicato
    standalone opzionale quando ti serve la prova del canale post-pubblicazione,
    la promozione del dist-tag quando necessaria, verifica la pagina di rilascio GitHub generata,
    esegui i passaggi di annuncio del rilascio, quindi completa [Chiusura stable di
    main](#stable-main-closeout) prima di considerare concluso un rilascio stable.

## Chiusura stable di main

La pubblicazione stable non è completa finché `main` non contiene lo stato effettivamente distribuito
del rilascio.

1. Parti dal `main` più recente pulito. Verifica `release/YYYY.M.PATCH` rispetto a esso e
   forward-porta le correzioni reali assenti da `main`. Non unire alla cieca
   adattatori di compatibilità, test o validazione solo del rilascio nel `main` più recente.
2. Imposta `main` sulla versione stabile pubblicata, non su un treno successivo speculativo. Esegui
   `pnpm release:prep` dopo la modifica della versione root, quindi
   `pnpm deps:shrinkwrap:generate`.
3. Fai in modo che la sezione `## YYYY.M.PATCH` di `CHANGELOG.md` su `main` corrisponda esattamente al
   ramo di rilascio taggato. Includi l'aggiornamento stabile di `appcast.xml` quando il rilascio
   per mac ne ha pubblicato uno.
4. Non aggiungere `YYYY.M.PATCH+1`, una versione beta o una sezione futura vuota del changelog
   a `main` finché l'operatore non avvia esplicitamente quel treno di rilascio.
5. Esegui `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` e
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Esegui il push, quindi verifica che `origin/main`
   contenga la versione pubblicata e il changelog prima di considerare completato il rilascio stabile.
6. Mantieni aggiornate le variabili del repository `RELEASE_ROLLBACK_DRILL_ID` e
   `RELEASE_ROLLBACK_DRILL_DATE` dopo ogni prova privata di rollback.
   `OpenClaw Stable Main Closeout` parte dal push su `main` che contiene la
   versione pubblicata, il changelog e l'appcast dopo la pubblicazione stabile. Legge
   prove post-pubblicazione immutabili per collegare il tag pubblicato alle sue esecuzioni di Full Release
   Validation e Publish, quindi verifica lo stato stabile di main, il rilascio,
   il soak stabile obbligatorio e le prove bloccanti sulle prestazioni. Allega un
   manifest di chiusura immutabile e un checksum al rilascio GitHub. Il trigger automatico
   di push salta i rilasci legacy precedenti alle prove post-pubblicazione immutabili;
   non considera mai tale salto come una chiusura completata. Una chiusura completa
   richiede sia gli asset sia un checksum corrispondente. Un manifest parziale
   riproduce lo SHA di `main` e la prova di rollback registrati per rigenerare byte
   identici, quindi allega il checksum mancante; una coppia non valida, o un checksum
   senza manifest, resta bloccante. Un'esecuzione attivata da push senza variabili
   del repository per la prova di rollback viene saltata senza completare la chiusura; un record
   della prova mancante o vecchio di oltre 90 giorni continua a bloccare la chiusura
   manuale supportata da prove. I comandi privati di recupero restano nel runbook riservato ai maintainer.
   Usa il dispatch manuale solo per riparare o riprodurre una chiusura stabile supportata da prove.
   Un tag di correzione fallback legacy può riutilizzare le prove del pacchetto base solo quando
   il tag di correzione si risolve allo stesso commit sorgente del tag stabile base.
   Una correzione con sorgente diversa deve pubblicare e verificare le proprie prove
   del pacchetto.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così il TypeScript
  dei test resta coperto al di fuori del gate locale più rapido `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli
  più ampi sui cicli di importazione e sui confini architetturali sono verdi al di fuori del gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artefatti
  di rilascio previsti `dist/*` e il bundle della Control UI esistono per il passaggio
  di convalida del pacchetto
- Esegui `pnpm release:prep` dopo l'incremento della versione root e prima del tagging. Esegue
  ogni generatore di rilascio deterministico che comunemente deriva dopo una modifica
  di versione/configurazione/API: versioni dei plugin, inventario dei plugin, schema di configurazione
  di base, metadati di configurazione dei canali in bundle, baseline della documentazione di configurazione, esportazioni del plugin SDK
  e baseline API del plugin SDK. `pnpm release:check` riesegue questi
  guard in modalità di controllo e segnala in un unico passaggio ogni errore di deriva generata che trova
  prima di eseguire i controlli di rilascio del pacchetto.
- La sincronizzazione delle versioni dei Plugin aggiorna per impostazione predefinita le versioni dei pacchetti Plugin ufficiali e i floor
  `openclaw.compat.pluginApi` esistenti alla versione di rilascio di OpenClaw.
  Tratta quel campo come il floor dell'API plugin SDK/runtime, non solo come una copia
  della versione del pacchetto: per i rilasci solo Plugin che intenzionalmente restano
  compatibili con host OpenClaw più vecchi, mantieni il floor all'API host supportata più vecchia
  e documenta questa scelta nella prova di rilascio del Plugin.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per
  avviare tutti i test box pre-rilascio da un unico punto di ingresso. Accetta un branch,
  tag o SHA completo del commit, esegue il dispatch manuale di `CI` e il dispatch di
  `OpenClaw Release Checks` per smoke di installazione, accettazione del pacchetto, controlli pacchetto
  cross-OS, parità QA Lab, Matrix e lane Telegram. Le esecuzioni stabili e complete
  includono sempre live/E2E esaustivi e soak Docker del percorso di rilascio;
  `run_release_soak=true` resta mantenuto per un soak beta esplicito. Package
  Acceptance fornisce l'E2E Telegram canonico del pacchetto durante la convalida del candidato,
  evitando un secondo poller live concorrente.
  Fornisci `release_package_spec` dopo la pubblicazione di una beta per riutilizzare il pacchetto
  npm distribuito nei controlli di rilascio, Package Acceptance e pacchetto Telegram
  E2E senza ricostruire il tarball di rilascio. Fornisci
  `npm_telegram_package_spec` solo quando Telegram deve usare un pacchetto pubblicato
  diverso dal resto della convalida del rilascio. Fornisci
  `package_acceptance_package_spec` quando Package Acceptance deve usare un pacchetto
  pubblicato diverso dalla specifica del pacchetto di rilascio. Fornisci
  `evidence_package_spec` quando il report delle evidenze di rilascio deve provare che la
  convalida corrisponde a un pacchetto npm pubblicato senza forzare Telegram E2E.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel
  per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref`
  per impacchettare un branch/tag/SHA `package_ref` attendibile con l'harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS pubblico con SHA-256
  obbligatorio e policy URL pubblica rigorosa; `source=trusted-url` per una policy
  di fonte attendibile nominata usando `trusted_source_id` e SHA-256 obbligatori; oppure
  `source=artifact` per un tarball caricato da un'altra esecuzione GitHub Actions. Il
  workflow risolve il candidato in
  `package-under-test`, riutilizza lo scheduler di rilascio Docker E2E contro quel
  tarball e può eseguire la QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le
  lane Docker selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto
  è il candidato e `published_upgrade_survivor_baseline` seleziona
  la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato sia come
  CLI installata sia come package-under-test, così esercita il percorso di riavvio
  gestito del comando di aggiornamento del candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane di installazione/canale/agente, rete Gateway e ricaricamento configurazione
  - `package`: lane native dell'artefatto per pacchetto/aggiornamento/riavvio/plugin senza OpenWebUI o ClawHub live
  - `product`: profilo pacchetto più canali MCP, pulizia cron/subagent,
    ricerca web OpenAI e OpenWebUI
  - `full`: segmenti del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione focalizzata
- Esegui direttamente il workflow manuale `CI` quando hai bisogno solo di copertura CI normale
  deterministica per il candidato al rilascio. I dispatch CI manuali aggirano lo scoping
  delle modifiche e forzano gli shard Linux Node, gli shard dei Plugin in bundle, gli shard dei contratti
  Plugin e canale, la compatibilità Node 22, `check-*`, `check-additional-*`,
  controlli smoke degli artefatti buildati, controlli docs, Skills Python, Windows, macOS e
  lane i18n della Control UI. Le esecuzioni CI manuali autonome eseguono Android solo quando sono avviate
  con `include_android=true`; `Full Release Validation` passa quell'input al
  suo figlio CI.
  Esempio con Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Esegui `pnpm qa:otel:smoke` quando convalidi la telemetria di rilascio. Esercita
  QA-lab tramite un ricevitore OTLP/HTTP locale e verifica l'esportazione di trace, metriche e log
  più attributi di trace limitati e redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm qa:otel:collector-smoke` quando convalidi la compatibilità del collector.
  Instrada la stessa esportazione OTLP di QA-lab tramite un vero container Docker OpenTelemetry Collector
  prima delle asserzioni del ricevitore locale.
- Esegui `pnpm qa:prometheus:smoke` quando convalidi lo scraping Prometheus protetto.
  Esercita QA-lab, rifiuta scrape non autenticati e verifica che le famiglie di metriche
  critiche per il rilascio restino prive di contenuto dei prompt, identificatori grezzi,
  token di autenticazione e percorsi locali.
- Esegui `pnpm qa:observability:smoke` quando vuoi le lane smoke OpenTelemetry
  e Prometheus del checkout sorgente una dopo l'altra.
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- Il preflight `OpenClaw NPM Release` genera evidenze di rilascio delle dipendenze prima
  di impacchettare il tarball npm. Il gate delle vulnerabilità degli advisory npm è
  bloccante per il rilascio. Il rischio del manifesto transitivo, la superficie di proprietà/installazione
  delle dipendenze e i report delle modifiche alle dipendenze sono solo evidenze di rilascio. Il
  report delle modifiche alle dipendenze confronta il candidato al rilascio con il tag di rilascio
  raggiungibile precedente.
- Il preflight carica le evidenze delle dipendenze come
  `openclaw-release-dependency-evidence-<tag>` e le incorpora anche sotto
  `dependency-evidence/` dentro l'artefatto preflight npm preparato. Il percorso reale
  di pubblicazione riutilizza quell'artefatto preflight, poi allega le stesse evidenze
  al rilascio GitHub come `openclaw-<version>-dependency-evidence.zip`.
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione mutante dopo che il
  tag esiste. Avvialo da `release/YYYY.M.PATCH` (o `main` quando pubblichi un tag
  raggiungibile da main), passa il tag di rilascio, il `preflight_run_id` npm OpenClaw
  riuscito e il `full_release_validation_run_id` riuscito, e mantieni
  l'ambito di pubblicazione Plugin predefinito `all-publishable` salvo che tu stia deliberatamente
  eseguendo una riparazione focalizzata. Il workflow serializza la pubblicazione npm dei Plugin, la pubblicazione
  ClawHub dei Plugin e la pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato
  prima dei suoi Plugin esternalizzati.
- `OpenClaw Release Publish` stabile richiede un `windows_node_tag` esatto dopo
  che esiste il rilascio `openclaw/openclaw-windows-node` non prerelease corrispondente.
  Richiede anche la mappa `windows_node_installer_digests` approvata per il candidato.
  Prima di avviare qualunque figlio di pubblicazione, verifica che il rilascio sorgente sia
  pubblicato, non prerelease, contenga gli installer x64/ARM64 richiesti e
  corrisponda ancora a quella mappa approvata. Poi avvia `Windows Node Release`
  mentre il rilascio OpenClaw è ancora una bozza, portando invariata la mappa dei digest
  installer fissata. Il workflow figlio scarica gli installer firmati di Windows Hub
  da quel tag esatto, li confronta con i digest fissati, verifica su un runner Windows
  che le firme Authenticode usino il firmatario OpenClaw Foundation previsto,
  scrive un manifesto SHA-256 e carica gli installer più il manifesto nel
  rilascio GitHub canonico di OpenClaw, poi riscarica gli asset promossi e
  verifica l'appartenenza al manifesto e gli hash. Il genitore verifica il contratto
  corrente degli asset x64, ARM64 e checksum prima della pubblicazione. Il ripristino diretto
  rifiuta nomi di asset `OpenClawCompanion-*` imprevisti prima di sostituire gli asset
  di contratto previsti con i byte sorgente fissati. Avvia manualmente
  `Windows Node Release` solo per ripristino, e passa sempre un tag esatto, mai
  `latest`, più la mappa JSON esplicita `expected_installer_digests` dal
  rilascio sorgente approvato. I link di download del sito web dovrebbero puntare agli URL asset
  esatti del rilascio OpenClaw per l'attuale rilascio stabile, oppure a
  `releases/latest/download/...` solo dopo aver verificato che il redirect latest di GitHub
  punti a quello stesso rilascio; non collegare solo alla pagina di rilascio del repo companion.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo
  Matrix live rapido e la lane QA Telegram prima dell'approvazione del rilascio. Le lane live
  usano l'ambiente `qa-live-shared`; Telegram usa anche lease di credenziali Convex CI.
  Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi l'inventario completo di trasporto
  Matrix, media ed E2EE in parallelo.
- La convalida runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente
  il workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantieni il vero percorso di rilascio npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  lane, così non rallentano o bloccano la pubblicazione
- I controlli di rilascio che contengono segreti dovrebbero essere avviati tramite `Full Release
Validation` o dal ref workflow `main`/release, così logica del workflow e
  segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, tag o SHA completo del commit purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Il preflight solo convalida `OpenClaw NPM Release` accetta anche lo SHA completo
  corrente di 40 caratteri del commit del branch workflow senza richiedere un tag pushato
- Quel percorso SHA è solo per convalida e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione su runner ospitati da GitHub,
  mentre il percorso di convalida non mutante può usare i runner Linux Blacksmith
  più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la lane separata dei controlli di rilascio
- Prima di taggare localmente un candidato al rilascio, esegui
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. L'helper
  esegue i guardrail rapidi di rilascio, i controlli di rilascio npm/ClawHub dei Plugin, build,
  build UI e `release:openclaw:npm:check` nell'ordine che intercetta gli errori comuni
  bloccanti per l'approvazione prima che il workflow di pubblicazione GitHub inizi.
- Esegui `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (o la versione beta/correttiva corrispondente) per verificare il percorso di
  installazione del registry pubblicato in un nuovo prefisso temporaneo
- Dopo la pubblicazione di una beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare l'onboarding del pacchetto installato, la configurazione di Telegram e il vero E2E di Telegram
  rispetto al pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei manutentori possono omettere le variabili Convex e passare direttamente le tre
  credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta completo post-pubblicazione da una macchina di un manutentore, usa `pnpm release:beta-smoke -- --beta betaN`. L'helper esegue la validazione Parallels di aggiornamento npm/target pulito, avvia `NPM Telegram Beta E2E`, interroga l'esecuzione esatta del workflow, scarica l'artefatto e stampa il report Telegram.
- I manutentori possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione delle release per i manutentori ora usa preflight-poi-promote:
  - la vera pubblicazione npm deve superare un `preflight_run_id` npm riuscito
  - la vera pubblicazione npm deve essere avviata dallo stesso branch `main` o
    `release/YYYY.M.PATCH` dell'esecuzione preflight riuscita
  - le release npm stabili usano `beta` come valore predefinito
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione del dist-tag npm basata su token ora vive in
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` perché
    `npm dist-tag add` richiede ancora `NPM_TOKEN`, mentre il repository sorgente mantiene
    la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di validazione; quando un tag esiste solo su un
    branch di release ma il workflow viene avviato da `main`, imposta
    `public_release_branch=release/YYYY.M.PATCH`
  - la vera pubblicazione macOS deve superare un `preflight_run_id` macOS e un
    `validate_run_id` riusciti
  - i veri percorsi di pubblicazione promuovono gli artefatti preparati invece di ricostruirli
    di nuovo
- Per release correttive stabili come `YYYY.M.PATCH-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.PATCH` a `YYYY.M.PATCH-N`,
  così le correzioni di release non possono lasciare silenziosamente le installazioni globali più vecchie sul
  payload stabile di base
- Il preflight della release npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`,
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei Plugin pubblicati e
  i metadati del pacchetto siano presenti nel layout del registry installato. Una release che
  distribuisce payload runtime dei Plugin mancanti fallisce il verificatore postpublish e
  non può essere promossa a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` del pack npm sul
  tarball di aggiornamento candidato, così l'e2e dell'installer intercetta aumenti accidentali delle dimensioni del pack
  prima del percorso di pubblicazione della release
- Se il lavoro di release ha toccato la pianificazione CI, i manifesti dei tempi delle estensioni o
  le matrici di test delle estensioni, rigenera e rivedi gli output della matrice
  `plugin-prerelease-extension-shard` posseduti dal planner da
  `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di release non
  descrivono un layout CI obsoleto
- La prontezza della release stabile macOS include anche le superfici dell'updater:
  - la release GitHub deve finire con i `.zip`, `.dmg` e `.dSYM.zip` pacchettizzati
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione; il
    workflow di pubblicazione macOS lo committa automaticamente, oppure apre una PR
    appcast quando il push diretto è bloccato
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un URL del feed Sparkle
    non vuoto e una `CFBundleVersion` pari o superiore al limite minimo canonico della build Sparkle
    per quella versione di release

## Box di test di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-release da
un unico entrypoint. Per una prova di commit fissato su un branch in rapido movimento, usa
l'helper in modo che ogni workflow figlio venga eseguito da un branch temporaneo fissato allo
SHA di destinazione:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper esegue il push di `release-ci/<sha>-...`, invia `Full Release Validation`
da quel branch con `ref=<sha>`, verifica che ogni workflow figlio `headSha`
corrisponda alla destinazione, quindi elimina il branch temporaneo. Questo evita di provare per
errore un'esecuzione figlia di `main` più recente.

Per la validazione di un branch o tag di rilascio, eseguila dal ref del workflow `main`
attendibile e passa il branch o tag di rilascio come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Il workflow risolve il ref di destinazione, invia manualmente `CI` con
`target_ref=<release-ref>`, quindi invia `OpenClaw Release Checks`.
`OpenClaw Release Checks` distribuisce install smoke, controlli di rilascio cross-OS,
copertura live/E2E Docker del percorso di rilascio quando il soak è abilitato, Package Acceptance
con l'E2E del pacchetto Telegram canonico, parità QA Lab, Matrix live e Telegram
live. Un'esecuzione full/all è accettabile solo quando il riepilogo di `Full Release Validation`
mostra `normal_ci`, `plugin_prerelease` e `release_checks` come riusciti,
a meno che una riesecuzione mirata abbia saltato intenzionalmente il figlio separato `Plugin
Prerelease`. Usa il figlio autonomo `npm-telegram` solo per una riesecuzione mirata
del pacchetto pubblicato con `release_package_spec` o
`npm_telegram_package_spec`. Il riepilogo finale del verificatore include tabelle dei job più lenti
per ogni esecuzione figlia, così il release manager può vedere il percorso critico corrente
senza scaricare i log.
Consulta [Validazione completa del rilascio](/it/reference/full-release-validation) per la
matrice completa degli stage, i nomi esatti dei job del workflow, le differenze tra profilo
stable e full, gli artefatti e gli handle di riesecuzione mirata.
I workflow figli vengono inviati dal ref attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch o tag di rilascio precedente. Non esiste un input separato per il ref del workflow
Full Release Validation; scegli l'harness attendibile scegliendo il ref dell'esecuzione del workflow.
Non usare `--ref main -f ref=<sha>` per una prova esatta di commit su `main` in movimento;
gli SHA di commit grezzi non possono essere ref di workflow dispatch, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo fissato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso live e Docker OpenAI/core critico per il rilascio più rapido
- `stable`: minimum più copertura stabile di provider/backend per l'approvazione del rilascio
- `full`: stable più ampia copertura consultiva di provider/media

La validazione stable e full esegue sempre lo sweep esaustivo live/E2E, Docker
del percorso di rilascio e bounded published upgrade-survivor prima della promozione.
Usa `run_release_soak=true` per richiedere lo stesso sweep per una beta. Questo sweep copre
gli ultimi quattro pacchetti stabili più le baseline fissate `2026.4.23` e `2026.5.2`
più la copertura più vecchia `2026.4.15`, con baseline duplicate rimosse e
ogni baseline suddivisa in shard nel proprio job runner Docker.

`OpenClaw Release Checks` usa il ref del workflow attendibile per risolvere una volta il ref
di destinazione come `release-package-under-test` e riutilizza quell'artefatto nei controlli
cross-OS, Package Acceptance e Docker del percorso di rilascio quando viene eseguito il soak. Questo mantiene
tutti i box rivolti al pacchetto sugli stessi byte ed evita build ripetute del pacchetto.
Dopo che una beta è già su npm, imposta `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
in modo che i release checks scarichino una volta il pacchetto distribuito, estraggano il suo SHA
sorgente di build da `dist/build-info.json` e riutilizzino quell'artefatto per cross-OS,
Package Acceptance, Docker del percorso di rilascio e lane Telegram del pacchetto.
L'install smoke cross-OS OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane sta
provando installazione del pacchetto, onboarding, avvio del Gateway e un turno live dell'agente
anziché fare benchmarking del modello predefinito più lento. La matrice provider live più ampia
rimane il posto per la copertura specifica del modello.

Usa queste varianti a seconda dello stage di rilascio:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Non usare l'ombrello completo come prima riesecuzione dopo una correzione mirata. Se un box
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo del pacchetto, il provider
del modello o la lane QA non riusciti per la prova successiva. Esegui di nuovo l'ombrello completo solo quando
la correzione ha modificato l'orchestrazione condivisa del rilascio o ha reso obsoleta la prova precedente
di tutti i box. Il verificatore finale dell'ombrello ricontrolla gli ID registrati delle esecuzioni dei workflow figli,
quindi dopo che un workflow figlio è stato rieseguito con successo, riesegui solo il job padre
`Verify full validation` non riuscito.

Per il recupero limitato, passa `rerun_group` all'ombrello. `all` è la vera
esecuzione del release candidate, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio plugin solo per rilascio, `release-checks` esegue ogni box di rilascio,
e i gruppi di rilascio più ristretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate `npm-telegram` richiedono `release_package_spec` o
`npm_telegram_package_spec`; le esecuzioni full/all usano l'E2E Telegram del pacchetto canonico
all'interno di Package Acceptance. Le riesecuzioni mirate
cross-OS possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti dei release-check QA bloccano la normale validazione del rilascio,
incluso il drift richiesto degli strumenti dinamici OpenClaw nel tier standard.
Le esecuzioni alpha Tideclaw possono ancora trattare le lane di release-check non legate alla sicurezza del pacchetto come
consultive. Quando `live_suite_filter` richiede esplicitamente una lane QA live con gate come
Discord, WhatsApp o Slack, la variabile repo corrispondente
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` deve essere abilitata; altrimenti
l'acquisizione dell'input fallisce invece di saltare silenziosamente la lane.

### Vitest

Il box Vitest è il workflow figlio manuale `CI`. La CI manuale aggira intenzionalmente
lo scoping delle modifiche e forza il normale grafo di test per il release
candidate: shard Linux Node, shard dei plugin in bundle, shard dei contratti di plugin e canali,
compatibilità Node 22, `check-*`, `check-additional-*`,
controlli smoke degli artefatti compilati, controlli docs, Python skills, Windows, macOS
e i18n della Control UI. Android è incluso quando `Full Release Validation` esegue il
box perché l'ombrello passa `include_android=true`; la CI manuale autonoma
richiede `include_android=true` per la copertura Android.

Usa questo box per rispondere "l'albero sorgente ha superato l'intera suite di test normale?"
Non è lo stesso della validazione prodotto del percorso di rilascio. Prove da conservare:

- riepilogo di `Full Release Validation` che mostra l'URL dell'esecuzione `CI` inviata
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI quando si investigano regressioni
- artefatti di timing Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui la CI manuale direttamente solo quando il rilascio richiede CI normale deterministica ma
non i box Docker, QA Lab, live, cross-OS o pacchetto. Usa il primo comando
per CI diretta non Android. Aggiungi `include_android=true` quando la CI diretta
del release candidate deve coprire Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Il box Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow
`install-smoke` in modalità rilascio. Valida il release candidate attraverso ambienti Docker
pacchettizzati invece che solo test a livello sorgente.

La copertura Docker di rilascio include:

- install smoke completo con lo smoke di installazione globale Bun lenta abilitato
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
- copertura OpenWebUI all'interno del chunk `plugins-runtime-services` quando richiesta
- lane separate di installazione/disinstallazione dei plugin in bundle
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura modello live Docker quando i release checks
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
timing delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per il recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow live/E2E riutilizzabile invece di
rieseguire tutti i chunk di rilascio. I comandi di riesecuzione generati includono il precedente
`package_artifact_run_id` e gli input delle immagini Docker preparate quando disponibili, così una
lane fallita può riutilizzare lo stesso tarball e le immagini GHCR.

### QA Lab

Il box QA Lab fa anche parte di `OpenClaw Release Checks`. È il gate di rilascio del comportamento
agentico e a livello di canale, separato da Vitest e dai meccanismi del pacchetto Docker.

La copertura QA Lab di rilascio include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live veloce usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease delle credenziali Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` o
  `pnpm qa:observability:smoke` quando la telemetria di rilascio richiede prova locale esplicita

Usa questo box per rispondere "il rilascio si comporta correttamente negli scenari QA e
nei flussi canale live?" Conserva gli URL degli artefatti per le lane parità, Matrix e Telegram
quando approvi il rilascio. La copertura Matrix completa rimane disponibile come
esecuzione QA-Lab manuale suddivisa in shard anziché come lane critica di rilascio predefinita.

### Pacchetto

Il box Pacchetto è il gate del prodotto installabile. È supportato da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, valida
l'inventario del pacchetto, registra la versione del pacchetto e SHA-256 e mantiene il
ref dell'harness del workflow separato dal ref sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oppure una versione di rilascio OpenClaw
  esatta
- `source=ref`: impacchetta un branch, tag o SHA completo del commit `package_ref` attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS pubblico con `package_sha256` obbligatorio;
  credenziali URL, porte HTTPS non predefinite, nomi host o indirizzi risolti
  privati/interni/a uso speciale e redirect non sicuri vengono rifiutati
- `source=trusted-url`: scarica un `.tgz` HTTPS con
  `package_sha256` e `trusted_source_id` obbligatori da una policy nominata in
  `.github/package-trusted-sources.json`; usalo per mirror enterprise di proprietà dei maintainer
  o repository di pacchetti privati invece di aggiungere un bypass della rete privata
  a livello di input a `source=url`
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione di GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto
del pacchetto di rilascio preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la migrazione, l'aggiornamento,
il riavvio dell'aggiornamento con autenticazione configurata, l'installazione live di una skill ClawHub, la pulizia delle dipendenze Plugin obsolete, le fixture Plugin offline,
l'aggiornamento Plugin e la QA del pacchetto Telegram sullo stesso tarball risolto.
I controlli di rilascio bloccanti usano il baseline predefinito dell'ultimo pacchetto pubblicato;
il profilo beta con `run_release_soak=true`, `release_profile=stable` o
`release_profile=full` si espande a ogni baseline stabile pubblicato su npm da
`2026.4.23` fino a `latest` più le fixture dei problemi segnalati. Usa
Package Acceptance con `source=npm` per un candidato già rilasciato,
`source=ref` per un tarball npm locale basato su SHA prima della pubblicazione,
`source=trusted-url` per un mirror enterprise/privato di proprietà dei maintainer, oppure
`source=artifact` per un tarball preparato caricato da un'altra esecuzione di GitHub Actions.
È il sostituto nativo di GitHub
per la maggior parte della copertura di pacchetto/aggiornamento che in precedenza richiedeva
Parallels. I controlli di rilascio cross-OS restano importanti per onboarding,
installer e comportamento di piattaforma specifici del sistema operativo, ma la convalida prodotto
di pacchetto/aggiornamento dovrebbe preferire Package Acceptance.

La checklist canonica per la convalida di aggiornamenti e Plugin è
[Testing updates and plugins](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o di controllo di rilascio dimostra una
modifica di installazione/aggiornamento Plugin, pulizia doctor o migrazione del pacchetto pubblicato.
La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale separato `Update Migration`, non parte della Full Release CI.

La tolleranza legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci private dell'inventario QA mancanti dal tarball, `gateway install --wrapper`
mancante, file di patch mancanti nella fixture git derivata dal tarball,
`update.channel` persistito mancante, posizioni legacy degli install-record Plugin,
persistenza dell'install-record del marketplace mancante e migrazione dei metadati di configurazione
durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può emettere avvisi
per file di marcatura dei metadati di build locale già rilasciati. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; quelle stesse lacune fanno fallire la
convalida di rilascio.

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

- `smoke`: lane rapide di installazione pacchetto/canale/agente, rete Gateway e
  ricaricamento configurazione
- `package`: contratti di pacchetto per installazione/aggiornamento/riavvio/Plugin più prova
  di installazione live di una skill ClawHub; è il valore predefinito dei controlli di rilascio
- `product`: `package` più canali MCP, pulizia cron/subagent, ricerca web OpenAI
  e OpenWebUI
- `full`: segmenti del percorso di rilascio Docker con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram del candidato pacchetto, abilita `telegram_mode=mock-openai` oppure
`telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il tarball
risolto `package-under-test` nella lane Telegram; il workflow Telegram autonomo
accetta ancora una spec npm pubblicata per controlli post-pubblicazione.

## Automazione di pubblicazione del rilascio

`OpenClaw Release Publish` è il normale entrypoint mutativo di pubblicazione. Orquestra
i workflow trusted-publisher nell'ordine richiesto dal rilascio:

1. Esegue il checkout del tag di rilascio e risolve il suo SHA del commit.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegue `pnpm plugins:sync:check`.
4. Avvia `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Avvia `Plugin ClawHub Release` con lo stesso ambito e SHA.
6. Avvia `OpenClaw NPM Release` con il tag di rilascio, il dist-tag npm e
   `preflight_run_id` salvato dopo aver verificato il
   `full_release_validation_run_id` salvato.
7. Per i rilasci stabili, crea o aggiorna il rilascio GitHub come bozza, avvia
   `Windows Node Release` con il `windows_node_tag` esplicito e
   i `windows_node_installer_digests` approvati per il candidato, e verifica gli asset canonici
   di installer/checksum prima di pubblicare la bozza.

Esempio di pubblicazione beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Pubblicazione stabile sul dist-tag beta predefinito:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

La promozione stabile direttamente a `latest` è esplicita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Usa i workflow di livello inferiore `Plugin NPM Release` e `Plugin ClawHub Release`
solo per lavori mirati di riparazione o ripubblicazione. `OpenClaw Release Publish` rifiuta
`plugin_publish_scope=selected` quando `publish_openclaw_npm=true`, così il pacchetto
core non può essere rilasciato senza ogni Plugin ufficiale pubblicabile, incluso
`@openclaw/diffs-language-pack`. Per una riparazione di Plugin selezionati, imposta
`publish_openclaw_npm=false` con `plugin_publish_scope=selected` e
`plugins=@openclaw/name`, oppure avvia direttamente il workflow figlio.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere lo SHA
  completo di 40 caratteri del commit del branch del workflow corrente per un preflight di sola convalida
- `preflight_only`: `true` solo per convalida/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il workflow riutilizza
  il tarball preparato dall'esecuzione preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; valore predefinito `beta`

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve già esistere
- `preflight_run_id`: id dell'esecuzione preflight `OpenClaw NPM Release` riuscita;
  obbligatorio quando `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id dell'esecuzione `Full Release Validation` riuscita;
  obbligatorio quando `publish_openclaw_npm=true`
- `windows_node_tag`: tag di rilascio `openclaw/openclaw-windows-node`
  esatto non prerelease; obbligatorio per la pubblicazione stabile di OpenClaw
- `windows_node_installer_digests`: mappa JSON compatta approvata per il candidato dei
  nomi correnti degli installer Windows ai rispettivi digest `sha256:` fissati; obbligatoria
  per la pubblicazione stabile di OpenClaw
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: valore predefinito `all-publishable`; usa `selected` solo
  per lavori mirati di riparazione solo Plugin con `publish_openclaw_npm=false`
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: valore predefinito `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazioni solo Plugin
- `wait_for_clawhub`: valore predefinito `false`, così la disponibilità npm non è bloccata dal
  sidecar ClawHub; imposta `true` solo quando il completamento del workflow deve includere
  il completamento di ClawHub

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o SHA completo del commit da convalidare. I controlli con segreti
  richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o da un
  tag di rilascio.
- `run_release_soak`: abilita volontariamente live/E2E esaustivi, percorso di rilascio Docker e
  soak upgrade-survivor all-since per i controlli di rilascio beta. Viene forzato da
  `release_profile=stable` e `release_profile=full`.

Regole:

- I tag stabili e di correzione possono essere pubblicati su `beta` o `latest`
- I tag prerelease beta possono essere pubblicati solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA completo del commit è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo di convalida
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica questi metadati prima che la pubblicazione continui

## Sequenza di rilascio npm stabile

Quando si prepara un rilascio npm stabile:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA completo del commit corrente
     del ramo del workflow per un dry run di sola convalida del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul ramo di release, sul tag di release o sullo SHA
   completo del commit quando vuoi la normale CI più la copertura live di prompt cache,
   Docker, QA Lab, Matrix e Telegram da un unico workflow manuale
4. Se ti serve intenzionalmente solo il grafo di test normale deterministico, esegui invece il
   workflow manuale `CI` sul riferimento di release
5. Seleziona l’esatto tag di release non prerelease `openclaw/openclaw-windows-node`
   i cui installer firmati x64 e ARM64 devono essere distribuiti. Salvalo come
   `windows_node_tag` e salva la loro mappa di digest convalidata come
   `windows_node_installer_digests`. L’helper del release candidate registra entrambi
   e li include nel comando di pubblicazione generato.
6. Salva i valori riusciti `preflight_run_id` e `full_release_validation_run_id`
7. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`,
   il `windows_node_tag` selezionato, il suo `windows_node_installer_digests` salvato,
   il `preflight_run_id` salvato e il `full_release_validation_run_id` salvato;
   pubblica i Plugin esternalizzati su npm e ClawHub prima di promuovere il
   pacchetto npm OpenClaw
8. Se la release è arrivata su `beta`, usa il workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
9. Se la release è stata pubblicata intenzionalmente direttamente su `latest` e `beta`
   deve seguire immediatamente la stessa build stabile, usa lo stesso workflow di release
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua
   sincronizzazione programmata di autoriparazione sposti `beta` in seguito

La mutazione del dist-tag vive nel repository del registro delle release perché richiede ancora
`NPM_TOKEN`, mentre il repository sorgente mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

Se un maintainer deve ripiegare sull’autenticazione npm locale, esegui qualsiasi comando della
CLI 1Password (`op`) solo all’interno di una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell’agente; mantenerlo dentro tmux rende osservabili prompt,
avvisi e gestione OTP e previene avvisi ripetuti dell’host.

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
