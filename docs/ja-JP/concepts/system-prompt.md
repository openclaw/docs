---
read_when:
    - システムプロンプトのテキスト、ツール一覧、または時刻/Heartbeat セクションを編集する
    - ワークスペースのブートストラップや Skills 注入の動作を変更する
summary: OpenClaw のシステムプロンプトに何が含まれているか、そしてそれがどのように組み立てられるか
title: システムプロンプト
x-i18n:
    generated_at: "2026-04-21T04:44:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# システムプロンプト

OpenClaw は、エージェントの実行ごとにカスタムのシステムプロンプトを構築します。このプロンプトは **OpenClaw が所有** しており、pi-coding-agent のデフォルトプロンプトは使用しません。

プロンプトは OpenClaw によって組み立てられ、各エージェント実行に注入されます。

provider plugin は、OpenClaw 所有の完全なプロンプトを置き換えることなく、キャッシュを意識したプロンプトガイダンスを提供できます。provider ランタイムでは次のことが可能です。

- 少数の名前付きコアセクション（`interaction_style`、`tool_call_style`、`execution_bias`）を置き換える
- プロンプトキャッシュ境界の上に **安定したプレフィックス** を注入する
- プロンプトキャッシュ境界の下に **動的なサフィックス** を注入する

model ファミリー固有のチューニングには provider 所有の提供内容を使ってください。従来の `before_prompt_build` によるプロンプト変更は、互換性のため、または本当にグローバルなプロンプト変更のために維持し、通常の provider 動作には使わないでください。

OpenAI GPT-5 ファミリーのオーバーレイは、コアの実行ルールを小さく保ちながら、ペルソナ固定、簡潔な出力、ツールの規律、並列ルックアップ、成果物の網羅性、検証、不足コンテキスト、ターミナルツールの衛生に関する model 固有ガイダンスを追加します。

## 構造

プロンプトは意図的にコンパクトで、固定セクションを使用します。

- **Tooling**: 構造化ツールの信頼できる唯一の情報源に関するリマインダーと、実行時のツール使用ガイダンス。
- **Execution Bias**: コンパクトな完遂ガイダンス。実行可能な要求にはそのターンで対応すること、完了またはブロックされるまで続行すること、弱いツール結果から回復すること、変更可能な状態をライブで確認すること、最終化前に検証すること。
- **Safety**: 権力追求的な振る舞いや監督の回避を避けるための短いガードレールのリマインダー。
- **Skills**（利用可能な場合）: 必要時に skill 指示を読み込む方法を model に伝えます。
- **OpenClaw Self-Update**: `config.schema.lookup` で安全に config を確認する方法、`config.patch` で config にパッチを当てる方法、`config.apply` で config 全体を置き換える方法、および `update.run` は明示的なユーザー要求がある場合にのみ実行すること。owner 専用の `gateway` ツールも、`tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。これには、それらの保護された exec パスに正規化される従来の `tools.bash.*` エイリアスも含まれます。
- **Workspace**: 作業ディレクトリ（`agents.defaults.workspace`）。
- **Documentation**: OpenClaw ドキュメントのローカルパス（repo または npm package）と、それを読むべきタイミング。
- **Workspace Files (injected)**: ブートストラップファイルが下に含まれていることを示します。
- **Sandbox**（有効時）: sandbox 化されたランタイム、sandbox パス、および昇格された exec が利用可能かどうかを示します。
- **Current Date & Time**: ユーザーのローカル時刻、タイムゾーン、時刻形式。
- **Reply Tags**: サポートされる provider 向けの任意の reply tag 構文。
- **Heartbeats**: デフォルトエージェントで heartbeat が有効な場合の heartbeat プロンプトと ack の動作。
- **Runtime**: ホスト、OS、node、model、repo ルート（検出された場合）、thinking レベル（1 行）。
- **Reasoning**: 現在の可視性レベルと `/reasoning` 切り替えのヒント。

Tooling セクションには、長時間実行される作業に対する実行時ガイダンスも含まれます。

- 将来のフォローアップ（`check back later`、リマインダー、定期作業）には、`exec` の sleep ループ、`yieldMs` の遅延トリック、反復的な `process` ポーリングではなく cron を使う
- `exec` / `process` は、今すぐ開始してバックグラウンドで継続実行されるコマンドにのみ使う
- 自動完了 wake が有効な場合は、コマンドを一度だけ開始し、出力または失敗時の push ベース wake 経路に依存する
- 実行中コマンドのログ、状態、入力、介入を確認する必要がある場合は `process` を使う
- タスクがより大きい場合は `sessions_spawn` を優先する。sub-agent の完了は push ベースで、要求元に自動通知される
- 完了待ちのためだけに `subagents list` / `sessions_list` をループでポーリングしない

実験的な `update_plan` ツールが有効な場合、Tooling ではさらに、重要で複数ステップの作業にのみそれを使うこと、`in_progress` のステップを常に 1 つだけ保つこと、更新のたびに計画全体を繰り返さないことを model に伝えます。

システムプロンプト内の Safety ガードレールは助言的なものです。これらは model の振る舞いを導きますが、ポリシーを強制するものではありません。厳格な強制には、ツールポリシー、exec 承認、sandbox 化、チャネル許可リストを使用してください。運用者は設計上これらを無効化できます。

ネイティブの承認カード/ボタンがあるチャネルでは、ランタイムプロンプトはまずそのネイティブ承認 UI に依存するようエージェントに伝えるようになりました。手動の `/approve` コマンドを含めるのは、ツール結果でチャット承認が利用できないと示された場合、または手動承認が唯一の経路である場合のみです。

## プロンプトモード

OpenClaw は、sub-agent 向けにより小さいシステムプロンプトを描画できます。ランタイムは実行ごとに `promptMode` を設定します（ユーザー向けの設定ではありません）。

- `full`（デフォルト）: 上記のすべてのセクションを含みます。
- `minimal`: sub-agent に使用されます。**Skills**、**Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、**Messaging**、**Silent Replies**、**Heartbeats** を省略します。Tooling、**Safety**、Workspace、Sandbox、Current Date & Time（既知の場合）、Runtime、および注入されたコンテキストは引き続き利用できます。
- `none`: ベースの識別行のみを返します。

`promptMode=minimal` の場合、追加で注入されるプロンプトは **Group Chat Context** ではなく **Subagent Context** とラベル付けされます。

## Workspace ブートストラップ注入

ブートストラップファイルは切り詰められたうえで **Project Context** の下に追加されるため、model は明示的な読み取りを行わなくても、識別情報とプロファイルコンテキストを把握できます。

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（新規ワークスペースでのみ）
- `MEMORY.md` が存在する場合はそれを、存在しない場合は小文字のフォールバックとして `memory.md`

これらのファイルはすべて、ファイル固有のゲートが適用されない限り、毎ターン **コンテキストウィンドウに注入** されます。`HEARTBEAT.md` は、デフォルトエージェントで heartbeat が無効な通常実行時、または `agents.defaults.heartbeat.includeSystemPromptSection` が false の場合は省略されます。注入ファイルは簡潔に保ってください。特に `MEMORY.md` は時間とともに肥大化しやすく、予期しない高いコンテキスト使用量や、より頻繁な Compaction につながる可能性があります。

> **注:** `memory/*.md` の日次ファイルは、通常のブートストラップ Project Context の一部 **ではありません**。通常のターンでは `memory_search` と `memory_get` ツールを通じて必要時にアクセスされるため、model が明示的にそれらを読まない限りコンテキストウィンドウを消費しません。例外は素の `/new` および `/reset` ターンです。この最初のターンでは、ランタイムが最近の日次メモリを 1 回限りの起動コンテキストブロックとして前置できる場合があります。

大きなファイルはマーカー付きで切り詰められます。ファイルごとの最大サイズは `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）で制御されます。ファイル全体で注入されるブートストラップ内容の総量は `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で制限されます。存在しないファイルは短い missing-file マーカーを注入します。切り詰めが発生した場合、OpenClaw は Project Context に警告ブロックを注入できます。これを制御するのが `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`。デフォルト: `once`）です。

sub-agent セッションでは `AGENTS.md` と `TOOLS.md` のみが注入されます（他のブートストラップファイルは、sub-agent コンテキストを小さく保つために除外されます）。

内部 hook は `agent:bootstrap` を介してこのステップを横取りし、注入されるブートストラップファイルを変更または置換できます（たとえば `SOUL.md` を別のペルソナに差し替えるなど）。

エージェントの話し方をより汎用的でなくしたい場合は、まず [SOUL.md Personality Guide](/ja-JP/concepts/soul) から始めてください。

各注入ファイルがどれだけ寄与しているか（生のサイズと注入後サイズ、切り詰め、さらにツールスキーマのオーバーヘッド）を確認するには、`/context list` または `/context detail` を使用してください。[Context](/ja-JP/concepts/context) を参照してください。

## 時刻の扱い

ユーザーのタイムゾーンがわかっている場合、システムプロンプトには専用の **Current Date & Time** セクションが含まれます。プロンプトキャッシュを安定させるため、現在は **タイムゾーン** のみを含めます（動的な時計や時刻形式は含みません）。

エージェントが現在時刻を必要とする場合は `session_status` を使用してください。ステータスカードにはタイムスタンプ行が含まれます。同じツールでセッション単位の model 上書きも設定できます（`model=default` で解除）。

設定項目:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完全な動作の詳細は [Date & Time](/ja-JP/date-time) を参照してください。

## Skills

該当する Skills が存在する場合、OpenClaw は **利用可能な skill の一覧**（`formatSkillsForPrompt`）をコンパクトに注入します。この一覧には各 skill の **ファイルパス** が含まれます。プロンプトは、一覧にある場所（workspace、managed、または bundled）にある SKILL.md を読み込むために `read` を使うよう model に指示します。該当する skill がない場合、Skills セクションは省略されます。

該当性には、skill メタデータのゲート、ランタイム環境/config チェック、および `agents.defaults.skills` または `agents.list[].skills` が設定されている場合の有効なエージェント skill 許可リストが含まれます。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

これにより、ベースプロンプトを小さく保ちながら、対象を絞った skill 利用を可能にします。

skills 一覧の予算は skills サブシステムが所有します。

- グローバルデフォルト: `skills.limits.maxSkillsPromptChars`
- エージェント単位の上書き: `agents.list[].skillsLimits.maxSkillsPromptChars`

一般的な境界付きランタイム抜粋は別のサーフェスを使用します。

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

この分離により、skills のサイズ調整は、`memory_get`、ライブツール結果、Compaction 後の AGENTS.md リフレッシュなどのランタイム読み取り/注入サイズ調整とは独立したまま保たれます。

## Documentation

利用可能な場合、システムプロンプトには **Documentation** セクションが含まれ、OpenClaw ドキュメントディレクトリのローカルパス（repo ワークスペース内の `docs/` または同梱された npm package の docs）を指し示します。また、公開ミラー、ソース repo、コミュニティ Discord、Skills 発見のための ClawHub（[https://clawhub.ai](https://clawhub.ai)）についても記載します。プロンプトは、OpenClaw の動作、コマンド、設定、アーキテクチャについてはまずローカルドキュメントを参照し、可能であれば自分で `openclaw status` を実行するよう model に指示します（アクセスできない場合のみユーザーに尋ねます）。
