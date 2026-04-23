---
read_when:
    - Stai aggiungendo una procedura guidata di configurazione a un Plugin
    - Devi capire `setup-entry.ts` rispetto a `index.ts`
    - Stai definendo schemi di configurazione del Plugin o metadati `openclaw` in `package.json`
sidebarTitle: Setup and Config
summary: Procedure guidate di configurazione, `setup-entry.ts`, schemi di configurazione e metadati `package.json`
title: Configurazione e setup del Plugin
x-i18n:
    generated_at: "2026-04-23T08:33:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configurazione e setup del Plugin

Riferimento per il packaging dei Plugin (metadati `package.json`), i manifest
(`openclaw.plugin.json`), le entry di setup e gli schemi di configurazione.

<Tip>
  **Cerchi una guida passo passo?** Le guide pratiche coprono il packaging nel contesto:
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
      "blurb": "Breve descrizione del canale."
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
sono obbligatori. I frammenti canonici di pubblicazione si trovano in
`docs/snippets/plugin-publish/`.

### Campi `openclaw`

| Campo        | Tipo       | Descrizione                                                                                                                  |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | File entry point (relativi alla root del package)                                                                            |
| `setupEntry` | `string`   | Entry leggera solo setup (facoltativa)                                                                                       |
| `channel`    | `object`   | Metadati del catalogo canali per superfici di setup, selettore, quickstart e stato                                          |
| `providers`  | `string[]` | ID provider registrati da questo Plugin                                                                                      |
| `install`    | `object`   | Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag di comportamento all'avvio                                                                                              |

### `openclaw.channel`

`openclaw.channel` è metadato di package leggero per la discovery del canale e le
superfici di setup prima che il runtime venga caricato.

| Campo                                  | Tipo       | Significato                                                                  |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canonico del canale.                                                      |
| `label`                                | `string`   | Etichetta primaria del canale.                                               |
| `selectionLabel`                       | `string`   | Etichetta del selettore/setup quando deve differire da `label`.             |
| `detailLabel`                          | `string`   | Etichetta secondaria di dettaglio per cataloghi canali e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso documentazione per link di setup e selezione.                       |
| `docsLabel`                            | `string`   | Override dell'etichetta usata per i link alla documentazione quando deve differire dall'ID del canale. |
| `blurb`                                | `string`   | Breve descrizione per onboarding/catalogo.                                   |
| `order`                                | `number`   | Ordine di ordinamento nei cataloghi dei canali.                              |
| `aliases`                              | `string[]` | Alias di ricerca aggiuntivi per la selezione del canale.                     |
| `preferOver`                           | `string[]` | ID Plugin/canale di priorità inferiore che questo canale deve superare.      |
| `systemImage`                          | `string`   | Nome facoltativo di icona/system-image per cataloghi UI del canale.          |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei link documentazione nelle superfici di selezione.   |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso docs invece di un link docs etichettato nel testo di selezione. |
| `selectionExtras`                      | `string[]` | Stringhe brevi aggiuntive accodate nel testo di selezione.                   |
| `markdownCapable`                      | `boolean`  | Contrassegna il canale come compatibile con Markdown per decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per setup, liste configurate e superfici documentazione. |
| `quickstartAllowFrom`                  | `boolean`  | Include questo canale nel flusso standard quickstart `allowFrom`.            |
| `forceAccountBinding`                  | `boolean`  | Richiede binding esplicito dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la ricerca della sessione durante la risoluzione delle destinazioni announce per questo canale. |

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
      "blurb": "Integrazione chat self-hosted basata su Webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guida:",
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
- `setup`: include il canale nei selettori interattivi di setup/configure
- `docs`: contrassegna il canale come pubblico nelle superfici docs/navigazione

`showConfigured` e `showInSetup` restano supportati come alias legacy. Preferisci
`exposure`.

### `openclaw.install`

`openclaw.install` è metadato di package, non metadato di manifest.

| Campo                        | Tipo                 | Significato                                                                     |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Specifica npm canonica per i flussi di installazione/aggiornamento.             |
| `localPath`                  | `string`             | Percorso di installazione locale di sviluppo o incluso.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Sorgente di installazione preferita quando entrambe sono disponibili.           |
| `minHostVersion`             | `string`             | Versione minima supportata di OpenClaw nel formato `>=x.y.z`.                   |
| `expectedIntegrity`          | `string`             | Stringa di integrità attesa di npm dist, di solito `sha512-...`, per installazioni fissate. |
| `allowInvalidConfigRecovery` | `boolean`            | Consente ai flussi di reinstallazione dei Plugin inclusi di recuperare da specifici errori di configurazione obsoleta. |

L'onboarding interattivo usa `openclaw.install` anche per le
superfici install-on-demand. Se il tuo Plugin espone scelte di autenticazione provider o metadati di setup/catalogo del canale prima del caricamento del runtime, l'onboarding può mostrare tale scelta, chiedere npm
vs installazione locale, installare o abilitare il Plugin e quindi continuare il flusso
selezionato. Le scelte di onboarding npm richiedono metadati di catalogo fidati con una
`npmSpec` di registro; versioni esatte e `expectedIntegrity` sono pin facoltativi. Se
`expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo fanno rispettare. Mantieni i metadati del "cosa mostrare" in `openclaw.plugin.json` e i metadati del "come installarlo"
in `package.json`.

Se `minHostVersion` è impostato, sia l'installazione sia il caricamento del registro manifest lo
fanno rispettare. Gli host più vecchi saltano il Plugin; stringhe di versione non valide vengono rifiutate.

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

`allowInvalidConfigRecovery` non è un bypass generale per configurazioni rotte. Serve
solo per il recupero ristretto dei Plugin inclusi, così reinstallazione/setup può riparare residui noti di upgrade come un percorso mancante del Plugin incluso o una voce `channels.<id>`
obsoleta per quello stesso Plugin. Se la configurazione è rotta per motivi non correlati, l'installazione
continua a fallire in modo chiuso e dice all'operatore di eseguire `openclaw doctor --fix`.

### Caricamento completo differito

I Plugin di canale possono attivare il caricamento differito con:

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

Quando abilitato, OpenClaw carica solo `setupEntry` durante la fase
di avvio pre-listen, anche per canali già configurati. L'entry completa viene caricata dopo che il
Gateway ha iniziato l'ascolto.

<Warning>
  Abilita il caricamento differito solo quando il tuo `setupEntry` registra tutto ciò di cui il
  Gateway ha bisogno prima di iniziare l'ascolto (registrazione canale, route HTTP,
  metodi Gateway). Se l'entry completa possiede capacità di avvio richieste, mantieni
  il comportamento predefinito.
</Warning>

Se la tua entry setup/completa registra metodi RPC del Gateway, mantienili con un
prefisso specifico del Plugin. I namespace admin core riservati (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e vengono sempre risolti
in `operator.admin`.

## Manifest del Plugin

Ogni Plugin nativo deve includere un `openclaw.plugin.json` nella root del package.
OpenClaw lo usa per validare la configurazione senza eseguire il codice del Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Aggiunge capacità My Plugin a OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Segreto di verifica del Webhook"
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

Anche i Plugin senza configurazione devono includere uno schema. Uno schema vuoto è valido:

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

## Pubblicazione ClawHub

Per i package Plugin, usa il comando ClawHub specifico per package:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L'alias legacy di pubblicazione solo-Skill è per le Skills. I package Plugin devono
sempre usare `clawhub package publish`.

## Entry di setup

Il file `setup-entry.ts` è un'alternativa leggera a `index.ts` che
OpenClaw carica quando ha bisogno solo delle superfici di setup (onboarding, riparazione configurazione,
ispezione di canali disabilitati).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice runtime pesante (librerie crittografiche, registrazioni CLI,
servizi in background) durante i flussi di setup.

I canali inclusi nel workspace che mantengono export setup-safe in moduli sidecar possono
usare `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract` invece di
`defineSetupPluginEntry(...)`. Quel contratto incluso supporta anche un export
`runtime` facoltativo così il wiring runtime in fase di setup può restare leggero ed esplicito.

**Quando OpenClaw usa `setupEntry` invece della entry completa:**

- Il canale è disabilitato ma ha bisogno delle superfici di setup/onboarding
- Il canale è abilitato ma non configurato
- È abilitato il caricamento differito (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Cosa deve registrare `setupEntry`:**

- L'oggetto Plugin del canale (tramite `defineSetupPluginEntry`)
- Eventuali route HTTP richieste prima dell'ascolto del Gateway
- Eventuali metodi Gateway necessari durante l'avvio

Quei metodi Gateway di avvio dovrebbero comunque evitare namespace admin core
riservati come `config.*` o `update.*`.

**Cosa NON dovrebbe includere `setupEntry`:**

- Registrazioni CLI
- Servizi in background
- Import runtime pesanti (crypto, SDK)
- Metodi Gateway necessari solo dopo l'avvio

### Import helper di setup ristretti

Per percorsi hot solo-setup, preferisci le seam helper di setup ristrette invece del più ampio
ombrello `plugin-sdk/setup` quando ti serve solo una parte della superficie di setup:

| Percorso di import                  | Usalo per                                                                                | Export chiave                                                                                                                                                                                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | helper runtime in fase di setup che restano disponibili in `setupEntry` / avvio differito del canale | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adapter di setup account consapevoli dell'ambiente                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`            | helper setup/install CLI/archive/docs                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Usa la seam più ampia `plugin-sdk/setup` quando vuoi l'intera toolbox condivisa di setup,
inclusi helper di patch della configurazione come
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch setup restano sicuri per il percorso hot all'import. La loro
ricerca lazy della superficie di contratto di promozione single-account inclusa fa sì che importare
`plugin-sdk/setup-runtime` non carichi eager la discovery della superficie di contratto inclusa prima che l'adapter venga effettivamente usato.

### Promozione single-account di proprietà del canale

Quando un canale passa da una configurazione top-level single-account a
`channels.<id>.accounts.*`, il comportamento condiviso predefinito consiste nello spostare i valori con ambito account promossi in `accounts.default`.

I canali inclusi possono restringere o sovrascrivere quella promozione tramite la loro superficie di contratto setup:

- `singleAccountKeysToMove`: chiavi top-level aggiuntive che devono essere spostate nell'account promosso
- `namedAccountPromotionKeys`: quando esistono già account con nome, solo queste
  chiavi vengono spostate nell'account promosso; le chiavi condivise di policy/delivery restano alla root del canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente
  riceve i valori promossi

Matrix è l'esempio incluso attuale. Se esiste già esattamente un account Matrix con nome,
oppure se `defaultAccount` punta a una chiave non canonica esistente come
`Ops`, la promozione preserva quell'account invece di creare una nuova voce
`accounts.default`.

## Schema di configurazione

La configurazione del Plugin viene validata rispetto allo schema JSON nel tuo manifest. Gli utenti
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

Per configurazione specifica del canale, usa invece la sezione di configurazione del canale:

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

### Creazione degli schemi di configurazione del canale

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
    configuredLabel: "Connesso",
    unconfiguredLabel: "Non configurato",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Token bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Usare MY_CHANNEL_BOT_TOKEN dall'ambiente?",
      keepPrompt: "Mantenere il token corrente?",
      inputPrompt: "Inserisci il token del tuo bot:",
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
Vedi i package Plugin inclusi (ad esempio il Plugin Discord `src/channel.setup.ts`) per
esempi completi.

Per prompt di allowlist DM che richiedono solo il flusso standard
`nota -> prompt -> parse -> merge -> patch`, preferisci gli helper di setup condivisi da
`openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Per blocchi di stato del setup del canale che variano solo per etichette, punteggi e righe extra facoltative, preferisci `createStandardChannelSetupStatus(...)` da
`openclaw/plugin-sdk/setup` invece di riscrivere a mano lo stesso oggetto `status` in
ogni Plugin.

Per superfici di setup facoltative che devono comparire solo in determinati contesti, usa
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
`createOptionalChannelSetupWizard(...)` quando ti serve solo una metà di
quella superficie di installazione facoltativa.

L'adapter/procedura guidata facoltativi generati falliscono in modo chiuso sulle vere scritture di configurazione. Riutilizzano un unico messaggio di installazione richiesta in `validateInput`,
`applyAccountConfig` e `finalize`, e aggiungono un link alla documentazione quando `docsPath` è
impostato.

Per UI di setup basate su binari, preferisci gli helper delegati condivisi invece di
copiare la stessa logica binario/stato in ogni canale:

- `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette,
  suggerimenti, punteggi e rilevamento binario
- `createCliPathTextInput(...)` per input testuali basati su path
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

OpenClaw prova prima ClawHub e ricade automaticamente su npm. Puoi anche
forzare esplicitamente ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

Non esiste un override `npm:` corrispondente. Usa la normale specifica npm del package quando
vuoi il percorso npm dopo il fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin nel repository:** collocali sotto l'albero workspace dei Plugin inclusi e vengono automaticamente
scoperti durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Per le installazioni da npm, `openclaw plugins install` esegue
  `npm install --ignore-scripts` (nessuno script lifecycle). Mantieni puri JS/TS gli alberi di dipendenze del Plugin ed evita package che richiedono build `postinstall`.
</Info>

I Plugin inclusi di proprietà OpenClaw sono l'unica eccezione di riparazione all'avvio: quando una
installazione pacchettizzata ne vede uno abilitato dalla configurazione del Plugin, dalla configurazione
legacy del canale o dal suo manifest incluso abilitato per impostazione predefinita, l'avvio installa le dipendenze runtime mancanti di quel Plugin prima dell'import. I Plugin di terze parti non dovrebbero fare affidamento sulle installazioni all'avvio; continua a usare l'installer esplicito dei Plugin.

## Correlati

- [Entry point SDK](/it/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Manifest del Plugin](/it/plugins/manifest) -- riferimento completo dello schema manifest
- [Creazione di Plugin](/it/plugins/building-plugins) -- guida introduttiva passo passo
