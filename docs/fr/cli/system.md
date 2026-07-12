---
read_when:
    - Vous souhaitez mettre en file d’attente un événement système sans créer de tâche Cron
    - Vous devez activer ou désactiver les heartbeats
    - Vous souhaitez inspecter les entrées de présence du système
summary: Référence CLI pour `openclaw system` (événements système, Heartbeat, présence)
title: Système
x-i18n:
    generated_at: "2026-07-12T15:10:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Utilitaires au niveau du système pour le Gateway : mettre en file d’attente des événements système, contrôler les
heartbeats et afficher la présence.

Toutes les sous-commandes `system` utilisent le RPC du Gateway et acceptent les options client communes :

| Option            | Valeur par défaut                    | Description                                                                                                                                                                                            |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--url <url>`     | `gateway.remote.url` si configuré    | URL WebSocket du Gateway.                                                                                                                                                                              |
| `--token <token>` | aucune                               | Jeton du Gateway (si requis).                                                                                                                                                                          |
| `--timeout <ms>`  | `30000`                              | Délai d’expiration du RPC en millisecondes.                                                                                                                                                             |
| `--expect-final`  | désactivé                            | Attendre la réponse finale (agent).                                                                                                                                                                    |
| `--json`          | désactivé                            | Produire du JSON. `heartbeat last/enable/disable` et `system presence` affichent toujours la charge utile JSON RPC brute, indépendamment de cette option ; `system event` l’utilise pour basculer entre du JSON et une simple ligne `ok`. |

## Commandes courantes

```bash
openclaw system event --text "Vérifier les suivis urgents" --mode now
openclaw system event --text "Vérifier les suivis urgents" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Met par défaut un événement système en file d’attente dans la session **principale**. Le prochain
heartbeat l’injecte sous forme de ligne `System:` dans le prompt. Utilisez `--mode now` pour
déclencher immédiatement le heartbeat ; `next-heartbeat` (valeur par défaut) attend la
prochaine exécution planifiée.

Passez `--session-key` pour cibler une session spécifique, par exemple afin de relayer
l’achèvement d’une tâche asynchrone vers le canal qui l’a lancée.

<Note>
**Exception de temporisation avec `--session-key` :** lorsque `--session-key` est fourni,
`--mode next-heartbeat` devient un réveil ciblé immédiat au lieu
d’attendre la prochaine exécution planifiée. Les réveils ciblés utilisent l’intention de heartbeat
`immediate` afin de contourner la condition d’exécution non échue du moteur, qui autrement
différerait (et abandonnerait effectivement) un réveil avec l’intention `event`. Si vous souhaitez une
livraison différée, omettez `--session-key` afin que l’événement arrive dans la session principale et
soit transmis lors du prochain heartbeat régulier.
</Note>

Options :

- `--text <text>` : texte requis de l’événement système.
- `--mode <mode>` : `now` ou `next-heartbeat` (valeur par défaut).
- `--session-key <sessionKey>` : facultatif ; cible une session d’agent spécifique
  au lieu de la session principale de l’agent. Les clés qui n’appartiennent pas à
  l’agent résolu utilisent à la place la session principale de l’agent.

## `system heartbeat last|enable|disable`

- `last` : afficher le dernier événement de heartbeat.
- `enable` : réactiver les heartbeats (à utiliser s’ils ont été désactivés).
- `disable` : suspendre les heartbeats.

## `system presence`

Répertorie les entrées de présence système actuelles connues du Gateway (nœuds,
instances et lignes d’état similaires).

## Remarques

- Nécessite un Gateway en cours d’exécution et accessible avec votre configuration actuelle (locale ou
  distante).
- Les événements système sont éphémères et ne sont pas conservés après les redémarrages.

## Voir aussi

- [Référence de la CLI](/fr/cli)
