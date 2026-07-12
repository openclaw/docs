---
read_when:
    - Vous souhaitez lire ou écrire une valeur terminale dans un fichier de l’espace de travail depuis le terminal
    - Vous écrivez un script qui interagit avec l’état de l’espace de travail et souhaitez un schéma d’adressage stable, indépendant du type.
    - Vous déboguez un chemin `oc://` (validez la syntaxe et vérifiez vers quoi il est résolu)
summary: Référence de la CLI pour `openclaw path` (inspecter et modifier les fichiers de l’espace de travail via le schéma d’adressage `oc://`)
title: Chemin
x-i18n:
    generated_at: "2026-07-12T02:31:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Accès depuis le shell au schéma d’adressage `oc://` : une syntaxe de chemin unique avec répartition selon le type permettant d’inspecter et de modifier les fichiers adressables de l’espace de travail (markdown, jsonc, jsonl, yaml/yml/lobster). Les personnes qui auto-hébergent, les auteurs de plugins et les extensions d’éditeur l’utilisent pour lire, rechercher ou mettre à jour un emplacement précis sans écrire manuellement un analyseur pour chaque type de fichier.

`path` est fourni par le plugin facultatif intégré `oc-path`. Activez-le avant la première utilisation :

```bash
openclaw plugins enable oc-path
```

Les verbes de la CLI reflètent le modèle d’adressage :

- `resolve` est concret et ne renvoie qu’une seule correspondance.
- `find` est le verbe destiné aux correspondances multiples pour les caractères génériques, les unions, les prédicats et l’expansion positionnelle.
- `set` n’accepte que les chemins concrets ou les marqueurs d’insertion ; les motifs avec caractères génériques sont rejetés avant l’écriture.
- `validate` analyse un chemin sans accéder au système de fichiers.
- `emit` effectue un aller-retour d’un fichier par analyse puis émission (diagnostic de fidélité des octets).

## Pourquoi l’utiliser

L’état d’OpenClaw est réparti entre des fichiers markdown modifiés manuellement, une configuration JSONC commentée, des journaux JSONL en ajout seul et des fichiers YAML de flux de travail ou de spécification. Les scripts, hooks et agents ont souvent besoin d’une seule petite valeur provenant de ces fichiers : une clé de frontmatter, un paramètre de plugin, un champ d’enregistrement de journal, une étape YAML ou un élément de liste à puces sous une section nommée.

`openclaw path` fournit à ces appelants une adresse stable plutôt qu’une commande grep, une expression régulière ou un analyseur ponctuel pour chaque type de fichier. Le même chemin `oc://` peut être validé, résolu, recherché, simulé et écrit depuis le terminal, ce qui permet de vérifier et de rejouer facilement les automatisations ciblées. Il préserve le reste du fichier : l’écriture d’une seule feuille ne perturbe donc ni ses commentaires, ni ses fins de ligne, ni la mise en forme voisine.

Utilisez-le lorsque l’élément recherché possède une adresse logique, mais que la structure du fichier varie :

- Un hook lit un paramètre dans un fichier JSONC commenté sans perdre les commentaires lorsqu’il réécrit la valeur.
- Un script de maintenance recherche chaque champ d’événement correspondant dans un journal JSONL sans charger l’intégralité du journal dans un analyseur personnalisé.
- Un éditeur accède à une section markdown ou à un élément de liste à puces au moyen de son slug, puis affiche la ligne exacte qui a été résolue.
- Un agent simule une petite modification de l’espace de travail avant de l’appliquer, les octets modifiés étant visibles lors de la révision.

N’utilisez pas `openclaw path` pour les modifications ordinaires de fichiers entiers, les migrations de configuration complexes ou les écritures propres à la mémoire ; celles-ci doivent passer par la commande ou le plugin propriétaire. `path` est destiné aux petites opérations adressables sur les fichiers, pour lesquelles une commande de terminal reproductible est préférable à un nouvel analyseur sur mesure.

## Utilisation

Lire une valeur dans un fichier de configuration modifié manuellement :

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Prévisualiser une écriture sans toucher au disque :

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Rechercher les enregistrements correspondants dans un journal JSONL en ajout seul :

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adresser une instruction dans un fichier markdown par section et élément plutôt que par numéro de ligne :

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valider un chemin dans l’intégration continue ou dans un script de vérification préalable avant que le script ne lise ou n’écrive :

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Ces commandes sont conçues pour être copiées dans des scripts shell. Utilisez `--json` lorsqu’un appelant a besoin d’une sortie structurée et `--human` lorsqu’une personne inspecte le résultat.

## Fonctionnement

1. Analyse l’adresse `oc://` en emplacements : fichier, section, élément, champ et requête de session facultative.
2. Choisit l’adaptateur correspondant au type de fichier à partir de l’extension cible (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Résout les emplacements par rapport à la structure de ce type de fichier : titres et éléments markdown, clés d’objet et index de tableau JSONC, enregistrements de ligne JSONL ou nœuds de mappage et de séquence YAML.
4. Pour `set`, émet les octets modifiés au moyen du même adaptateur afin que les parties intactes du fichier conservent leurs commentaires, leurs fins de ligne et leur mise en forme voisine lorsque le type le permet.

`resolve` et `set` exigent une cible concrète unique. `find` est le verbe d’exploration : il développe les caractères génériques, les unions, les prédicats et les ordinaux en correspondances concrètes que vous pouvez inspecter avant d’en choisir une à modifier.

## Sous-commandes

| Sous-commande             | Objectif                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `resolve <oc-path>`       | Afficher la correspondance concrète au chemin (ou « introuvable »).                                               |
| `find <pattern>`          | Énumérer les correspondances d’un chemin contenant un caractère générique, une union ou un prédicat.              |
| `set <oc-path> <value>`   | Écrire une feuille ou une cible d’insertion à un chemin concret. Prend en charge `--dry-run`.                      |
| `validate <oc-path>`      | Analyser uniquement ; afficher la décomposition structurelle (fichier, section, élément et champ).                 |
| `emit <file>`             | Effectuer un aller-retour d’un fichier par analyse puis émission (diagnostic de fidélité des octets).              |

## Options globales

| Option          | S’applique à                     | Objectif                                                                                                      |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Résoudre l’emplacement du fichier par rapport à ce répertoire (valeur par défaut : `process.cwd()`).           |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Remplacer le chemin résolu de l’emplacement du fichier (accès absolu).                                         |
| `--json`        | toutes                           | Forcer la sortie JSON (valeur par défaut lorsque la sortie standard n’est pas un TTY).                         |
| `--human`       | toutes                           | Forcer une sortie lisible par une personne (valeur par défaut lorsque la sortie standard est un TTY).         |
| `--value-json`  | `set`                            | Analyser `<value>` en tant que JSON pour remplacer une feuille JSON, JSONC ou JSONL.                           |
| `--dry-run`     | `set`                            | Afficher les octets qui seraient écrits sans effectuer l’écriture.                                            |
| `--diff`        | `set` (nécessite `--dry-run`)    | Afficher un diff unifié au lieu de l’intégralité des octets.                                                   |

`validate` accepte uniquement `--json` et `--human` ; il n’accède pas au système de fichiers, donc `--cwd` et `--file` ne s’appliquent pas.

## Syntaxe `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Règles des emplacements : `field` nécessite `item`, et `item` nécessite `section`. Dans les quatre emplacements :

- **Segments entre guillemets** — `"a/b.c"` préserve les séparateurs `/` et `.`. Le contenu est interprété littéralement au niveau des octets ; `"` et `\` ne sont pas autorisés à l’intérieur des guillemets. L’emplacement du fichier tient également compte des guillemets : `oc://"skills/email-drafter"/Tools/$last` traite `skills/email-drafter` comme un chemin de fichier unique.
- **Prédicats** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. Les opérateurs numériques exigent que les deux côtés puissent être convertis en nombres finis.
- **Unions** — `{a,b,c}` correspond à n’importe laquelle des possibilités.
- **Caractères génériques** — `*` (un seul sous-segment) et `**` (zéro ou plusieurs, récursivement). `find` les accepte ; `resolve` et `set` les rejettent comme ambigus.
- **Positionnels** — `$first` et `$last` désignent le premier ou le dernier index, ou la première ou la dernière clé déclarée.
- **Ordinal** — `#N` désigne la Nième correspondance selon l’ordre du document.
- **Marqueurs d’insertion** — `+`, `+key`, `+nnn` pour une insertion par clé ou par index (à utiliser avec `set`).
- **Portée de session** — `?session=cron-daily`, etc. Indépendante de l’imbrication des emplacements. Les valeurs de session sont brutes et ne sont pas décodées en pourcentage ; elles ne peuvent pas contenir de caractères de contrôle ni de délimiteurs de requête réservés (`?`, `&`, `%`).

Les caractères réservés (`?`, `&`, `%`) situés hors des segments entre guillemets, des prédicats ou des unions sont rejetés. Les caractères de contrôle (U+0000-U+001F, U+007F) sont rejetés partout, y compris dans la valeur de requête `session`.

`formatOcPath(parseOcPath(path)) === path` est garanti pour les chemins canoniques. Les paramètres de requête non canoniques sont ignorés, à l’exception de la première valeur `session=` non vide.

Limites strictes : un chemin est limité à 4 096 octets, à 4 emplacements au maximum (fichier, section, élément et champ), à 64 sous-segments séparés par des points au maximum par emplacement et à 256 niveaux de parcours imbriqués au maximum pour les chemins JSON profonds. Indépendamment de ces limites, tout fichier d’entrée JSONC ou JSON de plus de 16 Mio est refusé avec un diagnostic d’analyse au lieu d’être analysé, pour tout verbe qui charge ce fichier.

## Adressage selon le type de fichier

| Type          | Extensions de fichier         | Modèle d’adressage                                                                                                     |
| ------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                         | Sections H2 par slug, éléments de liste à puces par slug ou `#N`, frontmatter via `[frontmatter]`.                     |
| JSONC/JSON    | `.jsonc`, `.json`             | Clés d’objet et index de tableau ; les points séparent les sous-segments imbriqués, sauf entre guillemets.              |
| JSONL         | `.jsonl`, `.ndjson`           | Adresses de ligne de premier niveau (`L1`, `L2`, `$first`, `$last`), puis parcours de style JSONC à l’intérieur.        |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`   | Clés de mappage et index de séquence ; les commentaires et le style en ligne sont gérés par l’API de document YAML.     |

`resolve` renvoie une correspondance structurée : `root`, `node`, `leaf` ou `insertion-point`, avec un numéro de ligne commençant à 1. Les valeurs de feuille sont exposées sous forme de texte accompagné d’un `leafType`, afin que les auteurs de plugins puissent afficher des aperçus sans dépendre de la structure de l’AST propre à chaque type.

## Contrat de mutation

`set` écrit une cible concrète unique :

- Les valeurs de frontmatter markdown et les champs d’élément `- key: value` sont des feuilles de type chaîne. Les insertions markdown ajoutent des sections, des clés de frontmatter ou des éléments de section, et produisent une structure markdown canonique pour le fichier modifié. Les corps de section ne peuvent pas être écrits dans leur ensemble au moyen de `set`.
- Les écritures de feuilles JSONC convertissent la valeur de chaîne vers le type existant de la feuille (`string`, `number` fini, `true`/`false` ou `null`). Utilisez `--value-json` lorsqu’un remplacement de feuille JSONC, JSON ou JSONL doit analyser `<value>` en tant que JSON et peut modifier la structure, par exemple pour remplacer une notation abrégée de référence de secret sous forme de chaîne par un objet. Les insertions d’objets et de tableaux JSONC analysent `<value>` en tant que JSON et utilisent le chemin de modification de `jsonc-parser` pour les écritures ordinaires de feuilles, tout en préservant les commentaires et la mise en forme voisine.
- Les écritures de feuilles JSONL effectuent les mêmes conversions que JSONC à l’intérieur d’une ligne. Le remplacement d’une ligne entière et l’ajout analysent `<value>` en tant que JSON. Le JSONL produit conserve la convention dominante de fin de ligne LF/CRLF du fichier (vote majoritaire sur l’ensemble des sauts de ligne du fichier ; un fichier principalement en CRLF reste donc en CRLF même s’il contient quelques LF isolés).
- Les écritures de feuilles YAML convertissent la valeur vers le type scalaire existant (`string`, `number` fini, `true`/`false` ou `null`). Les insertions YAML utilisent l’API de document du paquet `yaml` intégré pour mettre à jour les mappages et les séquences. Les documents YAML mal formés comportant des erreurs d’analyse sont refusés avant toute mutation avec `parse-error`.

Utilisez `--dry-run` avant les écritures visibles par l’utilisateur lorsque les octets exacts importent. Les modifications JSONC et YAML corrigent le document existant (au moyen de `jsonc-parser` ou de l’API de document `yaml`), de sorte que les octets intacts sont généralement préservés ; markdown reconstruit le fichier à partir de sa structure analysée lors de toute modification, ce qui peut normaliser la mise en forme accessoire en dehors de la feuille modifiée. Ajoutez `--diff` lorsque vous souhaitez prévisualiser la modification sous la forme d’un correctif avant/après ciblé plutôt que sous celle du fichier rendu complet.

## Exemples

```bash
# Valider un chemin (sans accès au système de fichiers)
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

# Aller-retour avec fidélité des octets (diagnostic)
openclaw path emit ./AGENTS.md
```

Autres exemples de grammaire :

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Recettes par type de fichier

Les cinq mêmes verbes fonctionnent pour tous les types ; le schéma d’adressage sélectionne l’adaptateur selon l’extension du fichier.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

Le prédicat `[frontmatter]` désigne le bloc de métadonnées YAML ; `tools`
correspond au titre `## Tools` au moyen de son slug, et les feuilles des
éléments conservent leur forme de slug même lorsque la source utilise des
tirets bas (`send_email` devient `send-email`).

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
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Les modifications JSONC passent par `jsonc-parser`, de sorte que les
commentaires et les espaces sont conservés après un `set`. Exécutez d’abord
la commande avec `--dry-run` pour examiner les octets avant de valider la
modification. Les fichiers `.json` utilisent le même adaptateur et le même
chemin de modification que les fichiers `.jsonc`.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Chaque ligne constitue un enregistrement. Utilisez un prédicat
(`[event=action]`) lorsque vous ne connaissez pas le numéro de ligne, ou le
segment canonique `LN` lorsque vous le connaissez. Les fichiers `.ndjson`
utilisent le même adaptateur que les fichiers `.jsonl`.

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
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML utilise l’API `Document` du paquet `yaml` plutôt qu’un analyseur
développé manuellement. Ainsi, les cycles ordinaires d’analyse et
d’émission préservent les commentaires et la structure de rédaction, tandis
que les chemins résolus utilisent le même modèle de clés de table et
d’indices de séquence que JSONC. Le même adaptateur prend en charge les
fichiers `.yaml`, `.yml` et `.lobster`.

## Référence des sous-commandes

### `resolve <oc-path>`

Lit une feuille ou un nœud unique. Les caractères génériques sont refusés :
utilisez `find` dans ce cas. Se termine avec le code `0` en cas de
correspondance, `1` en cas d’absence normale de correspondance et `2` en cas
d’erreur d’analyse ou de motif refusé.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Énumère toutes les correspondances d’un motif comportant des caractères
génériques, des prédicats ou une union. Se termine avec le code `0` si au
moins une correspondance est trouvée, et `1` si aucune ne l’est. Les
caractères génériques dans l’emplacement du fichier sont refusés avec
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` : indiquez un fichier précis (la prise en
charge des motifs glob sur plusieurs fichiers est prévue ultérieurement).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Écrit une feuille. Associez cette commande à `--dry-run` pour prévisualiser
les octets qui seraient écrits sans modifier le fichier. Ajoutez `--diff`
pour prévisualiser un diff unifié. Se termine avec le code `0` après une
écriture réussie, `1` si le substrat refuse l’opération (par exemple, en cas
de déclenchement d’une protection par sentinelle) et `2` en cas d’erreur
d’analyse.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Le marqueur d’insertion `+key` crée l’enfant nommé s’il n’existe pas encore ;
`+nnn` et `+` seul servent respectivement à l’insertion à un indice donné et
à l’ajout en fin de liste.

### `validate <oc-path>`

Vérification par analyse uniquement. Aucun accès au système de fichiers.
Utile pour confirmer qu’un chemin de modèle est correctement formé avant de
remplacer des variables, ou pour obtenir sa décomposition structurelle à
des fins de débogage :

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Se termine avec le code `0` lorsque le chemin est valide, `1` lorsqu’il est
invalide, avec un `code` et un `message` structurés, et `2` en cas d’erreur
d’argument.

### `emit <file>`

Fait passer un fichier par l’analyseur et l’émetteur propres à son type.
Pour un fichier valide, la sortie doit être identique à l’entrée au niveau
des octets ; toute divergence indique un bogue de l’analyseur ou le
déclenchement d’une sentinelle. Cette commande est utile pour déboguer le
comportement du substrat avec des entrées réelles.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Codes de sortie

| Code | Signification                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------ |
| `0`  | Réussite. (`resolve` / `find` : au moins une correspondance. `set` : écriture réussie.)                |
| `1`  | Aucune correspondance, ou `set` refusé par le substrat (aucune erreur au niveau du système).           |
| `2`  | Erreur d’argument ou d’analyse.                                                                        |

## Mode de sortie

`openclaw path` détecte la présence d’un TTY : la sortie est lisible par un
humain dans un terminal et au format JSON lorsque la sortie standard est
redirigée ou transmise par un tube. `--json` et `--human` remplacent la
détection automatique.

## Remarques

- `set` écrit les octets au moyen du chemin d’émission du substrat, qui
  applique automatiquement la protection par sentinelle de masquage. Une
  feuille contenant `__OPENCLAW_REDACTED__`, tel quel ou comme sous-chaîne,
  est refusée au moment de l’écriture.
- L’analyse JSONC et les modifications de feuilles utilisent la dépendance
  locale au Plugin `jsonc-parser`. Les commentaires et la mise en forme sont
  donc conservés lors des écritures ordinaires de feuilles, au lieu de
  passer par un chemin d’analyse et de nouveau rendu développé manuellement.
- `path` ne tient pas compte du suivi ni de la récupération de la dernière
  configuration valide (LKG) ; ce cycle de vie est géré ailleurs. Si un
  fichier modifié avec `path` fait également l’objet d’un suivi LKG, la
  prochaine lecture de configuration détermine s’il doit être promu ou
  restauré. Traitez une modification effectuée avec `path` comme toute autre
  écriture directe dans ce fichier.

## Voir aussi

- [Référence de la CLI](/fr/cli)
