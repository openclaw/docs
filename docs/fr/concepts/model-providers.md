---
read_when:
    - Vous avez besoin d’une référence de configuration des modèles, fournisseur par fournisseur
    - Vous souhaitez des exemples de configurations ou des commandes d’intégration CLI pour les fournisseurs de modèles
sidebarTitle: Model providers
summary: Vue d’ensemble des fournisseurs de modèles avec exemples de configurations + flux CLI
title: Fournisseurs de modèles
x-i18n:
    generated_at: "2026-04-30T07:22:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3902194674d6d4e17a8477c28addb39b8e04c3b498eb6a0305e82c2f1b5d737e
    source_path: concepts/model-providers.md
    workflow: 16
---

Référence pour les **fournisseurs de LLM/modèles** (pas les canaux de chat comme WhatsApp/Telegram). Pour les règles de sélection des modèles, consultez [Modèles](/fr/concepts/models).

## Règles rapides

<AccordionGroup>
  <Accordion title="Références de modèles et assistants CLI">
    - Les références de modèles utilisent `provider/model` (exemple : `opencode/claude-opus-4-6`).
    - `agents.defaults.models` agit comme une liste d’autorisation lorsqu’il est défini.
    - Assistants CLI : `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` définissent les valeurs par défaut au niveau du fournisseur ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` les remplacent par modèle.
    - Règles de repli, sondes de délai de récupération et persistance des remplacements de session : [Basculement de modèle](/fr/concepts/model-failover).

  </Accordion>
  <Accordion title="Séparation fournisseur/runtime OpenAI">
    Les routes de la famille OpenAI sont propres au préfixe :

    - `openai/<model>` utilise le fournisseur à clé API OpenAI directe dans PI.
    - `openai-codex/<model>` utilise OAuth Codex dans PI.
    - `openai/<model>` avec `agents.defaults.agentRuntime.id: "codex"` utilise le harnais serveur d’application Codex natif.

    Consultez [OpenAI](/fr/providers/openai) et [Harnais Codex](/fr/plugins/codex-harness). Si la séparation fournisseur/runtime prête à confusion, lisez d’abord [Runtimes d’agent](/fr/concepts/agent-runtimes).

    L’activation automatique des Plugins suit la même limite : `openai-codex/<model>` appartient au Plugin OpenAI, tandis que le Plugin Codex est activé par `agentRuntime.id: "codex"` ou par les anciennes références `codex/<model>`.

    GPT-5.5 est disponible via `openai/gpt-5.5` pour le trafic à clé API directe, `openai-codex/gpt-5.5` dans PI pour OAuth Codex, et le harnais serveur d’application Codex natif lorsque `agentRuntime.id: "codex"` est défini.

  </Accordion>
  <Accordion title="Runtimes CLI">
    Les runtimes CLI utilisent la même séparation : choisissez des références de modèles canoniques comme `anthropic/claude-*`, `google/gemini-*` ou `openai/gpt-*`, puis définissez `agents.defaults.agentRuntime.id` sur `claude-cli`, `google-gemini-cli` ou `codex-cli` lorsque vous voulez un backend CLI local.

    Les anciennes références `claude-cli/*`, `google-gemini-cli/*` et `codex-cli/*` sont migrées vers les références de fournisseurs canoniques, avec le runtime enregistré séparément.

  </Accordion>
</AccordionGroup>

## Comportement de fournisseur détenu par les Plugins

La plupart de la logique propre aux fournisseurs se trouve dans les Plugins de fournisseurs (`registerProvider(...)`), tandis qu’OpenClaw conserve la boucle d’inférence générique. Les Plugins possèdent l’onboarding, les catalogues de modèles, la correspondance des variables d’environnement d’authentification, la normalisation transport/configuration, le nettoyage des schémas d’outils, la classification de basculement, l’actualisation OAuth, les rapports d’utilisation, les profils de réflexion/raisonnement, et plus encore.

La liste complète des hooks du SDK fournisseur et des exemples de Plugins groupés se trouve dans [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins). Un fournisseur qui a besoin d’un exécuteur de requêtes entièrement personnalisé relève d’une surface d’extension distincte et plus profonde.

<Note>
Le comportement de runner détenu par le fournisseur réside sur des hooks de fournisseur explicites, comme la politique de relecture, la normalisation des schémas d’outils, l’enveloppement de flux et les assistants de transport/requête. L’ancien sac statique `ProviderPlugin.capabilities` existe uniquement pour compatibilité et n’est plus lu par la logique de runner partagée.
</Note>

## Rotation des clés API

<AccordionGroup>
  <Accordion title="Sources des clés et priorité">
    Configurez plusieurs clés via :

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (remplacement live unique, priorité la plus élevée)
    - `<PROVIDER>_API_KEYS` (liste séparée par des virgules ou des points-virgules)
    - `<PROVIDER>_API_KEY` (clé principale)
    - `<PROVIDER>_API_KEY_*` (liste numérotée, par exemple `<PROVIDER>_API_KEY_1`)

    Pour les fournisseurs Google, `GOOGLE_API_KEY` est aussi inclus comme repli. L’ordre de sélection des clés préserve la priorité et déduplique les valeurs.

  </Accordion>
  <Accordion title="Quand la rotation s’active">
    - Les requêtes sont réessayées avec la clé suivante uniquement sur les réponses de limitation de débit (par exemple `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, ou des messages périodiques de limite d’utilisation).
    - Les échecs qui ne relèvent pas d’une limitation de débit échouent immédiatement ; aucune rotation de clé n’est tentée.
    - Lorsque toutes les clés candidates échouent, l’erreur finale est renvoyée depuis la dernière tentative.

  </Accordion>
</AccordionGroup>

## Fournisseurs intégrés (catalogue pi-ai)

OpenClaw est livré avec le catalogue pi‑ai. Ces fournisseurs ne nécessitent **aucune** configuration `models.providers` ; définissez simplement l’authentification et choisissez un modèle.

### OpenAI

- Fournisseur : `openai`
- Authentification : `OPENAI_API_KEY`
- Rotation facultative : `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (remplacement unique)
- Modèles d’exemple : `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Vérifiez la disponibilité du compte/modèle avec `openclaw models list --provider openai` si une installation ou une clé d’API spécifique se comporte différemment.
- CLI : `openclaw onboard --auth-choice openai-api-key`
- Le transport par défaut est `auto` (WebSocket d’abord, repli SSE)
- Remplacement par modèle via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- Le préchauffage OpenAI Responses WebSocket est activé par défaut via `params.openaiWsWarmup` (`true`/`false`)
- Le traitement prioritaire OpenAI peut être activé via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` et `params.fastMode` mappent les requêtes Responses directes `openai/*` vers `service_tier=priority` sur `api.openai.com`
- Utilisez `params.serviceTier` lorsque vous voulez un niveau explicite au lieu du basculeur partagé `/fast`
- Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) s’appliquent uniquement au trafic OpenAI natif vers `api.openai.com`, pas aux proxys génériques compatibles OpenAI
- Les routes OpenAI natives conservent également `store` de Responses, les indications de cache d’invite et la mise en forme de charge utile compatible avec le raisonnement OpenAI ; les routes proxy ne le font pas
- `openai/gpt-5.3-codex-spark` est volontairement supprimé dans OpenClaw, car les requêtes API OpenAI en direct le rejettent et le catalogue Codex actuel ne l’expose pas

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Fournisseur : `anthropic`
- Authentification : `ANTHROPIC_API_KEY`
- Rotation facultative : `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (remplacement unique)
- Modèle d’exemple : `anthropic/claude-opus-4-6`
- CLI : `openclaw onboard --auth-choice apiKey`
- Les requêtes Anthropic publiques directes prennent en charge le basculeur partagé `/fast` et `params.fastMode`, y compris le trafic authentifié par clé d’API et OAuth envoyé à `api.anthropic.com` ; OpenClaw mappe cela vers le `service_tier` Anthropic (`auto` contre `standard_only`)
- La configuration Claude CLI préférée conserve la référence de modèle canonique et sélectionne séparément le backend CLI : `anthropic/claude-opus-4-7` avec `agents.defaults.agentRuntime.id: "claude-cli"`. Les anciennes références `claude-cli/claude-opus-4-7` fonctionnent toujours pour compatibilité.

<Note>
Le personnel d’Anthropic nous a indiqué que l’utilisation de Claude CLI de style OpenClaw est à nouveau autorisée ; OpenClaw considère donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme approuvées pour cette intégration, sauf si Anthropic publie une nouvelle politique. Le jeton de configuration Anthropic reste disponible comme chemin de jeton OpenClaw pris en charge, mais OpenClaw privilégie désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Fournisseur : `openai-codex`
- Authentification : OAuth (ChatGPT)
- Référence de modèle PI : `openai-codex/gpt-5.5`
- Référence du harnais serveur d’application Codex natif : `openai/gpt-5.5` avec `agents.defaults.agentRuntime.id: "codex"`
- Documentation du harnais serveur d’application Codex natif : [Harnais Codex](/fr/plugins/codex-harness)
- Anciennes références de modèles : `codex/gpt-*`
- Limite du Plugin : `openai-codex/*` charge le Plugin OpenAI ; le Plugin serveur d’application Codex natif est sélectionné uniquement par le runtime du harnais Codex ou les anciennes références `codex/*`.
- CLI : `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- Le transport par défaut est `auto` (WebSocket d’abord, repli SSE)
- Remplacement par modèle PI via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` est également transféré sur les requêtes Responses Codex natives (`chatgpt.com/backend-api`)
- Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) sont ajoutés uniquement au trafic Codex natif vers `chatgpt.com/backend-api`, pas aux proxys génériques compatibles OpenAI
- Partage la même configuration de basculeur `/fast` et `params.fastMode` que le `openai/*` direct ; OpenClaw mappe cela vers `service_tier=priority`
- `openai-codex/gpt-5.5` utilise le `contextWindow = 400000` natif du catalogue Codex et le runtime par défaut `contextTokens = 272000` ; remplacez la limite de runtime avec `models.providers.openai-codex.models[].contextTokens`
- Note de politique : OpenAI Codex OAuth est explicitement pris en charge pour les outils/flux de travail externes comme OpenClaw.
- Utilisez `openai-codex/gpt-5.5` lorsque vous voulez la route OAuth/abonnement Codex ; utilisez `openai/gpt-5.5` lorsque votre configuration par clé d’API et votre catalogue local exposent la route d’API publique.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

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

### Autres options hébergées de type abonnement

<CardGroup cols={3}>
  <Card title="GLM models" href="/fr/providers/glm">
    Z.AI Coding Plan ou points de terminaison d’API généraux.
  </Card>
  <Card title="MiniMax" href="/fr/providers/minimax">
    Accès MiniMax Coding Plan OAuth ou par clé d’API.
  </Card>
  <Card title="Qwen Cloud" href="/fr/providers/qwen">
    Surface de fournisseur Qwen Cloud plus mappage des points de terminaison Alibaba DashScope et Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Authentification : `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Fournisseur de runtime Zen : `opencode`
- Fournisseur de runtime Go : `opencode-go`
- Modèles d’exemple : `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (clé d’API)

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY`
- Rotation facultative : `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, repli `GOOGLE_API_KEY` et `OPENCLAW_LIVE_GEMINI_KEY` (remplacement unique)
- Modèles d’exemple : `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilité : l’ancienne configuration OpenClaw utilisant `google/gemini-3.1-flash-preview` est normalisée en `google/gemini-3-flash-preview`
- Alias : `google/gemini-3.1-pro` est accepté et normalisé vers l’identifiant d’API Gemini en direct de Google, `google/gemini-3.1-pro-preview`
- CLI : `openclaw onboard --auth-choice gemini-api-key`
- Réflexion : `/think adaptive` utilise la réflexion dynamique de Google. Gemini 3/3.1 omettent un `thinkingLevel` fixe ; Gemini 2.5 envoie `thinkingBudget: -1`.
- Les exécutions Gemini directes acceptent également `agents.defaults.models["google/<model>"].params.cachedContent` (ou l’ancien `cached_content`) pour transférer un handle `cachedContents/...` natif du fournisseur ; les succès du cache Gemini apparaissent comme `cacheRead` OpenClaw

### Google Vertex et Gemini CLI

- Fournisseurs : `google-vertex`, `google-gemini-cli`
- Authentification : Vertex utilise gcloud ADC ; Gemini CLI utilise son flux OAuth

<Warning>
Gemini CLI OAuth dans OpenClaw est une intégration non officielle. Certains utilisateurs ont signalé des restrictions de compte Google après l’utilisation de clients tiers. Consultez les conditions de Google et utilisez un compte non critique si vous choisissez de continuer.
</Warning>

Gemini CLI OAuth est livré dans le cadre du Plugin `google` inclus.

<Steps>
  <Step title="Install Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modèle par défaut : `google-gemini-cli/gemini-3-flash-preview`. Vous ne collez **pas** d’ID client ni de secret dans `openclaw.json`. Le flux de connexion de la CLI stocke les jetons dans des profils d’authentification sur l’hôte du Gateway.

  </Step>
  <Step title="Set project (if needed)">
    Si les requêtes échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte du Gateway.
  </Step>
</Steps>

Les réponses JSON de la CLI Gemini sont analysées depuis `response` ; l’utilisation se rabat sur `stats`, avec `stats.cached` normalisé en `cacheRead` OpenClaw.

### Z.AI (GLM)

- Fournisseur : `zai`
- Authentification : `ZAI_API_KEY`
- Modèle d’exemple : `zai/glm-5.1`
- CLI : `openclaw onboard --auth-choice zai-api-key`
  - Alias : `z.ai/*` et `z-ai/*` sont normalisés en `zai/*`
  - `zai-api-key` détecte automatiquement le point de terminaison Z.AI correspondant ; `zai-coding-global`, `zai-coding-cn`, `zai-global` et `zai-cn` forcent une surface spécifique

### Vercel AI Gateway

- Fournisseur : `vercel-ai-gateway`
- Authentification : `AI_GATEWAY_API_KEY`
- Modèles d’exemple : `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Fournisseur : `kilocode`
- Authentification : `KILOCODE_API_KEY`
- Modèle d’exemple : `kilocode/kilo/auto`
- CLI : `openclaw onboard --auth-choice kilocode-api-key`
- URL de base : `https://api.kilo.ai/api/gateway/`
- Le catalogue de repli statique fournit `kilocode/kilo/auto` ; la découverte en direct via `https://api.kilo.ai/api/gateway/models` peut étendre davantage le catalogue d’exécution.
- Le routage amont exact derrière `kilocode/kilo/auto` appartient à Kilo Gateway, il n’est pas codé en dur dans OpenClaw.

Consultez [/providers/kilocode](/fr/providers/kilocode) pour les détails de configuration.

### Autres plugins de fournisseurs inclus

| Fournisseur             | Id                               | Env d’authentification                                      | Modèle d’exemple                            |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                  |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Particularités utiles à connaître

<AccordionGroup>
  <Accordion title="OpenRouter">
    Applique ses en-têtes d’attribution d’application et les marqueurs Anthropic `cache_control` uniquement sur les routes `openrouter.ai` vérifiées. Les références DeepSeek, Moonshot et ZAI sont éligibles au TTL de cache pour la mise en cache des prompts gérée par OpenRouter, mais ne reçoivent pas de marqueurs de cache Anthropic. En tant que chemin compatible OpenAI de type proxy, il ignore la mise en forme réservée au natif OpenAI (`serviceTier`, Responses `store`, indices de cache de prompt, compatibilité de raisonnement OpenAI). Les références adossées à Gemini conservent uniquement l’assainissement des signatures de pensée proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Les références adossées à Gemini suivent le même chemin d’assainissement proxy-Gemini ; `kilocode/kilo/auto` et les autres références proxy ne prenant pas en charge le raisonnement ignorent l’injection de raisonnement proxy.
  </Accordion>
  <Accordion title="MiniMax">
    L’intégration par clé API écrit des définitions explicites de modèles de chat M2.7 texte uniquement ; la compréhension d’images reste sur le fournisseur multimédia `MiniMax-VL-01` appartenant au Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Les ID de modèle utilisent un espace de noms `nvidia/<vendor>/<model>` (par exemple `nvidia/nvidia/nemotron-...` avec `nvidia/moonshotai/kimi-k2.5`) ; les sélecteurs conservent la composition littérale `<provider>/<model-id>`, tandis que la clé canonique envoyée à l’API reste préfixée une seule fois.
  </Accordion>
  <Accordion title="xAI">
    Utilise le chemin xAI Responses. `/fast` ou `params.fastMode: true` réécrit `grok-3`, `grok-3-mini`, `grok-4` et `grok-4-0709` vers leurs variantes `*-fast`. `tool_stream` est activé par défaut ; désactivez-le via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Fourni comme Plugin fournisseur `cerebras` inclus. GLM utilise `zai-glm-4.7` ; l’URL de base compatible OpenAI est `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Fournisseurs via `models.providers` (URL personnalisée/de base)

Utilisez `models.providers` (ou `models.json`) pour ajouter des fournisseurs **personnalisés** ou des proxys compatibles OpenAI/Anthropic.

Beaucoup des plugins de fournisseurs inclus ci-dessous publient déjà un catalogue par défaut. Utilisez des entrées explicites `models.providers.<id>` uniquement lorsque vous voulez remplacer l’URL de base, les en-têtes ou la liste de modèles par défaut.

Les vérifications de capacités des modèles du Gateway lisent aussi les métadonnées explicites `models.providers.<id>.models[]`. Si un modèle personnalisé ou proxy accepte les images, définissez `input: ["text", "image"]` sur ce modèle afin que WebChat et les chemins de pièces jointes d’origine nœud transmettent les images comme entrées natives du modèle plutôt que comme références multimédias texte uniquement.

### Moonshot AI (Kimi)

Moonshot est fourni comme Plugin fournisseur inclus. Utilisez le fournisseur intégré par défaut, et ajoutez une entrée explicite `models.providers.moonshot` uniquement lorsque vous devez remplacer l’URL de base ou les métadonnées de modèle :

- Fournisseur : `moonshot`
- Authentification : `MOONSHOT_API_KEY`
- Modèle d’exemple : `moonshot/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

ID de modèle Kimi K2 :

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Codage Kimi

Le codage Kimi utilise le point de terminaison compatible avec Anthropic de Moonshot AI :

- Fournisseur : `kimi`
- Authentification : `KIMI_API_KEY`
- Modèle d'exemple : `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

L'ancien `kimi/k2p5` reste accepté comme identifiant de modèle de compatibilité.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) donne accès à Doubao et à d'autres modèles en Chine.

- Fournisseur : `volcengine` (codage : `volcengine-plan`)
- Authentification : `VOLCANO_ENGINE_API_KEY`
- Modèle d'exemple : `volcengine-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

L'intégration utilise par défaut la surface de codage, mais le catalogue général `volcengine/*` est enregistré en même temps.

Dans les sélecteurs de modèle d'intégration et de configuration, le choix d'authentification Volcengine privilégie les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas encore chargés, OpenClaw revient au catalogue non filtré au lieu d'afficher un sélecteur limité au fournisseur vide.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (International)

BytePlus ARK donne accès aux mêmes modèles que Volcano Engine pour les utilisateurs internationaux.

- Fournisseur : `byteplus` (codage : `byteplus-plan`)
- Authentification : `BYTEPLUS_API_KEY`
- Modèle d'exemple : `byteplus-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L'intégration utilise par défaut la surface de codage, mais le catalogue général `byteplus/*` est enregistré en même temps.

Dans les sélecteurs de modèles d'intégration/configuration, le choix d'authentification BytePlus privilégie à la fois les lignes `byteplus/*` et `byteplus-plan/*`. Si ces modèles ne sont pas encore chargés, OpenClaw revient au catalogue non filtré au lieu d'afficher un sélecteur limité au fournisseur vide.

<Tabs>
  <Tab title="Modèles standard">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modèles de codage (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic fournit des modèles compatibles Anthropic derrière le fournisseur `synthetic` :

- Fournisseur : `synthetic`
- Authentification : `SYNTHETIC_API_KEY`
- Exemple de modèle : `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI : `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax est configuré via `models.providers`, car il utilise des points de terminaison personnalisés :

- MiniMax OAuth (Global) : `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN) : `--auth-choice minimax-cn-oauth`
- Clé API MiniMax (Global) : `--auth-choice minimax-global-api`
- Clé API MiniMax (CN) : `--auth-choice minimax-cn-api`
- Authentification : `MINIMAX_API_KEY` pour `minimax` ; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` pour `minimax-portal`

Consultez [/providers/minimax](/fr/providers/minimax) pour les détails de configuration, les options de modèles et les extraits de configuration.

<Note>
Sur le chemin de streaming compatible Anthropic de MiniMax, OpenClaw désactive thinking par défaut sauf si vous le définissez explicitement, et `/fast on` réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
</Note>

Répartition des capacités appartenant au plugin :

- Les valeurs par défaut texte/chat restent sur `minimax/MiniMax-M2.7`
- La génération d'images est `minimax/image-01` ou `minimax-portal/image-01`
- La compréhension d'images appartient au plugin `MiniMax-VL-01` sur les deux chemins d'authentification MiniMax
- La recherche web reste sur l'id de fournisseur `minimax`

### LM Studio

LM Studio est fourni comme plugin de fournisseur intégré qui utilise l'API native :

- Fournisseur : `lmstudio`
- Authentification : `LM_API_TOKEN`
- URL de base d'inférence par défaut : `http://localhost:1234/v1`

Définissez ensuite un modèle (remplacez par l'un des ID renvoyés par `http://localhost:1234/api/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw utilise les API natives `/api/v1/models` et `/api/v1/models/load` de LM Studio pour la découverte + le chargement automatique, avec `/v1/chat/completions` pour l'inférence par défaut. Consultez [/providers/lmstudio](/fr/providers/lmstudio) pour la configuration et le dépannage.

### Ollama

Ollama est fourni comme plugin de fournisseur intégré et utilise l'API native d'Ollama :

- Fournisseur : `ollama`
- Authentification : aucune requise (serveur local)
- Exemple de modèle : `ollama/llama3.3`
- Installation : [https://ollama.com/download](https://ollama.com/download)

```bash
# Installez Ollama, puis récupérez un modèle :
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama est détecté localement à `http://127.0.0.1:11434` lorsque vous l'activez avec `OLLAMA_API_KEY`, et le plugin de fournisseur intégré ajoute Ollama directement à `openclaw onboard` et au sélecteur de modèles. Consultez [/providers/ollama](/fr/providers/ollama) pour l'intégration, le mode cloud/local et la configuration personnalisée.

### vLLM

vLLM est fourni comme plugin de fournisseur intégré pour les serveurs locaux/auto-hébergés compatibles OpenAI :

- Fournisseur : `vllm`
- Authentification : facultative (dépend de votre serveur)
- URL de base par défaut : `http://127.0.0.1:8000/v1`

Pour activer la découverte automatique localement (n'importe quelle valeur fonctionne si votre serveur n'impose pas l'authentification) :

```bash
export VLLM_API_KEY="vllm-local"
```

Définissez ensuite un modèle (remplacez par l'un des ID renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consultez [/providers/vllm](/fr/providers/vllm) pour plus de détails.

### SGLang

SGLang est fourni comme plugin de fournisseur intégré pour des serveurs auto-hébergés rapides compatibles OpenAI :

- Fournisseur : `sglang`
- Authentification : facultative (dépend de votre serveur)
- URL de base par défaut : `http://127.0.0.1:30000/v1`

Pour activer la découverte automatique localement (n'importe quelle valeur fonctionne si votre serveur n'impose pas l'authentification) :

```bash
export SGLANG_API_KEY="sglang-local"
```

Définissez ensuite un modèle (remplacez par l'un des ID renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consultez [/providers/sglang](/fr/providers/sglang) pour plus de détails.

### Proxys locaux (LM Studio, vLLM, LiteLLM, etc.)

Exemple (compatible OpenAI) :

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Champs facultatifs par défaut">
    Pour les fournisseurs personnalisés, `reasoning`, `input`, `cost`, `contextWindow` et `maxTokens` sont facultatifs. Lorsqu'ils sont omis, OpenClaw utilise par défaut :

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recommandé : définissez des valeurs explicites qui correspondent aux limites de votre proxy/modèle.

  </Accordion>
  <Accordion title="Règles de mise en forme des routes proxy">
    - Pour `api: "openai-completions"` sur des points de terminaison non natifs (tout `baseUrl` non vide dont l'hôte n'est pas `api.openai.com`), OpenClaw force `compat.supportsDeveloperRole: false` afin d'éviter les erreurs 400 fournisseur pour les rôles `developer` non pris en charge.
    - Les routes compatibles OpenAI de style proxy ignorent également la mise en forme des requêtes propre à OpenAI native : pas de `service_tier`, pas de `store` Responses, pas de `store` Completions, pas d'indications de cache de prompt, pas de mise en forme de charge utile de compatibilité de raisonnement OpenAI, et pas d'en-têtes d'attribution OpenClaw masqués.
    - Pour les proxys Completions compatibles OpenAI qui nécessitent des champs propres au fournisseur, définissez `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) pour fusionner du JSON supplémentaire dans le corps de requête sortant.
    - Pour les contrôles de chat-template vLLM, définissez `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Le plugin vLLM intégré envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` pour `vllm/nemotron-3-*` lorsque le niveau de thinking de la session est désactivé.
    - Pour les modèles locaux lents ou les hôtes LAN/tailnet distants, définissez `models.providers.<id>.timeoutSeconds`. Cela étend la gestion des requêtes HTTP de modèle fournisseur, y compris la connexion, les en-têtes, le streaming du corps et l'abandon guarded-fetch total, sans augmenter le délai d'expiration de l'ensemble de l'exécution de l'agent.
    - Si `baseUrl` est vide/omis, OpenClaw conserve le comportement OpenAI par défaut (qui se résout en `api.openai.com`).
    - Par sécurité, un `compat.supportsDeveloperRole: true` explicite est toujours remplacé sur les points de terminaison `openai-completions` non natifs.
    - Pour `api: "anthropic-messages"` sur des points de terminaison non directs (tout fournisseur autre que le `anthropic` canonique, ou un `models.providers.anthropic.baseUrl` personnalisé dont l'hôte n'est pas un point de terminaison public `api.anthropic.com`), OpenClaw supprime les en-têtes bêta Anthropic implicites comme `claude-code-20250219`, `interleaved-thinking-2025-05-14` et les marqueurs OAuth, afin que les proxys personnalisés compatibles Anthropic ne rejettent pas les indicateurs bêta non pris en charge. Définissez explicitement `models.providers.<id>.headers["anthropic-beta"]` si votre proxy nécessite des fonctionnalités bêta spécifiques.

  </Accordion>
</AccordionGroup>

## Exemples CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Voir aussi : [Configuration](/fr/gateway/configuration) pour des exemples de configuration complets.

## Connexe

- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — clés de configuration des modèles
- [Basculement de modèle](/fr/concepts/model-failover) — chaînes de secours et comportement de nouvelle tentative
- [Modèles](/fr/concepts/models) — configuration des modèles et alias
- [Fournisseurs](/fr/providers) — guides de configuration par fournisseur
