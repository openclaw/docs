---
read_when:
    - Publication de Skills
    - Débogage des échecs de publication/synchronisation
summary: Format du dossier Skill, fichiers requis, types de fichiers autorisés, limites.
x-i18n:
    generated_at: "2026-05-12T08:44:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format de compétence

## Sur disque

Une compétence est un dossier.

Obligatoire :

- `SKILL.md` (ou `skill.md`)

Facultatif :

- tout fichier _textuel_ de support (voir « Fichiers autorisés »)
- `.clawhubignore` (motifs à ignorer pour la publication/synchronisation, ancien `.clawdhubignore`)
- `.gitignore` (également respecté)

Métadonnées d’installation locale (écrites par la CLI) :

- `<skill>/.clawhub/origin.json` (ancien `.clawdhub`)

État d’installation du répertoire de travail (écrit par la CLI) :

- `<workdir>/.clawhub/lock.json` (ancien `.clawdhub`)

## `SKILL.md`

- Markdown avec frontmatter YAML facultatif.
- Le serveur extrait les métadonnées du frontmatter lors de la publication.
- `description` est utilisé comme résumé de la compétence dans l’UI/la recherche.

## Métadonnées du frontmatter

Les métadonnées de la compétence sont déclarées dans le frontmatter YAML en haut de votre `SKILL.md`. Cela indique au registre (et à l’analyse de sécurité) ce dont votre compétence a besoin pour s’exécuter.

### Frontmatter de base

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

Utilisez `requires.env` pour les variables d’environnement qui doivent être présentes avant que la compétence puisse s’exécuter. Utilisez `envVars` lorsque vous avez besoin de métadonnées par variable, y compris des variables facultatives avec `required: false`.

### Référence complète des champs

| Champ              | Type       | Description                                                                                                                                                 |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables d’environnement requises attendues par votre compétence.                                                                                          |
| `requires.bins`    | `string[]` | Binaires CLI qui doivent tous être installés.                                                                                                               |
| `requires.anyBins` | `string[]` | Binaires CLI dont au moins un doit exister.                                                                                                                 |
| `requires.config`  | `string[]` | Chemins des fichiers de configuration lus par votre compétence.                                                                                             |
| `primaryEnv`       | `string`   | Variable d’environnement principale contenant les identifiants pour votre compétence.                                                                        |
| `envVars`          | `array`    | Déclarations de variables d’environnement avec `name`, `required` facultatif et `description` facultative. Définissez `required: false` pour les variables d’environnement facultatives. |
| `always`           | `boolean`  | Si `true`, la compétence est toujours active (aucune installation explicite nécessaire).                                                                     |
| `skillKey`         | `string`   | Remplace la clé d’invocation de la compétence.                                                                                                             |
| `emoji`            | `string`   | Emoji d’affichage pour la compétence.                                                                                                                       |
| `homepage`         | `string`   | URL de la page d’accueil ou de la documentation de la compétence.                                                                                           |
| `os`               | `string[]` | Restrictions d’OS (par ex. `["macos"]`, `["linux"]`).                                                                                                      |
| `install`          | `array`    | Spécifications d’installation des dépendances (voir ci-dessous).                                                                                            |
| `nix`              | `object`   | Spécification du Plugin Nix (voir README).                                                                                                                  |
| `config`           | `object`   | Spécification de configuration Clawdbot (voir README).                                                                                                      |

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

### Pourquoi c’est important

L’analyse de sécurité de ClawHub vérifie que ce que votre compétence déclare correspond à ce qu’elle fait réellement. Si votre code référence `TODOIST_API_KEY` mais que votre frontmatter ne le déclare pas sous `requires.env`, `primaryEnv` ou `envVars`, l’analyse signalera une incohérence de métadonnées. Garder les déclarations exactes aide votre compétence à réussir la revue et aide les utilisateurs à comprendre ce qu’ils installent.

### Exemple : frontmatter complet

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

Seuls les fichiers « textuels » sont acceptés par la publication.

- La liste d’autorisation des extensions se trouve dans `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Les fichiers de script sont toujours analysés après l’envoi ; les fichiers PowerShell `.ps1`, `.psm1` et `.psd1` sont acceptés comme texte.
- Les types de contenu commençant par `text/` sont traités comme du texte, avec une petite liste d’autorisation supplémentaire (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (côté serveur) :

- Taille totale du bundle : 50 Mo.
- Le texte d’embedding inclut `SKILL.md` + jusqu’à environ 40 fichiers non-`.md` (plafond appliqué au mieux).

## Slugs

- Dérivés du nom du dossier par défaut.
- Doivent être en minuscules et compatibles avec les URL : `^[a-z0-9][a-z0-9-]*$`.

## Versionnement + tags

- Chaque publication crée une nouvelle version (semver).
- Les tags sont des pointeurs textuels vers une version ; `latest` est couramment utilisé.

## Licence

- Toutes les compétences publiées sur ClawHub sont sous licence `MIT-0`.
- Tout le monde peut utiliser, modifier et redistribuer les compétences publiées, y compris commercialement.
- L’attribution n’est pas requise.
- N’ajoutez pas de conditions de licence contradictoires dans `SKILL.md` ; ClawHub ne prend pas en charge les substitutions de licence par compétence.

## Compétences payantes

- ClawHub ne prend pas en charge les compétences payantes, la tarification par compétence, les paywalls ni le partage de revenus.
- N’ajoutez pas de métadonnées de tarification à `SKILL.md` ; elles ne font pas partie du format de compétence et ne rendront pas payante une compétence publiée.
- Si votre compétence s’intègre à un service tiers payant, documentez clairement le coût externe et le compte requis dans les instructions de la compétence et les déclarations d’environnement (`requires.env` pour les variables requises, ou `envVars` avec `required: false` pour les variables facultatives).
