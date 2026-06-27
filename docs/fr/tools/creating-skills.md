---
read_when:
    - Vous créez une nouvelle Skill personnalisée
    - Vous avez besoin d’un flux de travail de démarrage rapide pour les Skills reposant sur SKILL.md
    - Vous souhaitez utiliser Skill Workshop pour proposer une compétence à l’examen par un agent
sidebarTitle: Creating skills
summary: Créez, testez et publiez des compétences d’espace de travail SKILL.md personnalisées pour vos agents OpenClaw.
title: Création de Skills
x-i18n:
    generated_at: "2026-06-27T18:17:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills indique à l’agent comment et quand utiliser les outils. Chaque compétence est un répertoire
contenant un fichier `SKILL.md` avec un frontmatter YAML et des instructions Markdown.
OpenClaw charge les Skills depuis plusieurs racines selon un [ordre de priorité](/fr/tools/skills#loading-order).

## Créer votre première compétence

<Steps>
  <Step title="Create the skill directory">
    Les Skills se trouvent dans le dossier `skills/` de votre espace de travail. Créez un répertoire pour votre
    nouvelle compétence :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Vous pouvez regrouper les Skills dans des sous-dossiers pour les organiser — la compétence reste
    nommée par le frontmatter de `SKILL.md`, pas par le chemin du dossier :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Créez `SKILL.md` dans le répertoire. Le frontmatter définit les métadonnées ;
    le corps fournit les instructions à l’agent.

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
    - Gardez le nom du répertoire et le `name` du frontmatter alignés.
    - `description` est affichée à l’agent et dans la découverte des commandes slash —
      gardez-la sur une seule ligne et sous 160 caractères.

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw surveille par défaut les fichiers `SKILL.md` sous les racines de Skills. Si le
    watcher est désactivé ou si vous continuez une session existante, démarrez-en une nouvelle
    afin que l’agent reçoive la liste actualisée :

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    Envoyez un message qui devrait déclencher la compétence :

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou ouvrez une discussion et demandez directement à l’agent. Utilisez `/skill hello-world` pour
    l’invoquer explicitement par son nom.

  </Step>
</Steps>

## Référence SKILL.md

### Champs obligatoires

| Champ         | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | Slug unique utilisant des lettres minuscules, des chiffres et des traits d’union        |
| `description` | Description sur une ligne affichée à l’agent et dans la sortie de découverte |

### Clés de frontmatter facultatives

| Champ                      | Valeur par défaut | Description                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | Expose la compétence comme commande slash utilisateur                                         |
| `disable-model-invocation` | `false` | Garde la compétence hors du prompt système de l’agent (elle s’exécute toujours via `/skill`)        |
| `command-dispatch`         | —       | Définissez sur `tool` pour acheminer la commande slash directement vers un outil, en contournant le modèle |
| `command-tool`             | —       | Nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini                         |
| `command-arg-mode`         | `raw`   | Pour l’acheminement vers un outil, transmet la chaîne d’arguments brute à l’outil                      |
| `homepage`                 | —       | URL affichée comme « Website » dans l’interface Skills macOS                                    |

Pour les champs de contrôle d’accès (`requires.bins`, `requires.env`, etc.), consultez
[Skills — Contrôle d’accès](/fr/tools/skills#gating).

### Utiliser `{baseDir}`

Utilisez `{baseDir}` dans le corps de la compétence pour référencer les fichiers dans le répertoire de la compétence
sans coder les chemins en dur :

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Ajouter une activation conditionnelle

Contrôlez votre compétence afin qu’elle ne se charge que lorsque ses dépendances sont disponibles :

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
    | `requires.bins` | Tous les binaires doivent exister sur `PATH` |
    | `requires.anyBins` | Au moins un binaire doit exister sur `PATH` |
    | `requires.env` | Chaque variable d’environnement doit exister dans le processus ou la configuration |
    | `requires.config` | Chaque chemin `openclaw.json` doit être truthy |
    | `os` | Filtre de plateforme : `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Définissez sur `true` pour ignorer tous les contrôles et toujours inclure la compétence |

    Référence complète : [Skills — Contrôle d’accès](/fr/tools/skills#gating).

  </Accordion>
  <Accordion title="Environment and API keys">
    Associez une clé d’API à une entrée de compétence dans `openclaw.json` :

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

    La clé est injectée dans le processus hôte uniquement pour ce tour d’agent.
    Elle n’atteint pas le bac à sable — consultez
    [variables d’environnement en bac à sable](/fr/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proposer via Skill Workshop

Pour les Skills rédigées par l’agent, ou lorsque vous voulez une revue opérateur avant qu’une compétence ne soit
mise en ligne, utilisez les propositions [Skill Workshop](/fr/tools/skill-workshop) au lieu d’écrire
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

Utilisez `--proposal-dir` lorsque la proposition inclut des fichiers de support :

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Le répertoire doit contenir `PROPOSAL.md`. Les fichiers de support peuvent aller dans `assets/`,
`examples/`, `references/`, `scripts/` ou `templates/`.

Après revue :

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consultez [Skill Workshop](/fr/tools/skill-workshop) pour le cycle de vie complet des propositions.

## Publier sur ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    Assurez-vous que `name`, `description` et tous les champs de contrôle d’accès `metadata.openclaw`
    sont définis. Ajoutez une URL `homepage` si vous avez une page de projet.
  </Step>
  <Step title="Install the ClawHub skill">
    La compétence ClawHub documente la forme actuelle de la commande de publication et les métadonnées
    requises :

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    Consultez [ClawHub — Publication](/fr/clawhub/publishing) pour le flux complet.

  </Step>
</Steps>

## Bonnes pratiques

<Tip>
  - **Soyez concis** — indiquez au modèle *quoi* faire, pas comment être une IA.
  - **Priorité à la sécurité** — si votre compétence utilise `exec`, assurez-vous que les prompts ne permettent pas
    l’injection de commandes arbitraires depuis une entrée non fiable.
  - **Testez localement** — utilisez `openclaw agent --message "..."` avant de partager.
  - **Utilisez ClawHub** — parcourez les Skills de la communauté sur [clawhub.ai](https://clawhub.ai)
    avant de construire à partir de zéro.
</Tip>

## Associés

<CardGroup cols={2}>
  <Card title="Skills reference" href="/fr/tools/skills" icon="puzzle-piece">
    Ordre de chargement, contrôle d’accès, listes d’autorisation et format SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    File de propositions pour les Skills rédigées par l’agent.
  </Card>
  <Card title="Skills config" href="/fr/tools/skills-config" icon="gear">
    Schéma complet de configuration `skills.*`.
  </Card>
  <Card title="ClawHub" href="/fr/clawhub" icon="cloud">
    Parcourez et publiez des Skills sur le registre public.
  </Card>
  <Card title="Building plugins" href="/fr/plugins/building-plugins" icon="plug">
    Les Plugins peuvent fournir des Skills avec les outils qu’elles documentent.
  </Card>
</CardGroup>
