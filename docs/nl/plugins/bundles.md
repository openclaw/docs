---
read_when:
    - Je wilt een bundel installeren die compatibel is met Codex, Claude of Cursor
    - Je moet begrijpen hoe OpenClaw bundelinhoud vertaalt naar native functies
    - Je debugt bundeldetectie of ontbrekende mogelijkheden
summary: Installeer en gebruik Codex-, Claude- en Cursor-bundels als OpenClaw-plugins
title: Plugin-bundels
x-i18n:
    generated_at: "2026-05-11T20:37:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kan plugins uit drie externe ecosystemen installeren: **Codex**, **Claude**
en **Cursor**. Deze worden **bundels** genoemd: pakketten met inhoud en metadata die
OpenClaw omzet naar native functies zoals Skills, hooks en MCP-tools.

<Info>
  Bundels zijn **niet** hetzelfde als native OpenClaw-plugins. Native plugins draaien
  in-process en kunnen elke capability registreren. Bundels zijn inhoudspakketten met
  selectieve functietoewijzing en een smallere vertrouwensgrens.
</Info>

## Waarom bundels bestaan

Veel nuttige plugins worden gepubliceerd in Codex-, Claude- of Cursor-indeling. In plaats
van auteurs te verplichten ze te herschrijven als native OpenClaw-plugins, detecteert OpenClaw
deze indelingen en zet de ondersteunde inhoud om naar de native functieset. Dit betekent dat
je een Claude-commandopakket of een Codex-Skills-bundel kunt installeren en meteen gebruiken.

## Een bundel installeren

<Steps>
  <Step title="Installeren vanuit een directory, archief of marketplace">
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

    Bundels worden getoond als `Format: bundle` met een subtype van `codex`, `claude` of `cursor`.

  </Step>

  <Step title="Herstarten en gebruiken">
    ```bash
    openclaw gateway restart
    ```

    Toegewezen functies (Skills, hooks, MCP-tools, LSP-standaarden) zijn beschikbaar in de volgende sessie.

  </Step>
</Steps>

## Wat OpenClaw omzet vanuit bundels

Niet elke bundelfunctie draait vandaag in OpenClaw. Dit werkt al en dit
wordt wel gedetecteerd maar nog niet aangesloten.

### Nu ondersteund

| Functie       | Hoe deze wordt omgezet                                                                                 | Van toepassing op |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill-inhoud | Bundel-Skill-roots worden geladen als normale OpenClaw Skills                                           | Alle indelingen    |
| Commando's      | `commands/` en `.cursor/commands/` worden behandeld als Skill-roots                                  | Claude, Cursor |
| Hook-pakketten    | OpenClaw-achtige `HOOK.md` + `handler.ts`-layouts                                             | Codex          |
| MCP-tools     | Bundel-MCP-config wordt samengevoegd in ingebedde Pi-instellingen; ondersteunde stdio- en HTTP-servers worden geladen | Alle indelingen    |
| LSP-servers   | Claude `.lsp.json` en in het manifest gedeclareerde `lspServers` worden samengevoegd in ingebedde Pi-LSP-standaarden  | Claude         |
| Instellingen      | Claude `settings.json` geïmporteerd als ingebedde Pi-standaarden                                     | Claude         |

#### Skill-inhoud

- bundel-Skill-roots worden geladen als normale OpenClaw-Skill-roots
- Claude-`commands`-roots worden behandeld als extra Skill-roots
- Cursor-`.cursor/commands`-roots worden behandeld als extra Skill-roots

Dit betekent dat Claude-markdowncommandobestanden werken via de normale OpenClaw-Skill-
loader. Cursor-commandomarkdown werkt via hetzelfde pad.

#### Hook-pakketten

- bundel-hook-roots werken **alleen** wanneer ze de normale OpenClaw-hook-pack-
  layout gebruiken. Vandaag is dit vooral de Codex-compatibele situatie:
  - `HOOK.md`
  - `handler.ts` of `handler.js`

#### MCP voor Pi

- ingeschakelde bundels kunnen MCP-serverconfig bijdragen
- OpenClaw voegt bundel-MCP-config samen in de effectieve ingebedde Pi-instellingen als
  `mcpServers`
- OpenClaw stelt ondersteunde bundel-MCP-tools beschikbaar tijdens beurten van ingebedde Pi-agents door
  stdio-servers te starten of verbinding te maken met HTTP-servers
- de `coding`- en `messaging`-toolprofielen bevatten standaard bundel-MCP-tools;
  gebruik `tools.deny: ["bundle-mcp"]` om je af te melden voor een agent of Gateway
- project-lokale Pi-instellingen blijven van toepassing na bundelstandaarden, zodat werkruimte-
  instellingen bundel-MCP-vermeldingen kunnen overschrijven wanneer nodig
- bundel-MCP-toolcatalogi worden deterministisch gesorteerd vóór registratie, zodat
  upstreamwijzigingen in de volgorde van `listTools()` geen prompt-cache-toolblokken laten schommelen

##### Transports

MCP-servers kunnen stdio- of HTTP-transport gebruiken:

**Stdio** start een childproces:

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

- `transport` mag worden ingesteld op `"streamable-http"` of `"sse"`; wanneer dit wordt weggelaten, gebruikt OpenClaw `sse`
- `type: "http"` is een CLI-native downstreamvorm; gebruik `transport: "streamable-http"` in OpenClaw-config. `openclaw mcp set` en `openclaw doctor --fix` normaliseren de algemene alias.
- alleen `http:`- en `https:`-URL-schema's zijn toegestaan
- `headers`-waarden ondersteunen `${ENV_VAR}`-interpolatie
- een serververmelding met zowel `command` als `url` wordt geweigerd
- URL-inloggegevens (userinfo en queryparameters) worden geredigeerd uit tool-
  beschrijvingen en logs
- `connectionTimeoutMs` overschrijft de standaard verbindingstime-out van 30 seconden voor
  zowel stdio- als HTTP-transports

##### Toolnaamgeving

OpenClaw registreert bundel-MCP-tools met provider-veilige namen in de vorm
`serverName__toolName`. Bijvoorbeeld: een server met sleutel `"vigil-harbor"` die een
`memory_search`-tool beschikbaar stelt, wordt geregistreerd als `vigil-harbor__memory_search`.

- tekens buiten `A-Za-z0-9_-` worden vervangen door `-`
- fragmenten die met een niet-letter zouden beginnen, krijgen een letterprefix, zodat numerieke
  serversleutels zoals `12306` provider-veilige toolprefixes worden
- serverprefixes zijn beperkt tot 30 tekens
- volledige toolnamen zijn beperkt tot 64 tekens
- lege servernamen vallen terug op `mcp`
- botsende geschoonde namen worden onderscheiden met numerieke suffixen
- de uiteindelijke blootgestelde toolvolgorde is deterministisch op veilige naam om herhaalde Pi-
  beurten cache-stabiel te houden
- profielfiltering behandelt alle tools van één bundel-MCP-server als plugin-owned
  door `bundle-mcp`, zodat profiel-allowlists en deny lists zowel
  individuele blootgestelde toolnamen als de `bundle-mcp`-pluginsleutel kunnen bevatten

#### Ingebedde Pi-instellingen

- Claude `settings.json` wordt geïmporteerd als standaard ingebedde Pi-instellingen wanneer de
  bundel is ingeschakeld
- OpenClaw schoont shell-overschrijvingssleutels op voordat ze worden toegepast

Opgeschoonde sleutels:

- `shellPath`
- `shellCommandPrefix`

#### Ingebedde Pi-LSP

- ingeschakelde Claude-bundels kunnen LSP-serverconfig bijdragen
- OpenClaw laadt `.lsp.json` plus alle in het manifest gedeclareerde `lspServers`-paden
- bundel-LSP-config wordt samengevoegd in de effectieve ingebedde Pi-LSP-standaarden
- alleen ondersteunde stdio-backed LSP-servers zijn vandaag uitvoerbaar; niet-ondersteunde
  transports verschijnen nog steeds in `openclaw plugins inspect <id>`

### Gedetecteerd maar niet uitgevoerd

Deze worden herkend en getoond in diagnostics, maar OpenClaw voert ze niet uit:

- Claude `agents`, `hooks.json`-automatisering, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex inline/app-metadata buiten capabilityrapportage

## Bundelindelingen

<AccordionGroup>
  <Accordion title="Codex-bundels">
    Markeringen: `.codex-plugin/plugin.json`

    Optionele inhoud: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-bundels passen het best bij OpenClaw wanneer ze Skill-roots en OpenClaw-achtige
    hook-packdirectories (`HOOK.md` + `handler.ts`) gebruiken.

  </Accordion>

  <Accordion title="Claude-bundels">
    Twee detectiemodi:

    - **Manifestgebaseerd:** `.claude-plugin/plugin.json`
    - **Zonder manifest:** standaard Claude-layout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-specifiek gedrag:

    - `commands/` wordt behandeld als Skill-inhoud
    - `settings.json` wordt geïmporteerd in ingebedde Pi-instellingen (shell-overschrijvingssleutels worden opgeschoond)
    - `.mcp.json` stelt ondersteunde stdio-tools beschikbaar aan ingebedde Pi
    - `.lsp.json` plus in het manifest gedeclareerde `lspServers`-paden worden geladen in ingebedde Pi-LSP-standaarden
    - `hooks/hooks.json` wordt gedetecteerd maar niet uitgevoerd
    - aangepaste componentpaden in het manifest zijn additief (ze breiden standaarden uit, ze vervangen ze niet)

  </Accordion>

  <Accordion title="Cursor-bundels">
    Markeringen: `.cursor-plugin/plugin.json`

    Optionele inhoud: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wordt behandeld als Skill-inhoud
    - `.cursor/rules/`, `.cursor/agents/` en `.cursor/hooks.json` zijn alleen detectie

  </Accordion>
</AccordionGroup>

## Detectieprioriteit

OpenClaw controleert eerst op native pluginindeling:

1. `openclaw.plugin.json` of geldige `package.json` met `openclaw.extensions` — behandeld als **native plugin**
2. Bundelmarkeringen (`.codex-plugin/`, `.claude-plugin/` of standaard Claude/Cursor-layout) — behandeld als **bundel**

Als een directory beide bevat, gebruikt OpenClaw het native pad. Dit voorkomt dat
dual-format-pakketten gedeeltelijk als bundels worden geïnstalleerd.

## Runtimeafhankelijkheden en opschoning

- Compatibele bundels van derden krijgen geen startup-`npm install`-reparatie. Ze
  moeten worden geïnstalleerd via `openclaw plugins install` en alles meeleveren
  wat ze nodig hebben in de geïnstalleerde plugindirectory.
- Door OpenClaw beheerde gebundelde plugins worden lichtgewicht in core meegeleverd of
  zijn downloadbaar via de plugininstaller. Gateway-startup draait nooit een
  package manager voor ze.
- `openclaw doctor --fix` verwijdert verouderde gestagede afhankelijkheidsdirectories en kan
  downloadbare plugins herstellen die ontbreken in de lokale pluginindex wanneer
  config ernaar verwijst.

## Beveiliging

Bundels hebben een smallere vertrouwensgrens dan native plugins:

- OpenClaw laadt **geen** willekeurige bundel-runtimemodules in-process
- Skills- en hook-packpaden moeten binnen de pluginroot blijven (grensgecontroleerd)
- Instellingenbestanden worden gelezen met dezelfde grenscontroles
- Ondersteunde stdio-MCP-servers kunnen als subprocessen worden gestart

Dit maakt bundels standaard veiliger, maar je moet bundels van derden nog steeds
behandelen als vertrouwde inhoud voor de functies die ze wel blootstellen.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Bundel wordt gedetecteerd maar capabilities draaien niet">
    Voer `openclaw plugins inspect <id>` uit. Als een capability wordt vermeld maar is gemarkeerd als
    niet aangesloten, is dat een productlimiet, geen kapotte installatie.
  </Accordion>

  <Accordion title="Claude-commandobestanden verschijnen niet">
    Zorg ervoor dat de bundel is ingeschakeld en dat de markdownbestanden zich in een gedetecteerde
    `commands/`- of `skills/`-root bevinden.
  </Accordion>

  <Accordion title="Claude-instellingen worden niet toegepast">
    Alleen ingebedde Pi-instellingen uit `settings.json` worden ondersteund. OpenClaw behandelt
    bundelinstellingen niet als ruwe configpatches.
  </Accordion>

  <Accordion title="Claude-hooks worden niet uitgevoerd">
    `hooks/hooks.json` is alleen detectie. Als je uitvoerbare hooks nodig hebt, gebruik dan de
    OpenClaw-hook-packlayout of lever een native plugin.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Plugins installeren en configureren](/nl/tools/plugin)
- [Plugins bouwen](/nl/plugins/building-plugins) — maak een native plugin
- [Pluginmanifest](/nl/plugins/manifest) — native manifestschema
