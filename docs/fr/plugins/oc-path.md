---
read_when:
    - Vous souhaitez inspecter ou modifier une seule valeur terminale dans un fichier d’espace de travail depuis le terminal
    - Vous écrivez des scripts qui interagissent avec l’état de l’espace de travail et avez besoin d’un schéma d’adressage stable, indépendant du type.
    - Vous décidez s’il faut activer le plugin facultatif `oc-path` sur un Gateway auto-hébergé
summary: 'Plugin `oc-path` intégré : fournit la CLI `openclaw path` pour le schéma d’adressage des fichiers d’espace de travail `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-12T15:40:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

Le plugin `oc-path` inclus ajoute la CLI [`openclaw path`](/fr/cli/path) pour le
schéma d’adressage de fichiers d’espace de travail `oc://`. Il est fourni dans
le dépôt OpenClaw sous `extensions/oc-path/`, mais reste facultatif :
l’installation/la compilation le laisse inactif jusqu’à ce que vous l’activiez.

Les adresses `oc://` désignent une seule feuille (ou un ensemble de feuilles
avec caractères génériques) dans un fichier d’espace de travail. Le plugin
prend en charge quatre types de fichiers :

- **markdown** (`.md`) : frontmatter, sections, éléments, champs
- **jsonc** (`.jsonc`, `.json`) : commentaires et mise en forme préservés
- **jsonl** (`.jsonl`, `.ndjson`) : enregistrements organisés par ligne
- **yaml** (`.yaml`, `.yml`, `.lobster`) : nœuds de mappage, de séquence et
  scalaires via l’API `Document` du paquet `yaml`

Les personnes qui auto-hébergent OpenClaw et les extensions d’éditeur utilisent
la CLI pour lire ou écrire une seule feuille sans créer directement de scripts
reposant sur le SDK ; les agents et les hooks l’utilisent comme substrat
déterministe, afin que les allers-retours fidèles au niveau des octets et la
protection par sentinelle de caviardage s’appliquent uniformément à tous les
types. Consultez la [référence de la CLI](/fr/cli/path) pour connaître la grammaire
complète, la liste des options de chaque verbe et des exemples détaillés pour
chaque type de fichier ; cette page explique pourquoi et comment activer le
plugin.

## Pourquoi l’activer

Activez `oc-path` lorsque des scripts, des hooks ou des outils d’agent locaux
doivent désigner une partie précise de l’état de l’espace de travail sans
analyseur sur mesure pour chaque structure de fichier. Une seule adresse
`oc://` peut désigner une clé de frontmatter Markdown, un élément de section,
une feuille de configuration JSONC, un champ d’événement JSONL ou une étape de
workflow YAML.

C’est important pour les workflows de maintenance où la modification doit
rester limitée, vérifiable et reproductible : inspectez une valeur, recherchez
les enregistrements correspondants, simulez une écriture, puis appliquez-la
uniquement à cette feuille tout en laissant intacts les commentaires, les fins
de ligne et la mise en forme environnante.

Raisons courantes de l’activer :

- **Automatisation locale** : des scripts shell résolvent ou mettent à jour une
  valeur de l’espace de travail avec `openclaw path … --json` au lieu
  d’embarquer des codes d’analyse distincts pour Markdown, JSONC, JSONL et YAML.
- **Modifications visibles par l’agent** : un agent affiche la différence d’une
  simulation pour une seule feuille adressée avant l’écriture, ce qui est plus
  facile à examiner qu’une réécriture libre du fichier.
- **Intégrations d’éditeur** : un éditeur associe
  `oc://AGENTS.md/tools/gh` au nœud Markdown et au numéro de ligne exacts sans
  effectuer d’approximation à partir du texte du titre.
- **Diagnostic** : `emit` effectue un aller-retour du fichier dans l’analyseur
  et l’émetteur, ce qui vous permet de vérifier si un type de fichier est stable
  au niveau des octets avant de recourir à des modifications automatisées.

```bash
# Le plugin GitHub est-il activé dans cette configuration ?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Quels noms d’appels d’outils figurent dans ce journal de session ?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Quels octets cette petite modification de configuration écrirait-elle ?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` n’est volontairement pas responsable des sémantiques de plus haut
niveau. Les plugins de mémoire restent responsables des écritures en mémoire,
les commandes de configuration restent responsables de la gestion complète de
la configuration, et la récupération de la dernière configuration valide
(LKG) reste responsable de la restauration/promotion. `oc-path` constitue la
couche restreinte d’adressage et d’opérations sur les fichiers avec préservation
des octets autour de laquelle ces outils de plus haut niveau peuvent être
construits.

## Où il s’exécute

Le plugin s’exécute **dans le processus de la CLI `openclaw`** sur l’hôte où
vous invoquez la commande. Il ne nécessite pas l’exécution d’un Gateway et
n’ouvre aucune socket réseau ; chaque verbe est une transformation pure d’un
fichier que vous lui indiquez.

Les métadonnées du plugin se trouvent dans
`extensions/oc-path/openclaw.plugin.json` :

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` maintient le plugin hors du chemin de démarrage du Gateway.
`commandAliases` et `activation.onCommands` indiquent à la CLI de charger le
plugin à la demande lors de la première exécution de `openclaw path …`, de
sorte que les installations qui n’utilisent jamais ce verbe ne subissent aucun
coût.

## Activation

```bash
openclaw plugins enable oc-path
```

Redémarrez le Gateway (si vous en exécutez un) afin que l’instantané du manifeste
prenne en compte le nouvel état. Les appels directs à `openclaw path`
fonctionnent immédiatement sur le même hôte ; la CLI charge le plugin à la
demande.

Pour le désactiver :

```bash
openclaw plugins disable oc-path
```

## Dépendances

Toutes les dépendances d’analyse sont propres au plugin ; l’activation de
`oc-path` n’ajoute aucun nouveau paquet au runtime principal :

| Dépendance     | Objectif                                                               |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Branchement des sous-commandes `resolve`, `find`, `set`, `validate` et `emit`. |
| `jsonc-parser` | Analyse de JSONC et modification des feuilles avec conservation des commentaires et des virgules finales. |
| `markdown-it`  | Segmentation de Markdown en jetons pour le modèle de sections, d’éléments et de champs. |
| `yaml`         | Analyse, émission et modification d’un `Document` YAML avec conservation des commentaires et du style de flux. |

JSONL reste implémenté manuellement : l’analyse ligne par ligne est plus simple
que toute dépendance, et l’analyse de chaque ligne passe déjà par
`jsonc-parser`.

## Ce qu’il fournit

| Surface                        | Fourni par                                               |
| ------------------------------ | -------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                 |
| Analyseur/formateur `oc://`    | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| Analyse/émission/modification par type | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Résolution/recherche/définition universelles | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protection par sentinelle de caviardage | `extensions/oc-path/src/oc-path/sentinel.ts`       |

La CLI est actuellement la seule surface publique. Les verbes du substrat sont
privés au plugin ; les consommateurs utilisent la CLI (ou créent leur propre
plugin avec le SDK).

## Relation avec les autres plugins

- **`memory-*`** : les écritures en mémoire passent par les plugins de mémoire,
  et non par `oc-path`. `oc-path` est un substrat de fichiers générique ; les
  plugins de mémoire y superposent leur propre sémantique.
- **LKG** : `path` ne connaît pas la restauration de la dernière configuration
  valide. Si un fichier modifié par `path` est également suivi par LKG, le
  prochain cycle d’observation de la configuration décide s’il faut le
  promouvoir ou le récupérer ; traitez une modification effectuée avec `path`
  comme toute autre écriture directe dans ce fichier.

## Sécurité

`set` écrit des octets bruts par l’intermédiaire du chemin d’émission du
substrat, qui applique automatiquement la protection par sentinelle de
caviardage. Une feuille contenant `__OPENCLAW_REDACTED__` (tel quel ou comme
sous-chaîne) est refusée lors de l’écriture avec `OC_EMIT_SENTINEL`. La CLI
supprime également la sentinelle littérale de toute sortie destinée aux
humains ou au format JSON qu’elle affiche, en la remplaçant par `[REDACTED]`,
afin que les captures de terminal et les pipelines ne divulguent jamais le
marqueur.

## Pages connexes

- [Référence de la CLI `openclaw path`](/fr/cli/path)
- [Gérer les plugins](/fr/plugins/manage-plugins)
- [Créer des plugins](/fr/plugins/building-plugins)
