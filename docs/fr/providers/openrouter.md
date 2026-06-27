---
read_when:
    - Vous voulez une seule clé API pour de nombreux LLMs
    - Vous voulez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous voulez utiliser OpenRouter pour la génération d’images
    - Vous voulez utiliser OpenRouter pour la génération de musique
    - Vous voulez utiliser OpenRouter pour la génération de vidéos
summary: Utiliser l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:06:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fournit une **API unifiée** qui achemine les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une seule clé API. Elle est compatible avec OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

## Premiers pas

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run OAuth onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw ouvre le flux de connexion au navigateur d’OpenRouter, échange le code
        PKCE contre une clé API OpenRouter et stocke cette clé dans le profil
        d’authentification OpenRouter par défaut. Sur les hôtes distants/sans interface, OpenClaw affiche
        l’URL de connexion et vous demande de coller l’URL de redirection après vous être connecté.
      </Step>
      <Step title="(Optional) Switch to a specific model">
        La configuration initiale utilise `openrouter/auto` par défaut. Choisissez un modèle concret plus tard :

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get your API key">
        Créez une clé API sur [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Run API-key onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optional) Switch to a specific model">
        La configuration initiale utilise `openrouter/auto` par défaut. Choisissez un modèle concret plus tard :

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
Les références de modèles suivent le schéma `openrouter/<provider>/<model>`. Pour la liste complète des
fournisseurs et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de secours intégrés :

| Référence de modèle              | Notes                         |
| --------------------------------- | ----------------------------- |
| `openrouter/auto`                 | Routage automatique OpenRouter |
| `openrouter/openrouter/fusion`    | Routeur OpenRouter Fusion     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI      |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI      |

## Génération d’images

OpenRouter peut également servir de backend pour l’outil `image_generate`. Utilisez un modèle d’image OpenRouter sous `agents.defaults.imageGenerationModel` :

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

OpenClaw envoie les requêtes d’image à l’API d’images de complétions de chat d’OpenRouter avec `modalities: ["image", "text"]`. Les modèles d’image Gemini reçoivent les indications `aspectRatio` et `resolution` prises en charge via `image_config` d’OpenRouter. Utilisez `agents.defaults.imageGenerationModel.timeoutMs` pour les modèles d’image OpenRouter plus lents ; le paramètre `timeoutMs` par appel de l’outil `image_generate` reste prioritaire.

## Génération de vidéos

OpenRouter peut également servir de backend pour l’outil `video_generate` via son API asynchrone `/videos`. Utilisez un modèle vidéo OpenRouter sous `agents.defaults.videoGenerationModel` :

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

OpenClaw soumet les tâches texte-vers-vidéo et image-vers-vidéo à OpenRouter, interroge
le `polling_url` renvoyé et télécharge la vidéo terminée depuis
les `unsigned_urls` d’OpenRouter ou le point de terminaison documenté du contenu de la tâche.
Les images de référence sont envoyées par défaut comme images de première/dernière image ; les images
étiquetées avec `reference_image` sont envoyées comme références d’entrée OpenRouter. La valeur par défaut
intégrée `google/veo-3.1-fast` annonce les durées actuellement prises en charge de 4/6/8
secondes, les résolutions `720P`/`1080P` et les formats d’image `16:9`/`9:16`.
Le vidéo-vers-vidéo n’est pas enregistré pour OpenRouter, car l’API amont de
génération vidéo accepte actuellement les références textuelles et d’image.

## Génération de musique

OpenRouter peut également servir de backend pour l’outil `music_generate` via la sortie
audio des complétions de chat. Utilisez un modèle audio OpenRouter sous
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

Le fournisseur de musique OpenRouter intégré utilise par défaut
`google/lyria-3-pro-preview` et expose aussi
`google/lyria-3-clip-preview`. OpenClaw envoie `modalities: ["text",
"audio"]`, active le streaming, collecte les fragments audio diffusés et enregistre
le résultat comme média généré pour la livraison au canal. Les images de référence sont
acceptées pour les modèles Lyria via le paramètre partagé `music_generate image=...`.

## Synthèse vocale

OpenRouter peut également être utilisé comme fournisseur TTS via son point de terminaison
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

Si `messages.tts.providers.openrouter.apiKey` est omis, TTS réutilise
`models.providers.openrouter.apiKey`, puis `OPENROUTER_API_KEY`.

## Transcription vocale (audio entrant)

OpenRouter peut transcrire les pièces jointes vocales/audio entrantes via le chemin partagé
`tools.media.audio` en utilisant son point de terminaison STT (`/audio/transcriptions`).
Cela s’applique à tout Plugin de canal qui transmet l’audio vocal/entrant vers
la préanalyse de compréhension des médias.

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

OpenClaw envoie les requêtes STT OpenRouter en JSON avec l’audio en base64 sous
`input_audio` (contrat STT OpenRouter), et non comme téléversements de formulaire OpenAI multipart.

## Routeur Fusion

Utilisez OpenRouter Fusion lorsque vous voulez qu’une seule référence de modèle OpenClaw interroge plusieurs
modèles OpenRouter en parallèle, qu’OpenRouter évalue leurs réponses et renvoie une
réponse finale unique via le point de terminaison normal du fournisseur OpenRouter. Comme
le slug de modèle amont est `openrouter/fusion`, la référence de modèle OpenClaw inclut
à la fois le préfixe de fournisseur OpenClaw et l’espace de noms OpenRouter amont :

```bash
openclaw models set openrouter/openrouter/fusion
```

Configurez le panel et le juge de Fusion via `params.extraBody` du modèle. Ces
champs sont transmis dans le corps de la requête de complétions de chat OpenRouter. Fusion
fonctionne avec la configuration initiale OpenRouter OAuth ou par clé API ; si vous utilisez
OAuth, omettez la ligne `env.OPENROUTER_API_KEY` dans l’exemple ci-dessous.

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

La liste `analysis_models` est le panel parallèle, et `model` dans la configuration du Plugin
Fusion est le modèle juge. Ne définissez pas `tool_choice` au niveau supérieur sur
`"required"` dans les tours normaux d’agent/chat OpenClaw pour essayer de forcer Fusion ;
les tours OpenClaw peuvent inclure des définitions d’outils OpenClaw, et un choix d’outil requis
au niveau supérieur peut exiger l’un de ces outils au lieu du routeur Fusion. Lorsque
cette configuration du Plugin Fusion est présente, OpenClaw ajoute également une note
d’invite système nettoyée avec les modèles d’analyse configurés et le modèle juge afin que
l’agent puisse répondre aux questions sur son panel Fusion actuel. Les autres champs `extraBody`
ne sont pas copiés dans l’invite.

Fusion est plus lent par conception. OpenRouter peut envoyer la même invite OpenClaw à
plusieurs modèles d’analyse, puis exécuter une étape finale de jugement/synthèse, donc la latence est
généralement supérieure à celle d’une requête directe à un seul modèle. Utilisez Fusion pour des réponses
délibérées et de haute qualité ou des chemins d’escalade, pas comme valeur par défaut pour
un chat sensible à la latence. Pour des réponses plus rapides, gardez le panel petit et choisissez
des modèles d’analyse et de jugement plus rapides.

Testez la référence configurée avec un appel local ponctuel au modèle :

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Authentification et en-têtes

OpenRouter utilise en interne un jeton Bearer avec votre clé API. OpenRouter
OAuth est un flux de connexion PKCE qui émet une clé API OpenRouter, donc OpenClaw stocke
le résultat comme le même profil d’authentification par clé API `openrouter:default` utilisé par le
chemin de configuration manuelle par clé API.

Pour une installation existante, connectez-vous ou effectuez une rotation de la clé OpenRouter stockée sans
relancer toute la configuration initiale :

```bash
openclaw models auth login --provider openrouter --method oauth
```

Utilisez `openclaw models auth login --provider openrouter --method api-key` lorsque
vous voulez coller une clé que vous avez créée manuellement sur OpenRouter.

Sur les requêtes OpenRouter réelles (`https://openrouter.ai/api/v1`), OpenClaw ajoute également
les en-têtes documentés d’attribution d’application d’OpenRouter :

| En-tête                   | Valeur                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Si vous redirigez le fournisseur OpenRouter vers un autre proxy ou une autre URL de base, OpenClaw
n’injecte **pas** ces en-têtes propres à OpenRouter ni les marqueurs de cache Anthropic.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Response caching">
    La mise en cache des réponses OpenRouter est optionnelle. Activez-la par modèle OpenRouter avec
    les paramètres de modèle :

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

    OpenClaw envoie `X-OpenRouter-Cache: true` et, lorsqu’il est configuré,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` force une actualisation pour
    la requête actuelle et stocke la réponse de remplacement. Les alias en snake_case
    (`response_cache`, `response_cache_ttl_seconds` et
    `response_cache_clear`) sont également acceptés.

    Cela est distinct de la mise en cache des invites du fournisseur et des marqueurs
    Anthropic `cache_control` d’OpenRouter. Cela ne s’applique qu’aux routes
    `openrouter.ai` vérifiées, pas aux URL de base de proxy personnalisées.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic conservent les
    marqueurs Anthropic `cache_control` propres à OpenRouter qu’OpenClaw utilise pour une
    meilleure réutilisation du cache d’invite sur les blocs d’invite système/développeur.
  </Accordion>

  <Accordion title="Préremplissage du raisonnement Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic avec le raisonnement activé
    suppriment les tours finaux de préremplissage de l’assistant avant que la requête n’atteigne OpenRouter,
    conformément à l’exigence d’Anthropic selon laquelle les conversations de raisonnement doivent se terminer par un tour
    utilisateur.
  </Accordion>

  <Accordion title="Injection de réflexion / raisonnement">
    Sur les routes prises en charge qui ne sont pas `auto`, OpenClaw associe le niveau de réflexion sélectionné aux
    charges utiles de raisonnement du proxy OpenRouter. Les indications de modèle non prises en charge et
    `openrouter/auto` ignorent cette injection de raisonnement. Hunter Alpha ignore également
    le raisonnement du proxy pour les références de modèles configurées obsolètes, car OpenRouter pourrait
    renvoyer le texte de réponse finale dans les champs de raisonnement pour cette route retirée.
  </Accordion>

  <Accordion title="Relecture du raisonnement DeepSeek V4">
    Sur les routes OpenRouter vérifiées, `openrouter/deepseek/deepseek-v4-flash` et
    `openrouter/deepseek/deepseek-v4-pro` remplissent le champ `reasoning_content` manquant sur
    les tours assistant relus afin que les conversations de réflexion/outils conservent la forme de suivi requise par DeepSeek V4.
    OpenClaw envoie les valeurs `reasoning_effort` prises en charge par OpenRouter pour ces routes ;
    `xhigh` est le niveau annoncé le plus élevé, et les substitutions obsolètes `max` sont mappées vers `xhigh`.
  </Accordion>

  <Accordion title="Mise en forme des requêtes réservée à OpenAI">
    OpenRouter passe toujours par le chemin compatible OpenAI de style proxy ; la mise en forme native des requêtes réservée à OpenAI,
    comme `serviceTier`, Responses `store`,
    les charges utiles compatibles avec le raisonnement OpenAI et les indications de cache d’invite ne sont donc pas transmises.
  </Accordion>

  <Accordion title="Routes adossées à Gemini">
    Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve
    l’assainissement des signatures de pensée Gemini, mais n’active pas la validation de relecture Gemini native
    ni les réécritures d’amorçage.
  </Accordion>

  <Accordion title="Métadonnées de routage du fournisseur">
    OpenRouter prend en charge un objet de requête `provider` pour le routage du fournisseur sous-jacent.
    Configurez une stratégie par défaut pour toutes les requêtes de modèles texte OpenRouter
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

    OpenClaw transmet cet objet à OpenRouter comme charge utile `provider` de la requête.
    Utilisez les champs snake_case documentés par OpenRouter, notamment `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` et `enforce_distillable_text`.

    Les paramètres par modèle remplacent toujours l’objet de routage valable pour tout le fournisseur :

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

    Cela s’applique uniquement aux routes de complétions de chat OpenRouter. Les routes directes Anthropic,
    Google, OpenAI ou de fournisseur personnalisé ignorent les paramètres de routage OpenRouter.

  </Accordion>
</AccordionGroup>

## Articles associés

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
