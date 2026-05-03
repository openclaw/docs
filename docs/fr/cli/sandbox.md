---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gérer les environnements d’exécution de bac à sable et inspecter la politique de bac à sable effective
title: CLI du bac à sable
x-i18n:
    generated_at: "2026-05-03T21:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Gérez les runtimes de sandbox pour l’exécution isolée des agents.

## Vue d’ensemble

OpenClaw peut exécuter des agents dans des runtimes de sandbox isolés pour des raisons de sécurité. Les commandes `sandbox` vous aident à inspecter et recréer ces runtimes après des mises à jour ou des changements de configuration.

Aujourd’hui, cela signifie généralement :

- conteneurs de sandbox Docker
- runtimes de sandbox SSH lorsque `agents.defaults.sandbox.backend = "ssh"`
- runtimes de sandbox OpenShell lorsque `agents.defaults.sandbox.backend = "openshell"`

Pour `ssh` et OpenShell `remote`, la recréation est plus importante qu’avec Docker :

- l’espace de travail distant est canonique après l’initialisation initiale
- `openclaw sandbox recreate` supprime cet espace de travail distant canonique pour la portée sélectionnée
- l’utilisation suivante le réinitialise depuis l’espace de travail local actuel

## Commandes

### `openclaw sandbox explain`

Inspectez le mode/la portée/l’accès à l’espace de travail de sandbox **effectifs**, la politique des outils de sandbox et les garde-fous d’élévation (avec les chemins de clés de configuration de correction).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Répertoriez tous les runtimes de sandbox avec leur statut et leur configuration.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**La sortie inclut :**

- Nom et statut du runtime
- Backend (`docker`, `openshell`, etc.)
- Libellé de configuration et indication de correspondance avec la configuration actuelle
- Âge (temps écoulé depuis la création)
- Temps d’inactivité (temps écoulé depuis la dernière utilisation)
- Session/agent associé

### `openclaw sandbox recreate`

Supprimez des runtimes de sandbox pour forcer leur recréation avec la configuration mise à jour.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Options :**

- `--all` : recréer tous les conteneurs de sandbox
- `--session <key>` : recréer le conteneur pour une session spécifique
- `--agent <id>` : recréer les conteneurs pour un agent spécifique
- `--browser` : recréer uniquement les conteneurs de navigateur
- `--force` : ignorer l’invite de confirmation

<Note>
Les runtimes sont automatiquement recréés à la prochaine utilisation de l’agent.
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

### Après un changement de configuration de sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Après un changement de cible SSH ou de matériel d’authentification SSH

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
sur la cible SSH. L’exécution suivante la réinitialise depuis l’espace de travail local.

### Après un changement de source, de politique ou de mode OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Pour le mode OpenShell `remote`, la recréation supprime l’espace de travail distant canonique
pour cette portée. L’exécution suivante le réinitialise depuis l’espace de travail local.

### Après un changement de setupCommand

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

Lorsque vous mettez à jour la configuration de sandbox :

- Les runtimes existants continuent de fonctionner avec les anciens paramètres.
- Les runtimes ne sont purgés qu’après 24 h d’inactivité.
- Les agents utilisés régulièrement conservent indéfiniment les anciens runtimes actifs.

Utilisez `openclaw sandbox recreate` pour forcer la suppression des anciens runtimes. Ils sont automatiquement recréés avec les paramètres actuels au prochain besoin.

<Tip>
Préférez `openclaw sandbox recreate` au nettoyage manuel propre à chaque backend. Cette commande utilise le registre de runtime du Gateway et évite les incohérences lorsque les clés de portée ou de session changent.
</Tip>

## Migration du registre

OpenClaw stocke les métadonnées de runtime de sandbox sous forme d’un fragment JSON par entrée de conteneur/navigateur dans le répertoire d’état de sandbox. Les installations plus anciennes peuvent encore avoir des fichiers hérités monolithiques :

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Les lectures régulières des runtimes de sandbox ne réécrivent pas ces fichiers. Exécutez `openclaw doctor --fix` pour migrer les entrées héritées valides vers les répertoires de registre fragmenté. Les fichiers hérités invalides sont mis en quarantaine afin qu’un seul ancien registre défectueux ne puisse pas masquer les entrées de runtime actuelles.

## Configuration

Les paramètres de sandbox se trouvent dans `~/.openclaw/openclaw.json` sous `agents.defaults.sandbox` (les remplacements par agent vont dans `agents.list[].sandbox`) :

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

## Associés

- [Référence CLI](/fr/cli)
- [Sandboxing](/fr/gateway/sandboxing)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Doctor](/fr/gateway/doctor) : vérifie la configuration de sandbox.
