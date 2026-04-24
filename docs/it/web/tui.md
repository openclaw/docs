---
read_when:
    - Vuoi una guida introduttiva alla TUI adatta ai principianti
    - Ti serve l'elenco completo delle funzionalità, dei comandi e delle scorciatoie della TUI
summary: 'Interfaccia terminale (TUI): connettiti al Gateway o esegui localmente in modalità embedded'
title: TUI
x-i18n:
    generated_at: "2026-04-24T09:10:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
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

3. Scrivi un messaggio e premi Invio.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Usa `--password` se il tuo Gateway usa autenticazione con password.

### Modalità locale

Esegui la TUI senza un Gateway:

```bash
openclaw chat
# oppure
openclaw tui --local
```

Note:

- `openclaw chat` e `openclaw terminal` sono alias di `openclaw tui --local`.
- `--local` non può essere combinato con `--url`, `--token` o `--password`.
- La modalità locale usa direttamente il runtime embedded dell'agente. La maggior parte degli strumenti locali funziona, ma le funzionalità solo-Gateway non sono disponibili.

## Cosa vedi

- Intestazione: URL di connessione, agente corrente, sessione corrente.
- Log della chat: messaggi utente, risposte dell'assistente, avvisi di sistema, card degli strumenti.
- Riga di stato: stato della connessione/esecuzione (connecting, running, streaming, idle, error).
- Piè di pagina: stato della connessione + agente + sessione + modello + think/fast/verbose/trace/reasoning + conteggi token + deliver.
- Input: editor di testo con autocompletamento.

## Modello mentale: agenti + sessioni

- Gli agenti sono slug univoci (ad esempio `main`, `research`). Il Gateway espone l'elenco.
- Le sessioni appartengono all'agente corrente.
- Le chiavi di sessione sono memorizzate come `agent:<agentId>:<sessionKey>`.
  - Se scrivi `/session main`, la TUI lo espande in `agent:<currentAgent>:main`.
  - Se scrivi `/session agent:other:main`, passi esplicitamente a quella sessione dell'agente.
- Ambito della sessione:
  - `per-sender` (predefinito): ogni agente ha molte sessioni.
  - `global`: la TUI usa sempre la sessione `global` (il selettore può essere vuoto).
- L'agente corrente + la sessione corrente sono sempre visibili nel piè di pagina.

## Invio + consegna

- I messaggi vengono inviati al Gateway; la consegna ai provider è disattivata per impostazione predefinita.
- Attiva la consegna:
  - `/deliver on`
  - oppure dal pannello Settings
  - oppure avvia con `openclaw tui --deliver`

## Selettori + overlay

- Selettore modello: elenca i modelli disponibili e imposta l'override della sessione.
- Selettore agente: scegli un agente diverso.
- Selettore sessione: mostra solo le sessioni per l'agente corrente.
- Settings: attiva/disattiva deliver, espansione dell'output degli strumenti e visibilità del thinking.

## Scorciatoie da tastiera

- Invio: invia il messaggio
- Esc: interrompe l'esecuzione attiva
- Ctrl+C: cancella l'input (premi due volte per uscire)
- Ctrl+D: esci
- Ctrl+L: selettore modello
- Ctrl+G: selettore agente
- Ctrl+P: selettore sessione
- Ctrl+O: attiva/disattiva l'espansione dell'output degli strumenti
- Ctrl+T: attiva/disattiva la visibilità del thinking (ricarica la cronologia)

## Comandi slash

Core:

- `/help`
- `/status`
- `/agent <id>` (oppure `/agents`)
- `/session <key>` (oppure `/sessions`)
- `/model <provider/model>` (oppure `/models`)

Controlli della sessione:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Ciclo di vita della sessione:

- `/new` oppure `/reset` (resetta la sessione)
- `/abort` (interrompe l'esecuzione attiva)
- `/settings`
- `/exit`

Solo modalità locale:

- `/auth [provider]` apre il flusso di auth/login del provider dentro la TUI.

Gli altri comandi slash del Gateway (per esempio `/context`) vengono inoltrati al Gateway e mostrati come output di sistema. Vedi [Comandi slash](/it/tools/slash-commands).

## Comandi shell locali

- Anteponi `!` a una riga per eseguire un comando shell locale sull'host della TUI.
- La TUI chiede una volta per sessione il permesso di consentire l'esecuzione locale; se rifiuti, `!` resta disabilitato per la sessione.
- I comandi vengono eseguiti in una shell nuova e non interattiva nella directory di lavoro della TUI (nessun `cd`/env persistente).
- I comandi shell locali ricevono `OPENCLAW_SHELL=tui-local` nel loro ambiente.
- Un `!` da solo viene inviato come normale messaggio; gli spazi iniziali non attivano l'esecuzione locale.

## Riparare le configurazioni dalla TUI locale

Usa la modalità locale quando la configurazione corrente è già valida e vuoi che l'agente
embedded la ispezioni sulla stessa macchina, la confronti con la documentazione
e aiuti a riparare le discrepanze senza dipendere da un Gateway in esecuzione.

Se `openclaw config validate` fallisce già, inizia prima con `openclaw configure`
o `openclaw doctor --fix`. `openclaw chat` non aggira il controllo della configurazione
non valida.

Ciclo tipico:

1. Avvia la modalità locale:

```bash
openclaw chat
```

2. Chiedi all'agente cosa vuoi controllare, per esempio:

```text
Confronta la mia configurazione auth del gateway con la documentazione e suggerisci la correzione più piccola.
```

3. Usa i comandi shell locali per prove esatte e validazione:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Applica modifiche mirate con `openclaw config set` o `openclaw configure`, poi riesegui `!openclaw config validate`.
5. Se Doctor consiglia una migrazione o riparazione automatica, esaminala e lancia `!openclaw doctor --fix`.

Suggerimenti:

- Preferisci `openclaw config set` o `openclaw configure` invece di modificare a mano `openclaw.json`.
- `openclaw docs "<query>"` cerca nell'indice live della documentazione dalla stessa macchina.
- `openclaw config validate --json` è utile quando vuoi errori strutturati di schema e SecretRef/risolvibilità.

## Output degli strumenti

- Le chiamate agli strumenti vengono mostrate come card con argomenti + risultati.
- Ctrl+O alterna tra viste compresse/espanse.
- Mentre gli strumenti sono in esecuzione, gli aggiornamenti parziali scorrono nella stessa card.

## Colori del terminale

- La TUI mantiene il testo del corpo dell'assistente nel colore foreground predefinito del terminale, così sia i terminali scuri sia quelli chiari restano leggibili.
- Se il tuo terminale usa uno sfondo chiaro e il rilevamento automatico è errato, imposta `OPENCLAW_THEME=light` prima di avviare `openclaw tui`.
- Per forzare invece la palette scura originale, imposta `OPENCLAW_THEME=dark`.

## Cronologia + streaming

- Alla connessione, la TUI carica la cronologia più recente (predefinito 200 messaggi).
- Le risposte in streaming si aggiornano in-place finché non vengono finalizzate.
- La TUI ascolta anche gli eventi degli strumenti dell'agente per card degli strumenti più ricche.

## Dettagli della connessione

- La TUI si registra presso il Gateway come `mode: "tui"`.
- Le riconnessioni mostrano un messaggio di sistema; gli intervalli mancanti negli eventi vengono mostrati nel log.

## Opzioni

- `--local`: esegue contro il runtime embedded dell'agente locale
- `--url <url>`: URL WebSocket del Gateway (predefinito dalla configurazione o `ws://127.0.0.1:<port>`)
- `--token <token>`: token del Gateway (se richiesto)
- `--password <password>`: password del Gateway (se richiesta)
- `--session <key>`: chiave di sessione (predefinita: `main`, oppure `global` quando l'ambito è globale)
- `--deliver`: consegna le risposte dell'assistente al provider (predefinito disattivato)
- `--thinking <level>`: override del livello di thinking per gli invii
- `--message <text>`: invia un messaggio iniziale dopo la connessione
- `--timeout-ms <ms>`: timeout dell'agente in ms (predefinito da `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: voci di cronologia da caricare (predefinito `200`)

Nota: quando imposti `--url`, la TUI non usa fallback su credenziali di configurazione o ambiente.
Passa esplicitamente `--token` o `--password`. L'assenza di credenziali esplicite è un errore.
In modalità locale, non passare `--url`, `--token` o `--password`.

## Risoluzione dei problemi

Nessun output dopo l'invio di un messaggio:

- Esegui `/status` nella TUI per confermare che il Gateway sia connesso e idle/occupato.
- Controlla i log del Gateway: `openclaw logs --follow`.
- Conferma che l'agente possa essere eseguito: `openclaw status` e `openclaw models status`.
- Se ti aspetti messaggi in un canale chat, abilita la consegna (`/deliver on` o `--deliver`).

## Risoluzione dei problemi di connessione

- `disconnected`: assicurati che il Gateway sia in esecuzione e che `--url/--token/--password` siano corretti.
- Nessun agente nel selettore: controlla `openclaw agents list` e la tua configurazione di instradamento.
- Selettore sessione vuoto: potresti essere in ambito globale o non avere ancora sessioni.

## Correlati

- [Control UI](/it/web/control-ui) — interfaccia di controllo basata sul web
- [Config](/it/cli/config) — ispeziona, valida e modifica `openclaw.json`
- [Doctor](/it/cli/doctor) — controlli guidati di riparazione e migrazione
- [Riferimento CLI](/it/cli) — riferimento completo dei comandi CLI
