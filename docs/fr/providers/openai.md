---
read_when:
    - Vous souhaitez utiliser les modèles OpenAI dans OpenClaw
    - Vous souhaitez utiliser l’authentification par abonnement Codex plutôt que des clés API
    - Il vous faut un comportement d’exécution plus strict pour les agents GPT-5
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T09:03:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5606cafb8dfec888b922874202aa0fdcad8cbd4fec1a1e15a9074ad14bc5486
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fournit des API développeur pour les modèles GPT, et Codex est également disponible comme agent de codage avec abonnement ChatGPT via les clients Codex d’OpenAI. OpenClaw garde ces surfaces séparées afin que la configuration reste prévisible.

OpenClaw prend en charge trois routes de la famille OpenAI. La plupart des abonnés ChatGPT/Codex qui veulent le comportement Codex devraient utiliser le runtime natif de serveur d’application Codex. Le préfixe du modèle sélectionne le nom du fournisseur/modèle ; un paramètre de runtime distinct sélectionne qui exécute la boucle d’agent intégrée :

- **Clé API** - accès direct à OpenAI Platform avec facturation à l’usage (modèles `openai/*`)
- **Abonnement Codex avec runtime Codex natif** - connexion ChatGPT/Codex plus exécution par le serveur d’application Codex (modèles `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)
- **Abonnement Codex via PI** - connexion ChatGPT/Codex avec l’exécuteur PI OpenClaw normal (modèles `openai-codex/*`)

OpenAI prend explicitement en charge l’utilisation d’OAuth d’abonnement dans des outils externes et des workflows comme OpenClaw.

Le fournisseur, le modèle, le runtime et le canal sont des couches séparées. Si ces libellés sont confondus, lisez [Runtimes d’agent](/fr/concepts/agent-runtimes) avant de modifier la configuration.

## Choix rapide

| Objectif                                             | Utiliser                                         | Notes                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Abonnement ChatGPT/Codex avec runtime Codex natif    | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Configuration Codex recommandée pour la plupart des utilisateurs. Connectez-vous avec l’authentification `openai-codex`. |
| Facturation directe par clé API                      | `openai/gpt-5.5`                                 | Définissez `OPENAI_API_KEY` ou lancez l’onboarding par clé API OpenAI.    |
| Authentification d’abonnement ChatGPT/Codex via PI   | `openai-codex/gpt-5.5`                           | À utiliser uniquement si vous voulez intentionnellement l’exécuteur PI normal. |
| Génération ou modification d’images                  | `openai/gpt-image-2`                             | Fonctionne avec `OPENAI_API_KEY` ou OpenAI Codex OAuth.                   |
| Images à arrière-plan transparent                    | `openai/gpt-image-1.5`                           | Utilisez `outputFormat=png` ou `webp` et `openai.background=transparent`. |

## Carte des noms

Les noms sont similaires, mais ne sont pas interchangeables :

| Nom visible                         | Couche            | Signification                                                                                     |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Préfixe fournisseur | Route directe vers l’API OpenAI Platform.                                                         |
| `openai-codex`                     | Préfixe fournisseur | Route OpenAI Codex OAuth/abonnement via l’exécuteur PI OpenClaw normal.                           |
| Plugin `codex`                     | Plugin            | Plugin OpenClaw groupé qui fournit le runtime natif de serveur d’application Codex et les contrôles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime d’agent   | Force le harnais natif de serveur d’application Codex pour les tours intégrés.                    |
| `/codex ...`                       | Ensemble de commandes de chat | Lier/contrôler des fils de serveur d’application Codex depuis une conversation.                   |
| `runtime: "acp", agentId: "codex"` | Route de session ACP | Chemin de repli explicite qui exécute Codex via ACP/acpx.                                        |

Cela signifie qu’une configuration peut intentionnellement contenir à la fois `openai-codex/*` et le Plugin `codex`. C’est valide si vous voulez Codex OAuth via PI et souhaitez aussi disposer des contrôles de chat natifs `/codex`. `openclaw doctor` avertit à propos de cette combinaison pour que vous puissiez confirmer qu’elle est intentionnelle ; il ne la réécrit pas.

<Note>
GPT-5.5 est disponible à la fois via l’accès direct par clé API OpenAI Platform et via les routes abonnement/OAuth. Pour un abonnement ChatGPT/Codex avec exécution Codex native, utilisez `openai/gpt-5.5` avec `agentRuntime.id: "codex"`. Utilisez `openai-codex/gpt-5.5` uniquement pour Codex OAuth via PI, ou `openai/gpt-5.5` sans remplacement de runtime Codex pour le trafic direct `OPENAI_API_KEY`.
</Note>

<Note>
Activer le Plugin OpenAI, ou sélectionner un modèle `openai-codex/*`, n’active pas le Plugin groupé de serveur d’application Codex. OpenClaw active ce Plugin uniquement lorsque vous sélectionnez explicitement le harnais Codex natif avec `agentRuntime.id: "codex"` ou utilisez une référence de modèle héritée `codex/*`.
Si le Plugin groupé `codex` est activé mais que `openai-codex/*` est toujours résolu via PI, `openclaw doctor` avertit et laisse la route inchangée.
</Note>

## Couverture des fonctionnalités OpenClaw

| Capacité OpenAI          | Surface OpenClaw                                           | Statut                                                 |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | Fournisseur de modèle `openai/<model>`                     | Oui                                                    |
| Modèles d’abonnement Codex | `openai-codex/<model>` avec OAuth `openai-codex`          | Oui                                                    |
| Harnais de serveur d’application Codex | `openai/<model>` avec `agentRuntime.id: codex` | Oui                                                    |
| Recherche web côté serveur | Outil OpenAI Responses natif                              | Oui, lorsque la recherche web est activée et qu’aucun fournisseur n’est épinglé |
| Images                   | `image_generate`                                           | Oui                                                    |
| Vidéos                   | `video_generate`                                           | Oui                                                    |
| Synthèse vocale          | `messages.tts.provider: "openai"` / `tts`                  | Oui                                                    |
| Reconnaissance vocale par lots | `tools.media.audio` / compréhension des médias        | Oui                                                    |
| Reconnaissance vocale en streaming | Voice Call `streaming.provider: "openai"`          | Oui                                                    |
| Voix en temps réel       | Voice Call `realtime.provider: "openai"` / Control UI Talk | Oui                                                    |
| Embeddings               | fournisseur d’embeddings de mémoire                        | Oui                                                    |

## Embeddings de mémoire

OpenClaw peut utiliser OpenAI, ou un endpoint d’embedding compatible OpenAI, pour l’indexation `memory_search` et les embeddings de requête :

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

Pour les endpoints compatibles OpenAI qui nécessitent des libellés d’embedding asymétriques, définissez `queryInputType` et `documentInputType` sous `memorySearch`. OpenClaw les transmet comme champs de requête `input_type` propres au fournisseur : les embeddings de requête utilisent `queryInputType` ; les fragments de mémoire indexés et l’indexation par lots utilisent `documentInputType`. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#provider-specific-config) pour l’exemple complet.

## Bien démarrer

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API (OpenAI Platform)">
    **Idéal pour :** l’accès direct à l’API et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passez directement la clé :

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

    ### Résumé de route

    | Référence de modèle   | Configuration du runtime    | Route                       | Authentification |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omise / `agentRuntime.id: "pi"`    | API directe OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omise / `agentRuntime.id: "pi"`    | API directe OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`         | Harnais de serveur d’application Codex | Serveur d’application Codex |

    <Note>
    `openai/*` est la route directe par clé API OpenAI, sauf si vous forcez explicitement le harnais de serveur d’application Codex. Utilisez `openai-codex/*` pour Codex OAuth via l’exécuteur PI par défaut, ou utilisez `openai/gpt-5.5` avec `agentRuntime.id: "codex"` pour l’exécution native par le serveur d’application Codex.
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
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex avec l’exécution native par le serveur d’application Codex au lieu d’une clé API séparée. Le cloud Codex exige une connexion ChatGPT.

    <Steps>
      <Step title="Lancer Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou lancez OAuth directement :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les configurations headless ou hostiles aux callbacks, ajoutez `--device-code` pour vous connecter avec un flux de code d’appareil ChatGPT au lieu du callback de navigateur localhost :

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Utiliser le runtime Codex natif">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Vérifier que l’authentification Codex est disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Une fois le Gateway en cours d’exécution, envoyez `/codex status` ou `/codex models` dans le chat pour vérifier le runtime natif de serveur d’application.
      </Step>
    </Steps>

    ### Résumé de route

    | Référence de modèle | Configuration du runtime | Route | Authentification |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harnais natif de serveur d’application Codex | Connexion Codex ou profil `openai-codex` sélectionné |
    | `openai-codex/gpt-5.5` | omise / `runtime: "pi"` | ChatGPT/Codex OAuth via PI | Connexion Codex |
    | `openai-codex/gpt-5.4-mini` | omise / `runtime: "pi"` | ChatGPT/Codex OAuth via PI | Connexion Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Toujours PI sauf si un Plugin revendique explicitement `openai-codex` | Connexion Codex |

    <Warning>
    Ne configurez pas d’anciennes références de modèles `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ou `openai-codex/gpt-5.3*`. Les comptes ChatGPT/Codex OAuth rejettent désormais ces modèles. Utilisez `openai-codex/gpt-5.5` pour la route OAuth PI, ou `openai/gpt-5.5` avec `agentRuntime.id: "codex"` pour l’exécution avec runtime Codex natif.
    </Warning>

    <Note>
    Continuez à utiliser l’id de fournisseur `openai-codex` pour les commandes d’authentification/profil. Le
    préfixe de modèle `openai-codex/*` est aussi la route PI explicite pour Codex OAuth.
    Il ne sélectionne ni n’active automatiquement le harnais de serveur d’application Codex intégré. Pour
    la configuration courante avec abonnement et runtime natif, connectez-vous avec
    `openai-codex`, mais gardez la référence de modèle `openai/gpt-5.5` et définissez
    `agentRuntime.id: "codex"`.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    Pour conserver plutôt Codex OAuth sur l’exécuteur PI normal, utilisez
    `openai-codex/gpt-5.5` et omettez la surcharge de runtime Codex.

    <Note>
    L’intégration n’importe plus d’éléments OAuth depuis `~/.codex`. Connectez-vous avec OAuth dans le navigateur (par défaut) ou avec le flux par code d’appareil ci-dessus — OpenClaw gère les identifiants obtenus dans son propre magasin d’authentification d’agents.
    </Note>

    ### Indicateur d’état

    Le chat `/status` indique quel runtime de modèle est actif pour la session actuelle.
    Le harnais PI par défaut apparaît comme `Runtime: OpenClaw Pi Default`. Lorsque le
    harnais de serveur d’application Codex intégré est sélectionné, `/status` affiche
    `Runtime: OpenAI Codex`. Les sessions existantes conservent leur id de harnais enregistré ; utilisez donc
    `/new` ou `/reset` après avoir modifié `agentRuntime` si vous voulez que `/status`
    reflète un nouveau choix PI/Codex.

    ### Avertissement du doctor

    Si le Plugin `codex` intégré est activé alors qu’une route `openai-codex/*` est
    sélectionnée, `openclaw doctor` avertit que le modèle est toujours résolu via PI.
    Ne gardez la configuration inchangée que lorsque cette route PI avec authentification par abonnement est
    intentionnelle. Passez à `openai/<model>` avec `agentRuntime.id: "codex"` lorsque
    vous voulez une exécution native par serveur d’application Codex.

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées de modèle et la limite de contexte du runtime comme des valeurs séparées.

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
    le compte est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que
    cron, les sous-agents et les exécutions avec modèle par défaut configuré n’échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Authentification du serveur d’application Codex natif

Le harnais de serveur d’application Codex natif utilise des références de modèle `openai/*` avec
`agentRuntime.id: "codex"`, mais son authentification reste basée sur le compte. OpenClaw
sélectionne l’authentification dans cet ordre :

1. Un profil d’authentification OpenClaw `openai-codex` explicite lié à l’agent.
2. Le compte existant du serveur d’application, par exemple une connexion locale ChatGPT au CLI Codex.
3. Pour les lancements locaux de serveur d’application stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsque le serveur d’application ne signale aucun compte et nécessite encore
   une authentification OpenAI.

Cela signifie qu’une connexion locale par abonnement ChatGPT/Codex n’est pas remplacée simplement
parce que le processus Gateway dispose aussi de `OPENAI_API_KEY` pour les modèles OpenAI directs
ou les embeddings. Le repli vers une clé d’API d’environnement concerne uniquement le chemin local stdio sans compte ; elle
n’est pas envoyée aux connexions WebSocket de serveur d’application. Lorsqu’un profil Codex
de type abonnement est sélectionné, OpenClaw garde aussi `CODEX_API_KEY` et `OPENAI_API_KEY`
hors du processus enfant de serveur d’application stdio lancé et envoie les identifiants sélectionnés
via le RPC de connexion du serveur d’application.

## Génération d’images

Le Plugin `openai` intégré enregistre la génération d’images via l’outil `image_generate`.
Il prend en charge à la fois la génération d’images avec clé d’API OpenAI et la génération
d’images avec Codex OAuth via la même référence de modèle `openai/gpt-image-2`.

| Capacité                  | Clé d’API OpenAI                  | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Référence de modèle       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentification          | `OPENAI_API_KEY`                   | Connexion OpenAI Codex OAuth         |
| Transport                 | API Images OpenAI                  | Backend Codex Responses              |
| Images max. par requête   | 4                                  | 4                                    |
| Mode édition              | Activé (jusqu’à 5 images de référence) | Activé (jusqu’à 5 images de référence) |
| Surcharges de taille      | Prises en charge, y compris les tailles 2K/4K | Prises en charge, y compris les tailles 2K/4K |
| Format / résolution       | Non transmis à l’API Images OpenAI | Mappé vers une taille prise en charge lorsque c’est sûr |

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

`gpt-image-2` est la valeur par défaut pour la génération texte-vers-image OpenAI et
l’édition d’images. `gpt-image-1.5`, `gpt-image-1` et `gpt-image-1-mini` restent utilisables comme
surcharges de modèle explicites. Utilisez `openai/gpt-image-1.5` pour une sortie PNG/WebP
avec arrière-plan transparent ; l’API `gpt-image-2` actuelle rejette
`background: "transparent"`.

Pour une requête avec arrière-plan transparent, les agents doivent appeler `image_generate` avec
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, et
`background: "transparent"` ; l’ancienne option de fournisseur `openai.background` est
toujours acceptée. OpenClaw protège aussi les routes publiques OpenAI et
OpenAI Codex OAuth en réécrivant les requêtes transparentes `openai/gpt-image-2` par défaut
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

Pour les installations Codex OAuth, gardez la même référence `openai/gpt-image-2`. Lorsqu’un
profil OAuth `openai-codex` est configuré, OpenClaw résout ce jeton d’accès OAuth stocké
et envoie les requêtes d’image via le backend Codex Responses. Il
n’essaie pas d’abord `OPENAI_API_KEY` et ne se rabat pas silencieusement sur une clé d’API pour cette
requête. Configurez explicitement `models.providers.openai` avec une clé d’API,
une URL de base personnalisée ou un point de terminaison Azure lorsque vous voulez utiliser directement la route API Images OpenAI.
Si ce point de terminaison d’images personnalisé se trouve sur un réseau local ou une adresse privée de confiance, définissez aussi
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw garde
les points de terminaison d’images privés/internes compatibles OpenAI bloqués sauf si cette option explicite est
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
| ----------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2`                                                                   |
| Modes             | Texte-vers-vidéo, image-vers-vidéo, édition d’une seule vidéo                     |
| Entrées de référence | 1 image ou 1 vidéo                                                            |
| Surcharges de taille | Prises en charge                                                              |
| Autres surcharges | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement d’outil |

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

## Contribution au prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 entre fournisseurs. Elle s’applique par id de modèle, donc `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` et les autres références GPT-5 compatibles reçoivent le même overlay. Les anciens modèles GPT-4.x ne le reçoivent pas.

Le harnais Codex natif intégré utilise le même comportement GPT-5 et le même overlay Heartbeat via les instructions développeur du serveur d’application Codex ; ainsi, les sessions `openai/gpt-5.x` forcées via `agentRuntime.id: "codex"` conservent les mêmes consignes de suivi jusqu’au bout et de Heartbeat proactif, même si Codex possède le reste du prompt de harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de la persona, la sécurité d’exécution, la discipline d’outillage, la forme de sortie, les contrôles d’achèvement et la vérification. Le comportement de réponse propre au canal et de message silencieux reste dans le prompt système OpenClaw partagé et la politique de livraison sortante. Les consignes GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d’interaction conviviale est séparée et configurable.

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
Les valeurs sont insensibles à la casse à l’exécution ; `"Off"` et `"off"` désactivent donc toutes deux la couche de style conviviale.
</Tip>

<Note>
L’ancien `plugins.entries.openai.config.personality` est toujours lu comme repli de compatibilité lorsque le réglage partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le Plugin `openai` intégré enregistre la synthèse vocale pour la surface `messages.tts`.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |
    | URL de base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corps supplémentaire | `messages.tts.providers.openai.extraBody` / `extra_body` | (non défini) |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` est fusionné dans le JSON de requête `/audio/speech` après les champs générés par OpenClaw ; utilisez-le donc pour les points de terminaison compatibles OpenAI qui nécessitent des clés supplémentaires telles que `lang`. Les clés de prototype sont ignorées.

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

  <Accordion title="Transcription vocale">
    Le Plugin `openai` groupé enregistre la transcription vocale par lots via
    la surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : OpenAI REST `/v1/audio/transcriptions`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de salons vocaux Discord et les
      pièces jointes audio des canaux

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
    configuration multimédia audio partagée ou par la requête de transcription par appel.

  </Accordion>

  <Accordion title="Transcription en temps réel">
    Le Plugin `openai` groupé enregistre la transcription en temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée du silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket vers `wss://api.openai.com/v1/realtime` avec de l’audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming concerne le chemin de transcription en temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise plutôt le chemin de transcription par lots `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel">
    Le Plugin `openai` groupé enregistre la voix en temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée du silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment` pour les ponts temps réel backend. Prend en charge l’appel d’outils bidirectionnel. Utilise le format audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk utilise des sessions temps réel OpenAI dans le navigateur avec un secret client éphémère
    émis par le Gateway et un échange SDP WebRTC direct depuis le navigateur avec l’API
    OpenAI Realtime. La vérification en direct par les mainteneurs est disponible avec
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ;
    le tronçon OpenAI émet un secret client dans Node, génère une offre SDP de navigateur
    avec un média de microphone factice, la publie vers OpenAI et applique la réponse SDP
    sans journaliser de secrets.
    </Note>

  </Accordion>
</AccordionGroup>

## Points de terminaison Azure OpenAI

Le fournisseur `openai` groupé peut cibler une ressource Azure OpenAI pour la génération
d’images en remplaçant l’URL de base. Sur le chemin de génération d’images, OpenClaw
détecte les noms d’hôte Azure sur `models.providers.openai.baseUrl` et bascule
automatiquement vers la forme de requête d’Azure.

<Note>
La voix en temps réel utilise un chemin de configuration distinct
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n’est pas affectée par `models.providers.openai.baseUrl`. Consultez l’accordéon **Voix en temps réel**
sous [Voix et parole](#voice-and-speech) pour ses
paramètres Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- Vous avez déjà un abonnement Azure OpenAI, un quota ou un contrat d’entreprise
- Vous avez besoin de résidence régionale des données ou des contrôles de conformité fournis par Azure
- Vous souhaitez conserver le trafic au sein d’un locataire Azure existant

### Configuration

Pour la génération d’images Azure via le fournisseur `openai` groupé, pointez
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
- Utilise un délai d’expiration de requête par défaut de 600 s pour les appels de génération d’images Azure.
  Les valeurs `timeoutMs` par appel remplacent toujours cette valeur par défaut.

Les autres URL de base (OpenAI public, proxys compatibles OpenAI) conservent la forme
standard des requêtes d’images OpenAI.

<Note>
Le routage Azure pour le chemin de génération d’images du fournisseur `openai` nécessite
OpenClaw 2026.4.22 ou version ultérieure. Les versions antérieures traitent toute valeur
personnalisée de `openai.baseUrl` comme le point de terminaison OpenAI public et échoueront avec les déploiements
d’images Azure.
</Note>

### Version d’API

Définissez `AZURE_OPENAI_API_VERSION` pour épingler une version Azure Preview ou GA spécifique
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèles sont des noms de déploiement

Azure OpenAI lie les modèles aux déploiements. Pour les requêtes de génération d’images Azure
routées via le fournisseur `openai` groupé, le champ `model` dans OpenClaw
doit être le **nom du déploiement Azure** que vous avez configuré dans le portail Azure, et non
l’identifiant du modèle OpenAI public.

Si vous créez un déploiement appelé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La même règle de nom de déploiement s’applique aux appels de génération d’images routés via
le fournisseur `openai` groupé.

### Disponibilité régionale

La génération d’images Azure n’est actuellement disponible que dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consultez la liste actuelle des régions de Microsoft avant de créer un
déploiement, et confirmez que le modèle spécifique est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut rejeter des options qu’OpenAI public autorise (par exemple certaines
valeurs `background` sur `gpt-image-2`) ou ne les exposer que sur des versions de modèle
spécifiques. Ces différences proviennent d’Azure et du modèle sous-jacent, pas
d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez
l’ensemble de paramètres pris en charge par votre déploiement spécifique et votre version d’API dans le
portail Azure.

<Note>
Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas
les en-têtes d’attribution cachés d’OpenClaw ; consultez l’accordéon **Routes natives ou compatibles OpenAI**
sous [Configuration avancée](#advanced-configuration).

Pour le trafic de chat ou Responses sur Azure (au-delà de la génération d’images), utilisez le
flux d’onboarding ou une configuration de fournisseur Azure dédiée ; `openai.baseUrl` seul
ne récupère pas la forme API/auth d’Azure. Un fournisseur distinct
`azure-openai-responses/*` existe ; consultez
l’accordéon Compaction côté serveur ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket ou SSE)">
    OpenClaw utilise WebSocket en priorité avec repli SSE (`"auto"`) pour `openai/*` et `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - Retente un échec WebSocket précoce avant de se rabattre sur SSE
    - Après un échec, marque WebSocket comme dégradé pendant environ 60 secondes et utilise SSE pendant la période de refroidissement
    - Attache des en-têtes d’identité de session et de tour stables pour les nouvelles tentatives et les reconnexions
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

    Documentation OpenAI connexe :
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
    OpenClaw expose un interrupteur de mode rapide partagé pour `openai/*` et `openai-codex/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw mappe le mode rapide au traitement prioritaire d’OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont conservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

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
    Les remplacements de session priment sur la configuration. Effacer le remplacement de session dans l’UI Sessions ramène la session à la valeur par défaut configurée.
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
    `serviceTier` est uniquement transmis aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous faites passer l’un ou l’autre provider par un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (Responses API)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), l’enveloppe de flux Pi-harness du Plugin OpenAI active automatiquement la compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu’indisponible)

    Cela s’applique au chemin Pi harness intégré et aux hooks du provider OpenAI utilisés par les exécutions intégrées. Le harness natif du serveur d’application Codex gère son propre contexte via Codex et se configure séparément avec `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` contrôle uniquement l’injection de `context_management`. Les modèles OpenAI Responses directs forcent toujours `store: true`, sauf si la compatibilité définit `supportsStore: false`.
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
    - Ne considère plus qu’un tour limité à un plan constitue une progression réussie lorsqu’une action d’outil est disponible
    - Réessaie le tour avec une consigne d’action immédiate
    - Active automatiquement `update_plan` pour les travaux substantiels
    - Affiche un état bloqué explicite si le modèle continue à planifier sans agir

    <Note>
    Limité aux exécutions OpenAI et Codex de la famille GPT-5 uniquement. Les autres providers et les anciennes familles de modèles conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives et compatibles OpenAI">
    OpenClaw traite les points de terminaison OpenAI directs, Codex et Azure OpenAI différemment des proxys `/v1` génériques compatibles OpenAI :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l’effort OpenAI `none`
    - Omittent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - Utilisent par défaut le mode strict pour les schémas d’outils
    - Joignent des en-têtes d’attribution masqués uniquement sur les hôtes natifs vérifiés
    - Conservent la mise en forme de requête propre à OpenAI (`service_tier`, `store`, compatibilité de raisonnement, indications de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Suppriment `store` de Completions dans les charges utiles `openai-completions` non natives
    - Acceptent le JSON de transmission avancée `params.extra_body`/`params.extraBody` pour les proxys Completions compatibles OpenAI
    - Acceptent `params.chat_template_kwargs` pour les proxys Completions compatibles OpenAI tels que vLLM
    - Ne forcent pas les schémas d’outils stricts ni les en-têtes réservés aux routes natives

    Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas les en-têtes d’attribution masqués.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des providers, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés des outils d’image et sélection du provider.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés des outils vidéo et sélection du provider.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
