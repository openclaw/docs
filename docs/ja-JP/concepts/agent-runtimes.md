---
read_when:
    - PI、Codex、ACP、または別のネイティブエージェントランタイムのいずれかを選ぼうとしている
    - status または config のプロバイダー/モデル/ランタイムのラベルで混乱している
    - ネイティブハーネスのサポート同等性を文書化しています
summary: OpenClaw がモデルプロバイダー、モデル、チャネル、エージェントランタイムを分離する方法
title: エージェントのランタイム
x-i18n:
    generated_at: "2026-05-02T04:53:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**エージェントランタイム**は、準備済みのモデルループを 1 つ所有するコンポーネントです。プロンプトを受け取り、モデル出力を駆動し、ネイティブツール呼び出しを処理し、完了したターンを OpenClaw に返します。

ランタイムはプロバイダーと混同しやすいです。どちらもモデル設定の近くに現れるためです。これらは異なるレイヤーです。

| レイヤー         | 例                                    | 意味                                                                 |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| プロバイダー      | `openai`, `anthropic`, `openai-codex` | OpenClaw が認証し、モデルを検出し、モデル参照に名前を付ける方法。 |
| モデル         | `gpt-5.5`, `claude-opus-4-6`          | エージェントターンに選択されたモデル。                              |
| エージェントランタイム | `pi`, `codex`, `claude-cli`           | 準備済みターンを実行する低レベルのループまたはバックエンド。      |
| チャネル       | Telegram, Discord, Slack, WhatsApp    | メッセージが OpenClaw に出入りする場所。                            |

コード内では **harness** という語も見かけます。ハーネスはエージェントランタイムを提供する実装です。たとえば、バンドルされた Codex ハーネスは `codex` ランタイムを実装します。公開設定では `agentRuntime.id` を使用します。`openclaw doctor --fix` は古いランタイムポリシーキーをその形に書き換えます。

ランタイムには 2 つのファミリーがあります。

- **埋め込みハーネス**は OpenClaw の準備済みエージェントループ内で実行されます。現在は組み込みの `pi` ランタイムに加えて、`codex` などの登録済み Plugin ハーネスがあります。
- **CLI バックエンド**は、モデル参照を正規のまま保ちながらローカル CLI プロセスを実行します。たとえば、`agentRuntime.id: "claude-cli"` を伴う `anthropic/claude-opus-4-7` は、「Anthropic モデルを選択し、Claude CLI 経由で実行する」という意味です。`claude-cli` は埋め込みハーネス ID ではなく、AgentHarness の選択に渡してはいけません。

## Codex のサーフェス

混乱の多くは、複数の異なるサーフェスが Codex という名前を共有していることに起因します。

| サーフェス                                             | OpenClaw 名/設定                            | 動作                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| ネイティブ Codex app-server ランタイム                | `openai/*` と `agentRuntime.id: "codex"` | 埋め込みエージェントターンを Codex app-server 経由で実行します。これは通常の ChatGPT/Codex サブスクリプション設定です。 |
| Codex OAuth プロバイダールート                         | `openai-codex/*` モデル参照                | 通常の OpenClaw PI ランナー経由で ChatGPT/Codex サブスクリプション OAuth を使用します。                               |
| Codex ACP アダプター                                    | `runtime: "acp"`, `agentId: "codex"`       | 外部 ACP/acpx コントロールプレーン経由で Codex を実行します。ACP/acpx が明示的に要求された場合のみ使用してください。        |
| ネイティブ Codex チャット制御コマンドセット                | `/codex ...`                               | チャットから Codex app-server スレッドをバインド、再開、誘導、停止、検査します。                            |
| GPT/Codex スタイルモデル向け OpenAI Platform API ルート | `openai/*` モデル参照                      | `agentRuntime.id: "codex"` などのランタイムオーバーライドがターンを実行しない限り、OpenAI API キー認証を使用します。     |

これらのサーフェスは意図的に独立しています。`codex` Plugin を有効にするとネイティブ app-server 機能が利用可能になりますが、`openai-codex/*` を `openai/*` に書き換えたり、既存セッションを変更したり、ACP を Codex のデフォルトにしたりはしません。`openai-codex/*` を選択することは、別途ランタイムを強制しない限り、「Codex OAuth プロバイダールートを使用する」という意味です。

一般的な ChatGPT/Codex サブスクリプション設定では、認証に Codex OAuth を使用しますが、モデル参照は `openai/*` のままにして `codex` ランタイムを選択します。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

これは、OpenClaw が OpenAI モデル参照を選択し、その後 Codex app-server ランタイムに埋め込みエージェントターンの実行を依頼するという意味です。「API 課金を使用する」という意味ではなく、チャネル、モデルプロバイダーカタログ、OpenClaw セッションストアが Codex になるという意味でもありません。

バンドルされた `codex` Plugin が有効な場合、自然言語での Codex 制御には ACP ではなく、ネイティブの `/codex` コマンドサーフェス（`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`）を使用してください。Codex に ACP を使用するのは、ユーザーが ACP/acpx を明示的に要求した場合、または ACP アダプターパスをテストしている場合のみです。Claude Code、Gemini CLI、OpenCode、Cursor、および同様の外部ハーネスは引き続き ACP を使用します。

これはエージェント向けの判断ツリーです。

1. ユーザーが **Codex bind/control/thread/resume/steer/stop** を求めている場合は、バンドルされた `codex` Plugin が有効ならネイティブの `/codex` コマンドサーフェスを使用します。
2. ユーザーが **埋め込みランタイムとしての Codex** を求めている場合、または通常のサブスクリプションに支えられた Codex エージェント体験を望んでいる場合は、`openai/<model>` と `agentRuntime.id: "codex"` を使用します。
3. ユーザーが **通常の OpenClaw ランナー上での Codex OAuth/サブスクリプション認証** を求めている場合は、`openai-codex/<model>` を使用し、ランタイムは PI のままにします。
4. ユーザーが **ACP**、**acpx**、または **Codex ACP adapter** と明示的に言った場合は、`runtime: "acp"` と `agentId: "codex"` で ACP を使用します。
5. リクエストが **Claude Code、Gemini CLI、OpenCode、Cursor、Droid、または別の外部ハーネス** に関するものの場合は、ネイティブのサブエージェントランタイムではなく ACP/acpx を使用します。

| 意味するもの...                         | 使用するもの...                                |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server のチャット/スレッド制御    | バンドルされた `codex` Plugin の `/codex ...` |
| Codex app-server の埋め込みエージェントランタイム | `agentRuntime.id: "codex"`                   |
| PI ランナー上の OpenAI Codex OAuth       | `openai-codex/*` モデル参照                  |
| Claude Code またはその他の外部ハーネス   | ACP/acpx                                     |

OpenAI ファミリーのプレフィックス分割については、[OpenAI](/ja-JP/providers/openai) と [モデルプロバイダー](/ja-JP/concepts/model-providers) を参照してください。Codex ランタイムサポート契約については、[Codex ハーネス](/ja-JP/plugins/codex-harness#v1-support-contract) を参照してください。

## ランタイムの所有権

ランタイムによって、ループを所有する範囲は異なります。

| サーフェス                  | OpenClaw PI 埋め込み                    | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| モデルループの所有者            | PI 埋め込みランナー経由の OpenClaw       | Codex app-server                                                            |
| 正規スレッド状態              | OpenClaw トランスクリプト               | Codex スレッドに加えて OpenClaw トランスクリプトのミラー                               |
| OpenClaw 動的ツール           | ネイティブ OpenClaw ツールループ         | Codex アダプター経由でブリッジ                                               |
| ネイティブシェルとファイルツール | PI/OpenClaw パス                        | Codex ネイティブツール。サポートされている場合はネイティブフック経由でブリッジ            |
| コンテキストエンジン           | ネイティブ OpenClaw コンテキスト組み立て   | OpenClaw プロジェクトが Codex ターンにコンテキストを組み立てます                     |
| Compaction                  | OpenClaw または選択されたコンテキストエンジン | Codex ネイティブの Compaction。OpenClaw 通知とミラー保守を伴います |
| チャネル配信                 | OpenClaw                                | OpenClaw                                                                    |

この所有権の分割が主な設計ルールです。

- OpenClaw がサーフェスを所有している場合、OpenClaw は通常の Plugin フック動作を提供できます。
- ネイティブランタイムがサーフェスを所有している場合、OpenClaw にはランタイムイベントまたはネイティブフックが必要です。
- ネイティブランタイムが正規スレッド状態を所有している場合、OpenClaw はサポートされていない内部を書き換えるのではなく、ミラーし、コンテキストを投影するべきです。

## ランタイム選択

OpenClaw は、プロバイダーとモデルの解決後に埋め込みランタイムを選択します。

1. セッションに記録されたランタイムが優先されます。設定変更によって、既存のトランスクリプトが別のネイティブスレッドシステムにホットスイッチされることはありません。
2. `OPENCLAW_AGENT_RUNTIME=<id>` は、新規またはリセットされたセッションにそのランタイムを強制します。
3. `agents.defaults.agentRuntime.id` または `agents.list[].agentRuntime.id` では、`auto`、`pi`、`codex` などの登録済み埋め込みハーネス ID、または `claude-cli` などのサポート対象 CLI バックエンドエイリアスを設定できます。
4. `auto` モードでは、登録済み Plugin ランタイムがサポート対象のプロバイダー/モデルの組み合わせを要求できます。
5. `auto` モードでどのランタイムもターンを要求せず、`fallback: "pi"` が設定されている場合（デフォルト）、OpenClaw は互換性フォールバックとして PI を使用します。代わりに、一致しない `auto` モード選択を失敗させるには `fallback: "none"` を設定します。

明示的な Plugin ランタイムはデフォルトでクローズドに失敗します。たとえば、同じオーバーライドスコープで `fallback: "pi"` を設定しない限り、`agentRuntime.id: "codex"` は Codex または明確な選択エラーを意味します。ランタイムオーバーライドはより広いフォールバック設定を継承しないため、デフォルトで `fallback: "pi"` が使われていたとしても、エージェントレベルの `agentRuntime.id: "codex"` が黙って PI に戻されることはありません。

CLI バックエンドエイリアスは、埋め込みハーネス ID とは異なります。推奨される Claude CLI の形式は次のとおりです。

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

`claude-cli/claude-opus-4-7` などのレガシー参照は互換性のため引き続きサポートされますが、新しい設定ではプロバイダー/モデルを正規のままにし、実行バックエンドを `agentRuntime.id` に置くべきです。

`auto` モードは意図的に保守的です。Plugin ランタイムは理解しているプロバイダー/モデルの組み合わせを要求できますが、Codex Plugin は `auto` モードで `openai-codex` プロバイダーを要求しません。これにより、`openai-codex/*` は明示的な PI Codex OAuth ルートとして維持され、サブスクリプション認証設定がネイティブ app-server ハーネスへ黙って移動されることを避けます。

`openclaw doctor` が、`codex` Plugin が有効である一方で `openai-codex/*` がまだ PI 経由でルーティングされていると警告する場合、それは移行ではなく診断として扱ってください。PI Codex OAuth が目的であれば、設定は変更しないでください。ネイティブ Codex app-server 実行を望む場合にのみ、`openai/<model>` と `agentRuntime.id: "codex"` に切り替えてください。

## 互換性契約

ランタイムが PI ではない場合、そのランタイムがサポートする OpenClaw サーフェスを文書化するべきです。ランタイムドキュメントにはこの形を使用してください。

| 質問                                   | 重要な理由                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| モデルループの所有者は誰ですか？       | リトライ、ツール継続、最終回答の判断がどこで行われるかを決定します。                              |
| 正規のスレッド履歴の所有者は誰ですか？ | OpenClaw が履歴を編集できるのか、それともミラーリングのみできるのかを決定します。                 |
| OpenClaw の動的ツールは動作しますか？  | メッセージング、セッション、Cron、OpenClaw 所有のツールはこれに依存します。                       |
| 動的ツールフックは動作しますか？       | Plugin は OpenClaw 所有のツールの周囲で `before_tool_call`、`after_tool_call`、ミドルウェアを想定します。 |
| ネイティブツールフックは動作しますか？ | シェル、パッチ、ランタイム所有のツールには、ポリシーと観測のためのネイティブフック対応が必要です。 |
| コンテキストエンジンのライフサイクルは実行されますか？ | メモリとコンテキストの Plugin は、assemble、ingest、after-turn、Compaction ライフサイクルに依存します。 |
| どの Compaction データが公開されますか？ | 通知だけを必要とする Plugin もあれば、保持/破棄されたメタデータを必要とする Plugin もあります。 |
| 意図的にサポートされていないものは何ですか？ | ネイティブランタイムがより多くの状態を所有している場合、ユーザーは PI と同等だと想定すべきではありません。 |

Codex ランタイムサポート契約は
[Codex ハーネス](/ja-JP/plugins/codex-harness#v1-support-contract)に記載されています。

## ステータスラベル

ステータス出力には `Execution` と `Runtime` の両方のラベルが表示される場合があります。これらは
プロバイダー名ではなく診断情報として読んでください。

- `openai/gpt-5.5` のようなモデル参照は、選択されたプロバイダー/モデルを示します。
- `codex` のようなランタイム ID は、そのターンを実行しているループを示します。
- Telegram や Discord のようなチャンネルラベルは、会話が行われている場所を示します。

ランタイム設定を変更した後もセッションに PI が表示される場合は、`/new` で新しいセッションを開始するか、
`/reset` で現在のセッションをクリアしてください。既存のセッションは記録済みのランタイムを保持するため、
トランスクリプトが互換性のない 2 つのネイティブセッションシステムをまたいで再生されることはありません。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [OpenAI](/ja-JP/providers/openai)
- [Agent ハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [Agent ループ](/ja-JP/concepts/agent-loop)
- [モデル](/ja-JP/concepts/models)
- [ステータス](/ja-JP/cli/status)
