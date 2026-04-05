---
read_when:
    - Sviluppare o eseguire il debug di plugin nativi OpenClaw
    - Comprendere il modello di capacità dei plugin o i confini di ownership
    - Lavorare sulla pipeline di caricamento dei plugin o sul registry
    - Implementare runtime hook del provider o plugin di canale
sidebarTitle: Internals
summary: 'Interni dei plugin: modello di capacità, ownership, contratti, pipeline di caricamento e helper runtime'
title: Interni dei plugin
x-i18n:
    generated_at: "2026-04-05T14:02:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bc9d7261c3c7878d37140be77f210dd262d6c3edee2491ea534aa599e2800c0
    source_path: plugins/architecture.md
    workflow: 15
---

# Interni dei plugin

<Info>
  Questo è il **riferimento architetturale approfondito**. Per guide pratiche, vedi:
  - [Installare e usare i plugin](/tools/plugin) — guida utente
  - [Per iniziare](/plugins/building-plugins) — primo tutorial sui plugin
  - [Plugin di canale](/plugins/sdk-channel-plugins) — creare un canale di messaggistica
  - [Plugin provider](/plugins/sdk-provider-plugins) — creare un provider di modelli
  - [Panoramica SDK](/plugins/sdk-overview) — mappa degli import e API di registrazione
</Info>

Questa pagina copre l'architettura interna del sistema di plugin di OpenClaw.

## Modello di capacità pubblico

Le capacità sono il modello pubblico dei **plugin nativi** all'interno di OpenClaw. Ogni
plugin nativo OpenClaw si registra rispetto a uno o più tipi di capacità:

| Capacità              | Metodo di registrazione                         | Plugin di esempio                    |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferenza testuale    | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend CLI di inferenza | `api.registerCliBackend(...)`                | `openai`, `anthropic`                |
| Voce                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Trascrizione realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Voce realtime         | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Generazione immagini  | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione video     | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Web fetch             | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Ricerca web           | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canale / messaggistica | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |

Un plugin che registra zero capacità ma fornisce hook, strumenti o
servizi è un plugin **legacy solo-hook**. Questo pattern è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello di capacità è integrato nel core e usato oggi dai plugin
bundled/nativi, ma la compatibilità dei plugin esterni richiede ancora un livello più rigoroso di “è
esportato, quindi è congelato”.

Indicazioni attuali:

- **plugin esterni esistenti:** mantieni funzionanti le integrazioni basate su hook; trattale
  come baseline di compatibilità
- **nuovi plugin bundled/nativi:** preferisci la registrazione esplicita delle capacità rispetto a
  reach-in specifici del vendor o a nuovi design solo-hook
- **plugin esterni che adottano la registrazione delle capacità:** consentiti, ma tratta le superfici helper specifiche della capacità come in evoluzione, a meno che la documentazione non indichi esplicitamente che un contratto è stabile

Regola pratica:

- le API di registrazione delle capacità sono la direzione prevista
- gli hook legacy restano il percorso più sicuro e senza rotture per i plugin esterni durante
  la transizione
- i sottopercorsi helper esportati non sono tutti equivalenti; preferisci il contratto
  ristretto e documentato, non esportazioni helper incidentali

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma in base al suo effettivo
comportamento di registrazione (non solo ai metadati statici):

- **plain-capability** -- registra esattamente un tipo di capacità (ad esempio un
  plugin solo-provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capacità (ad esempio
  `openai` possiede inferenza testuale, voce, comprensione dei media e
  generazione immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), nessuna capacità,
  strumento, comando o servizio
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capacità

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e la sua suddivisione
per capacità. Vedi [Riferimento CLI](/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per
i plugin solo-hook. I plugin legacy del mondo reale dipendono ancora da esso.

Direzione:

- mantienilo funzionante
- documentalo come legacy
- preferisci `before_model_resolve` per lavoro di override di modello/provider
- preferisci `before_prompt_build` per lavoro di mutazione del prompt
- rimuovilo solo dopo che l'uso reale sarà diminuito e la copertura delle fixture dimostrerà la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                   |
| ------------------------- | ------------------------------------------------------------- |
| **config valid**          | La configurazione viene analizzata correttamente e i plugin vengono risolti |
| **compatibility advisory** | Il plugin usa un pattern supportato ma più vecchio (es. `hook-only`) |
| **legacy warning**        | Il plugin usa `before_agent_start`, che è deprecato           |
| **hard error**            | La configurazione non è valida o il plugin non è stato caricato |

Né `hook-only` né `before_agent_start` romperanno oggi il tuo plugin --
`hook-only` è solo informativo, e `before_agent_start` genera solo un avviso. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

1. **Manifest + discovery**
   OpenClaw trova i plugin candidati dai percorsi configurati, dalle radici del workspace,
   dalle radici globali delle extension e dalle extension bundled. Il discovery legge prima i
   manifest nativi `openclaw.plugin.json` più i manifest dei bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un plugin scoperto è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memory.
3. **Caricamento runtime**
   I plugin nativi OpenClaw vengono caricati in-process tramite jiti e registrano
   capacità in un registry centrale. I bundle compatibili vengono normalizzati in
   record di registry senza importare codice runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registry per esporre strumenti, canali, configurazione
   del provider, hook, route HTTP, comandi CLI e servizi.

Per la CLI dei plugin in particolare, il discovery del comando root è diviso in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può restare lazy e registrarsi al primo invio

Questo permette di mantenere il codice CLI posseduto dal plugin all'interno del plugin, consentendo comunque a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine progettuale importante:

- discovery + validazione della configurazione devono funzionare a partire dai **metadati di manifest/schema**
  senza eseguire codice del plugin
- il comportamento runtime nativo proviene dal percorso `register(api)` del modulo del plugin

Questa separazione permette a OpenClaw di validare la configurazione, spiegare plugin mancanti/disabilitati e
costruire suggerimenti UI/schema prima che il runtime completo sia attivo.

### Plugin di canale e lo strumento `message` condiviso

I plugin di canale non devono registrare uno strumento separato send/edit/react per le normali
azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e i
plugin di canale possiedono il discovery e l'esecuzione specifici del canale dietro di esso.

Il confine attuale è:

- il core possiede l'host dello strumento `message` condiviso, il wiring del prompt, la
  contabilità di sessione/thread e il dispatch dell'esecuzione
- i plugin di canale possiedono il discovery delle azioni in scope, il discovery delle capacità e
  ogni frammento di schema specifico del canale
- i plugin di canale possiedono la grammatica specifica del provider per le conversazioni di sessione, ad esempio
  come gli ID delle conversazioni codificano gli ID dei thread o ereditano dalle conversazioni padre
- i plugin di canale eseguono l'azione finale tramite il loro adattatore di azione

Per i plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di discovery unificata permette a un plugin di restituire le sue azioni visibili, capacità e contributi allo schema
insieme, così questi elementi non divergono.

Il core passa lo scope runtime a quel passaggio di discovery. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` trusted in entrata

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre
azioni di messaggio in base all'account attivo, alla stanza/thread/messaggio corrente o
all'identità trusted del richiedente senza codificare rami specifici del canale nello strumento
`message` del core.

Questo è il motivo per cui le modifiche di instradamento dell'embedded-runner restano lavoro del plugin: il runner è
responsabile di inoltrare l'identità attuale di chat/sessione al confine di discovery del plugin affinché lo strumento `message` condiviso esponga la giusta
superficie posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i plugin bundled dovrebbero mantenere il runtime di esecuzione
all'interno dei propri moduli extension. Il core non possiede più i runtime delle azioni di messaggio Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i plugin bundled
dovrebbero importare direttamente il proprio codice runtime locale dai loro
moduli extension posseduti.

Lo stesso confine si applica in generale ai seam SDK con nome del provider: il core non
dovrebbe importare barrel di convenienza specifici del canale per Slack, Discord, Signal,
WhatsApp o extension simili. Se il core ha bisogno di un comportamento, deve o consumare il
barrel `api.ts` / `runtime-api.ts` del plugin bundled stesso oppure promuovere la necessità
in una capacità generica ristretta nell'SDK condiviso.

Per i poll in particolare, esistono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che si adattano al modello
  comune di poll
- `actions.handleAction("poll")` è il percorso preferito per semantiche di poll specifiche del canale o parametri poll aggiuntivi

Il core ora rinvia il parsing condiviso dei poll fino a dopo che il dispatch del poll del plugin ha rifiutato
l'azione, così gli handler di poll posseduti dal plugin possono accettare campi di poll specifici del canale senza essere bloccati prima dal parser generico dei poll.

Vedi [Pipeline di caricamento](#load-pipeline) per la sequenza completa di avvio.

## Modello di ownership delle capacità

OpenClaw tratta un plugin nativo come confine di ownership per una **azienda** o una
**funzionalità**, non come un insieme casuale di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe di solito possedere tutte le superfici OpenClaw-facing
  di quell'azienda
- un plugin di funzionalità dovrebbe di solito possedere l'intera superficie della
  funzionalità che introduce
- i canali dovrebbero consumare capacità condivise del core invece di reimplementare
  in modo ad hoc il comportamento del provider

Esempi:

- il plugin bundled `openai` possiede il comportamento del model-provider OpenAI e il
  comportamento OpenAI di speech + realtime-voice + media-understanding + image-generation
- il plugin bundled `elevenlabs` possiede il comportamento di speech ElevenLabs
- il plugin bundled `microsoft` possiede il comportamento di speech Microsoft
- il plugin bundled `google` possiede il comportamento del model-provider Google più
  il comportamento Google di media-understanding + image-generation + web-search
- il plugin bundled `firecrawl` possiede il comportamento di web-fetch Firecrawl
- i plugin bundled `minimax`, `mistral`, `moonshot` e `zai` possiedono i loro
  backend di media-understanding
- il plugin `voice-call` è un plugin di funzionalità: possiede trasporto delle chiamate, strumenti,
  CLI, route e bridging del flusso media Twilio, ma consuma capacità condivise di speech
  più realtime-transcription e realtime-voice invece di importare direttamente i plugin dei vendor

Lo stato finale previsto è:

- OpenAI vive in un singolo plugin anche se si estende tra modelli testuali, speech, immagini e
  futuro video
- un altro vendor può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale plugin vendor possieda il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di ownership
- **capacità** = contratto del core che più plugin possono implementare o consumare

Quindi se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
“quale provider dovrebbe hardcodare la gestione video?” La prima domanda è “qual è
il contratto della capacità video del core?” Una volta che quel contratto esiste, i plugin
vendor possono registrarsi su di esso e i plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa corretta di solito è:

1. definire la capacità mancante nel core
2. esporla tramite l'API/runtime dei plugin in modo tipizzato
3. collegare canali/funzionalità a quella capacità
4. lasciare che i plugin vendor registrino implementazioni

Questo mantiene esplicita l'ownership evitando al tempo stesso comportamenti del core che dipendono da un
singolo vendor o da un percorso di codice specifico di un plugin.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove collocare il codice:

- **livello di capacità del core**: orchestrazione condivisa, criterio, fallback, regole di merge
  della configurazione, semantica di consegna e contratti tipizzati
- **livello del plugin vendor**: API specifiche del vendor, auth, cataloghi modelli, sintesi vocale,
  generazione immagini, futuri backend video, endpoint di utilizzo
- **livello del plugin di canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma le capacità del core e le presenta su una superficie

Ad esempio, TTS segue questa forma:

- il core possiede il criterio TTS al momento della risposta, l'ordine di fallback, le preferenze e la consegna ai canali
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper runtime TTS per la telefonia

Lo stesso pattern dovrebbe essere preferito per le capacità future.

### Esempio di plugin aziendale multi-capacità

Un plugin aziendale dovrebbe apparire coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, speech, trascrizione realtime, voce realtime, comprensione dei media,
generazione immagini, generazione video, web fetch e web search,
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
      // auth/catalogo modelli/runtime hook
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configurazione speech del vendor — implementa direttamente l'interfaccia SpeechProviderPlugin
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
        // logica di credenziale + fetch
      }),
    );
  },
};

export default plugin;
```

Ciò che conta non sono i nomi esatti degli helper. Conta la forma:

- un plugin possiede la superficie del vendor
- il core continua a possedere i contratti di capacità
- i plugin di canale e di funzionalità consumano `api.runtime.*`, non codice del vendor
- i test di contratto possono verificare che il plugin abbia registrato le capacità che
  dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica
capacità condivisa. Lo stesso modello di ownership si applica qui:

1. il core definisce il contratto di media-understanding
2. i plugin vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` quando applicabile
3. i plugin di canale e di funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice del vendor

Questo evita di incorporare nel core le ipotesi video di un singolo provider. Il plugin possiede
la superficie del vendor; il core possiede il contratto della capacità e il comportamento di fallback.

La generazione video usa già la stessa sequenza: il core possiede il contratto di capacità
tipizzato e l'helper runtime, e i plugin vendor registrano implementazioni
`api.registerVideoGenerationProvider(...)` rispetto a esso.

Hai bisogno di una checklist concreta per il rilascio? Vedi
[Capability Cookbook](/tools/capability-cookbook).

## Contratti e enforcement

La superficie API dei plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e
gli helper runtime su cui un plugin può fare affidamento.

Perché è importante:

- gli autori dei plugin ottengono un unico standard interno stabile
- il core può rifiutare ownership duplicate, ad esempio due plugin che registrano lo stesso
  provider id
- l'avvio può mostrare diagnostica utile per registrazioni malformate
- i test di contratto possono applicare l'ownership dei plugin bundled e prevenire derive silenziose

Esistono due livelli di enforcement:

1. **enforcement della registrazione runtime**
   Il registry dei plugin convalida le registrazioni durante il caricamento dei plugin. Esempi:
   provider id duplicati, speech provider id duplicati e registrazioni
   malformate producono diagnostica dei plugin invece di comportamento indefinito.
2. **test di contratto**
   I plugin bundled vengono catturati nei registry di contratto durante i test, così
   OpenClaw può verificare esplicitamente l'ownership. Oggi questo è usato per i model
   provider, gli speech provider, i web search provider e l'ownership delle registrazioni bundled.

L'effetto pratico è che OpenClaw sa, in anticipo, quale plugin possiede quale
superficie. Questo permette al core e ai canali di comporsi senza attriti perché l'ownership è
dichiarata, tipizzata e testabile invece che implicita.

### Cosa appartiene a un contratto

I buoni contratti di plugin sono:

- tipizzati
- piccoli
- specifici della capacità
- posseduti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti di plugin sono:

- criterio specifico del vendor nascosto nel core
- escape hatch una tantum per il plugin che bypassano il registry
- codice del canale che accede direttamente a un'implementazione vendor
- oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi
lascia che i plugin vi si colleghino.

## Modello di esecuzione

I plugin nativi OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono
sandboxed. Un plugin nativo caricato ha lo stesso confine di trust a livello di processo del
codice core.

Implicazioni:

- un plugin nativo può registrare strumenti, handler di rete, hook e servizi
- un bug in un plugin nativo può mandare in crash o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione di codice arbitrario dentro il processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw li tratta attualmente
come pacchetti di metadati/contenuto. Nelle release attuali, questo significa
soprattutto Skills bundled.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non bundled. Tratta
i plugin del workspace come codice di sviluppo, non come predefiniti di produzione.

Per i nomi dei pacchetti del workspace bundled, mantieni l'id del plugin ancorato nel nome npm:
`@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo di plugin più ristretto.

Nota importante sul trust:

- `plugins.allow` considera trusted gli **id del plugin**, non la provenienza della sorgente.
- Un plugin del workspace con lo stesso id di un plugin bundled oscura intenzionalmente
  la copia bundled quando quel plugin del workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.

## Confine di esportazione

OpenClaw esporta capacità, non comodità di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici dei plugin bundled
- sottopercorsi di plumbing runtime non destinati a essere API pubbliche
- helper di convenienza specifici del vendor
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei plugin bundled restano ancora nella mappa di esportazione SDK generata
per compatibilità e manutenzione dei plugin bundled. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diversi seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come pattern SDK consigliato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw fa più o meno questo:

1. scopre le radici dei plugin candidati
2. legge i manifest nativi o dei bundle compatibili e i metadati dei package
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati tramite jiti
7. chiama gli hook nativi `register(api)` (o `activate(api)` — alias legacy) e raccoglie le registrazioni nel plugin registry
8. espone il registry alle superfici di comandi/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin bundled usano `register`; preferisci `register` per i nuovi plugin.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione runtime. I candidati vengono bloccati
quando l'entry esce dalla radice del plugin, il percorso è world-writable o l'ownership del percorso appare sospetta per i plugin non bundled.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- scoprire canali/Skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della Control UI
- mostrare metadati di installazione/catalogo

Per i plugin nativi, il modulo runtime è la parte del data plane. Registra il
comportamento reale come hook, strumenti, comandi o flussi del provider.

### Cosa memorizza in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati del discovery
- dati del manifest registry
- registry dei plugin caricati

Queste cache riducono i costi di avvio a raffica e l'overhead di comandi ripetuti. È sicuro
considerarle cache di prestazioni a breve durata, non persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre della cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello di registry

I plugin caricati non mutano direttamente variabili globali casuali del core. Si registrano in un
registry centrale dei plugin.

Il registry traccia:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler Gateway RPC
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dal plugin

Le funzionalità core leggono poi da quel registry invece di parlare direttamente con i moduli del plugin.
Questo mantiene unidirezionale il caricamento:

- modulo del plugin -> registrazione nel registry
- runtime del core -> consumo del registry

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core richiede
un solo punto di integrazione: “leggere il registry”, non “special-case ogni modulo plugin”.

## Callback di binding della conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

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

      // La richiesta è stata negata; pulisci eventuale stato locale in sospeso.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campi del payload della callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, il suggerimento detach, l'id del mittente e
  i metadati della conversazione

Questa callback è solo una notifica. Non cambia chi è autorizzato ad associare una
conversazione, e viene eseguita dopo che la gestione dell'approvazione del core è terminata.

## Runtime hook del provider

I plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per ricerca economica dell'auth env prima del
  caricamento runtime, più `providerAuthChoices` per etichette economiche di onboarding/auth-choice
  e metadati dei flag CLI prima del caricamento runtime
- hook in fase di configurazione: `catalog` / legacy `discovery` più `applyConfigDefaults`
- runtime hook: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
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
il criterio degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
richiedere un intero trasporto di inferenza personalizzato.

Usa il manifest `providerAuthEnvVars` quando il provider ha credenziali basate su env
che i percorsi generici auth/status/model-picker devono vedere senza caricare il runtime del plugin.
Usa il manifest `providerAuthChoices` quando le superfici CLI di onboarding/auth-choice
devono conoscere choice id del provider, etichette di gruppo e semplice
wiring auth con un solo flag senza caricare il runtime del provider. Mantieni `envVars` del runtime
del provider per suggerimenti verso l'operatore come etichette di onboarding o variabili di configurazione OAuth
client-id/client-secret.

### Ordine e uso degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook approssimativamente in questo ordine.
La colonna “Quando usarlo” è la guida rapida alla decisione.

| #   | Hook                              | Cosa fa                                                                                | Quando usarlo                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json` | Il provider possiede un catalogo o valori predefiniti di base URL                                                                          |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono da modalità auth, env o semantica della famiglia di modelli del provider                                   |
| --  | _(ricerca built-in del modello)_  | OpenClaw prova prima il normale percorso registry/catalogo                             | _(non è un hook di plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview di model-id prima della ricerca                      | Il provider possiede la pulizia degli alias prima della risoluzione del modello canonico                                                   |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello | Il provider possiede la pulizia del trasporto per provider id personalizzati nella stessa famiglia di trasporto                            |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider            | Il provider necessita di pulizia della configurazione che dovrebbe vivere con il plugin; gli helper bundled della famiglia Google fanno anche da fallback per le voci Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità d'uso native streaming ai provider di configurazione | Il provider necessita di correzioni dei metadati native streaming usage guidate dall'endpoint                                             |
| 7   | `resolveConfigApiKey`             | Risolve l'auth env-marker per i provider di configurazione prima del caricamento runtime auth | Il provider ha una risoluzione della API key basata su env-marker posseduta dal provider; anche `amazon-bedrock` ha qui un resolver built-in di env-marker AWS |
| 8   | `resolveSyntheticAuth`            | Espone auth locale/self-hosted o basata su config senza persistere testo in chiaro     | Il provider può operare con un marker di credenziale sintetica/locale                                                                      |
| 9   | `shouldDeferSyntheticProfileAuth` | Abbassa i placeholder sintetici memorizzati dietro auth basata su env/config           | Il provider memorizza profili placeholder sintetici che non dovrebbero vincere la precedenza                                               |
| 10  | `resolveDynamicModel`             | Fallback sincrono per model id posseduti dal provider non ancora presenti nel registry locale | Il provider accetta model id upstream arbitrari                                                                                           |
| 11  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                   | Il provider necessita di metadati di rete prima di risolvere id sconosciuti                                                                |
| 12  | `normalizeResolvedModel`          | Riscrittura finale prima che l'embedded runner usi il modello risolto                  | Il provider necessita di riscritture del trasporto ma continua a usare un trasporto del core                                               |
| 13  | `contributeResolvedModelCompat`   | Contribuisce con flag compat per modelli vendor dietro un altro trasporto compatibile  | Il provider riconosce i propri modelli su trasporti proxy senza prendere il controllo del provider                                         |
| 14  | `capabilities`                    | Metadati di trascrizione/tooling posseduti dal provider usati dalla logica condivisa del core | Il provider necessita di peculiarità della famiglia provider/trascrizione                                                                  |
| 15  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che l'embedded runner li veda              | Il provider necessita di pulizia dello schema della famiglia di trasporto                                                                   |
| 16  | `inspectToolSchemas`              | Espone diagnostica degli schemi posseduta dal provider dopo la normalizzazione         | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                              |
| 17  | `resolveReasoningOutputMode`      | Seleziona contratto di output reasoning nativo o con tag                               | Il provider necessita di output reasoning/final con tag invece di campi nativi                                                             |
| 18  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici di opzioni stream | Il provider necessita di parametri di richiesta predefiniti o pulizia per-provider                                                         |
| 19  | `createStreamFn`                  | Sostituisce completamente il normale percorso stream con un trasporto personalizzato   | Il provider necessita di un protocollo wire personalizzato, non solo di un wrapper                                                         |
| 20  | `wrapStreamFn`                    | Wrapper stream dopo l'applicazione dei wrapper generici                                | Il provider necessita di wrapper di compatibilità per header/body/modello della richiesta senza un trasporto personalizzato                |
| 21  | `resolveTransportTurnState`       | Collega header o metadati nativi per-turno del trasporto                               | Il provider vuole che i trasporti generici inviino identità di turno native del provider                                                   |
| 22  | `resolveWebSocketSessionPolicy`   | Collega header WebSocket nativi o criterio di cooldown della sessione                  | Il provider vuole che i trasporti WS generici regolino header di sessione o criterio di fallback                                           |
| 23  | `formatApiKey`                    | Formatter del profilo auth: il profilo memorizzato diventa la stringa `apiKey` runtime | Il provider memorizza metadati auth aggiuntivi e necessita di una forma di token runtime personalizzata                                    |
| 24  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o criterio di fallimento del refresh | Il provider non si adatta ai refresher condivisi di `pi-ai`                                                                               |
| 25  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                  | Il provider necessita di indicazioni di riparazione auth possedute dal provider dopo un fallimento del refresh                             |
| 26  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto posseduto dal provider                  | Il provider ha errori grezzi di overflow che le euristiche generiche non rileverebbero                                                     |
| 27  | `classifyFailoverReason`          | Classificazione della ragione di failover posseduta dal provider                       | Il provider può mappare errori raw API/trasporto a rate-limit/overload/ecc.                                                                |
| 28  | `isCacheTtlEligible`              | Criterio prompt-cache per provider proxy/backhaul                                      | Il provider necessita di gating cache TTL specifico del proxy                                                                              |
| 29  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero missing-auth                           | Il provider necessita di un hint di recupero missing-auth specifico del provider                                                            |
| 30  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più hint di errore facoltativo per l'utente  | Il provider deve nascondere righe upstream obsolete o sostituirle con un hint del vendor                                                   |
| 31  | `augmentModelCatalog`             | Righe sintetiche/finali del catalogo aggiunte dopo il discovery                        | Il provider necessita di righe sintetiche forward-compat in `models list` e nei picker                                                     |
| 32  | `isBinaryThinking`                | Toggle reasoning on/off per provider con thinking binario                              | Il provider espone solo thinking binario on/off                                                                                             |
| 33  | `supportsXHighThinking`           | Supporto reasoning `xhigh` per modelli selezionati                                     | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                |
| 34  | `resolveDefaultThinkingLevel`     | Livello `/think` predefinito per una specifica famiglia di modelli                     | Il provider possiede il criterio `/think` predefinito per una famiglia di modelli                                                          |
| 35  | `isModernModelRef`                | Matcher dei modelli moderni per filtri di profilo live e selezione smoke               | Il provider possiede il matching del modello preferito live/smoke                                                                           |
| 36  | `prepareRuntimeAuth`              | Scambia una credenziale configurata nel token/key runtime reale appena prima dell'inferenza | Il provider necessita di uno scambio token o di una credenziale di richiesta a vita breve                                                 |
| 37  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/billing per `/usage` e superfici di stato correlate | Il provider necessita di parsing personalizzato del token di utilizzo/quota o di una credenziale di utilizzo diversa                      |
| 38  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo la risoluzione dell'auth | Il provider necessita di un endpoint di utilizzo specifico del provider o di un parser del payload                                        |
| 39  | `createEmbeddingProvider`         | Costruisce un adattatore embedding posseduto dal provider per memory/search            | Il comportamento degli embedding della memory appartiene al plugin del provider                                                             |
| 40  | `buildReplayPolicy`               | Restituisce un criterio di replay che controlla la gestione della trascrizione per il provider | Il provider necessita di un criterio di trascrizione personalizzato (ad esempio, stripping dei blocchi thinking)                          |
| 41  | `sanitizeReplayHistory`           | Riscrive la cronologia del replay dopo la pulizia generica della trascrizione          | Il provider necessita di riscritture del replay specifiche del provider oltre agli helper condivisi di compattazione                       |
| 42  | `validateReplayTurns`             | Convalida o rimodellamento finale dei turni di replay prima dell'embedded runner       | Il trasporto del provider necessita di una validazione più rigorosa dei turni dopo la sanitizzazione generica                              |
| 43  | `onModelSelected`                 | Esegue side effect post-selezione posseduti dal provider                               | Il provider necessita di telemetria o stato posseduto dal provider quando un modello diventa attivo                                        |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider con capacità di hook
finché uno non cambia effettivamente model id o transport/config. Questo mantiene attivi gli shim di alias/provider compat
senza richiedere al chiamante di sapere quale plugin bundled possiede la riscrittura. Se nessun hook del provider riscrive una voce di configurazione supportata della famiglia Google, continua ad applicarsi comunque il normalizzatore di configurazione Google bundled.

Se il provider necessita di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook sono per il comportamento del provider
che continua a funzionare sul normale loop di inferenza di OpenClaw.

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

### Esempi built-in

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` perché possiede forward-compat di Claude 4.6,
  hint della famiglia provider, indicazioni di riparazione auth, integrazione con endpoint di utilizzo,
  eleggibilità della prompt-cache, valori predefiniti della configurazione consapevoli dell'auth, criterio
  di thinking predefinito/adaptive di Claude e modellazione specifica di Anthropic dello stream per
  header beta, `/fast` / `serviceTier` e `context1m`.
- Gli helper stream specifici di Claude per Anthropic restano per ora
  nel seam pubblico `api.ts` / `contract-api.ts` del plugin bundled stesso. Quella superficie di pacchetto
  esporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder wrapper Anthropic di livello inferiore
  invece di ampliare l'SDK generico attorno alle regole degli header beta di un solo
  provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities` più `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  perché possiede la forward-compat di GPT-5.4, la normalizzazione diretta OpenAI
  `openai-completions` -> `openai-responses`, hint auth consapevoli di Codex,
  soppressione Spark, righe sintetiche dell'elenco OpenAI e il criterio GPT-5 di thinking /
  live-model; la famiglia stream `openai-responses-defaults` possiede i
  wrapper condivisi nativi di OpenAI Responses per header di attribuzione,
  `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa Codex,
  modellazione del payload di compatibilità reasoning e gestione del contesto Responses.
- OpenRouter usa `catalog` più `resolveDynamicModel` e
  `prepareDynamicModel` perché il provider è pass-through e può esporre nuovi
  model id prima che il catalogo statico di OpenClaw venga aggiornato; usa anche
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` per mantenere fuori dal core
  header di richiesta specifici del provider, metadati di routing, patch di reasoning e
  criterio della prompt-cache. Il suo criterio di replay proviene dalla famiglia
  `passthrough-gemini`, mentre la famiglia stream `openrouter-thinking`
  possiede l'iniezione del reasoning proxy e gli skip di modello non supportato / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` più `prepareRuntimeAuth` e `fetchUsageSnapshot` perché
  necessita di login device posseduto dal provider, comportamento di fallback del modello, peculiarità
  di trascrizione Claude, uno scambio token GitHub -> token Copilot e un endpoint di utilizzo posseduto dal provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` più
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` perché
  continua a funzionare sui trasporti OpenAI del core ma possiede la propria normalizzazione di trasporto/base URL,
  il criterio di fallback del refresh OAuth, la scelta predefinita del trasporto,
  righe sintetiche del catalogo Codex e l'integrazione con l'endpoint di utilizzo ChatGPT; condivide
  la stessa famiglia stream `openai-responses-defaults` di OpenAI diretto.
- Google AI Studio e Gemini CLI OAuth usano `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` perché la
  famiglia replay `google-gemini` possiede fallback forward-compat di Gemini 3.1,
  validazione nativa del replay Gemini, sanitizzazione del replay bootstrap, modalità
  di output reasoning con tag e matching modern-model, mentre la
  famiglia stream `google-thinking` possiede la normalizzazione del payload thinking di Gemini;
  Gemini CLI OAuth usa anche `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` per formattazione del token, parsing del token e
  wiring dell'endpoint quota.
- Anthropic Vertex usa `buildReplayPolicy` attraverso la
  famiglia replay `anthropic-by-model` così la pulizia specifica del replay Claude resta
  limitata agli id Claude invece che a ogni trasporto `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` perché possiede
  la classificazione specifica di Bedrock di errore throttle/not-ready/context-overflow
  per il traffico Anthropic-on-Bedrock; il suo criterio di replay condivide comunque la stessa
  guardia solo-Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode e Opencode Go usano `buildReplayPolicy`
  tramite la famiglia replay `passthrough-gemini` perché fanno da proxy ai modelli Gemini
  tramite trasporti compatibili OpenAI e necessitano di sanitizzazione della
  thought-signature di Gemini senza validazione nativa del replay Gemini o riscritture bootstrap.
- MiniMax usa `buildReplayPolicy` tramite la
  famiglia replay `hybrid-anthropic-openai` perché un provider possiede sia la semantica
  Anthropic-message sia quella compatibile OpenAI; mantiene la rimozione dei blocchi thinking
  solo-Claude sul lato Anthropic mentre sovrascrive la modalità di output reasoning tornando a quella nativa, e la famiglia stream `minimax-fast-mode`
  possiede le riscritture del modello fast-mode sul percorso stream condiviso.
- Moonshot usa `catalog` più `wrapStreamFn` perché continua a usare il trasporto OpenAI condiviso
  ma necessita di normalizzazione del payload thinking posseduta dal provider; la famiglia stream
  `moonshot-thinking` mappa la configurazione più lo stato `/think` sul suo payload
  thinking binario nativo.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` perché necessita di header di richiesta posseduti dal provider,
  normalizzazione del payload reasoning, hint di trascrizione Gemini e gating
  Anthropic cache-TTL; la famiglia stream `kilocode-thinking` mantiene l'iniezione
  del thinking Kilo sul percorso stream proxy condiviso saltando `kilo/auto` e
  altri proxy model id che non supportano payload reasoning espliciti.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` perché possiede fallback GLM-5,
  valori predefiniti `tool_stream`, UX del thinking binario, matching modern-model e sia
  auth d'uso sia recupero quota; la famiglia stream `tool-stream-default-on` mantiene
  il wrapper `tool_stream` default-on fuori dalla colla scritta a mano per-provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  perché possiede la normalizzazione nativa del trasporto xAI Responses, le riscritture
  degli alias fast-mode di Grok, `tool_stream` predefinito, pulizia di strict-tool /
  reasoning-payload, riuso dell'auth di fallback per strumenti posseduti dal plugin, risoluzione
  forward-compat dei modelli Grok e patch di compatibilità possedute dal provider come il profilo schema strumenti xAI,
  keyword di schema non supportate, `web_search` nativo e decodifica
  degli argomenti delle chiamate agli strumenti con entità HTML.
- Mistral, OpenCode Zen e OpenCode Go usano solo `capabilities` per tenere
  fuori dal core le peculiarità di trascrizione/tooling.
- I provider bundled solo-catalogo come `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine` usano
  solo `catalog`.
- Qwen usa `catalog` per il proprio text provider più registrazioni condivise di media-understanding e
  video-generation per le sue superfici multimodali.
- MiniMax e Xiaomi usano `catalog` più hook di utilizzo perché il loro comportamento `/usage`
  è posseduto dal plugin anche se l'inferenza continua a usare i trasporti condivisi.

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

- `textToSpeech` restituisce il normale payload TTS del core per superfici file/voice-note.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per picker della voce o flussi di setup posseduti dal vendor.
- Gli elenchi delle voci possono includere metadati più ricchi come locale, genere e tag di personalità per picker consapevoli del provider.
- OpenAI e ElevenLabs supportano oggi la telefonia. Microsoft no.

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

- Mantieni nel core il criterio TTS, il fallback e la consegna della risposta.
- Usa gli speech provider per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato all'id provider `microsoft`.
- Il modello di ownership preferito è orientato all'azienda: un plugin vendor può possedere
  provider di testo, voce, immagini e futuri media man mano che OpenClaw aggiunge questi
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un provider
tipizzato di media-understanding invece di un generico contenitore chiave/valore:

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

- Mantieni nel core orchestrazione, fallback, configurazione e wiring dei canali.
- Mantieni il comportamento del vendor nel plugin provider.
- L'espansione additiva deve restare tipizzata: nuovi metodi opzionali, nuovi campi
  opzionali del risultato, nuove capacità opzionali.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capacità e l'helper runtime
  - i plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

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

Per la trascrizione audio, i plugin possono usare sia il runtime di media-understanding
sia il vecchio alias STT:

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
- Usa la configurazione audio core di media-understanding (`tools.media.audio`) e l'ordine di fallback del provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (ad esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità.

I plugin possono anche lanciare esecuzioni subagent in background tramite `api.runtime.subagent`:

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

- `provider` e `model` sono override facoltativi per-esecuzione, non modifiche persistenti della sessione.
- OpenClaw onora quei campi di override solo per chiamanti trusted.
- Per esecuzioni di fallback possedute dal plugin, gli operatori devono effettuare opt-in con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin trusted a target canonici specifici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent di plugin non trusted continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente.

Per la ricerca web, i plugin possono consumare l'helper runtime condiviso invece di
raggiungere il wiring degli strumenti dell'agente:

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

- Mantieni nel core la selezione del provider, la risoluzione delle credenziali e la semantica condivisa delle richieste.
- Usa i web-search provider per trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per plugin di funzionalità/canale che necessitano del comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

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

- `generate(...)`: genera un'immagine usando la catena configurata dei provider di image-generation.
- `listProviders(...)`: elenca i provider disponibili di image-generation e le loro capacità.

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
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale auth del gateway, oppure `"plugin"` per auth/validazione webhook gestite dal plugin.
- `match`: facoltativo. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: facoltativo. Consente allo stesso plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo sullo stesso livello auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope runtime dell'operatore. Sono destinate a webhook/validazione delle firme gestiti dal plugin, non a chiamate privilegiate agli helper del Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope runtime di richiesta Gateway, ma tale scope è intenzionalmente conservativo:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP trusted con identità (ad esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) onorano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste a route plugin con identità, lo scope runtime ricade su `operator.write`
- Regola pratica: non presumere che una route plugin con auth gateway sia implicitamente una superficie admin. Se la tua route richiede comportamento solo-admin, richiedi una modalità auth con identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import del Plugin SDK

Usa i sottopercorsi dell'SDK invece dell'import monolitico `openclaw/plugin-sdk` quando
scrivi plugin:

- `openclaw/plugin-sdk/plugin-entry` per le primitive di registrazione dei plugin.
- `openclaw/plugin-sdk/core` per il contratto generico condiviso rivolto ai plugin.
- `openclaw/plugin-sdk/config-schema` per l'esportazione dello schema Zod root di `openclaw.json`
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
  `openclaw/plugin-sdk/webhook-ingress` per setup condiviso, auth, risposta e
  wiring dei webhook. `channel-inbound` è la sede condivisa per debounce, matching delle mention,
  formattazione degli envelope e helper del contesto degli envelope in entrata.
  `channel-setup` è il seam di setup ristretto per installazione facoltativa.
  `setup-runtime` è la superficie di setup sicura per il runtime usata da `setupEntry` /
  avvio differito, inclusi gli adattatori di patch di setup sicuri per l'import.
  `setup-adapter-runtime` è il seam dell'adattatore di setup dell'account consapevole dell'env.
  `setup-tools` è il piccolo seam di helper CLI/archivio/documentazione (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Sottopercorsi di dominio come `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` per helper condivisi di runtime/configurazione.
  `telegram-command-config` è il seam pubblico ristretto per normalizzazione/validazione dei custom
  command di Telegram e resta disponibile anche se la superficie contrattuale bundled di Telegram è temporaneamente non disponibile.
  `text-runtime` è il seam condiviso di testo/markdown/logging, incluso
  lo stripping del testo visibile all'assistente, helper di rendering/chunking markdown, helper di redazione, helper per directive-tag e utility di testo sicuro.
- I seam di canale specifici per le approvazioni dovrebbero preferire un unico contratto `approvalCapability` sul plugin. Il core legge quindi auth, consegna, rendering e comportamento di instradamento nativo delle approvazioni attraverso quella singola capacità invece di mescolare il comportamento di approvazione in campi del plugin non correlati.
- `openclaw/plugin-sdk/channel-runtime` è deprecato e rimane solo come
  shim di compatibilità per plugin più vecchi. Il nuovo codice dovrebbe importare invece le primitive generiche più ristrette, e il codice del repo non dovrebbe aggiungere nuovi import dello shim.
- Gli interni delle extension bundled restano privati. I plugin esterni dovrebbero usare solo i sottopercorsi `openclaw/plugin-sdk/*`. Il codice/test del core OpenClaw può usare i punti di ingresso pubblici del repo sotto la root del pacchetto del plugin come `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e file a portata ristretta come
  `login-qr-api.js`. Non importare mai `src/*` di un pacchetto plugin dal core o da
  un'altra extension.
- Suddivisione del punto di ingresso del repo:
  `<plugin-package-root>/api.js` è il barrel helper/types,
  `<plugin-package-root>/runtime-api.js` è il barrel solo-runtime,
  `<plugin-package-root>/index.js` è l'entry del plugin bundled,
  e `<plugin-package-root>/setup-entry.js` è l'entry del plugin di setup.
- Esempi attuali di provider bundled:
  - Anthropic usa `api.js` / `contract-api.js` per helper stream di Claude come
    `wrapAnthropicProviderStream`, helper per header beta e parsing di `service_tier`.
  - OpenAI usa `api.js` per builder del provider, helper del modello predefinito e builder dei provider realtime.
  - OpenRouter usa `api.js` per il proprio builder provider più helper di onboarding/configurazione, mentre `register.runtime.js` può ancora riesportare helper generici `plugin-sdk/provider-stream` per uso locale del repo.
- I punti di ingresso pubblici caricati tramite facade preferiscono lo snapshot di configurazione runtime attivo
  quando esiste, poi ricadono sulla configurazione risolta su disco quando
  OpenClaw non sta ancora servendo uno snapshot runtime.
- Le primitive generiche condivise restano il contratto SDK pubblico preferito. Esiste ancora un piccolo insieme di compatibilità riservato di seam helper branded per canali bundled. Trattali come seam di manutenzione bundled/compatibilità, non come nuovi target di import per terze parti; i nuovi contratti cross-channel dovrebbero continuare ad arrivare sui sottopercorsi generici `plugin-sdk/*` o sui barrel locali del plugin `api.js` /
  `runtime-api.js`.

Nota di compatibilità:

- Evita il barrel root `openclaw/plugin-sdk` nel nuovo codice.
- Preferisci prima le primitive stabili ristrette. I più recenti sottopercorsi setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sono il contratto previsto per il nuovo lavoro su plugin bundled ed esterni.
  Il parsing/matching dei target appartiene a `openclaw/plugin-sdk/channel-targets`.
  I gate delle azioni di messaggio e gli helper message-id delle reazioni appartengono a
  `openclaw/plugin-sdk/channel-actions`.
- I barrel helper specifici delle extension bundled non sono stabili per impostazione predefinita. Se un
  helper serve solo a una extension bundled, mantienilo dietro il seam locale `api.js` o `runtime-api.js` dell'extension invece di promuoverlo in `openclaw/plugin-sdk/<extension>`.
- I nuovi seam helper condivisi dovrebbero essere generici, non branded per canale. Il parsing
  condiviso dei target appartiene a `openclaw/plugin-sdk/channel-targets`; gli interni specifici del canale
  restano dietro il seam locale `api.js` o `runtime-api.js` del plugin proprietario.
- Sottopercorsi specifici della capacità come `image-generation`,
  `media-understanding` e `speech` esistono perché i plugin bundled/nativi li usano
  oggi. La loro presenza non significa di per sé che ogni helper esportato sia un
  contratto esterno congelato a lungo termine.

## Schemi dello strumento `message`

I plugin dovrebbero possedere i contributi allo schema di `describeMessageTool(...)` specifici del canale. Mantieni i campi specifici del provider nel plugin, non nel core condiviso.

Per frammenti di schema portabili condivisi, riusa gli helper generici esportati tramite
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` per payload in stile griglia di pulsanti
- `createMessageToolCardSchema()` per payload di card strutturate

Se una forma di schema ha senso solo per un provider, definiscila nel sorgente
del plugin stesso invece di promuoverla nell'SDK condiviso.

## Risoluzione dei target di canale

I plugin di canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni generico l'host in uscita condiviso e usa la superficie dell'adattatore di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  deve essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione tipo-id invece della ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core necessita di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo una directory miss.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione specifica del provider una volta risolto il target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  di cercare peer/gruppi.
- Usa `looksLikeId` per i controlli “tratta questo come un id target esplicito/nativo”.
- Usa `resolveTarget` per il fallback di normalizzazione specifico del provider, non per una ricerca ampia nella directory.
- Mantieni gli id nativi del provider come chat id, thread id, JID, handle e room id all'interno dei valori `target` o dei parametri specifici del provider, non in campi SDK generici.

## Directory supportate dalla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
plugin e riutilizzare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale necessita di peer/gruppi supportati dalla configurazione come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici di directory con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione dei limiti
- helper di deduplica/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione dell'account e la normalizzazione dell'id specifiche del canale dovrebbero restare nell'implementazione del plugin.

## Cataloghi dei provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede model id specifici del provider, valori predefiniti di base URL o metadati di modello vincolati all'auth.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai provider impliciti built-in di OpenClaw:

- `simple`: provider semplici guidati da API-key o env
- `profile`: provider che appaiono quando esistono auth profile
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione delle chiavi, quindi i plugin possono intenzionalmente sovrascrivere una voce provider built-in con lo stesso provider id.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione del canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può assumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano segreti richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/config
  non dovrebbero dover materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituisci solo lo stato descrittivo dell'account.
- Preserva `enabled` e `configured`.
- Includi campi di source/status delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori raw dei token solo per riportare la disponibilità in sola lettura. È sufficiente restituire `tokenStatus: "available"` (e il relativo campo source).
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo permette ai comandi in sola lettura di indicare “configurato ma non disponibile in questo percorso di comando” invece di andare in crash o riportare in modo errato l'account come non configurato.

## Package pack

Una directory di plugin può includere un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Ogni voce diventa un plugin. Se il pack elenca più extension, l'id del plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory in modo che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni voce `openclaw.extensions` deve restare all'interno della directory del plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del package vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (nessun lifecycle script, nessuna dev dependency a runtime). Mantieni gli alberi di dipendenze del plugin “pure JS/TS” ed evita pacchetti che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo-setup.
Quando OpenClaw necessita delle superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo mantiene avvio e setup più leggeri
quando l'entry principale del plugin collega anche strumenti, hook o altro codice solo-runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può fare opt-in di un plugin di canale allo stesso percorso `setupEntry` durante la fase di
avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, questo significa che l'entry di setup
deve registrare ogni capacità posseduta dal canale da cui l'avvio dipende, come:

- la registrazione del canale stesso
- ogni route HTTP che deve essere disponibile prima che il gateway inizi ad ascoltare
- ogni metodo gateway, strumento o servizio che deve esistere in quella stessa finestra

Se la tua entry completa possiede ancora una qualsiasi capacità di avvio richiesta, non abilitare
questo flag. Mantieni il plugin nel comportamento predefinito e lascia che OpenClaw carichi
l'entry completa durante l'avvio.

I canali bundled possono anche pubblicare helper di superficie contrattuale solo-setup che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale superficie di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale single-account in
`channels.<id>.accounts.*` senza caricare l'entry completa del plugin.
Matrix è l'esempio bundled attuale: sposta solo chiavi auth/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare una
chiave default-account non canonica configurata invece di creare sempre
`accounts.default`.

Questi adattatori di patch del setup mantengono lazy il discovery della superficie contrattuale bundled. Il tempo di import resta leggero; la superficie di promozione viene caricata solo al primo uso invece di rientrare nell'avvio del canale bundled durante l'import del modulo.

Quando quelle superfici di avvio includono metodi Gateway RPC, mantienile su un
prefisso specifico del plugin. I namespace admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
in `operator.admin`, anche se un plugin richiede uno scope più ristretto.

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

### Metadati di catalogo del canale

I plugin di canale possono pubblicizzare metadati di setup/discovery tramite `openclaw.channel` e
hint di installazione tramite `openclaw.install`. Questo mantiene il catalogo del core privo di dati.

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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
- `docsLabel`: sovrascrive il testo del link alla documentazione
- `preferOver`: id di plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con markdown per decisioni di formattazione in uscita
- `showConfigured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `quickstartAllowFrom`: abilita il canale al flusso quickstart standard `allowFrom`
- `forceAccountBinding`: richiede il binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione durante la risoluzione dei target di announce

OpenClaw può anche unire **cataloghi di canali esterni** (ad esempio, un export di un
registry MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

## Plugin del motore di contesto

I plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingest,
assemblaggio e compattazione. Registrali dal tuo plugin con
`api.registerContextEngine(id, factory)`, quindi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usalo quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita invece di
aggiungere solo ricerca nella memory o hook.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
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
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

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
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Aggiungere una nuova capacità

Quando un plugin necessita di un comportamento che non si adatta all'API attuale, non bypassare
il sistema dei plugin con un reach-in privato. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definisci il contratto del core
   Decidi quale comportamento condiviso dovrebbe possedere il core: criterio, fallback, merge della configurazione,
   lifecycle, semantica rivolta ai canali e forma dell'helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la superficie di capacità tipizzata più piccola utile.
3. collega consumatori core + canale/funzionalità
   I canali e i plugin di funzionalità dovrebbero consumare la nuova capacità tramite il core,
   non importando direttamente un'implementazione vendor.
4. registra implementazioni vendor
   I plugin vendor registrano quindi i loro backend rispetto alla capacità.
5. aggiungi copertura contrattuale
   Aggiungi test in modo che ownership e forma della registrazione restino esplicite nel tempo.

È così che OpenClaw rimane opinionated senza diventare hardcoded verso la visione del mondo di un
singolo provider. Vedi il [Capability Cookbook](/tools/capability-cookbook)
per una checklist concreta dei file e un esempio completo.

### Checklist della capacità

Quando aggiungi una nuova capacità, l'implementazione dovrebbe di solito toccare insieme queste
superfici:

- tipi di contratto del core in `src/<capability>/types.ts`
- runner/helper runtime del core in `src/<capability>/runtime.ts`
- superficie di registrazione API del plugin in `src/plugins/types.ts`
- wiring del plugin registry in `src/plugins/registry.ts`
- esposizione del runtime del plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale devono consumarlo
- helper di cattura/test in `src/test-utils/plugin-registration.ts`
- assert di ownership/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, di solito è un segnale che la capacità non è ancora completamente integrata.

### Template della capacità

Pattern minimo:

```ts
// contratto del core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API del plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime condiviso per plugin di funzionalità/canale
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

- il core possiede il contratto della capacità + l'orchestrazione
- i plugin vendor possiedono le implementazioni del vendor
- i plugin di funzionalità/canale consumano helper runtime
- i test di contratto mantengono esplicita l'ownership
