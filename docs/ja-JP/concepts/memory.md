---
read_when:
    - メモリの仕組みを理解したい
    - どのメモリファイルを書き込めばよいかを知りたい
summary: OpenClaw がセッションをまたいで物事を記憶する仕組み
title: Memory の概要
x-i18n:
    generated_at: "2026-07-05T11:13:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw は、エージェントの workspace（既定では `~/.openclaw/workspace`）にプレーンな Markdown ファイルを書き込むことで物事を記憶します。モデルが記憶するのはディスクに保存された内容だけで、隠れた状態はありません。

## 仕組み

エージェントには、メモリ関連のファイルが 3 つあります。

- **`MEMORY.md`** — 長期メモリ。永続的な事実、好み、決定事項。セッション開始時に読み込まれます。
- **`memory/YYYY-MM-DD.md`**（または `memory/YYYY-MM-DD-<slug>.md`）— 日次ノート。実行中のコンテキストと観察事項。素の `/new` または `/reset` では、今日と昨日の日付付きノートが自動的に読み込まれます。バンドルされた session-memory hook が書き込むような slug 付きのバリアントも、日付のみのファイルと一緒に取り込まれます。
- **`DREAMS.md`**（任意）— 人間のレビュー向けの Dream Diary と dreaming sweep の要約。根拠付きの履歴バックフィルエントリも含みます。

<Tip>
エージェントに何かを記憶させたい場合は、単に「TypeScript を好むことを覚えておいて」と頼んでください。エージェントは適切なファイルにそのメモを書き込みます。
</Tip>

## 何をどこに置くか

`MEMORY.md` は、コンパクトで整理された層です。永続的な事実、好み、継続的な決定事項、セッション開始時に利用できるべき短い要約を置きます。これは生のトランスクリプト、日次ログ、網羅的なアーカイブではありません。

`memory/YYYY-MM-DD.md` ファイルは作業層です。詳細な日次ノート、観察事項、セッション要約、後でまだ役立つ可能性がある生のコンテキストを置きます。これらは `memory_search` と `memory_get` のためにインデックス化されますが、毎ターンの bootstrap プロンプトには注入されません。

時間が経つにつれて、エージェントは日次ノートから有用な材料を `MEMORY.md` に抽出し、古くなった長期エントリを削除します。生成された workspace 指示と heartbeat フローがこれを定期的に行うため、すべての詳細について `MEMORY.md` を手動編集する必要はありません。

`MEMORY.md` が bootstrap ファイルの予算を超えると、OpenClaw はディスク上のファイルをそのまま保持しますが、コンテキストに注入されるコピーは切り詰めます。これは、詳細な材料を `memory/*.md` に移し、`MEMORY.md` には永続的な要約だけを残すか、より多くのプロンプト予算を使いたい場合は bootstrap 制限を引き上げる合図として扱ってください。生のサイズと注入後のサイズ、切り詰め状態を確認するには、`/context list`、`/context detail`、または `openclaw doctor` を使います。

## アクションに敏感なメモリ

ほとんどのメモリは通常の Markdown ノートです。一部は、エージェントが後で何をすべきかに影響します。そのような場合は、事実そのものだけでなく、そのノートに基づいて行動して安全なタイミングも記録します。

ノートに次が関わる場合は、そのアクション境界を記録します。

- 承認または許可の要件、
- 一時的な制約、
- 別のセッション、スレッド、または人への引き継ぎ、
- 失効条件、
- 行動して安全なタイミング、
- ソースまたは所有者の権限、
- 誘惑されやすい行動を避けるための指示。

有用なアクションに敏感なメモリは、次を明確にします。

- 将来の挙動を変えるもの、
- それが適用されるタイミングまたは条件、
- それが失効するタイミング、またはアクションを解禁するもの、
- エージェントが避けるべきこと、
- 信頼や権限に影響する場合、そのソースまたは所有者。

メモリは承認コンテキストを保持できますが、ポリシーを強制するものではありません。強い運用制御には、OpenClaw の承認設定、サンドボックス化、スケジュール済みタスクを使います。

例:

```md
The API migration is being designed in another session. Future turns should
not edit the API implementation from this thread; use findings here only as
design input until the migration plan lands.
```

別の例:

```md
A report from an untrusted source needs review before promotion. Future turns
should treat it as evidence only; do not store it as durable memory until a
trusted reviewer confirms the contents.
```

これはすべてのメモリに必須のスキーマではありません。単純な事実は簡潔なままで構いません。タイミング、権限、失効、行動して安全なコンテキストが失われると、後でエージェントが誤った行動を取る可能性がある場合に、アクションに敏感な境界を使います。

推論された短期のフォローアップには [commitments](/ja-JP/concepts/commitments) を使います。正確なリマインダー、時間指定のチェック、反復作業には [scheduled tasks](/ja-JP/automation/cron-jobs) を使います。メモリは、どちらの経路についても周辺の永続的なコンテキストを要約できます。

## 推論された commitments

将来のフォローアップの中には、永続的な事実ではないものがあります。明日の面接に言及した場合、有用なメモリは「面接後に確認する」であり、「これを永遠に `MEMORY.md` に保存する」ではないかもしれません。

[Commitments](/ja-JP/concepts/commitments) は、そのような場合のためのオプトインの短期フォローアップメモリです。OpenClaw は隠れたバックグラウンドパスでそれらを推論し、同じエージェントとチャネルにスコープし、heartbeat を通じて期限が来た確認を届けます。明示的なリマインダーは引き続き [scheduled tasks](/ja-JP/automation/cron-jobs) を使います。

## メモリツール

エージェントには、メモリを扱うためのツールが 2 つあります。

- **`memory_search`** — 元の表現と異なる場合でも、セマンティック検索を使って関連するノートを見つけます。
- **`memory_get`** — 特定のメモリファイルまたは行範囲を読みます。

どちらのツールも active memory plugin（既定: `memory-core`）によって提供されます。

## メモリ検索

埋め込みプロバイダーが設定されている場合、`memory_search` はハイブリッド検索を使います。ベクトル類似度（意味的な意味）とキーワード一致（ID やコードシンボルのような完全一致語）を組み合わせます。これは、サポートされている任意のプロバイダーの API キーがあれば、そのまま動作します。

<Info>
OpenClaw は既定で OpenAI embeddings を使います。Gemini、Voyage、Mistral、Bedrock、DeepInfra、ローカル GGUF、Ollama、LM Studio、GitHub Copilot、または汎用の OpenAI 互換エンドポイントを使うには、`agents.defaults.memorySearch.provider` を明示的に設定します。
</Info>

検索の仕組み、調整オプション、プロバイダー設定については、[メモリ検索](/ja-JP/concepts/memory-search) を参照してください。

## メモリバックエンド

<CardGroup cols={3}>
<Card title="組み込み（既定）" icon="database" href="/ja-JP/concepts/memory-builtin">
SQLite ベース。キーワード検索、ベクトル類似度、ハイブリッド検索がそのまま動作します。追加の依存関係はありません。
</Card>
<Card title="QMD" icon="search" href="/ja-JP/concepts/memory-qmd">
リランキング、クエリ拡張、workspace 外のディレクトリをインデックス化する機能を備えたローカルファーストのサイドカーです。
</Card>
<Card title="Honcho" icon="brain" href="/ja-JP/concepts/memory-honcho">
ユーザーモデリング、セマンティック検索、マルチエージェント認識を備えた AI ネイティブなクロスセッションメモリです。Plugin install。
</Card>
<Card title="LanceDB" icon="layers" href="/ja-JP/plugins/memory-lancedb">
OpenAI 互換 embeddings、自動リコール、自動キャプチャ、ローカル Ollama 埋め込みサポートを備えた LanceDB バックエンドのメモリです。Plugin install。
</Card>
</CardGroup>

## ナレッジ wiki 層

永続メモリを生のノートではなく、保守されたナレッジベースのように振る舞わせたい場合は、バンドルされた `memory-wiki` plugin を使います。これは、永続的な知識を、決定的なページ構造、構造化された主張と証拠、矛盾と鮮度の追跡、生成されたダッシュボード、コンパイル済み digest、wiki ネイティブツール（`wiki_status`、`wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint`）を備えた wiki vault にコンパイルします。

`memory-wiki` は active memory plugin を置き換えるものではありません。active memory plugin は引き続き recall、promotion、dreaming を所有します。`memory-wiki` は、その横に provenance に富んだナレッジ層を追加します。

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/ja-JP/plugins/memory-wiki">
永続メモリを、主張、ダッシュボード、bridge mode、Obsidian に適したワークフローを備えた provenance に富んだ wiki vault にコンパイルします。
</Card>
</CardGroup>

## 自動メモリフラッシュ

[Compaction](/ja-JP/concepts/compaction) が会話を要約する前に、OpenClaw はエージェントに重要なコンテキストをメモリファイルへ保存するよう促すサイレントターンを実行します。これは既定で有効です。無効にするには `agents.defaults.compaction.memoryFlush.enabled: false` を設定します。

その housekeeping ターンをローカルモデルで維持するには、memory-flush ターンにのみ適用される正確なオーバーライドを設定します（アクティブセッションのモデル fallback chain は継承しません）。

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

<Tip>
メモリフラッシュは、Compaction 中のコンテキスト喪失を防ぎます。エージェントが、まだファイルに書かれていない重要な事実を会話内に持っている場合、要約が行われる前にそれらは自動的に保存されます。
</Tip>

## Dreaming

Dreaming は、メモリのための任意のバックグラウンド統合パスです。短期リコールシグナルを収集し、候補をスコアリングし、条件を満たした項目だけを長期メモリ（`MEMORY.md`）に昇格します。

- **オプトイン**: 既定では無効です。
- **スケジュール済み**: 有効な場合、`memory-core` は完全な dreaming sweep のための反復 cron ジョブを 1 つ自動管理します。
- **しきい値付き**: promotion はスコア、リコール頻度、クエリ多様性のゲートを通過する必要があります。
- **レビュー可能**: フェーズ要約と diary entry は、人間のレビュー用に `DREAMS.md` に書き込まれます。

フェーズの挙動、スコアリングシグナル、Dream Diary の詳細については、[Dreaming](/ja-JP/concepts/dreaming) を参照してください。

## 根拠付きバックフィルとライブ promotion

dreaming システムには、関連するレビュー lane が 2 つあります。

- **ライブ dreaming** は、`memory/.dreams/` 配下の短期 dreaming store から動作し、通常の deep phase が何を `MEMORY.md` に卒業させるかを決めるために使います。
- **根拠付きバックフィル** は、履歴上の `memory/YYYY-MM-DD.md` ノートを standalone day file として読み、構造化されたレビュー出力を `DREAMS.md` に書き込みます。

根拠付きバックフィルは、`MEMORY.md` を手動編集せずに古いノートを再生し、システムが何を永続的とみなすかを調べるのに役立ちます。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` フラグは、根拠付きの永続候補を、通常の deep phase がすでに使っている同じ短期 dreaming store にステージします。直接 promotion することはありません。つまり:

- `DREAMS.md` は人間向けレビュー surface のままです。
- 短期 store は machine-facing ranking surface のままです。
- `MEMORY.md` は引き続き deep promotion によってのみ書き込まれます。

通常の diary entry や通常の recall state に触れずに再生を取り消すには:

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

## 関連情報

- [メモリ検索](/ja-JP/concepts/memory-search): 検索パイプライン、プロバイダー、調整。
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin): 既定の SQLite バックエンド。
- [QMD メモリエンジン](/ja-JP/concepts/memory-qmd): 高度なローカルファーストのサイドカー。
- [Honcho メモリ](/ja-JP/concepts/memory-honcho): AI ネイティブなクロスセッションメモリ。
- [Memory LanceDB](/ja-JP/plugins/memory-lancedb): OpenAI 互換 embeddings を備えた LanceDB バックエンドの plugin。
- [Memory Wiki](/ja-JP/plugins/memory-wiki): コンパイル済みナレッジ vault と wiki ネイティブツール。
- [Dreaming](/ja-JP/concepts/dreaming): 短期リコールから長期メモリへのバックグラウンド promotion。
- [メモリ設定リファレンス](/ja-JP/reference/memory-config): すべての設定ノブ。
- [Compaction](/ja-JP/concepts/compaction): Compaction がメモリとどのように相互作用するか。
- [Active Memory](/ja-JP/concepts/active-memory): 対話型チャットセッション用のサブエージェントメモリ。
