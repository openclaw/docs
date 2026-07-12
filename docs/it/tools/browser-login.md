---
read_when:
    - Devi accedere ai siti per l'automazione del browser
    - Vuoi pubblicare aggiornamenti su X/Twitter
summary: Accessi manuali per l'automazione del browser e la pubblicazione su X/Twitter
title: Accesso tramite browser
x-i18n:
    generated_at: "2026-07-12T07:32:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Accesso manuale (consigliato)

Quando un sito richiede l'accesso, accedi manualmente nel profilo `openclaw`
del browser host. Non fornire al modello le tue credenziali: gli accessi
automatizzati spesso attivano le difese anti-bot e possono bloccare l'account.

Usa il browser host (con accesso manuale) sia per leggere (ricerche/thread) sia
per pubblicare su X/Twitter e altri siti sensibili ai bot. Le sessioni del
browser in sandbox hanno maggiori probabilità di attivare il rilevamento dei bot.

Torna alla documentazione principale del browser: [Browser](/it/tools/browser).

## Quale profilo Chrome viene utilizzato?

OpenClaw controlla un profilo Chrome dedicato denominato `openclaw` (interfaccia
con tonalità arancione), separato dal profilo del browser che usi quotidianamente.

Per le chiamate allo strumento browser dell'agente:

- Scelta predefinita: l'agente usa il proprio browser `openclaw` isolato.
- Usa `profile="user"` solo quando sono necessarie sessioni esistenti con accesso
  già effettuato e sei al computer per fare clic o approvare eventuali richieste
  di collegamento.
- Se hai più profili del browser utente, specifica esplicitamente il profilo
  anziché procedere per tentativi.

Esistono due modi per accedere al profilo `openclaw`:

1. Chiedi all'agente di aprire il browser, quindi accedi personalmente.
2. Aprilo tramite CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Per un profilo non predefinito, inserisci `--browser-profile <name>` prima del
sottocomando (il valore predefinito è `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Sandbox: consentire l'accesso al browser host

Se l'agente è in sandbox, le chiamate al suo strumento `browser` utilizzano per
impostazione predefinita il browser della sandbox, non quello host. Per consentire
all'agente di usare invece il browser host:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Le invocazioni della CLI usano sempre il browser host, mai la sandbox, quindi
puoi aprire personalmente il browser host indipendentemente da questa impostazione:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Dopo aver impostato `sandbox.browser.allowHostControl: true`, anche le chiamate
allo strumento `browser` dell'agente possono usare il browser host. In alternativa,
disabilita la sandbox per l'agente che pubblica gli aggiornamenti.

## Argomenti correlati

- [Browser](/it/tools/browser)
- [Risoluzione dei problemi del browser su Linux](/it/tools/browser-linux-troubleshooting)
- [Risoluzione dei problemi del browser su WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
