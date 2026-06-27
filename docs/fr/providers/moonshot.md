---
read_when:
    - Vous voulez configurer Moonshot K2 (Moonshot Open Platform) par rapport à Kimi Coding
    - Vous devez comprendre les endpoints, les clés et les références de modèle distincts
    - Vous voulez une configuration à copier-coller pour l’un ou l’autre fournisseur
summary: Configurer Moonshot K2 et Kimi Coding (fournisseurs et clés séparés)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:05:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot fournit l’API Kimi avec des points de terminaison compatibles OpenAI. Configurez le
fournisseur et définissez le modèle par défaut sur `moonshot/kimi-k2.6`, ou utilisez
Kimi Coding avec `kimi/kimi-for-coding`.

<Warning>
Moonshot et Kimi Coding sont des **fournisseurs distincts**. Les clés ne sont pas interchangeables, les points de terminaison diffèrent, et les références de modèle diffèrent (`moonshot/...` contre `kimi/...`).
</Warning>

## Catalogue de modèles intégré

[//]: # "moonshot-kimi-k2-ids:start"

| Réf. du modèle                  | Nom                    | Raisonnement       | Entrée      | Contexte | Sortie max. |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Non       | texte, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Toujours activé | texte, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Non       | texte, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Oui       | texte        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Oui       | texte        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Non       | texte        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Les estimations de coût du catalogue pour les modèles K2 actuels hébergés par Moonshot utilisent les
tarifs à l’usage publiés par Moonshot : Kimi K2.7 Code coûte 0,19 $/MTok en cas de cache hit,
0,95 $/MTok en entrée, et 4,00 $/MTok en sortie ; Kimi K2.6 coûte 0,16 $/MTok en cas de cache hit,
0,95 $/MTok en entrée, et 4,00 $/MTok en sortie ; Kimi K2.5 coûte 0,10 $/MTok en cas de cache hit,
0,60 $/MTok en entrée, et 3,00 $/MTok en sortie. Les autres entrées héritées du catalogue conservent
des espaces réservés à coût nul, sauf si vous les remplacez dans la configuration.

Kimi K2.7 Code utilise toujours la réflexion native. OpenClaw expose uniquement l’état de réflexion `on`
pour ce modèle et omet les contrôles sortants `thinking` et
`reasoning_effort`, comme l’exige Moonshot. OpenClaw omet aussi les
remplacements d’échantillonnage que K2.7 fixe aux valeurs par défaut du fournisseur. Kimi K2.6 reste le
modèle par défaut de l’intégration initiale.

## Premiers pas

Choisissez votre fournisseur et suivez les étapes de configuration.

<Tabs>
  <Tab title="API Moonshot">
    **Idéal pour :** les modèles Kimi K2 via la Moonshot Open Platform.

    <Steps>
      <Step title="Choisissez votre région de point de terminaison">
        | Choix d’authentification | Point de terminaison           | Région        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Chine         |
      </Step>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Ou pour le point de terminaison Chine :

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Exécuter un test fumigatoire réel">
        Utilisez un répertoire d’état isolé lorsque vous voulez vérifier l’accès au modèle et le suivi des coûts
        sans toucher à vos sessions normales :

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        La réponse JSON doit indiquer `provider: "moonshot"` et
        `model: "kimi-k2.6"`. L’entrée de transcription de l’assistant stocke l’utilisation normalisée
        des jetons ainsi que le coût estimé sous `usage.cost` lorsque Moonshot renvoie des
        métadonnées d’utilisation.
      </Step>
    </Steps>

    ### Exemple de configuration

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    Installez le Plugin officiel, puis redémarrez Gateway :

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Idéal pour :** les tâches axées sur le code via le point de terminaison Kimi Coding.

    <Note>
    Kimi Coding utilise une clé d’API et un préfixe de fournisseur différents (`kimi/...`) de Moonshot (`moonshot/...`). La référence de modèle d’API stable est `kimi/kimi-for-coding` ; les références héritées `kimi/kimi-code` et `kimi/k2p5` restent acceptées et sont normalisées vers cet identifiant de modèle d’API.
    </Note>

    <Steps>
      <Step title="Installer le Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Exemple de configuration

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Recherche web Kimi

Le Plugin Moonshot enregistre aussi **Kimi** comme fournisseur `web_search`, adossé à la recherche web Moonshot.

<Steps>
  <Step title="Exécuter la configuration interactive de la recherche web">
    ```bash
    openclaw configure --section web
    ```

    Choisissez **Kimi** dans la section de recherche web pour stocker
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configurer la région et le modèle de recherche web">
    La configuration interactive demande :

    | Paramètre           | Options                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | Région de l’API     | `https://api.moonshot.ai/v1` (international) ou `https://api.moonshot.cn/v1` (Chine) |
    | Modèle de recherche web | Valeur par défaut : `kimi-k2.6`                                  |

  </Step>
</Steps>

La configuration se trouve sous `plugins.entries.moonshot.config.webSearch` :

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode de réflexion native">
    Kimi K2.7 Code utilise toujours la réflexion native. Moonshot exige que les clients
    omettent le champ `thinking` pour ce modèle ; OpenClaw expose donc uniquement `on` et
    ignore les paramètres obsolètes `off`. K2.7 fixe aussi `temperature`, `top_p`, `n`,
    `presence_penalty` et `frequency_penalty` ; OpenClaw omet les remplacements configurés
    pour ces champs.

    Les autres modèles Moonshot Kimi prennent en charge la réflexion native binaire :

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configurez-la par modèle via `agents.defaults.models.<provider/model>.params` :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw mappe les niveaux `/think` d’exécution pour ces modèles :

    | Niveau `/think`     | Comportement Moonshot     |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Tout niveau autre que off | `thinking.type=enabled`    |

    <Warning>
    Lorsque la réflexion Moonshot est activée, `tool_choice` doit être `auto` ou `none`. OpenClaw normalise les valeurs incompatibles en `auto`. Cela inclut Kimi K2.7 Code, dont le mode de réflexion ne peut pas être désactivé pour préserver un choix d’outil épinglé.
    </Warning>

    Kimi K2.6 accepte également un champ facultatif `thinking.keep` qui contrôle
    la conservation multi-tour de `reasoning_content`. Définissez-le sur `"all"` pour conserver le
    raisonnement complet entre les tours ; omettez-le (ou laissez-le à `null`) pour utiliser la stratégie
    par défaut du serveur. OpenClaw ne transmet `thinking.keep` que pour
    `moonshot/kimi-k2.6` et le retire des autres modèles. Kimi K2.7 Code
    conserve par défaut l’historique complet du raisonnement, tandis qu’OpenClaw omet entièrement le
    champ `thinking`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Nettoyage des id d’appel d’outil">
    Moonshot Kimi fournit des ids `tool_call` natifs de la forme `functions.<name>:<index>`. Pour le transport OpenAI-completions, OpenClaw conserve la première occurrence de chaque id Kimi natif et réécrit les doublons ultérieurs en ids `call_*` déterministes de style OpenAI. Les résultats d’outil correspondants sont remappés avec le même id afin que la relecture reste unique sans supprimer le premier id natif de Kimi.

    Pour imposer un nettoyage strict sur un fournisseur personnalisé compatible OpenAI, définissez `sanitizeToolCallIds: true` :

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Compatibilité de l’utilisation en streaming">
    Les points de terminaison Moonshot natifs (`https://api.moonshot.ai/v1` et
    `https://api.moonshot.cn/v1`) annoncent la compatibilité de l’utilisation en streaming sur le
    transport partagé `openai-completions`. OpenClaw s’appuie pour cela sur les
    capacités du point de terminaison ; les ids de fournisseurs personnalisés compatibles qui ciblent les mêmes hôtes
    Moonshot natifs héritent donc du même comportement d’utilisation en streaming.

    Avec la tarification K2.6 du catalogue, l’utilisation diffusée qui inclut les jetons d’entrée, de sortie
    et de lecture du cache est également convertie en coût local estimé en USD pour
    `/status`, `/usage full`, `/usage cost` et la comptabilisation de session
    fondée sur la transcription.

  </Accordion>

  <Accordion title="Référence des points de terminaison et des refs de modèle">
    | Fournisseur | Préfixe de ref de modèle | Point de terminaison          | Variable d’environnement d’authentification |
    | ----------- | ------------------------ | ----------------------------- | ------------------------------------------- |
    | Moonshot    | `moonshot/`              | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`                          |
    | Moonshot CN | `moonshot/`              | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`                          |
    | Kimi Coding | `kimi/`                  | Point de terminaison Kimi Coding | `KIMI_API_KEY`                           |
    | Recherche web | S/O                    | Identique à la région de l’API Moonshot | `KIMI_API_KEY` ou `MOONSHOT_API_KEY` |

    - La recherche web Kimi utilise `KIMI_API_KEY` ou `MOONSHOT_API_KEY`, et utilise par défaut `https://api.moonshot.ai/v1` avec le modèle `kimi-k2.6`.
    - Remplacez la tarification et les métadonnées de contexte dans `models.providers` si nécessaire.
    - Si Moonshot publie des limites de contexte différentes pour un modèle, ajustez `contextWindow` en conséquence.

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir des fournisseurs, des refs de modèle et le comportement de basculement.
  </Card>
  <Card title="Recherche web" href="/fr/tools/web" icon="magnifying-glass">
    Configurer les fournisseurs de recherche web, y compris Kimi.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet pour les fournisseurs, les modèles et les plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestion et documentation des clés d’API Moonshot.
  </Card>
</CardGroup>
