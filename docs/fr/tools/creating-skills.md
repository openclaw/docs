---
read_when:
    - Vous créez une nouvelle compétence personnalisée dans votre espace de travail
    - Vous avez besoin d’un flux de travail de démarrage rapide pour les Skills basées sur SKILL.md
summary: Créer et tester des Skills d’espace de travail personnalisés avec SKILL.md
title: Création de Skills
x-i18n:
    generated_at: "2026-05-11T20:57:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: a468a0b21f4e43542b175b8acb8ad8b19dbbea06ce8e0b97c48206bf88a661c5
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills apprennent à l’agent comment et quand utiliser les outils. Chaque skill est un répertoire
contenant un fichier `SKILL.md` avec un frontmatter YAML et des instructions en markdown.

Pour savoir comment les skills sont chargées et priorisées, consultez [Skills](/fr/tools/skills).

## Créer votre première skill

<Steps>
  <Step title="Créer le répertoire de la skill">
    Les skills résident dans votre espace de travail. Créez un nouveau dossier :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Écrire SKILL.md">
    Créez `SKILL.md` dans ce répertoire. Le frontmatter définit les métadonnées,
    et le corps en markdown contient les instructions pour l’agent.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Utilisez le kebab-case avec des lettres minuscules, des chiffres et des traits d’union pour le
    `name` de la skill. Gardez le nom du dossier et le `name` du frontmatter alignés.

  </Step>

  <Step title="Ajouter des outils (facultatif)">
    Vous pouvez définir des schémas d’outils personnalisés dans le frontmatter ou demander à l’agent
    d’utiliser les outils système existants (comme `exec` ou `browser`). Les skills peuvent aussi
    être livrées dans des plugins avec les outils qu’elles documentent.

  </Step>

  <Step title="Charger la skill">
    Démarrez une nouvelle session pour qu’OpenClaw détecte la skill :

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Vérifiez que la skill est chargée :

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="La tester">
    Envoyez un message qui devrait déclencher la skill :

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou discutez simplement avec l’agent et demandez une salutation.

  </Step>
</Steps>

## Référence des métadonnées de skill

Le frontmatter YAML prend en charge ces champs :

| Champ                               | Obligatoire | Description                                                    |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | Oui      | Identifiant unique utilisant des lettres minuscules, des chiffres et des traits d’union |
| `description`                       | Oui      | Description sur une ligne affichée à l’agent                        |
| `metadata.openclaw.os`              | Non       | Filtre d’OS (`["darwin"]`, `["linux"]`, etc.)                    |
| `metadata.openclaw.requires.bins`   | Non       | Binaires requis dans PATH                                      |
| `metadata.openclaw.requires.config` | Non       | Clés de configuration requises                                           |

## Bonnes pratiques

- **Soyez concis** — indiquez au modèle _quoi_ faire, pas comment être une IA
- **La sécurité d’abord** — si votre skill utilise `exec`, assurez-vous que les prompts ne permettent pas l’injection de commandes arbitraires depuis une entrée non fiable
- **Testez localement** — utilisez `openclaw agent --message "..."` pour tester avant de partager
- **Utilisez ClawHub** — parcourez les skills et contribuez-y sur [ClawHub](https://clawhub.ai)

## Où résident les skills

| Emplacement                        | Priorité | Portée                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | La plus élevée    | Par agent             |
| `\<workspace\>/.agents/skills/` | Élevée       | Agent par espace de travail   |
| `~/.agents/skills/`             | Moyenne     | Profil d’agent partagé  |
| `~/.openclaw/skills/`           | Moyenne     | Partagé (tous les agents)   |
| Intégrées (livrées avec OpenClaw) | Faible        | Globale                |
| `skills.load.extraDirs`         | La plus faible     | Dossiers partagés personnalisés |

## Connexe

- [Référence Skills](/fr/tools/skills) — règles de chargement, de priorité et de contrôle
- [Configuration Skills](/fr/tools/skills-config) — schéma de configuration `skills.*`
- [ClawHub](/fr/clawhub) — registre public de skills
- [Créer des Plugins](/fr/plugins/building-plugins) — les plugins peuvent livrer des skills
