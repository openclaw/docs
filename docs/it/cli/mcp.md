---
read_when:
    - Collegare Codex, Claude Code o un altro client MCP ai canali supportati da OpenClaw
    - Esecuzione di `openclaw mcp serve`
    - Gestione delle definizioni dei server MCP salvate in OpenClaw
summary: Esponi le conversazioni dei canali OpenClaw tramite MCP e gestisci le definizioni salvate dei server MCP
title: MCP
x-i18n:
    generated_at: "2026-04-24T08:34:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` ha due funzioni:

- eseguire OpenClaw come server MCP con `openclaw mcp serve`
- gestire le definizioni dei server MCP in uscita possedute da OpenClaw con `list`, `show`,
  `set` e `unset`

In altre parole:

- `serve` significa che OpenClaw agisce come server MCP
- `list` / `show` / `set` / `unset` significano che OpenClaw agisce come registro
  lato client MCP per altri server MCP che i suoi runtime potrebbero usare in seguito

Usa [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente una
sessione di harness di coding e instradare quel runtime tramite ACP.

## OpenClaw come server MCP

Questo è il percorso `openclaw mcp serve`.

## Quando usare `serve`

Usa `openclaw mcp serve` quando:

- Codex, Claude Code o un altro client MCP devono comunicare direttamente con
  conversazioni di canale supportate da OpenClaw
- hai già un Gateway OpenClaw locale o remoto con sessioni instradate
- vuoi un unico server MCP che funzioni attraverso i backend di canale di OpenClaw invece
  di eseguire bridge separati per ciascun canale

Usa invece [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare il
runtime di coding stesso e mantenere la sessione agente all'interno di OpenClaw.

## Come funziona

`openclaw mcp serve` avvia un server MCP stdio. Il client MCP possiede quel
processo. Finché il client mantiene aperta la sessione stdio, il bridge si connette a un
Gateway OpenClaw locale o remoto tramite WebSocket ed espone le conversazioni di canale
instradate tramite MCP.

Ciclo di vita:

1. il client MCP avvia `openclaw mcp serve`
2. il bridge si connette al Gateway
3. le sessioni instradate diventano conversazioni MCP e strumenti transcript/history
4. gli eventi live vengono accodati in memoria mentre il bridge è connesso
5. se la modalità canale Claude è abilitata, la stessa sessione può anche ricevere
   notifiche push specifiche di Claude

Comportamento importante:

- lo stato della coda live inizia quando il bridge si connette
- la cronologia transcript più vecchia viene letta con `messages_read`
- le notifiche push Claude esistono solo finché la sessione MCP è attiva
- quando il client si disconnette, il bridge termina e la coda live scompare
- i server MCP stdio avviati da OpenClaw (inclusi o configurati dall'utente) vengono
  terminati come albero di processi all'arresto, quindi i sottoprocessi figli avviati dal
  server non sopravvivono dopo l'uscita del client stdio padre
- l'eliminazione o il reset di una sessione chiude i client MCP di quella sessione tramite
  il percorso condiviso di pulizia del runtime, quindi non restano connessioni stdio persistenti
  collegate a una sessione rimossa

## Scegli una modalità client

Usa lo stesso bridge in due modi diversi:

- Client MCP generici: solo strumenti MCP standard. Usa `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` e gli
  strumenti di approvazione.
- Claude Code: strumenti MCP standard più l'adattatore di canale specifico per Claude.
  Abilita `--claude-channel-mode on` oppure lascia il valore predefinito `auto`.

Oggi `auto` si comporta allo stesso modo di `on`. Non esiste ancora il rilevamento
delle capacità del client.

## Cosa espone `serve`

Il bridge usa i metadati di instradamento della sessione Gateway esistenti per esporre conversazioni
supportate da canali. Una conversazione appare quando OpenClaw ha già uno stato di sessione con
un percorso noto come:

- `channel`
- metadati del destinatario o della destinazione
- `accountId` facoltativo
- `threadId` facoltativo

Questo offre ai client MCP un unico posto da cui:

- elencare le conversazioni instradate recenti
- leggere la cronologia transcript recente
- attendere nuovi eventi in ingresso
- inviare una risposta tramite lo stesso percorso
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

Elenca le conversazioni recenti supportate da sessione che hanno già metadati di instradamento nello
stato di sessione del Gateway.

Filtri utili:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Restituisce una conversazione in base a `session_key`.

### `messages_read`

Legge i messaggi transcript recenti per una conversazione supportata da sessione.

### `attachments_fetch`

Estrae blocchi di contenuto non testuale da un messaggio transcript. Questa è una
vista dei metadati sul contenuto transcript, non uno store standalone durevole
di blob allegati.

### `events_poll`

Legge gli eventi live accodati a partire da un cursore numerico.

### `events_wait`

Esegue un long-poll finché non arriva il successivo evento accodato corrispondente oppure scade un timeout.

Usalo quando un client MCP generico ha bisogno di una consegna quasi in tempo reale senza
un protocollo push specifico per Claude.

### `messages_send`

Invia testo tramite lo stesso percorso già registrato nella sessione.

Comportamento attuale:

- richiede un percorso di conversazione esistente
- usa il canale, il destinatario, l'id account e l'id thread della sessione
- invia solo testo

### `permissions_list_open`

Elenca le richieste di approvazione exec/plugin in sospeso che il bridge ha osservato da quando si è
connesso al Gateway.

### `permissions_respond`

Risolve una richiesta di approvazione exec/plugin in sospeso con:

- `allow-once`
- `allow-always`
- `deny`

## Modello degli eventi

Il bridge mantiene una coda di eventi in memoria mentre è connesso.

Tipi di evento attuali:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limiti importanti:

- la coda è solo live; inizia quando parte il bridge MCP
- `events_poll` e `events_wait` non riproducono da soli la cronologia Gateway più vecchia
- il backlog durevole deve essere letto con `messages_read`

## Notifiche del canale Claude

Il bridge può anche esporre notifiche di canale specifiche di Claude. Questo è
l'equivalente OpenClaw di un adattatore di canale Claude Code: gli strumenti MCP standard restano
disponibili, ma i messaggi live in ingresso possono arrivare anche come notifiche MCP specifiche di Claude.

Flag:

- `--claude-channel-mode off`: solo strumenti MCP standard
- `--claude-channel-mode on`: abilita notifiche di canale Claude
- `--claude-channel-mode auto`: predefinito attuale; stesso comportamento del bridge di `on`

Quando la modalità canale Claude è abilitata, il server dichiara capacità sperimentali Claude
e può emettere:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento attuale del bridge:

- i messaggi transcript `user` in ingresso vengono inoltrati come
  `notifications/claude/channel`
- le richieste di permesso Claude ricevute tramite MCP vengono tracciate in memoria
- se la conversazione collegata invia successivamente `yes abcde` o `no abcde`, il bridge
  lo converte in `notifications/claude/channel/permission`
- queste notifiche esistono solo per la sessione live; se il client MCP si disconnette,
  non esiste alcuna destinazione push

Questo è volutamente specifico del client. I client MCP generici dovrebbero affidarsi agli
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

Per la maggior parte dei client MCP generici, inizia dalla superficie standard degli strumenti e ignora
la modalità Claude. Attiva la modalità Claude solo per i client che comprendono davvero i
metodi di notifica specifici di Claude.

## Opzioni

`openclaw mcp serve` supporta:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--token-file <path>`: legge il token da file
- `--password <password>`: password del Gateway
- `--password-file <path>`: legge la password da file
- `--claude-channel-mode <auto|on|off>`: modalità di notifica Claude
- `-v`, `--verbose`: log dettagliati su stderr

Quando possibile, preferisci `--token-file` o `--password-file` rispetto ai secret inline.

## Sicurezza e confine di fiducia

Il bridge non inventa l'instradamento. Espone solo le conversazioni che il Gateway
sa già come instradare.

Questo significa che:

- allowlist dei mittenti, abbinamento e trust a livello di canale appartengono ancora alla
  configurazione del canale OpenClaw sottostante
- `messages_send` può rispondere solo tramite un percorso memorizzato esistente
- lo stato di approvazione è solo live/in memoria per la sessione corrente del bridge
- l'autenticazione del bridge dovrebbe usare gli stessi controlli di token o password del Gateway che
  useresti per qualsiasi altro client Gateway remoto

Se una conversazione manca da `conversations_list`, la causa abituale non è la
configurazione MCP. Sono metadati di instradamento mancanti o incompleti nella
sessione Gateway sottostante.

## Test

OpenClaw distribuisce uno smoke Docker deterministico per questo bridge:

```bash
pnpm test:docker:mcp-channels
```

Questo smoke:

- avvia un container Gateway con seed
- avvia un secondo container che esegue `openclaw mcp serve`
- verifica l'individuazione delle conversazioni, la lettura transcript, la lettura dei metadati
  degli allegati, il comportamento della coda eventi live e l'instradamento degli invii in uscita
- valida notifiche in stile Claude per canale e permessi sul bridge MCP stdio reale

Questo è il modo più rapido per dimostrare che il bridge funziona senza collegare al test
un vero account Telegram, Discord o iMessage.

Per un contesto di test più ampio, vedi [Testing](/it/help/testing).

## Risoluzione dei problemi

### Nessuna conversazione restituita

Di solito significa che la sessione Gateway non è già instradabile. Verifica che la
sessione sottostante abbia memorizzati canale/provider, destinatario e metadati di instradamento
facoltativi di account/thread.

### `events_poll` o `events_wait` non vedono i messaggi più vecchi

Previsto. La coda live inizia quando il bridge si connette. Leggi la cronologia transcript
più vecchia con `messages_read`.

### Le notifiche Claude non compaiono

Controlla tutti questi punti:

- il client ha mantenuto aperta la sessione stdio MCP
- `--claude-channel-mode` è `on` oppure `auto`
- il client comprende davvero i metodi di notifica specifici di Claude
- il messaggio in ingresso è avvenuto dopo la connessione del bridge

### Mancano le approvazioni

`permissions_list_open` mostra solo le richieste di approvazione osservate mentre il bridge
era connesso. Non è un'API di cronologia durevole delle approvazioni.

## OpenClaw come registro client MCP

Questo è il percorso `openclaw mcp list`, `show`, `set` e `unset`.

Questi comandi non espongono OpenClaw tramite MCP. Gestiscono le definizioni dei server MCP
possedute da OpenClaw sotto `mcp.servers` nella configurazione OpenClaw.

Queste definizioni salvate sono destinate ai runtime che OpenClaw avvia o configura
in seguito, come Pi incorporato e altri adattatori runtime. OpenClaw memorizza centralmente le
definizioni in modo che questi runtime non debbano mantenere i propri elenchi duplicati
di server MCP.

Comportamento importante:

- questi comandi leggono o scrivono solo la configurazione OpenClaw
- non si connettono al server MCP di destinazione
- non convalidano se il comando, l'URL o il trasporto remoto sono
  raggiungibili in questo momento
- gli adattatori runtime decidono quali forme di trasporto supportano davvero al
  momento dell'esecuzione
- Pi incorporato espone gli strumenti MCP configurati nei normali profili di strumenti `coding` e `messaging`;
  `minimal` continua a nasconderli, e `tools.deny: ["bundle-mcp"]`
  li disabilita esplicitamente

## Definizioni salvate dei server MCP

OpenClaw memorizza anche un registro leggero dei server MCP nella configurazione per le superfici
che vogliono definizioni MCP gestite da OpenClaw.

Comandi:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Note:

- `list` ordina i nomi dei server.
- `show` senza nome stampa l'intero oggetto dei server MCP configurati.
- `set` si aspetta un valore oggetto JSON sulla riga di comando.
- `unset` fallisce se il server nominato non esiste.

Esempi:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Esempio di struttura della configurazione:

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

| Campo                     | Descrizione                             |
| ------------------------- | --------------------------------------- |
| `command`                 | Eseguibile da avviare (obbligatorio)    |
| `args`                    | Array di argomenti da riga di comando   |
| `env`                     | Variabili di ambiente aggiuntive        |
| `cwd` / `workingDirectory` | Directory di lavoro per il processo    |

#### Filtro di sicurezza env stdio

OpenClaw rifiuta le chiavi env di avvio dell'interprete che possono alterare il modo in cui un server MCP stdio si avvia prima del primo RPC, anche se compaiono nel blocco `env` di un server. Le chiavi bloccate includono `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` e variabili simili di controllo del runtime. L'avvio rifiuta queste chiavi con un errore di configurazione in modo che non possano iniettare un preludio implicito, sostituire l'interprete o abilitare un debugger contro il processo stdio. Le normali variabili env di credenziali, proxy e specifiche del server (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizzate, ecc.) non sono interessate.

Se il tuo server MCP ha davvero bisogno di una delle variabili bloccate, impostala sul processo host del gateway invece che sotto `env` del server stdio.

### Trasporto SSE / HTTP

Si connette a un server MCP remoto tramite HTTP Server-Sent Events.

| Campo                | Descrizione                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `url`                | URL HTTP o HTTPS del server remoto (obbligatorio)                |
| `headers`            | Mappa facoltativa chiave-valore di header HTTP (ad esempio token di autenticazione) |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (facoltativo)           |

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

### Trasporto HTTP streamable

`streamable-http` è un'ulteriore opzione di trasporto insieme a `sse` e `stdio`. Usa lo streaming HTTP per la comunicazione bidirezionale con server MCP remoti.

| Campo                | Descrizione                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `url`                | URL HTTP o HTTPS del server remoto (obbligatorio)                                          |
| `transport`          | Imposta `"streamable-http"` per selezionare questo trasporto; se omesso, OpenClaw usa `sse` |
| `headers`            | Mappa facoltativa chiave-valore di header HTTP (ad esempio token di autenticazione)        |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (facoltativo)                                     |

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

Questi comandi gestiscono solo la configurazione salvata. Non avviano il bridge di canale,
non aprono una sessione client MCP live e non dimostrano che il server di destinazione sia raggiungibile.

## Limiti attuali

Questa pagina documenta il bridge così come distribuito oggi.

Limiti attuali:

- l'individuazione delle conversazioni dipende dai metadati di instradamento delle sessioni Gateway esistenti
- nessun protocollo push generico oltre all'adattatore specifico di Claude
- nessuno strumento per modifica o reazione ai messaggi per ora
- il trasporto HTTP/SSE/streamable-http si connette a un singolo server remoto; nessun upstream multiplexato per ora
- `permissions_list_open` include solo le approvazioni osservate mentre il bridge è
  connesso

## Correlati

- [Riferimento CLI](/it/cli)
- [Plugin](/it/cli/plugins)
