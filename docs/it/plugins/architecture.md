---
read_when:
    - Creazione o debug dei Plugin nativi di OpenClaw
    - Comprendere il modello di capacità dei Plugin o i confini di responsabilità
    - Lavorare sulla pipeline di caricamento dei Plugin o sul registro
    - Implementazione degli hook di runtime dei provider o dei Plugin di canale
sidebarTitle: Internals
summary: 'Interni del Plugin: modello delle capacità, proprietà, contratti, pipeline di caricamento e helper di runtime'
title: Interni del Plugin
x-i18n:
    generated_at: "2026-04-30T09:02:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

Questa è la **reference approfondita dell'architettura** per il sistema di plugin di OpenClaw. Per guide pratiche, inizia da una delle pagine mirate qui sotto.

<CardGroup cols={2}>
  <Card title="Installare e usare i plugin" icon="plug" href="/it/tools/plugin">
    Guida per gli utenti finali per aggiungere, abilitare e risolvere i problemi dei plugin.
  </Card>
  <Card title="Creare plugin" icon="rocket" href="/it/plugins/building-plugins">
    Tutorial per il primo plugin con il manifest funzionante più piccolo.
  </Card>
  <Card title="Plugin di canale" icon="comments" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin di canale di messaggistica.
  </Card>
  <Card title="Plugin provider" icon="microchip" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin provider di modelli.
  </Card>
  <Card title="Panoramica dell'SDK" icon="book" href="/it/plugins/sdk-overview">
    Mappa di importazione e reference dell'API di registrazione.
  </Card>
</CardGroup>

## Modello pubblico delle capability

Le capability sono il modello pubblico di **plugin nativi** dentro OpenClaw. Ogni plugin nativo OpenClaw si registra per uno o più tipi di capability:

| Capability             | Metodo di registrazione                         | Plugin di esempio                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferenza testuale     | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Sintesi vocale         | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                         |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione di musica  | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generazione di video   | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Recupero web           | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Ricerca web            | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canale / messaggistica | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Rilevamento Gateway    | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Un plugin che registra zero capability ma fornisce hook, strumenti, servizi di rilevamento o servizi in background è un plugin **legacy solo hook**. Quel pattern è ancora pienamente supportato.
</Note>

### Posizione sulla compatibilità esterna

Il modello delle capability è presente nel core ed è usato oggi dai plugin in bundle/nativi, ma la compatibilità dei plugin esterni richiede ancora un livello di garanzia più rigoroso di "è esportato, quindi è congelato".

| Situazione del Plugin                         | Indicazioni                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin esterni esistenti                          | Mantieni funzionanti le integrazioni basate su hook; questa è la base di compatibilità.          |
| Nuovi plugin in bundle/nativi                     | Preferisci la registrazione esplicita delle capability rispetto ad accessi specifici del vendor o nuovi design solo hook. |
| Plugin esterni che adottano la registrazione delle capability | Consentito, ma considera le superfici helper specifiche delle capability come in evoluzione, a meno che la documentazione non le indichi come stabili. |

La registrazione delle capability è la direzione prevista. Gli hook legacy rimangono il percorso più sicuro senza rotture per i plugin esterni durante la transizione. I sottopercorsi helper esportati non sono tutti equivalenti: preferisci contratti ristretti e documentati rispetto a esportazioni helper accidentali.

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma in base al suo comportamento effettivo di registrazione, non solo ai metadati statici:

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra esattamente un tipo di capability, ad esempio un plugin solo provider come `mistral`.
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra più tipi di capability, ad esempio `openai` possiede inferenza testuale, sintesi vocale, comprensione dei media e generazione di immagini.
  </Accordion>
  <Accordion title="hook-only">
    Registra solo hook, tipizzati o personalizzati, senza capability, strumenti, comandi o servizi.
  </Accordion>
  <Accordion title="non-capability">
    Registra strumenti, comandi, servizi o route, ma nessuna capability.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e la scomposizione delle capability. Vedi la [reference CLI](/it/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` rimane supportato come percorso di compatibilità per i plugin solo hook. Plugin legacy reali dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo che l'uso reale diminuisce e la copertura delle fixture dimostra la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere una di queste etichette:

| Segnale                   | Significato                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configurazione viene analizzata correttamente e i plugin si risolvono |
| **compatibility advisory** | Il plugin usa un pattern supportato ma più vecchio, ad esempio `hook-only` |
| **legacy warning**         | Il plugin usa `before_agent_start`, che è deprecato          |
| **hard error**             | La configurazione non è valida o il plugin non è stato caricato |

Né `hook-only` né `before_agent_start` interromperanno oggi il tuo plugin: `hook-only` è consultivo e `before_agent_start` attiva solo un avviso. Questi segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

<Steps>
  <Step title="Manifest + rilevamento">
    OpenClaw trova i plugin candidati da percorsi configurati, root del workspace, root globali dei plugin e plugin in bundle. Il rilevamento legge prima i manifest nativi `openclaw.plugin.json` più i manifest bundle supportati.
  </Step>
  <Step title="Abilitazione + validazione">
    Il core decide se un plugin rilevato è abilitato, disabilitato, bloccato o selezionato per uno slot esclusivo, come la memoria.
  </Step>
  <Step title="Caricamento runtime">
    I plugin OpenClaw nativi vengono caricati in-process tramite jiti e registrano capability in un registro centrale. I bundle compatibili vengono normalizzati in record del registro senza importare codice runtime.
  </Step>
  <Step title="Consumo delle superfici">
    Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione dei provider, hook, route HTTP, comandi CLI e servizi.
  </Step>
</Steps>

Per la CLI dei plugin in particolare, il rilevamento dei comandi root è diviso in due fasi:

- i metadati al momento del parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può rimanere lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI posseduto dal plugin dentro il plugin, consentendo comunque a OpenClaw di riservare i nomi dei comandi root prima del parsing.

Il confine di progettazione importante:

- la validazione di manifest/config dovrebbe funzionare da **metadati di manifest/schema** senza eseguire codice del plugin
- il rilevamento delle capability native può caricare codice entry di plugin attendibili per creare uno snapshot del registro non attivante
- il comportamento runtime nativo proviene dal percorso `register(api)` del modulo plugin con `api.registrationMode === "full"`

Questa separazione consente a OpenClaw di validare la configurazione, spiegare plugin mancanti/disabilitati e creare suggerimenti UI/schema prima che il runtime completo sia attivo.

### Snapshot dei metadati dei plugin e tabella di lookup

L'avvio del Gateway crea un `PluginMetadataSnapshot` per lo snapshot di configurazione corrente. Lo snapshot contiene solo metadati: archivia l'indice dei plugin installati, il registro dei manifest, la diagnostica dei manifest, le mappe dei proprietari, un normalizzatore di id plugin e i record dei manifest. Non contiene moduli plugin caricati, SDK provider, contenuti dei pacchetti o export runtime.

La validazione della configurazione consapevole dei plugin, l'autoabilitazione all'avvio e il bootstrap dei plugin del Gateway consumano quello snapshot invece di ricostruire in modo indipendente i metadati di manifest/indice. `PluginLookUpTable` deriva dallo stesso snapshot e aggiunge il piano dei plugin di avvio per la configurazione runtime corrente.

Dopo l'avvio, il Gateway mantiene lo snapshot dei metadati corrente come prodotto runtime sostituibile. Il rilevamento ripetuto dei provider runtime può prendere in prestito quello snapshot invece di ricostruire l'indice installato e il registro dei manifest per ogni passaggio del catalogo provider. Lo snapshot viene cancellato o sostituito allo spegnimento del Gateway, alle modifiche di configurazione/inventario plugin e alle scritture dell'indice installato; i chiamanti ripiegano sul percorso freddo manifest/indice quando non esiste uno snapshot corrente compatibile. I controlli di compatibilità devono includere le root di rilevamento plugin come `plugins.load.paths` e il workspace agente predefinito, perché i plugin del workspace fanno parte dell'ambito dei metadati.

Lo snapshot e la tabella di lookup mantengono le decisioni ripetute di avvio sul percorso veloce:

- proprietà dei canali
- avvio differito dei canali
- id dei plugin di avvio
- proprietà di provider e backend CLI
- proprietà di provider di setup, alias di comandi, provider del catalogo modelli e contratti manifest
- validazione dello schema di configurazione dei plugin e dello schema di configurazione dei canali
- decisioni di autoabilitazione all'avvio

Il confine di sicurezza è la sostituzione dello snapshot, non la mutazione. Ricostruisci lo snapshot quando cambiano configurazione, inventario dei plugin, record di installazione o policy dell'indice persistito. Non trattarlo come un ampio registro globale mutabile e non conservare snapshot storici illimitati. Il caricamento runtime dei plugin rimane separato dagli snapshot dei metadati, così lo stato runtime obsoleto non può essere nascosto dietro una cache di metadati.

La regola della cache è documentata in [Interni dell'architettura dei plugin](/it/plugins/architecture-internals#plugin-cache-boundary): i metadati di manifest e rilevamento sono freschi a meno che un chiamante mantenga uno snapshot, una tabella di lookup o un registro dei manifest esplicito per il flusso corrente. Cache di metadati nascoste e TTL basati sull'orologio non fanno parte del caricamento dei plugin. Solo le cache del loader runtime, dei moduli e degli artefatti di dipendenza possono persistere dopo che codice o artefatti installati sono stati effettivamente caricati.

Alcuni chiamanti del percorso freddo ricostruiscono ancora i registri dei manifest direttamente dall'indice persistito dei plugin installati invece di ricevere una `PluginLookUpTable` del Gateway. Quel percorso ora ricostruisce il registro su richiesta; preferisci passare la tabella di lookup corrente o un registro dei manifest esplicito attraverso i flussi runtime quando un chiamante ne ha già uno.

### Pianificazione dell'attivazione

La pianificazione dell'attivazione fa parte del control plane. I chiamanti possono chiedere quali plugin sono rilevanti per un comando, provider, canale, route, harness agente o capability concreta prima di caricare registri runtime più ampi.

Il planner mantiene compatibile il comportamento attuale del manifest:

- i campi `activation.*` sono suggerimenti espliciti per il planner
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e gli hook rimangono fallback di proprietà del manifest
- l'API del planner solo id rimane disponibile per i chiamanti esistenti
- l'API del piano riporta etichette di motivo, così la diagnostica può distinguere i suggerimenti espliciti dal fallback di proprietà

<Warning>
Non trattare `activation` come un hook del ciclo di vita o come un sostituto di `register(...)`. È metadati usati per restringere il caricamento. Preferisci i campi di proprietà quando descrivono già la relazione; usa `activation` solo per suggerimenti aggiuntivi al planner.
</Warning>

### Plugin di canale e lo strumento di messaggistica condiviso

I Plugin di canale non devono registrare uno strumento separato per inviare/modificare/reagire per le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e i Plugin di canale possiedono la discovery e l'esecuzione specifiche del canale dietro di esso.

Il confine attuale è:

- il core possiede l'host dello strumento `message` condiviso, il collegamento dei prompt, la contabilità di sessione/thread e il dispatch di esecuzione
- i Plugin di canale possiedono la discovery delle azioni con ambito, la discovery delle capacità e qualsiasi frammento di schema specifico del canale
- i Plugin di canale possiedono la grammatica delle conversazioni di sessione specifica del provider, ad esempio come gli id conversazione codificano gli id thread o ereditano dalle conversazioni padre
- i Plugin di canale eseguono l'azione finale tramite il proprio adattatore di azioni

Per i Plugin di canale, la superficie SDK è `ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di discovery unificata consente a un Plugin di restituire insieme le proprie azioni visibili, capacità e contributi allo schema, così questi elementi non divergono.

Quando un parametro dello strumento di messaggistica specifico del canale trasporta una sorgente media, come un percorso locale o un URL media remoto, il Plugin dovrebbe anche restituire `mediaSourceParams` da `describeMessageTool(...)`. Il core usa quell'elenco esplicito per applicare la normalizzazione dei percorsi sandbox e i suggerimenti di accesso ai media in uscita senza codificare nel core i nomi dei parametri posseduti dal Plugin. Preferisci mappe con ambito per azione, non un'unica lista piatta per tutto il canale, così un parametro media solo per profilo non viene normalizzato su azioni non correlate come `send`.

Il core passa l'ambito runtime a questo passaggio di discovery. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` in ingresso attendibile

Questo è importante per i Plugin sensibili al contesto. Un canale può nascondere o esporre azioni di messaggistica in base all'account attivo, alla stanza/thread/messaggio corrente o all'identità attendibile del richiedente, senza codificare diramazioni specifiche del canale nello strumento `message` del core.

Ecco perché le modifiche di instradamento dell'embedded-runner restano comunque lavoro del Plugin: il runner è responsabile di inoltrare l'identità della chat/sessione corrente al confine di discovery del Plugin, così lo strumento `message` condiviso espone la superficie corretta posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i Plugin inclusi dovrebbero mantenere il runtime di esecuzione dentro i propri moduli di estensione. Il core non possiede più i runtime delle azioni di messaggistica di Discord, Slack, Telegram o WhatsApp sotto `src/agents/tools`. Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i Plugin inclusi dovrebbero importare il proprio codice runtime locale direttamente dai moduli posseduti dalla propria estensione.

Lo stesso confine si applica in generale ai seam SDK denominati per provider: il core non dovrebbe importare barrel di comodità specifici del canale per Slack, Discord, Signal, WhatsApp o estensioni simili. Se al core serve un comportamento, deve consumare il barrel `api.ts` / `runtime-api.ts` del Plugin incluso oppure promuovere l'esigenza a una capacità generica e ristretta nell'SDK condiviso.

I Plugin inclusi seguono la stessa regola. Il `runtime-api.ts` di un Plugin incluso non dovrebbe riesportare la propria facade brandizzata `openclaw/plugin-sdk/<plugin-id>`. Queste facade brandizzate restano shim di compatibilità per Plugin esterni e consumer più vecchi, ma i Plugin inclusi dovrebbero usare esportazioni locali più sottopercorsi SDK generici e ristretti come `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` o `openclaw/plugin-sdk/webhook-ingress`. Il nuovo codice non dovrebbe aggiungere facade SDK specifiche per plugin-id, a meno che il confine di compatibilità per un ecosistema esterno esistente lo richieda.

Per i sondaggi in particolare, ci sono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che rientrano nel modello comune di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per semantiche di sondaggio specifiche del canale o parametri aggiuntivi del sondaggio

Il core ora rimanda il parsing condiviso dei sondaggi fino a dopo che il dispatch dei sondaggi del Plugin rifiuta l'azione, così gli handler dei sondaggi posseduti dal Plugin possono accettare campi di sondaggio specifici del canale senza essere prima bloccati dal parser generico dei sondaggi.

Consulta [Interni dell'architettura dei Plugin](/it/plugins/architecture-internals) per la sequenza completa di avvio.

## Modello di proprietà delle capacità

OpenClaw tratta un Plugin nativo come il confine di proprietà per una **azienda** o una **funzionalità**, non come un contenitore generico di integrazioni non correlate.

Questo significa:

- un Plugin aziendale dovrebbe di solito possedere tutte le superfici di quella azienda esposte a OpenClaw
- un Plugin di funzionalità dovrebbe di solito possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità condivise del core invece di reimplementare comportamento del provider ad hoc

<AccordionGroup>
  <Accordion title="Multi-capacità del vendor">
    `openai` possiede inferenza testuale, parlato, voce realtime, comprensione dei media e generazione di immagini. `google` possiede inferenza testuale più comprensione dei media, generazione di immagini e ricerca web. `qwen` possiede inferenza testuale più comprensione dei media e generazione video.
  </Accordion>
  <Accordion title="Capacità singola del vendor">
    `elevenlabs` e `microsoft` possiedono il parlato; `firecrawl` possiede il web-fetch; `minimax` / `mistral` / `moonshot` / `zai` possiedono backend di comprensione dei media.
  </Accordion>
  <Accordion title="Plugin di funzionalità">
    `voice-call` possiede trasporto delle chiamate, strumenti, CLI, route e bridging dei media-stream Twilio, ma consuma capacità condivise di parlato, trascrizione realtime e voce realtime invece di importare direttamente Plugin vendor.
  </Accordion>
</AccordionGroup>

Lo stato finale previsto è:

- OpenAI vive in un solo Plugin anche se copre modelli testuali, parlato, immagini e video futuri
- un altro vendor può fare lo stesso per la propria area di superficie
- ai canali non importa quale Plugin vendor possiede il provider; consumano il contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **Plugin** = confine di proprietà
- **capacità** = contratto core che più Plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è "quale provider dovrebbe codificare direttamente la gestione video?" La prima domanda è "qual è il contratto di capacità video del core?" Una volta che quel contratto esiste, i Plugin vendor possono registrarsi rispetto a esso e i Plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa giusta di solito è:

<Steps>
  <Step title="Definire la capacità">
    Definire la capacità mancante nel core.
  </Step>
  <Step title="Esporre tramite l'SDK">
    Esporla tramite l'API/plugin runtime in modo tipizzato.
  </Step>
  <Step title="Collegare i consumer">
    Collegare canali/funzionalità a quella capacità.
  </Step>
  <Step title="Implementazioni vendor">
    Lasciare che i Plugin vendor registrino le implementazioni.
  </Step>
</Steps>

Questo mantiene esplicita la proprietà evitando al tempo stesso comportamento core che dipende da un singolo vendor o da un percorso di codice specifico di un Plugin una tantum.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove appartiene il codice:

<Tabs>
  <Tab title="Layer di capacità core">
    Orchestrazione condivisa, policy, fallback, regole di merge della configurazione, semantica di delivery e contratti tipizzati.
  </Tab>
  <Tab title="Layer Plugin vendor">
    API specifiche del vendor, autenticazione, cataloghi modelli, sintesi vocale, generazione di immagini, futuri backend video, endpoint di utilizzo.
  </Tab>
  <Tab title="Layer Plugin di canale/funzionalità">
    Integrazione Slack/Discord/voice-call/ecc. che consuma capacità core e le presenta su una superficie.
  </Tab>
</Tabs>

Per esempio, TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e la delivery del canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper runtime TTS di telefonia

Lo stesso pattern dovrebbe essere preferito per capacità future.

### Esempio di Plugin aziendale multi-capacità

Un Plugin aziendale dovrebbe risultare coeso dall'esterno. Se OpenClaw dispone di contratti condivisi per modelli, parlato, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione video, web fetch e ricerca web, un vendor può possedere tutte le proprie superfici in un unico punto:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Ciò che conta non sono i nomi esatti degli helper. Conta la forma:

- un solo Plugin possiede la superficie del vendor
- il core possiede comunque i contratti di capacità
- i canali e i Plugin di funzionalità consumano helper `api.runtime.*`, non codice vendor
- i test di contratto possono verificare che il Plugin abbia registrato le capacità che dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica capacità condivisa. Lo stesso modello di proprietà si applica lì:

<Steps>
  <Step title="Il core definisce il contratto">
    Il core definisce il contratto di comprensione dei media.
  </Step>
  <Step title="I Plugin vendor si registrano">
    I Plugin vendor registrano `describeImage`, `transcribeAudio` e `describeVideo` dove applicabile.
  </Step>
  <Step title="I consumer usano il comportamento condiviso">
    I canali e i Plugin di funzionalità consumano il comportamento core condiviso invece di collegarsi direttamente al codice vendor.
  </Step>
</Steps>

Questo evita di incorporare nel core le assunzioni video di un solo provider. Il Plugin possiede la superficie del vendor; il core possiede il contratto di capacità e il comportamento di fallback.

La generazione video usa già la stessa sequenza: il core possiede il contratto di capacità tipizzato e l'helper runtime, e i Plugin vendor registrano implementazioni `api.registerVideoGenerationProvider(...)` rispetto a esso.

Ti serve una checklist di rollout concreta? Consulta [Capability Cookbook](/it/plugins/architecture).

## Contratti e enforcement

La superficie API dei Plugin è intenzionalmente tipizzata e centralizzata in `OpenClawPluginApi`. Quel contratto definisce i punti di registrazione supportati e gli helper runtime su cui un Plugin può fare affidamento.

Perché è importante:

- gli autori di Plugin ottengono uno standard interno stabile
- il core può rifiutare proprietà duplicate, come due Plugin che registrano lo stesso id provider
- l'avvio può mostrare diagnostica utilizzabile per registrazioni malformate
- i test di contratto possono far rispettare la proprietà dei Plugin inclusi e prevenire derive silenziose

Ci sono due layer di enforcement:

<AccordionGroup>
  <Accordion title="Applicazione della registrazione runtime">
    Il registro dei plugin convalida le registrazioni durante il caricamento dei plugin. Esempi: ID provider duplicati, ID provider vocali duplicati e registrazioni malformate producono diagnostica dei plugin invece di comportamento indefinito.
  </Accordion>
  <Accordion title="Test di contratto">
    I plugin inclusi vengono acquisiti nei registri di contratto durante le esecuzioni dei test, così OpenClaw può affermare esplicitamente la proprietà. Oggi questo viene usato per provider di modelli, provider vocali, provider di ricerca web e proprietà delle registrazioni incluse.
  </Accordion>
</AccordionGroup>

L'effetto pratico è che OpenClaw sa in anticipo quale plugin possiede quale superficie. Questo consente a core e canali di comporsi senza interruzioni, perché la proprietà è dichiarata, tipizzata e testabile invece che implicita.

### Cosa appartiene a un contratto

<Tabs>
  <Tab title="Contratti validi">
    - tipizzati
    - piccoli
    - specifici per capability
    - di proprietà del core
    - riutilizzabili da più plugin
    - consumabili da canali/funzionalità senza conoscenza del vendor

  </Tab>
  <Tab title="Contratti non validi">
    - policy specifica del vendor nascosta nel core
    - vie di fuga una tantum per plugin che aggirano il registro
    - codice del canale che accede direttamente a un'implementazione del vendor
    - oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o `api.runtime`

  </Tab>
</Tabs>

In caso di dubbio, aumenta il livello di astrazione: definisci prima la capability, poi lascia che i plugin vi si integrino.

## Modello di esecuzione

I plugin nativi di OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono in sandbox. Un plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del codice core.

<Warning>
Implicazioni dei plugin nativi: un plugin può registrare strumenti, gestori di rete, hook e servizi; un bug di un plugin può causare il crash o destabilizzare il gateway; e un plugin nativo malevolo equivale all'esecuzione di codice arbitrario all'interno del processo OpenClaw.
</Warning>

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw al momento li tratta come pacchetti di metadati/contenuti. Nelle release attuali, questo significa principalmente skill incluse.

Usa allowlist e percorsi espliciti di installazione/caricamento per plugin non inclusi. Tratta i plugin dell'area di lavoro come codice per il tempo di sviluppo, non come impostazioni predefinite di produzione.

Per i nomi dei pacchetti workspace inclusi, mantieni l'ID del plugin ancorato al nome npm: `@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando il pacchetto espone intenzionalmente un ruolo di plugin più ristretto.

<Note>
**Nota sulla fiducia:** `plugins.allow` considera affidabili gli **ID dei plugin**, non la provenienza del sorgente. Un plugin workspace con lo stesso ID di un plugin incluso oscura intenzionalmente la copia inclusa quando quel plugin workspace è abilitato/inserito in allowlist. Questo è normale e utile per sviluppo locale, test di patch e hotfix. La fiducia nei plugin inclusi viene risolta dallo snapshot del sorgente, ovvero il manifest e il codice su disco al momento del caricamento, invece che dai metadati di installazione. Un record di installazione corrotto o sostituito non può ampliare silenziosamente la superficie di fiducia di un plugin incluso oltre ciò che il sorgente effettivo dichiara.
</Note>

## Confine di esportazione

OpenClaw esporta capability, non convenienza implementativa.

Mantieni pubblica la registrazione delle capability. Riduci le esportazioni di helper non contrattuali:

- sottopercorsi helper specifici dei plugin inclusi
- sottopercorsi di plumbing runtime non destinati a essere API pubbliche
- helper di convenienza specifici del vendor
- helper di configurazione/onboarding che sono dettagli implementativi

I sottopercorsi helper riservati dei plugin inclusi sono stati ritirati dalla mappa di esportazione SDK generata. Mantieni gli helper specifici del proprietario all'interno del pacchetto del plugin proprietario; promuovi solo il comportamento host riutilizzabile a contratti SDK generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

## Interni e riferimento

Per la pipeline di caricamento, il modello di registro, gli hook runtime dei provider, le route HTTP del Gateway, gli schemi degli strumenti di messaggistica, la risoluzione delle destinazioni dei canali, i cataloghi dei provider, i plugin del motore di contesto e la guida all'aggiunta di una nuova capability, consulta [Interni dell'architettura dei plugin](/it/plugins/architecture-internals).

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins)
- [Manifest del plugin](/it/plugins/manifest)
- [Configurazione dell'SDK del plugin](/it/plugins/sdk-setup)
