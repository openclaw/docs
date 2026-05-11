---
read_when:
    - Ajouter ou modifier la configuration des Skills
    - Ajuster la liste d’autorisation intégrée ou le comportement d’installation
summary: Schéma de configuration et exemples de Skills
title: Configuration des Skills
x-i18n:
    generated_at: "2026-05-11T21:00:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

La plupart de la configuration du chargement/de l’installation des Skills se trouve sous `skills` dans
`~/.openclaw/openclaw.json`. La visibilité des Skills propres à un agent se trouve sous
`agents.defaults.skills` et `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Pour la génération/modification d’images intégrée, privilégiez `agents.defaults.imageGenerationModel`
avec l’outil principal `image_generate`. `skills.entries.*` est réservé aux workflows de Skills
personnalisés ou tiers.

Si vous sélectionnez un fournisseur/modèle d’image spécifique, configurez aussi
l’authentification/la clé d’API de ce fournisseur. Exemples courants : `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour
`google/*`, `OPENAI_API_KEY` pour `openai/*`, et `FAL_KEY` pour `fal/*`.

Exemples :

- Configuration native de type Nano Banana Pro : `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuration native fal : `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listes d’autorisation des Skills d’agent

Utilisez la configuration de l’agent lorsque vous souhaitez les mêmes racines de Skills
machine/espace de travail, mais un ensemble de Skills visible différent par agent.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Règles :

- `agents.defaults.skills` : liste d’autorisation de base partagée pour les agents qui omettent
  `agents.list[].skills`.
- Omettez `agents.defaults.skills` pour laisser les Skills sans restriction par défaut.
- `agents.list[].skills` : ensemble final explicite de Skills pour cet agent ; il ne
  fusionne pas avec les valeurs par défaut.
- `agents.list[].skills: []` : n’expose aucun Skill pour cet agent.

## Champs

- Les racines de Skills intégrées incluent toujours `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` et `<workspace>/skills`.
- `allowBundled` : liste d’autorisation facultative pour les Skills **fournis** uniquement. Lorsqu’elle est définie, seuls
  les Skills fournis de la liste sont éligibles (les Skills gérés, d’agent et d’espace de travail ne sont pas affectés).
- `load.extraDirs` : répertoires de Skills supplémentaires à analyser (priorité la plus basse).
- `load.allowSymlinkTargets` : répertoires cibles réels approuvés dans lesquels les dossiers de
  Skills liés par symlink peuvent être résolus, même lorsque le symlink se trouve hors de cette
  racine cible. Utilisez ceci pour des agencements intentionnels de dépôts frères tels que
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch` : surveille les dossiers de Skills et actualise l’instantané des Skills (par défaut : true).
- `load.watchDebounceMs` : délai anti-rebond pour les événements du surveillant de Skills, en millisecondes (par défaut : 250).
- `install.preferBrew` : privilégie les installateurs brew lorsqu’ils sont disponibles (par défaut : true).
- `install.nodeManager` : préférence d’installateur node (`npm` | `pnpm` | `yarn` | `bun`, par défaut : npm).
  Cela n’affecte que les **installations de Skills** ; le runtime Gateway doit toujours être Node
  (Bun n’est pas recommandé pour WhatsApp/Telegram).
  - `openclaw setup --node-manager` est plus restreint et accepte actuellement `npm`,
    `pnpm` ou `bun`. Définissez `skills.install.nodeManager: "yarn"` manuellement si vous
    souhaitez des installations de Skills basées sur Yarn.
- `install.allowUploadedArchives` : autorise les clients Gateway `operator.admin` approuvés
  à installer des archives zip privées préparées via `skills.upload.*`
  (par défaut : false). Cela active uniquement le chemin des archives téléversées ; les installations ClawHub
  normales ne l’exigent pas.
- `entries.<skillKey>` : substitutions par Skill.
- `agents.defaults.skills` : liste d’autorisation par défaut facultative de Skills, héritée par les agents
  qui omettent `agents.list[].skills`.
- `agents.list[].skills` : liste d’autorisation finale facultative par agent ; les listes explicites
  remplacent les valeurs par défaut héritées au lieu de les fusionner.

## Dépôts frères liés par symlink

Par défaut, chaque racine de Skills est une limite de confinement. Si un dossier de Skill sous
`~/.agents/skills` est un symlink qui se résout hors de `~/.agents/skills`,
OpenClaw l’ignore et journalise `Skipping escaped skill path outside its configured
root`.

Conservez l’agencement du symlink et n’autorisez que la racine cible approuvée :

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Avec cette configuration, un symlink tel que
`~/.agents/skills/manager -> ~/Projects/manager/skills` est accepté après
résolution realpath. `extraDirs` analyse aussi directement le dépôt frère, tandis que
`allowSymlinkTargets` préserve le chemin lié par symlink pour les agencements existants
de Skills d’agent. Gardez les entrées cibles restreintes ; ne pointez pas vers des racines larges comme `~` ou
`~/Projects`, sauf si chaque arborescence de Skills sous cette racine est approuvée.

Champs par Skill :

- `enabled` : définissez `false` pour désactiver un Skill même s’il est fourni/installé.
- `env` : variables d’environnement injectées pour l’exécution de l’agent (uniquement si elles ne sont pas déjà définies).
- `apiKey` : raccourci facultatif pour les Skills qui déclarent une variable d’environnement principale.
  Prend en charge une chaîne en clair ou un objet SecretRef (`{ source, provider, id }`).

## Notes

- Les clés sous `entries` correspondent par défaut au nom du Skill. Si un Skill définit
  `metadata.openclaw.skillKey`, utilisez cette clé à la place.
- La priorité de chargement est `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills fournis →
  `skills.load.extraDirs`.
- Les modifications apportées aux Skills sont prises en compte au prochain tour de l’agent lorsque le surveillant est activé.

### Skills sandboxés et variables d’environnement

Lorsqu’une session est **sandboxée**, les processus de Skills s’exécutent dans le backend de sandbox configuré. Le sandbox n’hérite **pas** du `process.env` de l’hôte.

<Warning>
  `env` global et `skills.entries.<skill>.env`/`apiKey` s’appliquent uniquement aux exécutions sur **l’hôte**. Dans un sandbox, ils n’ont aucun effet ; un Skill qui dépend de `GEMINI_API_KEY` échouera donc avec `apiKey not configured`, sauf si la variable est fournie séparément au sandbox.
</Warning>

Utilisez l’une des options suivantes :

- `agents.defaults.sandbox.docker.env` pour le backend Docker (ou `agents.list[].sandbox.docker.env` par agent).
- Intégrez l’environnement dans votre image de sandbox personnalisée ou dans votre environnement de sandbox distant.

## Articles connexes

<CardGroup cols={2}>
  <Card title="Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Ce que sont les Skills et comment ils sont chargés.
  </Card>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Création de packs de Skills personnalisés.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="terminal">
    Catalogue de commandes natives et directives de discussion.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma complet de `skills` et `agents.skills`.
  </Card>
</CardGroup>
