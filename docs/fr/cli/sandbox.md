---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gérer les environnements d’exécution isolés et inspecter la politique d’isolation effective
title: CLI de bac à sable
x-i18n:
    generated_at: "2026-07-12T02:44:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Gérez les environnements d’exécution sandbox pour l’exécution isolée des agents : conteneurs Docker, cibles SSH ou backends OpenShell.

## Commandes

### `openclaw sandbox list`

Répertorie les environnements d’exécution sandbox avec leur état, leur backend, la correspondance de configuration, leur ancienneté, leur durée d’inactivité et la session ou l’agent associé.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # conteneurs de navigateur uniquement
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Supprime les environnements d’exécution sandbox pour forcer leur recréation avec la configuration actuelle. Ils sont automatiquement recréés lors de la prochaine utilisation de l’agent.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # inclut les sous-sessions agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # conteneurs de navigateur uniquement
openclaw sandbox recreate --all --force        # ignore la confirmation
```

Options :

- `--all` : recrée tous les conteneurs sandbox
- `--session <key>` : recrée l’environnement d’exécution correspondant exactement à cette clé de portée (telle qu’affichée par `sandbox list`) ; aucune expansion des noms courts
- `--agent <id>` : recrée les environnements d’exécution d’un agent (correspond à `agent:<id>` et `agent:<id>:*`)
- `--browser` : affecte uniquement les conteneurs de navigateur
- `--force` : ignore l’invite de confirmation

Transmettez exactement une option parmi `--all`, `--session` et `--agent`.

Pour `ssh` et le mode `remote` d’OpenShell, la recréation est plus importante qu’avec Docker : après l’initialisation, l’espace de travail distant fait autorité ; `recreate` supprime cet espace de travail distant de référence pour la portée sélectionnée, et l’exécution suivante le réinitialise à partir de l’espace de travail local actuel.

### `openclaw sandbox explain`

Inspecte le mode et la portée effectifs du sandbox, l’accès à l’espace de travail, la politique des outils du sandbox et les contrôles des outils à privilèges élevés, avec les chemins des clés de configuration à corriger.

Le rapport conserve `workspaceRoot` comme racine du sandbox configurée et affiche séparément l’espace de travail hôte effectif, le répertoire de travail du backend d’exécution et la table des montages Docker. Avec `workspaceAccess: "rw"`, l’espace de travail hôte effectif est celui de l’agent plutôt qu’un répertoire situé sous `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Contrairement à `recreate --session`, cette commande accepte les noms de session courts, par exemple `main`, et les développe en fonction de l’agent résolu.

## Pourquoi la recréation est nécessaire

La mise à jour de la configuration du sandbox n’affecte pas les conteneurs en cours d’exécution : les environnements d’exécution existants conservent leurs anciens paramètres, et ceux qui sont inactifs ne sont supprimés qu’après `prune.idleHours` (24 h par défaut). Les agents régulièrement utilisés peuvent ainsi conserver indéfiniment des environnements d’exécution obsolètes. `openclaw sandbox recreate` supprime l’ancien environnement afin que sa prochaine utilisation le reconstruise à partir de la configuration actuelle.

<Tip>
Préférez `openclaw sandbox recreate` à un nettoyage manuel propre à chaque backend. Cette commande utilise le registre des environnements d’exécution du Gateway et évite les incohérences lorsque la portée ou les clés de session changent.
</Tip>

## Déclencheurs courants

| Modification                                                                                                                                                   | Commande                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Mise à jour de l’image Docker (`agents.defaults.sandbox.docker.image`)                                                                                          | `openclaw sandbox recreate --all`                                   |
| Configuration du sandbox (`agents.defaults.sandbox.*`)                                                                                                         | `openclaw sandbox recreate --all`                                   |
| Cible/authentification SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Source/politique/mode OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                          | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (ou `--agent <id>` pour un agent) |

<Note>
Les environnements d’exécution sont automatiquement recréés lors de la prochaine utilisation de l’agent.
</Note>

## Migration du registre

Les métadonnées des environnements d’exécution sandbox résident dans la base de données d’état SQLite partagée. Les anciennes installations peuvent comporter des fichiers de registre hérités qui ne sont plus réécrits lors des lectures ordinaires :

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- un fragment JSON par conteneur ou navigateur sous `~/.openclaw/sandbox/containers/` ou `~/.openclaw/sandbox/browsers/`

Exécutez `openclaw doctor --fix` pour migrer les entrées héritées valides vers SQLite. Les fichiers hérités non valides sont placés en quarantaine afin qu’un ancien registre corrompu ne puisse pas masquer les entrées actuelles des environnements d’exécution.

## Configuration

Les paramètres du sandbox se trouvent dans `~/.openclaw/openclaw.json`, sous `agents.defaults.sandbox` (les substitutions propres à chaque agent se placent dans `agents.list[].sandbox`) :

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (fourni par un plugin)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... autres options Docker
        },
        "prune": {
          "idleHours": 24, // suppression automatique après 24 h d’inactivité
          "maxAgeDays": 7, // suppression automatique après 7 jours
        },
      },
    },
  },
}
```

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Mise en sandbox](/fr/gateway/sandboxing)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Doctor](/fr/gateway/doctor) : vérifie la configuration du sandbox.
