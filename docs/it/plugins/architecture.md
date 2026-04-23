---
read_when:
    - Creazione o debug dei plugin nativi di OpenClaw
    - Comprendere il modello di capacità del plugin o i confini di proprietà
    - Lavorare sulla pipeline di caricamento o sul registro del plugin
    - Implementazione di hook di runtime del provider o di plugin di canale
sidebarTitle: Internals
summary: 'Interni del Plugin: modello di capacità, proprietà, contratti, pipeline di caricamento e helper di runtime'
title: Interni del Plugin
x-i18n:
    generated_at: "2026-04-23T13:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Interni del Plugin

<Info>
  Questo è il **riferimento di architettura approfondito**. Per guide pratiche, vedi:
  - [Installare e usare i plugin](/it/tools/plugin) — guida per l'utente
  - [Per iniziare](/it/plugins/building-plugins) — primo tutorial sui plugin
  - [Plugin di canale](/it/plugins/sdk-channel-plugins) — creare un canale di messaggistica
  - [Plugin provider](/it/plugins/sdk-provider-plugins) — creare un provider di modelli
  - [Panoramica dell'SDK](/it/plugins/sdk-overview) — mappa degli import e API di registrazione
</Info>

Questa pagina descrive l'architettura interna del sistema di plugin di OpenClaw.

## Modello di capacità pubblico

Le capacità sono il modello pubblico dei **plugin nativi** all'interno di OpenClaw. Ogni
plugin nativo di OpenClaw si registra rispetto a uno o più tipi di capacità:

| Capacità               | Metodo di registrazione                           | Plugin di esempio                    |
| ---------------------- | ------------------------------------------------- | ------------------------------------ |
| Inferenza testuale     | `api.registerProvider(...)`                       | `openai`, `anthropic`                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Voce                   | `api.registerSpeechProvider(...)`                 | `elevenlabs`, `microsoft`            |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`          | `openai`                             |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`     | `openai`, `google`                   |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generazione di musica  | `api.registerMusicGenerationProvider(...)`        | `google`, `minimax`                  |
| Generazione di video   | `api.registerVideoGenerationProvider(...)`        | `qwen`                               |
| Recupero web           | `api.registerWebFetchProvider(...)`               | `firecrawl`                          |
| Ricerca web            | `api.registerWebSearchProvider(...)`              | `google`                             |
| Canale / messaggistica | `api.registerChannel(...)`                        | `msteams`, `matrix`                  |

Un plugin che registra zero capacità ma fornisce hook, strumenti o
servizi è un plugin **legacy solo hook**. Questo pattern è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello di capacità è stato integrato nel core ed è usato oggi dai plugin
bundled/nativi, ma la compatibilità dei plugin esterni richiede ancora una soglia
più rigorosa di "è esportato, quindi è congelato".

Indicazioni attuali:

- **plugin esterni esistenti:** mantenere funzionanti le integrazioni basate su hook; trattare
  questo come riferimento di compatibilità
- **nuovi plugin bundled/nativi:** preferire la registrazione esplicita delle capacità invece di
  agganci specifici del fornitore o nuovi design solo hook
- **plugin esterni che adottano la registrazione delle capacità:** consentito, ma trattare le
  superfici helper specifiche della capacità come in evoluzione salvo quando la documentazione segna esplicitamente un
  contratto come stabile

Regola pratica:

- le API di registrazione delle capacità sono la direzione prevista
- gli hook legacy restano il percorso più sicuro per evitare rotture dei plugin esterni durante
  la transizione
- i sottopercorsi helper esportati non sono tutti equivalenti; preferire il
  contratto ristretto documentato, non esportazioni helper incidentali

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma in base al suo effettivo
comportamento di registrazione (non solo ai metadati statici):

- **plain-capability** -- registra esattamente un tipo di capacità (per esempio un
  plugin solo provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capacità (per esempio
  `openai` possiede inferenza testuale, voce, comprensione dei media e
  generazione di immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), senza capacità,
  strumenti, comandi o servizi
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capacità

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e la
suddivisione delle capacità. Vedi [Riferimento CLI](/it/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` rimane supportato come percorso di compatibilità per i
plugin solo hook. I plugin legacy del mondo reale dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo che l'uso reale sarà diminuito e la copertura delle fixture dimostrerà la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configurazione viene analizzata correttamente e i plugin vengono risolti |
| **compatibility advisory** | Il plugin usa un pattern supportato ma meno recente (ad es. `hook-only`) |
| **legacy warning**        | Il plugin usa `before_agent_start`, che è deprecato         |
| **hard error**            | La configurazione non è valida oppure il plugin non è riuscito a caricarsi |

Né `hook-only` né `before_agent_start` interromperanno il tuo plugin oggi --
`hook-only` è solo informativo, e `before_agent_start` genera soltanto un avviso. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

1. **Manifest + individuazione**
   OpenClaw trova i plugin candidati dai percorsi configurati, dalle radici del workspace,
   dalle radici globali dei plugin e dai plugin bundled. L'individuazione legge prima i manifest nativi
   `openclaw.plugin.json` e i manifest dei bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un plugin individuato è abilitato, disabilitato, bloccato oppure
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento di runtime**
   I plugin nativi di OpenClaw vengono caricati in-process tramite jiti e registrano
   capacità in un registro centrale. I bundle compatibili vengono normalizzati in
   record di registro senza importare codice di runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione del provider,
   hook, route HTTP, comandi CLI e servizi.

Per la CLI dei plugin in particolare, l'individuazione del comando root è suddivisa in due fasi:

- i metadati al momento del parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può rimanere lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI di proprietà del plugin all'interno del plugin, consentendo comunque a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine di progettazione importante:

- l'individuazione e la validazione della configurazione dovrebbero funzionare da **metadati di manifest/schema**
  senza eseguire il codice del plugin
- il comportamento di runtime nativo deriva dal percorso `register(api)` del modulo del plugin

Questa separazione consente a OpenClaw di validare la configurazione, spiegare i plugin mancanti/disabilitati e
costruire suggerimenti per UI/schema prima che il runtime completo sia attivo.

### Plugin di canale e strumento di messaggio condiviso

I plugin di canale non devono registrare uno strumento separato per inviare/modificare/reagire per
le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e
i plugin di canale possiedono al suo interno l'individuazione e l'esecuzione specifiche del canale.

Il confine attuale è:

- il core possiede l'host dello strumento `message` condiviso, il wiring del prompt, la
  gestione di sessione/thread e il dispatch dell'esecuzione
- i plugin di canale possiedono l'individuazione delle azioni con scope, l'individuazione delle capacità e qualsiasi
  frammento di schema specifico del canale
- i plugin di canale possiedono la grammatica della conversazione di sessione specifica del provider, ad esempio
  il modo in cui gli ID di conversazione codificano gli ID dei thread o ereditano dalle conversazioni padre
- i plugin di canale eseguono l'azione finale tramite il loro adapter di azione

Per i plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di individuazione unificata
consente a un plugin di restituire insieme le sue azioni visibili, le capacità e i contributi allo schema,
così questi elementi non si disallineano.

Quando un parametro dello strumento message specifico del canale contiene una sorgente multimediale come un
percorso locale o un URL di media remoto, il plugin dovrebbe anche restituire
`mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito
per applicare la normalizzazione dei percorsi sandbox e i suggerimenti di accesso ai media in uscita
senza codificare in modo rigido nomi di parametri di proprietà del plugin.
Preferisci mappe con scope dell'azione, non un unico elenco piatto a livello di canale, in modo che un
parametro media solo profilo non venga normalizzato su azioni non correlate come
`send`.

Il core passa lo scope di runtime in questo passaggio di individuazione. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound attendibile

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre
azioni di messaggio in base all'account attivo, alla stanza/thread/messaggio corrente o
all'identità attendibile del richiedente, senza codificare in modo rigido rami specifici del canale nello
strumento `message` del core.

Per questo le modifiche al routing dell'embedded-runner sono ancora lavoro del plugin: il runner è
responsabile dell'inoltro dell'identità corrente di chat/sessione al confine di
individuazione del plugin, così lo strumento `message` condiviso espone la giusta
superficie di proprietà del canale per il turno corrente.

Per gli helper di esecuzione di proprietà del canale, i plugin bundled dovrebbero mantenere il runtime di esecuzione
all'interno dei propri moduli extension. Il core non possiede più i runtime delle azioni di messaggio di Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i plugin bundled
dovrebbero importare direttamente il proprio codice di runtime locale dai propri
moduli di proprietà dell'extension.

Lo stesso confine si applica in generale ai seam SDK con nome del provider: il core non dovrebbe
importare barrel di convenienza specifici del canale per extension Slack, Discord, Signal,
WhatsApp o simili. Se il core ha bisogno di un comportamento, deve o consumare il
barrel `api.ts` / `runtime-api.ts` del plugin bundled stesso oppure promuovere l'esigenza
a una capacità generica ristretta nell'SDK condiviso.

Per i sondaggi in particolare, esistono due percorsi di esecuzione:

- `outbound.sendPoll` è la base condivisa per i canali che si adattano al modello comune di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per semantiche di sondaggio specifiche del canale o parametri di sondaggio extra

Il core ora rinvia il parsing condiviso dei sondaggi fino a dopo che il dispatch del sondaggio del plugin rifiuta
l'azione, così i gestori di sondaggi di proprietà del plugin possono accettare campi di sondaggio specifici del canale
senza essere prima bloccati dal parser generico dei sondaggi.

Vedi [Pipeline di caricamento](#load-pipeline) per la sequenza completa di avvio.

## Modello di proprietà delle capacità

OpenClaw tratta un plugin nativo come il confine di proprietà per una **azienda** o una
**funzionalità**, non come un contenitore di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe di norma possedere tutte le superfici OpenClaw rivolte a quell'azienda
- un plugin di funzionalità dovrebbe di norma possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità condivise del core invece di reimplementare in modo ad hoc il comportamento del provider

Esempi:

- il plugin bundled `openai` possiede il comportamento del provider di modelli OpenAI e il comportamento OpenAI per
  voce + voce in tempo reale + comprensione dei media + generazione di immagini
- il plugin bundled `elevenlabs` possiede il comportamento vocale di ElevenLabs
- il plugin bundled `microsoft` possiede il comportamento vocale di Microsoft
- il plugin bundled `google` possiede il comportamento del provider di modelli Google più il comportamento Google per
  comprensione dei media + generazione di immagini + ricerca web
- il plugin bundled `firecrawl` possiede il comportamento di recupero web di Firecrawl
- i plugin bundled `minimax`, `mistral`, `moonshot` e `zai` possiedono i loro
  backend di comprensione dei media
- il plugin bundled `qwen` possiede il comportamento del provider testuale Qwen più il
  comportamento di comprensione dei media e generazione video
- il plugin `voice-call` è un plugin di funzionalità: possiede il trasporto di chiamata, gli strumenti,
  la CLI, le route e il bridging dei flussi media di Twilio, ma consuma le capacità condivise di voce
  più trascrizione in tempo reale e voce in tempo reale invece di
  importare direttamente i plugin del fornitore

Lo stato finale previsto è:

- OpenAI vive in un unico plugin anche se copre modelli testuali, voce, immagini e
  futuro video
- un altro fornitore può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale plugin del fornitore possieda il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di proprietà
- **capability** = contratto del core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
"quale provider dovrebbe codificare rigidamente la gestione del video?" La prima domanda è "qual è
il contratto della capacità video del core?" Una volta che quel contratto esiste, i plugin del fornitore
possono registrarsi rispetto ad esso e i plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa giusta di solito è:

1. definire la capacità mancante nel core
2. esporla attraverso l'API/il runtime del plugin in modo tipizzato
3. collegare canali/funzionalità a quella capacità
4. lasciare che i plugin del fornitore registrino implementazioni

Questo mantiene esplicita la proprietà evitando al tempo stesso un comportamento del core che dipende da un
singolo fornitore o da un percorso di codice specifico di un plugin isolato.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove deve stare il codice:

- **livello di capacità del core**: orchestrazione condivisa, policy, fallback, regole di
  unione della configurazione, semantica di consegna e contratti tipizzati
- **livello del plugin del fornitore**: API specifiche del fornitore, autenticazione, cataloghi di modelli, sintesi vocale,
  generazione di immagini, futuri backend video, endpoint di utilizzo
- **livello del plugin di canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma le capacità del core e le presenta su una superficie

Per esempio, TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e la consegna sul canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper di runtime TTS per la telefonia

Lo stesso schema dovrebbe essere preferito per le capacità future.

### Esempio di plugin aziendale multi-capacità

Un plugin aziendale dovrebbe apparire coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, voce, trascrizione in tempo reale, voce in tempo reale, comprensione dei media,
generazione di immagini, generazione video, recupero web e ricerca web,
un fornitore può possedere tutte le sue superfici in un solo posto:

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
      // configurazione vocale del fornitore — implementa direttamente l'interfaccia SpeechProviderPlugin
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

- un solo plugin possiede la superficie del fornitore
- il core continua a possedere i contratti di capacità
- i canali e i plugin di funzionalità consumano gli helper `api.runtime.*`, non il codice del fornitore
- i test di contratto possono verificare che il plugin abbia registrato le capacità che
  afferma di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come una sola
capacità condivisa. Lo stesso modello di proprietà si applica anche qui:

1. il core definisce il contratto di comprensione dei media
2. i plugin del fornitore registrano `describeImage`, `transcribeAudio` e
   `describeVideo` a seconda dei casi
3. i canali e i plugin di funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice del fornitore

Questo evita di incorporare nel core le assunzioni video di un singolo provider. Il plugin possiede
la superficie del fornitore; il core possiede il contratto di capacità e il comportamento di fallback.

La generazione video usa già la stessa sequenza: il core possiede il contratto di
capacità tipizzato e l'helper di runtime, e i plugin del fornitore registrano
implementazioni `api.registerVideoGenerationProvider(...)` rispetto ad esso.

Ti serve una checklist concreta di rollout? Vedi
[Cookbook delle capacità](/it/plugins/architecture).

## Contratti e applicazione

La superficie API dei plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e
gli helper di runtime su cui un plugin può fare affidamento.

Perché questo è importante:

- gli autori dei plugin ottengono un unico standard interno stabile
- il core può rifiutare proprietà duplicate, come due plugin che registrano lo stesso
  ID provider
- l'avvio può mostrare diagnostiche utili per registrazioni malformate
- i test di contratto possono imporre la proprietà dei plugin bundled ed evitare derive silenziose

Esistono due livelli di applicazione:

1. **applicazione della registrazione a runtime**
   Il registro dei plugin valida le registrazioni mentre i plugin vengono caricati. Esempi:
   ID provider duplicati, ID provider vocali duplicati e registrazioni
   malformate producono diagnostiche del plugin invece di comportamento indefinito.
2. **test di contratto**
   I plugin bundled vengono acquisiti nei registri di contratto durante l'esecuzione dei test in modo che
   OpenClaw possa verificare esplicitamente la proprietà. Oggi questo viene usato per i
   provider di modelli, i provider vocali, i provider di ricerca web e la proprietà di registrazione bundled.

L'effetto pratico è che OpenClaw sa, in anticipo, quale plugin possiede quale
superficie. Questo consente al core e ai canali di comporsi senza attriti perché la proprietà è
dichiarata, tipizzata e verificabile invece che implicita.

### Cosa appartiene a un contratto

I buoni contratti dei plugin sono:

- tipizzati
- piccoli
- specifici per capacità
- posseduti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del fornitore

I cattivi contratti dei plugin sono:

- policy specifiche del fornitore nascoste nel core
- vie di fuga una tantum per plugin che aggirano il registro
- codice di canale che raggiunge direttamente un'implementazione del fornitore
- oggetti di runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi
lascia che i plugin vi si colleghino.

## Modello di esecuzione

I plugin nativi di OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono
isolati. Un plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del
codice core.

Implicazioni:

- un plugin nativo può registrare strumenti, gestori di rete, hook e servizi
- un bug in un plugin nativo può mandare in crash o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione di codice arbitrario all'interno del
  processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa principalmente
Skills bundled.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non bundled. Tratta
i plugin del workspace come codice di sviluppo, non come impostazioni predefinite di produzione.

Per i nomi dei pacchetti del workspace bundled, mantieni l'ID del plugin ancorato al nome
npm: `@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo di plugin più ristretto.

Nota importante sulla fiducia:

- `plugins.allow` si fida degli **ID dei plugin**, non della provenienza della sorgente.
- Un plugin del workspace con lo stesso ID di un plugin bundled oscura intenzionalmente
  la copia bundled quando quel plugin del workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.
- La fiducia nel plugin bundled viene risolta dallo snapshot della sorgente — il manifest e il
  codice su disco al momento del caricamento — piuttosto che dai metadati di installazione. Un record di installazione
  corrotto o sostituito non può ampliare silenziosamente la superficie di fiducia di un plugin bundled
  oltre ciò che la sorgente effettiva dichiara.

## Confine di esportazione

OpenClaw esporta capacità, non praticità di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni di helper non contrattuali:

- sottopercorsi helper specifici dei plugin bundled
- sottopercorsi di plumbing runtime non pensati come API pubblica
- helper di convenienza specifici del fornitore
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei plugin bundled rimangono ancora nella mappa di esportazione
SDK generata per compatibilità e manutenzione dei plugin bundled. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diversi seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come pattern SDK raccomandato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw fa più o meno questo:

1. individua le radici candidate dei plugin
2. legge i manifest nativi o dei bundle compatibili e i metadati del pacchetto
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ciascun candidato
6. carica i moduli nativi abilitati: i moduli bundled compilati usano un loader nativo;
   i plugin nativi non compilati usano jiti
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registro dei plugin
8. espone il registro ai comandi e alle superfici di runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve quello che è presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin bundled usano `register`; per i nuovi plugin preferisci `register`.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione a runtime. I candidati vengono bloccati
quando l'entry esce dalla radice del plugin, il percorso è scrivibile da chiunque, oppure la
proprietà del percorso appare sospetta per i plugin non bundled.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- individuare canali/Skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del plugin

Per i plugin nativi, il modulo di runtime è la parte data-plane. Registra il
comportamento effettivo come hook, strumenti, comandi o flussi del provider.

I blocchi facoltativi `activation` e `setup` del manifest rimangono nel control plane.
Sono descrittori solo metadati per la pianificazione dell'attivazione e l'individuazione del setup;
non sostituiscono la registrazione a runtime, `register(...)` o `setupEntry`.
I primi consumer dell'attivazione live ora usano suggerimenti del manifest su comandi, canali e provider
per restringere il caricamento dei plugin prima di una materializzazione più ampia del registro:

- Il caricamento della CLI si restringe ai plugin che possiedono il comando principale richiesto
- la risoluzione del setup/plugin del canale si restringe ai plugin che possiedono l'ID
  del canale richiesto
- la risoluzione esplicita del setup/runtime del provider si restringe ai plugin che possiedono l'ID
  del provider richiesto

L'individuazione del setup ora preferisce ID posseduti dai descrittori come `setup.providers` e
`setup.cliBackends` per restringere i plugin candidati prima di ripiegare su
`setup-api` per i plugin che richiedono ancora hook di runtime al momento del setup. Se più di
un plugin individuato rivendica lo stesso ID normalizzato del provider di setup o del backend CLI,
la ricerca del setup rifiuta il proprietario ambiguo invece di affidarsi all'ordine di individuazione.

### Cosa memorizza in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati di individuazione
- dati del registro dei manifest
- registri dei plugin caricati

Queste cache riducono gli avvii intermittenti e l'overhead dei comandi ripetuti. È corretto
considerarle come cache prestazionali di breve durata, non come persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oppure
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre di cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello di registro

I plugin caricati non mutano direttamente globali casuali del core. Si registrano in un
registro centrale dei plugin.

Il registro tiene traccia di:

- record dei plugin (identità, sorgente, origine, stato, diagnostiche)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- gestori RPC del gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi di proprietà del plugin

Le funzionalità del core leggono quindi da quel registro invece di parlare direttamente con i moduli dei plugin.
Questo mantiene unidirezionale il caricamento:

- modulo del plugin -> registrazione nel registro
- runtime del core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core
ha bisogno di un solo punto di integrazione: "leggere il registro", non "gestire con casi speciali ogni modulo di plugin".

## Callback di binding della conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di binding
viene approvata o negata:

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
- `decision`: `"allow-once"`, `"allow-always"` oppure `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, il suggerimento di detach, l'ID del mittente e
  i metadati della conversazione

Questa callback è solo di notifica. Non cambia chi è autorizzato ad associare una
conversazione, e viene eseguita dopo il completamento della gestione dell'approvazione da parte del core.

## Hook di runtime del provider

I plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per una ricerca economica dell'autenticazione del provider tramite env
  prima del caricamento del runtime, `providerAuthAliases` per varianti del provider che condividono
  l'autenticazione, `channelEnvVars` per una ricerca economica dell'env/setup del canale prima del caricamento del runtime,
  più `providerAuthChoices` per etichette economiche di onboarding/scelta di autenticazione e
  metadati dei flag CLI prima del caricamento del runtime
- hook a tempo di configurazione: `catalog` / legacy `discovery` più `applyConfigDefaults`
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw continua a possedere il loop generico dell'agente, il failover, la gestione della trascrizione e
la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
richiedere un intero trasporto di inferenza personalizzato.

Usa il manifest `providerAuthEnvVars` quando il provider ha credenziali basate su env
che i percorsi generici di autenticazione/stato/selettore modelli devono vedere senza caricare il runtime del plugin.
Usa il manifest `providerAuthAliases` quando un ID provider deve riutilizzare
le variabili env di un altro ID provider, i profili di autenticazione, l'autenticazione supportata dalla configurazione e la scelta di onboarding della chiave API.
Usa il manifest `providerAuthChoices` quando le superfici CLI di onboarding/scelta di autenticazione
devono conoscere l'ID della scelta del provider, le etichette del gruppo e il semplice
collegamento di autenticazione con un solo flag senza caricare il runtime del provider. Mantieni il runtime del provider
`envVars` per suggerimenti rivolti agli operatori come etichette di onboarding o variabili di setup per
client-id/client-secret OAuth.

Usa il manifest `channelEnvVars` quando un canale ha autenticazione o setup guidati da env che
i fallback generici dell'env della shell, i controlli config/status o i prompt di setup devono vedere
senza caricare il runtime del canale.

### Ordine degli hook e utilizzo

Per i plugin di modelli/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna "Quando usarlo" è la guida rapida alla decisione.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`        | Il provider possiede un catalogo o valori predefiniti di URL di base                                                                        |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali di configurazione di proprietà del provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'env o dalla semantica della famiglia di modelli del provider         |
| --  | _(ricerca del modello built-in)_  | OpenClaw prova prima il normale percorso registro/catalogo                                                     | _(non è un hook del plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview degli ID modello prima della ricerca                                         | Il provider possiede la pulizia degli alias prima della risoluzione del modello canonico                                                    |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello         | Il provider possiede la pulizia del trasporto per ID provider personalizzati nella stessa famiglia di trasporto                            |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione del runtime/provider                               | Il provider ha bisogno di una pulizia della configurazione che dovrebbe stare con il plugin; gli helper bundled della famiglia Google fanno anche da backstop per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai provider di configurazione            | Il provider ha bisogno di correzioni dei metadati dell'uso dello streaming nativo guidate dall'endpoint                                    |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marker env per i provider di configurazione prima del caricamento dell'autenticazione di runtime | Il provider possiede la risoluzione della chiave API con marker env; anche `amazon-bedrock` ha qui un resolver built-in per i marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o supportata dalla configurazione senza persistere testo in chiaro   | Il provider può operare con un marker di credenziale sintetica/locale                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni di proprietà del provider; il valore predefinito di `persistence` è `runtime-only` per credenziali di proprietà CLI/app | Il provider riutilizza credenziali di autenticazione esterne senza persistere refresh token copiati; dichiara `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei placeholder sintetici di profilo memorizzati rispetto all'autenticazione supportata da env/config | Il provider memorizza profili placeholder sintetici che non dovrebbero avere la precedenza                                                 |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello di proprietà del provider non ancora presenti nel registro locale            | Il provider accetta ID modello upstream arbitrari                                                                                           |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider ha bisogno di metadati di rete prima di risolvere ID sconosciuti                                                               |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che l'embedded runner usi il modello risolto                                         | Il provider ha bisogno di riscritture del trasporto ma usa comunque un trasporto del core                                                  |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli del fornitore dietro un altro trasporto compatibile           | Il provider riconosce i propri modelli su trasporti proxy senza assumere il controllo del provider                                         |
| 15  | `capabilities`                    | Metadati di trascrizione/tooling di proprietà del provider usati dalla logica condivisa del core             | Il provider ha bisogno di peculiarità della trascrizione/famiglia del provider                                                              |
| 16  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che l'embedded runner li veda                                     | Il provider ha bisogno di pulizia dello schema della famiglia di trasporto                                                                  |
| 17  | `inspectToolSchemas`              | Espone diagnostiche di schema di proprietà del provider dopo la normalizzazione                               | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                              |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output di ragionamento nativo o tagged                                              | Il provider ha bisogno di output tagged di ragionamento/finale invece dei campi nativi                                                     |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di stream             | Il provider ha bisogno di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                       |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                       | Il provider ha bisogno di un protocollo wire personalizzato, non solo di un wrapper                                                        |
| 21  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                 | Il provider ha bisogno di wrapper di compatibilità per header/body/modello della richiesta senza un trasporto personalizzato               |
| 22  | `resolveTransportTurnState`       | Collega header o metadati di trasporto nativi per turno                                                       | Il provider vuole che i trasporti generici inviino l'identità del turno nativa del provider                                                |
| 23  | `resolveWebSocketSessionPolicy`   | Collega header WebSocket nativi o policy di cool-down della sessione                                          | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                             |
| 24  | `formatApiKey`                    | Formattatore del profilo di autenticazione: il profilo memorizzato diventa la stringa `apiKey` di runtime    | Il provider memorizza metadati di autenticazione extra e ha bisogno di una forma personalizzata del token di runtime                      |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy su errori di refresh               | Il provider non si adatta ai refresher condivisi `pi-ai`                                                                                    |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                         | Il provider ha bisogno di una guida di riparazione dell'autenticazione di proprietà del provider dopo il fallimento del refresh          |
| 27  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto di proprietà del provider                                      | Il provider ha errori grezzi di overflow che le euristiche generiche non rileverebbero                                                    |
| 28  | `classifyFailoverReason`          | Classificazione della ragione di failover di proprietà del provider                                           | Il provider può mappare errori grezzi di API/trasporto a rate-limit/sovraccarico/ecc.                                                      |
| 29  | `isCacheTtlEligible`              | Policy della cache dei prompt per provider proxy/backhaul                                                     | Il provider ha bisogno di gating TTL della cache specifico del proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per autenticazione mancante                                   | Il provider ha bisogno di un suggerimento di recupero per autenticazione mancante specifico del provider                                   |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più suggerimento di errore facoltativo rivolto all'utente          | Il provider ha bisogno di nascondere righe upstream obsolete o di sostituirle con un suggerimento del fornitore                           |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo l'individuazione                                            | Il provider ha bisogno di righe sintetiche di forward-compat in `models list` e nei selettori                                             |
| 33  | `resolveThinkingProfile`          | Impostazione del livello `/think` specifica del modello, etichette di visualizzazione e valore predefinito   | Il provider espone una scala di thinking personalizzata o un'etichetta binaria per modelli selezionati                                   |
| 34  | `isBinaryThinking`                | Hook di compatibilità per il toggle di ragionamento on/off                                                    | Il provider espone solo thinking binario acceso/spento                                                                                      |
| 35  | `supportsXHighThinking`           | Hook di compatibilità per il supporto al ragionamento `xhigh`                                                 | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                |
| 36  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                     | Il provider possiede la policy predefinita di `/think` per una famiglia di modelli                                                         |
| 37  | `isModernModelRef`                | Matcher di modelli moderni per filtri di profilo live e selezione smoke                                        | Il provider possiede il matching del modello preferito per live/smoke                                                                        |
| 38  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave reale di runtime subito prima dell'inferenza          | Il provider ha bisogno di uno scambio di token o di una credenziale di richiesta di breve durata                                            |
| 39  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e superfici di stato correlate                   | Il provider ha bisogno di parsing personalizzato del token di utilizzo/quota o di una credenziale di utilizzo diversa                      |
| 40  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo che l'autenticazione è risolta   | Il provider ha bisogno di un endpoint di utilizzo specifico del provider o di un parser di payload                                          |
| 41  | `createEmbeddingProvider`         | Costruisce un adapter di embedding di proprietà del provider per memoria/ricerca                               | Il comportamento degli embedding per la memoria appartiene al plugin del provider                                                            |
| 42  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                  | Il provider ha bisogno di una policy personalizzata per la trascrizione (per esempio, rimozione dei blocchi di thinking)                  |
| 43  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                   | Il provider ha bisogno di riscritture di replay specifiche del provider oltre agli helper condivisi di Compaction                         |
| 44  | `validateReplayTurns`             | Validazione finale o rimodellazione dei turni di replay prima dell'embedded runner                             | Il trasporto del provider ha bisogno di una validazione dei turni più rigorosa dopo la sanitizzazione generica                             |
| 45  | `onModelSelected`                 | Esegue effetti collaterali post-selezione di proprietà del provider                                            | Il provider ha bisogno di telemetria o stato di proprietà del provider quando un modello diventa attivo                                    |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano ad altri plugin provider capaci di hook
finché uno non modifica effettivamente l'ID del modello o il trasporto/la configurazione. Questo mantiene funzionanti gli shim di alias/provider compatibili senza richiedere che il chiamante sappia quale
plugin bundled possieda la riscrittura. Se nessun hook provider riscrive una voce di configurazione
supportata della famiglia Google, il normalizzatore di configurazione Google bundled applica comunque
quella pulizia di compatibilità.

Se il provider ha bisogno di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook sono per il comportamento del provider
che continua a essere eseguito sul normale loop di inferenza di OpenClaw.

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

I plugin provider bundled usano gli hook sopra in combinazioni adattate alle esigenze di
catalogo, autenticazione, thinking, replay e tracciamento dell'utilizzo di ciascun
fornitore. L'esatto insieme di hook per provider si trova con il codice sorgente del plugin sotto `extensions/`;
trattalo come elenco autorevole invece di duplicarlo qui.

Pattern illustrativi:

- **Provider di catalogo pass-through** (OpenRouter, Kilocode, Z.AI, xAI) registrano
  `catalog` più `resolveDynamicModel`/`prepareDynamicModel` in modo da poter esporre
  ID di modelli upstream prima del catalogo statico di OpenClaw.
- **Provider con OAuth + endpoint di utilizzo** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai) abbinano `prepareRuntimeAuth` o `formatApiKey`
  a `resolveUsageAuth` + `fetchUsageSnapshot` per possedere lo scambio del token e
  l'integrazione `/usage`.
- **Pulizia di replay / trascrizione** è condivisa tramite famiglie con nome:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. I provider vi aderiscono tramite `buildReplayPolicy`
  invece di implementare individualmente la pulizia della trascrizione.
- **Provider bundled solo catalogo** (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) registrano solo `catalog` e usano
  il loop di inferenza condiviso.
- **Helper di stream specifici di Anthropic** (header beta, `/fast`/`serviceTier`,
  `context1m`) vivono nel seam pubblico `api.ts` /
  `contract-api.ts` del plugin Anthropic bundled (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che nel
  SDK generico.

## Helper di runtime

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

- `textToSpeech` restituisce il normale payload di output TTS del core per superfici file/nota vocale.
- Usa la configurazione del core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I plugin devono fare resampling/codifica per i provider.
- `listVoices` è facoltativo per provider. Usalo per selettori vocali o flussi di setup di proprietà del fornitore.
- Gli elenchi di voci possono includere metadati più ricchi come locale, genere e tag di personalità per selettori consapevoli del provider.
- Oggi OpenAI ed ElevenLabs supportano la telefonia. Microsoft no.

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

- Mantieni la policy TTS, il fallback e la consegna della risposta nel core.
- Usa i provider vocali per il comportamento di sintesi di proprietà del fornitore.
- L'input legacy Microsoft `edge` viene normalizzato all'ID provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un plugin di un fornitore può possedere
  testo, voce, immagini e futuri provider media man mano che OpenClaw aggiunge quei
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un provider tipizzato
di media-understanding invece di una generica bag chiave/valore:

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

- Mantieni orchestrazione, fallback, configurazione e collegamento del canale nel core.
- Mantieni il comportamento del fornitore nel plugin provider.
- L'espansione additiva deve rimanere tipizzata: nuovi metodi opzionali, nuovi campi di risultato
  opzionali, nuove capacità opzionali.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capacità e l'helper di runtime
  - i plugin del fornitore registrano `api.registerVideoGenerationProvider(...)`
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
oppure l'alias STT più vecchio:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facoltativo quando il MIME non può essere inferito in modo affidabile:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per
  la comprensione di immagini/audio/video.
- Usa la configurazione audio del core media-understanding (`tools.media.audio`) e l'ordine di fallback del provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (per esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` rimane come alias di compatibilità.

I plugin possono anche avviare esecuzioni di sottoagenti in background tramite `api.runtime.subagent`:

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
- OpenClaw rispetta questi campi di override solo per i chiamanti attendibili.
- Per le esecuzioni di fallback di proprietà del plugin, gli operatori devono aderire esplicitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin attendibili a specifici target canonici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni di sottoagenti di plugin non attendibili continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente su un fallback.

Per la ricerca web, i plugin possono consumare l'helper di runtime condiviso invece di
raggiungere il wiring dello strumento dell'agente:

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
- Usa i provider di ricerca web per trasporti di ricerca specifici del fornitore.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per plugin di funzionalità/canale che hanno bisogno del comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

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

- `generate(...)`: genera un'immagine usando la catena configurata di provider di generazione immagini.
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
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione del gateway, oppure `"plugin"` per autenticazione/verifica webhook gestite dal plugin.
- `match`: facoltativo. `"exact"` (predefinito) oppure `"prefix"`.
- `replaceExisting`: facoltativo. Consente allo stesso plugin di sostituire una propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e provocherà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati salvo `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo sullo stesso livello di autenticazione.
- Le route `auth: "plugin"` **non** ricevono automaticamente scope di runtime dell'operatore. Sono per webhook/verifica firma gestiti dal plugin, non per chiamate helper del Gateway con privilegi.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope di runtime della richiesta Gateway, ma quello scope è intenzionalmente prudente:
  - l'autenticazione bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope di runtime delle route plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili con identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingress privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste di route plugin con identità, lo scope di runtime ricade su `operator.write`
- Regola pratica: non presumere che una route plugin con autenticazione gateway sia implicitamente una superficie admin. Se la tua route richiede comportamento solo admin, richiedi una modalità di autenticazione con identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import dell'SDK del plugin

Usa sottopercorsi SDK ristretti invece del barrel root monolitico `openclaw/plugin-sdk`
quando scrivi nuovi plugin. Sottopercorsi del core:

| Sottopercorso                       | Scopo                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive di registrazione del plugin              |
| `openclaw/plugin-sdk/channel-core`  | Helper di entry/build del canale                   |
| `openclaw/plugin-sdk/core`          | Helper condivisi generici e contratto ombrello     |
| `openclaw/plugin-sdk/config-schema` | Schema Zod della radice `openclaw.json` (`OpenClawSchema`) |

I plugin di canale scelgono da una famiglia di seam ristretti — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di essere mescolato tra campi
non correlati del plugin. Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper di runtime e configurazione si trovano sotto sottopercorsi `*-runtime`
corrispondenti (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, ecc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` è deprecato — uno shim di compatibilità per
plugin meno recenti. Il nuovo codice dovrebbe importare invece primitive generiche più ristrette.
</Info>

Punti di ingresso interni al repo (per root di pacchetto di ciascun plugin bundled):

- `index.js` — entry del plugin bundled
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — entry del plugin di setup

I plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` del pacchetto di un altro plugin dal core o da un altro plugin.
I punti di ingresso caricati tramite facade preferiscono lo snapshot attivo della configurazione di runtime quando esiste,
poi ripiegano sul file di configurazione risolto su disco.

Sottopercorsi specifici della capacità come `image-generation`, `media-understanding`
e `speech` esistono perché i plugin bundled li usano oggi. Non sono
automaticamente contratti esterni congelati a lungo termine — controlla la relativa pagina di
riferimento dell'SDK quando fai affidamento su di essi.

## Schemi dello strumento message

I plugin dovrebbero possedere i contributi di schema specifici del canale di `describeMessageTool(...)`
per primitive non-message come reazioni, letture e sondaggi.
La presentazione condivisa dell'invio dovrebbe usare il contratto generico `MessagePresentation`
invece di campi nativi del provider per pulsanti, componenti, blocchi o card.
Vedi [Message Presentation](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura del provider e la checklist per gli autori di plugin.

I plugin con capacità di invio dichiarano ciò che possono renderizzare tramite capacità del messaggio:

- `presentation` per blocchi di presentazione semantica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna con pin

Il core decide se renderizzare la presentazione in modo nativo o degradarla a testo.
Non esporre vie di fuga UI native del provider dallo strumento generico message.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i
plugin di terze parti esistenti, ma i nuovi plugin non dovrebbero usarli.

## Risoluzione del target del canale

I plugin di canale dovrebbero possedere la semantica del target specifica del canale. Mantieni generico
l'host condiviso outbound e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input debba saltare direttamente alla risoluzione tipo ID invece che alla ricerca in directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core ha bisogno di una risoluzione finale di proprietà del provider dopo la normalizzazione o dopo un
  mancato risultato nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta che un target è stato risolto.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima di
  cercare peer/gruppi.
- Usa `looksLikeId` per controlli del tipo "tratta questo come un ID target esplicito/nativo".
- Usa `resolveTarget` per fallback di normalizzazione specifico del provider, non per
  una ricerca ampia nella directory.
- Mantieni ID nativi del provider come chat ID, thread ID, JID, handle e room
  ID dentro i valori `target` o nei parametri specifici del provider, non in campi SDK generici.

## Directory supportate dalla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
plugin e riutilizzare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale ha bisogno di peer/gruppi supportati dalla configurazione come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici di directory con scope per account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtraggio delle query
- applicazione dei limiti
- helper di deduplica/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione dell'account e la normalizzazione dell'ID specifiche del canale dovrebbero rimanere nell'implementazione del
plugin.

## Cataloghi dei provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede ID di modelli specifici del provider, valori predefiniti di base URL
o metadati dei modelli protetti da autenticazione.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai
provider impliciti built-in di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione di chiave, quindi i plugin possono intenzionalmente sovrascrivere una
voce provider built-in con lo stesso ID provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione del canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso di runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano i secret richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi doctor/riparazione della configurazione
  non dovrebbero avere bisogno di materializzare credenziali di runtime solo per
  descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituire solo lo stato descrittivo dell'account.
- Preservare `enabled` e `configured`.
- Includere campi di origine/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori grezzi dei token solo per riportare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il campo di origine corrispondente)
  è sufficiente per comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di riportare "configurato ma non disponibile in questo percorso di comando"
invece di andare in crash o segnalare erroneamente l'account come non configurato.

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

Ogni entry diventa un plugin. Se il pack elenca più extension, l'ID del plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory in modo che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Protezione di sicurezza: ogni entry `openclaw.extensions` deve rimanere all'interno della directory del plugin
dopo la risoluzione dei symlink. Le entry che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (nessuno script lifecycle, nessuna dipendenza dev a runtime). Mantieni gli alberi di dipendenze del plugin
"in puro JS/TS" ed evita pacchetti che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo mantiene avvio e setup più leggeri
quando l'entry principale del plugin collega anche strumenti, hook o altro codice solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far aderire un plugin di canale allo stesso percorso `setupEntry` durante la fase di
avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, questo significa che l'entry di setup
deve registrare ogni capacità di proprietà del canale da cui l'avvio dipende, come:

- la registrazione del canale stessa
- qualsiasi route HTTP che deve essere disponibile prima che il gateway inizi ad ascoltare
- qualsiasi metodo gateway, strumento o servizio che deve esistere durante quella stessa finestra

Se la tua entry completa possiede ancora una qualsiasi capacità di avvio richiesta, non abilitare
questo flag. Mantieni il plugin sul comportamento predefinito e lascia che OpenClaw carichi la
entry completa durante l'avvio.

I canali bundled possono anche pubblicare helper di superficie contrattuale solo setup che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale superficie
di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando ha bisogno di promuovere una configurazione legacy di canale con singolo account
in `channels.<id>.accounts.*` senza caricare l'entry completa del plugin.
Matrix è l'esempio bundled attuale: sposta solo le chiavi di autenticazione/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare una
chiave di account predefinito configurata non canonica invece di creare sempre
`accounts.default`.

Quegli adapter patch di setup mantengono lazy l'individuazione della superficie contrattuale bundled. Il tempo
di import resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di
rientrare nell'avvio del canale bundled all'importazione del modulo.

Quando quelle superfici di avvio includono metodi RPC del gateway, mantienili su un
prefisso specifico del plugin. I namespace admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
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
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo del core privo di dati.

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

Campi `openclaw.channel` utili oltre all'esempio minimo:

- `detailLabel`: etichetta secondaria per superfici di catalogo/status più ricche
- `docsLabel`: sovrascrive il testo del link per il collegamento alla documentazione
- `preferOver`: ID di plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferire `exposure`
- `quickstartAllowFrom`: fa aderire il canale al flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede l'associazione esplicita dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca di sessione durante la risoluzione dei target di annuncio

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un'esportazione del
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

Usalo quando il tuo plugin ha bisogno di sostituire o estendere la pipeline di contesto predefinita
piuttosto che aggiungere soltanto ricerca nella memoria o hook.

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
il sistema di plugin con un accesso privato diretto. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definire il contratto del core
   Decidi quale comportamento condiviso dovrebbe possedere il core: policy, fallback, unione della configurazione,
   ciclo di vita, semantica rivolta ai canali e forma dell'helper di runtime.
2. aggiungere superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola superficie di capacità tipizzata
   utile.
3. collegare consumer del core + canale/funzionalità
   I canali e i plugin di funzionalità dovrebbero consumare la nuova capacità tramite il core,
   non importando direttamente un'implementazione del fornitore.
4. registrare implementazioni del fornitore
   I plugin del fornitore registrano poi i propri backend rispetto alla capacità.
5. aggiungere copertura di contratto
   Aggiungi test in modo che proprietà e forma della registrazione restino esplicite nel tempo.

È così che OpenClaw rimane opinionato senza diventare codificato rigidamente sulla
visione del mondo di un solo provider. Vedi il [Cookbook delle capacità](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist della capacità

Quando aggiungi una nuova capacità, l'implementazione di solito dovrebbe toccare insieme queste
superfici:

- tipi di contratto del core in `src/<capability>/types.ts`
- runner/helper di runtime del core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API plugin in `src/plugins/types.ts`
- collegamento del registro dei plugin in `src/plugins/registry.ts`
- esposizione del runtime del plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale
  devono consumarla
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, di solito è segno che la capacità
non è ancora completamente integrata.

### Template della capacità

Pattern minimo:

```ts
// contratto del core
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

// helper di runtime condiviso per plugin di funzionalità/canale
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
- i plugin del fornitore possiedono le implementazioni del fornitore
- i plugin di funzionalità/canale consumano helper di runtime
- i test di contratto mantengono esplicita la proprietà
