---
read_when:
    - Publication de Skills
    - Débogage des échecs de publication/synchronisation
summary: Format du dossier Skills, fichiers requis, types de fichiers autorisés, limites.
x-i18n:
    generated_at: "2026-05-13T04:18:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format de Skill

## Sur le disque

Un skill est un dossier.

Obligatoire :

- `SKILL.md` (ou `skill.md`)

Facultatif :

- tous les fichiers _textuels_ de prise en charge (voir « Fichiers autorisés »)
- `.clawhubignore` (motifs à ignorer pour la publication/synchronisation, ancien `.clawdhubignore`)
- `.gitignore` (également respecté)

Métadonnées d’installation locale (écrites par la CLI) :

- `<skill>/.clawhub/origin.json` (ancien `.clawdhub`)

État d’installation du répertoire de travail (écrit par la CLI) :

- `<workdir>/.clawhub/lock.json` (ancien `.clawdhub`)

## `SKILL.md`

- Markdown avec frontmatter YAML facultatif.
- Le serveur extrait les métadonnées du frontmatter lors de la publication.
- `description` est utilisée comme résumé du skill dans l’interface utilisateur/la recherche.

## Métadonnées de frontmatter

Les métadonnées du skill sont déclarées dans le frontmatter YAML en haut de votre `SKILL.md`. Cela indique au registre (et à l’analyse de sécurité) ce dont votre skill a besoin pour s’exécuter.

### Frontmatter de base

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Métadonnées d’exécution (`metadata.openclaw`)

Déclarez les exigences d’exécution de votre skill sous `metadata.openclaw` (alias : `metadata.clawdbot`, `metadata.clawdis`).

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

Utilisez `requires.env` pour les variables d’environnement qui doivent être présentes avant que le skill puisse s’exécuter. Utilisez `envVars` lorsque vous avez besoin de métadonnées par variable, y compris des variables facultatives avec `required: false`.

### Référence complète des champs

| Champ              | Type       | Description                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables d’environnement requises attendues par votre skill.                                                                                 |
| `requires.bins`    | `string[]` | Binaires CLI qui doivent tous être installés.                                                                                                 |
| `requires.anyBins` | `string[]` | Binaires CLI dont au moins un doit exister.                                                                                                   |
| `requires.config`  | `string[]` | Chemins des fichiers de configuration lus par votre skill.                                                                                    |
| `primaryEnv`       | `string`   | Variable d’environnement principale des identifiants pour votre skill.                                                                         |
| `envVars`          | `array`    | Déclarations de variables d’environnement avec `name`, `required` facultatif et `description` facultative. Définissez `required: false` pour les variables d’environnement facultatives. |
| `always`           | `boolean`  | Si `true`, le skill est toujours actif (aucune installation explicite nécessaire).                                                            |
| `skillKey`         | `string`   | Remplace la clé d’appel du skill.                                                                                                             |
| `emoji`            | `string`   | Emoji affiché pour le skill.                                                                                                                  |
| `homepage`         | `string`   | URL de la page d’accueil ou de la documentation du skill.                                                                                     |
| `os`               | `string[]` | Restrictions de système d’exploitation (par ex. `["macos"]`, `["linux"]`).                                                                    |
| `install`          | `array`    | Spécifications d’installation pour les dépendances (voir ci-dessous).                                                                         |
| `nix`              | `object`   | Spécification du plugin Nix (voir README).                                                                                                    |
| `config`           | `object`   | Spécification de configuration Clawdbot (voir README).                                                                                        |

### Spécifications d’installation

Si votre skill nécessite l’installation de dépendances, déclarez-les dans le tableau `install` :

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

Déclarez les variables d’environnement facultatives sous `metadata.openclaw.envVars` et définissez `required: false`. N’ajoutez pas d’entrées facultatives à `requires.env`, car `requires.env` signifie que le skill ne peut pas s’exécuter sans elles.

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

L’analyse de sécurité de ClawHub vérifie que ce que votre skill déclare correspond à ce qu’il fait réellement. Si votre code référence `TODOIST_API_KEY` mais que votre frontmatter ne la déclare pas sous `requires.env`, `primaryEnv` ou `envVars`, l’analyse signalera une incohérence de métadonnées. Garder des déclarations exactes aide votre skill à passer la revue et aide les utilisateurs à comprendre ce qu’ils installent.

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
- Les types de contenu commençant par `text/` sont traités comme du texte ; avec une petite liste d’autorisation en plus (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (côté serveur) :

- Taille totale du bundle : 50 Mo.
- Le texte d’embedding inclut `SKILL.md` + jusqu’à environ 40 fichiers non `.md` (limite au mieux).

## Slugs

- Dérivés du nom de dossier par défaut.
- Doivent être en minuscules et sûrs pour les URL : `^[a-z0-9][a-z0-9-]*$`.

## Versionnement + tags

- Chaque publication crée une nouvelle version (semver).
- Les tags sont des pointeurs chaîne vers une version ; `latest` est couramment utilisé.

## Licence

- Tous les skills publiés sur ClawHub sont sous licence `MIT-0`.
- Tout le monde peut utiliser, modifier et redistribuer les skills publiés, y compris commercialement.
- L’attribution n’est pas requise.
- N’ajoutez pas de conditions de licence conflictuelles dans `SKILL.md` ; ClawHub ne prend pas en charge les remplacements de licence par skill.

## Skills payants

- ClawHub ne prend pas en charge les skills payants, la tarification par skill, les paywalls ni le partage de revenus.
- N’ajoutez pas de métadonnées de tarification à `SKILL.md` ; elles ne font pas partie du format de skill et ne rendront pas un skill publié payant.
- Si votre skill s’intègre à un service tiers payant, documentez clairement le coût externe et le compte requis dans les instructions du skill et les déclarations d’environnement (`requires.env` pour les variables requises, ou `envVars` avec `required: false` pour les variables facultatives).
