---
read_when:
    - Vous souhaitez une clé API unique pour de nombreux LLM
    - Vous souhaitez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous souhaitez utiliser OpenRouter pour générer des images
    - Vous souhaitez utiliser OpenRouter pour générer de la musique
    - Vous souhaitez utiliser OpenRouter pour la génération de vidéos
summary: Utilisez l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T15:43:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter achemine les requêtes vers de nombreux modèles derrière une seule API et une seule clé. Il est
compatible avec OpenAI ; OpenClaw communique donc avec lui via le même transport
de type `openai-completions` que celui utilisé pour les autres fournisseurs mandataires.

## Prise en main

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Exécuter la configuration initiale OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw ouvre le processus de connexion d’OpenRouter dans le navigateur (PKCE), échange le
        code contre une clé API OpenRouter et la stocke dans le profil
        d’authentification OpenRouter par défaut. Sur les hôtes distants ou sans interface graphique, OpenClaw affiche
        l’URL de connexion et vous demande de coller l’URL de redirection après vous être connecté.
      </Step>
      <Step title="(Facultatif) Passer à un modèle spécifique">
        La configuration initiale utilise `openrouter/auto` par défaut. Choisissez ensuite un modèle précis :

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Clé API">
    <Steps>
      <Step title="Obtenir votre clé API">
        Créez une clé API sur [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Exécuter la configuration initiale avec une clé API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Facultatif) Passer à un modèle spécifique">
        La configuration initiale utilise `openrouter/auto` par défaut. Choisissez ensuite un modèle précis :

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Exemple de configuration

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Références de modèles

<Note>
Les références de modèles suivent le format `openrouter/<provider>/<model>`. Pour obtenir la liste complète des
fournisseurs et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Modèles de secours intégrés, utilisés lorsque la découverte du catalogue en direct est indisponible :

| Référence du modèle               | Remarques                            |
| --------------------------------- | ------------------------------------ |
| `openrouter/auto`                 | Routage automatique d’OpenRouter     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI             |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI             |

Toute autre référence `openrouter/<provider>/<model>`, y compris
`openrouter/openrouter/fusion` (voir [Routeur Fusion](#fusion-router)), est résolue
dynamiquement à partir du catalogue de modèles en direct d’OpenRouter.

## Génération d’images

OpenRouter peut prendre en charge l’outil `image_generate`. Définissez un modèle d’image OpenRouter
sous `agents.defaults.imageGenerationModel` :

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw envoie les requêtes d’images à l’API d’images de complétion de conversation d’OpenRouter avec
`modalities: ["image", "text"]`. Les modèles d’image Gemini reçoivent également des
indications `aspectRatio` et `resolution` via l’`image_config` d’OpenRouter ; les autres
modèles d’image n’en reçoivent pas. Utilisez `agents.defaults.imageGenerationModel.timeoutMs` pour
les modèles plus lents ; le paramètre `timeoutMs` propre à chaque appel de l’outil `image_generate` reste prioritaire.

## Génération de vidéos

OpenRouter peut prendre en charge l’outil `video_generate` via son API asynchrone
`/videos`. Définissez un modèle vidéo OpenRouter sous
`agents.defaults.videoGenerationModel` :

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw soumet des tâches de génération de texte en vidéo et d’image en vidéo, interroge périodiquement l’URL
`polling_url` renvoyée et télécharge la vidéo terminée depuis les
`unsigned_urls` d’OpenRouter ou le point de terminaison de contenu de la tâche. Les images de référence sont utilisées par défaut comme
images de première ou dernière trame ; les images marquées `reference_image` sont plutôt envoyées comme
références d’entrée. Le modèle intégré `google/veo-3.1-fast` par défaut prend en charge des durées de 4/6/8
secondes, des résolutions `720P`/`1080P` et des formats d’image `16:9`/`9:16`.
La conversion de vidéo en vidéo n’est pas prise en charge : l’API en amont n’accepte que des références
textuelles et visuelles.

## Génération de musique

OpenRouter peut prendre en charge l’outil `music_generate` via la sortie audio des complétions de conversation.
Définissez un modèle audio OpenRouter sous
`agents.defaults.musicGenerationModel` :

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Le fournisseur de musique OpenRouter intégré utilise `google/lyria-3-pro-preview`
par défaut et expose également `google/lyria-3-clip-preview`. OpenClaw envoie `modalities:
["text", "audio"]`, diffuse la réponse en continu, collecte les fragments audio et enregistre
le résultat comme média généré afin de le transmettre au canal. Les modèles Lyria acceptent une
image de référence via le paramètre partagé `music_generate image=...`.
La diffusion audio en continu, la conservation de la transcription et l’enveloppe d’événement SSE dérivée sont
limitées par `agents.defaults.mediaMaxMb` (la limite audio par défaut est de 16 MB).

## Synthèse vocale

OpenRouter peut servir de fournisseur TTS par l’intermédiaire de son endpoint
`/audio/speech` compatible avec OpenAI.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Si `messages.tts.providers.openrouter.apiKey` est omis, TTS utilise en repli
`models.providers.openrouter.apiKey`, puis `OPENROUTER_API_KEY`.

## Transcription de la parole en texte (audio entrant)

OpenRouter peut transcrire les pièces jointes vocales/audio entrantes par le
chemin partagé `tools.media.audio`, à l’aide de son endpoint STT
(`/audio/transcriptions`). Cela s’applique à tout plugin de canal qui transmet
les données vocales/audio entrantes à la vérification préalable de compréhension
des médias.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw envoie les requêtes STT à OpenRouter au format JSON, avec les données
audio encodées en base64 sous `input_audio` (le contrat STT d’OpenRouter), et non
sous forme de téléversements de formulaires OpenAI multipart.

## Routeur Fusion

OpenRouter Fusion envoie une référence de modèle OpenClaw à plusieurs modèles
OpenRouter en parallèle, demande à OpenRouter d’évaluer leurs réponses, puis
renvoie une réponse finale par l’endpoint OpenRouter normal. Le slug du modèle
en amont est `openrouter/fusion` ; la référence de modèle OpenClaw contient donc
à la fois le préfixe du fournisseur OpenClaw et l’espace de noms OpenRouter en
amont :

```bash
openclaw models set openrouter/openrouter/fusion
```

Configurez le panel et le modèle d’évaluation de Fusion par le champ
`params.extraBody` du modèle ; ces champs sont transmis directement dans le
corps de la requête de complétion de conversation OpenRouter. Fusion fonctionne
avec l’intégration OAuth comme avec celle par clé API ; si vous utilisez OAuth,
omettez la ligne `env.OPENROUTER_API_KEY` ci-dessous.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` est le panel parallèle ; le champ `model` dans la
configuration du plugin Fusion désigne le modèle d’évaluation. Ne définissez
pas le champ `tool_choice` de premier niveau sur `"required"` lors des échanges
normaux avec l’agent ou dans la conversation pour tenter de forcer Fusion : les
échanges OpenClaw peuvent inclure leurs propres définitions d’outils, et un
choix d’outil obligatoire au premier niveau peut sélectionner l’un de ces
outils plutôt que le routeur Fusion. Lorsque cette configuration du plugin
Fusion est présente, OpenClaw ajoute au prompt système une note assainie qui
répertorie les modèles d’analyse configurés et le modèle d’évaluation, afin que
l’agent puisse répondre aux questions concernant son propre panel Fusion. Les
autres champs `extraBody` ne sont pas copiés dans le prompt.

Fusion est plus lent par conception : OpenRouter distribue le prompt à
plusieurs modèles d’analyse, puis exécute une étape d’évaluation et de synthèse,
ce qui entraîne une latence supérieure à celle d’une requête directe vers un
seul modèle. Utilisez-le pour obtenir délibérément des réponses de haute qualité
ou dans des chemins d’escalade, et non comme option par défaut sensible à la
latence. Limitez la taille du panel et choisissez des modèles d’analyse et
d’évaluation plus rapides pour obtenir des réponses plus rapidement.

Testez une référence configurée à l’aide d’un appel local unique :

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Répondez exactement par : FUSION_OK" \
  --json
```

## Authentification et en-têtes

OpenRouter utilise un jeton Bearer issu de votre clé API. OpenRouter OAuth est
un flux de connexion PKCE qui émet une clé API OpenRouter ; OpenClaw enregistre
donc le résultat dans le même profil d’authentification par clé API
`openrouter:default` que celui utilisé lors de la configuration manuelle d’une
clé API.

Pour vous connecter ou renouveler la clé enregistrée sur une installation
existante sans relancer l’intégration complète :

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Pour les requêtes OpenRouter vérifiées (`https://openrouter.ai/api/v1`),
OpenClaw ajoute les en-têtes documentés d’attribution de l’application
OpenRouter :

| En-tête                   | Valeur                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Si vous redirigez le fournisseur OpenRouter vers un autre proxy ou une autre
URL de base, OpenClaw n’injecte **pas** ces en-têtes propres à OpenRouter ni les
marqueurs de cache Anthropic.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mise en cache des réponses">
    La mise en cache des réponses OpenRouter est facultative. Activez-la pour
    chaque modèle :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw envoie `X-OpenRouter-Cache: true` et, lorsque celui-ci est
    configuré, `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` force
    l’actualisation de la requête en cours et enregistre la réponse de
    remplacement. Les alias en snake_case (`response_cache`,
    `response_cache_ttl_seconds`, `response_cache_clear`) sont acceptés, tout
    comme `responseCacheTtl` / `response_cache_ttl` sans le suffixe `Seconds`.

    Cette fonctionnalité est distincte de la mise en cache des prompts par le
    fournisseur et des marqueurs Anthropic `cache_control` d’OpenRouter. Elle
    s’applique uniquement aux routes `openrouter.ai` vérifiées, et non aux URL
    de base de proxys personnalisés.

  </Accordion>

  <Accordion title="Marqueurs de cache Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic
    conservent les marqueurs Anthropic `cache_control` d’OpenRouter afin
    d’améliorer la réutilisation du cache des prompts pour les blocs de prompts
    système/développeur.
  </Accordion>

  <Accordion title="Préremplissage du raisonnement Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic avec le raisonnement activé
    suppriment les tours de préremplissage finaux de l’assistant avant que la requête n’atteigne
    OpenRouter, conformément à l’exigence d’Anthropic selon laquelle les conversations avec raisonnement
    doivent se terminer par un tour utilisateur.
  </Accordion>

  <Accordion title="Injection de la réflexion / du raisonnement">
    Sur les routes non-`auto` prises en charge, OpenClaw associe le niveau de réflexion sélectionné
    aux charges utiles de raisonnement du proxy OpenRouter. `openrouter/auto` et les indications de
    modèles non prises en charge ignorent cette injection. Les anciennes références `openrouter/hunter-alpha`
    l’ignorent également, car OpenRouter pouvait renvoyer le texte de la réponse finale dans les champs
    de raisonnement sur cette route retirée.
  </Accordion>

  <Accordion title="Relecture du raisonnement DeepSeek V4">
    Sur les routes OpenRouter vérifiées, `openrouter/deepseek/deepseek-v4-flash` et
    `openrouter/deepseek/deepseek-v4-pro` renseignent le champ `reasoning_content` manquant dans
    les tours d’assistant relus, afin de conserver les conversations de réflexion et d’utilisation d’outils
    dans le format de suivi requis par DeepSeek V4. OpenClaw envoie les valeurs
    `reasoning.effort` prises en charge par OpenRouter pour ces routes : `xhigh`/`max` correspondent à `xhigh`,
    et tous les autres niveaux non désactivés correspondent à `high`.
  </Accordion>

  <Accordion title="Mise en forme des requêtes réservée à OpenAI">
    OpenRouter utilise le chemin compatible avec OpenAI de type proxy ; la mise en forme
    des requêtes propre à OpenAI, telle que `serviceTier`, `store` de Responses,
    les charges utiles de compatibilité du raisonnement OpenAI et les indications de cache de prompt, n’est donc pas transmise.
  </Accordion>

  <Accordion title="Routes adossées à Gemini">
    Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve
    l’assainissement des signatures de réflexion Gemini, mais n’active pas la validation native
    de la relecture Gemini ni les réécritures d’initialisation.
  </Accordion>

  <Accordion title="Métadonnées de routage du fournisseur">
    OpenRouter prend en charge un objet de requête `provider` pour le routage du fournisseur
    sous-jacent. Configurez une politique par défaut pour toutes les requêtes de modèles de texte OpenRouter
    avec `models.providers.openrouter.params.provider` :

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw transmet cet objet à OpenRouter en tant que charge utile `provider`
    de la requête. Utilisez les champs en snake_case documentés par OpenRouter, notamment `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` et `enforce_distillable_text`.

    Les paramètres propres à chaque modèle remplacent l’objet de routage commun au fournisseur :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Cela s’applique uniquement aux routes de complétion de chat OpenRouter. Les routes directes
    Anthropic, Google, OpenAI ou de fournisseurs personnalisés ignorent les paramètres de routage OpenRouter.

  </Accordion>
</AccordionGroup>

## Contenu associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration des agents, des modèles et des fournisseurs.
  </Card>
</CardGroup>
