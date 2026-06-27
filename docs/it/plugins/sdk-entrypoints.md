---
read_when:
    - Ti serve la firma di tipo esatta di defineToolPlugin, definePluginEntry o defineChannelPluginEntry
    - Vuoi comprendere la modalità di registrazione (completa vs configurazione vs metadati CLI)
    - Stai cercando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per defineToolPlugin, definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso del Plugin
x-i18n:
    generated_at: "2026-06-27T18:00:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Ogni plugin esporta un oggetto entry predefinito. L'SDK fornisce helper per
crearle.

Per i plugin installati, `package.json` dovrebbe indirizzare il caricamento runtime al
JavaScript compilato quando disponibile:

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

`extensions` e `setupEntry` restano entry sorgente valide per lo sviluppo in workspace e
checkout git. `runtimeExtensions` e `runtimeSetupEntry` sono preferite
quando OpenClaw carica un pacchetto installato e permettono ai pacchetti npm di evitare la compilazione
TypeScript a runtime. Le entry runtime esplicite sono obbligatorie: `runtimeSetupEntry`
richiede `setupEntry`, e gli artefatti `runtimeExtensions` o `runtimeSetupEntry`
mancanti fanno fallire installazione/discovery invece di ripiegare silenziosamente sul sorgente. Se
un pacchetto installato dichiara solo una entry sorgente TypeScript, OpenClaw userà un
peer `dist/*.js` compilato corrispondente quando esiste, poi ripiegherà sul sorgente
TypeScript.

Tutti i percorsi delle entry devono restare all'interno della directory del pacchetto plugin. Le entry runtime
e i peer JavaScript compilati dedotti non rendono valido un percorso sorgente `extensions` o
`setupEntry` che esce dalla directory.

<Tip>
  **Cerchi una guida passo passo?** Vedi [Tool Plugin](/it/plugins/tool-plugins),
  [Channel Plugin](/it/plugins/sdk-channel-plugins) o
  [Provider Plugin](/it/plugins/sdk-provider-plugins) per guide dettagliate.
</Tip>

## `defineToolPlugin`

**Importazione:** `openclaw/plugin-sdk/tool-plugin`

Per plugin semplici che aggiungono solo strumenti agent. `defineToolPlugin` mantiene il
sorgente di authoring ridotto, deduce i tipi dei parametri di configurazione e degli strumenti dagli schemi
TypeBox, incapsula i valori di ritorno semplici nel formato tool-result di OpenClaw, ed
espone metadati statici che `openclaw plugins build` scrive nel manifest del plugin.

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

- `configSchema` è facoltativo. Quando omesso, OpenClaw usa uno schema oggetto vuoto rigoroso
  e il manifest generato include comunque `configSchema`.
- `execute` restituisce una stringa semplice o un valore serializzabile in JSON. L'helper lo incapsula
  come risultato tool di testo con `details`.
- I nomi degli strumenti sono statici. `openclaw plugins build` deriva `contracts.tools`
  dagli strumenti dichiarati, quindi gli autori non duplicano i nomi manualmente.
- Il caricamento runtime resta rigoroso. I plugin installati hanno comunque bisogno di
  `openclaw.plugin.json` e `package.json` `openclaw.extensions`; OpenClaw non
  esegue codice del plugin per dedurre dati del manifest mancanti.

## `definePluginEntry`

**Importazione:** `openclaw/plugin-sdk/plugin-entry`

Per plugin provider, plugin tool avanzati, plugin hook e qualsiasi cosa che
**non** sia un canale di messaggistica.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Campo          | Tipo                                                             | Obbligatorio | Predefinito          |
| -------------- | ---------------------------------------------------------------- | ------------ | -------------------- |
| `id`           | `string`                                                         | Sì           | -                    |
| `name`         | `string`                                                         | Sì           | -                    |
| `description`  | `string`                                                         | Sì           | -                    |
| `kind`         | `string`                                                         | No           | -                    |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema oggetto vuoto |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sì           | -                    |

- `id` deve corrispondere al tuo manifest `openclaw.plugin.json`.
- `kind` è per slot esclusivi: `"memory"` o `"context-engine"`.
- `configSchema` può essere una funzione per la valutazione lazy.
- OpenClaw risolve e memorizza quello schema al primo accesso, quindi i builder di schemi
  costosi vengono eseguiti una sola volta.

## `defineChannelPluginEntry`

**Importazione:** `openclaw/plugin-sdk/channel-core`

Incapsula `definePluginEntry` con cablaggio specifico per canale. Chiama automaticamente
`api.registerChannel({ plugin })`, espone una seam facoltativa per i metadati CLI della guida root
e limita `registerFull` in base alla modalità di registrazione.

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

| Campo                 | Tipo                                                             | Obbligatorio | Predefinito          |
| --------------------- | ---------------------------------------------------------------- | ------------ | -------------------- |
| `id`                  | `string`                                                         | Sì           | -                    |
| `name`                | `string`                                                         | Sì           | -                    |
| `description`         | `string`                                                         | Sì           | -                    |
| `plugin`              | `ChannelPlugin`                                                  | Sì           | -                    |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema oggetto vuoto |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No           | -                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No           | -                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No           | -                    |

- `setRuntime` viene chiamato durante la registrazione così puoi memorizzare il riferimento runtime
  (tipicamente tramite `createPluginRuntimeStore`). Viene saltato durante la cattura dei metadati CLI.
- `registerCliMetadata` viene eseguito durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` e
  `api.registrationMode === "full"`.
  Usalo come posizione canonica per i descrittori CLI di proprietà del canale, così la guida root
  resta non attivante, gli snapshot di discovery includono metadati statici dei comandi e
  la normale registrazione dei comandi CLI resta compatibile con i caricamenti completi del plugin.
- La registrazione discovery è non attivante, non priva di import. OpenClaw può
  valutare la entry del plugin attendibile e il modulo del plugin canale per costruire lo
  snapshot, quindi mantieni gli import di primo livello privi di effetti collaterali e metti socket,
  client, worker e servizi dietro percorsi solo `"full"`.
- `registerFull` viene eseguito solo quando `api.registrationMode === "full"`. Viene saltato
  durante il caricamento solo setup.
- Come `definePluginEntry`, `configSchema` può essere una factory lazy e OpenClaw
  memorizza lo schema risolto al primo accesso.
- Per i comandi CLI root di proprietà del plugin, preferisci `api.registerCli(..., { descriptors: [...] })`
  quando vuoi che il comando resti caricato lazy senza scomparire dall'albero di parsing della
  CLI root. Per i comandi feature paired-node, preferisci
  `api.registerNodeCliFeature(...)` così il comando finisce sotto `openclaw nodes`.
  Per altri comandi plugin annidati, aggiungi `parentPath` e registra i comandi sull'oggetto
  `program` passato al registrar; OpenClaw lo risolve al comando padre prima di chiamare il plugin. Per i plugin canale, preferisci
  registrare quei descrittori da `registerCliMetadata(...)` e mantieni
  `registerFull(...)` focalizzato sul lavoro solo runtime.
- Se `registerFull(...)` registra anche metodi RPC del Gateway, mantienili su un
  prefisso specifico del plugin. Gli spazi dei nomi admin core riservati (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sono sempre forzati a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importazione:** `openclaw/plugin-sdk/channel-core`

Per il file leggero `setup-entry.ts`. Restituisce solo `{ plugin }` senza
cablaggio runtime o CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carica questo invece della entry completa quando un canale è disabilitato,
non configurato, o quando il caricamento differito è abilitato. Vedi
[Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per quando è importante.

In pratica, abbina `defineSetupPluginEntry(...)` alle famiglie di helper di setup ristrette:

- `openclaw/plugin-sdk/setup-runtime` per helper di setup sicuri per il runtime come
  `createSetupTranslator`, adattatori di patch setup import-safe, output di note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxy di setup delegati
- `openclaw/plugin-sdk/channel-setup` per superfici di setup con installazione facoltativa
- `openclaw/plugin-sdk/setup-tools` per helper CLI/archivio/docs di setup/installazione

Mantieni SDK pesanti, registrazione CLI e servizi runtime di lunga durata nella entry completa.

I canali workspace in bundle che separano superfici di setup e runtime possono usare invece
`defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract`. Quel contratto permette alla
entry di setup di mantenere esportazioni plugin/segreti sicure per il setup, esponendo comunque un
setter runtime:

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
        /* setup-safe route */
      },
    });
  },
});
```

Usa quel contratto in bundle solo quando i flussi di setup hanno davvero bisogno di un setter runtime
leggero o di una superficie Gateway sicura per il setup prima che la entry completa del canale venga caricata.
`registerSetupRuntime` viene eseguito solo per caricamenti `"setup-runtime"`; mantienilo limitato a
route o metodi solo configurazione che devono esistere prima dell'attivazione completa differita.

## Modalità di registrazione

`api.registrationMode` indica al tuo plugin come è stato caricato:

| Modalità          | Quando                                      | Cosa registrare                                                                                                         |
| ----------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Avvio normale del Gateway                   | Tutto                                                                                                                   |
| `"discovery"`     | Rilevamento delle capacità in sola lettura  | Registrazione del canale più descrittori CLI statici; il codice di ingresso può essere caricato, ma salta socket, worker, client e servizi |
| `"setup-only"`    | Canale disabilitato/non configurato         | Solo registrazione del canale                                                                                           |
| `"setup-runtime"` | Flusso di configurazione con runtime disponibile | Registrazione del canale più solo il runtime leggero necessario prima del caricamento dell'entry completa               |
| `"cli-metadata"`  | Acquisizione dell'help root / metadati CLI  | Solo descrittori CLI                                                                                                    |

`defineChannelPluginEntry` gestisce automaticamente questa separazione. Se usi
`definePluginEntry` direttamente per un canale, controlla tu stesso la modalità:

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

La modalità di rilevamento crea uno snapshot del registro senza attivazione. Può comunque valutare
l'entry del Plugin e l'oggetto del Plugin di canale, così OpenClaw può registrare le
capacità del canale e i descrittori CLI statici. Considera la valutazione del modulo in modalità di rilevamento come
attendibile ma leggera: nessun client di rete, sottoprocesso, listener, connessione al database,
worker in background, lettura di credenziali o altri effetti collaterali runtime attivi
al livello superiore.

Considera `"setup-runtime"` come la finestra in cui le superfici di avvio solo per la configurazione devono
esistere senza rientrare nel runtime completo del canale in bundle. Buoni casi d'uso sono
registrazione del canale, route HTTP sicure per la configurazione, metodi Gateway sicuri per la configurazione e
helper di configurazione delegati. Servizi background pesanti, registrar CLI e bootstrap di SDK
provider/client appartengono comunque a `"full"`.

Per i registrar CLI nello specifico:

- usa `descriptors` quando il registrar possiede uno o più comandi root e vuoi
  che OpenClaw carichi in modo lazy il modulo CLI reale alla prima invocazione
- assicurati che questi descrittori coprano ogni root di comando di primo livello esposto dal
  registrar
- limita i nomi dei comandi dei descrittori a lettere, numeri, trattino e underscore,
  iniziando con una lettera o un numero; OpenClaw rifiuta i nomi dei descrittori fuori da
  questa forma e rimuove le sequenze di controllo terminale dalle descrizioni prima di
  renderizzare l'help
- usa solo `commands` esclusivamente per percorsi di compatibilità eager

## Forme dei Plugin

OpenClaw classifica i Plugin caricati in base al loro comportamento di registrazione:

| Forma                 | Descrizione                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo di capacità (ad es. solo provider)         |
| **hybrid-capability** | Più tipi di capacità (ad es. provider + speech)    |
| **hook-only**         | Solo hook, nessuna capacità                        |
| **non-capability**    | Strumenti/comandi/servizi ma nessuna capacità      |

Usa `openclaw plugins inspect <id>` per vedere la forma di un Plugin.

## Correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview) - API di registrazione e riferimento dei sottopercorsi
- [Funzioni helper del runtime](/it/plugins/sdk-runtime) - `api.runtime` e `createPluginRuntimeStore`
- [Configurazione iniziale e configurazione](/it/plugins/sdk-setup) - manifest, entry di configurazione, caricamento differito
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - costruzione dell'oggetto `ChannelPlugin`
- [Plugin provider](/it/plugins/sdk-provider-plugins) - registrazione del provider e hook
