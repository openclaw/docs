---
read_when:
    - Vous souhaitez des environnements isolés gérés dans le cloud plutôt que Docker en local
    - Vous configurez le plugin OpenShell
    - Vous devez choisir entre les modes espace de travail miroir et distant.
summary: Utiliser OpenShell comme moteur de bac à sable géré pour les agents OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T02:39:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell est un backend géré pour les environnements isolés : au lieu d’exécuter
des conteneurs Docker localement, OpenClaw délègue le cycle de vie des environnements
isolés à la CLI `openshell`, qui provisionne des environnements distants et exécute
des commandes via SSH.

Le Plugin réutilise le même transport SSH et la même passerelle de système de fichiers
distant que le [backend SSH générique](/fr/gateway/sandboxing#ssh-backend), et ajoute
le cycle de vie OpenShell (`sandbox create/get/delete/ssh-config`) ainsi qu’un mode
facultatif de synchronisation de l’espace de travail `mirror`.

## Prérequis

- Plugin OpenShell installé (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` disponible dans `PATH` (ou chemin personnalisé via
  `plugins.entries.openshell.config.command`)
- Un compte OpenShell avec accès aux environnements isolés
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

Redémarrez le Gateway. Au tour d’agent suivant, OpenClaw crée un environnement
isolé OpenShell et y achemine l’exécution des outils. Vérifiez avec :

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modes de l’espace de travail

Il s’agit de la décision la plus importante concernant OpenShell.

### mirror (par défaut)

`plugins.entries.openshell.config.mode: "mirror"` maintient **l’espace de travail
local comme référence canonique** :

- Avant `exec`, OpenClaw synchronise l’espace de travail local vers l’environnement isolé.
- Après `exec`, OpenClaw resynchronise l’espace de travail distant vers l’environnement local.
- Les outils de fichiers passent par la passerelle de l’environnement isolé, mais l’environnement
  local reste la source de vérité entre les tours.

Ce mode convient particulièrement aux flux de développement : les modifications locales effectuées
en dehors d’OpenClaw apparaissent lors de l’exécution suivante, et le comportement de l’environnement
isolé reste proche de celui du backend Docker.

Compromis : coût de téléversement et de téléchargement à chaque tour d’exécution.

### remote

`mode: "remote"` fait de **l’espace de travail OpenShell la référence canonique** :

- Lors de la création initiale de l’environnement isolé, OpenClaw initialise une seule
  fois l’espace de travail distant à partir de l’environnement local.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` agissent directement
  sur l’espace de travail distant. OpenClaw ne resynchronise **pas** les modifications
  distantes vers l’environnement local.
- La lecture des médias lors de la génération du prompt reste fonctionnelle (les outils
  de fichiers et de médias lisent les données par l’intermédiaire de la passerelle de
  l’environnement isolé).

Ce mode convient particulièrement aux agents de longue durée et à la CI : il réduit
le surcoût par tour et empêche les modifications locales sur l’hôte d’écraser
silencieusement l’état distant.

<Warning>
Les modifications apportées aux fichiers sur l’hôte en dehors d’OpenClaw après l’initialisation ne sont pas visibles dans l’environnement isolé distant. Exécutez `openclaw sandbox recreate` pour le réinitialiser.
</Warning>

### Choisir un mode

|                                   | `mirror`                                      | `remote`                              |
| --------------------------------- | --------------------------------------------- | ------------------------------------- |
| **Espace de travail canonique**   | Hôte local                                    | OpenShell distant                     |
| **Sens de synchronisation**       | Bidirectionnel (à chaque exécution)           | Initialisation unique                 |
| **Surcoût par tour**              | Plus élevé (téléversement + téléchargement)   | Plus faible (opérations distantes directes) |
| **Modifications locales visibles ?** | Oui, à l’exécution suivante                 | Non, jusqu’à la recréation            |
| **Idéal pour**                    | Flux de développement                         | Agents de longue durée, CI            |

## Référence de configuration

Toute la configuration OpenShell se trouve sous `plugins.entries.openshell.config` :

| Clé                       | Type                     | Valeur par défaut | Description                                                                                           |
| ------------------------- | ------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`        | Mode de synchronisation de l’espace de travail                                                        |
| `command`                 | `string`                 | `"openshell"`     | Chemin ou nom de la CLI `openshell`                                                                   |
| `from`                    | `string`                 | `"openclaw"`      | Source de l’environnement isolé lors de sa première création                                          |
| `gateway`                 | `string`                 | non défini        | Nom du Gateway OpenShell (`--gateway` au niveau supérieur)                                            |
| `gatewayEndpoint`         | `string`                 | non défini        | Point de terminaison du Gateway OpenShell (`--gateway-endpoint` au niveau supérieur)                  |
| `policy`                  | `string`                 | non défini        | Identifiant de stratégie OpenShell pour la création de l’environnement isolé                          |
| `providers`               | `string[]`               | `[]`              | Noms des fournisseurs associés à la création de l’environnement isolé (dédupliqués, une option `--provider` par entrée) |
| `gpu`                     | `boolean`                | `false`           | Demander des ressources GPU (`--gpu`)                                                                 |
| `autoProviders`           | `boolean`                | `true`            | Transmettre `--auto-providers` (ou `--no-auto-providers` si la valeur est fausse) lors de la création |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`      | Espace de travail principal accessible en écriture dans l’environnement isolé                         |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`        | Chemin de montage de l’espace de travail de l’agent (lecture seule lorsque l’accès n’est pas `rw`)    |
| `timeoutSeconds`          | `number`                 | `120`             | Délai d’expiration des opérations de la CLI `openshell`                                                |

`remoteWorkspaceDir` et `remoteAgentWorkspaceDir` doivent être des chemins absolus
situés sous les racines gérées `/sandbox` ou `/agent` ; les autres chemins absolus
sont refusés.

Les paramètres au niveau de l’environnement isolé (`mode`, `scope`, `workspaceAccess`)
se trouvent sous `agents.defaults.sandbox`, comme pour tout autre backend. Consultez
[Environnements isolés](/fr/gateway/sandboxing) pour connaître la matrice complète.

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
# Répertorier tous les environnements d’exécution isolés (Docker + OpenShell)
openclaw sandbox list

# Examiner la stratégie effective
openclaw sandbox explain

# Recréer (supprime l’espace de travail distant, réinitialisé lors de la prochaine utilisation)
openclaw sandbox recreate --all
```

Pour le mode `remote`, la recréation est particulièrement importante : elle supprime
l’espace de travail distant canonique pour cette portée, puis l’utilisation suivante
en initialise un nouveau à partir de l’environnement local. Pour le mode `mirror`,
la recréation réinitialise principalement l’environnement d’exécution distant puisque
l’environnement local reste canonique.

Recréez l’environnement après toute modification de l’un des paramètres suivants :

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Renforcement de la sécurité

La passerelle de système de fichiers du mode miroir verrouille la racine de l’espace
de travail local et revérifie les chemins canoniques (via realpath) avant chaque
lecture, écriture, création de répertoire, suppression et renommage, tout en refusant
les liens symboliques intermédiaires. Le remplacement d’un lien symbolique ou le
remontage de l’espace de travail ne peut pas rediriger l’accès aux fichiers en dehors
de l’arborescence mise en miroir.

## Limitations actuelles

- Le navigateur de l’environnement isolé n’est pas pris en charge par le backend OpenShell.
- `sandbox.docker.binds` ne s’applique pas à OpenShell ; la création de l’environnement
  isolé échoue si des montages sont configurés.
- Les paramètres d’exécution propres à Docker sous `sandbox.docker.*` (à l’exception
  de `env`) s’appliquent uniquement au backend Docker.

## Fonctionnement

1. OpenClaw exécute `sandbox get` pour le nom de l’environnement isolé (avec les
   options `--gateway`/`--gateway-endpoint` configurées) ; en cas d’échec, il en
   crée un avec `sandbox create`, en transmettant `--name`, `--from`, `--policy`
   lorsqu’elle est définie, `--gpu` lorsqu’il est activé,
   `--auto-providers`/`--no-auto-providers`, ainsi qu’une option `--provider`
   pour chaque fournisseur configuré.
2. OpenClaw exécute `sandbox ssh-config` pour le nom de l’environnement isolé afin
   de récupérer les informations de connexion SSH.
3. Le cœur écrit la configuration SSH dans un fichier temporaire et ouvre une session
   SSH via la même passerelle de système de fichiers distant que le backend SSH générique.
4. En mode `mirror` : synchronisation locale vers distante avant l’exécution,
   exécution, puis resynchronisation vers l’environnement local.
5. En mode `remote` : initialisation unique lors de la création, puis opérations
   directes sur l’espace de travail distant.

## Voir aussi

- [Environnements isolés](/fr/gateway/sandboxing) - modes, portées et comparaison des backends
- [Environnement isolé, stratégie des outils et mode privilégié](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) - diagnostic des outils bloqués
- [Environnements isolés et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) - remplacements par agent
- [CLI des environnements isolés](/fr/cli/sandbox) - commandes `openclaw sandbox`
