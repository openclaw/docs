---
read_when:
    - Vuoi un'interfaccia utente da terminale per il Gateway (adatta all'accesso remoto)
    - Vuoi passare URL/token/sessione dagli script
    - Vuoi eseguire la TUI in modalità integrata locale senza un Gateway
    - Vuoi usare openclaw chat o openclaw tui --local
summary: Riferimento della CLI per `openclaw tui` (interfaccia utente del terminale supportata dal Gateway o incorporata localmente)
title: TUI
x-i18n:
    generated_at: "2026-07-12T06:55:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Apre l'interfaccia utente del terminale connessa al Gateway oppure la esegue in modalità locale incorporata.

Guida correlata: [TUI](/it/web/tui)

## Opzioni

| Flag                         | Valore predefinito                        | Descrizione                                                                                          |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Usa il runtime locale incorporato dell'agente anziché un Gateway.                                    |
| `--url <url>`                | `gateway.remote.url` dalla configurazione | URL WebSocket del Gateway.                                                                           |
| `--token <token>`            | (nessuno)                                 | Token del Gateway, se richiesto.                                                                     |
| `--password <pass>`          | (nessuna)                                 | Password del Gateway, se richiesta.                                                                  |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Impronta prevista del certificato TLS per un Gateway `wss://` con certificato vincolato.              |
| `--session <key>`            | `main` (o `global` se l'ambito è globale) | Chiave di sessione. In uno spazio di lavoro di un agente, seleziona automaticamente tale agente se non viene specificato un prefisso. |
| `--deliver`                  | `false`                                   | Recapita le risposte dell'assistente tramite i canali configurati.                                   |
| `--thinking <level>`         | (predefinito del modello)                 | Sostituzione del livello di ragionamento.                                                             |
| `--message <text>`           | (nessuno)                                 | Invia un messaggio iniziale dopo la connessione.                                                      |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Timeout dell'agente. I valori non validi generano un avviso nel registro e vengono ignorati.          |
| `--history-limit <n>`        | `200`                                     | Numero di voci della cronologia da caricare alla connessione.                                         |

Gli alias `openclaw chat` e `openclaw terminal` richiamano questo comando con `--local` implicito.

## Note

- `--local` non può essere combinato con `--url`, `--token`, `--password` o `--tls-fingerprint`.
- Quando possibile, `tui` risolve i SecretRef di autenticazione del Gateway configurati per l'autenticazione tramite token/password (provider `env`/`file`/`exec`).
- Se non vengono specificati esplicitamente un URL o una porta, `tui` usa la porta attiva del Gateway locale registrata dal Gateway in esecuzione. `--url`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_PORT` e la configurazione del Gateway remoto esplicitamente impostati mantengono la precedenza.
- Se avviata dall'interno della directory dello spazio di lavoro di un agente configurato, la TUI seleziona automaticamente tale agente come valore predefinito della chiave di sessione, a meno che `--session` non sia esplicitamente nel formato `agent:<id>:...`.
- Per mostrare il nome host del Gateway nel piè di pagina per le connessioni non locali basate su URL, esegui `openclaw config set tui.footer.showRemoteHost true`. È disattivato per impostazione predefinita e non viene mai mostrato per connessioni local loopback o locali incorporate.
- La modalità locale usa direttamente il runtime incorporato dell'agente. La maggior parte degli strumenti locali funziona, ma le funzionalità disponibili solo tramite Gateway non sono accessibili.
- La modalità locale aggiunge `/auth [provider]` ai comandi disponibili nella TUI.
- I controlli di approvazione dei Plugin si applicano anche in modalità locale: gli strumenti che richiedono approvazione chiedono una decisione nel terminale; nulla viene approvato automaticamente e senza avviso.
- Gli [obiettivi](/it/tools/goal) della sessione compaiono nel piè di pagina e possono essere gestiti con `/goal`.

## Esempi

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Confronta la mia configurazione con la documentazione e dimmi cosa correggere"
# quando viene eseguito nello spazio di lavoro di un agente, deduce automaticamente tale agente
openclaw tui --session bugfix
```

## Ciclo di riparazione della configurazione

Usa la modalità locale per consentire all'agente incorporato di esaminare la configurazione corrente, confrontarla con la documentazione e aiutarti a correggerla dallo stesso terminale.

Se `openclaw config validate` non riesce già, esegui prima `openclaw configure` o `openclaw doctor --fix`; `openclaw chat` non ignora il controllo che impedisce l'uso di una configurazione non valida.

```bash
openclaw chat
```

Quindi, all'interno della TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Applica correzioni mirate con `openclaw config set` o `openclaw configure`, quindi esegui nuovamente `openclaw config validate`. Consulta [TUI](/it/web/tui) e [Configurazione](/it/cli/config).

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
- [TUI](/it/web/tui)
- [Obiettivo](/it/tools/goal)
