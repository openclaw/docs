---
read_when:
    - Vous souhaitez une seule clé API pour de nombreux LLM
    - Vous souhaitez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous souhaitez utiliser OpenRouter pour générer des images
    - Vous souhaitez utiliser OpenRouter pour générer de la musique
    - Vous souhaitez utiliser OpenRouter pour générer des vidéos
summary: Utilisez l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T03:01:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter achemine les requêtes vers de nombreux modèles derrière une API et une clé uniques. Il est
compatible avec OpenAI ; OpenClaw communique donc avec lui via le même transport de type
`openai-completions` que celui utilisé pour les autres fournisseurs proxy.

## Prise en main

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Exécuter la configuration initiale OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw ouvre le flux de connexion d'OpenRouter dans le navigateur (PKCE), échange le
        code contre une clé API OpenRouter et la stocke dans le profil
        d'authentification OpenRouter par défaut. Sur les hôtes distants ou sans interface graphique, OpenClaw affiche
        l'URL de connexion et vous demande de coller l'URL de redirection après vous être connecté.
      </Step>
      <Step title="(Facultatif) Passer à un modèle spécifique">
        La configuration initiale utilise `openrouter/auto` par défaut. Vous pourrez choisir un modèle précis ultérieurement :

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
        La configuration initiale utilise `openrouter/auto` par défaut. Vous pourrez choisir un modèle précis ultérieurement :

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

## Références des modèles

<Note>
Les références de modèles suivent le format `openrouter/<provider>/<model>`. Pour obtenir la liste complète des
fournisseurs et modèles disponibles, consultez [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Modèles de secours intégrés, utilisés lorsque la découverte du catalogue en temps réel est indisponible :

| Référence du modèle               | Remarques                              |
| --------------------------------- | -------------------------------------- |
| `openrouter/auto`                 | Routage automatique d'OpenRouter       |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI               |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI               |

Toute autre référence `openrouter/<provider>/<model>`, notamment
`openrouter/openrouter/fusion` (voir [Routeur Fusion](#fusion-router)), est résolue
dynamiquement à partir du catalogue de modèles en temps réel d'OpenRouter.

## Génération d'images

OpenRouter peut servir de moteur à l'outil `image_generate`. Définissez un modèle d'image OpenRouter
dans `agents.defaults.imageGenerationModel` :

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

OpenClaw envoie les requêtes d'images à l'API d'images de complétion de chat d'OpenRouter avec
`modalities: ["image", "text"]`. Les modèles d'images Gemini reçoivent également des indications
`aspectRatio` et `resolution` via le paramètre `image_config` d'OpenRouter, contrairement aux autres
modèles d'images. Utilisez `agents.defaults.imageGenerationModel.timeoutMs` pour
les modèles plus lents ; la valeur `timeoutMs` propre à chaque appel de l'outil `image_generate` reste prioritaire.

## Génération de vidéos

OpenRouter peut servir de moteur à l'outil `video_generate` via son API asynchrone
`/videos`. Définissez un modèle vidéo OpenRouter dans
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

OpenClaw soumet des tâches de génération de texte en vidéo et d'image en vidéo, interroge périodiquement
l'adresse `polling_url` renvoyée et télécharge la vidéo terminée depuis les
`unsigned_urls` d'OpenRouter ou le point d'accès au contenu de la tâche. Les images de référence sont utilisées par défaut comme
images de première ou de dernière trame ; celles portant l'étiquette `reference_image` sont plutôt envoyées comme
références d'entrée. Le modèle par défaut intégré `google/veo-3.1-fast` prend en charge des durées de 4, 6 ou 8
secondes, les résolutions `720P` et `1080P`, ainsi que les formats d'image `16:9` et `9:16`.
La génération de vidéo à partir d'une vidéo n'est pas prise en charge : l'API en amont accepte uniquement du texte et des
références d'images.

## Génération musicale

OpenRouter peut servir de moteur à l'outil `music_generate` via la sortie audio des complétions de chat.
Définissez un modèle audio OpenRouter dans
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
par défaut et propose également `google/lyria-3-clip-preview`. OpenClaw envoie `modalities:
["text", "audio"]`, diffuse la réponse en continu, collecte les fragments audio et enregistre
le résultat comme média généré pour sa diffusion sur le canal. Les modèles Lyria acceptent une
image de référence via le paramètre partagé `music_generate image=...`.
La diffusion audio en continu, la conservation de la transcription et l'enveloppe d'événements SSE dérivée sont
limitées par `agents.defaults.mediaMaxMb` (la limite audio par défaut est de 16 Mo).

## Synthèse vocale

OpenRouter peut servir de fournisseur TTS grâce à son point de terminaison compatible avec OpenAI
`/audio/speech`.

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

Si `messages.tts.providers.openrouter.apiKey` est omis, le TTS utilise comme
solutions de repli `models.providers.openrouter.apiKey`, puis `OPENROUTER_API_KEY`.

## Transcription vocale (audio entrant)

OpenRouter peut transcrire les pièces jointes vocales/audio entrantes par le
chemin partagé `tools.media.audio`, à l’aide de son point de terminaison STT
(`/audio/transcriptions`). Cela s’applique à tout Plugin de canal qui transmet
les contenus vocaux/audio entrants à la phase préalable de compréhension des
médias.

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

OpenClaw envoie les requêtes STT à OpenRouter au format JSON, avec l’audio
encodé en base64 sous `input_audio` conformément au contrat STT d’OpenRouter,
et non sous forme d’envois de formulaires OpenAI multiparties.

## Routeur Fusion

OpenRouter Fusion envoie une référence de modèle OpenClaw à plusieurs modèles
OpenRouter en parallèle, demande à OpenRouter d’évaluer leurs réponses, puis
renvoie une réponse finale par le point de terminaison OpenRouter habituel.
L’identifiant de modèle en amont est `openrouter/fusion` ; la référence de
modèle OpenClaw contient donc à la fois le préfixe de fournisseur OpenClaw et
l’espace de noms OpenRouter en amont :

```bash
openclaw models set openrouter/openrouter/fusion
```

Configurez le panel et le modèle d’évaluation de Fusion par l’intermédiaire de
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

`analysis_models` correspond au panel parallèle ; `model`, dans la
configuration du Plugin Fusion, correspond au modèle d’évaluation. Ne
définissez pas le paramètre `tool_choice` de premier niveau sur `"required"`
lors des échanges normaux avec l’agent ou dans la conversation pour tenter de
forcer Fusion : les échanges OpenClaw peuvent inclure leurs propres définitions
d’outils, et un choix d’outil obligatoire au premier niveau peut sélectionner
l’un de ces outils plutôt que le routeur Fusion. Lorsque cette configuration
du Plugin Fusion est présente, OpenClaw ajoute au message système une note
assainie qui répertorie les modèles d’analyse configurés et le modèle
d’évaluation, afin que l’agent puisse répondre aux questions concernant son
propre panel Fusion. Les autres champs de `extraBody` ne sont pas copiés dans
le message.

Fusion est plus lent par conception : OpenRouter distribue le message à
plusieurs modèles d’analyse, puis exécute une étape d’évaluation et de synthèse.
La latence est donc supérieure à celle d’une requête directe adressée à un
seul modèle. Utilisez-le pour obtenir des réponses réfléchies et de haute
qualité ou pour les chemins d’escalade, et non comme option par défaut lorsque
la latence est critique. Limitez le nombre de modèles du panel et choisissez
des modèles d’analyse et d’évaluation plus rapides pour obtenir des réponses
plus rapidement.

Testez une référence configurée avec un appel local unique :

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Authentification et en-têtes

OpenRouter utilise un jeton Bearer provenant de votre clé API. OAuth OpenRouter
est un flux de connexion PKCE qui délivre une clé API OpenRouter ; OpenClaw
stocke donc le résultat dans le même profil d’authentification par clé API
`openrouter:default` que celui utilisé lors de la configuration manuelle d’une
clé API.

Pour vous connecter ou renouveler la clé stockée sur une installation
existante sans recommencer l’intégralité de l’intégration :

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Sur les requêtes OpenRouter vérifiées (`https://openrouter.ai/api/v1`),
OpenClaw ajoute les en-têtes d’attribution d’application documentés par
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
  <Accordion title="Response caching">
    La mise en cache des réponses OpenRouter est facultative. Activez-la
    individuellement pour chaque modèle :

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
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` force une actualisation
    pour la requête en cours et stocke la réponse de remplacement. Les alias en
    snake_case (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`) sont acceptés, tout comme `responseCacheTtl` /
    `response_cache_ttl` sans le suffixe `Seconds`.

    Ce mécanisme est distinct de la mise en cache des messages par le
    fournisseur et des marqueurs Anthropic `cache_control` d’OpenRouter. Il
    s’applique uniquement aux routes `openrouter.ai` vérifiées, et non aux URL
    de base de proxy personnalisées.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic
    conservent les marqueurs Anthropic `cache_control` d’OpenRouter afin
    d’améliorer la réutilisation du cache des messages pour les blocs de
    messages système/développeur.
  </Accordion>

  <Accordion title="Préremplissage du raisonnement Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèles Anthropic avec le raisonnement activé
    suppriment les tours finaux de préremplissage de l’assistant avant que la requête n’atteigne
    OpenRouter, conformément à l’exigence d’Anthropic selon laquelle les conversations de raisonnement
    doivent se terminer par un tour utilisateur.
  </Accordion>

  <Accordion title="Injection de réflexion / raisonnement">
    Sur les routes prises en charge autres que `auto`, OpenClaw associe le niveau de réflexion sélectionné
    aux charges utiles de raisonnement du proxy OpenRouter. `openrouter/auto` et les indications de modèles
    non prises en charge ignorent cette injection. Les anciennes références `openrouter/hunter-alpha`
    l’ignorent également, car OpenRouter pouvait renvoyer le texte de la réponse finale dans les champs
    de raisonnement sur cette route retirée.
  </Accordion>

  <Accordion title="Relecture du raisonnement DeepSeek V4">
    Sur les routes OpenRouter vérifiées, `openrouter/deepseek/deepseek-v4-flash` et
    `openrouter/deepseek/deepseek-v4-pro` renseignent le champ `reasoning_content` manquant dans
    les tours d’assistant relus, afin de conserver les conversations de réflexion et d’utilisation
    d’outils dans la structure de suivi requise par DeepSeek V4. OpenClaw envoie les valeurs
    `reasoning.effort` prises en charge par OpenRouter pour ces routes : `xhigh`/`max` correspondent
    à `xhigh`, tandis que tout autre niveau activé correspond à `high`.
  </Accordion>

  <Accordion title="Mise en forme des requêtes propre à OpenAI">
    OpenRouter utilise le chemin compatible avec OpenAI de type proxy ; la mise en forme des requêtes
    propre à OpenAI natif, comme `serviceTier`, `store` de Responses, les charges utiles de compatibilité
    avec le raisonnement OpenAI et les indications de cache de prompt, n’est donc pas transmise.
  </Accordion>

  <Accordion title="Routes reposant sur Gemini">
    Les références OpenRouter reposant sur Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve
    l’assainissement des signatures de réflexion Gemini, mais n’active pas la validation native de la
    relecture Gemini ni les réécritures d’amorçage.
  </Accordion>

  <Accordion title="Métadonnées de routage des fournisseurs">
    OpenRouter prend en charge un objet de requête `provider` pour le routage vers le fournisseur
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

    OpenClaw transmet cet objet à OpenRouter comme charge utile `provider` de la requête.
    Utilisez les champs en snake_case documentés par OpenRouter, notamment `sort`,
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

    Cela s’applique uniquement aux routes de complétion de conversation OpenRouter. Les routes directes
    Anthropic, Google, OpenAI ou de fournisseurs personnalisés ignorent les paramètres de routage OpenRouter.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration des agents, des modèles et des fournisseurs.
  </Card>
</CardGroup>
