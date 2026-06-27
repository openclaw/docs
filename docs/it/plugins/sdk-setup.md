---
read_when:
    - Stai aggiungendo una procedura guidata di configurazione a un Plugin
    - Devi comprendere setup-entry.ts rispetto a index.ts
    - Stai definendo schemi di configurazione Plugin o metadati openclaw in package.json
sidebarTitle: Setup and config
summary: Procedure guidate di configurazione, setup-entry.ts, schemi di configurazione e metadati package.json
title: Configurazione e impostazioni del Plugin
x-i18n:
    generated_at: "2026-06-27T18:01:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Riferimento per il packaging dei plugin (metadati di `package.json`), i manifest (`openclaw.plugin.json`), le voci di configurazione e gli schemi di configurazione.

<Tip>
**Cerchi una guida passo passo?** Le guide pratiche coprono il packaging nel contesto: [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e [Plugin provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del pacchetto

Il tuo `package.json` deve avere un campo `openclaw` che indica al sistema dei plugin cosa fornisce il tuo plugin:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
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
Se pubblichi il plugin esternamente su ClawHub, quei campi `compat` e `build` sono obbligatori. Gli snippet di pubblicazione canonici si trovano in `docs/snippets/plugin-publish/`.
</Note>

### Campi di `openclaw`

<ParamField path="extensions" type="string[]">
  File dei punti di ingresso (relativi alla radice del pacchetto).
</ParamField>
<ParamField path="setupEntry" type="string">
  Voce leggera dedicata solo alla configurazione (facoltativa).
</ParamField>
<ParamField path="channel" type="object">
  Metadati del catalogo dei canali per configurazione, selettore, avvio rapido e superfici di stato.
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

`openclaw.channel` è metadato di pacchetto leggero per il rilevamento dei canali e le superfici di configurazione prima del caricamento del runtime.

| Campo                                  | Tipo       | Significato                                                                    |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canonico del canale.                                                        |
| `label`                                | `string`   | Etichetta principale del canale.                                               |
| `selectionLabel`                       | `string`   | Etichetta del selettore/configurazione quando deve differire da `label`.       |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per cataloghi di canali e superfici di stato più ricchi. |
| `docsPath`                             | `string`   | Percorso della documentazione per link di configurazione e selezione.          |
| `docsLabel`                            | `string`   | Etichetta alternativa usata per i link alla documentazione quando deve differire dall'ID del canale. |
| `blurb`                                | `string`   | Breve descrizione di onboarding/catalogo.                                      |
| `order`                                | `number`   | Ordine di ordinamento nei cataloghi dei canali.                                |
| `aliases`                              | `string[]` | Alias di ricerca aggiuntivi per la selezione del canale.                       |
| `preferOver`                           | `string[]` | ID di plugin/canali con priorità inferiore che questo canale deve precedere.   |
| `systemImage`                          | `string`   | Nome facoltativo di icona/immagine di sistema per i cataloghi UI dei canali.   |
| `selectionDocsPrefix`                  | `string`   | Testo di prefisso prima dei link alla documentazione nelle superfici di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso della documentazione invece di un link etichettato nella copia di selezione. |
| `selectionExtras`                      | `string[]` | Brevi stringhe aggiuntive accodate nella copia di selezione.                   |
| `markdownCapable`                      | `boolean`  | Contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per configurazione, elenchi configurati e superfici della documentazione. |
| `quickstartAllowFrom`                  | `boolean`  | Abilita questo canale al flusso standard di configurazione rapida `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Richiede l'associazione esplicita dell'account anche quando esiste un solo account. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce la ricerca della sessione quando risolve i destinatari degli annunci per questo canale. |

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
- `setup`: include il canale nei selettori interattivi di configurazione
- `docs`: contrassegna il canale come pubblico nelle superfici di documentazione/navigazione

<Note>
`showConfigured` e `showInSetup` restano supportati come alias legacy. Preferisci `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` è metadato di pacchetto, non metadato di manifest.

| Campo                        | Tipo                                | Significato                                                                      |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Specifica ClawHub canonica per installazione/aggiornamento e flussi di onboarding con installazione su richiesta. |
| `npmSpec`                    | `string`                            | Specifica npm canonica per flussi di fallback di installazione/aggiornamento.    |
| `localPath`                  | `string`                            | Percorso di sviluppo locale o di installazione in bundle.                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Origine di installazione preferita quando sono disponibili più origini.          |
| `minHostVersion`             | `string`                            | Versione minima supportata di OpenClaw nel formato `>=x.y.z` o `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Stringa di integrità npm dist prevista, di solito `sha512-...`, per installazioni bloccate. |
| `allowInvalidConfigRecovery` | `boolean`                           | Consente ai flussi di reinstallazione dei plugin in bundle di recuperare da specifici errori di configurazione obsoleta. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm specifici della piattaforma richiesti e verificati durante l'installazione npm. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    L'onboarding interattivo usa anche `openclaw.install` per le superfici di installazione su richiesta. Se il tuo plugin espone scelte di autenticazione provider o metadati di configurazione/catalogo canali prima del caricamento del runtime, l'onboarding può mostrare quella scelta, chiedere l'installazione tramite ClawHub, npm o locale, installare o abilitare il plugin, quindi continuare il flusso selezionato. Le scelte di onboarding ClawHub usano `clawhubSpec` e sono preferite quando presenti; le scelte npm richiedono metadati di catalogo attendibili con un `npmSpec` di registro; versioni esatte ed `expectedIntegrity` sono pin npm facoltativi. Se `expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo applicano per npm. Mantieni i metadati su "cosa mostrare" in `openclaw.plugin.json` e i metadati su "come installarlo" in `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Se `minHostVersion` è impostato, viene applicato sia dall'installazione sia dal caricamento del registro manifest non in bundle. Gli host meno recenti saltano i plugin esterni; le stringhe di versione non valide vengono rifiutate. Si presume che i plugin sorgente in bundle abbiano la stessa versione del checkout host.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` non è un bypass generale per configurazioni danneggiate. È riservato solo al recupero ristretto dei plugin in bundle, in modo che reinstallazione/configurazione possano riparare residui di aggiornamento noti, come un percorso mancante di un plugin in bundle o una voce `channels.<id>` obsoleta per quello stesso plugin. Se la configurazione è danneggiata per motivi non correlati, l'installazione continua a fallire in modo chiuso e indica all'operatore di eseguire `openclaw doctor --fix`.
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

Quando è abilitato, OpenClaw carica solo `setupEntry` durante la fase di avvio precedente all'ascolto, anche per i canali già configurati. La voce completa viene caricata dopo che il gateway inizia ad ascoltare.

<Warning>
Abilita il caricamento differito solo quando il tuo `setupEntry` registra tutto ciò di cui il gateway ha bisogno prima di iniziare ad ascoltare (registrazione del canale, route HTTP, metodi gateway). Se la voce completa possiede capacità di avvio richieste, mantieni il comportamento predefinito.
</Warning>

Se la tua voce di configurazione/completa registra metodi RPC del gateway, mantienili su un prefisso specifico del plugin. Gli spazi dei nomi amministrativi core riservati (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e vengono sempre risolti in `operator.admin`.

## Manifest del Plugin

Ogni plugin nativo deve includere un `openclaw.plugin.json` nella radice del pacchetto. OpenClaw lo usa per convalidare la configurazione senza eseguire codice del plugin.

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

Vedi [manifest del Plugin](/it/plugins/manifest) per il riferimento completo dello schema.

## Pubblicazione su ClawHub

Per i pacchetti Plugin, usa il comando ClawHub specifico per pacchetto:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L’alias di pubblicazione legacy solo per skill è per le skill. I pacchetti Plugin devono sempre usare `clawhub package publish`.
</Note>

## Voce di setup

Il file `setup-entry.ts` è un’alternativa leggera a `index.ts` che OpenClaw carica quando gli servono solo le superfici di setup (onboarding, riparazione della config, ispezione dei canali disabilitati).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice runtime pesante (librerie crittografiche, registrazioni CLI, servizi in background) durante i flussi di setup.

I canali bundled del workspace che mantengono esportazioni sicure per il setup in moduli sidecar possono usare `defineBundledChannelSetupEntry(...)` da `openclaw/plugin-sdk/channel-entry-contract` invece di `defineSetupPluginEntry(...)`. Quel contratto bundled supporta anche un’esportazione opzionale `runtime`, così il cablaggio runtime in fase di setup può restare leggero ed esplicito.

<AccordionGroup>
  <Accordion title="Quando OpenClaw usa setupEntry invece della voce completa">
    - Il canale è disabilitato ma ha bisogno di superfici di setup/onboarding.
    - Il canale è abilitato ma non configurato.
    - Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Cosa deve registrare setupEntry">
    - L’oggetto Plugin del canale (tramite `defineSetupPluginEntry`).
    - Qualsiasi route HTTP richiesta prima dell’ascolto del gateway.
    - Qualsiasi metodo Gateway necessario durante l’avvio.

    Quei metodi Gateway di avvio devono comunque evitare namespace di amministrazione core riservati come `config.*` o `update.*`.

  </Accordion>
  <Accordion title="Cosa setupEntry NON deve includere">
    - Registrazioni CLI.
    - Servizi in background.
    - Import runtime pesanti (crittografia, SDK).
    - Metodi Gateway necessari solo dopo l’avvio.

  </Accordion>
</AccordionGroup>

### Import stretti degli helper di setup

Per percorsi caldi solo di setup, preferisci le seam strette degli helper di setup rispetto all’umbrella più ampio `plugin-sdk/setup` quando ti serve solo una parte della superficie di setup:

| Percorso di import                  | Usalo per                                                                                | Esportazioni principali                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime in fase di setup che restano disponibili in `setupEntry` / avvio differito del canale | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias di compatibilità deprecato; usa `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helper CLI/installazione/archivio/docs di setup                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Usa la seam più ampia `plugin-sdk/setup` quando vuoi l’intero toolkit di setup condiviso, inclusi helper di patch della config come `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Usa `createSetupTranslator(...)` per testi fissi della procedura guidata di setup. Segue la locale
della procedura guidata CLI (`OPENCLAW_LOCALE`, poi le variabili di locale di sistema) e ripiega
sull’inglese. Mantieni il testo di setup specifico del Plugin nel codice di proprietà del Plugin e usa
chiavi di catalogo condivise solo per etichette di setup comuni, testo di stato e testo di setup ufficiale
dei Plugin bundled.

Gli adapter di patch del setup restano sicuri da importare nei percorsi caldi. La loro ricerca della superficie di contratto per la promozione single-account bundled è lazy, quindi importare `plugin-sdk/setup-runtime` non carica in modo eager la discovery della superficie di contratto bundled prima che l’adapter venga effettivamente usato.

### Promozione single-account di proprietà del canale

Quando un canale passa da una config top-level single-account a `channels.<id>.accounts.*`, il comportamento condiviso predefinito è spostare i valori promossi con ambito account in `accounts.default`.

I canali bundled possono restringere o sovrascrivere quella promozione tramite la loro superficie di contratto di setup:

- `singleAccountKeysToMove`: chiavi top-level extra che devono essere spostate nell’account promosso
- `namedAccountPromotionKeys`: quando esistono già account nominati, solo queste chiavi vengono spostate nell’account promosso; le chiavi condivise di policy/delivery restano alla root del canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente riceve i valori promossi

<Note>
Matrix è l’esempio bundled attuale. Se esiste già esattamente un account Matrix nominato, o se `defaultAccount` punta a una chiave non canonica esistente come `Ops`, la promozione preserva quell’account invece di creare una nuova voce `accounts.default`.
</Note>

## Schema di config

La config del Plugin viene validata rispetto al JSON Schema nel tuo manifest. Gli utenti configurano i Plugin tramite:

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

Per la config specifica del canale, usa invece la sezione di config del canale:

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

### Costruzione degli schemi di config dei canali

Usa `buildChannelConfigSchema` per convertire uno schema Zod nel wrapper `ChannelConfigSchema` usato dagli artefatti di config di proprietà del Plugin:

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

Se scrivi già il contratto come JSON Schema o TypeBox, usa l’helper diretto così OpenClaw può saltare la conversione da Zod a JSON Schema nei percorsi di metadata:

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

Per i Plugin di terze parti, il contratto cold-path resta il manifest del Plugin: rispecchia il JSON Schema generato in `openclaw.plugin.json#channelConfigs` così schema di config, setup e superfici UI possono ispezionare `channels.<id>` senza caricare codice runtime.

## Procedure guidate di setup

I Plugin di canale possono fornire procedure guidate di setup interattive per `openclaw onboard`. La procedura guidata è un oggetto `ChannelSetupWizard` su `ChannelPlugin`:

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

Il tipo `ChannelSetupWizard` supporta `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e altro. Vedi i pacchetti Plugin bundled (per esempio il Plugin Discord `src/channel.setup.ts`) per esempi completi.

<AccordionGroup>
  <Accordion title="Prompt allowFrom condivisi">
    Per i prompt di allowlist DM che richiedono solo il flusso standard `note -> prompt -> parse -> merge -> patch`, preferisci gli helper di setup condivisi da `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` e `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Stato di setup standard del canale">
    Per blocchi di stato di setup del canale che variano solo per etichette, punteggi e righe extra opzionali, preferisci `createStandardChannelSetupStatus(...)` da `openclaw/plugin-sdk/setup` invece di ricreare manualmente lo stesso oggetto `status` in ogni Plugin.
  </Accordion>
  <Accordion title="Superficie di setup opzionale del canale">
    Per superfici di setup opzionali che devono apparire solo in certi contesti, usa `createOptionalChannelSetupSurface` da `openclaw/plugin-sdk/channel-setup`:

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

    L’adapter/procedura guidata opzionale generato fallisce in modo chiuso sulle scritture di config reali. Riutilizza un unico messaggio di installazione richiesta in `validateInput`, `applyAccountConfig` e `finalize`, e aggiunge un link alla documentazione quando `docsPath` è impostato.

  </Accordion>
  <Accordion title="Helper di setup basati su binari">
    Per UI di setup basate su binari, preferisci gli helper delegati condivisi invece di copiare lo stesso collante binario/stato in ogni canale:

    - `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette, suggerimenti, punteggi e rilevamento del binario
    - `createCliPathTextInput(...)` per input di testo basati su percorso
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare in modo lazy a una procedura guidata completa più pesante
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

    Le specifiche di pacchetto semplici vengono installate da npm durante il passaggio al lancio.

  </Tab>
  <Tab title="Solo ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Specifica del pacchetto npm">
    Usa npm quando un pacchetto non è ancora stato spostato su ClawHub, oppure quando hai bisogno di un
    percorso di installazione npm diretto durante la migrazione:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin nel repository:** posizionali sotto l'albero dell'area di lavoro dei Plugin inclusi e verranno rilevati automaticamente durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
Per le installazioni provenienti da npm, `openclaw plugins install` installa il pacchetto in un progetto per Plugin sotto `~/.openclaw/npm/projects` con gli script del ciclo di vita disabilitati. Mantieni gli alberi delle dipendenze dei Plugin in JS/TS puro ed evita pacchetti che richiedono build `postinstall`.
</Info>

<Note>
L'avvio del Gateway non installa le dipendenze dei Plugin. I flussi di installazione npm/git/ClawHub sono responsabili della convergenza delle dipendenze; i Plugin locali devono avere già le dipendenze installate.
</Note>

I metadati dei pacchetti inclusi sono espliciti, non dedotti dal JavaScript compilato all'avvio del gateway. Le dipendenze di runtime appartengono al pacchetto Plugin che le possiede; l'avvio di OpenClaw pacchettizzato non ripara né replica mai le dipendenze dei Plugin.

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) — guida introduttiva dettagliata
- [Manifest del Plugin](/it/plugins/manifest) — riferimento completo dello schema del manifest
- [Punti di ingresso SDK](/it/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
