---
read_when:
    - Vous souhaitez lire ou écrire une feuille dans un fichier de l’espace de travail depuis le terminal
    - Vous écrivez des scripts qui interagissent avec l’état de l’espace de travail et souhaitez un schéma d’adressage stable, indépendant du type.
    - Vous déboguez un chemin `oc://` (validez la syntaxe et vérifiez vers quoi il est résolu)
summary: Référence de la CLI pour `openclaw path` (inspecter et modifier les fichiers de l’espace de travail via le schéma d’adressage `oc://`)
title: Chemin
x-i18n:
    generated_at: "2026-07-12T15:12:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Accès depuis le shell au schéma d’adressage `oc://` : une syntaxe de chemin unique, répartie selon le type,
permettant d’inspecter et de modifier les fichiers adressables de l’espace de travail (markdown, jsonc,
jsonl, yaml/yml/lobster). Les personnes qui auto-hébergent, les auteurs de plugins et les extensions d’éditeur
l’utilisent pour lire, rechercher ou mettre à jour un emplacement précis sans avoir à créer manuellement un
analyseur pour chaque type de fichier.

`path` est fourni par le plugin facultatif intégré `oc-path`. Activez-le avant
la première utilisation :

```bash
openclaw plugins enable oc-path
```

Les verbes de la CLI reflètent le modèle d’adressage :

- `resolve` est concret et ne renvoie qu’une seule correspondance.
- `find` est le verbe de recherche multicorrespondance pour les caractères génériques, les unions, les prédicats et
  l’expansion positionnelle.
- `set` n’accepte que les chemins concrets ou les marqueurs d’insertion ; les motifs avec caractères génériques
  sont rejetés avant toute écriture.
- `validate` analyse un chemin sans accéder au système de fichiers.
- `emit` effectue un aller-retour analyse + émission sur un fichier (diagnostic de fidélité octet par octet).

## Pourquoi l’utiliser

L’état d’OpenClaw est réparti entre des fichiers markdown modifiés manuellement, une
configuration JSONC commentée, des journaux JSONL en ajout uniquement et des fichiers YAML de workflow ou de spécification. Les scripts, hooks
et agents ont souvent besoin d’une seule petite valeur provenant de ces fichiers : une clé de frontmatter, un
paramètre de plugin, un champ d’enregistrement de journal, une étape YAML ou un élément de liste sous une
section nommée.

`openclaw path` fournit à ces appelants une adresse stable plutôt qu’un grep, une expression régulière ou un analyseur ponctuel
pour chaque type de fichier. Le même chemin `oc://` peut être validé,
résolu, recherché, simulé et écrit depuis le terminal, ce qui rend les automatisations ciblées
faciles à examiner et à rejouer. Le reste du fichier est préservé : l’écriture d’une seule feuille
ne modifie donc pas ses commentaires, ses fins de ligne ni la mise en forme
environnante.

Utilisez-le lorsque l’élément recherché possède une adresse logique, mais que la structure du fichier
varie :

- Un hook lit un paramètre dans un fichier JSONC commenté sans perdre les commentaires lorsqu’il
  réécrit la valeur.
- Un script de maintenance recherche tous les champs d’événement correspondants dans un journal JSONL
  sans charger l’intégralité du journal dans un analyseur personnalisé.
- Un éditeur accède à une section markdown ou à un élément de liste au moyen de son slug, puis affiche
  la ligne exacte qui a été résolue.
- Un agent simule une petite modification de l’espace de travail avant de l’appliquer, avec les
  octets modifiés visibles lors de la révision.

N’utilisez pas `openclaw path` pour les modifications ordinaires de fichiers entiers, les migrations de configuration complexes ou
les écritures propres à la mémoire ; celles-ci doivent utiliser la commande ou le plugin propriétaire. `path`
est destiné aux petites opérations adressables sur des fichiers, lorsqu’une commande de terminal reproductible
est préférable à un nouvel analyseur sur mesure.

## Utilisation

Lire une valeur dans un fichier de configuration modifié manuellement :

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Prévisualiser une écriture sans modifier le disque :

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Rechercher les enregistrements correspondants dans un journal JSONL en ajout uniquement :

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adresser une instruction dans un fichier markdown par section et par élément plutôt que par numéro de
ligne :

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valider un chemin dans la CI ou dans un script de vérification préalable avant que celui-ci effectue une lecture ou une
écriture :

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Ces commandes sont conçues pour être copiées dans des scripts shell. Utilisez `--json` lorsqu’un
appelant a besoin d’une sortie structurée, et `--human` lorsqu’une personne inspecte
le résultat.

## Fonctionnement

1. Analyse l’adresse `oc://` en emplacements : fichier, section, élément, champ et une
   requête de session facultative.
2. Choisit l’adaptateur correspondant au type de fichier selon l’extension cible (`.md`, `.jsonc`,
   `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Résout les emplacements en fonction de la structure propre à ce type de fichier : titres et
   éléments markdown, clés d’objet et index de tableau JSONC, enregistrements de ligne JSONL ou
   nœuds de mappage et de séquence YAML.
4. Pour `set`, émet les octets modifiés à l’aide du même adaptateur afin que les parties non modifiées
   du fichier conservent leurs commentaires, leurs fins de ligne et leur mise en forme environnante lorsque
   le type le permet.

`resolve` et `set` nécessitent une cible concrète unique. `find` est le
verbe d’exploration : il développe les caractères génériques, les unions, les prédicats et les ordinaux en
correspondances concrètes que vous pouvez inspecter avant d’en choisir une à modifier.

## Sous-commandes

| Sous-commande            | Objectif                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `resolve <oc-path>`      | Afficher la correspondance concrète du chemin (ou « introuvable »).                            |
| `find <pattern>`         | Énumérer les correspondances d’un chemin avec caractère générique, union ou prédicat.          |
| `set <oc-path> <value>`  | Écrire une feuille ou une cible d’insertion à un chemin concret. Prend en charge `--dry-run`.   |
| `validate <oc-path>`     | Analyse uniquement ; afficher la décomposition structurelle (fichier / section / élément / champ). |
| `emit <file>`            | Effectuer un aller-retour analyse + émission sur un fichier (diagnostic de fidélité octet par octet). |

## Options globales

| Option          | S’applique à                      | Objectif                                                                                         |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit`  | Résoudre l’emplacement de fichier par rapport à ce répertoire (valeur par défaut : `process.cwd()`). |
| `--file <path>` | `resolve`, `find`, `set`, `emit`  | Remplacer le chemin résolu de l’emplacement de fichier (accès absolu).                            |
| `--json`        | toutes                            | Forcer la sortie JSON (par défaut lorsque stdout n’est pas un TTY).                              |
| `--human`       | toutes                            | Forcer la sortie lisible par une personne (par défaut lorsque stdout est un TTY).                |
| `--value-json`  | `set`                             | Analyser `<value>` comme du JSON pour remplacer une feuille JSON/JSONC/JSONL.                    |
| `--dry-run`     | `set`                             | Afficher les octets qui seraient écrits sans effectuer l’écriture.                              |
| `--diff`        | `set` (nécessite `--dry-run`)     | Afficher un diff unifié au lieu de l’intégralité des octets.                                     |

`validate` n’accepte que `--json` / `--human` ; il n’accède pas au système de fichiers, donc
`--cwd` et `--file` ne s’appliquent pas.

## Syntaxe `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Règles des emplacements : `field` nécessite `item`, et `item` nécessite `section`. Pour
les quatre emplacements :

- **Segments entre guillemets** — `"a/b.c"` conserve les séparateurs `/` et `.`. Le contenu est
  littéral au niveau des octets ; `"` et `\` ne sont pas autorisés entre les guillemets. L’emplacement de fichier
  tient également compte des guillemets : `oc://"skills/email-drafter"/Tools/$last` considère
  `skills/email-drafter` comme un seul chemin de fichier.
- **Prédicats** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`.
  Les opérateurs numériques exigent que les deux côtés puissent être convertis en nombres finis.
- **Unions** — `{a,b,c}` correspond à n’importe laquelle des alternatives.
- **Caractères génériques** — `*` (un seul sous-segment) et `**` (zéro ou plusieurs,
  de façon récursive). `find` les accepte ; `resolve` et `set` les rejettent comme
  ambigus.
- **Positionnels** — `$first` / `$last` désignent le premier / dernier index ou la première /
  dernière clé déclarée.
- **Ordinal** — `#N` pour la Nième correspondance selon l’ordre du document.
- **Marqueurs d’insertion** — `+`, `+key`, `+nnn` pour une insertion par clé / index
  (à utiliser avec `set`).
- **Portée de session** — `?session=cron-daily`, etc. Indépendante de l’imbrication des emplacements.
  Les valeurs de session sont brutes et ne sont pas décodées en pourcentage ; elles ne peuvent pas contenir de caractères de
  contrôle ni de délimiteurs de requête réservés (`?`, `&`, `%`).

Les caractères réservés (`?`, `&`, `%`) situés hors des segments entre guillemets, des prédicats ou des unions
sont rejetés. Les caractères de contrôle (U+0000-U+001F, U+007F) sont
rejetés partout, y compris dans la valeur de requête `session`.

`formatOcPath(parseOcPath(path)) === path` est garanti pour les chemins canoniques.
Les paramètres de requête non canoniques sont ignorés, à l’exception de la première valeur
`session=` non vide.

Limites strictes : un chemin est limité à 4096 octets, à 4 emplacements au maximum (fichier/section/élément/
champ), à 64 sous-segments séparés par des points au maximum par emplacement et à 256 niveaux
d’imbrication au maximum pour les chemins JSON profonds. Par ailleurs, toute entrée de fichier JSONC/JSON
dépassant 16 MiB est refusée avec un diagnostic d’analyse au lieu d’être analysée,
pour tout verbe qui charge ce fichier.

## Adressage selon le type de fichier

| Type          | Extensions de fichier          | Modèle d’adressage                                                                                         |
| ------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                          | Sections H2 par slug, éléments de liste par slug ou `#N`, frontmatter via `[frontmatter]`.                 |
| JSONC/JSON    | `.jsonc`, `.json`              | Clés d’objet et index de tableau ; les points divisent les sous-segments imbriqués sauf s’ils sont entre guillemets. |
| JSONL         | `.jsonl`, `.ndjson`            | Adresses de ligne de premier niveau (`L1`, `L2`, `$first`, `$last`), puis parcours de style JSONC dans la ligne. |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`    | Clés de mappage et index de séquence ; les commentaires et le style de flux sont gérés par l’API de document YAML. |

`resolve` renvoie une correspondance structurée : `root`, `node`, `leaf` ou
`insertion-point`, avec un numéro de ligne commençant à 1. Les valeurs de feuille sont exposées sous forme de
texte accompagné d’un `leafType`, afin que les auteurs de plugins puissent afficher des aperçus sans
dépendre de la structure AST propre à chaque type.

## Contrat de mutation

`set` écrit une cible concrète unique :

- Les valeurs de frontmatter markdown et les champs d’élément `- key: value` sont des feuilles
  de chaîne. Les insertions markdown ajoutent des sections, des clés de frontmatter ou des éléments de
  section, puis produisent une structure markdown canonique pour le fichier modifié. Les corps de
  section ne peuvent pas être écrits dans leur ensemble via `set`.
- Les écritures de feuilles JSONC convertissent la valeur de chaîne vers le type de feuille existant
  (`string`, `number` fini, `true`/`false` ou `null`). Utilisez `--value-json`
  lorsqu’un remplacement de feuille JSONC/JSON/JSONL doit analyser `<value>` comme du JSON et
  peut en modifier la structure, par exemple pour remplacer une notation abrégée de référence de secret sous forme de chaîne par un
  objet. Les insertions dans des objets et tableaux JSONC analysent `<value>` comme du JSON et utilisent
  le chemin de modification de `jsonc-parser` pour les écritures ordinaires de feuilles, en préservant les commentaires
  et la mise en forme environnante.
- Les écritures de feuilles JSONL effectuent les mêmes conversions que JSONC à l’intérieur d’une ligne. Le remplacement
  d’une ligne entière et l’ajout analysent `<value>` comme du JSON. Le JSONL produit conserve la convention
  dominante de fin de ligne LF/CRLF du fichier (vote majoritaire parmi les sauts de ligne du fichier,
  de sorte qu’un fichier principalement en CRLF reste en CRLF même s’il contient quelques LF isolés).
- Les écritures de feuilles YAML convertissent la valeur vers le type scalaire existant (`string`, `number`
  fini, `true`/`false` ou `null`). Les insertions YAML utilisent l’API de document du paquet
  `yaml` intégré pour mettre à jour les mappages et les séquences. Les documents YAML mal formés
  comportant des erreurs d’analyse sont refusés avant la mutation avec
  `parse-error`.

Utilisez `--dry-run` avant les écritures visibles par l’utilisateur lorsque les octets exacts sont importants. Les modifications JSONC
et YAML appliquent un correctif au document existant (via `jsonc-parser` ou l’API de document `yaml`),
de sorte que les octets non modifiés sont généralement préservés ; markdown reconstruit le fichier
à partir de sa structure analysée lors de toute modification, ce qui peut normaliser une mise en forme incidente
en dehors de la feuille modifiée. Ajoutez `--diff` pour obtenir l’aperçu sous forme de correctif ciblé
avant/après plutôt que sous la forme du fichier rendu complet.

## Exemples

```bash
# Valider un chemin (aucun accès au système de fichiers)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Lire une feuille
openclaw path resolve 'oc://gateway.jsonc/version'

# Recherche avec caractères génériques
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Simuler une écriture
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Simuler une écriture sous forme de diff unifié
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Appliquer l’écriture
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Aller-retour avec fidélité octet par octet (diagnostic)
openclaw path emit ./AGENTS.md
```

Autres exemples de grammaire :

```bash
# Mettre entre guillemets les clés contenant / ou .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Les chemins JSON/JSONC profonds peuvent utiliser des segments séparés par des barres obliques ; ils sont normalisés en sous-segments séparés par des points
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Remplacer une feuille JSONC par un objet analysé
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Recherche par prédicat parmi les enfants JSONC
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insérer dans un tableau JSONC
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insérer une clé d’objet JSONC
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Ajouter un événement JSONL
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Résoudre la dernière ligne de valeur JSONL
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Résoudre une étape de workflow YAML
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Mettre à jour une valeur scalaire YAML
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Adresser le frontmatter Markdown
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insérer du frontmatter Markdown
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Instructions de l’agent' --dry-run

# Rechercher les champs d’éléments Markdown
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Valider un chemin limité à une session
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Recettes par type de fichier

Les cinq mêmes verbes fonctionnent pour tous les types ; le schéma d’adressage sélectionne
le traitement selon l’extension du fichier.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: agent de rédaction d’e-mails
tier: core
---
## Outils
- gh: CLI GitHub
- curl: client HTTP
- send_email: activé
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
feuille @ L4 : "core" (chaîne)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
feuille @ L9 : "CLI GitHub" (chaîne)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 correspondances pour oc://x.md/tools/* :
  oc://x.md/tools/gh           →  nœud @ L9 [md-item]
  oc://x.md/tools/curl         →  nœud @ L10 [md-item]
  oc://x.md/tools/send-email   →  nœud @ L11 [md-item]
```

Le prédicat `[frontmatter]` adresse le bloc de frontmatter YAML ; `tools`
correspond au titre `## Tools` par son slug, et les feuilles des éléments conservent leur forme de slug
même lorsque la source utilise des traits de soulignement (`send_email` devient `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
feuille @ L4 : "true" (booléen)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run : écrirait 142 octets dans /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Les modifications JSONC passent par `jsonc-parser`, de sorte que les commentaires et les espaces sont conservés lors d’une
opération `set`. Exécutez d’abord la commande avec `--dry-run` pour inspecter les octets avant de valider.
Les fichiers `.json` utilisent le même adaptateur et le même chemin de modification que les fichiers `.jsonc`.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 correspondance pour oc://session.jsonl/[event=action]/userId :
  oc://session.jsonl/L2/userId  →  feuille @ L2 : "u1" (chaîne)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
feuille @ L2 : "2" (nombre)
```

Chaque ligne est un enregistrement. Adressez-la par prédicat (`[event=action]`) lorsque vous ne
connaissez pas le numéro de ligne, ou par le segment canonique `LN` lorsque vous le connaissez.
Les fichiers `.ndjson` utilisent le même adaptateur que les fichiers `.jsonl`.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
feuille @ L3 : "fetch" (chaîne)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run : écrirait 99 octets dans /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML utilise l’API `Document` du paquet `yaml` plutôt qu’un analyseur
développé manuellement. Ainsi, les cycles ordinaires d’analyse et d’émission préservent les commentaires et la
structure de rédaction, tandis que les chemins résolus utilisent le même modèle de clé de table / indice de séquence que
JSONC. Le même adaptateur prend en charge les fichiers `.yaml`, `.yml` et `.lobster`.

## Référence des sous-commandes

### `resolve <oc-path>`

Lit une feuille ou un nœud unique. Les caractères génériques sont refusés — utilisez `find` dans ce cas.
Renvoie le code `0` en cas de correspondance, `1` en cas d’absence normale de correspondance, et `2` en cas d’erreur d’analyse ou de
motif refusé.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Énumère toutes les correspondances d’un motif contenant un caractère générique, un prédicat ou une union. Renvoie le code `0`
s’il existe au moins une correspondance, et `1` s’il n’y en a aucune. Les caractères génériques dans l’emplacement du fichier sont refusés avec
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — fournissez un fichier précis (la prise en charge des motifs glob sur plusieurs fichiers
sera ajoutée ultérieurement).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Écrit une feuille. Associez cette commande à `--dry-run` pour prévisualiser les octets qui seraient
écrits sans modifier le fichier. Ajoutez `--diff` pour afficher un aperçu unifié des différences.
Renvoie le code `0` lorsque l’écriture réussit, `1` si le substrat la refuse (par exemple, lorsqu’une
protection par sentinelle est déclenchée), et `2` en cas d’erreur d’analyse.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Le marqueur d’insertion `+key` crée l’enfant nommé s’il n’existe pas déjà ;
`+nnn` et `+` seul servent respectivement à l’insertion par indice et à l’ajout en fin de liste.

### `validate <oc-path>`

Vérification par analyse uniquement. Aucun accès au système de fichiers. Utile pour vérifier qu’un
chemin de modèle est correctement formé avant de substituer des variables, ou pour obtenir
sa décomposition structurelle à des fins de débogage :

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valide : oc://AGENTS.md/tools/gh
  fichier :  AGENTS.md
  section :  tools
  élément :  gh
```

Renvoie le code `0` lorsque le chemin est valide, `1` lorsqu’il est invalide (avec un `code` et un
`message` structurés), et `2` en cas d’erreur d’argument.

### `emit <file>`

Fait passer un fichier par un cycle complet dans l’analyseur et l’émetteur propres à son type. La sortie doit
être identique à l’entrée au niveau des octets pour un fichier valide ; toute divergence indique un
bogue de l’analyseur ou le déclenchement d’une sentinelle. Utile pour déboguer le comportement du substrat sur
des entrées réelles.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Codes de sortie

| Code | Signification                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Réussite. (`resolve` / `find` : au moins une correspondance. `set` : écriture réussie.) |
| `1`  | Aucune correspondance, ou `set` refusé par le substrat (aucune erreur au niveau du système).      |
| `2`  | Erreur d’argument ou d’analyse.                                                   |

## Mode de sortie

`openclaw path` détecte le TTY : sortie lisible par un humain dans un terminal, JSON lorsque
la sortie standard est transmise par tube ou redirigée. `--json` et `--human` remplacent
la détection automatique.

## Remarques

- `set` écrit les octets via le chemin d’émission du substrat, qui applique automatiquement
  la protection par sentinelle de masquage. L’écriture d’une feuille contenant
  `__OPENCLAW_REDACTED__` (littéralement ou comme sous-chaîne) est refusée.
- L’analyse JSONC et les modifications de feuilles utilisent la dépendance `jsonc-parser`
  locale au Plugin, de sorte que les commentaires et la mise en forme sont préservés lors des écritures ordinaires de feuilles,
  au lieu de passer par un chemin d’analyse et de nouveau rendu développé manuellement.
- `path` ne connaît pas le suivi ni la récupération de la dernière configuration valide (LKG) ;
  ce cycle de vie est géré ailleurs. Si un fichier que vous modifiez avec `path` est
  également suivi par le mécanisme LKG, la prochaine lecture de la configuration détermine s’il doit être promu ou
  restauré ; traitez une modification effectuée avec `path` comme toute autre écriture directe dans
  ce fichier.

## Voir aussi

- [Référence de la CLI](/fr/cli)
