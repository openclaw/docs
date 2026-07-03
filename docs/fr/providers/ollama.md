---
read_when:
    - Vous souhaitez exécuter OpenClaw avec des modèles cloud ou locaux via Ollama
    - Vous avez besoin de conseils pour l’installation et la configuration d’Ollama
    - Vous voulez des modèles de vision Ollama pour la compréhension des images
summary: Exécuter OpenClaw avec Ollama (modèles cloud et locaux)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:34:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw s’intègre à l’API native d’Ollama (`/api/chat`) pour les modèles cloud hébergés et les serveurs Ollama locaux ou auto-hébergés. Vous pouvez utiliser Ollama selon trois modes : `Cloud + Local` via un hôte Ollama joignable, `Cloud only` avec `https://ollama.com`, ou `Local only` avec un hôte Ollama joignable.

OpenClaw enregistre aussi `ollama-cloud` comme identifiant de fournisseur hébergé de premier ordre pour une utilisation directe d’Ollama Cloud. Utilisez des références comme `ollama-cloud/kimi-k2.5:cloud` lorsque vous voulez un routage cloud uniquement sans partager l’identifiant du fournisseur local `ollama`.

Pour la page de configuration dédiée au cloud uniquement, consultez [Ollama Cloud](/fr/providers/ollama-cloud).

<Warning>
**Utilisateurs d’Ollama distant** : n’utilisez pas l’URL compatible OpenAI `/v1` (`http://host:11434/v1`) avec OpenClaw. Cela casse l’appel d’outils et les modèles peuvent produire du JSON d’outil brut sous forme de texte simple. Utilisez plutôt l’URL de l’API native d’Ollama : `baseUrl: "http://host:11434"` (sans `/v1`).
</Warning>

La configuration du fournisseur Ollama utilise `baseUrl` comme clé canonique. OpenClaw accepte aussi `baseURL` pour compatibilité avec les exemples de style SDK OpenAI, mais les nouvelles configurations devraient privilégier `baseUrl`.

## Règles d’authentification

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Les hôtes Ollama locaux et LAN n’ont pas besoin d’un véritable jeton porteur. OpenClaw utilise le marqueur local `ollama-local` uniquement pour les URL de base Ollama en local loopback, sur réseau privé, en `.local` et avec nom d’hôte nu.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Les hôtes publics distants et Ollama Cloud (`https://ollama.com`) exigent un véritable identifiant via `OLLAMA_API_KEY`, un profil d’authentification ou `apiKey` du fournisseur. Pour une utilisation hébergée directe, privilégiez le fournisseur `ollama-cloud`.
  </Accordion>
  <Accordion title="Custom provider ids">
    Les identifiants de fournisseur personnalisés qui définissent `api: "ollama"` suivent les mêmes règles. Par exemple, un fournisseur `ollama-remote` qui pointe vers un hôte Ollama sur un LAN privé peut utiliser `apiKey: "ollama-local"`, et les sous-agents résoudront ce marqueur via le hook du fournisseur Ollama au lieu de le traiter comme un identifiant manquant. La recherche en mémoire peut aussi définir `agents.defaults.memorySearch.provider` sur cet identifiant de fournisseur personnalisé afin que les embeddings utilisent le point de terminaison Ollama correspondant.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` stocke l’identifiant pour un identifiant de fournisseur. Placez les paramètres de point de terminaison (`baseUrl`, `api`, identifiants de modèles, en-têtes, délais d’expiration) dans `models.providers.<id>`. Les anciens fichiers de profil d’authentification plats tels que `{ "ollama-windows": { "apiKey": "ollama-local" } }` ne sont pas un format d’exécution ; exécutez `openclaw doctor --fix` pour les réécrire au format canonique de profil de clé API `ollama-windows:default` avec une sauvegarde. `baseUrl` dans ce fichier est du bruit de compatibilité et devrait être déplacé vers la configuration du fournisseur.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Quand Ollama est utilisé pour les embeddings de mémoire, l’authentification par porteur est limitée à l’hôte où elle a été déclarée :

    - Une clé au niveau du fournisseur est envoyée uniquement à l’hôte Ollama de ce fournisseur.
    - `agents.*.memorySearch.remote.apiKey` est envoyée uniquement à son hôte d’embedding distant.
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
        - **Cloud + local** — hôte Ollama local avec modèles cloud routés via cet hôte
        - **Cloud uniquement** — modèles Ollama hébergés via `https://ollama.com`
        - **Local uniquement** — modèles locaux uniquement

      </Step>
      <Step title="Select a model">
        `Cloud only` demande `OLLAMA_API_KEY` et suggère des valeurs par défaut cloud hébergées. `Cloud + Local` et `Local only` demandent une URL de base Ollama, découvrent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné s’il n’est pas encore disponible. Quand Ollama signale une balise `:latest` installée, par exemple `gemma4:latest`, la configuration affiche une seule fois ce modèle installé au lieu d’afficher à la fois `gemma4` et `gemma4:latest` ou de télécharger à nouveau l’alias nu. `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
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

    Facultativement, indiquez une URL de base ou un modèle personnalisé :

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
        - **Cloud + local** : installez Ollama, connectez-vous avec `ollama signin` et routez les requêtes cloud via cet hôte
        - **Cloud uniquement** : utilisez `https://ollama.com` avec une `OLLAMA_API_KEY`
        - **Local uniquement** : installez Ollama depuis [ollama.com/download](https://ollama.com/download)

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
        Pour `Cloud only`, utilisez votre vraie `OLLAMA_API_KEY`. Pour les configurations adossées à un hôte, toute valeur de remplacement fonctionne :

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
    `Cloud + Local` utilise un hôte Ollama joignable comme point de contrôle pour les modèles locaux comme cloud. C’est le flux hybride privilégié par Ollama.

    Utilisez **Cloud + local** pendant la configuration. OpenClaw demande l’URL de base Ollama, découvre les modèles locaux depuis cet hôte et vérifie si l’hôte est connecté pour l’accès cloud avec `ollama signin`. Quand l’hôte est connecté, OpenClaw suggère aussi des valeurs par défaut cloud hébergées telles que `kimi-k2.5:cloud`, `minimax-m2.7:cloud` et `glm-5.1:cloud`.

    Si l’hôte n’est pas encore connecté, OpenClaw conserve une configuration locale uniquement jusqu’à ce que vous exécutiez `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` s’exécute avec l’API hébergée d’Ollama sur `https://ollama.com`.

    Utilisez **Cloud uniquement** pendant la configuration. OpenClaw demande `OLLAMA_API_KEY`, définit `baseUrl: "https://ollama.com"` et initialise la liste des modèles cloud hébergés. Ce chemin n’exige **pas** de serveur Ollama local ni `ollama signin`.

    La liste des modèles cloud affichée pendant `openclaw onboard` est alimentée en direct depuis `https://ollama.com/api/tags`, limitée à 500 entrées, afin que le sélecteur reflète le catalogue hébergé actuel plutôt qu’une liste statique initiale. Si `ollama.com` est injoignable ou ne renvoie aucun modèle au moment de la configuration, OpenClaw revient aux suggestions codées en dur précédentes afin que l’onboarding puisse quand même se terminer.

    Vous pouvez aussi configurer directement le fournisseur cloud de premier ordre :

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    En mode local uniquement, OpenClaw découvre les modèles depuis l’instance Ollama configurée. Ce chemin est destiné aux serveurs Ollama locaux ou auto-hébergés.

    OpenClaw suggère actuellement `gemma4` comme valeur par défaut locale.

  </Tab>
</Tabs>

## Découverte des modèles (fournisseur implicite)

Quand vous définissez `OLLAMA_API_KEY` (ou un profil d’authentification) et que vous ne définissez **pas** `models.providers.ollama` ni un autre fournisseur distant personnalisé avec `api: "ollama"`, OpenClaw découvre les modèles depuis l’instance Ollama locale sur `http://127.0.0.1:11434`.

| Comportement         | Détail                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requête de catalogue | Interroge `/api/tags`                                                                                                                                                |
| Détection des capacités | Utilise des recherches `/api/show` en meilleur effort pour lire `contextWindow`, les paramètres Modelfile `num_ctx` étendus et les capacités, y compris vision/outils |
| Modèles vision       | Les modèles avec une capacité `vision` signalée par `/api/show` sont marqués comme compatibles avec les images (`input: ["text", "image"]`), donc OpenClaw injecte automatiquement les images dans le prompt |
| Détection du raisonnement | Utilise les capacités `/api/show` lorsqu’elles sont disponibles, y compris `thinking` ; revient à une heuristique sur le nom du modèle (`r1`, `reasoning`, `think`) quand Ollama omet les capacités |
| Limites de jetons    | Définit `maxTokens` sur le plafond de jetons maximal Ollama par défaut utilisé par OpenClaw                                                                           |
| Coûts                | Définit tous les coûts à `0`                                                                                                                                         |

Cela évite les entrées de modèle manuelles tout en gardant le catalogue aligné sur l’instance Ollama locale. Vous pouvez utiliser une référence complète telle que `ollama/<pulled-model>:latest` dans `infer model run` local ; OpenClaw résout ce modèle installé depuis le catalogue en direct d’Ollama sans exiger d’entrée `models.json` écrite à la main.

Pour les hôtes Ollama connectés, certains modèles `:cloud` peuvent être utilisables via `/api/chat` et `/api/show` avant d’apparaître dans `/api/tags`. Quand vous sélectionnez explicitement une référence complète `ollama/<model>:cloud`, OpenClaw valide ce modèle manquant exact avec `/api/show` et l’ajoute au catalogue d’exécution uniquement si Ollama confirme les métadonnées du modèle. Les fautes de frappe échouent toujours comme modèles inconnus au lieu d’être créées automatiquement.

```bash
# See what models are available
ollama list
openclaw models list
```

Pour un smoke test étroit de génération de texte qui évite toute la surface d’outils de l’agent, utilisez `infer model run` local avec une référence complète de modèle Ollama :

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Ce chemin utilise toujours le fournisseur configuré d’OpenClaw, l’authentification et le transport natif Ollama, mais il ne démarre pas un tour d’agent de chat et ne charge pas le contexte MCP/outils. Si cela réussit alors que les réponses normales de l’agent échouent, examinez ensuite la capacité du modèle pour les prompts/outils d’agent.

Pour un smoke test étroit de modèle vision sur le même chemin allégé, ajoutez un ou plusieurs fichiers image à `infer model run`. Cela envoie le prompt et l’image directement au modèle vision Ollama sélectionné sans charger les outils de chat, la mémoire ni le contexte de session antérieur :

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

Lorsque vous basculez une conversation avec `/model ollama/<model>`, OpenClaw traite
cela comme une sélection utilisateur exacte. Si le `baseUrl` Ollama configuré est
injoignable, la réponse suivante échoue avec l’erreur du fournisseur au lieu de répondre
silencieusement depuis un autre modèle de secours configuré.

Les tâches Cron isolées effectuent une vérification locale de sécurité supplémentaire avant de démarrer le tour de l’agent.
Si le modèle sélectionné se résout vers un fournisseur Ollama local, de réseau privé ou `.local`
et que `/api/tags` est injoignable, OpenClaw enregistre cette exécution Cron
comme `skipped` avec le `ollama/<model>` sélectionné dans le texte d’erreur. Le précontrôle
du point de terminaison est mis en cache pendant 5 minutes, de sorte que plusieurs tâches Cron pointant vers le même
démon Ollama arrêté ne lancent pas toutes des requêtes de modèle vouées à l’échec.

Vérifiez en direct le chemin de texte local, le chemin de flux natif et les embeddings avec
Ollama local à l’aide de :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Pour les tests de fumée avec clé d’API Ollama Cloud, pointez le test en direct vers `https://ollama.com`
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

Le test de fumée cloud exécute le texte, le flux natif et la recherche web. Il ignore les embeddings par
défaut pour `https://ollama.com`, car les clés d’API Ollama Cloud peuvent ne pas autoriser
`/api/embed`. Définissez `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` lorsque vous voulez explicitement
que le test en direct échoue si la clé cloud configurée ne peut pas utiliser le point de terminaison d’embedding.

Pour ajouter un nouveau modèle, téléchargez-le simplement avec Ollama :

```bash
ollama pull mistral
```

Le nouveau modèle sera découvert automatiquement et disponible à l’utilisation.

<Note>
Si vous définissez explicitement `models.providers.ollama`, ou configurez un fournisseur distant personnalisé tel que `models.providers.ollama-cloud` avec `api: "ollama"`, la découverte automatique est ignorée et vous devez définir les modèles manuellement. Les fournisseurs personnalisés de loopback tels que `http://127.0.0.2:11434` sont toujours traités comme locaux. Consultez la section de configuration explicite ci-dessous.
</Note>

## Inférence locale au Node

Les agents peuvent déléguer une courte tâche à un modèle Ollama installé sur un Node
de bureau ou serveur appairé. Le prompt et la réponse traversent la connexion Gateway/Node
authentifiée existante ; la requête de modèle s’exécute sur le Node sélectionné avec
son point de terminaison Ollama de loopback standard (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Start Ollama on the node">
    Téléchargez au moins un modèle de chat et gardez Ollama en cours d’exécution :

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Connect the node host">
    Sur la même machine qu’Ollama, connectez un hôte Node au Gateway :

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Approuvez le nouvel appareil et ses commandes Node déclarées sur l’hôte Gateway,
    puis vérifiez le Node :

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Une première connexion et une mise à niveau qui ajoute les commandes Ollama peuvent toutes deux
    déclencher l’approbation des commandes Node. Si le Node se connecte sans annoncer
    `ollama.models` et `ollama.chat`, vérifiez à nouveau `openclaw nodes pending`.

  </Step>
  <Step title="Ask an agent to use local inference">
    Le Plugin Ollama groupé expose l’outil `node_inference`. Les agents utilisent d’abord
    `action: "discover"`, puis `action: "run"` avec un Node et un modèle renvoyés.
    Si exactement un Node compatible est connecté, `run` peut omettre le Node.

    Par exemple : « Découvre les modèles Ollama sur mes Nodes, puis utilise le modèle chargé le plus rapide
    pour résumer ce texte. »

  </Step>
</Steps>

La découverte lit `/api/tags`, vérifie les capacités avec `/api/show` et utilise `/api/ps`
lorsqu’il est disponible pour classer en premier les modèles déjà chargés. Elle renvoie uniquement les modèles de chat locaux
compatibles : les lignes Ollama Cloud et les modèles réservés aux embeddings sont exclus.
Chaque exécution demande à Ollama de désactiver la réflexion du modèle et limite la sortie à 512 tokens,
sauf si l’appel d’outil demande une valeur `maxTokens` différente. Certains modèles, comme
GPT-OSS, ne prennent pas en charge la désactivation de la réflexion et peuvent tout de même utiliser des tokens de raisonnement.

Pour garder Ollama en cours d’exécution sur un Node sans le rendre disponible aux agents, définissez
ce qui suit dans la configuration utilisée par cet hôte Node :

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Si le Node utilise la commande de premier plan `openclaw node run` de la configuration
ci-dessus, arrêtez ce processus et relancez la commande. S’il utilise un service Node
installé, exécutez `openclaw node restart`.

Le Node cesse d’annoncer `ollama.models` et `ollama.chat` ; Ollama lui-même et
le fournisseur Ollama du Gateway restent inchangés. Définissez la valeur sur `true` et
redémarrez le Node pour annoncer à nouveau l’inférence locale. Une surface de commandes modifiée
peut nécessiter une approbation via `openclaw nodes pending` après la reconnexion.

Vous pouvez vérifier les mêmes commandes Node sans tour d’agent :

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

L’inférence locale au Node ne réutilise volontairement pas un
`models.providers.ollama.baseUrl` distant ou cloud. Démarrez Ollama sur le point de terminaison
de loopback standard du Node. Les commandes Node sont disponibles par défaut sur les hôtes Node
macOS, Linux et Windows et restent soumises à la politique normale d’appairage et de commandes Node.

## Vision et description d’image

Le Plugin Ollama groupé enregistre Ollama comme fournisseur de compréhension multimédia compatible image. Cela permet à OpenClaw d’acheminer les demandes explicites de description d’image et les modèles d’image par défaut configurés via des modèles de vision Ollama locaux ou hébergés.

Pour la vision locale, téléchargez un modèle qui prend en charge les images :

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

`--model` doit être une référence complète `<provider/model>`. Lorsqu’il est défini, `openclaw infer image describe` essaie d’abord ce modèle au lieu d’ignorer la description parce que le modèle prend en charge la vision native. Si l’appel au modèle échoue, OpenClaw peut continuer via les `agents.defaults.imageModel.fallbacks` configurés ; les erreurs de préparation de fichier ou d’URL échouent toujours avant les tentatives de secours.

Utilisez `infer image describe` lorsque vous voulez le flux de fournisseur de compréhension d’image d’OpenClaw, le `agents.defaults.imageModel` configuré et la forme de sortie de description d’image. Utilisez `infer model run --file` lorsque vous voulez une sonde brute de modèle multimodal avec un prompt personnalisé et une ou plusieurs images.

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

Les modèles de vision locaux lents peuvent nécessiter un délai d’expiration de compréhension d’image plus long que les modèles cloud. Ils peuvent aussi planter ou s’arrêter lorsqu’Ollama tente d’allouer tout le contexte de vision annoncé sur du matériel contraint. Définissez un délai d’expiration de capacité et limitez `num_ctx` sur l’entrée du modèle lorsque vous avez seulement besoin d’un tour normal de description d’image :

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

Ce délai d’expiration s’applique à la compréhension d’image entrante et à l’outil explicite `image` que l’agent peut appeler pendant un tour. Le `models.providers.ollama.timeoutSeconds` au niveau du fournisseur contrôle toujours la garde de requête HTTP Ollama sous-jacente pour les appels de modèle normaux.

Vérifiez en direct l’outil d’image explicite avec Ollama local à l’aide de :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Si vous définissez `models.providers.ollama.models` manuellement, marquez les modèles de vision avec la prise en charge de l’entrée image :

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rejette les demandes de description d’image pour les modèles qui ne sont pas marqués comme compatibles image. Avec la découverte implicite, OpenClaw lit cela depuis Ollama lorsque `/api/show` signale une capacité de vision.

## Configuration

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Le chemin d’activation local le plus simple passe par une variable d’environnement :

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` est défini, vous pouvez omettre `apiKey` dans l’entrée du fournisseur et OpenClaw le remplira pour les vérifications de disponibilité.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Utilisez une configuration explicite lorsque vous voulez une configuration cloud hébergée, qu’Ollama s’exécute sur un autre hôte/port, que vous voulez forcer des fenêtres de contexte ou des listes de modèles spécifiques, ou que vous voulez des définitions de modèles entièrement manuelles.

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
    Si Ollama s’exécute sur un autre hôte ou port (la configuration explicite désactive la découverte automatique, définissez donc les modèles manuellement) :

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

Utilisez-les comme points de départ et remplacez les ID de modèles par les noms exacts issus de `ollama list` ou `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Utilisez ceci quand Ollama s’exécute sur la même machine que le Gateway et que vous voulez qu’OpenClaw découvre automatiquement les modèles installés.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Ce parcours garde la configuration minimale. N’ajoutez pas de bloc `models.providers.ollama`, sauf si vous voulez définir les modèles manuellement.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    Utilisez les URL Ollama natives pour les hôtes du LAN. N’ajoutez pas `/v1`.

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

    `contextWindow` est le budget de contexte côté OpenClaw. `params.num_ctx` est envoyé à Ollama pour la requête. Gardez-les alignés lorsque votre matériel ne peut pas exécuter le contexte complet annoncé par le modèle.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Utilisez ceci quand vous n’exécutez pas de démon local et que vous voulez accéder directement aux modèles Ollama hébergés.

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
    Utilisez ceci quand un démon Ollama local ou LAN est connecté avec `ollama signin` et doit servir à la fois les modèles locaux et les modèles `:cloud`.

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
    Utilisez des ID de fournisseurs personnalisés lorsque vous avez plusieurs serveurs Ollama. Chaque fournisseur obtient son propre hôte, ses modèles, son authentification, son délai d’expiration et ses références de modèle.

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

    Quand OpenClaw envoie la requête, le préfixe du fournisseur actif est supprimé, de sorte que `ollama-large/qwen3.5:27b` arrive à Ollama sous la forme `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Certains modèles locaux peuvent répondre à des prompts simples, mais ont des difficultés avec toute la surface des outils d’agent. Commencez par limiter les outils et le contexte avant de modifier les paramètres globaux d’exécution.

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

    Utilisez `compat.supportsTools: false` uniquement lorsque le modèle ou le serveur échoue de façon fiable sur les schémas d’outils. Cela échange une partie des capacités de l’agent contre de la stabilité.
    `localModelLean` retire les outils de navigateur, Cron et messagerie de la surface directe de l’agent, et place par défaut les catalogues plus volumineux derrière des contrôles structurés de recherche d’outils, sauf lorsqu’une exécution doit conserver la sémantique de livraison directe des messages. Cela ne modifie toutefois ni le contexte d’exécution d’Ollama ni le mode de réflexion. Associez-le à `params.num_ctx` explicite et à `params.thinking: false` pour les petits modèles de réflexion de style Qwen qui bouclent ou dépensent leur budget de réponse en raisonnement masqué.

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

Les ID de fournisseurs Ollama personnalisés sont également pris en charge. Lorsqu’une référence de modèle utilise le préfixe du fournisseur actif, comme `ollama-spark/qwen3:32b`, OpenClaw supprime uniquement ce préfixe avant d’appeler Ollama, afin que le serveur reçoive `qwen3:32b`.

Pour les modèles locaux lents, privilégiez le réglage des requêtes au niveau du fournisseur avant d’augmenter le délai d’expiration de tout l’environnement d’exécution de l’agent :

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

`timeoutSeconds` s’applique à la requête HTTP du modèle, y compris l’établissement de la connexion, les en-têtes, le streaming du corps et l’abandon global du fetch protégé. `params.keep_alive` est transmis à Ollama comme `keep_alive` de niveau supérieur sur les requêtes natives `/api/chat` ; définissez-le par modèle lorsque le temps de chargement du premier tour est le goulot d’étranglement.

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

OpenClaw prend en charge **Ollama Web Search** comme fournisseur `web_search` intégré.

| Propriété   | Détail                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hôte        | Utilise votre hôte Ollama configuré (`models.providers.ollama.baseUrl` s’il est défini, sinon `http://127.0.0.1:11434`) ; `https://ollama.com` utilise directement l’API hébergée                    |
| Auth        | Sans clé pour les hôtes Ollama locaux connectés ; `OLLAMA_API_KEY` ou l’authentification de fournisseur configurée pour la recherche directe via `https://ollama.com` ou les hôtes protégés par auth |
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

Pour un démon local connecté, OpenClaw utilise le proxy `/api/experimental/web_search` du démon. Pour `https://ollama.com`, il appelle directement le point de terminaison hébergé `/api/web_search`.

<Note>
Pour la configuration complète et les détails de comportement, consultez [Ollama Web Search](/fr/tools/ollama-search).
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **L’appel d’outils n’est pas fiable en mode compatible OpenAI.** Utilisez ce mode uniquement si vous avez besoin du format OpenAI pour un proxy et que vous ne dépendez pas du comportement natif d’appel d’outils.
    </Warning>

    Si vous devez utiliser le point de terminaison compatible OpenAI à la place (par exemple derrière un proxy qui ne prend en charge que le format OpenAI), définissez explicitement `api: "openai-completions"` :

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

  <Accordion title="Context windows">
    Pour les modèles découverts automatiquement, OpenClaw utilise la fenêtre de contexte signalée par Ollama lorsqu’elle est disponible, y compris les valeurs `PARAMETER num_ctx` plus grandes provenant de Modelfiles personnalisés. Sinon, il revient à la fenêtre de contexte Ollama par défaut utilisée par OpenClaw.

    Vous pouvez définir des valeurs par défaut `contextWindow`, `contextTokens` et `maxTokens` au niveau du fournisseur pour chaque modèle sous ce fournisseur Ollama, puis les remplacer par modèle si nécessaire. `contextWindow` correspond au budget d’invite et de Compaction d’OpenClaw. Les requêtes Ollama natives laissent `options.num_ctx` non défini, sauf si vous configurez explicitement `params.num_ctx`, afin qu’Ollama puisse appliquer sa propre valeur par défaut basée sur le modèle, `OLLAMA_CONTEXT_LENGTH` ou la VRAM. Pour plafonner ou forcer le contexte d’exécution par requête d’Ollama sans reconstruire un Modelfile, définissez `params.num_ctx` ; les valeurs non valides, nulles, négatives et non finies sont ignorées. Si vous avez mis à niveau une ancienne configuration qui utilisait seulement `contextWindow` ou `maxTokens` pour forcer un contexte de requête Ollama native, exécutez `openclaw doctor --fix` pour copier ces budgets explicites de fournisseur ou de modèle dans `params.num_ctx`. L’adaptateur Ollama compatible OpenAI injecte toujours `options.num_ctx` par défaut à partir de `params.num_ctx` ou `contextWindow` configuré ; désactivez cela avec `injectNumCtxForOpenAICompat: false` si votre amont rejette `options`.

    Les entrées de modèles Ollama natifs acceptent aussi les options d’exécution Ollama courantes sous `params`, notamment `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` et `use_mmap`. OpenClaw transmet uniquement les clés de requête Ollama, afin que les paramètres d’exécution OpenClaw comme `streaming` ne soient pas divulgués à Ollama. Utilisez `params.think` ou `params.thinking` pour envoyer le `think` Ollama de premier niveau ; `false` désactive la réflexion au niveau de l’API pour les modèles de réflexion de style Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` par modèle fonctionne également. Si les deux sont configurés, l’entrée explicite de modèle du fournisseur l’emporte sur la valeur par défaut de l’agent.

  </Accordion>

  <Accordion title="Contrôle de la réflexion">
    Pour les modèles Ollama natifs, OpenClaw transmet le contrôle de la réflexion comme Ollama l’attend : `think` au premier niveau, et non `options.think`. Les modèles découverts automatiquement dont la réponse `/api/show` inclut la capacité `thinking` exposent `/think low`, `/think medium`, `/think high` et `/think max` ; les modèles sans réflexion exposent seulement `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Vous pouvez aussi définir une valeur par défaut de modèle :

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

    `params.think` ou `params.thinking` par modèle peut désactiver ou forcer la réflexion de l’API Ollama pour un modèle configuré spécifique. OpenClaw préserve ces paramètres de modèle explicites quand l’exécution active n’a que la valeur implicite par défaut `off` ; les commandes d’exécution non désactivées comme `/think medium` remplacent toujours l’exécution active.

  </Accordion>

  <Accordion title="Modèles de raisonnement">
    OpenClaw traite par défaut les modèles dont le nom contient par exemple `deepseek-r1`, `reasoning` ou `think` comme capables de raisonnement.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Aucune configuration supplémentaire n’est nécessaire. OpenClaw les marque automatiquement.

  </Accordion>

  <Accordion title="Coûts des modèles">
    Ollama est gratuit et s’exécute localement, donc tous les coûts de modèle sont définis à 0 $. Cela s’applique aux modèles découverts automatiquement comme aux modèles définis manuellement.
  </Accordion>

  <Accordion title="Embeddings de mémoire">
    Le Plugin Ollama groupé enregistre un fournisseur d’embeddings de mémoire pour la
    [recherche en mémoire](/fr/concepts/memory). Il utilise l’URL de base Ollama
    et la clé d’API configurées, appelle le point de terminaison actuel `/api/embed`
    d’Ollama, et regroupe plusieurs fragments de mémoire dans une seule requête
    `input` lorsque c’est possible.

    Lorsque `proxy.enabled=true`, les requêtes d’embedding de mémoire Ollama vers l’origine
    local loopback exacte de l’hôte dérivée du `baseUrl` configuré utilisent
    le chemin direct protégé d’OpenClaw au lieu du proxy de transfert géré. Le
    nom d’hôte configuré doit lui-même être `localhost` ou une adresse IP littérale de boucle locale ;
    les noms DNS qui se résolvent simplement vers la boucle locale utilisent toujours le chemin du proxy géré.
    Les hôtes Ollama LAN, tailnet, réseau privé et publics restent également sur le
    chemin du proxy géré. Les redirections vers un autre hôte ou port n’héritent pas de la confiance.
    Les opérateurs peuvent toujours définir le paramètre global `proxy.loopbackMode: "proxy"` pour
    envoyer le trafic de boucle locale via le proxy, ou `proxy.loopbackMode: "block"`
    pour refuser les connexions de boucle locale avant d’ouvrir une connexion ; consultez
    [Proxy géré](/fr/security/network-proxy#gateway-loopback-mode) pour l’effet
    de ce paramètre à l’échelle du processus.

    | Propriété      | Valeur               |
    | ------------- | ------------------- |
    | Modèle par défaut | `nomic-embed-text`  |
    | Auto-pull     | Oui — le modèle d’embedding est récupéré automatiquement s’il n’est pas présent localement |

    Les embeddings au moment de la requête utilisent des préfixes de récupération pour les modèles qui les exigent ou les recommandent, notamment `nomic-embed-text`, `qwen3-embedding` et `mxbai-embed-large`. Les lots de documents de mémoire restent bruts afin que les index existants ne nécessitent pas de migration de format.

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

    Pour un hôte d’embedding distant, gardez l’authentification limitée à cet hôte :

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

    Pour les requêtes natives `/api/chat`, OpenClaw transmet aussi directement à Ollama le contrôle de la réflexion : `/think off` et `openclaw agent --thinking off` envoient `think: false` au premier niveau, sauf si une valeur explicite de modèle `params.think`/`params.thinking` est configurée, tandis que `/think low|medium|high` envoie la chaîne d’effort `think` de premier niveau correspondante. `/think max` correspond à l’effort natif le plus élevé d’Ollama, `think: "high"`.

    <Tip>
    Si vous devez utiliser le point de terminaison compatible OpenAI, consultez la section « Mode compatible OpenAI hérité » ci-dessus. Le streaming et l’appel d’outils peuvent ne pas fonctionner simultanément dans ce mode.
    </Tip>

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Boucle de plantage WSL2 (redémarrages répétés)">
    Sous WSL2 avec NVIDIA/CUDA, l’installateur Linux officiel d’Ollama crée une unité systemd `ollama.service` avec `Restart=always`. Si ce service démarre automatiquement et charge un modèle appuyé par GPU pendant le démarrage de WSL2, Ollama peut épingler la mémoire de l’hôte pendant le chargement du modèle. La récupération de mémoire Hyper-V ne peut pas toujours récupérer ces pages épinglées, donc Windows peut arrêter la VM WSL2, systemd redémarre Ollama, et la boucle se répète.

    Indices courants :

    - redémarrages ou arrêts répétés de WSL2 côté Windows
    - CPU élevé dans `app.slice` ou `ollama.service` peu après le démarrage de WSL2
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

    Définissez une durée keep-alive plus courte dans l’environnement du service Ollama, ou démarrez Ollama manuellement seulement lorsque vous en avez besoin :

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
    Si votre modèle n’est pas répertorié, récupérez le modèle localement ou définissez-le explicitement dans `models.providers.ollama`.

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
    - L’hôte distant nécessite des modifications de pare-feu ou de liaison LAN côté Ollama.
    - Le modèle est présent sur le daemon de votre ordinateur portable, mais pas sur le daemon distant.

  </Accordion>

  <Accordion title="Le modèle sort du JSON d’outil sous forme de texte">
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

    Si un petit modèle local échoue toujours sur les schémas d’outils, définissez `compat.supportsTools: false` sur cette entrée de modèle et retestez.

  </Accordion>

  <Accordion title="Kimi ou GLM renvoie des symboles illisibles">
    Les réponses Kimi/GLM hébergées qui sont longues et composées de suites de symboles non linguistiques sont traitées comme une sortie fournisseur échouée plutôt que comme une réponse d’assistant réussie. Cela permet à la logique normale de nouvelle tentative, de repli ou de gestion d’erreur de prendre le relais sans persister le texte corrompu dans la session.

    Si cela se produit à répétition, capturez le nom brut du modèle, le fichier de session actuel et indiquez si l’exécution utilisait `Cloud + Local` ou `Cloud only`, puis essayez une nouvelle session et un modèle de repli :

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Le modèle local froid expire">
    Les grands modèles locaux peuvent nécessiter un long premier chargement avant que le streaming ne commence. Gardez le délai d’expiration limité au fournisseur Ollama, et demandez éventuellement à Ollama de garder le modèle chargé entre les tours :

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

    Si l’hôte lui-même est lent à accepter les connexions, `timeoutSeconds` prolonge aussi le délai d’expiration de connexion Undici protégé pour ce fournisseur.

  </Accordion>

  <Accordion title="Le modèle à grand contexte est trop lent ou manque de mémoire">
    De nombreux modèles Ollama annoncent des contextes plus grands que ce que votre matériel peut exécuter confortablement. Ollama natif utilise le contexte d’exécution par défaut propre à Ollama, sauf si vous définissez `params.num_ctx`. Limitez à la fois le budget d’OpenClaw et le contexte de requête d’Ollama lorsque vous voulez une latence prévisible jusqu’au premier token :

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

    Réduisez d’abord `contextWindow` si OpenClaw envoie une invite trop longue. Réduisez `params.num_ctx` si Ollama charge un contexte d’exécution trop grand pour la machine. Réduisez `maxTokens` si la génération dure trop longtemps.

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
  <Card title="Sélection de modèle" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
  <Card title="Recherche Web Ollama" href="/fr/tools/ollama-search" icon="magnifying-glass">
    Configuration complète et détails de comportement pour la recherche web propulsée par Ollama.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration.
  </Card>
</CardGroup>
