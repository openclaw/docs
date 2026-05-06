---
read_when:
    - 新しいアシスタントインスタンスのオンボーディング
    - 安全性と権限への影響を確認する
summary: 安全上の注意事項を含む、OpenClawをパーソナルアシスタントとして実行するためのエンドツーエンドガイド
title: パーソナルアシスタントのセットアップ
x-i18n:
    generated_at: "2026-05-06T05:18:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fea1194e6b9e8d8816cc712296940487b38faaabea463bd45ba1f37ff52d44d
    source_path: start/openclaw.md
    workflow: 16
---

OpenClaw は、Discord、Google Chat、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo などを AI エージェントに接続するセルフホスト型 Gateway です。このガイドでは、「パーソナルアシスタント」設定、つまり常時稼働する AI アシスタントのように振る舞う専用 WhatsApp 番号について説明します。

## ⚠️ まず安全性

エージェントを次のことができる位置に置くことになります。

- マシン上でコマンドを実行する（ツールポリシーによる）
- ワークスペース内のファイルを読み書きする
- WhatsApp/Telegram/Discord/Mattermost やその他の同梱チャンネル経由でメッセージを返信する

保守的に始めてください。

- 必ず `channels.whatsapp.allowFrom` を設定します（個人用 Mac で世界中に開放した状態で実行しないでください）。
- アシスタントには専用の WhatsApp 番号を使用します。
- Heartbeat は現在、既定で 30 分ごとに実行されます。設定を信頼できるまでは、`agents.defaults.heartbeat.every: "0m"` を設定して無効にしてください。

## 前提条件

- OpenClaw がインストールされ、オンボーディング済みであること - まだの場合は [はじめに](/ja-JP/start/getting-started) を参照してください
- アシスタント用の 2 つ目の電話番号（SIM/eSIM/プリペイド）

## 2 台の電話構成（推奨）

目標は次の構成です。

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

個人用 WhatsApp を OpenClaw にリンクすると、あなた宛てのすべてのメッセージが「エージェント入力」になります。多くの場合、それは望む挙動ではありません。

## 5 分クイックスタート

1. WhatsApp Web をペアリングします（QR が表示されます。アシスタント用の電話でスキャンします）。

```bash
openclaw channels login
```

2. Gateway を起動します（起動したままにします）。

```bash
openclaw gateway --port 18789
```

3. 最小構成を `~/.openclaw/openclaw.json` に置きます。

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

これで、許可リストに入れた電話からアシスタント番号にメッセージを送ります。

オンボーディングが完了すると、OpenClaw はダッシュボードを自動で開き、クリーンな（トークン化されていない）リンクを出力します。ダッシュボードが認証を求める場合は、設定済みの共有シークレットを Control UI 設定に貼り付けてください。オンボーディングは既定でトークン（`gateway.auth.token`）を使用しますが、`gateway.auth.mode` を `password` に切り替えている場合はパスワード認証も機能します。後で再度開くには、`openclaw dashboard` を実行します。

## エージェントにワークスペースを与える（AGENTS）

OpenClaw は、ワークスペースディレクトリから操作指示と「メモリ」を読み込みます。

既定では、OpenClaw はエージェントワークスペースとして `~/.openclaw/workspace` を使用し、セットアップ時または初回エージェント実行時に自動で作成します（スターターの `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` も作成します）。`BOOTSTRAP.md` はワークスペースが完全に新規の場合にのみ作成されます（削除した後に再作成されるべきではありません）。`MEMORY.md` は任意です（自動作成されません）。存在する場合、通常セッションで読み込まれます。サブエージェントセッションでは `AGENTS.md` と `TOOLS.md` のみが注入されます。

<Tip>
このフォルダーを OpenClaw のメモリとして扱い、git リポジトリ（理想的にはプライベート）にして、`AGENTS.md` とメモリファイルをバックアップしてください。git がインストールされている場合、新規ワークスペースは自動で初期化されます。
</Tip>

```bash
openclaw setup
```

完全なワークスペース構成とバックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
メモリワークフロー: [メモリ](/ja-JP/concepts/memory)

任意: `agents.defaults.workspace` で別のワークスペースを選択します（`~` をサポート）。

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

すでに自分のワークスペースファイルをリポジトリから配布している場合は、ブートストラップファイルの作成を完全に無効化できます。

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## それを「アシスタント」にする設定

OpenClaw の既定値は良好なアシスタント設定ですが、通常は次を調整します。

- [`SOUL.md`](/ja-JP/concepts/soul) のペルソナ/指示
- 思考の既定値（必要な場合）
- Heartbeat（信頼できるようになってから）

例:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## セッションとメモリ

- セッションファイル: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- セッションメタデータ（トークン使用量、最後のルートなど）: `~/.openclaw/agents/<agentId>/sessions/sessions.json`（レガシー: `~/.openclaw/sessions/sessions.json`）
- `/new` または `/reset` は、そのチャットの新しいセッションを開始します（`resetTriggers` で設定可能）。単独で送信された場合、OpenClaw はモデルを呼び出さずにリセットを確認します。
- `/compact [instructions]` はセッションコンテキストを圧縮し、残りのコンテキスト予算を報告します。

## Heartbeat（プロアクティブモード）

既定では、OpenClaw は次のプロンプトで 30 分ごとに Heartbeat を実行します。
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
無効にするには `agents.defaults.heartbeat.every: "0m"` を設定します。

- `HEARTBEAT.md` が存在していても実質的に空（空行と `# Heading` のような Markdown 見出しのみ）の場合、OpenClaw は API 呼び出しを節約するために Heartbeat 実行をスキップします。
- ファイルが存在しない場合でも Heartbeat は実行され、モデルが何をするかを判断します。
- エージェントが `HEARTBEAT_OK` と返信した場合（短い余白付きでも可。`agents.defaults.heartbeat.ackMaxChars` を参照）、OpenClaw はその Heartbeat の外向き配信を抑制します。
- 既定では、DM 形式の `user:<id>` ターゲットへの Heartbeat 配信は許可されます。Heartbeat 実行を有効なまま直接ターゲット配信を抑制するには、`agents.defaults.heartbeat.directPolicy: "block"` を設定します。
- Heartbeat は完全なエージェントターンを実行します。間隔を短くすると、より多くのトークンを消費します。

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## メディアの入出力

受信添付ファイル（画像/音声/ドキュメント）は、テンプレート経由でコマンドに公開できます。

- `{{MediaPath}}`（ローカル一時ファイルパス）
- `{{MediaUrl}}`（疑似 URL）
- `{{Transcript}}`（音声文字起こしが有効な場合）

エージェントからの送信添付ファイル: 単独行で `MEDIA:<path-or-url>` を含めます（スペースなし）。例:

```
Here's the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw はこれらを抽出し、テキストと一緒にメディアとして送信します。

ローカルパスの挙動は、エージェントと同じファイル読み取り信頼モデルに従います。

- `tools.fs.workspaceOnly` が `true` の場合、送信 `MEDIA:` のローカルパスは OpenClaw 一時ルート、メディアキャッシュ、エージェントワークスペースパス、サンドボックス生成ファイルに制限されたままです。
- `tools.fs.workspaceOnly` が `false` の場合、送信 `MEDIA:` はエージェントがすでに読み取りを許可されているホストローカルファイルを使用できます。
- ローカルパスは、絶対パス、ワークスペース相対パス、または `~/` を使ったホーム相対パスにできます。
- ホストローカル送信では、引き続きメディアと安全なドキュメント種類（画像、音声、動画、PDF、Office ドキュメント）のみが許可されます。プレーンテキストやシークレットのようなファイルは、送信可能なメディアとして扱われません。

つまり、fs ポリシーがすでにそれらの読み取りを許可している場合、ワークスペース外の生成画像/ファイルも送信できるようになり、任意のホストテキスト添付ファイルの持ち出しを再度開放することはありません。

## 運用チェックリスト

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

ログは `/tmp/openclaw/` 配下にあります（既定: `openclaw-YYYY-MM-DD.log`）。

## 次のステップ

- WebChat: [WebChat](/ja-JP/web/webchat)
- Gateway 運用: [Gateway ランブック](/ja-JP/gateway)
- Cron + ウェイクアップ: [Cron ジョブ](/ja-JP/automation/cron-jobs)
- macOS メニューバーコンパニオン: [OpenClaw macOS アプリ](/ja-JP/platforms/macos)
- iOS ノードアプリ: [iOS アプリ](/ja-JP/platforms/ios)
- Android ノードアプリ: [Android アプリ](/ja-JP/platforms/android)
- Windows の状態: [Windows (WSL2)](/ja-JP/platforms/windows)
- Linux の状態: [Linux アプリ](/ja-JP/platforms/linux)
- セキュリティ: [セキュリティ](/ja-JP/gateway/security)

## 関連

- [はじめに](/ja-JP/start/getting-started)
- [セットアップ](/ja-JP/start/setup)
- [チャンネル概要](/ja-JP/channels)
