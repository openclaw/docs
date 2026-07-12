---
read_when:
    - 新しい OpenClaw エージェントセッションを開始する
    - デフォルト Skills の有効化または監査
summary: パーソナルアシスタント設定向けのデフォルトのOpenClawエージェント指示とSkills一覧
title: デフォルトの AGENTS.md
x-i18n:
    generated_at: "2026-07-11T22:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## 初回実行（推奨）

OpenClaw エージェントはワークスペースディレクトリを使用します。デフォルト: `~/.openclaw/workspace`（`agents.defaults.workspace` で設定可能、`~` をサポート）。

1. ワークスペースを作成します。

```bash
mkdir -p ~/.openclaw/workspace
```

2. デフォルトのワークスペーステンプレートをコピーします。

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 任意: 汎用テンプレートの代わりに、このファイルのパーソナルアシスタント向け Skills 一覧を使用します。

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 任意: 別のワークスペースを指定します。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全性のデフォルト

- ディレクトリの内容やシークレットをチャットに出力しないでください。
- 明示的に依頼されない限り、破壊的なコマンドを実行しないでください。
- 設定やスケジューラー（crontab、systemd ユニット、nginx 設定、シェルの rc ファイル）を変更する前に、まず既存の状態を確認し、デフォルトでは既存内容を保持または統合してください。
- 外部メッセージングサービスに、部分的な返信やストリーミング中の返信を送信しないでください（最終返信のみ送信します）。

## 既存ソリューションの事前確認

独自のシステム、機能、ワークフロー、ツール、連携、または自動化を提案または構築する前に、要件を十分に満たすオープンソースプロジェクト、保守されているライブラリ、既存の OpenClaw plugins、または無料プラットフォームがないか確認してください。十分な場合は、それらを優先してください。既存の選択肢が不適切、高額、保守されていない、安全でない、要件に準拠していない場合、またはユーザーが独自実装を明示的に求めた場合にのみ独自に構築してください。ユーザーが費用の発生を明示的に承認しない限り、有料サービスの推奨は避けてください。これは調査作業ではなく、軽量な事前確認に留めてください。

## セッション開始（必須）

- 応答する前に、`SOUL.md`、`USER.md`、および `memory/` 内の今日と昨日のファイルを読みます。
- `MEMORY.md` が存在する場合は読みます。

## 人格（必須）

- `SOUL.md` はアイデンティティ、トーン、境界を定義します。常に最新の状態に保ってください。
- `SOUL.md` を変更した場合は、ユーザーに伝えてください。
- セッションごとに新しいインスタンスとして起動します。継続性はこれらのファイルに保持されます。

## 共有スペース（推奨）

- あなたはユーザーの代弁者ではありません。グループチャットや公開チャンネルでは慎重に対応してください。
- 個人データ、連絡先情報、内部メモを共有しないでください。

## メモリシステム（推奨）

- 日次ログ: `memory/YYYY-MM-DD.md`（必要に応じて `memory/` を作成）。
- 長期メモリ: 永続的な事実、設定、決定事項には `MEMORY.md` を使用。
- 小文字の `memory.md` はレガシー修復の入力専用です。意図的に両方のルートファイルを保持しないでください。
- セッション開始時に、今日 + 昨日 + 存在する場合は `MEMORY.md` を読みます。
- メモリファイルに書き込む前に、まずそのファイルを読みます。具体的な更新のみを書き込み、空のプレースホルダーは決して書き込まないでください。
- 記録対象: 決定事項、設定、制約、未完了事項。
- 明示的に依頼されない限り、シークレットは避けてください。

## ツールと Skills

- ツールは Skills 内にあります。必要な場合は、各 Skill の `SKILL.md` に従ってください。
- 環境固有のメモは `TOOLS.md` に保持してください（Skills 用のメモ）。

## バックアップのヒント（推奨）

このワークスペースをアシスタントのメモリとして扱ってください。`AGENTS.md` とメモリファイルをバックアップできるように、git リポジトリ（理想的には非公開）にします。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# 任意: 非公開リモートを追加してプッシュ
```

## OpenClaw の機能

- メッセージングチャンネルの Gateway（WhatsApp、Telegram、Discord、Signal、iMessage、Slack など）と組み込みエージェントを実行し、アシスタントがチャットを読み書きし、コンテキストを取得し、ホストマシン経由で Skills を実行できるようにします。
- macOS アプリは権限（画面収録、通知、マイク）を管理し、同梱バイナリを介して `openclaw` CLI を提供します。
- ダイレクトチャットはデフォルトでエージェントの `main` セッションに統合されます。グループとチャンネル／ルームには、それぞれ独自のセッションキーが割り当てられます。正確なキー形式については、[チャンネルルーティング](/ja-JP/channels/channel-routing)を参照してください。Heartbeat はバックグラウンドタスクを維持します。

## 中核となる Skills（Settings → Skills で有効化）

パーソナルアシスタント用ワークスペースの一覧例です。環境に適した Skills に入れ替えてください。

- **mcporter** - 外部 Skill バックエンドを管理するためのツールサーバーランタイム／CLI。
- **Peekaboo** - オプションの AI ビジョン分析に対応した、高速な macOS スクリーンショット。
- **camsnap** - RTSP/ONVIF セキュリティカメラからフレーム、クリップ、または動作アラートを取得。
- **oracle** - セッション再生とブラウザ制御を備えた、OpenAI 対応のエージェント CLI。
- **eightctl** - ターミナルから睡眠を管理。
- **imsg** - iMessage と SMS の送信、読み取り、ストリーミング。
- **wacli** - WhatsApp CLI: 同期、検索、送信。
- **discord** - Discord の操作: リアクション、ステッカー、投票。ターゲットには `user:<id>` または `channel:<id>` を使用してください（数字のみの ID は曖昧です）。
- **gog** - Google Suite CLI: Gmail、Calendar、Drive、Contacts。
- **spotify-player** - 再生内容の検索、キューへの追加、操作を行うターミナル用 Spotify クライアント。
- **sag** - macOS の say に似た操作性を備えた ElevenLabs 音声機能。デフォルトではスピーカーにストリーミングします。
- **Sonos CLI** - スクリプトから Sonos スピーカーを操作（検出／ステータス／再生／音量／グループ化）。
- **blucli** - スクリプトから BluOS プレーヤーを再生、グループ化、自動化。
- **OpenHue CLI** - シーンと自動化に対応した Philips Hue 照明制御。
- **OpenAI Whisper** - すばやい音声入力とボイスメール文字起こしのためのローカル音声テキスト変換。
- **Gemini CLI** - 迅速な質疑応答のために、ターミナルから Google Gemini モデルを利用。
- **agent-tools** - 自動化と補助スクリプトのためのユーティリティツールキット。

## 使用上の注意

- スクリプト処理には `openclaw` CLI を優先してください。デスクトップアプリが権限を処理します。
- インストールは Skills タブから実行してください。必要なバイナリがすでに存在する場合、インストールボタンは表示されません。
- アシスタントがリマインダーをスケジュールし、受信トレイを監視し、カメラ撮影を開始できるように、Heartbeat を有効にしておいてください。
- Canvas UI はネイティブオーバーレイ付きの全画面表示で動作します。重要なコントロールを左上、右上、下端に配置しないでください。セーフエリアのインセットに依存せず、明示的なレイアウト余白を追加してください。
- ブラウザを使用した検証には、OpenClaw が管理する Chrome/Brave/Edge/Chromium プロファイルとともに `openclaw browser` CLI（同梱の `browser` plugin）を使用してください。
- 管理: `status`、`doctor [--deep]`、`start [--headless]`、`stop`、`tabs`、`tab [new|select|close]`、`open <url>`、`focus <id>`、`close <id>`。
- 調査: `screenshot [--full-page|--ref|--labels]`、`snapshot [--format ai|aria|--interactive|--efficient]`、`console`、`errors`、`requests`、`pdf`、`responsebody`。
- 操作: `navigate`、`click <ref>`、`type <ref> <text>`、`press`、`hover`、`drag`、`select`、`upload`、`download`、`fill`、`dialog`、`wait`、`evaluate --fn <js>`、`highlight`。操作には `snapshot` で取得した `ref` が必要です（操作には CSS セレクターを使用できません）。`document.querySelector` 形式のターゲット指定が必要な場合は、`evaluate` を使用してください。
- 任意の調査コマンドに `--json` を追加すると、機械可読な出力になります。

## 関連項目

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [エージェントランタイム](/ja-JP/concepts/agent)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
