---
read_when:
    - Stai aggiungendo una procedura guidata di configurazione a un Plugin
    - Devi capire `setup-entry.ts` rispetto a `index.ts`
    - Stai definendo schemi di configurazione del Plugin o metadati `openclaw` in package.json
sidebarTitle: Setup and Config
summary: Procedure guidate di configurazione, `setup-entry.ts`, schemi di config e metadati di package.json
title: Configurazione e setup del Plugin
x-i18n:
    generated_at: "2026-04-21T08:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configurazione e setup del Plugin

Riferimento per il packaging del Plugin (metadati `package.json`), manifest
(`openclaw.plugin.json`), entry di setup e schemi di configurazione.

<Tip>
  **Cerchi una guida passo passo?** Le guide how-to trattano il packaging nel contesto:
  [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugin provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del package

Il tuo `package.json` deve avere un campo `openclaw` che dice al sistema dei plugin cosa
fornisce il tuo Plugin:

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

**Plugin provider / baseline di pubblicazione ClawHub:**

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

Se pubblichi il Plugin esternamente su ClawHub, quei campi `compat` e `build`
sono obbligatori. Gli snippet canonici di pubblicazione si trovano in
`docs/snippets/plugin-publish/`.

### Campi `openclaw`

| Campo        | Tipo       | Descrizione                                                                                              |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | File entry point (relativi alla root del package)                                                        |
| `setupEntry` | `string`   | Entry leggera solo per il setup (facoltativa)                                                            |
| `channel`    | `object`   | Metadati del catalogo canale per setup, picker, quickstart e superfici di stato                         |
| `providers`  | `string[]` | ID provider registrati da questo Plugin                                                                  |
| `install`    | `object`   | Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag del comportamento di avvio                                                                           |

### `openclaw.channel`

`openclaw.channel` è un metadato di package leggero per il discovery del canale e le
superfici di setup prima del caricamento del runtime.

| Campo                                  | Tipo       | Significato                                                                |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canale canonico.                                                        |
| `label`                                | `string`   | Etichetta primaria del canale.                                             |
| `selectionLabel`                       | `string`   | Etichetta picker/setup quando deve differire da `label`.                   |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per cataloghi canale e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso docs per link di setup e selezione.                               |
| `docsLabel`                            | `string`   | Etichetta override usata per i link docs quando deve differire dall'ID del canale. |
| `blurb`                                | `string`   | Breve descrizione di onboarding/catalogo.                                  |
| `order`                                | `number`   | Ordinamento nei cataloghi dei canali.                                      |
| `aliases`                              | `string[]` | Alias di lookup aggiuntivi per la selezione del canale.                    |
| `preferOver`                           | `string[]` | ID di plugin/canali a priorità inferiore che questo canale deve superare.  |
| `systemImage`                          | `string`   | Nome opzionale di icona/system-image per cataloghi UI del canale.          |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei link docs nelle superfici di selezione.           |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso docs invece di un link docs etichettato nel testo di selezione. |
| `selectionExtras`                      | `string[]` | Brevi stringhe aggiuntive accodate nel testo di selezione.                 |
| `markdownCapable`                      | `boolean`  | Segna il canale come compatibile con Markdown per le decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per setup, liste configurate e superfici docs. |
| `quickstartAllowFrom`                  | `boolean`  | Fa opt-in del canale nel flusso standard quickstart `allowFrom`.           |
| `forceAccountBinding`                  | `boolean`  | Richiede un binding esplicito dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la lookup della sessione quando risolve i target di annuncio per questo canale. |

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

- `configured`: include il canale nelle superfici di elenco configurato/stile stato
- `setup`: include il canale nei picker interattivi di setup/configurazione
- `docs`: segna il canale come rivolto al pubblico nelle superfici docs/navigazione

`showConfigured` e `showInSetup` restano supportati come alias legacy. Preferisci
`exposure`.

### `openclaw.install`

`openclaw.install` è metadato del package, non metadato del manifest.

| Campo                        | Tipo                 | Significato                                                                       |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Specifica npm canonica per i flussi di installazione/aggiornamento.               |
| `localPath`                  | `string`             | Percorso di installazione locale di sviluppo o bundled.                           |
| `defaultChoice`              | `"npm"` \| `"local"` | Sorgente di installazione preferita quando entrambe sono disponibili.             |
| `minHostVersion`             | `string`             | Versione minima supportata di OpenClaw nella forma `>=x.y.z`.                     |
| `allowInvalidConfigRecovery` | `boolean`            | Consente ai flussi di reinstallazione dei plugin bundled di recuperare da specifici errori di config obsoleta. |

Se `minHostVersion` è impostato, sia l'installazione sia il caricamento del registro manifest la fanno rispettare
entrambi. Gli host più vecchi saltano il Plugin; le stringhe di versione non valide vengono rifiutate.

`allowInvalidConfigRecovery` non è un bypass generale per config non valide. È
solo per il recupero ristretto dei plugin bundled, così reinstallazione/setup può riparare residui noti
di aggiornamento come un percorso mancante di un plugin bundled o una voce obsoleta `channels.<id>`
per quello stesso plugin. Se la config è non valida per motivi non correlati, l'installazione
continua a fallire in modo fail-closed e dice all'operatore di eseguire `openclaw doctor --fix`.

### Caricamento completo differito

I plugin di canale possono fare opt-in al caricamento differito con:

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

Quando è abilitato, OpenClaw carica solo `setupEntry` durante la fase di startup
pre-listen, anche per canali già configurati. L'entry completa viene caricata dopo che
il gateway inizia ad ascoltare.

<Warning>
  Abilita il caricamento differito solo quando il tuo `setupEntry` registra tutto ciò di cui il
  gateway ha bisogno prima di iniziare ad ascoltare (registrazione del canale, route HTTP,
  metodi gateway). Se l'entry completa possiede capacità di startup richieste, mantieni
  il comportamento predefinito.
</Warning>

Se il tuo setup/full entry registra metodi RPC del gateway, mantienili su un
prefisso specifico del plugin. I namespace admin core riservati (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e si risolvono
sempre a `operator.admin`.

## Manifest del Plugin

Ogni Plugin nativo deve distribuire un `openclaw.plugin.json` nella root del package.
OpenClaw lo usa per validare la config senza eseguire il codice del Plugin.

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

Anche i plugin senza config devono distribuire uno schema. Uno schema vuoto è valido:

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

Per i package plugin, usa il comando ClawHub specifico per package:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L'alias legacy di pubblicazione solo-Skill è per le Skills. I package plugin devono
sempre usare `clawhub package publish`.

## Entry di setup

Il file `setup-entry.ts` è un'alternativa leggera a `index.ts` che
OpenClaw carica quando ha bisogno solo delle superfici di setup (onboarding, riparazione della config,
ispezione del canale disabilitato).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice runtime pesante (librerie crittografiche, registrazioni CLI,
servizi in background) durante i flussi di setup.

I canali workspace bundled che mantengono esportazioni setup-safe in moduli sidecar possono
usare `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract` invece di
`defineSetupPluginEntry(...)`. Quel contratto bundled supporta anche un export `runtime`
facoltativo, così il wiring del runtime in fase di setup può restare leggero ed esplicito.

**Quando OpenClaw usa `setupEntry` invece dell'entry completa:**

- Il canale è disabilitato ma ha bisogno di superfici di setup/onboarding
- Il canale è abilitato ma non configurato
- Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Cosa deve registrare `setupEntry`:**

- L'oggetto Plugin del canale (tramite `defineSetupPluginEntry`)
- Eventuali route HTTP richieste prima del listen del gateway
- Eventuali metodi gateway necessari durante lo startup

Quei metodi gateway di startup dovrebbero comunque evitare i namespace admin
core riservati come `config.*` o `update.*`.

**Cosa NON dovrebbe includere `setupEntry`:**

- Registrazioni CLI
- Servizi in background
- Import runtime pesanti (crypto, SDK)
- Metodi gateway necessari solo dopo lo startup

### Import ristretti degli helper di setup

Per i percorsi hot solo-setup, preferisci i seam stretti degli helper di setup invece del più ampio
ombrello `plugin-sdk/setup` quando ti serve solo una parte della superficie di setup:

| Percorso import                     | Usalo per                                                                                | Export chiave                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime in fase di setup che restano disponibili in `setupEntry` / startup canale differito | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter di setup account consapevoli dell'ambiente                                        | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper CLI/archive/docs per setup/installazione                                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Usa il seam più ampio `plugin-sdk/setup` quando vuoi l'intera toolbox condivisa di setup,
inclusi helper di patch della config come
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch del setup restano sicuri da importare nel percorso hot. La loro
lookup della surface di contratto bundled per la promozione single-account è lazy, quindi importare
`plugin-sdk/setup-runtime` non carica eagerly il discovery della surface di contratto bundled prima che l'adapter venga effettivamente usato.

### Promozione single-account di proprietà del canale

Quando un canale passa da una config top-level single-account a
`channels.<id>.accounts.*`, il comportamento condiviso predefinito è spostare i valori
scoped per account promossi in `accounts.default`.

I canali bundled possono restringere o sovrascrivere quella promozione tramite la loro
surface di contratto setup:

- `singleAccountKeysToMove`: chiavi top-level extra che devono essere spostate nell'account
  promosso
- `namedAccountPromotionKeys`: quando esistono già account con nome, solo queste
  chiavi vengono spostate nell'account promosso; le chiavi condivise di policy/delivery restano alla root
  del canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente
  riceve i valori promossi

Matrix è l'esempio bundled attuale. Se esiste già esattamente un account Matrix con nome,
oppure se `defaultAccount` punta a una chiave non canonica esistente come
`Ops`, la promozione preserva quell'account invece di creare una nuova voce
`accounts.default`.

## Schema di configurazione

La config del Plugin viene validata rispetto allo schema JSON nel tuo manifest. Gli utenti
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

Il tuo Plugin riceve questa config come `api.pluginConfig` durante la registrazione.

Per la config specifica del canale, usa invece la sezione di configurazione del canale:

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

## Procedure guidate di setup

I plugin di canale possono fornire procedure guidate di setup interattive per `openclaw onboard`.
La procedura guidata è un oggetto `ChannelSetupWizard` sul `ChannelPlugin`:

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
Vedi i package plugin bundled (per esempio il plugin Discord `src/channel.setup.ts`) per
esempi completi.

Per prompt allowlist DM che richiedono solo il flusso standard
`note -> prompt -> parse -> merge -> patch`, preferisci gli helper condivisi di setup
da `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Per blocchi di stato del setup del canale che variano solo per etichette, punteggi e
righe extra facoltative, preferisci `createStandardChannelSetupStatus(...)` da
`openclaw/plugin-sdk/setup` invece di costruire a mano lo stesso oggetto `status` in
ogni Plugin.

Per superfici di setup facoltative che devono apparire solo in determinati contesti, usa
`createOptionalChannelSetupSurface` da `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Restituisce { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` espone anche i builder di livello più basso
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando ti serve solo una metà di
quella superficie di installazione facoltativa.

L'adapter/procedura guidata facoltativi generati falliscono in modo fail-closed sulle vere scritture di config. Riutilizzano un singolo messaggio che richiede l'installazione tra `validateInput`,
`applyAccountConfig` e `finalize`, e aggiungono un link docs quando `docsPath` è
impostato.

Per UI di setup supportate da binario, preferisci gli helper delegati condivisi invece di
copiare la stessa colla binary/status in ogni canale:

- `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette,
  hint, punteggi e rilevamento del binario
- `createCliPathTextInput(...)` per input di testo basati su path
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare a
  una procedura guidata completa più pesante in modo lazy
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo
  delegare una decisione `textInputs[*].shouldPrompt`

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/it/tools/clawhub) o npm, poi installa:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw prova prima ClawHub e poi fa fallback automatico a npm. Puoi anche
forzare esplicitamente ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

Non esiste un override corrispondente `npm:`. Usa la normale specifica di package npm quando
vuoi il percorso npm dopo il fallback da ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin nel repo:** posizionali sotto l'albero workspace dei plugin bundled e vengono automaticamente
rilevati durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Per installazioni provenienti da npm, `openclaw plugins install` esegue
  `npm install --ignore-scripts` (nessuno script lifecycle). Mantieni gli alberi delle dipendenze del plugin
  in puro JS/TS ed evita package che richiedono build `postinstall`.
</Info>

I plugin bundled di proprietà OpenClaw sono l'unica eccezione alla riparazione in fase di startup: quando una
installazione pacchettizzata ne vede uno abilitato dalla config del plugin, dalla config legacy del canale o
dal suo manifest bundled default-enabled, lo startup installa le dipendenze runtime mancanti di quel plugin prima dell'import. I plugin di terze parti non dovrebbero fare affidamento sulle installazioni in startup; continua a usare l'installer esplicito dei plugin.

## Correlati

- [Entry point SDK](/it/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Manifest del Plugin](/it/plugins/manifest) -- riferimento completo dello schema del manifest
- [Creare Plugin](/it/plugins/building-plugins) -- guida introduttiva passo per passo
