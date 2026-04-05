---
read_when:
    - Vuoi un'interfaccia terminale per il Gateway (adatta all'uso remoto)
    - Vuoi passare url/token/session dagli script
summary: Riferimento CLI per `openclaw tui` (interfaccia utente terminale connessa al Gateway)
title: tui
x-i18n:
    generated_at: "2026-04-05T13:48:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Apri l'interfaccia utente terminale connessa al Gateway.

Correlato:

- Guida TUI: [TUI](/web/tui)

Note:

- `tui` risolve i SecretRef di auth del gateway configurati per l'autenticazione tramite token/password quando possibile (provider `env`/`file`/`exec`).
- Quando viene avviata da dentro una directory workspace di un agente configurato, la TUI seleziona automaticamente quell'agente come valore predefinito della chiave di sessione (a meno che `--session` non sia esplicitamente `agent:<id>:...`).

## Esempi

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# quando viene eseguito all'interno di un workspace agente, deduce automaticamente quell'agente
openclaw tui --session bugfix
```
