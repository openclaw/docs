---
read_when:
    - Vous installez, configurez ou auditez le plugin opencode
summary: Ajoute la prise en charge du fournisseur de modèles OpenCode à OpenClaw.
title: Plugin OpenCode
x-i18n:
    generated_at: "2026-07-16T13:40:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# Plugin OpenCode

Ajoute la prise en charge du fournisseur de modèles OpenCode à OpenClaw.

## Distribution

- Paquet : `@openclaw/opencode-provider`
- Méthode d’installation : inclus dans OpenClaw

## Surface

fournisseurs : `opencode`; contrats : `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Sessions natives

OpenClaw détecte automatiquement la CLI `opencode` sur le Gateway et les nœuds appairés. Les sessions
stockées apparaissent ensuite dans le groupe **OpenCode** de la barre latérale des sessions, avec une consultation
en lecture seule des transcriptions au moyen des commandes officielles `opencode --pure db ... --format json`
et `opencode --pure export`. L’environnement restreint et le mode `--pure`
empêchent la consultation du catalogue de charger les plugins du projet ou d’hériter d’identifiants
du Gateway sans rapport.

Désactivez **OpenCode Session Catalog** sous **Config > Plugins > OpenCode** pour
désactiver la découverte. Elle est activée par défaut.

<!-- openclaw-plugin-reference:manual-end -->

## Documentation associée

- [opencode](/fr/providers/opencode)
