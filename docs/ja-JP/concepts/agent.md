---
read_when:
    - エージェントランタイム、ワークスペースブートストラップ、またはセッション動作を変更する場合
summary: エージェントランタイム、ワークスペース契約、セッションブートストラップ
title: エージェントランタイム
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T13:45:06Z"
  model: gpt-5.4
  provider: openai
  source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
  source_path: concepts/agent.md
  workflow: 15
---

OpenClaw は **単一の埋め込みエージェントランタイム** を実行します。Gateway ごとに1つのエージェントプロセスがあり、それぞれ独自のワークスペース、ブートストラップファイル、セッションストアを持ちます。このページでは、そのランタイム契約を扱います。ワークスペースに何が必要か、どのファイルが注入されるか、そしてセッションがそれに対してどのようにブートストラップされるかを説明します。

## ワークスペース（必須）

OpenClaw は、単一のエージェントワークスペースディレクトリ（`agents.defaults.workspace`）を、ツールとコンテキストの **唯一の** 作業ディレクトリ（`cwd`）として使用します。

推奨: `openclaw setup` を使用して、`~/.openclaw/openclaw.json` が存在しない場合は作成し、ワークスペースファイルを初期化してください。

完全なワークスペースレイアウト + バックアップガイド: [Agent workspace](/ja-JP/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、メイン以外のセッションは、`agents.defaults.sandbox.workspaceRoot` の下にあるセッションごとのワークスペースでこれを上書きできます（[Gateway configuration](/ja-JP/gateway/configuration) を参照）。

## ブートストラップファイル（注入されるもの）

`agents.defaults.workspace` の中では、OpenClaw は次のユーザー編集可能ファイルを想定しています:

- `AGENTS.md` — 運用指示 + 「メモリ」
- `SOUL.md` — ペルソナ、境界、トーン
- `TOOLS.md` — ユーザー管理の Tool メモ（例: `imsg`、`sag`、慣習）
- `BOOTSTRAP.md` — 初回実行時の一度きりの儀式（完了後に削除）
- `IDENTITY.md` — エージェント名 / 雰囲気 / 絵文字
- `USER.md` — ユーザープロファイル + 希望する呼び方

新しいセッションの最初のターンで、OpenClaw はこれらのファイルの内容を直接エージェントコンテキストに注入します。

空のファイルはスキップされます。大きなファイルは、プロンプトを軽量に保つために、マーカー付きで切り詰め・省略されます（完全な内容はファイルを読んでください）。

ファイルが存在しない場合、OpenClaw は「missing file」を示す1行のマーカーを注入します（また、`openclaw setup` は安全なデフォルトテンプレートを作成します）。

`BOOTSTRAP.md` は、**完全に新しいワークスペース** に対してのみ作成されます（他のブートストラップファイルが存在しない場合）。儀式の完了後にこれを削除した場合、その後の再起動で再作成されるべきではありません。

ブートストラップファイルの作成自体を完全に無効にするには（事前投入済みワークスペース向け）、次を設定します:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 組み込み Tools

コア Tool（read/exec/edit/write および関連するシステム Tool）は、Tool ポリシーに従って常に利用可能です。`apply_patch` はオプションで、`tools.exec.applyPatch` によってゲートされます。`TOOLS.md` はどの Tool が存在するかを制御しません。これは、_あなたが_ Tool をどう使ってほしいかについてのガイダンスです。

## Skills

OpenClaw は、次の場所から Skills を読み込みます（優先順位の高い順）:

- ワークスペース: `<workspace>/skills`
- プロジェクトエージェント Skills: `<workspace>/.agents/skills`
- 個人エージェント Skills: `~/.agents/skills`
- 管理対象/ローカル: `~/.openclaw/skills`
- バンドル済み（インストールに同梱）
- 追加の Skill フォルダー: `skills.load.extraDirs`

Skills は config/env によってゲートできます（[Gateway configuration](/ja-JP/gateway/configuration) の `skills` を参照）。

## ランタイム境界

埋め込みエージェントランタイムは、Pi エージェントコア（モデル、Tools、プロンプトパイプライン）の上に構築されています。セッション管理、検出、Tool 配線、チャネル配信は、そのコアの上にある OpenClaw 所有のレイヤーです。

## セッション

セッショントランスクリプトは、次の場所に JSONL として保存されます:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッション ID は安定しており、OpenClaw によって選ばれます。
他の Tool 由来のレガシーセッションフォルダーは読み込まれません。

## ストリーミング中のステアリング

キューモードが `steer` の場合、受信メッセージは現在の実行に注入されます。キューされたステアリングは、**現在のアシスタントターンが Tool 呼び出しの実行を終えた後**、次の LLM 呼び出しの前に配信されます。ステアリングは、現在のアシスタントメッセージの残りの Tool 呼び出しをスキップしなくなりました。代わりに、次のモデル境界でキューされたメッセージを注入します。

キューモードが `followup` または `collect` の場合、受信メッセージは現在のターンが終わるまで保持され、その後、キューされたペイロードで新しいエージェントターンが開始されます。モード + debounce/cap の動作については [Queue](/ja-JP/concepts/queue) を参照してください。

ブロックストリーミングは、完了したアシスタントブロックを終了次第すぐに送信します。これは **デフォルトではオフ** です（`agents.defaults.blockStreamingDefault: "off"`）。
境界は `agents.defaults.blockStreamingBreak`（`text_end` または `message_end`。デフォルトは text_end）で調整します。
ソフトなブロックチャンク化は `agents.defaults.blockStreamingChunk` で制御します（デフォルトは
800〜1200 文字。段落区切りを優先し、次に改行、最後に文で分割）。
ストリーミングされたチャンクを `agents.defaults.blockStreamingCoalesce` で結合すると、
単一行スパムを減らせます（送信前にアイドルベースでマージ）。Telegram 以外のチャネルでは、
ブロック返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
詳細な Tool サマリーは Tool 開始時に出力されます（debounce なし）。Control UI は、
利用可能な場合、agent event 経由で Tool 出力をストリームします。
詳細: [Streaming + chunking](/ja-JP/concepts/streaming)。

## モデル参照

config 内のモデル参照（たとえば `agents.defaults.model` や `agents.defaults.models`）は、**最初の** `/` で分割して解析されます。

- モデル設定時には `provider/model` を使用してください。
- モデル ID 自体に `/` が含まれる場合（OpenRouter スタイル）、provider プレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- provider を省略した場合、OpenClaw は最初にエイリアスを試し、その後、その正確なモデル ID に対する一意の設定済み provider 一致を試し、それでもなければ設定済みデフォルト provider にフォールバックします。その provider が設定済みデフォルトモデルをもう提供していない場合、OpenClaw は古い削除済み provider デフォルトをそのまま表面化する代わりに、最初に設定された provider/model にフォールバックします。

## 設定（最小）

最低限、次を設定してください:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強く推奨）

---

_次へ: [Group Chats](/ja-JP/channels/group-messages)_ 🦞

## 関連

- [Agent workspace](/ja-JP/concepts/agent-workspace)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Session management](/ja-JP/concepts/session)
