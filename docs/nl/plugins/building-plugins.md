---
read_when:
    - Je wilt een nieuwe OpenClaw Plugin maken
    - Je hebt een snelstartgids voor Plugin-ontwikkeling nodig
    - Je voegt een nieuw kanaal, provider, tool of andere mogelijkheid toe aan OpenClaw
sidebarTitle: Getting Started
summary: Maak binnen enkele minuten je eerste OpenClaw Plugin
title: Plugins bouwen
x-i18n:
    generated_at: "2026-05-06T09:24:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
spraak, realtime transcriptie, realtime spraak, mediabegrip, afbeeldingsgeneratie,
videogeneratie, web-fetch, webzoekopdrachten, agenttools of elke
combinatie.

Je hoeft je Plugin niet toe te voegen aan de OpenClaw-repository. Publiceer naar
[ClawHub](/nl/tools/clawhub) en gebruikers installeren met
`openclaw plugins install clawhub:<package-name>`. Kale pakketspecificaties
installeren tijdens de lanceringsomschakeling nog steeds vanaf npm.

## Vereisten

- Node >= 22 en een pakketbeheerder (npm of pnpm)
- Bekendheid met TypeScript (ESM)
- Voor Plugins in de repository: repository gekloond en `pnpm install` uitgevoerd. Ontwikkeling van Plugins vanuit een source-checkout is alleen pnpm, omdat OpenClaw gebundelde
  Plugins laadt uit de `extensions/*`-workspacepakketten.

## Wat voor soort Plugin?

<CardGroup cols={3}>
  <Card title="Kanaalplugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform (Discord, IRC, enz.)
  </Card>
  <Card title="Providerplugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een modelprovider toe (LLM, proxy of aangepast eindpunt)
  </Card>
  <Card title="Tool- / hookplugin" icon="wrench" href="/nl/plugins/hooks">
    Registreer agenttools, event hooks of services - ga hieronder verder
  </Card>
</CardGroup>

Gebruik voor een kanaalplugin waarvan niet gegarandeerd is dat die is geïnstalleerd wanneer onboarding/setup
wordt uitgevoerd `createOptionalChannelSetupSurface(...)` uit
`openclaw/plugin-sdk/channel-setup`. Dit produceert een setupadapter + wizardpaar
dat de installatievereiste aangeeft en veilig faalt bij echte configuratieschrijfbewerkingen
totdat de Plugin is geïnstalleerd.

## Snelstart: toolplugin

Deze walkthrough maakt een minimale Plugin die een agenttool registreert. Kanaal-
en providerplugins hebben eigen gidsen die hierboven zijn gelinkt.

<Steps>
  <Step title="Maak het pakket en het manifest">
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

    Elke Plugin heeft een manifest nodig, zelfs zonder configuratie. Tools die tijdens runtime worden geregistreerd
    moeten worden vermeld in `contracts.tools`, zodat OpenClaw de eigenaar-
    Plugin kan ontdekken zonder elke Plugin-runtime te laden. Plugins moeten ook
    `activation.onStartup` bewust declareren. Dit voorbeeld stelt het in op `true`. Zie
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

    `definePluginEntry` is voor niet-kanaalplugins. Gebruik voor kanalen
    `defineChannelPluginEntry` - zie [Kanaalplugins](/nl/plugins/sdk-channel-plugins).
    Zie [Entrypoints](/nl/plugins/sdk-entrypoints) voor alle entrypointopties.

  </Step>

  <Step title="Test en publiceer">

    **Externe Plugins:** valideer en publiceer met ClawHub, en installeer daarna:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Kale pakketspecificaties zoals `@myorg/openclaw-my-plugin` installeren tijdens
    de lanceringsomschakeling vanaf npm. Gebruik `clawhub:` wanneer je ClawHub-resolutie wilt.

    **Plugins in de repository:** plaats ze onder de gebundelde Plugin-workspaceboom - ze worden automatisch ontdekt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Pluginmogelijkheden

Een enkele Plugin kan elk aantal mogelijkheden registreren via het `api`-object:

| Mogelijkheid           | Registratiemethode                              | Gedetailleerde gids                                                            |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Tekstinferentie (LLM)  | `api.registerProvider(...)`                      | [Providerplugins](/nl/plugins/sdk-provider-plugins)                               |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | [CLI-backends](/nl/gateway/cli-backends)                                          |
| Kanaal / berichten     | `api.registerChannel(...)`                       | [Kanaalplugins](/nl/plugins/sdk-channel-plugins)                                  |
| Spraak (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime spraak        | `api.registerRealtimeVoiceProvider(...)`         | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Afbeeldingsgeneratie   | `api.registerImageGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Muziekgeneratie        | `api.registerMusicGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogeneratie         | `api.registerVideoGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-fetch              | `api.registerWebFetchProvider(...)`              | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Webzoekopdracht        | `api.registerWebSearchProvider(...)`             | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Toolresultaatmiddleware | `api.registerAgentToolResultMiddleware(...)`     | [SDK-overzicht](/nl/plugins/sdk-overview#registration-api)                        |
| Agenttools             | `api.registerTool(...)`                          | Hieronder                                                                      |
| Aangepaste opdrachten  | `api.registerCommand(...)`                       | [Entrypoints](/nl/plugins/sdk-entrypoints)                                        |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/nl/plugins/hooks)                                                 |
| Interne event hooks    | `api.registerHook(...)`                          | [Entrypoints](/nl/plugins/sdk-entrypoints)                                        |
| HTTP-routes            | `api.registerHttpRoute(...)`                     | [Internals](/nl/plugins/architecture-internals#gateway-http-routes)               |
| CLI-subopdrachten      | `api.registerCli(...)`                           | [Entrypoints](/nl/plugins/sdk-entrypoints)                                        |

Zie [SDK-overzicht](/nl/plugins/sdk-overview#registration-api) voor de volledige registratie-API.

Gebundelde Plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer ze
asynchrone herschrijving van toolresultaten nodig hebben voordat het model de output ziet. Declareer de
gerichte runtimes in `contracts.agentToolResultMiddleware`, bijvoorbeeld
`["pi", "codex"]`. Dit is een vertrouwde seam voor gebundelde Plugins; externe
Plugins moeten reguliere OpenClaw Plugin hooks gebruiken, tenzij OpenClaw een
expliciet vertrouwensbeleid voor deze mogelijkheid krijgt.

Als je Plugin aangepaste Gateway-RPC-methoden registreert, houd ze dan op een
Plugin-specifiek prefix. Core-adminnamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en verwijzen altijd naar
`operator.admin`, zelfs als een Plugin om een smallere scope vraagt.

Hook-guardsemantiek om in gedachten te houden:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` wordt behandeld als geen beslissing.
- `before_tool_call`: `{ requireApproval: true }` pauzeert agentuitvoering en vraagt de gebruiker om goedkeuring via de exec-goedkeuringsoverlay, Telegram-knoppen, Discord-interacties of de opdracht `/approve` op elk kanaal.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` wordt behandeld als geen beslissing.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` wordt behandeld als geen beslissing.
- `message_received`: geef de voorkeur aan het getypte veld `threadId` wanneer je routering van inkomende threads/topics nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: geef de voorkeur aan getypte routeringsvelden `replyToId` / `threadId` boven kanaalspecifieke metadatakeys.

De opdracht `/approve` verwerkt zowel exec- als Plugin-goedkeuringen met begrensde fallback: wanneer een exec-goedkeurings-id niet wordt gevonden, probeert OpenClaw dezelfde id opnieuw via Plugin-goedkeuringen. Het doorsturen van Plugin-goedkeuringen kan onafhankelijk worden geconfigureerd via `approvals.plugin` in de configuratie.

Als aangepaste goedkeuringsplumbing diezelfde begrensde fallbackcase moet detecteren,
gebruik dan bij voorkeur `isApprovalNotFoundError` uit `openclaw/plugin-sdk/error-runtime`
in plaats van handmatig approval-expiry-strings te matchen.

Zie [Plugin hooks](/nl/plugins/hooks) voor voorbeelden en de hookreferentie.

## Agenttools registreren

Tools zijn getypte functies die de LLM kan aanroepen. Ze kunnen vereist zijn (altijd
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

Elke tool die met `api.registerTool(...)` wordt geregistreerd, moet ook worden gedeclareerd in het
Plugin-manifest:

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
manifestcontract verklaart alleen eigendom en vindbaarheid; uitvoering roept nog steeds
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
- Tools met misvormde registratieobjecten, inclusief ontbrekende `parameters`, worden overgeslagen en gemeld in plugin-diagnostiek in plaats van agent-runs te onderbreken
- Gebruik `optional: true` voor tools met neveneffecten of extra binaire vereisten
- Gebruikers kunnen alle tools van een plugin inschakelen door de plugin-id toe te voegen aan `tools.allow`

## CLI-opdrachten registreren

Plugins kunnen hoofdgroepen voor `openclaw`-opdrachten toevoegen met `api.registerCli`. Geef
`descriptors` op voor elke opdrachtroot op het hoogste niveau, zodat OpenClaw de
opdracht kan tonen en routeren zonder elke plugin-runtime vooraf te laden.

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

Voor provider-plugins bewaar je providerspecifieke helpers in die barrels op pakketrootniveau,
tenzij de seam echt generiek is. Huidige gebundelde voorbeelden:

- Anthropic: Claude-streamwrappers en `service_tier`- / bètahelpers
- OpenAI: providerbouwers, helpers voor standaardmodellen, realtime providers
- OpenRouter: providerbouwer plus onboarding-/configuratiehelpers

Als een helper alleen nuttig is binnen één gebundeld providerpakket, houd deze dan op die
seam op pakketrootniveau in plaats van hem naar `openclaw/plugin-sdk/*` te promoveren.

Sommige gegenereerde `openclaw/plugin-sdk/<bundled-id>`-helperseams bestaan nog steeds voor
onderhoud van gebundelde plugins wanneer ze bijgehouden gebruik door eigenaren hebben. Behandel die als
gereserveerde oppervlakken, niet als het standaardpatroon voor nieuwe plugins van derden.

## Checklist vóór indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entry point gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-zelfimports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (plugins binnen de repository)</Check>

## Bètarelease testen

1. Let op GitHub-releasetags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Bètatags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor releaseaankondigingen.
2. Test je plugin tegen de bètatag zodra die verschijnt. De periode vóór stable is meestal slechts een paar uur.
3. Plaats na het testen een bericht in de thread van je plugin in het Discord-kanaal `plugin-forum` met `all good` of wat er kapot ging. Als je nog geen thread hebt, maak er dan een.
4. Als er iets kapotgaat, open of werk een issue bij met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Plaats de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue in zowel de PR als je Discord-thread. Contributors kunnen PR's niet labelen, dus de titel is het PR-signaal voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR kunnen alsnog worden uitgebracht. Maintainers volgen deze threads tijdens bètatests.
6. Stilte betekent groen. Als je de periode mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Kanaalplugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een plugin voor een messagingkanaal
  </Card>
  <Card title="Provider-plugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een plugin voor een modelprovider
  </Card>
  <Card title="SDK-overzicht" icon="book-open" href="/nl/plugins/sdk-overview">
    Importmap en API-referentie voor registratie
  </Card>
  <Card title="Runtime-helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, zoeken, subagent via api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/nl/plugins/sdk-testing">
    Testhulpprogramma's en patronen
  </Card>
  <Card title="Pluginmanifest" icon="file-json" href="/nl/plugins/manifest">
    Volledige referentie voor manifestschema
  </Card>
</CardGroup>

## Gerelateerd

- [Pluginarchitectuur](/nl/plugins/architecture) - interne architectuur-diepgang
- [SDK-overzicht](/nl/plugins/sdk-overview) - referentie voor Plugin SDK
- [Manifest](/nl/plugins/manifest) - pluginmanifestindeling
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - kanaalplugins bouwen
- [Provider-plugins](/nl/plugins/sdk-provider-plugins) - provider-plugins bouwen
