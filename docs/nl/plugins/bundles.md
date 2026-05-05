---
read_when:
    - Je wilt een Codex-, Claude- of Cursor-compatibele bundel installeren
    - Je moet begrijpen hoe OpenClaw bundelinhoud omzet in systeemeigen functies
    - Je debugt bundeldetectie of ontbrekende mogelijkheden
summary: Installeer en gebruik Codex-, Claude- en Cursor-bundels als OpenClaw-plugins
title: Plugin-bundels
x-i18n:
    generated_at: "2026-05-05T01:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kan plugins installeren uit drie externe ecosystemen: **Codex**, **Claude**,
en **Cursor**. Deze worden **bundels** genoemd: content- en metadatapakketten die
OpenClaw koppelt aan native functies zoals skills, hooks en MCP-tools.

<Info>
  Bundels zijn **niet** hetzelfde als native OpenClaw-plugins. Native plugins draaien
  in-process en kunnen elke capability registreren. Bundels zijn contentpakketten met
  selectieve functiekoppeling en een smallere vertrouwensgrens.
</Info>

## Waarom bundels bestaan

Veel nuttige plugins worden gepubliceerd in Codex-, Claude- of Cursor-indeling. In plaats
van auteurs te verplichten ze te herschrijven als native OpenClaw-plugins, detecteert OpenClaw
deze indelingen en koppelt hun ondersteunde content aan de native functieset. Dit betekent
dat je een Claude-commandopakket of een Codex-skillbundel kunt installeren
en direct kunt gebruiken.

## Een bundel installeren

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
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

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundels worden weergegeven als `Format: bundle` met een subtype van `codex`, `claude` of `cursor`.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    Gekoppelde functies (skills, hooks, MCP-tools, LSP-standaarden) zijn beschikbaar in de volgende sessie.

  </Step>
</Steps>

## Wat OpenClaw uit bundels koppelt

Niet elke bundelfunctie draait vandaag in OpenClaw. Dit werkt en dit
wordt gedetecteerd maar nog niet aangesloten.

### Nu ondersteund

| Functie       | Hoe het wordt gekoppeld                                                                     | Van toepassing op |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------- |
| Skill-content | Skill-roots van bundels laden als normale OpenClaw-skills                                   | Alle indelingen   |
| Commands      | `commands/` en `.cursor/commands/` worden behandeld als skill-roots                         | Claude, Cursor    |
| Hook-pakketten | OpenClaw-achtige `HOOK.md` + `handler.ts`-layouts                                          | Codex             |
| MCP-tools     | MCP-config van bundels wordt samengevoegd in embedded Pi-instellingen; ondersteunde stdio- en HTTP-servers worden geladen | Alle indelingen |
| LSP-servers   | Claude `.lsp.json` en in het manifest gedeclareerde `lspServers` worden samengevoegd in embedded Pi LSP-standaarden | Claude |
| Instellingen  | Claude `settings.json` wordt geïmporteerd als embedded Pi-standaarden                       | Claude            |

#### Skill-content

- skill-roots van bundels laden als normale OpenClaw-skill-roots
- Claude `commands`-roots worden behandeld als extra skill-roots
- Cursor `.cursor/commands`-roots worden behandeld als extra skill-roots

Dit betekent dat Claude-markdowncommandobestanden werken via de normale OpenClaw-skill
loader. Cursor-commandomarkdown werkt via hetzelfde pad.

#### Hook-pakketten

- hook-roots van bundels werken **alleen** wanneer ze de normale OpenClaw-hookpakket-
  layout gebruiken. Vandaag is dit vooral het Codex-compatibele geval:
  - `HOOK.md`
  - `handler.ts` of `handler.js`

#### MCP voor Pi

- ingeschakelde bundels kunnen MCP-serverconfig bijdragen
- OpenClaw voegt MCP-config van bundels samen in de effectieve embedded Pi-instellingen als
  `mcpServers`
- OpenClaw stelt ondersteunde MCP-tools uit bundels beschikbaar tijdens embedded Pi-agentbeurten door
  stdio-servers te starten of verbinding te maken met HTTP-servers
- de toolprofielen `coding` en `messaging` bevatten standaard MCP-tools uit bundels;
  gebruik `tools.deny: ["bundle-mcp"]` om je af te melden voor een agent of Gateway
- projectlokale Pi-instellingen worden nog steeds toegepast na bundelstandaarden, zodat workspace-
  instellingen waar nodig MCP-vermeldingen uit bundels kunnen overschrijven
- MCP-toolcatalogi van bundels worden deterministisch gesorteerd vóór registratie, zodat
  wijzigingen in de upstream `listTools()`-volgorde prompt-cache-toolblokken niet laten schommelen

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

**HTTP** maakt standaard verbinding met een actieve MCP-server via `sse`, of via `streamable-http` wanneer daarom wordt gevraagd:

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
- `type: "http"` is een CLI-native downstream-vorm; gebruik `transport: "streamable-http"` in OpenClaw-config. `openclaw mcp set` en `openclaw doctor --fix` normaliseren de algemene alias.
- alleen `http:`- en `https:`-URL-schema's zijn toegestaan
- `headers`-waarden ondersteunen `${ENV_VAR}`-interpolatie
- een serververmelding met zowel `command` als `url` wordt geweigerd
- URL-credentials (userinfo en queryparameters) worden geredigeerd uit tool-
  beschrijvingen en logs
- `connectionTimeoutMs` overschrijft de standaard verbindingstime-out van 30 seconden voor
  zowel stdio- als HTTP-transports

##### Toolnaamgeving

OpenClaw registreert MCP-tools uit bundels met providerveilige namen in de vorm
`serverName__toolName`. Bijvoorbeeld: een server met sleutel `"vigil-harbor"` die een
`memory_search`-tool beschikbaar stelt, wordt geregistreerd als `vigil-harbor__memory_search`.

- tekens buiten `A-Za-z0-9_-` worden vervangen door `-`
- serverprefixes zijn beperkt tot 30 tekens
- volledige toolnamen zijn beperkt tot 64 tekens
- lege servernamen vallen terug op `mcp`
- botsende opgeschoonde namen worden onderscheiden met numerieke suffixen
- de uiteindelijke beschikbaar gestelde toolvolgorde is deterministisch op veilige naam om herhaalde Pi-
  beurten cache-stabiel te houden
- profielfiltering behandelt alle tools van één MCP-server uit een bundel als plugin-eigendom
  van `bundle-mcp`, zodat profiel-allowlists en deny-lijsten zowel
  individuele beschikbaar gestelde toolnamen als de Plugin-sleutel `bundle-mcp` kunnen bevatten

#### Embedded Pi-instellingen

- Claude `settings.json` wordt geïmporteerd als standaard embedded Pi-instellingen wanneer de
  bundel is ingeschakeld
- OpenClaw schoont shell-override-sleutels op voordat ze worden toegepast

Opgeschoonde sleutels:

- `shellPath`
- `shellCommandPrefix`

#### Embedded Pi LSP

- ingeschakelde Claude-bundels kunnen LSP-serverconfig bijdragen
- OpenClaw laadt `.lsp.json` plus alle in het manifest gedeclareerde `lspServers`-paden
- LSP-config van bundels wordt samengevoegd in de effectieve embedded Pi LSP-standaarden
- alleen ondersteunde stdio-backed LSP-servers zijn vandaag uitvoerbaar; niet-ondersteunde
  transports verschijnen nog steeds in `openclaw plugins inspect <id>`

### Gedetecteerd maar niet uitgevoerd

Deze worden herkend en getoond in diagnostiek, maar OpenClaw voert ze niet uit:

- Claude `agents`, `hooks.json`-automatisering, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-inline/app-metadata buiten capabilityrapportage

## Bundelindelingen

<AccordionGroup>
  <Accordion title="Codex bundles">
    Markers: `.codex-plugin/plugin.json`

    Optionele content: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-bundels passen het best bij OpenClaw wanneer ze skill-roots en OpenClaw-achtige
    hookpakketmappen gebruiken (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    Twee detectiemodi:

    - **Manifestgebaseerd:** `.claude-plugin/plugin.json`
    - **Zonder manifest:** standaard Claude-layout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-specifiek gedrag:

    - `commands/` wordt behandeld als skill-content
    - `settings.json` wordt geïmporteerd in embedded Pi-instellingen (shell-override-sleutels worden opgeschoond)
    - `.mcp.json` stelt ondersteunde stdio-tools beschikbaar aan embedded Pi
    - `.lsp.json` plus in het manifest gedeclareerde `lspServers`-paden worden geladen in embedded Pi LSP-standaarden
    - `hooks/hooks.json` wordt gedetecteerd maar niet uitgevoerd
    - Aangepaste componentpaden in het manifest zijn additief (ze breiden standaarden uit, vervangen ze niet)

  </Accordion>

  <Accordion title="Cursor bundles">
    Markers: `.cursor-plugin/plugin.json`

    Optionele content: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wordt behandeld als skill-content
    - `.cursor/rules/`, `.cursor/agents/` en `.cursor/hooks.json` zijn alleen detectie

  </Accordion>
</AccordionGroup>

## Detectieprioriteit

OpenClaw controleert eerst op native Plugin-indeling:

1. `openclaw.plugin.json` of geldige `package.json` met `openclaw.extensions` — behandeld als **native Plugin**
2. Bundelmarkers (`.codex-plugin/`, `.claude-plugin/` of standaard Claude/Cursor-layout) — behandeld als **bundel**

Als een map beide bevat, gebruikt OpenClaw het native pad. Dit voorkomt
dat pakketten met dubbele indeling gedeeltelijk als bundels worden geïnstalleerd.

## Runtime-afhankelijkheden en opschoning

- Compatibele bundels van derden krijgen geen startup-`npm install`-reparatie. Ze
  moeten worden geïnstalleerd via `openclaw plugins install` en alles meeleveren
  wat ze nodig hebben in de geïnstalleerde Plugin-map.
- Door OpenClaw beheerde gebundelde plugins worden lichtgewicht in core meegeleverd of
  zijn downloadbaar via de Plugin-installer. Gateway-startup voert nooit een
  package manager voor ze uit.
- `openclaw doctor --fix` verwijdert legacy staged-afhankelijkheidsmappen en kan
  downloadbare plugins herstellen die ontbreken in de lokale Plugin-index wanneer
  config ernaar verwijst.

## Beveiliging

Bundels hebben een smallere vertrouwensgrens dan native plugins:

- OpenClaw laadt **geen** willekeurige bundel-runtime-modules in-process
- Skills en hookpakketpaden moeten binnen de Plugin-root blijven (grensgecontroleerd)
- Instellingenbestanden worden gelezen met dezelfde grenscontroles
- Ondersteunde stdio MCP-servers kunnen als subprocessen worden gestart

Dit maakt bundels standaard veiliger, maar je moet bundels van derden nog steeds behandelen
als vertrouwde content voor de functies die ze wel beschikbaar stellen.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    Voer `openclaw plugins inspect <id>` uit. Als een capability wordt vermeld maar is gemarkeerd als
    niet aangesloten, is dat een productlimiet, geen kapotte installatie.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    Zorg dat de bundel is ingeschakeld en dat de markdownbestanden zich binnen een gedetecteerde
    `commands/`- of `skills/`-root bevinden.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    Alleen embedded Pi-instellingen uit `settings.json` worden ondersteund. OpenClaw behandelt
    bundelinstellingen niet als ruwe configpatches.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` is alleen detectie. Als je uitvoerbare hooks nodig hebt, gebruik dan de
    OpenClaw-hookpakketlayout of lever een native Plugin.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Plugins installeren en configureren](/nl/tools/plugin)
- [Plugins bouwen](/nl/plugins/building-plugins) — maak een native Plugin
- [Pluginmanifest](/nl/plugins/manifest) — native manifestschema
