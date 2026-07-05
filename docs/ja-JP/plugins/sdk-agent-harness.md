---
read_when:
    - 埋め込みエージェントランタイムまたはハーネスレジストリを変更しています
    - バンドル済みまたは信頼済み Plugin からエージェントハーネスを登録しています
    - Codex Plugin がモデルプロバイダーとどのように関係するかを理解する必要があります
sidebarTitle: Agent Harness
summary: 低レベルの組み込みエージェント実行器を置き換えるplugins向けの実験的SDKサーフェス
title: エージェントハーネスPlugin
x-i18n:
    generated_at: "2026-07-05T11:37:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 969213232ebde462ae20a4f13876f27f778b7d6ace7e7be1ba3d8e04e8fa5ed2
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**エージェントハーネス**は、準備済みの OpenClaw エージェントターン 1 回を実行する低レベルの実行器です。モデルプロバイダーでも、チャンネルでも、ツールレジストリでもありません。ユーザー向けのメンタルモデルについては、[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。

このサーフェスは、バンドル済みまたは信頼済みのネイティブ Plugin にのみ使用してください。パラメーター型が現在の組み込みランナーを意図的に反映しているため、この契約はまだ実験的です。

## ハーネスを使うべき場合

モデルファミリーが独自のネイティブセッションランタイムを持ち、通常の OpenClaw プロバイダートランスポートが適切な抽象化ではない場合に、エージェントハーネスを登録します。

- スレッドと Compaction を所有するネイティブのコーディングエージェントサーバー
- ネイティブの計画/推論/ツールイベントをストリームする必要があるローカル CLI またはデーモン
- OpenClaw セッショントランスクリプトに加えて独自の再開 ID が必要なモデルランタイム

新しい LLM API を追加するためだけにハーネスを登録しないでください。通常の HTTP または WebSocket モデル API の場合は、[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)を構築してください。

## コアが引き続き所有するもの

ハーネスが選択される前に、OpenClaw はすでに次を解決しています。

- プロバイダーとモデル
- ランタイム認証状態
- 思考レベルとコンテキスト予算
- OpenClaw トランスクリプト/セッションファイル
- ワークスペース、サンドボックス、ツールポリシー
- チャンネル返信コールバックとストリーミングコールバック
- モデルフォールバックとライブモデル切り替えポリシー

ハーネスは準備済みの試行を実行します。プロバイダーを選択したり、チャンネル配信を置き換えたり、モデルを黙って切り替えたりするものではありません。

準備済みの試行には `params.runtimePlan` も含まれます。これは、OpenClaw とネイティブハーネスの間で共有され続ける必要があるランタイム判断用の、OpenClaw 所有のポリシーバンドルです。

- プロバイダー対応のツールスキーマポリシー用の `runtimePlan.tools.normalize(...)` と `runtimePlan.tools.logDiagnostics(...)`
- トランスクリプトのサニタイズとツール呼び出し修復ポリシー用の `runtimePlan.transcript.resolvePolicy(...)`
- 共有 `NO_REPLY` とメディア配信抑制用の `runtimePlan.delivery.isSilentPayload(...)`
- モデルフォールバック分類用の `runtimePlan.outcome.classifyRunResult(...)`
- 解決済みのプロバイダー/モデル/ハーネスメタデータ用の `runtimePlan.observability`

ハーネスは、OpenClaw の動作と一致する必要がある判断にこのプランを使用できますが、ホスト所有の試行状態として扱ってください。これを変更したり、ターン内でプロバイダー/モデルを切り替えるために使用したりしないでください。

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

OpenClaw は、プロバイダー/モデルの解決後にハーネスを選択します。

1. モデルスコープのランタイムポリシーが優先されます。
2. 次にプロバイダースコープのランタイムポリシーが適用されます。
3. `auto` は、解決済みのプロバイダー/モデルをサポートするかどうかを登録済みハーネスに問い合わせます。
4. 一致する登録済みハーネスがない場合、OpenClaw は組み込みランタイムを使用します。

Plugin ハーネスの失敗は実行失敗として表面化します。`auto` モードでは、解決済みのプロバイダー/モデルをサポートする登録済み Plugin ハーネスがない場合にのみ、組み込みフォールバックが適用されます。Plugin ハーネスがいったん実行を引き受けると、OpenClaw は同じターンを別のランタイムで再実行しません。認証/ランタイムセマンティクスが変わったり、副作用が重複したりする可能性があるためです。

セッション全体およびエージェント全体のランタイム固定は、選択時に無視されます。これには、古いセッションの `agentHarnessId` 値、`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、`OPENCLAW_AGENT_RUNTIME` が含まれます。`/status` は、プロバイダー/モデルルートから選択された有効なランタイムを表示します。

選択されたハーネスが予想外の場合は、`agents/harness` デバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを確認してください。選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、そして `auto` モードでは各 Plugin 候補のサポート結果が含まれます。

バンドル済みの Codex Plugin は、ハーネス ID として `codex` を登録します。コアはそれを通常の Plugin ハーネス ID として扱います。Codex 固有のエイリアスは、共有ランタイムセレクターではなく、Plugin またはオペレーター設定に属します。

## プロバイダーとハーネスの組み合わせ

ほとんどのハーネスはプロバイダーも登録するべきです。プロバイダーは、モデル参照、認証状態、モデルメタデータ、`/model` 選択を OpenClaw の他の部分に見えるようにします。その後、ハーネスは `supports(...)` でそのプロバイダーを引き受けます。

バンドル済みの Codex Plugin はこのパターンに従います。

- 推奨されるユーザーモデル参照: `openai/gpt-5.5`
- 互換性参照: レガシーの `codex/gpt-*` 参照は引き続き受け付けられますが、新しい設定では通常のプロバイダー/モデル参照として使用するべきではありません
- ハーネス ID: `codex`
- 認証: 合成プロバイダー可用性。Codex ハーネスがネイティブ Codex ログイン/セッションを所有するためです
- アプリサーバーリクエスト: OpenClaw は素のモデル ID を Codex に送り、ハーネスにネイティブアプリサーバープロトコルと通信させます

Codex Plugin は追加的です。公式 OpenAI API エンドポイント（`api.openai.com`）上のプレーンな `openai/gpt-*` エージェント参照は、デフォルトで Codex ハーネスを選択します。一方、カスタムの OpenAI 互換ベース URL は、設定済みのプロバイダー動作を維持します。古い `codex/gpt-*` 参照は、互換性のために引き続き Codex プロバイダーとハーネスを選択します。

オペレーターセットアップ、モデルプレフィックスの例、Codex 専用設定については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

OpenClaw は Codex アプリサーバー `0.125.0` 以降を必要とします。Codex Plugin はアプリサーバーの初期化ハンドシェイクを確認し、古いサーバーやバージョン不明のサーバーをブロックします。そのため、OpenClaw はテスト済みのプロトコルサーフェスに対してのみ実行されます。

### ツール結果ミドルウェア

バンドル済み Plugin と、マニフェスト契約が一致する明示的に有効化されたインストール済み Plugin は、マニフェストが `contracts.agentToolResultMiddleware` で対象ランタイム ID を宣言している場合、`api.registerAgentToolResultMiddleware(...)` を通じてランタイム中立のツール結果ミドルウェアをアタッチできます。この信頼済みの継ぎ目は、OpenClaw または Codex がツール出力をモデルに戻す前に実行する必要がある非同期ツール結果変換のためのものです。

レガシーのバンドル済み Plugin は、Codex アプリサーバー専用ミドルウェアのために引き続き `api.registerCodexAppServerExtensionFactory(...)` を使用できますが、新しい結果変換ではランタイム中立 API を使用するべきです。組み込みランナー専用の `api.registerEmbeddedExtensionFactory(...)` フックは削除されました。組み込みツール結果変換はランタイム中立ミドルウェアを使用する必要があります。

### ターミナル結果分類

独自のプロトコル投影を所有するネイティブハーネスは、完了したターンが可視のアシスタントテキストを生成しなかった場合に、`openclaw/plugin-sdk/agent-harness-runtime` の `classifyAgentHarnessTerminalOutcome(...)` を使用できます。このヘルパーは `empty`、`reasoning-only`、`planning-only` を返し、OpenClaw のフォールバックポリシーが別のモデルで再試行するかどうかを判断できるようにします。`planning-only` には、ハーネスの明示的な `planText` フィールドが必要です。OpenClaw はアシスタントの prose からそれを推論しません。このヘルパーは、プロンプトエラー、実行中のターン、`NO_REPLY` のような意図的なサイレント返信を意図的に未分類のままにします。

### エージェント終了時の副作用

ネイティブハーネスは、試行を確定した後に `openclaw/plugin-sdk/agent-harness-runtime` の `runAgentEndSideEffects(...)` を呼び出す必要があります。これは、インタラクティブな返信を遅らせずに、ポータブルな `agent_end` フックと OpenClaw のリサーチキャプチャをディスパッチします。ローカルの非インタラクティブ実行で、これらの副作用が完了するまで試行を解決してはいけない場合は、`awaitAgentEndSideEffects(...)` を使用してください。どちらのヘルパーも `runAgentHarnessAgentEndHook(...)` と同じ `{ event, ctx }` ペイロードを受け付けます。これらの失敗は完了済みの試行結果を変更しません。

### ユーザー入力とツールサーフェス

ランタイムレベルのユーザー入力リクエストを公開するネイティブハーネスは、`openclaw/plugin-sdk/agent-harness-runtime` のユーザー入力ヘルパーを使用して、プロンプトを整形し、OpenClaw のブロッキング返信パスを通じて配信し、選択肢/自由形式の回答をランタイムのネイティブ応答形状に正規化するべきです。このヘルパーは、チャンネル/TUI 表示の一貫性を保ちながら、各ハーネスが独自のプロトコル解析と保留中リクエストのライフサイクルを保持できるようにします。

PI 風のコンパクトなツールルーティングが必要なネイティブハーネスは、`openclaw/plugin-sdk/agent-harness-tool-runtime` の `createAgentHarnessToolSurfaceRuntime(...)` を使用するべきです。これは、ツール検索/コードモードのコントロール選択、ローカルモデル向けの軽量デフォルト、ランタイム互換のスキーマフィルタリング、隠しカタログ実行、ディレクトリハイドレーション、カタログクリーンアップを所有します。ハーネスは引き続き、SDK 固有のツール変換とネイティブ実行コールバックを所有します。

### ネイティブ Codex ハーネスモード

バンドル済みの `codex` ハーネスは、組み込み OpenClaw エージェントターン用のネイティブ Codex モードです。まずバンドル済みの `codex` Plugin を有効にし、設定で制限的な許可リストを使用している場合は `plugins.allow` に `codex` を含めてください。ネイティブアプリサーバー設定では `openai/gpt-*` を使用するべきです。OpenAI エージェントターンはデフォルトで Codex ハーネスを選択します。レガシー Codex モデル参照ルートは `openclaw doctor --fix` で修復するべきであり、レガシーの `codex/*` モデル参照はネイティブハーネスの互換性エイリアスとして残ります。

このモードが実行されると、Codex はネイティブスレッド ID、再開動作、Compaction、アプリサーバー実行を所有します。OpenClaw は引き続き、チャットチャンネル、可視トランスクリプトミラー、ツールポリシー、承認、メディア配信、セッション選択を所有します。Codex アプリサーバーパスだけが実行を引き受けられることを証明する必要がある場合は、プロバイダー/モデルの `agentRuntime.id: "codex"` を使用してください。明示的な Plugin ランタイムはフェイルクローズします。Codex アプリサーバー選択の失敗とランタイム失敗は、別のランタイムで再試行されません。

## ランタイムの厳格性

デフォルトでは、OpenClaw は `auto` プロバイダー/モデルランタイムポリシーを使用します。登録済み Plugin ハーネスはプロバイダー/モデルのペアを引き受けることができ、一致するものがない場合は組み込みランタイムがターンを処理します。公式 OpenAI プロバイダー上の OpenAI エージェント参照は、デフォルトで Codex になります。ハーネス選択が欠落した場合に組み込みランタイムへルーティングするのではなく失敗させたい場合は、`agentRuntime.id: "codex"` のような明示的なプロバイダー/モデル Plugin ランタイムを使用してください。選択された Plugin ハーネスの失敗は常にハードフェイルします。これは、明示的なプロバイダー/モデル `agentRuntime.id: "openclaw"` を妨げません。

Codex 専用の組み込み実行の場合:

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

1 つの正規モデルに CLI バックエンドを使いたい場合は、そのモデルエントリにランタイムを置きます。

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

このようなレガシーのエージェント全体ランタイム例は無視されます。

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

明示的な plugin runtime を使う場合、要求されたハーネスが登録されていない、解決されたプロバイダー/モデルをサポートしていない、またはターンの副作用を生成する前に失敗すると、セッションは早期に失敗します。これは、Codex 専用デプロイメント、および Codex app-server パスが実際に使用されていることを証明する必要があるライブテストでは意図された動作です。

この設定が制御するのは埋め込みエージェントハーネスだけです。画像、動画、音楽、TTS、PDF、その他のプロバイダー固有のモデルルーティングは無効化しません。

## ネイティブセッションとトランスクリプトミラー

ハーネスは、ネイティブセッション ID、スレッド ID、またはデーモン側の再開トークンを保持する場合があります。そのバインディングは OpenClaw セッションに明示的に関連付けたままにし、ユーザーに表示されるアシスタント/ツール出力を OpenClaw トランスクリプトへミラーリングし続けてください。

OpenClaw トランスクリプトは、次の互換性レイヤーとして残ります。

- チャンネルに表示されるセッション履歴
- トランスクリプトの検索とインデックス作成
- 後続のターンで組み込み OpenClaw ハーネスに戻すこと
- 汎用的な `/new`、`/reset`、およびセッション削除の動作

ハーネスがサイドカーバインディングを保存する場合は、所有元の OpenClaw セッションがリセットされたときに OpenClaw がそれをクリアできるよう、`reset(...)` を実装してください。

## ツールとメディアの結果

コアは OpenClaw ツールリストを構築し、それを準備済みの試行へ渡します。ハーネスが動的ツール呼び出しを実行する場合は、自分でチャンネルメディアを送信するのではなく、ハーネス結果の形を通じてツール結果を返してください。

これにより、テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力が、OpenClaw ベースの実行と同じ配信パスに保たれます。

## 現在の制限

- 公開 import パスは汎用的ですが、一部の試行/結果型エイリアスには、互換性のためにまだレガシー名が残っています。
- サードパーティ製ハーネスのインストールは実験的です。ネイティブセッション runtime が必要になるまでは、プロバイダー Plugin を優先してください。
- ハーネスの切り替えはターン間でサポートされています。ネイティブツール、承認、アシスタントテキスト、またはメッセージ送信が開始された後、ターンの途中でハーネスを切り替えないでください。

## 関連

- [SDK 概要](/ja-JP/plugins/sdk-overview)
- [Runtime ヘルパー](/ja-JP/plugins/sdk-runtime)
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
