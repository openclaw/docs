---
read_when:
    - ACP-gebaseerde IDE-integraties instellen
    - Foutopsporing van ACP-sessieroutering naar de Gateway
summary: Voer de ACP-bridge uit voor IDE-integraties
title: ACP
x-i18n:
    generated_at: "2026-07-12T08:41:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Voer de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-bridge uit die communiceert met een OpenClaw Gateway.

`openclaw acp` spreekt ACP via stdio voor IDE's en stuurt prompts via WebSocket door naar de Gateway, waarbij ACP-sessies aan Gateway-sessiesleutels gekoppeld blijven. Het is een door een Gateway ondersteunde ACP-bridge, geen volledige ACP-native editorruntime: de nadruk ligt op sessieroutering, promptlevering en streamingupdates.

Als je wilt dat een externe MCP-client rechtstreeks met OpenClaw-kanaalgesprekken communiceert in plaats van een ACP-harness-sessie te hosten, gebruik dan [`openclaw mcp serve`](/nl/cli/mcp).

## Wat dit niet is

`openclaw acp` betekent dat OpenClaw als ACP-server fungeert: een IDE of ACP-client maakt verbinding met OpenClaw en OpenClaw stuurt dat werk door naar een Gateway-sessie.

Dit verschilt van [ACP-agents](/nl/tools/acp-agents), waarbij OpenClaw via `acpx` een externe harness zoals Codex of Claude Code uitvoert.

Vuistregel:

- editor/client wil via ACP met OpenClaw communiceren: gebruik `openclaw acp`
- OpenClaw moet Codex/Claude/Gemini als ACP-harness starten: gebruik `/acp spawn` en [ACP-agents](/nl/tools/acp-agents)

## Compatibiliteitsmatrix

| ACP-onderdeel                                                          | Status                | Opmerkingen                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                          | Geïmplementeerd       | Kernstroom van de bridge via stdio naar Gateway-chat/verzenden + afbreken.                                                                                                                                                                                     |
| `listSessions`, slashopdrachten                                         | Geïmplementeerd       | De sessielijst werkt met de Gateway-sessiestatus, met begrensde cursorpaginering en `cwd`-filtering wanneer Gateway-sessierijen werkruimtemetadata bevatten; opdrachten worden via `available_commands_update` aangekondigd.                                    |
| Metadata van sessieafstamming                                           | Geïmplementeerd       | Sessielijsten en momentopnamen van sessiegegevens bevatten de bovenliggende en onderliggende OpenClaw-afstamming in `_meta`, zodat ACP-clients subagentgrafen zonder private Gateway-nevenkanalen kunnen weergeven.                                           |
| `resumeSession`, `closeSession`                                         | Geïmplementeerd       | Hervatten koppelt een ACP-sessie opnieuw aan een bestaande Gateway-sessie zonder de geschiedenis opnieuw af te spelen. Sluiten annuleert actief bridgewerk, handelt openstaande prompts als geannuleerd af en geeft de sessiestatus van de bridge vrij.         |
| `loadSession`                                                           | Gedeeltelijk          | Koppelt de ACP-sessie opnieuw aan een Gateway-sessiesleutel en speelt de ACP-gebeurtenislogboekgeschiedenis opnieuw af voor sessies die door de bridge zijn gemaakt. Oudere sessies of sessies zonder logboek vallen terug op opgeslagen gebruikers-/assistenttekst. |
| Promptinhoud (`text`, ingesloten `resource`, afbeeldingen)              | Gedeeltelijk          | Tekst/resources worden samengevoegd tot chatinvoer; afbeeldingen worden Gateway-bijlagen.                                                                                                                                                                    |
| Sessiemodi                                                              | Gedeeltelijk          | `session/set_mode` wordt ondersteund; de bridge biedt door de Gateway ondersteunde sessiebesturing voor denkniveau, uitvoerigheid van tools, redenering, gebruiksdetails en acties met verhoogde rechten. Bredere ACP-native modus-/configuratieoppervlakken vallen nog buiten het bereik. |
| Streaming van gedachten                                                 | Geïmplementeerd       | De denkinhoud van het model wordt als `agent_thought_chunk`-sessie-updates gestreamd. ACP-native sessieplannen worden niet verzonden.                                                                                                                          |
| Sessiegegevens en gebruiksupdates                                       | Gedeeltelijk          | De bridge verzendt `session_info_update`- en naar beste vermogen `usage_update`-meldingen vanuit gecachte momentopnamen van Gateway-sessies. Het gebruik is bij benadering en wordt alleen verzonden wanneer de Gateway-token-totalen als actueel zijn gemarkeerd. |
| Toolstreaming                                                           | Gedeeltelijk          | `tool_call`-/`tool_call_update`-gebeurtenissen bevatten ruwe invoer/uitvoer, tekstinhoud en naar beste vermogen bestandslocaties wanneer Gateway-toolargumenten/-resultaten deze beschikbaar stellen. Ingesloten terminals en uitgebreidere diff-native uitvoer worden niet beschikbaar gesteld. |
| Goedkeuringen voor uitvoering                                           | Gedeeltelijk          | Gateway-prompts voor uitvoeringsgoedkeuring tijdens actieve ACP-promptbeurten worden met `session/request_permission` doorgestuurd naar de ACP-client.                                                                                                        |
| MCP-servers per sessie (`mcpServers`)                                   | Niet ondersteund      | De bridgemodus weigert aanvragen voor MCP-servers per sessie. Configureer MCP in plaats daarvan op de OpenClaw Gateway of agent.                                                                                                                              |
| Bestandssysteemmethoden van de client (`fs/read_text_file`, `fs/write_text_file`) | Niet ondersteund | De bridge roept geen ACP-bestandssysteemmethoden van de client aan.                                                                                                                                                                                           |
| Terminalmethoden van de client (`terminal/*`)                           | Niet ondersteund      | De bridge maakt geen ACP-clientterminals en streamt geen terminal-id's via toolaanroepen.                                                                                                                                                                     |

## Bekende beperkingen

- `loadSession` speelt alleen voor door de bridge gemaakte sessies de volledige geschiedenis van het ACP-gebeurtenislogboek opnieuw af. Oudere sessies of sessies zonder logboek gebruiken een terugval op het transcript en reconstrueren geen historische toolaanroepen of systeemberichten.
- Als meerdere ACP-clients dezelfde Gateway-sessiesleutel delen, gebeurt de routering van gebeurtenissen en annuleringen naar beste vermogen in plaats van strikt geïsoleerd per client. Geef de voorkeur aan de standaard geïsoleerde `acp-bridge:<uuid>`-sessies wanneer je schone editorlokale beurten nodig hebt.
- Gateway-stopstatussen worden vertaald naar ACP-stopredenen, maar die toewijzing is minder expressief dan bij een volledig ACP-native runtime.
- Sessiebesturing biedt een gerichte subset van Gateway-instellingen: denkniveau, uitvoerigheid van tools, redenering, gebruiksdetails en acties met verhoogde rechten. Modelselectie en besturing van de uitvoeringshost worden niet als ACP-configuratieopties beschikbaar gesteld.
- `session_info_update` en `usage_update` worden afgeleid van momentopnamen van Gateway-sessies, niet van live ACP-native runtimeboekhouding. Het gebruik is bij benadering, bevat geen kostengegevens en wordt alleen verzonden wanneer de Gateway de totale tokengegevens als actueel markeert.
- Meeloopgegevens voor tools worden naar beste vermogen geleverd: de bridge toont bestandspaden die in bekende toolargumenten/-resultaten voorkomen, maar verzendt geen ACP-terminals of gestructureerde bestandsdiffs.
- Het doorsturen van uitvoeringsgoedkeuringen is beperkt tot de actieve ACP-promptbeurt; goedkeuringen uit andere Gateway-sessies worden genegeerd.

## Gebruik

```bash
openclaw acp

# Externe Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Externe Gateway (token uit bestand)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Koppelen aan een bestaande sessiesleutel
openclaw acp --session agent:main:main

# Koppelen op label (moet al bestaan)
openclaw acp --session-label "support inbox"

# De sessiesleutel vóór de eerste prompt opnieuw instellen
openclaw acp --session agent:main:main --reset-session
```

## ACP-client (foutopsporing)

Gebruik de ingebouwde ACP-client om de bridge zonder IDE aan een snelle controle te onderwerpen. Deze start de ACP-bridge en laat je interactief prompts typen.

```bash
openclaw acp client

# Laat de gestarte bridge naar een externe Gateway wijzen
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Overschrijf de serveropdracht (standaard: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Toestemmingsmodel (foutopsporingsmodus van client):

- Automatische goedkeuring is gebaseerd op een toestemmingslijst en geldt alleen voor vertrouwde tool-id's uit de kern.
- Automatische goedkeuring voor `read` is beperkt tot de huidige werkmap (`--cwd` wanneer ingesteld).
- ACP keurt alleen beperkte alleen-lezenklassen automatisch goed: afgebakende `read`-aanroepen binnen de actieve cwd, plus alleen-lezenzoektools (`search`, `web_search`, `memory_search`). Onbekende tools/tools buiten de kern, leesbewerkingen buiten het bereik, tools die opdrachten kunnen uitvoeren, tools voor het besturingsvlak, muterende tools en interactieve stromen vereisen altijd expliciete goedkeuring via een prompt.
- Door de server verstrekte `toolCall.kind` wordt behandeld als niet-vertrouwde metadata, niet als autorisatiebron.
- Dit ACP-bridgebeleid staat los van ACPX-harnesstoestemmingen. Als je OpenClaw via de `acpx`-backend uitvoert, is `plugins.entries.acpx.config.permissionMode=approve-all` de noodschakelaar "yolo" voor die harness-sessie.

## Snelle protocoltest

Start voor foutopsporing op protocolniveau een Gateway met geïsoleerde status en stuur `openclaw acp` via stdio aan met een ACP JSON-RPC-client. Test `initialize`, `session/new`, `session/list` met een absolute `cwd`, `session/resume`, `session/close`, dubbel sluiten en hervatten van een ontbrekende sessie.

Het bewijs moet de aangekondigde levenscyclusmogelijkheden, een door een Gateway ondersteunde sessierij, updatemeldingen en het Gateway-`sessions.list`-logboek bevatten:

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

Gebruik niet alleen `openclaw gateway call sessions.list` als ACP-bewijs. Dat CLI-pad kan om een scope-upgrade voor een operator met een nieuw token vragen; de juistheid van de ACP-bridge wordt bewezen door ACP-stdioframes plus het Gateway-`sessions.list`-logboek.

## Dit gebruiken

Gebruik ACP wanneer een IDE (of andere client) Agent Client Protocol spreekt en je daarmee een OpenClaw Gateway-sessie wilt aansturen.

1. Zorg dat de Gateway actief is (lokaal of extern).
2. Configureer het Gateway-doel (configuratie of vlaggen).
3. Stel je IDE zo in dat deze `openclaw acp` via stdio uitvoert.

Voorbeeldconfiguratie (permanent opgeslagen):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Voorbeeld van rechtstreeks uitvoeren (zonder configuratie weg te schrijven):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# aanbevolen voor de veiligheid van lokale processen
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agents selecteren

ACP kiest agents niet rechtstreeks. Het routeert op basis van de Gateway-sessiesleutel. Gebruik sessiesleutels binnen het bereik van een agent om een specifieke agent te kiezen:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Elke ACP-sessie wordt aan één Gateway-sessiesleutel gekoppeld. Eén agent kan veel sessies hebben; ACP gebruikt standaard een geïsoleerde `acp-bridge:<uuid>`-sessie, tenzij je de sleutel of het label overschrijft.

`mcpServers` per sessie worden niet ondersteund in de bridge-modus. Als een ACP-client deze tijdens `newSession` of `loadSession` verzendt, retourneert de bridge een duidelijke foutmelding in plaats van ze stilzwijgend te negeren.

Als je wilt dat door ACPX ondersteunde sessies toegang hebben tot OpenClaw-plugintools of geselecteerde ingebouwde tools zoals `cron`, schakel dan de ACPX MCP-bridges aan de Gateway-zijde in in plaats van te proberen `mcpServers` per sessie door te geven. Zie [ACP-agenten](/nl/tools/acp-agents-setup#plugin-tools-mcp-bridge) en [MCP-bridge voor OpenClaw-tools](/nl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Gebruik vanuit `acpx` (Codex, Claude, andere ACP-clients)

Als je wilt dat een programmeeragent zoals Codex of Claude Code via ACP met je OpenClaw-bot communiceert, gebruik dan `acpx` met het ingebouwde doel `openclaw`.

Gebruikelijke werkwijze:

1. Start de Gateway en zorg ervoor dat de ACP-bridge deze kan bereiken.
2. Richt `acpx openclaw` op `openclaw acp`.
3. Kies de OpenClaw-sessiesleutel die de programmeeragent moet gebruiken.

Voorbeelden:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Als je wilt dat `acpx openclaw` telkens een specifieke Gateway en sessiesleutel gebruikt, overschrijf dan de agentopdracht `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Gebruik voor een lokale OpenClaw-checkout in een repository het directe CLI-invoerpunt in plaats van de ontwikkelrunner, zodat de ACP-stream schoon blijft:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dit is de eenvoudigste manier om Codex, Claude Code of een andere ACP-compatibele client contextuele informatie te laten ophalen bij een OpenClaw-agent zonder een terminal uit te lezen.

## Zed-editor instellen

Voeg een aangepaste ACP-agent toe in `~/.config/zed/settings.json` (of gebruik de Settings-interface van Zed):

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

Open in Zed het paneel Agent en selecteer "OpenClaw ACP" om een thread te starten.

## Sessietoewijzing

ACP-bridgesessies krijgen standaard een geïsoleerde Gateway-sessiesleutel met het voorvoegsel `acp-bridge:`. Deze bridgesessies met een normaal model zijn synthetisch en tijdelijk: verouderde vermeldingen kunnen worden opgeschoond en ze worden niet behandeld als beschermde oppervlakken voor menselijke gesprekken. Geef een sessiesleutel of label door om een bekende sessie opnieuw te gebruiken:

- `--session <key>`: gebruik een specifieke Gateway-sessiesleutel.
- `--session-label <label>`: zoek een bestaande sessie op aan de hand van het label.
- `--reset-session`: maak een nieuwe sessie-id voor die sleutel (dezelfde sleutel, nieuw transcript).

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

- `--url <url>`: WebSocket-URL van de Gateway (standaard `gateway.remote.url` wanneer geconfigureerd).
- `--token <token>`: authenticatietoken voor de Gateway.
- `--token-file <path>`: lees het authenticatietoken voor de Gateway uit een bestand.
- `--password <password>`: authenticatiewachtwoord voor de Gateway.
- `--password-file <path>`: lees het authenticatiewachtwoord voor de Gateway uit een bestand.
- `--session <key>`: standaardsessiesleutel.
- `--session-label <label>`: standaard op te zoeken sessielabel.
- `--require-existing`: mislukt als de sessiesleutel of het sessielabel niet bestaat.
- `--reset-session`: stel de sessiesleutel vóór het eerste gebruik opnieuw in.
- `--no-prefix-cwd`: voeg de werkmap niet als voorvoegsel aan prompts toe.
- `--provenance <off|meta|meta+receipt>`: voeg ACP-herkomstmetadata of ontvangstbewijzen toe.
- `--verbose, -v`: uitgebreide logboekregistratie naar stderr.

Beveiligingsopmerking:

- `--token` en `--password` kunnen op sommige systemen zichtbaar zijn in lokale proceslijsten. Geef de voorkeur aan `--token-file`/`--password-file` of omgevingsvariabelen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- De oplossing van Gateway-authenticatie volgt het gedeelde contract dat andere Gateway-clients gebruiken:
  - lokale modus: env (`OPENCLAW_GATEWAY_*`) en daarna `gateway.auth.*`, met terugval op `gateway.remote.*` alleen wanneer `gateway.auth.*` niet is ingesteld (een geconfigureerde maar niet-opgeloste lokale SecretRef weigert veilig in plaats van stilzwijgend terug te vallen)
  - externe modus: `gateway.remote.*` met terugval op env/config volgens de voorrangsregels voor externe verbindingen
  - `--url` kan veilig worden overschreven en gebruikt geen impliciete configuratie- of env-aanmeldgegevens opnieuw; geef expliciet `--token`/`--password` door (of de bestandsvarianten)

### Opties voor `acp client`

- `--cwd <dir>`: werkmap voor de ACP-sessie.
- `--server <command>`: ACP-serveropdracht (standaard: `openclaw`).
- `--server-args <args...>`: aanvullende argumenten die aan de ACP-server worden doorgegeven.
- `--server-verbose`: schakel uitgebreide logboekregistratie op de ACP-server in.
- `--verbose, -v`: uitgebreide clientlogboekregistratie.
- `openclaw acp client` stelt `OPENCLAW_SHELL=acp-client` in voor het gestarte bridgeproces; dit kan worden gebruikt voor contextspecifieke shell- of profielregels.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [ACP-agenten](/nl/tools/acp-agents)
