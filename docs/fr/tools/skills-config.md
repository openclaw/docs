---
read_when:
    - Ajout ou modification de la configuration des Skills
    - Ajustement de la liste d’autorisation intégrée ou du comportement d’installation
summary: Schéma de configuration des Skills et exemples
title: Configuration des Skills
x-i18n:
    generated_at: "2026-04-23T07:12:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Configuration des Skills

La majeure partie de la configuration de chargement/installation des Skills se trouve sous `skills` dans
`~/.openclaw/openclaw.json`. La visibilité des Skills spécifique à l’agent se trouve sous
`agents.defaults.skills` et `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
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

Pour la génération/édition d’images intégrée, préférez `agents.defaults.imageGenerationModel`
ainsi que l’outil central `image_generate`. `skills.entries.*` n’est destiné qu’aux flux de travail de Skills personnalisés ou tierce partie.

Si vous sélectionnez un fournisseur/modèle d’image spécifique, configurez aussi
l’authentification/la clé API de ce fournisseur. Exemples typiques : `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour
`google/*`, `OPENAI_API_KEY` pour `openai/*`, et `FAL_KEY` pour `fal/*`.

Exemples :

- Configuration native de type Nano Banana Pro : `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuration native fal : `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listes d’autorisation de Skills par agent

Utilisez la configuration d’agent lorsque vous voulez les mêmes racines de Skills machine/espace de travail, mais un
ensemble visible différent de Skills selon l’agent.

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
- Omettez `agents.defaults.skills` pour laisser les Skills non restreintes par défaut.
- `agents.list[].skills` : ensemble final explicite de Skills pour cet agent ; il ne
  fusionne pas avec les valeurs par défaut.
- `agents.list[].skills: []` : n’expose aucune Skill pour cet agent.

## Champs

- Les racines de Skills intégrées incluent toujours `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, et `<workspace>/skills`.
- `allowBundled` : liste d’autorisation facultative pour les **Skills intégrées** uniquement. Lorsqu’elle est définie, seules
  les Skills intégrées présentes dans la liste sont éligibles (les Skills managed, agent et workspace ne sont pas affectées).
- `load.extraDirs` : répertoires supplémentaires de Skills à analyser (priorité la plus faible).
- `load.watch` : surveiller les dossiers de Skills et rafraîchir l’instantané des Skills (par défaut : true).
- `load.watchDebounceMs` : anti-rebond des événements du watcher de Skills en millisecondes (par défaut : 250).
- `install.preferBrew` : préférer les installateurs brew lorsqu’ils sont disponibles (par défaut : true).
- `install.nodeManager` : préférence d’installateur Node (`npm` | `pnpm` | `yarn` | `bun`, valeur par défaut : npm).
  Cela n’affecte que les **installations de Skills** ; le runtime de la Gateway doit toujours être Node
  (Bun déconseillé pour WhatsApp/Telegram).
  - `openclaw setup --node-manager` est plus étroit et accepte actuellement `npm`,
    `pnpm`, ou `bun`. Définissez manuellement `skills.install.nodeManager: "yarn"` si vous
    voulez des installations de Skills adossées à Yarn.
- `entries.<skillKey>` : remplacements par Skill.
- `agents.defaults.skills` : liste d’autorisation facultative de Skills par défaut héritée par les agents
  qui omettent `agents.list[].skills`.
- `agents.list[].skills` : liste d’autorisation finale facultative par agent ; les listes explicites
  remplacent les valeurs par défaut héritées au lieu de fusionner.

Champs par Skill :

- `enabled` : définissez `false` pour désactiver une Skill même si elle est intégrée/installée.
- `env` : variables d’environnement injectées pour l’exécution de l’agent (uniquement si elles ne sont pas déjà définies).
- `apiKey` : facilité facultative pour les Skills qui déclarent une variable d’environnement principale.
  Prend en charge une chaîne en clair ou un objet SecretRef (`{ source, provider, id }`).

## Remarques

- Les clés sous `entries` correspondent par défaut au nom de la Skill. Si une Skill définit
  `metadata.openclaw.skillKey`, utilisez cette clé à la place.
- L’ordre de priorité de chargement est `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills intégrées →
  `skills.load.extraDirs`.
- Les changements apportés aux Skills sont pris en compte au prochain tour d’agent lorsque le watcher est activé.

### Skills sandboxées + variables d’environnement

Lorsqu’une session est **sandboxée**, les processus de Skill s’exécutent dans le
backend de bac à sable configuré. Le bac à sable n’hérite **pas** du `process.env` de l’hôte.

Utilisez l’un des éléments suivants :

- `agents.defaults.sandbox.docker.env` pour le backend Docker (ou `agents.list[].sandbox.docker.env` par agent)
- intégrez l’env dans votre image de bac à sable personnalisée ou dans l’environnement de bac à sable distant

Les `env` globales et `skills.entries.<skill>.env/apiKey` s’appliquent uniquement aux exécutions **sur l’hôte**.
