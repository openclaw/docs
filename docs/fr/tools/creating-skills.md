---
read_when:
    - Vous créez une nouvelle compétence personnalisée
    - Vous avez besoin d’un workflow de démarrage rapide pour les Skills basées sur SKILL.md
    - Vous souhaitez utiliser Skill Workshop pour proposer une compétence à l’examen de l’agent
sidebarTitle: Creating skills
summary: Créez, testez et publiez des compétences d’espace de travail SKILL.md personnalisées pour vos agents OpenClaw.
title: Création de Skills
x-i18n:
    generated_at: "2026-07-12T15:52:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Les Skills apprennent à l’agent comment et quand utiliser les outils. Chaque Skill est un répertoire
contenant un fichier `SKILL.md` avec un frontmatter YAML et des instructions Markdown.
OpenClaw charge les Skills depuis plusieurs racines selon un [ordre de priorité](/fr/tools/skills#loading-order) défini.

## Créer votre premier Skill

<Steps>
  <Step title="Créer le répertoire du Skill">
    Les Skills se trouvent dans le dossier `skills/` de votre espace de travail :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Vous pouvez regrouper les Skills dans des sous-dossiers à des fins d’organisation — le Skill reste
    nommé par le frontmatter de `SKILL.md`, et non par le chemin du dossier :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # le nom du Skill reste "hello-world", appelé avec /hello-world
    ```

  </Step>

  <Step title="Écrire SKILL.md">
    Le frontmatter définit les métadonnées ; le corps fournit les instructions à l’agent.

    ```markdown
    ---
    name: hello-world
    description: Un Skill simple qui affiche un message de bienvenue.
    ---

    # Bonjour tout le monde

    Lorsque l’utilisateur demande un message de bienvenue, utilisez l’outil `exec` pour exécuter :

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Règles de nommage :
    - Utilisez des lettres minuscules, des chiffres et des traits d’union pour `name`.
    - Faites correspondre le nom du répertoire et la valeur `name` du frontmatter.
    - `description` est affiché à l’agent et dans la découverte des commandes slash —
      conservez-le sur une seule ligne et limitez-le à 160 caractères.

  </Step>

  <Step title="Vérifier le chargement du Skill">
    ```bash
    openclaw skills list
    ```

    Par défaut, OpenClaw surveille les fichiers `SKILL.md` sous les racines des Skills. Si la
    surveillance est désactivée ou si vous poursuivez une session existante, démarrez-en une
    nouvelle afin que l’agent reçoive la liste actualisée :

    ```bash
    # Depuis le chat — archiver la session actuelle et en démarrer une nouvelle
    /new

    # Ou redémarrer le Gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Le tester">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Vous pouvez également ouvrir un chat et interroger directement l’agent. Utilisez `/skill hello-world` pour
    l’appeler explicitement par son nom.

  </Step>
</Steps>

## Référence de SKILL.md

### Champs obligatoires

| Champ         | Description                                                                          |
| ------------- | ------------------------------------------------------------------------------------ |
| `name`        | Identifiant unique utilisant des lettres minuscules, des chiffres et des traits d’union |
| `description` | Description sur une ligne affichée à l’agent et dans la sortie de découverte         |

### Clés facultatives du frontmatter

| Champ                      | Valeur par défaut | Description                                                                                          |
| -------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`            | Expose le Skill comme commande slash accessible à l’utilisateur                                     |
| `disable-model-invocation` | `false`           | Exclut le Skill du prompt système de l’agent (il reste exécutable via `/skill`)                       |
| `command-dispatch`         | —                 | Définissez sur `tool` pour acheminer directement la commande slash vers un outil, sans passer par le modèle |
| `command-tool`             | —                 | Nom de l’outil à appeler lorsque `command-dispatch: tool` est défini                                 |
| `command-arg-mode`         | `raw`             | Pour l’acheminement vers un outil, transmet la chaîne brute des arguments à l’outil                  |
| `homepage`                 | —                 | URL affichée comme « Website » dans l’interface Skills de macOS                                      |

Pour les champs de conditions d’activation (`requires.bins`, `requires.env`, etc.), consultez
[Skills — Conditions d’activation](/fr/tools/skills#gating).

### Utiliser `{baseDir}`

Référencez les fichiers situés dans le répertoire du Skill sans coder les chemins en dur — l’
agent résout `{baseDir}` par rapport au propre répertoire du Skill :

```markdown
Exécutez le script auxiliaire situé à `{baseDir}/scripts/run.sh`.
```

## Ajouter une activation conditionnelle

Ajoutez des conditions à votre Skill afin qu’il ne soit chargé que lorsque ses dépendances sont disponibles :

```markdown
---
name: gemini-search
description: Effectuer une recherche avec la CLI Gemini.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Options de conditions d’activation">
    | Clé | Description |
    | --- | --- |
    | `requires.bins` | Tous les exécutables doivent exister dans `PATH` |
    | `requires.anyBins` | Au moins un exécutable doit exister dans `PATH` |
    | `requires.env` | Chaque variable d’environnement doit exister dans le processus ou la configuration |
    | `requires.config` | Chaque chemin `openclaw.json` doit avoir une valeur évaluée comme vraie |
    | `os` | Filtre de plateforme : `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Définissez sur `true` pour ignorer toutes les conditions et toujours inclure le Skill |

    Référence complète : [Skills — Conditions d’activation](/fr/tools/skills#gating).

  </Accordion>
  <Accordion title="Environnement et clés d’API">
    Associez une clé d’API à une entrée de Skill dans `openclaw.json` :

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

    La clé est injectée dans le processus hôte uniquement pour ce tour de l’agent.
    Elle n’atteint pas le bac à sable — consultez
    [les variables d’environnement dans le bac à sable](/fr/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proposer via Skill Workshop

Pour les Skills rédigés par l’agent, ou lorsque vous souhaitez qu’un opérateur les examine avant leur
mise en service, utilisez les propositions de [Skill Workshop](/fr/tools/skill-workshop) au lieu d’écrire
directement `SKILL.md`.

```bash
# Proposer un tout nouveau Skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Proposer une mise à jour d’un Skill existant
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

Le répertoire doit contenir `PROPOSAL.md` à sa racine. Les fichiers complémentaires se placent sous
`assets/`, `examples/`, `references/`, `scripts/` ou `templates/`.

Après l’examen :

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consultez [Skill Workshop](/fr/tools/skill-workshop) pour connaître le cycle de vie complet d’une proposition.

## Publier sur ClawHub

<Steps>
  <Step title="Vérifier que votre SKILL.md est complet">
    Assurez-vous que `name`, `description` et tous les champs de conditions `metadata.openclaw`
    sont définis. Ajoutez une URL `homepage` si vous disposez d’une page de projet.
  </Step>
  <Step title="Installer la CLI ClawHub autonome et vous connecter">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Publier">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Ajoutez `--version <version>` ou `--owner <owner>` pour remplacer la version déduite
    ou publier sous un propriétaire spécifique. Consultez
    [ClawHub — Publication](/fr/clawhub/publishing) et
    [CLI ClawHub](/fr/clawhub/cli) pour connaître le processus complet, la portée des propriétaires et les autres
    commandes de maintenance (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Bonnes pratiques

<Tip>
  - **Soyez concis** — indiquez au modèle *quoi* faire, et non comment être une IA.
  - **La sécurité avant tout** — si votre Skill utilise `exec`, assurez-vous que les prompts n’autorisent pas
    l’injection de commandes arbitraires depuis des entrées non fiables.
  - **Testez localement** — utilisez `openclaw agent --message "..."` avant de partager.
  - **Utilisez ClawHub** — parcourez les Skills de la communauté sur [clawhub.ai](https://clawhub.ai)
    avant de partir de zéro.
</Tip>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Référence des Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Ordre de chargement, conditions d’activation, listes d’autorisation et format de SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    File de propositions pour les Skills rédigés par l’agent.
  </Card>
  <Card title="Configuration des Skills" href="/fr/tools/skills-config" icon="gear">
    Schéma de configuration `skills.*` complet.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourez et publiez des Skills dans le registre public.
  </Card>
  <Card title="Créer des Plugins" href="/fr/plugins/building-plugins" icon="plug">
    Les Plugins peuvent fournir des Skills avec les outils qu’ils documentent.
  </Card>
</CardGroup>
