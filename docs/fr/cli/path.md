---
read_when:
    - Vous souhaitez lire ou écrire une feuille dans un fichier de l’espace de travail depuis le terminal
    - Vous écrivez des scripts qui s’appuient sur l’état de l’espace de travail et souhaitez un schéma d’adressage stable et indépendant du type.
    - Vous déboguez un chemin `oc://` (validez la syntaxe, voyez vers quoi il se résout)
summary: Référence CLI pour `openclaw path` (inspecter et modifier les fichiers de l’espace de travail via le schéma d’adressage `oc://`)
title: Chemin
x-i18n:
    generated_at: "2026-05-11T20:28:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Accès shell fourni par un Plugin au substrat d’adressage `oc://` : un schéma
de chemin dispatché par type pour inspecter et modifier les fichiers d’espace
de travail adressables (markdown, jsonc, jsonl). Les auto-hébergeurs, les
auteurs de plugins et les extensions d’éditeur l’utilisent pour lire,
rechercher ou mettre à jour un emplacement précis sans écrire à la main des
parseurs propres à chaque fichier.

La CLI reflète les verbes publics du substrat :

- `resolve` est concret et correspond à un seul résultat.
- `find` est le verbe multi-correspondances pour les jokers, les unions, les
  prédicats et l’expansion positionnelle.
- `set` n’accepte que les chemins concrets ou les marqueurs d’insertion ; les
  motifs avec jokers sont rejetés avant l’écriture.

`path` est fourni par le Plugin optionnel groupé `oc-path`. Activez-le avant la
première utilisation :

```bash
openclaw plugins enable oc-path
```

## Pourquoi l’utiliser

L’état d’OpenClaw est réparti entre du markdown modifié par des humains, une
configuration JSONC commentée et des journaux JSONL en ajout seul. Les scripts
shell, hooks et agents ont souvent besoin d’une seule petite valeur dans ces
fichiers : une clé de frontmatter, un réglage de plugin, un champ
d’enregistrement de journal ou un élément de liste sous une section nommée.

`openclaw path` donne à ces appelants une adresse stable au lieu d’un grep,
d’une expression régulière ou d’un parseur ponctuel pour chaque type de fichier.
Le même chemin `oc://` peut être validé, résolu, recherché, exécuté à blanc et
écrit depuis le terminal, ce qui rend l’automatisation ciblée plus facile à
relire et plus sûre à rejouer. Il est particulièrement utile lorsque vous
voulez mettre à jour une seule feuille tout en préservant les commentaires, les
fins de ligne et la mise en forme environnante du reste du fichier.

Utilisez-le quand l’élément que vous voulez possède une adresse logique, mais
que la forme physique du fichier varie :

- Un hook veut lire un réglage dans du JSONC commenté sans perdre les
  commentaires lorsqu’il réécrit la valeur.
- Un script de maintenance veut trouver tous les champs d’événements
  correspondants dans un journal JSONL sans charger tout le journal dans un
  parseur personnalisé.
- Une extension d’éditeur veut sauter vers une section markdown ou un élément de
  liste par slug, puis afficher la ligne exacte qui a été résolue.
- Un agent veut exécuter à blanc une toute petite modification d’espace de
  travail avant de l’appliquer, avec les octets modifiés visibles en revue.

Vous n’avez probablement pas besoin de `openclaw path` pour les modifications
ordinaires de fichiers entiers, les migrations de configuration riches ou les
écritures propres à la mémoire. Celles-ci doivent utiliser la commande ou le
Plugin propriétaire. `path` sert aux petites opérations de fichiers adressables
où une commande de terminal répétable est plus claire qu’un autre parseur
sur mesure.

## Comment il est utilisé

Lire une valeur dans un fichier de configuration modifié par des humains :

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Prévisualiser une écriture sans toucher au disque :

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Trouver des enregistrements correspondants dans un journal JSONL en ajout seul :

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adresser une instruction dans du markdown par section et élément plutôt que par
numéro de ligne :

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valider un chemin dans CI ou dans un script de préparation avant que le script
ne lise ou n’écrive :

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Ces commandes sont destinées à être copiables dans des scripts shell. Utilisez
`--json` lorsqu’un appelant a besoin d’une sortie structurée et `--human`
lorsqu’une personne inspecte le résultat.

## Fonctionnement

`openclaw path` fait quatre choses :

1. Analyse l’adresse `oc://` en emplacements : fichier, section, élément, champ
   et session optionnelle.
2. Choisit l’adaptateur de type de fichier à partir de l’extension cible
   (`.md`, `.jsonc`, `.jsonl` et alias associés).
3. Résout les emplacements dans l’AST de ce type de fichier : titres/éléments
   markdown, clés d’objet/index de tableau JSONC ou enregistrements de lignes
   JSONL.
4. Pour `set`, émet les octets modifiés via le même adaptateur afin que les
   parties intactes du fichier conservent leurs commentaires, fins de ligne et
   mise en forme proche là où le type le prend en charge.

`resolve` et `set` exigent une cible concrète unique. `find` est le verbe
exploratoire : il développe les jokers, unions, prédicats et ordinaux en
correspondances concrètes que vous pouvez inspecter avant d’en choisir une à
écrire.

## Sous-commandes

| Sous-commande           | Objectif                                                                     |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Afficher la correspondance concrète au chemin (ou « introuvable »).           |
| `find <pattern>`        | Énumérer les correspondances d’un chemin avec joker / union / prédicat.       |
| `set <oc-path> <value>` | Écrire une feuille ou une cible d’insertion à un chemin concret. Prend en charge `--dry-run`. |
| `validate <oc-path>`    | Analyse seulement ; afficher le découpage structurel (fichier / section / élément / champ). |
| `emit <file>`           | Faire un aller-retour d’un fichier via `parseXxx` + `emitXxx` (diagnostic de fidélité des octets). |

## Options globales

| Option          | Objectif                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Résoudre l’emplacement de fichier par rapport à ce répertoire (par défaut : `process.cwd()`). |
| `--file <path>` | Remplacer le chemin résolu de l’emplacement de fichier (accès absolu).   |
| `--json`        | Forcer la sortie JSON (par défaut lorsque stdout n’est pas un TTY).      |
| `--human`       | Forcer la sortie lisible par un humain (par défaut lorsque stdout est un TTY). |
| `--dry-run`     | (uniquement sur `set`) afficher les octets qui seraient écrits sans écrire. |

## Syntaxe `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Règles d’emplacement : `field` exige `item`, et `item` exige `section`. Dans les
quatre emplacements :

- **Segments entre guillemets** — `"a/b.c"` survit aux séparateurs `/` et `.`.
  Le contenu est littéral au niveau des octets ; `"` et `\` ne sont pas autorisés
  à l’intérieur des guillemets. L’emplacement de fichier tient également compte
  des guillemets : `oc://"skills/email-drafter"/Tools/$last` traite
  `skills/email-drafter` comme un seul chemin de fichier.
- **Prédicats** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Les opérations numériques exigent que les deux côtés puissent être
  convertis en nombres finis.
- **Unions** — `{a,b,c}` correspond à n’importe laquelle des alternatives.
- **Jokers** — `*` (un seul sous-segment) et `**` (zéro ou plus,
  récursif). `find` les accepte ; `resolve` et `set` les rejettent comme
  ambigus.
- **Positionnel** — `$last` se résout au dernier index / à la dernière clé
  déclarée.
- **Ordinal** — `#N` pour la Nième correspondance dans l’ordre du document.
- **Marqueurs d’insertion** — `+`, `+key`, `+nnn` pour une insertion par clé /
  indexée (à utiliser avec `set`).
- **Portée de session** — `?session=cron-daily` etc. Orthogonale à
  l’imbrication des emplacements. Les valeurs de session sont brutes, non
  décodées en pourcentage ; elles ne peuvent pas contenir de caractères de
  contrôle ni de délimiteurs de requête réservés (`?`, `&`, `%`).

Les caractères réservés (`?`, `&`, `%`) hors des segments entre guillemets, de
prédicat ou d’union sont rejetés. Les caractères de contrôle (U+0000-U+001F,
U+007F) sont rejetés partout, y compris dans la valeur de requête `session`.

`formatOcPath(parseOcPath(path)) === path` est garanti pour les chemins
canoniques. Les paramètres de requête non canoniques sont ignorés, sauf pour la
première valeur `session=` non vide.

## Adressage par type de fichier

| Type       | Modèle d’adressage                                                                        |
| ---------- | ----------------------------------------------------------------------------------------- |
| Markdown   | Sections H2 par slug, éléments de liste par slug ou `#N`, frontmatter via `[frontmatter]`. |
| JSONC/JSON | Clés d’objet et index de tableau ; les points séparent les sous-segments imbriqués sauf entre guillemets. |
| JSONL      | Adresses de lignes de premier niveau (`L1`, `L2`, `$last`), puis descente de style JSONC dans la ligne. |

`resolve` renvoie une correspondance structurée : `root`, `node`, `leaf` ou
`insertion-point`, avec un numéro de ligne basé sur 1. Les valeurs feuilles sont
exposées comme du texte plus un `leafType` afin que les auteurs de plugins
puissent afficher des aperçus sans dépendre de la forme AST propre à chaque
type.

## Contrat de mutation

`set` écrit une cible concrète unique :

- Les valeurs de frontmatter markdown et les champs d’éléments `- key: value`
  sont des feuilles de chaîne. Les insertions markdown ajoutent des sections,
  des clés de frontmatter ou des éléments de section et rendent une forme
  markdown canonique pour le fichier modifié.
- Les écritures de feuilles JSONC convertissent la valeur chaîne vers le type
  de feuille existant (`string`, `number` fini, `true`/`false` ou `null`). Les
  insertions d’objets et de tableaux JSONC analysent `<value>` comme JSON et
  utilisent le chemin de modification `jsonc-parser` pour les écritures de
  feuilles ordinaires, en préservant les commentaires et la mise en forme proche.
- Les écritures de feuilles JSONL convertissent comme JSONC dans une ligne. Le
  remplacement d’une ligne entière et l’ajout analysent `<value>` comme JSON.
  Le JSONL rendu préserve la convention dominante de fins de ligne LF/CRLF du
  fichier.

Utilisez `--dry-run` avant les écritures visibles par l’utilisateur lorsque les
octets exacts comptent. Le substrat préserve une sortie byte-à-byte identique
pour les allers-retours analyse/émission, mais une mutation peut canonicaliser
la région modifiée ou le fichier selon le type.

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Autres exemples de grammaire :

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

Les mêmes cinq verbes fonctionnent sur tous les types ; le schéma d’adressage
effectue le dispatch selon l’extension du fichier. Les exemples ci-dessous
utilisent les fixtures de la description de la PR.

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

Le prédicat `[frontmatter]` adresse le bloc de frontmatter YAML ; `tools`
correspond au titre `## Tools` via son slug, et les feuilles d’éléments
conservent leur forme de slug même lorsque la source utilise des underscores
(`send_email` → `send-email`).

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

Les modifications JSONC passent par `jsonc-parser`, de sorte que les commentaires et les espaces sont conservés après un
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

Chaque ligne est un enregistrement. Adressez-le par prédicat (`[event=action]`) lorsque vous ne
connaissez pas le numéro de ligne, ou par le segment canonique `LN` lorsque vous le connaissez.

## Référence des sous-commandes

### `resolve <oc-path>`

Lit une seule feuille ou un seul nœud. Les jokers sont refusés — utilisez `find` pour ceux-ci.
Se termine avec `0` en cas de correspondance, `1` en cas d’absence propre de correspondance, `2` en cas d’erreur d’analyse ou de motif refusé.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Énumère chaque correspondance pour un motif avec joker / prédicat / union. Se termine avec `0`
s’il existe au moins une correspondance, `1` s’il n’y en a aucune. Les jokers d’emplacement de fichier sont refusés avec
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — passez un fichier concret (la globalisation multifichier
est une fonctionnalité ultérieure).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Écrit une feuille. Associez-le à `--dry-run` pour prévisualiser les octets qui seraient
écrits sans toucher au fichier. Se termine avec `0` en cas d’écriture réussie, `1` si
le substrat refuse (par exemple, si une garde sentinelle est déclenchée), `2` en cas d’erreurs d’analyse.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Le marqueur d’insertion `+key` crée l’enfant nommé s’il n’existe pas déjà ;
`+nnn` et `+` seul fonctionnent respectivement pour l’insertion indexée et l’ajout en fin.

### `validate <oc-path>`

Vérification par analyse uniquement. Aucun accès au système de fichiers. Utile lorsque vous voulez confirmer qu’un
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

Effectue un aller-retour d’un fichier via l’analyseur et l’émetteur propres à chaque type. La sortie devrait
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

`openclaw path` tient compte du TTY : sortie lisible par l’humain dans un terminal, JSON lorsque
stdout est transmis par tube ou redirigé. `--json` et `--human` remplacent
l’auto-détection.

## Remarques

- `set` écrit les octets via le chemin d’émission du substrat, qui applique automatiquement la
  garde de sentinelle de rédaction. Une feuille portant
  `__OPENCLAW_REDACTED__` (textuellement ou comme sous-chaîne) est refusée au moment de l’écriture.
- L’analyse JSONC et les modifications de feuilles utilisent la dépendance `jsonc-parser`
  locale au plugin, de sorte que les commentaires et la mise en forme sont préservés lors des écritures de feuilles
  ordinaires au lieu de passer par un chemin d’analyseur/rendu fait main.
- `path` ne connaît pas LKG. Si le fichier est suivi par LKG, le prochain
  appel observe décide s’il faut promouvoir / récupérer. `set --batch` pour
  un multi-set atomique via le cycle de vie de promotion/récupération LKG est prévu
  avec le substrat de récupération LKG.

## Voir aussi

- [Référence CLI](/fr/cli)
