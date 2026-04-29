---
read_when:
    - ACP-gebaseerde IDE-integraties instellen
    - Foutopsporing voor ACP-sessierouting naar de Gateway
summary: De ACP-brug uitvoeren voor IDE-integraties
title: ACP
x-i18n:
    generated_at: "2026-04-29T22:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 16
---

Voer de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) brug uit die met een OpenClaw Gateway communiceert.

Deze opdracht spreekt ACP via stdio voor IDE's en stuurt prompts door naar de Gateway
via WebSocket. Sessiegegevens van ACP worden gekoppeld aan Gateway-sessiesleutels.

`openclaw acp` is een door Gateway ondersteunde ACP-brug, geen volledige ACP-native editor-
runtime. De focus ligt op sessieroutering, promptlevering en basisupdates voor streaming.

Als je wilt dat een externe MCP-client rechtstreeks met OpenClaw-kanaalgesprekken
praat in plaats van een ACP-harness-sessie te hosten, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp).

## Wat dit niet is

Deze pagina wordt vaak verward met ACP-harness-sessies.

`openclaw acp` betekent:

- OpenClaw fungeert als een ACP-server
- een IDE of ACP-client maakt verbinding met OpenClaw
- OpenClaw stuurt dat werk door naar een Gateway-sessie

Dit verschilt van [ACP Agents](/nl/tools/acp-agents), waarbij OpenClaw een
externe harness zoals Codex of Claude Code via `acpx` uitvoert.

Snelle regel:

- editor/client wil via ACP met OpenClaw praten: gebruik `openclaw acp`
- OpenClaw moet Codex/Claude/Gemini starten als een ACP-harness: gebruik `/acp spawn` en [ACP Agents](/nl/tools/acp-agents)

## Compatibiliteitsmatrix

| ACP-gebied                                                           | Status           | Opmerkingen                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                       | Geïmplementeerd  | Kernstroom van de brug via stdio naar Gateway chat/send + abort.                                                                                                                                                                                |
| `listSessions`, slash-opdrachten                                     | Geïmplementeerd  | Sessielijst werkt tegen de Gateway-sessiestatus; opdrachten worden aangekondigd via `available_commands_update`.                                                                                                                                |
| `loadSession`                                                        | Gedeeltelijk     | Koppelt de ACP-sessie opnieuw aan een Gateway-sessiesleutel en speelt opgeslagen tekstgeschiedenis van gebruiker/assistent opnieuw af. Tool-/systeemgeschiedenis wordt nog niet gereconstrueerd.                                               |
| Promptinhoud (`text`, ingesloten `resource`, afbeeldingen)           | Gedeeltelijk     | Tekst/resources worden afgevlakt tot chatinvoer; afbeeldingen worden Gateway-bijlagen.                                                                                                                                                         |
| Sessiemodi                                                           | Gedeeltelijk     | `session/set_mode` wordt ondersteund en de brug biedt initiële door Gateway ondersteunde sessiebesturing voor denkniveau, tool-uitvoerigheid, redeneren, gebruiksdetail en verhoogde acties. Bredere ACP-native modus-/configuratieoppervlakken vallen nog buiten de scope. |
| Sessie-info en gebruiksupdates                                       | Gedeeltelijk     | De brug verzendt `session_info_update` en best-effort `usage_update`-meldingen uit gecachte Gateway-sessiesnapshots. Gebruik is bij benadering en wordt alleen verzonden wanneer Gateway-tokentotalen als actueel zijn gemarkeerd.             |
| Toolstreaming                                                        | Gedeeltelijk     | `tool_call` / `tool_call_update`-gebeurtenissen bevatten ruwe I/O, tekstinhoud en best-effort bestandslocaties wanneer Gateway-toolargumenten/-resultaten die tonen. Ingesloten terminals en rijkere diff-native uitvoer worden nog niet beschikbaar gesteld. |
| MCP-servers per sessie (`mcpServers`)                                | Niet ondersteund | Brugmodus weigert MCP-serververzoeken per sessie. Configureer MCP in plaats daarvan op de OpenClaw-Gateway of agent.                                                                                                                           |
| Bestandssysteemmethoden van clients (`fs/read_text_file`, `fs/write_text_file`) | Niet ondersteund | De brug roept geen ACP-clientbestandssysteemmethoden aan.                                                                                                                                                                                       |
| Terminalmethoden van clients (`terminal/*`)                          | Niet ondersteund | De brug maakt geen ACP-clientterminals aan en streamt geen terminal-id's via toolaanroepen.                                                                                                                                                    |
| Sessieplannen / gedachte-streaming                                   | Niet ondersteund | De brug verzendt momenteel uitvoertekst en toolstatus, geen ACP-plan- of gedachte-updates.                                                                                                                                                     |

## Bekende beperkingen

- `loadSession` speelt opgeslagen tekstgeschiedenis van gebruiker en assistent opnieuw af, maar reconstrueert geen
  historische toolaanroepen, systeemmeldingen of rijkere ACP-native gebeurtenistypen.
- Als meerdere ACP-clients dezelfde Gateway-sessiesleutel delen, is routering van gebeurtenissen en annuleringen
  best-effort in plaats van strikt geïsoleerd per client. Geef de voorkeur aan de
  standaard geïsoleerde `acp:<uuid>`-sessies wanneer je schone editor-lokale
  beurten nodig hebt.
- Stopstatussen van Gateway worden vertaald naar ACP-stopredenen, maar die koppeling is
  minder expressief dan bij een volledig ACP-native runtime.
- Initiële sessiebesturing toont momenteel een gerichte subset van Gateway-knoppen:
  denkniveau, tool-uitvoerigheid, redeneren, gebruiksdetail en verhoogde
  acties. Modelselectie en exec-hostbesturing zijn nog niet beschikbaar als ACP-
  configuratieopties.
- `session_info_update` en `usage_update` worden afgeleid van Gateway-sessie-
  snapshots, niet van live ACP-native runtimeboekhouding. Gebruik is bij benadering,
  bevat geen kostengegevens en wordt alleen verzonden wanneer de Gateway totale token-
  gegevens als actueel markeert.
- Meeloopgegevens voor tools zijn best-effort. De brug kan bestandspaden tonen die
  in bekende toolargumenten/-resultaten voorkomen, maar verzendt nog geen ACP-terminals of
  gestructureerde bestandsdiffs.

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

Gebruik de ingebouwde ACP-client om de brug zonder IDE te controleren.
Deze start de ACP-brug en laat je interactief prompts typen.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Toestemmingsmodel (clientdebugmodus):

- Automatische goedkeuring is gebaseerd op een allowlist en geldt alleen voor vertrouwde kern-tool-ID's.
- Automatische goedkeuring voor `read` is beperkt tot de huidige werkmap (`--cwd` wanneer ingesteld).
- ACP keurt alleen smalle readonly-klassen automatisch goed: scoped `read`-aanroepen onder de actieve cwd plus readonly zoektools (`search`, `web_search`, `memory_search`). Onbekende/niet-kern-tools, reads buiten scope, tools die exec kunnen uitvoeren, control-plane-tools, muterende tools en interactieve stromen vereisen altijd expliciete promptgoedkeuring.
- Door de server geleverde `toolCall.kind` wordt behandeld als niet-vertrouwde metadata (niet als autorisatiebron).
- Dit ACP-brugbeleid staat los van ACPX-harnesstoestemmingen. Als je OpenClaw via de `acpx`-backend uitvoert, is `plugins.entries.acpx.config.permissionMode=approve-all` de noodschakelaar “yolo” voor die harness-sessie.

## Hoe je dit gebruikt

Gebruik ACP wanneer een IDE (of andere client) Agent Client Protocol spreekt en je wilt
dat die een OpenClaw Gateway-sessie aanstuurt.

1. Zorg dat de Gateway draait (lokaal of extern).
2. Configureer het Gateway-doel (configuratie of flags).
3. Laat je IDE `openclaw acp` via stdio uitvoeren.

Voorbeeldconfiguratie (opgeslagen):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Voorbeeld van direct uitvoeren (geen configuratie schrijven):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agents selecteren

ACP kiest agents niet rechtstreeks. Het routeert op basis van de Gateway-sessiesleutel.

Gebruik agent-scoped sessiesleutels om een specifieke agent te targeten:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Elke ACP-sessie wordt gekoppeld aan één Gateway-sessiesleutel. Eén agent kan veel
sessies hebben; ACP gebruikt standaard een geïsoleerde `acp:<uuid>`-sessie tenzij je
de sleutel of het label overschrijft.

`mcpServers` per sessie worden niet ondersteund in brugmodus. Als een ACP-client
ze tijdens `newSession` of `loadSession` verzendt, retourneert de brug een duidelijke
fout in plaats van ze stilzwijgend te negeren.

Als je wilt dat door ACPX ondersteunde sessies OpenClaw-Plugin-tools of geselecteerde
ingebouwde tools zoals `cron` zien, schakel dan de gateway-side ACPX MCP-bruggen in in plaats
van te proberen `mcpServers` per sessie door te geven. Zie
[ACP Agents](/nl/tools/acp-agents-setup#plugin-tools-mcp-bridge) en
[OpenClaw-tools MCP-brug](/nl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Gebruiken vanuit `acpx` (Codex, Claude, andere ACP-clients)

Als je wilt dat een coding agent zoals Codex of Claude Code via ACP met je
OpenClaw-bot praat, gebruik dan `acpx` met het ingebouwde `openclaw`-doel.

Typische stroom:

1. Voer de Gateway uit en zorg dat de ACP-brug deze kan bereiken.
2. Richt `acpx openclaw` op `openclaw acp`.
3. Target de OpenClaw-sessiesleutel die je de coding agent wilt laten gebruiken.

Voorbeelden:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Als je wilt dat `acpx openclaw` elke keer een specifieke Gateway en sessiesleutel target,
overschrijf dan de agentopdracht `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Voor een repo-lokale OpenClaw-checkout gebruik je het directe CLI-entrypoint in plaats van de
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

Open in Zed het paneel Agent en selecteer “OpenClaw ACP” om een thread te starten.

## Sessietoewijzing

Standaard krijgen ACP-sessies een geïsoleerde Gateway-sessiesleutel met een `acp:`-voorvoegsel.
Geef een sessiesleutel of label door om een bekende sessie te hergebruiken:

- `--session <key>`: gebruik een specifieke Gateway-sessiesleutel.
- `--session-label <label>`: los een bestaande sessie op via label.
- `--reset-session`: maak een nieuwe sessie-id aan voor die sleutel (zelfde sleutel, nieuw transcript).

Als je ACP-client metagegevens ondersteunt, kun je per sessie overschrijven:

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

- `--url <url>`: Gateway WebSocket-URL (standaard gateway.remote.url wanneer geconfigureerd).
- `--token <token>`: Gateway-authenticatietoken.
- `--token-file <path>`: lees het Gateway-authenticatietoken uit een bestand.
- `--password <password>`: Gateway-authenticatiewachtwoord.
- `--password-file <path>`: lees het Gateway-authenticatiewachtwoord uit een bestand.
- `--session <key>`: standaard sessiesleutel.
- `--session-label <label>`: standaard sessielabel om op te lossen.
- `--require-existing`: mislukt als de sessiesleutel/het sessielabel niet bestaat.
- `--reset-session`: reset de sessiesleutel vóór het eerste gebruik.
- `--no-prefix-cwd`: zet de werkmap niet als prefix voor prompts.
- `--provenance <off|meta|meta+receipt>`: voeg ACP-herkomstmetagegevens of ontvangstbewijzen toe.
- `--verbose, -v`: uitgebreide logging naar stderr.

Beveiligingsopmerking:

- `--token` en `--password` kunnen op sommige systemen zichtbaar zijn in lokale proceslijsten.
- Geef de voorkeur aan `--token-file`/`--password-file` of omgevingsvariabelen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Gateway-authenticatieresolutie volgt het gedeelde contract dat door andere Gateway-clients wordt gebruikt:
  - lokale modus: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` fallback alleen wanneer `gateway.auth.*` niet is ingesteld (geconfigureerde maar niet-opgeloste lokale SecretRefs falen gesloten)
  - externe modus: `gateway.remote.*` met env/config-fallback volgens externe prioriteitsregels
  - `--url` is veilig als override en hergebruikt geen impliciete config/env-inloggegevens; geef expliciet `--token`/`--password` door (of bestandsvarianten)
- Onderliggende processen van de ACP-runtimebackend ontvangen `OPENCLAW_SHELL=acp`, wat kan worden gebruikt voor contextspecifieke shell-/profielregels.
- `openclaw acp client` stelt `OPENCLAW_SHELL=acp-client` in op het gestarte bridgeproces.

### Opties voor `acp client`

- `--cwd <dir>`: werkmap voor de ACP-sessie.
- `--server <command>`: ACP-serveropdracht (standaard: `openclaw`).
- `--server-args <args...>`: extra argumenten die aan de ACP-server worden doorgegeven.
- `--server-verbose`: schakel uitgebreide logging in op de ACP-server.
- `--verbose, -v`: uitgebreide clientlogging.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [ACP-agenten](/nl/tools/acp-agents)
