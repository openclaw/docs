---
read_when:
    - Vous souhaitez utiliser les modèles OpenAI dans OpenClaw
    - Vous souhaitez utiliser l’authentification par abonnement Codex au lieu de clés API
    - Vous avez besoin d’un comportement d’exécution plus strict pour les agents GPT-5
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T07:44:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: be0e2cd14990a53533c800cd8d305c9c50b0fa7131f6638e7b9d8dd9f2942fe8
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fournit des API développeur pour les modèles GPT, et Codex est également disponible comme agent de codage associé à un abonnement ChatGPT via les clients Codex d’OpenAI. OpenClaw garde ces surfaces séparées afin que la configuration reste prévisible.

OpenClaw prend en charge trois routes de la famille OpenAI. Le préfixe du modèle sélectionne la route fournisseur/authentification ; un paramètre d’exécution distinct sélectionne qui exécute la boucle d’agent intégrée :

- **Clé API** — accès direct à OpenAI Platform avec facturation à l’usage (modèles `openai/*`)
- **Abonnement Codex via PI** — connexion ChatGPT/Codex avec accès par abonnement (modèles `openai-codex/*`)
- **Harnais de serveur d’application Codex** — exécution native du serveur d’application Codex (modèles `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)

OpenAI prend explicitement en charge l’utilisation OAuth par abonnement dans des outils externes et des workflows comme OpenClaw.

Le fournisseur, le modèle, le runtime et le canal sont des couches séparées. Si ces libellés se mélangent, lisez [Runtimes d’agent](/fr/concepts/agent-runtimes) avant de modifier la configuration.

## Choix rapide

| Objectif                                      | Utiliser                                         | Notes                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Facturation directe par clé API               | `openai/gpt-5.5`                                 | Définissez `OPENAI_API_KEY` ou exécutez l’onboarding avec clé API OpenAI.    |
| GPT-5.5 avec authentification par abonnement ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Route PI par défaut pour l’OAuth Codex. Meilleur premier choix pour les configurations par abonnement. |
| GPT-5.5 avec comportement natif du serveur d’application Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Force le harnais du serveur d’application Codex pour cette référence de modèle. |
| Génération ou édition d’images                | `openai/gpt-image-2`                             | Fonctionne avec `OPENAI_API_KEY` ou l’OAuth OpenAI Codex.                    |
| Images à arrière-plan transparent             | `openai/gpt-image-1.5`                           | Utilisez `outputFormat=png` ou `webp` et `openai.background=transparent`.    |

## Carte des noms

Les noms se ressemblent, mais ne sont pas interchangeables :

| Nom affiché                         | Couche            | Signification                                                                                     |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Préfixe fournisseur | Route directe de l’API OpenAI Platform.                                                           |
| `openai-codex`                     | Préfixe fournisseur | Route OAuth/abonnement OpenAI Codex via le runner PI normal d’OpenClaw.                            |
| Plugin `codex`                     | Plugin            | Plugin OpenClaw intégré qui fournit le runtime natif du serveur d’application Codex et les contrôles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime d’agent   | Force le harnais natif du serveur d’application Codex pour les tours intégrés.                    |
| `/codex ...`                       | Ensemble de commandes de chat | Lier/contrôler les fils du serveur d’application Codex depuis une conversation.                    |
| `runtime: "acp", agentId: "codex"` | Route de session ACP | Chemin de repli explicite qui exécute Codex via ACP/acpx.                                         |

Cela signifie qu’une configuration peut contenir intentionnellement à la fois `openai-codex/*` et le Plugin `codex`. C’est valide lorsque vous voulez l’OAuth Codex via PI et souhaitez aussi disposer des contrôles de chat natifs `/codex`. `openclaw doctor` avertit à propos de cette combinaison pour que vous puissiez confirmer qu’elle est intentionnelle ; il ne la réécrit pas.

<Note>
GPT-5.5 est disponible à la fois via l’accès direct par clé API à OpenAI Platform et via les routes abonnement/OAuth. Utilisez `openai/gpt-5.5` pour le trafic direct `OPENAI_API_KEY`, `openai-codex/gpt-5.5` pour l’OAuth Codex via PI, ou `openai/gpt-5.5` avec `agentRuntime.id: "codex"` pour le harnais natif du serveur d’application Codex.
</Note>

<Note>
Activer le Plugin OpenAI, ou sélectionner un modèle `openai-codex/*`, n’active pas le Plugin intégré du serveur d’application Codex. OpenClaw active ce Plugin uniquement lorsque vous sélectionnez explicitement le harnais Codex natif avec `agentRuntime.id: "codex"` ou utilisez une référence de modèle héritée `codex/*`.
Si le Plugin intégré `codex` est activé mais que `openai-codex/*` se résout toujours via PI, `openclaw doctor` avertit et laisse la route inchangée.
</Note>

## Couverture des fonctionnalités OpenClaw

| Capacité OpenAI          | Surface OpenClaw                                            | État                                                   |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Fournisseur de modèle `openai/<model>`                     | Oui                                                    |
| Modèles d’abonnement Codex | `openai-codex/<model>` avec OAuth `openai-codex`           | Oui                                                    |
| Harnais de serveur d’application Codex | `openai/<model>` avec `agentRuntime.id: codex`             | Oui                                                    |
| Recherche Web côté serveur | Outil OpenAI Responses natif                               | Oui, lorsque la recherche Web est activée et qu’aucun fournisseur n’est épinglé |
| Images                    | `image_generate`                                           | Oui                                                    |
| Vidéos                    | `video_generate`                                           | Oui                                                    |
| Synthèse vocale           | `messages.tts.provider: "openai"` / `tts`                  | Oui                                                    |
| Transcription par lots    | `tools.media.audio` / compréhension média                  | Oui                                                    |
| Transcription en streaming | Appel vocal `streaming.provider: "openai"`                 | Oui                                                    |
| Voix en temps réel        | Appel vocal `realtime.provider: "openai"` / Control UI Talk | Oui                                                    |
| Embeddings                | Fournisseur d’embeddings mémoire                           | Oui                                                    |

## Embeddings mémoire

OpenClaw peut utiliser OpenAI, ou un endpoint d’embeddings compatible OpenAI, pour l’indexation `memory_search` et les embeddings de requête :

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Pour les endpoints compatibles OpenAI qui nécessitent des libellés d’embedding asymétriques, définissez `queryInputType` et `documentInputType` sous `memorySearch`. OpenClaw les transmet comme champs de requête `input_type` propres au fournisseur : les embeddings de requête utilisent `queryInputType` ; les fragments mémoire indexés et l’indexation par lots utilisent `documentInputType`. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#provider-specific-config) pour l’exemple complet.

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API (OpenAI Platform)">
    **Idéal pour :** l’accès direct à l’API et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou transmettez la clé directement :

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

    ### Résumé des routes

    | Référence de modèle   | Configuration du runtime    | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omise / `agentRuntime.id: "pi"`    | API OpenAI Platform directe | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omise / `agentRuntime.id: "pi"`    | API OpenAI Platform directe | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Harnais de serveur d’application Codex | Serveur d’application Codex |

    <Note>
    `openai/*` est la route directe par clé API OpenAI, sauf si vous forcez explicitement le harnais du serveur d’application Codex. Utilisez `openai-codex/*` pour l’OAuth Codex via le runner PI par défaut, ou utilisez `openai/gpt-5.5` avec `agentRuntime.id: "codex"` pour l’exécution native du serveur d’application Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw n’expose **pas** `openai/gpt-5.3-codex-spark`. Les requêtes live à l’API OpenAI rejettent ce modèle, et le catalogue Codex actuel ne l’expose pas non plus.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex au lieu d’une clé API séparée. Le cloud Codex nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Exécuter l’OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez OAuth directement :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les configurations sans interface graphique ou peu compatibles avec les callbacks, ajoutez `--device-code` pour vous connecter avec un flux de code d’appareil ChatGPT au lieu du callback navigateur localhost :

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

    ### Résumé des routes

    | Référence de modèle | Configuration du runtime | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omise / `runtime: "pi"` | OAuth ChatGPT/Codex via PI | Connexion Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Toujours PI, sauf si un Plugin revendique explicitement `openai-codex` | Connexion Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harnais de serveur d’application Codex | Auth du serveur d’application Codex |

    <Note>
    Continuez à utiliser l’id de fournisseur `openai-codex` pour les commandes d’authentification/profil. Le préfixe de modèle `openai-codex/*` est aussi la route PI explicite pour l’OAuth Codex.
    Il ne sélectionne pas ni n’active automatiquement le harnais intégré du serveur d’application Codex.
    </Note>

    <Warning>
    `openai-codex/gpt-5.4-mini` n’est pas une route OAuth Codex prise en charge. Utilisez `openai/gpt-5.4-mini` avec une clé API OpenAI, ou utilisez `openai-codex/gpt-5.5` avec l’OAuth Codex.
    </Warning>

    ### Exemple de configuration

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L’onboarding n’importe plus de matériel OAuth depuis `~/.codex`. Connectez-vous avec l’OAuth navigateur (par défaut) ou avec le flux de code d’appareil ci-dessus — OpenClaw gère les identifiants obtenus dans son propre magasin d’authentification d’agent.
    </Note>

    ### Indicateur d’état

    Le `/status` du chat indique quel runtime de modèle est actif pour la session actuelle.
    Le harnais PI par défaut apparaît sous la forme `Runtime: OpenClaw Pi Default`. Lorsque le
    harnais app-server Codex intégré est sélectionné, `/status` affiche
    `Runtime: OpenAI Codex`. Les sessions existantes conservent leur identifiant de harnais enregistré ; utilisez donc
    `/new` ou `/reset` après avoir modifié `agentRuntime` si vous voulez que `/status`
    reflète un nouveau choix PI/Codex.

    ### Avertissement du doctor

    Si le Plugin `codex` intégré est activé alors que la route
    `openai-codex/*` de cet onglet est sélectionnée, `openclaw doctor` avertit que le modèle
    se résout toujours via PI. Conservez la configuration inchangée lorsqu’il s’agit de la
    route prévue avec authentification par abonnement. Passez à `openai/<model>` avec
    `agentRuntime.id: "codex"` uniquement lorsque vous voulez une exécution native par
    app-server Codex.

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées du modèle et la limite de contexte du runtime comme des valeurs distinctes.

    Pour `openai-codex/gpt-5.5` via Codex OAuth :

    - `contextWindow` native : `1000000`
    - Limite `contextTokens` du runtime par défaut : `272000`

    La limite par défaut plus petite offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-la avec `contextTokens` :

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
    présentes. Si la découverte Codex en direct omet la ligne `openai-codex/gpt-5.5` alors que
    le compte est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que les
    exécutions cron, de sous-agent et de modèle par défaut configuré n’échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Authentification app-server Codex native

Le harnais app-server Codex natif utilise des références de modèle `openai/*` avec
`agentRuntime.id: "codex"`, mais son authentification reste basée sur le compte. OpenClaw
sélectionne l’authentification dans cet ordre :

1. Un profil d’authentification OpenClaw `openai-codex` explicite lié à l’agent.
2. Le compte existant de l’app-server, comme une connexion ChatGPT locale via la CLI Codex.
3. Pour les lancements locaux de l’app-server stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsque l’app-server ne signale aucun compte et nécessite encore
   une authentification OpenAI.

Cela signifie qu’une connexion locale à un abonnement ChatGPT/Codex n’est pas remplacée simplement
parce que le processus Gateway dispose aussi de `OPENAI_API_KEY` pour les modèles OpenAI directs
ou les embeddings. Le repli sur clé API d’environnement ne concerne que le chemin stdio local sans compte ; il
n’est pas envoyé aux connexions app-server WebSocket. Lorsqu’un profil Codex de type abonnement
est sélectionné, OpenClaw maintient également `CODEX_API_KEY` et `OPENAI_API_KEY`
hors de l’enfant app-server stdio lancé et envoie les identifiants sélectionnés
via le RPC de connexion de l’app-server.

## Génération d’images

Le Plugin `openai` intégré enregistre la génération d’images via l’outil `image_generate`.
Il prend en charge à la fois la génération d’images avec clé API OpenAI et la génération
d’images via Codex OAuth avec la même référence de modèle `openai/gpt-image-2`.

| Capacité                  | Clé API OpenAI                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Référence de modèle       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentification          | `OPENAI_API_KEY`                   | Connexion OpenAI Codex OAuth         |
| Transport                 | API OpenAI Images                  | Backend Codex Responses              |
| Images max par requête    | 4                                  | 4                                    |
| Mode édition              | Activé (jusqu’à 5 images de référence) | Activé (jusqu’à 5 images de référence) |
| Remplacements de taille   | Pris en charge, y compris les tailles 2K/4K | Pris en charge, y compris les tailles 2K/4K |
| Format d’image / résolution | Non transmis à l’API OpenAI Images | Mappé à une taille prise en charge lorsque cela est sûr |

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
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération texte-vers-image OpenAI et la
modification d’images. `gpt-image-1.5`, `gpt-image-1` et `gpt-image-1-mini` restent utilisables comme
remplacements de modèle explicites. Utilisez `openai/gpt-image-1.5` pour une sortie
PNG/WebP à arrière-plan transparent ; l’API `gpt-image-2` actuelle rejette
`background: "transparent"`.

Pour une requête avec arrière-plan transparent, les agents doivent appeler `image_generate` avec
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, et
`background: "transparent"` ; l’ancienne option de fournisseur `openai.background` est
toujours acceptée. OpenClaw protège également les routes publiques OpenAI et
OpenAI Codex OAuth en réécrivant les requêtes transparentes par défaut `openai/gpt-image-2`
vers `gpt-image-1.5` ; Azure et les points de terminaison personnalisés compatibles OpenAI conservent
leurs noms de déploiement/modèle configurés.

Le même réglage est exposé pour les exécutions CLI sans interface :

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Utilisez les mêmes indicateurs `--output-format` et `--background` avec
`openclaw infer image edit` lorsque vous partez d’un fichier d’entrée.
`--openai-background` reste disponible comme alias propre à OpenAI.

Pour les installations Codex OAuth, conservez la même référence `openai/gpt-image-2`. Lorsqu’un
profil OAuth `openai-codex` est configuré, OpenClaw résout ce jeton d’accès OAuth stocké
et envoie les requêtes d’image via le backend Codex Responses. Il
n’essaie pas d’abord `OPENAI_API_KEY` et ne revient pas silencieusement à une clé API pour cette
requête. Configurez explicitement `models.providers.openai` avec une clé API,
une URL de base personnalisée ou un point de terminaison Azure lorsque vous voulez plutôt la route directe de l’API OpenAI Images.
Si ce point de terminaison d’image personnalisé se trouve sur un LAN/une adresse privée de confiance, définissez également
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw garde les points de terminaison d’image
privés/internes compatibles OpenAI bloqués sauf si cette adhésion explicite est
présente.

Générer :

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Générer un PNG transparent :

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Modifier :

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Génération de vidéos

Le Plugin `openai` intégré enregistre la génération de vidéos via l’outil `video_generate`.

| Capacité          | Valeur                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2`                                                                   |
| Modes            | Texte-vers-vidéo, image-vers-vidéo, modification d’une seule vidéo                 |
| Entrées de référence | 1 image ou 1 vidéo                                                             |
| Remplacements de taille | Pris en charge                                                            |
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
Consultez [Génération de vidéos](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Contribution de prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 entre fournisseurs. Elle s’applique par identifiant de modèle, donc `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` et les autres références GPT-5 compatibles reçoivent le même overlay. Les anciens modèles GPT-4.x ne le reçoivent pas.

Le harnais Codex natif intégré utilise le même comportement GPT-5 et le même overlay Heartbeat via les instructions développeur de l’app-server Codex ; les sessions `openai/gpt-5.x` forcées via `agentRuntime.id: "codex"` conservent donc les mêmes consignes de suivi et de Heartbeat proactif, même si Codex possède le reste du prompt du harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de la personnalité, la sécurité d’exécution, la discipline des outils, la forme de sortie, les vérifications d’achèvement et la vérification. Le comportement de réponse propre au canal et de message silencieux reste dans le prompt système OpenClaw partagé et la politique de livraison sortante. Le guidage GPT-5 est toujours activé pour les modèles correspondants. La couche de style d’interaction conviviale est distincte et configurable.

| Valeur                 | Effet                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (par défaut) | Activer la couche de style d’interaction conviviale |
| `"on"`                 | Alias de `"friendly"`                      |
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
Les valeurs sont insensibles à la casse à l’exécution ; `"Off"` et `"off"` désactivent donc toutes deux la couche de style conviviale.
</Tip>

<Note>
L’ancien `plugins.entries.openai.config.personality` est encore lu comme repli de compatibilité lorsque le réglage partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le Plugin `openai` intégré enregistre la synthèse vocale pour la surface `messages.tts`.

    | Réglage | Chemin de configuration | Par défaut |
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

  <Accordion title="Parole-vers-texte">
    Le Plugin `openai` intégré enregistre la parole-vers-texte par lots via
    la surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : REST OpenAI `/v1/audio/transcriptions`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de canal vocal Discord et les pièces jointes
      audio de canal

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
    configuration multimédia audio partagée ou par une demande de transcription par appel.

  </Accordion>

  <Accordion title="Transcription en temps réel">
    Le plugin `openai` inclus enregistre la transcription en temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée du silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket vers `wss://api.openai.com/v1/realtime` avec de l’audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming est destiné au chemin de transcription en temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise plutôt le chemin de transcription par lot `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel">
    Le plugin `openai` inclus enregistre la voix en temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée du silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment` pour les ponts temps réel côté backend. Prend en charge les appels d’outils bidirectionnels. Utilise le format audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk utilise les sessions temps réel OpenAI du navigateur avec un secret client
    éphémère émis par le Gateway et un échange SDP WebRTC direct du navigateur avec l’API
    OpenAI Realtime. Une vérification live mainteneur est disponible avec
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ;
    le segment OpenAI émet un secret client dans Node, génère une offre SDP de navigateur
    avec un faux média de microphone, la publie vers OpenAI, puis applique la réponse SDP
    sans journaliser de secrets.
    </Note>

  </Accordion>
</AccordionGroup>

## Points de terminaison Azure OpenAI

Le fournisseur `openai` inclus peut cibler une ressource Azure OpenAI pour la génération
d’images en remplaçant l’URL de base. Sur le chemin de génération d’images, OpenClaw
détecte les noms d’hôte Azure sur `models.providers.openai.baseUrl` et bascule
automatiquement vers la forme de requête d’Azure.

<Note>
La voix en temps réel utilise un chemin de configuration distinct
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n’est pas affectée par `models.providers.openai.baseUrl`. Consultez l’accordéon **Voix en temps réel**
sous [Voix et parole](#voice-and-speech) pour ses paramètres Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- Vous disposez déjà d’un abonnement Azure OpenAI, d’un quota ou d’un contrat entreprise
- Vous avez besoin de résidence régionale des données ou des contrôles de conformité fournis par Azure
- Vous voulez conserver le trafic dans un locataire Azure existant

### Configuration

Pour la génération d’images Azure via le fournisseur `openai` inclus, faites pointer
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (et non une clé OpenAI Platform) :

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

OpenClaw reconnaît ces suffixes d’hôte Azure pour la route de génération d’images
Azure :

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Pour les requêtes de génération d’images sur un hôte Azure reconnu, OpenClaw :

- Envoie l’en-tête `api-key` au lieu de `Authorization: Bearer`
- Utilise des chemins limités au déploiement (`/openai/deployments/{deployment}/...`)
- Ajoute `?api-version=...` à chaque requête
- Utilise un délai d’expiration par défaut de 600 s pour les appels de génération d’images Azure.
  Les valeurs `timeoutMs` par appel remplacent toujours cette valeur par défaut.

Les autres URL de base (OpenAI public, proxys compatibles OpenAI) conservent la forme
standard des requêtes d’images OpenAI.

<Note>
Le routage Azure pour le chemin de génération d’images du fournisseur `openai` nécessite
OpenClaw 2026.4.22 ou version ultérieure. Les versions antérieures traitent tout
`openai.baseUrl` personnalisé comme le point de terminaison OpenAI public et échoueront avec les déploiements
d’images Azure.
</Note>

### Version d’API

Définissez `AZURE_OPENAI_API_VERSION` pour épingler une version préliminaire ou GA Azure spécifique
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèles sont des noms de déploiements

Azure OpenAI associe les modèles aux déploiements. Pour les requêtes de génération d’images Azure
routées via le fournisseur `openai` inclus, le champ `model` dans OpenClaw
doit être le **nom du déploiement Azure** que vous avez configuré dans le portail Azure, et non
l’identifiant du modèle OpenAI public.

Si vous créez un déploiement appelé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La même règle de nom de déploiement s’applique aux appels de génération d’images routés via
le fournisseur `openai` inclus.

### Disponibilité régionale

La génération d’images Azure est actuellement disponible uniquement dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consultez la liste actuelle des régions de Microsoft avant de créer un
déploiement, et confirmez que le modèle précis est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut rejeter des options qu’OpenAI public autorise (par exemple certaines
valeurs `background` sur `gpt-image-2`) ou ne les exposer que sur des versions de modèle
spécifiques. Ces différences viennent d’Azure et du modèle sous-jacent, pas
d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez l’ensemble de
paramètres pris en charge par votre déploiement spécifique et votre version d’API dans le
portail Azure.

<Note>
Azure OpenAI utilise le transport natif et le comportement compat, mais ne reçoit pas
les en-têtes d’attribution masqués d’OpenClaw — consultez l’accordéon **Routes natives vs compatibles OpenAI**
sous [Configuration avancée](#advanced-configuration).

Pour le trafic de chat ou Responses sur Azure (au-delà de la génération d’images), utilisez le
flux d’onboarding ou une configuration de fournisseur Azure dédiée — `openai.baseUrl` seul
ne reprend pas la forme d’API/auth Azure. Un fournisseur
`azure-openai-responses/*` distinct existe ; consultez
l’accordéon Compaction côté serveur ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise WebSocket en priorité avec repli SSE (`"auto"`) pour `openai/*` et `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie une première défaillance WebSocket précoce avant de se rabattre sur SSE
    - Après une défaillance, marque WebSocket comme dégradé pendant environ 60 secondes et utilise SSE pendant la période de refroidissement
    - Attache des en-têtes stables d’identité de session et de tour pour les nouvelles tentatives et les reconnexions
    - Normalise les compteurs d’utilisation (`input_tokens` / `prompt_tokens`) entre les variantes de transport

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
            "openai/gpt-5.5": {
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

    Documentation OpenAI associée :
    - [API Realtime avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Préchauffage WebSocket">
    OpenClaw active par défaut le préchauffage WebSocket pour `openai/*` et `openai-codex/*` afin de réduire la latence du premier tour.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode rapide">
    OpenClaw expose un interrupteur de mode rapide partagé pour `openai/*` et `openai-codex/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw mappe le mode rapide vers le traitement prioritaire d’OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont conservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Les remplacements de session l’emportent sur la configuration. Effacer le remplacement de session dans l’interface Sessions ramène la session à la valeur par défaut configurée.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L’API d’OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valeurs prises en charge : `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` est transmis uniquement aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous routez l’un ou l’autre fournisseur via un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), l’enveloppe de flux Pi-harness du plugin OpenAI active automatiquement la Compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu’il n’est pas disponible)

    Cela s’applique au chemin Pi harness intégré et aux hooks du fournisseur OpenAI utilisés par les exécutions embarquées. Le harness serveur d’application Codex natif gère son propre contexte via Codex et se configure séparément avec `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Activer explicitement">
        Utile pour les points de terminaison compatibles comme Azure OpenAI Responses :

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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` contrôle uniquement l’injection de `context_management`. Les modèles OpenAI Responses directs imposent toujours `store: true`, sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT strict-agentic">
    Pour les exécutions de la famille GPT-5 sur `openai/*`, OpenClaw peut utiliser un contrat d’exécution intégré plus strict :

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
    - Ne traite plus un tour uniquement consacré au plan comme une progression réussie lorsqu’une action d’outil est disponible
    - Réessaie le tour avec une orientation agir maintenant
    - Active automatiquement `update_plan` pour les travaux substantiels
    - Affiche un état bloqué explicite si le modèle continue de planifier sans agir

    <Note>
    Limité uniquement aux exécutions OpenAI et Codex de la famille GPT-5. Les autres fournisseurs et les anciennes familles de modèles conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives ou compatibles OpenAI">
    OpenClaw traite les points de terminaison directs OpenAI, Codex et Azure OpenAI différemment des proxys `/v1` génériques compatibles OpenAI :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l’effort OpenAI `none`
    - Omettent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - Définissent par défaut les schémas d’outils en mode strict
    - Joignent des en-têtes d’attribution masqués uniquement sur les hôtes natifs vérifiés
    - Conservent la mise en forme des requêtes propre à OpenAI (`service_tier`, `store`, compatibilité du raisonnement, indices de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Suppriment `store` de Completions des charges utiles `openai-completions` non natives
    - Acceptent le JSON de transmission avancée `params.extra_body`/`params.extraBody` pour les proxys Completions compatibles OpenAI
    - Acceptent `params.chat_template_kwargs` pour les proxys Completions compatibles OpenAI tels que vLLM
    - N’imposent pas les schémas d’outils stricts ni les en-têtes réservés aux routes natives

    Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas les en-têtes d’attribution masqués.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
