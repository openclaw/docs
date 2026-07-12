---
read_when:
    - Vous souhaitez utiliser les modèles Mistral dans OpenClaw
    - Vous souhaitez utiliser la transcription en temps réel de Voxtral pour les appels vocaux
    - Vous avez besoin de la configuration initiale de la clé API Mistral et des références de modèles
summary: Utilisez les modèles Mistral et la transcription Voxtral avec OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T03:15:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Le Plugin `mistral` intégré enregistre quatre contrats : les complétions de chat, la compréhension des médias (transcription par lots avec Voxtral), la reconnaissance vocale en temps réel pour Voice Call (Voxtral Realtime) et les plongements de mémoire (`mistral-embed`).

| Propriété                    | Valeur                                              |
| ---------------------------- | --------------------------------------------------- |
| Identifiant du fournisseur   | `mistral`                                           |
| Plugin                       | intégré, activé par défaut                          |
| Variable d’environnement d’authentification | `MISTRAL_API_KEY`                  |
| Option d’intégration         | `--auth-choice mistral-api-key`                     |
| Option CLI directe           | `--mistral-api-key <key>`                           |
| API                          | compatible avec OpenAI (`openai-completions`)       |
| URL de base                  | `https://api.mistral.ai/v1`                         |
| Modèle par défaut            | `mistral/mistral-large-latest`                      |
| Modèle de plongement         | `mistral-embed`                                     |
| Voxtral par lots             | `voxtral-mini-latest` (transcription audio)         |
| Voxtral en temps réel        | `voxtral-mini-transcribe-realtime-2602`             |

## Bien démarrer

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API dans la [console Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Exécuter l’intégration">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Vous pouvez aussi transmettre directement la clé :

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
  <Step title="Vérifier la disponibilité du modèle">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catalogue de LLM intégré

| Référence du modèle               | Entrée       | Contexte | Sortie maximale | Remarques                                                       |
| --------------------------------- | ------------ | -------- | --------------- | --------------------------------------------------------------- |
| `mistral/mistral-large-latest`    | texte, image | 262 144  | 16 384          | Modèle par défaut                                               |
| `mistral/mistral-medium-2508`     | texte, image | 262 144  | 8 192           | Mistral Medium 3.1                                              |
| `mistral/mistral-medium-3-5`      | texte, image | 262 144  | 8 192           | Mistral Medium 3.5 ; raisonnement ajustable                     |
| `mistral/mistral-small-latest`    | texte, image | 262 144  | 16 384          | Dernière version de Mistral Small 4 ; `reasoning_effort` ajustable |
| `mistral/mistral-small-2603`      | texte, image | 262 144  | 16 384          | Version épinglée de Mistral Small 4 ; `reasoning_effort` ajustable |
| `mistral/pixtral-large-latest`    | texte, image | 128 000  | 32 768          | Pixtral                                                         |
| `mistral/codestral-latest`        | texte        | 256 000  | 4 096           | Programmation                                                   |
| `mistral/devstral-medium-latest`  | texte        | 262 144  | 32 768          | Devstral 2                                                      |
| `mistral/magistral-small`         | texte        | 128 000  | 40 000          | Raisonnement activé                                             |

Consultez l’entrée correspondante du catalogue intégré avant de modifier la configuration :

```bash
openclaw models list --all --provider mistral --plain
```

Testez rapidement un modèle sans démarrer le Gateway :

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Transcription audio (Voxtral)

Utilisez Voxtral pour la transcription audio par lots via le pipeline de compréhension des médias :

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
Le chemin de transcription des médias utilise `/v1/audio/transcriptions`. Le modèle audio par défaut de Mistral est `voxtral-mini-latest`.
</Tip>

## Reconnaissance vocale en continu pour Voice Call

Le Plugin `mistral` intégré enregistre Voxtral Realtime comme fournisseur de reconnaissance vocale en continu pour Voice Call.

| Paramètre         | Chemin de configuration                                                | Valeur par défaut                       |
| ----------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| Clé API           | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Se rabat sur `MISTRAL_API_KEY`          |
| Modèle            | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Encodage          | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Fréquence d’échantillonnage | `...mistral.sampleRate`                                      | `8000`                                  |
| Délai cible       | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
Par défaut, OpenClaw configure la reconnaissance vocale en temps réel de Mistral sur `pcm_mulaw` à 8 kHz afin que Voice Call puisse transférer directement les trames multimédias de Twilio. Utilisez `encoding: "pcm_s16le"` et une valeur `sampleRate` correspondante uniquement si votre flux en amont est déjà en PCM brut.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Raisonnement ajustable">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` et `mistral/mistral-medium-3-5` prennent en charge le [raisonnement ajustable](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) dans l’API Chat Completions au moyen de `reasoning_effort` (`none` réduit au minimum la réflexion supplémentaire dans la sortie ; `high` expose l’intégralité des traces de réflexion avant la réponse finale).

    OpenClaw associe le niveau de **réflexion** de la session à l’API de Mistral :

    | Niveau de réflexion d’OpenClaw                                      | `reasoning_effort` de Mistral |
    | ------------------------------------------------------------------- | ----------------------------- |
    | **désactivé** / **minimal**                                         | `none`                        |
    | **faible** / **moyen** / **élevé** / **très élevé** / **adaptatif** / **maximal** | `high`          |

    <Warning>
    Évitez d’associer le mode de raisonnement de Medium 3.5 à `temperature: 0` ; selon certains signalements, l’API HTTP de Mistral rejette la combinaison de `reasoning_effort="high"` et de `temperature: 0` avec une réponse 400. Laissez la température non définie ou désactivez/réduisez au minimum la réflexion afin qu’OpenClaw envoie `reasoning_effort: "none"` avant de définir une température basse.
    </Warning>

    Exemple de configuration propre au modèle pour le raisonnement de Medium 3.5 :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Les autres modèles du catalogue Mistral intégré n’utilisent pas ce paramètre. Continuez à utiliser les modèles `magistral-*` lorsque vous souhaitez le comportement natif de Mistral axé en priorité sur le raisonnement.
    </Note>

  </Accordion>

  <Accordion title="Plongements de mémoire">
    Mistral peut fournir des plongements de mémoire via `/v1/embeddings` (modèle par défaut : `mistral-embed`) :

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Authentification et URL de base">
    - L’authentification Mistral utilise `MISTRAL_API_KEY` (en-tête Bearer).
    - L’URL de base du fournisseur est par défaut `https://api.mistral.ai/v1` et accepte le format de requête standard de complétion de chat compatible avec OpenAI.
    - Le modèle par défaut lors de l’intégration est `mistral/mistral-large-latest`.
    - Remplacez l’URL de base sous `models.providers.mistral.baseUrl` uniquement lorsque Mistral publie explicitement un point de terminaison régional dont vous avez besoin.

  </Accordion>
</AccordionGroup>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Compréhension des médias" href="/fr/nodes/media-understanding" icon="microphone">
    Configuration de la transcription audio et sélection du fournisseur.
  </Card>
</CardGroup>
