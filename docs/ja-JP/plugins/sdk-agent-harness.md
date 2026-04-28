---
read_when:
    - あなたは組み込みエージェントランタイムまたはハーネスレジストリを変更しています
    - あなたは、バンドル済みまたは信頼済みの Plugin からエージェントハーネスを登録しています
    - Codex Plugin が model provider とどのような関係にあるかを理解する必要があります
sidebarTitle: Agent Harness
summary: 低レベルの組み込みエージェント実行子を置き換える Plugin 向けの実験的な SDK サーフェス
title: エージェントハーネス Plugin
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:36:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**agent harness** は、準備済みの OpenClaw エージェントの1ターンを実行する低レベルの実行基盤です。これはモデルプロバイダーでも、チャネルでも、ツールレジストリでもありません。
ユーザー向けのメンタルモデルについては、[Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。

このサーフェスは、同梱されたネイティブ Plugin または信頼できるネイティブ Plugin に対してのみ使用してください。契約は、パラメーター型が意図的に現在の組み込みランナーを反映しているため、依然として実験的です。

## ハーネスを使用する場合

モデルファミリーが独自のネイティブセッションランタイムを持ち、通常の OpenClaw プロバイダートランスポートが不適切な抽象化である場合は、agent harness を登録します。

例:

- スレッドと Compaction を管理するネイティブのコーディングエージェントサーバー
- ネイティブの plan/reasoning/tool イベントをストリーミングしなければならないローカル CLI またはデーモン
- OpenClaw セッショントランスクリプトに加えて独自の resume id を必要とするモデルランタイム

新しい LLM API を追加するためだけに harness を登録しては**いけません**。通常の HTTP または WebSocket のモデル API には、[provider plugin](/ja-JP/plugins/sdk-provider-plugins) を構築してください。

## コアが引き続き管理するもの

ハーネスが選択される前に、OpenClaw はすでに以下を解決しています。

- provider と model
- ランタイムの認証状態
- thinking level と context budget
- OpenClaw の transcript/session ファイル
- workspace、sandbox、および tool policy
- channel reply callbacks と streaming callbacks
- model fallback と live model switching policy

この分割は意図的なものです。harness は準備済みの試行を実行するのであり、プロバイダーを選択したり、チャネル配信を置き換えたり、モデルを暗黙に切り替えたりはしません。

準備済みの試行には `params.runtimePlan` も含まれます。これは、Pi とネイティブ harness の両方で共有され続けなければならないランタイム判断のための OpenClaw 管理のポリシーバンドルです。

- プロバイダー対応の tool schema policy のための `runtimePlan.tools.normalize(...)` と
  `runtimePlan.tools.logDiagnostics(...)`
- transcript sanitization と tool-call repair policy のための
  `runtimePlan.transcript.resolvePolicy(...)`
- 共有の `NO_REPLY` と media delivery suppression のための
  `runtimePlan.delivery.isSilentPayload(...)`
- model fallback classification のための
  `runtimePlan.outcome.classifyRunResult(...)`
- 解決済みの provider/model/harness metadata のための
  `runtimePlan.observability`

harness は、Pi の動作と一致させる必要がある判断にこの plan を使用できますが、それでもホスト管理の試行状態として扱う必要があります。これを変更したり、1ターン内で provider/model を切り替えるために使用したりしないでください。

## ハーネスを登録する

**インポート:** `openclaw/plugin-sdk/agent-harness`

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

## 選択ポリシー

OpenClaw は provider/model の解決後に harness を選択します。

1. 既存セッションに記録された harness id が優先されるため、config/env の変更によってその transcript が別のランタイムへホットスイッチされることはありません。
2. `OPENCLAW_AGENT_RUNTIME=<id>` は、まだ固定されていないセッションに対して、その id を持つ登録済み harness を強制します。
3. `OPENCLAW_AGENT_RUNTIME=pi` は組み込みの Pi harness を強制します。
4. `OPENCLAW_AGENT_RUNTIME=auto` は、解決済みの provider/model をサポートしているかどうかを登録済み harness に問い合わせます。
5. 一致する登録済み harness がない場合、Pi fallback が無効化されていなければ OpenClaw は Pi を使用します。

Plugin harness の失敗は実行失敗として表面化します。`auto` モードでは、解決済みの
provider/model をサポートする登録済み Plugin harness が存在しない場合にのみ、Pi fallback が使用されます。いったん Plugin harness が実行を引き受けた後は、OpenClaw は同じターンを Pi 経由で再実行しません。なぜなら、それによって認証やランタイムの意味論が変わったり、副作用が重複したりする可能性があるためです。

選択された harness id は、組み込み実行後にセッション id とともに永続化されます。harness pin が導入される前に作成されたレガシーセッションは、transcript 履歴を持つ時点で Pi 固定として扱われます。Pi とネイティブ Plugin harness の間で切り替える場合は、新しいセッションまたはリセット済みセッションを使用してください。`/status` には、`Fast` の横に `codex` のようなデフォルト以外の harness id が表示されます。Pi はデフォルトの互換パスであるため表示されません。選択された harness が想定外である場合は、`agents/harness` のデバッグログを有効にして、gateway の構造化された `agent harness selected` レコードを確認してください。そこには、選択された harness id、選択理由、runtime/fallback policy、および `auto` モードでは各 Plugin 候補の support 結果が含まれます。

同梱の Codex Plugin は、その harness id として `codex` を登録します。コアはそれを通常の Plugin harness id として扱います。Codex 固有のエイリアスは、共有ランタイムセレクターではなく、Plugin またはオペレーター設定に属します。

## provider と harness の組み合わせ

ほとんどの harness は provider も登録するべきです。provider は、model ref、認証状態、model metadata、および `/model` 選択を OpenClaw の残りの部分から見えるようにします。その後、harness は `supports(...)` でその provider を引き受けます。

同梱の Codex Plugin はこのパターンに従います。

- 推奨されるユーザー model ref: `openai/gpt-5.5` と
  `agentRuntime.id: "codex"`
- 互換 ref: レガシーな `codex/gpt-*` ref も引き続き受け付けられますが、新しい
  config では通常の provider/model ref として使用しないでください
- harness id: `codex`
- 認証: 合成された provider availability。Codex harness がネイティブの
  Codex login/session を管理するため
- app-server request: OpenClaw は Codex に素の model id を送信し、
  harness がネイティブ app-server protocol と通信します

Codex Plugin は追加的なものです。通常の `openai/gpt-*` ref は、`agentRuntime.id: "codex"` で Codex harness を強制しない限り、引き続き通常の OpenClaw provider パスを使用します。古い `codex/gpt-*` ref も、互換性のために引き続き Codex provider と harness を選択します。

オペレーター向けのセットアップ、model prefix の例、および Codex 専用設定については、[Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。

OpenClaw は Codex app-server `0.125.0` 以降を必要とします。Codex Plugin は app-server の initialize handshake をチェックし、古いサーバーまたはバージョン未報告のサーバーをブロックすることで、OpenClaw がテスト済みの protocol surface に対してのみ動作するようにします。`0.125.0` の下限には、Codex `0.124.0` で導入されたネイティブ MCP hook payload サポートが含まれています。また同時に、OpenClaw を新しいテスト済みの安定系統に固定します。

### Tool-result ミドルウェア

同梱 Plugin は、manifest で対象 runtime id を `contracts.agentToolResultMiddleware` に宣言している場合、`api.registerAgentToolResultMiddleware(...)` を通じてランタイム中立の tool-result ミドルウェアを追加できます。この信頼された接続点は、PI または Codex が tool 出力をモデルへ返す前に実行しなければならない非同期の tool-result 変換のためのものです。

レガシーな同梱 Plugin は引き続き
`api.registerCodexAppServerExtensionFactory(...)` を Codex app-server 専用ミドルウェアに使用できますが、新しい result transform ではランタイム中立 API を使うべきです。
Pi 専用の `api.registerEmbeddedExtensionFactory(...)` フックは削除されました。
Pi の tool-result 変換はランタイム中立ミドルウェアを使用しなければなりません。

### 終端結果の分類

独自の protocol projection を管理するネイティブ harness は、完了したターンで可視の assistant テキストが生成されなかった場合に、
`openclaw/plugin-sdk/agent-harness-runtime` の
`classifyAgentHarnessTerminalOutcome(...)` を使用できます。このヘルパーは `empty`、`reasoning-only`、または `planning-only` を返し、OpenClaw の fallback policy が別モデルで再試行すべきかどうかを判断できるようにします。これは、prompt error、進行中ターン、および `NO_REPLY` のような意図的な silent reply を意図的に未分類のままにします。

### ネイティブ Codex harness モード

同梱の `codex` harness は、組み込み OpenClaw エージェントターン向けのネイティブ Codex モードです。まず同梱の `codex` Plugin を有効にし、設定で制限付き allowlist を使用している場合は `plugins.allow` に `codex` を含めてください。ネイティブ app-server 設定では、`agentRuntime.id: "codex"` を付けた `openai/gpt-*` を使用する必要があります。代わりに PI 経由の Codex OAuth には `openai-codex/*` を使用してください。レガシーな `codex/*` model ref は、ネイティブ harness の互換エイリアスとして引き続き残されています。

このモードで実行される場合、Codex はネイティブ thread id、resume 動作、Compaction、および app-server 実行を管理します。OpenClaw は引き続き、chat channel、可視 transcript mirror、tool policy、approval、media delivery、および session selection を管理します。実行を Codex app-server パスだけが引き受けられることを証明する必要がある場合は、`fallback` オーバーライドなしで `agentRuntime.id: "codex"` を使用してください。明示的な Plugin ランタイムは、デフォルトですでにクローズドフェイルします。harness 選択がない場合に意図的に PI に処理させたい場合のみ、`fallback: "pi"` を設定してください。Codex app-server の失敗は、PI 経由で再試行されず、そのまま直接失敗します。

## Pi fallback を無効にする

デフォルトでは、OpenClaw は組み込みエージェントを `agents.defaults.agentRuntime` が `{ id: "auto", fallback: "pi" }` に設定された状態で実行します。`auto` モードでは、登録済み Plugin harness が provider/model の組み合わせを引き受けることができます。一致するものがなければ、OpenClaw は Pi に fallback します。

`auto` モードでは、Plugin harness の選択漏れ時に Pi を使わず失敗させたい場合、`fallback: "none"` を設定してください。`runtime: "codex"` のような明示的な Plugin ランタイムは、同じ config または環境オーバーライドスコープで `fallback: "pi"` が設定されていない限り、デフォルトですでにクローズドフェイルします。選択済み Plugin harness の失敗は常にハードフェイルします。これは明示的な `runtime: "pi"` または `OPENCLAW_AGENT_RUNTIME=pi` を妨げるものではありません。

Codex 専用の組み込み実行の場合:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

登録済みの任意の Plugin harness が一致するモデルを引き受けられるようにしつつ、OpenClaw が暗黙に Pi へ fallback することは決して望まない場合は、`runtime: "auto"` を維持し、fallback を無効にしてください。

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

エージェント単位のオーバーライドも同じ形を使用します。

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` は引き続き設定済み runtime を上書きします。環境から Pi fallback を無効にするには、`OPENCLAW_AGENT_HARNESS_FALLBACK=none` を使用してください。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

fallback を無効にすると、要求された harness が登録されていない場合、解決済みの provider/model をサポートしていない場合、またはターンの副作用を生成する前に失敗した場合に、セッションは早期に失敗します。これは、Codex 専用デプロイメントや、Codex app-server パスが実際に使われていることを証明しなければならないライブテストにとって意図された動作です。

この設定は組み込み agent harness のみを制御します。image、video、music、TTS、PDF、またはその他の provider 固有モデルルーティングを無効にするものではありません。

## ネイティブセッションと transcript mirror

harness はネイティブ session id、thread id、またはデーモン側の resume token を保持していてもかまいません。そのバインディングは OpenClaw セッションに明示的に関連付けたままにし、ユーザーに見える assistant/tool 出力は OpenClaw transcript にミラーし続けてください。

OpenClaw transcript は引き続き、以下のための互換レイヤーです。

- channel に表示される session history
- transcript の検索とインデックス作成
- 後続ターンで組み込み Pi harness に戻すこと
- 汎用の `/new`、`/reset`、および session deletion の動作

harness が sidecar binding を保存する場合は、所有する OpenClaw セッションがリセットされたときに OpenClaw がそれをクリアできるよう、`reset(...)` を実装してください。

## tool と media の結果

コアは OpenClaw の tool list を構築し、それを準備済みの試行に渡します。
harness が動的な tool call を実行する場合は、チャネル media を自分で送信するのではなく、harness result shape を通じて tool result を返してください。

これにより、text、image、video、music、TTS、approval、および messaging-tool 出力が、PI ベースの実行と同じ配信経路に維持されます。

## 現在の制限

- 公開 import path は汎用ですが、一部の attempt/result type alias には互換性のために依然として `Pi` 名が残っています。
- サードパーティ harness のインストールは実験的です。ネイティブセッションランタイムが必要になるまでは、provider plugin を優先してください。
- harness の切り替えはターン間でサポートされています。ネイティブ tool、approval、assistant テキスト、または message send が開始された後に、ターンの途中で harness を切り替えないでください。

## 関連項目

- [SDK Overview](/ja-JP/plugins/sdk-overview)
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime)
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins)
- [Codex Harness](/ja-JP/plugins/codex-harness)
- [Model Providers](/ja-JP/concepts/model-providers)
