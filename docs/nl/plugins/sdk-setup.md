---
read_when:
    - Je voegt een configuratiewizard toe aan een Plugin
    - Je moet het verschil tussen setup-entry.ts en index.ts begrijpen
    - Je definieert pluginconfigschema's of package.json openclaw-metadata
sidebarTitle: Setup and config
summary: Installatiewizards, setup-entry.ts, configuratieschema's en package.json-metadata
title: Plugin-installatie en configuratie
x-i18n:
    generated_at: "2026-04-29T23:06:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92f470a5c7e8fe06b9244a737de80c0509b26aa983d05e60dd1689cc628fc90d
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referentie voor Plugin-verpakking (`package.json`-metadata), manifests (`openclaw.plugin.json`), setupvermeldingen en configuratieschema's.

<Tip>
**Op zoek naar een walkthrough?** De how-to-gidsen behandelen verpakking in context: [Kanaal-plugins](/nl/plugins/sdk-channel-plugins#step-1-package-and-manifest) en [Provider-plugins](/nl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Pakketmetadata

Je `package.json` heeft een `openclaw`-veld nodig dat het Plugin-systeem vertelt wat je Plugin biedt:

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
Als je de Plugin extern op ClawHub publiceert, zijn die `compat`- en `build`-velden verplicht. De canonieke publicatiefragmenten staan in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-velden

<ParamField path="extensions" type="string[]">
  Entry point-bestanden (relatief aan de pakketroot).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lichtgewicht vermelding die alleen voor setup is bedoeld (optioneel).
</ParamField>
<ParamField path="channel" type="object">
  Kanaalcatalogusmetadata voor setup-, picker-, quickstart- en statusoppervlakken.
</ParamField>
<ParamField path="providers" type="string[]">
  Provider-id's die door deze Plugin worden geregistreerd.
</ParamField>
<ParamField path="install" type="object">
  Installatietips: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
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
| `selectionLabel`                       | `string`   | Picker-/setuplabel wanneer dit moet verschillen van `label`.                 |
| `detailLabel`                          | `string`   | Secundair detaillabel voor uitgebreidere kanaalcatalogi en statusoppervlakken. |
| `docsPath`                             | `string`   | Documentatiepad voor setup- en selectielinks.                                 |
| `docsLabel`                            | `string`   | Vervangend label voor documentatielinks wanneer dit moet verschillen van de kanaal-id. |
| `blurb`                                | `string`   | Korte onboarding-/catalogusbeschrijving.                                      |
| `order`                                | `number`   | Sorteervolgorde in kanaalcatalogi.                                            |
| `aliases`                              | `string[]` | Extra zoekaliassen voor kanaalselectie.                                       |
| `preferOver`                           | `string[]` | Plugin-/kanaal-id's met lagere prioriteit die door dit kanaal moeten worden overtroffen. |
| `systemImage`                          | `string`   | Optionele pictogram-/systeemafbeeldingsnaam voor kanaal-UI-catalogi.          |
| `selectionDocsPrefix`                  | `string`   | Prefixtekst vóór documentatielinks in selectieoppervlakken.                  |
| `selectionDocsOmitLabel`               | `boolean`  | Toon het documentatiepad direct in plaats van een gelabelde documentatielink in selectietekst. |
| `selectionExtras`                      | `string[]` | Extra korte strings die in selectietekst worden toegevoegd.                  |
| `markdownCapable`                      | `boolean`  | Markeert het kanaal als geschikt voor markdown voor beslissingen over uitgaande opmaak. |
| `exposure`                             | `object`   | Zichtbaarheidsinstellingen voor het kanaal in setup-, geconfigureerde lijst- en documentatieoppervlakken. |
| `quickstartAllowFrom`                  | `boolean`  | Laat dit kanaal deelnemen aan de standaard quickstart-setupflow `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Vereis expliciete accountkoppeling, ook wanneer er maar één account bestaat. |
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
- `setup`: neem het kanaal op in interactieve setup-/configuratiepickers
- `docs`: markeer het kanaal als publiek zichtbaar in documentatie-/navigatieoppervlakken

<Note>
`showConfigured` en `showInSetup` blijven ondersteund als verouderde aliassen. Geef de voorkeur aan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` is pakketmetadata, geen manifestmetadata.

| Veld                         | Type                 | Wat het betekent                                                               |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Canonieke npm-specificatie voor installatie-/updateflows.                      |
| `localPath`                  | `string`             | Lokaal ontwikkelpad of gebundeld installatiepad.                               |
| `defaultChoice`              | `"npm"` \| `"local"` | Voorkeursinstallatiebron wanneer beide beschikbaar zijn.                       |
| `minHostVersion`             | `string`             | Minimaal ondersteunde OpenClaw-versie in de vorm `>=x.y.z`.                    |
| `expectedIntegrity`          | `string`             | Verwachte npm-dist-integriteitsstring, meestal `sha512-...`, voor gepinde installaties. |
| `allowInvalidConfigRecovery` | `boolean`            | Laat herinstallatieflows voor gebundelde plugins herstellen van specifieke fouten door verouderde configuratie. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interactieve onboarding gebruikt ook `openclaw.install` voor install-on-demand-oppervlakken. Als je Plugin provider-authkeuzes of kanaalsetup-/catalogusmetadata beschikbaar maakt voordat de runtime laadt, kan onboarding die keuze tonen, om npm- versus lokale installatie vragen, de Plugin installeren of inschakelen en vervolgens doorgaan met de geselecteerde flow. Npm-onboardingkeuzes vereisen vertrouwde catalogusmetadata met een registry-`npmSpec`; exacte versies en `expectedIntegrity` zijn optionele pins. Als `expectedIntegrity` aanwezig is, dwingen installatie-/updateflows dit af. Bewaar de metadata voor "wat te tonen" in `openclaw.plugin.json` en de metadata voor "hoe het te installeren" in `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Als `minHostVersion` is ingesteld, wordt dit afgedwongen bij zowel installatie als laden van manifestregistry. Oudere hosts slaan de Plugin over; ongeldige versiestrings worden geweigerd.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` is geen algemene bypass voor kapotte configuraties. Het is alleen bedoeld voor smal herstel van gebundelde plugins, zodat herinstallatie/setup bekende upgrade-restanten kan repareren, zoals een ontbrekend gebundeld Plugin-pad of een verouderde `channels.<id>`-vermelding voor diezelfde Plugin. Als de configuratie om niet-gerelateerde redenen kapot is, blijft installatie gesloten falen en krijgt de operator de instructie om `openclaw doctor --fix` uit te voeren.
  </Accordion>
</AccordionGroup>

### Uitgesteld volledig laden

Kanaal-plugins kunnen kiezen voor uitgesteld laden met:

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

Wanneer dit is ingeschakeld, laadt OpenClaw alleen `setupEntry` tijdens de opstartfase vóór luisteren, zelfs voor al geconfigureerde kanalen. De volledige vermelding wordt geladen nadat de Gateway begint te luisteren.

<Warning>
Schakel uitgesteld laden alleen in wanneer je `setupEntry` alles registreert wat de Gateway nodig heeft voordat deze begint te luisteren (kanaalregistratie, HTTP-routes, Gateway-methoden). Als de volledige vermelding vereiste opstartmogelijkheden bezit, houd dan het standaardgedrag.
</Warning>

Als je setup-/volledige vermelding Gateway-RPC-methoden registreert, houd ze dan op een Plugin-specifieke prefix. Gereserveerde core-adminnaamruimten (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven eigendom van core en worden altijd opgelost naar `operator.admin`.

## Plugin-manifest

Elke native Plugin moet een `openclaw.plugin.json` in de pakketroot leveren. OpenClaw gebruikt dit om configuratie te valideren zonder Plugin-code uit te voeren.

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

Voeg voor kanaal-plugins `kind` en `channels` toe:

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

Zelfs plugins zonder configuratie moeten een schema leveren. Een leeg schema is geldig:

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
De verouderde publicatiealias die alleen voor Skills is bedoeld, is voor Skills. Plugin-pakketten moeten altijd `clawhub package publish` gebruiken.
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

Gebundelde workspace-kanalen die setup-veilige exports in sidecar-modules bewaren, kunnen `defineBundledChannelSetupEntry(...)` uit `openclaw/plugin-sdk/channel-entry-contract` gebruiken in plaats van `defineSetupPluginEntry(...)`. Dat gebundelde contract ondersteunt ook een optionele `runtime`-export, zodat runtime-wiring tijdens setup lichtgewicht en expliciet kan blijven.

<AccordionGroup>
  <Accordion title="Wanneer OpenClaw setupEntry gebruikt in plaats van de volledige entry">
    - Het kanaal is uitgeschakeld, maar heeft setup-/onboarding-oppervlakken nodig.
    - Het kanaal is ingeschakeld, maar niet geconfigureerd.
    - Uitgesteld laden is ingeschakeld (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Wat setupEntry moet registreren">
    - Het kanaalpluginobject (via `defineSetupPluginEntry`).
    - Alle HTTP-routes die nodig zijn voordat de Gateway gaat luisteren.
    - Alle Gateway-methoden die nodig zijn tijdens het opstarten.

    Die opstart-Gateway-methoden moeten nog steeds gereserveerde core-admin-naamruimten zoals `config.*` of `update.*` vermijden.

  </Accordion>
  <Accordion title="Wat setupEntry NIET mag bevatten">
    - CLI-registraties.
    - Achtergrondservices.
    - Zware runtime-imports (crypto, SDK's).
    - Gateway-methoden die pas na het opstarten nodig zijn.

  </Accordion>
</AccordionGroup>

### Smalle setup-helperimports

Gebruik voor snelle paden die alleen voor setup zijn de smalle setup-helperseams in plaats van de bredere paraplu `plugin-sdk/setup` wanneer je slechts een deel van het setup-oppervlak nodig hebt:

| Importpad                          | Gebruik dit voor                                                                        | Belangrijke exports                                                                                                                                                                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtimehelpers tijdens setup die beschikbaar blijven in `setupEntry` / uitgestelde kanaalstart | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | omgevingsbewuste adapters voor accountsetup                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helpers voor setup-/installatie-CLI, archieven en docs                                  | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Gebruik de bredere seam `plugin-sdk/setup` wanneer je de volledige gedeelde setup-toolbox wilt, inclusief config-patchhelpers zoals `moveSingleAccountChannelSectionToDefaultAccount(...)`.

De setup-patchadapters blijven bij import veilig voor het snelle pad. Hun gebundelde contractoppervlak-lookup voor single-account-promotie is lazy, dus het importeren van `plugin-sdk/setup-runtime` laadt de gebundelde contractoppervlakdetectie niet eager voordat de adapter daadwerkelijk wordt gebruikt.

### Kanaaleigen single-account-promotie

Wanneer een kanaal wordt bijgewerkt van een top-level single-account-config naar `channels.<id>.accounts.*`, is het standaard gedeelde gedrag om gepromoveerde account-scoped waarden naar `accounts.default` te verplaatsen.

Gebundelde kanalen kunnen die promotie via hun setup-contractoppervlak versmallen of overschrijven:

- `singleAccountKeysToMove`: extra top-level sleutels die naar het gepromoveerde account moeten worden verplaatst
- `namedAccountPromotionKeys`: wanneer named accounts al bestaan, worden alleen deze sleutels naar het gepromoveerde account verplaatst; gedeelde policy-/delivery-sleutels blijven op de kanaalroot
- `resolveSingleAccountPromotionTarget(...)`: kies welk bestaand account gepromoveerde waarden ontvangt

<Note>
Matrix is het huidige gebundelde voorbeeld. Als er precies één named Matrix-account al bestaat, of als `defaultAccount` naar een bestaande niet-canonieke sleutel zoals `Ops` wijst, behoudt promotie dat account in plaats van een nieuwe `accounts.default`-entry te maken.
</Note>

## Configschema

Pluginconfig wordt gevalideerd tegen het JSON Schema in je manifest. Gebruikers configureren plugins via:

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

Je plugin ontvangt deze config als `api.pluginConfig` tijdens registratie.

Gebruik voor kanaalspecifieke config in plaats daarvan de kanaalconfigsectie:

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

### Kanaalconfigschema's bouwen

Gebruik `buildChannelConfigSchema` om een Zod-schema om te zetten naar de `ChannelConfigSchema`-wrapper die wordt gebruikt door plugin-eigen configartefacten:

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

Voor plugins van derden blijft het cold-path-contract het pluginmanifest: spiegel het gegenereerde JSON Schema naar `openclaw.plugin.json#channelConfigs`, zodat het configschema, setup en UI-oppervlakken `channels.<id>` kunnen inspecteren zonder runtimecode te laden.

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
    Geef voor DM-allowlistprompts die alleen de standaardflow `note -> prompt -> parse -> merge -> patch` nodig hebben de voorkeur aan de gedeelde setuphelpers uit `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` en `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standaard kanaalsetupstatus">
    Geef voor statusblokken voor kanaalsetup die alleen verschillen in labels, scores en optionele extra regels de voorkeur aan `createStandardChannelSetupStatus(...)` uit `openclaw/plugin-sdk/setup` in plaats van hetzelfde `status`-object handmatig in elke plugin te bouwen.
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

    `plugin-sdk/channel-setup` stelt ook de lager-niveau builders `createOptionalChannelSetupAdapter(...)` en `createOptionalChannelSetupWizard(...)` beschikbaar wanneer je slechts één helft van dat optionele installatie-oppervlak nodig hebt.

    De gegenereerde optionele adapter/wizard faalt gesloten bij echte configwrites. Ze hergebruiken één installatie-vereist-bericht in `validateInput`, `applyAccountConfig` en `finalize`, en voegen een docslink toe wanneer `docsPath` is ingesteld.

  </Accordion>
  <Accordion title="Binary-ondersteunde setuphelpers">
    Geef voor binary-ondersteunde setup-UI's de voorkeur aan de gedeelde gedelegeerde helpers in plaats van dezelfde binary-/statuslijm naar elk kanaal te kopiëren:

    - `createDetectedBinaryStatus(...)` voor statusblokken die alleen verschillen in labels, hints, scores en binarydetectie
    - `createCliPathTextInput(...)` voor pad-ondersteunde tekstinputs
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` en `createDelegatedResolveConfigured(...)` wanneer `setupEntry` lazy moet doorsturen naar een zwaardere volledige wizard
    - `createDelegatedTextInputShouldPrompt(...)` wanneer `setupEntry` alleen een beslissing voor `textInputs[*].shouldPrompt` hoeft te delegeren

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
    direct npm-installatiepad nodig hebt:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**In-repo plugins:** plaats ze onder de gebundelde pluginworkspacetree en ze worden automatisch ontdekt tijdens de build.

**Gebruikers kunnen installeren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Voor installs met npm als bron voert `openclaw plugins install` project-lokaal `npm install --ignore-scripts` uit (geen lifecyclescripts), waarbij overgenomen globale npm-installatie-instellingen worden genegeerd. Houd plugin-dependencytrees zuiver JS/TS en vermijd pakketten die `postinstall`-builds vereisen.
</Info>

<Note>
Gebundelde plugins die eigendom zijn van OpenClaw zijn de enige uitzondering voor opstartherstel: wanneer een pakketinstallatie er een ingeschakeld ziet via pluginconfiguratie, verouderde kanaalconfiguratie of het meegebundelde manifest waarin het standaard is ingeschakeld, installeert het opstarten de ontbrekende runtime-afhankelijkheden van die plugin vóór het importeren. Plugins van derden mogen niet vertrouwen op installaties bij het opstarten; blijf de expliciete plugininstaller gebruiken.
</Note>

Gebundelde runtime-afhankelijkheden op pakketniveau zijn expliciete metadata en worden niet afgeleid uit de gebouwde JavaScript bij het opstarten van de Gateway. Als een gedeelde root-afhankelijkheid van OpenClaw beschikbaar moet zijn binnen de externe runtime-mirror van de gebundelde plugin, declareer die dan in `openclaw.bundle.mirroredRootRuntimeDependencies` in het rootpakketmanifest.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — stapsgewijze gids om aan de slag te gaan
- [Plugin-manifest](/nl/plugins/manifest) — volledige referentie voor het manifestschema
- [SDK-toegangspunten](/nl/plugins/sdk-entrypoints) — `definePluginEntry` en `defineChannelPluginEntry`
