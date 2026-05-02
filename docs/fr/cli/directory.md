---
read_when:
    - Vous voulez rechercher les identifiants de contacts/groupes/de vous-même pour un canal
    - Vous développez un adaptateur d’annuaire de canaux
summary: Référence CLI pour `openclaw directory` (soi-même, pairs, groupes)
title: Répertoire
x-i18n:
    generated_at: "2026-05-02T07:01:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Recherches dans l’annuaire pour les canaux qui les prennent en charge (contacts/pairs, groupes et « moi »).

## Options communes

- `--channel <name>` : identifiant/alias du canal (obligatoire lorsque plusieurs canaux sont configurés ; automatique lorsqu’un seul est configuré)
- `--account <id>` : identifiant de compte (par défaut : valeur par défaut du canal)
- `--json` : sortie JSON

## Remarques

- `directory` est conçu pour vous aider à trouver des identifiants que vous pouvez coller dans d’autres commandes (en particulier `openclaw message send --target ...`).
- Pour de nombreux canaux, les résultats s’appuient sur la configuration (listes d’autorisation / groupes configurés) plutôt que sur un annuaire fournisseur en direct.
- Les plugins de canal installés peuvent tout de même omettre la prise en charge de l’annuaire ; dans ce cas, la commande signale l’opération d’annuaire non prise en charge au lieu de réinstaller le plugin.
- La sortie par défaut est `id` (et parfois `name`) séparé par une tabulation ; utilisez `--json` pour les scripts.

## Utilisation des résultats avec `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formats d’identifiant (par canal)

- WhatsApp : `+15551234567` (DM), `1234567890-1234567890@g.us` (groupe)
- Telegram : `@username` ou identifiant numérique de discussion ; les groupes ont des identifiants numériques
- Slack : `user:U…` et `channel:C…`
- Discord : `user:<id>` et `channel:<id>`
- Matrix (plugin) : `user:@user:server`, `room:!roomId:server` ou `#alias:server`
- Microsoft Teams (plugin) : `user:<id>` et `conversation:<id>`
- Zalo (plugin) : identifiant utilisateur (Bot API)
- Zalo Personal / `zalouser` (plugin) : identifiant de fil (DM/groupe) provenant de `zca` (`me`, `friend list`, `group list`)

## Soi-même (« moi »)

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
