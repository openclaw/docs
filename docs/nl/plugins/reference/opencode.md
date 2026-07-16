---
read_when:
    - Je installeert, configureert of controleert de opencode-plugin
summary: Voegt ondersteuning voor de OpenCode-modelprovider toe aan OpenClaw.
title: OpenCode-plugin
x-i18n:
    generated_at: "2026-07-16T16:07:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# OpenCode-Plugin

Voegt ondersteuning voor de OpenCode-modelprovider toe aan OpenClaw.

## Distributie

- Pakket: `@openclaw/opencode-provider`
- Installatieroute: opgenomen in OpenClaw

## Oppervlak

providers: `opencode`; contracten: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Native sessies

OpenClaw detecteert automatisch de `opencode`-CLI op de Gateway en gekoppelde nodes. Opgeslagen
sessies verschijnen vervolgens in de sessiezijbalkgroep **OpenCode**, met alleen-lezen
bladeren door transcripties via de officiële opdrachten `opencode --pure db ... --format json`
en `opencode --pure export`. De beperkte omgeving en de modus `--pure`
voorkomen dat bij het doorzoeken van de catalogus projectplugins worden geladen of niet-gerelateerde
Gateway-aanmeldgegevens worden overgenomen.

Schakel **OpenCode Session Catalog** uit onder **Config > Plugins > OpenCode** om
detectie uit te schakelen. Deze is standaard ingeschakeld.

<!-- openclaw-plugin-reference:manual-end -->

## Gerelateerde documentatie

- [opencode](/nl/providers/opencode)
