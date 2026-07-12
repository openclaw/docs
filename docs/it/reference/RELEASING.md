---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida della release o dell'accettazione del pacchetto
    - Cerchi informazioni sulla denominazione delle versioni e sulla cadenza dei rilasci
summary: Canali di rilascio, lista di controllo per gli operatori, riquadri di convalida, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-07-12T07:29:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw espone attualmente tre canali di aggiornamento rivolti agli utenti:

- stable: il canale delle release promosse esistente, che continua a risolversi tramite `latest` di npm finché non sarà completata la milestone separata relativa a CLI/canali
- beta: tag di prerelease pubblicati su `beta` di npm
- dev: la punta in continuo movimento di `main`

Separatamente, gli operatori delle release possono pubblicare su `extended-stable` di npm il pacchetto core dell'ultimo mese completato, a partire dalla patch `33`. La normale linea finale del mese corrente continua su `latest` di npm; questa separazione della pubblicazione lato operatore non modifica di per sé la risoluzione dei canali di aggiornamento della CLI.

Le build alpha di Tideclaw costituiscono un percorso interno separato di prerelease (dist-tag npm `alpha`), descritto in [Input del flusso di lavoro NPM](#npm-workflow-inputs) e [Ambienti di test delle release](#release-test-boxes).

## Denominazione delle versioni

- Versione mensile della release extended-stable di npm: `YYYY.M.PATCH`, con `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Versione giornaliera/finale regolare della release: `YYYY.M.PATCH`, con `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Versione regolare della release correttiva di ripiego: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Versione prerelease beta: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Versione prerelease alpha: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Non aggiungere mai zeri iniziali al mese o alla patch
- `PATCH` è un numero sequenziale del ciclo mensile di release, non un giorno del calendario. Le release finali regolari e beta fanno avanzare il ciclo corrente; i tag esclusivamente alpha non consumano né fanno avanzare il numero di patch beta/regolare, quindi, quando si seleziona un ciclo beta o regolare, vanno ignorati i tag legacy esclusivamente alpha con numeri di patch superiori.
- Le build alpha/notturne usano il successivo ciclo di patch non ancora rilasciato e, per le build ripetute, incrementano soltanto `alpha.N`. Quando quella patch riceve una beta, le nuove build alpha passano alla patch successiva.
- Le versioni npm sono immutabili: non eliminare, ripubblicare o riutilizzare mai un tag pubblicato. Creare invece il numero di prerelease successivo o la patch mensile successiva.
- `latest` continua a seguire la linea npm regolare/giornaliera corrente; `beta` è la destinazione di installazione beta corrente
- `extended-stable` indica il pacchetto npm supportato del mese precedente, a partire dalla patch `33`; la patch `34` e quelle successive sono release di manutenzione di quella linea mensile
- Le release finali regolari e le release correttive regolari vengono pubblicate per impostazione predefinita su `beta` di npm; gli operatori delle release possono scegliere esplicitamente `latest` oppure promuovere in seguito una build beta già verificata
- Il percorso mensile dedicato extended-stable pubblica il pacchetto core npm e ogni Plugin ufficiale pubblicabile su npm con la stessa identica versione. Non pubblica Plugin su ClawHub né artefatti macOS o Windows, una release GitHub, dist-tag di repository privati, immagini Docker, artefatti per dispositivi mobili o download dal sito web.
- Ogni release finale regolare distribuisce insieme il pacchetto npm, l'app macOS, l'APK Android autonomo firmato e i programmi di installazione firmati di Windows Hub. Le release beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, mentre la compilazione, la firma, l'autenticazione notarile e la promozione delle app native sono riservate alla release finale regolare, salvo richiesta esplicita.

## Cadenza delle release

- Le release procedono partendo dalla beta; stable segue soltanto dopo la convalida della beta più recente
- Normalmente i manutentori creano le release da un ramo `release/YYYY.M.PATCH` derivato da `main` corrente, affinché la convalida e le correzioni della release non blocchino il nuovo sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i manutentori creano il tag `-beta.N` successivo invece di eliminare o ricreare quello precedente
- La procedura dettagliata di release, le approvazioni, le credenziali e le note di ripristino sono riservate ai manutentori

## Pubblicazione mensile extended-stable esclusivamente su npm

Questa è un'eccezione dedicata alla normale procedura di release descritta di seguito. Per un mese completato `YYYY.M`, creare `extended-stable/YYYY.M.33`; pubblicare `vYYYY.M.33` e le successive patch di manutenzione dallo stesso ramo. Il tag della release, la punta del ramo, il checkout, la versione del pacchetto, il controllo preliminare npm e l'esecuzione della convalida completa della release devono identificare tutti lo stesso commit. Il ramo protetto `main` deve già contenere una versione finale di un mese di calendario strettamente successivo con patch inferiore a `33`; le patch di manutenzione restano idonee anche dopo che `main` è avanzato di più di un mese.

Sul ramo extended-stable esatto, aggiornare il pacchetto radice a `YYYY.M.P`, eseguire `pnpm release:prep` e verificare che ogni pacchetto di estensione pubblicabile abbia la stessa versione. Eseguire il commit e il push di tutte le modifiche generate, creare e inviare il tag immutabile `vYYYY.M.P` su quel commit e registrare lo SHA completo risultante. I flussi di lavoro utilizzano questo albero preparato; non aggiornano né sincronizzano le versioni al posto dell'operatore.

Eseguire il controllo preliminare npm e la convalida completa della release dalla punta esatta del ramo preparato, quindi salvare entrambi gli ID di esecuzione e il tentativo riuscito dell'esecuzione della convalida completa della release:

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

`release_profile=stable` è il profilo esistente relativo alla profondità della convalida; è distinto dal dist-tag npm `extended-stable` e rimane intenzionalmente invariato.

Dopo che entrambe le esecuzioni sono riuscite, pubblicare ogni Plugin ufficiale pubblicabile su npm dalla stessa identica punta del ramo. La patch `P` deve essere `33` o superiore. Passare lo SHA completo della release come `ref`, attendere il completamento dell'intera matrice e della rilettura del registro, quindi salvare l'ID dell'esecuzione riuscita di Plugin NPM Release:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Il flusso di lavoro utilizza il normale inventario preparato dei pacchetti `all-publishable`, inclusi i pacchetti il cui codice sorgente non è cambiato. Prima di riuscire, verifica ogni pacchetto esatto e ogni tag `extended-stable` dei Plugin. Se un'esecuzione parziale non riesce, ripetere lo stesso comando: i pacchetti già pubblicati vengono riutilizzati, i tag dei Plugin mancanti o obsoleti vengono riconciliati nell'ambiente di release npm e la rilettura finale continua a coprire l'insieme completo dei pacchetti.

Dopo la riuscita del flusso di lavoro dei Plugin e quando l'ambiente di release npm è pronto, pubblicare il tarball esatto del controllo preliminare del core. La pubblicazione del core verifica che l'esecuzione dei Plugin indicata sia `completed/success` sullo stesso ramo canonico e sullo SHA esatto del codice sorgente:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Per una simulazione su un fork o in un ambiente non di produzione che intenzionalmente non può soddisfare il criterio mensile `.33` o il criterio relativo al mese del ramo protetto `main`, aggiungere `-f bypass_extended_stable_guard=true` sia all'avvio del controllo preliminare npm sia a quello della pubblicazione. Il valore predefinito è `false`. L'aggiramento viene accettato soltanto con `npm_dist_tag=extended-stable` e viene registrato nel riepilogo del flusso di lavoro. Non aggira il riferimento canonico del flusso di lavoro `extended-stable/YYYY.M.33`, l'uguaglianza tra punta del ramo, tag e checkout, la sintassi del tag finale, l'uguaglianza tra versione del pacchetto e del tag, l'identità dell'esecuzione e del manifesto indicati, la provenienza del tarball, l'approvazione dell'ambiente, la rilettura del registro o le prove di correzione del selettore.

Il flusso di lavoro di pubblicazione verifica le identità del controllo preliminare, della convalida e dell'esecuzione dei Plugin indicati, il digest del tarball preparato e i selettori del registro del core. Dopo la riuscita del flusso di lavoro, confermare il risultato in modo indipendente:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Entrambi i comandi devono restituire `YYYY.M.P`. Se la pubblicazione riesce ma la rilettura del selettore non riesce, non ripubblicare la versione immutabile del pacchetto. Utilizzare l'unico comando di correzione `npm dist-tag add openclaw@YYYY.M.P extended-stable` mostrato nel riepilogo sempre eseguito del flusso di lavoro non riuscito, quindi ripetere entrambe le riletture indipendenti. Il ripristino del selettore precedente è una decisione separata dell'operatore, non il percorso di correzione della rilettura.

La documentazione pubblica di supporto indica inizialmente Slack, Discord e Codex come superfici Plugin coperte da extended-stable. Questo elenco è una dichiarazione di supporto, non una lista consentita nel codice di release: ogni Plugin ufficiale pubblicabile su npm segue lo stesso identico percorso di pubblicazione della versione.

La checklist regolare seguente continua a gestire beta, `latest`, le release GitHub, i Plugin, macOS, Windows e la pubblicazione sulle altre piattaforme. Non eseguire questi passaggi per questo percorso extended-stable esclusivamente su npm.

## Checklist regolare dell'operatore delle release

Questa checklist rappresenta la forma pubblica del flusso di release. Le credenziali private, la firma, l'autenticazione notarile, il ripristino dei dist-tag e i dettagli per il rollback di emergenza restano nel manuale operativo delle release riservato ai manutentori.

1. Parti dall’attuale `main`: esegui il pull dell’ultima versione, verifica che il commit di destinazione sia stato inviato e che la CI di `main` sia sufficientemente verde da potervi creare un branch.
2. Genera la sezione iniziale di `CHANGELOG.md` dalle PR unite e da tutti i commit diretti successivi all’ultimo tag di rilascio raggiungibile. Mantieni le voci rivolte agli utenti, elimina i duplicati tra le voci sovrapposte di PR e commit diretti, esegui commit e push, quindi esegui ancora una volta rebase/pull prima di creare il branch. Quando un tag distribuito divergente o un successivo forward-port riassocia PR già rilasciate, passa esplicitamente quel tag come `--shipped-ref`; il verificatore usa le righe esplicite delle PR provenienti dai record completi dei contributi nelle sezioni numerate dello snapshot del tag, ignora `Unreleased` e registra l’inventario esatto e il conteggio delle PR escluse.
3. Esamina i record di compatibilità del rilascio in `src/plugins/compat/registry.ts` e `src/commands/doctor/shared/deprecation-compat.ts`. Rimuovi la compatibilità scaduta solo quando il percorso di aggiornamento resta coperto, oppure documenta perché viene mantenuta intenzionalmente.
4. Crea `release/YYYY.M.PATCH` dall’attuale `main`. Non eseguire il normale lavoro di rilascio direttamente su `main`.
5. Aggiorna ogni posizione di versione richiesta per il tag, quindi esegui `pnpm release:prep`. Aggiorna, nell’ordine, le versioni dei Plugin, gli shrinkwrap npm, l’inventario dei Plugin, lo schema di configurazione di base, i metadati di configurazione dei canali inclusi, la baseline della documentazione di configurazione, le esportazioni dell’SDK dei Plugin e la baseline dell’API dell’SDK dei Plugin. Esegui il commit di qualsiasi variazione generata prima di creare il tag, quindi esegui il preflight locale deterministico: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Esegui `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag, per il preflight di sola convalida è consentito uno SHA completo di 40 caratteri del branch di rilascio. Il preflight genera le evidenze di rilascio delle dipendenze per l’esatto grafo delle dipendenze estratto e le archivia nell’artefatto del preflight npm. Salva il `preflight_run_id` riuscito.
7. Avvia tutti i test preliminari al rilascio con `Full Release Validation` per il branch di rilascio, il tag o lo SHA completo del commit. Questo è l’unico punto di ingresso manuale per i quattro grandi gruppi di test del rilascio: Vitest, Docker, QA Lab e Package. Salva `full_release_validation_run_id` e l’esatto `full_release_validation_run_attempt`; entrambi sono input obbligatori per `OpenClaw NPM Release` e `OpenClaw Release Publish`.
8. Se la convalida non riesce, correggi il problema sul branch di rilascio e riesegui il più piccolo file, percorso, processo del workflow, profilo del pacchetto, provider o elenco consentito di modelli non riuscito che dimostri la correzione. Riesegui l’intero gruppo complessivo solo quando la superficie modificata rende obsolete le evidenze precedenti.
9. Per un candidato beta con tag, esegui `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` dal branch `release/YYYY.M.PATCH` corrispondente. Per la versione stabile, passa anche il rilascio sorgente Windows obbligatorio: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. L’helper usa il `main` attendibile come sorgente del workflow, mentre ogni workflow prende di mira il tag esatto. Registra l’identità immutabile del candidato e degli strumenti, nonché gli ID delle esecuzioni avviate, in `.artifacts/release-candidate/<tag>/release-candidate-state.json`; rieseguendo lo stesso comando vengono riprese esattamente quelle esecuzioni, mentre qualsiasi variazione del candidato, degli strumenti, del profilo o delle opzioni causa un arresto in sicurezza. Prima di avviare la matrice completa di convalida, l’helper genera in modo deterministico il corpo esatto del rilascio GitHub del tag e rifiuta un’intestazione di versione mancante, un corpo oltre il limite che non può usare la forma compatta canonica oppure una provenienza di base/destinazione dei record dei contributi non raggiungibile dal tag. Convalida inoltre qualsiasi metadato esplicito di esclusione dalla baseline distribuita rispetto ai record cumulativi del tag indicato. Esegue quindi i controlli locali del rilascio generato, avvia o verifica la convalida completa del rilascio e le evidenze del preflight npm, esegue la prova di installazione nuova/aggiornamento su Parallels rispetto all’esatto tarball preparato insieme alla prova del pacchetto Telegram, registra i piani npm e ClawHub dei Plugin e stampa il comando esatto `OpenClaw Release Publish` solo dopo che il pacchetto di evidenze è verde.

   `OpenClaw Release Publish` invia in parallelo a npm i pacchetti dei Plugin selezionati o tutti quelli pubblicabili e lo stesso insieme a ClawHub, quindi promuove l’artefatto del preflight npm di OpenClaw preparato con il dist-tag corrispondente quando la pubblicazione npm dei Plugin riesce. Il checkout del rilascio rimane la radice del prodotto e dei dati, mentre la pianificazione e la verifica finale vengono eseguite dall’esatto checkout attendibile della sorgente del workflow, affinché un commit di rilascio precedente non possa usare silenziosamente strumenti di rilascio obsoleti. Prima dell’avvio di qualsiasi processo figlio di pubblicazione, genera e memorizza nella cache il corpo esatto del rilascio GitHub. Quando la sezione completa corrispondente di `CHANGELOG.md` rientra nel limite di 125.000 caratteri di GitHub e nel corrispondente limite di sicurezza di 125.000 byte del generatore, la pagina contiene esattamente quella sezione `## YYYY.M.PATCH`, inclusa l’intestazione. Quando la sezione sorgente non rientra nei limiti, la pagina conserva le esatte note editoriali raggruppate e sostituisce il record dei contributi troppo grande con un collegamento stabile al record completo nel `CHANGELOG.md` fissato al tag; non vengono mai pubblicati record parziali né punti elenco troncati. Il workflow sceglie il corpo completo o compatto prima di aggiungere `### Verifica del rilascio`; se la parte finale delle prove superasse il limite, conserva il corpo canonico e si affida invece alle evidenze immutabili allegate. I rilasci stabili pubblicati su npm `latest` diventano l’ultimo rilascio GitHub, mentre i rilasci stabili di manutenzione mantenuti su npm `beta` vengono creati con GitHub `latest=false`. Il workflow carica inoltre nel rilascio GitHub le evidenze delle dipendenze del preflight, il manifesto della convalida completa e le evidenze di verifica del registro successive alla pubblicazione per la gestione degli incidenti successivi al rilascio. Stampa immediatamente gli ID delle esecuzioni figlie, approva automaticamente i controlli degli ambienti di rilascio che il token del workflow è autorizzato ad approvare, riepiloga i processi figli non riusciti con le parti finali dei log, crea subito la pagina di rilascio GitHub in bozza e promuove gli artefatti Windows e Android contemporaneamente alla pubblicazione npm di OpenClaw, completa la pagina di rilascio e le evidenze delle dipendenze quando tali fasi riescono, attende ClawHub ogni volta che viene pubblicato OpenClaw su npm, quindi esegue il verificatore beta del `main` attendibile e carica le evidenze successive alla pubblicazione per il rilascio GitHub, il pacchetto npm, i pacchetti npm dei Plugin selezionati, i pacchetti ClawHub selezionati, gli ID delle esecuzioni dei workflow figli e l’eventuale ID dell’esecuzione NPM Telegram. Il verificatore di bootstrap ClawHub richiede l’esatto percorso e SHA del workflow del `main` attendibile, i tentativi di esecuzione del produttore e del processo terminale, lo SHA del rilascio, l’insieme di pacchetti richiesto, la tupla immutabile dell’artefatto del pacchetto e l’artefatto terminale di rilettura del registro; un’esecuzione legacy riuscita basata sul riferimento del rilascio non viene accettata.

   Esegui quindi l’accettazione del pacchetto successiva alla pubblicazione sul pacchetto pubblicato `openclaw@YYYY.M.PATCH-beta.N` o `openclaw@beta`. Se una prerelease inviata o pubblicata richiede una correzione, crea il numero di prerelease corrispondente successivo; non eliminare né riscrivere mai quello precedente.

10. Per la versione stabile, continua solo dopo che la beta o il candidato di rilascio verificato dispone delle evidenze di convalida richieste. Anche la pubblicazione npm stabile passa attraverso `OpenClaw Release Publish`, riutilizzando l’artefatto del preflight riuscito tramite `preflight_run_id`. La preparazione del rilascio stabile per macOS richiede inoltre i file `.zip`, `.dmg`, `.dSYM.zip` confezionati e il file `appcast.xml` aggiornato su `main`; il workflow di pubblicazione macOS pubblica automaticamente l’appcast firmato sul `main` pubblico dopo aver verificato gli artefatti del rilascio, oppure apre o aggiorna una PR per l’appcast se la protezione del branch impedisce il push diretto. La preparazione stabile di Windows Hub richiede gli artefatti firmati `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` e `OpenClawCompanion-SHA256SUMS.txt` nel rilascio GitHub di OpenClaw. Passa l’esatto tag di rilascio firmato di `openclaw/openclaw-windows-node` come `windows_node_tag` e la relativa mappa dei digest degli installer approvata dal candidato come `windows_node_installer_digests`; `OpenClaw Release Publish` mantiene la bozza del rilascio, avvia `Windows Node Release` e verifica tutti e tre gli artefatti prima della pubblicazione.
11. Dopo la pubblicazione, esegui il verificatore npm successivo alla pubblicazione, l’eventuale E2E Telegram autonomo del pacchetto npm pubblicato quando serve una prova del canale successiva alla pubblicazione, la promozione del dist-tag quando necessaria, verifica la pagina di rilascio GitHub generata, esegui i passaggi dell’annuncio del rilascio, quindi completa [Chiusura stabile di main](#stable-main-closeout) prima di considerare terminato un rilascio stabile.

## Chiusura stabile di main

La pubblicazione stabile non è completa finché `main` non contiene lo stato effettivo del rilascio distribuito.

1. Parti dall’ultima versione aggiornata di `main`. Verifica `release/YYYY.M.PATCH` rispetto a essa ed esegui il forward-port delle correzioni effettive assenti da `main`. Non unire indiscriminatamente nel `main` più recente adattatori di compatibilità, test o convalida specifici del rilascio.
2. Imposta `main` sulla versione stabile distribuita, non su un ipotetico ciclo successivo. Esegui `pnpm release:prep` dopo la modifica della versione radice, quindi `pnpm deps:shrinkwrap:generate`.
3. Fai corrispondere esattamente la sezione `## YYYY.M.PATCH` di `CHANGELOG.md` su `main` al branch di rilascio con tag. Includi l’aggiornamento stabile di `appcast.xml` se il rilascio macOS ne ha pubblicato uno.
4. Non aggiungere `YYYY.M.PATCH+1`, una versione beta o una sezione futura vuota del changelog a `main` finché l’operatore non avvia esplicitamente quel ciclo di rilascio.
5. Esegui `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` e `OPENCLAW_TESTBOX=1 pnpm check:changed`. Esegui il push, quindi verifica che `origin/main` contenga la versione distribuita e il changelog prima di considerare concluso il rilascio stabile.
6. Mantieni aggiornate le variabili del repository `RELEASE_ROLLBACK_DRILL_ID` e `RELEASE_ROLLBACK_DRILL_DATE` dopo ogni esercitazione privata di rollback.

`OpenClaw Stable Main Closeout` parte dal push su `main` che contiene la versione distribuita, il changelog e l’appcast dopo la pubblicazione stabile. Legge le evidenze immutabili successive alla pubblicazione per associare il tag distribuito alle relative esecuzioni di Full Release Validation e Publish, quindi verifica lo stato stabile di main, il rilascio, il periodo di osservazione stabile obbligatorio e le evidenze bloccanti sulle prestazioni. Allega al rilascio GitHub un manifesto di chiusura immutabile e il relativo checksum. L’attivazione automatica tramite push ignora i rilasci legacy precedenti alle evidenze immutabili successive alla pubblicazione e non considera mai tale esclusione una chiusura completata.

Una chiusura completa richiede entrambi gli artefatti e un checksum corrispondente. Un manifesto parziale riesegue lo SHA di `main` e l’esercitazione di rollback registrati per rigenerare byte identici, quindi allega il checksum mancante; una coppia non valida, o un checksum senza manifesto, rimane bloccante. Un’esecuzione attivata tramite push senza le variabili del repository relative all’esercitazione di rollback viene ignorata senza completare la chiusura; un record dell’esercitazione mancante o più vecchio di 90 giorni continua a bloccare la chiusura manuale basata sulle evidenze. I comandi privati di ripristino restano nel runbook riservato ai manutentori. Usa l’avvio manuale solo per riparare o rieseguire una chiusura stabile basata sulle evidenze.

Un tag legacy di correzione con fallback può riutilizzare le evidenze del pacchetto di base solo quando il tag di correzione si risolve nello stesso commit sorgente del tag stabile di base. Il relativo rilascio Android riutilizza l’APK verificato del tag di base e aggiunge la provenienza del tag di correzione. Una correzione con sorgente diversa deve pubblicare e verificare le proprie evidenze del pacchetto e usare un `versionCode` Android superiore.

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima dei controlli preliminari della release, affinché il codice TypeScript dei test rimanga coperto al di fuori del più rapido controllo locale `pnpm check`.
- Esegui `pnpm check:architecture` prima dei controlli preliminari della release, affinché i controlli più ampi sui cicli di importazione e sui confini architetturali risultino superati al di fuori del più rapido controllo locale.
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check`, affinché gli artefatti di release `dist/*` previsti e il bundle dell'interfaccia di controllo esistano per la fase di convalida del pacchetto.
- Esegui `pnpm release:prep` dopo l'incremento della versione radice e prima di creare il tag. Esegue tutti i generatori deterministici della release che tendono a divergere dopo una modifica di versione, configurazione o API: versioni dei plugin, shrinkwrap npm, inventario dei plugin, schema della configurazione di base, metadati della configurazione dei canali inclusi, baseline della documentazione di configurazione, esportazioni dell'SDK dei plugin e baseline dell'API dell'SDK dei plugin. `pnpm release:check` riesegue questi controlli in modalità di verifica, insieme a un controllo del budget della superficie dell'SDK dei plugin, e segnala in un'unica esecuzione ogni errore dovuto alla divergenza dei contenuti generati prima di eseguire i controlli di release dei pacchetti.
- La sincronizzazione delle versioni dei plugin aggiorna per impostazione predefinita il pacchetto runtime pubblicabile `@openclaw/ai`, le versioni dei pacchetti dei plugin ufficiali e i limiti minimi `openclaw.compat.pluginApi` esistenti alla versione della release di OpenClaw. Considera questo campo come il limite minimo dell'API dell'SDK/runtime dei plugin, non soltanto come una copia della versione del pacchetto: per le release dei soli plugin che rimangono intenzionalmente compatibili con host OpenClaw meno recenti, mantieni il limite minimo all'API dell'host supportato meno recente e documenta questa scelta nelle prove della release del plugin.
- Esegui manualmente il flusso di lavoro `Full Release Validation` prima dell'approvazione della release, per avviare tutte le piattaforme di test preliminari della release da un unico punto di ingresso. Accetta un ramo, un tag o uno SHA completo del commit, avvia manualmente `CI` e avvia `OpenClaw Release Checks` per i test rapidi di installazione, l'accettazione del pacchetto, i controlli multipiattaforma del pacchetto, la parità del laboratorio QA e le corsie Matrix e Telegram. Le esecuzioni stabili e complete includono sempre test live/E2E esaustivi e una prova prolungata del percorso di release Docker; `run_release_soak=true` viene mantenuto per una prova prolungata esplicita della beta. L'accettazione del pacchetto fornisce il test E2E Telegram canonico del pacchetto durante la convalida del candidato, evitando un secondo processo concorrente di polling live.

  Fornisci `release_package_spec` dopo aver pubblicato una beta per riutilizzare il pacchetto npm distribuito nei controlli della release, nell'accettazione del pacchetto e nel test E2E Telegram del pacchetto, senza ricostruire il tarball della release. Fornisci `npm_telegram_package_spec` soltanto quando Telegram deve utilizzare un pacchetto pubblicato diverso da quello usato per il resto della convalida della release. Fornisci `package_acceptance_package_spec` quando l'accettazione del pacchetto deve utilizzare un pacchetto pubblicato diverso da quello indicato nelle specifiche del pacchetto di release. Fornisci `evidence_package_spec` quando il rapporto delle prove della release deve dimostrare che la convalida corrisponde a un pacchetto npm pubblicato senza imporre il test E2E Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Esegui manualmente il flusso di lavoro `Package Acceptance` quando desideri prove collaterali per un pacchetto candidato mentre il lavoro sulla release prosegue. Usa `source=npm` per `openclaw@beta`, `openclaw@latest` o una versione esatta della release; `source=ref` per creare il pacchetto da un ramo, tag o SHA `package_ref` attendibile con l'infrastruttura `workflow_ref` corrente; `source=url` per un tarball HTTPS pubblico con SHA-256 obbligatorio e criteri rigorosi per gli URL pubblici; `source=trusted-url` per criteri relativi a una fonte attendibile denominata, usando `trusted_source_id` e SHA-256 obbligatori; oppure `source=artifact` per un tarball caricato da un'altra esecuzione di GitHub Actions.

  Il flusso di lavoro risolve il candidato in `package-under-test`, riutilizza lo scheduler E2E Docker della release con tale tarball e può eseguire il QA di Telegram sullo stesso tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le corsie Docker selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto è il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato sia come CLI installata sia come pacchetto sottoposto a test, in modo da esercitare il percorso di riavvio gestito del comando di aggiornamento del candidato.

  Esempio:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Profili comuni:
  - `smoke`: corsie di installazione, canale e agente, rete del Gateway e ricaricamento della configurazione
  - `package`: corsie native dell'artefatto per pacchetto, aggiornamento, riavvio e plugin, senza OpenWebUI o ClawHub live
  - `product`: profilo del pacchetto più canali MCP, pulizia di Cron e sottoagenti, ricerca web OpenAI e OpenWebUI
  - `full`: blocchi del percorso di release Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata

- Esegui direttamente e manualmente il flusso di lavoro `CI` quando ti serve soltanto una copertura deterministica della normale integrazione continua per il candidato alla release. Gli avvii manuali della CI ignorano la delimitazione basata sulle modifiche e impongono gli shard Linux Node, gli shard dei plugin inclusi, gli shard dei contratti di plugin e canali, la compatibilità con Node 22, `check-*`, `check-additional-*`, i test rapidi degli artefatti compilati, i controlli della documentazione, le skill Python, Windows, macOS e le corsie i18n dell'interfaccia di controllo. Le esecuzioni manuali autonome della CI includono Android soltanto quando vengono avviate con `include_android=true`; `Full Release Validation` passa questo parametro al proprio processo CI figlio.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Esegui `pnpm qa:otel:smoke` durante la convalida della telemetria della release. Esercita il laboratorio QA tramite un ricevitore OTLP/HTTP locale e verifica l'esportazione di tracce, metriche e registri, oltre alla limitazione degli attributi delle tracce e all'oscuramento dei contenuti e degli identificatori, senza richiedere Opik, Langfuse o un altro raccoglitore esterno.
- Esegui `pnpm qa:otel:collector-smoke` durante la convalida della compatibilità del raccoglitore. Instrada la stessa esportazione OTLP del laboratorio QA attraverso un vero contenitore Docker OpenTelemetry Collector prima delle asserzioni del ricevitore locale.
- Esegui `pnpm qa:prometheus:smoke` durante la convalida dello scraping Prometheus protetto. Esercita il laboratorio QA, rifiuta gli scraping non autenticati e verifica che le famiglie di metriche essenziali per la release rimangano prive di contenuto dei prompt, identificatori non elaborati, token di autenticazione e percorsi locali.
- Esegui `pnpm qa:observability:smoke` per eseguire consecutivamente le corsie di test rapido OpenTelemetry e Prometheus dal checkout dei sorgenti.
- Esegui `pnpm release:check` prima di ogni release con tag.
- I controlli preliminari di `OpenClaw NPM Release` generano le prove relative alle dipendenze della release prima di creare il tarball npm. Il controllo delle vulnerabilità degli avvisi npm blocca la release. I rapporti sul rischio del manifesto transitivo, sulla proprietà e sulla superficie di installazione delle dipendenze e sulle modifiche alle dipendenze costituiscono soltanto prove della release. Il rapporto sulle modifiche alle dipendenze confronta il candidato alla release con il precedente tag di release raggiungibile. I controlli preliminari caricano le prove delle dipendenze come `openclaw-release-dependency-evidence-<tag>` e le incorporano anche in `dependency-evidence/` nell'artefatto npm preparato dai controlli preliminari. Il percorso di pubblicazione effettivo riutilizza tale artefatto preliminare e quindi allega le stesse prove alla release GitHub come `openclaw-<version>-dependency-evidence.zip`.
- Esegui `OpenClaw Release Publish` per la sequenza di pubblicazione con modifiche dopo la creazione del tag. Avvia le normali pubblicazioni beta e stabili dal ramo `main` attendibile; il tag della release seleziona comunque il commit di destinazione esatto e può puntare a `release/YYYY.M.PATCH`. Le pubblicazioni alpha di Tideclaw rimangono sul ramo alpha corrispondente. Passa il valore `preflight_run_id` dell'esecuzione npm OpenClaw riuscita, il valore `full_release_validation_run_id` riuscito e il valore esatto `full_release_validation_run_attempt`, e mantieni l'ambito predefinito di pubblicazione dei plugin `all-publishable`, a meno che tu non stia eseguendo deliberatamente una riparazione mirata. Il flusso di lavoro serializza la pubblicazione npm dei plugin, la pubblicazione dei plugin su ClawHub e la pubblicazione npm di OpenClaw, affinché il pacchetto principale non venga pubblicato prima dei relativi plugin esternalizzati; la promozione per Windows e Android viene eseguita contemporaneamente alla pubblicazione npm principale usando la pagina di release in bozza. Le riesecuzioni della pubblicazione sono ripristinabili: se una versione npm principale è già pubblicata, l'avvio principale viene ignorato dopo che il flusso di lavoro ha dimostrato che il tarball del registro corrisponde all'artefatto preliminare del tag; inoltre, la promozione per Windows e Android viene ignorata quando la release contiene già il contratto degli asset verificato, così un nuovo tentativo riesegue soltanto le fasi non riuscite. Le riparazioni mirate dei soli plugin richiedono `plugin_publish_scope=selected` e un elenco di plugin non vuoto. Le esecuzioni `all-publishable` dei soli plugin richiedono prove preliminari complete e immutabili e prove complete di convalida della release; le prove parziali vengono rifiutate.
- Una pubblicazione stabile con `OpenClaw Release Publish` richiede un valore esatto di `windows_node_tag` dopo la creazione della corrispondente release non preliminare `openclaw/openclaw-windows-node`, oltre alla mappa `windows_node_installer_digests` approvata per il candidato. Prima di avviare qualsiasi processo figlio di pubblicazione, verifica che la release sorgente sia pubblicata, non preliminare, contenga i programmi di installazione x64/ARM64 richiesti e corrisponda ancora alla mappa approvata. Quindi avvia `Windows Node Release` mentre la release OpenClaw è ancora una bozza, trasferendo senza modifiche la mappa bloccata dei digest dei programmi di installazione. Il flusso di lavoro figlio scarica i programmi di installazione firmati di Windows Hub da quel tag esatto, li confronta con i digest bloccati, verifica su un runner Windows che le relative firme Authenticode usino il firmatario previsto OpenClaw Foundation, crea un manifesto SHA-256 e carica i programmi di installazione e il manifesto nella release GitHub canonica di OpenClaw; quindi scarica nuovamente gli asset promossi e verifica l'appartenenza al manifesto e gli hash. Il processo padre verifica il contratto corrente degli asset x64, ARM64 e dei checksum prima della pubblicazione. Il ripristino diretto rifiuta nomi di asset `OpenClawCompanion-*` imprevisti prima di sostituire gli asset previsti dal contratto con i byte bloccati della sorgente.

  Avvia manualmente `Windows Node Release` soltanto per il ripristino e passa sempre un tag esatto, mai `latest`, insieme alla mappa JSON esplicita `expected_installer_digests` della release sorgente approvata. I collegamenti di download del sito web devono puntare agli URL esatti degli asset della release OpenClaw stabile corrente, oppure a `releases/latest/download/...` soltanto dopo aver verificato che il reindirizzamento GitHub alla versione più recente punti alla stessa release; non inserire un collegamento soltanto alla pagina della release del repository complementare.

- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato: `OpenClaw Release Checks`. Prima dell’approvazione del rilascio, esegue anche la corsia di parità simulata di QA Lab, il profilo Matrix live rapido e la corsia QA di Telegram. Le corsie live utilizzano l’ambiente `qa-live-shared`; Telegram utilizza anche i lease delle credenziali CI di Convex. Esegui il workflow manuale `QA-Lab - All Lanes` con `matrix_profile=all` e `matrix_shards=true` quando vuoi eseguire in parallelo l’inventario completo di trasporto, contenuti multimediali ed E2EE di Matrix.
- La convalida del runtime di installazione e aggiornamento su più sistemi operativi fa parte dei workflow pubblici `OpenClaw Release Checks` e `Full Release Validation`, che chiamano direttamente il workflow riutilizzabile `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Questa separazione è intenzionale: mantiene il percorso reale di rilascio npm breve, deterministico e incentrato sugli artefatti, mentre i controlli live più lenti restano nella propria corsia, evitando di rallentare o bloccare la pubblicazione.
- I controlli di rilascio che utilizzano segreti devono essere avviati tramite `Full Release Validation` o dal riferimento del workflow `main`/di rilascio, affinché la logica del workflow e i segreti rimangano controllati.
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA completo di commit, purché il commit risolto sia raggiungibile da un branch o da un tag di rilascio di OpenClaw.
- Anche il controllo preliminare di sola convalida di `OpenClaw NPM Release` accetta lo SHA completo di 40 caratteri del commit corrente del branch del workflow senza richiedere un tag pubblicato. Tale percorso SHA è riservato alla convalida e non può essere promosso a una pubblicazione reale. In modalità SHA, il workflow genera `v<package.json version>` esclusivamente per il controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio.
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione sui runner ospitati da GitHub, mentre il percorso di convalida non mutante può utilizzare i runner Linux Blacksmith più grandi.
- Tale workflow esegue `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` utilizzando entrambi i segreti del workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`.
- Il controllo preliminare del rilascio npm non attende più la corsia separata dei controlli di rilascio.
- Prima di creare localmente il tag di una release candidate, esegui `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. L’helper esegue, nell’ordine che consente di individuare gli errori comuni che bloccano l’approvazione prima dell’avvio del workflow di pubblicazione GitHub, i controlli rapidi di sicurezza del rilascio, i controlli di rilascio npm/ClawHub dei Plugin, la build, la build dell’interfaccia utente e `release:openclaw:npm:check`.
- Esegui `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o il tag di prerelease/correzione corrispondente) prima dell’approvazione.
- Dopo la pubblicazione npm, esegui `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versione beta/di correzione corrispondente) per verificare il percorso di installazione dal registro pubblicato in un nuovo prefisso temporaneo.
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` per verificare l’onboarding del pacchetto installato, la configurazione di Telegram e l’E2E reale di Telegram rispetto al pacchetto npm pubblicato, utilizzando il pool condiviso di credenziali Telegram con lease. Per esecuzioni locali occasionali, i manutentori possono omettere le variabili Convex e passare direttamente le tre credenziali d’ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire da una macchina di un manutentore lo smoke test beta completo successivo alla pubblicazione, utilizza `pnpm release:beta-smoke -- --beta betaN`. L’helper esegue la convalida dell’aggiornamento npm e della destinazione pulita in Parallels, avvia `NPM Telegram Beta E2E`, interroga l’esecuzione esatta del workflow, scarica l’artefatto e stampa il rapporto Telegram.
- I manutentori possono eseguire lo stesso controllo successivo alla pubblicazione da GitHub Actions tramite il workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e non viene eseguito a ogni merge.
- L’automazione del rilascio per i manutentori utilizza prima il controllo preliminare e poi la promozione:
  - La pubblicazione npm reale deve superare con successo un `preflight_run_id` npm.
  - L’orchestrazione della pubblicazione beta e stabile ordinaria e il relativo controllo preliminare utilizzano il branch `main` attendibile rispetto al tag di destinazione esatto. La pubblicazione alpha di Tideclaw e il relativo controllo preliminare utilizzano il branch alpha corrispondente.
  - I rilasci npm stabili usano `beta` per impostazione predefinita; la pubblicazione npm stabile può specificare esplicitamente `latest` tramite l’input del workflow.
  - La modifica basata su token dei dist-tag npm risiede in `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, perché `npm dist-tag add` richiede ancora `NPM_TOKEN`, mentre il repository sorgente mantiene la pubblicazione basata esclusivamente su OIDC.
  - Il workflow pubblico `macOS Release` è riservato alla convalida; quando un tag esiste soltanto su un branch di rilascio ma il workflow viene avviato da `main`, imposta `public_release_branch=release/YYYY.M.PATCH`.
  - La pubblicazione reale per macOS deve superare con successo i valori macOS `preflight_run_id` e `validate_run_id`.
  - I percorsi di pubblicazione reali promuovono gli artefatti preparati anziché ricompilarli.
- Per i rilasci stabili di correzione come `YYYY.M.PATCH-N`, il verificatore successivo alla pubblicazione controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.PATCH` a `YYYY.M.PATCH-N`, affinché le correzioni di rilascio non possano lasciare silenziosamente le installazioni globali precedenti sul payload stabile di base.
- Il controllo preliminare del rilascio npm non procede se il tarball non include sia `dist/control-ui/index.html` sia un payload non vuoto in `dist/control-ui/assets/`, evitando così di distribuire nuovamente una dashboard del browser vuota.
- La verifica successiva alla pubblicazione controlla inoltre che gli entrypoint dei Plugin pubblicati e i metadati del pacchetto siano presenti nel layout del registro installato. Un rilascio privo dei payload di runtime dei Plugin non supera il verificatore successivo alla pubblicazione e non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica inoltre il limite `unpackedSize` del pacchetto npm al tarball candidato per l’aggiornamento, affinché l’E2E del programma di installazione rilevi aumenti accidentali delle dimensioni del pacchetto prima del percorso di pubblicazione del rilascio.
- Se il lavoro di rilascio ha modificato la pianificazione della CI, i manifest dei tempi delle estensioni o le matrici di test delle estensioni, rigenera e revisiona gli output della matrice `plugin-prerelease-extension-shard`, gestiti dal pianificatore, in `.github/workflows/plugin-prerelease.yml` prima dell’approvazione, affinché le note di rilascio non descrivano un layout CI obsoleto.
- La preparazione del rilascio stabile per macOS include anche le superfici del programma di aggiornamento: il rilascio GitHub deve infine contenere i pacchetti `.zip`, `.dmg` e `.dSYM.zip`; dopo la pubblicazione, `appcast.xml` su `main` deve puntare al nuovo file zip stabile (il workflow di pubblicazione macOS ne esegue automaticamente il commit oppure apre una PR per l’appcast se il push diretto è bloccato); l’applicazione pacchettizzata deve mantenere un ID bundle non di debug, un URL del feed Sparkle non vuoto e un `CFBundleVersion` uguale o superiore alla soglia minima canonica della build Sparkle per tale versione di rilascio.

## Ambienti di test del rilascio

`Full Release Validation` consente agli operatori di avviare tutti i test preliminari al rilascio da un unico punto di ingresso. Per dimostrare un commit bloccato su un branch in rapida evoluzione, utilizza l’helper affinché ogni workflow figlio venga eseguito da un branch temporaneo fissato a uno SHA attendibile del workflow `main`, mentre il commit richiesto rimane il candidato sottoposto a test:

```bash
pnpm ci:full-release --sha <full-sha>
```

L’helper recupera lo stato corrente di `origin/main`, pubblica `release-ci/<workflow-sha>-...` in corrispondenza di tale commit attendibile del workflow, avvia `Full Release Validation` dal branch temporaneo con `ref=<target-sha>`, riutilizza le prove rigorose della destinazione esatta quando disponibili, verifica che ogni `headSha` dei workflow figli corrisponda allo SHA bloccato del workflow padre, quindi elimina il branch temporaneo. Passa `-f reuse_evidence=false` per forzare una nuova esecuzione oppure `--workflow-sha <trusted-main-sha>` per bloccare un commit precedente ancora raggiungibile dallo stato corrente di `origin/main`. Il workflow stesso non scrive mai riferimenti nel repository. In questo modo, gli strumenti di rilascio disponibili soltanto su `main` rimangono utilizzabili senza aggiungere commit degli strumenti al candidato e si evita di dimostrare accidentalmente un’esecuzione figlia di una versione più recente di `main`.

Per convalidare un branch o un tag di rilascio, esegui il workflow dal riferimento attendibile `main` e passa il branch o il tag di rilascio come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Il workflow risolve il riferimento di destinazione, avvia manualmente `CI` con `target_ref=<release-ref>`, quindi avvia `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuisce in parallelo lo smoke test di installazione, i controlli di rilascio su più sistemi operativi, la copertura live/E2E Docker del percorso di rilascio quando è abilitato il soak test, l’accettazione del pacchetto con l’E2E canonico del pacchetto Telegram, la parità di QA Lab, Matrix live e Telegram live. Un’esecuzione completa/totale è accettabile soltanto quando il riepilogo di `Full Release Validation` mostra `normal_ci`, `plugin_prerelease` e `release_checks` come riusciti, salvo che una nuova esecuzione mirata abbia intenzionalmente saltato il workflow figlio separato `Plugin Prerelease`. Utilizza il workflow figlio autonomo `npm-telegram` soltanto per una nuova esecuzione mirata del pacchetto pubblicato con `release_package_spec` o `npm_telegram_package_spec`. Il riepilogo finale del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, consentendo al responsabile del rilascio di individuare il percorso critico corrente senza scaricare i log.

In questo percorso di rilascio, il workflow figlio per le prestazioni del prodotto genera soltanto artefatti. Il
workflow principale lo avvia con `publish_reports=false` e la convalida viene rifiutata
se la relativa protezione per la modalità solo artefatti non dimostra che il pubblicatore
dei rapporti Clawgrit è rimasto inattivo.

Consulta [Convalida completa del rilascio](/it/reference/full-release-validation) per la matrice completa delle fasi, i nomi esatti dei job dei workflow, le differenze tra i profili stabile e completo, gli artefatti e i parametri per le nuove esecuzioni mirate.

I workflow figli vengono avviati dal riferimento attendibile che esegue `Full Release Validation`, normalmente `--ref main`, anche quando il `ref` di destinazione punta a un branch o a un tag di rilascio precedente. Ogni esecuzione figlia deve utilizzare lo SHA esatto del workflow padre; se `main` avanza prima che l’avvio di un workflow figlio venga risolto, il workflow principale non procede. Non esiste un input separato per il riferimento del workflow di Full Release Validation; seleziona l’infrastruttura attendibile scegliendo il riferimento di esecuzione del workflow. Non utilizzare `--ref main -f ref=<sha>` per dimostrare un commit esatto sul branch `main` in movimento; gli SHA grezzi dei commit non possono essere riferimenti per l’avvio di workflow, quindi utilizza `pnpm ci:full-release --sha <target-sha>` per creare un branch temporaneo sullo stato attendibile di `origin/main`, mantenendo lo SHA di destinazione come input candidato.

Utilizza `release_profile` per selezionare l’ampiezza della copertura live/dei provider:

- `minimum`: percorso live e Docker più rapido e critico per il rilascio di OpenAI/core
- `stable`: copertura minima più la copertura stabile di provider/backend per l’approvazione del rilascio
- `full`: copertura stabile più un’ampia copertura consultiva di provider/contenuti multimediali

La convalida stabile e completa esegue sempre, prima della promozione, l’intera copertura live/E2E, il percorso di rilascio Docker e la verifica limitata della persistenza degli aggiornamenti dei pacchetti pubblicati. Utilizza `run_release_soak=true` per richiedere la stessa verifica per una beta. Tale verifica copre gli ultimi quattro pacchetti stabili, oltre alle versioni di riferimento bloccate `2026.4.23` e `2026.5.2` e alla copertura precedente `2026.4.15`, rimuovendo i riferimenti duplicati e distribuendo ogni riferimento in un job runner Docker dedicato.

`OpenClaw Release Checks` utilizza il riferimento attendibile del workflow per risolvere una sola volta il riferimento di destinazione come `release-package-under-test` e riutilizza tale artefatto nei controlli su più sistemi operativi, nell’accettazione del pacchetto e nei controlli Docker del percorso di rilascio durante il soak test. In questo modo, tutti gli ambienti che operano sui pacchetti utilizzano gli stessi byte e si evitano compilazioni ripetute del pacchetto. Quando una beta è già disponibile su npm, imposta `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, affinché i controlli di rilascio scarichino una sola volta il pacchetto distribuito, estraggano il relativo SHA del sorgente della build da `dist/build-info.json` e riutilizzino tale artefatto per i controlli su più sistemi operativi, l’accettazione del pacchetto, Docker sul percorso di rilascio e le corsie Telegram del pacchetto.

Lo smoke test di installazione OpenAI su più sistemi operativi utilizza `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando è impostata la variabile del repository/dell’organizzazione; in caso contrario utilizza `openai/gpt-5.6-luna`, perché questa corsia dimostra l’installazione del pacchetto, l’onboarding, l’avvio del Gateway e un turno live dell’agente, anziché misurare le prestazioni del modello più potente. La matrice più ampia dei provider live rimane la sede appropriata per la copertura specifica dei modelli.

Utilizza queste varianti in base alla fase del rilascio:

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

Non usare il flusso completo come primo nuovo tentativo dopo una correzione mirata. Se una fase non riesce, usa il workflow figlio, il job, la corsia Docker, il profilo del pacchetto, il provider del modello o la corsia QA non riusciti per la verifica successiva. Esegui nuovamente il flusso completo solo quando la correzione ha modificato l'orchestrazione condivisa del rilascio o ha reso obsolete le precedenti evidenze di tutte le fasi. Il verificatore finale del flusso ricontrolla gli ID di esecuzione registrati dei workflow figli; pertanto, dopo aver rieseguito correttamente un workflow figlio, riesegui solo il job padre `Verify full validation` non riuscito.

`rerun_group=all` può riutilizzare una precedente esecuzione riuscita del flusso completo solo quando questa ha convalidato esattamente lo stesso SHA di destinazione, profilo di rilascio, impostazione di soak effettiva e input di convalida. Si tratta di un ripristino circoscritto per rieseguire lo stesso candidato, non del riutilizzo di evidenze tra SHA diversi. Per un candidato modificato, incluso un commit che modifica solo il changelog o la versione, riesegui ogni controllo di pacchetto, artefatto, installazione, Docker o provider interessato dai percorsi modificati o dagli hash degli artefatti. Le esecuzioni più recenti del flusso completo per lo stesso riferimento `release/*` e gruppo di riesecuzione sostituiscono automaticamente quelle in corso. Passa `reuse_evidence=false` per forzare una nuova esecuzione completa.

Per un ripristino circoscritto, passa `rerun_group` al flusso completo. `all` è l'esecuzione effettiva del candidato al rilascio, `ci` esegue solo il normale workflow figlio CI, `plugin-prerelease` esegue solo il workflow figlio dei Plugin specifico del rilascio, `release-checks` esegue tutte le fasi del rilascio e i gruppi di rilascio più specifici sono `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`. Le riesecuzioni mirate di `npm-telegram` richiedono `release_package_spec` o `npm_telegram_package_spec`; le esecuzioni complete o `all` usano l'E2E Telegram canonico del pacchetto all'interno di Package Acceptance. Le riesecuzioni mirate multipiattaforma possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o un altro filtro per sistema operativo o suite. Gli errori dei controlli QA del rilascio bloccano la normale convalida del rilascio, inclusa la deriva obbligatoria degli strumenti dinamici di OpenClaw nel livello standard. Le esecuzioni alpha di Tideclaw possono continuare a considerare consultive le corsie dei controlli di rilascio non correlate alla sicurezza del pacchetto. Con `release_profile=beta`, le suite con provider live di `Run repo/live E2E validation` sono consultive (generano avvisi, non blocchi); i profili stable e full continuano a considerarle bloccanti. Quando `live_suite_filter` richiede esplicitamente una corsia QA live soggetta a controllo, come Discord, WhatsApp o Slack, deve essere abilitata la variabile del repository `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` corrispondente; in caso contrario, l'acquisizione degli input non riesce invece di ignorare silenziosamente la corsia.

### Vitest

La fase Vitest è il workflow figlio manuale `CI`. La CI manuale ignora intenzionalmente la delimitazione basata sulle modifiche e forza il normale grafo dei test per il candidato al rilascio: shard Linux Node, shard dei Plugin inclusi, shard dei contratti dei Plugin e dei canali, compatibilità con Node 22, `check-*`, `check-additional-*`, controlli smoke degli artefatti compilati, controlli della documentazione, Skills Python, Windows, macOS e internazionalizzazione della Control UI. Android è incluso quando `Full Release Validation` esegue la fase, perché il flusso completo passa `include_android=true`; la CI manuale autonoma richiede `include_android=true` per includere Android.

Usa questa fase per rispondere alla domanda «l'albero dei sorgenti ha superato l'intera suite normale di test?». Non equivale alla convalida del prodotto nel percorso di rilascio. Evidenze da conservare:

- riepilogo di `Full Release Validation` che mostra l'URL dell'esecuzione `CI` avviata
- esecuzione `CI` riuscita sullo SHA di destinazione esatto
- nomi degli shard non riusciti o lenti nei job CI durante l'analisi delle regressioni
- artefatti delle tempistiche di Vitest, come `.artifacts/vitest-shard-timings.json`, quando un'esecuzione richiede un'analisi delle prestazioni

Esegui direttamente la CI manuale solo quando il rilascio richiede una CI normale deterministica, ma non le fasi Docker, QA Lab, live, multipiattaforma o dei pacchetti. Usa il primo comando per una CI diretta senza Android. Aggiungi `include_android=true` quando la CI diretta del candidato al rilascio deve includere Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La fase Docker si trova in `OpenClaw Release Checks` tramite `openclaw-live-and-e2e-checks-reusable.yml`, insieme al workflow `install-smoke` in modalità rilascio. Convalida il candidato al rilascio tramite ambienti Docker pacchettizzati anziché limitarsi ai test a livello di sorgente.

La copertura Docker del rilascio include:

- controllo smoke dell'installazione completa con il lento controllo smoke dell'installazione globale tramite Bun abilitato
- preparazione o riutilizzo dell'immagine smoke del Dockerfile radice in base allo SHA di destinazione, con job smoke per QR, radice/Gateway e programma di installazione/Bun eseguiti come shard `install-smoke` separati
- corsie E2E del repository
- blocchi Docker del percorso di rilascio: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, da `plugins-runtime-install-a` a `plugins-runtime-install-h` e `openwebui`
- copertura OpenWebUI su un runner dedicato con disco di grandi dimensioni, quando richiesta
- corsie suddivise di installazione/disinstallazione dei Plugin inclusi, da `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- suite con provider live/E2E e copertura dei modelli live Docker quando i controlli del rilascio includono suite live

Usa gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di rilascio carica `.artifacts/docker-tests/` con i registri delle corsie, `summary.json`, `failures.json`, le tempistiche delle fasi, il piano dello scheduler in formato JSON e i comandi di riesecuzione. Per un ripristino mirato, usa `docker_lanes=<lane[,lane]>` nel workflow live/E2E riutilizzabile invece di rieseguire tutti i blocchi del rilascio. I comandi di riesecuzione generati includono il precedente `package_artifact_run_id` e gli input delle immagini Docker preparate, quando disponibili, così una corsia non riuscita può riutilizzare lo stesso tarball e le stesse immagini GHCR.

### QA Lab

Anche la fase QA Lab fa parte di `OpenClaw Release Checks`. È il controllo del rilascio relativo al comportamento agentico e a livello di canale, distinto da Vitest e dai meccanismi dei pacchetti Docker.

La copertura QA Lab del rilascio include:

- corsia di parità simulata che confronta la corsia candidata OpenAI con la baseline `anthropic/claude-opus-4-8` usando il pacchetto di parità agentica
- profilo QA Matrix live rapido che usa l'ambiente `qa-live-shared`
- corsia QA Telegram live che usa lease di credenziali Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` quando la telemetria del rilascio richiede una verifica locale esplicita

Usa questa fase per rispondere alla domanda «il rilascio si comporta correttamente negli scenari QA e nei flussi dei canali live?». Conserva gli URL degli artefatti per le corsie di parità, Matrix e Telegram quando approvi il rilascio. La copertura completa di Matrix resta disponibile come esecuzione QA Lab manuale suddivisa in shard, anziché come corsia critica predefinita per il rilascio.

### Pacchetto

La fase Package è il controllo del prodotto installabile. È supportata da `Package Acceptance` e dal risolutore `scripts/resolve-openclaw-package-candidate.mjs`. Il risolutore normalizza un candidato nel tarball `package-under-test` usato da Docker E2E, convalida l'inventario del pacchetto, registra la versione del pacchetto e il relativo SHA-256 e mantiene separato il riferimento dell'infrastruttura del workflow dal riferimento sorgente del pacchetto.

Sorgenti dei candidati supportate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione di rilascio OpenClaw esatta
- `source=ref`: crea il pacchetto da un branch `package_ref`, un tag o uno SHA completo di commit attendibile usando l'infrastruttura `workflow_ref` selezionata
- `source=url`: scarica un `.tgz` HTTPS pubblico con il valore obbligatorio `package_sha256`; vengono rifiutati credenziali nell'URL, porte HTTPS non predefinite, nomi host o indirizzi risolti privati, interni o per usi speciali e reindirizzamenti non sicuri
- `source=trusted-url`: scarica un `.tgz` HTTPS con i valori obbligatori `package_sha256` e `trusted_source_id` da una policy denominata in `.github/package-trusted-sources.json`; usalo per mirror aziendali gestiti dai manutentori o repository privati di pacchetti, invece di aggiungere a `source=url` un'esclusione della rete privata a livello di input
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione di GitHub Actions

`OpenClaw Release Checks` esegue Package Acceptance con `source=artifact`, l'artefatto preparato del pacchetto di rilascio, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mantiene la migrazione, l'aggiornamento, l'aggiornamento di VPS gestiti dall'utente root, il riavvio dopo l'aggiornamento con autenticazione configurata, l'installazione live delle Skills da ClawHub, la pulizia delle dipendenze obsolete dei Plugin, le fixture dei Plugin offline, l'aggiornamento dei Plugin, l'irrobustimento contro l'escape dell'associazione dei comandi dei Plugin e la QA del pacchetto Telegram rispetto allo stesso tarball risolto. I controlli bloccanti del rilascio usano come baseline l'ultimo pacchetto pubblicato per impostazione predefinita; il profilo beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` estende la verifica `published-upgrade-survivor` a `last-stable-4` più le baseline bloccate `2026.4.23`, `2026.5.2` e `2026.4.15`, con scenari `reported-issues`. Usa Package Acceptance con `source=npm` per un candidato già pubblicato, `source=ref` per un tarball npm locale basato su SHA prima della pubblicazione, `source=trusted-url` per un mirror aziendale o privato gestito dai manutentori oppure `source=artifact` per un tarball preparato e caricato da un'altra esecuzione di GitHub Actions.

È il sostituto nativo di GitHub per gran parte della copertura dei pacchetti e degli aggiornamenti che in precedenza richiedeva Parallels. I controlli del rilascio multipiattaforma restano importanti per l'onboarding, il programma di installazione e il comportamento specifico delle piattaforme, ma la convalida del prodotto relativa ai pacchetti e agli aggiornamenti dovrebbe preferire Package Acceptance.

L'elenco di controllo canonico per la convalida degli aggiornamenti e dei Plugin è [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins). Usalo per decidere quale corsia locale, Docker, Package Acceptance o di controllo del rilascio dimostra correttamente una modifica relativa all'installazione o all'aggiornamento di un Plugin, alla pulizia tramite doctor o alla migrazione di un pacchetto pubblicato. La migrazione completa degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è un workflow manuale `Update Migration` separato e non fa parte della CI completa del rilascio.

La tolleranza precedente di Package Acceptance è intenzionalmente limitata nel tempo. I pacchetti fino alla versione `2026.4.25` possono usare il percorso di compatibilità per le lacune nei metadati già pubblicati su npm: voci dell'inventario QA privato mancanti nel tarball, assenza di `gateway install --wrapper`, file di patch mancanti nella fixture Git derivata dal tarball, assenza del valore persistente `update.channel`, posizioni precedenti dei record di installazione dei Plugin, assenza della persistenza dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Il pacchetto `2026.4.26` pubblicato può generare avvisi per i file dei timbri dei metadati della build locale già distribuiti. I pacchetti successivi devono soddisfare i contratti moderni dei pacchetti; le stesse lacune causano il fallimento della convalida del rilascio.

Usa profili Package Acceptance più ampi quando la domanda relativa al rilascio riguarda un pacchetto realmente installabile:

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

- `smoke`: percorsi rapidi per installazione del pacchetto/canale/agente, rete del Gateway e ricaricamento della configurazione
- `package`: contratti di installazione/aggiornamento/riavvio/pacchetto dei Plugin, più prova in ambiente reale dell'installazione di Skills da ClawHub; è l'impostazione predefinita per i controlli di rilascio
- `product`: `package` più canali MCP, pulizia di Cron/sottoagenti, ricerca web OpenAI e OpenWebUI
- `full`: blocchi del percorso di rilascio Docker con OpenWebUI
- `custom`: elenco `docker_lanes` esatto per riesecuzioni mirate

Per la prova Telegram del pacchetto candidato, abilita `telegram_mode=mock-openai` o `telegram_mode=live-frontier` in Package Acceptance. Il flusso di lavoro passa il tarball `package-under-test` risolto al percorso Telegram; il flusso di lavoro Telegram autonomo continua ad accettare una specifica npm pubblicata per i controlli successivi alla pubblicazione.

## Automazione ordinaria della pubblicazione di un rilascio

Per la pubblicazione beta, `latest`, dei Plugin, della GitHub Release e delle piattaforme,
`OpenClaw Release Publish` è il normale punto di ingresso con modifiche. Il percorso
extended-stable mensile `.33+`, riservato a npm, non usa questo orchestratore. Il
flusso di lavoro ordinario orchestra i flussi di lavoro con editore attendibile nell'ordine
richiesto dal rilascio:

1. Esegue il checkout del tag di rilascio e ne risolve lo SHA del commit.
2. Verifica che il tag sia raggiungibile da `main` o `release/*` (oppure da un ramo alpha di Tideclaw per i prerelease alpha).
3. Esegue `pnpm plugins:sync:check`.
4. Avvia `Plugin NPM Release` con `publish_scope=all-publishable` e `ref=<release-sha>`.
5. Avvia `Plugin ClawHub Release` con lo stesso ambito e lo stesso SHA.
6. Avvia `OpenClaw NPM Release` con il tag di rilascio, il dist-tag npm e il `preflight_run_id` salvato, dopo aver verificato il `full_release_validation_run_id` salvato e l'esatto tentativo di esecuzione.
7. Per i rilasci stabili, crea o aggiorna la GitHub Release come bozza, avvia `Windows Node Release` con il `windows_node_tag` esplicito e i `windows_node_installer_digests` approvati per il candidato, quindi verifica gli asset canonici del programma di installazione Windows e dei checksum. Avvia inoltre `Android Release` per generare l'APK firmato del tag esatto, insieme a checksum e provenienza. Verifica entrambi i contratti degli asset nativi prima di pubblicare la bozza.

Esempio di pubblicazione beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Pubblicazione stabile sul dist-tag beta predefinito:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

La promozione stabile direttamente a `latest` è esplicita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Usa i flussi di lavoro di livello inferiore `Plugin NPM Release` e `Plugin ClawHub Release` solo per interventi mirati di riparazione o ripubblicazione. `OpenClaw Release Publish` rifiuta `plugin_publish_scope=selected` quando `publish_openclaw_npm=true`, affinché il pacchetto principale non possa essere distribuito senza tutti i Plugin ufficiali pubblicabili, incluso `@openclaw/diffs-language-pack`. Per riparare un Plugin selezionato, imposta `publish_openclaw_npm=false` con `plugin_publish_scope=selected` e `plugins=@openclaw/name`, oppure avvia direttamente il flusso di lavoro figlio.

L'avvio iniziale della prima pubblicazione su ClawHub costituisce l'eccezione: avvia `Plugin ClawHub New`
da `main` attendibile e passa lo SHA completo del rilascio di destinazione tramite `ref`.
Non eseguire mai il flusso di lavoro di avvio stesso dal tag o dal ramo di rilascio:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

La convalida precedente al tag richiede `dry_run=true`, rifiuta gli input relativi al tag di rilascio
e all'esecuzione padre e accetta solo una destinazione esatta raggiungibile da `main` o `release/*`.
Non carica le credenziali ClawHub, non pubblica i byte dei pacchetti e non modifica la
configurazione dell'editore attendibile. Il flusso di lavoro risolve comunque il piano del registro
in ambiente reale, esegue il checkout e crea il pacchetto della destinazione esclusivamente in un processo privo di segreti, materializza la
toolchain ClawHub bloccata e convalida l'artefatto immutabile e lo slug/l'identità del pacchetto
prima che esista il tag di rilascio. Approva l'ambiente
`clawhub-plugin-bootstrap` solo dopo il completamento dei processi di creazione dei pacchetti privi di segreti;
questo processo di convalida protetto non dispone di credenziali né di comandi di modifica.

Un'esecuzione di prova approvata o un avvio reale successivo all'apposizione del tag deve includere il tag di
rilascio esatto, nonché l'ID, il tentativo e il ramo dell'esecuzione padre `OpenClaw Release Publish`.
Il padre attesta lo SHA del proprio flusso di lavoro e uno SHA esatto separato di `main` attendibile
per `Plugin ClawHub New`; l'esecuzione figlia e ogni approvazione dell'ambiente protetto
devono corrispondere allo SHA figlio approvato. Il tag di rilascio viene ricontrollato
prima di ogni tentativo di pubblicazione e modifica dell'editore attendibile.

Il processo di creazione del pacchetto
carica un artefatto immutabile il cui nome, ID/digest dell'artefatto Actions,
esecuzione/tentativo del produttore, SHA di destinazione e SHA-256/dimensione del tarball di ciascun pacchetto
vengono trasferiti ai processi di convalida e protetti. Il processo protetto esegue il checkout
esclusivamente degli strumenti attendibili di `main`, convalida la tupla dell'artefatto tramite l'API GitHub, scarica
in base all'ID esatto dell'artefatto, ricalcola l'hash di ogni tarball e convalida i percorsi TAR locali e
l'identità del pacchetto applicando le regole di canonicalizzazione USTAR della CLI bloccata. Ogni
candidato supera quindi la prova di pubblicazione della CLI bloccata, che termina prima
della consultazione del registro o dell'autenticazione. Il prefiltro del processo con credenziali limita i ClawPack compressi
a 120 MiB, il payload totale dei file a 50 MiB, i dati TAR espansi a 64 MiB e
il numero di voci TAR a 10.000. La riparazione dell'editore attendibile per pacchetti esistenti resta
limitata alla configurazione, ma crea comunque il pacchetto della destinazione e richiede che il tag richiesto
e gli esatti byte e metadati del registro coincidano prima di modificare la configurazione
dell'editore attendibile. La verifica successiva alla pubblicazione scarica l'artefatto ClawHub e
richiede gli stessi SHA-256 e dimensione. Un recupero tramite riesecuzione dei soli processi non riusciti può riutilizzare l'artefatto
del pacchetto di un tentativo precedente solo se l'esatto processo produttore è stato completato
correttamente. Le prove finali vincolano inoltre la versione ClawHub bloccata, lo
SHA-256 del file di blocco e l'integrità npm. Una mancata corrispondenza richiede una nuova versione del pacchetto.

## Input del flusso di lavoro NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio, ad esempio `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; quando `preflight_only=true`, può anche essere lo SHA completo di 40 caratteri del commit corrente del ramo del flusso di lavoro, per una verifica preliminare di sola convalida
- `preflight_only`: `true` per la sola convalida/compilazione/creazione del pacchetto, `false` per il percorso di pubblicazione reale
- `preflight_run_id`: ID di un'esecuzione preliminare esistente completata correttamente, obbligatorio nel percorso di pubblicazione reale affinché il flusso di lavoro riutilizzi il tarball preparato invece di ricrearlo
- `full_release_validation_run_id`: ID di un'esecuzione `Full Release Validation` completata correttamente per questo tag/SHA, obbligatorio per la pubblicazione reale. Le pubblicazioni beta possono procedere con la sola verifica preliminare, mostrando un avviso, ma la promozione stabile/a `latest` lo richiede comunque.
- `full_release_validation_run_attempt`: esatto tentativo di esecuzione positivo associato a `full_release_validation_run_id`; obbligatorio ogni volta che viene fornito l'ID dell'esecuzione, affinché le riesecuzioni non possano modificare le prove di autorizzazione durante la pubblicazione.
- `release_publish_run_id`: ID dell'esecuzione approvata di `OpenClaw Release Publish`; obbligatorio quando questo flusso di lavoro viene avviato da tale padre (chiamate di pubblicazione reale eseguite da bot)
- `plugin_npm_run_id`: ID di un'esecuzione `Plugin NPM Release` completata correttamente sulla revisione esatta; obbligatorio per una pubblicazione reale del pacchetto principale `extended-stable`
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; accetta `alpha`, `beta`, `latest` o `extended-stable` e il valore predefinito è `beta`. La patch finale `33` e quelle successive devono usare `extended-stable`; per impostazione predefinita, `extended-stable` rifiuta le patch precedenti e rifiuta sempre i tag non finali.
- `bypass_extended_stable_guard`: valore booleano riservato ai test, predefinito su `false`; con `npm_dist_tag=extended-stable`, ignora l'idoneità mensile per extended-stable, mantenendo i controlli su identità del rilascio, artefatto, approvazione e rilettura.

`Plugin NPM Release` accetta `npm_dist_tag=default` per il comportamento di rilascio
esistente oppure `npm_dist_tag=extended-stable` per il percorso mensile protetto. L'opzione
extended-stable richiede `publish_scope=all-publishable`, un input `plugins`
vuoto, una patch finale pari o superiore a `33` e il ramo canonico
`extended-stable/YYYY.M.33` posizionato esattamente sulla sua punta. Non sposta mai i tag
`latest` o `beta` dei Plugin. Le nuove versioni dei pacchetti ricevono `extended-stable` atomicamente
tramite pubblicazione OIDC attendibile (`npm publish --tag extended-stable`); questo
flusso di lavoro sorgente non usa `npm dist-tag add` autenticato tramite token. I nuovi tentativi
ignorano le versioni esatte già presenti in npm, quindi si interrompono in modo sicuro a meno che una
rilettura completa non confermi la convergenza di ogni pacchetto esatto e del tag `extended-stable`.

`OpenClaw Release Publish` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio; deve essere già esistente
- `preflight_run_id`: ID di un'esecuzione preliminare `OpenClaw NPM Release` completata correttamente; obbligatorio quando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: ID di un'esecuzione `Full Release Validation` completata correttamente; obbligatorio quando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: esatto tentativo positivo associato a `full_release_validation_run_id`; obbligatorio ogni volta che viene fornito l'ID dell'esecuzione
- `windows_node_tag`: tag di rilascio esatto e non prerelease di `openclaw/openclaw-windows-node`; obbligatorio per la pubblicazione stabile di OpenClaw
- `windows_node_installer_digests`: mappa JSON compatta, approvata per il candidato, dei nomi correnti dei programmi di installazione Windows e dei rispettivi digest `sha256:` bloccati; obbligatoria per la pubblicazione stabile di OpenClaw
- `npm_telegram_run_id`: ID facoltativo di un'esecuzione `NPM Telegram Beta E2E` completata correttamente da includere nelle prove finali del rilascio
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw, uno tra `alpha`, `beta` o `latest`
- `plugin_publish_scope`: valore predefinito `all-publishable`; usa `selected` solo per interventi mirati di riparazione limitati ai Plugin con `publish_openclaw_npm=false`
- `plugins`: nomi di pacchetti `@openclaw/*` separati da virgole quando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: valore predefinito `true`; impostalo su `false` solo quando usi il flusso di lavoro come orchestratore di riparazioni limitate ai Plugin
- `release_profile`: profilo di copertura del rilascio usato per i riepiloghi delle prove del rilascio; il valore predefinito è `from-validation`, che lo legge dal manifesto di convalida, oppure può essere sostituito con `beta`, `stable` o `full`
- `wait_for_clawhub`: valore predefinito `false`, affinché la disponibilità npm non sia bloccata dal processo parallelo ClawHub; impostalo su `true` solo quando il completamento del flusso di lavoro deve includere il completamento di ClawHub

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: ramo, tag o SHA completo del commit da convalidare. I controlli che utilizzano segreti richiedono che il commit risolto sia raggiungibile da un ramo OpenClaw o da un tag di rilascio.
- `run_release_soak`: abilita facoltativamente i test prolungati ed esaustivi in ambiente reale/E2E, del percorso di rilascio Docker e di sopravvivenza agli aggiornamenti da tutte le versioni precedenti per i controlli dei rilasci beta. Viene abilitato obbligatoriamente da `release_profile=stable` e `release_profile=full`.

Regole:

- Le versioni finali e di correzione regolari con patch inferiore a `33` possono essere pubblicate su `beta` o `latest`. Le versioni finali con patch `33` o superiore devono essere pubblicate su `extended-stable`, mentre le versioni con suffisso di correzione a tale soglia vengono rifiutate.
- I tag di prerelease beta possono essere pubblicati solo su `beta`; i tag di prerelease alpha possono essere pubblicati solo su `alpha`
- Per `OpenClaw NPM Release`, l'immissione dello SHA completo del commit è consentita solo quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre esclusivamente di convalida
- Il percorso di pubblicazione effettivo deve usare lo stesso `npm_dist_tag` utilizzato durante la verifica preliminare; il flusso di lavoro verifica questi metadati prima di proseguire con la pubblicazione

## Sequenza regolare di rilascio stabile beta/latest

Questa sequenza precedente è destinata al normale rilascio orchestrato, che gestisce anche i plugin, la release GitHub, Windows e le attività per le altre piattaforme. Non è il percorso mensile `.33+` extended-stable riservato a npm, documentato all'inizio di questa pagina.

Quando si prepara un normale rilascio stabile orchestrato:

1. Eseguire `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag, è possibile usare lo SHA completo del commit corrente del ramo del flusso di lavoro per un'esecuzione di prova, esclusivamente di convalida, del flusso di lavoro di verifica preliminare.
2. Scegliere `npm_dist_tag=beta` per il normale flusso che parte da beta, oppure `latest` solo quando si desidera intenzionalmente una pubblicazione stabile diretta.
3. Eseguire `Full Release Validation` sul ramo di rilascio, sul tag di rilascio o sullo SHA completo del commit quando si desiderano, da un unico flusso di lavoro manuale, la CI normale e la copertura in tempo reale di cache dei prompt, Docker, QA Lab, Matrix e Telegram. Se serve intenzionalmente solo il grafo deterministico dei test normali, eseguire invece il flusso di lavoro manuale `CI` sul riferimento di rilascio.
4. Selezionare l'esatto tag di rilascio non prerelease di `openclaw/openclaw-windows-node` i cui programmi di installazione firmati x64 e ARM64 devono essere distribuiti. Salvarlo come `windows_node_tag` e salvare la relativa mappa convalidata dei digest come `windows_node_installer_digests`. L'helper della release candidate registra entrambi e li include nel comando di pubblicazione generato.
5. Salvare i valori `preflight_run_id`, `full_release_validation_run_id` e l'esatto `full_release_validation_run_attempt` dell'esecuzione riuscita.
6. Eseguire `OpenClaw Release Publish` da un `main` attendibile con lo stesso `tag`, lo stesso `npm_dist_tag`, il `windows_node_tag` selezionato, il relativo `windows_node_installer_digests` salvato, nonché i valori salvati `preflight_run_id`, `full_release_validation_run_id` e `full_release_validation_run_attempt`. Il flusso pubblica i plugin esternalizzati su npm e ClawHub prima di promuovere il pacchetto npm di OpenClaw.
7. Se il rilascio è stato pubblicato su `beta`, usare il flusso di lavoro `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` per promuovere tale versione stabile da `beta` a `latest`.
8. Se il rilascio è stato pubblicato intenzionalmente direttamente su `latest` e `beta` deve puntare immediatamente alla stessa build stabile, usare lo stesso flusso di lavoro di rilascio per indirizzare entrambi i dist-tag alla versione stabile, oppure lasciare che la sincronizzazione automatica pianificata sposti `beta` in un secondo momento.

La modifica dei dist-tag risiede nel repository del registro dei rilasci perché richiede ancora `NPM_TOKEN`, mentre il repository del codice sorgente mantiene la pubblicazione basata esclusivamente su OIDC. In questo modo, sia il percorso di pubblicazione diretta sia quello di promozione che parte da beta restano documentati e visibili agli operatori.

Se un manutentore deve ricorrere all'autenticazione npm locale, deve eseguire tutti i comandi della CLI di 1Password (`op`) esclusivamente all'interno di una sessione tmux dedicata. Non chiamare `op` direttamente dalla shell principale dell'agente; mantenerlo all'interno di tmux rende osservabili prompt, avvisi e gestione degli OTP e impedisce la ripetizione degli avvisi dell'host.

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

I manutentori usano la documentazione privata sui rilasci in [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) come procedura operativa effettiva.

## Contenuti correlati

- [Canali di rilascio](/it/install/development-channels)
