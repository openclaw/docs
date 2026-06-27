---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gérer les environnements d’exécution sandbox et inspecter la politique sandbox effective
title: CLI de bac à sable
x-i18n:
    generated_at: "2026-06-27T17:20:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Gérez les environnements d’exécution sandbox pour l’exécution isolée des agents.

## Vue d’ensemble

OpenClaw peut exécuter des agents dans des environnements d’exécution sandbox isolés pour des raisons de sécurité. Les commandes `sandbox` vous aident à inspecter et recréer ces environnements après des mises à jour ou des changements de configuration.

Aujourd’hui, cela signifie généralement :

- Conteneurs sandbox Docker
- Environnements d’exécution sandbox SSH lorsque `agents.defaults.sandbox.backend = "ssh"`
- Environnements d’exécution sandbox OpenShell lorsque `agents.defaults.sandbox.backend = "openshell"`

Pour `ssh` et OpenShell `remote`, recréer est plus important qu’avec Docker :

- l’espace de travail distant est canonique après l’amorçage initial
- `openclaw sandbox recreate` supprime cet espace de travail distant canonique pour la portée sélectionnée
- la prochaine utilisation l’amorce à nouveau depuis l’espace de travail local actuel

## Commandes

### `openclaw sandbox explain`

Inspectez le mode, la portée et l’accès à l’espace de travail sandbox **effectifs**, la politique d’outils sandbox et les contrôles d’élévation (avec les chemins de clés de configuration de correction).

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

- Nom et état de l’environnement d’exécution
- Backend (`docker`, `openshell`, etc.)
- Libellé de configuration et indication de correspondance avec la configuration actuelle
- Âge (temps écoulé depuis la création)
- Temps d’inactivité (temps écoulé depuis la dernière utilisation)
- Session/agent associé

### `openclaw sandbox recreate`

Supprimez les environnements d’exécution sandbox pour forcer leur recréation avec la configuration mise à jour.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Options :**

- `--all` : recréer tous les conteneurs sandbox
- `--session <key>` : recréer le conteneur pour une session spécifique
- `--agent <id>` : recréer les conteneurs pour un agent spécifique
- `--browser` : recréer uniquement les conteneurs de navigateur
- `--force` : ignorer l’invite de confirmation

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

### Après un changement de configuration sandbox

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

Pour le backend `ssh` du cœur, recréer supprime la racine de l’espace de travail distant par portée
sur la cible SSH. La prochaine exécution l’amorce à nouveau depuis l’espace de travail local.

### Après un changement de source, de politique ou de mode OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Pour le mode OpenShell `remote`, recréer supprime l’espace de travail distant canonique
pour cette portée. La prochaine exécution l’amorce à nouveau depuis l’espace de travail local.

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

Lorsque vous mettez à jour la configuration sandbox :

- Les environnements d’exécution existants continuent de fonctionner avec les anciens paramètres.
- Les environnements d’exécution ne sont élagués qu’après 24 h d’inactivité.
- Les agents utilisés régulièrement conservent indéfiniment les anciens environnements d’exécution actifs.

Utilisez `openclaw sandbox recreate` pour forcer la suppression des anciens environnements d’exécution. Ils sont recréés automatiquement avec les paramètres actuels lorsqu’ils sont de nouveau nécessaires.

<Tip>
Préférez `openclaw sandbox recreate` au nettoyage manuel propre à un backend. Cette commande utilise le registre d’environnements d’exécution du Gateway et évite les incohérences lorsque les clés de portée ou de session changent.
</Tip>

## Migration du registre

OpenClaw stocke les métadonnées des environnements d’exécution sandbox dans la base de données d’état SQLite partagée. Les installations plus anciennes peuvent encore avoir des fichiers de registre sandbox hérités :

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Certaines mises à niveau peuvent aussi avoir un fragment JSON par conteneur/navigateur sous `~/.openclaw/sandbox/containers/` ou `~/.openclaw/sandbox/browsers/`. Les lectures ordinaires des environnements d’exécution sandbox ne réécrivent pas ces sources héritées. Exécutez `openclaw doctor --fix` pour migrer les entrées héritées valides vers SQLite. Les fichiers hérités invalides sont mis en quarantaine afin qu’un ancien registre défectueux ne puisse pas masquer les entrées d’environnement d’exécution actuelles.

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

## Connexe

- [Référence CLI](/fr/cli)
- [Sandboxing](/fr/gateway/sandboxing)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Doctor](/fr/gateway/doctor) : vérifie la configuration sandbox.
