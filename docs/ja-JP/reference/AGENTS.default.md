---
read_when:
    - 新しいOpenClawエージェントセッションを開始する
    - デフォルト Skills の有効化または監査
summary: 個人アシスタント設定向けのデフォルト OpenClaw エージェント指示と Skills 名簿
title: デフォルト AGENTS.md
x-i18n:
    generated_at: "2026-06-27T12:53:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## 初回実行（推奨）

OpenClaw はエージェント用に専用のワークスペースディレクトリを使用します。デフォルト: `~/.openclaw/workspace`（`agents.defaults.workspace` で設定可能）。

1. ワークスペースを作成します（まだ存在しない場合）:

```bash
mkdir -p ~/.openclaw/workspace
```

2. デフォルトのワークスペーステンプレートをワークスペースにコピーします:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 任意: パーソナルアシスタントのスキル一覧を使いたい場合は、AGENTS.md をこのファイルで置き換えます:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 任意: `agents.defaults.workspace` を設定して別のワークスペースを選択します（`~` をサポート）:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全なデフォルト

- ディレクトリやシークレットをチャットに出力しないでください。
- 明示的に依頼されない限り、破壊的なコマンドを実行しないでください。
- 設定やスケジューラ（たとえば crontab、systemd ユニット、nginx 設定、シェル rc ファイル）を変更する前に、まず既存の状態を確認し、デフォルトでは保持またはマージしてください。
- 外部メッセージング面に部分的な返信やストリーミング返信を送信しないでください（最終返信のみ）。

## 既存ソリューションの事前確認

カスタムのシステム、機能、ワークフロー、ツール、統合、または自動化を提案または構築する前に、オープンソースプロジェクト、保守されているライブラリ、既存の OpenClaw plugins、または無料プラットフォームがすでに十分に解決していないかを簡潔に確認してください。十分な場合はそれらを優先してください。既存の選択肢が不適切、高額すぎる、保守されていない、安全でない、非準拠である、またはユーザーが明示的にカスタムを求めている場合にのみカスタムを構築してください。ユーザーが明示的に支出を承認しない限り、有料サービスの推奨は避けてください。これは軽量に保ってください。広範な調査課題ではなく、事前確認ゲートです。

## セッション開始（必須）

- `SOUL.md`、`USER.md`、および `memory/` 内の今日と昨日を読んでください。
- 存在する場合は `MEMORY.md` を読んでください。
- 応答する前に実行してください。

## Soul（必須）

- `SOUL.md` はアイデンティティ、トーン、境界を定義します。最新に保ってください。
- `SOUL.md` を変更した場合は、ユーザーに伝えてください。
- 各セッションでは新しいインスタンスです。継続性はこれらのファイルにあります。

## 共有スペース（推奨）

- あなたはユーザーの声ではありません。グループチャットや公開チャンネルでは注意してください。
- 個人データ、連絡先情報、内部メモを共有しないでください。

## メモリシステム（推奨）

- 日次ログ: `memory/YYYY-MM-DD.md`（必要なら `memory/` を作成）。
- 長期メモリ: 永続的な事実、好み、決定には `MEMORY.md`。
- 小文字の `memory.md` はレガシー修復入力専用です。意図的に両方のルートファイルを保持しないでください。
- セッション開始時に、存在する場合は今日 + 昨日 + `MEMORY.md` を読んでください。
- メモリファイルを書く前に、まずそれらを読んでください。具体的な更新のみを書き、空のプレースホルダーは決して書かないでください。
- 記録対象: 決定、好み、制約、未完了のループ。
- 明示的に求められない限り、シークレットは避けてください。

## ツールとスキル

- ツールは Skills 内にあります。必要な場合は各スキルの `SKILL.md` に従ってください。
- 環境固有のメモは `TOOLS.md`（Skills 向けメモ）に保管してください。

## バックアップのヒント（推奨）

このワークスペースを Clawd の「メモリ」として扱う場合は、`AGENTS.md` とメモリファイルがバックアップされるように git リポジトリ（理想的にはプライベート）にしてください。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw が行うこと

- WhatsApp ゲートウェイ + 組み込み OpenClaw エージェントを実行し、アシスタントがチャットを読み書きし、コンテキストを取得し、ホスト Mac 経由でスキルを実行できるようにします。
- macOS アプリは権限（画面収録、通知、マイク）を管理し、同梱バイナリ経由で `openclaw` CLI を公開します。
- ダイレクトチャットはデフォルトでエージェントの `main` セッションにまとめられます。グループは `agent:<agentId>:<channel>:group:<id>` として分離されたままです（ルーム/チャンネル: `agent:<agentId>:<channel>:channel:<id>`）。ハートビートによりバックグラウンドタスクを維持します。

## コア Skills（設定 → Skills で有効化）

- **mcporter** - 外部スキルバックエンドを管理するためのツールサーバーランタイム/CLI。
- **Peekaboo** - 任意の AI ビジョン分析付きの高速 macOS スクリーンショット。
- **camsnap** - RTSP/ONVIF セキュリティカメラからフレーム、クリップ、またはモーションアラートをキャプチャ。
- **oracle** - セッションリプレイとブラウザ制御を備えた OpenAI 対応エージェント CLI。
- **eightctl** - ターミナルから睡眠を制御。
- **imsg** - iMessage と SMS を送信、読み取り、ストリーミング。
- **wacli** - WhatsApp CLI: 同期、検索、送信。
- **discord** - Discord アクション: リアクション、ステッカー、投票。`user:<id>` または `channel:<id>` ターゲットを使用してください（裸の数値 ID は曖昧です）。
- **gog** - Google Suite CLI: Gmail、Calendar、Drive、Contacts。
- **spotify-player** - 再生の検索/キュー投入/制御を行うターミナル Spotify クライアント。
- **sag** - mac 風の say UX を備えた ElevenLabs 音声。デフォルトではスピーカーへストリーミングします。
- **Sonos CLI** - スクリプトから Sonos スピーカー（検出/状態/再生/音量/グループ化）を制御。
- **blucli** - スクリプトから BluOS プレーヤーを再生、グループ化、自動化。
- **OpenHue CLI** - シーンと自動化のための Philips Hue 照明制御。
- **OpenAI Whisper** - すばやいディクテーションとボイスメール文字起こしのためのローカル音声テキスト変換。
- **Gemini CLI** - すばやい Q&A のためにターミナルから使う Google Gemini モデル。
- **agent-tools** - 自動化とヘルパースクリプトのためのユーティリティツールキット。

## 使用上の注意

- スクリプトには `openclaw` CLI を優先してください。Mac アプリが権限を処理します。
- インストールは Skills タブから実行してください。バイナリがすでに存在する場合、ボタンは非表示になります。
- アシスタントがリマインダーをスケジュールし、受信箱を監視し、カメラキャプチャをトリガーできるように、ハートビートを有効にしておいてください。
- Canvas UI はネイティブオーバーレイ付きで全画面実行されます。重要なコントロールを左上/右上/下端に配置しないでください。レイアウトに明示的なガターを追加し、safe-area inset に依存しないでください。
- ブラウザ駆動の検証には、OpenClaw 管理の Chrome プロファイルで `openclaw browser`（タブ/状態/スクリーンショット）を使用してください。
- DOM 検査には `openclaw browser eval|query|dom|snapshot` を使用してください（機械出力が必要な場合は `--json`/`--out` も使用）。
- 操作には `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` を使用してください（click/type にはスナップショット参照が必要です。CSS セレクターには `evaluate` を使用してください）。

## 関連

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [エージェントランタイム](/ja-JP/concepts/agent)
