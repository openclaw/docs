---
read_when:
    - OpenClaw で「コンテキスト」が何を意味するのかを理解したい場合
    - モデルが何かを「知っている」理由（または忘れた理由）をデバッグしている
    - コンテキストのオーバーヘッドを減らしたい場合 (/context, /status, /compact)
summary: 'コンテキスト: モデルに見えるもの、その構築方法、および確認方法'
title: コンテキスト
x-i18n:
    generated_at: "2026-05-06T05:00:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

「コンテキスト」とは、**1回の実行で OpenClaw がモデルに送るすべて**です。これはモデルの**コンテキストウィンドウ**（トークン制限）によって上限が決まります。

初心者向けの考え方:

- **システムプロンプト**（OpenClaw が構築）: ルール、ツール、Skills 一覧、時刻/ランタイム、注入されたワークスペースファイル。
- **会話履歴**: このセッションでのあなたのメッセージ + アシスタントのメッセージ。
- **ツール呼び出し/結果 + 添付ファイル**: コマンド出力、ファイル読み取り、画像/音声など。

コンテキストは「メモリ」と_同じものではありません_: メモリはディスクに保存して後で再読み込みできますが、コンテキストはモデルの現在のウィンドウ内にあるものです。

## クイックスタート（コンテキストを確認する）

- `/status` → 「ウィンドウがどのくらい埋まっているか」の簡易ビュー + セッション設定。
- `/context list` → 注入されているもの + おおよそのサイズ（ファイルごと + 合計）。
- `/context detail` → より詳細な内訳: ファイルごと、ツールスキーマごと、Skill エントリごとのサイズ、システムプロンプトのサイズ。
- `/usage tokens` → 通常の返信に、返信ごとの使用量フッターを追加します。
- `/compact` → 古い履歴をコンパクトなエントリに要約して、ウィンドウの空きを増やします。

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

## コンテキストウィンドウにカウントされるもの

モデルが受け取るものはすべてカウントされます。これには次が含まれます:

- システムプロンプト（すべてのセクション）。
- 会話履歴。
- ツール呼び出し + ツール結果。
- 添付ファイル/トランスクリプト（画像/音声/ファイル）。
- Compaction 要約と枝刈り成果物。
- プロバイダーの「ラッパー」または隠しヘッダー（表示されなくてもカウントされます）。

## OpenClaw がシステムプロンプトを構築する方法

システムプロンプトは **OpenClaw が所有**し、実行のたびに再構築されます。含まれるものは次のとおりです:

- ツール一覧 + 短い説明。
- Skills 一覧（メタデータのみ。下記参照）。
- ワークスペースの場所。
- 時刻（UTC + 設定されている場合は変換済みのユーザー時刻）。
- ランタイムメタデータ（ホスト/OS/モデル/thinking）。
- **プロジェクトコンテキスト**配下に注入されたワークスペースのブートストラップファイル。

詳細な内訳: [システムプロンプト](/ja-JP/concepts/system-prompt)。

## 注入されるワークスペースファイル（プロジェクトコンテキスト）

デフォルトでは、OpenClaw は固定された一連のワークスペースファイルを注入します（存在する場合）:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（初回実行のみ）

大きなファイルは、`agents.defaults.bootstrapMaxChars`（デフォルトは `12000` 文字）を使ってファイル単位で切り詰められます。OpenClaw はまた、`agents.defaults.bootstrapTotalMaxChars`（デフォルトは `60000` 文字）によって、ファイル全体にまたがるブートストラップ注入の合計上限も適用します。`/context` は**元のサイズと注入後のサイズ**、および切り詰めが発生したかどうかを表示します。

切り詰めが発生した場合、ランタイムはプロジェクトコンテキスト配下に、プロンプト内の警告ブロックを注入できます。これは `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`; デフォルトは `once`）で設定します。

## Skills: 注入されるものと必要時に読み込まれるもの

システムプロンプトには、コンパクトな **Skills 一覧**（名前 + 説明 + 場所）が含まれます。この一覧には実際のオーバーヘッドがあります。

Skill の手順はデフォルトでは含まれません。モデルは、**必要な場合にのみ** Skill の `SKILL.md` を `read` することが期待されます。

## ツール: コストは2種類ある

ツールは2つの方法でコンテキストに影響します:

1. システムプロンプト内の**ツール一覧テキスト**（「Tooling」として表示されるもの）。
2. **ツールスキーマ**（JSON）。これらはモデルがツールを呼び出せるように送信されます。プレーンテキストとして表示されなくても、コンテキストにカウントされます。

`/context detail` は、支配的な要因がわかるように、最も大きいツールスキーマを内訳表示します。

## コマンド、ディレクティブ、「インラインショートカット」

スラッシュコマンドは Gateway によって処理されます。動作はいくつかあります:

- **スタンドアロンコマンド**: `/...` だけのメッセージはコマンドとして実行されます。
- **ディレクティブ**: `/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` は、モデルがメッセージを見る前に取り除かれます。
  - ディレクティブのみのメッセージはセッション設定を永続化します。
  - 通常のメッセージ内のインラインディレクティブは、メッセージ単位のヒントとして機能します。
- **インラインショートカット**（許可リストにある送信者のみ）: 通常のメッセージ内の特定の `/...` トークンは即座に実行できます（例: 「hey /status」）。残りのテキストをモデルが見る前に取り除かれます。

詳細: [スラッシュコマンド](/ja-JP/tools/slash-commands)。

## セッション、Compaction、枝刈り（永続化されるもの）

メッセージ間で永続化されるものは、仕組みによって異なります:

- **通常の履歴**は、ポリシーによって compact/枝刈りされるまでセッショントランスクリプトに残ります。
- **Compaction** は要約をトランスクリプトに永続化し、最近のメッセージはそのまま保持します。
- **枝刈り**は、コンテキストウィンドウの空きを増やすために古いツール結果を_メモリ内の_プロンプトから落としますが、セッショントランスクリプトは書き換えません。完全な履歴は引き続きディスク上で確認できます。

ドキュメント: [セッション](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[セッションの枝刈り](/ja-JP/concepts/session-pruning)。

デフォルトでは、OpenClaw は組み立てと Compaction に組み込みの `legacy` コンテキストエンジンを使用します。`kind: "context-engine"` を提供する Plugin をインストールし、`plugins.slots.contextEngine` で選択すると、OpenClaw はコンテキストの組み立て、`/compact`、および関連するサブエージェントのコンテキストライフサイクルフックをそのエンジンに委譲します。`ownsCompaction: false` は `legacy` エンジンへの自動フォールバックを行いません。アクティブなエンジンは引き続き `compact()` を正しく実装する必要があります。プラグイン可能なインターフェイス、ライフサイクルフック、設定の詳細は [コンテキストエンジン](/ja-JP/concepts/context-engine) を参照してください。

## `/context` が実際に報告するもの

`/context` は、利用可能な場合、最新の**実行時に構築された**システムプロンプトレポートを優先します:

- `System prompt (run)` = 最後の埋め込み（ツール使用可能）実行から取得され、セッションストアに永続化されたもの。
- `System prompt (estimate)` = 実行レポートが存在しない場合（またはレポートを生成しない CLI バックエンド経由で実行している場合）に、その場で計算されたもの。

どちらの場合も、サイズと主な寄与要因を報告します。完全なシステムプロンプトやツールスキーマはダンプしません。

## 関連

<CardGroup cols={2}>
  <Card title="コンテキストエンジン" href="/ja-JP/concepts/context-engine" icon="puzzle-piece">
    plugins によるカスタムコンテキスト注入。
  </Card>
  <Card title="Compaction" href="/ja-JP/concepts/compaction" icon="compress">
    長い会話を要約して、モデルウィンドウ内に収めます。
  </Card>
  <Card title="システムプロンプト" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    システムプロンプトがどのように構築され、各ターンで何を注入するか。
  </Card>
  <Card title="エージェントループ" href="/ja-JP/concepts/agent-loop" icon="arrows-rotate">
    受信メッセージから最終返信までの、エージェント実行サイクル全体。
  </Card>
</CardGroup>
