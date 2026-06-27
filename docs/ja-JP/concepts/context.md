---
read_when:
    - OpenClawで「context」が何を意味するのかを理解したい
    - モデルが何かを「知っている」（または忘れた）理由をデバッグしている
    - コンテキストのオーバーヘッドを減らしたい（/context、/status、/compact）
summary: 'コンテキスト: モデルが見る内容、その構築方法、検査方法'
title: コンテキスト
x-i18n:
    generated_at: "2026-06-27T11:07:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

「コンテキスト」とは、**OpenClaw が 1 回の実行でモデルへ送るすべてのもの**です。これはモデルの**コンテキストウィンドウ**（トークン上限）によって制限されます。

初心者向けの考え方:

- **システムプロンプト**（OpenClaw が構築）: ルール、ツール、Skills リスト、時刻/ランタイム、注入されたワークスペースファイル。
- **会話履歴**: このセッションでのあなたのメッセージ + アシスタントのメッセージ。
- **ツール呼び出し/結果 + 添付ファイル**: コマンド出力、ファイル読み取り、画像/音声など。

コンテキストは「メモリ」と_同じものではありません_: メモリはディスクに保存して後で再読み込みできますが、コンテキストはモデルの現在のウィンドウ内にあるものです。

## クイックスタート（コンテキストを調べる）

- `/status` → 「ウィンドウはどれくらい埋まっているか」のクイック表示 + セッション設定。
- `/context list` → 注入されているもの + おおよそのサイズ（ファイルごと + 合計）。
- `/context detail` → より詳細な内訳: ファイルごと、ツールスキーマサイズごと、Skill エントリサイズごと、システムプロンプトサイズ、Compaction 可能なトランスクリプトメッセージ数。
- `/context map` → 現在のセッションで追跡されているコンテキスト寄与要素を WinDirStat 風のツリーマップ画像で表示。
- `/usage tokens` → 通常の返信に、返信ごとの使用量フッターを追加。
- `/compact` → 古い履歴をコンパクトなエントリに要約し、ウィンドウ領域を空ける。

関連項目: [スラッシュコマンド](/ja-JP/tools/slash-commands)、[トークン使用量とコスト](/ja-JP/reference/token-use)、[Compaction](/ja-JP/concepts/compaction)。

## 出力例

値はモデル、プロバイダー、ツールポリシー、ワークスペース内の内容によって異なります。

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

最新のキャッシュ済み実行レポートから生成された画像を送信します。セッション内で通常メッセージが実行レポートを生成する前は、`/context map` は推定をレンダリングする代わりに、利用不可メッセージを返します。矩形の面積は、追跡されているプロンプト文字数に比例します。

- 注入されたワークスペースファイル
- ベースシステムプロンプトテキスト
- Skill プロンプトエントリ
- ツール JSON スキーマ

`/context list`、`/context detail`、`/context json` は、実行レポートがキャッシュされていない場合でも、オンデマンド推定を調べられます。

## コンテキストウィンドウに含まれるもの

モデルが受け取るものはすべて含まれます。たとえば:

- システムプロンプト（すべてのセクション）。
- 会話履歴。
- ツール呼び出し + ツール結果。
- 添付ファイル/トランスクリプト（画像/音声/ファイル）。
- Compaction 要約と pruning アーティファクト。
- プロバイダーの「ラッパー」または非表示ヘッダー（表示されなくてもカウントされます）。

## OpenClaw がシステムプロンプトを構築する方法

システムプロンプトは **OpenClaw が所有**し、実行ごとに再構築されます。含まれるもの:

- ツールリスト + 短い説明。
- Skills リスト（メタデータのみ。以下を参照）。
- ワークスペースの場所。
- 時刻（UTC + 設定されている場合は変換済みのユーザー時刻）。
- ランタイムメタデータ（ホスト/OS/モデル/思考）。
- **Project Context** 配下に注入されたワークスペースブートストラップファイル。

完全な内訳: [システムプロンプト](/ja-JP/concepts/system-prompt)。

## 注入されるワークスペースファイル（Project Context）

デフォルトでは、OpenClaw は固定されたワークスペースファイル群を注入します（存在する場合）。

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（初回実行のみ）

大きなファイルは、`agents.defaults.bootstrapMaxChars`（デフォルト `20000` 文字）を使ってファイル単位で切り詰められます。OpenClaw はさらに、`agents.defaults.bootstrapTotalMaxChars`（デフォルト `60000` 文字）でファイル全体にまたがるブートストラップ注入の合計上限も適用します。`/context` は**生のサイズと注入後のサイズ**、および切り詰めが発生したかを表示します。

切り詰めが発生した場合、ランタイムは Project Context 配下にプロンプト内警告ブロックを注入できます。これは `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`; デフォルト `always`）で設定します。

## Skills: 注入されるものとオンデマンドで読み込まれるもの

システムプロンプトには、コンパクトな **Skills リスト**（名前 + 説明 + 場所）が含まれます。このリストには実際のオーバーヘッドがあります。

Skill の指示は、デフォルトでは含まれません。モデルは、**必要なときだけ** Skill の `SKILL.md` を `read` することが想定されています。

## ツール: コストは 2 種類ある

ツールは 2 つの形でコンテキストに影響します。

1. システムプロンプト内の**ツールリストテキスト**（「Tooling」として見えるもの）。
2. **ツールスキーマ**（JSON）。これらは、モデルがツールを呼び出せるようにモデルへ送信されます。プレーンテキストとして見えなくても、コンテキストにカウントされます。

`/context detail` は、何が支配的かを確認できるように、最大のツールスキーマを分解して表示します。

## コマンド、ディレクティブ、「インラインショートカット」

スラッシュコマンドは Gateway によって処理されます。いくつか異なる挙動があります。

- **スタンドアロンコマンド**: `/...` だけのメッセージはコマンドとして実行されます。
- **ディレクティブ**: `/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` は、モデルがメッセージを見る前に取り除かれます。
  - ディレクティブのみのメッセージはセッション設定を永続化します。
  - 通常メッセージ内のインラインディレクティブは、メッセージ単位のヒントとして機能します。
- **インラインショートカット**（許可リストにある送信者のみ）: 通常メッセージ内の特定の `/...` トークンは即座に実行できます（例: 「hey /status」）。その後、モデルが残りのテキストを見る前に取り除かれます。

詳細: [スラッシュコマンド](/ja-JP/tools/slash-commands)。

## セッション、Compaction、pruning（永続化されるもの）

メッセージ間で何が永続化されるかは、仕組みによって異なります。

- **通常履歴**は、ポリシーによって compact/prune されるまで、セッショントランスクリプトに永続化されます。
- **Compaction** は要約をトランスクリプトへ永続化し、最近のメッセージはそのまま保持します。
- **Pruning** は、コンテキストウィンドウ領域を空けるために、古いツール結果を_メモリ内_プロンプトから削除しますが、セッショントランスクリプトは書き換えません - 完全な履歴は引き続きディスク上で確認できます。

ドキュメント: [セッション](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[セッション pruning](/ja-JP/concepts/session-pruning)。

デフォルトでは、OpenClaw は組み立てと Compaction に組み込みの `legacy` コンテキストエンジンを使用します。`kind: "context-engine"` を提供する Plugin をインストールし、`plugins.slots.contextEngine` でそれを選択した場合、OpenClaw はコンテキストの組み立て、`/compact`、および関連するサブエージェントのコンテキストライフサイクルフックを、代わりにそのエンジンへ委譲します。`ownsCompaction: false` は legacy エンジンへの自動フォールバックを行いません。アクティブなエンジンは、引き続き `compact()` を正しく実装している必要があります。プラグイン可能なインターフェイス、ライフサイクルフック、設定の全体については、[コンテキストエンジン](/ja-JP/concepts/context-engine) を参照してください。

## `/context` が実際に報告するもの

`/context` は、利用可能な場合、最新の**実行時に構築された**システムプロンプトレポートを優先します。

- `System prompt (run)` = 最後の埋め込み（ツール対応）実行からキャプチャされ、セッションストアに永続化されたもの。
- `System prompt (estimate)` = 実行レポートが存在しない場合（またはレポートを生成しない CLI バックエンド経由で実行している場合）に、その場で計算されたもの。

どちらの場合も、サイズと上位の寄与要素を報告します。完全なシステムプロンプトやツールスキーマはダンプ**しません**。詳細モードでは、Compaction が使用するのと同じ実会話メッセージ判定条件でセッショントランスクリプトも比較するため、高いプロンプト/キャッシュ使用量と compact 可能な会話履歴を区別しやすくなります。

## 関連

<CardGroup cols={2}>
  <Card title="Context engine" href="/ja-JP/concepts/context-engine" icon="puzzle-piece">
    Plugin によるカスタムコンテキスト注入。
  </Card>
  <Card title="Compaction" href="/ja-JP/concepts/compaction" icon="compress">
    長い会話を要約して、モデルウィンドウ内に収めます。
  </Card>
  <Card title="System prompt" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    システムプロンプトがどのように構築され、各ターンで何を注入するか。
  </Card>
  <Card title="Agent loop" href="/ja-JP/concepts/agent-loop" icon="arrows-rotate">
    受信メッセージから最終返信までの完全なエージェント実行サイクル。
  </Card>
</CardGroup>
