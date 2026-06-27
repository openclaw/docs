---
doc-schema-version: 1
read_when:
    - Je wilt een nieuwe OpenClaw Plugin maken
    - Je hebt een snelstartgids nodig voor Plugin-ontwikkeling
    - Je kiest tussen documentatie voor kanalen, providers, CLI-backend, tools of hooks
sidebarTitle: Getting Started
summary: Maak je eerste OpenClaw-plugin in enkele minuten
title: Plugins bouwen
x-i18n:
    generated_at: "2026-06-27T17:50:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit zonder de kern te wijzigen. Een Plugin kan een berichtenkanaal,
modelprovider, lokale CLI-backend, agenttool, hook, mediaprovider
of een andere door de Plugin beheerde mogelijkheid toevoegen.

Je hoeft geen externe Plugin aan de OpenClaw-repository toe te voegen. Publiceer
het pakket op [ClawHub](/nl/clawhub) en gebruikers installeren het met:

```bash
openclaw plugins install clawhub:<package-name>
```

Kale pakketspecificaties installeren tijdens de overgang bij de lancering nog steeds vanaf npm. Gebruik het
voorvoegsel `clawhub:` wanneer je ClawHub-resolutie wilt.

## Vereisten

- Gebruik Node 22.19 of nieuwer en een pakketbeheerder zoals `npm` of `pnpm`.
- Wees vertrouwd met TypeScript ESM-modules.
- Voor werk aan gebundelde Plugins in de repository clone je de repository en voer je `pnpm install` uit.
  Ontwikkeling van Plugins vanuit een broncheckout is alleen pnpm, omdat OpenClaw gebundelde
  Plugins laadt uit `extensions/*`-werkruimtepakketten.

## Kies de Plugin-vorm

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een model-, media-, zoek-, ophaal-, spraak- of realtimeprovider toe.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Voer een lokale AI-CLI uit via OpenClaw-modelterugval.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/nl/plugins/tool-plugins">
    Registreer agenttools.
  </Card>
</CardGroup>

## Snelstart

Bouw een minimale tool-Plugin door één vereiste agenttool te registreren. Dit is de
kortste bruikbare Plugin-vorm en toont het pakket, het manifest, het ingangspunt en
lokaal bewijs.

<Steps>
  <Step title="Create package metadata">
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

    Gepubliceerde externe Plugins moeten runtime-ingangen naar gebouwde JavaScript-
    bestanden laten wijzen. Zie [SDK-ingangspunten](/nl/plugins/sdk-entrypoints) voor het volledige contract
    voor ingangspunten.

    Elke Plugin heeft een manifest nodig, ook wanneer deze geen configuratie heeft. Runtimetools
    moeten in `contracts.tools` staan, zodat OpenClaw eigendom kan ontdekken zonder
    elke Plugin-runtime vooraf te laden. Stel `activation.onStartup`
    bewust in. Dit voorbeeld start bij het opstarten van de Gateway.

    Door de host vertrouwde Plugin-oppervlakken zijn ook manifest-afgeschermd en vereisen expliciete
    inschakeling voor geïnstalleerde Plugins. Als een geïnstalleerde Plugin
    `api.registerAgentToolResultMiddleware(...)` registreert, declareer dan elke doelruntime in
    `contracts.agentToolResultMiddleware`. Als deze
    `api.registerTrustedToolPolicy(...)` registreert, declareer dan elke beleids-id in
    `contracts.trustedToolPolicies`. Deze declaraties houden inspectie tijdens installatie
    en runtimeregistratie op één lijn.

    Zie [Pluginmanifest](/nl/plugins/manifest) voor elk manifestveld.

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

    Gebruik `definePluginEntry` voor niet-kanaal-Plugins. Kanaal-Plugins gebruiken
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Inspecteer voor een geïnstalleerde of externe Plugin de geladen runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Als de Plugin een CLI-opdracht registreert, voer die opdracht dan ook uit. Bijvoorbeeld:
    een demo-opdracht moet uitvoeringsbewijs hebben, zoals
    `openclaw demo-plugin ping`.

    Voor een gebundelde Plugin in deze repository ontdekt OpenClaw broncheckout-
    Plugin-pakketten vanuit de `extensions/*`-werkruimte. Voer de dichtstbijzijnde gerichte
    test uit:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Valideer het pakket vóór publicatie:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    De canonieke ClawHub-fragmenten staan in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Installeer het gepubliceerde pakket via ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Tools registreren

Tools kunnen vereist of optioneel zijn. Vereiste tools zijn altijd beschikbaar wanneer de
Plugin is ingeschakeld. Optionele tools vereisen opt-in van de gebruiker.

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

Gebruikers kiezen voor opt-in met `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Optionele tools bepalen of een tool aan het model wordt blootgesteld. Gebruik
[Plugin-toestemmingsverzoeken](/nl/plugins/plugin-permission-requests) wanneer een tool
of hook om goedkeuring moet vragen nadat het model deze selecteert en voordat de
actie wordt uitgevoerd.

Gebruik optionele tools voor neveneffecten, ongebruikelijke binaries of mogelijkheden die
niet standaard moeten worden blootgesteld. Toolnamen mogen niet conflicteren met kerntools;
conflicten worden overgeslagen en gerapporteerd in Plugin-diagnostiek. Ongeldige
registraties, inclusief tooldescriptors zonder `parameters`, worden overgeslagen en
op dezelfde manier gerapporteerd. Geregistreerde tools zijn getypeerde functies die het model kan aanroepen
nadat beleid- en allowlist-controles slagen.

Toolfabrieken ontvangen een door de runtime aangeleverd contextobject. Gebruik `ctx.activeModel`
wanneer een tool het actieve model voor de huidige beurt moet loggen, weergeven of zich eraan moet aanpassen.
Het object kan `provider`, `modelId` en `modelRef` bevatten. Behandel het als
informatieve runtimemetadata, niet als beveiligingsgrens tegen de lokale
operator, geïnstalleerde Plugin-code of een gewijzigde OpenClaw-runtime. Gevoelige lokale
tools moeten nog steeds expliciete Plugin- of operator-opt-in vereisen en gesloten falen
wanneer metadata van het actieve model ontbreekt of ongeschikt is.

Het manifest declareert eigendom en ontdekking; uitvoering roept nog steeds de live
geregistreerde toolimplementatie aan. Houd `toolMetadata.<tool>.optional: true`
afgestemd op `api.registerTool(..., { optional: true })`, zodat OpenClaw kan voorkomen
dat die Plugin-runtime wordt geladen totdat de tool expliciet is toegestaan.

## Importconventies

Importeer vanuit gerichte SDK-subpaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Importeer niet vanuit de verouderde root-barrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Gebruik binnen je Plugin-pakket lokale barrelbestanden zoals `api.ts` en
`runtime-api.ts` voor interne imports. Importeer je eigen Plugin niet via een
SDK-pad. Providerspecifieke helpers moeten in het providerpakket blijven, tenzij
de overgang echt generiek is.

Aangepaste Gateway-RPC-methoden zijn een geavanceerd ingangspunt. Houd ze op een
Plugin-specifiek voorvoegsel; kernbeheerdersnaamruimten zoals `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` en `update.*` blijven gereserveerd
en worden omgezet naar `operator.admin`. De
`openclaw/plugin-sdk/gateway-method-runtime`-bridge is gereserveerd voor Plugin-HTTP-
routes die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren.

Zie [Plugin SDK-overzicht](/nl/plugins/sdk-overview) voor de volledige importmap.

## Checklist vóór indiening

<Check>**package.json** heeft correcte `openclaw`-metadata</Check>
<Check>**openclaw.plugin.json**-manifest is aanwezig en geldig</Check>
<Check>Ingangspunt gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-zelfimports</Check>
<Check>Tests slagen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (Plugins in de repository)</Check>

## Testen tegen bèta-releases

1. Let op GitHub-release-tags op [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) en abonneer je via `Watch` > `Releases`. Bèta-tags zien eruit als `v2026.3.N-beta.1`. Je kunt ook meldingen inschakelen voor het officiële OpenClaw X-account [@openclaw](https://x.com/openclaw) voor releaseaankondigingen.
2. Test je Plugin tegen de bèta-tag zodra die verschijnt. De periode vóór stabiel is meestal slechts een paar uur.
3. Plaats na het testen een bericht in de thread van je Plugin in het Discord-kanaal `plugin-forum` met `all good` of wat er kapotging. Als je nog geen thread hebt, maak er dan een.
4. Als er iets kapotgaat, open of update dan een issue met de titel `Beta blocker: <plugin-name> - <summary>` en pas het label `beta-blocker` toe. Plaats de issuelink in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue in zowel de PR als je Discord-thread. Bijdragers kunnen PR's niet labelen, dus de titel is het PR-signaal voor beheerders en automatisering. Blockers met een PR worden gemerged; blockers zonder PR worden mogelijk toch uitgebracht. Beheerders volgen deze threads tijdens bètatests.
6. Stilte betekent groen. Als je de periode mist, landt je fix waarschijnlijk in de volgende cyclus.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een berichtenkanaal-Plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een modelprovider-Plugin
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Registreer een lokale AI-CLI-backend
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/nl/plugins/sdk-overview">
    Importmap en API-referentie voor registratie
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, zoeken, subagent via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/nl/plugins/sdk-testing">
    Testhulpprogramma's en patronen
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/nl/plugins/manifest">
    Volledige referentie voor het manifestschema
  </Card>
</CardGroup>

## Gerelateerd

- [Plugin-hooks](/nl/plugins/hooks)
- [Plugin-architectuur](/nl/plugins/architecture)
