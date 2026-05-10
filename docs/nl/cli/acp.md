---
read_when:
    - IDE-integraties op basis van ACP instellen
    - ACP-sessieroutering naar de Gateway debuggen
summary: Voer de ACP-brug uit voor IDE-integraties
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:27:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

Voer de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-bridge uit die met een OpenClaw Gateway communiceert.

Deze opdracht spreekt ACP via stdio voor IDE's en stuurt prompts door naar de Gateway
via WebSocket. De opdracht houdt ACP-sessies gekoppeld aan Gateway-sessiesleutels.

`openclaw acp` is een door Gateway ondersteunde ACP-bridge, geen volledige ACP-native editor
runtime. De focus ligt op sessieroutering, promptlevering en eenvoudige streaming
updates.

Als je wilt dat een externe MCP-client rechtstreeks met OpenClaw-kanaalgesprekken
praat in plaats van een ACP-harness-sessie te hosten, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp).

## Wat dit niet is

Deze pagina wordt vaak verward met ACP-harness-sessies.

`openclaw acp` betekent:

- OpenClaw fungeert als ACP-server
- een IDE of ACP-client maakt verbinding met OpenClaw
- OpenClaw stuurt dat werk door naar een Gateway-sessie

Dit verschilt van [ACP-agents](/nl/tools/acp-agents), waarbij OpenClaw een
externe harness zoals Codex of Claude Code uitvoert via `acpx`.

Snelle regel:

- editor/client wil ACP met OpenClaw spreken: gebruik `openclaw acp`
- OpenClaw moet Codex/Claude/Gemini als ACP-harness starten: gebruik `/acp spawn` en [ACP-agents](/nl/tools/acp-agents)

## Compatibiliteitsmatrix

| ACP-gebied                                                            | Status      | Opmerkingen                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Geïmplementeerd | Kernbridgeflow via stdio naar Gateway chat/send + afbreken.                                                                                                                                                                                      |
| `listSessions`, slash commands                                        | Geïmplementeerd | Sessielijst werkt op basis van Gateway-sessiestatus met begrensde cursorpaginering en `cwd`-filtering wanneer Gateway-sessierijen werkruimtemetadata bevatten; opdrachten worden geadverteerd via `available_commands_update`.                 |
| `resumeSession`, `closeSession`                                       | Geïmplementeerd | Hervatten koppelt een ACP-sessie opnieuw aan een bestaande Gateway-sessie zonder geschiedenis opnieuw af te spelen. Sluiten annuleert actief bridgewerk, rondt wachtende prompts af als geannuleerd en geeft bridge-sessiestatus vrij.         |
| `loadSession`                                                         | Gedeeltelijk | Koppelt de ACP-sessie opnieuw aan een Gateway-sessiesleutel en speelt ACP-gebeurtenislogboekgeschiedenis af voor door de bridge gemaakte sessies. Oudere sessies of sessies zonder logboek vallen terug op opgeslagen gebruikers-/assistenttekst. |
| Promptinhoud (`text`, ingesloten `resource`, afbeeldingen)            | Gedeeltelijk | Tekst/resources worden afgevlakt naar chatinvoer; afbeeldingen worden Gateway-bijlagen.                                                                                                                                                          |
| Sessiemodi                                                            | Gedeeltelijk | `session/set_mode` wordt ondersteund en de bridge biedt initiële door Gateway ondersteunde sessiebediening voor denkniveau, tooluitgebreidheid, redeneren, gebruiksdetails en verhoogde acties. Bredere ACP-native modus-/configuratieoppervlakken vallen nog buiten de scope. |
| Sessie-info en gebruiksupdates                                        | Gedeeltelijk | De bridge verzendt `session_info_update`- en best-effort `usage_update`-meldingen vanuit gecachte Gateway-sessiesnapshots. Gebruik is bij benadering en wordt alleen verzonden wanneer Gateway-tokentotalen als actueel zijn gemarkeerd.        |
| Toolstreaming                                                         | Gedeeltelijk | `tool_call`- / `tool_call_update`-gebeurtenissen bevatten ruwe I/O, tekstinhoud en best-effort bestandslocaties wanneer Gateway-toolargumenten/-resultaten die blootleggen. Ingesloten terminals en rijkere diff-native uitvoer worden nog niet blootgelegd. |
| Exec-goedkeuringen                                                    | Gedeeltelijk | Gateway-exec-goedkeuringsprompts tijdens actieve ACP-promptbeurten worden doorgegeven aan de ACP-client met `session/request_permission`.                                                                                                       |
| MCP-servers per sessie (`mcpServers`)                                 | Niet ondersteund | Bridgemodus weigert MCP-serververzoeken per sessie. Configureer MCP in plaats daarvan op de OpenClaw Gateway of agent.                                                                                                                          |
| Clientbestandssysteemmethoden (`fs/read_text_file`, `fs/write_text_file`) | Niet ondersteund | De bridge roept geen ACP-clientbestandssysteemmethoden aan.                                                                                                                                                                                      |
| Clientterminalmethoden (`terminal/*`)                                 | Niet ondersteund | De bridge maakt geen ACP-clientterminals aan en streamt geen terminal-id's via toolaanroepen.                                                                                                                                                    |
| Sessieplannen / denksreaming                                          | Niet ondersteund | De bridge verzendt momenteel uitvoertekst en toolstatus, geen ACP-plan- of denkuppdates.                                                                                                                                                         |

## Bekende beperkingen

- `loadSession` kan volledige ACP-gebeurtenislogboekgeschiedenis alleen opnieuw afspelen voor
  door de bridge gemaakte sessies. Oudere sessies of sessies zonder logboek gebruiken nog steeds transcriptfallback
  en reconstrueren geen historische toolaanroepen of systeemmeldingen.
- Als meerdere ACP-clients dezelfde Gateway-sessiesleutel delen, zijn gebeurtenis- en annuleerrouting
  best-effort in plaats van strikt geïsoleerd per client. Geef de voorkeur aan de
  standaard geïsoleerde `acp:<uuid>`-sessies wanneer je schone editor-lokale
  beurten nodig hebt.
- Gateway-stopstatussen worden vertaald naar ACP-stopredenen, maar die mapping is
  minder expressief dan een volledig ACP-native runtime.
- Initiële sessiebediening toont momenteel een gerichte subset van Gateway-knoppen:
  denkniveau, tooluitgebreidheid, redeneren, gebruiksdetails en verhoogde
  acties. Modelselectie en exec-hostbediening zijn nog niet beschikbaar als ACP-
  configuratieopties.
- `session_info_update` en `usage_update` worden afgeleid van Gateway-sessiesnapshots,
  niet van live ACP-native runtimeboekhouding. Gebruik is bij benadering,
  bevat geen kostengegevens en wordt alleen verzonden wanneer de Gateway totale tokengegevens
  als actueel markeert.
- Meekijkgegevens voor tools zijn best-effort. De bridge kan bestandspaden tonen die
  in bekende toolargumenten/-resultaten voorkomen, maar verzendt nog geen ACP-terminals of
  gestructureerde bestandsdiffs.
- Het doorgeven van exec-goedkeuringen is beperkt tot de actieve ACP-promptbeurt; goedkeuringen van
  andere Gateway-sessies worden genegeerd.

## Gebruik

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP-client (debug)

Gebruik de ingebouwde ACP-client om de bridge zonder IDE op juistheid te controleren.
Deze start de ACP-bridge en laat je interactief prompts typen.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Permissiemodel (clientdebugmodus):

- Automatische goedkeuring is gebaseerd op een toestaanlijst en geldt alleen voor vertrouwde kern-tool-ID's.
- Automatische goedkeuring voor `read` is beperkt tot de huidige werkmap (`--cwd` wanneer ingesteld).
- ACP keurt alleen smalle alleen-lezen klassen automatisch goed: gescopete `read`-aanroepen onder de actieve cwd plus alleen-lezen zoektools (`search`, `web_search`, `memory_search`). Onbekende/niet-kern-tools, leesacties buiten de scope, tools die exec kunnen uitvoeren, control-plane-tools, muterende tools en interactieve flows vereisen altijd expliciete promptgoedkeuring.
- Door de server geleverde `toolCall.kind` wordt behandeld als onvertrouwde metadata (niet als autorisatiebron).
- Dit ACP-bridgebeleid staat los van ACPX-harnesspermissies. Als je OpenClaw via de `acpx`-backend uitvoert, is `plugins.entries.acpx.config.permissionMode=approve-all` de break-glass "yolo"-schakelaar voor die harness-sessie.

## Protocolrooktest

Voor debuggen op protocolniveau start je een Gateway met geïsoleerde status en stuur je
`openclaw acp` via stdio aan met een ACP JSON-RPC-client. Dek `initialize`,
`session/new`, `session/list` met een absolute `cwd`, `session/resume`,
`session/close`, dubbele close en ontbrekende resume af.

Het bewijs moet de geadverteerde lifecycle-mogelijkheden, een door Gateway ondersteunde
sessierij, updatemeldingen en het Gateway-`sessions.list`-log bevatten:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Gebruik `openclaw gateway call sessions.list` niet als enige ACP-bewijs. Dat
CLI-pad kan om een fresh-token operatorscope-upgrade vragen; ACP-bridgecorrectheid
wordt bewezen door ACP-stdioframes plus het Gateway-`sessions.list`-log.

## Dit gebruiken

Gebruik ACP wanneer een IDE (of andere client) Agent Client Protocol spreekt en je wilt
dat die een OpenClaw Gateway-sessie aanstuurt.

1. Zorg dat de Gateway draait (lokaal of extern).
2. Configureer het Gateway-doel (configuratie of vlaggen).
3. Laat je IDE `openclaw acp` via stdio uitvoeren.

Voorbeeldconfiguratie (opgeslagen):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Voorbeeld van direct uitvoeren (zonder configuratie weg te schrijven):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agents selecteren

ACP kiest agents niet rechtstreeks. Het routeert via de Gateway-sessiesleutel.

Gebruik agent-gescopete sessiesleutels om een specifieke agent te targeten:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Elke ACP-sessie wordt gekoppeld aan één Gateway-sessiesleutel. Eén agent kan veel
sessies hebben; ACP gebruikt standaard een geïsoleerde `acp:<uuid>`-sessie, tenzij je
de sleutel of het label overschrijft.

Per-sessie `mcpServers` worden niet ondersteund in bridge-modus. Als een ACP-client
ze tijdens `newSession` of `loadSession` verzendt, retourneert de bridge een duidelijke
fout in plaats van ze stilzwijgend te negeren.

Als je wilt dat door ACPX ondersteunde sessies OpenClaw Plugin-tools of geselecteerde
ingebouwde tools zoals `cron` zien, schakel dan de ACPX MCP-bridges aan de Gateway-zijde in
in plaats van te proberen per-sessie `mcpServers` door te geven. Zie
[ACP-agenten](/nl/tools/acp-agents-setup#plugin-tools-mcp-bridge) en
[OpenClaw-tools MCP-bridge](/nl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Gebruik vanuit `acpx` (Codex, Claude, andere ACP-clients)

Als je wilt dat een codeeragent zoals Codex of Claude Code via ACP met je
OpenClaw-bot praat, gebruik dan `acpx` met het ingebouwde `openclaw`-doel.

Typische werkwijze:

1. Start de Gateway en zorg dat de ACP-bridge deze kan bereiken.
2. Richt `acpx openclaw` op `openclaw acp`.
3. Gebruik de OpenClaw-sessiesleutel die je de codeeragent wilt laten gebruiken.

Voorbeelden:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Als je wilt dat `acpx openclaw` elke keer een specifieke Gateway en sessiesleutel
gebruikt, overschrijf dan de `openclaw`-agentopdracht in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Gebruik voor een repo-lokale OpenClaw-checkout het directe CLI-entrypoint in plaats van de
dev-runner, zodat de ACP-stream schoon blijft. Bijvoorbeeld:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dit is de eenvoudigste manier om Codex, Claude Code of een andere ACP-bewuste client
contextuele informatie uit een OpenClaw-agent te laten ophalen zonder een terminal te scrapen.

## Zed-editor instellen

Voeg een aangepaste ACP-agent toe in `~/.config/zed/settings.json` (of gebruik de instellingen-UI van Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Om een specifieke Gateway of agent te gebruiken:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Open in Zed het agentpaneel en selecteer "OpenClaw ACP" om een thread te starten.

## Sessietoewijzing

Standaard krijgen ACP-sessies een geïsoleerde Gateway-sessiesleutel met een `acp:`-prefix.
Geef een sessiesleutel of label door om een bekende sessie te hergebruiken:

- `--session <key>`: gebruik een specifieke Gateway-sessiesleutel.
- `--session-label <label>`: los een bestaande sessie op via label.
- `--reset-session`: maak een nieuwe sessie-id voor die sleutel aan (zelfde sleutel, nieuwe transcriptie).

Als je ACP-client metadata ondersteunt, kun je dit per sessie overschrijven:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Lees meer over sessiesleutels op [/concepts/session](/nl/concepts/session).

## Opties

- `--url <url>`: Gateway WebSocket-URL (standaard `gateway.remote.url` wanneer geconfigureerd).
- `--token <token>`: Gateway-authenticatietoken.
- `--token-file <path>`: lees Gateway-authenticatietoken uit bestand.
- `--password <password>`: Gateway-authenticatiewachtwoord.
- `--password-file <path>`: lees Gateway-authenticatiewachtwoord uit bestand.
- `--session <key>`: standaardsessiesleutel.
- `--session-label <label>`: standaard sessielabel om op te lossen.
- `--require-existing`: faal als de sessiesleutel of het label niet bestaat.
- `--reset-session`: reset de sessiesleutel vóór het eerste gebruik.
- `--no-prefix-cwd`: voeg de werkmap niet als prefix toe aan prompts.
- `--provenance <off|meta|meta+receipt>`: neem ACP-herkomstmetadata of ontvangstbewijzen op.
- `--verbose, -v`: uitgebreide logging naar stderr.

Beveiligingsopmerking:

- `--token` en `--password` kunnen op sommige systemen zichtbaar zijn in lokale proceslijsten.
- Geef de voorkeur aan `--token-file`/`--password-file` of omgevingsvariabelen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Gateway-authenticatieresolutie volgt het gedeelde contract dat door andere Gateway-clients wordt gebruikt:
  - lokale modus: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*`-fallback alleen wanneer `gateway.auth.*` niet is ingesteld (geconfigureerde maar niet-opgeloste lokale SecretRefs falen gesloten)
  - externe modus: `gateway.remote.*` met env/config-fallback volgens regels voor externe prioriteit
  - `--url` is veilig als overschrijving en hergebruikt geen impliciete config-/env-credentials; geef expliciet `--token`/`--password` door (of bestandsvarianten)
- Onderliggende processen van de ACP-runtimebackend ontvangen `OPENCLAW_SHELL=acp`, wat kan worden gebruikt voor contextspecifieke shell-/profielregels.
- `openclaw acp client` stelt `OPENCLAW_SHELL=acp-client` in op het gestarte bridge-proces.

### `acp client`-opties

- `--cwd <dir>`: werkmap voor de ACP-sessie.
- `--server <command>`: ACP-serveropdracht (standaard: `openclaw`).
- `--server-args <args...>`: extra argumenten die aan de ACP-server worden doorgegeven.
- `--server-verbose`: schakel uitgebreide logging op de ACP-server in.
- `--verbose, -v`: uitgebreide clientlogging.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [ACP-agenten](/nl/tools/acp-agents)
