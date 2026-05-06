---
read_when:
    - 新しい OpenClaw エージェントセッションを開始する
    - デフォルト Skills の有効化または監査
summary: パーソナルアシスタント設定用のデフォルト OpenClaw エージェント指示と Skills 一覧
title: デフォルト AGENTS.md
x-i18n:
    generated_at: "2026-05-06T05:18:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ecfafd0bee8b18f5787a0b8e273ce281c40c7d2d5754f15daa1f2b7cc7ecad0
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## 初回実行（推奨）

OpenClaw はエージェント用に専用のワークスペースディレクトリを使用します。デフォルト: `~/.openclaw/workspace`（`agents.defaults.workspace` で設定可能）。

1. ワークスペースを作成します（まだ存在しない場合）。

```bash
mkdir -p ~/.openclaw/workspace
```

2. デフォルトのワークスペーステンプレートをワークスペースにコピーします。

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 任意: パーソナルアシスタントのスキル一覧が必要な場合は、AGENTS.md をこのファイルで置き換えます。

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 任意: `agents.defaults.workspace` を設定して別のワークスペースを選択します（`~` をサポート）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全性のデフォルト

- ディレクトリやシークレットをチャットに出力しない。
- 明示的に求められない限り、破壊的なコマンドを実行しない。
- 外部メッセージング面に部分的な返信やストリーミング返信を送信しない（最終返信のみ）。

## セッション開始（必須）

- `SOUL.md`、`USER.md`、および `memory/` 内の今日と昨日のファイルを読む。
- 存在する場合は `MEMORY.md` を読む。
- 返信する前に実行する。

## Soul（必須）

- `SOUL.md` はアイデンティティ、トーン、境界を定義します。最新の状態に保ってください。
- `SOUL.md` を変更した場合は、ユーザーに伝えてください。
- 各セッションでは新しいインスタンスです。継続性はこれらのファイルにあります。

## 共有スペース（推奨）

- あなたはユーザーの代弁者ではありません。グループチャットや公開チャンネルでは注意してください。
- 個人データ、連絡先情報、内部メモを共有しないでください。

## メモリーシステム（推奨）

- 日次ログ: `memory/YYYY-MM-DD.md`（必要に応じて `memory/` を作成）。
- 長期メモリー: 永続的な事実、好み、決定事項用の `MEMORY.md`。
- 小文字の `memory.md` はレガシー修復入力専用です。意図的に両方のルートファイルを保持しないでください。
- セッション開始時に、今日 + 昨日 + 存在する場合は `MEMORY.md` を読む。
- 記録対象: 決定事項、好み、制約、未解決事項。
- 明示的に求められない限り、シークレットは避ける。

## ツールとSkills

- ツールはSkills内にあります。必要な場合は各Skillの `SKILL.md` に従ってください。
- 環境固有のメモは `TOOLS.md`（Skills向けメモ）に保持してください。

## バックアップのヒント（推奨）

このワークスペースをClawdの「メモリー」として扱う場合は、`AGENTS.md` とメモリーファイルがバックアップされるように、gitリポジトリ（理想的には非公開）にしてください。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw が行うこと

- WhatsApp Gateway + Pi コーディングエージェントを実行し、アシスタントがチャットを読み書きし、コンテキストを取得し、ホストMac経由でSkillsを実行できるようにします。
- macOSアプリは権限（画面収録、通知、マイク）を管理し、同梱バイナリ経由で `openclaw` CLI を公開します。
- ダイレクトチャットはデフォルトでエージェントの `main` セッションに集約されます。グループは `agent:<agentId>:<channel>:group:<id>` として分離されたままです（ルーム/チャンネル: `agent:<agentId>:<channel>:channel:<id>`）。Heartbeats によりバックグラウンドタスクが維持されます。

## コアSkills（設定 → Skills で有効化）

- **mcporter** - 外部Skillバックエンドを管理するためのツールサーバーランタイム/CLI。
- **Peekaboo** - 任意のAIビジョン分析に対応した高速macOSスクリーンショット。
- **camsnap** - RTSP/ONVIFセキュリティカメラからフレーム、クリップ、モーションアラートをキャプチャ。
- **oracle** - セッション再生とブラウザー制御に対応したOpenAI対応エージェントCLI。
- **eightctl** - ターミナルから睡眠を制御。
- **imsg** - iMessage & SMS の送信、読み取り、ストリーミング。
- **wacli** - WhatsApp CLI: 同期、検索、送信。
- **discord** - Discordアクション: リアクション、ステッカー、投票。`user:<id>` または `channel:<id>` ターゲットを使用します（裸の数値IDは曖昧です）。
- **gog** - Google Suite CLI: Gmail、Calendar、Drive、Contacts。
- **spotify-player** - 再生の検索/キュー投入/制御を行うターミナルSpotifyクライアント。
- **sag** - mac風のsay UXを備えたElevenLabs音声。デフォルトでスピーカーにストリーミングします。
- **Sonos CLI** - スクリプトからSonosスピーカー（検出/状態/再生/音量/グループ化）を制御。
- **blucli** - スクリプトからBluOSプレーヤーを再生、グループ化、自動化。
- **OpenHue CLI** - シーンと自動化のためのPhilips Hue照明制御。
- **OpenAI Whisper** - すばやいディクテーションとボイスメール文字起こし向けのローカル音声テキスト変換。
- **Gemini CLI** - ターミナルから高速Q&Aに使えるGoogle Geminiモデル。
- **agent-tools** - 自動化とヘルパースクリプト向けユーティリティツールキット。

## 使用上のメモ

- スクリプト作成には `openclaw` CLI を優先してください。Macアプリが権限を処理します。
- インストールはSkillsタブから実行してください。バイナリがすでに存在する場合はボタンが非表示になります。
- アシスタントがリマインダーをスケジュールし、受信箱を監視し、カメラキャプチャをトリガーできるように、Heartbeats を有効に保ってください。
- Canvas UI はネイティブオーバーレイ付きで全画面表示されます。重要なコントロールを左上/右上/下端に配置しないでください。レイアウトに明示的な余白を追加し、safe-area insets に依存しないでください。
- ブラウザー駆動の検証には、OpenClaw管理のChromeプロファイルで `openclaw browser`（タブ/状態/スクリーンショット）を使用してください。
- DOM検査には `openclaw browser eval|query|dom|snapshot` を使用してください（機械出力が必要な場合は `--json`/`--out` も使用）。
- 操作には `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` を使用してください（click/type にはスナップショット参照が必要です。CSSセレクターには `evaluate` を使用）。

## 関連

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [エージェントランタイム](/ja-JP/concepts/agent)
