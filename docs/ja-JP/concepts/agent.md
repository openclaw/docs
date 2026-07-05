---
read_when:
    - エージェントランタイム、ワークスペースのブートストラップ、またはセッション動作の変更
summary: エージェントランタイム、ワークスペース契約、セッションブートストラップ
title: Agentランタイム
x-i18n:
    generated_at: "2026-07-05T11:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9c2468239d94e393246af28a38b1db602a5d665f0fb43e80def19acb5985093f
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw は 1 つの **組み込みエージェントランタイム** を同梱しています。これは組み込みのエージェントループ、ツール配線、プロンプト組み立てであり、外部ハーネスプロセスへターンを委譲するものとは別です。設定された各エージェント（複数を実行する場合は [マルチエージェントルーティング](/ja-JP/concepts/multi-agent) を参照）は、独自のワークスペース、ブートストラップファイル、セッションストアを持ちます。このページでは、そのランタイム契約を扱います。ワークスペースに含める必要があるもの、注入されるファイル、セッションがそれに対してどのようにブートストラップされるかです。

## ワークスペース（必須）

各エージェントは、単一のワークスペースディレクトリ（`agents.defaults.workspace`、またはエージェントごとの `agents.list[].workspace`）を、ツールとコンテキストの **唯一の** 作業ディレクトリ（`cwd`）として使用します。

推奨: `~/.openclaw/openclaw.json` がない場合は `openclaw setup` を使って作成し、ワークスペースファイルを初期化します。

完全なワークスペースレイアウト + バックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、main 以外のセッションは、`agents.defaults.sandbox.workspaceRoot` の下にあるセッションごとのワークスペースでこれを上書きできます（[Gateway 設定](/ja-JP/gateway/configuration) を参照）。

## ブートストラップファイル（注入）

ワークスペース内で、OpenClaw はこれらのユーザー編集可能なファイルを想定します。

| ファイル       | 目的                                                 |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | 操作指示 + 「メモリ」                               |
| `SOUL.md`      | ペルソナ、境界、トーン                              |
| `TOOLS.md`     | ユーザーが管理するツールメモと規約                  |
| `IDENTITY.md`  | エージェント名/雰囲気/絵文字                       |
| `USER.md`      | ユーザープロファイル + 希望する呼び方               |
| `HEARTBEAT.md` | Heartbeat 固有の指示                                |
| `BOOTSTRAP.md` | 初回実行時だけの儀式（完了後に削除）                |
| `MEMORY.md`    | 存在する場合のルート長期メモリファイル              |

新しいセッションの最初のターンで、OpenClaw はこれらのファイルの内容をシステムプロンプトの Project Context に注入します。`MEMORY.md` は、ワークスペースルートに存在する場合にのみ注入されます。

空のファイルはスキップされます。大きなファイルは、プロンプトを軽量に保つため、マーカー付きで切り詰められます（完全な内容はファイルを読んでください）。`MEMORY.md` 以外のファイルがない場合は、代わりに 1 行の「missing file」マーカーが注入されます。`openclaw setup` は、そのための安全なデフォルトテンプレートを作成します。

`BOOTSTRAP.md` は **まったく新しいワークスペース**（他のブートストラップファイルが存在しない場合）にのみ作成されます。保留中の間、OpenClaw はそれを Project Context に保持し、ユーザーメッセージへコピーする代わりに、初期儀式向けのシステムプロンプトのブートストラップガイダンスを追加します。儀式を完了した後に削除すると、後の再起動で再作成されることはありません。

ワークスペースが一度観測されると、OpenClaw はそのワークスペースパスに対する state-dir 証明マーカーも保持します。最近証明されたワークスペースが消えたり消去されたりした場合、起動時に `BOOTSTRAP.md` を黙って再シードすることは拒否されます。ワークスペースを復元するか、完全なオンボーディングリセットを使ってワークスペースとマーカーを一緒にクリアしてください。

ブートストラップファイル作成を完全に無効化するには（事前にシード済みのワークスペース向け）、次を設定します。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 組み込みツール

コアツール（read/exec/edit/write および関連するシステムツール）は、ツールポリシーの範囲内で常に利用できます。`apply_patch` は OpenAI モデルではデフォルトで有効で、`tools.exec.applyPatch`（`enabled`、`workspaceOnly`、`allowModels`）によって制御されます。`TOOLS.md` は、どのツールが存在するかを制御するものでは**ありません**。これは、_あなたが_ それらをどう使ってほしいかのガイダンスです。

## Skills

OpenClaw は、次の場所から Skills を読み込みます（上ほど優先度が高い）。

- ワークスペース: `<workspace>/skills`
- プロジェクトエージェント Skills: `<workspace>/.agents/skills`
- 個人エージェント Skills: `~/.agents/skills`
- 管理/local: `~/.openclaw/skills`
- バンドル（インストールに同梱）
- 追加の Skill フォルダー: `skills.load.extraDirs`

Skill ルートには、`<workspace>/skills/personal/foo/SKILL.md` のようなグループ化フォルダーを含められます。この Skill は、それでも frontmatter のフラットな名前、たとえば `foo` として公開されます。

Skills は config/env で制御できます（[Gateway 設定](/ja-JP/gateway/configuration) の `skills` を参照）。

## ランタイム境界

組み込みエージェントランタイムは OpenClaw が所有します。モデル検出、ツール配線、プロンプト組み立て、セッション管理、チャネル配信は、1 つの統合されたランタイムサーフェスを共有します。

## セッション

セッショントランスクリプトは JSONL として次に保存されます。

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッション ID は安定しており、OpenClaw によって選択されます。OpenClaw は他のツールのセッションフォルダーを読みません。

## ストリーミング中のステアリング

実行中に到着した受信プロンプトは、デフォルトで現在の実行へステアリングされます。ステアリングは、**現在のアシスタントターンがツール呼び出しの実行を完了した後**、次の LLM 呼び出しの前に届けられ、現在のアシスタントメッセージに残っているツール呼び出しをスキップしなくなりました。

`/queue steer` は、アクティブ実行のデフォルト動作です。`/queue followup` と `/queue collect` は、ステアリングする代わりに、後のターンまでメッセージを待機させます。`/queue interrupt` は、代わりにアクティブな実行を中止します。キューと境界の動作については、[Queue](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

ブロックストリーミングは、完了したアシスタントブロックを完了し次第送信します。これは **デフォルトでオフ** です（`agents.defaults.blockStreamingDefault: "off"`）。
境界は `agents.defaults.blockStreamingBreak`（`text_end` と `message_end`。デフォルトは `text_end`）で調整します。
ソフトブロックのチャンク化は `agents.defaults.blockStreamingChunk` で制御します（デフォルトは 800-1200 文字。段落区切りを優先し、次に改行、最後に文）。
ストリーミングされたチャンクは `agents.defaults.blockStreamingCoalesce` で結合し、単一行のスパムを減らします（送信前のアイドルベースのマージ）。Telegram 以外のチャネルでは、ブロック返信を有効にするために明示的な `*.blockStreaming: true` が必要です。
詳細なツールサマリーはツール開始時に出力されます（デバウンスなし）。Control UI は、利用可能な場合にエージェントイベントを介してツール出力をストリーミングします。
詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## モデル参照

設定内のモデル参照（例: `agents.defaults.model` と `agents.defaults.models`）は、**最初の** `/` で分割して解析されます。

- モデルを設定するときは `provider/model` を使います。
- モデル ID 自体に `/` が含まれる場合（OpenRouter 形式）、プロバイダープレフィックスを含めます（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを試し、その後にのみ設定済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなった場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表面化するのではなく、最初の設定済みプロバイダー/モデルへフォールバックします。

## 設定（最小）

最低限、次を設定します。

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強く推奨）

## 関連

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [セッション管理](/ja-JP/concepts/session)
- [グループチャット](/ja-JP/channels/group-messages)
