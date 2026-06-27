---
read_when:
    - 組み込みエージェントランタイムまたはハーネスレジストリを変更しています
    - バンドル済みまたは信頼済み Plugin からエージェントハーネスを登録しています
    - Codex Plugin がモデルプロバイダーとどのように関係するかを理解する必要があります
sidebarTitle: Agent Harness
summary: Plugin が低レベルの組み込みエージェント実行器を置き換えるための実験的な SDK サーフェス
title: エージェントハーネスプラグイン
x-i18n:
    generated_at: "2026-06-27T12:30:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**エージェントハーネス**は、準備済みの OpenClaw エージェント 1 ターンを実行する低レベルの実行器です。モデルプロバイダーでも、チャネルでも、ツールレジストリでもありません。
ユーザー向けのメンタルモデルについては、[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。

このサーフェスは、バンドル済みまたは信頼済みのネイティブ Plugin にのみ使用してください。この契約は、パラメーター型が意図的に現在の埋め込みランナーを反映しているため、まだ実験的です。

## ハーネスを使う場合

モデルファミリーが独自のネイティブセッションランタイムを持ち、通常の OpenClaw プロバイダートランスポートが適切な抽象化ではない場合に、エージェントハーネスを登録します。

例:

- スレッドと Compaction を所有するネイティブのコーディングエージェントサーバー
- ネイティブの計画/推論/ツールイベントをストリーミングする必要があるローカル CLI またはデーモン
- OpenClaw セッショントランスクリプトに加えて独自の再開 ID を必要とするモデルランタイム

新しい LLM API を追加するだけのためにハーネスを登録しないでください。通常の HTTP または WebSocket モデル API では、[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)を構築してください。

## コアが引き続き所有するもの

ハーネスが選択される前に、OpenClaw はすでに次を解決しています。

- プロバイダーとモデル
- ランタイム認証状態
- 思考レベルとコンテキスト予算
- OpenClaw トランスクリプト/セッションファイル
- ワークスペース、サンドボックス、ツールポリシー
- チャネル返信コールバックとストリーミングコールバック
- モデルフォールバックとライブモデル切り替えポリシー

この分離は意図的なものです。ハーネスは準備済みの試行を実行します。プロバイダーを選択したり、チャネル配信を置き換えたり、モデルを暗黙に切り替えたりするものではありません。

準備済みの試行には、`params.runtimePlan` も含まれます。これは、OpenClaw とネイティブハーネスの間で共有されたままである必要があるランタイム判断のための、OpenClaw 所有のポリシーバンドルです。

- プロバイダー認識のツールスキーマポリシー向けの `runtimePlan.tools.normalize(...)` と
  `runtimePlan.tools.logDiagnostics(...)`
- トランスクリプトのサニタイズとツール呼び出し修復ポリシー向けの `runtimePlan.transcript.resolvePolicy(...)`
- 共有 `NO_REPLY` とメディア配信抑制向けの `runtimePlan.delivery.isSilentPayload(...)`
- モデルフォールバック分類向けの `runtimePlan.outcome.classifyRunResult(...)`
- 解決済みのプロバイダー/モデル/ハーネスメタデータ向けの `runtimePlan.observability`

ハーネスは OpenClaw の挙動と一致させる必要がある判断にこの計画を使用できますが、それでもホスト所有の試行状態として扱うべきです。これを変更したり、ターン内でプロバイダー/モデルを切り替えるために使用したりしないでください。

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

OpenClaw は、プロバイダー/モデル解決後にハーネスを選択します。

1. モデルスコープのランタイムポリシーが優先されます。
2. 次にプロバイダースコープのランタイムポリシーが続きます。
3. `auto` は、登録済みハーネスに、解決済みのプロバイダー/モデルをサポートしているか問い合わせます。
4. 一致する登録済みハーネスがない場合、OpenClaw は埋め込みランタイムを使用します。

Plugin ハーネスの失敗は実行失敗として表面化します。`auto` モードでは、解決済みのプロバイダー/モデルをサポートする登録済み Plugin ハーネスがない場合にのみ、埋め込みフォールバックが使用されます。いったん Plugin ハーネスが実行を引き受けると、OpenClaw は同じターンを別のランタイムで再実行しません。そうすると認証/ランタイムの意味論が変わったり、副作用が重複したりする可能性があるためです。

セッション全体およびエージェント全体のランタイム固定は、選択では無視されます。これには、古いセッションの `agentHarnessId` 値、`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、`OPENCLAW_AGENT_RUNTIME` が含まれます。`/status` は、プロバイダー/モデルルートから選択された実効ランタイムを表示します。
選択されたハーネスが予想外の場合は、`agents/harness` デバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを確認してください。そこには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、そして `auto` モードでは各 Plugin 候補のサポート結果が含まれます。

バンドル済みの Codex Plugin は、ハーネス ID として `codex` を登録します。コアはそれを通常の Plugin ハーネス ID として扱います。Codex 固有のエイリアスは、共有ランタイムセレクターではなく Plugin またはオペレーター設定に属します。

## プロバイダーとハーネスの組み合わせ

ほとんどのハーネスはプロバイダーも登録するべきです。プロバイダーは、モデル参照、認証状態、モデルメタデータ、`/model` 選択を OpenClaw の他の部分から見えるようにします。その後、ハーネスは `supports(...)` でそのプロバイダーを引き受けます。

バンドル済みの Codex Plugin はこのパターンに従います。

- 推奨されるユーザーモデル参照: `openai/gpt-5.5`
- 互換性参照: レガシーな `codex/gpt-*` 参照は引き続き受け付けられますが、新しい設定では通常のプロバイダー/モデル参照として使用するべきではありません
- ハーネス ID: `codex`
- 認証: Codex ハーネスがネイティブ Codex ログイン/セッションを所有するため、合成されたプロバイダー可用性
- アプリサーバーリクエスト: OpenClaw は素のモデル ID を Codex に送信し、ハーネスにネイティブアプリサーバープロトコルと通信させます

Codex Plugin は追加的なものです。公式 OpenAI プロバイダー上の通常の `openai/gpt-*` エージェント参照は、デフォルトで Codex ハーネスを選択します。古い `codex/gpt-*` 参照も、互換性のために Codex プロバイダーとハーネスを引き続き選択します。

オペレーター設定、モデルプレフィックス例、Codex 専用設定については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

OpenClaw は Codex アプリサーバー `0.125.0` 以降を要求します。Codex Plugin はアプリサーバーの初期化ハンドシェイクを確認し、古いサーバーやバージョン不明のサーバーをブロックします。これにより、OpenClaw はテスト済みのプロトコルサーフェスに対してのみ実行されます。`0.125.0` の下限には、Codex `0.124.0` で導入されたネイティブ MCP フックペイロードサポートが含まれ、同時に OpenClaw はより新しいテスト済み安定ラインに固定されます。

### ツール結果ミドルウェア

バンドル済み Plugin、および一致するマニフェスト契約を持つ明示的に有効化されたインストール済み Plugin は、マニフェストが `contracts.agentToolResultMiddleware` で対象ランタイム ID を宣言している場合、`api.registerAgentToolResultMiddleware(...)` を通じてランタイム中立のツール結果ミドルウェアを取り付けられます。この信頼済みの接点は、OpenClaw または Codex がツール出力をモデルに戻す前に実行する必要がある非同期のツール結果変換向けです。

レガシーなバンドル済み Plugin は、Codex アプリサーバー専用ミドルウェア向けに引き続き `api.registerCodexAppServerExtensionFactory(...)` を使用できますが、新しい結果変換ではランタイム中立 API を使用するべきです。
埋め込みランナー専用の `api.registerEmbeddedExtensionFactory(...)` フックは削除されました。埋め込みツール結果変換は、ランタイム中立ミドルウェアを使用する必要があります。

### ターミナル結果分類

独自のプロトコル投影を所有するネイティブハーネスは、完了したターンで可視のアシスタントテキストが生成されなかった場合に、`openclaw/plugin-sdk/agent-harness-runtime` の `classifyAgentHarnessTerminalOutcome(...)` を使用できます。このヘルパーは `empty`、`reasoning-only`、または `planning-only` を返し、OpenClaw のフォールバックポリシーが別のモデルで再試行するかどうかを判断できるようにします。`planning-only` には、ハーネスの明示的な `planText` フィールドが必要です。OpenClaw はアシスタントの文章からそれを推測しません。このヘルパーは意図的に、プロンプトエラー、進行中のターン、`NO_REPLY` のような意図的なサイレント返信を未分類のままにします。

### エージェント終了時の副作用

ネイティブハーネスは、試行を確定した後に `openclaw/plugin-sdk/agent-harness-runtime` の `runAgentEndSideEffects(...)` を呼び出す必要があります。これは、対話的な返信を遅延させずに、ポータブルな `agent_end` フックと OpenClaw のリサーチキャプチャをディスパッチします。ローカルの非対話実行で、それらの副作用が完了するまで試行を解決してはいけない場合は、`awaitAgentEndSideEffects(...)` を使用してください。両方のヘルパーは、`runAgentHarnessAgentEndHook(...)` と同じ `{ event, ctx }` ペイロードを受け取ります。これらの失敗は、完了済み試行の結果を変更しません。

### ユーザー入力とツールサーフェス

ランタイムレベルのユーザー入力リクエストを公開するネイティブハーネスは、`openclaw/plugin-sdk/agent-harness-runtime` のユーザー入力ヘルパーを使用して、プロンプトを整形し、OpenClaw のブロッキング返信パスを通じて配信し、選択式/自由入力の回答をランタイムのネイティブ応答形状へ正規化するべきです。このヘルパーは、各ハーネスが独自のプロトコル解析と保留リクエストのライフサイクルを維持しつつ、チャネル/TUI 表示の一貫性を保ちます。

PI 風のコンパクトなツールルーティングを必要とするネイティブハーネスは、`openclaw/plugin-sdk/agent-harness-tool-runtime` の `createAgentHarnessToolSurfaceRuntime(...)` を使用するべきです。これは、ツール検索/コードモード制御の選択、ローカルモデル向けの軽量デフォルト、ランタイム互換のスキーマフィルタリング、隠しカタログ実行、ディレクトリのハイドレーション、カタログクリーンアップを所有します。ハーネスは引き続き、SDK 固有のツール変換とネイティブ実行コールバックを所有します。

### ネイティブ Codex ハーネスモード

バンドル済みの `codex` ハーネスは、埋め込み OpenClaw エージェントターン向けのネイティブ Codex モードです。まずバンドル済みの `codex` Plugin を有効化し、設定で制限的な許可リストを使用している場合は `plugins.allow` に `codex` を含めてください。ネイティブアプリサーバー設定では `openai/gpt-*` を使用するべきです。OpenAI エージェントターンは、デフォルトで Codex ハーネスを選択します。レガシーな Codex モデル参照ルートは `openclaw doctor --fix` で修復するべきであり、レガシーな `codex/*` モデル参照はネイティブハーネス向けの互換エイリアスとして残ります。

このモードが実行されると、Codex はネイティブスレッド ID、再開挙動、Compaction、アプリサーバー実行を所有します。OpenClaw は引き続き、チャットチャネル、可視トランスクリプトミラー、ツールポリシー、承認、メディア配信、セッション選択を所有します。Codex アプリサーバーパスだけが実行を引き受けられることを証明する必要がある場合は、プロバイダー/モデルの `agentRuntime.id: "codex"` を使用してください。明示的な Plugin ランタイムはフェイルクローズします。Codex アプリサーバー選択失敗とランタイム失敗は、別のランタイムで再試行されません。

## ランタイムの厳格性

デフォルトでは、OpenClaw は `auto` プロバイダー/モデルランタイムポリシーを使用します。登録済み Plugin ハーネスはプロバイダー/モデルの組み合わせを引き受けることができ、一致するものがない場合は埋め込みランタイムがターンを処理します。公式 OpenAI プロバイダー上の OpenAI エージェント参照は、デフォルトで Codex になります。
ハーネス選択が欠落した場合に埋め込みランタイムへルーティングするのではなく失敗させたい場合は、`agentRuntime.id: "codex"` のような明示的なプロバイダー/モデル Plugin ランタイムを使用してください。選択された Plugin ハーネスの失敗は常にハード失敗になります。これは、明示的なプロバイダー/モデル `agentRuntime.id: "openclaw"` を妨げません。

Codex 専用の埋め込み実行の場合:

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

1 つの正準モデルに CLI バックエンドを使いたい場合は、そのモデルエントリにランタイムを置きます。

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

エージェントごとの上書きは、同じモデルスコープの形状を使用します。

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

このようなレガシーなエージェント全体のランタイム例は無視されます。

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

明示的な Plugin ランタイムでは、要求された
ハーネスが登録されていない、解決されたプロバイダー/モデルをサポートしていない、または
ターンの副作用を生成する前に失敗した場合、セッションは早期に失敗します。これは Codex 専用の
デプロイと、Codex アプリサーバーパスが
実際に使用されていることを証明する必要があるライブテストを意図したものです。

この設定は埋め込みエージェントハーネスのみを制御します。画像、動画、音楽、TTS、PDF、またはその他のプロバイダー固有のモデルルーティングは無効にしません。

## ネイティブセッションとトランスクリプトミラー

ハーネスはネイティブセッション ID、スレッド ID、またはデーモン側の再開トークンを保持する場合があります。
その関連付けを OpenClaw セッションに明示的に関連付けたままにし、
ユーザーに表示されるアシスタント/ツール出力を OpenClaw トランスクリプトへミラーし続けます。

OpenClaw トランスクリプトは、以下の互換性レイヤーであり続けます。

- チャンネルに表示されるセッション履歴
- トランスクリプト検索とインデックス作成
- 後続のターンで組み込み OpenClaw ハーネスへ戻す切り替え
- 汎用の `/new`、`/reset`、およびセッション削除動作

ハーネスがサイドカーの関連付けを保存する場合、所有する OpenClaw セッションがリセットされたときに OpenClaw が
それをクリアできるように `reset(...)` を実装してください。

## ツールとメディアの結果

コアは OpenClaw ツールリストを構築し、それを準備済み試行へ渡します。
ハーネスが動的ツール呼び出しを実行するときは、チャンネルメディアを自分で送信するのではなく、
ハーネス結果の形を通じてツール結果を返してください。

これにより、テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力が、
OpenClaw ベースの実行と同じ配信パス上に保たれます。

## 現在の制限

- 公開インポートパスは汎用ですが、一部の試行/結果型エイリアスには互換性のため
  レガシー名がまだ残っています。
- サードパーティ製ハーネスのインストールは実験的です。ネイティブセッションランタイムが必要になるまでは、
  プロバイダーPluginを優先してください。
- ハーネスの切り替えはターン間でサポートされています。ネイティブツール、承認、アシスタントテキスト、またはメッセージ送信が開始された後に、
  ターンの途中でハーネスを切り替えないでください。

## 関連

- [SDK 概要](/ja-JP/plugins/sdk-overview)
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)
- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
