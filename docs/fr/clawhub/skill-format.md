---
read_when:
    - Publication de Skills
    - Débogage des échecs de publication
summary: Format du dossier de Skills, fichiers requis, types de fichiers autorisés, limites.
x-i18n:
    generated_at: "2026-07-12T02:24:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format des compétences

## Sur disque

Une compétence est un dossier.

Obligatoire :

- `SKILL.md` (ou `skill.md` ; l’ancien format `skills.md` est également accepté)

Facultatif :

- tout fichier complémentaire _textuel_ (voir « Fichiers autorisés »)
- `.clawhubignore` (motifs d’exclusion pour la publication, anciennement `.clawdhubignore`)
- `.gitignore` (également pris en compte)

## Importation depuis GitHub

L’outil d’importation GitHub sur le Web est plus strict que la publication ou la synchronisation locale. Il détecte uniquement les fichiers
`SKILL.md` ou les anciens fichiers `skills.md` dans les dépôts publics, non issus d’un fork et appartenant
au compte GitHub connecté. Il n’importe pas les dépôts privés, les forks,
les dépôts archivés ou désactivés, ni les dépôts publics tiers.

Métadonnées d’installation locale (écrites par la CLI) :

- `<skill>/.clawhub/origin.json` (anciennement `.clawdhub`)

État d’installation du répertoire de travail (écrit par la CLI) :

- `<workdir>/.clawhub/lock.json` (anciennement `.clawdhub`)

## `SKILL.md`

- Markdown avec en-tête YAML facultatif.
- Le serveur extrait les métadonnées de l’en-tête lors de la publication.
- `description` sert de résumé de la compétence dans l’interface et les résultats de recherche.

Pour des Agent Skills portables, `name` doit correspondre au répertoire parent et contenir
entre 1 et 64 lettres minuscules, chiffres ou traits d’union. ClawHub conserve séparément le slug utilisable pour le routage et
le nom d’affichage du catalogue. Ainsi, les noms existants provenant d’autres clients restent
publiables et ne sont pas réécrits silencieusement. Les listes du catalogue peuvent raccourcir visuellement les noms longs
sans modifier le nom enregistré.

## Métadonnées de l’en-tête

Les métadonnées de la compétence sont déclarées dans l’en-tête YAML situé au début de votre fichier `SKILL.md`. Elles indiquent au registre, ainsi qu’à l’analyse de sécurité, les éléments nécessaires à l’exécution de votre compétence.

### En-tête de base

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Métadonnées d’exécution (`metadata.openclaw`)

Déclarez les exigences d’exécution de votre compétence sous `metadata.openclaw` (alias : `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Utilisez `requires.env` pour les variables d’environnement qui doivent être présentes avant que la compétence puisse s’exécuter. Utilisez `envVars` lorsque vous devez fournir des métadonnées propres à chaque variable, notamment pour des variables facultatives avec `required: false`.

### Référence complète des champs

| Champ              | Type       | Description                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables d’environnement obligatoires attendues par votre compétence.                                                                       |
| `requires.bins`    | `string[]` | Binaires CLI qui doivent tous être installés.                                                                                                |
| `requires.anyBins` | `string[]` | Binaires CLI dont au moins un doit être présent.                                                                                             |
| `requires.config`  | `string[]` | Chemins des fichiers de configuration lus par votre compétence.                                                                              |
| `primaryEnv`       | `string`   | Variable d’environnement principale contenant les identifiants de votre compétence.                                                          |
| `envVars`          | `array`    | Déclarations de variables d’environnement avec `name`, `required` facultatif et `description` facultative. Définissez `required: false` pour les variables d’environnement facultatives. |
| `always`           | `boolean`  | Si la valeur est `true`, la compétence est toujours active (aucune installation explicite n’est nécessaire).                                |
| `skillKey`         | `string`   | Remplace la clé d’invocation de la compétence.                                                                                                |
| `emoji`            | `string`   | Emoji affiché pour la compétence.                                                                                                            |
| `homepage`         | `string`   | URL de la page d’accueil ou de la documentation de la compétence.                                                                            |
| `os`               | `string[]` | Restrictions relatives au système d’exploitation (p. ex. `["macos"]`, `["linux"]`).                                                          |
| `install`          | `array`    | Spécifications d’installation des dépendances (voir ci-dessous).                                                                             |
| `nix`              | `object`   | Spécification du Plugin Nix (voir le README).                                                                                                |
| `config`           | `object`   | Spécification de configuration de Clawdbot (voir le README).                                                                                 |

### Spécifications d’installation

Si votre compétence nécessite l’installation de dépendances, déclarez-les dans le tableau `install` :

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Types d’installation pris en charge : `brew`, `node`, `go`, `uv`.

### Variables d’environnement facultatives

Déclarez les variables d’environnement facultatives sous `metadata.openclaw.envVars` et définissez `required: false`. N’ajoutez pas d’entrées facultatives à `requires.env`, car `requires.env` signifie que la compétence ne peut pas s’exécuter sans elles.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Pourquoi est-ce important ?

L’analyse de sécurité de ClawHub vérifie que les déclarations de votre compétence correspondent à son comportement réel. Si votre code fait référence à `TODOIST_API_KEY`, mais que votre en-tête ne la déclare pas sous `requires.env`, `primaryEnv` ou `envVars`, l’analyse signalera une incohérence dans les métadonnées. Des déclarations exactes facilitent la validation de votre compétence et permettent aux utilisateurs de comprendre ce qu’ils installent.

### Exemple : en-tête complet

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Fichiers autorisés

Seuls les fichiers « textuels » sont acceptés lors de la publication.

- La liste des extensions autorisées se trouve dans `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Les fichiers de script sont tout de même analysés après leur téléversement ; les fichiers PowerShell `.ps1`, `.psm1` et `.psd1` sont acceptés comme fichiers texte.
- Les types de contenu commençant par `text/` sont traités comme du texte, auxquels s’ajoute une petite liste de formats autorisés (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites côté serveur :

- Taille totale du paquet : 50 Mo.
- Le texte d’intégration comprend `SKILL.md` ainsi que jusqu’à environ 40 fichiers autres que `.md` (limite appliquée dans la mesure du possible).

## Slugs

- Dérivés par défaut du nom du dossier.
- Les portées de paquet doivent correspondre exactement à l’identifiant de l’éditeur ClawHub. Les identifiants d’éditeur peuvent contenir des lettres minuscules, des chiffres, des traits d’union, des points et des traits de soulignement ; ils doivent commencer et se terminer par une lettre minuscule ou un chiffre.
- Les slugs de paquet doivent être en minuscules et compatibles avec npm, par exemple `@example.tools/demo-plugin` ou `demo-plugin`.

## Gestion des versions et balises

- Chaque publication crée une nouvelle version (semver).
- Les balises sont des pointeurs textuels vers une version ; `latest` est couramment utilisée.

## Licence

- Toutes les compétences publiées sur ClawHub sont proposées sous licence `MIT-0`.
- Toute personne peut utiliser, modifier et redistribuer les compétences publiées, y compris à des fins commerciales.
- Aucune attribution n’est requise.
- N’ajoutez pas de conditions de licence contradictoires dans `SKILL.md` ; ClawHub ne permet pas de remplacer la licence pour une compétence particulière.

## Compétences payantes

- ClawHub ne prend pas en charge les compétences payantes, la tarification par compétence, les systèmes d’accès payant ni le partage des revenus.
- N’ajoutez pas de métadonnées tarifaires à `SKILL.md` ; elles ne font pas partie du format des compétences et ne rendront pas une compétence publiée payante.
- Si votre compétence s’intègre à un service tiers payant, documentez clairement le coût externe et le compte requis dans les instructions de la compétence et les déclarations d’environnement (`requires.env` pour les variables obligatoires, ou `envVars` avec `required: false` pour les variables facultatives).
