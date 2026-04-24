---
read_when:
    - Configurare integrazioni IDE basate su ACP
    - Eseguire il debug dell’instradamento della sessione ACP verso il Gateway
summary: Eseguire il bridge ACP per le integrazioni IDE
title: ACP
x-i18n:
    generated_at: "2026-04-24T08:32:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

Esegui il bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) che comunica con un Gateway OpenClaw.

Questo comando usa ACP su stdio per gli IDE e inoltra i prompt al Gateway
tramite WebSocket. Mantiene le sessioni ACP mappate alle chiavi di sessione del Gateway.

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
- un IDE o client ACP si connette a OpenClaw
- OpenClaw inoltra quel lavoro in una sessione Gateway

Questo è diverso da [Agenti ACP](/it/tools/acp-agents), dove OpenClaw esegue un
harness esterno come Codex o Claude Code tramite `acpx`.

Regola rapida:

- l’editor/client vuole comunicare via ACP con OpenClaw: usa `openclaw acp`
- OpenClaw deve avviare Codex/Claude/Gemini come harness ACP: usa `/acp spawn` e [Agenti ACP](/it/tools/acp-agents)

## Matrice di compatibilità

| Area ACP                                                              | Stato       | Note                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementato | Flusso bridge principale su stdio verso chat/send del Gateway + interruzione.                                                                                                                                                                      |
| `listSessions`, comandi slash                                         | Implementato | L’elenco sessioni funziona sullo stato delle sessioni del Gateway; i comandi sono annunciati tramite `available_commands_update`.                                                                                                                  |
| `loadSession`                                                         | Parziale    | Ricollega la sessione ACP a una chiave di sessione Gateway e riproduce la cronologia di testo utente/assistente memorizzata. La cronologia di strumenti/sistema non viene ancora ricostruita.                                                    |
| Contenuto del prompt (`text`, `resource` incorporata, immagini)       | Parziale    | Testo/risorse vengono appiattiti nell’input chat; le immagini diventano allegati del Gateway.                                                                                                                                                      |
| Modalità di sessione                                                  | Parziale    | `session/set_mode` è supportato e il bridge espone i controlli iniziali delle sessioni supportate da Gateway per livello di pensiero, verbosità degli strumenti, ragionamento, dettaglio d’uso e azioni elevate. Superfici più ampie di modalità/configurazione native ACP restano fuori ambito. |
| Informazioni di sessione e aggiornamenti d’uso                        | Parziale    | Il bridge emette notifiche `session_info_update` e `usage_update` best-effort da snapshot in cache delle sessioni Gateway. L’uso è approssimativo e viene inviato solo quando i totali token del Gateway sono contrassegnati come aggiornati.   |
| Streaming degli strumenti                                             | Parziale    | Gli eventi `tool_call` / `tool_call_update` includono I/O grezzo, contenuto testuale e posizioni file best-effort quando argomenti/risultati degli strumenti Gateway li espongono. Terminali incorporati e output nativo diff più ricco non sono ancora esposti. |
| Server MCP per sessione (`mcpServers`)                                | Non supportato | La modalità bridge rifiuta le richieste di server MCP per sessione. Configura MCP invece sul gateway o sull’agente OpenClaw.                                                                                                                      |
| Metodi filesystem del client (`fs/read_text_file`, `fs/write_text_file`) | Non supportato | Il bridge non chiama i metodi filesystem del client ACP.                                                                                                                                                                                            |
| Metodi terminale del client (`terminal/*`)                            | Non supportato | Il bridge non crea terminali del client ACP né trasmette ID terminale tramite chiamate agli strumenti.                                                                                                                                             |
| Piani di sessione / streaming dei pensieri                            | Non supportato | Il bridge al momento emette testo di output e stato degli strumenti, non aggiornamenti di piano o pensiero ACP.                                                                                                                                    |

## Limitazioni note

- `loadSession` riproduce la cronologia di testo memorizzata di utente e assistente, ma non
  ricostruisce chiamate storiche agli strumenti, avvisi di sistema o tipi di
  evento nativi ACP più ricchi.
- Se più client ACP condividono la stessa chiave di sessione Gateway, l’instradamento
  di eventi e annullamenti è best-effort invece che strettamente isolato per client. Preferisci le
  sessioni isolate predefinite `acp:<uuid>` quando hai bisogno di turni
  puliti locali all’editor.
- Gli stati di arresto del Gateway vengono tradotti in motivi di arresto ACP, ma questa mappatura
  è meno espressiva di un runtime completamente nativo ACP.
- I controlli iniziali di sessione attualmente espongono un sottoinsieme mirato dei parametri Gateway:
  livello di pensiero, verbosità degli strumenti, ragionamento, dettaglio d’uso e azioni elevate.
  La selezione del modello e i controlli dell’host di esecuzione non sono ancora esposti come opzioni di configurazione ACP.
- `session_info_update` e `usage_update` derivano da snapshot delle sessioni Gateway,
  non da una contabilità runtime nativa ACP dal vivo. L’uso è approssimativo,
  non include dati di costo ed è emesso solo quando il Gateway contrassegna come aggiornati
  i dati totali dei token.
- I dati di osservazione degli strumenti sono best-effort. Il bridge può esporre percorsi file che
  compaiono in argomenti/risultati di strumenti noti, ma non emette ancora terminali ACP o
  diff di file strutturati.

## Utilizzo

```bash
openclaw acp

# Gateway remoto
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token da file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Collegarsi a una chiave di sessione esistente
openclaw acp --session agent:main:main

# Collegarsi tramite etichetta (deve già esistere)
openclaw acp --session-label "support inbox"

# Reimpostare la chiave di sessione prima del primo prompt
openclaw acp --session agent:main:main --reset-session
```

## Client ACP (debug)

Usa il client ACP integrato per verificare il bridge senza un IDE.
Avvia il bridge ACP e ti permette di digitare prompt in modo interattivo.

```bash
openclaw acp client

# Punta il bridge avviato a un Gateway remoto
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Sostituisci il comando server (predefinito: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modello di permessi (modalità debug client):

- L’auto-approvazione si basa su allowlist e si applica solo a ID di strumenti core attendibili.
- L’auto-approvazione `read` è limitata alla directory di lavoro corrente (`--cwd` quando impostata).
- ACP auto-approva solo classi ristrette in sola lettura: chiamate `read` limitate sotto la cwd attiva più strumenti di ricerca in sola lettura (`search`, `web_search`, `memory_search`). Strumenti sconosciuti/non core, letture fuori ambito, strumenti capaci di esecuzione, strumenti del control plane, strumenti mutanti e flussi interattivi richiedono sempre approvazione esplicita del prompt.
- Il `toolCall.kind` fornito dal server viene trattato come metadato non attendibile (non come fonte di autorizzazione).
- Questa policy del bridge ACP è separata dai permessi harness ACPX. Se esegui OpenClaw tramite backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` è l’interruttore di emergenza “yolo” per quella sessione harness.

## Come usarlo

Usa ACP quando un IDE (o altro client) parla Agent Client Protocol e vuoi
che controlli una sessione Gateway OpenClaw.

1. Assicurati che il Gateway sia in esecuzione (locale o remoto).
2. Configura la destinazione del Gateway (configurazione o flag).
3. Imposta il tuo IDE per eseguire `openclaw acp` su stdio.

Esempio di configurazione (persistente):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Esempio di esecuzione diretta (senza scrittura della configurazione):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferito per la sicurezza dei processi locali
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selezionare gli agenti

ACP non sceglie direttamente gli agenti. Instrada in base alla chiave di sessione del Gateway.

Usa chiavi di sessione con ambito agente per indirizzare un agente specifico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Ogni sessione ACP è mappata a una singola chiave di sessione Gateway. Un agente può avere molte
sessioni; ACP usa per impostazione predefinita una sessione isolata `acp:<uuid>` a meno che tu non
sostituisca la chiave o l’etichetta.

I `mcpServers` per sessione non sono supportati in modalità bridge. Se un client ACP
li invia durante `newSession` o `loadSession`, il bridge restituisce un errore
chiaro invece di ignorarli silenziosamente.

Se vuoi che le sessioni supportate da ACPX vedano gli strumenti Plugin di OpenClaw o strumenti
integrati selezionati come `cron`, abilita invece i bridge MCP ACPX lato gateway
invece di provare a passare `mcpServers` per sessione. Vedi
[Agenti ACP](/it/tools/acp-agents-setup#plugin-tools-mcp-bridge) e
[Bridge MCP degli strumenti OpenClaw](/it/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Uso da `acpx` (Codex, Claude, altri client ACP)

Se vuoi che un agente di coding come Codex o Claude Code comunichi con il tuo
bot OpenClaw tramite ACP, usa `acpx` con la sua destinazione integrata `openclaw`.

Flusso tipico:

1. Avvia il Gateway e assicurati che il bridge ACP possa raggiungerlo.
2. Punta `acpx openclaw` a `openclaw acp`.
3. Indica la chiave di sessione OpenClaw che vuoi usare all’agente di coding.

Esempi:

```bash
# Richiesta singola nella tua sessione ACP OpenClaw predefinita
acpx openclaw exec "Riassumi lo stato attivo della sessione OpenClaw."

# Sessione persistente con nome per turni successivi
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Chiedi al mio agente di lavoro OpenClaw il contesto recente rilevante per questo repository."
```

Se vuoi che `acpx openclaw` punti ogni volta a un Gateway e a una chiave di sessione specifici,
sostituisci il comando dell’agente `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Per un checkout locale di OpenClaw, usa il punto di ingresso diretto della CLI invece del
dev runner così il flusso ACP resta pulito. Per esempio:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Questo è il modo più semplice per permettere a Codex, Claude Code o a un altro client compatibile ACP
di ottenere informazioni contestuali da un agente OpenClaw senza fare scraping di un terminale.

## Configurazione dell’editor Zed

Aggiungi un agente ACP personalizzato in `~/.config/zed/settings.json` (oppure usa l’interfaccia Impostazioni di Zed):

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
Per riutilizzare una sessione nota, passa una chiave di sessione o un’etichetta:

- `--session <key>`: usa una chiave di sessione Gateway specifica.
- `--session-label <label>`: risolve una sessione esistente tramite etichetta.
- `--reset-session`: genera un nuovo ID sessione per quella chiave (stessa chiave, nuova trascrizione).

Se il tuo client ACP supporta i metadati, puoi eseguire override per sessione:

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

- `--url <url>`: URL WebSocket del Gateway (usa come predefinito `gateway.remote.url` quando configurato).
- `--token <token>`: token di autenticazione del Gateway.
- `--token-file <path>`: legge il token di autenticazione del Gateway da file.
- `--password <password>`: password di autenticazione del Gateway.
- `--password-file <path>`: legge la password di autenticazione del Gateway da file.
- `--session <key>`: chiave di sessione predefinita.
- `--session-label <label>`: etichetta di sessione predefinita da risolvere.
- `--require-existing`: fallisce se la chiave/etichetta di sessione non esiste.
- `--reset-session`: reimposta la chiave di sessione prima del primo utilizzo.
- `--no-prefix-cwd`: non anteporre ai prompt la directory di lavoro.
- `--provenance <off|meta|meta+receipt>`: include metadati o ricevute di provenienza ACP.
- `--verbose, -v`: logging verboso su stderr.

Nota sulla sicurezza:

- `--token` e `--password` possono essere visibili negli elenchi dei processi locali su alcuni sistemi.
- Preferisci `--token-file`/`--password-file` oppure le variabili d’ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La risoluzione dell’autenticazione del Gateway segue il contratto condiviso usato dagli altri client Gateway:
  - modalità locale: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback a `gateway.remote.*` solo quando `gateway.auth.*` non è impostato (SecretRef locali configurati ma non risolti falliscono in modalità fail-closed)
  - modalità remota: `gateway.remote.*` con fallback env/config secondo le regole di precedenza remota
  - `--url` è sicuro per gli override e non riusa credenziali implicite da config/env; passa `--token`/`--password` espliciti (o le varianti da file)
- I processi figli del backend runtime ACP ricevono `OPENCLAW_SHELL=acp`, che può essere usato per regole di shell/profile specifiche del contesto.
- `openclaw acp client` imposta `OPENCLAW_SHELL=acp-client` sul processo bridge avviato.

### Opzioni di `acp client`

- `--cwd <dir>`: directory di lavoro per la sessione ACP.
- `--server <command>`: comando del server ACP (predefinito: `openclaw`).
- `--server-args <args...>`: argomenti aggiuntivi passati al server ACP.
- `--server-verbose`: abilita il logging verboso sul server ACP.
- `--verbose, -v`: logging verboso del client.

## Correlati

- [Riferimento CLI](/it/cli)
- [Agenti ACP](/it/tools/acp-agents)
