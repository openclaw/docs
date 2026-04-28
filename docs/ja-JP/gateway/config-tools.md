---
read_when:
    - '`tools.*` policy、allowlist、またはexperimental featureを設定する'
    - custom providerを登録する、またはbase URLを上書きする
    - OpenAI互換のself-hosted endpointをセットアップする
sidebarTitle: Tools and custom providers
summary: Tools設定（policy、experimental toggle、provider対応tool）とcustom provider/base-URLセットアップ
title: 設定 — toolとcustom provider
x-i18n:
    generated_at: "2026-04-26T11:29:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef030940b155224e614675a85c7a81567fd3a493e5ec1c25c5956d49cbc11b86
    source_path: gateway/config-tools.md
    workflow: 15
---

`tools.*` config keyとcustom provider / base-URLセットアップ。agent、channel、その他のトップレベルconfig keyについては、[Configuration reference](/ja-JP/gateway/configuration-reference)を参照してください。

## Tools

### Tool profile

`tools.profile` は、`tools.allow` / `tools.deny` より前にベースallowlistを設定します。

<Note>
ローカルonboardingでは、未設定時に新しいローカルconfigのデフォルトとして `tools.profile: "coding"` が設定されます（既存の明示的profileは保持されます）。
</Note>

| Profile | 含まれるもの |
| ------- | ------------ |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full` | 制限なし（未設定と同じ） |

### Tool group

| Group | Tools |
| ----- | ----- |
| `group:runtime` | `exec`, `process`, `code_execution`（`bash` は `exec` のaliasとして受け付けられます） |
| `group:fs` | `read`, `write`, `edit`, `apply_patch` |
| `group:sessions` | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory` | `memory_search`, `memory_get` |
| `group:web` | `web_search`, `x_search`, `web_fetch` |
| `group:ui` | `browser`, `canvas` |
| `group:automation` | `cron`, `gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:agents` | `agents_list` |
| `group:media` | `image`, `image_generate`, `video_generate`, `tts` |
| `group:openclaw` | すべての組み込みtool（provider Pluginは除く） |

### `tools.allow` / `tools.deny`

グローバルなtool allow/deny policyです（denyが優先）。大文字小文字を区別せず、`*` wildcardをサポートします。Docker sandboxがoffでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のproviderまたはmodelに対して、さらにtoolを制限します。順序: ベースprofile → provider profile → allow/deny。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

sandbox外での昇格したexecアクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- agentごとの上書き（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` は状態をsessionごとに保存します。inline directiveは単一messageに適用されます。
- 昇格された `exec` はsandboxingをバイパスし、設定されたescape pathを使います（デフォルトは `gateway`、exec targetが `node` の場合は `node`）。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

tool loopの安全チェックは**デフォルトで無効**です。有効化するには `enabled: true` を設定してください。設定はグローバルに `tools.loopDetection` で定義でき、agentごとに `agents.list[].tools.loopDetection` で上書きできます。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  loop解析のために保持されるtool-call履歴の最大数。
</ParamField>
<ParamField path="warningThreshold" type="number">
  warningを出す、進捗のない繰り返しpatternのしきい値。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  重大なloopをブロックするための、より高い繰り返ししきい値。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  進捗のないrunに対する強制停止しきい値。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  同じtool / 同じargsの繰り返しcallに対してwarningを出します。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  既知のpoll tool（`process.poll`, `command_status` など）で進捗がない場合にwarning / blockします。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  進捗のない交互ペアpatternに対してwarning / blockします。
</ParamField>

<Warning>
`warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、validationは失敗します。
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // または BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 任意。自動検出する場合は省略
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

受信media理解（image/audio/video）を設定します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: 完了した非同期music/videoを直接channelに送信する
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Media model entry field">
    **Provider entry**（`type: "provider"` または省略）:

    - `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
    - `model`: model id override
    - `profile` / `preferredProfile`: `auth-profiles.json` のprofile選択

    **CLI entry**（`type: "cli"`）:

    - `command`: 実行するexecutable
    - `args`: テンプレート化されたargs（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

    **共通field:**

    - `capabilities`: 任意のリスト（`image`、`audio`、`video`）。デフォルト: `openai` / `anthropic` / `minimax` → image、`google` → image+audio+video、`groq` → audio。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: entryごとのoverride。
    - 失敗時は次のentryにfallbackします。

    provider authは標準順序に従います: `auth-profiles.json` → env var → `models.providers.*.apiKey`。

    **非同期完了field:**

    - `asyncCompletion.directSend`: `true` の場合、完了した非同期 `music_generate` および `video_generate` タスクは、まずdirect channel配信を試みます。デフォルト: `false`（従来のrequester-session wake/model-delivery経路）。

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

session tool（`sessions_list`、`sessions_history`、`sessions_send`）がどのsessionを対象にできるかを制御します。

デフォルト: `tree`（現在のsession + そこからspawnされたsession。subagentなど）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Visibilityスコープ">
    - `self`: 現在のsession keyのみ。
    - `tree`: 現在のsession + 現在のsessionからspawnされたsession（subagent）。
    - `agent`: 現在のagent idに属する任意のsession（同じagent id配下で送信者ごとのsessionを実行している場合、他のユーザーを含むことがあります）。
    - `all`: 任意のsession。agentをまたぐtarget指定には引き続き `tools.agentToAgent` が必要です。
    - Sandbox clamp: 現在のsessionがsandboxedで、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であってもvisibilityは `tree` に固定されます。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn` のinline attachmentサポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: inline file attachmentを許可するには true に設定
        maxTotalBytes: 5242880, // 全file合計で 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // fileごとに 1 MB
        retainOnSessionKeep: false, // cleanup="keep" のときにattachmentを保持
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachmentに関する注記">
    - Attachmentは `runtime: "subagent"` でのみサポートされます。ACP runtimeでは拒否されます。
    - fileは子workspace内の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
    - attachment contentはtranscript永続化から自動的にredactされます。
    - base64入力は、厳密なalphabet/paddingチェックとdecode前サイズガードで検証されます。
    - file permissionは、directoryが `0700`、fileが `0600` です。
    - cleanupは `cleanup` policyに従います: `delete` は常にattachmentを削除し、`keep` は `retainOnSessionKeep: true` の場合にのみ保持します。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

実験的な組み込みtool flagです。strict-agentic GPT-5の自動有効化ルールが適用される場合を除き、デフォルトではoffです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 実験的な update_plan を有効化
    },
  },
}
```

- `planTool`: 自明でない複数ステップ作業の追跡用に、構造化された `update_plan` toolを有効にします。
- デフォルト: `agents.defaults.embeddedPi.executionContract`（またはagentごとのoverride）が、OpenAIまたはOpenAI CodexのGPT-5系runに対して `"strict-agentic"` に設定されている場合を除き `false` です。その範囲外でもtoolを強制的に有効にするには `true` を設定し、strict-agentic GPT-5 runでも無効のままにするには `false` を設定します。
- 有効時には、modelが実質的な作業に対してのみこのtoolを使い、`in_progress` のstepを最大1つに保つように、system promptにも使用ガイダンスが追加されます。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: spawnされたsub-agent用のデフォルトmodel。省略した場合、sub-agentは呼び出し元のmodelを継承します。
- `allowAgents`: リクエスターagentが自身の `subagents.allowAgents` を設定していない場合の、`sessions_spawn` 向けtarget agent idのデフォルトallowlist（`["*"]` = 任意、デフォルト: 同じagentのみ）。
- `runTimeoutSeconds`: tool callで `runTimeoutSeconds` が省略された場合の、`sessions_spawn` 向けデフォルトタイムアウト（秒）。`0` はタイムアウトなしを意味します。
- subagentごとのtool policy: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## custom providerとbase URL

OpenClawは組み込みmodel catalogを使用します。custom providerはconfig内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加します。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="authとマージ優先順位">
    - custom authが必要な場合は `authHeader: true` + `headers` を使用します。
    - agent config rootは `OPENCLAW_AGENT_DIR` で上書きできます（または旧environment variable aliasの `PI_CODING_AGENT_DIR`）。
    - 一致するprovider IDに対するマージ優先順位:
      - 空でないagent `models.json` の `baseUrl` 値が優先されます。
      - 空でないagentの `apiKey` 値は、そのproviderが現在のconfig/auth-profile contextでSecretRef管理されていない場合にのみ優先されます。
      - SecretRef管理されたproviderの `apiKey` 値は、解決済みsecretを永続化する代わりに、source marker（env refなら `ENV_VAR_NAME`、file/exec refなら `secretref-managed`）から更新されます。
      - SecretRef管理されたprovider header値は、source marker（env refなら `secretref-env:ENV_VAR_NAME`、file/exec refなら `secretref-managed`）から更新されます。
      - agentの `apiKey` / `baseUrl` が空または欠落している場合、config内の `models.providers` にフォールバックします。
      - 一致するmodelの `contextWindow` / `maxTokens` は、明示的config値と暗黙catalog値のうち高い方を使います。
      - 一致するmodelの `contextTokens` は、存在する場合は明示的runtime capを保持します。native model metadataを変更せずに実効contextを制限したい場合に使用してください。
      - configで `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使用します。
      - marker永続化はsource-authoritativeです。markerは解決済みruntime secret値からではなく、アクティブなsource config snapshot（解決前）から書き込まれます。

  </Accordion>
</AccordionGroup>

### Provider fieldの詳細

<AccordionGroup>
  <Accordion title="トップレベルcatalog">
    - `models.mode`: provider catalogの動作（`merge` または `replace`）。
    - `models.providers`: provider idをkeyにしたcustom provider map。
      - 安全な編集: 加算的な更新には `openclaw config set models.providers.<id> '<json>' --strict-json --merge` または `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` を使用してください。`config set` は、`--replace` を渡さない限り破壊的置換を拒否します。

  </Accordion>
  <Accordion title="Provider接続とauth">
    - `models.providers.*.api`: request adapter（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
    - `models.providers.*.apiKey`: provider credential（SecretRef/env置換を推奨）。
    - `models.providers.*.auth`: auth strategy（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用。requestに `options.num_ctx` を注入します（デフォルト: `true`）。
    - `models.providers.*.authHeader`: 必要な場合に、credentialを `Authorization` headerで送るよう強制します。
    - `models.providers.*.baseUrl`: upstream API base URL。
    - `models.providers.*.headers`: proxy/tenantルーティング向けの追加の静的header。

  </Accordion>
  <Accordion title="Request transport override">
    `models.providers.*.request`: model-provider HTTP request用のtransport override。

    - `request.headers`: 追加header（provider defaultとマージされます）。値はSecretRefを受け付けます。
    - `request.auth`: auth strategy override。mode: `"provider-default"`（provider組み込みauthを使用）、`"authorization-bearer"`（`token` とともに使用）、`"header"`（`headerName`、`value`、任意の `prefix` とともに使用）。
    - `request.proxy`: HTTP proxy override。mode: `"env-proxy"`（`HTTP_PROXY` / `HTTPS_PROXY` env varを使用）、`"explicit-proxy"`（`url` とともに使用）。どちらのmodeも任意の `tls` sub-objectを受け付けます。
    - `request.tls`: 直接接続用のTLS override。field: `ca`, `cert`, `key`, `passphrase`（すべてSecretRefを受け付けます）、`serverName`, `insecureSkipVerify`。
    - `request.allowPrivateNetwork`: `true` の場合、provider HTTP fetch guard経由で、DNSがprivate、CGNAT、または類似範囲に解決されるときでも `baseUrl` へのHTTPSを許可します（信頼できるself-hosted OpenAI互換endpoint向けのoperator opt-in）。WebSocketはheader/TLSに同じ `request` を使いますが、そのfetch SSRF gateは使いません。デフォルトは `false`。

  </Accordion>
  <Accordion title="Model catalog entry">
    - `models.providers.*.models`: 明示的なprovider model catalog entry。
    - `models.providers.*.models.*.contextWindow`: native model context window metadata。
    - `models.providers.*.models.*.contextTokens`: 任意のruntime context cap。modelのnative `contextWindow` より小さい実効context budgetを使いたい場合に使用してください。`openclaw models list` は、両者が異なる場合に両方の値を表示します。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性hint。`api: "openai-completions"` で、空でない非native `baseUrl`（hostが `api.openai.com` でない）の場合、OpenClawはランタイムでこれを `false` に強制します。空または省略された `baseUrl` では、デフォルトのOpenAI動作が維持されます。
    - `models.providers.*.models.*.compat.requiresStringContent`: 文字列専用OpenAI互換chat endpoint向けの任意の互換性hint。`true` の場合、OpenClawはrequest送信前に、純テキストの `messages[].content` 配列を平文文字列へflattenします。

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock auto-discovery設定のroot。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙discoveryのon/off。
    - `plugins.entries.amazon-bedrock.config.discovery.region`: discovery用のAWS region。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞るための任意のprovider-id filter。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: discovery refreshのpolling interval。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: discoveryされたmodel用のfallback context window。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: discoveryされたmodel用のfallback max output token。

  </Accordion>
</AccordionGroup>

### Provider例

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.6 / 4.7)">
    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/zai-glm-4.6"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Cerebrasには `cerebras/zai-glm-4.7` を使ってください。Z.AI directには `zai/glm-4.7` を使ってください。

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic互換の組み込みproviderです。shortcut: `openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="ローカルmodel (LM Studio)">
    [Local Models](/ja-JP/gateway/local-models)を参照してください。要点: 十分な性能のあるハードウェアでLM Studio Responses API経由の大きなローカルmodelを実行し、fallback用にhosted modelはマージしたままにしてください。
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    `MINIMAX_API_KEY` を設定してください。shortcut: `openclaw onboard --auth-choice minimax-global-api` または `openclaw onboard --auth-choice minimax-cn-api`。model catalogのデフォルトはM2.7のみです。Anthropic互換streaming経路では、明示的に `thinking` を自分で設定しない限り、OpenClawはデフォルトでMiniMax thinkingを無効にします。`/fast on` または `params.fastMode: true` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
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
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    China endpointでは、`baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn` を使用します。

    ネイティブMoonshot endpointは、共有 `openai-completions` transport上でstreaming usage互換性を公開しており、OpenClawは組み込みprovider id単独ではなく、endpoint capabilityに基づいてこれを判定します。

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zen catalogには `opencode/...` ref、Go catalogには `opencode-go/...` refを使用します。shortcut: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic (Anthropic互換)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    base URLには `/v1` を含めないでください（Anthropic clientがそれを付加します）。shortcut: `openclaw onboard --auth-choice synthetic-api-key`。

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    `ZAI_API_KEY` を設定してください。`z.ai/*` と `z-ai/*` は受け付けられるaliasです。shortcut: `openclaw onboard --auth-choice zai-api-key`。

    - 一般endpoint: `https://api.z.ai/api/paas/v4`
    - コーディングendpoint（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
    - 一般endpointを使用するには、base URL override付きのcustom providerを定義してください。

  </Accordion>
</AccordionGroup>

---

## 関連

- [設定 — agents](/ja-JP/gateway/config-agents)
- [設定 — channels](/ja-JP/gateway/config-channels)
- [Configuration reference](/ja-JP/gateway/configuration-reference) — その他のトップレベルkey
- [Tools and plugins](/ja-JP/tools)
