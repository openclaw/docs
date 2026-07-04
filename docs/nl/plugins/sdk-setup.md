---
read_when:
    - Je voegt een configuratiewizard toe aan een Plugin
    - Je moet setup-entry.ts versus index.ts begrijpen
    - Je definieert Plugin-configuratieschema's of openclaw-metadata in package.json
sidebarTitle: Setup and config
summary: Installatiewizards, setup-entry.ts, configuratieschema's en package.json-metadata
title: Plugin-installatie en configuratie
x-i18n:
    generated_at: "2026-07-04T15:26:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referentie voor Plugin-verpakking (`package.json`-metadata), manifesten (`openclaw.plugin.json`), setup-items en configuratieschema's.

<Tip>
**Op zoek naar een stapsgewijze gids?** De how-to-gidsen behandelen verpakking in context: [Kanaalplugins](/nl/plugins/sdk-channel-plugins#step-1-package-and-manifest) en [Providerplugins](/nl/plugins/sdk-provider-plugins#step-1-package-and-manifest).
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
Als je de Plugin extern op ClawHub publiceert, zijn die `compat`- en `build`-velden vereist. De canonieke publicatiesnippets staan in `docs/snippets/plugin-publish/`.
</Note>

### `openclaw`-velden

<ParamField path="extensions" type="string[]">
  Entry-pointbestanden (relatief aan de pakketroot).
</ParamField>
<ParamField path="setupEntry" type="string">
  Lichtgewicht item alleen voor setup (optioneel).
</ParamField>
<ParamField path="channel" type="object">
  Kanaalcatalogusmetadata voor setup-, kiezer-, quickstart- en statusoppervlakken.
</ParamField>
<ParamField path="providers" type="string[]">
  Provider-id's die door deze Plugin worden geregistreerd.
</ParamField>
<ParamField path="install" type="object">
  Installatietips: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Opstartgedragsvlaggen.
</ParamField>

### `openclaw.channel`

`openclaw.channel` is goedkope pakketmetadata voor kanaalontdekking en setup-oppervlakken voordat de runtime laadt.

| Veld                                   | Type       | Wat het betekent                                                            |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | Canonieke kanaal-id.                                                         |
| `label`                                | `string`   | Primair kanaallabel.                                                         |
| `selectionLabel`                       | `string`   | Kiezer-/setuplabel wanneer dit moet afwijken van `label`.                    |
| `detailLabel`                          | `string`   | Secundair detaillabel voor rijkere kanaalcatalogi en statusoppervlakken.     |
| `docsPath`                             | `string`   | Documentatiepad voor setup- en selectielinks.                                |
| `docsLabel`                            | `string`   | Overschrijvend label voor documentatielinks wanneer dit moet afwijken van de kanaal-id. |
| `blurb`                                | `string`   | Korte onboarding-/catalogusbeschrijving.                                     |
| `order`                                | `number`   | Sorteervolgorde in kanaalcatalogi.                                           |
| `aliases`                              | `string[]` | Extra lookup-aliassen voor kanaalselectie.                                   |
| `preferOver`                           | `string[]` | Plugin-/kanaal-id's met lagere prioriteit waar dit kanaal boven moet staan.  |
| `systemImage`                          | `string`   | Optionele pictogram-/systeemafbeeldingsnaam voor kanaal-UI-catalogi.         |
| `selectionDocsPrefix`                  | `string`   | Voorvoegseltekst vóór documentatielinks in selectieoppervlakken.             |
| `selectionDocsOmitLabel`               | `boolean`  | Toon het documentatiepad direct in plaats van een gelabelde documentatielink in selectietekst. |
| `selectionExtras`                      | `string[]` | Extra korte strings die aan selectietekst worden toegevoegd.                 |
| `markdownCapable`                      | `boolean`  | Markeert het kanaal als markdown-geschikt voor beslissingen over uitgaande opmaak. |
| `exposure`                             | `object`   | Zichtbaarheidsinstellingen voor kanalen voor setup, geconfigureerde lijsten en documentatieoppervlakken. |
| `quickstartAllowFrom`                  | `boolean`  | Laat dit kanaal meedoen aan de standaard quickstart-setupflow `allowFrom`.   |
| `forceAccountBinding`                  | `boolean`  | Vereis expliciete accountkoppeling, zelfs wanneer er maar één account bestaat. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Geef de voorkeur aan sessie-lookup bij het oplossen van aankondigingsdoelen voor dit kanaal. |

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
`showConfigured` en `showInSetup` blijven ondersteund als legacy aliassen. Geef de voorkeur aan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` is pakketmetadata, geen manifestmetadata.

| Veld                         | Type                                | Wat het betekent                                                               |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Canonieke ClawHub-specificatie voor installatie/update en install-on-demandflows tijdens onboarding. |
| `npmSpec`                    | `string`                            | Canonieke npm-specificatie voor fallbackflows voor installatie/update.          |
| `localPath`                  | `string`                            | Lokaal ontwikkelpad of gebundeld installatiepad.                               |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Voorkeursinstallatiebron wanneer meerdere bronnen beschikbaar zijn.             |
| `minHostVersion`             | `string`                            | Minimaal ondersteunde OpenClaw-versie in de vorm `>=x.y.z` of `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Verwachte npm-dist-integriteitsstring, meestal `sha512-...`, voor vastgepinde installaties. |
| `allowInvalidConfigRecovery` | `boolean`                           | Laat herinstallatieflows van gebundelde Plugins herstellen van specifieke stale-configfouten. |
| `requiredPlatformPackages`   | `string[]`                          | Vereiste platformspecifieke npm-aliassen die tijdens npm-installatie worden geverifieerd. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Interactieve onboarding gebruikt ook `openclaw.install` voor install-on-demand-oppervlakken. Als je Plugin provider-authkeuzes of kanaalsetup-/catalogusmetadata blootstelt voordat de runtime laadt, kan onboarding die keuze tonen, om ClawHub-, npm- of lokale installatie vragen, de Plugin installeren of inschakelen en daarna doorgaan met de geselecteerde flow. ClawHub-onboardingkeuzes gebruiken `clawhubSpec` en hebben de voorkeur wanneer aanwezig; npm-keuzes vereisen vertrouwde catalogusmetadata met een registry-`npmSpec`; exacte versies en `expectedIntegrity` zijn optionele npm-pins. Als `expectedIntegrity` aanwezig is, dwingen installatie-/updateflows dit af voor npm. Bewaar de metadata voor "wat te tonen" in `openclaw.plugin.json` en de metadata voor "hoe dit te installeren" in `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Als `minHostVersion` is ingesteld, dwingen installatie en niet-gebundelde manifest-registry-loading dit allebei af. Oudere hosts slaan externe Plugins over; ongeldige versiestrings worden geweigerd. Gebundelde bron-Plugins worden geacht mee geversioneerd te zijn met de host-checkout.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` is geen algemene bypass voor kapotte configuraties. Het is alleen bedoeld voor nauw herstel van gebundelde Plugins, zodat herinstallatie/setup bekende upgrade-restanten kan repareren, zoals een ontbrekend pad naar een gebundelde Plugin of een stale `channels.<id>`-item voor diezelfde Plugin. Als de configuratie om niet-gerelateerde redenen kapot is, faalt installatie nog steeds gesloten en vertelt dit de operator om `openclaw doctor --fix` uit te voeren.
  </Accordion>
</AccordionGroup>

### Uitgestelde volledige load

Kanaalplugins kunnen zich aanmelden voor uitgesteld laden met:

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

Wanneer ingeschakeld, laadt OpenClaw alleen `setupEntry` tijdens de pre-listen-opstartfase, zelfs voor al geconfigureerde kanalen. Het volledige item laadt nadat de gateway begint te luisteren.

<Warning>
Schakel uitgesteld laden alleen in wanneer je `setupEntry` alles registreert wat de Gateway nodig heeft voordat deze begint te luisteren (kanaalregistratie, HTTP-routes, Gateway-methoden). Als het volledige item vereiste opstartmogelijkheden beheert, behoud dan het standaardgedrag.
</Warning>

Als je setup-/volledige item Gateway-RPC-methoden registreert, houd ze dan op een Plugin-specifiek prefix. Gereserveerde core-adminnamespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) blijven eigendom van core en worden altijd opgelost naar `operator.admin`.

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

## ClawHub-publicatie

Gebruik voor Plugin-pakketten de pakketspecifieke ClawHub-opdracht:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
De verouderde publicatie-alias alleen voor skills is bedoeld voor Skills. Plugin-pakketten moeten altijd `clawhub package publish` gebruiken.
</Note>

## Setup-item

Het bestand `setup-entry.ts` is een lichtgewicht alternatief voor `index.ts` dat OpenClaw laadt wanneer het alleen setup-oppervlakken nodig heeft (onboarding, configuratieherstel, inspectie van uitgeschakelde kanalen).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dit voorkomt dat zware runtime-code (cryptobibliotheken, CLI-registraties, achtergrondservices) tijdens setup-flows wordt geladen.

Gebundelde werkruimtekanaal-Plugins die setup-veilige exports in sidecar-modules bewaren, kunnen `defineBundledChannelSetupEntry(...)` uit `openclaw/plugin-sdk/channel-entry-contract` gebruiken in plaats van `defineSetupPluginEntry(...)`. Dat gebundelde contract ondersteunt ook een optionele `runtime`-export, zodat runtime-bedrading tijdens setup lichtgewicht en expliciet kan blijven.

<AccordionGroup>
  <Accordion title="Wanneer OpenClaw setupEntry gebruikt in plaats van het volledige item">
    - Het kanaal is uitgeschakeld maar heeft setup-/onboarding-oppervlakken nodig.
    - Het kanaal is ingeschakeld maar niet geconfigureerd.
    - Uitgesteld laden is ingeschakeld (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Wat setupEntry moet registreren">
    - Het kanaal-Plugin-object (via `defineSetupPluginEntry`).
    - Alle HTTP-routes die vóór gateway-listen vereist zijn.
    - Alle Gateway-methoden die tijdens het opstarten nodig zijn.

    Die opstart-Gateway-methoden moeten nog steeds gereserveerde core-adminnamespaces zoals `config.*` of `update.*` vermijden.

  </Accordion>
  <Accordion title="Wat setupEntry NIET moet bevatten">
    - CLI-registraties.
    - Achtergrondservices.
    - Zware runtime-imports (crypto, SDK's).
    - Gateway-methoden die pas na het opstarten nodig zijn.

  </Accordion>
</AccordionGroup>

### Smalle imports voor setup-helpers

Gebruik voor hete paden die alleen setup nodig hebben liever de smalle setup-helpernaden dan de bredere `plugin-sdk/setup`-paraplu wanneer je maar een deel van het setup-oppervlak nodig hebt:

| Importpad                          | Gebruik het voor                                                                           | Belangrijke exports                                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | runtime-helpers tijdens setup die beschikbaar blijven in `setupEntry` / uitgestelde kanaalstart | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | verouderde compatibiliteitsalias; gebruik `plugin-sdk/setup-runtime`                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helpers voor setup-/installatie-CLI/archief/docs                                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Gebruik de bredere `plugin-sdk/setup`-naad wanneer je de volledige gedeelde setup-toolbox wilt, inclusief configuratiepatch-helpers zoals `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gebruik `createSetupTranslator(...)` voor vaste setup-wizardtekst. Deze volgt de
CLI-wizardlocale (`OPENCLAW_LOCALE`, daarna systeemlocalevariabelen) en valt
terug op Engels. Houd Plugin-specifieke setuptekst in code die eigendom is van de Plugin en gebruik
gedeelde catalogussleutels alleen voor algemene setuplabels, statustekst en officiële
gebundelde Plugin-setuptekst.

De setup-patchadapters blijven veilig voor hete paden bij import. Hun gebundelde contract-oppervlaklookup voor promotie van één account is lazy, dus het importeren van `plugin-sdk/setup-runtime` laadt de gebundelde contract-oppervlakontdekking niet gretig voordat de adapter daadwerkelijk wordt gebruikt.

### Kanaaleigen promotie van één account

Wanneer een kanaal opwaardeert van een top-level configuratie met één account naar `channels.<id>.accounts.*`, is het standaard gedeelde gedrag om gepromoveerde account-scoped waarden naar `accounts.default` te verplaatsen.

Gebundelde kanalen kunnen die promotie beperken of overschrijven via hun setup-contractoppervlak:

- `singleAccountKeysToMove`: extra top-level sleutels die naar het gepromoveerde account moeten worden verplaatst
- `namedAccountPromotionKeys`: wanneer benoemde accounts al bestaan, worden alleen deze sleutels naar het gepromoveerde account verplaatst; gedeelde beleids-/bezorgsleutels blijven in de kanaalroot
- `resolveSingleAccountPromotionTarget(...)`: kies welk bestaand account gepromoveerde waarden ontvangt

<Note>
Matrix is het huidige gebundelde voorbeeld. Als er precies één benoemd Matrix-account al bestaat, of als `defaultAccount` naar een bestaande niet-canonieke sleutel zoals `Ops` verwijst, behoudt promotie dat account in plaats van een nieuw `accounts.default`-item te maken.
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

Gebruik `buildChannelConfigSchema` om een Zod-schema om te zetten naar de `ChannelConfigSchema`-wrapper die wordt gebruikt door configuratieartefacten die eigendom zijn van Plugins:

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

Voor externe Plugins is het cold-pathcontract nog steeds het Plugin-manifest: spiegel het gegenereerde JSON Schema naar `openclaw.plugin.json#channelConfigs`, zodat configuratieschema, setup en UI-oppervlakken `channels.<id>` kunnen inspecteren zonder runtime-code te laden.

## Setup-wizards

Kanaal-Plugins kunnen interactieve setup-wizards bieden voor `openclaw onboard`. De wizard is een `ChannelSetupWizard`-object op de `ChannelPlugin`:

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
  <Accordion title="Gedeelde allowFrom-prompts">
    Geef voor DM-allowlistprompts die alleen de standaardflow `note -> prompt -> parse -> merge -> patch` nodig hebben de voorkeur aan de gedeelde setup-helpers uit `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` en `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standaard kanaalsetupstatus">
    Geef voor statusblokken voor kanaalsetup die alleen verschillen per labels, scores en optionele extra regels de voorkeur aan `createStandardChannelSetupStatus(...)` uit `openclaw/plugin-sdk/setup` in plaats van hetzelfde `status`-object handmatig in elke Plugin te maken.
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

    `plugin-sdk/channel-setup` stelt ook de lagere `createOptionalChannelSetupAdapter(...)`- en `createOptionalChannelSetupWizard(...)`-builders beschikbaar wanneer je slechts één helft van dat optionele installatieoppervlak nodig hebt.

    De gegenereerde optionele adapter/wizard faalt gesloten bij echte configuratieschrijfacties. Ze hergebruiken één installatie-vereist-bericht voor `validateInput`, `applyAccountConfig` en `finalize`, en voegen een docs-link toe wanneer `docsPath` is ingesteld.

  </Accordion>
  <Accordion title="Setup-helpers met binaire ondersteuning">
    Geef voor setup-UI's met binaire ondersteuning de voorkeur aan de gedeelde gedelegeerde helpers in plaats van dezelfde binaire/statuslijm naar elk kanaal te kopiëren:

    - `createDetectedBinaryStatus(...)` voor statusblokken die alleen verschillen in labels, hints, scores en binaire detectie
    - `createCliPathTextInput(...)` voor tekstinvoer op basis van paden
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` en `createDelegatedResolveConfigured(...)` wanneer `setupEntry` lui moet doorsturen naar een zwaardere volledige wizard
    - `createDelegatedTextInputShouldPrompt(...)` wanneer `setupEntry` alleen een `textInputs[*].shouldPrompt`-beslissing hoeft te delegeren

  </Accordion>
</AccordionGroup>

## Publiceren en installeren

**Externe plugins:** publiceer naar [ClawHub](/clawhub) en installeer daarna:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Kale pakketspecificaties installeren vanuit npm tijdens de laanceringsovergang.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Gebruik npm wanneer een pakket nog niet naar ClawHub is verplaatst, of wanneer je tijdens migratie een
    direct npm-installatiepad nodig hebt:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins in de repo:** plaats ze onder de gebundelde plugin-workspaceboom en ze worden automatisch ontdekt tijdens de build.

**Gebruikers kunnen installeren:**

```bash
openclaw plugins install <package-name>
```

<Info>
Voor installaties vanuit npm installeert `openclaw plugins install` het pakket in een project per plugin onder `~/.openclaw/npm/projects`, met lifecycle-scripts uitgeschakeld. Houd afhankelijkheidsbomen van plugins zuiver JS/TS en vermijd pakketten die `postinstall`-builds vereisen.
</Info>

<Note>
Gateway-start installeert geen plugin-afhankelijkheden. npm/git/ClawHub-installatiestromen zijn verantwoordelijk voor afhankelijkheidsconvergentie; lokale plugins moeten hun afhankelijkheden al geïnstalleerd hebben.
</Note>

Gebundelde pakketmetadata is expliciet en wordt niet afgeleid uit gebouwde JavaScript bij Gateway-start. Runtime-afhankelijkheden horen thuis in het plugin-pakket dat ze bezit; het starten van een verpakte OpenClaw repareert of spiegelt plugin-afhankelijkheden nooit.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — stapsgewijze handleiding om aan de slag te gaan
- [Plugin-manifest](/nl/plugins/manifest) — volledige referentie voor het manifestschema
- [SDK-entrypoints](/nl/plugins/sdk-entrypoints) — `definePluginEntry` en `defineChannelPluginEntry`
