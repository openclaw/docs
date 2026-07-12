---
read_when:
    - Je wilt een bundel installeren die compatibel is met Codex, Claude of Cursor
    - Je moet begrijpen hoe OpenClaw bundelinhoud omzet in systeemeigen functies
    - Je spoort problemen op met bundeldetectie of ontbrekende mogelijkheden
summary: Installeer en gebruik Codex-, Claude- en Cursor-bundels als OpenClaw-plugins
title: Pluginbundels
x-i18n:
    generated_at: "2026-07-12T09:06:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw kan plugins uit drie externe ecosystemen installeren: **Codex**, **Claude**
en **Cursor**. Deze worden **bundels** genoemd: pakketten met inhoud en metadata die
OpenClaw omzet naar ingebouwde functies zoals Skills, hooks en MCP-tools.

<Info>
  Bundels zijn **niet** hetzelfde als ingebouwde OpenClaw-plugins. Ingebouwde plugins
  worden binnen het proces uitgevoerd en kunnen elke mogelijkheid registreren.
  Bundels zijn inhoudspakketten met selectieve functietoewijzing en een beperktere
  vertrouwensgrens.
</Info>

## Waarom bundels bestaan

Veel nuttige plugins worden gepubliceerd in de indeling van Codex, Claude of Cursor.
In plaats van auteurs te verplichten ze als ingebouwde OpenClaw-plugins te
herschrijven, detecteert OpenClaw deze indelingen en zet het de ondersteunde inhoud
ervan om naar de ingebouwde functieset. U kunt een Claude-opdrachtenpakket of een
Codex-Skills-bundel installeren en direct gebruiken.

## Een bundel installeren

<Steps>
  <Step title="Installeren vanuit een map, archief of marktplaats">
    ```bash
    # Lokale map
    openclaw plugins install ./my-bundle

    # Archief
    openclaw plugins install ./my-bundle.tgz

    # Claude-marktplaats
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` is een lokaal pad naar of repository van een marktplaats, of een git-/GitHub-bron.

  </Step>

  <Step title="Detectie verifiëren">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundels tonen `Format: bundle` plus een waarde `Bundle format:` van `codex`,
    `claude` of `cursor`.

  </Step>

  <Step title="Herstarten en gebruiken">
    ```bash
    openclaw gateway restart
    ```

    Toegewezen functies (Skills, hooks, MCP-tools en LSP-standaardinstellingen) zijn beschikbaar in de volgende sessie.

  </Step>
</Steps>

## Wat OpenClaw vanuit bundels toewijst

Niet elke bundelfunctie wordt momenteel in OpenClaw uitgevoerd. Hieronder staat wat
werkt en wat wel wordt gedetecteerd, maar nog niet is aangesloten.

### Momenteel ondersteund

| Functie        | Hoe deze wordt toegewezen                                                                          | Van toepassing op |
| -------------- | -------------------------------------------------------------------------------------------------- | ----------------- |
| Skills-inhoud  | Hoofdmappen voor Skills uit de bundel worden als normale OpenClaw-Skills geladen                    | Alle indelingen   |
| Opdrachten     | `commands/` en `.cursor/commands/` worden als hoofdmappen voor Skills behandeld                     | Claude, Cursor    |
| Hook-pakketten | OpenClaw-indelingen met `HOOK.md` + `handler.ts`                                                    | Codex             |
| MCP-tools      | MCP-configuratie van de bundel wordt samengevoegd met ingebedde OpenClaw-instellingen; ondersteunde stdio- en HTTP-servers worden geladen | Alle indelingen   |
| LSP-servers    | Claude `.lsp.json` en in het manifest opgegeven `lspServers` worden samengevoegd met ingebedde standaardinstellingen voor OpenClaw-LSP | Claude            |
| Instellingen   | Claude `settings.json` wordt geïmporteerd als ingebedde standaardinstellingen voor OpenClaw         | Claude            |

#### Skills-inhoud

- Hoofdmappen voor Skills uit de bundel worden als normale hoofdmappen voor OpenClaw-Skills geladen.
- Claude-hoofdmappen `commands/` worden als aanvullende hoofdmappen voor Skills behandeld.
- Cursor-hoofdmappen `.cursor/commands/` worden als aanvullende hoofdmappen voor Skills behandeld.

Markdown-opdrachtbestanden van Claude en opdrachtmarkdown van Cursor werken beide via
de normale OpenClaw-lader voor Skills.

#### Hook-pakketten

Hoofdmappen voor bundelhooks werken **alleen** wanneer ze de normale indeling voor
OpenClaw-hook-pakketten gebruiken: `HOOK.md` plus `handler.ts` of `handler.js`.
Momenteel geldt dit voornamelijk voor het Codex-compatibele geval.

#### MCP voor ingebedde OpenClaw

- Ingeschakelde bundels kunnen configuratie voor MCP-servers aanleveren.
- OpenClaw voegt de MCP-configuratie van de bundel als `mcpServers` samen met de
  effectieve ingebedde OpenClaw-instellingen.
- OpenClaw stelt ondersteunde MCP-tools uit bundels beschikbaar tijdens agentbeurten
  van ingebedde OpenClaw door stdio-servers te starten of verbinding te maken met
  HTTP-servers.
- De toolprofielen `coding` en `messaging` bevatten standaard MCP-tools uit bundels;
  gebruik `tools.deny: ["bundle-mcp"]` om ze voor een agent of Gateway uit te
  schakelen.
- Projectlokale instellingen voor ingebedde agents worden nog steeds na de
  bundelstandaarden toegepast, zodat werkruimte-instellingen indien nodig
  MCP-vermeldingen uit bundels kunnen overschrijven.
- Toolcatalogi voor MCP uit bundels worden vóór registratie deterministisch
  gesorteerd, zodat wijzigingen in de bovenliggende `listTools()`-volgorde niet
  voortdurend de toolblokken in de promptcache wijzigen.

##### Transporten

MCP-servers kunnen stdio- of HTTP-transport gebruiken.

**Stdio** start een onderliggend proces:

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

**HTTP** maakt verbinding met een actieve MCP-server en gebruikt standaard `sse`,
tenzij `streamable-http` wordt aangevraagd:

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

- `transport` accepteert `"streamable-http"` of `"sse"`; bij weglaten is de standaardwaarde `sse`.
- `type: "http"` is een CLI-eigen vorm voor verdere verwerking; gebruik `transport: "streamable-http"` in de OpenClaw-configuratie. `openclaw mcp set` en `openclaw doctor --fix` normaliseren de gebruikelijke alias.
- Alleen de URL-schema's `http:` en `https:` zijn toegestaan.
- Waarden van `headers` ondersteunen interpolatie van `${ENV_VAR}`.
- Een serververmelding met zowel `command` als `url` wordt geweigerd.
- URL-referenties (gebruikersinformatie en queryparameters) worden onleesbaar gemaakt
  in toolbeschrijvingen en logboeken.
- `connectionTimeoutMs` overschrijft de standaardverbindingstime-out van 30 seconden
  voor zowel stdio- als HTTP-transporten. De standaardtime-out voor aanvragen is
  60 seconden en kan worden overschreven met `requestTimeoutMs`.

##### Naamgeving van tools

OpenClaw registreert MCP-tools uit bundels met providerveilige namen in de vorm
`serverName__toolName`. Een server met de sleutel `"vigil-harbor"` die bijvoorbeeld
een tool `memory_search` beschikbaar stelt, wordt geregistreerd als
`vigil-harbor__memory_search`.

- Tekens buiten `A-Za-z0-9_-` worden vervangen door `-`.
- Fragmenten die met een niet-letter zouden beginnen, krijgen een lettervoorvoegsel,
  zodat numerieke serversleutels zoals `12306` providerveilige toolvoorvoegsels
  worden.
- Servervoorvoegsels zijn beperkt tot 30 tekens.
- Volledige toolnamen zijn beperkt tot 64 tekens.
- Lege servernamen vallen terug op `mcp`.
- Botsende opgeschoonde namen worden onderscheiden met numerieke achtervoegsels.
- De uiteindelijke volgorde van beschikbare tools is deterministisch op basis van
  de veilige naam, waardoor herhaalde beurten van ingebedde agents cachestabiel
  blijven.
- Profielfiltering behandelt elke tool van één MCP-server uit een bundel als eigendom
  van de Plugin `bundle-mcp`, zodat lijsten met toegestane of geweigerde profielen
  naar afzonderlijke beschikbare toolnamen of naar de Plugin-sleutel `bundle-mcp`
  kunnen verwijzen.

#### Instellingen voor ingebedde OpenClaw

Claude `settings.json` wordt als standaardinstellingen voor ingebedde OpenClaw
geïmporteerd wanneer de bundel is ingeschakeld. OpenClaw schoont sleutels voor
shelloverschrijvingen op voordat ze worden toegepast:

- `shellPath`
- `shellCommandPrefix`

#### LSP voor ingebedde OpenClaw

- Ingeschakelde Claude-bundels kunnen configuratie voor LSP-servers aanleveren.
- OpenClaw laadt `.lsp.json` plus eventuele in het manifest opgegeven
  `lspServers`-paden.
- De LSP-configuratie van de bundel wordt samengevoegd met de effectieve ingebedde
  standaardinstellingen voor OpenClaw-LSP.
- Momenteel kunnen alleen ondersteunde, door stdio aangestuurde LSP-servers worden
  uitgevoerd; niet-ondersteunde transporten worden nog steeds weergegeven in
  `openclaw plugins inspect <id>`.

### Gedetecteerd maar niet uitgevoerd

Deze worden herkend en in diagnostische gegevens weergegeven, maar OpenClaw voert ze niet uit:

- Claude `agents`, automatisering via `hooks/hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex-metadata in `.app.json` buiten de rapportage van mogelijkheden

## Bundelindelingen

<AccordionGroup>
  <Accordion title="Codex-bundels">
    Markeringen: `.codex-plugin/plugin.json`

    Optionele inhoud: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex-bundels passen het beste bij OpenClaw wanneer ze hoofdmappen voor Skills en
    mappen voor hook-pakketten in OpenClaw-stijl gebruiken (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude-bundels">
    Twee detectiemodi:

    - **Op manifest gebaseerd:** `.claude-plugin/plugin.json`
    - **Zonder manifest:** standaardindeling van Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-specifiek gedrag:

    - `commands/` wordt als Skills-inhoud behandeld
    - `settings.json` wordt in de instellingen voor ingebedde OpenClaw geïmporteerd (sleutels voor shelloverschrijvingen worden opgeschoond)
    - `.mcp.json` stelt ondersteunde stdio-tools beschikbaar aan ingebedde OpenClaw
    - `.lsp.json` plus in het manifest opgegeven `lspServers`-paden worden in de standaardinstellingen voor ingebedde OpenClaw-LSP geladen
    - `hooks/hooks.json` wordt gedetecteerd maar niet uitgevoerd
    - Aangepaste componentpaden in het manifest zijn aanvullend; ze breiden de standaardwaarden uit en vervangen ze niet

  </Accordion>

  <Accordion title="Cursor-bundels">
    Markeringen: `.cursor-plugin/plugin.json`

    Optionele inhoud: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` wordt als Skills-inhoud behandeld
    - `.cursor/rules/`, `.cursor/agents/` en `.cursor/hooks.json` worden alleen gedetecteerd

  </Accordion>
</AccordionGroup>

## Detectievolgorde

OpenClaw controleert eerst op de ingebouwde Plugin-indeling:

1. `openclaw.plugin.json` of een geldige `package.json` met `openclaw.extensions` - wordt behandeld als een **ingebouwde Plugin**
2. Bundelmarkeringen (`.codex-plugin/`, `.claude-plugin/` of de standaardindeling van Claude/Cursor) - wordt behandeld als een **bundel**

Als een map beide bevat, gebruikt OpenClaw het ingebouwde pad. Dit voorkomt dat
pakketten met twee indelingen gedeeltelijk als bundels worden geïnstalleerd.

## Runtime-afhankelijkheden en opschoning

- Compatibele bundels van derden krijgen bij het opstarten geen herstel via
  `npm install`. Ze moeten via `openclaw plugins install` worden geïnstalleerd en
  alles wat ze nodig hebben meeleveren in de geïnstalleerde Plugin-map.
- Door OpenClaw beheerde meegeleverde plugins worden lichtgewicht in de kern
  meegeleverd of kunnen via het Plugin-installatieprogramma worden gedownload.
  Bij het opstarten voert de Gateway nooit een pakketbeheerder voor ze uit.
- `openclaw doctor --fix` verwijdert verouderde lokale installatierecords van
  meegeleverde plugins en kan downloadbare plugins herstellen die in de lokale
  Plugin-index ontbreken wanneer de configuratie er nog steeds naar verwijst.

## Beveiliging

Bundels hebben een beperktere vertrouwensgrens dan ingebouwde plugins:

- OpenClaw laadt **geen** willekeurige runtimemodules uit bundels binnen het proces.
- Paden voor Skills en hook-pakketten moeten binnen de hoofdmap van de Plugin blijven
  (met grenscontrole).
- Instellingenbestanden worden met dezelfde grenscontroles gelezen.
- Ondersteunde stdio-MCP-servers kunnen als subprocessen worden gestart.

Hierdoor zijn bundels standaard veiliger, maar u moet bundels van derden nog steeds
als vertrouwde inhoud behandelen voor de functies die ze beschikbaar stellen.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="De bundel wordt gedetecteerd, maar mogelijkheden worden niet uitgevoerd">
    Voer `openclaw plugins inspect <id>` uit. Als een mogelijkheid wordt vermeld maar
    als niet aangesloten is gemarkeerd, is dat een productbeperking en geen defecte
    installatie.
  </Accordion>

  <Accordion title="Claude-opdrachtbestanden worden niet weergegeven">
    Controleer of de bundel is ingeschakeld en de markdownbestanden zich in een
    gedetecteerde hoofdmap `commands/` of `skills/` bevinden.
  </Accordion>

  <Accordion title="Claude-instellingen worden niet toegepast">
    Alleen instellingen voor ingebedde OpenClaw uit `settings.json` worden ondersteund.
    OpenClaw behandelt bundelinstellingen niet als onbewerkte configuratiepatches.
  </Accordion>

  <Accordion title="Claude-hooks worden niet uitgevoerd">
    `hooks/hooks.json` wordt alleen gedetecteerd. Als u uitvoerbare hooks nodig hebt,
    gebruikt u de OpenClaw-indeling voor hook-pakketten of levert u een ingebouwde
    Plugin.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Plugins installeren en configureren](/nl/tools/plugin)
- [Plugins bouwen](/nl/plugins/building-plugins) - maak een ingebouwde Plugin
- [Plugin-manifest](/nl/plugins/manifest) - schema voor het ingebouwde manifest
