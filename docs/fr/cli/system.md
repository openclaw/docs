---
read_when:
    - Vous souhaitez mettre en file d’attente un événement système sans créer de tâche Cron
    - Vous devez activer ou désactiver les Heartbeat
    - Vous voulez inspecter les entrées de présence système
summary: Référence CLI pour `openclaw system` (événements système, Heartbeat, présence)
title: Système
x-i18n:
    generated_at: "2026-05-11T20:29:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw system`

Assistants au niveau système pour le Gateway : mettre en file d’attente des événements système, contrôler les heartbeats,
et afficher la présence.

Toutes les sous-commandes `system` utilisent le RPC du Gateway et acceptent les indicateurs client partagés :

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Commandes courantes

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Met en file d’attente un événement système sur la session **principale** par défaut. Le prochain heartbeat
l’injectera comme une ligne `System:` dans le prompt. Utilisez `--mode now` pour déclencher
le heartbeat immédiatement ; `next-heartbeat` attend le prochain tick planifié.

Passez `--session-key` pour cibler une session spécifique (par exemple pour relayer la
fin d’une tâche asynchrone au canal qui l’a démarrée).

> **Exception de synchronisation avec `--session-key` :** lorsque `--session-key` est fourni,
> `--mode next-heartbeat` se réduit à un réveil ciblé immédiat au lieu
> d’attendre le prochain tick planifié. Les réveils ciblés utilisent l’intention de heartbeat
> `immediate`, ce qui leur permet de contourner la barrière not-due du runner qui autrement
> différerait (et abandonnerait effectivement) un réveil d’intention `event`. Si vous voulez une
> livraison différée, omettez `--session-key` afin que l’événement arrive sur la session principale et
> accompagne le prochain heartbeat régulier.

Indicateurs :

- `--text <text>` : texte d’événement système requis.
- `--mode <mode>` : `now` ou `next-heartbeat` (par défaut).
- `--session-key <sessionKey>` : facultatif ; cible une session d’agent spécifique
  au lieu de la session principale de l’agent. Les clés qui n’appartiennent pas à l’agent
  résolu retombent sur la session principale de l’agent.
- `--json` : sortie lisible par machine.
- `--url`, `--token`, `--timeout`, `--expect-final` : indicateurs RPC Gateway partagés.

## `system heartbeat last|enable|disable`

Contrôles Heartbeat :

- `last` : affiche le dernier événement heartbeat.
- `enable` : réactive les heartbeats (à utiliser s’ils ont été désactivés).
- `disable` : met les heartbeats en pause.

Indicateurs :

- `--json` : sortie lisible par machine.
- `--url`, `--token`, `--timeout`, `--expect-final` : indicateurs RPC Gateway partagés.

## `system presence`

Répertorie les entrées de présence système actuelles connues du Gateway (nœuds,
instances et lignes d’état similaires).

Indicateurs :

- `--json` : sortie lisible par machine.
- `--url`, `--token`, `--timeout`, `--expect-final` : indicateurs RPC Gateway partagés.

## Notes

- Nécessite un Gateway en cours d’exécution, joignable par votre configuration actuelle (locale ou distante).
- Les événements système sont éphémères et ne persistent pas entre les redémarrages.

## Associé

- [Référence CLI](/fr/cli)
