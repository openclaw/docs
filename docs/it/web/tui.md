---
read_when:
    - Si desidera una guida introduttiva alla TUI adatta ai principianti
    - Serve l'elenco completo delle funzionalità, dei comandi e delle scorciatoie della TUI
summary: 'Interfaccia utente del terminale (TUI): connessione al Gateway o esecuzione locale in modalità incorporata'
title: TUI
x-i18n:
    generated_at: "2026-07-16T15:16:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
    source_path: web/tui.md
    workflow: 16
---

## Avvio rapido

### Modalità Gateway

1. Avviare il Gateway.

```bash
openclaw gateway
```

2. Aprire la TUI.

```bash
openclaw tui
```

3. Digitare un messaggio e premere Invio.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Usare `--password` se il Gateway utilizza l'autenticazione tramite password.

### Modalità locale

Eseguire la TUI senza un Gateway:

```bash
openclaw chat
# oppure
openclaw tui --local
```

- `openclaw chat` e `openclaw terminal` sono alias di `openclaw tui --local`.
- `--local` non può essere combinato con `--url`, `--token` o `--password`.
- La modalità locale utilizza direttamente il runtime dell'agente incorporato. La maggior parte degli strumenti locali funziona, ma le funzionalità disponibili solo nel Gateway non sono accessibili.
- `openclaw` senza argomenti (senza sottocomando) sceglie automaticamente una destinazione: un'installazione non configurata avvia l'onboarding per l'inferenza; una configurazione non valida apre le indicazioni classiche di Doctor; un Gateway configurato e raggiungibile apre questa shell TUI in modalità Gateway; altrimenti, un modello locale configurato la apre in modalità locale.

## Elementi visualizzati

- Intestazione: URL di connessione, agente corrente, sessione corrente.
- Registro della chat: messaggi dell'utente, risposte dell'assistente, notifiche di sistema, schede degli strumenti.
- Riga di stato: stato della connessione/esecuzione (connessione, esecuzione, streaming, inattività, errore).
- Piè di pagina: agente + sessione + modello + stato dell'obiettivo + modalità di pensiero/rapida/dettagliata/tracciamento/ragionamento + conteggi dei token + consegna. Quando `tui.footer.showRemoteHost` è abilitato, le connessioni a un Gateway remoto mostrano anche l'host della connessione.
- Input: editor di testo con completamento automatico.

## Modello concettuale: agenti + sessioni

- Gli agenti sono slug univoci (ad esempio `main`, `research`). Il Gateway espone l'elenco.
- Le sessioni appartengono all'agente corrente.
- Le chiavi delle sessioni vengono archiviate come `agent:<agentId>:<sessionKey>`.
  - Digitando `/session main`, la TUI lo espande in `agent:<currentAgent>:main`.
  - Digitando `/session agent:other:main`, si passa esplicitamente alla sessione di tale agente.
- Ambito della sessione:
  - `per-sender` (predefinito): ogni agente dispone di più sessioni.
  - `global`: la TUI utilizza sempre la sessione `global` (il selettore potrebbe essere vuoto).
- L'agente e la sessione correnti sono sempre visibili nel piè di pagina.
- Per mostrare l'host del Gateway per le connessioni non locali basate su URL, abilitarlo con:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Il valore predefinito è `false`. Le connessioni loopback e locali incorporate non mostrano mai un'etichetta dell'host.

- Se la sessione dispone di un [obiettivo](/it/tools/goal), il piè di pagina ne mostra lo stato compatto:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` o `Goal achieved`.
- Quando viene avviata senza `--session`, la TUI in modalità Gateway riprende l'ultima sessione selezionata per lo stesso Gateway, agente e ambito della sessione, se tale sessione esiste ancora. L'indicazione di `--session`, `/session`, `/new` o `/reset` rimane esplicita.

## Invio + consegna

- I messaggi vengono sempre inviati al Gateway (o al runtime incorporato in modalità locale); la consegna della risposta dell'assistente a un provider di chat è un passaggio separato, disabilitato per impostazione predefinita.
- La TUI è una superficie sorgente interna come WebChat, non un canale generico in uscita. Gli harness che richiedono `tools.message` per le risposte visibili possono soddisfare il turno TUI attivo con un `message.send` privo di destinazione; la consegna esplicita tramite provider continua a utilizzare i normali canali configurati e non ricorre mai a `lastChannel` come ripiego.
- La consegna viene fissata all'avvio per l'intera sessione TUI: avviare con `openclaw tui --deliver` per abilitarla. Non esiste alcun comando slash `/deliver` né un interruttore nelle Impostazioni per modificarla durante la sessione; riavviare la TUI per cambiarla.

## Selettori + sovrapposizioni

- Selettore del modello: elenca i modelli disponibili e imposta la sostituzione per la sessione.
- Selettore dell'agente: consente di scegliere un agente diverso.
- Selettore della sessione: mostra fino a 50 sessioni dell'agente corrente aggiornate negli ultimi 7 giorni. Usare `/session <key>` per passare a una sessione nota meno recente.
- Impostazioni (`/settings`): attiva o disattiva l'espansione dell'output degli strumenti e la visibilità del pensiero. Questo pannello non controlla la consegna.

## Scorciatoie da tastiera

- Invio: invia il messaggio
- Esc: interrompe l'esecuzione attiva
- Ctrl+C: cancella l'input (premere due volte per uscire)
- Ctrl+D: esce
- Ctrl+L: selettore del modello
- Ctrl+G: selettore dell'agente
- Ctrl+P: selettore della sessione
- Ctrl+O: attiva o disattiva l'espansione dell'output degli strumenti
- Ctrl+T: attiva o disattiva la visibilità del pensiero (ricarica la cronologia)

## Comandi slash

Principali:

- `/help`
- `/status` (inoltrato al Gateway; mostra il riepilogo di sessione/modello)
- `/gateway-status` (alias `/gwstatus`; mostra direttamente lo stato della connessione al Gateway)
- `/agent <id>` (o `/agents`)
- `/session <key>` (o `/sessions`)
- `/model <provider/model>` (o `/models`)

Controlli della sessione:

- `/think <off|minimal|low|medium|high>` (i livelli superiori possono aggiungere livelli come `xhigh`/`max` a seconda del modello)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` annulla la sostituzione della sessione)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Ciclo di vita della sessione:

- `/new` (crea una nuova sessione isolata con una nuova chiave; non influisce sugli altri client TUI nella sessione precedente)
- `/reset` (reimposta sul posto la chiave della sessione corrente)
- `/abort` (interrompe l'esecuzione attiva)
- `/settings`
- `/exit` (o `/quit`)

Solo modalità locale:

- `/auth [provider]` apre il flusso di autenticazione/accesso del provider all'interno della TUI.

OpenClaw:

- `/openclaw [request]` torna dalla normale TUI dell'agente alla chat di configurazione/riparazione [OpenClaw](#openclaw-setup-and-repair-helper), inoltrando facoltativamente una richiesta.

Gli altri comandi slash del Gateway (ad esempio, `/context`) vengono inoltrati al Gateway e mostrati come output di sistema. Consultare [Comandi slash](/it/tools/slash-commands).

## Comandi della shell locale

- Anteporre `!` a una riga per eseguire un comando della shell locale sull'host della TUI.
- La TUI chiede una volta per sessione l'autorizzazione all'esecuzione locale; se viene negata, `!` rimane disabilitato per la sessione.
- I comandi vengono eseguiti in una nuova shell non interattiva nella directory di lavoro della TUI (senza `cd`/ambiente persistente).
- I comandi della shell locale ricevono `OPENCLAW_SHELL=tui-local` nel proprio ambiente.
- Un `!` isolato viene inviato come messaggio normale; gli spazi iniziali non attivano l'esecuzione locale.

## Assistente di configurazione e riparazione di OpenClaw

OpenClaw è l'assistente di configurazione/riparazione di livello zero, esposto come `openclaw setup` dopo che il modello predefinito configurato supera una verifica di inferenza in tempo reale. Se l'inferenza non è disponibile, un'invocazione interattiva torna all'onboarding per l'inferenza e l'automazione non riesce, fornendo indicazioni per la riparazione. Viene eseguito nella stessa shell TUI locale di `openclaw tui --local`, supportato da un agente IA limitato alle operazioni tipizzate di OpenClaw e soggette ad approvazione:

```bash
openclaw setup                       # avvia in modalità interattiva
openclaw setup -m "status"           # esegue una richiesta ed esce
openclaw setup -m "set default model openai/gpt-5.2" --yes   # applica una scrittura della configurazione
```

- Le scritture persistenti della configurazione richiedono l'approvazione: confermare in modo interattivo oppure specificare `--yes`.
- `--json` stampa la panoramica iniziale in formato JSON anziché avviare la chat.
- Dall'interno di OpenClaw, una richiesta `open-tui` (ad esempio, la richiesta di parlare con un agente normale) chiude OpenClaw e apre la normale TUI dell'agente; usare `/openclaw` da lì per tornare indietro.

Usare la modalità locale quando la configurazione corrente è già valida e si desidera che l'agente incorporato la esamini sullo stesso computer, la confronti con la documentazione e contribuisca a correggere le divergenze senza dipendere da un Gateway in esecuzione.

Se `openclaw config validate` non funziona già, iniziare prima con `openclaw configure` o `openclaw doctor --fix`; `openclaw chat` richiede comunque una configurazione caricabile per avviarsi.

Ciclo tipico:

1. Avviare la modalità locale:

```bash
openclaw chat
```

2. Chiedere all'agente che cosa verificare, ad esempio:

```text
Confronta la mia configurazione di autenticazione del Gateway con la documentazione e suggerisci la correzione minima.
```

3. Usare i comandi della shell locale per ottenere riscontri precisi ed eseguire la convalida:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Applicare modifiche circoscritte con `openclaw config set` o `openclaw configure`, quindi eseguire nuovamente `!openclaw config validate`.
5. Se Doctor consiglia una migrazione o una riparazione automatica, esaminarla ed eseguire `!openclaw doctor --fix`.

Suggerimenti:

- Preferire `openclaw config set` o `openclaw configure` alla modifica manuale di `openclaw.json`.
- `openclaw docs "<query>"` esegue ricerche nell'indice della documentazione in tempo reale dallo stesso computer.
- `openclaw config validate --json` è utile quando servono errori strutturati relativi allo schema e a SecretRef/risolvibilità.

## Output degli strumenti

- Le chiamate agli strumenti vengono visualizzate come schede con argomenti + risultati.
- Ctrl+O alterna tra le viste compressa ed espansa.
- Durante l'esecuzione degli strumenti, gli aggiornamenti parziali vengono trasmessi nella stessa scheda.

## Colori del terminale

- La TUI mantiene il corpo del testo dell'assistente nel colore di primo piano predefinito del terminale, affinché sia i terminali scuri sia quelli chiari rimangano leggibili.
- Se il terminale utilizza uno sfondo chiaro e il rilevamento automatico non è corretto, impostare `OPENCLAW_THEME=light` prima di avviare `openclaw tui`.
- Per forzare invece la tavolozza scura originale, impostare `OPENCLAW_THEME=dark`.

## Cronologia + streaming

- Alla connessione, la TUI carica la cronologia più recente (per impostazione predefinita 200 messaggi).
- Le risposte in streaming vengono aggiornate sul posto fino al completamento.
- La TUI ascolta anche gli eventi degli strumenti dell'agente per offrire schede degli strumenti più dettagliate.

## Dettagli della connessione

- La TUI si connette con l'ID client `openclaw-tui` nella modalità client generale `ui` (la stessa modalità utilizzata dalla Control UI e da WebChat per i criteri del Gateway).
- Le riconnessioni mostrano un messaggio di sistema; le lacune negli eventi vengono segnalate nel registro.

## Opzioni

- `--local`: Esegui nell'ambiente di runtime locale incorporato dell'agente
- `--url <url>`: URL WebSocket del Gateway (valore predefinito: `gateway.remote.url` dalla configurazione oppure `ws://127.0.0.1:<port>` sull'interfaccia di loopback)
- `--token <token>`: Token del Gateway (se richiesto)
- `--password <password>`: Password del Gateway (se richiesta)
- `--tls-fingerprint <sha256>`: Impronta digitale prevista del certificato TLS per un Gateway `wss://` con certificato associato
- `--session <key>`: Chiave di sessione (valore predefinito: `main` oppure `global` quando l'ambito è globale)
- `--deliver`: Invia le risposte dell'assistente al provider (disattivato per impostazione predefinita)
- `--thinking <level>`: Sostituisci il livello di ragionamento per gli invii
- `--message <text>`: Invia un messaggio iniziale dopo la connessione
- `--timeout-ms <ms>`: Timeout dell'agente in ms (valore predefinito: `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Voci della cronologia da caricare (valore predefinito: `200`)

<Warning>
Quando si imposta `--url`, la TUI non utilizza come alternativa le credenziali della configurazione o dell'ambiente. Passare esplicitamente `--token` o `--password`, oltre a `--tls-fingerprint` quando la destinazione usa un certificato associato. L'assenza di credenziali esplicite costituisce un errore. In modalità locale, non passare `--url`, `--token`, `--password` o `--tls-fingerprint`.
</Warning>

## Risoluzione dei problemi

Nessun output dopo l'invio di un messaggio:

- Eseguire `/status` nella TUI per verificare che il Gateway sia connesso e inattivo/occupato.
- Controllare i log del Gateway: `openclaw logs --follow`.
- Verificare che l'agente possa essere eseguito: `openclaw status` e `openclaw models status`.
- Se si prevedono messaggi in un canale di chat, verificare che la TUI sia stata avviata con `--deliver` (non è possibile attivare questa opzione successivamente senza riavviare).

## Risoluzione dei problemi di connessione

- `disconnected`: assicurarsi che il Gateway sia in esecuzione e che le proprie `--url/--token/--password` siano corrette.
- Nessun agente nel selettore: controllare `openclaw agents list` e la configurazione di instradamento.
- Selettore delle sessioni vuoto: è possibile che l'ambito sia globale o che non esistano ancora sessioni.

## Argomenti correlati

- [Interfaccia di controllo](/it/web/control-ui) — interfaccia di controllo basata sul Web
- [Configurazione](/it/cli/config) — ispeziona, convalida e modifica `openclaw.json`
- [Doctor](/it/cli/doctor) — controlli guidati di riparazione e migrazione
- [Riferimento della CLI](/it/cli) — riferimento completo dei comandi della CLI
