---
read_when:
    - Vuoi una guida passo passo della TUI adatta ai principianti
    - Hai bisogno dell'elenco completo delle funzionalità, dei comandi e delle scorciatoie della TUI
summary: 'Interfaccia utente del terminale (TUI): connettiti al Gateway o esegui localmente in modalità incorporata'
title: TUI
x-i18n:
    generated_at: "2026-05-02T08:37:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
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

Usa `--password` se il tuo Gateway usa l'autenticazione con password.

### Modalità locale

Esegui la TUI senza un Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Note:

- `openclaw chat` e `openclaw terminal` sono alias di `openclaw tui --local`.
- `--local` non può essere combinato con `--url`, `--token` o `--password`.
- La modalità locale usa direttamente il runtime dell'agente incorporato. La maggior parte degli strumenti locali funziona, ma le funzionalità disponibili solo tramite Gateway non sono disponibili.
- Anche `openclaw` e `openclaw crestodian` usano questa shell TUI, con Crestodian come backend di chat locale per configurazione e riparazione.

## Cosa vedi

- Intestazione: URL di connessione, agente corrente, sessione corrente.
- Registro chat: messaggi utente, risposte dell'assistente, avvisi di sistema, schede degli strumenti.
- Riga di stato: stato della connessione/esecuzione (connessione in corso, in esecuzione, streaming, inattivo, errore).
- Piè di pagina: stato della connessione + agente + sessione + modello + think/fast/verbose/trace/reasoning + conteggi dei token + consegna.
- Input: editor di testo con completamento automatico.

## Modello mentale: agenti + sessioni

- Gli agenti sono slug univoci (ad es. `main`, `research`). Il Gateway espone l'elenco.
- Le sessioni appartengono all'agente corrente.
- Le chiavi di sessione sono archiviate come `agent:<agentId>:<sessionKey>`.
  - Se digiti `/session main`, la TUI lo espande in `agent:<currentAgent>:main`.
  - Se digiti `/session agent:other:main`, passi esplicitamente a quella sessione agente.
- Ambito della sessione:
  - `per-sender` (predefinito): ogni agente ha molte sessioni.
  - `global`: la TUI usa sempre la sessione `global` (il selettore potrebbe essere vuoto).
- L'agente e la sessione correnti sono sempre visibili nel piè di pagina.
- Quando viene avviata senza `--session`, la TUI in modalità Gateway riprende l'ultima sessione selezionata per lo stesso gateway, agente e ambito di sessione, se quella sessione esiste ancora. Passare `--session`, `/session`, `/new` o `/reset` resta un'azione esplicita.

## Invio + consegna

- I messaggi vengono inviati al Gateway; la consegna ai provider è disattivata per impostazione predefinita.
- Attiva la consegna:
  - `/deliver on`
  - oppure il pannello Impostazioni
  - oppure avvia con `openclaw tui --deliver`

## Selettori + overlay

- Selettore modello: elenca i modelli disponibili e imposta l'override della sessione.
- Selettore agente: scegli un agente diverso.
- Selettore sessione: mostra solo le sessioni dell'agente corrente.
- Impostazioni: attiva/disattiva consegna, espansione dell'output degli strumenti e visibilità del ragionamento.

## Scorciatoie da tastiera

- Invio: invia messaggio
- Esc: interrompi l'esecuzione attiva
- Ctrl+C: cancella input (premi due volte per uscire)
- Ctrl+D: esci
- Ctrl+L: selettore modello
- Ctrl+G: selettore agente
- Ctrl+P: selettore sessione
- Ctrl+O: attiva/disattiva l'espansione dell'output degli strumenti
- Ctrl+T: attiva/disattiva la visibilità del ragionamento (ricarica la cronologia)

## Comandi slash

Principali:

- `/help`
- `/status`
- `/agent <id>` (o `/agents`)
- `/session <key>` (o `/sessions`)
- `/model <provider/model>` (o `/models`)

Controlli di sessione:

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

- `/new` o `/reset` (reimposta la sessione)
- `/abort` (interrompe l'esecuzione attiva)
- `/settings`
- `/exit`

Solo modalità locale:

- `/auth [provider]` apre il flusso di autenticazione/accesso del provider nella TUI.

Gli altri comandi slash del Gateway (ad esempio, `/context`) vengono inoltrati al Gateway e mostrati come output di sistema. Vedi [Comandi slash](/it/tools/slash-commands).

## Comandi shell locali

- Anteponi `!` a una riga per eseguire un comando shell locale sull'host della TUI.
- La TUI chiede una volta per sessione di consentire l'esecuzione locale; se rifiuti, `!` resta disattivato per la sessione.
- I comandi vengono eseguiti in una nuova shell non interattiva nella directory di lavoro della TUI (nessun `cd`/env persistente).
- I comandi shell locali ricevono `OPENCLAW_SHELL=tui-local` nel loro ambiente.
- Un singolo `!` viene inviato come messaggio normale; gli spazi iniziali non attivano l'esecuzione locale.

## Riparare le configurazioni dalla TUI locale

Usa la modalità locale quando la configurazione corrente è già valida e vuoi che l'agente incorporato la ispezioni sulla stessa macchina, la confronti con la documentazione e aiuti a correggere le derive senza dipendere da un Gateway in esecuzione.

Se `openclaw config validate` sta già fallendo, inizia prima con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` non aggira la protezione contro le configurazioni non valide.

Ciclo tipico:

1. Avvia la modalità locale:

```bash
openclaw chat
```

2. Chiedi all'agente cosa vuoi controllare, ad esempio:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Usa i comandi shell locali per prove e validazione esatte:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Applica modifiche mirate con `openclaw config set` o `openclaw configure`, quindi riesegui `!openclaw config validate`.
5. Se Doctor consiglia una migrazione o una riparazione automatica, esaminala ed esegui `!openclaw doctor --fix`.

Suggerimenti:

- Preferisci `openclaw config set` o `openclaw configure` alla modifica manuale di `openclaw.json`.
- `openclaw docs "<query>"` cerca nell'indice della documentazione live dalla stessa macchina.
- `openclaw config validate --json` è utile quando vuoi errori strutturati di schema e SecretRef/risolvibilità.

## Output degli strumenti

- Le chiamate agli strumenti vengono mostrate come schede con argomenti + risultati.
- Ctrl+O alterna tra viste compresse/espandibili.
- Durante l'esecuzione degli strumenti, gli aggiornamenti parziali vengono trasmessi in streaming nella stessa scheda.

## Colori del terminale

- La TUI mantiene il testo del corpo dell'assistente nel colore di primo piano predefinito del tuo terminale, così i terminali scuri e chiari restano entrambi leggibili.
- Se il terminale usa uno sfondo chiaro e il rilevamento automatico è errato, imposta `OPENCLAW_THEME=light` prima di avviare `openclaw tui`.
- Per forzare invece la palette scura originale, imposta `OPENCLAW_THEME=dark`.

## Cronologia + streaming

- Alla connessione, la TUI carica la cronologia più recente (predefinito 200 messaggi).
- Le risposte in streaming si aggiornano in posizione fino alla finalizzazione.
- La TUI ascolta anche gli eventi degli strumenti dell'agente per schede degli strumenti più ricche.

## Dettagli di connessione

- La TUI si registra presso il Gateway come `mode: "tui"`.
- Le riconnessioni mostrano un messaggio di sistema; eventuali lacune negli eventi vengono evidenziate nel registro.

## Opzioni

- `--local`: esegui sul runtime dell'agente incorporato locale
- `--url <url>`: URL WebSocket del Gateway (predefinito dalla configurazione o `ws://127.0.0.1:<port>`)
- `--token <token>`: token del Gateway (se richiesto)
- `--password <password>`: password del Gateway (se richiesta)
- `--session <key>`: chiave di sessione (predefinito: `main`, o `global` quando l'ambito è globale)
- `--deliver`: consegna le risposte dell'assistente al provider (predefinito disattivato)
- `--thinking <level>`: sovrascrivi il livello di ragionamento per gli invii
- `--message <text>`: invia un messaggio iniziale dopo la connessione
- `--timeout-ms <ms>`: timeout dell'agente in ms (predefinito da `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: voci di cronologia da caricare (predefinito `200`)

<Warning>
Quando imposti `--url`, la TUI non ripiega sulle credenziali della configurazione o dell'ambiente. Passa esplicitamente `--token` o `--password`. Le credenziali esplicite mancanti sono un errore. In modalità locale, non passare `--url`, `--token` o `--password`.
</Warning>

## Risoluzione dei problemi

Nessun output dopo l'invio di un messaggio:

- Esegui `/status` nella TUI per confermare che il Gateway sia connesso e inattivo/occupato.
- Controlla i log del Gateway: `openclaw logs --follow`.
- Conferma che l'agente possa essere eseguito: `openclaw status` e `openclaw models status`.
- Se ti aspetti messaggi in un canale chat, abilita la consegna (`/deliver on` o `--deliver`).

## Risoluzione dei problemi di connessione

- `disconnected`: assicurati che il Gateway sia in esecuzione e che `--url/--token/--password` siano corretti.
- Nessun agente nel selettore: controlla `openclaw agents list` e la configurazione di routing.
- Selettore sessione vuoto: potresti essere nell'ambito globale o non avere ancora sessioni.

## Correlati

- [UI di controllo](/it/web/control-ui) — interfaccia di controllo basata sul web
- [Configurazione](/it/cli/config) — ispeziona, valida e modifica `openclaw.json`
- [Doctor](/it/cli/doctor) — controlli guidati di riparazione e migrazione
- [Riferimento CLI](/it/cli) — riferimento completo dei comandi CLI
