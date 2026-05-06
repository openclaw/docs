---
read_when:
    - Vous souhaitez utiliser les modèles Mistral dans OpenClaw
    - Vous souhaitez la transcription en temps réel de Voxtral pour les appels vocaux
    - Vous avez besoin de l’intégration de la clé API Mistral et des références de modèles
summary: Utiliser les modèles Mistral et la transcription Voxtral avec OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T07:36:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw inclut un Plugin Mistral intégré qui enregistre quatre contrats : complétions de chat, compréhension multimédia (transcription par lots Voxtral), STT en temps réel pour les appels vocaux (Voxtral Realtime) et embeddings de mémoire (`mistral-embed`).

| Propriété           | Valeur                                      |
| ------------------- | ------------------------------------------- |
| ID du fournisseur   | `mistral`                                   |
| Plugin              | intégré, `enabledByDefault: true`           |
| Var. d’env. d’auth. | `MISTRAL_API_KEY`                           |
| Option d’onboarding | `--auth-choice mistral-api-key`             |
| Option CLI directe  | `--mistral-api-key <key>`                   |
| API                 | compatible OpenAI (`openai-completions`)    |
| URL de base         | `https://api.mistral.ai/v1`                 |
| Modèle par défaut   | `mistral/mistral-large-latest`              |
| Modèle d’embedding  | `mistral-embed`                             |
| Lot Voxtral         | `voxtral-mini-latest` (transcription audio) |
| Voxtral temps réel  | `voxtral-mini-transcribe-realtime-2602`     |

## Premiers pas

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API dans la [console Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ou transmettez directement la clé :

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Définir un modèle par défaut">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catalogue LLM intégré

OpenClaw fournit actuellement ce catalogue Mistral intégré :

| Réf. du modèle                  | Entrée      | Contexte | Sortie max. | Notes                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texte, image | 262,144 | 16,384     | Modèle par défaut                                                |
| `mistral/mistral-medium-2508`    | texte, image | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | texte, image | 128,000 | 16,384     | Mistral Small 4 ; raisonnement ajustable via l’API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texte, image | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | texte        | 256,000 | 4,096      | Codage                                                           |
| `mistral/devstral-medium-latest` | texte        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | texte        | 128,000 | 40,000     | Raisonnement activé                                              |

## Transcription audio (Voxtral)

Utilisez Voxtral pour la transcription audio par lots via le pipeline de
compréhension multimédia.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Le chemin de transcription multimédia utilise `/v1/audio/transcriptions`. Le modèle audio par défaut pour Mistral est `voxtral-mini-latest`.
</Tip>

## STT en streaming pour les appels vocaux

Le Plugin `mistral` intégré enregistre Voxtral Realtime comme fournisseur STT
en streaming pour les appels vocaux.

| Paramètre    | Chemin de configuration                                                | Par défaut                              |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Clé API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Se rabat sur `MISTRAL_API_KEY`          |
| Modèle       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Encodage     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Taux d’échantillonnage | `...mistral.sampleRate`                                      | `8000`                                  |
| Délai cible  | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw configure par défaut le STT temps réel Mistral sur `pcm_mulaw` à 8 kHz afin que les appels vocaux
puissent transmettre directement les trames multimédias Twilio. Utilisez `encoding: "pcm_s16le"` et un
`sampleRate` correspondant uniquement si votre flux en amont est déjà du PCM brut.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Raisonnement ajustable (mistral-small-latest)">
    `mistral/mistral-small-latest` correspond à Mistral Small 4 et prend en charge le [raisonnement ajustable](https://docs.mistral.ai/capabilities/reasoning/adjustable) sur l’API Chat Completions via `reasoning_effort` (`none` minimise la réflexion supplémentaire dans la sortie ; `high` affiche les traces complètes de réflexion avant la réponse finale).

    OpenClaw mappe le niveau de **thinking** de la session à l’API Mistral :

    | Niveau de thinking OpenClaw                    | `reasoning_effort` Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Les autres modèles du catalogue Mistral intégré n’utilisent pas ce paramètre. Continuez à utiliser les modèles `magistral-*` lorsque vous voulez le comportement natif de Mistral axé d’abord sur le raisonnement.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de mémoire">
    Mistral peut fournir des embeddings de mémoire via `/v1/embeddings` (modèle par défaut : `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Authentification et URL de base">
    - L’authentification Mistral utilise `MISTRAL_API_KEY` (en-tête Bearer).
    - L’URL de base du fournisseur est par défaut `https://api.mistral.ai/v1` et accepte le format de requête chat-completions standard compatible OpenAI.
    - Le modèle d’onboarding par défaut est `mistral/mistral-large-latest`.
    - Remplacez l’URL de base sous `models.providers.mistral.baseUrl` uniquement lorsque Mistral publie explicitement un point de terminaison régional dont vous avez besoin.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Compréhension multimédia" href="/fr/nodes/media-understanding" icon="microphone">
    Configuration de la transcription audio et sélection du fournisseur.
  </Card>
</CardGroup>
