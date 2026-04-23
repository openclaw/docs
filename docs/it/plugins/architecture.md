---
read_when:
    - Creare o fare debug di plugin OpenClaw nativi
    - Capire il modello di capacità del plugin o i confini di ownership
    - Lavorare sulla pipeline di caricamento o sul registry dei plugin
    - Implementare hook runtime del provider o plugin di canale
sidebarTitle: Internals
summary: 'Interni dei plugin: modello di capacità, ownership, contratti, pipeline di caricamento e helper runtime'
title: Interni dei plugin
x-i18n:
    generated_at: "2026-04-23T08:31:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d5e4b9c48c2a0fc8116733e38a745bac5dfdbe65fdea8e9be6563b4051d805
    source_path: plugins/architecture.md
    workflow: 15
---

# Interni dei plugin

<Info>
  Questo è il **riferimento architetturale approfondito**. Per guide pratiche, vedi:
  - [Installare e usare i plugin](/it/tools/plugin) — guida per l'utente
  - [Getting Started](/it/plugins/building-plugins) — primo tutorial sui plugin
  - [Plugin di canale](/it/plugins/sdk-channel-plugins) — crea un canale di messaggistica
  - [Plugin provider](/it/plugins/sdk-provider-plugins) — crea un provider di modelli
  - [Panoramica SDK](/it/plugins/sdk-overview) — mappa di importazione e API di registrazione
</Info>

Questa pagina copre l'architettura interna del sistema di plugin di OpenClaw.

## Modello di capacità pubblico

Le capacità sono il modello pubblico dei **plugin nativi** dentro OpenClaw. Ogni
plugin OpenClaw nativo si registra rispetto a uno o più tipi di capacità:

| Capacità               | Metodo di registrazione                          | Esempi di plugin                    |
| ---------------------- | ------------------------------------------------ | ----------------------------------- |
| Inferenza testuale     | `api.registerProvider(...)`                      | `openai`, `anthropic`               |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`               |
| Voce                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| Trascrizione realtime  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Voce realtime          | `api.registerRealtimeVoiceProvider(...)`         | `openai`                            |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                  |
| Generazione immagini   | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generazione musica     | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                 |
| Generazione video      | `api.registerVideoGenerationProvider(...)`       | `qwen`                              |
| Recupero web           | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Ricerca web            | `api.registerWebSearchProvider(...)`             | `google`                            |
| Canale / messaggistica | `api.registerChannel(...)`                       | `msteams`, `matrix`                 |

Un plugin che registra zero capacità ma fornisce hook, strumenti o
servizi è un plugin **legacy solo-hook**. Questo pattern è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello di capacità è stato integrato nel core ed è oggi usato dai plugin
nativi/inclusi, ma la compatibilità dei plugin esterni richiede ancora una soglia più stretta di “è esportato, quindi è congelato”.

Indicazioni attuali:

- **plugin esterni esistenti:** mantieni funzionanti le integrazioni basate su hook; considera
  questa come base di compatibilità
- **nuovi plugin nativi/inclusi:** preferisci la registrazione esplicita delle capacità a
  integrazioni specifiche del vendor o a nuovi design solo-hook
- **plugin esterni che adottano la registrazione delle capacità:** consentiti, ma considera le
  superfici helper specifiche delle capacità come in evoluzione a meno che la documentazione non contrassegni esplicitamente un contratto come stabile

Regola pratica:

- le API di registrazione delle capacità sono la direzione prevista
- gli hook legacy restano il percorso più sicuro per evitare rotture nei plugin esterni durante
  la transizione
- i sottopercorsi helper esportati non sono tutti equivalenti; preferisci il contratto
  documentato e ristretto, non esportazioni helper incidentali

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma basata sul suo reale
comportamento di registrazione (non solo sui metadati statici):

- **plain-capability** -- registra esattamente un tipo di capacità (per esempio un
  plugin solo provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capacità (per esempio
  `openai` possiede inferenza testuale, voce, comprensione dei media e generazione
  immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), senza capacità,
  strumenti, comandi o servizi
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capacità

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e la ripartizione
delle capacità. Vedi [riferimento CLI](/it/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per
i plugin solo-hook. I plugin legacy del mondo reale dipendono ancora da esso.

Direzione:

- mantienilo funzionante
- documentalo come legacy
- preferisci `before_model_resolve` per il lavoro di override modello/provider
- preferisci `before_prompt_build` per il lavoro di mutazione del prompt
- rimuovilo solo quando l'uso reale diminuisce e la copertura dei fixture dimostra la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configurazione viene analizzata correttamente e i plugin vengono risolti |
| **compatibility advisory** | Il plugin usa un pattern supportato ma più vecchio (es. `hook-only`) |
| **legacy warning**        | Il plugin usa `before_agent_start`, che è deprecato          |
| **hard error**            | La configurazione non è valida o il plugin non è riuscito a caricarsi |

Né `hook-only` né `before_agent_start` romperanno oggi il tuo plugin --
`hook-only` è solo informativo e `before_agent_start` genera soltanto un avviso. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

1. **Manifest + discovery**
   OpenClaw trova plugin candidati dai percorsi configurati, root del workspace,
   root globali dei plugin e plugin inclusi. La discovery legge prima i manifest
   nativi `openclaw.plugin.json` più i manifest bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un plugin scoperto è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento runtime**
   I plugin OpenClaw nativi vengono caricati in-process tramite jiti e registrano
   capacità in un registry centrale. I bundle compatibili vengono normalizzati in
   record del registry senza importare codice runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registry per esporre strumenti, canali, configurazione
   provider, hook, route HTTP, comandi CLI e servizi.

Per la CLI dei plugin in particolare, la discovery del comando root è divisa in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può restare lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI posseduto dal plugin all'interno del plugin stesso, permettendo comunque a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine progettuale importante:

- discovery + validazione della configurazione dovrebbero funzionare a partire da **metadati manifest/schema**
  senza eseguire codice plugin
- il comportamento runtime nativo proviene dal percorso `register(api)` del modulo plugin

Questa divisione consente a OpenClaw di validare la configurazione, spiegare plugin mancanti/disabilitati e
costruire suggerimenti UI/schema prima che il runtime completo sia attivo.

### Plugin di canale e lo strumento message condiviso

I plugin di canale non devono registrare uno strumento separato send/edit/react per
le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e
i plugin di canale possiedono la discovery e l'esecuzione specifiche del canale dietro di esso.

Il confine attuale è:

- il core possiede l'host condiviso dello strumento `message`, il wiring del prompt, la
  contabilità di sessione/thread e il dispatch di esecuzione
- i plugin di canale possiedono la discovery delle azioni con scope, la discovery delle
  capacità e gli eventuali frammenti di schema specifici del canale
- i plugin di canale possiedono la grammatica della conversazione di sessione specifica del provider, per esempio
  come gli ID di conversazione codificano gli ID thread o ereditano da conversazioni genitore
- i plugin di canale eseguono l'azione finale tramite il loro action adapter

Per i plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di discovery unificata permette a un plugin di restituire insieme le sue azioni visibili, capacità e contributi di schema, così questi elementi non divergono.

Quando un parametro specifico del canale per lo strumento message contiene una sorgente media, come un percorso locale o un URL media remoto, il plugin dovrebbe anche restituire
`mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito per applicare la normalizzazione dei percorsi sandbox e i suggerimenti di accesso ai media in uscita senza hardcodare nomi di parametri posseduti dal plugin.
Preferisci mappe con scope di azione, non un unico elenco piatto per canale, così un
parametro media solo profilo non viene normalizzato su azioni non correlate come
`send`.

Il core passa l'ambito runtime in quel passaggio di discovery. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` attendibile in ingresso

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre
azioni di messaggio in base all'account attivo, alla stanza/thread/messaggio corrente o
all'identità attendibile del richiedente senza hardcodare rami specifici del canale nello
strumento `message` del core.

Questo è il motivo per cui le modifiche di routing dell'embedded-runner restano lavoro del plugin: il runner è
responsabile del forwarding dell'identità corrente di chat/sessione nel confine di discovery del plugin, così lo strumento `message` condiviso espone la giusta superficie posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i plugin inclusi dovrebbero mantenere il runtime di esecuzione all'interno dei propri moduli di estensione. Il core non possiede più i runtime di azione messaggio di Discord, Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i plugin inclusi
dovrebbero importare il proprio codice runtime locale direttamente dai loro moduli posseduti dall'estensione.

Lo stesso confine si applica in generale alle seam SDK denominate per provider: il core non dovrebbe importare barrel di convenienza specifici del canale per estensioni come Slack, Discord, Signal, WhatsApp o simili. Se il core ha bisogno di un comportamento, deve o consumare il barrel `api.ts` / `runtime-api.ts` del plugin incluso stesso oppure promuovere il bisogno a una capacità generica ristretta nello SDK condiviso.

Per i poll in particolare, esistono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che si adattano al modello
  comune di poll
- `actions.handleAction("poll")` è il percorso preferito per semantiche di poll specifiche del canale o parametri di poll aggiuntivi

Il core ora rinvia il parsing condiviso dei poll finché il dispatch del poll del plugin non rifiuta
l'azione, così gli handler di poll posseduti dal plugin possono accettare campi di poll specifici del canale senza essere prima bloccati dal parser di poll generico.

Vedi [Pipeline di caricamento](#load-pipeline) per la sequenza completa di avvio.

## Modello di ownership delle capacità

OpenClaw tratta un plugin nativo come il confine di ownership per una **azienda** o una
**funzionalità**, non come un contenitore di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe di solito possedere tutte le superfici OpenClaw-facing
  di quella azienda
- un plugin di funzionalità dovrebbe di solito possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità core condivise invece di reimplementare in modo ad hoc il comportamento del provider

Esempi:

- il plugin `openai` incluso possiede il comportamento del provider di modelli OpenAI e il comportamento OpenAI per
  speech + realtime-voice + media-understanding + image-generation
- il plugin `elevenlabs` incluso possiede il comportamento speech di ElevenLabs
- il plugin `microsoft` incluso possiede il comportamento speech di Microsoft
- il plugin `google` incluso possiede il comportamento del provider di modelli Google più il comportamento Google per
  media-understanding + image-generation + web-search
- il plugin `firecrawl` incluso possiede il comportamento web-fetch di Firecrawl
- i plugin `minimax`, `mistral`, `moonshot` e `zai` inclusi possiedono i loro
  backend media-understanding
- il plugin `qwen` incluso possiede il comportamento del provider testuale Qwen più
  il comportamento media-understanding e video-generation
- il plugin `voice-call` è un plugin di funzionalità: possiede il trasporto della chiamata, gli strumenti,
  la CLI, le route e il bridging del media-stream Twilio, ma consuma speech condiviso
  più le capacità realtime-transcription e realtime-voice invece di
  importare direttamente i plugin vendor

Lo stato finale previsto è:

- OpenAI vive in un solo plugin anche se copre modelli testuali, speech, immagini e
  futuro video
- un altro vendor può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale plugin vendor possieda il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di ownership
- **capability** = contratto core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
“quale provider dovrebbe hardcodare la gestione del video?” La prima domanda è “qual è
il contratto di capacità video del core?” Una volta che quel contratto esiste, i plugin vendor
possono registrarsi contro di esso e i plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa giusta di solito è:

1. definire la capacità mancante nel core
2. esporla tramite l'API/runtime del plugin in modo tipizzato
3. collegare canali/funzionalità a quella capacità
4. lasciare che i plugin vendor registrino le implementazioni

Questo mantiene esplicita l'ownership evitando al contempo comportamenti nel core che dipendono da
un singolo vendor o da un percorso di codice specifico di un plugin.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove deve stare il codice:

- **livello delle capacità del core**: orchestrazione condivisa, policy, fallback, regole di merge
  della configurazione, semantica di consegna e contratti tipizzati
- **livello del plugin vendor**: API specifiche del vendor, autenticazione, cataloghi di modelli, speech
  synthesis, generazione immagini, futuri backend video, endpoint d'uso
- **livello del plugin di canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma le capacità del core e le presenta su una superficie

Per esempio, il TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e la consegna al canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper runtime TTS per la telefonia

Lo stesso pattern dovrebbe essere preferito per le capacità future.

### Esempio di plugin aziendale multi-capacità

Un plugin aziendale dovrebbe risultare coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, speech, trascrizione realtime, voce realtime, media-understanding, image generation, video generation, web fetch e web search,
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

- un solo plugin possiede la superficie del vendor
- il core possiede comunque i contratti delle capacità
- i plugin di canale e funzionalità consumano gli helper `api.runtime.*`, non il codice del vendor
- i test di contratto possono verificare che il plugin abbia registrato le capacità che
  dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come una sola
capacità condivisa. Lo stesso modello di ownership si applica anche qui:

1. il core definisce il contratto media-understanding
2. i plugin vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` secondo il caso
3. i plugin di canale e funzionalità consumano il comportamento core condiviso invece di
   collegarsi direttamente al codice del vendor

Questo evita di incorporare nel core le ipotesi video di un singolo provider. Il plugin possiede
la superficie del vendor; il core possiede il contratto della capacità e il comportamento di fallback.

La generazione video usa già la stessa sequenza: il core possiede il contratto di
capacità tipizzato e l'helper runtime, e i plugin vendor registrano
implementazioni `api.registerVideoGenerationProvider(...)` contro di esso.

Ti serve una checklist di rollout concreta? Vedi
[Capability Cookbook](/it/plugins/architecture).

## Contratti e applicazione

La superficie API dei plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Quel contratto definisce i punti di registrazione supportati e
gli helper runtime su cui un plugin può fare affidamento.

Perché questo è importante:

- gli autori dei plugin ottengono un unico standard interno stabile
- il core può rifiutare ownership duplicata, come due plugin che registrano lo stesso
  id provider
- l'avvio può mostrare diagnostica azionabile per registrazioni malformate
- i test di contratto possono imporre l'ownership dei plugin inclusi ed evitare derive silenziose

Esistono due livelli di applicazione:

1. **applicazione della registrazione runtime**
   Il registry dei plugin valida le registrazioni mentre i plugin vengono caricati. Esempi:
   id provider duplicati, id provider speech duplicati e registrazioni
   malformate producono diagnostica del plugin invece di comportamento indefinito.
2. **test di contratto**
   I plugin inclusi vengono catturati nei registry di contratto durante le esecuzioni di test così
   OpenClaw può dichiarare esplicitamente l'ownership. Oggi questo è usato per model
   providers, speech providers, web search providers e ownership della registrazione inclusa.

L'effetto pratico è che OpenClaw sa, in anticipo, quale plugin possiede quale
superficie. Questo permette al core e ai canali di comporsi in modo fluido perché l'ownership è
dichiarata, tipizzata e verificabile invece che implicita.

### Cosa appartiene a un contratto

I buoni contratti dei plugin sono:

- tipizzati
- piccoli
- specifici della capacità
- posseduti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti dei plugin sono:

- policy specifiche del vendor nascoste nel core
- vie di fuga ad hoc specifiche del plugin che aggirano il registry
- codice di canale che entra direttamente in un'implementazione vendor
- oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

Nel dubbio, alza il livello di astrazione: definisci prima la capacità, poi
lascia che i plugin vi si colleghino.

## Modello di esecuzione

I plugin OpenClaw nativi vengono eseguiti **in-process** con il Gateway. Non sono
sandboxed. Un plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del codice core.

Implicazioni:

- un plugin nativo può registrare strumenti, gestori di rete, hook e servizi
- un bug di un plugin nativo può far crashare o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione di codice arbitrario dentro il processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa per lo più Skills
incluse.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non inclusi. Tratta
i plugin del workspace come codice in fase di sviluppo, non come valori predefiniti di produzione.

Per i nomi dei package workspace inclusi, mantieni l'id del plugin ancorato al nome npm:
`@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il package espone intenzionalmente un ruolo plugin più ristretto.

Nota importante sulla fiducia:

- `plugins.allow` considera attendibili gli **id dei plugin**, non la provenienza della sorgente.
- Un plugin workspace con lo stesso id di un plugin incluso oscura intenzionalmente
  la copia inclusa quando quel plugin workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.
- La fiducia nei plugin inclusi viene risolta dallo snapshot della sorgente — il manifest e
  il codice su disco al momento del caricamento — piuttosto che dai metadati di installazione. Un record di installazione corrotto
  o sostituito non può ampliare silenziosamente la superficie di fiducia di un plugin incluso oltre ciò che la sorgente reale dichiara.

## Confine di esportazione

OpenClaw esporta capacità, non praticità di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici dei plugin inclusi
- sottopercorsi di plumbing runtime non pensati come API pubblica
- helper di convenienza specifici del vendor
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei plugin inclusi restano ancora nella mappa di esportazione SDK generata per compatibilità e manutenzione dei plugin inclusi. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diverse seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come il pattern SDK consigliato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw esegue all'incirca questo:

1. individua le root candidate dei plugin
2. legge i manifest nativi o compatibili dei bundle e i metadati dei package
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati: i moduli inclusi compilati usano un loader nativo;
   i plugin nativi non compilati usano jiti
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registry dei plugin
8. espone il registry alle superfici di comandi/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin inclusi usano `register`; per i nuovi plugin preferisci `register`.
</Note>

Le barriere di sicurezza avvengono **prima** dell'esecuzione runtime. I candidati vengono bloccati
quando l'entry esce dalla root del plugin, il percorso è world-writable o l'ownership del percorso appare sospetta per i plugin non inclusi.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- individuare canali/Skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del plugin

Per i plugin nativi, il modulo runtime è la parte del data plane. Registra il
comportamento reale come hook, strumenti, comandi o flussi provider.

I blocchi facoltativi `activation` e `setup` del manifest restano nel control plane.
Sono descrittori solo metadati per la pianificazione dell'attivazione e la discovery del setup;
non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano suggerimenti del manifest su comandi, canali e provider
per restringere il caricamento dei plugin prima della materializzazione più ampia del registry:

- Il caricamento CLI si restringe ai plugin che possiedono il comando primario richiesto
- la risoluzione di setup/plugin del canale si restringe ai plugin che possiedono l'id
  canale richiesto
- la risoluzione esplicita di setup/runtime del provider si restringe ai plugin che possiedono l'
  id provider richiesto

La discovery del setup ora preferisce id posseduti dal descrittore come `setup.providers` e
`setup.cliBackends` per restringere i plugin candidati prima di ricorrere a
`setup-api` per i plugin che hanno ancora bisogno di hook runtime in fase di setup. Se più di un plugin individuato rivendica lo stesso id normalizzato di provider di setup o backend CLI, la lookup del setup rifiuta l'owner ambiguo invece di affidarsi all'ordine di discovery.

### Cosa mette in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati della discovery
- dati del registry dei manifest
- registry dei plugin caricati

Queste cache riducono i picchi di avvio e l'overhead dei comandi ripetuti. È corretto
considerarle cache di prestazioni a breve durata, non persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oppure
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre della cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello del registry

I plugin caricati non mutano direttamente globali casuali del core. Si registrano in un
registry centrale dei plugin.

Il registry traccia:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC Gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dal plugin

Le funzionalità del core leggono poi da quel registry invece di parlare direttamente ai moduli
plugin. Questo mantiene un caricamento unidirezionale:

- modulo plugin -> registrazione nel registry
- runtime core -> consumo del registry

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core
ha bisogno di un solo punto d'integrazione: “leggi il registry”, non “special-case di ogni modulo plugin”.

## Callback di binding della conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere un callback dopo che una richiesta di binding
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

Campi del payload del callback:

- `status`: `"approved"` oppure `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oppure `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, suggerimento detach, sender id e
  metadati della conversazione

Questo callback è solo di notifica. Non cambia chi è autorizzato ad associare una
conversazione e viene eseguito dopo che la gestione di approvazione del core è terminata.

## Hook runtime del provider

I plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per una lookup economica dell'autenticazione provider basata su env
  prima del caricamento runtime, `providerAuthAliases` per varianti provider che condividono
  autenticazione, `channelEnvVars` per una lookup economica di env/setup del canale prima del caricamento runtime, più `providerAuthChoices` per etichette economiche di onboarding/scelta autenticazione e
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw continua a possedere il loop agente generico, il failover, la gestione delle trascrizioni e la
policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
dover creare un intero trasporto di inferenza personalizzato.

Usa il manifest `providerAuthEnvVars` quando il provider ha credenziali basate su env
che i percorsi generici di autenticazione/stato/model-picker dovrebbero vedere senza caricare il runtime del plugin. Usa il manifest `providerAuthAliases` quando un id provider deve riutilizzare
le env vars, i profili di autenticazione, l'autenticazione supportata da config e la scelta di onboarding della chiave API di un altro id provider. Usa il manifest `providerAuthChoices` quando le superfici CLI di onboarding/scelta autenticazione
devono conoscere l'id della scelta del provider, le etichette di gruppo e il semplice wiring
dell'autenticazione a singolo flag senza caricare il runtime del provider. Mantieni `envVars` nel runtime del provider per suggerimenti rivolti all'operatore, come etichette di onboarding o variabili di setup per client-id/client-secret OAuth.

Usa il manifest `channelEnvVars` quando un canale ha autenticazione o setup guidati da env che
fallback shell-env generico, controlli config/status o prompt di setup dovrebbero vedere
senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna “When to use” è la guida rapida alla decisione.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider possiede un catalogo o valori predefiniti di base URL                                                                              |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti di configurazione globali posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'env o dalla semantica della famiglia di modelli del provider |
| --  | _(built-in model lookup)_         | OpenClaw prova prima il normale percorso registry/catalog                                                      | _(non è un hook del plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normalizza gli alias legacy o preview dell'id modello prima della lookup                                      | Il provider possiede la pulizia degli alias prima della risoluzione del modello canonico                                                      |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello         | Il provider possiede la pulizia del trasporto per id provider personalizzati nella stessa famiglia di trasporto                               |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                   | Il provider ha bisogno di una pulizia della configurazione che dovrebbe stare nel plugin; gli helper inclusi della famiglia Google fanno anche da backstop per le voci supportate di configurazione Google |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture compat native streaming-usage ai provider di configurazione                               | Il provider ha bisogno di fix dei metadati native streaming usage guidati dall'endpoint                                                       |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione env-marker per i provider di configurazione prima del caricamento dell'autenticazione runtime | Il provider ha una risoluzione della chiave API env-marker posseduta dal provider; `amazon-bedrock` ha anche qui un resolver env-marker AWS integrato |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o supportata da configurazione senza mantenere testo semplice        | Il provider può operare con un marker di credenziale sintetica/locale                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni posseduti dal provider; il valore predefinito di `persistence` è `runtime-only` per credenziali CLI/app-owned | Il provider riutilizza credenziali di autenticazione esterne senza mantenere token di refresh copiati; dichiara `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei placeholder sintetici dei profili memorizzati rispetto all'autenticazione supportata da env/config | Il provider memorizza profili placeholder sintetici che non dovrebbero vincere in precedenza                                                |
| 11  | `resolveDynamicModel`             | Fallback sincrono per id modello posseduti dal provider non ancora presenti nel registry locale               | Il provider accetta id di modelli upstream arbitrari                                                                                           |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider ha bisogno di metadati di rete prima di risolvere id sconosciuti                                                                  |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che l'embedded runner usi il modello risolto                                         | Il provider ha bisogno di riscritture di trasporto ma usa comunque un trasporto core                                                          |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compat per modelli vendor dietro un altro trasporto compatibile                          | Il provider riconosce i propri modelli su trasporti proxy senza prendere in carico il provider                                                |
| 15  | `capabilities`                    | Metadati di trascrizione/tooling posseduti dal provider usati dalla logica condivisa del core                 | Il provider ha bisogno di particolarità di trascrizione/famiglia di provider                                                                  |
| 16  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che l'embedded runner li veda                                     | Il provider ha bisogno di pulizia degli schemi della famiglia di trasporto                                                                    |
| 17  | `inspectToolSchemas`              | Espone diagnostica degli schemi posseduta dal provider dopo la normalizzazione                                | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                                 |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del ragionamento native vs taggato                                           | Il provider ha bisogno di output di ragionamento/finale taggato invece di campi nativi                                                        |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici delle opzioni di stream                 | Il provider ha bisogno di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                          |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                       | Il provider ha bisogno di un protocollo wire personalizzato, non solo di un wrapper                                                           |
| 21  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                 | Il provider ha bisogno di wrapper di compat per header/body/modello della richiesta senza un trasporto personalizzato                         |
| 22  | `resolveTransportTurnState`       | Collega header o metadati nativi per turno del trasporto                                                      | Il provider vuole che i trasporti generici inviino l'identità del turno nativa del provider                                                   |
| 23  | `resolveWebSocketSessionPolicy`   | Collega header WebSocket nativi o policy di cool-down della sessione                                          | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                                |
| 24  | `formatApiKey`                    | Formattatore del profilo di autenticazione: il profilo memorizzato diventa la stringa runtime `apiKey`       | Il provider memorizza metadati di autenticazione aggiuntivi e ha bisogno di una forma token runtime personalizzata                            |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di fallimento del refresh          | Il provider non si adatta ai refresher condivisi `pi-ai`                                                                                       |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                         | Il provider ha bisogno di una guida alla riparazione dell'autenticazione posseduta dal provider dopo un fallimento di refresh                 |
| 27  | `matchesContextOverflowError`     | Matcher dell'overflow della finestra di contesto posseduto dal provider                                       | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                           |
| 28  | `classifyFailoverReason`          | Classificazione del motivo di failover posseduta dal provider                                                 | Il provider può mappare errori raw di API/trasporto a rate-limit/sovraccarico/ecc.                                                            |
| 29  | `isCacheTtlEligible`              | Policy prompt-cache per provider proxy/backhaul                                                               | Il provider ha bisogno di gating TTL della cache specifico per proxy                                                                           |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero in caso di autenticazione mancante                            | Il provider ha bisogno di un suggerimento di recupero per autenticazione mancante specifico del provider                                      |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più suggerimento di errore facoltativo rivolto all'utente          | Il provider ha bisogno di nascondere righe upstream obsolete o sostituirle con un suggerimento vendor                                         |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo la discovery                                                | Il provider ha bisogno di righe sintetiche forward-compat in `models list` e nei picker                                                       |
| 33  | `resolveThinkingProfile`          | Insieme di livelli `/think`, etichette di visualizzazione e valore predefinito specifici del modello         | Il provider espone una scala di ragionamento personalizzata o un'etichetta binaria per modelli selezionati                                    |
| 34  | `isBinaryThinking`                | Hook di compatibilità per il toggle di ragionamento on/off                                                    | Il provider espone solo il ragionamento binario on/off                                                                                         |
| 35  | `supportsXHighThinking`           | Hook di compatibilità per il supporto al ragionamento `xhigh`                                                 | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                   |
| 36  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                     | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                               |
| 37  | `isModernModelRef`                | Matcher del modello moderno per filtri del profilo live e selezione smoke                                      | Il provider possiede la corrispondenza del modello preferito live/smoke                                                                      |
| 38  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/la chiave runtime effettivi subito prima dell'inferenza      | Il provider ha bisogno di uno scambio token o di una credenziale di richiesta a breve durata                                                 |
| 39  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e superfici di stato correlate                   | Il provider ha bisogno di parsing personalizzato del token di utilizzo/quota o di una diversa credenziale di utilizzo                        |
| 40  | `fetchUsageSnapshot`              | Recupera e normalizza istantanee di utilizzo/quota specifiche del provider dopo che l'autenticazione è stata risolta | Il provider ha bisogno di un endpoint di utilizzo o di un parser di payload specifici del provider                                   |
| 41  | `createEmbeddingProvider`         | Costruisce un adapter embedding posseduto dal provider per memoria/ricerca                                     | Il comportamento embedding della memoria appartiene al plugin provider                                                                        |
| 42  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione delle trascrizioni per il provider                 | Il provider ha bisogno di una policy di trascrizione personalizzata (per esempio, rimozione dei blocchi di ragionamento)                    |
| 43  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                  | Il provider ha bisogno di riscritture di replay specifiche del provider oltre agli helper condivisi di Compaction                           |
| 44  | `validateReplayTurns`             | Validazione finale o rimodellamento dei turni di replay prima dell'embedded runner                             | Il trasporto del provider ha bisogno di una validazione dei turni più rigorosa dopo la sanificazione generica                               |
| 45  | `onModelSelected`                 | Esegue effetti collaterali post-selezione posseduti dal provider                                              | Il provider ha bisogno di telemetria o stato posseduto dal provider quando un modello diventa attivo                                        |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider capaci di hook
finché uno non cambia effettivamente l'id modello o il trasporto/configurazione. Questo mantiene funzionanti gli shim alias/compat del provider senza richiedere al chiamante di sapere quale plugin incluso possiede la riscrittura. Se nessun hook provider riscrive una voce supportata di configurazione della famiglia Google, il normalizzatore di configurazione Google incluso applica comunque quella pulizia di compatibilità.

Se il provider ha bisogno di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato, si tratta di una classe diversa di estensione. Questi hook servono per il comportamento del provider che viene comunque eseguito nel normale loop di inferenza di OpenClaw.

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

I plugin provider inclusi usano gli hook sopra in combinazioni adattate alle esigenze di
catalogo, autenticazione, ragionamento, replay e tracciamento dell'uso di ciascun
vendor. L'insieme esatto di hook per provider vive con il sorgente del plugin sotto `extensions/`; consideralo come l'elenco autorevole invece di duplicarlo qui.

Pattern illustrativi:

- **Provider di catalogo pass-through** (OpenRouter, Kilocode, Z.AI, xAI) registrano
  `catalog` più `resolveDynamicModel`/`prepareDynamicModel` così possono esporre
  id di modelli upstream prima del catalogo statico di OpenClaw.
- **Provider con OAuth + endpoint di utilizzo** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai) accoppiano `prepareRuntimeAuth` o `formatApiKey`
  con `resolveUsageAuth` + `fetchUsageSnapshot` per possedere lo scambio token e
  l'integrazione `/usage`.
- **Pulizia di replay / trascrizione** è condivisa tramite famiglie nominate:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. I provider aderiscono tramite `buildReplayPolicy`
  invece di implementare ciascuno la pulizia della trascrizione.
- **Provider inclusi solo catalogo** (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) registrano solo `catalog` e usano
  il loop di inferenza condiviso.
- **Helper di stream specifici di Anthropic** (header beta, `/fast`/`serviceTier`,
  `context1m`) vivono nella seam pubblica `api.ts` /
  `contract-api.ts` del plugin Anthropic incluso (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che nello
  SDK generico.

## Helper runtime

I plugin possono accedere a helper core selezionati tramite `api.runtime`. Per TTS:

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
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per voice picker o flussi di setup posseduti dal vendor.
- Gli elenchi delle voci possono includere metadati più ricchi come locale, genere e tag di personalità per picker consapevoli del provider.
- OpenAI e ElevenLabs oggi supportano la telefonia. Microsoft no.

I plugin possono anche registrare provider speech tramite `api.registerSpeechProvider(...)`.

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

- Mantieni nel core la policy TTS, il fallback e la consegna della risposta.
- Usa i provider speech per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato all'id provider `microsoft`.
- Il modello di ownership preferito è orientato all'azienda: un solo plugin vendor può possedere
  provider di testo, speech, immagini e futuri media man mano che OpenClaw aggiunge quei
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un unico provider
tipizzato media-understanding invece di un contenitore generico chiave/valore:

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

- Mantieni nel core orchestrazione, fallback, configurazione e wiring del canale.
- Mantieni il comportamento del vendor nel plugin provider.
- L'espansione additiva dovrebbe restare tipizzata: nuovi metodi facoltativi, nuovi campi
  di risultato facoltativi, nuove capacità facoltative.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capacità e l'helper runtime
  - i plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime media-understanding, i plugin possono chiamare:

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

Per la trascrizione audio, i plugin possono usare sia il runtime media-understanding
sia l'alias STT più vecchio:

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
- Restituisce `{ text: undefined }` quando non viene prodotto output di trascrizione (per esempio input saltato/non supportato).
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

- `provider` e `model` sono override facoltativi per esecuzione, non modifiche persistenti della sessione.
- OpenClaw onora quei campi di override solo per chiamanti attendibili.
- Per le esecuzioni di fallback possedute dal plugin, gli operatori devono aderire esplicitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin attendibili a destinazioni canoniche specifiche `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi destinazione.
- Le esecuzioni di sottoagente di plugin non attendibili continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente nel fallback.

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

I plugin possono anche registrare provider web-search tramite
`api.registerWebSearchProvider(...)`.

Note:

- Mantieni nel core la selezione del provider, la risoluzione delle credenziali e la semantica condivisa delle richieste.
- Usa i provider web-search per trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i plugin di funzionalità/canale che hanno bisogno del comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

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
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capacità.

## Route HTTP Gateway

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
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione del gateway, oppure `"plugin"` per autenticazione/verifica webhook gestite dal plugin.
- `match`: facoltativo. `"exact"` (predefinito) oppure `"prefix"`.
- `replaceExisting`: facoltativo. Permette allo stesso plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo sullo stesso livello di autenticazione.
- Le route `auth: "plugin"` **non** ricevono automaticamente ambiti runtime operatore. Sono per webhook/verifica firma gestiti dal plugin, non per chiamate helper Gateway privilegiate.
- Le route `auth: "gateway"` vengono eseguite dentro un ambito runtime di richiesta Gateway, ma quell'ambito è intenzionalmente conservativo:
  - l'autenticazione bearer a secret condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli ambiti runtime delle route plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili con identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente su quelle richieste di route plugin con identità, l'ambito runtime torna in fallback a `operator.write`
- Regola pratica: non assumere che una route plugin autenticata dal gateway sia una superficie admin implicita. Se la tua route ha bisogno di comportamento solo admin, richiedi una modalità di autenticazione con identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di importazione Plugin SDK

Usa sottopercorsi SDK ristretti invece del barrel root monolitico `openclaw/plugin-sdk`
quando scrivi nuovi plugin. Sottopercorsi core:

| Sottopercorso                        | Scopo                                              |
| ------------------------------------ | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`   | Primitive di registrazione del plugin              |
| `openclaw/plugin-sdk/core`           | Contratto generico condiviso esposto al plugin     |
| `openclaw/plugin-sdk/config-schema`  | Schema Zod root di `openclaw.json` (`OpenClawSchema`) |

I plugin di canale scelgono da una famiglia di seam ristrette — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolarsi tra campi plugin non correlati.
Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e di configurazione vivono sotto sottopercorsi `*-runtime`
corrispondenti (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, ecc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` è deprecato — uno shim di compatibilità per
plugin più vecchi. Il nuovo codice dovrebbe importare primitive generiche più ristrette.
</Info>

Punti di ingresso interni al repo (per root di package di ciascun plugin incluso):

- `index.js` — entry del plugin incluso
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — entry del plugin di setup

I plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` di un altro package plugin dal core o da un altro plugin.
I punti di ingresso caricati tramite facade preferiscono lo snapshot attivo della config runtime quando esiste, poi tornano in fallback al file di configurazione risolto su disco.

I sottopercorsi specifici della capacità come `image-generation`, `media-understanding`
e `speech` esistono perché oggi i plugin inclusi li usano. Non sono automaticamente contratti esterni congelati a lungo termine — controlla la relativa pagina di riferimento SDK quando fai affidamento su di essi.

## Schemi dello strumento message

I plugin dovrebbero possedere i contributi di schema `describeMessageTool(...)` specifici del canale
per primitive non di messaggio come reazioni, letture e poll.
La presentazione send condivisa dovrebbe usare il contratto generico `MessagePresentation`
invece di campi nativi del provider per button, component, block o card.
Vedi [Message Presentation](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura del provider e la checklist per l'autore del plugin.

I plugin capaci di invio dichiarano ciò che possono renderizzare tramite capacità di messaggio:

- `presentation` per blocchi di presentazione semantica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare la presentazione in modo nativo o degradarla a testo.
Non esporre vie di fuga UI native del provider dallo strumento generico message.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i
plugin di terze parti esistenti, ma i nuovi plugin non dovrebbero usarli.

## Risoluzione della destinazione del canale

I plugin di canale dovrebbero possedere la semantica di destinazione specifica del canale. Mantieni generico l'host condiviso in uscita e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se una destinazione normalizzata
  debba essere trattata come `direct`, `group` o `channel` prima della lookup in directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione tipo id invece che alla ricerca in directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core ha bisogno di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un
  miss in directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione del percorso di sessione specifico del provider una volta risolta una destinazione.

Divisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca di peer/gruppi.
- Usa `looksLikeId` per controlli del tipo “tratta questo come un id di destinazione esplicito/nativo”.
- Usa `resolveTarget` per il fallback di normalizzazione specifico del provider, non per una
  ricerca ampia in directory.
- Mantieni id nativi del provider come chat id, thread id, JID, handle e room
  id dentro valori `target` o parametri specifici del provider, non in campi SDK generici.

## Directory supportate dalla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere questa logica nel
plugin e riutilizzare gli helper condivisi di
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale ha bisogno di peer/gruppi supportati dalla configurazione come:

- peer DM guidati da allowlist
- mappe di canali/gruppi configurate
- fallback statici di directory con scope per account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione dei limiti
- helper di deduplicazione/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione dell'account specifica del canale e la normalizzazione degli id dovrebbero restare
nell'implementazione del plugin.

## Cataloghi provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede id di modelli specifici del provider, valori predefiniti di base URL o metadati dei modelli protetti da autenticazione.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai
provider impliciti integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo altri provider impliciti

I provider successivi vincono in caso di collisione della chiave, quindi i plugin possono intenzionalmente sovrascrivere una voce provider integrata con lo stesso id provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se vengono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione del canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può assumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano secret richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/riparazione config
  non dovrebbero aver bisogno di materializzare credenziali runtime solo per descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituisci solo stato descrittivo dell'account.
- Conserva `enabled` e `configured`.
- Includi campi di sorgente/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire i valori raw dei token solo per segnalare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il corrispondente campo di sorgente)
  è sufficiente per comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso corrente del comando.

Questo permette ai comandi in sola lettura di riportare “configurato ma non disponibile in questo percorso del comando” invece di andare in crash o riportare erroneamente l'account come non configurato.

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

Ogni voce diventa un plugin. Se il pack elenca più estensioni, l'id del plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory così
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Barriera di sicurezza: ogni voce `openclaw.extensions` deve restare dentro la directory del plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del package vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (nessuno script di ciclo di vita, nessuna dipendenza dev a runtime). Mantieni gli alberi di dipendenze dei plugin “puro JS/TS” ed evita package che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo mantiene più leggeri avvio e setup
quando la tua entry principale del plugin collega anche strumenti, hook o altro codice solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far aderire un plugin di canale allo stesso percorso `setupEntry` durante la
fase di avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi a mettersi in ascolto. In pratica, questo significa che la setup entry
deve registrare ogni capacità posseduta dal canale da cui dipende l'avvio, come:

- la registrazione del canale stessa
- tutte le route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- tutti i metodi Gateway, strumenti o servizi che devono esistere durante quella stessa finestra

Se la tua entry completa possiede ancora una qualsiasi capacità richiesta all'avvio, non abilitare
questo flag. Mantieni il plugin sul comportamento predefinito e lascia che OpenClaw carichi
l'entry completa durante l'avvio.

I canali inclusi possono anche pubblicare helper della superficie contrattuale solo setup che il core
può consultare prima che il runtime completo del canale sia caricato. L'attuale
superficie di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale single-account
in `channels.<id>.accounts.*` senza caricare l'entry completa del plugin.
Matrix è l'esempio incluso attuale: sposta solo chiavi di auth/bootstrap in un
account promosso nominato quando esistono già account nominati, e può conservare una
chiave di account predefinito non canonica configurata invece di creare sempre
`accounts.default`.

Quegli adapter di patch del setup mantengono lazy la discovery della superficie contrattuale inclusa. Il tempo di importazione resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di rientrare nell'avvio del canale incluso all'importazione del modulo.

Quando quelle superfici di avvio includono metodi RPC Gateway, mantienili su un
prefisso specifico del plugin. I namespace admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
in `operator.admin`, anche se un plugin richiede un ambito più ristretto.

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
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo core privo di dati.

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
- `docsLabel`: sovrascrive il testo del link per il link alla documentazione
- `preferOver`: id di plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici che elencano i canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai picker interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: fa aderire il canale al flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede un binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la lookup della sessione durante la risoluzione delle destinazioni di announce

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio un export di
registry MPM). Inserisci un file JSON in uno di questi percorsi:

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

Usalo quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita invece di aggiungere semplicemente ricerca in memoria o hook.

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

## Aggiungere una nuova capacità

Quando un plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema di plugin con un accesso privato. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definire il contratto core
   Decidi quale comportamento condiviso dovrebbe possedere il core: policy, fallback, merge della config,
   ciclo di vita, semantica esposta ai canali e forma dell'helper runtime.
2. aggiungere superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la superficie tipizzata della capacità più piccola ma utile.
3. collegare core + consumer di canale/funzionalità
   I plugin di canale e funzionalità dovrebbero consumare la nuova capacità tramite il core,
   non importando direttamente un'implementazione vendor.
4. registrare implementazioni vendor
   I plugin vendor registrano poi i propri backend contro la capacità.
5. aggiungere copertura contrattuale
   Aggiungi test così ownership e forma della registrazione restino esplicite nel tempo.

È così che OpenClaw resta opinionato senza diventare hardcoded sul punto di vista di un
provider. Vedi il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist della capacità

Quando aggiungi una nuova capacità, l'implementazione dovrebbe di solito toccare insieme queste
superfici:

- tipi di contratto core in `src/<capability>/types.ts`
- helper core runner/runtime in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API plugin in `src/plugins/types.ts`
- wiring del registry dei plugin in `src/plugins/registry.ts`
- esposizione runtime del plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale
  devono consumarla
- helper di cattura/test in `src/test-utils/plugin-registration.ts`
- asserzioni di ownership/contratto in `src/plugins/contracts/registry.ts`
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

Pattern di test di contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto della capacità + l'orchestrazione
- i plugin vendor possiedono le implementazioni del vendor
- i plugin di funzionalità/canale consumano gli helper runtime
- i test di contratto mantengono esplicita l'ownership
