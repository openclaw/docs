---
read_when:
    - Vous avez besoin d’une référence de configuration des modèles fournisseur par fournisseur
    - Vous voulez des exemples de configuration ou des commandes d’onboarding CLI pour les fournisseurs de modèles
summary: Vue d’ensemble des fournisseurs de modèles avec exemples de configuration + flux CLI
title: Fournisseurs de modèles
x-i18n:
    generated_at: "2026-04-25T13:45:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

Référence des **fournisseurs LLM/modèles** (et non des canaux de chat comme WhatsApp/Telegram). Pour les règles de sélection des modèles, voir [Modèles](/fr/concepts/models).

## Règles rapides

- Les références de modèle utilisent `provider/model` (exemple : `opencode/claude-opus-4-6`).
- `agents.defaults.models` agit comme une liste d’autorisation lorsqu’il est défini.
- Helpers CLI : `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` est une métadonnée native du modèle ; `contextTokens` est le plafond effectif du runtime.
- Règles de repli, sondes de cooldown et persistance des remplacements de session : [Basculement de modèle](/fr/concepts/model-failover).
- Les routes de la famille OpenAI sont spécifiques au préfixe : `openai/<model>` utilise le fournisseur direct à clé API OpenAI dans PI, `openai-codex/<model>` utilise l’OAuth Codex dans PI, et `openai/<model>` plus `agents.defaults.embeddedHarness.runtime: "codex"` utilise le harness natif app-server Codex. Voir [OpenAI](/fr/providers/openai)
  et [Harness Codex](/fr/plugins/codex-harness). Si la séparation fournisseur/runtime
  vous semble confuse, lisez d’abord [Runtimes d’agent](/fr/concepts/agent-runtimes).
- L’activation automatique des plugins suit cette même frontière : `openai-codex/<model>` appartient
  au plugin OpenAI, tandis que le plugin Codex est activé par
  `embeddedHarness.runtime: "codex"` ou par les anciennes références `codex/<model>`.
- Les runtimes CLI utilisent la même séparation : choisissez des références de modèle canoniques telles que
  `anthropic/claude-*`, `google/gemini-*` ou `openai/gpt-*`, puis définissez
  `agents.defaults.embeddedHarness.runtime` sur `claude-cli`,
  `google-gemini-cli` ou `codex-cli` lorsque vous voulez un backend CLI local.
  Les anciennes références `claude-cli/*`, `google-gemini-cli/*` et `codex-cli/*` sont migrées
  vers des références de fournisseur canoniques avec le runtime enregistré séparément.
- GPT-5.5 est disponible via `openai-codex/gpt-5.5` dans PI, le harness natif
  app-server Codex et l’API publique OpenAI lorsque le catalogue PI intégré
  expose `openai/gpt-5.5` pour votre installation.

## Comportement des fournisseurs géré par les plugins

La plupart de la logique spécifique aux fournisseurs se trouve dans les plugins de fournisseur (`registerProvider(...)`) tandis qu’OpenClaw conserve la boucle d’inférence générique. Les plugins gèrent l’onboarding, les catalogues de modèles, le mapping des variables d’environnement d’authentification, la normalisation du transport/de la configuration, le nettoyage des schémas d’outils, la classification de basculement, le rafraîchissement OAuth, le reporting d’usage, les profils de réflexion/raisonnement, et plus encore.

La liste complète des hooks du SDK fournisseur et des exemples de plugins intégrés se trouve dans [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins). Un fournisseur qui a besoin d’un exécuteur de requête totalement personnalisé relève d’une autre surface d’extension, plus profonde.

<Note>
Les `capabilities` runtime du fournisseur sont des métadonnées partagées du runner (famille de fournisseur, particularités de transcription/outillage, indications de transport/cache). Ce n’est pas la même chose que le [modèle de capacité public](/fr/plugins/architecture#public-capability-model), qui décrit ce qu’un plugin enregistre (inférence texte, parole, etc.).
</Note>

## Rotation des clés API

- Prend en charge une rotation générique des fournisseurs pour certains fournisseurs.
- Configurez plusieurs clés via :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (remplacement live unique, priorité la plus élevée)
  - `<PROVIDER>_API_KEYS` (liste séparée par des virgules ou des points-virgules)
  - `<PROVIDER>_API_KEY` (clé principale)
  - `<PROVIDER>_API_KEY_*` (liste numérotée, par exemple `<PROVIDER>_API_KEY_1`)
- Pour les fournisseurs Google, `GOOGLE_API_KEY` est aussi inclus comme solution de repli.
- L’ordre de sélection des clés préserve la priorité et déduplique les valeurs.
- Les requêtes sont réessayées avec la clé suivante uniquement en cas de réponses de limitation de débit (par
  exemple `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, ou des messages périodiques de limite d’usage).
- Les échecs hors limitation de débit échouent immédiatement ; aucune rotation de clé n’est tentée.
- Lorsque toutes les clés candidates échouent, l’erreur finale renvoyée provient de la dernière tentative.

## Fournisseurs intégrés (catalogue pi-ai)

OpenClaw est livré avec le catalogue pi‑ai. Ces fournisseurs ne nécessitent **aucune**
configuration `models.providers` ; définissez simplement l’authentification et choisissez un modèle.

### OpenAI

- Fournisseur : `openai`
- Authentification : `OPENAI_API_KEY`
- Rotation facultative : `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (remplacement unique)
- Exemples de modèles : `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- La prise en charge de l’API directe GPT-5.5 dépend de la version du catalogue PI intégré pour
  votre installation ; vérifiez avec `openclaw models list --provider openai` avant
  d’utiliser `openai/gpt-5.5` sans le runtime app-server Codex.
- CLI : `openclaw onboard --auth-choice openai-api-key`
- Le transport par défaut est `auto` (WebSocket d’abord, SSE en repli)
- Remplacement par modèle via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- Le warm-up WebSocket OpenAI Responses est activé par défaut via `params.openaiWsWarmup` (`true`/`false`)
- Le traitement prioritaire OpenAI peut être activé via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` et `params.fastMode` mappent les requêtes directes `openai/*` Responses vers `service_tier=priority` sur `api.openai.com`
- Utilisez `params.serviceTier` lorsque vous voulez un niveau explicite au lieu du basculement partagé `/fast`
- Les en-têtes d’attribution cachés OpenClaw (`originator`, `version`,
  `User-Agent`) s’appliquent uniquement au trafic OpenAI natif vers `api.openai.com`, pas
  aux proxys génériques compatibles OpenAI
- Les routes OpenAI natives conservent aussi `store` pour Responses, les indications de prompt-cache, et
  le modelage du payload de compatibilité raisonnement OpenAI ; les routes proxy ne le font pas
- `openai/gpt-5.3-codex-spark` est intentionnellement masqué dans OpenClaw parce que les requêtes live vers l’API OpenAI le rejettent et que le catalogue Codex actuel ne l’expose pas

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Fournisseur : `anthropic`
- Authentification : `ANTHROPIC_API_KEY`
- Rotation facultative : `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (remplacement unique)
- Exemple de modèle : `anthropic/claude-opus-4-6`
- CLI : `openclaw onboard --auth-choice apiKey`
- Les requêtes Anthropic publiques directes prennent en charge le basculement partagé `/fast` et `params.fastMode`, y compris le trafic authentifié par clé API et OAuth envoyé à `api.anthropic.com` ; OpenClaw le mappe vers Anthropic `service_tier` (`auto` vs `standard_only`)
- Remarque Anthropic : l’équipe Anthropic nous a indiqué que l’usage de Claude CLI à la manière d’OpenClaw est de nouveau autorisé, donc OpenClaw considère la réutilisation de Claude CLI et l’usage de `claude -p` comme approuvés pour cette intégration, sauf si Anthropic publie une nouvelle politique.
- Le setup-token Anthropic reste disponible comme chemin de jeton pris en charge par OpenClaw, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsque disponibles.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI Codex

- Fournisseur : `openai-codex`
- Authentification : OAuth (ChatGPT)
- Référence de modèle PI : `openai-codex/gpt-5.5`
- Référence du harness natif app-server Codex : `openai/gpt-5.5` avec `agents.defaults.embeddedHarness.runtime: "codex"`
- Documentation du harness natif app-server Codex : [Harness Codex](/fr/plugins/codex-harness)
- Anciennes références de modèle : `codex/gpt-*`
- Frontière de plugin : `openai-codex/*` charge le plugin OpenAI ; le plugin natif
  app-server Codex n’est sélectionné que par le runtime du harness Codex ou les anciennes
  références `codex/*`.
- CLI : `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- Le transport par défaut est `auto` (WebSocket d’abord, SSE en repli)
- Remplacement par modèle PI via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` est aussi transmis sur les requêtes natives Codex Responses (`chatgpt.com/backend-api`)
- Les en-têtes d’attribution cachés OpenClaw (`originator`, `version`,
  `User-Agent`) ne sont attachés qu’au trafic Codex natif vers
  `chatgpt.com/backend-api`, pas aux proxys génériques compatibles OpenAI
- Partage le même basculement `/fast` et la même configuration `params.fastMode` que `openai/*` direct ; OpenClaw le mappe vers `service_tier=priority`
- `openai-codex/gpt-5.5` utilise le `contextWindow = 400000` natif du catalogue Codex et le `contextTokens = 272000` par défaut du runtime ; remplacez le plafond runtime avec `models.providers.openai-codex.models[].contextTokens`
- Note de politique : OAuth OpenAI Codex est explicitement pris en charge pour les outils/workflows externes comme OpenClaw.
- Utilisez `openai-codex/gpt-5.5` lorsque vous voulez la route Codex OAuth/abonnement ; utilisez `openai/gpt-5.5` lorsque votre configuration à clé API et votre catalogue local exposent la route d’API publique.

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

- [Qwen Cloud](/fr/providers/qwen) : surface fournisseur Qwen Cloud plus mapping des endpoints Alibaba DashScope et Coding Plan
- [MiniMax](/fr/providers/minimax) : accès OAuth ou clé API au plan MiniMax Coding
- [Modèles GLM](/fr/providers/glm) : endpoints Z.AI Coding Plan ou API générale

### OpenCode

- Authentification : `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Fournisseur runtime Zen : `opencode`
- Fournisseur runtime Go : `opencode-go`
- Exemples de modèles : `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (clé API)

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY`
- Rotation facultative : `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, solution de repli `GOOGLE_API_KEY`, et `OPENCLAW_LIVE_GEMINI_KEY` (remplacement unique)
- Exemples de modèles : `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilité : l’ancienne configuration OpenClaw utilisant `google/gemini-3.1-flash-preview` est normalisée vers `google/gemini-3-flash-preview`
- CLI : `openclaw onboard --auth-choice gemini-api-key`
- Réflexion : `/think adaptive` utilise la réflexion dynamique Google. Gemini 3/3.1 omettent un
  `thinkingLevel` fixe ; Gemini 2.5 envoie `thinkingBudget: -1`.
- Les exécutions Gemini directes acceptent aussi `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou l’ancien `cached_content`) pour transmettre un handle natif fournisseur
  `cachedContents/...` ; les hits de cache Gemini apparaissent comme `cacheRead` dans OpenClaw

### Google Vertex et Gemini CLI

- Fournisseurs : `google-vertex`, `google-gemini-cli`
- Authentification : Vertex utilise gcloud ADC ; Gemini CLI utilise son flux OAuth
- Attention : l’OAuth Gemini CLI dans OpenClaw est une intégration non officielle. Certains utilisateurs ont signalé des restrictions de compte Google après avoir utilisé des clients tiers. Consultez les conditions Google et utilisez un compte non critique si vous choisissez de poursuivre.
- L’OAuth Gemini CLI est livré dans le plugin `google` intégré.
  - Installez d’abord Gemini CLI :
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Activez : `openclaw plugins enable google`
  - Connectez-vous : `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modèle par défaut : `google-gemini-cli/gemini-3-flash-preview`
  - Remarque : vous ne collez **pas** d’identifiant client ni de secret dans `openclaw.json`. Le flux de connexion CLI stocke
    les jetons dans les profils d’authentification sur l’hôte du gateway.
  - Si les requêtes échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte du gateway.
  - Les réponses JSON Gemini CLI sont analysées depuis `response` ; l’usage se replie sur
    `stats`, avec `stats.cached` normalisé en `cacheRead` OpenClaw.

### Z.AI (GLM)

- Fournisseur : `zai`
- Authentification : `ZAI_API_KEY`
- Exemple de modèle : `zai/glm-5.1`
- CLI : `openclaw onboard --auth-choice zai-api-key`
  - Alias : `z.ai/*` et `z-ai/*` sont normalisés vers `zai/*`
  - `zai-api-key` détecte automatiquement l’endpoint Z.AI correspondant ; `zai-coding-global`, `zai-coding-cn`, `zai-global` et `zai-cn` imposent une surface spécifique

### Vercel AI Gateway

- Fournisseur : `vercel-ai-gateway`
- Authentification : `AI_GATEWAY_API_KEY`
- Exemples de modèles : `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Fournisseur : `kilocode`
- Authentification : `KILOCODE_API_KEY`
- Exemple de modèle : `kilocode/kilo/auto`
- CLI : `openclaw onboard --auth-choice kilocode-api-key`
- URL de base : `https://api.kilo.ai/api/gateway/`
- Le catalogue statique de repli inclut `kilocode/kilo/auto` ; la découverte live via
  `https://api.kilo.ai/api/gateway/models` peut étendre davantage le catalogue
  du runtime.
- Le routage exact en amont derrière `kilocode/kilo/auto` est géré par Kilo Gateway,
  et non codé en dur dans OpenClaw.

Voir [/providers/kilocode](/fr/providers/kilocode) pour les détails de configuration.

### Autres plugins de fournisseur intégrés

| Fournisseur             | Id                               | Variable d’environnement d’authentification                  | Exemple de modèle                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Particularités utiles à connaître :

- **OpenRouter** applique ses en-têtes d’attribution d’application et les marqueurs Anthropic `cache_control` uniquement sur les routes `openrouter.ai` vérifiées. Les références DeepSeek, Moonshot et ZAI sont éligibles au TTL de cache pour le prompt caching géré par OpenRouter, mais ne reçoivent pas les marqueurs de cache Anthropic. En tant que chemin proxy de type compatible OpenAI, il ignore le modelage réservé à OpenAI natif (`serviceTier`, `store` de Responses, indications de prompt-cache, compatibilité de raisonnement OpenAI). Les références adossées à Gemini conservent uniquement l’assainissement de signature de pensée proxy-Gemini.
- **Kilo Gateway** : les références adossées à Gemini suivent le même chemin d’assainissement proxy-Gemini ; `kilocode/kilo/auto` et les autres références proxy sans prise en charge du raisonnement ignorent l’injection de raisonnement proxy.
- **MiniMax** : l’onboarding par clé API écrit des définitions explicites de modèles de chat M2.7 texte uniquement ; la compréhension d’image reste sur le fournisseur média `MiniMax-VL-01` géré par le plugin.
- **xAI** utilise le chemin xAI Responses. `/fast` ou `params.fastMode: true` réécrit `grok-3`, `grok-3-mini`, `grok-4` et `grok-4-0709` vers leurs variantes `*-fast`. `tool_stream` est activé par défaut ; désactivez-le via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** : les modèles GLM utilisent `zai-glm-4.7` / `zai-glm-4.6` ; l’URL de base compatible OpenAI est `https://api.cerebras.ai/v1`.

## Fournisseurs via `models.providers` (personnalisé/URL de base)

Utilisez `models.providers` (ou `models.json`) pour ajouter des fournisseurs **personnalisés** ou des proxys compatibles OpenAI/Anthropic.

Beaucoup des plugins de fournisseur intégrés ci-dessous publient déjà un catalogue par défaut.
Utilisez des entrées explicites `models.providers.<id>` uniquement lorsque vous voulez remplacer l’URL de base,
les en-têtes ou la liste des modèles par défaut.

### Moonshot AI (Kimi)

Moonshot est fourni comme plugin de fournisseur intégré. Utilisez le fournisseur intégré par
défaut, et ajoutez une entrée explicite `models.providers.moonshot` uniquement lorsque vous
devez remplacer l’URL de base ou les métadonnées du modèle :

- Fournisseur : `moonshot`
- Authentification : `MOONSHOT_API_KEY`
- Exemple de modèle : `moonshot/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

Identifiants de modèle Kimi K2 :

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

### Kimi Coding

Kimi Coding utilise l’endpoint compatible Anthropic de Moonshot AI :

- Fournisseur : `kimi`
- Authentification : `KIMI_API_KEY`
- Exemple de modèle : `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

L’ancien `kimi/k2p5` reste accepté comme identifiant de modèle de compatibilité.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fournit un accès à Doubao et à d’autres modèles en Chine.

- Fournisseur : `volcengine` (coding : `volcengine-plan`)
- Authentification : `VOLCANO_ENGINE_API_KEY`
- Exemple de modèle : `volcengine-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

L’onboarding utilise par défaut la surface coding, mais le catalogue général `volcengine/*`
est enregistré en même temps.

Dans les sélecteurs de modèles d’onboarding/configure, le choix d’authentification Volcengine privilégie à la fois
les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas encore chargés,
OpenClaw revient au catalogue non filtré au lieu d’afficher un sélecteur vide
limité au fournisseur.

Modèles disponibles :

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modèles coding (`volcengine-plan`) :

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (International)

BytePlus ARK fournit un accès aux mêmes modèles que Volcano Engine pour les utilisateurs internationaux.

- Fournisseur : `byteplus` (coding : `byteplus-plan`)
- Authentification : `BYTEPLUS_API_KEY`
- Exemple de modèle : `byteplus-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L’onboarding utilise par défaut la surface coding, mais le catalogue général `byteplus/*`
est enregistré en même temps.

Dans les sélecteurs de modèles d’onboarding/configure, le choix d’authentification BytePlus privilégie à la fois
les lignes `byteplus/*` et `byteplus-plan/*`. Si ces modèles ne sont pas encore chargés,
OpenClaw revient au catalogue non filtré au lieu d’afficher un sélecteur vide
limité au fournisseur.

Modèles disponibles :

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modèles coding (`byteplus-plan`) :

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

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

MiniMax est configuré via `models.providers` parce qu’il utilise des endpoints personnalisés :

- OAuth MiniMax (Global) : `--auth-choice minimax-global-oauth`
- OAuth MiniMax (CN) : `--auth-choice minimax-cn-oauth`
- Clé API MiniMax (Global) : `--auth-choice minimax-global-api`
- Clé API MiniMax (CN) : `--auth-choice minimax-cn-api`
- Authentification : `MINIMAX_API_KEY` pour `minimax` ; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` pour `minimax-portal`

Voir [/providers/minimax](/fr/providers/minimax) pour les détails de configuration, les options de modèle et les extraits de configuration.

Sur le chemin de diffusion compatible Anthropic de MiniMax, OpenClaw désactive Thinking par
défaut sauf si vous le définissez explicitement, et `/fast on` réécrit
`MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.

Séparation des capacités gérée par le plugin :

- Les valeurs par défaut texte/chat restent sur `minimax/MiniMax-M2.7`
- La génération d’image est `minimax/image-01` ou `minimax-portal/image-01`
- La compréhension d’image est le `MiniMax-VL-01` géré par le plugin sur les deux chemins d’authentification MiniMax
- La recherche web reste sur l’identifiant de fournisseur `minimax`

### LM Studio

LM Studio est livré comme plugin de fournisseur intégré qui utilise l’API native :

- Fournisseur : `lmstudio`
- Authentification : `LM_API_TOKEN`
- URL de base d’inférence par défaut : `http://localhost:1234/v1`

Définissez ensuite un modèle (remplacez par l’un des identifiants renvoyés par `http://localhost:1234/api/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw utilise les endpoints natifs LM Studio `/api/v1/models` et `/api/v1/models/load`
pour la découverte + le chargement automatique, avec `/v1/chat/completions` pour l’inférence par défaut.
Voir [/providers/lmstudio](/fr/providers/lmstudio) pour la configuration et le dépannage.

### Ollama

Ollama est livré comme plugin de fournisseur intégré et utilise l’API native d’Ollama :

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

Ollama est détecté localement à `http://127.0.0.1:11434` lorsque vous activez
`OLLAMA_API_KEY`, et le plugin de fournisseur intégré ajoute Ollama directement à
`openclaw onboard` et au sélecteur de modèles. Voir [/providers/ollama](/fr/providers/ollama)
pour l’onboarding, le mode cloud/local et la configuration personnalisée.

### vLLM

vLLM est livré comme plugin de fournisseur intégré pour les serveurs
compatibles OpenAI locaux/autohébergés :

- Fournisseur : `vllm`
- Authentification : facultative (dépend de votre serveur)
- URL de base par défaut : `http://127.0.0.1:8000/v1`

Pour activer la découverte automatique en local (n’importe quelle valeur fonctionne si votre serveur n’impose pas l’authentification) :

```bash
export VLLM_API_KEY="vllm-local"
```

Définissez ensuite un modèle (remplacez par l’un des identifiants renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Voir [/providers/vllm](/fr/providers/vllm) pour les détails.

### SGLang

SGLang est livré comme plugin de fournisseur intégré pour les serveurs
compatibles OpenAI autohébergés rapides :

- Fournisseur : `sglang`
- Authentification : facultative (dépend de votre serveur)
- URL de base par défaut : `http://127.0.0.1:30000/v1`

Pour activer la découverte automatique en local (n’importe quelle valeur fonctionne si votre serveur n’impose pas
l’authentification) :

```bash
export SGLANG_API_KEY="sglang-local"
```

Définissez ensuite un modèle (remplacez par l’un des identifiants renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Voir [/providers/sglang](/fr/providers/sglang) pour les détails.

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

Remarques :

- Pour les fournisseurs personnalisés, `reasoning`, `input`, `cost`, `contextWindow` et `maxTokens` sont facultatifs.
  Lorsqu’ils sont omis, OpenClaw utilise par défaut :
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recommandé : définissez des valeurs explicites correspondant aux limites de votre proxy/modèle.
- Pour `api: "openai-completions"` sur des endpoints non natifs (tout `baseUrl` non vide dont l’hôte n’est pas `api.openai.com`), OpenClaw force `compat.supportsDeveloperRole: false` pour éviter les erreurs fournisseur 400 liées aux rôles `developer` non pris en charge.
- Les routes de type proxy compatibles OpenAI ignorent aussi le modelage de requête réservé à OpenAI natif : pas de `service_tier`, pas de `store` Responses, pas de `store` Completions, pas d’indications de prompt-cache, pas de modelage de payload de compatibilité de raisonnement OpenAI, et pas d’en-têtes d’attribution cachés OpenClaw.
- Pour les proxys Completions compatibles OpenAI qui nécessitent des champs spécifiques au fournisseur,
  définissez `agents.defaults.models["provider/model"].params.extra_body` (ou
  `extraBody`) pour fusionner du JSON supplémentaire dans le corps de la requête sortante.
- Si `baseUrl` est vide/omis, OpenClaw conserve le comportement OpenAI par défaut (qui se résout vers `api.openai.com`).
- Par sécurité, un `compat.supportsDeveloperRole: true` explicite est toujours remplacé sur les endpoints non natifs `openai-completions`.

## Exemples CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Voir aussi : [Configuration](/fr/gateway/configuration) pour des exemples complets de configuration.

## Connexes

- [Modèles](/fr/concepts/models) — configuration des modèles et alias
- [Basculement de modèle](/fr/concepts/model-failover) — chaînes de repli et comportement de retry
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — clés de configuration des modèles
- [Fournisseurs](/fr/providers) — guides de configuration par fournisseur
