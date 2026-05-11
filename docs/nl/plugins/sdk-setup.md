---
read_when:
    - Je voegt een installatiewizard toe aan een Plugin
    - Je moet het verschil tussen setup-entry.ts en index.ts begrijpen
    - Je definieert pluginconfigschema's of package.json-openclaw-metadata
sidebarTitle: Setup and config
summary: Installatiewizards, setup-entry.ts, configuratieschema's en package.json-metadata
title: Plugin-installatie en configuratie
x-i18n:
    generated_at: "2026-05-11T20:43:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referentie voor pluginverpakking (`package.json`-metadata), manifests (`openclaw.plugin.json`), setup-items en configuratieschema's.

<Tip>
**Op zoek naar een stapsgewijze uitleg?** De how-to-gidsen behandelen verpakking in context: [Kanaalplugins](/nl/plugins/sdk-channel-plugins#step-1-package-and-manifest) en [Providerplugins](/nl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Pakketmetadata

Je `package.json` heeft een `openclaw`-veld nodig dat het pluginsysteem vertelt wat je plugin biedt:

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
Als je de plugin extern publiceert op ClawHub, zijn die `compat`- en `build`-velden vereist. De canonieke publicatiesnippets staan in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-velden

<ParamField path="extensions" type="string[]">
  Entry-pointbestanden (relatief ten opzichte van de pakketroot).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lichtgewicht entry alleen voor setup (optioneel).
</ParamField>
<ParamField path="channel" type="object">
  Kanaalcatalogusmetadata voor setup, kiezer, quickstart en statusoppervlakken.
</ParamField>
<ParamField path="providers" type="string[]">
  Provider-id's die door deze plugin worden geregistreerd.
</ParamField>
<ParamField path="install" type="object">
  Installatiehints: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Vlaggen voor opstartgedrag.
</ParamField>

### `openclaw.channel`

`openclaw.channel` is goedkope pakketmetadata voor kanaaldetectie en setup-oppervlakken voordat de runtime wordt geladen.

| Veld                                   | Type       | Betekenis                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Canoniek kanaal-id.                                                            |
| `label`                                | `string`   | Primair kanaallabel.                                                           |
| `selectionLabel`                       | `string`   | Kiezer-/setuplabel wanneer dit moet afwijken van `label`.                      |
| `detailLabel`                          | `string`   | Secundair detaillabel voor rijkere kanaalcatalogi en statusoppervlakken.       |
| `docsPath`                             | `string`   | Docspad voor setup- en selectielinks.                                          |
| `docsLabel`                            | `string`   | Overschrijft het label dat voor docslinks wordt gebruikt wanneer dit moet afwijken van het kanaal-id. |
| `blurb`                                | `string`   | Korte onboarding-/catalogusbeschrijving.                                       |
| `order`                                | `number`   | Sorteervolgorde in kanaalcatalogi.                                             |
| `aliases`                              | `string[]` | Extra opzoekaliassen voor kanaalselectie.                                      |
| `preferOver`                           | `string[]` | Plugin-/kanaal-id's met lagere prioriteit waar dit kanaal voor moet gaan.      |
| `systemImage`                          | `string`   | Optionele pictogram-/systeemafbeeldingsnaam voor kanaal-UI-catalogi.           |
| `selectionDocsPrefix`                  | `string`   | Prefixtekst vóór docslinks in selectieoppervlakken.                            |
| `selectionDocsOmitLabel`               | `boolean`  | Toon het docspad direct in plaats van een gelabelde docslink in selectietekst. |
| `selectionExtras`                      | `string[]` | Extra korte strings die aan selectietekst worden toegevoegd.                   |
| `markdownCapable`                      | `boolean`  | Markeert het kanaal als markdown-geschikt voor beslissingen over uitgaande opmaak. |
| `exposure`                             | `object`   | Zichtbaarheidsinstellingen voor kanalen voor setup, geconfigureerde lijsten en docsoppervlakken. |
| `quickstartAllowFrom`                  | `boolean`  | Schakelt dit kanaal in voor de standaard quickstart-setupflow `allowFrom`.     |
| `forceAccountBinding`                  | `boolean`  | Vereist expliciete accountkoppeling, zelfs wanneer er maar één account bestaat. |
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
- `docs`: markeer het kanaal als publiek zichtbaar in docs-/navigatieoppervlakken

<Note>
`showConfigured` en `showInSetup` blijven ondersteund als legacy aliassen. Geef de voorkeur aan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` is pakketmetadata, geen manifestmetadata.

| Veld                         | Type                                | Betekenis                                                                         |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Canonieke ClawHub-specificatie voor installatie/update en onboardingflows voor installatie op aanvraag. |
| `npmSpec`                    | `string`                            | Canonieke npm-specificatie voor fallbackflows voor installatie/update.            |
| `localPath`                  | `string`                            | Lokaal ontwikkelpad of gebundeld installatiepad.                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Voorkeursinstallatiebron wanneer meerdere bronnen beschikbaar zijn.               |
| `minHostVersion`             | `string`                            | Minimaal ondersteunde OpenClaw-versie in de vorm `>=x.y.z` of `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Verwachte npm-distintegriteitsstring, meestal `sha512-...`, voor gepinde installaties. |
| `allowInvalidConfigRecovery` | `boolean`                           | Laat herinstallatieflows voor gebundelde plugins herstellen van specifieke fouten door verouderde configuratie. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interactieve onboarding gebruikt ook `openclaw.install` voor oppervlakken voor installatie op aanvraag. Als je plugin provider-authkeuzes of kanaalsetup-/catalogusmetadata blootstelt voordat de runtime wordt geladen, kan onboarding die keuze tonen, vragen om ClawHub-, npm- of lokale installatie, de plugin installeren of inschakelen en daarna doorgaan met de geselecteerde flow. ClawHub-onboardingkeuzes gebruiken `clawhubSpec` en hebben de voorkeur wanneer ze aanwezig zijn; npm-keuzes vereisen vertrouwde catalogusmetadata met een registry-`npmSpec`; exacte versies en `expectedIntegrity` zijn optionele npm-pins. Als `expectedIntegrity` aanwezig is, dwingen installatie-/updateflows dit af voor npm. Bewaar de metadata voor "wat te tonen" in `openclaw.plugin.json` en de metadata voor "hoe het te installeren" in `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Als `minHostVersion` is ingesteld, dwingen zowel installatie als laden van niet-gebundelde manifestregisters dit af. Oudere hosts slaan externe plugins over; ongeldige versiestrings worden geweigerd. Aangenomen wordt dat gebundelde bronplugins dezelfde versie hebben als de host-checkout.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Voor gepinde npm-installaties bewaar je de exacte versie in `npmSpec` en voeg je de verwachte artifactintegriteit toe:

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
    `allowInvalidConfigRecovery` is geen algemene omzeiling voor kapotte configuraties. Het is alleen bedoeld voor smal herstel van gebundelde plugins, zodat herinstallatie/setup bekende restanten van upgrades kan repareren, zoals een ontbrekend pad naar een gebundelde plugin of een verouderde `channels.<id>`-entry voor diezelfde plugin. Als de configuratie om niet-gerelateerde redenen kapot is, faalt de installatie nog steeds gesloten en wordt de operator gevraagd `openclaw doctor --fix` uit te voeren.
  </Accordion>
</AccordionGroup>

### Uitgesteld volledig laden

Kanaalplugins kunnen kiezen voor uitgesteld laden met:

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

Als je setup-/volledige entry Gateway-RPC-methoden registreert, houd ze dan op een plugin-specifieke prefix. Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven eigendom van core en worden altijd opgelost naar `operator.admin`.

## Pluginmanifest

Elke native plugin moet een `openclaw.plugin.json` meeleveren in de pakketroot. OpenClaw gebruikt dit om configuratie te valideren zonder plugincode uit te voeren.

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

Voeg voor kanaalplugins `kind` en `channels` toe:

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

Zelfs plugins zonder configuratie moeten een schema meeleveren. Een leeg schema is geldig:

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

Gebruik voor pluginpakketten de pakketspecifieke ClawHub-opdracht:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
De verouderde publicatie-alias alleen voor skills is bedoeld voor skills. Plugin-pakketten moeten altijd `clawhub package publish` gebruiken.
</Note>

## Setup-entry

Het bestand `setup-entry.ts` is een lichtgewicht alternatief voor `index.ts` dat OpenClaw laadt wanneer het alleen setup-oppervlakken nodig heeft (onboarding, configuratiereparatie, inspectie van uitgeschakelde kanalen).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dit voorkomt dat zware runtime-code (cryptobibliotheken, CLI-registraties, achtergrondservices) wordt geladen tijdens setup-flows.

Gebundelde werkruimtekanelen die setup-veilige exports in sidecar-modules bewaren, kunnen `defineBundledChannelSetupEntry(...)` uit `openclaw/plugin-sdk/channel-entry-contract` gebruiken in plaats van `defineSetupPluginEntry(...)`. Dat gebundelde contract ondersteunt ook een optionele `runtime`-export, zodat runtime-bekabeling tijdens setup lichtgewicht en expliciet kan blijven.

<AccordionGroup>
  <Accordion title="Wanneer OpenClaw setupEntry gebruikt in plaats van de volledige entry">
    - Het kanaal is uitgeschakeld maar heeft setup-/onboarding-oppervlakken nodig.
    - Het kanaal is ingeschakeld maar niet geconfigureerd.
    - Uitgesteld laden is ingeschakeld (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Wat setupEntry moet registreren">
    - Het kanaal-Plugin-object (via `defineSetupPluginEntry`).
    - Alle HTTP-routes die nodig zijn voordat de gateway gaat luisteren.
    - Alle gateway-methoden die nodig zijn tijdens het opstarten.

    Die gateway-methoden voor het opstarten moeten nog steeds gereserveerde core-adminnamespaces zoals `config.*` of `update.*` vermijden.

  </Accordion>
  <Accordion title="Wat setupEntry NIET mag bevatten">
    - CLI-registraties.
    - Achtergrondservices.
    - Zware runtime-imports (crypto, SDK's).
    - Gateway-methoden die pas na het opstarten nodig zijn.

  </Accordion>
</AccordionGroup>

### Smalle setup-helperimports

Gebruik voor snelle paden die alleen voor setup zijn de smalle setup-helperkoppelingen in plaats van de bredere `plugin-sdk/setup`-paraplu wanneer je slechts een deel van het setup-oppervlak nodig hebt:

| Importpad                          | Gebruik het voor                                                                         | Belangrijkste exports                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-helpers voor setup die beschikbaar blijven in `setupEntry` / uitgestelde kanaalstart | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime`                      | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helpers voor setup-/installatie-CLI, archieven en docs                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Gebruik de bredere `plugin-sdk/setup`-koppeling wanneer je de volledige gedeelde setup-toolbox wilt, inclusief configuratiepatch-helpers zoals `moveSingleAccountChannelSectionToDefaultAccount(...)`.

De setup-patchadapters blijven veilig om te importeren op hot paths. Hun gebundelde single-account-promotiecontract-oppervlaklookup is lazy, dus het importeren van `plugin-sdk/setup-runtime` laadt gebundelde contract-oppervlakdetectie niet meteen voordat de adapter daadwerkelijk wordt gebruikt.

### Kanaal-eigen single-account-promotie

Wanneer een kanaal upgradet van een top-level configuratie met één account naar `channels.<id>.accounts.*`, is het standaard gedeelde gedrag om gepromoveerde account-scoped waarden naar `accounts.default` te verplaatsen.

Gebundelde kanalen kunnen die promotie verfijnen of overschrijven via hun setup-contractoppervlak:

- `singleAccountKeysToMove`: extra top-level keys die naar het gepromoveerde account moeten worden verplaatst
- `namedAccountPromotionKeys`: wanneer benoemde accounts al bestaan, worden alleen deze keys naar het gepromoveerde account verplaatst; gedeelde beleids-/delivery-keys blijven op de kanaalroot
- `resolveSingleAccountPromotionTarget(...)`: kies welk bestaand account gepromoveerde waarden ontvangt

<Note>
Matrix is het huidige gebundelde voorbeeld. Als er precies één benoemd Matrix-account al bestaat, of als `defaultAccount` naar een bestaande niet-canonieke key zoals `Ops` wijst, behoudt de promotie dat account in plaats van een nieuwe `accounts.default`-vermelding te maken.
</Note>

## Configuratieschema

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

Gebruik `buildChannelConfigSchema` om een Zod-schema om te zetten naar de `ChannelConfigSchema`-wrapper die wordt gebruikt door configuratieartefacten die eigendom zijn van plugins:

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

Als je het contract al als JSON Schema of TypeBox schrijft, gebruik dan de directe helper zodat OpenClaw Zod-naar-JSON-Schema-conversie op metadatapaden kan overslaan:

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

Voor plugins van derden blijft het cold-path-contract het Plugin-manifest: spiegel het gegenereerde JSON Schema naar `openclaw.plugin.json#channelConfigs`, zodat configuratieschema-, setup- en UI-oppervlakken `channels.<id>` kunnen inspecteren zonder runtime-code te laden.

## Setup-wizards

Kanaalplugins kunnen interactieve setup-wizards bieden voor `openclaw onboard`. De wizard is een `ChannelSetupWizard`-object op de `ChannelPlugin`:

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

Het type `ChannelSetupWizard` ondersteunt `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` en meer. Bekijk gebundelde Plugin-pakketten (bijvoorbeeld de Discord-Plugin `src/channel.setup.ts`) voor volledige voorbeelden.

<AccordionGroup>
  <Accordion title="Gedeelde allowFrom-prompts">
    Geef voor DM-allowlistprompts die alleen de standaardflow `note -> prompt -> parse -> merge -> patch` nodig hebben de voorkeur aan de gedeelde setup-helpers uit `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` en `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standaard kanaalsetupstatus">
    Geef voor kanaalsetupstatusblokken die alleen verschillen in labels, scores en optionele extra regels de voorkeur aan `createStandardChannelSetupStatus(...)` uit `openclaw/plugin-sdk/setup` in plaats van hetzelfde `status`-object in elke Plugin handmatig te schrijven.
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

    `plugin-sdk/channel-setup` exposeert ook de lagere-niveau builders `createOptionalChannelSetupAdapter(...)` en `createOptionalChannelSetupWizard(...)` wanneer je slechts één helft van dat optionele installatie-oppervlak nodig hebt.

    De gegenereerde optionele adapter/wizard faalt gesloten bij echte configuratieschrijfacties. Ze hergebruiken één installatie-vereistbericht voor `validateInput`, `applyAccountConfig` en `finalize`, en voegen een docs-link toe wanneer `docsPath` is ingesteld.

  </Accordion>
  <Accordion title="Binary-backed setup-helpers">
    Geef voor binary-backed setup-UI's de voorkeur aan de gedeelde gedelegeerde helpers in plaats van dezelfde binary-/statuslijm naar elk kanaal te kopiëren:

    - `createDetectedBinaryStatus(...)` voor statusblokken die alleen verschillen in labels, hints, scores en binary-detectie
    - `createCliPathTextInput(...)` voor pad-backed tekstinvoer
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` en `createDelegatedResolveConfigured(...)` wanneer `setupEntry` lazy moet doorsturen naar een zwaardere volledige wizard
    - `createDelegatedTextInputShouldPrompt(...)` wanneer `setupEntry` alleen een beslissing voor `textInputs[*].shouldPrompt` hoeft te delegeren

  </Accordion>
</AccordionGroup>

## Publiceren en installeren

**Externe plugins:** publiceer naar [ClawHub](/nl/clawhub) en installeer daarna:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Kale pakketspecificaties installeren vanuit npm tijdens de launch-cutover.

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

**Plugins in de repo:** plaats ze onder de gebundelde Plugin-workspacemappenstructuur; ze worden tijdens het bouwen automatisch ontdekt.

**Gebruikers kunnen installeren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Voor installaties vanuit npm installeert `openclaw plugins install` het pakket onder `~/.openclaw/npm` met lifecycle-scripts uitgeschakeld. Houd afhankelijkheidsstructuren van Plugins zuiver JS/TS en vermijd pakketten die `postinstall`-builds vereisen.
</Info>

<Note>
Het opstarten van de Gateway installeert geen Plugin-afhankelijkheden. npm/git/ClawHub-installatiestromen zijn eigenaar van convergentie van afhankelijkheden; lokale Plugins moeten hun afhankelijkheden al geinstalleerd hebben.
</Note>

Gebundelde pakketmetadata is expliciet en wordt niet afgeleid uit gebouwde JavaScript bij het opstarten van de Gateway. Runtime-afhankelijkheden horen thuis in het Plugin-pakket dat er eigenaar van is; het opstarten van verpakte OpenClaw repareert of spiegelt Plugin-afhankelijkheden nooit.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — stapsgewijze gids om aan de slag te gaan
- [Plugin-manifest](/nl/plugins/manifest) — volledige referentie voor het manifestschema
- [SDK-entrypoints](/nl/plugins/sdk-entrypoints) — `definePluginEntry` en `defineChannelPluginEntry`
