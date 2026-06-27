---
read_when:
    - Vuoi un’interfaccia utente da terminale per il Gateway (adatta all’uso da remoto)
    - Vuoi passare url/token/session dagli script
    - Vuoi eseguire la TUI in modalità incorporata locale senza un Gateway
    - Vuoi usare openclaw chat o openclaw tui --local
summary: Riferimento CLI per `openclaw tui` (interfaccia terminale supportata dal Gateway o integrata localmente)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:22:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Apri la UI da terminale connessa al Gateway oppure eseguila in modalità integrata
locale.

Correlati:

- Guida TUI: [TUI](/it/web/tui)

## Opzioni

| Flag                  | Predefinito                               | Descrizione                                                                                                             |
| --------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Esegui sul runtime dell'agente integrato locale invece che su un Gateway.                                               |
| `--url <url>`         | `gateway.remote.url` dalla configurazione | URL WebSocket del Gateway.                                                                                              |
| `--token <token>`     | (nessuno)                                 | Token del Gateway se richiesto.                                                                                         |
| `--password <pass>`   | (nessuno)                                 | Password del Gateway se richiesta.                                                                                      |
| `--session <key>`     | `main` (o `global` quando l'ambito è globale) | Chiave di sessione. Dentro un workspace dell'agente seleziona automaticamente quell'agente, salvo prefisso esplicito. |
| `--deliver`           | `false`                                   | Recapita le risposte dell'assistente tramite i canali configurati.                                                      |
| `--thinking <level>`  | (predefinito del modello)                 | Override del livello di ragionamento.                                                                                   |
| `--message <text>`    | (nessuno)                                 | Invia un messaggio iniziale dopo la connessione.                                                                        |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Timeout dell'agente. I valori non validi registrano un avviso e vengono ignorati.                                      |
| `--history-limit <n>` | `200`                                     | Voci della cronologia da caricare all'aggancio.                                                                         |

Alias: `openclaw chat` e `openclaw terminal` invocano lo stesso comando con `--local` implicito.

Note:

- `chat` e `terminal` sono alias per `openclaw tui --local`.
- `--local` non può essere combinato con `--url`, `--token` o `--password`.
- `tui` risolve le SecretRefs di autenticazione Gateway configurate per l'autenticazione tramite token/password quando possibile (provider `env`/`file`/`exec`).
- Quando viene avviata dall'interno di una directory workspace dell'agente configurata, TUI seleziona automaticamente quell'agente come valore predefinito della chiave di sessione (salvo che `--session` sia esplicitamente `agent:<id>:...`).
- Per mostrare il nome host del Gateway nel footer per connessioni non locali basate su URL, esegui `openclaw config set tui.footer.showRemoteHost true`. L'etichetta host è disattivata per impostazione predefinita e non appare mai per connessioni local loopback o locali integrate.
- La modalità locale usa direttamente il runtime dell'agente integrato. La maggior parte degli strumenti locali funziona, ma le funzionalità disponibili solo tramite Gateway non sono disponibili.
- La modalità locale aggiunge `/auth [provider]` alla superficie dei comandi TUI.
- I gate di approvazione dei Plugin si applicano comunque in modalità locale. Gli strumenti che richiedono approvazione chiedono una decisione nel terminale; nulla viene approvato automaticamente in silenzio solo perché il Gateway non è coinvolto.
- Gli [obiettivi](/it/tools/goal) della sessione appaiono nel footer e possono essere gestiti con `/goal`.

## Esempi

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Ciclo di riparazione della configurazione

Usa la modalità locale quando la configurazione corrente è già valida e vuoi che
l'agente integrato la ispezioni, la confronti con la documentazione e aiuti a
ripararla dallo stesso terminale:

Se `openclaw config validate` sta già fallendo, usa prima `openclaw configure` o
`openclaw doctor --fix`. `openclaw chat` non aggira la protezione contro la
configurazione non valida.

```bash
openclaw chat
```

Poi dentro la TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Applica correzioni mirate con `openclaw config set` o `openclaw configure`, poi
riesegui `openclaw config validate`. Vedi [TUI](/it/web/tui) e [Configurazione](/it/cli/config).

## Correlati

- [Riferimento CLI](/it/cli)
- [TUI](/it/web/tui)
- [Obiettivo](/it/tools/goal)
