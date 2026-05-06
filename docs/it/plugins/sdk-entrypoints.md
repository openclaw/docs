---
read_when:
    - È necessaria la firma di tipo esatta di definePluginEntry o defineChannelPluginEntry
    - Vuoi comprendere la modalità di registrazione (full vs setup vs metadati CLI)
    - Stai consultando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso dei Plugin
x-i18n:
    generated_at: "2026-05-06T09:02:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Ogni Plugin esporta un oggetto di entry predefinito. L'SDK fornisce tre helper per
crearli.

Per i Plugin installati, `package.json` dovrebbe indirizzare il caricamento runtime
al JavaScript compilato quando disponibile:

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

`extensions` e `setupEntry` restano entry sorgente valide per lo sviluppo in
workspace e checkout git. `runtimeExtensions` e `runtimeSetupEntry` sono preferiti
quando OpenClaw carica un pacchetto installato e consentono ai pacchetti npm di evitare
la compilazione TypeScript a runtime. Le entry runtime esplicite sono obbligatorie:
`runtimeSetupEntry` richiede `setupEntry`, e gli artefatti `runtimeExtensions` o
`runtimeSetupEntry` mancanti fanno fallire installazione/rilevamento invece di
ripiegare silenziosamente sul sorgente. Se un pacchetto installato dichiara solo
una entry sorgente TypeScript, OpenClaw userà un peer `dist/*.js` compilato
corrispondente quando esiste, poi ripiegherà sul sorgente TypeScript.

Tutti i percorsi di entry devono restare all'interno della directory del pacchetto
Plugin. Le entry runtime e i peer JavaScript compilati dedotti non rendono valido un
percorso sorgente `extensions` o `setupEntry` che esce dalla directory.

<Tip>
  **Cerchi una guida passo passo?** Consulta [Plugin di canale](/it/plugins/sdk-channel-plugins)
  o [Plugin provider](/it/plugins/sdk-provider-plugins) per guide dettagliate.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Per Plugin provider, Plugin di strumenti, Plugin hook e tutto ciò che **non** è
un canale di messaggistica.

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
- OpenClaw risolve e memoizza quello schema al primo accesso, quindi i builder di
  schema costosi vengono eseguiti una sola volta.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Avvolge `definePluginEntry` con cablaggio specifico per il canale. Chiama
automaticamente `api.registerChannel({ plugin })`, espone un seam opzionale di
metadati CLI per l'help root e vincola `registerFull` alla modalità di registrazione.

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

- `setRuntime` viene chiamato durante la registrazione così puoi memorizzare il riferimento
  al runtime (in genere tramite `createPluginRuntimeStore`). Viene saltato durante la
  cattura dei metadati CLI.
- `registerCliMetadata` viene eseguito durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` e
  `api.registrationMode === "full"`.
  Usalo come sede canonica per i descrittori CLI posseduti dal canale, così l'help root
  resta non attivante, gli snapshot di discovery includono metadati statici dei comandi e
  la normale registrazione dei comandi CLI resta compatibile con i caricamenti completi dei Plugin.
- La registrazione di discovery è non attivante, non priva di import. OpenClaw può
  valutare la entry del Plugin attendibile e il modulo del Plugin di canale per creare lo
  snapshot, quindi mantieni gli import top-level privi di effetti collaterali e metti socket,
  client, worker e servizi dietro percorsi solo `"full"`.
- `registerFull` viene eseguito solo quando `api.registrationMode === "full"`. Viene saltato
  durante il caricamento solo setup.
- Come `definePluginEntry`, `configSchema` può essere una factory lazy e OpenClaw
  memoizza lo schema risolto al primo accesso.
- Per i comandi CLI root posseduti dal Plugin, preferisci `api.registerCli(..., { descriptors: [...] })`
  quando vuoi che il comando resti caricato in modo lazy senza sparire dall'albero di parsing
  della CLI root. Per i Plugin di canale, preferisci registrare quei descrittori
  da `registerCliMetadata(...)` e mantieni `registerFull(...)` focalizzato sul lavoro solo runtime.
- Se `registerFull(...)` registra anche metodi RPC del Gateway, mantienili su un
  prefisso specifico del Plugin. Gli spazi dei nomi amministrativi core riservati (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) vengono sempre forzati a
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Per il file leggero `setup-entry.ts`. Restituisce solo `{ plugin }` senza
cablaggio runtime o CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carica questo al posto della entry completa quando un canale è disabilitato,
non configurato o quando il caricamento differito è abilitato. Consulta
[Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per sapere quando è rilevante.

In pratica, abbina `defineSetupPluginEntry(...)` alle famiglie ristrette di helper di setup:

- `openclaw/plugin-sdk/setup-runtime` per helper di setup sicuri per il runtime, come
  adattatori di patch di setup sicuri da importare, output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxy di setup delegati
- `openclaw/plugin-sdk/channel-setup` per superfici di setup di installazione opzionale
- `openclaw/plugin-sdk/setup-tools` per helper di setup/installazione CLI/archivio/docs

Mantieni SDK pesanti, registrazione CLI e servizi runtime a lunga durata nella
entry completa.

I canali workspace bundled che separano superfici di setup e runtime possono usare
in alternativa `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract`. Quel contratto consente alla
entry di setup di mantenere export Plugin/segreti sicuri per il setup, pur esponendo
un setter runtime:

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

Usa quel contratto bundled solo quando i flussi di setup hanno davvero bisogno di un setter
runtime leggero prima che venga caricata la entry completa del canale.

## Modalità di registrazione

`api.registrationMode` indica al tuo Plugin come è stato caricato:

| Modalità          | Quando                               | Cosa registrare                                                                                                                 |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Avvio normale del Gateway            | Tutto                                                                                                                           |
| `"discovery"`     | Discovery delle capability sola lettura | Registrazione del canale più descrittori CLI statici; il codice della entry può caricarsi, ma salta socket, worker, client e servizi |
| `"setup-only"`    | Canale disabilitato/non configurato  | Solo registrazione del canale                                                                                                   |
| `"setup-runtime"` | Flusso di setup con runtime disponibile | Registrazione del canale più solo il runtime leggero necessario prima del caricamento della entry completa                      |
| `"cli-metadata"`  | Help root / cattura metadati CLI     | Solo descrittori CLI                                                                                                            |

`defineChannelPluginEntry` gestisce automaticamente questa suddivisione. Se usi
direttamente `definePluginEntry` per un canale, controlla tu stesso la modalità:

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

La modalità discovery crea uno snapshot di registro non attivante. Può comunque valutare
la entry del Plugin e l'oggetto del Plugin di canale così OpenClaw può registrare le
capability del canale e i descrittori CLI statici. Tratta la valutazione del modulo in
discovery come attendibile ma leggera: niente client di rete, sottoprocessi, listener,
connessioni a database, worker in background, letture di credenziali o altri effetti
collaterali runtime live a livello top-level.

Tratta `"setup-runtime"` come la finestra in cui le superfici di avvio solo setup devono
esistere senza rientrare nel runtime completo del canale bundled. Sono adatti
registrazione del canale, route HTTP sicure per il setup, metodi Gateway sicuri per il setup e
helper di setup delegati. Servizi in background pesanti, registrar CLI e bootstrap di
SDK provider/client appartengono comunque a `"full"`.

Per i registrar CLI nello specifico:

- usa `descriptors` quando il registrar possiede uno o più comandi root e vuoi
  che OpenClaw carichi in modo lazy il vero modulo CLI alla prima invocazione
- assicurati che quei descrittori coprano ogni root di comando top-level esposta dal
  registrar
- limita i nomi dei comandi dei descrittori a lettere, numeri, trattino e underscore,
  iniziando con una lettera o un numero; OpenClaw rifiuta i nomi di descrittore fuori
  da quella forma e rimuove le sequenze di controllo del terminale dalle descrizioni prima
  di renderizzare l'help
- usa solo `commands` soltanto per percorsi di compatibilità eager

## Forme dei Plugin

OpenClaw classifica i plugin caricati in base al loro comportamento di registrazione:

| Forma                 | Descrizione                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo di capacità (ad es. solo provider)         |
| **hybrid-capability** | Più tipi di capacità (ad es. provider + voce)      |
| **hook-only**         | Solo hook, nessuna capacità                        |
| **non-capability**    | Strumenti/comandi/servizi ma nessuna capacità      |

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin.

## Correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview) - API di registrazione e riferimento dei sottopercorsi
- [Helper di runtime](/it/plugins/sdk-runtime) - `api.runtime` e `createPluginRuntimeStore`
- [Setup e configurazione](/it/plugins/sdk-setup) - manifest, voce di setup, caricamento differito
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - creazione dell'oggetto `ChannelPlugin`
- [Plugin provider](/it/plugins/sdk-provider-plugins) - registrazione dei provider e hook
