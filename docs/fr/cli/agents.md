---
read_when:
    - Vous souhaitez plusieurs agents isolés (espaces de travail + routage + authentification)
summary: Référence CLI pour `openclaw agents` (lister/ajouter/supprimer/afficher les liaisons/lier/délier/définir l’identité)
title: Agents
x-i18n:
    generated_at: "2026-07-12T02:40:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gérez des agents isolés (espaces de travail + authentification + routage). Exécuter `openclaw agents` sans sous-commande équivaut à `openclaw agents list`.

Voir aussi :

- [Routage multi-agent](/fr/concepts/multi-agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Configuration des Skills](/fr/tools/skills-config) : configuration de la visibilité des Skills.

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

## Commandes disponibles

### `agents list`

Options : `--json`, `--bindings` (inclut les règles de routage complètes, et pas seulement les nombres ou résumés par agent).

### `agents add [name]`

Options : `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (répétable), `--non-interactive`, `--json`.

- L’utilisation de toute option d’ajout explicite fait basculer la commande vers le mode non interactif.
- Le mode non interactif exige à la fois un nom d’agent et `--workspace`.
- `main` est réservé et ne peut pas servir d’identifiant au nouvel agent.
- Le mode interactif initialise l’authentification en copiant uniquement les identifiants statiques portables (profils `api_key` et `token` statiques), sauf si un identifiant désactive cette copie avec `copyToAgents: false` ; les profils OAuth avec jeton d’actualisation ne sont copiés que si un fournisseur l’autorise avec `copyToAgents: true`. En l’absence de copie, OAuth reste disponible uniquement par héritage en lecture depuis le stockage de l’agent `main` réel. Si l’agent par défaut configuré n’est pas `main`, connectez-vous séparément aux profils OAuth sur le nouvel agent.

### `agents bindings`

Options : `--agent <id>`, `--json`.

### `agents bind`

Options : `--agent <id>` (utilise par défaut l’agent actuellement défini par défaut), `--bind <channel[:accountId]>` (répétable), `--json`.

### `agents unbind`

Options : `--agent <id>` (utilise par défaut l’agent actuellement défini par défaut), `--bind <channel[:accountId]>` (répétable), `--all`, `--json`. Accepte soit `--all`, soit une ou plusieurs valeurs `--bind`, mais pas les deux.

### `agents set-identity`

Options : `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Voir [Définir l’identité](#set-identity) ci-dessous.

### `agents delete <id>`

Options : `--force`, `--json`.

- `main` ne peut pas être supprimé.
- Sans `--force`, une confirmation interactive est requise (la commande échoue dans une session non-TTY ; relancez-la avec `--force`).
- Les répertoires de l’espace de travail, de l’état de l’agent et des transcriptions de session sont déplacés vers la corbeille, et non définitivement supprimés.
- Lorsque le Gateway est accessible, la suppression passe par le Gateway afin que le nettoyage de la configuration et du stockage des sessions utilise le même mécanisme d’écriture que le trafic d’exécution. Si le Gateway est inaccessible, la CLI revient au chemin local hors ligne.
- Si l’espace de travail d’un autre agent correspond au même chemin, se trouve dans cet espace de travail ou contient cet espace de travail, l’espace de travail est conservé, et `--json` indique `workspaceRetained`, `workspaceRetainedReason` et `workspaceSharedWith`.

## Liaisons de routage

Utilisez les liaisons de routage pour affecter le trafic entrant d’un canal à un agent précis.

Si vous souhaitez également rendre des Skills différents visibles pour chaque agent, configurez `agents.defaults.skills` et `agents.list[].skills` dans `openclaw.json`. Voir [Configuration des Skills](/fr/tools/skills-config) et [Référence de configuration](/fr/gateway/config-agents#agentsdefaultsskills).

Afficher les liaisons :

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Ajouter des liaisons :

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Vous pouvez également ajouter des liaisons lors de la création d’un agent :

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Si vous omettez `accountId` (`--bind <channel>`), OpenClaw le détermine à partir des hooks de configuration du plugin, de la liaison de compte imposée ou du nombre de comptes configurés pour le canal.

Si vous omettez `--agent` pour `bind` ou `unbind`, OpenClaw cible l’agent actuellement défini par défaut.

### Format de `--bind`

| Format                       | Signification                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Correspond à tous les comptes du canal.                                                                                           |
| `--bind <channel>:<account>` | Correspond à un seul compte.                                                                                                      |
| `--bind <channel>`           | Correspond uniquement au compte par défaut, sauf si la CLI peut déterminer de manière sûre une portée de compte propre au plugin. |

### Comportement de la portée des liaisons

- Une liaison enregistrée sans `accountId` correspond uniquement au compte par défaut du canal.
- `accountId: "*"` constitue la solution de repli à l’échelle du canal (tous les comptes) et est moins spécifique qu’une liaison explicite à un compte.
- Si le même agent possède déjà une liaison de canal correspondante sans `accountId` et que vous ajoutez ensuite une liaison avec un `accountId` explicite ou déterminé, OpenClaw met à niveau la liaison existante sur place au lieu d’ajouter un doublon.

Exemples :

```bash
# correspondre à tous les comptes du canal
openclaw agents bind --agent work --bind telegram:*

# correspondre à un compte précis
openclaw agents bind --agent work --bind telegram:ops

# liaison initiale au canal uniquement
openclaw agents bind --agent work --bind telegram

# mise à niveau ultérieure vers une liaison limitée au compte
openclaw agents bind --agent work --bind telegram:alerts
```

Après la mise à niveau, le routage de cette liaison est limité à `telegram:alerts`. Si vous souhaitez également router le compte par défaut, ajoutez-le explicitement (par exemple `--bind telegram:default`).

Supprimer des liaisons :

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Fichiers d’identité

Chaque espace de travail d’agent peut inclure un fichier `IDENTITY.md` à sa racine :

- Exemple de chemin : `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lit les données depuis la racine de l’espace de travail (ou depuis un fichier `--identity-file` explicite).

Les chemins d’avatar sont résolus relativement à la racine de l’espace de travail et ne peuvent pas en sortir, même par l’intermédiaire d’un lien symbolique.

## Définir l’identité

`set-identity` écrit des champs dans `agents.list[].identity` : `name`, `theme`, `emoji`, `avatar` (chemin relatif à l’espace de travail, URL HTTP(S) ou URI de données).

- `--agent` ou `--workspace` sélectionne l’agent cible. Si `--workspace` correspond à plusieurs agents, la commande échoue et vous demande de fournir `--agent`.
- Les fichiers image d’avatar locaux dont le chemin est relatif à l’espace de travail sont limités à 2 Mo. Les URL HTTP(S) et les URI `data:` ne sont pas soumises à la limite de taille des fichiers locaux.
- Lorsqu’aucun champ d’identité explicite n’est fourni, la commande lit les données d’identité depuis `IDENTITY.md`.

Charger depuis `IDENTITY.md` :

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Remplacer explicitement les champs :

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

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
