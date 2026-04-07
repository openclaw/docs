---
read_when:
    - Creazione o debug di plugin OpenClaw nativi
    - Comprendere il modello di capacità dei plugin o i confini di ownership
    - Lavorare sulla pipeline di caricamento o sul registro dei plugin
    - Implementare hook runtime dei provider o plugin di canale
sidebarTitle: Internals
summary: 'Componenti interni dei plugin: modello delle capacità, ownership, contratti, pipeline di caricamento e helper runtime'
title: Componenti interni dei plugin
x-i18n:
    generated_at: "2026-04-07T08:17:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: a48b387152c5a6a9782c5aaa9d6c215c16adb7cb256302d3e85f80b03f9b6898
    source_path: plugins/architecture.md
    workflow: 15
---

# Componenti interni dei plugin

<Info>
  Questo è il **riferimento architetturale approfondito**. Per le guide pratiche, vedi:
  - [Installa e usa i plugin](/it/tools/plugin) — guida utente
  - [Getting Started](/it/plugins/building-plugins) — primo tutorial sui plugin
  - [Channel Plugins](/it/plugins/sdk-channel-plugins) — crea un canale di messaggistica
  - [Provider Plugins](/it/plugins/sdk-provider-plugins) — crea un provider di modelli
  - [SDK Overview](/it/plugins/sdk-overview) — mappa degli import e API di registrazione
</Info>

Questa pagina copre l'architettura interna del sistema di plugin di OpenClaw.

## Modello di capacità pubblico

Le capacità sono il modello pubblico dei **plugin nativi** all'interno di OpenClaw. Ogni
plugin OpenClaw nativo si registra rispetto a uno o più tipi di capacità:

| Capacità              | Metodo di registrazione                         | Esempi di plugin                    |
| --------------------- | ----------------------------------------------- | ----------------------------------- |
| Inferenza testo       | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                | `openai`, `anthropic`               |
| Speech                | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Trascrizione realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voce realtime         | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                  |
| Generazione immagini  | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale  | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Generazione video     | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Recupero web          | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Ricerca web           | `api.registerWebSearchProvider(...)`            | `google`                            |
| Canale / messaggistica | `api.registerChannel(...)`                     | `msteams`, `matrix`                 |

Un plugin che registra zero capacità ma fornisce hook, strumenti o
servizi è un plugin **legacy solo hook**. Questo pattern è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello di capacità è arrivato nel core ed è usato oggi dai plugin
inclusi/nativi, ma la compatibilità con i plugin esterni richiede ancora un criterio più rigoroso di “è
esportato, quindi è congelato”.

Indicazioni attuali:

- **plugin esterni esistenti:** mantieni funzionanti le integrazioni basate su hook; trattale
  come base di compatibilità
- **nuovi plugin inclusi/nativi:** preferisci la registrazione esplicita delle capacità invece di
  accessi specifici del vendor o di nuovi design solo hook
- **plugin esterni che adottano la registrazione delle capacità:** consentito, ma tratta le superfici helper specifiche della capacità come in evoluzione, a meno che la documentazione non segni esplicitamente un contratto come stabile

Regola pratica:

- le API di registrazione delle capacità sono la direzione prevista
- gli hook legacy restano il percorso più sicuro per evitare rotture per i plugin esterni durante
  la transizione
- i sotto-percorsi helper esportati non sono tutti equivalenti; preferisci il contratto ristretto documentato, non esportazioni helper incidentali

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma in base al suo comportamento
di registrazione effettivo (non solo ai metadati statici):

- **plain-capability** -- registra esattamente un tipo di capacità (per esempio un
  plugin solo provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capacità (per esempio
  `openai` possiede inferenza testo, speech, comprensione dei media e generazione
  immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), nessuna capacità,
  strumento, comando o servizio
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capacità

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e il dettaglio
delle capacità. Vedi [riferimento CLI](/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per
i plugin solo hook. I plugin legacy del mondo reale dipendono ancora da esso.

Direzione:

- mantienilo funzionante
- documentalo come legacy
- preferisci `before_model_resolve` per il lavoro di override modello/provider
- preferisci `before_prompt_build` per il lavoro di mutazione dei prompt
- rimuovilo solo dopo che l'uso reale sarà diminuito e la copertura delle fixture dimostrerà la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                 |
| ------------------------- | ----------------------------------------------------------- |
| **config valid**          | La configurazione viene analizzata correttamente e i plugin si risolvono |
| **compatibility advisory** | Il plugin usa un pattern supportato ma più vecchio (es. `hook-only`) |
| **legacy warning**        | Il plugin usa `before_agent_start`, che è deprecato        |
| **hard error**            | La configurazione non è valida o il plugin non è riuscito a caricarsi |

Né `hook-only` né `before_agent_start` romperanno il tuo plugin oggi --
`hook-only` è solo informativo, e `before_agent_start` genera solo un avviso. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

1. **Manifest + discovery**
   OpenClaw trova i plugin candidati dai percorsi configurati, dalle radici del workspace,
   dalle radici globali delle estensioni e dalle estensioni incluse. La discovery legge prima i
   manifest nativi `openclaw.plugin.json` più i manifest bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un plugin scoperto è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento runtime**
   I plugin OpenClaw nativi vengono caricati in-process tramite jiti e registrano
   capacità in un registro centrale. I bundle compatibili vengono normalizzati in
   record del registro senza importare codice runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione
   dei provider, hook, route HTTP, comandi CLI e servizi.

Per la CLI dei plugin in particolare, la discovery dei comandi root è divisa in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può restare lazy e registrarsi al primo invoco

Questo mantiene il codice CLI posseduto dal plugin all'interno del plugin, consentendo comunque a OpenClaw di
riservare i nomi dei comandi root prima del parsing.

Il confine di progettazione importante:

- la discovery + la validazione della configurazione dovrebbero funzionare dai **metadati del manifest/schema**
  senza eseguire il codice del plugin
- il comportamento runtime nativo proviene dal percorso `register(api)` del modulo del plugin

Questa separazione consente a OpenClaw di validare la configurazione, spiegare i plugin mancanti/disabilitati e
costruire suggerimenti per UI/schema prima che il runtime completo sia attivo.

### Plugin di canale e strumento condiviso dei messaggi

I plugin di canale non devono registrare uno strumento separato send/edit/react per le
normali azioni di chat. OpenClaw mantiene uno strumento `message` condiviso nel core, e i
plugin di canale gestiscono discovery ed esecuzione specifiche del canale dietro di esso.

Il confine attuale è:

- il core gestisce l'host condiviso dello strumento `message`, il wiring del prompt, il
  bookkeeping di sessioni/thread e il dispatch dell'esecuzione
- i plugin di canale gestiscono la discovery di azioni con scope, la discovery di capacità e ogni
  frammento di schema specifico del canale
- i plugin di canale gestiscono la grammatica delle conversazioni di sessione specifica del provider, come
  gli ID delle conversazioni codificano gli ID thread o ereditano dalle conversazioni padre
- i plugin di canale eseguono l'azione finale tramite il loro adapter delle azioni

Per i plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata unificata di discovery
consente a un plugin di restituire insieme le sue azioni visibili, capacità e contributi di schema
in modo che questi elementi non divergano.

Il core passa lo scope runtime a questo passaggio di discovery. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` trusted in ingresso

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre
azioni sui messaggi in base all'account attivo, alla stanza/thread/messaggio corrente, o all'identità trusted
del richiedente senza codificare rigidamente rami specifici del canale nello strumento `message`
del core.

Per questo motivo i cambiamenti di routing dell'embedded runner restano lavoro del plugin: il runner è
responsabile dell'inoltro dell'identità corrente della chat/sessione nel confine di discovery del plugin in modo che lo strumento condiviso `message` esponga la giusta
superficie posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i plugin inclusi dovrebbero mantenere il runtime
di esecuzione all'interno dei propri moduli di estensione. Il core non gestisce più i
runtime delle azioni sui messaggi di Discord, Slack, Telegram o WhatsApp in `src/agents/tools`.
Non pubblichiamo sotto-percorsi separati `plugin-sdk/*-action-runtime`, e i plugin inclusi
dovrebbero importare direttamente il proprio codice runtime locale dai moduli
di loro proprietà.

Lo stesso confine si applica in generale ai punti di integrazione SDK denominati come provider: il core non
dovrebbe importare convenience barrel specifici del canale per Slack, Discord, Signal,
WhatsApp o estensioni simili. Se il core ha bisogno di un comportamento, deve o consumare il
barrel `api.ts` / `runtime-api.ts` del plugin incluso, oppure promuovere l'esigenza
in una capacità generica ristretta nell'SDK condiviso.

Per i sondaggi in particolare, esistono due percorsi di esecuzione:

- `outbound.sendPoll` è la base condivisa per i canali che rientrano nel modello
  comune di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per la semantica dei sondaggi specifica del canale o per parametri extra del sondaggio

Il core ora rimanda il parsing condiviso dei sondaggi fino a dopo che il dispatch del sondaggio del plugin ha rifiutato
l'azione, in modo che i gestori dei sondaggi posseduti dal plugin possano accettare campi di sondaggio specifici del canale senza essere bloccati prima dal parser generico dei sondaggi.

Vedi [Pipeline di caricamento](#load-pipeline) per la sequenza completa di avvio.

## Modello di ownership delle capacità

OpenClaw tratta un plugin nativo come confine di ownership per una **azienda** o una
**funzionalità**, non come un insieme eterogeneo di integrazioni non correlate.

Ciò significa:

- un plugin aziendale dovrebbe di norma possedere tutte le superfici OpenClaw-facing
  di quell'azienda
- un plugin di funzionalità dovrebbe di norma possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità condivise del core invece di reimplementare
  comportamenti dei provider in modo ad hoc

Esempi:

- il plugin incluso `openai` possiede il comportamento del provider di modelli OpenAI e il comportamento OpenAI
  speech + realtime-voice + media-understanding + image-generation
- il plugin incluso `elevenlabs` possiede il comportamento speech di ElevenLabs
- il plugin incluso `microsoft` possiede il comportamento speech di Microsoft
- il plugin incluso `google` possiede il comportamento del provider di modelli Google più Google
  media-understanding + image-generation + web-search
- il plugin incluso `firecrawl` possiede il comportamento web-fetch di Firecrawl
- i plugin inclusi `minimax`, `mistral`, `moonshot` e `zai` possiedono i propri
  backend media-understanding
- il plugin incluso `qwen` possiede il comportamento del provider di testo Qwen più
  media-understanding e video-generation
- il plugin `voice-call` è un plugin di funzionalità: possiede transport di chiamata, strumenti,
  CLI, route e bridging dei media-stream Twilio, ma consuma speech condiviso
  più capacità realtime-transcription e realtime-voice invece di importare direttamente i plugin vendor

Lo stato finale previsto è:

- OpenAI vive in un unico plugin anche se copre modelli di testo, speech, immagini e
  video futuri
- un altro vendor può fare lo stesso per la propria area
- i canali non si interessano di quale plugin vendor possieda il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di ownership
- **capability** = contratto core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
“quale provider dovrebbe codificare rigidamente la gestione video?” La prima domanda è “qual è
il contratto di capacità video del core?” Una volta che quel contratto esiste, i plugin vendor
possono registrarsi rispetto ad esso e i plugin canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa corretta di solito è:

1. definire la capacità mancante nel core
2. esporla tramite l'API/runtime del plugin in modo tipizzato
3. collegare canali/funzionalità a questa capacità
4. lasciare che i plugin vendor registrino le implementazioni

Questo mantiene esplicita l'ownership evitando al contempo comportamenti del core che dipendono da
un singolo vendor o da un percorso di codice specifico per un plugin.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove collocare il codice:

- **livello delle capacità del core**: orchestrazione condivisa, policy, fallback, regole di merge
  della configurazione, semantica di delivery e contratti tipizzati
- **livello del plugin vendor**: API vendor-specifiche, auth, cataloghi di modelli, sintesi vocale,
  generazione di immagini, futuri backend video, endpoint di utilizzo
- **livello del plugin canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma capacità del core e le presenta su una superficie

Per esempio, il TTS segue questa forma:

- il core gestisce policy TTS in fase di risposta, ordine di fallback, preferenze e delivery del canale
- `openai`, `elevenlabs` e `microsoft` gestiscono le implementazioni della sintesi
- `voice-call` consuma l'helper runtime TTS per la telefonia

Lo stesso pattern dovrebbe essere preferito per le capacità future.

### Esempio di plugin aziendale multi-capacità

Un plugin aziendale dovrebbe apparire coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, speech, trascrizione realtime, voce realtime, comprensione dei media,
generazione immagini, generazione video, web fetch e web search,
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
      // auth/catalogo modelli/hook runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configurazione speech vendor — implementa direttamente l'interfaccia SpeechProviderPlugin
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
        // logica di credenziali + fetch
      }),
    );
  },
};

export default plugin;
```

Ciò che conta non sono i nomi esatti degli helper. Conta la forma:

- un plugin possiede la superficie del vendor
- il core continua a possedere i contratti di capacità
- i canali e i plugin di funzionalità consumano gli helper `api.runtime.*`, non il codice del vendor
- i test di contratto possono verificare che il plugin abbia registrato le capacità che
  dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già comprensione di immagini/audio/video come un'unica
capacità condivisa. Qui si applica lo stesso modello di ownership:

1. il core definisce il contratto di media-understanding
2. i plugin vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` a seconda dei casi
3. i canali e i plugin di funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice del vendor

Questo evita di incorporare nel core le ipotesi video di un singolo provider. Il plugin possiede
la superficie del vendor; il core possiede il contratto di capacità e il comportamento di fallback.

La generazione video usa già questa stessa sequenza: il core possiede il contratto di
capacità tipizzato e l'helper runtime, e i plugin vendor registrano
implementazioni `api.registerVideoGenerationProvider(...)` rispetto ad esso.

Hai bisogno di una checklist concreta per il rollout? Vedi
[Capability Cookbook](/it/plugins/architecture).

## Contratti e applicazione

La superficie dell'API del plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e
gli helper runtime su cui un plugin può fare affidamento.

Perché questo è importante:

- gli autori di plugin ottengono un unico standard interno stabile
- il core può rifiutare ownership duplicate come due plugin che registrano lo stesso
  provider id
- l'avvio può mostrare diagnostica utile per registrazioni malformate
- i test di contratto possono applicare l'ownership dei plugin inclusi e prevenire derive silenziose

Esistono due livelli di applicazione:

1. **applicazione della registrazione runtime**
   Il registro dei plugin valida le registrazioni durante il caricamento dei plugin. Esempi:
   provider id duplicati, speech provider id duplicati e registrazioni
   malformate producono diagnostica del plugin invece di comportamento indefinito.
2. **test di contratto**
   I plugin inclusi vengono acquisiti nei registri di contratto durante i test in modo che
   OpenClaw possa verificare esplicitamente l'ownership. Oggi questo è usato per model
   provider, speech provider, web search provider e ownership della registrazione inclusa.

L'effetto pratico è che OpenClaw sa, in anticipo, quale plugin possiede quale
superficie. Questo permette a core e canali di comporsi senza attriti perché l'ownership è
dichiarata, tipizzata e testabile anziché implicita.

### Cosa deve appartenere a un contratto

I buoni contratti per plugin sono:

- tipizzati
- piccoli
- specifici per capacità
- posseduti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti per plugin sono:

- policy vendor-specifiche nascoste nel core
- vie di fuga one-off per plugin che aggirano il registro
- codice di canale che accede direttamente a un'implementazione vendor
- oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi
lascia che i plugin si colleghino ad essa.

## Modello di esecuzione

I plugin OpenClaw nativi vengono eseguiti **in-process** con il Gateway. Non sono
sandboxed. Un plugin nativo caricato ha lo stesso confine di trust a livello di processo del
codice del core.

Implicazioni:

- un plugin nativo può registrare strumenti, gestori di rete, hook e servizi
- un bug in un plugin nativo può mandare in crash o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione di codice arbitrario all'interno del processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa per lo più
Skills inclusi.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non inclusi.
Tratta i plugin del workspace come codice per il tempo di sviluppo, non come impostazioni predefinite di produzione.

Per i nomi dei package del workspace inclusi, mantieni l'ID del plugin ancorato nel nome
npm: `@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il package espone intenzionalmente un ruolo di plugin più ristretto.

Nota importante sul trust:

- `plugins.allow` si fida degli **ID dei plugin**, non della provenienza della sorgente.
- Un plugin del workspace con lo stesso id di un plugin incluso oscura intenzionalmente
  la copia inclusa quando quel plugin del workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, patch testing e hotfix.

## Confine di esportazione

OpenClaw esporta capacità, non convenience di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni helper non contrattuali:

- sotto-percorsi helper specifici del plugin incluso
- sotto-percorsi di plumbing runtime non destinati a essere API pubbliche
- helper di convenience specifici del vendor
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sotto-percorsi helper dei plugin inclusi restano ancora nella mappa di esportazione SDK generata
per compatibilità e manutenzione dei plugin inclusi. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diversi punti di integrazione `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come pattern SDK raccomandato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw esegue grossomodo questo:

1. scopre le radici candidate dei plugin
2. legge manifest nativi o di bundle compatibili e metadati dei package
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati tramite jiti
7. chiama gli hook nativi `register(api)` (o `activate(api)` — alias legacy) e raccoglie le registrazioni nel registro dei plugin
8. espone il registro alle superfici dei comandi/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin inclusi usano `register`; preferisci `register` per i nuovi plugin.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione runtime. I candidati vengono bloccati
quando l'entry esce dalla root del plugin, il percorso è scrivibile da tutti, o l'ownership del percorso appare sospetta per i plugin non inclusi.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- scoprire canali/Skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della Control UI
- mostrare metadati di installazione/catalogo

Per i plugin nativi, il modulo runtime è la parte data-plane. Registra
comportamenti effettivi come hook, strumenti, comandi o flussi dei provider.

### Cosa mette in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati della discovery
- dati del registro dei manifest
- registri dei plugin caricati

Queste cache riducono gli avvii impulsivi e l'overhead dei comandi ripetuti. È sicuro
considerarle cache prestazionali di breve durata, non persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre della cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello di registro

I plugin caricati non mutano direttamente variabili globali casuali del core. Si registrano in un
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

Le funzionalità del core leggono poi da questo registro invece di parlare ai moduli plugin
direttamente. Questo mantiene il caricamento unidirezionale:

- modulo plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core ha bisogno di un solo punto di integrazione: “leggere il registro”, non “gestire casi speciali per ogni modulo plugin”.

## Callback di binding della conversazione

I plugin che fanno il bind di una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di bind è stata approvata o negata:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Ora esiste un binding per questo plugin + conversazione.
        console.log(event.binding?.conversationId);
        return;
      }

      // La richiesta è stata negata; cancella qualsiasi stato locale in sospeso.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campi del payload della callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: riepilogo della richiesta originale, suggerimento detach, sender id e
  metadati della conversazione

Questa callback è solo di notifica. Non cambia chi è autorizzato a fare il bind di una
conversazione, ed è eseguita dopo che il core ha terminato la gestione dell'approvazione.

## Hook runtime dei provider

I plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per lookup economico dell'auth del provider via env
  prima del caricamento runtime, `channelEnvVars` per lookup economico di env/setup del canale
  prima del caricamento runtime, più `providerAuthChoices` per etichette economiche delle scelte di onboarding/auth e metadati dei flag CLI prima del caricamento runtime
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw continua a gestire il loop generico dell'agente, il failover, la gestione dei transcript e la
policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
richiedere un intero transport di inferenza personalizzato.

Usa il manifest `providerAuthEnvVars` quando il provider ha credenziali basate su env
che i percorsi generici di auth/status/model-picker dovrebbero vedere senza caricare il runtime del plugin. Usa il manifest `providerAuthChoices` quando le
superfici CLI di onboarding/auth-choice devono conoscere choice id del provider, etichette dei gruppi e wiring auth semplice a un solo flag senza caricare il runtime del provider. Mantieni `envVars` del runtime del provider per suggerimenti orientati all'operatore come etichette di onboarding o variabili di setup OAuth client-id/client-secret.

Usa il manifest `channelEnvVars` quando un canale ha auth o setup guidati da env che il fallback shell-env generico, i controlli config/status o i prompt di setup dovrebbero vedere senza caricare il runtime del canale.

### Ordine e uso degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna “Quando usarlo” è una guida rapida alla decisione.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider possiede un catalogo o valori predefiniti del base URL                                                                         |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali del provider durante la materializzazione della configurazione             | I valori predefiniti dipendono da modalità auth, env o semantica della famiglia di modelli del provider                                   |
| --  | _(ricerca integrata del modello)_ | OpenClaw prova prima il normale percorso registro/catalogo                                                     | _(non è un hook di plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview del model-id prima della ricerca                                             | Il provider possiede la pulizia degli alias prima della risoluzione del modello canonico                                                  |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello         | Il provider possiede la pulizia del transport per provider id personalizzati nella stessa famiglia di transport                           |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                   | Il provider necessita di pulizia della configurazione che dovrebbe vivere con il plugin; gli helper inclusi della famiglia Google fungono anche da supporto per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità per l'uso dello streaming nativo ai provider configurati                 | Il provider necessita di correzioni ai metadati di utilizzo dello streaming nativo guidate dall'endpoint                                  |
| 7   | `resolveConfigApiKey`             | Risolve l'auth con marker env per i provider configurati prima del caricamento dell'auth runtime             | Il provider ha una risoluzione della chiave API con marker env gestita dal provider; `amazon-bedrock` ha anche qui un resolver integrato per marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone auth locale/self-hosted o basata su configurazione senza persistere testo in chiaro                    | Il provider può operare con un marker di credenziale sintetico/locale                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili auth esterni gestiti dal provider; `persistence` predefinito è `runtime-only` per credenziali possedute da CLI/app | Il provider riusa credenziali auth esterne senza persistere token di refresh copiati                                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | Porta i placeholder dei profili sintetici memorizzati sotto l'auth basata su env/config per precedenza       | Il provider memorizza profili placeholder sintetici che non dovrebbero avere la precedenza                                                 |
| 11  | `resolveDynamicModel`             | Fallback sincrono per model id gestiti dal provider non ancora presenti nel registro locale                   | Il provider accetta model id arbitrari upstream                                                                                            |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider necessita di metadati di rete prima di risolvere id sconosciuti                                                               |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che l'embedded runner usi il modello risolto                                          | Il provider necessita di riscritture del transport ma usa comunque un transport del core                                                  |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro transport compatibile                   | Il provider riconosce i propri modelli su transport proxy senza assumere il controllo del provider                                        |
| 15  | `capabilities`                    | Metadati transcript/tooling gestiti dal provider usati dalla logica condivisa del core                        | Il provider necessita di particolarità transcript/famiglia provider                                                                        |
| 16  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che l'embedded runner li veda                                      | Il provider necessita di pulizia degli schemi della famiglia di transport                                                                  |
| 17  | `inspectToolSchemas`              | Espone diagnostica degli schemi gestita dal provider dopo la normalizzazione                                   | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                             |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del reasoning nativo vs tagged                                                | Il provider necessita di output reasoning tagged/finale invece di campi nativi                                                            |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di stream              | Il provider necessita di parametri di richiesta predefiniti o pulizia per-provider                                                        |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un transport personalizzato                        | Il provider necessita di un protocollo wire personalizzato, non solo di un wrapper                                                        |
| 21  | `wrapStreamFn`                    | Wrapper di stream dopo l'applicazione dei wrapper generici                                                     | Il provider necessita di wrapper di compatibilità per header/body/modello senza un transport personalizzato                               |
| 22  | `resolveTransportTurnState`       | Collega header o metadati nativi del transport per turno                                                       | Il provider vuole che i transport generici inviino identità di turno native del provider                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | Collega header WebSocket nativi o policy di cooldown della sessione                                            | Il provider vuole che i transport WS generici regolino header di sessione o policy di fallback                                            |
| 24  | `formatApiKey`                    | Formatter del profilo auth: il profilo memorizzato diventa la stringa runtime `apiKey`                        | Il provider memorizza metadati auth extra e necessita di una forma personalizzata del token runtime                                       |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di errore di refresh               | Il provider non rientra nei refresher condivisi `pi-ai`                                                                                    |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                           | Il provider necessita di indicazioni di riparazione auth di sua proprietà dopo il fallimento del refresh                                  |
| 27  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto gestito dal provider                                             | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                       |
| 28  | `classifyFailoverReason`          | Classificazione del motivo di failover gestita dal provider                                                    | Il provider può mappare errori raw API/transport a rate-limit/overload/ecc.                                                               |
| 29  | `isCacheTtlEligible`              | Policy prompt-cache per provider proxy/backhaul                                                                | Il provider necessita di gating cache TTL specifico del proxy                                                                              |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero auth mancante                                                  | Il provider necessita di un suggerimento di recupero auth mancante specifico del provider                                                  |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più suggerimento facoltativo di errore per l'utente                | Il provider deve nascondere righe upstream obsolete o sostituirle con un suggerimento del vendor                                          |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo la discovery                                                 | Il provider necessita di righe sintetiche forward-compat in `models list` e nei picker                                                    |
| 33  | `isBinaryThinking`                | Toggle reasoning on/off per provider con thinking binario                                                      | Il provider espone solo thinking binario on/off                                                                                            |
| 34  | `supportsXHighThinking`           | Supporto al reasoning `xhigh` per modelli selezionati                                                          | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                               |
| 35  | `resolveDefaultThinkingLevel`     | Livello predefinito di `/think` per una specifica famiglia di modelli                                          | Il provider possiede la policy predefinita di `/think` per una famiglia di modelli                                                        |
| 36  | `isModernModelRef`                | Matcher dei modelli moderni per filtri dei profili live e selezione smoke                                      | Il provider possiede il matching dei modelli preferiti live/smoke                                                                          |
| 37  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il vero token/chiave runtime appena prima dell'inferenza             | Il provider necessita di uno scambio token o di una credenziale di richiesta a breve durata                                               |
| 38  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e superfici di stato correlate                   | Il provider necessita di parsing personalizzato del token di utilizzo/quota o di una diversa credenziale per l'utilizzo                  |
| 39  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo che l'auth è stata risolta      | Il provider necessita di un endpoint di utilizzo o parser payload specifico del provider                                                   |
| 40  | `createEmbeddingProvider`         | Costruisce un adapter di embedding gestito dal provider per memoria/ricerca                                    | Il comportamento di embedding della memoria appartiene al plugin provider                                                                  |
| 41  | `buildReplayPolicy`               | Restituisce una replay policy che controlla la gestione dei transcript per il provider                         | Il provider necessita di una policy transcript personalizzata (per esempio la rimozione dei blocchi di thinking)                          |
| 42  | `sanitizeReplayHistory`           | Riscrive la cronologia del replay dopo la pulizia generica del transcript                                       | Il provider necessita di riscritture replay specifiche oltre agli helper condivisi di compattazione                                       |
| 43  | `validateReplayTurns`             | Validazione finale o rimodellamento dei turni di replay prima dell'embedded runner                             | Il transport del provider necessita di una validazione più rigorosa dei turni dopo la sanitizzazione generica                             |
| 44  | `onModelSelected`                 | Esegue effetti collaterali post-selezione gestiti dal provider                                                 | Il provider necessita di telemetria o stato di sua proprietà quando un modello diventa attivo                                             |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi ricadono su altri plugin provider capaci di usare hook
fino a quando uno modifica davvero model id o transport/config. Questo mantiene
funzionanti gli shim alias/compat dei provider senza richiedere al chiamante di sapere quale
plugin incluso possiede la riscrittura. Se nessun hook provider riscrive una voce
di configurazione supportata della famiglia Google, continua ad applicarsi il normalizzatore di configurazione Google incluso.

Se il provider necessita di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook servono per il comportamento del provider
che continua a funzionare nel normale loop di inferenza di OpenClaw.

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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  e `wrapStreamFn` perché possiede la forward-compat di Claude 4.6,
  i suggerimenti sulla famiglia provider, le indicazioni di riparazione auth, l'integrazione
  dell'endpoint di utilizzo, l'idoneità della prompt-cache, i valori predefiniti della configurazione sensibili all'auth, la policy Claude di thinking predefinita/adattiva e la modellazione dello stream specifica di Anthropic per
  header beta, `/fast` / `serviceTier` e `context1m`.
- Gli helper di stream specifici di Claude in Anthropic restano per ora nel
  proprio seam pubblico `api.ts` / `contract-api.ts` del plugin incluso. Questa
  superficie del package esporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder wrapper Anthropic di livello inferiore invece di ampliare l'SDK generico attorno alle regole sugli header beta di un unico
  provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities` più `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  perché possiede la forward-compat di GPT-5.4, la normalizzazione diretta
  `openai-completions` -> `openai-responses`, i
  suggerimenti auth compatibili con Codex, la soppressione di Spark, righe sintetiche della lista OpenAI e la policy di GPT-5 thinking /
  live-model; la famiglia di stream `openai-responses-defaults` possiede i
  wrapper condivisi nativi di OpenAI Responses per header di attribuzione,
  `/fast`/`serviceTier`, verbosità del testo, web search nativa di Codex,
  modellazione del payload compatibile con il reasoning e gestione del contesto Responses.
- OpenRouter usa `catalog` più `resolveDynamicModel` e
  `prepareDynamicModel` perché il provider è pass-through e può esporre nuovi
  model id prima che il catalogo statico di OpenClaw si aggiorni; usa anche
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` per mantenere
  header delle richieste, metadati di routing, patch del reasoning e policy della
  prompt-cache specifici del provider fuori dal core. La sua replay policy proviene dalla
  famiglia `passthrough-gemini`, mentre la famiglia di stream `openrouter-thinking`
  gestisce l'iniezione del reasoning del proxy e gli skip per modelli non supportati / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` più `prepareRuntimeAuth` e `fetchUsageSnapshot` perché ha
  bisogno di device login gestito dal provider, comportamento di fallback dei modelli, particolarità del transcript Claude,
  uno scambio GitHub token -> Copilot token e un endpoint di utilizzo
  gestito dal provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` più
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` perché
  continua a funzionare sui transport OpenAI del core ma possiede la propria normalizzazione di transport/base URL, la policy di fallback del refresh OAuth, la scelta del transport predefinito,
  righe sintetiche del catalogo Codex e l'integrazione dell'endpoint di utilizzo ChatGPT; condivide la stessa famiglia di stream `openai-responses-defaults` di OpenAI diretto.
- Google AI Studio e Gemini CLI OAuth usano `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` perché la
  famiglia di replay `google-gemini` possiede la forward-compat di Gemini 3.1,
  la validazione replay Gemini nativa, la sanitizzazione bootstrap replay, la modalità di output
  tagged del reasoning e il matching dei modelli moderni, mentre la
  famiglia di stream `google-thinking` possiede la normalizzazione del payload di thinking di Gemini;
  Gemini CLI OAuth usa anche `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` per formattazione del token, parsing del token e wiring dell'endpoint quota.
- Anthropic Vertex usa `buildReplayPolicy` tramite la
  famiglia di replay `anthropic-by-model` in modo che la pulizia del replay specifica di Claude resti
  limitata agli id Claude invece che a tutto il transport `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` perché possiede
  la classificazione degli errori specifici di Bedrock di throttle/non-ready/context-overflow
  per il traffico Anthropic-on-Bedrock; la sua replay policy condivide comunque la stessa guardia
  solo-Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode e Opencode Go usano `buildReplayPolicy`
  tramite la famiglia di replay `passthrough-gemini` perché fanno proxy dei modelli Gemini
  attraverso transport compatibili con OpenAI e necessitano della sanitizzazione
  della thought-signature Gemini senza validazione replay Gemini nativa o
  riscritture bootstrap.
- MiniMax usa `buildReplayPolicy` tramite la
  famiglia di replay `hybrid-anthropic-openai` perché un provider possiede sia
  semantica di messaggi Anthropic sia compatibile con OpenAI; mantiene la rimozione dei blocchi di thinking
  solo-Claude sul lato Anthropic mentre riporta la modalità di output del reasoning a nativa, e la famiglia di stream `minimax-fast-mode` possiede le riscritture dei modelli in fast-mode sul percorso di stream condiviso.
- Moonshot usa `catalog` più `wrapStreamFn` perché continua a usare il transport
  condiviso OpenAI ma necessita di normalizzazione del payload di thinking gestita dal provider; la
  famiglia di stream `moonshot-thinking` mappa configurazione più stato `/think` sul proprio payload nativo di thinking binario.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` perché necessita di header di richiesta gestiti dal provider,
  normalizzazione del payload di reasoning, suggerimenti del transcript Gemini e gating
  cache-TTL Anthropic; la famiglia di stream `kilocode-thinking` mantiene l'iniezione del thinking di Kilo
  sul percorso di stream proxy condiviso saltando `kilo/auto` e altri model id proxy che non supportano payload di reasoning espliciti.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` perché possiede il fallback GLM-5,
  i valori predefiniti `tool_stream`, UX del thinking binario, matching dei modelli moderni e sia
  auth di utilizzo che fetch della quota; la famiglia di stream `tool-stream-default-on` mantiene
  il wrapper `tool_stream` attivo di default fuori dal glue scritto a mano per provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  perché possiede la normalizzazione del transport xAI Responses nativo, le riscritture
  degli alias fast-mode di Grok, il `tool_stream` predefinito, la pulizia rigorosa di schema strumenti / payload di reasoning, il riuso dell'auth di fallback per strumenti posseduti dal plugin, la risoluzione forward-compat dei modelli Grok e patch di compatibilità possedute dal provider come il profilo schema strumenti xAI,
  keyword di schema non supportate, `web_search` nativo e decodifica HTML-entity
  degli argomenti delle tool-call.
- Mistral, OpenCode Zen e OpenCode Go usano solo `capabilities` per mantenere
  particolarità transcript/tooling fuori dal core.
- I provider inclusi solo catalogo come `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine` usano
  solo `catalog`.
- Qwen usa `catalog` per il proprio provider di testo più registrazioni condivise di
  media-understanding e video-generation per le sue superfici multimodali.
- MiniMax e Xiaomi usano `catalog` più hook di utilizzo perché il comportamento
  `/usage` è posseduto dal plugin anche se l'inferenza continua a passare per i transport condivisi.

## Helper runtime

I plugin possono accedere a helper selezionati del core tramite `api.runtime`. Per TTS:

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

- `textToSpeech` restituisce il normale payload di output TTS del core per superfici file/voice-note.
- Usa la configurazione del core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per picker vocali o flussi di setup posseduti dal vendor.
- Gli elenchi di voci possono includere metadati più ricchi come locale, genere e tag di personalità per picker consapevoli del provider.
- OpenAI ed ElevenLabs supportano oggi la telefonia. Microsoft no.

I plugin possono anche registrare speech provider tramite `api.registerSpeechProvider(...)`.

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

- Mantieni policy TTS, fallback e delivery della risposta nel core.
- Usa speech provider per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato nell'id provider `microsoft`.
- Il modello di ownership preferito è orientato all'azienda: un solo plugin vendor può possedere
  provider di testo, speech, immagini e media futuri man mano che OpenClaw aggiunge quei
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un unico
provider tipizzato di media-understanding invece di un generico contenitore chiave/valore:

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
- L'espansione additiva dovrebbe restare tipizzata: nuovi metodi facoltativi, nuovi
  campi facoltativi del risultato, nuove capacità facoltative.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capacità e l'helper runtime
  - i plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin feature/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di media-understanding, i plugin possono chiamare:

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
o l'alias STT più vecchio:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facoltativo quando il MIME non può essere dedotto in modo affidabile:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per
  la comprensione di immagini/audio/video.
- Usa la configurazione audio del core per media-understanding (`tools.media.audio`) e l'ordine di fallback del provider.
- Restituisce `{ text: undefined }` quando non viene prodotta alcuna trascrizione (per esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità.

I plugin possono anche avviare esecuzioni di subagent in background tramite `api.runtime.subagent`:

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

- `provider` e `model` sono override facoltativi per esecuzione, non cambi di sessione persistenti.
- OpenClaw rispetta questi campi di override solo per chiamanti trusted.
- Per esecuzioni di fallback possedute dal plugin, gli operatori devono attivare esplicitamente `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin trusted a specifici target canonici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent da plugin non trusted continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente in fallback.

Per la web search, i plugin possono consumare l'helper runtime condiviso invece di
accedere al wiring dello strumento dell'agente:

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

I plugin possono anche registrare web-search provider tramite
`api.registerWebSearchProvider(...)`.

Note:

- Mantieni nel core la selezione del provider, la risoluzione delle credenziali e la semantica condivisa della richiesta.
- Usa web-search provider per i transport di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i plugin feature/canale che necessitano di comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

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

- `generate(...)`: genera un'immagine usando la catena configurata dei provider di generazione immagini.
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
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale auth del gateway, oppure `"plugin"` per auth/verification webhook gestite dal plugin.
- `match`: facoltativo. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: facoltativo. Permette allo stesso plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare `auth` esplicitamente.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo sullo stesso livello auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente scope runtime dell'operatore. Servono per webhook/verification della firma gestiti dal plugin, non per chiamate helper privilegiate del Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope runtime di richiesta Gateway, ma questo scope è intenzionalmente conservativo:
  - l'auth bearer con secret condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route plugin bloccati su `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP trusted che portano identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in queste richieste plugin-route con identità, lo scope runtime ricade su `operator.write`
- Regola pratica: non dare per scontato che una route plugin autenticata dal gateway sia implicitamente una superficie admin. Se la tua route richiede comportamento solo-admin, richiedi una modalità auth che porti identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import del Plugin SDK

Usa i sotto-percorsi dell'SDK invece dell'import monolitico `openclaw/plugin-sdk` quando
scrivi plugin:

- `openclaw/plugin-sdk/plugin-entry` per le primitive di registrazione dei plugin.
- `openclaw/plugin-sdk/core` per il contratto generico condiviso rivolto ai plugin.
- `openclaw/plugin-sdk/config-schema` per l'esportazione dello schema Zod della root `openclaw.json`
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
  `channel-inbound` è la home condivisa per debounce, mention matching,
  helper della policy di mention in ingresso, formattazione degli envelope e helper di
  contesto degli envelope in ingresso.
  `channel-setup` è il seam ristretto di setup per installazione facoltativa.
  `setup-runtime` è la superficie runtime-safe di setup usata da `setupEntry` /
  avvio differito, inclusi gli adapter di patch setup import-safe.
  `setup-adapter-runtime` è il seam degli adapter di setup account consapevole dell'env.
  `setup-tools` è il piccolo seam helper per CLI/archivio/documentazione (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Sotto-percorsi di dominio come `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
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
  `openclaw/plugin-sdk/directory-runtime` per helper condivisi runtime/config.
  `telegram-command-config` è il seam pubblico ristretto per normalizzazione/validazione dei
  comandi personalizzati Telegram e resta disponibile anche se la superficie del contratto Telegram incluso è temporaneamente indisponibile.
  `text-runtime` è il seam condiviso per testo/markdown/logging, inclusi
  stripping del testo visibile all'assistente, helper di rendering/chunking markdown, helper di redazione,
  helper di directive-tag e utility di testo sicuro.
- I seam di canale specifici per l'approvazione dovrebbero preferire un unico contratto
  `approvalCapability` sul plugin. Il core legge quindi auth di approvazione, delivery, render e comportamento di routing nativo attraverso questa unica capacità invece di mescolare il comportamento di approvazione in campi del plugin non correlati.
- `openclaw/plugin-sdk/channel-runtime` è deprecato e resta solo come shim di
  compatibilità per plugin più vecchi. Il nuovo codice dovrebbe importare invece le primitive
  generiche più ristrette, e il codice del repository non dovrebbe aggiungere nuovi import dello
  shim.
- I componenti interni delle estensioni incluse restano privati. I plugin esterni dovrebbero usare solo
  sotto-percorsi `openclaw/plugin-sdk/*`. Il codice core/test di OpenClaw può usare gli entry point pubblici del repo sotto la root di un package plugin come `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e file a scope ristretto come
  `login-qr-api.js`. Non importare mai `src/*` di un package plugin dal core o da un'altra estensione.
- Suddivisione degli entry point del repo:
  `<plugin-package-root>/api.js` è il barrel di helper/tipi,
  `<plugin-package-root>/runtime-api.js` è il barrel solo runtime,
  `<plugin-package-root>/index.js` è l'entry del plugin incluso,
  e `<plugin-package-root>/setup-entry.js` è l'entry del plugin di setup.
- Esempi attuali di provider inclusi:
  - Anthropic usa `api.js` / `contract-api.js` per helper di stream Claude come
    `wrapAnthropicProviderStream`, helper degli header beta e parsing di `service_tier`.
  - OpenAI usa `api.js` per builder del provider, helper del modello predefinito e builder del provider realtime.
  - OpenRouter usa `api.js` per il proprio builder del provider più helper di onboarding/config,
    mentre `register.runtime.js` può ancora riesportare helper generici
    `plugin-sdk/provider-stream` per uso locale nel repo.
- Gli entry point pubblici caricati tramite facade preferiscono lo snapshot di configurazione runtime attivo
  quando esiste, poi ricadono sul file di configurazione risolto su disco quando
  OpenClaw non sta ancora servendo uno snapshot runtime.
- Le primitive generiche condivise restano il contratto SDK pubblico preferito. Esiste ancora un piccolo insieme di compatibilità riservato di seam helper branded per canali inclusi. Trattali come seam per manutenzione/compatibilità dei bundle, non come nuovi target di import di terze parti; i nuovi contratti cross-channel dovrebbero comunque arrivare su sotto-percorsi generici `plugin-sdk/*` o sui barrel locali del plugin `api.js` /
  `runtime-api.js`.

Nota di compatibilità:

- Evita il barrel root `openclaw/plugin-sdk` per il nuovo codice.
- Preferisci prima le primitive stabili e ristrette. I sotto-percorsi più nuovi per setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sono il contratto previsto per il nuovo lavoro su plugin inclusi ed esterni.
  Il parsing/matching dei target appartiene a `openclaw/plugin-sdk/channel-targets`.
  I gate delle azioni sui messaggi e gli helper degli id messaggio per le reaction appartengono a
  `openclaw/plugin-sdk/channel-actions`.
- I barrel helper specifici delle estensioni incluse non sono stabili per impostazione predefinita. Se un
  helper serve solo a un'estensione inclusa, mantienilo dietro il seam locale dell'estensione `api.js` o `runtime-api.js` invece di promuoverlo in
  `openclaw/plugin-sdk/<extension>`.
- I nuovi seam helper condivisi dovrebbero essere generici, non branded per canale. Il parsing condiviso dei target appartiene a `openclaw/plugin-sdk/channel-targets`; i componenti interni specifici del canale restano dietro il seam locale `api.js` o `runtime-api.js` del plugin proprietario.
- I sotto-percorsi specifici di capacità come `image-generation`,
  `media-understanding` e `speech` esistono perché i plugin inclusi/nativi li usano
  oggi. La loro presenza non significa di per sé che ogni helper esportato sia un
  contratto esterno a lungo termine congelato.

## Schemi dello strumento messaggio

I plugin dovrebbero possedere i contributi di schema specifici del canale per `describeMessageTool(...)`.
Mantieni i campi specifici del provider nel plugin, non nel core condiviso.

Per frammenti di schema condivisi e portabili, riusa gli helper generici esportati tramite
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` per payload in stile griglia di pulsanti
- `createMessageToolCardSchema()` per payload strutturati di card

Se una forma di schema ha senso solo per un provider, definiscila nel codice sorgente di quel plugin invece di promuoverla nell'SDK condiviso.

## Risoluzione dei target di canale

I plugin di canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni
generico l'host outbound condiviso e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  deve essere trattato come `direct`, `group` o `channel` prima della lookup nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione come id invece di eseguire una ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core necessita di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un miss della directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione specifica del provider una volta risolto un target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima della
  ricerca di peer/group.
- Usa `looksLikeId` per i controlli “tratta questo come un id target esplicito/nativo”.
- Usa `resolveTarget` per il fallback di normalizzazione specifico del provider, non per una ricerca ampia nella directory.
- Mantieni gli id nativi del provider come chat id, thread id, JID, handle e room
  id dentro valori `target` o parametri specifici del provider, non in campi SDK generici.

## Directory basate sulla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere questa logica nel
plugin e riutilizzare gli helper condivisi di
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale ha bisogno di peer/group basati sulla configurazione come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici di directory con scope per account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro per query
- applicazione del limite
- helper di deduplica/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione specifica del canale e la normalizzazione degli id dovrebbero restare nell'implementazione del plugin.

## Cataloghi dei provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede model id specifici del provider, valori predefiniti del base URL o metadati dei modelli dipendenti dall'auth.

`catalog.order` controlla quando il catalogo di un plugin si unisce rispetto ai provider impliciti integrati di OpenClaw:

- `simple`: provider semplici basati su chiave API o env
- `profile`: provider che compaiono quando esistono profili auth
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo altri provider impliciti

I provider successivi vincono in caso di collisione delle chiavi, quindi i plugin possono intenzionalmente sovrascrivere una voce provider integrata con lo stesso provider id.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione di canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può assumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano i secret necessari.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/config
  di riparazione non dovrebbero aver bisogno di materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato per `inspectAccount(...)`:

- Restituisci solo lo stato descrittivo dell'account.
- Mantieni `enabled` e `configured`.
- Includi campi di origine/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire i valori raw dei token solo per riportare
  la disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il corrispondente campo source) è sufficiente per i comandi di tipo status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo permette ai comandi in sola lettura di riportare “configurato ma non disponibile in questo percorso di comando” invece di andare in crash o riportare erroneamente l'account come non configurato.

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

Ogni entry diventa un plugin. Se il pack elenca più estensioni, l'id del plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory in modo che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni entry `openclaw.extensions` deve restare dentro la directory del plugin
dopo la risoluzione dei symlink. Le entry che escono dalla directory del package vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (nessun lifecycle script, nessuna dev dependency a runtime). Mantieni gli alberi di dipendenze del plugin “pure JS/TS” ed evita package che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma non ancora configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo rende avvio e setup più leggeri
quando l'entry principale del plugin collega anche strumenti, hook o altro codice solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può attivare per un plugin di canale lo stesso percorso `setupEntry` durante la fase di avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, significa che l'entry di setup
deve registrare ogni capacità posseduta dal canale da cui dipende l'avvio, come:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- eventuali metodi, strumenti o servizi del gateway che devono esistere durante quella stessa finestra

Se la tua entry completa possiede ancora qualche capacità di avvio richiesta, non abilitare
questo flag. Mantieni il comportamento predefinito e lascia che OpenClaw carichi l'entry
completa durante l'avvio.

I canali inclusi possono anche pubblicare helper di superficie contrattuale solo setup che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale superficie di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale a account singolo
in `channels.<id>.accounts.*` senza caricare l'entry completa del plugin.
Matrix è l'esempio incluso attuale: sposta solo le chiavi di auth/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare
una chiave default-account non canonica configurata invece di creare sempre
`accounts.default`.

Questi adapter di patch setup mantengono lazy la discovery della superficie contrattuale inclusa. Il tempo di import resta leggero; la superficie di promozione viene caricata solo al primo uso invece di rientrare nell'avvio del canale incluso durante l'import del modulo.

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

I plugin di canale possono pubblicizzare metadati di setup/discovery tramite `openclaw.channel` e
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo del core libero da dati.

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

- `detailLabel`: etichetta secondaria per superfici più ricche di catalogo/status
- `docsLabel`: sovrascrive il testo del link alla documentazione
- `preferOver`: id plugin/canale a priorità più bassa che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: indica che il canale supporta markdown per le decisioni di formattazione outbound
- `exposure.configured`: nasconde il canale dalle superfici che elencano canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai picker interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: indica il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: abilita per il canale il flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce lookup di sessione durante la risoluzione dei target di announce

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio un export di registro MPM).
Rilascia un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file deve
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

## Plugin di context engine

I plugin di context engine possiedono l'orchestrazione del contesto di sessione per ingest, assembly
e compaction. Registrali dal tuo plugin con
`api.registerContextEngine(id, factory)`, poi seleziona l'engine attivo con
`plugins.slots.contextEngine`.

Usalo quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita invece di limitarsi ad aggiungere memory search o hook.

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

Se il tuo engine **non** possiede l'algoritmo di compaction, mantieni `compact()`
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

## Aggiungere una nuova capacità

Quando un plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema dei plugin con un accesso privato. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definire il contratto del core
   Decidi quale comportamento condiviso dovrebbe possedere il core: policy, fallback, merge della configurazione,
   ciclo di vita, semantica rivolta ai canali e forma dell'helper runtime.
2. aggiungere superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la superficie tipizzata di capacità più piccola utile.
3. collegare i consumer core + canale/funzionalità
   I canali e i plugin di funzionalità dovrebbero consumare la nuova capacità attraverso il core,
   non importando direttamente un'implementazione vendor.
4. registrare implementazioni vendor
   I plugin vendor registrano quindi i loro backend rispetto alla capacità.
5. aggiungere copertura contrattuale
   Aggiungi test in modo che ownership e forma di registrazione restino esplicite nel tempo.

Così OpenClaw resta opinionated senza diventare hardcoded sulla visione del mondo di un singolo
provider. Vedi il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist della capacità

Quando aggiungi una nuova capacità, l'implementazione dovrebbe di solito toccare insieme queste
superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- runner/helper runtime del core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API plugin in `src/plugins/types.ts`
- wiring del registro dei plugin in `src/plugins/registry.ts`
- esposizione runtime del plugin in `src/plugins/runtime/*` quando i plugin feature/canale
  devono consumarla
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- asserzioni di ownership/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, di solito è un segno che la capacità non è
ancora completamente integrata.

### Template di capacità

Pattern minimo:

```ts
// contratto core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime condiviso per plugin feature/canale
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

- il core possiede il contratto di capacità + l'orchestrazione
- i plugin vendor possiedono le implementazioni vendor
- i plugin feature/canale consumano helper runtime
- i test di contratto mantengono esplicita l'ownership
