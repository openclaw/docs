---
read_when:
    - Je wilt een nieuwe OpenClaw Plugin maken
    - Je hebt een snelstartgids voor Plugin-ontwikkeling nodig
    - Je voegt een nieuw kanaal, provider, hulpmiddel of andere mogelijkheid toe aan OpenClaw
sidebarTitle: Getting Started
summary: Maak je eerste OpenClaw Plugin in enkele minuten
title: Plugins bouwen
x-i18n:
    generated_at: "2026-04-29T23:01:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
spraak, realtime transcriptie, realtime stem, mediabegrip, afbeeldinggeneratie,
videogeneratie, web fetch, web search, agenttools, of elke combinatie.

Je hoeft je plugin niet aan de OpenClaw-repository toe te voegen. Publiceer naar
[ClawHub](/nl/tools/clawhub) en gebruikers installeren met
`openclaw plugins install <package-name>`. OpenClaw probeert eerst ClawHub en
valt automatisch terug op npm voor pakketten die nog npm-distributie gebruiken.

## Vereisten

- Node >= 22 en een pakketbeheerder (npm of pnpm)
- Vertrouwdheid met TypeScript (ESM)
- Voor plugins in de repo: repository gekloond en `pnpm install` uitgevoerd

## Wat voor soort plugin?

<CardGroup cols={3}>
  <Card title="Kanaalplugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform (Discord, IRC, enz.)
  </Card>
  <Card title="Providerplugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een modelprovider toe (LLM, proxy of aangepast endpoint)
  </Card>
  <Card title="Tool- / hookplugin" icon="wrench" href="/nl/plugins/hooks">
    Registreer agenttools, eventhooks of services — ga hieronder verder
  </Card>
</CardGroup>

Gebruik voor een kanaalplugin waarvan niet gegarandeerd is dat die is geïnstalleerd wanneer onboarding/setup
wordt uitgevoerd `createOptionalChannelSetupSurface(...)` uit
`openclaw/plugin-sdk/channel-setup`. Dit maakt een setupadapter + wizardpaar
dat de installatievereiste vermeldt en echt schrijven naar configuratie gesloten laat falen
totdat de plugin is geïnstalleerd.

## Snel starten: toolplugin

Deze walkthrough maakt een minimale plugin die een agenttool registreert. Kanaal-
en providerplugins hebben eigen handleidingen waar hierboven naar wordt gelinkt.

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

    Elke plugin heeft een manifest nodig, zelfs zonder configuratie, en elke plugin hoort
    `activation.onStartup` bewust te declareren. Runtime-geregistreerde tools hebben
    startup-import nodig, dus dit voorbeeld stelt dit in op `true`. Zie
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

    OpenClaw controleert ook ClawHub vóór npm voor kale pakketspecificaties zoals
    `@myorg/openclaw-my-plugin`; npm blijft een fallback voor pakketten die nog
    niet naar ClawHub zijn gemigreerd.

    **Plugins in de repo:** plaats ze onder de gebundelde plugin-workspaceboom — automatisch ontdekt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Pluginmogelijkheden

Eén plugin kan een willekeurig aantal mogelijkheden registreren via het `api`-object:

| Mogelijkheid           | Registratiemethode                              | Gedetailleerde handleiding                                                       |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Tekstinferentie (LLM)  | `api.registerProvider(...)`                      | [Providerplugins](/nl/plugins/sdk-provider-plugins)                                |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | [CLI-backends](/nl/gateway/cli-backends)                                           |
| Kanaal / berichten     | `api.registerChannel(...)`                       | [Kanaalplugins](/nl/plugins/sdk-channel-plugins)                                   |
| Spraak (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Realtime stem          | `api.registerRealtimeVoiceProvider(...)`         | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Afbeeldinggeneratie    | `api.registerImageGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Muziekgeneratie        | `api.registerMusicGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Videogeneratie         | `api.registerVideoGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web search             | `api.registerWebSearchProvider(...)`             | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Toolresultaatmiddleware | `api.registerAgentToolResultMiddleware(...)`     | [SDK-overzicht](/nl/plugins/sdk-overview#registration-api)                         |
| Agenttools             | `api.registerTool(...)`                          | Hieronder                                                                       |
| Aangepaste opdrachten  | `api.registerCommand(...)`                       | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| Pluginhooks            | `api.on(...)`                                    | [Pluginhooks](/nl/plugins/hooks)                                                   |
| Interne eventhooks     | `api.registerHook(...)`                          | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| HTTP-routes            | `api.registerHttpRoute(...)`                     | [Internals](/nl/plugins/architecture-internals#gateway-http-routes)                |
| CLI-subopdrachten      | `api.registerCli(...)`                           | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |

Zie [SDK-overzicht](/nl/plugins/sdk-overview#registration-api) voor de volledige registratie-API.

Gebundelde plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer ze
asynchrone herschrijving van toolresultaten nodig hebben voordat het model de output ziet. Declareer de
gerichte runtimes in `contracts.agentToolResultMiddleware`, bijvoorbeeld
`["pi", "codex"]`. Dit is een vertrouwde seam voor gebundelde plugins; externe
plugins horen reguliere OpenClaw-pluginhooks te gebruiken tenzij OpenClaw een
expliciet vertrouwensbeleid voor deze mogelijkheid krijgt.

Als je plugin aangepaste Gateway-RPC-methoden registreert, houd ze dan op een
plugin-specifiek prefix. Core-adminnamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en worden altijd opgelost naar
`operator.admin`, zelfs als een plugin om een smallere scope vraagt.

Hook-guardsemantiek om rekening mee te houden:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` wordt behandeld als geen beslissing.
- `before_tool_call`: `{ requireApproval: true }` pauzeert agentuitvoering en vraagt de gebruiker om goedkeuring via de exec-goedkeuringsoverlay, Telegram-knoppen, Discord-interacties of de opdracht `/approve` op elk kanaal.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` wordt behandeld als geen beslissing.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` wordt behandeld als geen beslissing.
- `message_received`: geef de voorkeur aan het getypeerde veld `threadId` wanneer je inkomende thread-/topicrouting nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: geef de voorkeur aan getypeerde routingvelden `replyToId` / `threadId` boven kanaalspecifieke metadatasleutels.

De opdracht `/approve` verwerkt zowel exec- als plugingoedkeuringen met begrensde fallback: wanneer een exec-goedkeurings-id niet wordt gevonden, probeert OpenClaw hetzelfde id opnieuw via plugingoedkeuringen. Doorsturen van plugingoedkeuringen kan onafhankelijk worden geconfigureerd via `approvals.plugin` in config.

Als aangepaste goedkeuringsplumbing hetzelfde begrensde fallbackgeval moet detecteren,
gebruik dan bij voorkeur `isApprovalNotFoundError` uit `openclaw/plugin-sdk/error-runtime`
in plaats van handmatig approval-expiry-strings te matchen.

Zie [Pluginhooks](/nl/plugins/hooks) voor voorbeelden en de hookreferentie.

## Agenttools registreren

Tools zijn getypeerde functies die de LLM kan aanroepen. Ze kunnen vereist zijn (altijd
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

- Toolnamen mogen niet botsen met coretools (conflicten worden overgeslagen)
- Tools met misvormde registratieobjecten, inclusief ontbrekende `parameters`, worden overgeslagen en gemeld in plugindiagnostiek in plaats van agentruns te breken
- Gebruik `optional: true` voor tools met side effects of extra binaire vereisten
- Gebruikers kunnen alle tools van een plugin inschakelen door de plugin-id toe te voegen aan `tools.allow`

## Importconventies

Importeer altijd uit gerichte paden `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Zie [SDK-overzicht](/nl/plugins/sdk-overview) voor de volledige subpadreferentie.

Gebruik binnen je plugin lokale barrel-bestanden (`api.ts`, `runtime-api.ts`) voor
interne imports — importeer je eigen plugin nooit via het SDK-pad.

Houd voor providerplugins providerspecifieke helpers in die package-root
barrels, tenzij de seam echt generiek is. Huidige gebundelde voorbeelden:

- Anthropic: Claude-streamwrappers en `service_tier` / betahelpers
- OpenAI: providerbouwers, helpers voor standaardmodellen, realtimeproviders
- OpenRouter: providerbouwer plus onboarding-/configuratiehelpers

Als een helper alleen nuttig is binnen één gebundeld providerpackage, houd deze dan op die
package-root seam in plaats van deze te promoveren naar `openclaw/plugin-sdk/*`.

Sommige gegenereerde helper-seams voor `openclaw/plugin-sdk/<bundled-id>` bestaan nog steeds voor
onderhoud van gebundelde plugins wanneer ze gevolgd eigenaarsgebruik hebben. Behandel die als
gereserveerde surfaces, niet als het standaardpatroon voor nieuwe plugins van derden.

## Checklist vóór indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entry point gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-self-imports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (plugins in de repo)</Check>

## Testen van betareleases

1. Let op GitHub-releasetags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Betatags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor releaseaankondigingen.
2. Test je plugin tegen de betatag zodra die verschijnt. De periode vóór stable is meestal maar een paar uur.
3. Plaats na het testen een bericht in de thread van je plugin in het Discord-kanaal `plugin-forum` met `all good` of wat er kapot ging. Als je nog geen thread hebt, maak er dan een.
4. Als er iets kapotgaat, open of update dan een issue met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Zet de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue in zowel de PR als je Discord-thread. Contributors kunnen PR's niet labelen, dus de titel is het PR-signaal voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR kunnen toch worden uitgebracht. Maintainers volgen deze threads tijdens bètatests.
6. Stilte betekent groen. Als je de periode mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Kanaalplugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een messagingkanaalplugin
  </Card>
  <Card title="Providerplugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een modelproviderplugin
  </Card>
  <Card title="SDK-overzicht" icon="book-open" href="/nl/plugins/sdk-overview">
    Importmap en referentie voor de registratie-API
  </Card>
  <Card title="Runtimehelpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, zoeken, subagent via api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en patronen
  </Card>
  <Card title="Pluginmanifest" icon="file-json" href="/nl/plugins/manifest">
    Volledige schemareferentie voor het manifest
  </Card>
</CardGroup>

## Gerelateerd

- [Pluginarchitectuur](/nl/plugins/architecture) — diepgaande uitleg van de interne architectuur
- [SDK-overzicht](/nl/plugins/sdk-overview) — referentie voor de Plugin-SDK
- [Manifest](/nl/plugins/manifest) — manifestindeling voor plugins
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) — kanaalplugins bouwen
- [Providerplugins](/nl/plugins/sdk-provider-plugins) — providerplugins bouwen
