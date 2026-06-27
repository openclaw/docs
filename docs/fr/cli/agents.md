---
read_when:
    - Vous voulez plusieurs agents isolés (espaces de travail + routage + authentification)
summary: Référence de la CLI pour `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agents
x-i18n:
    generated_at: "2026-06-27T17:17:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gérer les agents isolés (espaces de travail + auth + routage).

Liés :

- [Routage multi-agent](/fr/concepts/multi-agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Configuration des Skills](/fr/tools/skills-config) : configuration de la visibilité des skills.

## Exemples

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Liaisons de routage

Utilisez les liaisons de routage pour rattacher le trafic entrant d’un canal à un agent spécifique.

Si vous souhaitez aussi des skills visibles différents par agent, configurez `agents.defaults.skills` et `agents.list[].skills` dans `openclaw.json`. Consultez [Configuration des Skills](/fr/tools/skills-config) et [Référence de configuration](/fr/gateway/config-agents#agents-defaults-skills).

Lister les liaisons :

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Ajouter des liaisons :

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Vous pouvez aussi ajouter des liaisons lors de la création d’un agent :

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Si vous omettez `accountId` (`--bind <channel>`), OpenClaw le résout à partir des hooks de configuration du plugin, d’une liaison de compte forcée ou du nombre de comptes configuré pour le canal.

Si vous omettez `--agent` pour `bind` ou `unbind`, OpenClaw cible l’agent par défaut actuel.

### Format de `--bind`

| Format                       | Signification                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Correspond à tous les comptes du canal.                                                           |
| `--bind <channel>:<account>` | Correspond à un compte.                                                                           |
| `--bind <channel>`           | Correspond uniquement au compte par défaut, sauf si la CLI peut résoudre sans risque une portée de compte propre au plugin. |

### Comportement de portée des liaisons

- Une liaison stockée sans `accountId` correspond uniquement au compte par défaut du canal.
- `accountId: "*"` est le repli à l’échelle du canal (tous les comptes) et est moins spécifique qu’une liaison de compte explicite.
- Si le même agent possède déjà une liaison de canal correspondante sans `accountId`, puis que vous créez plus tard une liaison avec un `accountId` explicite ou résolu, OpenClaw met à niveau cette liaison existante sur place au lieu d’ajouter un doublon.

Exemples :

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Après la mise à niveau, le routage pour cette liaison est limité à `telegram:alerts`. Si vous souhaitez aussi un routage vers le compte par défaut, ajoutez-le explicitement (par exemple `--bind telegram:default`).

Supprimer des liaisons :

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` accepte soit `--all`, soit une ou plusieurs valeurs `--bind`, mais pas les deux.

## Surface de commande

### `agents`

Exécuter `openclaw agents` sans sous-commande équivaut à `openclaw agents list`.

### `agents list`

Options :

- `--json`
- `--bindings` : inclure les règles de routage complètes, et pas seulement les décomptes/résumés par agent

### `agents add [name]`

Options :

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (répétable)
- `--non-interactive`
- `--json`

Notes :

- Le passage de n’importe quel indicateur d’ajout explicite fait basculer la commande vers le chemin non interactif.
- Le mode non interactif nécessite à la fois un nom d’agent et `--workspace`.
- `main` est réservé et ne peut pas être utilisé comme nouvel identifiant d’agent.
- En mode interactif, l’amorçage de l’auth copie uniquement les profils statiques portables
  (`api_key` et `token` statique par défaut). Les profils OAuth avec jeton d’actualisation restent
  disponibles uniquement par héritage en lecture depuis le véritable magasin de l’agent `main`.
  Si l’agent par défaut configuré n’est pas `main`, connectez-vous séparément pour les profils OAuth
  sur le nouvel agent.

### `agents bindings`

Options :

- `--agent <id>`
- `--json`

### `agents bind`

Options :

- `--agent <id>` (par défaut, l’agent par défaut actuel)
- `--bind <channel[:accountId]>` (répétable)
- `--json`

### `agents unbind`

Options :

- `--agent <id>` (par défaut, l’agent par défaut actuel)
- `--bind <channel[:accountId]>` (répétable)
- `--all`
- `--json`

### `agents delete <id>`

Options :

- `--force`
- `--json`

Notes :

- `main` ne peut pas être supprimé.
- Sans `--force`, une confirmation interactive est requise.
- Les répertoires de l’espace de travail, de l’état de l’agent et des transcriptions de session sont déplacés vers la Corbeille, et non supprimés définitivement.
- Lorsque le Gateway est joignable, la suppression est envoyée via le Gateway afin que le nettoyage de la configuration et du magasin de sessions partage le même rédacteur que le trafic d’exécution. Si le Gateway est injoignable, la CLI revient au chemin local hors ligne.
- Si l’espace de travail d’un autre agent est le même chemin, se trouve dans cet espace de travail ou contient cet espace de travail,
  l’espace de travail est conservé et `--json` signale `workspaceRetained`,
  `workspaceRetainedReason` et `workspaceSharedWith`.

## Fichiers d’identité

Chaque espace de travail d’agent peut inclure un `IDENTITY.md` à la racine de l’espace de travail :

- Exemple de chemin : `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lit depuis la racine de l’espace de travail (ou depuis un `--identity-file` explicite)

Les chemins d’avatar sont résolus relativement à la racine de l’espace de travail.

## Définir l’identité

`set-identity` écrit les champs dans `agents.list[].identity` :

- `name`
- `theme`
- `emoji`
- `avatar` (chemin relatif à l’espace de travail, URL http(s) ou URI de données)

Options :

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Notes :

- `--agent` ou `--workspace` peuvent être utilisés pour sélectionner l’agent cible.
- Si vous vous appuyez sur `--workspace` et que plusieurs agents partagent cet espace de travail, la commande échoue et vous demande de passer `--agent`.
- Les fichiers image d’avatar locaux relatifs à l’espace de travail sont limités à 2 Mo. Les URL HTTP(S) et les URI `data:` ne sont pas vérifiées avec la limite locale de taille de fichier.
- Lorsqu’aucun champ d’identité explicite n’est fourni, la commande lit les données d’identité depuis `IDENTITY.md`.

Charger depuis `IDENTITY.md` :

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Remplacer les champs explicitement :

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Exemple de configuration :

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Liés

- [Référence CLI](/fr/cli)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
