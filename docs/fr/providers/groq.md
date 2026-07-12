---
read_when:
    - Vous souhaitez utiliser Groq avec OpenClaw
    - Vous avez besoin de la variable d’environnement de la clé API ou de l’option d’authentification de la CLI.
    - Vous configurez la transcription audio Whisper sur Groq
summary: Configuration de Groq (authentification + sélection du modèle + transcription Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T15:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) fournit une inférence ultrarapide sur des modèles à poids ouverts (Llama, Gemma, Kimi, Qwen, GPT OSS et bien d’autres) grâce à du matériel LPU personnalisé. Le Plugin Groq enregistre à la fois un fournisseur de chat compatible avec OpenAI et un fournisseur de compréhension des médias audio.

| Propriété                       | Valeur                                   |
| ------------------------------- | ---------------------------------------- |
| Identifiant du fournisseur      | `groq`                                   |
| Plugin                          | paquet externe officiel                  |
| Variable d’environnement d’authentification | `GROQ_API_KEY`                |
| API                             | compatible avec OpenAI (`openai-completions`) |
| URL de base                     | `https://api.groq.com/openai/v1`         |
| Transcription audio             | `whisper-large-v3-turbo` (par défaut)    |
| Modèle de chat par défaut suggéré | `groq/llama-3.3-70b-versatile`         |

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Bien démarrer

<Steps>
  <Step title="Obtenir une clé API">
    Créez une clé API sur [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Définir la clé API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Définir un modèle par défaut">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="Vérifier que le catalogue est accessible">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Exemple de fichier de configuration

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Catalogue intégré

OpenClaw fournit un catalogue Groq basé sur un manifeste, comprenant des entrées avec et sans raisonnement. Exécutez `openclaw models list --provider groq` pour afficher les lignes statiques correspondant à votre version installée, ou consultez [console.groq.com/docs/models](https://console.groq.com/docs/models) pour obtenir la liste de référence de Groq.

| Référence du modèle                              | Nom                     | Raisonnement | Entrée       | Contexte |
| ------------------------------------------------ | ----------------------- | ------------ | ------------ | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | non          | texte        | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | non          | texte        | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | non          | texte + image | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | oui          | texte        | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | oui          | texte        | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | oui          | texte        | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | oui          | texte        | 131,072  |
| `groq/groq/compound`                             | Compound                | oui          | texte        | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | oui          | texte        | 131,072  |

<Tip>
  Le catalogue évolue à chaque version d’OpenClaw. `openclaw models list --provider groq` affiche les lignes connues de votre version installée ; comparez-les avec [console.groq.com/docs/models](https://console.groq.com/docs/models) pour connaître les modèles récemment ajoutés ou obsolètes.
</Tip>

## Modèles de raisonnement

Les modèles de raisonnement Groq (`reasoning: true` dans le tableau ci-dessus) associent les niveaux `/think` partagés d’OpenClaw aux valeurs `reasoning_effort` `low`, `medium` ou `high`. `/think off` ou `/think none` omet `reasoning_effort` de la requête au lieu d’envoyer une valeur désactivée.

Consultez [Modes de réflexion](/fr/tools/thinking) pour connaître les niveaux `/think` partagés et la manière dont OpenClaw les traduit pour chaque fournisseur.

## Transcription audio

Le Plugin Groq enregistre également un **fournisseur de compréhension des médias audio**, afin que les messages vocaux puissent être transcrits par l’intermédiaire de la surface partagée `tools.media.audio`.

| Propriété                         | Valeur                                    |
| --------------------------------- | ----------------------------------------- |
| Chemin de configuration partagé   | `tools.media.audio`                       |
| URL de base par défaut            | `https://api.groq.com/openai/v1`          |
| Modèle par défaut                 | `whisper-large-v3-turbo`                  |
| Priorité automatique              | 20                                        |
| Point de terminaison de l’API     | `/audio/transcriptions` compatible avec OpenAI |

Pour définir Groq comme moteur audio par défaut :

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Disponibilité de l’environnement pour le démon">
    Si le Gateway s’exécute en tant que service géré (launchd, systemd, Docker), `GROQ_API_KEY` doit être visible par ce processus, et pas seulement par votre shell interactif.

    <Warning>
      Une clé exportée uniquement dans un shell interactif ne sera pas accessible à un démon launchd ou systemd, sauf si cet environnement y est également importé. Définissez la clé dans `~/.openclaw/.env` ou au moyen de `env.shellEnv` afin que le processus du Gateway puisse la lire.
    </Warning>

  </Accordion>

  <Accordion title="Identifiants de modèles Groq personnalisés">
    OpenClaw accepte à l’exécution tout identifiant de modèle Groq. Utilisez l’identifiant exact indiqué par Groq et préfixez-le avec `groq/`. Le catalogue statique couvre les cas courants ; les identifiants absents du catalogue utilisent le modèle générique compatible avec OpenAI par défaut.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Modes de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement et interaction avec la politique du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, comprenant les paramètres du fournisseur et de l’audio.
  </Card>
  <Card title="Console Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Tableau de bord Groq, documentation de l’API et tarification.
  </Card>
</CardGroup>
