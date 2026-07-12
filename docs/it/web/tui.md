---
read_when:
    - Vuoi una guida introduttiva alla TUI pensata per principianti
    - Ti serve l'elenco completo delle funzionalità, dei comandi e delle scorciatoie della TUI
summary: 'Interfaccia utente del terminale (TUI): connettiti al Gateway o esegui localmente in modalità incorporata'
title: TUI
x-i18n:
    generated_at: "2026-07-12T07:36:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
    source_path: web/tui.md
    workflow: 16
---

## Avvio rapido

### Modalità Gateway

1. Avvia il Gateway.

```bash
openclaw gateway
```

2. Apri la TUI.

```bash
openclaw tui
```

3. Digita un messaggio e premi Invio.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Usa `--password` se il Gateway utilizza l'autenticazione tramite password.

### Modalità locale

Esegui la TUI senza un Gateway:

```bash
openclaw chat
# oppure
openclaw tui --local
```

- `openclaw chat` e `openclaw terminal` sono alias di `openclaw tui --local`.
- `--local` non può essere combinato con `--url`, `--token` o `--password`.
- La modalità locale utilizza direttamente il runtime dell'agente incorporato. La maggior parte degli strumenti locali funziona, ma le funzionalità disponibili solo tramite Gateway non sono disponibili.
- `openclaw` senza argomenti (nessun sottocomando) sceglie automaticamente una destinazione: un'installazione non configurata avvia l'onboarding per l'inferenza; una configurazione non valida apre le indicazioni classiche di Doctor; un Gateway configurato e raggiungibile apre questa shell TUI in modalità Gateway; altrimenti, un modello locale configurato la apre in modalità locale.

## Elementi visualizzati

- Intestazione: URL di connessione, agente corrente, sessione corrente.
- Registro della chat: messaggi dell'utente, risposte dell'assistente, notifiche di sistema, schede degli strumenti.
- Riga di stato: stato della connessione/esecuzione (connessione, esecuzione, streaming, inattivo, errore).
- Piè di pagina: agente + sessione + modello + stato dell'obiettivo + pensiero/modalità rapida/dettagli/tracciamento/ragionamento + conteggio dei token + consegna. Quando `tui.footer.showRemoteHost` è abilitato, le connessioni al Gateway remoto mostrano anche l'host di connessione.
- Input: editor di testo con completamento automatico.

## Modello concettuale: agenti + sessioni

- Gli agenti sono slug univoci (ad esempio `main`, `research`). Il Gateway espone l'elenco.
- Le sessioni appartengono all'agente corrente.
- Le chiavi di sessione vengono memorizzate nel formato `agent:<agentId>:<sessionKey>`.
  - Se digiti `/session main`, la TUI lo espande in `agent:<currentAgent>:main`.
  - Se digiti `/session agent:other:main`, passi esplicitamente alla sessione di quell'agente.
- Ambito della sessione:
  - `per-sender` (predefinito): ogni agente dispone di più sessioni.
  - `global`: la TUI utilizza sempre la sessione `global` (il selettore potrebbe essere vuoto).
- L'agente e la sessione correnti sono sempre visibili nel piè di pagina.
- Per mostrare l'host del Gateway per le connessioni non locali basate su URL, abilita l'opzione con:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Il valore predefinito è `false`. Le connessioni local loopback e locali incorporate non mostrano mai un'etichetta dell'host.

- Se la sessione ha un [obiettivo](/it/tools/goal), il piè di pagina ne mostra lo stato compatto:
  `Obiettivo in corso`, `Obiettivo in pausa (/goal resume)`, `Obiettivo bloccato (/goal resume)` oppure `Obiettivo raggiunto`.
- Quando viene avviata senza `--session`, la TUI in modalità Gateway riprende l'ultima sessione selezionata per lo stesso Gateway, agente e ambito di sessione, se tale sessione esiste ancora. L'uso di `--session`, `/session`, `/new` o `/reset` rimane esplicito.

## Invio + consegna

- I messaggi vengono sempre inviati al Gateway (o al runtime incorporato in modalità locale); la consegna della risposta dell'assistente a un provider di chat è un passaggio separato, disabilitato per impostazione predefinita.
- La TUI è una superficie di origine interna come WebChat, non un canale generico in uscita. Gli harness che richiedono `tools.message` per le risposte visibili possono soddisfare il turno TUI attivo con un `message.send` senza destinazione; la consegna esplicita al provider continua a utilizzare i normali canali configurati e non ricorre mai a `lastChannel`.
- La consegna viene fissata per l'intera sessione TUI all'avvio: usa `openclaw tui --deliver` per abilitarla. Non esistono un comando slash `/deliver` o un'opzione nelle Impostazioni per modificarla durante la sessione; riavvia la TUI per cambiarla.

## Selettori + sovrapposizioni

- Selettore del modello: elenca i modelli disponibili e imposta la sostituzione per la sessione.
- Selettore dell'agente: scegli un agente diverso.
- Selettore della sessione: mostra fino a 50 sessioni dell'agente corrente aggiornate negli ultimi 7 giorni. Usa `/session <key>` per passare a una sessione precedente nota.
- Impostazioni (`/settings`): attiva o disattiva l'espansione dell'output degli strumenti e la visibilità del pensiero. Questo pannello non controlla la consegna.

## Scorciatoie da tastiera

- Invio: invia il messaggio
- Esc: interrompe l'esecuzione attiva
- Ctrl+C: cancella l'input (premi due volte per uscire)
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
- `/agent <id>` (oppure `/agents`)
- `/session <key>` (oppure `/sessions`)
- `/model <provider/model>` (oppure `/models`)

Controlli della sessione:

- `/think <off|minimal|low|medium|high>` (i livelli superiori possono aggiungere livelli come `xhigh`/`max` a seconda del modello)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` cancella la sostituzione della sessione)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Ciclo di vita della sessione:

- `/new` (crea una nuova sessione isolata con una nuova chiave; non influisce sugli altri client TUI nella sessione precedente)
- `/reset` (reimposta sul posto la chiave della sessione corrente)
- `/abort` (interrompe l'esecuzione attiva)
- `/settings`
- `/exit` (oppure `/quit`)

Solo in modalità locale:

- `/auth [provider]` apre il flusso di autenticazione/accesso del provider all'interno della TUI.

Crestodian:

- `/crestodian [request]` torna dalla normale TUI dell'agente alla chat di [configurazione/riparazione di Crestodian](#crestodian-setup-and-repair-helper), inoltrando facoltativamente una richiesta.

Gli altri comandi slash del Gateway (ad esempio `/context`) vengono inoltrati al Gateway e mostrati come output di sistema. Consulta [Comandi slash](/it/tools/slash-commands).

## Comandi della shell locale

- Anteponi `!` a una riga per eseguire un comando della shell locale sull'host della TUI.
- La TUI chiede una volta per sessione di consentire l'esecuzione locale; se rifiuti, `!` rimane disabilitato per la sessione.
- I comandi vengono eseguiti in una nuova shell non interattiva nella directory di lavoro della TUI (senza persistenza di `cd`/variabili d'ambiente).
- I comandi della shell locale ricevono `OPENCLAW_SHELL=tui-local` nel proprio ambiente.
- Un `!` isolato viene inviato come messaggio normale; gli spazi iniziali non attivano l'esecuzione locale.

## Assistente Crestodian per la configurazione e la riparazione

Crestodian è l'assistente di livello zero per la configurazione e la riparazione, disponibile come `openclaw crestodian` dopo che il modello predefinito configurato supera un controllo di inferenza in tempo reale. Se l'inferenza non è disponibile, un'esecuzione interattiva torna all'onboarding per l'inferenza e l'automazione termina con indicazioni per la riparazione. Viene eseguito nella stessa shell TUI locale di `openclaw tui --local`, supportato da un agente IA limitato alle operazioni tipizzate di Crestodian, soggette ad approvazione:

```bash
openclaw crestodian                       # avvio interattivo
openclaw crestodian -m "status"           # esegui una richiesta ed esci
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # applica una modifica alla configurazione
```

- Le modifiche persistenti alla configurazione richiedono l'approvazione: conferma in modo interattivo oppure passa `--yes`.
- `--json` stampa la panoramica iniziale come JSON invece di avviare la chat.
- Da Crestodian, una richiesta `open-tui` (ad esempio chiedendo di parlare con un agente normale) chiude Crestodian e apre la normale TUI dell'agente; usa `/crestodian` per tornarvi.

Usa la modalità locale quando la configurazione corrente è già valida e vuoi che l'agente incorporato la esamini sulla stessa macchina, la confronti con la documentazione e aiuti a correggere le divergenze senza dipendere da un Gateway in esecuzione.

Se `openclaw config validate` non riesce già, inizia prima con `openclaw configure` o `openclaw doctor --fix`; anche `openclaw chat` richiede una configurazione caricabile per avviarsi.

Flusso tipico:

1. Avvia la modalità locale:

```bash
openclaw chat
```

2. Chiedi all'agente cosa vuoi controllare, ad esempio:

```text
Confronta la mia configurazione di autenticazione del Gateway con la documentazione e suggerisci la correzione più piccola.
```

3. Usa i comandi della shell locale per ottenere prove e convalide precise:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Applica modifiche circoscritte con `openclaw config set` o `openclaw configure`, quindi esegui nuovamente `!openclaw config validate`.
5. Se Doctor consiglia una migrazione o una riparazione automatica, esaminala ed esegui `!openclaw doctor --fix`.

Suggerimenti:

- Preferisci `openclaw config set` o `openclaw configure` alla modifica manuale di `openclaw.json`.
- `openclaw docs "<query>"` cerca nell'indice della documentazione in tempo reale dalla stessa macchina.
- `openclaw config validate --json` è utile quando vuoi errori strutturati relativi allo schema e a SecretRef/risolvibilità.

## Output degli strumenti

- Le chiamate agli strumenti vengono mostrate come schede con argomenti + risultati.
- Ctrl+O alterna tra le viste compressa ed espansa.
- Durante l'esecuzione degli strumenti, gli aggiornamenti parziali vengono trasmessi nella stessa scheda.

## Colori del terminale

- La TUI mantiene il testo del corpo delle risposte dell'assistente nel colore di primo piano predefinito del terminale, affinché rimanga leggibile sia nei terminali scuri sia in quelli chiari.
- Se il terminale utilizza uno sfondo chiaro e il rilevamento automatico non è corretto, imposta `OPENCLAW_THEME=light` prima di avviare `openclaw tui`.
- Per forzare invece la palette scura originale, imposta `OPENCLAW_THEME=dark`.

## Cronologia + streaming

- Alla connessione, la TUI carica la cronologia più recente (per impostazione predefinita 200 messaggi).
- Le risposte in streaming vengono aggiornate sul posto fino al completamento.
- La TUI ascolta anche gli eventi degli strumenti dell'agente per offrire schede degli strumenti più complete.

## Dettagli della connessione

- La TUI si connette con l'ID client `openclaw-tui` nella modalità client generale `ui` (la stessa modalità usata da Control UI e WebChat per i criteri del Gateway).
- Le riconnessioni mostrano un messaggio di sistema; le lacune negli eventi vengono segnalate nel registro.

## Opzioni

- `--local`: esegue usando il runtime dell'agente locale incorporato
- `--url <url>`: URL WebSocket del Gateway (il valore predefinito è `gateway.remote.url` dalla configurazione oppure `ws://127.0.0.1:<port>` su local loopback)
- `--token <token>`: token del Gateway (se richiesto)
- `--password <password>`: password del Gateway (se richiesta)
- `--tls-fingerprint <sha256>`: impronta digitale prevista del certificato TLS per un Gateway `wss://` associato
- `--session <key>`: chiave della sessione (valore predefinito: `main` oppure `global` quando l'ambito è globale)
- `--deliver`: consegna le risposte dell'assistente al provider (disabilitato per impostazione predefinita)
- `--thinking <level>`: sostituisce il livello di pensiero per gli invii
- `--message <text>`: invia un messaggio iniziale dopo la connessione
- `--timeout-ms <ms>`: timeout dell'agente in ms (il valore predefinito è `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: voci della cronologia da caricare (valore predefinito `200`)

<Warning>
Quando imposti `--url`, la TUI non ricorre alle credenziali della configurazione o dell'ambiente. Passa esplicitamente `--token` o `--password`, oltre a `--tls-fingerprint` quando la destinazione utilizza un certificato associato. L'assenza di credenziali esplicite costituisce un errore. In modalità locale, non passare `--url`, `--token`, `--password` o `--tls-fingerprint`.
</Warning>

## Risoluzione dei problemi

Nessun output dopo l'invio di un messaggio:

- Esegui `/status` nella TUI per confermare che il Gateway sia connesso e inattivo/occupato.
- Controlla i registri del Gateway: `openclaw logs --follow`.
- Verifica che l'agente possa essere eseguito: `openclaw status` e `openclaw models status`.
- Se prevedi messaggi in un canale di chat, verifica che la TUI sia stata avviata con `--deliver` (non può essere abilitato in seguito senza riavviare).

## Risoluzione dei problemi di connessione

- `disconnected`: assicurati che il Gateway sia in esecuzione e che `--url/--token/--password` siano corretti.
- Nessun agente nel selettore: controlla `openclaw agents list` e la configurazione di instradamento.
- Selettore della sessione vuoto: potresti usare l'ambito globale o non avere ancora sessioni.

## Contenuti correlati

- [Control UI](/it/web/control-ui) — interfaccia di controllo basata sul Web
- [Configurazione](/it/cli/config) — esamina, convalida e modifica `openclaw.json`
- [Doctor](/it/cli/doctor) — controlli guidati di riparazione e migrazione
- [Riferimento CLI](/it/cli) — riferimento completo dei comandi CLI
