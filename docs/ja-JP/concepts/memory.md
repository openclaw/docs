---
read_when:
    - メモリの仕組みを理解したい場合
    - どのメモリファイルを書き込むべきかを知りたい
summary: OpenClaw がセッションをまたいで情報を記憶する仕組み
title: メモリの概要
x-i18n:
    generated_at: "2026-05-10T19:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw は、エージェントのワークスペースに **プレーンな Markdown ファイル**を書き込むことで情報を記憶します。モデルが「記憶」するのはディスクに保存された内容だけです。隠れた状態はありません。

## 仕組み

エージェントには、メモリ関連のファイルが 3 つあります。

- **`MEMORY.md`** — 長期メモリ。永続的な事実、好み、判断。すべての DM セッションの開始時に読み込まれます。
- **`memory/YYYY-MM-DD.md`** — 日次ノート。進行中のコンテキストと観察事項。今日と昨日のノートは自動的に読み込まれます。
- **`DREAMS.md`**（任意）— Dream Diary と Dreaming スイープの概要。根拠に基づく履歴バックフィル項目を含め、人間によるレビューのために使います。

これらのファイルはエージェントワークスペース（デフォルトは `~/.openclaw/workspace`）にあります。

## 何をどこに置くか

`MEMORY.md` は、コンパクトで精選された層です。永続的な事実、好み、継続的な判断、メインのプライベートセッション開始時に利用できるべき短い要約に使います。これは生のトランスクリプト、日次ログ、網羅的なアーカイブとして使うものではありません。

`memory/YYYY-MM-DD.md` ファイルは作業用の層です。詳細な日次ノート、観察事項、セッション要約、後でまだ役立つ可能性がある生のコンテキストに使います。これらのファイルは `memory_search` と `memory_get` 用にインデックス化されますが、通常のブートストラッププロンプトに毎ターン注入されるわけではありません。

時間が経つにつれて、エージェントは日次ノートから有用な内容を `MEMORY.md` に抽出し、古くなった長期項目を削除することが期待されます。生成されたワークスペース指示と Heartbeat フローは、これを定期的に実行できます。記憶させる詳細ごとに手動で `MEMORY.md` を編集する必要はありません。

`MEMORY.md` がブートストラップファイルの予算を超えると、OpenClaw はディスク上のファイルをそのまま保持しますが、モデルコンテキストに注入するコピーは切り詰めます。これは、詳細な内容を `memory/*.md` に戻し、`MEMORY.md` には永続的な要約だけを残すか、明示的により多くのプロンプト予算を使いたい場合はブートストラップ上限を引き上げる合図として扱ってください。生のサイズと注入サイズ、および切り詰め状態を確認するには、`/context list`、`/context detail`、または `openclaw doctor` を使います。

<Tip>
エージェントに何かを記憶させたい場合は、単に頼んでください: 「TypeScript を好むことを覚えておいて。」エージェントは適切なファイルにそれを書き込みます。
</Tip>

## 推論されたコミットメント

将来のフォローアップの中には、永続的な事実ではないものがあります。明日の面接について言及した場合、有用なメモリは「面接後に確認する」であって、「これを `MEMORY.md` に永遠に保存する」ではないかもしれません。

[コミットメント](/ja-JP/concepts/commitments)は、そのような場合のための、オプトインで短期的なフォローアップメモリです。OpenClaw はこれを隠れたバックグラウンド処理で推論し、同じエージェントとチャンネルにスコープし、期限が来た確認を Heartbeat 経由で届けます。明示的なリマインダーには引き続き[スケジュール済みタスク](/ja-JP/automation/cron-jobs)を使います。

## メモリツール

エージェントには、メモリを扱うためのツールが 2 つあります。

- **`memory_search`** — 元の表現と文言が異なる場合でも、セマンティック検索を使って関連するノートを見つけます。
- **`memory_get`** — 特定のメモリファイルまたは行範囲を読み取ります。

どちらのツールも、アクティブなメモリPlugin（デフォルト: `memory-core`）によって提供されます。

## Memory Wiki コンパニオンPlugin

永続メモリを単なる生ノートではなく、保守されたナレッジベースのように振る舞わせたい場合は、バンドルされている `memory-wiki` Pluginを使います。

`memory-wiki` は、永続的な知識を次の要素を持つ Wiki Vault にコンパイルします。

- 決定論的なページ構造
- 構造化された主張と証拠
- 矛盾と鮮度の追跡
- 生成されたダッシュボード
- エージェント/ランタイム利用者向けのコンパイル済みダイジェスト
- `wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint` などの Wiki ネイティブツール

これはアクティブなメモリPluginを置き換えるものではありません。アクティブなメモリPluginは引き続き、想起、昇格、Dreaming を所有します。`memory-wiki` は、その横に来歴が豊富な知識層を追加します。

[Memory Wiki](/ja-JP/plugins/memory-wiki)を参照してください。

## メモリ検索

埋め込みプロバイダーが設定されている場合、`memory_search` は **ハイブリッド検索**を使います。これは、ベクトル類似度（意味的な近さ）とキーワードマッチング（ID やコードシンボルのような正確な語）を組み合わせるものです。対応プロバイダーの API キーがあれば、すぐに動作します。

<Info>
OpenClaw は、利用可能な API キーから埋め込みプロバイダーを自動検出します。OpenAI、Gemini、Voyage、Mistral のキーが設定されている場合、メモリ検索は自動的に有効になります。
</Info>

検索の仕組み、調整オプション、プロバイダー設定の詳細については、[メモリ検索](/ja-JP/concepts/memory-search)を参照してください。

## メモリバックエンド

<CardGroup cols={3}>
<Card title="組み込み（デフォルト）" icon="database" href="/ja-JP/concepts/memory-builtin">
SQLite ベースです。キーワード検索、ベクトル類似度、ハイブリッド検索を備え、すぐに動作します。追加の依存関係はありません。
</Card>
<Card title="QMD" icon="search" href="/ja-JP/concepts/memory-qmd">
再ランキング、クエリ拡張、ワークスペース外のディレクトリをインデックス化する機能を備えた、ローカル優先のサイドカーです。
</Card>
<Card title="Honcho" icon="brain" href="/ja-JP/concepts/memory-honcho">
ユーザーモデリング、セマンティック検索、マルチエージェント認識を備えた、AI ネイティブなクロスセッションメモリです。Plugin インストールです。
</Card>
<Card title="LanceDB" icon="layers" href="/ja-JP/plugins/memory-lancedb">
OpenAI 互換の埋め込み、自動想起、自動キャプチャ、ローカル Ollama 埋め込み対応を備えた、バンドル済みの LanceDB バックエンドメモリです。
</Card>
</CardGroup>

## ナレッジ Wiki 層

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/ja-JP/plugins/memory-wiki">
主張、ダッシュボード、ブリッジモード、Obsidian に適したワークフローを備えた、来歴が豊富な Wiki Vault に永続メモリをコンパイルします。
</Card>
</CardGroup>

## 自動メモリフラッシュ

[Compaction](/ja-JP/concepts/compaction) が会話を要約する前に、OpenClaw は重要なコンテキストをメモリファイルに保存するようエージェントに促すサイレントターンを実行します。これはデフォルトで有効です。何も設定する必要はありません。

そのハウスキーピングターンをローカルモデルで実行し続けるには、正確なメモリフラッシュモデルのオーバーライドを設定します。

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

このオーバーライドはメモリフラッシュターンにのみ適用され、アクティブセッションのフォールバックチェーンを継承しません。

<Tip>
メモリフラッシュは、Compaction 中のコンテキスト損失を防ぎます。エージェントが会話内に、まだファイルへ書き込まれていない重要な事実を持っている場合、要約が行われる前に自動的に保存されます。
</Tip>

## Dreaming

Dreaming は、メモリのための任意のバックグラウンド統合処理です。短期的なシグナルを収集し、候補をスコアリングし、条件を満たした項目だけを長期メモリ（`MEMORY.md`）に昇格します。

長期メモリのシグナル品質を高く保つよう設計されています。

- **オプトイン**: デフォルトでは無効です。
- **スケジュール済み**: 有効にすると、`memory-core` が完全な Dreaming スイープ用に 1 つの繰り返し Cron ジョブを自動管理します。
- **しきい値付き**: 昇格は、スコア、想起頻度、クエリ多様性のゲートを通過する必要があります。
- **レビュー可能**: フェーズ概要と日誌項目は、人間によるレビューのため `DREAMS.md` に書き込まれます。

フェーズ動作、スコアリングシグナル、Dream Diary の詳細については、[Dreaming](/ja-JP/concepts/dreaming)を参照してください。

## 根拠付きバックフィルとライブ昇格

Dreaming システムには、現在 2 つの密接に関連するレビューレーンがあります。

- **ライブ Dreaming** は、`memory/.dreams/` 配下の短期 Dreaming ストアを使います。通常のディープフェーズが何を `MEMORY.md` に昇格できるかを判断するときに使うものです。
- **根拠付きバックフィル** は、履歴の `memory/YYYY-MM-DD.md` ノートを独立した日次ファイルとして読み取り、構造化されたレビュー出力を `DREAMS.md` に書き込みます。

根拠付きバックフィルは、古いノートを再生し、`MEMORY.md` を手動編集せずに、システムが何を永続的だと判断するかを確認したい場合に役立ちます。

次を使う場合:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

根拠付きの永続候補は直接昇格されません。通常のディープフェーズがすでに使っているものと同じ短期 Dreaming ストアにステージングされます。つまり:

- `DREAMS.md` は人間向けのレビュー面のままです。
- 短期ストアは機械向けのランキング面のままです。
- `MEMORY.md` は引き続きディープ昇格によってのみ書き込まれます。

再生が有用でなかったと判断した場合は、通常の日誌項目や通常の想起状態に触れずに、ステージングされた成果物を削除できます。

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # インデックス状態とプロバイダーを確認する
openclaw memory search "query"  # コマンドラインから検索する
openclaw memory index --force   # インデックスを再構築する
```

## 関連資料

- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin): デフォルトの SQLite バックエンド。
- [QMD メモリエンジン](/ja-JP/concepts/memory-qmd): 高度なローカル優先サイドカー。
- [Honcho メモリ](/ja-JP/concepts/memory-honcho): AI ネイティブなクロスセッションメモリ。
- [Memory LanceDB](/ja-JP/plugins/memory-lancedb): OpenAI 互換の埋め込みを備えた LanceDB バックエンドPlugin。
- [Memory Wiki](/ja-JP/plugins/memory-wiki): コンパイル済みナレッジ Vault と Wiki ネイティブツール。
- [メモリ検索](/ja-JP/concepts/memory-search): 検索パイプライン、プロバイダー、調整。
- [Dreaming](/ja-JP/concepts/dreaming): 短期想起から長期メモリへのバックグラウンド昇格。
- [メモリ設定リファレンス](/ja-JP/reference/memory-config): すべての設定項目。
- [Compaction](/ja-JP/concepts/compaction): Compaction がメモリとどのように相互作用するか。

## 関連

- [Active Memory](/ja-JP/concepts/active-memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [Honcho メモリ](/ja-JP/concepts/memory-honcho)
- [Memory LanceDB](/ja-JP/plugins/memory-lancedb)
- [コミットメント](/ja-JP/concepts/commitments)
