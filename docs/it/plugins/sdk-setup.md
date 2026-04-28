---
read_when:
    - Stai aggiungendo una procedura guidata di configurazione a un Plugin
    - Devi capire `setup-entry.ts` rispetto a `index.ts`
    - Stai definendo schemi di configurazione del Plugin o metadati `openclaw` in `package.json`
sidebarTitle: Setup and config
summary: Procedure guidate di configurazione, `setup-entry.ts`, schemi di configurazione e metadati `package.json`
title: Configurazione e setup del Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Riferimento per il packaging dei Plugin (metadati `package.json`), i manifest (`openclaw.plugin.json`), le setup entry e gli schemi di configurazione.

<Tip>
**Cerchi una guida passo passo?** Le guide pratiche trattano il packaging nel suo contesto: [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugin provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del pacchetto

Il tuo `package.json` deve includere un campo `openclaw` che indichi al sistema dei Plugin cosa fornisce il tuo Plugin:

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
          "blurb": "Breve descrizione del canale."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin provider / baseline ClawHub">
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
Se pubblichi il Plugin esternamente su ClawHub, quei campi `compat` e `build` sono obbligatori. Gli snippet di pubblicazione canonici si trovano in `docs/snippets/plugin-publish/`.
</Note>

### Campi `openclaw`

<ParamField path="extensions" type="string[]">
  File di entry point (relativi alla radice del pacchetto).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entry leggera solo per il setup (opzionale).
</ParamField>
<ParamField path="channel" type="object">
  Metadati del catalogo canali per setup, selettore, quickstart e superfici di stato.
</ParamField>
<ParamField path="providers" type="string[]">
  ID provider registrati da questo Plugin.
</ParamField>
<ParamField path="install" type="object">
  Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flag del comportamento di avvio.
</ParamField>

### `openclaw.channel`

`openclaw.channel` è un metadato di pacchetto economico per la scoperta del canale e le superfici di setup prima che il runtime venga caricato.

| Campo                                  | Tipo       | Significato                                                                   |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canonico del canale.                                                       |
| `label`                                | `string`   | Etichetta principale del canale.                                              |
| `selectionLabel`                       | `string`   | Etichetta per selettore/setup quando deve differire da `label`.               |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per cataloghi canali e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso della documentazione per i link di setup e selezione.                |
| `docsLabel`                            | `string`   | Etichetta sostitutiva usata per i link alla documentazione quando deve differire dall'ID del canale. |
| `blurb`                                | `string`   | Breve descrizione per onboarding/catalogo.                                    |
| `order`                                | `number`   | Ordine di ordinamento nei cataloghi dei canali.                               |
| `aliases`                              | `string[]` | Alias aggiuntivi per la selezione del canale.                                 |
| `preferOver`                           | `string[]` | ID Plugin/canale a priorità inferiore che questo canale dovrebbe superare.    |
| `systemImage`                          | `string`   | Nome opzionale di icona/system-image per i cataloghi UI dei canali.           |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei link alla documentazione nelle superfici di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso della documentazione invece di un link etichettato nella copia di selezione. |
| `selectionExtras`                      | `string[]` | Brevi stringhe aggiuntive accodate nella copia di selezione.                  |
| `markdownCapable`                      | `boolean`  | Contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per setup, elenchi configurati e superfici della documentazione. |
| `quickstartAllowFrom`                  | `boolean`  | Include questo canale nel flusso di setup `allowFrom` standard del quickstart. |
| `forceAccountBinding`                  | `boolean`  | Richiede un collegamento esplicito dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la ricerca di sessione quando si risolvono i target di annuncio per questo canale. |

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

- `configured`: include il canale nelle superfici di elenco in stile configurato/stato
- `setup`: include il canale nei selettori interattivi di setup/configurazione
- `docs`: contrassegna il canale come pubblico nelle superfici di documentazione/navigazione

<Note>
`showConfigured` e `showInSetup` restano supportati come alias legacy. È preferibile usare `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` è metadato di pacchetto, non metadato di manifest.

| Campo                        | Tipo                 | Significato                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Specifica npm canonica per i flussi di installazione/aggiornamento.             |
| `localPath`                  | `string`             | Percorso di installazione locale di sviluppo o incluso nel pacchetto.           |
| `defaultChoice`              | `"npm"` \| `"local"` | Origine di installazione preferita quando entrambe sono disponibili.            |
| `minHostVersion`             | `string`             | Versione minima supportata di OpenClaw nel formato `>=x.y.z`.                   |
| `expectedIntegrity`          | `string`             | Stringa di integrità npm dist attesa, di solito `sha512-...`, per installazioni bloccate. |
| `allowInvalidConfigRecovery` | `boolean`            | Consente ai flussi di reinstallazione dei Plugin inclusi di recuperare da specifici errori di configurazione obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamento dell'onboarding">
    L'onboarding interattivo usa anche `openclaw.install` per le superfici di installazione su richiesta. Se il tuo Plugin espone scelte di autenticazione provider o metadati di setup/catalogo del canale prima che il runtime venga caricato, l'onboarding può mostrare quella scelta, chiedere se usare installazione npm o locale, installare o abilitare il Plugin e poi continuare con il flusso selezionato. Le scelte di onboarding npm richiedono metadati di catalogo affidabili con un `npmSpec` del registry; versioni esatte ed `expectedIntegrity` sono pin opzionali. Se `expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo applicano. Mantieni i metadati del "cosa mostrare" in `openclaw.plugin.json` e i metadati del "come installarlo" in `package.json`.
  </Accordion>
  <Accordion title="Applicazione di minHostVersion">
    Se `minHostVersion` è impostato, sia l'installazione sia il caricamento dal registro dei manifest la applicano. Gli host più vecchi saltano il Plugin; le stringhe di versione non valide vengono rifiutate.
  </Accordion>
  <Accordion title="Installazioni npm bloccate">
    Per installazioni npm bloccate, mantieni la versione esatta in `npmSpec` e aggiungi l'integrità attesa dell'artefatto:

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
  <Accordion title="Ambito di allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` non è un bypass generale per configurazioni rotte. È pensato solo per un recupero mirato dei Plugin inclusi, così reinstallazione/setup può riparare residui noti di aggiornamenti, come un percorso mancante di Plugin incluso o una voce `channels.<id>` obsoleta per quel medesimo Plugin. Se la configurazione è rotta per motivi non correlati, l'installazione continua a fallire in modo chiuso e indica all'operatore di eseguire `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

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

Quando è attivo, OpenClaw carica solo `setupEntry` durante la fase di avvio pre-listen, anche per i canali già configurati. L'entry completa viene caricata dopo che il Gateway inizia ad ascoltare.

<Warning>
Attiva il caricamento differito solo quando `setupEntry` registra tutto ciò di cui il Gateway ha bisogno prima di iniziare ad ascoltare (registrazione del canale, route HTTP, metodi del Gateway). Se l'entry completa possiede capacità di avvio richieste, mantieni il comportamento predefinito.
</Warning>

Se la tua entry di setup/completa registra metodi RPC del Gateway, mantienili su un prefisso specifico del Plugin. Gli spazi dei nomi amministrativi core riservati (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e vengono sempre risolti verso `operator.admin`.

## Manifest del Plugin

Ogni Plugin nativo deve includere un file `openclaw.plugin.json` nella radice del pacchetto. OpenClaw lo usa per validare la configurazione senza eseguire il codice del Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Aggiunge le funzionalità di My Plugin a OpenClaw",
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

## Pubblicazione su ClawHub

Per i pacchetti Plugin, usa il comando ClawHub specifico per i pacchetti:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L'alias legacy di pubblicazione solo per Skills è destinato alle Skills. I pacchetti Plugin devono sempre usare `clawhub package publish`.
</Note>

## Setup entry

Il file `setup-entry.ts` è un'alternativa leggera a `index.ts` che OpenClaw carica quando ha bisogno solo delle superfici di setup (onboarding, riparazione della configurazione, ispezione dei canali disabilitati).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice runtime pesante (librerie crittografiche, registrazioni CLI, servizi in background) durante i flussi di setup.

I canali workspace inclusi che mantengono esportazioni sicure per il setup in moduli sidecar possono usare `defineBundledChannelSetupEntry(...)` da `openclaw/plugin-sdk/channel-entry-contract` invece di `defineSetupPluginEntry(...)`. Quel contratto incluso supporta anche un export `runtime` opzionale, così il collegamento runtime al momento del setup può restare leggero ed esplicito.

<AccordionGroup>
  <Accordion title="Quando OpenClaw usa setupEntry invece dell'entry completa">
    - Il canale è disabilitato ma richiede superfici di setup/onboarding.
    - Il canale è abilitato ma non configurato.
    - Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Cosa deve registrare setupEntry">
    - L'oggetto Plugin del canale (tramite `defineSetupPluginEntry`).
    - Eventuali route HTTP richieste prima che il Gateway inizi ad ascoltare.
    - Eventuali metodi del Gateway necessari durante l'avvio.

    Questi metodi Gateway di avvio dovrebbero comunque evitare spazi dei nomi amministrativi core riservati come `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Cosa NON dovrebbe includere setupEntry">
    - Registrazioni CLI.
    - Servizi in background.
    - Import runtime pesanti (crypto, SDK).
    - Metodi del Gateway necessari solo dopo l'avvio.

  </Accordion>
</AccordionGroup>

### Import helper di setup mirati

Per percorsi ad alta frequenza solo setup, preferisci i punti di accesso helper di setup mirati invece del più ampio contenitore `plugin-sdk/setup` quando ti serve solo una parte della superficie di setup:

| Percorso di importazione             | Usalo per                                                                                | Export principali                                                                                                                                                                                                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`           | helper runtime al momento del setup che restano disponibili in `setupEntry` / avvio differito del canale | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`   | adapter di setup account consapevoli dell'ambiente                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                          |
| `plugin-sdk/setup-tools`             | helper CLI/archivio/documentazione per setup/installazione                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Usa il punto di accesso più ampio `plugin-sdk/setup` quando vuoi l'intera cassetta degli attrezzi di setup condivisa, inclusi gli helper di patch della configurazione come `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch di setup restano sicuri all'importazione sui percorsi ad alta frequenza. La loro ricerca della superficie di contratto per la promozione di account singolo inclusi è lazy, quindi importare `plugin-sdk/setup-runtime` non carica in anticipo la scoperta della superficie di contratto inclusa prima che l'adapter venga effettivamente usato.

### Promozione account singolo di proprietà del canale

Quando un canale passa da una configurazione top-level a singolo account a `channels.<id>.accounts.*`, il comportamento condiviso predefinito sposta i valori promossi con ambito account in `accounts.default`.

I canali inclusi possono restringere o sostituire quella promozione tramite la loro superficie di contratto di setup:

- `singleAccountKeysToMove`: chiavi top-level aggiuntive che devono essere spostate nell'account promosso
- `namedAccountPromotionKeys`: quando esistono già account con nome, solo queste chiavi vengono spostate nell'account promosso; le chiavi condivise di policy/delivery restano alla radice del canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente riceve i valori promossi

<Note>
Matrix è l'esempio incluso attuale. Se esiste già esattamente un account Matrix con nome, o se `defaultAccount` punta a una chiave esistente non canonica come `Ops`, la promozione preserva quell'account invece di creare una nuova voce `accounts.default`.
</Note>

## Schema di configurazione

La configurazione del Plugin viene validata rispetto allo JSON Schema nel tuo manifest. Gli utenti configurano i plugin tramite:

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

### Creazione di schemi di configurazione del canale

Usa `buildChannelConfigSchema` per convertire uno schema Zod nel wrapper `ChannelConfigSchema` usato dagli artefatti di configurazione di proprietà del Plugin:

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

Per i Plugin di terze parti, il contratto cold-path resta comunque il manifest del Plugin: rispecchia lo JSON Schema generato in `openclaw.plugin.json#channelConfigs` così lo schema di configurazione, il setup e le superfici UI possono ispezionare `channels.<id>` senza caricare codice runtime.

## Procedure guidate di setup

I Plugin di canale possono fornire procedure guidate di setup interattive per `openclaw onboard`. La procedura guidata è un oggetto `ChannelSetupWizard` sul `ChannelPlugin`:

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
      credentialLabel: "Token del bot",
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

Il tipo `ChannelSetupWizard` supporta `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e altro ancora. Consulta i pacchetti Plugin inclusi (per esempio il Plugin Discord `src/channel.setup.ts`) per esempi completi.

<AccordionGroup>
  <Accordion title="Prompt allowFrom condivisi">
    Per prompt di allowlist DM che richiedono solo il flusso standard `note -> prompt -> parse -> merge -> patch`, preferisci gli helper di setup condivisi da `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Stato standard del setup del canale">
    Per blocchi di stato del setup del canale che variano solo per etichette, punteggi e righe aggiuntive opzionali, preferisci `createStandardChannelSetupStatus(...)` da `openclaw/plugin-sdk/setup` invece di riscrivere a mano lo stesso oggetto `status` in ogni Plugin.
  </Accordion>
  <Accordion title="Superficie opzionale di setup del canale">
    Per superfici di setup opzionali che dovrebbero apparire solo in determinati contesti, usa `createOptionalChannelSetupSurface` da `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` espone anche i builder di livello inferiore `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando ti serve solo una metà di quella superficie di installazione opzionale.

    L'adapter/procedura guidata opzionale generato fallisce in modo chiuso sulle vere scritture di configurazione. Riusa un unico messaggio di installazione richiesta in `validateInput`, `applyAccountConfig` e `finalize`, e aggiunge un link alla documentazione quando `docsPath` è impostato.

  </Accordion>
  <Accordion title="Helper di setup basati su binari">
    Per UI di setup basate su binari, preferisci gli helper delegati condivisi invece di copiare la stessa logica di collegamento binario/stato in ogni canale:

    - `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette, suggerimenti, punteggi e rilevamento del binario
    - `createCliPathTextInput(...)` per input di testo basati su percorso
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare lazy a una procedura guidata completa più pesante
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo delegare una decisione `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/it/tools/clawhub) o npm, quindi installa:

<Tabs>
  <Tab title="Automatico (prima ClawHub poi npm)">
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
  <Tab title="Specifica del pacchetto npm">
    Non esiste un override `npm:` corrispondente. Usa la normale specifica del pacchetto npm quando vuoi il percorso npm dopo il fallback da ClawHub:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin nel repository:** inseriscili nell'albero workspace dei Plugin inclusi e verranno rilevati automaticamente durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
Per installazioni provenienti da npm, `openclaw plugins install` esegue `npm install --ignore-scripts` locale al progetto (senza lifecycle script), ignorando le impostazioni di installazione npm globali ereditate. Mantieni gli alberi di dipendenze dei Plugin in puro JS/TS ed evita pacchetti che richiedono build `postinstall`.
</Info>

<Note>
I Plugin inclusi di proprietà di OpenClaw sono l'unica eccezione per la riparazione all'avvio: quando un'installazione pacchettizzata ne trova uno abilitato tramite configurazione del Plugin, configurazione legacy del canale o il suo manifest incluso abilitato per impostazione predefinita, all'avvio vengono installate le dipendenze runtime mancanti di quel Plugin prima dell'importazione. I Plugin di terze parti non dovrebbero fare affidamento sulle installazioni all'avvio; continua a usare l'installer esplicito dei Plugin.
</Note>

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) — guida introduttiva passo passo
- [Manifest del Plugin](/it/plugins/manifest) — riferimento completo allo schema del manifest
- [Punti di ingresso SDK](/it/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
