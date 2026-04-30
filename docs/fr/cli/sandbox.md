---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gérer les environnements d’exécution sandbox et inspecter la politique sandbox effective
title: CLI du bac à sable
x-i18n:
    generated_at: "2026-04-30T07:19:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

Gérez les environnements d’exécution sandbox pour l’exécution isolée des agents.

## Vue d’ensemble

OpenClaw peut exécuter des agents dans des environnements d’exécution sandbox isolés pour la sécurité. Les commandes `sandbox` vous aident à inspecter et recréer ces environnements après des mises à jour ou des changements de configuration.

Aujourd’hui, cela signifie généralement :

- des conteneurs sandbox Docker
- des environnements d’exécution sandbox SSH lorsque `agents.defaults.sandbox.backend = "ssh"`
- des environnements d’exécution sandbox OpenShell lorsque `agents.defaults.sandbox.backend = "openshell"`

Pour `ssh` et OpenShell `remote`, la recréation est plus importante qu’avec Docker :

- l’espace de travail distant fait autorité après l’amorçage initial
- `openclaw sandbox recreate` supprime cet espace de travail distant faisant autorité pour la portée sélectionnée
- l’utilisation suivante l’amorce à nouveau depuis l’espace de travail local actuel

## Commandes

### `openclaw sandbox explain`

Inspectez le mode, la portée et l’accès à l’espace de travail sandbox **effectifs**, la stratégie d’outils sandbox et les barrières d’élévation (avec les chemins de clés de configuration pour corriger).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Listez tous les environnements d’exécution sandbox avec leur état et leur configuration.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**La sortie inclut :**

- Le nom et l’état de l’environnement d’exécution
- Le backend (`docker`, `openshell`, etc.)
- Le libellé de configuration et s’il correspond à la configuration actuelle
- L’âge (temps écoulé depuis la création)
- Le temps d’inactivité (temps écoulé depuis la dernière utilisation)
- La session ou l’agent associé

### `openclaw sandbox recreate`

Supprimez des environnements d’exécution sandbox pour forcer leur recréation avec la configuration mise à jour.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Options :**

- `--all` : Recréer tous les conteneurs sandbox
- `--session <key>` : Recréer le conteneur pour une session spécifique
- `--agent <id>` : Recréer les conteneurs pour un agent spécifique
- `--browser` : Recréer uniquement les conteneurs de navigateur
- `--force` : Ignorer l’invite de confirmation

<Note>
Les environnements d’exécution sont automatiquement recréés lors de la prochaine utilisation de l’agent.
</Note>

## Cas d’utilisation

### Après la mise à jour d’une image Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Après la modification de la configuration sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Après la modification de la cible SSH ou du matériel d’authentification SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Pour le backend `ssh` principal, la recréation supprime la racine de l’espace de travail distant par portée
sur la cible SSH. L’exécution suivante l’amorce à nouveau depuis l’espace de travail local.

### Après la modification de la source, de la stratégie ou du mode OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Pour le mode OpenShell `remote`, la recréation supprime l’espace de travail distant faisant autorité
pour cette portée. L’exécution suivante l’amorce à nouveau depuis l’espace de travail local.

### Après la modification de setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Pour un agent spécifique uniquement

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Pourquoi c’est nécessaire

Lorsque vous mettez à jour la configuration sandbox :

- Les environnements d’exécution existants continuent de fonctionner avec les anciens paramètres.
- Les environnements d’exécution ne sont élagués qu’après 24 h d’inactivité.
- Les agents utilisés régulièrement maintiennent indéfiniment les anciens environnements d’exécution en vie.

Utilisez `openclaw sandbox recreate` pour forcer la suppression des anciens environnements d’exécution. Ils sont recréés automatiquement avec les paramètres actuels lorsqu’ils sont à nouveau nécessaires.

<Tip>
Préférez `openclaw sandbox recreate` au nettoyage manuel propre au backend. Cette commande utilise le registre d’environnements d’exécution du Gateway et évite les incohérences lorsque la portée ou les clés de session changent.
</Tip>

## Configuration

Les paramètres sandbox se trouvent dans `~/.openclaw/openclaw.json` sous `agents.defaults.sandbox` (les remplacements par agent vont dans `agents.list[].sandbox`) :

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Voir aussi

- [Référence CLI](/fr/cli)
- [Mise en sandbox](/fr/gateway/sandboxing)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Doctor](/fr/gateway/doctor) : vérifie la configuration sandbox.
