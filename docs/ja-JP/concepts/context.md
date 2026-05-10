---
read_when:
    - OpenClawで「コンテキスト」が何を意味するかを理解したい
    - モデルが何かを「知っている」（または忘れている）理由をデバッグしている
    - コンテキストのオーバーヘッドを減らしたい (/context, /status, /compact)
summary: 'コンテキスト: モデルが何を見るか、その構築方法、検査方法'
title: コンテキスト
x-i18n:
    generated_at: "2026-05-10T19:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

「コンテキスト」とは、**1回の実行で OpenClaw がモデルへ送信するすべて**です。これはモデルの**コンテキストウィンドウ**（トークン制限）によって制限されます。

初心者向けの考え方:

- **システムプロンプト**（OpenClaw が構築）: ルール、ツール、Skillsリスト、時刻/ランタイム、注入されたワークスペースファイル。
- **会話履歴**: このセッションでのあなたのメッセージ + アシスタントのメッセージ。
- **ツール呼び出し/結果 + 添付ファイル**: コマンド出力、ファイル読み取り、画像/音声など。

コンテキストは「メモリ」と_同じものではありません_: メモリはディスクに保存して後で再読み込みできますが、コンテキストはモデルの現在のウィンドウ内にあるものです。

## クイックスタート（コンテキストを確認）

- `/status` → 「ウィンドウはどのくらい埋まっているか」をすばやく確認する表示 + セッション設定。
- `/context list` → 注入されているもの + おおよそのサイズ（ファイルごと + 合計）。
- `/context detail` → より詳細な内訳: ファイルごと、ツールスキーマサイズごと、Skillsエントリサイズごと、システムプロンプトサイズ。
- `/context map` → 現在のセッションで追跡されているコンテキスト寄与要素の、WinDirStat風ツリーマップ画像。
- `/usage tokens` → 通常の返信に、返信ごとの使用量フッターを追加。
- `/compact` → 古い履歴をコンパクトなエントリに要約して、ウィンドウ領域を空ける。

関連項目: [スラッシュコマンド](/ja-JP/tools/slash-commands)、[トークン使用量とコスト](/ja-JP/reference/token-use)、[Compaction](/ja-JP/concepts/compaction)。

## 出力例

値はモデル、プロバイダー、ツールポリシー、ワークスペース内の内容によって変わります。

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

最新のキャッシュ済み実行レポートから生成された画像を送信します。セッション内で通常のメッセージがまだ実行レポートを生成していない場合、`/context map` は推定をレンダリングせず、利用不可メッセージを返します。長方形の面積は、追跡されているプロンプト文字数に比例します:

- 注入されたワークスペースファイル
- ベースのシステムプロンプトテキスト
- Skillsプロンプトエントリ
- ツールJSONスキーマ

実行レポートがキャッシュされていない場合でも、`/context list`、`/context detail`、`/context json` はオンデマンド推定を確認できます。

## コンテキストウィンドウに含まれるもの

モデルが受け取るものはすべて含まれます。例:

- システムプロンプト（すべてのセクション）。
- 会話履歴。
- ツール呼び出し + ツール結果。
- 添付ファイル/文字起こし（画像/音声/ファイル）。
- Compaction要約と剪定アーティファクト。
- プロバイダーの「ラッパー」または非表示ヘッダー（表示されなくても含まれます）。

## OpenClaw がシステムプロンプトを構築する方法

システムプロンプトは**OpenClawが所有**し、各実行で再構築されます。含まれる内容:

- ツールリスト + 短い説明。
- Skillsリスト（メタデータのみ。下記参照）。
- ワークスペースの場所。
- 時刻（UTC + 設定されている場合は変換されたユーザー時刻）。
- ランタイムメタデータ（ホスト/OS/モデル/thinking）。
- **Project Context** の下に注入されたワークスペースのブートストラップファイル。

完全な内訳: [システムプロンプト](/ja-JP/concepts/system-prompt)。

## 注入されたワークスペースファイル（Project Context）

デフォルトでは、OpenClaw は固定セットのワークスペースファイルを注入します（存在する場合）:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（初回実行のみ）

大きなファイルは、`agents.defaults.bootstrapMaxChars`（デフォルト `12000` 文字）を使ってファイルごとに切り詰められます。OpenClaw はさらに、`agents.defaults.bootstrapTotalMaxChars`（デフォルト `60000` 文字）により、ファイル全体にまたがるブートストラップ注入の合計上限も適用します。`/context` は**raw と injected**のサイズ、および切り詰めが発生したかどうかを表示します。

切り詰めが発生した場合、ランタイムは Project Context の下にプロンプト内警告ブロックを注入できます。これは `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`; デフォルト `once`）で設定します。

## Skills: 注入とオンデマンド読み込み

システムプロンプトには、コンパクトな**Skillsリスト**（名前 + 説明 + 場所）が含まれます。このリストには実際のオーバーヘッドがあります。

Skill指示はデフォルトでは含まれません。モデルは**必要な場合のみ**、Skillの `SKILL.md` を `read` することが期待されます。

## ツール: コストは2種類ある

ツールは2つの方法でコンテキストに影響します:

1. システムプロンプト内の**ツールリストテキスト**（「Tooling」として表示されるもの）。
2. **ツールスキーマ**（JSON）。これらは、モデルがツールを呼び出せるように送信されます。プレーンテキストとしては表示されませんが、コンテキストに含まれます。

`/context detail` は、どれが支配的か確認できるように、最大のツールスキーマを内訳表示します。

## コマンド、ディレクティブ、「インラインショートカット」

スラッシュコマンドは Gateway によって処理されます。いくつか異なる挙動があります:

- **スタンドアロンコマンド**: `/...` だけのメッセージはコマンドとして実行されます。
- **ディレクティブ**: `/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` は、モデルがメッセージを見る前に取り除かれます。
  - ディレクティブのみのメッセージはセッション設定を保持します。
  - 通常のメッセージ内のインラインディレクティブは、メッセージごとのヒントとして機能します。
- **インラインショートカット**（許可リスト済み送信者のみ）: 通常のメッセージ内の特定の `/...` トークンは即時実行できます（例: 「hey /status」）。モデルが残りのテキストを見る前に取り除かれます。

詳細: [スラッシュコマンド](/ja-JP/tools/slash-commands)。

## セッション、Compaction、剪定（保持されるもの）

メッセージ間で何が保持されるかは、仕組みによって異なります:

- **通常履歴**は、ポリシーによってCompaction/剪定されるまでセッショントランスクリプトに保持されます。
- **Compaction**は要約をトランスクリプトに保持し、最近のメッセージはそのまま維持します。
- **剪定**は、コンテキストウィンドウの領域を空けるために、古いツール結果を_メモリ内_プロンプトから削除しますが、セッショントランスクリプトは書き換えません。完全な履歴は引き続きディスク上で確認できます。

ドキュメント: [セッション](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[セッション剪定](/ja-JP/concepts/session-pruning)。

デフォルトでは、OpenClaw は組み立てとCompactionに組み込みの `legacy` コンテキストエンジンを使用します。`kind: "context-engine"` を提供するPluginをインストールし、`plugins.slots.contextEngine` で選択すると、OpenClaw は代わりにコンテキストの組み立て、`/compact`、および関連するサブエージェントのコンテキストライフサイクルフックをそのエンジンへ委譲します。`ownsCompaction: false` にしても、legacyエンジンへ自動フォールバックはしません。アクティブなエンジンは引き続き `compact()` を正しく実装する必要があります。完全なプラグ可能インターフェイス、ライフサイクルフック、設定については、[コンテキストエンジン](/ja-JP/concepts/context-engine)を参照してください。

## `/context` が実際に報告するもの

`/context` は、利用可能な場合は最新の**実行で構築された**システムプロンプトレポートを優先します:

- `System prompt (run)` = 最後の埋め込み（ツール対応）実行から取得され、セッションストアに保持されたもの。
- `System prompt (estimate)` = 実行レポートが存在しない場合（またはレポートを生成しないCLIバックエンド経由で実行している場合）に、その場で計算されたもの。

どちらの場合も、サイズと上位の寄与要素を報告します。完全なシステムプロンプトやツールスキーマをダンプすることは**ありません**。

## 関連

<CardGroup cols={2}>
  <Card title="Context engine" href="/ja-JP/concepts/context-engine" icon="puzzle-piece">
    Pluginによるカスタムコンテキスト注入。
  </Card>
  <Card title="Compaction" href="/ja-JP/concepts/compaction" icon="compress">
    長い会話を要約して、モデルウィンドウ内に収める。
  </Card>
  <Card title="System prompt" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    システムプロンプトがどのように構築され、各ターンで何を注入するか。
  </Card>
  <Card title="Agent loop" href="/ja-JP/concepts/agent-loop" icon="arrows-rotate">
    受信メッセージから最終返信までの、完全なエージェント実行サイクル。
  </Card>
</CardGroup>
