---
read_when:
    - Configurazione delle integrazioni IDE basate su ACP
    - Debug delle sessioni ACP instradate al Gateway
summary: Esegui il bridge ACP per le integrazioni IDE
title: acp
x-i18n:
    generated_at: "2026-04-23T08:25:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

Esegui il bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) che comunica con un Gateway OpenClaw.

Questo comando usa ACP su stdio per gli IDE e inoltra i prompt al Gateway tramite WebSocket. Mantiene le sessioni ACP mappate alle chiavi di sessione del Gateway.

`openclaw acp` è un bridge ACP basato su Gateway, non un runtime editor completo nativo ACP. Si concentra su instradamento delle sessioni, consegna dei prompt e aggiornamenti di streaming di base.

Se vuoi che un client MCP esterno comunichi direttamente con le conversazioni dei canali OpenClaw invece di ospitare una sessione harness ACP, usa invece [`openclaw mcp serve`](/it/cli/mcp).

## Cosa non è

Questa pagina viene spesso confusa con le sessioni harness ACP.

`openclaw acp` significa:

- OpenClaw agisce come server ACP
- un IDE o client ACP si connette a OpenClaw
- OpenClaw inoltra quel lavoro in una sessione Gateway

Questo è diverso da [ACP Agents](/it/tools/acp-agents), dove OpenClaw esegue un harness esterno come Codex o Claude Code tramite `acpx`.

Regola rapida:

- editor/client vuole parlare ACP con OpenClaw: usa `openclaw acp`
- OpenClaw deve avviare Codex/Claude/Gemini come harness ACP: usa `/acp spawn` e [ACP Agents](/it/tools/acp-agents)

## Matrice di compatibilità

| Area ACP                                                              | Stato       | Note                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementato | Flusso core del bridge su stdio verso chat/send + abort del Gateway.                                                                                                                                                                                      |
| `listSessions`, slash commands                                        | Implementato | L'elenco sessioni funziona rispetto allo stato della sessione Gateway; i comandi vengono pubblicizzati tramite `available_commands_update`.                                                                                                              |
| `loadSession`                                                         | Parziale    | Riassocia la sessione ACP a una chiave di sessione Gateway e riproduce la cronologia di testo utente/assistente memorizzata. La cronologia tool/system non viene ancora ricostruita.                                                                  |
| Contenuto del prompt (`text`, `resource` incorporata, immagini)       | Parziale    | Testo/risorse vengono appiattiti nell'input chat; le immagini diventano allegati del Gateway.                                                                                                                                                            |
| Modalità sessione                                                     | Parziale    | `session/set_mode` è supportato e il bridge espone controlli iniziali di sessione basati su Gateway per livello di pensiero, verbosità dei tool, ragionamento, dettaglio di utilizzo e azioni elevate. Superfici più ampie di modalità/config native ACP restano fuori ambito. |
| Informazioni sessione e aggiornamenti di utilizzo                     | Parziale    | Il bridge emette notifiche `session_info_update` e `usage_update` best-effort da snapshot in cache della sessione Gateway. L'utilizzo è approssimativo e viene inviato solo quando i totali token del Gateway sono marcati come aggiornati.         |
| Streaming dei tool                                                    | Parziale    | Gli eventi `tool_call` / `tool_call_update` includono I/O grezzo, contenuto testuale e posizioni file best-effort quando argomenti/risultati del tool Gateway li espongono. Terminali incorporati e output più ricchi nativi di diff non sono ancora esposti. |
| Server MCP per sessione (`mcpServers`)                                | Non supportato | La modalità bridge rifiuta le richieste di server MCP per sessione. Configura invece MCP sul Gateway OpenClaw o sull'agente.                                                                                                                           |
| Metodi filesystem del client (`fs/read_text_file`, `fs/write_text_file`) | Non supportato | Il bridge non chiama i metodi filesystem del client ACP.                                                                                                                                                                                                 |
| Metodi terminale del client (`terminal/*`)                            | Non supportato | Il bridge non crea terminali del client ACP né trasmette ID terminale tramite chiamate tool.                                                                                                                                                             |
| Piani di sessione / streaming del pensiero                            | Non supportato | Il bridge attualmente emette testo di output e stato dei tool, non aggiornamenti ACP di piano o pensiero.                                                                                                                                               |

## Limitazioni note

- `loadSession` riproduce la cronologia di testo memorizzata di utente e assistente, ma non ricostruisce chiamate tool storiche, avvisi di sistema o tipi di evento nativi ACP più ricchi.
- Se più client ACP condividono la stessa chiave di sessione Gateway, l'instradamento di eventi e annullamenti è best-effort anziché rigorosamente isolato per client. Preferisci le sessioni isolate predefinite `acp:<uuid>` quando hai bisogno di turni puliti locali all'editor.
- Gli stati di arresto del Gateway vengono tradotti in motivi di arresto ACP, ma quella mappatura è meno espressiva di un runtime completamente nativo ACP.
- I controlli iniziali di sessione espongono attualmente un sottoinsieme mirato di manopole Gateway: livello di pensiero, verbosità dei tool, ragionamento, dettaglio di utilizzo e azioni elevate. La selezione del modello e i controlli dell'host di esecuzione non sono ancora esposti come opzioni di configurazione ACP.
- `session_info_update` e `usage_update` derivano da snapshot della sessione Gateway, non da contabilità runtime live nativa ACP. L'utilizzo è approssimativo, non include dati di costo e viene emesso solo quando il Gateway marca come aggiornati i dati totali dei token.
- I dati di follow-along dei tool sono best-effort. Il bridge può mostrare percorsi file che compaiono in argomenti/risultati di tool noti, ma non emette ancora terminali ACP o diff file strutturati.

## Utilizzo

```bash
openclaw acp

# Gateway remoto
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token da file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Collegati a una chiave di sessione esistente
openclaw acp --session agent:main:main

# Collegati per etichetta (deve esistere già)
openclaw acp --session-label "support inbox"

# Reimposta la chiave di sessione prima del primo prompt
openclaw acp --session agent:main:main --reset-session
```

## Client ACP (debug)

Usa il client ACP integrato per verificare rapidamente il bridge senza un IDE.
Avvia il bridge ACP e ti consente di digitare prompt in modo interattivo.

```bash
openclaw acp client

# Punta il bridge avviato a un Gateway remoto
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override del comando server (predefinito: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modello di autorizzazione (modalità debug client):

- L'auto-approvazione è basata su allowlist e si applica solo a ID tool core affidabili.
- L'auto-approvazione `read` è limitata alla directory di lavoro corrente (`--cwd` quando impostato).
- ACP auto-approva solo classi ristrette in sola lettura: chiamate `read` limitate sotto la cwd attiva più strumenti di ricerca in sola lettura (`search`, `web_search`, `memory_search`). Tool sconosciuti/non core, letture fuori ambito, tool capaci di esecuzione, tool control-plane, tool mutanti e flussi interattivi richiedono sempre approvazione esplicita del prompt.
- `toolCall.kind` fornito dal server viene trattato come metadato non affidabile (non come fonte di autorizzazione).
- Questa policy del bridge ACP è separata dai permessi dell'harness ACPX. Se esegui OpenClaw tramite backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` è lo switch di emergenza “yolo” per quella sessione harness.

## Come usarlo

Usa ACP quando un IDE (o altro client) parla Agent Client Protocol e vuoi che piloti una sessione Gateway OpenClaw.

1. Assicurati che il Gateway sia in esecuzione (locale o remoto).
2. Configura la destinazione del Gateway (configurazione o flag).
3. Configura il tuo IDE per eseguire `openclaw acp` su stdio.

Configurazione di esempio (persistente):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Esecuzione diretta di esempio (senza scrivere nella configurazione):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferito per la sicurezza del processo locale
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selezione degli agenti

ACP non seleziona direttamente gli agenti. Instrada tramite la chiave di sessione del Gateway.

Usa chiavi di sessione con ambito agente per puntare a un agente specifico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Ogni sessione ACP è mappata a una singola chiave di sessione Gateway. Un agente può avere molte sessioni; ACP usa per impostazione predefinita una sessione isolata `acp:<uuid>` a meno che tu non faccia override della chiave o dell'etichetta.

Gli `mcpServers` per sessione non sono supportati in modalità bridge. Se un client ACP li invia durante `newSession` o `loadSession`, il bridge restituisce un errore chiaro invece di ignorarli silenziosamente.

Se vuoi che le sessioni basate su ACPX vedano i tool Plugin OpenClaw o tool built-in selezionati come `cron`, abilita i bridge MCP ACPX lato Gateway invece di cercare di passare `mcpServers` per sessione. Vedi [ACP Agents](/it/tools/acp-agents#plugin-tools-mcp-bridge) e [Bridge MCP dei tool OpenClaw](/it/tools/acp-agents#openclaw-tools-mcp-bridge).

## Uso da `acpx` (Codex, Claude, altri client ACP)

Se vuoi che un agente di coding come Codex o Claude Code comunichi con il tuo bot OpenClaw tramite ACP, usa `acpx` con il suo target `openclaw` integrato.

Flusso tipico:

1. Avvia il Gateway e assicurati che il bridge ACP possa raggiungerlo.
2. Punta `acpx openclaw` a `openclaw acp`.
3. Scegli la chiave di sessione OpenClaw che vuoi far usare all'agente di coding.

Esempi:

```bash
# Richiesta one-shot nella tua sessione ACP OpenClaw predefinita
acpx openclaw exec "Riassumi lo stato della sessione ACP OpenClaw attiva."

# Sessione persistente con nome per turni successivi
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Chiedi al mio agente di lavoro OpenClaw il contesto recente rilevante per questo repository."
```

Se vuoi che `acpx openclaw` punti sempre a un Gateway e a una chiave di sessione specifici, fai override del comando agente `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Per un checkout OpenClaw locale al repository, usa il punto d'ingresso CLI diretto invece del runner di sviluppo così lo stream ACP resta pulito. Ad esempio:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Questo è il modo più semplice per consentire a Codex, Claude Code o un altro client compatibile ACP di recuperare informazioni contestuali da un agente OpenClaw senza fare scraping di un terminale.

## Configurazione dell'editor Zed

Aggiungi un agente ACP personalizzato in `~/.config/zed/settings.json` (oppure usa l'interfaccia Settings di Zed):

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

Per puntare a un Gateway o agente specifico:

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

In Zed, apri il pannello Agent e seleziona “OpenClaw ACP” per avviare un thread.

## Mappatura delle sessioni

Per impostazione predefinita, le sessioni ACP ricevono una chiave di sessione Gateway isolata con prefisso `acp:`.
Per riutilizzare una sessione nota, passa una chiave di sessione o un'etichetta:

- `--session <key>`: usa una chiave di sessione Gateway specifica.
- `--session-label <label>`: risolve una sessione esistente tramite etichetta.
- `--reset-session`: genera un nuovo ID sessione per quella chiave (stessa chiave, nuova trascrizione).

Se il tuo client ACP supporta i metadati, puoi fare override per sessione:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Scopri di più sulle chiavi di sessione in [/concepts/session](/it/concepts/session).

## Opzioni

- `--url <url>`: URL WebSocket del Gateway (usa `gateway.remote.url` come predefinito se configurato).
- `--token <token>`: token di autenticazione del Gateway.
- `--token-file <path>`: legge il token di autenticazione del Gateway da file.
- `--password <password>`: password di autenticazione del Gateway.
- `--password-file <path>`: legge la password di autenticazione del Gateway da file.
- `--session <key>`: chiave di sessione predefinita.
- `--session-label <label>`: etichetta di sessione predefinita da risolvere.
- `--require-existing`: fallisce se la chiave/etichetta di sessione non esiste.
- `--reset-session`: reimposta la chiave di sessione prima del primo utilizzo.
- `--no-prefix-cwd`: non anteporre la directory di lavoro ai prompt.
- `--provenance <off|meta|meta+receipt>`: include metadati o ricevute di provenienza ACP.
- `--verbose, -v`: logging dettagliato su stderr.

Nota sulla sicurezza:

- `--token` e `--password` possono essere visibili negli elenchi dei processi locali su alcuni sistemi.
- Preferisci `--token-file`/`--password-file` o le variabili d'ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La risoluzione dell'autenticazione del Gateway segue il contratto condiviso usato dagli altri client Gateway:
  - modalità locale: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback a `gateway.remote.*` solo quando `gateway.auth.*` non è impostato (SecretRef locali configurati ma non risolti falliscono in modalità chiusa)
  - modalità remota: `gateway.remote.*` con fallback env/config secondo le regole di precedenza remota
  - `--url` è sicuro per gli override e non riutilizza credenziali implicite da config/env; passa `--token`/`--password` espliciti (o le varianti da file)
- I processi figli del backend runtime ACP ricevono `OPENCLAW_SHELL=acp`, che può essere usato per regole shell/profile specifiche del contesto.
- `openclaw acp client` imposta `OPENCLAW_SHELL=acp-client` sul processo bridge avviato.

### Opzioni di `acp client`

- `--cwd <dir>`: directory di lavoro per la sessione ACP.
- `--server <command>`: comando del server ACP (predefinito: `openclaw`).
- `--server-args <args...>`: argomenti aggiuntivi passati al server ACP.
- `--server-verbose`: abilita il logging dettagliato sul server ACP.
- `--verbose, -v`: logging dettagliato del client.
