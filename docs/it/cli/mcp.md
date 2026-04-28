---
read_when:
    - Collegare Codex, Claude Code o un altro client MCP a canali supportati da OpenClaw
    - Eseguire `openclaw mcp serve`
    - Gestire le definizioni dei server MCP salvate in OpenClaw
sidebarTitle: MCP
summary: Esponi le conversazioni dei canali OpenClaw tramite MCP e gestisci le definizioni salvate dei server MCP
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` ha due funzioni:

- eseguire OpenClaw come server MCP con `openclaw mcp serve`
- gestire le definizioni dei server MCP in uscita di proprietà di OpenClaw con `list`, `show`, `set` e `unset`

In altre parole:

- `serve` è OpenClaw che agisce come server MCP
- `list` / `show` / `set` / `unset` è OpenClaw che agisce come registro lato client MCP per altri server MCP che i suoi runtime potrebbero usare in seguito

Usa [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente una sessione di harness di coding e instradare quel runtime tramite ACP.

## OpenClaw come server MCP

Questo è il percorso `openclaw mcp serve`.

### Quando usare `serve`

Usa `openclaw mcp serve` quando:

- Codex, Claude Code o un altro client MCP devono parlare direttamente con conversazioni di canale supportate da OpenClaw
- hai già un Gateway OpenClaw locale o remoto con sessioni instradate
- vuoi un unico server MCP che funzioni attraverso i backend di canale di OpenClaw invece di eseguire bridge separati per ogni canale

Usa invece [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente il runtime di coding e mantenere la sessione agente all'interno di OpenClaw.

### Come funziona

`openclaw mcp serve` avvia un server MCP stdio. Il client MCP possiede quel processo. Finché il client mantiene aperta la sessione stdio, il bridge si connette a un Gateway OpenClaw locale o remoto tramite WebSocket ed espone tramite MCP le conversazioni di canale instradate.

<Steps>
  <Step title="Il client avvia il bridge">
    Il client MCP avvia `openclaw mcp serve`.
  </Step>
  <Step title="Il bridge si connette al Gateway">
    Il bridge si connette al Gateway OpenClaw tramite WebSocket.
  </Step>
  <Step title="Le sessioni diventano conversazioni MCP">
    Le sessioni instradate diventano conversazioni MCP e strumenti di transcript/cronologia.
  </Step>
  <Step title="Coda degli eventi live">
    Gli eventi live vengono accodati in memoria mentre il bridge è connesso.
  </Step>
  <Step title="Push Claude facoltativo">
    Se è abilitata la modalità canale Claude, la stessa sessione può anche ricevere notifiche push specifiche di Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - lo stato della coda live inizia quando il bridge si connette
    - la cronologia transcript più vecchia viene letta con `messages_read`
    - le notifiche push Claude esistono solo mentre la sessione MCP è attiva
    - quando il client si disconnette, il bridge termina e la coda live viene persa
    - i punti di ingresso agente one-shot come `openclaw agent` e `openclaw infer model run` ritirano tutti i runtime MCP inclusi che aprono quando la risposta è completata, quindi le esecuzioni scriptate ripetute non accumulano processi figli MCP stdio
    - i server MCP stdio avviati da OpenClaw (inclusi nel bundle o configurati dall'utente) vengono chiusi come albero di processi allo spegnimento, quindi i sottoprocessi figli avviati dal server non sopravvivono dopo l'uscita del client stdio padre
    - eliminare o reimpostare una sessione smaltisce i client MCP di quella sessione tramite il percorso condiviso di cleanup del runtime, quindi non restano connessioni stdio pendenti legate a una sessione rimossa

  </Accordion>
</AccordionGroup>

### Scegliere una modalità client

Usa lo stesso bridge in due modi diversi:

<Tabs>
  <Tab title="Client MCP generici">
    Solo strumenti MCP standard. Usa `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` e gli strumenti di approvazione.
  </Tab>
  <Tab title="Claude Code">
    Strumenti MCP standard più l'adattatore di canale specifico per Claude. Abilita `--claude-channel-mode on` oppure lascia il valore predefinito `auto`.
  </Tab>
</Tabs>

<Note>
Attualmente, `auto` si comporta allo stesso modo di `on`. Non esiste ancora il rilevamento delle capacità del client.
</Note>

### Cosa espone `serve`

Il bridge usa i metadati di route delle sessioni Gateway esistenti per esporre conversazioni supportate da canali. Una conversazione appare quando OpenClaw ha già uno stato di sessione con una route nota come:

- `channel`
- metadati del destinatario o della destinazione
- `accountId` facoltativo
- `threadId` facoltativo

Questo offre ai client MCP un unico punto in cui:

- elencare le conversazioni instradate recenti
- leggere la cronologia transcript recente
- attendere nuovi eventi in entrata
- inviare una risposta indietro attraverso la stessa route
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
  <Tab title="Verboso / Claude disattivato">
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
    Elenca le conversazioni recenti supportate da sessione che hanno già metadati di route nello stato di sessione del Gateway.

    Filtri utili:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Restituisce una conversazione in base a `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Legge i messaggi transcript recenti per una conversazione supportata da sessione.
  </Accordion>
  <Accordion title="attachments_fetch">
    Estrae i blocchi di contenuto dei messaggi non testuali da un messaggio transcript. Questa è una vista di metadati sul contenuto del transcript, non un archivio blob di allegati standalone e persistente.
  </Accordion>
  <Accordion title="events_poll">
    Legge gli eventi live accodati a partire da un cursore numerico.
  </Accordion>
  <Accordion title="events_wait">
    Esegue un long-poll finché non arriva il successivo evento accodato corrispondente oppure scade un timeout.

    Usalo quando un client MCP generico ha bisogno di una consegna quasi in tempo reale senza un protocollo push specifico per Claude.

  </Accordion>
  <Accordion title="messages_send">
    Invia testo indietro attraverso la stessa route già registrata nella sessione.

    Comportamento attuale:

    - richiede una route di conversazione esistente
    - usa il canale, il destinatario, l'id account e l'id thread della sessione
    - invia solo testo

  </Accordion>
  <Accordion title="permissions_list_open">
    Elenca le richieste di approvazione exec/Plugin in sospeso che il bridge ha osservato da quando si è connesso al Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Risolve una richiesta di approvazione exec/Plugin in sospeso con:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modello di eventi

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
- `events_poll` e `events_wait` non riproducono da soli la cronologia Gateway più vecchia
- il backlog persistente deve essere letto con `messages_read`

</Warning>

### Notifiche di canale Claude

Il bridge può anche esporre notifiche di canale specifiche per Claude. Questo è l'equivalente OpenClaw di un adattatore di canale Claude Code: gli strumenti MCP standard restano disponibili, ma i nuovi messaggi in entrata possono arrivare anche come notifiche MCP specifiche per Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: solo strumenti MCP standard.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: abilita le notifiche di canale Claude.
  </Tab>
  <Tab title="auto (predefinito)">
    `--claude-channel-mode auto`: predefinito attuale; stesso comportamento del bridge di `on`.
  </Tab>
</Tabs>

Quando la modalità canale Claude è abilitata, il server pubblicizza capacità sperimentali Claude e può emettere:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento attuale del bridge:

- i messaggi transcript `user` in entrata vengono inoltrati come `notifications/claude/channel`
- le richieste di autorizzazione Claude ricevute tramite MCP vengono tracciate in memoria
- se in seguito la conversazione collegata invia `yes abcde` o `no abcde`, il bridge lo converte in `notifications/claude/channel/permission`
- queste notifiche sono solo per la sessione live; se il client MCP si disconnette, non esiste un target push

Questo è intenzionalmente specifico del client. I client MCP generici dovrebbero affidarsi agli strumenti di polling standard.

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

Per la maggior parte dei client MCP generici, inizia con la superficie degli strumenti standard e ignora la modalità Claude. Attiva la modalità Claude solo per i client che comprendono effettivamente i metodi di notifica specifici per Claude.

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
  Modalità di notifica Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Log verbosi su stderr.
</ParamField>

<Tip>
Quando possibile, preferisci `--token-file` o `--password-file` rispetto ai segreti inline.
</Tip>

### Sicurezza e confine di fiducia

Il bridge non inventa il routing. Espone solo le conversazioni che il Gateway sa già come instradare.

Questo significa che:

- allowlist dei mittenti, pairing e trust a livello di canale appartengono ancora alla configurazione di canale OpenClaw sottostante
- `messages_send` può rispondere solo attraverso una route memorizzata esistente
- lo stato di approvazione è solo live/in memoria per la sessione corrente del bridge
- l'autenticazione del bridge dovrebbe usare gli stessi controlli di token o password del Gateway di cui ti fideresti per qualsiasi altro client Gateway remoto

Se una conversazione manca da `conversations_list`, la causa abituale non è la configurazione MCP. Sono metadati di route mancanti o incompleti nella sessione Gateway sottostante.

### Test

OpenClaw include uno smoke Docker deterministico per questo bridge:

```bash
pnpm test:docker:mcp-channels
```

Questo smoke:

- avvia un container Gateway inizializzato
- avvia un secondo container che esegue `openclaw mcp serve`
- verifica individuazione delle conversazioni, letture transcript, letture dei metadati degli allegati, comportamento della coda di eventi live e routing dell'invio in uscita
- valida notifiche in stile canale e autorizzazione Claude sul bridge MCP stdio reale

Questo è il modo più rapido per dimostrare che il bridge funziona senza collegare un account Telegram, Discord o iMessage reale all'esecuzione del test.

Per un contesto di test più ampio, vedi [Testing](/it/help/testing).

### Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna conversazione restituita">
    Di solito significa che la sessione Gateway non è già instradabile. Verifica che la sessione sottostante abbia memorizzato i metadati di route di canale/provider, destinatario e account/thread facoltativi.
  </Accordion>
  <Accordion title="events_poll o events_wait non vedono i messaggi più vecchi">
    Previsto. La coda live inizia quando il bridge si connette. Leggi la cronologia transcript precedente con `messages_read`.
  </Accordion>
  <Accordion title="Le notifiche Claude non compaiono">
    Controlla tutti questi punti:

    - il client ha mantenuto aperta la sessione MCP stdio
    - `--claude-channel-mode` è `on` o `auto`
    - il client comprende davvero i metodi di notifica specifici per Claude
    - il messaggio in entrata è arrivato dopo la connessione del bridge

  </Accordion>
  <Accordion title="Le approvazioni mancano">
    `permissions_list_open` mostra solo le richieste di approvazione osservate mentre il bridge era connesso. Non è un'API di cronologia delle approvazioni persistente.
  </Accordion>
</AccordionGroup>

## OpenClaw come registro client MCP

Questo è il percorso `openclaw mcp list`, `show`, `set` e `unset`.

Questi comandi non espongono OpenClaw tramite MCP. Gestiscono le definizioni dei server MCP di proprietà di OpenClaw sotto `mcp.servers` nella configurazione di OpenClaw.

Queste definizioni salvate servono per runtime che OpenClaw avvia o configura in seguito, come Pi incorporato e altri adattatori di runtime. OpenClaw memorizza centralmente le definizioni così questi runtime non devono mantenere i propri elenchi duplicati di server MCP.

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - questi comandi leggono o scrivono solo la configurazione di OpenClaw
    - non si connettono al server MCP di destinazione
    - non verificano se il comando, l'URL o il trasporto remoto siano raggiungibili in questo momento
    - gli adattatori di runtime decidono quali forme di trasporto supportano effettivamente al momento dell'esecuzione
    - Pi incorporato espone gli strumenti MCP configurati nei normali profili strumento `coding` e `messaging`; `minimal` continua a nasconderli, e `tools.deny: ["bundle-mcp"]` li disabilita esplicitamente
    - i runtime MCP inclusi nel bundle con ambito sessione vengono eliminati dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (predefinito 10 minuti; imposta `0` per disabilitare) e le esecuzioni incorporate one-shot li ripuliscono alla fine dell'esecuzione

  </Accordion>
</AccordionGroup>

Gli adattatori di runtime possono normalizzare questo registro condiviso nella forma attesa dal loro client downstream. Per esempio, Pi incorporato usa direttamente i valori `transport` di OpenClaw, mentre Claude Code e Gemini ricevono valori `type` nativi della CLI come `http`, `sse` o `stdio`.

### Definizioni salvate dei server MCP

OpenClaw memorizza anche in configurazione un registro leggero dei server MCP per le superfici che vogliono definizioni MCP gestite da OpenClaw.

Comandi:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Note:

- `list` ordina i nomi dei server.
- `show` senza nome stampa l'intero oggetto configurato dei server MCP.
- `set` si aspetta sulla riga di comando un singolo valore oggetto JSON.
- `unset` fallisce se il server indicato non esiste.

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

| Campo                      | Descrizione                           |
| -------------------------- | ------------------------------------- |
| `command`                  | Eseguibile da avviare (obbligatorio)  |
| `args`                     | Array di argomenti da riga di comando |
| `env`                      | Variabili d'ambiente aggiuntive       |
| `cwd` / `workingDirectory` | Directory di lavoro per il processo   |

<Warning>
**Filtro di sicurezza env stdio**

OpenClaw rifiuta le chiavi env di avvio dell'interprete che possono alterare il modo in cui un server MCP stdio si avvia prima della prima RPC, anche se compaiono nel blocco `env` del server. Le chiavi bloccate includono `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` e variabili simili di controllo del runtime. L'avvio rifiuta queste chiavi con un errore di configurazione, così non possono iniettare un preludio implicito, sostituire l'interprete o abilitare un debugger contro il processo stdio. Le normali variabili d'ambiente per credenziali, proxy e specifiche del server (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizzate, ecc.) non vengono toccate.

Se il tuo server MCP ha davvero bisogno di una delle variabili bloccate, impostala sul processo host del Gateway invece che sotto `env` del server stdio.
</Warning>

### Trasporto SSE / HTTP

Si connette a un server MCP remoto tramite HTTP Server-Sent Events.

| Campo                 | Descrizione                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                    |
| `headers`             | Mappa facoltativa chiave-valore di header HTTP (per esempio token auth) |
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

I valori sensibili in `url` (userinfo) e `headers` vengono oscurati nei log e nell'output di stato.

### Trasporto HTTP streamable

`streamable-http` è un'opzione di trasporto aggiuntiva accanto a `sse` e `stdio`. Usa streaming HTTP per la comunicazione bidirezionale con server MCP remoti.

| Campo                 | Descrizione                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                                            |
| `transport`           | Imposta `"streamable-http"` per selezionare questo trasporto; se omesso, OpenClaw usa `sse` |
| `headers`             | Mappa facoltativa chiave-valore di header HTTP (per esempio token auth)                      |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (facoltativo)                                        |

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
Questi comandi gestiscono solo la configurazione salvata. Non avviano il bridge di canale, non aprono una sessione client MCP live e non dimostrano che il server di destinazione sia raggiungibile.
</Note>

## Limiti attuali

Questa pagina documenta il bridge così come viene distribuito oggi.

Limiti attuali:

- l'individuazione delle conversazioni dipende dai metadati di route delle sessioni Gateway esistenti
- nessun protocollo push generico oltre all'adattatore specifico per Claude
- ancora nessuno strumento per modifica dei messaggi o reazioni
- il trasporto HTTP/SSE/streamable-http si connette a un singolo server remoto; nessun upstream multiplexato per ora
- `permissions_list_open` include solo le approvazioni osservate mentre il bridge è connesso

## Correlati

- [Riferimento CLI](/it/cli)
- [Plugin](/it/cli/plugins)
