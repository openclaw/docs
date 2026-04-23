---
read_when:
    - Vous voulez des bacs à sable gérés dans le cloud au lieu de Docker local
    - Vous configurez le plugin OpenShell
    - Vous devez choisir entre les modes d’espace de travail miroir et distant
summary: Utiliser OpenShell comme backend de bac à sable géré pour les agents OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T07:03:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f93a8350fd48602bc535ec0480d0ed1665e558b37cc23c820ac90097862abd23
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell est un backend de bac à sable géré pour OpenClaw. Au lieu d’exécuter des
conteneurs Docker localement, OpenClaw délègue le cycle de vie du bac à sable à la CLI `openshell`,
qui provisionne des environnements distants avec exécution de commandes via SSH.

Le plugin OpenShell réutilise le même transport SSH principal et le même pont de système de fichiers distant
que le [backend SSH](/fr/gateway/sandboxing#ssh-backend) générique. Il ajoute le cycle de vie spécifique à OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) et un mode d’espace de travail `mirror`
facultatif.

## Prérequis

- La CLI `openshell` installée et présente dans le `PATH` (ou définissez un chemin personnalisé via
  `plugins.entries.openshell.config.command`)
- Un compte OpenShell avec accès aux bacs à sable
- La Gateway OpenClaw en cours d’exécution sur l’hôte

## Démarrage rapide

1. Activez le plugin et définissez le backend de bac à sable :

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

2. Redémarrez la Gateway. Au prochain tour d’agent, OpenClaw crée un bac à sable OpenShell
   et y achemine l’exécution des outils.

3. Vérifiez :

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modes d’espace de travail

C’est la décision la plus importante lors de l’utilisation d’OpenShell.

### `mirror`

Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que **l’espace de travail
local reste canonique**.

Comportement :

- Avant `exec`, OpenClaw synchronise l’espace de travail local dans le bac à sable OpenShell.
- Après `exec`, OpenClaw synchronise l’espace de travail distant vers l’espace de travail local.
- Les outils de fichiers continuent de fonctionner via le pont de bac à sable, mais l’espace de travail local
  reste la source de vérité entre les tours.

Idéal pour :

- Vous modifiez des fichiers localement en dehors d’OpenClaw et vous voulez que ces changements soient visibles dans le
  bac à sable automatiquement.
- Vous voulez que le bac à sable OpenShell se comporte autant que possible comme le backend Docker.
- Vous voulez que l’espace de travail de l’hôte reflète les écritures du bac à sable après chaque tour `exec`.

Compromis : coût de synchronisation supplémentaire avant et après chaque `exec`.

### `remote`

Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que **l’espace de travail
OpenShell devienne canonique**.

Comportement :

- Lors de la première création du bac à sable, OpenClaw initialise une fois l’espace de travail distant à partir de
  l’espace de travail local.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent
  directement sur l’espace de travail distant OpenShell.
- OpenClaw **ne** synchronise **pas** les modifications distantes vers l’espace de travail local.
- Les lectures de médias au moment du prompt continuent de fonctionner, car les outils de fichiers et de médias lisent via
  le pont de bac à sable.

Idéal pour :

- Le bac à sable doit vivre principalement du côté distant.
- Vous voulez une surcharge de synchronisation plus faible à chaque tour.
- Vous ne voulez pas que des modifications locales de l’hôte écrasent silencieusement l’état du bac à sable distant.

Important : si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’initialisation,
le bac à sable distant **ne** voit **pas** ces changements. Utilisez
`openclaw sandbox recreate` pour réinitialiser depuis la source.

### Choisir un mode

|                          | `mirror`                          | `remote`                      |
| ------------------------ | --------------------------------- | ----------------------------- |
| **Espace de travail canonique** | Hôte local                        | OpenShell distant             |
| **Sens de synchronisation**     | Bidirectionnel (à chaque `exec`) | Initialisation unique         |
| **Surcharge par tour**          | Plus élevée (envoi + téléchargement) | Plus faible (ops distantes directes) |
| **Modifications locales visibles ?** | Oui, au prochain `exec`           | Non, jusqu’à `recreate`       |
| **Idéal pour**                  | Flux de travail de développement | Agents longue durée, CI       |

## Référence de configuration

Toute la configuration OpenShell se trouve sous `plugins.entries.openshell.config` :

| Clé                       | Type                     | Par défaut    | Description                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`    | Mode de synchronisation de l’espace de travail        |
| `command`                 | `string`                 | `"openshell"` | Chemin ou nom de la CLI `openshell`                   |
| `from`                    | `string`                 | `"openclaw"`  | Source du bac à sable pour la première création       |
| `gateway`                 | `string`                 | —             | Nom de Gateway OpenShell (`--gateway`)                |
| `gatewayEndpoint`         | `string`                 | —             | URL du point de terminaison de la Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | Identifiant de politique OpenShell pour la création du bac à sable |
| `providers`               | `string[]`               | `[]`          | Noms des fournisseurs à attacher lors de la création du bac à sable |
| `gpu`                     | `boolean`                | `false`       | Demander des ressources GPU                           |
| `autoProviders`           | `boolean`                | `true`        | Passer `--auto-providers` lors de `sandbox create`    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Espace de travail principal inscriptible dans le bac à sable |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Chemin de montage de l’espace de travail de l’agent (pour un accès en lecture seule) |
| `timeoutSeconds`          | `number`                 | `120`         | Délai d’expiration des opérations CLI `openshell`     |

Les paramètres au niveau du bac à sable (`mode`, `scope`, `workspaceAccess`) se configurent sous
`agents.defaults.sandbox` comme pour tout backend. Voir
[Sandboxing](/fr/gateway/sandboxing) pour la matrice complète.

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

### OpenShell par agent avec Gateway personnalisée

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

Les bacs à sable OpenShell sont gérés via la CLI normale des bacs à sable :

```bash
# Lister tous les environnements de bac à sable (Docker + OpenShell)
openclaw sandbox list

# Inspecter la politique effective
openclaw sandbox explain

# Recréer (supprime l’espace de travail distant, réinitialisé à la prochaine utilisation)
openclaw sandbox recreate --all
```

Pour le mode `remote`, **recreate est particulièrement important** : il supprime l’espace de travail distant
canonique pour cette portée. L’utilisation suivante initialise un nouvel espace de travail distant à partir
de l’espace de travail local.

Pour le mode `mirror`, recreate réinitialise principalement l’environnement d’exécution distant puisque
l’espace de travail local reste canonique.

### Quand recréer

Recréez après avoir modifié l’un des éléments suivants :

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Renforcement de la sécurité

Les assistants de bac à sable OpenShell qui lisent des fichiers de l’espace de travail distant utilisent un descripteur
de fichier épinglé pour la racine de l’espace de travail et parcourent les ancêtres à partir de ce fd épinglé
au lieu de résoudre à nouveau le chemin pour chaque lecture. Combiné à une revérification
d’identité à chaque opération, cela empêche qu’un échange de lien symbolique en cours de tour ou qu’un
montage d’espace de travail remplacé à chaud redirige les lectures en dehors de l’espace de travail distant
prévu.

- La racine de l’espace de travail est ouverte une fois et épinglée ; les lectures ultérieures réutilisent ce fd.
- Les parcours d’ancêtres traversent des entrées relatives à partir du fd épinglé afin qu’ils ne puissent pas
  être redirigés par un répertoire de remplacement plus haut dans le chemin.
- L’identité du bac à sable est revérifiée avant chaque lecture, de sorte qu’un bac à sable recréé ou
  réassigné ne puisse pas servir silencieusement des fichiers d’un autre espace de travail.

## Limitations actuelles

- Le navigateur de bac à sable n’est pas pris en charge sur le backend OpenShell.
- `sandbox.docker.binds` ne s’applique pas à OpenShell.
- Les réglages d’exécution spécifiques à Docker sous `sandbox.docker.*` s’appliquent uniquement au backend
  Docker.

## Fonctionnement

1. OpenClaw appelle `openshell sandbox create` (avec les drapeaux `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` selon la configuration).
2. OpenClaw appelle `openshell sandbox ssh-config <name>` pour obtenir les détails de connexion SSH
   du bac à sable.
3. Le cœur écrit la configuration SSH dans un fichier temporaire et ouvre une session SSH en utilisant le
   même pont de système de fichiers distant que le backend SSH générique.
4. En mode `mirror` : synchroniser du local vers le distant avant `exec`, exécuter, puis resynchroniser après `exec`.
5. En mode `remote` : initialiser une fois à la création, puis opérer directement sur l’espace de travail
   distant.

## Voir aussi

- [Sandboxing](/fr/gateway/sandboxing) -- modes, portées et comparaison des backends
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- débogage des outils bloqués
- [Multi-Agent Sandbox and Tools](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent
- [CLI du bac à sable](/fr/cli/sandbox) -- commandes `openclaw sandbox`
