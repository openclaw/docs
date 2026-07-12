---
read_when:
    - Vous souhaitez des environnements isolés gérés dans le cloud plutôt que Docker en local
    - Vous configurez le plugin OpenShell
    - Vous devez choisir entre les modes miroir et espace de travail distant
summary: Utiliser OpenShell comme backend de bac à sable géré pour les agents OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T15:28:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell est un backend de bac à sable géré : au lieu d’exécuter des conteneurs Docker
localement, OpenClaw délègue le cycle de vie du bac à sable à la CLI `openshell`, qui
provisionne des environnements distants et exécute des commandes via SSH.

Le plugin réutilise le même transport SSH et la même passerelle vers le système de fichiers distant que le
[backend SSH générique](/fr/gateway/sandboxing#ssh-backend), et ajoute le cycle de vie OpenShell
(`sandbox create/get/delete/ssh-config`) ainsi qu’un mode facultatif de synchronisation d’espace de travail `mirror`.

## Prérequis

- Plugin OpenShell installé (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` dans le `PATH` (ou chemin personnalisé via
  `plugins.entries.openshell.config.command`)
- Un compte OpenShell ayant accès aux bacs à sable
- Gateway OpenClaw en cours d’exécution sur l’hôte

## Démarrage rapide

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

Redémarrez le Gateway. Lors du prochain tour de l’agent, OpenClaw crée un bac à sable OpenShell
et y achemine l’exécution des outils. Vérifiez avec :

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modes d’espace de travail

Il s’agit de la décision la plus importante concernant OpenShell.

### mirror (par défaut)

`plugins.entries.openshell.config.mode: "mirror"` maintient **l’espace de travail local
comme référence** :

- Avant `exec`, OpenClaw synchronise l’espace de travail local vers le bac à sable.
- Après `exec`, OpenClaw resynchronise l’espace de travail distant vers l’environnement local.
- Les outils de fichiers passent par la passerelle du bac à sable, mais l’environnement local reste la source de vérité
  entre les tours.

Idéal pour les flux de développement : les modifications locales effectuées en dehors d’OpenClaw apparaissent lors de
la prochaine exécution, et le comportement du bac à sable reste proche de celui du backend Docker.

Compromis : coût d’envoi et de téléchargement à chaque tour d’exécution.

### remote

`mode: "remote"` fait de **l’espace de travail OpenShell la référence** :

- Lors de la première création du bac à sable, OpenClaw initialise une seule fois l’espace de travail distant à partir de l’environnement local.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent
  directement sur l’espace de travail distant. OpenClaw ne synchronise **pas** les modifications distantes
  vers l’environnement local.
- La lecture des médias au moment de la génération du prompt continue de fonctionner (les outils de fichiers et de médias lisent par l’intermédiaire de la
  passerelle du bac à sable).

Idéal pour les agents de longue durée et la CI : surcharge moindre à chaque tour et les modifications
locales sur l’hôte ne peuvent pas écraser silencieusement l’état distant.

<Warning>
Les modifications apportées aux fichiers sur l’hôte en dehors d’OpenClaw après l’initialisation sont invisibles pour le bac à sable distant. Exécutez `openclaw sandbox recreate` pour le réinitialiser.
</Warning>

### Choisir un mode

|                          | `mirror`                            | `remote`                         |
| ------------------------ | ----------------------------------- | -------------------------------- |
| **Espace de travail de référence** | Hôte local                  | OpenShell distant                |
| **Sens de synchronisation** | Bidirectionnel (à chaque exécution) | Initialisation unique            |
| **Surcharge par tour**    | Plus élevée (envoi + téléchargement) | Plus faible (opérations distantes directes) |
| **Modifications locales visibles ?** | Oui, à la prochaine exécution | Non, jusqu’à la recréation       |
| **Idéal pour**            | Flux de développement               | Agents de longue durée, CI       |

## Référence de configuration

Toute la configuration OpenShell se trouve sous `plugins.entries.openshell.config` :

| Clé                       | Type                     | Valeur par défaut | Description                                                                            |
| ------------------------- | ------------------------ | ----------------- | -------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`        | Mode de synchronisation de l’espace de travail                                         |
| `command`                 | `string`                 | `"openshell"`     | Chemin ou nom de la CLI `openshell`                                                     |
| `from`                    | `string`                 | `"openclaw"`      | Source du bac à sable lors de la première création                                     |
| `gateway`                 | `string`                 | non défini        | Nom du Gateway OpenShell (`--gateway` au niveau supérieur)                             |
| `gatewayEndpoint`         | `string`                 | non défini        | Point de terminaison du Gateway OpenShell (`--gateway-endpoint` au niveau supérieur)   |
| `policy`                  | `string`                 | non défini        | ID de politique OpenShell pour la création du bac à sable                              |
| `providers`               | `string[]`               | `[]`              | Noms des fournisseurs associés lors de la création du bac à sable (dédupliqués, un indicateur `--provider` par entrée) |
| `gpu`                     | `boolean`                | `false`           | Demander des ressources GPU (`--gpu`)                                                  |
| `autoProviders`           | `boolean`                | `true`            | Transmettre `--auto-providers` (ou `--no-auto-providers` si la valeur est false) lors de la création |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`      | Espace de travail principal accessible en écriture dans le bac à sable                 |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`        | Chemin de montage de l’espace de travail de l’agent (lecture seule si l’accès à l’espace de travail n’est pas `rw`) |
| `timeoutSeconds`          | `number`                 | `120`             | Délai d’expiration des opérations de la CLI `openshell`                                |

`remoteWorkspaceDir` et `remoteAgentWorkspaceDir` doivent être des chemins absolus et
rester sous les racines gérées `/sandbox` ou `/agent` ; les autres chemins absolus sont
refusés.

Les paramètres au niveau du bac à sable (`mode`, `scope`, `workspaceAccess`) se trouvent sous
`agents.defaults.sandbox`, comme pour tout backend. Consultez
[Bacs à sable](/fr/gateway/sandboxing) pour la matrice complète.

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

### OpenShell par agent avec un Gateway personnalisé

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

```bash
# Répertorier tous les environnements d’exécution de bac à sable (Docker + OpenShell)
openclaw sandbox list

# Examiner la politique effective
openclaw sandbox explain

# Recréer (supprime l’espace de travail distant et le réinitialise lors de la prochaine utilisation)
openclaw sandbox recreate --all
```

Pour le mode `remote`, la recréation est particulièrement importante : elle supprime l’espace de travail
distant de référence pour cette portée, et l’utilisation suivante en initialise un nouveau à partir de
l’environnement local. Pour le mode `mirror`, la recréation réinitialise principalement l’environnement
d’exécution distant, car l’environnement local reste la référence.

Recréez le bac à sable après toute modification de l’un des éléments suivants :

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Renforcement de la sécurité

La passerelle du système de fichiers en mode miroir fixe la racine de l’espace de travail local et revérifie
les chemins canoniques (via realpath) avant chaque lecture, écriture, création de répertoire, suppression et
renommage, en refusant les liens symboliques intermédiaires. Le remplacement d’un lien symbolique ou le remontage de l’espace de travail
ne peut pas rediriger l’accès aux fichiers en dehors de l’arborescence mise en miroir.

## Limitations actuelles

- Le navigateur du bac à sable n’est pas pris en charge par le backend OpenShell.
- `sandbox.docker.binds` ne s’applique pas à OpenShell ; la création du bac à sable échoue
  si des montages sont configurés.
- Les paramètres d’exécution propres à Docker sous `sandbox.docker.*` (à l’exception de `env`)
  s’appliquent uniquement au backend Docker.

## Fonctionnement

1. OpenClaw exécute `sandbox get` pour le nom du bac à sable (avec les éventuels
   `--gateway`/`--gateway-endpoint` configurés) ; en cas d’échec, il en crée un avec
   `sandbox create`, en transmettant `--name`, `--from`, `--policy` lorsque défini, `--gpu`
   lorsque activé, `--auto-providers`/`--no-auto-providers`, ainsi qu’un
   indicateur `--provider` par fournisseur configuré.
2. OpenClaw exécute `sandbox ssh-config` pour le nom du bac à sable afin de récupérer les
   informations de connexion SSH.
3. Le cœur écrit la configuration SSH dans un fichier temporaire et ouvre une session SSH par l’intermédiaire de
   la même passerelle vers le système de fichiers distant que le backend SSH générique.
4. En mode `mirror` : synchronisation de l’environnement local vers l’environnement distant avant l’exécution, exécution, puis resynchronisation.
5. En mode `remote` : initialisation unique lors de la création, puis opérations effectuées directement sur l’espace de travail
   distant.

## Pages connexes

- [Bacs à sable](/fr/gateway/sandboxing) - modes, portées et comparaison des backends
- [Bac à sable, politique des outils et mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) - débogage des outils bloqués
- [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) - remplacements par agent
- [CLI du bac à sable](/fr/cli/sandbox) - commandes `openclaw sandbox`
