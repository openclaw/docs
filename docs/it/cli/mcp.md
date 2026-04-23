---
read_when:
    - Collegare Codex, Claude Code o un altro client MCP ai canali supportati da OpenClaw
    - Eseguire `openclaw mcp serve`
    - Gestire le definizioni dei server MCP salvate da OpenClaw
summary: Esporre le conversazioni dei canali OpenClaw tramite MCP e gestire le definizioni salvate dei server MCP
title: mcp
x-i18n:
    generated_at: "2026-04-23T08:26:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` ha due funzioni:

- eseguire OpenClaw come server MCP con `openclaw mcp serve`
- gestire le definizioni dei server MCP in uscita di proprietà di OpenClaw con `list`, `show`,
  `set` e `unset`

In altre parole:

- `serve` è OpenClaw che agisce come server MCP
- `list` / `show` / `set` / `unset` è OpenClaw che agisce come registro lato
  client MCP per altri server MCP che i suoi runtime potranno consumare in seguito

Usa [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente una
sessione di harness di coding e instradare quel runtime tramite ACP.

## OpenClaw come server MCP

Questo è il percorso `openclaw mcp serve`.

## Quando usare `serve`

Usa `openclaw mcp serve` quando:

- Codex, Claude Code o un altro client MCP devono parlare direttamente con
  conversazioni di canale supportate da OpenClaw
- hai già un Gateway OpenClaw locale o remoto con sessioni instradate
- vuoi un unico server MCP che funzioni attraverso i backend di canale di OpenClaw invece
  di eseguire bridge separati per ciascun canale

Usa invece [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente il
runtime di coding e mantenere la sessione dell'agente all'interno di OpenClaw.

## Come funziona

`openclaw mcp serve` avvia un server MCP stdio. Il client MCP possiede quel
processo. Finché il client mantiene aperta la sessione stdio, il bridge si collega a un
Gateway OpenClaw locale o remoto tramite WebSocket ed espone tramite MCP
conversazioni di canale instradate.

Ciclo di vita:

1. il client MCP avvia `openclaw mcp serve`
2. il bridge si collega al Gateway
3. le sessioni instradate diventano conversazioni MCP e strumenti di cronologia/trascrizione
4. gli eventi live vengono messi in coda in memoria mentre il bridge è connesso
5. se è abilitata la modalità canale Claude, la stessa sessione può anche ricevere
   notifiche push specifiche per Claude

Comportamento importante:

- lo stato della coda live inizia quando il bridge si collega
- la cronologia delle trascrizioni precedenti viene letta con `messages_read`
- le notifiche push Claude esistono solo mentre la sessione MCP è attiva
- quando il client si disconnette, il bridge termina e la coda live va persa
- i server MCP stdio avviati da OpenClaw (bundled o configurati dall'utente) vengono
  terminati come albero di processi allo shutdown, quindi i sottoprocessi figli avviati dal
  server non sopravvivono dopo l'uscita del client stdio padre
- eliminare o reimpostare una sessione rilascia i client MCP di quella sessione tramite
  il percorso condiviso di cleanup del runtime, quindi non rimangono connessioni stdio
  persistenti legate a una sessione rimossa

## Scegliere una modalità client

Usa lo stesso bridge in due modi diversi:

- Client MCP generici: solo strumenti MCP standard. Usa `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` e gli
  strumenti di approvazione.
- Claude Code: strumenti MCP standard più l'adattatore di canale specifico per Claude.
  Abilita `--claude-channel-mode on` o lascia il valore predefinito `auto`.

Attualmente, `auto` si comporta come `on`. Non esiste ancora il rilevamento delle
capacità del client.

## Cosa espone `serve`

Il bridge usa i metadati di route delle sessioni Gateway esistenti per esporre conversazioni
supportate da canale. Una conversazione appare quando OpenClaw ha già uno stato di sessione
con una route nota come:

- `channel`
- metadati del destinatario o della destinazione
- `accountId` opzionale
- `threadId` opzionale

Questo offre ai client MCP un unico punto da cui:

- elencare le conversazioni instradate recenti
- leggere la cronologia recente della trascrizione
- attendere nuovi eventi in ingresso
- inviare una risposta tramite la stessa route
- vedere le richieste di approvazione che arrivano mentre il bridge è connesso

## Utilizzo

```bash
# Gateway locale
openclaw mcp serve

# Gateway remoto
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway remoto con autenticazione tramite password
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Abilita log verbosi del bridge
openclaw mcp serve --verbose

# Disabilita le notifiche push specifiche per Claude
openclaw mcp serve --claude-channel-mode off
```

## Strumenti del bridge

Il bridge attuale espone questi strumenti MCP:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Elenca le conversazioni recenti supportate da sessione che hanno già metadati di route
nello stato della sessione Gateway.

Filtri utili:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Restituisce una conversazione per `session_key`.

### `messages_read`

Legge i messaggi recenti della trascrizione per una conversazione supportata da sessione.

### `attachments_fetch`

Estrae i blocchi di contenuto non testuale di un messaggio della trascrizione. Questa è una
vista di metadati sul contenuto della trascrizione, non uno store di blob allegati durevole e autonomo.

### `events_poll`

Legge gli eventi live messi in coda a partire da un cursore numerico.

### `events_wait`

Esegue un long-poll finché non arriva il prossimo evento in coda corrispondente o finché scade un timeout.

Usalo quando un client MCP generico ha bisogno di consegna quasi in tempo reale senza un
protocollo push specifico per Claude.

### `messages_send`

Invia testo attraverso la stessa route già registrata nella sessione.

Comportamento attuale:

- richiede una route di conversazione esistente
- usa il canale della sessione, il destinatario, l'ID account e l'ID thread
- invia solo testo

### `permissions_list_open`

Elenca le richieste di approvazione exec/plugin in sospeso che il bridge ha osservato da quando si è
collegato al Gateway.

### `permissions_respond`

Risolve una richiesta di approvazione exec/plugin in sospeso con:

- `allow-once`
- `allow-always`
- `deny`

## Modello di eventi

Il bridge mantiene una coda eventi in memoria mentre è connesso.

Tipi di evento attuali:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limiti importanti:

- la coda è solo live; inizia quando il bridge MCP si avvia
- `events_poll` e `events_wait` non riproducono da soli la cronologia precedente del Gateway
- il backlog durevole deve essere letto con `messages_read`

## Notifiche del canale Claude

Il bridge può anche esporre notifiche di canale specifiche per Claude. Questo è l'equivalente
OpenClaw di un adattatore di canale Claude Code: gli strumenti MCP standard restano disponibili,
ma i messaggi live in ingresso possono arrivare anche come notifiche MCP specifiche per Claude.

Flag:

- `--claude-channel-mode off`: solo strumenti MCP standard
- `--claude-channel-mode on`: abilita le notifiche del canale Claude
- `--claude-channel-mode auto`: valore predefinito attuale; stesso comportamento del bridge di `on`

Quando la modalità canale Claude è abilitata, il server pubblicizza capacità sperimentali Claude
e può emettere:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento attuale del bridge:

- i messaggi di trascrizione `user` in ingresso vengono inoltrati come
  `notifications/claude/channel`
- le richieste di autorizzazione Claude ricevute tramite MCP vengono tracciate in memoria
- se la conversazione collegata invia successivamente `yes abcde` o `no abcde`, il bridge
  lo converte in `notifications/claude/channel/permission`
- queste notifiche sono solo per la sessione live; se il client MCP si disconnette,
  non esiste una destinazione push

Questo è intenzionalmente specifico del client. I client MCP generici dovrebbero affidarsi agli
strumenti di polling standard.

## Configurazione del client MCP

Esempio di configurazione client stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Per la maggior parte dei client MCP generici, inizia dalla superficie di strumenti standard e ignora
la modalità Claude. Attiva la modalità Claude solo per i client che comprendono davvero i
metodi di notifica specifici per Claude.

## Opzioni

`openclaw mcp serve` supporta:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--token-file <path>`: legge il token da file
- `--password <password>`: password del Gateway
- `--password-file <path>`: legge la password da file
- `--claude-channel-mode <auto|on|off>`: modalità di notifica Claude
- `-v`, `--verbose`: log verbosi su stderr

Quando possibile, preferisci `--token-file` o `--password-file` ai segreti inline.

## Sicurezza e confine di fiducia

Il bridge non inventa l'instradamento. Espone solo le conversazioni che il Gateway
sa già come instradare.

Questo significa:

- allowlist dei mittenti, pairing e fiducia a livello di canale appartengono ancora alla
  configurazione del canale OpenClaw sottostante
- `messages_send` può rispondere solo tramite una route esistente memorizzata
- lo stato delle approvazioni è solo live/in-memory per la sessione bridge corrente
- l'autenticazione del bridge dovrebbe usare gli stessi controlli di token o password del Gateway che
  considereresti attendibili per qualsiasi altro client Gateway remoto

Se una conversazione manca da `conversations_list`, la causa abituale non è la configurazione
MCP. Sono metadati di route mancanti o incompleti nella sessione Gateway sottostante.

## Test

OpenClaw include uno smoke Docker deterministico per questo bridge:

```bash
pnpm test:docker:mcp-channels
```

Questo smoke:

- avvia un container Gateway preconfigurato
- avvia un secondo container che esegue `openclaw mcp serve`
- verifica rilevamento delle conversazioni, lettura delle trascrizioni, lettura dei metadati
  degli allegati, comportamento della coda eventi live e instradamento degli invii in uscita
- valida notifiche di canale e di autorizzazione in stile Claude sul bridge MCP stdio reale

Questo è il modo più rapido per dimostrare che il bridge funziona senza collegare un vero
account Telegram, Discord o iMessage all'esecuzione di test.

Per un contesto di test più ampio, vedi [Testing](/it/help/testing).

## Risoluzione dei problemi

### Nessuna conversazione restituita

Di solito significa che la sessione Gateway non è già instradabile. Conferma che la
sessione sottostante abbia metadati di route memorizzati per canale/provider, destinatario e
route account/thread opzionale.

### `events_poll` o `events_wait` non vedono i messaggi più vecchi

Previsto. La coda live inizia quando il bridge si collega. Leggi la cronologia più vecchia della trascrizione
con `messages_read`.

### Le notifiche Claude non compaiono

Controlla tutti questi punti:

- il client ha mantenuto aperta la sessione stdio MCP
- `--claude-channel-mode` è `on` o `auto`
- il client comprende davvero i metodi di notifica specifici per Claude
- il messaggio in ingresso è arrivato dopo la connessione del bridge

### Mancano le approvazioni

`permissions_list_open` mostra solo le richieste di approvazione osservate mentre il bridge
era connesso. Non è un'API di cronologia durevole delle approvazioni.

## OpenClaw come registro client MCP

Questo è il percorso `openclaw mcp list`, `show`, `set` e `unset`.

Questi comandi non espongono OpenClaw tramite MCP. Gestiscono le definizioni dei server MCP
di proprietà di OpenClaw sotto `mcp.servers` nella configurazione di OpenClaw.

Quelle definizioni salvate servono ai runtime che OpenClaw avvia o configura in seguito,
come Pi embedded e altri adattatori di runtime. OpenClaw archivia le definizioni in modo centralizzato
così quei runtime non devono mantenere proprie liste duplicate di server MCP.

Comportamento importante:

- questi comandi leggono o scrivono solo la configurazione di OpenClaw
- non si collegano al server MCP di destinazione
- non validano se il comando, l'URL o il trasporto remoto sono raggiungibili in questo momento
- gli adattatori di runtime decidono quali forme di trasporto supportano davvero al momento
  dell'esecuzione
- Pi embedded espone gli strumenti MCP configurati nei normali profili di strumenti `coding` e `messaging`;
  `minimal` continua a nasconderli e `tools.deny: ["bundle-mcp"]` li disabilita esplicitamente

## Definizioni salvate dei server MCP

OpenClaw archivia anche un registro leggero dei server MCP nella configurazione per le superfici
che vogliono definizioni MCP gestite da OpenClaw.

Comandi:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Note:

- `list` ordina i nomi dei server.
- `show` senza nome stampa l'intero oggetto configurato dei server MCP.
- `set` si aspetta un singolo valore oggetto JSON sulla riga di comando.
- `unset` fallisce se il server nominato non esiste.

Esempi:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Esempio di forma della configurazione:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Trasporto stdio

Avvia un processo figlio locale e comunica tramite stdin/stdout.

| Campo                      | Descrizione                         |
| -------------------------- | ----------------------------------- |
| `command`                  | Eseguibile da avviare (obbligatorio) |
| `args`                     | Array di argomenti della riga di comando |
| `env`                      | Variabili d'ambiente aggiuntive     |
| `cwd` / `workingDirectory` | Directory di lavoro per il processo |

#### Filtro di sicurezza env stdio

OpenClaw rifiuta le chiavi env di avvio dell'interprete che possono alterare il modo in cui un server MCP stdio si avvia prima del primo RPC, anche se compaiono nel blocco `env` di un server. Le chiavi bloccate includono `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` e variabili simili di controllo del runtime. L'avvio rifiuta queste chiavi con un errore di configurazione, così non possono iniettare un preambolo implicito, sostituire l'interprete o abilitare un debugger contro il processo stdio. Le normali variabili env di credenziali, proxy e specifiche del server (`GITHUB_TOKEN`, `HTTP_PROXY`, `custom `*_API_KEY`, ecc.) non sono interessate.

Se il tuo server MCP ha davvero bisogno di una delle variabili bloccate, impostala sul processo host del Gateway invece che sotto `env` del server stdio.

### Trasporto SSE / HTTP

Si collega a un server MCP remoto tramite HTTP Server-Sent Events.

| Campo                 | Descrizione                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                  |
| `headers`             | Mappa facoltativa chiave-valore di header HTTP (ad esempio token di auth) |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (facoltativo)              |

Esempio:
__OC_I18N_900005__
I valori sensibili in `url` (userinfo) e `headers` vengono redatti nei log e
nell'output di stato.

### Trasporto HTTP streamable

`streamable-http` è un'ulteriore opzione di trasporto accanto a `sse` e `stdio`. Usa lo streaming HTTP per la comunicazione bidirezionale con server MCP remoti.

| Campo                 | Descrizione                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                                      |
| `transport`           | Imposta `"streamable-http"` per selezionare questo trasporto; se omesso, OpenClaw usa `sse` |
| `headers`             | Mappa facoltativa chiave-valore di header HTTP (ad esempio token di auth)              |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (facoltativo)                                  |

Esempio:
__OC_I18N_900006__
Questi comandi gestiscono solo la configurazione salvata. Non avviano il bridge del canale,
non aprono una sessione client MCP live e non dimostrano che il server di destinazione sia raggiungibile.

## Limiti attuali

Questa pagina documenta il bridge così come viene distribuito oggi.

Limiti attuali:

- il rilevamento delle conversazioni dipende dai metadati di route delle sessioni Gateway esistenti
- nessun protocollo push generico oltre all'adattatore specifico per Claude
- ancora nessuno strumento per modifica dei messaggi o reazioni
- il trasporto HTTP/SSE/streamable-http si collega a un singolo server remoto; nessun upstream multiplexato per ora
- `permissions_list_open` include solo le approvazioni osservate mentre il bridge è connesso
