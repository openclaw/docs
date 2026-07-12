---
read_when:
    - Esecuzione di script dal repository
    - Aggiunta o modifica di script in ./scripts
summary: 'Script del repository: scopo, ambito e note sulla sicurezza'
title: Script
x-i18n:
    generated_at: "2026-07-12T07:06:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` contiene script ausiliari per i flussi di lavoro locali e le attività operative. Usali quando un'attività è chiaramente legata a uno script; altrimenti, preferisci la CLI.

## Convenzioni

- Gli script sono **facoltativi**, a meno che non siano citati nella documentazione o nelle liste di controllo per il rilascio.
- Preferisci le funzionalità della CLI quando disponibili (esempio: `openclaw models status --check`).
- Presumi che gli script siano specifici dell'host; leggili prima di eseguirli su una nuova macchina.

## Script di monitoraggio dell'autenticazione

L'autenticazione generale dei modelli è descritta in [Autenticazione](/it/gateway/authentication). Gli script seguenti costituiscono un sistema separato e facoltativo per monitorare un **token di abbonamento alla CLI di Claude Code** su un host remoto o senza interfaccia grafica e ripetere l'autenticazione da un telefono:

- `scripts/setup-auth-system.sh` - configurazione iniziale: verifica l'autenticazione corrente, aiuta a generare un `claude setup-token` di lunga durata e mostra i passaggi di installazione per systemd/Termux.
- `scripts/claude-auth-status.sh [full|json|simple]` - verifica lo stato dell'autenticazione di Claude Code e OpenClaw.
- `scripts/auth-monitor.sh` - controlla periodicamente lo stato e invia una notifica (tramite l'invio di OpenClaw e/o ntfy.sh) quando il token è prossimo alla scadenza. Variabili d'ambiente: `WARN_HOURS` (valore predefinito `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Eseguilo a intervalli regolari tramite i file inclusi `scripts/systemd/openclaw-auth-monitor.{service,timer}` (ogni 30 minuti).
- `scripts/mobile-reauth.sh` - esegue nuovamente `claude setup-token` e mostra gli URL da aprire su un telefono, per l'utilizzo tramite SSH da Termux.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - script per Termux:Widget che si connettono all'host tramite SSH, mostrano una notifica temporanea sullo stato e aprono la console o le istruzioni per ripetere l'autenticazione quando questa è scaduta.

## Utilità di lettura per GitHub

Usa `scripts/gh-read` quando vuoi che `gh` utilizzi un token di installazione di un'app GitHub per le chiamate di lettura limitate al repository, mantenendo al contempo il normale `gh` connesso al tuo account personale per le operazioni di scrittura.

Variabili d'ambiente obbligatorie:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variabili d'ambiente facoltative:

- `OPENCLAW_GH_READ_INSTALLATION_ID` quando vuoi ignorare la ricerca dell'installazione basata sul repository
- `OPENCLAW_GH_READ_PERMISSIONS` come valore alternativo separato da virgole per il sottoinsieme di autorizzazioni di lettura da richiedere

Ordine di risoluzione del repository:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Esempi:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Quando aggiungi script

- Mantieni gli script mirati e documentati.
- Aggiungi una breve voce nella documentazione pertinente (oppure creane una se manca).

## Contenuti correlati

- [Test](/it/help/testing)
- [Test in ambiente reale](/it/help/testing-live)
