---
read_when:
    - Stai aggiungendo una procedura guidata di configurazione a un plugin
    - Devi comprendere setup-entry.ts rispetto a index.ts
    - Stai definendo gli schemi di configurazione dei plugin o i metadati openclaw di package.json
sidebarTitle: Setup and config
summary: Procedure guidate di configurazione, setup-entry.ts, schemi di configurazione e metadati di package.json
title: Configurazione e impostazioni del Plugin
x-i18n:
    generated_at: "2026-07-12T07:24:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Riferimento per il pacchettamento dei Plugin (metadati di `package.json`), i manifest (`openclaw.plugin.json`), gli entry point di configurazione e gli schemi di configurazione.

<Tip>
**Cerchi una guida dettagliata?** Le guide pratiche illustrano il pacchettamento nel relativo contesto: [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugin provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del pacchetto

Il tuo `package.json` deve contenere un campo `openclaw` che indichi al sistema dei Plugin ciò che il tuo Plugin fornisce:

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
  <Tab title="Plugin provider / configurazione di base ClawHub">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
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
La pubblicazione esterna su ClawHub richiede `compat` e `build`. I frammenti canonici per la pubblicazione si trovano in `docs/snippets/plugin-publish/`.
</Note>

### Campi di `openclaw`

<ParamField path="extensions" type="string[]">
  File degli entry point (relativi alla radice del pacchetto). Entry point sorgente validi per lo sviluppo nell'area di lavoro e nei checkout git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Controparti JavaScript compilate di `extensions`, preferite quando OpenClaw carica un pacchetto npm installato. Consulta [Entry point dell'SDK](/it/plugins/sdk-entrypoints) per l'ordine di risoluzione tra sorgente e versione compilata.
</ParamField>
<ParamField path="setupEntry" type="string">
  Entry point leggero riservato alla configurazione (facoltativo).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Controparte JavaScript compilata di `setupEntry`. Richiede che sia impostato anche `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Identità di riserva del Plugin `{ id, label }`, utilizzata quando un Plugin non dispone di metadati di canale/provider da cui ricavare un id o un'etichetta.
</ParamField>
<ParamField path="channel" type="object">
  Metadati del catalogo dei canali per le interfacce di configurazione, selezione, avvio rapido e stato.
</ParamField>
<ParamField path="install" type="object">
  Indicazioni per l'installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Flag del comportamento di avvio.
</ParamField>
<ParamField path="compat" type="object">
  Intervallo di versioni di `pluginApi` supportato da questo Plugin. Obbligatorio per le pubblicazioni esterne su ClawHub.
</ParamField>

<Note>
Gli id dei provider (`providers: string[]`) sono metadati del manifest, non del pacchetto. Dichiarali in `openclaw.plugin.json`, non qui; consulta [Manifest del Plugin](/it/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` contiene metadati leggeri del pacchetto per il rilevamento dei canali e le interfacce di configurazione prima del caricamento del runtime.

| Campo                                  | Tipo       | Significato                                                                    |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Id canonico del canale.                                                        |
| `label`                                | `string`   | Etichetta principale del canale.                                               |
| `selectionLabel`                       | `string`   | Etichetta di selezione/configurazione quando deve differire da `label`.        |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per cataloghi dei canali e interfacce di stato più complete. |
| `docsPath`                             | `string`   | Percorso della documentazione per i collegamenti di configurazione e selezione. |
| `docsLabel`                            | `string`   | Etichetta alternativa per i collegamenti alla documentazione, quando deve differire dall'id del canale. |
| `blurb`                                | `string`   | Breve descrizione per l'onboarding e il catalogo.                              |
| `order`                                | `number`   | Ordine di visualizzazione nei cataloghi dei canali.                            |
| `aliases`                              | `string[]` | Alias di ricerca aggiuntivi per la selezione del canale.                       |
| `preferOver`                           | `string[]` | Id di Plugin/canali con priorità inferiore rispetto ai quali questo canale deve prevalere. |
| `systemImage`                          | `string`   | Nome facoltativo dell'icona/immagine di sistema per i cataloghi dei canali dell'interfaccia utente. |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei collegamenti alla documentazione nelle interfacce di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso della documentazione anziché un collegamento etichettato nel testo di selezione. |
| `selectionExtras`                      | `string[]` | Brevi stringhe aggiuntive accodate al testo di selezione.                      |
| `markdownCapable`                      | `boolean`  | Contrassegna il canale come compatibile con Markdown per le decisioni sulla formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per configurazione, elenchi configurati e interfacce della documentazione. |
| `quickstartAllowFrom`                  | `boolean`  | Abilita per questo canale il flusso standard di configurazione `allowFrom` dell'avvio rapido. |
| `forceAccountBinding`                  | `boolean`  | Richiede l'associazione esplicita dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la ricerca della sessione durante la risoluzione delle destinazioni degli annunci per questo canale. |

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

- `configured`: include il canale nelle interfacce di elenco dei canali configurati e di stato
- `setup`: include il canale nei selettori interattivi di configurazione
- `docs`: contrassegna il canale come pubblico nelle interfacce di documentazione e navigazione

<Note>
`showConfigured` e `showInSetup` rimangono supportati come alias legacy. Preferisci `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` è un metadato del pacchetto, non del manifest.

| Campo                        | Tipo                                | Significato                                                                       |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Specifica canonica di ClawHub per installazione/aggiornamento e flussi di onboarding con installazione su richiesta. |
| `npmSpec`                    | `string`                            | Specifica npm canonica per i flussi di installazione/aggiornamento di riserva.    |
| `localPath`                  | `string`                            | Percorso di sviluppo locale o di installazione inclusa.                           |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Origine di installazione preferita quando sono disponibili più origini.           |
| `minHostVersion`             | `string`                            | Versione minima supportata di OpenClaw, `>=x.y.z` o `>=x.y.z-prerelease`.         |
| `expectedIntegrity`          | `string`                            | Stringa di integrità prevista della distribuzione npm, solitamente `sha512-...`, per le installazioni vincolate. |
| `allowInvalidConfigRecovery` | `boolean`                           | Consente ai flussi di reinstallazione dei Plugin inclusi di recuperare da specifici errori dovuti a configurazioni obsolete. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm richiesti e specifici della piattaforma, verificati durante l'installazione npm. |

<AccordionGroup>
  <Accordion title="Comportamento dell'onboarding">
    L'onboarding interattivo usa `openclaw.install` per le interfacce di installazione su richiesta: se il tuo Plugin espone opzioni di autenticazione del provider o metadati di configurazione/catalogo dei canali prima del caricamento del runtime, l'onboarding può richiedere un'installazione da ClawHub, npm o locale, installare o abilitare il Plugin e quindi proseguire con il flusso selezionato. Le opzioni ClawHub usano `clawhubSpec` e sono preferite quando presenti; le opzioni npm richiedono metadati di catalogo attendibili con un `npmSpec` del registro (le versioni esatte e `expectedIntegrity` sono vincoli facoltativi, applicati durante l'installazione o l'aggiornamento quando impostati). Mantieni «cosa mostrare» in `openclaw.plugin.json` e «come installarlo» in `package.json`.
  </Accordion>
  <Accordion title="Applicazione di minHostVersion">
    Se `minHostVersion` è impostato, viene applicato sia durante l'installazione sia durante il caricamento dal registro dei manifest non inclusi. Gli host meno recenti ignorano i Plugin esterni; le stringhe di versione non valide vengono rifiutate. Si presume che i Plugin sorgente inclusi abbiano la stessa versione del checkout dell'host.
  </Accordion>
  <Accordion title="Installazioni npm vincolate">
    Per le installazioni npm vincolate, mantieni la versione esatta in `npmSpec` e aggiungi l'integrità prevista dell'artefatto:

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
    `allowInvalidConfigRecovery` non è un meccanismo generale per aggirare configurazioni non valide. È limitato esclusivamente al recupero dei Plugin inclusi e consente alla reinstallazione/configurazione di correggere residui noti degli aggiornamenti, come un percorso mancante di un Plugin incluso o una voce `channels.<id>` obsoleta relativa allo stesso Plugin. Se la configurazione non è valida per motivi non correlati, l'installazione continua a bloccarsi in modo sicuro e indica all'operatore di eseguire `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Caricamento completo differito

I Plugin di canale possono abilitare il caricamento differito con:

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

Quando questa opzione è abilitata, OpenClaw carica soltanto `setupEntry` durante la fase di avvio precedente all'ascolto, anche per i canali già configurati. L'entry point completo viene caricato dopo che il Gateway inizia l'ascolto.

<Warning>
Abilita il caricamento differito solo quando `setupEntry` registra tutto ciò di cui il Gateway ha bisogno prima di iniziare l'ascolto (registrazione del canale, route HTTP, metodi del Gateway). Se l'entry point completo gestisce funzionalità necessarie all'avvio, mantieni il comportamento predefinito.
</Warning>

Se gli entry point di configurazione/completi registrano metodi RPC del Gateway, mantienili sotto un prefisso specifico del Plugin. Gli spazi dei nomi amministrativi riservati del nucleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del nucleo e vengono sempre normalizzati in `operator.admin`.

## Manifest del Plugin

Ogni plugin nativo deve includere un file `openclaw.plugin.json` nella radice del pacchetto. OpenClaw lo utilizza per convalidare la configurazione senza eseguire il codice del plugin.

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

Per i plugin di canale, aggiungere `channels` (mentre i plugin provider aggiungono `providers`):

```json
{
  "id": "my-channel",
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

Consultare [Manifest del plugin](/it/plugins/manifest) per il riferimento completo dello schema.

## Pubblicazione su ClawHub

I pacchetti di Skills e plugin utilizzano comandi di pubblicazione ClawHub distinti. Per i pacchetti di plugin, utilizzare il comando specifico per i pacchetti:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` è un comando diverso, destinato alla pubblicazione di una cartella di Skills, non di un pacchetto di plugin. Consultare [Pubblicazione su ClawHub](/it/clawhub/publishing).
</Note>

## Punto di ingresso per la configurazione

`setup-entry.ts` è un'alternativa leggera a `index.ts` che OpenClaw carica quando necessita soltanto delle superfici di configurazione (procedura di introduzione, riparazione della configurazione, ispezione dei canali disabilitati):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

In questo modo si evita di caricare codice di runtime pesante (librerie crittografiche, registrazioni CLI, servizi in background) durante i flussi di configurazione.

I canali inclusi nell'area di lavoro che mantengono esportazioni sicure per la configurazione in moduli collaterali possono utilizzare `defineBundledChannelSetupEntry(...)` da `openclaw/plugin-sdk/channel-entry-contract` anziché `defineSetupPluginEntry(...)`. Questo contratto per i componenti inclusi supporta anche un'esportazione facoltativa `runtime`, così il collegamento del runtime durante la configurazione può rimanere leggero ed esplicito.

<AccordionGroup>
  <Accordion title="Quando OpenClaw utilizza setupEntry anziché il punto di ingresso completo">
    - Il canale è disabilitato, ma necessita delle superfici di configurazione o della procedura di introduzione.
    - Il canale è abilitato, ma non configurato.
    - Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Cosa deve registrare setupEntry">
    - L'oggetto del plugin di canale (tramite `defineSetupPluginEntry`).
    - Tutte le route HTTP necessarie prima che il Gateway inizi l'ascolto.
    - Tutti i metodi del Gateway necessari durante l'avvio.

    Tali metodi del Gateway utilizzati all'avvio devono comunque evitare gli spazi dei nomi amministrativi riservati al core, come `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Cosa NON deve includere setupEntry">
    - Registrazioni CLI.
    - Servizi in background.
    - Importazioni di runtime pesanti (crittografia, SDK).
    - Metodi del Gateway necessari soltanto dopo l'avvio.

  </Accordion>
</AccordionGroup>

### Importazioni mirate degli helper di configurazione

Per i percorsi critici dedicati esclusivamente alla configurazione, quando è necessaria soltanto una parte della superficie di configurazione è preferibile utilizzare le interfacce mirate degli helper di configurazione anziché l'interfaccia generale `plugin-sdk/setup`:

| Percorso di importazione           | Utilizzo                                                                                              | Esportazioni principali                                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper di runtime per la configurazione disponibili in `setupEntry` / avvio differito del canale      | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias di compatibilità deprecato; utilizzare `plugin-sdk/setup-runtime`                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helper per CLI, archivi, documentazione e installazione durante la configurazione                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Utilizzare l'interfaccia generale `plugin-sdk/setup` quando è necessario il set completo di strumenti condivisi per la configurazione, inclusi gli helper per le modifiche alla configurazione, come `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Utilizzare `createSetupTranslator(...)` per i testi fissi della procedura guidata di configurazione. Segue la lingua della procedura guidata CLI (`OPENCLAW_LOCALE`, quindi le variabili di lingua del sistema) e ricorre all'inglese come lingua di riserva. Mantenere il testo di configurazione specifico del plugin nel codice di proprietà del plugin e utilizzare le chiavi del catalogo condiviso soltanto per etichette comuni di configurazione, testo di stato e testi di configurazione dei plugin ufficiali inclusi.

Gli adattatori per le modifiche di configurazione rimangono sicuri da importare nei percorsi critici. La ricerca della superficie del contratto per la promozione inclusa di un singolo account è differita; pertanto, l'importazione di `plugin-sdk/setup-runtime` non carica anticipatamente il rilevamento delle superfici dei contratti inclusi prima dell'effettivo utilizzo dell'adattatore.

### Promozione di un singolo account gestita dal canale

Quando un canale passa da una configurazione di primo livello per un singolo account a `channels.<id>.accounts.*`, il comportamento condiviso predefinito sposta i valori promossi specifici dell'account in `accounts.default`.

I canali inclusi possono restringere o sostituire tale promozione tramite la propria superficie del contratto di configurazione:

- `singleAccountKeysToMove`: chiavi aggiuntive di primo livello da spostare nell'account promosso
- `namedAccountPromotionKeys`: quando esistono già account denominati, soltanto queste chiavi vengono spostate nell'account promosso; le chiavi condivise relative a criteri e consegna rimangono nella radice del canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente riceve i valori promossi

<Note>
Matrix è l'esempio incluso attuale. Se esiste già esattamente un account Matrix denominato oppure se `defaultAccount` fa riferimento a una chiave esistente non canonica, come `Ops`, la promozione conserva tale account anziché creare una nuova voce `accounts.default`.
</Note>

## Schema di configurazione

La configurazione del plugin viene convalidata rispetto allo schema JSON nel manifest. Gli utenti configurano i plugin tramite:

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

Durante la registrazione, il plugin riceve questa configurazione come `api.pluginConfig`.

Per la configurazione specifica del canale, utilizzare invece la sezione di configurazione del canale:

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

Utilizzare `buildChannelConfigSchema` per convertire uno schema Zod nel wrapper `ChannelConfigSchema` usato dagli artefatti di configurazione di proprietà del plugin:

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

Se il contratto è già definito come schema JSON o TypeBox, utilizzare l'helper diretto affinché OpenClaw possa evitare la conversione da Zod a schema JSON nei percorsi dei metadati:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

Per i plugin di terze parti, il contratto per i percorsi non critici rimane il manifest del plugin: replicare lo schema JSON generato in `openclaw.plugin.json#channelConfigs`, in modo che lo schema di configurazione, la configurazione e le superfici dell'interfaccia utente possano esaminare `channels.<id>` senza caricare il codice di runtime.

## Procedure guidate di configurazione

I plugin di canale possono fornire procedure guidate interattive per `openclaw onboard`. La procedura guidata è un oggetto `ChannelSetupWizard` nel `ChannelPlugin`:

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

`ChannelSetupWizard` supporta inoltre `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e altro ancora. Consultare `src/setup-core.ts` del plugin Discord per un esempio completo incluso.

<AccordionGroup>
  <Accordion title="Richieste allowFrom condivise">
    Per le richieste relative all'elenco consentito dei messaggi diretti che richiedono soltanto il flusso standard `nota -> richiesta -> analisi -> unione -> modifica`, è preferibile utilizzare gli helper di configurazione condivisi da `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Stato standard della configurazione del canale">
    Per i blocchi di stato della configurazione del canale che variano soltanto per etichette, punteggi e righe aggiuntive facoltative, è preferibile utilizzare `createStandardChannelSetupStatus(...)` da `openclaw/plugin-sdk/setup` anziché ricreare manualmente lo stesso oggetto `status` in ogni plugin.
  </Accordion>
  <Accordion title="Superficie facoltativa di configurazione del canale">
    Per le superfici di configurazione facoltative che devono apparire soltanto in determinati contesti, utilizzare `createOptionalChannelSetupSurface` da `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` espone inoltre i costruttori di livello inferiore `createOptionalChannelSetupAdapter(...)` e `createOptionalChannelSetupWizard(...)` quando è necessaria soltanto una delle due parti di tale superficie di installazione facoltativa.

    L'adattatore/la procedura guidata facoltativi generati adottano un comportamento fail-closed durante le scritture effettive della configurazione. Riutilizzano un unico messaggio che richiede l'installazione in `validateInput`, `applyAccountConfig` e `finalize` e aggiungono un collegamento alla documentazione quando è impostato `docsPath`.

  </Accordion>
  <Accordion title="Helper di configurazione basati su binari">
    Per le interfacce di configurazione basate su binari, preferisci gli helper condivisi con delega anziché copiare in ogni canale la stessa logica di integrazione per binari e stato:

    - `createDetectedBinaryStatus(...)` per i blocchi di stato che variano solo per etichette, suggerimenti, punteggi e rilevamento dei binari
    - `createCliPathTextInput(...)` per gli input di testo basati su percorsi
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare in modo lazy a una procedura guidata completa più articolata
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo delegare una decisione `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/it/clawhub), quindi installa:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Le specifiche di pacchetto semplici vengono installate da npm durante il passaggio all'avvio, a meno che il nome non corrisponda all'ID di un Plugin incluso o ufficiale; in tal caso, OpenClaw usa invece la relativa copia locale/ufficiale. Usa `clawhub:`, `npm:`, `git:` o `npm-pack:` per selezionare la sorgente in modo deterministico — consulta [Gestire i Plugin](/it/plugins/manage-plugins).

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Specifica del pacchetto npm">
    Usa npm quando un pacchetto non è ancora stato trasferito su ClawHub o quando è necessario un
    percorso di installazione diretta da npm durante la migrazione:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin nel repository:** inseriscili nell'albero dell'area di lavoro dei Plugin inclusi; vengono rilevati automaticamente durante la compilazione.

<Info>
Per le installazioni provenienti da npm, `openclaw plugins install` installa il pacchetto in un progetto dedicato al Plugin sotto `~/.openclaw/npm/projects`, con gli script del ciclo di vita disabilitati (`--ignore-scripts`). Mantieni gli alberi delle dipendenze dei Plugin esclusivamente in JS/TS ed evita i pacchetti che richiedono compilazioni `postinstall`.
</Info>

<Note>
L'avvio del Gateway non installa le dipendenze dei Plugin. I flussi di installazione npm/git/ClawHub gestiscono la convergenza delle dipendenze; le dipendenze dei Plugin locali devono essere già installate.
</Note>

I metadati dei pacchetti inclusi sono espliciti e non vengono dedotti dal codice JavaScript compilato all'avvio del Gateway. Le dipendenze di runtime appartengono al pacchetto del Plugin che ne è proprietario; l'avvio della distribuzione di OpenClaw non ripara né duplica mai le dipendenze dei Plugin.

## Contenuti correlati

- [Creazione di Plugin](/it/plugins/building-plugins) — guida introduttiva dettagliata
- [Manifest del Plugin](/it/plugins/manifest) — riferimento completo allo schema del manifest
- [Punti di ingresso dell'SDK](/it/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
