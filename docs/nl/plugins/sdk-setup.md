---
read_when:
    - Je voegt een installatiewizard toe aan een Plugin
    - Je moet setup-entry.ts versus index.ts begrijpen
    - Je definieert Plugin-configuratieschema's of openclaw-metadata in package.json
sidebarTitle: Setup and config
summary: Installatiewizards, setup-entry.ts, configuratieschema's en package.json-metadata
title: Plugin-installatie en configuratie
x-i18n:
    generated_at: "2026-04-30T00:06:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referentie voor Plugin-verpakking (`package.json`-metadata), manifests (`openclaw.plugin.json`), setupvermeldingen en configuratieschema's.

<Tip>
**Op zoek naar een stapsgewijze uitleg?** De handleidingen behandelen verpakking in context: [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins#step-1-package-and-manifest) en [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Pakketmetadata

Je `package.json` heeft een `openclaw`-veld nodig dat het Plugin-systeem vertelt wat je Plugin biedt:

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
Als je de Plugin extern op ClawHub publiceert, zijn die `compat`- en `build`-velden vereist. De canonieke publicatiesnippets staan in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-velden

<ParamField path="extensions" type="string[]">
  Entry point-bestanden (relatief ten opzichte van de pakketroot).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lichtgewicht vermelding alleen voor setup (optioneel).
</ParamField>
<ParamField path="channel" type="object">
  Metadata voor de kanaalcatalogus voor setup, kiezer, quickstart en statusoppervlakken.
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

| Veld                                   | Type       | Wat het betekent                                                              |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Canonieke kanaal-id.                                                          |
| `label`                                | `string`   | Primair kanaallabel.                                                          |
| `selectionLabel`                       | `string`   | Kiezer-/setuplabel wanneer dit moet verschillen van `label`.                  |
| `detailLabel`                          | `string`   | Secundair detaillabel voor rijkere kanaalcatalogi en statusoppervlakken.      |
| `docsPath`                             | `string`   | Documentatiepad voor setup- en selectielinks.                                 |
| `docsLabel`                            | `string`   | Overschrijft het label dat voor documentatielinks wordt gebruikt wanneer dit moet verschillen van de kanaal-id. |
| `blurb`                                | `string`   | Korte onboarding-/catalogusbeschrijving.                                      |
| `order`                                | `number`   | Sorteervolgorde in kanaalcatalogi.                                            |
| `aliases`                              | `string[]` | Extra opzoekaliassen voor kanaalselectie.                                     |
| `preferOver`                           | `string[]` | Plugin-/kanaal-id's met lagere prioriteit waar dit kanaal boven moet staan.   |
| `systemImage`                          | `string`   | Optionele pictogram-/systeemafbeeldingsnaam voor kanaal-UI-catalogi.          |
| `selectionDocsPrefix`                  | `string`   | Voorvoegseltekst vóór documentatielinks in selectieoppervlakken.              |
| `selectionDocsOmitLabel`               | `boolean`  | Toon het documentatiepad direct in plaats van een gelabelde documentatielink in selectietekst. |
| `selectionExtras`                      | `string[]` | Extra korte strings die aan selectietekst worden toegevoegd.                  |
| `markdownCapable`                      | `boolean`  | Markeert het kanaal als markdown-geschikt voor beslissingen over uitgaande opmaak. |
| `exposure`                             | `object`   | Zichtbaarheidsinstellingen voor kanalen voor setup, geconfigureerde lijsten en documentatieoppervlakken. |
| `quickstartAllowFrom`                  | `boolean`  | Laat dit kanaal deelnemen aan de standaard quickstart-setupflow `allowFrom`.  |
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
- `setup`: neem het kanaal op in interactieve setup-/configureerkiezers
- `docs`: markeer het kanaal als publiek zichtbaar in documentatie-/navigatieoppervlakken

<Note>
`showConfigured` en `showInSetup` blijven ondersteund als legacy-aliassen. Geef de voorkeur aan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` is pakketmetadata, geen manifestmetadata.

| Veld                         | Type                 | Wat het betekent                                                               |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Canonieke npm-specificatie voor installatie-/updateflows.                      |
| `localPath`                  | `string`             | Lokaal ontwikkelpad of gebundeld installatiepad.                               |
| `defaultChoice`              | `"npm"` \| `"local"` | Installatiebron met voorkeur wanneer beide beschikbaar zijn.                   |
| `minHostVersion`             | `string`             | Minimaal ondersteunde OpenClaw-versie in de vorm `>=x.y.z`.                    |
| `expectedIntegrity`          | `string`             | Verwachte npm-dist-integriteitstring, meestal `sha512-...`, voor gepinde installaties. |
| `allowInvalidConfigRecovery` | `boolean`            | Laat herinstallatieflows voor gebundelde Plugins herstellen van specifieke oude configuratiefouten. |

<AccordionGroup>
  <Accordion title="Onboardinggedrag">
    Interactieve onboarding gebruikt ook `openclaw.install` voor install-on-demand-oppervlakken. Als je Plugin provider-auth-keuzes of metadata voor kanaalsetup/-catalogus beschikbaar maakt voordat de runtime laadt, kan onboarding die keuze tonen, vragen om npm- of lokale installatie, de Plugin installeren of inschakelen en daarna doorgaan met de geselecteerde flow. Npm-onboardingkeuzes vereisen vertrouwde catalogusmetadata met een register-`npmSpec`; exacte versies en `expectedIntegrity` zijn optionele pins. Als `expectedIntegrity` aanwezig is, dwingen installatie-/updateflows dit af. Bewaar de metadata voor "wat te tonen" in `openclaw.plugin.json` en de metadata voor "hoe het te installeren" in `package.json`.
  </Accordion>
  <Accordion title="Afdwinging van minHostVersion">
    Als `minHostVersion` is ingesteld, dwingen zowel installatie als laden van het manifestregister dit af. Oudere hosts slaan de Plugin over; ongeldige versiestrings worden geweigerd.
  </Accordion>
  <Accordion title="Gepinde npm-installaties">
    Houd voor gepinde npm-installaties de exacte versie in `npmSpec` en voeg de verwachte artefactintegriteit toe:

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
  <Accordion title="Bereik van allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` is geen algemene bypass voor kapotte configuraties. Het is alleen bedoeld voor beperkt herstel van gebundelde Plugins, zodat herinstallatie/setup bekende upgrade-restanten kan repareren, zoals een ontbrekend gebundeld Plugin-pad of een oude `channels.<id>`-vermelding voor diezelfde Plugin. Als de configuratie om niet-gerelateerde redenen kapot is, faalt de installatie nog steeds gesloten en meldt deze de operator dat `openclaw doctor --fix` moet worden uitgevoerd.
  </Accordion>
</AccordionGroup>

### Uitgestelde volledige laadactie

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

Wanneer dit is ingeschakeld, laadt OpenClaw alleen `setupEntry` tijdens de opstartfase vóór luisteren, zelfs voor al geconfigureerde kanalen. De volledige vermelding laadt nadat de Gateway begint te luisteren.

<Warning>
Schakel uitgesteld laden alleen in wanneer je `setupEntry` alles registreert wat de Gateway nodig heeft voordat deze begint te luisteren (kanaalregistratie, HTTP-routes, Gateway-methoden). Als de volledige vermelding vereiste opstartcapaciteiten beheert, behoud dan het standaardgedrag.
</Warning>

Als je setup-/volledige vermelding Gateway-RPC-methoden registreert, houd ze dan op een Plugin-specifiek voorvoegsel. Gereserveerde core-admin-naamruimten (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven eigendom van core en worden altijd opgelost naar `operator.admin`.

## Plugin-manifest

Elke native Plugin moet een `openclaw.plugin.json` in de pakketroot meeleveren. OpenClaw gebruikt dit om configuratie te valideren zonder Plugin-code uit te voeren.

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

## ClawHub-publicatie

Gebruik voor Plugin-pakketten de pakketspecifieke ClawHub-opdracht:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
De legacy publicatiealias alleen voor Skills is bedoeld voor Skills. Plugin-pakketten moeten altijd `clawhub package publish` gebruiken.
</Note>

## Setupvermelding

Het bestand `setup-entry.ts` is een lichtgewicht alternatief voor `index.ts` dat OpenClaw laadt wanneer het alleen setupoppervlakken nodig heeft (onboarding, configuratieherstel, inspectie van uitgeschakelde kanalen).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dit voorkomt dat zware runtimecode (cryptobibliotheken, CLI-registraties, achtergrondservices) tijdens setupflows wordt geladen.

Gebundelde workspace-kanalen die setup-veilige exports in sidecar-modules bewaren, kunnen `defineBundledChannelSetupEntry(...)` uit `openclaw/plugin-sdk/channel-entry-contract` gebruiken in plaats van `defineSetupPluginEntry(...)`. Dat gebundelde contract ondersteunt ook een optionele `runtime`-export, zodat runtimebedrading tijdens setup lichtgewicht en expliciet kan blijven.

<AccordionGroup>
  <Accordion title="Wanneer OpenClaw setupEntry gebruikt in plaats van de volledige entry">
    - Het kanaal is uitgeschakeld maar heeft setup-/onboardingoppervlakken nodig.
    - Het kanaal is ingeschakeld maar niet geconfigureerd.
    - Uitgesteld laden is ingeschakeld (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Wat setupEntry moet registreren">
    - Het kanaalpluginobject (via `defineSetupPluginEntry`).
    - Alle HTTP-routes die vereist zijn voordat de gateway luistert.
    - Alle gatewaymethoden die tijdens het opstarten nodig zijn.

    Die gatewaymethoden voor opstarten moeten nog steeds gereserveerde core-beheernaamruimten zoals `config.*` of `update.*` vermijden.

  </Accordion>
  <Accordion title="Wat setupEntry NIET moet bevatten">
    - CLI-registraties.
    - Achtergrondservices.
    - Zware runtime-imports (crypto, SDK's).
    - Gatewaymethoden die pas na het opstarten nodig zijn.

  </Accordion>
</AccordionGroup>

### Smalle setup-helperimports

Voor hete paden die alleen setup gebruiken, geef je de voorkeur aan de smalle setup-helpernaden boven de bredere `plugin-sdk/setup`-paraplu wanneer je slechts een deel van het setupoppervlak nodig hebt:

| Importpad                         | Gebruik dit voor                                                                         | Belangrijkste exports                                                                                                                                                                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | runtimehelpers tijdens setup die beschikbaar blijven in `setupEntry` / uitgestelde kanaalstart | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | omgevingsbewuste adapters voor accountsetup                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`          | helpers voor setup-/installatie-CLI/archief/docs                                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Gebruik de bredere `plugin-sdk/setup`-naad wanneer je de volledige gedeelde setup-toolbox wilt, inclusief config-patchhelpers zoals `moveSingleAccountChannelSectionToDefaultAccount(...)`.

De setup-patchadapters blijven importveilig voor hete paden. Hun gebundelde lookup van het contractoppervlak voor promotie van één account is lui, dus het importeren van `plugin-sdk/setup-runtime` laadt de ontdekking van gebundelde contractoppervlakken niet gretig voordat de adapter daadwerkelijk wordt gebruikt.

### Kanaaleigen promotie van één account

Wanneer een kanaal opwaardeert van een top-level configuratie met één account naar `channels.<id>.accounts.*`, is het standaard gedeelde gedrag om gepromoveerde account-scoped waarden naar `accounts.default` te verplaatsen.

Gebundelde kanalen kunnen die promotie via hun setupcontractoppervlak beperken of overschrijven:

- `singleAccountKeysToMove`: extra top-level sleutels die naar het gepromoveerde account moeten worden verplaatst
- `namedAccountPromotionKeys`: wanneer benoemde accounts al bestaan, worden alleen deze sleutels naar het gepromoveerde account verplaatst; gedeelde beleids-/leveringssleutels blijven op de kanaalroot
- `resolveSingleAccountPromotionTarget(...)`: kies welk bestaand account gepromoveerde waarden ontvangt

<Note>
Matrix is het huidige gebundelde voorbeeld. Als er al precies één benoemd Matrix-account bestaat, of als `defaultAccount` naar een bestaande niet-canonieke sleutel zoals `Ops` verwijst, behoudt promotie dat account in plaats van een nieuwe `accounts.default`-entry te maken.
</Note>

## Config-schema

Plugin-configuratie wordt gevalideerd tegen het JSON Schema in je manifest. Gebruikers configureren plugins via:

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

Je Plugin ontvangt deze configuratie als `api.pluginConfig` tijdens registratie.

Gebruik voor kanaalspecifieke configuratie in plaats daarvan de kanaalconfiguratiesectie:

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

### Kanaalconfiguratieschema's bouwen

Gebruik `buildChannelConfigSchema` om een Zod-schema om te zetten naar de `ChannelConfigSchema`-wrapper die door plugineigen configuratieartefacten wordt gebruikt:

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

Voor plugins van derden blijft het contract voor koude paden het pluginmanifest: spiegel het gegenereerde JSON Schema naar `openclaw.plugin.json#channelConfigs`, zodat configuratieschema-, setup- en UI-oppervlakken `channels.<id>` kunnen inspecteren zonder runtimecode te laden.

## Setupwizards

Kanaalplugins kunnen interactieve setupwizards leveren voor `openclaw onboard`. De wizard is een `ChannelSetupWizard`-object op de `ChannelPlugin`:

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

Het type `ChannelSetupWizard` ondersteunt `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` en meer. Zie gebundelde pluginpakketten (bijvoorbeeld de Discord-plugin `src/channel.setup.ts`) voor volledige voorbeelden.

<AccordionGroup>
  <Accordion title="Gedeelde allowFrom-prompts">
    Voor DM-allowlistprompts die alleen de standaardflow `note -> prompt -> parse -> merge -> patch` nodig hebben, geef je de voorkeur aan de gedeelde setuphelpers uit `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` en `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standaardstatus voor kanaalsetup">
    Voor statusblokken voor kanaalsetup die alleen variëren op labels, scores en optionele extra regels, geef je de voorkeur aan `createStandardChannelSetupStatus(...)` uit `openclaw/plugin-sdk/setup` in plaats van in elke Plugin hetzelfde `status`-object handmatig te maken.
  </Accordion>
  <Accordion title="Optioneel oppervlak voor kanaalsetup">
    Gebruik voor optionele setupoppervlakken die alleen in bepaalde contexten moeten verschijnen `createOptionalChannelSetupSurface` uit `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` biedt ook de lagere `createOptionalChannelSetupAdapter(...)`- en `createOptionalChannelSetupWizard(...)`-builders wanneer je slechts één helft van dat optionele installatieoppervlak nodig hebt.

    De gegenereerde optionele adapter/wizard faalt gesloten bij echte configuratieschrijfacties. Ze hergebruiken één installatie-verplichtbericht in `validateInput`, `applyAccountConfig` en `finalize`, en voegen een docslink toe wanneer `docsPath` is ingesteld.

  </Accordion>
  <Accordion title="Setuphelpers met binaire ondersteuning">
    Voor setup-UI's met binaire ondersteuning geef je de voorkeur aan de gedeelde gedelegeerde helpers in plaats van dezelfde binaire/statuslijm naar elk kanaal te kopiëren:

    - `createDetectedBinaryStatus(...)` voor statusblokken die alleen variëren op labels, hints, scores en binaire detectie
    - `createCliPathTextInput(...)` voor tekstinvoer met padondersteuning
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` en `createDelegatedResolveConfigured(...)` wanneer `setupEntry` lui moet doorsturen naar een zwaardere volledige wizard
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
    Gebruik npm wanneer een pakket nog niet naar ClawHub is verplaatst, of wanneer je tijdens migratie een
    rechtstreeks npm-installatiepad nodig hebt:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**In-repo plugins:** plaats ze onder de gebundelde plugin-workspaceboom en ze worden tijdens de build automatisch ontdekt.

**Gebruikers kunnen installeren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Voor installs uit npm voert `openclaw plugins install` projectlokale `npm install --ignore-scripts` uit (geen lifecycle-scripts), waarbij overgenomen globale npm-installatie-instellingen worden genegeerd. Houd afhankelijkheidsbomen van plugins puur JS/TS en vermijd pakketten die `postinstall`-builds vereisen.
</Info>

<Note>
Gebundelde plugins die eigendom zijn van OpenClaw zijn de enige uitzondering voor herstel bij het opstarten: wanneer een pakketinstallatie ziet dat er een is ingeschakeld via pluginconfiguratie, verouderde kanaalconfiguratie of het gebundelde manifest dat standaard ingeschakeld is, installeert het opstartproces de ontbrekende runtime-afhankelijkheden van die plugin vóór het importeren. Operators kunnen die fase inspecteren of herstellen met `openclaw plugins deps`. Plugins van derden mogen niet vertrouwen op installaties bij het opstarten; blijf de expliciete plugininstaller gebruiken.
</Note>

Gebundelde runtime-afhankelijkheden op pakketniveau zijn expliciete metadata, niet afgeleid uit gebouwde JavaScript bij het opstarten van de Gateway. Als een gedeelde root-afhankelijkheid van OpenClaw beschikbaar moet zijn binnen de externe runtime-spiegel voor gebundelde plugins, declareer deze dan in `openclaw.bundle.mirroredRootRuntimeDependencies` in het rootpakketmanifest.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — stapsgewijze gids om aan de slag te gaan
- [Pluginmanifest](/nl/plugins/manifest) — volledige referentie voor het manifestschema
- [SDK-invoerpunten](/nl/plugins/sdk-entrypoints) — `definePluginEntry` en `defineChannelPluginEntry`
