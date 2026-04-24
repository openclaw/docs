---
read_when:
    - OpenClaw における「コンテキスト」の意味を理解したい場合
    - モデルがなぜ何かを「知っている」のか（または忘れたのか）をデバッグしている場合
    - コンテキストのオーバーヘッドを減らしたい場合（`/context`、`/status`、`/compact`）
summary: 'コンテキスト: モデルが見るもの、それがどのように構築されるか、およびその確認方法'
title: コンテキスト
x-i18n:
    generated_at: "2026-04-24T04:53:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

「コンテキスト」とは、**1 回の実行で OpenClaw がモデルに送るすべて** のことです。これはモデルの **コンテキストウィンドウ**（トークン上限）によって制限されます。

初学者向けのイメージ:

- **システムプロンプト**（OpenClaw が構築）: ルール、ツール、Skills リスト、時刻/ランタイム、注入された workspace ファイル。
- **会話履歴**: このセッションでのあなたのメッセージ + アシスタントのメッセージ。
- **ツール呼び出し/結果 + 添付**: コマンド出力、ファイル読み取り、画像/音声など。

コンテキストは「メモリ」とは同じではありません。メモリはディスクに保存されて後で再読み込みできますが、コンテキストはモデルの現在のウィンドウ内に入っているものです。

## クイックスタート（コンテキストを確認する）

- `/status` → 「自分のウィンドウがどのくらい埋まっているか？」の簡易表示 + セッション設定。
- `/context list` → 何が注入されているか + おおよそのサイズ（ファイルごと + 合計）。
- `/context detail` → より詳細な内訳: ファイルごと、ツールスキーマごと、skill エントリごと、システムプロンプトサイズ。
- `/usage tokens` → 通常の返信に、返信ごとの使用量フッターを付ける。
- `/compact` → 古い履歴をコンパクトなエントリに要約し、ウィンドウ空間を解放する。

関連: [Slash commands](/ja-JP/tools/slash-commands)、[トークン使用量とコスト](/ja-JP/reference/token-use)、[Compaction](/ja-JP/concepts/compaction)。

## 出力例

値は、モデル、プロバイダ、ツールポリシー、workspace 内の内容によって変わります。

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

## 何がコンテキストウィンドウに含まれるか

モデルが受け取るものはすべてカウントされます。たとえば:

- システムプロンプト（全セクション）。
- 会話履歴。
- ツール呼び出し + ツール結果。
- 添付/文字起こし（画像/音声/ファイル）。
- Compaction 要約と pruning artifact。
- プロバイダの「ラッパー」や隠しヘッダー（見えなくてもカウントされる）。

## OpenClaw がシステムプロンプトをどう構築するか

システムプロンプトは **OpenClaw が所有** し、実行ごとに再構築されます。これには次が含まれます:

- ツール一覧 + 短い説明。
- Skills 一覧（メタデータのみ。後述）。
- Workspace の場所。
- 時刻（UTC + 設定されていれば変換後のユーザー時刻）。
- ランタイムメタデータ（host/OS/model/thinking）。
- **Project Context** 配下に注入された workspace ブートストラップファイル。

完全な内訳: [System Prompt](/ja-JP/concepts/system-prompt)。

## 注入される workspace ファイル（Project Context）

デフォルトでは、OpenClaw は固定の workspace ファイル群を注入します（存在する場合）:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（初回実行のみ）

大きなファイルは、`agents.defaults.bootstrapMaxChars`（デフォルト `12000` 文字）を使ってファイル単位で切り詰められます。OpenClaw はさらに、ファイル全体にまたがる総ブートストラップ注入上限として `agents.defaults.bootstrapTotalMaxChars`（デフォルト `60000` 文字）も適用します。`/context` では **raw と injected** のサイズ、および切り詰めが発生したかどうかが表示されます。

切り詰めが発生した場合、ランタイムは Project Context 配下のプロンプト内に警告ブロックを注入できます。これは `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`。デフォルト `once`）で設定します。

## Skills: 注入されるものとオンデマンドで読み込まれるもの

システムプロンプトには、コンパクトな **skills リスト**（名前 + 説明 + 場所）が含まれます。このリストには実際のオーバーヘッドがあります。

skill の指示内容自体は、デフォルトでは含まれません。モデルは必要なときにだけ、その skill の `SKILL.md` を `read` することが想定されています。

## ツール: コストは 2 種類ある

ツールは 2 つの方法でコンテキストに影響します:

1. システムプロンプト内の **ツール一覧テキスト**（「Tooling」として見えるもの）。
2. **ツールスキーマ**（JSON）。モデルがツールを呼び出せるよう、これらも送られます。プレーンテキストとして見えなくてもコンテキストにカウントされます。

`/context detail` では、支配的な要素が何か分かるよう、大きいツールスキーマを分解して表示します。

## コマンド、ディレクティブ、および「inline shortcuts」

スラッシュコマンドは Gateway によって処理されます。挙動はいくつかに分かれます:

- **スタンドアロンコマンド**: メッセージが `/...` だけならコマンドとして実行されます。
- **ディレクティブ**: `/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` は、モデルがメッセージを見る前に取り除かれます。
  - ディレクティブだけのメッセージはセッション設定を永続化します。
  - 通常メッセージ内のインラインディレクティブは、メッセージ単位のヒントとして動作します。
- **inline shortcuts**（許可リスト送信者のみ）: 通常メッセージ内の特定の `/...` トークンは即座に実行されることがあり（例: 「hey /status」）、残りのテキストがモデルに見える前に取り除かれます。

詳細: [Slash commands](/ja-JP/tools/slash-commands)。

## セッション、Compaction、pruning（何が残るか）

メッセージをまたいで何が残るかは、その仕組みに依存します:

- **通常の履歴** は、ポリシーによって compact/prune されるまでセッショントランスクリプトに残ります。
- **Compaction** は、要約をトランスクリプトに保存しつつ、最近のメッセージはそのまま保持します。
- **Pruning** は、コンテキストウィンドウ空間を空けるため、_メモリ内_ プロンプトから古いツール結果を落としますが、セッショントランスクリプト自体は書き換えません。完全な履歴は引き続きディスク上で確認できます。

ドキュメント: [Session](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[Session pruning](/ja-JP/concepts/session-pruning)。

デフォルトでは、OpenClaw は組み込みの `legacy` コンテキストエンジンを組み立てと
compaction に使います。`kind: "context-engine"` を提供する Plugin をインストールし、
`plugins.slots.contextEngine` で選択すると、OpenClaw はコンテキスト組み立て、
`/compact`、および関連するサブエージェントのコンテキストライフサイクルフックをその
エンジンに委譲します。`ownsCompaction: false` でも自動的に legacy エンジンへは
フォールバックしません。アクティブなエンジンは引き続き `compact()` を正しく実装する必要があります。
完全なプラグ可能インターフェース、ライフサイクルフック、設定については
[Context Engine](/ja-JP/concepts/context-engine) を参照してください。

## `/context` が実際に報告するもの

`/context` は、利用可能なら最新の **実行時構築済み** システムプロンプトレポートを優先します:

- `System prompt (run)` = 最後の埋め込み実行（ツール使用可能な実行）から取得され、セッションストアに保存されたもの。
- `System prompt (estimate)` = 実行レポートが存在しない場合（またはレポートを生成しない CLI バックエンド経由で実行した場合）にオンザフライで計算されたもの。

どちらの場合でも、サイズと主要な要因を報告しますが、システムプロンプト全文やツールスキーマ自体は出力しません。

## 関連

- [Context Engine](/ja-JP/concepts/context-engine) — Plugin によるカスタムコンテキスト注入
- [Compaction](/ja-JP/concepts/compaction) — 長い会話の要約
- [System Prompt](/ja-JP/concepts/system-prompt) — システムプロンプトがどう構築されるか
- [Agent Loop](/ja-JP/concepts/agent-loop) — 完全なエージェント実行サイクル
