---
read_when:
    - Vous souhaitez utiliser les modèles OpenAI dans OpenClaw
    - Vous voulez l’authentification par abonnement Codex plutôt que des clés API
    - Vous avez besoin d’un comportement d’exécution d’agent GPT-5 plus strict
summary: Utiliser OpenAI avec des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fournit des API développeur pour les modèles GPT, et Codex est également disponible comme
agent de codage associé à un forfait ChatGPT via les clients Codex d’OpenAI. OpenClaw garde ces
surfaces séparées afin que la configuration reste prévisible.

OpenClaw prend en charge trois routes de la famille OpenAI. Le préfixe du modèle sélectionne la
route fournisseur/authentification ; un paramètre d’exécution distinct sélectionne qui exécute la
boucle d’agent intégrée :

- **Clé API** — accès direct à OpenAI Platform avec facturation à l’usage (modèles `openai/*`)
- **Abonnement Codex via PI** — connexion ChatGPT/Codex avec accès par abonnement (modèles `openai-codex/*`)
- **Harnais de serveur d’application Codex** — exécution native du serveur d’application Codex (modèles `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)

OpenAI prend explicitement en charge l’utilisation d’OAuth par abonnement dans des outils et workflows externes comme OpenClaw.

Le fournisseur, le modèle, le runtime et le canal sont des couches séparées. Si ces libellés sont
mélangés, lisez [Runtimes d’agent](/fr/concepts/agent-runtimes) avant de
modifier la configuration.

## Choix rapide

| Objectif                                      | Utiliser                                         | Notes                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Facturation directe par clé API               | `openai/gpt-5.5`                                 | Définissez `OPENAI_API_KEY` ou lancez l’onboarding par clé API OpenAI.       |
| GPT-5.5 avec authentification par abonnement ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Route PI par défaut pour OAuth Codex. Meilleur premier choix pour les configurations par abonnement. |
| GPT-5.5 avec comportement natif de serveur d’application Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Force le harnais de serveur d’application Codex pour cette référence de modèle. |
| Génération ou modification d’images           | `openai/gpt-image-2`                             | Fonctionne avec `OPENAI_API_KEY` ou OAuth OpenAI Codex.                      |
| Images à arrière-plan transparent             | `openai/gpt-image-1.5`                           | Utilisez `outputFormat=png` ou `webp` et `openai.background=transparent`.    |

## Carte des noms

Les noms sont similaires, mais pas interchangeables :

| Nom affiché                         | Couche            | Signification                                                                                     |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Préfixe fournisseur | Route directe de l’API OpenAI Platform.                                                           |
| `openai-codex`                     | Préfixe fournisseur | Route OAuth/abonnement OpenAI Codex via l’exécuteur PI normal d’OpenClaw.                         |
| `codex` plugin                     | Plugin            | Plugin OpenClaw intégré qui fournit le runtime natif de serveur d’application Codex et les contrôles de discussion `/codex`. |
| `agentRuntime.id: codex`           | Runtime d’agent   | Force le harnais natif de serveur d’application Codex pour les tours intégrés.                    |
| `/codex ...`                       | Ensemble de commandes de discussion | Associe/contrôle les threads de serveur d’application Codex depuis une conversation.              |
| `runtime: "acp", agentId: "codex"` | Route de session ACP | Chemin de repli explicite qui exécute Codex via ACP/acpx.                                         |

Cela signifie qu’une configuration peut contenir intentionnellement à la fois `openai-codex/*` et le
`codex` plugin. C’est valide lorsque vous voulez OAuth Codex via PI et que vous voulez aussi que les
contrôles de discussion natifs `/codex` soient disponibles. `openclaw doctor` avertit sur cette
combinaison afin que vous puissiez confirmer qu’elle est intentionnelle ; il ne la réécrit pas.

<Note>
GPT-5.5 est disponible à la fois via l’accès direct par clé API OpenAI Platform et via les
routes abonnement/OAuth. Utilisez `openai/gpt-5.5` pour le trafic direct `OPENAI_API_KEY`,
`openai-codex/gpt-5.5` pour OAuth Codex via PI, ou
`openai/gpt-5.5` avec `agentRuntime.id: "codex"` pour le harnais natif de serveur d’application
Codex.
</Note>

<Note>
Activer le plugin OpenAI, ou sélectionner un modèle `openai-codex/*`, n’active pas
le plugin de serveur d’application Codex intégré. OpenClaw active ce plugin uniquement
lorsque vous sélectionnez explicitement le harnais Codex natif avec
`agentRuntime.id: "codex"` ou utilisez une ancienne référence de modèle `codex/*`.
Si le plugin `codex` intégré est activé mais que `openai-codex/*` se résout toujours
via PI, `openclaw doctor` avertit et laisse la route inchangée.
</Note>

## Couverture des fonctionnalités OpenClaw

| Capacité OpenAI          | Surface OpenClaw                                          | Statut                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Discussion / Responses    | Fournisseur de modèle `openai/<model>`                    | Oui                                                    |
| Modèles d’abonnement Codex | `openai-codex/<model>` avec OAuth `openai-codex`          | Oui                                                    |
| Harnais de serveur d’application Codex | `openai/<model>` avec `agentRuntime.id: codex`             | Oui                                                    |
| Recherche Web côté serveur | Outil OpenAI Responses natif                              | Oui, lorsque la recherche Web est activée et qu’aucun fournisseur n’est épinglé |
| Images                    | `image_generate`                                           | Oui                                                    |
| Vidéos                    | `video_generate`                                           | Oui                                                    |
| Synthèse vocale           | `messages.tts.provider: "openai"` / `tts`                  | Oui                                                    |
| Transcription vocale par lots | `tools.media.audio` / compréhension des médias          | Oui                                                    |
| Transcription vocale en streaming | Voice Call `streaming.provider: "openai"`           | Oui                                                    |
| Voix en temps réel        | Voice Call `realtime.provider: "openai"` / Control UI Talk | Oui                                                    |
| Embeddings                | Fournisseur d’embeddings mémoire                           | Oui                                                    |

## Embeddings mémoire

OpenClaw peut utiliser OpenAI, ou un endpoint d’embedding compatible avec OpenAI, pour
l’indexation `memory_search` et les embeddings de requête :

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

Pour les endpoints compatibles avec OpenAI qui nécessitent des libellés d’embedding asymétriques, définissez
`queryInputType` et `documentInputType` sous `memorySearch`. OpenClaw les transmet
comme champs de requête `input_type` propres au fournisseur : les embeddings de requête utilisent
`queryInputType` ; les fragments de mémoire indexés et l’indexation par lots utilisent
`documentInputType`. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#provider-specific-config) pour l’exemple complet.

## Bien démarrer

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API (OpenAI Platform)">
    **Idéal pour :** accès direct à l’API et facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Lancer l’onboarding">
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

    | Référence de modèle    | Configuration du runtime   | Route                       | Authentification |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omis / `agentRuntime.id: "pi"`    | API OpenAI Platform directe | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omis / `agentRuntime.id: "pi"`    | API OpenAI Platform directe | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Harnais de serveur d’application Codex | Serveur d’application Codex |

    <Note>
    `openai/*` est la route directe par clé API OpenAI, sauf si vous forcez explicitement
    le harnais de serveur d’application Codex. Utilisez `openai-codex/*` pour OAuth Codex via
    l’exécuteur PI par défaut, ou utilisez `openai/gpt-5.5` avec
    `agentRuntime.id: "codex"` pour l’exécution native du serveur d’application Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw n’expose **pas** `openai/gpt-5.3-codex-spark`. Les requêtes API OpenAI en direct rejettent ce modèle, et le catalogue Codex actuel ne l’expose pas non plus.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex au lieu d’une clé API séparée. Le cloud Codex nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Lancer OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou lancez OAuth directement :

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

    | Référence de modèle | Configuration du runtime | Route | Authentification |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omis / `runtime: "pi"` | OAuth ChatGPT/Codex via PI | Connexion Codex |
    | `openai-codex/gpt-5.4-mini` | omis / `runtime: "pi"` | OAuth ChatGPT/Codex via PI | Connexion Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Toujours PI, sauf si un plugin revendique explicitement `openai-codex` | Connexion Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harnais de serveur d’application Codex | Authentification du serveur d’application Codex |

    <Note>
    Continuez à utiliser l’identifiant de fournisseur `openai-codex` pour les commandes d’authentification/profil. Le
    préfixe de modèle `openai-codex/*` est aussi la route PI explicite pour OAuth Codex.
    Il ne sélectionne ni n’active automatiquement le harnais de serveur d’application Codex intégré.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L’onboarding n’importe plus de matériel OAuth depuis `~/.codex`. Connectez-vous avec OAuth dans le navigateur (par défaut) ou le flux de code d’appareil ci-dessus — OpenClaw gère les identifiants obtenus dans son propre magasin d’authentification d’agent.
    </Note>

    ### Indicateur d’état

    Chat `/status` indique quel environnement d’exécution de modèle est actif pour la session actuelle.
    Le harnais PI par défaut apparaît comme `Runtime: OpenClaw Pi Default`. Lorsque le
    harnais app-server Codex intégré est sélectionné, `/status` affiche
    `Runtime: OpenAI Codex`. Les sessions existantes conservent leur id de harnais enregistré ; utilisez donc
    `/new` ou `/reset` après avoir modifié `agentRuntime` si vous voulez que `/status`
    reflète un nouveau choix PI/Codex.

    ### Avertissement de doctor

    Si le Plugin `codex` intégré est activé alors que la route
    `openai-codex/*` de cet onglet est sélectionnée, `openclaw doctor` avertit que le modèle
    se résout toujours via PI. Gardez la configuration inchangée lorsque c’est la
    route d’authentification par abonnement prévue. Passez à `openai/<model>` avec
    `agentRuntime.id: "codex"` uniquement lorsque vous voulez une exécution native Codex
    app-server.

    ### Plafond de fenêtre de contexte

    OpenClaw traite les métadonnées de modèle et le plafond de contexte d’exécution comme des valeurs distinctes.

    Pour `openai-codex/gpt-5.5` via Codex OAuth :

    - `contextWindow` native : `1000000`
    - Plafond `contextTokens` d’exécution par défaut : `272000`

    Le plafond par défaut plus petit offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-le avec `contextTokens` :

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
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte d’exécution.
    </Note>

    ### Récupération du catalogue

    OpenClaw utilise les métadonnées du catalogue Codex amont pour `gpt-5.5` lorsqu’elles sont
    présentes. Si la découverte Codex en direct omet la ligne `openai-codex/gpt-5.5` alors que
    le compte est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que
    les exécutions cron, sous-agent et modèle par défaut configuré n’échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Authentification native Codex app-server

Le harnais natif Codex app-server utilise des références de modèle `openai/*` avec
`agentRuntime.id: "codex"`, mais son authentification reste fondée sur le compte. OpenClaw
sélectionne l’authentification dans cet ordre :

1. Un profil d’authentification OpenClaw `openai-codex` explicite lié à l’agent.
2. Le compte existant de l’app-server, par exemple une connexion ChatGPT locale via Codex CLI.
3. Pour les lancements app-server stdio locaux uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsque l’app-server ne signale aucun compte et nécessite encore
   une authentification OpenAI.

Cela signifie qu’une connexion locale par abonnement ChatGPT/Codex n’est pas remplacée simplement
parce que le processus Gateway possède aussi `OPENAI_API_KEY` pour des modèles OpenAI directs
ou des embeddings. Le repli sur la clé API d’environnement ne concerne que le chemin stdio local sans compte ; elle
n’est pas envoyée aux connexions app-server WebSocket. Lorsqu’un profil Codex de type abonnement
est sélectionné, OpenClaw exclut aussi `CODEX_API_KEY` et `OPENAI_API_KEY`
du processus enfant app-server stdio lancé et envoie les identifiants sélectionnés
via le RPC de connexion de l’app-server.

## Génération d’images

Le Plugin `openai` intégré enregistre la génération d’images via l’outil `image_generate`.
Il prend en charge à la fois la génération d’images par clé API OpenAI et la génération d’images
par Codex OAuth via la même référence de modèle `openai/gpt-image-2`.

| Capacité                 | Clé API OpenAI                         | Codex OAuth                              |
| ------------------------ | -------------------------------------- | ---------------------------------------- |
| Référence de modèle      | `openai/gpt-image-2`                   | `openai/gpt-image-2`                     |
| Authentification         | `OPENAI_API_KEY`                       | Connexion OpenAI Codex OAuth             |
| Transport                | API OpenAI Images                      | Backend Codex Responses                  |
| Images max par requête   | 4                                      | 4                                        |
| Mode édition             | Activé (jusqu’à 5 images de référence) | Activé (jusqu’à 5 images de référence)   |
| Remplacements de taille  | Pris en charge, y compris les tailles 2K/4K | Pris en charge, y compris les tailles 2K/4K |
| Format / résolution      | Non transmis à l’API OpenAI Images     | Mappé vers une taille prise en charge lorsque c’est sûr |

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
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération texte-vers-image OpenAI et l’édition
d’images. `gpt-image-1.5`, `gpt-image-1` et `gpt-image-1-mini` restent utilisables comme
remplacements explicites de modèle. Utilisez `openai/gpt-image-1.5` pour une sortie
PNG/WebP à arrière-plan transparent ; l’API actuelle `gpt-image-2` rejette
`background: "transparent"`.

Pour une requête avec arrière-plan transparent, les agents doivent appeler `image_generate` avec
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, et
`background: "transparent"` ; l’ancienne option de fournisseur `openai.background` est
toujours acceptée. OpenClaw protège aussi les routes publiques OpenAI et
OpenAI Codex OAuth en réécrivant les requêtes transparentes par défaut `openai/gpt-image-2`
vers `gpt-image-1.5` ; Azure et les points de terminaison personnalisés compatibles OpenAI conservent
leurs noms de déploiement/modèle configurés.

Le même paramètre est exposé pour les exécutions CLI sans interface :

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

Pour les installations Codex OAuth, gardez la même référence `openai/gpt-image-2`. Lorsqu’un
profil OAuth `openai-codex` est configuré, OpenClaw résout ce jeton d’accès OAuth stocké
et envoie les requêtes d’image via le backend Codex Responses. Il n’essaie pas d’abord
`OPENAI_API_KEY` et ne se rabat pas silencieusement sur une clé API pour cette
requête. Configurez explicitement `models.providers.openai` avec une clé API,
une URL de base personnalisée ou un point de terminaison Azure lorsque vous voulez la route directe de l’API OpenAI Images.
Si ce point de terminaison d’image personnalisé se trouve sur une adresse LAN/privée approuvée, définissez aussi
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw garde
les points de terminaison d’image privés/internes compatibles OpenAI bloqués sauf si cette option d’adhésion est
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

| Capacité             | Valeur                                                                            |
| -------------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut    | `openai/sora-2`                                                                   |
| Modes                | Texte-vers-vidéo, image-vers-vidéo, édition d’une seule vidéo                     |
| Entrées de référence | 1 image ou 1 vidéo                                                                |
| Remplacements de taille | Pris en charge                                                                  |
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
Consultez [Génération de vidéos](/fr/tools/video-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Contribution au prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 entre fournisseurs. Elle s’applique par id de modèle ; ainsi `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` et les autres références GPT-5 compatibles reçoivent la même surcouche. Les anciens modèles GPT-4.x ne la reçoivent pas.

Le harnais natif Codex intégré utilise le même comportement GPT-5 et la même surcouche Heartbeat via les instructions développeur de Codex app-server ; ainsi les sessions `openai/gpt-5.x` forcées via `agentRuntime.id: "codex"` conservent les mêmes consignes de suivi et de Heartbeat proactif, même si Codex possède le reste du prompt de harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de persona, la sécurité d’exécution, la discipline d’outils, la forme de sortie, les vérifications d’achèvement et la vérification. Le comportement de réponse propre au canal et de message silencieux reste dans le prompt système OpenClaw partagé et la politique de livraison sortante. Les consignes GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d’interaction amicale est séparée et configurable.

| Valeur                 | Effet                                          |
| ---------------------- | ---------------------------------------------- |
| `"friendly"` (default) | Active la couche de style d’interaction amicale |
| `"on"`                 | Alias de `"friendly"`                          |
| `"off"`                | Désactive uniquement la couche de style amical |

<Tabs>
  <Tab title="Config">
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
Les valeurs sont insensibles à la casse à l’exécution ; `"Off"` et `"off"` désactivent donc toutes deux la couche de style amical.
</Tip>

<Note>
L’ancien `plugins.entries.openai.config.personality` est toujours lu comme repli de compatibilité lorsque le paramètre partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le Plugin `openai` intégré enregistre la synthèse vocale pour la surface `messages.tts`.

    | Paramètre | Chemin de configuration | Par défaut |
    |-----------|-------------------------|------------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |
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

  <Accordion title="Parole vers texte">
    Le Plugin `openai` intégré enregistre la parole vers texte par lots via
    la surface de transcription de compréhension média d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : OpenAI REST `/v1/audio/transcriptions`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de salons vocaux Discord et les pièces jointes
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
    configuration de média audio partagée ou par la demande de transcription propre à l’appel.

  </Accordion>

  <Accordion title="Transcription en temps réel">
    Le Plugin `openai` inclus enregistre la transcription en temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée du silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket vers `wss://api.openai.com/v1/realtime` avec de l’audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming est destiné au chemin de transcription en temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise à la place le chemin de transcription par lot `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel">
    Le Plugin `openai` inclus enregistre la voix en temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée du silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment` pour les ponts backend en temps réel. Prend en charge l’appel d’outils bidirectionnel. Utilise le format audio G.711 u-law.
    </Note>

    <Note>
    Talk dans l’interface de contrôle utilise des sessions temps réel OpenAI dans le navigateur, avec un secret client éphémère
    émis par le Gateway et un échange SDP WebRTC direct du navigateur avec
    l’API OpenAI Realtime. Une vérification live par les mainteneurs est disponible avec
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ;
    la branche OpenAI émet un secret client dans Node, génère une offre SDP de navigateur
    avec un média de faux microphone, la publie vers OpenAI, puis applique la réponse SDP
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

- Vous disposez déjà d’un abonnement, d’un quota ou d’un accord d’entreprise Azure OpenAI
- Vous avez besoin de la résidence régionale des données ou des contrôles de conformité fournis par Azure
- Vous souhaitez conserver le trafic dans un locataire Azure existant

### Configuration

Pour la génération d’images Azure via le fournisseur `openai` inclus, pointez
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (pas une clé OpenAI Platform) :

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
  Les valeurs `timeoutMs` propres à l’appel remplacent toujours cette valeur par défaut.

Les autres URL de base (OpenAI public, proxys compatibles OpenAI) conservent la forme
standard des requêtes d’image OpenAI.

<Note>
Le routage Azure pour le chemin de génération d’images du fournisseur `openai` nécessite
OpenClaw 2026.4.22 ou une version ultérieure. Les versions antérieures traitent tout
`openai.baseUrl` personnalisé comme le point de terminaison OpenAI public et échoueront avec les
déploiements d’images Azure.
</Note>

### Version d’API

Définissez `AZURE_OPENAI_API_VERSION` pour fixer une version Azure preview ou GA précise
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèles sont des noms de déploiements

Azure OpenAI associe les modèles aux déploiements. Pour les requêtes de génération d’images Azure
routées via le fournisseur `openai` inclus, le champ `model` dans OpenClaw
doit être le **nom de déploiement Azure** que vous avez configuré dans le portail Azure, et non
l’identifiant du modèle OpenAI public.

Si vous créez un déploiement appelé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La même règle de nom de déploiement s’applique aux appels de génération d’images routés via
le fournisseur `openai` inclus.

### Disponibilité régionale

La génération d’images Azure n’est actuellement disponible que dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consultez la liste actuelle des régions de Microsoft avant de créer un
déploiement et confirmez que le modèle précis est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut refuser des options qu’OpenAI public autorise (par exemple certaines
valeurs `background` sur `gpt-image-2`) ou ne les exposer que sur des versions de modèles
spécifiques. Ces différences viennent d’Azure et du modèle sous-jacent, pas
d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez l’ensemble de
paramètres pris en charge par votre déploiement et votre version d’API précis dans le
portail Azure.

<Note>
Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas
les en-têtes d’attribution masqués d’OpenClaw — voir l’accordéon **Routes natives et compatibles OpenAI**
sous [Configuration avancée](#advanced-configuration).

Pour le trafic chat ou Responses sur Azure (au-delà de la génération d’images), utilisez le
flux d’onboarding ou une configuration de fournisseur Azure dédiée — `openai.baseUrl` seul
ne récupère pas la forme de l’API/authentification Azure. Un fournisseur
`azure-openai-responses/*` distinct existe ; consultez
l’accordéon Compaction côté serveur ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket ou SSE)">
    OpenClaw utilise d’abord WebSocket, avec repli SSE (`"auto"`), pour `openai/*` comme pour `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie un premier échec WebSocket précoce avant de se rabattre sur SSE
    - Après un échec, marque WebSocket comme dégradé pendant environ 60 secondes et utilise SSE pendant la période de refroidissement
    - Joint des en-têtes stables d’identité de session et de tour pour les nouvelles tentatives et les reconnexions
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
    - [Réponses d’API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Préchauffage WebSocket">
    OpenClaw active le préchauffage WebSocket par défaut pour `openai/*` et `openai-codex/*` afin de réduire la latence du premier tour.

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
    OpenClaw expose un bouton partagé de mode rapide pour `openai/*` et `openai-codex/*` :

    - **Chat/interface utilisateur :** `/fast status|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw mappe le mode rapide sur le traitement prioritaire OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont préservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

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
    Les remplacements de session priment sur la configuration. Effacer le remplacement de session dans l’interface Sessions ramène la session à la valeur par défaut configurée.
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
    `serviceTier` n’est transmis qu’aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous routez l’un ou l’autre fournisseur via un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), l’enveloppe de stream du harnais Pi du Plugin OpenAI active automatiquement la Compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu’indisponible)

    Cela s’applique au chemin de harnais Pi intégré et aux hooks du fournisseur OpenAI utilisés par les exécutions intégrées. Le harnais natif du serveur d’application Codex gère son propre contexte via Codex et se configure séparément avec `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` contrôle uniquement l’injection de `context_management`. Les modèles OpenAI Responses directs imposent toujours `store: true`, sauf si compat définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentique strict">
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
    - Ne considère plus un tour contenant uniquement un plan comme une progression réussie lorsqu’une action d’outil est disponible
    - Réessaie le tour avec une orientation pour agir immédiatement
    - Active automatiquement `update_plan` pour les travaux substantiels
    - Affiche un état bloqué explicite si le modèle continue de planifier sans agir

    <Note>
    Limité aux exécutions OpenAI et Codex de la famille GPT-5 uniquement. Les autres fournisseurs et les familles de modèles plus anciennes conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives et compatibles avec OpenAI">
    OpenClaw traite les points de terminaison OpenAI directs, Codex et Azure OpenAI différemment des proxys `/v1` génériques compatibles avec OpenAI :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l’effort OpenAI `none`
    - Omissent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - Utilisent par défaut le mode strict pour les schémas d’outils
    - Joignent des en-têtes d’attribution masqués uniquement sur les hôtes natifs vérifiés
    - Conservent la mise en forme des requêtes propre à OpenAI (`service_tier`, `store`, compatibilité de raisonnement, indices de cache de prompts)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Suppriment `store` de Completions des charges utiles `openai-completions` non natives
    - Acceptent le JSON transmis tel quel via `params.extra_body`/`params.extraBody` avancé pour les proxys Completions compatibles avec OpenAI
    - Acceptent `params.chat_template_kwargs` pour les proxys Completions compatibles avec OpenAI tels que vLLM
    - N’imposent pas les schémas d’outils stricts ni les en-têtes réservés aux routes natives

    Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas les en-têtes d’attribution masqués.

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
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
