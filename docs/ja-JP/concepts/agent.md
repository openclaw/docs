---
read_when:
    - エージェントランタイム、ワークスペースブートストラップ、またはセッションの動作を変更する
summary: エージェントランタイム、ワークスペースコントラクト、セッションブートストラップ
title: エージェントランタイム
x-i18n:
    generated_at: "2026-05-04T02:22:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw は **単一の組み込みエージェントランタイム** を実行します。つまり、Gateway ごとに 1 つのエージェントプロセスがあり、それぞれ独自のワークスペース、ブートストラップファイル、セッションストアを持ちます。このページでは、そのランタイム契約について説明します。ワークスペースに何を含める必要があるか、どのファイルが注入されるか、セッションがそれに対してどのようにブートストラップするかを扱います。

## ワークスペース（必須）

OpenClaw は、単一のエージェントワークスペースディレクトリ（`agents.defaults.workspace`）を、ツールとコンテキストにおけるエージェントの **唯一の** 作業ディレクトリ（`cwd`）として使用します。

推奨: `~/.openclaw/openclaw.json` がない場合は、`openclaw setup` を使用して作成し、ワークスペースファイルを初期化します。

完全なワークスペース構成 + バックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、main 以外のセッションは、`agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのワークスペースでこれを上書きできます（[Gateway 設定](/ja-JP/gateway/configuration)を参照）。

## ブートストラップファイル（注入）

`agents.defaults.workspace` の中で、OpenClaw は以下のユーザー編集可能なファイルを想定します。

- `AGENTS.md` — 操作指示 + 「メモリ」
- `SOUL.md` — ペルソナ、境界、トーン
- `TOOLS.md` — ユーザー管理のツールメモ（例: `imsg`、`sag`、規約）
- `BOOTSTRAP.md` — 初回実行時の一度きりの儀式（完了後に削除）
- `IDENTITY.md` — エージェント名/雰囲気/絵文字
- `USER.md` — ユーザープロフィール + 好みの呼び名

新しいセッションの最初のターンで、OpenClaw はこれらのファイルの内容をシステムプロンプトのプロジェクトコンテキストに注入します。

空のファイルはスキップされます。大きいファイルは、プロンプトを軽量に保つため、マーカー付きで短縮および切り詰められます（全文はファイルを読んでください）。

ファイルがない場合、OpenClaw は単一の「ファイル欠落」マーカー行を注入します（また、`openclaw setup` は安全なデフォルトテンプレートを作成します）。

`BOOTSTRAP.md` は **まったく新しいワークスペース**（他のブートストラップファイルが存在しない）に対してのみ作成されます。保留中の間、OpenClaw はこれをプロジェクトコンテキストに保持し、ユーザーメッセージにコピーする代わりに、初回儀式用のシステムプロンプトブートストラップガイダンスを追加します。儀式の完了後にこれを削除した場合、以降の再起動で再作成されるべきではありません。

ブートストラップファイル作成を完全に無効化するには（事前投入済みワークスペース向け）、次を設定します。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 組み込みツール

コアツール（read/exec/edit/write および関連するシステムツール）は、ツールポリシーに従う範囲で常に利用できます。`apply_patch` は任意であり、`tools.exec.applyPatch` によって制御されます。`TOOLS.md` はどのツールが存在するかを制御しません。これは、_あなた_ がそれらをどのように使ってほしいかについてのガイダンスです。

## Skills

OpenClaw は以下の場所から Skills を読み込みます（上ほど優先度が高い）。

- ワークスペース: `<workspace>/skills`
- プロジェクトエージェント Skills: `<workspace>/.agents/skills`
- 個人エージェント Skills: `~/.agents/skills`
- 管理/local: `~/.openclaw/skills`
- 同梱（インストールに含まれるもの）
- 追加 Skills フォルダー: `skills.load.extraDirs`

Skills は設定/env によって制御できます（[Gateway 設定](/ja-JP/gateway/configuration)の `skills` を参照）。

## ランタイム境界

組み込みエージェントランタイムは、Pi エージェントコア（モデル、ツール、プロンプトパイプライン）の上に構築されています。セッション管理、検出、ツール配線、チャネル配信は、そのコア上にある OpenClaw 所有のレイヤーです。

## セッション

セッショントランスクリプトは JSONL として次の場所に保存されます。

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッション ID は安定しており、OpenClaw によって選択されます。
他のツールのレガシーセッションフォルダーは読み込まれません。

## ストリーミング中のステアリング

キューモードが `steer` の場合、受信メッセージは現在の実行に注入されます。キューされたステアリングは、**現在のアシスタントターンがツール呼び出しの実行を終えた後**、次の LLM 呼び出しの前に配信されます。Pi は `steer` では保留中のすべてのステアリングメッセージをまとめて排出します。レガシーの `queue` はモデル境界ごとに 1 件のメッセージを排出します。ステアリングは、現在のアシスタントメッセージから残りのツール呼び出しをスキップしなくなりました。

キューモードが `followup` または `collect` の場合、受信メッセージは現在のターンが終了するまで保持され、その後、キューされたペイロードで新しいエージェントターンが開始されます。モードと境界の挙動については、[キュー](/ja-JP/concepts/queue)と[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

ブロックストリーミングは、完了したアシスタントブロックを完了次第送信します。これは **デフォルトでオフ** です（`agents.defaults.blockStreamingDefault: "off"`）。
境界は `agents.defaults.blockStreamingBreak` で調整します（`text_end` と `message_end`。デフォルトは text_end）。
ソフトブロックのチャンク化は `agents.defaults.blockStreamingChunk` で制御します（デフォルトは 800～1200 文字。段落区切りを優先し、次に改行、最後に文）。
ストリーミングされたチャンクを `agents.defaults.blockStreamingCoalesce` で結合し、1 行スパムを減らします（送信前にアイドルベースでマージ）。Telegram 以外のチャネルでは、ブロック返信を有効化するために明示的な `*.blockStreaming: true` が必要です。
詳細なツール要約はツール開始時に出力されます（デバウンスなし）。Control UI は、利用可能な場合、エージェントイベント経由でツール出力をストリーミングします。
詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## モデル参照

設定内のモデル参照（例: `agents.defaults.model` と `agents.defaults.models`）は、**最初の** `/` で分割して解析されます。

- モデルを設定するときは `provider/model` を使用します。
- モデル ID 自体に `/` が含まれる場合（OpenRouter 形式）、プロバイダープレフィックスを含めます（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを試し、その後で設定済みのデフォルトプロバイダーにフォールバックします。そのプロバイダーが設定済みのデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示する代わりに、最初に設定されたプロバイダー/モデルへフォールバックします。

## 設定（最小）

最低限、次を設定します。

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強く推奨）

---

_次へ: [グループチャット](/ja-JP/channels/group-messages)_ 🦞

## 関連

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [セッション管理](/ja-JP/concepts/session)
