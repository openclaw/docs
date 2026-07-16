---
read_when:
    - Si desidera aprire l'interfaccia di controllo con il token attuale
    - Si desidera visualizzare l'URL senza avviare un browser
summary: Riferimento della CLI per `openclaw dashboard` (apre l'interfaccia di controllo)
title: Dashboard
x-i18n:
    generated_at: "2026-07-16T14:00:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Aprire l'interfaccia di controllo usando l'autenticazione corrente.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: stampa l'URL senza avviare un browser.
- `--json`: stampa un singolo oggetto di connessione leggibile dalla macchina senza aprire un browser, usare gli appunti, mostrare richieste o avviare il Gateway.
- `--yes`: avvia/installa il Gateway senza mostrare richieste quando necessario.

## Output leggibile dalla macchina

Usare `--json` per le integrazioni desktop e gli script che richiedono l'URL risolto dell'interfaccia di controllo:

```bash
openclaw dashboard --json
```

La risposta include `url`, `httpUrl`, `wsUrl`, `port` e `tokenIncluded`. Se il Gateway non è pronto, il comando restituisce `{"ok":false,"reason":"..."}` e termina con un codice diverso da zero. I token gestiti tramite SecretRef non vengono mai inclusi in `url`.

Note:

- Risolve le SecretRef `gateway.auth.token` configurate quando possibile.
- Segue `gateway.tls.enabled`: i gateway con TLS abilitato stampano/aprono URL `https://` dell'interfaccia di controllo e si connettono tramite `wss://`.
- Per `lan` o un'associazione `custom` con carattere jolly, gli avvii sullo stesso host usano sempre il loopback, perché un carattere jolly non è una destinazione per browser. Anche le associazioni `tailnet` e `custom` in testo non crittografato usano `127.0.0.1`, affinché il browser disponga di un contesto sicuro; gli host specifici con TLS abilitato mantengono l'indirizzo configurato, in modo che i nomi dei certificati corrispondano.
- Prima di fornire un URL di loopback autenticato per un'associazione a un'interfaccia specifica, il comando verifica l'interfaccia configurata e che essa e `127.0.0.1` appartengano allo stesso processo Gateway. Se la proprietà del listener è ambigua, l'operazione non riesce in modo sicuro e fornisce indicazioni sullo stato.
- Per i token gestiti tramite SecretRef (risolti o non risolti), l'URL stampato, copiato o aperto non include mai il token, evitando che i segreti esterni vengano divulgati nell'output del terminale, nella cronologia degli appunti o negli argomenti di avvio del browser.
- Se `gateway.auth.token` è gestito tramite SecretRef ma non risolto, il comando stampa un URL senza token e indicazioni per la risoluzione anziché un segnaposto di token non valido.
- Se il trasferimento tramite appunti/browser non riesce per un URL autenticato tramite token, il comando registra un suggerimento sicuro per l'autenticazione manuale che indica `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` e la chiave del frammento URL `token`, senza stampare il valore del token.

## Correlati

- [Riferimento CLI](/it/cli)
- [Dashboard](/it/web/dashboard)
