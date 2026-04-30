---
read_when:
    - Vous voulez des bacs à sable gérés dans le cloud plutôt que Docker local
    - Vous configurez le Plugin OpenShell
    - Vous devez choisir entre les modes miroir et espace de travail distant
summary: Utiliser OpenShell comme backend de bac à sable géré pour les agents OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T07:28:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell est un backend de sandbox géré pour OpenClaw. Au lieu d’exécuter des
conteneurs Docker localement, OpenClaw délègue le cycle de vie de la sandbox à la
CLI `openshell`, qui provisionne des environnements distants avec exécution de
commandes via SSH.

Le Plugin OpenShell réutilise le même transport SSH principal et le même pont de
système de fichiers distant que le [backend SSH](/fr/gateway/sandboxing#ssh-backend)
générique. Il ajoute un cycle de vie spécifique à OpenShell (`sandbox create/get/delete`,
`sandbox ssh-config`) et un mode d’espace de travail `mirror` facultatif.

## Prérequis

- La CLI `openshell` installée et présente dans `PATH` (ou définissez un chemin
  personnalisé via `plugins.entries.openshell.config.command`)
- Un compte OpenShell avec accès aux sandboxes
- Le Gateway OpenClaw exécuté sur l’hôte

## Démarrage rapide

1. Activez le Plugin et définissez le backend de sandbox :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Redémarrez le Gateway. Au prochain tour de l’agent, OpenClaw crée une sandbox
   OpenShell et y achemine l’exécution des outils.

3. Vérifiez :

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modes d’espace de travail

C’est la décision la plus importante lorsque vous utilisez OpenShell.

### `mirror`

Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que
**l’espace de travail local reste canonique**.

Comportement :

- Avant `exec`, OpenClaw synchronise l’espace de travail local vers la sandbox OpenShell.
- Après `exec`, OpenClaw synchronise l’espace de travail distant vers l’espace de travail local.
- Les outils de fichiers fonctionnent toujours via le pont de sandbox, mais l’espace de
  travail local reste la source de vérité entre les tours.

Idéal pour :

- Vous modifiez des fichiers localement en dehors d’OpenClaw et voulez que ces
  changements soient visibles automatiquement dans la sandbox.
- Vous voulez que la sandbox OpenShell se comporte autant que possible comme le
  backend Docker.
- Vous voulez que l’espace de travail de l’hôte reflète les écritures de la sandbox
  après chaque tour d’exécution.

Compromis : coût de synchronisation supplémentaire avant et après chaque exécution.

### `remote`

Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que
**l’espace de travail OpenShell devienne canonique**.

Comportement :

- Lorsque la sandbox est créée pour la première fois, OpenClaw initialise une fois
  l’espace de travail distant à partir de l’espace de travail local.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent directement
  sur l’espace de travail OpenShell distant.
- OpenClaw ne synchronise **pas** les changements distants vers l’espace de travail local.
- Les lectures de médias au moment du prompt fonctionnent toujours, car les outils de
  fichiers et de médias lisent via le pont de sandbox.

Idéal pour :

- La sandbox doit vivre principalement côté distant.
- Vous voulez réduire le surcoût de synchronisation à chaque tour.
- Vous ne voulez pas que les modifications locales sur l’hôte écrasent silencieusement
  l’état de la sandbox distante.

<Warning>
Si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’initialisation initiale, la sandbox distante ne voit **pas** ces changements. Utilisez `openclaw sandbox recreate` pour réinitialiser.
</Warning>

### Choisir un mode

|                          | `mirror`                            | `remote`                          |
| ------------------------ | ----------------------------------- | --------------------------------- |
| **Espace canonique**     | Hôte local                          | OpenShell distant                 |
| **Sens de synchronisation** | Bidirectionnel (chaque exec)       | Initialisation unique             |
| **Surcoût par tour**     | Plus élevé (upload + download)      | Plus faible (opérations distantes directes) |
| **Modifications locales visibles ?** | Oui, au prochain exec       | Non, jusqu’à recréation           |
| **Idéal pour**           | Flux de développement               | Agents de longue durée, CI        |

## Référence de configuration

Toute la configuration OpenShell se trouve sous `plugins.entries.openshell.config` :

| Clé                       | Type                     | Valeur par défaut | Description                                           |
| ------------------------- | ------------------------ | ----------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`        | Mode de synchronisation de l’espace de travail        |
| `command`                 | `string`                 | `"openshell"`     | Chemin ou nom de la CLI `openshell`                   |
| `from`                    | `string`                 | `"openclaw"`      | Source de sandbox pour la première création           |
| `gateway`                 | `string`                 | —                 | Nom du Gateway OpenShell (`--gateway`)                |
| `gatewayEndpoint`         | `string`                 | —                 | URL du point de terminaison Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —                 | ID de politique OpenShell pour la création de sandbox |
| `providers`               | `string[]`               | `[]`              | Noms des fournisseurs à attacher lors de la création de la sandbox |
| `gpu`                     | `boolean`                | `false`           | Demander des ressources GPU                           |
| `autoProviders`           | `boolean`                | `true`            | Passer `--auto-providers` pendant la création de la sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`      | Espace de travail principal accessible en écriture dans la sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`        | Chemin de montage de l’espace de travail de l’agent (pour accès en lecture seule) |
| `timeoutSeconds`          | `number`                 | `120`             | Délai d’expiration pour les opérations de la CLI `openshell` |

Les paramètres au niveau de la sandbox (`mode`, `scope`, `workspaceAccess`) sont
configurés sous `agents.defaults.sandbox`, comme avec n’importe quel backend.
Consultez [Sandboxing](/fr/gateway/sandboxing) pour la matrice complète.

## Exemples

### Configuration distante minimale

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Mode miroir avec GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell par agent avec Gateway personnalisé

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Gestion du cycle de vie

Les sandboxes OpenShell sont gérées via la CLI de sandbox normale :

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Pour le mode `remote`, **la recréation est particulièrement importante** : elle
supprime l’espace de travail distant canonique pour cette portée. La prochaine
utilisation initialise un nouvel espace de travail distant à partir de l’espace de
travail local.

Pour le mode `mirror`, la recréation réinitialise surtout l’environnement
d’exécution distant, car l’espace de travail local reste canonique.

### Quand recréer

Recréez après avoir modifié l’un de ces éléments :

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Renforcement de la sécurité

OpenShell épingle le fd racine de l’espace de travail et revérifie l’identité de
la sandbox avant chaque lecture, afin que les remplacements de liens symboliques
ou un espace de travail remonté ne puissent pas rediriger les lectures hors de
l’espace de travail distant prévu.

## Limitations actuelles

- Le navigateur de sandbox n’est pas pris en charge sur le backend OpenShell.
- `sandbox.docker.binds` ne s’applique pas à OpenShell.
- Les paramètres d’exécution propres à Docker sous `sandbox.docker.*` s’appliquent
  uniquement au backend Docker.

## Fonctionnement

1. OpenClaw appelle `openshell sandbox create` (avec les indicateurs `--from`,
   `--gateway`, `--policy`, `--providers`, `--gpu` selon la configuration).
2. OpenClaw appelle `openshell sandbox ssh-config <name>` pour obtenir les détails
   de connexion SSH de la sandbox.
3. Le cœur écrit la configuration SSH dans un fichier temporaire et ouvre une
   session SSH avec le même pont de système de fichiers distant que le backend SSH
   générique.
4. En mode `mirror` : synchronisation du local vers le distant avant exec,
   exécution, puis synchronisation inverse après exec.
5. En mode `remote` : initialisation unique à la création, puis opérations directes
   sur l’espace de travail distant.

## Connexe

- [Sandboxing](/fr/gateway/sandboxing) -- modes, portées et comparaison des backends
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- débogage des outils bloqués
- [Multi-Agent Sandbox and Tools](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent
- [Sandbox CLI](/fr/cli/sandbox) -- commandes `openclaw sandbox`
