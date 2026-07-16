---
read_when:
    - Ricerca delle definizioni dei canali di rilascio pubblici
    - Esecuzione della convalida della release o dell'accettazione del pacchetto
    - Alla ricerca della denominazione delle versioni e della cadenza
summary: Canali di rilascio, lista di controllo per gli operatori, riquadri di convalida, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-07-16T15:00:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw espone attualmente tre canali di aggiornamento rivolti agli utenti:

- stable: il canale di rilascio promosso esistente, che continua a essere risolto tramite npm `latest` fino al completamento della milestone separata relativa a CLI/canale
- beta: tag di prerelease pubblicati su npm `beta`
- dev: la punta mobile di `main`

Separatamente, gli operatori di rilascio possono pubblicare il pacchetto core
dell'ultimo mese completato su npm `extended-stable`, a partire dalla patch `33`. La linea
finale regolare del mese corrente continua su npm `latest`; questa separazione
della pubblicazione lato operatore non modifica di per sé la risoluzione dei canali di aggiornamento della CLI.

Le build alpha di Tideclaw costituiscono un percorso interno di prerelease separato (dist-tag npm `alpha`), descritto in [Input del workflow NPM](#npm-workflow-inputs) e [Test box di rilascio](#release-test-boxes).

## Denominazione delle versioni

- Versione mensile del rilascio extended-stable npm: `YYYY.M.PATCH`, con `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Versione del rilascio finale giornaliero/regolare: `YYYY.M.PATCH`, con `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Versione del rilascio regolare correttivo di riserva: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Versione di prerelease beta: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Versione di prerelease alpha: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Non aggiungere mai zeri iniziali al mese o alla patch
- `PATCH` è un numero sequenziale del ciclo di rilascio mensile, non un giorno di calendario. I rilasci finali regolari e beta fanno avanzare il ciclo corrente; i tag esclusivamente alpha non utilizzano né fanno avanzare il numero di patch beta/regolare, quindi, quando si seleziona un ciclo beta o regolare, vanno ignorati i tag legacy esclusivamente alpha con numeri di patch superiori.
- Le build alpha/notturne utilizzano il successivo ciclo di patch non ancora rilasciato e, per le build ripetute, incrementano soltanto `alpha.N`. Quando tale patch dispone di una beta, le nuove build alpha passano alla patch successiva.
- Le versioni npm sono immutabili: non eliminare, ripubblicare o riutilizzare mai un tag pubblicato. Creare invece il numero di prerelease successivo o la patch mensile successiva.
- `latest` continua a seguire la linea npm regolare/giornaliera corrente; `beta` è la destinazione di installazione beta corrente
- `extended-stable` indica il pacchetto npm supportato del mese precedente, a partire dalla patch `33`; la patch `34` e quelle successive sono rilasci di manutenzione di tale linea mensile
- I rilasci finali regolari e quelli correttivi regolari vengono pubblicati per impostazione predefinita su npm `beta`; gli operatori di rilascio possono specificare esplicitamente `latest` oppure promuovere successivamente una build beta verificata
- Il percorso mensile dedicato extended-stable pubblica il pacchetto core npm e ogni Plugin ufficiale pubblicabile su npm esattamente con la stessa versione. Non pubblica Plugin su ClawHub, né artefatti macOS o Windows, una GitHub Release, dist-tag di repository privati, immagini Docker, artefatti mobili o download dal sito web.
- Ogni rilascio finale regolare distribuisce insieme il pacchetto npm, l'app macOS, l'APK Android autonomo firmato e i programmi di installazione firmati di Windows Hub. I rilasci beta normalmente convalidano e pubblicano prima il percorso npm/pacchetto, mentre la compilazione, firma, notarizzazione e promozione delle app native sono riservate al rilascio finale regolare, salvo richiesta esplicita.

## Cadenza dei rilasci

- I rilasci procedono prima dalla beta; stable segue soltanto dopo la convalida della beta più recente
- I manutentori normalmente creano i rilasci da un branch `release/YYYY.M.PATCH` derivato dall'attuale `main`, in modo che la convalida e le correzioni del rilascio non blocchino il nuovo sviluppo su `main`
- Se un tag beta è stato inviato o pubblicato e richiede una correzione, i manutentori creano il tag `-beta.N` successivo anziché eliminare o ricreare quello precedente
- La procedura di rilascio dettagliata, le approvazioni, le credenziali e le note sul ripristino sono riservate ai manutentori

## Pubblicazione mensile extended-stable solo su npm

Questa è un'eccezione dedicata alla procedura di rilascio regolare descritta di seguito. Per un
mese completato `YYYY.M`, creare `extended-stable/YYYY.M.33`; pubblicare
`vYYYY.M.33` e le patch di manutenzione successive dallo stesso branch. Il tag di
rilascio, la punta del branch, il checkout, la versione del pacchetto, il controllo preliminare npm e l'esecuzione della Full Release
Validation devono identificare tutti lo stesso commit. Il branch protetto `main` deve
già contenere la versione finale di un mese di calendario strettamente successivo con patch
inferiore a `33`; le patch di manutenzione restano idonee dopo che `main` è avanzato di oltre un
mese.

Nel branch extended-stable esatto, incrementare il pacchetto radice a `YYYY.M.P`, eseguire
`pnpm release:prep` e verificare che ogni pacchetto di estensione pubblicabile abbia la
stessa versione. Eseguire il commit e il push di tutte le modifiche generate, creare e inviare il
tag immutabile `vYYYY.M.P` in corrispondenza di tale commit e registrare lo SHA completo risultante.
I workflow utilizzano questo albero preparato; non incrementano né sincronizzano
automaticamente le versioni.

Eseguire il controllo preliminare npm e la Full Release Validation esattamente dalla punta del branch
preparato, quindi salvare entrambi gli ID di esecuzione e il tentativo riuscito dell'esecuzione di Full Release Validation:

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

`release_profile=stable` è il profilo esistente relativo alla profondità di convalida; è
separato dal dist-tag npm `extended-stable` e rimane intenzionalmente
invariato.

Dopo il completamento corretto di entrambe le esecuzioni, pubblicare ogni Plugin ufficiale pubblicabile su npm dalla
stessa identica punta del branch. La patch `P` deve essere `33` o superiore. Passare lo SHA completo del rilascio
come `ref`, attendere il completamento dell'intera matrice e della rilettura del registro, quindi salvare l'ID
dell'esecuzione riuscita di Plugin NPM Release:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Il workflow utilizza il normale inventario preparato dei pacchetti `all-publishable`,
inclusi i pacchetti il cui sorgente non è cambiato. Prima di completarsi correttamente, verifica ogni pacchetto esatto
e ogni tag `extended-stable` dei Plugin. Se un'esecuzione parziale
non riesce, eseguire nuovamente lo stesso comando: i pacchetti già pubblicati vengono riutilizzati, i tag dei Plugin
mancanti o obsoleti vengono riconciliati nell'ambiente di rilascio npm e la
rilettura finale copre comunque l'intero insieme dei pacchetti.

Dopo il completamento corretto del workflow dei Plugin e quando l'ambiente di rilascio npm è pronto,
pubblicare il tarball core esatto del controllo preliminare. La pubblicazione del core verifica che
l'esecuzione dei Plugin indicata sia `completed/success` sullo stesso branch canonico e
sullo stesso identico SHA del sorgente:

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

Per una simulazione su fork o non di produzione che intenzionalmente non possa soddisfare la
politica mensile di `.33` o del mese del branch protetto `main`, aggiungere
`-f bypass_extended_stable_guard=true` sia ai dispatch del controllo preliminare npm sia a quelli di
pubblicazione. Il valore predefinito è `false`. L'aggiramento viene accettato soltanto con
`npm_dist_tag=extended-stable` e viene registrato nel riepilogo del workflow. Non
aggira il riferimento canonico del workflow `extended-stable/YYYY.M.33`,
l'uguaglianza tra punta del branch, tag e checkout, la sintassi del tag finale, l'uguaglianza
tra versione del pacchetto e del tag, l'identità delle esecuzioni e del manifesto indicati, la provenienza del tarball,
l'approvazione dell'ambiente, la rilettura del registro o le prove di riparazione del selettore.

Il workflow di pubblicazione verifica le identità delle esecuzioni indicate per il controllo preliminare, la convalida e i Plugin,
il digest del tarball preparato e i selettori del registro core.
Dopo il completamento corretto del workflow, confermare il risultato in modo indipendente:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Entrambi i comandi devono restituire `YYYY.M.P`. Se la pubblicazione riesce ma la rilettura del selettore
non riesce, non ripubblicare la versione immutabile del pacchetto. Utilizzare l'unico
comando di riparazione `npm dist-tag add openclaw@YYYY.M.P extended-stable`
stampato nel riepilogo eseguito sempre del workflow non riuscito, quindi ripetere entrambe le
riletture indipendenti. Il ripristino del selettore precedente è una decisione separata
dell'operatore, non il percorso di riparazione della rilettura.

La documentazione pubblica di supporto indica inizialmente Slack, Discord e Codex come
superfici Plugin coperte da extended-stable. Tale elenco è una dichiarazione di supporto, non
un elenco consentito nel codice di rilascio: ogni Plugin ufficiale pubblicabile su npm segue lo
stesso identico percorso di pubblicazione della versione.

La checklist regolare seguente continua a gestire beta, `latest`, GitHub Release,
Plugin, macOS, Windows e la pubblicazione su altre piattaforme. Non eseguire tali
passaggi per questo percorso extended-stable solo su npm.

## Checklist regolare per gli operatori di rilascio

Questa checklist rappresenta la forma pubblica del flusso di rilascio. Le credenziali private, la firma, la notarizzazione, il ripristino dei dist-tag e i dettagli sul rollback di emergenza rimangono nel manuale di rilascio riservato ai manutentori.

1. Partire dall'attuale `main`: recuperare gli ultimi aggiornamenti, confermare che il commit di destinazione sia stato inviato e che la CI di `main` sia sufficientemente verde per creare il branch.
2. Creare `release/YYYY.M.PATCH` da tale commit. I backport sono facoltativi; applicare soltanto l'insieme selezionato dall'operatore. Incrementare tutte le versioni richieste, eseguire `pnpm release:prep`, completare le correzioni del rilascio e i forward-port richiesti, quindi esaminare `src/plugins/compat/registry.ts` e `src/commands/doctor/shared/deprecation-compat.ts`.
3. Fissare il commit completo del prodotto precedente al changelog come **SHA del codice**. Eseguire il controllo preliminare deterministico del sorgente, quindi utilizzare `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. In questo modo gli strumenti attendibili del workflow vengono fissati, mentre l'intera matrice Vitest, Docker, QA, pacchetti e prestazioni utilizza come destinazione lo SHA del codice esatto.
4. Classificare gli errori prima di apportare modifiche. Un errore del prodotto/codice genera un nuovo SHA del codice e richiede una convalida completa riuscita per tale SHA. Un errore del workflow, dell'harness, delle credenziali, dell'approvazione o dell'infrastruttura viene corretto nella superficie che ne è responsabile e rieseguito sullo stesso SHA del codice.
5. Soltanto dopo che lo SHA del codice è verde, generare la sezione iniziale di `CHANGELOG.md` dalle PR unite e dai commit diretti successivi all'ultimo tag distribuito raggiungibile. Mantenere le voci rivolte agli utenti e prive di duplicati. Quando un tag distribuito divergente o un forward-port successivo riassocia PR già rilasciate, passarlo esplicitamente come `--shipped-ref`.
6. Eseguire il commit del solo `CHANGELOG.md`. Questo commit è lo **SHA del rilascio**. Il diff completo dallo SHA del codice allo SHA del rilascio deve essere esattamente `CHANGELOG.md`; qualsiasi altro percorso modificato riporta il rilascio al passaggio 2.
7. Eseguire la Full Release Validation vincolata allo SHA per lo SHA del rilascio, con il riutilizzo delle prove abilitato. Il processo padre leggero deve registrare `changelog-only-release-v1`, puntare allo SHA del codice verde e non avviare alcuna corsia figlia del prodotto. Ciò riutilizza le prove del prodotto, non i byte del pacchetto.
8. Eseguire `OpenClaw NPM Release` con `preflight_only=true` sullo SHA/tag del rilascio. Salvare il valore `preflight_run_id` riuscito. Questa operazione compila e verifica i byte esatti del pacchetto che includono il changelog finale.
9. Applicare il tag allo SHA del rilascio, quindi eseguire l'helper del candidato con il processo padre riuscito della convalida dello SHA del rilascio e il controllo preliminare npm, anziché avviarli nuovamente:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Per la versione stabile, passare anche `--windows-node-tag vX.Y.Z`. L'helper verifica la provenienza delle note di rilascio, i byte del preflight npm, la prova di installazione/aggiornamento di Parallels, la prova del pacchetto Telegram e i piani di pubblicazione dei plugin, quindi stampa il comando di pubblicazione.

   `OpenClaw Release Publish` distribuisce i pacchetti plugin selezionati o tutti quelli pubblicabili su npm e lo stesso insieme su ClawHub in parallelo, quindi promuove l'artefatto di preflight npm di OpenClaw preparato con il dist-tag corrispondente una volta completata con successo la pubblicazione npm dei plugin. Il checkout della release rimane la radice del prodotto e dei dati, mentre la pianificazione e la verifica finale vengono eseguite dal checkout esatto e attendibile del sorgente del workflow, affinché un commit di release precedente non possa utilizzare silenziosamente strumenti di rilascio obsoleti. Prima dell'avvio di qualsiasi processo figlio di pubblicazione, esegue il rendering e memorizza nella cache il corpo esatto della release GitHub. Quando la sezione `CHANGELOG.md` completa e corrispondente rientra nel limite di 125.000 caratteri di GitHub e nella soglia di sicurezza corrispondente di 125.000 byte del renderer, la pagina contiene esattamente tale sezione `## YYYY.M.PATCH`, inclusa la relativa intestazione. Quando la sezione sorgente non rientra nei limiti, la pagina mantiene le note editoriali raggruppate esattamente e sostituisce il record dei contributi sovradimensionato con un collegamento stabile al record completo nel file `CHANGELOG.md` fissato al tag; non vengono mai pubblicati record parziali o punti elenco troncati. Il workflow sceglie il corpo completo o compatto prima di aggiungere `### Release verification`; se la coda delle prove superasse il limite, mantiene il corpo canonico e si affida invece alle prove immutabili allegate. Le release stabili pubblicate su npm `latest` diventano la release più recente di GitHub, mentre le release di manutenzione stabili mantenute su npm `beta` vengono create con GitHub `latest=false`. Il workflow carica inoltre nella release GitHub le prove delle dipendenze di preflight, il manifesto della convalida completa e le prove di verifica del registro successive alla pubblicazione, per la gestione degli incidenti post-release. Stampa immediatamente gli ID delle esecuzioni figlie, approva automaticamente i gate dell'ambiente di rilascio che il token del workflow è autorizzato ad approvare, riepiloga i processi figli non riusciti con le parti finali dei log, crea anticipatamente la pagina di bozza della release GitHub e promuove gli artefatti Windows e Android in concomitanza con la pubblicazione npm di OpenClaw, completa la pagina della release e le prove delle dipendenze dopo il successo di tali fasi, attende ClawHub ogni volta che viene pubblicato OpenClaw su npm, quindi esegue il verificatore beta dell'attendibile branch main e carica le prove successive alla pubblicazione per la release GitHub, il pacchetto npm, i pacchetti npm dei plugin selezionati, i pacchetti ClawHub selezionati, gli ID delle esecuzioni dei workflow figli e l'ID facoltativo dell'esecuzione npm di Telegram. Il verificatore di bootstrap di ClawHub richiede il percorso e lo SHA esatti del workflow dell'attendibile branch main, i tentativi di esecuzione del produttore e terminale, lo SHA della release, l'insieme di pacchetti richiesto, la tupla immutabile dell'artefatto del pacchetto e l'artefatto terminale di rilettura dal registro; un'esecuzione legacy completata con successo dal riferimento della release non viene accettata.

   Eseguire quindi l'accettazione del pacchetto successiva alla pubblicazione sul pacchetto `openclaw@YYYY.M.PATCH-beta.N` o `openclaw@beta` pubblicato. Se una prerelease inviata o pubblicata richiede una correzione, creare il numero di prerelease successivo corrispondente; non eliminare né riscrivere mai quello precedente.

10. In caso di tentativo di pubblicazione non riuscito, mantenere invariato lo SHA della release, a meno che l'errore non dimostri un difetto del prodotto o del changelog. Riprendere i processi figli e gli artefatti immutabili completati con successo; non ricreare né ripubblicare mai una versione del pacchetto già completata con successo.
11. Per la versione stabile, continuare solo dopo che la beta o la release candidate verificata dispone delle prove di convalida richieste. Anche la pubblicazione npm stabile passa attraverso `OpenClaw Release Publish`, riutilizzando l'artefatto di preflight completato con successo tramite `preflight_run_id`. La preparazione della release stabile per macOS richiede inoltre i file `.zip`, `.dmg`, `.dSYM.zip` inclusi nel pacchetto e il file `appcast.xml` aggiornato su `main`; il workflow di pubblicazione macOS pubblica automaticamente l'appcast firmato nel file pubblico `main` dopo la verifica degli artefatti della release, oppure apre o aggiorna una PR dell'appcast se la protezione del branch impedisce il push diretto. La preparazione stabile di Windows Hub richiede gli artefatti firmati `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` e `OpenClawCompanion-SHA256SUMS.txt` nella release GitHub di OpenClaw. Passare il tag di release `openclaw/openclaw-windows-node` firmato esatto come `windows_node_tag` e la relativa mappa dei digest degli installer approvata per la candidate come `windows_node_installer_digests`; `OpenClaw Release Publish` conserva la bozza della release, distribuisce `Windows Node Release` e verifica tutti e tre gli artefatti prima della pubblicazione.
12. Dopo la pubblicazione, eseguire il verificatore npm successivo alla pubblicazione, l'E2E Telegram autonomo e facoltativo sul pacchetto npm pubblicato quando è necessaria una prova del canale successiva alla pubblicazione, la promozione del dist-tag quando necessario, verificare la pagina della release GitHub generata, eseguire i passaggi di annuncio della release, quindi completare la [chiusura stabile di main](#stable-main-closeout) prima di considerare terminata una release stabile.

## Chiusura stabile di main

La pubblicazione stabile non è completa finché `main` non contiene lo stato effettivo della release distribuita.

1. Partire dalla versione più recente di `main`. Verificare `release/YYYY.M.PATCH` rispetto a essa e trasferire in avanti le correzioni effettive assenti da `main`. Non integrare indiscriminatamente in una versione più recente di `main` gli adattatori di compatibilità, test o convalida specifici della sola release.
2. Per il percorso normale, impostare `main` sulla versione stabile distribuita. Una chiusura tardiva può utilizzare `main` dopo l'avanzamento a una versione CalVer stabile successiva di OpenClaw; non eseguire il downgrade di un ciclo di rilascio già avviato al solo scopo di chiudere la release precedente. Il validatore richiede comunque la sezione esatta del changelog distribuito e la voce dell'appcast e registra la versione e lo SHA effettivi di `main`. Eseguire `pnpm release:prep` dopo qualsiasi modifica della versione radice, quindi `pnpm deps:shrinkwrap:generate`.
3. Rendere la sezione `## YYYY.M.PATCH` di `CHANGELOG.md` su `main` esattamente corrispondente al branch della release con tag. Includere l'aggiornamento stabile di `appcast.xml` quando la release per Mac ne ha pubblicato uno.
4. Non aggiungere `YYYY.M.PATCH+1`, una versione beta o una sezione futura vuota del changelog a `main` finché l'operatore non avvia esplicitamente tale ciclo di rilascio.
5. Eseguire `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` e `OPENCLAW_TESTBOX=1 pnpm check:changed`. Eseguire il push, quindi verificare che `origin/main` contenga la versione distribuita e il changelog prima di considerare completata la release stabile.
6. Mantenere aggiornate le variabili del repository `RELEASE_ROLLBACK_DRILL_ID` e `RELEASE_ROLLBACK_DRILL_DATE` dopo ogni esercitazione privata di rollback.

`OpenClaw Stable Main Closeout` parte dal push di `main` che contiene la versione distribuita, il changelog e l'appcast dopo la pubblicazione stabile. Legge le prove immutabili successive alla pubblicazione per associare il tag distribuito alle relative esecuzioni di convalida completa della release e di pubblicazione, quindi verifica lo stato stabile di main, la release, il periodo di osservazione stabile obbligatorio e le prove bloccanti relative alle prestazioni. Allega alla release GitHub un manifesto di chiusura immutabile e il relativo checksum. L'attivazione automatica tramite push ignora le release legacy precedenti alle prove immutabili successive alla pubblicazione e non considera mai tale esclusione una chiusura completata.

Una chiusura completa richiede entrambi gli artefatti e un checksum corrispondente. Un manifesto parziale riesegue lo SHA `main` e l'esercitazione di rollback registrati per rigenerare byte identici, quindi allega il checksum mancante; una coppia non valida, o un checksum senza manifesto, rimane bloccante. Un'esecuzione attivata tramite push senza le variabili del repository per l'esercitazione di rollback viene ignorata senza completare la chiusura; un record dell'esercitazione mancante o risalente a più di 90 giorni continua a bloccare la chiusura manuale basata sulle prove. I comandi privati di ripristino rimangono nel runbook riservato ai manutentori. Utilizzare la distribuzione manuale solo per correggere o rieseguire una chiusura stabile basata sulle prove.

Se il processo padre di pubblicazione della release non è riuscito solo dopo l'allegazione delle prove immutabili npm/plugin, correggere e pubblicare prima tutti gli artefatti della piattaforma stabile. Un manutentore può quindi distribuire manualmente la chiusura con `allow_failed_publish_recovery=true`; tale modalità accetta esclusivamente un processo padre completato ma non riuscito e richiede inoltre i contratti esatti degli artefatti Android e Windows, i digest SHA-256 di GitHub, la verifica dei checksum, la provenienza Android e una promozione Windows completata con successo e distribuita dal processo padre, i cui controlli Authenticode e digest approvati per la candidate corrispondano agli installer pubblicati, insieme ai normali controlli macOS/appcast. La chiusura automatica tramite push non abilita mai questa modalità di ripristino.

Un tag legacy di correzione di fallback può riutilizzare le prove del pacchetto di base solo quando il tag di correzione si risolve nello stesso commit sorgente del tag stabile di base. La relativa release Android riutilizza l'APK verificato del tag di base e aggiunge la provenienza per il tag di correzione. Una correzione con un sorgente diverso deve pubblicare e verificare le proprie prove del pacchetto e utilizzare un valore Android `versionCode` superiore.

## Preflight della release

- Eseguire `pnpm check:test-types` prima del preflight della release, affinché TypeScript di test rimanga coperto al di fuori del gate locale più rapido `pnpm check`.
- Eseguire `pnpm check:architecture` prima del preflight della release, affinché i controlli più ampi sui cicli di importazione e sui confini architetturali risultino superati al di fuori del gate locale più rapido.
- Eseguire `pnpm build && pnpm ui:build` prima di `pnpm release:check`, affinché gli artefatti di release `dist/*` previsti e il bundle della Control UI esistano per il passaggio di convalida del pacchetto.
- Eseguire `pnpm release:prep` dopo l'incremento della versione radice e prima dell'applicazione del tag. Esegue tutti i generatori deterministici della release che tendono a divergere dopo una modifica di versione, configurazione o API: versioni dei plugin, shrinkwrap npm, inventario dei plugin, schema della configurazione di base, metadati della configurazione dei canali inclusi, baseline della documentazione di configurazione, esportazioni dell'SDK dei plugin e baseline dell'API dell'SDK dei plugin. `pnpm release:check` riesegue tali controlli in modalità di verifica, insieme a un controllo del budget della superficie dell'SDK dei plugin, e segnala in un unico passaggio ogni errore di divergenza generata prima di eseguire i controlli della release del pacchetto.
- Per impostazione predefinita, la sincronizzazione delle versioni dei plugin aggiorna alla versione della release di OpenClaw il pacchetto runtime pubblicabile `@openclaw/ai`, le versioni dei pacchetti dei plugin ufficiali e i limiti minimi `openclaw.compat.pluginApi` esistenti. Considerare tale campo come la versione minima dell'API dell'SDK/runtime dei plugin, non come una semplice copia della versione del pacchetto: per le release dei soli plugin intenzionalmente compatibili con host OpenClaw precedenti, mantenere il limite minimo sull'API host supportata meno recente e documentare tale scelta nelle prove della release del plugin.
- Eseguire il workflow manuale `Full Release Validation` prima dell'approvazione della release per avviare tutte le piattaforme di test di prerelease da un unico punto di ingresso. Accetta un branch, un tag o uno SHA completo del commit, distribuisce manualmente `CI` e distribuisce `OpenClaw Release Checks` per le corsie relative a test di installazione, accettazione del pacchetto, controlli multipiattaforma del pacchetto, parità di QA Lab, Matrix e Telegram. Le esecuzioni stabili e complete includono sempre un periodo esaustivo di osservazione live/E2E e del percorso di release Docker; `run_release_soak=true` viene mantenuto per un periodo esplicito di osservazione beta. L'accettazione del pacchetto fornisce l'E2E Telegram canonico del pacchetto durante la convalida della candidate, evitando un secondo processo simultaneo di polling live.

  Fornire `release_package_spec` dopo la pubblicazione di una beta per riutilizzare il pacchetto npm distribuito nei controlli della release, nell'accettazione del pacchetto e nell'E2E Telegram del pacchetto senza ricreare il tarball della release. Fornire `npm_telegram_package_spec` solo quando Telegram deve utilizzare un pacchetto pubblicato diverso dal resto della convalida della release. Fornire `package_acceptance_package_spec` quando l'accettazione del pacchetto deve utilizzare un pacchetto pubblicato diverso dalla specifica del pacchetto della release. Fornire `evidence_package_spec` quando il rapporto delle prove della release deve dimostrare che la convalida corrisponde a un pacchetto npm pubblicato senza imporre l'E2E Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Eseguire il flusso di lavoro manuale `Package Acceptance` quando si desidera una prova su un canale parallelo per un pacchetto candidato mentre prosegue il lavoro sulla release. Usare `source=npm` per `openclaw@beta`, `openclaw@latest` o una versione di release esatta; `source=ref` per creare un pacchetto da un branch/tag/SHA `package_ref` attendibile con l'harness `workflow_ref` corrente; `source=url` per un tarball HTTPS pubblico con SHA-256 obbligatorio e criteri rigorosi per gli URL pubblici; `source=trusted-url` per un criterio di origine attendibile denominato che richiede `trusted_source_id` e SHA-256; oppure `source=artifact` per un tarball caricato da un'altra esecuzione di GitHub Actions.

  Il flusso di lavoro risolve il candidato in `package-under-test`, riutilizza lo scheduler della release Docker E2E con tale tarball e può eseguire la QA di Telegram sullo stesso tarball con `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Quando le corsie Docker selezionate includono `published-upgrade-survivor`, l'artefatto del pacchetto è il candidato e `published_upgrade_survivor_baseline` seleziona la baseline pubblicata. `update-restart-auth` usa il pacchetto candidato sia come CLI installata sia come pacchetto sottoposto a test, in modo da esercitare il percorso di riavvio gestito del comando di aggiornamento candidato.

  Esempio:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Profili comuni:
  - `smoke`: corsie di installazione/canale/agente, rete del Gateway e ricaricamento della configurazione
  - `package`: corsie native dell'artefatto per pacchetto/aggiornamento/riavvio/plugin senza OpenWebUI né ClawHub in produzione
  - `product`: profilo del pacchetto più canali MCP, pulizia di cron/sottoagenti, ricerca web OpenAI e OpenWebUI
  - `full`: segmenti del percorso di release Docker con OpenWebUI
  - `custom`: selezione esatta di `docker_lanes` per una riesecuzione mirata

- Eseguire direttamente il flusso di lavoro manuale `CI` quando serve solo una copertura CI normale e deterministica per il candidato alla release. Le esecuzioni CI manuali ignorano la delimitazione basata sulle modifiche e forzano gli shard Linux Node, gli shard dei plugin inclusi, gli shard dei contratti di plugin e canali, la compatibilità con Node 22, `check-*`, `check-additional-*`, i controlli smoke degli artefatti compilati, i controlli della documentazione, le Skills Python, Windows, macOS e le corsie i18n della Control UI. Le esecuzioni CI manuali autonome eseguono Android solo se avviate con `include_android=true`; `Full Release Validation` passa tale input al proprio processo CI figlio.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Eseguire `pnpm qa:otel:smoke` durante la convalida della telemetria della release. Esercita il laboratorio QA tramite un ricevitore OTLP/HTTP locale e verifica l'esportazione di tracce, metriche e log, nonché gli attributi di traccia limitati e l'oscuramento di contenuti/identificatori, senza richiedere Opik, Langfuse o un altro collettore esterno.
- Eseguire `pnpm qa:otel:collector-smoke` durante la convalida della compatibilità del collettore. Instrada la stessa esportazione OTLP del laboratorio QA attraverso un vero container Docker OpenTelemetry Collector prima delle asserzioni del ricevitore locale.
- Eseguire `pnpm qa:prometheus:smoke` durante la convalida dello scraping Prometheus protetto. Esercita il laboratorio QA, rifiuta gli scraping non autenticati e verifica che le famiglie di metriche critiche per la release non contengano contenuti dei prompt, identificatori non elaborati, token di autenticazione e percorsi locali.
- Eseguire `pnpm qa:observability:smoke` per eseguire consecutivamente le corsie smoke OpenTelemetry e Prometheus dal checkout dei sorgenti.
- Eseguire `pnpm release:check` prima di ogni release con tag.
- Il controllo preliminare `OpenClaw NPM Release` genera le prove relative alle dipendenze della release prima di creare il tarball npm. Il gate delle vulnerabilità degli avvisi npm blocca la release. I report sul rischio del manifesto transitivo, sulla superficie di proprietà/installazione delle dipendenze e sulle modifiche alle dipendenze costituiscono esclusivamente prove della release. Il report sulle modifiche alle dipendenze confronta il candidato alla release con il precedente tag di release raggiungibile. Il controllo preliminare carica le prove delle dipendenze come `openclaw-release-dependency-evidence-<tag>` e le incorpora anche in `dependency-evidence/` all'interno dell'artefatto preliminare npm preparato. Il percorso di pubblicazione effettivo riutilizza tale artefatto preliminare, quindi allega le stesse prove alla release GitHub come `openclaw-<version>-dependency-evidence.zip`.
- Eseguire `OpenClaw Release Publish` per la sequenza di pubblicazione con modifiche dopo la creazione del tag. Avviare le normali pubblicazioni beta e stabili da `main` attendibile; il tag della release seleziona comunque il commit di destinazione esatto e può puntare a `release/YYYY.M.PATCH`. Le pubblicazioni alpha di Tideclaw rimangono sul branch alpha corrispondente. Passare il valore `preflight_run_id` npm di OpenClaw riuscito, il valore `full_release_validation_run_id` riuscito e il valore `full_release_validation_run_attempt` esatto, mantenendo l'ambito predefinito di pubblicazione dei plugin `all-publishable`, a meno che non si stia eseguendo intenzionalmente una riparazione mirata. Il flusso di lavoro serializza la pubblicazione npm dei plugin, la pubblicazione dei plugin su ClawHub e la pubblicazione npm di OpenClaw, affinché il pacchetto principale non venga pubblicato prima dei relativi plugin esternalizzati; la promozione Windows e Android viene eseguita in parallelo alla pubblicazione npm principale sulla pagina della release in bozza. Le riesecuzioni della pubblicazione sono ripristinabili: una versione npm principale già pubblicata evita l'avvio della pubblicazione principale dopo che il flusso di lavoro ha dimostrato che il tarball nel registro corrisponde all'artefatto preliminare del tag; inoltre, la promozione Windows/Android viene ignorata quando la release contiene già il contratto degli asset verificato, in modo che un nuovo tentativo ripeta solo le fasi non riuscite. Le riparazioni mirate esclusivamente ai plugin richiedono `plugin_publish_scope=selected` e un elenco di plugin non vuoto. Le esecuzioni `all-publishable` riservate ai plugin richiedono prove preliminari e di convalida completa della release complete e immutabili; le prove parziali vengono rifiutate.
- La versione stabile `OpenClaw Release Publish` richiede un valore `windows_node_tag` esatto dopo l'esistenza della release `openclaw/openclaw-windows-node` corrispondente non preliminare, oltre alla mappa `windows_node_installer_digests` approvata per il candidato. Prima di avviare qualsiasi processo di pubblicazione figlio, verifica che la release sorgente sia pubblicata, non preliminare, contenga i programmi di installazione x64/ARM64 richiesti e corrisponda ancora alla mappa approvata. Avvia quindi `Windows Node Release` mentre la release di OpenClaw è ancora una bozza, trasferendo senza modifiche la mappa fissata dei digest dei programmi di installazione. Il flusso di lavoro figlio scarica i programmi di installazione firmati di Windows Hub da quel tag esatto, li confronta con i digest fissati, verifica su un runner Windows che le relative firme Authenticode usino il firmatario OpenClaw Foundation previsto, genera un manifesto SHA-256 e carica i programmi di installazione e il manifesto nella release GitHub canonica di OpenClaw; quindi scarica nuovamente gli asset promossi e verifica l'appartenenza al manifesto e gli hash. Il processo padre verifica il contratto corrente degli asset x64, ARM64 e dei checksum prima della pubblicazione. Il ripristino diretto rifiuta i nomi di asset `OpenClawCompanion-*` imprevisti prima di sostituire gli asset previsti dal contratto con i byte fissati della sorgente.

  Avviare manualmente `Windows Node Release` solo per il ripristino e passare sempre un tag esatto, mai `latest`, insieme alla mappa JSON `expected_installer_digests` esplicita della release sorgente approvata. I link di download del sito web devono puntare agli URL esatti degli asset della release OpenClaw stabile corrente oppure a `releases/latest/download/...` solo dopo aver verificato che il reindirizzamento latest di GitHub punti alla stessa release; non creare un link esclusivamente alla pagina della release del repository complementare.

- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato: `OpenClaw Release Checks`. Esegue inoltre il percorso di parità simulata di QA Lab, il profilo di rilascio Matrix e il percorso QA di Telegram prima dell'approvazione del rilascio. I percorsi live utilizzano l'ambiente `qa-live-shared`; Telegram utilizza anche lease delle credenziali CI di Convex. Eseguire il workflow manuale `QA-Lab - All Lanes` con `matrix_profile=all` quando si desiderano tutti gli scenari Matrix mantenuti; il workflow distribuisce la selezione tra i profili di trasporto, contenuti multimediali ed E2EE per mantenere la prova completa entro i timeout di ciascun job.
- La convalida del runtime di installazione e aggiornamento multipiattaforma fa parte dei workflow pubblici `OpenClaw Release Checks` e `Full Release Validation`, che richiamano direttamente il workflow riutilizzabile `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Questa separazione è intenzionale: mantiene il percorso di rilascio npm reale breve, deterministico e incentrato sugli artefatti, mentre i controlli live più lenti restano nel proprio percorso per non ritardare né bloccare la pubblicazione.
- I controlli di rilascio che utilizzano segreti devono essere avviati tramite `Full Release Validation` o dal riferimento del workflow `main`/release, affinché la logica del workflow e i segreti rimangano controllati.
- `OpenClaw Release Checks` accetta un branch, un tag o uno SHA completo del commit, purché il commit risolto sia raggiungibile da un branch o da un tag di rilascio di OpenClaw.
- Il preflight di sola convalida `OpenClaw NPM Release` accetta anche lo SHA completo di 40 caratteri del commit corrente del branch del workflow senza richiedere un tag pubblicato. Tale percorso SHA serve esclusivamente per la convalida e non può essere promosso a una pubblicazione reale. In modalità SHA, il workflow sintetizza `v<package.json version>` esclusivamente per il controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio.
- Entrambi i workflow mantengono il percorso di pubblicazione e promozione reale sui runner ospitati da GitHub, mentre il percorso di convalida che non apporta modifiche può utilizzare i runner Linux Blacksmith più grandi.
- Quel workflow esegue `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` utilizzando entrambi i segreti del workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`.
- Il preflight del rilascio npm non attende più il percorso separato dei controlli di rilascio.
- Prima di creare localmente il tag di una release candidate, eseguire `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. L'helper esegue nell'ordine appropriato i controlli rapidi di sicurezza del rilascio, i controlli di rilascio npm/ClawHub dei plugin, la build, la build dell'interfaccia utente e `release:openclaw:npm:check`, così da rilevare gli errori comuni che bloccano l'approvazione prima dell'avvio del workflow di pubblicazione di GitHub.
- Eseguire `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o il tag di prerelease/correzione corrispondente) prima dell'approvazione.
- Dopo la pubblicazione su npm, eseguire `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versione beta/correttiva corrispondente) per verificare il percorso di installazione dal registro pubblicato in un nuovo prefisso temporaneo.
- Dopo la pubblicazione di una beta, eseguire `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` per verificare l'onboarding del pacchetto installato, la configurazione di Telegram e l'E2E reale di Telegram sul pacchetto npm pubblicato, utilizzando il pool condiviso di credenziali Telegram con lease. Per esecuzioni locali occasionali, i maintainer possono omettere le variabili Convex e passare direttamente le tre credenziali di ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Per eseguire lo smoke test beta completo successivo alla pubblicazione da un computer di un maintainer, utilizzare `pnpm release:beta-smoke -- --beta betaN`. L'helper esegue la convalida dell'aggiornamento npm e della destinazione pulita in Parallels, avvia `NPM Telegram Beta E2E`, interroga periodicamente l'esecuzione esatta del workflow, scarica l'artefatto e stampa il report di Telegram.
- I maintainer possono eseguire lo stesso controllo successivo alla pubblicazione da GitHub Actions tramite il workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e non viene eseguito a ogni merge.
- L'automazione del rilascio per i maintainer utilizza prima il preflight e poi la promozione:
  - La pubblicazione npm reale deve superare un preflight npm `preflight_run_id`.
  - L'orchestrazione e il preflight delle normali pubblicazioni beta e stabili utilizzano `main` attendibile sul tag di destinazione esatto. La pubblicazione e il preflight alpha di Tideclaw utilizzano il branch alpha corrispondente.
  - I rilasci npm stabili utilizzano per impostazione predefinita `beta`; la pubblicazione npm stabile può indirizzare esplicitamente `latest` tramite un input del workflow.
  - La modifica basata su token dei dist-tag npm risiede in `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, perché `npm dist-tag add` richiede ancora `NPM_TOKEN`, mentre il repository sorgente mantiene la pubblicazione esclusivamente tramite OIDC.
  - Il workflow pubblico `macOS Release` è destinato esclusivamente alla convalida; quando un tag esiste soltanto su un branch di rilascio ma il workflow viene avviato da `main`, impostare `public_release_branch=release/YYYY.M.PATCH`.
  - La pubblicazione macOS reale deve superare con successo i controlli macOS `preflight_run_id` e `validate_run_id`.
  - I percorsi di pubblicazione reali promuovono gli artefatti preparati anziché ricompilarli.
- Per i rilasci correttivi stabili come `YYYY.M.PATCH-N`, il verificatore successivo alla pubblicazione controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.PATCH` a `YYYY.M.PATCH-N`, affinché le correzioni di rilascio non lascino silenziosamente le installazioni globali meno recenti sul payload stabile di base.
- Il preflight del rilascio npm si interrompe in modo sicuro se il tarball non include sia `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto, per evitare di distribuire nuovamente una dashboard del browser vuota.
- La verifica successiva alla pubblicazione controlla inoltre che gli entrypoint dei plugin pubblicati e i metadati del pacchetto siano presenti nel layout del registro installato. Un rilascio privo dei payload di runtime dei plugin non supera il verificatore successivo alla pubblicazione e non può essere promosso a `latest`.
- `pnpm test:install:smoke` applica inoltre il limite `unpackedSize` di npm pack al tarball candidato per l'aggiornamento, affinché l'E2E dell'installer rilevi aumenti accidentali delle dimensioni del pacchetto prima del percorso di pubblicazione del rilascio.
- Se il lavoro di rilascio ha modificato la pianificazione della CI, i manifest delle tempistiche delle estensioni o le matrici dei test delle estensioni, rigenerare e revisionare prima dell'approvazione gli output della matrice `plugin-prerelease-extension-shard`, gestiti dal pianificatore, a partire da `.github/workflows/plugin-prerelease.yml`, affinché le note di rilascio non descrivano un layout CI obsoleto.
- La preparazione del rilascio stabile per macOS include anche le superfici dell'updater: il rilascio GitHub deve includere infine i pacchetti `.zip`, `.dmg` e `.dSYM.zip`; `appcast.xml` su `main` deve puntare al nuovo zip stabile dopo la pubblicazione (il workflow di pubblicazione macOS ne esegue automaticamente il commit oppure apre una PR dell'appcast quando il push diretto è bloccato); l'app pacchettizzata deve mantenere un bundle id non di debug, un URL del feed Sparkle non vuoto e un `CFBundleVersion` uguale o superiore al limite minimo canonico della build Sparkle per quella versione di rilascio.

## Box di test per il rilascio

`Full Release Validation` consente agli operatori di avviare l'intera matrice del prodotto da un unico punto di ingresso. Utilizzare l'helper affinché ogni workflow figlio venga eseguito da un branch temporaneo fissato a un unico SHA attendibile del workflow `main`, mentre il commit richiesto rimane il candidato sottoposto a test:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

L'helper recupera il valore corrente di `origin/main`, pubblica `release-ci/<workflow-sha>-...` su quel commit attendibile del workflow, deduce `beta` dalle versioni alpha/beta del pacchetto e `stable` negli altri casi, avvia `Full Release Validation` dal branch temporaneo con `ref=<target-sha>`, verifica che ogni `headSha` dei workflow figli corrisponda allo SHA fissato del workflow padre e infine elimina il branch temporaneo. Passare `-f reuse_evidence=false` per forzare una nuova esecuzione, `-f release_profile=full` per l'ampia verifica consultiva oppure `--workflow-sha <trusted-main-sha>` per fissare un commit meno recente ancora raggiungibile dal valore corrente di `origin/main`. Il workflow non scrive mai riferimenti del repository. Ciò mantiene disponibili gli strumenti di rilascio riservati a main senza aggiungere commit degli strumenti al candidato ed evita di convalidare accidentalmente un'esecuzione figlia `main` più recente.

Quando il Code SHA risulta valido, eseguire il commit del solo `CHANGELOG.md` ed eseguire lo stesso helper con il Release SHA:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Il secondo workflow padre riutilizza le prove del prodotto soltanto quando GitHub dimostra che il Release SHA discende dal Code SHA e che l'insieme completo dei percorsi modificati è esattamente `CHANGELOG.md`. Registra `changelog-only-release-v1` e non avvia alcun processo figlio del prodotto. Il preflight npm e l'accettazione di pacchetto/installazione vengono comunque eseguiti sul Release SHA perché i byte del relativo tarball sono cambiati.

Per un nuovo Code SHA, il workflow risolve la destinazione, avvia manualmente `CI` e quindi avvia `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuisce lo smoke test dell'installazione, i controlli di rilascio multipiattaforma, la copertura live/E2E Docker del percorso di rilascio quando è abilitato il soak, Package Acceptance con l'E2E canonico del pacchetto Telegram, la parità di QA Lab, Matrix live e Telegram live. Un'esecuzione completa/totale è accettabile soltanto quando il riepilogo `Full Release Validation` indica `normal_ci`, `plugin_prerelease` e `release_checks` come riusciti, a meno che una nuova esecuzione mirata non abbia intenzionalmente ignorato il processo figlio separato `Plugin Prerelease`. Utilizzare il processo figlio autonomo `npm-telegram` soltanto per una nuova esecuzione mirata del pacchetto pubblicato con `release_package_spec` o `npm_telegram_package_spec`. Il riepilogo finale del verificatore include tabelle dei job più lenti per ogni esecuzione figlia, affinché il responsabile del rilascio possa vedere il percorso critico corrente senza scaricare i log.

Il processo figlio relativo alle prestazioni del prodotto produce esclusivamente artefatti in questo percorso di rilascio. Il
workflow generale lo avvia con `publish_reports=false` e la convalida viene rifiutata
se il relativo controllo per la sola produzione di artefatti non dimostra che il publisher dei report Clawgrit è rimasto
ignorato.

Consultare [Convalida completa del rilascio](/it/reference/full-release-validation) per la matrice completa delle fasi, i nomi esatti dei job del workflow, le differenze tra i profili stabile e completo, gli artefatti e i riferimenti per le nuove esecuzioni mirate.

I workflow figli vengono avviati dal riferimento attendibile fissato allo SHA che esegue `Full Release Validation`. Ogni esecuzione figlia deve utilizzare lo SHA esatto del workflow padre. Non utilizzare avvii diretti di `--ref main -f ref=<sha>` come prova di rilascio; utilizzare `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Utilizzare `release_profile` per selezionare l'ampiezza della copertura live/provider:

- `beta`: percorso live e Docker OpenAI/core più rapido tra quelli essenziali per il rilascio
- `stable`: copertura beta più provider/backend stabili per l'approvazione del rilascio
- `full`: copertura stabile più ampia copertura consultiva di provider/contenuti multimediali

La convalida stabile e completa esegue sempre, prima della promozione, la verifica esaustiva live/E2E, il percorso di rilascio Docker e la verifica limitata della sopravvivenza agli aggiornamenti pubblicati. Utilizzare `run_release_soak=true` per richiedere la stessa verifica per una beta. Tale verifica copre gli ultimi quattro pacchetti stabili, le baseline fissate `2026.4.23` e `2026.5.2` e la copertura meno recente `2026.4.15`, rimuovendo le baseline duplicate e suddividendo ciascuna baseline in un job separato del runner Docker.

`OpenClaw Release Checks` utilizza il riferimento attendibile del workflow per risolvere una sola volta il riferimento di destinazione come `release-package-under-test` e riutilizza tale artefatto nei controlli multipiattaforma, di Package Acceptance e Docker del percorso di rilascio durante il soak. In questo modo, tutti i box rivolti ai pacchetti utilizzano gli stessi byte e si evitano build ripetute del pacchetto. Quando una beta è già disponibile su npm, impostare `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` affinché i controlli di rilascio scarichino una sola volta il pacchetto distribuito, estraggano il relativo SHA sorgente della build da `dist/build-info.json` e riutilizzino tale artefatto per i percorsi multipiattaforma, Package Acceptance, Docker del percorso di rilascio e Telegram del pacchetto.

Lo smoke test multipiattaforma dell'installazione OpenAI utilizza `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando è impostata la variabile del repository/dell'organizzazione, altrimenti `openai/gpt-5.6-luna`, perché questo percorso verifica l'installazione del pacchetto, l'onboarding, l'avvio del Gateway e una singola esecuzione live dell'agente, anziché misurare le prestazioni del modello più potente. La matrice più ampia dei provider live resta la sede della copertura specifica dei modelli.

Utilizzare queste varianti in base alla fase del rilascio:

```bash
# Convalida lo SHA del codice con il prodotto completo.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Convalida lo SHA della release contenente solo il changelog riutilizzando le evidenze del prodotto dello SHA del codice.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Dopo la pubblicazione di una beta, aggiunge l'E2E di Telegram per il pacchetto pubblicato.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Non usare l'intero flusso generale come prima riesecuzione dopo una correzione mirata. Se un ambiente fallisce, per la verifica successiva usare il workflow figlio, il job, la lane Docker, il profilo del pacchetto, il provider del modello o la lane QA che ha causato l'errore. Eseguire nuovamente l'intero flusso generale solo quando la correzione ha modificato l'orchestrazione condivisa della release o ha reso obsolete le precedenti evidenze relative a tutti gli ambienti. Il verificatore finale del flusso generale ricontrolla gli ID registrati delle esecuzioni dei workflow figli; pertanto, dopo la riesecuzione riuscita di un workflow figlio, rieseguire soltanto il job padre `Verify full validation` non riuscito.

`rerun_group=all` può riutilizzare una precedente esecuzione riuscita del flusso generale quando il profilo di release,
l'impostazione di soak effettiva e gli input di convalida corrispondono e lo SHA di destinazione
è identico oppure la nuova destinazione è un discendente il cui insieme completo di percorsi modificati
è esattamente `CHANGELOG.md`. Il riutilizzo della destinazione esatta registra
`exact-target-full-validation-v1`; lo SHA della release successivo alla convalida registra
`changelog-only-release-v1`. Quest'ultimo riutilizza solo la convalida del prodotto. Il controllo preliminare
npm, i byte del pacchetto, la provenienza delle note di release e l'accettazione
dell'installazione/aggiornamento devono comunque essere eseguiti sullo SHA della release. Qualsiasi modifica
alla versione, al sorgente, ai file generati, alle dipendenze, al pacchetto o alla destinazione gestita dal workflow
richiede un nuovo SHA del codice e una nuova convalida completa. Le esecuzioni più recenti del flusso generale per lo stesso riferimento `release/*` e
gruppo di riesecuzione sostituiscono automaticamente quelle in corso. Passare
`reuse_evidence=false` per forzare una nuova esecuzione completa.

Per un ripristino circoscritto, passare `rerun_group` al flusso generale. `all` è l'effettiva esecuzione candidata per la release, `ci` esegue solo il normale workflow figlio CI, `plugin-prerelease` esegue solo il workflow figlio dei Plugin riservato alla release, `release-checks` esegue tutti gli ambienti di release e i gruppi di release più specifici sono `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`. Le riesecuzioni mirate di `npm-telegram` richiedono `release_package_spec` o `npm_telegram_package_spec`; le esecuzioni complete/totali usano l'E2E canonico di Telegram per il pacchetto all'interno dell'accettazione del pacchetto. Le riesecuzioni mirate multipiattaforma possono aggiungere `cross_os_suite_filter=windows/packaged-upgrade` o un altro filtro per sistema operativo/suite. Gli errori nei controlli di release QA bloccano la normale convalida della release, inclusa la deviazione richiesta degli strumenti dinamici OpenClaw nel livello standard. Le esecuzioni alpha di Tideclaw possono comunque trattare come consultive le lane dei controlli di release non relative alla sicurezza del pacchetto. Con `release_profile=beta`, le suite con provider live `Run repo/live E2E validation` sono consultive (avvisi, non blocchi); i profili stabile e completo continuano a considerarle bloccanti. Quando `live_suite_filter` richiede esplicitamente una lane live QA soggetta a controllo, come Discord, WhatsApp o Slack, deve essere abilitata la variabile del repository `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` corrispondente; altrimenti l'acquisizione degli input fallisce anziché ignorare silenziosamente la lane.

### Vitest

L'ambiente Vitest è il workflow figlio manuale `CI`. La CI manuale ignora intenzionalmente la delimitazione in base alle modifiche e forza il normale grafo dei test per il candidato alla release: shard Linux Node, shard dei Plugin inclusi, shard dei contratti di Plugin e canali, compatibilità con Node 22, `check-*`, `check-additional-*`, controlli smoke degli artefatti compilati, controlli della documentazione, Skills Python, Windows, macOS e i18n dell'interfaccia di controllo. Android è incluso quando `Full Release Validation` esegue l'ambiente, perché il flusso generale passa `include_android=true`; la CI manuale autonoma richiede `include_android=true` per la copertura Android.

Usare questo ambiente per rispondere alla domanda «l'albero dei sorgenti ha superato l'intera suite di test normale?». Non equivale alla convalida del prodotto nel percorso di release. Evidenze da conservare:

- riepilogo `Full Release Validation` che mostra l'URL dell'esecuzione `CI` avviata
- esecuzione `CI` riuscita sullo SHA di destinazione esatto
- nomi degli shard non riusciti o lenti nei job CI durante l'analisi delle regressioni
- artefatti relativi alle tempistiche di Vitest, come `.artifacts/vitest-shard-timings.json`, quando un'esecuzione richiede un'analisi delle prestazioni

Eseguire direttamente la CI manuale solo quando la release richiede una CI normale deterministica, ma non gli ambienti Docker, QA Lab, live, multipiattaforma o dei pacchetti. Usare il primo comando per la CI diretta senza Android. Aggiungere `include_android=true` quando la CI diretta del candidato alla release deve coprire Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

L'ambiente Docker si trova in `OpenClaw Release Checks` tramite `openclaw-live-and-e2e-checks-reusable.yml`, oltre al workflow `install-smoke` in modalità release. Convalida il candidato alla release tramite ambienti Docker con pacchetti, anziché soltanto mediante test a livello di sorgente.

La copertura Docker della release include:

- smoke test completo dell'installazione con lo smoke test lento dell'installazione globale tramite Bun abilitato
- preparazione/riutilizzo dell'immagine per lo smoke test del Dockerfile radice in base allo SHA di destinazione, con i job smoke QR, radice/Gateway e programma di installazione/Bun eseguiti come shard distinti dello smoke test di installazione
- lane E2E del repository
- segmenti Docker del percorso di release: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, da `plugins-runtime-install-a` a `plugins-runtime-install-h` e `openwebui`
- copertura OpenWebUI su un runner dedicato con disco di grandi dimensioni, quando richiesta
- lane separate di installazione/disinstallazione dei Plugin inclusi, da `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- suite con provider live/E2E e copertura dei modelli live Docker quando i controlli di release includono suite live

Usare gli artefatti Docker prima di rieseguire. Lo scheduler del percorso di release carica `.artifacts/docker-tests/` con i log delle lane, `summary.json`, `failures.json`, le tempistiche delle fasi, il JSON del piano dello scheduler e i comandi di riesecuzione. Per un ripristino mirato, usare `docker_lanes=<lane[,lane]>` nel workflow live/E2E riutilizzabile anziché rieseguire tutti i segmenti della release. I comandi di riesecuzione generati includono gli input precedenti `package_artifact_run_id` e quelli delle immagini Docker preparate, quando disponibili, affinché una lane non riuscita possa riutilizzare lo stesso tarball e le stesse immagini GHCR.

### QA Lab

Anche l'ambiente QA Lab fa parte di `OpenClaw Release Checks`. Costituisce il controllo di release per il comportamento agentico e a livello di canale, separato da Vitest e dai meccanismi dei pacchetti Docker.

La copertura QA Lab della release include:

- lane di parità simulata che confronta la lane candidata OpenAI con il riferimento `anthropic/claude-opus-4-8` usando il pacchetto di parità agentica
- profilo di release dell'adattatore live Matrix tramite l'ambiente `qa-live-shared`
- lane QA live di Telegram tramite lease delle credenziali CI di Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` quando la telemetria della release richiede una verifica locale esplicita

Usare questo ambiente per rispondere alla domanda «la release si comporta correttamente negli scenari QA e nei flussi dei canali live?». Conservare gli URL degli artefatti per le lane di parità, Matrix e Telegram al momento dell'approvazione della release. La copertura Matrix completa resta disponibile come esecuzione QA Lab manuale suddivisa in shard, anziché come lane predefinita critica per la release.

### Pacchetto

L'ambiente Pacchetto è il controllo del prodotto installabile. È supportato da `Package Acceptance` e dal risolutore `scripts/resolve-openclaw-package-candidate.mjs`. Il risolutore normalizza un candidato nel tarball `package-under-test` utilizzato dall'E2E Docker, convalida l'inventario del pacchetto, registra la versione e lo SHA-256 del pacchetto e mantiene separato il riferimento dell'infrastruttura del workflow dal riferimento del sorgente del pacchetto.

Sorgenti candidati supportati:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versione esatta della release OpenClaw
- `source=ref`: crea il pacchetto da un branch, un tag o uno SHA completo del commit `package_ref` attendibile con l'infrastruttura `workflow_ref` selezionata
- `source=url`: scarica un `.tgz` HTTPS pubblico con `package_sha256` obbligatorio; vengono rifiutati credenziali nell'URL, porte HTTPS non predefinite, nomi host o indirizzi risolti privati/interni/per usi speciali e reindirizzamenti non sicuri
- `source=trusted-url`: scarica un `.tgz` HTTPS con `package_sha256` e `trusted_source_id` obbligatori da un criterio denominato in `.github/package-trusted-sources.json`; usare questa opzione per mirror aziendali gestiti dai manutentori o repository di pacchetti privati, anziché aggiungere a `source=url` un'elusione della rete privata a livello di input
- `source=artifact`: riutilizza un `.tgz` caricato da un'altra esecuzione di GitHub Actions

`OpenClaw Release Checks` esegue l'accettazione del pacchetto con `source=artifact`, l'artefatto del pacchetto di release preparato, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. L'accettazione del pacchetto mantiene migrazione, aggiornamento, aggiornamento di VPS gestito da root, riavvio dopo l'aggiornamento con autenticazione configurata, installazione live delle Skills ClawHub, pulizia delle dipendenze obsolete dei Plugin, fixture offline dei Plugin, aggiornamento dei Plugin, protezione dall'escape nei collegamenti dei comandi dei Plugin e QA del pacchetto Telegram sullo stesso tarball risolto. I controlli di release bloccanti usano come riferimento predefinito l'ultimo pacchetto pubblicato; il profilo beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` estende l'analisi dei superstiti agli aggiornamenti pubblicati a `last-stable-4`, oltre ai riferimenti fissati `2026.4.23`, `2026.5.2` e `2026.4.15` con scenari `reported-issues`. Usare l'accettazione del pacchetto con `source=npm` per un candidato già distribuito, `source=ref` per un tarball npm locale basato su SHA prima della pubblicazione, `source=trusted-url` per un mirror aziendale/privato gestito dai manutentori oppure `source=artifact` per un tarball preparato e caricato da un'altra esecuzione di GitHub Actions.

È il sostituto nativo di GitHub per la maggior parte della copertura di pacchetti/aggiornamenti che in precedenza richiedeva Parallels. I controlli di release multipiattaforma restano importanti per onboarding, programmi di installazione e comportamento specifici del sistema operativo, ma la convalida del prodotto relativa a pacchetti/aggiornamenti dovrebbe preferire l'accettazione del pacchetto.

La checklist canonica per la convalida di aggiornamenti e Plugin è [Verifica di aggiornamenti e Plugin](/it/help/testing-updates-plugins). Usarla per decidere quale lane locale, Docker, di accettazione del pacchetto o di controllo della release dimostri una modifica relativa all'installazione/aggiornamento di un Plugin, alla pulizia tramite doctor o alla migrazione di un pacchetto pubblicato. La migrazione esaustiva degli aggiornamenti pubblicati da ogni pacchetto stabile `2026.4.23+` è un workflow manuale `Update Migration` separato e non fa parte della CI completa della release.

La tolleranza dell'accettazione dei pacchetti legacy è intenzionalmente limitata nel tempo. I pacchetti fino a `2026.4.25` possono usare il percorso di compatibilità per le lacune nei metadati già pubblicati su npm: voci private dell'inventario QA mancanti nel tarball, `gateway install --wrapper` mancante, file di patch mancanti nella fixture Git derivata dal tarball, `update.channel` persistente mancante, percorsi legacy dei record di installazione dei Plugin, persistenza mancante dei record di installazione del marketplace e migrazione dei metadati di configurazione durante `plugins update`. Il pacchetto pubblicato `2026.4.26` può generare un avviso per i file di marcatura dei metadati della build locale già distribuiti. I pacchetti successivi devono soddisfare i contratti moderni dei pacchetti; le stesse lacune causano il fallimento della convalida della release.

Usare profili di accettazione del pacchetto più ampi quando la verifica della release riguarda un effettivo pacchetto installabile:

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
- `package`: contratti di installazione/aggiornamento/riavvio/pacchetto Plugin più prova in tempo reale dell'installazione di una skill ClawHub; questa è l'impostazione predefinita per il controllo della release
- `product`: `package` più canali MCP, pulizia di cron/sottoagenti, ricerca web OpenAI e OpenWebUI
- `full`: segmenti del percorso di release Docker con OpenWebUI
- `custom`: elenco esatto di `docker_lanes` per riesecuzioni mirate

Per la prova di Telegram con il pacchetto candidato, abilitare `telegram_mode=mock-openai` o `telegram_mode=live-frontier` in Package Acceptance. Il workflow passa il tarball `package-under-test` risolto al percorso Telegram; il workflow Telegram autonomo continua ad accettare una specifica npm pubblicata per i controlli successivi alla pubblicazione.

## Automazione della pubblicazione delle release ordinarie

Per la pubblicazione beta, `latest`, dei Plugin, della GitHub Release e delle piattaforme,
`OpenClaw Release Publish` è il normale punto di ingresso con modifiche. Il percorso mensile
`.33+` extended-stable, limitato a npm, non utilizza questo orchestratore. Il
workflow ordinario orchestra i workflow degli editori attendibili nell'ordine richiesto
dalla release:

1. Eseguire il checkout del tag della release e risolverne lo SHA del commit.
2. Verificare che il tag sia raggiungibile da `main` o `release/*` (oppure da un branch alpha di Tideclaw per le prerelease alpha).
3. Eseguire `pnpm plugins:sync:check`.
4. Avviare `Plugin NPM Release` con `publish_scope=all-publishable` e `ref=<release-sha>`.
5. Avviare `Plugin ClawHub Release` con lo stesso ambito e SHA.
6. Avviare `OpenClaw NPM Release` con il tag della release, il dist-tag npm e il valore `preflight_run_id` salvato, dopo aver verificato il valore `full_release_validation_run_id` salvato e il tentativo di esecuzione esatto.
7. Per le release stabili, creare o aggiornare la release GitHub come bozza, avviare `Windows Node Release` con il valore `windows_node_tag` esplicito e il valore `windows_node_installer_digests` approvato per il candidato, quindi verificare le risorse canoniche del programma di installazione Windows e dei checksum. Avviare inoltre `Android Release` per generare l'APK firmato per il tag esatto, insieme a checksum e provenienza. Verificare entrambi i contratti delle risorse native prima di pubblicare la bozza.

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

Pubblicazione stabile nel dist-tag beta predefinito:

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

Utilizzare i workflow di livello inferiore `Plugin NPM Release` e `Plugin ClawHub Release` solo per operazioni mirate di riparazione o ripubblicazione. `OpenClaw Release Publish` rifiuta `plugin_publish_scope=selected` quando `publish_openclaw_npm=true`, affinché il pacchetto principale non possa essere distribuito senza tutti i Plugin ufficiali pubblicabili, incluso `@openclaw/diffs-language-pack`. Per riparare un Plugin selezionato, impostare `publish_openclaw_npm=false` con `plugin_publish_scope=selected` e `plugins=@openclaw/name`, oppure avviare direttamente il workflow figlio.

Il bootstrap della prima pubblicazione su ClawHub costituisce l'eccezione: avviare `Plugin ClawHub New`
dal valore `main` attendibile e passare lo SHA completo della release di destinazione tramite `ref`.
Non eseguire mai il workflow di bootstrap stesso dal tag o dal branch della release:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

La convalida precedente al tag richiede `dry_run=true`, rifiuta gli input relativi
al tag della release e all'esecuzione padre e accetta soltanto una destinazione esatta raggiungibile da `main` o `release/*`.
Non carica le credenziali ClawHub, non pubblica i byte del pacchetto e non modifica la
configurazione dell'editore attendibile. Il workflow risolve comunque il piano del registro in tempo reale,
esegue il checkout e crea il pacchetto della destinazione esclusivamente in un job senza segreti, predispone la
toolchain ClawHub bloccata e convalida l'artefatto immutabile e lo
slug/l'identità del pacchetto prima che esista il tag della release. Approvare l'ambiente
`clawhub-plugin-bootstrap` soltanto dopo il completamento dei job di creazione del pacchetto senza segreti;
questo job di convalida protetto non dispone di credenziali né di comandi che apportano modifiche.

Un'esecuzione di prova approvata o un bootstrap reale successivo all'applicazione del tag deve includere il
tag esatto della release, più l'ID, il tentativo e il branch dell'esecuzione padre `OpenClaw Release Publish`.
Il padre attesta lo SHA del proprio workflow e uno SHA attendibile esatto
`main` separato per `Plugin ClawHub New`; l'esecuzione figlia e ogni approvazione
dell'ambiente protetto devono corrispondere allo SHA figlio approvato. Il tag della release viene
ricontrollato prima di ogni tentativo di pubblicazione e modifica dell'editore attendibile.

Il job di creazione del pacchetto
carica un singolo artefatto immutabile, il cui nome, ID/digest dell'artefatto Actions,
esecuzione/tentativo del produttore, SHA di destinazione e SHA-256/dimensione del tarball per ciascun pacchetto
vengono trasferiti ai job di convalida e protetti. Il job protetto esegue il checkout esclusivamente
degli strumenti `main` attendibili, convalida la tupla dell'artefatto tramite l'API GitHub, esegue il download
tramite l'ID esatto dell'artefatto, ricalcola l'hash di ogni tarball e convalida i percorsi TAR locali e
l'identità del pacchetto secondo le regole di canonicalizzazione USTAR della CLI fissata. Ogni
candidato supera quindi l'esecuzione di prova della pubblicazione tramite la CLI fissata, che termina prima
della ricerca nel registro o dell'autenticazione. Il pre-filtro del job con credenziali limita i ClawPack compressi
a 120 MiB, il payload totale dei file a 50 MiB, i dati TAR espansi a 64 MiB e
il numero di voci TAR a 10,000. La riparazione dell'editore attendibile per pacchetti esistenti resta
limitata alla configurazione, ma crea comunque il pacchetto della destinazione e richiede il tag richiesto,
oltre all'esatta uguaglianza dei byte e dei metadati del registro, prima di modificare la configurazione
dell'editore attendibile. La verifica successiva alla pubblicazione scarica l'artefatto ClawHub e
richiede gli stessi SHA-256 e dimensione. Un ripristino tramite riesecuzione dei job non riusciti può riutilizzare
l'artefatto del pacchetto di un tentativo precedente soltanto quando il job produttore esatto è stato completato
correttamente. Le prove finali vincolano inoltre la versione ClawHub bloccata, lo
SHA-256 del lock e l'integrità npm. Una mancata corrispondenza richiede una nuova versione del pacchetto.

## Input del workflow NPM

`OpenClaw NPM Release` accetta i seguenti input controllati dall'operatore:

- `tag`: tag della release obbligatorio, ad esempio `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; quando `preflight_only=true`, può anche essere lo SHA completo di 40 caratteri del commit corrente del branch del workflow per il preflight di sola convalida
- `preflight_only`: `true` esclusivamente per convalida/build/pacchetto, `false` per il percorso di pubblicazione reale
- `preflight_run_id`: ID di un'esecuzione di preflight esistente completata correttamente, obbligatorio nel percorso di pubblicazione reale affinché il workflow riutilizzi il tarball preparato anziché ricrearlo
- `full_release_validation_run_id`: ID di un'esecuzione `Full Release Validation` completata correttamente per questo tag/SHA, obbligatorio per la pubblicazione reale. Le pubblicazioni beta possono procedere basandosi sul solo preflight con un avviso, ma la promozione stabile/`latest` continua a richiederlo.
- `full_release_validation_run_attempt`: tentativo di esecuzione positivo esatto associato a `full_release_validation_run_id`; obbligatorio ogni volta che viene fornito l'ID dell'esecuzione, affinché le riesecuzioni non possano modificare le prove di autorizzazione durante la pubblicazione.
- `release_publish_run_id`: ID dell'esecuzione `OpenClaw Release Publish` approvata; obbligatorio quando questo workflow viene avviato da tale elemento padre (chiamate di pubblicazione reale effettuate da un attore bot)
- `plugin_npm_run_id`: ID dell'esecuzione `Plugin NPM Release` completata correttamente e corrispondente esattamente all'HEAD; obbligatorio per una pubblicazione reale del pacchetto principale `extended-stable`
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; accetta `alpha`, `beta`, `latest` o `extended-stable` e il valore predefinito è `beta`. La patch finale `33` e le successive devono utilizzare `extended-stable`; per impostazione predefinita, `extended-stable` rifiuta le patch precedenti e rifiuta sempre i tag non finali.
- `bypass_extended_stable_guard`: valore booleano destinato esclusivamente ai test, predefinito `false`; con `npm_dist_tag=extended-stable`, ignora i requisiti di idoneità mensile extended-stable, preservando i controlli relativi all'identità della release, all'artefatto, all'approvazione e alla rilettura.

`Plugin NPM Release` accetta `npm_dist_tag=default` per il comportamento delle release
esistenti oppure `npm_dist_tag=extended-stable` per il percorso mensile protetto. L'opzione
extended-stable richiede `publish_scope=all-publishable`, un input
`plugins` vuoto, una patch finale pari o superiore a `33` e il branch canonico
`extended-stable/YYYY.M.33` posizionato esattamente sulla propria punta. Non sposta mai i valori
`latest` o `beta` dei Plugin. Le nuove versioni dei pacchetti ricevono `extended-stable` atomicamente
tramite pubblicazione attendibile OIDC (`npm publish --tag extended-stable`); questo
workflow sorgente non utilizza `npm dist-tag add` autenticato tramite token. I nuovi tentativi
ignorano le versioni esatte già presenti in npm, quindi terminano in modo sicuro a meno che una rilettura
completa non confermi che ogni pacchetto esatto e ogni tag `extended-stable` siano convergenti.

`OpenClaw Release Publish` accetta i seguenti input controllati dall'operatore:

- `tag`: tag della release obbligatorio; deve già esistere
- `preflight_run_id`: ID di un'esecuzione di preflight `OpenClaw NPM Release` completata correttamente; obbligatorio quando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: ID di un'esecuzione `Full Release Validation` completata correttamente; obbligatorio quando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: tentativo positivo esatto associato a `full_release_validation_run_id`; obbligatorio ogni volta che viene fornito l'ID dell'esecuzione
- `windows_node_tag`: tag esatto della release `openclaw/openclaw-windows-node` non prerelease; obbligatorio per la pubblicazione stabile di OpenClaw
- `windows_node_installer_digests`: mappa JSON compatta, approvata per il candidato, dei nomi correnti dei programmi di installazione Windows ai relativi digest `sha256:` fissati; obbligatoria per la pubblicazione stabile di OpenClaw
- `npm_telegram_run_id`: ID facoltativo di un'esecuzione `NPM Telegram Beta E2E` completata correttamente da includere nelle prove finali della release
- `npm_dist_tag`: tag npm di destinazione per il pacchetto OpenClaw, uno tra `alpha`, `beta` o `latest`
- `plugin_publish_scope`: il valore predefinito è `all-publishable`; utilizzare `selected` soltanto per operazioni mirate di riparazione riguardanti esclusivamente i Plugin con `publish_openclaw_npm=false`
- `plugins`: nomi dei pacchetti `@openclaw/*` separati da virgole quando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: il valore predefinito è `true`; impostare `false` soltanto quando si utilizza il workflow come orchestratore di riparazioni riguardanti esclusivamente i Plugin
- `release_profile`: profilo di copertura della release utilizzato per i riepiloghi delle prove della release; il valore predefinito è `from-validation`, che lo legge dal manifesto di convalida, oppure può essere sostituito con `beta`, `stable` o `full`
- `wait_for_clawhub`: il valore predefinito è `false`, affinché la disponibilità npm non venga bloccata dal sidecar ClawHub; impostare `true` soltanto quando il completamento del workflow deve includere il completamento di ClawHub

`OpenClaw Release Checks` accetta i seguenti input controllati dall'operatore:

- `ref`: branch, tag o SHA completo del commit da convalidare. I controlli che usano segreti richiedono che il commit risolto sia raggiungibile da un branch o da un tag di rilascio di OpenClaw.
- `run_release_soak`: abilita i controlli esaustivi live/E2E, il percorso di rilascio Docker e il test di durata di tutti i superstiti agli aggiornamenti precedenti per i controlli delle versioni beta. Viene abilitato obbligatoriamente da `release_profile=stable` e `release_profile=full`.

Regole:

- Le versioni finali e correttive regolari con patch inferiore a `33` possono essere pubblicate in `beta` o `latest`. Le versioni finali con patch `33` o superiore devono essere pubblicate in `extended-stable`, mentre le versioni con suffisso correttivo a tale soglia vengono rifiutate.
- I tag di prerelease beta possono essere pubblicati solo in `beta`; i tag di prerelease alpha possono essere pubblicati solo in `alpha`
- Per `OpenClaw NPM Release`, l'input con lo SHA completo del commit è consentito solo quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` sono sempre destinati esclusivamente alla convalida
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il controllo preliminare; il workflow verifica questi metadati prima di proseguire con la pubblicazione

## Sequenza regolare di rilascio beta/stabile più recente

Questa sequenza legacy è destinata al normale rilascio orchestrato, che gestisce anche i plugin, la GitHub Release, Windows e il lavoro su altre piattaforme. Non è il percorso mensile extended-stable solo npm `.33+` documentato all'inizio di questa pagina.

Quando si prepara un normale rilascio stabile orchestrato:

1. Eseguire `OpenClaw NPM Release` con `preflight_only=true`. Prima che esista un tag, è possibile usare lo SHA del commit corrente completo del branch del workflow per un'esecuzione di prova del workflow di controllo preliminare destinata esclusivamente alla convalida.
2. Scegliere `npm_dist_tag=beta` per il normale flusso che parte dalla beta oppure `latest` solo quando si desidera intenzionalmente una pubblicazione stabile diretta.
3. Eseguire `Full Release Validation` sul branch di rilascio, sul tag di rilascio o sullo SHA completo del commit quando si desiderano la CI normale e la copertura di cache dei prompt live, Docker, QA Lab, Matrix e Telegram da un unico workflow manuale. Se intenzionalmente serve solo il grafo deterministico dei test normali, eseguire invece il workflow manuale `CI` sul riferimento di rilascio.
4. Selezionare l'esatto tag di rilascio `openclaw/openclaw-windows-node` non prerelease i cui programmi di installazione firmati x64 e ARM64 devono essere distribuiti. Salvarlo come `windows_node_tag` e salvare la relativa mappa dei digest convalidata come `windows_node_installer_digests`. L'helper del candidato al rilascio registra entrambi e li include nel comando di pubblicazione generato.
5. Salvare i valori riusciti di `preflight_run_id`, `full_release_validation_run_id` e l'esatto `full_release_validation_run_attempt`.
6. Eseguire `OpenClaw Release Publish` da `main` attendibile con lo stesso `tag`, lo stesso `npm_dist_tag`, il `windows_node_tag` selezionato, il relativo `windows_node_installer_digests` salvato, il `preflight_run_id` salvato, `full_release_validation_run_id` e `full_release_validation_run_attempt`. Pubblica i plugin esternalizzati su npm e ClawHub prima di promuovere il pacchetto npm di OpenClaw.
7. Se il rilascio è stato pubblicato su `beta`, usare il workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` per promuovere tale versione stabile da `beta` a `latest`.
8. Se il rilascio è stato intenzionalmente pubblicato direttamente in `latest` e `beta` deve adottare immediatamente la stessa build stabile, usare lo stesso workflow di rilascio per indirizzare entrambi i dist-tag alla versione stabile oppure lasciare che la sincronizzazione pianificata con autoriparazione sposti `beta` in seguito.

La modifica dei dist-tag risiede nel repository del registro dei rilasci perché richiede ancora `NPM_TOKEN`, mentre il repository del codice sorgente mantiene la pubblicazione esclusivamente tramite OIDC. In questo modo, sia il percorso di pubblicazione diretta sia quello di promozione a partire dalla beta restano documentati e visibili agli operatori.

Se un maintainer deve ricorrere all'autenticazione npm locale, eseguire tutti i comandi della CLI di 1Password (`op`) esclusivamente in una sessione tmux dedicata. Non chiamare `op` direttamente dalla shell principale dell'agente; mantenerlo all'interno di tmux rende osservabili prompt, avvisi e gestione degli OTP e impedisce la ripetizione degli avvisi dell'host.

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

I maintainer usano la documentazione privata sui rilasci in [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) come runbook operativo.

## Correlati

- [Canali di rilascio](/it/install/development-channels)
