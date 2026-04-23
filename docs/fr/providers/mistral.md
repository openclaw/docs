---
read_when:
    - Vous voulez utiliser des modèles Mistral dans OpenClaw
    - Vous voulez la transcription temps réel Voxtral pour Voice Call
    - Vous avez besoin de l’onboarding de clé API Mistral et des références de modèle
summary: Utiliser les modèles Mistral et la transcription Voxtral avec OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T07:09:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw prend en charge Mistral à la fois pour le routage des modèles texte/image (`mistral/...`) et
la transcription audio via Voxtral dans la compréhension des médias.
Mistral peut aussi être utilisé pour les embeddings mémoire (`memorySearch.provider = "mistral"`).

- Provider : `mistral`
- Authentification : `MISTRAL_API_KEY`
- API : Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Démarrage

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API dans la [console Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ou passez directement la clé :

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

OpenClaw inclut actuellement ce catalogue Mistral groupé :

| Réf de modèle                    | Entrée      | Contexte | Sortie max | Remarques                                                       |
| -------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texte, image | 262,144 | 16,384     | Modèle par défaut                                                |
| `mistral/mistral-medium-2508`    | texte, image | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | texte, image | 128,000 | 16,384     | Mistral Small 4 ; raisonnement ajustable via l’API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texte, image | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | texte       | 256,000 | 4,096      | Code                                                             |
| `mistral/devstral-medium-latest` | texte       | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | texte       | 128,000 | 40,000     | Raisonnement activé                                              |

## Transcription audio (Voxtral)

Utilisez Voxtral pour la transcription audio par lot via le pipeline de
compréhension des médias.

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
Le chemin de transcription média utilise `/v1/audio/transcriptions`. Le modèle audio par défaut pour Mistral est `voxtral-mini-latest`.
</Tip>

## STT de streaming pour Appel vocal

Le Plugin `mistral` groupé enregistre Voxtral Realtime comme provider STT de
streaming pour Appel vocal.

| Paramètre    | Chemin de configuration                                              | Par défaut                              |
| ------------ | -------------------------------------------------------------------- | --------------------------------------- |
| Clé API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Revient à `MISTRAL_API_KEY`           |
| Modèle       | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602` |
| Encodage     | `...mistral.encoding`                                                | `pcm_mulaw`                             |
| Fréquence d’échantillonnage | `...mistral.sampleRate`                             | `8000`                                  |
| Délai cible  | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

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
OpenClaw utilise par défaut le STT temps réel Mistral en `pcm_mulaw` à 8 kHz afin qu’Appel vocal
puisse transférer directement les trames média Twilio. Utilisez `encoding: "pcm_s16le"` et une
valeur `sampleRate` correspondante uniquement si votre flux en amont est déjà en PCM brut.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Raisonnement ajustable (mistral-small-latest)">
    `mistral/mistral-small-latest` correspond à Mistral Small 4 et prend en charge le [raisonnement ajustable](https://docs.mistral.ai/capabilities/reasoning/adjustable) sur l’API Chat Completions via `reasoning_effort` (`none` minimise la réflexion supplémentaire dans la sortie ; `high` expose des traces complètes de réflexion avant la réponse finale).

    OpenClaw mappe le niveau de **thinking** de la session à l’API Mistral :

    | Niveau de thinking OpenClaw                     | Mistral `reasoning_effort` |
    | ----------------------------------------------- | -------------------------- |
    | **off** / **minimal**                           | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Les autres modèles du catalogue Mistral groupé n’utilisent pas ce paramètre. Continuez à utiliser les modèles `magistral-*` lorsque vous voulez le comportement natif Mistral orienté raisonnement en premier.
    </Note>

  </Accordion>

  <Accordion title="Embeddings mémoire">
    Mistral peut fournir des embeddings mémoire via `/v1/embeddings` (modèle par défaut : `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Authentification et URL de base">
    - L’authentification Mistral utilise `MISTRAL_API_KEY`.
    - L’URL de base du provider est par défaut `https://api.mistral.ai/v1`.
    - Le modèle par défaut d’onboarding est `mistral/mistral-large-latest`.
    - Z.A.I utilise l’authentification Bearer avec votre clé API.
  </Accordion>
</AccordionGroup>

## Liens connexes

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les providers, les références de modèle et le comportement de repli.
  </Card>
  <Card title="Compréhension des médias" href="/fr/nodes/media-understanding" icon="microphone">
    Configuration de la transcription audio et sélection du provider.
  </Card>
</CardGroup>
