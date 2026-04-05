---
read_when:
    - Vuoi una guida introduttiva alla TUI adatta ai principianti
    - Hai bisogno dell'elenco completo di funzionalità, comandi e scorciatoie della TUI
summary: 'UI terminale (TUI): connettiti al Gateway da qualsiasi macchina'
title: TUI
x-i18n:
    generated_at: "2026-04-05T14:08:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: a73f70d65ecc7bff663e8df28c07d70d2920d4732fbb8288c137d65b8653ac52
    source_path: web/tui.md
    workflow: 15
---

# TUI (UI terminale)

## Avvio rapido

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

## Cosa vedi

- Intestazione: URL di connessione, agente corrente, sessione corrente.
- Log chat: messaggi utente, risposte dell'assistente, avvisi di sistema, schede strumenti.
- Riga di stato: stato della connessione/esecuzione (connessione, in esecuzione, streaming, inattivo, errore).
- Piè di pagina: stato connessione + agente + sessione + modello + think/fast/verbose/reasoning + conteggi token + consegna.
- Input: editor di testo con completamento automatico.

## Modello mentale: agenti + sessioni

- Gli agenti sono slug univoci (ad esempio `main`, `research`). Il Gateway espone l'elenco.
- Le sessioni appartengono all'agente corrente.
- Le chiavi di sessione sono archiviate come `agent:<agentId>:<sessionKey>`.
  - Se digiti `/session main`, la TUI lo espande in `agent:<currentAgent>:main`.
  - Se digiti `/session agent:other:main`, passi esplicitamente a quella sessione agente.
- Ambito sessione:
  - `per-sender` (predefinito): ogni agente ha molte sessioni.
  - `global`: la TUI usa sempre la sessione `global` (il selettore può essere vuoto).
- L'agente corrente + la sessione corrente sono sempre visibili nel piè di pagina.

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
- Impostazioni: attiva/disattiva consegna, espansione output strumenti e visibilità del thinking.

## Scorciatoie da tastiera

- Invio: invia messaggio
- Esc: interrompe l'esecuzione attiva
- Ctrl+C: cancella input (premi due volte per uscire)
- Ctrl+D: esci
- Ctrl+L: selettore modello
- Ctrl+G: selettore agente
- Ctrl+P: selettore sessione
- Ctrl+O: attiva/disattiva espansione output strumenti
- Ctrl+T: attiva/disattiva visibilità del thinking (ricarica la cronologia)

## Comandi slash

Core:

- `/help`
- `/status`
- `/agent <id>` (oppure `/agents`)
- `/session <key>` (oppure `/sessions`)
- `/model <provider/model>` (oppure `/models`)

Controlli sessione:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
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

Altri comandi slash Gateway (per esempio `/context`) vengono inoltrati al Gateway e mostrati come output di sistema. Vedi [Comandi slash](/tools/slash-commands).

## Comandi shell locali

- Anteponi `!` a una riga per eseguire un comando shell locale sull'host della TUI.
- La TUI chiede una sola volta per sessione se consentire l'esecuzione locale; rifiutare mantiene `!` disabilitato per la sessione.
- I comandi vengono eseguiti in una shell fresca e non interattiva nella directory di lavoro della TUI (nessun `cd`/env persistente).
- I comandi shell locali ricevono `OPENCLAW_SHELL=tui-local` nel loro ambiente.
- Un `!` isolato viene inviato come messaggio normale; gli spazi iniziali non attivano l'exec locale.

## Output degli strumenti

- Le chiamate agli strumenti vengono mostrate come schede con argomenti + risultati.
- Ctrl+O alterna tra vista compressa/espansa.
- Mentre gli strumenti sono in esecuzione, gli aggiornamenti parziali vengono trasmessi in streaming nella stessa scheda.

## Colori del terminale

- La TUI mantiene il testo del corpo dell'assistente nel colore di primo piano predefinito del terminale, così sia i terminali scuri sia quelli chiari restano leggibili.
- Se il tuo terminale usa uno sfondo chiaro e il rilevamento automatico è errato, imposta `OPENCLAW_THEME=light` prima di avviare `openclaw tui`.
- Per forzare invece la palette scura originale, imposta `OPENCLAW_THEME=dark`.

## Cronologia + streaming

- Alla connessione, la TUI carica la cronologia più recente (predefinito 200 messaggi).
- Le risposte in streaming si aggiornano sul posto fino alla finalizzazione.
- La TUI ascolta anche gli eventi degli strumenti agente per schede strumenti più ricche.

## Dettagli di connessione

- La TUI si registra presso il Gateway come `mode: "tui"`.
- Le riconnessioni mostrano un messaggio di sistema; eventuali lacune negli eventi vengono segnalate nel log.

## Opzioni

- `--url <url>`: URL WebSocket del Gateway (predefinito da config o `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (se richiesto)
- `--password <password>`: password Gateway (se richiesta)
- `--session <key>`: chiave sessione (predefinito: `main`, oppure `global` quando l'ambito è globale)
- `--deliver`: consegna le risposte dell'assistente al provider (disattivato per impostazione predefinita)
- `--thinking <level>`: override del livello thinking per gli invii
- `--message <text>`: invia un messaggio iniziale dopo la connessione
- `--timeout-ms <ms>`: timeout agente in ms (predefinito `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: voci di cronologia da caricare (predefinito `200`)

Nota: quando imposti `--url`, la TUI non usa fallback a credenziali di configurazione o ambiente.
Passa esplicitamente `--token` o `--password`. L'assenza di credenziali esplicite è un errore.

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

- [UI di controllo](/web/control-ui) — interfaccia di controllo basata sul web
- [Riferimento CLI](/cli) — riferimento completo dei comandi CLI
