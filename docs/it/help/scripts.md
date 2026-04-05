---
read_when:
    - Esecuzione di script dal repository
    - Aggiunta o modifica di script in ./scripts
summary: 'Script del repository: scopo, ambito e note di sicurezza'
title: Script
x-i18n:
    generated_at: "2026-04-05T13:53:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: de53d64d91c564931bdd4e8b9f4a8e88646332a07cc2a6bf1d517b89debb29cd
    source_path: help/scripts.md
    workflow: 15
---

# Script

La directory `scripts/` contiene script di supporto per flussi di lavoro locali e attività operative.
Usali quando un'attività è chiaramente legata a uno script; altrimenti preferisci la CLI.

## Convenzioni

- Gli script sono **facoltativi** a meno che non siano citati nella documentazione o nelle checklist di rilascio.
- Preferisci le superfici CLI quando esistono (esempio: il monitoraggio auth usa `openclaw models status --check`).
- Presumi che gli script siano specifici dell'host; leggili prima di eseguirli su una nuova macchina.

## Script di monitoraggio auth

Il monitoraggio auth è trattato in [Authentication](/gateway/authentication). Gli script sotto `scripts/` sono extra facoltativi per flussi di lavoro systemd/Termux su telefono.

## Quando aggiungi script

- Mantieni gli script focalizzati e documentati.
- Aggiungi una breve voce nella documentazione pertinente (o creane una se manca).
