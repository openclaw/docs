---
read_when:
    - 埋め込みエージェントランタイムまたはハーネスレジストリを変更する場合
    - バンドル済みまたは信頼済みのPluginからエージェントハーネスを登録しています
    - Codex Plugin とモデルプロバイダーの関係を理解する必要があります
sidebarTitle: Agent Harness
summary: 低レベルの組み込みエージェント実行器を置き換えるPlugin向けの実験的なSDKサーフェス
title: エージェントハーネスのPlugin
x-i18n:
    generated_at: "2026-05-02T05:02:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**エージェントハーネス**は、準備済みの OpenClaw エージェントの1ターンを実行する低レベルの実行器です。モデルプロバイダーでも、チャンネルでも、ツールレジストリでもありません。ユーザー向けのメンタルモデルについては、[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。

このサーフェスは、同梱または信頼済みのネイティブ Plugin にのみ使用してください。パラメーター型は意図的に現在の組み込みランナーを反映しているため、この契約はまだ実験的です。

## ハーネスを使用する場合

モデルファミリーが独自のネイティブセッションランタイムを持ち、通常の OpenClaw プロバイダートランスポートが適切な抽象化ではない場合に、エージェントハーネスを登録します。

例:

- スレッドと Compaction を所有するネイティブコーディングエージェントサーバー
- ネイティブの計画/推論/ツールイベントをストリームする必要があるローカル CLI またはデーモン
- OpenClaw セッショントランスクリプトに加えて独自の再開 ID を必要とするモデルランタイム

新しい LLM API を追加するだけの目的でハーネスを登録しないでください。通常の HTTP または WebSocket モデル API では、[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)を作成してください。

## コアが引き続き所有するもの

ハーネスが選択される前に、OpenClaw はすでに以下を解決しています。

- プロバイダーとモデル
- ランタイム認証状態
- 思考レベルとコンテキスト予算
- OpenClaw トランスクリプト/セッションファイル
- ワークスペース、サンドボックス、ツールポリシー
- チャンネル返信コールバックとストリーミングコールバック
- モデルフォールバックとライブモデル切り替えポリシー

この分割は意図的なものです。ハーネスは準備済みの試行を実行します。プロバイダーを選択したり、チャンネル配信を置き換えたり、暗黙にモデルを切り替えたりはしません。

準備済みの試行には `params.runtimePlan` も含まれます。これは、PI とネイティブハーネスの間で共有され続ける必要があるランタイム判断のための、OpenClaw 所有のポリシーバンドルです。

- プロバイダーを考慮したツールスキーマポリシー用の `runtimePlan.tools.normalize(...)` と
  `runtimePlan.tools.logDiagnostics(...)`
- トランスクリプトのサニタイズとツール呼び出し修復ポリシー用の `runtimePlan.transcript.resolvePolicy(...)`
- 共有 `NO_REPLY` とメディア配信抑制用の `runtimePlan.delivery.isSilentPayload(...)`
- モデルフォールバック分類用の `runtimePlan.outcome.classifyRunResult(...)`
- 解決済みのプロバイダー/モデル/ハーネスメタデータ用の `runtimePlan.observability`

ハーネスは、PI の挙動と一致させる必要がある判断にこのプランを使用できますが、それでもホスト所有の試行状態として扱うべきです。これを変更したり、ターン内でプロバイダー/モデルを切り替えるために使用したりしないでください。

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

1. 既存セッションに記録されたハーネス ID が優先されるため、config/env の変更でそのトランスクリプトが別のランタイムへホットスイッチされることはありません。
2. `OPENCLAW_AGENT_RUNTIME=<id>` は、まだ固定されていないセッションに対して、その ID を持つ登録済みハーネスを強制します。
3. `OPENCLAW_AGENT_RUNTIME=pi` は、組み込み PI ハーネスを強制します。
4. `OPENCLAW_AGENT_RUNTIME=auto` は、解決済みのプロバイダー/モデルをサポートするかどうかを登録済みハーネスに問い合わせます。
5. 一致する登録済みハーネスがない場合、PI フォールバックが無効でない限り、OpenClaw は PI を使用します。

Plugin ハーネスの失敗は実行失敗として表面化します。`auto` モードでは、解決済みのプロバイダー/モデルをサポートする登録済み Plugin ハーネスがない場合にのみ PI フォールバックが使用されます。Plugin ハーネスが実行を要求した後、OpenClaw は同じターンを PI 経由で再実行しません。これは認証/ランタイムの意味を変えたり、副作用を重複させたりする可能性があるためです。

選択されたハーネス ID は、組み込み実行後にセッション ID とともに永続化されます。ハーネス固定が導入される前に作成されたレガシーセッションは、トランスクリプト履歴を持つと PI 固定として扱われます。PI とネイティブ Plugin ハーネスを切り替える場合は、新規/リセットされたセッションを使用してください。`/status` は、`codex` のような非デフォルトのハーネス ID を `Fast` の横に表示します。PI はデフォルト互換パスであるため非表示のままです。選択されたハーネスが予想外の場合は、`agents/harness` デバッグログを有効にして、Gateway の構造化された `agent harness selected` レコードを確認してください。これには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、および `auto` モードでは各 Plugin 候補のサポート結果が含まれます。

同梱の Codex Plugin は、`codex` をハーネス ID として登録します。コアはこれを通常の Plugin ハーネス ID として扱います。Codex 固有のエイリアスは共有ランタイムセレクターではなく、Plugin またはオペレーター config に属します。

## プロバイダーとハーネスの組み合わせ

ほとんどのハーネスはプロバイダーも登録するべきです。プロバイダーは、モデル参照、認証ステータス、モデルメタデータ、`/model` 選択を OpenClaw の他の部分から見えるようにします。その後、ハーネスは `supports(...)` でそのプロバイダーを要求します。

同梱の Codex Plugin はこのパターンに従います。

- 推奨ユーザーモデル参照: `openai/gpt-5.5` と
  `agentRuntime.id: "codex"`
- 互換性参照: レガシーの `codex/gpt-*` 参照は引き続き受け入れられますが、新しい config では通常のプロバイダー/モデル参照として使用しないでください
- ハーネス ID: `codex`
- 認証: 合成プロバイダー可用性。Codex ハーネスがネイティブ Codex ログイン/セッションを所有するためです
- アプリサーバーリクエスト: OpenClaw は素のモデル ID を Codex に送信し、ハーネスがネイティブアプリサーバープロトコルと通信します

Codex Plugin は追加的です。`agentRuntime.id: "codex"` で Codex ハーネスを強制しない限り、通常の `openai/gpt-*` 参照は引き続き通常の OpenClaw プロバイダーパスを使用します。古い `codex/gpt-*` 参照は、互換性のため引き続き Codex プロバイダーとハーネスを選択します。

オペレーター設定、モデルプレフィックス例、Codex 専用 config については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

OpenClaw は Codex アプリサーバー `0.125.0` 以降を必要とします。Codex Plugin はアプリサーバーの initialize ハンドシェイクを確認し、古いサーバーまたはバージョン不明のサーバーをブロックするため、OpenClaw はテスト済みのプロトコルサーフェスに対してのみ実行されます。`0.125.0` の下限には、Codex `0.124.0` で導入されたネイティブ MCP フックペイロードサポートが含まれており、同時に OpenClaw を新しいテスト済み安定ラインに固定します。

### ツール結果ミドルウェア

同梱 Plugin は、manifest が `contracts.agentToolResultMiddleware` で対象ランタイム ID を宣言している場合、`api.registerAgentToolResultMiddleware(...)` を通じてランタイム中立のツール結果ミドルウェアをアタッチできます。この信頼済みの接合点は、PI または Codex がツール出力をモデルへ戻す前に実行する必要がある非同期ツール結果変換のためのものです。

レガシーの同梱 Plugin は、Codex アプリサーバー専用ミドルウェアに引き続き `api.registerCodexAppServerExtensionFactory(...)` を使用できますが、新しい結果変換ではランタイム中立 API を使用するべきです。Pi 専用の `api.registerEmbeddedExtensionFactory(...)` フックは削除されました。Pi のツール結果変換はランタイム中立ミドルウェアを使用する必要があります。

### 終端結果の分類

独自のプロトコル投影を所有するネイティブハーネスは、完了したターンで可視のアシスタントテキストが生成されなかった場合に、`openclaw/plugin-sdk/agent-harness-runtime` の `classifyAgentHarnessTerminalOutcome(...)` を使用できます。このヘルパーは `empty`、`reasoning-only`、または `planning-only` を返し、OpenClaw のフォールバックポリシーが別のモデルで再試行するかどうかを判断できるようにします。プロンプトエラー、進行中のターン、`NO_REPLY` のような意図的なサイレント返信は、意図的に分類されません。

### ネイティブ Codex ハーネスモード

同梱の `codex` ハーネスは、組み込み OpenClaw エージェントターンのためのネイティブ Codex モードです。まず同梱の `codex` Plugin を有効にし、config が制限的な allowlist を使用している場合は `plugins.allow` に `codex` を含めてください。ネイティブアプリサーバー config では、`agentRuntime.id: "codex"` とともに `openai/gpt-*` を使用するべきです。PI 経由の Codex OAuth には `openai-codex/*` を使用してください。レガシーの `codex/*` モデル参照は、ネイティブハーネスの互換性エイリアスとして残ります。

このモードが実行されると、Codex がネイティブスレッド ID、再開挙動、Compaction、アプリサーバー実行を所有します。OpenClaw は引き続きチャットチャンネル、可視トランスクリプトミラー、ツールポリシー、承認、メディア配信、セッション選択を所有します。Codex アプリサーバーパスだけが実行を要求できることを証明する必要がある場合は、`fallback` の上書きなしで `agentRuntime.id: "codex"` を使用してください。明示的な Plugin ランタイムは、すでにデフォルトで失敗クローズです。ハーネス選択が欠落した場合に PI に処理させたい意図がある場合にのみ、`fallback: "pi"` を設定してください。Codex アプリサーバーの失敗は、PI 経由で再試行されるのではなく、すでに直接失敗します。

## PI フォールバックを無効化する

デフォルトでは、OpenClaw は `agents.defaults.agentRuntime` を `{ id: "auto", fallback: "pi" }` に設定して組み込みエージェントを実行します。`auto` モードでは、登録済み Plugin ハーネスがプロバイダー/モデルの組み合わせを要求できます。一致するものがない場合、OpenClaw は PI にフォールバックします。

`auto` モードでは、Plugin ハーネスの選択が欠落した場合に PI を使用せず失敗させる必要があるとき、`fallback: "none"` を設定します。`agentRuntime.id: "codex"` のような明示的な Plugin ランタイムは、同じ config または環境上書きスコープで `fallback: "pi"` が設定されていない限り、すでにデフォルトで失敗クローズです。選択された Plugin ハーネスの失敗は常にハードに失敗します。これは明示的な `agentRuntime.id: "pi"` や `OPENCLAW_AGENT_RUNTIME=pi` をブロックしません。

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

登録済み Plugin ハーネスが一致するモデルを要求できるようにしつつ、OpenClaw が暗黙に PI へフォールバックすることは避けたい場合は、`runtime: "auto"` を維持してフォールバックを無効化します。

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

エージェントごとの上書きは同じ形を使用します。

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

`OPENCLAW_AGENT_RUNTIME` は引き続き設定済みランタイムを上書きします。環境から PI フォールバックを無効化するには `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を使用します。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

フォールバックが無効な場合、要求されたハーネスが登録されていない、解決済みのプロバイダー/モデルをサポートしていない、またはターンの副作用を生成する前に失敗した場合、セッションは早期に失敗します。これは Codex 専用デプロイメントや、Codex アプリサーバーパスが実際に使用されていることを証明する必要があるライブテストでは意図的な挙動です。

この設定は組み込みエージェントハーネスのみを制御します。画像、動画、音楽、TTS、PDF、その他のプロバイダー固有モデルルーティングは無効化しません。

## ネイティブセッションとトランスクリプトミラー

ハーネスは、ネイティブセッション ID、スレッド ID、またはデーモン側の再開トークンを保持できます。そのバインディングを OpenClaw セッションに明示的に関連付け、ユーザーに見えるアシスタント/ツール出力を OpenClaw トランスクリプトへミラーし続けてください。

OpenClaw トランスクリプトは、以下の互換レイヤーであり続けます。

- チャンネルから見えるセッション履歴
- トランスクリプト検索とインデックス作成
- 後続ターンで組み込み PI ハーネスへ戻す切り替え
- 汎用の `/new`、`/reset`、およびセッション削除の挙動

ハーネスがサイドカーバインディングを保存する場合は、所有する OpenClaw セッションがリセットされたときに OpenClaw がそれをクリアできるよう、`reset(...)` を実装してください。

## ツールとメディアの結果

コアは OpenClaw ツールリストを構築し、準備済みの試行に渡します。
ハーネスが動的ツール呼び出しを実行する場合は、自分でチャンネルメディアを送信するのではなく、
ハーネス結果の形を通じてツール結果を返してください。

これにより、テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力が、
Pi ベースの実行と同じ配信パスに保たれます。

## 現在の制限事項

- 公開インポートパスは汎用的ですが、一部の試行/結果型エイリアスには互換性のために
  まだ `Pi` 名が含まれています。
- サードパーティ製ハーネスのインストールは実験的です。ネイティブセッションランタイムが必要になるまでは、プロバイダー Plugin を優先してください。
- ハーネスの切り替えはターン間でサポートされています。ネイティブツール、承認、アシスタントのテキスト、またはメッセージ送信が開始された後、ターンの途中でハーネスを切り替えないでください。

## 関連

- [SDK 概要](/ja-JP/plugins/sdk-overview)
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
