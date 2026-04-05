---
read_when:
    - Devi accedere ai siti per l'automazione del browser
    - Vuoi pubblicare aggiornamenti su X/Twitter
summary: Accessi manuali per l'automazione del browser + pubblicazione su X/Twitter
title: Accesso al browser
x-i18n:
    generated_at: "2026-04-05T14:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: de40685c70f1c141dba98e6dadc2c6f3a2b3b6d98c89ef8404144c9d178bb763
    source_path: tools/browser-login.md
    workflow: 15
---

# Accesso al browser + pubblicazione su X/Twitter

## Accesso manuale (consigliato)

Quando un sito richiede l'accesso, **accedi manualmente** nel profilo del browser **host** (il browser openclaw).

**Non** fornire al modello le tue credenziali. Gli accessi automatici spesso attivano le difese anti‑bot e possono bloccare l'account.

Torna alla documentazione principale del browser: [Browser](/tools/browser).

## Quale profilo Chrome viene usato?

OpenClaw controlla un **profilo Chrome dedicato** (chiamato `openclaw`, con interfaccia arancione). È separato dal profilo del browser che usi ogni giorno.

Per le chiamate dello strumento browser dell'agente:

- Scelta predefinita: l'agente dovrebbe usare il suo browser `openclaw` isolato.
- Usa `profile="user"` solo quando le sessioni già con accesso effettuato sono importanti e l'utente è al computer per fare clic o approvare eventuali richieste di collegamento.
- Se hai più profili del browser utente, specifica il profilo in modo esplicito invece di indovinare.

Due modi semplici per accedervi:

1. **Chiedi all'agente di aprire il browser** e poi accedi tu stesso.
2. **Aprilo tramite CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Se hai più profili, passa `--browser-profile <name>` (il predefinito è `openclaw`).

## X/Twitter: flusso consigliato

- **Lettura/ricerca/thread:** usa il browser **host** (accesso manuale).
- **Pubblicazione di aggiornamenti:** usa il browser **host** (accesso manuale).

## Sandboxing + accesso al browser host

Le sessioni del browser in sandbox hanno **più probabilità** di attivare il rilevamento bot. Per X/Twitter (e altri siti rigidi), preferisci il browser **host**.

Se l'agente è in sandbox, lo strumento browser usa per impostazione predefinita la sandbox. Per consentire il controllo host:

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

Poi scegli come destinazione il browser host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Oppure disabilita il sandboxing per l'agente che pubblica aggiornamenti.
