---
read_when:
    - Creare o fare debug di Plugin OpenClaw nativi
    - Capire il modello di capacità dei Plugin o i confini di ownership
    - Lavorare sulla pipeline di caricamento dei Plugin o sul registro
    - Implementare hook runtime di provider o Plugin di canale
sidebarTitle: Internals
summary: 'Interni dei Plugin: modello delle capacità, ownership, contratti, pipeline di caricamento e helper di runtime'
title: Interni dei Plugin
x-i18n:
    generated_at: "2026-04-24T08:51:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

Questo è il **riferimento architetturale approfondito** per il sistema di Plugin OpenClaw. Per
guide pratiche, inizia da una delle pagine mirate qui sotto.

<CardGroup cols={2}>
  <Card title="Installare e usare Plugin" icon="plug" href="/it/tools/plugin">
    Guida per utenti finali ad aggiunta, abilitazione e risoluzione dei problemi dei Plugin.
  </Card>
  <Card title="Creare Plugin" icon="rocket" href="/it/plugins/building-plugins">
    Tutorial del primo Plugin con il manifest funzionante più piccolo.
  </Card>
  <Card title="Plugin di canale" icon="comments" href="/it/plugins/sdk-channel-plugins">
    Crea un Plugin per canale di messaggistica.
  </Card>
  <Card title="Plugin provider" icon="microchip" href="/it/plugins/sdk-provider-plugins">
    Crea un Plugin provider di modelli.
  </Card>
  <Card title="Panoramica SDK" icon="book" href="/it/plugins/sdk-overview">
    Riferimento della mappa di importazione e dell’API di registrazione.
  </Card>
</CardGroup>

## Modello pubblico delle capacità

Le capacità sono il modello pubblico dei **Plugin nativi** dentro OpenClaw. Ogni
Plugin nativo OpenClaw si registra rispetto a uno o più tipi di capacità:

| Capacità              | Metodo di registrazione                         | Esempi di Plugin                    |
| --------------------- | ----------------------------------------------- | ----------------------------------- |
| Inferenza testuale    | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| Backend CLI di inferenza | `api.registerCliBackend(...)`                | `openai`, `anthropic`               |
| Voce                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Trascrizione realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Voce realtime         | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                  |
| Generazione immagini  | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale  | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Generazione video     | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Web fetch             | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Ricerca web           | `api.registerWebSearchProvider(...)`            | `google`                            |
| Canale / messaggistica | `api.registerChannel(...)`                     | `msteams`, `matrix`                 |
| Discovery del Gateway | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                           |

Un Plugin che registra zero capacità ma fornisce hook, strumenti, servizi di discovery
o servizi in background è un Plugin **legacy solo-hook**. Questo pattern
è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello delle capacità è integrato nel core e oggi viene usato dai Plugin
inclusi/nativi, ma la compatibilità dei Plugin esterni richiede ancora una soglia più stretta del semplice “è esportato, quindi è congelato”.

| Situazione del Plugin                           | Indicazione                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin esterni esistenti                        | Mantieni funzionanti le integrazioni basate su hook; questa è la baseline di compatibilità.     |
| Nuovi Plugin inclusi/nativi                     | Preferisci registrazione esplicita delle capacità invece di accessi specifici del vendor o nuovi design solo-hook. |
| Plugin esterni che adottano la registrazione per capacità | Consentito, ma tratta le superfici helper specifiche per capacità come evolutive salvo che la documentazione le segni come stabili. |

La registrazione delle capacità è la direzione voluta. Gli hook legacy restano il
percorso più sicuro senza rotture per i Plugin esterni durante la transizione. I sottopercorsi helper esportati non sono tutti uguali — preferisci contratti documentati e stretti invece di esportazioni helper incidentali.

### Forme dei Plugin

OpenClaw classifica ogni Plugin caricato in una forma basata sul suo effettivo
comportamento di registrazione (non solo sui metadati statici):

- **plain-capability**: registra esattamente un tipo di capacità (per esempio un
  Plugin solo-provider come `mistral`).
- **hybrid-capability**: registra più tipi di capacità (per esempio
  `openai` possiede inferenza testuale, voce, comprensione dei media e generazione
  di immagini).
- **hook-only**: registra solo hook (tipizzati o personalizzati), nessuna capacità,
  strumento, comando o servizio.
- **non-capability**: registra strumenti, comandi, servizi o route ma nessuna
  capacità.

Usa `openclaw plugins inspect <id>` per vedere la forma di un Plugin e il dettaglio
delle capacità. Vedi [Riferimento CLI](/it/cli/plugins#inspect) per i dettagli.

### Hook legacy

L’hook `before_agent_start` resta supportato come percorso di compatibilità per
Plugin solo-hook. I Plugin legacy reali dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per lavoro di override modello/provider
- preferire `before_prompt_build` per lavoro di mutazione del prompt
- rimuoverlo solo dopo che l’uso reale sarà calato e la copertura delle fixture avrà dimostrato sicurezza di migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` oppure `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                    | Significato                                                 |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | La configurazione viene analizzata correttamente e i Plugin si risolvono |
| **compatibility advisory** | Il Plugin usa un pattern supportato ma più vecchio (es. `hook-only`) |
| **legacy warning**         | Il Plugin usa `before_agent_start`, che è deprecato         |
| **hard error**             | La configurazione non è valida o il Plugin non è riuscito a caricarsi |

Né `hook-only` né `before_agent_start` romperanno oggi il tuo Plugin:
`hook-only` è solo informativo, e `before_agent_start` genera solo un avviso. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell’architettura

Il sistema di Plugin di OpenClaw ha quattro livelli:

1. **Manifest + discovery**
   OpenClaw trova i Plugin candidati dai percorsi configurati, dalle radici workspace,
   dalle radici globali dei Plugin e dai Plugin inclusi. La discovery legge prima i
   manifest nativi `openclaw.plugin.json` più i manifest dei bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un Plugin scoperto è abilitato, disabilitato, bloccato oppure
   selezionato per uno slot esclusivo come memory.
3. **Caricamento runtime**
   I Plugin nativi OpenClaw vengono caricati in-process tramite jiti e registrano
   capacità in un registro centrale. I bundle compatibili vengono normalizzati in
   record di registro senza importare codice runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione
   provider, hook, route HTTP, comandi CLI e servizi.

Per la CLI dei Plugin in particolare, la discovery del comando root è divisa in due fasi:

- i metadati parse-time provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del Plugin può restare lazy e registrarsi alla prima invocazione

Questo permette di mantenere il codice CLI del Plugin dentro il Plugin pur lasciando a OpenClaw
la possibilità di riservare i nomi dei comandi root prima del parsing.

Il confine progettuale importante:

- discovery + validazione della configurazione dovrebbero funzionare da **metadati manifest/schema**
  senza eseguire codice del Plugin
- il comportamento runtime nativo proviene dal percorso `register(api)` del modulo Plugin

Questa separazione permette a OpenClaw di validare la configurazione, spiegare Plugin mancanti/disabilitati e
costruire suggerimenti UI/schema prima che il runtime completo sia attivo.

### Pianificazione dell’attivazione

La pianificazione dell’attivazione fa parte del control plane. I chiamanti possono chiedere quali Plugin
sono rilevanti per un comando concreto, provider, canale, route, harness agente o
capacità prima di caricare registri runtime più ampi.

Il planner mantiene compatibile il comportamento attuale del manifest:

- i campi `activation.*` sono suggerimenti espliciti per il planner
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` e gli hook restano fallback di ownership del manifest
- l’API planner solo-id resta disponibile per i chiamanti esistenti
- l’API plan riporta etichette di motivo così la diagnostica può distinguere suggerimenti espliciti dal fallback di ownership

Non trattare `activation` come hook di ciclo di vita o come sostituto di
`register(...)`. È metadato usato per restringere il caricamento. Preferisci i campi di ownership
quando descrivono già la relazione; usa `activation` solo per suggerimenti aggiuntivi del planner.

### Plugin di canale e strumento di messaggio condiviso

I Plugin di canale non devono registrare uno strumento separato send/edit/react per
le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e
i Plugin di canale possiedono la discovery e l’esecuzione specifiche del canale dietro di esso.

Il confine attuale è:

- il core possiede l’host dello strumento `message` condiviso, il wiring del prompt, il bookkeeping di sessione/thread
  e il dispatch di esecuzione
- i Plugin di canale possiedono la discovery di azioni con scope, la discovery delle capacità
  e gli eventuali frammenti di schema specifici del canale
- i Plugin di canale possiedono la grammatica della conversazione di sessione specifica del provider, per esempio
  come gli ID conversazione codificano gli ID thread o ereditano dalle conversazioni padre
- i Plugin di canale eseguono l’azione finale tramite il loro action adapter

Per i Plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di discovery unificata permette a un Plugin di restituire insieme azioni visibili, capacità e contributi di schema
così questi elementi non divergono tra loro.

Quando un parametro dello strumento messaggio specifico del canale contiene una sorgente media come un
percorso locale o un URL media remoto, il Plugin dovrebbe restituire anche
`mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito per applicare la normalizzazione dei percorsi sandbox e i suggerimenti di accesso ai media in uscita
senza hardcodare nomi di parametri posseduti dal Plugin.
Preferisci in quel caso mappe con scope di azione, non un unico elenco piatto a livello canale, così un
parametro media relativo solo a un profilo non viene normalizzato su azioni non correlate come
`send`.

Il core passa lo scope runtime in quel passaggio di discovery. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- trusted inbound `requesterSenderId`

Questo è importante per i Plugin sensibili al contesto. Un canale può nascondere o esporre
azioni di messaggio in base all’account attivo, alla stanza/thread/messaggio corrente o
all’identità trusted del richiedente senza hardcodare diramazioni specifiche del canale nello strumento
`message` del core.

Per questo le modifiche di instradamento dell’embedded runner restano comunque lavoro del Plugin: il runner è
responsabile di inoltrare l’identità corrente di chat/sessione nel confine di discovery del Plugin così lo strumento `message` condiviso esponga la superficie posseduta dal canale corretta per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i Plugin inclusi dovrebbero mantenere il runtime di esecuzione
dentro i propri moduli extension. Il core non possiede più i runtime di azione messaggio Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i Plugin inclusi
dovrebbero importare direttamente il proprio codice runtime locale dai moduli posseduti
dall’extension.

Lo stesso confine si applica in generale alle seam SDK con nome provider: il core non dovrebbe
importare barrel di convenienza specifici del canale per Slack, Discord, Signal,
WhatsApp o extension simili. Se il core ha bisogno di un comportamento, deve o consumare il
barrel `api.ts` / `runtime-api.ts` del Plugin incluso stesso oppure promuovere il bisogno
in una capacità generica stretta nell’SDK condiviso.

Per i sondaggi in particolare, esistono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che rientrano nel modello
  comune di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per la semantica dei sondaggi specifica del canale o per parametri aggiuntivi del sondaggio

Il core ora rimanda il parsing condiviso dei sondaggi finché il dispatch del sondaggio del Plugin non rifiuta
l’azione, così i gestori dei sondaggi posseduti dal Plugin possono accettare campi di sondaggio specifici del canale
senza essere bloccati prima dal parser generico dei sondaggi.

Vedi [Interni dell’architettura dei Plugin](/it/plugins/architecture-internals) per la sequenza completa di avvio.

## Modello di ownership delle capacità

OpenClaw tratta un Plugin nativo come confine di ownership per un’**azienda** o una
**funzionalità**, non come un insieme casuale di integrazioni non correlate.

Questo significa:

- un Plugin aziendale dovrebbe di solito possedere tutte le superfici OpenClaw rivolte a quell’azienda
- un Plugin di funzionalità dovrebbe di solito possedere l’intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità condivise del core invece di reimplementare
  in modo ad hoc il comportamento del provider

<Accordion title="Esempi di pattern di ownership tra i Plugin inclusi">
  - **Vendor multi-capacità**: `openai` possiede inferenza testuale, voce, realtime
    voice, comprensione dei media e generazione di immagini. `google` possiede inferenza testuale
    più comprensione dei media, generazione di immagini e ricerca web.
    `qwen` possiede inferenza testuale più comprensione dei media e generazione video.
  - **Vendor a capacità singola**: `elevenlabs` e `microsoft` possiedono la voce;
    `firecrawl` possiede il web-fetch; `minimax` / `mistral` / `moonshot` / `zai` possiedono
    backend di comprensione dei media.
  - **Plugin di funzionalità**: `voice-call` possiede trasporto delle chiamate, strumenti, CLI, route
    e bridging Twilio media-stream, ma consuma capacità condivise di speech, realtime
    transcription e realtime voice invece di importare direttamente i Plugin vendor.
</Accordion>

Lo stato finale desiderato è:

- OpenAI vive in un solo Plugin anche se copre modelli testuali, voce, immagini e
  in futuro video
- un altro vendor può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale Plugin vendor possiede il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di ownership
- **capability** = contratto core che più Plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
“quale provider dovrebbe hardcodare la gestione video?” La prima domanda è “qual è
il contratto core della capacità video?” Una volta che quel contratto esiste, i Plugin vendor
possono registrarsi rispetto ad esso e i Plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa giusta di solito è:

1. definire la capacità mancante nel core
2. esporla attraverso l’API/runtime Plugin in modo tipizzato
3. collegare canali/funzionalità a quella capacità
4. lasciare che i Plugin vendor registrino le implementazioni

Questo mantiene esplicita l’ownership evitando al tempo stesso comportamenti del core che dipendono da un
singolo vendor o da un percorso di codice specifico per Plugin isolati.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove collocare il codice:

- **layer di capacità core**: orchestrazione condivisa, policy, fallback, regole di merge della configurazione,
  semantica di consegna e contratti tipizzati
- **layer Plugin vendor**: API vendor-specifiche, autenticazione, cataloghi modelli, sintesi vocale,
  generazione immagini, futuri backend video, endpoint di utilizzo
- **layer Plugin di canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma capacità core e le presenta su una superficie

Per esempio, TTS segue questa forma:

- il core possiede la policy TTS a tempo di risposta, ordine di fallback, preferenze e consegna sui canali
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l’helper runtime TTS per la telefonia

Lo stesso pattern dovrebbe essere preferito per le capacità future.

### Esempio di Plugin aziendale multi-capacità

Un Plugin aziendale dovrebbe apparire coeso dall’esterno. Se OpenClaw ha contratti condivisi
per modelli, voce, trascrizione realtime, voce realtime, comprensione dei media,
generazione immagini, generazione video, web fetch e ricerca web,
un vendor può possedere tutte le sue superfici in un unico punto:

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

Quello che conta non sono i nomi esatti degli helper. Conta la forma:

- un Plugin possiede la superficie del vendor
- il core possiede comunque i contratti di capacità
- i canali e i Plugin di funzionalità consumano helper `api.runtime.*`, non codice vendor
- i test di contratto possono verificare che il Plugin abbia registrato le capacità che
  afferma di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagine/audio/video come un’unica
capacità condivisa. Lo stesso modello di ownership si applica anche qui:

1. il core definisce il contratto di media-understanding
2. i Plugin vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` a seconda dei casi
3. i Plugin di canale e funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice del vendor

Questo evita di incorporare nel core le assunzioni video di un solo provider. Il Plugin possiede
la superficie del vendor; il core possiede il contratto di capacità e il comportamento di fallback.

La generazione video usa già quella stessa sequenza: il core possiede il contratto tipizzato
della capacità e l’helper runtime, e i Plugin vendor registrano implementazioni
`api.registerVideoGenerationProvider(...)` rispetto ad esso.

Hai bisogno di una checklist concreta di rollout? Vedi
[Capability Cookbook](/it/plugins/architecture).

## Contratti e enforcement

La superficie dell’API Plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Quel contratto definisce i punti di registrazione supportati e
gli helper runtime su cui un Plugin può fare affidamento.

Perché è importante:

- gli autori di Plugin ottengono uno standard interno stabile
- il core può rifiutare ownership duplicate come due Plugin che registrano lo stesso
  provider id
- l’avvio può mostrare diagnostica utilizzabile per registrazioni malformate
- i test di contratto possono imporre l’ownership dei Plugin inclusi e prevenire derive silenziose

Esistono due livelli di enforcement:

1. **enforcement della registrazione a runtime**
   Il registro Plugin valida le registrazioni durante il caricamento dei Plugin. Esempi:
   ID provider duplicati, ID provider speech duplicati e registrazioni malformate
   producono diagnostica dei Plugin invece di comportamento indefinito.
2. **test di contratto**
   I Plugin inclusi vengono acquisiti in registri di contratto durante i test, così
   OpenClaw può verificare esplicitamente l’ownership. Oggi questo viene usato per model
   providers, speech providers, web search providers e ownership di registrazione inclusa.

L’effetto pratico è che OpenClaw sa in anticipo quale Plugin possiede quale
superficie. Questo permette a core e canali di comporsi senza attriti perché l’ownership è
dichiarata, tipizzata e verificabile invece che implicita.

### Cosa appartiene a un contratto

I buoni contratti Plugin sono:

- tipizzati
- piccoli
- specifici della capacità
- posseduti dal core
- riutilizzabili da più Plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti Plugin sono:

- policy vendor-specifiche nascoste nel core
- vie di fuga specifiche di un singolo Plugin che bypassano il registro
- codice del canale che accede direttamente a un’implementazione vendor
- oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` oppure
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi
lascia che i Plugin si colleghino ad essa.

## Modello di esecuzione

I Plugin nativi OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono
messi in sandbox. Un Plugin nativo caricato ha lo stesso confine di fiducia a livello processo del
codice core.

Implicazioni:

- un Plugin nativo può registrare strumenti, handler di rete, hook e servizi
- un bug in un Plugin nativo può far crashare o destabilizzare il gateway
- un Plugin nativo malevolo equivale a esecuzione di codice arbitrario dentro
  il processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa soprattutto
Skills incluse.

Usa allowlist e percorsi espliciti di installazione/caricamento per i Plugin non inclusi. Tratta
i Plugin del workspace come codice da tempo di sviluppo, non come impostazione predefinita di produzione.

Per i nomi dei pacchetti workspace inclusi, mantieni l’ID Plugin ancorato nel nome
npm: `@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo Plugin più ristretto.

Nota importante sulla fiducia:

- `plugins.allow` si fida degli **id Plugin**, non della provenienza della sorgente.
- Un Plugin workspace con lo stesso id di un Plugin incluso oscura intenzionalmente
  la copia inclusa quando quel Plugin workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.
- La fiducia nei Plugin inclusi viene risolta dallo snapshot della sorgente — il manifest e il
  codice su disco al momento del caricamento — invece che dai metadati di installazione. Un record di installazione corrotto o sostituito non può ampliare silenziosamente la superficie di fiducia di un Plugin incluso oltre ciò che la sorgente reale dichiara.

## Confine di esportazione

OpenClaw esporta capacità, non comodità di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici del Plugin incluso
- sottopercorsi di plumbing runtime non pensati come API pubblica
- helper di convenienza vendor-specifici
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei Plugin inclusi restano comunque nella mappa di esportazione SDK generata per compatibilità e manutenzione dei Plugin inclusi. Esempi correnti includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diverse seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come pattern SDK consigliato per
nuovi Plugin di terze parti.

## Interni e riferimento

Per la pipeline di caricamento, il modello di registro, gli hook runtime dei provider, le route HTTP del Gateway,
gli schemi dello strumento message, la risoluzione delle destinazioni dei canali, i cataloghi provider,
i Plugin motore di contesto e la guida per aggiungere una nuova capacità, vedi
[Interni dell’architettura dei Plugin](/it/plugins/architecture-internals).

## Correlati

- [Creare Plugin](/it/plugins/building-plugins)
- [Configurazione SDK Plugin](/it/plugins/sdk-setup)
- [Manifest Plugin](/it/plugins/manifest)
