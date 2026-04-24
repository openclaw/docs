---
read_when:
    - Esecuzione degli script dal repository
    - Aggiunta o modifica di script in ./scripts
summary: 'Script del repository: scopo, ambito e note di sicurezza'
title: Script
x-i18n:
    generated_at: "2026-04-24T08:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

La directory `scripts/` contiene script di supporto per flussi di lavoro locali e attività operative.
Usali quando un'attività è chiaramente legata a uno script; altrimenti preferisci la CLI.

## Convenzioni

- Gli script sono **facoltativi** a meno che non siano citati nella documentazione o nelle checklist di rilascio.
- Preferisci le superfici CLI quando esistono (esempio: il monitoraggio auth usa `openclaw models status --check`).
- Considera gli script specifici dell'host; leggili prima di eseguirli su una nuova macchina.

## Script di monitoraggio auth

Il monitoraggio auth è trattato in [Autenticazione](/it/gateway/authentication). Gli script sotto `scripts/` sono extra facoltativi per flussi di lavoro systemd/Termux su telefono.

## Helper di lettura GitHub

Usa `scripts/gh-read` quando vuoi che `gh` usi un token di installazione GitHub App per chiamate di lettura con ambito repository, lasciando invece il normale `gh` sul tuo accesso personale per le azioni di scrittura.

Variabili env richieste:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variabili env facoltative:

- `OPENCLAW_GH_READ_INSTALLATION_ID` quando vuoi saltare la ricerca dell'installazione basata sul repository
- `OPENCLAW_GH_READ_PERMISSIONS` come override separato da virgole del sottoinsieme di permessi di lettura da richiedere

Ordine di risoluzione del repository:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Esempi:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Quando aggiungi script

- Mantieni gli script focalizzati e documentati.
- Aggiungi una breve voce nella documentazione pertinente (o creane una se manca).

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
