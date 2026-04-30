---
read_when:
    - Vous souhaitez exécuter OpenClaw avec des modèles cloud ou locaux via Ollama
    - Vous avez besoin de conseils d’installation et de configuration d’Ollama
    - Vous voulez des modèles de vision Ollama pour la compréhension d’images
summary: Exécuter OpenClaw avec Ollama (modèles cloud et locaux)
title: Ollama
x-i18n:
    generated_at: "2026-04-30T07:44:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw s’intègre à l’API native d’Ollama (`/api/chat`) pour les modèles cloud hébergés et les serveurs Ollama locaux/auto-hébergés. Vous pouvez utiliser Ollama selon trois modes : `Cloud + Local` via un hôte Ollama accessible, `Cloud only` avec `https://ollama.com`, ou `Local only` avec un hôte Ollama accessible.

<Warning>
**Utilisateurs d’Ollama distant** : n’utilisez pas l’URL compatible OpenAI `/v1` (`http://host:11434/v1`) avec OpenClaw. Cela casse les appels d’outils et les modèles peuvent produire du JSON d’outil brut en texte simple. Utilisez plutôt l’URL de l’API native d’Ollama : `baseUrl: "http://host:11434"` (sans `/v1`).
</Warning>

La configuration du fournisseur Ollama utilise `baseUrl` comme clé canonique. OpenClaw accepte aussi `baseURL` pour la compatibilité avec les exemples de style SDK OpenAI, mais les nouvelles configurations devraient privilégier `baseUrl`.

## Règles d’authentification

<AccordionGroup>
  <Accordion title="Hôtes locaux et LAN">
    Les hôtes Ollama locaux et LAN n’ont pas besoin d’un vrai jeton porteur. OpenClaw utilise le marqueur local `ollama-local` uniquement pour les URL de base Ollama en local loopback, réseau privé, `.local` et nom d’hôte nu.
  </Accordion>
  <Accordion title="Hôtes distants et Ollama Cloud">
    Les hôtes publics distants et Ollama Cloud (`https://ollama.com`) exigent un véritable identifiant via `OLLAMA_API_KEY`, un profil d’authentification ou l’`apiKey` du fournisseur.
  </Accordion>
  <Accordion title="IDs de fournisseurs personnalisés">
    Les IDs de fournisseurs personnalisés qui définissent `api: "ollama"` suivent les mêmes règles. Par exemple, un fournisseur `ollama-remote` qui pointe vers un hôte Ollama LAN privé peut utiliser `apiKey: "ollama-local"` et les sous-agents résoudront ce marqueur via le hook du fournisseur Ollama au lieu de le traiter comme un identifiant manquant. La recherche mémoire peut aussi définir `agents.defaults.memorySearch.provider` sur cet ID de fournisseur personnalisé afin que les embeddings utilisent le point de terminaison Ollama correspondant.
  </Accordion>
  <Accordion title="Profils d’authentification">
    `auth-profiles.json` stocke l’identifiant pour un ID de fournisseur. Placez les paramètres de point de terminaison (`baseUrl`, `api`, IDs de modèles, en-têtes, délais d’expiration) dans `models.providers.<id>`. Les anciens fichiers de profils d’authentification plats tels que `{ "ollama-windows": { "apiKey": "ollama-local" } }` ne sont pas un format d’exécution ; exécutez `openclaw doctor --fix` pour les réécrire au format canonique de profil de clé API `ollama-windows:default` avec une sauvegarde. `baseUrl` dans ce fichier est du bruit de compatibilité et devrait être déplacé vers la configuration du fournisseur.
  </Accordion>
  <Accordion title="Portée des embeddings mémoire">
    Quand Ollama est utilisé pour les embeddings mémoire, l’authentification par jeton porteur est limitée à l’hôte où elle a été déclarée :

    - Une clé au niveau du fournisseur est envoyée uniquement à l’hôte Ollama de ce fournisseur.
    - `agents.*.memorySearch.remote.apiKey` est envoyé uniquement à son hôte d’embeddings distant.
    - Une valeur d’environnement pure `OLLAMA_API_KEY` est traitée comme la convention d’Ollama Cloud, et n’est pas envoyée par défaut aux hôtes locaux ou auto-hébergés.

  </Accordion>
</AccordionGroup>

## Bien démarrer

Choisissez votre méthode et votre mode de configuration préférés.

<Tabs>
  <Tab title="Onboarding (recommandé)">
    **Idéal pour :** le chemin le plus rapide vers une configuration Ollama cloud ou locale fonctionnelle.

    <Steps>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard
        ```

        Sélectionnez **Ollama** dans la liste des fournisseurs.
      </Step>
      <Step title="Choisir votre mode">
        - **Cloud + Local** — hôte Ollama local plus modèles cloud routés via cet hôte
        - **Cloud only** — modèles Ollama hébergés via `https://ollama.com`
        - **Local only** — modèles locaux uniquement

      </Step>
      <Step title="Sélectionner un modèle">
        `Cloud only` demande `OLLAMA_API_KEY` et suggère des valeurs par défaut cloud hébergées. `Cloud + Local` et `Local only` demandent une URL de base Ollama, découvrent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné s’il n’est pas encore disponible. Quand Ollama signale une étiquette `:latest` installée comme `gemma4:latest`, la configuration affiche ce modèle installé une seule fois au lieu d’afficher à la fois `gemma4` et `gemma4:latest` ou de télécharger à nouveau l’alias nu. `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Mode non interactif

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Vous pouvez aussi indiquer une URL de base ou un modèle personnalisé :

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuration manuelle">
    **Idéal pour :** un contrôle complet de la configuration cloud ou locale.

    <Steps>
      <Step title="Choisir cloud ou local">
        - **Cloud + Local** : installez Ollama, connectez-vous avec `ollama signin`, puis routez les requêtes cloud via cet hôte
        - **Cloud only** : utilisez `https://ollama.com` avec une `OLLAMA_API_KEY`
        - **Local only** : installez Ollama depuis [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Télécharger un modèle local (local uniquement)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Activer Ollama pour OpenClaw">
        Pour `Cloud only`, utilisez votre vraie `OLLAMA_API_KEY`. Pour les configurations adossées à un hôte, n’importe quelle valeur d’espace réservé fonctionne :

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspecter et définir votre modèle">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Ou définissez la valeur par défaut dans la configuration :

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modèles cloud

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` utilise un hôte Ollama accessible comme point de contrôle pour les modèles locaux et cloud. C’est le flux hybride préféré d’Ollama.

    Utilisez **Cloud + Local** pendant la configuration. OpenClaw demande l’URL de base Ollama, découvre les modèles locaux depuis cet hôte et vérifie si l’hôte est connecté pour l’accès cloud avec `ollama signin`. Quand l’hôte est connecté, OpenClaw suggère aussi des valeurs par défaut cloud hébergées comme `kimi-k2.5:cloud`, `minimax-m2.7:cloud` et `glm-5.1:cloud`.

    Si l’hôte n’est pas encore connecté, OpenClaw garde la configuration en local uniquement jusqu’à ce que vous exécutiez `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` s’exécute avec l’API hébergée d’Ollama sur `https://ollama.com`.

    Utilisez **Cloud only** pendant la configuration. OpenClaw demande `OLLAMA_API_KEY`, définit `baseUrl: "https://ollama.com"` et initialise la liste des modèles cloud hébergés. Ce chemin ne nécessite pas de serveur Ollama local ni `ollama signin`.

    La liste des modèles cloud affichée pendant `openclaw onboard` est alimentée en direct depuis `https://ollama.com/api/tags`, limitée à 500 entrées, afin que le sélecteur reflète le catalogue hébergé actuel plutôt qu’une base statique. Si `ollama.com` est inaccessible ou ne renvoie aucun modèle au moment de la configuration, OpenClaw revient aux suggestions codées en dur précédentes afin que l’onboarding puisse tout de même se terminer.

  </Tab>

  <Tab title="Local only">
    En mode local uniquement, OpenClaw découvre les modèles depuis l’instance Ollama configurée. Ce chemin est destiné aux serveurs Ollama locaux ou auto-hébergés.

    OpenClaw suggère actuellement `gemma4` comme valeur par défaut locale.

  </Tab>
</Tabs>

## Découverte de modèles (fournisseur implicite)

Quand vous définissez `OLLAMA_API_KEY` (ou un profil d’authentification) et que vous ne définissez **pas** `models.providers.ollama` ni un autre fournisseur distant personnalisé avec `api: "ollama"`, OpenClaw découvre les modèles depuis l’instance Ollama locale sur `http://127.0.0.1:11434`.

| Comportement         | Détail                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requête de catalogue | Interroge `/api/tags`                                                                                                                                                 |
| Détection des capacités | Utilise des recherches `/api/show` au mieux pour lire `contextWindow`, les paramètres Modelfile `num_ctx` développés, et les capacités, y compris vision/outils       |
| Modèles vision       | Les modèles avec une capacité `vision` signalée par `/api/show` sont marqués comme compatibles image (`input: ["text", "image"]`), OpenClaw injecte donc automatiquement les images dans le prompt |
| Détection du raisonnement | Utilise les capacités `/api/show` quand elles sont disponibles, y compris `thinking` ; revient à une heuristique de nom de modèle (`r1`, `reasoning`, `think`) quand Ollama omet les capacités |
| Limites de jetons    | Définit `maxTokens` sur le plafond de jetons maximal par défaut d’Ollama utilisé par OpenClaw                                                                         |
| Coûts                | Définit tous les coûts à `0`                                                                                                                                          |

Cela évite les entrées de modèle manuelles tout en gardant le catalogue aligné sur l’instance Ollama locale. Vous pouvez utiliser une référence complète telle que `ollama/<pulled-model>:latest` dans `infer model run` local ; OpenClaw résout ce modèle installé depuis le catalogue live d’Ollama sans exiger d’entrée `models.json` écrite à la main.

Pour les hôtes Ollama connectés, certains modèles `:cloud` peuvent être utilisables via `/api/chat`
et `/api/show` avant d’apparaître dans `/api/tags`. Quand vous sélectionnez explicitement une
référence complète `ollama/<model>:cloud`, OpenClaw valide ce modèle manquant exact avec
`/api/show` et l’ajoute au catalogue d’exécution uniquement si Ollama confirme les
métadonnées du modèle. Les fautes de frappe échouent toujours comme modèles inconnus au lieu d’être créées automatiquement.

```bash
# See what models are available
ollama list
openclaw models list
```

Pour un test de fumée étroit de génération de texte qui évite toute la surface d’outils de l’agent,
utilisez `infer model run` local avec une référence complète de modèle Ollama :

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Ce chemin utilise toujours le fournisseur configuré d’OpenClaw, l’authentification et le
transport Ollama natif, mais il ne démarre pas de tour d’agent de discussion et ne charge pas le contexte MCP/outils. Si
cela réussit alors que les réponses normales de l’agent échouent, dépannez ensuite la capacité du modèle à gérer les
prompts/outils d’agent.

Pour un test de fumée étroit d’un modèle vision sur le même chemin léger, ajoutez un ou plusieurs
fichiers image à `infer model run`. Cela envoie le prompt et l’image directement au
modèle vision Ollama sélectionné sans charger les outils de discussion, la mémoire ou le contexte de
session précédent :

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` accepte les fichiers détectés comme `image/*`, y compris les entrées PNG,
JPEG et WebP courantes. Les fichiers non image sont rejetés avant l’appel à Ollama.
Pour la reconnaissance vocale, utilisez plutôt `openclaw infer audio transcribe`.

Quand vous changez une conversation avec `/model ollama/<model>`, OpenClaw traite
cela comme une sélection utilisateur exacte. Si le `baseUrl` Ollama configuré est
inaccessible, la réponse suivante échoue avec l’erreur du fournisseur au lieu de répondre silencieusement
depuis un autre modèle de fallback configuré.

Les tâches cron isolées effectuent une vérification de sécurité locale supplémentaire avant de démarrer le tour de l’agent. Si le modèle sélectionné se résout en fournisseur Ollama local, de réseau privé ou `.local` et que `/api/tags` est inaccessible, OpenClaw enregistre cette exécution cron comme `skipped` avec le `ollama/<model>` sélectionné dans le texte d’erreur. La vérification préalable de l’endpoint est mise en cache pendant 5 minutes, afin que plusieurs tâches cron pointant vers le même daemon Ollama arrêté ne lancent pas toutes des requêtes de modèle vouées à échouer.

Vérifiez en direct le chemin de texte local, le chemin de flux natif et les embeddings avec Ollama local à l’aide de :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Pour ajouter un nouveau modèle, tirez-le simplement avec Ollama :

```bash
ollama pull mistral
```

Le nouveau modèle sera automatiquement découvert et disponible à l’utilisation.

<Note>
Si vous définissez explicitement `models.providers.ollama`, ou configurez un fournisseur distant personnalisé tel que `models.providers.ollama-cloud` avec `api: "ollama"`, la découverte automatique est ignorée et vous devez définir les modèles manuellement. Les fournisseurs personnalisés en loopback tels que `http://127.0.0.2:11434` sont toujours traités comme locaux. Consultez la section de configuration explicite ci-dessous.
</Note>

## Vision et description d’image

Le Plugin Ollama fourni enregistre Ollama comme fournisseur de compréhension des médias compatible avec les images. Cela permet à OpenClaw d’acheminer les requêtes explicites de description d’image et les modèles d’image par défaut configurés vers des modèles de vision Ollama locaux ou hébergés.

Pour la vision locale, tirez un modèle qui prend en charge les images :

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Puis vérifiez avec la CLI infer :

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` doit être une référence complète `<provider/model>`. Lorsqu’il est défini, `openclaw infer image describe` exécute ce modèle directement au lieu d’ignorer la description parce que le modèle prend en charge la vision native.

Utilisez `infer image describe` lorsque vous voulez le flux de fournisseur de compréhension d’image d’OpenClaw, le `agents.defaults.imageModel` configuré et la forme de sortie de description d’image. Utilisez `infer model run --file` lorsque vous voulez une sonde brute de modèle multimodal avec une invite personnalisée et une ou plusieurs images.

Pour faire d’Ollama le modèle de compréhension d’image par défaut pour les médias entrants, configurez `agents.defaults.imageModel` :

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Préférez la référence complète `ollama/<model>`. Si le même modèle est listé sous `models.providers.ollama.models` avec `input: ["text", "image"]` et qu’aucun autre fournisseur d’image configuré n’expose cet ID de modèle nu, OpenClaw normalise également une référence `imageModel` nue telle que `qwen2.5vl:7b` en `ollama/qwen2.5vl:7b`. Si plusieurs fournisseurs d’image configurés ont le même ID nu, utilisez explicitement le préfixe du fournisseur.

Les modèles de vision locaux lents peuvent nécessiter un délai d’expiration de compréhension d’image plus long que les modèles cloud. Ils peuvent aussi planter ou s’arrêter lorsque Ollama tente d’allouer tout le contexte de vision annoncé sur du matériel contraint. Définissez un délai d’expiration de capacité et limitez `num_ctx` sur l’entrée du modèle lorsque vous n’avez besoin que d’un tour normal de description d’image :

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Ce délai d’expiration s’applique à la compréhension d’image entrante et à l’outil `image` explicite que l’agent peut appeler pendant un tour. `models.providers.ollama.timeoutSeconds` au niveau fournisseur contrôle toujours la garde de requête HTTP Ollama sous-jacente pour les appels de modèle normaux.

Vérifiez en direct l’outil d’image explicite avec Ollama local à l’aide de :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Si vous définissez manuellement `models.providers.ollama.models`, marquez les modèles de vision avec la prise en charge de l’entrée image :

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rejette les requêtes de description d’image pour les modèles qui ne sont pas marqués comme compatibles avec les images. Avec la découverte implicite, OpenClaw lit cela depuis Ollama lorsque `/api/show` signale une capacité de vision.

## Configuration

<Tabs>
  <Tab title="Basique (découverte implicite)">
    Le chemin d’activation local uniquement le plus simple passe par une variable d’environnement :

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` est défini, vous pouvez omettre `apiKey` dans l’entrée du fournisseur et OpenClaw le remplira pour les vérifications de disponibilité.
    </Tip>

  </Tab>

  <Tab title="Explicite (modèles manuels)">
    Utilisez une configuration explicite lorsque vous voulez une configuration cloud hébergée, qu’Ollama s’exécute sur un autre hôte/port, que vous voulez imposer des fenêtres de contexte ou des listes de modèles spécifiques, ou que vous voulez des définitions de modèles entièrement manuelles.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="URL de base personnalisée">
    Si Ollama s’exécute sur un hôte ou un port différent (la configuration explicite désactive la découverte automatique, définissez donc les modèles manuellement) :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    N’ajoutez pas `/v1` à l’URL. Le chemin `/v1` utilise le mode compatible OpenAI, dans lequel l’appel d’outils n’est pas fiable. Utilisez l’URL Ollama de base sans suffixe de chemin.
    </Warning>

  </Tab>
</Tabs>

## Recettes courantes

Utilisez-les comme points de départ et remplacez les ID de modèle par les noms exacts provenant de `ollama list` ou `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Modèle local avec découverte automatique">
    Utilisez ceci lorsqu’Ollama s’exécute sur la même machine que le Gateway et que vous voulez qu’OpenClaw découvre automatiquement les modèles installés.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Ce chemin garde la configuration minimale. N’ajoutez pas de bloc `models.providers.ollama` sauf si vous voulez définir les modèles manuellement.

  </Accordion>

  <Accordion title="Hôte Ollama LAN avec modèles manuels">
    Utilisez les URL Ollama natives pour les hôtes LAN. N’ajoutez pas `/v1`.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` est le budget de contexte côté OpenClaw. `params.num_ctx` est envoyé à Ollama pour la requête. Gardez-les alignés lorsque votre matériel ne peut pas exécuter tout le contexte annoncé du modèle.

  </Accordion>

  <Accordion title="Ollama Cloud uniquement">
    Utilisez ceci lorsque vous n’exécutez pas de daemon local et que vous voulez des modèles Ollama hébergés directement.

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Cloud plus local via un daemon connecté">
    Utilisez ceci lorsqu’un daemon Ollama local ou LAN est connecté avec `ollama signin` et doit servir à la fois les modèles locaux et les modèles `:cloud`.

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Plusieurs hôtes Ollama">
    Utilisez des ID de fournisseur personnalisés lorsque vous avez plusieurs serveurs Ollama. Chaque fournisseur reçoit son propre hôte, ses modèles, son authentification, son délai d’expiration et ses références de modèle.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    Lorsque OpenClaw envoie la requête, le préfixe du fournisseur actif est supprimé afin que `ollama-large/qwen3.5:27b` arrive à Ollama sous la forme `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Profil de modèle local léger">
    Certains modèles locaux peuvent répondre à des invites simples, mais peinent avec toute la surface d’outils de l’agent. Commencez par limiter les outils et le contexte avant de modifier les paramètres globaux du runtime.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Utilisez `compat.supportsTools: false` uniquement lorsque le modèle ou le serveur échoue de manière fiable sur les schémas d’outils. Cela échange des capacités d’agent contre de la stabilité.
    `localModelLean` supprime les outils de navigateur, de Cron et de messages de la surface de l’agent, mais ne modifie pas le contexte d’exécution ni le mode de réflexion d’Ollama. Associez-le à `params.num_ctx` explicite et à `params.thinking: false` pour les petits modèles de réflexion de style Qwen qui bouclent ou dépensent leur budget de réponse en raisonnement masqué.

  </Accordion>
</AccordionGroup>

### Sélection du modèle

Une fois configurés, tous vos modèles Ollama sont disponibles :

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

Les identifiants de fournisseurs Ollama personnalisés sont également pris en charge. Lorsqu’une référence de modèle utilise le préfixe du fournisseur actif, comme `ollama-spark/qwen3:32b`, OpenClaw ne retire que ce préfixe avant d’appeler Ollama afin que le serveur reçoive `qwen3:32b`.

Pour les modèles locaux lents, privilégiez le réglage des requêtes au niveau du fournisseur avant d’augmenter le délai d’expiration de l’ensemble de l’environnement d’exécution de l’agent :

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` s’applique à la requête HTTP du modèle, y compris l’établissement de la connexion, les en-têtes, le flux du corps et l’abandon total du fetch protégé. `params.keep_alive` est transmis à Ollama comme `keep_alive` de premier niveau sur les requêtes natives `/api/chat` ; définissez-le par modèle lorsque le temps de chargement au premier tour est le goulot d’étranglement.

### Vérification rapide

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Pour les hôtes distants, remplacez `127.0.0.1` par l’hôte utilisé dans `baseUrl`. Si `curl` fonctionne mais pas OpenClaw, vérifiez si le Gateway s’exécute sur une autre machine, dans un conteneur ou avec un autre compte de service.

## Recherche Web Ollama

OpenClaw prend en charge **Recherche Web Ollama** comme fournisseur `web_search` intégré.

| Propriété   | Détail                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hôte        | Utilise votre hôte Ollama configuré (`models.providers.ollama.baseUrl` lorsqu’il est défini, sinon `http://127.0.0.1:11434`) ; `https://ollama.com` utilise directement l’API hébergée |
| Auth        | Sans clé pour les hôtes Ollama locaux connectés ; `OLLAMA_API_KEY` ou l’authentification de fournisseur configurée pour la recherche directe via `https://ollama.com` ou les hôtes protégés par authentification |
| Exigence    | Les hôtes locaux/auto-hébergés doivent être en cours d’exécution et connectés avec `ollama signin` ; la recherche hébergée directe nécessite `baseUrl: "https://ollama.com"` plus une vraie clé API Ollama |

Choisissez **Recherche Web Ollama** pendant `openclaw onboard` ou `openclaw configure --section web`, ou définissez :

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Pour la recherche hébergée directe via Ollama Cloud :

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Pour un démon local connecté, OpenClaw utilise le proxy `/api/experimental/web_search` du démon. Pour `https://ollama.com`, il appelle directement le point de terminaison hébergé `/api/web_search`.

<Note>
Pour la configuration complète et les détails de comportement, consultez [Recherche Web Ollama](/fr/tools/ollama-search).
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode compatible OpenAI hérité">
    <Warning>
    **L’appel d’outils n’est pas fiable en mode compatible OpenAI.** Utilisez ce mode uniquement si vous avez besoin du format OpenAI pour un proxy et ne dépendez pas du comportement natif d’appel d’outils.
    </Warning>

    Si vous devez utiliser le point de terminaison compatible OpenAI à la place (par exemple, derrière un proxy qui ne prend en charge que le format OpenAI), définissez explicitement `api: "openai-completions"` :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Ce mode peut ne pas prendre en charge simultanément le streaming et l’appel d’outils. Vous devrez peut-être désactiver le streaming avec `params: { streaming: false }` dans la configuration du modèle.

    Lorsque `api: "openai-completions"` est utilisé avec Ollama, OpenClaw injecte `options.num_ctx` par défaut afin qu’Ollama ne revienne pas silencieusement à une fenêtre de contexte de 4096. Si votre proxy ou amont rejette les champs `options` inconnus, désactivez ce comportement :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Fenêtres de contexte">
    Pour les modèles découverts automatiquement, OpenClaw utilise la fenêtre de contexte indiquée par Ollama lorsqu’elle est disponible, y compris les valeurs `PARAMETER num_ctx` plus grandes provenant de Modelfiles personnalisés. Sinon, il revient à la fenêtre de contexte Ollama par défaut utilisée par OpenClaw.

    Vous pouvez définir des valeurs par défaut `contextWindow`, `contextTokens` et `maxTokens` au niveau du fournisseur pour chaque modèle sous ce fournisseur Ollama, puis les remplacer par modèle si nécessaire. `contextWindow` correspond au budget de prompt et de Compaction d’OpenClaw. Les requêtes Ollama natives laissent `options.num_ctx` non défini sauf si vous configurez explicitement `params.num_ctx`, afin qu’Ollama puisse appliquer son propre modèle, `OLLAMA_CONTEXT_LENGTH` ou une valeur par défaut basée sur la VRAM. Pour plafonner ou forcer le contexte d’exécution par requête d’Ollama sans reconstruire un Modelfile, définissez `params.num_ctx` ; les valeurs invalides, nulles, négatives et non finies sont ignorées. L’adaptateur Ollama compatible OpenAI injecte toujours `options.num_ctx` par défaut à partir de `params.num_ctx` ou `contextWindow` configuré ; désactivez cela avec `injectNumCtxForOpenAICompat: false` si votre amont rejette `options`.

    Les entrées de modèles Ollama natives acceptent également les options d’exécution Ollama courantes sous `params`, notamment `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` et `use_mmap`. OpenClaw ne transmet que les clés de requête Ollama, de sorte que les paramètres d’exécution OpenClaw comme `streaming` ne sont pas divulgués à Ollama. Utilisez `params.think` ou `params.thinking` pour envoyer le `think` Ollama de premier niveau ; `false` désactive la réflexion au niveau de l’API pour les modèles de réflexion de style Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    `agents.defaults.models["ollama/<model>"].params.num_ctx` par modèle fonctionne aussi. Si les deux sont configurés, l’entrée de modèle de fournisseur explicite l’emporte sur la valeur par défaut de l’agent.

  </Accordion>

  <Accordion title="Contrôle de la réflexion">
    Pour les modèles Ollama natifs, OpenClaw transmet le contrôle de la réflexion comme Ollama l’attend : `think` de premier niveau, et non `options.think`. Les modèles découverts automatiquement dont la réponse `/api/show` inclut la capacité `thinking` exposent `/think low`, `/think medium`, `/think high` et `/think max` ; les modèles sans réflexion n’exposent que `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Vous pouvez également définir une valeur par défaut de modèle :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think` ou `params.thinking` par modèle peut désactiver ou forcer la réflexion de l’API Ollama pour un modèle configuré spécifique. OpenClaw préserve ces paramètres de modèle explicites lorsque l’exécution active n’a que la valeur par défaut implicite `off` ; les commandes d’exécution non désactivées comme `/think medium` remplacent toujours l’exécution active.

  </Accordion>

  <Accordion title="Modèles de raisonnement">
    OpenClaw traite par défaut les modèles dont les noms contiennent `deepseek-r1`, `reasoning` ou `think` comme capables de raisonnement.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Aucune configuration supplémentaire n’est nécessaire. OpenClaw les marque automatiquement.

  </Accordion>

  <Accordion title="Coûts des modèles">
    Ollama est gratuit et s’exécute localement, donc tous les coûts des modèles sont définis à 0 $. Cela s’applique aux modèles découverts automatiquement comme aux modèles définis manuellement.
  </Accordion>

  <Accordion title="Intégrations de mémoire">
    Le Plugin Ollama intégré enregistre un fournisseur d’intégration de mémoire pour
    [la recherche en mémoire](/fr/concepts/memory). Il utilise l’URL de base Ollama
    et la clé API configurées, appelle le point de terminaison Ollama actuel `/api/embed` et regroupe
    plusieurs fragments de mémoire dans une seule requête `input` lorsque c’est possible.

    | Propriété      | Valeur              |
    | --------------- | ------------------- |
    | Modèle par défaut | `nomic-embed-text`  |
    | Téléchargement automatique | Oui — le modèle d’intégration est téléchargé automatiquement s’il n’est pas présent localement |

    Les intégrations au moment de la requête utilisent des préfixes de récupération pour les modèles qui les exigent ou les recommandent, notamment `nomic-embed-text`, `qwen3-embedding` et `mxbai-embed-large`. Les lots de documents de mémoire restent bruts afin que les index existants ne nécessitent pas de migration de format.

    Pour sélectionner Ollama comme fournisseur d’intégration de recherche en mémoire :

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Pour un hôte d’intégration distant, limitez l’authentification à cet hôte :

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuration du streaming">
    L’intégration Ollama d’OpenClaw utilise par défaut l’**API Ollama native** (`/api/chat`), qui prend entièrement en charge simultanément le streaming et l’appel d’outils. Aucune configuration particulière n’est nécessaire.

    Pour les requêtes `/api/chat` natives, OpenClaw transmet aussi directement à Ollama le contrôle de la réflexion : `/think off` et `openclaw agent --thinking off` envoient `think: false` au niveau supérieur, sauf si une valeur explicite `params.think`/`params.thinking` est configurée pour le modèle, tandis que `/think low|medium|high` envoient la chaîne d’effort `think` correspondante au niveau supérieur. `/think max` correspond à l’effort natif le plus élevé d’Ollama, `think: "high"`.

    <Tip>
    Si vous devez utiliser le point de terminaison compatible OpenAI, consultez la section « Mode hérité compatible OpenAI » ci-dessus. Le streaming et l’appel d’outils peuvent ne pas fonctionner simultanément dans ce mode.
    </Tip>

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Boucle de plantage WSL2 (redémarrages répétés)">
    Sous WSL2 avec NVIDIA/CUDA, l’installateur Linux officiel d’Ollama crée une unité systemd `ollama.service` avec `Restart=always`. Si ce service démarre automatiquement et charge un modèle utilisant le GPU pendant le démarrage de WSL2, Ollama peut verrouiller la mémoire de l’hôte pendant le chargement du modèle. La récupération de mémoire Hyper-V ne peut pas toujours récupérer ces pages verrouillées, Windows peut donc arrêter la VM WSL2, systemd relance Ollama, et la boucle se répète.

    Indices courants :

    - redémarrages ou arrêts répétés de WSL2 depuis Windows
    - forte utilisation du CPU dans `app.slice` ou `ollama.service` peu après le démarrage de WSL2
    - SIGTERM provenant de systemd plutôt que d’un événement OOM-killer Linux

    OpenClaw journalise un avertissement au démarrage lorsqu’il détecte WSL2, `ollama.service` activé avec `Restart=always`, et des marqueurs CUDA visibles.

    Atténuation :

    ```bash
    sudo systemctl disable ollama
    ```

    Ajoutez ceci à `%USERPROFILE%\.wslconfig` côté Windows, puis exécutez `wsl --shutdown` :

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Définissez un délai keep-alive plus court dans l’environnement du service Ollama, ou démarrez Ollama manuellement uniquement lorsque vous en avez besoin :

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consultez [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama non détecté">
    Assurez-vous qu’Ollama est en cours d’exécution, que vous avez défini `OLLAMA_API_KEY` (ou un profil d’authentification), et que vous n’avez **pas** défini d’entrée explicite `models.providers.ollama` :

    ```bash
    ollama serve
    ```

    Vérifiez que l’API est accessible :

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Aucun modèle disponible">
    Si votre modèle n’est pas répertorié, téléchargez-le localement ou définissez-le explicitement dans `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connexion refusée">
    Vérifiez qu’Ollama s’exécute sur le bon port :

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="L’hôte distant fonctionne avec curl mais pas avec OpenClaw">
    Vérifiez depuis la même machine et le même runtime que ceux qui exécutent le Gateway :

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causes courantes :

    - `baseUrl` pointe vers `localhost`, mais le Gateway s’exécute dans Docker ou sur un autre hôte.
    - L’URL utilise `/v1`, ce qui sélectionne le comportement compatible OpenAI au lieu du comportement Ollama natif.
    - L’hôte distant nécessite des modifications de pare-feu ou d’écoute LAN côté Ollama.
    - Le modèle est présent sur le démon de votre ordinateur portable, mais pas sur le démon distant.

  </Accordion>

  <Accordion title="Le modèle produit le JSON d’outil sous forme de texte">
    Cela signifie généralement que le fournisseur utilise le mode compatible OpenAI ou que le modèle ne peut pas gérer les schémas d’outils.

    Préférez le mode Ollama natif :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Si un petit modèle local échoue encore sur les schémas d’outils, définissez `compat.supportsTools: false` sur cette entrée de modèle et refaites un test.

  </Accordion>

  <Accordion title="Kimi ou GLM renvoie des symboles illisibles">
    Les réponses Kimi/GLM hébergées qui sont longues et composées de séries de symboles non linguistiques sont traitées comme une sortie de fournisseur échouée plutôt que comme une réponse d’assistant réussie. Cela permet aux mécanismes normaux de nouvelle tentative, de repli ou de gestion d’erreur de prendre le relais sans persister le texte corrompu dans la session.

    Si cela se produit de manière répétée, capturez le nom brut du modèle, le fichier de session actuel, et indiquez si l’exécution a utilisé `Cloud + Local` ou `Cloud only`, puis essayez une nouvelle session et un modèle de repli :

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Le modèle local à froid expire">
    Les grands modèles locaux peuvent nécessiter un long premier chargement avant que le streaming commence. Gardez le délai d’expiration limité au fournisseur Ollama et, facultativement, demandez à Ollama de garder le modèle chargé entre les tours :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Si l’hôte lui-même met du temps à accepter les connexions, `timeoutSeconds` prolonge aussi le délai d’expiration de connexion Undici protégé pour ce fournisseur.

  </Accordion>

  <Accordion title="Le modèle à grand contexte est trop lent ou manque de mémoire">
    De nombreux modèles Ollama annoncent des contextes plus grands que ce que votre matériel peut exécuter confortablement. Ollama natif utilise le contexte par défaut du runtime Ollama, sauf si vous définissez `params.num_ctx`. Limitez à la fois le budget d’OpenClaw et le contexte de requête d’Ollama lorsque vous voulez une latence prévisible avant le premier token :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Réduisez d’abord `contextWindow` si OpenClaw envoie trop de prompt. Réduisez `params.num_ctx` si Ollama charge un contexte de runtime trop grand pour la machine. Réduisez `maxTokens` si la génération dure trop longtemps.

  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
  <Card title="Recherche web Ollama" href="/fr/tools/ollama-search" icon="magnifying-glass">
    Configuration complète et détails de comportement pour la recherche web propulsée par Ollama.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration.
  </Card>
</CardGroup>
