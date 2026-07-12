---
read_when:
    - Configurazione delle integrazioni IDE basate su ACP
    - Debug del routing delle sessioni ACP verso il Gateway
summary: Esegui il bridge ACP per le integrazioni con gli IDE
title: ACP
x-i18n:
    generated_at: "2026-07-12T06:52:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Esegui il bridge [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) che comunica con un Gateway OpenClaw.

`openclaw acp` usa ACP tramite stdio per gli IDE e inoltra i prompt al Gateway tramite WebSocket, mantenendo le sessioni ACP associate alle chiavi di sessione del Gateway. È un bridge ACP basato sul Gateway, non un runtime completo per editor nativo ACP: si concentra sull'instradamento delle sessioni, sulla consegna dei prompt e sugli aggiornamenti in streaming.

Se vuoi che un client MCP esterno comunichi direttamente con le conversazioni dei canali OpenClaw anziché ospitare una sessione dell'harness ACP, usa invece [`openclaw mcp serve`](/it/cli/mcp).

## Cosa non è

`openclaw acp` significa che OpenClaw opera come server ACP: un IDE o un client ACP si connette a OpenClaw e OpenClaw inoltra il lavoro a una sessione del Gateway.

Questo è diverso dagli [agenti ACP](/it/tools/acp-agents), in cui OpenClaw esegue un harness esterno come Codex o Claude Code tramite `acpx`.

Regola rapida:

- se l'editor/client deve comunicare tramite ACP con OpenClaw: usa `openclaw acp`
- se OpenClaw deve avviare Codex/Claude/Gemini come harness ACP: usa `/acp spawn` e [agenti ACP](/it/tools/acp-agents)

## Matrice di compatibilità

| Area ACP                                                              | Stato           | Note                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementato    | Flusso principale del bridge da stdio a chat/invio + interruzione del Gateway.                                                                                                                                                                                                              |
| `listSessions`, comandi slash                                         | Implementato    | L'elenco delle sessioni usa lo stato delle sessioni del Gateway con paginazione limitata basata su cursore e filtro `cwd` quando le righe delle sessioni del Gateway contengono metadati dell'area di lavoro; i comandi vengono pubblicizzati tramite `available_commands_update`.             |
| Metadati di derivazione delle sessioni                                | Implementato    | Gli elenchi e le istantanee informative delle sessioni includono in `_meta` le relazioni padre-figlio di OpenClaw, consentendo ai client ACP di visualizzare i grafi dei sottoagenti senza canali laterali privati del Gateway.                                                               |
| `resumeSession`, `closeSession`                                       | Implementato    | La ripresa riassocia una sessione ACP a una sessione del Gateway esistente senza riprodurne la cronologia. La chiusura annulla il lavoro attivo del bridge, risolve i prompt in sospeso come annullati e rilascia lo stato della sessione del bridge.                                          |
| `loadSession`                                                         | Parziale        | Riassocia la sessione ACP a una chiave di sessione del Gateway e riproduce la cronologia del registro eventi ACP per le sessioni create dal bridge. Le sessioni precedenti o prive di registro usano come ripiego il testo archiviato dell'utente e dell'assistente.                           |
| Contenuto del prompt (`text`, `resource` incorporata, immagini)       | Parziale        | Testo e risorse vengono appiattiti nell'input della chat; le immagini diventano allegati del Gateway.                                                                                                                                                                                       |
| Modalità di sessione                                                  | Parziale        | `session/set_mode` è supportato; il bridge espone controlli di sessione basati sul Gateway per il livello di pensiero, la verbosità degli strumenti, il ragionamento, i dettagli di utilizzo e le azioni con privilegi elevati. Le superfici più ampie di modalità/configurazione native ACP restano fuori ambito. |
| Streaming del pensiero                                                | Implementato    | Il contenuto del pensiero del modello viene trasmesso come aggiornamenti di sessione `agent_thought_chunk`. Non vengono emessi piani di sessione nativi ACP.                                                                                                                                |
| Informazioni sulla sessione e aggiornamenti sull'utilizzo             | Parziale        | Il bridge emette notifiche `session_info_update` e, quando possibile, `usage_update` dalle istantanee memorizzate nella cache delle sessioni del Gateway. L'utilizzo è approssimativo e viene inviato solo quando i totali dei token del Gateway sono contrassegnati come aggiornati.          |
| Streaming degli strumenti                                            | Parziale        | Gli eventi `tool_call`/`tool_call_update` includono I/O grezzo, contenuto testuale e, quando possibile, percorsi dei file se gli argomenti/risultati degli strumenti del Gateway li espongono. Non vengono esposti terminali incorporati né output più ricchi nativi per le differenze.          |
| Approvazioni per l'esecuzione                                         | Parziale        | Le richieste di approvazione dell'esecuzione del Gateway durante i turni attivi dei prompt ACP vengono inoltrate al client ACP tramite `session/request_permission`.                                                                                                                         |
| Server MCP per sessione (`mcpServers`)                                | Non supportato  | La modalità bridge rifiuta le richieste di server MCP per sessione. Configura invece MCP sul Gateway o sull'agente OpenClaw.                                                                                                                                                                |
| Metodi del file system del client (`fs/read_text_file`, `fs/write_text_file`) | Non supportato | Il bridge non richiama i metodi del file system del client ACP.                                                                                                                                                                                                                            |
| Metodi del terminale del client (`terminal/*`)                        | Non supportato  | Il bridge non crea terminali del client ACP e non trasmette gli ID dei terminali tramite le chiamate agli strumenti.                                                                                                                                                                       |

## Limitazioni note

- `loadSession` riproduce la cronologia completa del registro eventi ACP solo per le sessioni create dal bridge. Le sessioni precedenti o prive di registro usano il ripiego sulla trascrizione e non ricostruiscono le chiamate storiche agli strumenti né gli avvisi di sistema.
- Se più client ACP condividono la stessa chiave di sessione del Gateway, l'instradamento degli eventi e degli annullamenti è basato sul massimo sforzo anziché essere rigorosamente isolato per client. Quando servono turni locali dell'editor nettamente separati, preferisci le sessioni isolate predefinite `acp-bridge:<uuid>`.
- Gli stati di arresto del Gateway vengono tradotti in motivi di arresto ACP, ma questa associazione è meno espressiva rispetto a un runtime completamente nativo ACP.
- I controlli di sessione espongono un sottoinsieme mirato delle opzioni del Gateway: livello di pensiero, verbosità degli strumenti, ragionamento, dettagli di utilizzo e azioni con privilegi elevati. La selezione del modello e i controlli dell'host di esecuzione non sono esposti come opzioni di configurazione ACP.
- `session_info_update` e `usage_update` derivano dalle istantanee delle sessioni del Gateway, non dalla contabilizzazione in tempo reale di un runtime nativo ACP. L'utilizzo è approssimativo, non include dati sui costi e viene emesso solo quando il Gateway contrassegna come aggiornati i dati sui token totali.
- I dati di accompagnamento degli strumenti sono basati sul massimo sforzo: il bridge espone i percorsi dei file presenti negli argomenti/risultati noti degli strumenti, ma non emette terminali ACP né differenze strutturate dei file.
- L'inoltro dell'approvazione dell'esecuzione è limitato al turno attivo del prompt ACP; le approvazioni provenienti da altre sessioni del Gateway vengono ignorate.

## Utilizzo

```bash
openclaw acp

# Gateway remoto
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token da file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Collegamento a una chiave di sessione esistente
openclaw acp --session agent:main:main

# Collegamento tramite etichetta (deve esistere già)
openclaw acp --session-label "support inbox"

# Reimpostazione della chiave di sessione prima del primo prompt
openclaw acp --session agent:main:main --reset-session
```

## Client ACP (debug)

Usa il client ACP integrato per verificare rapidamente il bridge senza un IDE. Avvia il bridge ACP e consente di digitare prompt in modo interattivo.

```bash
openclaw acp client

# Indirizza il bridge avviato a un Gateway remoto
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Sostituisce il comando del server (predefinito: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modello di autorizzazione (modalità di debug del client):

- L'approvazione automatica si basa su un elenco consentito e si applica solo agli ID attendibili degli strumenti principali.
- L'approvazione automatica di `read` è limitata alla directory di lavoro corrente (`--cwd` se impostato).
- ACP approva automaticamente solo categorie ristrette di sola lettura: chiamate `read` limitate alla directory di lavoro corrente attiva, oltre agli strumenti di ricerca di sola lettura (`search`, `web_search`, `memory_search`). Gli strumenti sconosciuti/non principali, le letture fuori ambito, gli strumenti con capacità di esecuzione, gli strumenti del piano di controllo, gli strumenti che apportano modifiche e i flussi interattivi richiedono sempre l'approvazione esplicita del prompt.
- Il valore `toolCall.kind` fornito dal server viene trattato come metadato non attendibile, non come fonte di autorizzazione.
- Questa politica del bridge ACP è distinta dalle autorizzazioni dell'harness ACPX. Se esegui OpenClaw tramite il backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` è l'interruttore di emergenza "yolo" per quella sessione dell'harness.

## Test rapido del protocollo

Per il debug a livello di protocollo, avvia un Gateway con stato isolato e controlla `openclaw acp` tramite stdio con un client JSON-RPC ACP. Verifica `initialize`, `session/new`, `session/list` con un `cwd` assoluto, `session/resume`, `session/close`, la chiusura duplicata e la ripresa di una sessione inesistente.

La prova deve includere le funzionalità del ciclo di vita pubblicizzate, una riga di sessione basata sul Gateway, le notifiche di aggiornamento e il log `sessions.list` del Gateway:

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

Evita di usare `openclaw gateway call sessions.list` come unica prova ACP. Quel percorso della CLI potrebbe richiedere un aggiornamento dell'ambito operatore con token recente; la correttezza del bridge ACP viene dimostrata dai frame ACP su stdio insieme al log `sessions.list` del Gateway.

## Come usarlo

Usa ACP quando un IDE (o un altro client) utilizza Agent Client Protocol e vuoi che controlli una sessione del Gateway OpenClaw.

1. Assicurati che il Gateway sia in esecuzione (locale o remoto).
2. Configura la destinazione del Gateway (configurazione o flag).
3. Configura il tuo IDE affinché esegua `openclaw acp` tramite stdio.

Esempio di configurazione (persistente):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Esempio di esecuzione diretta (senza scrivere la configurazione):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferibile per la sicurezza del processo locale
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selezione degli agenti

ACP non seleziona direttamente gli agenti. Esegue l'instradamento in base alla chiave di sessione del Gateway. Usa chiavi di sessione specifiche per agente per scegliere un agente specifico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Ogni sessione ACP corrisponde a una singola chiave di sessione del Gateway. Un agente può avere molte sessioni; per impostazione predefinita ACP usa una sessione isolata `acp-bridge:<uuid>`, a meno che non venga specificata un'altra chiave o etichetta.

Le opzioni `mcpServers` per sessione non sono supportate in modalità bridge. Se un client ACP le invia durante `newSession` o `loadSession`, il bridge restituisce un errore chiaro anziché ignorarle silenziosamente.

Se vuoi che le sessioni basate su ACPX vedano gli strumenti dei plugin OpenClaw o strumenti integrati selezionati come `cron`, abilita i bridge MCP ACPX sul lato Gateway anziché provare a passare `mcpServers` per sessione. Consulta [Agenti ACP](/it/tools/acp-agents-setup#plugin-tools-mcp-bridge) e [Bridge MCP degli strumenti OpenClaw](/it/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Utilizzo da `acpx` (Codex, Claude, altri client ACP)

Se vuoi che un agente di programmazione come Codex o Claude Code comunichi con il tuo bot OpenClaw tramite ACP, usa `acpx` con la destinazione `openclaw` integrata.

Flusso tipico:

1. Avvia il Gateway e assicurati che il bridge ACP possa raggiungerlo.
2. Indirizza `acpx openclaw` verso `openclaw acp`.
3. Specifica la chiave di sessione OpenClaw che vuoi far usare all'agente di programmazione.

Esempi:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Se vuoi che `acpx openclaw` usi ogni volta un Gateway e una chiave di sessione specifici, sovrascrivi il comando dell'agente `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Per un checkout locale del repository OpenClaw, usa direttamente il punto di ingresso della CLI anziché il runner di sviluppo, in modo che il flusso ACP rimanga pulito:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Questo è il modo più semplice per consentire a Codex, Claude Code o a un altro client compatibile con ACP di ottenere informazioni contestuali da un agente OpenClaw senza analizzare il contenuto di un terminale.

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

Per specificare un Gateway o un agente:

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

## Associazione delle sessioni

Per impostazione predefinita, le sessioni del bridge ACP ricevono una chiave di sessione Gateway isolata con il prefisso `acp-bridge:`. Queste sessioni bridge con modello normale sono sintetiche e temporanee: sono soggette alla rimozione delle voci obsolete e non sono considerate superfici protette di conversazione umana. Per riutilizzare una sessione nota, passa una chiave o un'etichetta di sessione:

- `--session <key>`: usa una chiave di sessione Gateway specifica.
- `--session-label <label>`: risolvi una sessione esistente tramite etichetta.
- `--reset-session`: genera un nuovo ID di sessione per quella chiave (stessa chiave, nuova trascrizione).

Se il tuo client ACP supporta i metadati, puoi sovrascrivere le impostazioni per ogni sessione:

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

- `--url <url>`: URL WebSocket del Gateway (il valore predefinito è `gateway.remote.url`, se configurato).
- `--token <token>`: token di autenticazione del Gateway.
- `--token-file <path>`: legge il token di autenticazione del Gateway da un file.
- `--password <password>`: password di autenticazione del Gateway.
- `--password-file <path>`: legge la password di autenticazione del Gateway da un file.
- `--session <key>`: chiave di sessione predefinita.
- `--session-label <label>`: etichetta di sessione predefinita da risolvere.
- `--require-existing`: genera un errore se la chiave o l'etichetta di sessione non esiste.
- `--reset-session`: reimposta la chiave di sessione prima del primo utilizzo.
- `--no-prefix-cwd`: non anteporre la directory di lavoro ai prompt.
- `--provenance <off|meta|meta+receipt>`: include i metadati o le ricevute di provenienza ACP.
- `--verbose, -v`: registrazione dettagliata su stderr.

Nota sulla sicurezza:

- `--token` e `--password` possono essere visibili negli elenchi dei processi locali su alcuni sistemi. Preferisci `--token-file`/`--password-file` o le variabili d'ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La risoluzione dell'autenticazione del Gateway segue il contratto condiviso utilizzato dagli altri client Gateway:
  - modalità locale: variabili d'ambiente (`OPENCLAW_GATEWAY_*`), quindi `gateway.auth.*`, con ripiego su `gateway.remote.*` solo quando `gateway.auth.*` non è impostato (un SecretRef locale configurato ma non risolto interrompe l'operazione in modo sicuro anziché ricorrere silenziosamente al ripiego)
  - modalità remota: `gateway.remote.*` con ripiego su variabili d'ambiente/configurazione secondo le regole di precedenza remota
  - `--url` è sicuro come sovrascrittura e non riutilizza credenziali implicite provenienti dalla configurazione o dalle variabili d'ambiente; passa esplicitamente `--token`/`--password` (o le varianti basate su file)

### Opzioni di `acp client`

- `--cwd <dir>`: directory di lavoro per la sessione ACP.
- `--server <command>`: comando del server ACP (predefinito: `openclaw`).
- `--server-args <args...>`: argomenti aggiuntivi passati al server ACP.
- `--server-verbose`: abilita la registrazione dettagliata sul server ACP.
- `--verbose, -v`: registrazione dettagliata del client.
- `openclaw acp client` imposta `OPENCLAW_SHELL=acp-client` nel processo bridge avviato, che può essere utilizzato per regole della shell o del profilo specifiche del contesto.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Agenti ACP](/it/tools/acp-agents)
