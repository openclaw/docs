---
read_when:
    - Vuoi aprire l'interfaccia utente di controllo con il tuo token corrente
    - Vuoi stampare l'URL senza avviare un browser
summary: Riferimento CLI per `openclaw dashboard` (apri la Control UI)
title: Cruscotto
x-i18n:
    generated_at: "2026-05-05T01:44:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dashboard`

Apri la UI di controllo usando la tua autenticazione corrente.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Note:

- `dashboard` risolve le SecretRef configurate in `gateway.auth.token` quando possibile.
- `dashboard` segue `gateway.tls.enabled`: i Gateway con TLS abilitato stampano/aprono
  gli URL `https://` della UI di controllo e si connettono tramite `wss://`.
- Se la consegna tramite appunti/browser non riesce per un URL della dashboard autenticato con token,
  `dashboard` registra un suggerimento sicuro per l'autenticazione manuale che nomina `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token` e la chiave di frammento `token` senza stampare il valore
  del token.
- Per i token gestiti da SecretRef (risolti o non risolti), `dashboard` stampa/copia/apre un URL senza token per evitare di esporre segreti esterni nell'output del terminale, nella cronologia degli appunti o negli argomenti di avvio del browser.
- Se `gateway.auth.token` è gestito da SecretRef ma non viene risolto in questo percorso di comando, il comando stampa un URL senza token e indicazioni esplicite per la risoluzione invece di incorporare un segnaposto di token non valido.

## Correlati

- [Riferimento CLI](/it/cli)
- [Dashboard](/it/web/dashboard)
