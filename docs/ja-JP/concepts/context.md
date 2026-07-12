---
read_when:
    - OpenClaw における「コンテキスト」の意味を理解したい場合
    - モデルが何かを「知っている」（または忘れた）理由をデバッグしている場合
    - コンテキストのオーバーヘッドを減らしたい（/context、/status、/compact）
summary: コンテキスト：モデルに見える内容、その構築方法、および確認方法
title: コンテキスト
x-i18n:
    generated_at: "2026-07-11T22:10:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

「コンテキスト」とは、**OpenClaw が1回の実行でモデルに送信するすべてのもの**です。これはモデルの**コンテキストウィンドウ**（トークン上限）によって制限されます。

初心者向けの考え方：

- **システムプロンプト**（OpenClaw が構築）：ルール、ツール、Skills 一覧、時刻／ランタイム、挿入されたワークスペースファイル。
- **会話履歴**：このセッションでのあなたのメッセージとアシスタントのメッセージ。
- **ツール呼び出し／結果と添付ファイル**：コマンド出力、ファイル読み取り、画像／音声など。

コンテキストは「メモリ」と_同じものではありません_。メモリはディスクに保存して後から再読み込みできますが、コンテキストはモデルの現在のウィンドウ内にあるものです。

## クイックスタート（コンテキストを確認）

- `/status` → 「ウィンドウがどの程度埋まっているか」をすばやく確認し、セッション設定も表示します。
- `/context list` → 挿入されているものと概算サイズ（ファイルごと＋合計）を表示します。
- `/context detail` → より詳細な内訳：ファイルごと、ツールスキーマごと、Skill エントリごとのサイズ、システムプロンプトのサイズ、Compaction 可能なトランスクリプトメッセージ数。
- `/context map` → 現在のセッションで追跡されているコンテキスト要素を WinDirStat 形式のツリーマップ画像で表示します。
- `/usage tokens` → 通常の応答に、応答ごとの使用量フッターを追加します。
- `/compact` → 古い履歴を要約してコンパクトなエントリにし、ウィンドウの空き容量を増やします。

関連項目：[スラッシュコマンド](/ja-JP/tools/slash-commands)、[トークン使用量とコスト](/ja-JP/reference/token-use)、[Compaction](/ja-JP/concepts/compaction)。

## 出力例

値はモデル、プロバイダー、ツールポリシー、ワークスペースの内容によって異なります。

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

最新のキャッシュ済み実行レポートとセッショントランスクリプトから生成した画像を送信します。セッション内で通常のメッセージによる実行レポートがまだ生成されていない場合、`/context map` は推定画像を描画せず、利用不可を示すメッセージを返します。長方形の面積は、追跡対象のプロンプト文字数に比例します：

- 会話トランスクリプト（ユーザーメッセージ、アシスタントの応答、ツール結果、Compaction の要約）に加え、モデルだけに到達するターンごとのランタイムコンテキストとフックによるプロンプト追加
- 挿入されたワークスペースファイル
- 基本システムプロンプトのテキスト
- Skill のプロンプトエントリ
- ツールの JSON スキーマ

会話グループはセッションの進行に伴って拡大するため、マップはターンごとに変化します。Compaction 後は要約タイルに集約されます。

実行レポートがキャッシュされていない場合でも、`/context list`、`/context detail`、`/context json` ではオンデマンドの推定値を確認できます。

## コンテキストウィンドウに算入されるもの

モデルが受信するものは、以下を含めてすべて算入されます：

- システムプロンプト（すべてのセクション）。
- 会話履歴。
- ツール呼び出しとツール結果。
- 添付ファイル／トランスクリプト（画像／音声／ファイル）。
- Compaction の要約とプルーニング生成物。
- プロバイダーの「ラッパー」や非表示ヘッダー（表示されなくても算入されます）。

## OpenClaw がシステムプロンプトを構築する仕組み

システムプロンプトは **OpenClaw が所有**し、実行ごとに再構築されます。含まれるもの：

- ツール一覧と簡単な説明。
- Skills 一覧（メタデータのみ。後述）。
- ワークスペースの場所。
- 時刻（UTC、および設定されている場合は変換後のユーザー時刻）。
- ランタイムメタデータ（ホスト／OS／モデル／思考）。
- **プロジェクトコンテキスト**に挿入されたワークスペースのブートストラップファイル。

完全な内訳：[システムプロンプト](/ja-JP/concepts/system-prompt)。

## 挿入されるワークスペースファイル（プロジェクトコンテキスト）

デフォルトでは、OpenClaw は次の固定されたワークスペースファイルが存在する場合に挿入します：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（初回実行時のみ）

大きなファイルは、`agents.defaults.bootstrapMaxChars`（デフォルトは `20000` 文字）に基づき、ファイルごとに切り詰められます。OpenClaw はさらに、`agents.defaults.bootstrapTotalMaxChars`（デフォルトは `60000` 文字）により、全ファイルを通じたブートストラップ挿入の合計上限も適用します。`/context` は**元のサイズと挿入後のサイズ**を表示し、切り詰めが発生したかどうかも示します。

切り詰めが発生した場合、ランタイムはプロジェクトコンテキスト内にプロンプト警告ブロックを挿入できます。これは `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`。デフォルトは `always`）で設定します。

## Skills：挿入とオンデマンド読み込み

システムプロンプトには、簡潔な **Skills 一覧**（名前、説明、場所）が含まれます。この一覧は実際にコンテキストを消費します。

Skill の指示は、デフォルトでは含まれません。モデルは、**必要な場合にのみ** Skill の `SKILL.md` を `read` することが想定されています。

## ツール：2種類のコスト

ツールは、次の2つの方法でコンテキストに影響します：

1. システムプロンプト内の**ツール一覧テキスト**（「ツール機能」として表示されるもの）。
2. **ツールスキーマ**（JSON）。モデルがツールを呼び出せるように送信されます。プレーンテキストとして表示されなくても、コンテキストに算入されます。

`/context detail` は、最も大きなツールスキーマの内訳を示すため、どれが大部分を占めているか確認できます。

## コマンド、ディレクティブ、「インラインショートカット」

スラッシュコマンドは Gateway によって処理されます。動作にはいくつかの種類があります：

- **単独コマンド**：`/...` だけで構成されたメッセージはコマンドとして実行されます。
- **ディレクティブ**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue` は、モデルがメッセージを受信する前に取り除かれます。
  - ディレクティブのみのメッセージは、セッション設定を永続化します。
  - 通常のメッセージ内のインラインディレクティブは、メッセージごとのヒントとして機能します。
- **インラインショートカット**（許可リストに登録された送信者のみ）：通常のメッセージ内にある特定の `/...` トークンは即座に実行できます（例：「ねえ /status」）。その後、モデルが残りのテキストを受信する前に取り除かれます。

詳細：[スラッシュコマンド](/ja-JP/tools/slash-commands)。

## セッション、Compaction、プルーニング（永続化されるもの）

メッセージ間で何が永続化されるかは、その仕組みによって異なります：

- **通常の履歴**は、ポリシーによって Compaction またはプルーニングされるまで、セッショントランスクリプトに保持されます。
- **Compaction** は要約をトランスクリプトに永続化し、最近のメッセージをそのまま保持します。
- **プルーニング**は、コンテキストウィンドウの空き容量を増やすために古いツール結果を_メモリ内_のプロンプトから除外しますが、セッショントランスクリプトは書き換えません。完全な履歴は引き続きディスク上で確認できます。

ドキュメント：[セッション](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[セッションのプルーニング](/ja-JP/concepts/session-pruning)。

デフォルトでは、OpenClaw は組み立てと Compaction に組み込みの `legacy` コンテキストエンジンを使用します。`kind: "context-engine"` を提供する Plugin をインストールし、`plugins.slots.contextEngine` で選択すると、OpenClaw はコンテキストの組み立て、`/compact`、および関連するサブエージェントのコンテキストライフサイクルフックをそのエンジンに委任します。`ownsCompaction: false` を指定しても、`legacy` エンジンへ自動的にフォールバックすることはありません。アクティブなエンジンが引き続き `compact()` を正しく実装する必要があります。プラグイン可能な完全なインターフェース、ライフサイクルフック、設定については、[コンテキストエンジン](/ja-JP/concepts/context-engine)を参照してください。

## `/context` が実際に報告するもの

`/context` は、利用可能な場合、最新の**実行時に構築された**システムプロンプトレポートを優先します：

- `System prompt (run)` = 最後の組み込み実行（ツールを使用できる実行）から取得され、セッションストアに永続化されたもの。
- `System prompt (estimate)` = 実行レポートが存在しない場合（またはレポートを生成しない CLI バックエンド経由で実行している場合）に、その場で計算されたもの。

どちらの場合も、サイズと主な構成要素を報告しますが、システムプロンプトやツールスキーマ全体を出力することは**ありません**。詳細モードでは、セッショントランスクリプトと、Compaction が使用するものと同じ実際の会話メッセージ判定条件も比較します。これにより、プロンプト／キャッシュの高い使用量と、Compaction 可能な会話履歴を区別しやすくなります。

## 関連項目

<CardGroup cols={2}>
  <Card title="コンテキストエンジン" href="/ja-JP/concepts/context-engine" icon="puzzle-piece">
    Plugin によるカスタムコンテキスト挿入。
  </Card>
  <Card title="Compaction" href="/ja-JP/concepts/compaction" icon="compress">
    長い会話を要約し、モデルのウィンドウ内に収めます。
  </Card>
  <Card title="システムプロンプト" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    システムプロンプトがどのように構築され、各ターンで何を挿入するか。
  </Card>
  <Card title="エージェントループ" href="/ja-JP/concepts/agent-loop" icon="arrows-rotate">
    受信メッセージから最終応答までの、エージェントの完全な実行サイクル。
  </Card>
</CardGroup>
