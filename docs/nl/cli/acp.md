---
read_when:
    - ACP-gebaseerde IDE-integraties instellen
    - Problemen oplossen met ACP-sessieroutering naar de Gateway
summary: Voer de ACP-brug uit voor IDE-integraties
title: ACP
x-i18n:
    generated_at: "2026-05-06T09:04:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

Voer de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-bridge uit die met een OpenClaw Gateway communiceert.

Deze opdracht spreekt ACP via stdio voor IDE's en stuurt prompts door naar de Gateway
via WebSocket. ACP-sessies blijven gekoppeld aan Gateway-sessiesleutels.

`openclaw acp` is een door de Gateway ondersteunde ACP-bridge, geen volledige ACP-native editor-
runtime. De focus ligt op sessieroutering, promptaflevering en eenvoudige streaming-
updates.

Als je wilt dat een externe MCP-client rechtstreeks met OpenClaw-kanaalgesprekken
praat in plaats van een ACP-harnassessie te hosten, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp).

## Wat dit niet is

Deze pagina wordt vaak verward met ACP-harnassessies.

`openclaw acp` betekent:

- OpenClaw fungeert als ACP-server
- een IDE of ACP-client maakt verbinding met OpenClaw
- OpenClaw stuurt dat werk door naar een Gateway-sessie

Dit verschilt van [ACP Agents](/nl/tools/acp-agents), waarbij OpenClaw een
extern harnas zoals Codex of Claude Code via `acpx` uitvoert.

Korte regel:

- editor/client wil via ACP met OpenClaw praten: gebruik `openclaw acp`
- OpenClaw moet Codex/Claude/Gemini als ACP-harnas starten: gebruik `/acp spawn` en [ACP Agents](/nl/tools/acp-agents)

## Compatibiliteitsmatrix

| ACP-gebied                                                           | Status             | Opmerkingen                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                       | Geïmplementeerd    | Kernbridgeflow via stdio naar Gateway chat/send + afbreken.                                                                                                                                                                                          |
| `listSessions`, slash-opdrachten                                     | Geïmplementeerd    | Sessielijst werkt tegen de Gateway-sessiestatus; opdrachten worden aangekondigd via `available_commands_update`.                                                                                                                                     |
| `loadSession`                                                        | Gedeeltelijk       | Koppelt de ACP-sessie opnieuw aan een Gateway-sessiesleutel en speelt opgeslagen tekstgeschiedenis van gebruiker/assistent opnieuw af. Tool-/systeemgeschiedenis wordt nog niet gereconstrueerd.                                                      |
| Promptinhoud (`text`, ingesloten `resource`, afbeeldingen)           | Gedeeltelijk       | Tekst/resources worden afgevlakt naar chatinvoer; afbeeldingen worden Gateway-bijlagen.                                                                                                                                                              |
| Sessiemodi                                                           | Gedeeltelijk       | `session/set_mode` wordt ondersteund en de bridge biedt initiële door Gateway ondersteunde sessiebediening voor denkniveau, tooluitgebreidheid, reasoning, gebruiksdetails en verhoogde acties. Bredere ACP-native modus-/configuratieoppervlakken vallen nog buiten scope. |
| Sessie-info en gebruiksupdates                                       | Gedeeltelijk       | De bridge zendt `session_info_update` en best-effort `usage_update`-meldingen uit vanuit gecachte Gateway-sessiesnapshots. Gebruik is bij benadering en wordt alleen verzonden wanneer Gateway-tokentotalen als actueel zijn gemarkeerd.             |
| Toolstreaming                                                        | Gedeeltelijk       | `tool_call` / `tool_call_update`-events bevatten ruwe I/O, tekstinhoud en best-effort bestandslocaties wanneer Gateway-toolargumenten/-resultaten die blootleggen. Ingesloten terminals en rijkere diff-native uitvoer worden nog niet blootgelegd.   |
| MCP-servers per sessie (`mcpServers`)                                | Niet ondersteund   | Bridgemodus weigert MCP-serververzoeken per sessie. Configureer MCP in plaats daarvan op de OpenClaw Gateway of agent.                                                                                                                               |
| Clientbestandssysteemmethoden (`fs/read_text_file`, `fs/write_text_file`) | Niet ondersteund   | De bridge roept geen ACP-clientbestandssysteemmethoden aan.                                                                                                                                                                                          |
| Clientterminalmethoden (`terminal/*`)                                | Niet ondersteund   | De bridge maakt geen ACP-clientterminals aan en streamt geen terminal-id's via toolaanroepen.                                                                                                                                                        |
| Sessieplannen / denksstreaming                                       | Niet ondersteund   | De bridge zendt momenteel uitvoertekst en toolstatus uit, geen ACP-plan- of denkupdates.                                                                                                                                                            |

## Bekende beperkingen

- `loadSession` speelt opgeslagen tekstgeschiedenis van gebruiker en assistent
  opnieuw af, maar reconstrueert geen historische toolaanroepen, systeemmeldingen
  of rijkere ACP-native eventtypen.
- Als meerdere ACP-clients dezelfde Gateway-sessiesleutel delen, zijn event- en
  annuleringsroutering best-effort in plaats van strikt geïsoleerd per client.
  Geef de voorkeur aan de standaard geïsoleerde `acp:<uuid>`-sessies wanneer je
  schone editorlokale beurten nodig hebt.
- Gateway-stopstatussen worden vertaald naar ACP-stopredenen, maar die mapping is
  minder expressief dan een volledig ACP-native runtime.
- Initiële sessiebediening toont momenteel een gerichte subset van Gateway-knoppen:
  denkniveau, tooluitgebreidheid, reasoning, gebruiksdetails en verhoogde
  acties. Modelselectie en exec-hostbediening zijn nog niet blootgelegd als ACP-
  configuratieopties.
- `session_info_update` en `usage_update` worden afgeleid van Gateway-sessiesnapshots,
  niet van live ACP-native runtimeboekhouding. Gebruik is bij benadering,
  bevat geen kostengegevens en wordt alleen uitgezonden wanneer de Gateway totale
  tokengegevens als actueel markeert.
- Tool-meeloopgegevens zijn best-effort. De bridge kan bestandspaden tonen die
  in bekende toolargumenten/-resultaten voorkomen, maar zendt nog geen ACP-
  terminals of gestructureerde bestandsdiffs uit.

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

Gebruik de ingebouwde ACP-client om de bridge zonder IDE te controleren.
Deze start de ACP-bridge en laat je interactief prompts typen.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Toestemmingsmodel (clientdebugmodus):

- Automatische goedkeuring is gebaseerd op een allowlist en geldt alleen voor vertrouwde kerntool-ID's.
- Automatische goedkeuring voor `read` is beperkt tot de huidige werkdirectory (`--cwd` wanneer ingesteld).
- ACP keurt alleen smalle alleen-lezen klassen automatisch goed: gescopete `read`-aanroepen onder de actieve cwd plus alleen-lezen zoektools (`search`, `web_search`, `memory_search`). Onbekende/niet-kern-tools, reads buiten scope, tools die exec kunnen uitvoeren, control-plane-tools, muterende tools en interactieve flows vereisen altijd expliciete promptgoedkeuring.
- Door de server aangeleverde `toolCall.kind` wordt behandeld als niet-vertrouwde metadata (niet als autorisatiebron).
- Dit ACP-bridgebeleid staat los van ACPX-harnastoestemmingen. Als je OpenClaw via de `acpx`-backend uitvoert, is `plugins.entries.acpx.config.permissionMode=approve-all` de noodschakelaar "yolo" voor die harnassessie.

## Dit gebruiken

Gebruik ACP wanneer een IDE (of andere client) Agent Client Protocol spreekt en je wilt
dat die een OpenClaw Gateway-sessie aanstuurt.

1. Zorg dat de Gateway draait (lokaal of remote).
2. Configureer het Gateway-doel (configuratie of flags).
3. Laat je IDE `openclaw acp` via stdio uitvoeren.

Voorbeeldconfiguratie (opgeslagen):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Voorbeeld van rechtstreeks uitvoeren (geen configschrijving):

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
sessies hebben; ACP gebruikt standaard een geïsoleerde `acp:<uuid>`-sessie tenzij
je de sleutel of het label overschrijft.

`mcpServers` per sessie worden niet ondersteund in bridgemodus. Als een ACP-client
ze tijdens `newSession` of `loadSession` verzendt, retourneert de bridge een duidelijke
fout in plaats van ze stilzwijgend te negeren.

Als je wilt dat door ACPX ondersteunde sessies OpenClaw Plugin-tools of geselecteerde
ingebouwde tools zoals `cron` zien, schakel dan de Gateway-zijdige ACPX MCP-bridges in
in plaats van te proberen `mcpServers` per sessie door te geven. Zie
[ACP Agents](/nl/tools/acp-agents-setup#plugin-tools-mcp-bridge) en
[OpenClaw-tools MCP-bridge](/nl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Gebruik vanuit `acpx` (Codex, Claude, andere ACP-clients)

Als je wilt dat een code-agent zoals Codex of Claude Code via ACP met je
OpenClaw-bot praat, gebruik dan `acpx` met het ingebouwde `openclaw`-doel.

Typische flow:

1. Voer de Gateway uit en zorg dat de ACP-bridge deze kan bereiken.
2. Wijs `acpx openclaw` naar `openclaw acp`.
3. Target de OpenClaw-sessiesleutel die de code-agent moet gebruiken.

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
target, overschrijf dan de `openclaw`-agentopdracht in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Gebruik voor een repo-lokale OpenClaw-checkout het rechtstreekse CLI-entrypoint in plaats van de
dev-runner, zodat de ACP-stream schoon blijft. Bijvoorbeeld:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dit is de eenvoudigste manier om Codex, Claude Code of een andere ACP-bewuste client
contextuele informatie uit een OpenClaw-agent te laten ophalen zonder een terminal te scrapen.

## Zed-editor instellen

Voeg een aangepaste ACP-agent toe in `~/.config/zed/settings.json` (of gebruik de Settings UI van Zed):

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

Standaard krijgen ACP-sessies een geïsoleerde Gateway-sessiesleutel met een `acp:`-prefix.
Geef een sessiesleutel of label door om een bekende sessie te hergebruiken:

- `--session <key>`: gebruik een specifieke Gateway-sessiesleutel.
- `--session-label <label>`: los een bestaande sessie op op basis van label.
- `--reset-session`: maak een nieuwe sessie-id aan voor die sleutel (dezelfde sleutel, nieuw transcript).

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

- `--url <url>`: Gateway WebSocket-URL (standaard `gateway.remote.url` wanneer geconfigureerd).
- `--token <token>`: Gateway-authenticatietoken.
- `--token-file <path>`: lees Gateway-authenticatietoken uit bestand.
- `--password <password>`: Gateway-authenticatiewachtwoord.
- `--password-file <path>`: lees Gateway-authenticatiewachtwoord uit bestand.
- `--session <key>`: standaard sessiesleutel.
- `--session-label <label>`: standaard sessielabel om op te lossen.
- `--require-existing`: faal als de sessiesleutel of het label niet bestaat.
- `--reset-session`: reset de sessiesleutel vóór het eerste gebruik.
- `--no-prefix-cwd`: voeg de werkmap niet als prefix toe aan prompts.
- `--provenance <off|meta|meta+receipt>`: neem ACP-herkomstmetadata of ontvangstbewijzen op.
- `--verbose, -v`: uitgebreide logging naar stderr.

Beveiligingsopmerking:

- `--token` en `--password` kunnen op sommige systemen zichtbaar zijn in lokale proceslijsten.
- Gebruik bij voorkeur `--token-file`/`--password-file` of omgevingsvariabelen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Gateway-authenticatieresolutie volgt het gedeelde contract dat door andere Gateway-clients wordt gebruikt:
  - lokale modus: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*`-fallback alleen wanneer `gateway.auth.*` niet is ingesteld (geconfigureerde maar niet-opgeloste lokale SecretRefs falen gesloten)
  - externe modus: `gateway.remote.*` met env/config-fallback volgens de externe prioriteitsregels
  - `--url` is overschrijvingsveilig en hergebruikt geen impliciete config/env-referenties; geef expliciet `--token`/`--password` door (of bestandsvarianten)
- ACP runtime-backend-childprocessen ontvangen `OPENCLAW_SHELL=acp`, wat kan worden gebruikt voor contextspecifieke shell-/profielregels.
- `openclaw acp client` stelt `OPENCLAW_SHELL=acp-client` in op het gestarte bridgeproces.

### Opties voor `acp client`

- `--cwd <dir>`: werkmap voor de ACP-sessie.
- `--server <command>`: ACP-servercommando (standaard: `openclaw`).
- `--server-args <args...>`: extra argumenten die aan de ACP-server worden doorgegeven.
- `--server-verbose`: schakel uitgebreide logging op de ACP-server in.
- `--verbose, -v`: uitgebreide clientlogging.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [ACP-agents](/nl/tools/acp-agents)
