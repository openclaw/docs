---
read_when:
    - Vous voulez utiliser des modèles OpenAI dans OpenClaw
    - Vous voulez une authentification par abonnement Codex au lieu de clés API
    - Vous avez besoin d'un comportement d'exécution d'agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-22T04:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692615b77885c0387d339d47c02ff056ba95d3608aa681882893a46d2a0f723f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI fournit des API développeur pour les modèles GPT. OpenClaw prend en charge deux modes d'authentification :

- **Clé API** — accès direct à la plateforme OpenAI avec facturation à l'usage (modèles `openai/*`)
- **Abonnement Codex** — connexion ChatGPT/Codex avec accès par abonnement (modèles `openai-codex/*`)

OpenAI prend explicitement en charge l'utilisation d'OAuth par abonnement dans des outils et flux de travail externes comme OpenClaw.

## Premiers pas

Choisissez votre méthode d'authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API (plateforme OpenAI)">
    **Idéal pour :** l'accès direct à l'API et la facturation à l'usage.

    <Steps>
      <Step title="Récupérez votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord de la plateforme OpenAI](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Lancez l'onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passez directement la clé :

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Vérifiez que le modèle est disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Résumé de la route

    | Référence du modèle | Route | Authentification |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API directe de la plateforme OpenAI | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API directe de la plateforme OpenAI | `OPENAI_API_KEY` |

    <Note>
    La connexion ChatGPT/Codex passe par `openai-codex/*`, et non par `openai/*`.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw n'expose **pas** `openai/gpt-5.3-codex-spark` sur le chemin direct de l'API. Les requêtes OpenAI API en direct rejettent ce modèle. Spark est réservé à Codex.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex au lieu d'une clé API distincte. Codex cloud nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Exécutez l'OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez directement OAuth :

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Définissez le modèle par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Vérifiez que le modèle est disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Résumé de la route

    | Référence du modèle | Route | Authentification |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | Connexion Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | Connexion Codex (selon les droits) |

    <Note>
    Cette route est intentionnellement distincte de `openai/gpt-5.4`. Utilisez `openai/*` avec une clé API pour un accès direct à la plateforme, et `openai-codex/*` pour un accès via abonnement Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Si l'onboarding réutilise une connexion Codex CLI existante, ces identifiants restent gérés par Codex CLI. À l'expiration, OpenClaw relit d'abord la source Codex externe puis réécrit l'identifiant actualisé dans le stockage Codex.
    </Tip>

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées du modèle et la limite de contexte d'exécution comme des valeurs distinctes.

    Pour `openai-codex/gpt-5.4` :

    - `contextWindow` natif : `1050000`
    - Limite `contextTokens` d'exécution par défaut : `272000`

    La plus petite limite par défaut offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-la avec `contextTokens` :

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte à l'exécution.
    </Note>

  </Tab>
</Tabs>

## Génération d'images

Le plugin `openai` fourni enregistre la génération d'images via l'outil `image_generate`.

| Capacité                 | Valeur                             |
| ------------------------ | ---------------------------------- |
| Modèle par défaut        | `openai/gpt-image-2`               |
| Images max par requête   | 4                                  |
| Mode édition             | Activé (jusqu'à 5 images de référence) |
| Substitutions de taille  | Prises en charge, y compris les tailles 2K/4K |
| Ratio d'aspect / résolution | Non transmis à l'API OpenAI Images |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consultez [Génération d'images](/fr/tools/image-generation) pour les paramètres d'outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut à la fois pour la génération d'images à partir de texte avec OpenAI et pour l'édition d'images. `gpt-image-1` reste utilisable comme substitution explicite de modèle, mais les nouveaux flux OpenAI de génération d'images doivent utiliser `openai/gpt-image-2`.

Générer :

```
/tool image_generate model=openai/gpt-image-2 prompt="Une affiche de lancement soignée pour OpenClaw sur macOS" size=3840x2160 count=1
```

Modifier :

```
/tool image_generate model=openai/gpt-image-2 prompt="Conserver la forme de l'objet, changer le matériau en verre translucide" image=/path/to/reference.png size=1024x1536
```

## Génération vidéo

Le plugin `openai` fourni enregistre la génération vidéo via l'outil `video_generate`.

| Capacité       | Valeur                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2`                                                                |
| Modes          | Texte vers vidéo, image vers vidéo, édition d'une seule vidéo                      |
| Entrées de référence | 1 image ou 1 vidéo                                                          |
| Substitutions de taille | Prises en charge                                                          |
| Autres substitutions | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement de l'outil |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres d'outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Contribution de prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 spécifique à OpenAI pour les exécutions de la famille GPT-5 sur `openai/*` et `openai-codex/*`. Elle réside dans le plugin OpenAI fourni, s'applique aux IDs de modèle tels que `gpt-5`, `gpt-5.2`, `gpt-5.4` et `gpt-5.4-mini`, et ne s'applique pas aux anciens modèles GPT-4.x.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de persona, la sécurité d'exécution, la discipline des outils, la forme de sortie, les vérifications de complétion et la vérification. Le comportement de réponse et de message silencieux spécifique au canal reste dans le prompt système OpenClaw partagé et dans la politique de livraison sortante. Les recommandations GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d'interaction conviviale est distincte et configurable.

| Valeur                 | Effet                                         |
| ---------------------- | --------------------------------------------- |
| `"friendly"` (par défaut) | Active la couche de style d'interaction conviviale |
| `"on"`                 | Alias de `"friendly"`                         |
| `"off"`                | Désactive uniquement la couche de style conviviale |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Les valeurs ne tiennent pas compte de la casse à l'exécution, donc `"Off"` et `"off"` désactivent tous deux la couche de style conviviale.
</Tip>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le plugin `openai` fourni enregistre la synthèse vocale pour la surface `messages.tts`.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Se replie sur `OPENAI_API_KEY` |
    | URL de base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Définissez `OPENAI_TTS_BASE_URL` pour remplacer l'URL de base TTS sans affecter le point de terminaison de l'API de chat.
    </Note>

  </Accordion>

  <Accordion title="Transcription en temps réel">
    Le plugin `openai` fourni enregistre la transcription en temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Durée de silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Se replie sur `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket vers `wss://api.openai.com/v1/realtime` avec de l'audio G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel">
    Le plugin `openai` fourni enregistre la voix en temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée de silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Se replie sur `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment`. Prend en charge les appels d'outils bidirectionnels. Utilise le format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise WebSocket en priorité avec basculement SSE (`"auto"`) pour `openai/*` comme pour `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie une fois après un échec WebSocket précoce avant de basculer vers SSE
    - Après un échec, marque WebSocket comme dégradé pendant ~60 secondes et utilise SSE pendant la période de refroidissement
    - Attache des en-têtes stables d'identité de session et de tour pour les nouvelles tentatives et reconnexions
    - Normalise les compteurs d'utilisation (`input_tokens` / `prompt_tokens`) entre les variantes de transport

    | Valeur | Comportement |
    |-------|----------|
    | `"auto"` (par défaut) | WebSocket d'abord, basculement vers SSE |
    | `"sse"` | Forcer SSE uniquement |
    | `"websocket"` | Forcer WebSocket uniquement |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentation OpenAI associée :
    - [API Realtime avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Pré-initialisation WebSocket">
    OpenClaw active par défaut la pré-initialisation WebSocket pour `openai/*` afin de réduire la latence du premier tour.

    ```json5
    // Désactiver la pré-initialisation
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode rapide">
    OpenClaw expose un basculement partagé de mode rapide pour `openai/*` et `openai-codex/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Config :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu'il est activé, OpenClaw mappe le mode rapide sur le traitement prioritaire OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont conservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Les substitutions de session priment sur la configuration. Effacer la substitution de session dans l'UI Sessions ramène la session à la valeur configurée par défaut.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L'API d'OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valeurs prises en charge : `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` n'est transmis qu'aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous faites passer l'un de ces fournisseurs par un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), OpenClaw active automatiquement la Compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu'il n'est pas disponible)

    <Tabs>
      <Tab title="Activer explicitement">
        Utile pour des points de terminaison compatibles comme Azure OpenAI Responses :

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Seuil personnalisé">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Désactiver">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` contrôle uniquement l'injection de `context_management`. Les modèles OpenAI Responses directs forcent toujours `store: true` sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentique strict">
    Pour les exécutions de la famille GPT-5 sur `openai/*` et `openai-codex/*`, OpenClaw peut utiliser un contrat d'exécution embarqué plus strict :

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Avec `strict-agentic`, OpenClaw :
    - Ne traite plus un tour avec plan seul comme une progression réussie lorsqu'une action d'outil est disponible
    - Réessaie le tour avec une consigne d'agir maintenant
    - Active automatiquement `update_plan` pour les travaux substantiels
    - Affiche un état bloqué explicite si le modèle continue à planifier sans agir

    <Note>
    Limité uniquement aux exécutions OpenAI et Codex de la famille GPT-5. Les autres fournisseurs et les anciennes familles de modèles conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives vs compatibles OpenAI">
    OpenClaw traite différemment les points de terminaison directs OpenAI, Codex et Azure OpenAI par rapport aux proxys génériques compatibles OpenAI `/v1` :

    **Routes natives** (`openai/*`, `openai-codex/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l'effort OpenAI `none`
    - Omettent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - Définissent par défaut les schémas d'outils en mode strict
    - Attachent des en-têtes d'attribution cachés uniquement sur des hôtes natifs vérifiés
    - Conservent la mise en forme de requête spécifique à OpenAI (`service_tier`, `store`, compatibilité raisonnement, indices de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Ne forcent pas les schémas d'outils stricts ni les en-têtes réservés aux routes natives

    Azure OpenAI utilise le transport natif et le comportement de compatibilité natif, mais ne reçoit pas les en-têtes d'attribution cachés.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèle et comportement de basculement.
  </Card>
  <Card title="Génération d'images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l'outil image et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l'outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d'authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
