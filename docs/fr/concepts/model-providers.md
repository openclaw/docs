---
read_when:
    - Vous avez besoin d’une référence de configuration des modèles pour chaque fournisseur.
    - Vous souhaitez des exemples de configurations ou de commandes d’intégration CLI pour les fournisseurs de modèles
sidebarTitle: Model providers
summary: Présentation des fournisseurs de modèles avec des exemples de configurations et de procédures CLI
title: Fournisseurs de modèles
x-i18n:
    generated_at: "2026-07-12T15:16:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20477f9f6c8c616b4eca6653a29e0e8c9ffe5049ddfed91c585e9e22cdb669a2
    source_path: concepts/model-providers.md
    workflow: 16
---

Référence pour les **fournisseurs de LLM/modèles** (et non les canaux de discussion comme WhatsApp/Telegram). Pour les règles de sélection des modèles, consultez [Modèles](/fr/concepts/models).

## Règles essentielles

<AccordionGroup>
  <Accordion title="Références de modèles et assistants CLI">
    - Les références de modèles utilisent `provider/model` (exemple : `opencode/claude-opus-4-6`).
    - `agents.defaults.models` sert de liste d’autorisation lorsqu’il est défini.
    - Assistants CLI : `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` définissent les valeurs par défaut au niveau du fournisseur ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` les remplacent pour chaque modèle.
    - Règles de repli, sondes de délai de récupération et persistance des remplacements de session : [Basculement de modèle](/fr/concepts/model-failover).

  </Accordion>
  <Accordion title="L’ajout de l’authentification d’un fournisseur ne modifie pas votre modèle principal">
    `openclaw configure` conserve la valeur existante de `agents.defaults.model.primary` lorsque vous ajoutez ou réauthentifiez un fournisseur. `openclaw models auth login` fait de même, sauf si vous transmettez `--set-default`. Les Plugins de fournisseur peuvent toujours renvoyer un modèle par défaut recommandé dans leur correctif de configuration d’authentification, mais OpenClaw interprète cela comme « rendre ce modèle disponible » lorsqu’un modèle principal existe déjà, et non comme « remplacer le modèle principal actuel ».

    Pour changer intentionnellement le modèle par défaut, utilisez `openclaw models set <provider/model>` ou `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Séparation entre le fournisseur et le runtime OpenAI">
    Les références de modèles OpenAI et les runtimes d’agent sont distincts :

    - `openai/<model>` sélectionne le fournisseur et le modèle OpenAI canoniques. Le préfixe seul ne sélectionne jamais Codex.
    - Lorsque la stratégie de runtime du fournisseur/modèle n’est pas définie ou vaut `auto`, OpenAI peut sélectionner Codex implicitement uniquement pour une route officielle HTTPS Platform Responses ou ChatGPT Responses exacte, sans remplacement de requête défini par l’utilisateur.
    - Les adaptateurs Completions définis par l’utilisateur, les points de terminaison personnalisés et les routes comportant un comportement de requête défini par l’utilisateur restent sur OpenClaw. Les points de terminaison HTTP officiels en texte clair sont rejetés.
    - Les anciennes références de modèles Codex constituent une configuration héritée que doctor réécrit en `openai/<model>`.
    - La valeur fournisseur/modèle `agentRuntime.id: "openclaw"` maintient explicitement sur OpenClaw une route qui serait autrement admissible. `agentRuntime.id: "codex"` exige Codex et échoue de manière fermée lorsque la route effective n’est pas compatible avec Codex.

    Consultez [Runtime d’agent OpenAI implicite](/fr/providers/openai#implicit-agent-runtime) et [Infrastructure Codex](/fr/plugins/codex-harness). Si la séparation entre fournisseur et runtime vous semble confuse, commencez par lire [Runtimes d’agent](/fr/concepts/agent-runtimes).

    L’activation automatique des Plugins suit la même limite : une route effective implicitement compatible avec Codex peut activer le Plugin Codex, tandis qu’une valeur fournisseur/modèle explicite `agentRuntime.id: "codex"` ou les références héritées `codex/<model>` l’exigent. Un préfixe `openai/*` seul ne l’exige pas.

    Une nouvelle configuration OpenAI utilise une référence GPT-5.6 propre à la route : la configuration par clé d’API sélectionne
    `openai/gpt-5.6` (sur l’API directe, l’identifiant sans suffixe correspond à Sol), tandis que
    l’OAuth ChatGPT/Codex sélectionne précisément `openai/gpt-5.6-sol` pour le catalogue Codex
    natif. Les modèles principaux explicites existants, notamment `openai/gpt-5.5`, sont
    conservés lorsque l’authentification OpenAI est ajoutée ou actualisée. GPT-5.5 reste disponible
    par l’intermédiaire de l’un ou l’autre runtime comme choix de récupération explicite pour les comptes sans
    accès à GPT-5.6.

  </Accordion>
  <Accordion title="Runtimes CLI">
    Les runtimes CLI utilisent la même séparation : choisissez des références de modèles canoniques telles que `anthropic/claude-*` ou `google/gemini-*`, puis définissez la stratégie de runtime du fournisseur/modèle sur `claude-cli` ou `google-gemini-cli` lorsque vous souhaitez utiliser un backend CLI local.

    Les références héritées `claude-cli/*` et `google-gemini-cli/*` sont remigrées vers les références canoniques du fournisseur, le runtime étant enregistré séparément. Les références héritées `codex-cli/*` sont migrées vers `openai/*` et utilisent la route du serveur d’application Codex ; OpenClaw n’intègre plus de backend CLI Codex.

  </Accordion>
</AccordionGroup>

## Comportement des fournisseurs géré par les Plugins

La plupart des mécanismes propres aux fournisseurs résident dans les Plugins de fournisseur (`registerProvider(...)`), tandis qu’OpenClaw conserve la boucle d’inférence générique. Les Plugins gèrent l’intégration initiale, les catalogues de modèles, le mappage des variables d’environnement d’authentification, la normalisation du transport et de la configuration, le nettoyage des schémas d’outils, la classification des basculements, l’actualisation OAuth, les rapports d’utilisation, les profils de réflexion et de raisonnement, et bien plus encore.

La liste complète des hooks du SDK de fournisseur et des exemples de Plugins intégrés se trouve dans [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins). Un fournisseur nécessitant un exécuteur de requêtes entièrement personnalisé relève d’une surface d’extension distincte et plus approfondie.

<Note>
Le comportement de l’exécuteur géré par le fournisseur repose sur des hooks explicites du fournisseur, tels que la stratégie de relecture, la normalisation des schémas d’outils, l’encapsulation des flux et les assistants de transport/requête. L’ancien conteneur statique `ProviderPlugin.capabilities` est réservé à la compatibilité et n’est plus lu par la logique partagée de l’exécuteur.
</Note>

## Rotation des clés d’API

<AccordionGroup>
  <Accordion title="Sources et priorité des clés">
    Configurez plusieurs clés avec :

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (remplacement unique en production, priorité maximale)
    - `<PROVIDER>_API_KEYS` (liste séparée par des virgules ou des points-virgules)
    - `<PROVIDER>_API_KEY` (clé principale)
    - `<PROVIDER>_API_KEY_*` (liste numérotée, par exemple `<PROVIDER>_API_KEY_1`)

    Pour les fournisseurs Google, `GOOGLE_API_KEY` est également inclus comme solution de repli. L’ordre de sélection des clés respecte la priorité et déduplique les valeurs.

  </Accordion>
  <Accordion title="Déclenchement de la rotation">
    - Les requêtes sont retentées avec la clé suivante uniquement en cas de réponses indiquant une limitation de débit (par exemple `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ou des messages périodiques de limite d’utilisation).
    - Les échecs qui ne sont pas liés à une limitation de débit échouent immédiatement ; aucune rotation de clé n’est tentée.
    - Lorsque toutes les clés candidates échouent, l’erreur finale de la dernière tentative est renvoyée.

  </Accordion>
</AccordionGroup>

## Plugins de fournisseur officiels

Les Plugins de fournisseur officiels publient leurs propres entrées de catalogue de modèles. Ces fournisseurs ne nécessitent **aucune** entrée de modèle dans `models.providers` ; activez le Plugin du fournisseur, configurez l’authentification et choisissez un modèle. Utilisez `models.providers` uniquement pour les fournisseurs personnalisés explicites ou les paramètres de requête ciblés, tels que les délais d’expiration.

### OpenAI

- Fournisseur : `openai`
- Authentification : `OPENAI_API_KEY`
- Rotation facultative : `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ainsi que `OPENCLAW_LIVE_OPENAI_KEY` (remplacement unique)
- Valeur par défaut d’une nouvelle configuration : `openai/gpt-5.6` ; sur l’API directe, l’identifiant sans suffixe correspond à Sol.
- Exemples de modèles : `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- Vérifiez la disponibilité du compte/modèle avec `openclaw models list --provider openai` si une installation ou une clé d’API particulière se comporte différemment.
- CLI : `openclaw onboard --auth-choice openai-api-key`
- Le transport par défaut est `auto` ; OpenClaw transmet le choix du transport au runtime de modèle partagé.
- Remplacez-le pour chaque modèle avec `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- Le traitement prioritaire OpenAI peut être activé avec `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` et `params.fastMode` mappent les requêtes Responses directes `openai/*` sur `service_tier=priority` sur `api.openai.com`
- Utilisez `params.serviceTier` lorsque vous souhaitez un niveau explicite plutôt que le commutateur partagé `/fast`
- Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) s’appliquent uniquement au trafic OpenAI natif vers `api.openai.com`, et non aux proxys génériques compatibles avec OpenAI
- Les routes OpenAI natives conservent également `store` de Responses, les indications de cache d’invite et la mise en forme des charges utiles de compatibilité du raisonnement OpenAI ; les routes de proxy ne les conservent pas
- `openai/gpt-5.3-codex-spark` est disponible uniquement via l’OAuth ChatGPT/Codex ; les routes directes avec clé d’API OpenAI et clé d’API Azure le rejettent

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

Si l’organisation de l’API ne propose pas GPT-5.6, définissez explicitement
`openai/gpt-5.5`. L’intégration initiale et la réauthentification normales conservent un
modèle principal explicite existant ; `models auth login --set-default` et
`models set` sont les méthodes prévues pour le remplacer intentionnellement.

### Anthropic

- Fournisseur : `anthropic`
- Authentification : `ANTHROPIC_API_KEY`
- Rotation facultative : `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ainsi que `OPENCLAW_LIVE_ANTHROPIC_KEY` (remplacement unique)
- Exemple de modèle : `anthropic/claude-opus-4-6`
- CLI : `openclaw onboard --auth-choice apiKey`
- Les requêtes publiques directes vers Anthropic prennent en charge le commutateur partagé `/fast` et `params.fastMode`, y compris le trafic authentifié par clé d’API et OAuth envoyé à `api.anthropic.com` ; OpenClaw mappe cela sur `service_tier` d’Anthropic (`auto` ou `standard_only`)
- La configuration Claude CLI recommandée conserve la référence canonique du modèle et sélectionne le backend
  CLI séparément : `anthropic/claude-opus-4-8` avec
  `agentRuntime.id: "claude-cli"` limité au modèle. Les références héritées
  `claude-cli/claude-opus-4-7` fonctionnent encore à des fins de compatibilité.

<Note>
La réutilisation de Claude CLI (`claude -p`) est une méthode d’intégration approuvée par OpenClaw. L’authentification Anthropic par jeton de configuration reste prise en charge, mais OpenClaw privilégie la réutilisation de Claude CLI lorsqu’elle est disponible.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI ChatGPT/Codex

- Fournisseur : `openai`
- Authentification : OAuth (ChatGPT)
- Référence de la nouvelle infrastructure native du serveur d’application Codex : `openai/gpt-5.6-sol`
- Documentation de l’infrastructure native du serveur d’application Codex : [Infrastructure Codex](/fr/plugins/codex-harness)
- Références de modèles héritées : `codex/gpt-*`
- Limite du Plugin : `openai/*` charge le Plugin OpenAI ; la stratégie de runtime explicite ou la route effective gérée par le fournisseur détermine si le Plugin natif du serveur d’application Codex est sélectionné.
- CLI : `openclaw onboard --auth-choice openai` ou `openclaw models auth login --provider openai`
- Le transport ChatGPT Responses intégré à OpenClaw utilise `auto` par défaut (WebSocket en priorité, SSE en repli).
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier` et `params.fastMode` sont des paramètres de requête intégrée définis par l’utilisateur. Ils maintiennent la sélection implicite du runtime sur OpenClaw ; le Codex natif gère le transport et le niveau de service de son serveur d’application.
- Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) sont joints uniquement au trafic Codex natif vers `chatgpt.com/backend-api`, et non aux proxys génériques compatibles avec OpenAI
- Le commutateur partagé `/fast` reste disponible comme contrôle du runtime ; il est distinct des paramètres de modèle définis par l’utilisateur.
- Le catalogue Codex natif peut présenter les références exactes `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` et `openai/gpt-5.6-luna` selon l’accès du compte. Il n’applique pas côté client l’alias `gpt-5.6` sans suffixe de l’API directe.
- `openai/gpt-5.5` utilise la valeur native `contextWindow = 400000` du catalogue Codex et la valeur de runtime par défaut `contextTokens = 272000` ; remplacez la limite du runtime avec `models.providers.openai.models[].contextTokens`
- Connectez-vous avec l’authentification `openai` et utilisez `openai/gpt-5.6-sol` pour une nouvelle configuration adossée à un abonnement. Sélectionnez explicitement `openai/gpt-5.5` si cet espace de travail Codex ne propose pas GPT-5.6.
- Utilisez la valeur fournisseur/modèle `agentRuntime.id: "openclaw"` pour maintenir sur le runtime intégré une route qui serait autrement admissible. Lorsque le runtime n’est pas défini ou vaut `auto`, seule une route officielle HTTPS exacte compatible avec Responses/ChatGPT, sans remplacement de requête défini par l’utilisateur, peut sélectionner Codex implicitement.
- Les références GPT Codex héritées constituent un état hérité, et non une route de fournisseur active. Utilisez les références canoniques `openai/*` pour les nouvelles configurations d’agent et exécutez `openclaw doctor --fix` pour migrer les anciennes références de modèles Codex héritées sans mettre à niveau une sélection explicite existante de `openai/gpt-5.5`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
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
  <Card title="MiniMax" href="/fr/providers/minimax">
    Accès à MiniMax Coding Plan par OAuth ou clé API.
  </Card>
  <Card title="Qwen Cloud" href="/fr/providers/qwen">
    Interface du fournisseur Qwen Cloud, ainsi que mappage des points de terminaison Alibaba DashScope et Coding Plan.
  </Card>
  <Card title="Z.AI (GLM)" href="/fr/providers/zai">
    Points de terminaison Z.AI Coding Plan ou de l’API générale.
  </Card>
</CardGroup>

### OpenCode

- Authentification : `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Fournisseur d’exécution Zen : `opencode`
- Fournisseur d’exécution Go : `opencode-go`
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
- Rotation facultative : `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, repli sur `GOOGLE_API_KEY` et `OPENCLAW_LIVE_GEMINI_KEY` (remplacement unique)
- Exemples de modèles : `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- Compatibilité : l’ancienne configuration OpenClaw utilisant `google/gemini-3.1-flash-preview` est normalisée en `google/gemini-3-flash-preview`
- Alias : `google/gemini-3.1-pro` est accepté et normalisé en identifiant actif de l’API Gemini de Google, `google/gemini-3.1-pro-preview`
- CLI : `openclaw onboard --auth-choice gemini-api-key`
- Réflexion : `/think adaptive` utilise la réflexion dynamique de Google. Gemini 3/3.1 omet un `thinkingLevel` fixe ; Gemini 2.5 envoie `thinkingBudget: -1`.
- Les exécutions Gemini directes acceptent également `agents.defaults.models["google/<model>"].params.cachedContent` (ou l’ancien `cached_content`) pour transmettre un descripteur `cachedContents/...` natif du fournisseur ; les correspondances du cache Gemini sont exposées sous forme de `cacheRead` OpenClaw

### Google Vertex et Gemini CLI

- Fournisseurs : `google-vertex`, `google-gemini-cli`
- Authentification : Vertex utilise ADC de gcloud ; Gemini CLI utilise son flux OAuth

<Warning>
L’intégration OAuth de Gemini CLI dans OpenClaw n’est pas officielle. Certains utilisateurs ont signalé des restrictions de compte Google après avoir utilisé des clients tiers. Consultez les conditions de Google et utilisez un compte non critique si vous choisissez de poursuivre.
</Warning>

L’intégration OAuth de Gemini CLI est fournie avec le plugin `google` inclus.

<Steps>
  <Step title="Installer Gemini CLI">
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
  <Step title="Activer le plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Se connecter">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modèle par défaut : `google-gemini-cli/gemini-3-flash-preview`. Vous ne collez **pas** d’identifiant client ni de secret dans `openclaw.json`. Le flux de connexion de la CLI stocke les jetons dans les profils d’authentification sur l’hôte du gateway.

  </Step>
  <Step title="Définir le projet (si nécessaire)">
    Si les requêtes échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte du gateway.
  </Step>
</Steps>

Gemini CLI utilise `stream-json` par défaut. OpenClaw lit les messages du flux
de l’assistant et normalise `stats.cached` en `cacheRead` ; les anciens
remplacements `--output-format json` continuent de lire le texte de la réponse dans `response`.

### Z.AI (GLM)

- Fournisseur : `zai`
- Authentification : `ZAI_API_KEY`
- Exemple de modèle : `zai/glm-5.2`
- CLI : `openclaw onboard --auth-choice zai-api-key`
  - Les références de modèles utilisent l’identifiant canonique de fournisseur `zai/*`.
  - `zai-api-key` détecte automatiquement le point de terminaison Z.AI correspondant ; `zai-coding-global`, `zai-coding-cn`, `zai-global` et `zai-cn` imposent une interface spécifique

### Vercel AI Gateway

- Fournisseur : `vercel-ai-gateway`
- Authentification : `AI_GATEWAY_API_KEY`
- Exemples de modèles : `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice ai-gateway-api-key`

### Autres plugins de fournisseur inclus

| Fournisseur                             | Identifiant                      | Variable d’environnement d’authentification          | Exemple de modèle                                          |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` ou `OPENROUTER_API_KEY`            | `arcee/trinity-large-thinking`                             |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                     |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` ou `CHUTES_OAUTH_TOKEN`             | `chutes/zai-org/GLM-4.7-TEE`                               |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                            |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                  |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                               |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                               |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                         |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                             |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/fr/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OAuth OpenRouter ou `OPENROUTER_API_KEY`              | `openrouter/auto`                                          |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                    |
| [OAuth Qwen](/fr/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                             |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | OAuth SuperGrok/X Premium ou `XAI_API_KEY`            | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Particularités utiles à connaître

<AccordionGroup>
  <Accordion title="OpenRouter">
    Applique ses en-têtes d’attribution d’application et les marqueurs Anthropic `cache_control` uniquement sur les routes `openrouter.ai` vérifiées. Les références DeepSeek, Moonshot et ZAI sont admissibles à une durée de vie du cache pour la mise en cache des prompts gérée par OpenRouter, mais ne reçoivent pas de marqueurs de cache Anthropic. En tant que chemin de proxy compatible avec OpenAI, il ignore les adaptations propres à OpenAI natif (`serviceTier`, `store` de Responses, indications de cache de prompts, compatibilité du raisonnement OpenAI). Les références basées sur Gemini conservent uniquement l’assainissement des signatures de pensée du proxy Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Les références basées sur Gemini suivent le même chemin d’assainissement du proxy Gemini ; `kilocode/kilo/auto` et les autres références ne prenant pas en charge le raisonnement par proxy ignorent l’injection du raisonnement par proxy.
  </Accordion>
  <Accordion title="MiniMax">
    L’intégration par clé API écrit des définitions explicites de modèles de conversation M3 et M2.7 ; la compréhension d’images reste assurée par le fournisseur multimédia `MiniMax-VL-01` détenu par le plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Les identifiants de modèle utilisent un espace de noms `nvidia/<vendor>/<model>` (par exemple `nvidia/nvidia/nemotron-...` aux côtés de `nvidia/moonshotai/kimi-k2.5`) ; les sélecteurs préservent la composition littérale `<provider>/<model-id>`, tandis que la clé canonique envoyée à l’API conserve un seul préfixe.
  </Accordion>
  <Accordion title="xAI">
    Utilise le chemin Responses de xAI. Le chemin recommandé est OAuth SuperGrok/X Premium ; les clés API fonctionnent toujours via `XAI_API_KEY` ou la configuration du plugin, et la recherche `web_search` de Grok réutilise le même profil d’authentification avant de se rabattre sur une clé API. Grok 4.5 peut être sélectionné pour la conversation, le codage et les tâches agentiques lorsqu’il est disponible ; `grok-4.3` reste le modèle par défaut intégré et sûr pour toutes les régions. Les anciennes configurations `/fast` et `params.fastMode: true` sont toujours résolues par les redirections de compatibilité Grok 4.3 de xAI, mais les nouvelles configurations doivent sélectionner directement un modèle actuel. `tool_stream` est activé par défaut ; désactivez-le via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Fournisseurs via `models.providers` (URL personnalisée/de base)

Utilisez `models.providers` (ou `models.json`) pour ajouter des fournisseurs **personnalisés** ou des proxys compatibles avec OpenAI/Anthropic.

De nombreux plugins de fournisseur intégrés ci-dessous publient déjà un catalogue par défaut. Utilisez des entrées `models.providers.<id>` explicites uniquement lorsque vous souhaitez remplacer l’URL de base, les en-têtes ou la liste des modèles par défaut.

Les vérifications des capacités des modèles du Gateway lisent également les métadonnées explicites `models.providers.<id>.models[]`. Si un modèle personnalisé ou de proxy accepte les images, définissez `input: ["text", "image"]` sur ce modèle afin que WebChat et les chemins de pièces jointes provenant d’un nœud transmettent les images comme entrées natives du modèle plutôt que comme références multimédias textuelles uniquement.

`agents.defaults.models["provider/model"]` contrôle uniquement la visibilité des modèles, les alias et les métadonnées propres à chaque modèle pour les agents. Il n’enregistre pas à lui seul un nouveau modèle d’exécution. Pour les modèles de fournisseur personnalisés, ajoutez également `models.providers.<provider>.models[]` avec au minimum l’`id` correspondant.

### Moonshot AI (Kimi)

Installez `@openclaw/moonshot-provider` avant l’intégration. Ajoutez une entrée `models.providers.moonshot` explicite uniquement lorsque vous devez remplacer l’URL de base ou les métadonnées du modèle :

- Fournisseur : `moonshot`
- Authentification : `MOONSHOT_API_KEY`
- Exemple de modèle : `moonshot/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

Identifiants des modèles Kimi K2 :

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

Consultez [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot) pour obtenir le guide de configuration complet.

### Kimi Coding

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

Les anciens identifiants `kimi/kimi-code` et `kimi/k2p5` restent acceptés en tant qu’identifiants de modèle de compatibilité et sont normalisés vers l’identifiant de modèle stable de l’API Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) donne accès à Doubao et à d’autres modèles en Chine.

- Fournisseur : `volcengine` (codage : `volcengine-plan`)
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

L’intégration utilise par défaut l’interface de codage, mais le catalogue général `volcengine/*` est enregistré simultanément.

Dans les sélecteurs de modèles d’intégration/configuration, le choix d’authentification Volcengine privilégie les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas encore chargés, OpenClaw se rabat sur le catalogue non filtré au lieu d’afficher un sélecteur vide limité au fournisseur.

<Tabs>
  <Tab title="Modèles standard">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="Modèles de codage (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (international)

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

L’intégration utilise par défaut l’interface de codage, mais le catalogue général `byteplus/*` est enregistré simultanément.

Dans les sélecteurs de modèles d’intégration/configuration, le choix d’authentification BytePlus privilégie les lignes `byteplus/*` et `byteplus-plan/*`. Si ces modèles ne sont pas encore chargés, OpenClaw se rabat sur le catalogue non filtré au lieu d’afficher un sélecteur vide limité au fournisseur.

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

Synthetic fournit des modèles compatibles avec Anthropic via le fournisseur `synthetic` :

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

- OAuth MiniMax (mondial) : `--auth-choice minimax-global-oauth`
- OAuth MiniMax (Chine) : `--auth-choice minimax-cn-oauth`
- Clé API MiniMax (mondial) : `--auth-choice minimax-global-api`
- Clé API MiniMax (Chine) : `--auth-choice minimax-cn-api`
- Authentification : `MINIMAX_API_KEY` pour `minimax` ; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` pour `minimax-portal`

Consultez [/providers/minimax](/fr/providers/minimax) pour obtenir les détails de configuration, les options de modèles et des extraits de configuration.

<Note>
Sur le chemin de diffusion compatible avec Anthropic de MiniMax, OpenClaw désactive la réflexion par défaut pour la famille M2.x, sauf si vous la définissez explicitement ; MiniMax-M3 (et M3.x) conserve par défaut le chemin de réflexion omise/adaptative du fournisseur. `/fast on` remplace `MiniMax-M2.7` par `MiniMax-M2.7-highspeed`.
</Note>

Répartition des capacités détenues par le plugin :

- Les valeurs par défaut de texte/conversation restent sur `minimax/MiniMax-M3`
- La génération d’images utilise `minimax/image-01` ou `minimax-portal/image-01`
- La compréhension d’images utilise le modèle `MiniMax-VL-01` détenu par le plugin sur les deux chemins d’authentification MiniMax
- La recherche Web reste sur l’identifiant de fournisseur `minimax`

### LM Studio

LM Studio est fourni sous forme de plugin de fournisseur intégré utilisant l’API native :

- Fournisseur : `lmstudio`
- Authentification : `LM_API_TOKEN`
- URL de base d’inférence par défaut : `http://localhost:1234/v1`

Définissez ensuite un modèle (remplacez-le par l’un des identifiants renvoyés par `http://localhost:1234/api/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw utilise les points de terminaison natifs `/api/v1/models` et `/api/v1/models/load` de LM Studio pour la découverte et le chargement automatique, avec `/v1/chat/completions` pour l’inférence par défaut. Si vous souhaitez que le chargement JIT, la durée de vie et l’éviction automatique de LM Studio gèrent le cycle de vie du modèle, définissez `models.providers.lmstudio.params.preload: false`. Consultez [/providers/lmstudio](/fr/providers/lmstudio) pour la configuration et le dépannage.

### Ollama

Ollama est fourni sous forme de plugin de fournisseur intégré et utilise l’API native d’Ollama :

- Fournisseur : `ollama`
- Authentification : aucune requise (serveur local)
- Exemple de modèle : `ollama/llama3.3`
- Installation : [https://ollama.com/download](https://ollama.com/download)

```bash
# Installez Ollama, puis téléchargez un modèle :
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama est détecté localement à l’adresse `http://127.0.0.1:11434` lorsque vous l’activez avec `OLLAMA_API_KEY`, et le plugin de fournisseur intégré ajoute directement Ollama à `openclaw onboard` et au sélecteur de modèles. Consultez [/providers/ollama](/fr/providers/ollama) pour l’intégration, le mode cloud/local et la configuration personnalisée.

### vLLM

vLLM est fourni sous forme de plugin de fournisseur intégré pour les serveurs locaux/auto-hébergés compatibles avec OpenAI :

- Fournisseur : `vllm`
- Authentification : facultative (selon votre serveur)
- URL de base par défaut : `http://127.0.0.1:8000/v1`

Pour activer la découverte automatique locale (n’importe quelle valeur convient si votre serveur n’impose pas d’authentification) :

```bash
export VLLM_API_KEY="vllm-local"
```

Définissez ensuite un modèle (remplacez-le par l’un des identifiants renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consultez [/providers/vllm](/fr/providers/vllm) pour plus de détails.

### SGLang

SGLang est fourni sous forme de plugin de fournisseur intégré pour les serveurs rapides auto-hébergés compatibles avec OpenAI :

- Fournisseur : `sglang`
- Authentification : facultative (selon votre serveur)
- URL de base par défaut : `http://127.0.0.1:30000/v1`

Pour activer la découverte automatique locale (n’importe quelle valeur convient si votre serveur n’impose pas d’authentification) :

```bash
export SGLANG_API_KEY="sglang-local"
```

Définissez ensuite un modèle (remplacez-le par l’un des identifiants renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consultez [/providers/sglang](/fr/providers/sglang) pour plus de détails.

### Proxys locaux (LM Studio, vLLM, LiteLLM, etc.)

Exemple (compatible avec OpenAI) :

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
            name: "Modèle local",
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

    Recommandation : définissez des valeurs explicites correspondant aux limites de votre proxy/modèle.

  </Accordion>
  <Accordion title="Règles de mise en forme des routes de proxy">
    - Pour `api: "openai-completions"` sur des points de terminaison non natifs (toute `baseUrl` non vide dont l'hôte n'est pas `api.openai.com`), OpenClaw impose `compat.supportsDeveloperRole: false` afin d'éviter les erreurs 400 du fournisseur pour les rôles `developer` non pris en charge.
    - Les routes de type proxy compatibles avec OpenAI ignorent également la mise en forme des requêtes réservée à OpenAI natif : pas de `service_tier`, pas de `store` pour Responses, pas de `store` pour Completions, pas d'indications de cache de prompt, pas de mise en forme de charge utile pour la compatibilité du raisonnement OpenAI et pas d'en-têtes d'attribution OpenClaw masqués.
    - Pour les proxys Completions compatibles avec OpenAI qui nécessitent des champs propres au fournisseur, définissez `agents.defaults.models["provider/model"].params.extra_body` (ou `extraBody`) afin de fusionner du JSON supplémentaire dans le corps de la requête sortante.
    - Pour les contrôles de modèle de discussion vLLM, définissez `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Le Plugin vLLM intégré envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` pour `vllm/nemotron-3-*` lorsque le niveau de réflexion de la session est désactivé.
    - Pour les modèles locaux lents ou les hôtes LAN/tailnet distants, définissez `models.providers.<id>.timeoutSeconds`. Cela prolonge le traitement des requêtes HTTP du modèle du fournisseur, notamment la connexion, les en-têtes, la diffusion du corps et l'abandon total de la récupération protégée, sans augmenter le délai d'expiration de l'ensemble de l'exécution de l'agent. Si `agents.defaults.timeoutSeconds` ou le délai d'expiration propre à une exécution est inférieur, augmentez également cette limite ; les délais d'expiration du fournisseur ne peuvent pas prolonger l'ensemble de l'exécution.
    - Les appels HTTP aux fournisseurs de modèles autorisent les réponses DNS à fausse adresse IP de Surge, Clash et sing-box dans `198.18.0.0/15` et `fc00::/7` uniquement pour le nom d'hôte de la `baseUrl` du fournisseur configuré. Les points de terminaison de fournisseurs personnalisés/locaux approuvent également l'origine exacte configurée `scheme://host:port` pour les requêtes de modèle protégées, notamment les hôtes de bouclage, LAN et tailnet. Il ne s'agit pas d'une nouvelle option de configuration ; la `baseUrl` que vous configurez étend la politique de requête uniquement à cette origine. L'autorisation des noms d'hôte à fausse adresse IP et l'approbation de l'origine exacte sont des mécanismes indépendants. Les autres destinations privées, de bouclage, lien-locales, de métadonnées, ainsi que les ports différents, nécessitent toujours l'activation explicite de `models.providers.<id>.request.allowPrivateNetwork: true`. Définissez `models.providers.<id>.request.allowPrivateNetwork: false` pour désactiver l'approbation de l'origine exacte.
    - Si `baseUrl` est vide/omise, OpenClaw conserve le comportement OpenAI par défaut (qui se résout en `api.openai.com`).
    - Par sécurité, une valeur explicite `compat.supportsDeveloperRole: true` reste remplacée sur les points de terminaison `openai-completions` non natifs.
    - Pour `api: "anthropic-messages"` sur des points de terminaison non directs (tout fournisseur autre que le fournisseur canonique `anthropic`, ou une `models.providers.anthropic.baseUrl` personnalisée dont l'hôte n'est pas un point de terminaison public `api.anthropic.com`), OpenClaw supprime les en-têtes bêta Anthropic implicites tels que `claude-code-20250219`, `interleaved-thinking-2025-05-14` et les marqueurs OAuth, afin que les proxys personnalisés compatibles avec Anthropic ne rejettent pas les indicateurs bêta non pris en charge. Définissez explicitement `models.providers.<id>.headers["anthropic-beta"]` si votre proxy nécessite des fonctionnalités bêta spécifiques.

  </Accordion>
</AccordionGroup>

## Exemples de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Voir aussi : [Configuration](/fr/gateway/configuration) pour des exemples de configuration complets.

## Ressources connexes

- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) - clés de configuration des modèles
- [Basculement de modèle](/fr/concepts/model-failover) - chaînes de repli et comportement de nouvelle tentative
- [Modèles](/fr/concepts/models) - configuration et alias des modèles
- [Fournisseurs](/fr/providers) - guides de configuration propres à chaque fournisseur
