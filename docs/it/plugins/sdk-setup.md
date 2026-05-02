---
read_when:
    - Stai aggiungendo una procedura guidata di configurazione a un plugin
    - È necessario comprendere setup-entry.ts rispetto a index.ts
    - Stai definendo schemi di configurazione dei Plugin o metadati openclaw in package.json
sidebarTitle: Setup and config
summary: Procedure guidate di configurazione, setup-entry.ts, schemi di configurazione e metadati di package.json
title: Impostazione e configurazione del Plugin
x-i18n:
    generated_at: "2026-05-02T08:31:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Riferimento per il packaging dei plugin (metadati `package.json`), i manifest (`openclaw.plugin.json`), le voci di configurazione e gli schemi di configurazione.

<Tip>
**Cerchi una guida dettagliata?** Le guide pratiche trattano il packaging nel contesto: [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugin Provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del pacchetto

Il tuo `package.json` richiede un campo `openclaw` che indichi al sistema dei plugin cosa fornisce il tuo plugin:

<Tabs>
  <Tab title="Plugin di canale">
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
  </Tab>
  <Tab title="Plugin Provider / baseline ClawHub">
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
  </Tab>
</Tabs>

<Note>
Se pubblichi il plugin esternamente su ClawHub, quei campi `compat` e `build` sono obbligatori. Gli snippet canonici per la pubblicazione si trovano in `docs/snippets/plugin-publish/`.
</Note>

### Campi `openclaw`

<ParamField path="extensions" type="string[]">
  File dei punti di ingresso (relativi alla radice del pacchetto).
</ParamField>
<ParamField path="setupEntry" type="string">
  Voce leggera solo per la configurazione (facoltativa).
</ParamField>
<ParamField path="channel" type="object">
  Metadati del catalogo canali per configurazione, selettore, avvio rapido e superfici di stato.
</ParamField>
<ParamField path="providers" type="string[]">
  ID dei provider registrati da questo plugin.
</ParamField>
<ParamField path="install" type="object">
  Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flag del comportamento di avvio.
</ParamField>

### `openclaw.channel`

`openclaw.channel` è costituito da metadati di pacchetto leggeri per il rilevamento dei canali e le superfici di configurazione prima del caricamento del runtime.

| Campo                                  | Tipo       | Significato                                                                   |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canonico del canale.                                                       |
| `label`                                | `string`   | Etichetta principale del canale.                                              |
| `selectionLabel`                       | `string`   | Etichetta del selettore/configurazione quando deve differire da `label`.      |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per cataloghi canali e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso della documentazione per link di configurazione e selezione.         |
| `docsLabel`                            | `string`   | Etichetta alternativa usata per i link alla documentazione quando deve differire dall'ID del canale. |
| `blurb`                                | `string`   | Breve descrizione per onboarding/catalogo.                                    |
| `order`                                | `number`   | Ordine di ordinamento nei cataloghi canali.                                   |
| `aliases`                              | `string[]` | Alias di ricerca aggiuntivi per la selezione del canale.                      |
| `preferOver`                           | `string[]` | ID di plugin/canale con priorità inferiore rispetto ai quali questo canale deve prevalere. |
| `systemImage`                          | `string`   | Nome facoltativo dell'icona/immagine di sistema per i cataloghi UI dei canali. |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei link alla documentazione nelle superfici di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso della documentazione invece di un link alla documentazione etichettato nel testo di selezione. |
| `selectionExtras`                      | `string[]` | Brevi stringhe aggiuntive accodate nel testo di selezione.                    |
| `markdownCapable`                      | `boolean`  | Indica che il canale supporta Markdown per le decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per configurazione, elenchi configurati e superfici della documentazione. |
| `quickstartAllowFrom`                  | `boolean`  | Abilita questo canale al flusso standard di configurazione rapida `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Richiede il binding esplicito dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la ricerca della sessione durante la risoluzione dei target di annuncio per questo canale. |

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
- `setup`: include il canale nei selettori interattivi di configurazione
- `docs`: contrassegna il canale come pubblico nelle superfici di documentazione/navigazione

<Note>
`showConfigured` e `showInSetup` restano supportati come alias legacy. Preferisci `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` è costituito da metadati di pacchetto, non metadati di manifest.

| Campo                        | Tipo                 | Significato                                                                       |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Specifica npm canonica per i flussi di installazione/aggiornamento.               |
| `localPath`                  | `string`             | Percorso di sviluppo locale o di installazione inclusa nel bundle.                |
| `defaultChoice`              | `"npm"` \| `"local"` | Origine di installazione preferita quando entrambe sono disponibili.              |
| `minHostVersion`             | `string`             | Versione minima supportata di OpenClaw nella forma `>=x.y.z` o `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | Stringa di integrità npm dist attesa, solitamente `sha512-...`, per installazioni fissate. |
| `allowInvalidConfigRecovery` | `boolean`            | Consente ai flussi di reinstallazione dei plugin inclusi nel bundle di recuperare da specifici errori di configurazione obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamento di onboarding">
    L'onboarding interattivo usa anche `openclaw.install` per le superfici di installazione su richiesta. Se il tuo plugin espone scelte di autenticazione provider o metadati di configurazione/catalogo del canale prima del caricamento del runtime, l'onboarding può mostrare quella scelta, chiedere l'installazione npm o locale, installare o abilitare il plugin, quindi continuare il flusso selezionato. Le scelte di onboarding npm richiedono metadati di catalogo attendibili con una `npmSpec` del registro; versioni esatte ed `expectedIntegrity` sono pin facoltativi. Se `expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo applicano. Mantieni i metadati "cosa mostrare" in `openclaw.plugin.json` e i metadati "come installarlo" in `package.json`.
  </Accordion>
  <Accordion title="Applicazione di minHostVersion">
    Se `minHostVersion` è impostato, sia l'installazione sia il caricamento del registro dei manifest non inclusi nel bundle lo applicano. Gli host più vecchi saltano i plugin esterni; le stringhe di versione non valide vengono rifiutate. Si presume che i plugin sorgente inclusi nel bundle abbiano la stessa versione del checkout host.
  </Accordion>
  <Accordion title="Installazioni npm fissate">
    Per le installazioni npm fissate, mantieni la versione esatta in `npmSpec` e aggiungi l'integrità attesa dell'artefatto:

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

  </Accordion>
  <Accordion title="ambito di allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` non è un bypass generale per configurazioni danneggiate. È destinato solo al ripristino mirato dei Plugin inclusi, in modo che la reinstallazione/configurazione possa riparare residui noti di aggiornamento, come un percorso di Plugin incluso mancante o una voce `channels.<id>` obsoleta per quello stesso Plugin. Se la configurazione è danneggiata per motivi non correlati, l'installazione continua a non riuscire in modo chiuso e indica all'operatore di eseguire `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

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

Quando è abilitato, OpenClaw carica solo `setupEntry` durante la fase di avvio prima dell'ascolto, anche per i canali già configurati. L'entry completo viene caricato dopo che il Gateway inizia ad ascoltare.

<Warning>
Abilita il caricamento differito solo quando il tuo `setupEntry` registra tutto ciò di cui il Gateway ha bisogno prima di iniziare ad ascoltare (registrazione del canale, route HTTP, metodi del Gateway). Se l'entry completo possiede capacità di avvio obbligatorie, mantieni il comportamento predefinito.
</Warning>

Se il tuo entry di configurazione/completo registra metodi RPC del Gateway, mantienili su un prefisso specifico del Plugin. Gli spazi dei nomi amministrativi core riservati (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e si risolvono sempre in `operator.admin`.

## Manifesto del Plugin

Ogni Plugin nativo deve includere un `openclaw.plugin.json` nella root del pacchetto. OpenClaw lo usa per convalidare la configurazione senza eseguire codice del Plugin.

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

Consulta [Manifesto del Plugin](/it/plugins/manifest) per il riferimento completo allo schema.

## Pubblicazione su ClawHub

Per i pacchetti Plugin, usa il comando ClawHub specifico del pacchetto:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L'alias di pubblicazione legacy solo per Skills è destinato alle Skills. I pacchetti Plugin devono sempre usare `clawhub package publish`.
</Note>

## Entry di configurazione

Il file `setup-entry.ts` è un’alternativa leggera a `index.ts` che OpenClaw carica quando ha bisogno solo delle superfici di configurazione (onboarding, riparazione della configurazione, ispezione dei canali disabilitati).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice runtime pesante (librerie crittografiche, registrazioni CLI, servizi in background) durante i flussi di configurazione.

I canali del workspace inclusi che mantengono esportazioni sicure per la configurazione in moduli sidecar possono usare `defineBundledChannelSetupEntry(...)` da `openclaw/plugin-sdk/channel-entry-contract` invece di `defineSetupPluginEntry(...)`. Quel contratto incluso supporta anche un’esportazione facoltativa `runtime`, così il cablaggio runtime in fase di configurazione può restare leggero ed esplicito.

<AccordionGroup>
  <Accordion title="Quando OpenClaw usa setupEntry invece dell’entry completa">
    - Il canale è disabilitato ma richiede superfici di configurazione/onboarding.
    - Il canale è abilitato ma non configurato.
    - Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Cosa deve registrare setupEntry">
    - L’oggetto Plugin del canale (tramite `defineSetupPluginEntry`).
    - Eventuali route HTTP richieste prima dell’ascolto del gateway.
    - Eventuali metodi gateway necessari durante l’avvio.

    Quei metodi gateway di avvio devono comunque evitare namespace amministrativi core riservati come `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Cosa setupEntry NON dovrebbe includere">
    - Registrazioni CLI.
    - Servizi in background.
    - Import runtime pesanti (crittografia, SDK).
    - Metodi gateway necessari solo dopo l’avvio.

  </Accordion>
</AccordionGroup>

### Import stretti degli helper di configurazione

Per i percorsi caldi solo di configurazione, preferisci le superfici strette degli helper di configurazione rispetto all’ombrello più ampio `plugin-sdk/setup` quando ti serve solo una parte della superficie di configurazione:

| Percorso di import                  | Usalo per                                                                                 | Esportazioni principali                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime in fase di configurazione che restano disponibili in `setupEntry` / avvio differito del canale | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter di configurazione account consapevoli dell’ambiente                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper CLI/archivio/docs per configurazione/installazione                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Usa la superficie più ampia `plugin-sdk/setup` quando vuoi l’intero toolbox condiviso di configurazione, inclusi helper di patch della configurazione come `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch della configurazione restano sicuri da importare nei percorsi caldi. La ricerca della superficie di contratto inclusa per la promozione single-account è lazy, quindi importare `plugin-sdk/setup-runtime` non carica immediatamente la discovery della superficie di contratto inclusa prima che l’adapter venga effettivamente usato.

### Promozione single-account di proprietà del canale

Quando un canale passa da una configurazione top-level single-account a `channels.<id>.accounts.*`, il comportamento condiviso predefinito è spostare i valori promossi con ambito account in `accounts.default`.

I canali inclusi possono restringere o sovrascrivere quella promozione tramite la loro superficie di contratto di configurazione:

- `singleAccountKeysToMove`: chiavi top-level aggiuntive che dovrebbero essere spostate nell’account promosso
- `namedAccountPromotionKeys`: quando esistono già account denominati, solo queste chiavi vengono spostate nell’account promosso; le chiavi condivise di policy/delivery restano alla radice del canale
- `resolveSingleAccountPromotionTarget(...)`: scegli quale account esistente riceve i valori promossi

<Note>
Matrix è l’esempio incluso corrente. Se esiste già esattamente un account Matrix denominato, oppure se `defaultAccount` punta a una chiave non canonica esistente come `Ops`, la promozione preserva quell’account invece di creare una nuova voce `accounts.default`.
</Note>

## Schema di configurazione

La configurazione del plugin viene validata rispetto allo JSON Schema nel manifest. Gli utenti configurano i plugin tramite:

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

### Creazione degli schemi di configurazione dei canali

Usa `buildChannelConfigSchema` per convertire uno schema Zod nel wrapper `ChannelConfigSchema` usato dagli artefatti di configurazione di proprietà del plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Per i plugin di terze parti, il contratto del percorso freddo resta il manifest del plugin: replica lo JSON Schema generato in `openclaw.plugin.json#channelConfigs` così configurazione dello schema, setup e superfici UI possono ispezionare `channels.<id>` senza caricare codice runtime.

## Wizard di configurazione

I plugin di canale possono fornire wizard di configurazione interattivi per `openclaw onboard`. Il wizard è un oggetto `ChannelSetupWizard` su `ChannelPlugin`:

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

Il tipo `ChannelSetupWizard` supporta `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e altro. Vedi i pacchetti Plugin inclusi (per esempio il plugin Discord `src/channel.setup.ts`) per esempi completi.

<AccordionGroup>
  <Accordion title="Prompt allowFrom condivisi">
    Per prompt allowlist DM che richiedono solo il flusso standard `note -> prompt -> parse -> merge -> patch`, preferisci gli helper di configurazione condivisi da `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Stato standard della configurazione del canale">
    Per blocchi di stato della configurazione del canale che variano solo per etichette, punteggi e righe extra facoltative, preferisci `createStandardChannelSetupStatus(...)` da `openclaw/plugin-sdk/setup` invece di ricreare manualmente lo stesso oggetto `status` in ogni plugin.
  </Accordion>
  <Accordion title="Superficie facoltativa di configurazione del canale">
    Per superfici di configurazione facoltative che dovrebbero apparire solo in determinati contesti, usa `createOptionalChannelSetupSurface` da `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` espone anche i builder di livello inferiore `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando ti serve solo una metà di quella superficie di installazione facoltativa.

    L’adapter/wizard facoltativo generato fallisce in modo chiuso sulle scritture reali della configurazione. Riutilizza un unico messaggio di installazione richiesta in `validateInput`, `applyAccountConfig` e `finalize`, e aggiunge un link alla documentazione quando `docsPath` è impostato.

  </Accordion>
  <Accordion title="Helper di configurazione basati su binari">
    Per UI di configurazione basate su binari, preferisci gli helper delegati condivisi invece di copiare lo stesso collante binario/stato in ogni canale:

    - `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette, suggerimenti, punteggi e rilevamento del binario
    - `createCliPathTextInput(...)` per input di testo basati su percorso
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare lazy a un wizard completo più pesante
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo delegare una decisione `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/it/tools/clawhub), poi installa:

<Tabs>
  <Tab title="Auto (ClawHub poi npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw prova prima ClawHub e ripiega automaticamente su npm.

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Specifica pacchetto npm">
    Usa npm quando un pacchetto non è ancora passato a ClawHub, oppure quando ti serve un
    percorso di installazione npm diretto durante la migrazione:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin nel repo:** posizionali sotto l’albero del workspace dei plugin inclusi e verranno rilevati automaticamente durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
Per installazioni originate da npm, `openclaw plugins install` installa il pacchetto sotto `~/.openclaw/npm` con gli script di lifecycle disabilitati. Mantieni gli alberi delle dipendenze dei plugin in JS/TS puro ed evita pacchetti che richiedono build `postinstall`.
</Info>

<Note>
L’avvio del Gateway non installa le dipendenze dei plugin. I flussi di installazione npm/git/ClawHub gestiscono la convergenza delle dipendenze; i plugin locali devono già avere le proprie dipendenze installate.
</Note>

I metadati dei pacchetti inclusi sono espliciti, non dedotti dal JavaScript compilato all'avvio del Gateway. Le dipendenze di runtime appartengono al pacchetto Plugin che le possiede; l'avvio di OpenClaw pacchettizzato non ripara né replica mai le dipendenze dei Plugin.

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) — guida introduttiva passo passo
- [Manifest del Plugin](/it/plugins/manifest) — riferimento completo dello schema del manifest
- [Punti di ingresso SDK](/it/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
