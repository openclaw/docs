---
read_when:
    - Vous avez besoin d’une référence de configuration des modèles fournisseur par fournisseur
    - Vous voulez des exemples de configurations ou de commandes d’intégration CLI pour les fournisseurs de modèles
sidebarTitle: Model providers
summary: Présentation des fournisseurs de modèles avec exemples de configuration + flux CLI
title: Fournisseurs de modèles
x-i18n:
    generated_at: "2026-07-04T03:46:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
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
    - Règles de bascule, sondes de refroidissement et persistance des remplacements de session : [Bascule de modèle](/fr/concepts/model-failover).

  </Accordion>
  <Accordion title="Ajouter l’authentification d’un fournisseur ne change pas votre modèle principal">
    `openclaw configure` conserve un `agents.defaults.model.primary` existant lorsque vous ajoutez ou réauthentifiez un fournisseur. `openclaw models auth login` fait de même sauf si vous passez `--set-default`. Les plugins de fournisseur peuvent toujours renvoyer un modèle par défaut recommandé dans leur correctif de configuration d’authentification, mais OpenClaw traite cela comme « rendre ce modèle disponible » lorsqu’un modèle principal existe déjà, et non comme « remplacer le modèle principal actuel ».

    Pour changer intentionnellement le modèle par défaut, utilisez `openclaw models set <provider/model>` ou `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Séparation fournisseur/runtime OpenAI">
    Les routes de la famille OpenAI sont spécifiques au préfixe :

    - `openai/<model>` utilise par défaut le harnais natif de serveur d’application Codex pour les tours d’agent. C’est la configuration d’abonnement ChatGPT/Codex habituelle.
    - les références de modèles Codex héritées sont une configuration héritée que doctor réécrit en `openai/<model>`.
    - `openai/<model>` plus le `agentRuntime.id: "openclaw"` du fournisseur/modèle utilise le runtime intégré d’OpenClaw pour les routes explicites par clé API ou de compatibilité.

    Consultez [OpenAI](/fr/providers/openai) et [Harnais Codex](/fr/plugins/codex-harness). Si la séparation fournisseur/runtime prête à confusion, lisez d’abord [Runtimes d’agent](/fr/concepts/agent-runtimes).

    L’activation automatique des plugins suit la même frontière : les références d’agent `openai/*` activent le plugin Codex pour la route par défaut, et les `agentRuntime.id: "codex"` explicites au niveau fournisseur/modèle ou les références héritées `codex/<model>` l’exigent aussi.

    GPT-5.5 est disponible par défaut via le harnais natif de serveur d’application Codex sur `openai/gpt-5.5`, et via le runtime OpenClaw lorsque la politique de runtime fournisseur/modèle sélectionne explicitement `openclaw`.

  </Accordion>
  <Accordion title="Runtimes CLI">
    Les runtimes CLI utilisent la même séparation : choisissez des références de modèles canoniques comme `anthropic/claude-*` ou `google/gemini-*`, puis définissez la politique de runtime fournisseur/modèle sur `claude-cli` ou `google-gemini-cli` lorsque vous voulez un backend CLI local.

    Les références héritées `claude-cli/*` et `google-gemini-cli/*` migrent vers des références de fournisseur canoniques avec le runtime enregistré séparément. Les références héritées `codex-cli/*` migrent vers `openai/*` et utilisent la route de serveur d’application Codex ; OpenClaw ne conserve plus de backend CLI Codex groupé.

  </Accordion>
</AccordionGroup>

## Comportement de fournisseur détenu par le Plugin

La plupart de la logique propre à un fournisseur vit dans les plugins de fournisseur (`registerProvider(...)`) tandis qu’OpenClaw conserve la boucle d’inférence générique. Les plugins possèdent l’intégration initiale, les catalogues de modèles, le mappage des variables d’environnement d’authentification, la normalisation transport/configuration, le nettoyage des schémas d’outils, la classification de bascule, l’actualisation OAuth, le reporting d’utilisation, les profils de réflexion/raisonnement, et plus encore.

La liste complète des hooks du SDK fournisseur et des exemples de plugins groupés se trouve dans [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins). Un fournisseur qui a besoin d’un exécuteur de requêtes totalement personnalisé relève d’une surface d’extension distincte et plus profonde.

<Note>
Le comportement de runner détenu par le fournisseur vit sur des hooks explicites de fournisseur tels que la politique de replay, la normalisation des schémas d’outils, l’enveloppement de flux et les assistants de transport/requête. L’ancien sac statique `ProviderPlugin.capabilities` est uniquement conservé pour compatibilité et n’est plus lu par la logique de runner partagée.
</Note>

## Rotation des clés API

<AccordionGroup>
  <Accordion title="Sources de clés et priorité">
    Configurez plusieurs clés via :

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (remplacement live unique, priorité la plus élevée)
    - `<PROVIDER>_API_KEYS` (liste séparée par des virgules ou des points-virgules)
    - `<PROVIDER>_API_KEY` (clé principale)
    - `<PROVIDER>_API_KEY_*` (liste numérotée, par ex. `<PROVIDER>_API_KEY_1`)

    Pour les fournisseurs Google, `GOOGLE_API_KEY` est aussi inclus comme solution de repli. L’ordre de sélection des clés conserve la priorité et déduplique les valeurs.

  </Accordion>
  <Accordion title="Quand la rotation se déclenche">
    - Les requêtes sont retentées avec la clé suivante uniquement sur les réponses de limite de débit (par exemple `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, ou les messages périodiques de limite d’utilisation).
    - Les échecs qui ne sont pas liés à une limite de débit échouent immédiatement ; aucune rotation de clé n’est tentée.
    - Lorsque toutes les clés candidates échouent, l’erreur finale est renvoyée depuis la dernière tentative.

  </Accordion>
</AccordionGroup>

## Plugins de fournisseur officiels

Les plugins de fournisseur officiels publient leurs propres lignes de catalogue de modèles. Ces fournisseurs ne nécessitent **aucune** entrée de modèle `models.providers` ; activez le plugin de fournisseur, définissez l’authentification et choisissez un modèle. Utilisez `models.providers` uniquement pour des fournisseurs personnalisés explicites ou des paramètres de requête étroits comme les délais d’expiration.

### OpenAI

- Fournisseur : `openai`
- Authentification : `OPENAI_API_KEY`
- Rotation facultative : `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (remplacement unique)
- Exemples de modèles : `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Vérifiez la disponibilité du compte/modèle avec `openclaw models list --provider openai` si une installation ou une clé API spécifique se comporte différemment.
- CLI : `openclaw onboard --auth-choice openai-api-key`
- Le transport par défaut est `auto` ; OpenClaw transmet le choix de transport au runtime de modèle partagé.
- Remplacez par modèle via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- Le traitement prioritaire OpenAI peut être activé via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` et `params.fastMode` mappent les requêtes Responses directes `openai/*` vers `service_tier=priority` sur `api.openai.com`
- Utilisez `params.serviceTier` lorsque vous voulez un niveau explicite au lieu du basculeur `/fast` partagé
- Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) s’appliquent uniquement au trafic OpenAI natif vers `api.openai.com`, pas aux proxys génériques compatibles OpenAI
- Les routes OpenAI natives conservent aussi `store` de Responses, les indications de cache de prompt et la mise en forme de charge utile compatible avec le raisonnement OpenAI ; les routes proxy ne le font pas
- `openai/gpt-5.3-codex-spark` est disponible via l’authentification d’abonnement OAuth ChatGPT/Codex lorsque votre compte connecté l’expose ; OpenClaw supprime toujours les routes directes par clé API OpenAI et clé API Azure pour ce modèle, car ces transports le rejettent

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Fournisseur : `anthropic`
- Authentification : `ANTHROPIC_API_KEY`
- Rotation facultative : `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (remplacement unique)
- Exemple de modèle : `anthropic/claude-opus-4-6`
- CLI : `openclaw onboard --auth-choice apiKey`
- Les requêtes Anthropic publiques directes prennent en charge le basculeur `/fast` partagé et `params.fastMode`, y compris le trafic authentifié par clé API et OAuth envoyé à `api.anthropic.com` ; OpenClaw mappe cela vers le `service_tier` Anthropic (`auto` contre `standard_only`)
- La configuration Claude CLI préférée conserve la référence de modèle canonique et sélectionne le backend CLI
  séparément : `anthropic/claude-opus-4-8` avec
  le `agentRuntime.id: "claude-cli"` scoped au modèle. Les références héritées
  `claude-cli/claude-opus-4-7` fonctionnent toujours pour compatibilité.

<Note>
Le personnel d’Anthropic nous a indiqué que l’usage de Claude CLI à la manière d’OpenClaw est de nouveau autorisé ; OpenClaw considère donc la réutilisation de Claude CLI et l’usage de `claude -p` comme approuvés pour cette intégration, sauf si Anthropic publie une nouvelle politique. Le jeton de configuration Anthropic reste disponible comme chemin de jeton OpenClaw pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI ChatGPT/Codex

- Fournisseur : `openai`
- Authentification : OAuth (ChatGPT)
- Référence de modèle OpenAI Codex héritée : `openai/gpt-5.5`
- Référence du harnais natif de serveur d’application Codex : `openai/gpt-5.5`
- Documentation du harnais natif de serveur d’application Codex : [Harnais Codex](/fr/plugins/codex-harness)
- Références de modèles héritées : `codex/gpt-*`
- Frontière de plugin : `openai/*` charge le plugin OpenAI ; le plugin natif de serveur d’application Codex est sélectionné par le runtime du harnais Codex.
- CLI : `openclaw onboard --auth-choice openai` ou `openclaw models auth login --provider openai`
- Le transport par défaut est `auto` (WebSocket d’abord, repli SSE)
- Remplacez par modèle OpenAI Codex via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` est aussi transmis sur les requêtes Responses Codex natives (`chatgpt.com/backend-api`)
- Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) ne sont attachés qu’au trafic Codex natif vers `chatgpt.com/backend-api`, pas aux proxys génériques compatibles OpenAI
- Partage le même basculeur `/fast` et la même configuration `params.fastMode` que `openai/*` direct ; OpenClaw mappe cela vers `service_tier=priority`
- `openai/gpt-5.5` utilise le `contextWindow = 400000` natif du catalogue Codex et le runtime par défaut `contextTokens = 272000` ; remplacez le plafond du runtime avec `models.providers.openai.models[].contextTokens`
- Note de politique : OpenAI Codex OAuth est explicitement pris en charge pour les outils/workflows externes comme OpenClaw.
- Pour la route courante abonnement plus runtime Codex natif, connectez-vous avec l’authentification `openai` et configurez `openai/gpt-5.5` ; les tours d’agent OpenAI sélectionnent Codex par défaut.
- Utilisez le `agentRuntime.id: "openclaw"` fournisseur/modèle uniquement lorsque vous voulez la route intégrée OpenClaw ; sinon, conservez `openai/gpt-5.5` sur le harnais Codex par défaut.
- les références GPT Codex héritées sont un état hérité, pas une route de fournisseur live. Utilisez `openai/gpt-5.5` sur le runtime Codex natif pour les nouvelles configurations d’agent, et exécutez `openclaw doctor --fix` pour migrer les anciennes références de modèles Codex héritées vers des références canoniques `openai/*`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Autres options hébergées de type abonnement

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/fr/providers/zai">
    Z.AI Coding Plan ou points de terminaison API généraux.
  </Card>
  <Card title="MiniMax" href="/fr/providers/minimax">
    OAuth MiniMax Coding Plan ou accès par clé API.
  </Card>
  <Card title="Qwen Cloud" href="/fr/providers/qwen">
    Surface de fournisseur Qwen Cloud plus mappage des points de terminaison Alibaba DashScope et Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Authentification : `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Fournisseur du runtime Zen : `opencode`
- Fournisseur du runtime Go : `opencode-go`
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
- Rotation facultative : `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, repli `GOOGLE_API_KEY`, et `OPENCLAW_LIVE_GEMINI_KEY` (surcharge unique)
- Modèles d’exemple : `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilité : l’ancienne configuration OpenClaw utilisant `google/gemini-3.1-flash-preview` est normalisée en `google/gemini-3-flash-preview`
- Alias : `google/gemini-3.1-pro` est accepté et normalisé vers l’ID d’API Gemini live de Google, `google/gemini-3.1-pro-preview`
- CLI : `openclaw onboard --auth-choice gemini-api-key`
- Réflexion : `/think adaptive` utilise la réflexion dynamique de Google. Gemini 3/3.1 omet un `thinkingLevel` fixe ; Gemini 2.5 envoie `thinkingBudget: -1`.
- Les exécutions Gemini directes acceptent aussi `agents.defaults.models["google/<model>"].params.cachedContent` (ou l’ancien `cached_content`) pour transférer un identifiant natif du fournisseur `cachedContents/...` ; les succès de cache Gemini apparaissent sous forme de `cacheRead` OpenClaw

### Google Vertex et Gemini CLI

- Fournisseurs : `google-vertex`, `google-gemini-cli`
- Authentification : Vertex utilise gcloud ADC ; Gemini CLI utilise son flux OAuth

<Warning>
Gemini CLI OAuth dans OpenClaw est une intégration non officielle. Certains utilisateurs ont signalé des restrictions de compte Google après avoir utilisé des clients tiers. Consultez les conditions de Google et utilisez un compte non critique si vous choisissez de continuer.
</Warning>

Gemini CLI OAuth est livré dans le cadre du Plugin `google` intégré.

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

    Modèle par défaut : `google-gemini-cli/gemini-3-flash-preview`. Vous ne collez **pas** d’ID client ni de secret dans `openclaw.json`. Le flux de connexion CLI stocke les jetons dans les profils d’authentification sur l’hôte Gateway.

  </Step>
  <Step title="Set project (if needed)">
    Si les requêtes échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte Gateway.
  </Step>
</Steps>

Gemini CLI utilise `stream-json` par défaut. OpenClaw lit les messages de flux de l’assistant et normalise `stats.cached` en `cacheRead` ; les anciennes surcharges `--output-format json` lisent encore le texte de réponse depuis `response`.

### Z.AI (GLM)

- Fournisseur : `zai`
- Authentification : `ZAI_API_KEY`
- Modèle d’exemple : `zai/glm-5.2`
- CLI : `openclaw onboard --auth-choice zai-api-key`
  - Les références de modèles utilisent l’ID de fournisseur canonique `zai/*`.
  - `zai-api-key` détecte automatiquement le point de terminaison Z.AI correspondant ; `zai-coding-global`, `zai-coding-cn`, `zai-global` et `zai-cn` forcent une surface spécifique

### Vercel AI Gateway

- Fournisseur : `vercel-ai-gateway`
- Authentification : `AI_GATEWAY_API_KEY`
- Modèles d’exemple : `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice ai-gateway-api-key`

### Autres Plugins de fournisseurs intégrés

| Fournisseur                             | ID                               | Env d’authentification                              | Modèle d’exemple                                           |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/fr/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OAuth OpenRouter ou `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| [Qwen OAuth](/fr/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | OAuth SuperGrok/X Premium ou `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Particularités à connaître

<AccordionGroup>
  <Accordion title="OpenRouter">
    Applique ses en-têtes d’attribution d’application et les marqueurs Anthropic `cache_control` uniquement sur les routes `openrouter.ai` vérifiées. Les références DeepSeek, Moonshot et ZAI sont éligibles au TTL de cache pour la mise en cache des prompts gérée par OpenRouter, mais ne reçoivent pas les marqueurs de cache Anthropic. En tant que chemin compatible OpenAI de type proxy, il ignore la mise en forme réservée au natif OpenAI (`serviceTier`, `store` de Responses, indications de cache de prompt, compatibilité de raisonnement OpenAI). Les références adossées à Gemini conservent uniquement l’assainissement des signatures de pensée proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Les références adossées à Gemini suivent le même chemin d’assainissement proxy-Gemini ; `kilocode/kilo/auto` et les autres références proxy ne prenant pas en charge le raisonnement ignorent l’injection de raisonnement proxy.
  </Accordion>
  <Accordion title="MiniMax">
    L’intégration par clé d’API écrit des définitions explicites de modèles de chat M3 et M2.7 ; la compréhension d’images reste sur le fournisseur multimédia `MiniMax-VL-01` appartenant au Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Les ID de modèles utilisent un espace de noms `nvidia/<vendor>/<model>` (par exemple `nvidia/nvidia/nemotron-...` aux côtés de `nvidia/moonshotai/kimi-k2.5`) ; les sélecteurs préservent la composition littérale `<provider>/<model-id>`, tandis que la clé canonique envoyée à l’API reste à préfixe unique.
  </Accordion>
  <Accordion title="xAI">
    Utilise le chemin xAI Responses. Le chemin recommandé est OAuth SuperGrok/X Premium ; les clés d’API fonctionnent toujours via `XAI_API_KEY` ou la configuration du Plugin, et `web_search` de Grok réutilise le même profil d’authentification avant le repli sur clé d’API. `grok-4.3` est le modèle de chat intégré par défaut, et `grok-build-0.1` peut être sélectionné pour le travail axé sur la construction/le codage. `/fast` ou `params.fastMode: true` réécrit `grok-3`, `grok-3-mini`, `grok-4` et `grok-4-0709` vers leurs variantes `*-fast`. `tool_stream` est activé par défaut ; désactivez-le via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Fournisseurs via `models.providers` (URL personnalisée/de base)

Utilisez `models.providers` (ou `models.json`) pour ajouter des fournisseurs **personnalisés** ou des proxys compatibles OpenAI/Anthropic.

Beaucoup des plugins de fournisseurs intégrés ci-dessous publient déjà un catalogue par défaut. Utilisez des entrées explicites `models.providers.<id>` uniquement lorsque vous voulez remplacer l’URL de base, les en-têtes ou la liste des modèles par défaut.

Les vérifications de capacités des modèles du Gateway lisent aussi les métadonnées explicites `models.providers.<id>.models[]`. Si un modèle personnalisé ou proxy accepte les images, définissez `input: ["text", "image"]` sur ce modèle afin que WebChat et les chemins de pièces jointes provenant de node transmettent les images comme entrées natives du modèle au lieu de références multimédias en texte seul.

`agents.defaults.models["provider/model"]` contrôle uniquement la visibilité des modèles, les alias et les métadonnées par modèle pour les agents. Il n’enregistre pas à lui seul un nouveau modèle d’exécution. Pour les modèles de fournisseur personnalisés, ajoutez également `models.providers.<provider>.models[]` avec au moins l’`id` correspondant.

### Moonshot AI (Kimi)

Installez `@openclaw/moonshot-provider` avant la configuration initiale. Ajoutez une entrée explicite `models.providers.moonshot` uniquement lorsque vous devez remplacer l’URL de base ou les métadonnées du modèle :

- Fournisseur : `moonshot`
- Authentification : `MOONSHOT_API_KEY`
- Exemple de modèle : `moonshot/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modèles Kimi K2 :

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

### Programmation avec Kimi

Kimi Coding utilise le point de terminaison compatible avec Anthropic de Moonshot AI :

- Fournisseur : `kimi`
- Authentification : `KIMI_API_KEY`
- Exemple de modèle : `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Les anciens `kimi/kimi-code` et `kimi/k2p5` restent acceptés comme IDs de modèles de compatibilité et sont normalisés vers l’ID de modèle d’API stable de Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) donne accès à Doubao et à d’autres modèles en Chine.

- Fournisseur : `volcengine` (programmation : `volcengine-plan`)
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

L’onboarding utilise par défaut la surface de codage, mais le catalogue général `volcengine/*` est enregistré en même temps.

Dans les sélecteurs de modèles d’onboarding/configuration, le choix d’authentification Volcengine privilégie à la fois les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas encore chargés, OpenClaw se rabat sur le catalogue non filtré au lieu d’afficher un sélecteur limité au fournisseur vide.

<Tabs>
  <Tab title="Modèles standard">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Modèles de codage (volcengine-plan)">
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
- Exemple de modèle : `byteplus-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L’onboarding utilise par défaut la surface de codage, mais le catalogue général `byteplus/*` est enregistré en même temps.

Dans les sélecteurs de modèles d’onboarding/configuration, le choix d’authentification BytePlus privilégie à la fois les lignes `byteplus/*` et `byteplus-plan/*`. Si ces modèles ne sont pas encore chargés, OpenClaw se rabat sur le catalogue non filtré au lieu d’afficher un sélecteur limité au fournisseur vide.

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

Synthetic fournit des modèles compatibles avec Anthropic derrière le fournisseur `synthetic` :

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
Sur le chemin de streaming compatible Anthropic de MiniMax, OpenClaw désactive la pensée par défaut pour la famille M2.x, sauf si vous la définissez explicitement ; MiniMax-M3 (et M3.x) reste par défaut sur le chemin de pensée omis/adaptatif du fournisseur. `/fast on` réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
</Note>

Répartition des capacités détenue par le Plugin :

- Les valeurs par défaut texte/chat restent sur `minimax/MiniMax-M3`
- La génération d’images est `minimax/image-01` ou `minimax-portal/image-01`
- La compréhension d’images est `MiniMax-VL-01`, détenue par le Plugin, sur les deux chemins d’authentification MiniMax
- La recherche Web reste sur l’identifiant de fournisseur `minimax`

### LM Studio

LM Studio est fourni comme Plugin de fournisseur intégré qui utilise l’API native :

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

OpenClaw utilise les points de terminaison natifs `/api/v1/models` et `/api/v1/models/load` de LM Studio pour la découverte et le chargement automatique, avec `/v1/chat/completions` pour l’inférence par défaut. Si vous voulez que le chargement JIT, le TTL et l’éviction automatique de LM Studio possèdent le cycle de vie du modèle, définissez `models.providers.lmstudio.params.preload: false`. Consultez [/providers/lmstudio](/fr/providers/lmstudio) pour la configuration et le dépannage.

### Ollama

Ollama est fourni comme Plugin de fournisseur intégré et utilise l’API native d’Ollama :

- Fournisseur : `ollama`
- Authentification : aucune requise (serveur local)
- Exemple de modèle : `ollama/llama3.3`
- Installation : [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama est détecté localement à `http://127.0.0.1:11434` lorsque vous l’activez avec `OLLAMA_API_KEY`, et le Plugin de fournisseur intégré ajoute Ollama directement à `openclaw onboard` et au sélecteur de modèles. Consultez [/providers/ollama](/fr/providers/ollama) pour l’onboarding, le mode cloud/local et la configuration personnalisée.

### vLLM

vLLM est fourni comme Plugin de fournisseur intégré pour les serveurs locaux/auto-hébergés compatibles OpenAI :

- Fournisseur : `vllm`
- Authentification : facultative (selon votre serveur)
- URL de base par défaut : `http://127.0.0.1:8000/v1`

Pour activer la découverte automatique localement (n’importe quelle valeur fonctionne si votre serveur n’impose pas l’authentification) :

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

Consultez [/providers/vllm](/fr/providers/vllm) pour plus de détails.

### SGLang

SGLang est fourni comme Plugin de fournisseur intégré pour les serveurs rapides auto-hébergés compatibles OpenAI :

- Fournisseur : `sglang`
- Authentification : facultative (selon votre serveur)
- URL de base par défaut : `http://127.0.0.1:30000/v1`

Pour activer la découverte automatique localement (n’importe quelle valeur fonctionne si votre serveur n’impose pas l’authentification) :

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
    Pour les fournisseurs personnalisés, `reasoning`, `input`, `cost`, `contextWindow` et `maxTokens` sont facultatifs. Lorsqu’ils sont omis, OpenClaw utilise par défaut :

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Recommandé : définissez des valeurs explicites qui correspondent aux limites de votre proxy/modèle.

  </Accordion>
  <Accordion title="Règles de mise en forme des routes de proxy">
    - Pour `api: "openai-completions"` sur des points de terminaison non natifs (tout `baseUrl` non vide dont l’hôte n’est pas `api.openai.com`), OpenClaw force `compat.supportsDeveloperRole: false` afin d’éviter les erreurs 400 du fournisseur pour les rôles `developer` non pris en charge.
    - Les routes compatibles OpenAI de type proxy ignorent aussi la mise en forme des requêtes propre uniquement à OpenAI natif : pas de `service_tier`, pas de Responses `store`, pas de Completions `store`, pas d’indices de cache de prompt, pas de mise en forme de charge utile de compatibilité de raisonnement OpenAI, et pas d’en-têtes d’attribution OpenClaw cachés.
    - Pour les proxys Completions compatibles OpenAI qui nécessitent des champs propres à un fournisseur, définissez `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) pour fusionner du JSON supplémentaire dans le corps de la requête sortante.
    - Pour les contrôles de modèles de chat vLLM, définissez `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Le Plugin vLLM intégré envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` pour `vllm/nemotron-3-*` lorsque le niveau de pensée de la session est désactivé.
    - Pour les modèles locaux lents ou les hôtes LAN/tailnet distants, définissez `models.providers.<id>.timeoutSeconds`. Cela étend la gestion des requêtes HTTP du modèle fournisseur, y compris la connexion, les en-têtes, le streaming du corps et l’abandon total de guarded-fetch, sans augmenter le délai d’expiration de tout le runtime de l’agent. Si `agents.defaults.timeoutSeconds` ou un délai d’expiration propre à une exécution est inférieur, augmentez également ce plafond ; les délais d’expiration fournisseur ne peuvent pas prolonger toute l’exécution.
    - Les appels HTTP aux fournisseurs de modèles autorisent les réponses DNS fake-IP de Surge, Clash et sing-box dans `198.18.0.0/15` et `fc00::/7` uniquement pour le nom d’hôte `baseUrl` du fournisseur configuré. Les points de terminaison de fournisseurs personnalisés/locaux font également confiance à l’origine exacte `scheme://host:port` configurée pour les requêtes de modèle protégées, y compris les hôtes loopback, LAN et tailnet. Ce n’est pas une nouvelle option de configuration ; le `baseUrl` que vous configurez étend la politique de requête uniquement pour cette origine. L’autorisation de nom d’hôte fake-IP et la confiance dans l’origine exacte sont des mécanismes indépendants. Les autres destinations privées, loopback, link-local, de métadonnées et les ports différents nécessitent toujours une activation explicite avec `models.providers.<id>.request.allowPrivateNetwork: true`. Définissez `models.providers.<id>.request.allowPrivateNetwork: false` pour désactiver la confiance dans l’origine exacte.
    - Si `baseUrl` est vide/omis, OpenClaw conserve le comportement OpenAI par défaut (qui se résout en `api.openai.com`).
    - Par sécurité, une valeur explicite `compat.supportsDeveloperRole: true` est toujours remplacée sur les points de terminaison `openai-completions` non natifs.
    - Pour `api: "anthropic-messages"` sur des points de terminaison non directs (tout fournisseur autre que l’`anthropic` canonique, ou un `models.providers.anthropic.baseUrl` personnalisé dont l’hôte n’est pas un point de terminaison public `api.anthropic.com`), OpenClaw supprime les en-têtes bêta Anthropic implicites tels que `claude-code-20250219`, `interleaved-thinking-2025-05-14` et les marqueurs OAuth, afin que les proxys personnalisés compatibles Anthropic ne rejettent pas les indicateurs bêta non pris en charge. Définissez explicitement `models.providers.<id>.headers["anthropic-beta"]` si votre proxy nécessite des fonctionnalités bêta spécifiques.

  </Accordion>
</AccordionGroup>

## Exemples CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Voir aussi : [Configuration](/fr/gateway/configuration) pour des exemples de configuration complets.

## Liens connexes

- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) - clés de configuration des modèles
- [Basculement de modèle](/fr/concepts/model-failover) - chaînes de secours et comportement de nouvelle tentative
- [Modèles](/fr/concepts/models) - configuration des modèles et alias
- [Fournisseurs](/fr/providers) - guides de configuration par fournisseur
