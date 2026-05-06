---
read_when:
    - Esecuzione degli script dal repository
    - Aggiunta o modifica di script in ./scripts
summary: 'Script del repository: scopo, ambito e note di sicurezza'
title: Script
x-i18n:
    generated_at: "2026-05-06T08:54:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
---

La directory `scripts/` contiene script di supporto per workflow locali e attività operative.
Usali quando un'attività è chiaramente legata a uno script; altrimenti preferisci la CLI.

## Convenzioni

- Gli script sono **facoltativi** salvo quando citati nella documentazione o nelle checklist di rilascio.
- Preferisci le superfici CLI quando esistono (esempio: il monitoraggio dell'autenticazione usa `openclaw models status --check`).
- Considera gli script specifici dell'host; leggili prima di eseguirli su una nuova macchina.

## Script di monitoraggio dell'autenticazione

Il monitoraggio dell'autenticazione è trattato in [Autenticazione](/it/gateway/authentication). Gli script in `scripts/` sono extra facoltativi per workflow su telefono systemd/Termux.

## Helper di lettura GitHub

Usa `scripts/gh-read` quando vuoi che `gh` usi un token di installazione di GitHub App per chiamate di lettura con ambito repository, lasciando il normale `gh` sul tuo login personale per le azioni di scrittura.

Env richieste:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Env facoltative:

- `OPENCLAW_GH_READ_INSTALLATION_ID` quando vuoi saltare la ricerca dell'installazione basata sul repository
- `OPENCLAW_GH_READ_PERMISSIONS` come override separato da virgole per il sottoinsieme di permessi di lettura da richiedere

Ordine di risoluzione del repository:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Esempi:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Quando si aggiungono script

- Mantieni gli script focalizzati e documentati.
- Aggiungi una breve voce nella documentazione pertinente (o creane una se manca).

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
