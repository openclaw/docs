---
read_when:
    - 埋め込みエージェントランタイムまたはハーネスレジストリを変更している
    - バンドル済みまたは信頼済みPluginからエージェントハーネスを登録しています
    - Codex Plugin とモデルプロバイダーの関係を理解する必要があります
sidebarTitle: Agent Harness
summary: 低レベルの組み込みエージェント実行器を置き換える Plugin 向けの実験的な SDK サーフェス
title: エージェントハーネスプラグイン
x-i18n:
    generated_at: "2026-05-10T19:45:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness** は、準備済みの OpenClaw agent の 1 ターンを実行する低レベルの executor です。
これは model provider でも、channel でも、tool registry でもありません。
ユーザー向けのメンタルモデルについては、[Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。

この surface は、同梱または信頼済みの native Plugin にのみ使用してください。この contract はまだ実験的です。parameter type が意図的に現在の embedded runner を反映しているためです。

## harness を使う場面

model family が独自の native session runtime を持ち、通常の OpenClaw provider transport が適切な抽象化ではない場合に、agent harness を登録します。

例:

- thread と compaction を所有する native coding-agent server
- native plan/reasoning/tool event を stream する必要がある local CLI または daemon
- OpenClaw session transcript に加えて独自の resume id を必要とする model runtime

新しい LLM API を追加するためだけに harness を登録しないでください。通常の HTTP または WebSocket model API では、[provider Plugin](/ja-JP/plugins/sdk-provider-plugins) を作成してください。

## core が引き続き所有するもの

harness が選択される前に、OpenClaw はすでに以下を解決しています。

- provider と model
- runtime auth state
- thinking level と context budget
- OpenClaw transcript/session file
- workspace、sandbox、tool policy
- channel reply callback と streaming callback
- model fallback と live model switching policy

この分離は意図的です。harness は準備済みの attempt を実行します。provider を選択したり、channel delivery を置き換えたり、model を黙って切り替えたりするものではありません。

準備済みの attempt には、PI と native harness の間で共有されたままにする必要がある runtime decision 用の OpenClaw 所有 policy bundle である `params.runtimePlan` も含まれます。

- provider-aware tool schema policy 用の `runtimePlan.tools.normalize(...)` と
  `runtimePlan.tools.logDiagnostics(...)`
- transcript sanitization と tool-call repair policy 用の `runtimePlan.transcript.resolvePolicy(...)`
- 共有 `NO_REPLY` と media delivery suppression 用の `runtimePlan.delivery.isSilentPayload(...)`
- model fallback classification 用の `runtimePlan.outcome.classifyRunResult(...)`
- 解決済み provider/model/harness metadata 用の `runtimePlan.observability`

harness は、PI の挙動と一致させる必要がある判断に plan を使用できますが、それでも host 所有の attempt state として扱うべきです。これを mutate したり、ターン内で provider/model を切り替えるために使用したりしないでください。

## harness を登録する

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 選択 policy

OpenClaw は provider/model 解決後に harness を選択します。

1. model-scoped runtime policy が優先されます。
2. 次に provider-scoped runtime policy が続きます。
3. `auto` は、登録済み harness に対して、解決済みの provider/model を support するかを問い合わせます。
4. 一致する登録済み harness がない場合、PI fallback が disabled でない限り OpenClaw は PI を使用します。

Plugin harness の failure は run failure として surface します。`auto` mode では、PI fallback は、解決済み provider/model を support する登録済み Plugin harness がない場合にのみ使用されます。Plugin harness が run を claim した後、OpenClaw はその同じターンを PI 経由で replay しません。これは auth/runtime semantics を変えたり side effect を重複させたりする可能性があるためです。

whole-session と whole-agent の runtime pin は selection では無視されます。これには古い session `agentHarnessId` 値、`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、`OPENCLAW_AGENT_RUNTIME` が含まれます。`/status` は provider/model route から選択された effective runtime を表示します。
選択された harness が予想外の場合は、`agents/harness` debug logging を有効にし、gateway の structured `agent harness selected` record を確認してください。これには、選択された harness id、selection reason、runtime/fallback policy、そして `auto` mode では各 Plugin candidate の support result が含まれます。

同梱の Codex Plugin は `codex` を harness id として登録します。core はそれを通常の Plugin harness id として扱います。Codex-specific alias は Plugin または operator config に属し、shared runtime selector には属しません。

## Provider と harness の組み合わせ

ほとんどの harness は provider も登録するべきです。provider は model ref、auth status、model metadata、`/model` selection を OpenClaw の他の部分から見えるようにします。harness はその後、`supports(...)` でその provider を claim します。

同梱の Codex Plugin はこの pattern に従います。

- 推奨される user model ref: `openai/gpt-5.5`
- compatibility ref: legacy `codex/gpt-*` ref は引き続き受け入れられますが、新しい config では通常の provider/model ref として使用すべきではありません
- harness id: `codex`
- auth: synthetic provider availability。Codex harness が native Codex login/session を所有するためです
- app-server request: OpenClaw は bare model id を Codex に送信し、harness に native app-server protocol と通信させます

Codex Plugin は additive です。official OpenAI provider 上の plain `openai/gpt-*` agent ref はデフォルトで Codex harness を選択します。古い `codex/gpt-*` ref も compatibility のために Codex provider と harness を引き続き選択します。

operator setup、model prefix example、Codex-only config については、[Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。

OpenClaw には Codex app-server `0.125.0` 以降が必要です。Codex Plugin は app-server initialize handshake を確認し、古い server または version のない server をブロックします。これにより、OpenClaw は test 済みの protocol surface に対してのみ実行されます。`0.125.0` floor には Codex `0.124.0` で入った native MCP hook payload support が含まれ、同時に OpenClaw をより新しい test 済み stable line に pin します。

### Tool-result middleware

同梱 Plugin は、manifest が `contracts.agentToolResultMiddleware` で対象 runtime id を宣言している場合、`api.registerAgentToolResultMiddleware(...)` を通じて runtime-neutral tool-result middleware を attach できます。この信頼済み seam は、PI または Codex が tool output を model に戻す前に実行する必要がある async tool-result transform 用です。

legacy bundled Plugin は Codex app-server-only middleware 用に引き続き `api.registerCodexAppServerExtensionFactory(...)` を使用できますが、新しい result transform は runtime-neutral API を使用するべきです。
Pi-only の `api.registerEmbeddedExtensionFactory(...)` hook は削除されました。Pi tool-result transform は runtime-neutral middleware を使用する必要があります。

### Terminal outcome classification

独自の protocol projection を所有する native harness は、完了したターンが visible assistant text を生成しなかった場合に、`openclaw/plugin-sdk/agent-harness-runtime` の `classifyAgentHarnessTerminalOutcome(...)` を使用できます。この helper は `empty`、`reasoning-only`、または `planning-only` を返し、OpenClaw の fallback policy が別の model で retry するかを判断できるようにします。prompt error、in-flight turn、`NO_REPLY` などの意図的な silent reply は意図的に unclassified のままにします。

### Native Codex harness mode

同梱の `codex` harness は、embedded OpenClaw agent turn 用の native Codex mode です。まず同梱の `codex` Plugin を有効にし、config が restrictive allowlist を使用している場合は `plugins.allow` に `codex` を含めます。native app-server config は `openai/gpt-*` を使用するべきです。OpenAI agent turn はデフォルトで Codex harness を選択します。legacy `openai-codex/*` route は `openclaw doctor --fix` で repair するべきで、legacy `codex/*` model ref は native harness の compatibility alias として残ります。

この mode の実行時、Codex は native thread id、resume behavior、compaction、app-server execution を所有します。OpenClaw は引き続き chat channel、visible transcript mirror、tool policy、approval、media delivery、session selection を所有します。Codex app-server path だけが run を claim できることを証明する必要がある場合は、provider/model `agentRuntime.id: "codex"` を使用してください。明示的な Plugin runtime は fail closed します。Codex app-server selection failure と runtime failure は PI 経由で retry されません。

## Runtime strictness

デフォルトでは、OpenClaw は `auto` provider/model runtime policy を使用します。登録済み Plugin harness は provider/model pair を claim でき、一致するものがない場合は PI がターンを処理します。official OpenAI provider 上の OpenAI agent ref はデフォルトで Codex になります。harness selection が missing の場合に PI 経由で route するのではなく fail させる必要がある場合は、`agentRuntime.id: "codex"` のような明示的な provider/model Plugin runtime を使用してください。選択された Plugin harness failure は常に hard failure になります。これは明示的な provider/model `agentRuntime.id: "pi"` をブロックしません。

Codex-only embedded run の場合:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

1 つの canonical model に CLI backend を使いたい場合は、その model entry に runtime を置きます。

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

per-agent override は同じ model-scoped shape を使用します。

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

このような legacy whole-agent runtime example は無視されます。

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

明示的な Plugin runtime では、要求された harness が登録されていない、解決済み provider/model を support していない、またはターンの side effect を生成する前に失敗した場合、session は早期に fail します。これは Codex-only deployment と、Codex app-server path が実際に使用されていることを証明する必要がある live test では意図的な挙動です。

この設定は embedded agent harness だけを制御します。image、video、music、TTS、PDF、その他の provider-specific model routing は disable しません。

## Native session と transcript mirror

harness は native session id、thread id、または daemon-side resume token を保持できます。その binding を OpenClaw session と明示的に関連付け、user-visible assistant/tool output を OpenClaw transcript に mirror し続けてください。

OpenClaw transcript は、以下の compatibility layer であり続けます。

- channel-visible session history
- transcript search と indexing
- 後続ターンで組み込み PI harness に戻すこと
- generic `/new`、`/reset`、session deletion behavior

harness が sidecar binding を保存する場合は、所有する OpenClaw session が reset されたときに OpenClaw がそれを clear できるように `reset(...)` を実装してください。

## Tool と media result

core は OpenClaw tool list を構築し、それを準備済み attempt に渡します。harness が dynamic tool call を実行する場合は、channel media を自分で送信するのではなく、harness result shape を通じて tool result を返してください。

これにより、text、image、video、music、TTS、approval、messaging-tool output が、PI-backed run と同じ delivery path に維持されます。

## 現在の制限

- public import path は generic ですが、一部の attempt/result type alias は compatibility のためにまだ `Pi` 名を持っています。
- third-party harness installation は実験的です。native session runtime が必要になるまでは provider Plugin を推奨します。
- harness switching はターン間で support されています。native tool、approval、assistant text、または message send が開始された後、ターンの途中で harness を切り替えないでください。

## 関連

- [SDK の概要](/ja-JP/plugins/sdk-overview)
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)
- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
