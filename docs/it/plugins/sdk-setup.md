---
read_when:
    - Stai aggiungendo una procedura guidata di configurazione a un plugin
    - È necessario comprendere la differenza tra setup-entry.ts e index.ts
    - Stai definendo schemi di configurazione dei Plugin o metadati openclaw in package.json
sidebarTitle: Setup and config
summary: Procedure guidate di configurazione, setup-entry.ts, schemi di configurazione e metadati di package.json
title: Impostazione e configurazione dei Plugin
x-i18n:
    generated_at: "2026-04-30T09:06:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Riferimento per il packaging dei plugin (metadati `package.json`), i manifest (`openclaw.plugin.json`), le voci di configurazione iniziale e gli schemi di configurazione.

<Tip>
**Cerchi una guida passo passo?** Le guide pratiche trattano il packaging nel contesto: [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugin provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del pacchetto

Il tuo `package.json` richiede un campo `openclaw` che indica al sistema di plugin cosa fornisce il tuo plugin:

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
Se pubblichi il plugin esternamente su ClawHub, quei campi `compat` e `build` sono obbligatori. Gli snippet canonici per la pubblicazione si trovano in `docs/snippets/plugin-publish/`.
</Note>

### Campi `openclaw`

<ParamField path="extensions" type="string[]">
  File dei punti di ingresso (relativi alla radice del pacchetto).
</ParamField>
<ParamField path="setupEntry" type="string">
  Voce leggera solo per la configurazione iniziale (opzionale).
</ParamField>
<ParamField path="channel" type="object">
  Metadati del catalogo dei canali per configurazione iniziale, selettore, avvio rapido e superfici di stato.
</ParamField>
<ParamField path="providers" type="string[]">
  ID provider registrati da questo plugin.
</ParamField>
<ParamField path="install" type="object">
  Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flag di comportamento all'avvio.
</ParamField>

### `openclaw.channel`

`openclaw.channel` è metadato di pacchetto leggero per la scoperta dei canali e le superfici di configurazione iniziale prima del caricamento del runtime.

| Campo                                  | Tipo       | Cosa significa                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canale canonico.                                                           |
| `label`                                | `string`   | Etichetta principale del canale.                                              |
| `selectionLabel`                       | `string`   | Etichetta del selettore/configurazione iniziale quando deve differire da `label`. |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per cataloghi canali e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso della documentazione per link di configurazione iniziale e selezione. |
| `docsLabel`                            | `string`   | Etichetta sostitutiva usata per i link alla documentazione quando deve differire dall'ID canale. |
| `blurb`                                | `string`   | Breve descrizione per onboarding/catalogo.                                    |
| `order`                                | `number`   | Ordine di ordinamento nei cataloghi canali.                                   |
| `aliases`                              | `string[]` | Alias aggiuntivi per la ricerca nella selezione canale.                       |
| `preferOver`                           | `string[]` | ID plugin/canale a priorità inferiore che questo canale deve superare in priorità. |
| `systemImage`                          | `string`   | Nome opzionale di icona/immagine di sistema per cataloghi UI dei canali.       |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei link alla documentazione nelle superfici di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso della documentazione invece di un link alla documentazione con etichetta nel testo di selezione. |
| `selectionExtras`                      | `string[]` | Stringhe brevi aggiuntive accodate nel testo di selezione.                    |
| `markdownCapable`                      | `boolean`  | Contrassegna il canale come compatibile con markdown per le decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per configurazione iniziale, elenchi configurati e superfici della documentazione. |
| `quickstartAllowFrom`                  | `boolean`  | Abilita questo canale al flusso standard di configurazione iniziale rapida `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Richiede l'associazione esplicita dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la ricerca sessione durante la risoluzione dei destinatari di annuncio per questo canale. |

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

- `configured`: include il canale nelle superfici di elenco in stile configurato/stato
- `setup`: include il canale nei selettori interattivi di configurazione iniziale/configurazione
- `docs`: contrassegna il canale come pubblico nelle superfici di documentazione/navigazione

<Note>
`showConfigured` e `showInSetup` restano supportati come alias legacy. Preferisci `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` è metadato di pacchetto, non metadato di manifest.

| Campo                        | Tipo                 | Cosa significa                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Specifica npm canonica per flussi di installazione/aggiornamento.                |
| `localPath`                  | `string`             | Percorso di sviluppo locale o di installazione in bundle.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Sorgente di installazione preferita quando entrambe sono disponibili.            |
| `minHostVersion`             | `string`             | Versione minima supportata di OpenClaw nel formato `>=x.y.z`.                    |
| `expectedIntegrity`          | `string`             | Stringa di integrità prevista della distribuzione npm, di solito `sha512-...`, per installazioni bloccate. |
| `allowInvalidConfigRecovery` | `boolean`            | Consente ai flussi di reinstallazione dei plugin in bundle di recuperare da specifici errori di configurazione obsoleta. |

<AccordionGroup>
  <Accordion title="Comportamento di onboarding">
    L'onboarding interattivo usa anche `openclaw.install` per le superfici di installazione on demand. Se il tuo plugin espone scelte di autenticazione provider o metadati di configurazione iniziale/catalogo del canale prima del caricamento del runtime, l'onboarding può mostrare quella scelta, chiedere l'installazione npm o locale, installare o abilitare il plugin, quindi continuare il flusso selezionato. Le scelte di onboarding npm richiedono metadati di catalogo attendibili con un `npmSpec` di registry; versioni esatte ed `expectedIntegrity` sono pin opzionali. Se `expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo applicano. Mantieni i metadati "cosa mostrare" in `openclaw.plugin.json` e i metadati "come installarlo" in `package.json`.
  </Accordion>
  <Accordion title="Applicazione di minHostVersion">
    Se `minHostVersion` è impostato, sia l'installazione sia il caricamento del registry dei manifest lo applicano. Gli host più vecchi saltano il plugin; le stringhe di versione non valide vengono rifiutate.
  </Accordion>
  <Accordion title="Installazioni npm bloccate">
    Per le installazioni npm bloccate, mantieni la versione esatta in `npmSpec` e aggiungi l'integrità prevista dell'artefatto:

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
    `allowInvalidConfigRecovery` non è un bypass generale per configurazioni rotte. È destinato solo al recupero ristretto dei plugin in bundle, così reinstallazione/configurazione iniziale può riparare residui di aggiornamento noti, come un percorso di plugin in bundle mancante o una voce `channels.<id>` obsoleta per quello stesso plugin. Se la configurazione è rotta per motivi non correlati, l'installazione continua a fallire in modo chiuso e indica all'operatore di eseguire `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Caricamento completo differito

I plugin di canale possono optare per il caricamento differito con:

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

Quando abilitato, OpenClaw carica solo `setupEntry` durante la fase di avvio pre-ascolto, anche per i canali già configurati. La voce completa viene caricata dopo che il gateway inizia ad ascoltare.

<Warning>
Abilita il caricamento differito solo quando il tuo `setupEntry` registra tutto ciò di cui il gateway ha bisogno prima di iniziare ad ascoltare (registrazione canale, route HTTP, metodi gateway). Se la voce completa possiede capacità di avvio obbligatorie, mantieni il comportamento predefinito.
</Warning>

Se la tua voce di configurazione iniziale/completa registra metodi RPC gateway, mantienili su un prefisso specifico del plugin. Gli spazi dei nomi core amministrativi riservati (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e si risolvono sempre in `operator.admin`.

## Manifest del plugin

Ogni plugin nativo deve includere un `openclaw.plugin.json` nella radice del pacchetto. OpenClaw lo usa per validare la configurazione senza eseguire codice del plugin.

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

Vedi [Manifest del plugin](/it/plugins/manifest) per il riferimento completo dello schema.

## Pubblicazione su ClawHub

Per i pacchetti di plugin, usa il comando ClawHub specifico del pacchetto:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L'alias di pubblicazione legacy solo per skill è per le Skills. I pacchetti di plugin devono sempre usare `clawhub package publish`.
</Note>

## Voce di configurazione iniziale

Il file `setup-entry.ts` è un'alternativa leggera a `index.ts` che OpenClaw carica quando ha bisogno solo delle superfici di configurazione iniziale (onboarding, riparazione configurazione, ispezione dei canali disabilitati).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice di runtime pesante (librerie crittografiche, registrazioni CLI, servizi in background) durante i flussi di configurazione.

I canali del workspace inclusi che mantengono esportazioni sicure per la configurazione in moduli sidecar possono usare `defineBundledChannelSetupEntry(...)` da `openclaw/plugin-sdk/channel-entry-contract` invece di `defineSetupPluginEntry(...)`. Quel contratto incluso supporta anche un’esportazione opzionale `runtime`, così il cablaggio del runtime in fase di configurazione può rimanere leggero ed esplicito.

<AccordionGroup>
  <Accordion title="Quando OpenClaw usa setupEntry invece dell’entry completa">
    - Il canale è disabilitato ma richiede superfici di configurazione/onboarding.
    - Il canale è abilitato ma non configurato.
    - Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Cosa deve registrare setupEntry">
    - L’oggetto Plugin del canale (tramite `defineSetupPluginEntry`).
    - Qualsiasi route HTTP richiesta prima dell’ascolto del Gateway.
    - Qualsiasi metodo del Gateway necessario durante l’avvio.

    Quei metodi del Gateway all’avvio dovrebbero comunque evitare namespace amministrativi core riservati come `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Cosa setupEntry NON dovrebbe includere">
    - Registrazioni CLI.
    - Servizi in background.
    - Import runtime pesanti (crittografia, SDK).
    - Metodi del Gateway necessari solo dopo l’avvio.

  </Accordion>
</AccordionGroup>

### Import ristretti degli helper di configurazione

Per i percorsi caldi solo di configurazione, preferisci i punti di estensione ristretti degli helper di configurazione rispetto all’ombrello più ampio `plugin-sdk/setup` quando ti serve solo una parte della superficie di configurazione:

| Percorso di import                  | Usalo per                                                                                 | Esportazioni chiave                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | helper runtime in fase di configurazione che restano disponibili in `setupEntry` / avvio differito del canale | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adapter di configurazione account consapevoli dell’ambiente                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`            | helper CLI/archivio/docs per configurazione/installazione                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Usa il punto di estensione più ampio `plugin-sdk/setup` quando vuoi l’intero toolkit condiviso di configurazione, inclusi helper per patch della configurazione come `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch della configurazione restano sicuri da importare nei percorsi caldi. La ricerca della superficie di contratto inclusa per la promozione a singolo account è lazy, quindi importare `plugin-sdk/setup-runtime` non carica subito la discovery della superficie di contratto inclusa prima che l’adapter venga effettivamente usato.

### Promozione a singolo account di proprietà del canale

Quando un canale passa da una configurazione top-level a singolo account a `channels.<id>.accounts.*`, il comportamento condiviso predefinito è spostare i valori promossi con ambito account in `accounts.default`.

I canali inclusi possono restringere o sovrascrivere quella promozione tramite la loro superficie di contratto di configurazione:

- `singleAccountKeysToMove`: chiavi top-level aggiuntive che dovrebbero essere spostate nell’account promosso
- `namedAccountPromotionKeys`: quando esistono già account nominati, solo queste chiavi vengono spostate nell’account promosso; le chiavi condivise di policy/delivery restano alla root del canale
- `resolveSingleAccountPromotionTarget(...)`: scegli quale account esistente riceve i valori promossi

<Note>
Matrix è l’esempio incluso attuale. Se esiste già esattamente un account Matrix nominato, oppure se `defaultAccount` punta a una chiave non canonica esistente come `Ops`, la promozione preserva quell’account invece di creare una nuova voce `accounts.default`.
</Note>

## Schema di configurazione

La configurazione del Plugin viene validata rispetto allo schema JSON nel manifest. Gli utenti configurano i Plugin tramite:

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

### Creazione degli schemi di configurazione del canale

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

Per Plugin di terze parti, il contratto del percorso freddo resta il manifest del Plugin: rispecchia lo schema JSON generato in `openclaw.plugin.json#channelConfigs` così che schema di configurazione, configurazione e superfici UI possano ispezionare `channels.<id>` senza caricare codice di runtime.

## Wizard di configurazione

I Plugin di canale possono fornire wizard di configurazione interattivi per `openclaw onboard`. Il wizard è un oggetto `ChannelSetupWizard` su `ChannelPlugin`:

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

Il tipo `ChannelSetupWizard` supporta `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e altro. Consulta i pacchetti Plugin inclusi (per esempio il Plugin Discord `src/channel.setup.ts`) per esempi completi.

<AccordionGroup>
  <Accordion title="Prompt allowFrom condivisi">
    Per i prompt della allowlist DM che richiedono solo il flusso standard `note -> prompt -> parse -> merge -> patch`, preferisci gli helper di configurazione condivisi da `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Stato standard della configurazione del canale">
    Per i blocchi di stato della configurazione del canale che variano solo per etichette, punteggi e righe extra opzionali, preferisci `createStandardChannelSetupStatus(...)` da `openclaw/plugin-sdk/setup` invece di ricreare manualmente lo stesso oggetto `status` in ogni Plugin.
  </Accordion>
  <Accordion title="Superficie opzionale di configurazione del canale">
    Per superfici di configurazione opzionali che dovrebbero comparire solo in determinati contesti, usa `createOptionalChannelSetupSurface` da `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` espone anche i builder di livello inferiore `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando ti serve solo una metà di quella superficie di installazione opzionale.

    L’adapter/wizard opzionale generato fallisce in modo chiuso sulle scritture reali della configurazione. Riutilizza un unico messaggio di installazione richiesta in `validateInput`, `applyAccountConfig` e `finalize`, e aggiunge un link alla documentazione quando `docsPath` è impostato.

  </Accordion>
  <Accordion title="Helper di configurazione basati su binari">
    Per UI di configurazione basate su binari, preferisci gli helper delegati condivisi invece di copiare lo stesso collante binario/stato in ogni canale:

    - `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette, suggerimenti, punteggi e rilevamento del binario
    - `createCliPathTextInput(...)` per input di testo basati su percorso
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare in modo lazy a un wizard completo più pesante
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo delegare una decisione `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/it/tools/clawhub), poi installa:

<Tabs>
  <Tab title="Auto (prima ClawHub poi npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw prova prima ClawHub e passa automaticamente a npm come fallback.

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spec pacchetto npm">
    Usa npm quando un pacchetto non è ancora passato a ClawHub, oppure quando hai bisogno di un
    percorso diretto di installazione npm durante la migrazione:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin nel repository:** posizionali sotto l’albero del workspace dei Plugin inclusi e verranno scoperti automaticamente durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
Per le installazioni provenienti da npm, `openclaw plugins install` esegue `npm install --ignore-scripts` locale al progetto (nessuno script di lifecycle), ignorando le impostazioni globali ereditate di installazione npm. Mantieni gli alberi delle dipendenze del Plugin in puro JS/TS ed evita pacchetti che richiedono build `postinstall`.
</Info>

<Note>
I plugin in bundle di proprietà di OpenClaw sono l'unica eccezione alla riparazione all'avvio: quando un'installazione pacchettizzata ne trova uno abilitato dalla configurazione del plugin, dalla configurazione legacy del canale o dal suo manifest in bundle abilitato per impostazione predefinita, all'avvio installa le dipendenze runtime mancanti di quel plugin prima dell'importazione. Gli operatori possono ispezionare o riparare quella fase con `openclaw plugins deps`. I plugin di terze parti non devono fare affidamento sulle installazioni all'avvio; continuare a usare l'installer esplicito dei plugin.
</Note>

Le dipendenze runtime in bundle a livello di pacchetto sono metadati espliciti, non dedotti dal JavaScript compilato all'avvio del Gateway. Se una dipendenza root condivisa di OpenClaw deve essere disponibile all'interno del mirror runtime esterno dei plugin in bundle, dichiararla in `openclaw.bundle.mirroredRootRuntimeDependencies` nel manifest del pacchetto root.

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins) — guida introduttiva passo passo
- [Manifest del plugin](/it/plugins/manifest) — riferimento completo dello schema del manifest
- [Punti di ingresso SDK](/it/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
