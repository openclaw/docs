---
read_when:
    - 新しいOpenClawエージェントセッションを開始する
    - デフォルトSkillsを有効化または監査する
summary: 個人アシスタント設定向けの、デフォルトのOpenClawエージェント命令とSkills一覧
title: デフォルト AGENTS.md
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:18:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - OpenClaw Personal Assistant（デフォルト）

## 初回実行（推奨）

OpenClawは、エージェント用の専用workspaceディレクトリを使います。デフォルト: `~/.openclaw/workspace`（`agents.defaults.workspace` で設定可能）。

1. workspaceを作成します（まだ存在しない場合）:

```bash
mkdir -p ~/.openclaw/workspace
```

2. デフォルトworkspaceテンプレートをworkspaceにコピーします:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 任意: 個人アシスタント用のSkills一覧が欲しい場合は、AGENTS.mdをこのファイルで置き換えます:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 任意: `agents.defaults.workspace` を設定して別のworkspaceを選びます（`~` をサポート）:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全なデフォルト

- ディレクトリやシークレットをチャットにダンプしない。
- 明示的に求められない限り、破壊的コマンドを実行しない。
- 外部メッセージングサーフェスには部分返信/ストリーミング返信を送らない（最終返信のみ）。

## セッション開始時（必須）

- `SOUL.md`、`USER.md`、および `memory/` 内の今日と昨日を読む。
- 存在する場合は `MEMORY.md` を読む。
- 応答する前に行う。

## Soul（必須）

- `SOUL.md` はidentity、tone、境界を定義する。常に最新に保つ。
- `SOUL.md` を変更した場合は、ユーザーに伝える。
- あなたは各セッションで新しいインスタンスであり、継続性はこれらのファイルに存在する。

## 共有空間（推奨）

- あなたはユーザー本人の声ではない。グループチャットや公開チャネルでは慎重に振る舞う。
- 個人データ、連絡先情報、内部メモを共有しない。

## メモリシステム（推奨）

- 日次ログ: `memory/YYYY-MM-DD.md`（必要なら `memory/` を作成）。
- 長期記憶: 永続的な事実、好み、意思決定には `MEMORY.md`。
- 小文字の `memory.md` は従来の修復入力専用。意図的に両方のrootファイルを保持しない。
- セッション開始時に、存在する場合は今日 + 昨日 + `MEMORY.md` を読む。
- 記録するもの: 意思決定、好み、制約、未完了事項。
- 明示的に要求されない限り、シークレットは避ける。

## ツールとSkills

- ツールはSkills内にある。必要になったら各skillの `SKILL.md` に従う。
- 環境固有のメモは `TOOLS.md`（Skills用ノート）に保持する。

## バックアップのヒント（推奨）

このworkspaceをClawdの「memory」として扱うなら、`AGENTS.md` とメモリファイルをバックアップするためにgit repo（できればprivate）にしてください。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClawが行うこと

- WhatsApp gateway + Pi coding agentを実行し、アシスタントがホストMac経由でチャットの読み書き、コンテキスト取得、Skills実行をできるようにする。
- macOSアプリは権限（screen recording、notifications、microphone）を管理し、バンドル済みバイナリ経由で `openclaw` CLIを公開する。
- ダイレクトチャットはデフォルトでエージェントの `main` セッションに集約される。グループは `agent:<agentId>:<channel>:group:<id>` として分離されたままになる（rooms/channels: `agent:<agentId>:<channel>:channel:<id>`）。Heartbeatはバックグラウンドタスクを維持する。

## コアSkills（Settings → Skills で有効化）

- **mcporter** — 外部skillバックエンドを管理するためのツールサーバーランタイム/CLI。
- **Peekaboo** — 任意のAI vision analysis付き高速macOSスクリーンショット。
- **camsnap** — RTSP/ONVIFセキュリティカメラからフレーム、クリップ、または動体アラートを取得する。
- **oracle** — セッション再生とbrowser制御を備えたOpenAI対応agent CLI。
- **eightctl** — ターミナルから睡眠を制御する。
- **imsg** — iMessage と SMS の送信、読み取り、ストリーミング。
- **wacli** — WhatsApp CLI: sync、search、send。
- **discord** — Discordアクション: react、stickers、polls。`user:<id>` または `channel:<id>` ターゲットを使うこと（プレフィックスなし数値idは曖昧）。
- **gog** — Google Suite CLI: Gmail、Calendar、Drive、Contacts。
- **spotify-player** — Spotifyの検索/キュー/再生制御を行うターミナルSpotifyクライアント。
- **sag** — macスタイルのsay UXを持つElevenLabs音声。デフォルトでスピーカーへストリームする。
- **Sonos CLI** — スクリプトからSonosスピーカー（discover/status/playback/volume/grouping）を制御する。
- **blucli** — スクリプトからBluOSプレイヤーを再生、グループ化、自動化する。
- **OpenHue CLI** — シーンや自動化向けのPhilips Hue照明制御。
- **OpenAI Whisper** — 素早いディクテーションとボイスメール文字起こし用のローカルspeech-to-text。
- **Gemini CLI** — 高速Q&A向けにターミナルからGoogle Geminiモデルを使う。
- **agent-tools** — 自動化と補助スクリプト向けユーティリティツールキット。

## 使用上の注意

- スクリプトには `openclaw` CLIを優先する。権限はmacアプリが管理する。
- インストールはSkillsタブから実行する。バイナリがすでに存在する場合はボタンが非表示になる。
- Heartbeatを有効のままにしておくと、アシスタントがリマインダーのスケジュール、受信トレイ監視、カメラ撮影のトリガーを行える。
- Canvas UIはネイティブオーバーレイ付きで全画面実行される。重要なコントロールを左上/右上/下端に置くのは避ける。レイアウトに明示的な余白を追加し、safe-area insetに依存しないこと。
- browser駆動の検証には、OpenClaw管理のChrome profileとともに `openclaw browser`（tabs/status/screenshot）を使う。
- DOM検査には `openclaw browser eval|query|dom|snapshot` を使う（機械出力が必要なら `--json` / `--out` も使う）。
- 操作には `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` を使う（click/typeにはsnapshot refが必要。CSS selectorには `evaluate` を使う）。

## 関連

- [Agent workspace](/ja-JP/concepts/agent-workspace)
- [Agent runtime](/ja-JP/concepts/agent)
