---
read_when:
    - OpenClaw、Codex、ACP、または別のネイティブエージェントランタイムのどれを選ぶかを検討している
    - ステータスや設定内のプロバイダー/モデル/ランタイムのラベルで混乱している
    - ネイティブハーネスのサポート同等性を文書化している
summary: OpenClaw がモデルプロバイダー、モデル、チャネル、エージェントランタイムを分離する仕組み
title: Agent ランタイム
x-i18n:
    generated_at: "2026-07-05T11:15:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a4b3c54b9f80e37662dc98f14db8abc4491426695dc9aa081b05bc923cb44ecd
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**エージェントランタイム**は、準備済みのモデルループを 1 つ所有します。プロンプトを受け取り、
モデル出力を駆動し、ネイティブツール呼び出しを処理し、完了したターンを
OpenClaw に返します。

ランタイムとプロバイダーは、どちらもモデル設定の近くに現れるため混同しやすいです。
これらは異なるレイヤーです。

| レイヤー      | 例                                           | 意味                                                                |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| プロバイダー  | `anthropic`, `github-copilot`, `openai`      | OpenClaw が認証し、モデルを検出し、モデル参照に名前を付ける方法。 |
| モデル        | `claude-opus-4-6`, `gpt-5.5`                 | エージェントターン用に選択されたモデル。                            |
| エージェントランタイム | `claude-cli`, `codex`, `copilot`, `openclaw` | 準備済みターンを実行する低レベルのループまたはバックエンド。      |
| チャネル      | Discord, Slack, Telegram, WhatsApp           | メッセージが OpenClaw に出入りする場所。                            |

**ハーネス**は、エージェントランタイムを提供する実装です（コード上の用語）。
たとえば、バンドルされた Codex ハーネスは `codex` ランタイムを実装します。
公開設定では、プロバイダーまたはモデルエントリ上の `agentRuntime.id` を使用します。
エージェント全体のランタイムキーはレガシーであり、無視されます。`openclaw doctor --fix` は、
古いエージェント全体のランタイム固定を削除し、必要に応じてモデルスコープのランタイムポリシーを添えて、
レガシーランタイムのモデル参照を正規のプロバイダー/モデル参照に書き換えます。

2 つのランタイムファミリーがあります。

- **埋め込みハーネス**は、OpenClaw の準備済みエージェントループ内で実行されます。
  組み込みの `openclaw` ランタイムに加えて、`codex` や `copilot` などの
  登録済み Plugin ハーネスが含まれます。
- **CLI バックエンド**は、モデル参照を正規のまま保ちながらローカル CLI プロセスを実行します。
  たとえば、モデルスコープの `agentRuntime.id: "claude-cli"` を伴う
  `anthropic/claude-opus-4-8` は、「Anthropic モデルを選択し、Claude CLI 経由で実行する」
  ことを意味します。`claude-cli` は埋め込みハーネス ID ではなく、AgentHarness の選択に
  渡してはいけません。

`copilot` ハーネスは、GitHub Copilot CLI 用の独立した、オプトインの外部 Plugin ハーネスです。
PI、Codex、GitHub Copilot エージェントランタイムのユーザー向けの判断については、
[GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)を参照してください。

## Codex サーフェス

いくつかのサーフェスが Codex という名前を共有しています。

| サーフェス                                      | OpenClaw の名前/設定                  | 役割                                                                                                           |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| ネイティブ Codex app-server ランタイム           | `openai/*` モデル参照                | Codex app-server 経由で OpenAI の埋め込みエージェントターンを実行します。これは通常の ChatGPT/Codex サブスクリプション構成です。 |
| Codex OAuth 認証プロファイル                     | `openai` OAuth プロファイル          | Codex app-server ハーネスが利用する ChatGPT/Codex サブスクリプション認証を保存します。                         |
| Codex ACP アダプター                            | `runtime: "acp"`, `agentId: "codex"` | 外部 ACP/acpx コントロールプレーン経由で Codex を実行します。ACP/acpx が明示的に要求された場合にのみ使用します。 |
| ネイティブ Codex チャット制御コマンドセット     | `/codex ...`                         | チャットから Codex app-server スレッドをバインド、再開、誘導、停止、検査します。                              |
| 非エージェントサーフェス向け OpenAI Platform API ルート | `openai/*` と API キー認証           | 画像、埋め込み、音声、リアルタイムなどの直接的な OpenAI API。                                                 |

これらのサーフェスは意図的に独立しています。`codex` Plugin を有効にすると、
ネイティブ app-server 機能が利用可能になります。`openclaw doctor --fix` は、
レガシー Codex ルートの修復と古いセッション固定のクリーンアップを担います。エージェントモデルに
`openai/*` を選択することは、非エージェントの OpenAI API サーフェスが使われている場合を除き、
現在は「これを Codex 経由で実行する」ことを意味します。

一般的な ChatGPT/Codex サブスクリプション構成では、認証に Codex OAuth を使用しますが、
モデル参照は `openai/*` のままにし、`codex` ランタイムを選択します。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

これは、OpenClaw が OpenAI モデル参照を選択し、その後 Codex app-server ランタイムに
埋め込みエージェントターンの実行を依頼することを意味します。「API 課金を使う」という意味ではなく、
チャネル、モデルプロバイダーカタログ、OpenClaw セッションストアが Codex になるという意味でもありません。

バンドルされた `codex` Plugin が有効な場合、ACP ではなく、ネイティブの `/codex` コマンドサーフェス
（`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`）を自然言語の Codex 制御に使用してください。Codex で ACP を使うのは、
ユーザーが ACP/acpx を明示的に要求した場合、または ACP アダプターパスをテストしている場合のみです。
Claude Code、Gemini CLI、OpenCode、Cursor、および同様の外部ハーネスは引き続き ACP を使用します。

判断ツリー:

1. **Codex の bind/control/thread/resume/steer/stop** -> バンドルされた `codex` Plugin が有効な場合は、ネイティブの `/codex` コマンドサーフェス。
2. **埋め込みランタイムとしての Codex**、または通常のサブスクリプションに支えられた Codex エージェント体験 -> `openai/<model>`。
3. **OpenAI モデルに対して OpenClaw が明示的に選択されている** -> モデル参照は `openai/<model>` のままにし、プロバイダー/モデルのランタイムポリシーを `agentRuntime.id: "openclaw"` に設定します。選択された `openai` OAuth プロファイルは、OpenClaw の Codex 認証トランスポート経由で内部的にルーティングされます。
4. **設定内のレガシー Codex モデル参照** -> `openclaw doctor --fix` で `openai/<model>` に修復します。古いモデル参照がそれを示唆していた場合、doctor はプロバイダー/モデルスコープの `agentRuntime.id: "codex"` を追加して Codex 認証ルートを維持します。レガシー **`codex-cli/*`** モデル参照も同じ `openai/<model>` Codex app-server ルートに修復されます。OpenClaw は、バンドルされた Codex CLI バックエンドをもう保持していません。
5. **ACP、acpx、または Codex ACP アダプターが明示的に要求されている** -> `runtime: "acp"` と `agentId: "codex"`。
6. **Claude Code、Gemini CLI、OpenCode、Cursor、Droid、または別の外部ハーネス** -> ネイティブサブエージェントランタイムではなく ACP/acpx。

| 意図しているもの...                     | 使用するもの...                               |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server のチャット/スレッド制御 | バンドルされた `codex` Plugin の `/codex ...` |
| Codex app-server 埋め込みエージェントランタイム | `openai/*` エージェントモデル参照            |
| OpenAI Codex OAuth                      | `openai` OAuth プロファイル                  |
| Claude Code またはその他の外部ハーネス  | ACP/acpx                                     |

OpenAI ファミリーのプレフィックス分割については、[OpenAI](/ja-JP/providers/openai) と
[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。Codex ランタイムサポート契約については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)を参照してください。

## ランタイムの所有権

ランタイムごとに、ループの所有範囲が異なります。

| サーフェス                  | OpenClaw 埋め込み                              | Codex app-server                                                            |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| モデルループの所有者        | OpenClaw 埋め込みランナー経由の OpenClaw       | Codex app-server                                                            |
| 正規のスレッド状態          | OpenClaw トランスクリプト                      | Codex スレッドと OpenClaw トランスクリプトミラー                            |
| OpenClaw 動的ツール         | ネイティブ OpenClaw ツールループ               | Codex アダプター経由でブリッジ                                             |
| ネイティブシェルおよびファイルツール | OpenClaw パス                                  | Codex ネイティブツール。サポートされる場合はネイティブフック経由でブリッジ |
| コンテキストエンジン        | ネイティブ OpenClaw コンテキスト組み立て       | OpenClaw が組み立てたコンテキストを Codex ターンへ投影                     |
| Compaction                  | OpenClaw または選択されたコンテキストエンジン  | Codex ネイティブの Compaction。OpenClaw 通知とミラー保守を伴う              |
| チャネル配信                | OpenClaw                                       | OpenClaw                                                                    |

設計ルール: OpenClaw がそのサーフェスを所有する場合、通常の Plugin フック動作を提供できます。
ネイティブランタイムがそのサーフェスを所有する場合、OpenClaw にはランタイムイベントまたはネイティブフックが必要です。
ネイティブランタイムが正規のスレッド状態を所有する場合、OpenClaw はサポートされていない内部を書き換えるのではなく、
ミラーリングしてコンテキストを投影します。

## ランタイム選択

OpenClaw は、プロバイダーとモデルの解決後に、次の順序で埋め込みランタイムを解決します。

1. **モデルスコープのランタイムポリシー**が優先されます。これは、設定済みのプロバイダーモデルエントリ、
   または `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime` にあります。
   `agents.defaults.models["vllm/*"].agentRuntime` のようなプロバイダーワイルドカードは、
   正確なモデルポリシーの後に適用されるため、動的に検出されたプロバイダーモデルは、
   正確なモデルごとの例外を上書きせずに 1 つのランタイムを共有できます。
2. **プロバイダースコープのランタイムポリシー**: `models.providers.<provider>.agentRuntime`。
3. **`auto` モード**: 登録済み Plugin ランタイムは、サポートするプロバイダー/モデルのペアを要求できます。
4. `auto` モードでターンを要求するものが何もない場合、OpenClaw は互換ランタイムとして
   `openclaw` にフォールバックします。実行を厳密にする必要がある場合は、明示的なランタイム ID を使用してください。

セッション全体およびエージェント全体のランタイム固定は無視されます: `OPENCLAW_AGENT_RUNTIME`、
セッションの `agentHarnessId`/`agentRuntimeOverride` 状態、`agents.defaults.agentRuntime`,
および `agents.list[].agentRuntime`。古いエージェント全体のランタイム設定を削除し、
意図を保持できる場合にレガシーランタイムのモデル参照を変換するには、`openclaw doctor --fix` を実行してください。

明示的なプロバイダー/モデル Plugin ランタイムは失敗時に閉じます。プロバイダーまたはモデル上の
`agentRuntime.id: "codex"` は Codex を意味し、そうでなければ明確な選択/ランタイムエラーになります。
OpenClaw に黙ってルーティングし直されることはありません。一致しないターンを OpenClaw にルーティングできるのは
`auto` だけです。

CLI バックエンドエイリアスは、埋め込みハーネス ID とは異なります。推奨される Claude CLI 形式:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

`claude-cli/claude-opus-4-7` のようなレガシー参照は互換性のために引き続きサポートされますが、
新しい設定ではプロバイダー/モデルを正規のままにし、実行バックエンドをプロバイダー/モデルのランタイムポリシーに置くべきです。

レガシー `codex-cli/*` 参照は異なります。doctor はそれらを `openai/*` に移行し、
Codex CLI バックエンドを維持するのではなく、Codex app-server ハーネス経由で実行されるようにします。

`auto` モードは、ほとんどのプロバイダーに対して意図的に保守的です。OpenAI エージェントモデルは例外です。
未設定のランタイムと `auto` はどちらも Codex ハーネスに解決されます。明示的な OpenClaw ランタイム設定は、
`openai/*` エージェントターン向けのオプトイン互換ルートのままです。選択された `openai` OAuth プロファイルと組み合わせると、
OpenClaw は公開モデル参照を `openai/*` のまま保ちながら、そのパスを Codex 認証トランスポート経由で内部的にルーティングします。
古い OpenAI ランタイムセッション固定はランタイム選択で無視され、`openclaw doctor --fix` でクリーンアップできます。

`openclaw doctor` が、`codex` Plugin が有効である一方でレガシー Codex モデル参照が設定に残っていると警告した場合、
それをレガシールート状態として扱い、`openclaw doctor --fix` を実行して Codex ランタイム付きの `openai/*` に書き換えてください。

## GitHub Copilot エージェントランタイム

外部の `@openclaw/copilot` Plugin は、GitHub Copilot CLI（`@github/copilot-sdk`）を基盤とするオプトインの `copilot` ランタイムを登録します。これは正規のサブスクリプション `github-copilot` プロバイダーを要求し、`auto` によって選択されることは**ありません**。`agentRuntime.id` を使って、モデル単位またはプロバイダー単位でオプトインします。

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

ハーネスは `extensions/copilot/doctor-contract-api.ts` でプロバイダー、ランタイム、CLI セッションキー、認証プロファイルプレフィックスを要求し、これは `openclaw doctor` によって自動読み込みされます。構成、認証、トランスクリプトのミラーリング、Compaction、宣言型 doctor コントラクト、そしてより広い PI vs Codex vs Copilot SDK の判断については、[GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)を参照してください。

## 互換性コントラクト

ランタイムが OpenClaw ではない場合、そのドキュメントでは、どの OpenClaw サーフェスをサポートするかを明記する必要があります。

| 質問                                   | 重要な理由                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| モデルループの所有者は誰か？           | リトライ、ツール継続、最終回答の判断がどこで行われるかを決定します。                               |
| 正規のスレッド履歴の所有者は誰か？     | OpenClaw が履歴を編集できるか、ミラーリングのみできるかを決定します。                               |
| OpenClaw の動的ツールは動作するか？    | メッセージング、セッション、Cron、OpenClaw 所有のツールはこれに依存します。                         |
| 動的ツールフックは動作するか？         | Plugin は、OpenClaw 所有のツールの周囲で `before_tool_call`、`after_tool_call`、ミドルウェアを想定します。 |
| ネイティブツールフックは動作するか？   | シェル、パッチ、ランタイム所有のツールには、ポリシーと観測のためにネイティブフックのサポートが必要です。 |
| コンテキストエンジンのライフサイクルは実行されるか？ | メモリとコンテキスト Plugin は、assemble、ingest、after-turn、Compaction のライフサイクルに依存します。 |
| どの Compaction データが公開されるか？ | 一部の Plugin は通知だけを必要とし、他の Plugin は保持/破棄されたメタデータを必要とします。          |
| 意図的にサポートされていないものは何か？ | ネイティブランタイムがより多くの状態を所有する場合、ユーザーは OpenClaw と同等だと想定すべきではありません。 |

Codex ランタイムサポートコントラクトは、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)に記載されています。

## ステータスラベル

ステータス出力には `Execution` と `Runtime` の両方のラベルが表示されることがあります。これらはプロバイダー名ではなく、診断情報として読んでください。

- `openai/gpt-5.5` のようなモデル参照は、選択されたプロバイダー/モデルです。
- `codex` のようなランタイム ID は、ターンを実行しているループです。
- Telegram や Discord のようなチャンネルラベルは、会話が行われている場所です。

実行で予期しないランタイムが表示される場合は、まず選択されたプロバイダー/モデルのランタイムポリシーを確認してください。レガシーセッションのランタイム固定は、もはやルーティングを決定しません。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)
- [OpenAI](/ja-JP/providers/openai)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [モデル](/ja-JP/concepts/models)
- [ステータス](/ja-JP/cli/status)
