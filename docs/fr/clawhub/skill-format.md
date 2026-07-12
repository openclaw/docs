---
read_when:
    - Publication de Skills
    - Débogage des échecs de publication
summary: Format du dossier de Skills, fichiers requis, types de fichiers autorisés, limites.
x-i18n:
    generated_at: "2026-07-12T15:05:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format des Skills

## Sur le disque

Un skill est un dossier.

Obligatoire :

- `SKILL.md` (ou `skill.md` ; l’ancien format `skills.md` est également accepté)

Facultatif :

- tout fichier complémentaire _textuel_ (voir « Fichiers autorisés »)
- `.clawhubignore` (motifs d’exclusion pour la publication, anciennement `.clawdhubignore`)
- `.gitignore` (également pris en compte)

## Importation depuis GitHub

L’importateur GitHub web est plus strict que la publication ou la synchronisation locale. Il ne détecte que les fichiers
`SKILL.md` ou les anciens fichiers `skills.md` dans les dépôts publics non issus d’un fork et appartenant
au compte GitHub connecté. Il n’importe pas les dépôts privés, les forks,
les dépôts archivés ou désactivés, ni les dépôts publics tiers.

Métadonnées d’installation locale (écrites par la CLI) :

- `<skill>/.clawhub/origin.json` (anciennement `.clawdhub`)

État d’installation du répertoire de travail (écrit par la CLI) :

- `<workdir>/.clawhub/lock.json` (anciennement `.clawdhub`)

## `SKILL.md`

- Markdown avec frontmatter YAML facultatif.
- Le serveur extrait les métadonnées du frontmatter lors de la publication.
- `description` est utilisé comme résumé du skill dans l’interface utilisateur et la recherche.

Pour les Agent Skills portables, `name` doit correspondre au répertoire parent et utiliser
1 à 64 lettres minuscules, chiffres ou traits d’union. ClawHub sépare le slug utilisable pour le routage du
nom d’affichage dans le catalogue, afin que les noms existants provenant d’autres clients restent
publiables et ne soient pas réécrits silencieusement. Les listes du catalogue peuvent abréger visuellement les noms longs
sans modifier le nom enregistré.

## Métadonnées du frontmatter

Les métadonnées du skill sont déclarées dans le frontmatter YAML situé en haut de votre fichier `SKILL.md`. Elles indiquent au registre (et à l’analyse de sécurité) ce dont votre skill a besoin pour s’exécuter.

### Frontmatter de base

```yaml
---
name: my-skill
description: Bref résumé de ce que fait ce skill.
version: 1.0.0
---
```

### Métadonnées d’exécution (`metadata.openclaw`)

Déclarez les exigences d’exécution de votre skill sous `metadata.openclaw` (alias : `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gérer les tâches via l’API Todoist.
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

Utilisez `requires.env` pour les variables d’environnement qui doivent être présentes avant que le skill puisse s’exécuter. Utilisez `envVars` lorsque vous avez besoin de métadonnées propres à chaque variable, y compris pour les variables facultatives avec `required: false`.

### Référence complète des champs

| Champ              | Type       | Description                                                                                                                                                        |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | Variables d’environnement requises par votre skill.                                                                                                                |
| `requires.bins`    | `string[]` | Binaires CLI qui doivent tous être installés.                                                                                                                      |
| `requires.anyBins` | `string[]` | Binaires CLI dont au moins un doit être disponible.                                                                                                                |
| `requires.config`  | `string[]` | Chemins des fichiers de configuration lus par votre skill.                                                                                                        |
| `primaryEnv`       | `string`   | Variable d’environnement principale contenant les informations d’identification de votre skill.                                                                   |
| `envVars`          | `array`    | Déclarations de variables d’environnement avec `name`, `required` facultatif et `description` facultative. Définissez `required: false` pour les variables facultatives. |
| `always`           | `boolean`  | Si la valeur est `true`, le skill est toujours actif (aucune installation explicite nécessaire).                                                                  |
| `skillKey`         | `string`   | Remplace la clé d’invocation du skill.                                                                                                                             |
| `emoji`            | `string`   | Emoji affiché pour le skill.                                                                                                                                       |
| `homepage`         | `string`   | URL de la page d’accueil ou de la documentation du skill.                                                                                                         |
| `os`               | `string[]` | Restrictions de système d’exploitation (par exemple `["macos"]`, `["linux"]`).                                                                                     |
| `install`          | `array`    | Spécifications d’installation des dépendances (voir ci-dessous).                                                                                                  |
| `nix`              | `object`   | Spécification du plugin Nix (voir le README).                                                                                                                      |
| `config`           | `object`   | Spécification de configuration Clawdbot (voir le README).                                                                                                         |

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
        description: Jeton d’API Todoist utilisé pour les requêtes authentifiées.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Identifiant facultatif du projet par défaut lorsque l’utilisateur n’en indique aucun.
```

### Pourquoi est-ce important ?

L’analyse de sécurité de ClawHub vérifie que les déclarations de votre skill correspondent à son comportement réel. Si votre code référence `TODOIST_API_KEY`, mais que votre frontmatter ne la déclare pas sous `requires.env`, `primaryEnv` ou `envVars`, l’analyse signalera une incohérence dans les métadonnées. Des déclarations exactes aident votre skill à réussir l’examen et permettent aux utilisateurs de comprendre ce qu’ils installent.

### Exemple : frontmatter complet

```yaml
---
name: todoist-cli
description: Gérer les tâches, les projets et les libellés Todoist depuis la ligne de commande.
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
- Les fichiers de script sont tout de même analysés après le téléversement ; les fichiers PowerShell `.ps1`, `.psm1` et `.psd1` sont acceptés comme fichiers texte.
- Les types de contenu commençant par `text/` sont traités comme du texte, ainsi qu’une petite liste de formats autorisés (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limites (côté serveur) :

- Taille totale du paquet : 50MB.
- Le texte d’intégration comprend `SKILL.md` et jusqu’à environ 40 fichiers autres que `.md` (limite appliquée au mieux).

## Slugs

- Dérivés par défaut du nom du dossier.
- Les portées de paquet doivent correspondre exactement à l’identifiant d’éditeur ClawHub. Les identifiants d’éditeur peuvent utiliser des lettres minuscules, des chiffres, des traits d’union, des points et des traits de soulignement ; ils doivent commencer et se terminer par une lettre minuscule ou un chiffre.
- Les slugs de paquet doivent être en minuscules et compatibles avec npm, par exemple `@example.tools/demo-plugin` ou `demo-plugin`.

## Gestion des versions et balises

- Chaque publication crée une nouvelle version (semver).
- Les balises sont des pointeurs textuels vers une version ; `latest` est couramment utilisé.

## Licence

- Tous les skills publiés sur ClawHub sont concédés sous licence `MIT-0`.
- Toute personne peut utiliser, modifier et redistribuer les skills publiés, y compris à des fins commerciales.
- L’attribution n’est pas obligatoire.
- N’ajoutez pas de conditions de licence contradictoires dans `SKILL.md` ; ClawHub ne prend pas en charge les remplacements de licence propres à chaque skill.

## Skills payants

- ClawHub ne prend pas en charge les skills payants, la tarification par skill, les systèmes de paiement obligatoire ni le partage des revenus.
- N’ajoutez pas de métadonnées de tarification à `SKILL.md` ; elles ne font pas partie du format de skill et ne rendront pas un skill publié payant.
- Si votre skill s’intègre à un service tiers payant, documentez clairement le coût externe et le compte requis dans les instructions du skill et les déclarations d’environnement (`requires.env` pour les variables requises, ou `envVars` avec `required: false` pour les variables facultatives).
