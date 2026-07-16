---
read_when:
    - Si sta installando, configurando o verificando il plugin acpx
summary: Backend runtime ACP di OpenClaw con gestione delle sessioni e del trasporto affidata al plugin.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T14:43:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

Backend runtime ACP di OpenClaw con gestione delle sessioni e del trasporto di proprietà del plugin.

## Distribuzione

- Pacchetto: `@openclaw/acpx`
- Metodo di installazione: npm; ClawHub

## Superficie

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Sessioni native di Pi

Il runtime incluso rileva automaticamente l'archivio delle sessioni di Pi sul Gateway e sui
nodi associati. Le sessioni archiviate vengono visualizzate nel gruppo **Pi** della barra laterale delle sessioni, con
consultazione in sola lettura delle trascrizioni nel formato di sessione JSONL documentato da Pi. Il
catalogo riconosce le directory di sessione `settings.json` globali e del progetto, oltre a
`PI_CODING_AGENT_DIR` e `PI_CODING_AGENT_SESSION_DIR`. I percorsi relativi vengono risolti
a partire dalla directory contenente il relativo file `settings.json`.

Disattivare **Catalogo sessioni Pi** in **Configurazione > Plugin > Runtime ACPX** per
disabilitare il rilevamento. È attivato per impostazione predefinita.

<!-- openclaw-plugin-reference:manual-end -->

## Documentazione correlata

- [acpx](/it/tools/acp-agents-setup)
