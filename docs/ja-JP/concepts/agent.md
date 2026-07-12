---
read_when:
    - エージェントランタイム、ワークスペースのブートストラップ、またはセッション動作の変更
summary: エージェントランタイム、ワークスペース契約、セッションのブートストラップ
title: エージェントランタイム
x-i18n:
    generated_at: "2026-07-12T14:28:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e7b07f6db62c001d43e223eee28911b0515e1528e4b15c6c3748e88eaf405cfc
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw には、1 つの **組み込みエージェントランタイム** が同梱されています。これは組み込みのエージェントループ、ツールの接続、プロンプトの組み立てで構成され、ターンを外部ハーネスプロセスに委譲する方式とは異なります。設定された各エージェント（複数実行する方法については[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照）には、それぞれ独自のワークスペース、ブートストラップファイル、セッションストアがあります。このページでは、そのランタイム契約について説明します。具体的には、ワークスペースに必要な内容、挿入されるファイル、セッションがそれらを使用してブートストラップされる仕組みを扱います。

## ワークスペース（必須）

各エージェントは、単一のワークスペースディレクトリ（`agents.defaults.workspace`、またはエージェントごとの `agents.list[].workspace`）を、ツールとコンテキストの **唯一の** 作業ディレクトリ（`cwd`）として使用します。

推奨: `~/.openclaw/openclaw.json` が存在しない場合は、`openclaw setup` を使用して作成し、ワークスペースファイルを初期化してください。

ワークスペースの完全なレイアウトとバックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、メイン以外のセッションでは、`agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのワークスペースでこれを上書きできます（[Gateway 設定](/ja-JP/gateway/configuration)を参照）。

## ブートストラップファイル（挿入）

OpenClaw は、ワークスペース内に次のユーザー編集可能なファイルがあることを想定します。

| ファイル       | 用途                                               |
| -------------- | -------------------------------------------------- |
| `AGENTS.md`    | 運用手順 + 「メモリ」                              |
| `SOUL.md`      | ペルソナ、境界、トーン                             |
| `TOOLS.md`     | ユーザーが管理するツールのメモと規約               |
| `IDENTITY.md`  | エージェント名、雰囲気、絵文字                     |
| `USER.md`      | ユーザープロファイル + 希望する呼び方              |
| `HEARTBEAT.md` | Heartbeat 固有の手順                               |
| `BOOTSTRAP.md` | 初回実行時に一度だけ行う手順（完了後に削除）       |
| `MEMORY.md`    | 存在する場合のルート長期メモリファイル             |

新しいセッションの最初のターンで、OpenClaw はこれらのファイルの内容をシステムプロンプトの Project Context に挿入します。`MEMORY.md` は、ワークスペースのルートに存在する場合にのみ挿入されます。

空のファイルはスキップされます。大きなファイルはプロンプトを簡潔に保つため、マーカー付きで切り詰められます（完全な内容についてはファイルを読み取ってください）。ファイルが存在しない場合（`MEMORY.md` を除く）は、代わりに 1 行の「ファイルがありません」マーカーが挿入されます。`openclaw setup` は、そのファイル用の安全なデフォルトテンプレートを作成します。

`BOOTSTRAP.md` は、**まったく新しいワークスペース**（ほかのブートストラップファイルが存在しない）に対してのみ作成されます。これが未完了の間、OpenClaw はファイルをユーザーメッセージにコピーする代わりに Project Context に保持し、最初の手順を実行するためのブートストラップガイダンスをシステムプロンプトに追加します。手順の完了後に削除すると、その後の再起動時には再作成されません。

ワークスペースが一度確認されると、OpenClaw はそのワークスペースパスに対する状態ディレクトリの証明マーカーも保持します。最近証明されたワークスペースが消失または消去された場合、起動時に `BOOTSTRAP.md` が暗黙に再生成されることはありません。ワークスペースを復元するか、完全なオンボーディングリセットを使用して、ワークスペースとマーカーを一緒に消去してください。

ブートストラップファイルの作成を完全に無効にするには（事前に用意されたワークスペース向け）、次のように設定します。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 組み込みツール

コアツール（read/exec/edit/write および関連するシステムツール）は、ツールポリシーの制約を受けますが、常に利用できます。OpenAI モデルでは `apply_patch` がデフォルトで有効であり、`tools.exec.applyPatch`（`enabled`、`workspaceOnly`、`allowModels`）によって制御されます。`TOOLS.md` は、どのツールが存在するかを制御するものではありません。これは、ツールをどのように使用してほしいかを示すガイダンスです。

## Skills

OpenClaw は、次の場所から Skills を読み込みます（優先順位の高い順）。

- ワークスペース: `<workspace>/skills`
- プロジェクトエージェントの Skills: `<workspace>/.agents/skills`
- 個人エージェントの Skills: `~/.agents/skills`
- 管理対象/ローカル: `~/.openclaw/skills`
- バンドル済み（インストールに同梱）
- 追加の Skills フォルダー: `skills.load.extraDirs`

Skills のルートには、`<workspace>/skills/personal/foo/SKILL.md` のようなグループ化されたフォルダーを含めることができます。その場合でも、その Skills はフロントマターにあるフラットな名前（例: `foo`）で公開されます。

Skills は設定/環境変数によって制限できます（[Gateway 設定](/ja-JP/gateway/configuration)の `skills` を参照）。

## ランタイムの境界

組み込みエージェントランタイムは OpenClaw が所有します。モデル検出、ツールの接続、プロンプトの組み立て、セッション管理、チャネル配信は、単一の統合されたランタイムサーフェスを共有します。

## セッション

セッション行は、エージェントごとの SQLite データベースに保存されます。

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

トランスクリプトの JSONL ファイルは、レガシー移行入力、削除またはリセットされたアーカイブ、インポート、エクスポート、サポート用アーティファクトとして、引き続き `~/.openclaw/agents/<agentId>/sessions/` 配下に置くことができます。アクティブなエージェント履歴は、セッション行とともに SQLite に保存されます。セッション ID は安定しており、OpenClaw によって選択されます。OpenClaw は、ほかのツールのセッションフォルダーを読み取りません。

## ストリーミング中のステアリング

実行中に届いた受信プロンプトは、デフォルトで現在の実行にステアリングされます。ステアリングは、**現在のアシスタントターンがツール呼び出しの実行を完了した後**、次の LLM 呼び出しの前に配信されます。現在のアシスタントメッセージに残っているツール呼び出しがスキップされることはなくなりました。

`/queue steer` は、アクティブな実行に対するデフォルト動作です。`/queue followup` と `/queue collect` では、メッセージはステアリングされず、後続のターンまで待機します。`/queue interrupt` は、代わりにアクティブな実行を中止します。キューと境界の動作については、[キュー](/ja-JP/concepts/queue)および[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

ブロックストリーミングでは、完了したアシスタントブロックを完了直後に送信します。これは **デフォルトでは無効** です（`agents.defaults.blockStreamingDefault: "off"`）。
境界は `agents.defaults.blockStreamingBreak`（`text_end` と `message_end`。デフォルトは `text_end`）で調整します。
ソフトブロックのチャンク分割は `agents.defaults.blockStreamingChunk` で制御します（デフォルトは 800～1200 文字。段落区切り、改行、文の順に優先）。
ストリーミングされたチャンクを `agents.defaults.blockStreamingCoalesce` で結合し、単一行の大量送信を減らせます（送信前にアイドル時間に基づいて結合）。Telegram 以外のチャネルでブロック応答を有効にするには、明示的に `*.blockStreaming: true` を設定する必要があります。
詳細なツール概要は、ツールの開始時に出力されます（デバウンスなし）。Control UI は、利用可能な場合、エージェントイベントを介してツール出力をストリーミングします。
詳細: [ストリーミング + チャンク分割](/ja-JP/concepts/streaming)。

## モデル参照

設定内のモデル参照（例: `agents.defaults.model` と `agents.defaults.models`）は、**最初の** `/` で分割して解析されます。

- モデルを設定するときは `provider/model` を使用します。
- モデル ID 自体に `/` が含まれる場合（OpenRouter 形式）は、プロバイダープレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw は最初にエイリアスを試し、次にその正確なモデル ID に対する一意の設定済みプロバイダーとの一致を試します。その後にのみ、設定済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなった場合、OpenClaw は削除済みプロバイダーの古いデフォルトをエラーとして提示する代わりに、最初に設定されたプロバイダー/モデルへフォールバックします。

## 設定（最小構成）

最低限、次を設定してください。

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強く推奨）

## 関連項目

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [セッション管理](/ja-JP/concepts/session)
- [グループチャット](/ja-JP/channels/group-messages)
