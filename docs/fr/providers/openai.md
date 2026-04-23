---
read_when:
    - Vous voulez utiliser des modèles OpenAI dans OpenClaw
    - Vous voulez une authentification par abonnement Codex au lieu de clés API
    - Vous avez besoin d’un comportement d’exécution agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T07:10:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d847e53c2faee5363071dfdcb1f4150b64577674161e000844f579482198d1
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI fournit des API pour développeurs pour les modèles GPT. OpenClaw prend en charge deux modes d’authentification :

  - **Clé API** — accès direct à OpenAI Platform avec facturation à l’usage (modèles `openai/*`)
  - **Abonnement Codex** — connexion ChatGPT/Codex avec accès par abonnement (modèles `openai-codex/*`)

  OpenAI prend explicitement en charge l’utilisation d’OAuth d’abonnement dans des outils et flux externes comme OpenClaw.

  ## Couverture des fonctionnalités OpenClaw

  | Capacité OpenAI          | Surface OpenClaw                           | Statut                                                  |
  | ------------------------ | ----------------------------------------- | ------------------------------------------------------- |
  | Chat / Responses         | fournisseur de modèles `openai/<model>`   | Oui                                                     |
  | Modèles d’abonnement Codex | fournisseur de modèles `openai-codex/<model>` | Oui                                                 |
  | Recherche web côté serveur | outil natif OpenAI Responses             | Oui, lorsque la recherche web est activée et qu’aucun fournisseur n’est épinglé |
  | Images                   | `image_generate`                          | Oui                                                     |
  | Vidéos                   | `video_generate`                          | Oui                                                     |
  | Synthèse vocale          | `messages.tts.provider: "openai"` / `tts` | Oui                                                     |
  | Speech-to-text par lot   | `tools.media.audio` / compréhension média | Oui                                                     |
  | Speech-to-text en streaming | Voice Call `streaming.provider: "openai"` | Oui                                                  |
  | Voix temps réel          | Voice Call `realtime.provider: "openai"`  | Oui                                                     |
  | Embeddings               | fournisseur d’embeddings mémoire          | Oui                                                     |

  ## Pour commencer

  Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

  <Tabs>
  <Tab title="Clé API (OpenAI Platform)">
    **Idéal pour :** accès direct à l’API et facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passez la clé directement :

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Résumé du routage

    | Réf. modèle | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API OpenAI Platform directe | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API OpenAI Platform directe | `OPENAI_API_KEY` |

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
    OpenClaw n’expose **pas** `openai/gpt-5.3-codex-spark` sur le chemin API direct. Les requêtes live à l’API OpenAI rejettent ce modèle. Spark est réservé à Codex.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex au lieu d’une clé API distincte. Codex cloud nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Exécuter l’OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez directement OAuth :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les configurations sans interface ou hostiles aux callbacks, ajoutez `--device-code` pour vous connecter avec un flux de code d’appareil ChatGPT au lieu du callback navigateur localhost :

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Définir le modèle par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Résumé du routage

    | Réf. modèle | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | Connexion Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | Connexion Codex (selon les droits) |

    <Note>
    Cette route est volontairement séparée de `openai/gpt-5.4`. Utilisez `openai/*` avec une clé API pour l’accès direct à Platform, et `openai-codex/*` pour l’accès via abonnement Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    L’onboarding n’importe plus le matériel OAuth depuis `~/.codex`. Connectez-vous avec l’OAuth navigateur (par défaut) ou le flux de code d’appareil ci-dessus — OpenClaw gère les identifiants résultants dans son propre stockage d’authentification agent.
    </Note>

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées du modèle et le plafond de contexte runtime comme des valeurs distinctes.

    Pour `openai-codex/gpt-5.4` :

    - `contextWindow` natif : `1050000`
    - Plafond `contextTokens` runtime par défaut : `272000`

    Le plafond par défaut plus petit offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-le avec `contextTokens` :

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
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte runtime.
    </Note>

  </Tab>
</Tabs>

## Génération d’images

Le plugin `openai` inclus enregistre la génération d’images via l’outil `image_generate`.

| Capacité                | Valeur                             |
| ----------------------- | ---------------------------------- |
| Modèle par défaut       | `openai/gpt-image-2`               |
| Nombre max d’images par requête | 4                          |
| Mode édition            | Activé (jusqu’à 5 images de référence) |
| Remplacements de taille | Pris en charge, y compris les tailles 2K/4K |
| Rapport d’aspect / résolution | Non transmis à l’API OpenAI Images |

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
Voir [Génération d’images](/fr/tools/image-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération texte-vers-image OpenAI et pour l’édition d’images. `gpt-image-1` reste utilisable comme remplacement explicite de modèle, mais les nouveaux flux d’images OpenAI doivent utiliser `openai/gpt-image-2`.

Générer :

```
/tool image_generate model=openai/gpt-image-2 prompt="Une affiche de lancement soignée pour OpenClaw sur macOS" size=3840x2160 count=1
```

Éditer :

```
/tool image_generate model=openai/gpt-image-2 prompt="Préservez la forme de l’objet, changez le matériau en verre translucide" image=/path/to/reference.png size=1024x1536
```

## Génération vidéo

Le plugin `openai` inclus enregistre la génération vidéo via l’outil `video_generate`.

| Capacité       | Valeur                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2`                                                                 |
| Modes          | Texte vers vidéo, image vers vidéo, édition d’une seule vidéo                      |
| Entrées de référence | 1 image ou 1 vidéo                                                           |
| Remplacements de taille | Pris en charge                                                             |
| Autres remplacements | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement de l’outil |

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
Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Contribution de prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 chez tous les fournisseurs. Elle s’applique par identifiant de modèle, donc `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` et d’autres références GPT-5 compatibles reçoivent la même surcouche. Les anciens modèles GPT-4.x ne la reçoivent pas.

Le fournisseur natif inclus de harnais Codex (`codex/*`) utilise le même comportement GPT-5 et la même surcouche Heartbeat via les instructions développeur app-server Codex, de sorte que les sessions `codex/gpt-5.x` conservent le même suivi et les mêmes consignes Heartbeat proactives même si Codex possède le reste du prompt de harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de personnalité, la sécurité d’exécution, la discipline des outils, la forme de sortie, les vérifications d’achèvement et la vérification. Le comportement spécifique au canal pour les réponses et les messages silencieux reste dans le prompt système partagé OpenClaw et dans la politique de livraison sortante. Les consignes GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d’interaction conviviale est séparée et configurable.

| Valeur                 | Effet                                         |
| ---------------------- | --------------------------------------------- |
| `"friendly"` (par défaut) | Activer la couche de style d’interaction conviviale |
| `"on"`                 | Alias de `"friendly"`                         |
| `"off"`                | Désactiver uniquement la couche de style conviviale |

<Tabs>
  <Tab title="Configuration">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Les valeurs sont insensibles à la casse à l’exécution, donc `"Off"` et `"off"` désactivent toutes deux la couche de style conviviale.
</Tip>

<Note>
L’ancienne option `plugins.entries.openai.config.personality` est encore lue comme repli de compatibilité lorsque le paramètre partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le plugin `openai` inclus enregistre la synthèse vocale pour la surface `messages.tts`.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Repli vers `OPENAI_API_KEY` |
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
    Définissez `OPENAI_TTS_BASE_URL` pour remplacer l’URL de base TTS sans affecter le point de terminaison de l’API de chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Le plugin `openai` inclus enregistre le speech-to-text par lot via
    la surface de transcription de compréhension média d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : REST OpenAI `/v1/audio/transcriptions`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de canal vocal Discord et les
      pièces jointes audio de canaux

    Pour forcer OpenAI pour la transcription audio entrante :

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Les indications de langue et de prompt sont transmises à OpenAI lorsqu’elles sont fournies par la
    configuration média audio partagée ou par une requête de transcription par appel.

  </Accordion>

  <Accordion title="Transcription temps réel">
    Le plugin `openai` inclus enregistre la transcription temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée de silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Repli vers `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket vers `wss://api.openai.com/v1/realtime` avec audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming est destiné au chemin de transcription temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise à la place le chemin de transcription par lot `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix temps réel">
    Le plugin `openai` inclus enregistre la voix temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée de silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Repli vers `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment`. Prend en charge l’appel d’outils bidirectionnel. Utilise le format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise d’abord WebSocket avec repli SSE (`"auto"`) pour `openai/*` et `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie une première défaillance WebSocket avant de basculer sur SSE
    - Après un échec, marque WebSocket comme dégradé pendant ~60 secondes et utilise SSE pendant le refroidissement
    - Attache des en-têtes stables d’identité de session et de tour pour les nouvelles tentatives et reconnexions
    - Normalise les compteurs d’usage (`input_tokens` / `prompt_tokens`) selon les variantes de transport

    | Valeur | Comportement |
    |-------|----------|
    | `"auto"` (par défaut) | WebSocket d’abord, repli SSE |
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
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Préchauffage WebSocket">
    OpenClaw active par défaut le préchauffage WebSocket pour `openai/*` afin de réduire la latence du premier tour.

    ```json5
    // Disable warm-up
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

<a id="openai-fast-mode"></a>

  <Accordion title="Mode rapide">
    OpenClaw expose un basculeur partagé de mode rapide pour `openai/*` et `openai-codex/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw mappe le mode rapide vers le traitement prioritaire OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont conservées, et le mode rapide ne réécrit ni `reasoning` ni `text.verbosity`.

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
    Les remplacements de session ont priorité sur la configuration. Effacer le remplacement de session dans l’interface Sessions ramène la session au défaut configuré.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L’API OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

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
    `serviceTier` n’est transmis qu’aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous faites passer l’un ou l’autre fournisseur par un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (Responses API)">
    Pour les modèles directs OpenAI Responses (`openai/*` sur `api.openai.com`), OpenClaw active automatiquement la Compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu’indisponible)

    <Tabs>
      <Tab title="Activer explicitement">
        Utile pour les points de terminaison compatibles comme Azure OpenAI Responses :

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
    `responsesServerCompaction` contrôle uniquement l’injection de `context_management`. Les modèles directs OpenAI Responses forcent toujours `store: true` sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentique strict">
    Pour les exécutions de la famille GPT-5 sur `openai/*` et `openai-codex/*`, OpenClaw peut utiliser un contrat d’exécution intégré plus strict :

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
    - Ne traite plus un tour contenant uniquement un plan comme une progression réussie lorsqu’une action d’outil est disponible
    - Réessaie le tour avec une consigne d’agir maintenant
    - Active automatiquement `update_plan` pour un travail substantiel
    - Expose un état bloqué explicite si le modèle continue à planifier sans agir

    <Note>
    Limité aux exécutions OpenAI et Codex de la famille GPT-5 uniquement. Les autres fournisseurs et familles de modèles plus anciennes conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives vs routes compatibles OpenAI">
    OpenClaw traite différemment les points de terminaison directs OpenAI, Codex et Azure OpenAI par rapport aux proxys génériques compatibles OpenAI `/v1` :

    **Routes natives** (`openai/*`, `openai-codex/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l’effort OpenAI `none`
    - Omettent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - Mettent par défaut les schémas d’outils en mode strict
    - Attachent des en-têtes d’attribution cachés uniquement sur des hôtes natifs vérifiés
    - Conservent le façonnage de requête réservé à OpenAI (`service_tier`, `store`, compatibilité de raisonnement, indications de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Ne forcent ni schémas d’outils stricts ni en-têtes réservés au natif

    Azure OpenAI utilise le transport natif et le comportement de compatibilité natif mais ne reçoit pas les en-têtes d’attribution cachés.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèle et comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil image et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
