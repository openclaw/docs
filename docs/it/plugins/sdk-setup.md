---
read_when:
    - Stai aggiungendo una procedura guidata di setup a un Plugin
    - Hai bisogno di capire setup-entry.ts rispetto a index.ts
    - Stai definendo schemi di configurazione del Plugin o metadati openclaw in package.json
sidebarTitle: Setup and Config
summary: Procedure guidate di setup, setup-entry.ts, schemi di configurazione e metadati package.json
title: Setup e configurazione del Plugin
x-i18n:
    generated_at: "2026-04-24T08:53:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Riferimento per il packaging dei Plugin (metadati `package.json`), i manifest
(`openclaw.plugin.json`), le setup entry e gli schemi di configurazione.

<Tip>
  **Cerchi una guida passo passo?** Le guide how-to coprono il packaging nel contesto:
  [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugin provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del package

Il tuo `package.json` deve avere un campo `openclaw` che dica al sistema Plugin cosa
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

Se pubblichi il Plugin esternamente su ClawHub, i campi `compat` e `build`
sono obbligatori. Gli snippet canonici di pubblicazione si trovano in
`docs/snippets/plugin-publish/`.

### Campi `openclaw`

| Campo        | Tipo       | Descrizione                                                                                                               |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | File entry point (relativi alla radice del package)                                                                      |
| `setupEntry` | `string`   | Entry leggero solo setup (facoltativo)                                                                                   |
| `channel`    | `object`   | Metadati del catalogo dei canali per superfici di setup, picker, quickstart e stato                                     |
| `providers`  | `string[]` | ID dei provider registrati da questo Plugin                                                                              |
| `install`    | `object`   | Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag di comportamento all'avvio                                                                                          |

### `openclaw.channel`

`openclaw.channel` è un metadato di package economico per la discovery del canale e le
superfici di setup prima del caricamento del runtime.

| Campo                                  | Tipo       | Significato                                                                |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canonico del canale.                                                    |
| `label`                                | `string`   | Etichetta primaria del canale.                                             |
| `selectionLabel`                       | `string`   | Etichetta per picker/setup quando deve differire da `label`.               |
| `detailLabel`                          | `string`   | Etichetta secondaria di dettaglio per cataloghi di canale e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso documentazione per link di setup e selezione.                     |
| `docsLabel`                            | `string`   | Etichetta override usata per i link alla documentazione quando deve differire dall'id del canale. |
| `blurb`                                | `string`   | Breve descrizione per onboarding/catalogo.                                 |
| `order`                                | `number`   | Ordine di ordinamento nei cataloghi dei canali.                            |
| `aliases`                              | `string[]` | Alias aggiuntivi per la selezione del canale.                              |
| `preferOver`                           | `string[]` | ID Plugin/canale a priorità inferiore rispetto ai quali questo canale dovrebbe avere la precedenza. |
| `systemImage`                          | `string`   | Nome facoltativo di icona/system-image per i cataloghi UI dei canali.      |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei link alla documentazione nelle superfici di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso della documentazione invece di un link etichettato nella copia di selezione. |
| `selectionExtras`                      | `string[]` | Stringhe brevi aggiuntive appese nella copia di selezione.                 |
| `markdownCapable`                      | `boolean`  | Contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per superfici di setup, elenchi configurati e documentazione. |
| `quickstartAllowFrom`                  | `boolean`  | Inserisce questo canale nel flusso standard di setup rapido `allowFrom`.   |
| `forceAccountBinding`                  | `boolean`  | Richiede un binding account esplicito anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce il lookup di sessione quando risolve announce target per questo canale. |

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

- `configured`: include il canale nelle superfici di elenco configurate/in stile stato
- `setup`: include il canale nei picker interattivi di setup/configure
- `docs`: contrassegna il canale come visibile al pubblico nelle superfici docs/navigation

`showConfigured` e `showInSetup` restano supportati come alias legacy. Preferisci
`exposure`.

### `openclaw.install`

`openclaw.install` è metadato di package, non metadato di manifest.

| Campo                        | Tipo                 | Significato                                                                    |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Specifica npm canonica per i flussi di installazione/aggiornamento.            |
| `localPath`                  | `string`             | Percorso di installazione locale di sviluppo o bundled.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Sorgente di installazione preferita quando entrambe sono disponibili.          |
| `minHostVersion`             | `string`             | Versione minima supportata di OpenClaw nel formato `>=x.y.z`.                  |
| `expectedIntegrity`          | `string`             | Stringa di integrità attesa della distribuzione npm, di solito `sha512-...`, per installazioni fissate. |
| `allowInvalidConfigRecovery` | `boolean`            | Consente ai flussi di reinstallazione dei Plugin bundled di recuperare da specifici errori di configurazione obsoleta. |

L'onboarding interattivo usa anche `openclaw.install` per le superfici di
installazione on-demand. Se il tuo Plugin espone scelte auth del provider o metadati di setup/catalogo del canale prima del caricamento del runtime, l'onboarding può mostrare quella scelta, chiedere npm vs installazione locale, installare o abilitare il Plugin, quindi continuare il flusso selezionato. Le scelte npm in onboarding richiedono metadati di catalogo attendibili con una `npmSpec` di registro; versioni esatte e `expectedIntegrity` sono pin facoltativi. Se `expectedIntegrity` è presente, i flussi di installazione/aggiornamento la applicano. Mantieni i metadati “cosa mostrare” in `openclaw.plugin.json` e i metadati “come installarlo” in `package.json`.

Se `minHostVersion` è impostato, sia l'installazione sia il caricamento del registro dei manifest lo applicano. Gli host più vecchi saltano il Plugin; stringhe di versione non valide vengono rifiutate.

Per installazioni npm fissate, mantieni la versione esatta in `npmSpec` e aggiungi
l'integrità attesa dell'artefatto:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` non è un bypass generale per configurazioni rotte. È
solo per il recupero ristretto dei Plugin bundled, così reinstallazione/setup possono riparare
residui noti di upgrade come un percorso Plugin bundled mancante o una voce
`channels.<id>` obsoleta per quello stesso Plugin. Se la configurazione è rotta per motivi non correlati, l'installazione continua a fallire in modo chiuso e dice all'operatore di eseguire `openclaw doctor --fix`.

### Caricamento completo differito

I Plugin di canale possono scegliere il caricamento differito con:

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
pre-listen, anche per canali già configurati. L'entry completo viene caricato dopo che il
Gateway ha iniziato ad ascoltare.

<Warning>
  Abilita il caricamento differito solo quando il tuo `setupEntry` registra tutto ciò di cui il
  Gateway ha bisogno prima di iniziare l'ascolto (registrazione del canale, route HTTP,
  metodi Gateway). Se l'entry completo possiede capacità di avvio richieste, mantieni
  il comportamento predefinito.
</Warning>

Se la tua setup/full entry registra metodi RPC Gateway, mantienili su un
prefisso specifico del Plugin. I namespace core admin riservati (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano posseduti dal core e si risolvono sempre
in `operator.admin`.

## Manifest del Plugin

Ogni Plugin nativo deve distribuire un `openclaw.plugin.json` nella radice del package.
OpenClaw lo usa per validare la configurazione senza eseguire codice del Plugin.

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

Per i Plugin di canale, aggiungi `kind` e `channels`:

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

Anche i Plugin senza configurazione devono distribuire uno schema. Uno schema vuoto è valido:

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

Per i pacchetti Plugin, usa il comando ClawHub specifico per i package:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L'alias legacy di pubblicazione solo-Skills è per Skills. I pacchetti Plugin dovrebbero
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

I canali bundled del workspace che mantengono esportazioni setup-safe in moduli sidecar possono
usare invece `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract` al posto di
`defineSetupPluginEntry(...)`. Questo contratto bundled supporta anche un export
`runtime` facoltativo così il wiring del runtime in fase di setup può restare leggero ed esplicito.

**Quando OpenClaw usa `setupEntry` invece dell'entry completo:**

- Il canale è disabilitato ma ha bisogno di superfici di setup/onboarding
- Il canale è abilitato ma non configurato
- Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Cosa deve registrare `setupEntry`:**

- L'oggetto plugin del canale (tramite `defineSetupPluginEntry`)
- Eventuali route HTTP richieste prima del listen del Gateway
- Eventuali metodi Gateway necessari durante l'avvio

Quei metodi Gateway di avvio dovrebbero comunque evitare namespace core admin
riservati come `config.*` o `update.*`.

**Cosa NON dovrebbe includere `setupEntry`:**

- Registrazioni CLI
- Servizi in background
- Import runtime pesanti (crypto, SDK)
- Metodi Gateway necessari solo dopo l'avvio

### Import di helper di setup ristretti

Per percorsi setup-only hot, preferisci i seam di helper di setup ristretti rispetto al più ampio
ombrello `plugin-sdk/setup` quando hai bisogno solo di una parte della superficie di setup:

| Percorso import                       | Usalo per                                                                                | Export chiave                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/setup-runtime`            | helper runtime in fase di setup che restano disponibili in `setupEntry` / avvio differito del canale | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`    | adapter di setup account consapevoli dell'ambiente                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                      |
| `plugin-sdk/setup-tools`              | helper setup/installazione CLI/archive/docs                                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                             |

Usa il seam più ampio `plugin-sdk/setup` quando vuoi l'intera cassetta degli attrezzi condivisa di setup,
inclusi helper di patch della configurazione come
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch di setup restano sicuri nel percorso hot all'importazione. Il loro
lookup della superficie di contratto di promozione bundled single-account è lazy, quindi importare
`plugin-sdk/setup-runtime` non carica eager la discovery della superficie di contratto bundled
prima che l'adapter venga effettivamente usato.

### Promozione single-account posseduta dal canale

Quando un canale passa da una configurazione top-level single-account a
`channels.<id>.accounts.*`, il comportamento condiviso predefinito consiste nello spostare i valori con ambito account promossi in `accounts.default`.

I canali bundled possono restringere o sostituire questa promozione tramite la loro
superficie di contratto di setup:

- `singleAccountKeysToMove`: chiavi top-level aggiuntive che dovrebbero essere spostate nell'account promosso
- `namedAccountPromotionKeys`: quando esistono già account nominati, solo queste
  chiavi vengono spostate nell'account promosso; le chiavi condivise di policy/consegna restano alla radice del canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente
  riceve i valori promossi

Matrix è l'esempio bundled corrente. Se esiste già esattamente un account Matrix nominato,
oppure se `defaultAccount` punta a una chiave non canonica esistente come `Ops`,
la promozione preserva quell'account invece di creare una nuova voce
`accounts.default`.

## Schema di configurazione

La configurazione del Plugin viene validata rispetto al JSON Schema nel tuo manifest. Gli utenti
configurano i Plugin tramite:

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

Il tuo Plugin riceve questa configurazione come `api.pluginConfig` durante la registrazione.

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

I Plugin di canale possono fornire procedure guidate di setup interattive per `openclaw onboard`.
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
Vedi i pacchetti dei Plugin bundled (per esempio il Plugin Discord `src/channel.setup.ts`) per
esempi completi.

Per prompt di allowlist DM che richiedono solo il flusso standard
`note -> prompt -> parse -> merge -> patch`, preferisci gli helper condivisi di setup
da `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Per blocchi di stato del setup del canale che variano solo per etichette, punteggi e righe extra facoltative, preferisci `createStandardChannelSetupStatus(...)` da
`openclaw/plugin-sdk/setup` invece di riscrivere a mano lo stesso oggetto `status` in
ogni Plugin.

Per superfici di setup facoltative che dovrebbero apparire solo in determinati contesti, usa
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

`plugin-sdk/channel-setup` espone anche i builder di livello più basso
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando ti serve solo una metà di
quella superficie di installazione facoltativa.

L'adapter/procedura guidata facoltativi generati falliscono in modo chiuso sulle vere scritture di configurazione. Riutilizzano un unico messaggio che richiede l'installazione in `validateInput`,
`applyAccountConfig` e `finalize`, e aggiungono un link alla documentazione quando `docsPath` è
impostato.

Per UI di setup supportate da binari, preferisci gli helper delegati condivisi invece di
copiare la stessa logica di binary/status in ogni canale:

- `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette,
  suggerimenti, punteggi e rilevamento dei binari
- `createCliPathTextInput(...)` per text input basati su percorsi
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare in modo lazy a una procedura guidata completa più pesante
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo
  delegare una decisione `textInputs[*].shouldPrompt`

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/it/tools/clawhub) o npm, poi installa:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw prova prima ClawHub e usa automaticamente npm come fallback. Puoi anche
forzare esplicitamente ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

Non esiste un override `npm:` corrispondente. Usa la normale specifica npm del package quando
vuoi il percorso npm dopo il fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin nel repo:** inseriscili sotto l'albero workspace dei Plugin bundled e verranno automaticamente
rilevati durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Per installazioni da sorgente npm, `openclaw plugins install` esegue
  `npm install --ignore-scripts` (nessuno script del ciclo di vita). Mantieni gli alberi delle dipendenze dei Plugin puri JS/TS ed evita pacchetti che richiedono build in `postinstall`.
</Info>

I Plugin bundled posseduti da OpenClaw sono l'unica eccezione per la riparazione all'avvio: quando un'installazione pacchettizzata ne vede uno abilitato dalla configurazione del plugin, dalla configurazione legacy del canale o dal suo manifest bundled predefinito abilitato, l'avvio installa le dipendenze runtime mancanti di quel Plugin prima dell'importazione. I Plugin di terze parti non dovrebbero fare affidamento su installazioni all'avvio; continua a usare l'installer esplicito dei Plugin.

## Correlati

- [Punti di ingresso del Plugin](/it/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Manifest del Plugin](/it/plugins/manifest) -- riferimento completo dello schema del manifest
- [Creazione di Plugin](/it/plugins/building-plugins) -- guida introduttiva passo dopo passo
