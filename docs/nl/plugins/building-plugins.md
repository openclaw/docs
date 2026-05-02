---
read_when:
    - Je wilt een nieuwe OpenClaw Plugin maken
    - Je hebt een snelstartgids voor Plugin-ontwikkeling nodig
    - Je voegt een nieuw kanaal, een nieuwe provider, een nieuwe tool of andere functionaliteit toe aan OpenClaw
sidebarTitle: Getting Started
summary: Maak binnen enkele minuten je eerste OpenClaw Plugin
title: Plugins bouwen
x-i18n:
    generated_at: "2026-05-02T11:21:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
spraak, realtime transcriptie, realtime spraak, mediabegrip, afbeeldingsgeneratie,
videogeneratie, web-fetch, webzoekopdrachten, agenttools of elke
combinatie daarvan.

Je hoeft je plugin niet aan de OpenClaw-repository toe te voegen. Publiceer naar
[ClawHub](/nl/tools/clawhub) en gebruikers installeren met
`openclaw plugins install <package-name>`. OpenClaw probeert eerst ClawHub en
valt automatisch terug op npm voor pakketten die nog npm-distributie gebruiken.

## Vereisten

- Node >= 22 en een pakketbeheerder (npm of pnpm)
- Vertrouwdheid met TypeScript (ESM)
- Voor plugins in de repo: repository gekloond en `pnpm install` uitgevoerd. Pluginontwikkeling vanuit een broncheckout is alleen pnpm, omdat OpenClaw gebundelde
  plugins laadt vanuit de `extensions/*`-workspacepakketten.

## Wat voor soort plugin?

<CardGroup cols={3}>
  <Card title="Kanaalplugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform (Discord, IRC, enz.)
  </Card>
  <Card title="Providerplugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een modelprovider toe (LLM, proxy of aangepast endpoint)
  </Card>
  <Card title="Tool- / hookplugin" icon="wrench" href="/nl/plugins/hooks">
    Registreer agenttools, event hooks of services — ga hieronder verder
  </Card>
</CardGroup>

Voor een kanaalplugin waarvan niet gegarandeerd is dat die is geïnstalleerd wanneer onboarding/setup
wordt uitgevoerd, gebruik je `createOptionalChannelSetupSurface(...)` uit
`openclaw/plugin-sdk/channel-setup`. Dit produceert een setupadapter + wizardpaar
dat de installatievereiste aangeeft en veilig gesloten faalt bij echte configuratieschrijfacties
totdat de plugin is geïnstalleerd.

## Snelstart: toolplugin

Deze walkthrough maakt een minimale plugin die een agenttool registreert. Kanaal-
en providerplugins hebben eigen handleidingen die hierboven zijn gelinkt.

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

    Elke plugin heeft een manifest nodig, zelfs zonder configuratie. Tools die tijdens runtime worden geregistreerd
    moeten in `contracts.tools` worden vermeld, zodat OpenClaw de eigenaarplugin kan ontdekken
    zonder elke pluginruntime te laden. Plugins moeten ook
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

    `definePluginEntry` is voor niet-kanaalplugins. Gebruik voor kanalen
    `defineChannelPluginEntry` — zie [Kanaalplugins](/nl/plugins/sdk-channel-plugins).
    Zie [Entrypoints](/nl/plugins/sdk-entrypoints) voor alle entrypointopties.

  </Step>

  <Step title="Test en publiceer">

    **Externe plugins:** valideer en publiceer met ClawHub, en installeer daarna:

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

Eén plugin kan elk aantal mogelijkheden registreren via het `api`-object:

| Mogelijkheid           | Registratiemethode                              | Gedetailleerde handleiding                                                       |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Tekstinferentie (LLM)  | `api.registerProvider(...)`                      | [Providerplugins](/nl/plugins/sdk-provider-plugins)                                |
| CLI-inferentiebackend  | `api.registerCliBackend(...)`                    | [CLI-backends](/nl/gateway/cli-backends)                                           |
| Kanaal / berichten     | `api.registerChannel(...)`                       | [Kanaalplugins](/nl/plugins/sdk-channel-plugins)                                   |
| Spraak (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcriptie  | `api.registerRealtimeTranscriptionProvider(...)` | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime spraak        | `api.registerRealtimeVoiceProvider(...)`         | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Mediabegrip            | `api.registerMediaUnderstandingProvider(...)`    | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Afbeeldingsgeneratie   | `api.registerImageGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Muziekgeneratie        | `api.registerMusicGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogeneratie         | `api.registerVideoGenerationProvider(...)`       | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-fetch              | `api.registerWebFetchProvider(...)`              | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Webzoekopdracht        | `api.registerWebSearchProvider(...)`             | [Providerplugins](/nl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Toolresultaatmiddleware | `api.registerAgentToolResultMiddleware(...)`    | [SDK-overzicht](/nl/plugins/sdk-overview#registration-api)                         |
| Agenttools             | `api.registerTool(...)`                          | Hieronder                                                                       |
| Aangepaste opdrachten  | `api.registerCommand(...)`                       | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/nl/plugins/hooks)                                                  |
| Interne event hooks    | `api.registerHook(...)`                          | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |
| HTTP-routes            | `api.registerHttpRoute(...)`                     | [Internals](/nl/plugins/architecture-internals#gateway-http-routes)                |
| CLI-subopdrachten      | `api.registerCli(...)`                           | [Entrypoints](/nl/plugins/sdk-entrypoints)                                         |

Zie [SDK-overzicht](/nl/plugins/sdk-overview#registration-api) voor de volledige registratie-API.

Gebundelde plugins kunnen `api.registerAgentToolResultMiddleware(...)` gebruiken wanneer ze
asynchrone herschrijving van toolresultaten nodig hebben voordat het model de uitvoer ziet. Declareer de
beoogde runtimes in `contracts.agentToolResultMiddleware`, bijvoorbeeld
`["pi", "codex"]`. Dit is een vertrouwde seam voor gebundelde plugins; externe
plugins moeten bij voorkeur reguliere OpenClaw-pluginhooks gebruiken, tenzij OpenClaw een
expliciet vertrouwensbeleid voor deze mogelijkheid krijgt.

Als je plugin aangepaste Gateway-RPC-methoden registreert, houd ze dan onder een
pluginspecifiek prefix. Kern-adminnamespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) blijven gereserveerd en lossen altijd op naar
`operator.admin`, zelfs als een plugin om een nauwere scope vraagt.

Hook-guardsemantiek om rekening mee te houden:

- `before_tool_call`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_tool_call`: `{ block: false }` wordt behandeld als geen beslissing.
- `before_tool_call`: `{ requireApproval: true }` pauzeert agentuitvoering en vraagt de gebruiker om goedkeuring via de exec-goedkeuringsoverlay, Telegram-knoppen, Discord-interacties of de opdracht `/approve` op elk kanaal.
- `before_install`: `{ block: true }` is terminaal en stopt handlers met lagere prioriteit.
- `before_install`: `{ block: false }` wordt behandeld als geen beslissing.
- `message_sending`: `{ cancel: true }` is terminaal en stopt handlers met lagere prioriteit.
- `message_sending`: `{ cancel: false }` wordt behandeld als geen beslissing.
- `message_received`: geef de voorkeur aan het getypte veld `threadId` wanneer je inkomende thread-/topicrouting nodig hebt. Houd `metadata` voor kanaalspecifieke extra's.
- `message_sending`: geef de voorkeur aan getypte routingvelden `replyToId` / `threadId` boven kanaalspecifieke metadatasleutels.

De opdracht `/approve` behandelt zowel exec- als plugingoedkeuringen met begrensde fallback: wanneer een exec-goedkeurings-id niet wordt gevonden, probeert OpenClaw hetzelfde id opnieuw via plugingoedkeuringen. Doorsturen van plugingoedkeuringen kan onafhankelijk worden geconfigureerd via `approvals.plugin` in de configuratie.

Als aangepaste goedkeuringsplumbing diezelfde begrensde fallbackcase moet detecteren,
gebruik dan bij voorkeur `isApprovalNotFoundError` uit `openclaw/plugin-sdk/error-runtime`
in plaats van goedkeuringsvervalstrings handmatig te matchen.

Zie [Plugin hooks](/nl/plugins/hooks) voor voorbeelden en de hookreferentie.

## Agenttools registreren

Tools zijn getypte functies die de LLM kan aanroepen. Ze kunnen verplicht zijn (altijd
beschikbaar) of optioneel (opt-in door de gebruiker):

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

Elke tool die met `api.registerTool(...)` wordt geregistreerd, moet ook in het
pluginmanifest worden gedeclareerd:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Gebruikers schakelen optionele tools in de configuratie in:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Toolnamen mogen niet botsen met kerntools (conflicten worden overgeslagen)
- Tools met ongeldig gevormde registratieobjecten, inclusief ontbrekende `parameters`, worden overgeslagen en gemeld in Plugin-diagnostiek in plaats van agentuitvoeringen te onderbreken
- Gebruik `optional: true` voor tools met bijwerkingen of extra binaire vereisten
- Gebruikers kunnen alle tools van een Plugin inschakelen door de Plugin-id toe te voegen aan `tools.allow`

## CLI-opdrachten registreren

Plugins kunnen hoofdgroepen voor `openclaw`-opdrachten toevoegen met `api.registerCli`. Geef
`descriptors` op voor elke opdrachtroot op het hoogste niveau, zodat OpenClaw de opdracht kan tonen en routeren
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

Gebruik binnen je Plugin lokale barrelbestanden (`api.ts`, `runtime-api.ts`) voor
interne imports — importeer je eigen Plugin nooit via het SDK-pad ervan.

Voor provider-Plugins bewaar je provider-specifieke helpers in die package-root
barrels, tenzij de seam echt generiek is. Huidige meegeleverde voorbeelden:

- Anthropic: Claude-streamwrappers en `service_tier` / beta-helpers
- OpenAI: provider-builders, helpers voor standaardmodellen, realtime providers
- OpenRouter: provider-builder plus onboarding-/configuratiehelpers

Als een helper alleen nuttig is binnen een meegeleverd providerpakket, houd die dan op die
package-root seam in plaats van hem te promoveren naar `openclaw/plugin-sdk/*`.

Sommige gegenereerde helper-seams voor `openclaw/plugin-sdk/<bundled-id>` bestaan nog steeds voor
onderhoud van meegeleverde Plugins wanneer ze bijgehouden eigenaargebruik hebben. Behandel die als
gereserveerde oppervlakken, niet als het standaardpatroon voor nieuwe externe Plugins.

## Checklist voor indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entry point gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-self-imports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (Plugins in de repo)</Check>

## Beta-releasetesten

1. Let op GitHub-releasetags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Beta-tags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor releaseaankondigingen.
2. Test je Plugin tegen de beta-tag zodra deze verschijnt. De periode vóór stable is meestal maar een paar uur.
3. Plaats na het testen een bericht in de thread van je Plugin in het Discord-kanaal `plugin-forum` met `all good` of wat er kapotging. Als je nog geen thread hebt, maak er dan een.
4. Als er iets kapotgaat, open of werk een issue bij met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Plaats de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue in zowel de PR als je Discord-thread. Bijdragers kunnen PR's niet labelen, dus de titel is het PR-signaal voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR kunnen alsnog worden uitgebracht. Maintainers volgen deze threads tijdens betatesten.
6. Stilte betekent groen. Als je de periode mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Kanaal-Plugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een Plugin voor een messaging-kanaal
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een Plugin voor een modelprovider
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
    Volledige referentie voor het manifestschema
  </Card>
</CardGroup>

## Gerelateerd

- [Pluginarchitectuur](/nl/plugins/architecture) — diepgaande uitleg van de interne architectuur
- [SDK-overzicht](/nl/plugins/sdk-overview) — referentie voor de Plugin SDK
- [Manifest](/nl/plugins/manifest) — Pluginmanifestindeling
- [Kanaal-Plugins](/nl/plugins/sdk-channel-plugins) — kanaal-Plugins bouwen
- [Provider-Plugins](/nl/plugins/sdk-provider-plugins) — provider-Plugins bouwen
