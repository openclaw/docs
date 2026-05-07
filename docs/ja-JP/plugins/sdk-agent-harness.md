---
read_when:
    - 埋め込みエージェントランタイムまたはハーネスレジストリを変更しています
    - バンドル済みまたは信頼済みのPluginからエージェントハーネスを登録しています
    - Codex Plugin とモデルプロバイダーの関係を理解する必要があります
sidebarTitle: Agent Harness
summary: 低レベルの組み込みエージェント実行器を置き換えるPlugin向けの実験的なSDKサーフェス
title: エージェントハーネスのPlugin
x-i18n:
    generated_at: "2026-05-07T13:23:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**エージェントハーネス**は、準備済みの OpenClaw エージェント 1 ターンを実行する低レベルの実行器です。モデルプロバイダーでも、チャンネルでも、ツールレジストリでもありません。
ユーザー向けの考え方については、[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。

このサーフェスは、バンドル済みまたは信頼済みのネイティブ Plugin にのみ使用してください。この契約は、パラメーター型が現在の埋め込みランナーを意図的に反映しているため、まだ実験的です。

## ハーネスを使う場合

モデルファミリーが独自のネイティブセッションランタイムを持ち、通常の OpenClaw プロバイダートランスポートが適切な抽象化ではない場合に、エージェントハーネスを登録します。

例:

- スレッドと Compaction を所有するネイティブのコーディングエージェントサーバー
- ネイティブの計画、推論、ツールイベントをストリーミングする必要があるローカル CLI またはデーモン
- OpenClaw セッショントランスクリプトに加えて独自の再開 ID を必要とするモデルランタイム

新しい LLM API を追加するためだけにハーネスを登録しないでください。通常の HTTP または WebSocket モデル API では、[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)を構築してください。

## Core が引き続き所有するもの

ハーネスが選択される前に、OpenClaw はすでに次を解決しています。

- プロバイダーとモデル
- ランタイム認証状態
- 思考レベルとコンテキスト予算
- OpenClaw トランスクリプト/セッションファイル
- ワークスペース、サンドボックス、ツールポリシー
- チャンネル返信コールバックとストリーミングコールバック
- モデルフォールバックとライブモデル切り替えポリシー

この分担は意図的です。ハーネスは準備済みの試行を実行します。プロバイダーの選択、チャンネル配信の置き換え、モデルのサイレントな切り替えは行いません。

準備済みの試行には `params.runtimePlan` も含まれます。これは、PI とネイティブハーネス間で共有されたままである必要があるランタイム判断のための、OpenClaw 所有のポリシーバンドルです。

- プロバイダーを考慮したツールスキーマポリシー向けの `runtimePlan.tools.normalize(...)` と
  `runtimePlan.tools.logDiagnostics(...)`
- トランスクリプトのサニタイズとツール呼び出し修復ポリシー向けの `runtimePlan.transcript.resolvePolicy(...)`
- 共有の `NO_REPLY` とメディア配信抑制向けの `runtimePlan.delivery.isSilentPayload(...)`
- モデルフォールバック分類向けの `runtimePlan.outcome.classifyRunResult(...)`
- 解決済みのプロバイダー/モデル/ハーネスメタデータ向けの `runtimePlan.observability`

ハーネスは、PI の動作と一致させる必要がある判断にこのプランを使用できますが、それでもホスト所有の試行状態として扱う必要があります。ターン内でこれを変更したり、プロバイダー/モデルを切り替えるために使ったりしないでください。

## ハーネスを登録する

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

## 選択ポリシー

OpenClaw は、プロバイダー/モデル解決後にハーネスを選択します。

1. 既存セッションに記録されたハーネス ID が優先されるため、config/env の変更によってそのトランスクリプトが別のランタイムにホットスイッチされることはありません。
2. `OPENCLAW_AGENT_RUNTIME=<id>` は、まだピン留めされていないセッションについて、その ID を持つ登録済みハーネスを強制します。
3. `OPENCLAW_AGENT_RUNTIME=pi` は、組み込み PI ハーネスを強制します。
4. `OPENCLAW_AGENT_RUNTIME=auto` は、解決済みのプロバイダー/モデルをサポートするかを登録済みハーネスに問い合わせます。
5. 一致する登録済みハーネスがない場合、PI フォールバックが無効でない限り OpenClaw は PI を使用します。

Plugin ハーネスの失敗は実行失敗として表面化します。`auto` モードでは、PI フォールバックは、解決済みのプロバイダー/モデルをサポートする登録済み Plugin ハーネスがない場合にのみ使用されます。Plugin ハーネスが実行を要求した後、OpenClaw は同じターンを PI で再実行しません。そうすると認証/ランタイムのセマンティクスが変わったり、副作用が重複したりする可能性があるためです。

選択されたハーネス ID は、埋め込み実行後にセッション ID とともに永続化されます。ハーネスのピン留めより前に作成されたレガシーセッションは、トランスクリプト履歴がある場合、PI にピン留めされたものとして扱われます。PI とネイティブ Plugin ハーネスを切り替える場合は、新規またはリセット済みのセッションを使用してください。`/status` は `codex` などの非デフォルトのハーネス ID を `Fast` の横に表示します。PI はデフォルトの互換パスであるため非表示のままです。
選択されたハーネスが意外な場合は、`agents/harness` デバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを確認してください。これには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、そして `auto` モードでは各 Plugin 候補のサポート結果が含まれます。

バンドル済みの Codex Plugin は、ハーネス ID として `codex` を登録します。Core はそれを通常の Plugin ハーネス ID として扱います。Codex 固有のエイリアスは、共有ランタイムセレクターではなく、Plugin またはオペレーター設定に属します。

## プロバイダーとハーネスのペアリング

ほとんどのハーネスは、プロバイダーも登録するべきです。プロバイダーは、モデル参照、認証状態、モデルメタデータ、`/model` 選択を OpenClaw の他の部分から見えるようにします。その後、ハーネスは `supports(...)` でそのプロバイダーを要求します。

バンドル済みの Codex Plugin はこのパターンに従います。

- 推奨されるユーザーモデル参照: `openai/gpt-5.5` と
  `agentRuntime.id: "codex"`
- 互換性参照: レガシーの `codex/gpt-*` 参照は引き続き受け入れられますが、新しい設定では通常のプロバイダー/モデル参照として使用しないでください
- ハーネス ID: `codex`
- 認証: Codex ハーネスがネイティブ Codex ログイン/セッションを所有するため、合成プロバイダー可用性
- アプリサーバーリクエスト: OpenClaw は素のモデル ID を Codex に送信し、ハーネスにネイティブアプリサーバープロトコルと通信させます

Codex Plugin は追加的です。`agentRuntime.id: "codex"` で Codex ハーネスを強制しない限り、通常の `openai/gpt-*` 参照は通常の OpenClaw プロバイダーパスを使い続けます。古い `codex/gpt-*` 参照は、互換性のために引き続き Codex プロバイダーとハーネスを選択します。

オペレーターセットアップ、モデルプレフィックスの例、Codex 専用設定については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

OpenClaw には Codex app-server `0.125.0` 以降が必要です。Codex Plugin は app-server の初期化ハンドシェイクを確認し、古いサーバーやバージョン未指定のサーバーをブロックするため、OpenClaw はテスト済みのプロトコルサーフェスに対してのみ実行されます。`0.125.0` の下限には Codex `0.124.0` で導入されたネイティブ MCP フックペイロードサポートが含まれており、そのうえで OpenClaw をより新しいテスト済みの安定系列に固定します。

### ツール結果ミドルウェア

バンドル済み Plugin は、マニフェストが `contracts.agentToolResultMiddleware` で対象ランタイム ID を宣言している場合、`api.registerAgentToolResultMiddleware(...)` を通じてランタイム中立のツール結果ミドルウェアをアタッチできます。この信頼済みシームは、PI または Codex がツール出力をモデルへ戻す前に実行する必要がある非同期ツール結果変換のためのものです。

レガシーのバンドル済み Plugin は、Codex app-server 専用ミドルウェアに引き続き `api.registerCodexAppServerExtensionFactory(...)` を使用できますが、新しい結果変換にはランタイム中立 API を使用するべきです。
Pi 専用の `api.registerEmbeddedExtensionFactory(...)` フックは削除されました。Pi のツール結果変換はランタイム中立ミドルウェアを使用する必要があります。

### 終端結果の分類

独自のプロトコル投影を所有するネイティブハーネスは、完了したターンが可視のアシスタントテキストを生成しなかった場合に、`openclaw/plugin-sdk/agent-harness-runtime` の `classifyAgentHarnessTerminalOutcome(...)` を使用できます。このヘルパーは `empty`、`reasoning-only`、または `planning-only` を返すため、OpenClaw のフォールバックポリシーは別モデルで再試行するかどうかを判断できます。これは、プロンプトエラー、進行中のターン、`NO_REPLY` などの意図的なサイレント返信を分類しないように意図されています。

### ネイティブ Codex ハーネスモード

バンドル済みの `codex` ハーネスは、埋め込み OpenClaw エージェントターン向けのネイティブ Codex モードです。まずバンドル済みの `codex` Plugin を有効にし、設定で制限付きの許可リストを使用している場合は `plugins.allow` に `codex` を含めてください。ネイティブ app-server 設定では `openai/gpt-*` を使用するべきです。OpenAI エージェントターンは、デフォルトで Codex ハーネスを選択します。レガシーの `openai-codex/*` ルートは `openclaw doctor --fix` で修復するべきであり、レガシーの `codex/*` モデル参照はネイティブハーネスの互換エイリアスとして残ります。

このモードで実行されると、Codex はネイティブスレッド ID、再開動作、Compaction、app-server 実行を所有します。OpenClaw は引き続き、チャットチャンネル、可視トランスクリプトミラー、ツールポリシー、承認、メディア配信、セッション選択を所有します。Codex app-server パスだけが実行を要求できることを証明する必要がある場合は、`agentRuntime.id: "codex"` を使用してください。明示的な Plugin ランタイムはクローズドに失敗します。Codex app-server の選択失敗とランタイム失敗は PI 経由で再試行されません。

## ランタイムの厳格性

デフォルトでは、OpenClaw は OpenClaw Pi で埋め込みエージェントを実行します。`auto` モードでは、登録済み Plugin ハーネスがプロバイダー/モデルのペアを要求でき、一致するものがない場合は PI がターンを処理します。ハーネス選択の欠落時に PI へルーティングするのではなく失敗させるべき場合は、`agentRuntime.id: "codex"` などの明示的な Plugin ランタイムを使用してください。選択された Plugin ハーネスの失敗は常にハードに失敗します。これは明示的な `agentRuntime.id: "pi"` または `OPENCLAW_AGENT_RUNTIME=pi` を妨げません。

Codex 専用の埋め込み実行の場合:

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

一致するモデルを登録済み Plugin ハーネスのいずれかに要求させ、それ以外では PI を使用したい場合は、`id: "auto"` を設定します。

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

エージェントごとの上書きも同じ形を使用します。

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` は、設定済みランタイムを引き続き上書きします。

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

明示的な Plugin ランタイムでは、要求されたハーネスが登録されていない場合、解決済みのプロバイダー/モデルをサポートしていない場合、またはターンの副作用を生成する前に失敗した場合、セッションは早期に失敗します。これは、Codex 専用デプロイメント、および Codex app-server パスが実際に使われていることを証明する必要があるライブテストにとって意図的です。

この設定が制御するのは埋め込みエージェントハーネスだけです。画像、動画、音楽、TTS、PDF、その他のプロバイダー固有モデルルーティングは無効にしません。

## ネイティブセッションとトランスクリプトミラー

ハーネスは、ネイティブセッション ID、スレッド ID、またはデーモン側の再開トークンを保持できます。その紐付けを OpenClaw セッションに明示的に関連付けたままにし、ユーザーに見えるアシスタント/ツール出力を OpenClaw トランスクリプトへミラーし続けてください。

OpenClaw トランスクリプトは、次のための互換レイヤーであり続けます。

- チャンネルに表示されるセッション履歴
- トランスクリプト検索とインデックス化
- 後のターンで組み込み PI ハーネスへ戻すこと
- 汎用的な `/new`、`/reset`、セッション削除の動作

ハーネスがサイドカー紐付けを保存する場合は、所有元の OpenClaw セッションがリセットされたときに OpenClaw がそれを消去できるよう、`reset(...)` を実装してください。

## ツールとメディアの結果

Core は OpenClaw ツールリストを構築し、準備済みの試行に渡します。ハーネスが動的ツール呼び出しを実行する場合は、チャンネルメディアを自分で送信するのではなく、ハーネス結果の形を通じてツール結果を返してください。

これにより、テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力が、PI ベースの実行と同じ配信パスに保たれます。

## 現在の制限

- 公開インポートパスは汎用的ですが、一部の試行/結果の型エイリアスは互換性のために引き続き `Pi` 名を持っています。
- サードパーティ製ハーネスのインストールは実験的です。ネイティブセッションランタイムが必要になるまでは、プロバイダー Plugin を優先してください。
- ハーネスの切り替えはターン間でサポートされています。ネイティブツール、承認、アシスタントのテキスト、またはメッセージ送信が開始された後、ターンの途中でハーネスを切り替えないでください。

## 関連

- [SDK 概要](/ja-JP/plugins/sdk-overview)
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
