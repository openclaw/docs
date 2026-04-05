---
read_when:
    - Vuoi aprire la UI di controllo con il tuo token corrente
    - Vuoi stampare l'URL senza avviare un browser
summary: Riferimento CLI per `openclaw dashboard` (apre la UI di controllo)
title: dashboard
x-i18n:
    generated_at: "2026-04-05T13:47:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Apri la UI di controllo usando la tua autenticazione corrente.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Note:

- `dashboard` risolve i SecretRef configurati di `gateway.auth.token` quando possibile.
- Per i token gestiti da SecretRef (risolti o non risolti), `dashboard` stampa/copia/apre un URL senza token per evitare di esporre secret esterni nell'output del terminale, nella cronologia degli appunti o negli argomenti di avvio del browser.
- Se `gateway.auth.token` è gestito da SecretRef ma non risolto in questo percorso di comando, il comando stampa un URL senza token e indicazioni esplicite per la risoluzione del problema invece di incorporare un segnaposto token non valido.
