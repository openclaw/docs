---
read_when:
    - È necessario effettuare l'accesso ai siti per l'automazione del browser
    - Vuoi pubblicare aggiornamenti su X/Twitter
summary: Accessi manuali per l'automazione del browser + pubblicazione su X/Twitter
title: Accesso tramite browser
x-i18n:
    generated_at: "2026-05-06T09:10:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Accesso manuale (consigliato)

Quando un sito richiede l'accesso, **accedi manualmente** nel profilo del browser **host** (il browser openclaw).

**Non** fornire al modello le tue credenziali. Gli accessi automatizzati spesso attivano le difese anti-bot e possono bloccare l'account.

Torna alla documentazione principale del browser: [Browser](/it/tools/browser).

## Quale profilo Chrome viene usato?

OpenClaw controlla un **profilo Chrome dedicato** (chiamato `openclaw`, con interfaccia arancione). È separato dal profilo del browser che usi ogni giorno.

Per le chiamate allo strumento browser dell'agente:

- Scelta predefinita: l'agente deve usare il proprio browser `openclaw` isolato.
- Usa `profile="user"` solo quando le sessioni già autenticate sono importanti e l'utente è al computer per fare clic/approvare eventuali richieste di collegamento.
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
- **Pubblicare aggiornamenti:** usa il browser **host** (accesso manuale).

## Sandboxing + accesso al browser host

Le sessioni del browser in sandbox hanno **maggiori probabilità** di attivare il rilevamento dei bot. Per X/Twitter (e altri siti rigidi), preferisci il browser **host**.

Se l'agente è in sandbox, lo strumento browser usa la sandbox per impostazione predefinita. Per consentire il controllo dell'host:

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

Poi seleziona il browser host come destinazione:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Oppure disattiva la sandbox per l'agente che pubblica aggiornamenti.

## Correlati

- [Browser](/it/tools/browser)
- [Risoluzione dei problemi del browser su Linux](/it/tools/browser-linux-troubleshooting)
- [Risoluzione dei problemi del browser WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
