---
read_when:
    - Vous souhaitez mettre en file d’attente un événement système sans créer de tâche Cron
    - Vous devez activer ou désactiver les Heartbeats
    - Vous souhaitez consulter les entrées de présence du système
summary: Référence de la CLI pour `openclaw system` (événements système, Heartbeat, présence)
title: Système
x-i18n:
    generated_at: "2026-07-12T02:28:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Utilitaires système pour le Gateway : mise en file d’attente des événements système, contrôle des Heartbeats et affichage de la présence.

Toutes les sous-commandes `system` utilisent le RPC du Gateway et acceptent les options client communes :

| Option            | Valeur par défaut                     | Description                                                                                                                                                                                                                                                                         |
| ----------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` si configurée    | URL WebSocket du Gateway.                                                                                                                                                                                                                                                           |
| `--token <token>` | aucune                                | Jeton du Gateway (si requis).                                                                                                                                                                                                                                                       |
| `--timeout <ms>`  | `30000`                               | Délai d’expiration du RPC en millisecondes.                                                                                                                                                                                                                                         |
| `--expect-final`  | désactivée                            | Attendre la réponse finale (agent).                                                                                                                                                                                                                                                 |
| `--json`          | désactivée                            | Produire du JSON. `heartbeat last/enable/disable` et `system presence` affichent toujours la charge utile JSON RPC brute, quelle que soit cette option ; `system event` l’utilise pour basculer entre du JSON et une simple ligne `ok`. |

## Commandes courantes

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Met par défaut un événement système en file d’attente dans la session **principale**. Le prochain Heartbeat l’injecte dans l’invite sous la forme d’une ligne `System:`. Utilisez `--mode now` pour déclencher immédiatement le Heartbeat ; `next-heartbeat` (valeur par défaut) attend le prochain déclenchement planifié.

Passez `--session-key` pour cibler une session précise, par exemple afin de relayer la fin d’une tâche asynchrone vers le canal qui l’a lancée.

<Note>
**Exception de temporisation avec `--session-key` :** lorsque `--session-key` est fourni, `--mode next-heartbeat` devient un réveil ciblé immédiat au lieu d’attendre le prochain déclenchement planifié. Les réveils ciblés utilisent l’intention de Heartbeat `immediate` afin de contourner le contrôle d’échéance de l’exécuteur, qui reporterait autrement — et supprimerait de fait — un réveil avec l’intention `event`. Pour différer la livraison, omettez `--session-key` afin que l’événement soit placé dans la session principale et transmis lors du prochain Heartbeat régulier.
</Note>

Options :

- `--text <text>` : texte requis de l’événement système.
- `--mode <mode>` : `now` ou `next-heartbeat` (valeur par défaut).
- `--session-key <sessionKey>` : facultatif ; cible une session d’agent précise au lieu de la session principale de l’agent. Les clés qui n’appartiennent pas à l’agent résolu utilisent à la place la session principale de cet agent.

## `system heartbeat last|enable|disable`

- `last` : afficher le dernier événement de Heartbeat.
- `enable` : réactiver les Heartbeats (utilisez cette commande s’ils ont été désactivés).
- `disable` : suspendre les Heartbeats.

## `system presence`

Répertorie les entrées de présence système actuellement connues du Gateway (nœuds, instances et lignes d’état similaires).

## Remarques

- Nécessite un Gateway en cours d’exécution et accessible avec votre configuration actuelle (locale ou distante).
- Les événements système sont éphémères et ne sont pas conservés après un redémarrage.

## Voir aussi

- [Référence de la CLI](/fr/cli)
