---
read_when:
    - Je wilt een Codex-, Claude- of Cursor-compatibele bundel installeren
    - Je moet begrijpen hoe OpenClaw bundelinhoud aan native functies koppelt
    - Je debugt bundeldetectie of ontbrekende mogelijkheden
summary: Installeer en gebruik Codex-, Claude- en Cursor-bundels als OpenClaw-plugins
title: Plugin-bundels
x-i18n:
    generated_at: "2026-05-02T11:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kan plugins installeren uit drie externe ecosystemen: **Codex**, **Claude**,
en **Cursor**. Deze worden **bundles** genoemd: pakketten met content en metadata die
OpenClaw omzet naar native functies zoals Skills, hooks en MCP-tools.

<Info>
  Bundles zijn **niet** hetzelfde als native OpenClaw-plugins. Native plugins draaien
  in-process en kunnen elke capability registreren. Bundles zijn contentpakketten met
  selectieve functietoewijzing en een nauwere vertrouwensgrens.
</Info>

## Waarom bundles bestaan

Veel nuttige plugins worden gepubliceerd in Codex-, Claude- of Cursor-indeling. In plaats
van auteurs te verplichten ze te herschrijven als native OpenClaw-plugins, detecteert OpenClaw
deze indelingen en zet hun ondersteunde content om naar de native functieset. Dit betekent dat je een Claude-commandopakket of een Codex-Skills-bundle kunt installeren
en direct kunt gebruiken.

## Een bundle installeren

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

  <Step title="Detectie controleren">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles worden weergegeven als `Format: bundle` met een subtype van `codex`, `claude` of `cursor`.

  </Step>

  <Step title="Herstarten en gebruiken">
    ```bash
    openclaw gateway restart
    ```

    Toegewezen functies (Skills, hooks, MCP-tools, LSP-standaarden) zijn beschikbaar in de volgende sessie.

  </Step>
</Steps>

## Wat OpenClaw omzet vanuit bundles

Niet elke bundlefunctie draait vandaag in OpenClaw. Dit werkt en dit
wordt gedetecteerd maar is nog niet aangesloten.

### Nu ondersteund

| Functie       | Hoe deze wordt toegewezen                                                                  | Van toepassing op |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------- |
| Skill-content | Skill-roots van bundles laden als normale OpenClaw-Skills                                  | Alle indelingen   |
| Commands      | `commands/` en `.cursor/commands/` worden behandeld als Skill-roots                        | Claude, Cursor    |
| Hook-pakketten | OpenClaw-achtige `HOOK.md` + `handler.ts`-layouts                                         | Codex             |
| MCP-tools     | Bundle-MCP-configuratie samengevoegd in embedded Pi-instellingen; ondersteunde stdio- en HTTP-servers geladen | Alle indelingen   |
| LSP-servers   | Claude `.lsp.json` en in het manifest gedeclareerde `lspServers` samengevoegd in embedded Pi LSP-standaarden | Claude            |
| Instellingen  | Claude `settings.json` geimporteerd als embedded Pi-standaarden                            | Claude            |

#### Skill-content

- Skill-roots van bundles laden als normale OpenClaw-Skill-roots
- Claude `commands`-roots worden behandeld als extra Skill-roots
- Cursor `.cursor/commands`-roots worden behandeld als extra Skill-roots

Dit betekent dat Claude-markdowncommandobestanden via de normale OpenClaw-Skill-loader werken. Cursor-commandmarkdown werkt via hetzelfde pad.

#### Hook-pakketten

- bundle-hookroots werken **alleen** wanneer ze de normale OpenClaw-hook-pack
  layout gebruiken. Vandaag is dit vooral het Codex-compatibele geval:
  - `HOOK.md`
  - `handler.ts` of `handler.js`

#### MCP voor Pi

- ingeschakelde bundles kunnen MCP-serverconfiguratie bijdragen
- OpenClaw voegt bundle-MCP-configuratie samen in de effectieve embedded Pi-instellingen als
  `mcpServers`
- OpenClaw stelt ondersteunde bundle-MCP-tools beschikbaar tijdens embedded Pi-agentbeurten door
  stdio-servers te starten of verbinding te maken met HTTP-servers
- de `coding`- en `messaging`-toolprofielen bevatten standaard bundle-MCP-tools;
  gebruik `tools.deny: ["bundle-mcp"]` om je af te melden voor een agent of Gateway
- projectlokale Pi-instellingen blijven na bundle-standaarden van toepassing, zodat workspace-
  instellingen zo nodig bundle-MCP-items kunnen overschrijven
- bundle-MCP-toolcatalogi worden deterministisch gesorteerd voor registratie, zodat
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

- `transport` mag worden ingesteld op `"streamable-http"` of `"sse"`; wanneer dit is weggelaten, gebruikt OpenClaw `sse`
- `type: "http"` is een CLI-native downstream-vorm; gebruik `transport: "streamable-http"` in OpenClaw-configuratie. `openclaw mcp set` en `openclaw doctor --fix` normaliseren de algemene alias.
- alleen `http:`- en `https:`-URL-schema's zijn toegestaan
- `headers`-waarden ondersteunen `${ENV_VAR}`-interpolatie
- een serveritem met zowel `command` als `url` wordt geweigerd
- URL-referenties (userinfo en queryparameters) worden geredigeerd uit tool-
  beschrijvingen en logs
- `connectionTimeoutMs` overschrijft de standaard verbindingstime-out van 30 seconden voor
  zowel stdio- als HTTP-transports

##### Toolnaamgeving

OpenClaw registreert bundle-MCP-tools met provider-veilige namen in de vorm
`serverName__toolName`. Een server met sleutel `"vigil-harbor"` die bijvoorbeeld een
`memory_search`-tool aanbiedt, wordt geregistreerd als `vigil-harbor__memory_search`.

- tekens buiten `A-Za-z0-9_-` worden vervangen door `-`
- serverprefixen worden begrensd op 30 tekens
- volledige toolnamen worden begrensd op 64 tekens
- lege servernamen vallen terug op `mcp`
- botsende gesaniteerde namen worden onderscheiden met numerieke suffixen
- de uiteindelijke volgorde van aangeboden tools is deterministisch op veilige naam om herhaalde Pi-
  beurten cache-stabiel te houden
- profielfiltering behandelt alle tools van een bundle-MCP-server als eigendom van de plugin
  `bundle-mcp`, zodat profiel-allowlists en deny lists zowel
  individuele aangeboden toolnamen als de Plugin-sleutel `bundle-mcp` kunnen bevatten

#### Embedded Pi-instellingen

- Claude `settings.json` wordt geimporteerd als standaard embedded Pi-instellingen wanneer de
  bundle is ingeschakeld
- OpenClaw sanitiseert shell-override-sleutels voordat ze worden toegepast

Gesanitiseerde sleutels:

- `shellPath`
- `shellCommandPrefix`

#### Embedded Pi LSP

- ingeschakelde Claude-bundles kunnen LSP-serverconfiguratie bijdragen
- OpenClaw laadt `.lsp.json` plus eventuele in het manifest gedeclareerde `lspServers`-paden
- bundle-LSP-configuratie wordt samengevoegd in de effectieve embedded Pi LSP-standaarden
- alleen ondersteunde stdio-ondersteunde LSP-servers kunnen vandaag worden uitgevoerd; niet-ondersteunde
  transports verschijnen nog steeds in `openclaw plugins inspect <id>`

### Gedetecteerd maar niet uitgevoerd

Deze worden herkend en weergegeven in diagnostiek, maar OpenClaw voert ze niet uit:

- Claude `agents`, `hooks.json`-automatisering, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex inline/app-metadata buiten capability-rapportage

## Bundle-indelingen

<AccordionGroup>
  <Accordion title="Codex-bundles">
    Markers: `.codex-plugin/plugin.json`

    Optionele content: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-bundles passen het best bij OpenClaw wanneer ze Skill-roots en OpenClaw-achtige
    hook-packdirectories (`HOOK.md` + `handler.ts`) gebruiken.

  </Accordion>

  <Accordion title="Claude-bundles">
    Twee detectiemodi:

    - **Manifestgebaseerd:** `.claude-plugin/plugin.json`
    - **Zonder manifest:** standaard Claude-layout (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-specifiek gedrag:

    - `commands/` wordt behandeld als Skill-content
    - `settings.json` wordt geimporteerd in embedded Pi-instellingen (shell-override-sleutels worden gesanitiseerd)
    - `.mcp.json` stelt ondersteunde stdio-tools beschikbaar aan embedded Pi
    - `.lsp.json` plus in het manifest gedeclareerde `lspServers`-paden laden in embedded Pi LSP-standaarden
    - `hooks/hooks.json` wordt gedetecteerd maar niet uitgevoerd
    - Aangepaste componentpaden in het manifest zijn additief (ze breiden standaarden uit, niet vervangen ze)

  </Accordion>

  <Accordion title="Cursor-bundles">
    Markers: `.cursor-plugin/plugin.json`

    Optionele content: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wordt behandeld als Skill-content
    - `.cursor/rules/`, `.cursor/agents/` en `.cursor/hooks.json` zijn alleen detectie

  </Accordion>
</AccordionGroup>

## Detectieprioriteit

OpenClaw controleert eerst op de native Plugin-indeling:

1. `openclaw.plugin.json` of geldige `package.json` met `openclaw.extensions` — behandeld als **native Plugin**
2. Bundle-markers (`.codex-plugin/`, `.claude-plugin/` of standaard Claude/Cursor-layout) — behandeld als **bundle**

Als een directory beide bevat, gebruikt OpenClaw het native pad. Dit voorkomt
dat dual-format-pakketten gedeeltelijk als bundles worden geinstalleerd.

## Runtime-afhankelijkheden en opschoning

- Compatibele bundles van derden krijgen geen startup-`npm install`-herstel. Ze
  moeten worden geinstalleerd via `openclaw plugins install` en alles leveren
  wat ze nodig hebben in de geinstalleerde Plugin-directory.
- Door OpenClaw beheerde gebundelde plugins worden lichtgewicht meegeleverd in core of
  downloadbaar gemaakt via de Plugin-installer. Gateway-startup voert nooit een
  package manager voor ze uit.
- `openclaw doctor --fix` verwijdert verouderde staged-afhankelijkheidsdirectories en kan
  geconfigureerde downloadbare plugins installeren die ontbreken in de lokale
  Plugin-index.

## Beveiliging

Bundles hebben een nauwere vertrouwensgrens dan native plugins:

- OpenClaw laadt **geen** willekeurige bundle-runtime-modules in-process
- Skills- en hook-packpaden moeten binnen de Plugin-root blijven (grensgecontroleerd)
- Instellingenbestanden worden met dezelfde grenscontroles gelezen
- Ondersteunde stdio-MCP-servers kunnen als subprocessen worden gestart

Dit maakt bundles standaard veiliger, maar je moet bundles van derden nog steeds behandelen als vertrouwde content voor de functies die ze wel aanbieden.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Bundle wordt gedetecteerd maar capabilities worden niet uitgevoerd">
    Voer `openclaw plugins inspect <id>` uit. Als een capability wordt vermeld maar gemarkeerd is als
    niet aangesloten, is dat een productlimiet — geen kapotte installatie.
  </Accordion>

  <Accordion title="Claude-commandobestanden verschijnen niet">
    Zorg dat de bundle is ingeschakeld en dat de markdownbestanden zich in een gedetecteerde
    `commands/`- of `skills/`-root bevinden.
  </Accordion>

  <Accordion title="Claude-instellingen worden niet toegepast">
    Alleen embedded Pi-instellingen uit `settings.json` worden ondersteund. OpenClaw behandelt
    bundle-instellingen niet als ruwe configuratiepatches.
  </Accordion>

  <Accordion title="Claude-hooks worden niet uitgevoerd">
    `hooks/hooks.json` is alleen detectie. Als je uitvoerbare hooks nodig hebt, gebruik dan de
    OpenClaw-hook-packlayout of lever een native Plugin.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Plugins installeren en configureren](/nl/tools/plugin)
- [Plugins bouwen](/nl/plugins/building-plugins) — maak een native Plugin
- [Pluginmanifest](/nl/plugins/manifest) — native manifestschema
