---
read_when:
    - Ajout ou modification de la configuration des Skills
    - Ajustement de la liste d’autorisation intégrée ou du comportement d’installation
summary: Schéma de configuration de Skills et exemples
title: Configuration des Skills
x-i18n:
    generated_at: "2026-05-06T07:42:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

La plupart de la configuration du chargeur/de l’installation des Skills se trouve sous `skills` dans
`~/.openclaw/openclaw.json`. La visibilité des Skills propres à un agent se trouve sous
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

Pour la génération/modification d’images intégrée, préférez `agents.defaults.imageGenerationModel`
avec l’outil principal `image_generate`. `skills.entries.*` sert uniquement aux workflows de Skills personnalisés ou
tiers.

Si vous sélectionnez un fournisseur/modèle d’image spécifique, configurez également la clé
d’authentification/API de ce fournisseur. Exemples typiques : `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour
`google/*`, `OPENAI_API_KEY` pour `openai/*`, et `FAL_KEY` pour `fal/*`.

Exemples :

- Configuration native de type Nano Banana Pro : `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Configuration native fal : `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listes d’autorisation des Skills par agent

Utilisez la configuration d’agent lorsque vous voulez les mêmes racines de Skills machine/espace de travail, mais un
ensemble de Skills visible différent par agent.

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

- `agents.defaults.skills` : liste d’autorisation de référence partagée pour les agents qui omettent
  `agents.list[].skills`.
- Omettez `agents.defaults.skills` pour laisser les Skills non restreints par défaut.
- `agents.list[].skills` : ensemble final explicite de Skills pour cet agent ; il ne
  fusionne pas avec les valeurs par défaut.
- `agents.list[].skills: []` : n’exposer aucun Skill pour cet agent.

## Champs

- Les racines de Skills intégrées incluent toujours `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` et `<workspace>/skills`.
- `allowBundled` : liste d’autorisation optionnelle pour les Skills **fournis** uniquement. Lorsqu’elle est définie, seuls
  les Skills fournis dans la liste sont éligibles (les Skills gérés, d’agent et d’espace de travail ne sont pas affectés).
- `load.extraDirs` : répertoires de Skills supplémentaires à analyser (priorité la plus basse).
- `load.watch` : surveiller les dossiers de Skills et actualiser l’instantané des Skills (par défaut : true).
- `load.watchDebounceMs` : temporisation anti-rebond pour les événements du surveillant de Skills en millisecondes (par défaut : 250).
- `install.preferBrew` : préférer les programmes d’installation brew lorsqu’ils sont disponibles (par défaut : true).
- `install.nodeManager` : préférence d’installateur node (`npm` | `pnpm` | `yarn` | `bun`, par défaut : npm).
  Cela n’affecte que les **installations de Skills** ; le runtime Gateway doit toujours être Node
  (Bun n’est pas recommandé pour WhatsApp/Telegram).
  - `openclaw setup --node-manager` est plus limité et accepte actuellement `npm`,
    `pnpm` ou `bun`. Définissez manuellement `skills.install.nodeManager: "yarn"` si vous
    voulez des installations de Skills basées sur Yarn.
- `entries.<skillKey>` : remplacements par Skill.
- `agents.defaults.skills` : liste d’autorisation de Skills par défaut optionnelle héritée par les agents
  qui omettent `agents.list[].skills`.
- `agents.list[].skills` : liste d’autorisation finale optionnelle de Skills par agent ; les listes explicites
  remplacent les valeurs par défaut héritées au lieu de fusionner avec elles.

Champs par Skill :

- `enabled` : définissez `false` pour désactiver un Skill même s’il est fourni/installé.
- `env` : variables d’environnement injectées pour l’exécution de l’agent (uniquement si elles ne sont pas déjà définies).
- `apiKey` : commodité optionnelle pour les Skills qui déclarent une variable d’environnement principale.
  Prend en charge une chaîne en texte clair ou un objet SecretRef (`{ source, provider, id }`).

## Notes

- Les clés sous `entries` correspondent par défaut au nom du Skill. Si un Skill définit
  `metadata.openclaw.skillKey`, utilisez plutôt cette clé.
- L’ordre de priorité de chargement est `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills fournis →
  `skills.load.extraDirs`.
- Les modifications apportées aux Skills sont prises en compte au prochain tour de l’agent lorsque le surveillant est activé.

### Skills en bac à sable et variables d’environnement

Lorsqu’une session est **en bac à sable**, les processus de Skills s’exécutent dans le backend de bac à sable configuré. Le bac à sable n’hérite **pas** du `process.env` de l’hôte.

<Warning>
  Les `env` globaux et `skills.entries.<skill>.env`/`apiKey` s’appliquent uniquement aux exécutions sur **l’hôte**. Dans un bac à sable, ils n’ont aucun effet ; un Skill qui dépend de `GEMINI_API_KEY` échouera donc avec `apiKey not configured`, sauf si la variable est fournie séparément au bac à sable.
</Warning>

Utilisez l’un des éléments suivants :

- `agents.defaults.sandbox.docker.env` pour le backend Docker (ou `agents.list[].sandbox.docker.env` par agent).
- Intégrez l’environnement dans votre image de bac à sable personnalisée ou dans votre environnement de bac à sable distant.

## Connexe

<CardGroup cols={2}>
  <Card title="Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Ce que sont les Skills et comment ils se chargent.
  </Card>
  <Card title="Créer des Skills" href="/fr/tools/creating-skills" icon="hammer">
    Création de packs de Skills personnalisés.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="terminal">
    Catalogue de commandes natives et directives de chat.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma complet de `skills` et `agents.skills`.
  </Card>
</CardGroup>
