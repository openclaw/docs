---
read_when:
    - Vous installez, configurez ou auditez le plugin Anthropic
summary: Modèles Anthropic, CLI Claude et catalogue natif des sessions Claude.
title: Plugin Anthropic
x-i18n:
    generated_at: "2026-07-16T13:32:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 11d3c7879a9dc6de35e67f9812b878918d908d41555c181920deb4f1f9cba22e
    source_path: plugins/reference/anthropic.md
    workflow: 16
---

# Plugin Anthropic

Modèles Anthropic, CLI Claude et catalogue natif des sessions Claude.

## Distribution

- Paquet : `@openclaw/anthropic-provider`
- Mode d’installation : inclus dans OpenClaw

## Surface

fournisseurs : `anthropic` ; contrats : `mediaUnderstandingProviders`, `usageProviders`

<!-- openclaw-plugin-reference:manual-start -->

commandes Node : anthropic.claude.sessions.list.v1,
anthropic.claude.sessions.read.v1 ; contrats : mediaUnderstandingProviders,
usageProviders

<!-- openclaw-plugin-reference:manual-end -->

## Documentation associée

- [anthropic](/fr/providers/anthropic)
