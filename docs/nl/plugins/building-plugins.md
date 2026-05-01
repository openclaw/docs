---
read_when:
    - Je wilt een nieuwe OpenClaw-Plugin maken
    - Je hebt een snelstartgids voor Plugin-ontwikkeling nodig
    - Je voegt een nieuw kanaal, nieuwe provider, nieuwe tool of andere mogelijkheid toe aan OpenClaw
sidebarTitle: Getting Started
summary: Maak je eerste OpenClaw Plugin in enkele minuten
title: Plugins bouwen
x-i18n:
    generated_at: "2026-05-01T11:21:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c80b831161c93b0a7f65baf1ccea705ccc27b8226180c0fd0ef15fbbefa3d83
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
spraak, realtime transcriptie, realtime spraak, mediabegrip, afbeeldinggeneratie,
videogeneratie, web fetch, web search, agenttools, of elke
combinatie.

Je hoeft je Plugin niet aan de OpenClaw-repository toe te voegen. Publiceer naar
[ClawHub](/nl/tools/clawhub) en gebruikers installeren met
`openclaw plugins install <package-name>`. OpenClaw probeert eerst ClawHub en
valt automatisch terug op npm voor pakketten die nog npm-distributie gebruiken.

## Vereisten

- Node >= 22 en een pakketbeheerder (npm of pnpm)
- Vertrouwdheid met TypeScript (ESM)
- Voor Plugins in de repository: repository gekloond en `pnpm install` uitgevoerd

## Welk soort Plugin?

<CardGroup cols={3}>
  <Card title="Kanaal-Plugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform (Discord, IRC, enz.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een modelprovider toe (LLM, proxy, of aangepast eindpunt)
  </Card>
  <Card title="Tool- / hook-Plugin" icon="wrench" href="/nl/plugins/hooks">
    Registreer agenttools, event hooks, of services — ga hieronder verder
  </Card>
</CardGroup>

Gebruik voor een kanaal-Plugin waarvan niet gegarandeerd is dat die is geinstalleerd wanneer onboarding/setup
wordt uitgevoerd `createOptionalChannelSetupSurface(...)` uit
`openclaw/plugin-sdk/channel-setup`. Dit maakt een setupadapter + wizardpaar
dat de installatievereiste aankondigt en veilig faalt bij echte config-schrijfacties
totdat de Plugin is geinstalleerd.

## Snelstart: tool-Plugin

Deze walkthrough maakt een minimale Plugin die een agenttool registreert. Kanaal-
en provider-Plugins hebben eigen handleidingen die hierboven zijn gelinkt.

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

    Elke Plugin heeft een manifest nodig, zelfs zonder config, en elke Plugin moet
    `activation.onStartup` bewust declareren. Runtime-geregistreerde tools hebben
    opstartimport nodig, dus dit voorbeeld zet dit op `true`. Zie
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

    `definePluginEntry` is bedoeld voor niet-kanaal-Plugins. Gebruik voor kanalen
    `defineChannelPluginEntry` — zie [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins).
    Zie [Entrypoints](/nl/plugins/sdk-entrypoints) voor alle entrypointopties.

  </Step>

  <Step title="Test en publiceer">

    **Externe Plugins:** valideer en publiceer met ClawHub, installeer daarna:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw controleert ClawHub ook voor npm bij kale pakketspecificaties zoals
    `@myorg/openclaw-my-plugin`; npm blijft een fallback voor pakketten die
    nog niet naar ClawHub zijn gemigreerd.

    **Plugins in de repository:** plaats ze onder de meegeleverde Plugin-workspaceboom — automatisch ontdekt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-mogelijkheden

Een enkele Plugin kan een willekeurig aantal mogelijkheden registreren via het `api`-object:

| Mogelijkheid           | Registratiemethode                              | Gedetailleerde handleiding                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Tekstinferentie (LLM)  | `api.registerProvider(...)`                      | [Provider-Plugins](/nl/plugins/sdk-provider-plugins)                               |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | [CLI-backends](/nl/gateway/cli-backends)                                           |
| Kanaal / berichten     | `api.registerChannel(...)`                       | [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins)                                  |
| Spraak (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime spraak        | `api.registerRealtimeVoiceProvider(...)`         | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Afbeeldinggeneratie    | `api.registerImageGenerationProvider(...)`       | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Muziekgeneratie        | `api.registerMusicGenerationProvider(...)`       | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogeneratie         | `api.registerVideoGenerationProvider(...)`       | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Toolresultaatmiddleware | `api.registerAgentToolResultMiddleware(...)`    | [SDK-overzicht](/nl/plugins/sdk-overview#registration-api)                         |
| Agenttools             | `api.registerTool(...)`                          | Hieronder                                                                       |
| Aangepaste opdrachten  | `api.registerCommand(...)`                       | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/nl/plugins/hooks)                                                  |
| Interne event hooks    | `api.registerHook(...)`                          | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| HTTP-routes            | `api.registerHttpRoute(...)`                     | [Internals](/nl/plugins/architecture-internals#gateway-http-routes)                |
| CLI-subopdrachten      | `api.registerCli(...)`                           | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |

Zie [SDK-overzicht](/nl/plugins/sdk-overview#registration-api) voor de volledige registratie-API.

Meegeleverde Plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer ze
asynchrone herschrijving van toolresultaten nodig hebben voordat het model de uitvoer ziet. Declareer de
gerichte runtimes in `contracts.agentToolResultMiddleware`, bijvoorbeeld
`["pi", "codex"]`. Dit is een vertrouwde seam voor meegeleverde Plugins; externe
Plugins moeten de voorkeur geven aan reguliere OpenClaw Plugin hooks tenzij OpenClaw een
expliciet vertrouwensbeleid voor deze mogelijkheid ontwikkelt.

Als je Plugin aangepaste Gateway RPC-methoden registreert, houd ze dan op een
Plugin-specifieke prefix. Core-adminnamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd naar
`operator.admin` geresolvd, zelfs als een Plugin om een smallere scope vraagt.

Hook-guardsemantiek om rekening mee te houden:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` wordt behandeld als geen beslissing.
- `before_tool_call`: `{ requireApproval: true }` pauzeert agentuitvoering en vraagt de gebruiker om goedkeuring via de exec-goedkeuringsoverlay, Telegram-knoppen, Discord-interacties, of de `/approve`-opdracht op elk kanaal.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` wordt behandeld als geen beslissing.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` wordt behandeld als geen beslissing.
- `message_received`: geef de voorkeur aan het getypte veld `threadId` wanneer je inkomende thread-/topicroutering nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: geef de voorkeur aan getypte routeringsvelden `replyToId` / `threadId` boven kanaalspecifieke metadatasleutels.

De opdracht `/approve` verwerkt zowel exec- als Plugin-goedkeuringen met begrensde fallback: wanneer een exec-goedkeurings-id niet wordt gevonden, probeert OpenClaw hetzelfde id opnieuw via Plugin-goedkeuringen. Doorsturen van Plugin-goedkeuringen kan onafhankelijk worden geconfigureerd via `approvals.plugin` in config.

Als aangepaste goedkeuringsplumbing diezelfde begrensde fallbackcase moet detecteren,
geef dan de voorkeur aan `isApprovalNotFoundError` uit `openclaw/plugin-sdk/error-runtime`
in plaats van goedkeuringsvervalstrings handmatig te matchen.

Zie [Plugin hooks](/nl/plugins/hooks) voor voorbeelden en de hookreferentie.

## Agenttools registreren

Tools zijn getypte functies die de LLM kan aanroepen. Ze kunnen vereist zijn (altijd
beschikbaar) of optioneel (opt-in door gebruiker):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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

Gebruikers schakelen optionele tools in config in:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Toolnamen mogen niet botsen met core-tools (conflicten worden overgeslagen)
- Tools met ongeldige registratieobjecten, inclusief ontbrekende `parameters`, worden overgeslagen en gerapporteerd in Plugin-diagnostiek in plaats van agentruns te breken
- Gebruik `optional: true` voor tools met bijwerkingen of extra binaire vereisten
- Gebruikers kunnen alle tools van een Plugin inschakelen door het Plugin-id toe te voegen aan `tools.allow`

## CLI-opdrachten registreren

Plugins kunnen root-`openclaw`-opdrachtgroepen toevoegen met `api.registerCli`. Geef
`descriptors` op voor elke opdrachtroot op topniveau zodat OpenClaw de opdracht kan tonen en routeren
zonder elke Plugin-runtime vooraf te laden.

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

Controleer na installatie de runtimeregistratie en voer de opdracht uit:

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

Gebruik binnen je Plugin lokale barrel-bestanden (`api.ts`, `runtime-api.ts`) voor
interne imports — importeer nooit je eigen Plugin via het SDK-pad ervan.

Houd voor provider-Plugins provider-specifieke helpers in die package-root
barrels, tenzij de naad echt generiek is. Huidige meegeleverde voorbeelden:

- Anthropic: Claude-streamwrappers en `service_tier` / beta-helpers
- OpenAI: provider-builders, helpers voor standaardmodellen, realtime providers
- OpenRouter: provider-builder plus helpers voor onboarding/configuratie

Als een helper alleen nuttig is binnen één meegeleverd provider-package, houd die dan op die
package-root-naad in plaats van hem te promoveren naar `openclaw/plugin-sdk/*`.

Sommige gegenereerde `openclaw/plugin-sdk/<bundled-id>`-helpernaden bestaan nog steeds voor
onderhoud van meegeleverde Plugins wanneer ze bijgehouden eigenaarsgebruik hebben. Behandel die als
gereserveerde oppervlakken, niet als het standaardpatroon voor nieuwe externe Plugins.

## Controlelijst vóór indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entry point gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-self-imports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (Plugins in de repo)</Check>

## Beta-release testen

1. Let op GitHub-release-tags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Beta-tags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor release-aankondigingen.
2. Test je Plugin tegen de beta-tag zodra die verschijnt. Het venster vóór stable is meestal maar een paar uur.
3. Plaats na het testen een bericht in de thread van je Plugin in het Discord-kanaal `plugin-forum` met `all good` of wat er kapotging. Als je nog geen thread hebt, maak er dan een aan.
4. Als er iets kapotgaat, open of update dan een issue met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Zet de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue in zowel de PR als je Discord-thread. Bijdragers kunnen PR's niet labelen, dus de titel is het signaal aan PR-zijde voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR kunnen toch worden uitgebracht. Maintainers volgen deze threads tijdens beta-tests.
6. Stilte betekent groen. Als je het venster mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Kanaal-Plugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een Plugin voor een berichtenkanaal
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een Plugin voor een modelprovider
  </Card>
  <Card title="SDK-overzicht" icon="book-open" href="/nl/plugins/sdk-overview">
    Importmap en API-referentie voor registratie
  </Card>
  <Card title="Runtimehelpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, zoeken, subagent via api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en patronen
  </Card>
  <Card title="Plugin-manifest" icon="file-json" href="/nl/plugins/manifest">
    Volledige schemareferentie voor het manifest
  </Card>
</CardGroup>

## Gerelateerd

- [Plugin Architecture](/nl/plugins/architecture) — diepgaande interne architectuur
- [SDK Overview](/nl/plugins/sdk-overview) — Plugin SDK-referentie
- [Manifest](/nl/plugins/manifest) — Plugin-manifestindeling
- [Channel Plugins](/nl/plugins/sdk-channel-plugins) — kanaal-Plugins bouwen
- [Provider Plugins](/nl/plugins/sdk-provider-plugins) — provider-Plugins bouwen
