---
read_when:
    - Stai aggiungendo una procedura guidata di configurazione a un Plugin
    - Devi comprendere setup-entry.ts rispetto a index.ts
    - Stai definendo schemi di configurazione dei Plugin o metadati openclaw in package.json
sidebarTitle: Setup and config
summary: Procedure guidate di configurazione, setup-entry.ts, schemi di configurazione e metadati di package.json
title: Impostazione e configurazione del Plugin
x-i18n:
    generated_at: "2026-05-02T20:59:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Riferimento per il packaging dei Plugin (metadati `package.json`), i manifest (`openclaw.plugin.json`), le voci di setup e gli schemi di configurazione.

<Tip>
**Cerchi una guida passo passo?** Le guide pratiche trattano il packaging nel contesto: [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugin provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del pacchetto

Il tuo `package.json` richiede un campo `openclaw` che indica al sistema dei Plugin cosa fornisce il tuo Plugin:

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
Se pubblichi il Plugin esternamente su ClawHub, quei campi `compat` e `build` sono obbligatori. Gli snippet di pubblicazione canonici si trovano in `docs/snippets/plugin-publish/`.
</Note>

### Campi `openclaw`

<ParamField path="extensions" type="string[]">
  File dei punti di ingresso (relativi alla radice del pacchetto).
</ParamField>
<ParamField path="setupEntry" type="string">
  Voce leggera solo per il setup (facoltativa).
</ParamField>
<ParamField path="channel" type="object">
  Metadati del catalogo dei canali per setup, selettore, avvio rapido e superfici di stato.
</ParamField>
<ParamField path="providers" type="string[]">
  ID dei provider registrati da questo Plugin.
</ParamField>
<ParamField path="install" type="object">
  Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flag del comportamento di avvio.
</ParamField>

### `openclaw.channel`

`openclaw.channel` è un metadato di pacchetto leggero per il rilevamento dei canali e le superfici di setup prima del caricamento a runtime.

| Campo                                  | Tipo       | Significato                                                                   |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canonico del canale.                                                       |
| `label`                                | `string`   | Etichetta principale del canale.                                              |
| `selectionLabel`                       | `string`   | Etichetta del selettore/setup quando deve differire da `label`.               |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per cataloghi di canali e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso della documentazione per i link di setup e selezione.                |
| `docsLabel`                            | `string`   | Etichetta sostitutiva usata per i link alla documentazione quando deve differire dall'ID del canale. |
| `blurb`                                | `string`   | Breve descrizione per onboarding/catalogo.                                    |
| `order`                                | `number`   | Ordinamento nei cataloghi dei canali.                                         |
| `aliases`                              | `string[]` | Alias di ricerca aggiuntivi per la selezione del canale.                      |
| `preferOver`                           | `string[]` | ID di Plugin/canali a priorità inferiore che questo canale deve superare.     |
| `systemImage`                          | `string`   | Nome facoltativo di icona/immagine di sistema per i cataloghi UI dei canali.  |
| `selectionDocsPrefix`                  | `string`   | Testo di prefisso prima dei link alla documentazione nelle superfici di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso della documentazione invece di un link etichettato alla documentazione nel testo di selezione. |
| `selectionExtras`                      | `string[]` | Brevi stringhe aggiuntive accodate nel testo di selezione.                    |
| `markdownCapable`                      | `boolean`  | Contrassegna il canale come compatibile con markdown per le decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per setup, elenchi configurati e superfici della documentazione. |
| `quickstartAllowFrom`                  | `boolean`  | Abilita questo canale al flusso di setup standard di avvio rapido `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Richiede l'associazione esplicita dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la ricerca della sessione quando risolve i target degli annunci per questo canale. |

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

- `configured`: include il canale nelle superfici di elenco in stile configurazione/stato
- `setup`: include il canale nei selettori interattivi di setup/configurazione
- `docs`: contrassegna il canale come pubblico nelle superfici di documentazione/navigazione

<Note>
`showConfigured` e `showInSetup` restano supportati come alias legacy. Preferisci `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` è metadato di pacchetto, non metadato del manifest.

| Campo                        | Tipo                                | Significato                                                                       |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spec ClawHub canonica per installazione/aggiornamento e flussi di onboarding install-on-demand. |
| `npmSpec`                    | `string`                            | Spec npm canonica per i flussi fallback di installazione/aggiornamento.           |
| `localPath`                  | `string`                            | Percorso di sviluppo locale o installazione in bundle.                            |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Origine di installazione preferita quando sono disponibili più origini.           |
| `minHostVersion`             | `string`                            | Versione minima supportata di OpenClaw nel formato `>=x.y.z` o `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Stringa di integrità npm dist attesa, di solito `sha512-...`, per installazioni fissate. |
| `allowInvalidConfigRecovery` | `boolean`                           | Consente ai flussi di reinstallazione dei Plugin in bundle di recuperare da specifici errori di configurazione obsoleti. |

<AccordionGroup>
  <Accordion title="Comportamento di onboarding">
    Anche l'onboarding interattivo usa `openclaw.install` per le superfici install-on-demand. Se il tuo Plugin espone scelte di autenticazione del provider o metadati di setup/catalogo del canale prima del caricamento a runtime, l'onboarding può mostrare quella scelta, chiedere ClawHub, npm o installazione locale, installare o abilitare il Plugin e quindi continuare il flusso selezionato. Le scelte di onboarding ClawHub usano `clawhubSpec` e sono preferite quando presenti; le scelte npm richiedono metadati di catalogo attendibili con un `npmSpec` del registry; versioni esatte e `expectedIntegrity` sono pin npm facoltativi. Se `expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo applicano per npm. Mantieni i metadati su "cosa mostrare" in `openclaw.plugin.json` e i metadati su "come installarlo" in `package.json`.
  </Accordion>
  <Accordion title="Applicazione di minHostVersion">
    Se `minHostVersion` è impostato, sia l'installazione sia il caricamento del registro manifest non in bundle lo applicano. Gli host più vecchi saltano i Plugin esterni; le stringhe di versione non valide vengono rifiutate. Si presume che i Plugin sorgente in bundle siano versionati insieme al checkout dell'host.
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
  <Accordion title="Ambito di allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` non è un bypass generale per configurazioni danneggiate. Serve solo per un recupero limitato dei Plugin in bundle, così reinstallazione/setup possono riparare residui noti di aggiornamento, come un percorso mancante di Plugin in bundle o una voce `channels.<id>` obsoleta per quello stesso Plugin. Se la configurazione è danneggiata per motivi non correlati, l'installazione fallisce comunque in modo chiuso e indica all'operatore di eseguire `openclaw doctor --fix`.
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

Quando abilitato, OpenClaw carica solo `setupEntry` durante la fase di avvio prima dell'ascolto, anche per i canali già configurati. La voce completa viene caricata dopo che il Gateway inizia ad ascoltare.

<Warning>
Abilita il caricamento differito solo quando il tuo `setupEntry` registra tutto ciò di cui il Gateway ha bisogno prima di iniziare ad ascoltare (registrazione del canale, route HTTP, metodi del Gateway). Se la voce completa possiede capacità di avvio richieste, mantieni il comportamento predefinito.
</Warning>

Se la tua voce di setup/completa registra metodi RPC del Gateway, tienili su un prefisso specifico del Plugin. Gli spazi dei nomi di amministrazione core riservati (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e si risolvono sempre in `operator.admin`.

## Manifest del Plugin

Ogni Plugin nativo deve includere un `openclaw.plugin.json` nella radice del pacchetto. OpenClaw lo usa per validare la configurazione senza eseguire codice del Plugin.

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

Consulta [Manifest del Plugin](/it/plugins/manifest) per il riferimento completo dello schema.

## Pubblicazione su ClawHub

Per i pacchetti Plugin, usa il comando ClawHub specifico del pacchetto:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L’alias legacy di pubblicazione solo per Skills è per Skills. I pacchetti Plugin devono sempre usare `clawhub package publish`.
</Note>

## Voce di setup

Il file `setup-entry.ts` è un’alternativa leggera a `index.ts` che OpenClaw carica quando ha bisogno solo delle superfici di setup (onboarding, riparazione della configurazione, ispezione dei canali disabilitati).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice runtime pesante (librerie crittografiche, registrazioni CLI, servizi in background) durante i flussi di setup.

I canali del workspace inclusi che mantengono esportazioni sicure per il setup in moduli sidecar possono usare `defineBundledChannelSetupEntry(...)` da `openclaw/plugin-sdk/channel-entry-contract` invece di `defineSetupPluginEntry(...)`. Quel contratto incluso supporta anche un’esportazione `runtime` facoltativa, così il cablaggio runtime in fase di setup può restare leggero ed esplicito.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Il canale è disabilitato ma richiede superfici di setup/onboarding.
    - Il canale è abilitato ma non configurato.
    - Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - L’oggetto Plugin del canale (tramite `defineSetupPluginEntry`).
    - Qualsiasi route HTTP richiesta prima dell’ascolto del Gateway.
    - Qualsiasi metodo del Gateway necessario durante l’avvio.

    Quei metodi del Gateway di avvio devono comunque evitare namespace amministrativi core riservati come `config.*` o `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Registrazioni CLI.
    - Servizi in background.
    - Import runtime pesanti (crittografia, SDK).
    - Metodi del Gateway necessari solo dopo l’avvio.

  </Accordion>
</AccordionGroup>

### Import mirati degli helper di setup

Per percorsi caldi solo di setup, preferisci le interfacce helper di setup mirate rispetto all’ombrello più ampio `plugin-sdk/setup` quando ti serve solo una parte della superficie di setup:

| Percorso di import                 | Usalo per                                                                                 | Esportazioni chiave                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime in fase di setup che restano disponibili in `setupEntry` / avvio differito del canale | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter di setup account consapevoli dell’ambiente                                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper per setup/installazione CLI/archivi/docs                                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Usa l’interfaccia più ampia `plugin-sdk/setup` quando vuoi l’intero toolkit di setup condiviso, inclusi helper per patch di configurazione come `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch del setup restano sicuri da importare nei percorsi caldi. La ricerca della superficie del contratto inclusa per la promozione ad account singolo è lazy, quindi importare `plugin-sdk/setup-runtime` non carica immediatamente il rilevamento della superficie del contratto inclusa prima che l’adapter venga effettivamente usato.

### Promozione ad account singolo di proprietà del canale

Quando un canale passa da una configurazione top-level ad account singolo a `channels.<id>.accounts.*`, il comportamento condiviso predefinito sposta i valori promossi con ambito account in `accounts.default`.

I canali inclusi possono restringere o sovrascrivere quella promozione tramite la propria superficie del contratto di setup:

- `singleAccountKeysToMove`: chiavi top-level aggiuntive che devono spostarsi nell’account promosso
- `namedAccountPromotionKeys`: quando esistono già account denominati, solo queste chiavi si spostano nell’account promosso; le chiavi condivise di policy/consegna restano alla radice del canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente riceve i valori promossi

<Note>
Matrix è l’esempio incluso attuale. Se esiste già esattamente un account Matrix denominato, oppure se `defaultAccount` punta a una chiave non canonica esistente come `Ops`, la promozione preserva quell’account invece di creare una nuova voce `accounts.default`.
</Note>

## Schema di configurazione

La configurazione del Plugin viene validata rispetto al JSON Schema nel tuo manifest. Gli utenti configurano i plugin tramite:

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

### Creazione degli schemi di configurazione dei canali

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

Se scrivi già il contratto come JSON Schema o TypeBox, usa l’helper diretto così OpenClaw può saltare la conversione da Zod a JSON Schema nei percorsi dei metadati:

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

Per i plugin di terze parti, il contratto del percorso freddo resta il manifest del Plugin: replica il JSON Schema generato in `openclaw.plugin.json#channelConfigs` così lo schema di configurazione, il setup e le superfici UI possono ispezionare `channels.<id>` senza caricare codice runtime.

## Wizard di setup

I Plugin di canale possono fornire wizard di setup interattivi per `openclaw onboard`. Il wizard è un oggetto `ChannelSetupWizard` su `ChannelPlugin`:

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

Il tipo `ChannelSetupWizard` supporta `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e altro. Vedi i pacchetti Plugin inclusi (per esempio il Plugin Discord `src/channel.setup.ts`) per esempi completi.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    Per i prompt dell’allowlist DM che richiedono solo il flusso standard `note -> prompt -> parse -> merge -> patch`, preferisci gli helper di setup condivisi da `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Per i blocchi di stato del setup del canale che variano solo per etichette, punteggi e righe aggiuntive facoltative, preferisci `createStandardChannelSetupStatus(...)` da `openclaw/plugin-sdk/setup` invece di ricreare manualmente lo stesso oggetto `status` in ogni Plugin.
  </Accordion>
  <Accordion title="Optional channel setup surface">
    Per superfici di setup facoltative che devono apparire solo in determinati contesti, usa `createOptionalChannelSetupSurface` da `openclaw/plugin-sdk/channel-setup`:

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

    L’adapter/wizard facoltativo generato fallisce in modo chiuso sulle scritture di configurazione reali. Riutilizza un unico messaggio di installazione richiesta tra `validateInput`, `applyAccountConfig` e `finalize`, e aggiunge un link alla documentazione quando `docsPath` è impostato.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Per UI di setup basate su binari, preferisci gli helper delegati condivisi invece di copiare lo stesso collante binario/stato in ogni canale:

    - `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette, suggerimenti, punteggi e rilevamento del binario
    - `createCliPathTextInput(...)` per input di testo basati su percorso
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare lazy a un wizard completo più pesante
    - `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo delegare una decisione `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/it/tools/clawhub), poi installa:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Le specifiche di pacchetto semplici installano da npm durante il passaggio di lancio.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Usa npm quando un pacchetto non è ancora passato a ClawHub, oppure quando ti serve un
    percorso di installazione npm diretto durante la migrazione:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin nel repository:** collocali nell'albero dell'area di lavoro dei Plugin inclusi in bundle e verranno rilevati automaticamente durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
Per le installazioni provenienti da npm, `openclaw plugins install` installa il pacchetto in `~/.openclaw/npm` con gli script del ciclo di vita disabilitati. Mantieni gli alberi delle dipendenze dei plugin in JS/TS puro ed evita i pacchetti che richiedono build `postinstall`.
</Info>

<Note>
L'avvio del Gateway non installa le dipendenze dei plugin. I flussi di installazione npm/git/ClawHub gestiscono l'allineamento delle dipendenze; i plugin locali devono avere già installato le proprie dipendenze.
</Note>

I metadati dei pacchetti inclusi sono espliciti, non dedotti dal JavaScript compilato all'avvio del Gateway. Le dipendenze di runtime appartengono al pacchetto plugin che le possiede; l'avvio di OpenClaw pacchettizzato non ripara né replica mai le dipendenze dei plugin.

## Correlati

- [Creare plugin](/it/plugins/building-plugins) — guida introduttiva dettagliata
- [Manifest del Plugin](/it/plugins/manifest) — riferimento completo allo schema del manifest
- [Punti di ingresso dell'SDK](/it/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
