---
read_when:
    - Creazione o debug di Plugin nativi OpenClaw
    - Comprendere il modello di capacità dei Plugin o i confini di ownership
    - Lavorare sulla pipeline di caricamento dei Plugin o sul registro
    - Implementazione degli hook di runtime dei provider o dei Plugin di canale
sidebarTitle: Internals
summary: 'Interni dei Plugin: modello di capability, proprietà, contratti, pipeline di caricamento e helper runtime'
title: Internals dei Plugin
x-i18n:
    generated_at: "2026-06-27T17:46:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

Questo è il **riferimento approfondito all'architettura** del sistema di plugin di OpenClaw. Per guide pratiche, inizia con una delle pagine mirate qui sotto.

<CardGroup cols={2}>
  <Card title="Installare e usare i plugin" icon="plug" href="/it/tools/plugin">
    Guida per utenti finali all'aggiunta, all'abilitazione e alla risoluzione dei problemi dei plugin.
  </Card>
  <Card title="Creare plugin" icon="rocket" href="/it/plugins/building-plugins">
    Tutorial per il primo plugin con il manifest funzionante più piccolo.
  </Card>
  <Card title="Plugin di canale" icon="comments" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin per canale di messaggistica.
  </Card>
  <Card title="Plugin di provider" icon="microchip" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin per provider di modelli.
  </Card>
  <Card title="Panoramica dell'SDK" icon="book" href="/it/plugins/sdk-overview">
    Riferimento per la mappa degli import e l'API di registrazione.
  </Card>
</CardGroup>

## Modello pubblico delle capacità

Le capacità sono il modello pubblico di **plugin nativi** dentro OpenClaw. Ogni plugin OpenClaw nativo si registra per uno o più tipi di capacità:

| Capacità                | Metodo di registrazione                         | Plugin di esempio                    |
| ----------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferenza testuale      | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Embeddings              | `api.registerEmbeddingProvider(...)`            | Plugin vettoriali di proprietà del provider |
| Voce                    | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voce in tempo reale     | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Comprensione dei media  | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Origine delle trascrizioni | `api.registerTranscriptSourceProvider(...)`   | `discord`                            |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale    | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generazione video       | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Recupero web            | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Ricerca web             | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canale / messaggistica  | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |
| Rilevamento del Gateway | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                            |

<Note>
Un plugin che registra zero capacità ma fornisce hook, strumenti, servizi di rilevamento o servizi in background è un plugin **legacy solo hook**. Questo schema è ancora pienamente supportato.
</Note>

### Posizione sulla compatibilità esterna

Il modello delle capacità è stato integrato nel core ed è usato oggi dai plugin inclusi/nativi, ma la compatibilità dei plugin esterni richiede ancora una soglia più rigorosa di "è esportato, quindi è congelato".

| Situazione del plugin                           | Indicazioni                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Plugin esterni esistenti                        | Mantieni funzionanti le integrazioni basate su hook; questa è la base di compatibilità.           |
| Nuovi plugin inclusi/nativi                     | Preferisci la registrazione esplicita delle capacità rispetto ad accessi specifici per vendor o a nuovi design solo hook. |
| Plugin esterni che adottano la registrazione delle capacità | Consentito, ma considera le superfici helper specifiche per capacità come in evoluzione, salvo quando la documentazione le segna come stabili. |

La registrazione delle capacità è la direzione prevista. Gli hook legacy restano il percorso più sicuro senza rotture per i plugin esterni durante la transizione. I sottopercorsi helper esportati non sono tutti equivalenti: preferisci contratti ristretti e documentati rispetto a esportazioni helper incidentali.

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma basata sul suo comportamento effettivo di registrazione (non solo sui metadati statici):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra esattamente un tipo di capacità (per esempio un plugin solo provider come `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra più tipi di capacità (per esempio `openai` possiede inferenza testuale, voce, comprensione dei media e generazione di immagini).
  </Accordion>
  <Accordion title="hook-only">
    Registra solo hook (tipizzati o personalizzati), nessuna capacità, strumento, comando o servizio.
  </Accordion>
  <Accordion title="non-capability">
    Registra strumenti, comandi, servizi o route, ma nessuna capacità.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e il dettaglio delle sue capacità. Vedi il [riferimento CLI](/it/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per i plugin solo hook. Plugin legacy reali dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo il calo dell'uso reale e quando la copertura delle fixture dimostra la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere una di queste etichette:

| Segnale                    | Significato                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configurazione viene analizzata correttamente e i plugin si risolvono |
| **compatibility advisory** | Il plugin usa uno schema supportato ma più vecchio (ad es. `hook-only`) |
| **legacy warning**         | Il plugin usa `before_agent_start`, che è deprecato          |
| **hard error**             | La configurazione non è valida o il plugin non è stato caricato |

Né `hook-only` né `before_agent_start` interromperanno oggi il tuo plugin: `hook-only` è consultivo e `before_agent_start` attiva solo un avviso. Questi segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

<Steps>
  <Step title="Manifest + rilevamento">
    OpenClaw trova plugin candidati da percorsi configurati, radici del workspace, radici globali dei plugin e plugin inclusi. Il rilevamento legge prima i manifest nativi `openclaw.plugin.json` più i manifest dei bundle supportati.
  </Step>
  <Step title="Abilitazione + validazione">
    Il core decide se un plugin rilevato è abilitato, disabilitato, bloccato o selezionato per uno slot esclusivo come la memoria.
  </Step>
  <Step title="Caricamento a runtime">
    I plugin OpenClaw nativi vengono caricati nello stesso processo e registrano capacità in un registro centrale. Il JavaScript pacchettizzato viene caricato tramite `require` nativo; il TypeScript di sorgenti locali di terze parti è il fallback di emergenza Jiti. I bundle compatibili vengono normalizzati in record di registro senza importare codice runtime.
  </Step>
  <Step title="Consumo delle superfici">
    Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione dei provider, hook, route HTTP, comandi CLI e servizi.
  </Step>
</Steps>

Per la CLI dei plugin nello specifico, il rilevamento dei comandi radice è diviso in due fasi:

- i metadati al momento del parsing vengono da `registerCli(..., { descriptors: [...] })`
- il modulo CLI reale del plugin può restare lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI di proprietà del plugin dentro il plugin, consentendo comunque a OpenClaw di riservare i nomi dei comandi radice prima del parsing.

Il confine di progettazione importante:

- la validazione di manifest/configurazione deve funzionare da **metadati di manifest/schema** senza eseguire codice del plugin
- il rilevamento delle capacità native può caricare codice di entry del plugin attendibile per costruire uno snapshot del registro non attivante
- il comportamento runtime nativo viene dal percorso `register(api)` del modulo del plugin con `api.registrationMode === "full"`

Questa separazione consente a OpenClaw di validare la configurazione, spiegare plugin mancanti/disabilitati e costruire suggerimenti UI/schema prima che il runtime completo sia attivo.

### Snapshot dei metadati del plugin e tabella di lookup

L'avvio del Gateway costruisce un `PluginMetadataSnapshot` per lo snapshot di configurazione corrente. Lo snapshot contiene solo metadati: archivia l'indice dei plugin installati, il registro dei manifest, la diagnostica dei manifest, le mappe dei proprietari, un normalizzatore degli id dei plugin e i record dei manifest. Non contiene moduli di plugin caricati, SDK dei provider, contenuti dei pacchetti o esportazioni runtime.

La validazione della configurazione consapevole dei plugin, l'abilitazione automatica all'avvio e il bootstrap dei plugin del Gateway consumano quello snapshot invece di ricostruire indipendentemente i metadati di manifest/indice. `PluginLookUpTable` deriva dallo stesso snapshot e aggiunge il piano dei plugin di avvio per la configurazione runtime corrente.

Dopo l'avvio, Gateway mantiene lo snapshot dei metadati corrente come prodotto runtime sostituibile. Il rilevamento ripetuto dei provider a runtime può prendere in prestito quello snapshot invece di ricostruire l'indice installato e il registro dei manifest per ogni passaggio del catalogo dei provider. Lo snapshot viene svuotato o sostituito allo spegnimento del Gateway, alle modifiche della configurazione/inventario plugin e alle scritture dell'indice installato; i chiamanti ripiegano sul percorso freddo di manifest/indice quando non esiste uno snapshot corrente compatibile. I controlli di compatibilità devono includere le radici di rilevamento dei plugin come `plugins.load.paths` e il workspace predefinito dell'agente, perché i plugin del workspace fanno parte dell'ambito dei metadati.

Lo snapshot e la tabella di lookup mantengono le decisioni ripetute di avvio sul percorso veloce:

- proprietà dei canali
- avvio differito dei canali
- id dei plugin di avvio
- proprietà di provider e backend CLI
- proprietà di provider di configurazione, alias di comando, provider del catalogo modelli e contratto di manifest
- validazione dello schema di configurazione del plugin e dello schema di configurazione del canale
- decisioni di abilitazione automatica all'avvio

Il confine di sicurezza è la sostituzione dello snapshot, non la mutazione. Ricostruisci lo snapshot quando cambiano configurazione, inventario dei plugin, record di installazione o policy dell'indice persistito. Non trattarlo come un ampio registro globale mutabile e non conservare snapshot storici illimitati. Il caricamento runtime dei plugin resta separato dagli snapshot dei metadati, così lo stato runtime obsoleto non può essere nascosto dietro una cache dei metadati.

La regola della cache è documentata in [Internals dell'architettura dei plugin](/it/plugins/architecture-internals#plugin-cache-boundary): i metadati di manifest e rilevamento sono aggiornati salvo che un chiamante detenga uno snapshot esplicito, una tabella di lookup o un registro dei manifest per il flusso corrente. Cache di metadati nascoste e TTL basati sull'orologio non fanno parte del caricamento dei plugin. Solo le cache runtime di loader, moduli e artefatti di dipendenza possono persistere dopo che il codice o gli artefatti installati sono stati effettivamente caricati.

Alcuni chiamanti su percorso freddo ricostruiscono ancora direttamente i registri dei manifest dall'indice persistito dei plugin installati invece di ricevere una `PluginLookUpTable` del Gateway. Quel percorso ora ricostruisce il registro su richiesta; preferisci passare la tabella di lookup corrente o un registro dei manifest esplicito attraverso i flussi runtime quando un chiamante ne ha già uno.

### Pianificazione dell'attivazione

La pianificazione dell'attivazione fa parte del control plane. I chiamanti possono chiedere quali plugin sono rilevanti per un comando, provider, canale, route, harness agente o capacità concreti prima di caricare registri runtime più ampi.

Il planner mantiene compatibile il comportamento corrente dei manifest:

- i campi `activation.*` sono suggerimenti espliciti per il planner
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e gli hook restano il fallback di titolarità del manifesto
- l'API del planner solo-id resta disponibile per i chiamanti esistenti
- l'API del piano riporta etichette di motivo, così la diagnostica può distinguere i suggerimenti espliciti dal fallback di titolarità

<Warning>
Non trattare `activation` come un hook del ciclo di vita o come un sostituto di `register(...)`. È metadato usato per restringere il caricamento. Preferisci i campi di titolarità quando descrivono già la relazione; usa `activation` solo per suggerimenti aggiuntivi al planner.
</Warning>

### Plugin di canale e lo strumento di messaggio condiviso

I plugin di canale non devono registrare uno strumento separato per inviare/modificare/reagire per le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e i plugin di canale possiedono la scoperta e l'esecuzione specifiche del canale dietro di esso.

Il confine attuale è:

- il core possiede l'host dello strumento `message` condiviso, il cablaggio del prompt, la contabilità di sessioni/thread e il dispatch dell'esecuzione
- i plugin di canale possiedono la scoperta delle azioni con ambito, la scoperta delle capacità e tutti i frammenti di schema specifici del canale
- i plugin di canale possiedono la grammatica di conversazione della sessione specifica del provider, per esempio il modo in cui gli id di conversazione codificano gli id dei thread o ereditano dalle conversazioni padre
- i plugin di canale eseguono l'azione finale tramite il proprio adattatore di azione

Per i plugin di canale, la superficie SDK è `ChannelMessageActionAdapter.describeMessageTool(...)`. Quella chiamata di scoperta unificata consente a un plugin di restituire insieme le sue azioni visibili, le capacità e i contributi di schema, così questi elementi non divergono.

Quando un parametro dello strumento di messaggio specifico del canale trasporta una sorgente multimediale, come un percorso locale o un URL multimediale remoto, il plugin dovrebbe restituire anche `mediaSourceParams` da `describeMessageTool(...)`. Il core usa quell'elenco esplicito per applicare la normalizzazione dei percorsi sandbox e i suggerimenti di accesso ai media in uscita senza codificare rigidamente i nomi dei parametri posseduti dal plugin. Lì preferisci mappe con ambito di azione, non un unico elenco piatto per tutto il canale, così un parametro multimediale solo profilo non viene normalizzato su azioni non correlate come `send`.

Il core passa l'ambito di runtime in quel passaggio di scoperta. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` in ingresso attendibile

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre azioni di messaggio in base all'account attivo, alla stanza/thread/messaggio corrente o all'identità attendibile del richiedente senza codificare rigidamente rami specifici del canale nello strumento `message` del core.

Ecco perché le modifiche di routing dell'embedded-runner restano comunque lavoro del plugin: il runner è responsabile di inoltrare l'identità corrente di chat/sessione nel confine di scoperta del plugin, così lo strumento `message` condiviso espone la superficie giusta posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i plugin in bundle dovrebbero mantenere il runtime di esecuzione dentro i propri moduli di estensione. Il core non possiede più i runtime delle azioni di messaggio Discord, Slack, Telegram o WhatsApp sotto `src/agents/tools`. Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i plugin in bundle dovrebbero importare il proprio codice runtime locale direttamente dai moduli posseduti dalla loro estensione.

Lo stesso confine si applica in generale alle giunture SDK denominate per provider: il core non dovrebbe importare barrel di utilità specifici del canale per Slack, Discord, Signal, WhatsApp o estensioni simili. Se al core serve un comportamento, deve consumare il barrel `api.ts` / `runtime-api.ts` del plugin in bundle stesso oppure promuovere la necessità a una capacità generica ristretta nell'SDK condiviso.

I plugin in bundle seguono la stessa regola. Il `runtime-api.ts` di un plugin in bundle non dovrebbe riesportare la propria facade brandizzata `openclaw/plugin-sdk/<plugin-id>`. Quelle facade brandizzate restano shim di compatibilità per plugin esterni e consumatori più vecchi, ma i plugin in bundle dovrebbero usare esportazioni locali più sottopercorsi SDK generici e ristretti come `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` o `openclaw/plugin-sdk/webhook-ingress`. Il nuovo codice non dovrebbe aggiungere facade SDK specifiche per id di plugin a meno che il confine di compatibilità per un ecosistema esterno esistente lo richieda.

Per i sondaggi nello specifico, ci sono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che rientrano nel modello comune di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per semantiche di sondaggio specifiche del canale o parametri extra del sondaggio

Il core ora rinvia il parsing condiviso dei sondaggi finché il dispatch del sondaggio del plugin non rifiuta l'azione, così gli handler di sondaggio posseduti dal plugin possono accettare campi di sondaggio specifici del canale senza essere prima bloccati dal parser generico dei sondaggi.

Vedi [Interni dell'architettura dei plugin](/it/plugins/architecture-internals) per la sequenza completa di avvio.

## Modello di titolarità delle capacità

OpenClaw tratta un plugin nativo come il confine di titolarità per una **azienda** o una **funzionalità**, non come un contenitore eterogeneo di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe di solito possedere tutte le superfici rivolte a OpenClaw di quell'azienda
- un plugin di funzionalità dovrebbe di solito possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità core condivise invece di reimplementare comportamento del provider ad hoc

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` possiede inferenza testuale, voce, voce realtime, comprensione dei media e generazione di immagini. `google` possiede inferenza testuale più comprensione dei media, generazione di immagini e ricerca web. `qwen` possiede inferenza testuale più comprensione dei media e generazione video.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` e `microsoft` possiedono la voce; `firecrawl` possiede il web-fetch; `minimax` / `mistral` / `moonshot` / `zai` possiedono backend di comprensione dei media.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` possiede trasporto delle chiamate, strumenti, CLI, route e bridging dei media stream Twilio, ma consuma capacità condivise di voce, trascrizione realtime e voce realtime invece di importare direttamente plugin vendor.
  </Accordion>
</AccordionGroup>

Lo stato finale previsto è:

- OpenAI vive in un solo plugin anche se copre modelli testuali, voce, immagini e video futuri
- un altro vendor può fare lo stesso per la propria area di superficie
- ai canali non importa quale plugin vendor possiede il provider; consumano il contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di titolarità
- **capacità** = contratto core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è "quale provider dovrebbe codificare rigidamente la gestione video?" La prima domanda è "qual è il contratto della capacità video del core?" Una volta che quel contratto esiste, i plugin vendor possono registrarsi su di esso e i plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa giusta di solito è:

<Steps>
  <Step title="Define the capability">
    Definire la capacità mancante nel core.
  </Step>
  <Step title="Expose through the SDK">
    Esporla tramite l'API/runtime del plugin in modo tipizzato.
  </Step>
  <Step title="Wire consumers">
    Collegare canali/funzionalità a quella capacità.
  </Step>
  <Step title="Vendor implementations">
    Lasciare che i plugin vendor registrino implementazioni.
  </Step>
</Steps>

Questo mantiene esplicita la titolarità evitando al tempo stesso comportamento del core che dipende da un singolo vendor o da un percorso di codice specifico di un plugin una tantum.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove appartiene il codice:

<Tabs>
  <Tab title="Core capability layer">
    Orchestrazione condivisa, policy, fallback, regole di merge della configurazione, semantiche di consegna e contratti tipizzati.
  </Tab>
  <Tab title="Vendor plugin layer">
    API specifiche del vendor, autenticazione, cataloghi di modelli, sintesi vocale, generazione di immagini, backend video futuri, endpoint di utilizzo.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Integrazione Slack/Discord/voice-call/ecc. che consuma capacità core e le presenta su una superficie.
  </Tab>
</Tabs>

Per esempio, TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e la consegna al canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper runtime TTS per telefonia

Lo stesso schema dovrebbe essere preferito per capacità future.

### Esempio di plugin aziendale multi-capacità

Un plugin aziendale dovrebbe risultare coeso dall'esterno. Se OpenClaw ha contratti condivisi per modelli, voce, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione video, fetch web e ricerca web, un vendor può possedere tutte le sue superfici in un solo posto:

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

- un plugin possiede la superficie del vendor
- il core possiede comunque i contratti delle capacità
- i canali e i plugin di funzionalità consumano helper `api.runtime.*`, non codice vendor
- i test di contratto possono verificare che il plugin abbia registrato le capacità che dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica capacità condivisa. Lo stesso modello di titolarità si applica lì:

<Steps>
  <Step title="Core defines the contract">
    Il core definisce il contratto di comprensione dei media.
  </Step>
  <Step title="Vendor plugins register">
    I plugin vendor registrano `describeImage`, `transcribeAudio` e `describeVideo` quando applicabile.
  </Step>
  <Step title="Consumers use the shared behavior">
    I canali e i plugin di funzionalità consumano il comportamento core condiviso invece di collegarsi direttamente al codice vendor.
  </Step>
</Steps>

Questo evita di incorporare nel core le assunzioni video di un singolo provider. Il plugin possiede la superficie del vendor; il core possiede il contratto di capacità e il comportamento di fallback.

La generazione video usa già la stessa sequenza: il core possiede il contratto di capacità tipizzato e l'helper runtime, e i plugin vendor registrano implementazioni `api.registerVideoGenerationProvider(...)` su di esso.

Serve una checklist concreta di rollout? Vedi [Ricettario delle capacità](/it/plugins/adding-capabilities).

## Contratti e applicazione

La superficie dell'API del plugin è intenzionalmente tipizzata e centralizzata in `OpenClawPluginApi`. Quel contratto definisce i punti di registrazione supportati e gli helper runtime su cui un plugin può fare affidamento.

Perché è importante:

- gli autori di plugin ottengono uno standard interno stabile
- il core può rifiutare titolarità duplicate, come due plugin che registrano lo stesso id provider
- l'avvio può mostrare diagnostica azionabile per registrazioni malformate
- i test di contratto possono applicare la titolarità dei plugin in bundle e prevenire derive silenziose

Ci sono due livelli di applicazione:

<AccordionGroup>
  <Accordion title="Applicazione della registrazione runtime">
    Il registro dei Plugin convalida le registrazioni durante il caricamento dei Plugin. Esempi: ID provider duplicati, ID provider vocali duplicati e registrazioni non valide producono diagnostica dei Plugin invece di comportamento indefinito.
  </Accordion>
  <Accordion title="Test di contratto">
    I Plugin inclusi vengono acquisiti nei registri di contratto durante le esecuzioni dei test, così OpenClaw può dichiarare esplicitamente la proprietà. Oggi questo viene usato per provider di modelli, provider vocali, provider di ricerca web e proprietà delle registrazioni incluse.
  </Accordion>
</AccordionGroup>

L'effetto pratico è che OpenClaw sa, in anticipo, quale Plugin possiede quale superficie. Questo consente a core e canali di comporsi senza attriti, perché la proprietà è dichiarata, tipizzata e testabile anziché implicita.

### Cosa appartiene a un contratto

<Tabs>
  <Tab title="Contratti validi">
    - tipizzati
    - piccoli
    - specifici della capacità
    - di proprietà del core
    - riutilizzabili da più Plugin
    - consumabili da canali/funzionalità senza conoscenza del fornitore

  </Tab>
  <Tab title="Contratti non validi">
    - policy specifica del fornitore nascosta nel core
    - vie di fuga una tantum per Plugin che aggirano il registro
    - codice di canale che accede direttamente a un'implementazione del fornitore
    - oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o `api.runtime`

  </Tab>
</Tabs>

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi lascia che i Plugin si colleghino a essa.

## Modello di esecuzione

I Plugin nativi di OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono in sandbox. Un Plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del codice core.

<Warning>
Implicazioni dei Plugin nativi: un Plugin può registrare strumenti, gestori di rete, hook e servizi; un bug di un Plugin può mandare in crash o destabilizzare il gateway; e un Plugin nativo malevolo equivale all'esecuzione di codice arbitrario all'interno del processo OpenClaw.
</Warning>

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta come pacchetti di metadati/contenuti. Nelle versioni attuali, questo significa principalmente Skills inclusi.

Usa allowlist e percorsi espliciti di installazione/caricamento per i Plugin non inclusi. Tratta i Plugin dell'area di lavoro come codice per il tempo di sviluppo, non come impostazioni predefinite di produzione.

Per i nomi dei pacchetti dell'area di lavoro inclusi, mantieni l'ID del Plugin ancorato al nome npm: `@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando il pacchetto espone intenzionalmente un ruolo di Plugin più ristretto.

<Note>
**Nota di fiducia:** `plugins.allow` considera attendibili gli **ID dei Plugin**, non la provenienza della sorgente. Un Plugin dell'area di lavoro con lo stesso ID di un Plugin incluso oscura intenzionalmente la copia inclusa quando quel Plugin dell'area di lavoro è abilitato/in allowlist. Questo è normale e utile per lo sviluppo locale, i test di patch e gli hotfix. La fiducia nei Plugin inclusi viene risolta dallo snapshot sorgente — il manifesto e il codice su disco al momento del caricamento — anziché dai metadati di installazione. Un record di installazione corrotto o sostituito non può ampliare silenziosamente la superficie di fiducia di un Plugin incluso oltre quanto dichiarato dalla sorgente effettiva.
</Note>

## Confine di esportazione

OpenClaw esporta capacità, non comodità implementative.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni di helper non contrattuali:

- sottopercorsi helper specifici dei Plugin inclusi
- sottopercorsi di plumbing runtime non destinati a essere API pubblica
- helper di comodità specifici del fornitore
- helper di configurazione/onboarding che sono dettagli implementativi

I sottopercorsi helper riservati ai Plugin inclusi sono stati rimossi dalla mappa di esportazione SDK generata. Mantieni gli helper specifici del proprietario all'interno del pacchetto Plugin proprietario; promuovi solo il comportamento host riutilizzabile a contratti SDK generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

## Interni e riferimento

Per la pipeline di caricamento, il modello di registro, gli hook runtime dei provider, le route HTTP del Gateway, gli schemi degli strumenti di messaggistica, la risoluzione dei target dei canali, i cataloghi dei provider, i Plugin del motore di contesto e la guida per aggiungere una nuova capacità, vedi [Interni dell'architettura dei Plugin](/it/plugins/architecture-internals).

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Manifesto del Plugin](/it/plugins/manifest)
- [Configurazione SDK dei Plugin](/it/plugins/sdk-setup)
