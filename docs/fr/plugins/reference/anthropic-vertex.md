---
read_when:
    - Vous installez, configurez ou auditez le plugin anthropic-vertex
summary: Plugin fournisseur Anthropic Vertex d’OpenClaw pour les modèles Claude sur Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-12T02:55:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin fournisseur OpenClaw Anthropic Vertex pour les modèles Claude sur Google Vertex AI.

## Distribution

- Paquet : `@openclaw/anthropic-vertex-provider`
- Voie d’installation : npm ; ClawHub

## Surface

fournisseurs : anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Utilisez `anthropic-vertex/claude-fable-5` lorsque le modèle est disponible dans votre région Google Cloud.
Fable 5 utilise toujours le raisonnement adaptatif et applique par défaut un effort `high`. `/think off` et
`/think minimal` utilisent un effort `low`, car le modèle ne permet pas de désactiver le raisonnement.

## Claude Sonnet 5

Utilisez `anthropic-vertex/claude-sonnet-5` avec le point de terminaison `global`, `us` ou `eu`
de Vertex. Sonnet 5 utilise par défaut le raisonnement adaptatif avec un effort `high` et prend en charge
`/think off` ou les niveaux natifs `/think xhigh|max`. OpenClaw publie automatiquement sa
fenêtre de contexte de 1 000 000 de jetons et sa limite de sortie de 128 000 jetons.

La tarification du catalogue suit le tarif global de lancement de Vertex, soit `$2/$10` par
million de jetons d’entrée/de sortie jusqu’au 31 août 2026, puis `$3/$15` à compter du
1er septembre. Les points de terminaison multirégionaux `us` et `eu` appliquent la
majoration documentée de 10 % de Vertex.

<!-- openclaw-plugin-reference:manual-end -->
