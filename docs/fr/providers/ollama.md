---
read_when:
    - Vous souhaitez exécuter OpenClaw avec des modèles cloud ou locaux via Ollama
    - Vous avez besoin d’aide pour installer et configurer Ollama
    - Vous souhaitez utiliser les modèles de vision Ollama pour comprendre les images
summary: Exécuter OpenClaw avec Ollama (modèles cloud et locaux)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T15:53:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw communique avec l’API native d’Ollama (`/api/chat`), et non avec le point de terminaison compatible OpenAI
`/v1`. Trois modes sont pris en charge :

| Mode            | Fonctionnement                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Cloud + local   | Un hôte Ollama accessible, servant des modèles locaux et, si vous êtes connecté, des modèles `:cloud`              |
| Cloud uniquement | `https://ollama.com` directement, sans démon local                                                                  |
| Local uniquement | Un hôte Ollama accessible, avec uniquement des modèles locaux                                                       |

Pour une configuration exclusivement cloud avec l’identifiant de fournisseur dédié `ollama-cloud`, consultez
[Ollama Cloud](/fr/providers/ollama-cloud). Utilisez des références `ollama-cloud/<model>` lorsque
vous souhaitez que le routage cloud reste distinct d’un fournisseur `ollama` local.

<Warning>
N’utilisez pas l’URL `/v1` compatible OpenAI (`http://host:11434/v1`). Elle perturbe les appels d’outils et les modèles peuvent émettre le JSON brut des appels d’outils sous forme de texte brut. Utilisez l’URL native : `baseUrl: "http://host:11434"` (sans `/v1`).
</Warning>

La clé de configuration canonique est `baseUrl`. `baseURL` est également acceptée pour
les exemples suivant le style du SDK OpenAI, mais les nouvelles configurations doivent utiliser `baseUrl`.

## Règles d’authentification

<AccordionGroup>
  <Accordion title="Hôtes locaux et du réseau local">
    Les URL Ollama de boucle locale, de réseau privé, en `.local` et utilisant un nom d’hôte seul ne nécessitent pas de véritable jeton porteur. OpenClaw utilise le marqueur `ollama-local` pour celles-ci.
  </Accordion>
  <Accordion title="Hôtes distants et Ollama Cloud">
    Les hôtes publics distants et `https://ollama.com` nécessitent un véritable identifiant d’authentification : `OLLAMA_API_KEY`, un profil d’authentification ou la valeur `apiKey` du fournisseur. Pour une utilisation hébergée directe, privilégiez le fournisseur `ollama-cloud`.
  </Accordion>
  <Accordion title="Identifiants de fournisseur personnalisés">
    Un fournisseur personnalisé avec `api: "ollama"` suit les mêmes règles. Par exemple, un fournisseur `ollama-remote` pointant vers un hôte privé du réseau local peut utiliser `apiKey: "ollama-local"` ; les sous-agents résolvent ce marqueur via le hook du fournisseur Ollama au lieu de le traiter comme un identifiant d’authentification manquant. `agents.defaults.memorySearch.provider` peut également pointer vers un identifiant de fournisseur personnalisé afin que les embeddings utilisent ce point de terminaison Ollama.
  </Accordion>
  <Accordion title="Profils d’authentification">
    `auth-profiles.json` stocke l’identifiant d’authentification associé à un identifiant de fournisseur ; placez les paramètres du point de terminaison (`baseUrl`, `api`, modèles, en-têtes, délais d’expiration) dans `models.providers.<id>`. Les anciens fichiers plats tels que `{ "ollama-windows": { "apiKey": "ollama-local" } }` ne constituent pas un format d’exécution ; `openclaw doctor --fix` les réécrit sous la forme d’un profil canonique de clé API `ollama-windows:default` avec une sauvegarde. Une valeur `baseUrl` dans cet ancien fichier est superflue et doit être déplacée vers la configuration du fournisseur.
  </Accordion>
  <Accordion title="Portée des embeddings de mémoire">
    L’authentification par jeton porteur des embeddings de mémoire Ollama est limitée à l’hôte pour lequel elle a été déclarée :

    - Une clé définie au niveau du fournisseur est envoyée uniquement à l’hôte de ce fournisseur.
    - `agents.*.memorySearch.remote.apiKey` est envoyée uniquement à son hôte distant d’embeddings.
    - Une valeur d’environnement `OLLAMA_API_KEY` seule est considérée comme suivant la convention Ollama Cloud et n’est pas envoyée par défaut aux hôtes locaux ou auto-hébergés.

  </Accordion>
</AccordionGroup>

## Prise en main

<Tabs>
  <Tab title="Intégration initiale (recommandée)">
    <Steps>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard
        ```

        Sélectionnez **Ollama**, puis choisissez un mode : **Cloud + local**, **Cloud uniquement** ou **Local uniquement**.
      </Step>
      <Step title="Sélectionner un modèle">
        `Cloud only` demande `OLLAMA_API_KEY` et suggère des valeurs cloud hébergées par défaut. `Cloud + Local` et `Local only` demandent une URL de base Ollama, découvrent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné s’il est absent. Une étiquette `:latest` installée, telle que `gemma4:latest`, est affichée une seule fois au lieu de dupliquer `gemma4`. `Cloud + Local` vérifie également si l’hôte est connecté pour l’accès au cloud.
      </Step>
      <Step title="Vérifier">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Mode non interactif :

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` et `--custom-model-id` sont facultatifs ; les omettre utilise l’hôte local par défaut et le modèle suggéré `gemma4`.

  </Tab>

  <Tab title="Configuration manuelle">
    <Steps>
      <Step title="Installer et démarrer Ollama">
        Téléchargez-le depuis [ollama.com/download](https://ollama.com/download), puis récupérez un modèle :

        ```bash
        ollama pull gemma4
        ```

        Pour un accès cloud hybride, exécutez `ollama signin` sur le même hôte.
      </Step>
      <Step title="Définir un identifiant d’authentification">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # hôte local/réseau local, toute valeur fonctionne
        export OLLAMA_API_KEY="your-real-key"   # uniquement pour https://ollama.com
        ```

        Ou dans la configuration : `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Sélectionner le modèle">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Ou dans la configuration :

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

## Modèles cloud via un hôte local

`Cloud + Local` route les modèles locaux et `:cloud` via un même hôte
Ollama accessible — il s’agit du flux hybride d’Ollama et du mode à choisir pendant la configuration
lorsque vous souhaitez utiliser les deux.

OpenClaw demande l’URL de base, découvre les modèles locaux et vérifie
l’état de `ollama signin`. Lorsque l’hôte est connecté, il suggère des valeurs hébergées par défaut
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Si
l’hôte n’est pas connecté, la configuration reste exclusivement locale jusqu’à l’exécution de `ollama signin`.

Pour un accès exclusivement cloud sans démon local, utilisez `openclaw onboard --auth-choice ollama-cloud` et consultez [Ollama Cloud](/fr/providers/ollama-cloud) — ce chemin ne nécessite ni `ollama signin` ni serveur en cours d’exécution :

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

La liste des modèles cloud affichée pendant `openclaw onboard` est obtenue dynamiquement depuis
`https://ollama.com/api/tags`, avec une limite de 500 entrées, afin que le sélecteur reflète
le catalogue hébergé actuel. Si `ollama.com` est inaccessible ou ne renvoie aucun
modèle au moment de la configuration, OpenClaw utilise sa liste de suggestions codée en dur afin que
l’intégration initiale puisse tout de même s’achever.

## Découverte des modèles (fournisseur implicite)

Lorsque `OLLAMA_API_KEY` (ou un profil d’authentification) est défini et que ni
`models.providers.ollama` ni aucun autre fournisseur personnalisé avec `api: "ollama"` n’est
défini, OpenClaw découvre les modèles depuis `http://127.0.0.1:11434` :

| Comportement                | Détail                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requête du catalogue        | `/api/tags`                                                                                                                                                                                                                                                                                                                                                                     |
| Détection des fonctionnalités | Une lecture au mieux de `/api/show` récupère `contextWindow`, les paramètres `num_ctx` du Modelfile et les fonctionnalités (vision/outils/raisonnement)                                                                                                                                                                                                                          |
| Modèles de vision           | Une fonctionnalité `vision` provenant de `/api/show` indique que le modèle accepte les images (`input: ["text", "image"]`)                                                                                                                                                                                                                                                       |
| Détection du raisonnement   | Utilise la fonctionnalité `thinking` de `/api/show` lorsqu’elle est disponible ; sinon, utilise une heuristique basée sur le nom (`r1`, `reason`, `reasoning`, `think`) lorsqu’Ollama omet les fonctionnalités. `glm-5.2:cloud` et `deepseek-v4-flash\|pro:cloud` sont toujours considérés comme capables de raisonnement, quelles que soient les fonctionnalités signalées. |
| Limites de jetons           | `maxTokens` utilise par défaut la limite maximale de jetons Ollama d’OpenClaw                                                                                                                                                                                                                                                                                                    |
| Coûts                       | Tous les coûts sont de `0`                                                                                                                                                                                                                                                                                                                                                      |

```bash
ollama list
openclaw models list
```

Définir `models.providers.ollama` avec un tableau `models` explicite, ou un
fournisseur personnalisé avec `api: "ollama"` et une valeur `baseUrl` hors boucle locale, désactive
la découverte automatique ; les modèles doivent alors être définis manuellement (voir
[Configuration](#configuration)). Une entrée `models.providers.ollama` pointant vers
l’hôte `https://ollama.com` ignore également la découverte, car les modèles Ollama Cloud
sont gérés par le fournisseur. Les fournisseurs personnalisés en boucle locale tels que
`http://127.0.0.2:11434` sont toujours considérés comme locaux et conservent la découverte automatique.

Vous pouvez utiliser une référence complète telle que `ollama/<pulled-model>:latest` sans
entrée `models.json` écrite manuellement ; OpenClaw la résout dynamiquement. Pour les hôtes
connectés, la sélection d’une référence `ollama/<model>:cloud` non répertoriée valide ce modèle précis
avec `/api/show` et l’ajoute au catalogue d’exécution uniquement si Ollama
confirme les métadonnées — les fautes de frappe provoquent toujours une erreur de modèle inconnu.

### Tests rapides

Pour une vérification textuelle ciblée qui ignore l’ensemble complet des outils de l’agent :

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Répondez exactement : pong" \
    --json
```

Ajoutez `--file` avec une image pour effectuer une vérification légère d’un modèle de vision (accepte PNG/JPEG/WebP ;
les fichiers qui ne sont pas des images sont rejetés avant l’appel à Ollama — utilisez
`openclaw infer audio transcribe` pour l’audio) :

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Décrivez cette image en une phrase." \
    --file ./photo.jpg \
    --json
```

Aucun des deux chemins ne charge les outils de discussion, la mémoire ou le contexte de session. Si l’opération réussit
alors que les réponses normales de l’agent échouent, le problème vient probablement de la capacité du modèle
à gérer les outils ou les agents, et non du point de terminaison.

La sélection d’un modèle avec `/model ollama/<model>` constitue un choix explicite de l’utilisateur : si la
valeur `baseUrl` configurée est inaccessible, la réponse suivante échoue avec l’erreur du fournisseur
au lieu de revenir silencieusement à un autre modèle configuré.

Les tâches Cron isolées ajoutent une vérification de sécurité locale avant de démarrer le tour de l’agent :
si le modèle sélectionné correspond à un fournisseur Ollama local, de réseau privé ou en `.local`
et que `/api/tags` est inaccessible, OpenClaw enregistre cette exécution comme
`skipped`, avec le modèle dans le texte de l’erreur. Cette vérification du point de terminaison est mise en cache pendant
5 minutes par hôte, afin que les tâches Cron répétées ciblant un démon arrêté ne lancent pas toutes
des requêtes vouées à l’échec.

Vérification en conditions réelles :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Pour Ollama Cloud, dirigez le même test en conditions réelles vers le point de terminaison hébergé (les
embeddings sont ignorés par défaut ; forcez-les avec `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, car une
clé cloud peut ne pas autoriser `/api/embed`) :

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Pour ajouter un modèle, téléchargez-le ; il sera découvert automatiquement :

```bash
ollama pull mistral
```

## Inférence locale au Node

Les agents peuvent déléguer une tâche courte à un modèle Ollama sur un ordinateur de bureau ou
un Node serveur appairé. Le prompt et la réponse transitent par la connexion authentifiée
Gateway/Node existante ; la requête s'exécute sur le point de terminaison Ollama en boucle locale
du Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Démarrer Ollama sur le Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Connecter l’hôte du Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Approuvez l’appareil et ses commandes de Node sur l’hôte du Gateway, puis vérifiez :

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Une première connexion, ou une mise à niveau ajoutant des commandes Ollama, peut déclencher
    l’approbation des commandes du Node. Si le Node se connecte sans annoncer
    `ollama.models` et `ollama.chat`, vérifiez de nouveau `openclaw nodes pending`.

  </Step>
  <Step title="L’utiliser depuis un agent">
    Le Plugin Ollama intégré expose l’outil `node_inference`. Les agents appellent
    d’abord `action: "discover"`, puis `action: "run"` avec un Node et un modèle issus
    de ce résultat (`run` peut omettre le Node lorsqu’exactement un Node compatible est
    connecté). Par exemple : « Découvrez les modèles Ollama sur mes Nodes, puis utilisez
    le modèle chargé le plus rapide pour résumer ce texte. »
  </Step>
</Steps>

La découverte lit `/api/tags`, vérifie les capacités avec `/api/show` et utilise
`/api/ps` lorsqu’il est disponible afin de classer en premier les modèles déjà chargés. Elle renvoie uniquement
les modèles locaux qu’Ollama indique comme compatibles avec le chat (capacité `completion`) —
les entrées Ollama Cloud et les modèles réservés aux embeddings sont exclus. Chaque exécution désactive
le raisonnement du modèle et limite par défaut la sortie à 512 tokens (plafond strict de 8192), sauf si
l’appel d’outil demande une autre valeur `maxTokens` ; certains modèles (par exemple GPT-OSS)
ne permettent pas de désactiver le raisonnement et peuvent tout de même émettre des tokens de raisonnement.

Pour maintenir Ollama en fonctionnement sur un Node sans l’exposer aux agents :

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Redémarrez le Node (`openclaw node restart`, ou arrêtez puis relancez `openclaw node run`
pour une session au premier plan). Le Node cesse d’annoncer `ollama.models` et
`ollama.chat` ; Ollama lui-même et le fournisseur Ollama du Gateway ne sont pas affectés.
Rétablissez la valeur à `true` et redémarrez pour réactiver cette fonctionnalité ; après la reconnexion, une surface
de commandes modifiée peut nécessiter une nouvelle approbation via `openclaw nodes pending`.

Vérifiez directement les commandes du Node, sans tour d’agent :

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

`--invoke-timeout` limite la durée dont dispose le Node pour exécuter la commande ;
`--timeout` limite l’appel global au Gateway et doit être supérieur.

L’inférence locale au Node utilise toujours le propre point de terminaison en boucle locale du Node — elle ne
réutilise pas un `models.providers.ollama.baseUrl` distant/cloud configuré. Les
commandes du Node sont disponibles par défaut sur les hôtes Node macOS, Linux et Windows
et restent soumises aux règles normales d’appairage et de commandes des Nodes.

## Vision et description d’images

Le Plugin Ollama intégré enregistre Ollama comme fournisseur de compréhension
multimédia compatible avec les images. OpenClaw peut ainsi acheminer les demandes explicites de description
d’images et les modèles d’image configurés par défaut vers des modèles de vision Ollama
locaux ou hébergés.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` doit être une référence `<provider/model>` complète ; lorsqu’il est défini, `infer image
describe` essaie d’abord ce modèle au lieu d’ignorer la description pour les modèles
qui prennent déjà en charge nativement la vision. Si l’appel échoue, OpenClaw peut poursuivre
avec `agents.defaults.imageModel.fallbacks` ; les erreurs de préparation de fichier/URL
échouent avant toute tentative de repli. Utilisez `infer image describe` pour le
flux de compréhension d’images d’OpenClaw et le modèle `imageModel` configuré ; utilisez `infer model run
--file` pour une sonde multimodale brute avec un prompt personnalisé.

Pour faire d’Ollama le fournisseur de compréhension d’images par défaut pour les médias entrants :

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

Privilégiez la référence complète `ollama/<model>`. Une référence `imageModel` sans fournisseur, telle que
`qwen2.5vl:7b`, n’est normalisée en `ollama/qwen2.5vl:7b` que lorsque ce modèle exact
figure sous `models.providers.ollama.models` avec
`input: ["text", "image"]` et qu’aucun autre fournisseur d’images configuré n’expose le
même identifiant sans fournisseur ; sinon, utilisez explicitement le préfixe du fournisseur.

Les modèles de vision locaux lents peuvent nécessiter un délai d’expiration de compréhension d’images plus long que
les modèles cloud, et peuvent planter sur du matériel aux ressources limitées si Ollama tente
d’allouer la totalité du contexte de vision annoncé par le modèle. Définissez un délai d’expiration de
capacité et plafonnez `num_ctx` :

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

Ce délai d’expiration s’applique à la compréhension des images entrantes et à l’outil explicite
`image`. `models.providers.ollama.timeoutSeconds` continue de contrôler la
limite de la requête HTTP Ollama sous-jacente pour les appels de modèle normaux.

Vérification en conditions réelles :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Si vous définissez manuellement `models.providers.ollama.models`, marquez explicitement
les modèles de vision :

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rejette les demandes de description d’images pour les modèles qui ne sont pas marqués
comme compatibles avec les images. Avec la découverte implicite, cette information provient de la capacité de vision
de `/api/show`.

## Configuration

<Tabs>
  <Tab title="Basique (découverte implicite)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` est défini, vous pouvez omettre `apiKey` dans l’entrée du fournisseur ; OpenClaw le renseigne pour les vérifications de disponibilité.
    </Tip>

  </Tab>

  <Tab title="Explicite (modèles manuels)">
    Utilisez une configuration explicite pour une installation cloud hébergée, un hôte/port non standard, des
    fenêtres de contexte imposées ou des listes de modèles entièrement manuelles :

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
    Une configuration explicite désactive la découverte automatique ; les modèles doivent donc être répertoriés :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Pas de /v1 - URL de l’API Ollama native
            api: "ollama", // Explicite : garantit le comportement natif d’appel d’outils
            timeoutSeconds: 300, // Facultatif : délai de connexion/streaming plus long pour les modèles locaux à froid
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Facultatif : maintient le modèle chargé entre les tours
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    N’ajoutez pas `/v1`. Ce chemin sélectionne le mode compatible avec OpenAI, dans lequel l’appel d’outils n’est pas fiable.
    </Warning>

  </Tab>
</Tabs>

## Recettes courantes

Remplacez les identifiants de modèles par les noms exacts provenant de `ollama list` ou
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Modèle local avec découverte automatique">
    Ollama sur la même machine que le Gateway, découvert automatiquement :

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    N’ajoutez pas de bloc `models.providers.ollama`, sauf si vous avez besoin de modèles manuels.

  </Accordion>

  <Accordion title="Hôte Ollama sur le réseau local avec modèles manuels">
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

    `contextWindow` est le budget de contexte d’OpenClaw ; `params.num_ctx` est envoyé à
    Ollama. Gardez-les alignés lorsque le matériel ne peut pas exécuter la totalité du
    contexte annoncé par le modèle.

  </Accordion>

  <Accordion title="Ollama Cloud uniquement">
    Aucun démon local, modèles hébergés directement :

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

    Pour utiliser l’identifiant de fournisseur dédié `ollama-cloud` à la place de cette structure, consultez
    [Ollama Cloud](/fr/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Cloud et local via un démon authentifié">
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
    Utilisez des identifiants de fournisseur personnalisés lorsque vous exécutez plusieurs serveurs Ollama ; chacun dispose de
    son propre hôte, de ses propres modèles, de sa propre authentification et de son propre délai d’expiration.

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

    OpenClaw supprime le préfixe du fournisseur actif (avec repli sur un préfixe
    `ollama/` simple) avant d’appeler Ollama, de sorte que `ollama-large/qwen3.5:27b`
    parvient à Ollama sous la forme `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Profil allégé pour modèle local">
    Certains modèles locaux traitent correctement les requêtes simples, mais rencontrent des difficultés avec l’ensemble complet
    des outils de l’agent. Limitez les outils et le contexte avant de modifier les paramètres
    globaux de l’environnement d’exécution :

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

    Utilisez `compat.supportsTools: false` uniquement lorsque le modèle ou le serveur
    échoue systématiquement avec les schémas d’outils — cette option sacrifie des capacités de l’agent au profit de la stabilité.
    `localModelLean` retire de la surface directe de l’agent les outils lourds liés au navigateur, à Cron, aux messages, à la génération
    de médias, à la voix et aux PDF, sauf s’ils sont explicitement requis,
    et place les catalogues plus volumineux derrière la recherche d’outils. Il ne modifie ni le
    contexte d’exécution ni le mode de réflexion d’Ollama. Associez-le à `params.num_ctx` et
    à `params.thinking: false` pour les petits modèles de réflexion de type Qwen qui bouclent ou
    consacrent leur budget au raisonnement masqué.

  </Accordion>
</AccordionGroup>

### Sélection du modèle

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

Les identifiants de fournisseur personnalisés fonctionnent de la même manière : pour une référence utilisant le préfixe du fournisseur
actif, telle que `ollama-spark/qwen3:32b`, OpenClaw supprime ce préfixe avant
d’appeler Ollama et envoie `qwen3:32b`.

Pour les modèles locaux lents, privilégiez un réglage propre au fournisseur avant d’augmenter le délai d’expiration de l’ensemble
de l’environnement d’exécution de l’agent :

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

`timeoutSeconds` couvre la requête HTTP du modèle : établissement de la connexion, en-têtes,
diffusion du corps et interruption totale de la récupération protégée. `params.keep_alive` est
transmis comme paramètre `keep_alive` de premier niveau pour les requêtes natives `/api/chat` ; définissez-le pour chaque
modèle lorsque le temps de chargement du premier tour constitue le goulot d’étranglement.

### Vérification rapide

```bash
# Démon Ollama visible depuis cette machine
curl http://127.0.0.1:11434/api/tags

# Catalogue OpenClaw et modèle sélectionné
openclaw models list --provider ollama
openclaw models status

# Test rapide direct du modèle
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Répondez exactement : ok"
```

Pour les hôtes distants, remplacez `127.0.0.1` par l’hôte de `baseUrl`. Si `curl`
fonctionne, mais pas OpenClaw, vérifiez si le Gateway s’exécute sur une autre
machine, dans un autre conteneur ou sous un autre compte de service.

## Recherche Web Ollama

OpenClaw intègre **Recherche Web Ollama** comme fournisseur `web_search`.

| Propriété   | Détail                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hôte        | `models.providers.ollama.baseUrl` lorsqu’il est défini, sinon `http://127.0.0.1:11434` ; `https://ollama.com` utilise directement l’API hébergée            |
| Authentification | Sans clé pour un hôte local connecté ; `OLLAMA_API_KEY` ou l’authentification configurée du fournisseur pour une recherche directe sur `https://ollama.com` ou pour les hôtes protégés par authentification |
| Prérequis   | Les hôtes locaux/autohébergés doivent être en cours d’exécution et connectés avec `ollama signin` ; la recherche hébergée directe nécessite `baseUrl: "https://ollama.com"` ainsi qu’une véritable clé d’API |

Choisissez-le pendant `openclaw onboard` ou `openclaw configure --section web`, ou définissez :

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

Pour effectuer une recherche hébergée directe via Ollama Cloud :

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

Pour un hôte autohébergé, OpenClaw essaie d’abord le proxy local `/api/experimental/web_search`,
puis se replie sur le chemin hébergé `/api/web_search` du même hôte ; un
démon local connecté répond normalement par l’intermédiaire du proxy local. Les appels directs à
`https://ollama.com` utilisent toujours le point de terminaison hébergé `/api/web_search`.

<Note>
Pour la configuration et le comportement complets, consultez [Recherche Web Ollama](/fr/tools/ollama-search).
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode hérité compatible avec OpenAI">
    <Warning>
    **L’appel d’outils n’est pas fiable dans ce mode.** Utilisez-le uniquement lorsqu’un proxy exige le format OpenAI et que vous ne dépendez pas de l’appel d’outils natif.
    </Warning>

    Définissez explicitement `api: "openai-completions"` pour un proxy derrière
    `/v1/chat/completions` :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // valeur par défaut : true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Ce mode peut ne pas prendre en charge simultanément la diffusion en continu et l’appel d’outils ; vous
    devrez peut-être définir `params: { streaming: false }` sur le modèle.

    OpenClaw injecte `options.num_ctx` par défaut dans ce mode afin qu’Ollama ne
    se replie pas silencieusement sur un contexte de 4096 jetons. Si votre proxy rejette
    les champs `options` inconnus, désactivez cette option :

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
    Pour les modèles détectés automatiquement, OpenClaw utilise la fenêtre de contexte indiquée par
    `/api/show`, notamment les valeurs `PARAMETER num_ctx` plus élevées provenant des
    Modelfiles personnalisés ; sinon, il se replie sur la fenêtre de contexte Ollama par défaut
    d’OpenClaw.

    Les paramètres `contextWindow`, `contextTokens` et `maxTokens` au niveau du fournisseur définissent
    les valeurs par défaut de chaque modèle de ce fournisseur et peuvent être remplacés pour chaque
    modèle. `contextWindow` représente le budget de requête/Compaction propre à OpenClaw. Les requêtes natives
    `/api/chat` laissent `options.num_ctx` non défini, sauf si vous définissez
    explicitement `params.num_ctx` ; Ollama applique alors la valeur par défaut de son propre modèle,
    de `OLLAMA_CONTEXT_LENGTH` ou basée sur la VRAM ; les valeurs `params.num_ctx` non valides, nulles, négatives
    ou non finies sont ignorées. Si une ancienne configuration utilisait
    uniquement `contextWindow`/`maxTokens` pour imposer le contexte des requêtes natives, exécutez
    `openclaw doctor --fix` afin de copier ces valeurs dans `params.num_ctx`. L’adaptateur
    compatible avec OpenAI injecte toujours `options.num_ctx` par défaut à partir de
    `params.num_ctx` ou `contextWindow` configuré ; désactivez ce comportement avec
    `injectNumCtxForOpenAICompat: false` si le service en amont rejette `options`.

    Les entrées de modèles natifs acceptent également les options d’exécution Ollama courantes sous
    `params`, transmises comme `options` natives de `/api/chat` : `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` et `num_thread`.
    Quelques clés (`format`, `keep_alive`, `truncate`, `shift`) sont transmises comme
    champs de requête de premier niveau plutôt que dans des `options` imbriquées. OpenClaw ne
    transmet que ces clés de requête Ollama ; les paramètres propres à l’environnement d’exécution, tels que
    `streaming`, ne sont donc jamais envoyés à Ollama. Utilisez `params.think` (ou
    `params.thinking`) pour définir `think` au premier niveau ; `false` désactive la
    réflexion au niveau de l’API pour les modèles de réflexion de type Qwen.

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

    Le paramètre `agents.defaults.models["ollama/<model>"].params.num_ctx` propre à chaque modèle
    fonctionne également ; l’entrée explicite du modèle chez le fournisseur prévaut si les deux sont définis.

  </Accordion>

  <Accordion title="Contrôle de la réflexion">
    OpenClaw transmet la réflexion comme Ollama l’attend : via `think` au premier niveau, et non
    `options.think`. Les modèles détectés automatiquement dont `/api/show` signale une
    capacité `thinking` proposent `/think low`, `/think medium`, `/think high`
    et `/think max` ; les modèles sans réflexion ne proposent que `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Vous pouvez également définir une valeur par défaut pour le modèle :

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

    Les valeurs `params.think`/`params.thinking` propres à chaque modèle peuvent désactiver ou forcer le raisonnement de l’API pour un modèle spécifique. OpenClaw conserve cette configuration explicite lorsque l’exécution active ne dispose que de la valeur par défaut implicite `off` ; une commande d’exécution autre que « désactivé », telle que `/think medium`, reste prioritaire. Une demande de raisonnement activée n’est jamais envoyée à un modèle explicitement marqué `reasoning: false` ; une demande `think: false` est toujours envoyée, quoi qu’il arrive.

  </Accordion>

  <Accordion title="Modèles de raisonnement">
    Les modèles nommés `deepseek-r1`, `reasoning`, `reason` ou `think` sont considérés
    par défaut comme capables de raisonnement — aucune configuration supplémentaire n’est nécessaire :

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Coûts des modèles">
    Ollama s’exécute localement et est gratuit. Les coûts de tous les modèles sont donc de `0`,
    qu’ils soient détectés automatiquement ou définis manuellement.
  </Accordion>

  <Accordion title="Embeddings de mémoire">
    Le plugin Ollama intégré enregistre un fournisseur d’embeddings de mémoire pour la
    [recherche en mémoire](/fr/concepts/memory). Il utilise l’URL de base Ollama
    et la clé d’API configurées, appelle `/api/embed` et regroupe, lorsque cela est possible,
    plusieurs fragments de mémoire dans une seule requête `input`.

    Lorsque `proxy.enabled=true`, les requêtes d’embedding vers l’origine de bouclage locale exacte dérivée du `baseUrl` configuré utilisent le chemin direct protégé d’OpenClaw plutôt que le proxy de transfert géré. Le nom d’hôte configuré doit lui-même être `localhost` ou un littéral d’adresse IP de bouclage — les noms DNS qui se résolvent simplement vers une adresse de bouclage utilisent toujours le chemin du proxy géré. Les hôtes Ollama du réseau local, du tailnet, d’un réseau privé ou public restent toujours sur le chemin du proxy géré, et les redirections vers un autre hôte/port n’héritent pas de cette confiance. `proxy.loopbackMode: "proxy"` achemine malgré tout le trafic de bouclage via le proxy ; `proxy.loopbackMode: "block"` le refuse avant la connexion — voir [Proxy géré](/fr/security/network-proxy#gateway-loopback-mode).

    | Propriété | Valeur |
    | --- | --- |
    | Modèle par défaut | `nomic-embed-text` |
    | Téléchargement automatique | Oui, s’il n’est pas présent localement |
    | Concurrence en ligne par défaut | 1 (la valeur par défaut est plus élevée pour les autres fournisseurs ; augmentez-la avec `nonBatchConcurrency` si l’hôte peut la supporter) |

    Les embeddings au moment de la requête utilisent des préfixes de recherche pour les modèles qui les exigent ou les recommandent : `nomic-embed-text`, `qwen3-embedding` et `mxbai-embed-large`. Les lots de documents restent bruts, de sorte que les index existants ne nécessitent aucune migration de format.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
    ```
    ```json5
            provider: "ollama",
            remote: {
    ```
    ```json5
              // Valeur par défaut pour Ollama. Augmentez-la sur les hôtes plus puissants si la réindexation est trop lente.
    ```
    ```json5
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```
    Pour un hôte distant de génération d’embeddings, limitez l’authentification à cet hôte :

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

  <Accordion title="Streaming configuration">
    Ollama utilise par défaut l’**API native** (`/api/chat`), qui prend en charge
    simultanément la diffusion en continu et l’appel d’outils, sans configuration particulière.

    Pour les requêtes natives, le contrôle du raisonnement est transmis directement : `/think off`
    et `openclaw agent --thinking off` envoient le paramètre de premier niveau `think: false`, sauf si
    un paramètre explicite `params.think`/`params.thinking` est configuré ; `/think
    low|medium|high` envoie la chaîne d’effort correspondante ; `/think max` correspond au
    niveau d’effort maximal d’Ollama, `think: "high"`.

    <Tip>
    Pour utiliser plutôt le point de terminaison compatible avec OpenAI, consultez « Ancien mode compatible avec OpenAI » ci-dessus — la diffusion en continu et l’appel d’outils peuvent ne pas fonctionner conjointement dans ce mode.
    </Tip>

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Boucle de plantage de WSL2 (redémarrages répétés)">
    Sous WSL2 avec NVIDIA/CUDA, le programme d’installation Linux officiel d’Ollama crée une
    unité systemd `ollama.service` avec `Restart=always`. Si ce service
    démarre automatiquement et charge un modèle utilisant le GPU pendant le démarrage de WSL2, Ollama peut monopoliser
    la mémoire de l’hôte pendant le chargement ; la récupération de mémoire d’Hyper-V ne peut pas toujours récupérer
    ces pages. Windows peut alors arrêter la machine virtuelle WSL2, systemd redémarre
    Ollama et la boucle se répète.

    Indices : redémarrages/arrêts répétés de WSL2, utilisation élevée du processeur dans `app.slice` ou
    `ollama.service` juste après le démarrage de WSL2, et signal SIGTERM envoyé par systemd plutôt
    que par le mécanisme OOM killer de Linux.

    OpenClaw consigne un avertissement au démarrage lorsqu’il détecte WSL2, `ollama.service`
    activé avec `Restart=always` et des marqueurs CUDA visibles.

    Mesure d’atténuation :

    ```bash
    sudo systemctl disable ollama
    ```

    Côté Windows, ajoutez ce qui suit à `%USERPROFILE%\.wslconfig`, puis exécutez
    `wsl --shutdown` :

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Vous pouvez également raccourcir la durée de maintien en activité ou démarrer Ollama manuellement uniquement lorsque cela est nécessaire :

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consultez [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama non détecté">
    Vérifiez qu’Ollama est en cours d’exécution, que `OLLAMA_API_KEY` (ou un profil d’authentification) est défini
    et que `models.providers.ollama` n’est **pas** défini explicitement :

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Aucun modèle disponible">
    Téléchargez le modèle localement ou définissez-le explicitement dans
    `models.providers.ollama` :

    ```bash
    ollama list  # Voir les modèles installés
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Ou un autre modèle
    ```

  </Accordion>

  <Accordion title="Connexion refusée">
    ```bash
    # Vérifier si Ollama est en cours d'exécution
    ps aux | grep ollama

    # Ou redémarrer Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="L'hôte distant fonctionne avec curl, mais pas avec OpenClaw">
    Effectuez la vérification depuis la même machine et le même environnement d'exécution que le Gateway :

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causes courantes :

    - `baseUrl` pointe vers `localhost`, mais le Gateway s'exécute dans Docker ou sur un autre hôte.
    - L'URL utilise `/v1`, ce qui sélectionne le comportement compatible avec OpenAI au lieu du mode Ollama natif.
    - L'hôte distant nécessite de modifier le pare-feu ou la liaison au réseau local.
    - Le modèle se trouve dans le démon de votre ordinateur portable, mais pas dans celui de l'hôte distant.

  </Accordion>

  <Accordion title="Le modèle produit le JSON des outils sous forme de texte">
    En général, le fournisseur est en mode compatible avec OpenAI, ou le modèle ne peut pas
    gérer les schémas d'outils. Privilégiez le mode natif :

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

    Si un petit modèle local échoue encore avec les schémas d'outils, définissez
    `compat.supportsTools: false` dans l'entrée de ce modèle et refaites un test.

  </Accordion>

  <Accordion title="Kimi ou GLM renvoie des symboles illisibles">
    Les réponses hébergées de Kimi/GLM qui consistent en de longues suites de symboles
    non linguistiques sont traitées comme un appel fournisseur ayant échoué plutôt que comme
    une réponse réussie. La gestion normale des nouvelles tentatives, des solutions de repli
    et des erreurs prend ainsi le relais, au lieu de conserver du texte corrompu dans la session.

    Si le problème se reproduit, relevez le nom du modèle, le fichier de session actuel et
    si l'exécution a utilisé `Cloud + Local` ou `Cloud only`, puis essayez une nouvelle
    session et un modèle de repli :

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Réponds exactement : ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Le modèle local à froid dépasse le délai d'attente">
    Le premier chargement des grands modèles locaux peut être long. Limitez le délai d'attente au
    fournisseur Ollama et, si vous le souhaitez, maintenez le modèle chargé entre les interactions :

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

    Si l'hôte lui-même met du temps à accepter les connexions, `timeoutSeconds`
    prolonge également le délai d'attente de connexion protégé pour ce fournisseur.

  </Accordion>

  <Accordion title="Le modèle à grand contexte est trop lent ou manque de mémoire">
    De nombreux modèles annoncent des contextes plus grands que ceux que votre matériel peut gérer
    confortablement. Ollama natif utilise la valeur par défaut de son propre environnement d'exécution, sauf si
    `params.num_ctx` est défini. Limitez à la fois le budget d'OpenClaw et le contexte de requête
    d'Ollama pour obtenir une latence prévisible avant le premier token :

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

    Réduisez `contextWindow` si OpenClaw envoie une invite trop volumineuse. Réduisez
    `params.num_ctx` si le contexte d'exécution d'Ollama est trop grand pour la machine.
    Réduisez `maxTokens` si la génération dure trop longtemps.

  </Accordion>
</AccordionGroup>

<Note>
Pour obtenir davantage d'aide : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/fr/providers/ollama-cloud" icon="cloud">
    Configuration exclusivement dans le cloud avec le fournisseur `ollama-cloud` dédié.
  </Card>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Présentation de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Sélection des modèles" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer des modèles.
  </Card>
  <Card title="Recherche web avec Ollama" href="/fr/tools/ollama-search" icon="magnifying-glass">
    Détails complets sur la configuration et le comportement de la recherche web alimentée par Ollama.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration.
  </Card>
</CardGroup>
