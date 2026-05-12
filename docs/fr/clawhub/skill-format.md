---
read_when:
    - Publication de Skills
    - Débogage des échecs de publication/synchronisation
summary: Format du dossier de Skill, fichiers requis, types de fichiers autorisés, limites.
x-i18n:
    generated_at: "2026-05-12T12:49:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format de Skill

## Sur disque

Une Skill est un dossier.

Obligatoire :

- `SKILL.md` (ou `skill.md`)

Facultatif :

- tout fichier _textuel_ de support (voir « Fichiers autorisés »)
- `.clawhubignore` (motifs à ignorer pour la publication/synchronisation, ancien `.clawdhubignore`)
- `.gitignore` (également respecté)

Métadonnées d’installation locale (écrites par la CLI) :

- `<skill>/.clawhub/origin.json` (ancien `.clawdhub`)

État d’installation du répertoire de travail (écrit par la CLI) :

- `<workdir>/.clawhub/lock.json` (ancien `.clawdhub`)

## `SKILL.md`

- Markdown avec frontmatter YAML facultatif.
- Le serveur extrait les métadonnées du frontmatter lors de la publication.
- `description` est utilisée comme résumé de la Skill dans l’interface utilisateur/la recherche.

## Métadonnées de frontmatter

Les métadonnées de Skill sont déclarées dans le frontmatter YAML en haut de votre `SKILL.md`. Cela indique au registre (et à l’analyse de sécurité) ce dont votre Skill a besoin pour s’exécuter.

### Frontmatter de base

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Métadonnées d’exécution (`metadata.openclaw`)

Déclarez les exigences d’exécution de votre Skill sous `metadata.openclaw` (alias : `metadata.clawdbot`, `metadata.clawdis`).

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

Utilisez `requires.env` pour les variables d’environnement qui doivent être présentes avant que la Skill puisse s’exécuter. Utilisez `envVars` lorsque vous avez besoin de métadonnées par variable, y compris des variables facultatives avec `required: false`.

### Référence complète des champs

| Champ              | Type       | Description                                                                                                                                          |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables d’environnement requises attendues par votre Skill.                                                                                        |
| `requires.bins`    | `string[]` | Binaires CLI qui doivent tous être installés.                                                                                                        |
| `requires.anyBins` | `string[]` | Binaires CLI dont au moins un doit exister.                                                                                                          |
| `requires.config`  | `string[]` | Chemins de fichiers de configuration lus par votre Skill.                                                                                            |
| `primaryEnv`       | `string`   | La variable d’environnement principale pour les identifiants de votre Skill.                                                                          |
| `envVars`          | `array`    | Déclarations de variables d’environnement avec `name`, `required` facultatif et `description` facultative. Définissez `required: false` pour les variables d’environnement facultatives. |
| `always`           | `boolean`  | Si `true`, la Skill est toujours active (aucune installation explicite nécessaire).                                                                   |
| `skillKey`         | `string`   | Remplace la clé d’appel de la Skill.                                                                                                                 |
| `emoji`            | `string`   | Emoji affiché pour la Skill.                                                                                                                         |
| `homepage`         | `string`   | URL de la page d’accueil ou de la documentation de la Skill.                                                                                         |
| `os`               | `string[]` | Restrictions de système d’exploitation (par exemple `["macos"]`, `["linux"]`).                                                                       |
| `install`          | `array`    | Spécifications d’installation des dépendances (voir ci-dessous).                                                                                     |
| `nix`              | `object`   | Spécification du Plugin Nix (voir README).                                                                                                          |
| `config`           | `object`   | Spécification de configuration Clawdbot (voir README).                                                                                               |

### Spécifications d’installation

Si votre Skill nécessite l’installation de dépendances, déclarez-les dans le tableau `install` :

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

Types d’installation pris en charge : `brew`, `node`, `go`, `uv`.

### Variables d’environnement facultatives

Déclarez les variables d’environnement facultatives sous `metadata.openclaw.envVars` et définissez `required: false`. N’ajoutez pas d’entrées facultatives à `requires.env`, car `requires.env` signifie que la Skill ne peut pas s’exécuter sans elles.

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

L’analyse de sécurité de ClawHub vérifie que ce que votre Skill déclare correspond à ce qu’elle fait réellement. Si votre code référence `TODOIST_API_KEY` mais que votre frontmatter ne le déclare pas sous `requires.env`, `primaryEnv` ou `envVars`, l’analyse signalera une incohérence de métadonnées. Des déclarations exactes aident votre Skill à passer l’examen et aident les utilisateurs à comprendre ce qu’ils installent.

### Exemple : frontmatter complet

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

Seuls les fichiers « textuels » sont acceptés par la publication.

- La liste d’extensions autorisées se trouve dans `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Les fichiers de script sont tout de même analysés après l’envoi ; les fichiers PowerShell `.ps1`, `.psm1` et `.psd1` sont acceptés comme texte.
- Les types de contenu commençant par `text/` sont traités comme du texte, avec en plus une petite liste d’autorisation (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (côté serveur) :

- Taille totale du bundle : 50 Mo.
- Le texte d’embedding inclut `SKILL.md` + jusqu’à environ 40 fichiers non-`.md` (plafond au mieux).

## Slugs

- Dérivés du nom du dossier par défaut.
- Doivent être en minuscules et compatibles avec les URL : `^[a-z0-9][a-z0-9-]*$`.

## Versionnement + étiquettes

- Chaque publication crée une nouvelle version (semver).
- Les étiquettes sont des pointeurs sous forme de chaîne vers une version ; `latest` est couramment utilisée.

## Licence

- Toutes les Skills publiées sur ClawHub sont sous licence `MIT-0`.
- Toute personne peut utiliser, modifier et redistribuer les Skills publiées, y compris à des fins commerciales.
- L’attribution n’est pas requise.
- N’ajoutez pas de conditions de licence contradictoires dans `SKILL.md` ; ClawHub ne prend pas en charge les remplacements de licence par Skill.

## Skills payantes

- ClawHub ne prend pas en charge les Skills payantes, la tarification par Skill, les paywalls ni le partage de revenus.
- N’ajoutez pas de métadonnées de tarification à `SKILL.md` ; elles ne font pas partie du format de Skill et ne rendront pas une Skill publiée payante.
- Si votre Skill s’intègre à un service tiers payant, documentez clairement le coût externe et le compte requis dans les instructions de la Skill et les déclarations d’environnement (`requires.env` pour les variables requises, ou `envVars` avec `required: false` pour les variables facultatives).
