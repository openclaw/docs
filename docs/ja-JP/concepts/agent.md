---
read_when:
    - エージェントランタイム、ワークスペースブートストラップ、またはセッション動作の変更
summary: Agent ランタイム、ワークスペース契約、セッションブートストラップ
title: エージェントランタイム
x-i18n:
    generated_at: "2026-06-27T11:06:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw は **単一の組み込みエージェントランタイム** を実行します。Gateway ごとに 1 つのエージェントプロセスがあり、それぞれ独自のワークスペース、ブートストラップファイル、セッションストアを持ちます。このページでは、そのランタイム契約を扱います。ワークスペースに何が必要か、どのファイルが注入されるか、セッションがそれに対してどのようにブートストラップするかです。

## ワークスペース (必須)

OpenClaw は、単一のエージェントワークスペースディレクトリ (`agents.defaults.workspace`) を、ツールとコンテキスト用のエージェントの **唯一の** 作業ディレクトリ (`cwd`) として使用します。

推奨: `openclaw setup` を使用して、存在しない場合は `~/.openclaw/openclaw.json` を作成し、ワークスペースファイルを初期化してください。

完全なワークスペース構成 + バックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、メイン以外のセッションは `agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのワークスペースでこれを上書きできます ([Gateway 設定](/ja-JP/gateway/configuration) を参照)。

## ブートストラップファイル (注入)

`agents.defaults.workspace` 内で、OpenClaw は以下のユーザー編集可能なファイルを想定しています。

- `AGENTS.md` - 運用指示 + 「メモリ」
- `SOUL.md` - ペルソナ、境界、トーン
- `TOOLS.md` - ユーザー管理のツールメモ (例: `imsg`、`sag`、規約)
- `BOOTSTRAP.md` - 一度だけの初回実行リチュアル (完了後に削除)
- `IDENTITY.md` - エージェント名/雰囲気/絵文字
- `USER.md` - ユーザープロフィール + 希望する呼び方

新しいセッションの最初のターンで、OpenClaw はこれらのファイルの内容をシステムプロンプトのプロジェクトコンテキストに注入します。

空のファイルはスキップされます。大きなファイルは、プロンプトを軽量に保つためにマーカー付きで短縮および切り詰められます (完全な内容はファイルを読んでください)。

ファイルが存在しない場合、OpenClaw は単一の「missing file」マーカー行を注入します (そして `openclaw setup` は安全なデフォルトテンプレートを作成します)。

`BOOTSTRAP.md` は **まったく新しいワークスペース** (他のブートストラップファイルが存在しない) に対してのみ作成されます。保留中の間、OpenClaw はこれをプロジェクトコンテキストに保持し、ユーザーメッセージへコピーする代わりに、初期リチュアル用のシステムプロンプトのブートストラップガイダンスを追加します。リチュアル完了後に削除した場合、以後の再起動で再作成されるべきではありません。

ワークスペースが観測された後、OpenClaw はそのワークスペースパスに対する state-dir の証明マーカーも保持します。最近証明されたワークスペースが消失または消去された場合、起動時に `BOOTSTRAP.md` を黙って再シードすることを拒否します。ワークスペースを復元するか、完全なオンボーディングリセットを使用して、ワークスペースとマーカーを一緒にクリアしてください。

ブートストラップファイル作成を完全に無効化するには (事前シード済みワークスペース向け)、次を設定します。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 組み込みツール

コアツール (read/exec/edit/write および関連するシステムツール) は、ツールポリシーに従う範囲で常に利用可能です。`apply_patch` は任意で、`tools.exec.applyPatch` によって制御されます。`TOOLS.md` は、どのツールが存在するかを制御しません。これは、_あなた_ がそれらをどのように使ってほしいかについてのガイダンスです。

## Skills

OpenClaw は以下の場所から Skills を読み込みます (上ほど優先度が高い)。

- ワークスペース: `<workspace>/skills`
- プロジェクトエージェント Skills: `<workspace>/.agents/skills`
- 個人エージェント Skills: `~/.agents/skills`
- 管理対象/ローカル: `~/.openclaw/skills`
- バンドル済み (インストールに同梱)
- 追加 Skill フォルダー: `skills.load.extraDirs`

Skill ルートには、`<workspace>/skills/personal/foo/SKILL.md` のようなグループ化されたフォルダーを含めることができます。その Skill は、たとえば `foo` のように、引き続きフラットな frontmatter 名で公開されます。

Skills は config/env によってゲートできます ([Gateway 設定](/ja-JP/gateway/configuration) の `skills` を参照)。

## ランタイム境界

組み込みエージェントランタイムは OpenClaw が所有します。モデル検出、ツール配線、プロンプト組み立て、セッション管理、チャネル配信は、1 つの統合されたランタイムサーフェスを共有します。

## セッション

セッショントランスクリプトは JSONL として次の場所に保存されます。

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッション ID は安定しており、OpenClaw によって選択されます。
他のツールからのレガシーセッションフォルダーは読み取られません。

## ストリーミング中のステアリング

実行中に到着した受信プロンプトは、デフォルトで現在の実行へステアリングされます。ステアリングは **現在のアシスタントターンがツール呼び出しの実行を終えた後**、次の LLM 呼び出しの前に配信され、現在のアシスタントメッセージに残っているツール呼び出しをスキップしなくなりました。

`/queue steer` は、アクティブ実行のデフォルト動作です。`/queue followup` と `/queue collect` は、メッセージをステアリングせずに後続ターンまで待機させます。`/queue interrupt` は、代わりにアクティブな実行を中止します。キューと境界の動作については、[Queue](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

ブロックストリーミングは、完了したアシスタントブロックを完了次第送信します。これは **デフォルトではオフ** です (`agents.defaults.blockStreamingDefault: "off"`)。
境界は `agents.defaults.blockStreamingBreak` で調整します (`text_end` 対 `message_end`; デフォルトは text_end)。
ソフトブロックのチャンク化は `agents.defaults.blockStreamingChunk` で制御します (デフォルトは 800-1200 文字。段落区切り、次に改行を優先し、文は最後)。
ストリーミングされたチャンクは `agents.defaults.blockStreamingCoalesce` で結合し、単一行のスパムを減らします (送信前のアイドルベースのマージ)。Telegram 以外のチャネルでは、ブロック返信を有効にするために明示的な `*.blockStreaming: true` が必要です。
詳細なツールサマリーはツール開始時に出力されます (デバウンスなし)。Control UI は、利用可能な場合にエージェントイベント経由でツール出力をストリーミングします。
詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## モデル参照

設定内のモデル参照 (例: `agents.defaults.model` と `agents.defaults.models`) は、**最初の** `/` で分割して解析されます。

- モデルを設定するときは `provider/model` を使用してください。
- モデル ID 自体に `/` が含まれる場合 (OpenRouter 形式)、プロバイダープレフィックスを含めてください (例: `openrouter/moonshotai/kimi-k2`)。
- プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを試し、その後でのみ設定済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなっている場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表面化させる代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。

## 設定 (最小)

最低限、次を設定してください。

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (強く推奨)

---

_次へ: [グループチャット](/ja-JP/channels/group-messages)_ 🦞

## 関連

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [セッション管理](/ja-JP/concepts/session)
