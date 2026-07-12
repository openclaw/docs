---
read_when:
    - Vous souhaitez exécuter OpenClaw avec un serveur SGLang local
    - Vous souhaitez disposer de points de terminaison /v1 compatibles avec OpenAI pour vos propres modèles
summary: Exécuter OpenClaw avec SGLang (serveur auto-hébergé compatible avec OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T03:16:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang fournit des modèles à poids ouverts via une API HTTP compatible avec OpenAI. OpenClaw se connecte à SGLang à l’aide de la famille de fournisseurs `openai-completions`, avec découverte automatique des modèles disponibles.

| Propriété                         | Valeur                                                               |
| --------------------------------- | -------------------------------------------------------------------- |
| Identifiant du fournisseur        | `sglang`                                                             |
| Plugin                            | intégré, `enabledByDefault: true`                                    |
| Variable d’environnement d’authentification | `SGLANG_API_KEY` (toute valeur non vide si le serveur n’utilise pas d’authentification) |
| Option d’intégration              | `--auth-choice sglang`                                               |
| API                               | compatible avec OpenAI (`openai-completions`)                        |
| URL de base par défaut            | `http://127.0.0.1:30000/v1`                                         |
| Modèle par défaut indicatif       | `sglang/Qwen/Qwen3-8B`                                               |
| Utilisation en streaming          | Oui (`supportsStreamingUsage: true`)                                 |
| Tarification                      | Marquée comme externe gratuite (`modelPricing.external: false`)      |

OpenClaw **découvre automatiquement** également les modèles disponibles auprès de SGLang lorsque vous activez cette fonctionnalité avec `SGLANG_API_KEY`. Utilisez `sglang/*` dans `agents.defaults.models` pour conserver une découverte dynamique lorsque vous configurez également une URL de base SGLang personnalisée. Consultez la section [Découverte des modèles (fournisseur implicite)](#model-discovery-implicit-provider) ci-dessous.

## Prise en main

<Steps>
  <Step title="Démarrer SGLang">
    Lancez SGLang avec un serveur compatible avec OpenAI. Votre URL de base doit exposer
    des points de terminaison `/v1` (par exemple `/v1/models`, `/v1/chat/completions`). SGLang
    s’exécute généralement à l’adresse suivante :

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Définir une clé d’API">
    Toute valeur convient si aucune authentification n’est configurée sur votre serveur :

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Exécuter l’intégration ou définir directement un modèle">
    ```bash
    openclaw onboard
    ```

    Vous pouvez également configurer le modèle manuellement :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Découverte des modèles (fournisseur implicite)

Lorsque `SGLANG_API_KEY` est définie (ou qu’un profil d’authentification existe) et que vous **ne**
définissez pas `models.providers.sglang`, OpenClaw interroge :

- `GET http://127.0.0.1:30000/v1/models`

puis convertit les identifiants renvoyés en entrées de modèles.

<Note>
Si vous définissez explicitement `models.providers.sglang`, OpenClaw utilise par défaut
les modèles que vous avez déclarés. Ajoutez `"sglang/*": {}` à `agents.defaults.models` si vous
souhaitez qu’OpenClaw interroge le point de terminaison `/models` de ce fournisseur configuré et inclue
tous les modèles SGLang annoncés.
</Note>

## Configuration explicite (modèles manuels)

Utilisez une configuration explicite dans les cas suivants :

- SGLang s’exécute sur un autre hôte ou port.
- Vous souhaitez fixer les valeurs de `contextWindow` et `maxTokens`.
- Votre serveur exige une véritable clé d’API (ou vous souhaitez contrôler les en-têtes).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement de type proxy">
    SGLang est traité comme un serveur dorsal `/v1` compatible avec OpenAI et de type proxy, et non comme un
    point de terminaison OpenAI natif.

    | Comportement | SGLang |
    |--------------|--------|
    | Mise en forme des requêtes propre à OpenAI | Non appliquée |
    | `service_tier`, `store` de Responses, indications de cache des invites | Non envoyés |
    | Mise en forme de la charge utile pour la compatibilité du raisonnement | Non appliquée |
    | En-têtes d’attribution masqués (`originator`, `version`, `User-Agent`) | Non injectés pour les URL de base SGLang personnalisées |

  </Accordion>

  <Accordion title="Dépannage">
    **Serveur inaccessible**

    Vérifiez que le serveur est en cours d’exécution et qu’il répond :

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Erreurs d’authentification**

    Si les requêtes échouent en raison d’erreurs d’authentification, définissez une véritable `SGLANG_API_KEY` correspondant
    à la configuration de votre serveur, ou configurez explicitement le fournisseur sous
    `models.providers.sglang`.

    <Tip>
    Si vous exécutez SGLang sans authentification, toute valeur non vide de
    `SGLANG_API_KEY` suffit pour activer la découverte des modèles.
    </Tip>

  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, y compris les entrées de fournisseurs.
  </Card>
</CardGroup>
