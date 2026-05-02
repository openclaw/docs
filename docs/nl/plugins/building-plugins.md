---
read_when:
    - Je wilt een nieuwe OpenClaw-plugin maken
    - Je hebt een snelstartgids voor Plugin-ontwikkeling nodig
    - Je voegt een nieuw kanaal, een nieuwe provider, tool of andere mogelijkheid toe aan OpenClaw
sidebarTitle: Getting Started
summary: Maak binnen enkele minuten je eerste OpenClaw Plugin
title: Plugins bouwen
x-i18n:
    generated_at: "2026-05-02T20:46:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
spraak, realtime transcriptie, realtime spraak, mediabegrip, beeldgeneratie,
videogeneratie, web fetch, web search, agenttools, of elke combinatie daarvan.

Je hoeft je plugin niet toe te voegen aan de OpenClaw-repository. Publiceer naar
[ClawHub](/nl/tools/clawhub) en gebruikers installeren met
`openclaw plugins install clawhub:<package-name>`. Kale pakketspecificaties
installeren tijdens de launch-overgang nog steeds vanaf npm.

## Vereisten

- Node >= 22 en een pakketbeheerder (npm of pnpm)
- Bekendheid met TypeScript (ESM)
- Voor plugins in de repository: repository gekloond en `pnpm install` uitgevoerd. Pluginontwikkeling via een source checkout is alleen pnpm, omdat OpenClaw gebundelde
  plugins laadt uit de `extensions/*`-workspacepakketten.

## Welk soort plugin?

<CardGroup cols={3}>
  <Card title="Kanaalplugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform (Discord, IRC, enz.)
  </Card>
  <Card title="Providerplugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een modelprovider toe (LLM, proxy of aangepaste endpoint)
  </Card>
  <Card title="Tool- / hook-plugin" icon="wrench" href="/nl/plugins/hooks">
    Registreer agenttools, eventhooks of services — ga hieronder verder
  </Card>
</CardGroup>

Gebruik voor een kanaalplugin waarvan niet gegarandeerd is dat die is geïnstalleerd wanneer onboarding/setup
wordt uitgevoerd `createOptionalChannelSetupSurface(...)` uit
`openclaw/plugin-sdk/channel-setup`. Dit produceert een setupadapter + wizardpaar
dat de installatievereiste aankondigt en gesloten faalt bij echte configuratieschrijfacties
totdat de plugin is geïnstalleerd.

## Snelstart: toolplugin

Deze walkthrough maakt een minimale plugin die een agenttool registreert. Kanaal-
en providerplugins hebben eigen handleidingen die hierboven zijn gelinkt.

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

    Elke plugin heeft een manifest nodig, zelfs zonder configuratie. Runtime-geregistreerde tools
    moeten worden vermeld in `contracts.tools`, zodat OpenClaw de eigenaar-plugin kan ontdekken
    zonder elke pluginruntime te laden. Plugins moeten ook
    `activation.onStartup` bewust declareren. Dit voorbeeld stelt dit in op `true`. Zie
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

    `definePluginEntry` is bedoeld voor niet-kanaalplugins. Gebruik voor kanalen
    `defineChannelPluginEntry` — zie [Kanaalplugins](/nl/plugins/sdk-channel-plugins).
    Zie [Entrypoints](/nl/plugins/sdk-entrypoints) voor alle entrypointopties.

  </Step>

  <Step title="Test en publiceer">

    **Externe plugins:** valideer en publiceer met ClawHub, installeer daarna:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Kale pakketspecificaties zoals `@myorg/openclaw-my-plugin` installeren tijdens
    de launch-overgang vanaf npm. Gebruik `clawhub:` wanneer je ClawHub-resolutie wilt.

    **Plugins in de repository:** plaats ze onder de gebundelde plugin-workspaceboom — ze worden automatisch ontdekt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-mogelijkheden

Eén plugin kan elk aantal mogelijkheden registreren via het `api`-object:

| Mogelijkheid           | Registratiemethode                              | Gedetailleerde handleiding                                                       |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Tekstinferentie (LLM)  | `api.registerProvider(...)`                      | [Providerplugins](/nl/plugins/sdk-provider-plugins)                                |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | [CLI-backends](/nl/gateway/cli-backends)                                           |
| Kanaal / messaging     | `api.registerChannel(...)`                       | [Kanaalplugins](/nl/plugins/sdk-channel-plugins)                                   |
| Spraak (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime spraak        | `api.registerRealtimeVoiceProvider(...)`         | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Beeldgeneratie         | `api.registerImageGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Muziekgeneratie        | `api.registerMusicGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogeneratie         | `api.registerVideoGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Toolresultaat-middleware | `api.registerAgentToolResultMiddleware(...)`   | [SDK-overzicht](/nl/plugins/sdk-overview#registration-api)                         |
| Agenttools             | `api.registerTool(...)`                          | Hieronder                                                                       |
| Aangepaste opdrachten  | `api.registerCommand(...)`                       | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| Pluginhooks            | `api.on(...)`                                    | [Pluginhooks](/nl/plugins/hooks)                                                   |
| Interne eventhooks     | `api.registerHook(...)`                          | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| HTTP-routes            | `api.registerHttpRoute(...)`                     | [Internals](/nl/plugins/architecture-internals#gateway-http-routes)                |
| CLI-subopdrachten      | `api.registerCli(...)`                           | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |

Zie [SDK-overzicht](/nl/plugins/sdk-overview#registration-api) voor de volledige registratie-API.

Gebundelde plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer ze
asynchrone herschrijving van toolresultaten nodig hebben voordat het model de uitvoer ziet. Declareer de
beoogde runtimes in `contracts.agentToolResultMiddleware`, bijvoorbeeld
`["pi", "codex"]`. Dit is een vertrouwde seam voor gebundelde plugins; externe
plugins moeten gewone OpenClaw-pluginhooks verkiezen, tenzij OpenClaw een
expliciet vertrouwensbeleid voor deze mogelijkheid krijgt.

Als je plugin aangepaste Gateway-RPC-methoden registreert, houd die dan op een
pluginspecifiek prefix. Core-adminnamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd opgelost naar
`operator.admin`, zelfs als een plugin om een smallere scope vraagt.

Hook-guardsemantiek om in gedachten te houden:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` wordt behandeld als geen beslissing.
- `before_tool_call`: `{ requireApproval: true }` pauzeert agentuitvoering en vraagt de gebruiker om goedkeuring via de exec-goedkeuringsoverlay, Telegram-knoppen, Discord-interacties of de `/approve`-opdracht op elk kanaal.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` wordt behandeld als geen beslissing.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` wordt behandeld als geen beslissing.
- `message_received`: geef de voorkeur aan het getypte veld `threadId` wanneer je routering van inkomende threads/onderwerpen nodig hebt. Houd `metadata` voor kanaalspecifieke extra's.
- `message_sending`: geef de voorkeur aan getypte routeringsvelden `replyToId` / `threadId` boven kanaalspecifieke metadatasleutels.

De opdracht `/approve` verwerkt zowel exec- als plugingoedkeuringen met begrensde fallback: wanneer een exec-goedkeurings-id niet wordt gevonden, probeert OpenClaw hetzelfde id opnieuw via plugingoedkeuringen. Doorsturen van plugingoedkeuringen kan onafhankelijk worden geconfigureerd via `approvals.plugin` in config.

Als aangepaste goedkeuringsplumbing dezelfde begrensde fallbackcase moet detecteren,
gebruik dan liever `isApprovalNotFoundError` uit `openclaw/plugin-sdk/error-runtime`
in plaats van goedkeuring-vervalstrings handmatig te matchen.

Zie [Pluginhooks](/nl/plugins/hooks) voor voorbeelden en de hookreferentie.

## Agenttools registreren

Tools zijn getypeerde functies die de LLM kan aanroepen. Ze kunnen vereist (altijd
beschikbaar) of optioneel (gebruiker opt-in) zijn:

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

Elke tool die met `api.registerTool(...)` is geregistreerd, moet ook worden gedeclareerd in het
pluginmanifest:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw legt de gevalideerde descriptor van de geregistreerde tool vast en cachet die,
zodat plugins geen `description`- of schemagegevens in het manifest dupliceren. Het
manifestcontract declareert alleen eigenaarschap en ontdekking; uitvoering roept nog steeds
de live geregistreerde toolimplementatie aan.

Gebruikers schakelen optionele tools in config in:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Toolnamen mogen niet botsen met kerntools (conflicten worden overgeslagen)
- Tools met misvormde registratieobjecten, inclusief ontbrekende `parameters`, worden overgeslagen en gemeld in plugindiagnostiek in plaats van agentruns te onderbreken
- Gebruik `optional: true` voor tools met neveneffecten of extra binaire vereisten
- Gebruikers kunnen alle tools van een plugin inschakelen door de plugin-id toe te voegen aan `tools.allow`

## CLI-opdrachten registreren

Plugins kunnen root-`openclaw`-opdrachtgroepen toevoegen met `api.registerCli`. Geef
`descriptors` op voor elke root van een opdracht op het hoogste niveau, zodat OpenClaw
de opdracht kan tonen en routeren zonder elke plugin-runtime vooraf te laden.

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

Controleer na installatie de runtime-registratie en voer de opdracht uit:

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

Zie [SDK-overzicht](/nl/plugins/sdk-overview) voor de volledige subpath-referentie.

Gebruik binnen je plugin lokale barrelbestanden (`api.ts`, `runtime-api.ts`) voor
interne imports; importeer je eigen plugin nooit via het SDK-pad ervan.

Voor providerplugins bewaar je providerspecifieke helpers in die package-root
barrels, tenzij de seam echt generiek is. Huidige gebundelde voorbeelden:

- Anthropic: Claude-streamwrappers en `service_tier`-/bètahelpers
- OpenAI: providerbuilders, helpers voor standaardmodellen, realtimeproviders
- OpenRouter: providerbuilder plus onboarding-/configuratiehelpers

Als een helper alleen nuttig is binnen één gebundeld providerpakket, bewaar deze dan op die
package-root seam in plaats van deze te promoveren naar `openclaw/plugin-sdk/*`.

Sommige gegenereerde `openclaw/plugin-sdk/<bundled-id>`-helperseams bestaan nog steeds voor
onderhoud van gebundelde plugins wanneer ze bijgehouden eigenaargebruik hebben. Behandel die als
gereserveerde oppervlakken, niet als het standaardpatroon voor nieuwe plugins van derden.

## Checklist vóór indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entrypoint gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-self-imports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (plugins in de repo)</Check>

## Bètarelease testen

1. Let op GitHub-releasetags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Bèta-tags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor releaseaankondigingen.
2. Test je plugin tegen de bèta-tag zodra deze verschijnt. Het tijdvenster vóór stable is meestal maar een paar uur.
3. Plaats na het testen in de thread van je plugin in het Discord-kanaal `plugin-forum` met `all good` of wat er kapotging. Als je nog geen thread hebt, maak er dan een.
4. Als er iets kapotgaat, open of update een issue met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Zet de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue in zowel de PR als je Discord-thread. Contributors kunnen PR's niet labelen, dus de titel is het signaal aan de PR-kant voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR kunnen toch worden uitgebracht. Maintainers volgen deze threads tijdens bètatests.
6. Stilte betekent groen. Als je het tijdvenster mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Kanaalplugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een messagingkanaalplugin
  </Card>
  <Card title="Providerplugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een modelproviderplugin
  </Card>
  <Card title="SDK-overzicht" icon="book-open" href="/nl/plugins/sdk-overview">
    Importmap en registratie-API-referentie
  </Card>
  <Card title="Runtimehelpers" icon="settings" href="/nl/plugins/sdk-runtime">
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

- [Pluginarchitectuur](/nl/plugins/architecture) — diepgaande uitleg van interne architectuur
- [SDK-overzicht](/nl/plugins/sdk-overview) — Plugin-SDK-referentie
- [Manifest](/nl/plugins/manifest) — pluginmanifestformaat
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) — kanaalplugins bouwen
- [Providerplugins](/nl/plugins/sdk-provider-plugins) — providerplugins bouwen
