---
read_when:
    - システムプロンプトのテキスト、ツール一覧、または time/Heartbeat セクションを編集する場合
    - ワークスペースのブートストラップや Skills 注入の動作を変更する場合
summary: OpenClaw のシステムプロンプトに何が含まれ、どのように組み立てられるか
title: システムプロンプト
x-i18n:
    generated_at: "2026-04-24T04:55:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw は、エージェント実行ごとにカスタムのシステムプロンプトを構築します。このプロンプトは **OpenClaw 所有** であり、pi-coding-agent のデフォルトプロンプトは使用しません。

プロンプトは OpenClaw によって組み立てられ、各エージェント実行に注入されます。

プロバイダー Plugin は、
完全な OpenClaw 所有プロンプトを置き換えることなく、キャッシュ対応のプロンプトガイダンスを提供できます。プロバイダーランタイムは次を行えます。

- 名前付きコアセクションの小さな集合（`interaction_style`、
  `tool_call_style`、`execution_bias`）を置き換える
- プロンプトキャッシュ境界の上に **安定プレフィックス** を注入する
- プロンプトキャッシュ境界の下に **動的サフィックス** を注入する

プロバイダー所有の寄与は、モデルファミリー固有の調整に使用してください。レガシーの
`before_prompt_build` によるプロンプト変更は、互換性のため、または本当にグローバルなプロンプト変更のために残し、
通常のプロバイダー動作には使わないでください。

OpenAI GPT-5 ファミリー overlay は、コア実行ルールを小さく保ちつつ、
ペルソナ固定、簡潔な出力、ツール規律、並列検索、成果物の網羅性、検証、欠落コンテキスト、端末ツール衛生に関する
モデル固有ガイダンスを追加します。

## 構造

このプロンプトは意図的に簡潔で、固定セクションを使います。

- **ツール**: 構造化ツールの source-of-truth リマインダーと、ランタイムのツール使用ガイダンス。
- **実行バイアス**: 実行可能なリクエストはそのターン内で処理する、完了またはブロックされるまで継続する、弱いツール結果から回復する、可変状態はライブで確認する、最終化前に検証する、といった簡潔な遂行ガイダンス。
- **安全性**: 権力追求行動や監督の回避を避けるための短いガードレールリマインダー。
- **Skills**（利用可能な場合）: 必要に応じて skill の指示をロードする方法をモデルに伝えます。
- **OpenClaw 自己更新**: `config.schema.lookup` で安全に config を調べる方法、
  `config.patch` で config にパッチを当てる方法、`config.apply` で完全な
  config を置き換える方法、そして明示的なユーザー
  要求時にのみ `update.run` を実行する方法。オーナー専用の `gateway` ツールも、
  レガシーな `tools.bash.*`
  エイリアス（これらは保護された exec パスへ正規化されます）を含め、`tools.exec.ask` / `tools.exec.security` の書き換えを拒否します。
- **ワークスペース**: 作業ディレクトリ（`agents.defaults.workspace`）。
- **ドキュメント**: OpenClaw ドキュメントへのローカルパス（repo または npm package）と、それを読むべきタイミング。
- **ワークスペースファイル（注入済み）**: ブートストラップファイルが下に含まれていることを示します。
- **サンドボックス**（有効な場合）: サンドボックス化されたランタイム、サンドボックスパス、および特権 exec が利用可能かどうかを示します。
- **現在の日付と時刻**: ユーザーローカルの時刻、タイムゾーン、時刻形式。
- **返信タグ**: 対応プロバイダー向けの任意の返信タグ構文。
- **Heartbeats**: デフォルトエージェントで heartbeat が有効な場合の、heartbeat プロンプトと ack 動作。
- **ランタイム**: ホスト、OS、node、モデル、repo ルート（検出された場合）、thinking レベル（1 行）。
- **推論**: 現在の可視性レベル + `/reasoning` トグルのヒント。

ツールセクションには、長時間実行作業向けのランタイムガイダンスも含まれます。

- 将来のフォローアップ（`check back later`、リマインダー、定期作業）には
  `exec` の sleep ループ、`yieldMs` の遅延トリック、繰り返しの `process`
  ポーリングではなく Cron を使う
- 今すぐ開始してバックグラウンドで継続するコマンドにのみ `exec` / `process` を使う
- 自動完了 wake が有効な場合、コマンドは一度だけ開始し、
  出力または失敗時の push ベース wake 経路に頼る
- 実行中コマンドのログ、状態、入力、介入を確認する必要があるときは `process` を使う
- タスクが大きい場合は `sessions_spawn` を優先する。サブエージェント完了は
  push ベースで、依頼者へ自動通知される
- 完了待ちのためだけに `subagents list` / `sessions_list` をループでポーリングしない

実験的な `update_plan` ツールが有効な場合、ツールセクションではモデルに対し、
それを非自明な複数ステップ作業にのみ使うこと、`in_progress` ステップは常に 1 つだけに保つこと、
更新ごとに計画全体を繰り返さないことも伝えます。

システムプロンプト内の安全ガードレールは助言的です。モデルの挙動を導きますが、ポリシーを強制するものではありません。強制には tool policy、exec 承認、サンドボックス化、チャンネル許可リストを使用してください。オペレーターは設計上これらを無効化できます。

ネイティブな承認カード/ボタンを持つチャンネルでは、ランタイムプロンプトは現在、
エージェントにまずそのネイティブ承認 UI に頼るよう伝えます。手動の
`/approve` コマンドを含めるのは、tool 結果がチャット承認は利用できないと示す場合、または
手動承認が唯一の経路である場合に限るべきです。

## プロンプトモード

OpenClaw はサブエージェント向けに、より小さなシステムプロンプトをレンダリングできます。ランタイムは
各実行に `promptMode` を設定します（ユーザー向け config ではありません）。

- `full`（デフォルト）: 上記の全セクションを含みます。
- `minimal`: サブエージェントで使用されます。**Skills**、**Memory Recall**、**OpenClaw
  Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、
  **Messaging**、**Silent Replies**、**Heartbeats** を省略します。ツール、**安全性**、
  ワークスペース、サンドボックス、現在の日付と時刻（分かっている場合）、ランタイム、注入コンテキストは引き続き利用可能です。
- `none`: ベースの識別行だけを返します。

`promptMode=minimal` のとき、追加の注入プロンプトは **Group Chat Context** ではなく **Subagent
Context** とラベル付けされます。

## ワークスペースブートストラップ注入

ブートストラップファイルはトリミングされ、**Project Context** の下に追加されるため、モデルは明示的な読み取りなしでアイデンティティとプロファイルコンテキストを把握できます。

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（brand-new workspace のときのみ）
- 存在する場合は `MEMORY.md`

これらのファイルはすべて、**毎ターン context window に注入** されます。
ただしファイル固有のゲートが適用される場合を除きます。通常実行では
デフォルトエージェントで heartbeat が無効、または
`agents.defaults.heartbeat.includeSystemPromptSection` が false の場合、`HEARTBEAT.md` は省略されます。注入
ファイルは簡潔に保ってください。特に `MEMORY.md` は時間とともに大きくなり、
予想外にコンテキスト使用量が高くなったり、Compaction がより頻繁に起きたりする原因になります。

> **注:** `memory/*.md` の日次ファイルは、通常のブートストラップ
> Project Context の一部では**ありません**。通常ターンでは
> `memory_search` と `memory_get` ツールを通じて必要時にアクセスされるため、
> モデルが明示的に読まない限り context window を消費しません。生の `/new` と
> `/reset` ターンは例外で、ランタイムはその最初のターン用のワンショット startup-context ブロックとして、
> 最近の日次メモリを前置できることがあります。

大きなファイルはマーカー付きで切り詰められます。ファイルごとの最大サイズは
`agents.defaults.bootstrapMaxChars`（デフォルト: 12000）で制御されます。ファイル全体での注入ブートストラップ
総量は `agents.defaults.bootstrapTotalMaxChars`
（デフォルト: 60000）で上限設定されます。存在しないファイルは短い missing-file マーカーを注入します。切り詰めが
発生したとき、OpenClaw は Project Context に警告ブロックを注入できます。これは
`agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；
デフォルト: `once`）で制御します。

サブエージェントセッションでは `AGENTS.md` と `TOOLS.md` だけが注入されます（その他のブートストラップファイル
はサブエージェントコンテキストを小さく保つため除外されます）。

内部 hook は `agent:bootstrap` によってこのステップをインターセプトし、
注入されるブートストラップファイルを変更または置換できます（たとえば `SOUL.md` を別のペルソナと入れ替えるなど）。

エージェントの話し方をより一般的でないものにしたい場合は、
まず [SOUL.md Personality Guide](/ja-JP/concepts/soul) から始めてください。

各注入ファイルがどれだけ寄与しているか（生データ vs 注入後、切り詰め、さらに tool schema overhead）を確認するには、
`/context list` または `/context detail` を使用してください。[Context](/ja-JP/concepts/context) を参照してください。

## 時刻処理

システムプロンプトには、ユーザーのタイムゾーンが分かっている場合、専用の **現在の日付と時刻** セクションが含まれます。プロンプトキャッシュを安定させるため、現在は
**タイムゾーン** のみが含まれます（動的な時計や時刻形式は含まれません）。

エージェントが現在時刻を必要とする場合は `session_status` を使ってください。status card
にはタイムスタンプ行が含まれます。同じツールでは、任意でセッションごとのモデル
override も設定できます（`model=default` で解除）。

設定項目:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完全な動作詳細は [Date & Time](/ja-JP/date-time) を参照してください。

## Skills

対象となる Skills が存在する場合、OpenClaw は **利用可能な skills 一覧**
（`formatSkillsForPrompt`）をコンパクトに注入します。そこには各 skill の **ファイルパス** が含まれます。この
プロンプトは、ワークスペース、管理領域、またはバンドル済みの場所にある SKILL.md を、
列挙された場所から `read` を使ってロードするようモデルに指示します。対象 Skill がない場合は、
Skills セクションは省略されます。

対象判定には、skill メタデータゲート、ランタイム環境/config チェック、
および `agents.defaults.skills` または
`agents.list[].skills` が設定されている場合の実効エージェント skill allowlist が含まれます。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

これにより、ベースプロンプトを小さく保ちつつ、必要な Skill を狙って利用できます。

skills 一覧の予算は skills サブシステムが所有します。

- グローバルデフォルト: `skills.limits.maxSkillsPromptChars`
- エージェントごとの override: `agents.list[].skillsLimits.maxSkillsPromptChars`

一般的な境界付きランタイム抜粋は別のサーフェスを使います。

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

この分離により、skills のサイズ調整は `memory_get`、ライブ tool 結果、
post-compaction の AGENTS.md 更新などのランタイム読み取り/注入サイズ調整とは切り離されます。

## ドキュメント

利用可能な場合、システムプロンプトには **Documentation** セクションが含まれ、ローカルの
OpenClaw docs ディレクトリ（repo workspace の `docs/` またはバンドル済み npm
package docs）を指し示します。また、公開ミラー、ソース repo、コミュニティ Discord、および
Skills 発見用の ClawHub（[https://clawhub.ai](https://clawhub.ai)）も記載されます。このプロンプトは、OpenClaw の挙動、コマンド、設定、アーキテクチャについては、まずローカル docs を参照するようモデルに指示し、
可能であれば `openclaw status` を自分で実行し、アクセスできない場合にのみユーザーへ尋ねるようにします。

## 関連

- [Agent runtime](/ja-JP/concepts/agent)
- [Agent workspace](/ja-JP/concepts/agent-workspace)
- [Context engine](/ja-JP/concepts/context-engine)
