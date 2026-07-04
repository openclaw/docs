---
doc-schema-version: 1
read_when:
    - Je wilt een nieuwe OpenClaw-plugin maken
    - Je hebt een snelstartgids voor Plugin-ontwikkeling nodig
    - Je kiest tussen documentatie voor kanalen, providers, CLI-backend, tools of hooks
sidebarTitle: Getting Started
summary: Maak je eerste OpenClaw-plugin in enkele minuten
title: Plugins bouwen
x-i18n:
    generated_at: "2026-07-04T15:25:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit zonder core te wijzigen. Een plugin kan een messaging
channel, modelprovider, lokale CLI-backend, agenttool, hook, mediaprovider,
of een andere door de plugin beheerde capability toevoegen.

Je hoeft geen externe plugin aan de OpenClaw-repository toe te voegen. Publiceer
het package naar [ClawHub](/nl/clawhub) en gebruikers installeren het met:

```bash
openclaw plugins install clawhub:<package-name>
```

Bare package specs installeren tijdens de launch-cutover nog steeds vanaf npm. Gebruik de
prefix `clawhub:` wanneer je ClawHub-resolutie wilt.

## Vereisten

- Gebruik Node 22.19+, Node 23.11+, of Node 24+ en een package manager zoals `npm` of `pnpm`.
- Wees vertrouwd met TypeScript ESM-modules.
- Voor in-repo gebundeld pluginwerk: clone de repository en voer `pnpm install` uit.
  Source-checkout pluginontwikkeling is alleen pnpm, omdat OpenClaw gebundelde
  plugins laadt vanuit `extensions/*` workspace-packages.

## Kies de pluginvorm

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een messagingplatform.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een model-, media-, zoek-, fetch-, spraak- of realtimeprovider toe.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Voer een lokale AI-CLI uit via OpenClaw-modelterugval.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/nl/plugins/tool-plugins">
    Registreer agenttools.
  </Card>
</CardGroup>

## Snelstart

Bouw een minimale toolplugin door één vereiste agenttool te registreren. Dit is de
kortste nuttige pluginvorm en toont het package, manifest, entrypoint en
lokale bewijs.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
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

    Gepubliceerde externe plugins moeten runtime-entry's naar gebouwde JavaScript-
    bestanden laten wijzen. Zie [SDK-entrypoints](/nl/plugins/sdk-entrypoints) voor het volledige entrypointcontract.

    Elke plugin heeft een manifest nodig, ook wanneer die geen config heeft. Runtimetools
    moeten in `contracts.tools` staan zodat OpenClaw ownership kan ontdekken zonder
    elke pluginruntime eager te laden. Stel `activation.onStartup`
    bewust in. Dit voorbeeld start bij het opstarten van de Gateway.

    Door de host vertrouwde pluginoppervlakken zijn ook manifest-gated en vereisen expliciete
    inschakeling voor geïnstalleerde plugins. Als een geïnstalleerde plugin
    `api.registerAgentToolResultMiddleware(...)` registreert, declareer dan elke doelruntime in
    `contracts.agentToolResultMiddleware`. Als die
    `api.registerTrustedToolPolicy(...)` registreert, declareer dan elke policy-id in
    `contracts.trustedToolPolicies`. Deze declaraties houden inspectie tijdens installatie
    en runtimeregistratie op elkaar afgestemd.

    Zie voor elk manifestveld [Pluginmanifest](/nl/plugins/manifest).

  </Step>

  <Step title="Register the tool">
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

    Gebruik `definePluginEntry` voor niet-channelplugins. Channelplugins gebruiken
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Inspecteer voor een geïnstalleerde of externe plugin de geladen runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Als de plugin een CLI-command registreert, voer dat command dan ook uit. Een
    demo-command moet bijvoorbeeld uitvoeringsbewijs hebben zoals
    `openclaw demo-plugin ping`.

    Voor een gebundelde plugin in deze repository ontdekt OpenClaw source-checkout
    pluginpackages vanuit de `extensions/*` workspace. Voer de dichtstbijzijnde gerichte
    test uit:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    Test vóór het publiceren van een package-ready plugin dezelfde installatievorm die gebruikers
    krijgen. Voeg eerst een buildstap toe, laat runtime-entry's zoals
    `openclaw.extensions` wijzen naar gebouwde JavaScript zoals `./dist/index.js`, en zorg
    dat `npm pack` die `dist/`-output bevat. TypeScript-source-entry's zijn
    alleen voor source-checkouts en lokale ontwikkelpaden.

    Pack daarna de plugin en installeer de tarball met `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` gebruikt OpenClaw's beheerde npm-project per plugin, dus het vangt
    runtimeafhankelijkheidsfouten die source-checkouttests kunnen verbergen. Het bewijst
    de package- en afhankelijkheidsvorm, niet catalogus-gekoppeld officieel vertrouwen.
    Runtime-imports moeten in `dependencies` of `optionalDependencies` staan;
    afhankelijkheden die alleen in `devDependencies` blijven staan, worden niet geïnstalleerd voor het
    beheerde runtimeproject.

    Gebruik geen raw archive/path-install als eindbewijs voor officieel of
    privileged plugingedrag. Raw sources zijn nuttig voor lokale debugging, maar
    ze bewijzen niet hetzelfde afhankelijkheidspad als npm- of ClawHub-installaties. Als
    je plugin vertrouwt op vertrouwde officiële pluginstatus, voeg dan een tweede bewijs toe
    via een catalog-backed officiële installatie of een gepubliceerd packagepad dat
    officieel vertrouwen vastlegt. Zie
    [Plugin dependency resolution](/nl/plugins/dependency-resolution) voor details over
    install-root en ownership van afhankelijkheden.

  </Step>

  <Step title="Publish">
    Valideer het package vóór publicatie:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    De canonieke ClawHub-snippets staan in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Installeer het gepubliceerde package via ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Tools registreren

Tools kunnen vereist of optioneel zijn. Vereiste tools zijn altijd beschikbaar wanneer de
plugin is ingeschakeld. Optionele tools vereisen opt-in van de gebruiker.

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

Elke tool die met `api.registerTool(...)` wordt geregistreerd, moet ook worden gedeclareerd in het
pluginmanifest:

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

Gebruikers kiezen ervoor met `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Optionele tools bepalen of een tool aan het model wordt blootgesteld. Gebruik
[plugin permission requests](/nl/plugins/plugin-permission-requests) wanneer een tool
of hook om goedkeuring moet vragen nadat het model die selecteert en voordat de
actie wordt uitgevoerd.

Gebruik optionele tools voor bijwerkingen, ongebruikelijke binaries of capabilities die
niet standaard moeten worden blootgesteld. Toolnamen mogen niet conflicteren met coretools;
conflicten worden overgeslagen en gerapporteerd in plugindiagnostics. Ongeldige
registraties, inclusief tooldescriptors zonder `parameters`, worden overgeslagen en
op dezelfde manier gerapporteerd. Geregistreerde tools zijn getypeerde functies die het model kan aanroepen
nadat policy- en allowlist-controles slagen.

Toolfactories ontvangen een door de runtime geleverd contextobject. Gebruik `ctx.activeModel`
wanneer een tool moet loggen, weergeven of zich aanpassen aan het actieve model voor de huidige
turn. Het object kan `provider`, `modelId` en `modelRef` bevatten. Behandel het als
informatieve runtimemetadata, niet als een beveiligingsgrens tegen de lokale
operator, geïnstalleerde plugincode of een gewijzigde OpenClaw-runtime. Gevoelige lokale
tools moeten nog steeds een expliciete plugin- of operator-opt-in vereisen en fail-closed
wanneer active-model-metadata ontbreekt of ongeschikt is.

Het manifest declareert ownership en discovery; uitvoering roept nog steeds de live
geregistreerde toolimplementatie aan. Houd `toolMetadata.<tool>.optional: true`
afgestemd op `api.registerTool(..., { optional: true })` zodat OpenClaw kan voorkomen
dat die pluginruntime wordt geladen totdat de tool expliciet op de allowlist staat.

## Importconventies

Importeer vanuit gerichte SDK-subpaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Importeer niet vanuit de deprecated root barrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Gebruik binnen je pluginpackage lokale barrelbestanden zoals `api.ts` en
`runtime-api.ts` voor interne imports. Importeer je eigen plugin niet via een
SDK-pad. Providerspecifieke helpers moeten in het providerpackage blijven, tenzij
de seam echt generiek is.

Custom Gateway RPC-methoden zijn een geavanceerd entrypoint. Houd ze op een
pluginspecifieke prefix; core admin-namespaces zoals `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` en `update.*` blijven gereserveerd
en resolven naar `operator.admin`. De
`openclaw/plugin-sdk/gateway-method-runtime`-bridge is gereserveerd voor plugin-HTTP
routes die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren.

Zie voor de volledige importmap [Plugin SDK-overzicht](/nl/plugins/sdk-overview).

## Checklist vóór indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Entrypoint gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-self-imports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (in-repo plugins)</Check>

## Test tegen beta-releases

1. Let op GitHub-release-tags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Beta-tags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor release-aankondigingen.
2. Test je Plugin tegen de beta-tag zodra die verschijnt. De periode vóór stable is meestal maar een paar uur.
3. Plaats na het testen een bericht in de thread van je Plugin in het Discord-kanaal `plugin-forum` met `all good` of wat er kapotging. Als je nog geen thread hebt, maak er dan een aan.
4. Als er iets kapotgaat, open of update dan een issue met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Zet de issue-link in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue in zowel de PR als je Discord-thread. Contributors kunnen PR's niet labelen, dus de titel is het PR-signaal voor maintainers en automatisering. Blockers met een PR worden gemerged; blockers zonder PR kunnen alsnog worden uitgebracht. Maintainers volgen deze threads tijdens beta-tests.
6. Stilte betekent groen. Als je de periode mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een messaging-channel-Plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een modelprovider-Plugin
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Registreer een lokale AI CLI-backend
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/nl/plugins/sdk-overview">
    Importmap en API-referentie voor registratie
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, zoeken, subagent via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en patronen
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/nl/plugins/manifest">
    Volledige manifest-schemareferentie
  </Card>
</CardGroup>

## Gerelateerd

- [Plugin-hooks](/nl/plugins/hooks)
- [Plugin-architectuur](/nl/plugins/architecture)
