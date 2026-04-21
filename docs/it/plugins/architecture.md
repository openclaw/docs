---
read_when:
    - Sviluppare o fare debug dei Plugin nativi di OpenClaw
    - Capire il modello di capability dei Plugin o i confini di ownership
    - Lavorare sulla pipeline di caricamento o sul registro dei Plugin
    - Implementare hook runtime dei provider o Plugin di canale
sidebarTitle: Internals
summary: 'Interni dei Plugin: modello di capability, ownership, contratti, pipeline di caricamento e helper runtime'
title: Interni dei Plugin
x-i18n:
    generated_at: "2026-04-21T08:24:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05b612f75189ba32f8c92e5a261241abdf9ad8d4a685c1d8da0cf9605d7158b7
    source_path: plugins/architecture.md
    workflow: 15
---

# Interni dei Plugin

<Info>
  Questo è il **riferimento architetturale approfondito**. Per guide pratiche, consulta:
  - [Install and use plugins](/it/tools/plugin) — guida utente
  - [Getting Started](/it/plugins/building-plugins) — primo tutorial sui Plugin
  - [Channel Plugins](/it/plugins/sdk-channel-plugins) — crea un canale di messaggistica
  - [Provider Plugins](/it/plugins/sdk-provider-plugins) — crea un provider di modelli
  - [SDK Overview](/it/plugins/sdk-overview) — mappa degli import e API di registrazione
</Info>

Questa pagina copre l'architettura interna del sistema di Plugin di OpenClaw.

## Modello di capability pubblico

Le capability sono il modello pubblico dei **Plugin nativi** all'interno di OpenClaw. Ogni
Plugin nativo di OpenClaw si registra rispetto a uno o più tipi di capability:

| Capability             | Metodo di registrazione                         | Plugin di esempio                    |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferenza testuale     | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                 | `openai`, `anthropic`                |
| Voce                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Trascrizione realtime  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Voce realtime          | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Comprensione media     | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Generazione immagini   | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale   | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generazione video      | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Recupero web           | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Ricerca web            | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canale / messaggistica | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Un Plugin che registra zero capability ma fornisce hook, strumenti o
servizi è un Plugin **legacy solo-hook**. Questo pattern è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello di capability è integrato nel core e usato oggi dai Plugin
nativi/inclusi, ma la compatibilità dei Plugin esterni richiede ancora un criterio più rigoroso di “è esportato, quindi è congelato”.

Indicazioni attuali:

- **Plugin esterni esistenti:** mantieni funzionanti le integrazioni basate su hook; trattale
  come baseline di compatibilità
- **nuovi Plugin nativi/inclusi:** preferisci la registrazione esplicita delle capability rispetto a
  reach-in specifici del vendor o a nuovi design solo-hook
- **Plugin esterni che adottano la registrazione di capability:** consentiti, ma considera le
  superfici helper specifiche delle capability come in evoluzione salvo che la documentazione non contrassegni esplicitamente
  un contratto come stabile

Regola pratica:

- le API di registrazione delle capability sono la direzione prevista
- gli hook legacy restano il percorso più sicuro senza rotture per i Plugin esterni durante
  la transizione
- i sottopercorsi helper esportati non sono tutti uguali; preferisci il contratto ristretto documentato,
  non esportazioni helper incidentali

### Forme dei Plugin

OpenClaw classifica ogni Plugin caricato in una forma in base al suo effettivo
comportamento di registrazione (non solo ai metadati statici):

- **plain-capability** -- registra esattamente un tipo di capability (per esempio un
  Plugin solo-provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capability (per esempio
  `openai` possiede inferenza testuale, voce, comprensione media e generazione di immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), nessuna
  capability, strumento, comando o servizio
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capability

Usa `openclaw plugins inspect <id>` per vedere la forma di un Plugin e la sua suddivisione delle capability. Consulta [CLI reference](/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per
i Plugin solo-hook. Plugin reali legacy dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo che l'uso reale sarà diminuito e la copertura delle fixture avrà dimostrato la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configurazione viene analizzata correttamente e i Plugin vengono risolti |
| **compatibility advisory** | Il Plugin usa un pattern supportato ma più vecchio (ad es. `hook-only`) |
| **legacy warning**        | Il Plugin usa `before_agent_start`, che è deprecato          |
| **hard error**            | La configurazione non è valida o il Plugin non è stato caricato |

Né `hook-only` né `before_agent_start` romperanno oggi il tuo Plugin --
`hook-only` è solo informativo, e `before_agent_start` genera soltanto un avviso. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di Plugin di OpenClaw ha quattro livelli:

1. **Manifest + discovery**
   OpenClaw trova i Plugin candidati dai percorsi configurati, dalle radici del workspace,
   dalle radici globali delle estensioni e dalle estensioni incluse. La discovery legge prima
   i manifest nativi `openclaw.plugin.json` più i manifest dei bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un Plugin scoperto è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento runtime**
   I Plugin nativi di OpenClaw vengono caricati in-process tramite jiti e registrano
   capability in un registro centrale. I bundle compatibili vengono normalizzati in
   record di registro senza importare codice runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione dei provider,
   hook, route HTTP, comandi CLI e servizi.

Per la CLI dei Plugin in particolare, la discovery dei comandi root è divisa in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del Plugin può restare lazy e registrarsi al primo richiamo

Questo mantiene il codice CLI posseduto dal Plugin all'interno del Plugin stesso, consentendo comunque a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine di progettazione importante:

- discovery + validazione della configurazione dovrebbero funzionare a partire dai **metadati di manifest/schema**
  senza eseguire codice del Plugin
- il comportamento runtime nativo proviene dal percorso `register(api)` del modulo del Plugin

Questa separazione consente a OpenClaw di validare la configurazione, spiegare i Plugin mancanti/disabilitati e
costruire suggerimenti UI/schema prima che il runtime completo sia attivo.

### Plugin di canale e lo strumento message condiviso

I Plugin di canale non devono registrare uno strumento separato di invio/modifica/reazione per
le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e
i Plugin di canale possiedono la discovery e l'esecuzione specifiche del canale dietro di esso.

Il confine attuale è:

- il core possiede l'host condiviso dello strumento `message`, il wiring del prompt, il
  bookkeeping di sessione/thread e il dispatch di esecuzione
- i Plugin di canale possiedono la discovery delle azioni con scope, la discovery delle capability e qualsiasi frammento di schema specifico del canale
- i Plugin di canale possiedono la grammatica di conversazione di sessione specifica del provider, ad esempio
  come gli ID di conversazione codificano gli ID dei thread o ereditano da conversazioni padre
- i Plugin di canale eseguono l'azione finale tramite il proprio adapter di azione

Per i Plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di discovery unificata consente a un Plugin di restituire insieme le proprie azioni visibili, capability e contributi allo schema, così questi elementi non divergono.

Quando un parametro dello strumento message specifico del canale trasporta una sorgente media come
un percorso locale o un URL media remoto, il Plugin dovrebbe anche restituire
`mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito
per applicare la normalizzazione dei percorsi sandbox e i suggerimenti di accesso ai media in uscita
senza codificare rigidamente nomi di parametri posseduti dal Plugin.
Preferisci mappe con scope per azione, non un unico elenco piatto per l'intero canale, così un
parametro media solo-profilo non viene normalizzato su azioni non correlate come
`send`.

Il core passa lo scope runtime in quel passaggio di discovery. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` in ingresso attendibile

Questo conta per i Plugin sensibili al contesto. Un canale può nascondere o esporre
azioni message in base all'account attivo, alla stanza/thread/message corrente o
all'identità attendibile del richiedente senza codificare rami specifici del canale nello strumento `message` del core.

Per questo le modifiche di routing dell'embedded-runner restano lavoro del Plugin: il runner è
responsabile dell'inoltro dell'identità corrente di chat/sessione nel confine di discovery del Plugin così lo strumento `message` condiviso espone la giusta superficie posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i Plugin inclusi dovrebbero mantenere il runtime di esecuzione
all'interno dei propri moduli di estensione. Il core non possiede più i runtime di azione message di Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i Plugin inclusi
dovrebbero importare direttamente il proprio codice runtime locale dai moduli
posseduti dalla loro estensione.

Lo stesso confine si applica in generale alle seam SDK nominate per provider: il core non dovrebbe
importare barrel di convenienza specifici del canale per estensioni Slack, Discord, Signal,
WhatsApp o simili. Se il core ha bisogno di un comportamento, deve o consumare il barrel `api.ts` / `runtime-api.ts` del Plugin incluso o promuovere l'esigenza a una capability generica ristretta nello SDK condiviso.

Per i sondaggi in particolare, esistono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che rientrano nel modello
  comune di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per semantiche di sondaggio specifiche del canale o parametri extra del sondaggio

Il core ora rinvia il parsing condiviso dei sondaggi fino a dopo che il dispatch del sondaggio del Plugin ha rifiutato
l'azione, così i gestori di sondaggi posseduti dal Plugin possono accettare campi di sondaggio specifici del canale senza essere bloccati prima dal parser generico dei sondaggi.

Consulta [Load pipeline](#load-pipeline) per la sequenza di avvio completa.

## Modello di ownership delle capability

OpenClaw tratta un Plugin nativo come il confine di ownership per una **azienda** o una
**funzionalità**, non come un contenitore eterogeneo di integrazioni non correlate.

Questo significa:

- un Plugin aziendale dovrebbe di norma possedere tutte le superfici OpenClaw rivolte a quell'azienda
- un Plugin funzionale dovrebbe di norma possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capability condivise del core invece di reimplementare
  ad hoc il comportamento del provider

Esempi:

- il plugin `openai` incluso possiede il comportamento del provider di modelli OpenAI e il comportamento OpenAI per voce + realtime-voice + comprensione media + generazione di immagini
- il plugin `elevenlabs` incluso possiede il comportamento voce di ElevenLabs
- il plugin `microsoft` incluso possiede il comportamento voce di Microsoft
- il plugin `google` incluso possiede il comportamento del provider di modelli Google più il comportamento Google per comprensione media + generazione di immagini + ricerca web
- il plugin `firecrawl` incluso possiede il comportamento web-fetch di Firecrawl
- i plugin inclusi `minimax`, `mistral`, `moonshot` e `zai` possiedono i loro backend di comprensione media
- il plugin `qwen` incluso possiede il comportamento del provider testuale Qwen più il comportamento di comprensione media e generazione video
- il plugin `voice-call` è un plugin funzionale: possiede transport di chiamata, strumenti,
  CLI, route e bridging dei media stream Twilio, ma consuma capability condivise di voce
  più realtime-transcription e realtime-voice invece di importare direttamente i plugin vendor

Lo stato finale desiderato è:

- OpenAI vive in un solo plugin anche se comprende modelli testuali, voce, immagini e
  futuro video
- un altro vendor può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale plugin vendor possieda il provider; consumano il
  contratto di capability condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di ownership
- **capability** = contratto del core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
“quale provider dovrebbe codificare rigidamente la gestione del video?” La prima domanda è “qual è
il contratto di capability video del core?” Una volta che quel contratto esiste, i plugin vendor
possono registrarsi rispetto a esso e i plugin canale/funzionalità possono consumarlo.

Se la capability non esiste ancora, la mossa giusta di solito è:

1. definire la capability mancante nel core
2. esporla tramite l'API/runtime del plugin in modo tipizzato
3. collegare canali/funzionalità a quella capability
4. lasciare che i plugin vendor registrino le implementazioni

Questo mantiene esplicita l'ownership evitando al contempo un comportamento del core che dipenda da un
singolo vendor o da un percorso di codice specifico per un singolo plugin.

### Stratificazione delle capability

Usa questo modello mentale quando decidi dove deve stare il codice:

- **livello capability del core**: orchestrazione condivisa, policy, fallback, regole di
  merge della configurazione, semantica di consegna e contratti tipizzati
- **livello plugin vendor**: API specifiche del vendor, autenticazione, cataloghi di modelli, sintesi vocale,
  generazione di immagini, futuri backend video, endpoint di usage
- **livello plugin canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma capability del core e le presenta su una superficie

Per esempio, il TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e la consegna al canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper runtime TTS della telefonia

Lo stesso pattern dovrebbe essere preferito per le capability future.

### Esempio di plugin aziendale multi-capability

Un plugin aziendale dovrebbe risultare coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, voce, trascrizione realtime, voce realtime, comprensione media,
generazione di immagini, generazione video, web fetch e ricerca web,
un vendor può possedere tutte le sue superfici in un unico posto:

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
- il core continua a possedere i contratti di capability
- i plugin canale e funzionalità consumano helper `api.runtime.*`, non codice vendor
- i test di contratto possono verificare che il plugin abbia registrato le capability che
  dichiara di possedere

### Esempio di capability: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica
capability condivisa. Lo stesso modello di ownership si applica anche qui:

1. il core definisce il contratto di comprensione media
2. i plugin vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` secondo necessità
3. i plugin canale e funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice vendor

Questo evita di incorporare nel core le assunzioni video di un solo provider. Il plugin possiede
la superficie vendor; il core possiede il contratto di capability e il comportamento di fallback.

La generazione video usa già la stessa sequenza: il core possiede il contratto di
capability tipizzato e l'helper runtime, e i plugin vendor registrano
implementazioni `api.registerVideoGenerationProvider(...)` rispetto a esso.

Ti serve una checklist concreta di rollout? Consulta
[Capability Cookbook](/it/plugins/architecture).

## Contratti e applicazione

La superficie API dei plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e
gli helper runtime su cui un plugin può fare affidamento.

Perché questo è importante:

- gli autori di plugin ottengono un unico standard interno stabile
- il core può rifiutare ownership duplicate come due plugin che registrano lo stesso
  ID provider
- l'avvio può esporre diagnostica utilizzabile per registrazioni malformate
- i test di contratto possono applicare l'ownership dei plugin inclusi e prevenire derive silenziose

Esistono due livelli di applicazione:

1. **applicazione della registrazione runtime**
   Il registro dei plugin valida le registrazioni mentre i plugin si caricano. Esempi:
   ID provider duplicati, ID provider voce duplicati e registrazioni malformate
   producono diagnostica dei plugin invece di comportamento indefinito.
2. **test di contratto**
   I plugin inclusi vengono acquisiti nei registri di contratto durante le esecuzioni di test così
   OpenClaw può verificare esplicitamente l'ownership. Oggi questo è usato per provider di modelli,
   provider voce, provider di ricerca web e ownership delle registrazioni incluse.

L'effetto pratico è che OpenClaw conosce, in anticipo, quale plugin possiede quale
superficie. Questo consente al core e ai canali di comporsi senza attriti perché l'ownership è
dichiarata, tipizzata e verificabile invece che implicita.

### Cosa deve stare in un contratto

I buoni contratti dei plugin sono:

- tipizzati
- piccoli
- specifici della capability
- posseduti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti dei plugin sono:

- policy specifiche del vendor nascoste nel core
- escape hatch una tantum di plugin che aggirano il registro
- codice del canale che entra direttamente in un'implementazione vendor
- oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capability, poi
lascia che i plugin si innestino su di essa.

## Modello di esecuzione

I plugin nativi di OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono
sandboxati. Un plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del codice core.

Implicazioni:

- un plugin nativo può registrare strumenti, gestori di rete, hook e servizi
- un bug in un plugin nativo può mandare in crash o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione arbitraria di codice all'interno del processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa per lo più
Skills inclusi.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non inclusi. Tratta
i plugin del workspace come codice di sviluppo, non come impostazione predefinita di produzione.

Per i nomi dei pacchetti workspace inclusi, mantieni l'ID plugin ancorato al nome npm:
`@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo plugin più ristretto.

Nota importante sulla fiducia:

- `plugins.allow` accorda fiducia agli **ID plugin**, non alla provenienza della sorgente.
- Un plugin workspace con lo stesso ID di un plugin incluso ombreggia intenzionalmente
  la copia inclusa quando quel plugin workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.

## Confine di esportazione

OpenClaw esporta capability, non comodità di implementazione.

Mantieni pubblica la registrazione delle capability. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici di plugin inclusi
- sottopercorsi di plumbing runtime non destinati a essere API pubbliche
- helper di convenienza specifici del vendor
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei plugin inclusi restano ancora nella mappa di esportazione SDK generata per compatibilità e manutenzione dei plugin inclusi. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diverse seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come pattern SDK raccomandato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw esegue approssimativamente questo:

1. scopre le radici candidate dei plugin
2. legge i manifest nativi o dei bundle compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ciascun candidato
6. carica i moduli nativi abilitati tramite jiti
7. chiama gli hook nativi `register(api)` (oppure `activate(api)` — un alias legacy) e raccoglie le registrazioni nel registro dei plugin
8. espone il registro alle superfici di comandi/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve ciò che è presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin inclusi usano `register`; per i nuovi plugin preferisci `register`.
</Note>

I gate di sicurezza avvengono **prima** dell'esecuzione runtime. I candidati vengono bloccati
quando l'entry esce dalla radice del plugin, il percorso è scrivibile da tutti, oppure la
ownership del percorso appare sospetta per i plugin non inclusi.

### Comportamento manifest-first

Il manifest è la fonte di riferimento del control plane. OpenClaw lo usa per:

- identificare il plugin
- scoprire canali/Skills/schema di configurazione dichiarati o capability del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/placeholder della UI di controllo
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del plugin

Per i plugin nativi, il modulo runtime è la parte di data plane. Registra
il comportamento reale come hook, strumenti, comandi o flussi provider.

I blocchi opzionali `activation` e `setup` del manifest restano nel control plane.
Sono descrittori solo-metadati per la pianificazione dell'attivazione e la discovery del setup;
non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano suggerimenti di comandi, canali e provider del manifest
per restringere il caricamento dei plugin prima della materializzazione più ampia del registro:

- il caricamento CLI si restringe ai plugin che possiedono il comando primario richiesto
- la risoluzione di setup/plugin del canale si restringe ai plugin che possiedono l'ID
  canale richiesto
- la risoluzione esplicita di setup/runtime del provider si restringe ai plugin che possiedono
  l'ID provider richiesto

La discovery del setup ora preferisce ID posseduti dai descrittori come `setup.providers` e
`setup.cliBackends` per restringere i plugin candidati prima di ripiegare su
`setup-api` per i plugin che hanno ancora bisogno di hook runtime in fase di setup. Se più di
un plugin scoperto rivendica lo stesso ID normalizzato di provider setup o backend CLI,
la ricerca del setup rifiuta l'owner ambiguo invece di affidarsi all'ordine di discovery.

### Cosa mette in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati della discovery
- dati del registro dei manifest
- registri dei plugin caricati

Queste cache riducono l'avvio bursty e il costo dei comandi ripetuti. È sicuro
considerarle cache di prestazioni a breve durata, non persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oppure
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre della cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello di registro

I plugin caricati non mutano direttamente globali core casuali. Si registrano in un
registro centrale dei plugin.

Il registro tiene traccia di:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- gestori RPC del Gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dal plugin

Le funzionalità del core leggono poi da quel registro invece di parlare direttamente con i moduli plugin.
Questo mantiene il caricamento unidirezionale:

- modulo plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core ha bisogno solo di un punto di integrazione: “leggi il registro”, non “crea casi speciali per ogni modulo plugin”.

## Callback di binding della conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di binding
è stata approvata o negata:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campi del payload della callback:

- `status`: `"approved"` oppure `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oppure `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, hint detach, sender id e
  metadati della conversazione

Questa callback è solo di notifica. Non cambia chi è autorizzato ad associare una
conversazione e viene eseguita dopo che la gestione di approvazione del core è terminata.

## Hook runtime del provider

I plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per lookup economico dell'autenticazione env del provider
  prima del caricamento runtime, `providerAuthAliases` per varianti del provider che condividono
  l'autenticazione, `channelEnvVars` per lookup economico di env/setup del canale prima del caricamento runtime,
  più `providerAuthChoices` per etichette economiche di onboarding/scelta auth e
  metadati dei flag CLI prima del caricamento runtime
- hook in fase di configurazione: `catalog` / legacy `discovery` più `applyConfigDefaults`
- hook runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`, `supportsAdaptiveThinking`,
  `supportsMaxThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw continua a possedere il ciclo agente generico, il failover, la gestione del transcript e la
policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
richiedere un intero transport di inferenza personalizzato.

Usa `providerAuthEnvVars` del manifest quando il provider ha credenziali basate su env
che i percorsi generici di auth/status/model-picker devono vedere senza caricare il runtime del plugin.
Usa `providerAuthAliases` del manifest quando un ID provider deve riutilizzare
le variabili env, i profili auth, l'autenticazione supportata dalla configurazione e la scelta di onboarding con chiave API di un altro ID provider. Usa `providerAuthChoices` del manifest quando le
superfici CLI di onboarding/scelta auth devono conoscere l'ID di scelta del provider, le etichette di gruppo e il semplice wiring auth a un flag senza caricare il runtime del provider. Mantieni `envVars` del runtime provider per suggerimenti rivolti all'operatore come etichette di onboarding o variabili di setup OAuth
client-id/client-secret.

Usa `channelEnvVars` del manifest quando un canale ha auth o setup guidati da env che
il fallback generico shell-env, i controlli config/status o i prompt di setup devono vedere
senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook approssimativamente in questo ordine.
La colonna “Quando usarlo” è la guida rapida per decidere.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                               |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider possiede un catalogo o valori predefiniti di URL di base                                                                        |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali di configurazione posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità auth, dall'env o dalla semantica della famiglia di modelli del provider                      |
| --  | _(built-in model lookup)_         | OpenClaw prova prima il normale percorso di registro/catalogo                                                  | _(non è un hook del plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview degli ID modello prima del lookup                                            | Il provider possiede la pulizia degli alias prima della risoluzione canonica del modello                                                    |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia provider prima dell'assemblaggio generico del modello             | Il provider possiede la pulizia del transport per ID provider personalizzati nella stessa famiglia di transport                             |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                   | Il provider ha bisogno di una pulizia della configurazione che dovrebbe vivere con il plugin; gli helper inclusi della famiglia Google fungono anche da fallback per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità native di streaming-usage ai provider di configurazione                  | Il provider ha bisogno di correzioni dei metadati native di streaming usage guidate dall'endpoint                                          |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marker env per i provider di configurazione prima del caricamento dell'autenticazione runtime | Il provider possiede la risoluzione della chiave API con marker env; `amazon-bedrock` ha qui anche un resolver integrato per marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o supportata dalla configurazione senza persistere testo in chiaro   | Il provider può operare con un marker di credenziale sintetica/locale                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili auth esterni posseduti dal provider; il valore predefinito di `persistence` è `runtime-only` per credenziali possedute da CLI/app | Il provider riutilizza credenziali auth esterne senza persistere token di refresh copiati                                                  |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei placeholder di profilo sintetico memorizzati rispetto all'autenticazione supportata da env/configurazione | Il provider memorizza profili placeholder sintetici che non dovrebbero vincere la precedenza                                                |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello posseduti dal provider non ancora presenti nel registro locale               | Il provider accetta ID modello upstream arbitrari                                                                                           |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                          | Il provider ha bisogno di metadati di rete prima di risolvere ID sconosciuti                                                               |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato usi il modello risolto                                     | Il provider ha bisogno di riscritture del transport ma usa comunque un transport del core                                                  |
| 14  | `contributeResolvedModelCompat`   | Contribuisce con flag di compatibilità per modelli vendor dietro un altro transport compatibile               | Il provider riconosce i propri modelli su transport proxy senza assumere il controllo del provider                                         |
| 15  | `capabilities`                    | Metadati transcript/tooling posseduti dal provider e usati dalla logica condivisa del core                   | Il provider ha bisogno di peculiarità transcript/famiglia provider                                                                          |
| 16  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che il runner incorporato li veda                                 | Il provider ha bisogno di pulizia degli schemi della famiglia di transport                                                                  |
| 17  | `inspectToolSchemas`              | Espone diagnostica degli schemi posseduta dal provider dopo la normalizzazione                                | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                              |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del reasoning nativo o con tag                                               | Il provider ha bisogno di output reasoning/finale con tag invece dei campi nativi                                                          |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici delle opzioni stream                    | Il provider ha bisogno di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                       |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso stream con un transport personalizzato                          | Il provider ha bisogno di un protocollo wire personalizzato, non solo di un wrapper                                                        |
| 21  | `wrapStreamFn`                    | Wrapper stream dopo l'applicazione dei wrapper generici                                                       | Il provider ha bisogno di wrapper di compatibilità per header/body/modello della richiesta senza un transport personalizzato               |
| 22  | `resolveTransportTurnState`       | Collega header o metadati nativi per turno al transport                                                       | Il provider vuole che i transport generici inviino l'identità nativa del turno del provider                                                |
| 23  | `resolveWebSocketSessionPolicy`   | Collega header WebSocket nativi o una policy di cooldown della sessione                                       | Il provider vuole che i transport WS generici regolino header di sessione o policy di fallback                                             |
| 24  | `formatApiKey`                    | Formatter del profilo auth: il profilo memorizzato diventa la stringa `apiKey` runtime                       | Il provider memorizza metadati auth extra e ha bisogno di una forma personalizzata per il token runtime                                    |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di fallimento del refresh          | Il provider non rientra nei refresher condivisi `pi-ai`                                                                                    |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                         | Il provider ha bisogno di indicazioni di riparazione auth possedute dal provider dopo un fallimento del refresh                            |
| 27  | `matchesContextOverflowError`     | Matcher posseduto dal provider per l'overflow della finestra di contesto                                      | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                        |
| 28  | `classifyFailoverReason`          | Classificazione del motivo di failover posseduta dal provider                                                 | Il provider può mappare errori raw API/transport a rate limit/sovraccarico/ecc.                                                            |
| 29  | `isCacheTtlEligible`              | Policy della prompt-cache per provider proxy/backhaul                                                         | Il provider ha bisogno di gating TTL della cache specifico per proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero missing-auth                                                  | Il provider ha bisogno di un suggerimento di recupero missing-auth specifico del provider                                                   |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più suggerimento di errore facoltativo rivolto all'utente          | Il provider ha bisogno di nascondere righe upstream obsolete o sostituirle con un suggerimento vendor                                      |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo la discovery                                                | Il provider ha bisogno di righe sintetiche forward-compat in `models list` e nei picker                                                    |
| 33  | `isBinaryThinking`                | Toggle di reasoning on/off per provider a binary-thinking                                                     | Il provider espone solo thinking binario on/off                                                                                             |
| 34  | `supportsXHighThinking`           | Supporto al reasoning `xhigh` per modelli selezionati                                                         | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                |
| 35  | `supportsAdaptiveThinking`        | Supporto al thinking `adaptive` per modelli selezionati                                                       | Il provider vuole che `adaptive` venga mostrato solo per modelli con thinking adattivo gestito dal provider                                |
| 36  | `supportsMaxThinking`             | Supporto al reasoning `max` per modelli selezionati                                                           | Il provider vuole che `max` venga mostrato solo per modelli con max thinking del provider                                                  |
| 37  | `resolveDefaultThinkingLevel`     | Livello `/think` predefinito per una specifica famiglia di modelli                                            | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                            |
| 38  | `isModernModelRef`                | Matcher di modelli moderni per i filtri dei profili live e la selezione smoke                                 | Il provider possiede la corrispondenza dei modelli preferiti per live/smoke                                                                |
| 39  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave runtime effettivo subito prima dell'inferenza        | Il provider ha bisogno di uno scambio di token o di una credenziale di richiesta a breve durata                                            |
| 40  | `resolveUsageAuth`                | Risolve le credenziali di usage/fatturazione per `/usage` e superfici di stato correlate                      | Il provider ha bisogno di parsing personalizzato del token di usage/quota o di una credenziale di usage diversa                           |
| 41  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di usage/quota specifici del provider dopo che l'autenticazione è stata risolta | Il provider ha bisogno di un endpoint di usage o di un parser del payload specifico del provider                                           |
| 42  | `createEmbeddingProvider`         | Costruisce un adapter di embedding posseduto dal provider per memoria/ricerca                                  | Il comportamento degli embedding di memoria appartiene al plugin provider                                                                   |
| 43  | `buildReplayPolicy`               | Restituisce una replay policy che controlla la gestione del transcript per il provider                        | Il provider ha bisogno di una policy transcript personalizzata (per esempio, rimozione dei blocchi di thinking)                           |
| 44  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica del transcript                                      | Il provider ha bisogno di riscritture di replay specifiche del provider oltre agli helper condivisi di Compaction                         |
| 45  | `validateReplayTurns`             | Validazione finale o rimodellamento dei turni di replay prima del runner incorporato                          | Il transport del provider ha bisogno di una validazione dei turni più rigorosa dopo la sanificazione generica                             |
| 46  | `onModelSelected`                 | Esegue effetti collaterali post-selezione posseduti dal provider                                              | Il provider ha bisogno di telemetria o di stato posseduto dal provider quando un modello diventa attivo                                   |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider con hook compatibili
finché uno non modifica davvero l'ID modello o il transport/configurazione. Questo mantiene
funzionanti gli shim di alias/compat provider senza richiedere al chiamante di sapere quale
plugin incluso possieda la riscrittura. Se nessun hook provider riscrive una voce di
configurazione supportata della famiglia Google, il normalizzatore di configurazione Google incluso applica comunque
quella pulizia di compatibilità.

Se il provider ha bisogno di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
questa è una diversa classe di estensione. Questi hook servono per il comportamento del provider
che continua a essere eseguito sul normale ciclo di inferenza di OpenClaw.

### Esempio di provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Esempi integrati

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `supportsAdaptiveThinking`, `supportsMaxThinking`, `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` perché possiede la forward-compat di Claude 4.6,
  i suggerimenti della famiglia provider, le indicazioni di riparazione auth, l'integrazione
  dell'endpoint di usage, l'idoneità della prompt-cache, i valori predefiniti di configurazione sensibili all'autenticazione, la policy thinking predefinita/adaptive di Claude e la modellazione dello stream specifica di Anthropic per
  header beta, `/fast` / `serviceTier` e `context1m`.
- Gli helper di stream specifici di Claude per Anthropic restano per ora nella
  seam pubblica `api.ts` / `contract-api.ts` del plugin incluso. Quella superficie di pacchetto
  esporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder wrapper
  Anthropic di livello più basso invece di allargare lo SDK generico intorno alle regole degli header beta di un solo
  provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities` più `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  perché possiede la forward-compat GPT-5.4, la normalizzazione diretta OpenAI
  `openai-completions` -> `openai-responses`, i suggerimenti auth
  consapevoli di Codex, la soppressione di Spark, le righe sintetiche dell'elenco OpenAI e la policy GPT-5 per thinking /
  modelli live; la famiglia stream `openai-responses-defaults` possiede i
  wrapper condivisi nativi OpenAI Responses per header di attribuzione,
  `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa di Codex,
  modellazione del payload reasoning-compat e gestione del contesto di Responses.
- OpenRouter usa `catalog` più `resolveDynamicModel` e
  `prepareDynamicModel` perché il provider è pass-through e può esporre nuovi
  ID modello prima che il catalogo statico di OpenClaw venga aggiornato; usa anche
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` per mantenere
  fuori dal core header di richiesta specifici del provider, metadati di routing, patch di reasoning e
  policy della prompt-cache. La sua replay policy proviene dalla
  famiglia `passthrough-gemini`, mentre la famiglia stream `openrouter-thinking`
  possiede l'iniezione del reasoning via proxy e i salti dei modelli non supportati / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` più `prepareRuntimeAuth` e `fetchUsageSnapshot` perché ha
  bisogno di login del dispositivo posseduto dal provider, comportamento di fallback del modello, peculiarità dei transcript Claude, uno scambio di token GitHub -> token Copilot e un endpoint di usage posseduto dal provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` più
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` perché
  continua a funzionare sui transport OpenAI del core ma possiede la propria
  normalizzazione di transport/base URL, la policy di fallback del refresh OAuth, la scelta predefinita del transport,
  righe sintetiche del catalogo Codex e l'integrazione dell'endpoint di usage di ChatGPT; condivide la stessa famiglia stream `openai-responses-defaults` di OpenAI diretto.
- Google AI Studio e Gemini CLI OAuth usano `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` perché la
  famiglia replay `google-gemini` possiede il fallback forward-compat di Gemini 3.1,
  la validazione replay nativa Gemini, la sanificazione del bootstrap replay, la modalità di output del reasoning con tag e la corrispondenza dei modelli moderni, mentre la
  famiglia stream `google-thinking` possiede la normalizzazione del payload thinking di Gemini;
  Gemini CLI OAuth usa anche `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` per formattazione dei token, parsing dei token e
  wiring dell'endpoint quota.
- Anthropic Vertex usa `buildReplayPolicy` attraverso la
  famiglia replay `anthropic-by-model` così la pulizia replay specifica di Claude resta
  limitata agli ID Claude invece che a ogni transport `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` perché possiede
  la classificazione degli errori throttle/not-ready/context-overflow specifica di Bedrock
  per il traffico Anthropic-on-Bedrock; la sua replay policy condivide comunque lo stesso
  guard solo-Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode e Opencode Go usano `buildReplayPolicy`
  attraverso la famiglia replay `passthrough-gemini` perché fanno da proxy a modelli Gemini
  tramite transport compatibili con OpenAI e hanno bisogno della
  sanificazione della thought-signature Gemini senza validazione replay Gemini nativa né
  riscritture bootstrap.
- MiniMax usa `buildReplayPolicy` attraverso la
  famiglia replay `hybrid-anthropic-openai` perché un solo provider possiede sia
  semantiche Anthropic-message sia OpenAI-compatible; mantiene la rimozione dei
  blocchi thinking solo-Claude sul lato Anthropic mentre riporta la modalità di output del reasoning a quella nativa, e la famiglia stream `minimax-fast-mode` possiede le riscritture dei modelli fast-mode sul percorso stream condiviso.
- Moonshot usa `catalog` più `wrapStreamFn` perché usa ancora il transport
  OpenAI condiviso ma ha bisogno della normalizzazione del payload thinking posseduta dal provider; la
  famiglia stream `moonshot-thinking` mappa configurazione più stato `/think` sul proprio
  payload nativo binary thinking.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` perché ha bisogno di header di richiesta posseduti dal provider,
  normalizzazione del payload reasoning, suggerimenti per transcript Gemini e gating Anthropic
  cache-TTL; la famiglia stream `kilocode-thinking` mantiene l'iniezione del thinking Kilo
  sul percorso stream proxy condiviso saltando `kilo/auto` e
  altri ID modello proxy che non supportano payload reasoning espliciti.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` perché possiede fallback GLM-5,
  valori predefiniti `tool_stream`, UX binary thinking, corrispondenza dei modelli moderni e sia
  l'autenticazione usage sia il recupero quota; la famiglia stream `tool-stream-default-on` mantiene
  il wrapper `tool_stream` predefinito attivo fuori dalla colla scritta a mano per singolo provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  perché possiede la normalizzazione nativa del transport xAI Responses, le riscritture alias
  Grok fast-mode, `tool_stream` predefinito, la pulizia strict-tool / reasoning-payload,
  il riuso dell'autenticazione di fallback per strumenti posseduti dal plugin, la risoluzione forward-compat dei modelli Grok e le patch di compatibilità possedute dal provider come il profilo schema strumenti xAI,
  keyword di schema non supportate, `web_search` nativo e la decodifica degli argomenti di chiamata tool in entità HTML.
- Mistral, OpenCode Zen e OpenCode Go usano solo `capabilities` per mantenere
  le peculiarità transcript/tooling fuori dal core.
- I provider inclusi solo-catalogo come `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine` usano
  solo `catalog`.
- Qwen usa `catalog` per il proprio provider testuale più registrazioni condivise di comprensione media e
  generazione video per le sue superfici multimodali.
- MiniMax e Xiaomi usano `catalog` più hook di usage perché il loro comportamento `/usage`
  è posseduto dal plugin anche se l'inferenza continua a passare attraverso i transport condivisi.

## Helper runtime

I plugin possono accedere a helper selezionati del core tramite `api.runtime`. Per il TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Note:

- `textToSpeech` restituisce il normale payload di output TTS del core per superfici file/nota vocale.
- Usa la configurazione `messages.tts` del core e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per picker voce o flussi di setup posseduti dal vendor.
- Gli elenchi delle voci possono includere metadati più ricchi come locale, genere e tag di personalità per picker consapevoli del provider.
- OpenAI ed ElevenLabs supportano oggi la telefonia. Microsoft no.

I plugin possono anche registrare provider voce tramite `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Note:

- Mantieni nel core la policy TTS, il fallback e la consegna delle risposte.
- Usa i provider voce per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato all'ID provider `microsoft`.
- Il modello di ownership preferito è orientato all'azienda: un singolo plugin vendor può possedere
  provider testuali, voce, immagini e futuri media man mano che OpenClaw aggiunge quei
  contratti di capability.

Per la comprensione di immagini/audio/video, i plugin registrano un provider tipizzato di
comprensione media invece di un bag generico chiave/valore:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Note:

- Mantieni orchestrazione, fallback, configurazione e wiring dei canali nel core.
- Mantieni il comportamento vendor nel plugin provider.
- L'espansione additiva dovrebbe restare tipizzata: nuovi metodi opzionali, nuovi campi di risultato opzionali, nuove capability opzionali.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capability e l'helper runtime
  - i plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di comprensione media, i plugin possono chiamare:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Per la trascrizione audio, i plugin possono usare sia il runtime di comprensione media
sia il vecchio alias STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per
  la comprensione di immagini/audio/video.
- Usa la configurazione audio di comprensione media del core (`tools.media.audio`) e l'ordine di fallback del provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (per esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità.

I plugin possono anche avviare esecuzioni in background di sottoagenti tramite `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Note:

- `provider` e `model` sono override opzionali per singola esecuzione, non modifiche persistenti della sessione.
- OpenClaw rispetta quei campi di override solo per chiamanti attendibili.
- Per le esecuzioni di fallback possedute dal plugin, gli operatori devono fare opt-in con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin attendibili a specifici target canonici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni di sottoagenti di plugin non attendibili continuano a funzionare, ma le richieste di override vengono rifiutate invece di ripiegare silenziosamente.

Per la ricerca web, i plugin possono consumare l'helper runtime condiviso invece di
entrare nel wiring dello strumento dell'agente:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

I plugin possono anche registrare provider di ricerca web tramite
`api.registerWebSearchProvider(...)`.

Note:

- Mantieni nel core la selezione del provider, la risoluzione delle credenziali e la semantica condivisa delle richieste.
- Usa i provider di ricerca web per transport di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per plugin funzionalità/canale che hanno bisogno del comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: genera un'immagine usando la catena configurata del provider di generazione immagini.
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capability.

## Route HTTP del Gateway

I plugin possono esporre endpoint HTTP con `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campi della route:

- `path`: percorso della route sotto il server HTTP del Gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione del Gateway, oppure `"plugin"` per autenticazione/verifica webhook gestita dal plugin.
- `match`: opzionale. `"exact"` (predefinito) oppure `"prefix"`.
- `replaceExisting`: opzionale. Consente allo stesso plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni catene di fallthrough `exact`/`prefix` solo sullo stesso livello auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente scope runtime dell'operatore. Servono per webhook/verifica firma gestiti dal plugin, non per chiamate helper privilegiate del Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope runtime di richiesta Gateway, ma questo scope è intenzionalmente conservativo:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route plugin bloccati su `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili con identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste di route plugin con identità, lo scope runtime ricade su `operator.write`
- Regola pratica: non dare per scontato che una route plugin con autenticazione Gateway sia una superficie admin implicita. Se la tua route ha bisogno di comportamento solo-admin, richiedi una modalità auth con identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import del Plugin SDK

Usa i sottopercorsi SDK invece dell'import monolitico `openclaw/plugin-sdk` quando
scrivi plugin:

- `openclaw/plugin-sdk/plugin-entry` per le primitive di registrazione dei plugin.
- `openclaw/plugin-sdk/core` per il contratto generico condiviso rivolto ai plugin.
- `openclaw/plugin-sdk/config-schema` per l'esportazione dello schema Zod root `openclaw.json`
  (`OpenClawSchema`).
- Primitive stabili di canale come `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` e
  `openclaw/plugin-sdk/webhook-ingress` per wiring condiviso di setup/auth/reply/webhook.
  `channel-inbound` è la sede condivisa per debounce, corrispondenza delle mention,
  helper per policy di mention in ingresso, formattazione dell'envelope e helper di contesto
  per l'envelope in ingresso.
  `channel-setup` è la seam ristretta per setup facoltativo di installazione.
  `setup-runtime` è la superficie di setup runtime-safe usata da `setupEntry` /
  avvio differito, inclusi gli adapter di patch setup import-safe.
  `setup-adapter-runtime` è la seam di adapter per setup account consapevole dell'env.
  `setup-tools` è la piccola seam helper per CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Sottopercorsi di dominio come `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` e
  `openclaw/plugin-sdk/directory-runtime` per helper condivisi di runtime/configurazione.
  `telegram-command-config` è la seam pubblica ristretta per normalizzazione/validazione dei
  comandi personalizzati Telegram e resta disponibile anche se la superficie di contratto Telegram inclusa è temporaneamente non disponibile.
  `text-runtime` è la seam condivisa per testo/markdown/logging, inclusi
  stripping del testo visibile all'assistente, helper di rendering/chunking markdown, helper di redazione,
  helper per directive-tag e utility di testo sicuro.
- Le seam di canale specifiche per l'approvazione dovrebbero preferire un unico contratto `approvalCapability` sul plugin. Il core legge poi auth, consegna, rendering,
  routing nativo e comportamento del gestore nativo lazy dell'approvazione attraverso quella singola capability invece di mescolare il comportamento di approvazione in campi non correlati del plugin.
- `openclaw/plugin-sdk/channel-runtime` è deprecato e resta solo come
  shim di compatibilità per plugin più vecchi. Il nuovo codice dovrebbe importare invece primitive generiche più ristrette, e il codice del repository non dovrebbe aggiungere nuovi import dello shim.
- Gli interni delle estensioni incluse restano privati. I plugin esterni dovrebbero usare solo sottopercorsi `openclaw/plugin-sdk/*`. Il codice core/test di OpenClaw può usare i
  punti di ingresso pubblici del repository sotto una radice di pacchetto plugin come `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e file a scope ristretto come
  `login-qr-api.js`. Non importare mai `src/*` di un pacchetto plugin dal core o da
  un'altra estensione.
- Suddivisione del punto di ingresso del repository:
  `<plugin-package-root>/api.js` è il barrel helper/types,
  `<plugin-package-root>/runtime-api.js` è il barrel solo-runtime,
  `<plugin-package-root>/index.js` è il punto di ingresso del plugin incluso
  e `<plugin-package-root>/setup-entry.js` è il punto di ingresso del plugin di setup.
- Esempi attuali di provider inclusi:
  - Anthropic usa `api.js` / `contract-api.js` per helper stream Claude come
    `wrapAnthropicProviderStream`, helper per header beta e parsing di `service_tier`.
  - OpenAI usa `api.js` per builder provider, helper del modello predefinito e
    builder provider realtime.
  - OpenRouter usa `api.js` per il proprio builder provider più helper di onboarding/configurazione, mentre `register.runtime.js` può ancora riesportare helper generici `plugin-sdk/provider-stream` per uso locale del repository.
- I punti di ingresso pubblici caricati tramite facade preferiscono lo snapshot di configurazione runtime attivo
  quando esiste, poi ripiegano sul file di configurazione risolto su disco quando
  OpenClaw non sta ancora servendo uno snapshot runtime.
- Le primitive generiche condivise restano il contratto pubblico preferito dello SDK. Esiste ancora un piccolo insieme riservato di seam helper brandizzate per canali inclusi per compatibilità. Trattale come seam di manutenzione/compatibilità degli inclusi, non come nuovi target di import per terze parti; i nuovi contratti cross-channel dovrebbero comunque approdare su sottopercorsi generici `plugin-sdk/*` o sui barrel locali del plugin `api.js` /
  `runtime-api.js`.

Nota di compatibilità:

- Evita il barrel root `openclaw/plugin-sdk` nel nuovo codice.
- Preferisci prima le primitive stabili e ristrette. I sottopercorsi più recenti di setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sono il contratto previsto per il nuovo lavoro
  su plugin inclusi ed esterni.
  Il parsing/matching dei target appartiene a `openclaw/plugin-sdk/channel-targets`.
  I gate delle azioni message e gli helper per l'ID del messaggio di reazione appartengono a
  `openclaw/plugin-sdk/channel-actions`.
- I barrel helper specifici delle estensioni incluse non sono stabili per impostazione predefinita. Se un
  helper serve solo a un'estensione inclusa, tienilo dietro la seam locale `api.js` o `runtime-api.js`
  dell'estensione invece di promuoverlo in
  `openclaw/plugin-sdk/<extension>`.
- Le nuove seam helper condivise dovrebbero essere generiche, non brandizzate per canale. Il parsing condiviso dei target appartiene a `openclaw/plugin-sdk/channel-targets`; gli interni specifici del canale restano dietro la seam locale `api.js` o `runtime-api.js`
  del plugin che li possiede.
- I sottopercorsi specifici della capability come `image-generation`,
  `media-understanding` e `speech` esistono perché i plugin inclusi/nativi li usano
  oggi. La loro presenza non significa di per sé che ogni helper esportato sia un
  contratto esterno congelato a lungo termine.

## Schemi dello strumento message

I plugin dovrebbero possedere i contributi allo schema specifici del canale in `describeMessageTool(...)`.
Mantieni nel plugin i campi specifici del provider, non nel core condiviso.

Per frammenti di schema portabili condivisi, riusa gli helper generici esportati tramite
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` per payload in stile griglia di pulsanti
- `createMessageToolCardSchema()` per payload strutturati a card

Se una forma di schema ha senso solo per un provider, definiscila nel sorgente
del plugin invece di promuoverla nello SDK condiviso.

## Risoluzione dei target di canale

I plugin di canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni generico l'host
outbound condiviso e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima del lookup nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione tipo-ID invece che alla ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando il
  core ha bisogno di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un miss nella
  directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta che il target è stato risolto.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima della
  ricerca tra peer/gruppi.
- Usa `looksLikeId` per controlli del tipo “tratta questo come un ID target esplicito/nativo”.
- Usa `resolveTarget` per fallback di normalizzazione specifici del provider, non per
  una ricerca ampia nella directory.
- Mantieni ID nativi del provider come chat id, thread id, JID, handle e room
  id dentro valori `target` o parametri specifici del provider, non in campi SDK generici.

## Directory supportate dalla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
plugin e riutilizzare gli helper condivisi di
`openclaw/plugin-sdk/directory-runtime`.

Usa questo quando un canale ha bisogno di peer/gruppi supportati dalla configurazione come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici di directory con scope per account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione del limite
- helper di deduplica/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione dell'account specifica del canale e la normalizzazione degli ID dovrebbero restare
nell'implementazione del plugin.

## Cataloghi provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce di provider
- `{ providers }` per più voci di provider

Usa `catalog` quando il plugin possiede ID modello specifici del provider, valori predefiniti di URL di base o metadati di modelli protetti da autenticazione.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai provider impliciti integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili auth
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione della chiave, quindi i plugin possono intenzionalmente sovrascrivere una voce provider integrata con lo stesso ID provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione in sola lettura del canale

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può assumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano i segreti richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/riparazione della configurazione non dovrebbero aver bisogno di materializzare credenziali runtime solo per descrivere la configurazione.

Comportamento consigliato per `inspectAccount(...)`:

- Restituisci solo stato descrittivo dell'account.
- Preserva `enabled` e `configured`.
- Includi i campi di origine/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori raw dei token solo per riportare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il corrispondente campo di origine) è sufficiente per i comandi in stile stato.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di riportare “configurato ma non disponibile in questo percorso di comando” invece di andare in crash o segnalare erroneamente che l'account non è configurato.

## Package pack

Una directory plugin può includere un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Ogni voce diventa un plugin. Se il pack elenca più estensioni, l'ID plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory così
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni voce `openclaw.extensions` deve restare dentro la directory del plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (niente lifecycle script, niente dipendenze dev a runtime). Mantieni gli alberi delle dipendenze del plugin “pure JS/TS” ed evita pacchetti che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo-setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, o
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece del punto di ingresso completo del plugin. Questo mantiene avvio e setup più leggeri
quando il punto di ingresso principale del plugin collega anche strumenti, hook o altro codice solo-runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far fare opt-in a un plugin di canale sullo stesso percorso `setupEntry` durante la fase
di avvio pre-listen del gateway, anche quando il canale è già configurato.

Usa questo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, significa che l'entry di setup
deve registrare ogni capability posseduta dal canale da cui l'avvio dipende, come:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- eventuali metodi Gateway, strumenti o servizi che devono esistere durante quella stessa finestra

Se la tua entry completa possiede ancora una capability di avvio richiesta, non abilitare
questo flag. Mantieni il comportamento predefinito del plugin e lascia che OpenClaw carichi l'entry completa durante l'avvio.

I canali inclusi possono anche pubblicare helper della superficie di contratto solo-setup che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale
superficie di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale a singolo account
in `channels.<id>.accounts.*` senza caricare l'entry completa del plugin.
Matrix è l'esempio incluso attuale: sposta solo chiavi auth/bootstrap in un
account promosso con nome quando esistono già account con nome e può preservare una
chiave dell'account predefinito configurata ma non canonica invece di creare sempre
`accounts.default`.

Questi adapter di patch setup mantengono lazy la discovery della superficie di contratto inclusa. Il tempo di importazione resta leggero; la superficie di promozione viene caricata solo al primo uso invece di rientrare nell'avvio del canale incluso durante l'import del modulo.

Quando quelle superfici di avvio includono metodi RPC del Gateway, mantienili su un
prefisso specifico del plugin. Gli spazi dei nomi admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e risolvono sempre
a `operator.admin`, anche se un plugin richiede uno scope più ristretto.

Esempio:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadati del catalogo canali

I plugin di canale possono pubblicizzare metadati di setup/discovery tramite `openclaw.channel` e
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il core privo di dati di catalogo.

Esempio:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat self-hosted tramite bot webhook Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Campi utili di `openclaw.channel` oltre all'esempio minimo:

- `detailLabel`: etichetta secondaria per superfici più ricche di catalogo/stato
- `docsLabel`: sovrascrive il testo del link della documentazione
- `preferOver`: ID plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli della copia sulla superficie di selezione
- `markdownCapable`: contrassegna il canale come capace di Markdown per decisioni di formattazione outbound
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: fa fare opt-in al canale nel flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione quando risolve target di announce

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un export del
registro MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

## Plugin del motore di contesto

I plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione, assemblaggio
e Compaction. Registrali dal tuo plugin con
`api.registerContextEngine(id, factory)`, poi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usa questo quando il tuo plugin ha bisogno di sostituire o estendere la pipeline di contesto
predefinita invece di aggiungere soltanto ricerca in memoria o hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Se il tuo motore **non** possiede l'algoritmo di Compaction, mantieni `compact()`
implementato e delegalo esplicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Aggiungere una nuova capability

Quando un plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema dei plugin con un reach-in privato. Aggiungi la capability mancante.

Sequenza consigliata:

1. definisci il contratto del core
   Decidi quale comportamento condiviso il core dovrebbe possedere: policy, fallback, merge della configurazione,
   ciclo di vita, semantica rivolta ai canali e forma dell'helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola
   superficie tipizzata di capability utile.
3. collega i consumer core + canale/funzionalità
   I canali e i plugin funzionalità dovrebbero consumare la nuova capability tramite il core,
   non importando direttamente un'implementazione vendor.
4. registra le implementazioni vendor
   I plugin vendor registrano poi i propri backend rispetto alla capability.
5. aggiungi copertura di contratto
   Aggiungi test così ownership e forma della registrazione restino esplicite nel tempo.

È così che OpenClaw resta opinabile senza diventare codificato rigidamente secondo
la visione del mondo di un solo provider. Consulta il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist della capability

Quando aggiungi una nuova capability, l'implementazione dovrebbe di solito toccare insieme
queste superfici:

- tipi di contratto del core in `src/<capability>/types.ts`
- helper runner/runtime del core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API plugin in `src/plugins/types.ts`
- wiring del registro dei plugin in `src/plugins/registry.ts`
- esposizione runtime del plugin in `src/plugins/runtime/*` quando i plugin funzionalità/canale
  devono consumarla
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- assert di ownership/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, di solito è segno che la capability
non è ancora completamente integrata.

### Template della capability

Pattern minimo:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pattern di test del contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto di capability + l'orchestrazione
- i plugin vendor possiedono le implementazioni vendor
- i plugin funzionalità/canale consumano helper runtime
- i test di contratto mantengono esplicita l'ownership
