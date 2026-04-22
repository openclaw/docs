---
read_when:
    - Vous voulez exécuter OpenClaw avec des modèles cloud ou locaux via Ollama
    - Vous avez besoin d’un guide de configuration et de paramétrage pour Ollama
    - Vous voulez des modèles de vision Ollama pour la compréhension d’image
summary: Exécuter OpenClaw avec Ollama (modèles cloud et locaux)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw s’intègre à l’API native d’Ollama (`/api/chat`) pour les modèles cloud hébergés et les serveurs Ollama locaux/autohébergés. Vous pouvez utiliser Ollama dans trois modes : `Cloud + Local` via un hôte Ollama accessible, `Cloud only` contre `https://ollama.com`, ou `Local only` via un hôte Ollama accessible.

<Warning>
**Utilisateurs d’Ollama distant** : n’utilisez pas l’URL compatible OpenAI `/v1` (`http://host:11434/v1`) avec OpenClaw. Cela casse le tool calling et les modèles peuvent produire du JSON d’outil brut en texte brut. Utilisez à la place l’URL de l’API native d’Ollama : `baseUrl: "http://host:11434"` (sans `/v1`).
</Warning>

## Prise en main

Choisissez votre méthode de configuration et votre mode préférés.

<Tabs>
  <Tab title="Onboarding (recommandé)">
    **Idéal pour :** le chemin le plus rapide vers une configuration Ollama cloud ou locale fonctionnelle.

    <Steps>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard
        ```

        Sélectionnez **Ollama** dans la liste des providers.
      </Step>
      <Step title="Choisir votre mode">
        - **Cloud + Local** — hôte Ollama local plus modèles cloud routés via cet hôte
        - **Cloud only** — modèles Ollama hébergés via `https://ollama.com`
        - **Local only** — modèles locaux uniquement
      </Step>
      <Step title="Sélectionner un modèle">
        `Cloud only` demande `OLLAMA_API_KEY` et suggère les valeurs cloud hébergées par défaut. `Cloud + Local` et `Local only` demandent une URL de base Ollama, découvrent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné s’il n’est pas encore disponible. `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
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

    Vous pouvez aussi préciser une URL de base ou un modèle personnalisé :

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuration manuelle">
    **Idéal pour :** un contrôle total sur la configuration cloud ou locale.

    <Steps>
      <Step title="Choisir cloud ou local">
        - **Cloud + Local** : installez Ollama, connectez-vous avec `ollama signin`, et routez les requêtes cloud via cet hôte
        - **Cloud only** : utilisez `https://ollama.com` avec un `OLLAMA_API_KEY`
        - **Local only** : installez Ollama depuis [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Télécharger un modèle local (local uniquement)">
        ```bash
        ollama pull gemma4
        # ou
        ollama pull gpt-oss:20b
        # ou
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Activer Ollama pour OpenClaw">
        Pour `Cloud only`, utilisez votre vrai `OLLAMA_API_KEY`. Pour les configurations adossées à un hôte, n’importe quelle valeur factice fonctionne :

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Ou configurer dans votre fichier de configuration
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
    `Cloud + Local` utilise un hôte Ollama accessible comme point de contrôle pour les modèles locaux et cloud. C’est le flux hybride recommandé par Ollama.

    Utilisez **Cloud + Local** pendant la configuration. OpenClaw demande l’URL de base Ollama, découvre les modèles locaux depuis cet hôte, et vérifie si l’hôte est connecté pour l’accès cloud avec `ollama signin`. Lorsque l’hôte est connecté, OpenClaw suggère aussi des valeurs cloud hébergées par défaut comme `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, et `glm-5.1:cloud`.

    Si l’hôte n’est pas encore connecté, OpenClaw garde la configuration en local-only jusqu’à ce que vous exécutiez `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` s’exécute contre l’API hébergée d’Ollama à `https://ollama.com`.

    Utilisez **Cloud only** pendant la configuration. OpenClaw demande `OLLAMA_API_KEY`, définit `baseUrl: "https://ollama.com"`, et initialise la liste des modèles cloud hébergés. Ce chemin **ne** nécessite **pas** de serveur Ollama local ni `ollama signin`.

    La liste des modèles cloud affichée pendant `openclaw onboard` est remplie en direct depuis `https://ollama.com/api/tags`, avec une limite de 500 entrées, afin que le sélecteur reflète le catalogue hébergé actuel plutôt qu’une liste statique. Si `ollama.com` est inaccessible ou ne renvoie aucun modèle au moment de la configuration, OpenClaw revient aux suggestions codées en dur précédentes afin que l’onboarding puisse quand même se terminer.

  </Tab>

  <Tab title="Local only">
    En mode local-only, OpenClaw découvre les modèles depuis l’instance Ollama configurée. Ce chemin est destiné aux serveurs Ollama locaux ou autohébergés.

    OpenClaw suggère actuellement `gemma4` comme valeur locale par défaut.

  </Tab>
</Tabs>

## Découverte de modèle (provider implicite)

Lorsque vous définissez `OLLAMA_API_KEY` (ou un profil d’auth) et que vous **ne** définissez **pas** `models.providers.ollama`, OpenClaw découvre les modèles à partir de l’instance Ollama locale sur `http://127.0.0.1:11434`.

| Comportement | Détail |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requête de catalogue | Interroge `/api/tags` |
| Détection des capacités | Utilise des recherches `/api/show` au mieux pour lire `contextWindow` et détecter les capacités (y compris la vision) |
| Modèles de vision | Les modèles avec une capacité `vision` signalée par `/api/show` sont marqués comme compatibles image (`input: ["text", "image"]`), afin qu’OpenClaw injecte automatiquement les images dans le prompt |
| Détection du raisonnement | Marque `reasoning` avec une heuristique basée sur le nom du modèle (`r1`, `reasoning`, `think`) |
| Limites de tokens | Définit `maxTokens` sur la limite maximale de tokens Ollama par défaut utilisée par OpenClaw |
| Coûts | Définit tous les coûts à `0` |

Cela évite les entrées de modèle manuelles tout en gardant le catalogue aligné sur l’instance Ollama locale.

```bash
# Voir quels modèles sont disponibles
ollama list
openclaw models list
```

Pour ajouter un nouveau modèle, téléchargez-le simplement avec Ollama :

```bash
ollama pull mistral
```

Le nouveau modèle sera automatiquement découvert et disponible à l’usage.

<Note>
Si vous définissez explicitement `models.providers.ollama`, la découverte automatique est ignorée et vous devez définir les modèles manuellement. Voir la section de configuration explicite ci-dessous.
</Note>

## Vision et description d’image

Le Plugin Ollama intégré enregistre Ollama comme provider de compréhension média compatible image. Cela permet à OpenClaw de router les demandes explicites de description d’image et les valeurs par défaut configurées de modèle d’image via des modèles de vision Ollama locaux ou hébergés.

Pour la vision locale, téléchargez un modèle qui prend en charge les images :

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Vérifiez ensuite avec le CLI infer :

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` doit être une référence complète `<provider/model>`. Lorsqu’il est défini, `openclaw infer image describe` exécute directement ce modèle au lieu d’ignorer la description parce que le modèle prend en charge la vision native.

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

OpenClaw rejette les demandes de description d’image pour les modèles qui ne sont pas marqués comme compatibles image. Avec la découverte implicite, OpenClaw lit cette information depuis Ollama lorsque `/api/show` signale une capacité de vision.

## Configuration

<Tabs>
  <Tab title="Basique (découverte implicite)">
    Le chemin d’activation local-only le plus simple passe par une variable d’environnement :

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` est défini, vous pouvez omettre `apiKey` dans l’entrée du provider et OpenClaw le remplira pour les vérifications de disponibilité.
    </Tip>

  </Tab>

  <Tab title="Explicite (modèles manuels)">
    Utilisez une configuration explicite lorsque vous voulez une configuration cloud hébergée, qu’Ollama s’exécute sur un autre hôte/port, que vous vouliez imposer des fenêtres de contexte ou des listes de modèles spécifiques, ou que vous vouliez des définitions de modèles entièrement manuelles.

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
    Si Ollama s’exécute sur un autre hôte ou port (la configuration explicite désactive la découverte automatique, donc définissez les modèles manuellement) :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Pas de /v1 - utilisez l’URL de l’API native Ollama
            api: "ollama", // Définir explicitement pour garantir le comportement natif de tool-calling
          },
        },
      },
    }
    ```

    <Warning>
    N’ajoutez pas `/v1` à l’URL. Le chemin `/v1` utilise le mode compatible OpenAI, où le tool calling n’est pas fiable. Utilisez l’URL Ollama de base sans suffixe de chemin.
    </Warning>

  </Tab>
</Tabs>

### Sélection de modèle

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

## Recherche Web Ollama

OpenClaw prend en charge **Ollama Web Search** comme provider intégré `web_search`.

| Propriété | Détail |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Hôte | Utilise votre hôte Ollama configuré (`models.providers.ollama.baseUrl` lorsqu’il est défini, sinon `http://127.0.0.1:11434`) |
| Auth | Sans clé |
| Exigence | Ollama doit être en cours d’exécution et connecté avec `ollama signin` |

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

<Note>
Pour les détails complets de configuration et de comportement, voir [Ollama Web Search](/fr/tools/ollama-search).
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Ancien mode compatible OpenAI">
    <Warning>
    **Le tool calling n’est pas fiable en mode compatible OpenAI.** Utilisez ce mode uniquement si vous avez besoin du format OpenAI pour un proxy et que vous ne dépendez pas du comportement natif de tool calling.
    </Warning>

    Si vous devez utiliser à la place le point de terminaison compatible OpenAI (par exemple derrière un proxy qui ne prend en charge que le format OpenAI), définissez explicitement `api: "openai-completions"` :

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

    Ce mode peut ne pas prendre en charge simultanément le streaming et le tool calling. Vous devrez peut-être désactiver le streaming avec `params: { streaming: false }` dans la configuration du modèle.

    Lorsque `api: "openai-completions"` est utilisé avec Ollama, OpenClaw injecte `options.num_ctx` par défaut afin qu’Ollama ne retombe pas silencieusement sur une fenêtre de contexte de 4096. Si votre proxy/upstream rejette les champs `options` inconnus, désactivez ce comportement :

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
    Pour les modèles découverts automatiquement, OpenClaw utilise la fenêtre de contexte signalée par Ollama lorsqu’elle est disponible ; sinon, il revient à la fenêtre de contexte Ollama par défaut utilisée par OpenClaw.

    Vous pouvez remplacer `contextWindow` et `maxTokens` dans la configuration explicite du provider :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Modèles de raisonnement">
    OpenClaw considère par défaut comme compatibles raisonnement les modèles dont le nom contient des éléments comme `deepseek-r1`, `reasoning`, ou `think`.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Aucune configuration supplémentaire n’est nécessaire -- OpenClaw les marque automatiquement.

  </Accordion>

  <Accordion title="Coûts des modèles">
    Ollama est gratuit et s’exécute localement, donc tous les coûts de modèle sont définis à $0. Cela s’applique aux modèles découverts automatiquement comme aux modèles définis manuellement.
  </Accordion>

  <Accordion title="Embeddings de mémoire">
    Le Plugin Ollama intégré enregistre un provider d’embeddings de mémoire pour
    la [recherche mémoire](/fr/concepts/memory). Il utilise l’URL de base Ollama
    et la clé API configurées.

    | Propriété | Valeur |
    | ------------- | ------------------- |
    | Modèle par défaut | `nomic-embed-text` |
    | Téléchargement automatique | Oui — le modèle d’embedding est téléchargé automatiquement s’il n’est pas présent localement |

    Pour sélectionner Ollama comme provider d’embedding de recherche mémoire :

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuration du streaming">
    L’intégration Ollama d’OpenClaw utilise par défaut l’**API native Ollama** (`/api/chat`), qui prend entièrement en charge simultanément le streaming et le tool calling. Aucune configuration spéciale n’est nécessaire.

    <Tip>
    Si vous devez utiliser le point de terminaison compatible OpenAI, voir la section « Ancien mode compatible OpenAI » ci-dessus. Le streaming et le tool calling peuvent ne pas fonctionner simultanément dans ce mode.
    </Tip>

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Ollama non détecté">
    Assurez-vous qu’Ollama est en cours d’exécution, que vous avez défini `OLLAMA_API_KEY` (ou un profil d’auth), et que vous **n’avez pas** défini d’entrée explicite `models.providers.ollama` :

    ```bash
    ollama serve
    ```

    Vérifiez que l’API est accessible :

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Aucun modèle disponible">
    Si votre modèle n’est pas listé, soit téléchargez-le localement, soit définissez-le explicitement dans `models.providers.ollama`.

    ```bash
    ollama list  # Voir ce qui est installé
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Ou un autre modèle
    ```

  </Accordion>

  <Accordion title="Connexion refusée">
    Vérifiez qu’Ollama s’exécute sur le bon port :

    ```bash
    # Vérifier si Ollama est en cours d’exécution
    ps aux | grep ollama

    # Ou redémarrer Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Plus d’aide : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Lié

<CardGroup cols={2}>
  <Card title="Providers de modèles" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les providers, références de modèles et comportement de bascule.
  </Card>
  <Card title="Sélection de modèle" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
  <Card title="Ollama Web Search" href="/fr/tools/ollama-search" icon="magnifying-glass">
    Détails complets de configuration et de comportement pour la recherche web propulsée par Ollama.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration.
  </Card>
</CardGroup>
