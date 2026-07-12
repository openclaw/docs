---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gérer les environnements d’exécution sandbox et examiner la politique sandbox effective
title: CLI de bac à sable
x-i18n:
    generated_at: "2026-07-12T15:16:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Gérez les environnements d’exécution de bac à sable pour l’exécution isolée des agents : conteneurs Docker, cibles SSH ou backends OpenShell.

## Commandes

### `openclaw sandbox list`

Répertorie les environnements d’exécution de bac à sable avec leur état, leur backend, la correspondance de configuration, leur âge, leur durée d’inactivité et la session ou l’agent associé.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # conteneurs de navigateur uniquement
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Supprime les environnements d’exécution de bac à sable afin de forcer leur recréation avec la configuration actuelle. Les environnements d’exécution sont automatiquement recréés lors de la prochaine utilisation de l’agent.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # inclut les sous-sessions agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # uniquement les conteneurs de navigateur
openclaw sandbox recreate --all --force        # ignore la confirmation
```

Options :

- `--all` : recrée tous les conteneurs de bac à sable
- `--session <key>` : recrée l’environnement d’exécution avec cette clé de portée exacte (telle qu’affichée par `sandbox list`) ; aucune expansion des noms courts
- `--agent <id>` : recrée les environnements d’exécution d’un agent (correspond à `agent:<id>` et `agent:<id>:*`)
- `--browser` : affecte uniquement les conteneurs de navigateur
- `--force` : ignore l’invite de confirmation

Transmettez exactement une option parmi `--all`, `--session` et `--agent`.

Pour `ssh` et OpenShell `remote`, la recréation est plus importante qu’avec Docker : l’espace de travail distant devient canonique après l’initialisation, `recreate` supprime cet espace de travail distant canonique pour la portée sélectionnée, et l’exécution suivante le réinitialise à partir de l’espace de travail local actuel.

### `openclaw sandbox explain`

Inspecte le mode, la portée et l’accès à l’espace de travail effectifs du bac à sable, la politique des outils du bac à sable et les contrôles des outils élevés, avec les chemins des clés de configuration permettant de les corriger.

Le rapport conserve `workspaceRoot` comme racine de bac à sable configurée et affiche séparément l’espace de travail hôte effectif, le répertoire de travail du backend d’exécution et la table des montages Docker. Pour `workspaceAccess: "rw"`, l’espace de travail hôte effectif est l’espace de travail de l’agent plutôt qu’un répertoire sous `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Contrairement à `recreate --session`, cette commande accepte les noms de session courts (par exemple `main`) et les développe en fonction de l’agent résolu.

## Pourquoi la recréation est nécessaire

La mise à jour de la configuration du bac à sable n’affecte pas les conteneurs en cours d’exécution : les environnements d’exécution existants conservent leurs anciens paramètres, et les environnements inactifs ne sont nettoyés qu’après `prune.idleHours` (24h par défaut). Les agents utilisés régulièrement peuvent conserver indéfiniment des environnements d’exécution obsolètes. `openclaw sandbox recreate` supprime l’ancien environnement d’exécution afin que la prochaine utilisation le reconstruise à partir de la configuration actuelle.

<Tip>
Préférez `openclaw sandbox recreate` au nettoyage manuel propre à chaque backend. Cette commande utilise le registre des environnements d’exécution du Gateway et évite les incohérences lorsque les clés de portée ou de session changent.
</Tip>

## Déclencheurs courants

| Modification                                                                                                                                                   | Commande                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Mise à jour de l’image Docker (`agents.defaults.sandbox.docker.image`)                                                                                          | `openclaw sandbox recreate --all`                                   |
| Configuration du bac à sable (`agents.defaults.sandbox.*`)                                                                                                     | `openclaw sandbox recreate --all`                                   |
| Cible/authentification SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Source/politique/mode OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                         | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (ou `--agent <id>` pour un agent) |

<Note>
Les environnements d’exécution sont automatiquement recréés lors de la prochaine utilisation de l’agent.
</Note>

## Migration du registre

Les métadonnées des environnements d’exécution de bac à sable résident dans la base de données d’état SQLite partagée. Les anciennes installations peuvent contenir des fichiers de registre hérités que les lectures normales ne réécrivent plus :

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- une partition JSON par conteneur ou navigateur sous `~/.openclaw/sandbox/containers/` ou `~/.openclaw/sandbox/browsers/`

Exécutez `openclaw doctor --fix` pour migrer les entrées héritées valides vers SQLite. Les fichiers hérités non valides sont mis en quarantaine afin qu’un ancien registre corrompu ne puisse pas masquer les entrées actuelles des environnements d’exécution.

## Configuration

Les paramètres du bac à sable se trouvent dans `~/.openclaw/openclaw.json`, sous `agents.defaults.sandbox` (les substitutions propres à chaque agent se placent dans `agents.list[].sandbox`) :

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // désactivé, hors session principale, tous
        "backend": "docker", // docker, ssh, openshell (fourni par un plugin)
        "scope": "agent", // session, agent, partagé
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... autres options Docker
        },
        "prune": {
          "idleHours": 24, // nettoyage automatique après 24h d’inactivité
          "maxAgeDays": 7, // nettoyage automatique après 7 jours
        },
      },
    },
  },
}
```

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Mise en bac à sable](/fr/gateway/sandboxing)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Doctor](/fr/gateway/doctor) : vérifie la configuration du bac à sable.
