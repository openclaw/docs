---
read_when:
    - Je voegt een configuratiewizard toe aan een Plugin
    - Je moet setup-entry.ts versus index.ts begrijpen
    - Je definieert Plugin-configuratieschema's of openclaw-metadata in package.json
sidebarTitle: Setup and config
summary: Installatiewizards, setup-entry.ts, configuratieschema's en package.json-metadata
title: Plugin-installatie en configuratie
x-i18n:
    generated_at: "2026-05-02T11:24:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referentie voor Plugin-verpakking (`package.json`-metadata), manifesten (`openclaw.plugin.json`), setup-items en configuratieschema's.

<Tip>
**Op zoek naar een walkthrough?** De how-to-gidsen behandelen verpakking in context: [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins#step-1-package-and-manifest) en [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Pakketmetadata

Je `package.json` heeft een `openclaw`-veld nodig dat het Pluginsysteem vertelt wat je Plugin levert:

<Tabs>
  <Tab title="Kanaal-Plugin">
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
  <Tab title="Provider-Plugin / ClawHub-basislijn">
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
Als je de Plugin extern publiceert op ClawHub, zijn die `compat`- en `build`-velden vereist. De canonieke publicatiesnippets staan in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-velden

<ParamField path="extensions" type="string[]">
  Entry-pointbestanden (relatief ten opzichte van de pakketroot).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lichtgewicht entry alleen voor setup (optioneel).
</ParamField>
<ParamField path="channel" type="object">
  Kanaalcatalogusmetadata voor setup-, kiezer-, quickstart- en statusoppervlakken.
</ParamField>
<ParamField path="providers" type="string[]">
  Provider-id's die door deze Plugin worden geregistreerd.
</ParamField>
<ParamField path="install" type="object">
  Installatiehints: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Vlaggen voor opstartgedrag.
</ParamField>

### `openclaw.channel`

`openclaw.channel` is goedkope pakketmetadata voor kanaalontdekking en setupoppervlakken voordat de runtime laadt.

| Veld                                   | Type       | Betekenis                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Canonieke kanaal-id.                                                           |
| `label`                                | `string`   | Primair kanaallabel.                                                           |
| `selectionLabel`                       | `string`   | Kiezer-/setuplabel wanneer dit moet afwijken van `label`.                      |
| `detailLabel`                          | `string`   | Secundair detaillabel voor rijkere kanaalcatalogi en statusoppervlakken.       |
| `docsPath`                             | `string`   | Documentatiepad voor setup- en selectielinks.                                  |
| `docsLabel`                            | `string`   | Overschrijvend label voor documentatielinks wanneer dit moet afwijken van de kanaal-id. |
| `blurb`                                | `string`   | Korte onboarding-/catalogusbeschrijving.                                       |
| `order`                                | `number`   | Sorteervolgorde in kanaalcatalogi.                                             |
| `aliases`                              | `string[]` | Extra opzoekaliassen voor kanaalselectie.                                      |
| `preferOver`                           | `string[]` | Plugin-/kanaal-id's met lagere prioriteit die dit kanaal moet overtreffen.     |
| `systemImage`                          | `string`   | Optionele pictogram-/systeemafbeeldingsnaam voor kanaal-UI-catalogi.           |
| `selectionDocsPrefix`                  | `string`   | Prefixtekst vóór documentatielinks in selectieoppervlakken.                    |
| `selectionDocsOmitLabel`               | `boolean`  | Toon het documentatiepad direct in plaats van een gelabelde documentatielink in selectietekst. |
| `selectionExtras`                      | `string[]` | Extra korte strings die worden toegevoegd aan selectietekst.                   |
| `markdownCapable`                      | `boolean`  | Markeert het kanaal als markdown-geschikt voor beslissingen over uitgaande opmaak. |
| `exposure`                             | `object`   | Zichtbaarheidsinstellingen voor kanalen in setup-, geconfigureerde lijst- en documentatieoppervlakken. |
| `quickstartAllowFrom`                  | `boolean`  | Laat dit kanaal meedoen aan de standaard quickstart-setupflow `allowFrom`.     |
| `forceAccountBinding`                  | `boolean`  | Vereis expliciete accountkoppeling, zelfs wanneer er maar één account bestaat. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Geef de voorkeur aan sessieopzoeking bij het oplossen van aankondigingsdoelen voor dit kanaal. |

Voorbeeld:

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

`exposure` ondersteunt:

- `configured`: neem het kanaal op in geconfigureerde/statusachtige lijstoppervlakken
- `setup`: neem het kanaal op in interactieve setup-/configuratiekiezers
- `docs`: markeer het kanaal als publiek zichtbaar in documentatie-/navigatieoppervlakken

<Note>
`showConfigured` en `showInSetup` blijven ondersteund als verouderde aliassen. Geef de voorkeur aan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` is pakketmetadata, geen manifestmetadata.

| Veld                         | Type                 | Betekenis                                                                         |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Canonieke npm-specificatie voor installatie-/updateflows.                         |
| `localPath`                  | `string`             | Lokaal ontwikkelpad of gebundeld installatiepad.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Voorkeursinstallatiebron wanneer beide beschikbaar zijn.                          |
| `minHostVersion`             | `string`             | Minimaal ondersteunde OpenClaw-versie in de vorm `>=x.y.z` of `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | Verwachte npm-dist-integriteitsstring, meestal `sha512-...`, voor vastgepinde installaties. |
| `allowInvalidConfigRecovery` | `boolean`            | Laat herinstallatieflows voor gebundelde Plugins herstellen van specifieke verouderde-configuratiefouten. |

<AccordionGroup>
  <Accordion title="Onboardinggedrag">
    Interactieve onboarding gebruikt ook `openclaw.install` voor install-on-demand-oppervlakken. Als je Plugin provider-authkeuzes of kanaalsetup-/catalogusmetadata blootstelt voordat de runtime laadt, kan onboarding die keuze tonen, vragen om npm- versus lokale installatie, de Plugin installeren of inschakelen en daarna doorgaan met de geselecteerde flow. Npm-onboardingkeuzes vereisen vertrouwde catalogusmetadata met een registry-`npmSpec`; exacte versies en `expectedIntegrity` zijn optionele pins. Als `expectedIntegrity` aanwezig is, dwingen installatie-/updateflows dit af. Bewaar de metadata over "wat te tonen" in `openclaw.plugin.json` en de metadata over "hoe dit te installeren" in `package.json`.
  </Accordion>
  <Accordion title="minHostVersion-afdwinging">
    Als `minHostVersion` is ingesteld, dwingen zowel installatie als niet-gebundeld laden van de manifestregistry dit af. Oudere hosts slaan externe Plugins over; ongeldige versiestrings worden geweigerd. Gebundelde bron-Plugins worden verondersteld dezelfde versie te hebben als de host-checkout.
  </Accordion>
  <Accordion title="Vastgepinde npm-installaties">
    Houd voor vastgepinde npm-installaties de exacte versie in `npmSpec` en voeg de verwachte artifactintegriteit toe:

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
  <Accordion title="allowInvalidConfigRecovery-bereik">
    `allowInvalidConfigRecovery` is geen algemene omzeiling voor kapotte configuraties. Het is alleen bedoeld voor nauw herstel van gebundelde Plugins, zodat herinstallatie/setup bekende upgraderesten kan repareren, zoals een ontbrekend pad naar een gebundelde Plugin of een verouderde `channels.<id>`-vermelding voor diezelfde Plugin. Als de configuratie om niet-gerelateerde redenen kapot is, faalt installatie nog steeds gesloten en wordt de operator gevraagd `openclaw doctor --fix` uit te voeren.
  </Accordion>
</AccordionGroup>

### Uitgesteld volledig laden

Kanaal-Plugins kunnen kiezen voor uitgesteld laden met:

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

Wanneer dit is ingeschakeld, laadt OpenClaw alleen `setupEntry` tijdens de opstartfase vóór luisteren, zelfs voor al geconfigureerde kanalen. De volledige entry wordt geladen nadat de Gateway begint te luisteren.

<Warning>
Schakel uitgesteld laden alleen in wanneer je `setupEntry` alles registreert wat de Gateway nodig heeft voordat deze begint te luisteren (kanaalregistratie, HTTP-routes, Gateway-methoden). Als de volledige entry vereiste opstartmogelijkheden bezit, behoud dan het standaardgedrag.
</Warning>

Als je setup-/volledige entry Gateway-RPC-methoden registreert, houd ze dan op een Plugin-specifieke prefix. Gereserveerde corebeheernamespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven eigendom van core en lossen altijd op naar `operator.admin`.

## Plugin-manifest

Elke native Plugin moet een `openclaw.plugin.json` in de pakketroot meeleveren. OpenClaw gebruikt dit om configuratie te valideren zonder Plugincode uit te voeren.

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

Voeg voor kanaal-Plugins `kind` en `channels` toe:

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

Zelfs Plugins zonder configuratie moeten een schema meeleveren. Een leeg schema is geldig:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Zie [Plugin-manifest](/nl/plugins/manifest) voor de volledige schemareferentie.

## Publiceren op ClawHub

Gebruik voor Plugin-pakketten de pakketspecifieke ClawHub-opdracht:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
De verouderde publicatiealias alleen voor Skills is voor Skills. Plugin-pakketten moeten altijd `clawhub package publish` gebruiken.
</Note>

## Setup-entry

Het bestand `setup-entry.ts` is een lichtgewicht alternatief voor `index.ts` dat OpenClaw laadt wanneer het alleen setup-oppervlakken nodig heeft (onboarding, config-reparatie, inspectie van uitgeschakelde kanalen).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dit voorkomt dat zware runtime-code (cryptobibliotheken, CLI-registraties, achtergrondservices) tijdens setup-flows wordt geladen.

Gebundelde workspace-kanalen die setup-veilige exports in sidecar-modules bewaren, kunnen `defineBundledChannelSetupEntry(...)` uit `openclaw/plugin-sdk/channel-entry-contract` gebruiken in plaats van `defineSetupPluginEntry(...)`. Dat gebundelde contract ondersteunt ook een optionele `runtime`-export, zodat runtime-bedrading tijdens setup lichtgewicht en expliciet kan blijven.

<AccordionGroup>
  <Accordion title="Wanneer OpenClaw setupEntry gebruikt in plaats van de volledige entry">
    - Het kanaal is uitgeschakeld maar heeft setup-/onboarding-oppervlakken nodig.
    - Het kanaal is ingeschakeld maar niet geconfigureerd.
    - Uitgesteld laden is ingeschakeld (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Wat setupEntry moet registreren">
    - Het channel Plugin-object (via `defineSetupPluginEntry`).
    - Alle HTTP-routes die vóór gateway listen vereist zijn.
    - Alle Gateway-methoden die tijdens het opstarten nodig zijn.

    Die opstart-Gateway-methoden moeten nog steeds gereserveerde core-admin-naamruimten zoals `config.*` of `update.*` vermijden.

  </Accordion>
  <Accordion title="Wat setupEntry NIET moet bevatten">
    - CLI-registraties.
    - Achtergrondservices.
    - Zware runtime-imports (crypto, SDK's).
    - Gateway-methoden die pas na het opstarten nodig zijn.

  </Accordion>
</AccordionGroup>

### Smalle setup-helperimports

Voor hete paden die alleen setup gebruiken, geef je de voorkeur aan de smalle setup-helperseams boven de bredere `plugin-sdk/setup`-paraplu wanneer je slechts een deel van het setup-oppervlak nodig hebt:

| Importpad                          | Gebruik dit voor                                                                                 | Belangrijkste exports                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/setup-runtime`         | runtime-helpers tijdens setup die beschikbaar blijven in `setupEntry` / uitgestelde kanaalstart  | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | omgevingsbewuste account-setupadapters                                                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | setup-/installatie-CLI-/archief-/docs-helpers                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Gebruik de bredere `plugin-sdk/setup`-seam wanneer je de volledige gedeelde setup-toolbox wilt, inclusief config-patchhelpers zoals `moveSingleAccountChannelSectionToDefaultAccount(...)`.

De setup-patchadapters blijven importveilig voor hete paden. Hun gebundelde lookup voor het contractoppervlak voor single-account promotion is lazy, dus het importeren van `plugin-sdk/setup-runtime` laadt gebundelde contractoppervlakdetectie niet gretig voordat de adapter daadwerkelijk wordt gebruikt.

### Kanaaleigen single-account promotion

Wanneer een kanaal opwaardeert van een single-account config op topniveau naar `channels.<id>.accounts.*`, is het standaard gedeelde gedrag om gepromoveerde account-scoped waarden naar `accounts.default` te verplaatsen.

Gebundelde kanalen kunnen die promotie verfijnen of overschrijven via hun setup-contractoppervlak:

- `singleAccountKeysToMove`: extra sleutels op topniveau die naar het gepromoveerde account moeten worden verplaatst
- `namedAccountPromotionKeys`: wanneer benoemde accounts al bestaan, worden alleen deze sleutels naar het gepromoveerde account verplaatst; gedeelde policy-/delivery-sleutels blijven in de kanaalroot
- `resolveSingleAccountPromotionTarget(...)`: kies welk bestaand account gepromoveerde waarden ontvangt

<Note>
Matrix is het huidige gebundelde voorbeeld. Als er precies één benoemd Matrix-account al bestaat, of als `defaultAccount` naar een bestaande niet-canonieke sleutel zoals `Ops` wijst, behoudt promotion dat account in plaats van een nieuwe `accounts.default`-entry te maken.
</Note>

## Config-schema

Plugin-config wordt gevalideerd tegen het JSON Schema in je manifest. Gebruikers configureren plugins via:

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

Je Plugin ontvangt deze config als `api.pluginConfig` tijdens registratie.

Gebruik voor kanaalspecifieke config in plaats daarvan de kanaalconfig-sectie:

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

### Kanaalconfig-schema's bouwen

Gebruik `buildChannelConfigSchema` om een Zod-schema om te zetten naar de `ChannelConfigSchema`-wrapper die door Plugineigen config-artefacten wordt gebruikt:

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

Voor externe plugins blijft het cold-path contract het Plugin-manifest: spiegel het gegenereerde JSON Schema naar `openclaw.plugin.json#channelConfigs`, zodat config-schema, setup en UI-oppervlakken `channels.<id>` kunnen inspecteren zonder runtime-code te laden.

## Setup-wizards

Kanaalplugins kunnen interactieve setup-wizards leveren voor `openclaw onboard`. De wizard is een `ChannelSetupWizard`-object op de `ChannelPlugin`:

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

Het type `ChannelSetupWizard` ondersteunt `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` en meer. Zie gebundelde Plugin-pakketten (bijvoorbeeld de Discord Plugin `src/channel.setup.ts`) voor volledige voorbeelden.

<AccordionGroup>
  <Accordion title="Gedeelde allowFrom-prompts">
    Voor DM-allowlist-prompts die alleen de standaard `note -> prompt -> parse -> merge -> patch`-flow nodig hebben, geef je de voorkeur aan de gedeelde setup-helpers uit `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` en `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standaard kanaalsetupstatus">
    Voor kanaalsetupstatusblokken die alleen verschillen in labels, scores en optionele extra regels, geef je de voorkeur aan `createStandardChannelSetupStatus(...)` uit `openclaw/plugin-sdk/setup` in plaats van in elke Plugin hetzelfde `status`-object handmatig te bouwen.
  </Accordion>
  <Accordion title="Optioneel kanaalsetup-oppervlak">
    Voor optionele setup-oppervlakken die alleen in bepaalde contexten moeten verschijnen, gebruik je `createOptionalChannelSetupSurface` uit `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` stelt ook de lagere-niveau builders `createOptionalChannelSetupAdapter(...)` en `createOptionalChannelSetupWizard(...)` beschikbaar wanneer je slechts één helft van dat optionele installatie-oppervlak nodig hebt.

    De gegenereerde optionele adapter/wizard faalt gesloten bij echte config-writes. Ze hergebruiken één installatie-verplicht-bericht in `validateInput`, `applyAccountConfig` en `finalize`, en voegen een docs-link toe wanneer `docsPath` is ingesteld.

  </Accordion>
  <Accordion title="Binary-backed setup-helpers">
    Voor binary-backed setup-UI's geef je de voorkeur aan de gedeelde gedelegeerde helpers in plaats van dezelfde binary-/statuslijm naar elk kanaal te kopiëren:

    - `createDetectedBinaryStatus(...)` voor statusblokken die alleen verschillen in labels, hints, scores en binary-detectie
    - `createCliPathTextInput(...)` voor tekstinputs die door een pad worden ondersteund
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` en `createDelegatedResolveConfigured(...)` wanneer `setupEntry` lazy naar een zwaardere volledige wizard moet doorsturen
    - `createDelegatedTextInputShouldPrompt(...)` wanneer `setupEntry` alleen een `textInputs[*].shouldPrompt`-beslissing hoeft te delegeren

  </Accordion>
</AccordionGroup>

## Publiceren en installeren

**Externe plugins:** publiceer naar [ClawHub](/nl/tools/clawhub) en installeer daarna:

<Tabs>
  <Tab title="Automatisch (ClawHub en daarna npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw probeert eerst ClawHub en valt automatisch terug op npm.

  </Tab>
  <Tab title="Alleen ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm-pakketspecificatie">
    Gebruik npm wanneer een pakket nog niet naar ClawHub is verplaatst, of wanneer je tijdens migratie een direct npm-installatiepad nodig hebt:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins in de repo:** plaats ze onder de gebundelde Plugin-workspaceboom en ze worden automatisch tijdens de build ontdekt.

**Gebruikers kunnen installeren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Voor installs vanuit npm installeert `openclaw plugins install` het pakket onder `~/.openclaw/npm` met lifecycle-scripts uitgeschakeld. Houd Plugin-dependencybomen zuiver JS/TS en vermijd pakketten die `postinstall`-builds vereisen.
</Info>

<Note>
Het opstarten van de Gateway installeert geen Plugin-dependencies. npm-/git-/ClawHub-installatieflows zijn eigenaar van dependency-convergentie; lokale plugins moeten hun dependencies al geïnstalleerd hebben.
</Note>

Gebundelde pakketmetadata is expliciet en wordt niet afgeleid uit gebouwde JavaScript bij het opstarten van de Gateway. Runtime-afhankelijkheden horen thuis in het pluginpakket dat ze beheert; het opstarten van verpakte OpenClaw repareert of spiegelt pluginafhankelijkheden nooit.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — stapsgewijze gids om aan de slag te gaan
- [Pluginmanifest](/nl/plugins/manifest) — volledige referentie voor het manifestschema
- [SDK-entrypoints](/nl/plugins/sdk-entrypoints) — `definePluginEntry` en `defineChannelPluginEntry`
