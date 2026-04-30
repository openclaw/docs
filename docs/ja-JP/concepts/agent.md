---
read_when:
    - エージェントランタイム、ワークスペースのブートストラップ、またはセッション動作の変更
summary: エージェントランタイム、ワークスペース契約、セッションブートストラップ
title: エージェントランタイム
x-i18n:
    generated_at: "2026-04-30T05:06:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw は **単一の組み込みエージェントランタイム** を実行します。つまり、Gateway ごとに 1 つのエージェントプロセスがあり、それぞれに独自のワークスペース、ブートストラップファイル、セッションストアがあります。このページでは、そのランタイム契約、すなわちワークスペースに何が必要か、どのファイルが注入されるか、セッションがそれに対してどのようにブートストラップされるかを扱います。

## ワークスペース（必須）

OpenClaw は、単一のエージェントワークスペースディレクトリ（`agents.defaults.workspace`）を、ツールとコンテキスト用のエージェントの **唯一の** 作業ディレクトリ（`cwd`）として使用します。

推奨: `~/.openclaw/openclaw.json` がない場合は、`openclaw setup` を使用して作成し、ワークスペースファイルを初期化してください。

完全なワークスペース構成 + バックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、main 以外のセッションは、`agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのワークスペースでこれを上書きできます（[Gateway 設定](/ja-JP/gateway/configuration) を参照）。

## ブートストラップファイル（注入）

`agents.defaults.workspace` 内で、OpenClaw は次のユーザー編集可能ファイルを想定します。

- `AGENTS.md` — 運用指示 + 「メモリ」
- `SOUL.md` — ペルソナ、境界、トーン
- `TOOLS.md` — ユーザーが管理するツールメモ（例: `imsg`、`sag`、規約）
- `BOOTSTRAP.md` — 初回実行時のみの儀式（完了後に削除）
- `IDENTITY.md` — エージェント名/雰囲気/絵文字
- `USER.md` — ユーザープロファイル + 希望する呼び名

新しいセッションの最初のターンで、OpenClaw はこれらのファイルの内容をエージェントコンテキストに直接注入します。

空のファイルはスキップされます。大きなファイルはプロンプトを軽量に保つため、マーカー付きで切り詰められます（全文を確認するにはファイルを読んでください）。

ファイルがない場合、OpenClaw は単一の「ファイルが見つからない」マーカー行を注入します（また、`openclaw setup` は安全なデフォルトテンプレートを作成します）。

`BOOTSTRAP.md` は **完全に新しいワークスペース**（他のブートストラップファイルが存在しない場合）にのみ作成されます。儀式の完了後に削除した場合、以後の再起動時に再作成されるべきではありません。

事前に用意したワークスペース向けに、ブートストラップファイルの作成を完全に無効化するには、次を設定します。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 組み込みツール

コアツール（read/exec/edit/write および関連するシステムツール）は、ツールポリシーの範囲内で常に利用できます。`apply_patch` は任意で、`tools.exec.applyPatch` によって制御されます。`TOOLS.md` は、どのツールが存在するかを制御しません。これは、それらを _あなたが_ どのように使ってほしいかのガイダンスです。

## Skills

OpenClaw は次の場所から Skills を読み込みます（優先順位が高い順）。

- ワークスペース: `<workspace>/skills`
- プロジェクトエージェント Skills: `<workspace>/.agents/skills`
- 個人エージェント Skills: `~/.agents/skills`
- 管理/ローカル: `~/.openclaw/skills`
- バンドル済み（インストールに同梱）
- 追加 Skills フォルダー: `skills.load.extraDirs`

Skills は設定/env によって制御できます（[Gateway 設定](/ja-JP/gateway/configuration) の `skills` を参照）。

## ランタイム境界

組み込みエージェントランタイムは、Pi エージェントコア（モデル、ツール、プロンプトパイプライン）上に構築されています。セッション管理、検出、ツール配線、チャネル配信は、そのコアの上にある OpenClaw 所有のレイヤーです。

## セッション

セッショントランスクリプトは、JSONL として次に保存されます。

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッション ID は安定しており、OpenClaw によって選択されます。
他のツールのレガシーセッションフォルダーは読み込まれません。

## ストリーミング中のステアリング

キューモードが `steer` の場合、受信メッセージは現在の実行に注入されます。キューされたステアリングは、**現在のアシスタントターンがツール呼び出しの実行を完了した後**、次の LLM 呼び出しの前に配信されます。Pi は `steer` について保留中のステアリングメッセージをすべてまとめて排出します。レガシーの `queue` はモデル境界ごとに 1 件のメッセージを排出します。ステアリングは、現在のアシスタントメッセージ内の残りのツール呼び出しをスキップしなくなりました。

キューモードが `followup` または `collect` の場合、受信メッセージは現在のターンが終了するまで保持され、その後、キューされたペイロードで新しいエージェントターンが開始されます。モードと境界の動作については、[キュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

ブロックストリーミングは、完了したアシスタントブロックを終了次第送信します。これは **デフォルトでオフ** です（`agents.defaults.blockStreamingDefault: "off"`）。
境界は `agents.defaults.blockStreamingBreak` で調整します（`text_end` と `message_end`。デフォルトは text_end）。
ソフトブロックのチャンク化は `agents.defaults.blockStreamingChunk` で制御します（デフォルトは 800〜1200 文字。段落区切りを優先し、次に改行、最後に文）。
ストリーミングされたチャンクを `agents.defaults.blockStreamingCoalesce` で結合し、単一行の大量送信を減らします（送信前にアイドルベースでマージ）。Telegram 以外のチャネルでは、ブロック返信を有効化するために明示的な `*.blockStreaming: true` が必要です。
詳細なツール要約はツール開始時に出力されます（デバウンスなし）。Control UI は、利用可能な場合にエージェントイベント経由でツール出力をストリーミングします。
詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## モデル参照

設定内のモデル参照（例: `agents.defaults.model` と `agents.defaults.models`）は、**最初の** `/` で分割して解析されます。

- モデルを設定する場合は `provider/model` を使用します。
- モデル ID 自体に `/` が含まれる場合（OpenRouter スタイル）、プロバイダープレフィックスを含めます（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを試し、その後にのみ設定済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなった場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表面化するのではなく、最初の設定済み provider/model にフォールバックします。

## 設定（最小）

最低限、次を設定します。

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強く推奨）

---

_次: [グループチャット](/ja-JP/channels/group-messages)_ 🦞

## 関連

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [セッション管理](/ja-JP/concepts/session)
