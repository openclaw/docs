---
read_when:
    - ACP-gebaseerde IDE-integraties instellen
    - ACP-sessieroutering naar de Gateway debuggen
summary: Voer de ACP-bridge uit voor IDE-integraties
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:17:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Voer de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-brug uit die met een OpenClaw Gateway praat.

Deze opdracht spreekt ACP via stdio voor IDE's en stuurt prompts door naar de Gateway
via WebSocket. Het houdt ACP-sessies gekoppeld aan Gateway-sessiesleutels.

`openclaw acp` is een ACP-brug met Gateway-backend, geen volledige ACP-native editorruntime. De focus ligt op sessieroutering, promptbezorging en eenvoudige streamingupdates.

Als je wilt dat een externe MCP-client rechtstreeks met OpenClaw-kanaalgesprekken praat in plaats van een ACP-harness-sessie te hosten, gebruik dan in plaats daarvan
[`openclaw mcp serve`](/nl/cli/mcp).

## Wat dit niet is

Deze pagina wordt vaak verward met ACP-harness-sessies.

`openclaw acp` betekent:

- OpenClaw fungeert als ACP-server
- een IDE of ACP-client maakt verbinding met OpenClaw
- OpenClaw stuurt dat werk door naar een Gateway-sessie

Dit is anders dan [ACP-agenten](/nl/tools/acp-agents), waarbij OpenClaw een externe harness zoals Codex of Claude Code via `acpx` uitvoert.

Snelle regel:

- editor/client wil via ACP met OpenClaw praten: gebruik `openclaw acp`
- OpenClaw moet Codex/Claude/Gemini als ACP-harness starten: gebruik `/acp spawn` en [ACP-agenten](/nl/tools/acp-agents)

## Compatibiliteitsmatrix

| ACP-gebied                                                            | Status              | Opmerkingen                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Geïmplementeerd     | Kernbrugstroom via stdio naar Gateway-chat/verzenden + afbreken.                                                                                                                                                                                |
| `listSessions`, slash-opdrachten                                      | Geïmplementeerd     | Sessielijst werkt tegen Gateway-sessiestatus met begrensde cursorpaginering en `cwd`-filtering waar Gateway-sessierijen werkruimtemetadata bevatten; opdrachten worden aangekondigd via `available_commands_update`.                          |
| Metadata voor sessieafstamming                                        | Geïmplementeerd     | Sessielijsten en momentopnamen van sessie-info bevatten OpenClaw-ouder- en kindafstamming in `_meta`, zodat ACP-clients subagentgrafieken kunnen weergeven zonder private Gateway-zijkanalen.                                                  |
| `resumeSession`, `closeSession`                                       | Geïmplementeerd     | Hervatten koppelt een ACP-sessie opnieuw aan een bestaande Gateway-sessie zonder geschiedenis opnieuw af te spelen. Sluiten annuleert actief brugwerk, lost wachtende prompts op als geannuleerd en geeft brugsessiestatus vrij.               |
| `loadSession`                                                         | Gedeeltelijk        | Koppelt de ACP-sessie opnieuw aan een Gateway-sessiesleutel en speelt ACP-gebeurtenisledgergeschiedenis opnieuw af voor door de brug gemaakte sessies. Oudere/sessies zonder ledger vallen terug op opgeslagen gebruikers-/assistenttekst.     |
| Promptinhoud (`text`, ingesloten `resource`, afbeeldingen)            | Gedeeltelijk        | Tekst/resources worden samengevoegd tot chatinvoer; afbeeldingen worden Gateway-bijlagen.                                                                                                                                                       |
| Sessiemodi                                                            | Gedeeltelijk        | `session/set_mode` wordt ondersteund en de brug biedt initiële, door Gateway ondersteunde sessiebediening voor denkniveau, tool-uitgebreidheid, reasoning, gebruiksdetail en verhoogde acties. Bredere ACP-native modus-/configuratieoppervlakken vallen nog buiten scope. |
| Sessie-info en gebruiksupdates                                        | Gedeeltelijk        | De brug verzendt `session_info_update`- en best-effort `usage_update`-meldingen vanuit gecachete Gateway-sessiemomentopnamen. Gebruik is bij benadering en wordt alleen verzonden wanneer Gateway-tokentotalen als vers zijn gemarkeerd.       |
| Tool-streaming                                                        | Gedeeltelijk        | `tool_call` / `tool_call_update`-gebeurtenissen bevatten ruwe I/O, tekstinhoud en best-effort bestandslocaties wanneer Gateway-toolargumenten/-resultaten die blootleggen. Ingesloten terminals en rijkere diff-native uitvoer worden nog niet blootgelegd. |
| Exec-goedkeuringen                                                    | Gedeeltelijk        | Gateway-exec-goedkeuringsprompts tijdens actieve ACP-promptbeurten worden doorgestuurd naar de ACP-client met `session/request_permission`.                                                                                                    |
| MCP-servers per sessie (`mcpServers`)                                 | Niet ondersteund    | Brugmodus weigert MCP-serververzoeken per sessie. Configureer MCP in plaats daarvan op de OpenClaw Gateway of agent.                                                                                                                           |
| Clientbestandssysteemmethoden (`fs/read_text_file`, `fs/write_text_file`) | Niet ondersteund | De brug roept geen ACP-clientbestandssysteemmethoden aan.                                                                                                                                                                                       |
| Clientterminalmethoden (`terminal/*`)                                 | Niet ondersteund    | De brug maakt geen ACP-clientterminals aan en streamt geen terminal-id's via toolaanroepen.                                                                                                                                                     |
| Sessieplannen / gedachte-streaming                                    | Niet ondersteund    | De brug verzendt momenteel uitvoertekst en toolstatus, geen ACP-plan- of gedachte-updates.                                                                                                                                                      |

## Bekende beperkingen

- `loadSession` kan volledige ACP-gebeurtenisledgergeschiedenis alleen opnieuw afspelen voor door de brug gemaakte sessies. Oudere/sessies zonder ledger gebruiken nog steeds transcriptfallback en reconstrueren geen historische toolaanroepen of systeemmeldingen.
- Als meerdere ACP-clients dezelfde Gateway-sessiesleutel delen, zijn gebeurtenis- en annuleringsroutering best-effort in plaats van strikt geïsoleerd per client. Geef de voorkeur aan de standaard geïsoleerde `acp-bridge:<uuid>`-sessies wanneer je schone editor-lokale beurten nodig hebt.
- Gateway-stopstatussen worden vertaald naar ACP-stopredenen, maar die mapping is minder expressief dan een volledig ACP-native runtime.
- Initiële sessiebediening toont momenteel een gerichte subset van Gateway-instellingen: denkniveau, tool-uitgebreidheid, reasoning, gebruiksdetail en verhoogde acties. Modelselectie en exec-hostbediening worden nog niet als ACP-configuratieopties blootgelegd.
- `session_info_update` en `usage_update` worden afgeleid van Gateway-sessiemomentopnamen, niet van live ACP-native runtimeboekhouding. Gebruik is bij benadering, bevat geen kostengegevens en wordt alleen verzonden wanneer de Gateway totale tokengegevens als vers markeert.
- Tool-meekijkgegevens zijn best-effort. De brug kan bestandspaden tonen die in bekende toolargumenten/-resultaten verschijnen, maar verzendt nog geen ACP-terminals of gestructureerde bestandsdiffs.
- Exec-goedkeuringsdoorgifte is beperkt tot de actieve ACP-promptbeurt; goedkeuringen van andere Gateway-sessies worden genegeerd.

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

Gebruik de ingebouwde ACP-client om de bridge zonder IDE te sanity-checken.
Deze start de ACP-bridge en laat je interactief prompts typen.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Machtigingsmodel (client-debugmodus):

- Automatische goedkeuring is gebaseerd op een toelatingslijst en geldt alleen voor vertrouwde core-tool-ID's.
- Automatische goedkeuring voor `read` is beperkt tot de huidige werkmap (`--cwd` wanneer ingesteld).
- ACP keurt alleen beperkte readonly-klassen automatisch goed: gescopete `read`-aanroepen onder de actieve cwd plus readonly-zoektools (`search`, `web_search`, `memory_search`). Onbekende/niet-core tools, reads buiten scope, tools die exec kunnen uitvoeren, control-plane-tools, muterende tools en interactieve flows vereisen altijd expliciete promptgoedkeuring.
- Door de server geleverde `toolCall.kind` wordt behandeld als niet-vertrouwde metadata (niet als autorisatiebron).
- Dit ACP-bridgebeleid staat los van ACPX-harnasmachtigingen. Als je OpenClaw uitvoert via de `acpx`-backend, is `plugins.entries.acpx.config.permissionMode=approve-all` de break-glass-"yolo"-schakelaar voor die harness-sessie.

## Protocol-smoketest

Start voor debugging op protocolniveau een Gateway met geïsoleerde state en stuur
`openclaw acp` over stdio aan met een ACP JSON-RPC-client. Dek `initialize`,
`session/new`, `session/list` met een absoluut `cwd`, `session/resume`,
`session/close`, dubbele close en ontbrekende resume af.

Het bewijs moet de geadverteerde lifecycle-capabilities, een door de Gateway ondersteunde
sessierij, updatemeldingen en de Gateway-`sessions.list`-log bevatten:

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

Vermijd `openclaw gateway call sessions.list` als het enige ACP-bewijs. Dat
CLI-pad kan een scope-upgrade voor een operator met fresh-token aanvragen; de
correctheid van de ACP-bridge wordt bewezen door ACP-stdioframes plus de Gateway-`sessions.list`-log.

## Dit gebruiken

Gebruik ACP wanneer een IDE (of andere client) Agent Client Protocol spreekt en je wilt
dat deze een OpenClaw Gateway-sessie aanstuurt.

1. Zorg dat de Gateway draait (lokaal of remote).
2. Configureer het Gateway-doel (configuratie of flags).
3. Wijs je IDE aan om `openclaw acp` over stdio uit te voeren.

Voorbeeldconfiguratie (persistent):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Voorbeeld van direct uitvoeren (geen config-write):

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

Elke ACP-sessie wordt toegewezen aan één Gateway-sessiesleutel. Eén agent kan veel
sessies hebben; ACP gebruikt standaard een geïsoleerde `acp-bridge:<uuid>`-sessie, tenzij je
de sleutel of het label overschrijft.

Per sessie ingestelde `mcpServers` worden niet ondersteund in bridgemodus. Als een ACP-client
ze tijdens `newSession` of `loadSession` verstuurt, retourneert de bridge een duidelijke
fout in plaats van ze stilzwijgend te negeren.

Als je wilt dat door ACPX ondersteunde sessies OpenClaw Plugin-tools of geselecteerde
ingebouwde tools zoals `cron` zien, schakel dan de Gateway-zijdige ACPX MCP-bridges in in plaats
van te proberen per sessie `mcpServers` door te geven. Zie
[ACP-agenten](/nl/tools/acp-agents-setup#plugin-tools-mcp-bridge) en
[OpenClaw-tools MCP-bridge](/nl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Gebruiken vanuit `acpx` (Codex, Claude, andere ACP-clients)

Als je wilt dat een codeeragent zoals Codex of Claude Code via ACP met je
OpenClaw-bot praat, gebruik dan `acpx` met het ingebouwde `openclaw`-doel.

Typische flow:

1. Start de Gateway en zorg dat de ACP-bridge deze kan bereiken.
2. Wijs `acpx openclaw` naar `openclaw acp`.
3. Richt je op de OpenClaw-sessiesleutel die de codeeragent moet gebruiken.

Voorbeelden:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Als je wilt dat `acpx openclaw` elke keer op een specifieke Gateway en sessiesleutel
is gericht, overschrijf dan de agentopdracht `openclaw` in `~/.acpx/config.json`:

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

Om een specifieke Gateway of agent te targeten:

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

Open in Zed het Agent-paneel en selecteer "OpenClaw ACP" om een thread te starten.

## Sessietoewijzing

Standaard krijgen ACP-bridgesessies een geïsoleerde Gateway-sessiesleutel met een
`acp-bridge:`-voorvoegsel. Deze bridgesessies met normaal model zijn synthetisch en
onderhevig aan opschoning van verouderde vermeldingen en limieten op het aantal vermeldingen. Om een bekende sessie opnieuw te gebruiken,
geef je een sessiesleutel of label door:

- `--session <key>`: gebruik een specifieke Gateway-sessiesleutel.
- `--session-label <label>`: los een bestaande sessie op aan de hand van label.
- `--reset-session`: maak een nieuw sessie-id voor die sleutel (dezelfde sleutel, nieuw transcript).

Als je ACP-client metadata ondersteunt, kun je per sessie overschrijven:

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

- `--url <url>`: Gateway-WebSocket-URL (standaard `gateway.remote.url` wanneer geconfigureerd).
- `--token <token>`: Gateway-authenticatietoken.
- `--token-file <path>`: lees Gateway-authenticatietoken uit bestand.
- `--password <password>`: Gateway-authenticatiewachtwoord.
- `--password-file <path>`: lees Gateway-authenticatiewachtwoord uit bestand.
- `--session <key>`: standaardsessiesleutel.
- `--session-label <label>`: standaard sessielabel om op te lossen.
- `--require-existing`: misluk als de sessiesleutel of het label niet bestaat.
- `--reset-session`: reset de sessiesleutel voor het eerste gebruik.
- `--no-prefix-cwd`: zet de werkdirectory niet als voorvoegsel voor prompts.
- `--provenance <off|meta|meta+receipt>`: neem ACP-herkomstmetadata of ontvangstbewijzen op.
- `--verbose, -v`: uitgebreide logging naar stderr.

Beveiligingsopmerking:

- `--token` en `--password` kunnen op sommige systemen zichtbaar zijn in lokale proceslijsten.
- Geef de voorkeur aan `--token-file`/`--password-file` of omgevingsvariabelen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Gateway-authenticatieoplossing volgt het gedeelde contract dat door andere Gateway-clients wordt gebruikt:
  - lokale modus: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*`-fallback alleen wanneer `gateway.auth.*` niet is ingesteld (geconfigureerde maar niet opgeloste lokale SecretRefs falen gesloten)
  - externe modus: `gateway.remote.*` met env/config-fallback volgens externe precedentieregels
  - `--url` is overschrijvingsveilig en hergebruikt geen impliciete config/env-referenties; geef expliciet `--token`/`--password` door (of bestandsvarianten)
- Onderliggende processen van de ACP-runtimebackend ontvangen `OPENCLAW_SHELL=acp`, wat kan worden gebruikt voor contextspecifieke shell-/profielregels.
- `openclaw acp client` stelt `OPENCLAW_SHELL=acp-client` in op het gestarte bridgeproces.

### Opties voor `acp client`

- `--cwd <dir>`: werkdirectory voor de ACP-sessie.
- `--server <command>`: ACP-serveropdracht (standaard: `openclaw`).
- `--server-args <args...>`: extra argumenten die aan de ACP-server worden doorgegeven.
- `--server-verbose`: schakel uitgebreide logging op de ACP-server in.
- `--verbose, -v`: uitgebreide clientlogging.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [ACP-agenten](/nl/tools/acp-agents)
