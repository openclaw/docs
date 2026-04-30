---
read_when:
    - Vous créez une nouvelle compétence personnalisée dans votre espace de travail
    - Vous avez besoin d’un flux de travail de démarrage rapide pour les Skills basés sur SKILL.md
summary: Créer et tester des Skills d’espace de travail personnalisés avec SKILL.md
title: Créer des Skills
x-i18n:
    generated_at: "2026-04-30T07:50:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Les Skills apprennent à l’agent comment et quand utiliser les outils. Chaque skill est un répertoire
contenant un fichier `SKILL.md` avec un frontmatter YAML et des instructions en markdown.

Pour savoir comment les skills sont chargés et priorisés, consultez [Skills](/fr/tools/skills).

## Créer votre premier skill

<Steps>
  <Step title="Créer le répertoire du skill">
    Les Skills résident dans votre espace de travail. Créez un nouveau dossier :

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Écrire SKILL.md">
    Créez `SKILL.md` dans ce répertoire. Le frontmatter définit les métadonnées,
    et le corps markdown contient les instructions destinées à l’agent.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Utilisez des minuscules avec des traits d’union, des chiffres et des lettres minuscules pour le
    `name` du skill. Gardez le nom du dossier et le `name` du frontmatter alignés.

  </Step>

  <Step title="Ajouter des outils (facultatif)">
    Vous pouvez définir des schémas d’outils personnalisés dans le frontmatter ou indiquer à l’agent
    d’utiliser les outils système existants (comme `exec` ou `browser`). Les Skills peuvent également
    être fournis dans des plugins aux côtés des outils qu’ils documentent.

  </Step>

  <Step title="Charger le skill">
    Démarrez une nouvelle session afin qu’OpenClaw détecte le skill :

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Vérifiez que le skill a été chargé :

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Le tester">
    Envoyez un message qui devrait déclencher le skill :

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou discutez simplement avec l’agent et demandez-lui une salutation.

  </Step>
</Steps>

## Référence des métadonnées de skill

Le frontmatter YAML prend en charge ces champs :

| Champ                               | Obligatoire | Description                                                           |
| ----------------------------------- | ----------- | --------------------------------------------------------------------- |
| `name`                              | Oui         | Identifiant unique utilisant des lettres minuscules, des chiffres et des traits d’union |
| `description`                       | Oui         | Description sur une ligne affichée à l’agent                          |
| `metadata.openclaw.os`              | Non         | Filtre d’OS (`["darwin"]`, `["linux"]`, etc.)                         |
| `metadata.openclaw.requires.bins`   | Non         | Binaires requis dans PATH                                             |
| `metadata.openclaw.requires.config` | Non         | Clés de configuration requises                                        |

## Bonnes pratiques

- **Soyez concis** — indiquez au modèle _quoi_ faire, pas comment être une IA
- **La sécurité d’abord** — si votre skill utilise `exec`, assurez-vous que les prompts ne permettent pas l’injection de commandes arbitraires depuis une entrée non fiable
- **Testez localement** — utilisez `openclaw agent --message "..."` pour tester avant de partager
- **Utilisez ClawHub** — parcourez les skills et contribuez-en sur [ClawHub](https://clawhub.ai)

## Où résident les skills

| Emplacement                     | Priorité    | Portée                |
| ------------------------------- | ----------- | --------------------- |
| `\<workspace\>/skills/`         | La plus élevée | Par agent             |
| `\<workspace\>/.agents/skills/` | Élevée      | Agent par espace de travail |
| `~/.agents/skills/`             | Moyenne     | Profil d’agent partagé |
| `~/.openclaw/skills/`           | Moyenne     | Partagé (tous les agents) |
| Fourni avec OpenClaw            | Faible      | Globale               |
| `skills.load.extraDirs`         | La plus faible | Dossiers partagés personnalisés |

## Associé

- [Référence des Skills](/fr/tools/skills) — chargement, priorité et règles de contrôle
- [Configuration des Skills](/fr/tools/skills-config) — schéma de configuration `skills.*`
- [ClawHub](/fr/tools/clawhub) — registre public de skills
- [Créer des Plugins](/fr/plugins/building-plugins) — les plugins peuvent fournir des skills
