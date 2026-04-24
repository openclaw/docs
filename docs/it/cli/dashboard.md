---
read_when:
    - Vuoi aprire l'interfaccia Control con il tuo token attuale
    - Vuoi stampare l'URL senza avviare un browser
summary: Riferimento CLI per `openclaw dashboard` (apri l'interfaccia Control)
title: Dashboard
x-i18n:
    generated_at: "2026-04-24T08:33:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Apri l'interfaccia Control usando l'autenticazione corrente.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Note:

- `dashboard` risolve i SecretRef configurati di `gateway.auth.token` quando possibile.
- Per i token gestiti da SecretRef (risolti o non risolti), `dashboard` stampa/copia/apre un URL senza token per evitare di esporre segreti esterni nell'output del terminale, nella cronologia degli appunti o negli argomenti di avvio del browser.
- Se `gateway.auth.token` è gestito da SecretRef ma non risolto in questo percorso di comando, il comando stampa un URL senza token e indicazioni esplicite di correzione invece di incorporare un segnaposto di token non valido.

## Correlati

- [Riferimento CLI](/it/cli)
- [Dashboard](/it/web/dashboard)
