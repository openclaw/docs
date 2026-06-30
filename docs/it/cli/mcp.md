---
read_when:
    - Connessione di Codex, Claude Code o un altro client MCP ai canali supportati da OpenClaw
    - In esecuzione `openclaw mcp serve`
    - Gestione delle definizioni dei server MCP salvate da OpenClaw
sidebarTitle: MCP
summary: Esponi le conversazioni dei canali OpenClaw tramite MCP e gestisci le definizioni dei server MCP salvate
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:21:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` ha due compiti:

- eseguire OpenClaw come server MCP con `openclaw mcp serve`
- gestire le definizioni dei server MCP in uscita gestiti da OpenClaw con `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` e `unset`

In altre parole:

- `serve` è OpenClaw che agisce come server MCP
- gli altri sottocomandi sono OpenClaw che agisce come registro lato client MCP per i server MCP che i suoi runtime potranno usare in seguito

<Note>
  `list`, `show`, `set` e `unset` leggono e scrivono solo le voci `mcp.servers` gestite da OpenClaw nella configurazione di OpenClaw. Non includono i server mcporter da `config/mcporter.json`; usa `mcporter list` per quel registro.
</Note>

Usa [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente una sessione di harness di codifica e instradare quel runtime tramite ACP.

## Scegliere il percorso MCP corretto

OpenClaw ha diverse superfici MCP. Scegli quella che corrisponde a chi possiede il runtime dell'agente e a chi possiede gli strumenti.

| Obiettivo                                                           | Uso                                                                  | Perché                                                                                                                 |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Consentire a un client MCP esterno di leggere/inviare conversazioni dei canali OpenClaw | `openclaw mcp serve`                                                 | OpenClaw è il server MCP ed espone conversazioni supportate dal Gateway tramite stdio.                                 |
| Salvare server MCP di terze parti per esecuzioni agente gestite da OpenClaw | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw è il registro lato client MCP e in seguito proietta questi server nei runtime idonei.                         |
| Controllare un server salvato senza eseguire un turno agente        | `openclaw mcp status`, `doctor`, `probe`                             | `status` e `doctor` ispezionano la configurazione; `probe` apre una connessione MCP live ed elenca le capacità.        |
| Modificare la configurazione MCP da un browser                      | Control UI `/mcp`                                                    | La pagina mostra inventario, abilitazione, riepiloghi OAuth/filtri, suggerimenti di comando e un editor `mcp` con ambito. |
| Fornire a Codex app-server un server MCP nativo con ambito          | `mcp.servers.<name>.codex`                                           | Il blocco `codex` influisce solo sulla proiezione dei thread di Codex app-server e viene rimosso prima del passaggio alla configurazione nativa. |
| Eseguire sessioni di harness ospitate da ACP                        | [`openclaw acp`](/it/cli/acp) e [Agenti ACP](/it/tools/acp-agents-setup)   | La modalità bridge ACP non accetta l'iniezione di server MCP per sessione; configura invece bridge gateway/plugin.      |

<Tip>
Se non sei sicuro di quale percorso ti serva, inizia con `openclaw mcp status --verbose`. Mostra ciò che OpenClaw ha salvato senza avviare alcun server MCP.
</Tip>

## OpenClaw come server MCP

Questo è il percorso `openclaw mcp serve`.

### Quando usare `serve`

Usa `openclaw mcp serve` quando:

- Codex, Claude Code o un altro client MCP deve parlare direttamente con conversazioni di canali supportate da OpenClaw
- hai già un Gateway OpenClaw locale o remoto con sessioni instradate
- vuoi un unico server MCP che funzioni tra i backend di canale di OpenClaw invece di eseguire bridge separati per canale

Usa invece [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare direttamente il runtime di codifica e mantenere la sessione agente dentro OpenClaw.

### Come funziona

`openclaw mcp serve` avvia un server MCP stdio. Il client MCP possiede quel processo. Finché il client mantiene aperta la sessione stdio, il bridge si connette a un Gateway OpenClaw locale o remoto tramite WebSocket ed espone conversazioni di canali instradate tramite MCP.

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
  <Step title="Gli eventi live vengono accodati">
    Gli eventi live vengono accodati in memoria mentre il bridge è connesso.
  </Step>
  <Step title="Push Claude opzionale">
    Se la modalità canale Claude è abilitata, la stessa sessione può anche ricevere notifiche push specifiche di Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - lo stato della coda live inizia quando il bridge si connette
    - la cronologia delle trascrizioni precedenti viene letta con `messages_read`
    - le notifiche push Claude esistono solo mentre la sessione MCP è attiva
    - quando il client si disconnette, il bridge termina e la coda live scompare
    - i punti di ingresso agente one-shot come `openclaw agent` e `openclaw infer model run` ritirano qualsiasi runtime MCP incluso che aprono quando la risposta viene completata, quindi le esecuzioni scriptate ripetute non accumulano processi figlio MCP stdio
    - i server MCP stdio avviati da OpenClaw (inclusi o configurati dall'utente) vengono terminati come albero di processi allo spegnimento, quindi i sottoprocessi figlio avviati dal server non sopravvivono dopo l'uscita del client stdio padre
    - l'eliminazione o il reset di una sessione elimina i client MCP di quella sessione tramite il percorso condiviso di pulizia del runtime, quindi non rimangono connessioni stdio persistenti associate a una sessione rimossa

  </Accordion>
</AccordionGroup>

### Scegliere una modalità client

Usa lo stesso bridge in due modi diversi:

<Tabs>
  <Tab title="Client MCP generici">
    Solo strumenti MCP standard. Usa `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` e gli strumenti di approvazione.
  </Tab>
  <Tab title="Claude Code">
    Strumenti MCP standard più l'adattatore di canale specifico di Claude. Abilita `--claude-channel-mode on` oppure lascia il valore predefinito `auto`.
  </Tab>
</Tabs>

<Note>
Oggi `auto` si comporta come `on`. Non esiste ancora il rilevamento delle capacità del client.
</Note>

### Cosa espone `serve`

Il bridge usa i metadati esistenti delle rotte di sessione del Gateway per esporre conversazioni supportate da canali. Una conversazione appare quando OpenClaw ha già uno stato di sessione con una rotta nota, ad esempio:

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
    Elenca le conversazioni recenti supportate da sessione che hanno già metadati di rotta nello stato di sessione del Gateway.

    Filtri utili:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Restituisce una conversazione tramite `session_key` usando una ricerca diretta della sessione del Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Legge i messaggi recenti della trascrizione per una conversazione supportata da sessione.
  </Accordion>
  <Accordion title="attachments_fetch">
    Estrae blocchi di contenuto non testuale da un messaggio di trascrizione. Questa è una vista di metadati sul contenuto della trascrizione, non un archivio autonomo e durevole di blob allegati.
  </Accordion>
  <Accordion title="events_poll">
    Legge gli eventi live accodati a partire da un cursore numerico.
  </Accordion>
  <Accordion title="events_wait">
    Esegue long polling finché arriva il prossimo evento accodato corrispondente o scade un timeout.

    Usa questo quando un client MCP generico necessita di consegna quasi in tempo reale senza un protocollo push specifico di Claude.

  </Accordion>
  <Accordion title="messages_send">
    Invia testo tramite la stessa rotta già registrata nella sessione.

    Comportamento attuale:

    - richiede una rotta di conversazione esistente
    - usa il canale, il destinatario, l'id account e l'id thread della sessione
    - invia solo testo

  </Accordion>
  <Accordion title="permissions_list_open">
    Elenca le richieste di approvazione exec/plugin in sospeso osservate dal bridge da quando si è connesso al Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Risolve una richiesta di approvazione exec/plugin in sospeso con:

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
- la coda è solo live; inizia quando si avvia il bridge MCP
- `events_poll` ed `events_wait` non riproducono autonomamente la cronologia precedente del Gateway
- il backlog durevole deve essere letto con `messages_read`

</Warning>

### Notifiche di canale Claude

Il bridge può anche esporre notifiche di canale specifiche di Claude. Questo è l'equivalente OpenClaw di un adattatore di canale Claude Code: gli strumenti MCP standard rimangono disponibili, ma i messaggi live in ingresso possono anche arrivare come notifiche MCP specifiche di Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: solo strumenti MCP standard.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: abilita le notifiche di canale Claude.
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
- se il proprietario del comando nella conversazione collegata invia in seguito `yes abcde` o `no abcde`, il bridge lo converte in `notifications/claude/channel/permission`
- queste notifiche sono solo per sessioni live; se il client MCP si disconnette, non esiste un target push

Questo è intenzionalmente specifico del client. I client MCP generici dovrebbero fare affidamento sugli strumenti di polling standard.

### Configurazione del client MCP

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

Per la maggior parte dei client MCP generici, inizia con la superficie degli strumenti standard e ignora la modalità Claude. Attiva la modalità Claude solo per i client che comprendono effettivamente i metodi di notifica specifici di Claude.

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
  Modalità di notifica di Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Log dettagliati su stderr.
</ParamField>

<Tip>
Quando possibile, preferisci `--token-file` o `--password-file` ai segreti inline.
</Tip>

### Sicurezza e confine di attendibilità

Il bridge non inventa il routing. Espone solo le conversazioni che il Gateway sa già come instradare.

Questo significa che:

- le allowlist dei mittenti, l'associazione e l'attendibilità a livello di canale appartengono ancora alla configurazione del canale OpenClaw sottostante
- `messages_send` può rispondere solo tramite una route archiviata esistente
- lo stato di approvazione è live/in memoria solo per la sessione bridge corrente
- l'autenticazione del bridge deve usare gli stessi controlli di token o password del Gateway che ritieni affidabili per qualsiasi altro client Gateway remoto

Se una conversazione manca da `conversations_list`, la causa abituale non è la configurazione MCP. Mancano metadati di route, o sono incompleti, nella sessione Gateway sottostante.

### Test

OpenClaw include uno smoke Docker deterministico per questo bridge:

```bash
pnpm test:docker:mcp-channels
```

Questo smoke:

- avvia un container Gateway con seed
- avvia un secondo container che genera `openclaw mcp serve`
- verifica l'individuazione delle conversazioni, le letture delle trascrizioni, le letture dei metadati degli allegati, il comportamento della coda di eventi live e il routing degli invii in uscita
- convalida le notifiche di canale e autorizzazione in stile Claude sul bridge MCP stdio reale

Questo è il modo più rapido per dimostrare che il bridge funziona senza collegare un account Telegram, Discord o iMessage reale all'esecuzione del test.

Per un contesto di test più ampio, consulta [Test](/it/help/testing).

### Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna conversazione restituita">
    Di solito significa che la sessione Gateway non è già instradabile. Conferma che la sessione sottostante abbia metadati di route archiviati per canale/provider, destinatario e account/thread opzionale.
  </Accordion>
  <Accordion title="events_poll o events_wait non rileva messaggi meno recenti">
    Previsto. La coda live parte quando il bridge si connette. Leggi la cronologia meno recente della trascrizione con `messages_read`.
  </Accordion>
  <Accordion title="Le notifiche Claude non compaiono">
    Controlla tutti questi elementi:

    - il client ha mantenuto aperta la sessione MCP stdio
    - `--claude-channel-mode` è `on` o `auto`
    - il client comprende effettivamente i metodi di notifica specifici di Claude
    - il messaggio in ingresso è arrivato dopo la connessione del bridge

  </Accordion>
  <Accordion title="Le approvazioni mancano">
    `permissions_list_open` mostra solo le richieste di approvazione osservate mentre il bridge era connesso. Non è una API durevole di cronologia delle approvazioni.
  </Accordion>
</AccordionGroup>

## OpenClaw come registro di client MCP

Questo è il percorso `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` e `unset`.

Questi comandi non espongono OpenClaw tramite MCP. Gestiscono le definizioni dei server MCP gestite da OpenClaw sotto `mcp.servers` nella configurazione OpenClaw. Non leggono i server mcporter da `config/mcporter.json`.

Quelle definizioni salvate sono per runtime che OpenClaw avvia o configura in seguito, come OpenClaw incorporato e altri adapter runtime. OpenClaw archivia le definizioni centralmente, così quei runtime non devono mantenere i propri elenchi duplicati di server MCP.

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - questi comandi leggono o scrivono solo la configurazione OpenClaw
    - `status`, `list`, `show`, `doctor` senza `--probe`, `set`, `configure`, `tools`, `logout`, `reload` e `unset` non si connettono al server MCP di destinazione
    - `login` esegue il flusso di rete OAuth MCP per il server HTTP configurato e salva le credenziali locali risultanti
    - `status --verbose` stampa trasporto risolto, autenticazione, timeout, filtro e suggerimenti per chiamate parallele agli strumenti senza connettersi
    - `doctor` controlla le definizioni salvate per problemi di configurazione locale come comandi stdio mancanti, directory di lavoro non valide, file TLS mancanti, server disabilitati, valori sensibili letterali in header/env e autorizzazione OAuth incompleta
    - `doctor --probe` aggiunge la stessa prova di connessione live di `probe` dopo il superamento dei controlli statici
    - `probe` si connette al server selezionato o a tutti i server configurati, elenca gli strumenti e segnala capacità/diagnostica
    - `add` crea una definizione dai flag ed esegue un probe prima del salvataggio, a meno che `--no-probe` sia impostato o sia prima necessaria l'autorizzazione OAuth
    - gli adapter runtime decidono quali forme di trasporto supportano effettivamente al momento dell'esecuzione
    - `enabled: false` mantiene un server salvato ma lo esclude dall'individuazione del runtime incorporato
    - `timeout` e `connectTimeout` impostano timeout di richiesta e connessione per server in secondi
    - `supportsParallelToolCalls: true` contrassegna i server che gli adapter possono chiamare in modo concorrente
    - i server HTTP possono usare header statici, login OAuth, controllo della verifica TLS e percorsi di certificato/chiave mTLS
    - OpenClaw incorporato espone gli strumenti MCP configurati nei normali profili strumenti `coding` e `messaging`; `minimal` continua a nasconderli e `tools.deny: ["bundle-mcp"]` li disabilita esplicitamente
    - `toolFilter.include` e `toolFilter.exclude` per server filtrano gli strumenti MCP individuati prima che diventino strumenti OpenClaw
    - i server che dichiarano risorse o prompt espongono anche strumenti di utilità per elencare/leggere risorse ed elencare/recuperare prompt; quei nomi di utilità generati (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) usano lo stesso filtro include/exclude
    - le modifiche dinamiche all'elenco degli strumenti MCP invalidano il catalogo in cache per quella sessione; la successiva individuazione/uso aggiorna dal server
    - errori ripetuti di richiesta/protocollo degli strumenti MCP mettono brevemente in pausa quel server, così un server rotto non consuma l'intero turno
    - i runtime MCP in bundle con ambito di sessione vengono eliminati dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (predefinito 10 minuti; imposta `0` per disabilitare) e le esecuzioni incorporate one-shot li puliscono alla fine dell'esecuzione

  </Accordion>
</AccordionGroup>

Gli adapter runtime possono normalizzare questo registro condiviso nella forma prevista dal loro client downstream. Per esempio, OpenClaw incorporato consuma direttamente i valori `transport` di OpenClaw, mentre Claude Code e Gemini ricevono valori `type` nativi della CLI come `http`, `sse` o `stdio`.

Codex app-server rispetta anche un blocco opzionale `codex` su ciascun server. Si tratta di metadati di proiezione OpenClaw solo per i thread Codex app-server; non modifica le sessioni ACP, la configurazione generica dell'harness Codex o altri adapter runtime. Usa `codex.agents` non vuoto per proiettare un server solo in specifici ID agente OpenClaw. Gli elenchi di agenti vuoti, blank o non validi vengono rifiutati dalla convalida della configurazione e omessi dal percorso di proiezione runtime invece di diventare globali. Usa `codex.defaultToolsApprovalMode` (`auto`, `prompt` o `approve`) per emettere il `default_tools_approval_mode` nativo di Codex per un server attendibile. OpenClaw rimuove i metadati `codex` prima di passare la configurazione nativa `mcp_servers` a Codex.

### Definizioni salvate dei server MCP

OpenClaw archivia anche un registro leggero di server MCP nella configurazione per le superfici che vogliono definizioni MCP gestite da OpenClaw.

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
- `show` senza nome stampa l'intero oggetto server MCP configurato.
- `status` classifica i trasporti configurati senza connettersi. `--verbose` include dettagli risolti su avvio, timeout, OAuth, filtro e chiamate parallele.
- `doctor` esegue controlli statici senza connettersi. Aggiungi `--probe` quando il comando deve verificare anche che i server abilitati si connettano.
- `probe` si connette e segnala conteggi degli strumenti, supporto per risorse/prompt, supporto alle modifiche dell'elenco e diagnostica.
- `add` accetta flag stdio come `--command`, `--arg`, `--env` e `--cwd`, oppure flag HTTP come `--url`, `--transport`, `--header`, `--auth oauth`, TLS, timeout e flag di selezione degli strumenti.
- `set` si aspetta un valore oggetto JSON sulla riga di comando.
- `configure` aggiorna abilitazione, filtri degli strumenti, timeout, OAuth, TLS e suggerimenti per chiamate parallele agli strumenti senza sostituire l'intera definizione del server.
- `tools` aggiorna i filtri strumenti per server. Le voci include/exclude sono nomi di strumenti MCP e semplici glob `*`.
- `login` esegue il flusso OAuth per server HTTP configurati con `auth: "oauth"`. La prima esecuzione stampa un URL di autorizzazione; riesegui con `--code` dopo l'approvazione.
- `logout` cancella le credenziali OAuth archiviate per il server indicato senza rimuovere la definizione del server salvata.
- `reload` elimina i runtime MCP in-process in cache. I processi Gateway o agente in un altro processo necessitano comunque del proprio percorso di ricaricamento o riavvio.
- Usa `transport: "streamable-http"` per i server MCP Streamable HTTP. `openclaw mcp set` normalizza anche `type: "http"` nativo della CLI nella stessa forma di configurazione canonica per compatibilità.
- `unset` fallisce se il server indicato non esiste.

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

### Ricette comuni per server

Questi esempi salvano solo definizioni di server. Esegui poi `openclaw mcp doctor --probe` per dimostrare che il server si avvia ed espone strumenti.

<Tabs>
  <Tab title="Filesystem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Limita l'ambito dei server filesystem al più piccolo albero di directory che l'agente deve leggere o modificare.

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Usa un filtro strumenti se il server espone strumenti di scrittura che non dovrebbero essere disponibili agli agenti normali.

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

    `doctor` controlla che `cwd` esista e che il comando venga risolto dall'ambiente configurato.

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

    Usa OAuth quando il server remoto lo supporta. Se il server richiede header statici, evita di committare token bearer letterali.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    I server di controllo desktop diretto ereditano i permessi del processo che avviano. Usa filtri degli strumenti ristretti e prompt di autorizzazione a livello di sistema operativo.

  </Tab>
</Tabs>

### Formati dell'output JSON

Usa `--json` per script e dashboard. Gli insiemi di campi possono crescere nel tempo, quindi i consumer devono ignorare le chiavi sconosciute.

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
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "Le credenziali OAuth non sono autorizzate; esegui openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` termina con codice diverso da zero quando un server controllato e abilitato presenta un errore. Gli avvisi vengono riportati ma da soli non fanno fallire il comando.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
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

    `probe` apre una sessione client MCP live. Usalo per provare raggiungibilità e capability, non per audit statici della configurazione.

  </Accordion>
</AccordionGroup>

Esempio di formato di configurazione:

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

| Campo                      | Descrizione                              |
| -------------------------- | ---------------------------------------- |
| `command`                  | Eseguibile da avviare (obbligatorio)     |
| `args`                     | Array di argomenti da riga di comando    |
| `env`                      | Variabili d'ambiente aggiuntive          |
| `cwd` / `workingDirectory` | Directory di lavoro per il processo      |

<Warning>
**Filtro di sicurezza env stdio**

OpenClaw rifiuta le chiavi env di avvio dell'interprete che possono alterare il modo in cui un server MCP stdio si avvia prima della prima RPC, anche se compaiono nel blocco `env` di un server. Le chiavi bloccate includono `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` e variabili simili di controllo del runtime. L'avvio rifiuta queste chiavi con un errore di configurazione, in modo che non possano iniettare un preambolo implicito, sostituire l'interprete, abilitare un debugger o reindirizzare l'output del runtime contro il processo stdio. Le normali variabili env di credenziali, proxy e specifiche del server (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizzate, ecc.) non sono interessate.

Se il tuo server MCP ha davvero bisogno di una delle variabili bloccate, impostala sul processo host del Gateway invece che sotto `env` del server stdio.
</Warning>

### Trasporto SSE / HTTP

Si connette a un server MCP remoto tramite HTTP Server-Sent Events.

| Campo                          | Descrizione                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del server remoto (obbligatorio)                           |
| `headers`                      | Mappa chiave-valore opzionale di header HTTP (ad esempio token di auth)     |
| `connectionTimeoutMs`          | Timeout di connessione per server in ms (opzionale)                         |
| `connectTimeout`               | Timeout di connessione per server in secondi (opzionale)                    |
| `timeout` / `requestTimeoutMs` | Timeout delle richieste MCP per server in secondi o ms                      |
| `auth: "oauth"`                | Usa l'archiviazione dei token OAuth MCP e `openclaw mcp login`              |
| `sslVerify`                    | Imposta false solo per endpoint HTTPS privati esplicitamente attendibili    |
| `clientCert` / `clientKey`     | Percorsi del certificato e della chiave client mTLS                         |
| `supportsParallelToolCalls`    | Suggerisce che le chiamate concorrenti sono sicure per questo server        |

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

I valori sensibili in `url` (userinfo) e `headers` vengono redatti nei log e nell'output di stato. `openclaw mcp doctor` avvisa quando voci `headers` o `env` dall'aspetto sensibile contengono valori letterali, così gli operatori possono spostare quei valori fuori dalla configurazione committata.

### Workflow OAuth

OAuth è per server MCP HTTP che pubblicizzano il flusso OAuth MCP. Gli header statici `Authorization` vengono ignorati per un server mentre `auth: "oauth"` è abilitato.

<Steps>
  <Step title="Salva il server">
    Aggiungi o aggiorna il server con `auth: "oauth"` e gli eventuali metadati OAuth opzionali.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Avvia il login">
    Esegui login per creare la richiesta di autorizzazione.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw stampa l'URL di autorizzazione e archivia lo stato temporaneo del verificatore OAuth nella directory di stato di OpenClaw.

  </Step>
  <Step title="Completa con il codice">
    Dopo l'approvazione nel browser, passa il codice restituito a OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Controlla l'autorizzazione">
    Usa status o doctor per confermare che i token siano presenti.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Cancella le credenziali">
    Logout rimuove le credenziali OAuth archiviate ma mantiene la definizione del server salvata.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Se il provider ruota i token o lo stato di autorizzazione si blocca, esegui `openclaw mcp logout <name>`, quindi ripeti `login`. `logout` può cancellare le credenziali per un server HTTP salvato anche dopo che `auth: "oauth"` è stato rimosso dalla configurazione, purché il nome del server e l'URL identifichino ancora la voce dell'archivio credenziali.

### Trasporto HTTP streamable

`streamable-http` è un'opzione di trasporto aggiuntiva accanto a `sse` e `stdio`. Usa lo streaming HTTP per la comunicazione bidirezionale con server MCP remoti.

| Campo                          | Descrizione                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP o HTTPS del server remoto (obbligatorio)                                               |
| `transport`                    | Imposta su `"streamable-http"` per selezionare questo trasporto; se omesso, OpenClaw usa `sse`  |
| `headers`                      | Mappa chiave-valore opzionale di header HTTP (ad esempio token di auth)                         |
| `connectionTimeoutMs`          | Timeout di connessione per server in ms (opzionale)                                             |
| `connectTimeout`               | Timeout di connessione per server in secondi (opzionale)                                        |
| `timeout` / `requestTimeoutMs` | Timeout delle richieste MCP per server in secondi o ms                                          |
| `auth: "oauth"`                | Usa l'archiviazione dei token OAuth MCP e `openclaw mcp login`                                  |
| `sslVerify`                    | Imposta false solo per endpoint HTTPS privati esplicitamente attendibili                        |
| `clientCert` / `clientKey`     | Percorsi del certificato e della chiave client mTLS                                             |
| `supportsParallelToolCalls`    | Suggerisce che le chiamate concorrenti sono sicure per questo server                            |

La configurazione di OpenClaw usa `transport: "streamable-http"` come grafia canonica. I valori MCP nativi della CLI `type: "http"` sono accettati quando salvati tramite `openclaw mcp set` e riparati da `openclaw doctor --fix` nella configurazione esistente, ma `transport` è ciò che OpenClaw incorporato consuma direttamente.

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
I comandi del registry non avviano il bridge del canale. Solo `probe` e `doctor --probe` aprono una sessione client MCP live per provare che il server di destinazione sia raggiungibile.
</Note>

## UI di controllo

La UI di controllo nel browser include una pagina dedicata alle impostazioni MCP in `/mcp`. Mostra i conteggi dei server configurati, riepiloghi di abilitazione/OAuth/filtri, righe di trasporto per server, controlli di abilitazione/disabilitazione, comandi CLI comuni e un editor con ambito per la sezione di configurazione `mcp`.

Usa la pagina per modifiche da operatore e inventario rapido. Usa `openclaw mcp doctor --probe` o `openclaw mcp probe` quando ti serve una prova live del server.

Workflow dell'operatore:

1. Apri l'interfaccia utente di controllo e scegli **MCP**.
2. Esamina le schede di riepilogo per server totali, abilitati, OAuth e filtrati.
3. Usa ogni riga del server per suggerimenti su trasporto, autenticazione, filtro, timeout e comandi.
4. Attiva o disattiva l'abilitazione quando vuoi mantenere una definizione ma escluderla dal rilevamento in runtime.
5. Modifica la sezione di configurazione `mcp` con ambito per modifiche strutturali come nuovi server, intestazioni, TLS, metadati OAuth o filtri degli strumenti.
6. Scegli **Salva** per rendere persistente solo la configurazione, oppure **Salva e pubblica** per applicarla tramite il percorso di configurazione del Gateway.
7. Esegui `openclaw mcp doctor --probe` quando ti serve una prova live che il server modificato si avvii ed elenchi gli strumenti.

Note:

- i frammenti di comando racchiudono tra virgolette i nomi dei server affinché i nomi insoliti restino copiabili in una shell
- i valori visualizzati simili a URL vengono oscurati prima del rendering quando contengono credenziali incorporate
- la pagina non avvia autonomamente i trasporti MCP
- i runtime attivi potrebbero richiedere `openclaw mcp reload`, la pubblicazione della configurazione del Gateway o il riavvio del processo a seconda di quale processo possiede i client MCP

## Limiti attuali

Questa pagina documenta il bridge così come viene distribuito oggi.

Limiti attuali:

- il rilevamento delle conversazioni dipende dai metadati delle route di sessione Gateway esistenti
- nessun protocollo push generico oltre all'adapter specifico per Claude
- nessuno strumento di modifica o reazione ai messaggi per ora
- il trasporto HTTP/SSE/streamable-http si connette a un singolo server remoto; nessun upstream multiplexato per ora
- `permissions_list_open` include solo le approvazioni osservate mentre il bridge è connesso

## Correlati

- [Riferimento CLI](/it/cli)
- [Plugin](/it/cli/plugins)
