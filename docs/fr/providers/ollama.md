---
read_when:
    - Vous voulez exécuter OpenClaw avec des modèles cloud ou locaux via Ollama
    - Vous avez besoin d’aide pour l’installation et la configuration d’Ollama
    - Vous voulez des modèles de vision Ollama pour la compréhension d’images
summary: Exécuter OpenClaw avec Ollama (modèles cloud et locaux)
title: Ollama
x-i18n:
    generated_at: "2026-06-27T18:06:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw s’intègre à l’API native d’Ollama (`/api/chat`) pour les modèles cloud hébergés et les serveurs Ollama locaux/auto-hébergés. Vous pouvez utiliser Ollama dans trois modes : `Cloud + Local` via un hôte Ollama accessible, `Cloud only` avec `https://ollama.com`, ou `Local only` avec un hôte Ollama accessible.

OpenClaw enregistre également `ollama-cloud` comme identifiant de fournisseur hébergé de premier ordre pour
une utilisation directe d’Ollama Cloud. Utilisez des références comme `ollama-cloud/kimi-k2.5:cloud` lorsque vous
voulez un routage exclusivement cloud sans partager l’identifiant du fournisseur local `ollama`.

Pour la page de configuration dédiée au cloud uniquement, consultez [Ollama Cloud](/fr/providers/ollama-cloud).

<Warning>
**Utilisateurs d’Ollama distant** : n’utilisez pas l’URL compatible OpenAI `/v1` (`http://host:11434/v1`) avec OpenClaw. Cela casse l’appel d’outils et les modèles peuvent produire du JSON d’outil brut sous forme de texte simple. Utilisez plutôt l’URL de l’API native d’Ollama : `baseUrl: "http://host:11434"` (sans `/v1`).
</Warning>

La configuration du fournisseur Ollama utilise `baseUrl` comme clé canonique. OpenClaw accepte aussi `baseURL` pour la compatibilité avec les exemples de style SDK OpenAI, mais les nouvelles configurations doivent privilégier `baseUrl`.

## Règles d’authentification

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Les hôtes Ollama locaux et LAN n’ont pas besoin d’un vrai jeton porteur. OpenClaw utilise le marqueur local `ollama-local` uniquement pour les URL de base Ollama de loopback, de réseau privé, `.local` et de noms d’hôtes nus.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Les hôtes publics distants et Ollama Cloud (`https://ollama.com`) nécessitent de véritables identifiants via `OLLAMA_API_KEY`, un profil d’authentification ou l’`apiKey` du fournisseur. Pour une utilisation hébergée directe, privilégiez le fournisseur `ollama-cloud`.
  </Accordion>
  <Accordion title="Custom provider ids">
    Les identifiants de fournisseur personnalisés qui définissent `api: "ollama"` suivent les mêmes règles. Par exemple, un fournisseur `ollama-remote` qui pointe vers un hôte Ollama sur un LAN privé peut utiliser `apiKey: "ollama-local"` et les sous-agents résoudront ce marqueur via le hook du fournisseur Ollama au lieu de le traiter comme un identifiant manquant. La recherche en mémoire peut aussi définir `agents.defaults.memorySearch.provider` sur cet identifiant de fournisseur personnalisé afin que les embeddings utilisent le point de terminaison Ollama correspondant.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` stocke l’identifiant pour un identifiant de fournisseur. Placez les paramètres de point de terminaison (`baseUrl`, `api`, identifiants de modèle, en-têtes, délais d’expiration) dans `models.providers.<id>`. Les anciens fichiers de profil d’authentification plats comme `{ "ollama-windows": { "apiKey": "ollama-local" } }` ne sont pas un format d’exécution ; exécutez `openclaw doctor --fix` pour les réécrire au format canonique de profil de clé API `ollama-windows:default` avec une sauvegarde. `baseUrl` dans ce fichier est du bruit de compatibilité et doit être déplacé vers la configuration du fournisseur.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Quand Ollama est utilisé pour les embeddings de mémoire, l’authentification par porteur est limitée à l’hôte où elle a été déclarée :

    - Une clé au niveau du fournisseur est envoyée uniquement à l’hôte Ollama de ce fournisseur.
    - `agents.*.memorySearch.remote.apiKey` est envoyé uniquement à son hôte distant d’embeddings.
    - Une valeur d’environnement pure `OLLAMA_API_KEY` est traitée comme la convention Ollama Cloud, et n’est pas envoyée par défaut aux hôtes locaux ou auto-hébergés.

  </Accordion>
</AccordionGroup>

## Bien démarrer

Choisissez votre méthode de configuration et votre mode préférés.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Idéal pour :** le chemin le plus rapide vers une configuration Ollama cloud ou locale fonctionnelle.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Sélectionnez **Ollama** dans la liste des fournisseurs.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — hôte Ollama local plus modèles cloud routés via cet hôte
        - **Cloud only** — modèles Ollama hébergés via `https://ollama.com`
        - **Local only** — modèles locaux uniquement

      </Step>
      <Step title="Select a model">
        `Cloud only` demande `OLLAMA_API_KEY` et suggère des valeurs par défaut cloud hébergées. `Cloud + Local` et `Local only` demandent une URL de base Ollama, découvrent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné s’il n’est pas encore disponible. Quand Ollama signale une balise `:latest` installée comme `gemma4:latest`, la configuration affiche ce modèle installé une seule fois au lieu d’afficher à la fois `gemma4` et `gemma4:latest` ou de télécharger à nouveau l’alias nu. `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
      </Step>
      <Step title="Verify the model is available">
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

    Vous pouvez aussi spécifier une URL de base ou un modèle personnalisé :

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **Idéal pour :** un contrôle complet sur la configuration cloud ou locale.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local** : installez Ollama, connectez-vous avec `ollama signin`, puis routez les requêtes cloud via cet hôte
        - **Cloud only** : utilisez `https://ollama.com` avec une `OLLAMA_API_KEY`
        - **Local only** : installez Ollama depuis [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        Pour `Cloud only`, utilisez votre vraie `OLLAMA_API_KEY`. Pour les configurations appuyées par un hôte, n’importe quelle valeur de remplacement fonctionne :

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
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
    `Cloud + Local` utilise un hôte Ollama accessible comme point de contrôle pour les modèles locaux comme cloud. C’est le flux hybride préféré d’Ollama.

    Utilisez **Cloud + Local** pendant la configuration. OpenClaw demande l’URL de base Ollama, découvre les modèles locaux depuis cet hôte et vérifie si l’hôte est connecté pour l’accès cloud avec `ollama signin`. Quand l’hôte est connecté, OpenClaw suggère aussi des valeurs par défaut cloud hébergées comme `kimi-k2.5:cloud`, `minimax-m2.7:cloud` et `glm-5.1:cloud`.

    Si l’hôte n’est pas encore connecté, OpenClaw garde la configuration en mode local uniquement jusqu’à ce que vous exécutiez `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` s’exécute contre l’API hébergée d’Ollama à l’adresse `https://ollama.com`.

    Utilisez **Cloud only** pendant la configuration. OpenClaw demande `OLLAMA_API_KEY`, définit `baseUrl: "https://ollama.com"` et initialise la liste des modèles cloud hébergés. Ce chemin ne nécessite **pas** de serveur Ollama local ni `ollama signin`.

    La liste des modèles cloud affichée pendant `openclaw onboard` est alimentée en direct depuis `https://ollama.com/api/tags`, limitée à 500 entrées, de sorte que le sélecteur reflète le catalogue hébergé actuel plutôt qu’une liste statique initiale. Si `ollama.com` est inaccessible ou ne renvoie aucun modèle au moment de la configuration, OpenClaw revient aux suggestions codées en dur précédentes afin que l’onboarding se termine tout de même.

    Vous pouvez aussi configurer directement le fournisseur cloud de premier ordre :

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    En mode local uniquement, OpenClaw découvre les modèles depuis l’instance Ollama configurée. Ce chemin est destiné aux serveurs Ollama locaux ou auto-hébergés.

    OpenClaw suggère actuellement `gemma4` comme valeur locale par défaut.

  </Tab>
</Tabs>

## Découverte de modèles (fournisseur implicite)

Quand vous définissez `OLLAMA_API_KEY` (ou un profil d’authentification) et que vous ne définissez **pas** `models.providers.ollama` ni un autre fournisseur distant personnalisé avec `api: "ollama"`, OpenClaw découvre les modèles depuis l’instance Ollama locale à l’adresse `http://127.0.0.1:11434`.

| Comportement         | Détail                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requête de catalogue | Interroge `/api/tags`                                                                                                                                                 |
| Détection des capacités | Utilise au mieux des recherches `/api/show` pour lire `contextWindow`, les paramètres Modelfile `num_ctx` développés et les capacités, y compris vision/outils       |
| Modèles vision       | Les modèles avec une capacité `vision` signalée par `/api/show` sont marqués comme compatibles image (`input: ["text", "image"]`), donc OpenClaw injecte automatiquement les images dans le prompt |
| Détection du raisonnement | Utilise les capacités de `/api/show` lorsqu’elles sont disponibles, y compris `thinking` ; revient à une heuristique de nom de modèle (`r1`, `reasoning`, `think`) quand Ollama omet les capacités |
| Limites de jetons    | Définit `maxTokens` sur le plafond de jetons maximal par défaut d’Ollama utilisé par OpenClaw                                                                         |
| Coûts                | Définit tous les coûts à `0`                                                                                                                                          |

Cela évite les entrées de modèle manuelles tout en gardant le catalogue aligné sur l’instance Ollama locale. Vous pouvez utiliser une référence complète comme `ollama/<pulled-model>:latest` dans `infer model run` local ; OpenClaw résout ce modèle installé depuis le catalogue live d’Ollama sans exiger une entrée `models.json` écrite à la main.

Pour les hôtes Ollama connectés, certains modèles `:cloud` peuvent être utilisables via `/api/chat`
et `/api/show` avant d’apparaître dans `/api/tags`. Quand vous sélectionnez explicitement une
référence complète `ollama/<model>:cloud`, OpenClaw valide ce modèle manquant exact avec
`/api/show` et ne l’ajoute au catalogue d’exécution que si Ollama confirme les
métadonnées du modèle. Les fautes de frappe échouent toujours comme modèles inconnus au lieu d’être créées automatiquement.

```bash
# See what models are available
ollama list
openclaw models list
```

Pour un smoke test étroit de génération de texte qui évite toute la surface d’outils de l’agent,
utilisez `infer model run` local avec une référence complète de modèle Ollama :

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Ce chemin utilise tout de même le fournisseur configuré d’OpenClaw, l’authentification et le
transport natif Ollama, mais il ne démarre pas de tour d’agent de chat et ne charge pas le contexte MCP/outils. Si
cela réussit alors que les réponses normales de l’agent échouent, diagnostiquez ensuite la capacité du modèle
pour les prompts/outils d’agent.

Pour un smoke test étroit de modèle vision sur le même chemin allégé, ajoutez un ou plusieurs
fichiers image à `infer model run`. Cela envoie le prompt et l’image directement au
modèle vision Ollama sélectionné sans charger les outils de chat, la mémoire ni le contexte de
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
JPEG et WebP courantes. Les fichiers qui ne sont pas des images sont rejetés avant l’appel à Ollama.
Pour la reconnaissance vocale, utilisez plutôt `openclaw infer audio transcribe`.

Lorsque vous changez de conversation avec `/model ollama/<model>`, OpenClaw traite
cela comme une sélection utilisateur exacte. Si le `baseUrl` Ollama configuré est
injoignable, la réponse suivante échoue avec l’erreur du fournisseur au lieu de
répondre silencieusement depuis un autre modèle de secours configuré.

Les tâches cron isolées effectuent une vérification de sécurité locale supplémentaire avant de démarrer le tour d’agent.
Si le modèle sélectionné se résout vers un fournisseur Ollama local, de réseau privé ou `.local`
et que `/api/tags` est injoignable, OpenClaw enregistre cette exécution cron
comme `skipped` avec le `ollama/<model>` sélectionné dans le texte d’erreur. Le contrôle préalable du point de terminaison
est mis en cache pendant 5 minutes, afin que plusieurs tâches cron pointant vers le même
démon Ollama arrêté ne lancent pas toutes des requêtes de modèle vouées à l’échec.

Vérifiez en direct le chemin texte local, le chemin de flux natif et les embeddings avec
Ollama local à l’aide de :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Pour les tests rapides de clé API Ollama Cloud, pointez le test live vers `https://ollama.com`
et choisissez un modèle hébergé dans le catalogue actuel :

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Le test rapide cloud exécute le texte, le flux natif et la recherche web. Il ignore les embeddings par
défaut pour `https://ollama.com`, car les clés API Ollama Cloud peuvent ne pas autoriser
`/api/embed`. Définissez `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` lorsque vous voulez explicitement
que le test live échoue si la clé cloud configurée ne peut pas utiliser le point de terminaison embed.

Pour ajouter un nouveau modèle, téléchargez-le simplement avec Ollama :

```bash
ollama pull mistral
```

Le nouveau modèle sera automatiquement découvert et disponible à l’utilisation.

<Note>
Si vous définissez `models.providers.ollama` explicitement, ou configurez un fournisseur distant personnalisé tel que `models.providers.ollama-cloud` avec `api: "ollama"`, la découverte automatique est ignorée et vous devez définir les modèles manuellement. Les fournisseurs personnalisés en loopback tels que `http://127.0.0.2:11434` sont toujours traités comme locaux. Consultez la section de configuration explicite ci-dessous.
</Note>

## Vision et description d’image

Le Plugin Ollama inclus enregistre Ollama comme fournisseur de compréhension multimédia capable de traiter les images. Cela permet à OpenClaw d’acheminer les demandes explicites de description d’image et les valeurs par défaut de modèles d’image configurées vers des modèles de vision Ollama locaux ou hébergés.

Pour la vision locale, téléchargez un modèle qui prend en charge les images :

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Vérifiez ensuite avec la CLI infer :

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` doit être une référence complète `<provider/model>`. Lorsqu’il est défini, `openclaw infer image describe` exécute directement ce modèle au lieu d’ignorer la description parce que le modèle prend en charge la vision native.

Utilisez `infer image describe` lorsque vous voulez le flux de fournisseur de compréhension d’image d’OpenClaw, `agents.defaults.imageModel` configuré et la forme de sortie de description d’image. Utilisez `infer model run --file` lorsque vous voulez une sonde de modèle multimodale brute avec une invite personnalisée et une ou plusieurs images.

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

Préférez la référence complète `ollama/<model>`. Si le même modèle est listé sous `models.providers.ollama.models` avec `input: ["text", "image"]` et qu’aucun autre fournisseur d’image configuré n’expose cet ID de modèle nu, OpenClaw normalise aussi une référence `imageModel` nue telle que `qwen2.5vl:7b` en `ollama/qwen2.5vl:7b`. Si plusieurs fournisseurs d’image configurés ont le même ID nu, utilisez explicitement le préfixe du fournisseur.

Les modèles de vision locaux lents peuvent nécessiter un délai d’expiration de compréhension d’image plus long que les modèles cloud. Ils peuvent aussi planter ou s’arrêter lorsqu’Ollama tente d’allouer tout le contexte de vision annoncé sur du matériel contraint. Définissez un délai d’expiration de capacité et limitez `num_ctx` dans l’entrée du modèle lorsque vous n’avez besoin que d’un tour normal de description d’image :

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

Ce délai d’expiration s’applique à la compréhension des images entrantes et à l’outil explicite `image` que l’agent peut appeler pendant un tour. `models.providers.ollama.timeoutSeconds` au niveau du fournisseur contrôle toujours la garde de requête HTTP Ollama sous-jacente pour les appels de modèle normaux.

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

OpenClaw rejette les demandes de description d’image pour les modèles qui ne sont pas marqués comme capables de traiter les images. Avec la découverte implicite, OpenClaw lit cette information depuis Ollama lorsque `/api/show` signale une capacité de vision.

## Configuration

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Le chemin d’activation local le plus simple passe par une variable d’environnement :

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` est défini, vous pouvez omettre `apiKey` dans l’entrée du fournisseur et OpenClaw le renseignera pour les vérifications de disponibilité.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Utilisez une configuration explicite lorsque vous voulez une configuration cloud hébergée, qu’Ollama s’exécute sur un autre hôte ou port, que vous voulez forcer des fenêtres de contexte ou listes de modèles spécifiques, ou que vous voulez des définitions de modèles entièrement manuelles.

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

  <Tab title="Custom base URL">
    Si Ollama s’exécute sur un hôte ou port différent (la configuration explicite désactive la découverte automatique, donc définissez les modèles manuellement) :

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
    N’ajoutez pas `/v1` à l’URL. Le chemin `/v1` utilise le mode compatible OpenAI, où l’appel d’outils n’est pas fiable. Utilisez l’URL Ollama de base sans suffixe de chemin.
    </Warning>

  </Tab>
</Tabs>

## Recettes courantes

Utilisez-les comme points de départ et remplacez les ID de modèle par les noms exacts provenant de `ollama list` ou `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
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

  <Accordion title="LAN Ollama host with manual models">
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

    `contextWindow` est le budget de contexte côté OpenClaw. `params.num_ctx` est envoyé à Ollama pour la requête. Gardez-les alignés lorsque votre matériel ne peut pas exécuter tout le contexte annoncé par le modèle.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Utilisez ceci lorsque vous n’exécutez pas de démon local et que vous voulez utiliser directement les modèles Ollama hébergés.

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

  <Accordion title="Cloud plus local through a signed-in daemon">
    Utilisez ceci lorsqu’un démon Ollama local ou LAN est connecté avec `ollama signin` et doit servir à la fois des modèles locaux et des modèles `:cloud`.

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

  <Accordion title="Multiple Ollama hosts">
    Utilisez des ID de fournisseur personnalisés lorsque vous avez plusieurs serveurs Ollama. Chaque fournisseur obtient son propre hôte, ses modèles, son authentification, son délai d’expiration et ses références de modèle.

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

    Quand OpenClaw envoie la requête, le préfixe du fournisseur actif est supprimé afin que `ollama-large/qwen3.5:27b` parvienne à Ollama sous la forme `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Certains modèles locaux peuvent répondre à des prompts simples, mais ont des difficultés avec toute la surface d’outils de l’agent. Commencez par limiter les outils et le contexte avant de modifier les paramètres globaux du runtime.

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
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

    N’utilisez `compat.supportsTools: false` que lorsque le modèle ou le serveur échoue de manière fiable sur les schémas d’outils. Cela échange des capacités d’agent contre de la stabilité.
    `localModelLean` retire les outils de navigateur, de Cron et de messages de la surface directe de l’agent, et place par défaut les catalogues plus volumineux derrière des contrôles structurés de recherche d’outils, sauf lorsqu’une exécution doit conserver la sémantique de remise directe des messages, mais il ne modifie pas le contexte de runtime ni le mode de réflexion d’Ollama. Associez-le à `params.num_ctx` explicite et à `params.thinking: false` pour les petits modèles de réflexion de style Qwen qui bouclent ou dépensent leur budget de réponse en raisonnement caché.

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

Les identifiants de fournisseur Ollama personnalisés sont également pris en charge. Lorsqu’une référence de modèle utilise le préfixe du fournisseur actif, comme `ollama-spark/qwen3:32b`, OpenClaw supprime uniquement ce préfixe avant d’appeler Ollama, afin que le serveur reçoive `qwen3:32b`.

Pour les modèles locaux lents, privilégiez l’ajustement des requêtes au niveau du fournisseur avant d’augmenter le délai d’expiration de tout le runtime de l’agent :

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

`timeoutSeconds` s’applique à la requête HTTP du modèle, y compris l’établissement de la connexion, les en-têtes, le streaming du corps et l’abandon total du fetch protégé. `params.keep_alive` est transmis à Ollama comme `keep_alive` de premier niveau sur les requêtes natives `/api/chat` ; définissez-le par modèle lorsque le temps de chargement du premier tour est le goulot d’étranglement.

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

Pour les hôtes distants, remplacez `127.0.0.1` par l’hôte utilisé dans `baseUrl`. Si `curl` fonctionne mais pas OpenClaw, vérifiez si le Gateway s’exécute sur une autre machine, dans un conteneur ou sous un autre compte de service.

## Recherche Web Ollama

OpenClaw prend en charge **Ollama Web Search** comme fournisseur `web_search` intégré.

| Propriété   | Détail                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hôte        | Utilise votre hôte Ollama configuré (`models.providers.ollama.baseUrl` lorsqu’il est défini, sinon `http://127.0.0.1:11434`) ; `https://ollama.com` utilise directement l’API hébergée |
| Authentification | Sans clé pour les hôtes Ollama locaux connectés ; `OLLAMA_API_KEY` ou l’authentification de fournisseur configurée pour une recherche directe sur `https://ollama.com` ou des hôtes protégés par authentification |
| Exigence    | Les hôtes locaux/auto-hébergés doivent être en cours d’exécution et connectés avec `ollama signin` ; la recherche hébergée directe nécessite `baseUrl: "https://ollama.com"` plus une vraie clé API Ollama |

Choisissez **Ollama Web Search** pendant `openclaw onboard` ou `openclaw configure --section web`, ou définissez :

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

Pour une recherche hébergée directe via Ollama Cloud :

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

Pour un daemon local connecté, OpenClaw utilise le proxy `/api/experimental/web_search` du daemon. Pour `https://ollama.com`, il appelle directement l’endpoint hébergé `/api/web_search`.

<Note>
Pour la configuration complète et les détails de comportement, consultez [Ollama Web Search](/fr/tools/ollama-search).
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **L’appel d’outils n’est pas fiable en mode compatible OpenAI.** Utilisez ce mode uniquement si vous avez besoin du format OpenAI pour un proxy et ne dépendez pas du comportement natif d’appel d’outils.
    </Warning>

    Si vous devez utiliser l’endpoint compatible OpenAI à la place (par exemple derrière un proxy qui ne prend en charge que le format OpenAI), définissez explicitement `api: "openai-completions"` :

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

    Lorsque `api: "openai-completions"` est utilisé avec Ollama, OpenClaw injecte `options.num_ctx` par défaut afin qu’Ollama ne revienne pas silencieusement à une fenêtre de contexte de 4096. Si votre proxy ou upstream rejette les champs `options` inconnus, désactivez ce comportement :

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

  <Accordion title="Context windows">
    Pour les modèles découverts automatiquement, OpenClaw utilise la fenêtre de contexte signalée par Ollama lorsqu’elle est disponible, y compris les valeurs `PARAMETER num_ctx` plus grandes issues de Modelfiles personnalisés. Sinon, il se rabat sur la fenêtre de contexte Ollama par défaut utilisée par OpenClaw.

    Vous pouvez définir des valeurs par défaut `contextWindow`, `contextTokens` et `maxTokens` au niveau du fournisseur pour chaque modèle sous ce fournisseur Ollama, puis les remplacer par modèle si nécessaire. `contextWindow` correspond au budget de prompt et de Compaction d’OpenClaw. Les requêtes Ollama natives laissent `options.num_ctx` non défini sauf si vous configurez explicitement `params.num_ctx`, afin qu’Ollama puisse appliquer son propre modèle, `OLLAMA_CONTEXT_LENGTH` ou une valeur par défaut basée sur la VRAM. Pour plafonner ou forcer le contexte de runtime par requête d’Ollama sans reconstruire un Modelfile, définissez `params.num_ctx` ; les valeurs invalides, nulles, négatives et non finies sont ignorées. Si vous avez mis à niveau une ancienne configuration qui n’utilisait que `contextWindow` ou `maxTokens` pour forcer un contexte de requête Ollama natif, exécutez `openclaw doctor --fix` pour copier ces budgets explicites de fournisseur ou de modèle dans `params.num_ctx`. L’adaptateur Ollama compatible OpenAI injecte toujours `options.num_ctx` par défaut à partir de `params.num_ctx` ou de `contextWindow` configuré ; désactivez cela avec `injectNumCtxForOpenAICompat: false` si votre upstream rejette `options`.

    Les entrées de modèle Ollama natives acceptent également les options de runtime Ollama courantes sous `params`, notamment `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` et `use_mmap`. OpenClaw transmet uniquement les clés de requête Ollama, de sorte que les paramètres de runtime OpenClaw comme `streaming` ne sont pas divulgués à Ollama. Utilisez `params.think` ou `params.thinking` pour envoyer `think` Ollama de premier niveau ; `false` désactive la réflexion au niveau de l’API pour les modèles de réflexion de style Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` par modèle fonctionne aussi. Si les deux sont configurés, l’entrée de modèle explicite du fournisseur l’emporte sur la valeur par défaut de l’agent.

  </Accordion>

  <Accordion title="Thinking control">
    Pour les modèles Ollama natifs, OpenClaw transmet le contrôle de réflexion comme Ollama l’attend : `think` de premier niveau, et non `options.think`. Les modèles découverts automatiquement dont la réponse `/api/show` inclut la capacité `thinking` exposent `/think low`, `/think medium`, `/think high` et `/think max` ; les modèles sans réflexion exposent uniquement `/think off`.

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

    `params.think` ou `params.thinking` par modèle peut désactiver ou forcer la réflexion de l’API Ollama pour un modèle configuré spécifique. OpenClaw conserve ces paramètres de modèle explicites lorsque l’exécution active n’a que la valeur implicite par défaut `off` ; les commandes de runtime différentes de `off`, comme `/think medium`, remplacent toujours l’exécution active.

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw traite les modèles dont les noms incluent par exemple `deepseek-r1`, `reasoning` ou `think` comme capables de raisonnement par défaut.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Aucune configuration supplémentaire n’est nécessaire. OpenClaw les marque automatiquement.

  </Accordion>

  <Accordion title="Model costs">
    Ollama est gratuit et s’exécute localement, donc tous les coûts de modèle sont définis à 0 $. Cela s’applique aux modèles découverts automatiquement comme aux modèles définis manuellement.
  </Accordion>

  <Accordion title="Embeddings de mémoire">
    Le plugin Ollama intégré enregistre un fournisseur d’embeddings de mémoire pour la
    [recherche en mémoire](/fr/concepts/memory). Il utilise l’URL de base Ollama
    et la clé API configurées, appelle le point de terminaison `/api/embed`
    actuel d’Ollama, et regroupe plusieurs fragments de mémoire dans une seule
    requête `input` lorsque c’est possible.

    Lorsque `proxy.enabled=true`, les requêtes d’embeddings de mémoire Ollama vers
    l’origine host-local loopback exacte déduite du `baseUrl` configuré utilisent
    le chemin direct protégé d’OpenClaw au lieu du proxy de transfert géré. Le nom
    d’hôte configuré doit lui-même être `localhost` ou une adresse IP loopback
    littérale ; les noms DNS qui se résolvent simplement vers loopback utilisent
    toujours le chemin du proxy géré. Les hôtes Ollama LAN, tailnet, réseau privé
    et publics restent également sur le chemin du proxy géré. Les redirections
    vers un autre hôte ou port n’héritent pas de la confiance. Les opérateurs
    peuvent toujours définir le paramètre global `proxy.loopbackMode: "proxy"` pour
    envoyer le trafic loopback via le proxy, ou `proxy.loopbackMode: "block"` pour
    refuser les connexions loopback avant d’ouvrir une connexion ; consultez
    [Proxy géré](/fr/security/network-proxy#gateway-loopback-mode) pour connaître
    l’effet de ce paramètre à l’échelle du processus.

    | Propriété       | Valeur              |
    | --------------- | ------------------- |
    | Modèle par défaut | `nomic-embed-text` |
    | Extraction automatique | Oui — le modèle d’embedding est extrait automatiquement s’il n’est pas présent localement |

    Les embeddings au moment de la requête utilisent des préfixes de récupération pour les modèles qui les exigent ou les recommandent, notamment `nomic-embed-text`, `qwen3-embedding` et `mxbai-embed-large`. Les lots de documents mémoire restent bruts afin que les index existants n’aient pas besoin d’une migration de format.

    Pour sélectionner Ollama comme fournisseur d’embeddings pour la recherche en mémoire :

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

    Pour un hôte d’embeddings distant, gardez l’authentification limitée à cet hôte :

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
    L’intégration Ollama d’OpenClaw utilise par défaut l’**API Ollama native** (`/api/chat`), qui prend entièrement en charge le streaming et l’appel d’outils simultanément. Aucune configuration spéciale n’est nécessaire.

    Pour les requêtes `/api/chat` natives, OpenClaw transmet aussi directement le contrôle de réflexion à Ollama : `/think off` et `openclaw agent --thinking off` envoient `think: false` au niveau supérieur, sauf si une valeur explicite de modèle `params.think`/`params.thinking` est configurée, tandis que `/think low|medium|high` envoient la chaîne d’effort `think` correspondante au niveau supérieur. `/think max` correspond à l’effort natif le plus élevé d’Ollama, `think: "high"`.

    <Tip>
    Si vous devez utiliser le point de terminaison compatible OpenAI, consultez la section « Mode compatible OpenAI hérité » ci-dessus. Le streaming et l’appel d’outils peuvent ne pas fonctionner simultanément dans ce mode.
    </Tip>

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Boucle de plantage WSL2 (redémarrages répétés)">
    Sur WSL2 avec NVIDIA/CUDA, l’installateur Linux officiel d’Ollama crée une unité systemd `ollama.service` avec `Restart=always`. Si ce service démarre automatiquement et charge un modèle utilisant le GPU pendant le démarrage de WSL2, Ollama peut immobiliser la mémoire de l’hôte pendant le chargement du modèle. La récupération de mémoire Hyper-V ne peut pas toujours récupérer ces pages immobilisées, Windows peut donc arrêter la VM WSL2, systemd relance Ollama, et la boucle se répète.

    Indices courants :

    - redémarrages ou arrêts répétés de WSL2 côté Windows
    - forte utilisation du CPU dans `app.slice` ou `ollama.service` peu après le démarrage de WSL2
    - SIGTERM provenant de systemd plutôt qu’un événement OOM-killer Linux

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

    Définissez une durée de conservation plus courte dans l’environnement du service Ollama, ou démarrez Ollama manuellement uniquement lorsque vous en avez besoin :

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
    Si votre modèle n’est pas listé, extrayez le modèle localement ou définissez-le explicitement dans `models.providers.ollama`.

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
    - L’URL utilise `/v1`, ce qui sélectionne le comportement compatible OpenAI au lieu d’Ollama natif.
    - L’hôte distant nécessite des modifications du pare-feu ou de l’écoute LAN côté Ollama.
    - Le modèle est présent sur le démon de votre ordinateur portable, mais pas sur le démon distant.

  </Accordion>

  <Accordion title="Le modèle renvoie le JSON d’outil comme texte">
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

    Si un petit modèle local échoue toujours sur les schémas d’outils, définissez `compat.supportsTools: false` sur l’entrée de ce modèle et retestez.

  </Accordion>

  <Accordion title="Kimi ou GLM renvoie des symboles illisibles">
    Les réponses Kimi/GLM hébergées qui sont longues et composées de suites de symboles non linguistiques sont traitées comme une sortie de fournisseur échouée plutôt que comme une réponse d’assistant réussie. Cela permet aux mécanismes normaux de nouvelle tentative, de repli ou de gestion d’erreur de prendre le relais sans persister le texte corrompu dans la session.

    Si cela se produit à répétition, capturez le nom brut du modèle, le fichier de session actuel, et indiquez si l’exécution utilisait `Cloud + Local` ou `Cloud only`, puis essayez une nouvelle session et un modèle de repli :

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Le modèle local à froid dépasse le délai d’attente">
    Les grands modèles locaux peuvent nécessiter un long premier chargement avant que le streaming ne commence. Gardez le délai d’attente limité au fournisseur Ollama et, facultativement, demandez à Ollama de garder le modèle chargé entre les tours :

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

    Si l’hôte lui-même met du temps à accepter les connexions, `timeoutSeconds` prolonge aussi le délai d’attente de connexion Undici protégé pour ce fournisseur.

  </Accordion>

  <Accordion title="Le modèle à grand contexte est trop lent ou manque de mémoire">
    De nombreux modèles Ollama annoncent des contextes plus grands que ce que votre matériel peut exécuter confortablement. Ollama natif utilise le contexte d’exécution par défaut propre à Ollama, sauf si vous définissez `params.num_ctx`. Limitez à la fois le budget d’OpenClaw et le contexte de requête d’Ollama lorsque vous voulez une latence prévisible avant le premier jeton :

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

    Réduisez d’abord `contextWindow` si OpenClaw envoie trop de prompt. Réduisez `params.num_ctx` si Ollama charge un contexte d’exécution trop grand pour la machine. Réduisez `maxTokens` si la génération dure trop longtemps.

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
  <Card title="Sélection des modèles" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
  <Card title="Recherche Web Ollama" href="/fr/tools/ollama-search" icon="magnifying-glass">
    Configuration complète et détails de comportement pour la recherche Web alimentée par Ollama.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration.
  </Card>
</CardGroup>
