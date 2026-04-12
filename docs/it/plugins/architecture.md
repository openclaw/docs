---
read_when:
    - Creazione o debug dei plugin nativi OpenClaw
    - Comprendere il modello di capacità dei plugin o i confini di proprietà
    - Lavorare sulla pipeline di caricamento dei plugin o sul registro
    - Implementare hook di runtime del provider o plugin di canale
sidebarTitle: Internals
summary: 'Interni dei plugin: modello di capacità, proprietà, contratti, pipeline di caricamento e helper di runtime'
title: Interni dei plugin
x-i18n:
    generated_at: "2026-04-12T08:07:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6165a9da8b40de3bb7334fcb16023da5515deb83c4897ca1df1726f4a97db9e0
    source_path: plugins/architecture.md
    workflow: 15
---

# Interni dei plugin

<Info>
  Questo è il **riferimento di architettura approfondito**. Per guide pratiche, vedi:
  - [Installa e usa i plugin](/it/tools/plugin) — guida per l'utente
  - [Guida introduttiva](/it/plugins/building-plugins) — primo tutorial sui plugin
  - [Plugin di canale](/it/plugins/sdk-channel-plugins) — crea un canale di messaggistica
  - [Plugin provider](/it/plugins/sdk-provider-plugins) — crea un provider di modelli
  - [Panoramica dell'SDK](/it/plugins/sdk-overview) — mappa degli import e API di registrazione
</Info>

Questa pagina copre l'architettura interna del sistema di plugin di OpenClaw.

## Modello pubblico delle capacità

Le capacità sono il modello pubblico dei **plugin nativi** all'interno di OpenClaw. Ogni
plugin nativo OpenClaw si registra in uno o più tipi di capacità:

| Capacità               | Metodo di registrazione                          | Plugin di esempio                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferenza testuale     | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Voce                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale   | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generazione video      | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Recupero web           | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Ricerca web            | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canale / messaggistica | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Un plugin che registra zero capacità ma fornisce hook, strumenti o
servizi è un plugin **legacy solo hook**. Questo pattern è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello delle capacità è integrato nel core ed è usato oggi dai plugin
bundled/nativi, ma la compatibilità dei plugin esterni richiede ancora un criterio
più rigoroso di “è esportato, quindi è congelato”.

Indicazioni attuali:

- **plugin esterni esistenti:** mantenere funzionanti le integrazioni basate su hook; trattare
  questo come riferimento di compatibilità
- **nuovi plugin bundled/nativi:** preferire la registrazione esplicita delle capacità invece di
  accessi specifici del vendor o nuovi design solo hook
- **plugin esterni che adottano la registrazione delle capacità:** consentito, ma trattare le
  superfici helper specifiche per capacità come in evoluzione, a meno che la documentazione non indichi esplicitamente
  che un contratto è stabile

Regola pratica:

- le API di registrazione delle capacità sono la direzione prevista
- gli hook legacy restano il percorso più sicuro per evitare rotture nei plugin esterni durante
  la transizione
- i sottopercorsi helper esportati non sono tutti equivalenti; preferisci il
  contratto ristretto documentato, non esportazioni helper incidentali

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma in base al suo reale
comportamento di registrazione (non solo ai metadati statici):

- **plain-capability** -- registra esattamente un tipo di capacità (per esempio un
  plugin solo provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capacità (per esempio
  `openai` possiede inferenza testuale, voce, comprensione dei media e
  generazione di immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), nessuna
  capacità, strumento, comando o servizio
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capacità

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e la
suddivisione delle capacità. Vedi [Riferimento CLI](/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per
i plugin solo hook. Plugin legacy reali continuano a dipenderne.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di modifica del prompt
- rimuoverlo solo dopo che l'uso reale sarà diminuito e la copertura dei fixture avrà dimostrato la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configurazione viene analizzata correttamente e i plugin vengono risolti |
| **compatibility advisory** | Il plugin usa un pattern supportato ma più vecchio (ad es. `hook-only`) |
| **legacy warning**        | Il plugin usa `before_agent_start`, che è deprecato         |
| **hard error**            | La configurazione non è valida o il plugin non è riuscito a caricarsi |

Né `hook-only` né `before_agent_start` romperanno il tuo plugin oggi --
`hook-only` è un avviso, e `before_agent_start` genera solo un warning. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

1. **Manifest + individuazione**
   OpenClaw trova i plugin candidati dai percorsi configurati, dalle radici del workspace,
   dalle radici globali delle estensioni e dalle estensioni bundled. L'individuazione legge prima
   i manifest nativi `openclaw.plugin.json` e i manifest bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un plugin individuato è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento di runtime**
   I plugin nativi OpenClaw vengono caricati in-process tramite jiti e registrano
   capacità in un registro centrale. I bundle compatibili vengono normalizzati in
   record del registro senza importare il codice di runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione
   dei provider, hook, route HTTP, comandi CLI e servizi.

Per la CLI dei plugin in particolare, l'individuazione dei comandi root è suddivisa in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può restare lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI posseduto dal plugin all'interno del plugin, permettendo comunque a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine di progettazione importante:

- l'individuazione + la validazione della configurazione dovrebbero funzionare da **metadati di manifest/schema**
  senza eseguire il codice del plugin
- il comportamento di runtime nativo proviene dal percorso `register(api)` del modulo plugin

Questa separazione consente a OpenClaw di validare la configurazione, spiegare i plugin mancanti/disabilitati e
costruire suggerimenti per UI/schema prima che il runtime completo sia attivo.

### Plugin di canale e strumento condiviso dei messaggi

I plugin di canale non devono registrare uno strumento separato di invio/modifica/reazione per
le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e
i plugin di canale possiedono il rilevamento e l'esecuzione specifici del canale dietro di esso.

Il confine attuale è:

- il core possiede l'host dello strumento `message` condiviso, il wiring del prompt, la
  gestione di sessione/thread e il dispatch dell'esecuzione
- i plugin di canale possiedono il rilevamento di azioni con ambito, il rilevamento delle capacità e qualsiasi
  frammento di schema specifico del canale
- i plugin di canale possiedono la grammatica di conversazione della sessione specifica del provider, come
  il modo in cui gli ID conversazione codificano gli ID thread o ereditano dalle conversazioni padre
- i plugin di canale eseguono l'azione finale tramite il loro adattatore di azione

Per i plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di individuazione unificata
consente a un plugin di restituire insieme le sue azioni visibili, capacità e contributi di schema
così che questi elementi non divergano tra loro.

Il core passa l'ambito di runtime a questo passaggio di individuazione. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound attendibile

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre
azioni sui messaggi in base all'account attivo, alla stanza/thread/messaggio corrente o
all'identità attendibile del richiedente, senza codificare rami specifici del canale nello
strumento `message` del core.

Per questo motivo le modifiche di routing dell'embedded runner restano lavoro del plugin: il runner è
responsabile dell'inoltro dell'identità corrente di chat/sessione al confine di individuazione del plugin
affinché lo strumento `message` condiviso esponga la superficie posseduta dal canale corretta
per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i plugin bundled dovrebbero mantenere il runtime di esecuzione
all'interno dei propri moduli di estensione. Il core non possiede più i runtime di azione dei messaggi per Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i plugin bundled
dovrebbero importare direttamente il proprio codice di runtime locale dai
loro moduli posseduti dall'estensione.

Lo stesso confine si applica in generale alle seam SDK con nome del provider: il core non dovrebbe
importare barrel di convenienza specifici del canale per estensioni come Slack, Discord, Signal,
WhatsApp o simili. Se il core ha bisogno di un comportamento, o consuma il barrel `api.ts` / `runtime-api.ts`
del plugin bundled stesso, oppure promuove la necessità in una capacità generica ristretta nell'SDK condiviso.

Per i sondaggi in particolare, ci sono due percorsi di esecuzione:

- `outbound.sendPoll` è la base condivisa per i canali che si adattano al modello comune
  di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per la semantica dei sondaggi specifica del canale
  o per parametri di sondaggio aggiuntivi

Il core ora rimanda il parsing condiviso dei sondaggi a dopo che il dispatch del sondaggio del plugin ha rifiutato
l'azione, così i gestori di sondaggi posseduti dal plugin possono accettare campi di sondaggio specifici del canale
senza essere prima bloccati dal parser generico dei sondaggi.

Vedi [Pipeline di caricamento](#load-pipeline) per la sequenza completa di avvio.

## Modello di proprietà delle capacità

OpenClaw tratta un plugin nativo come confine di proprietà per un'**azienda** o una
**funzionalità**, non come un contenitore di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe di solito possedere tutte le superfici OpenClaw-facing di quell'azienda
- un plugin di funzionalità dovrebbe di solito possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità condivise del core invece di reimplementare in modo ad hoc
  il comportamento del provider

Esempi:

- il plugin bundled `openai` possiede il comportamento del provider di modelli OpenAI e il comportamento OpenAI per
  voce + voce in tempo reale + comprensione dei media + generazione di immagini
- il plugin bundled `elevenlabs` possiede il comportamento vocale ElevenLabs
- il plugin bundled `microsoft` possiede il comportamento vocale Microsoft
- il plugin bundled `google` possiede il comportamento del provider di modelli Google più il comportamento Google per
  comprensione dei media + generazione di immagini + ricerca web
- il plugin bundled `firecrawl` possiede il comportamento Firecrawl di recupero web
- i plugin bundled `minimax`, `mistral`, `moonshot` e `zai` possiedono i loro
  backend di comprensione dei media
- il plugin bundled `qwen` possiede il comportamento di provider testuale Qwen più il
  comportamento di comprensione dei media e generazione video
- il plugin `voice-call` è un plugin di funzionalità: possiede trasporto delle chiamate, strumenti,
  CLI, route e bridging del media-stream Twilio, ma consuma le capacità condivise di voce
  più trascrizione in tempo reale e voce in tempo reale invece di importare direttamente i plugin vendor

Lo stato finale previsto è:

- OpenAI si trova in un unico plugin anche se copre modelli testuali, voce, immagini e
  futuro video
- un altro vendor può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale plugin vendor possieda il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di proprietà
- **capability** = contratto del core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
“quale provider dovrebbe hardcodare la gestione del video?” La prima domanda è “qual è
il contratto di capacità video del core?” Una volta che quel contratto esiste, i plugin vendor
possono registrarsi rispetto a esso e i plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa corretta di solito è:

1. definire la capacità mancante nel core
2. esporla tramite l'API/runtime dei plugin in modo tipizzato
3. collegare canali/funzionalità a quella capacità
4. lasciare che i plugin vendor registrino le implementazioni

Questo mantiene esplicita la proprietà evitando al contempo comportamenti del core che dipendono da un
singolo vendor o da un percorso di codice specifico per un singolo plugin.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove deve stare il codice:

- **livello di capacità del core**: orchestrazione condivisa, policy, fallback, regole di merge
  della configurazione, semantica di consegna e contratti tipizzati
- **livello del plugin vendor**: API specifiche del vendor, autenticazione, cataloghi di modelli, sintesi
  vocale, generazione di immagini, futuri backend video, endpoint di utilizzo
- **livello del plugin di canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma capacità del core e le presenta su una superficie

Per esempio, la TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e la consegna sui canali
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper di runtime TTS per la telefonia

Lo stesso pattern dovrebbe essere preferito per le capacità future.

### Esempio di plugin aziendale multi-capacità

Un plugin aziendale dovrebbe risultare coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, voce, trascrizione in tempo reale, voce in tempo reale, comprensione dei media,
generazione di immagini, generazione video, recupero web e ricerca web,
un vendor può possedere tutte le proprie superfici in un unico posto:

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
- il core continua a possedere i contratti di capacità
- i plugin di canale e di funzionalità consumano helper `api.runtime.*`, non codice del vendor
- i test di contratto possono verificare che il plugin abbia registrato le capacità che
  dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica
capacità condivisa. Lo stesso modello di proprietà si applica anche qui:

1. il core definisce il contratto di comprensione dei media
2. i plugin vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` secondo necessità
3. i plugin di canale e di funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice del vendor

Questo evita di incorporare nel core le assunzioni video di un singolo provider. Il plugin possiede
la superficie del vendor; il core possiede il contratto di capacità e il comportamento di fallback.

La generazione video usa già la stessa sequenza: il core possiede il contratto di
capacità tipizzato e l'helper di runtime, e i plugin vendor registrano
implementazioni `api.registerVideoGenerationProvider(...)` rispetto a esso.

Hai bisogno di una checklist concreta di rollout? Vedi
[Capability Cookbook](/it/plugins/architecture).

## Contratti e applicazione

La superficie API dei plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e
gli helper di runtime su cui un plugin può fare affidamento.

Perché questo è importante:

- gli autori di plugin ottengono un unico standard interno stabile
- il core può rifiutare proprietà duplicate, ad esempio due plugin che registrano lo stesso
  ID provider
- l'avvio può mostrare diagnostica utile per registrazioni non valide
- i test di contratto possono imporre la proprietà dei plugin bundled e prevenire derive silenziose

Ci sono due livelli di applicazione:

1. **applicazione della registrazione a runtime**
   Il registro dei plugin valida le registrazioni mentre i plugin vengono caricati. Esempi:
   ID provider duplicati, ID provider vocali duplicati e registrazioni
   non valide producono diagnostica dei plugin invece di comportamenti indefiniti.
2. **test di contratto**
   I plugin bundled vengono acquisiti nei registri di contratto durante le esecuzioni di test così
   OpenClaw può verificare esplicitamente la proprietà. Oggi questo viene usato per
   provider di modelli, provider vocali, provider di ricerca web e proprietà delle registrazioni bundled.

L'effetto pratico è che OpenClaw sa, fin dall'inizio, quale plugin possiede quale
superficie. Questo consente al core e ai canali di comporsi senza attriti perché la proprietà è
dichiarata, tipizzata e verificabile invece di essere implicita.

### Cosa appartiene a un contratto

I buoni contratti dei plugin sono:

- tipizzati
- piccoli
- specifici per capacità
- posseduti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti dei plugin sono:

- policy specifiche del vendor nascoste nel core
- vie di fuga specifiche per un singolo plugin che aggirano il registro
- codice di canale che entra direttamente in un'implementazione vendor
- oggetti di runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi
lascia che i plugin si colleghino a essa.

## Modello di esecuzione

I plugin nativi OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono
sandboxed. Un plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del
codice core.

Implicazioni:

- un plugin nativo può registrare strumenti, gestori di rete, hook e servizi
- un bug in un plugin nativo può mandare in crash o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione di codice arbitrario all'interno del
  processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa soprattutto
Skills bundled.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non bundled. Tratta
i plugin del workspace come codice di sviluppo, non come impostazioni predefinite di produzione.

Per i nomi dei pacchetti del workspace bundled, mantieni l'ID del plugin ancorato nel nome npm:
`@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo di plugin più ristretto.

Nota importante sulla fiducia:

- `plugins.allow` si fida degli **ID plugin**, non della provenienza della sorgente.
- Un plugin del workspace con lo stesso ID di un plugin bundled oscura intenzionalmente
  la copia bundled quando quel plugin del workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.

## Confine di esportazione

OpenClaw esporta capacità, non comodità di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici dei plugin bundled
- sottopercorsi di plumbing di runtime non destinati a essere API pubbliche
- helper di comodità specifici del vendor
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei plugin bundled restano comunque nella mappa di esportazione SDK generata
per compatibilità e manutenzione dei plugin bundled. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diverse seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate a dettagli di implementazione, non come pattern SDK consigliato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw esegue approssimativamente questo:

1. individua le root candidate dei plugin
2. legge i manifest nativi o dei bundle compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati tramite jiti
7. chiama gli hook nativi `register(api)` (o `activate(api)` — un alias legacy) e raccoglie le registrazioni nel registro dei plugin
8. espone il registro alle superfici di comandi/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin bundled usano `register`; per i nuovi plugin preferisci `register`.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione a runtime. I candidati vengono bloccati
quando l'entry esce dalla root del plugin, il percorso è scrivibile da chiunque, oppure la proprietà del percorso appare sospetta per i plugin non bundled.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- individuare canali/Skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del plugin

Per i plugin nativi, il modulo runtime è la parte di data plane. Registra
il comportamento reale come hook, strumenti, comandi o flussi provider.

I blocchi facoltativi `activation` e `setup` del manifest restano nel control plane.
Sono descrittori di soli metadati per la pianificazione dell'attivazione e l'individuazione del setup;
non sostituiscono la registrazione a runtime, `register(...)` o `setupEntry`.

L'individuazione del setup ora preferisce ID posseduti dal descrittore come `setup.providers` e
`setup.cliBackends` per restringere i plugin candidati prima di ricorrere a
`setup-api` per i plugin che hanno ancora bisogno di hook di runtime al momento del setup. Se più di
un plugin individuato rivendica lo stesso ID normalizzato di provider di setup o backend CLI, la ricerca del setup rifiuta il proprietario ambiguo invece di basarsi sull'ordine di individuazione.

### Cosa mette in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati di individuazione
- dati del registro dei manifest
- registri dei plugin caricati

Queste cache riducono gli avvii a raffica e l'overhead dei comandi ripetuti. È corretto
considerarle come cache prestazionali di breve durata, non persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre della cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello di registro

I plugin caricati non mutano direttamente globali casuali del core. Si registrano in un
registro centrale dei plugin.

Il registro tiene traccia di:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- gestori RPC del gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dal plugin

Le funzionalità del core leggono poi da quel registro invece di parlare direttamente con i moduli
dei plugin. Questo mantiene il caricamento unidirezionale:

- modulo del plugin -> registrazione nel registro
- runtime del core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core
ha bisogno di un solo punto di integrazione: “leggere il registro”, non “gestire con casi speciali ogni modulo
di plugin”.

## Callback di binding della conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere un callback dopo che una richiesta di binding viene approvata o negata:

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

Campi del payload del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, il suggerimento di distacco, l'ID del mittente e
  i metadati della conversazione

Questo callback è solo di notifica. Non cambia chi è autorizzato ad associare una
conversazione, e viene eseguito dopo che la gestione dell'approvazione del core è terminata.

## Hook di runtime del provider

I plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per un lookup economico dell'autenticazione provider tramite env
  prima del caricamento del runtime, `providerAuthAliases` per varianti del provider che condividono
  autenticazione, `channelEnvVars` per un lookup economico dell'env/setup del canale prima del caricamento del runtime,
  più `providerAuthChoices` per etichette economiche di onboarding/scelta di autenticazione e
  metadati dei flag CLI prima del caricamento del runtime
- hook in fase di configurazione: `catalog` / legacy `discovery` più `applyConfigDefaults`
- hook di runtime: `normalizeModelId`, `normalizeTransport`,
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw continua a possedere il loop generico dell'agente, il failover, la gestione della trascrizione e
la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
richiedere un intero trasporto di inferenza personalizzato.

Usa il manifest `providerAuthEnvVars` quando il provider ha credenziali basate su env
che i percorsi generici di autenticazione/stato/selettore di modelli devono vedere senza caricare il runtime del plugin.
Usa il manifest `providerAuthAliases` quando un ID provider deve riutilizzare
le variabili env, i profili di autenticazione, l'autenticazione supportata dalla configurazione e la scelta di onboarding della chiave API di un altro ID provider.
Usa il manifest `providerAuthChoices` quando le superfici CLI di onboarding/scelta di autenticazione
devono conoscere l'ID di scelta del provider, le etichette di gruppo e il semplice wiring di autenticazione a flag singolo senza caricare il runtime del provider. Mantieni `envVars` del runtime provider per suggerimenti rivolti all'operatore come etichette di onboarding o variabili di setup per
client-id/client-secret OAuth.

Usa il manifest `channelEnvVars` quando un canale ha autenticazione o setup guidati da env che
i fallback generici di shell-env, i controlli di configurazione/stato o i prompt di setup devono vedere
senza caricare il runtime del canale.

### Ordine e uso degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook approssimativamente in questo ordine.
La colonna “Quando usarlo” è la guida rapida per decidere.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`          | Il provider possiede un catalogo o valori predefiniti di base URL                                                                          |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali di configurazione posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'env o dalla semantica della famiglia di modelli del provider        |
| --  | _(built-in model lookup)_         | OpenClaw prova prima il normale percorso registro/catalogo                                                     | _(non è un hook del plugin)_                                                                                                               |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview degli ID modello prima del lookup                                            | Il provider possiede la pulizia degli alias prima della risoluzione del modello canonico                                                   |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia provider prima dell'assemblaggio generico del modello              | Il provider possiede la pulizia del trasporto per ID provider personalizzati nella stessa famiglia di trasporto                           |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione del runtime/provider                                | Il provider richiede una pulizia della configurazione che dovrebbe stare con il plugin; gli helper bundled della famiglia Google fanno anche da backstop per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai provider di configurazione             | Il provider richiede correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                          |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marker env per i provider di configurazione prima del caricamento dell'autenticazione di runtime | Il provider ha una risoluzione della chiave API con marker env posseduta dal provider; anche `amazon-bedrock` ha qui un resolver integrato per il marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o supportata dalla configurazione senza persistere testo in chiaro    | Il provider può operare con un marker di credenziale sintetico/locale                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni posseduti dal provider; `persistence` predefinito è `runtime-only` per credenziali possedute da CLI/app | Il provider riutilizza credenziali di autenticazione esterna senza persistere refresh token copiati                                       |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la priorità dei placeholder sintetici di profilo memorizzati rispetto all'autenticazione supportata da env/config | Il provider memorizza profili placeholder sintetici che non dovrebbero avere la precedenza                                                |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello posseduti dal provider non ancora presenti nel registro locale                | Il provider accetta ID modello upstream arbitrari                                                                                          |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider ha bisogno di metadati di rete prima di risolvere ID sconosciuti                                                              |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che l'embedded runner usi il modello risolto                                          | Il provider richiede riscritture del trasporto ma usa comunque un trasporto del core                                                      |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                    | Il provider riconosce i propri modelli su trasporti proxy senza assumere il controllo del provider                                        |
| 15  | `capabilities`                    | Metadati di trascrizione/strumentazione posseduti dal provider usati dalla logica condivisa del core           | Il provider richiede peculiarità della trascrizione/della famiglia del provider                                                            |
| 16  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che l'embedded runner li veda                                      | Il provider richiede pulizia dello schema della famiglia di trasporto                                                                      |
| 17  | `inspectToolSchemas`              | Espone diagnostica degli schemi posseduta dal provider dopo la normalizzazione                                 | Il provider vuole warning sulle keyword senza insegnare al core regole specifiche del provider                                            |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del ragionamento nativo rispetto a quello con tag                             | Il provider richiede output di ragionamento/finale con tag invece di campi nativi                                                         |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di stream               | Il provider richiede parametri di richiesta predefiniti o pulizia dei parametri per provider                                              |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                        | Il provider richiede un protocollo wire personalizzato, non solo un wrapper                                                               |
| 21  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                  | Il provider richiede wrapper di compatibilità per header/body/modello della richiesta senza un trasporto personalizzato                   |
| 22  | `resolveTransportTurnState`       | Collega header o metadati nativi per turno al trasporto                                                        | Il provider vuole che i trasporti generici inviino l'identità del turno nativa del provider                                               |
| 23  | `resolveWebSocketSessionPolicy`   | Collega header WebSocket nativi o una policy di cool-down della sessione                                       | Il provider vuole che i trasporti WS generici regolino gli header di sessione o la policy di fallback                                     |
| 24  | `formatApiKey`                    | Formatter del profilo di autenticazione: il profilo memorizzato diventa la stringa `apiKey` di runtime        | Il provider memorizza metadati di autenticazione aggiuntivi e richiede una forma personalizzata del token di runtime                     |
| 25  | `refreshOAuth`                    | Override dell'aggiornamento OAuth per endpoint di refresh personalizzati o policy di errore nel refresh        | Il provider non rientra nei refresher condivisi `pi-ai`                                                                                    |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                          | Il provider richiede indicazioni di riparazione dell'autenticazione possedute dal provider dopo un errore di refresh                      |
| 27  | `matchesContextOverflowError`     | Matcher posseduto dal provider per overflow della finestra di contesto                                         | Il provider ha errori raw di overflow che le euristiche generiche non intercetterebbero                                                   |
| 28  | `classifyFailoverReason`          | Classificazione della ragione di failover posseduta dal provider                                               | Il provider può mappare errori raw di API/trasporto a rate-limit/sovraccarico/ecc.                                                        |
| 29  | `isCacheTtlEligible`              | Policy della prompt-cache per provider proxy/backhaul                                                          | Il provider richiede gating TTL della cache specifico per il proxy                                                                         |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per autenticazione mancante                                    | Il provider richiede un suggerimento di recupero per autenticazione mancante specifico del provider                                       |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più eventuale suggerimento d'errore rivolto all'utente              | Il provider deve nascondere righe upstream obsolete o sostituirle con un suggerimento del vendor                                          |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo l'individuazione                                             | Il provider richiede righe sintetiche di forward-compat in `models list` e nei selettori                                                  |
| 33  | `isBinaryThinking`                | Toggle di ragionamento on/off per provider con binary thinking                                                 | Il provider espone solo ragionamento binario attivo/disattivo                                                                              |
| 34  | `supportsXHighThinking`           | Supporto al ragionamento `xhigh` per modelli selezionati                                                       | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                               |
| 35  | `resolveDefaultThinkingLevel`     | Livello `/think` predefinito per una specifica famiglia di modelli                                             | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                           |
| 36  | `isModernModelRef`                | Matcher di modelli moderni per filtri di profili live e selezione smoke                                        | Il provider possiede il matching del modello preferito per live/smoke                                                                      |
| 37  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave effettivo di runtime subito prima dell'inferenza      | Il provider richiede uno scambio di token o una credenziale di richiesta di breve durata                                                  |
| 38  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e superfici di stato correlate                   | Il provider richiede parsing personalizzato del token di utilizzo/quota o una credenziale di utilizzo diversa                             |
| 39  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo che l'autenticazione è risolta   | Il provider richiede un endpoint di utilizzo specifico del provider o un parser del payload                                                |
| 40  | `createEmbeddingProvider`         | Costruisce un adattatore di embedding posseduto dal provider per memoria/ricerca                               | Il comportamento di embedding della memoria appartiene al plugin provider                                                                  |
| 41  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                  | Il provider richiede una policy personalizzata per la trascrizione (ad esempio la rimozione dei blocchi di thinking)                     |
| 42  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                   | Il provider richiede riscritture di replay specifiche del provider oltre agli helper condivisi di compattazione                           |
| 43  | `validateReplayTurns`             | Validazione finale o rimodellamento dei turni di replay prima dell'embedded runner                             | Il trasporto del provider richiede una validazione dei turni più rigorosa dopo la sanitizzazione generica                                 |
| 44  | `onModelSelected`                 | Esegue effetti collaterali post-selezione posseduti dal provider                                               | Il provider richiede telemetria o stato posseduto dal provider quando un modello diventa attivo                                           |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider capaci di hook
finché uno non modifica effettivamente l'ID del modello o il trasporto/la configurazione. Questo mantiene
funzionanti gli shim di alias/compatibilità del provider senza richiedere al chiamante di sapere quale
plugin bundled possiede la riscrittura. Se nessun hook provider riscrive una voce di configurazione supportata
della famiglia Google, il normalizzatore di configurazione Google bundled applica comunque
quella pulizia di compatibilità.

Se il provider richiede un protocollo wire completamente personalizzato o un esecutore di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook servono per il comportamento del provider
che continua a essere eseguito nel normale loop di inferenza di OpenClaw.

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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` perché possiede la forward-compat di Claude 4.6,
  i suggerimenti della famiglia provider, la guida di riparazione dell'autenticazione, l'integrazione
  dell'endpoint di utilizzo, l'idoneità della prompt-cache, i valori predefiniti di configurazione sensibili all'autenticazione, la policy di thinking
  predefinita/adattiva di Claude e il model shaping dello stream specifico di Anthropic per
  header beta, `/fast` / `serviceTier` e `context1m`.
- Gli helper di stream specifici di Claude di Anthropic restano per ora nella
  propria seam pubblica `api.ts` / `contract-api.ts` del plugin bundled. Questa superficie del pacchetto
  esporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder di wrapper Anthropic di livello inferiore invece di ampliare l'SDK generico attorno alle regole degli header beta di un solo
  provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities` più `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  perché possiede la forward-compat di GPT-5.4, la normalizzazione diretta di OpenAI
  `openai-completions` -> `openai-responses`, i suggerimenti di autenticazione consapevoli di Codex,
  la soppressione di Spark, le righe sintetiche dell'elenco OpenAI e la policy di thinking /
  modello live di GPT-5; la famiglia di stream `openai-responses-defaults` possiede i
  wrapper condivisi nativi di OpenAI Responses per header di attribuzione,
  `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa di Codex,
  model shaping del payload di compatibilità del reasoning e gestione del contesto di Responses.
- OpenRouter usa `catalog` più `resolveDynamicModel` e
  `prepareDynamicModel` perché il provider è pass-through e può esporre nuovi
  ID modello prima che il catalogo statico di OpenClaw venga aggiornato; usa anche
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` per mantenere
  header di richiesta specifici del provider, metadati di routing, patch del reasoning e
  policy della prompt-cache fuori dal core. La sua policy di replay proviene dalla
  famiglia `passthrough-gemini`, mentre la famiglia di stream `openrouter-thinking`
  possiede l'iniezione del reasoning del proxy e i salti per modello non supportato / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` più `prepareRuntimeAuth` e `fetchUsageSnapshot` perché ha
  bisogno di login dispositivo posseduto dal provider, comportamento di fallback del modello, peculiarità della trascrizione di Claude,
  uno scambio token GitHub -> token Copilot e un endpoint di utilizzo posseduto dal provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` più
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` perché continua
  a funzionare sui trasporti OpenAI del core ma possiede la propria normalizzazione di
  trasporto/base URL, la policy di fallback per il refresh OAuth, la scelta predefinita del trasporto,
  le righe sintetiche del catalogo Codex e l'integrazione dell'endpoint di utilizzo di ChatGPT; condivide
  la stessa famiglia di stream `openai-responses-defaults` di OpenAI diretto.
- Google AI Studio e Gemini CLI OAuth usano `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` perché la
  famiglia di replay `google-gemini` possiede il fallback di forward-compat di Gemini 3.1,
  la validazione nativa del replay Gemini, la sanitizzazione del replay di bootstrap, la modalità di output del reasoning
  con tag e il matching dei modelli moderni, mentre la
  famiglia di stream `google-thinking` possiede la normalizzazione del payload di thinking di Gemini;
  Gemini CLI OAuth usa anche `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` per formattazione del token, parsing del token e collegamento
  dell'endpoint quota.
- Anthropic Vertex usa `buildReplayPolicy` tramite la
  famiglia di replay `anthropic-by-model` così la pulizia del replay specifica di Claude resta
  limitata agli ID Claude invece che a ogni trasporto `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` perché possiede
  la classificazione degli errori specifica di Bedrock per throttling/non pronto/overflow del contesto
  per il traffico Anthropic-on-Bedrock; la sua policy di replay condivide comunque lo stesso
  guard solo-Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode e Opencode Go usano `buildReplayPolicy`
  tramite la famiglia di replay `passthrough-gemini` perché fanno da proxy ai modelli Gemini
  tramite trasporti compatibili con OpenAI e necessitano della
  sanitizzazione della thought-signature di Gemini senza validazione nativa del replay Gemini né
  riscritture di bootstrap.
- MiniMax usa `buildReplayPolicy` tramite la
  famiglia di replay `hybrid-anthropic-openai` perché un unico provider possiede sia la semantica
  di messaggi Anthropic sia quella compatibile con OpenAI; mantiene la rimozione dei blocchi di thinking solo-Claude
  sul lato Anthropic, mentre riporta la modalità di output del reasoning a quella nativa, e la famiglia di stream `minimax-fast-mode`
  possiede le riscritture del modello in fast mode sul percorso di stream condiviso.
- Moonshot usa `catalog` più `wrapStreamFn` perché continua a usare il
  trasporto OpenAI condiviso ma richiede una normalizzazione del payload di thinking posseduta dal provider; la
  famiglia di stream `moonshot-thinking` mappa la configurazione più lo stato `/think` sul proprio payload nativo di binary thinking.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` perché ha bisogno di header di richiesta posseduti dal provider,
  normalizzazione del payload di reasoning, suggerimenti di trascrizione Gemini e gating TTL della cache Anthropic;
  la famiglia di stream `kilocode-thinking` mantiene l'iniezione del thinking Kilo
  sul percorso di stream proxy condiviso saltando `kilo/auto` e
  altri ID modello proxy che non supportano payload di reasoning espliciti.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` perché possiede il fallback GLM-5,
  i valori predefiniti `tool_stream`, la UX del binary thinking, il matching dei modelli moderni e sia
  l'autenticazione per l'utilizzo sia il recupero della quota; la famiglia di stream `tool-stream-default-on` mantiene
  il wrapper `tool_stream` attivo per impostazione predefinita fuori dalla colla scritta a mano per singolo provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  perché possiede la normalizzazione nativa del trasporto xAI Responses, le riscritture alias della fast mode di Grok, il `tool_stream` predefinito, la pulizia di strict-tool / payload di reasoning,
  il riuso dell'autenticazione di fallback per gli strumenti posseduti dal plugin, la risoluzione forward-compat del modello Grok e patch di compatibilità possedute dal provider come il profilo di schema degli strumenti xAI,
  keyword di schema non supportate, `web_search` nativo e la decodifica delle entità HTML
  negli argomenti delle chiamate di strumenti.
- Mistral, OpenCode Zen e OpenCode Go usano solo `capabilities` per mantenere
  le peculiarità di trascrizione/strumentazione fuori dal core.
- I provider bundled solo catalogo come `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine` usano
  solo `catalog`.
- Qwen usa `catalog` per il proprio provider testuale più registrazioni condivise di comprensione dei media e generazione video per le sue superfici multimodali.
- MiniMax e Xiaomi usano `catalog` più hook di utilizzo perché il loro comportamento `/usage`
  è posseduto dal plugin anche se l'inferenza continua a passare attraverso i trasporti condivisi.

## Helper di runtime

I plugin possono accedere a helper selezionati del core tramite `api.runtime`. Per la TTS:

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

- `textToSpeech` restituisce il normale payload di output TTS del core per superfici file/messaggio vocale.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per selettori vocali o flussi di setup posseduti dal vendor.
- Gli elenchi di voci possono includere metadati più ricchi come locale, genere e tag di personalità per selettori consapevoli del provider.
- OpenAI ed ElevenLabs supportano oggi la telefonia. Microsoft no.

I plugin possono anche registrare provider vocali tramite `api.registerSpeechProvider(...)`.

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
- Usa i provider vocali per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato all'ID provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un solo plugin vendor può possedere
  provider testuali, vocali, di immagini e futuri provider media man mano che OpenClaw aggiunge questi
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un solo provider tipizzato di
media-understanding invece di una generica raccolta chiave/valore:

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
- Mantieni il comportamento del vendor nel plugin provider.
- L'espansione additiva dovrebbe restare tipizzata: nuovi metodi facoltativi, nuovi campi risultato
  facoltativi, nuove capacità facoltative.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capacità e l'helper di runtime
  - i plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper di runtime media-understanding, i plugin possono chiamare:

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

Per la trascrizione audio, i plugin possono usare il runtime media-understanding
oppure il vecchio alias STT:

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
- Usa la configurazione audio media-understanding del core (`tools.media.audio`) e l'ordine di fallback del provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (per esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità.

I plugin possono anche avviare esecuzioni in background di subagent tramite `api.runtime.subagent`:

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

- `provider` e `model` sono override facoltativi per singola esecuzione, non modifiche persistenti della sessione.
- OpenClaw onora questi campi di override solo per chiamanti attendibili.
- Per le esecuzioni di fallback possedute dal plugin, gli operatori devono effettuare l'opt-in con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin attendibili a target canonici specifici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent di plugin non attendibili continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente nel fallback.

Per la ricerca web, i plugin possono consumare l'helper di runtime condiviso invece di
entrare nel wiring dello strumento agente:

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
- Usa i provider di ricerca web per i trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i plugin di funzionalità/canale che hanno bisogno di comportamento di ricerca senza dipendere dal wrapper dello strumento agente.

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

- `generate(...)`: genera un'immagine usando la catena di provider di generazione immagini configurata.
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capacità.

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

- `path`: percorso della route sotto il server HTTP del gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione del gateway, oppure `"plugin"` per autenticazione/validazione webhook gestita dal plugin.
- `match`: facoltativo. `"exact"` (predefinito) oppure `"prefix"`.
- `replaceExisting`: facoltativo. Consente allo stesso plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare `auth` esplicitamente.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo allo stesso livello di auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente scope di runtime operatore. Servono per webhook/validazione firme gestiti dal plugin, non per chiamate helper del Gateway con privilegi.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope di runtime della richiesta Gateway, ma tale scope è intenzionalmente conservativo:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope di runtime delle route plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP affidabili basate su identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) onorano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste di route plugin basate su identità, lo scope di runtime ricade su `operator.write`
- Regola pratica: non presumere che una route plugin con autenticazione gateway sia implicitamente una superficie admin. Se la tua route richiede comportamento solo admin, richiedi una modalità di autenticazione basata su identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import dell'SDK plugin

Usa i sottopercorsi dell'SDK invece dell'import monolitico `openclaw/plugin-sdk` quando
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
  `openclaw/plugin-sdk/webhook-ingress` per il wiring condiviso di setup/auth/reply/webhook.
  `channel-inbound` è la sede condivisa per debounce, corrispondenza delle mention,
  helper della mention-policy inbound, formattazione delle envelope e helper del contesto
  delle envelope inbound.
  `channel-setup` è la seam ristretta di setup con installazione facoltativa.
  `setup-runtime` è la superficie di setup sicura per il runtime usata da `setupEntry` /
  avvio differito, inclusi gli adattatori di patch di setup sicuri per l'import.
  `setup-adapter-runtime` è la seam dell'adattatore di setup account consapevole dell'env.
  `setup-tools` è la piccola seam helper per CLI/archivi/documentazione (`formatCliCommand`,
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
  comandi personalizzati Telegram e resta disponibile anche se la superficie di contratto Telegram bundled è temporaneamente non disponibile.
  `text-runtime` è la seam condivisa per testo/Markdown/logging, inclusi
  stripping del testo visibile all'assistente, helper di rendering/chunking Markdown, helper di redazione, helper dei tag direttiva e utilità di testo sicuro.
- Le seam di canale specifiche per l'approvazione dovrebbero preferire un singolo contratto `approvalCapability`
  sul plugin. Il core legge poi autenticazione di approvazione, consegna, render,
  routing nativo e comportamento lazy del gestore nativo tramite quella sola capacità
  invece di mescolare il comportamento di approvazione in campi non correlati del plugin.
- `openclaw/plugin-sdk/channel-runtime` è deprecato e rimane solo come
  shim di compatibilità per plugin meno recenti. Il nuovo codice dovrebbe importare invece le primitive generiche più ristrette, e il codice del repo non dovrebbe aggiungere nuovi import dello
  shim.
- Gli interni delle estensioni bundled restano privati. I plugin esterni dovrebbero usare solo i sottopercorsi `openclaw/plugin-sdk/*`. Il codice core/test di OpenClaw può usare i
  punti di ingresso pubblici del repo sotto la root di un pacchetto plugin come `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e file a ambito ristretto come
  `login-qr-api.js`. Non importare mai `src/*` di un pacchetto plugin dal core o da
  un'altra estensione.
- Suddivisione dei punti di ingresso del repo:
  `<plugin-package-root>/api.js` è il barrel helper/tipi,
  `<plugin-package-root>/runtime-api.js` è il barrel solo runtime,
  `<plugin-package-root>/index.js` è l'entry del plugin bundled,
  e `<plugin-package-root>/setup-entry.js` è l'entry del plugin di setup.
- Esempi attuali di provider bundled:
  - Anthropic usa `api.js` / `contract-api.js` per helper di stream Claude come
    `wrapAnthropicProviderStream`, helper per header beta e parsing di `service_tier`.
  - OpenAI usa `api.js` per builder provider, helper del modello predefinito e
    builder provider realtime.
  - OpenRouter usa `api.js` per il proprio builder provider più helper di onboarding/configurazione, mentre `register.runtime.js` può ancora riesportare helper generici `plugin-sdk/provider-stream` per uso locale nel repo.
- I punti di ingresso pubblici caricati tramite facade preferiscono lo snapshot attivo della configurazione di runtime
  quando esiste, poi ricadono sul file di configurazione risolto su disco quando
  OpenClaw non sta ancora servendo uno snapshot di runtime.
- Le primitive generiche condivise restano il contratto pubblico preferito dell'SDK. Esiste ancora un piccolo
  insieme di compatibilità riservato di seam helper brandizzate per canali bundled. Trattale come seam di manutenzione/compatibilità bundled, non come nuovi target di import per terze parti; i nuovi contratti cross-channel dovrebbero comunque arrivare su sottopercorsi generici `plugin-sdk/*` o sui barrel locali del plugin `api.js` /
  `runtime-api.js`.

Nota sulla compatibilità:

- Evita il barrel root `openclaw/plugin-sdk` per il nuovo codice.
- Preferisci prima le primitive stabili e ristrette. I sottopercorsi più recenti setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sono il contratto previsto per il nuovo
  lavoro su plugin bundled ed esterni.
  Il parsing/matching dei target appartiene a `openclaw/plugin-sdk/channel-targets`.
  I gate delle azioni sui messaggi e gli helper message-id delle reazioni appartengono a
  `openclaw/plugin-sdk/channel-actions`.
- I barrel helper specifici delle estensioni bundled non sono stabili per impostazione predefinita. Se un
  helper serve solo a un'estensione bundled, tienilo dietro la seam locale `api.js` o `runtime-api.js`
  dell'estensione invece di promuoverlo in
  `openclaw/plugin-sdk/<extension>`.
- Le nuove seam helper condivise dovrebbero essere generiche, non brandizzate per canale. Il parsing condiviso dei target
  appartiene a `openclaw/plugin-sdk/channel-targets`; gli interni specifici del canale
  restano dietro la seam locale `api.js` o `runtime-api.js` del plugin proprietario.
- Sottopercorsi specifici della capacità come `image-generation`,
  `media-understanding` e `speech` esistono perché i plugin bundled/nativi li usano
  oggi. La loro presenza non significa di per sé che ogni helper esportato sia un
  contratto esterno congelato a lungo termine.

## Schemi dello strumento dei messaggi

I plugin dovrebbero possedere i contributi di schema specifici del canale per `describeMessageTool(...)`.
Mantieni i campi specifici del provider nel plugin, non nel core condiviso.

Per frammenti di schema condivisi e portabili, riusa gli helper generici esportati tramite
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` per payload in stile griglia di pulsanti
- `createMessageToolCardSchema()` per payload di card strutturate

Se una forma di schema ha senso solo per un provider, definiscila nel codice
del plugin stesso invece di promuoverla nell'SDK condiviso.

## Risoluzione dei target di canale

I plugin di canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni generico
l'host outbound condiviso e usa la superficie dell'adattatore di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  deve essere trattato come `direct`, `group` o `channel` prima del lookup nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione simile a ID invece che alla ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core ha bisogno di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un
  mancato riscontro nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione specifica del provider
  una volta che un target è stato risolto.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca in peer/gruppi.
- Usa `looksLikeId` per controlli del tipo “tratta questo come ID target esplicito/nativo”.
- Usa `resolveTarget` per il fallback di normalizzazione specifico del provider, non per una
  ricerca ampia nella directory.
- Mantieni gli ID nativi del provider come chat id, thread id, JID, handle e room
  id dentro valori `target` o parametri specifici del provider, non in campi SDK generici.

## Directory supportate dalla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
plugin e riutilizzare gli helper condivisi di
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale ha peer/gruppi supportati dalla configurazione come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici della directory con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtraggio delle query
- applicazione del limite
- helper di deduplica/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione specifica dell'account del canale e la normalizzazione degli ID dovrebbero restare
nell'implementazione del plugin.

## Cataloghi provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede ID modello specifici del provider, valori predefiniti di base URL
o metadati di modello protetti da autenticazione.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai
provider impliciti integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione di chiavi, così i plugin possono intenzionalmente sovrascrivere una
voce provider integrata con lo stesso ID provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione in sola lettura dei canali

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso di runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano segreti richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi di doctor/riparazione
  della configurazione non dovrebbero aver bisogno di materializzare credenziali di runtime solo
  per descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituire solo lo stato descrittivo dell'account.
- Preservare `enabled` e `configured`.
- Includere campi di sorgente/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire i valori raw dei token solo per riportare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il relativo campo di sorgente) è sufficiente per i comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di riportare “configurato ma non disponibile in questo percorso di comando”
invece di andare in crash o riportare erroneamente l'account come non configurato.

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

Guardrail di sicurezza: ogni voce `openclaw.extensions` deve restare all'interno della directory plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (nessuno script lifecycle, nessuna dipendenza dev a runtime). Mantieni gli alberi delle dipendenze dei plugin in “pure JS/TS” ed evita pacchetti che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo mantiene avvio e setup più leggeri
quando l'entry principale del plugin collega anche strumenti, hook o altro codice
solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può includere un plugin di canale nello stesso percorso `setupEntry` durante la fase di
avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, questo significa che l'entry di setup
deve registrare ogni capacità posseduta dal canale da cui dipende l'avvio, come:

- la registrazione del canale stessa
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- eventuali metodi gateway, strumenti o servizi che devono esistere durante quella stessa finestra

Se la tua entry completa possiede ancora qualche capacità richiesta all'avvio, non abilitare
questo flag. Mantieni il comportamento predefinito del plugin e lascia che OpenClaw carichi l'entry completa durante l'avvio.

I canali bundled possono anche pubblicare helper di superficie contrattuale solo setup che il core
può consultare prima che il runtime completo del canale sia caricato. L'attuale superficie di promozione setup
è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale a account singolo
in `channels.<id>.accounts.*` senza caricare l'entry completa del plugin.
Matrix è l'esempio bundled attuale: sposta solo le chiavi auth/bootstrap in un
account promosso con nome quando esistono già account con nome e può preservare una
chiave default-account configurata non canonica invece di creare sempre
`accounts.default`.

Questi adattatori di patch setup mantengono lazy l'individuazione della superficie contrattuale bundled. Il tempo di import resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di rientrare nell'avvio del canale bundled all'import del modulo.

Quando queste superfici di avvio includono metodi RPC del gateway, mantienili su un
prefisso specifico del plugin. I namespace admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e vengono sempre risolti
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

### Metadati del catalogo dei canali

I plugin di canale possono pubblicizzare metadati di setup/individuazione tramite `openclaw.channel` e
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
      "blurb": "Chat self-hosted tramite bot webhook di Nextcloud Talk.",
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
- `docsLabel`: sovrascrive il testo del link per il collegamento alla documentazione
- `preferOver`: ID plugin/canale a priorità più bassa che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli di testo per la superficie di selezione
- `markdownCapable`: segna il canale come capace di Markdown per le decisioni di formattazione outbound
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai picker interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: segna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: include il canale nel flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede un account binding esplicito anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce il lookup di sessione durante la risoluzione dei target di annuncio

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un export di registro MPM).
Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgole/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

## Plugin del motore di contesto

I plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione, assemblaggio
e compattazione. Registrali dal tuo plugin con
`api.registerContextEngine(id, factory)`, poi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usa questo quando il tuo plugin deve sostituire o estendere la pipeline di contesto
predefinita invece di limitarsi ad aggiungere ricerca nella memoria o hook.

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

Se il tuo motore **non** possiede l'algoritmo di compattazione, mantieni `compact()`
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

## Aggiunta di una nuova capacità

Quando un plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema dei plugin con un accesso privato interno. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definire il contratto del core
   Decidi quale comportamento condiviso dovrebbe possedere il core: policy, fallback, merge della configurazione,
   ciclo di vita, semantica rivolta ai canali e forma dell'helper di runtime.
2. aggiungere superfici tipizzate di registrazione/runtime dei plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la superficie di capacità tipizzata
   più piccola utile.
3. collegare i consumer del core + canale/funzionalità
   I canali e i plugin di funzionalità dovrebbero consumare la nuova capacità tramite il core,
   non importando direttamente un'implementazione vendor.
4. registrare implementazioni vendor
   I plugin vendor registrano poi i propri backend rispetto alla capacità.
5. aggiungere copertura contrattuale
   Aggiungi test così che proprietà e forma di registrazione restino esplicite nel tempo.

Questo è il modo in cui OpenClaw resta opinionato senza diventare hardcoded sulla visione del mondo di un
singolo provider. Vedi il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist della capacità

Quando aggiungi una nuova capacità, l'implementazione dovrebbe di solito toccare queste
superfici insieme:

- tipi di contratto del core in `src/<capability>/types.ts`
- runner/helper di runtime del core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API plugin in `src/plugins/types.ts`
- wiring del registro dei plugin in `src/plugins/registry.ts`
- esposizione di runtime del plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale
  devono consumarla
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, di solito è un segnale che la capacità
non è ancora completamente integrata.

### Template della capacità

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

Pattern del test di contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto di capacità + l'orchestrazione
- i plugin vendor possiedono le implementazioni vendor
- i plugin di funzionalità/canale consumano helper di runtime
- i test di contratto mantengono esplicita la proprietà
