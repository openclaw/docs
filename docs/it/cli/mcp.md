---
read_when:
    - Connessione di Codex, Claude Code o un altro client MCP a canali supportati da OpenClaw
    - Esecuzione di `openclaw mcp serve`
    - Gestione delle definizioni salvate dei server MCP in OpenClaw
summary: Esporre le conversazioni dei canali OpenClaw tramite MCP e gestire le definizioni salvate dei server MCP
title: mcp
x-i18n:
    generated_at: "2026-04-05T13:48:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b35de9e14f96666eeca2f93c06cb214e691152f911d45ee778efe9cf5bf96cc2
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` ha due funzioni:

- eseguire OpenClaw come server MCP con `openclaw mcp serve`
- gestire le definizioni dei server MCP in uscita possedute da OpenClaw con `list`, `show`,
  `set` e `unset`

In altre parole:

- `serve` è OpenClaw che agisce come server MCP
- `list` / `show` / `set` / `unset` è OpenClaw che agisce come registro lato
  client MCP per altri server MCP che i suoi runtime potrebbero usare in seguito

Usa [`openclaw acp`](/cli/acp) quando OpenClaw deve ospitare una sessione
di harness di coding e instradare quel runtime tramite ACP.

## OpenClaw come server MCP

Questo è il percorso `openclaw mcp serve`.

## Quando usare `serve`

Usa `openclaw mcp serve` quando:

- Codex, Claude Code o un altro client MCP deve parlare direttamente con
  conversazioni di canali supportate da OpenClaw
- hai già un Gateway OpenClaw locale o remoto con sessioni instradate
- vuoi un unico server MCP che funzioni tra i backend di canale di OpenClaw
  invece di eseguire bridge separati per ciascun canale

Usa invece [`openclaw acp`](/cli/acp) quando OpenClaw deve ospitare il runtime
di coding stesso e mantenere la sessione agente all'interno di OpenClaw.

## Come funziona

`openclaw mcp serve` avvia un server MCP stdio. Il client MCP possiede quel
processo. Finché il client mantiene aperta la sessione stdio, il bridge si connette a un
Gateway OpenClaw locale o remoto tramite WebSocket ed espone le conversazioni dei
canali instradate tramite MCP.

Ciclo di vita:

1. il client MCP avvia `openclaw mcp serve`
2. il bridge si connette al Gateway
3. le sessioni instradate diventano conversazioni MCP e strumenti di trascrizione/cronologia
4. gli eventi live vengono accodati in memoria mentre il bridge è connesso
5. se la modalità canale Claude è abilitata, la stessa sessione può anche ricevere
   notifiche push specifiche di Claude

Comportamento importante:

- lo stato della coda live inizia quando il bridge si connette
- la cronologia delle trascrizioni più vecchie viene letta con `messages_read`
- le notifiche push Claude esistono solo mentre la sessione MCP è attiva
- quando il client si disconnette, il bridge termina e la coda live scompare

## Scegli una modalità client

Usa lo stesso bridge in due modi diversi:

- Client MCP generici: solo strumenti MCP standard. Usa `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` e gli
  strumenti di approvazione.
- Claude Code: strumenti MCP standard più l'adattatore di canale specifico per Claude.
  Abilita `--claude-channel-mode on` oppure lascia il valore predefinito `auto`.

Oggi, `auto` si comporta allo stesso modo di `on`. Non esiste ancora il rilevamento
delle capacità del client.

## Cosa espone `serve`

Il bridge usa i metadati di route delle sessioni Gateway esistenti per esporre
conversazioni supportate da canali. Una conversazione appare quando OpenClaw ha già
uno stato di sessione con una route nota come:

- `channel`
- metadati di destinatario o destinazione
- `accountId` facoltativo
- `threadId` facoltativo

Questo offre ai client MCP un unico punto da cui:

- elencare le conversazioni instradate recenti
- leggere la cronologia recente delle trascrizioni
- attendere nuovi eventi in ingresso
- inviare una risposta indietro tramite la stessa route
- vedere le richieste di approvazione che arrivano mentre il bridge è connesso

## Utilizzo

```bash
# Gateway locale
openclaw mcp serve

# Gateway remoto
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway remoto con autenticazione tramite password
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Abilita log dettagliati del bridge
openclaw mcp serve --verbose

# Disabilita le notifiche push specifiche di Claude
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

Elenca le conversazioni recenti supportate da sessioni che hanno già metadati di route
nello stato della sessione Gateway.

Filtri utili:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Restituisce una conversazione tramite `session_key`.

### `messages_read`

Legge i messaggi recenti della trascrizione per una conversazione supportata da sessione.

### `attachments_fetch`

Estrae blocchi di contenuto di messaggi non testuali da un messaggio della trascrizione. Questa è una
vista di metadati sul contenuto della trascrizione, non uno store autonomo e durevole di blob allegati.

### `events_poll`

Legge gli eventi live accodati a partire da un cursore numerico.

### `events_wait`

Esegue un long-polling finché non arriva il successivo evento accodato corrispondente o finché scade il timeout.

Usalo quando un client MCP generico ha bisogno di una consegna quasi in tempo reale senza un
protocollo push specifico per Claude.

### `messages_send`

Invia testo indietro tramite la stessa route già registrata nella sessione.

Comportamento attuale:

- richiede una route di conversazione esistente
- usa il canale, il destinatario, l'ID account e l'ID thread della sessione
- invia solo testo

### `permissions_list_open`

Elenca le richieste di approvazione exec/plugin in sospeso che il bridge ha osservato da quando
si è connesso al Gateway.

### `permissions_respond`

Risolve una richiesta di approvazione exec/plugin in sospeso con:

- `allow-once`
- `allow-always`
- `deny`

## Modello eventi

Il bridge mantiene una coda di eventi in memoria mentre è connesso.

Tipi di evento attuali:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limiti importanti:

- la coda è solo live; inizia quando il bridge MCP si avvia
- `events_poll` e `events_wait` non riproducono da soli la cronologia Gateway più vecchia
- il backlog durevole deve essere letto con `messages_read`

## Notifiche del canale Claude

Il bridge può anche esporre notifiche di canale specifiche per Claude. Questo è
l'equivalente OpenClaw di un adattatore di canale Claude Code: gli strumenti MCP standard restano
disponibili, ma i messaggi live in ingresso possono anche arrivare come notifiche MCP specifiche per Claude.

Flag:

- `--claude-channel-mode off`: solo strumenti MCP standard
- `--claude-channel-mode on`: abilita le notifiche del canale Claude
- `--claude-channel-mode auto`: valore predefinito attuale; stesso comportamento del bridge di `on`

Quando la modalità canale Claude è abilitata, il server dichiara capacità sperimentali Claude
e può emettere:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento attuale del bridge:

- i messaggi della trascrizione `user` in ingresso vengono inoltrati come
  `notifications/claude/channel`
- le richieste di autorizzazione Claude ricevute tramite MCP vengono tracciate in memoria
- se la conversazione collegata invia successivamente `yes abcde` o `no abcde`, il bridge
  lo converte in `notifications/claude/channel/permission`
- queste notifiche sono solo per sessioni live; se il client MCP si disconnette,
  non esiste alcuna destinazione push

Questo è intenzionalmente specifico del client. I client MCP generici dovrebbero affidarsi agli
strumenti di polling standard.

## Configurazione client MCP

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

Per la maggior parte dei client MCP generici, inizia con la superficie standard degli strumenti e ignora
la modalità Claude. Attiva la modalità Claude solo per i client che comprendono davvero i
metodi di notifica specifici per Claude.

## Opzioni

`openclaw mcp serve` supporta:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: legge il token da un file
- `--password <password>`: password Gateway
- `--password-file <path>`: legge la password da un file
- `--claude-channel-mode <auto|on|off>`: modalità notifica Claude
- `-v`, `--verbose`: log dettagliati su stderr

Quando possibile, preferisci `--token-file` o `--password-file` ai segreti inline.

## Sicurezza e confine di fiducia

Il bridge non inventa l'instradamento. Espone solo le conversazioni che il Gateway
sa già come instradare.

Ciò significa che:

- allowlist dei mittenti, pairing e trust a livello di canale appartengono ancora alla
  configurazione del canale OpenClaw sottostante
- `messages_send` può rispondere solo tramite una route memorizzata esistente
- lo stato delle approvazioni è solo live/in memoria per la sessione bridge corrente
- l'autenticazione del bridge dovrebbe usare gli stessi controlli token o password Gateway di cui
  ti fideresti per qualsiasi altro client Gateway remoto

Se una conversazione manca da `conversations_list`, la causa abituale non è la
configurazione MCP. Sono metadati di route mancanti o incompleti nella sessione
Gateway sottostante.

## Test

OpenClaw include uno smoke Docker deterministico per questo bridge:

```bash
pnpm test:docker:mcp-channels
```

Questo smoke:

- avvia un container Gateway inizializzato
- avvia un secondo container che esegue `openclaw mcp serve`
- verifica scoperta delle conversazioni, lettura delle trascrizioni, lettura dei metadati
  degli allegati, comportamento della coda eventi live e instradamento dell'invio in uscita
- convalida notifiche di canale e autorizzazione in stile Claude sul vero
  bridge MCP stdio

Questo è il modo più rapido per dimostrare che il bridge funziona senza collegare un vero
account Telegram, Discord o iMessage all'esecuzione dei test.

Per un contesto di test più ampio, vedi [Testing](/help/testing).

## Risoluzione dei problemi

### Nessuna conversazione restituita

Di solito significa che la sessione Gateway non è già instradabile. Conferma che la
sessione sottostante abbia metadati di route memorizzati per canale/provider, destinatario e
route facoltative di account/thread.

### `events_poll` o `events_wait` non vedono i messaggi più vecchi

Previsto. La coda live inizia quando il bridge si connette. Leggi la cronologia della
trascrizione più vecchia con `messages_read`.

### Le notifiche Claude non compaiono

Controlla tutti questi punti:

- il client ha mantenuto aperta la sessione MCP stdio
- `--claude-channel-mode` è `on` o `auto`
- il client comprende davvero i metodi di notifica specifici per Claude
- il messaggio in ingresso è arrivato dopo la connessione del bridge

### Mancano le approvazioni

`permissions_list_open` mostra solo le richieste di approvazione osservate mentre il bridge
era connesso. Non è un'API di cronologia durevole delle approvazioni.

## OpenClaw come registro client MCP

Questo è il percorso `openclaw mcp list`, `show`, `set` e `unset`.

Questi comandi non espongono OpenClaw tramite MCP. Gestiscono le definizioni dei server MCP possedute da OpenClaw
in `mcp.servers` nella configurazione OpenClaw.

Queste definizioni salvate servono per runtime che OpenClaw avvia o configura
successivamente, come Pi incorporato e altri adattatori runtime. OpenClaw memorizza centralmente
le definizioni in modo che questi runtime non debbano mantenere i propri elenchi MCP
duplicati.

Comportamento importante:

- questi comandi leggono o scrivono solo la configurazione OpenClaw
- non si connettono al server MCP di destinazione
- non convalidano se il comando, l'URL o il trasporto remoto siano
  raggiungibili in questo momento
- gli adattatori runtime decidono quali forme di trasporto supportano effettivamente
  al momento dell'esecuzione

## Definizioni salvate dei server MCP

OpenClaw memorizza anche in configurazione un registro leggero dei server MCP per le superfici
che vogliono definizioni MCP gestite da OpenClaw.

Comandi:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Note:

- `list` ordina i nomi dei server.
- `show` senza un nome stampa l'intero oggetto configurato dei server MCP.
- `set` si aspetta un singolo valore oggetto JSON sulla riga di comando.
- `unset` fallisce se il server con quel nome non esiste.

Esempi:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Esempio di forma di configurazione:

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

| Campo                      | Descrizione                            |
| -------------------------- | -------------------------------------- |
| `command`                  | Eseguibile da avviare (obbligatorio)   |
| `args`                     | Array di argomenti da riga di comando  |
| `env`                      | Variabili d'ambiente aggiuntive        |
| `cwd` / `workingDirectory` | Directory di lavoro per il processo    |

### Trasporto SSE / HTTP

Si connette a un server MCP remoto tramite HTTP Server-Sent Events.

| Campo                 | Descrizione                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                    |
| `headers`             | Mappa facoltativa chiave-valore di header HTTP (ad esempio token auth) |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (facoltativo)                |

Esempio:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

I valori sensibili in `url` (userinfo) e `headers` vengono oscurati nei log e
nell'output di stato.

### Trasporto Streamable HTTP

`streamable-http` è un'ulteriore opzione di trasporto accanto a `sse` e `stdio`. Usa lo streaming HTTP per la comunicazione bidirezionale con server MCP remoti.

| Campo                 | Descrizione                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                                           |
| `transport`           | Imposta `"streamable-http"` per selezionare questo trasporto; se omesso, OpenClaw usa `sse` |
| `headers`             | Mappa facoltativa chiave-valore di header HTTP (ad esempio token auth)                      |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (facoltativo)                                       |

Esempio:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Questi comandi gestiscono solo la configurazione salvata. Non avviano il bridge dei canali,
non aprono una sessione client MCP live e non dimostrano che il server di destinazione sia raggiungibile.

## Limiti attuali

Questa pagina documenta il bridge così come viene distribuito oggi.

Limiti attuali:

- la scoperta delle conversazioni dipende dai metadati di route delle sessioni Gateway esistenti
- non esiste un protocollo push generico oltre all'adattatore specifico per Claude
- non ci sono ancora strumenti per modificare o reagire ai messaggi
- il trasporto HTTP/SSE/streamable-http si connette a un singolo server remoto; nessun upstream multiplexato per ora
- `permissions_list_open` include solo le approvazioni osservate mentre il bridge è
  connesso
