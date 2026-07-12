---
read_when:
    - Creazione o debug di plugin nativi per OpenClaw
    - Comprendere il modello di funzionalità dei Plugin o i confini di responsabilità
    - Intervento sulla pipeline di caricamento dei Plugin o sul registro
    - Implementazione degli hook di runtime dei provider o dei plugin di canale
sidebarTitle: Internals
summary: 'Meccanismi interni dei Plugin: modello delle funzionalità, titolarità, contratti, pipeline di caricamento e helper di runtime'
title: Componenti interni dei Plugin
x-i18n:
    generated_at: "2026-07-12T07:15:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Questo è il **riferimento approfondito sull'architettura** del sistema di Plugin di OpenClaw. Per le guide pratiche, inizia da una delle pagine specifiche riportate di seguito.

<CardGroup cols={2}>
  <Card title="Installare e usare i plugin" icon="plug" href="/it/tools/plugin">
    Guida per gli utenti finali su come aggiungere, abilitare e risolvere i problemi dei plugin.
  </Card>
  <Card title="Creare plugin" icon="rocket" href="/it/plugins/building-plugins">
    Tutorial per il primo Plugin con il manifest funzionante più semplice.
  </Card>
  <Card title="Plugin di canale" icon="comments" href="/it/plugins/sdk-channel-plugins">
    Crea un Plugin per un canale di messaggistica.
  </Card>
  <Card title="Plugin di provider" icon="microchip" href="/it/plugins/sdk-provider-plugins">
    Crea un Plugin per un provider di modelli.
  </Card>
  <Card title="Panoramica dell'SDK" icon="book" href="/it/plugins/sdk-overview">
    Riferimento per la mappa delle importazioni e l'API di registrazione.
  </Card>
</CardGroup>

## Modello pubblico delle funzionalità

Le funzionalità costituiscono il modello pubblico dei **Plugin nativi** all'interno di OpenClaw. Ogni Plugin nativo di OpenClaw si registra per uno o più tipi di funzionalità:

| Funzionalità                    | Metodo di registrazione                           | Plugin di esempio                         |
| ------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| Inferenza testuale              | `api.registerProvider(...)`                       | `anthropic`, `openai`                     |
| Backend di inferenza CLI        | `api.registerCliBackend(...)`                     | `anthropic`, `openai`                     |
| Incorporamenti                  | `api.registerEmbeddingProvider(...)`              | Plugin vettoriali gestiti dal provider    |
| Voce                            | `api.registerSpeechProvider(...)`                 | `elevenlabs`, `microsoft`                 |
| Trascrizione in tempo reale     | `api.registerRealtimeTranscriptionProvider(...)`  | `openai`                                  |
| Voce in tempo reale             | `api.registerRealtimeVoiceProvider(...)`          | `google`, `openai`                        |
| Comprensione dei contenuti multimediali | `api.registerMediaUnderstandingProvider(...)` | `google`, `openai`                   |
| Origine delle trascrizioni      | `api.registerTranscriptSourceProvider(...)`       | `discord`                                 |
| Generazione di immagini         | `api.registerImageGenerationProvider(...)`        | `fal`, `google`, `openai`                 |
| Generazione musicale            | `api.registerMusicGenerationProvider(...)`        | `fal`, `google`, `minimax`                |
| Generazione video               | `api.registerVideoGenerationProvider(...)`        | `fal`, `google`, `qwen`                   |
| Recupero dal Web                | `api.registerWebFetchProvider(...)`               | `firecrawl`                               |
| Ricerca sul Web                 | `api.registerWebSearchProvider(...)`              | `brave`, `firecrawl`, `google`            |
| Canale / messaggistica          | `api.registerChannel(...)`                        | `matrix`, `msteams`                       |
| Rilevamento del Gateway         | `api.registerGatewayDiscoveryService(...)`        | `bonjour`                                 |

<Note>
Un Plugin che non registra alcuna funzionalità ma fornisce hook, strumenti, servizi di rilevamento o servizi in background è un Plugin **legacy basato esclusivamente su hook**. Questo modello è ancora pienamente supportato.
</Note>

### Posizione sulla compatibilità esterna

Il modello delle funzionalità è integrato nel core e attualmente utilizzato dai Plugin inclusi e nativi, ma per la compatibilità dei Plugin esterni serve ancora un criterio più rigoroso di «è esportato, quindi è immutabile».

| Situazione del Plugin                                | Indicazioni                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Plugin esterni esistenti                             | Mantieni funzionanti le integrazioni basate su hook; questa è la base di riferimento per la compatibilità.               |
| Nuovi Plugin inclusi/nativi                          | Preferisci la registrazione esplicita delle funzionalità agli accessi specifici dei fornitori o ai nuovi modelli basati esclusivamente su hook. |
| Plugin esterni che adottano la registrazione delle funzionalità | È consentito, ma considera in evoluzione le superfici ausiliarie specifiche delle funzionalità, salvo che la documentazione le indichi come stabili. |

La registrazione delle funzionalità è la direzione prevista. Durante la transizione, gli hook legacy restano il percorso più sicuro per evitare incompatibilità nei Plugin esterni. I sottopercorsi ausiliari esportati non sono tutti equivalenti: preferisci contratti circoscritti e documentati alle esportazioni ausiliarie accidentali.

### Forme dei Plugin

OpenClaw classifica ogni Plugin caricato in una forma in base al suo effettivo comportamento di registrazione, non solo ai metadati statici:

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra esattamente un tipo di funzionalità, ad esempio un Plugin dedicato esclusivamente a un provider come `arcee` o `chutes`.
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra più tipi di funzionalità; ad esempio, `openai` gestisce l'inferenza testuale, la voce, la comprensione dei contenuti multimediali e la generazione di immagini.
  </Accordion>
  <Accordion title="hook-only">
    Registra esclusivamente hook, tipizzati o personalizzati, senza funzionalità, strumenti, comandi o servizi.
  </Accordion>
  <Accordion title="non-capability">
    Registra strumenti, comandi, servizi o route, ma nessuna funzionalità.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` per visualizzare la forma di un Plugin e la suddivisione delle sue funzionalità. Per i dettagli, consulta il [riferimento della CLI](/it/cli/plugins#inspect).

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per i Plugin basati esclusivamente su hook. I Plugin legacy utilizzati in scenari reali dipendono ancora da questo hook.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per la sostituzione del modello o del provider
- preferire `before_prompt_build` per la modifica dei prompt
- rimuoverlo solo dopo che il suo utilizzo effettivo sarà diminuito e la copertura delle fixture avrà dimostrato la sicurezza della migrazione

### Segnali di compatibilità

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` e `openclaw plugins doctor` mostrano questi avvisi di compatibilità:

| Segnale                                            | Significato                                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **configurazione valida**                          | La configurazione viene analizzata correttamente e i Plugin vengono risolti                                                    |
| **solo hook** (informativo)                        | Il Plugin registra solo hook; è un percorso supportato, ma non è ancora migrato alla registrazione delle funzionalità          |
| **`before_agent_start` legacy** (avviso)           | Il Plugin usa l'hook deprecato `before_agent_start` invece di `before_model_resolve`/`before_prompt_build`                      |
| **API deprecata per gli incorporamenti della memoria** (avviso) | Un Plugin non incluso usa la vecchia API del provider di incorporamenti specifica per la memoria invece di `registerEmbeddingProvider` |
| **errore irreversibile**                           | La configurazione non è valida oppure non è stato possibile caricare il Plugin                                                 |

Attualmente, nessuno dei segnali informativi o di avviso interrompe il funzionamento del Plugin. Questi segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di Plugin di OpenClaw è composto da quattro livelli:

<Steps>
  <Step title="Manifest e rilevamento">
    OpenClaw individua i Plugin candidati nei percorsi configurati, nelle directory radice degli spazi di lavoro, nelle directory radice globali dei Plugin e tra i Plugin inclusi. Il rilevamento legge prima i manifest nativi `openclaw.plugin.json` e i manifest dei pacchetti supportati.
  </Step>
  <Step title="Abilitazione e convalida">
    Il core stabilisce se un Plugin rilevato è abilitato, disabilitato, bloccato o selezionato per uno slot esclusivo, come quello della memoria.
  </Step>
  <Step title="Caricamento in fase di esecuzione">
    I Plugin nativi di OpenClaw vengono caricati nello stesso processo e registrano le funzionalità in un registro centrale. Il JavaScript distribuito come pacchetto viene caricato tramite il `require` nativo; il codice sorgente TypeScript locale di terze parti usa Jiti come soluzione di emergenza. I pacchetti compatibili vengono normalizzati in record del registro senza importare codice di runtime.
  </Step>
  <Step title="Utilizzo delle superfici">
    Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione dei provider, hook, route HTTP, comandi CLI e servizi.
  </Step>
</Steps>

Per la CLI dei Plugin in particolare, il rilevamento dei comandi radice è suddiviso in due fasi:

- i metadati disponibili durante l'analisi provengono da `registerCli(..., { descriptors: [...] })`
- il modulo CLI effettivo del Plugin può rimanere a caricamento differito e registrarsi alla prima invocazione

In questo modo, il codice CLI gestito dal Plugin resta all'interno del Plugin, consentendo comunque a OpenClaw di riservare i nomi dei comandi radice prima dell'analisi.

Il confine progettuale importante:

- la convalida del manifest e della configurazione deve funzionare usando i **metadati del manifest e dello schema**, senza eseguire il codice del Plugin
- il rilevamento delle funzionalità native può caricare il codice di ingresso di un Plugin attendibile per creare un'istantanea non attivante del registro
- il comportamento nativo in fase di esecuzione deriva dal percorso `register(api)` del modulo del Plugin con `api.registrationMode === "full"`

Questa separazione consente a OpenClaw di convalidare la configurazione, spiegare i Plugin mancanti o disabilitati e creare suggerimenti per l'interfaccia utente e lo schema prima che il runtime completo sia attivo.

### Istantanea dei metadati dei Plugin e tabella di ricerca

All'avvio, il Gateway crea un unico `PluginMetadataSnapshot` per l'istantanea della configurazione corrente. L'istantanea contiene solo metadati: memorizza l'indice dei Plugin installati, il registro dei manifest, la diagnostica dei manifest, le mappe dei proprietari, un normalizzatore degli ID dei Plugin e i record dei manifest. Non contiene moduli Plugin caricati, SDK dei provider, contenuti dei pacchetti o esportazioni di runtime.

La convalida della configurazione sensibile ai Plugin, l'abilitazione automatica all'avvio e l'avvio dei Plugin del Gateway utilizzano tale istantanea invece di ricostruire separatamente i metadati del manifest e dell'indice. `PluginLookUpTable` deriva dalla stessa istantanea e aggiunge il piano dei Plugin di avvio per la configurazione di runtime corrente.

Dopo l'avvio, il Gateway conserva l'istantanea dei metadati corrente come prodotto di runtime sostituibile. Le ripetute operazioni di rilevamento dei provider in fase di esecuzione possono riutilizzare tale istantanea invece di ricostruire l'indice degli elementi installati e il registro dei manifest a ogni passaggio sul catalogo dei provider. L'istantanea viene cancellata o sostituita allo spegnimento del Gateway, quando cambiano la configurazione o l'inventario dei Plugin e quando viene scritto l'indice degli elementi installati; in assenza di un'istantanea corrente compatibile, i chiamanti ripiegano sul percorso a freddo del manifest e dell'indice. I controlli di compatibilità devono includere le directory radice di rilevamento dei Plugin, come `plugins.load.paths`, e lo spazio di lavoro predefinito dell'agente, perché i Plugin dello spazio di lavoro fanno parte dell'ambito dei metadati.

L'istantanea e la tabella di ricerca mantengono nel percorso rapido le decisioni ripetute all'avvio:

- proprietà dei canali
- avvio differito dei canali
- ID dei Plugin di avvio
- proprietà dei provider e dei backend CLI
- proprietà del provider di configurazione, degli alias dei comandi, del provider del catalogo dei modelli e dei contratti dei manifest
- convalida dello schema di configurazione dei Plugin e dello schema di configurazione dei canali
- decisioni di abilitazione automatica all'avvio

Il confine di sicurezza è la sostituzione dell'istantanea, non la sua modifica. Ricrea l'istantanea quando cambiano la configurazione, l'inventario dei Plugin, i record di installazione o i criteri dell'indice persistente. Non considerarla un ampio registro globale modificabile e non conservare un numero illimitato di istantanee storiche. Il caricamento dei Plugin in fase di esecuzione resta separato dalle istantanee dei metadati, in modo che uno stato di runtime obsoleto non possa essere nascosto dietro una cache dei metadati.

La regola della cache è documentata in [Dettagli interni dell'architettura dei Plugin](/it/plugins/architecture-internals#plugin-cache-boundary): i metadati dei manifest e del rilevamento sono aggiornati, a meno che un chiamante non disponga di un'istantanea, una tabella di ricerca o un registro dei manifest espliciti per il flusso corrente. Le cache nascoste dei metadati e i TTL basati sull'orologio non fanno parte del caricamento dei Plugin. Solo le cache del caricatore di runtime, dei moduli e degli artefatti delle dipendenze possono persistere dopo l'effettivo caricamento del codice o degli artefatti installati.

Alcuni chiamanti del percorso a freddo ricostruiscono ancora i registri dei manifest direttamente dall'indice persistente dei Plugin installati, invece di ricevere una `PluginLookUpTable` del Gateway. Questo percorso ora ricostruisce il registro su richiesta; quando un chiamante ne dispone già, preferisci trasmettere la tabella di ricerca corrente o un registro dei manifest esplicito attraverso i flussi di runtime.

### Pianificazione dell'attivazione

La pianificazione dell'attivazione fa parte del piano di controllo. I chiamanti possono chiedere quali plugin siano pertinenti a un comando, provider, canale, percorso, harness dell'agente o funzionalità concreti prima di caricare registri di runtime più ampi.

Il pianificatore mantiene compatibile il comportamento corrente del manifesto:

- i campi `activation.*` sono indicazioni esplicite per il pianificatore
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e gli hook rimangono il fallback basato sulla titolarità del manifesto
- l'API del pianificatore che restituisce solo gli ID rimane disponibile per i chiamanti esistenti
- l'API del piano segnala etichette di motivazione affinché la diagnostica possa distinguere le indicazioni esplicite dal fallback basato sulla titolarità

<Warning>
Non considerare `activation` un hook del ciclo di vita o un sostituto di `register(...)`. Si tratta di metadati utilizzati per restringere il caricamento. Preferire i campi di titolarità quando descrivono già la relazione; usare `activation` solo per indicazioni aggiuntive al pianificatore.
</Warning>

### Plugin di canale e strumento di messaggistica condiviso

I plugin di canale non devono registrare uno strumento separato di invio/modifica/reazione per le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, mentre i plugin di canale gestiscono l'individuazione e l'esecuzione specifiche del canale dietro di esso.

Il confine attuale è il seguente:

- il core gestisce l'host dello strumento `message` condiviso, il collegamento dei prompt, la registrazione delle sessioni e dei thread e l'inoltro dell'esecuzione
- i plugin di canale gestiscono l'individuazione delle azioni con ambito definito, l'individuazione delle funzionalità e gli eventuali frammenti di schema specifici del canale
- i plugin di canale gestiscono la grammatica delle conversazioni di sessione specifica del provider, per esempio il modo in cui gli ID conversazione codificano gli ID dei thread o vengono ereditati dalle conversazioni principali
- i plugin di canale eseguono l'azione finale tramite il proprio adattatore di azioni

Per i plugin di canale, la superficie dell'SDK è `ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata unificata di individuazione consente a un plugin di restituire insieme le azioni visibili, le funzionalità e i contributi allo schema, evitando che questi elementi divergano.

Quando un parametro specifico del canale dello strumento di messaggistica contiene una sorgente multimediale, come un percorso locale o un URL multimediale remoto, il plugin deve restituire anche `mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito per applicare la normalizzazione dei percorsi della sandbox e le indicazioni per l'accesso ai contenuti multimediali in uscita, senza codificare direttamente i nomi dei parametri gestiti dal plugin. In questo caso, preferire mappe con ambito di azione anziché un unico elenco piatto per l'intero canale, in modo che un parametro multimediale riservato al profilo non venga normalizzato per azioni non correlate come `send`.

Il core passa l'ambito del runtime a questa fase di individuazione. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- il valore attendibile in ingresso `requesterSenderId`

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o mostrare azioni di messaggistica in base all'account attivo, alla stanza, al thread o al messaggio corrente oppure all'identità attendibile del richiedente, senza codificare nel core dello strumento `message` diramazioni specifiche del canale.

Per questo motivo, le modifiche all'instradamento dell'esecutore incorporato restano di competenza del plugin: l'esecutore è responsabile dell'inoltro dell'identità corrente della chat e della sessione al confine di individuazione del plugin, affinché lo strumento `message` condiviso esponga la superficie corretta gestita dal canale per il turno corrente.

Per gli helper di esecuzione gestiti dal canale, i plugin inclusi devono mantenere il runtime di esecuzione all'interno dei propri moduli. Il core non gestisce più i runtime delle azioni di messaggistica di Discord, Slack, Telegram o WhatsApp in `src/agents/tools`. Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime` e i plugin inclusi devono importare direttamente il proprio codice di runtime locale dai moduli di loro competenza.

Lo stesso confine si applica in generale alle interfacce dell'SDK denominate in base al provider: il core non deve importare barrel di utilità specifici del canale per Discord, Signal, Slack, WhatsApp o plugin simili. Se il core necessita di un comportamento, deve usare il barrel `api.ts` / `runtime-api.ts` del plugin incluso oppure trasformare tale necessità in una funzionalità generica e circoscritta nell'SDK condiviso.

I plugin inclusi seguono la stessa regola. Il file `runtime-api.ts` di un plugin incluso non deve riesportare la propria facciata personalizzata `openclaw/plugin-sdk/<plugin-id>`. Queste facciate personalizzate rimangono shim di compatibilità per plugin esterni e utilizzatori meno recenti, ma i plugin inclusi devono usare esportazioni locali e sottopercorsi generici e circoscritti dell'SDK, come `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` o `openclaw/plugin-sdk/webhook-ingress`. Il nuovo codice non deve aggiungere facciate dell'SDK specifiche dell'ID del plugin, a meno che ciò sia richiesto dal confine di compatibilità di un ecosistema esterno esistente.

Per i sondaggi, in particolare, esistono due percorsi di esecuzione:

- `outbound.sendPoll` è la base condivisa per i canali compatibili con il modello comune dei sondaggi
- `actions.handleAction("poll")` è il percorso preferito per la semantica dei sondaggi specifica del canale o per parametri aggiuntivi dei sondaggi

Il core ora rinvia l'analisi condivisa del sondaggio fino a quando l'inoltro del sondaggio al plugin non rifiuta l'azione, in modo che i gestori dei sondaggi di competenza del plugin possano accettare campi specifici del canale senza essere prima bloccati dall'analizzatore generico dei sondaggi.

Consultare [Dettagli interni dell'architettura dei plugin](/it/plugins/architecture-internals) per la sequenza completa di avvio.

## Modello di titolarità delle funzionalità

OpenClaw considera un plugin nativo come il confine di titolarità di un'**azienda** o di una **funzionalità**, non come una raccolta eterogenea di integrazioni non correlate.

Ciò significa che:

- un plugin aziendale dovrebbe normalmente gestire tutte le superfici di quell'azienda rivolte a OpenClaw
- un plugin di funzionalità dovrebbe normalmente gestire l'intera superficie della funzionalità che introduce
- i canali dovrebbero utilizzare le funzionalità condivise del core invece di reimplementare ad hoc il comportamento del provider

<AccordionGroup>
  <Accordion title="Fornitore con più funzionalità">
    `google` gestisce inferenza testuale, backend CLI, incorporamenti, sintesi vocale, voce in tempo reale, comprensione multimediale, generazione di immagini/musica/video e ricerca web. `openai` gestisce inferenza testuale, incorporamenti, sintesi vocale, trascrizione in tempo reale, voce in tempo reale, comprensione multimediale e generazione di immagini/video. `minimax` gestisce l'inferenza testuale, oltre a comprensione multimediale, sintesi vocale, generazione di immagini/musica/video e ricerca web.
  </Accordion>
  <Accordion title="Fornitore con una sola funzionalità">
    `arcee` e `chutes` gestiscono solo l'inferenza testuale; `microsoft` gestisce solo la sintesi vocale. Un plugin di un fornitore può mantenere un ambito così ristretto finché non deve coprire una parte più ampia della superficie di quel fornitore.
  </Accordion>
  <Accordion title="Plugin di funzionalità">
    `voice-call` gestisce il trasporto delle chiamate, gli strumenti, la CLI, i percorsi e il collegamento dei flussi multimediali Twilio, ma utilizza le funzionalità condivise di sintesi vocale, trascrizione in tempo reale e voce in tempo reale invece di importare direttamente i plugin dei fornitori.
  </Accordion>
</AccordionGroup>

Lo stato finale previsto è il seguente:

- la superficie di un fornitore rivolta a OpenClaw risiede in un unico plugin, anche se comprende modelli testuali, voce, immagini e video
- gli altri fornitori possono fare lo stesso per la propria area funzionale
- ai canali non interessa quale plugin di un fornitore gestisca il provider; utilizzano il contratto di funzionalità condiviso esposto dal core

Questa è la distinzione fondamentale:

- **plugin** = confine di titolarità
- **funzionalità** = contratto del core che più plugin possono implementare o utilizzare

Pertanto, se OpenClaw aggiunge un nuovo ambito come il video, la prima domanda non è «quale provider deve codificare direttamente la gestione dei video?». La prima domanda è «qual è il contratto della funzionalità video del core?». Una volta definito tale contratto, i plugin dei fornitori possono registrarsi per implementarlo, mentre i plugin di canale o funzionalità possono utilizzarlo.

Se la funzionalità non esiste ancora, in genere la procedura corretta è:

<Steps>
  <Step title="Definire la funzionalità">
    Definire nel core la funzionalità mancante.
  </Step>
  <Step title="Esporre tramite l'SDK">
    Esporla in modo tipizzato tramite l'API e il runtime dei plugin.
  </Step>
  <Step title="Collegare gli utilizzatori">
    Collegare i canali e le funzionalità a tale funzionalità.
  </Step>
  <Step title="Implementazioni dei fornitori">
    Consentire ai plugin dei fornitori di registrare le implementazioni.
  </Step>
</Steps>

Questo approccio mantiene esplicita la titolarità evitando al contempo comportamenti del core che dipendano da un singolo fornitore o da un percorso di codice specifico di un plugin creato per un solo caso.

### Stratificazione delle funzionalità

Usare questo modello concettuale per decidere a quale livello appartiene il codice:

<Tabs>
  <Tab title="Livello delle funzionalità del core">
    Orchestrazione condivisa, criteri, fallback, regole di unione della configurazione, semantica di consegna e contratti tipizzati.
  </Tab>
  <Tab title="Livello dei plugin dei fornitori">
    API specifiche del fornitore, autenticazione, cataloghi dei modelli, sintesi vocale, generazione di immagini, backend video ed endpoint di utilizzo.
  </Tab>
  <Tab title="Livello dei plugin di canale o funzionalità">
    Integrazione con Discord/Slack/voice-call/ecc. che utilizza le funzionalità del core e le presenta su una superficie.
  </Tab>
</Tabs>

Per esempio, la sintesi vocale TTS segue questa struttura:

- il core gestisce i criteri TTS al momento della risposta, l'ordine dei fallback, le preferenze e la consegna al canale
- `elevenlabs`, `google`, `microsoft` e `openai` gestiscono le implementazioni della sintesi
- `voice-call` utilizza l'helper di runtime TTS per la telefonia

Lo stesso modello dovrebbe essere preferito per le funzionalità future.

### Esempio di plugin aziendale con più funzionalità

Un plugin aziendale dovrebbe apparire coeso dall'esterno. Se OpenClaw dispone di contratti condivisi per modelli, sintesi vocale, trascrizione in tempo reale, voce in tempo reale, comprensione multimediale, generazione di immagini, generazione di video, recupero web e ricerca web, un fornitore può gestire tutte le proprie superfici in un unico punto:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

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
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
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

Ciò che conta non sono i nomi esatti degli helper, ma la struttura:

- un unico plugin gestisce la superficie del fornitore
- il core continua a gestire i contratti delle funzionalità
- i canali e i plugin di funzionalità utilizzano gli helper `api.runtime.*`, non il codice del fornitore
- i test dei contratti possono verificare che il plugin abbia registrato le funzionalità che dichiara di gestire

### Esempio di funzionalità: comprensione dei video

OpenClaw considera già la comprensione di immagini/audio/video come un'unica funzionalità condivisa. Anche in questo caso si applica lo stesso modello di titolarità:

<Steps>
  <Step title="Il core definisce il contratto">
    Il core definisce il contratto di comprensione multimediale.
  </Step>
  <Step title="I plugin dei fornitori si registrano">
    I plugin dei fornitori registrano `describeImage`, `transcribeAudio` e `describeVideo`, secondo necessità.
  </Step>
  <Step title="Gli utilizzatori usano il comportamento condiviso">
    I canali e i plugin di funzionalità utilizzano il comportamento condiviso del core invece di collegarsi direttamente al codice del fornitore.
  </Step>
</Steps>

In questo modo si evita di incorporare nel core le ipotesi sui video di un singolo provider. Il plugin gestisce la superficie del fornitore; il core gestisce il contratto della funzionalità e il comportamento di fallback.

La generazione di video usa già la stessa sequenza: il core gestisce il contratto tipizzato della funzionalità e l'helper di runtime, mentre i plugin dei fornitori registrano le implementazioni `api.registerVideoGenerationProvider(...)` conformi a tale contratto.

Serve una lista di controllo concreta per l'implementazione? Consultare il [Manuale operativo delle funzionalità](/it/plugins/adding-capabilities).

## Contratti e applicazione

La superficie dell'API dei plugin è intenzionalmente tipizzata e centralizzata in `OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e gli helper di runtime su cui un plugin può fare affidamento.

Perché è importante:

- gli autori di plugin dispongono di un unico standard interno stabile
- il core può rifiutare proprietà duplicate, ad esempio quando due plugin registrano lo stesso ID provider
- all'avvio possono essere visualizzate informazioni diagnostiche utili per registrazioni non valide
- i test dei contratti possono verificare la proprietà dei plugin inclusi e impedire divergenze silenziose

L'applicazione delle regole avviene su due livelli:

<AccordionGroup>
  <Accordion title="Applicazione delle regole di registrazione a runtime">
    Il registro dei plugin convalida le registrazioni durante il caricamento dei plugin. Ad esempio, ID provider duplicati, ID provider vocali duplicati e registrazioni non valide producono informazioni diagnostiche sui plugin anziché un comportamento indefinito.
  </Accordion>
  <Accordion title="Test dei contratti">
    Durante l'esecuzione dei test, i plugin inclusi vengono acquisiti nei registri dei contratti, in modo che OpenClaw possa verificarne esplicitamente la proprietà. Attualmente questa funzionalità è utilizzata per i provider di modelli, i provider vocali, i provider di ricerca web e la proprietà delle registrazioni incluse.
  </Accordion>
</AccordionGroup>

L'effetto pratico è che OpenClaw sa in anticipo quale plugin è responsabile di ciascuna superficie. Ciò consente al core e ai canali di integrarsi senza discontinuità, perché la proprietà è dichiarata, tipizzata e verificabile tramite test anziché implicita.

### Cosa deve includere un contratto

<Tabs>
  <Tab title="Contratti validi">
    - tipizzati
    - piccoli
    - specifici per funzionalità
    - di proprietà del core
    - riutilizzabili da più plugin
    - utilizzabili da canali e funzionalità senza conoscere il fornitore

  </Tab>
  <Tab title="Contratti non validi">
    - criteri specifici del fornitore nascosti nel core
    - scappatoie specifiche per singoli plugin che aggirano il registro
    - codice dei canali che accede direttamente all'implementazione di un fornitore
    - oggetti di runtime ad hoc che non fanno parte di `OpenClawPluginApi` o `api.runtime`

  </Tab>
</Tabs>

In caso di dubbio, aumenta il livello di astrazione: definisci prima la funzionalità, quindi consenti ai plugin di integrarsi con essa.

## Modello di esecuzione

I plugin nativi di OpenClaw vengono eseguiti **all'interno del processo** insieme al Gateway. Non sono isolati in una sandbox. Un plugin nativo caricato condivide lo stesso confine di attendibilità a livello di processo del codice del core.

<Warning>
Implicazioni dei plugin nativi: un plugin può registrare strumenti, gestori di rete, hook e servizi; un bug in un plugin può causare l'arresto anomalo o l'instabilità del Gateway; inoltre, un plugin nativo dannoso equivale all'esecuzione di codice arbitrario all'interno del processo OpenClaw.
</Warning>

I pacchetti compatibili sono più sicuri per impostazione predefinita, perché OpenClaw attualmente li considera pacchetti di metadati e contenuti. Nelle versioni attuali, ciò riguarda principalmente le Skills incluse.

Utilizza elenchi di elementi consentiti e percorsi espliciti di installazione e caricamento per i plugin non inclusi. Considera i plugin dell'area di lavoro come codice destinato alla fase di sviluppo, non come impostazioni predefinite per la produzione.

Per i nomi dei pacchetti dell'area di lavoro inclusi, mantieni l'ID del plugin ancorato al nome npm: `@openclaw/<id>` per impostazione predefinita oppure un suffisso tipizzato approvato, come `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding`, quando il pacchetto espone intenzionalmente un ruolo di plugin più specifico.

<Note>
**Nota sull'attendibilità:** `plugins.allow` considera attendibili gli **ID dei plugin**, non la provenienza del codice sorgente. Un plugin dell'area di lavoro con lo stesso ID di un plugin incluso sostituisce intenzionalmente la copia inclusa quando tale plugin dell'area di lavoro è abilitato o inserito nell'elenco degli elementi consentiti. Questo comportamento è normale e utile per lo sviluppo locale, la verifica delle patch e le correzioni urgenti. L'attendibilità dei plugin inclusi viene determinata dall'istantanea del codice sorgente, ovvero dal manifesto e dal codice presenti sul disco al momento del caricamento, anziché dai metadati di installazione. Un record di installazione danneggiato o sostituito non può ampliare silenziosamente la superficie di attendibilità di un plugin incluso oltre quanto dichiarato dal codice sorgente effettivo.
</Note>

## Confine delle esportazioni

OpenClaw esporta funzionalità, non elementi pratici specifici dell'implementazione.

Mantieni pubblica la registrazione delle funzionalità. Riduci le esportazioni degli helper non incluse nel contratto:

- sottopercorsi di helper specifici dei plugin inclusi
- sottopercorsi dell'infrastruttura di runtime non destinati a essere API pubbliche
- helper pratici specifici dei fornitori
- helper di configurazione e onboarding che costituiscono dettagli di implementazione

I sottopercorsi riservati agli helper dei plugin inclusi sono stati rimossi dalla mappa delle esportazioni dell'SDK generata. Mantieni gli helper specifici del proprietario all'interno del pacchetto del plugin che ne è responsabile; promuovi a contratti SDK generici soltanto il comportamento dell'host riutilizzabile, come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

## Dettagli interni e riferimenti

Per la pipeline di caricamento, il modello del registro, gli hook di runtime dei provider, le route HTTP del Gateway, gli schemi degli strumenti di messaggistica, la risoluzione delle destinazioni dei canali, i cataloghi dei provider, i plugin del motore di contesto e la guida per aggiungere una nuova funzionalità, consulta [Dettagli interni dell'architettura dei plugin](/it/plugins/architecture-internals).

## Contenuti correlati

- [Creazione di plugin](/it/plugins/building-plugins)
- [Manifesto del plugin](/it/plugins/manifest)
- [Configurazione dell'SDK per i plugin](/it/plugins/sdk-setup)
