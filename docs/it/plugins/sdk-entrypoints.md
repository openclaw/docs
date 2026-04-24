---
read_when:
    - Hai bisogno della firma di tipo esatta di definePluginEntry o defineChannelPluginEntry
    - Vuoi capire la modalità di registrazione (full vs setup vs metadati CLI)
    - Stai cercando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso del Plugin
x-i18n:
    generated_at: "2026-04-24T08:53:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Ogni Plugin esporta un oggetto entry predefinito. L'SDK fornisce tre helper per
crearlo.

Per i Plugin installati, `package.json` dovrebbe puntare il caricamento runtime al
JavaScript buildato quando disponibile:

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

`extensions` e `setupEntry` restano entry sorgente validi per sviluppo in workspace e
checkout git. `runtimeExtensions` e `runtimeSetupEntry` sono preferiti
quando OpenClaw carica un pacchetto installato e consentono ai pacchetti npm di evitare la compilazione TypeScript a runtime. Se un pacchetto installato dichiara solo un entry sorgente TypeScript, OpenClaw userà un peer buildato `dist/*.js` corrispondente quando esiste, poi userà come fallback il sorgente TypeScript.

Tutti i percorsi entry devono restare all'interno della directory del pacchetto Plugin. Le entry runtime
e i peer JavaScript buildati dedotti non rendono valido un percorso sorgente `extensions` o
`setupEntry` che esce dalla directory.

<Tip>
  **Cerchi una guida passo passo?** Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins)
  o [Plugin provider](/it/plugins/sdk-provider-plugins).
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Per Plugin provider, Plugin di strumenti, Plugin hook e qualunque cosa **non**
sia un canale di messaggistica.

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

| Campo          | Tipo                                                             | Obbligatorio | Predefinito         |
| -------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`           | `string`                                                         | Sì           | —                   |
| `name`         | `string`                                                         | Sì           | —                   |
| `description`  | `string`                                                         | Sì           | —                   |
| `kind`         | `string`                                                         | No           | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema oggetto vuoto |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sì           | —                   |

- `id` deve corrispondere al tuo manifest `openclaw.plugin.json`.
- `kind` è per slot esclusivi: `"memory"` o `"context-engine"`.
- `configSchema` può essere una funzione per valutazione lazy.
- OpenClaw risolve e memoizza quello schema al primo accesso, così i builder di schema costosi
  vengono eseguiti solo una volta.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Wrappa `definePluginEntry` con wiring specifico del canale. Chiama automaticamente
`api.registerChannel({ plugin })`, espone un seam facoltativo per metadati CLI di root-help e
protegge `registerFull` in base alla modalità di registrazione.

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

| Campo                 | Tipo                                                             | Obbligatorio | Predefinito         |
| --------------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`                  | `string`                                                         | Sì           | —                   |
| `name`                | `string`                                                         | Sì           | —                   |
| `description`         | `string`                                                         | Sì           | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Sì           | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema oggetto vuoto |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No           | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No           | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No           | —                   |

- `setRuntime` viene chiamato durante la registrazione così puoi memorizzare il riferimento al runtime
  (tipicamente tramite `createPluginRuntimeStore`). Viene saltato durante la cattura dei metadati CLI.
- `registerCliMetadata` viene eseguito sia quando `api.registrationMode === "cli-metadata"`
  sia quando `api.registrationMode === "full"`.
  Usalo come posto canonico per i descrittori CLI posseduti dal canale così l'help di root
  resta non attivante mentre la normale registrazione dei comandi CLI resta compatibile
  con il caricamento completo dei Plugin.
- `registerFull` viene eseguito solo quando `api.registrationMode === "full"`. Viene saltato
  durante il caricamento setup-only.
- Come `definePluginEntry`, `configSchema` può essere una factory lazy e OpenClaw
  memoizza lo schema risolto al primo accesso.
- Per comandi CLI di root posseduti dal Plugin, preferisci `api.registerCli(..., { descriptors: [...] })`
  quando vuoi che il comando resti lazy-loaded senza sparire dall'albero di parsing
  CLI di root. Per i Plugin di canale, preferisci registrare quei descrittori
  da `registerCliMetadata(...)` e mantieni `registerFull(...)` focalizzato sul lavoro solo runtime.
- Se `registerFull(...)` registra anche metodi RPC del Gateway, mantienili su un
  prefisso specifico del Plugin. I namespace core admin riservati (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) vengono sempre coercizzati a
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Per il file leggero `setup-entry.ts`. Restituisce solo `{ plugin }` senza
wiring runtime o CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carica questo invece dell'entry completo quando un canale è disabilitato,
non configurato o quando il caricamento differito è abilitato. Vedi
[Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per capire quando questo è importante.

In pratica, abbina `defineSetupPluginEntry(...)` alle famiglie di helper di setup ristrette:

- `openclaw/plugin-sdk/setup-runtime` per helper di setup sicuri per il runtime come
  adapter di patch setup import-safe, output di note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxy di setup delegati
- `openclaw/plugin-sdk/channel-setup` per superfici di setup a installazione facoltativa
- `openclaw/plugin-sdk/setup-tools` per helper CLI/archive/docs di setup/installazione

Mantieni SDK pesanti, registrazione CLI e servizi runtime di lunga durata nell'entry completo.

I canali bundled del workspace che separano setup e superfici runtime possono usare
`defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract`. Quel contratto consente all'entry di
setup di mantenere esportazioni plugin/secrets sicure per il setup pur esponendo un setter
runtime:

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
});
```

Usa questo contratto bundled solo quando i flussi di setup hanno davvero bisogno di un setter runtime leggero
prima del caricamento dell'entry completo del canale.

## Modalità di registrazione

`api.registrationMode` indica al tuo Plugin come è stato caricato:

| Modalità          | Quando                              | Cosa registrare                                                                           |
| ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | Normale avvio del Gateway           | Tutto                                                                                     |
| `"setup-only"`    | Canale disabilitato/non configurato | Solo registrazione del canale                                                             |
| `"setup-runtime"` | Flusso di setup con runtime disponibile | Registrazione del canale più solo il runtime leggero necessario prima del caricamento dell'entry completo |
| `"cli-metadata"`  | Help di root / cattura metadati CLI | Solo descrittori CLI                                                                      |

`defineChannelPluginEntry` gestisce automaticamente questa separazione. Se usi
`definePluginEntry` direttamente per un canale, controlla tu stesso la modalità:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registrazioni pesanti solo runtime
  api.registerService(/* ... */);
}
```

Tratta `"setup-runtime"` come la finestra in cui le superfici di avvio setup-only devono
esistere senza rientrare nel runtime completo del canale bundled. Buoni candidati sono
registrazione del canale, route HTTP sicure per setup, metodi Gateway sicuri per setup e helper di setup delegati. Servizi di background pesanti, registratori CLI e bootstrap di SDK provider/client appartengono ancora a `"full"`.

Per i registratori CLI in particolare:

- usa `descriptors` quando il registratore possiede uno o più comandi root e vuoi
  che OpenClaw carichi lazy il vero modulo CLI alla prima invocazione
- assicurati che quei descrittori coprano ogni root di comando di primo livello esposto dal
  registratore
- usa `commands` da solo solo per percorsi compatibili eager

## Forme dei Plugin

OpenClaw classifica i Plugin caricati in base al loro comportamento di registrazione:

| Forma                 | Descrizione                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un solo tipo di capacità (es. solo provider)       |
| **hybrid-capability** | Più tipi di capacità (es. provider + speech)       |
| **hook-only**         | Solo hook, nessuna capacità                        |
| **non-capability**    | Strumenti/comandi/servizi ma nessuna capacità      |

Usa `openclaw plugins inspect <id>` per vedere la forma di un Plugin.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview) — API di registrazione e riferimento dei sottopercorsi
- [Helper runtime](/it/plugins/sdk-runtime) — `api.runtime` e `createPluginRuntimeStore`
- [Setup e configurazione](/it/plugins/sdk-setup) — manifest, setup entry, caricamento differito
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — costruzione dell'oggetto `ChannelPlugin`
- [Plugin provider](/it/plugins/sdk-provider-plugins) — registrazione del provider e hook
