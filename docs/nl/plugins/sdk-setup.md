---
read_when:
    - Je voegt een installatiewizard toe aan een Plugin
    - Je moet het verschil tussen setup-entry.ts en index.ts begrijpen.
    - Je definieert Plugin-configuratieschema's of package.json openclaw-metadata
sidebarTitle: Setup and config
summary: Installatiewizards, setup-entry.ts, configuratieschema's en package.json-metadata
title: Plugin instellen en configureren
x-i18n:
    generated_at: "2026-05-02T20:57:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referentie voor Plugin-verpakking (`package.json`-metadata), manifests (`openclaw.plugin.json`), setupvermeldingen en configuratieschema's.

<Tip>
**Zoek je een walkthrough?** De how-to-gidsen behandelen verpakking in context: [Kanaal-plugins](/nl/plugins/sdk-channel-plugins#step-1-package-and-manifest) en [Provider-plugins](/nl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Pakketmetadata

Je `package.json` heeft een `openclaw`-veld nodig dat het Plugin-systeem vertelt wat je Plugin levert:

<Tabs>
  <Tab title="Kanaal-plugin">
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
  <Tab title="Provider-plugin / ClawHub-baseline">
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
  Entry-pointbestanden (relatief ten opzichte van de pakketroot).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lichtgewicht entry alleen voor setup (optioneel).
</ParamField>
<ParamField path="channel" type="object">
  Metadata voor de kanaalcatalogus voor setup-, kiezer-, quickstart- en statusoppervlakken.
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

| Veld                                   | Type       | Wat het betekent                                                               |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Canonieke kanaal-id.                                                          |
| `label`                                | `string`   | Primair kanaallabel.                                                          |
| `selectionLabel`                       | `string`   | Kiezer-/setuplabel wanneer dit moet verschillen van `label`.                  |
| `detailLabel`                          | `string`   | Secundair detaillabel voor rijkere kanaalcatalogi en statusoppervlakken.      |
| `docsPath`                             | `string`   | Documentatiepad voor setup- en selectielinks.                                 |
| `docsLabel`                            | `string`   | Overschrijft het label dat voor documentatielinks wordt gebruikt wanneer dit moet verschillen van de kanaal-id. |
| `blurb`                                | `string`   | Korte beschrijving voor onboarding/catalogus.                                 |
| `order`                                | `number`   | Sorteervolgorde in kanaalcatalogi.                                            |
| `aliases`                              | `string[]` | Extra opzoekaliassen voor kanaalselectie.                                     |
| `preferOver`                           | `string[]` | Plugin-/kanaal-id's met lagere prioriteit waar dit kanaal boven moet staan.   |
| `systemImage`                          | `string`   | Optionele pictogram-/systeemafbeeldingsnaam voor kanaal-UI-catalogi.          |
| `selectionDocsPrefix`                  | `string`   | Prefixtekst vóór documentatielinks in selectieoppervlakken.                   |
| `selectionDocsOmitLabel`               | `boolean`  | Toon het documentatiepad direct in plaats van een gelabelde documentatielink in selectietekst. |
| `selectionExtras`                      | `string[]` | Extra korte strings die aan selectietekst worden toegevoegd.                  |
| `markdownCapable`                      | `boolean`  | Markeert het kanaal als markdown-geschikt voor beslissingen over uitgaande opmaak. |
| `exposure`                             | `object`   | Zichtbaarheidsinstellingen voor het kanaal voor setup-, geconfigureerde lijst- en documentatieoppervlakken. |
| `quickstartAllowFrom`                  | `boolean`  | Laat dit kanaal meedoen aan de standaard quickstart-setupflow `allowFrom`.    |
| `forceAccountBinding`                  | `boolean`  | Vereis expliciete accountkoppeling, zelfs wanneer er maar één account bestaat. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Geef de voorkeur aan sessie-opzoeking bij het oplossen van aankondigingsdoelen voor dit kanaal. |

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
`showConfigured` en `showInSetup` blijven ondersteund als legacy-aliassen. Geef de voorkeur aan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` is pakketmetadata, geen manifestmetadata.

| Veld                         | Type                                | Wat het betekent                                                               |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Canonieke ClawHub-specificatie voor installatie/update en onboardingflows voor installeren op aanvraag. |
| `npmSpec`                    | `string`                            | Canonieke npm-specificatie voor fallbackflows voor installatie/update.         |
| `localPath`                  | `string`                            | Lokaal ontwikkelpad of gebundeld installatiepad.                              |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Voorkeursinstallatiebron wanneer er meerdere bronnen beschikbaar zijn.         |
| `minHostVersion`             | `string`                            | Minimaal ondersteunde OpenClaw-versie in de vorm `>=x.y.z` of `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Verwachte npm-dist-integriteitsstring, meestal `sha512-...`, voor vastgepinde installaties. |
| `allowInvalidConfigRecovery` | `boolean`                           | Laat herinstallatieflows voor gebundelde Plugins herstellen van specifieke fouten door verouderde configuratie. |

<AccordionGroup>
  <Accordion title="Onboardinggedrag">
    Interactieve onboarding gebruikt ook `openclaw.install` voor oppervlakken voor installeren op aanvraag. Als je Plugin provider-authenticatiekeuzes of metadata voor kanaalsetup/catalogus blootstelt voordat de runtime laadt, kan onboarding die keuze tonen, vragen om installatie via ClawHub, npm of lokaal, de Plugin installeren of inschakelen en daarna doorgaan met de geselecteerde flow. ClawHub-onboardingkeuzes gebruiken `clawhubSpec` en krijgen de voorkeur wanneer aanwezig; npm-keuzes vereisen vertrouwde catalogusmetadata met een registry-`npmSpec`; exacte versies en `expectedIntegrity` zijn optionele npm-pins. Als `expectedIntegrity` aanwezig is, dwingen installatie-/updateflows dit af voor npm. Bewaar de metadata voor "wat te tonen" in `openclaw.plugin.json` en de metadata voor "hoe het te installeren" in `package.json`.
  </Accordion>
  <Accordion title="Afdwinging van minHostVersion">
    Als `minHostVersion` is ingesteld, dwingen zowel installatie als het laden van niet-gebundelde manifestregistries dit af. Oudere hosts slaan externe Plugins over; ongeldige versiestrings worden geweigerd. Gebundelde bron-Plugins worden geacht dezelfde versie te hebben als de hostcheckout.
  </Accordion>
  <Accordion title="Vastgepinde npm-installaties">
    Houd voor vastgepinde npm-installaties de exacte versie in `npmSpec` en voeg de verwachte artefactintegriteit toe:

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
  <Accordion title="Scope van allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` is geen algemene omzeiling voor kapotte configuraties. Het is alleen bedoeld voor beperkt herstel van gebundelde Plugins, zodat herinstallatie/setup bekende restanten van upgrades kan repareren, zoals een ontbrekend pad naar een gebundelde Plugin of een verouderde `channels.<id>`-vermelding voor diezelfde Plugin. Als de configuratie om niet-gerelateerde redenen kapot is, mislukt de installatie nog steeds gesloten en krijgt de operator de opdracht `openclaw doctor --fix` uit te voeren.
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

Wanneer dit is ingeschakeld, laadt OpenClaw tijdens de opstartfase vóór het luisteren alleen `setupEntry`, zelfs voor al geconfigureerde kanalen. De volledige entry laadt nadat de Gateway begint te luisteren.

<Warning>
Schakel uitgesteld laden alleen in wanneer je `setupEntry` alles registreert wat de Gateway nodig heeft voordat deze begint te luisteren (kanaalregistratie, HTTP-routes, Gateway-methoden). Als de volledige entry eigenaar is van vereiste opstartmogelijkheden, behoud dan het standaardgedrag.
</Warning>

Als je setup-/volledige entry Gateway-RPC-methoden registreert, houd ze dan op een Plugin-specifieke prefix. Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven eigendom van core en worden altijd opgelost naar `operator.admin`.

## Pluginmanifest

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

Zie [Pluginmanifest](/nl/plugins/manifest) voor de volledige schemareferentie.

## Publiceren op ClawHub

Gebruik voor Plugin-pakketten de pakketspecifieke ClawHub-opdracht:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
De verouderde publicatiealias alleen voor skills is bedoeld voor skills. Pluginpakketten moeten altijd `clawhub package publish` gebruiken.
</Note>

## Setup-entry

Het bestand `setup-entry.ts` is een lichtgewicht alternatief voor `index.ts` dat OpenClaw laadt wanneer het alleen setup-oppervlakken nodig heeft (onboarding, config-reparatie, inspectie van uitgeschakelde kanalen).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dit voorkomt dat zware runtimecode (cryptobibliotheken, CLI-registraties, achtergrondservices) tijdens setup-flows wordt geladen.

Gebundelde workspace-kanalen die setup-veilige exports in sidecar-modules bewaren, kunnen `defineBundledChannelSetupEntry(...)` uit `openclaw/plugin-sdk/channel-entry-contract` gebruiken in plaats van `defineSetupPluginEntry(...)`. Dat gebundelde contract ondersteunt ook een optionele `runtime`-export, zodat runtime-bedrading tijdens setup lichtgewicht en expliciet kan blijven.

<AccordionGroup>
  <Accordion title="Wanneer OpenClaw setupEntry gebruikt in plaats van de volledige entry">
    - Het kanaal is uitgeschakeld, maar heeft setup-/onboarding-oppervlakken nodig.
    - Het kanaal is ingeschakeld, maar niet geconfigureerd.
    - Uitgesteld laden is ingeschakeld (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Wat setupEntry moet registreren">
    - Het kanaal-Plugin-object (via `defineSetupPluginEntry`).
    - Alle HTTP-routes die nodig zijn voordat de Gateway luistert.
    - Alle Gateway-methoden die tijdens het opstarten nodig zijn.

    Die opstart-Gateway-methoden moeten nog steeds gereserveerde core-beheernamespaces zoals `config.*` of `update.*` vermijden.

  </Accordion>
  <Accordion title="Wat setupEntry NIET moet bevatten">
    - CLI-registraties.
    - Achtergrondservices.
    - Zware runtime-imports (crypto, SDK's).
    - Gateway-methoden die alleen na het opstarten nodig zijn.

  </Accordion>
</AccordionGroup>

### Smalle setup-helperimports

Gebruik voor hete paden die alleen setup nodig hebben liever de smalle setup-helperseams dan de bredere `plugin-sdk/setup`-paraplu wanneer je slechts een deel van het setup-oppervlak nodig hebt:

| Importpad                         | Gebruik dit voor                                                                         | Belangrijkste exports                                                                                                                                                                                                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | runtimehelpers tijdens setup die beschikbaar blijven in `setupEntry` / uitgestelde kanaalstart | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | omgevingsbewuste adapters voor accountsetup                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`          | helpers voor setup-/installatie-CLI/archieven/docs                                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                 |

Gebruik de bredere `plugin-sdk/setup`-seam wanneer je de volledige gedeelde setup-toolbox wilt, inclusief config-patchhelpers zoals `moveSingleAccountChannelSectionToDefaultAccount(...)`.

De setup-patchadapters blijven veilig voor het hete pad bij import. Hun gebundelde contract-oppervlaklookup voor promotie van één account is lazy, dus het importeren van `plugin-sdk/setup-runtime` laadt de gebundelde contract-oppervlakontdekking niet gretig voordat de adapter daadwerkelijk wordt gebruikt.

### Kanaal-eigen promotie van één account

Wanneer een kanaal wordt geüpgraded van een top-level config voor één account naar `channels.<id>.accounts.*`, is het standaard gedeelde gedrag dat gepromoveerde account-scoped waarden naar `accounts.default` worden verplaatst.

Gebundelde kanalen kunnen die promotie beperken of overschrijven via hun setup-contractoppervlak:

- `singleAccountKeysToMove`: extra top-level keys die naar het gepromoveerde account moeten worden verplaatst
- `namedAccountPromotionKeys`: wanneer benoemde accounts al bestaan, worden alleen deze keys naar het gepromoveerde account verplaatst; gedeelde policy-/delivery-keys blijven op de kanaalroot
- `resolveSingleAccountPromotionTarget(...)`: kies welk bestaand account gepromoveerde waarden ontvangt

<Note>
Matrix is het huidige gebundelde voorbeeld. Als er al precies één benoemd Matrix-account bestaat, of als `defaultAccount` naar een bestaande niet-canonieke key zoals `Ops` wijst, behoudt promotie dat account in plaats van een nieuwe `accounts.default`-entry te maken.
</Note>

## Config-schema

Pluginconfiguratie wordt gevalideerd tegen het JSON Schema in je manifest. Gebruikers configureren plugins via:

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

Gebruik `buildChannelConfigSchema` om een Zod-schema om te zetten naar de `ChannelConfigSchema`-wrapper die wordt gebruikt door Plugin-eigen configuratieartefacten:

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

Als je het contract al als JSON Schema of TypeBox schrijft, gebruik dan de directe helper zodat OpenClaw de conversie van Zod naar JSON Schema op metadatapaden kan overslaan:

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

Voor plugins van derden blijft het cold-pathcontract het Plugin-manifest: spiegel het gegenereerde JSON Schema naar `openclaw.plugin.json#channelConfigs`, zodat configuratieschema-, setup- en UI-oppervlakken `channels.<id>` kunnen inspecteren zonder runtimecode te laden.

## Setupwizards

Kanaalplugins kunnen interactieve setupwizards bieden voor `openclaw onboard`. De wizard is een `ChannelSetupWizard`-object op de `ChannelPlugin`:

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

Het type `ChannelSetupWizard` ondersteunt `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` en meer. Zie gebundelde Pluginpakketten (bijvoorbeeld de Discord-Plugin `src/channel.setup.ts`) voor volledige voorbeelden.

<AccordionGroup>
  <Accordion title="Gedeelde allowFrom-prompts">
    Geef voor DM-allowlistprompts die alleen de standaardflow `note -> prompt -> parse -> merge -> patch` nodig hebben de voorkeur aan de gedeelde setuphelpers uit `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` en `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standaardstatus voor kanaalsetup">
    Geef voor statusblokken voor kanaalsetup die alleen verschillen in labels, scores en optionele extra regels de voorkeur aan `createStandardChannelSetupStatus(...)` uit `openclaw/plugin-sdk/setup` in plaats van hetzelfde `status`-object in elke Plugin handmatig te schrijven.
  </Accordion>
  <Accordion title="Optioneel kanaalsetup-oppervlak">
    Gebruik voor optionele setup-oppervlakken die alleen in bepaalde contexten moeten verschijnen `createOptionalChannelSetupSurface` uit `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` exposeert ook de lower-level builders `createOptionalChannelSetupAdapter(...)` en `createOptionalChannelSetupWizard(...)` wanneer je slechts één helft van dat optionele installatieoppervlak nodig hebt.

    De gegenereerde optionele adapter/wizard faalt gesloten bij echte configuratieschrijfacties. Ze hergebruiken één installatie-vereist-bericht in `validateInput`, `applyAccountConfig` en `finalize`, en voegen een docs-link toe wanneer `docsPath` is ingesteld.

  </Accordion>
  <Accordion title="Binary-backed setuphelpers">
    Geef voor binary-backed setup-UI's de voorkeur aan de gedeelde gedelegeerde helpers in plaats van dezelfde binary-/statuslijm naar elk kanaal te kopiëren:

    - `createDetectedBinaryStatus(...)` voor statusblokken die alleen verschillen in labels, hints, scores en binary-detectie
    - `createCliPathTextInput(...)` voor tekstinvoer met padbacking
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` en `createDelegatedResolveConfigured(...)` wanneer `setupEntry` lazy naar een zwaardere volledige wizard moet doorsturen
    - `createDelegatedTextInputShouldPrompt(...)` wanneer `setupEntry` alleen een beslissing voor `textInputs[*].shouldPrompt` hoeft te delegeren

  </Accordion>
</AccordionGroup>

## Publiceren en installeren

**Externe plugins:** publiceer naar [ClawHub](/nl/tools/clawhub) en installeer daarna:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Kale pakketspecificaties worden tijdens de launch-cutover vanuit npm geïnstalleerd.

  </Tab>
  <Tab title="Alleen ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm-pakketspecificatie">
    Gebruik npm wanneer een pakket nog niet naar ClawHub is verplaatst, of wanneer je tijdens migratie een
    direct npm-installatiepad nodig hebt:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins in de repo:** plaats ze onder de meegeleverde Plugin-workspaceboom en ze worden automatisch ontdekt tijdens de build.

**Gebruikers kunnen installeren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Voor installaties vanuit npm installeert `openclaw plugins install` het pakket onder `~/.openclaw/npm` met lifecycle-scripts uitgeschakeld. Houd afhankelijkheidsbomen van Plugins puur JS/TS en vermijd pakketten die `postinstall`-builds vereisen.
</Info>

<Note>
Het opstarten van de Gateway installeert geen Plugin-afhankelijkheden. npm/git/ClawHub-installatiestromen zijn eigenaar van afhankelijkheidsconvergentie; lokale Plugins moeten hun afhankelijkheden al geïnstalleerd hebben.
</Note>

Metadata van gebundelde pakketten is expliciet en wordt niet afgeleid uit gebouwde JavaScript bij het opstarten van de Gateway. Runtime-afhankelijkheden horen thuis in het Plugin-pakket dat ze bezit; het opstarten van verpakte OpenClaw repareert of spiegelt Plugin-afhankelijkheden nooit.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — stapsgewijze gids om aan de slag te gaan
- [Plugin-manifest](/nl/plugins/manifest) — volledige referentie voor het manifestschema
- [SDK-entrypoints](/nl/plugins/sdk-entrypoints) — `definePluginEntry` en `defineChannelPluginEntry`
