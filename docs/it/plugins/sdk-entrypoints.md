---
read_when:
    - Ti serve la firma di tipo esatta di definePluginEntry o defineChannelPluginEntry
    - Vuoi comprendere la modalità di registrazione (completa vs setup vs metadati CLI)
    - Stai cercando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso del Plugin
x-i18n:
    generated_at: "2026-05-02T08:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Ogni Plugin esporta un oggetto entry predefinito. L'SDK fornisce tre helper per
crearlo.

Per i Plugin installati, `package.json` dovrebbe indirizzare il caricamento runtime al
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
checkout git. `runtimeExtensions` e `runtimeSetupEntry` sono preferiti
quando OpenClaw carica un pacchetto installato e consentono ai pacchetti npm di evitare
la compilazione TypeScript a runtime. Le entry runtime esplicite sono obbligatorie: `runtimeSetupEntry`
richiede `setupEntry`, e gli artefatti `runtimeExtensions` o `runtimeSetupEntry`
mancanti fanno fallire installazione/discovery invece di ripiegare silenziosamente sul sorgente. Se
un pacchetto installato dichiara solo una entry sorgente TypeScript, OpenClaw userà un
peer `dist/*.js` compilato corrispondente quando esiste, poi ripiegherà sul sorgente
TypeScript.

Tutti i percorsi di entry devono rimanere dentro la directory del pacchetto Plugin. Le entry runtime
e i peer JavaScript compilati inferiti non rendono valido un percorso sorgente `extensions` o
`setupEntry` che esce dalla directory.

<Tip>
  **Cerchi una guida passo passo?** Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins)
  o [Plugin provider](/it/plugins/sdk-provider-plugins) per guide dettagliate.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Per Plugin provider, Plugin di strumenti, Plugin hook e qualsiasi cosa che **non** sia
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

| Campo          | Tipo                                                             | Obbligatorio | Predefinito        |
| -------------- | ---------------------------------------------------------------- | ------------ | ------------------ |
| `id`           | `string`                                                         | Sì           | —                  |
| `name`         | `string`                                                         | Sì           | —                  |
| `description`  | `string`                                                         | Sì           | —                  |
| `kind`         | `string`                                                         | No           | —                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema oggetto vuoto |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sì           | —                  |

- `id` deve corrispondere al tuo manifest `openclaw.plugin.json`.
- `kind` serve per slot esclusivi: `"memory"` o `"context-engine"`.
- `configSchema` può essere una funzione per la valutazione lazy.
- OpenClaw risolve e memorizza in cache quello schema al primo accesso, quindi i builder di schema
  costosi vengono eseguiti una sola volta.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Avvolge `definePluginEntry` con cablaggio specifico del canale. Chiama automaticamente
`api.registerChannel({ plugin })`, espone un seam opzionale di metadati CLI per l'help root
e vincola `registerFull` alla modalità di registrazione.

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

| Campo                 | Tipo                                                             | Obbligatorio | Predefinito        |
| --------------------- | ---------------------------------------------------------------- | ------------ | ------------------ |
| `id`                  | `string`                                                         | Sì           | —                  |
| `name`                | `string`                                                         | Sì           | —                  |
| `description`         | `string`                                                         | Sì           | —                  |
| `plugin`              | `ChannelPlugin`                                                  | Sì           | —                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema oggetto vuoto |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No           | —                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No           | —                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No           | —                  |

- `setRuntime` viene chiamato durante la registrazione così puoi conservare il riferimento runtime
  (tipicamente tramite `createPluginRuntimeStore`). Viene saltato durante la cattura dei metadati CLI.
- `registerCliMetadata` viene eseguito durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` e
  `api.registrationMode === "full"`.
  Usalo come posizione canonica per i descrittori CLI di proprietà del canale, così l'help root
  resta non attivante, gli snapshot di discovery includono metadati statici dei comandi e
  la normale registrazione dei comandi CLI resta compatibile con i caricamenti completi dei Plugin.
- La registrazione discovery è non attivante, non priva di import. OpenClaw può
  valutare la entry Plugin attendibile e il modulo Plugin del canale per costruire lo
  snapshot, quindi mantieni gli import top-level privi di effetti collaterali e metti socket,
  client, worker e servizi dietro percorsi solo `"full"`.
- `registerFull` viene eseguito solo quando `api.registrationMode === "full"`. Viene saltato
  durante il caricamento solo setup.
- Come `definePluginEntry`, `configSchema` può essere una factory lazy e OpenClaw
  memorizza in cache lo schema risolto al primo accesso.
- Per i comandi CLI root di proprietà del Plugin, preferisci `api.registerCli(..., { descriptors: [...] })`
  quando vuoi che il comando resti caricato in modo lazy senza sparire dal
  parse tree della CLI root. Per i Plugin di canale, preferisci registrare quei descrittori
  da `registerCliMetadata(...)` e mantieni `registerFull(...)` focalizzato sul lavoro solo runtime.
- Se `registerFull(...)` registra anche metodi RPC del Gateway, mantienili su un
  prefisso specifico del Plugin. Gli spazi dei nomi admin core riservati (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) vengono sempre convertiti forzatamente in
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Per il file leggero `setup-entry.ts`. Restituisce solo `{ plugin }` senza
cablaggio runtime o CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lo carica al posto della entry completa quando un canale è disabilitato,
non configurato o quando il caricamento differito è abilitato. Vedi
[Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per quando questo è rilevante.

In pratica, abbina `defineSetupPluginEntry(...)` alle famiglie ristrette di helper di setup:

- `openclaw/plugin-sdk/setup-runtime` per helper di setup sicuri per il runtime come
  adattatori di patch di setup sicuri da importare, output di note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxy di setup delegati
- `openclaw/plugin-sdk/channel-setup` per superfici di setup di installazione opzionale
- `openclaw/plugin-sdk/setup-tools` per helper di setup/installazione CLI/archivio/documentazione

Mantieni SDK pesanti, registrazione CLI e servizi runtime a lunga durata nella
entry completa.

I canali workspace inclusi che separano superfici di setup e runtime possono usare
`defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract` invece. Quel contratto consente alla
entry di setup di mantenere export Plugin/secrets sicuri per il setup pur esponendo ancora un
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
});
```

Usa quel contratto incluso solo quando i flussi di setup hanno davvero bisogno di un setter runtime
leggero prima che la entry completa del canale venga caricata.

## Modalità di registrazione

`api.registrationMode` indica al tuo Plugin come è stato caricato:

| Modalità          | Quando                            | Cosa registrare                                                                                                         |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Avvio normale del Gateway         | Tutto                                                                                                                   |
| `"discovery"`     | Discovery delle capacità in sola lettura | Registrazione del canale più descrittori CLI statici; il codice entry può essere caricato, ma salta socket, worker, client e servizi |
| `"setup-only"`    | Canale disabilitato/non configurato | Solo registrazione del canale                                                                                           |
| `"setup-runtime"` | Flusso di setup con runtime disponibile | Registrazione del canale più solo il runtime leggero necessario prima che la entry completa venga caricata              |
| `"cli-metadata"`  | Help root / cattura metadati CLI  | Solo descrittori CLI                                                                                                    |

`defineChannelPluginEntry` gestisce automaticamente questa divisione. Se usi
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

La modalità discovery costruisce uno snapshot di registro non attivante. Può comunque valutare
la entry Plugin e l'oggetto Plugin del canale così OpenClaw può registrare le
capacità del canale e i descrittori CLI statici. Tratta la valutazione del modulo in discovery come
attendibile ma leggera: nessun client di rete, sottoprocesso, listener, connessione a database,
worker in background, lettura di credenziali o altri effetti collaterali runtime live al top level.

Tratta `"setup-runtime"` come la finestra in cui le superfici di avvio solo setup devono
esistere senza rientrare nel runtime completo del canale incluso. Buone scelte sono
la registrazione del canale, route HTTP sicure per il setup, metodi Gateway sicuri per il setup e
helper di setup delegati. Servizi pesanti in background, registrar CLI e
bootstrap di SDK provider/client appartengono comunque a `"full"`.

Per i registrar CLI nello specifico:

- usa `descriptors` quando il registrar possiede uno o più comandi root e vuoi
  che OpenClaw carichi in modo lazy il modulo CLI reale alla prima invocazione
- assicurati che quei descrittori coprano ogni root di comando top-level esposta dal
  registrar
- limita i nomi dei comandi nei descrittori a lettere, numeri, trattino e underscore,
  iniziando con una lettera o un numero; OpenClaw rifiuta i nomi descrittore fuori
  da questa forma e rimuove sequenze di controllo terminale dalle descrizioni prima di
  renderizzare l'help
- usa solo `commands` soltanto per percorsi di compatibilità eager

## Forme dei Plugin

OpenClaw classifica i Plugin caricati in base al loro comportamento di registrazione:

| Forma                 | Descrizione                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo di capacità (ad es. solo provider)           |
| **hybrid-capability** | Più tipi di capacità (ad es. provider + speech) |
| **hook-only**         | Solo hook, nessuna capacità                        |
| **non-capability**    | Strumenti/comandi/servizi ma nessuna capacità        |

Usa `openclaw plugins inspect <id>` per vedere la forma di un Plugin.

## Correlati

- [Panoramica dell'SDK](/it/plugins/sdk-overview) — API di registrazione e riferimento dei sottopercorsi
- [Helper di runtime](/it/plugins/sdk-runtime) — `api.runtime` e `createPluginRuntimeStore`
- [Configurazione e impostazioni](/it/plugins/sdk-setup) — manifest, voce di configurazione, caricamento differito
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creazione dell'oggetto `ChannelPlugin`
- [Plugin provider](/it/plugins/sdk-provider-plugins) — registrazione del provider e hook
