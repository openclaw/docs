---
read_when:
    - Hai bisogno della firma di tipo esatta di definePluginEntry o defineChannelPluginEntry
    - Vuoi capire la modalità di registrazione (completa vs setup vs metadati CLI)
    - Stai cercando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso del Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabca25bc9b8ff1b5bb4852bafe83640ffeba006ea6b6a8eff4e2c37a10f1fe4
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Punti di ingresso del Plugin

Ogni Plugin esporta un oggetto di ingresso predefinito. L'SDK fornisce tre helper per
crearli.

<Tip>
  **Cerchi una guida passo passo?** Consulta [Plugin di canale](/it/plugins/sdk-channel-plugins)
  o [Provider Plugins](/it/plugins/sdk-provider-plugins) per guide dettagliate.
</Tip>

## `definePluginEntry`

**Importa:** `openclaw/plugin-sdk/plugin-entry`

Per i provider plugin, i tool plugin, gli hook plugin e qualsiasi cosa che **non**
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
- `kind` serve per slot esclusivi: `"memory"` o `"context-engine"`.
- `configSchema` può essere una funzione per una valutazione lazy.
- OpenClaw risolve e memorizza quello schema al primo accesso, quindi i builder
  di schema costosi vengono eseguiti una sola volta.

## `defineChannelPluginEntry`

**Importa:** `openclaw/plugin-sdk/channel-core`

Avvolge `definePluginEntry` con wiring specifico per i canali. Chiama automaticamente
`api.registerChannel({ plugin })`, espone un seam opzionale di metadati CLI
per l'help root e limita `registerFull` in base alla modalità di registrazione.

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

- `setRuntime` viene chiamato durante la registrazione così puoi memorizzare il riferimento
  al runtime (in genere tramite `createPluginRuntimeStore`). Viene saltato durante la raccolta
  dei metadati CLI.
- `registerCliMetadata` viene eseguito sia quando `api.registrationMode === "cli-metadata"`
  sia quando `api.registrationMode === "full"`.
  Usalo come punto canonico per i descrittori CLI posseduti dal canale, in modo che
  l'help root resti non attivante mentre la normale registrazione dei comandi CLI rimane compatibile
  con i caricamenti completi del Plugin.
- `registerFull` viene eseguito solo quando `api.registrationMode === "full"`. Viene saltato
  durante il caricamento solo setup.
- Come `definePluginEntry`, `configSchema` può essere una factory lazy e OpenClaw
  memorizza lo schema risolto al primo accesso.
- Per i comandi CLI root posseduti dal Plugin, preferisci `api.registerCli(..., { descriptors: [...] })`
  quando vuoi che il comando resti lazy-loaded senza scomparire dall'albero di parsing
  della CLI root. Per i channel plugin, preferisci registrare quei descrittori da
  `registerCliMetadata(...)` e mantenere `registerFull(...)` focalizzato sul lavoro solo runtime.
- Se `registerFull(...)` registra anche metodi RPC del Gateway, mantienili su un
  prefisso specifico del Plugin. Gli spazi dei nomi admin core riservati (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) vengono sempre forzati a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importa:** `openclaw/plugin-sdk/channel-core`

Per il file leggero `setup-entry.ts`. Restituisce solo `{ plugin }` senza
wiring di runtime o CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lo carica al posto dell'ingresso completo quando un canale è disabilitato,
non configurato oppure quando il caricamento differito è abilitato. Consulta
[Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per capire quando questo è importante.

In pratica, abbina `defineSetupPluginEntry(...)` alle famiglie ristrette di helper per il setup:

- `openclaw/plugin-sdk/setup-runtime` per helper di setup sicuri per il runtime come
  adattatori di patch setup import-safe, output di note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxy di setup delegati
- `openclaw/plugin-sdk/channel-setup` per superfici di setup di installazione opzionale
- `openclaw/plugin-sdk/setup-tools` per helper CLI/archivio/documentazione di setup/installazione

Mantieni SDK pesanti, registrazione CLI e servizi runtime a lunga durata nell'ingresso
completo.

I canali workspace bundled che separano le superfici di setup e runtime possono usare
invece `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract`. Quel contratto consente al punto di
ingresso di setup di mantenere esportazioni di plugin/secrets sicure per il setup,
continuando comunque a esporre un setter del runtime:

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

Usa quel contratto bundled solo quando i flussi di setup hanno davvero bisogno di un
setter del runtime leggero prima che venga caricato il punto di ingresso completo del canale.

## Modalità di registrazione

`api.registrationMode` indica al tuo Plugin come è stato caricato:

| Modalità          | Quando                            | Cosa registrare                                                                            |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| `"full"`          | Avvio normale del Gateway         | Tutto                                                                                      |
| `"setup-only"`    | Canale disabilitato/non configurato | Solo registrazione del canale                                                            |
| `"setup-runtime"` | Flusso di setup con runtime disponibile | Registrazione del canale più solo il runtime leggero necessario prima che venga caricato il punto di ingresso completo |
| `"cli-metadata"`  | Help root / acquisizione metadati CLI | Solo descrittori CLI                                                                    |

`defineChannelPluginEntry` gestisce automaticamente questa suddivisione. Se usi
direttamente `definePluginEntry` per un canale, controlla tu stesso la modalità:

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

Considera `"setup-runtime"` come la finestra in cui le superfici di avvio solo setup devono
esistere senza rientrare nel runtime completo del canale bundled. Buoni casi d'uso sono
la registrazione del canale, route HTTP sicure per il setup, metodi Gateway sicuri per il setup e
helper di setup delegati. Servizi background pesanti, registrar CLI e bootstrap di SDK provider/client
continuano invece ad appartenere a `"full"`.

Per i registrar CLI nello specifico:

- usa `descriptors` quando il registrar possiede uno o più comandi root e tu
  vuoi che OpenClaw carichi lazy il vero modulo CLI alla prima invocazione
- assicurati che quei descrittori coprano ogni root command di primo livello esposto dal
  registrar
- usa solo `commands` solo per percorsi di compatibilità eager

## Forme del Plugin

OpenClaw classifica i Plugin caricati in base al loro comportamento di registrazione:

| Forma                 | Descrizione                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un solo tipo di capacità (ad es. solo provider)    |
| **hybrid-capability** | Più tipi di capacità (ad es. provider + speech)    |
| **hook-only**         | Solo hook, nessuna capacità                        |
| **non-capability**    | Tool/comandi/servizi ma nessuna capacità           |

Usa `openclaw plugins inspect <id>` per vedere la forma di un Plugin.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview) — API di registrazione e riferimento dei sottopercorsi
- [Helper di runtime](/it/plugins/sdk-runtime) — `api.runtime` e `createPluginRuntimeStore`
- [Setup e configurazione](/it/plugins/sdk-setup) — manifest, punto di ingresso di setup, caricamento differito
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — come costruire l'oggetto `ChannelPlugin`
- [Provider Plugins](/it/plugins/sdk-provider-plugins) — registrazione del provider e hook
