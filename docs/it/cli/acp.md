---
read_when:
    - Configurazione delle integrazioni IDE basate su ACP
    - Debug del routing delle sessioni ACP verso il Gateway
summary: Esegui il bridge ACP per le integrazioni IDE
title: ACP
x-i18n:
    generated_at: "2026-05-06T08:42:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

Esegui il bridge [Protocollo Client Agente (ACP)](https://agentclientprotocol.com/) che comunica con un Gateway OpenClaw.

Questo comando parla ACP su stdio per gli IDE e inoltra i prompt al Gateway
su WebSocket. Mantiene le sessioni ACP mappate alle chiavi di sessione del Gateway.

`openclaw acp` è un bridge ACP supportato da Gateway, non un runtime editor
completamente nativo ACP. Si concentra su instradamento delle sessioni, consegna
dei prompt e aggiornamenti di streaming di base.

Se vuoi che un client MCP esterno comunichi direttamente con le conversazioni
dei canali OpenClaw invece di ospitare una sessione harness ACP, usa invece
[`openclaw mcp serve`](/it/cli/mcp).

## Cosa non è

Questa pagina viene spesso confusa con le sessioni harness ACP.

`openclaw acp` significa:

- OpenClaw agisce come server ACP
- un IDE o un client ACP si connette a OpenClaw
- OpenClaw inoltra quel lavoro in una sessione Gateway

Questo è diverso dagli [Agenti ACP](/it/tools/acp-agents), dove OpenClaw esegue un
harness esterno come Codex o Claude Code tramite `acpx`.

Regola rapida:

- editor/client vuole parlare ACP con OpenClaw: usa `openclaw acp`
- OpenClaw deve avviare Codex/Claude/Gemini come harness ACP: usa `/acp spawn` e [Agenti ACP](/it/tools/acp-agents)

## Matrice di compatibilità

| Area ACP                                                              | Stato       | Note                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementato | Flusso bridge principale su stdio verso chat/send del Gateway + interruzione.                                                                                                                                                                   |
| `listSessions`, comandi slash                                         | Implementato | L'elenco delle sessioni funziona rispetto allo stato delle sessioni del Gateway; i comandi sono pubblicizzati tramite `available_commands_update`.                                                                                               |
| `loadSession`                                                         | Parziale    | Riassocia la sessione ACP a una chiave di sessione Gateway e riproduce la cronologia testuale utente/assistente archiviata. La cronologia di strumenti/sistema non viene ancora ricostruita.                                                    |
| Contenuto del prompt (`text`, `resource` incorporata, immagini)       | Parziale    | Testo/risorse vengono appiattiti nell'input chat; le immagini diventano allegati del Gateway.                                                                                                                                                    |
| Modalità di sessione                                                  | Parziale    | `session/set_mode` è supportato e il bridge espone controlli iniziali di sessione supportati da Gateway per livello di pensiero, verbosità degli strumenti, ragionamento, dettaglio d'uso e azioni elevate. Superfici più ampie di modalità/configurazione native ACP sono ancora fuori ambito. |
| Info sessione e aggiornamenti d'uso                                   | Parziale    | Il bridge emette notifiche `session_info_update` e `usage_update` best-effort da snapshot di sessione Gateway memorizzati nella cache. L'uso è approssimativo e viene inviato solo quando i totali token del Gateway sono contrassegnati come aggiornati. |
| Streaming degli strumenti                                             | Parziale    | Gli eventi `tool_call` / `tool_call_update` includono I/O grezzo, contenuto testuale e posizioni file best-effort quando argomenti/risultati degli strumenti Gateway le espongono. Terminali incorporati e output più ricco nativo diff non sono ancora esposti. |
| Server MCP per sessione (`mcpServers`)                                | Non supportato | La modalità bridge rifiuta richieste di server MCP per sessione. Configura MCP sul gateway o sull'agente OpenClaw invece.                                                                                                                       |
| Metodi filesystem del client (`fs/read_text_file`, `fs/write_text_file`) | Non supportato | Il bridge non chiama i metodi filesystem del client ACP.                                                                                                                                                                                        |
| Metodi terminale del client (`terminal/*`)                            | Non supportato | Il bridge non crea terminali client ACP né trasmette id terminale tramite chiamate agli strumenti.                                                                                                                                               |
| Piani di sessione / streaming del pensiero                            | Non supportato | Il bridge attualmente emette testo di output e stato degli strumenti, non aggiornamenti di piano o pensiero ACP.                                                                                                                                 |

## Limitazioni note

- `loadSession` riproduce la cronologia testuale utente e assistente archiviata, ma non
  ricostruisce chiamate storiche agli strumenti, avvisi di sistema o tipi di evento
  più ricchi nativi ACP.
- Se più client ACP condividono la stessa chiave di sessione Gateway, l'instradamento
  di eventi e annullamenti è best-effort anziché strettamente isolato per client. Preferisci le
  sessioni isolate predefinite `acp:<uuid>` quando hai bisogno di turni
  puliti locali all'editor.
- Gli stati di stop del Gateway vengono tradotti in motivi di stop ACP, ma tale mappatura è
  meno espressiva di un runtime completamente nativo ACP.
- I controlli iniziali di sessione attualmente espongono un sottoinsieme mirato di opzioni Gateway:
  livello di pensiero, verbosità degli strumenti, ragionamento, dettaglio d'uso e
  azioni elevate. La selezione del modello e i controlli exec-host non sono ancora esposti come opzioni di
  configurazione ACP.
- `session_info_update` e `usage_update` derivano da snapshot di sessione Gateway,
  non da contabilizzazione live di runtime nativa ACP. L'uso è approssimativo,
  non include dati sui costi e viene emesso solo quando il Gateway contrassegna i dati totali dei token
  come aggiornati.
- I dati di affiancamento degli strumenti sono best-effort. Il bridge può mostrare percorsi file che
  compaiono in argomenti/risultati noti degli strumenti, ma non emette ancora terminali ACP o
  diff file strutturati.

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
- ACP approva automaticamente solo classi readonly ristrette: chiamate `read` con ambito sotto la cwd attiva più strumenti di ricerca readonly (`search`, `web_search`, `memory_search`). Strumenti sconosciuti/non core, letture fuori ambito, strumenti in grado di eseguire comandi, strumenti del control plane, strumenti mutanti e flussi interattivi richiedono sempre l'approvazione esplicita del prompt.
- `toolCall.kind` fornito dal server viene trattato come metadato non attendibile (non come fonte di autorizzazione).
- Questa policy del bridge ACP è separata dalle autorizzazioni dell'harness ACPX. Se esegui OpenClaw tramite il backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` è l'interruttore break-glass "yolo" per quella sessione harness.

## Come usare questo

Usa ACP quando un IDE (o un altro client) parla Agent Client Protocol e vuoi
che guidi una sessione Gateway OpenClaw.

1. Assicurati che il Gateway sia in esecuzione (locale o remoto).
2. Configura la destinazione Gateway (configurazione o flag).
3. Punta il tuo IDE a eseguire `openclaw acp` su stdio.

Esempio di configurazione (persistente):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Esempio di esecuzione diretta (senza scrittura della configurazione):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selezione degli agenti

ACP non sceglie direttamente gli agenti. Instrada in base alla chiave di sessione Gateway.

Usa chiavi di sessione con ambito agente per puntare a un agente specifico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Ogni sessione ACP viene mappata a una singola chiave di sessione Gateway. Un agente può avere molte
sessioni; ACP usa per impostazione predefinita una sessione isolata `acp:<uuid>` a meno che tu non sovrascriva
la chiave o l'etichetta.

I `mcpServers` per sessione non sono supportati in modalità bridge. Se un client ACP
li invia durante `newSession` o `loadSession`, il bridge restituisce un errore
chiaro invece di ignorarli silenziosamente.

Se vuoi che le sessioni basate su ACPX vedano gli strumenti Plugin OpenClaw o strumenti
integrati selezionati come `cron`, abilita i bridge MCP ACPX lato gateway invece
di provare a passare `mcpServers` per sessione. Vedi
[Agenti ACP](/it/tools/acp-agents-setup#plugin-tools-mcp-bridge) e
[bridge MCP strumenti OpenClaw](/it/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Uso da `acpx` (Codex, Claude, altri client ACP)

Se vuoi che un agente di coding come Codex o Claude Code parli con il tuo
bot OpenClaw su ACP, usa `acpx` con la sua destinazione `openclaw` integrata.

Flusso tipico:

1. Esegui il Gateway e assicurati che il bridge ACP possa raggiungerlo.
2. Punta `acpx openclaw` a `openclaw acp`.
3. Indica la chiave di sessione OpenClaw che vuoi far usare all'agente di coding.

Esempi:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Se vuoi che `acpx openclaw` punti a un Gateway e a una chiave di sessione specifici ogni
volta, sovrascrivi il comando dell'agente `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Per un checkout OpenClaw locale al repo, usa l'entrypoint CLI diretto invece del
dev runner in modo che lo stream ACP resti pulito. Per esempio:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Questo è il modo più semplice per permettere a Codex, Claude Code o un altro client compatibile con ACP
di recuperare informazioni contestuali da un agente OpenClaw senza effettuare scraping di un terminale.

## Configurazione editor Zed

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

Per indirizzare un Gateway o un agente specifico:

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

In Zed, apri il pannello Agent e seleziona "OpenClaw ACP" per avviare un thread.

## Mappatura delle sessioni

Per impostazione predefinita, le sessioni ACP ricevono una chiave di sessione Gateway isolata con un prefisso `acp:`.
Per riutilizzare una sessione nota, passa una chiave o un'etichetta di sessione:

- `--session <key>`: usa una chiave di sessione Gateway specifica.
- `--session-label <label>`: risolvi una sessione esistente tramite etichetta.
- `--reset-session`: genera un nuovo ID sessione per quella chiave (stessa chiave, nuova trascrizione).

Se il tuo client ACP supporta i metadati, puoi eseguire l'override per sessione:

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

- `--url <url>`: URL WebSocket del Gateway (impostazione predefinita: gateway.remote.url quando configurato).
- `--token <token>`: token di autenticazione del Gateway.
- `--token-file <path>`: leggi il token di autenticazione del Gateway da file.
- `--password <password>`: password di autenticazione del Gateway.
- `--password-file <path>`: leggi la password di autenticazione del Gateway da file.
- `--session <key>`: chiave di sessione predefinita.
- `--session-label <label>`: etichetta di sessione predefinita da risolvere.
- `--require-existing`: non riuscire se la chiave/etichetta di sessione non esiste.
- `--reset-session`: reimposta la chiave di sessione prima del primo utilizzo.
- `--no-prefix-cwd`: non anteporre la directory di lavoro ai prompt.
- `--provenance <off|meta|meta+receipt>`: includi metadati o ricevute di provenienza ACP.
- `--verbose, -v`: registrazione dettagliata su stderr.

Nota di sicurezza:

- `--token` e `--password` possono essere visibili negli elenchi dei processi locali su alcuni sistemi.
- Preferisci `--token-file`/`--password-file` o le variabili d'ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La risoluzione dell'autenticazione del Gateway segue il contratto condiviso usato da altri client Gateway:
  - modalità locale: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` solo quando `gateway.auth.*` non è impostato (i SecretRef locali configurati ma non risolti falliscono in modo sicuro)
  - modalità remota: `gateway.remote.*` con fallback env/config secondo le regole di precedenza remote
  - `--url` è sicuro come override e non riutilizza credenziali implicite di config/env; passa `--token`/`--password` espliciti (o le varianti file)
- I processi figlio del backend runtime ACP ricevono `OPENCLAW_SHELL=acp`, che può essere usato per regole di shell/profilo specifiche del contesto.
- `openclaw acp client` imposta `OPENCLAW_SHELL=acp-client` sul processo bridge generato.

### Opzioni di `acp client`

- `--cwd <dir>`: directory di lavoro per la sessione ACP.
- `--server <command>`: comando server ACP (predefinito: `openclaw`).
- `--server-args <args...>`: argomenti aggiuntivi passati al server ACP.
- `--server-verbose`: abilita la registrazione dettagliata sul server ACP.
- `--verbose, -v`: registrazione dettagliata del client.

## Correlati

- [Riferimento CLI](/it/cli)
- [Agenti ACP](/it/tools/acp-agents)
