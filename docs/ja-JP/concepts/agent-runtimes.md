---
read_when:
    - PI、Codex、ACP、またはその他のネイティブエージェントランタイムから選択している場合
    - ステータスまたは設定にあるプロバイダー/モデル/ランタイムのラベルで混乱している
    - ネイティブハーネスのサポート同等性を文書化しています
summary: OpenClaw がモデルプロバイダー、モデル、チャネル、エージェントランタイムを分離する仕組み
title: エージェントランタイム
x-i18n:
    generated_at: "2026-05-03T04:58:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**エージェントランタイム**とは、準備済みの 1 つのモデルループを所有するコンポーネントです。プロンプトを受け取り、モデル出力を進め、ネイティブツール呼び出しを処理し、完了したターンを OpenClaw に返します。

ランタイムはモデル設定の近くに表示されるため、プロバイダーと混同されやすいです。ただし、これらは異なるレイヤーです。

| レイヤー         | 例                                    | 意味                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| プロバイダー      | `openai`, `anthropic`, `openai-codex` | OpenClaw が認証し、モデルを検出し、モデル参照に名前を付ける方法。 |
| モデル         | `gpt-5.5`, `claude-opus-4-6`          | エージェントターンで選択されるモデル。                              |
| エージェントランタイム | `pi`, `codex`, `claude-cli`           | 準備済みターンを実行する低レベルのループまたはバックエンド。      |
| チャンネル       | Telegram, Discord, Slack, WhatsApp    | メッセージが OpenClaw に出入りする場所。                            |

コード内では **harness** という語も見かけます。harness はエージェントランタイムを提供する実装です。たとえば、バンドル済みの Codex harness は `codex` ランタイムを実装します。公開設定では `agentRuntime.id` を使用します。`openclaw doctor --fix` は古いランタイムポリシーキーをこの形に書き換えます。

ランタイムには 2 つの系統があります。

- **埋め込み harness** は OpenClaw の準備済みエージェントループ内で実行されます。現在は組み込みの `pi` ランタイムと、`codex` などの登録済み Plugin harness が該当します。
- **CLI バックエンド** は、モデル参照を正規のまま維持しながらローカル CLI プロセスを実行します。たとえば、`anthropic/claude-opus-4-7` と `agentRuntime.id: "claude-cli"` は「Anthropic モデルを選択し、Claude CLI 経由で実行する」ことを意味します。`claude-cli` は埋め込み harness id ではなく、AgentHarness の選択に渡してはいけません。

## Codex サーフェス

混乱の多くは、Codex という名前を共有する複数の異なるサーフェスに由来します。

| サーフェス                                             | OpenClaw の名前/設定                       | 役割                                                                                               |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| ネイティブ Codex app-server ランタイム                      | `openai/*` と `agentRuntime.id: "codex"` | Codex app-server 経由で埋め込みエージェントターンを実行します。これは通常の ChatGPT/Codex サブスクリプション設定です。 |
| Codex OAuth プロバイダールート                           | `openai-codex/*` モデル参照                | 通常の OpenClaw PI runner 経由で ChatGPT/Codex サブスクリプション OAuth を使用します。                               |
| Codex ACP アダプター                                    | `runtime: "acp"`, `agentId: "codex"`       | 外部 ACP/acpx コントロールプレーン経由で Codex を実行します。ACP/acpx が明示的に求められた場合にのみ使用します。        |
| ネイティブ Codex チャット制御コマンドセット                | `/codex ...`                               | チャットから Codex app-server スレッドをバインド、再開、誘導、停止、検査します。                            |
| GPT/Codex 形式モデル向け OpenAI Platform API ルート | `openai/*` モデル参照                      | `agentRuntime.id: "codex"` などのランタイム上書きがターンを実行しない限り、OpenAI API キー認証を使用します。     |

これらのサーフェスは意図的に独立しています。`codex` Plugin を有効にするとネイティブ app-server 機能が利用可能になりますが、`openai-codex/*` を `openai/*` に書き換えることも、既存セッションを変更することも、ACP を Codex のデフォルトにすることもありません。`openai-codex/*` を選択することは、別途ランタイムを強制しない限り、「Codex OAuth プロバイダールートを使用する」ことを意味します。

一般的な ChatGPT/Codex サブスクリプション設定では、認証に Codex OAuth を使用しますが、モデル参照は `openai/*` のままにし、`codex` ランタイムを選択します。

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

これは、OpenClaw が OpenAI モデル参照を選択し、その後 Codex app-server ランタイムに埋め込みエージェントターンの実行を依頼することを意味します。「API 課金を使用する」ことも、チャンネル、モデルプロバイダーカタログ、または OpenClaw セッションストアが Codex になることも意味しません。

バンドル済みの `codex` Plugin が有効な場合、自然言語による Codex 制御では ACP ではなく、ネイティブの `/codex` コマンドサーフェス（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`）を使用する必要があります。Codex で ACP を使用するのは、ユーザーが ACP/acpx を明示的に求めた場合、または ACP アダプターパスをテストしている場合だけです。Claude Code、Gemini CLI、OpenCode、Cursor、および類似の外部 harness は引き続き ACP を使用します。

これはエージェント向けの判断ツリーです。

1. ユーザーが **Codex の bind/control/thread/resume/steer/stop** を求めている場合、バンドル済みの `codex` Plugin が有効なら、ネイティブの `/codex` コマンドサーフェスを使用します。
2. ユーザーが **埋め込みランタイムとしての Codex** を求めている場合、または通常のサブスクリプション支援の Codex エージェント体験を望んでいる場合、`openai/<model>` と `agentRuntime.id: "codex"` を使用します。
3. ユーザーが **通常の OpenClaw runner での Codex OAuth/サブスクリプション認証** を求めている場合、`openai-codex/<model>` を使用し、ランタイムは PI のままにします。
4. ユーザーが **ACP**、**acpx**、または **Codex ACP アダプター** と明示的に述べている場合、`runtime: "acp"` と `agentId: "codex"` で ACP を使用します。
5. リクエストが **Claude Code、Gemini CLI、OpenCode、Cursor、Droid、または別の外部 harness** 向けの場合、ネイティブのサブエージェントランタイムではなく ACP/acpx を使用します。

| 意図しているもの...                             | 使用するもの...                                       |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server のチャット/スレッド制御    | バンドル済み `codex` Plugin の `/codex ...` |
| Codex app-server の埋め込みエージェントランタイム | `agentRuntime.id: "codex"`                   |
| PI runner 上の OpenAI Codex OAuth     | `openai-codex/*` モデル参照                  |
| Claude Code またはその他の外部 harness   | ACP/acpx                                     |

OpenAI 系プレフィックスの分割については、[OpenAI](/ja-JP/providers/openai) と [モデルプロバイダー](/ja-JP/concepts/model-providers) を参照してください。Codex ランタイムのサポート契約については、[Codex harness](/ja-JP/plugins/codex-harness#v1-support-contract) を参照してください。

## ランタイムの所有権

ランタイムごとに、ループを所有する範囲は異なります。

| サーフェス                     | OpenClaw PI 埋め込み                    | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| モデルループの所有者            | PI 埋め込み runner 経由の OpenClaw | Codex app-server                                                            |
| 正規スレッド状態      | OpenClaw トランスクリプト                     | Codex スレッドと OpenClaw トランスクリプトのミラー                               |
| OpenClaw 動的ツール      | ネイティブ OpenClaw ツールループ               | Codex アダプター経由でブリッジ                                           |
| ネイティブシェルとファイルツール | PI/OpenClaw パス                        | Codex ネイティブツール。サポートされる場合はネイティブフック経由でブリッジ            |
| コンテキストエンジン              | ネイティブ OpenClaw コンテキスト組み立て        | OpenClaw が Codex ターンにコンテキストを組み立てて投影                     |
| Compaction                  | OpenClaw または選択されたコンテキストエンジン     | Codex ネイティブの compaction。OpenClaw 通知とミラー保守を伴う |
| チャンネル配信            | OpenClaw                                | OpenClaw                                                                    |

この所有権の分割が主要な設計ルールです。

- OpenClaw がサーフェスを所有する場合、OpenClaw は通常の Plugin フック動作を提供できます。
- ネイティブランタイムがサーフェスを所有する場合、OpenClaw にはランタイムイベントまたはネイティブフックが必要です。
- ネイティブランタイムが正規スレッド状態を所有する場合、OpenClaw はサポートされていない内部を書き換えるのではなく、ミラーしてコンテキストを投影するべきです。

## ランタイム選択

OpenClaw は、プロバイダーとモデルの解決後に埋め込みランタイムを選択します。

1. セッションに記録されたランタイムが優先されます。設定変更によって既存のトランスクリプトが別のネイティブスレッドシステムへホットスイッチされることはありません。
2. `OPENCLAW_AGENT_RUNTIME=<id>` は、新規またはリセットされたセッションにそのランタイムを強制します。
3. `agents.defaults.agentRuntime.id` または `agents.list[].agentRuntime.id` では、`auto`、`pi`、`codex` などの登録済み埋め込み harness id、または `claude-cli` などのサポートされている CLI バックエンドエイリアスを設定できます。
4. `auto` モードでは、登録済み Plugin ランタイムがサポート対象のプロバイダー/モデルの組み合わせを要求できます。
5. `auto` モードでどのランタイムもターンを要求しない場合、OpenClaw は互換ランタイムとして PI を使用します。実行を厳密にする必要がある場合は、明示的なランタイム id を使用してください。

明示的な Plugin ランタイムはフェイルクローズします。たとえば、`agentRuntime.id: "codex"` は Codex、または明確な選択/ランタイムエラーを意味します。PI に暗黙で戻されることはありません。

CLI バックエンドエイリアスは、埋め込み harness id とは異なります。推奨される Claude CLI の形式は次のとおりです。

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

`claude-cli/claude-opus-4-7` などのレガシー参照は互換性のため引き続きサポートされますが、新しい設定ではプロバイダー/モデルを正規のまま維持し、実行バックエンドを `agentRuntime.id` に置くべきです。

`auto` モードは意図的に保守的です。Plugin ランタイムは理解しているプロバイダー/モデルの組み合わせを要求できますが、Codex Plugin は `auto` モードで `openai-codex` プロバイダーを要求しません。これにより、`openai-codex/*` は明示的な PI Codex OAuth ルートとして維持され、サブスクリプション認証設定がネイティブ app-server harness に暗黙で移動することを避けます。

`openclaw doctor` が、`codex` Plugin が有効である一方で `openai-codex/*` がまだ PI 経由でルーティングされていると警告する場合、それは移行ではなく診断として扱ってください。PI Codex OAuth が目的であれば、設定を変更しないでください。ネイティブ Codex app-server 実行を望む場合にのみ、`openai/<model>` と `agentRuntime.id: "codex"` に切り替えてください。

## 互換性契約

ランタイムが PI でない場合、サポートする OpenClaw サーフェスを文書化するべきです。ランタイムのドキュメントにはこの形を使用してください。

| 質問                               | 重要な理由                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| モデルループは誰が所有するか？               | 再試行、ツール継続、最終回答の判断がどこで行われるかを決定します。                   |
| 正規スレッド履歴は誰が所有するか？     | OpenClaw が履歴を編集できるか、ミラーのみできるかを決定します。                                   |
| OpenClaw 動的ツールは動作するか？        | メッセージング、セッション、cron、OpenClaw 所有ツールはこれに依存します。                                 |
| 動的ツールフックは動作するか？            | Plugin は OpenClaw 所有ツールの周囲で `before_tool_call`、`after_tool_call`、ミドルウェアを期待します。 |
| ネイティブツールフックは動作するか？             | シェル、パッチ、ランタイム所有ツールには、ポリシーと観測のためにネイティブフックサポートが必要です。        |
| コンテキストエンジンのライフサイクルは実行されるか？ | メモリおよびコンテキスト Plugin は、assemble、ingest、after-turn、compaction のライフサイクルに依存します。      |
| どの compaction データが公開されるか？       | 一部の Plugin には通知だけで十分ですが、保持/削除されたメタデータが必要な Plugin もあります。                    |
| 何が意図的にサポートされていないか？     | ネイティブランタイムがより多くの状態を所有する場所で、ユーザーが PI と同等だと想定しないようにするためです。                  |

Codex ランタイムサポート契約は [Codex harness](/ja-JP/plugins/codex-harness#v1-support-contract) に記載されています。

## ステータスラベル

ステータス出力には `Execution` と `Runtime` の両方のラベルが表示される場合があります。これらは
プロバイダー名ではなく診断情報として読んでください。

- `openai/gpt-5.5` のようなモデル参照は、選択されたプロバイダー/モデルを示します。
- `codex` のようなランタイム ID は、どのループがターンを実行しているかを示します。
- Telegram や Discord のようなチャンネルラベルは、会話が行われている場所を示します。

ランタイム設定を変更した後もセッションに PI が表示される場合は、`/new` で新しいセッションを開始するか、
`/reset` で現在のセッションをクリアしてください。既存のセッションは記録済みのランタイムを保持するため、
トランスクリプトが互換性のない 2 つのネイティブセッションシステムを通じて再生されることはありません。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [OpenAI](/ja-JP/providers/openai)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [モデル](/ja-JP/concepts/models)
- [ステータス](/ja-JP/cli/status)
