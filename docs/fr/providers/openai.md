---
read_when:
    - Vous voulez utiliser des modèles OpenAI dans OpenClaw
    - Vous voulez une authentification par abonnement Codex au lieu de clés API
    - Vous avez besoin d’un comportement d’exécution d’agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:56:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI fournit des API développeur pour les modèles GPT. OpenClaw prend en charge trois routes de la famille OpenAI. Le préfixe du modèle sélectionne la route :

- **Clé API** — accès direct à OpenAI Platform avec facturation à l’usage (modèles `openai/*`)
- **Abonnement Codex via Pi** — connexion ChatGPT/Codex avec accès par abonnement (modèles `openai-codex/*`)
- **Harnais Codex app-server** — exécution native Codex app-server (modèles `openai/*` plus `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI prend explicitement en charge l’usage d’OAuth par abonnement dans des outils externes et des workflows comme OpenClaw.

Le fournisseur, le modèle, le runtime et le canal sont des couches séparées. Si ces étiquettes
commencent à se mélanger, lisez [Runtimes d’agent](/fr/concepts/agent-runtimes) avant
de modifier la configuration.

## Choix rapide

| Objectif                                      | Utiliser                                                  | Remarques                                                                   |
| --------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Facturation directe par clé API               | `openai/gpt-5.4`                                          | Définissez `OPENAI_API_KEY` ou exécutez l’onboarding par clé API OpenAI.    |
| GPT-5.5 avec auth par abonnement ChatGPT/Codex | `openai-codex/gpt-5.5`                                   | Route Pi par défaut pour Codex OAuth. Meilleur premier choix pour les installations par abonnement. |
| GPT-5.5 avec comportement natif Codex app-server | `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"` | Utilise le harnais Codex app-server, pas la route de l’API publique OpenAI. |
| Génération ou édition d’image                 | `openai/gpt-image-2`                                      | Fonctionne avec `OPENAI_API_KEY` ou OpenAI Codex OAuth.                     |

<Note>
GPT-5.5 est actuellement disponible dans OpenClaw via les routes abonnement/OAuth :
`openai-codex/gpt-5.5` avec l’exécuteur Pi, ou `openai/gpt-5.5` avec le
harnais Codex app-server. L’accès direct par clé API à `openai/gpt-5.5` est
pris en charge une fois qu’OpenAI active GPT-5.5 sur l’API publique ; en attendant utilisez un
modèle activé sur l’API comme `openai/gpt-5.4` pour les configurations `OPENAI_API_KEY`.
</Note>

<Note>
Activer le plugin OpenAI, ou sélectionner un modèle `openai-codex/*`, n’active pas
le plugin inclus Codex app-server. OpenClaw n’active ce plugin que
lorsque vous sélectionnez explicitement le harnais Codex natif avec
`embeddedHarness.runtime: "codex"` ou utilisez une ancienne référence de modèle `codex/*`.
</Note>

## Couverture des fonctionnalités OpenClaw

| Fonctionnalité OpenAI      | Surface OpenClaw                                          | Statut                                                 |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses           | fournisseur de modèles `openai/<model>`                   | Oui                                                    |
| Modèles par abonnement Codex | `openai-codex/<model>` avec OAuth `openai-codex`        | Oui                                                    |
| Harnais Codex app-server   | `openai/<model>` avec `embeddedHarness.runtime: codex`    | Oui                                                    |
| Recherche web côté serveur | Outil natif OpenAI Responses                              | Oui, lorsque la recherche web est activée et qu’aucun fournisseur n’est épinglé |
| Images                     | `image_generate`                                          | Oui                                                    |
| Vidéos                     | `video_generate`                                          | Oui                                                    |
| Text-to-speech             | `messages.tts.provider: "openai"` / `tts`                 | Oui                                                    |
| Speech-to-text par lot     | `tools.media.audio` / compréhension des médias            | Oui                                                    |
| Speech-to-text en streaming | Voice Call `streaming.provider: "openai"`                | Oui                                                    |
| Voix en temps réel         | Voice Call `realtime.provider: "openai"` / Control UI Talk | Oui                                                   |
| Embeddings                 | fournisseur d’embeddings mémoire                          | Oui                                                    |

## Prise en main

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API (OpenAI Platform)">
    **Idéal pour :** l’accès direct à l’API et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passez directement la clé :

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

    ### Résumé de la route

    | Référence de modèle | Route | Authentification |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API OpenAI Platform directe | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API OpenAI Platform directe | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Future route API directe une fois qu’OpenAI active GPT-5.5 sur l’API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` est la route API OpenAI directe par clé API sauf si vous forcez explicitement
    le harnais Codex app-server. GPT-5.5 lui-même est actuellement réservé à l’abonnement/OAuth ;
    utilisez `openai-codex/*` pour Codex OAuth via l’exécuteur Pi par défaut, ou
    utilisez `openai/gpt-5.5` avec `embeddedHarness.runtime: "codex"` pour l’exécution native
    Codex app-server.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw n’expose **pas** `openai/gpt-5.3-codex-spark`. Les requêtes live à l’API OpenAI rejettent ce modèle, et le catalogue Codex actuel ne l’expose pas non plus.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex au lieu d’une clé API séparée. Codex cloud nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Exécuter Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez OAuth directement :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les installations headless ou hostiles au callback, ajoutez `--device-code` pour vous connecter avec un flux de code appareil ChatGPT au lieu du callback navigateur localhost :

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Définir le modèle par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Résumé de la route

    | Référence de modèle | Route | Authentification |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex via Pi | connexion Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harnais Codex app-server | authentification Codex app-server |

    <Note>
    Continuez à utiliser l’identifiant de fournisseur `openai-codex` pour les commandes d’authentification/profil. Le
    préfixe de modèle `openai-codex/*` est aussi la route Pi explicite pour Codex OAuth.
    Il ne sélectionne ni n’active automatiquement le harnais inclus Codex app-server.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L’onboarding n’importe plus de matériel OAuth depuis `~/.codex`. Connectez-vous avec l’OAuth navigateur (par défaut) ou le flux de code appareil ci-dessus — OpenClaw gère les identifiants résultants dans son propre stockage d’authentification d’agent.
    </Note>

    ### Indicateur d’état

    Le `/status` du chat affiche quel runtime de modèle est actif pour la session courante.
    Le harnais Pi par défaut apparaît comme `Runtime: OpenClaw Pi Default`. Lorsque le
    harnais inclus Codex app-server est sélectionné, `/status` affiche
    `Runtime: OpenAI Codex`. Les sessions existantes conservent leur identifiant de harnais enregistré, utilisez donc
    `/new` ou `/reset` après avoir modifié `embeddedHarness` si vous voulez que `/status`
    reflète un nouveau choix Pi/Codex.

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées de modèle et la limite de contexte du runtime comme des valeurs séparées.

    Pour `openai-codex/gpt-5.5` via Codex OAuth :

    - `contextWindow` natif : `1000000`
    - Limite `contextTokens` du runtime par défaut : `272000`

    La limite par défaut plus petite offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-la avec `contextTokens` :

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte du runtime.
    </Note>

    ### Récupération du catalogue

    OpenClaw utilise les métadonnées du catalogue Codex amont pour `gpt-5.5` lorsqu’elles sont
    présentes. Si la découverte live Codex omet la ligne `openai-codex/gpt-5.5` alors
    que le compte est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que
    les exécutions Cron, sous-agents et modèles par défaut configurés n’échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Génération d’images

Le plugin `openai` inclus enregistre la génération d’images via l’outil `image_generate`.
Il prend en charge à la fois la génération d’images par clé API OpenAI et la génération d’images
par Codex OAuth via la même référence de modèle `openai/gpt-image-2`.

| Fonctionnalité            | Clé API OpenAI                     | Codex OAuth                           |
| ------------------------- | ---------------------------------- | ------------------------------------- |
| Référence de modèle       | `openai/gpt-image-2`               | `openai/gpt-image-2`                  |
| Authentification          | `OPENAI_API_KEY`                   | connexion OpenAI Codex OAuth          |
| Transport                 | API OpenAI Images                  | backend Codex Responses               |
| Nombre max d’images par requête | 4                            | 4                                     |
| Mode édition              | Activé (jusqu’à 5 images de référence) | Activé (jusqu’à 5 images de référence) |
| Remplacements de taille   | Pris en charge, y compris les tailles 2K/4K | Pris en charge, y compris les tailles 2K/4K |
| Ratio / résolution        | Non transmis à l’API OpenAI Images | Mappé à une taille prise en charge lorsque c’est sûr |

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
Voir [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de repli.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération texte-vers-image OpenAI et pour l’édition d’image. `gpt-image-1` reste utilisable comme remplacement explicite de modèle, mais les nouveaux workflows d’image OpenAI devraient utiliser `openai/gpt-image-2`.

Pour les installations Codex OAuth, conservez la même référence `openai/gpt-image-2`. Lorsqu’un
profil OAuth `openai-codex` est configuré, OpenClaw résout ce jeton d’accès OAuth
stocké et envoie les requêtes d’image via le backend Codex Responses. Il
n’essaie pas d’abord `OPENAI_API_KEY` et ne se replie pas silencieusement sur une clé API pour cette
requête. Configurez explicitement `models.providers.openai` avec une clé API,
une URL de base personnalisée ou un point de terminaison Azure lorsque vous voulez la route
directe OpenAI Images API à la place.
Si ce point de terminaison d’image personnalisé se trouve sur un LAN/adresse privée de confiance, définissez aussi
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw continue de
bloquer les points de terminaison d’image OpenAI compatibles privés/internes sauf si cet opt-in est
présent.

Générer :

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Éditer :

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Génération vidéo

Le plugin `openai` inclus enregistre la génération vidéo via l’outil `video_generate`.

| Fonctionnalité  | Valeur                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2`                                                                 |
| Modes           | Texte-vers-vidéo, image-vers-vidéo, édition d’une seule vidéo                     |
| Entrées de référence | 1 image ou 1 vidéo                                                            |
| Remplacements de taille | Pris en charge                                                              |
| Autres remplacements | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement d’outil |

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
Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de repli.
</Note>

## Contribution de prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 sur l’ensemble des fournisseurs. Elle s’applique par identifiant de modèle, de sorte que `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` et d’autres références GPT-5 compatibles reçoivent la même surcouche. Les anciens modèles GPT-4.x n’en bénéficient pas.

Le harnais Codex natif inclus utilise le même comportement GPT-5 et la même surcouche Heartbeat via les instructions développeur Codex app-server, de sorte que les sessions `openai/gpt-5.x` forcées via `embeddedHarness.runtime: "codex"` conservent le même suivi et les mêmes indications Heartbeat proactives, même si Codex gère le reste du prompt du harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de la persona, la sécurité d’exécution, la discipline des outils, la forme de sortie, les vérifications de complétion et la vérification. Le comportement de réponse spécifique au canal et les messages silencieux restent dans le prompt système partagé d’OpenClaw et dans la politique de distribution sortante. Les indications GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d’interaction convivial est séparée et configurable.

| Valeur                 | Effet                                          |
| ---------------------- | ---------------------------------------------- |
| `"friendly"` (par défaut) | Active la couche de style d’interaction convivial |
| `"on"`                 | Alias de `"friendly"`                          |
| `"off"`                | Désactive uniquement la couche de style convivial |

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
Les valeurs sont insensibles à la casse à l’exécution, donc `"Off"` et `"off"` désactivent toutes deux la couche de style convivial.
</Tip>

<Note>
L’ancienne valeur `plugins.entries.openai.config.personality` est toujours lue comme repli de compatibilité lorsque le paramètre partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
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
    | Clé API | `messages.tts.providers.openai.apiKey` | Repli sur `OPENAI_API_KEY` |
    | URL de base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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
    la surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : REST OpenAI `/v1/audio/transcriptions`
    - Chemin d’entrée : upload de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de canal vocal Discord et les
      pièces jointes audio des canaux

    Pour forcer OpenAI pour la transcription audio entrante :

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
    configuration audio partagée des médias ou par la requête de transcription par appel.

  </Accordion>

  <Accordion title="Transcription en temps réel">
    Le plugin `openai` inclus enregistre la transcription en temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée de silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Repli sur `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket vers `wss://api.openai.com/v1/realtime` avec audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming est destiné au chemin de transcription en temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise le chemin de transcription par lot `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel">
    Le plugin `openai` inclus enregistre la voix en temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée de silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Repli sur `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment`. Prend en charge l’appel d’outils bidirectionnel. Utilise le format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Points de terminaison Azure OpenAI

Le fournisseur `openai` inclus peut cibler une ressource Azure OpenAI pour la génération
d’images en remplaçant l’URL de base. Sur le chemin de génération d’images, OpenClaw
détecte les noms d’hôte Azure dans `models.providers.openai.baseUrl` et bascule automatiquement vers
la forme de requête Azure.

<Note>
La voix en temps réel utilise un chemin de configuration séparé
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n’est pas affectée par `models.providers.openai.baseUrl`. Voir l’accordéon **Voix
en temps réel** sous [Voix et parole](#voice-and-speech) pour ses paramètres
Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- Vous disposez déjà d’un abonnement, d’un quota ou d’un contrat entreprise Azure OpenAI
- Vous avez besoin de la résidence régionale des données ou des contrôles de conformité fournis par Azure
- Vous voulez garder le trafic dans un tenant Azure existant

### Configuration

Pour la génération d’images Azure via le fournisseur `openai` inclus, pointez
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (et non une clé OpenAI Platform) :

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw reconnaît ces suffixes d’hôte Azure pour la route Azure de génération d’images :

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Pour les requêtes de génération d’images sur un hôte Azure reconnu, OpenClaw :

- Envoie l’en-tête `api-key` au lieu de `Authorization: Bearer`
- Utilise des chemins à portée de déploiement (`/openai/deployments/{deployment}/...`)
- Ajoute `?api-version=...` à chaque requête

Les autres URL de base (OpenAI public, proxies compatibles OpenAI) conservent la forme
standard des requêtes d’image OpenAI.

<Note>
Le routage Azure pour le chemin de génération d’images du fournisseur `openai`
nécessite OpenClaw 2026.4.22 ou plus récent. Les versions antérieures traitent tout
`openai.baseUrl` personnalisé comme le point de terminaison OpenAI public et échoueront face aux
déploiements d’images Azure.
</Note>

### Version d’API

Définissez `AZURE_OPENAI_API_VERSION` pour épingler une version Azure preview ou GA spécifique
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèle sont des noms de déploiement

Azure OpenAI lie les modèles à des déploiements. Pour les requêtes Azure de génération d’images
routées via le fournisseur `openai` inclus, le champ `model` dans OpenClaw
doit être le **nom du déploiement Azure** que vous avez configuré dans le portail Azure, et non
l’identifiant du modèle OpenAI public.

Si vous créez un déploiement nommé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La même règle de nom de déploiement s’applique aux appels de génération d’images routés via
le fournisseur `openai` inclus.

### Disponibilité régionale

La génération d’images Azure n’est actuellement disponible que dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Vérifiez la liste actuelle des régions Microsoft avant de créer un
déploiement, et confirmez que le modèle spécifique est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut rejeter des options que l’OpenAI public autorise (par exemple certaines
valeurs de `background` sur `gpt-image-2`) ou ne les exposer que sur des versions
de modèle spécifiques. Ces différences viennent d’Azure et du modèle sous-jacent, pas
d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez l’ensemble
de paramètres pris en charge par votre déploiement et votre version d’API spécifiques dans le
portail Azure.

<Note>
Azure OpenAI utilise le comportement de transport et de compatibilité natif mais ne reçoit pas
les en-têtes d’attribution masqués d’OpenClaw — voir l’accordéon **Routes natives vs compatibles OpenAI**
sous [Configuration avancée](#advanced-configuration).

Pour le trafic chat ou Responses sur Azure (au-delà de la génération d’images), utilisez le
flux d’onboarding ou une configuration de fournisseur Azure dédiée — `openai.baseUrl` à lui seul
ne récupère pas la forme API/auth d’Azure. Un fournisseur séparé
`azure-openai-responses/*` existe ; voir
l’accordéon Compaction côté serveur ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise WebSocket en priorité avec repli SSE (`"auto"`) pour `openai/*` et `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie une fois en cas d’échec précoce WebSocket avant de se replier sur SSE
    - Après un échec, marque WebSocket comme dégradé pendant ~60 secondes et utilise SSE pendant le refroidissement
    - Attache des en-têtes stables d’identité de session et de tour pour les réessais et les reconnexions
    - Normalise les compteurs d’usage (`input_tokens` / `prompt_tokens`) entre les variantes de transport

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
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentation OpenAI associée :
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Préchauffage WebSocket">
    OpenClaw active le préchauffage WebSocket par défaut pour `openai/*` et `openai-codex/*` afin de réduire la latence du premier tour.

    ```json5
    // Désactiver le préchauffage
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
    OpenClaw expose un basculement de mode rapide partagé pour `openai/*` et `openai-codex/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw mappe le mode rapide vers le traitement prioritaire OpenAI (`service_tier = "priority"`). Les valeurs existantes de `service_tier` sont conservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Les remplacements de session sont prioritaires sur la configuration. Supprimer le remplacement de session dans l’interface Sessions ramène la session à la valeur par défaut configurée.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L’API OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valeurs prises en charge : `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` n’est transmis qu’aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous routez l’un ou l’autre fournisseur via un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (Responses API)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), le wrapper de flux Pi-harness du plugin OpenAI active automatiquement la compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu’il est indisponible)

    Cela s’applique au chemin Pi harness intégré et aux hooks du fournisseur OpenAI utilisés par les exécutions embarquées. Le harnais Codex app-server natif gère son propre contexte via Codex et se configure séparément avec `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Activer explicitement">
        Utile pour les points de terminaison compatibles comme Azure OpenAI Responses :

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
    `responsesServerCompaction` ne contrôle que l’injection de `context_management`. Les modèles OpenAI Responses directs forcent toujours `store: true` sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentique strict">
    Pour les exécutions de la famille GPT-5 sur `openai/*`, OpenClaw peut utiliser un contrat d’exécution embarqué plus strict :

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Avec `strict-agentic`, OpenClaw :
    - Ne traite plus un tour avec plan uniquement comme une progression réussie lorsqu’une action d’outil est disponible
    - Réessaie le tour avec une incitation à agir immédiatement
    - Active automatiquement `update_plan` pour les travaux importants
    - Fait apparaître un état de blocage explicite si le modèle continue à planifier sans agir

    <Note>
    Limité aux exécutions OpenAI et Codex de la famille GPT-5 uniquement. Les autres fournisseurs et familles de modèles plus anciennes conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives vs compatibles OpenAI">
    OpenClaw traite différemment les points de terminaison directs OpenAI, Codex et Azure OpenAI par rapport aux proxies génériques compatibles OpenAI `/v1` :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l’effort OpenAI `none`
    - Ommettent le raisonnement désactivé pour les modèles ou proxies qui rejettent `reasoning.effort: "none"`
    - Font des schémas d’outils stricts la valeur par défaut
    - Attachent des en-têtes d’attribution masqués uniquement sur les hôtes natifs vérifiés
    - Conservent la mise en forme de requête propre à OpenAI (`service_tier`, `store`, compatibilité du raisonnement, indications de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Suppriment `store` des payloads `openai-completions` non natifs
    - Acceptent le passthrough JSON avancé `params.extra_body`/`params.extraBody` pour les proxies Completions compatibles OpenAI
    - Ne forcent pas les schémas d’outils stricts ni les en-têtes réservés au natif

    Azure OpenAI utilise le comportement de transport et de compatibilité natif mais ne reçoit pas les en-têtes d’attribution masqués.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèles et comportement de repli.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres d’outil d’image partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres d’outil vidéo partagés et sélection du fournisseur.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails de l’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
