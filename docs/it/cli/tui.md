---
read_when:
    - Vuoi una TUI per il Gateway (adatta all'uso remoto)
    - Vuoi passare url/token/sessione da script
    - Vuoi eseguire la TUI in modalità incorporata locale senza un Gateway
    - Vuoi usare openclaw chat o openclaw tui --local
summary: Riferimento CLI per `openclaw tui` (interfaccia terminale incorporata locale o supportata dal Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-23T08:27:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Apri la TUI terminale connessa al Gateway oppure eseguila in modalità
incorporata locale.

Correlati:

- Guida TUI: [TUI](/it/web/tui)

Note:

- `chat` e `terminal` sono alias di `openclaw tui --local`.
- `--local` non può essere combinato con `--url`, `--token` o `--password`.
- `tui` risolve i SecretRef di autenticazione del gateway configurati per l'autenticazione con token/password quando possibile (provider `env`/`file`/`exec`).
- Quando viene avviata dall'interno di una directory di workspace agente configurata, la TUI seleziona automaticamente quell'agente per il valore predefinito della chiave di sessione (a meno che `--session` non sia esplicitamente `agent:<id>:...`).
- La modalità locale usa direttamente il runtime incorporato dell'agente. La maggior parte degli strumenti locali funziona, ma le funzionalità solo Gateway non sono disponibili.
- La modalità locale aggiunge `/auth [provider]` all'interno della superficie di comando della TUI.
- I gate di approvazione dei plugin si applicano comunque in modalità locale. Gli strumenti che richiedono approvazione chiedono una decisione nel terminale; nulla viene approvato automaticamente in silenzio solo perché il Gateway non è coinvolto.

## Esempi

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# quando viene eseguito all'interno di un workspace agente, deduce automaticamente quell'agente
openclaw tui --session bugfix
```

## Ciclo di riparazione della config

Usa la modalità locale quando la config corrente è già valida e vuoi che l'agente
incorporato la ispezioni, la confronti con la documentazione e aiuti a ripararla
dallo stesso terminale:

Se `openclaw config validate` sta già fallendo, usa prima `openclaw configure` o
`openclaw doctor --fix`. `openclaw chat` non aggira il controllo di
config non valida.

```bash
openclaw chat
```

Poi all'interno della TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Applica correzioni mirate con `openclaw config set` o `openclaw configure`, poi
riesegui `openclaw config validate`. Vedi [TUI](/it/web/tui) e [Config](/it/cli/config).
