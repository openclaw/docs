---
read_when:
    - Je wilt een nieuwe OpenClaw-Plugin maken
    - Je hebt een snelstart voor Plugin-ontwikkeling nodig
    - Je voegt een nieuw kanaal, een nieuwe provider, een nieuwe tool of een andere mogelijkheid toe aan OpenClaw
sidebarTitle: Getting Started
summary: Maak in enkele minuten je eerste OpenClaw Plugin
title: Plugins bouwen
x-i18n:
    generated_at: "2026-05-04T07:06:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
spraak, realtime transcriptie, realtime spraak, mediabegrip, afbeelding
genereren, video genereren, web-fetch, webzoekopdrachten, agent-tools of elke
combinatie daarvan.

Je hoeft je Plugin niet aan de OpenClaw-repository toe te voegen. Publiceer naar
[ClawHub](/nl/tools/clawhub) en gebruikers installeren met
`openclaw plugins install clawhub:<package-name>`. Kale pakketspecificaties
installeren tijdens de lanceringsomschakeling nog steeds vanaf npm.

## Vereisten

- Node >= 22 en een package manager (npm of pnpm)
- Vertrouwdheid met TypeScript (ESM)
- Voor Plugins in de repository: repository gekloond en `pnpm install` uitgevoerd. Pluginontwikkeling vanuit een source-checkout is alleen pnpm, omdat OpenClaw gebundelde
  Plugins laadt vanuit de workspace-pakketten `extensions/*`.

## Wat voor soort Plugin?

<CardGroup cols={3}>
  <Card title="Kanaal-Plugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform (Discord, IRC, enz.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een modelprovider toe (LLM, proxy of aangepast endpoint)
  </Card>
  <Card title="Tool- / hook-Plugin" icon="wrench" href="/nl/plugins/hooks">
    Registreer agent-tools, event-hooks of services — ga hieronder verder
  </Card>
</CardGroup>

Gebruik voor een kanaal-Plugin waarvan niet gegarandeerd is dat die is
geïnstalleerd wanneer onboarding/setup wordt uitgevoerd
`createOptionalChannelSetupSurface(...)` uit
`openclaw/plugin-sdk/channel-setup`. Dit maakt een setup-adapter + wizard-paar
dat de installatievereiste aangeeft en echte configuratieschrijfacties gesloten
laat falen totdat de Plugin is geïnstalleerd.

## Snelstart: tool-Plugin

Deze walkthrough maakt een minimale Plugin die een agent-tool registreert. Kanaal-
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

    Elke Plugin heeft een manifest nodig, zelfs zonder configuratie. Runtime-geregistreerde tools
    moeten in `contracts.tools` worden vermeld, zodat OpenClaw de eigenaar-
    Plugin kan vinden zonder elke Plugin-runtime te laden. Plugins moeten ook
    `activation.onStartup` bewust declareren. Dit voorbeeld zet dit op `true`. Zie
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
    `defineChannelPluginEntry` — zie [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins).
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

    **Plugins in de repository:** plaats ze onder de workspace-boom voor gebundelde Plugins — automatisch ontdekt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Pluginmogelijkheden

Een enkele Plugin kan elk aantal mogelijkheden registreren via het `api`-object:

| Mogelijkheid           | Registratiemethode                              | Gedetailleerde handleiding                                                       |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Tekstinferentie (LLM)  | `api.registerProvider(...)`                      | [Provider-Plugins](/nl/plugins/sdk-provider-plugins)                               |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | [CLI-backends](/nl/gateway/cli-backends)                                           |
| Kanaal / berichten     | `api.registerChannel(...)`                       | [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins)                                  |
| Spraak (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime spraak        | `api.registerRealtimeVoiceProvider(...)`         | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Afbeelding genereren   | `api.registerImageGenerationProvider(...)`       | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Muziek genereren       | `api.registerMusicGenerationProvider(...)`       | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video genereren        | `api.registerVideoGenerationProvider(...)`       | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-fetch              | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Webzoekopdracht        | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware voor toolresultaten | `api.registerAgentToolResultMiddleware(...)`     | [SDK-overzicht](/nl/plugins/sdk-overview#registration-api)                         |
| Agent-tools            | `api.registerTool(...)`                          | Hieronder                                                                       |
| Aangepaste opdrachten  | `api.registerCommand(...)`                       | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| Plugin-hooks           | `api.on(...)`                                    | [Plugin-hooks](/nl/plugins/hooks)                                                  |
| Interne event-hooks    | `api.registerHook(...)`                          | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| HTTP-routes            | `api.registerHttpRoute(...)`                     | [Internals](/nl/plugins/architecture-internals#gateway-http-routes)                |
| CLI-subopdrachten      | `api.registerCli(...)`                           | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |

Zie [SDK-overzicht](/nl/plugins/sdk-overview#registration-api) voor de volledige registratie-API.

Gebundelde Plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer ze
asynchroon herschrijven van toolresultaten nodig hebben voordat het model de uitvoer ziet. Declareer de
gerichte runtimes in `contracts.agentToolResultMiddleware`, bijvoorbeeld
`["pi", "codex"]`. Dit is een vertrouwde naad voor gebundelde Plugins; externe
Plugins moeten de voorkeur geven aan gewone OpenClaw Plugin-hooks, tenzij OpenClaw een
expliciet vertrouwensbeleid voor deze mogelijkheid krijgt.

Als je Plugin aangepaste Gateway-RPC-methoden registreert, houd die dan op een
Plugin-specifiek prefix. Core-adminnamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en resolven altijd naar
`operator.admin`, zelfs als een Plugin om een beperktere scope vraagt.

Hook-guardsemantiek om rekening mee te houden:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` wordt behandeld als geen beslissing.
- `before_tool_call`: `{ requireApproval: true }` pauzeert de agentuitvoering en vraagt de gebruiker om goedkeuring via de exec-goedkeuringsoverlay, Telegram-knoppen, Discord-interacties of de opdracht `/approve` op elk kanaal.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` wordt behandeld als geen beslissing.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` wordt behandeld als geen beslissing.
- `message_received`: geef de voorkeur aan het getypte veld `threadId` wanneer je routering voor inkomende threads/topics nodig hebt. Houd `metadata` voor kanaalspecifieke extra's.
- `message_sending`: geef de voorkeur aan getypte routeringsvelden `replyToId` / `threadId` boven kanaalspecifieke metadatasleutels.

De opdracht `/approve` verwerkt zowel exec- als Plugin-goedkeuringen met begrensde fallback: wanneer een exec-goedkeurings-id niet wordt gevonden, probeert OpenClaw hetzelfde id opnieuw via Plugin-goedkeuringen. Doorsturen van Plugin-goedkeuringen kan onafhankelijk worden geconfigureerd via `approvals.plugin` in de configuratie.

Als aangepaste goedkeuringsplumbing diezelfde begrensde fallbackcase moet detecteren,
geef dan de voorkeur aan `isApprovalNotFoundError` uit `openclaw/plugin-sdk/error-runtime`
in plaats van handmatig goedkeuringsverloopstrings te matchen.

Zie [Plugin-hooks](/nl/plugins/hooks) voor voorbeelden en de hookreferentie.

## Agent-tools registreren

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
zodat plugins geen `description` of schemagegevens in het manifest dupliceren. Het
manifestcontract declareert alleen eigenaarschap en discovery; uitvoering roept nog steeds
de live geregistreerde toolimplementatie aan.
Stel `toolMetadata.<tool>.optional: true` in voor tools die zijn geregistreerd met
`api.registerTool(..., { optional: true })`, zodat OpenClaw het laden van die
pluginruntime kan vermijden totdat de tool expliciet op de allowlist staat.

Gebruikers schakelen optionele tools in via de configuratie:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Toolnamen mogen niet botsen met core-tools (conflicten worden overgeslagen)
- Tools met onjuist gevormde registratieobjecten, inclusief ontbrekende `parameters`, worden overgeslagen en gerapporteerd in plugindiagnostiek in plaats van agentruns te breken
- Gebruik `optional: true` voor tools met bijwerkingen of extra binaire vereisten
- Gebruikers kunnen alle tools van een plugin inschakelen door de plugin-id toe te voegen aan `tools.allow`

## CLI-commando's registreren

Plugins kunnen root-`openclaw`-commandogroepen toevoegen met `api.registerCli`. Geef
`descriptors` op voor elke commandoroot op het hoogste niveau, zodat OpenClaw het
commando kan tonen en routeren zonder elke pluginruntime eager te laden.

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

Controleer na installatie de runtimeregistratie en voer het commando uit:

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

Gebruik binnen je plugin lokale barrel-bestanden (`api.ts`, `runtime-api.ts`) voor
interne imports — importeer je eigen plugin nooit via het SDK-pad ervan.

Houd voor providerplugins provider-specifieke helpers in die package-root
barrels, tenzij de seam echt generiek is. Huidige gebundelde voorbeelden:

- Anthropic: Claude-streamwrappers en `service_tier` / betahelpers
- OpenAI: providerbuilders, helpers voor standaardmodellen, realtime providers
- OpenRouter: providerbuilder plus onboarding-/configuratiehelpers

Als een helper alleen nuttig is binnen één gebundeld providerpackage, houd die dan op die
package-root seam in plaats van deze te promoveren naar `openclaw/plugin-sdk/*`.

Sommige gegenereerde `openclaw/plugin-sdk/<bundled-id>`-helperseams bestaan nog steeds voor
onderhoud van gebundelde plugins wanneer ze bijgehouden eigenaarsgebruik hebben. Behandel deze als
gereserveerde oppervlakken, niet als het standaardpatroon voor nieuwe plugins van derden.

## Checklist vóór indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entry point gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-self-imports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (plugins binnen de repo)</Check>

## Betareleasetests

1. Let op GitHub-releasetags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Betatags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor releaseaankondigingen.
2. Test je plugin tegen de betatag zodra deze verschijnt. De periode vóór stable is meestal maar een paar uur.
3. Plaats na het testen een bericht in de thread van je plugin in het Discord-kanaal `plugin-forum` met `all good` of wat er kapotging. Als je nog geen thread hebt, maak er dan een.
4. Als er iets kapotgaat, open of update dan een issue met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Zet de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue zowel in de PR als in je Discord-thread. Contributors kunnen PR's niet labelen, dus de titel is het PR-signaal voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR worden mogelijk toch gereleased. Maintainers volgen deze threads tijdens betatests.
6. Stilte betekent groen. Als je de periode mist, komt je fix waarschijnlijk in de volgende cyclus terecht.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een messaging-channelplugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een modelproviderplugin
  </Card>
  <Card title="SDK-overzicht" icon="book-open" href="/nl/plugins/sdk-overview">
    Importmap en registratie-API-referentie
  </Card>
  <Card title="Runtimehelpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, zoeken, subagent via api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en patronen
  </Card>
  <Card title="Pluginmanifest" icon="file-json" href="/nl/plugins/manifest">
    Volledige referentie voor manifestschema
  </Card>
</CardGroup>

## Gerelateerd

- [Pluginarchitectuur](/nl/plugins/architecture) — interne architectuur-deep dive
- [SDK-overzicht](/nl/plugins/sdk-overview) — Plugin SDK-referentie
- [Manifest](/nl/plugins/manifest) — pluginmanifestindeling
- [Channel Plugins](/nl/plugins/sdk-channel-plugins) — channelplugins bouwen
- [Provider Plugins](/nl/plugins/sdk-provider-plugins) — providerplugins bouwen
