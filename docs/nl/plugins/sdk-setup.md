---
read_when:
    - Je voegt een installatiewizard toe aan een Plugin
    - Je moet setup-entry.ts versus index.ts begrijpen
    - Je definieert pluginconfiguratieschema's of openclaw-metadata in package.json
sidebarTitle: Setup and config
summary: Installatiewizards, setup-entry.ts, configuratieschema's en package.json-metadata
title: Plugin-installatie en configuratie
x-i18n:
    generated_at: "2026-06-27T18:07:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referentie voor Plugin-verpakking (`package.json`-metadata), manifests (`openclaw.plugin.json`), setupvermeldingen en configuratieschema's.

<Tip>
**Op zoek naar een stapsgewijze uitleg?** De how-to-gidsen behandelen verpakking in context: [Kanaalplugins](/nl/plugins/sdk-channel-plugins#step-1-package-and-manifest) en [Providerplugins](/nl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Pakketmetadata

Je `package.json` heeft een `openclaw`-veld nodig dat het Plugin-systeem vertelt wat je plugin biedt:

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
Als je de Plugin extern publiceert op ClawHub, zijn die `compat`- en `build`-velden verplicht. De canonieke publicatiesnippets staan in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-velden

<ParamField path="extensions" type="string[]">
  Entry point-bestanden (relatief ten opzichte van de pakketroot).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lichte entry die alleen voor setup wordt gebruikt (optioneel).
</ParamField>
<ParamField path="channel" type="object">
  Kanaalcatalogusmetadata voor setup, picker, quickstart en statusoppervlakken.
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

| Veld                                   | Type       | Wat het betekent                                                                   |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `id`                                   | `string`   | Canonieke kanaal-id.                                                               |
| `label`                                | `string`   | Primair kanaallabel.                                                               |
| `selectionLabel`                       | `string`   | Picker-/setuplabel wanneer dit moet afwijken van `label`.                         |
| `detailLabel`                          | `string`   | Secundair detaillabel voor rijkere kanaalcatalogi en statusoppervlakken.           |
| `docsPath`                             | `string`   | Documentatiepad voor setup- en selectielinks.                                      |
| `docsLabel`                            | `string`   | Overschrijvend label voor documentatielinks wanneer dit moet afwijken van de kanaal-id. |
| `blurb`                                | `string`   | Korte onboarding-/catalogusbeschrijving.                                           |
| `order`                                | `number`   | Sorteervolgorde in kanaalcatalogi.                                                 |
| `aliases`                              | `string[]` | Extra lookup-aliassen voor kanaalselectie.                                         |
| `preferOver`                           | `string[]` | Plugin-/kanaal-id's met lagere prioriteit waar dit kanaal boven moet staan.        |
| `systemImage`                          | `string`   | Optionele pictogram-/system-image-naam voor kanaal-UI-catalogi.                    |
| `selectionDocsPrefix`                  | `string`   | Prefixtekst vóór documentatielinks in selectieoppervlakken.                        |
| `selectionDocsOmitLabel`               | `boolean`  | Toon het documentatiepad direct in plaats van een gelabelde documentatielink in selectietekst. |
| `selectionExtras`                      | `string[]` | Extra korte strings die aan selectietekst worden toegevoegd.                       |
| `markdownCapable`                      | `boolean`  | Markeert het kanaal als geschikt voor markdown voor beslissingen over uitgaande opmaak. |
| `exposure`                             | `object`   | Zichtbaarheidsregelaars voor setup, geconfigureerde lijsten en documentatieoppervlakken. |
| `quickstartAllowFrom`                  | `boolean`  | Laat dit kanaal deelnemen aan de standaard quickstart-setupflow `allowFrom`.       |
| `forceAccountBinding`                  | `boolean`  | Vereis expliciete accountkoppeling, zelfs wanneer er maar één account bestaat.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Geef de voorkeur aan sessielookup bij het oplossen van aankondigingsdoelen voor dit kanaal. |

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
- `setup`: neem het kanaal op in interactieve setup-/configureerpickers
- `docs`: markeer het kanaal als publiek zichtbaar in documentatie-/navigatieoppervlakken

<Note>
`showConfigured` en `showInSetup` blijven ondersteund als legacy aliassen. Geef de voorkeur aan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` is pakketmetadata, geen manifestmetadata.

| Veld                         | Type                                | Wat het betekent                                                                        |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Canonieke ClawHub-specificatie voor installatie/update en onboardingflows voor installeren op aanvraag. |
| `npmSpec`                    | `string`                            | Canonieke npm-specificatie voor fallbackflows voor installatie/update.                  |
| `localPath`                  | `string`                            | Lokaal ontwikkelingspad of gebundeld installatiepad.                                    |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Voorkeursinstallatiebron wanneer meerdere bronnen beschikbaar zijn.                     |
| `minHostVersion`             | `string`                            | Minimaal ondersteunde OpenClaw-versie in de vorm `>=x.y.z` of `>=x.y.z-prerelease`.     |
| `expectedIntegrity`          | `string`                            | Verwachte npm dist-integriteitsstring, meestal `sha512-...`, voor gepinde installaties. |
| `allowInvalidConfigRecovery` | `boolean`                           | Laat herinstallatieflows voor gebundelde Plugins herstellen van specifieke fouten door verouderde configuratie. |
| `requiredPlatformPackages`   | `string[]`                          | Vereiste platformspecifieke npm-aliassen die tijdens npm-installatie worden gecontroleerd. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interactieve onboarding gebruikt ook `openclaw.install` voor oppervlakken voor installeren op aanvraag. Als je Plugin provider-authkeuzes of kanaalsetup-/catalogusmetadata blootlegt voordat de runtime laadt, kan onboarding die keuze tonen, vragen om installatie via ClawHub, npm of lokaal, de Plugin installeren of inschakelen en daarna doorgaan met de geselecteerde flow. ClawHub-onboardingkeuzes gebruiken `clawhubSpec` en hebben de voorkeur wanneer aanwezig; npm-keuzes vereisen vertrouwde catalogusmetadata met een registry-`npmSpec`; exacte versies en `expectedIntegrity` zijn optionele npm-pins. Als `expectedIntegrity` aanwezig is, dwingen installatie-/updateflows dit af voor npm. Bewaar de metadata over "wat te tonen" in `openclaw.plugin.json` en de metadata over "hoe het te installeren" in `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Als `minHostVersion` is ingesteld, dwingen zowel installatie als het laden van niet-gebundelde manifestregistries dit af. Oudere hosts slaan externe Plugins over; ongeldige versiestrings worden geweigerd. Gebundelde bronplugins worden verondersteld mee te zijn geversioneerd met de hostcheckout.
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
    `allowInvalidConfigRecovery` is geen algemene bypass voor defecte configuraties. Het is alleen bedoeld voor beperkt herstel van gebundelde Plugins, zodat herinstallatie/setup bekende overblijfselen van upgrades kan repareren, zoals een ontbrekend pad voor een gebundelde Plugin of een verouderde `channels.<id>`-vermelding voor diezelfde Plugin. Als de configuratie om niet-gerelateerde redenen defect is, faalt installatie nog steeds gesloten en vertelt het de operator `openclaw doctor --fix` uit te voeren.
  </Accordion>
</AccordionGroup>

### Uitgestelde volledige laadactie

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

Wanneer dit is ingeschakeld, laadt OpenClaw tijdens de pre-listen-opstartfase alleen `setupEntry`, zelfs voor kanalen die al zijn geconfigureerd. De volledige entry laadt nadat de Gateway begint te luisteren.

<Warning>
Schakel uitgesteld laden alleen in wanneer je `setupEntry` alles registreert wat de Gateway nodig heeft voordat die begint te luisteren (kanaalregistratie, HTTP-routes, Gateway-methoden). Als de volledige entry vereiste opstartcapaciteiten bezit, behoud dan het standaardgedrag.
</Warning>

Als je setup-/volledige entry Gateway-RPC-methoden registreert, houd ze dan op een Plugin-specifieke prefix. Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven eigendom van core en lossen altijd op naar `operator.admin`.

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

Zelfs Plugins zonder configuratie moeten een schema leveren. Een leeg schema is geldig:

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

## Publiceren naar ClawHub

Gebruik voor Plugin-pakketten de pakketspecifieke ClawHub-opdracht:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
De verouderde publicatiealias alleen voor Skills is bedoeld voor Skills. Plugin-pakketten moeten altijd `clawhub package publish` gebruiken.
</Note>

## Setup-entry

Het bestand `setup-entry.ts` is een lichtgewicht alternatief voor `index.ts` dat OpenClaw laadt wanneer het alleen setup-oppervlakken nodig heeft (onboarding, configuratieherstel, inspectie van uitgeschakelde kanalen).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dit voorkomt dat zware runtimecode (cryptobibliotheken, CLI-registraties, achtergrondservices) wordt geladen tijdens setup-flows.

Gebundelde workspace-kanalen die setup-veilige exports in sidecar-modules bewaren, kunnen `defineBundledChannelSetupEntry(...)` uit `openclaw/plugin-sdk/channel-entry-contract` gebruiken in plaats van `defineSetupPluginEntry(...)`. Dat gebundelde contract ondersteunt ook een optionele `runtime`-export, zodat runtime-bedrading tijdens setup lichtgewicht en expliciet kan blijven.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Het kanaal is uitgeschakeld maar heeft setup-/onboarding-oppervlakken nodig.
    - Het kanaal is ingeschakeld maar niet geconfigureerd.
    - Uitgesteld laden is ingeschakeld (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - Het kanaal-Plugin-object (via `defineSetupPluginEntry`).
    - Alle HTTP-routes die nodig zijn voordat de gateway luistert.
    - Alle gateway-methoden die nodig zijn tijdens het opstarten.

    Die gateway-methoden voor het opstarten moeten nog steeds gereserveerde core-beheernamespaces vermijden, zoals `config.*` of `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - CLI-registraties.
    - Achtergrondservices.
    - Zware runtime-imports (crypto, SDK's).
    - Gateway-methoden die alleen na het opstarten nodig zijn.

  </Accordion>
</AccordionGroup>

### Smalle imports voor setuphelpers

Geef voor hete paden die alleen setup gebruiken de voorkeur aan de smalle seams voor setuphelpers boven de bredere paraplu `plugin-sdk/setup` wanneer je slechts een deel van het setup-oppervlak nodig hebt:

| Importpad                         | Gebruik hiervoor                                                                         | Belangrijkste exports                                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtimehelpers voor setup-tijd die beschikbaar blijven in `setupEntry` / uitgestelde kanaalstart | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime`                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                |
| `plugin-sdk/setup-tools`           | helpers voor setup-/installatie-CLI/archief/docs                                          | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                        |

Gebruik de bredere seam `plugin-sdk/setup` wanneer je de volledige gedeelde setup-toolbox wilt, inclusief helpers voor configuratiepatches zoals `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gebruik `createSetupTranslator(...)` voor vaste tekst in setupwizards. Deze volgt de
locale van de CLI-wizard (`OPENCLAW_LOCALE`, daarna systeemlocalevariabelen) en valt
terug op Engels. Houd Plugin-specifieke setuptekst in code die eigendom is van de Plugin en gebruik
gedeelde catalogussleutels alleen voor algemene setuplabels, statustekst en officiële
setuptekst voor gebundelde Plugins.

De setup-patchadapters blijven importveilig voor hete paden. Hun gebundelde lookup van het contractoppervlak voor promotie van één account is lazy, dus het importeren van `plugin-sdk/setup-runtime` laadt de discovery van gebundelde contractoppervlakken niet eager voordat de adapter daadwerkelijk wordt gebruikt.

### Kanaaleigen promotie van één account

Wanneer een kanaal upgradet van een top-level configuratie met één account naar `channels.<id>.accounts.*`, is het standaard gedeelde gedrag dat gepromoveerde account-scoped waarden naar `accounts.default` worden verplaatst.

Gebundelde kanalen kunnen die promotie versmallen of overschrijven via hun setup-contractoppervlak:

- `singleAccountKeysToMove`: extra top-level sleutels die naar het gepromoveerde account moeten worden verplaatst
- `namedAccountPromotionKeys`: wanneer named accounts al bestaan, worden alleen deze sleutels naar het gepromoveerde account verplaatst; gedeelde beleids-/delivery-sleutels blijven op de kanaalroot
- `resolveSingleAccountPromotionTarget(...)`: kies welk bestaand account gepromoveerde waarden ontvangt

<Note>
Matrix is het huidige gebundelde voorbeeld. Als er al precies één named Matrix-account bestaat, of als `defaultAccount` naar een bestaande niet-canonieke sleutel zoals `Ops` wijst, behoudt promotie dat account in plaats van een nieuwe vermelding `accounts.default` te maken.
</Note>

## Configuratieschema

Plugin-configuratie wordt gevalideerd tegen het JSON Schema in je manifest. Gebruikers configureren Plugins via:

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

Gebruik `buildChannelConfigSchema` om een Zod-schema om te zetten naar de `ChannelConfigSchema`-wrapper die wordt gebruikt door configuratie-artefacten die eigendom zijn van Plugins:

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

Voor Plugins van derden blijft het cold-path-contract het Plugin-manifest: spiegel het gegenereerde JSON Schema naar `openclaw.plugin.json#channelConfigs`, zodat configuratieschema-, setup- en UI-oppervlakken `channels.<id>` kunnen inspecteren zonder runtimecode te laden.

## Setupwizards

Kanaal-Plugins kunnen interactieve setupwizards leveren voor `openclaw onboard`. De wizard is een `ChannelSetupWizard`-object op de `ChannelPlugin`:

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

Het type `ChannelSetupWizard` ondersteunt `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` en meer. Zie gebundelde Plugin-pakketten (bijvoorbeeld de Discord-Plugin `src/channel.setup.ts`) voor volledige voorbeelden.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    Geef voor DM-allowlist-prompts die alleen de standaardflow `note -> prompt -> parse -> merge -> patch` nodig hebben de voorkeur aan de gedeelde setuphelpers uit `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` en `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Geef voor statusblokken voor kanaalsetup die alleen verschillen in labels, scores en optionele extra regels de voorkeur aan `createStandardChannelSetupStatus(...)` uit `openclaw/plugin-sdk/setup` in plaats van hetzelfde `status`-object met de hand in elke Plugin te bouwen.
  </Accordion>
  <Accordion title="Optional channel setup surface">
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

    `plugin-sdk/channel-setup` stelt ook de lower-level builders `createOptionalChannelSetupAdapter(...)` en `createOptionalChannelSetupWizard(...)` beschikbaar wanneer je slechts één helft van dat optionele installatieoppervlak nodig hebt.

    De gegenereerde optionele adapter/wizard failen closed bij echte configuratieschrijfacties. Ze hergebruiken één bericht dat installatie vereist is voor `validateInput`, `applyAccountConfig` en `finalize`, en voegen een docs-link toe wanneer `docsPath` is ingesteld.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Geef voor setup-UI's met binaire ondersteuning de voorkeur aan de gedeelde gedelegeerde helpers in plaats van dezelfde binary-/statuslijm naar elk kanaal te kopiëren:

    - `createDetectedBinaryStatus(...)` voor statusblokken die alleen verschillen in labels, hints, scores en binaire detectie
    - `createCliPathTextInput(...)` voor tekstinvoer die door een pad wordt ondersteund
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

    Pakketspecificaties zonder prefix worden tijdens de overgang bij lancering vanaf npm geïnstalleerd.

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

**Plugins in de repo:** plaats ze onder de gebundelde plugin-werkruimteboom en ze worden automatisch ontdekt tijdens de build.

**Gebruikers kunnen installeren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Voor installaties vanuit npm installeert `openclaw plugins install` het pakket in een project per plugin onder `~/.openclaw/npm/projects`, met levenscyclusscripts uitgeschakeld. Houd afhankelijkheidsbomen van plugins puur JS/TS en vermijd pakketten die `postinstall`-builds vereisen.
</Info>

<Note>
Het opstarten van de Gateway installeert geen plugin-afhankelijkheden. npm/git/ClawHub-installatiestromen zijn verantwoordelijk voor convergentie van afhankelijkheden; lokale plugins moeten hun afhankelijkheden al geïnstalleerd hebben.
</Note>

Gebundelde pakketmetadata is expliciet en wordt niet afgeleid uit gebouwde JavaScript bij het opstarten van de Gateway. Runtime-afhankelijkheden horen thuis in het plugin-pakket dat ze bezit; het opstarten van verpakte OpenClaw repareert of spiegelt plugin-afhankelijkheden nooit.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — stapsgewijze handleiding om aan de slag te gaan
- [Plugin-manifest](/nl/plugins/manifest) — volledige schemareferentie voor het manifest
- [SDK-toegangspunten](/nl/plugins/sdk-entrypoints) — `definePluginEntry` en `defineChannelPluginEntry`
