---
read_when:
    - Je wilt een Codex-, Claude- of Cursor-compatibele bundel installeren
    - Je moet begrijpen hoe OpenClaw bundelinhoud aan native functies koppelt
    - Je debugt bundeldetectie of ontbrekende mogelijkheden
summary: Installeer en gebruik Codex-, Claude- en Cursor-bundels als OpenClaw-plugins
title: Plugin-bundels
x-i18n:
    generated_at: "2026-06-27T17:50:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kan plugins installeren uit drie externe ecosystemen: **Codex**, **Claude**
en **Cursor**. Deze worden **bundels** genoemd: pakketten met inhoud en metadata
die OpenClaw omzet naar native functies zoals Skills, hooks en MCP-tools.

<Info>
  Bundels zijn **niet** hetzelfde als native OpenClaw-plugins. Native plugins draaien
  in hetzelfde proces en kunnen elke capability registreren. Bundels zijn inhoudspakketten met
  selectieve functietoewijzing en een smallere vertrouwensgrens.
</Info>

## Waarom bundels bestaan

Veel nuttige plugins worden gepubliceerd in Codex-, Claude- of Cursor-indeling. In plaats
van auteurs te verplichten ze te herschrijven als native OpenClaw-plugins, detecteert OpenClaw
deze indelingen en zet de ondersteunde inhoud om naar de native functieset. Dit betekent
dat je een Claude-commandopakket of een Codex-Skill-bundel kunt installeren
en meteen kunt gebruiken.

## Een bundel installeren

<Steps>
  <Step title="Installeren vanuit een map, archief of marketplace">
    ```bash
    # Lokale map
    openclaw plugins install ./my-bundle

    # Archief
    openclaw plugins install ./my-bundle.tgz

    # Claude-marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Detectie verifiëren">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundels worden weergegeven als `Format: bundle` met een subtype `codex`, `claude` of `cursor`.

  </Step>

  <Step title="Herstarten en gebruiken">
    ```bash
    openclaw gateway restart
    ```

    Toegewezen functies (Skills, hooks, MCP-tools, LSP-standaarden) zijn beschikbaar in de volgende sessie.

  </Step>
</Steps>

## Wat OpenClaw uit bundels omzet

Niet elke bundelfunctie draait vandaag in OpenClaw. Dit werkt nu en dit
wordt wel gedetecteerd maar nog niet gekoppeld.

### Nu ondersteund

| Functie       | Hoe deze wordt omgezet                                                                            | Van toepassing op |
| ------------- | ------------------------------------------------------------------------------------------------- | ----------------- |
| Skill-inhoud  | Skill-roots van bundels worden geladen als normale OpenClaw-Skills                                | Alle indelingen   |
| Commando's    | `commands/` en `.cursor/commands/` worden behandeld als Skill-roots                               | Claude, Cursor    |
| Hook-pakketten | OpenClaw-achtige `HOOK.md` + `handler.ts`-layouts                                                | Codex             |
| MCP-tools     | MCP-configuratie van bundels wordt samengevoegd in ingebedde OpenClaw-instellingen; ondersteunde stdio- en HTTP-servers worden geladen | Alle indelingen   |
| LSP-servers   | Claude `.lsp.json` en in het manifest gedeclareerde `lspServers` worden samengevoegd in ingebedde OpenClaw-LSP-standaarden | Claude            |
| Instellingen  | Claude `settings.json` wordt geïmporteerd als ingebedde OpenClaw-standaarden                      | Claude            |

#### Skill-inhoud

- Skill-roots van bundels worden geladen als normale OpenClaw-Skill-roots
- Claude-`commands`-roots worden behandeld als aanvullende Skill-roots
- Cursor-`.cursor/commands`-roots worden behandeld als aanvullende Skill-roots

Dit betekent dat Claude-markdowncommandobestanden werken via de normale OpenClaw-Skill-
loader. Cursor-commandmarkdown werkt via hetzelfde pad.

#### Hook-pakketten

- hook-roots van bundels werken **alleen** wanneer ze de normale OpenClaw-hook-pakket-
  layout gebruiken. Vandaag is dit vooral het Codex-compatibele geval:
  - `HOOK.md`
  - `handler.ts` of `handler.js`

#### MCP voor ingebedde OpenClaw

- ingeschakelde bundels kunnen MCP-serverconfiguratie bijdragen
- OpenClaw voegt MCP-configuratie van bundels samen in de effectieve ingebedde OpenClaw-instellingen als
  `mcpServers`
- OpenClaw stelt ondersteunde MCP-tools uit bundels beschikbaar tijdens ingebedde OpenClaw-agentbeurten door
  stdio-servers te starten of verbinding te maken met HTTP-servers
- de toolprofielen `coding` en `messaging` bevatten standaard MCP-tools uit bundels;
  gebruik `tools.deny: ["bundle-mcp"]` om je af te melden voor een agent of Gateway
- projectlokale ingebedde agentinstellingen blijven na bundelstandaarden van toepassing, zodat workspace-
  instellingen waar nodig MCP-vermeldingen uit bundels kunnen overschrijven
- MCP-toolcatalogi van bundels worden deterministisch gesorteerd vóór registratie, zodat
  wijzigingen in upstream-`listTools()`-volgorde prompt-cache-toolblokken niet laten schommelen

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

**HTTP** maakt standaard verbinding met een draaiende MCP-server via `sse`, of via `streamable-http` wanneer dat is gevraagd:

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

- `transport` mag worden ingesteld op `"streamable-http"` of `"sse"`; wanneer dit is weggelaten, gebruikt OpenClaw `sse`
- `type: "http"` is een CLI-native downstream-vorm; gebruik `transport: "streamable-http"` in OpenClaw-configuratie. `openclaw mcp set` en `openclaw doctor --fix` normaliseren de gangbare alias.
- alleen URL-schema's `http:` en `https:` zijn toegestaan
- `headers`-waarden ondersteunen `${ENV_VAR}`-interpolatie
- een serververmelding met zowel `command` als `url` wordt geweigerd
- URL-credentials (userinfo en queryparameters) worden geredigeerd uit tool-
  beschrijvingen en logs
- `connectionTimeoutMs` overschrijft de standaard verbindingstime-out van 30 seconden voor
  zowel stdio- als HTTP-transports

##### Toolnaamgeving

OpenClaw registreert MCP-tools uit bundels met provider-veilige namen in de vorm
`serverName__toolName`. Een server met sleutel `"vigil-harbor"` die bijvoorbeeld een
`memory_search`-tool beschikbaar stelt, wordt geregistreerd als `vigil-harbor__memory_search`.

- tekens buiten `A-Za-z0-9_-` worden vervangen door `-`
- fragmenten die met een niet-letter zouden beginnen krijgen een lettervoorvoegsel, zodat numerieke
  serversleutels zoals `12306` provider-veilige toolvoorvoegsels worden
- servervoorvoegsels zijn begrensd op 30 tekens
- volledige toolnamen zijn begrensd op 64 tekens
- lege servernamen vallen terug op `mcp`
- botsende opgeschoonde namen worden onderscheiden met numerieke achtervoegsels
- de uiteindelijke weergegeven toolvolgorde is deterministisch op veilige naam om herhaalde ingebedde-agent-
  beurten cachestabiel te houden
- profielfiltering behandelt alle tools van één MCP-server uit een bundel als plugin-eigendom
  van `bundle-mcp`, zodat profiel-toestaanlijsten en weigerlijsten zowel
  afzonderlijke weergegeven toolnamen als de `bundle-mcp`-pluginsleutel kunnen bevatten

#### Ingebedde OpenClaw-instellingen

- Claude `settings.json` wordt geïmporteerd als standaard ingebedde OpenClaw-instellingen wanneer de
  bundel is ingeschakeld
- OpenClaw schoont shell-overschrijvingssleutels op voordat ze worden toegepast

Opgeschoonde sleutels:

- `shellPath`
- `shellCommandPrefix`

#### Ingebedde OpenClaw-LSP

- ingeschakelde Claude-bundels kunnen LSP-serverconfiguratie bijdragen
- OpenClaw laadt `.lsp.json` plus eventuele in het manifest gedeclareerde `lspServers`-paden
- LSP-configuratie van bundels wordt samengevoegd in de effectieve ingebedde OpenClaw-LSP-standaarden
- alleen ondersteunde stdio-gedreven LSP-servers zijn vandaag uitvoerbaar; niet-ondersteunde
  transports verschijnen nog steeds in `openclaw plugins inspect <id>`

### Gedetecteerd maar niet uitgevoerd

Deze worden herkend en getoond in diagnostiek, maar OpenClaw voert ze niet uit:

- Claude `agents`, `hooks.json`-automatisering, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex inline/app-metadata buiten capability-rapportage

## Bundelindelingen

<AccordionGroup>
  <Accordion title="Codex-bundels">
    Markers: `.codex-plugin/plugin.json`

    Optionele inhoud: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-bundels passen het best bij OpenClaw wanneer ze Skill-roots en OpenClaw-achtige
    hook-pakketmappen (`HOOK.md` + `handler.ts`) gebruiken.

  </Accordion>

  <Accordion title="Claude-bundels">
    Twee detectiemodi:

    - **Op basis van manifest:** `.claude-plugin/plugin.json`
    - **Zonder manifest:** standaard Claude-layout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-specifiek gedrag:

    - `commands/` wordt behandeld als Skill-inhoud
    - `settings.json` wordt geïmporteerd in ingebedde OpenClaw-instellingen (shell-overschrijvingssleutels worden opgeschoond)
    - `.mcp.json` stelt ondersteunde stdio-tools beschikbaar aan ingebedde OpenClaw
    - `.lsp.json` plus in het manifest gedeclareerde `lspServers`-paden worden geladen in ingebedde OpenClaw-LSP-standaarden
    - `hooks/hooks.json` wordt gedetecteerd maar niet uitgevoerd
    - aangepaste componentpaden in het manifest zijn aanvullend (ze breiden standaarden uit, ze vervangen ze niet)

  </Accordion>

  <Accordion title="Cursor-bundels">
    Markers: `.cursor-plugin/plugin.json`

    Optionele inhoud: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wordt behandeld als Skill-inhoud
    - `.cursor/rules/`, `.cursor/agents/` en `.cursor/hooks.json` zijn alleen detecteerbaar

  </Accordion>
</AccordionGroup>

## Detectievolgorde

OpenClaw controleert eerst op native pluginindeling:

1. `openclaw.plugin.json` of geldige `package.json` met `openclaw.extensions` — behandeld als **native plugin**
2. Bundelmarkers (`.codex-plugin/`, `.claude-plugin/` of standaard Claude-/Cursor-layout) — behandeld als **bundel**

Als een map beide bevat, gebruikt OpenClaw het native pad. Dit voorkomt
dat dual-format pakketten gedeeltelijk als bundels worden geïnstalleerd.

## Runtime-afhankelijkheden en opschoning

- Compatibele bundels van derden krijgen geen opstartreparatie met `npm install`. Ze
  moeten worden geïnstalleerd via `openclaw plugins install` en alles meeleveren
  wat ze nodig hebben in de geïnstalleerde pluginmap.
- OpenClaw-eigen gebundelde plugins worden lichtgewicht in core meegeleverd of
  downloadbaar gemaakt via het plugin-installatieprogramma. Gateway-opstart voert nooit een
  package manager voor ze uit.
- `openclaw doctor --fix` verwijdert legacy staged-afhankelijkheidsmappen en kan
  downloadbare plugins herstellen die ontbreken in de lokale pluginindex wanneer
  config ernaar verwijst.

## Beveiliging

Bundels hebben een smallere vertrouwensgrens dan native plugins:

- OpenClaw laadt **geen** willekeurige runtime-modules uit bundels in hetzelfde proces
- Skills- en hook-pakketpaden moeten binnen de pluginroot blijven (grensgecontroleerd)
- Instellingenbestanden worden met dezelfde grenscontroles gelezen
- Ondersteunde stdio-MCP-servers kunnen als subprocessen worden gestart

Dit maakt bundels standaard veiliger, maar je moet bundels van derden nog steeds
behandelen als vertrouwde inhoud voor de functies die ze wel beschikbaar stellen.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Bundel is gedetecteerd maar capabilities draaien niet">
    Voer `openclaw plugins inspect <id>` uit. Als een capability wordt vermeld maar is gemarkeerd als
    niet gekoppeld, is dat een productlimiet, geen defecte installatie.
  </Accordion>

  <Accordion title="Claude-commandobestanden verschijnen niet">
    Zorg dat de bundel is ingeschakeld en dat de markdownbestanden binnen een gedetecteerde
    `commands/`- of `skills/`-root staan.
  </Accordion>

  <Accordion title="Claude-instellingen worden niet toegepast">
    Alleen ingebedde OpenClaw-instellingen uit `settings.json` worden ondersteund. OpenClaw behandelt
    bundelinstellingen niet als ruwe configpatches.
  </Accordion>

  <Accordion title="Claude-hooks worden niet uitgevoerd">
    `hooks/hooks.json` is alleen detecteerbaar. Als je uitvoerbare hooks nodig hebt, gebruik dan de
    OpenClaw-hook-pakketlayout of lever een native plugin.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Plugins installeren en configureren](/nl/tools/plugin)
- [Plugins bouwen](/nl/plugins/building-plugins) — maak een native plugin
- [Pluginmanifest](/nl/plugins/manifest) — native manifestschema
