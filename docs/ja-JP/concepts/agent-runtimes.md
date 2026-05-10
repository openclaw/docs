---
read_when:
    - PI、Codex、ACP、または別のネイティブエージェントランタイムの中から選択している場合
    - ステータスや設定でプロバイダー/モデル/ランタイムのラベルに戸惑っている
    - ネイティブハーネスのサポート同等性を文書化しています
summary: OpenClaw がモデルプロバイダー、モデル、チャネル、エージェントランタイムを分離する仕組み
title: エージェントランタイム
x-i18n:
    generated_at: "2026-05-10T19:30:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**エージェントランタイム**は、準備済みのモデルループを 1 つ所有するコンポーネントです。プロンプトを受け取り、モデル出力を駆動し、ネイティブツール呼び出しを処理して、完了したターンを OpenClaw に返します。

ランタイムは、どちらもモデル設定の近くに現れるため、プロバイダーと混同されやすいです。これらは別のレイヤーです。

| レイヤー | 例 | 意味 |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| プロバイダー | `openai`, `anthropic`, `openai-codex` | OpenClaw が認証し、モデルを検出し、モデル参照に名前を付ける方法。 |
| モデル | `gpt-5.5`, `claude-opus-4-6` | エージェントターンに選択されるモデル。 |
| エージェントランタイム | `pi`, `codex`, `claude-cli` | 準備済みターンを実行する低レベルのループまたはバックエンド。 |
| チャネル | Telegram, Discord, Slack, WhatsApp | メッセージが OpenClaw に出入りする場所。 |

コードでは **ハーネス**という語も見かけます。ハーネスは、エージェントランタイムを提供する実装です。たとえば、バンドルされた Codex ハーネスは `codex` ランタイムを実装します。公開設定では、プロバイダーまたはモデルのエントリで `agentRuntime.id` を使用します。エージェント全体のランタイムキーはレガシーであり、無視されます。`openclaw doctor --fix` は古いエージェント全体のランタイム固定を削除し、レガシーランタイムのモデル参照を、正規のプロバイダー/モデル参照と、必要に応じたモデルスコープのランタイムポリシーへ書き換えます。

ランタイムファミリーは 2 つあります。

- **埋め込みハーネス**は、OpenClaw の準備済みエージェントループ内で実行されます。現在これは、組み込みの `pi` ランタイムに加え、`codex` などの登録済み Plugin ハーネスです。
- **CLI バックエンド**は、モデル参照を正規のまま保ちながらローカル CLI プロセスを実行します。たとえば、`anthropic/claude-opus-4-7` にモデルスコープの `agentRuntime.id: "claude-cli"` がある場合は、「Anthropic モデルを選択し、Claude CLI 経由で実行する」という意味です。`claude-cli` は埋め込みハーネス ID ではなく、AgentHarness の選択に渡してはいけません。

## Codex のサーフェス

混乱の多くは、Codex という名前を共有する複数の異なるサーフェスから生じます。

| サーフェス | OpenClaw の名前/設定 | 実行内容 |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| ネイティブ Codex app-server ランタイム | `openai/*` モデル参照 | OpenAI の埋め込みエージェントターンを Codex app-server 経由で実行します。これは通常の ChatGPT/Codex サブスクリプション構成です。 |
| Codex OAuth 認証プロファイル | `openai-codex` 認証プロバイダー | Codex app-server ハーネスが使用する ChatGPT/Codex サブスクリプション認証を保存します。 |
| Codex ACP アダプター | `runtime: "acp"`, `agentId: "codex"` | 外部 ACP/acpx コントロールプレーン経由で Codex を実行します。ACP/acpx が明示的に求められた場合にのみ使用します。 |
| ネイティブ Codex チャット制御コマンドセット | `/codex ...` | チャットから Codex app-server スレッドをバインド、再開、誘導、停止、検査します。 |
| エージェント以外のサーフェス向け OpenAI Platform API ルート | `openai/*` と API キー認証 | 画像、埋め込み、音声、リアルタイムなど、直接の OpenAI API に使用されます。 |

これらのサーフェスは意図的に独立しています。`codex` Plugin を有効にすると、ネイティブ app-server 機能が利用可能になります。`openclaw doctor --fix` は、レガシーの `openai-codex/*` ルート修復と古いセッション固定のクリーンアップを担当します。エージェントモデルに `openai/*` を選択することは、エージェント以外の OpenAI API サーフェスを使用していない限り、現在は「これを Codex 経由で実行する」という意味です。

一般的な ChatGPT/Codex サブスクリプション構成では、認証に Codex OAuth を使用しますが、モデル参照は `openai/*` のままにして、`codex` ランタイムを選択します。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

これは、OpenClaw が OpenAI モデル参照を選択し、その後 Codex app-server ランタイムに埋め込みエージェントターンの実行を依頼するという意味です。「API 課金を使用する」という意味ではなく、チャネル、モデルプロバイダーカタログ、または OpenClaw セッションストアが Codex になるという意味でもありません。

バンドルされた `codex` Plugin が有効な場合、自然言語での Codex 制御には ACP ではなく、ネイティブの `/codex` コマンドサーフェス（`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`）を使用するべきです。Codex に ACP を使用するのは、ユーザーが ACP/acpx を明示的に求めた場合、または ACP アダプターパスをテストしている場合のみです。Claude Code、Gemini CLI、OpenCode、Cursor、および同様の外部ハーネスは引き続き ACP を使用します。

これはエージェント向けの判断ツリーです。

1. ユーザーが **Codex のバインド/制御/スレッド/再開/誘導/停止**を求めている場合、バンドルされた `codex` Plugin が有効なら、ネイティブの `/codex` コマンドサーフェスを使用します。
2. ユーザーが **埋め込みランタイムとしての Codex** を求めている場合、または通常のサブスクリプションに支えられた Codex エージェント体験を望んでいる場合は、`openai/<model>` を使用します。
3. ユーザーが **OpenAI モデル用に PI** を明示的に選択している場合、モデル参照は `openai/<model>` のままにし、プロバイダー/モデルのランタイムポリシーを `agentRuntime.id: "pi"` に設定します。選択された `openai-codex` 認証プロファイルは、PI のレガシー Codex 認証トランスポートを通じて内部的にルーティングされます。
4. レガシー設定にまだ **`openai-codex/*` モデル参照**が含まれている場合は、`openclaw doctor --fix` で `openai/<model>` に修復します。doctor は、古いモデル参照がそれを示していた箇所に、プロバイダー/モデルスコープの `agentRuntime.id: "codex"` を追加することで、Codex 認証ルートを維持します。
5. ユーザーが **ACP**、**acpx**、または **Codex ACP アダプター**と明示的に言っている場合は、`runtime: "acp"` と `agentId: "codex"` で ACP を使用します。
6. リクエストが **Claude Code、Gemini CLI、OpenCode、Cursor、Droid、または別の外部ハーネス**に関するものである場合は、ネイティブのサブエージェントランタイムではなく ACP/acpx を使用します。

| 意味しているもの... | 使用するもの... |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server のチャット/スレッド制御 | バンドルされた `codex` Plugin の `/codex ...` |
| Codex app-server の埋め込みエージェントランタイム | `openai/*` エージェントモデル参照 |
| OpenAI Codex OAuth | `openai-codex` 認証プロファイル |
| Claude Code またはその他の外部ハーネス | ACP/acpx |

OpenAI ファミリーのプレフィックス分割については、[OpenAI](/ja-JP/providers/openai) と [モデルプロバイダー](/ja-JP/concepts/model-providers) を参照してください。Codex ランタイムサポート契約については、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#v1-support-contract) を参照してください。

## ランタイムの所有権

ランタイムごとに、ループのどの範囲を所有するかが異なります。

| サーフェス | OpenClaw PI 埋め込み | Codex app-server |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| モデルループ所有者 | PI 埋め込みランナー経由の OpenClaw | Codex app-server |
| 正規のスレッド状態 | OpenClaw トランスクリプト | Codex スレッドと OpenClaw トランスクリプトのミラー |
| OpenClaw 動的ツール | ネイティブ OpenClaw ツールループ | Codex アダプター経由でブリッジ |
| ネイティブシェルおよびファイルツール | PI/OpenClaw パス | Codex ネイティブツール。サポートされている場合はネイティブフック経由でブリッジ |
| コンテキストエンジン | ネイティブ OpenClaw コンテキスト組み立て | OpenClaw が Codex ターンへコンテキストを組み立てて投入 |
| Compaction | OpenClaw または選択されたコンテキストエンジン | Codex ネイティブの Compaction。OpenClaw 通知とミラー保守を伴う |
| チャネル配信 | OpenClaw | OpenClaw |

この所有権の分割が主な設計ルールです。

- OpenClaw がサーフェスを所有する場合、OpenClaw は通常の Plugin フック動作を提供できます。
- ネイティブランタイムがサーフェスを所有する場合、OpenClaw にはランタイムイベントまたはネイティブフックが必要です。
- ネイティブランタイムが正規のスレッド状態を所有する場合、OpenClaw はサポートされていない内部を書き換えるのではなく、ミラーリングし、コンテキストを投影するべきです。

## ランタイムの選択

OpenClaw は、プロバイダーとモデルの解決後に埋め込みランタイムを選択します。

1. モデルスコープのランタイムポリシーが優先されます。これは、設定済みのプロバイダーモデルエントリ、または `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` に置くことができます。
2. 次に、`models.providers.<provider>.agentRuntime` のプロバイダースコープのランタイムポリシーが続きます。
3. `auto` モードでは、登録済み Plugin ランタイムが、サポートされているプロバイダー/モデルの組み合わせを要求できます。
4. `auto` モードでターンを要求するランタイムがない場合、OpenClaw は互換ランタイムとして PI を使用します。実行を厳密にする必要がある場合は、明示的なランタイム ID を使用してください。

セッション全体およびエージェント全体のランタイム固定は無視されます。これには、`OPENCLAW_AGENT_RUNTIME`、セッションの `agentHarnessId`/`agentRuntimeOverride` 状態、`agents.defaults.agentRuntime`、`agents.list[].agentRuntime` が含まれます。古いエージェント全体のランタイム設定を削除し、OpenClaw が意図を保持できる場所でレガシーランタイムのモデル参照を変換するには、`openclaw doctor --fix` を実行してください。

明示的なプロバイダー/モデル Plugin ランタイムはフェイルクローズします。たとえば、プロバイダーまたはモデル上の `agentRuntime.id: "codex"` は Codex、または明確な選択/ランタイムエラーを意味します。暗黙に PI へ戻されることはありません。

CLI バックエンドのエイリアスは、埋め込みハーネス ID とは異なります。推奨される Claude CLI の形式は次のとおりです。

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

`claude-cli/claude-opus-4-7` のようなレガシー参照は互換性のため引き続きサポートされますが、新しい設定ではプロバイダー/モデルを正規のまま保ち、実行バックエンドをプロバイダー/モデルのランタイムポリシーに置くべきです。

`auto` モードは、ほとんどのプロバイダーに対して意図的に保守的です。OpenAI エージェントモデルは例外です。ランタイム未設定と `auto` はどちらも Codex ハーネスに解決されます。明示的な PI ランタイム設定は、`openai/*` エージェントターン向けのオプトイン互換ルートとして残ります。選択された `openai-codex` 認証プロファイルと組み合わせられた場合、OpenClaw は公開モデル参照を `openai/*` のまま保ちながら、PI を内部的にレガシー Codex 認証トランスポート経由でルーティングします。古い OpenAI PI セッション固定はランタイム選択で無視され、`openclaw doctor --fix` でクリーンアップできます。

`openclaw doctor` が、`codex` Plugin が有効である一方で `openai-codex/*` が設定に残っていると警告する場合、それはレガシールート状態として扱ってください。`openclaw doctor --fix` を実行して、Codex ランタイム付きの `openai/*` に書き換えます。

## 互換性契約

ランタイムが PI ではない場合、どの OpenClaw サーフェスをサポートするかを文書化するべきです。ランタイムドキュメントにはこの形を使用してください。

| 質問                                   | 重要な理由                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| モデルループの所有者は誰か？           | リトライ、ツール継続、最終回答の判断がどこで行われるかを決定するため。                             |
| 正規のスレッド履歴の所有者は誰か？     | OpenClaw が履歴を編集できるのか、それともミラーするだけなのかを決定するため。                       |
| OpenClaw の動的ツールは動作するか？    | メッセージング、セッション、cron、OpenClaw 所有のツールがこれに依存するため。                       |
| 動的ツールフックは動作するか？         | Plugins は OpenClaw 所有のツールの周囲で `before_tool_call`、`after_tool_call`、ミドルウェアを期待するため。 |
| ネイティブツールフックは動作するか？   | シェル、パッチ、ランタイム所有ツールには、ポリシーと観測のためにネイティブフックサポートが必要なため。 |
| コンテキストエンジンのライフサイクルは実行されるか？ | メモリとコンテキスト Plugins は、assemble、ingest、after-turn、Compaction ライフサイクルに依存するため。 |
| どの Compaction データが公開されるか？ | 一部の Plugins は通知だけを必要とする一方で、保持/破棄されたメタデータを必要とするものもあるため。 |
| 何が意図的にサポート対象外か？         | ネイティブランタイムがより多くの状態を所有する箇所で、ユーザーが PI と同等だと想定すべきではないため。 |

Codex ランタイムサポート契約は
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)に記載されています。

## ステータスラベル

ステータス出力には `Execution` と `Runtime` の両方のラベルが表示される場合があります。これらは
プロバイダー名ではなく診断情報として読んでください。

- `openai/gpt-5.5` のようなモデル参照は、選択されたプロバイダー/モデルを示します。
- `codex` のようなランタイム ID は、そのターンを実行しているループを示します。
- Telegram や Discord のようなチャンネルラベルは、会話が行われている場所を示します。

実行に想定外のランタイムがまだ表示される場合は、まず選択されたプロバイダー/モデルの
ランタイムポリシーを確認してください。レガシーセッションのランタイム固定は、もはやルーティングを決定しません。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [OpenAI](/ja-JP/providers/openai)
- [エージェントハーネス Plugins](/ja-JP/plugins/sdk-agent-harness)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [モデル](/ja-JP/concepts/models)
- [ステータス](/ja-JP/cli/status)
