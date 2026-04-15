---
read_when:
    - Stai aggiungendo una procedura guidata di configurazione a un Plugin
    - Devi comprendere `setup-entry.ts` rispetto a `index.ts`
    - Stai definendo gli schemi di configurazione del plugin o i metadati `openclaw` di package.json
sidebarTitle: Setup and Config
summary: Procedure guidate di configurazione, setup-entry.ts, schemi di configurazione e metadati di package.json
title: Configurazione e setup del Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf28e25e381a4a38ac478e531586f59612e1a278732597375f87c2eeefc521b
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configurazione e setup del Plugin

Riferimento per il packaging dei plugin (metadati di `package.json`), manifest
(`openclaw.plugin.json`), voci di setup e schemi di configurazione.

<Tip>
  **Cerchi una guida passo passo?** Le guide pratiche trattano il packaging nel contesto:
  [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugin provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del pacchetto

Il tuo `package.json` deve includere un campo `openclaw` che indica al sistema dei plugin cosa
fornisce il tuo plugin:

**Plugin di canale:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin provider / riferimento base per la pubblicazione su ClawHub:**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Se pubblichi il plugin esternamente su ClawHub, i campi `compat` e `build`
sono obbligatori. Gli snippet canonici per la pubblicazione si trovano in
`docs/snippets/plugin-publish/`.

### Campi `openclaw`

| Campo        | Tipo       | Descrizione                                                                                             |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | File dei punti di ingresso (relativi alla radice del pacchetto)                                        |
| `setupEntry` | `string`   | Punto di ingresso leggero solo per il setup (facoltativo)                                              |
| `channel`    | `object`   | Metadati del catalogo canali per setup, selettore, avvio rapido e superfici di stato                  |
| `providers`  | `string[]` | ID dei provider registrati da questo plugin                                                            |
| `install`    | `object`   | Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag del comportamento di avvio                                                                        |

### `openclaw.channel`

`openclaw.channel` è un metadato economico di pacchetto per la scoperta dei canali e le
superfici di setup prima che il runtime venga caricato.

| Campo                                  | Tipo       | Significato                                                               |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canonico del canale.                                                   |
| `label`                                | `string`   | Etichetta principale del canale.                                          |
| `selectionLabel`                       | `string`   | Etichetta per selettore/setup quando deve differire da `label`.           |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per cataloghi canali e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso della documentazione per setup e link di selezione.              |
| `docsLabel`                            | `string`   | Etichetta alternativa usata per i link alla documentazione quando deve differire dall'ID del canale. |
| `blurb`                                | `string`   | Breve descrizione per onboarding/catalogo.                                |
| `order`                                | `number`   | Ordine di ordinamento nei cataloghi dei canali.                           |
| `aliases`                              | `string[]` | Alias aggiuntivi per la selezione del canale.                             |
| `preferOver`                           | `string[]` | ID di plugin/canali a priorità inferiore che questo canale dovrebbe superare. |
| `systemImage`                          | `string`   | Nome facoltativo dell'icona/system-image per i cataloghi UI dei canali.   |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei link alla documentazione nelle superfici di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso della documentazione invece di un link etichettato nella copia di selezione. |
| `selectionExtras`                      | `string[]` | Stringhe brevi aggiuntive appese nella copia di selezione.                |
| `markdownCapable`                      | `boolean`  | Indica che il canale supporta Markdown per le decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per setup, elenchi configurati e superfici documentali. |
| `quickstartAllowFrom`                  | `boolean`  | Include questo canale nel flusso standard di setup rapido `allowFrom`.    |
| `forceAccountBinding`                  | `boolean`  | Richiede un'associazione esplicita dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la ricerca della sessione quando si risolvono le destinazioni di annuncio per questo canale. |

Esempio:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` supporta:

- `configured`: include il canale nelle superfici di elenco configurato/in stile stato
- `setup`: include il canale nei selettori interattivi di setup/configurazione
- `docs`: contrassegna il canale come rivolto al pubblico nelle superfici di documentazione/navigazione

`showConfigured` e `showInSetup` restano supportati come alias legacy. È preferibile
`exposure`.

### `openclaw.install`

`openclaw.install` è un metadato di pacchetto, non un metadato del manifest.

| Campo                        | Tipo                 | Significato                                                                      |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Specifica npm canonica per i flussi di installazione/aggiornamento.             |
| `localPath`                  | `string`             | Percorso di installazione locale di sviluppo o bundled.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Sorgente di installazione preferita quando entrambe sono disponibili.           |
| `minHostVersion`             | `string`             | Versione minima supportata di OpenClaw nel formato `>=x.y.z`.                   |
| `allowInvalidConfigRecovery` | `boolean`            | Consente ai flussi di reinstallazione dei plugin bundled di recuperare da specifici errori di configurazione obsoleta. |

Se `minHostVersion` è impostato, sia l'installazione sia il caricamento del registro dei manifest la applicano.
Gli host più vecchi ignorano il plugin; le stringhe di versione non valide vengono rifiutate.

`allowInvalidConfigRecovery` non è un bypass generale per configurazioni non valide. Serve
solo per un recupero mirato dei plugin bundled, in modo che reinstallazione/setup possano riparare
residui noti di aggiornamenti, come un percorso mancante del plugin bundled o una voce `channels.<id>`
obsoleta per quello stesso plugin. Se la configurazione è non valida per motivi non correlati, l'installazione
continua a fallire in modo sicuro e indica all'operatore di eseguire `openclaw doctor --fix`.

### Caricamento completo differito

I plugin di canale possono abilitare il caricamento differito con:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Quando è abilitato, OpenClaw carica solo `setupEntry` durante la fase di avvio pre-listen,
anche per i canali già configurati. Il punto di ingresso completo viene caricato dopo che il
Gateway inizia ad ascoltare.

<Warning>
  Abilita il caricamento differito solo quando il tuo `setupEntry` registra tutto ciò di cui il
  Gateway ha bisogno prima che inizi ad ascoltare (registrazione del canale, route HTTP,
  metodi del Gateway). Se il punto di ingresso completo gestisce capacità di avvio richieste, mantieni
  il comportamento predefinito.
</Warning>

Se il tuo setup/full entry registra metodi RPC del Gateway, mantienili su un
prefisso specifico del plugin. Gli spazi dei nomi amministrativi core riservati (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e vengono sempre risolti
in `operator.admin`.

## Manifest del Plugin

Ogni plugin nativo deve includere un file `openclaw.plugin.json` nella radice del pacchetto.
OpenClaw lo usa per validare la configurazione senza eseguire il codice del plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Per i plugin di canale, aggiungi `kind` e `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Anche i plugin senza configurazione devono includere uno schema. Uno schema vuoto è valido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Vedi [Manifest del Plugin](/it/plugins/manifest) per il riferimento completo dello schema.

## Pubblicazione su ClawHub

Per i pacchetti plugin, usa il comando ClawHub specifico per il pacchetto:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L'alias legacy di pubblicazione solo per Skills è destinato alle Skills. I pacchetti plugin devono
sempre usare `clawhub package publish`.

## Punto di ingresso di setup

Il file `setup-entry.ts` è un'alternativa leggera a `index.ts` che
OpenClaw carica quando ha bisogno solo delle superfici di setup (onboarding, riparazione della configurazione,
ispezione dei canali disabilitati).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice runtime pesante (librerie crittografiche, registrazioni CLI,
servizi in background) durante i flussi di setup.

I canali bundled del workspace che mantengono esportazioni sicure per il setup in moduli sidecar possono
usare `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract` invece di
`defineSetupPluginEntry(...)`. Quel contratto bundled supporta anche un export `runtime`
facoltativo, così il wiring runtime in fase di setup può restare leggero ed esplicito.

**Quando OpenClaw usa `setupEntry` invece del punto di ingresso completo:**

- Il canale è disabilitato ma richiede superfici di setup/onboarding
- Il canale è abilitato ma non configurato
- Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Cosa deve registrare `setupEntry`:**

- L'oggetto plugin del canale (tramite `defineSetupPluginEntry`)
- Eventuali route HTTP richieste prima che il Gateway inizi ad ascoltare
- Eventuali metodi del Gateway necessari durante l'avvio

Questi metodi di avvio del Gateway devono comunque evitare spazi dei nomi amministrativi core
riservati come `config.*` o `update.*`.

**Cosa NON dovrebbe includere `setupEntry`:**

- Registrazioni CLI
- Servizi in background
- Import runtime pesanti (crypto, SDK)
- Metodi del Gateway necessari solo dopo l'avvio

### Import helper di setup mirati

Per i percorsi rapidi solo setup, preferisci i punti di accesso helper di setup mirati invece del più ampio
ombrello `plugin-sdk/setup` quando ti serve solo una parte della superficie di setup:

| Percorso di importazione             | Usalo per                                                                                | Esportazioni principali                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`           | helper runtime in fase di setup che restano disponibili in `setupEntry` / avvio differito del canale | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`   | adapter di setup dell'account sensibili all'ambiente                                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`             | helper per CLI/installazione/archivi/documentazione durante il setup                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Usa il punto di accesso più ampio `plugin-sdk/setup` quando vuoi l'intera
toolbox di setup condivisa, inclusi gli helper di patch della configurazione come
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch del setup restano sicuri da importare nei percorsi critici. La loro ricerca della superficie di contratto
bundled per la promozione di un singolo account è lazy, quindi importare
`plugin-sdk/setup-runtime` non carica in modo eager la scoperta della superficie di contratto bundled prima che l'adapter venga effettivamente usato.

### Promozione del singolo account gestita dal canale

Quando un canale viene aggiornato da una configurazione top-level con singolo account a
`channels.<id>.accounts.*`, il comportamento condiviso predefinito sposta i valori con ambito account promossi in
`accounts.default`.

I canali bundled possono restringere o sovrascrivere questa promozione tramite la loro superficie di contratto di setup:

- `singleAccountKeysToMove`: chiavi top-level aggiuntive che devono essere spostate nell'account
  promosso
- `namedAccountPromotionKeys`: quando esistono già account con nome, solo queste
  chiavi vengono spostate nell'account promosso; le chiavi condivise di policy/delivery restano alla radice del
  canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente
  riceve i valori promossi

Matrix è l'esempio bundled attuale. Se esiste già esattamente un account Matrix con nome,
oppure se `defaultAccount` punta a una chiave non canonica esistente come
`Ops`, la promozione preserva quell'account invece di creare una nuova voce
`accounts.default`.

## Schema di configurazione

La configurazione del plugin viene validata rispetto allo schema JSON nel tuo manifest. Gli utenti
configurano i plugin tramite:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Il tuo plugin riceve questa configurazione come `api.pluginConfig` durante la registrazione.

Per la configurazione specifica del canale, usa invece la sezione di configurazione del canale:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Costruire schemi di configurazione del canale

Usa `buildChannelConfigSchema` da `openclaw/plugin-sdk/core` per convertire uno
schema Zod nel wrapper `ChannelConfigSchema` che OpenClaw valida:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Procedure guidate di configurazione

I plugin di canale possono fornire procedure guidate di configurazione interattive per `openclaw onboard`.
La procedura guidata è un oggetto `ChannelSetupWizard` nel `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

Il tipo `ChannelSetupWizard` supporta `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e altro.
Vedi i pacchetti dei plugin bundled (per esempio il plugin Discord `src/channel.setup.ts`) per
esempi completi.

Per i prompt di allowlist DM che richiedono solo il flusso standard
`note -> prompt -> parse -> merge -> patch`, preferisci gli helper di setup condivisi
da `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Per i blocchi di stato del setup del canale che variano solo per etichette, punteggi e righe aggiuntive facoltative,
preferisci `createStandardChannelSetupStatus(...)` da
`openclaw/plugin-sdk/setup` invece di costruire manualmente lo stesso oggetto `status` in
ogni plugin.

Per superfici di setup facoltative che dovrebbero comparire solo in determinati contesti, usa
`createOptionalChannelSetupSurface` da `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` espone anche i builder di livello inferiore
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando ti serve solo una metà di
quella superficie di installazione facoltativa.

L'adapter/procedura guidata facoltativi generati falliscono in modo sicuro sulle scritture reali della configurazione. Riutilizzano un unico messaggio che richiede l'installazione tra `validateInput`,
`applyAccountConfig` e `finalize`, e aggiungono un link alla documentazione quando `docsPath` è
impostato.

Per le UI di setup basate su binari, preferisci gli helper delegati condivisi invece di
copiare la stessa logica di binario/stato in ogni canale:

- `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette,
  suggerimenti, punteggi e rilevamento del binario
- `createCliPathTextInput(...)` per input testuali basati su percorso
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare
  lazy a una procedura guidata completa più pesante
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo
  delegare una decisione `textInputs[*].shouldPrompt`

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/it/tools/clawhub) o npm, poi installa:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw prova prima ClawHub e passa automaticamente a npm in caso di fallback. Puoi anche
forzare esplicitamente ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

Non esiste un override `npm:` corrispondente. Usa la normale specifica del pacchetto npm quando
vuoi il percorso npm dopo il fallback di ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin nel repository:** collocali nell'albero workspace dei plugin bundled e verranno scoperti automaticamente
durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Per le installazioni provenienti da npm, `openclaw plugins install` esegue
  `npm install --ignore-scripts` (nessuno script del ciclo di vita). Mantieni l'albero delle dipendenze del plugin
  puro JS/TS ed evita pacchetti che richiedono build `postinstall`.
</Info>

## Correlati

- [Punti di ingresso dell'SDK](/it/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Manifest del Plugin](/it/plugins/manifest) -- riferimento completo dello schema del manifest
- [Creare Plugin](/it/plugins/building-plugins) -- guida introduttiva passo passo
