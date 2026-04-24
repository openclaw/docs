---
read_when:
    - Memory がどのように機能するかを理解したい場合
    - どの memory ファイルに書くべきかを知りたい場合
summary: OpenClaw がセッションをまたいで物事を記憶する方法
title: Memory の概要
x-i18n:
    generated_at: "2026-04-24T04:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw は、エージェントの
workspace に**プレーンな Markdown ファイル**を書き込むことで物事を記憶します。モデルが「記憶」するのはディスクに保存された内容だけであり、隠れた状態はありません。

## 仕組み

あなたのエージェントには、memory 関連のファイルが 3 つあります。

- **`MEMORY.md`** -- 長期 memory。耐久的な事実、好み、決定事項。すべての DM セッション開始時に読み込まれます。
- **`memory/YYYY-MM-DD.md`** -- 日次ノート。進行中のコンテキストと観察。今日と昨日のノートが自動的に読み込まれます。
- **`DREAMS.md`**（任意）-- 人間が確認するための Dream Diary と Dreaming スイープ
  サマリー。根拠付きの履歴バックフィルエントリーも含みます。

これらのファイルはエージェント workspace（デフォルト `~/.openclaw/workspace`）に置かれます。

<Tip>
エージェントに何かを覚えてほしい場合は、ただ「TypeScript を好むことを覚えておいて」と頼んでください。適切なファイルに書き込まれます。
</Tip>

## Memory tools

エージェントには、memory を扱うための 2 つの tool があります。

- **`memory_search`** -- 元の表現と異なる場合でも、セマンティック検索を使って関連ノートを見つけます。
- **`memory_get`** -- 特定の memory ファイルまたは行範囲を読み取ります。

どちらの tool も、アクティブな memory Plugin（デフォルト: `memory-core`）によって提供されます。

## Memory Wiki コンパニオン Plugin

耐久 memory を単なる生のノートではなく、保守されるナレッジベースのように扱いたい場合は、同梱の `memory-wiki` Plugin を使ってください。

`memory-wiki` は、耐久 knowledge を次のような wiki vault にコンパイルします。

- 決定論的なページ構造
- 構造化された主張と証拠
- 矛盾と鮮度の追跡
- 生成されるダッシュボード
- エージェント/ランタイム利用者向けのコンパイル済みダイジェスト
- `wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint` などの wiki ネイティブ tools

これはアクティブな memory Plugin を置き換えるものではありません。アクティブな memory Plugin は引き続き recall、promotion、Dreaming を担当します。`memory-wiki` は、その横に来歴の豊かな knowledge レイヤーを追加します。

[Memory Wiki](/ja-JP/plugins/memory-wiki) を参照してください。

## Memory search

embedding プロバイダーが設定されている場合、`memory_search` は**ハイブリッド
検索**を使います。これは、ベクトル類似度（意味的な意味）とキーワード一致
（ID やコードシンボルなどの正確な語）を組み合わせるものです。サポートされている任意のプロバイダーの API キーがあれば、追加設定なしで動作します。

<Info>
OpenClaw は、利用可能な API キーから embedding プロバイダーを自動検出します。OpenAI、Gemini、Voyage、または Mistral のキーが設定されていれば、memory search は自動的に有効になります。
</Info>

検索の仕組み、調整オプション、プロバイダー設定の詳細については、
[Memory Search](/ja-JP/concepts/memory-search) を参照してください。

## Memory バックエンド

<CardGroup cols={3}>
<Card title="組み込み（デフォルト）" icon="database" href="/ja-JP/concepts/memory-builtin">
SQLite ベース。キーワード検索、ベクトル類似度、ハイブリッド検索がそのまま使えます。
追加の依存関係は不要です。
</Card>
<Card title="QMD" icon="search" href="/ja-JP/concepts/memory-qmd">
ローカルファーストの sidecar。再ランキング、クエリ拡張、workspace 外の
ディレクトリをインデックスする機能を備えます。
</Card>
<Card title="Honcho" icon="brain" href="/ja-JP/concepts/memory-honcho">
AI ネイティブなクロスセッション memory。ユーザーモデリング、セマンティック検索、
マルチエージェント認識を備えます。Plugin のインストールが必要です。
</Card>
</CardGroup>

## Knowledge wiki レイヤー

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/ja-JP/plugins/memory-wiki">
耐久 memory を、主張、ダッシュボード、bridge モード、Obsidian 対応ワークフローを備えた来歴豊富な wiki vault にコンパイルします。
</Card>
</CardGroup>

## 自動 memory flush

[Compaction](/ja-JP/concepts/compaction) が会話を要約する前に、OpenClaw は
重要なコンテキストを memory ファイルに保存するようエージェントに通知するサイレントターンを実行します。これはデフォルトでオンなので、何も設定する必要はありません。

<Tip>
memory flush は、Compaction 中のコンテキスト喪失を防ぎます。会話に重要な事実があり、まだファイルに書かれていない場合は、要約が行われる前に自動的に保存されます。
</Tip>

## Dreaming

Dreaming は、memory 用の任意のバックグラウンド統合パスです。短期シグナルを収集し、候補にスコアを付け、条件を満たした項目だけを長期 memory（`MEMORY.md`）に昇格させます。

これは、長期 memory を高シグナルに保つよう設計されています。

- **オプトイン**: デフォルトで無効。
- **スケジュール実行**: 有効にすると、`memory-core` は完全な Dreaming スイープ用の繰り返し Cron ジョブを 1 つ自動管理します。
- **閾値ベース**: 昇格は、スコア、recall 頻度、クエリ多様性のゲートを通過する必要があります。
- **レビュー可能**: フェーズサマリーと日記エントリーは、人間の確認用に `DREAMS.md` に書き込まれます。

フェーズ動作、スコアリングシグナル、Dream Diary の詳細については、
[Dreaming](/ja-JP/concepts/dreaming) を参照してください。

## 根拠付きバックフィルとライブ昇格

Dreaming システムには現在、密接に関連する 2 つのレビュー経路があります。

- **ライブ Dreaming** は `memory/.dreams/` 配下の短期 Dreaming ストアから動作し、通常の deep フェーズが `MEMORY.md` に昇格できる内容を判断する際に使うものです。
- **根拠付きバックフィル** は、履歴の `memory/YYYY-MM-DD.md` ノートを独立した日次ファイルとして読み取り、構造化されたレビュー出力を `DREAMS.md` に書き込みます。

根拠付きバックフィルは、古いノートを再生し、`MEMORY.md` を手動で編集せずに、システムが何を耐久的だと判断するか確認したい場合に便利です。

次を使うと:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

根拠付きの耐久候補は直接昇格されません。代わりに、通常の deep フェーズがすでに使っているのと同じ短期 Dreaming ストアにステージされます。つまり:

- `DREAMS.md` は人間向けのレビュー画面のままです。
- 短期ストアはマシン向けのランキング画面のままです。
- `MEMORY.md` への書き込みは引き続き deep promotion のみが行います。

リプレイが有用でなかったと判断した場合は、通常の日記エントリーや通常の recall 状態に触れずに、ステージされたアーティファクトを削除できます。

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # インデックス状態とプロバイダーを確認
openclaw memory search "query"  # コマンドラインから検索
openclaw memory index --force   # インデックスを再構築
```

## さらに読む

- [組み込み Memory Engine](/ja-JP/concepts/memory-builtin) -- デフォルトの SQLite バックエンド
- [QMD Memory Engine](/ja-JP/concepts/memory-qmd) -- 高度なローカルファースト sidecar
- [Honcho Memory](/ja-JP/concepts/memory-honcho) -- AI ネイティブなクロスセッション memory
- [Memory Wiki](/ja-JP/plugins/memory-wiki) -- コンパイル済み knowledge vault と wiki ネイティブ tools
- [Memory Search](/ja-JP/concepts/memory-search) -- 検索パイプライン、プロバイダー、調整
- [Dreaming](/ja-JP/concepts/dreaming) -- 短期 recall から長期 memory へのバックグラウンド昇格
- [Memory 設定リファレンス](/ja-JP/reference/memory-config) -- すべての設定項目
- [Compaction](/ja-JP/concepts/compaction) -- Compaction が memory とどう連携するか

## 関連

- [Active Memory](/ja-JP/concepts/active-memory)
- [Memory search](/ja-JP/concepts/memory-search)
- [組み込み memory engine](/ja-JP/concepts/memory-builtin)
- [Honcho memory](/ja-JP/concepts/memory-honcho)
