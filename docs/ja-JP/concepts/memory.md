---
read_when:
    - メモリの仕組みを理解したい
    - どのメモリファイルを書き込むべきかを知りたい
summary: OpenClaw がセッションをまたいで情報を記憶する仕組み
title: メモリの概要
x-i18n:
    generated_at: "2026-06-27T11:10:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw は、エージェントのワークスペースに **プレーンな Markdown ファイル**を書き込むことで物事を記憶します。モデルが「記憶」するのはディスクに保存されたものだけです。隠れた状態はありません。

## 仕組み

エージェントには、メモリ関連のファイルが 3 つあります。

- **`MEMORY.md`** — 長期メモリ。永続的な事実、好み、判断。すべての DM セッション開始時に読み込まれます。
- **`memory/YYYY-MM-DD.md`**（または **`memory/YYYY-MM-DD-<slug>.md`**）— 日次メモ。
  実行中のコンテキストと観察内容。今日と昨日のメモは自動的に読み込まれ、`/new` または `/reset` でバンドルされたセッションメモリフックが書き込むような slug 付きの派生ファイルも、日付のみのファイルとあわせて取得されるようになりました。
- **`DREAMS.md`**（任意）— 人間によるレビュー用の Dream Diary と dreaming スイープの要約。根拠付きの履歴バックフィルエントリも含みます。

これらのファイルはエージェントワークスペース（デフォルトは `~/.openclaw/workspace`）にあります。

## 何をどこに置くか

`MEMORY.md` は、コンパクトで整理されたレイヤーです。永続的な事実、好み、継続的な判断、メインのプライベートセッション開始時に利用できるべき短い要約に使います。生のトランスクリプト、日次ログ、網羅的なアーカイブを置くためのものではありません。

`memory/YYYY-MM-DD.md` ファイルは作業用レイヤーです。詳細な日次メモ、観察内容、セッション要約、後でまだ役立つ可能性がある生のコンテキストに使います。これらのファイルは `memory_search` と `memory_get` のためにインデックスされますが、通常のブートストラッププロンプトに毎ターン注入されるわけではありません。

時間が経つにつれて、エージェントは日次メモから有用な内容を `MEMORY.md` に抽出し、古くなった長期エントリを削除することが期待されます。生成されたワークスペース指示と Heartbeat フローはこれを定期的に実行できます。記憶された詳細ごとに `MEMORY.md` を手動で編集する必要はありません。

`MEMORY.md` がブートストラップファイル予算を超えて大きくなると、OpenClaw はディスク上のファイルをそのまま保持しますが、モデルコンテキストに注入されるコピーを切り詰めます。これは、詳細な内容を `memory/*.md` に戻し、`MEMORY.md` には永続的な要約だけを残すか、プロンプト予算を明示的に多く使いたい場合はブートストラップ上限を引き上げる合図として扱ってください。生のサイズと注入サイズ、切り詰め状態を確認するには、`/context list`、`/context detail`、または `openclaw doctor` を使います。

<Tip>
エージェントに何かを覚えてほしい場合は、そのまま頼んでください。「TypeScript が好みだと覚えておいて」のように言えば、適切なファイルに書き込みます。
</Tip>

## アクションに影響するメモリ

ほとんどのメモリは通常の Markdown メモとして書けます。ただし、一部のメモリはエージェントが後で何をすべきかに影響します。その場合は、事実そのものだけでなく、そのメモに基づいて行動してよい条件も記録します。

次のような内容を含むメモでは、そのアクション境界を記録してください。

- 承認または許可の要件、
- 一時的な制約、
- 別のセッション、スレッド、または人物への引き継ぎ、
- 失効条件、
- 行動してよいタイミング、
- ソースまたは所有者の権限、
- 誘惑されやすい行動を避けるための指示。

有用なアクションに影響するメモリは、次を明確にします。

- 将来の振る舞いを何が変えるのか、
- いつ、またはどの条件下で適用されるのか、
- いつ失効するのか、または何が行動を解禁するのか、
- エージェントが何を避けるべきか、
- 信頼性や権限に影響する場合、そのソースまたは所有者は誰か。

メモリは承認コンテキストを保持できますが、ポリシーを強制するものではありません。強い運用制御には、OpenClaw の承認設定、サンドボックス化、スケジュールされたタスクを使ってください。

例:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

別の例:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

推論された短命のフォローアップには [コミットメント](/ja-JP/concepts/commitments) を使います。正確なリマインダー、時刻指定のチェック、繰り返し作業には [スケジュールされたタスク](/ja-JP/automation/cron-jobs) を使います。メモリはどちらの経路についても、周辺の永続的なコンテキストを要約できます。

これはすべてのメモリに必須のスキーマではありません。単純な事実は簡潔なままでかまいません。タイミング、権限、失効、または行動してよいコンテキストを失うことで、後でエージェントが誤った行動をする可能性がある場合に、アクションに影響する境界を使ってください。

## 推論されたコミットメント

将来のフォローアップの中には、永続的な事実ではないものがあります。明日の面接に触れた場合、有用なメモリは「面接後に確認する」であって、「これを `MEMORY.md` に永久保存する」ではないかもしれません。

[コミットメント](/ja-JP/concepts/commitments) は、このケースのためのオプトインの短命フォローアップメモリです。OpenClaw は隠れたバックグラウンドパスでそれらを推論し、同じエージェントとチャネルにスコープし、期限が来た確認を Heartbeat 経由で届けます。明示的なリマインダーには引き続き [スケジュールされたタスク](/ja-JP/automation/cron-jobs) を使います。

## メモリツール

エージェントには、メモリを扱うためのツールが 2 つあります。

- **`memory_search`** — 元の表現と異なる場合でも、セマンティック検索を使って関連するメモを見つけます。
- **`memory_get`** — 特定のメモリファイルまたは行範囲を読み取ります。

どちらのツールも Active Memory Plugin（デフォルト: `memory-core`）によって提供されます。

## Memory Wiki companion Plugin

永続メモリを単なる生メモではなく、保守されたナレッジベースのように扱いたい場合は、バンドルされた `memory-wiki` Plugin を使います。

`memory-wiki` は、永続的な知識を次の要素を備えた wiki vault にコンパイルします。

- 決定論的なページ構造
- 構造化された主張と証拠
- 矛盾と鮮度の追跡
- 生成されたダッシュボード
- エージェント/ランタイム利用者向けのコンパイル済みダイジェスト
- `wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint` のような wiki ネイティブツール

これは Active Memory Plugin を置き換えるものではありません。Active Memory Plugin は引き続きリコール、昇格、dreaming を所有します。`memory-wiki` は、その横に来歴の豊富な知識レイヤーを追加します。

[Memory Wiki](/ja-JP/plugins/memory-wiki) を参照してください。

## メモリ検索

埋め込みプロバイダーが設定されている場合、`memory_search` は **ハイブリッド検索**を使います。ベクトル類似度（意味的な近さ）とキーワードマッチング（ID やコードシンボルのような完全一致語）を組み合わせます。サポートされる任意のプロバイダーの API キーがあれば、すぐに動作します。

<Info>
OpenClaw はデフォルトで OpenAI embeddings を使います。Gemini、Voyage、Mistral、local、Ollama、Bedrock、GitHub Copilot、または OpenAI 互換 embeddings を使うには、`agents.defaults.memorySearch.provider` を明示的に設定してください。
</Info>

検索の仕組み、チューニングオプション、プロバイダー設定の詳細については、[メモリ検索](/ja-JP/concepts/memory-search) を参照してください。

## メモリバックエンド

<CardGroup cols={3}>
<Card title="組み込み（デフォルト）" icon="database" href="/ja-JP/concepts/memory-builtin">
SQLite ベース。キーワード検索、ベクトル類似度、ハイブリッド検索ですぐに動作します。追加の依存関係はありません。
</Card>
<Card title="QMD" icon="search" href="/ja-JP/concepts/memory-qmd">
再ランキング、クエリ拡張、ワークスペース外のディレクトリをインデックスする機能を備えた、local-first のサイドカーです。
</Card>
<Card title="Honcho" icon="brain" href="/ja-JP/concepts/memory-honcho">
ユーザーモデリング、セマンティック検索、マルチエージェント認識を備えた、AI ネイティブのクロスセッションメモリです。Plugin インストールです。
</Card>
<Card title="LanceDB" icon="layers" href="/ja-JP/plugins/memory-lancedb">
OpenAI 互換 embeddings、自動リコール、自動キャプチャ、ローカル Ollama embedding サポートを備えた、バンドル済みの LanceDB バックエンドメモリです。
</Card>
</CardGroup>

## ナレッジ wiki レイヤー

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/ja-JP/plugins/memory-wiki">
主張、ダッシュボード、ブリッジモード、Obsidian 向けワークフローを備えた、来歴の豊富な wiki vault に永続メモリをコンパイルします。
</Card>
</CardGroup>

## 自動メモリフラッシュ

[Compaction](/ja-JP/concepts/compaction) が会話を要約する前に、OpenClaw はエージェントに重要なコンテキストをメモリファイルへ保存するよう促すサイレントターンを実行します。これはデフォルトで有効です。何も設定する必要はありません。

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

このオーバーライドはメモリフラッシュターンにのみ適用され、アクティブセッションのフォールバックチェーンは継承しません。

<Tip>
メモリフラッシュは Compaction 中のコンテキスト損失を防ぎます。会話内に、まだファイルへ書き込まれていない重要な事実がある場合、要約が行われる前に自動的に保存されます。
</Tip>

## Dreaming

Dreaming は、メモリのための任意のバックグラウンド統合パスです。短期シグナルを収集し、候補をスコアリングし、条件を満たした項目だけを長期メモリ（`MEMORY.md`）へ昇格します。

長期メモリを高シグナルに保つよう設計されています。

- **オプトイン**: デフォルトでは無効です。
- **スケジュール**: 有効にすると、`memory-core` が完全な dreaming スイープのために 1 つの繰り返し Cron ジョブを自動管理します。
- **しきい値付き**: 昇格は、スコア、リコール頻度、クエリ多様性のゲートを通過する必要があります。
- **レビュー可能**: フェーズ要約と日記エントリは、人間によるレビューのために `DREAMS.md` に書き込まれます。

フェーズの振る舞い、スコアリングシグナル、Dream Diary の詳細については、[Dreaming](/ja-JP/concepts/dreaming) を参照してください。

## 根拠付きバックフィルとライブ昇格

dreaming システムには、密接に関連する 2 つのレビュー経路があります。

- **ライブ dreaming** は `memory/.dreams/` 配下の短期 dreaming ストアを扱い、通常の deep フェーズが何を `MEMORY.md` に昇格できるかを判断するときに使うものです。
- **根拠付きバックフィル** は、履歴の `memory/YYYY-MM-DD.md` メモを独立した日次ファイルとして読み取り、構造化されたレビュー出力を `DREAMS.md` に書き込みます。

根拠付きバックフィルは、古いメモを再生し、`MEMORY.md` を手動で編集せずに、システムが何を永続的だと判断するかを確認したい場合に役立ちます。

次を使うと:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

根拠付きの永続候補は直接昇格されません。通常の deep フェーズがすでに使っている同じ短期 dreaming ストアにステージングされます。つまり、次のようになります。

- `DREAMS.md` は人間向けのレビュー面のままです。
- 短期ストアは機械向けのランキング面のままです。
- `MEMORY.md` は引き続き deep 昇格によってのみ書き込まれます。

再生が有用ではなかったと判断した場合は、通常の日記エントリや通常のリコール状態に触れずに、ステージングされた成果物を削除できます。

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## 参考資料

- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin): デフォルトの SQLite バックエンド。
- [QMD メモリエンジン](/ja-JP/concepts/memory-qmd): 高度な local-first サイドカー。
- [Honcho メモリ](/ja-JP/concepts/memory-honcho): AI ネイティブのクロスセッションメモリ。
- [Memory LanceDB](/ja-JP/plugins/memory-lancedb): OpenAI 互換 embeddings を備えた LanceDB バックエンド Plugin。
- [Memory Wiki](/ja-JP/plugins/memory-wiki): コンパイル済みナレッジ vault と wiki ネイティブツール。
- [メモリ検索](/ja-JP/concepts/memory-search): 検索パイプライン、プロバイダー、チューニング。
- [Dreaming](/ja-JP/concepts/dreaming): 短期リコールから長期メモリへのバックグラウンド昇格。
- [メモリ設定リファレンス](/ja-JP/reference/memory-config): すべての設定ノブ。
- [Compaction](/ja-JP/concepts/compaction): Compaction がメモリとどのように相互作用するか。

## 関連

- [Active Memory](/ja-JP/concepts/active-memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [Honcho メモリ](/ja-JP/concepts/memory-honcho)
- [Memory LanceDB](/ja-JP/plugins/memory-lancedb)
- [コミットメント](/ja-JP/concepts/commitments)
