---
read_when:
    - Connessione di Codex, Claude Code o un altro client MCP ai canali supportati da OpenClaw
    - Esecuzione di `openclaw mcp serve`
    - Gestione delle definizioni dei server MCP salvate da OpenClaw
sidebarTitle: MCP
summary: Esponi le conversazioni dei canali OpenClaw tramite MCP e gestisci le definizioni salvate dei server MCP
title: MCP
x-i18n:
    generated_at: "2026-07-16T14:13:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` svolge due funzioni:

- eseguire OpenClaw come server MCP con `openclaw mcp serve`
- gestire le definizioni dei server MCP in uscita amministrate da OpenClaw con `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` e `unset`

`serve` corrisponde a OpenClaw che opera come server MCP. Gli altri sottocomandi corrispondono a OpenClaw che opera come registro lato client MCP per server che i suoi runtime potranno utilizzare in seguito.

<Note>
  `list`, `show`, `set` e `unset` leggono e scrivono esclusivamente le voci `mcp.servers` gestite da OpenClaw nella configurazione di OpenClaw. Non includono i server mcporter da `config/mcporter.json`; per tale registro, utilizzare `mcporter list`.
</Note>

Utilizzare [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente una sessione di harness di programmazione e instradare tale runtime tramite ACP.

## Scegliere il percorso MCP corretto

| Obiettivo                                                                | Utilizzare                                                                  | Motivo                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Consentire a un client MCP esterno di leggere/inviare conversazioni dei canali OpenClaw | `openclaw mcp serve`                                                 | OpenClaw è il server MCP ed espone tramite stdio le conversazioni supportate dal Gateway.                                 |
| Salvare server MCP di terze parti per le esecuzioni degli agenti gestite da OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw è il registro lato client MCP e successivamente proietta tali server nei runtime idonei.               |
| Verificare un server salvato senza eseguire un turno dell'agente                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` e `doctor` esaminano la configurazione; `probe` apre una connessione MCP attiva ed elenca le funzionalità.               |
| Modificare la configurazione MCP da un browser                                      | `/settings/mcp` della Control UI (alias `/mcp`)                            | La pagina mostra l'inventario, lo stato di abilitazione, i riepiloghi OAuth/dei filtri, i suggerimenti per i comandi e un editor `mcp` con ambito limitato.         |
| Fornire a Codex app-server un server MCP nativo con ambito limitato                    | `mcp.servers.<name>.codex`                                           | Il blocco `codex` influisce esclusivamente sulla proiezione dei thread di Codex app-server e viene rimosso prima del passaggio della configurazione nativa. |
| Eseguire sessioni di harness ospitate tramite ACP                                     | [`openclaw acp`](/it/cli/acp) e [Agenti ACP](/it/tools/acp-agents-setup) | La modalità bridge ACP non accetta l'iniezione di server MCP per sessione; configurare invece i bridge del Gateway/Plugin.     |

<Tip>
In caso di dubbi sul percorso necessario, iniziare con `openclaw mcp status --verbose`. Mostra ciò che OpenClaw ha salvato senza avviare alcun server MCP.
</Tip>

## OpenClaw come server MCP

Questo è il percorso `openclaw mcp serve`.

### Quando utilizzare serve

Utilizzare `openclaw mcp serve` quando:

- Codex, Claude Code o un altro client MCP deve comunicare direttamente con le conversazioni dei canali supportate da OpenClaw
- è già disponibile un Gateway OpenClaw locale o remoto con sessioni instradate
- si desidera un unico server MCP che funzioni con tutti i backend dei canali di OpenClaw, anziché eseguire bridge separati per ciascun canale

Utilizzare invece [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente il runtime di programmazione e mantenere la sessione dell'agente all'interno di OpenClaw.

### Funzionamento

`openclaw mcp serve` avvia un server MCP stdio. Il client MCP è proprietario di tale processo. Finché il client mantiene aperta la sessione stdio, il bridge si connette tramite WebSocket a un Gateway OpenClaw locale o remoto ed espone le conversazioni dei canali instradate tramite MCP.

<Steps>
  <Step title="Il client genera il bridge">
    Il client MCP genera `openclaw mcp serve`.
  </Step>
  <Step title="Il bridge si connette al Gateway">
    Il bridge si connette al Gateway OpenClaw tramite WebSocket.
  </Step>
  <Step title="Le sessioni diventano conversazioni MCP">
    Le sessioni instradate diventano conversazioni MCP e strumenti per trascrizioni/cronologia.
  </Step>
  <Step title="Gli eventi in tempo reale vengono accodati">
    Gli eventi in tempo reale vengono accodati in memoria mentre il bridge è connesso.
  </Step>
  <Step title="Push Claude facoltativo">
    Se la modalità canale Claude è abilitata, la stessa sessione può ricevere anche notifiche push specifiche di Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - lo stato della coda in tempo reale inizia quando il bridge si connette
    - la cronologia delle trascrizioni precedenti viene letta con `messages_read`
    - le notifiche push di Claude esistono soltanto finché la sessione MCP è attiva
    - quando il client si disconnette, il bridge termina e la coda in tempo reale viene eliminata
    - i punti di ingresso dell'agente a esecuzione singola, come `openclaw agent` e `openclaw infer model run`, arrestano tutti i runtime MCP inclusi che aprono al completamento della risposta, evitando che esecuzioni ripetute tramite script accumulino processi figlio MCP stdio
    - i server MCP stdio avviati da OpenClaw (inclusi o configurati dall'utente) vengono terminati come albero di processi durante l'arresto, quindi i sottoprocessi figlio avviati dal server non rimangono attivi dopo la chiusura del client stdio principale
    - l'eliminazione o la reimpostazione di una sessione termina i client MCP di tale sessione tramite il percorso condiviso di pulizia del runtime, evitando connessioni stdio residue associate a una sessione rimossa

  </Accordion>
</AccordionGroup>

### Scegliere una modalità client

<Tabs>
  <Tab title="Client MCP generici">
    Solo strumenti MCP standard. Utilizzare `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` e gli strumenti di approvazione.
  </Tab>
  <Tab title="Claude Code">
    Strumenti MCP standard più l'adattatore di canale specifico di Claude. Abilitare `--claude-channel-mode on` oppure mantenere l'impostazione predefinita `auto`.
  </Tab>
</Tabs>

<Note>
Attualmente, `auto` si comporta come `on`. Il rilevamento delle funzionalità del client non è ancora disponibile.
</Note>

### Elementi esposti da serve

Il bridge utilizza i metadati di instradamento delle sessioni già presenti nel Gateway per esporre conversazioni supportate dai canali. Una conversazione viene visualizzata quando OpenClaw dispone già di uno stato di sessione con un percorso noto, ad esempio:

- `channel`
- metadati del destinatario o della destinazione
- `accountId` facoltativo
- `threadId` facoltativo

Ciò offre ai client MCP un unico punto da cui:

- elencare le conversazioni instradate recenti
- leggere la cronologia recente delle trascrizioni
- attendere nuovi eventi in ingresso
- inviare una risposta tramite lo stesso percorso
- visualizzare le richieste di approvazione ricevute mentre il bridge è connesso

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
  <Tab title="Output dettagliato / Claude disattivato">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Strumenti del bridge

<AccordionGroup>
  <Accordion title="conversations_list">
    Elenca le conversazioni recenti basate sulle sessioni che dispongono già di metadati di instradamento nello stato delle sessioni del Gateway.

    Filtri: `limit` (massimo 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Restituisce una conversazione tramite `session_key` utilizzando una ricerca diretta della sessione nel Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Legge i messaggi recenti della trascrizione per una conversazione basata su una sessione. Il valore predefinito di `limit` è 20, con un massimo di 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Estrae i blocchi di contenuto non testuale da un messaggio della trascrizione. Si tratta di una visualizzazione dei metadati relativa al contenuto della trascrizione, non di un archivio autonomo e persistente di blob degli allegati.
  </Accordion>
  <Accordion title="events_poll">
    Legge gli eventi in tempo reale accodati a partire da un cursore numerico. `limit` massimo 200.
  </Accordion>
  <Accordion title="events_wait">
    Esegue un long polling finché non arriva il successivo evento accodato corrispondente o non scade un timeout (valore predefinito 30s, massimo 300s).

    Utilizzare questa funzione quando un client MCP generico necessita di una consegna quasi in tempo reale senza un protocollo push specifico di Claude.

  </Accordion>
  <Accordion title="messages_send">
    Invia testo tramite lo stesso percorso già registrato nella sessione.

    Comportamento attuale:

    - richiede un percorso di conversazione esistente
    - utilizza il canale, il destinatario, l'id account e l'id thread della sessione
    - invia esclusivamente testo

  </Accordion>
  <Accordion title="permissions_list_open">
    Elenca le richieste di approvazione per esecuzioni/Plugin in sospeso osservate dal bridge da quando si è connesso al Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Risolve una richiesta di approvazione per esecuzioni/Plugin in sospeso con:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modello degli eventi

Il bridge mantiene una coda di eventi in memoria mentre è connesso.

Tipi di eventi attuali:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la coda è disponibile solo in tempo reale; viene inizializzata all'avvio del bridge MCP
- `events_poll` e `events_wait` non riproducono autonomamente la cronologia precedente del Gateway
- il backlog persistente deve essere letto con `messages_read`

</Warning>

### Notifiche del canale Claude

Il bridge può inoltre esporre notifiche specifiche del canale Claude. È l'equivalente OpenClaw di un adattatore di canale Claude Code: gli strumenti MCP standard rimangono disponibili, ma i messaggi in ingresso in tempo reale possono anche arrivare come notifiche MCP specifiche di Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: solo strumenti MCP standard.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: abilita le notifiche del canale Claude.
  </Tab>
  <Tab title="auto (predefinito)">
    `--claude-channel-mode auto`: impostazione predefinita attuale; stesso comportamento del bridge di `on`.
  </Tab>
</Tabs>

Quando la modalità canale Claude è abilitata, il server dichiara funzionalità sperimentali di Claude e può emettere:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento attuale del bridge:

- i messaggi della trascrizione `user` in ingresso vengono inoltrati come `notifications/claude/channel`
- le richieste di autorizzazione di Claude ricevute tramite MCP vengono registrate in memoria
- se il proprietario del comando nella conversazione collegata invia successivamente `yes <id>` o `no <id>` (`<id>` è l'id richiesta di 5 lettere, escluso `l`), il bridge lo converte in `notifications/claude/channel/permission`
- queste notifiche sono disponibili soltanto durante la sessione attiva; se il client MCP si disconnette, non esiste alcuna destinazione push

Questo comportamento è intenzionalmente specifico del client. I client MCP generici devono utilizzare gli strumenti di polling standard.

### Configurazione del client MCP

Esempio di configurazione di un client stdio:

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

Per la maggior parte dei client MCP generici, iniziare con la superficie di strumenti standard e ignorare la modalità Claude. Attivare la modalità Claude solo per i client che comprendono effettivamente i metodi di notifica specifici di Claude.

### Opzioni

`openclaw mcp serve` supporta:

<ParamField path="--url" type="string">
  URL WebSocket del Gateway. Il valore predefinito è `gateway.remote.url`, quando configurato.
</ParamField>
<ParamField path="--token" type="string">
  Token del Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Legge il token dal file.
</ParamField>
<ParamField path="--password" type="string">
  Password del Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Legge la password dal file.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modalità di notifica Claude. Valore predefinito: `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Log dettagliati su stderr.
</ParamField>

<Tip>
Quando possibile, preferire `--token-file` o `--password-file` ai segreti incorporati.
</Tip>

### Sicurezza e confine di attendibilità

Il bridge non crea autonomamente l'instradamento. Espone soltanto le conversazioni che il Gateway sa già come instradare.

Ciò significa che:

- gli elenchi di mittenti consentiti, l'associazione e l'attendibilità a livello di canale continuano ad appartenere alla configurazione del canale OpenClaw sottostante
- `messages_send` può rispondere soltanto tramite una route esistente e memorizzata
- lo stato delle approvazioni è attivo e conservato solo in memoria per la sessione corrente del bridge
- l'autenticazione del bridge deve usare gli stessi controlli tramite token o password del Gateway considerati attendibili per qualsiasi altro client Gateway remoto

Se una conversazione non è presente in `conversations_list`, in genere la causa non è la configurazione MCP. Si tratta di metadati di route mancanti o incompleti nella sessione Gateway sottostante.

### Test

OpenClaw include uno smoke test Docker deterministico per questo bridge:

```bash
pnpm test:docker:mcp-channels
```

Lo smoke test esegue un singolo container: inizializza lo stato delle conversazioni, avvia il Gateway, quindi genera `openclaw mcp serve` come processo figlio stdio e lo controlla come client MCP. Verifica il rilevamento delle conversazioni, la lettura delle trascrizioni, la lettura dei metadati degli allegati, il comportamento della coda degli eventi in tempo reale e le notifiche di canale e autorizzazione in stile Claude tramite il bridge MCP stdio reale. L'instradamento degli invii in uscita (`messages_send` che riutilizza la route della conversazione memorizzata) è trattato separatamente dai test unitari in `src/mcp/channel-server.test.ts`.

Questo è il modo più rapido per dimostrare il funzionamento del bridge senza collegare un account Telegram, Discord o iMessage reale all'esecuzione del test.

Per un contesto più ampio sui test, consultare [Test](/it/help/testing).

### Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna conversazione restituita">
    In genere significa che la sessione Gateway non è già instradabile. Verificare che la sessione sottostante contenga i metadati memorizzati relativi a canale/provider, destinatario e route facoltativa di account/thread.
  </Accordion>
  <Accordion title="events_poll o events_wait non rileva i messaggi precedenti">
    È previsto. La coda in tempo reale viene avviata quando il bridge si connette. Leggere la cronologia precedente della trascrizione con `messages_read`.
  </Accordion>
  <Accordion title="Le notifiche Claude non vengono visualizzate">
    Verificare tutti i seguenti aspetti:

    - il client ha mantenuto aperta la sessione MCP stdio
    - `--claude-channel-mode` è `on` o `auto`
    - il client comprende effettivamente i metodi di notifica specifici di Claude
    - il messaggio in ingresso è arrivato dopo la connessione del bridge

  </Accordion>
  <Accordion title="Le approvazioni sono mancanti">
    `permissions_list_open` mostra soltanto le richieste di approvazione osservate mentre il bridge era connesso. Non è un'API persistente per la cronologia delle approvazioni.
  </Accordion>
</AccordionGroup>

## OpenClaw come registro di client MCP

Questo è il percorso `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` e `unset`.

Questi comandi non espongono OpenClaw tramite MCP. Gestiscono le definizioni dei server MCP amministrate da OpenClaw in `mcp.servers` nella configurazione di OpenClaw. Non leggono i server mcporter da `config/mcporter.json`.

Le definizioni salvate sono destinate ai runtime che OpenClaw avvia o configura successivamente, come OpenClaw incorporato e altri adattatori di runtime. OpenClaw memorizza le definizioni centralmente, in modo che tali runtime non debbano conservare propri elenchi duplicati di server MCP.

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - questi comandi leggono o scrivono soltanto la configurazione di OpenClaw
    - `status`, `list`, `show`, `doctor` senza `--probe`, `set`, `configure`, `tools`, `logout`, `reload` e `unset` non si connettono al server MCP di destinazione
    - `login` esegue il flusso di rete OAuth MCP per il server HTTP configurato e salva le credenziali locali risultanti
    - `status --verbose` stampa le indicazioni risolte relative a trasporto, autenticazione, timeout, filtri e chiamate parallele agli strumenti senza connettersi
    - `doctor` controlla le definizioni salvate per individuare problemi di configurazione locale, come comandi stdio mancanti, directory di lavoro non valide, file TLS mancanti, server disabilitati, valori sensibili letterali nelle intestazioni o nelle variabili d'ambiente e autorizzazioni OAuth incomplete
    - `doctor --probe` aggiunge la stessa verifica della connessione in tempo reale di `probe` dopo il superamento dei controlli statici
    - `probe` si connette al server selezionato o a tutti i server configurati, elenca gli strumenti e segnala funzionalità e diagnostica
    - `add` crea una definizione dai flag e la verifica prima di salvarla, a meno che non sia impostato `--no-probe` o sia prima necessaria l'autorizzazione OAuth
    - gli adattatori di runtime decidono quali forme di trasporto supportare effettivamente durante l'esecuzione
    - `enabled: false` mantiene salvato un server, ma lo esclude dal rilevamento del runtime incorporato
    - `timeout` e `connectTimeout` impostano rispettivamente i timeout per le richieste e le connessioni del server, in secondi
    - `supportsParallelToolCalls: true` contrassegna i server che gli adattatori possono chiamare simultaneamente
    - i server HTTP possono usare intestazioni statiche, accesso OAuth, controllo della verifica TLS e percorsi di certificati e chiavi mTLS
    - OpenClaw incorporato espone gli strumenti MCP configurati nei normali profili degli strumenti `coding` e `messaging`; `minimal` continua a nasconderli e `tools.deny: ["bundle-mcp"]` li disabilita esplicitamente
    - `toolFilter.include` e `toolFilter.exclude` per server filtrano gli strumenti MCP rilevati prima che diventino strumenti OpenClaw
    - i server che dichiarano risorse o prompt espongono anche strumenti di utilità per elencare e leggere le risorse e per elencare e recuperare i prompt; i nomi di utilità generati (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) usano lo stesso filtro di inclusione/esclusione
    - le modifiche dinamiche all'elenco degli strumenti MCP invalidano il catalogo memorizzato nella cache per tale sessione; il rilevamento o utilizzo successivo lo aggiorna dal server
    - errori ripetuti nelle richieste agli strumenti MCP o nel protocollo sospendono brevemente il server, affinché un singolo server non funzionante non consumi l'intero turno
    - i runtime MCP inclusi e con ambito di sessione vengono terminati dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (valore predefinito: 10 minuti; impostare `0` per disabilitare) e le esecuzioni incorporate singole li eliminano al termine dell'esecuzione

  </Accordion>
</AccordionGroup>

Gli adattatori di runtime possono normalizzare questo registro condiviso nella forma prevista dal client downstream. Ad esempio, OpenClaw incorporato utilizza direttamente i valori `transport` di OpenClaw, mentre Claude Code e Gemini ricevono valori `type` nativi della CLI, come `http`, `sse` o `stdio`.

Codex app-server rispetta inoltre un blocco facoltativo `codex` su ogni server. Si tratta di
metadati di proiezione OpenClaw destinati soltanto ai thread di Codex app-server; non
modificano le sessioni ACP, la configurazione generica dell'harness Codex o altri adattatori di runtime.
Usare un valore `codex.agents` non vuoto per proiettare un server soltanto in specifici ID agente
OpenClaw. Gli elenchi di agenti vuoti, composti da spazi o non validi vengono rifiutati dalla convalida
della configurazione e omessi dal percorso di proiezione del runtime anziché diventare
globali. Usare `codex.defaultToolsApprovalMode` (`auto`, `prompt` o `approve`)
per emettere il valore nativo `default_tools_approval_mode` di Codex per un server attendibile.
OpenClaw rimuove i metadati `codex` prima di passare a Codex la configurazione
nativa `mcp_servers`.

### Definizioni dei server MCP salvate

Comandi:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Note:

- `list` ordina i nomi dei server.
- `show` senza un nome stampa l'oggetto completo del server MCP configurato.
- `status` classifica i trasporti configurati senza connettersi. `--verbose` include i dettagli risolti relativi ad avvio, timeout, OAuth, filtri e chiamate parallele.
- `doctor` esegue controlli statici senza connettersi. Aggiungere `--probe` quando il comando deve verificare anche la connessione dei server abilitati.
- `probe` si connette e segnala il numero di strumenti, il supporto per risorse e prompt, il supporto per le modifiche agli elenchi e la diagnostica.
- `add` accetta flag stdio come `--command`, `--arg`, `--env` e `--cwd`, oppure flag HTTP come `--url`, `--transport`, `--header`, `--auth oauth`, nonché flag TLS, di timeout e di selezione degli strumenti.
- `set` richiede un singolo valore oggetto JSON nella riga di comando.
- `configure` aggiorna abilitazione, filtri degli strumenti, timeout, OAuth, TLS e indicazioni sulle chiamate parallele agli strumenti senza sostituire l'intera definizione del server. Aggiungere `--probe` per verificare il server aggiornato prima del salvataggio.
- `tools` aggiorna i filtri degli strumenti per server. Le voci di inclusione/esclusione sono nomi di strumenti MCP e semplici glob `*`.
- `login` esegue il flusso OAuth per i server HTTP configurati con `auth: "oauth"`. La prima esecuzione stampa un URL di autorizzazione; eseguire nuovamente con `--code` dopo l'approvazione.
- `logout` cancella le credenziali OAuth memorizzate per il server indicato senza rimuovere la definizione salvata del server.
- `reload` elimina i runtime MCP in-process memorizzati nella cache soltanto per il processo CLI corrente. I processi Gateway o agente eseguiti in un altro processo richiedono comunque il proprio percorso di ricaricamento o riavvio.
- Usare `transport: "streamable-http"` per i server MCP Streamable HTTP. `openclaw mcp set` normalizza inoltre il valore `type: "http"` nativo della CLI nella stessa forma di configurazione canonica per compatibilità.
- `unset` non riesce se il server indicato non esiste.

Esempi:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Configurazioni comuni dei server

Questi esempi salvano solo le definizioni dei server. Eseguire successivamente `openclaw mcp doctor --probe` per verificare che il server si avvii ed esponga gli strumenti.

<Tabs>
  <Tab title="File system">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Limitare l'ambito dei server del file system all'albero di directory più piccolo che l'agente deve leggere o modificare.

  </Tab>
  <Tab title="Memoria">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Utilizzare un filtro degli strumenti se il server espone strumenti di scrittura che non devono essere disponibili agli agenti normali.

  </Tab>
  <Tab title="Script locale">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` verifica che `cwd` esista e che il comando venga risolto dall'ambiente configurato.

  </Tab>
  <Tab title="HTTP remoto">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Utilizzare OAuth quando il server remoto lo supporta. Se il server richiede intestazioni statiche, evitare di eseguire il commit di token bearer letterali.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    I server di controllo diretto del desktop ereditano le autorizzazioni del processo avviato. Utilizzare filtri degli strumenti restrittivi e richieste di autorizzazione a livello di sistema operativo.

  </Tab>
</Tabs>

### Strutture dell'output JSON

Utilizzare `--json` per script e dashboard. Gli insiemi di campi possono aumentare nel tempo, pertanto i client devono ignorare le chiavi sconosciute.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "Le credenziali OAuth non sono autorizzate; eseguire openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` termina con un codice diverso da zero quando un server abilitato e controllato presenta un problema di livello `error`. I problemi `warning` e `info` vengono segnalati, ma da soli non causano il fallimento del comando.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe --json` apre una sessione client MCP attiva e ne stampa direttamente il risultato; diversamente da `status`/`doctor`, l'output non presenta alcun campo `path` di primo livello. Le chiavi `resources` e `prompts` sono presenti solo quando il server dichiara effettivamente tale funzionalità (un server senza prompt omette la chiave `prompts` anziché indicare `false`). Utilizzare `probe` per verificare la raggiungibilità e le funzionalità, non per controlli della configurazione statica.

  </Accordion>
</AccordionGroup>

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
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Trasporto stdio

Avvia un processo figlio locale e comunica tramite stdin/stdout.

| Campo                      | Descrizione                       |
| -------------------------- | --------------------------------- |
| `command`                  | Eseguibile da avviare (obbligatorio)    |
| `args`                     | Array di argomenti della riga di comando   |
| `env`                      | Variabili d'ambiente aggiuntive       |
| `cwd` / `workingDirectory` | Directory di lavoro del processo |

<Warning>
**Filtro di sicurezza dell'ambiente stdio**

OpenClaw rifiuta le chiavi di ambiente relative all'avvio degli interpreti, alla compromissione del loader e all'inizializzazione della shell prima di avviare un server MCP stdio, anche se compaiono nel blocco `env` di un server. Viene applicata la stessa politica di sicurezza dell'ambiente host usata per gli altri processi avviati da OpenClaw: blocca gli hook noti di avvio degli interpreti (ad esempio `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), i prefissi per l'iniezione di librerie condivise e funzioni (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) e variabili analoghe di controllo del runtime. All'avvio, queste vengono eliminate silenziosamente e viene registrato un avviso, affinché non possano iniettare un preambolo implicito, sostituire l'interprete, abilitare un debugger o compromettere il linker dinamico del processo stdio. Una allowlist esplicita mantiene utilizzabili le normali variabili d'ambiente delle credenziali MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), insieme alle normali variabili d'ambiente del proxy e specifiche del server (`HTTP_PROXY`, `*_API_KEY` personalizzate e così via). Altre chiavi `AWS_*`, come `AWS_CONFIG_FILE` e `AWS_SHARED_CREDENTIALS_FILE`, rimangono bloccate perché puntano a file di credenziali anziché contenere direttamente un valore di credenziale.

Se il server MCP richiede effettivamente una delle variabili bloccate, impostarla nel processo host del Gateway anziché nel blocco `env` del server stdio.
</Warning>

### Trasporto SSE / HTTP

Si connette a un server MCP remoto tramite HTTP Server-Sent Events.

| Campo                          | Descrizione                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del server remoto (obbligatorio)                |
| `headers`                      | Mappa chiave-valore facoltativa delle intestazioni HTTP (ad esempio token di autenticazione) |
| `connectionTimeoutMs`          | Timeout di connessione per server in ms (facoltativo)                   |
| `connectTimeout`               | Timeout di connessione per server in secondi (facoltativo)              |
| `timeout` / `requestTimeoutMs` | Timeout delle richieste MCP per server in secondi o ms                  |
| `auth: "oauth"`                | Utilizza le credenziali OAuth MCP salvate da `openclaw mcp login`          |
| `sslVerify`                    | Impostare su false solo per endpoint HTTPS privati esplicitamente attendibili    |
| `clientCert` / `clientKey`     | Percorsi del certificato e della chiave client mTLS                            |
| `supportsParallelToolCalls`    | Indica che le chiamate simultanee sono sicure per questo server              |

Esempio:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

I valori sensibili in `url` (informazioni utente) e `headers` vengono oscurati nei log e nell'output di stato. `openclaw mcp doctor` avvisa quando le voci `headers` o `env` che sembrano sensibili contengono valori letterali, affinché gli operatori possano spostare tali valori fuori dalla configurazione sottoposta a commit.

### Flusso di lavoro OAuth

OAuth è destinato ai server MCP HTTP che dichiarano il supporto del flusso OAuth MCP. Le intestazioni statiche `Authorization` vengono ignorate per un server quando `auth: "oauth"` è abilitato. Le credenziali salvate da `openclaw mcp login` funzionano con MCP integrato, gli esecutori CLI e l'app-server Codex locale.

Finché le credenziali non sono disponibili, OpenClaw omette dal runtime dell'agente solo quel server MCP, anziché causare il fallimento del turno dell'agente. L'operatore, o un agente con accesso alla shell, può quindi eseguire `openclaw mcp login <name>` e utilizzare il server in un turno successivo.

Quando un servizio MCP remoto è già supportato da un profilo di autenticazione separato di OpenClaw in grado di eseguire l'aggiornamento, è possibile impostare facoltativamente `oauth.authProfileId`. OpenClaw aggiorna una delle due origini delle credenziali prima della proiezione nel runtime e passa al client MCP a valle solo il token di accesso corrente.

<Steps>
  <Step title="Salvare il server">
    Aggiungere o aggiornare il server con `auth: "oauth"` e gli eventuali metadati OAuth facoltativi.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Per un bearer supportato da un profilo di autenticazione, salvare l'associazione al profilo:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Avviare l'accesso">
    Eseguire l'accesso per creare la richiesta di autorizzazione.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw stampa l'URL di autorizzazione e memorizza lo stato temporaneo del verificatore OAuth nella directory di stato di OpenClaw.

  </Step>
  <Step title="Completare con il codice">
    Dopo l'approvazione nel browser, passare nuovamente a OpenClaw il codice restituito.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Verificare l'autorizzazione">
    Utilizzare lo stato o la diagnostica per confermare che i token siano presenti.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Cancellare le credenziali">
    La disconnessione rimuove le credenziali OAuth archiviate, ma mantiene la definizione del server salvata.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Se il provider ruota i token o lo stato di autorizzazione rimane bloccato, eseguire `openclaw mcp logout <name>`, quindi ripetere `login`. `logout` può cancellare le credenziali di un server HTTP salvato anche dopo che `auth: "oauth"` è stato rimosso dalla configurazione, purché il nome e l'URL del server identifichino ancora la voce nell'archivio delle credenziali.

### Trasporto HTTP con streaming

`streamable-http` è un'opzione di trasporto aggiuntiva oltre a `sse` e `stdio`. Utilizza lo streaming HTTP per la comunicazione bidirezionale con server MCP remoti.

| Campo                          | Descrizione                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del server remoto (obbligatorio)                                      |
| `transport`                    | Impostare su `"streamable-http"` per selezionare questo trasporto; se omesso, OpenClaw utilizza `sse` |
| `headers`                      | Mappa chiave-valore facoltativa delle intestazioni HTTP (ad esempio, token di autenticazione)                       |
| `connectionTimeoutMs`          | Timeout di connessione per server in ms (facoltativo)                                         |
| `connectTimeout`               | Timeout di connessione per server in secondi (facoltativo)                                    |
| `timeout` / `requestTimeoutMs` | Timeout delle richieste MCP per server in secondi o ms                                        |
| `auth: "oauth"`                | Utilizza le credenziali OAuth MCP salvate da `openclaw mcp login`                                |
| `sslVerify`                    | Impostare su false solo per endpoint HTTPS privati esplicitamente attendibili                          |
| `clientCert` / `clientKey`     | Percorsi del certificato client mTLS e della relativa chiave                                                  |
| `supportsParallelToolCalls`    | Indica che le chiamate simultanee sono sicure per questo server                                    |

La configurazione di OpenClaw utilizza `transport: "streamable-http"` come grafia canonica. I valori `type: "http"` MCP nativi della CLI vengono accettati quando sono salvati tramite `openclaw mcp set` e corretti da `openclaw doctor --fix` nella configurazione esistente, ma `transport` è ciò che OpenClaw incorporato utilizza direttamente.

Esempio:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
I comandi del registro non avviano il bridge del canale. Solo `probe` e `doctor --probe` aprono una sessione client MCP attiva per verificare che il server di destinazione sia raggiungibile.
</Note>

## Interfaccia di controllo

L'interfaccia di controllo nel browser include una pagina dedicata alle impostazioni MCP in `/settings/mcp`; il precedente percorso `/mcp` rimane un alias. La pagina mostra i conteggi dei server configurati, i riepiloghi di server abilitati, OAuth e filtri, le righe di trasporto per server, i controlli di abilitazione/disabilitazione, i comandi CLI comuni e un editor circoscritto per la sezione di configurazione `mcp`.

Utilizzare la pagina per le modifiche dell'operatore e un rapido inventario. Utilizzare `openclaw mcp doctor --probe` o `openclaw mcp probe` quando è necessaria una verifica attiva del server.

Flusso di lavoro dell'operatore:

1. Aprire l'interfaccia di controllo e scegliere **MCP**.
2. Esaminare le schede di riepilogo per i server totali, abilitati, OAuth e filtrati.
3. Utilizzare ogni riga del server per indicazioni su trasporto, autenticazione, filtro, timeout e comandi.
4. Attivare o disattivare l'abilitazione quando si desidera mantenere una definizione ma escluderla dal rilevamento in fase di esecuzione.
5. Modificare la sezione di configurazione circoscritta `mcp` per cambiamenti strutturali come nuovi server, intestazioni, TLS, metadati OAuth o filtri degli strumenti.
6. Scegliere **Save** per rendere persistente solo la configurazione oppure **Save & Publish** per applicarla tramite il percorso di configurazione del Gateway.
7. Eseguire `openclaw mcp doctor --probe` quando è necessaria una verifica attiva che il server modificato si avvii ed elenchi gli strumenti.

Note:

- i frammenti di comando racchiudono tra virgolette i nomi dei server affinché i nomi insoliti rimangano copiabili in una shell
- i valori simili a URL visualizzati vengono oscurati prima del rendering quando contengono credenziali incorporate
- la pagina non avvia autonomamente i trasporti MCP
- i runtime attivi potrebbero richiedere `openclaw mcp reload`, la pubblicazione della configurazione del Gateway o il riavvio del processo, a seconda del processo che gestisce i client MCP

## App MCP

OpenClaw può eseguire il rendering degli strumenti che implementano l'[estensione MCP Apps](https://modelcontextprotocol.io/extensions/apps) stabile. Le app richiedono l'attivazione esplicita perché il loro HTML proviene dal server MCP configurato e può richiedere strumenti o risorse visibili all'app da quello stesso server.

Abilitare il bridge host:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Riavviare il Gateway dopo aver modificato questa impostazione. Quando è abilitato, OpenClaw avvia un listener HTTP(S) riservato alla sandbox sulla porta del Gateway più uno (per il Gateway predefinito, `18790`). L'interfaccia di controllo carica le app da questa origine separata; il listener non serve mai l'interfaccia di controllo, le route autenticate del Gateway o i dati utente.

Le connessioni dirette al Gateway devono poter accedere a entrambe le porte. Se un proxy inverso o un terminatore TLS espone l'interfaccia di controllo, assegnare alle app un'origine pubblica dedicata e inoltrare tramite proxy solo tale origine al listener della sandbox:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

L'origine della sandbox deve essere diversa dall'origine dell'interfaccia di controllo. Non ospitarvi altri contenuti autenticati o sensibili.

Ad esempio, la demo React di base ufficiale può essere configurata come segue:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Comportamento e limiti di sicurezza:

- OpenClaw pubblicizza l'estensione `io.modelcontextprotocol/ui` solo quando le app sono abilitate.
- Vengono visualizzate solo le risorse `ui://` con il tipo MIME esatto `text/html;profile=mcp-app`.
- Le risorse dell'interfaccia utente hanno un limite di 2 MiB, sono collocate dietro un proxy a doppio iframe su un'origine esterna dedicata, caricate in un'origine interna opaca dell'app e vincolate da una CSP derivata dai metadati della risorsa.
- Gli strumenti riservati alle app (`_meta.ui.visibility: ["app"]`) restano esclusi dagli elenchi degli strumenti del modello. Le app possono chiamare solo strumenti visibili alle app sul server proprietario che superino anche i criteri effettivi di OpenClaw per gli strumenti dell'esecuzione che ha creato la vista.
- Le autorizzazioni delle app associate all'origine, come fotocamera, microfono e geolocalizzazione, non vengono concesse mentre i documenti interni delle app utilizzano origini opache per l'isolamento tra app.
- L'HTML dell'app, gli argomenti completi degli strumenti e i risultati non elaborati risiedono in un lease della vista in memoria, limitato a dieci minuti, e non vengono scritti su disco né copiati nei metadati di anteprima della trascrizione. La trascrizione memorizza solo un descrittore limitato di server, strumento e risorsa associato all'ID originale della chiamata dello strumento. Dopo il riavvio del Gateway, l'interfaccia di controllo può verificare tale descrittore rispetto alla trascrizione della sessione autenticata e recuperare nuovamente la risorsa `ui://`; le viste ricostruite sono di sola lettura finché una nuova esecuzione non stabilisce le autorizzazioni correnti degli strumenti.
- `openclaw security audit` mostra un avviso mentre il bridge è abilitato. Disabilitarlo con `openclaw config set mcp.apps.enabled false --strict-json` quando non è necessario.

## Limiti attuali

Questa pagina documenta il bridge così come viene distribuito oggi.

Limiti attuali:

- il rilevamento delle conversazioni dipende dai metadati esistenti delle route di sessione del Gateway
- nessun protocollo push generico oltre all'adattatore specifico per Claude
- non sono ancora disponibili strumenti per modificare i messaggi o aggiungere reazioni
- il trasporto HTTP/SSE/streamable-http si connette a un singolo server remoto; non è ancora disponibile un upstream multiplexato
- `permissions_list_open` include solo le approvazioni osservate mentre il bridge è connesso

## Correlati

- [Riferimento della CLI](/it/cli)
- [Plugin](/it/cli/plugins)
