---
read_when:
    - Vous voulez rechercher les identifiants de contacts, de groupes et de vous-même pour un canal
    - Vous développez un adaptateur d’annuaire de canaux
summary: Référence CLI pour `openclaw directory` (soi-même, pairs, groupes)
title: Répertoire
x-i18n:
    generated_at: "2026-05-02T20:41:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Recherches dans l’annuaire pour les canaux qui les prennent en charge (contacts/pairs, groupes et « moi »).

## Indicateurs communs

- `--channel <name>` : id/alias du canal (requis lorsque plusieurs canaux sont configurés ; automatique lorsqu’un seul est configuré)
- `--account <id>` : id du compte (par défaut : valeur par défaut du canal)
- `--json` : sortie JSON

## Remarques

- `directory` est destiné à vous aider à trouver des ID que vous pouvez coller dans d’autres commandes (en particulier `openclaw message send --target ...`).
- Pour de nombreux canaux, les résultats s’appuient sur la configuration (listes d’autorisation / groupes configurés) plutôt que sur un annuaire fournisseur en direct.
- Les plugins de canal installés peuvent tout de même ne pas prendre en charge l’annuaire ; dans ce cas, la commande signale l’opération d’annuaire non prise en charge au lieu de réinstaller le Plugin.
- La sortie par défaut est `id` (et parfois `name`) séparé par une tabulation ; utilisez `--json` pour les scripts.

## Utiliser les résultats avec `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formats d’ID (par canal)

- WhatsApp : `+15551234567` (DM), `1234567890-1234567890@g.us` (groupe), `120363123456789@newsletter` (cible sortante de canal/newsletter)
- Telegram : `@username` ou id numérique de discussion ; les groupes sont des id numériques
- Slack : `user:U…` et `channel:C…`
- Discord : `user:<id>` et `channel:<id>`
- Matrix (Plugin) : `user:@user:server`, `room:!roomId:server` ou `#alias:server`
- Microsoft Teams (Plugin) : `user:<id>` et `conversation:<id>`
- Zalo (Plugin) : id utilisateur (Bot API)
- Zalo Personal / `zalouser` (Plugin) : id de fil (DM/groupe) depuis `zca` (`me`, `friend list`, `group list`)

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

## Associé

- [Référence CLI](/fr/cli)
