---
read_when:
    - Je wilt een nieuwe OpenClaw Plugin maken
    - Je hebt een snelstartgids nodig voor Plugin-ontwikkeling
    - Je voegt een nieuw kanaal, provider, tool of andere mogelijkheid toe aan OpenClaw
sidebarTitle: Getting Started
summary: Maak je eerste OpenClaw-Plugin in enkele minuten
title: Plugins bouwen
x-i18n:
    generated_at: "2026-05-07T13:23:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
spraak, realtime transcriptie, realtime spraak, mediabegrip, afbeeldingsgeneratie,
videogeneratie, web-fetch, webzoekopdrachten, agenttools, of elke combinatie
daarvan.

Je hoeft je Plugin niet aan de OpenClaw-repository toe te voegen. Publiceer naar
[ClawHub](/nl/tools/clawhub) en gebruikers installeren met
`openclaw plugins install clawhub:<package-name>`. Kale pakketspecificaties
installeren tijdens de launch-cutover nog steeds vanaf npm.

## Vereisten

- Node >= 22 en een pakketbeheerder (npm of pnpm)
- Bekendheid met TypeScript (ESM)
- Voor in-repo Plugins: repository gekloond en `pnpm install` uitgevoerd. Ontwikkeling
  van Plugins vanuit een source-checkout is alleen pnpm, omdat OpenClaw gebundelde
  Plugins laadt uit de `extensions/*` workspace-pakketten.

## Welk soort Plugin?

<CardGroup cols={3}>
  <Card title="Kanaal-Plugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform (Discord, IRC, enz.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een modelprovider toe (LLM, proxy of aangepast endpoint)
  </Card>
  <Card title="CLI-backend-Plugin" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Koppel een lokale AI-CLI aan OpenClaw's tekst-fallbackrunner
  </Card>
  <Card title="Tool- / hook-Plugin" icon="wrench" href="/nl/plugins/hooks">
    Registreer agenttools, event hooks of services - ga hieronder verder
  </Card>
</CardGroup>

Voor een kanaal-Plugin waarvan niet gegarandeerd is dat die is geïnstalleerd wanneer onboarding/setup
wordt uitgevoerd, gebruik je `createOptionalChannelSetupSurface(...)` uit
`openclaw/plugin-sdk/channel-setup`. Dit maakt een setupadapter + wizardpaar
dat de installatievereiste toont en gesloten faalt bij echte config-schrijfacties
totdat de Plugin is geïnstalleerd.

## Snelle start: tool-Plugin

Deze walkthrough maakt een minimale Plugin die een agenttool registreert. Kanaal-
en provider-Plugins hebben eigen gidsen die hierboven zijn gelinkt.

<Steps>
  <Step title="Maak het pakket en manifest">
    <CodeGroup>
    ```json package.json
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

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Elke Plugin heeft een manifest nodig, zelfs zonder config. Tools die tijdens runtime
    worden geregistreerd, moeten in `contracts.tools` worden vermeld zodat OpenClaw de eigenaar-
    Plugin kan ontdekken zonder elke Plugin-runtime te laden. Plugins moeten ook
    bewust `activation.onStartup` declareren. Dit voorbeeld zet die op `true`. Zie
    [Manifest](/nl/plugins/manifest) voor het volledige schema. De canonieke ClawHub-
    publicatiesnippets staan in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Schrijf het entrypoint">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` is voor niet-kanaal-Plugins. Gebruik voor kanalen
    `defineChannelPluginEntry` - zie [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins).
    Zie [Entrypoints](/nl/plugins/sdk-entrypoints) voor alle entrypointopties.

  </Step>

  <Step title="Test en publiceer">

    **Externe Plugins:** valideer en publiceer met ClawHub, installeer daarna:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Kale pakketspecificaties zoals `@myorg/openclaw-my-plugin` installeren tijdens
    de launch-cutover vanaf npm. Gebruik `clawhub:` wanneer je ClawHub-resolutie wilt.

    **In-repo Plugins:** plaats onder de gebundelde Plugin-workspaceboom - automatisch ontdekt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Pluginmogelijkheden

Eén Plugin kan elk aantal mogelijkheden registreren via het `api`-object:

| Mogelijkheid           | Registratiemethode                               | Gedetailleerde gids                                                            |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Tekstinferentie (LLM)  | `api.registerProvider(...)`                      | [Provider-Plugins](/nl/plugins/sdk-provider-plugins)                              |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | [CLI-backend-Plugins](/nl/plugins/cli-backend-plugins)                            |
| Kanaal / berichten     | `api.registerChannel(...)`                       | [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins)                                 |
| Spraak (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime spraak        | `api.registerRealtimeVoiceProvider(...)`         | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Afbeeldingsgeneratie   | `api.registerImageGenerationProvider(...)`       | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Muziekgeneratie        | `api.registerMusicGenerationProvider(...)`       | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogeneratie         | `api.registerVideoGenerationProvider(...)`       | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-fetch              | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Webzoekopdracht        | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Toolresultaatmiddleware | `api.registerAgentToolResultMiddleware(...)`     | [SDK-overzicht](/nl/plugins/sdk-overview#registration-api)                        |
| Agenttools             | `api.registerTool(...)`                          | Hieronder                                                                      |
| Aangepaste opdrachten  | `api.registerCommand(...)`                       | [Entrypoints](/nl/plugins/sdk-entrypoints)                                        |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/nl/plugins/hooks)                                                 |
| Interne event hooks    | `api.registerHook(...)`                          | [Entrypoints](/nl/plugins/sdk-entrypoints)                                        |
| HTTP-routes            | `api.registerHttpRoute(...)`                     | [Internals](/nl/plugins/architecture-internals#gateway-http-routes)               |
| CLI-subopdrachten      | `api.registerCli(...)`                           | [Entrypoints](/nl/plugins/sdk-entrypoints)                                        |

Zie [SDK-overzicht](/nl/plugins/sdk-overview#registration-api) voor de volledige registratie-API.

Gebundelde Plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer ze
async herschrijven van toolresultaten nodig hebben voordat het model de uitvoer ziet. Declareer de
gerichte runtimes in `contracts.agentToolResultMiddleware`, bijvoorbeeld
`["pi", "codex"]`. Dit is een vertrouwde seam voor gebundelde Plugins; externe
Plugins moeten de reguliere OpenClaw Plugin hooks gebruiken, tenzij OpenClaw een
expliciet vertrouwensbeleid voor deze mogelijkheid krijgt.

Als je Plugin aangepaste Gateway-RPC-methoden registreert, houd ze dan op een
Plugin-specifiek prefix. Core-adminnamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd opgelost naar
`operator.admin`, zelfs als een Plugin om een nauwere scope vraagt.

Hook-guardsemantiek om rekening mee te houden:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` wordt behandeld als geen beslissing.
- `before_tool_call`: `{ requireApproval: true }` pauzeert agentuitvoering en vraagt de gebruiker om goedkeuring via de exec-goedkeuringsoverlay, Telegram-knoppen, Discord-interacties of de opdracht `/approve` op elk kanaal.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` wordt behandeld als geen beslissing.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` wordt behandeld als geen beslissing.
- `message_received`: geef de voorkeur aan het getypte veld `threadId` wanneer je routering van inkomende threads/topics nodig hebt. Gebruik `metadata` voor kanaalspecifieke extra's.
- `message_sending`: geef de voorkeur aan getypte routeringsvelden `replyToId` / `threadId` boven kanaalspecifieke metadatasleutels.

De opdracht `/approve` verwerkt zowel exec- als Plugin-goedkeuringen met begrensde fallback: wanneer een exec-goedkeurings-id niet wordt gevonden, probeert OpenClaw hetzelfde id opnieuw via Plugin-goedkeuringen. Doorsturen van Plugin-goedkeuringen kan onafhankelijk worden geconfigureerd via `approvals.plugin` in config.

Als aangepaste goedkeuringsplumbing diezelfde begrensde fallbackcase moet detecteren,
gebruik dan bij voorkeur `isApprovalNotFoundError` uit `openclaw/plugin-sdk/error-runtime`
in plaats van handmatig approval-expiry-strings te matchen.

Zie [Plugin hooks](/nl/plugins/hooks) voor voorbeelden en de hookreferentie.

## Agenttools registreren

Tools zijn getypeerde functies die de LLM kan aanroepen. Ze kunnen verplicht zijn (altijd
beschikbaar) of optioneel (opt-in door gebruiker):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Elke tool die met `api.registerTool(...)` is geregistreerd, moet ook in het
Plugin-manifest worden gedeclareerd:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw legt de gevalideerde descriptor van de geregistreerde tool vast en cachet deze,
zodat plugins geen `description`- of schemagegevens in het manifest dupliceren. Het
manifestcontract declareert alleen eigendom en ontdekking; uitvoering roept nog steeds
de live geregistreerde toolimplementatie aan.
Stel `toolMetadata.<tool>.optional: true` in voor tools die zijn geregistreerd met
`api.registerTool(..., { optional: true })`, zodat OpenClaw kan voorkomen dat die
plugin-runtime wordt geladen totdat de tool expliciet is toegestaan.

Gebruikers schakelen optionele tools in de configuratie in:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Toolnamen mogen niet botsen met kerntools (conflicten worden overgeslagen)
- Tools met ongeldige registratieobjecten, inclusief ontbrekende `parameters`, worden overgeslagen en gerapporteerd in plugin-diagnostiek in plaats van agentruns te breken
- Gebruik `optional: true` voor tools met neveneffecten of extra binaire vereisten
- Gebruikers kunnen alle tools van een plugin inschakelen door de plugin-id toe te voegen aan `tools.allow`

## CLI-opdrachten registreren

Plugins kunnen root-`openclaw`-opdrachtgroepen toevoegen met `api.registerCli`. Geef
`descriptors` op voor elke toplevel opdrachtroot, zodat OpenClaw de opdracht kan tonen
en routeren zonder elke plugin-runtime gretig te laden.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Verifieer na installatie de runtime-registratie en voer de opdracht uit:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Importconventies

Importeer altijd vanuit gerichte `openclaw/plugin-sdk/<subpath>`-paden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Zie [SDK-overzicht](/nl/plugins/sdk-overview) voor de volledige subpadreferentie.

Gebruik binnen je plugin lokale barrelbestanden (`api.ts`, `runtime-api.ts`) voor
interne imports - importeer je eigen plugin nooit via het SDK-pad.

Houd voor providerplugins provider-specifieke helpers in die package-root
barrels, tenzij de seam echt generiek is. Huidige gebundelde voorbeelden:

- Anthropic: Claude-streamwrappers en `service_tier` / bètahelpers
- OpenAI: providerbuilders, helpers voor standaardmodellen, realtime providers
- OpenRouter: providerbuilder plus onboarding-/configuratiehelpers

Als een helper alleen nuttig is binnen één gebundeld providerpakket, houd deze dan op die
package-root seam in plaats van deze te promoveren naar `openclaw/plugin-sdk/*`.

Sommige gegenereerde `openclaw/plugin-sdk/<bundled-id>`-helperseams bestaan nog steeds voor
onderhoud van gebundelde plugins wanneer ze getraceerd eigenaarsgebruik hebben. Behandel deze als
gereserveerde oppervlakken, niet als het standaardpatroon voor nieuwe plugins van derden.

## Checklist vóór indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entrypoint gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-self-imports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (plugins in de repo)</Check>

## Bètareleasetests

1. Let op GitHub-releasetags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Bèta-tags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor releaseaankondigingen.
2. Test je plugin tegen de bètatag zodra die verschijnt. Het venster vóór stable is meestal maar een paar uur.
3. Plaats na het testen in de thread van je plugin in het Discord-kanaal `plugin-forum` met ofwel `all good` of wat er stukging. Als je nog geen thread hebt, maak er dan een.
4. Als er iets stukgaat, open of werk dan een issue bij met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Zet de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue zowel in de PR als in je Discord-thread. Bijdragers kunnen PRs niet labelen, dus de titel is het PR-signaal voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR kunnen toch worden uitgebracht. Maintainers volgen deze threads tijdens bètatests.
6. Stilte betekent groen. Als je het venster mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een messaging-channelplugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een modelproviderplugin
  </Card>
  <Card title="CLI-backendplugins" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Registreer een lokale AI-CLI-backend
  </Card>
  <Card title="SDK-overzicht" icon="book-open" href="/nl/plugins/sdk-overview">
    Importmap en API-referentie voor registratie
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, zoeken, subagent via api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/nl/plugins/sdk-testing">
    Testhulpprogramma's en patronen
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/nl/plugins/manifest">
    Volledige manifest-schemareferentie
  </Card>
</CardGroup>

## Gerelateerd

- [Plugin Architecture](/nl/plugins/architecture) - diepgaande blik op interne architectuur
- [SDK-overzicht](/nl/plugins/sdk-overview) - Plugin SDK-referentie
- [Manifest](/nl/plugins/manifest) - pluginmanifestindeling
- [Channel Plugins](/nl/plugins/sdk-channel-plugins) - channelplugins bouwen
- [Provider Plugins](/nl/plugins/sdk-provider-plugins) - providerplugins bouwen
