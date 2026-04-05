---
read_when:
    - Hai bisogno della firma di tipo esatta di definePluginEntry o defineChannelPluginEntry
    - Vuoi capire la modalità di registrazione (full vs setup vs metadata CLI)
    - Stai cercando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso dei plugin
x-i18n:
    generated_at: "2026-04-05T13:59:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Punti di ingresso dei plugin

Ogni plugin esporta un oggetto entry predefinito. L'SDK fornisce tre helper per
crearli.

<Tip>
  **Cerchi una guida passo passo?** Vedi [Plugin di canale](/plugins/sdk-channel-plugins)
  o [Plugin provider](/plugins/sdk-provider-plugins) per guide dettagliate.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Per plugin provider, plugin di strumenti, plugin di hook e tutto ciò che **non**
è un canale di messaggistica.

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
- `configSchema` può essere una funzione per la valutazione lazy.
- OpenClaw risolve e memoizza quello schema al primo accesso, quindi i builder di schema costosi vengono eseguiti una sola volta.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Avvolge `definePluginEntry` con il wiring specifico per i canali. Chiama automaticamente
`api.registerChannel({ plugin })`, espone una seam facoltativa di metadati CLI per l'help root
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

- `setRuntime` viene chiamato durante la registrazione così puoi memorizzare il riferimento runtime
  (tipicamente tramite `createPluginRuntimeStore`). Viene saltato durante la raccolta
  dei metadati CLI.
- `registerCliMetadata` viene eseguito sia quando `api.registrationMode === "cli-metadata"`
  sia quando `api.registrationMode === "full"`.
  Usalo come punto canonico per i descrittori CLI posseduti dal canale, così l'help root
  resta non attivante mentre la normale registrazione dei comandi CLI rimane compatibile
  con i caricamenti completi del plugin.
- `registerFull` viene eseguito solo quando `api.registrationMode === "full"`. Viene saltato
  durante il caricamento setup-only.
- Come `definePluginEntry`, `configSchema` può essere una factory lazy e OpenClaw
  memoizza lo schema risolto al primo accesso.
- Per i comandi CLI root posseduti dal plugin, preferisci `api.registerCli(..., { descriptors: [...] })`
  quando vuoi che il comando resti caricato lazy senza scomparire dall'albero di parsing
  della CLI root. Per i plugin di canale, preferisci registrare quei descrittori
  da `registerCliMetadata(...)` e mantenere `registerFull(...)` focalizzato sul lavoro solo runtime.
- Se `registerFull(...)` registra anche metodi RPC del gateway, mantienili su un
  prefisso specifico del plugin. Gli spazi dei nomi admin core riservati (`config.*`,
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

OpenClaw lo carica al posto dell'entry completa quando un canale è disabilitato,
non configurato o quando il caricamento differito è abilitato. Vedi
[Setup e configurazione](/plugins/sdk-setup#setup-entry) per capire quando questo è importante.

In pratica, abbina `defineSetupPluginEntry(...)` alle famiglie ristrette di helper setup:

- `openclaw/plugin-sdk/setup-runtime` per helper di setup sicuri per il runtime come
  adapter di patch setup import-safe, output di note lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxy di setup delegati
- `openclaw/plugin-sdk/channel-setup` per superfici di setup con installazione facoltativa
- `openclaw/plugin-sdk/setup-tools` per helper di setup/installazione CLI/archivio/documentazione

Mantieni SDK pesanti, registrazione CLI e servizi runtime a lunga durata nell'entry completa.

## Modalità di registrazione

`api.registrationMode` indica al tuo plugin come è stato caricato:

| Modalità          | Quando                              | Cosa registrare                                                                        |
| ----------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| `"full"`          | Avvio normale del gateway           | Tutto                                                                                  |
| `"setup-only"`    | Canale disabilitato/non configurato | Solo registrazione del canale                                                          |
| `"setup-runtime"` | Flusso di setup con runtime disponibile | Registrazione del canale più solo il runtime leggero necessario prima del caricamento dell'entry completa |
| `"cli-metadata"`  | Help root / raccolta metadati CLI   | Solo descrittori CLI                                                                   |

`defineChannelPluginEntry` gestisce automaticamente questa suddivisione. Se usi
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

Tratta `"setup-runtime"` come la finestra in cui devono esistere superfici di avvio
solo setup senza rientrare nel runtime completo del canale bundled. Gli usi adatti sono
registrazione del canale, route HTTP sicure per il setup, metodi gateway sicuri per il setup e
helper di setup delegati. Servizi in background pesanti, registrar CLI e
bootstrap di SDK provider/client appartengono ancora a `"full"`.

Per i registrar CLI in particolare:

- usa `descriptors` quando il registrar possiede uno o più comandi root e
  vuoi che OpenClaw carichi lazy il modulo CLI reale alla prima invocazione
- assicurati che quei descrittori coprano ogni root di comando di primo livello esposta dal
  registrar
- usa solo `commands` per i percorsi di compatibilità eager

## Forme dei plugin

OpenClaw classifica i plugin caricati in base al loro comportamento di registrazione:

| Forma                 | Descrizione                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo di capacità (ad esempio solo provider)     |
| **hybrid-capability** | Più tipi di capacità (ad esempio provider + speech) |
| **hook-only**         | Solo hook, nessuna capacità                        |
| **non-capability**    | Strumenti/comandi/servizi ma nessuna capacità      |

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin.

## Correlati

- [Panoramica SDK](/plugins/sdk-overview) — API di registrazione e riferimento dei sottopercorsi
- [Helper runtime](/plugins/sdk-runtime) — `api.runtime` e `createPluginRuntimeStore`
- [Setup e configurazione](/plugins/sdk-setup) — manifest, setup entry, caricamento differito
- [Plugin di canale](/plugins/sdk-channel-plugins) — costruzione dell'oggetto `ChannelPlugin`
- [Plugin provider](/plugins/sdk-provider-plugins) — registrazione provider e hook
