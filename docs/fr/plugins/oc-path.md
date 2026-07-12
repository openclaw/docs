---
read_when:
    - Vous souhaitez inspecter ou modifier un seul élément terminal dans un fichier d’espace de travail depuis le terminal
    - Vous automatisez des opérations sur l’état de l’espace de travail et avez besoin d’un schéma d’adressage stable et indépendant du type.
    - Vous déterminez s’il convient d’activer le Plugin facultatif `oc-path` sur un Gateway auto-hébergé
summary: 'Plugin `oc-path` intégré : fournit la CLI `openclaw path` pour le schéma d’adressage des fichiers d’espace de travail `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-12T03:06:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

Le plugin `oc-path` intégré ajoute la CLI [`openclaw path`](/fr/cli/path) pour le
schéma d’adressage des fichiers d’espace de travail `oc://`. Il est fourni dans
le dépôt OpenClaw sous `extensions/oc-path/`, mais son activation est facultative :
l’installation et la compilation le laissent inactif tant que vous ne
l’activez pas.

Les adresses `oc://` désignent une feuille unique (ou un ensemble de feuilles
défini par un caractère générique) dans un fichier d’espace de travail. Le
plugin prend en charge quatre types de fichiers :

- **markdown** (`.md`) : frontmatter, sections, éléments, champs
- **jsonc** (`.jsonc`, `.json`) : commentaires et mise en forme préservés
- **jsonl** (`.jsonl`, `.ndjson`) : enregistrements organisés par ligne
- **yaml** (`.yaml`, `.yml`, `.lobster`) : nœuds de type mappage, séquence ou
  scalaire via l’API `Document` du paquet `yaml`

Les personnes qui auto-hébergent OpenClaw et les extensions d’éditeur utilisent
la CLI pour lire ou écrire une seule feuille sans programmer directement avec
le SDK ; les agents et les hooks l’utilisent comme substrat déterministe afin
que les allers-retours avec fidélité au niveau des octets et la protection par
sentinelle de masquage s’appliquent uniformément à tous les types. Consultez la
[référence de la CLI](/fr/cli/path) pour connaître la grammaire complète, la liste
des options de chaque commande et des exemples détaillés pour chaque type de
fichier ; cette page explique pourquoi et comment activer le plugin.

## Pourquoi l’activer

Activez `oc-path` lorsque des scripts, des hooks ou des outils locaux pour
agents doivent cibler un élément précis de l’état de l’espace de travail sans
analyseur spécifique à chaque structure de fichier. Une seule adresse `oc://`
peut désigner une clé du frontmatter Markdown, un élément de section, une
feuille de configuration JSONC, un champ d’événement JSONL ou une étape de
workflow YAML.

Cela est important pour les workflows de maintenance dans lesquels la
modification doit rester limitée, vérifiable et reproductible : inspecter une
valeur, rechercher les enregistrements correspondants, simuler une écriture,
puis appliquer uniquement cette feuille sans modifier les commentaires, les
fins de ligne ni la mise en forme environnante.

Raisons courantes de l’activer :

- **Automatisation locale** : les scripts shell résolvent ou mettent à jour une
  valeur de l’espace de travail avec `openclaw path … --json` au lieu
  d’embarquer du code d’analyse distinct pour Markdown, JSONC, JSONL et YAML.
- **Modifications visibles par les agents** : un agent affiche les différences
  d’une simulation pour une feuille ciblée avant l’écriture, ce qui est plus
  facile à vérifier qu’une réécriture libre du fichier.
- **Intégrations aux éditeurs** : un éditeur associe
  `oc://AGENTS.md/tools/gh` au nœud Markdown et au numéro de ligne exacts sans
  faire de suppositions à partir du texte du titre.
- **Diagnostic** : `emit` fait passer un fichier par un cycle complet dans
  l’analyseur et l’émetteur afin de vérifier si un type de fichier est stable
  au niveau des octets avant de recourir à des modifications automatisées.

```bash
# Le plugin GitHub est-il activé dans cette configuration ?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Quels noms d’appels d’outils figurent dans ce journal de session ?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Quels octets cette petite modification de configuration écrirait-elle ?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` n’est délibérément pas responsable de la sémantique de plus haut
niveau. Les plugins de mémoire restent responsables des écritures en mémoire,
les commandes de configuration restent responsables de la gestion complète de
la configuration et la récupération de la dernière configuration valide (LKG)
reste responsable de la restauration et de la promotion. `oc-path` constitue
la couche ciblée d’adressage et d’opérations sur fichiers avec préservation des
octets autour de laquelle ces outils de plus haut niveau peuvent être
construits.

## Où il s’exécute

Le plugin s’exécute **dans le processus de la CLI `openclaw`** sur l’hôte où
vous lancez la commande. Il ne nécessite pas de Gateway en cours d’exécution et
n’ouvre aucune connexion réseau ; chaque commande est une transformation pure
appliquée au fichier que vous indiquez.

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

`onStartup: false` exclut le plugin du chemin de démarrage du Gateway.
`commandAliases` et `activation.onCommands` indiquent à la CLI de charger le
plugin à la demande lors de la première exécution de `openclaw path …`, de
sorte que les installations qui n’utilisent jamais cette commande n’en
subissent aucun coût.

## Activation

```bash
openclaw plugins enable oc-path
```

Redémarrez le Gateway (si vous en exécutez un) afin que l’instantané du
manifeste prenne en compte le nouvel état. Les appels directs à
`openclaw path` fonctionnent immédiatement sur le même hôte ; la CLI charge le
plugin à la demande.

Pour le désactiver :

```bash
openclaw plugins disable oc-path
```

## Dépendances

Toutes les dépendances d’analyse sont propres au plugin ; l’activation de
`oc-path` n’ajoute aucun nouveau paquet à l’environnement d’exécution du cœur :

| Dépendance     | Rôle                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Définition des sous-commandes `resolve`, `find`, `set`, `validate` et `emit`. |
| `jsonc-parser` | Analyse JSONC et modification des feuilles avec conservation des commentaires et des virgules finales. |
| `markdown-it`  | Segmentation de Markdown en jetons pour le modèle de sections, d’éléments et de champs. |
| `yaml`         | Analyse, émission et modification de `Document` YAML avec conservation des commentaires et du style de flux. |

JSONL reste implémenté manuellement : l’analyse par ligne est plus simple que
n’importe quelle dépendance et l’analyse de chaque ligne passe déjà par
`jsonc-parser`.

## Fonctionnalités fournies

| Surface                            | Fourni par                                               |
| ---------------------------------- | -------------------------------------------------------- |
| CLI `openclaw path`                | `extensions/oc-path/cli-registration.ts`                 |
| Analyseur et formateur `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| Analyse, émission et modification par type | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Résolution, recherche et modification universelles | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protection par sentinelle de masquage | `extensions/oc-path/src/oc-path/sentinel.ts`           |

La CLI est actuellement la seule surface publique. Les commandes du substrat
sont privées au plugin ; les consommateurs utilisent la CLI (ou créent leur
propre plugin à partir du SDK).

## Relation avec les autres plugins

- **`memory-*`** : les écritures en mémoire passent par les plugins de mémoire,
  et non par `oc-path`. `oc-path` est un substrat de fichiers générique ; les
  plugins de mémoire y superposent leur propre sémantique.
- **LKG** : `path` ne connaît pas la restauration de la dernière configuration
  valide. Si un fichier que vous modifiez avec `path` est également suivi par
  LKG, le cycle d’observation de la configuration suivant détermine s’il faut
  le promouvoir ou le restaurer ; considérez une modification avec `path`
  comme toute autre écriture directe dans ce fichier.

## Sécurité

`set` écrit les octets bruts via le chemin d’émission du substrat, qui applique
automatiquement la protection par sentinelle de masquage. L’écriture d’une
feuille contenant `__OPENCLAW_REDACTED__` (textuellement ou comme sous-chaîne)
est refusée avec `OC_EMIT_SENTINEL`. La CLI supprime également la sentinelle
littérale de toute sortie lisible ou JSON qu’elle affiche et la remplace par
`[REDACTED]`, afin que les captures de terminal et les pipelines ne révèlent
jamais le marqueur.

## Voir aussi

- [Référence de la CLI `openclaw path`](/fr/cli/path)
- [Gérer les plugins](/fr/plugins/manage-plugins)
- [Créer des plugins](/fr/plugins/building-plugins)
