---
read_when:
    - Je voegt een installatiewizard toe aan een plugin
    - Je moet het verschil tussen setup-entry.ts en index.ts begrijpen
    - U definieert configuratieschema's voor Plugins of OpenClaw-metadata in package.json
sidebarTitle: Setup and config
summary: Installatiewizards, setup-entry.ts, configuratieschema's en package.json-metadata
title: Plugin-installatie en -configuratie
x-i18n:
    generated_at: "2026-07-12T09:15:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referentie voor Plugin-packaging (`package.json`-metadata), manifests (`openclaw.plugin.json`), setup-ingangen en configuratieschema's.

<Tip>
**Op zoek naar een stapsgewijze handleiding?** De praktische handleidingen behandelen packaging in context: [Kanaalplugins](/nl/plugins/sdk-channel-plugins#step-1-package-and-manifest) en [Providerplugins](/nl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Pakketmetadata

Je `package.json` heeft een `openclaw`-veld nodig dat het pluginsysteem vertelt wat je Plugin biedt:

<Tabs>
  <Tab title="Kanaalplugin">
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
  <Tab title="Providerplugin / ClawHub-basisconfiguratie">
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
Extern publiceren op ClawHub vereist `compat` en `build`. De canonieke publicatiefragmenten staan in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-velden

<ParamField path="extensions" type="string[]">
  Ingangspuntbestanden (relatief aan de pakketroot). Geldige broningangen voor ontwikkeling in een workspace en Git-checkout.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Gebouwde JavaScript-tegenhangers voor `extensions`, waaraan de voorkeur wordt gegeven wanneer OpenClaw een geïnstalleerd npm-pakket laadt. Zie [SDK-ingangspunten](/nl/plugins/sdk-entrypoints) voor de oplossingsvolgorde voor bron- en gebouwde bestanden.
</ParamField>
<ParamField path="setupEntry" type="string">
  Lichtgewicht ingang uitsluitend voor setup (optioneel).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Gebouwde JavaScript-tegenhanger voor `setupEntry`. Vereist dat `setupEntry` ook is ingesteld.
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }`-terugvalidentiteit voor de Plugin, gebruikt wanneer een Plugin geen kanaal- of providermetadata heeft waaruit een id of label kan worden afgeleid.
</ParamField>
<ParamField path="channel" type="object">
  Kanaalcatalogusmetadata voor setup, keuzelijsten, snelstart en statusweergaven.
</ParamField>
<ParamField path="install" type="object">
  Installatieaanwijzingen: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Vlaggen voor opstartgedrag.
</ParamField>
<ParamField path="compat" type="object">
  `pluginApi`-versiebereik dat deze Plugin ondersteunt. Vereist voor externe publicaties op ClawHub.
</ParamField>

<Note>
Provider-id's (`providers: string[]`) zijn manifestmetadata, geen pakketmetadata. Declareer ze in `openclaw.plugin.json`, niet hier — zie [Pluginmanifest](/nl/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` is lichtgewicht pakketmetadata voor kanaaldetectie en setupweergaven voordat de runtime wordt geladen.

| Veld                                   | Type       | Betekenis                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Canonieke kanaal-id.                                                          |
| `label`                                | `string`   | Primair kanaallabel.                                                          |
| `selectionLabel`                       | `string`   | Keuze-/setuplabel wanneer dit van `label` moet verschillen.                   |
| `detailLabel`                          | `string`   | Secundair detaillabel voor uitgebreidere kanaalcatalogi en statusweergaven.   |
| `docsPath`                             | `string`   | Documentatiepad voor setup- en selectielinks.                                 |
| `docsLabel`                            | `string`   | Alternatief label voor documentatielinks wanneer dit van de kanaal-id moet verschillen. |
| `blurb`                                | `string`   | Korte beschrijving voor onboarding/catalogus.                                 |
| `order`                                | `number`   | Sorteervolgorde in kanaalcatalogi.                                             |
| `aliases`                              | `string[]` | Extra opzoekaliassen voor kanaalselectie.                                      |
| `preferOver`                           | `string[]` | Plugin-/kanaal-id's met lagere prioriteit waar dit kanaal boven moet staan.   |
| `systemImage`                          | `string`   | Optionele pictogram-/systeemafbeeldingsnaam voor kanaalcatalogi in de gebruikersinterface. |
| `selectionDocsPrefix`                  | `string`   | Voorvoegseltekst vóór documentatielinks in selectieweergaven.                 |
| `selectionDocsOmitLabel`               | `boolean`  | Toon het documentatiepad rechtstreeks in plaats van een gelabelde documentatielink in selectietekst. |
| `selectionExtras`                      | `string[]` | Extra korte tekenreeksen die aan de selectietekst worden toegevoegd.          |
| `markdownCapable`                      | `boolean`  | Markeert het kanaal als geschikt voor Markdown voor beslissingen over uitgaande opmaak. |
| `exposure`                             | `object`   | Zichtbaarheidsinstellingen voor het kanaal in setup, geconfigureerde lijsten en documentatieweergaven. |
| `quickstartAllowFrom`                  | `boolean`  | Neemt dit kanaal op in de standaard snelstartprocedure voor `allowFrom`-setup. |
| `forceAccountBinding`                  | `boolean`  | Vereist expliciete accountkoppeling, zelfs wanneer er maar één account bestaat. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Geeft de voorkeur aan sessieopzoeking bij het bepalen van aankondigingsdoelen voor dit kanaal. |

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

- `configured`: neem het kanaal op in geconfigureerde lijsten en statusachtige weergaven
- `setup`: neem het kanaal op in interactieve setup-/configuratiekeuzelijsten
- `docs`: markeer het kanaal als publiek zichtbaar in documentatie- en navigatieweergaven

<Note>
`showConfigured` en `showInSetup` blijven ondersteund als verouderde aliassen. Geef de voorkeur aan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` is pakketmetadata, geen manifestmetadata.

| Veld                         | Type                                | Betekenis                                                                         |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Canonieke ClawHub-specificatie voor installatie/update en onboardingprocedures voor installatie op aanvraag. |
| `npmSpec`                    | `string`                            | Canonieke npm-specificatie voor terugvalprocedures bij installatie/update.        |
| `localPath`                  | `string`                            | Lokaal ontwikkelpad of gebundeld installatiepad.                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Voorkeursinstallatiebron wanneer meerdere bronnen beschikbaar zijn.               |
| `minHostVersion`             | `string`                            | Minimaal ondersteunde OpenClaw-versie, `>=x.y.z` of `>=x.y.z-prerelease`.         |
| `expectedIntegrity`          | `string`                            | Verwachte integriteitstekenreeks van de npm-distributie, doorgaans `sha512-...`, voor vastgezette installaties. |
| `allowInvalidConfigRecovery` | `boolean`                           | Laat herinstallatieprocedures voor gebundelde plugins herstellen van specifieke fouten door verouderde configuratie. |
| `requiredPlatformPackages`   | `string[]`                          | Vereiste platformspecifieke npm-aliassen die tijdens de npm-installatie worden geverifieerd. |

<AccordionGroup>
  <Accordion title="Onboardinggedrag">
    Interactieve onboarding gebruikt `openclaw.install` voor installatie-op-aanvraagweergaven: als je Plugin providerverificatiekeuzes of metadata voor kanaalsetup/-catalogus beschikbaar stelt voordat de runtime wordt geladen, kan onboarding vragen om installatie via ClawHub, npm of een lokale bron, de Plugin installeren of inschakelen en daarna de geselecteerde procedure voortzetten. ClawHub-keuzes gebruiken `clawhubSpec` en krijgen de voorkeur wanneer deze aanwezig is; npm-keuzes vereisen vertrouwde catalogusmetadata met een register-`npmSpec` (exacte versies en `expectedIntegrity` zijn optionele vastzettingen die bij installatie/update worden afgedwongen wanneer ze zijn ingesteld). Bewaar "wat moet worden weergegeven" in `openclaw.plugin.json` en "hoe het moet worden geïnstalleerd" in `package.json`.
  </Accordion>
  <Accordion title="Handhaving van minHostVersion">
    Als `minHostVersion` is ingesteld, wordt deze zowel bij installatie als bij het laden van niet-gebundelde manifestregisters afgedwongen. Oudere hosts slaan externe plugins over; ongeldige versietekenreeksen worden geweigerd. Van gebundelde bronplugins wordt aangenomen dat ze dezelfde versie hebben als de host-checkout.
  </Accordion>
  <Accordion title="Vastgezette npm-installaties">
    Bewaar voor vastgezette npm-installaties de exacte versie in `npmSpec` en voeg de verwachte artefactintegriteit toe:

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
    `allowInvalidConfigRecovery` is geen algemene omzeiling voor defecte configuraties. Het is uitsluitend bedoeld voor beperkt herstel van gebundelde plugins, zodat herinstallatie/setup bekende restanten van upgrades kan herstellen, zoals een ontbrekend pad naar een gebundelde Plugin of een verouderde `channels.<id>`-ingang voor diezelfde Plugin. Als de configuratie om andere redenen defect is, mislukt de installatie nog steeds veilig en krijgt de beheerder de instructie om `openclaw doctor --fix` uit te voeren.
  </Accordion>
</AccordionGroup>

### Uitgesteld volledig laden

Kanaalplugins kunnen uitgesteld laden inschakelen met:

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

Wanneer dit is ingeschakeld, laadt OpenClaw tijdens de opstartfase vóór het luisteren alleen `setupEntry`, zelfs voor reeds geconfigureerde kanalen. De volledige ingang wordt geladen nadat de Gateway begint te luisteren.

<Warning>
Schakel uitgesteld laden alleen in wanneer je `setupEntry` alles registreert wat de Gateway nodig heeft voordat deze begint te luisteren (kanaalregistratie, HTTP-routes, Gateway-methoden). Als de volledige ingang vereiste opstartmogelijkheden beheert, behoud dan het standaardgedrag.
</Warning>

Als je setup-/volledige ingang Gateway-RPC-methoden registreert, plaats deze dan onder een Plugin-specifiek voorvoegsel. Gereserveerde beheerdersnaamruimten van de kern (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven eigendom van de kern en worden altijd genormaliseerd naar `operator.admin`.

## Pluginmanifest

Elke native Plugin moet een `openclaw.plugin.json` in de hoofdmap van het pakket bevatten. OpenClaw gebruikt dit om de configuratie te valideren zonder Plugincode uit te voeren.

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

Voeg voor kanaal-Plugins `channels` toe (en voor provider-Plugins `providers`):

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

Zelfs Plugins zonder configuratie moeten een schema bevatten. Een leeg schema is geldig:

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

Skills en Pluginpakketten gebruiken afzonderlijke ClawHub-publicatieopdrachten. Gebruik voor Pluginpakketten de pakketspecifieke opdracht:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` is een andere opdracht voor het publiceren van een Skillmap, niet van een Pluginpakket. Zie [Publiceren op ClawHub](/nl/clawhub/publishing).
</Note>

## Setup-ingangspunt

`setup-entry.ts` is een lichtgewicht alternatief voor `index.ts` dat OpenClaw laadt wanneer alleen setup-oppervlakken nodig zijn (onboarding, configuratieherstel, inspectie van uitgeschakelde kanalen):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Hierdoor wordt tijdens setupstromen geen zware runtimecode geladen (cryptografische bibliotheken, CLI-registraties, achtergrondservices).

Gebundelde workspace-kanalen die setup-veilige exports in nevenmodules bewaren, kunnen `defineBundledChannelSetupEntry(...)` uit `openclaw/plugin-sdk/channel-entry-contract` gebruiken in plaats van `defineSetupPluginEntry(...)`. Dat gebundelde contract ondersteunt ook een optionele `runtime`-export, zodat runtimebedrading tijdens de setup lichtgewicht en expliciet kan blijven.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Het kanaal is uitgeschakeld, maar heeft setup- of onboarding-oppervlakken nodig.
    - Het kanaal is ingeschakeld, maar niet geconfigureerd.
    - Uitgesteld laden is ingeschakeld (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - Het kanaal-Pluginobject (via `defineSetupPluginEntry`).
    - Alle HTTP-routes die nodig zijn voordat de Gateway begint te luisteren.
    - Alle Gateway-methoden die tijdens het opstarten nodig zijn.

    Deze Gateway-methoden voor het opstarten moeten nog steeds gereserveerde beheerdersnaamruimten van de kern vermijden, zoals `config.*` of `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - CLI-registraties.
    - Achtergrondservices.
    - Zware runtime-imports (cryptografie, SDK's).
    - Gateway-methoden die pas na het opstarten nodig zijn.

  </Accordion>
</AccordionGroup>

### Gerichte imports van setuphelpers

Geef voor intensief gebruikte paden die alleen voor setup dienen de voorkeur aan de gerichte setuphelperkoppelingen boven de bredere overkoepelende `plugin-sdk/setup`-koppeling wanneer je slechts een deel van het setup-oppervlak nodig hebt:

| Importpad                          | Gebruik hiervoor                                                                           | Belangrijkste exports                                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtimehelpers voor setup die beschikbaar blijven in `setupEntry` / uitgesteld kanaalopstarten | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime`                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | CLI-, archief- en documentatiehelpers voor setup/installatie                                | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Gebruik de bredere `plugin-sdk/setup`-koppeling wanneer je de volledige gedeelde set setupgereedschappen wilt, inclusief helpers voor configuratiepatches zoals `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gebruik `createSetupTranslator(...)` voor vaste tekst in de setupwizard. Deze volgt de landinstelling van de CLI-wizard (`OPENCLAW_LOCALE`, daarna de systeemvariabelen voor de landinstelling) en valt terug op Engels. Bewaar Pluginspecifieke setuptekst in code die eigendom is van de Plugin en gebruik gedeelde catalogussleutels alleen voor algemene setuplabels, statustekst en setuptekst van officiële gebundelde Plugins.

De adapters voor setup-patches blijven bij import veilig voor intensief gebruikte paden. Het opzoeken van het gebundelde contractoppervlak voor promotie van één account gebeurt lui, zodat het importeren van `plugin-sdk/setup-runtime` de detectie van gebundelde contractoppervlakken niet voortijdig laadt voordat de adapter daadwerkelijk wordt gebruikt.

### Kanaalgestuurde promotie van één account

Wanneer een kanaal wordt bijgewerkt van een configuratie met één account op het hoogste niveau naar `channels.<id>.accounts.*`, verplaatst het standaard gedeelde gedrag gepromoveerde accountgebonden waarden naar `accounts.default`.

Gebundelde kanalen kunnen die promotie beperken of overschrijven via hun setupcontractoppervlak:

- `singleAccountKeysToMove`: aanvullende sleutels op het hoogste niveau die naar het gepromoveerde account moeten worden verplaatst
- `namedAccountPromotionKeys`: wanneer benoemde accounts al bestaan, worden alleen deze sleutels naar het gepromoveerde account verplaatst; gedeelde beleids- en afleveringssleutels blijven in de kanaalhoofdstructuur
- `resolveSingleAccountPromotionTarget(...)`: kies welk bestaand account de gepromoveerde waarden ontvangt

<Note>
Matrix is het huidige gebundelde voorbeeld. Als er precies één benoemd Matrix-account bestaat, of als `defaultAccount` verwijst naar een bestaande niet-canonieke sleutel zoals `Ops`, behoudt de promotie dat account in plaats van een nieuwe vermelding `accounts.default` te maken.
</Note>

## Configuratieschema

De Pluginconfiguratie wordt gevalideerd aan de hand van het JSON Schema in je manifest. Gebruikers configureren Plugins via:

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

Je Plugin ontvangt deze configuratie tijdens de registratie als `api.pluginConfig`.

Gebruik voor kanaalspecifieke configuratie in plaats daarvan de sectie voor kanaalconfiguratie:

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

Gebruik `buildChannelConfigSchema` om een Zod-schema om te zetten in de `ChannelConfigSchema`-wrapper die wordt gebruikt door configuratieartefacten die eigendom zijn van Plugins:

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

Als je het contract al opstelt als JSON Schema of TypeBox, gebruik dan de directe helper zodat OpenClaw de conversie van Zod naar JSON Schema op metadatapaden kan overslaan:

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

Voor Plugins van derden blijft het contract voor zelden gebruikte paden het Pluginmanifest: neem het gegenereerde JSON Schema over in `openclaw.plugin.json#channelConfigs`, zodat configuratieschema-, setup- en UI-oppervlakken `channels.<id>` kunnen inspecteren zonder runtimecode te laden.

## Setupwizards

Kanaal-Plugins kunnen interactieve setupwizards aanbieden voor `openclaw onboard`. De wizard is een `ChannelSetupWizard`-object op de `ChannelPlugin`:

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

`ChannelSetupWizard` ondersteunt ook `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` en meer. Zie `src/setup-core.ts` van de Discord-Plugin voor een volledig gebundeld voorbeeld.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    Geef voor prompts voor DM-toestaanlijsten die alleen de standaardstroom `note -> prompt -> parse -> merge -> patch` nodig hebben de voorkeur aan de gedeelde setuphelpers uit `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` en `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Geef voor statusblokken van kanaalsetup die alleen verschillen in labels, scores en optionele extra regels de voorkeur aan `createStandardChannelSetupStatus(...)` uit `openclaw/plugin-sdk/setup`, in plaats van in elke Plugin handmatig hetzelfde `status`-object te maken.
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

    `plugin-sdk/channel-setup` stelt ook de lager-niveau-bouwfuncties `createOptionalChannelSetupAdapter(...)` en `createOptionalChannelSetupWizard(...)` beschikbaar wanneer je slechts één helft van dat optionele installatieoppervlak nodig hebt.

    De gegenereerde optionele adapter/wizard weigert echte configuratiewijzigingen standaard veilig. Deze hergebruikt één bericht dat installatie vereist voor `validateInput`, `applyAccountConfig` en `finalize`, en voegt een documentatielink toe wanneer `docsPath` is ingesteld.

  </Accordion>
  <Accordion title="Installatiehelpers met binaire ondersteuning">
    Geef voor installatie-UI's met binaire ondersteuning de voorkeur aan de gedeelde gedelegeerde helpers in plaats van dezelfde lijmcode voor binaire bestanden/statussen naar elk kanaal te kopiëren:

    - `createDetectedBinaryStatus(...)` voor statusblokken die alleen verschillen in labels, hints, scores en detectie van binaire bestanden
    - `createCliPathTextInput(...)` voor tekstinvoer op basis van paden
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` en `createDelegatedResolveConfigured(...)` wanneer `setupEntry` indien nodig moet doorsturen naar een uitgebreidere volledige wizard
    - `createDelegatedTextInputShouldPrompt(...)` wanneer `setupEntry` alleen een beslissing voor `textInputs[*].shouldPrompt` hoeft te delegeren

  </Accordion>
</AccordionGroup>

## Publiceren en installeren

**Externe plugins:** publiceer naar [ClawHub](/nl/clawhub) en installeer vervolgens:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Kale pakketspecificaties worden tijdens de overgang bij het starten vanuit npm geïnstalleerd, tenzij de naam overeenkomt met de id van een gebundelde of officiële plugin; in dat geval gebruikt OpenClaw in plaats daarvan die lokale/officiële kopie. Gebruik `clawhub:`, `npm:`, `git:` of `npm-pack:` voor een deterministische bronselectie — zie [Plugins beheren](/nl/plugins/manage-plugins).

  </Tab>
  <Tab title="Alleen ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm-pakketspecificatie">
    Gebruik npm wanneer een pakket nog niet naar ClawHub is verplaatst, of wanneer u tijdens de migratie een
    rechtstreeks npm-installatiepad nodig hebt:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins in de repository:** plaats deze onder de werkruimteboom voor gebundelde plugins; ze worden tijdens het bouwen automatisch gedetecteerd.

<Info>
Voor installaties vanuit npm installeert `openclaw plugins install` het pakket in een project per plugin onder `~/.openclaw/npm/projects`, waarbij levenscyclusscripts zijn uitgeschakeld (`--ignore-scripts`). Houd afhankelijkheidsbomen van plugins volledig in JS/TS en vermijd pakketten waarvoor builds via `postinstall` nodig zijn.
</Info>

<Note>
Bij het starten installeert de Gateway geen plugin-afhankelijkheden. Installatiestromen via npm/git/ClawHub beheren de convergentie van afhankelijkheden; voor lokale plugins moeten de afhankelijkheden al zijn geïnstalleerd.
</Note>

Metadata van gebundelde pakketten is expliciet en wordt bij het starten van de Gateway niet afgeleid uit gebouwde JavaScript. Runtimeafhankelijkheden horen thuis in het pluginpakket dat ze beheert; het starten van een verpakte OpenClaw-installatie repareert of spiegelt nooit plugin-afhankelijkheden.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — stapsgewijze introductiegids
- [Pluginmanifest](/nl/plugins/manifest) — volledige referentie voor het manifestschema
- [SDK-ingangspunten](/nl/plugins/sdk-entrypoints) — `definePluginEntry` en `defineChannelPluginEntry`
