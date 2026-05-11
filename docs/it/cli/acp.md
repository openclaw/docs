---
read_when:
    - Configurazione delle integrazioni IDE basate su ACP
    - Risoluzione dei problemi del routing delle sessioni ACP verso il Gateway
summary: Esegui il bridge ACP per le integrazioni IDE
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:24:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

Esegui il bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) che comunica con un Gateway OpenClaw.

Questo comando parla ACP su stdio per gli IDE e inoltra i prompt al Gateway
tramite WebSocket. Mantiene le sessioni ACP mappate alle chiavi di sessione del Gateway.

`openclaw acp` è un bridge ACP basato su Gateway, non un runtime editor
completo nativo ACP. Si concentra su instradamento delle sessioni, recapito dei
prompt e aggiornamenti di streaming di base.

Se vuoi che un client MCP esterno comunichi direttamente con le conversazioni
dei canali OpenClaw invece di ospitare una sessione harness ACP, usa invece
[`openclaw mcp serve`](/it/cli/mcp).

## Cosa non è

Questa pagina viene spesso confusa con le sessioni harness ACP.

`openclaw acp` significa:

- OpenClaw agisce come server ACP
- un IDE o client ACP si connette a OpenClaw
- OpenClaw inoltra quel lavoro in una sessione Gateway

Questo è diverso da [Agenti ACP](/it/tools/acp-agents), dove OpenClaw esegue un
harness esterno come Codex o Claude Code tramite `acpx`.

Regola rapida:

- l'editor/client vuole parlare ACP con OpenClaw: usa `openclaw acp`
- OpenClaw deve avviare Codex/Claude/Gemini come harness ACP: usa `/acp spawn` e [Agenti ACP](/it/tools/acp-agents)

## Matrice di compatibilità

| Area ACP                                                              | Stato       | Note                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementato | Flusso bridge principale su stdio verso chat/send + abort del Gateway.                                                                                                                                                                          |
| `listSessions`, comandi slash                                         | Implementato | L'elenco sessioni funziona sullo stato delle sessioni Gateway con paginazione a cursore limitata e filtro `cwd` quando le righe di sessione Gateway includono metadati dell'area di lavoro; i comandi sono pubblicizzati tramite `available_commands_update`. |
| Metadati di derivazione della sessione                                | Implementato | Gli elenchi sessioni e gli snapshot delle informazioni di sessione includono la derivazione padre e figlio di OpenClaw in `_meta` così che i client ACP possano renderizzare grafi di subagent senza canali laterali privati del Gateway.        |
| `resumeSession`, `closeSession`                                       | Implementato | Resume ricollega una sessione ACP a una sessione Gateway esistente senza riprodurre la cronologia. Close annulla il lavoro bridge attivo, risolve i prompt in sospeso come annullati e rilascia lo stato della sessione bridge.                  |
| `loadSession`                                                         | Parziale    | Ricollega la sessione ACP a una chiave di sessione Gateway e riproduce la cronologia del registro eventi ACP per le sessioni create dal bridge. Le sessioni più vecchie/senza registro tornano al testo utente/assistant memorizzato.          |
| Contenuto dei prompt (`text`, `resource` incorporata, immagini)        | Parziale    | Testo/risorse vengono appiattiti nell'input chat; le immagini diventano allegati Gateway.                                                                                                                                                       |
| Modalità di sessione                                                  | Parziale    | `session/set_mode` è supportato e il bridge espone controlli iniziali di sessione basati su Gateway per livello di pensiero, verbosità degli strumenti, ragionamento, dettaglio d'uso e azioni elevate. Superfici più ampie di modalità/config nativamente ACP restano fuori ambito. |
| Informazioni sessione e aggiornamenti d'uso                           | Parziale    | Il bridge emette notifiche `session_info_update` e `usage_update` best-effort dagli snapshot di sessione Gateway memorizzati in cache. L'utilizzo è approssimativo e viene inviato solo quando i totali token del Gateway sono contrassegnati come freschi. |
| Streaming degli strumenti                                             | Parziale    | Gli eventi `tool_call` / `tool_call_update` includono I/O grezzo, contenuto testuale e posizioni file best-effort quando argomenti/risultati degli strumenti Gateway le espongono. Terminali incorporati e output più ricco nativo per diff non sono ancora esposti. |
| Approvazioni exec                                                     | Parziale    | I prompt di approvazione exec del Gateway durante turni prompt ACP attivi vengono inoltrati al client ACP con `session/request_permission`.                                                                                                      |
| Server MCP per sessione (`mcpServers`)                                | Non supportato | La modalità bridge rifiuta richieste di server MCP per sessione. Configura invece MCP sul gateway o sull'agente OpenClaw.                                                                                                                       |
| Metodi filesystem del client (`fs/read_text_file`, `fs/write_text_file`) | Non supportato | Il bridge non chiama i metodi filesystem del client ACP.                                                                                                                                                                                        |
| Metodi terminale del client (`terminal/*`)                            | Non supportato | Il bridge non crea terminali client ACP né trasmette ID terminale tramite chiamate agli strumenti.                                                                                                                                               |
| Piani di sessione / streaming del pensiero                            | Non supportato | Attualmente il bridge emette testo di output e stato degli strumenti, non aggiornamenti di piano o pensiero ACP.                                                                                                                                |

## Limitazioni note

- `loadSession` può riprodurre la cronologia completa del registro eventi ACP solo per
  sessioni create dal bridge. Le sessioni più vecchie/senza registro usano ancora il fallback
  della trascrizione e non ricostruiscono chiamate storiche agli strumenti o avvisi di sistema.
- Se più client ACP condividono la stessa chiave di sessione Gateway, l'instradamento
  di eventi e annullamenti è best-effort invece che strettamente isolato per client. Preferisci le
  sessioni isolate predefinite `acp:<uuid>` quando ti servono turni locali all'editor puliti.
- Gli stati di stop del Gateway vengono tradotti in motivi di stop ACP, ma quella mappatura è
  meno espressiva di un runtime completamente nativo ACP.
- I controlli iniziali di sessione attualmente espongono un sottoinsieme mirato di manopole Gateway:
  livello di pensiero, verbosità degli strumenti, ragionamento, dettaglio d'uso e azioni elevate.
  La selezione del modello e i controlli dell'host exec non sono ancora esposti come opzioni
  di configurazione ACP.
- `session_info_update` e `usage_update` derivano dagli snapshot di sessione Gateway,
  non dalla contabilità live di un runtime nativo ACP. L'utilizzo è approssimativo,
  non contiene dati di costo e viene emesso solo quando il Gateway contrassegna come freschi
  i dati totali dei token.
- I dati di accompagnamento degli strumenti sono best-effort. Il bridge può esporre percorsi file che
  compaiono in argomenti/risultati noti degli strumenti, ma non emette ancora terminali ACP o
  diff file strutturati.
- L'inoltro dell'approvazione exec è limitato al turno prompt ACP attivo; le approvazioni da
  altre sessioni Gateway vengono ignorate.

## Utilizzo

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

## Client ACP (debug)

Usa il client ACP integrato per verificare rapidamente il bridge senza un IDE.
Avvia il bridge ACP e ti permette di digitare prompt in modo interattivo.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modello di autorizzazione (modalità debug client):

- L'approvazione automatica è basata su allowlist e si applica solo agli ID di strumenti core attendibili.
- L'approvazione automatica `read` è limitata alla directory di lavoro corrente (`--cwd` quando impostata).
- ACP approva automaticamente solo classi readonly ristrette: chiamate `read` con ambito sotto il cwd attivo più strumenti di ricerca readonly (`search`, `web_search`, `memory_search`). Strumenti sconosciuti/non core, letture fuori ambito, strumenti capaci di exec, strumenti del piano di controllo, strumenti che modificano stato e flussi interattivi richiedono sempre approvazione esplicita del prompt.
- `toolCall.kind` fornito dal server viene trattato come metadato non attendibile (non come fonte di autorizzazione).
- Questa policy del bridge ACP è separata dalle autorizzazioni harness ACPX. Se esegui OpenClaw tramite il backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` è l'interruttore break-glass "yolo" per quella sessione harness.

## Smoke test del protocollo

Per il debugging a livello di protocollo, avvia un Gateway con stato isolato e pilota
`openclaw acp` su stdio con un client JSON-RPC ACP. Copri `initialize`,
`session/new`, `session/list` con un `cwd` assoluto, `session/resume`,
`session/close`, chiusura duplicata e resume mancante.

La prova deve includere le capability di ciclo di vita pubblicizzate, una riga di sessione
basata su Gateway, notifiche di aggiornamento e il log `sessions.list` del Gateway:

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

Evita di usare `openclaw gateway call sessions.list` come unica prova ACP. Quel
percorso CLI può richiedere un upgrade dell'ambito operatore fresh-token; la correttezza del bridge ACP
è provata dai frame stdio ACP più il log `sessions.list` del Gateway.

## Come usarlo

Usa ACP quando un IDE (o altro client) parla Agent Client Protocol e vuoi che
piloti una sessione Gateway OpenClaw.

1. Assicurati che il Gateway sia in esecuzione (locale o remoto).
2. Configura il target Gateway (configurazione o flag).
3. Punta il tuo IDE a eseguire `openclaw acp` su stdio.

Configurazione di esempio (persistente):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Esecuzione diretta di esempio (senza scrivere la configurazione):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selezione degli agenti

ACP non sceglie direttamente gli agenti. Instrada tramite la chiave di sessione Gateway.

Usa chiavi di sessione con ambito agente per indirizzare un agente specifico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Ogni sessione ACP corrisponde a una singola chiave di sessione Gateway. Un agente può avere molte
sessioni; ACP usa per impostazione predefinita una sessione isolata `acp:<uuid>`, a meno che tu non sovrascriva
la chiave o l'etichetta.

I `mcpServers` per sessione non sono supportati in modalità bridge. Se un client ACP
li invia durante `newSession` o `loadSession`, il bridge restituisce un errore chiaro
invece di ignorarli silenziosamente.

Se vuoi che le sessioni basate su ACPX vedano gli strumenti Plugin di OpenClaw o gli strumenti
integrati selezionati come `cron`, abilita invece i bridge ACPX MCP lato gateway
anziché provare a passare `mcpServers` per sessione. Vedi
[Agenti ACP](/it/tools/acp-agents-setup#plugin-tools-mcp-bridge) e
[bridge MCP degli strumenti OpenClaw](/it/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Uso da `acpx` (Codex, Claude, altri client ACP)

Se vuoi che un agente di codifica come Codex o Claude Code comunichi con il tuo
bot OpenClaw tramite ACP, usa `acpx` con il suo target `openclaw` integrato.

Flusso tipico:

1. Esegui il Gateway e assicurati che il bridge ACP possa raggiungerlo.
2. Punta `acpx openclaw` a `openclaw acp`.
3. Scegli come target la chiave di sessione OpenClaw che vuoi far usare all'agente di codifica.

Esempi:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Se vuoi che `acpx openclaw` punti ogni volta a un Gateway e a una chiave di sessione specifici,
sovrascrivi il comando dell'agente `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Per un checkout OpenClaw locale del repository, usa l'entrypoint CLI diretto invece del
dev runner, così lo stream ACP resta pulito. Per esempio:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Questo è il modo più semplice per permettere a Codex, Claude Code o a un altro client
compatibile con ACP di recuperare informazioni contestuali da un agente OpenClaw senza fare scraping di un terminale.

## Configurazione dell'editor Zed

Aggiungi un agente ACP personalizzato in `~/.config/zed/settings.json` (oppure usa l'interfaccia Impostazioni di Zed):

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

In Zed, apri il pannello Agente e seleziona "OpenClaw ACP" per avviare un thread.

## Mappatura delle sessioni

Per impostazione predefinita, le sessioni ACP ricevono una chiave di sessione Gateway isolata con prefisso `acp:`.
Per riutilizzare una sessione nota, passa una chiave o un'etichetta di sessione:

- `--session <key>`: usa una chiave di sessione Gateway specifica.
- `--session-label <label>`: risolvi una sessione esistente tramite etichetta.
- `--reset-session`: genera un nuovo ID sessione per quella chiave (stessa chiave, nuova trascrizione).

Se il tuo client ACP supporta i metadati, puoi sovrascriverli per sessione:

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

- `--url <url>`: URL WebSocket del Gateway (il valore predefinito è gateway.remote.url quando configurato).
- `--token <token>`: token di autenticazione del Gateway.
- `--token-file <path>`: legge il token di autenticazione del Gateway da file.
- `--password <password>`: password di autenticazione del Gateway.
- `--password-file <path>`: legge la password di autenticazione del Gateway da file.
- `--session <key>`: chiave di sessione predefinita.
- `--session-label <label>`: etichetta di sessione predefinita da risolvere.
- `--require-existing`: fallisce se la chiave/etichetta di sessione non esiste.
- `--reset-session`: reimposta la chiave di sessione prima del primo uso.
- `--no-prefix-cwd`: non anteporre alle richieste la directory di lavoro.
- `--provenance <off|meta|meta+receipt>`: include metadati o ricevute di provenienza ACP.
- `--verbose, -v`: logging dettagliato su stderr.

Nota di sicurezza:

- `--token` e `--password` possono essere visibili negli elenchi dei processi locali su alcuni sistemi.
- Preferisci `--token-file`/`--password-file` o variabili d'ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La risoluzione dell'autenticazione Gateway segue il contratto condiviso usato dagli altri client Gateway:
  - modalità locale: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` solo quando `gateway.auth.*` non è impostato (i SecretRefs locali configurati ma non risolti falliscono in modo chiuso)
  - modalità remota: `gateway.remote.*` con fallback env/config secondo le regole di precedenza remota
  - `--url` è sicuro come override e non riutilizza credenziali implicite da config/env; passa `--token`/`--password` espliciti (o varianti su file)
- I processi figli del backend di runtime ACP ricevono `OPENCLAW_SHELL=acp`, utilizzabile per regole shell/profilo specifiche del contesto.
- `openclaw acp client` imposta `OPENCLAW_SHELL=acp-client` sul processo bridge generato.

### Opzioni di `acp client`

- `--cwd <dir>`: directory di lavoro per la sessione ACP.
- `--server <command>`: comando del server ACP (predefinito: `openclaw`).
- `--server-args <args...>`: argomenti extra passati al server ACP.
- `--server-verbose`: abilita il logging dettagliato sul server ACP.
- `--verbose, -v`: logging client dettagliato.

## Correlati

- [Riferimento CLI](/it/cli)
- [Agenti ACP](/it/tools/acp-agents)
