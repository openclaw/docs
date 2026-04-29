---
read_when:
    - Je wilt een Codex-, Claude- of Cursor-compatibele bundel installeren
    - Je moet begrijpen hoe OpenClaw bundelinhoud toewijst aan systeemeigen functies
    - Je debugt bundeldetectie of ontbrekende mogelijkheden
summary: Installeer en gebruik Codex-, Claude- en Cursor-bundels als OpenClaw-plugins
title: Plugin-bundels
x-i18n:
    generated_at: "2026-04-29T23:01:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d8dcd6eae5e740c27429454a7396332f1bd3b16c0a4e939321d047b5e2e4ff7
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kan plugins installeren uit drie externe ecosystemen: **Codex**, **Claude**,
en **Cursor**. Deze worden **bundels** genoemd: content- en metadatapakketten die
OpenClaw omzet naar native functies zoals Skills, hooks en MCP-tools.

<Info>
  Bundels zijn **niet** hetzelfde als native OpenClaw-plugins. Native plugins draaien
  in-process en kunnen elke capability registreren. Bundels zijn contentpakketten met
  selectieve functiemapping en een nauwere vertrouwensgrens.
</Info>

## Waarom bundels bestaan

Veel nuttige plugins worden gepubliceerd in Codex-, Claude- of Cursor-indeling. In plaats
van auteurs te verplichten ze te herschrijven als native OpenClaw-plugins, detecteert OpenClaw
deze indelingen en mapt hun ondersteunde content naar de native functieset. Dit betekent dat je een Claude-commandopakket of een Codex-Skill-bundel kunt installeren
en direct kunt gebruiken.

## Een bundel installeren

<Steps>
  <Step title="Installeren vanuit een map, archief of marketplace">
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

    Bundels worden weergegeven als `Format: bundle` met een subtype `codex`, `claude` of `cursor`.

  </Step>

  <Step title="Herstarten en gebruiken">
    ```bash
    openclaw gateway restart
    ```

    Gemapte functies (Skills, hooks, MCP-tools, LSP-standaarden) zijn beschikbaar in de volgende sessie.

  </Step>
</Steps>

## Wat OpenClaw uit bundels mapt

Niet elke bundelfunctie draait vandaag in OpenClaw. Dit is wat werkt en wat
wel wordt gedetecteerd maar nog niet is aangesloten.

### Nu ondersteund

| Functie       | Hoe dit wordt gemapt                                                                        | Van toepassing op |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------- |
| Skill-inhoud  | Bundel-Skill-roots worden geladen als normale OpenClaw-Skills                               | Alle indelingen   |
| Commands      | `commands/` en `.cursor/commands/` worden behandeld als Skill-roots                         | Claude, Cursor    |
| Hook-pakketten | OpenClaw-achtige `HOOK.md` + `handler.ts`-layouts                                           | Codex             |
| MCP-tools     | Bundel-MCP-config wordt samengevoegd met ingebedde Pi-instellingen; ondersteunde stdio- en HTTP-servers worden geladen | Alle indelingen   |
| LSP-servers   | Claude `.lsp.json` en in het manifest gedeclareerde `lspServers` worden samengevoegd met ingebedde Pi-LSP-standaarden | Claude            |
| Instellingen  | Claude `settings.json` wordt geïmporteerd als ingebedde Pi-standaarden                      | Claude            |

#### Skill-inhoud

- bundel-Skill-roots worden geladen als normale OpenClaw-Skill-roots
- Claude-`commands`-roots worden behandeld als aanvullende Skill-roots
- Cursor-`.cursor/commands`-roots worden behandeld als aanvullende Skill-roots

Dit betekent dat Claude-markdowncommandobestanden werken via de normale OpenClaw-Skill-loader. Cursor-commandomarkdown werkt via hetzelfde pad.

#### Hook-pakketten

- bundel-hook-roots werken **alleen** wanneer ze de normale OpenClaw-hookpakketlayout
  gebruiken. Vandaag is dit vooral de Codex-compatibele situatie:
  - `HOOK.md`
  - `handler.ts` of `handler.js`

#### MCP voor Pi

- ingeschakelde bundels kunnen MCP-serverconfig bijdragen
- OpenClaw voegt bundel-MCP-config samen in de effectieve ingebedde Pi-instellingen als
  `mcpServers`
- OpenClaw stelt ondersteunde bundel-MCP-tools beschikbaar tijdens ingebedde Pi-agentbeurten door
  stdio-servers te starten of verbinding te maken met HTTP-servers
- de toolprofielen `coding` en `messaging` bevatten standaard bundel-MCP-tools;
  gebruik `tools.deny: ["bundle-mcp"]` om dit uit te schakelen voor een agent of Gateway
- projectlokale Pi-instellingen blijven van toepassing na bundelstandaarden, zodat workspace-instellingen
  bundel-MCP-vermeldingen kunnen overschrijven wanneer nodig
- bundel-MCP-toolcatalogi worden deterministisch gesorteerd vóór registratie, zodat
  wijzigingen in upstream `listTools()`-volgorde prompt-cache-toolblokken niet laten schommelen

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

- `transport` mag worden ingesteld op `"streamable-http"` of `"sse"`; wanneer het is weggelaten, gebruikt OpenClaw `sse`
- `type: "http"` is een CLI-native downstreamvorm; gebruik `transport: "streamable-http"` in OpenClaw-config. `openclaw mcp set` en `openclaw doctor --fix` normaliseren de algemene alias.
- alleen URL-schema's `http:` en `https:` zijn toegestaan
- `headers`-waarden ondersteunen `${ENV_VAR}`-interpolatie
- een serververmelding met zowel `command` als `url` wordt geweigerd
- URL-referenties (userinfo en queryparams) worden geredigeerd uit toolbeschrijvingen
  en logs
- `connectionTimeoutMs` overschrijft de standaard verbindingstime-out van 30 seconden voor
  zowel stdio- als HTTP-transports

##### Toolnaamgeving

OpenClaw registreert bundel-MCP-tools met providerveilige namen in de vorm
`serverName__toolName`. Een server met sleutel `"vigil-harbor"` die bijvoorbeeld een
`memory_search`-tool aanbiedt, wordt geregistreerd als `vigil-harbor__memory_search`.

- tekens buiten `A-Za-z0-9_-` worden vervangen door `-`
- serverprefixen worden begrensd op 30 tekens
- volledige toolnamen worden begrensd op 64 tekens
- lege servernamen vallen terug op `mcp`
- botsende opgeschoonde namen worden onderscheiden met numerieke suffixen
- de uiteindelijke blootgestelde toolvolgorde is deterministisch op veilige naam om herhaalde Pi-beurten cache-stabiel te houden
- profielfiltering behandelt alle tools van één bundel-MCP-server als plugin-eigendom
  van `bundle-mcp`, zodat profiel-allowlists en deny lists zowel afzonderlijke
  blootgestelde toolnamen als de `bundle-mcp`-pluginsleutel kunnen bevatten

#### Ingebedde Pi-instellingen

- Claude `settings.json` wordt geïmporteerd als standaard ingebedde Pi-instellingen wanneer de
  bundel is ingeschakeld
- OpenClaw schoont shell-override-sleutels op voordat ze worden toegepast

Opgeschoonde sleutels:

- `shellPath`
- `shellCommandPrefix`

#### Ingebedde Pi-LSP

- ingeschakelde Claude-bundels kunnen LSP-serverconfig bijdragen
- OpenClaw laadt `.lsp.json` plus eventuele in het manifest gedeclareerde `lspServers`-paden
- bundel-LSP-config wordt samengevoegd in de effectieve ingebedde Pi-LSP-standaarden
- alleen ondersteunde stdio-backed LSP-servers kunnen vandaag worden uitgevoerd; niet-ondersteunde
  transports verschijnen nog steeds in `openclaw plugins inspect <id>`

### Gedetecteerd maar niet uitgevoerd

Deze worden herkend en weergegeven in diagnostics, maar OpenClaw voert ze niet uit:

- Claude `agents`, `hooks.json`-automatisering, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex inline/app-metadata buiten capabilityrapportage

## Bundelindelingen

<AccordionGroup>
  <Accordion title="Codex-bundels">
    Markers: `.codex-plugin/plugin.json`

    Optionele content: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-bundels passen het best bij OpenClaw wanneer ze Skill-roots en OpenClaw-achtige
    hookpakketmappen gebruiken (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude-bundels">
    Twee detectiemodi:

    - **Op basis van manifest:** `.claude-plugin/plugin.json`
    - **Zonder manifest:** standaard Claude-layout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-specifiek gedrag:

    - `commands/` wordt behandeld als Skill-content
    - `settings.json` wordt geïmporteerd in ingebedde Pi-instellingen (shell-override-sleutels worden opgeschoond)
    - `.mcp.json` stelt ondersteunde stdio-tools beschikbaar aan ingebedde Pi
    - `.lsp.json` plus in het manifest gedeclareerde `lspServers`-paden worden geladen in ingebedde Pi-LSP-standaarden
    - `hooks/hooks.json` wordt gedetecteerd maar niet uitgevoerd
    - Aangepaste componentpaden in het manifest zijn additief (ze breiden standaarden uit, ze vervangen ze niet)

  </Accordion>

  <Accordion title="Cursor-bundels">
    Markers: `.cursor-plugin/plugin.json`

    Optionele content: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wordt behandeld als Skill-content
    - `.cursor/rules/`, `.cursor/agents/` en `.cursor/hooks.json` zijn alleen detectie

  </Accordion>
</AccordionGroup>

## Detectievolgorde

OpenClaw controleert eerst op de native Plugin-indeling:

1. `openclaw.plugin.json` of geldige `package.json` met `openclaw.extensions`: behandeld als **native Plugin**
2. Bundelmarkers (`.codex-plugin/`, `.claude-plugin/` of standaard Claude-/Cursor-layout): behandeld als **bundel**

Als een map beide bevat, gebruikt OpenClaw het native pad. Dit voorkomt dat
dual-formatpakketten gedeeltelijk als bundels worden geïnstalleerd.

## Runtime-afhankelijkheden en opschoning

- Gebundelde runtime-afhankelijkheden van plugins worden geleverd binnen het OpenClaw-pakket onder
  `dist/*`. OpenClaw voert **geen** `npm install` uit bij het opstarten voor gebundelde
  plugins; de releasepipeline is verantwoordelijk voor het leveren van een complete gebundelde
  afhankelijkhedenpayload (zie de postpublish-verificatieregel in
  [Releasing](/nl/reference/RELEASING)).

## Beveiliging

Bundels hebben een nauwere vertrouwensgrens dan native plugins:

- OpenClaw laadt geen willekeurige bundel-runtime-modules in-process
- Skills en hookpakketpaden moeten binnen de pluginroot blijven (grensgecontroleerd)
- Instellingenbestanden worden gelezen met dezelfde grenscontroles
- Ondersteunde stdio-MCP-servers kunnen als subprocessen worden gestart

Dit maakt bundels standaard veiliger, maar je moet bundels van derden nog steeds behandelen
als vertrouwde content voor de functies die ze wel blootstellen.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Bundel wordt gedetecteerd maar capabilities draaien niet">
    Voer `openclaw plugins inspect <id>` uit. Als een capability wordt vermeld maar is gemarkeerd als
    niet aangesloten, is dat een productlimiet, geen defecte installatie.
  </Accordion>

  <Accordion title="Claude-commandobestanden verschijnen niet">
    Zorg ervoor dat de bundel is ingeschakeld en dat de markdownbestanden binnen een gedetecteerde
    `commands/`- of `skills/`-root staan.
  </Accordion>

  <Accordion title="Claude-instellingen worden niet toegepast">
    Alleen ingebedde Pi-instellingen uit `settings.json` worden ondersteund. OpenClaw behandelt
    bundelinstellingen niet als ruwe configpatches.
  </Accordion>

  <Accordion title="Claude-hooks worden niet uitgevoerd">
    `hooks/hooks.json` is alleen detectie. Als je uitvoerbare hooks nodig hebt, gebruik dan de
    OpenClaw-hookpakketlayout of lever een native Plugin.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Plugins installeren en configureren](/nl/tools/plugin)
- [Plugins bouwen](/nl/plugins/building-plugins) — maak een native Plugin
- [Pluginmanifest](/nl/plugins/manifest) — native manifestschema
