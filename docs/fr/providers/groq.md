---
read_when:
    - Vous voulez utiliser Groq avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
    - Vous configurez la transcription audio Whisper sur Groq
summary: Configuration de Groq (authentification + sélection du modèle + transcription Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:05:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) fournit une inférence ultra-rapide sur des modèles à poids ouverts (Llama, Gemma, Kimi, Qwen, GPT OSS, et plus encore) à l’aide de matériel LPU personnalisé. Le plugin Groq enregistre à la fois un fournisseur de chat compatible OpenAI et un fournisseur de compréhension multimédia audio.

| Propriété              | Valeur                                   |
| ---------------------- | ---------------------------------------- |
| ID du fournisseur      | `groq`                                   |
| Plugin                 | package externe officiel                 |
| Variable d’env. d’auth | `GROQ_API_KEY`                           |
| API                    | compatible OpenAI (`openai-completions`) |
| URL de base            | `https://api.groq.com/openai/v1`         |
| Transcription audio    | `whisper-large-v3-turbo` (par défaut)    |
| Chat par défaut suggéré | `groq/llama-3.3-70b-versatile`          |

## Installer le plugin

Installez le plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Premiers pas

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

OpenClaw fournit un catalogue Groq adossé à un manifeste, avec des entrées de raisonnement et sans raisonnement. Exécutez `openclaw models list --provider groq` pour afficher les lignes statiques de votre version installée, ou consultez [console.groq.com/docs/models](https://console.groq.com/docs/models) pour la liste de référence de Groq.

| Réf. du modèle                                  | Nom                     | Raisonnement | Entrée        | Contexte |
| ------------------------------------------------ | ----------------------- | ------------ | ------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | non          | texte         | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | non          | texte         | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | non          | texte + image | 131,072  |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | oui          | texte         | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | oui          | texte         | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | oui          | texte         | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | oui          | texte         | 131,072  |
| `groq/groq/compound`                             | Compound                | oui          | texte         | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | oui          | texte         | 131,072  |

<Tip>
  Le catalogue évolue avec chaque version d’OpenClaw. `openclaw models list --provider groq` affiche les lignes connues de votre version installée ; vérifiez avec [console.groq.com/docs/models](https://console.groq.com/docs/models) pour les modèles nouvellement ajoutés ou dépréciés.
</Tip>

## Modèles de raisonnement

OpenClaw associe ses niveaux `/think` partagés aux valeurs `reasoning_effort` propres aux modèles Groq :

- Pour `qwen/qwen3-32b`, la réflexion désactivée envoie `none` et la réflexion activée envoie `default`.
- Pour les modèles de raisonnement Groq GPT OSS (`openai/gpt-oss-*`), OpenClaw envoie `low`, `medium` ou `high` selon le niveau `/think`. La réflexion désactivée omet `reasoning_effort`, car ces modèles ne prennent pas en charge de valeur désactivée.
- DeepSeek R1 Distill, Qwen QwQ et Compound utilisent la surface de raisonnement native de Groq ; `/think` contrôle la visibilité, mais le modèle raisonne toujours.

Consultez [Modes de réflexion](/fr/tools/thinking) pour les niveaux `/think` partagés et la manière dont OpenClaw les traduit par fournisseur.

## Transcription audio

Le plugin de Groq enregistre aussi un **fournisseur de compréhension multimédia audio** afin que les messages vocaux puissent être transcrits via la surface partagée `tools.media.audio`.

| Propriété                  | Valeur                                    |
| -------------------------- | ----------------------------------------- |
| Chemin de configuration partagé | `tools.media.audio`                  |
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
  <Accordion title="Disponibilité de l’environnement pour le démon">
    Si Gateway s’exécute comme service géré (launchd, systemd, Docker), `GROQ_API_KEY` doit être visible par ce processus, pas seulement par votre shell interactif.

    <Warning>
      Une clé exportée uniquement dans un shell interactif n’aidera pas un démon launchd ou systemd, sauf si cet environnement y est également importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` pour la rendre lisible par le processus Gateway.
    </Warning>

  </Accordion>

  <Accordion title="IDs de modèles Groq personnalisés">
    OpenClaw accepte tout ID de modèle Groq à l’exécution. Utilisez l’ID exact affiché par Groq et préfixez-le avec `groq/`. Le catalogue statique couvre les cas courants ; les IDs absents du catalogue utilisent le modèle compatible OpenAI par défaut.

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

## Connexe

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Modes de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement et interaction avec la politique des fournisseurs.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, y compris les paramètres de fournisseur et audio.
  </Card>
  <Card title="Console Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Tableau de bord Groq, documentation API et tarification.
  </Card>
</CardGroup>
