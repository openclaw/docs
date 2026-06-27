---
read_when:
    - Vous voulez lire ou écrire une feuille dans un fichier d’espace de travail depuis le terminal
    - Vous écrivez des scripts sur l’état de l’espace de travail et souhaitez un schéma d’adressage stable, indépendant du type.
    - Vous déboguez un chemin `oc://` (validez la syntaxe, voyez vers quoi il se résout)
summary: Référence CLI pour `openclaw path` (inspecter et modifier les fichiers de l’espace de travail via le schéma d’adressage `oc://`)
title: Chemin
x-i18n:
    generated_at: "2026-06-27T17:20:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Accès shell fourni par un plugin au substrat d’adressage `oc://` : un schéma de chemin
réparti par type pour inspecter et modifier les fichiers adressables de l’espace de travail
(markdown, jsonc, jsonl, yaml/yml/lobster). Les personnes qui auto-hébergent, les auteurs de
plugins et les extensions d’éditeur l’utilisent pour lire, trouver ou mettre à jour un emplacement
précis sans écrire à la main des parseurs propres à chaque type de fichier.

La CLI reflète les verbes publics du substrat :

- `resolve` est concret et correspond à un seul résultat.
- `find` est le verbe à correspondances multiples pour les jokers, unions, prédicats et
  expansions positionnelles.
- `set` n’accepte que les chemins concrets ou les marqueurs d’insertion ; les motifs avec joker sont
  rejetés avant l’écriture.

`path` est fourni par le plugin optionnel inclus `oc-path`. Activez-le avant la
première utilisation :

```bash
openclaw plugins enable oc-path
```

## Pourquoi l’utiliser

L’état d’OpenClaw est réparti entre du markdown modifié par des humains, de la configuration JSONC commentée,
des journaux JSONL en ajout seul et des fichiers de workflow/spécification YAML. Les scripts shell, hooks
et agents ont souvent besoin d’une petite valeur dans ces fichiers : une clé de frontmatter, un
paramètre de plugin, un champ d’enregistrement de journal, une étape YAML ou un élément de liste sous une section
nommée.

`openclaw path` donne à ces appelants une adresse stable au lieu d’un grep,
d’une regex ou d’un parseur ponctuel pour chaque type de fichier. Le même chemin `oc://` peut être validé,
résolu, recherché, testé à blanc et écrit depuis le terminal, ce qui rend l’automatisation ciblée
plus facile à relire et plus sûre à rejouer. Il est particulièrement utile lorsque
vous voulez mettre à jour une seule feuille tout en préservant le reste des commentaires du fichier,
ses fins de ligne et la mise en forme environnante.

Utilisez-le lorsque ce que vous voulez a une adresse logique, mais que la forme physique du fichier
varie :

- Un hook veut lire un paramètre dans du JSONC commenté sans perdre les commentaires
  lorsqu’il réécrit la valeur.
- Un script de maintenance veut trouver tous les champs d’événements correspondants dans un journal JSONL
  sans charger tout le journal dans un parseur personnalisé.
- Une extension d’éditeur veut accéder à une section markdown ou à un élément de liste par
  slug, puis afficher la ligne exacte vers laquelle il a été résolu.
- Un agent veut tester à blanc une minuscule modification de l’espace de travail avant de l’appliquer, avec les
  octets modifiés visibles lors de la revue.

Vous n’avez probablement pas besoin de `openclaw path` pour les modifications ordinaires de fichiers entiers, les migrations
riches de configuration ou les écritures propres à la mémoire. Celles-ci doivent utiliser la commande
ou le plugin propriétaire. `path` sert aux petites opérations de fichiers adressables où une
commande terminal répétable est plus claire qu’un autre parseur sur mesure.

## Comment il est utilisé

Lire une valeur dans un fichier de configuration modifié par des humains :

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Prévisualiser une écriture sans toucher au disque :

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Trouver les enregistrements correspondants dans un journal JSONL en ajout seul :

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adresser une instruction en markdown par section et élément plutôt que par numéro de
ligne :

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valider un chemin dans CI ou dans un script de précontrôle avant que le script lise ou écrive :

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Ces commandes sont conçues pour être copiées dans des scripts shell. Utilisez `--json` lorsqu’un
appelant a besoin d’une sortie structurée et `--human` lorsqu’une personne inspecte le
résultat.

## Fonctionnement

`openclaw path` fait quatre choses :

1. Analyse l’adresse `oc://` en emplacements : fichier, section, élément, champ et
   session facultative.
2. Choisit l’adaptateur de type de fichier à partir de l’extension cible (`.md`, `.jsonc`,
   `.jsonl`, `.yaml`, `.yml`, `.lobster` et alias associés).
3. Résout les emplacements par rapport à l’AST de ce type de fichier : titres/éléments markdown,
   clés d’objet/index de tableau JSONC, enregistrements de lignes JSONL ou nœuds de mappage/séquence
   YAML.
4. Pour `set`, émet les octets modifiés via le même adaptateur afin que les parties
   intactes du fichier conservent leurs commentaires, fins de ligne et mise en forme proche
   lorsque le type le prend en charge.

`resolve` et `set` exigent une cible concrète unique. `find` est le verbe exploratoire :
il développe les jokers, unions, prédicats et ordinaux en correspondances concrètes
que vous pouvez inspecter avant d’en choisir une à écrire.

## Sous-commandes

| Sous-commande           | Objectif                                                                     |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Afficher la correspondance concrète au chemin (ou « not found »).             |
| `find <pattern>`        | Énumérer les correspondances d’un chemin avec joker / union / prédicat.       |
| `set <oc-path> <value>` | Écrire une feuille ou une cible d’insertion à un chemin concret. Prend en charge `--dry-run`. |
| `validate <oc-path>`    | Analyse seule ; afficher la décomposition structurelle (fichier / section / élément / champ). |
| `emit <file>`           | Faire un aller-retour d’un fichier via `parseXxx` + `emitXxx` (diagnostic de fidélité des octets). |

## Options globales

| Option          | Objectif                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Résoudre l’emplacement fichier par rapport à ce répertoire (par défaut : `process.cwd()`). |
| `--file <path>` | Remplacer le chemin résolu de l’emplacement fichier (accès absolu).       |
| `--json`        | Forcer la sortie JSON (par défaut lorsque stdout n’est pas un TTY).       |
| `--human`       | Forcer la sortie humaine (par défaut lorsque stdout est un TTY).          |
| `--dry-run`     | (uniquement sur `set`) afficher les octets qui seraient écrits sans écrire. |
| `--diff`        | (avec `set --dry-run`) afficher un diff unifié au lieu des octets complets. |

## Syntaxe `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Règles d’emplacement : `field` exige `item`, et `item` exige `section`. Sur les
quatre emplacements :

- **Segments entre guillemets** — `"a/b.c"` préserve les séparateurs `/` et `.`.
  Le contenu est littéral au niveau des octets ; `"` et `\` ne sont pas autorisés dans les guillemets.
  L’emplacement fichier tient aussi compte des guillemets : `oc://"skills/email-drafter"/Tools/$last`
  traite `skills/email-drafter` comme un seul chemin de fichier.
- **Prédicats** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Les opérations numériques exigent que les deux côtés se convertissent en nombres finis.
- **Unions** — `{a,b,c}` correspond à n’importe laquelle des alternatives.
- **Jokers** — `*` (un seul sous-segment) et `**` (zéro ou plus,
  récursif). `find` les accepte ; `resolve` et `set` les rejettent comme
  ambigus.
- **Positionnel** — `$first` / `$last` se résolvent au premier / dernier index ou
  à la clé déclarée.
- **Ordinal** — `#N` pour la Nième correspondance selon l’ordre du document.
- **Marqueurs d’insertion** — `+`, `+key`, `+nnn` pour l’insertion avec clé / index
  (à utiliser avec `set`).
- **Portée de session** — `?session=cron-daily`, etc. Orthogonale à l’imbrication
  des emplacements. Les valeurs de session sont brutes, non décodées en pourcentage ; elles ne peuvent pas contenir
  de caractères de contrôle ni de délimiteurs de requête réservés (`?`, `&`, `%`).

Les caractères réservés (`?`, `&`, `%`) hors des segments entre guillemets, de prédicat ou d’union
sont rejetés. Les caractères de contrôle (U+0000-U+001F, U+007F) sont rejetés
partout, y compris dans la valeur de requête `session`.

`formatOcPath(parseOcPath(path)) === path` est garanti pour les chemins canoniques.
Les paramètres de requête non canoniques sont ignorés, sauf pour la première valeur
`session=` non vide.

## Adressage par type de fichier

| Type              | Modèle d’adressage                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | Sections H2 par slug, éléments de liste par slug ou `#N`, frontmatter via `[frontmatter]`.          |
| JSONC/JSON        | Clés d’objet et index de tableau ; les points découpent les sous-segments imbriqués sauf guillemets. |
| JSONL             | Adresses de lignes de premier niveau (`L1`, `L2`, `$first`, `$last`), puis descente de style JSONC dans la ligne. |
| YAML/YML/.lobster | Clés de mappage et index de séquence ; les commentaires et le style en flux sont gérés par l’API de document YAML. |

`resolve` renvoie une correspondance structurée : `root`, `node`, `leaf` ou
`insertion-point`, avec un numéro de ligne basé sur 1. Les valeurs feuilles sont exposées sous forme de texte
plus un `leafType` afin que les auteurs de plugins puissent afficher des prévisualisations sans dépendre
de la forme d’AST propre à chaque type.

## Contrat de mutation

`set` écrit une cible concrète unique :

- Les valeurs de frontmatter markdown et les champs d’élément `- key: value` sont des feuilles de chaîne.
  Les insertions markdown ajoutent des sections, des clés de frontmatter ou des éléments de section et
  produisent une forme markdown canonique pour le fichier modifié.
- Les écritures de feuilles JSONC convertissent la valeur chaîne vers le type de feuille existant
  (`string`, `number` fini, `true`/`false` ou `null`). Utilisez `--value-json`
  lorsqu’un remplacement de feuille JSONC/JSON/JSONL doit analyser `<value>` comme JSON et
  peut changer de forme, par exemple le remplacement d’un raccourci SecretRef sous forme de chaîne par un
  objet. Les insertions d’objet et de tableau JSONC analysent `<value>` comme JSON et utilisent le
  chemin d’édition `jsonc-parser` pour les écritures ordinaires de feuilles, en préservant les commentaires et
  la mise en forme proche.
- Les écritures de feuilles JSONL se convertissent comme JSONC à l’intérieur d’une ligne. Le remplacement de ligne entière et
  l’ajout analysent `<value>` comme JSON. Le JSONL rendu préserve la convention dominante
  de fins de ligne LF/CRLF du fichier.
- Les écritures de feuilles YAML convertissent vers le type scalaire existant (`string`, `number` fini,
  `true`/`false` ou `null`). Les insertions YAML utilisent l’API de document du paquet
  `yaml` inclus pour les mises à jour de mappage/séquence. Les documents YAML mal formés
  avec erreurs de parseur sont refusés avant mutation avec `parse-error`.

Utilisez `--dry-run` avant les écritures visibles par l’utilisateur lorsque les octets exacts comptent. Le
substrat préserve une sortie identique au niveau des octets pour les allers-retours parse/emit, mais une
mutation peut canonicaliser la région modifiée ou le fichier selon le type.
Ajoutez `--diff` lorsque vous voulez la prévisualisation sous forme de patch avant/après ciblé plutôt
que le fichier rendu complet.

## Exemples

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
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

Les cinq mêmes verbes fonctionnent pour tous les types ; le schéma d’adressage se répartit selon
l’extension du fichier. Les exemples ci-dessous utilisent les fixtures de la description de la PR.

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

Le prédicat `[frontmatter]` adresse le bloc YAML frontmatter ; `tools`
correspond à l’en-tête `## Tools` via le slug, et les feuilles d’éléments conservent leur forme de slug
même lorsque la source utilise des underscores (`send_email` → `send-email`).

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

Les modifications JSONC passent par `jsonc-parser`, donc les commentaires et les espaces survivent à un
`set`. Exécutez d’abord avec `--dry-run` pour inspecter les octets avant de valider.

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

Chaque ligne est un enregistrement. Adressez par prédicat (`[event=action]`) lorsque vous ne
connaissez pas le numéro de ligne, ou par le segment canonique `LN` lorsque vous le connaissez.

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

YAML utilise l’API `Document` du package `yaml` plutôt qu’un analyseur écrit à la main,
donc les allers-retours ordinaires analyse/émission préservent les commentaires et la forme de rédaction tandis que
les chemins résolus utilisent le même modèle clé de map / index de séquence que JSONC. Le même
adaptateur gère les fichiers `.yaml`, `.yml` et `.lobster`.

## Référence des sous-commandes

### `resolve <oc-path>`

Lit une seule feuille ou un seul nœud. Les jokers sont rejetés — utilisez `find` pour ceux-ci.
Se termine avec `0` en cas de correspondance, `1` en cas d’absence propre, `2` en cas d’erreur d’analyse ou de motif refusé.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Énumère chaque correspondance pour un motif joker / prédicat / union. Se termine avec `0`
s’il y a au moins une correspondance, `1` s’il n’y en a aucune. Les jokers d’emplacement de fichier sont rejetés avec
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — passez un fichier concret (le globbing multifichier
est une fonctionnalité ultérieure).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Écrit une feuille. Associez avec `--dry-run` pour prévisualiser les octets qui seraient
écrits sans toucher au fichier. Ajoutez `--diff` pour une prévisualisation en diff unifié.
Se termine avec `0` après une écriture réussie, `1` si le substrat refuse (par exemple, si une
garde sentinelle est déclenchée), `2` en cas d’erreurs d’analyse.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Le marqueur d’insertion `+key` crée l’enfant nommé s’il n’existe pas déjà ;
`+nnn` et `+` seul fonctionnent respectivement pour l’insertion indexée et l’ajout.

### `validate <oc-path>`

Vérification d’analyse uniquement. Aucun accès au système de fichiers. Utile lorsque vous voulez confirmer qu’un
chemin de modèle est bien formé avant de substituer des variables, ou lorsque vous voulez
la décomposition structurelle pour le débogage :

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Se termine avec `0` lorsque c’est valide, `1` lorsque c’est invalide (avec un `code` et un
`message` structurés), `2` en cas d’erreurs d’arguments.

### `emit <file>`

Fait passer un fichier en aller-retour par l’analyseur et l’émetteur propres à son type. La sortie doit
être identique octet pour octet à l’entrée sur un fichier sain — une divergence indique un
bogue d’analyseur ou une sentinelle déclenchée. Utile pour déboguer le comportement du substrat sur
des entrées réelles.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Codes de sortie

| Code | Signification                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Succès. (`resolve` / `find` : au moins une correspondance. `set` : écriture réussie.) |
| `1`  | Aucune correspondance, ou `set` rejeté par le substrat (pas d’erreur au niveau système).      |
| `2`  | Erreur d’argument ou d’analyse.                                                   |

## Mode de sortie

`openclaw path` détecte le TTY : sortie lisible par un humain dans un terminal, JSON lorsque
stdout est redirigé ou envoyé dans un pipe. `--json` et `--human` remplacent
l’auto-détection.

## Notes

- `set` écrit les octets via le chemin d’émission du substrat, qui applique
  automatiquement la garde de sentinelle de caviardage. Une feuille contenant
  `__OPENCLAW_REDACTED__` (verbatim ou comme sous-chaîne) est refusée au moment de l’écriture.
- L’analyse JSONC et les modifications de feuilles utilisent la dépendance `jsonc-parser`
  locale au Plugin, donc les commentaires et la mise en forme sont préservés lors des écritures de feuilles
  ordinaires au lieu de passer par un chemin analyseur/rendu écrit à la main.
- `path` ne connaît pas LKG. Si le fichier est suivi par LKG, le prochain
  appel observe décide s’il faut promouvoir / récupérer. `set --batch` pour
  des ensembles multiples atomiques via le cycle de vie de promotion/récupération LKG est prévu
  avec le substrat de récupération LKG.

## Connexe

- [Référence CLI](/fr/cli)
