---
read_when:
    - Vous souhaitez utiliser les modèles Mistral dans OpenClaw
    - Vous souhaitez la transcription realtime Voxtral pour Voice Call
    - Vous avez besoin de l’onboarding par clé API Mistral et des références de modèles
summary: Utiliser les modèles Mistral et la transcription Voxtral avec OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-24T07:27:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw prend en charge Mistral à la fois pour le routage des modèles texte/image (`mistral/...`) et
pour la transcription audio via Voxtral dans la compréhension des médias.
Mistral peut aussi être utilisé pour les embeddings de mémoire (`memorySearch.provider = "mistral"`).

- Fournisseur : `mistral`
- Authentification : `MISTRAL_API_KEY`
- API : Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Premiers pas

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

OpenClaw fournit actuellement ce catalogue Mistral intégré :

| Référence de modèle               | Entrée      | Contexte | Sortie max | Notes                                                              |
| --------------------------------- | ----------- | -------- | ---------- | ------------------------------------------------------------------ |
| `mistral/mistral-large-latest`    | text, image | 262,144  | 16,384     | Modèle par défaut                                                  |
| `mistral/mistral-medium-2508`     | text, image | 262,144  | 8,192      | Mistral Medium 3.1                                                 |
| `mistral/mistral-small-latest`    | text, image | 128,000  | 16,384     | Mistral Small 4 ; raisonnement ajustable via l’API `reasoning_effort` |
| `mistral/pixtral-large-latest`    | text, image | 128,000  | 32,768     | Pixtral                                                            |
| `mistral/codestral-latest`        | text        | 256,000  | 4,096      | Coding                                                             |
| `mistral/devstral-medium-latest`  | text        | 262,144  | 32,768     | Devstral 2                                                         |
| `mistral/magistral-small`         | text        | 128,000  | 40,000     | Raisonnement activé                                                |

## Transcription audio (Voxtral)

Utilisez Voxtral pour la transcription audio batch via le pipeline de
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

## STT en streaming pour Voice Call

Le plugin groupé `mistral` enregistre Voxtral Realtime comme fournisseur STT
en streaming pour Voice Call.

| Paramètre    | Chemin de configuration                                                   | Valeur par défaut                      |
| ------------ | ------------------------------------------------------------------------- | -------------------------------------- |
| Clé API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`    | Repli sur `MISTRAL_API_KEY`            |
| Modèle       | `...mistral.model`                                                        | `voxtral-mini-transcribe-realtime-2602` |
| Encodage     | `...mistral.encoding`                                                     | `pcm_mulaw`                            |
| Taux d’échantillonnage | `...mistral.sampleRate`                                          | `8000`                                 |
| Délai cible  | `...mistral.targetStreamingDelayMs`                                       | `800`                                  |

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
OpenClaw utilise par défaut `pcm_mulaw` à 8 kHz pour le STT realtime Mistral afin que Voice Call
puisse transmettre directement les trames média Twilio. Utilisez `encoding: "pcm_s16le"` et un
`sampleRate` correspondant uniquement si votre flux amont est déjà du PCM brut.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Raisonnement ajustable (mistral-small-latest)">
    `mistral/mistral-small-latest` correspond à Mistral Small 4 et prend en charge le [raisonnement ajustable](https://docs.mistral.ai/capabilities/reasoning/adjustable) sur l’API Chat Completions via `reasoning_effort` (`none` minimise la réflexion supplémentaire dans la sortie ; `high` expose des traces complètes de réflexion avant la réponse finale).

    OpenClaw mappe le niveau de **thinking** de la session vers l’API Mistral :

    | Niveau de réflexion OpenClaw                    | `reasoning_effort` Mistral |
    | ----------------------------------------------- | -------------------------- |
    | **off** / **minimal**                           | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Les autres modèles du catalogue Mistral intégré n’utilisent pas ce paramètre. Continuez d’utiliser les modèles `magistral-*` lorsque vous voulez le comportement natif de Mistral centré d’abord sur le raisonnement.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de mémoire">
    Mistral peut servir des embeddings de mémoire via `/v1/embeddings` (modèle par défaut : `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Authentification et base URL">
    - L’authentification Mistral utilise `MISTRAL_API_KEY`.
    - La base URL du fournisseur vaut par défaut `https://api.mistral.ai/v1`.
    - Le modèle par défaut de l’onboarding est `mistral/mistral-large-latest`.
    - Z.AI utilise l’authentification Bearer avec votre clé API.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Compréhension des médias" href="/fr/nodes/media-understanding" icon="microphone">
    Configuration de la transcription audio et sélection du fournisseur.
  </Card>
</CardGroup>
