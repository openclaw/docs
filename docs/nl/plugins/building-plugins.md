---
doc-schema-version: 1
read_when:
    - Je wilt een nieuwe OpenClaw Plugin maken
    - Je hebt een snelstartgids voor Plugin-ontwikkeling nodig
    - Je kiest tussen documentatie voor kanaal, provider, CLI-backend, tool of hook
sidebarTitle: Getting Started
summary: Maak je eerste OpenClaw-plugin in enkele minuten
title: Plugins bouwen
x-i18n:
    generated_at: "2026-07-04T10:50:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit zonder de kern te wijzigen. Een Plugin kan een berichtenkanaal,
modelprovider, lokale CLI-backend, agenttool, hook, mediaprovider
of een andere capability toevoegen die eigendom is van de Plugin.

Je hoeft geen externe Plugin aan de OpenClaw-repository toe te voegen. Publiceer
het pakket naar [ClawHub](/clawhub), waarna gebruikers het installeren met:

```bash
openclaw plugins install clawhub:<package-name>
```

Bare package specs worden tijdens de lanceringsovergang nog steeds vanuit npm geinstalleerd. Gebruik het
`clawhub:`-voorvoegsel wanneer je ClawHub-resolutie wilt.

## Vereisten

- Gebruik Node 22.19+, Node 23.11+ of Node 24+ en een pakketbeheerder zoals `npm` of `pnpm`.
- Wees vertrouwd met TypeScript ESM-modules.
- Voor werk aan gebundelde Plugins binnen de repository clone je de repository en voer je `pnpm install` uit.
  Plugin-ontwikkeling vanuit een source checkout is alleen pnpm, omdat OpenClaw gebundelde
  Plugins laadt vanuit `extensions/*`-workspacepakketten.

## Kies de Plugin-vorm

<CardGroup cols={2}>
  <Card title="Kanaal-Plugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform.
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een model-, media-, zoek-, fetch-, spraak- of realtime provider toe.
  </Card>
  <Card title="CLI-backend-Plugin" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Voer een lokale AI-CLI uit via OpenClaw-modelfallback.
  </Card>
  <Card title="Tool-Plugin" icon="wrench" href="/nl/plugins/tool-plugins">
    Registreer agenttools.
  </Card>
</CardGroup>

## Snelstart

Bouw een minimale tool-Plugin door een verplichte agenttool te registreren. Dit is de
kortste nuttige Plugin-vorm en toont het pakket, het manifest, het entrypoint en
lokaal bewijs.

<Steps>
  <Step title="Pakketmetadata maken">
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

    Gepubliceerde externe Plugins moeten runtime-entry's naar gebouwde JavaScript-
    bestanden laten wijzen. Zie [SDK-entrypoints](/nl/plugins/sdk-entrypoints) voor het volledige
    entrypointcontract.

    Elke Plugin heeft een manifest nodig, ook wanneer deze geen configuratie heeft. Runtimetools
    moeten in `contracts.tools` staan zodat OpenClaw eigenaarschap kan ontdekken zonder
    elke Plugin-runtime vooraf te laden. Stel `activation.onStartup`
    bewust in. Dit voorbeeld start bij het opstarten van de Gateway.

    Host-vertrouwde Plugin-oppervlakken worden ook door het manifest afgeschermd en vereisen expliciete
    inschakeling voor geinstalleerde Plugins. Als een geinstalleerde Plugin
    `api.registerAgentToolResultMiddleware(...)` registreert, declareer dan elke doelruntime in
    `contracts.agentToolResultMiddleware`. Als deze
    `api.registerTrustedToolPolicy(...)` registreert, declareer dan elke beleids-id in
    `contracts.trustedToolPolicies`. Deze declaraties houden inspectie tijdens installatie
    en runtime-registratie op elkaar afgestemd.

    Zie [Pluginmanifest](/nl/plugins/manifest) voor elk manifestveld.

  </Step>

  <Step title="De tool registreren">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Gebruik `definePluginEntry` voor niet-kanaal-Plugins. Kanaal-Plugins gebruiken
    `defineChannelPluginEntry`.

  </Step>

  <Step title="De runtime testen">
    Inspecteer voor een geinstalleerde of externe Plugin de geladen runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Als de Plugin een CLI-opdracht registreert, voer die opdracht dan ook uit. Een
    demo-opdracht moet bijvoorbeeld uitvoeringsbewijs hebben, zoals
    `openclaw demo-plugin ping`.

    Voor een gebundelde Plugin in deze repository ontdekt OpenClaw Plugin-pakketten
    vanuit een source checkout via de `extensions/*`-workspace. Voer de meest gerichte
    test uit:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publiceren">
    Valideer het pakket voordat je publiceert:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    De canonieke ClawHub-snippets staan in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Installeren">
    Installeer het gepubliceerde pakket via ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Tools registreren

Tools kunnen verplicht of optioneel zijn. Verplichte tools zijn altijd beschikbaar wanneer de
Plugin is ingeschakeld. Optionele tools vereisen opt-in door de gebruiker.

```typescript
register(api) {
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
Pluginmanifest worden gedeclareerd:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Gebruikers kiezen met `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Optionele tools bepalen of een tool aan het model wordt blootgesteld. Gebruik
[Plugin-toestemmingsverzoeken](/nl/plugins/plugin-permission-requests) wanneer een tool
of hook om goedkeuring moet vragen nadat het model deze selecteert en voordat de
actie wordt uitgevoerd.

Gebruik optionele tools voor bijwerkingen, ongebruikelijke binaries of capabilities die
niet standaard mogen worden blootgesteld. Toolnamen mogen niet conflicteren met kerntools;
conflicten worden overgeslagen en gerapporteerd in Plugin-diagnostiek. Ongeldige
registraties, inclusief tooldescriptors zonder `parameters`, worden overgeslagen en
op dezelfde manier gerapporteerd. Geregistreerde tools zijn getypeerde functies die het model kan aanroepen
nadat beleids- en allowlistcontroles slagen.

Toolfactories ontvangen een door de runtime geleverd contextobject. Gebruik `ctx.activeModel`
wanneer een tool het actieve model voor de huidige beurt moet loggen, tonen of zich eraan moet aanpassen.
Het object kan `provider`, `modelId` en `modelRef` bevatten. Behandel het als
informatieve runtimemetadata, niet als beveiligingsgrens tegen de lokale
operator, geinstalleerde Plugin-code of een gewijzigde OpenClaw-runtime. Gevoelige lokale
tools moeten nog steeds expliciete opt-in van een Plugin of operator vereisen en fail closed
wanneer metadata van het actieve model ontbreekt of ongeschikt is.

Het manifest declareert eigenaarschap en ontdekking; uitvoering roept nog steeds de live
geregistreerde toolimplementatie aan. Houd `toolMetadata.<tool>.optional: true`
uitgelijnd met `api.registerTool(..., { optional: true })` zodat OpenClaw kan voorkomen
dat die Plugin-runtime wordt geladen totdat de tool expliciet op de allowlist staat.

## Importconventies

Importeer vanuit gerichte SDK-subpaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Importeer niet vanuit de verouderde root barrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Gebruik binnen je Plugin-pakket lokale barrel-bestanden zoals `api.ts` en
`runtime-api.ts` voor interne imports. Importeer je eigen Plugin niet via een
SDK-pad. Provider-specifieke helpers moeten in het providerpakket blijven, tenzij
de scheidslijn echt generiek is.

Aangepaste Gateway-RPC-methoden zijn een geavanceerd entrypoint. Houd ze op een
Plugin-specifiek voorvoegsel; kernbeheernamespaces zoals `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` en `update.*` blijven gereserveerd
en worden opgelost naar `operator.admin`. De
`openclaw/plugin-sdk/gateway-method-runtime`-bridge is gereserveerd voor Plugin-HTTP-
routes die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren.

Zie [Plugin SDK-overzicht](/nl/plugins/sdk-overview) voor de volledige importmap.

## Checklist voor indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entrypoint gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-zelfimports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (Plugins binnen de repository)</Check>

## Testen tegen betareleases

1. Let op GitHub-releasetags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Betatags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiele OpenClaw X-account [@openclaw](https://x.com/openclaw) voor releaseaankondigingen.
2. Test je Plugin tegen de betatag zodra deze verschijnt. De periode voor stable is meestal maar een paar uur.
3. Plaats na het testen een bericht in de thread van je Plugin in het Discord-kanaal `plugin-forum`, met `all good` of wat er stukging. Als je nog geen thread hebt, maak er dan een.
4. Als er iets stukgaat, open of update dan een issue met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Zet de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue zowel in de PR als in je Discord-thread. Contributors kunnen PR's niet labelen, dus de titel is het PR-signaal voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR worden mogelijk toch verzonden. Maintainers houden deze threads tijdens betatesten in de gaten.
6. Stilte betekent groen. Als je de periode mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Kanaal-Plugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een berichtenkanaal-Plugin
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een modelprovider-Plugin
  </Card>
  <Card title="CLI-backend-Plugins" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Registreer een lokale AI-CLI-backend
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
    Volledige manifest-schemareferentie
  </Card>
</CardGroup>

## Gerelateerd

- [Plugin-hooks](/nl/plugins/hooks)
- [Plugin-architectuur](/nl/plugins/architecture)
