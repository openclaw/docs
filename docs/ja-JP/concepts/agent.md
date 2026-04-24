---
read_when:
    - エージェントランタイム、ワークスペースbootstrap、またはセッション動作を変更する
summary: エージェントランタイム、ワークスペース契約、セッションbootstrap
title: エージェントランタイム
x-i18n:
    generated_at: "2026-04-24T04:52:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

OpenClawは**単一の埋め込みagentランタイム**を実行します。つまり、
Gatewayごとに1つのagent processがあり、独自のworkspace、bootstrapファイル、
セッションストアを持ちます。このページでは、そのランタイム契約を説明します。workspaceに
何を含める必要があるか、どのファイルが注入されるか、そしてセッションがそれに対して
どのようにbootstrapされるかです。

## Workspace（必須）

OpenClawは、単一のagent workspaceディレクトリ（`agents.defaults.workspace`）を、ツールとコンテキストのためのagentの**唯一の**作業ディレクトリ（`cwd`）として使用します。

推奨: `openclaw setup` を使って、`~/.openclaw/openclaw.json` が存在しなければ作成し、workspaceファイルを初期化してください。

workspaceの完全なレイアウト + バックアップガイド: [Agent workspace](/ja-JP/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、main以外のセッションでは、
`agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのworkspaceでこれを上書きできます（
[Gateway configuration](/ja-JP/gateway/configuration) を参照）。

## Bootstrapファイル（注入される）

`agents.defaults.workspace` の中で、OpenClawは次のユーザー編集可能ファイルを想定します:

- `AGENTS.md` — 運用指示 + 「メモリ」
- `SOUL.md` — ペルソナ、境界、トーン
- `TOOLS.md` — ユーザー管理のツールメモ（例: `imsg`、`sag`、慣例）
- `BOOTSTRAP.md` — 初回実行時の一度きりの儀式（完了後に削除される）
- `IDENTITY.md` — agent名/雰囲気/絵文字
- `USER.md` — ユーザープロフィール + 呼ばれ方の希望

新しいセッションの最初のturnで、OpenClawはこれらのファイルの内容をagentコンテキストに直接注入します。

空ファイルはスキップされます。大きなファイルは、プロンプトを軽量に保つため、マーカー付きでトリム・切り詰めされます（全文はファイルを読んでください）。

ファイルが存在しない場合、OpenClawは「missing file」マーカー行を1行だけ注入します（また `openclaw setup` は安全なデフォルトテンプレートを作成します）。

`BOOTSTRAP.md` は、**まったく新しいworkspace**（他のbootstrapファイルが存在しない）に対してのみ作成されます。儀式完了後に削除した場合、後の再起動で再作成されるべきではありません。

bootstrapファイル作成を完全に無効化するには（事前投入済みworkspace向け）、次を設定します:

```json5
{ agent: { skipBootstrap: true } }
```

## 組み込みツール

コアツール（read/exec/edit/write と関連するsystemツール）は、ツールポリシーに従う限り常に利用可能です。`apply_patch` は任意で、`tools.exec.applyPatch` によって制御されます。`TOOLS.md` はどのツールが存在するかを制御しません。これは、それらを _あなたが_ どう使ってほしいかについてのガイダンスです。

## Skills

OpenClawは、次の場所からSkillsを読み込みます（優先度が高い順）:

- Workspace: `<workspace>/skills`
- Project agent Skills: `<workspace>/.agents/skills`
- Personal agent Skills: `~/.agents/skills`
- Managed/local: `~/.openclaw/skills`
- 同梱（インストールに含まれるもの）
- 追加のskillフォルダー: `skills.load.extraDirs`

Skillsはconfig/envによって制御できます（[Gateway configuration](/ja-JP/gateway/configuration) の `skills` を参照）。

## ランタイム境界

埋め込みagentランタイムは、Pi agent core（models、tools、prompt pipeline）上に構築されています。セッション管理、検出、ツール配線、チャンネル配信は、そのcoreの上にあるOpenClaw所有のレイヤーです。

## セッション

セッショントランスクリプトは、次の場所にJSONLとして保存されます:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッションIDは安定しており、OpenClawによって選ばれます。
他のツールからのレガシーセッションフォルダーは読み込まれません。

## Streaming中のSteering

キューモードが `steer` の場合、受信メッセージは現在の実行に注入されます。
キューされたsteeringは、**現在のassistant turnがそのツール呼び出しを実行し終えた後**、
次のLLM呼び出しの前に配信されます。steeringは、現在のassistantメッセージの残りの
ツール呼び出しをスキップしなくなりました。代わりに、次のmodel境界でキューされた
メッセージを注入します。

キューモードが `followup` または `collect` の場合、受信メッセージは
現在のturnが終わるまで保留され、その後キューされたペイロードで新しいagent turnが開始します。モード +
debounce/capの挙動は [Queue](/ja-JP/concepts/queue) を参照してください。

ブロックStreamingは、完了したassistant blockを、完了し次第すぐ送信します。これは
**デフォルトで無効**です（`agents.defaults.blockStreamingDefault: "off"`）。
境界は `agents.defaults.blockStreamingBreak`（`text_end` または `message_end`; デフォルトは text_end）で調整します。
ソフトなblock chunkingは `agents.defaults.blockStreamingChunk` で制御します（デフォルトは
800–1200文字。段落区切り、次に改行、最後に文末を優先）。
Streamingされたchunkを `agents.defaults.blockStreamingCoalesce` で結合し、
単一行のスパムを減らせます（送信前のアイドルベースのマージ）。Telegram以外のチャンネルでは、
block返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
詳細なツール要約はツール開始時に出力されます（debounceなし）。Control UIは
利用可能な場合、agentイベント経由でツール出力をStreamingします。
詳細: [Streaming + chunking](/ja-JP/concepts/streaming)。

## モデルref

config内のモデルref（たとえば `agents.defaults.model` と `agents.defaults.models`）は、**最初の** `/` で分割して解析されます。

- モデル設定では `provider/model` を使ってください。
- モデルID自体に `/` が含まれる場合（OpenRouterスタイル）は、provider prefixを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- providerを省略すると、OpenClawはまずaliasを試し、その後その厳密なモデルidに対する一意な
  configured-provider一致を試し、それでもだめなら
  configured default providerにフォールバックします。そのproviderがもはや設定済みの
  default modelを公開していない場合、OpenClawは古い削除済みprovider defaultを表面化する代わりに、
  最初に設定されたprovider/modelへフォールバックします。

## 設定（最小）

最低限、次を設定してください:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強く推奨）

---

_次: [Group Chats](/ja-JP/channels/group-messages)_ 🦞

## 関連

- [Agent workspace](/ja-JP/concepts/agent-workspace)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Session management](/ja-JP/concepts/session)
