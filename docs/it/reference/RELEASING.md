---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della validazione di rilascio o dell'accettazione dei pacchetti
    - Ricerca della denominazione delle versioni e della cadenza
summary: Canali di rilascio, checklist dell'operatore, riquadri di validazione, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-07-04T18:06:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw espone attualmente tre canali di aggiornamento rivolti agli utenti:

- stable: il canale di rilascio promosso esistente, che continua a risolversi tramite
  npm `latest` fino all'arrivo della milestone separata CLI/canale
- beta: tag di prerelease pubblicati su npm `beta`
- dev: la testa mobile di `main`

Separatamente, gli operatori di rilascio possono pubblicare il pacchetto core
del mese completato precedente su npm `extended-stable`, a partire dalla patch `33`. La linea finale
regolare del mese corrente continua su npm `latest`; questa separazione di pubblicazione lato operatore
non modifica di per se' la risoluzione dei canali di aggiornamento della CLI.

## Nomi delle versioni

- Versione mensile npm extended-stable: `YYYY.M.PATCH`, con `PATCH >= 33`
  - Tag Git: `vYYYY.M.PATCH`
- Versione finale giornaliera/regolare: `YYYY.M.PATCH`, con `PATCH < 33`
  - Tag Git: `vYYYY.M.PATCH`
- Versione di correzione fallback regolare: `YYYY.M.PATCH-N`
  - Tag Git: `vYYYY.M.PATCH-N`
- Versione prerelease beta: `YYYY.M.PATCH-beta.N`
  - Tag Git: `vYYYY.M.PATCH-beta.N`
- Non aggiungere zeri iniziali a mese o patch
- A partire dall'aggiornamento del processo di rilascio di giugno 2026, il terzo componente e' un
  numero sequenziale mensile del release train, non un giorno di calendario. I rilasci stable e beta
  determinano il train corrente; i tag solo alpha non consumano ne'
  avanzano il numero di patch beta/stable. I tag e le versioni npm precedenti
  all'aggiornamento mantengono i loro nomi esistenti e restano validi; l'automazione di rilascio continua a
  confrontarli per anno, mese, patch, canale e numero di prerelease o correzione.
- Le build alpha/nightly usano il prossimo patch train non rilasciato e incrementano solo
  `alpha.N` per build ripetute. Quando quella patch ha una beta, le nuove build alpha
  passano alla patch successiva. Ignora i tag legacy solo alpha con numeri di patch
  piu' alti quando selezioni un train beta o stable.
- Le versioni npm sono immutabili. Se un tag beta e' gia' stato pubblicato, non
  eliminarlo, ripubblicarlo o riutilizzarlo; crea invece il numero beta successivo o la patch mensile
  successiva. Poiche' `2026.6.5-beta.1` e' gia' stato pubblicato durante la
  transizione, i release train di giugno 2026 devono usare la patch `5` o superiore. Non
  pubblicare nuovi train stable o beta di giugno 2026 come `2026.6.2`, `2026.6.3` o
  `2026.6.4`.
- Dopo la finale regolare `2026.6.5`, il prossimo nuovo train beta e'
  `2026.6.6-beta.1`, anche
  se esistono gia' tag automatizzati solo alpha con numeri di patch piu' alti.
- `latest` continua a seguire la linea npm regolare/giornaliera corrente
- `beta` indica la destinazione di installazione beta corrente
- `extended-stable` indica il pacchetto npm supportato del mese precedente, a partire dalla patch
  `33`; la patch `34` e successive sono rilasci di manutenzione su quella linea mensile
- Il percorso mensile dedicato extended-stable pubblica solo il pacchetto core npm. Non
  pubblica plugin, artefatti macOS o Windows, una GitHub Release,
  dist-tag di repository privati, immagini Docker, artefatti mobile o download
  del sito web.

## Cadenza dei rilasci

- I rilasci procedono prima in beta
- Stable segue solo dopo la validazione dell'ultima beta
- I maintainer normalmente creano i rilasci da un branch `release/YYYY.M.PATCH` creato
  dal `main` corrente, cosi' la validazione e le correzioni del rilascio non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta e' stato inviato o pubblicato e richiede una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura di rilascio dettagliata, approvazioni, credenziali e note di ripristino sono
  riservate ai maintainer

## Pubblicazione mensile extended-stable solo npm

Questa e' un'eccezione dedicata alla procedura di rilascio regolare riportata sotto. Per un
mese completato `YYYY.M`, crea `extended-stable/YYYY.M.33`; pubblica `vYYYY.M.33` e
le patch di manutenzione successive dallo stesso branch. Il tag di rilascio, la punta del branch,
il checkout, la versione del pacchetto, il preflight npm e l'esecuzione di Full Release Validation devono
identificare tutti lo stesso commit. Il `main` protetto deve gia' contenere una versione finale di un mese di calendario
strettamente successivo sotto la patch `33`; le patch di manutenzione restano
idonee dopo che `main` avanza di piu' di un mese.

Esegui il preflight npm e Full Release Validation dal branch extended-stable esatto,
poi salva entrambi gli ID delle esecuzioni:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` e' il profilo esistente di profondita' della validazione; e'
separato dal dist-tag npm `extended-stable` ed e' intenzionalmente invariato.

Dopo che entrambe le esecuzioni hanno successo e l'ambiente di rilascio npm e' pronto, promuovi il
tarball esatto del preflight. La patch `P` deve essere `33` o superiore:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Per un fork o una prova non di produzione che intenzionalmente non puo' soddisfare la
policy mensile `.33` o del mese di `main` protetto, aggiungi
`-f bypass_extended_stable_guard=true` sia ai dispatch di preflight npm sia a quelli di pubblicazione. Il
valore predefinito e' `false`. Il bypass e' accettato solo con `npm_dist_tag=extended-stable` ed
e' registrato nel riepilogo del workflow. Non bypassa il ref canonico del workflow
`extended-stable/YYYY.M.33`, l'uguaglianza branch-tip/tag/checkout, la sintassi del tag finale,
l'uguaglianza versione pacchetto/tag, l'identita' delle esecuzioni e del manifest referenziati,
la provenienza del tarball, l'approvazione dell'ambiente, la rilettura del registry o le prove
di riparazione del selettore.

Il workflow di pubblicazione verifica le identita' delle esecuzioni referenziate, il digest
del tarball preparato ed entrambi i selettori del registry npm. Conferma indipendentemente il
risultato dopo il successo del workflow:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Entrambi i comandi devono restituire `YYYY.M.P`. Se la pubblicazione riesce ma la rilettura
del selettore fallisce, non ripubblicare la versione immutabile del pacchetto. Usa il singolo
comando di riparazione `npm dist-tag add openclaw@YYYY.M.P extended-stable` stampato nel
riepilogo always-run del workflow fallito, poi ripeti entrambe le riletture
indipendenti. Il rollback al selettore precedente e' una decisione operativa separata, non
il percorso di riparazione della rilettura.

La checklist regolare sotto continua a gestire beta, `latest`, GitHub Release,
plugin, macOS, Windows e altre pubblicazioni di piattaforma. Non eseguire questi passaggi
per questo percorso extended-stable solo npm.

## Checklist dell'operatore per il rilascio regolare

Questa checklist e' la forma pubblica del flusso di rilascio. Credenziali private,
firma, notarizzazione, ripristino dei dist-tag e dettagli di rollback di emergenza restano nel
runbook di rilascio riservato ai maintainer.

1. Parti dall'attuale `main`: esegui il pull dell'ultima versione, conferma che il commit di destinazione sia stato pushato
   e conferma che la CI attuale di `main` sia abbastanza verde da creare il branch da lì.
2. Genera la sezione superiore di `CHANGELOG.md` dalle PR mergiate e da tutti i commit diretti
   dall'ultimo tag di release raggiungibile. Mantieni le voci rivolte agli utenti,
   deduplica le voci sovrapposte tra PR e commit diretti, committa la riscrittura, pushala
   ed esegui ancora un rebase/pull prima di creare il branch.
3. Rivedi i record di compatibilità della release in
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la
   compatibilità scaduta solo quando il percorso di upgrade resta coperto, oppure registra perché viene
   mantenuta intenzionalmente.
4. Crea `release/YYYY.M.PATCH` dall'attuale `main`; non svolgere il normale lavoro di release
   direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag previsto, poi esegui
   `pnpm release:prep`. Aggiorna le versioni dei Plugin, l'inventario dei Plugin, lo schema di config,
   i metadati di config dei canali in bundle, il baseline della documentazione di config, gli export del plugin SDK
   e il baseline dell'API del plugin SDK nell'ordine corretto. Committa qualsiasi
   deriva generata prima del tagging. Poi esegui il preflight deterministico locale:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag,
   è consentito uno SHA completo di 40 caratteri del branch di release per il preflight
   di sola validazione. Il preflight genera evidenza di release delle dipendenze per il
   grafo esatto delle dipendenze in checkout e la archivia nell'artefatto di preflight npm.
   Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test pre-release con `Full Release Validation` per il
   branch di release, il tag o lo SHA completo del commit. Questo è l'unico entrypoint manuale
   per le quattro grandi box di test della release: Vitest, Docker, QA Lab e Package.
8. Se la validazione fallisce, correggi sul branch di release e riesegui il più piccolo
   file, lane, job di workflow, profilo di package, provider o allowlist di modello fallito che
   dimostri la correzione. Riesegui l'umbrella completo solo quando la superficie modificata rende
   obsoleta l'evidenza precedente.
9. Per un candidato beta taggato, esegui
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` dal branch
   `release/YYYY.M.PATCH` corrispondente. Per stable, passa anche la release sorgente Windows
   richiesta:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   L'helper esegue i controlli locali della release generata, avvia o verifica
   la validazione completa della release e l'evidenza di preflight npm, esegue la prova
   fresh/update di Parallels contro il tarball preparato esatto più la prova del package Telegram,
   registra i piani npm dei Plugin e ClawHub, e stampa il comando esatto
   `OpenClaw Release Publish` solo dopo che il bundle di evidenze è verde.
   `OpenClaw Release Publish` invia i package dei Plugin selezionati o tutti quelli pubblicabili
   su npm e lo stesso insieme su ClawHub in parallelo, quindi promuove l'artefatto
   di preflight npm di OpenClaw preparato con il dist-tag corrispondente non appena
   la pubblicazione npm dei Plugin riesce.
   Dopo il successo del child di pubblicazione npm di OpenClaw, crea o aggiorna la
   pagina GitHub release/prerelease corrispondente dalla sezione completa corrispondente di
   `CHANGELOG.md`. Le release stable pubblicate su npm `latest` diventano la
   release GitHub latest; le release stable di manutenzione mantenute su npm `beta` vengono
   create con GitHub `latest=false`. Il workflow carica inoltre l'evidenza
   di dipendenza del preflight, il manifesto di validazione completa e l'evidenza
   di verifica del registry postpublish sulla release GitHub per la risposta agli incidenti
   post-release. Il workflow di pubblicazione stampa immediatamente gli ID delle run child, approva automaticamente
   i gate dell'ambiente di release che il token del workflow è autorizzato ad approvare, riassume
   i job child falliti con le code dei log, chiude la release GitHub e l'evidenza
   delle dipendenze non appena la pubblicazione npm di OpenClaw riesce, attende ClawHub ogni volta che
   OpenClaw npm viene pubblicato, poi esegue `pnpm release:verify-beta` e
   carica evidenza postpublish per la release GitHub, il package npm, i package npm dei Plugin selezionati,
   i package ClawHub selezionati, gli ID delle run dei workflow child e
   l'ID opzionale della run NPM Telegram. Il percorso ClawHub ritenta gli errori transitori
   di installazione delle dipendenze CLI, pubblica i Plugin che superano la preview anche quando una
   cella di preview è instabile, e termina con la verifica del registry per ogni versione
   attesa dei Plugin, così le pubblicazioni parziali restano visibili e ripetibili. Poi esegui l'accettazione
   package post-publish contro il package pubblicato
   `openclaw@YYYY.M.PATCH-beta.N` oppure
   `openclaw@beta`. Se una prerelease pushata o pubblicata richiede una correzione,
   crea il successivo numero di prerelease corrispondente; non eliminare né riscrivere la vecchia
   prerelease.
10. Per stable, continua solo dopo che la beta o il candidato di release verificato ha la
    necessaria evidenza di validazione. Anche la pubblicazione npm stable passa attraverso
    `OpenClaw Release Publish`, riusando l'artefatto di preflight riuscito tramite
    `preflight_run_id`; la prontezza della release macOS stable richiede anche i
    `.zip`, `.dmg`, `.dSYM.zip` pacchettizzati e `appcast.xml` aggiornato su `main`.
    Il workflow di pubblicazione macOS pubblica automaticamente l'appcast firmato su `main` pubblico
    dopo la verifica degli asset di release; se la protezione del branch blocca il
    push diretto, apre o aggiorna una PR appcast. La prontezza di Windows Hub
    stable richiede gli asset firmati `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` e
    `OpenClawCompanion-SHA256SUMS.txt` sulla release GitHub di OpenClaw.
    Passa il tag esatto della release firmata `openclaw/openclaw-windows-node` come
    `windows_node_tag` e la sua mappa di digest degli installer approvata dal candidato come
    `windows_node_installer_digests`; `OpenClaw Release Publish` mantiene la
    bozza di release, avvia `Windows Node Release` e verifica tutti e tre
    gli asset prima della pubblicazione.
11. Dopo la pubblicazione, esegui il verificatore npm post-publish, l'E2E Telegram pubblicato-npm
    standalone opzionale quando serve una prova di canale post-publish,
    la promozione dist-tag quando necessaria, verifica la pagina GitHub release generata,
    esegui i passaggi di annuncio della release, quindi completa [Chiusura main
    stable](#stable-main-closeout) prima di dichiarare conclusa una release stable.

## Chiusura main stable

La pubblicazione stable non è completa finché `main` non contiene lo stato effettivo della
release spedita.

1. Parti dall'ultimo `main` fresco. Esegui l'audit di `release/YYYY.M.PATCH` rispetto a esso e
   porta in avanti le correzioni reali assenti da `main`. Non mergiare alla cieca
   adattatori di compatibilità, test o validazione solo di release nel `main` più nuovo.
2. Imposta `main` alla versione stable spedita, non a un prossimo train speculativo. Esegui
   `pnpm release:prep` dopo la modifica della versione root, poi
   `pnpm deps:shrinkwrap:generate`.
3. Fai in modo che la sezione `## YYYY.M.PATCH` di `CHANGELOG.md` su `main` corrisponda esattamente al
   branch di release taggato. Includi l'aggiornamento stable di `appcast.xml` quando la release
   mac lo ha pubblicato.
4. Non aggiungere `YYYY.M.PATCH+1`, una versione beta o una sezione changelog futura vuota
   a `main` finché l'operatore non avvia esplicitamente quel train di release.
5. Esegui `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` e
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Pusha, poi verifica che `origin/main`
   contenga la versione spedita e il changelog prima di dichiarare conclusa la release stable.
6. Mantieni aggiornate le variabili del repository `RELEASE_ROLLBACK_DRILL_ID` e
   `RELEASE_ROLLBACK_DRILL_DATE` dopo ogni drill di rollback privato.
   `OpenClaw Stable Main Closeout` parte dal push su `main` che contiene la
   versione spedita, il changelog e l'appcast dopo la pubblicazione stable. Legge
   evidenza postpublish immutabile per legare il tag spedito alle sue run di Full Release
   Validation e Publish, poi verifica lo stato stable di main, la release,
   il soak stable obbligatorio e l'evidenza bloccante di performance. Allega un
   manifesto di closeout immutabile e un checksum alla release GitHub. Il trigger automatico
   su push salta le release legacy precedenti all'evidenza postpublish
   immutabile; non tratta mai quel salto come un closeout completato. Un closeout completo
   richiede entrambi gli asset e un checksum corrispondente. Un manifesto parziale
   riesegue lo SHA `main` registrato e il drill di rollback per rigenerare byte
   identici, poi allega il checksum mancante; una coppia non valida, o un checksum
   senza manifesto, resta bloccante. Una run attivata da push senza variabili del repository
   per il drill di rollback viene saltata senza completare il closeout; un record di drill mancante o
   più vecchio di 90 giorni blocca comunque il closeout manuale supportato da evidenze.
   I comandi di recovery privati restano nel runbook riservato ai maintainer.
   Usa il dispatch manuale solo per riparare o rieseguire un closeout stable supportato da evidenze.
   Un tag di correzione fallback legacy può riusare l'evidenza del package base solo quando
   il tag di correzione risolve allo stesso commit sorgente del tag stable base.
   Una correzione con sorgente diverso deve pubblicare e verificare la propria evidenza
   di package.

## Preflight della release

- Esegui `pnpm check:test-types` prima del preflight di rilascio, così il TypeScript dei test resta
  coperto al di fuori del gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio, così i controlli più ampi sui
  cicli di importazione e sui confini architetturali sono verdi al di fuori del gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, così gli artifact di rilascio
  `dist/*` previsti e il bundle della Control UI esistono per il passaggio di
  convalida del pack
- Esegui `pnpm release:prep` dopo l'incremento della versione root e prima del tagging. Esegue
  ogni generatore di rilascio deterministico che comunemente deriva dopo una
  modifica di versione/config/API: versioni dei plugin, inventario dei plugin, schema di config
  base, metadati di configurazione dei canali in bundle, baseline della documentazione di config, esportazioni dell'SDK dei plugin
  e baseline API dell'SDK dei plugin. `pnpm release:check` riesegue quelle
  guardie in modalità check e segnala in un unico passaggio ogni errore di drift generato che trova
  prima di eseguire i controlli di rilascio del pacchetto.
- La sincronizzazione delle versioni dei plugin aggiorna per impostazione predefinita le versioni dei pacchetti dei plugin ufficiali e i floor
  `openclaw.compat.pluginApi` esistenti alla versione di rilascio di OpenClaw.
  Tratta quel campo come il floor dell'API SDK/runtime del plugin, non solo come una copia
  della versione del pacchetto: per rilasci solo plugin che intenzionalmente restano
  compatibili con host OpenClaw più vecchi, mantieni il floor all'API host meno recente supportata
  e documenta tale scelta nella prova di rilascio del plugin.
- Esegui il workflow manuale `Full Release Validation` prima dell'approvazione del rilascio per
  avviare tutti i test box pre-rilascio da un unico entrypoint. Accetta un branch,
  tag o SHA completo di commit, dispatcha manualmente `CI` e dispatcha
  `OpenClaw Release Checks` per install smoke, accettazione pacchetto, controlli pacchetto cross-OS,
  parità QA Lab, Matrix e lane Telegram. Le esecuzioni stable e complete
  includono sempre live/E2E esaustivi e soak del percorso di rilascio Docker;
  `run_release_soak=true` è mantenuto per un soak beta esplicito. Package
  Acceptance fornisce l'E2E Telegram canonico del pacchetto durante la
  convalida del candidato, evitando un secondo poller live concorrente.
  Fornisci `release_package_spec` dopo la pubblicazione di una beta per riutilizzare il pacchetto npm
  distribuito tra controlli di rilascio, Package Acceptance ed E2E Telegram del pacchetto
  senza ricostruire il tarball di rilascio. Fornisci
  `npm_telegram_package_spec` solo quando Telegram deve usare un pacchetto pubblicato
  diverso dal resto della convalida di rilascio. Fornisci
  `package_acceptance_package_spec` quando Package Acceptance deve usare un
  pacchetto pubblicato diverso dalla specifica del pacchetto di rilascio. Fornisci
  `evidence_package_spec` quando il report delle evidenze di rilascio deve provare che la
  convalida corrisponde a un pacchetto npm pubblicato senza forzare l'E2E Telegram.
  Esempio:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Esegui il workflow manuale `Package Acceptance` quando vuoi una prova side-channel
  per un candidato pacchetto mentre il lavoro di rilascio continua. Usa `source=npm` per
  `openclaw@beta`, `openclaw@latest` o una versione di rilascio esatta; `source=ref`
  per impacchettare un branch/tag/SHA `package_ref` attendibile con l'harness
  `workflow_ref` corrente; `source=url` per un tarball HTTPS pubblico con SHA-256
  richiesto e policy rigorosa sugli URL pubblici; `source=trusted-url` per una
  policy di sorgente attendibile nominata usando `trusted_source_id` e SHA-256 obbligatori; oppure
  `source=artifact` per un tarball caricato da un'altra esecuzione di GitHub Actions. Il
  workflow risolve il candidato in
  `package-under-test`, riutilizza lo scheduler di rilascio Docker E2E contro quel
  tarball e può eseguire la QA Telegram contro lo stesso tarball con
  `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le
  lane Docker selezionate includono `published-upgrade-survivor`, l'artifact del pacchetto
  è il candidato e `published_upgrade_survivor_baseline` seleziona
  la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato come
  CLI installata e come package-under-test, così esercita il percorso di riavvio gestito
  del comando di aggiornamento del candidato.
  Esempio: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profili comuni:
  - `smoke`: lane di installazione/canale/agent, rete Gateway e ricaricamento config
  - `package`: lane native dell'artifact per pacchetto/aggiornamento/riavvio/plugin senza OpenWebUI o ClawHub live
  - `product`: profilo package più canali MCP, pulizia cron/subagent,
    ricerca web OpenAI e OpenWebUI
  - `full`: chunk del percorso di rilascio Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata
- Esegui direttamente il workflow manuale `CI` quando ti serve solo copertura CI normale
  deterministica per il candidato di rilascio. I dispatch manuali della CI bypassano lo scoping
  basato sulle modifiche e forzano gli shard Linux Node, shard dei plugin in bundle, shard dei contratti di plugin e
  canali, compatibilità Node 22, `check-*`, `check-additional-*`,
  controlli smoke sugli artifact compilati, controlli docs, Skills Python, Windows, macOS e
  lane i18n della Control UI. Le esecuzioni CI manuali standalone eseguono Android solo quando dispatchate
  con `include_android=true`; `Full Release Validation` passa quell'input al
  suo child CI.
  Esempio con Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Esegui `pnpm qa:otel:smoke` quando convalidi la telemetria di rilascio. Esercita
  QA-lab tramite un receiver OTLP/HTTP locale e verifica l'esportazione di trace, metriche e log
  più attributi trace limitati e redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm qa:otel:collector-smoke` quando convalidi la compatibilità del collector.
  Instrada la stessa esportazione OTLP di QA-lab tramite un container Docker reale di OpenTelemetry Collector
  prima delle asserzioni del receiver locale.
- Esegui `pnpm qa:prometheus:smoke` quando convalidi lo scraping Prometheus protetto.
  Esercita QA-lab, rifiuta gli scrape non autenticati e verifica che
  le famiglie di metriche critiche per il rilascio restino prive di contenuto dei prompt, identificatori raw,
  token auth e percorsi locali.
- Esegui `pnpm qa:observability:smoke` quando vuoi le lane smoke OpenTelemetry e
  Prometheus del checkout sorgente in sequenza.
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- Il preflight di `OpenClaw NPM Release` genera evidenze di rilascio delle dipendenze prima
  di impacchettare il tarball npm. Il gate sulle vulnerabilità degli advisory npm è
  bloccante per il rilascio. I report su rischio del manifesto transitivo, superficie di ownership/installazione
  delle dipendenze e modifiche delle dipendenze sono solo evidenze di rilascio. Il
  report delle modifiche delle dipendenze confronta il candidato di rilascio con il precedente
  tag di rilascio raggiungibile.
- Il preflight carica le evidenze delle dipendenze come
  `openclaw-release-dependency-evidence-<tag>` e le incorpora anche sotto
  `dependency-evidence/` dentro l'artifact preflight npm preparato. Il percorso reale
  di pubblicazione riutilizza quell'artifact preflight, poi allega le stesse evidenze
  al rilascio GitHub come `openclaw-<version>-dependency-evidence.zip`.
- Esegui `OpenClaw Release Publish` per la sequenza mutante di pubblicazione dopo che il
  tag esiste. Dispatchalo da `release/YYYY.M.PATCH` (o `main` quando pubblichi un
  tag raggiungibile da main), passa il tag di rilascio, il `preflight_run_id`
  npm OpenClaw riuscito e il `full_release_validation_run_id` riuscito, e mantieni
  lo scope di pubblicazione plugin predefinito `all-publishable` salvo che tu stia deliberatamente
  eseguendo una riparazione mirata. Il workflow serializza pubblicazione npm dei plugin, pubblicazione
  ClawHub dei plugin e pubblicazione npm di OpenClaw, così il pacchetto core non viene pubblicato
  prima dei suoi plugin esternalizzati.
- `OpenClaw Release Publish` stable richiede un `windows_node_tag` esatto dopo
  l'esistenza del rilascio `openclaw/openclaw-windows-node` non prerelease corrispondente.
  Richiede inoltre la mappa `windows_node_installer_digests` approvata per il candidato.
  Prima di dispatchare qualsiasi child di pubblicazione, verifica che il rilascio sorgente sia
  pubblicato, non prerelease, contenga gli installer x64/ARM64 richiesti e
  corrisponda ancora a quella mappa approvata. Poi dispatcha `Windows Node Release`
  mentre il rilascio OpenClaw è ancora una bozza, portando invariata la mappa di digest
  degli installer fissata. Il workflow child
  scarica gli installer Windows Hub firmati da quel tag esatto,
  li confronta con i digest fissati, verifica su un runner Windows che le loro firme
  Authenticode usino il firmatario OpenClaw Foundation previsto,
  scrive un manifesto SHA-256 e carica gli installer più il manifesto sul
  rilascio GitHub canonico di OpenClaw, quindi riscarica gli asset promossi e
  verifica appartenenza al manifesto e hash. Il parent verifica il contratto asset corrente
  x64, ARM64 e checksum prima della pubblicazione. Il recupero diretto
  rifiuta nomi asset `OpenClawCompanion-*` inattesi prima di sostituire gli
  asset del contratto previsti con i byte sorgente fissati. Dispatcha manualmente
  `Windows Node Release` solo per recupero, e passa sempre un tag esatto, mai
  `latest`, più la mappa JSON esplicita `expected_installer_digests` dal
  rilascio sorgente approvato. I link di download del sito web dovrebbero puntare agli URL esatti degli asset di rilascio OpenClaw
  per il rilascio stable corrente, oppure
  `releases/latest/download/...` solo dopo aver verificato che il redirect latest di GitHub
  punti a quello stesso rilascio; non collegare solo alla pagina di rilascio del repo companion.
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche la lane di parità mock QA Lab più il profilo Matrix live
  veloce e la lane QA Telegram prima dell'approvazione del rilascio. Le lane live
  usano l'ambiente `qa-live-shared`; Telegram usa anche lease di credenziali CI
  Convex. Esegui il workflow manuale `QA-Lab - All Lanes` con
  `matrix_profile=all` e `matrix_shards=true` quando vuoi inventario completo Matrix
  su trasporto, media ed E2EE in parallelo.
- La convalida runtime di installazione e aggiornamento cross-OS fa parte dei workflow pubblici
  `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il
  workflow riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantieni il percorso reale di rilascio npm breve,
  deterministico e focalizzato sugli artifact, mentre i controlli live più lenti restano nella loro
  lane così non rallentano né bloccano la pubblicazione
- I controlli di rilascio che portano segreti dovrebbero essere dispatchati tramite `Full Release
Validation` o dal ref workflow `main`/release, così logica del workflow e
  segreti restano controllati
- `OpenClaw Release Checks` accetta un branch, tag o SHA completo di commit purché
  il commit risolto sia raggiungibile da un branch OpenClaw o da un tag di rilascio
- Anche il preflight solo convalida di `OpenClaw NPM Release` accetta l'attuale
  SHA completo di commit del branch workflow a 40 caratteri senza richiedere un tag pushato
- Quel percorso SHA è solo di convalida e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un tag di rilascio reale
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione su runner
  ospitati da GitHub, mentre il percorso di convalida non mutante può usare i runner Linux
  Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più la lane separata dei controlli di rilascio
- Prima di taggare localmente un candidato di rilascio, esegui
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. L'helper
  esegue guardrail di rilascio veloci, controlli di rilascio npm/ClawHub dei plugin, build,
  build UI e `release:openclaw:npm:check` nell'ordine che intercetta errori comuni
  che bloccano l'approvazione prima dell'avvio del workflow di pubblicazione GitHub.
- Esegui `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (o la versione beta/correzione corrispondente) per verificare il percorso di
  installazione del registry pubblicato in un nuovo prefisso temporaneo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare l'onboarding del pacchetto installato, la configurazione di Telegram e l'E2E reale di Telegram
  rispetto al pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram noleggiate.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente
  le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke beta completo post-pubblicazione da una macchina maintainer, usa `pnpm release:beta-smoke -- --beta betaN`. L'helper esegue la validazione Parallels di aggiornamento npm/target nuovo, invia `NPM Telegram Beta E2E`, esegue il polling dell'esecuzione workflow esatta, scarica l'artefatto e stampa il report Telegram.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione di release dei maintainer ora usa preflight-poi-promozione:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere inviata dallo stesso branch `main` o
    `release/YYYY.M.PATCH` dell'esecuzione preflight riuscita
  - le release npm stabili hanno come valore predefinito `beta`
  - la pubblicazione npm stabile può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione npm dist-tag basata su token ora risiede in
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` perché
    `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il repo sorgente mantiene
    la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di validazione; quando un tag esiste solo su un
    branch di release ma il workflow viene inviato da `main`, imposta
    `public_release_branch=release/YYYY.M.PATCH`
  - la pubblicazione macOS reale deve superare `preflight_run_id` e
    `validate_run_id` macOS riusciti
  - i percorsi di pubblicazione reale promuovono gli artefatti preparati invece di ricostruirli
    di nuovo
- Per le release stabili di correzione come `YYYY.M.PATCH-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.PATCH` a `YYYY.M.PATCH-N`
  così le correzioni di release non possono lasciare silenziosamente le installazioni globali più vecchie sul
  payload stabile di base
- Il preflight della release npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto
  così non spediamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che gli entrypoint dei Plugin pubblicati e
  i metadati del pacchetto siano presenti nel layout del registry installato. Una release che
  spedisce payload runtime dei Plugin mancanti fallisce il verificatore postpublish e
  non può essere promossa a `latest`.
- `pnpm test:install:smoke` applica anche il budget npm pack `unpackedSize` sul
  tarball candidato di aggiornamento, così l'e2e dell'installer intercetta aumenti accidentali delle dimensioni del pacchetto
  prima del percorso di pubblicazione della release
- Se il lavoro di release ha toccato la pianificazione CI, i manifest di temporizzazione delle estensioni o
  le matrici di test delle estensioni, rigenera e rivedi gli output della matrice
  `plugin-prerelease-extension-shard` di proprietà del planner da
  `.github/workflows/plugin-prerelease.yml` prima dell'approvazione, così le note di release
  non descrivono un layout CI obsoleto
- La prontezza della release macOS stabile include anche le superfici dell'updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione; il
    workflow di pubblicazione macOS lo committa automaticamente, oppure apre una PR
    appcast quando il push diretto è bloccato
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un URL feed Sparkle
    non vuoto e un `CFBundleVersion` pari o superiore al floor canonico della build Sparkle
    per quella versione di release

## Ambienti di test di rilascio

`Full Release Validation` è il modo in cui gli operatori avviano tutti i test pre-rilascio da
un unico punto di ingresso. Per una prova di commit fissato su un branch in rapido movimento, usa
l'helper così ogni workflow figlio viene eseguito da un branch temporaneo fissato allo SHA
di destinazione:

```bash
pnpm ci:full-release --sha <full-sha>
```

L'helper esegue il push di `release-ci/<sha>-...`, avvia `Full Release Validation`
da quel branch con `ref=<sha>`, verifica che ogni `headSha` dei workflow figli
corrisponda alla destinazione, quindi elimina il branch temporaneo. Questo evita di provare per errore
un'esecuzione figlia più recente di `main`.

Per la validazione di un branch o tag di rilascio, eseguila dal riferimento workflow `main`
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

Il workflow risolve il riferimento di destinazione, avvia manualmente `CI` con
`target_ref=<release-ref>`, quindi avvia `OpenClaw Release Checks`.
`OpenClaw Release Checks` distribuisce install smoke, controlli di rilascio cross-OS,
copertura live/E2E del percorso di rilascio Docker quando il soak è abilitato, Package Acceptance
con l'E2E canonico del pacchetto Telegram, parità QA Lab, Matrix live e
Telegram live. Un'esecuzione completa/all è accettabile solo quando il riepilogo di `Full Release Validation`
mostra `normal_ci`, `plugin_prerelease` e `release_checks` come
riusciti, a meno che una riesecuzione mirata non abbia intenzionalmente saltato il figlio separato `Plugin
Prerelease`. Usa il figlio autonomo `npm-telegram` solo per una riesecuzione mirata
del pacchetto pubblicato con `release_package_spec` o
`npm_telegram_package_spec`. Il riepilogo finale del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, così il release
manager può vedere il percorso critico corrente senza scaricare i log.
Consulta [Validazione completa del rilascio](/it/reference/full-release-validation) per la
matrice completa delle fasi, i nomi esatti dei job workflow, le differenze tra profilo stable e full,
gli artefatti e gli handle per le riesecuzioni mirate.
I workflow figli vengono avviati dal riferimento attendibile che esegue `Full Release
Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un
branch o tag di rilascio precedente. Non esiste un input separato per il riferimento workflow di Full Release Validation;
scegli l'harness attendibile scegliendo il riferimento dell'esecuzione workflow.
Non usare `--ref main -f ref=<sha>` per una prova esatta di commit su `main` in movimento;
gli SHA di commit grezzi non possono essere riferimenti di workflow dispatch, quindi usa
`pnpm ci:full-release --sha <sha>` per creare il branch temporaneo fissato.

Usa `release_profile` per selezionare l'ampiezza live/provider:

- `minimum`: percorso OpenAI/core live e Docker più rapido e critico per il rilascio
- `stable`: minimum più copertura stabile di provider/backend per l'approvazione del rilascio
- `full`: stable più ampia copertura consultiva di provider/media

La validazione stable e full esegue sempre l'esaustivo sweep live/E2E, del percorso di rilascio Docker
e dei survivor di upgrade pubblicati e delimitati prima della promozione.
Usa `run_release_soak=true` per richiedere lo stesso sweep per una beta. Quello sweep copre
gli ultimi quattro pacchetti stable più le baseline fissate `2026.4.23` e `2026.5.2`
più la copertura precedente `2026.4.15`, con le baseline duplicate rimosse e
ogni baseline suddivisa nel proprio job runner Docker.

`OpenClaw Release Checks` usa il riferimento workflow attendibile per risolvere una volta il riferimento di destinazione
come `release-package-under-test` e riutilizza quell'artefatto nei controlli cross-OS,
Package Acceptance e Docker del percorso di rilascio quando il soak viene eseguito. Questo mantiene
tutti gli ambienti orientati al pacchetto sugli stessi byte ed evita build ripetute del pacchetto.
Dopo che una beta è già su npm, imposta `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
così i controlli di rilascio scaricano una volta il pacchetto distribuito, estraggono il suo SHA sorgente di build
da `dist/build-info.json` e riutilizzano quell'artefatto per cross-OS,
Package Acceptance, Docker del percorso di rilascio e lane Telegram del pacchetto.
L'install smoke OpenAI cross-OS usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando la
variabile repo/org è impostata, altrimenti `openai/gpt-5.4`, perché questa lane sta
provando l'installazione del pacchetto, l'onboarding, l'avvio del gateway e un turno agente live
anziché misurare il modello predefinito più lento. La matrice più ampia dei provider live
rimane il luogo per la copertura specifica per modello.

Usa queste varianti a seconda della fase di rilascio:

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

Non usare l'ombrello completo come prima riesecuzione dopo una correzione mirata. Se un ambiente
fallisce, usa il workflow figlio, il job, la lane Docker, il profilo pacchetto, il provider di modello
o la lane QA falliti per la prova successiva. Esegui di nuovo l'ombrello completo solo quando
la correzione ha modificato l'orchestrazione di rilascio condivisa o ha reso obsolete le prove precedenti di tutti gli ambienti.
Il verificatore finale dell'ombrello ricontrolla gli ID registrati delle esecuzioni workflow figlie, quindi dopo che un workflow figlio
è stato rieseguito con successo, riesegui solo il job padre `Verify full validation` fallito.

Per un recupero delimitato, passa `rerun_group` all'ombrello. `all` è la vera
esecuzione del release candidate, `ci` esegue solo il figlio CI normale, `plugin-prerelease`
esegue solo il figlio Plugin di solo rilascio, `release-checks` esegue ogni ambiente di rilascio
e i gruppi di rilascio più ristretti sono `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Le riesecuzioni mirate `npm-telegram` richiedono `release_package_spec` o
`npm_telegram_package_spec`; le esecuzioni full/all usano l'E2E Telegram del pacchetto canonico
dentro Package Acceptance. Le riesecuzioni mirate
cross-OS possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o
un altro filtro OS/suite. I fallimenti QA release-check bloccano la normale validazione del rilascio,
incluso il drift richiesto degli strumenti dinamici OpenClaw nel livello standard.
Le esecuzioni alpha Tideclaw possono ancora trattare le lane release-check non legate alla sicurezza del pacchetto come
consultive. Quando `live_suite_filter` richiede esplicitamente una lane QA live protetta come
Discord, WhatsApp o Slack, la variabile repo corrispondente
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` deve essere abilitata; altrimenti
la cattura degli input fallisce invece di saltare silenziosamente la lane.

### Vitest

L'ambiente Vitest è il workflow figlio manuale `CI`. La CI manuale bypassa intenzionalmente
lo scoping basato sulle modifiche e forza il grafo di test normale per il release
candidate: shard Linux Node, shard dei Plugin in bundle, shard dei contratti di Plugin e canali,
compatibilità Node 22, `check-*`, `check-additional-*`,
controlli smoke sugli artefatti buildati, controlli docs, Skills Python, Windows, macOS
e i18n della Control UI. Android è incluso quando `Full Release Validation` esegue
l'ambiente perché l'ombrello passa `include_android=true`; la CI manuale autonoma
richiede `include_android=true` per la copertura Android.

Usa questo ambiente per rispondere a "l'albero sorgente ha superato l'intera suite di test normale?"
Non è la stessa cosa della validazione prodotto del percorso di rilascio. Prove da conservare:

- riepilogo `Full Release Validation` che mostra l'URL dell'esecuzione `CI` avviata
- esecuzione `CI` verde sullo SHA di destinazione esatto
- nomi degli shard falliti o lenti dai job CI quando si indagano regressioni
- artefatti di tempistica Vitest come `.artifacts/vitest-shard-timings.json` quando
  un'esecuzione richiede analisi delle prestazioni

Esegui direttamente la CI manuale solo quando il rilascio richiede CI normale deterministica ma
non gli ambienti Docker, QA Lab, live, cross-OS o package. Usa il primo comando
per la CI diretta non Android. Aggiungi `include_android=true` quando la CI diretta del
release candidate deve coprire Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

L'ambiente Docker vive in `OpenClaw Release Checks` tramite
`openclaw-live-and-e2e-checks-reusable.yml`, più il workflow
`install-smoke` in modalità rilascio. Valida il release candidate tramite ambienti Docker
pacchettizzati invece che solo test a livello sorgente.

La copertura Docker di rilascio include:

- install smoke completo con lo smoke dell'installazione globale Bun lenta abilitato
- preparazione/riutilizzo dell'immagine smoke Dockerfile root per SHA di destinazione, con job smoke QR,
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
- lane divise di installazione/disinstallazione dei Plugin in bundle
  da `bundled-plugin-install-uninstall-0` a
  `bundled-plugin-install-uninstall-23`
- suite provider live/E2E e copertura modello live Docker quando i controlli di rilascio
  includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica
`.artifacts/docker-tests/` con log delle lane, `summary.json`, `failures.json`,
tempistiche delle fasi, JSON del piano dello scheduler e comandi di riesecuzione. Per il recupero mirato,
usa `docker_lanes=<lane[,lane]>` sul workflow live/E2E riutilizzabile invece di
rieseguire tutti i chunk di rilascio. I comandi di riesecuzione generati includono il precedente
`package_artifact_run_id` e gli input dell'immagine Docker preparata quando disponibili, così una
lane fallita può riutilizzare lo stesso tarball e le stesse immagini GHCR.

### QA Lab

L'ambiente QA Lab fa anch'esso parte di `OpenClaw Release Checks`. È il gate di rilascio
del comportamento agentico e a livello di canale, separato da Vitest e dai meccanismi
del pacchetto Docker.

La copertura QA Lab di rilascio include:

- lane di parità mock che confronta la lane candidata OpenAI con la baseline Opus 4.6
  usando il pacchetto di parità agentica
- profilo QA Matrix live rapido usando l'ambiente `qa-live-shared`
- lane QA Telegram live usando lease di credenziali CI Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` o
  `pnpm qa:observability:smoke` quando la telemetria del rilascio richiede una prova locale
  esplicita

Usa questo ambiente per rispondere a "il rilascio si comporta correttamente negli scenari QA e
nei flussi dei canali live?" Conserva gli URL degli artefatti per le lane parità, Matrix e Telegram
quando approvi il rilascio. La copertura Matrix completa rimane disponibile come
esecuzione QA-Lab sharded manuale invece che come lane predefinita critica per il rilascio.

### Package

L'ambiente Package è il gate del prodotto installabile. È supportato da
`Package Acceptance` e dal resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Il resolver normalizza un
candidato nel tarball `package-under-test` consumato da Docker E2E, valida
l'inventario del pacchetto, registra la versione del pacchetto e SHA-256, e mantiene il
riferimento dell'harness workflow separato dal riferimento sorgente del pacchetto.

Sorgenti candidate supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oppure una versione esatta di una release OpenClaw
- `source=ref`: impacchetta un branch, tag o SHA commit completo `package_ref` attendibile
  con l'harness `workflow_ref` selezionato
- `source=url`: scarica un `.tgz` HTTPS pubblico con `package_sha256` obbligatorio;
  credenziali URL, porte HTTPS non predefinite, nomi host o indirizzi risolti
  privati/interni/a uso speciale e reindirizzamenti non sicuri vengono rifiutati
- `source=trusted-url`: scarica un `.tgz` HTTPS con
  `package_sha256` e `trusted_source_id` obbligatori da una policy denominata in
  `.github/package-trusted-sources.json`; usalo per mirror enterprise di proprietà dei maintainer
  o repository di pacchetti privati invece di aggiungere a `source=url` un bypass
  della rete privata a livello di input
- `source=artifact`: riusa un `.tgz` caricato da un'altra esecuzione di GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto
del pacchetto di release preparato, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance mantiene la migrazione, l'aggiornamento,
il riavvio dell'aggiornamento con autenticazione configurata, l'installazione live di Skills ClawHub, la pulizia delle dipendenze obsolete dei Plugin, i fixture dei Plugin offline, l'aggiornamento dei Plugin e la QA del pacchetto Telegram rispetto allo stesso tarball risolto. I controlli di release bloccanti usano la baseline predefinita dell'ultimo pacchetto pubblicato;
il profilo beta con `run_release_soak=true`, `release_profile=stable` o
`release_profile=full` si espande a ogni baseline stabile pubblicata su npm da
`2026.4.23` fino a `latest`, più i fixture dei problemi segnalati. Usa
Package Acceptance con `source=npm` per un candidato già distribuito,
`source=ref` per un tarball npm locale basato su SHA prima della pubblicazione,
`source=trusted-url` per un mirror enterprise/privato di proprietà dei maintainer, oppure
`source=artifact` per un tarball preparato caricato da un'altra esecuzione di GitHub Actions.
È il sostituto nativo di GitHub
per la maggior parte della copertura pacchetto/aggiornamento che in precedenza richiedeva
Parallels. I controlli di release cross-OS restano importanti per onboarding,
installer e comportamento della piattaforma specifici del sistema operativo, ma la validazione prodotto di pacchetto/aggiornamento dovrebbe
preferire Package Acceptance.

La checklist canonica per la validazione di aggiornamenti e Plugin è
[Testing updates and plugins](/it/help/testing-updates-plugins). Usala quando
decidi quale lane locale, Docker, Package Acceptance o di controllo release dimostra una
modifica di installazione/aggiornamento Plugin, pulizia doctor o migrazione del pacchetto pubblicato.
La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è
un workflow manuale `Update Migration` separato, non parte di Full Release CI.

La tolleranza legacy di package-acceptance è intenzionalmente limitata nel tempo. I pacchetti fino a
`2026.4.25` possono usare il percorso di compatibilità per lacune nei metadati già pubblicate
su npm: voci dell'inventario QA privato mancanti dal tarball, `gateway install --wrapper`
mancante, file di patch mancanti nel fixture git derivato dal tarball,
`update.channel` persistito mancante, posizioni legacy dei record di installazione dei Plugin,
persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione
durante `plugins update`. Il pacchetto `2026.4.26` pubblicato può emettere avvisi
per file locali di marcatura dei metadati di build che erano già stati distribuiti. I pacchetti successivi
devono soddisfare i contratti moderni dei pacchetti; quelle stesse lacune fanno fallire la validazione
di release.

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

- `smoke`: lane rapide per installazione pacchetto/canale/agente, rete Gateway e ricaricamento
  configurazione
- `package`: contratti di pacchetto per installazione/aggiornamento/riavvio/Plugin più prova di installazione live di Skills ClawHub; è il valore predefinito dei controlli di release
- `product`: `package` più canali MCP, pulizia cron/subagente, ricerca web OpenAI e OpenWebUI
- `full`: blocchi del percorso di release Docker con OpenWebUI
- `custom`: elenco esatto `docker_lanes` per riesecuzioni mirate

Per la prova Telegram di un pacchetto candidato, abilita `telegram_mode=mock-openai` oppure
`telegram_mode=live-frontier` su Package Acceptance. Il workflow passa il tarball
`package-under-test` risolto nella lane Telegram; il workflow Telegram autonomo
accetta comunque una specifica npm pubblicata per i controlli post-pubblicazione.

## Automazione di pubblicazione delle release regolari

Per beta, `latest`, Plugin, GitHub Release e pubblicazione su piattaforme,
`OpenClaw Release Publish` è il normale entrypoint mutante. Il percorso monthly
`.33+` npm-only extended-stable non usa questo orchestratore. Il workflow regolare
orchestra i workflow trusted-publisher nell'ordine richiesto dalla release:

1. Esegui il checkout del tag di release e risolvi il suo SHA commit.
2. Verifica che il tag sia raggiungibile da `main` o `release/*`.
3. Esegui `pnpm plugins:sync:check`.
4. Esegui il dispatch di `Plugin NPM Release` con `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Esegui il dispatch di `Plugin ClawHub Release` con lo stesso scope e SHA.
6. Esegui il dispatch di `OpenClaw NPM Release` con il tag di release, il dist-tag npm e
   il `preflight_run_id` salvato dopo aver verificato il
   `full_release_validation_run_id` salvato.
7. Per le release stabili, crea o aggiorna la release GitHub come bozza, esegui il dispatch
   di `Windows Node Release` con il `windows_node_tag` esplicito e
   `windows_node_installer_digests` approvati per il candidato, quindi verifica gli asset canonici
   dell'installer/checksum prima di pubblicare la bozza.

Esempio di pubblicazione beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Pubblicazione stabile al dist-tag beta predefinito:

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
solo per riparazioni o ripubblicazioni mirate. `OpenClaw Release Publish` rifiuta
`plugin_publish_scope=selected` quando `publish_openclaw_npm=true`, così il pacchetto
core non può essere distribuito senza ogni Plugin ufficiale pubblicabile, incluso
`@openclaw/diffs-language-pack`. Per una riparazione di Plugin selezionato, imposta
`publish_openclaw_npm=false` con `plugin_publish_scope=selected` e
`plugins=@openclaw/name`, oppure esegui direttamente il dispatch del workflow figlio.

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può essere anche lo SHA commit completo
  di 40 caratteri corrente del branch del workflow per preflight di sola validazione
- `preflight_only`: `true` solo per validazione/build/pacchetto, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale, così il workflow riusa
  il tarball preparato dall'esecuzione preflight riuscita
- `full_release_validation_run_id`: obbligatorio per pubblicazione reale monthly extended-stable e regolare
  non beta, così il workflow autentica l'esecuzione di validazione esatta
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; accetta `alpha`, `beta`,
  `latest` o `extended-stable` e il valore predefinito è `beta`. La patch finale `33` e successive devono
  usare `extended-stable`; per impostazione predefinita, `extended-stable` rifiuta patch precedenti e rifiuta sempre
  tag non finali.
- `bypass_extended_stable_guard`: booleano solo per test, predefinito `false`; con
  `npm_dist_tag=extended-stable`, bypassa l'idoneità monthly extended-stable preservando
  identità di release, artefatto, approvazione e controlli di rilettura.

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio; deve già esistere
- `preflight_run_id`: id dell'esecuzione preflight riuscita di `OpenClaw NPM Release`;
  obbligatorio quando `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id dell'esecuzione riuscita di `Full Release Validation`;
  obbligatorio quando `publish_openclaw_npm=true`
- `windows_node_tag`: tag di release esatto non prerelease di `openclaw/openclaw-windows-node`;
  obbligatorio per la pubblicazione stabile di OpenClaw
- `windows_node_installer_digests`: mappa JSON compatta, approvata per il candidato, dei
  nomi correnti degli installer Windows ai rispettivi digest `sha256:` bloccati; obbligatoria
  per la pubblicazione stabile di OpenClaw
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw
- `plugin_publish_scope`: valore predefinito `all-publishable`; usa `selected` solo
  per lavori mirati di riparazione solo Plugin con `publish_openclaw_npm=false`
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: valore predefinito `true`; imposta `false` solo quando usi il
  workflow come orchestratore di riparazione solo Plugin
- `wait_for_clawhub`: valore predefinito `false`, così la disponibilità npm non viene bloccata dal
  sidecar ClawHub; imposta `true` solo quando il completamento del workflow deve includere
  il completamento di ClawHub

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: branch, tag o SHA commit completo da validare. I controlli che usano segreti
  richiedono che il commit risolto sia raggiungibile da un branch OpenClaw o
  da un tag di release.
- `run_release_soak`: abilita soak esaustivo live/E2E, percorso di release Docker e
  all-since upgrade-survivor per i controlli di release beta. Viene forzato da
  `release_profile=stable` e `release_profile=full`.

Regole:

- Le versioni finali regolari e di correzione sotto la patch `33` possono pubblicare su
  `beta` o `latest`. Le versioni finali alla patch `33` o superiore devono pubblicare su
  `extended-stable`, e le versioni con suffisso di correzione a quella soglia vengono rifiutate.
- I tag prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre
  solo validazione
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica che i metadati prima della pubblicazione continuino a corrispondere

## Sequenza di release stabile regolare beta/latest

Questa sequenza legacy è per la release regolare orchestrata che possiede anche
Plugin, GitHub Release, Windows e altro lavoro di piattaforma. Non è il percorso
monthly `.33+` npm-only extended-stable documentato all'inizio di questa pagina.

Quando si prepara una release stabile regolare orchestrata:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare lo SHA del commit completo corrente
     del branch del workflow per una prova a secco solo di convalida del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stabile diretta
3. Esegui `Full Release Validation` sul branch di rilascio, sul tag di rilascio o sullo SHA
   completo del commit quando vuoi la normale CI più copertura live per prompt cache,
   Docker, QA Lab, Matrix e Telegram da un unico workflow manuale
4. Se intenzionalmente ti serve solo il grafo di test normale deterministico, esegui invece
   il workflow manuale `CI` sul ref di rilascio
5. Seleziona l'esatto tag di rilascio non prerelease `openclaw/openclaw-windows-node`
   i cui installer firmati x64 e ARM64 devono essere distribuiti. Salvalo come
   `windows_node_tag` e salva la loro mappa di digest convalidata come
   `windows_node_installer_digests`. L'helper della release candidate registra entrambi
   e li include nel comando di pubblicazione generato.
6. Salva i `preflight_run_id` e `full_release_validation_run_id` riusciti
7. Esegui `OpenClaw Release Publish` con lo stesso `tag`, lo stesso `npm_dist_tag`,
   il `windows_node_tag` selezionato, i relativi `windows_node_installer_digests` salvati,
   il `preflight_run_id` salvato e il `full_release_validation_run_id` salvato;
   pubblica i plugin esternalizzati su npm e ClawHub prima di promuovere il
   pacchetto npm OpenClaw
8. Se il rilascio è arrivato su `beta`, usa il workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stabile da `beta` a `latest`
9. Se il rilascio ha pubblicato intenzionalmente direttamente su `latest` e `beta`
   deve seguire subito la stessa build stabile, usa lo stesso workflow di rilascio
   per puntare entrambi i dist-tag alla versione stabile, oppure lascia che la sua
   sincronizzazione pianificata di autoriparazione sposti `beta` in seguito

La mutazione dei dist-tag vive nel repository del registro di rilascio perché richiede ancora
`NPM_TOKEN`, mentre il repository sorgente mantiene la pubblicazione solo tramite OIDC.

Questo mantiene documentati e visibili agli operatori sia il percorso di pubblicazione diretta sia
il percorso di promozione beta-first.

Se un maintainer deve ricorrere all'autenticazione npm locale, esegui qualsiasi comando della
CLI (`op`) di 1Password solo all'interno di una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; mantenerlo dentro tmux rende prompt,
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
