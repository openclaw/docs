---
read_when:
    - È necessaria la firma di tipo esatta di definePluginEntry o defineChannelPluginEntry
    - Vuoi comprendere la modalità di registrazione (completa vs configurazione vs metadati CLI)
    - Stai consultando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso dei Plugin
x-i18n:
    generated_at: "2026-05-07T13:23:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Ogni plugin esporta un oggetto voce predefinito. L'SDK fornisce tre helper per
crearli.

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

`extensions` e `setupEntry` rimangono voci sorgente valide per lo sviluppo da
workspace e checkout git. `runtimeExtensions` e `runtimeSetupEntry` sono preferite
quando OpenClaw carica un pacchetto installato e consentono ai pacchetti npm di
evitare la compilazione TypeScript a runtime. Le voci runtime esplicite sono
obbligatorie: `runtimeSetupEntry` richiede `setupEntry`, e gli artifact mancanti
di `runtimeExtensions` o `runtimeSetupEntry` fanno fallire installazione/discovery
invece di ripiegare silenziosamente sul sorgente. Se un pacchetto installato
dichiara solo una voce sorgente TypeScript, OpenClaw userà un peer compilato
`dist/*.js` corrispondente quando esiste, quindi ripiegherà sul sorgente
TypeScript.

Tutti i percorsi delle voci devono restare all'interno della directory del
pacchetto del plugin. Le voci runtime e i peer JavaScript compilati inferiti non
rendono valido un percorso sorgente `extensions` o `setupEntry` che esce dalla
directory.

<Tip>
  **Cerchi una guida passo passo?** Consulta [Plugin di canale](/it/plugins/sdk-channel-plugins)
  o [Plugin provider](/it/plugins/sdk-provider-plugins) per guide passo passo.
</Tip>

## `definePluginEntry`

**Importazione:** `openclaw/plugin-sdk/plugin-entry`

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

| Campo          | Tipo                                                             | Obbligatorio | Predefinito          |
| -------------- | ---------------------------------------------------------------- | ------------ | -------------------- |
| `id`           | `string`                                                         | Sì           | -                    |
| `name`         | `string`                                                         | Sì           | -                    |
| `description`  | `string`                                                         | Sì           | -                    |
| `kind`         | `string`                                                         | No           | -                    |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema oggetto vuoto |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sì           | -                    |

- `id` deve corrispondere al tuo manifest `openclaw.plugin.json`.
- `kind` serve per slot esclusivi: `"memory"` o `"context-engine"`.
- `configSchema` può essere una funzione per la valutazione lazy.
- OpenClaw risolve e memorizza quello schema al primo accesso, quindi i builder
  di schema costosi vengono eseguiti una sola volta.

## `defineChannelPluginEntry`

**Importazione:** `openclaw/plugin-sdk/channel-core`

Avvolge `definePluginEntry` con cablaggio specifico per i canali. Chiama
automaticamente `api.registerChannel({ plugin })`, espone un seam opzionale di
metadati CLI per l'help root e limita `registerFull` in base alla modalità di
registrazione.

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
  (tipicamente tramite `createPluginRuntimeStore`). Viene saltato durante la
  cattura dei metadati CLI.
- `registerCliMetadata` viene eseguito durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` e
  `api.registrationMode === "full"`.
  Usalo come punto canonico per i descrittori CLI posseduti dal canale, così
  l'help root resta non attivante, gli snapshot di discovery includono metadati
  statici dei comandi e la normale registrazione dei comandi CLI rimane
  compatibile con i caricamenti completi dei plugin.
- La registrazione di discovery è non attivante, non priva di importazioni.
  OpenClaw può valutare la voce del plugin attendibile e il modulo del plugin di
  canale per costruire lo snapshot, quindi mantieni gli import di primo livello
  privi di effetti collaterali e metti socket, client, worker e servizi dietro
  percorsi solo `"full"`.
- `registerFull` viene eseguito solo quando `api.registrationMode === "full"`.
  Viene saltato durante il caricamento solo setup.
- Come `definePluginEntry`, `configSchema` può essere una factory lazy e OpenClaw
  memorizza lo schema risolto al primo accesso.
- Per i comandi CLI root posseduti dal plugin, preferisci `api.registerCli(..., { descriptors: [...] })`
  quando vuoi che il comando resti caricato in modo lazy senza scomparire
  dall'albero di parsing della CLI root. Per i comandi di funzionalità dei nodi
  accoppiati, preferisci `api.registerNodeCliFeature(...)` così il comando finisce
  sotto `openclaw nodes`. Per altri comandi di plugin annidati, aggiungi
  `parentPath` e registra i comandi sull'oggetto `program` passato al registrar;
  OpenClaw lo risolve al comando padre prima di chiamare il plugin. Per i plugin
  di canale, preferisci registrare quei descrittori da `registerCliMetadata(...)`
  e mantieni `registerFull(...)` concentrato sul lavoro solo runtime.
- Se `registerFull(...)` registra anche metodi RPC del Gateway, tienili su un
  prefisso specifico del plugin. Gli spazi dei nomi admin core riservati
  (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) sono sempre forzati a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importazione:** `openclaw/plugin-sdk/channel-core`

Per il file leggero `setup-entry.ts`. Restituisce solo `{ plugin }`, senza
cablaggio runtime o CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carica questo invece della voce completa quando un canale è disabilitato,
non configurato o quando il caricamento differito è abilitato. Consulta
[Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per capire quando è
rilevante.

In pratica, abbina `defineSetupPluginEntry(...)` alle famiglie ristrette di helper
di setup:

- `openclaw/plugin-sdk/setup-runtime` per helper di setup sicuri per il runtime come
  adapter di patch di setup sicuri da importare, output di note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxy di setup delegati
- `openclaw/plugin-sdk/channel-setup` per superfici di setup a installazione opzionale
- `openclaw/plugin-sdk/setup-tools` per helper CLI/archive/docs di setup/installazione

Mantieni SDK pesanti, registrazione CLI e servizi runtime di lunga durata nella
voce completa.

I canali workspace in bundle che separano superfici di setup e runtime possono
usare invece `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract`. Quel contratto consente alla voce
di setup di mantenere export plugin/secret sicuri per il setup pur esponendo
ancora un setter runtime:

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

Usa quel contratto in bundle solo quando i flussi di setup hanno davvero bisogno
di un setter runtime leggero prima che la voce completa del canale venga caricata.

## Modalità di registrazione

`api.registrationMode` indica al tuo plugin come è stato caricato:

| Modalità          | Quando                             | Cosa registrare                                                                                                        |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Avvio normale del Gateway          | Tutto                                                                                                                  |
| `"discovery"`     | Discovery delle capacità sola lettura | Registrazione del canale più descrittori CLI statici; il codice della voce può caricarsi, ma salta socket, worker, client e servizi |
| `"setup-only"`    | Canale disabilitato/non configurato | Solo registrazione del canale                                                                                          |
| `"setup-runtime"` | Flusso di setup con runtime disponibile | Registrazione del canale più solo il runtime leggero necessario prima che la voce completa venga caricata               |
| `"cli-metadata"`  | Cattura help root / metadati CLI   | Solo descrittori CLI                                                                                                   |

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

La modalità discovery costruisce uno snapshot del registro non attivante. Può
comunque valutare la voce del plugin e l'oggetto del plugin di canale affinché
OpenClaw possa registrare capacità del canale e descrittori CLI statici. Tratta
la valutazione dei moduli in discovery come attendibile ma leggera: niente
client di rete, sottoprocessi, listener, connessioni a database, worker in
background, letture di credenziali o altri effetti collaterali runtime live al
primo livello.

Tratta `"setup-runtime"` come la finestra in cui le superfici di avvio solo setup
devono esistere senza rientrare nel runtime completo del canale in bundle. Buoni
casi d'uso sono registrazione del canale, route HTTP sicure per il setup, metodi
Gateway sicuri per il setup e helper di setup delegati. Servizi pesanti in
background, registrar CLI e bootstrap di SDK provider/client appartengono ancora
a `"full"`.

Per i registrar CLI in particolare:

- usa `descriptors` quando il registratore possiede uno o più comandi radice e vuoi che OpenClaw carichi in modo lazy il modulo CLI reale alla prima invocazione
- assicurati che quei descrittori coprano ogni radice di comando di primo livello esposta dal registratore
- limita i nomi dei comandi dei descrittori a lettere, numeri, trattino e underscore, iniziando con una lettera o un numero; OpenClaw rifiuta i nomi dei descrittori fuori da questa forma e rimuove le sequenze di controllo del terminale dalle descrizioni prima di visualizzare l'aiuto
- usa solo `commands` soltanto per percorsi di compatibilità con caricamento immediato

## Forme dei Plugin

OpenClaw classifica i plugin caricati in base al loro comportamento di registrazione:

| Forma                 | Descrizione                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un solo tipo di capacità (ad es. solo provider)    |
| **hybrid-capability** | Più tipi di capacità (ad es. provider + voce)      |
| **hook-only**         | Solo hook, nessuna capacità                        |
| **non-capability**    | Strumenti/comandi/servizi ma nessuna capacità      |

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview) - API di registrazione e riferimento ai sottopercorsi
- [Helper di runtime](/it/plugins/sdk-runtime) - `api.runtime` e `createPluginRuntimeStore`
- [Configurazione e setup](/it/plugins/sdk-setup) - manifest, voce di setup, caricamento differito
- [Plugin di canale](/it/plugins/sdk-channel-plugins) - creazione dell'oggetto `ChannelPlugin`
- [Plugin provider](/it/plugins/sdk-provider-plugins) - registrazione del provider e hook
