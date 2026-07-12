---
read_when:
    - Vuoi aprire l'interfaccia di controllo con il tuo token attuale
    - Vuoi visualizzare l'URL senza avviare un browser
summary: Riferimento della CLI per `openclaw dashboard` (apre l'interfaccia di controllo)
title: Pannello di controllo
x-i18n:
    generated_at: "2026-07-12T06:54:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Apri l'interfaccia di controllo utilizzando l'autenticazione corrente.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: stampa l'URL ma non avviare un browser.
- `--yes`: avvia/installa il Gateway senza chiedere conferma quando necessario.

Note:

- Risolve i SecretRef configurati in `gateway.auth.token` quando possibile.
- Rispetta `gateway.tls.enabled`: i Gateway con TLS abilitato stampano/aprono gli URL dell'interfaccia di controllo con `https://` e si connettono tramite `wss://`.
- Per un'associazione `lan` o `custom` con carattere jolly, gli avvii sullo stesso host utilizzano sempre local loopback, perché un carattere jolly non è una destinazione per il browser. Anche le associazioni `tailnet` e `custom` senza crittografia utilizzano `127.0.0.1`, affinché il browser disponga di un contesto sicuro; gli host specifici con TLS abilitato mantengono l'indirizzo configurato, affinché i nomi dei certificati corrispondano.
- Prima di fornire un URL local loopback autenticato per un'associazione a un'interfaccia specifica, il comando verifica l'interfaccia configurata e che questa e `127.0.0.1` appartengano allo stesso processo Gateway. Se la proprietà del listener è ambigua, l'operazione viene interrotta in modo sicuro con indicazioni sullo stato.
- Per i token gestiti tramite SecretRef, risolti o meno, l'URL stampato, copiato o aperto non include mai il token, evitando che i segreti esterni vengano esposti nell'output del terminale, nella cronologia degli appunti o negli argomenti di avvio del browser.
- Se `gateway.auth.token` è gestito tramite SecretRef ma non è risolto, il comando stampa un URL senza token e indicazioni per risolvere il problema, anziché un segnaposto di token non valido.
- Se la trasmissione tramite appunti/browser non riesce per un URL autenticato mediante token, il comando registra un suggerimento sicuro per l'autenticazione manuale che indica `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` e la chiave del frammento URL `token`, senza stampare il valore del token.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Dashboard](/it/web/dashboard)
