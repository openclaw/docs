---
read_when:
    - Vous voulez rechercher les identifiants des contacts/groupes/de vous-même pour un canal
    - Vous développez un adaptateur de répertoire de canaux
summary: Référence CLI pour `openclaw directory` (soi-même, pairs, groupes)
title: Répertoire
x-i18n:
    generated_at: "2026-07-03T15:22:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Recherches dans le répertoire pour les canaux qui les prennent en charge (contacts/pairs, groupes et « moi »).

## Options communes

- `--channel <name>` : identifiant/alias du canal (obligatoire lorsque plusieurs canaux sont configurés ; automatique lorsqu’un seul est configuré)
- `--account <id>` : identifiant du compte (par défaut : valeur par défaut du canal)
- `--json` : produire du JSON

## Notes

- `directory` est conçu pour vous aider à trouver des identifiants que vous pouvez coller dans d’autres commandes (notamment `openclaw message send --target ...`).
- Pour de nombreux canaux, les résultats proviennent de la configuration (listes d’autorisation / groupes configurés) plutôt que d’un répertoire fournisseur en direct.
- Les plugins de canal installés peuvent tout de même omettre la prise en charge du répertoire ; dans ce cas, la commande signale l’opération de répertoire non prise en charge au lieu de réinstaller le plugin.
- La sortie par défaut est `id` (et parfois `name`) séparé par une tabulation ; utilisez `--json` pour les scripts.

## Utiliser les résultats avec `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formats d’identifiants (par canal)

- WhatsApp : `+15551234567` (DM), `1234567890-1234567890@g.us` (groupe), `120363123456789@newsletter` (cible sortante Channel/Newsletter)
- Signal : les alias configurés se résolvent en cibles DM E.164/UUID ou en cibles de groupe `group:<id>`
- Telegram : `@username` ou identifiant numérique de discussion ; les groupes sont des identifiants numériques
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

## Connexe

- [Référence CLI](/fr/cli)
