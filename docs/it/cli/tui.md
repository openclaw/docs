---
read_when:
    - Vuoi una TUI per il Gateway (adatta all'uso remoto)
    - Vuoi passare url/token/session dagli script
    - Vuoi eseguire la TUI in modalità incorporata locale senza un Gateway
    - Vuoi usare `openclaw chat` o `openclaw tui --local`
summary: Riferimento CLI per `openclaw tui` (interfaccia utente terminale incorporata locale o basata su Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-24T08:35:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Apri la TUI connessa al Gateway, oppure eseguila in modalità
incorporata locale.

Correlati:

- Guida TUI: [TUI](/it/web/tui)

Note:

- `chat` e `terminal` sono alias di `openclaw tui --local`.
- `--local` non può essere combinato con `--url`, `--token` o `--password`.
- `tui` risolve i SecretRef di autenticazione del Gateway configurati per l'autenticazione tramite token/password quando possibile (provider `env`/`file`/`exec`).
- Quando viene avviata dall'interno di una directory workspace di un agente configurato, la TUI seleziona automaticamente quell'agente come valore predefinito della chiave di sessione (a meno che `--session` non sia esplicitamente `agent:<id>:...`).
- La modalità locale usa direttamente il runtime incorporato dell'agente. La maggior parte degli strumenti locali funziona, ma le funzionalità riservate al Gateway non sono disponibili.
- La modalità locale aggiunge `/auth [provider]` all'interno della superficie dei comandi della TUI.
- I gate di approvazione dei Plugin continuano ad applicarsi in modalità locale. Gli strumenti che richiedono approvazione richiedono una decisione nel terminale; nulla viene auto-approvato silenziosamente perché il Gateway non è coinvolto.

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

Usa la modalità locale quando la configurazione corrente è già valida e vuoi che l'agente
incorporato la ispezioni, la confronti con la documentazione e aiuti a ripararla
dallo stesso terminale:

Se `openclaw config validate` fallisce già, usa prima `openclaw configure` o
`openclaw doctor --fix`. `openclaw chat` non bypassa la protezione contro la
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
esegui di nuovo `openclaw config validate`. Vedi [TUI](/it/web/tui) e [Config](/it/cli/config).

## Correlati

- [Riferimento CLI](/it/cli)
- [TUI](/it/web/tui)
