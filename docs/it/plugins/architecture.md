---
read_when:
    - Compilazione o debug dei Plugin OpenClaw nativi
    - Comprendere il modello di capacità dei Plugin o i confini di proprietà
    - Lavorare sulla pipeline di caricamento del Plugin o sul registro
    - Implementazione degli hook di runtime dei provider o dei Plugin di canale
sidebarTitle: Internals
summary: 'Aspetti interni del Plugin: modello di capacità, proprietà, contratti, pipeline di caricamento e helper di runtime'
title: Interni del Plugin
x-i18n:
    generated_at: "2026-05-02T08:28:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

Questo è il **riferimento approfondito dell'architettura** per il sistema di plugin di OpenClaw. Per guide pratiche, inizia da una delle pagine mirate qui sotto.

<CardGroup cols={2}>
  <Card title="Installare e usare i plugin" icon="plug" href="/it/tools/plugin">
    Guida per gli utenti finali su aggiunta, abilitazione e risoluzione dei problemi dei plugin.
  </Card>
  <Card title="Creare plugin" icon="rocket" href="/it/plugins/building-plugins">
    Tutorial per il primo plugin con il manifesto funzionante più piccolo.
  </Card>
  <Card title="Plugin di canale" icon="comments" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin per canale di messaggistica.
  </Card>
  <Card title="Plugin provider" icon="microchip" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin provider di modelli.
  </Card>
  <Card title="Panoramica dell'SDK" icon="book" href="/it/plugins/sdk-overview">
    Riferimento alla mappa di importazione e all'API di registrazione.
  </Card>
</CardGroup>

## Modello pubblico delle capability

Le capability sono il modello pubblico di **plugin nativo** dentro OpenClaw. Ogni plugin nativo di OpenClaw si registra per uno o più tipi di capability:

| Capability             | Metodo di registrazione                         | Plugin di esempio                   |
| ---------------------- | ----------------------------------------------- | ----------------------------------- |
| Inferenza testuale     | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                 | `openai`, `anthropic`               |
| Voce                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale   | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Generazione video      | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Recupero Web           | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Ricerca Web            | `api.registerWebSearchProvider(...)`            | `google`                            |
| Canale / messaggistica | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |
| Rilevamento Gateway    | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                           |

<Note>
Un plugin che registra zero capability ma fornisce hook, strumenti, servizi di rilevamento o servizi in background è un plugin **legacy solo hook**. Questo modello è ancora pienamente supportato.
</Note>

### Posizione sulla compatibilità esterna

Il modello delle capability è integrato nel core ed è usato oggi dai plugin in bundle/nativi, ma la compatibilità dei plugin esterni richiede ancora una soglia più rigorosa di "è esportato, quindi è congelato".

| Situazione del plugin                            | Indicazioni                                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Plugin esterni esistenti                         | Mantieni funzionanti le integrazioni basate su hook; questa è la base di compatibilità.         |
| Nuovi plugin in bundle/nativi                    | Preferisci la registrazione esplicita delle capability rispetto ad accessi specifici del fornitore o nuovi design solo hook. |
| Plugin esterni che adottano la registrazione delle capability | Consentito, ma considera le superfici helper specifiche delle capability come in evoluzione, a meno che la documentazione non le marchi come stabili. |

La registrazione delle capability è la direzione prevista. Gli hook legacy restano il percorso più sicuro senza rotture per i plugin esterni durante la transizione. I sottopercorsi helper esportati non sono tutti equivalenti: preferisci contratti stretti e documentati rispetto a esportazioni helper incidentali.

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma basata sul suo effettivo comportamento di registrazione (non solo sui metadati statici):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra esattamente un tipo di capability (per esempio un plugin solo provider come `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra più tipi di capability (per esempio `openai` possiede inferenza testuale, voce, comprensione dei media e generazione di immagini).
  </Accordion>
  <Accordion title="hook-only">
    Registra solo hook (tipizzati o personalizzati), senza capability, strumenti, comandi o servizi.
  </Accordion>
  <Accordion title="non-capability">
    Registra strumenti, comandi, servizi o route, ma nessuna capability.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e la ripartizione delle sue capability. Vedi il [riferimento CLI](/it/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per i plugin solo hook. I plugin legacy reali dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo il calo dell'uso reale e dopo che la copertura delle fixture dimostra la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere una di queste etichette:

| Segnale                    | Significato                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configurazione viene analizzata correttamente e i plugin si risolvono |
| **compatibility advisory** | Il plugin usa un modello supportato ma più vecchio (ad es. `hook-only`) |
| **legacy warning**         | Il plugin usa `before_agent_start`, che è deprecato          |
| **hard error**             | La configurazione non è valida o il caricamento del plugin non è riuscito |

Né `hook-only` né `before_agent_start` interromperanno oggi il tuo plugin: `hook-only` è un avviso, e `before_agent_start` attiva solo un warning. Questi segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

<Steps>
  <Step title="Manifesto + rilevamento">
    OpenClaw trova plugin candidati da percorsi configurati, radici del workspace, radici globali dei plugin e plugin in bundle. Il rilevamento legge prima i manifesti nativi `openclaw.plugin.json` più i manifesti di bundle supportati.
  </Step>
  <Step title="Abilitazione + validazione">
    Il core decide se un plugin rilevato è abilitato, disabilitato, bloccato o selezionato per uno slot esclusivo come la memoria.
  </Step>
  <Step title="Caricamento runtime">
    I plugin nativi di OpenClaw vengono caricati in-process e registrano capability in un registro centrale. Il JavaScript pacchettizzato viene caricato tramite `require` nativo; il sorgente TypeScript locale di terze parti è il fallback di emergenza Jiti. I bundle compatibili vengono normalizzati in record di registro senza importare codice runtime.
  </Step>
  <Step title="Consumo delle superfici">
    Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione provider, hook, route HTTP, comandi CLI e servizi.
  </Step>
</Steps>

Per la CLI dei plugin in particolare, il rilevamento dei comandi root è diviso in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può restare lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI di proprietà del plugin dentro il plugin, pur consentendo a OpenClaw di riservare i nomi dei comandi root prima del parsing.

Il confine di design importante:

- la validazione di manifesto/configurazione dovrebbe funzionare da **metadati di manifesto/schema** senza eseguire codice del plugin
- il rilevamento delle capability native può caricare codice di ingresso di plugin attendibili per costruire uno snapshot del registro non attivante
- il comportamento runtime nativo proviene dal percorso `register(api)` del modulo del plugin con `api.registrationMode === "full"`

Questa separazione consente a OpenClaw di validare la configurazione, spiegare plugin mancanti/disabilitati e creare suggerimenti UI/schema prima che il runtime completo sia attivo.

### Snapshot dei metadati dei plugin e tabella di lookup

L'avvio del Gateway crea un `PluginMetadataSnapshot` per lo snapshot di configurazione corrente. Lo snapshot contiene solo metadati: archivia l'indice dei plugin installati, il registro dei manifesti, la diagnostica dei manifesti, le mappe dei proprietari, un normalizzatore degli ID dei plugin e i record dei manifesti. Non conserva moduli plugin caricati, SDK provider, contenuti dei pacchetti o export runtime.

La validazione della configurazione consapevole dei plugin, l'abilitazione automatica all'avvio e il bootstrap dei plugin del Gateway consumano quello snapshot invece di ricostruire indipendentemente metadati di manifesto/indice. `PluginLookUpTable` deriva dallo stesso snapshot e aggiunge il piano dei plugin di avvio per la configurazione runtime corrente.

Dopo l'avvio, il Gateway mantiene lo snapshot dei metadati corrente come prodotto runtime sostituibile. Il rilevamento ripetuto dei provider runtime può prendere in prestito quello snapshot invece di ricostruire l'indice installato e il registro dei manifesti per ogni passaggio del catalogo provider. Lo snapshot viene cancellato o sostituito allo spegnimento del Gateway, quando cambiano configurazione/inventario dei plugin e quando vengono scritti gli indici installati; i chiamanti ricadono sul percorso freddo manifesto/indice quando non esiste uno snapshot corrente compatibile. I controlli di compatibilità devono includere radici di rilevamento plugin come `plugins.load.paths` e il workspace predefinito dell'agente, perché i plugin del workspace fanno parte dell'ambito dei metadati.

Lo snapshot e la tabella di lookup mantengono le decisioni di avvio ripetute sul percorso veloce:

- proprietà dei canali
- avvio differito dei canali
- ID dei plugin di avvio
- proprietà dei provider e dei backend CLI
- proprietà di provider di configurazione, alias di comando, provider del catalogo modelli e contratto del manifesto
- validazione dello schema di configurazione dei plugin e dello schema di configurazione dei canali
- decisioni di abilitazione automatica all'avvio

Il confine di sicurezza è la sostituzione dello snapshot, non la mutazione. Ricostruisci lo snapshot quando cambiano configurazione, inventario dei plugin, record di installazione o policy dell'indice persistito. Non trattarlo come un ampio registro globale mutabile e non conservare snapshot storici illimitati. Il caricamento runtime dei plugin resta separato dagli snapshot dei metadati, così lo stato runtime obsoleto non può essere nascosto dietro una cache di metadati.

La regola della cache è documentata in [Interni dell'architettura dei plugin](/it/plugins/architecture-internals#plugin-cache-boundary): i metadati di manifesto e rilevamento sono freschi a meno che un chiamante non detenga uno snapshot, una tabella di lookup o un registro dei manifesti espliciti per il flusso corrente. Cache nascoste dei metadati e TTL basati sull'orologio non fanno parte del caricamento dei plugin. Solo le cache del loader runtime, dei moduli e degli artefatti delle dipendenze possono persistere dopo che codice o artefatti installati sono stati effettivamente caricati.

Alcuni chiamanti del percorso freddo ricostruiscono ancora registri dei manifesti direttamente dall'indice persistito dei plugin installati invece di ricevere una `PluginLookUpTable` del Gateway. Quel percorso ora ricostruisce il registro su richiesta; preferisci passare la tabella di lookup corrente o un registro dei manifesti esplicito attraverso i flussi runtime quando un chiamante ne ha già uno.

### Pianificazione dell'attivazione

La pianificazione dell'attivazione fa parte del piano di controllo. I chiamanti possono chiedere quali plugin sono rilevanti per un comando, provider, canale, route, harness dell'agente o capability concreti prima di caricare registri runtime più ampi.

Il planner mantiene compatibile il comportamento corrente dei manifesti:

- i campi `activation.*` sono suggerimenti espliciti per il planner
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e gli hook restano il fallback di proprietà del manifesto
- l'API del planner solo ID resta disponibile per i chiamanti esistenti
- l'API del piano segnala etichette di motivo, così la diagnostica può distinguere i suggerimenti espliciti dal fallback di proprietà

<Warning>
Non trattare `activation` come un hook del ciclo di vita o come un sostituto di `register(...)`. È un metadato usato per restringere il caricamento. Preferisci i campi di proprietà quando descrivono già la relazione; usa `activation` solo per suggerimenti aggiuntivi al planner.
</Warning>

### Plugin di canale e lo strumento di messaggio condiviso

I plugin di canale non devono registrare uno strumento separato di invio/modifica/reazione per le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e i plugin di canale possiedono la discovery e l'esecuzione specifiche del canale dietro di esso.

Il confine attuale è:

- il core possiede l'host dello strumento `message` condiviso, il collegamento al prompt, la gestione di sessione/thread e il dispatch dell'esecuzione
- i plugin di canale possiedono la discovery delle azioni con scope, la discovery delle capability e qualsiasi frammento di schema specifico del canale
- i plugin di canale possiedono la grammatica delle conversazioni di sessione specifica del provider, ad esempio come gli id conversazione codificano gli id thread o ereditano dalle conversazioni padre
- i plugin di canale eseguono l'azione finale tramite il proprio adapter di azione

Per i plugin di canale, la superficie SDK è `ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di discovery unificata consente a un plugin di restituire insieme le proprie azioni visibili, capability e contributi allo schema, così questi elementi non divergono.

Quando un parametro dello strumento messaggi specifico del canale trasporta una sorgente multimediale, ad esempio un percorso locale o un URL multimediale remoto, il plugin dovrebbe anche restituire `mediaSourceParams` da `describeMessageTool(...)`. Il core usa quell'elenco esplicito per applicare la normalizzazione dei percorsi sandbox e i suggerimenti di accesso ai media in uscita senza codificare rigidamente i nomi dei parametri posseduti dal plugin. Preferisci mappe con scope per azione, non un unico elenco piatto a livello di canale, così un parametro multimediale valido solo per il profilo non viene normalizzato su azioni non correlate come `send`.

Il core passa lo scope runtime in quel passaggio di discovery. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` in ingresso attendibile

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre azioni di messaggio in base all'account attivo, alla stanza/thread/messaggio corrente o all'identità attendibile del richiedente, senza codificare rigidamente rami specifici del canale nello strumento `message` del core.

Questo è il motivo per cui le modifiche di routing dell'embedded runner restano lavoro del plugin: il runner è responsabile dell'inoltro dell'identità della chat/sessione corrente nel confine di discovery del plugin, così lo strumento `message` condiviso espone la superficie giusta, posseduta dal canale, per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i plugin inclusi dovrebbero mantenere il runtime di esecuzione dentro i propri moduli di estensione. Il core non possiede più i runtime delle azioni messaggio di Discord, Slack, Telegram o WhatsApp sotto `src/agents/tools`. Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i plugin inclusi dovrebbero importare il proprio codice runtime locale direttamente dai moduli posseduti dalla loro estensione.

Lo stesso confine si applica in generale alle seam SDK con nomi di provider: il core non dovrebbe importare barrel di convenienza specifici del canale per Slack, Discord, Signal, WhatsApp o estensioni simili. Se il core ha bisogno di un comportamento, deve consumare il barrel `api.ts` / `runtime-api.ts` del plugin incluso oppure promuovere l'esigenza a una capability generica e ristretta nell'SDK condiviso.

I plugin inclusi seguono la stessa regola. Il `runtime-api.ts` di un plugin incluso non dovrebbe riesportare la propria facciata brandizzata `openclaw/plugin-sdk/<plugin-id>`. Queste facciate brandizzate restano shim di compatibilità per plugin esterni e consumer più vecchi, ma i plugin inclusi dovrebbero usare export locali più sottopercorsi SDK generici e ristretti come `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` o `openclaw/plugin-sdk/webhook-ingress`. Il nuovo codice non dovrebbe aggiungere facciate SDK specifiche dell'id plugin, a meno che il confine di compatibilità per un ecosistema esterno esistente lo richieda.

Per i sondaggi in particolare, ci sono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che rientrano nel modello comune di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per semantiche di sondaggio specifiche del canale o parametri di sondaggio aggiuntivi

Ora il core rimanda il parsing condiviso dei sondaggi finché il dispatch del sondaggio del plugin non rifiuta l'azione, così gli handler di sondaggi posseduti dal plugin possono accettare campi di sondaggio specifici del canale senza essere prima bloccati dal parser generico dei sondaggi.

Consulta [Interni dell'architettura dei Plugin](/it/plugins/architecture-internals) per la sequenza completa di avvio.

## Modello di proprietà delle capability

OpenClaw tratta un plugin nativo come il confine di proprietà per una **azienda** o una **funzionalità**, non come un insieme casuale di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe di solito possedere tutte le superfici rivolte a OpenClaw di quell'azienda
- un plugin di funzionalità dovrebbe di solito possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capability condivise del core invece di reimplementare il comportamento del provider ad hoc

<AccordionGroup>
  <Accordion title="Multi-capability del vendor">
    `openai` possiede inferenza testuale, parlato, voce realtime, comprensione dei media e generazione di immagini. `google` possiede inferenza testuale più comprensione dei media, generazione di immagini e ricerca web. `qwen` possiede inferenza testuale più comprensione dei media e generazione video.
  </Accordion>
  <Accordion title="Capability singola del vendor">
    `elevenlabs` e `microsoft` possiedono il parlato; `firecrawl` possiede il web-fetch; `minimax` / `mistral` / `moonshot` / `zai` possiedono backend di comprensione dei media.
  </Accordion>
  <Accordion title="Plugin di funzionalità">
    `voice-call` possiede trasporto chiamate, strumenti, CLI, route e bridging dei media-stream Twilio, ma consuma capability condivise di parlato, trascrizione realtime e voce realtime invece di importare direttamente plugin di vendor.
  </Accordion>
</AccordionGroup>

Lo stato finale previsto è:

- OpenAI vive in un unico plugin anche se copre modelli testuali, parlato, immagini e video futuri
- un altro vendor può fare lo stesso per la propria superficie
- ai canali non importa quale plugin di vendor possieda il provider; consumano il contratto di capability condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di proprietà
- **capability** = contratto del core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è "quale provider dovrebbe codificare rigidamente la gestione video?" La prima domanda è "qual è il contratto di capability video del core?" Una volta che quel contratto esiste, i plugin di vendor possono registrarsi rispetto a esso e i plugin di canale/funzionalità possono consumarlo.

Se la capability non esiste ancora, la mossa giusta di solito è:

<Steps>
  <Step title="Definisci la capability">
    Definisci nel core la capability mancante.
  </Step>
  <Step title="Esponi tramite l'SDK">
    Esponila tramite l'API/runtime del plugin in modo tipizzato.
  </Step>
  <Step title="Collega i consumer">
    Collega canali/funzionalità a quella capability.
  </Step>
  <Step title="Implementazioni dei vendor">
    Consenti ai plugin di vendor di registrare implementazioni.
  </Step>
</Steps>

Questo mantiene esplicita la proprietà evitando al tempo stesso comportamenti del core che dipendono da un singolo vendor o da un percorso di codice specifico di un plugin una tantum.

### Stratificazione delle capability

Usa questo modello mentale quando decidi a chi appartiene il codice:

<Tabs>
  <Tab title="Livello capability del core">
    Orchestrazione condivisa, policy, fallback, regole di merge della config, semantica di consegna e contratti tipizzati.
  </Tab>
  <Tab title="Livello plugin del vendor">
    API specifiche del vendor, auth, cataloghi modelli, sintesi vocale, generazione di immagini, backend video futuri, endpoint di utilizzo.
  </Tab>
  <Tab title="Livello plugin di canale/funzionalità">
    Integrazione Slack/Discord/voice-call/ecc. che consuma capability del core e le presenta su una superficie.
  </Tab>
</Tabs>

Ad esempio, il TTS segue questa forma:

- il core possiede policy TTS al momento della risposta, ordine di fallback, preferenze e consegna al canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper runtime TTS per telefonia

Lo stesso pattern dovrebbe essere preferito per capability future.

### Esempio di plugin aziendale multi-capability

Un plugin aziendale dovrebbe risultare coeso dall'esterno. Se OpenClaw ha contratti condivisi per modelli, parlato, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione video, fetch web e ricerca web, un vendor può possedere tutte le proprie superfici in un unico punto:

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

Ciò che conta non sono i nomi esattii degli helper. Conta la forma:

- un plugin possiede la superficie del vendor
- il core possiede comunque i contratti di capability
- i canali e i plugin di funzionalità consumano helper `api.runtime.*`, non codice del vendor
- i test di contratto possono verificare che il plugin abbia registrato le capability che dichiara di possedere

### Esempio di capability: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica capability condivisa. Lo stesso modello di proprietà si applica lì:

<Steps>
  <Step title="Il core definisce il contratto">
    Il core definisce il contratto di comprensione dei media.
  </Step>
  <Step title="I plugin di vendor si registrano">
    I plugin di vendor registrano `describeImage`, `transcribeAudio` e `describeVideo` quando applicabili.
  </Step>
  <Step title="I consumer usano il comportamento condiviso">
    I canali e i plugin di funzionalità consumano il comportamento condiviso del core invece di collegarsi direttamente al codice del vendor.
  </Step>
</Steps>

Questo evita di incorporare nel core le assunzioni video di un singolo provider. Il plugin possiede la superficie del vendor; il core possiede il contratto di capability e il comportamento di fallback.

La generazione video usa già la stessa sequenza: il core possiede il contratto di capability tipizzato e l'helper runtime, e i plugin di vendor registrano implementazioni `api.registerVideoGenerationProvider(...)` rispetto a esso.

Hai bisogno di una checklist concreta per il rollout? Consulta [Cookbook delle capability](/it/plugins/architecture).

## Contratti e applicazione

La superficie dell'API plugin è intenzionalmente tipizzata e centralizzata in `OpenClawPluginApi`. Quel contratto definisce i punti di registrazione supportati e gli helper runtime su cui un plugin può fare affidamento.

Perché è importante:

- gli autori di plugin ottengono un unico standard interno stabile
- il core può rifiutare proprietà duplicate, ad esempio due plugin che registrano lo stesso id provider
- l'avvio può mostrare diagnostica azionabile per registrazioni malformate
- i test di contratto possono applicare la proprietà dei plugin inclusi e prevenire derive silenziose

Ci sono due livelli di applicazione:

<AccordionGroup>
  <Accordion title="Applicazione della registrazione a runtime">
    Il registro dei plugin convalida le registrazioni durante il caricamento dei plugin. Esempi: ID di provider duplicati, ID di provider vocali duplicati e registrazioni non valide producono diagnostica dei plugin invece di comportamento indefinito.
  </Accordion>
  <Accordion title="Test di contratto">
    I plugin inclusi vengono acquisiti nei registri di contratto durante le esecuzioni dei test, così OpenClaw può asserire esplicitamente la proprietà. Oggi questo viene usato per provider di modelli, provider vocali, provider di ricerca web e proprietà delle registrazioni incluse.
  </Accordion>
</AccordionGroup>

L'effetto pratico è che OpenClaw sa in anticipo quale plugin possiede quale superficie. Questo consente a core e canali di comporsi senza soluzione di continuità, perché la proprietà è dichiarata, tipizzata e testabile invece che implicita.

### Cosa appartiene a un contratto

<Tabs>
  <Tab title="Contratti validi">
    - tipizzati
    - piccoli
    - specifici per capacità
    - di proprietà del core
    - riutilizzabili da più plugin
    - utilizzabili da canali/funzionalità senza conoscenza del vendor

  </Tab>
  <Tab title="Contratti non validi">
    - policy specifica del vendor nascosta nel core
    - vie di fuga una tantum per plugin che bypassano il registro
    - codice di canale che accede direttamente a un'implementazione vendor
    - oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o `api.runtime`

  </Tab>
</Tabs>

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi lascia che i plugin si colleghino a essa.

## Modello di esecuzione

I plugin nativi di OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono sandboxati. Un plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del codice core.

<Warning>
Implicazioni dei plugin nativi: un plugin può registrare strumenti, gestori di rete, hook e servizi; un bug di un plugin può mandare in crash o destabilizzare il gateway; e un plugin nativo dannoso equivale all'esecuzione di codice arbitrario all'interno del processo OpenClaw.
</Warning>

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta come pacchetti di metadati/contenuti. Nelle versioni attuali, questo significa soprattutto Skills inclusi.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non inclusi. Tratta i plugin dello workspace come codice per il tempo di sviluppo, non come impostazioni predefinite di produzione.

Per i nomi dei pacchetti workspace inclusi, mantieni l'ID del plugin ancorato al nome npm: `@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando il pacchetto espone intenzionalmente un ruolo di plugin più ristretto.

<Note>
**Nota sulla fiducia:** `plugins.allow` considera attendibili gli **ID dei plugin**, non la provenienza della fonte. Un plugin workspace con lo stesso ID di un plugin incluso oscura intenzionalmente la copia inclusa quando quel plugin workspace è abilitato/inserito in allowlist. Questo è normale e utile per sviluppo locale, test di patch e hotfix. La fiducia nei plugin inclusi viene risolta dallo snapshot sorgente, cioè dal manifest e dal codice su disco al momento del caricamento, anziché dai metadati di installazione. Un record di installazione corrotto o sostituito non può ampliare silenziosamente la superficie di fiducia di un plugin incluso oltre quanto dichiarato dalla sorgente effettiva.
</Note>

## Confine di esportazione

OpenClaw esporta capacità, non comodità di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni di helper non contrattuali:

- sottopercorsi helper specifici dei plugin inclusi
- sottopercorsi di plumbing runtime non destinati a essere API pubblica
- helper di comodità specifici del vendor
- helper di configurazione/onboarding che sono dettagli di implementazione

I sottopercorsi helper riservati dei plugin inclusi sono stati ritirati dalla mappa di esportazione generata dell'SDK. Mantieni gli helper specifici del proprietario all'interno del pacchetto del plugin proprietario; promuovi solo il comportamento host riutilizzabile a contratti SDK generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

## Interni e riferimento

Per la pipeline di caricamento, il modello del registro, gli hook runtime dei provider, le route HTTP del Gateway, gli schemi degli strumenti di messaggio, la risoluzione dei target dei canali, i cataloghi dei provider, i plugin del motore di contesto e la guida all'aggiunta di una nuova capacità, consulta [Interni dell'architettura dei plugin](/it/plugins/architecture-internals).

## Correlati

- [Creare plugin](/it/plugins/building-plugins)
- [Manifest del plugin](/it/plugins/manifest)
- [Configurazione dell'SDK dei plugin](/it/plugins/sdk-setup)
