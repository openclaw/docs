---
read_when:
    - Je wilt een Codex-, Claude- of Cursor-compatibele bundel installeren
    - Je moet begrijpen hoe OpenClaw bundelinhoud naar native functies mapt
    - Je debugt bundeldetectie of ontbrekende mogelijkheden
summary: Codex-, Claude- en Cursor-bundels installeren en gebruiken als OpenClaw-Plugins
title: Plugin-bundels
x-i18n:
    generated_at: "2026-04-30T00:06:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kan plugins installeren uit drie externe ecosystemen: **Codex**, **Claude**,
en **Cursor**. Deze worden **bundels** genoemd: content- en metadatapakketten die
OpenClaw omzet naar native functies zoals Skills, hooks en MCP-tools.

<Info>
  Bundels zijn **niet** hetzelfde als native OpenClaw-plugins. Native plugins draaien
  in-process en kunnen elke capability registreren. Bundels zijn contentpakketten met
  selectieve functie-mapping en een smallere vertrouwensgrens.
</Info>

## Waarom bundels bestaan

Veel nuttige plugins worden gepubliceerd in Codex-, Claude- of Cursor-indeling. In
plaats van auteurs te verplichten ze te herschrijven als native OpenClaw-plugins,
detecteert OpenClaw deze indelingen en zet hun ondersteunde content om naar de native functieset. Dit betekent dat je een Claude-commandopakket of een Codex-Skills-bundel kunt installeren en meteen kunt gebruiken.

## Een bundel installeren

<Steps>
  <Step title="Installeer vanuit een directory, archief of marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Detectie verifiëren">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundels worden weergegeven als `Format: bundle` met een subtype van `codex`, `claude` of `cursor`.

  </Step>

  <Step title="Herstarten en gebruiken">
    ```bash
    openclaw gateway restart
    ```

    Omgezette functies (Skills, hooks, MCP-tools, LSP-standaarden) zijn beschikbaar in de volgende sessie.

  </Step>
</Steps>

## Wat OpenClaw uit bundels omzet

Niet elke bundelfunctie draait vandaag in OpenClaw. Dit is wat werkt en wat
wel wordt gedetecteerd maar nog niet is gekoppeld.

### Nu ondersteund

| Functie       | Hoe deze wordt omgezet                                                                      | Van toepassing op |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------- |
| Skill-content | Bundel-Skill-roots worden geladen als normale OpenClaw Skills                               | Alle indelingen   |
| Commands      | `commands/` en `.cursor/commands/` worden behandeld als Skill-roots                         | Claude, Cursor    |
| Hook-pakketten | OpenClaw-achtige `HOOK.md` + `handler.ts`-layouts                                          | Codex             |
| MCP-tools     | Bundel-MCP-config wordt samengevoegd met ingebedde Pi-instellingen; ondersteunde stdio- en HTTP-servers worden geladen | Alle indelingen |
| LSP-servers   | Claude `.lsp.json` en in het manifest gedeclareerde `lspServers` worden samengevoegd met ingebedde Pi-LSP-standaarden | Claude |
| Instellingen  | Claude `settings.json` wordt geïmporteerd als ingebedde Pi-standaardinstellingen            | Claude            |

#### Skill-content

- bundel-Skill-roots worden geladen als normale OpenClaw-Skill-roots
- Claude `commands`-roots worden behandeld als aanvullende Skill-roots
- Cursor `.cursor/commands`-roots worden behandeld als aanvullende Skill-roots

Dit betekent dat Claude-markdowncommandobestanden werken via de normale OpenClaw-Skill-loader. Cursor-commandmarkdown werkt via hetzelfde pad.

#### Hook-pakketten

- bundel-hook-roots werken **alleen** wanneer ze de normale OpenClaw-hook-pack-layout
  gebruiken. Vandaag is dit voornamelijk de Codex-compatibele situatie:
  - `HOOK.md`
  - `handler.ts` of `handler.js`

#### MCP voor Pi

- ingeschakelde bundels kunnen MCP-serverconfiguratie bijdragen
- OpenClaw voegt bundel-MCP-configuratie samen in de effectieve ingebedde Pi-instellingen als
  `mcpServers`
- OpenClaw stelt ondersteunde bundel-MCP-tools beschikbaar tijdens ingebedde Pi-agentbeurten door
  stdio-servers te starten of verbinding te maken met HTTP-servers
- de toolprofielen `coding` en `messaging` bevatten standaard bundel-MCP-tools;
  gebruik `tools.deny: ["bundle-mcp"]` om dit uit te schakelen voor een agent of Gateway
- projectlokale Pi-instellingen blijven van toepassing na bundelstandaarden, zodat workspace-instellingen
  waar nodig bundel-MCP-items kunnen overschrijven
- bundel-MCP-toolcatalogi worden deterministisch gesorteerd vóór registratie, zodat
  wijzigingen in upstream `listTools()`-volgorde promptcache-toolblokken niet telkens wijzigen

##### Transports

MCP-servers kunnen stdio- of HTTP-transport gebruiken:

**Stdio** start een child process:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** maakt standaard verbinding met een draaiende MCP-server via `sse`, of via `streamable-http` wanneer daarom wordt gevraagd:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` kan worden ingesteld op `"streamable-http"` of `"sse"`; wanneer dit wordt weggelaten, gebruikt OpenClaw `sse`
- `type: "http"` is een CLI-native downstreamvorm; gebruik `transport: "streamable-http"` in OpenClaw-configuratie. `openclaw mcp set` en `openclaw doctor --fix` normaliseren de gebruikelijke alias.
- alleen URL-schema's `http:` en `https:` zijn toegestaan
- `headers`-waarden ondersteunen `${ENV_VAR}`-interpolatie
- een serveritem met zowel `command` als `url` wordt geweigerd
- URL-credentials (userinfo en queryparameters) worden geredigeerd uit toolbeschrijvingen en logs
- `connectionTimeoutMs` overschrijft de standaard verbindingstime-out van 30 seconden voor
  zowel stdio- als HTTP-transports

##### Toolnamen

OpenClaw registreert bundel-MCP-tools met provider-veilige namen in de vorm
`serverName__toolName`. Bijvoorbeeld: een server met sleutel `"vigil-harbor"` die een
`memory_search`-tool beschikbaar stelt, wordt geregistreerd als `vigil-harbor__memory_search`.

- tekens buiten `A-Za-z0-9_-` worden vervangen door `-`
- servervoorvoegsels worden beperkt tot 30 tekens
- volledige toolnamen worden beperkt tot 64 tekens
- lege servernamen vallen terug op `mcp`
- botsende gesanitizede namen worden onderscheiden met numerieke achtervoegsels
- de uiteindelijke blootgestelde toolvolgorde is deterministisch op veilige naam om herhaalde Pi-beurten cache-stabiel te houden
- profielfiltering behandelt alle tools van één bundel-MCP-server als plugin-owned
  door `bundle-mcp`, zodat profiel-allowlists en deny-lists afzonderlijke blootgestelde toolnamen of de `bundle-mcp`-pluginsleutel kunnen bevatten

#### Ingebedde Pi-instellingen

- Claude `settings.json` wordt geïmporteerd als standaard ingebedde Pi-instellingen wanneer de
  bundel is ingeschakeld
- OpenClaw sanitizet shell-override-sleutels voordat ze worden toegepast

Gesanitizede sleutels:

- `shellPath`
- `shellCommandPrefix`

#### Ingebedde Pi-LSP

- ingeschakelde Claude-bundels kunnen LSP-serverconfiguratie bijdragen
- OpenClaw laadt `.lsp.json` plus eventuele in het manifest gedeclareerde `lspServers`-paden
- bundel-LSP-configuratie wordt samengevoegd met de effectieve ingebedde Pi-LSP-standaarden
- alleen ondersteunde stdio-backed LSP-servers kunnen vandaag worden uitgevoerd; niet-ondersteunde
  transports verschijnen nog steeds in `openclaw plugins inspect <id>`

### Gedetecteerd maar niet uitgevoerd

Deze worden herkend en weergegeven in diagnostiek, maar OpenClaw voert ze niet uit:

- Claude `agents`, `hooks.json`-automatisering, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex inline/app-metadata buiten capability-rapportage

## Bundelindelingen

<AccordionGroup>
  <Accordion title="Codex-bundels">
    Markers: `.codex-plugin/plugin.json`

    Optionele content: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-bundels passen het best bij OpenClaw wanneer ze Skill-roots en OpenClaw-achtige
    hook-pack-directories gebruiken (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude-bundels">
    Twee detectiemodi:

    - **Manifestgebaseerd:** `.claude-plugin/plugin.json`
    - **Zonder manifest:** standaard Claude-layout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-specifiek gedrag:

    - `commands/` wordt behandeld als Skill-content
    - `settings.json` wordt geïmporteerd in ingebedde Pi-instellingen (shell-override-sleutels worden gesanitized)
    - `.mcp.json` stelt ondersteunde stdio-tools beschikbaar aan ingebedde Pi
    - `.lsp.json` plus in het manifest gedeclareerde `lspServers`-paden worden geladen in ingebedde Pi-LSP-standaarden
    - `hooks/hooks.json` wordt gedetecteerd maar niet uitgevoerd
    - Aangepaste componentpaden in het manifest zijn additief (ze breiden standaarden uit, vervangen ze niet)

  </Accordion>

  <Accordion title="Cursor-bundels">
    Markers: `.cursor-plugin/plugin.json`

    Optionele content: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wordt behandeld als Skill-content
    - `.cursor/rules/`, `.cursor/agents/` en `.cursor/hooks.json` zijn alleen detectie

  </Accordion>
</AccordionGroup>

## Detectievoorrang

OpenClaw controleert eerst op native pluginindeling:

1. `openclaw.plugin.json` of geldige `package.json` met `openclaw.extensions` — behandeld als **native plugin**
2. Bundelmarkers (`.codex-plugin/`, `.claude-plugin/` of standaard Claude/Cursor-layout) — behandeld als **bundel**

Als een directory beide bevat, gebruikt OpenClaw het native pad. Dit voorkomt dat
dual-format-pakketten gedeeltelijk als bundels worden geïnstalleerd.

## Runtime-afhankelijkheden en opschoning

- Compatibele bundels van derden krijgen geen startup-`npm install`-reparatie. Ze
  moeten via `openclaw plugins install` worden geïnstalleerd en alles meeleveren
  wat ze nodig hebben in de geïnstalleerde plugindirectory.
- Door OpenClaw beheerde verpakte gebundelde plugins hebben een smalle uitzondering: wanneer er één is
  ingeschakeld, kan Gateway-startup ontbrekende gedeclareerde runtime-afhankelijkheden repareren
  vóór import. Operators kunnen die stap inspecteren of repareren met
  `openclaw plugins deps`.
- De releasepijplijn blijft verantwoordelijk voor het leveren van een volledige gebundelde
  dependency-payload wanneer mogelijk (zie de postpublish-verificatieregel in
  [Releasing](/nl/reference/RELEASING)).

## Beveiliging

Bundels hebben een smallere vertrouwensgrens dan native plugins:

- OpenClaw laadt geen willekeurige bundel-runtimemodules in-process
- Skills- en hook-pack-paden moeten binnen de plugin-root blijven (boundary-checked)
- Instellingenbestanden worden gelezen met dezelfde grenscontroles
- Ondersteunde stdio-MCP-servers kunnen als subprocesses worden gestart

Dit maakt bundels standaard veiliger, maar je moet bundels van derden nog steeds behandelen als vertrouwde content voor de functies die ze beschikbaar stellen.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Bundel wordt gedetecteerd maar capabilities draaien niet">
    Voer `openclaw plugins inspect <id>` uit. Als een capability wordt vermeld maar gemarkeerd is als
    niet gekoppeld, is dat een productlimiet, geen kapotte installatie.
  </Accordion>

  <Accordion title="Claude-commandobestanden verschijnen niet">
    Zorg ervoor dat de bundel is ingeschakeld en dat de markdownbestanden zich binnen een gedetecteerde
    `commands/`- of `skills/`-root bevinden.
  </Accordion>

  <Accordion title="Claude-instellingen worden niet toegepast">
    Alleen ingebedde Pi-instellingen uit `settings.json` worden ondersteund. OpenClaw behandelt
    bundelinstellingen niet als raw config patches.
  </Accordion>

  <Accordion title="Claude-hooks worden niet uitgevoerd">
    `hooks/hooks.json` is alleen detectie. Als je uitvoerbare hooks nodig hebt, gebruik dan de
    OpenClaw-hook-pack-layout of lever een native plugin.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Plugins installeren en configureren](/nl/tools/plugin)
- [Plugins bouwen](/nl/plugins/building-plugins) — maak een native plugin
- [Pluginmanifest](/nl/plugins/manifest) — native manifestschema
