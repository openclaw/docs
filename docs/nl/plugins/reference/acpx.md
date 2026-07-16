---
read_when:
    - Je installeert, configureert of controleert de acpx-plugin
summary: OpenClaw ACP-runtimebackend met sessie- en transportbeheer door de plugin.
title: ACPx-plugin
x-i18n:
    generated_at: "2026-07-16T16:12:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# ACPx-plugin

OpenClaw ACP-runtimebackend met sessie- en transportbeheer dat eigendom is van de plugin.

## Distributie

- Pakket: `@openclaw/acpx`
- Installatieroute: npm; ClawHub

## Oppervlak

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Systeemeigen Pi-sessies

De gebundelde runtime detecteert automatisch de sessieopslag van Pi op de Gateway en gekoppelde
nodes. Opgeslagen sessies verschijnen in de sessiezijbalkgroep **Pi**, met
alleen-lezen bladeren door transcripties vanuit Pi's gedocumenteerde JSONL-sessie-indeling. De
catalogus houdt rekening met project- en globale `settings.json`-sessiemappen plus
`PI_CODING_AGENT_DIR` en `PI_CODING_AGENT_SESSION_DIR`. Relatieve paden worden herleid
vanaf de map die hun `settings.json`-bestand bevat.

Schakel **Pi Session Catalog** uit onder **Config > Plugins > ACPX Runtime** om
detectie uit te schakelen. Deze is standaard ingeschakeld.

<!-- openclaw-plugin-reference:manual-end -->

## Gerelateerde documentatie

- [acpx](/nl/tools/acp-agents-setup)
