---
doc-schema-version: 1
read_when:
    - Je wilt een nieuwe OpenClaw-plugin maken
    - Je hebt een snelstartgids nodig voor de ontwikkeling van Plugins
    - Je kiest tussen documentatie voor kanalen, providers, CLI-backends, tools of hooks
sidebarTitle: Getting Started
summary: Maak binnen enkele minuten je eerste OpenClaw-plugin
title: Plugins bouwen
x-i18n:
    generated_at: "2026-07-12T09:07:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins breiden OpenClaw uit zonder de kern te wijzigen. Een plugin kan een berichtenkanaal, modelprovider, lokale CLI-backend, agenttool, hook, mediaprovider of een andere mogelijkheid onder beheer van de plugin toevoegen.

U hoeft geen externe plugin aan de OpenClaw-repository toe te voegen. Publiceer het pakket op [ClawHub](/clawhub), waarna gebruikers het installeren met:

```bash
openclaw plugins install clawhub:<package-name>
```

Tijdens de overgang bij de lancering worden kale pakketspecificaties nog steeds vanuit npm geïnstalleerd. Gebruik het voorvoegsel `clawhub:` wanneer u ClawHub-resolutie wilt.

## Vereisten

- Node 22.19+, Node 23.11+ of Node 24+, en `npm` of `pnpm`.
- TypeScript-ESM-modules.
- Voor werk aan een gebundelde plugin binnen de repository kloont u de repository en voert u `pnpm install` uit.
  Pluginontwikkeling vanuit een broncodecheckout werkt uitsluitend met pnpm, omdat OpenClaw gebundelde plugins ontdekt via workspace-pakketten in `extensions/*`.

## Kies de pluginvorm

<CardGroup cols={2}>
  <Card title="Kanaalplugin" icon="messages-square" href="/nl/plugins/sdk-channel-plugins">
    Verbind OpenClaw met een berichtenplatform.
  </Card>
  <Card title="Providerplugin" icon="cpu" href="/nl/plugins/sdk-provider-plugins">
    Voeg een provider toe voor modellen, media, zoeken, ophalen, spraak of realtimeverwerking.
  </Card>
  <Card title="CLI-backendplugin" icon="terminal" href="/nl/plugins/cli-backend-plugins">
    Voer een lokale AI-CLI uit via de modelterugval van OpenClaw.
  </Card>
  <Card title="Toolplugin" icon="wrench" href="/nl/plugins/tool-plugins">
    Registreer agenttools.
  </Card>
</CardGroup>

## Snel aan de slag

Bouw een minimale toolplugin door één verplichte agenttool te registreren. Dit is de kortste bruikbare pluginvorm en omvat het pakket, het manifest, het toegangspunt en de lokale verificatie.

<Steps>
  <Step title="Pakketmetagegevens maken">
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

    Gepubliceerde externe plugins moeten runtime-toegangspunten naar gebouwde JavaScript-bestanden laten verwijzen. Zie [SDK-toegangspunten](/nl/plugins/sdk-entrypoints) voor het volledige contract voor toegangspunten.

    Elke plugin heeft een manifest nodig, zelfs zonder configuratie. Runtimetools moeten in `contracts.tools` staan, zodat OpenClaw het eigenaarschap kan bepalen zonder elke pluginruntime direct te laden. Stel `activation.onStartup` bewust in; dit voorbeeld wordt geladen wanneer de Gateway opstart.

    Door de host vertrouwde Plugin-oppervlakken worden eveneens door het manifest afgeschermd en vereisen een expliciete
    declaratie voor geïnstalleerde Plugins: `api.registerAgentToolResultMiddleware(...)`
    vereist dat elke doelruntime in `contracts.agentToolResultMiddleware` wordt vermeld,
    en `api.registerTrustedToolPolicy(...)` vereist elke beleids-id in
    `contracts.trustedToolPolicies`. Deze declaraties houden de inspectie tijdens
    de installatie en de registratie tijdens runtime op elkaar afgestemd.

    Zie [Plugin-manifest](/nl/plugins/manifest) voor elk manifestveld.

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

    Gebruik `definePluginEntry` voor Plugins die geen kanaal-Plugins zijn. Kanaal-Plugins gebruiken
    in plaats daarvan `defineChannelPluginEntry` uit `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="De runtime testen">
    Inspecteer voor een geïnstalleerde of externe Plugin de geladen runtime:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Als de Plugin een CLI-opdracht registreert, voer die opdracht dan ook uit en controleer
    de uitvoer, bijvoorbeeld `openclaw demo-plugin ping`.

    Voor een gebundelde Plugin in deze repository ontdekt OpenClaw Plugin-pakketten
    uit de broncheckout via de `extensions/*`-werkruimte. Voer de meest gerichte
    test uit:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="De pakketinstallatie testen">
    Test vóór publicatie van een pakketklare Plugin dezelfde installatievorm die gebruikers
    krijgen. Voeg eerst een bouwstap toe, laat runtime-ingangen zoals
    `openclaw.extensions` verwijzen naar gebouwde JavaScript, zoals `./dist/index.js`, en zorg
    ervoor dat `npm pack` die `dist/`-uitvoer bevat. TypeScript-broningangen zijn
    uitsluitend bedoeld voor broncheckouts en lokale ontwikkelpaden.

    Pak vervolgens de Plugin in en installeer het tar-archief met `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` gebruikt het door OpenClaw beheerde npm-project per Plugin en detecteert daardoor
    fouten in runtime-afhankelijkheden die tests vanuit een broncheckout kunnen verhullen. Hiermee wordt
    de pakket- en afhankelijkheidsstructuur aangetoond, niet het aan een catalogus gekoppelde officiële vertrouwen.
    Runtime-imports moeten in `dependencies` of `optionalDependencies` staan;
    afhankelijkheden die uitsluitend in `devDependencies` staan, worden niet geïnstalleerd voor het
    beheerde runtimeproject.

    Gebruik een onbewerkte archief-/padinstallatie niet als definitief bewijs voor officieel of
    geprivilegieerd plugingedrag. Onbewerkte bronbestanden zijn nuttig voor lokaal debuggen, maar
    ze bewijzen niet hetzelfde afhankelijkheidspad als installaties via npm of ClawHub. Als
    je plugin afhankelijk is van de vertrouwde status van een officiële plugin, voeg dan een tweede bewijs toe
    via een officiële installatie op basis van een catalogus of een gepubliceerd pakketpad dat
    officieel vertrouwen registreert. Zie
    [Afhankelijkheidsresolutie voor plugins](/nl/plugins/dependency-resolution) voor
    details over de installatiehoofdmap en het eigenaarschap van afhankelijkheden.

  </Step>

  <Step title="Publiceren">
    Valideer het pakket vóór publicatie:

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

Tools kunnen vereist of optioneel zijn. Vereiste tools zijn altijd beschikbaar wanneer de
plugin is ingeschakeld. Voor optionele tools moet de gebruiker zich expliciet aanmelden voordat OpenClaw
de runtime van de bijbehorende plugin laadt.

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

Gebruikers melden zich aan met `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // of ["my-plugin"] voor elke tool van één plugin
}
```

Optionele tools bepalen of een tool aan het model wordt blootgesteld. Gebruik
[pluginmachtigingsverzoeken](/nl/plugins/plugin-permission-requests) wanneer een tool
of hook om goedkeuring moet vragen nadat het model deze heeft geselecteerd en voordat de
actie wordt uitgevoerd.

Gebruik optionele tools voor neveneffecten, ongebruikelijke binaire bestanden of mogelijkheden die
niet standaard moeten worden blootgesteld. Toolnamen mogen niet conflicteren met namen van kerntools;
conflicten worden overgeslagen en gemeld in de plugindiagnostiek. Ongeldige
registraties worden op dezelfde manier overgeslagen en gemeld: een ontbrekende niet-lege
`name`, een `execute` die geen functie is, of een tooldescriptor zonder een `parameters`-
object.

Toolfactories ontvangen een door de runtime aangeleverd contextobject. Gebruik `ctx.activeModel`
wanneer een tool informatie over het actieve model voor de huidige beurt moet loggen, weergeven
of zich eraan moet aanpassen; dit kan `provider`, `modelId` en `modelRef` bevatten. Beschouw dit als
informatieve runtimemetadata, niet als een beveiligingsgrens tegen de lokale
beheerder, geïnstalleerde plugincode of een aangepaste OpenClaw-runtime. Gevoelige
lokale tools moeten nog steeds expliciete aanmelding door de plugin of beheerder vereisen en
veilig weigeren wanneer metadata van het actieve model ontbreekt of ongeschikt is.

Het manifest declareert eigenaarschap en detectie; bij uitvoering wordt nog steeds de actuele
geregistreerde toolimplementatie aangeroepen. Houd `toolMetadata.<tool>.optional: true`
in overeenstemming met `api.registerTool(..., { optional: true })`, zodat OpenClaw kan voorkomen
dat die pluginruntime wordt geladen totdat de tool expliciet op de toelatingslijst staat.

## Importconventies

Importeer vanuit gerichte SDK-subpaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Importeer niet vanuit de verouderde hoofdbarrel:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Gebruik binnen je pluginpakket lokale barrelbestanden zoals `api.ts` en
`runtime-api.ts` voor interne imports. Importeer je eigen plugin niet via een
SDK-pad. Providerspecifieke helpers moeten in het providerpakket blijven, tenzij
de koppeling werkelijk generiek is.

Aangepaste Gateway-RPC-methoden zijn een geavanceerd toegangspunt. Houd ze onder een
pluginspecifiek voorvoegsel; kernbeheerdersnaamruimten zoals `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` en `update.*` blijven gereserveerd
en worden omgezet naar `operator.admin`. De
`openclaw/plugin-sdk/gateway-method-runtime`-brug is gereserveerd voor plugin-HTTP-
routes die `contracts.gatewayMethodDispatch: ["authenticated-request"]` declareren.

Zie [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview) voor de volledige importtoewijzing.

## Controlelijst vóór indiening

<Check>**package.json** bevat correcte `openclaw`-metadata</Check>
<Check>Het manifest **openclaw.plugin.json** is aanwezig en geldig</Check>
<Check>Het toegangspunt gebruikt `defineChannelPluginEntry` of `definePluginEntry`</Check>
<Check>Alle imports gebruiken gerichte `plugin-sdk/<subpath>`-paden</Check>
<Check>Interne imports gebruiken lokale modules, geen SDK-zelfimports</Check>
<Check>Tests slagen (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` slaagt (plugins in de repository)</Check>

## Testen met bètaversies

1. Houd releases van [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) in de gaten (`Watch` > `Releases`). Bètatags zien eruit als `v2026.3.N-beta.1`. Je kunt ook [@openclaw](https://x.com/openclaw) op X volgen voor releaseaankondigingen.
2. Test je Plugin tegen de bètatag zodra deze verschijnt. De periode vóór de stabiele release duurt doorgaans slechts enkele uren.
3. Plaats na het testen een bericht in de thread van je Plugin in het Discord-kanaal `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), met `all good` of een beschrijving van wat niet meer werkte. Maak een thread als je er nog geen hebt.
4. Als er iets niet werkt, open of werk dan een issue bij met de titel `Beta blocker: <plugin-name> - <summary>` en ken het label `beta-blocker` toe. Link het issue in je thread.
5. Open een PR naar `main` met de titel `fix(<plugin-id>): beta blocker - <summary>` en link het issue zowel in de PR als in je Discord-thread. Bijdragers kunnen geen labels aan PR's toekennen, dus de titel is voor beheerders en automatisering het signaal aan de PR-zijde. Blokkerende problemen met een PR worden samengevoegd; blokkerende problemen zonder PR worden mogelijk toch uitgebracht.
6. Geen bericht betekent groen licht. Als je de periode mist, wordt je oplossing doorgaans in de volgende cyclus opgenomen.

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
    API-naslag voor importtoewijzingen en registratie
  </Card>
  <Card title="Runtime-hulpfuncties" icon="settings" href="/nl/plugins/sdk-runtime">
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
