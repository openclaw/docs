---
doc-schema-version: 1
read_when:
    - Je wilt een nieuwe OpenClaw-plugin maken
    - Je hebt een snelstartgids voor Plugin-ontwikkeling nodig
    - Je kiest tussen documentatie voor kanalen, providers, CLI-backends, tools of hooks
sidebarTitle: Getting Started
summary: Maak binnen enkele minuten je eerste OpenClaw-plugin
title: Plugins bouwen
x-i18n:
    generated_at: "2026-07-16T16:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit zonder de kern te wijzigen. Een plugin kan een berichtenkanaal, modelprovider, lokale CLI-backend, agenttool, hook, mediaprovider of een andere door de plugin beheerde mogelijkheid toevoegen.

Je hoeft geen externe plugin aan de OpenClaw-repository toe te voegen. Publiceer het pakket op [ClawHub](/clawhub), waarna gebruikers het installeren met:

```bash
openclaw plugins install clawhub:<package-name>
```

Tijdens de overgang bij de lancering worden kale pakketspecificaties nog steeds vanuit npm geïnstalleerd. Gebruik het voorvoegsel `clawhub:` als je ClawHub-resolutie wilt.

## Vereisten

- Node 22.22.3+, Node 24.15+ of Node 25.9+, en `npm` of `pnpm`.
- TypeScript ESM-modules.
- Kloon voor werk aan in de repository gebundelde plugins de repository en voer `pnpm install` uit.
  Pluginontwikkeling vanuit een broncheckout werkt alleen met pnpm, omdat OpenClaw
  gebundelde plugins detecteert vanuit `extensions/*`-workspacepakketten.

## Kies de pluginvorm

<CardGroup cols={2}>
  <Card title="Kanaalplugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform.
  </Card>
  <Card title="Providerplugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een provider voor modellen, media, zoeken, ophalen, spraak of realtimegebruik toe.
  </Card>
  <Card title="CLI-backendplugin" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Voer een lokale AI-CLI uit via de modelfallback van OpenClaw.
  </Card>
  <Card title="Toolplugin" icon="wrench" href="/nl/plugins/tool-plugins">
    Registreer agenttools.
  </Card>
</CardGroup>

## Snelstart

Bouw een minimale toolplugin door één verplichte agenttool te registreren. Dit is de
kortste bruikbare pluginvorm en omvat het pakket, het manifest, het toegangspunt en
lokale verificatie.

<Steps>
  <Step title="Pakketmetadata maken">
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

    Gepubliceerde externe plugins moeten runtime-toegangspunten naar gebouwde JavaScript-
    bestanden laten verwijzen. Zie [SDK-toegangspunten](/nl/plugins/sdk-entrypoints) voor het volledige
    contract voor toegangspunten.

    Elke plugin heeft een manifest nodig, zelfs zonder configuratie. Runtimetools moeten
    in `contracts.tools` staan, zodat OpenClaw het eigenaarschap kan detecteren zonder
    elke pluginruntime voortijdig te laden. Stel `activation.onStartup`
    bewust in; dit voorbeeld wordt geladen wanneer de Gateway start.

    Door de host vertrouwde pluginoppervlakken worden ook door het manifest afgeschermd en vereisen
    voor geïnstalleerde plugins een expliciete declaratie: `api.registerAgentToolResultMiddleware(...)`
    vereist dat elke doelruntime in `contracts.agentToolResultMiddleware` wordt vermeld,
    en `api.registerTrustedToolPolicy(...)` vereist elke beleids-id in
    `contracts.trustedToolPolicies`. Deze declaraties houden de inspectie tijdens installatie
    en de runtimeregistratie op elkaar afgestemd.

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

    Gebruik `definePluginEntry` voor plugins die geen kanaalplugin zijn. Kanaalplugins gebruiken
    in plaats daarvan `defineChannelPluginEntry` uit `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="De runtime testen">
    Inspecteer voor een geïnstalleerde of externe plugin de geladen runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Als de plugin een CLI-opdracht registreert, voer je die opdracht ook uit en controleer je
    de uitvoer, bijvoorbeeld `openclaw demo-plugin ping`.

    Voor een in deze repository gebundelde plugin detecteert OpenClaw pluginpakketten
    uit een broncheckout via de `extensions/*`-workspace. Voer de meest gerichte
    test uit:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="De pakketinstallatie testen">
    Test voordat je een publicatieklaar pluginpakket publiceert dezelfde installatievorm die gebruikers
    zullen krijgen. Voeg eerst een bouwstap toe, laat runtime-toegangspunten zoals
    `openclaw.extensions` naar gebouwde JavaScript-bestanden zoals `./dist/index.js` verwijzen en zorg
    dat `npm pack` die `dist/`-uitvoer bevat. TypeScript-brontoegangspunten zijn
    alleen bedoeld voor broncheckouts en lokale ontwikkelpaden.

    Pak daarna de plugin in en installeer het tar-bestand met `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` gebruikt het door OpenClaw beheerde npm-project per plugin en detecteert daardoor
    fouten in runtimeafhankelijkheden die tests vanuit een broncheckout kunnen verbergen. Het verifieert
    de pakket- en afhankelijkheidsvorm, niet de officiële vertrouwensstatus die aan de catalogus is gekoppeld.
    Runtime-imports moeten in `dependencies` of `optionalDependencies` staan;
    afhankelijkheden die alleen in `devDependencies` staan, worden niet geïnstalleerd voor het
    beheerde runtimeproject.

    Gebruik geen onbewerkte archief-/padinstallatie als definitieve verificatie voor officieel of
    bevoorrecht plugingedrag. Onbewerkte bronnen zijn nuttig voor lokale foutopsporing, maar
    bewijzen niet hetzelfde afhankelijkheidspad als installaties via npm of ClawHub. Als
    je plugin afhankelijk is van de vertrouwde status van een officiële plugin, voeg dan een tweede verificatie
    toe via een door de catalogus ondersteunde officiële installatie of een gepubliceerd pakketpad dat
    het officiële vertrouwen vastlegt. Zie
    [Resolutie van pluginafhankelijkheden](/nl/plugins/dependency-resolution) voor details over
    de installatieroot en het eigenaarschap van afhankelijkheden.

  </Step>

  <Step title="Publiceren">
    Valideer het pakket voordat je het publiceert:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Canonieke ClawHub-pakketfragmenten staan in `docs/snippets/plugin-publish/`.

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
plugin is ingeschakeld. Voor optionele tools moet de gebruiker expliciet toestemming geven voordat OpenClaw
de runtime van de eigenaarplugin laadt.

Toolfactories ontvangen vertrouwde runtimecontext, waaronder `deliveryContext`,
`nativeChannelId` voor het actieve platformgesprek indien beschikbaar, en
`requesterSenderId`.

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

Elke tool die met `api.registerTool(...)` wordt geregistreerd, moet ook in het
pluginmanifest worden gedeclareerd:

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

Gebruikers geven toestemming met `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Optionele tools bepalen of een tool aan het model wordt aangeboden. Gebruik
[verzoeken om pluginmachtigingen](/nl/plugins/plugin-permission-requests) wanneer een tool
of hook om goedkeuring moet vragen nadat het model deze heeft geselecteerd en voordat de
actie wordt uitgevoerd.

Gebruik optionele tools voor neveneffecten, ongebruikelijke binaire bestanden of mogelijkheden die
niet standaard beschikbaar mogen zijn. Toolnamen mogen niet conflicteren met namen van kerntools;
conflicten worden overgeslagen en gemeld in de plugindiagnostiek. Ongeldige
registraties worden overgeslagen en op dezelfde manier gemeld: een ontbrekende, niet-lege
`name`, een `execute` die geen functie is, of een tooldescriptor zonder een `parameters`-
object.

Toolfactories ontvangen een door de runtime geleverd contextobject. Gebruik `ctx.activeModel`
wanneer een tool voor de huidige beurt moet loggen, weergeven of zich moet aanpassen aan het actieve model;
dit kan `provider`, `modelId` en `modelRef` bevatten. Beschouw dit als
informatieve runtimemetadata, niet als een beveiligingsgrens tegen de lokale
operator, geïnstalleerde plugincode of een aangepaste OpenClaw-runtime. Gevoelige
lokale tools moeten nog steeds expliciete toestemming van de plugin of operator vereisen en
gesloten falen wanneer metadata van het actieve model ontbreekt of ongeschikt is.

Het manifest declareert eigenaarschap en detectie; voor de uitvoering wordt nog steeds de actieve
geregistreerde toolimplementatie aangeroepen. Houd `toolMetadata.<tool>.optional: true`
afgestemd op `api.registerTool(..., { optional: true })`, zodat OpenClaw het laden van
die pluginruntime kan uitstellen totdat de tool expliciet op de toelatingslijst staat.

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

Gebruik binnen je pluginpakket lokale barrel-bestanden zoals `api.ts` en
`runtime-api.ts` voor interne imports. Importeer je eigen plugin niet via een
SDK-pad. Providerspecifieke helpers moeten in het providerpakket blijven, tenzij
de koppeling werkelijk generiek is.

Aangepaste Gateway-RPC-methoden zijn een geavanceerd toegangspunt. Plaats ze onder een
pluginspecifiek voorvoegsel; beheernamespaces van de kern, zoals `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` en `update.*`, blijven gereserveerd
en worden omgezet in `operator.admin`. De
`openclaw/plugin-sdk/gateway-method-runtime`-bridge is gereserveerd voor HTTP-routes van plugins
die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren.

Zie [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview) voor de volledige importkaart.

## Checklist vóór indiening

<Check>**package.json** bevat correcte `openclaw`-metadata</Check>
<Check>Het manifest **openclaw.plugin.json** is aanwezig en geldig</Check>
<Check>Het toegangspunt gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-zelfimports</Check>
<Check>Tests slagen (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (plugins in de repository)</Check>

## Testen met bètaversies

1. Volg de releases van [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Bètatags zien eruit als `v2026.3.N-beta.1`. Je kunt ook [@openclaw](https://x.com/openclaw) op X volgen voor releaseaankondigingen.
2. Test je Plugin tegen de bètatag zodra deze verschijnt. De periode vóór de stabiele release duurt doorgaans slechts enkele uren.
3. Plaats na het testen een bericht in de thread van je Plugin in het Discord-kanaal `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), met `all good` of een beschrijving van wat niet meer werkte. Maak een thread als je er nog geen hebt.
4. Als er iets niet meer werkt, open of actualiseer dan een issue met de titel `Beta blocker: <plugin-name> - <summary>` en ken het label `beta-blocker` toe. Link het issue in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue zowel in de PR als in je Discord-thread. Bijdragers kunnen PR's geen labels geven, dus de titel is voor beheerders en automatisering het signaal aan de PR-zijde. Blokkerende problemen met een PR worden gemerged; zonder PR worden ze mogelijk toch uitgebracht.
6. Geen bericht is goed bericht. Als je deze periode mist, wordt je oplossing meestal in de volgende cyclus opgenomen.

## Volgende stappen

<CardGroup cols={2}>
  <Card title="Kanaalplugins" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Bouw een Plugin voor een berichtenkanaal
  </Card>
  <Card title="Providerplugins" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Bouw een Plugin voor een modelprovider
  </Card>
  <Card title="CLI-backendplugins" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Registreer een lokale AI-CLI-backend
  </Card>
  <Card title="SDK-overzicht" icon="book-open" href="/nl/plugins/sdk-overview">
    Naslag voor de importmap en registratie-API
  </Card>
  <Card title="Runtime-helpers" icon="settings" href="/nl/plugins/sdk-runtime">
    TTS, zoeken en subagent via api.runtime
  </Card>
  <Card title="Testen" icon="test-tubes" href="/nl/plugins/sdk-testing">
    Testhulpmiddelen en -patronen
  </Card>
  <Card title="Pluginmanifest" icon="file-json" href="/nl/plugins/manifest">
    Volledige naslag voor het manifestschema
  </Card>
</CardGroup>

## Gerelateerd

- [Plugin-hooks](/nl/plugins/hooks)
- [Pluginarchitectuur](/nl/plugins/architecture)
