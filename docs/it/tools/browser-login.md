---
read_when:
    - È necessario accedere ai siti per l'automazione del browser
    - Vuoi pubblicare aggiornamenti su X/Twitter
summary: Accessi manuali per l'automazione del browser + pubblicazione su X/Twitter
title: Accesso tramite browser
x-i18n:
    generated_at: "2026-05-11T20:36:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89501b47611a39df5a658ed7e144b7c16a07188dfa52544b56cbfc6e296e2ecc
    source_path: tools/browser-login.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Accesso manuale (consigliato)

Quando un sito richiede l'accesso, **accedi manualmente** nel profilo del browser **host** (il browser openclaw).

**Non** fornire al modello le tue credenziali. Gli accessi automatizzati spesso attivano le difese anti-bot e possono bloccare l'account.

Torna alla documentazione principale del browser: [Browser](/it/tools/browser).

## Quale profilo Chrome viene usato?

OpenClaw controlla un **profilo Chrome dedicato** (chiamato `openclaw`, con interfaccia a tonalità arancione). Questo è separato dal tuo profilo browser quotidiano.

Per le chiamate allo strumento browser dell'agente:

- Scelta predefinita: l'agente dovrebbe usare il proprio browser `openclaw` isolato.
- Usa `profile="user"` solo quando le sessioni con accesso esistenti sono rilevanti e l'utente è al computer per fare clic/approvare eventuali prompt di collegamento.
- Se hai più profili del browser utente, specifica esplicitamente il profilo invece di tirare a indovinare.

Due modi semplici per accedervi:

1. **Chiedi all'agente di aprire il browser** e poi accedi tu.
2. **Aprilo tramite CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Se hai più profili, passa `--browser-profile <name>` (il valore predefinito è `openclaw`).

## X/Twitter: flusso consigliato

- **Lettura/ricerca/thread:** usa il browser **host** (accesso manuale).
- **Pubblicazione aggiornamenti:** usa il browser **host** (accesso manuale).

## Sandboxing + accesso al browser host

Le sessioni browser in sandbox hanno **maggiori probabilità** di attivare il rilevamento dei bot. Per X/Twitter (e altri siti rigorosi), preferisci il browser **host**.

Se l'agente è in sandbox, lo strumento browser usa per impostazione predefinita la sandbox. Per consentire il controllo dell'host:

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

Poi apri tu il browser host (le invocazioni CLI vengono sempre eseguite rispetto al browser host):

```bash
openclaw browser open https://x.com --browser-profile openclaw
```

Le chiamate allo strumento `browser` dell'agente possono quindi puntare all'host una volta impostato `sandbox.browser.allowHostControl: true`. In alternativa, disabilita il sandboxing per l'agente che pubblica aggiornamenti.

## Correlati

- [Browser](/it/tools/browser)
- [Risoluzione dei problemi del browser su Linux](/it/tools/browser-linux-troubleshooting)
- [Risoluzione dei problemi del browser WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
