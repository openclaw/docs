---
read_when:
    - Stai eseguendo il debug della riparazione delle dipendenze di runtime del Plugin incluso
    - Stai modificando il comportamento di avvio del Plugin, di doctor o di installazione del gestore di pacchetti
    - Ti occupi della manutenzione di installazioni pacchettizzate di OpenClaw o di manifest dei Plugin inclusi in bundle
sidebarTitle: Dependencies
summary: Come OpenClaw pianifica, prepara e ripara le dipendenze di runtime dei Plugin in bundle
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-05-01T08:32:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw non installa l'intero albero delle dipendenze di ogni plugin in bundle al momento dell'installazione del pacchetto. Prima deriva un piano effettivo dei plugin dalla configurazione e dai metadati dei plugin, poi prepara le dipendenze di runtime solo per i plugin in bundle di proprietà di OpenClaw che il piano può effettivamente caricare.

Questa pagina riguarda le dipendenze di runtime pacchettizzate per i plugin OpenClaw in bundle. I plugin di terze parti e i percorsi di plugin personalizzati usano ancora comandi espliciti di installazione dei plugin, come `openclaw plugins install` e `openclaw plugins update`.

## Suddivisione delle responsabilità

OpenClaw gestisce piano e criteri:

- quali plugin sono attivi per questa configurazione
- quali radici delle dipendenze sono scrivibili o di sola lettura
- quando la riparazione è consentita
- quali id dei plugin sono preparati per l'avvio
- controlli finali prima di importare i moduli di runtime dei plugin

Il gestore di pacchetti gestisce la convergenza delle dipendenze:

- risoluzione del grafo dei pacchetti
- gestione delle dipendenze di produzione, opzionali e peer
- layout di `node_modules`
- integrità dei pacchetti
- metadati di lock e installazione

In pratica, OpenClaw dovrebbe decidere cosa deve esistere. `pnpm` o `npm` dovrebbero fare in modo che il filesystem corrisponda a quella decisione.

OpenClaw gestisce anche il lock di coordinamento per ogni radice di installazione. I gestori di pacchetti proteggono la propria transazione di installazione, ma non serializzano le scritture dei manifest di OpenClaw, la copia/rinomina dello stage isolato, la validazione finale o l'importazione dei plugin rispetto a un altro processo Gateway, doctor o CLI che tocca la stessa radice delle dipendenze di runtime.

## Piano effettivo dei plugin

Il piano effettivo dei plugin deriva dalla configurazione più i metadati dei plugin rilevati. Questi input possono attivare le dipendenze di runtime dei plugin in bundle:

- `plugins.entries.<id>.enabled`
- `plugins.allow`, `plugins.deny` e `plugins.enabled`
- configurazione legacy dei canali, come `channels.telegram.enabled`
- provider, modelli o riferimenti a backend CLI configurati che richiedono un plugin
- impostazioni predefinite dei manifest in bundle, come `enabledByDefault`
- indice dei plugin installati e metadati dei manifest in bundle

La disattivazione esplicita prevale. Un plugin disattivato, un id di plugin negato, un sistema di plugin disattivato o un canale disattivato non attiva la riparazione delle dipendenze di runtime. Neanche lo stato di autenticazione persistito da solo attiva un canale o un provider in bundle.

Il piano dei plugin è l'input stabile. La materializzazione delle dipendenze generata è un output di quel piano.

## Flusso di avvio

L'avvio del Gateway analizza la configurazione e crea la tabella di lookup dei plugin di avvio prima che i moduli di runtime dei plugin vengano caricati. L'avvio prepara poi le dipendenze di runtime solo per gli `startupPluginIds` selezionati da quel piano.

Per le installazioni pacchettizzate, la preparazione delle dipendenze è consentita prima dell'importazione dei plugin. Dopo la preparazione, il loader di runtime importa i plugin di avvio con la riparazione dell'installazione disabilitata; a quel punto la materializzazione mancante delle dipendenze viene trattata come un errore di caricamento, non come un altro ciclo di riparazione.

Quando la preparazione delle dipendenze di avvio viene rimandata dopo il bind HTTP, la readiness del Gateway resta bloccata sul motivo `plugin-runtime-deps` finché le dipendenze dei plugin di avvio selezionati non sono materializzate e il runtime dei plugin di avvio non è stato caricato.

## Quando viene eseguita la riparazione

La riparazione delle dipendenze di runtime dovrebbe essere eseguita quando una di queste condizioni è vera:

- il piano effettivo dei plugin è cambiato e aggiunge plugin in bundle che richiedono dipendenze di runtime
- il manifest delle dipendenze generato non corrisponde più al piano effettivo
- i sentinel dei pacchetti installati previsti mancano o sono incompleti
- è stato richiesto `openclaw doctor --fix` o `openclaw plugins deps --repair`

La riparazione delle dipendenze di runtime non dovrebbe essere eseguita solo perché OpenClaw è stato avviato. Un avvio normale con un piano invariato e una materializzazione completa delle dipendenze dovrebbe saltare il lavoro del gestore di pacchetti.

I comandi che modificano la configurazione, abilitano plugin o riparano risultati di doctor possono entrare una volta in modalità piano dei plugin, materializzare le nuove dipendenze in bundle richieste, poi tornare al flusso normale del comando. `openclaw onboard` e `openclaw configure` locali lo fanno automaticamente dopo aver scritto correttamente la configurazione, così il successivo avvio del Gateway non scopre pacchetti di plugin in bundle mancanti dopo che l'avvio è già cominciato. Onboarding/configure remoto resta di sola lettura per le dipendenze di runtime locali.

## Regola di hot reload

I percorsi di hot reload che possono cambiare i plugin attivi devono ripassare dalla modalità piano dei plugin prima di caricare il runtime dei plugin. Il reload dovrebbe confrontare il nuovo piano effettivo dei plugin con quello precedente, preparare le dipendenze mancanti per i plugin in bundle appena attivi, quindi caricare o riavviare il runtime interessato.

Se un reload della configurazione non cambia il piano effettivo dei plugin, non dovrebbe riparare le dipendenze di runtime in bundle.

## Esecuzione del gestore di pacchetti

OpenClaw scrive un manifest di installazione generato per le dipendenze di runtime in bundle selezionate ed esegue il gestore di pacchetti nella radice di installazione delle dipendenze di runtime. Preferisce `pnpm` quando disponibile e ripiega sul runner `npm` incluso in Node.

Il percorso `pnpm` usa dipendenze di produzione, disabilita gli script del ciclo di vita, ignora il workspace e mantiene lo store dentro la radice di installazione:

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

Il fallback `npm` usa il wrapper di installazione npm sicuro con dipendenze di produzione, script del ciclo di vita disabilitati, modalità workspace disabilitata, audit disabilitato, output fund disabilitato, comportamento legacy delle dipendenze peer e output package-lock abilitato per la radice di installazione generata.

Dopo l'installazione, OpenClaw valida l'albero delle dipendenze preparato prima di renderlo visibile alla radice delle dipendenze di runtime. Lo stage isolato viene copiato nella radice delle dipendenze di runtime e validato di nuovo.

L'intera sezione di riparazione/materializzazione è protetta da un lock della radice di installazione. I proprietari correnti del lock registrano PID, ora di avvio del processo quando disponibile e ora di creazione. I lock legacy senza ora di avvio del processo o prova dell'ora di creazione vengono recuperati solo in base all'età del filesystem, così i lock con PID 1 Docker riciclato possono essere recuperati senza far scadere le normali installazioni correnti di lunga durata solo in base all'età.

## Radici di installazione

Le installazioni pacchettizzate non devono modificare directory di pacchetti di sola lettura. OpenClaw può leggere radici delle dipendenze da layer pacchettizzati, ma scrive le dipendenze di runtime generate in uno stage scrivibile, come:

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- `/var/lib/openclaw/plugin-runtime-deps` nelle installazioni in stile container

La radice scrivibile è il target finale della materializzazione. Le vecchie radici di sola lettura vengono mantenute come layer di compatibilità solo quando necessario.

Quando un aggiornamento pacchettizzato di OpenClaw cambia la radice scrivibile versionata ma il piano delle dipendenze dei plugin in bundle selezionati è ancora soddisfatto da una radice preparata precedente, la riparazione riutilizza quell'albero `node_modules` precedente invece di eseguire di nuovo il gestore di pacchetti. La nuova radice versionata ottiene comunque il proprio mirror corrente del runtime del pacchetto, quindi il codice del plugin proviene dal pacchetto OpenClaw corrente mentre gli alberi delle dipendenze invariati sono condivisi tra aggiornamenti. Il riutilizzo salta le radici precedenti con un lock delle dipendenze di runtime OpenClaw attivo, quindi una nuova radice non si collega a un albero delle dipendenze che un altro processo Gateway, doctor o CLI sta attualmente riparando.

## Comandi doctor e CLI

Usa `plugins deps` per ispezionare o riparare la materializzazione delle dipendenze di runtime dei plugin in bundle:

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

Usa doctor quando lo stato delle dipendenze fa parte della salute più ampia dell'installazione:

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` e doctor operano sulle dipendenze di runtime dei plugin in bundle di proprietà di OpenClaw selezionate dal piano effettivo dei plugin. Non sono comandi di installazione o aggiornamento di plugin di terze parti.

## Risoluzione dei problemi

Se un'installazione pacchettizzata segnala dipendenze di runtime in bundle mancanti:

1. Esegui `openclaw plugins deps --json` per ispezionare il piano selezionato e i pacchetti mancanti.
2. Esegui `openclaw plugins deps --repair` o `openclaw doctor --fix` per riparare lo stage scrivibile delle dipendenze.
3. Se la radice di installazione è di sola lettura, imposta `OPENCLAW_PLUGIN_STAGE_DIR` su un percorso scrivibile ed esegui di nuovo la riparazione.
4. Riavvia il Gateway dopo la riparazione se la dipendenza mancante ha bloccato il caricamento dei plugin di avvio.

Nei checkout sorgente, l'installazione del workspace di solito fornisce le dipendenze dei plugin in bundle. Esegui `pnpm install` per la riparazione delle dipendenze sorgente invece di usare come primo passaggio la riparazione delle dipendenze di runtime pacchettizzate.
