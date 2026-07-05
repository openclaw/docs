---
read_when:
    - OpenClaw で「context」が何を意味するのかを理解したい
    - モデルが何かを「知っている」理由（または忘れた理由）をデバッグする
    - コンテキストのオーバーヘッドを減らしたい場合（/context、/status、/compact）
summary: 'コンテキスト: モデルが見る内容、構築方法、確認方法'
title: コンテキスト
x-i18n:
    generated_at: "2026-07-05T11:13:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b94bf7dd87318107840faced4e899e0a4acae5fe8ae55cfcb91ae72259c79aa
    source_path: concepts/context.md
    workflow: 16
---

「コンテキスト」とは、**OpenClaw が 1 回の実行でモデルに送信するすべて**です。これはモデルの**コンテキストウィンドウ**（トークン制限）によって上限が決まります。

初心者向けの考え方:

- **システムプロンプト**（OpenClaw が構築）: ルール、ツール、Skills リスト、時刻/ランタイム、注入されたワークスペースファイル。
- **会話履歴**: このセッションでのあなたのメッセージ + アシスタントのメッセージ。
- **ツール呼び出し/結果 + 添付ファイル**: コマンド出力、ファイル読み取り、画像/音声など。

コンテキストは「メモリ」と_同じものではありません_: メモリはディスクに保存して後で再読み込みできます。コンテキストはモデルの現在のウィンドウ内にあるものです。

## クイックスタート（コンテキストを調べる）

- `/status` → 「ウィンドウがどれくらい埋まっているか」の簡易表示 + セッション設定。
- `/context list` → 何が注入されているか + おおよそのサイズ（ファイルごと + 合計）。
- `/context detail` → より詳細な内訳: ファイルごと、ツールスキーマごとのサイズ、Skills エントリごとのサイズ、システムプロンプトサイズ、Compaction 可能なトランスクリプトメッセージ数。
- `/context map` → 現在のセッションで追跡されているコンテキスト要因の WinDirStat 風ツリーマップ画像。
- `/usage tokens` → 通常の返信に、返信ごとの使用量フッターを追加。
- `/compact` → 古い履歴をコンパクトなエントリに要約し、ウィンドウ空間を解放。

関連項目: [スラッシュコマンド](/ja-JP/tools/slash-commands), [トークン使用量とコスト](/ja-JP/reference/token-use), [Compaction](/ja-JP/concepts/compaction)。

## 出力例

値はモデル、プロバイダー、ツールポリシー、ワークスペース内の内容によって異なります。

### `/context list`

```text
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

```text
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

最新のキャッシュ済み実行レポートから生成された画像を送信します。セッション内で通常のメッセージがまだ実行レポートを生成していない場合、`/context map` は見積もりを描画する代わりに、利用不可メッセージを返します。長方形の面積は、追跡対象のプロンプト文字数に比例します:

- 注入されたワークスペースファイル
- ベースのシステムプロンプトテキスト
- Skills プロンプトエントリ
- ツール JSON スキーマ

`/context list`、`/context detail`、`/context json` は、実行レポートがキャッシュされていない場合でもオンデマンド見積もりを調べられます。

## コンテキストウィンドウに含まれるもの

モデルが受け取るすべてが含まれます。例:

- システムプロンプト（すべてのセクション）。
- 会話履歴。
- ツール呼び出し + ツール結果。
- 添付ファイル/トランスクリプト（画像/音声/ファイル）。
- Compaction 要約と pruning 成果物。
- プロバイダーの「ラッパー」または隠しヘッダー（表示されませんが、カウントされます）。

## OpenClaw がシステムプロンプトを構築する方法

システムプロンプトは **OpenClaw が所有**し、実行ごとに再構築されます。含まれるもの:

- ツールリスト + 短い説明。
- Skills リスト（メタデータのみ。下記参照）。
- ワークスペースの場所。
- 時刻（UTC + 設定されている場合は変換済みユーザー時刻）。
- ランタイムメタデータ（ホスト/OS/モデル/thinking）。
- **Project Context** の下に注入されたワークスペースのブートストラップファイル。

完全な内訳: [システムプロンプト](/ja-JP/concepts/system-prompt)。

## 注入されるワークスペースファイル（Project Context）

デフォルトでは、OpenClaw は固定されたワークスペースファイル群を注入します（存在する場合）:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（初回実行のみ）

大きなファイルは、`agents.defaults.bootstrapMaxChars`（デフォルト `20000` 文字）を使ってファイルごとに切り詰められます。OpenClaw はさらに、`agents.defaults.bootstrapTotalMaxChars`（デフォルト `60000` 文字）でファイル全体にまたがるブートストラップ注入の合計上限も適用します。`/context` は、**raw と injected** のサイズ、および切り詰めが発生したかどうかを表示します。

切り詰めが発生した場合、ランタイムは Project Context の下にプロンプト内警告ブロックを注入できます。これは `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`; デフォルト `always`）で設定します。

## Skills: 注入されるものとオンデマンドで読み込まれるもの

システムプロンプトには、コンパクトな **Skills リスト**（名前 + 説明 + 場所）が含まれます。このリストには実際のオーバーヘッドがあります。

Skill の指示はデフォルトでは含まれません。モデルは、**必要な場合にのみ** Skill の `SKILL.md` を `read` することが期待されます。

## ツール: 2 種類のコスト

ツールは 2 つの形でコンテキストに影響します:

1. システムプロンプト内の**ツールリストテキスト**（「Tooling」として表示されるもの）。
2. **ツールスキーマ**（JSON）。これはモデルがツールを呼び出せるように送信されます。プレーンテキストとして表示されなくても、コンテキストにカウントされます。

`/context detail` は、最も大きいツールスキーマを分解して表示するため、何が支配的かを確認できます。

## コマンド、ディレクティブ、「インラインショートカット」

スラッシュコマンドは Gateway によって処理されます。いくつか異なる動作があります:

- **スタンドアロンコマンド**: `/...` だけのメッセージはコマンドとして実行されます。
- **ディレクティブ**: `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue` は、モデルがメッセージを見る前に取り除かれます。
  - ディレクティブのみのメッセージはセッション設定を永続化します。
  - 通常メッセージ内のインラインディレクティブは、メッセージ単位のヒントとして機能します。
- **インラインショートカット**（許可リストに含まれる送信者のみ）: 通常メッセージ内の特定の `/...` トークンは即座に実行できます（例: 「hey /status」）。モデルが残りのテキストを見る前に取り除かれます。

詳細: [スラッシュコマンド](/ja-JP/tools/slash-commands)。

## セッション、Compaction、pruning（永続化されるもの）

メッセージ間で何が永続化されるかは、仕組みによって異なります:

- **通常履歴**は、ポリシーによって compact/prune されるまでセッショントランスクリプトに保持されます。
- **Compaction** は要約をトランスクリプトに永続化し、最近のメッセージはそのまま保持します。
- **Pruning** は、コンテキストウィンドウの空間を解放するため、_メモリ内_プロンプトから古いツール結果を削除しますが、セッショントランスクリプトを書き換えるわけではありません。完全な履歴は引き続きディスク上で調べられます。

ドキュメント: [セッション](/ja-JP/concepts/session), [Compaction](/ja-JP/concepts/compaction), [セッション pruning](/ja-JP/concepts/session-pruning)。

デフォルトでは、OpenClaw は組み立てと Compaction に組み込みの `legacy` コンテキストエンジンを使用します。`kind: "context-engine"` を提供する Plugin をインストールし、`plugins.slots.contextEngine` で選択すると、OpenClaw は代わりに、そのエンジンへコンテキスト組み立て、`/compact`、関連するサブエージェントのコンテキストライフサイクルフックを委譲します。`ownsCompaction: false` は legacy エンジンへの自動フォールバックを意味しません。アクティブなエンジンは引き続き `compact()` を正しく実装する必要があります。プラグ可能なインターフェイス、ライフサイクルフック、設定の全体については、[コンテキストエンジン](/ja-JP/concepts/context-engine)を参照してください。

## `/context` が実際に報告するもの

`/context` は、利用可能な場合は最新の**実行時に構築された**システムプロンプトレポートを優先します:

- `System prompt (run)` = 最後の組み込み（ツール利用可能）実行から取得され、セッションストアに永続化されたもの。
- `System prompt (estimate)` = 実行レポートが存在しない場合（またはレポートを生成しない CLI バックエンド経由で実行している場合）にその場で計算されたもの。

どちらの場合も、サイズと上位の要因を報告します。完全なシステムプロンプトやツールスキーマをダンプすることは**ありません**。詳細モードでは、セッショントランスクリプトを Compaction で使われるものと同じ実会話メッセージ判定条件で比較するため、高いプロンプト/キャッシュ使用量と Compaction 可能な会話履歴を区別しやすくなります。

## 関連

<CardGroup cols={2}>
  <Card title="Context engine" href="/ja-JP/concepts/context-engine" icon="puzzle-piece">
    Plugin によるカスタムコンテキスト注入。
  </Card>
  <Card title="Compaction" href="/ja-JP/concepts/compaction" icon="compress">
    長い会話を要約し、モデルウィンドウ内に収める。
  </Card>
  <Card title="System prompt" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    システムプロンプトがどのように構築され、各ターンで何を注入するか。
  </Card>
  <Card title="Agent loop" href="/ja-JP/concepts/agent-loop" icon="arrows-rotate">
    受信メッセージから最終返信までの完全なエージェント実行サイクル。
  </Card>
</CardGroup>
