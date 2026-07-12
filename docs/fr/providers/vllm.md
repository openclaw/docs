---
read_when:
    - Vous souhaitez utiliser OpenClaw avec un serveur vLLM local
    - Vous souhaitez des points de terminaison `/v1` compatibles avec OpenAI pour vos propres modèles
summary: Exécuter OpenClaw avec vLLM (serveur local compatible avec OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T15:45:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM sert des modèles open source (et certains modèles personnalisés) au moyen d’une API HTTP **compatible avec OpenAI**. OpenClaw se connecte à l’aide de l’API `openai-completions` et peut **détecter automatiquement** les modèles lorsque vous activez cette fonctionnalité avec `VLLM_API_KEY`.

| Propriété             | Valeur                                     |
| --------------------- | ------------------------------------------ |
| ID du fournisseur     | `vllm`                                     |
| API                   | `openai-completions` (compatible avec OpenAI) |
| Authentification      | Variable d’environnement `VLLM_API_KEY`    |
| URL de base par défaut | `http://127.0.0.1:8000/v1`                |
| Utilisation en streaming | Prise en charge (`stream_options.include_usage`) |

## Prise en main

<Steps>
  <Step title="Démarrer vLLM avec un serveur compatible avec OpenAI">
    Votre URL de base doit exposer les points de terminaison `/v1` (`/v1/models`, `/v1/chat/completions`). vLLM s’exécute généralement à l’adresse suivante :

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Définir la variable d’environnement de la clé API">
    Toute valeur non vide convient si votre serveur n’impose pas d’authentification :

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Sélectionner un modèle">
    Remplacez cette valeur par l’un des ID de modèle de votre instance vLLM :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

<Tip>
Pour une configuration non interactive (CI, scripts), transmettez directement l’URL de base, la clé et le modèle :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Détection des modèles (fournisseur implicite)

Lorsque `VLLM_API_KEY` est défini (ou qu’un profil d’authentification existe) et que `models.providers.vllm` n’est **pas** défini, OpenClaw interroge `GET http://127.0.0.1:8000/v1/models` et convertit les ID renvoyés en entrées de modèle.

<Note>
Si vous définissez explicitement `models.providers.vllm`, OpenClaw utilise uniquement les modèles que vous avez déclarés. Ajoutez `"vllm/*": {}` à `agents.defaults.models` pour qu’OpenClaw interroge également le point de terminaison `/models` de ce fournisseur configuré et inclue tous les modèles vLLM annoncés.
</Note>

## Configuration explicite

Utilisez une configuration explicite lorsque vLLM s’exécute sur un autre hôte ou port, lorsque vous souhaitez fixer `contextWindow`/`maxTokens`, lorsque votre serveur exige une véritable clé API ou lorsque vous vous connectez à un point de terminaison de bouclage, de réseau local ou Tailscale de confiance :

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Facultatif : prolonger le délai d’expiration des requêtes pour les modèles locaux lents
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Pour conserver un fournisseur dynamique sans répertorier chaque modèle, ajoutez un caractère générique au catalogue de modèles visible :

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement de type proxy">
    vLLM est traité comme un serveur principal `/v1` compatible avec OpenAI et de type proxy, et non comme un point de terminaison OpenAI natif :

    | Comportement                                      | Appliqué ?                          |
    | ------------------------------------------------- | ----------------------------------- |
    | Mise en forme native des requêtes OpenAI          | Non                                 |
    | `service_tier`                                    | Non envoyé                          |
    | `store` de Responses                              | Non envoyé                          |
    | Indications de cache de prompt                    | Non envoyées                        |
    | Mise en forme de la charge utile de compatibilité du raisonnement OpenAI | Non appliquée |
    | En-têtes d’attribution OpenClaw masqués           | Non injectés pour les URL de base personnalisées |

  </Accordion>

  <Accordion title="Contrôles de réflexion de Qwen">
    Pour les modèles Qwen, définissez `compat.thinkingFormat: "qwen-chat-template"` sur la ligne du modèle lorsque le serveur attend des arguments nommés du modèle de discussion Qwen. Ces modèles exposent un profil binaire `/think` (`off`, `on`), car la réflexion du modèle de discussion Qwen est une option activée ou désactivée, et non une échelle d’intensité de type OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw associe `/think off` à :

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Les niveaux de réflexion autres que `off` envoient `enable_thinking: true`. Si votre point de terminaison attend plutôt des indicateurs de premier niveau de type DashScope, utilisez `compat.thinkingFormat: "qwen"` pour envoyer `enable_thinking` à la racine de la requête.

  </Accordion>

  <Accordion title="Contrôles de réflexion de Nemotron 3">
    Pour les modèles `vllm/nemotron-3-*` dont la réflexion est désactivée, le plugin intégré envoie :

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Pour personnaliser ces valeurs, définissez `chat_template_kwargs` dans les paramètres du modèle. Si vous définissez également `params.extra_body.chat_template_kwargs`, cette valeur prévaut, car `extra_body` est la dernière substitution appliquée au corps de la requête.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Les appels d’outils Qwen apparaissent sous forme de texte">
    Vérifiez d’abord que vLLM a été démarré avec l’analyseur d’appels d’outils et le modèle de discussion adaptés au modèle. La documentation de vLLM indique `hermes` pour les modèles Qwen2.5 et `qwen3_xml` pour les modèles Qwen3-Coder.

    Symptômes : les compétences ou outils ne s’exécutent jamais, l’assistant affiche du JSON/XML brut tel que `{"name":"read","arguments":...}`, ou vLLM renvoie un tableau `tool_calls` vide lorsqu’OpenClaw envoie `tool_choice: "auto"`.

    Certaines combinaisons Qwen/vLLM ne renvoient des appels d’outils structurés que lorsque la requête utilise `tool_choice: "required"`. Forcez ce comportement pour chaque modèle avec `params.extra_body` :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Remplacez l’ID du modèle par l’ID exact indiqué par `openclaw models list --provider vllm`, ou appliquez la même substitution depuis la CLI :

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Il s’agit d’une solution de contournement facultative : elle force chaque tour disposant d’outils à effectuer un appel d’outil. Utilisez-la donc uniquement pour une entrée de modèle dédiée lorsque ce comportement est acceptable. Ne la définissez pas comme valeur par défaut globale pour tous les modèles vLLM et ne l’associez pas à un proxy qui convertit arbitrairement le texte de l’assistant en appels d’outils exécutables.

  </Accordion>

  <Accordion title="URL de base personnalisée">
    Si votre serveur vLLM s’exécute sur un hôte ou un port autre que celui par défaut, définissez `baseUrl` dans la configuration explicite du fournisseur :

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Première réponse lente ou expiration du délai du serveur distant">
    Pour les grands modèles locaux, les hôtes distants du réseau local ou les connexions au tailnet, définissez un délai d’expiration des requêtes propre au fournisseur :

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` s’applique uniquement aux requêtes HTTP des modèles vLLM : établissement de la connexion, en-têtes de réponse, streaming du corps et interruption totale de la récupération protégée. Il relève également le plafond du mécanisme de surveillance de l’inactivité ou du streaming du LLM au-dessus de la valeur implicite par défaut d’environ 120s pour ce fournisseur. Préférez cette option à l’augmentation de `agents.defaults.timeoutSeconds`, qui contrôle l’ensemble de l’exécution de l’agent.

  </Accordion>

  <Accordion title="Serveur inaccessible">
    Vérifiez que le serveur vLLM est en cours d’exécution et accessible :

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si une erreur de connexion apparaît, vérifiez l’hôte, le port et que vLLM a démarré en mode serveur compatible avec OpenAI. OpenClaw approuve l’origine exacte configurée dans `models.providers.vllm.baseUrl` pour les requêtes de modèle protégées vers les points de terminaison de bouclage, de réseau local et Tailscale. Les origines de métadonnées ou locales au lien restent bloquées sans activation explicite. Définissez `models.providers.vllm.request.allowPrivateNetwork: true` uniquement lorsque les requêtes vLLM doivent atteindre une autre origine privée, ou `false` pour désactiver l’approbation de l’origine exacte.

  </Accordion>

  <Accordion title="Erreurs d’authentification lors des requêtes">
    Si les requêtes échouent avec des erreurs d’authentification, définissez une véritable valeur `VLLM_API_KEY` correspondant à la configuration de votre serveur, ou configurez explicitement le fournisseur dans `models.providers.vllm`.

    <Tip>
    Si votre serveur vLLM n’impose pas d’authentification, toute valeur non vide de `VLLM_API_KEY` sert de signal d’activation pour OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Aucun modèle détecté">
    La détection automatique exige que `VLLM_API_KEY` soit défini. Si vous avez défini `models.providers.vllm`, OpenClaw utilise uniquement les modèles que vous avez déclarés, sauf si `agents.defaults.models` inclut `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Les outils sont affichés sous forme de texte brut">
    Si un modèle Qwen affiche la syntaxe JSON/XML d’un outil au lieu d’exécuter une compétence :

    - Démarrez vLLM avec l’analyseur et le modèle adaptés à ce modèle.
    - Vérifiez l’ID exact du modèle avec `openclaw models list --provider vllm`.
    - Ajoutez une substitution dédiée `params.extra_body.tool_choice: "required"` pour ce modèle uniquement si `tool_choice: "auto"` continue de renvoyer des appels d’outils vides ou uniquement textuels.

  </Accordion>
</AccordionGroup>

<Warning>
Pour obtenir plus d’aide : [Résolution des problèmes](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Warning>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="OpenAI" href="/fr/providers/openai" icon="bolt">
    Fournisseur OpenAI natif et comportement des routes compatibles avec OpenAI.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails de l’authentification et règles de réutilisation des identifiants.
  </Card>
  <Card title="Résolution des problèmes" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et méthodes pour les résoudre.
  </Card>
</CardGroup>
