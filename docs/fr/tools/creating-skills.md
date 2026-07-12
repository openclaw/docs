---
read_when:
    - Vous créez une nouvelle skill personnalisée
    - Vous avez besoin d’un flux de travail de démarrage rapide pour les Skills basées sur SKILL.md
    - Vous souhaitez utiliser Skill Workshop pour proposer une compétence à l’examen de l’agent
sidebarTitle: Creating skills
summary: Créez, testez et publiez des Skills d’espace de travail personnalisées au format SKILL.md pour vos agents OpenClaw.
title: Création de skills
x-i18n:
    generated_at: "2026-07-12T03:22:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills apprend à l’agent comment et quand utiliser les outils. Chaque Skill est un répertoire
contenant un fichier `SKILL.md` avec un frontmatter YAML et des instructions Markdown.
OpenClaw charge les Skills depuis plusieurs racines selon un [ordre de priorité](/fr/tools/skills#loading-order) défini.

## Créer votre première Skill

<Steps>
  <Step title="Create the skill directory">
    Les Skills se trouvent dans le dossier `skills/` de votre espace de travail :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Vous pouvez regrouper les Skills dans des sous-dossiers pour les organiser — la Skill
    reste nommée d’après le frontmatter de `SKILL.md`, et non d’après le chemin du dossier :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Le frontmatter définit les métadonnées ; le corps fournit les instructions à l’agent.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Règles de nommage :
    - Utilisez des lettres minuscules, des chiffres et des traits d’union pour `name`.
    - Faites correspondre le nom du répertoire et la valeur `name` du frontmatter.
    - `description` est affiché à l’agent et dans la découverte des commandes slash —
      conservez-la sur une seule ligne et limitez-la à 160 caractères.

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    Par défaut, OpenClaw surveille les fichiers `SKILL.md` sous les racines des Skills. Si
    la surveillance est désactivée ou si vous poursuivez une session existante, démarrez-en
    une nouvelle afin que l’agent reçoive la liste actualisée :

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Vous pouvez également ouvrir une conversation et interroger directement l’agent. Utilisez `/skill hello-world` pour
    l’invoquer explicitement par son nom.

  </Step>
</Steps>

## Référence de SKILL.md

### Champs obligatoires

| Champ         | Description                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| `name`        | Identifiant unique composé de lettres minuscules, de chiffres et de traits d’union |
| `description` | Description sur une ligne affichée à l’agent et dans la sortie de découverte   |

### Clés facultatives du frontmatter

| Champ                      | Valeur par défaut | Description                                                                                           |
| -------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`            | Expose la Skill comme commande slash utilisateur                                                      |
| `disable-model-invocation` | `false`           | Exclut la Skill du prompt système de l’agent (elle reste exécutable via `/skill`)                     |
| `command-dispatch`         | —                 | Définissez la valeur sur `tool` pour acheminer directement la commande slash vers un outil sans passer par le modèle |
| `command-tool`             | —                 | Nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini                                 |
| `command-arg-mode`         | `raw`             | Pour l’acheminement vers un outil, transmet à celui-ci la chaîne brute des arguments                  |
| `homepage`                 | —                 | URL affichée sous la forme « Website » dans l’interface Skills de macOS                               |

Pour les champs de filtrage (`requires.bins`, `requires.env`, etc.), consultez
[Skills — Filtrage](/fr/tools/skills#gating).

### Utilisation de `{baseDir}`

Référencez les fichiers situés dans le répertoire de la Skill sans coder les chemins en dur — l’
agent résout `{baseDir}` par rapport au propre répertoire de la Skill :

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Ajouter une activation conditionnelle

Filtrez votre Skill afin qu’elle ne soit chargée que lorsque ses dépendances sont disponibles :

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | Clé | Description |
    | --- | --- |
    | `requires.bins` | Tous les exécutables doivent exister dans `PATH` |
    | `requires.anyBins` | Au moins un exécutable doit exister dans `PATH` |
    | `requires.env` | Chaque variable d’environnement doit exister dans le processus ou la configuration |
    | `requires.config` | Chaque chemin `openclaw.json` doit avoir une valeur vraie |
    | `os` | Filtre de plateforme : `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Définissez sur `true` pour ignorer tous les filtres et toujours inclure la Skill |

    Référence complète : [Skills — Filtrage](/fr/tools/skills#gating).

  </Accordion>
  <Accordion title="Environment and API keys">
    Associez une clé API à une entrée de Skill dans `openclaw.json` :

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    La clé est injectée dans le processus hôte uniquement pendant ce tour de l’agent.
    Elle n’atteint pas le bac à sable — consultez
    [les variables d’environnement dans le bac à sable](/fr/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proposer via Skill Workshop

Pour les Skills rédigées par un agent, ou lorsque vous souhaitez qu’un opérateur les examine avant leur
mise en service, utilisez les propositions de [Skill Workshop](/fr/tools/skill-workshop) au lieu d’écrire
directement `SKILL.md`.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Utilisez `--proposal-dir` lorsque la proposition comprend des fichiers complémentaires :

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Le répertoire doit contenir `PROPOSAL.md` à sa racine. Les fichiers complémentaires doivent être placés sous
`assets/`, `examples/`, `references/`, `scripts/` ou `templates/`.

Après examen :

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consultez [Skill Workshop](/fr/tools/skill-workshop) pour connaître le cycle de vie complet d’une proposition.

## Publier sur ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    Vérifiez que `name`, `description` et tous les champs de filtrage `metadata.openclaw`
    sont définis. Ajoutez une URL `homepage` si vous disposez d’une page de projet.
  </Step>
  <Step title="Install the standalone ClawHub CLI and log in">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Publish">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Ajoutez `--version <version>` ou `--owner <owner>` pour remplacer la
    version déduite ou publier sous un propriétaire précis. Consultez
    [ClawHub — Publication](/fr/clawhub/publishing) et
    [CLI ClawHub](/fr/clawhub/cli) pour connaître le processus complet, la portée des propriétaires et les autres
    commandes de maintenance (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Bonnes pratiques

<Tip>
  - **Soyez concis** — indiquez au modèle *quoi* faire, et non comment se comporter en tant qu’IA.
  - **La sécurité avant tout** — si votre Skill utilise `exec`, veillez à ce que les prompts n’autorisent pas
    l’injection de commandes arbitraires provenant d’entrées non fiables.
  - **Testez localement** — utilisez `openclaw agent --message "..."` avant de partager.
  - **Utilisez ClawHub** — parcourez les Skills de la communauté sur [clawhub.ai](https://clawhub.ai)
    avant d’en créer une de zéro.
</Tip>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Skills reference" href="/fr/tools/skills" icon="puzzle-piece">
    Ordre de chargement, filtrage, listes d’autorisation et format de SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    File de propositions pour les Skills rédigées par un agent.
  </Card>
  <Card title="Skills config" href="/fr/tools/skills-config" icon="gear">
    Schéma de configuration `skills.*` complet.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourez et publiez des Skills dans le registre public.
  </Card>
  <Card title="Building plugins" href="/fr/plugins/building-plugins" icon="plug">
    Les Plugins peuvent fournir des Skills avec les outils qu’ils documentent.
  </Card>
</CardGroup>
