---
read_when:
    - Publication de Skills
    - Débogage des échecs de publication
summary: Format du dossier de Skill, fichiers requis, types de fichiers autorisés, limites.
x-i18n:
    generated_at: "2026-07-12T21:38:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format des Skills

## Sur disque

Un Skill est un dossier.

Obligatoire :

- `SKILL.md` (ou `skill.md` ; l’ancien format `skills.md` est également accepté)

Facultatif :

- tout fichier complémentaire _textuel_ (voir « Fichiers autorisés »)
- `.clawhubignore` (motifs d’exclusion pour la publication, ancien format `.clawdhubignore`)
- `.gitignore` (également pris en compte)

## Import depuis GitHub

L’outil d’importation GitHub du Web est plus strict que la publication ou la synchronisation locale. Il détecte uniquement les fichiers
`SKILL.md` ou les anciens fichiers `skills.md` dans les dépôts publics non issus d’un fork appartenant
au compte GitHub connecté. Il n’importe pas les dépôts privés, les forks,
les dépôts archivés ou désactivés, ni les dépôts publics tiers.

Métadonnées d’installation locale (écrites par la CLI) :

- `<skill>/.clawhub/origin.json` (ancien format `.clawdhub`)

État d’installation du répertoire de travail (écrit par la CLI) :

- `<workdir>/.clawhub/lock.json` (ancien format `.clawdhub`)

## `SKILL.md`

- Markdown avec frontmatter YAML facultatif.
- Le serveur extrait les métadonnées du frontmatter lors de la publication.
- `description` sert de résumé du Skill dans l’interface et les résultats de recherche.

Pour des Agent Skills portables, `name` doit correspondre au répertoire parent et utiliser
entre 1 et 64 lettres minuscules, chiffres ou traits d’union. ClawHub sépare le slug utilisable pour le routage du
nom d’affichage dans le catalogue, afin que les noms existants provenant d’autres clients restent
publiables et ne soient pas réécrits silencieusement. Les listes du catalogue peuvent raccourcir visuellement les noms longs
sans modifier le nom enregistré.

## Métadonnées du frontmatter

Les métadonnées du Skill sont déclarées dans le frontmatter YAML situé au début de votre fichier `SKILL.md`. Elles indiquent au registre (ainsi qu’à l’analyse de sécurité) les éléments dont votre Skill a besoin pour fonctionner.

### Frontmatter de base

```yaml
---
name: my-skill
description: Résumé succinct de ce que fait ce Skill.
version: 1.0.0
---
```

### Métadonnées d’exécution (`metadata.openclaw`)

Déclarez les exigences d’exécution de votre Skill sous `metadata.openclaw` (alias : `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gérer des tâches via l’API Todoist.
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

Utilisez `requires.env` pour les variables d’environnement qui doivent être présentes avant que le Skill puisse s’exécuter. Utilisez `envVars` lorsque vous avez besoin de métadonnées propres à chaque variable, notamment pour les variables facultatives avec `required: false`.

### Référence complète des champs

| Champ              | Type       | Description                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variables d’environnement requises par votre Skill.                                                                                           |
| `requires.bins`    | `string[]` | Binaires CLI qui doivent tous être installés.                                                                                                 |
| `requires.anyBins` | `string[]` | Binaires CLI dont au moins un doit être présent.                                                                                              |
| `requires.config`  | `string[]` | Chemins des fichiers de configuration lus par votre Skill.                                                                                   |
| `primaryEnv`       | `string`   | Variable d’environnement principale contenant les identifiants de votre Skill.                                                               |
| `envVars`          | `array`    | Déclarations de variables d’environnement avec `name`, `required` facultatif et `description` facultative. Définissez `required: false` pour les variables d’environnement facultatives. |
| `always`           | `boolean`  | Si la valeur est `true`, le Skill est toujours actif (aucune installation explicite nécessaire).                                             |
| `skillKey`         | `string`   | Remplace la clé d’appel du Skill.                                                                                                             |
| `emoji`            | `string`   | Emoji affiché pour le Skill.                                                                                                                  |
| `homepage`         | `string`   | URL de la page d’accueil ou de la documentation du Skill.                                                                                     |
| `os`               | `string[]` | Restrictions de système d’exploitation (par exemple `["macos"]`, `["linux"]`).                                                                |
| `install`          | `array`    | Spécifications d’installation des dépendances (voir ci-dessous).                                                                             |
| `nix`              | `object`   | Spécification du Plugin Nix (voir le README).                                                                                                 |
| `config`           | `object`   | Spécification de configuration de Clawdbot (voir le README).                                                                                  |

### Spécifications d’installation

Si votre Skill nécessite l’installation de dépendances, déclarez-les dans le tableau `install` :

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

Déclarez les variables d’environnement facultatives sous `metadata.openclaw.envVars` et définissez `required: false`. N’ajoutez pas d’entrées facultatives à `requires.env`, car `requires.env` signifie que le Skill ne peut pas s’exécuter sans elles.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Jeton d’API Todoist utilisé pour les requêtes authentifiées.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Identifiant facultatif du projet par défaut lorsque l’utilisateur n’en indique pas.
```

### Pourquoi est-ce important ?

L’analyse de sécurité de ClawHub vérifie que les déclarations de votre Skill correspondent à son comportement réel. Si votre code fait référence à `TODOIST_API_KEY`, mais que votre frontmatter ne la déclare pas sous `requires.env`, `primaryEnv` ou `envVars`, l’analyse signalera une incohérence des métadonnées. Des déclarations exactes aident votre Skill à réussir la vérification et permettent aux utilisateurs de comprendre ce qu’ils installent.

### Exemple : frontmatter complet

```yaml
---
name: todoist-cli
description: Gérer les tâches, projets et libellés Todoist depuis la ligne de commande.
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
        description: Jeton d’API Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Identifiant facultatif du projet par défaut.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Fichiers autorisés

Seuls les fichiers « textuels » sont acceptés lors de la publication.

- La liste des extensions autorisées se trouve dans `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Les fichiers de script sont tout de même analysés après leur téléversement ; les fichiers PowerShell `.ps1`, `.psm1` et `.psd1` sont acceptés comme fichiers texte.
- Les types de contenu commençant par `text/` sont traités comme du texte, auxquels s’ajoute une petite liste de types autorisés (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (côté serveur) :

- Taille totale du paquet : 50MB.
- Le texte destiné à la vectorisation comprend `SKILL.md` et jusqu’à environ 40 fichiers autres que `.md` (limite appliquée au mieux).

## Slugs

- Dérivés du nom du dossier par défaut.
- Les portées de paquet doivent correspondre exactement à l’identifiant de l’éditeur ClawHub. Les identifiants d’éditeur peuvent utiliser des lettres minuscules, des chiffres, des traits d’union, des points et des traits de soulignement ; ils doivent commencer et se terminer par une lettre minuscule ou un chiffre.
- Les slugs de paquet doivent être en minuscules et compatibles avec npm, par exemple `@example.tools/demo-plugin` ou `demo-plugin`.

## Gestion des versions et tags

- Chaque publication crée une nouvelle version (semver).
- Les tags sont des pointeurs textuels vers une version ; `latest` est couramment utilisé.

## Licence

- Tous les Skills publiés sur ClawHub sont proposés sous licence `MIT-0`.
- Toute personne peut utiliser, modifier et redistribuer les Skills publiés, y compris à des fins commerciales.
- L’attribution n’est pas requise.
- N’ajoutez pas de conditions de licence contradictoires dans `SKILL.md` ; ClawHub ne prend pas en charge le remplacement de la licence pour chaque Skill.

## Skills payants

- ClawHub ne prend pas en charge les Skills payants, la tarification propre à chaque Skill, les accès payants ni le partage des revenus.
- N’ajoutez pas de métadonnées de tarification dans `SKILL.md` ; elles ne font pas partie du format du Skill et ne rendront pas payant un Skill publié.
- Si votre Skill s’intègre à un service tiers payant, documentez clairement le coût externe et le compte requis dans les instructions du Skill et les déclarations d’environnement (`requires.env` pour les variables requises, ou `envVars` avec `required: false` pour les variables facultatives).
