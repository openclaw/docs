---
read_when:
    - Vous souhaitez plusieurs agents isolés (espaces de travail + routage + authentification)
summary: Référence CLI pour `openclaw agents` (list/add/delete/bindings/bind/unbind/définir l’identité)
title: Agents
x-i18n:
    generated_at: "2026-04-25T13:43:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gérez des agents isolés (espaces de travail + authentification + routage).

Associé :

- Routage multi-agent : [Routage multi-agent](/fr/concepts/multi-agent)
- Espace de travail de l’agent : [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- Configuration de la visibilité des Skills : [Configuration des Skills](/fr/tools/skills-config)

## Exemples

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Liaisons de routage

Utilisez des liaisons de routage pour épingler le trafic entrant d’un canal à un agent spécifique.

Si vous voulez également des Skills visibles différents par agent, configurez
`agents.defaults.skills` et `agents.list[].skills` dans `openclaw.json`. Voir
[Configuration des Skills](/fr/tools/skills-config) et
[Référence de configuration](/fr/gateway/config-agents#agents-defaults-skills).

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

Si vous omettez `accountId` (`--bind <channel>`), OpenClaw le résout à partir des valeurs par défaut du canal et des hooks de configuration du Plugin lorsqu’ils sont disponibles.

Si vous omettez `--agent` pour `bind` ou `unbind`, OpenClaw cible l’agent par défaut actuel.

### Comportement de la portée des liaisons

- Une liaison sans `accountId` ne correspond qu’au compte par défaut du canal.
- `accountId: "*"` est le repli à l’échelle du canal (tous les comptes) et est moins spécifique qu’une liaison de compte explicite.
- Si le même agent a déjà une liaison de canal correspondante sans `accountId`, puis que vous liez plus tard avec un `accountId` explicite ou résolu, OpenClaw met à niveau cette liaison existante sur place au lieu d’ajouter un doublon.

Exemple :

```bash
# liaison initiale au niveau du canal
openclaw agents bind --agent work --bind telegram

# mise à niveau ultérieure vers une liaison portée au compte
openclaw agents bind --agent work --bind telegram:ops
```

Après la mise à niveau, le routage de cette liaison est limité à `telegram:ops`. Si vous voulez également le routage du compte par défaut, ajoutez-le explicitement (par exemple `--bind telegram:default`).

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
- `--bindings` : inclure les règles de routage complètes, pas seulement les comptes/résumés par agent

### `agents add [name]`

Options :

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (répétable)
- `--non-interactive`
- `--json`

Remarques :

- Passer un drapeau `add` explicite bascule la commande vers le chemin non interactif.
- Le mode non interactif exige à la fois un nom d’agent et `--workspace`.
- `main` est réservé et ne peut pas être utilisé comme nouvel identifiant d’agent.

### `agents bindings`

Options :

- `--agent <id>`
- `--json`

### `agents bind`

Options :

- `--agent <id>` (par défaut : l’agent par défaut actuel)
- `--bind <channel[:accountId]>` (répétable)
- `--json`

### `agents unbind`

Options :

- `--agent <id>` (par défaut : l’agent par défaut actuel)
- `--bind <channel[:accountId]>` (répétable)
- `--all`
- `--json`

### `agents delete <id>`

Options :

- `--force`
- `--json`

Remarques :

- `main` ne peut pas être supprimé.
- Sans `--force`, une confirmation interactive est requise.
- Les répertoires d’espace de travail, d’état de l’agent et de transcription de session sont déplacés vers la corbeille, et non supprimés définitivement.
- Si l’espace de travail d’un autre agent est le même chemin, se trouve à l’intérieur de cet espace de travail, ou contient cet espace de travail,
  l’espace de travail est conservé et `--json` rapporte `workspaceRetained`,
  `workspaceRetainedReason` et `workspaceSharedWith`.

## Fichiers d’identité

Chaque espace de travail d’agent peut inclure un `IDENTITY.md` à la racine de l’espace de travail :

- Exemple de chemin : `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lit depuis la racine de l’espace de travail (ou un `--identity-file` explicite)

Les chemins d’avatar sont résolus par rapport à la racine de l’espace de travail.

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

Remarques :

- `--agent` ou `--workspace` peut être utilisé pour sélectionner l’agent cible.
- Si vous vous appuyez sur `--workspace` et que plusieurs agents partagent cet espace de travail, la commande échoue et vous demande de passer `--agent`.
- Lorsqu’aucun champ d’identité explicite n’est fourni, la commande lit les données d’identité depuis `IDENTITY.md`.

Charger depuis `IDENTITY.md` :

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Remplacer explicitement des champs :

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
          theme: "homard spatial",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Associé

- [Référence CLI](/fr/cli)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
