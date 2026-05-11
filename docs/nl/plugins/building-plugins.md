---
read_when:
    - Je wilt een nieuwe OpenClaw Plugin maken
    - Je hebt een snelstartgids voor Plugin-ontwikkeling nodig
    - Je voegt een nieuw kanaal, een nieuwe aanbieder, een nieuw hulpmiddel of een andere mogelijkheid toe aan OpenClaw
sidebarTitle: Getting Started
summary: Maak binnen enkele minuten je eerste OpenClaw Plugin
title: Plugins bouwen
x-i18n:
    generated_at: "2026-05-11T20:37:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 320ea03395cd702e62831e3b6bb3e44443b4a00701f3e6d35d7c9e556e3bb258
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
spraak, realtime transcriptie, realtime spraak, mediabegrip, beeldgeneratie,
videogeneratie, web-fetch, webzoekopdrachten, agenttools of elke gewenste
combinatie.

Je hoeft je plugin niet toe te voegen aan de OpenClaw-repository. Publiceer naar
[ClawHub](/nl/clawhub) en gebruikers installeren met
`openclaw plugins install clawhub:<package-name>`. Pakketspecificaties zonder
prefix installeren tijdens de overgang bij lancering nog steeds vanaf npm.

## Vereisten

- Node >= 22 en een pakketbeheerder (npm of pnpm)
- Bekendheid met TypeScript (ESM)
- Voor plugins in de repo: repository gekloond en `pnpm install` uitgevoerd. Ontwikkeling met een
  source-checkout van plugins is alleen pnpm, omdat OpenClaw gebundelde
  plugins laadt vanuit de workspace-pakketten `extensions/*`.

## Welk soort plugin?

<CardGroup cols={3}>
  <Card title="Kanaalplugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform (Discord, IRC, enz.)
  </Card>
  <Card title="Providerplugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een modelprovider toe (LLM, proxy of aangepast endpoint)
  </Card>
  <Card title="CLI-backendplugin" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Koppel een lokale AI-CLI aan de tekstfallbackrunner van OpenClaw
  </Card>
  <Card title="Tool-/hookplugin" icon="wrench" href="/nl/plugins/hooks">
    Registreer agenttools, eventhooks of services - ga hieronder verder
  </Card>
</CardGroup>

Voor een kanaalplugin waarvan niet gegarandeerd is dat die is geïnstalleerd wanneer onboarding/setup
wordt uitgevoerd, gebruik je `createOptionalChannelSetupSurface(...)` uit
`openclaw/plugin-sdk/channel-setup`. Dit levert een setupadapter + wizard-paar op
dat de installatievereiste communiceert en echt schrijven naar configuratie geblokkeerd laat
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
    moeten worden vermeld in `contracts.tools`, zodat OpenClaw de eigenaar-plugin kan vinden
    zonder elke pluginruntime te laden. Plugins moeten ook bewust
    `activation.onStartup` declareren. Dit voorbeeld zet dit op `true`. Zie
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

    **Externe plugins:** valideer en publiceer met ClawHub en installeer daarna:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Pakketspecificaties zonder prefix zoals `@myorg/openclaw-my-plugin` installeren tijdens
    de overgang bij lancering vanaf npm. Gebruik `clawhub:` wanneer je ClawHub-resolutie wilt.

    **Plugins in de repo:** plaats ze onder de workspace-boom voor gebundelde plugins - automatisch gedetecteerd.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-mogelijkheden

Een enkele plugin kan een willekeurig aantal mogelijkheden registreren via het `api`-object:

| Mogelijkheid           | Registratiemethode                              | Gedetailleerde handleiding                                                       |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Tekstinferentie (LLM)  | `api.registerProvider(...)`                      | [Providerplugins](/nl/plugins/sdk-provider-plugins)                                |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | [CLI-backendplugins](/nl/plugins/cli-backend-plugins)                              |
| Kanaal / berichten     | `api.registerChannel(...)`                       | [Kanaalplugins](/nl/plugins/sdk-channel-plugins)                                   |
| Spraak (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Realtime spraak        | `api.registerRealtimeVoiceProvider(...)`         | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Beeldgeneratie         | `api.registerImageGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Muziekgeneratie        | `api.registerMusicGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Videogeneratie         | `api.registerVideoGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web-fetch              | `api.registerWebFetchProvider(...)`              | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Webzoekopdracht        | `api.registerWebSearchProvider(...)`             | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Toolresultaatmiddleware | `api.registerAgentToolResultMiddleware(...)`    | [SDK-overzicht](/nl/plugins/sdk-overview#registration-api)                         |
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
plugins kunnen beter reguliere OpenClaw-pluginhooks gebruiken, tenzij OpenClaw een
expliciet vertrouwensbeleid voor deze mogelijkheid krijgt.

Als je plugin aangepaste Gateway-RPC-methoden registreert, houd ze dan op een
pluginspecifieke prefix. Core-beheernamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en resolven altijd naar
`operator.admin`, zelfs als een plugin om een nauwere scope vraagt.

Hook-guardsemantiek om rekening mee te houden:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` wordt behandeld als geen beslissing.
- `before_tool_call`: `{ requireApproval: true }` pauzeert agentuitvoering en vraagt de gebruiker om goedkeuring via de exec-goedkeuringsoverlay, Telegram-knoppen, Discord-interacties of de opdracht `/approve` op elk kanaal.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` wordt behandeld als geen beslissing.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` wordt behandeld als geen beslissing.
- `message_received`: geef de voorkeur aan het getypte veld `threadId` wanneer je inkomende thread-/topicrouting nodig hebt. Bewaar `metadata` voor kanaalspecifieke extra's.
- `message_sending`: geef de voorkeur aan getypte routingvelden `replyToId` / `threadId` boven kanaalspecifieke metadatasleutels.

De opdracht `/approve` verwerkt zowel exec- als plugingoedkeuringen met begrensde fallback: wanneer een exec-goedkeurings-id niet wordt gevonden, probeert OpenClaw hetzelfde id opnieuw via plugingoedkeuringen. Doorsturen van plugingoedkeuringen kan onafhankelijk worden geconfigureerd via `approvals.plugin` in de configuratie.

Als aangepaste goedkeuringsplumbing diezelfde begrensde fallbackcase moet detecteren,
gebruik dan bij voorkeur `isApprovalNotFoundError` uit `openclaw/plugin-sdk/error-runtime`
in plaats van handmatig te matchen op strings voor verlopen goedkeuringen.

Zie [Pluginhooks](/nl/plugins/hooks) voor voorbeelden en de hookreferentie.

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

Tool-factories ontvangen een door de runtime geleverd contextobject. Gebruik
`ctx.activeModel` wanneer een tool het actieve model voor de huidige beurt moet
loggen, weergeven of zich eraan moet aanpassen. Het object kan `provider`,
`modelId` en `modelRef` bevatten. Behandel het als informatieve runtimemetadata,
niet als een beveiligingsgrens tegenover de lokale operator, geïnstalleerde
plugincode of een aangepaste OpenClaw-runtime. Houd voor gevoelige lokale tools
een expliciete opt-in van de Plugin of operator aan en faal gesloten wanneer de
actieve-modelmetadata ontbreekt of ongeschikt is.

Elke tool die met `api.registerTool(...)` wordt geregistreerd, moet ook in het
pluginmanifest worden gedeclareerd:

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

OpenClaw legt de gevalideerde descriptor van de geregistreerde tool vast en
cachet die, zodat plugins geen `description`- of schemagegevens in het manifest
dupliceren. Het manifestcontract declareert alleen eigenaarschap en ontdekking;
uitvoering roept nog steeds de live geregistreerde toolimplementatie aan.
Stel `toolMetadata.<tool>.optional: true` in voor tools die zijn geregistreerd met
`api.registerTool(..., { optional: true })`, zodat OpenClaw kan voorkomen dat die
pluginruntime wordt geladen totdat de tool expliciet op de toestaanlijst staat.

Gebruikers schakelen optionele tools in de configuratie in:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Toolnamen mogen niet botsen met kerntools (conflicten worden overgeslagen)
- Tools met onjuist gevormde registratieobjecten, inclusief ontbrekende `parameters`, worden overgeslagen en in plugindiagnostiek gerapporteerd in plaats van agentruns te onderbreken
- Gebruik `optional: true` voor tools met bijwerkingen of extra binaire vereisten
- Gebruikers kunnen alle tools van een Plugin inschakelen door de plugin-id aan `tools.allow` toe te voegen

## CLI-opdrachten registreren

Plugins kunnen root-`openclaw`-opdrachtgroepen toevoegen met `api.registerCli`. Geef
`descriptors` op voor elke opdrachtroot op topniveau, zodat OpenClaw de opdracht
kan tonen en routeren zonder elke pluginruntime vooraf te laden.

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

Importeer altijd uit gerichte `openclaw/plugin-sdk/<subpath>`-paden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Zie [SDK-overzicht](/nl/plugins/sdk-overview) voor de volledige subpadreferentie.

Gebruik binnen je Plugin lokale barrelbestanden (`api.ts`, `runtime-api.ts`) voor
interne imports - importeer je eigen Plugin nooit via het SDK-pad ervan.

Houd voor providerplugins provider-specifieke helpers in die package-root-barrels,
tenzij de seam echt generiek is. Huidige gebundelde voorbeelden:

- Anthropic: Claude-streamwrappers en `service_tier`-/betahelpers
- OpenAI: providerbuilders, default-modelhelpers, realtimeproviders
- OpenRouter: providerbuilder plus onboarding-/confighelpers

Als een helper alleen nuttig is binnen één gebundeld providerpakket, houd die dan
op die package-root-seam in plaats van die naar `openclaw/plugin-sdk/*` te
promoveren.

Sommige gegenereerde `openclaw/plugin-sdk/<bundled-id>`-helperseams bestaan nog
voor onderhoud van gebundelde plugins wanneer ze gevolgd eigenaargebruik hebben.
Behandel die als gereserveerde oppervlakken, niet als het standaardpatroon voor
nieuwe plugins van derden.

## Checklist vóór indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entry point gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-self-imports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (plugins in de repo)</Check>

## Bèta-releasetests

1. Let op GitHub-releasetags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Bètatags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor releaseaankondigingen.
2. Test je Plugin tegen de bètatag zodra die verschijnt. De periode vóór stabiel is meestal maar een paar uur.
3. Plaats na het testen in de thread van je Plugin in het Discord-kanaal `plugin-forum` ofwel `all good` of wat er kapotging. Als je nog geen thread hebt, maak er dan een.
4. Als er iets kapotgaat, open of werk dan een issue bij met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Zet de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue in zowel de PR als je Discord-thread. Bijdragers kunnen PR's niet labelen, dus de titel is het PR-signaal voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR worden mogelijk toch uitgebracht. Maintainers volgen deze threads tijdens bètatests.
6. Stilte betekent groen. Als je de periode mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Kanaalplugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een plugin voor een berichtenkanaal
  </Card>
  <Card title="Providerplugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een modelproviderplugin
  </Card>
  <Card title="CLI-backendplugins" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Registreer een lokale AI CLI-backend
  </Card>
  <Card title="SDK-overzicht" icon="book-open" href="/nl/plugins/sdk-overview">
    Importmap en referentie voor registratie-API
  </Card>
  <Card title="Runtimehelpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, zoeken, subagent via api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en patronen
  </Card>
  <Card title="Pluginmanifest" icon="file-json" href="/nl/plugins/manifest">
    Volledige manifestschemareferentie
  </Card>
</CardGroup>

## Gerelateerd

- [Pluginarchitectuur](/nl/plugins/architecture) - uitgebreide blik op interne architectuur
- [SDK-overzicht](/nl/plugins/sdk-overview) - Plugin SDK-referentie
- [Manifest](/nl/plugins/manifest) - pluginmanifestindeling
- [Kanaalplugins](/nl/plugins/sdk-channel-plugins) - kanaalplugins bouwen
- [Providerplugins](/nl/plugins/sdk-provider-plugins) - providerplugins bouwen
