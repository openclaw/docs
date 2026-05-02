---
read_when:
    - Collegare Codex, Claude Code o un altro client MCP a canali basati su OpenClaw
    - Esecuzione di `openclaw mcp serve`
    - Gestione delle definizioni dei server MCP salvate da OpenClaw
sidebarTitle: MCP
summary: Esporre le conversazioni dei canali OpenClaw tramite MCP e gestire le definizioni salvate dei server MCP
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:42:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` ha due compiti:

- eseguire OpenClaw come server MCP con `openclaw mcp serve`
- gestire le definizioni dei server MCP in uscita di proprietà di OpenClaw con `list`, `show`, `set` e `unset`

In altre parole:

- `serve` è OpenClaw che agisce come server MCP
- `list` / `show` / `set` / `unset` è OpenClaw che agisce come registro lato client MCP per altri server MCP che i suoi runtime potrebbero consumare in seguito

Usa [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente una sessione di harness di programmazione e instradare quel runtime tramite ACP.

## OpenClaw come server MCP

Questo è il percorso `openclaw mcp serve`.

### Quando usare `serve`

Usa `openclaw mcp serve` quando:

- Codex, Claude Code o un altro client MCP deve parlare direttamente con conversazioni di canali supportate da OpenClaw
- hai già un Gateway OpenClaw locale o remoto con sessioni instradate
- vuoi un unico server MCP che funzioni su tutti i backend di canale di OpenClaw invece di eseguire bridge separati per canale

Usa invece [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente il runtime di programmazione e mantenere la sessione agente dentro OpenClaw.

### Come funziona

`openclaw mcp serve` avvia un server MCP stdio. Il client MCP possiede quel processo. Finché il client mantiene aperta la sessione stdio, il bridge si connette a un Gateway OpenClaw locale o remoto tramite WebSocket ed espone le conversazioni di canale instradate tramite MCP.

<Steps>
  <Step title="Il client avvia il bridge">
    Il client MCP avvia `openclaw mcp serve`.
  </Step>
  <Step title="Il bridge si connette al Gateway">
    Il bridge si connette al Gateway OpenClaw tramite WebSocket.
  </Step>
  <Step title="Le sessioni diventano conversazioni MCP">
    Le sessioni instradate diventano conversazioni MCP e strumenti di trascrizione/cronologia.
  </Step>
  <Step title="Coda degli eventi live">
    Gli eventi live vengono messi in coda in memoria mentre il bridge è connesso.
  </Step>
  <Step title="Push Claude opzionale">
    Se la modalità canale Claude è abilitata, la stessa sessione può anche ricevere notifiche push specifiche di Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - lo stato della coda live inizia quando il bridge si connette
    - la cronologia precedente della trascrizione viene letta con `messages_read`
    - le notifiche push Claude esistono solo mentre la sessione MCP è attiva
    - quando il client si disconnette, il bridge termina e la coda live scompare
    - i punti di ingresso agente one-shot come `openclaw agent` e `openclaw infer model run` ritirano qualsiasi runtime MCP incluso che aprono quando la risposta viene completata, quindi le esecuzioni scriptate ripetute non accumulano processi figli MCP stdio
    - i server MCP stdio avviati da OpenClaw (inclusi o configurati dall'utente) vengono arrestati come albero di processi allo spegnimento, quindi i sottoprocessi figli avviati dal server non sopravvivono dopo l'uscita del client stdio padre
    - l'eliminazione o il ripristino di una sessione elimina i client MCP di quella sessione tramite il percorso condiviso di pulizia del runtime, quindi non restano connessioni stdio pendenti legate a una sessione rimossa

  </Accordion>
</AccordionGroup>

### Scegliere una modalità client

Usa lo stesso bridge in due modi diversi:

<Tabs>
  <Tab title="Client MCP generici">
    Solo strumenti MCP standard. Usa `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` e gli strumenti di approvazione.
  </Tab>
  <Tab title="Claude Code">
    Strumenti MCP standard più l'adattatore di canale specifico di Claude. Abilita `--claude-channel-mode on` o lascia il valore predefinito `auto`.
  </Tab>
</Tabs>

<Note>
Oggi, `auto` si comporta come `on`. Non esiste ancora il rilevamento delle capacità del client.
</Note>

### Cosa espone `serve`

Il bridge usa i metadati esistenti delle rotte di sessione del Gateway per esporre conversazioni supportate dai canali. Una conversazione appare quando OpenClaw ha già uno stato di sessione con una rotta nota, ad esempio:

- `channel`
- metadati di destinatario o destinazione
- `accountId` opzionale
- `threadId` opzionale

Questo offre ai client MCP un unico punto per:

- elencare le conversazioni instradate recenti
- leggere la cronologia recente delle trascrizioni
- attendere nuovi eventi in ingresso
- inviare una risposta tramite la stessa rotta
- vedere le richieste di approvazione che arrivano mentre il bridge è connesso

### Utilizzo

<Tabs>
  <Tab title="Gateway locale">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway remoto (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway remoto (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Dettagliato / Claude disattivato">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Strumenti del bridge

Il bridge attuale espone questi strumenti MCP:

<AccordionGroup>
  <Accordion title="conversations_list">
    Elenca le conversazioni recenti supportate da sessione che hanno già metadati di rotta nello stato di sessione del Gateway.

    Filtri utili:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Restituisce una conversazione tramite `session_key` usando una ricerca diretta della sessione Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Legge i messaggi recenti della trascrizione per una conversazione supportata da sessione.
  </Accordion>
  <Accordion title="attachments_fetch">
    Estrae i blocchi di contenuto non testuale da un messaggio della trascrizione. Questa è una vista dei metadati sul contenuto della trascrizione, non un archivio standalone durevole di blob allegati.
  </Accordion>
  <Accordion title="events_poll">
    Legge gli eventi live in coda da un cursore numerico.
  </Accordion>
  <Accordion title="events_wait">
    Esegue long polling finché non arriva il prossimo evento in coda corrispondente o scade un timeout.

    Usalo quando un client MCP generico ha bisogno di consegna quasi in tempo reale senza un protocollo push specifico di Claude.

  </Accordion>
  <Accordion title="messages_send">
    Invia testo tramite la stessa rotta già registrata nella sessione.

    Comportamento attuale:

    - richiede una rotta di conversazione esistente
    - usa il canale, il destinatario, l'ID account e l'ID thread della sessione
    - invia solo testo

  </Accordion>
  <Accordion title="permissions_list_open">
    Elenca le richieste di approvazione exec/Plugin in sospeso osservate dal bridge da quando si è connesso al Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Risolve una richiesta di approvazione exec/Plugin in sospeso con:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modello degli eventi

Il bridge mantiene una coda di eventi in memoria mentre è connesso.

Tipi di evento attuali:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la coda è solo live; inizia quando il bridge MCP si avvia
- `events_poll` ed `events_wait` non riproducono da soli la cronologia precedente del Gateway
- il backlog durevole deve essere letto con `messages_read`

</Warning>

### Notifiche canale Claude

Il bridge può anche esporre notifiche di canale specifiche di Claude. Questo è l'equivalente OpenClaw di un adattatore di canale Claude Code: gli strumenti MCP standard restano disponibili, ma i messaggi live in ingresso possono anche arrivare come notifiche MCP specifiche di Claude.

<Tabs>
  <Tab title="disattivato">
    `--claude-channel-mode off`: solo strumenti MCP standard.
  </Tab>
  <Tab title="attivato">
    `--claude-channel-mode on`: abilita le notifiche del canale Claude.
  </Tab>
  <Tab title="auto (predefinito)">
    `--claude-channel-mode auto`: impostazione predefinita attuale; stesso comportamento del bridge di `on`.
  </Tab>
</Tabs>

Quando la modalità canale Claude è abilitata, il server annuncia capacità sperimentali Claude e può emettere:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento attuale del bridge:

- i messaggi di trascrizione `user` in ingresso vengono inoltrati come `notifications/claude/channel`
- le richieste di permesso Claude ricevute tramite MCP vengono tracciate in memoria
- se la conversazione collegata invia in seguito `yes abcde` o `no abcde`, il bridge lo converte in `notifications/claude/channel/permission`
- queste notifiche sono solo per la sessione live; se il client MCP si disconnette, non c'è alcun destinatario push

Questo è intenzionalmente specifico del client. I client MCP generici dovrebbero basarsi sugli strumenti standard di polling.

### Configurazione client MCP

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

Per la maggior parte dei client MCP generici, inizia con la superficie di strumenti standard e ignora la modalità Claude. Attiva la modalità Claude solo per i client che comprendono effettivamente i metodi di notifica specifici di Claude.

### Opzioni

`openclaw mcp serve` supporta:

<ParamField path="--url" type="string">
  URL WebSocket del Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Token del Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Legge il token da file.
</ParamField>
<ParamField path="--password" type="string">
  Password del Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Legge la password da file.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modalità notifiche Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Log dettagliati su stderr.
</ParamField>

<Tip>
Preferisci `--token-file` o `--password-file` ai segreti inline quando possibile.
</Tip>

### Sicurezza e limite di fiducia

Il bridge non inventa l'instradamento. Espone solo le conversazioni che il Gateway sa già come instradare.

Questo significa che:

- allowlist dei mittenti, pairing e fiducia a livello di canale appartengono ancora alla configurazione del canale OpenClaw sottostante
- `messages_send` può rispondere solo tramite una rotta archiviata esistente
- lo stato di approvazione è live/in memoria solo per la sessione bridge attuale
- l'autenticazione del bridge dovrebbe usare gli stessi controlli tramite token o password del Gateway che considereresti affidabili per qualsiasi altro client Gateway remoto

Se una conversazione manca da `conversations_list`, la causa abituale non è la configurazione MCP. Sono metadati di rotta mancanti o incompleti nella sessione Gateway sottostante.

### Test

OpenClaw include uno smoke Docker deterministico per questo bridge:

```bash
pnpm test:docker:mcp-channels
```

Quello smoke:

- avvia un container Gateway con seed
- avvia un secondo container che esegue `openclaw mcp serve`
- verifica discovery delle conversazioni, letture delle trascrizioni, letture dei metadati degli allegati, comportamento della coda di eventi live e instradamento degli invii in uscita
- convalida notifiche di canale e permesso in stile Claude tramite il vero bridge MCP stdio

Questo è il modo più rapido per dimostrare che il bridge funziona senza collegare un account reale Telegram, Discord o iMessage all'esecuzione del test.

Per un contesto di test più ampio, vedi [Test](/it/help/testing).

### Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna conversazione restituita">
    Di solito significa che la sessione Gateway non è già instradabile. Conferma che la sessione sottostante abbia canale/provider, destinatario e metadati opzionali di rotta account/thread archiviati.
  </Accordion>
  <Accordion title="events_poll o events_wait non trova messaggi più vecchi">
    Previsto. La coda live inizia quando il bridge si connette. Leggi la cronologia precedente delle trascrizioni con `messages_read`.
  </Accordion>
  <Accordion title="Le notifiche Claude non vengono visualizzate">
    Controlla tutti questi elementi:

    - il client ha mantenuto aperta la sessione MCP stdio
    - `--claude-channel-mode` è `on` o `auto`
    - il client comprende effettivamente i metodi di notifica specifici di Claude
    - il messaggio in ingresso è arrivato dopo la connessione del bridge

  </Accordion>
  <Accordion title="Le approvazioni mancano">
    `permissions_list_open` mostra solo le richieste di approvazione osservate mentre il bridge era connesso. Non è un'API di cronologia delle approvazioni durevole.
  </Accordion>
</AccordionGroup>

## OpenClaw come registro client MCP

Questo è il percorso `openclaw mcp list`, `show`, `set` e `unset`.

Questi comandi non espongono OpenClaw tramite MCP. Gestiscono le definizioni dei server MCP di proprietà di OpenClaw sotto `mcp.servers` nella configurazione di OpenClaw.

Le definizioni salvate sono destinate ai runtime che OpenClaw avvia o configura in seguito, come Pi integrato e altri adattatori runtime. OpenClaw archivia le definizioni centralmente così che tali runtime non debbano mantenere i propri elenchi duplicati di server MCP.

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - questi comandi leggono o scrivono solo la configurazione di OpenClaw
    - non si connettono al server MCP di destinazione
    - non verificano se il comando, l'URL o il trasporto remoto sono raggiungibili in questo momento
    - gli adattatori runtime decidono quali forme di trasporto supportano effettivamente al momento dell'esecuzione
    - Pi integrato espone gli strumenti MCP configurati nei normali profili strumenti `coding` e `messaging`; `minimal` continua a nasconderli, e `tools.deny: ["bundle-mcp"]` li disabilita esplicitamente
    - i runtime MCP in bundle con ambito di sessione vengono eliminati dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (predefinito 10 minuti; imposta `0` per disabilitare) e le esecuzioni integrate una tantum li ripuliscono al termine dell'esecuzione

  </Accordion>
</AccordionGroup>

Gli adattatori runtime possono normalizzare questo registro condiviso nella forma attesa dal loro client downstream. Ad esempio, Pi integrato consuma direttamente i valori `transport` di OpenClaw, mentre Claude Code e Gemini ricevono valori `type` nativi della CLI come `http`, `sse` o `stdio`.

### Definizioni salvate dei server MCP

OpenClaw archivia anche un registro leggero dei server MCP nella configurazione per le superfici che vogliono definizioni MCP gestite da OpenClaw.

Comandi:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Note:

- `list` ordina i nomi dei server.
- `show` senza un nome stampa l'intero oggetto del server MCP configurato.
- `set` si aspetta un valore oggetto JSON sulla riga di comando.
- Usa `transport: "streamable-http"` per i server MCP Streamable HTTP. `openclaw mcp set` normalizza anche `type: "http"` nativo della CLI nella stessa forma di configurazione canonica per compatibilità.
- `unset` non riesce se il server indicato non esiste.

Esempi:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
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
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Trasporto stdio

Avvia un processo figlio locale e comunica tramite stdin/stdout.

| Campo                      | Descrizione                                   |
| -------------------------- | --------------------------------------------- |
| `command`                  | Eseguibile da generare (obbligatorio)         |
| `args`                     | Array di argomenti della riga di comando      |
| `env`                      | Variabili d'ambiente aggiuntive               |
| `cwd` / `workingDirectory` | Directory di lavoro per il processo           |

<Warning>
**Filtro di sicurezza env per stdio**

OpenClaw rifiuta le chiavi env di avvio dell'interprete che possono modificare il modo in cui un server MCP stdio si avvia prima della prima RPC, anche se compaiono nel blocco `env` di un server. Le chiavi bloccate includono `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` e variabili simili di controllo del runtime. L'avvio le rifiuta con un errore di configurazione così che non possano iniettare un preambolo implicito, sostituire l'interprete o abilitare un debugger contro il processo stdio. Le normali variabili env per credenziali, proxy e specifiche del server (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizzate, ecc.) non sono interessate.

Se il tuo server MCP ha davvero bisogno di una delle variabili bloccate, impostala sul processo host del Gateway invece che sotto `env` del server stdio.
</Warning>

### Trasporto SSE / HTTP

Si connette a un server MCP remoto tramite HTTP Server-Sent Events.

| Campo                 | Descrizione                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                      |
| `headers`             | Mappa chiave-valore opzionale di intestazioni HTTP (ad esempio token di autenticazione) |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (opzionale)                    |

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

I valori sensibili in `url` (userinfo) e `headers` vengono oscurati nei log e nell'output di stato.

### Trasporto Streamable HTTP

`streamable-http` è un'opzione di trasporto aggiuntiva insieme a `sse` e `stdio`. Usa lo streaming HTTP per la comunicazione bidirezionale con server MCP remoti.

| Campo                 | Descrizione                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                                      |
| `transport`           | Imposta a `"streamable-http"` per selezionare questo trasporto; se omesso, OpenClaw usa `sse` |
| `headers`             | Mappa chiave-valore opzionale di intestazioni HTTP (ad esempio token di autenticazione) |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (opzionale)                                    |

La configurazione di OpenClaw usa `transport: "streamable-http"` come grafia canonica. I valori MCP `type: "http"` nativi della CLI sono accettati quando salvati tramite `openclaw mcp set` e riparati da `openclaw doctor --fix` nella configurazione esistente, ma `transport` è ciò che Pi integrato consuma direttamente.

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

<Note>
Questi comandi gestiscono solo la configurazione salvata. Non avviano il bridge del canale, non aprono una sessione client MCP live e non dimostrano che il server di destinazione sia raggiungibile.
</Note>

## Limiti attuali

Questa pagina documenta il bridge così come distribuito oggi.

Limiti attuali:

- la scoperta delle conversazioni dipende dai metadati di route delle sessioni Gateway esistenti
- nessun protocollo push generico oltre all'adattatore specifico di Claude
- nessuno strumento per modificare o reagire ai messaggi per ora
- il trasporto HTTP/SSE/streamable-http si connette a un singolo server remoto; nessun upstream multiplexed per ora
- `permissions_list_open` include solo le approvazioni osservate mentre il bridge è connesso

## Correlati

- [Riferimento CLI](/it/cli)
- [Plugins](/it/cli/plugins)
