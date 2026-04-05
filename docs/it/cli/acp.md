---
read_when:
    - Configurazione delle integrazioni IDE basate su ACP
    - Debug del routing delle sessioni ACP verso il Gateway
summary: Esegui il bridge ACP per le integrazioni IDE
title: acp
x-i18n:
    generated_at: "2026-04-05T13:47:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2461b181e4a97dd84580581e9436ca1947a224decce8044132dbcf7fb2b7502c
    source_path: cli/acp.md
    workflow: 15
---

# acp

Esegui il bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) che comunica con un Gateway OpenClaw.

Questo comando usa ACP su stdio per gli IDE e inoltra i prompt al Gateway tramite WebSocket. Mantiene le sessioni ACP mappate alle chiavi di sessione del Gateway.

`openclaw acp` è un bridge ACP supportato dal Gateway, non un runtime editor completamente nativo ACP. Si concentra su routing delle sessioni, recapito dei prompt e aggiornamenti di streaming di base.

Se vuoi che un client MCP esterno comunichi direttamente con le conversazioni dei canali OpenClaw invece di ospitare una sessione harness ACP, usa invece [`openclaw mcp serve`](/cli/mcp).

## Cosa non è

Questa pagina viene spesso confusa con le sessioni harness ACP.

`openclaw acp` significa:

- OpenClaw agisce come server ACP
- un IDE o client ACP si connette a OpenClaw
- OpenClaw inoltra quel lavoro in una sessione Gateway

Questo è diverso da [ACP Agents](/tools/acp-agents), dove OpenClaw esegue un harness esterno come Codex o Claude Code tramite `acpx`.

Regola rapida:

- se l'editor/client vuole comunicare via ACP con OpenClaw: usa `openclaw acp`
- se OpenClaw deve avviare Codex/Claude/Gemini come harness ACP: usa `/acp spawn` e [ACP Agents](/tools/acp-agents)

## Matrice di compatibilità

| Area ACP                                                              | Stato       | Note                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementato | Flusso core del bridge su stdio verso chat/send + abort del Gateway.                                                                                                                                                                                  |
| `listSessions`, comandi slash                                         | Implementato | L'elenco sessioni funziona rispetto allo stato delle sessioni del Gateway; i comandi sono pubblicizzati tramite `available_commands_update`.                                                                                                          |
| `loadSession`                                                         | Parziale    | Ricollega la sessione ACP a una chiave di sessione Gateway e riproduce la cronologia di testo utente/assistente memorizzata. La cronologia di strumenti/sistema non viene ancora ricostruita.                                                       |
| Contenuto dei prompt (`text`, `resource` incorporata, immagini)       | Parziale    | Testo/risorse vengono appiattiti nell'input chat; le immagini diventano allegati del Gateway.                                                                                                                                                        |
| Modalità sessione                                                     | Parziale    | `session/set_mode` è supportato e il bridge espone controlli iniziali della sessione supportati dal Gateway per livello di pensiero, verbosità degli strumenti, ragionamento, dettaglio di utilizzo e azioni elevate. Superfici di modalità/configurazione ACP native più ampie sono ancora fuori ambito. |
| Informazioni sulla sessione e aggiornamenti di utilizzo               | Parziale    | Il bridge emette notifiche `session_info_update` e `usage_update` best-effort da snapshot in cache della sessione Gateway. L'utilizzo è approssimativo e viene inviato solo quando i totali token del Gateway sono contrassegnati come aggiornati. |
| Streaming degli strumenti                                             | Parziale    | Gli eventi `tool_call` / `tool_call_update` includono I/O grezzo, contenuto testuale e percorsi file best-effort quando argomenti/risultati degli strumenti del Gateway li espongono. Terminali incorporati e output nativi diff più ricchi non sono ancora esposti. |
| Server MCP per sessione (`mcpServers`)                                | Non supportato | La modalità bridge rifiuta le richieste di server MCP per sessione. Configura MCP sul gateway o sull'agente OpenClaw.                                                                                                                                |
| Metodi filesystem del client (`fs/read_text_file`, `fs/write_text_file`) | Non supportato | Il bridge non chiama i metodi filesystem del client ACP.                                                                                                                                                                                              |
| Metodi terminale del client (`terminal/*`)                            | Non supportato | Il bridge non crea terminali del client ACP né trasmette ID terminale tramite le chiamate degli strumenti.                                                                                                                                           |
| Piani di sessione / streaming del pensiero                            | Non supportato | Attualmente il bridge emette testo di output e stato degli strumenti, non aggiornamenti di piani o pensieri ACP.                                                                                                                                     |

## Limitazioni note

- `loadSession` riproduce la cronologia di testo utente e assistente memorizzata, ma non ricostruisce chiamate storiche degli strumenti, avvisi di sistema o tipi di eventi ACP nativi più ricchi.
- Se più client ACP condividono la stessa chiave di sessione Gateway, il routing di eventi e annullamenti è best-effort anziché rigorosamente isolato per client. Preferisci le sessioni isolate predefinite `acp:<uuid>` quando ti servono turni locali puliti nell'editor.
- Gli stati di arresto del Gateway vengono tradotti in motivi di arresto ACP, ma questa mappatura è meno espressiva di un runtime completamente nativo ACP.
- I controlli iniziali della sessione espongono attualmente un sottoinsieme mirato delle impostazioni del Gateway: livello di pensiero, verbosità degli strumenti, ragionamento, dettaglio di utilizzo e azioni elevate. La selezione del modello e i controlli exec-host non sono ancora esposti come opzioni di configurazione ACP.
- `session_info_update` e `usage_update` derivano da snapshot della sessione Gateway, non da contabilità runtime ACP nativa in tempo reale. L'utilizzo è approssimativo, non include dati sui costi e viene emesso solo quando il Gateway contrassegna come aggiornati i dati totali dei token.
- I dati di follow-along degli strumenti sono best-effort. Il bridge può mostrare i percorsi dei file che compaiono in argomenti/risultati di strumenti noti, ma non emette ancora terminali ACP o diff di file strutturati.

## Utilizzo

```bash
openclaw acp

# Gateway remoto
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token da file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Collegati a una chiave di sessione esistente
openclaw acp --session agent:main:main

# Collegati tramite etichetta (deve già esistere)
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

# Sovrascrivi il comando del server (predefinito: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modello di autorizzazione (modalità debug client):

- L'approvazione automatica è basata su allowlist e si applica solo a ID di strumenti core affidabili.
- L'approvazione automatica di `read` è limitata alla directory di lavoro corrente (`--cwd` quando impostato).
- ACP approva automaticamente solo classi ristrette in sola lettura: chiamate `read` limitate sotto la cwd attiva più strumenti di ricerca in sola lettura (`search`, `web_search`, `memory_search`). Strumenti sconosciuti/non core, letture fuori ambito, strumenti capaci di esecuzione, strumenti control-plane, strumenti che modificano dati e flussi interattivi richiedono sempre un'approvazione esplicita del prompt.
- `toolCall.kind` fornito dal server viene trattato come metadato non affidabile (non come fonte di autorizzazione).
- Questa policy del bridge ACP è separata dalle autorizzazioni dell'harness ACPX. Se esegui OpenClaw tramite il backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` è l'opzione break-glass “yolo” per quella sessione harness.

## Come usarlo

Usa ACP quando un IDE (o un altro client) parla Agent Client Protocol e vuoi che guidi una sessione Gateway OpenClaw.

1. Assicurati che il Gateway sia in esecuzione (locale o remoto).
2. Configura il target del Gateway (config o flag).
3. Configura il tuo IDE per eseguire `openclaw acp` su stdio.

Configurazione di esempio (persistente):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Esecuzione diretta di esempio (senza scrivere nella config):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferito per la sicurezza del processo locale
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selezione degli agenti

ACP non seleziona direttamente gli agenti. Esegue il routing tramite la chiave di sessione del Gateway.

Usa chiavi di sessione con ambito agente per indirizzare un agente specifico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Ogni sessione ACP è mappata a una singola chiave di sessione Gateway. Un agente può avere molte sessioni; ACP usa per impostazione predefinita una sessione isolata `acp:<uuid>` a meno che tu non sovrascriva la chiave o l'etichetta.

Gli `mcpServers` per sessione non sono supportati in modalità bridge. Se un client ACP li invia durante `newSession` o `loadSession`, il bridge restituisce un errore chiaro invece di ignorarli silenziosamente.

Se vuoi che le sessioni supportate da ACPX vedano gli strumenti plugin OpenClaw, abilita invece il bridge plugin ACPX lato gateway invece di provare a passare `mcpServers` per sessione. Vedi [ACP Agents](/tools/acp-agents#plugin-tools-mcp-bridge).

## Uso da `acpx` (Codex, Claude, altri client ACP)

Se vuoi che un agente di coding come Codex o Claude Code comunichi con il tuo bot OpenClaw tramite ACP, usa `acpx` con il suo target `openclaw` integrato.

Flusso tipico:

1. Esegui il Gateway e assicurati che il bridge ACP possa raggiungerlo.
2. Punta `acpx openclaw` a `openclaw acp`.
3. Indirizza la chiave di sessione OpenClaw che vuoi usare per l'agente di coding.

Esempi:

```bash
# Richiesta one-shot nella tua sessione ACP OpenClaw predefinita
acpx openclaw exec "Riassumi lo stato della sessione ACP OpenClaw attiva."

# Sessione nominata persistente per turni successivi
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Chiedi al mio agente di lavoro OpenClaw il contesto recente rilevante per questo repository."
```

Se vuoi che `acpx openclaw` punti ogni volta a un Gateway e a una chiave di sessione specifici, sovrascrivi il comando dell'agente `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Per un checkout locale di OpenClaw, usa il punto di ingresso CLI diretto invece del dev runner, così il flusso ACP resta pulito. Per esempio:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Questo è il modo più semplice per consentire a Codex, Claude Code o a un altro client compatibile ACP di recuperare informazioni contestuali da un agente OpenClaw senza fare scraping di un terminale.

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

In Zed, apri il pannello Agent e seleziona “OpenClaw ACP” per avviare un thread.

## Mappatura delle sessioni

Per impostazione predefinita, le sessioni ACP ottengono una chiave di sessione Gateway isolata con prefisso `acp:`.
Per riutilizzare una sessione nota, passa una chiave di sessione o un'etichetta:

- `--session <key>`: usa una chiave di sessione Gateway specifica.
- `--session-label <label>`: risolve una sessione esistente tramite etichetta.
- `--reset-session`: genera un nuovo id sessione per quella chiave (stessa chiave, nuova trascrizione).

Se il tuo client ACP supporta i metadati, puoi sovrascrivere per sessione:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Scopri di più sulle chiavi di sessione in [/concepts/session](/concepts/session).

## Opzioni

- `--url <url>`: URL WebSocket del Gateway (usa `gateway.remote.url` come predefinito quando configurato).
- `--token <token>`: token di autenticazione del Gateway.
- `--token-file <path>`: legge il token di autenticazione del Gateway da file.
- `--password <password>`: password di autenticazione del Gateway.
- `--password-file <path>`: legge la password di autenticazione del Gateway da file.
- `--session <key>`: chiave di sessione predefinita.
- `--session-label <label>`: etichetta di sessione predefinita da risolvere.
- `--require-existing`: fallisce se la chiave/etichetta di sessione non esiste.
- `--reset-session`: reimposta la chiave di sessione prima del primo utilizzo.
- `--no-prefix-cwd`: non anteporre ai prompt la directory di lavoro.
- `--provenance <off|meta|meta+receipt>`: include metadati di provenienza ACP o ricevute.
- `--verbose, -v`: logging dettagliato su stderr.

Nota di sicurezza:

- `--token` e `--password` possono essere visibili negli elenchi dei processi locali su alcuni sistemi.
- Preferisci `--token-file`/`--password-file` o le variabili d'ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La risoluzione dell'autenticazione del Gateway segue il contratto condiviso usato da altri client Gateway:
  - modalità locale: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` solo quando `gateway.auth.*` non è impostato (gli SecretRef locali configurati ma non risolti falliscono in modo chiuso)
  - modalità remota: `gateway.remote.*` con fallback env/config secondo le regole di precedenza della modalità remota
  - `--url` è sicuro per la sovrascrittura e non riutilizza credenziali implicite config/env; passa `--token`/`--password` espliciti (o le varianti da file)
- I processi figli del backend runtime ACP ricevono `OPENCLAW_SHELL=acp`, che può essere usato per regole shell/profile specifiche del contesto.
- `openclaw acp client` imposta `OPENCLAW_SHELL=acp-client` sul processo bridge avviato.

### Opzioni di `acp client`

- `--cwd <dir>`: directory di lavoro per la sessione ACP.
- `--server <command>`: comando del server ACP (predefinito: `openclaw`).
- `--server-args <args...>`: argomenti extra passati al server ACP.
- `--server-verbose`: abilita il logging dettagliato sul server ACP.
- `--verbose, -v`: logging dettagliato del client.
