---
read_when:
    - Vous voulez utiliser Groq avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé d’API ou de l’option d’authentification CLI
    - Vous configurez la transcription audio Whisper sur Groq
summary: Configuration de Groq (authentification + sélection du modèle + transcription Whisper)
title: Groq
x-i18n:
    generated_at: "2026-05-06T07:36:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) fournit une inférence ultra-rapide sur des modèles à poids ouverts (Llama, Gemma, Kimi, Qwen, GPT OSS, et plus encore) à l’aide d’un matériel LPU personnalisé. OpenClaw inclut un plugin Groq intégré qui enregistre à la fois un fournisseur de chat compatible OpenAI et un fournisseur de compréhension multimédia audio.

| Propriété              | Valeur                                   |
| ---------------------- | ---------------------------------------- |
| Id du fournisseur      | `groq`                                   |
| Plugin                 | intégré, `enabledByDefault: true`        |
| Variable d’env auth    | `GROQ_API_KEY`                           |
| Indicateur d’onboarding | `--auth-choice groq-api-key`             |
| API                    | compatible OpenAI (`openai-completions`) |
| URL de base            | `https://api.groq.com/openai/v1`         |
| Transcription audio    | `whisper-large-v3-turbo` (par défaut)    |
| Chat par défaut suggéré | `groq/llama-3.3-70b-versatile`           |

## Premiers pas

<Steps>
  <Step title="Obtenir une clé API">
    Créez une clé API sur [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Définir la clé API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Env only
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

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

OpenClaw fournit un catalogue Groq basé sur un manifeste avec des entrées de raisonnement et sans raisonnement. Exécutez `openclaw models list --provider groq` pour voir les lignes intégrées correspondant à votre version installée, ou consultez [console.groq.com/docs/models](https://console.groq.com/docs/models) pour la liste de référence de Groq.

| Réf. du modèle                                      | Nom                           | Raisonnement | Entrée       | Contexte |
| ---------------------------------------------------- | ----------------------------- | ------------ | ------------ | -------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | non          | texte        | 131,072  |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | non          | texte        | 131,072  |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | non          | texte + image | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | non          | texte + image | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | non          | texte        | 8,192    |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | non          | texte        | 8,192    |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | non          | texte        | 8,192    |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | non          | texte        | 32,768   |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | non          | texte        | 131,072  |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | non          | texte        | 262,144  |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | oui          | texte        | 131,072  |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | oui          | texte        | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | oui          | texte        | 131,072  |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | oui          | texte        | 131,072  |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | oui          | texte        | 131,072  |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | oui          | texte        | 131,072  |
| `groq/groq/compound`                                 | Compound                      | oui          | texte        | 131,072  |
| `groq/groq/compound-mini`                            | Compound Mini                 | oui          | texte        | 131,072  |

<Tip>
  Le catalogue évolue avec chaque version d’OpenClaw. `openclaw models list --provider groq` affiche les lignes connues de votre version installée ; recoupez avec [console.groq.com/docs/models](https://console.groq.com/docs/models) pour les modèles récemment ajoutés ou obsolètes.
</Tip>

## Modèles de raisonnement

OpenClaw associe ses niveaux `/think` partagés aux valeurs `reasoning_effort` propres aux modèles Groq :

- Pour `qwen/qwen3-32b`, la pensée désactivée envoie `none` et la pensée activée envoie `default`.
- Pour les modèles de raisonnement GPT OSS de Groq (`openai/gpt-oss-*`), OpenClaw envoie `low`, `medium` ou `high` selon le niveau `/think`. La pensée désactivée omet `reasoning_effort`, car ces modèles ne prennent pas en charge une valeur désactivée.
- DeepSeek R1 Distill, Qwen QwQ et Compound utilisent la surface de raisonnement native de Groq ; `/think` contrôle la visibilité, mais le modèle raisonne toujours.

Consultez [Modes de pensée](/fr/tools/thinking) pour les niveaux `/think` partagés et la façon dont OpenClaw les traduit par fournisseur.

## Transcription audio

Le plugin Groq intégré enregistre aussi un **fournisseur de compréhension multimédia audio** afin que les messages vocaux puissent être transcrits via la surface partagée `tools.media.audio`.

| Propriété                  | Valeur                                    |
| -------------------------- | ---------------------------------------- |
| Chemin de config partagé   | `tools.media.audio`                       |
| URL de base par défaut     | `https://api.groq.com/openai/v1`          |
| Modèle par défaut          | `whisper-large-v3-turbo`                  |
| Priorité automatique       | 20                                        |
| Point de terminaison API   | `/audio/transcriptions` compatible OpenAI |

Pour faire de Groq le backend audio par défaut :

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
  <Accordion title="Disponibilité de l’environnement pour le daemon">
    Si le Gateway s’exécute comme service géré (launchd, systemd, Docker), `GROQ_API_KEY` doit être visible par ce processus — pas seulement par votre shell interactif.

    <Warning>
      Une clé présente uniquement dans `~/.profile` n’aidera pas un daemon launchd ou systemd, sauf si cet environnement y est aussi importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` pour la rendre lisible depuis le processus du gateway.
    </Warning>

  </Accordion>

  <Accordion title="Ids de modèles Groq personnalisés">
    OpenClaw accepte n’importe quel id de modèle Groq à l’exécution. Utilisez l’id exact affiché par Groq et préfixez-le avec `groq/`. Le catalogue intégré couvre les cas courants ; les ids absents du catalogue passent par le modèle compatible OpenAI par défaut.

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

## Associés

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Modes de pensée" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement et interaction avec les politiques des fournisseurs.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet incluant les paramètres de fournisseur et d’audio.
  </Card>
  <Card title="Console Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Tableau de bord Groq, documentation de l’API et tarifs.
  </Card>
</CardGroup>
