---
read_when:
    - È necessaria la firma di tipo esatta di defineToolPlugin, definePluginEntry o defineChannelPluginEntry
    - Si desidera comprendere la modalità di registrazione (completa, configurazione o metadati della CLI)
    - Si stanno cercando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per defineToolPlugin, definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso dei Plugin
x-i18n:
    generated_at: "2026-07-16T14:48:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Ogni plugin esporta un oggetto entry predefinito. L'SDK fornisce un helper per
ciascuna forma di entry: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Serve una guida dettagliata?** Consultare [Plugin di strumenti](/it/plugins/tool-plugins),
  [Plugin di canale](/it/plugins/sdk-channel-plugins) o
  [Plugin di provider](/it/plugins/sdk-provider-plugins) per guide dettagliate.
</Tip>

## Entry del pacchetto

I plugin installati impostano i campi `package.json` `openclaw` sia sulle entry
sorgente sia su quelle compilate:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` e `setupEntry` sono entry sorgente, utilizzate per lo sviluppo
  nell'area di lavoro e nei checkout git.
- `runtimeExtensions` e `runtimeSetupEntry` sono preferite per i pacchetti
  installati: consentono ai pacchetti npm di evitare la compilazione TypeScript in fase di esecuzione.
- `runtimeExtensions`, se presente, deve corrispondere a `extensions` per lunghezza
  dell'array (le entry vengono associate per posizione). `runtimeSetupEntry` richiede `setupEntry`.
- Se viene dichiarato un artefatto `runtimeExtensions`/`runtimeSetupEntry` ma
  questo è assente, l'installazione/rilevamento non riesce e restituisce un errore di pacchettizzazione; OpenClaw non
  ricorre silenziosamente al sorgente. Il fallback sul sorgente (descritto di seguito) si applica solo quando non
  viene dichiarata alcuna entry di runtime.
- Se un pacchetto installato dichiara soltanto un'entry sorgente TypeScript, OpenClaw
  cerca una entry compilata corrispondente `dist/*.js` (oppure `.mjs`/`.cjs`) e la utilizza;
  in caso contrario, ricorre al sorgente TypeScript.
- Tutti i percorsi delle entry devono rimanere all'interno della directory del pacchetto del plugin. Le entry
  di runtime e le entry JavaScript compilate dedotte non rendono valido un percorso sorgente `extensions` o
  `setupEntry` che esce dalla directory.

## `defineToolPlugin`

**Importazione:** `openclaw/plugin-sdk/tool-plugin`

Per i plugin che aggiungono soltanto strumenti dell'agente. Mantiene ridotto il sorgente, deduce i tipi
della configurazione e dei parametri degli strumenti dagli schemi TypeBox, racchiude i normali valori restituiti nel
formato dei risultati degli strumenti di OpenClaw ed espone metadati statici che
`openclaw plugins build` scrive nel manifesto del plugin (`contracts.tools`,
`configSchema`).

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` è facoltativo; omettendolo viene utilizzato uno schema rigoroso a oggetto vuoto
  (il manifesto generato include comunque `configSchema`).
- `execute` restituisce una semplice stringa o un valore serializzabile in JSON; l'helper
  lo racchiude in un risultato testuale dello strumento con `details` impostato sul valore restituito
  originale (non convertito in stringa).
- Per risultati personalizzati degli strumenti, `openclaw/plugin-sdk/tool-results` esporta
  `textResult` e `jsonResult`.
- I nomi degli strumenti sono statici, pertanto `openclaw plugins build` ricava
  `contracts.tools` dagli strumenti dichiarati senza duplicare manualmente i nomi.
- Il caricamento in fase di esecuzione rimane rigoroso: i plugin installati richiedono comunque
  `openclaw.plugin.json` e `package.json` `openclaw.extensions`. OpenClaw
  non esegue mai il codice del plugin per dedurre i dati mancanti del manifesto.

## `definePluginEntry`

**Importazione:** `openclaw/plugin-sdk/plugin-entry`

Per i plugin di provider, i plugin di strumenti avanzati, i plugin di hook e qualsiasi elemento che
**non** sia un canale di messaggistica.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Campo                     | Tipo                                                             | Obbligatorio | Valore predefinito             |
| ------------------------- | ---------------------------------------------------------------- | ------------ | ------------------------------ |
| `id`                      | `string`                                                         | Sì           | -                              |
| `name`                    | `string`                                                         | Sì           | -                              |
| `description`             | `string`                                                         | Sì           | -                              |
| `kind`                    | `string` (deprecato, vedere di seguito)                           | No           | -                              |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema a oggetto vuoto         |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | No           | -                              |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | No           | -                              |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | No           | -                              |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Sì           | -                              |

- `id` deve corrispondere al manifesto `openclaw.plugin.json`.
- I cataloghi delle sessioni esterne utilizzano
  `openclaw/plugin-sdk/session-catalog` e
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Il core gestisce i metodi Gateway `sessions.catalog.*`; i provider restituiscono proiezioni di host,
  sessione e trascrizione normalizzata senza registrare RPC.
- `kind` è deprecato: dichiarare invece uno slot esclusivo (`"memory"` o
  `"context-engine"`) nel campo `kind` del manifesto `openclaw.plugin.json`.
  Il valore `kind` dell'entry di runtime rimane soltanto come fallback di compatibilità per
  i plugin meno recenti.
- `configSchema` può essere una funzione per la valutazione differita. OpenClaw risolve e
  memorizza lo schema al primo accesso, pertanto i generatori di schemi onerosi vengono eseguiti
  una sola volta.
- Un descrittore `nodeHostCommands` può definire `isAvailable({ config, env })`.
  La restituzione di `false` omette tale comando e la relativa funzionalità dalla dichiarazione Gateway
  del nodo headless. OpenClaw lo valuta rispetto alla configurazione di avvio locale
  del nodo; i gestori dei comandi devono comunque convalidarne la disponibilità al
  momento dell'invocazione.

## `defineChannelPluginEntry`

**Importazione:** `openclaw/plugin-sdk/channel-core`

Racchiude `definePluginEntry` con il collegamento specifico del canale: chiama automaticamente
`api.registerChannel({ plugin })`, espone un punto di estensione facoltativo per i metadati CLI
della guida principale e limita `registerFull` in base alla modalità di registrazione.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Campo                 | Tipo                                                             | Obbligatorio | Valore predefinito     |
| --------------------- | ---------------------------------------------------------------- | ------------ | ---------------------- |
| `id`                  | `string`                                                         | Sì           | -                      |
| `name`                | `string`                                                         | Sì           | -                      |
| `description`         | `string`                                                         | Sì           | -                      |
| `plugin`              | `ChannelPlugin`                                                  | Sì           | -                      |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema a oggetto vuoto |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No           | -                      |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No           | -                      |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No           | -                      |

Le callback vengono eseguite in base alla modalità di registrazione (tabella completa in
[Modalità di registrazione](#registration-mode)):

- `setRuntime` viene eseguito in ogni modalità tranne `"cli-metadata"` e
  `"tool-discovery"`. Archiviare qui il riferimento al runtime, in genere tramite
  `createPluginRuntimeStore`.
- `registerCliMetadata` viene eseguito per `"cli-metadata"`, `"discovery"` e
  `"full"`. Utilizzarlo come posizione canonica per i descrittori CLI gestiti dal canale,
  in modo che la guida principale non attivi il plugin, le istantanee di rilevamento includano i metadati statici
  dei comandi e la normale registrazione CLI rimanga compatibile con i caricamenti completi
  del plugin.
- `registerFull` viene eseguito soltanto per `"full"` e `"tool-discovery"`. Per
  `"tool-discovery"` viene eseguito _al posto della_ registrazione del canale: OpenClaw
  ignora completamente `registerChannel`/`setRuntime` e chiama soltanto
  `registerFull`, pertanto qualsiasi registrazione di provider/strumenti necessaria al canale per
  il rilevamento o l'esecuzione autonoma degli strumenti deve risiedere lì, non dietro la normale
  configurazione del canale.
- La registrazione per il rilevamento non attiva il plugin, ma può eseguirne le importazioni: OpenClaw può
  valutare l'entry attendibile del plugin e il modulo del plugin di canale per creare
  l'istantanea. Mantenere prive di effetti collaterali le importazioni di primo livello e collocare socket,
  client, worker e servizi dietro percorsi riservati a `"full"`.
- Come `definePluginEntry`, `configSchema` può essere una factory differita; OpenClaw
  memorizza lo schema risolto al primo accesso.

Registrazione CLI:

- Utilizzare `api.registerCli(..., { descriptors: [...] })` per i comandi
  CLI principali gestiti dal plugin che devono essere caricati in modo differito senza scomparire dall'albero
  di analisi della CLI principale. I nomi dei descrittori devono contenere lettere, numeri, trattini e
  trattini bassi e iniziare con una lettera o un numero; OpenClaw rifiuta le altre
  forme e rimuove dalle descrizioni le sequenze di controllo del terminale prima di
  mostrare la guida. Includere ogni radice di comando di primo livello esposta dal registrar.
  `commands` da solo rimane nel percorso di compatibilità con caricamento anticipato.
- Utilizzare `api.registerNodeCliFeature(...)` per i comandi delle funzionalità dei nodi associati, affinché
  vengano inseriti sotto `openclaw nodes` (equivalente a
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Per gli altri comandi annidati del plugin, aggiungere `parentPath` e registrare i comandi
  nell'oggetto `program` passato al registrar; OpenClaw lo risolve nel
  comando padre prima di chiamare il plugin.
- Per i plugin di canale, registrare i descrittori CLI da `registerCliMetadata`
  e mantenere `registerFull` incentrato esclusivamente sulle operazioni di runtime.
- Se `registerFull` registra anche metodi RPC del Gateway, mantenerli sotto un
  prefisso specifico del plugin. Gli spazi dei nomi amministrativi riservati del core (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) vengono sempre convertiti in
  `operator.admin`.

## `defineSetupPluginEntry`

**Importazione:** `openclaw/plugin-sdk/channel-core`

Per il file leggero `setup-entry.ts`. Restituisce soltanto `{ plugin }`, senza
collegamenti al runtime o alla CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carica questa voce al posto di quella completa quando un canale è disabilitato,
non configurato o quando è abilitato il caricamento differito. Consultare
[Configurazione iniziale e configurazione](/it/plugins/sdk-setup#setup-entry) per sapere quando è rilevante.

Abbinare `defineSetupPluginEntry(...)` alle famiglie specifiche di helper per la configurazione iniziale:

| Importazione                        | Utilizzo                                                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Helper per la configurazione iniziale sicuri in fase di runtime: `createSetupTranslator`, adattatori per patch di configurazione iniziale sicuri per l'importazione, output delle note di ricerca, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy delegati per la configurazione iniziale |
| `openclaw/plugin-sdk/channel-setup` | Superfici di configurazione iniziale per installazioni facoltative                                                                                                                  |
| `openclaw/plugin-sdk/setup-tools`   | Helper per CLI, archivi e documentazione relativi alla configurazione iniziale/installazione                                                                                        |

Mantenere gli SDK pesanti, la registrazione della CLI e i servizi di runtime
di lunga durata nella voce completa.

I canali inclusi nell'area di lavoro che separano le superfici di configurazione iniziale e runtime possono utilizzare
`defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract`. Ciò consente alla voce di configurazione iniziale
di mantenere le esportazioni di plugin/segreti sicure per la configurazione iniziale, esponendo comunque un
setter di runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* route sicura per la configurazione iniziale */
      },
    });
  },
});
```

Utilizzare questa opzione solo quando un flusso di configurazione iniziale richiede effettivamente un setter di runtime leggero o
una superficie Gateway sicura per la configurazione iniziale prima del caricamento della voce completa del canale.
`registerSetupRuntime` viene eseguito solo per i caricamenti `"setup-runtime"`; limitarlo
a route o metodi che operano esclusivamente sulla configurazione e che devono esistere prima dell'attivazione
completa differita.

## Modalità di registrazione

`api.registrationMode` indica al plugin come è stato caricato:

| Modalità            | Quando                                             | Cosa registrare                                                                                                          |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Avvio normale del Gateway                          | Tutto                                                                                                                    |
| `"discovery"`      | Individuazione delle funzionalità in sola lettura  | Registrazione del canale e descrittori CLI statici; il codice della voce può essere caricato, ma senza socket, worker, client e servizi |
| `"tool-discovery"` | Caricamento con ambito limitato per elencare o eseguire gli strumenti di plugin specifici | Solo registrazione di funzionalità/strumenti; nessuna attivazione del canale                                             |
| `"setup-only"`     | Canale disabilitato/non configurato                | Solo registrazione del canale                                                                                            |
| `"setup-runtime"`  | Flusso di configurazione iniziale con runtime disponibile | Registrazione del canale e solo il runtime leggero necessario prima del caricamento della voce completa                  |
| `"cli-metadata"`   | Acquisizione dei metadati della guida principale/CLI | Solo descrittori CLI                                                                                                     |

`defineChannelPluginEntry` gestisce automaticamente questa separazione. Se si utilizza
`definePluginEntry` direttamente per un canale, verificare autonomamente la modalità e ricordare che
`"tool-discovery"` salta la registrazione del canale:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // Registrare solo le superfici delle funzionalità (provider/strumenti), senza il canale.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registrazioni pesanti riservate al runtime
  api.registerService(/* ... */);
}
```

I servizi di lunga durata possono emettere piccoli eventi di invalidazione o del ciclo di vita tramite
il proprio contesto di servizio:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw assegna a questo lo spazio dei nomi `plugin.<plugin-id>.changed`. I nomi degli eventi sono costituiti da un
singolo segmento in minuscolo, i payload devono essere JSON di dimensioni limitate e l'ambito deve essere
`operator.read`, `operator.write` o `operator.admin`. L'emettitore esiste solo
per la durata del servizio e viene revocato dopo l'arresto o un avvio non riuscito. Preferire
payload di versione o invalidazione ai record completi, in modo che i client autorizzati rileggano
lo stato canonico tramite i metodi Gateway con ambito del plugin.

La modalità di individuazione crea un'istantanea del registro senza attivazione. Può comunque
valutare la voce del plugin e l'oggetto plugin del canale affinché OpenClaw possa
registrare le funzionalità del canale e i descrittori CLI statici. Considerare la valutazione del
modulo durante l'individuazione come attendibile ma leggera: nessun client di rete,
sottoprocesso, listener, connessione al database, worker in background,
lettura delle credenziali o altro effetto collaterale del runtime attivo al livello superiore.

Considerare `"setup-runtime"` come la finestra in cui le superfici di avvio riservate alla configurazione iniziale devono
esistere senza rientrare nel runtime completo del canale incluso. Sono adatti
la registrazione del canale, le route HTTP sicure per la configurazione iniziale, i metodi Gateway sicuri per la configurazione iniziale
e gli helper delegati per la configurazione iniziale. I servizi in background pesanti, i registrar CLI e
le inizializzazioni degli SDK di provider/client devono invece rimanere in `"full"`.

## Forme dei plugin

OpenClaw classifica i plugin caricati in base al loro comportamento di registrazione:

| Forma                 | Descrizione                                         |
| --------------------- | --------------------------------------------------- |
| **plain-capability**  | Un solo tipo di funzionalità (ad es. solo provider) |
| **hybrid-capability** | Più tipi di funzionalità (ad es. provider + voce)   |
| **hook-only**         | Solo hook, nessuna funzionalità                     |
| **non-capability**    | Strumenti/comandi/servizi, ma nessuna funzionalità  |

Utilizzare `openclaw plugins inspect <id>` per visualizzare la forma di un plugin.

## Risorse correlate

- [Panoramica dell'SDK](/it/plugins/sdk-overview) - API di registrazione e riferimento dei percorsi secondari
- [Helper di runtime](/it/plugins/sdk-runtime) - `api.runtime` e `createPluginRuntimeStore`
- [Configurazione iniziale e configurazione](/it/plugins/sdk-setup) - manifest, voce di configurazione iniziale, caricamento differito
- [Plugin dei canali](/it/plugins/sdk-channel-plugins) - creazione dell'oggetto `ChannelPlugin`
- [Plugin dei provider](/it/plugins/sdk-provider-plugins) - registrazione dei provider e hook
