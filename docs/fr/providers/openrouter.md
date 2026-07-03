---
read_when:
    - Vous voulez une seule clé API pour de nombreux LLMs
    - Vous voulez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous souhaitez utiliser OpenRouter pour la génération d’images
    - Vous voulez utiliser OpenRouter pour la génération de musique
    - Vous souhaitez utiliser OpenRouter pour la génération de vidéos
summary: Utilisez l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:34:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fournit une **API unifiée** qui achemine les requêtes vers de nombreux modèles derrière un seul
endpoint et une seule clé API. Elle est compatible avec OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

## Premiers pas

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Exécuter la configuration initiale OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw ouvre le flux de connexion par navigateur d’OpenRouter, échange le code
        PKCE contre une clé API OpenRouter, puis stocke cette clé dans le profil
        d’authentification OpenRouter par défaut. Sur les hôtes distants/sans interface graphique, OpenClaw affiche
        l’URL de connexion et vous demande de coller l’URL de redirection après vous être connecté.
      </Step>
      <Step title="(Facultatif) Passer à un modèle spécifique">
        La configuration initiale utilise `openrouter/auto` par défaut. Choisissez un modèle concret plus tard :

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
      <Step title="Exécuter la configuration initiale avec clé API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Facultatif) Passer à un modèle spécifique">
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

## Références de modèle

<Note>
Les références de modèle suivent le modèle `openrouter/<provider>/<model>`. Pour la liste complète des
fournisseurs et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de secours intégrés :

| Référence de modèle               | Notes                         |
| --------------------------------- | ----------------------------- |
| `openrouter/auto`                 | Routage automatique OpenRouter |
| `openrouter/openrouter/fusion`    | Routeur OpenRouter Fusion     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI      |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI      |

## Génération d’images

OpenRouter peut également servir de backend à l’outil `image_generate`. Utilisez un modèle d’image OpenRouter sous `agents.defaults.imageGenerationModel` :

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

OpenClaw envoie les requêtes d’image à l’API d’images des complétions de chat d’OpenRouter avec `modalities: ["image", "text"]`. Les modèles d’image Gemini reçoivent les indications `aspectRatio` et `resolution` prises en charge via `image_config` d’OpenRouter. Utilisez `agents.defaults.imageGenerationModel.timeoutMs` pour les modèles d’image OpenRouter plus lents ; le paramètre `timeoutMs` par appel de l’outil `image_generate` reste prioritaire.

## Génération de vidéos

OpenRouter peut également servir de backend à l’outil `video_generate` via son API asynchrone `/videos`. Utilisez un modèle vidéo OpenRouter sous `agents.defaults.videoGenerationModel` :

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

OpenClaw soumet à OpenRouter les tâches de texte vers vidéo et d’image vers vidéo, interroge
le `polling_url` renvoyé, puis télécharge la vidéo terminée depuis les
`unsigned_urls` d’OpenRouter ou l’endpoint documenté du contenu de la tâche.
Les images de référence sont envoyées par défaut comme images de première/dernière image ; les images
marquées avec `reference_image` sont envoyées comme références d’entrée OpenRouter. Le
paramètre par défaut intégré `google/veo-3.1-fast` annonce les durées actuellement prises en charge de 4/6/8
secondes, les résolutions `720P`/`1080P` et les formats d’image `16:9`/`9:16`.
La vidéo vers vidéo n’est pas enregistrée pour OpenRouter, car l’API amont
de génération vidéo accepte actuellement le texte et les références d’image.

## Génération de musique

OpenRouter peut également servir de backend à l’outil `music_generate` via la sortie audio
des complétions de chat. Utilisez un modèle audio OpenRouter sous
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
`google/lyria-3-pro-preview` et expose également
`google/lyria-3-clip-preview`. OpenClaw envoie `modalities: ["text",
"audio"]`, active le streaming, collecte les fragments audio diffusés en streaming, puis enregistre
le résultat comme média généré pour la livraison dans les canaux. Les images de référence sont
acceptées pour les modèles Lyria via le paramètre partagé `music_generate image=...`.

## Synthèse vocale

OpenRouter peut également être utilisé comme fournisseur TTS via son endpoint
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

Si `messages.tts.providers.openrouter.apiKey` est omis, la synthèse vocale réutilise
`models.providers.openrouter.apiKey`, puis `OPENROUTER_API_KEY`.

## Transcription vocale (audio entrant)

OpenRouter peut transcrire les pièces jointes vocales/audio entrantes via le chemin
partagé `tools.media.audio` en utilisant son point de terminaison STT
(`/audio/transcriptions`). Cela s’applique à tout Plugin de canal qui transmet
la voix/l’audio entrant à la pré-vérification de compréhension des médias.

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

OpenClaw envoie les requêtes STT OpenRouter au format JSON avec l’audio en base64
sous `input_audio` (contrat STT OpenRouter), et non sous forme de téléversements
de formulaires OpenAI multipart.

## Routeur Fusion

Utilisez OpenRouter Fusion lorsque vous voulez qu’une seule référence de modèle
OpenClaw interroge plusieurs modèles OpenRouter en parallèle, qu’OpenRouter juge
leurs réponses et renvoie une réponse finale unique via le point de terminaison
normal du fournisseur OpenRouter. Comme le slug du modèle amont est
`openrouter/fusion`, la référence de modèle OpenClaw inclut à la fois le préfixe
du fournisseur OpenClaw et l’espace de noms OpenRouter amont :

```bash
openclaw models set openrouter/openrouter/fusion
```

Configurez le panel et le juge de Fusion via le `params.extraBody` du modèle. Ces
champs sont transmis dans le corps de la requête de complétion de chat
OpenRouter. Fusion fonctionne avec l’onboarding OAuth OpenRouter ou l’onboarding
par clé d’API ; si vous utilisez OAuth, omettez la ligne `env.OPENROUTER_API_KEY`
de l’exemple ci-dessous.

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

La liste `analysis_models` est le panel parallèle, et `model` dans la
configuration du plugin Fusion est le modèle juge. Ne définissez pas
`tool_choice` au niveau supérieur sur `"required"` dans les tours normaux
d’agent/chat OpenClaw pour tenter de forcer Fusion ; les tours OpenClaw peuvent
inclure des définitions d’outils OpenClaw, et un choix d’outil obligatoire au
niveau supérieur peut exiger l’un de ces outils plutôt que le routeur Fusion.
Lorsque cette configuration du Plugin Fusion est présente, OpenClaw ajoute aussi
une note d’invite système assainie avec les modèles d’analyse configurés et le
modèle juge, afin que l’agent puisse répondre aux questions sur son panel Fusion
actuel. Les autres champs `extraBody` ne sont pas copiés dans l’invite.

Fusion est plus lent par conception. OpenRouter peut envoyer la même invite
OpenClaw à plusieurs modèles d’analyse, puis exécuter une étape finale de
jugement/synthèse ; la latence est donc généralement plus élevée qu’avec une
requête directe à un seul modèle. Utilisez Fusion pour des réponses réfléchies et
de haute qualité ou pour des chemins d’escalade, pas comme valeur par défaut pour
un chat sensible à la latence. Pour des réponses plus rapides, gardez le panel
petit et choisissez des modèles d’analyse et de jugement plus rapides.

Testez la référence configurée avec un appel local ponctuel au modèle :

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Authentification et en-têtes

OpenRouter utilise en interne un jeton Bearer avec votre clé d’API. OAuth
OpenRouter est un flux de connexion PKCE qui émet une clé d’API OpenRouter ;
OpenClaw stocke donc le résultat comme le même profil d’authentification par clé
d’API `openrouter:default` que celui utilisé par le chemin de configuration
manuelle par clé d’API.

Pour une installation existante, connectez-vous ou faites tourner la clé
OpenRouter stockée sans relancer l’onboarding complet :

```bash
openclaw models auth login --provider openrouter --method oauth
```

Utilisez `openclaw models auth login --provider openrouter --method api-key`
lorsque vous voulez coller une clé créée manuellement sur OpenRouter.

Sur les requêtes OpenRouter réelles (`https://openrouter.ai/api/v1`), OpenClaw
ajoute aussi les en-têtes d’attribution d’application documentés par OpenRouter :

| En-tête                   | Valeur                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Si vous redirigez le fournisseur OpenRouter vers un autre proxy ou une autre URL
de base, OpenClaw n’injecte **pas** ces en-têtes propres à OpenRouter ni les
marqueurs de cache Anthropic.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Response caching">
    La mise en cache des réponses OpenRouter est optionnelle. Activez-la par
    modèle OpenRouter avec les paramètres de modèle :

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

    OpenClaw envoie `X-OpenRouter-Cache: true` et, lorsque configuré,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` force un
    rafraîchissement pour la requête actuelle et stocke la réponse de
    remplacement. Les alias snake_case (`response_cache`,
    `response_cache_ttl_seconds` et `response_cache_clear`) sont également
    acceptés.

    Cela est distinct de la mise en cache des invites du fournisseur et des
    marqueurs Anthropic `cache_control` d’OpenRouter. Cela ne s’applique qu’aux
    routes `openrouter.ai` vérifiées, pas aux URL de base de proxy personnalisées.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic
    conservent les marqueurs Anthropic `cache_control` propres à OpenRouter
    qu’OpenClaw utilise pour améliorer la réutilisation du cache d’invite sur
    les blocs d’invite système/développeur.
  </Accordion>

  <Accordion title="Préremplissage de raisonnement Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic avec le raisonnement activé
    suppriment les tours finaux de préremplissage assistant avant que la requête n’atteigne OpenRouter,
    conformément à l’exigence d’Anthropic selon laquelle les conversations de raisonnement doivent se terminer par un tour
    utilisateur.
  </Accordion>

  <Accordion title="Injection de réflexion / raisonnement">
    Sur les routes non-`auto` prises en charge, OpenClaw mappe le niveau de réflexion sélectionné vers
    les charges utiles de raisonnement du proxy OpenRouter. Les indications de modèles non prises en charge et
    `openrouter/auto` ignorent cette injection de raisonnement. Hunter Alpha ignore aussi le
    raisonnement proxy pour les références de modèles configurées obsolètes, car OpenRouter pouvait
    renvoyer le texte de réponse finale dans les champs de raisonnement pour cette route retirée.
  </Accordion>

  <Accordion title="Relecture du raisonnement DeepSeek V4">
    Sur les routes OpenRouter vérifiées, `openrouter/deepseek/deepseek-v4-flash` et
    `openrouter/deepseek/deepseek-v4-pro` remplissent le `reasoning_content` manquant sur
    les tours assistant relus afin que les conversations avec réflexion/outils conservent la forme de suivi requise par DeepSeek V4. OpenClaw envoie les valeurs
    `reasoning.effort` prises en charge par OpenRouter pour ces routes ; les niveaux non désactivés inférieurs sont mappés vers
    `high`, et les remplacements `max` obsolètes sont mappés vers `xhigh`.
  </Accordion>

  <Accordion title="Mise en forme des requêtes propres à OpenAI">
    OpenRouter passe toujours par le chemin proxy compatible avec OpenAI ; la
    mise en forme native des requêtes propres à OpenAI, comme `serviceTier`, `store` de Responses,
    les charges utiles de compatibilité du raisonnement OpenAI et les indications de cache de prompt, n’est donc pas transmise.
  </Accordion>

  <Accordion title="Routes adossées à Gemini">
    Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw conserve
    l’assainissement des signatures de pensée Gemini à cet endroit, mais n’active pas la validation de relecture Gemini
    native ni les réécritures d’amorçage.
  </Accordion>

  <Accordion title="Métadonnées de routage des fournisseurs">
    OpenRouter prend en charge un objet de requête `provider` pour le routage du fournisseur
    sous-jacent. Configurez une stratégie par défaut pour toutes les requêtes de modèles de texte OpenRouter
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
    Utilisez les champs snake_case documentés d’OpenRouter, notamment `sort`,
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

    Cela s’applique uniquement aux routes de chat completions OpenRouter. Les routes directes Anthropic,
    Google, OpenAI ou de fournisseurs personnalisés ignorent les paramètres de routage OpenRouter.

  </Accordion>
</AccordionGroup>

## Articles connexes

<CardGroup cols={2}>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
