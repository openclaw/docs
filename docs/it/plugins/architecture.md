---
read_when:
    - Creazione o debug di Plugin nativi OpenClaw
    - Comprendere il modello di capacità dei Plugin o i confini di proprietà
    - Lavorare sulla pipeline di caricamento o sul registro dei Plugin
    - Implementazione di hook runtime dei provider o Plugin di canale
sidebarTitle: Internals
summary: 'Dettagli interni dei Plugin: modello di capacità, proprietà, contratti, pipeline di caricamento e helper runtime'
title: Dettagli interni dei Plugin
x-i18n:
    generated_at: "2026-04-26T11:33:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
    source_path: plugins/architecture.md
    workflow: 15
---

Questo è il **riferimento architetturale approfondito** per il sistema Plugin di OpenClaw. Per guide pratiche, inizia da una delle pagine mirate qui sotto.

<CardGroup cols={2}>
  <Card title="Installare e usare Plugin" icon="plug" href="/it/tools/plugin">
    Guida per utenti finali per aggiungere, abilitare e risolvere i problemi dei Plugin.
  </Card>
  <Card title="Creare Plugin" icon="rocket" href="/it/plugins/building-plugins">
    Tutorial del primo Plugin con il manifest funzionante più piccolo.
  </Card>
  <Card title="Plugin di canale" icon="comments" href="/it/plugins/sdk-channel-plugins">
    Crea un Plugin per canale di messaggistica.
  </Card>
  <Card title="Plugin di provider" icon="microchip" href="/it/plugins/sdk-provider-plugins">
    Crea un Plugin provider di modelli.
  </Card>
  <Card title="Panoramica SDK" icon="book" href="/it/plugins/sdk-overview">
    Riferimento alla mappa di import e all'API di registrazione.
  </Card>
</CardGroup>

## Modello pubblico delle capacità

Le capacità sono il modello pubblico dei **Plugin nativi** all'interno di OpenClaw. Ogni Plugin nativo OpenClaw si registra rispetto a uno o più tipi di capacità:

| Capacità              | Metodo di registrazione                         | Plugin di esempio                    |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferenza testuale    | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend CLI di inferenza | `api.registerCliBackend(...)`                | `openai`, `anthropic`                |
| Voce                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Trascrizione realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Voce realtime         | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Generazione immagini  | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale  | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generazione video     | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Recupero Web          | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Ricerca Web           | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canale / messaggistica | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |
| Individuazione Gateway | `api.registerGatewayDiscoveryService(...)`     | `bonjour`                            |

<Note>
Un Plugin che registra zero capacità ma fornisce hook, strumenti, servizi di discovery o servizi in background è un Plugin **legacy solo hook**. Questo schema è ancora pienamente supportato.
</Note>

### Posizione sulla compatibilità esterna

Il modello di capacità è stato integrato nel core ed è usato oggi dai Plugin inclusi/nativi, ma la compatibilità dei Plugin esterni richiede ancora una soglia più rigorosa di "se è esportato, allora è congelato".

| Situazione del Plugin                           | Indicazioni                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Plugin esterni esistenti                        | Mantieni funzionanti le integrazioni basate su hook; questa è la baseline di compatibilità.    |
| Nuovi Plugin inclusi/nativi                     | Preferisci la registrazione esplicita delle capacità invece di reach-in specifici del vendor o nuovi design solo hook. |
| Plugin esterni che adottano la registrazione di capacità | Consentito, ma tratta le superfici helper specifiche delle capacità come in evoluzione a meno che la documentazione non le segni come stabili. |

La registrazione delle capacità è la direzione prevista. Gli hook legacy restano il percorso più sicuro per evitare rotture nei Plugin esterni durante la transizione. I sottopercorsi helper esportati non sono tutti equivalenti — preferisci contratti documentati e stretti invece di esportazioni helper incidentali.

### Forme dei Plugin

OpenClaw classifica ogni Plugin caricato in una forma in base al suo effettivo comportamento di registrazione (non solo ai metadati statici):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra esattamente un tipo di capacità (ad esempio un Plugin solo provider come `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra più tipi di capacità (ad esempio `openai` possiede inferenza testuale, voce, comprensione dei media e generazione immagini).
  </Accordion>
  <Accordion title="hook-only">
    Registra solo hook (tipizzati o personalizzati), nessuna capacità, strumenti, comandi o servizi.
  </Accordion>
  <Accordion title="non-capability">
    Registra strumenti, comandi, servizi o route ma nessuna capacità.
  </Accordion>
</AccordionGroup>

Usa `openclaw plugins inspect <id>` per vedere la forma di un Plugin e la suddivisione delle capacità. Vedi [Riferimento CLI](/it/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per i Plugin solo hook. Plugin reali legacy continuano a dipendere da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo che l'uso reale sarà diminuito e la copertura dei fixture avrà dimostrato sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere una di queste etichette:

| Segnale                   | Significato                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configurazione viene analizzata correttamente e i Plugin vengono risolti |
| **compatibility advisory** | Il Plugin usa uno schema supportato ma più vecchio (ad esempio `hook-only`) |
| **legacy warning**        | Il Plugin usa `before_agent_start`, che è deprecato          |
| **hard error**            | La configurazione non è valida o il Plugin non è stato caricato |

Né `hook-only` né `before_agent_start` romperanno oggi il tuo Plugin: `hook-only` è solo informativo e `before_agent_start` genera solo un warning. Questi segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema Plugin di OpenClaw ha quattro livelli:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw trova i Plugin candidati da percorsi configurati, root del workspace, root globali dei Plugin e Plugin inclusi. La discovery legge prima i manifest nativi `openclaw.plugin.json` più i manifest bundle supportati.
  </Step>
  <Step title="Abilitazione + validazione">
    Il core decide se un Plugin scoperto è abilitato, disabilitato, bloccato o selezionato per uno slot esclusivo come la memory.
  </Step>
  <Step title="Caricamento runtime">
    I Plugin nativi OpenClaw vengono caricati in-process tramite jiti e registrano le capacità in un registro centrale. I bundle compatibili vengono normalizzati in record di registro senza importare codice runtime.
  </Step>
  <Step title="Consumo della superficie">
    Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione dei provider, hook, route HTTP, comandi CLI e servizi.
  </Step>
</Steps>

Per la CLI dei Plugin in particolare, la discovery del comando root è divisa in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del Plugin può restare lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI di proprietà del Plugin all'interno del Plugin stesso consentendo comunque a OpenClaw di riservare i nomi dei comandi root prima del parsing.

Il confine di progettazione importante:

- la validazione manifest/config dovrebbe funzionare dai **metadati manifest/schema** senza eseguire il codice del Plugin
- la discovery nativa delle capacità può caricare il codice entry del Plugin attendibile per costruire uno snapshot non attivante del registro
- il comportamento runtime nativo proviene dal percorso `register(api)` del modulo Plugin con `api.registrationMode === "full"`

Questa separazione consente a OpenClaw di validare la configurazione, spiegare Plugin mancanti/disabilitati e costruire suggerimenti UI/schema prima che il runtime completo sia attivo.

### Pianificazione dell'attivazione

La pianificazione dell'attivazione fa parte del control plane. I chiamanti possono chiedere quali Plugin siano rilevanti per un comando concreto, provider, canale, route, harness agente o capacità prima di caricare registri runtime più ampi.

Il planner mantiene compatibile il comportamento attuale dei manifest:

- i campi `activation.*` sono suggerimenti espliciti del planner
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e gli hook restano fallback di proprietà del manifest
- l'API planner solo-id resta disponibile per i chiamanti esistenti
- l'API plan riporta etichette di motivo così la diagnostica può distinguere i suggerimenti espliciti dal fallback di proprietà

<Warning>
Non trattare `activation` come un hook del ciclo di vita o un sostituto di `register(...)`. Sono metadati usati per restringere il caricamento. Preferisci i campi di proprietà quando descrivono già la relazione; usa `activation` solo per suggerimenti aggiuntivi del planner.
</Warning>

### Plugin di canale e lo strumento condiviso dei messaggi

I Plugin di canale non devono registrare uno strumento separato send/edit/react per le normali azioni di chat. OpenClaw mantiene nel core un unico strumento condiviso `message` e i Plugin di canale possiedono la discovery e l'esecuzione specifiche del canale dietro di esso.

Il confine attuale è:

- il core possiede l'host dello strumento condiviso `message`, il wiring del prompt, il bookkeeping di sessione/thread e il dispatch di esecuzione
- i Plugin di canale possiedono la discovery delle azioni con scope, la discovery delle capacità e qualsiasi frammento di schema specifico del canale
- i Plugin di canale possiedono la grammatica della conversazione di sessione specifica del provider, ad esempio come gli id conversazione codificano gli id thread o ereditano da conversazioni padre
- i Plugin di canale eseguono l'azione finale tramite il loro adattatore di azione

Per i Plugin di canale, la superficie SDK è `ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di discovery unificata consente a un Plugin di restituire insieme le sue azioni visibili, le capacità e i contributi di schema, così queste parti non divergono.

Quando un parametro dello strumento message specifico del canale trasporta una sorgente media come un percorso locale o un URL media remoto, il Plugin dovrebbe anche restituire `mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito per applicare la normalizzazione dei percorsi del sandbox e i suggerimenti di accesso ai media in uscita senza hardcodare nomi di parametri posseduti dal Plugin. Preferisci lì mappe con scope per azione, non un unico elenco piatto a livello di canale, così un parametro media solo profilo non viene normalizzato su azioni non correlate come `send`.

Il core passa lo scope runtime in quel passaggio di discovery. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` trusted inbound

Questo è importante per i Plugin sensibili al contesto. Un canale può nascondere o esporre azioni di message in base all'account attivo, alla stanza/thread/messaggio corrente o all'identità trusted del richiedente senza hardcodare rami specifici del canale nello strumento core `message`.

Questo è il motivo per cui le modifiche all'instradamento dell'embedded-runner restano lavoro da Plugin: il runner è responsabile dell'inoltro dell'identità corrente di chat/sessione al confine di discovery del Plugin così lo strumento condiviso `message` espone la giusta superficie posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i Plugin inclusi dovrebbero mantenere il runtime di esecuzione dentro i propri moduli di estensione. Il core non possiede più i runtime di azione dei messaggi Discord, Slack, Telegram o WhatsApp sotto `src/agents/tools`. Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime` e i Plugin inclusi dovrebbero importare direttamente il proprio codice runtime locale dai rispettivi moduli di estensione.

Lo stesso confine si applica in generale ai punti di giunzione SDK denominati dal provider: il core non dovrebbe importare barrel di convenienza specifici di canale per estensioni come Slack, Discord, Signal, WhatsApp o simili. Se il core ha bisogno di un comportamento, dovrebbe o consumare il barrel `api.ts` / `runtime-api.ts` del Plugin incluso stesso oppure promuovere l'esigenza a una capacità generica e ristretta nell'SDK condiviso.

Per i poll in particolare, esistono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che rientrano nel modello comune di poll
- `actions.handleAction("poll")` è il percorso preferito per semantiche di poll specifiche del canale o parametri extra del poll

Il core ora rinvia il parsing condiviso dei poll fino a quando il dispatch del poll del Plugin non rifiuta l'azione, così gli handler di poll posseduti dal Plugin possono accettare campi di poll specifici del canale senza essere bloccati prima dal parser generico dei poll.

Vedi [Dettagli interni dell'architettura Plugin](/it/plugins/architecture-internals) per la sequenza completa di avvio.

## Modello di proprietà delle capacità

OpenClaw tratta un Plugin nativo come il confine di proprietà di una **azienda** o di una **funzionalità**, non come una raccolta eterogenea di integrazioni non correlate.

Questo significa:

- un Plugin aziendale dovrebbe di solito possedere tutte le superfici OpenClaw rivolte a quell'azienda
- un Plugin di funzionalità dovrebbe di solito possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare le capacità condivise del core invece di reimplementare ad hoc il comportamento dei provider

<AccordionGroup>
  <Accordion title="Vendor multi-capacità">
    `openai` possiede inferenza testuale, voce, voce realtime, comprensione dei media e generazione immagini. `google` possiede inferenza testuale più comprensione dei media, generazione immagini e ricerca Web. `qwen` possiede inferenza testuale più comprensione dei media e generazione video.
  </Accordion>
  <Accordion title="Vendor mono-capacità">
    `elevenlabs` e `microsoft` possiedono la voce; `firecrawl` possiede il recupero Web; `minimax` / `mistral` / `moonshot` / `zai` possiedono backend di comprensione dei media.
  </Accordion>
  <Accordion title="Plugin di funzionalità">
    `voice-call` possiede trasporto chiamata, strumenti, CLI, route e bridging dello stream media Twilio, ma consuma le capacità condivise di voce, trascrizione realtime e voce realtime invece di importare direttamente i Plugin vendor.
  </Accordion>
</AccordionGroup>

Lo stato finale previsto è:

- OpenAI vive in un unico Plugin anche se copre modelli testuali, voce, immagini e futuro video
- un altro vendor può fare lo stesso per la propria area di superficie
- i canali non si curano di quale Plugin vendor possieda il provider; consumano il contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **Plugin** = confine di proprietà
- **capacità** = contratto del core che più Plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è "quale provider dovrebbe hardcodare la gestione video?" La prima domanda è "qual è il contratto di capacità video del core?" Una volta che quel contratto esiste, i Plugin vendor possono registrarsi rispetto a esso e i Plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, di solito la mossa corretta è:

<Steps>
  <Step title="Definisci la capacità">
    Definisci la capacità mancante nel core.
  </Step>
  <Step title="Esponila tramite l'SDK">
    Esponila in modo tipizzato tramite l'API/runtime dei Plugin.
  </Step>
  <Step title="Collega i consumatori">
    Collega canali/funzionalità a quella capacità.
  </Step>
  <Step title="Implementazioni vendor">
    Lascia che i Plugin vendor registrino implementazioni.
  </Step>
</Steps>

Questo mantiene esplicita la proprietà evitando allo stesso tempo un comportamento del core che dipenda da un singolo vendor o da un percorso di codice una tantum specifico del Plugin.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove deve stare il codice:

<Tabs>
  <Tab title="Livello capacità del core">
    Orchestrazione condivisa, policy, fallback, regole di merge della configurazione, semantica di consegna e contratti tipizzati.
  </Tab>
  <Tab title="Livello Plugin vendor">
    API specifiche del vendor, autenticazione, cataloghi di modelli, sintesi vocale, generazione immagini, futuri backend video, endpoint d'uso.
  </Tab>
  <Tab title="Livello Plugin di canale/funzionalità">
    Integrazione Slack/Discord/voice-call/ecc. che consuma le capacità del core e le presenta su una superficie.
  </Tab>
</Tabs>

Ad esempio, il TTS segue questa forma:

- il core possiede policy TTS al momento della risposta, ordine di fallback, preferenze e consegna sul canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni della sintesi
- `voice-call` consuma l'helper runtime TTS per telefonia

Lo stesso schema dovrebbe essere preferito per le capacità future.

### Esempio di Plugin aziendale multi-capacità

Un Plugin aziendale dovrebbe apparire coeso dall'esterno. Se OpenClaw ha contratti condivisi per modelli, voce, trascrizione realtime, voce realtime, comprensione dei media, generazione immagini, generazione video, recupero Web e ricerca Web, un vendor può possedere tutte le sue superfici in un unico punto:

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
      // hook di autenticazione/catalogo modelli/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configurazione voce vendor — implementa direttamente l'interfaccia SpeechProviderPlugin
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
        // logica credenziali + fetch
      }),
    );
  },
};

export default plugin;
```

Ciò che conta non sono i nomi esatti degli helper. Conta la forma:

- un solo Plugin possiede la superficie vendor
- il core possiede comunque i contratti di capacità
- i canali e i Plugin di funzionalità consumano gli helper `api.runtime.*`, non il codice vendor
- i test di contratto possono verificare che il Plugin abbia registrato le capacità che dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica capacità condivisa. Lo stesso modello di proprietà si applica anche qui:

<Steps>
  <Step title="Il core definisce il contratto">
    Il core definisce il contratto di comprensione dei media.
  </Step>
  <Step title="I Plugin vendor si registrano">
    I Plugin vendor registrano `describeImage`, `transcribeAudio` e `describeVideo` secondo necessità.
  </Step>
  <Step title="I consumatori usano il comportamento condiviso">
    I canali e i Plugin di funzionalità consumano il comportamento condiviso del core invece di collegarsi direttamente al codice vendor.
  </Step>
</Steps>

Questo evita di incorporare nel core le assunzioni video di un singolo provider. Il Plugin possiede la superficie vendor; il core possiede il contratto di capacità e il comportamento di fallback.

La generazione video usa già questa stessa sequenza: il core possiede il contratto di capacità tipizzato e l'helper runtime, e i Plugin vendor registrano rispetto a esso implementazioni `api.registerVideoGenerationProvider(...)`.

Hai bisogno di una checklist concreta di rollout? Vedi [Capability Cookbook](/it/plugins/architecture).

## Contratti e applicazione

La superficie API dei Plugin è intenzionalmente tipizzata e centralizzata in `OpenClawPluginApi`. Quel contratto definisce i punti di registrazione supportati e gli helper runtime su cui un Plugin può fare affidamento.

Perché è importante:

- gli autori di Plugin hanno un unico standard interno stabile
- il core può rifiutare proprietà duplicate come due Plugin che registrano lo stesso id provider
- l'avvio può mostrare diagnostica utile per registrazioni malformate
- i test di contratto possono applicare la proprietà dei Plugin inclusi ed evitare derive silenziose

Esistono due livelli di applicazione:

<AccordionGroup>
  <Accordion title="Applicazione della registrazione a runtime">
    Il registro dei Plugin valida le registrazioni mentre i Plugin vengono caricati. Esempi: id provider duplicati, id provider voce duplicati e registrazioni malformate producono diagnostica dei Plugin invece di comportamento indefinito.
  </Accordion>
  <Accordion title="Test di contratto">
    I Plugin inclusi vengono acquisiti nei registri di contratto durante le esecuzioni di test così OpenClaw può dichiarare esplicitamente la proprietà. Oggi questo è usato per provider di modelli, provider voce, provider di ricerca Web e proprietà di registrazione dei Plugin inclusi.
  </Accordion>
</AccordionGroup>

L'effetto pratico è che OpenClaw sa, in anticipo, quale Plugin possiede quale superficie. Questo consente al core e ai canali di comporsi senza attriti perché la proprietà è dichiarata, tipizzata e verificabile invece che implicita.

### Cosa appartiene a un contratto

<Tabs>
  <Tab title="Buoni contratti">
    - tipizzati
    - piccoli
    - specifici della capacità
    - di proprietà del core
    - riutilizzabili da più Plugin
    - consumabili da canali/funzionalità senza conoscenza del vendor

  </Tab>
  <Tab title="Cattivi contratti">
    - policy specifica del vendor nascosta nel core
    - escape hatch one-off del Plugin che aggirano il registro
    - codice del canale che entra direttamente in un'implementazione vendor
    - oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o `api.runtime`

  </Tab>
</Tabs>

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi lascia che i Plugin vi si colleghino.

## Modello di esecuzione

I Plugin nativi OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono in sandbox. Un Plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del codice core.

<Warning>
Implicazioni:

- un Plugin nativo può registrare strumenti, handler di rete, hook e servizi
- un bug in un Plugin nativo può causare crash o destabilizzare il gateway
- un Plugin nativo malevolo equivale a esecuzione arbitraria di codice dentro il processo OpenClaw

</Warning>

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw al momento li tratta come pacchetti di metadati/contenuti. Nelle release attuali, questo significa soprattutto Skills incluse.

Usa allowlist e percorsi espliciti di installazione/caricamento per i Plugin non inclusi. Tratta i Plugin del workspace come codice di sviluppo, non come valori predefiniti di produzione.

Per i nomi dei package workspace inclusi, mantieni l'id Plugin ancorato al nome npm: `@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come `-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando il package espone intenzionalmente un ruolo Plugin più ristretto.

<Note>
**Nota sulla fiducia:**

- `plugins.allow` si fida degli **id Plugin**, non della provenienza della sorgente.
- Un Plugin del workspace con lo stesso id di un Plugin incluso oscura intenzionalmente la copia inclusa quando quel Plugin del workspace è abilitato/presente nella allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.
- La fiducia nei Plugin inclusi viene risolta dallo snapshot della sorgente — il manifest e il codice presenti sul disco al momento del caricamento — piuttosto che dai metadati di installazione. Un record di installazione corrotto o sostituito non può ampliare silenziosamente la superficie di fiducia di un Plugin incluso oltre quanto dichiarato dalla sorgente reale.

</Note>

## Confine di esportazione

OpenClaw esporta capacità, non comodità di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici dei Plugin inclusi
- sottopercorsi di plumbing runtime non pensati come API pubblica
- helper di convenienza specifici del vendor
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei Plugin inclusi restano ancora nella mappa di esportazione SDK generata per compatibilità e manutenzione dei Plugin inclusi. Esempi attuali includono `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e diversi punti di giunzione `plugin-sdk/matrix*`. Trattali come esportazioni riservate di dettaglio implementativo, non come pattern SDK consigliato per nuovi Plugin di terze parti.

## Interni e riferimento

Per la pipeline di caricamento, il modello di registro, gli hook runtime dei provider, le route HTTP del Gateway, gli schema dello strumento message, la risoluzione delle destinazioni di canale, i cataloghi dei provider, i Plugin di motore di contesto e la guida per aggiungere una nuova capacità, vedi [Dettagli interni dell'architettura Plugin](/it/plugins/architecture-internals).

## Correlati

- [Creare Plugin](/it/plugins/building-plugins)
- [Manifest Plugin](/it/plugins/manifest)
- [Configurazione SDK Plugin](/it/plugins/sdk-setup)
