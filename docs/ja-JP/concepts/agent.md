---
read_when:
    - エージェントランタイム、ワークスペースブートストラップ、またはセッション動作の変更
summary: エージェントランタイム、ワークスペース契約、セッションブートストラップ
title: エージェントランタイム
x-i18n:
    generated_at: "2026-05-06T05:00:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw は Gateway ごとに 1 つのエージェントプロセスとして、**単一の埋め込みエージェントランタイム**を実行します。各プロセスは独自のワークスペース、ブートストラップファイル、セッションストアを持ちます。このページでは、そのランタイム契約を扱います。ワークスペースに必要な内容、挿入されるファイル、セッションがそれを使ってどのようにブートストラップされるかを説明します。

## ワークスペース（必須）

OpenClaw は単一のエージェントワークスペースディレクトリ（`agents.defaults.workspace`）を、ツールとコンテキスト用のエージェントの**唯一の**作業ディレクトリ（`cwd`）として使用します。

推奨: `~/.openclaw/openclaw.json` がない場合は、`openclaw setup` を使って作成し、ワークスペースファイルを初期化してください。

完全なワークスペース構成とバックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、main 以外のセッションは
`agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのワークスペースでこれを上書きできます（[Gateway 設定](/ja-JP/gateway/configuration)を参照）。

## ブートストラップファイル（挿入）

`agents.defaults.workspace` 内で、OpenClaw は次のユーザー編集可能なファイルを想定します。

- `AGENTS.md` - 操作手順 + 「メモリ」
- `SOUL.md` - ペルソナ、境界、トーン
- `TOOLS.md` - ユーザーが管理するツールメモ（例: `imsg`、`sag`、規約）
- `BOOTSTRAP.md` - 初回実行時の一度きりのリチュアル（完了後に削除）
- `IDENTITY.md` - エージェント名/雰囲気/絵文字
- `USER.md` - ユーザープロファイル + 希望する呼びかけ方

新しいセッションの最初のターンで、OpenClaw はこれらのファイルの内容をシステムプロンプトの Project Context に挿入します。

空のファイルはスキップされます。大きなファイルはプロンプトを軽量に保つため、マーカー付きで短縮および切り詰められます（全文はファイルを読んでください）。

ファイルがない場合、OpenClaw は単一の「missing file」マーカー行を挿入します（また、`openclaw setup` は安全なデフォルトテンプレートを作成します）。

`BOOTSTRAP.md` は、**完全に新しいワークスペース**（他のブートストラップファイルが存在しない）の場合にのみ作成されます。未完了の間、OpenClaw はこれを Project Context に保持し、ユーザーメッセージへコピーする代わりに、初回リチュアル用のシステムプロンプトブートストラップガイダンスを追加します。リチュアル完了後にこれを削除した場合、以降の再起動で再作成されるべきではありません。

ブートストラップファイルの作成を完全に無効化するには（事前に用意済みのワークスペース向け）、次を設定します。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 組み込みツール

コアツール（read/exec/edit/write と関連するシステムツール）は、ツールポリシーの対象として常に利用できます。`apply_patch` は任意で、`tools.exec.applyPatch` によって制御されます。`TOOLS.md` はどのツールが存在するかを制御しません。これは、_あなた_がそれらをどのように使ってほしいかについてのガイダンスです。

## Skills

OpenClaw は次の場所から Skills を読み込みます（優先度が高い順）。

- ワークスペース: `<workspace>/skills`
- プロジェクトエージェント Skills: `<workspace>/.agents/skills`
- 個人エージェント Skills: `~/.agents/skills`
- 管理/ローカル: `~/.openclaw/skills`
- バンドル済み（インストールに同梱）
- 追加 Skills フォルダー: `skills.load.extraDirs`

Skills は設定/env で制御できます（[Gateway 設定](/ja-JP/gateway/configuration)の `skills` を参照）。

## ランタイム境界

埋め込みエージェントランタイムは Pi エージェントコア（モデル、ツール、プロンプトパイプライン）上に構築されています。セッション管理、検出、ツール配線、チャネル配信は、そのコアの上にある OpenClaw 所有のレイヤーです。

## セッション

セッショントランスクリプトは JSONL として次の場所に保存されます。

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッション ID は安定しており、OpenClaw によって選択されます。
他のツール由来のレガシーセッションフォルダーは読み取られません。

## ストリーミング中のステアリング

キューモードが `steer` の場合、受信メッセージは現在の実行に挿入されます。キューされたステアリングは、**現在のアシスタントターンがツール呼び出しの実行を終えた後**、次の LLM 呼び出しの前に配信されます。Pi は `steer` では保留中のすべてのステアリングメッセージをまとめて排出します。レガシーの `queue` はモデル境界ごとに 1 件のメッセージを排出します。ステアリングは、現在のアシスタントメッセージに残っているツール呼び出しをスキップしなくなりました。

キューモードが `followup` または `collect` の場合、受信メッセージは現在のターンが終了するまで保持され、その後キューされたペイロードで新しいエージェントターンが始まります。モードと境界の挙動については、[キュー](/ja-JP/concepts/queue)と[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

ブロックストリーミングは、完了したアシスタントブロックを完了次第送信します。これは
**デフォルトでオフ**です（`agents.defaults.blockStreamingDefault: "off"`）。
`agents.defaults.blockStreamingBreak` で境界を調整します（`text_end` と `message_end`。デフォルトは text_end）。
`agents.defaults.blockStreamingChunk` でソフトブロックのチャンク化を制御します（デフォルトは 800-1200 文字。段落区切り、次に改行を優先し、文は最後）。
`agents.defaults.blockStreamingCoalesce` でストリーミングされたチャンクを結合し、単一行スパムを減らします（送信前にアイドルベースでマージ）。Telegram 以外のチャネルでは、ブロック返信を有効化するために明示的な `*.blockStreaming: true` が必要です。
詳細なツール概要はツール開始時に出力されます（デバウンスなし）。Control UI は利用可能な場合、エージェントイベント経由でツール出力をストリーミングします。
詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## モデル参照

設定内のモデル参照（例: `agents.defaults.model` と `agents.defaults.models`）は、**最初の** `/` で分割して解析されます。

- モデルを設定するときは `provider/model` を使用します。
- モデル ID 自体に `/` が含まれる場合（OpenRouter 形式）、プロバイダープレフィックスを含めます（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に対して一意に一致する設定済みプロバイダーを試し、その後にのみ設定済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表面化する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。

## 設定（最小）

少なくとも次を設定します。

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強く推奨）

---

_次: [グループチャット](/ja-JP/channels/group-messages)_ 🦞

## 関連

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [セッション管理](/ja-JP/concepts/session)
