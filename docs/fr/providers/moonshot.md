---
read_when:
    - Vous souhaitez configurer Moonshot K2 (Moonshot Open Platform) ou Kimi Coding
    - Vous devez comprendre les endpoints, les clés et les références de modèles distincts
    - Vous souhaitez une configuration prête à copier-coller pour l’un ou l’autre fournisseur
summary: Configurer Moonshot K2 et Kimi Coding (fournisseurs et clés distincts)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T15:45:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

  Moonshot fournit l’API Kimi avec des points de terminaison compatibles avec OpenAI. Définissez le
  modèle par défaut sur `moonshot/kimi-k2.6` pour Moonshot Open Platform, ou sur
  `kimi/kimi-for-coding` pour Kimi Coding.

  <Warning>
  Moonshot et Kimi Coding sont des **fournisseurs distincts**, chacun étant distribué sous forme de plugin externe séparé. Les clés ne sont pas interchangeables, les points de terminaison diffèrent et les références de modèles diffèrent (`moonshot/...` et `kimi/...`).
  </Warning>

  ## Catalogue de modèles intégré

  [//]: # "moonshot-kimi-k2-ids:start"

  | Référence du modèle               | Nom                    | Raisonnement      | Entrée      | Contexte | Sortie maximale |
  | --------------------------------- | ---------------------- | ----------------- | ----------- | -------- | --------------- |
  | `moonshot/kimi-k2.6`              | Kimi K2.6              | Non               | texte, image | 262,144 | 262,144         |
  | `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Toujours activé   | texte, image | 262,144 | 262,144         |
  | `moonshot/kimi-k2.5`              | Kimi K2.5              | Non               | texte, image | 262,144 | 262,144         |
  | `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Oui               | texte       | 262,144 | 262,144         |
  | `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Oui               | texte       | 262,144 | 262,144         |
  | `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Non               | texte       | 256,000 | 16,384          |

  [//]: # "moonshot-kimi-k2-ids:end"

  Les estimations de coût du catalogue utilisent les tarifs à l’usage publiés par Moonshot : Kimi
  K2.7 Code coûte $0.19/MTok pour une lecture depuis le cache, $0.95/MTok en entrée et $4.00/MTok en sortie ; Kimi
  K2.6 coûte $0.16/MTok pour une lecture depuis le cache, $0.95/MTok en entrée et $4.00/MTok en sortie ; Kimi K2.5
  coûte $0.10/MTok pour une lecture depuis le cache, $0.60/MTok en entrée et $3.00/MTok en sortie. Les autres entrées du catalogue
  conservent des valeurs indicatives de coût nul, sauf si vous les remplacez dans la configuration.

  Kimi K2.7 Code utilise toujours le raisonnement natif. OpenClaw expose uniquement l’état de raisonnement `on`
  pour ce modèle et omet les champs sortants `thinking` et
  `reasoning_effort`, comme l’exige Moonshot. Il omet également les paramètres
  d’échantillonnage (`temperature`, `top_p`, `n`, `presence_penalty`,
  `frequency_penalty`), que K2.7 fixe aux valeurs par défaut du fournisseur. Kimi K2.6 reste
  le modèle par défaut lors de l’intégration initiale.

  ## Prise en main

  Moonshot et Kimi Coding sont tous deux des plugins externes : installez-en un avant
  l’intégration initiale.

  <Tabs>
  <Tab title="API Moonshot">
    **Idéal pour :** les modèles Kimi K2 via Moonshot Open Platform.

    <Steps>
      <Step title="Installer le plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Choisir la région du point de terminaison">
        | Choix d’authentification | Point de terminaison            | Région        |
        | ------------------------ | ------------------------------- | ------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1`    | International |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1`    | Chine         |
      </Step>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Ou pour le point de terminaison chinois :

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
      <Step title="Vérifier la disponibilité des modèles">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Exécuter un test de fonctionnement en conditions réelles">
        Utilisez un répertoire d’état isolé lorsque vous souhaitez vérifier l’accès au modèle et le suivi
        des coûts sans modifier vos sessions habituelles :

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Répondez exactement : KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        La réponse JSON doit indiquer `provider: "moonshot"` et
        `model: "kimi-k2.6"`. L’entrée de transcription de l’assistant stocke l’utilisation
        normalisée des tokens ainsi que le coût estimé sous `usage.cost` lorsque Moonshot renvoie
        les métadonnées d’utilisation.
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
    **Idéal pour :** les tâches axées sur le code via le point de terminaison Kimi Coding.

    <Note>
    Kimi Coding utilise une clé API et un préfixe de fournisseur (`kimi/...`) différents de ceux de Moonshot (`moonshot/...`). La référence de modèle stable est `kimi/kimi-for-coding` ; les anciennes références `kimi/kimi-code` et `kimi/k2p5` restent acceptées et sont normalisées vers cet identifiant de modèle.
    </Note>

    <Steps>
      <Step title="Installer le Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
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

Le Plugin Moonshot enregistre également **Kimi** comme fournisseur `web_search`, reposant sur la recherche web Moonshot.

<Steps>
  <Step title="Exécuter la configuration interactive de la recherche web">
    ```bash
    openclaw configure --section web
    ```

    Choisissez **Kimi** dans la section de recherche web afin d’enregistrer
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configurer la région et le modèle de recherche web">
    La configuration interactive vous invite à définir les éléments suivants :

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
            apiKey: "sk-...", // ou utilisez KIMI_API_KEY / MOONSHOT_API_KEY
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
  <Accordion title="Mode de raisonnement natif">
    Kimi K2.7 Code utilise toujours le raisonnement natif. Moonshot exige que les clients
    omettent le champ `thinking` pour ce modèle ; OpenClaw expose donc uniquement `on` et
    ignore les anciens paramètres `off`. K2.7 impose également les valeurs de `temperature`, `top_p`, `n`,
    `presence_penalty` et `frequency_penalty` ; OpenClaw omet les
    valeurs de remplacement configurées pour ces champs.

    Les autres modèles Moonshot Kimi prennent en charge le raisonnement natif binaire :

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configurez-le pour chaque modèle via `agents.defaults.models.<provider/model>.params` :

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

    OpenClaw associe les niveaux d’exécution `/think` à ces modèles :

    | Niveau `/think`      | Comportement de Moonshot   |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Tout niveau autre que off | `thinking.type=enabled` |

    <Warning>
    Lorsque le raisonnement Moonshot est activé, `tool_choice` doit être défini sur `auto` ou `none`. Un choix d’outil imposé (`type: "tool"` ou `type: "function"`) force à la place le retour du raisonnement à `disabled`, afin que l’outil demandé soit tout de même exécuté ; `tool_choice: "required"` est plutôt normalisé en `auto`. Cela s’applique à tous les modèles Moonshot, sauf Kimi K2.7 Code, dont le mode de raisonnement ne peut pas être désactivé : son `tool_choice` est normalisé en `auto` lorsqu’il est incompatible.
    </Warning>

    Kimi K2.6 accepte également un champ facultatif `thinking.keep` qui contrôle
    la conservation de `reasoning_content` sur plusieurs tours. Définissez-le sur `"all"` pour conserver l’intégralité
    du raisonnement d’un tour à l’autre ; omettez-le (ou laissez-le à `null`) pour utiliser la stratégie
    par défaut du serveur. OpenClaw ne transmet `thinking.keep` que pour
    `moonshot/kimi-k2.6` et le supprime pour les autres modèles. Kimi K2.7 Code
    conserve par défaut l’intégralité de l’historique de raisonnement, tandis qu’OpenClaw omet entièrement
    le champ `thinking`.

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

  <Accordion title="Assainissement des identifiants d’appel d’outil">
    Moonshot Kimi fournit des identifiants tool_call natifs au format `functions.<name>:<index>`. OpenClaw conserve la première occurrence de chaque identifiant Kimi natif et réécrit les doublons ultérieurs sous forme d’identifiants `call_*` déterministes de style OpenAI. Les résultats d’outil correspondants sont remappés avec le même identifiant afin que la relecture reste unique sans supprimer le premier identifiant natif de Kimi. Ce comportement est intégré au fournisseur Moonshot inclus et ne constitue pas un paramètre configurable par l’utilisateur.
  </Accordion>

  <Accordion title="Compatibilité de l’utilisation en streaming">
    Les points de terminaison Moonshot natifs (`https://api.moonshot.ai/v1` et
    `https://api.moonshot.cn/v1`) annoncent une compatibilité avec l’utilisation en streaming.
    OpenClaw détermine ce comportement à partir de l’hôte du point de terminaison, et non de l’identifiant du fournisseur ; un identifiant de
    fournisseur personnalisé qui pointe vers le même hôte Moonshot natif hérite donc du même
    comportement d’utilisation en streaming.

    Avec la tarification K2.6 du catalogue, l’utilisation en streaming qui inclut les jetons d’entrée, de sortie
    et lus depuis le cache est également convertie en coût local estimé en USD pour
    `/status`, `/usage full`, `/usage cost` et la comptabilisation des sessions
    basée sur les transcriptions.

  </Accordion>

  <Accordion title="Référence des points de terminaison et des références de modèle">
    | Fournisseur | Préfixe de référence du modèle | Point de terminaison            | Variable d’environnement d’authentification |
    | ------------ | ------------------------------ | -------------------------------- | ------------------------------------------- |
    | Moonshot     | `moonshot/`                    | `https://api.moonshot.ai/v1`    | `MOONSHOT_API_KEY`                          |
    | Moonshot CN  | `moonshot/`                    | `https://api.moonshot.cn/v1`    | `MOONSHOT_API_KEY`                          |
    | Kimi Coding  | `kimi/`                        | Point de terminaison Kimi Coding | `KIMI_API_KEY`                              |
    | Recherche web | S/O                           | Identique à la région de l’API Moonshot | `KIMI_API_KEY` ou `MOONSHOT_API_KEY`  |

    - La recherche web Kimi utilise `KIMI_API_KEY` ou `MOONSHOT_API_KEY` et emploie par défaut `https://api.moonshot.ai/v1` avec le modèle `kimi-k2.6`.
    - Remplacez les métadonnées de tarification et de contexte dans `models.providers` si nécessaire.
    - Si Moonshot publie des limites de contexte différentes pour un modèle, ajustez `contextWindow` en conséquence.

  </Accordion>
</AccordionGroup>

## Ressources connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèle et du comportement de basculement.
  </Card>
  <Card title="Recherche web" href="/fr/tools/web" icon="magnifying-glass">
    Configuration des fournisseurs de recherche web, notamment Kimi.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet pour les fournisseurs, les modèles et les plugins.
  </Card>
  <Card title="Plateforme ouverte Moonshot" href="https://platform.moonshot.ai" icon="globe">
    Gestion des clés API Moonshot et documentation.
  </Card>
</CardGroup>
