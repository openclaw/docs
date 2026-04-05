---
read_when:
    - Stai aggiungendo una procedura guidata di setup a un plugin
    - Hai bisogno di capire `setup-entry.ts` rispetto a `index.ts`
    - Stai definendo schemi di configurazione del plugin o metadati `openclaw` in `package.json`
sidebarTitle: Setup and Config
summary: Procedure guidate di setup, setup-entry.ts, schemi di configurazione e metadati package.json
title: Setup e configurazione dei plugin
x-i18n:
    generated_at: "2026-04-05T14:00:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Setup e configurazione dei plugin

Riferimento per il packaging dei plugin (metadati `package.json`), manifest
(`openclaw.plugin.json`), setup entry e schemi di configurazione.

<Tip>
  **Cerchi una guida passo passo?** Le guide pratiche coprono il packaging nel contesto:
  [Plugin di canale](/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugin provider](/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del pacchetto

Il tuo `package.json` ha bisogno di un campo `openclaw` che dica al sistema plugin
cosa fornisce il tuo plugin:

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

Se pubblichi il plugin esternamente su ClawHub, quei campi `compat` e `build`
sono obbligatori. Gli snippet canonici di pubblicazione si trovano in
`docs/snippets/plugin-publish/`.

### Campi `openclaw`

| Campo        | Tipo       | Descrizione                                                                                         |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | File dei punti di ingresso (relativi alla root del pacchetto)                                       |
| `setupEntry` | `string`   | Entry leggera solo setup (facoltativa)                                                              |
| `channel`    | `object`   | Metadati del catalogo canali per superfici di setup, picker, quickstart e stato                     |
| `providers`  | `string[]` | ID provider registrati da questo plugin                                                             |
| `install`    | `object`   | Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag del comportamento di avvio                                                                     |

### `openclaw.channel`

`openclaw.channel` è un metadato di pacchetto leggero per l'individuazione dei canali e
le superfici di setup prima che il runtime venga caricato.

| Campo                                  | Tipo       | Cosa significa                                                               |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canale canonico.                                                          |
| `label`                                | `string`   | Etichetta principale del canale.                                             |
| `selectionLabel`                       | `string`   | Etichetta del picker/setup quando deve differire da `label`.                 |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per cataloghi di canali e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso documentazione per i link di setup e selezione.                     |
| `docsLabel`                            | `string`   | Override dell'etichetta usata per i link alla documentazione quando deve differire dall'ID del canale. |
| `blurb`                                | `string`   | Breve descrizione per onboarding/catalogo.                                   |
| `order`                                | `number`   | Ordine di ordinamento nei cataloghi dei canali.                              |
| `aliases`                              | `string[]` | Alias aggiuntivi per il lookup nella selezione del canale.                   |
| `preferOver`                           | `string[]` | ID plugin/canale a priorità inferiore rispetto ai quali questo canale deve prevalere. |
| `systemImage`                          | `string`   | Nome facoltativo di icona/immagine di sistema per cataloghi UI dei canali.   |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei link alla documentazione nelle superfici di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso documentazione invece di un link etichettato nella copia di selezione. |
| `selectionExtras`                      | `string[]` | Stringhe brevi aggiuntive aggiunte nella copia di selezione.                 |
| `markdownCapable`                      | `boolean`  | Contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita. |
| `showConfigured`                       | `boolean`  | Controlla se le superfici che elencano i canali configurati mostrano questo canale. |
| `quickstartAllowFrom`                  | `boolean`  | Include questo canale nel flusso standard di setup quickstart `allowFrom`.   |
| `forceAccountBinding`                  | `boolean`  | Richiede binding esplicito dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la ricerca sessione quando risolve i target di annuncio per questo canale. |

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
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install` è un metadato di pacchetto, non un metadato di manifest.

| Campo                        | Tipo                 | Cosa significa                                                                 |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | npm spec canonica per i flussi di installazione/aggiornamento.                 |
| `localPath`                  | `string`             | Percorso di installazione locale di sviluppo o bundled.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Sorgente di installazione preferita quando entrambe sono disponibili.          |
| `minHostVersion`             | `string`             | Versione minima supportata di OpenClaw nel formato `>=x.y.z`.                  |
| `allowInvalidConfigRecovery` | `boolean`            | Consente ai flussi di reinstallazione dei plugin bundled di recuperare da specifici errori di configurazione obsoleta. |

Se `minHostVersion` è impostato, sia l'installazione sia il caricamento del registro dei manifest lo applicano.
Gli host più vecchi saltano il plugin; le stringhe di versione non valide vengono rifiutate.

`allowInvalidConfigRecovery` non è un bypass generale per configurazioni non valide. Serve
solo per il recupero ristretto dei plugin bundled, così reinstallazione/setup possono riparare
residui di upgrade noti come un percorso mancante di plugin bundled o una voce obsoleta `channels.<id>`
per quello stesso plugin. Se la configurazione è danneggiata per motivi non correlati, l'installazione
continua comunque a fallire in chiusura e dice all'operatore di eseguire `openclaw doctor --fix`.

### Caricamento completo differito

I plugin di canale possono scegliere il caricamento differito con:

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

Quando abilitato, OpenClaw carica solo `setupEntry` durante la fase di avvio
pre-listen, anche per canali già configurati. L'entry completa viene caricata dopo che il
gateway inizia ad ascoltare.

<Warning>
  Abilita il caricamento differito solo quando `setupEntry` registra tutto ciò di cui il
  gateway ha bisogno prima di iniziare ad ascoltare (registrazione del canale, route HTTP,
  metodi gateway). Se l'entry completa possiede capacità di avvio necessarie, mantieni
  il comportamento predefinito.
</Warning>

Se il tuo setup/full entry registra metodi RPC del gateway, mantienili su un
prefisso specifico del plugin. Gli spazi dei nomi admin core riservati (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e si risolvono
sempre in `operator.admin`.

## Manifest del plugin

Ogni plugin nativo deve includere un file `openclaw.plugin.json` nella root del pacchetto.
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

Vedi [Manifest del plugin](/plugins/manifest) per il riferimento completo dello schema.

## Pubblicazione su ClawHub

Per i pacchetti plugin, usa il comando ClawHub specifico del pacchetto:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L'alias di pubblicazione legacy solo per Skills è destinato alle Skills. I pacchetti plugin dovrebbero
usare sempre `clawhub package publish`.

## Setup entry

Il file `setup-entry.ts` è un'alternativa leggera a `index.ts` che
OpenClaw carica quando ha bisogno solo delle superfici di setup (onboarding, riparazione della configurazione,
ispezione di canali disabilitati).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice runtime pesante (librerie crittografiche, registrazioni CLI,
servizi in background) durante i flussi di setup.

**Quando OpenClaw usa `setupEntry` invece dell'entry completa:**

- Il canale è disabilitato ma necessita di superfici setup/onboarding
- Il canale è abilitato ma non configurato
- Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Cosa deve registrare `setupEntry`:**

- L'oggetto plugin del canale (tramite `defineSetupPluginEntry`)
- Eventuali route HTTP richieste prima che il gateway inizi ad ascoltare
- Eventuali metodi gateway necessari durante l'avvio

Quei metodi gateway di avvio dovrebbero comunque evitare gli spazi dei nomi admin core
riservati come `config.*` o `update.*`.

**Cosa NON dovrebbe includere `setupEntry`:**

- Registrazioni CLI
- Servizi in background
- Import runtime pesanti (crypto, SDK)
- Metodi gateway necessari solo dopo l'avvio

### Import helper setup ristretti

Per i percorsi hot solo setup, preferisci le seam degli helper setup ristretti rispetto
all'ombrello più ampio `plugin-sdk/setup` quando ti serve solo una parte della superficie setup:

| Percorso di import                  | Usalo per                                                                               | Export principali                                                                                                                                                                                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime in fase di setup che restano disponibili in `setupEntry` / avvio differito del canale | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter di setup account consapevoli dell'ambiente                                      | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                          |
| `plugin-sdk/setup-tools`           | helper CLI/archivio/documentazione per setup/installazione                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                 |

Usa la seam più ampia `plugin-sdk/setup` quando vuoi l'intera cassetta degli attrezzi
setup condivisa, inclusi helper di patch della configurazione come
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch setup restano sicuri sul percorso hot all'importazione. Il loro
lookup della surface di contratto bundled per la promozione single-account è lazy, quindi importare
`plugin-sdk/setup-runtime` non carica eager la discovery della contract-surface bundled
prima che l'adapter venga effettivamente usato.

### Promozione single-account posseduta dal canale

Quando un canale passa da una configurazione top-level single-account a
`channels.<id>.accounts.*`, il comportamento condiviso predefinito consiste nello spostare
i valori account-scoped promossi in `accounts.default`.

I canali bundled possono restringere o sovrascrivere quella promozione tramite la loro
contract-surface di setup:

- `singleAccountKeysToMove`: chiavi top-level aggiuntive che devono essere spostate nell'account promosso
- `namedAccountPromotionKeys`: quando esistono già account nominati, solo queste
  chiavi vengono spostate nell'account promosso; le chiavi condivise di policy/delivery restano alla root del canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente
  riceve i valori promossi

Matrix è l'esempio bundled attuale. Se esiste già esattamente un account Matrix nominato,
oppure se `defaultAccount` punta a una chiave non canonica esistente come
`Ops`, la promozione preserva quell'account invece di creare una nuova voce
`accounts.default`.

## Schema di configurazione

La configurazione del plugin viene validata rispetto allo JSON Schema nel tuo manifest. Gli utenti
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

## Procedure guidate di setup

I plugin di canale possono fornire procedure guidate di setup interattive per `openclaw onboard`.
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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e altro ancora.
Vedi i pacchetti plugin bundled (per esempio il plugin Discord `src/channel.setup.ts`) per
esempi completi.

Per prompt di allowlist DM che richiedono solo il flusso standard
`note -> prompt -> parse -> merge -> patch`, preferisci gli helper setup condivisi
di `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Per blocchi di stato del setup del canale che variano solo per etichette, punteggi e righe extra facoltative, preferisci `createStandardChannelSetupStatus(...)` da
`openclaw/plugin-sdk/setup` invece di ricreare manualmente lo stesso oggetto `status` in
ogni plugin.

Per superfici di setup facoltative che dovrebbero apparire solo in certi contesti, usa
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

`plugin-sdk/channel-setup` espone anche i builder di livello inferiore
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando ti serve solo una metà
di quella superficie di installazione facoltativa.

L'adapter/procedura guidata facoltativi generati falliscono in chiusura sulle vere scritture di configurazione. Riutilizzano un unico messaggio "installazione richiesta" in `validateInput`,
`applyAccountConfig` e `finalize`, e aggiungono un link alla documentazione quando `docsPath` è
impostato.

Per interfacce di setup basate su binari, preferisci gli helper delegati condivisi invece di
copiare la stessa logica di stato/binario in ogni canale:

- `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette,
  hint, punteggi e rilevamento binari
- `createCliPathTextInput(...)` per input testuali basati su percorso
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare lazy a una procedura guidata completa più pesante
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo
  delegare una decisione `textInputs[*].shouldPrompt`

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/tools/clawhub) o npm, poi installa:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw prova prima ClawHub e torna automaticamente a npm in fallback. Puoi anche
forzare esplicitamente ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

Non esiste un override corrispondente `npm:`. Usa la normale npm package spec quando
vuoi il percorso npm dopo il fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin nel repo:** posizionali sotto l'albero workspace dei plugin bundled e verranno automaticamente
rilevati durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Per le installazioni da npm, `openclaw plugins install` esegue
  `npm install --ignore-scripts` (nessuno script lifecycle). Mantieni l'albero delle dipendenze dei plugin
  puro JS/TS ed evita pacchetti che richiedono build `postinstall`.
</Info>

## Correlati

- [Punti di ingresso SDK](/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Manifest del plugin](/plugins/manifest) -- riferimento completo dello schema del manifest
- [Building Plugins](/plugins/building-plugins) -- guida introduttiva passo passo
