---
read_when:
    - メモリの仕組みを理解したい
    - どのメモリファイルに書き込むべきかを知りたい
summary: OpenClaw がセッションをまたいで情報を記憶する仕組み
title: メモリの概要
x-i18n:
    generated_at: "2026-04-30T05:08:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw は、エージェントのワークスペースに **プレーンな Markdown ファイル**を書き込むことで物事を記憶します。モデルが「記憶」するのはディスクに保存された内容だけです。隠れた状態はありません。

## 仕組み

エージェントにはメモリ関連のファイルが 3 つあります。

- **`MEMORY.md`** — 長期メモリ。永続的な事実、好み、意思決定。すべての DM セッションの開始時に読み込まれます。
- **`memory/YYYY-MM-DD.md`** — 日次ノート。進行中のコンテキストと観察事項。今日と昨日のノートは自動的に読み込まれます。
- **`DREAMS.md`**（任意）— Dream Diary と Dreaming スイープの概要。根拠付きの過去補完エントリを含め、人間によるレビュー用です。

これらのファイルはエージェントワークスペース（デフォルトは `~/.openclaw/workspace`）にあります。

<Tip>
エージェントに何かを記憶させたい場合は、そのまま頼んでください。「TypeScript を好むことを覚えておいて。」と伝えれば、適切なファイルに書き込みます。
</Tip>

## 推定されたコミットメント

将来のフォローアップの中には、永続的な事実ではないものがあります。明日の面接について触れた場合、有用なメモリは「面接後に確認する」であり、「これを `MEMORY.md` に永久保存する」ではないかもしれません。

[コミットメント](/ja-JP/concepts/commitments)は、このケースに対応するオプトインの短期的なフォローアップメモリです。OpenClaw は隠れたバックグラウンドパスでそれらを推定し、同じエージェントとチャネルにスコープし、期限が来た確認を Heartbeat 経由で配信します。明示的なリマインダーは引き続き[スケジュール済みタスク](/ja-JP/automation/cron-jobs)を使用します。

## メモリツール

エージェントにはメモリを扱うためのツールが 2 つあります。

- **`memory_search`** — 元の表現と文言が異なる場合でも、セマンティック検索を使って関連するノートを見つけます。
- **`memory_get`** — 特定のメモリファイルまたは行範囲を読み取ります。

どちらのツールもアクティブメモリプラグイン（デフォルト: `memory-core`）によって提供されます。

## メモリ Wiki 連携プラグイン

永続メモリを単なる生のノートではなく、保守されたナレッジベースのように振る舞わせたい場合は、同梱の `memory-wiki` プラグインを使用してください。

`memory-wiki` は永続的な知識を Wiki ボールトにコンパイルし、次のものを提供します。

- 決定的なページ構造
- 構造化された主張と証拠
- 矛盾と鮮度の追跡
- 生成されたダッシュボード
- エージェント/ランタイム利用者向けのコンパイル済みダイジェスト
- `wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint` などの Wiki ネイティブツール

これはアクティブメモリプラグインを置き換えるものではありません。アクティブメモリプラグインは引き続き、想起、昇格、Dreaming を所有します。`memory-wiki` は、その横に来歴が豊富な知識レイヤーを追加します。

[Memory Wiki](/ja-JP/plugins/memory-wiki)を参照してください。

## メモリ検索

埋め込みプロバイダーが設定されている場合、`memory_search` は **ハイブリッド検索**を使用します。これはベクトル類似度（意味的な近さ）とキーワード一致（ID やコードシンボルのような正確な用語）を組み合わせるものです。対応している任意のプロバイダーの API キーがあれば、すぐに動作します。

<Info>
OpenClaw は利用可能な API キーから埋め込みプロバイダーを自動検出します。OpenAI、Gemini、Voyage、Mistral のいずれかのキーが設定されている場合、メモリ検索は自動的に有効になります。
</Info>

検索の仕組み、チューニングオプション、プロバイダー設定の詳細については、[メモリ検索](/ja-JP/concepts/memory-search)を参照してください。

## メモリバックエンド

<CardGroup cols={3}>
<Card title="組み込み（デフォルト）" icon="database" href="/ja-JP/concepts/memory-builtin">
SQLite ベース。キーワード検索、ベクトル類似度、ハイブリッド検索がすぐに使えます。追加の依存関係はありません。
</Card>
<Card title="QMD" icon="search" href="/ja-JP/concepts/memory-qmd">
再ランキング、クエリ展開、ワークスペース外のディレクトリをインデックスできるローカルファーストのサイドカーです。
</Card>
<Card title="Honcho" icon="brain" href="/ja-JP/concepts/memory-honcho">
ユーザーモデリング、セマンティック検索、マルチエージェント認識を備えた AI ネイティブなクロスセッションメモリです。プラグインとしてインストールします。
</Card>
<Card title="LanceDB" icon="layers" href="/ja-JP/plugins/memory-lancedb">
OpenAI 互換の埋め込み、自動想起、自動キャプチャ、ローカル Ollama 埋め込み対応を備えた、同梱の LanceDB バックエンドメモリです。
</Card>
</CardGroup>

## ナレッジ Wiki レイヤー

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/ja-JP/plugins/memory-wiki">
永続メモリを、主張、ダッシュボード、ブリッジモード、Obsidian フレンドリーなワークフローを備えた来歴豊富な Wiki ボールトにコンパイルします。
</Card>
</CardGroup>

## 自動メモリフラッシュ

[Compaction](/ja-JP/concepts/compaction) が会話を要約する前に、OpenClaw は重要なコンテキストをメモリファイルに保存するようエージェントに促すサイレントターンを実行します。これはデフォルトで有効です。設定は不要です。

そのハウスキーピングターンをローカルモデル上に維持するには、厳密なメモリフラッシュモデル上書きを設定します。

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

この上書きはメモリフラッシュターンにのみ適用され、アクティブセッションのフォールバックチェーンは継承しません。

<Tip>
メモリフラッシュは Compaction 中のコンテキスト損失を防ぎます。エージェントが会話内にまだファイルへ書き込まれていない重要な事実を持っている場合、要約が行われる前に自動的に保存されます。
</Tip>

## Dreaming

Dreaming は、メモリのための任意のバックグラウンド統合パスです。短期的なシグナルを収集し、候補をスコアリングし、条件を満たした項目だけを長期メモリ（`MEMORY.md`）に昇格します。

これは長期メモリのシグナル品質を高く保つように設計されています。

- **オプトイン**: デフォルトでは無効です。
- **スケジュール済み**: 有効にすると、`memory-core` は完全な Dreaming スイープ用の定期 Cron ジョブを 1 つ自動管理します。
- **しきい値付き**: 昇格は、スコア、想起頻度、クエリ多様性のゲートを通過する必要があります。
- **レビュー可能**: フェーズ概要とダイアリエントリは、人間によるレビュー用に `DREAMS.md` に書き込まれます。

フェーズの動作、スコアリングシグナル、Dream Diary の詳細については、[Dreaming](/ja-JP/concepts/dreaming)を参照してください。

## 根拠付き補完とライブ昇格

Dreaming システムには、密接に関連する 2 つのレビューレーンがあります。

- **ライブ Dreaming** は `memory/.dreams/` 配下の短期 Dreaming ストアを基に動作し、通常のディープフェーズが何を `MEMORY.md` に昇格できるかを判断するときに使用します。
- **根拠付き補完** は過去の `memory/YYYY-MM-DD.md` ノートを独立した日次ファイルとして読み取り、構造化されたレビュー出力を `DREAMS.md` に書き込みます。

根拠付き補完は、古いノートを再生し、`MEMORY.md` を手動編集せずに、システムが何を永続的だと考えるかを確認したい場合に便利です。

次を使用すると:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

根拠付きの永続候補は直接昇格されません。それらは、通常のディープフェーズがすでに使用している同じ短期 Dreaming ストアにステージングされます。つまり、次のようになります。

- `DREAMS.md` は人間向けレビュー面のままです。
- 短期ストアは機械向けランキング面のままです。
- `MEMORY.md` は引き続きディープ昇格によってのみ書き込まれます。

再生が有用でなかったと判断した場合は、通常のダイアリエントリや通常の想起状態に触れずに、ステージングされたアーティファクトを削除できます。

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # インデックスの状態とプロバイダーを確認
openclaw memory search "query"  # コマンドラインから検索
openclaw memory index --force   # インデックスを再構築
```

## 参考資料

- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin): デフォルトの SQLite バックエンド。
- [QMD メモリエンジン](/ja-JP/concepts/memory-qmd): 高度なローカルファーストサイドカー。
- [Honcho メモリ](/ja-JP/concepts/memory-honcho): AI ネイティブなクロスセッションメモリ。
- [Memory LanceDB](/ja-JP/plugins/memory-lancedb): OpenAI 互換の埋め込みを備えた LanceDB バックエンドのプラグイン。
- [Memory Wiki](/ja-JP/plugins/memory-wiki): コンパイル済みナレッジボールトと Wiki ネイティブツール。
- [メモリ検索](/ja-JP/concepts/memory-search): 検索パイプライン、プロバイダー、チューニング。
- [Dreaming](/ja-JP/concepts/dreaming): 短期想起から長期メモリへのバックグラウンド昇格。
- [メモリ設定リファレンス](/ja-JP/reference/memory-config): すべての設定ノブ。
- [Compaction](/ja-JP/concepts/compaction): Compaction がメモリとどのように相互作用するか。

## 関連

- [Active Memory](/ja-JP/concepts/active-memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [Honcho メモリ](/ja-JP/concepts/memory-honcho)
- [Memory LanceDB](/ja-JP/plugins/memory-lancedb)
- [コミットメント](/ja-JP/concepts/commitments)
