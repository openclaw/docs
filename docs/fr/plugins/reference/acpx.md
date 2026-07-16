---
read_when:
    - Vous installez, configurez ou auditez le plugin acpx
summary: Backend d’exécution ACP d’OpenClaw avec gestion des sessions et du transport assurée par le plugin.
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T13:32:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

Backend d’exécution ACP d’OpenClaw avec gestion des sessions et du transport assurée par le Plugin.

## Distribution

- Paquet : `@openclaw/acpx`
- Méthode d’installation : npm ; ClawHub

## Surface

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Sessions natives de Pi

Le moteur d’exécution intégré détecte automatiquement le stockage de sessions de Pi sur le Gateway et les
Nodes appairés. Les sessions stockées apparaissent dans le groupe **Pi** de la barre latérale des sessions, avec
une consultation en lecture seule des transcriptions au format de session JSONL documenté par Pi. Le
catalogue prend en charge les répertoires de sessions `settings.json` du projet et globaux, ainsi que
`PI_CODING_AGENT_DIR` et `PI_CODING_AGENT_SESSION_DIR`. Les chemins relatifs sont résolus
à partir du répertoire contenant leur fichier `settings.json`.

Désactivez **Pi Session Catalog** sous **Config > Plugins > ACPX Runtime** pour
désactiver la détection. Celle-ci est activée par défaut.

<!-- openclaw-plugin-reference:manual-end -->

## Documentation associée

- [acpx](/fr/tools/acp-agents-setup)
