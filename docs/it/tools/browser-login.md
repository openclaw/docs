---
read_when:
- You need to log into sites for browser automation
- Vuoi pubblicare aggiornamenti su X/Twitter
summary: Accessi manuali per automazione del browser + pubblicazione su X/Twitter
title: Accesso browser
x-i18n:
  generated_at: '2026-04-24T09:04:15Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
  source_path: tools/browser-login.md
  workflow: 15
---

# Accesso browser + pubblicazione su X/Twitter

## Accesso manuale (consigliato)

Quando un sito richiede l'accesso, **accedi manualmente** nel profilo browser **host** (il browser openclaw).

**Non** fornire al modello le tue credenziali. Gli accessi automatizzati spesso attivano difese anti-bot e possono bloccare l'account.

Torna alla documentazione principale del browser: [Browser](/it/tools/browser).

## Quale profilo Chrome viene usato?

OpenClaw controlla un **profilo Chrome dedicato** (chiamato `openclaw`, UI con tinta arancione). È separato dal tuo profilo browser quotidiano.

Per le chiamate degli strumenti browser dell'agente:

- Scelta predefinita: l'agente dovrebbe usare il suo browser isolato `openclaw`.
- Usa `profile="user"` solo quando contano sessioni già autenticate e l'utente è al computer per cliccare/approvare eventuali prompt di attach.
- Se hai più profili del browser utente, specifica esplicitamente il profilo invece di indovinare.

Due modi semplici per accedervi:

1. **Chiedi all'agente di aprire il browser** e poi accedi tu stesso.
2. **Aprilo via CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Se hai più profili, passa `--browser-profile <name>` (il predefinito è `openclaw`).

## X/Twitter: flusso consigliato

- **Lettura/ricerca/thread:** usa il browser **host** (accesso manuale).
- **Pubblicazione di aggiornamenti:** usa il browser **host** (accesso manuale).

## Sandboxing + accesso al browser host

Le sessioni browser sandboxed hanno **più probabilità** di attivare il rilevamento bot. Per X/Twitter (e altri siti rigidi), preferisci il browser **host**.

Se l'agente è sandboxed, lo strumento browser usa per default la sandbox. Per consentire il controllo host:

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

Poi punta al browser host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Oppure disabilita il sandboxing per l'agente che pubblica aggiornamenti.

## Correlati

- [Browser](/it/tools/browser)
- [Risoluzione dei problemi del browser su Linux](/it/tools/browser-linux-troubleshooting)
- [Risoluzione dei problemi del browser su WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
