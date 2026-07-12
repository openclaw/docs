---
read_when:
    - Vous souhaitez rechercher les identifiants de contacts, de groupes ou de votre propre compte pour un canal
    - Vous développez un adaptateur d’annuaire de canaux
summary: Référence CLI pour `openclaw directory` (soi-même, pairs, groupes)
title: Répertoire
x-i18n:
    generated_at: "2026-07-12T15:10:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Recherche dans l’annuaire pour les canaux qui la prennent en charge : contacts/ pairs, groupes et « me » (soi-même).

Les résultats sont destinés à être collés dans d’autres commandes, notamment `openclaw message send --target ...`.

## Options communes

- `--channel <name>` : identifiant/alias du canal (requis lorsque plusieurs canaux sont configurés ; sélectionné automatiquement lorsqu’un seul est configuré)
- `--account <id>` : identifiant du compte (par défaut : compte par défaut du canal)
- `--json` : sortie JSON

La sortie par défaut (non JSON) contient `id` (et parfois `name`), séparés par une tabulation.

## Remarques

- Pour de nombreux canaux, les résultats proviennent de la configuration (listes d’autorisation / groupes configurés) plutôt que d’un annuaire actif du fournisseur.
- Un Plugin de canal déjà installé peut ne pas prendre en charge l’annuaire. Dans ce cas, la commande signale que l’opération n’est pas prise en charge ; elle ne tente pas de réinstaller ni de mettre à niveau le Plugin pour ajouter cette prise en charge.

## Utiliser les résultats avec `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formats d’identifiant par canal

| Canal                               | Format de l’identifiant cible                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (message privé), `1234567890-1234567890@g.us` (groupe), `120363123456789@newsletter` (canal/newsletter, sortant uniquement) |
| Signal                              | Les alias configurés sont résolus en cibles de message privé E.164/UUID ou en cibles de groupe `group:<id>`                 |
| Telegram                            | `@username` ou identifiant numérique de discussion ; les groupes utilisent des identifiants numériques                     |
| Slack                               | `user:U…` et `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` et `channel:<id>`                                                                                              |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server` ou `#alias:server`                                                              |
| Microsoft Teams (Plugin)            | `user:<id>` et `conversation:<id>`                                                                                         |
| Zalo (Plugin)                       | Identifiant utilisateur (API du bot)                                                                                        |
| Zalo Personal / `zalouser` (Plugin) | Identifiant de fil de discussion (message privé/groupe), obtenu depuis `zca` (`me`, `friend list`, `group list`)            |

## Soi-même (« me »)

```bash
openclaw directory self --channel zalouser
```

## Pairs (contacts/utilisateurs)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Groupes

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Voir aussi

- [Référence de la CLI](/fr/cli)
