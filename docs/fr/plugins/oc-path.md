---
read_when:
    - Vous voulez inspecter ou modifier une seule feuille dans un fichier de l’espace de travail depuis le terminal
    - Vous écrivez des scripts qui s’appuient sur l’état de l’espace de travail et avez besoin d’un schéma d’adressage stable et indépendant du type.
    - Vous décidez d’activer ou non le Plugin facultatif `oc-path` sur un Gateway auto-hébergé
summary: 'Plugin intégré `oc-path` : fournit la CLI `openclaw path` pour le schéma d’adressage des fichiers d’espace de travail `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-06-27T17:50:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

Le plugin `oc-path` intégré ajoute la CLI [`openclaw path`](/fr/cli/path) pour le
schéma d’adressage des fichiers d’espace de travail `oc://`. Il est livré dans le dépôt OpenClaw sous
`extensions/oc-path/`, mais il est facultatif — l’installation/la compilation le laisse inactif jusqu’à ce que vous
l’activiez.

Les adresses `oc://` pointent vers une seule feuille (ou un ensemble de feuilles avec caractère générique) dans
un fichier d’espace de travail. Le plugin comprend aujourd’hui quatre types de fichiers :

- **markdown** (`.md`, `.mdx`) : frontmatter, sections, éléments, champs
- **jsonc** (`.jsonc`, `.json5`, `.json`) : commentaires et mise en forme préservés
- **jsonl** (`.jsonl`, `.ndjson`) : enregistrements orientés lignes
- **yaml** (`.yaml`, `.yml`, `.lobster`) : nœuds de carte/séquence/scalaire via l’API de document
  YAML

Les auto-hébergeurs et les extensions d’éditeur utilisent la CLI pour lire ou écrire une seule feuille
sans scripter directement contre le SDK ; les agents et les hooks la traitent comme un
substrat déterministe, afin que les allers-retours fidèles octet pour octet et la protection par
sentinelle de caviardage s’appliquent uniformément à tous les types.

## Pourquoi l’activer

Activez `oc-path` lorsque vous voulez que des scripts, des hooks ou des outils d’agent locaux pointent
vers un élément précis de l’état de l’espace de travail sans inventer un analyseur pour chaque forme
de fichier. Une seule adresse `oc://` peut nommer une clé de frontmatter Markdown, un élément de section,
une feuille de configuration JSONC, un champ d’événement JSONL ou une étape de workflow YAML.

C’est important pour les workflows de mainteneur où la modification doit être petite,
auditable et répétable : inspecter une valeur, trouver les enregistrements correspondants, faire un essai à blanc
d’une écriture, puis appliquer uniquement cette feuille tout en laissant les commentaires, les fins de ligne et
la mise en forme voisine inchangés. Le conserver comme plugin facultatif donne aux utilisateurs avancés le
substrat d’adressage sans ajouter de dépendances d’analyseur ni de surface CLI au
cœur pour les installations qui n’en ont jamais besoin.

Raisons courantes de l’activer :

- **Automatisation locale** : les scripts shell peuvent résoudre ou mettre à jour une valeur d’espace de travail
  avec `openclaw path … --json` au lieu d’embarquer du code d’analyse distinct pour Markdown, JSONC,
  JSONL et YAML.
- **Modifications visibles par l’agent** : un agent peut afficher un diff d’essai à blanc pour une feuille
  adressée avant l’écriture, ce qui est plus facile à relire qu’une réécriture de fichier libre.
- **Intégrations d’éditeur** : un éditeur peut mapper `oc://AGENTS.md/tools/gh` vers le
  nœud Markdown exact et le numéro de ligne sans deviner à partir du texte de titre.
- **Diagnostics** : `emit` fait passer un fichier par l’analyseur et l’émetteur en aller-retour, afin que
  vous puissiez vérifier si un type de fichier est stable octet pour octet avant de vous appuyer sur des
  modifications automatisées.

Exemples concrets :

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Le plugin n’est volontairement pas propriétaire des sémantiques de plus haut niveau. Les plugins de
mémoire restent propriétaires des écritures de mémoire, les commandes de configuration restent propriétaires de la gestion
complète de la configuration, et la logique LKG reste propriétaire de la restauration/promotion. `oc-path` est la couche étroite
d’adressage et d’opérations de fichier préservant les octets autour de laquelle ces outils de plus haut niveau
peuvent construire.

## Où il s’exécute

Le plugin s’exécute **dans le processus de la CLI `openclaw`** sur l’hôte où vous
invoquez la commande. Il n’a pas besoin d’un Gateway en cours d’exécution et n’ouvre aucun
socket réseau — chaque verbe est une transformation pure sur un fichier que vous indiquez.

Les métadonnées du plugin se trouvent dans `extensions/oc-path/openclaw.plugin.json` :

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

`onStartup: false` garde le plugin hors du chemin critique du Gateway. `onCommands:
["path"]` indique à la CLI de charger le plugin paresseusement la première fois que vous exécutez
`openclaw path …`, afin que les installations qui n’utilisent jamais le verbe n’aient aucun coût.

## Activer

```bash
openclaw plugins enable oc-path
```

Redémarrez le Gateway (si vous en exécutez un) afin que l’instantané du manifeste prenne en compte le nouvel
état. Les invocations simples de `openclaw path` fonctionnent immédiatement sur le même hôte —
la CLI charge le plugin à la demande.

Désactivez avec :

```bash
openclaw plugins disable oc-path
```

## Dépendances

Toutes les dépendances d’analyseur sont locales au plugin — l’activation de `oc-path` n’ajoute pas
de nouveaux paquets au runtime cœur :

| Dépendance     | Objectif                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Câblage des sous-commandes pour `resolve`, `find`, `set`, `validate`, `emit`.    |
| `jsonc-parser` | Analyse JSONC + modifications de feuilles avec conservation des commentaires et virgules finales.       |
| `markdown-it`  | Segmentation Markdown en jetons pour le modèle section / élément / champ.            |
| `yaml`         | Analyse / émission / modification de `Document` YAML avec conservation des commentaires et du style flow. |

JSONL reste implémenté à la main — l’analyse orientée lignes est plus simple que toute
dépendance, et l’analyse JSONC ligne par ligne passe déjà par `jsonc-parser`.

## Ce qu’il fournit

| Surface                        | Fourni par                                             |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Analyseur / formateur `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Analyse / émission / modification par type   | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| Résolution / recherche / définition universelles | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protection par sentinelle de caviardage       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

La CLI est aujourd’hui la seule surface publique. Les verbes du substrat sont privés au
plugin ; les consommateurs utilisent la CLI (ou construisent leur propre plugin contre le SDK).

## Relation avec les autres plugins

- **`memory-*`** : les écritures de mémoire passent par les plugins de mémoire, pas par `oc-path`.
  `oc-path` est un substrat de fichier générique ; les plugins de mémoire ajoutent leurs propres
  sémantiques par-dessus.
- **LKG** : `path` ne connaît pas la restauration de configuration Last-Known-Good. Si un
  fichier est suivi par LKG, le prochain appel `observe` décide s’il faut promouvoir ou
  récupérer ; `set --batch` pour un multi-set atomique via le cycle de vie promotion/récupération LKG
  est prévu avec le substrat de récupération LKG.

## Sécurité

`set` écrit des octets bruts via le chemin d’émission du substrat, qui applique automatiquement la
protection par sentinelle de caviardage. Une feuille contenant
`__OPENCLAW_REDACTED__` (verbatim ou comme sous-chaîne) est refusée au moment de l’écriture
avec `OC_EMIT_SENTINEL`. La CLI nettoie aussi la sentinelle littérale de toute
sortie humaine ou JSON qu’elle imprime, en la remplaçant par `[REDACTED]` afin que les captures
de terminal et les pipelines ne divulguent jamais le marqueur.

## Connexe

- [Référence de la CLI `openclaw path`](/fr/cli/path)
- [Gérer les plugins](/fr/plugins/manage-plugins)
- [Créer des plugins](/fr/plugins/building-plugins)
