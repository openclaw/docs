---
read_when: Finding which docs page covers a topic before reading the page
summary: 生成されたOpenClawドキュメントページの見出しマップ
title: ドキュメントマップ
x-i18n:
    generated_at: "2026-07-02T22:22:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a4462a02558886466a5da704c18041c4e4c9c709c740d605d45bdca0a1fb2e8
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw ドキュメントマップ

このファイルは、エージェントがドキュメントツリーを移動しやすくするために、`docs/**/*.md` と `docs/**/*.mdx` の見出しから生成されています。
手動で編集しないでください。`pnpm docs:map:gen` を実行してください。

## agent-runtime-architecture.md

- ルート: /agent-runtime-architecture
- 見出し:
  - H2: ランタイムレイアウト
  - H2: 境界
  - H2: マニフェスト
  - H2: ランタイム選択
  - H2: 関連

## announcements/bluebubbles-imessage.md

- ルート: /announcements/bluebubbles-imessage
- 見出し:
  - H1: BlueBubbles の削除と imsg iMessage パス
  - H2: 変更点
  - H2: 対応すること
  - H2: 移行メモ
  - H2: 関連項目

## auth-credential-semantics.md

- ルート: /auth-credential-semantics
- 見出し:
  - H2: 安定したプローブ理由コード
  - H2: トークン資格情報
  - H3: 適格性ルール
  - H3: 解決ルール
  - H2: エージェントコピーの可搬性
  - H2: 設定のみの認証ルート
  - H2: 明示的な認証順序フィルタリング
  - H2: プローブターゲット解決
  - H2: 外部 CLI 資格情報検出
  - H2: OAuth SecretRef ポリシーガード
  - H2: レガシー互換メッセージング
  - H2: 関連

## automation/auth-monitoring.md

- ルート: /automation/auth-monitoring
- 見出し:
  - H2: 関連

## automation/clawflow.md

- ルート: /automation/clawflow
- 見出し:
  - H2: 関連

## automation/cron-jobs.md

- ルート: /automation/cron-jobs
- 見出し:
  - H2: クイックスタート
  - H2: cron の仕組み
  - H2: スケジュール種別
  - H3: 月内日と曜日は OR ロジックを使用
  - H2: 実行スタイル
  - H3: コマンドペイロード
  - H3: 分離ジョブのペイロードオプション
  - H2: 配信と出力
  - H2: 出力言語
  - H2: CLI の例
  - H2: Webhook
  - H3: 認証
  - H2: Gmail PubSub 連携
  - H3: ウィザード設定（推奨）
  - H3: Gateway の自動起動
  - H3: 手動の一回限り設定
  - H3: Gmail モデルのオーバーライド
  - H2: ジョブの管理
  - H2: 設定
  - H2: トラブルシューティング
  - H3: コマンドラダー
  - H2: 関連

## automation/cron-vs-heartbeat.md

- ルート: /automation/cron-vs-heartbeat
- 見出し:
  - H2: 関連

## automation/gmail-pubsub.md

- ルート: /automation/gmail-pubsub
- 見出し:
  - H2: 関連

## automation/hooks.md

- ルート: /automation/hooks
- 見出し:
  - H2: 適切なサーフェスを選ぶ
  - H2: クイックスタート
  - H2: イベント種別
  - H2: フックを書く
  - H3: フック構造
  - H3: HOOK.md 形式
  - H3: ハンドラー実装
  - H3: イベントコンテキストの要点
  - H2: フック検出
  - H3: フックパック
  - H2: バンドル済みフック
  - H3: session-memory の詳細
  - H3: bootstrap-extra-files 設定
  - H3: command-logger の詳細
  - H3: compaction-notifier の詳細
  - H3: boot-md の詳細
  - H2: Plugin フック
  - H2: 設定
  - H2: CLI リファレンス
  - H2: ベストプラクティス
  - H2: トラブルシューティング
  - H3: フックが検出されない
  - H3: フックが適格でない
  - H3: フックが実行されない
  - H2: 関連

## automation/index.md

- ルート: /automation
- 見出し:
  - H2: クイック判断ガイド
  - H3: スケジュール済みタスク（Cron）と Heartbeat
  - H2: コア概念
  - H3: スケジュール済みタスク（cron）
  - H3: タスク
  - H3: 推論されたコミットメント
  - H3: タスクフロー
  - H3: 常設指示
  - H3: フック
  - H3: Heartbeat
  - H2: 連携の仕組み
  - H2: 関連

## automation/poll.md

- ルート: /automation/poll
- 見出し:
  - H2: 関連

## automation/standing-orders.md

- ルート: /automation/standing-orders
- 見出し:
  - H2: 常設指示が必要な理由
  - H2: 仕組み
  - H2: 常設指示の構造
  - H2: 常設指示と cron ジョブ
  - H2: 例
  - H3: 例 1: コンテンツとソーシャルメディア（週次サイクル）
  - H3: 例 2: 財務オペレーション（イベントトリガー）
  - H3: 例 3: 監視とアラート（継続）
  - H2: 実行・検証・報告パターン
  - H2: 複数プログラムアーキテクチャ
  - H2: ベストプラクティス
  - H3: 推奨
  - H3: 避けること
  - H2: 関連

## automation/taskflow.md

- ルート: /automation/taskflow
- 見出し:
  - H2: Task Flow を使うタイミング
  - H2: 信頼できるスケジュール済みワークフローパターン
  - H2: 同期モード
  - H3: 管理モード
  - H3: ミラーモード
  - H2: 永続状態とリビジョン追跡
  - H2: キャンセル動作
  - H2: CLI コマンド
  - H2: フローとタスクの関係
  - H2: 関連

## automation/tasks.md

- ルート: /automation/tasks
- 見出し:
  - H2: 要約
  - H2: クイックスタート
  - H2: タスクを作成するもの
  - H2: タスクのライフサイクル
  - H2: 配信と通知
  - H3: 通知ポリシー
  - H2: CLI リファレンス
  - H2: チャットタスクボード（/tasks）
  - H2: ステータス連携（タスクプレッシャー）
  - H2: ストレージと保守
  - H3: タスクの保存場所
  - H3: 自動保守
  - H2: タスクと他システムの関係
  - H2: 関連

## automation/troubleshooting.md

- ルート: /automation/troubleshooting
- 見出し:
  - H2: 関連

## automation/webhook.md

- ルート: /automation/webhook
- 見出し:
  - H2: 関連

## brave-search.md

- ルート: /brave-search
- 見出し:
  - H2: 関連

## channels/access-groups.md

- ルート: /channels/access-groups
- 見出し:
  - H2: 静的メッセージ送信者グループ
  - H2: allowlist から参照するグループ
  - H2: サポートされるメッセージチャンネルパス
  - H2: Plugin 診断
  - H2: Discord チャンネルのオーディエンス
  - H2: セキュリティメモ
  - H2: トラブルシューティング

## channels/ambient-room-events.md

- ルート: /channels/ambient-room-events
- 見出し:
  - H2: 推奨設定
  - H2: 変更点
  - H2: Discord の例
  - H2: Slack の例
  - H2: Telegram の例
  - H2: エージェント固有ポリシー
  - H2: 表示返信モード
  - H2: 履歴
  - H2: トラブルシューティング
  - H2: 関連

## channels/bot-loop-protection.md

- ルート: /channels/bot-loop-protection
- 見出し:
  - H1: ボットループ保護
  - H2: デフォルト
  - H2: 共有デフォルトを設定する
  - H2: チャンネルまたはアカウントごとにオーバーライド
  - H2: チャンネルサポート

## channels/broadcast-groups.md

- ルート: /channels/broadcast-groups
- 見出し:
  - H2: 概要
  - H2: ユースケース
  - H2: 設定
  - H3: 基本設定
  - H3: 処理戦略
  - H3: 完全な例
  - H2: 仕組み
  - H3: メッセージフロー
  - H3: セッション分離
  - H3: 例: 分離セッション
  - H2: ベストプラクティス
  - H2: 互換性
  - H3: プロバイダー
  - H3: ルーティング
  - H2: トラブルシューティング
  - H2: 例
  - H2: API リファレンス
  - H3: 設定スキーマ
  - H3: フィールド
  - H2: 制限事項
  - H2: 今後の拡張
  - H2: 関連

## channels/channel-routing.md

- ルート: /channels/channel-routing
- 見出し:
  - H1: チャンネルとルーティング
  - H2: 主要用語
  - H2: 送信先ターゲットプレフィックス
  - H2: セッションキーの形（例）
  - H2: メイン DM ルート固定
  - H2: 保護された受信記録
  - H2: ルーティングルール（エージェントの選択方法）
  - H2: ブロードキャストグループ（複数エージェントを実行）
  - H2: 設定概要
  - H2: セッションストレージ
  - H2: WebChat の動作
  - H2: 返信コンテキスト
  - H2: 関連

## channels/clickclack.md

- ルート: /channels/clickclack
- 見出し:
  - H2: クイック設定
  - H2: 複数ボット
  - H2: ターゲット
  - H2: 権限
  - H2: トラブルシューティング

## channels/discord.md

- ルート: /channels/discord
- 見出し:
  - H2: クイック設定
  - H2: 推奨: ギルドワークスペースを設定する
  - H2: ランタイムモデル
  - H2: フォーラムチャンネル
  - H2: インタラクティブコンポーネント
  - H2: アクセス制御とルーティング
  - H3: ロールベースのエージェントルーティング
  - H2: ネイティブコマンドとコマンド認証
  - H2: 機能詳細
  - H2: ツールとアクションゲート
  - H2: Components v2 UI
  - H2: 音声
  - H3: 音声チャンネル
  - H3: 音声内のユーザーをフォロー
  - H3: 音声メッセージ
  - H2: トラブルシューティング
  - H2: 設定リファレンス
  - H2: 安全性と運用
  - H2: 関連

## channels/feishu.md

- ルート: /channels/feishu
- 見出し:
  - H2: クイックスタート
  - H2: アクセス制御
  - H3: ダイレクトメッセージ
  - H3: グループチャット
  - H2: グループ設定の例
  - H3: すべてのグループを許可し、@mention は不要
  - H3: すべてのグループを許可し、引き続き @mention を要求
  - H3: 特定のグループのみを許可
  - H3: グループ内の送信者を制限
  - H2: グループ/ユーザー ID を取得
  - H3: グループ ID（chatid、形式: ocxxx）
  - H3: ユーザー ID（openid、形式: ouxxx）
  - H2: 共通コマンド
  - H2: トラブルシューティング
  - H3: ボットがグループチャットで応答しない
  - H3: ボットがメッセージを受信しない
  - H3: QR 設定が Feishu モバイルアプリで反応しない
  - H3: App Secret が漏えいした
  - H2: 高度な設定
  - H3: 複数アカウント
  - H3: メッセージ制限
  - H3: ストリーミング
  - H3: クォータ最適化
  - H3: ACP セッション
  - H4: 永続 ACP バインディング
  - H4: チャットから ACP を生成
  - H3: マルチエージェントルーティング
  - H2: ユーザーごとのエージェント分離（動的エージェント作成）
  - H3: クイック設定
  - H3: 仕組み
  - H3: 設定オプション
  - H3: セッションスコープ
  - H3: 一般的なマルチユーザーデプロイ
  - H3: 検証
  - H3: メモ
  - H2: 設定リファレンス
  - H2: サポートされるメッセージ種別
  - H3: 受信
  - H3: 送信
  - H3: スレッドと返信
  - H2: 関連

## channels/googlechat.md

- ルート: /channels/googlechat
- 見出し:
  - H2: インストール
  - H2: クイック設定（初心者向け）
  - H2: Google Chat に追加
  - H2: 公開 URL（Webhookのみ）
  - H3: オプション A: Tailscale Funnel（推奨）
  - H3: オプション B: リバースプロキシ（Caddy）
  - H3: オプション C: Cloudflare Tunnel
  - H2: 仕組み
  - H2: ターゲット
  - H2: 設定の要点
  - H2: トラブルシューティング
  - H3: 405 Method Not Allowed
  - H3: その他の問題
  - H2: 関連

## channels/group-messages.md

- ルート: /channels/group-messages
- 見出し:
  - H2: 動作
  - H2: 設定例（WhatsApp）
  - H3: 有効化コマンド（所有者のみ）
  - H2: 使い方
  - H2: テスト / 検証
  - H2: 既知の考慮事項
  - H2: 関連

## channels/groups.md

- ルート: /channels/groups
- 見出し:
  - H2: 初心者向け導入（2 分）
  - H2: 表示返信
  - H2: コンテキスト可視性と allowlist
  - H2: セッションキー
  - H2: パターン: 個人 DM + 公開グループ（単一エージェント）
  - H2: 表示ラベル
  - H2: グループポリシー
  - H2: mention ゲート（デフォルト）
  - H2: mention パターンのスコープ設定
  - H2: グループ/チャンネルツール制限（任意）
  - H2: グループ allowlist
  - H2: 有効化（所有者のみ）
  - H2: コンテキストフィールド
  - H2: iMessage 固有事項
  - H2: WhatsApp システムプロンプト
  - H2: WhatsApp 固有事項
  - H2: 関連

## channels/imessage-from-bluebubbles.md

- ルート: /channels/imessage-from-bluebubbles
- 見出し:
  - H2: 移行チェックリスト
  - H2: この移行が適している場合
  - H2: imsg の役割
  - H2: 開始前に
  - H2: 設定変換
  - H2: グループレジストリの落とし穴
  - H2: 手順
  - H2: アクション互換性の概要
  - H2: ペアリング、セッション、ACP バインディング
  - H2: ロールバックチャンネルなし
  - H2: 関連

## channels/imessage.md

- ルート: /channels/imessage
- 見出し:
  - H2: クイック設定
  - H2: 要件と権限（macOS）
  - H2: imsg プライベート API の有効化
  - H3: 設定
  - H3: SIP を無効化できない場合
  - H2: アクセス制御とルーティング
  - H2: ACP 会話バインディング
  - H2: デプロイパターン
  - H2: メディア、チャンク化、配信ターゲット
  - H2: プライベート API アクション
  - H2: 設定の書き込み
  - H2: 分割送信 DM の結合（1 つの作成内にコマンド + URL）
  - H3: シナリオとエージェントから見えるもの
  - H2: ブリッジまたは Gateway 再起動後の受信復旧
  - H3: オペレーターに見えるシグナル
  - H3: 移行
  - H2: トラブルシューティング
  - H2: 設定リファレンスポインター
  - H2: 関連

## channels/index.md

- ルート: /channels
- 見出し:
  - H2: 配信メモ
  - H2: サポートされるチャンネル
  - H2: メモ

## channels/irc.md

- ルート: /channels/irc
- 見出し:
  - H2: クイックスタート
  - H2: セキュリティデフォルト
  - H2: アクセス制御
  - H3: よくある落とし穴: allowFrom は DM 用であり、チャンネル用ではない
  - H2: 返信トリガー（mention）
  - H2: セキュリティメモ（公開チャンネルに推奨）
  - H3: チャンネル内の全員に同じツール
  - H3: 送信者ごとに異なるツール（所有者はより強い権限を持つ）
  - H2: NickServ
  - H2: 環境変数
  - H2: トラブルシューティング
  - H2: 関連

## channels/line.md

- ルート: /channels/line
- 見出し:
  - H2: インストール
  - H2: セットアップ
  - H2: 構成
  - H2: アクセス制御
  - H2: メッセージ動作
  - H2: チャネルデータ（リッチメッセージ）
  - H2: ACP 対応
  - H2: 送信メディア
  - H2: トラブルシューティング
  - H2: 関連

## channels/location.md

- ルート: /channels/location
- 見出し:
  - H2: テキスト書式
  - H2: コンテキストフィールド
  - H2: チャネルに関する注意
  - H2: 関連

## channels/matrix-migration.md

- ルート: /channels/matrix-migration
- 見出し:
  - H2: 移行が自動的に行うこと
  - H2: 移行が自動的にはできないこと
  - H2: 推奨アップグレードフロー
  - H2: 暗号化された移行の仕組み
  - H2: 一般的なメッセージとその意味
  - H3: アップグレードと検出メッセージ
  - H3: 暗号化状態の復旧メッセージ
  - H3: 手動復旧メッセージ
  - H3: カスタム Plugin インストールメッセージ
  - H2: 暗号化された履歴がまだ戻らない場合
  - H2: 今後のメッセージを新しく始めたい場合
  - H2: 関連

## channels/matrix-presentation.md

- ルート: /channels/matrix-presentation
- 見出し:
  - H2: イベントコンテンツ
  - H2: フォールバック動作
  - H2: 対応ブロック
  - H2: インタラクション
  - H2: 承認メタデータとの関係
  - H2: メディアメッセージ

## channels/matrix-push-rules.md

- ルート: /channels/matrix-push-rules
- 見出し:
  - H2: 前提条件
  - H2: 手順
  - H2: 複数 Bot に関する注意
  - H2: ホームサーバーに関する注意
  - H2: 関連

## channels/matrix.md

- ルート: /channels/matrix
- 見出し:
  - H2: インストール
  - H2: セットアップ
  - H3: 対話型セットアップ
  - H3: 最小構成
  - H3: 自動参加
  - H3: 許可リストターゲット形式
  - H3: アカウント ID の正規化
  - H3: キャッシュされた認証情報
  - H3: 環境変数
  - H2: 構成例
  - H2: ストリーミングプレビュー
  - H2: 音声メッセージ
  - H2: 承認メタデータ
  - H3: 確定済みプレビューを静かにするセルフホストのプッシュルール
  - H2: Bot 間ルーム
  - H2: 暗号化と検証
  - H3: 暗号化を有効化
  - H3: ステータスと信頼シグナル
  - H3: リカバリキーでこのデバイスを検証
  - H3: クロス署名のブートストラップまたは修復
  - H3: ルームキーのバックアップ
  - H3: 検証の一覧表示、要求、応答
  - H3: 複数アカウントに関する注意
  - H2: プロフィール管理
  - H2: スレッド
  - H3: セッションルーティング（sessionScope）
  - H3: 返信スレッド化（threadReplies）
  - H3: スレッドの継承とスラッシュコマンド
  - H2: ACP 会話バインディング
  - H3: スレッドバインディング構成
  - H2: リアクション
  - H2: 履歴コンテキスト
  - H2: コンテキストの可視性
  - H2: DM とルームのポリシー
  - H2: ダイレクトルーム修復
  - H2: Exec 承認
  - H2: スラッシュコマンド
  - H2: 複数アカウント
  - H2: プライベート/LAN ホームサーバー
  - H2: Matrix トラフィックのプロキシ
  - H2: ターゲット解決
  - H2: 構成リファレンス
  - H3: アカウントと接続
  - H3: 暗号化
  - H3: アクセスとポリシー
  - H3: 返信動作
  - H3: リアクション設定
  - H3: ツールとルームごとのオーバーライド
  - H3: Exec 承認設定
  - H2: 関連

## channels/mattermost.md

- ルート: /channels/mattermost
- 見出し:
  - H2: インストール
  - H2: クイックセットアップ
  - H2: ネイティブスラッシュコマンド
  - H2: 環境変数（デフォルトアカウント）
  - H2: チャットモード
  - H2: スレッド化とセッション
  - H2: アクセス制御（DM）
  - H2: チャネル（グループ）
  - H2: 送信配信のターゲット
  - H2: DM チャネル再試行
  - H2: プレビューストリーミング
  - H2: リアクション（メッセージツール）
  - H2: インタラクティブボタン（メッセージツール）
  - H3: 直接 API 連携（外部スクリプト）
  - H2: ディレクトリアダプター
  - H2: 複数アカウント
  - H2: トラブルシューティング
  - H2: 関連

## channels/msteams.md

- ルート: /channels/msteams
- 見出し:
  - H2: バンドル Plugin
  - H2: クイックセットアップ
  - H2: 目標
  - H2: 構成の書き込み
  - H2: アクセス制御（DM + グループ）
  - H3: 仕組み
  - H3: ステップ 1: Azure Bot を作成
  - H3: ステップ 2: 認証情報を取得
  - H3: ステップ 3: メッセージングエンドポイントを構成
  - H3: ステップ 4: Teams チャネルを有効化
  - H3: ステップ 5: Teams アプリマニフェストをビルド
  - H3: ステップ 6: OpenClaw を構成
  - H3: ステップ 7: Gateway を実行
  - H2: フェデレーション認証（証明書とマネージド ID）
  - H3: オプション A: 証明書ベース認証
  - H3: オプション B: Azure Managed Identity
  - H3: AKS Workload Identity セットアップ
  - H3: 認証タイプの比較
  - H2: ローカル開発（トンネリング）
  - H2: Bot のテスト
  - H2: 環境変数
  - H2: メンバー情報アクション
  - H2: 履歴コンテキスト
  - H2: 現在の Teams RSC 権限（マニフェスト）
  - H2: Teams マニフェスト例（編集済み）
  - H3: マニフェストの注意点（必須フィールド）
  - H3: 既存アプリの更新
  - H2: 機能: RSC のみ vs Graph
  - H3: Teams RSC のみの場合（アプリはインストール済み、Graph API 権限なし）
  - H3: Teams RSC + Microsoft Graph アプリケーション権限の場合
  - H3: RSC vs Graph API
  - H2: Graph 対応メディア + 履歴（チャネルに必須）
  - H2: 既知の制限
  - H3: Webhook タイムアウト
  - H3: Teams クラウドとサービス URL 対応
  - H3: 書式
  - H2: 構成
  - H2: ルーティングとセッション
  - H2: 返信スタイル: スレッド vs 投稿
  - H3: 解決の優先順位
  - H3: スレッドコンテキストの保持
  - H2: 添付ファイルと画像
  - H2: グループチャットでのファイル送信
  - H3: グループチャットに SharePoint が必要な理由
  - H3: セットアップ
  - H3: 共有動作
  - H3: フォールバック動作
  - H3: ファイルの保存場所
  - H2: 投票（Adaptive Cards）
  - H2: プレゼンテーションカード
  - H2: ターゲット形式
  - H2: プロアクティブメッセージング
  - H2: Team と Channel の ID（よくある落とし穴）
  - H2: プライベートチャネル
  - H2: トラブルシューティング
  - H3: 一般的な問題
  - H3: マニフェストアップロードエラー
  - H3: RSC 権限が機能しない
  - H2: 参照
  - H2: 関連

## channels/nextcloud-talk.md

- ルート: /channels/nextcloud-talk
- 見出し:
  - H2: バンドル Plugin
  - H2: クイックセットアップ（初心者向け）
  - H2: 注意
  - H2: アクセス制御（DM）
  - H2: ルーム（グループ）
  - H2: 機能
  - H2: 構成リファレンス（Nextcloud Talk）
  - H2: 関連

## channels/nostr.md

- ルート: /channels/nostr
- 見出し:
  - H2: バンドル Plugin
  - H3: 古い/カスタムインストール
  - H3: 非対話型セットアップ
  - H2: クイックセットアップ
  - H2: 構成リファレンス
  - H2: プロフィールメタデータ
  - H2: アクセス制御
  - H3: DM ポリシー
  - H3: 許可リスト例
  - H2: キー形式
  - H2: リレー
  - H2: プロトコル対応
  - H2: テスト
  - H3: ローカルリレー
  - H3: 手動テスト
  - H2: トラブルシューティング
  - H3: メッセージを受信できない
  - H3: 応答を送信できない
  - H3: 重複応答
  - H2: セキュリティ
  - H2: 制限（MVP）
  - H2: 関連

## channels/pairing.md

- ルート: /channels/pairing
- 見出し:
  - H2: 1) DM ペアリング（受信チャットアクセス）
  - H3: 送信者を承認
  - H3: 再利用可能な送信者グループ
  - H3: 状態の保存場所
  - H2: 2) Node デバイスペアリング（iOS/Android/macOS/ヘッドレスノード）
  - H3: Telegram 経由でペアリング（iOS に推奨）
  - H3: Node デバイスを承認
  - H3: 任意の信頼済み CIDR Node 自動承認
  - H3: Node ペアリング状態ストレージ
  - H3: 注意
  - H2: 関連ドキュメント

## channels/qa-channel.md

- ルート: /channels/qa-channel
- 見出し:
  - H2: できること
  - H2: 構成
  - H2: ランナー
  - H2: 関連

## channels/qqbot.md

- ルート: /channels/qqbot
- 見出し:
  - H2: インストール
  - H2: セットアップ
  - H2: 構成
  - H3: 複数アカウントセットアップ
  - H3: グループチャット
  - H3: 音声（STT / TTS）
  - H2: ターゲット形式
  - H2: スラッシュコマンド
  - H2: エンジンアーキテクチャ
  - H2: QR コードオンボーディング
  - H2: トラブルシューティング
  - H2: 関連

## channels/raft.md

- ルート: /channels/raft
- 見出し:
  - H2: インストール
  - H2: 前提条件
  - H2: 構成
  - H2: 仕組み
  - H2: 検証
  - H2: トラブルシューティング
  - H2: 参照

## channels/signal.md

- ルート: /channels/signal
- 見出し:
  - H2: 前提条件
  - H2: クイックセットアップ（初心者向け）
  - H2: これは何か
  - H2: 構成の書き込み
  - H2: 番号モデル（重要）
  - H2: セットアップパス A: 既存の Signal アカウントをリンク（QR）
  - H2: セットアップパス B: 専用 Bot 番号を登録（SMS、Linux）
  - H2: 外部デーモンモード（httpUrl）
  - H2: コンテナモード（bbernhard/signal-cli-rest-api）
  - H2: アクセス制御（DM + グループ）
  - H2: 仕組み（動作）
  - H2: メディア + 制限
  - H2: 入力中表示 + 既読通知
  - H2: リアクション（メッセージツール）
  - H2: 承認リアクション
  - H2: 配信ターゲット（CLI/cron）
  - H2: トラブルシューティング
  - H2: セキュリティに関する注意
  - H2: 構成リファレンス（Signal）
  - H2: 関連

## channels/slack.md

- ルート: /channels/slack
- 見出し:
  - H2: Socket Mode または HTTP Request URL の選択
  - H3: リレーモード
  - H2: インストール
  - H2: クイックセットアップ
  - H2: Socket Mode トランスポート調整
  - H2: マニフェストとスコープのチェックリスト
  - H3: 追加のマニフェスト設定
  - H2: トークンモデル
  - H2: アクションとゲート
  - H2: アクセス制御とルーティング
  - H2: スレッド化、セッション、返信タグ
  - H2: Ack リアクション
  - H3: 絵文字（ackReaction）
  - H3: スコープ（messages.ackReactionScope）
  - H2: テキストストリーミング
  - H2: 入力中リアクションのフォールバック
  - H2: メディア、チャンク化、配信
  - H2: コマンドとスラッシュ動作
  - H2: インタラクティブ返信
  - H3: Plugin 所有のモーダル送信
  - H2: Slack でのネイティブ承認
  - H2: イベントと運用動作
  - H2: 構成リファレンス
  - H2: トラブルシューティング
  - H2: 添付ファイルの視覚リファレンス
  - H3: 対応メディアタイプ
  - H3: 受信パイプライン
  - H3: スレッドルート添付ファイルの継承
  - H3: 複数添付ファイルの処理
  - H3: サイズ、ダウンロード、モデル制限
  - H3: 既知の制限
  - H3: 関連ドキュメント
  - H2: 関連

## channels/sms.md

- ルート: /channels/sms
- 見出し:
  - H2: 始める前に
  - H2: クイックセットアップ
  - H2: 構成例
  - H3: 構成ファイル
  - H3: 環境変数
  - H3: SecretRef 認証トークン
  - H3: 許可リストのみのプライベート番号
  - H3: Messaging Service 送信者
  - H3: デフォルト送信ターゲット
  - H2: アクセス制御
  - H2: SMS の送信
  - H2: セットアップの検証
  - H3: macOS iMessage/SMS からのエンドツーエンドテスト
  - H2: Webhook セキュリティ
  - H2: 複数アカウント構成
  - H2: トラブルシューティング
  - H3: Twilio が 403 を返す、または OpenClaw が Webhook を拒否する
  - H3: ペアリング要求が表示されない
  - H3: 送信が失敗する
  - H3: メッセージは届くがエージェントが応答しない

## channels/synology-chat.md

- ルート: /channels/synology-chat
- 見出し:
  - H2: バンドル Plugin
  - H2: クイックセットアップ
  - H2: 環境変数
  - H2: DM ポリシーとアクセス制御
  - H2: 送信配信
  - H2: 複数アカウント
  - H2: セキュリティに関する注意
  - H2: トラブルシューティング
  - H2: 関連

## channels/telegram.md

- ルート: /channels/telegram
- 見出し:
  - H2: クイックセットアップ
  - H2: Telegram 側設定
  - H2: アクセス制御と有効化
  - H3: グループ Bot ID
  - H2: ランタイム動作
  - H2: 機能リファレンス
  - H2: エラー返信制御
  - H2: トラブルシューティング
  - H2: 構成リファレンス
  - H2: 関連

## channels/tlon.md

- ルート: /channels/tlon
- 見出し:
  - H2: バンドル Plugin
  - H2: セットアップ
  - H2: プライベート/LAN シップ
  - H2: グループチャネル
  - H2: アクセス制御
  - H2: 所有者と承認システム
  - H2: 自動承認設定
  - H2: 配信ターゲット（CLI/cron）
  - H2: バンドル Skills
  - H2: 機能
  - H2: トラブルシューティング
  - H2: 構成リファレンス
  - H2: 注意
  - H2: 関連

## channels/troubleshooting.md

- ルート: /channels/troubleshooting
- 見出し:
  - H2: コマンドラダー
  - H2: 更新後
  - H2: WhatsApp
  - H3: WhatsApp 障害シグネチャ
  - H2: Telegram
  - H3: Telegram 障害シグネチャ
  - H2: Discord
  - H3: Discord 障害シグネチャ
  - H2: Slack
  - H3: Slack 障害シグネチャ
  - H2: iMessage
  - H3: iMessage 障害シグネチャ
  - H2: Signal
  - H3: Signal 障害シグネチャ
  - H2: QQ Bot
  - H3: QQ Bot 障害シグネチャ
  - H2: Matrix
  - H3: Matrix 障害シグネチャ
  - H2: 関連

## channels/twitch.md

- ルート: /channels/twitch
- 見出し:
  - H2: バンドル済みPlugin
  - H2: クイックセットアップ（初心者向け）
  - H2: これは何か
  - H2: セットアップ（詳細）
  - H3: 認証情報を生成する
  - H3: botを設定する
  - H3: アクセス制御（推奨）
  - H2: トークン更新（任意）
  - H2: 複数アカウント対応
  - H2: アクセス制御
  - H2: トラブルシューティング
  - H2: 設定
  - H3: アカウント設定
  - H3: プロバイダーオプション
  - H2: ツールアクション
  - H2: 安全性と運用
  - H2: 制限
  - H2: 関連

## channels/wechat.md

- ルート: /channels/wechat
- 見出し:
  - H2: 命名
  - H2: 仕組み
  - H2: インストール
  - H2: ログイン
  - H2: アクセス制御
  - H2: 互換性
  - H2: サイドカープロセス
  - H2: トラブルシューティング
  - H2: 関連ドキュメント

## channels/whatsapp.md

- ルート: /channels/whatsapp
- 見出し:
  - H2: インストール（オンデマンド）
  - H2: クイックセットアップ
  - H2: デプロイパターン
  - H2: ランタイムモデル
  - H2: 承認プロンプト
  - H2: Pluginフックとプライバシー
  - H2: アクセス制御と有効化
  - H2: 設定済みACPバインディング
  - H2: 個人番号とセルフチャットの動作
  - H2: メッセージ正規化とコンテキスト
  - H2: 配信、チャンク化、メディア
  - H2: 返信の引用
  - H2: リアクションレベル
  - H2: 確認リアクション
  - H2: ライフサイクルステータスリアクション
  - H2: 複数アカウントと認証情報
  - H2: ツール、アクション、設定書き込み
  - H2: トラブルシューティング
  - H2: システムプロンプト
  - H2: 設定リファレンスの参照先
  - H2: 関連

## channels/yuanbao.md

- ルート: /channels/yuanbao
- 見出し:
  - H2: クイックスタート
  - H3: 対話型セットアップ（代替）
  - H2: アクセス制御
  - H3: ダイレクトメッセージ
  - H3: グループチャット
  - H2: 設定例
  - H3: オープンDMポリシーによる基本セットアップ
  - H3: DMを特定ユーザーに制限する
  - H3: グループでの@メンション要件を無効化する
  - H3: 送信メッセージ配信を最適化する
  - H3: merge-text戦略を調整する
  - H2: 一般的なコマンド
  - H2: トラブルシューティング
  - H3: botがグループチャットで応答しない
  - H3: botがメッセージを受信しない
  - H3: botが空またはフォールバック返信を送信する
  - H3: App Secretが漏洩した
  - H2: 高度な設定
  - H3: 複数アカウント
  - H3: メッセージ制限
  - H3: ストリーミング
  - H3: グループチャット履歴コンテキスト
  - H3: reply-toモード
  - H3: Markdownヒント注入
  - H3: デバッグモード
  - H3: 複数エージェントルーティング
  - H2: 設定リファレンス
  - H2: 対応メッセージタイプ
  - H3: 受信
  - H3: 送信
  - H3: スレッドと返信
  - H2: 関連

## channels/zalo.md

- ルート: /channels/zalo
- 見出し:
  - H2: バンドル済みPlugin
  - H2: クイックセットアップ（初心者向け）
  - H2: これは何か
  - H2: セットアップ（高速パス）
  - H3: 1) botトークンを作成する（Zalo Bot Platform）
  - H3: 2) トークンを設定する（envまたはconfig）
  - H2: 仕組み（動作）
  - H2: 制限
  - H2: アクセス制御（DM）
  - H3: DMアクセス
  - H2: アクセス制御（グループ）
  - H2: ロングポーリングとWebhook
  - H2: 対応メッセージタイプ
  - H2: 機能
  - H2: 配信ターゲット（CLI/cron）
  - H2: トラブルシューティング
  - H2: 設定リファレンス（Zalo）
  - H2: 関連

## channels/zaloclawbot.md

- ルート: /channels/zaloclawbot
- 見出し:
  - H2: 互換性
  - H2: 前提条件
  - H2: onboardでインストール（推奨）
  - H2: 手動インストール
  - H3: 1. Pluginをインストールする
  - H3: 2. configでPluginを有効化する
  - H3: 3. QRコードを生成してログインする
  - H3: 4. gatewayを再起動する
  - H2: 仕組み
  - H2: 内部の仕組み
  - H2: トラブルシューティング

## channels/zalouser.md

- ルート: /channels/zalouser
- 見出し:
  - H2: バンドル済みPlugin
  - H2: クイックセットアップ（初心者向け）
  - H2: これは何か
  - H2: 命名
  - H2: IDの見つけ方（ディレクトリ）
  - H2: 制限
  - H2: アクセス制御（DM）
  - H2: グループアクセス（任意）
  - H3: グループメンションゲート
  - H2: 複数アカウント
  - H2: 環境変数
  - H2: 入力中表示、リアクション、配信確認
  - H2: トラブルシューティング
  - H2: 関連

## ci.md

- ルート: /ci
- 見出し:
  - H2: パイプライン概要
  - H2: フェイルファスト順序
  - H2: PRコンテキストと証拠
  - H2: スコープとルーティング
  - H2: ClawSweeperアクティビティ転送
  - H2: 手動ディスパッチ
  - H2: ランナー
  - H2: ランナー登録予算
  - H2: ローカル相当
  - H2: OpenClawパフォーマンス
  - H2: 完全リリース検証
  - H2: ライブとE2Eシャード
  - H2: パッケージ受け入れ
  - H3: ジョブ
  - H3: 候補ソース
  - H3: スイートプロファイル
  - H3: レガシー互換ウィンドウ
  - H3: 例
  - H2: インストールスモーク
  - H2: ローカルDocker E2E
  - H3: 調整項目
  - H3: 再利用可能なライブ/E2Eワークフロー
  - H3: リリースパスチャンク
  - H2: Pluginプレリリース
  - H2: QA Lab
  - H2: CodeQL
  - H3: セキュリティカテゴリ
  - H3: プラットフォーム固有セキュリティシャード
  - H3: 重要品質カテゴリ
  - H2: メンテナンスワークフロー
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: マージ後の重複PR
  - H2: ローカルチェックゲートと変更ルーティング
  - H2: Testbox検証
  - H2: 関連

## clawhub/cli.md

- ルート: /clawhub/cli
- 見出し:
  - H1: ClawHub CLI
  - H2: 探索とインストール
  - H2: 公開と保守
  - H2: 関連

## clawhub/publishing.md

- ルート: /clawhub/publishing
- 見出し:
  - H1: ClawHubでの公開
  - H2: オーナー
  - H2: Skills
  - H2: Plugins
  - H2: リリースフロー
  - H2: FAQ
  - H3: パッケージスコープは選択したオーナーと一致している必要があります

## cli/acp.md

- ルート: /cli/acp
- 見出し:
  - H2: これは何ではないか
  - H2: 互換性マトリックス
  - H2: 既知の制限
  - H2: 使用方法
  - H2: ACPクライアント（デバッグ）
  - H2: プロトコルスモークテスト
  - H2: これの使い方
  - H2: エージェントの選択
  - H2: acpxから使用する（Codex、Claude、その他のACPクライアント）
  - H2: Zedエディターセットアップ
  - H2: セッションマッピング
  - H2: オプション
  - H3: acpクライアントオプション
  - H2: 関連

## cli/agent.md

- ルート: /cli/agent
- 見出し:
  - H1: openclaw agent
  - H2: オプション
  - H2: 例
  - H2: 注記
  - H2: JSON配信ステータス
  - H2: 関連

## cli/agents.md

- ルート: /cli/agents
- 見出し:
  - H1: openclaw agents
  - H2: 例
  - H2: ルーティングバインディング
  - H3: --bind形式
  - H3: バインディングスコープの動作
  - H2: コマンドサーフェス
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete
  - H2: IDファイル
  - H2: IDを設定する
  - H2: 関連

## cli/approvals.md

- ルート: /cli/approvals
- 見出し:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: 一般的なコマンド
  - H2: ファイルから承認を置き換える
  - H2: 「プロンプトを表示しない」/ YOLO例
  - H2: 許可リストヘルパー
  - H2: 一般的なオプション
  - H2: 注記
  - H2: 関連

## cli/attach.md

- ルート: /cli/attach
- 見出し: なし

## cli/backup.md

- ルート: /cli/backup
- 見出し:
  - H1: openclaw backup
  - H2: 注記
  - H2: バックアップ対象
  - H2: 無効なconfigの動作
  - H2: サイズとパフォーマンス
  - H2: 関連

## cli/browser.md

- ルート: /cli/browser
- 見出し:
  - H1: openclaw browser
  - H2: 共通フラグ
  - H2: クイックスタート（ローカル）
  - H2: クイックトラブルシューティング
  - H2: ライフサイクル
  - H2: コマンドが見つからない場合
  - H2: プロファイル
  - H2: タブ
  - H2: スナップショット / スクリーンショット / アクション
  - H2: 状態とストレージ
  - H2: デバッグ
  - H2: MCP経由の既存Chrome
  - H2: リモートブラウザー制御（nodeホストプロキシ）
  - H2: 関連

## cli/channels.md

- ルート: /cli/channels
- 見出し:
  - H1: openclaw channels
  - H2: 一般的なコマンド
  - H2: ステータス / 機能 / 解決 / ログ
  - H2: アカウントの追加 / 削除
  - H2: ログインとログアウト（対話型）
  - H2: トラブルシューティング
  - H2: 機能プローブ
  - H2: 名前をIDに解決する
  - H2: 関連

## cli/clawbot.md

- ルート: /cli/clawbot
- 見出し:
  - H1: openclaw clawbot
  - H2: 移行
  - H2: 関連

## cli/commitments.md

- ルート: /cli/commitments
- 見出し:
  - H2: 使用方法
  - H2: オプション
  - H2: 例
  - H2: 出力
  - H2: 関連

## cli/completion.md

- ルート: /cli/completion
- 見出し:
  - H1: openclaw completion
  - H2: 使用方法
  - H2: オプション
  - H2: 注記
  - H2: 関連

## cli/config.md

- ルート: /cli/config
- 見出し:
  - H2: ルートオプション
  - H2: 例
  - H3: config schema
  - H3: パス
  - H2: 値
  - H2: config setモード
  - H2: config patch
  - H2: プロバイダービルダーフラグ
  - H2: ドライラン
  - H3: JSON出力形状
  - H2: 書き込み安全性
  - H2: サブコマンド
  - H2: 検証
  - H2: 関連

## cli/configure.md

- ルート: /cli/configure
- 見出し:
  - H1: openclaw configure
  - H2: オプション
  - H2: 例
  - H2: 関連

## cli/crestodian.md

- ルート: /cli/crestodian
- 見出し:
  - H1: openclaw crestodian
  - H2: Crestodianが表示するもの
  - H2: 例
  - H2: 安全な起動
  - H2: 操作と承認
  - H2: セットアップブートストラップ
  - H2: モデル支援プランナー
  - H2: エージェントへの切り替え
  - H2: メッセージレスキューモード
  - H2: 関連

## cli/cron.md

- ルート: /cli/cron
- 見出し:
  - H1: openclaw cron
  - H2: ジョブをすばやく作成する
  - H2: セッション
  - H2: 配信
  - H3: 配信の所有権
  - H3: 失敗配信
  - H2: スケジューリング
  - H3: ワンショットジョブ
  - H3: 繰り返しジョブ
  - H3: 手動実行
  - H2: モデル
  - H3: 分離cronモデルの優先順位
  - H3: 高速モード
  - H3: ライブモデル切り替えリトライ
  - H2: 実行出力と拒否
  - H3: 古い確認応答の抑制
  - H3: サイレントトークン抑制
  - H3: 構造化された拒否
  - H2: 保持
  - H2: 古いジョブの移行
  - H2: 一般的な編集
  - H2: 一般的な管理コマンド
  - H2: 関連

## cli/daemon.md

- ルート: /cli/daemon
- 見出し:
  - H1: openclaw daemon
  - H2: 使用方法
  - H2: サブコマンド
  - H2: 一般的なオプション
  - H2: 推奨
  - H2: 関連

## cli/dashboard.md

- ルート: /cli/dashboard
- 見出し:
  - H1: openclaw dashboard
  - H2: 関連

## cli/devices.md

- ルート: /cli/devices
- 見出し:
  - H1: openclaw devices
  - H2: コマンド
  - H3: openclaw devices list
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Paperclip / openclawgatewayの初回実行承認
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
  - H2: 一般的なオプション
  - H2: 注記
  - H2: トークンドリフト復旧チェックリスト
  - H2: 関連

## cli/directory.md

- ルート: /cli/directory
- 見出し:
  - H1: openclaw directory
  - H2: 共通フラグ
  - H2: 注記
  - H2: 結果をメッセージ送信で使用する
  - H2: ID形式（チャネル別）
  - H2: 自分（"me"）
  - H2: ピア（連絡先/ユーザー）
  - H2: グループ
  - H2: 関連

## cli/dns.md

- ルート: /cli/dns
- 見出し:
  - H1: openclaw dns
  - H2: セットアップ
  - H2: dns setup
  - H2: 関連

## cli/docs.md

- ルート: /cli/docs
- 見出し:
  - H1: openclaw docs
  - H2: 使用方法
  - H2: 例
  - H2: 仕組み
  - H2: 出力
  - H2: 終了コード
  - H2: 関連

## cli/doctor.md

- ルート: /cli/doctor
- 見出し:
  - H1: openclaw doctor
  - H2: 使用する理由
  - H2: 例
  - H2: オプション
  - H2: リントモード
  - H2: 構造化ヘルスチェック
  - H2: チェック選択
  - H2: アップグレード後モード
  - H2: macOS: launchctl envオーバーライド
  - H2: 関連

## cli/flows.md

- ルート: /cli/flows
- 見出し:
  - H1: openclaw tasks flow
  - H2: サブコマンド
  - H3: ステータスフィルター値
  - H2: 例
  - H2: 関連

## cli/gateway.md

- ルート: /cli/gateway
- 見出し:
  - H2: Gatewayを実行する
  - H3: オプション
  - H2: Gatewayを再起動する
  - H3: Gatewayプロファイリング
  - H2: 実行中のGatewayにクエリする
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: SSH経由のリモート（Macアプリ同等）
  - H3: gateway call
  - H2: Gatewayサービスを管理する
  - H3: ラッパーでインストール
  - H2: gatewayを検出する（Bonjour）
  - H3: gateway discover
  - H2: 関連

## cli/health.md

- ルート: /cli/health
- 見出し:
  - H1: openclaw health
  - H2: オプション
  - H2: 関連

## cli/hooks.md

- ルート: /cli/hooks
- 見出し:
  - H1: openclaw hooks
  - H2: すべての hooks を一覧表示
  - H2: hook 情報を取得
  - H2: hooks の適格性を確認
  - H2: Hook を有効化
  - H2: Hook を無効化
  - H2: 注記
  - H2: hook packs をインストール
  - H2: hook packs を更新
  - H2: バンドル済み hooks
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: 関連

## cli/index.md

- ルート: /cli
- 見出し:
  - H2: コマンドページ
  - H2: グローバルフラグ
  - H2: 出力モード
  - H2: コマンドツリー
  - H2: チャットスラッシュコマンド
  - H2: 使用状況トラッキング
  - H2: 関連

## cli/infer.md

- ルート: /cli/infer
- 見出し:
  - H2: infer を skill に変換
  - H2: infer を使う理由
  - H2: コマンドツリー
  - H2: 一般的なタスク
  - H2: 動作
  - H2: モデル
  - H2: 画像
  - H2: 音声
  - H2: TTS
  - H2: 動画
  - H2: Web
  - H2: Embedding
  - H2: JSON 出力
  - H2: よくある落とし穴
  - H2: 注記
  - H2: 関連

## cli/logs.md

- ルート: /cli/logs
- 見出し:
  - H1: openclaw logs
  - H2: オプション
  - H2: 共有 Gateway RPC オプション
  - H2: 例
  - H2: 注記
  - H2: 関連

## cli/mcp.md

- ルート: /cli/mcp
- 見出し:
  - H2: 適切な MCP パスを選択
  - H2: MCP サーバーとしての OpenClaw
  - H3: serve を使う場合
  - H3: 仕組み
  - H3: クライアントモードを選択
  - H3: serve が公開するもの
  - H3: 使用方法
  - H3: ブリッジツール
  - H3: イベントモデル
  - H3: Claude チャンネル通知
  - H3: MCP クライアント設定
  - H3: オプション
  - H3: セキュリティと信頼境界
  - H3: テスト
  - H3: トラブルシューティング
  - H2: MCP クライアントレジストリとしての OpenClaw
  - H3: 保存済み MCP サーバー定義
  - H3: 一般的なサーバーレシピ
  - H3: JSON 出力形状
  - H3: Stdio トランスポート
  - H3: SSE / HTTP トランスポート
  - H3: OAuth ワークフロー
  - H3: ストリーム可能 HTTP トランスポート
  - H2: Control UI
  - H2: 現在の制限
  - H2: 関連

## cli/memory.md

- ルート: /cli/memory
- 見出し:
  - H1: openclaw memory
  - H2: 例
  - H2: オプション
  - H2: Dreaming
  - H2: 関連

## cli/message.md

- ルート: /cli/message
- 見出し:
  - H1: openclaw message
  - H2: 使用方法
  - H2: 一般的なフラグ
  - H2: SecretRef の動作
  - H2: アクション
  - H3: コア
  - H3: スレッド
  - H3: 絵文字
  - H3: ステッカー
  - H3: ロール / チャンネル / メンバー / ボイス
  - H3: イベント
  - H3: モデレーション (Discord)
  - H3: ブロードキャスト
  - H2: 例
  - H2: 関連

## cli/migrate.md

- ルート: /cli/migrate
- 見出し:
  - H1: openclaw migrate
  - H2: コマンド
  - H2: 安全モデル
  - H2: Claude プロバイダー
  - H3: Claude がインポートするもの
  - H3: アーカイブと手動レビュー状態
  - H2: Codex プロバイダー
  - H3: Codex がインポートするもの
  - H3: 手動レビュー Codex 状態
  - H2: Hermes プロバイダー
  - H3: Hermes がインポートするもの
  - H3: サポートされる .env キー
  - H3: アーカイブ専用状態
  - H3: 適用後
  - H2: Plugin 契約
  - H2: オンボーディング統合
  - H2: 関連

## cli/models.md

- ルート: /cli/models
- 見出し:
  - H1: openclaw models
  - H2: 一般的なコマンド
  - H3: モデルスキャン
  - H3: モデルステータス
  - H2: エイリアス + フォールバック
  - H2: 認証プロファイル
  - H2: 関連

## cli/node.md

- ルート: /cli/node
- 見出し:
  - H1: openclaw node
  - H2: node ホストを使う理由
  - H2: ブラウザプロキシ (ゼロ設定)
  - H2: 実行 (フォアグラウンド)
  - H2: node ホストの Gateway 認証
  - H2: サービス (バックグラウンド)
  - H2: ペアリング
  - H2: exec 承認
  - H2: 関連

## cli/nodes.md

- ルート: /cli/nodes
- 見出し:
  - H1: openclaw nodes
  - H2: 一般的なコマンド
  - H2: 呼び出し
  - H2: 関連

## cli/onboard.md

- ルート: /cli/onboard
- 見出し:
  - H1: openclaw onboard
  - H2: 関連ガイド
  - H2: 例
  - H2: ロケール
  - H3: 非対話型 Z.AI エンドポイント選択
  - H2: 追加の非対話型フラグ
  - H2: フロー注記
  - H2: 一般的なフォローアップコマンド

## cli/pairing.md

- ルート: /cli/pairing
- 見出し:
  - H1: openclaw pairing
  - H2: コマンド
  - H2: pairing list
  - H2: pairing approve
  - H2: 注記
  - H2: 関連

## cli/path.md

- ルート: /cli/path
- 見出し:
  - H1: openclaw path
  - H2: 使う理由
  - H2: 使用方法
  - H2: 仕組み
  - H2: サブコマンド
  - H2: グローバルフラグ
  - H2: oc:// 構文
  - H2: ファイル種別によるアドレス指定
  - H2: 変更契約
  - H2: 例
  - H2: ファイル種別ごとのレシピ
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: サブコマンドリファレンス
  - H3: resolve
  - H3: find
  - H3: set
  - H3: validate
  - H3: emit
  - H2: 終了コード
  - H2: 出力モード
  - H2: 注記
  - H2: 関連

## cli/plugins.md

- ルート: /cli/plugins
- 見出し:
  - H2: コマンド
  - H3: 作者
  - H3: プロバイダースキャフォールド
  - H3: インストール
  - H4: Marketplace 省略表記
  - H3: 一覧
  - H3: Plugin インデックス
  - H3: アンインストール
  - H3: 更新
  - H3: 検査
  - H3: Doctor
  - H3: レジストリ
  - H3: Marketplace
  - H2: 関連

## cli/policy.md

- ルート: /cli/policy
- 見出し:
  - H1: openclaw policy
  - H2: クイックスタート
  - H3: ポリシールールリファレンス
  - H4: スコープ付きオーバーレイ
  - H4: チャンネル
  - H4: MCP サーバー
  - H4: モデルプロバイダー
  - H4: ネットワーク
  - H4: イングレスとチャンネルアクセス
  - H4: Gateway
  - H4: エージェントワークスペース
  - H4: サンドボックス姿勢
  - H4: データ処理
  - H4: シークレット
  - H4: exec 承認
  - H4: 認証プロファイル
  - H4: ツールメタデータ
  - H4: ツール姿勢
  - H2: ポリシーを設定
  - H2: ポリシー状態を受け入れる
  - H2: 検出事項
  - H2: 修復
  - H2: 終了コード
  - H2: 関連

## cli/proxy.md

- ルート: /cli/proxy
- 見出し:
  - H1: openclaw proxy
  - H2: コマンド
  - H2: 検証
  - H2: クエリプリセット
  - H2: 注記
  - H2: 関連

## cli/qr.md

- ルート: /cli/qr
- 見出し:
  - H1: openclaw qr
  - H2: 使用方法
  - H2: オプション
  - H2: 注記
  - H2: 関連

## cli/reset.md

- ルート: /cli/reset
- 見出し:
  - H1: openclaw reset
  - H2: 関連

## cli/sandbox.md

- ルート: /cli/sandbox
- 見出し:
  - H2: 概要
  - H2: コマンド
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: ユースケース
  - H3: Docker イメージ更新後
  - H3: サンドボックス設定変更後
  - H3: SSH ターゲットまたは SSH 認証素材変更後
  - H3: OpenShell ソース、ポリシー、またはモード変更後
  - H3: setupCommand 変更後
  - H3: 特定のエージェントのみ
  - H2: これが必要な理由
  - H2: レジストリ移行
  - H2: 設定
  - H2: 関連

## cli/secrets.md

- ルート: /cli/secrets
- 見出し:
  - H1: openclaw secrets
  - H2: ランタイムスナップショットを再読み込み
  - H2: 監査
  - H2: 設定 (対話型ヘルパー)
  - H2: 保存済みプランを適用
  - H2: ロールバックバックアップがない理由
  - H2: 例
  - H2: 関連

## cli/security.md

- ルート: /cli/security
- 見出し:
  - H1: openclaw security
  - H2: 監査
  - H2: JSON 出力
  - H2: --fix が変更する内容
  - H2: 関連

## cli/sessions.md

- ルート: /cli/sessions
- 見出し:
  - H1: openclaw sessions
  - H2: クリーンアップメンテナンス
  - H2: セッションを compact
  - H3: sessions.compact RPC
  - H2: 関連

## cli/setup.md

- ルート: /cli/setup
- 見出し:
  - H1: openclaw setup
  - H2: オプション
  - H3: ベースラインモード
  - H2: 例
  - H2: 注記
  - H2: 関連

## cli/skills.md

- ルート: /cli/skills
- 見出し:
  - H1: openclaw skills
  - H2: コマンド
  - H2: Skill Workshop
  - H2: 関連

## cli/status.md

- ルート: /cli/status
- 見出し:
  - H2: 関連

## cli/system.md

- ルート: /cli/system
- 見出し:
  - H1: openclaw system
  - H2: 一般的なコマンド
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: 注記
  - H2: 関連

## cli/tasks.md

- ルート: /cli/tasks
- 見出し:
  - H2: 使用方法
  - H2: ルートオプション
  - H2: サブコマンド
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: 関連

## cli/transcripts.md

- ルート: /cli/transcripts
- 見出し:
  - H1: openclaw transcripts
  - H2: コマンド
  - H2: 出力
  - H2: 1 日あたり多数のミーティング
  - H2: 要約がない場合
  - H2: 設定

## cli/tui.md

- ルート: /cli/tui
- 見出し:
  - H1: openclaw tui
  - H2: オプション
  - H2: 例
  - H2: 設定修復ループ
  - H2: 関連

## cli/uninstall.md

- ルート: /cli/uninstall
- 見出し:
  - H1: openclaw uninstall
  - H2: 関連

## cli/update.md

- ルート: /cli/update
- 見出し:
  - H1: openclaw update
  - H2: 使用方法
  - H2: オプション
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: 実行内容
  - H3: コントロールプレーンのレスポンス形状
  - H2: Git チェックアウトフロー
  - H3: チャンネル選択
  - H3: 更新手順
  - H2: --update 省略表記
  - H2: 関連

## cli/voicecall.md

- ルート: /cli/voicecall
- 見出し:
  - H1: openclaw voicecall
  - H2: サブコマンド
  - H2: セットアップとスモーク
  - H3: setup
  - H3: smoke
  - H2: 通話ライフサイクル
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: ログとメトリクス
  - H3: tail
  - H3: latency
  - H2: Webhook の公開
  - H3: expose
  - H2: 関連

## cli/webhooks.md

- ルート: /cli/webhooks
- 見出し:
  - H1: openclaw webhooks
  - H2: サブコマンド
  - H2: webhooks gmail setup
  - H3: 必須
  - H3: Pub/Sub オプション
  - H3: OpenClaw 配信オプション
  - H3: gog watch serve オプション
  - H3: Tailscale 公開
  - H3: 出力
  - H2: webhooks gmail run
  - H2: エンドツーエンドフロー
  - H2: 関連

## cli/wiki.md

- ルート: /cli/wiki
- 見出し:
  - H1: openclaw wiki
  - H2: 目的
  - H2: 一般的なコマンド
  - H2: コマンド
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest
  - H3: wiki okf import
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search
  - H3: wiki get
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: 実用的な使用ガイダンス
  - H2: 設定との連携
  - H2: 関連

## cli/workboard.md

- ルート: /cli/workboard
- 見出し:
  - H2: 使用方法
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: スラッシュコマンドの同等性
  - H2: 権限
  - H2: トラブルシューティング
  - H3: カードが表示されない
  - H3: dispatch がデータ専用と表示する
  - H3: dispatch が何も開始しない
  - H2: 関連

## concepts/active-memory.md

- ルート: /concepts/active-memory
- 見出し:
  - H2: クイックスタート
  - H2: 速度の推奨事項
  - H3: Cerebras セットアップ
  - H2: 表示方法
  - H2: セッション切り替え
  - H2: 実行タイミング
  - H2: セッションタイプ
  - H2: 実行場所
  - H2: 使う理由
  - H2: 仕組み
  - H2: クエリモード
  - H2: プロンプトスタイル
  - H2: モデルフォールバックポリシー
  - H2: メモリツール
  - H3: 組み込み memory-core
  - H3: LanceDB メモリ
  - H3: Lossless Claw
  - H2: 高度なエスケープハッチ
  - H2: トランスクリプト永続化
  - H2: 設定
  - H2: 推奨セットアップ
  - H3: コールドスタート猶予
  - H2: デバッグ
  - H2: よくある問題
  - H2: 関連ページ

## concepts/agent-loop.md

- ルート: /concepts/agent-loop
- 見出し:
  - H2: エントリーポイント
  - H2: 仕組み (概要)
  - H2: キューイング + 並行処理
  - H2: セッション + ワークスペース準備
  - H2: プロンプト組み立て + システムプロンプト
  - H2: フックポイント (割り込み可能な場所)
  - H3: 内部フック (Gateway フック)
  - H3: Plugin フック (エージェント + gateway ライフサイクル)
  - H2: ストリーミング + 部分返信
  - H2: ツール実行 + メッセージングツール
  - H2: 返信整形 + 抑制
  - H2: Compaction + 再試行
  - H2: イベントストリーム (現在)
  - H2: チャットチャンネル処理
  - H2: タイムアウト
  - H2: 早期終了し得る箇所
  - H2: 関連

## concepts/agent-runtimes.md

- ルート: /concepts/agent-runtimes
- 見出し:
  - H2: Codex サーフェス
  - H2: ランタイム所有権
  - H2: ランタイム選択
  - H2: GitHub Copilot エージェントランタイム
  - H2: 互換性契約
  - H2: ステータスラベル
  - H2: 関連

## concepts/agent-workspace.md

- ルート: /concepts/agent-workspace
- 見出し:
  - H2: デフォルトの場所
  - H2: 追加ワークスペースフォルダー
  - H2: ワークスペースファイルマップ
  - H2: ワークスペースに含まれないもの
  - H2: Git バックアップ (推奨、非公開)
  - H2: シークレットをコミットしない
  - H2: ワークスペースを新しいマシンへ移動
  - H2: 高度な注記
  - H2: 関連

## concepts/agent.md

- ルート: /concepts/agent
- 見出し:
  - H2: ワークスペース（必須）
  - H2: ブートストラップファイル（注入）
  - H2: 組み込みツール
  - H2: Skills
  - H2: ランタイム境界
  - H2: セッション
  - H2: ストリーミング中の誘導
  - H2: モデル参照
  - H2: 設定（最小）
  - H2: 関連

## concepts/architecture.md

- ルート: /concepts/architecture
- 見出し:
  - H2: 概要
  - H2: コンポーネントとフロー
  - H3: Gateway（デーモン）
  - H3: クライアント（Macアプリ / CLI / Web管理）
  - H3: ノード（macOS / iOS / Android / ヘッドレス）
  - H3: WebChat
  - H2: 接続ライフサイクル（単一クライアント）
  - H2: ワイヤプロトコル（概要）
  - H2: ペアリング + ローカル信頼
  - H2: プロトコルの型付けとコード生成
  - H2: リモートアクセス
  - H2: 運用スナップショット
  - H2: 不変条件
  - H2: 関連

## concepts/channel-docking.md

- ルート: /concepts/channel-docking
- 見出し:
  - H2: 例
  - H2: 使用する理由
  - H2: 必須設定
  - H2: コマンド
  - H2: 変更されること
  - H2: 変更されないこと
  - H2: トラブルシューティング

## concepts/commitments.md

- ルート: /concepts/commitments
- 見出し:
  - H2: コミットメントを有効化
  - H2: 仕組み
  - H2: スコープ
  - H2: コミットメントとリマインダー
  - H2: コミットメントを管理
  - H2: プライバシーとコスト
  - H2: トラブルシューティング
  - H2: 関連

## concepts/compaction.md

- ルート: /concepts/compaction
- 見出し:
  - H2: 仕組み
  - H2: 自動Compaction
  - H2: 手動Compaction
  - H2: 設定
  - H3: 別のモデルを使用する
  - H3: 識別子の保持
  - H3: アクティブなトランスクリプトのバイトガード
  - H3: 後続トランスクリプト
  - H3: Compaction通知
  - H3: メモリフラッシュ
  - H2: プラグ可能なCompactionプロバイダー
  - H2: Compactionと枝刈り
  - H2: トラブルシューティング
  - H2: 関連

## concepts/context-engine.md

- ルート: /concepts/context-engine
- 見出し:
  - H2: クイックスタート
  - H2: 仕組み
  - H3: サブエージェントのライフサイクル（任意）
  - H3: システムプロンプトへの追加
  - H2: レガシーエンジン
  - H2: Pluginエンジン
  - H3: ContextEngineインターフェース
  - H3: ランタイム設定
  - H3: ホスト要件
  - H3: 障害の分離
  - H3: ownsCompaction
  - H2: 設定リファレンス
  - H2: Compactionとメモリとの関係
  - H2: ヒント
  - H2: 関連

## concepts/context.md

- ルート: /concepts/context
- 見出し:
  - H2: クイックスタート（コンテキストを検査）
  - H2: 出力例
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: コンテキストウィンドウに含まれるもの
  - H2: OpenClawがシステムプロンプトを構築する方法
  - H2: 注入されるワークスペースファイル（プロジェクトコンテキスト）
  - H2: Skills: 注入とオンデマンド読み込み
  - H2: ツール: 2つのコスト
  - H2: コマンド、ディレクティブ、「インラインショートカット」
  - H2: セッション、Compaction、枝刈り（永続化されるもの）
  - H2: /contextが実際に報告する内容
  - H2: 関連

## concepts/delegate-architecture.md

- ルート: /concepts/delegate-architecture
- 見出し:
  - H2: デリゲートとは
  - H2: デリゲートを使う理由
  - H2: 機能ティア
  - H3: ティア1: 読み取り専用 + 下書き
  - H3: ティア2: 代理送信
  - H3: ティア3: プロアクティブ
  - H2: 前提条件: 分離と強化
  - H3: ハードブロック（交渉不可）
  - H3: ツール制限
  - H3: サンドボックス分離
  - H3: 監査証跡
  - H2: デリゲートのセットアップ
  - H3: 1. デリゲートエージェントを作成する
  - H3: 2. アイデンティティプロバイダーの委任を設定する
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. デリゲートをチャネルにバインドする
  - H3: 4. デリゲートエージェントに資格情報を追加する
  - H2: 例: 組織アシスタント
  - H2: スケーリングパターン
  - H2: 関連

## concepts/dreaming.md

- ルート: /concepts/dreaming
- 見出し:
  - H2: Dreamingが書き込むもの
  - H2: フェーズモデル
  - H2: セッショントランスクリプトの取り込み
  - H2: Dream Diary
  - H2: 深いランキングシグナル
  - H2: QAシャドウトライアルレポートのカバレッジ
  - H2: スケジューリング
  - H2: クイックスタート
  - H2: スラッシュコマンド
  - H2: CLIワークフロー
  - H2: 主要なデフォルト
  - H2: Dreams UI
  - H2: Dreamingが実行されない: ステータスがブロック中と表示される
  - H2: 関連

## concepts/experimental-features.md

- ルート: /concepts/experimental-features
- 見出し:
  - H2: 現在文書化されているフラグ
  - H2: ローカルモデルのリーンモード
  - H3: この3つのツールを使う理由
  - H3: 有効にするタイミング
  - H3: 無効のままにするタイミング
  - H3: 有効化
  - H2: 実験的は非表示を意味しない
  - H2: 関連

## concepts/features.md

- ルート: /concepts/features
- 見出し:
  - H2: ハイライト
  - H2: 完全な一覧
  - H2: 関連

## concepts/mantis-slack-desktop-runbook.md

- ルート: /concepts/mantis-slack-desktop-runbook
- 見出し:
  - H2: ストレージモデル
  - H2: GitHubディスパッチ
  - H2: ローカルCLI
  - H2: ハイドレートモード
  - H2: タイミングの解釈
  - H2: エビデンスチェックリスト
  - H2: 障害処理
  - H2: 関連

## concepts/mantis.md

- ルート: /concepts/mantis
- 見出し:
  - H2: 目標
  - H2: 非目標
  - H2: 所有権
  - H2: コマンド形状
  - H2: 実行ライフサイクル
  - H2: Discord MVP
  - H2: 既存のQA部品
  - H2: エビデンスモデル
  - H2: ブラウザーとVNC
  - H2: マシン
  - H2: シークレット
  - H2: GitHubアーティファクトとPRコメント
  - H2: プライベートデプロイメモ
  - H2: シナリオの追加
  - H2: プロバイダー拡張
  - H2: 未解決の質問

## concepts/markdown-formatting.md

- ルート: /concepts/markdown-formatting
- 見出し:
  - H2: 目標
  - H2: パイプライン
  - H2: IR例
  - H2: 使用箇所
  - H2: テーブル処理
  - H2: チャンク化ルール
  - H2: リンクポリシー
  - H2: スポイラー
  - H2: チャネルフォーマッターを追加または更新する方法
  - H2: よくある落とし穴
  - H2: 関連

## concepts/memory-builtin.md

- ルート: /concepts/memory-builtin
- 見出し:
  - H2: 提供内容
  - H2: はじめに
  - H2: 対応する埋め込みプロバイダー
  - H2: インデックス作成の仕組み
  - H2: 使用するタイミング
  - H2: トラブルシューティング
  - H2: 設定
  - H2: 関連

## concepts/memory-honcho.md

- ルート: /concepts/memory-honcho
- 見出し:
  - H2: 提供内容
  - H2: 利用可能なツール
  - H2: はじめに
  - H2: 設定
  - H2: 既存メモリの移行
  - H2: 仕組み
  - H2: Honchoと組み込みメモリの比較
  - H2: CLIコマンド
  - H2: 参考資料
  - H2: 関連

## concepts/memory-qmd.md

- ルート: /concepts/memory-qmd
- 見出し:
  - H2: 組み込みに対して追加されるもの
  - H2: はじめに
  - H3: 前提条件
  - H3: 有効化
  - H2: サイドカーの仕組み
  - H2: 検索パフォーマンスと互換性
  - H2: モデルオーバーライド
  - H2: 追加パスのインデックス作成
  - H2: セッショントランスクリプトのインデックス作成
  - H2: 検索スコープ
  - H2: 引用
  - H2: 使用するタイミング
  - H2: トラブルシューティング
  - H2: 設定
  - H2: 関連

## concepts/memory-search.md

- ルート: /concepts/memory-search
- 見出し:
  - H2: クイックスタート
  - H2: 対応プロバイダー
  - H2: 検索の仕組み
  - H2: 検索品質の改善
  - H3: 時間減衰
  - H3: MMR（多様性）
  - H3: 両方を有効化
  - H2: マルチモーダルメモリ
  - H2: セッションメモリ検索
  - H2: トラブルシューティング
  - H2: 参考資料
  - H2: 関連

## concepts/memory.md

- ルート: /concepts/memory
- 見出し:
  - H2: 仕組み
  - H2: 何がどこに入るか
  - H2: アクション感知メモリ
  - H2: 推論されたコミットメント
  - H2: メモリツール
  - H2: Memory WikiコンパニオンPlugin
  - H2: メモリ検索
  - H2: メモリバックエンド
  - H2: ナレッジWikiレイヤー
  - H2: 自動メモリフラッシュ
  - H2: Dreaming
  - H2: 根拠付きバックフィルとライブ昇格
  - H2: CLI
  - H2: 参考資料
  - H2: 関連

## concepts/message-lifecycle-refactor.md

- ルート: /concepts/message-lifecycle-refactor
- 見出し:
  - H2: 問題
  - H2: 目標
  - H2: 非目標
  - H2: 参照モデル
  - H2: コアモデル
  - H2: メッセージ用語
  - H3: メッセージ
  - H3: ターゲット
  - H3: 関係
  - H3: 起点
  - H3: 受信確認
  - H2: 受信コンテキスト
  - H2: 送信コンテキスト
  - H2: ライブコンテキスト
  - H2: アダプターサーフェス
  - H2: パブリックSDKの縮小
  - H2: チャネル受信との関係
  - H2: 互換性ガードレール
  - H2: 内部ストレージ
  - H2: 障害クラス
  - H2: チャネルマッピング
  - H2: 移行計画
  - H3: フェーズ1: 内部メッセージドメイン
  - H3: フェーズ2: 永続送信コア
  - H3: フェーズ3: チャネル受信ブリッジ
  - H3: フェーズ4: 準備済みDispatcherブリッジ
  - H3: フェーズ5: 統合ライブライフサイクル
  - H3: フェーズ6: パブリックSDK
  - H3: フェーズ7: すべての送信元
  - H3: フェーズ8: Turn名互換性の削除
  - H2: テスト計画
  - H2: 未解決の質問
  - H2: 受け入れ基準
  - H2: 関連

## concepts/messages.md

- ルート: /concepts/messages
- 見出し:
  - H2: メッセージフロー（高レベル）
  - H2: 受信重複排除
  - H2: 受信デバウンス
  - H2: セッションとデバイス
  - H2: ツール結果メタデータ
  - H2: 受信本文と履歴コンテキスト
  - H2: キューイングとフォローアップ
  - H2: チャネル実行の所有権
  - H2: ストリーミング、チャンク化、バッチ処理
  - H2: 推論の可視性とトークン
  - H2: プレフィックス、スレッド化、返信
  - H2: サイレント返信
  - H2: 関連

## concepts/model-failover.md

- ルート: /concepts/model-failover
- 見出し:
  - H2: ランタイムフロー
  - H2: 選択ソースポリシー
  - H2: 認証失敗スキップキャッシュ
  - H2: ユーザーに表示されるフォールバック通知
  - H2: 認証ストレージ（キー + OAuth）
  - H2: プロファイルID
  - H2: ローテーション順序
  - H3: セッション固定（キャッシュに適している）
  - H3: OpenAI CodexサブスクリプションとAPIキーバックアップ
  - H2: クールダウン
  - H2: 請求による無効化
  - H2: モデルフォールバック
  - H3: 候補チェーンルール
  - H3: フォールバックを進めるエラー
  - H3: クールダウンスキップとプローブ動作
  - H2: セッションオーバーライドとライブモデル切り替え
  - H2: 可観測性と失敗サマリー
  - H2: 関連設定

## concepts/model-providers.md

- ルート: /concepts/model-providers
- 見出し:
  - H2: クイックルール
  - H2: Plugin所有のプロバイダー動作
  - H2: APIキーローテーション
  - H2: 公式プロバイダーPlugin
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: その他のサブスクリプション型ホストオプション
  - H3: OpenCode
  - H3: Google Gemini（APIキー）
  - H3: Google VertexとGemini CLI
  - H3: Z.AI（GLM）
  - H3: Vercel AI Gateway
  - H3: その他のバンドル済みプロバイダーPlugin
  - H4: 知っておく価値のある癖
  - H2: models.providers経由のプロバイダー（カスタム/base URL）
  - H3: Moonshot AI（Kimi）
  - H3: Kimi coding
  - H3: Volcano Engine（Doubao）
  - H3: BytePlus（International）
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: ローカルプロキシ（LM Studio、vLLM、LiteLLMなど）
  - H2: CLI例
  - H2: 関連

## concepts/models.md

- ルート: /concepts/models
- 見出し:
  - H2: モデル選択の仕組み
  - H2: 選択ソースとフォールバック動作
  - H2: クイックモデルポリシー
  - H2: オンボーディング（推奨）
  - H2: 設定キー（概要）
  - H3: 安全な許可リスト編集
  - H2: 「Model is not allowed」（および返信が止まる理由）
  - H2: チャットでモデルを切り替える（/model）
  - H2: CLIコマンド
  - H3: models list
  - H3: models status
  - H2: スキャン（OpenRouter無料モデル）
  - H2: モデルレジストリ（models.json）
  - H2: 関連

## concepts/multi-agent.md

- ルート: /concepts/multi-agent
- 見出し:
  - H2: 「1つのエージェント」とは
  - H2: パス（クイックマップ）
  - H3: 単一エージェントモード（デフォルト）
  - H2: エージェントヘルパー
  - H2: クイックスタート
  - H2: 複数エージェント = 複数人、複数の人格
  - H2: エージェント横断QMDメモリ検索
  - H2: 1つのWhatsApp番号、複数人（DM分割）
  - H2: ルーティングルール（メッセージがエージェントを選ぶ方法）
  - H2: 複数アカウント / 電話番号
  - H2: 概念
  - H2: プラットフォーム例
  - H2: 一般的なパターン
  - H2: エージェントごとのサンドボックスとツール設定
  - H2: 関連

## concepts/oauth.md

- ルート: /concepts/oauth
- 見出し:
  - H2: トークンシンク（存在する理由）
  - H2: ストレージ（トークンの保存場所）
  - H2: Anthropicレガシートークン互換性
  - H2: Anthropic Claude CLI移行
  - H2: OAuth交換（ログインの仕組み）
  - H3: Anthropic setup-token
  - H3: OpenAI Codex（ChatGPT OAuth）
  - H2: 更新 + 有効期限
  - H2: 複数アカウント（プロファイル）+ ルーティング
  - H3: 1) 推奨: エージェントを分ける
  - H3: 2) 高度: 1つのエージェントに複数プロファイル
  - H2: 関連

## concepts/parallel-specialist-lanes.md

- ルート: /concepts/parallel-specialist-lanes
- 見出し:
  - H2: 第一原則
  - H2: 推奨ロールアウト
  - H3: フェーズ 1: レーン契約 + バックグラウンドの重い処理
  - H3: フェーズ 2: 優先度と並行実行の制御
  - H3: フェーズ 3: コーディネーター / トラフィックコントローラー
  - H2: 最小レーン契約テンプレート
  - H2: 関連

## concepts/personal-agent-benchmark-pack.md

- ルート: /concepts/personal-agent-benchmark-pack
- 見出し:
  - H2: シナリオ
  - H2: プライバシーモデル
  - H2: パックの拡張

## concepts/presence.md

- ルート: /concepts/presence
- 見出し:
  - H2: プレゼンスフィールド（表示される内容）
  - H2: 生成元（プレゼンスの由来）
  - H3: 1) Gateway 自身のエントリ
  - H3: 2) WebSocket 接続
  - H4: 一回限りの CLI コマンドが表示されない理由
  - H3: 3) system-event ビーコン
  - H3: 4) Node 接続（role: node）
  - H2: マージ + 重複排除ルール（instanceId が重要な理由）
  - H2: TTL と制限付きサイズ
  - H2: リモート/トンネルの注意点（loopback IP）
  - H2: コンシューマー
  - H3: macOS の Instances タブ
  - H2: デバッグのヒント
  - H2: 関連

## concepts/progress-drafts.md

- ルート: /concepts/progress-drafts
- 見出し:
  - H2: クイックスタート
  - H2: ユーザーに表示される内容
  - H2: モードを選択
  - H2: ラベルを設定
  - H2: 進捗行を制御
  - H2: チャネルの動作
  - H2: 確定
  - H2: トラブルシューティング
  - H2: 関連

## concepts/qa-e2e-automation.md

- ルート: /concepts/qa-e2e-automation
- 見出し:
  - H2: コマンド面
  - H2: オペレーターフロー
  - H2: ライブトランスポートのカバレッジ
  - H2: Telegram、Discord、Slack、WhatsApp QA リファレンス
  - H3: 共通 CLI フラグ
  - H3: Telegram QA
  - H3: Discord QA
  - H3: Slack QA
  - H4: Slack ワークスペースの設定
  - H3: WhatsApp QA
  - H3: Convex 認証情報プール
  - H2: リポジトリに基づくシード
  - H2: プロバイダーモックレーン
  - H2: トランスポートアダプター
  - H3: チャネルの追加
  - H3: シナリオヘルパー名
  - H2: レポート
  - H2: 関連ドキュメント

## concepts/qa-matrix.md

- ルート: /concepts/qa-matrix
- 見出し:
  - H2: クイックスタート
  - H2: レーンの役割
  - H2: CLI
  - H3: 共通フラグ
  - H3: プロバイダーフラグ
  - H2: プロファイル
  - H2: シナリオ
  - H2: 環境変数
  - H2: 出力成果物
  - H2: トリアージのヒント
  - H2: ライブトランスポート契約
  - H2: 関連

## concepts/queue-steering.md

- ルート: /concepts/queue-steering
- 見出し:
  - H2: ランタイム境界
  - H2: モード
  - H2: バースト例
  - H2: スコープ
  - H2: デバウンス
  - H2: 関連

## concepts/queue.md

- ルート: /concepts/queue
- 見出し:
  - H2: 理由
  - H2: 仕組み
  - H2: デフォルト
  - H2: キューモード
  - H2: キューオプション
  - H2: ステアリングとストリーミング
  - H2: 優先順位
  - H2: セッション単位のオーバーライド
  - H2: スコープと保証
  - H2: トラブルシューティング
  - H2: 関連

## concepts/retry.md

- ルート: /concepts/retry
- 見出し:
  - H2: 目標
  - H2: デフォルト
  - H2: 動作
  - H3: モデルプロバイダー
  - H3: Discord
  - H3: Telegram
  - H2: 設定
  - H2: 注記
  - H2: 関連

## concepts/session-pruning.md

- ルート: /concepts/session-pruning
- 見出し:
  - H2: 重要な理由
  - H2: 仕組み
  - H2: レガシー画像のクリーンアップ
  - H2: スマートデフォルト
  - H2: 有効化または無効化
  - H2: プルーニングと Compaction
  - H2: 参考資料
  - H2: 関連

## concepts/session-tool.md

- ルート: /concepts/session-tool
- 見出し:
  - H2: 利用可能なツール
  - H2: セッションの一覧表示と読み取り
  - H2: セッション間メッセージの送信
  - H2: ステータスとオーケストレーションヘルパー
  - H2: サブエージェントの起動
  - H2: 可視性
  - H2: 参考資料
  - H2: 関連

## concepts/session.md

- ルート: /concepts/session
- 見出し:
  - H2: メッセージのルーティング方法
  - H2: DM 分離
  - H3: Dock にリンクされたチャネル
  - H2: セッションライフサイクル
  - H2: 状態の保存場所
  - H2: セッションメンテナンス
  - H2: セッションの調査
  - H2: 参考資料
  - H2: 関連

## concepts/soul.md

- ルート: /concepts/soul
- 見出し:
  - H2: SOUL.md に含めるべき内容
  - H2: これが機能する理由
  - H2: Molty プロンプト
  - H2: 良い状態の例
  - H2: 1 つの警告
  - H2: 関連

## concepts/streaming.md

- ルート: /concepts/streaming
- 見出し:
  - H2: ブロックストリーミング（チャネルメッセージ）
  - H3: ブロックストリーミングでのメディア配信
  - H2: チャンク化アルゴリズム（下限/上限）
  - H2: 結合（ストリーミングされたブロックをマージ）
  - H2: ブロック間の人間らしいペーシング
  - H2: 「チャンクをストリームするか、すべてを送るか」
  - H2: プレビューストリーミングモード
  - H3: チャネルマッピング
  - H3: ランタイム動作
  - H3: ツール進捗プレビュー更新
  - H3: commentary 進捗レーン
  - H2: 関連

## concepts/system-prompt.md

- ルート: /concepts/system-prompt
- 見出し:
  - H2: 構造
  - H2: プロンプトモード
  - H2: プロンプトスナップショット
  - H2: ワークスペースブートストラップ注入
  - H2: 時刻の扱い
  - H2: Skills
  - H2: ドキュメント
  - H2: 関連

## concepts/timezone.md

- ルート: /concepts/timezone
- 見出し:
  - H2: 3 つのタイムゾーン面
  - H2: ユーザータイムゾーンの設定
  - H2: オーバーライドする場合
  - H2: 関連

## concepts/typebox.md

- ルート: /concepts/typebox
- 見出し:
  - H2: メンタルモデル（30 秒）
  - H2: スキーマの配置場所
  - H2: 現在のパイプライン
  - H2: ランタイムでのスキーマの使用方法
  - H2: フレーム例
  - H2: 最小クライアント（Node.js）
  - H2: 実例: メソッドをエンドツーエンドで追加
  - H2: Swift コード生成の動作
  - H2: バージョニング + 互換性
  - H2: スキーマパターンと規約
  - H2: ライブスキーマ JSON
  - H2: スキーマを変更する場合
  - H2: 関連

## concepts/typing-indicators.md

- ルート: /concepts/typing-indicators
- 見出し:
  - H2: デフォルト
  - H2: モード
  - H2: 設定
  - H2: 注記
  - H2: 関連

## concepts/usage-tracking.md

- ルート: /concepts/usage-tracking
- 見出し:
  - H2: 概要
  - H2: 表示される場所
  - H2: デフォルトの使用量フッターモード
  - H3: 3 つの異なるセッション状態
  - H3: 優先順位
  - H3: リセットと無効化の違い
  - H3: トグル動作
  - H3: 設定
  - H2: カスタム /usage フルフッター
  - H3: 形状
  - H3: 契約パス
  - H3: 動詞
  - H3: ピース形式
  - H3: 例
  - H2: プロバイダー + 認証情報
  - H2: 関連

## date-time.md

- ルート: /date-time
- 見出し:
  - H2: メッセージエンベロープ（デフォルトはローカル）
  - H3: 例
  - H2: システムプロンプト: 現在の日付と時刻
  - H2: システムイベント行（デフォルトはローカル）
  - H3: ユーザータイムゾーン + 形式の設定
  - H2: 時刻形式の検出（自動）
  - H2: ツールペイロード + コネクター（生のプロバイダー時刻 + 正規化フィールド）
  - H2: 関連ドキュメント

## debug/node-issue.md

- ルート: /debug/node-issue
- 見出し:
  - H1: Node + tsx の「\\name is not a function」クラッシュ
  - H2: 概要
  - H2: 環境
  - H2: 再現（Node のみ）
  - H2: リポジトリ内の最小再現
  - H2: Node バージョン確認
  - H2: 注記 / 仮説
  - H2: 回帰履歴
  - H2: 回避策
  - H2: 参照
  - H2: 次のステップ
  - H2: 関連

## diagnostics/flags.md

- ルート: /diagnostics/flags
- 見出し:
  - H2: 仕組み
  - H2: 設定で有効化
  - H2: 環境変数でのオーバーライド（一回限り）
  - H2: プロファイリングフラグ
  - H2: タイムライン成果物
  - H2: ログの出力先
  - H2: ログの抽出
  - H2: 注記
  - H2: 関連

## gateway/authentication.md

- ルート: /gateway/authentication
- 見出し:
  - H2: 推奨設定（API キー、任意のプロバイダー）
  - H2: Anthropic: Claude CLI とトークン互換性
  - H2: Anthropic の注記
  - H2: モデル認証状態の確認
  - H2: API キーローテーション動作（gateway）
  - H2: Gateway 実行中のプロバイダー認証の削除
  - H2: 使用する認証情報の制御
  - H3: OpenAI とレガシー openai-codex ID
  - H3: ログイン中（CLI）
  - H3: セッション単位（チャットコマンド）
  - H3: エージェント単位（CLI オーバーライド）
  - H2: トラブルシューティング
  - H3: 「認証情報が見つかりません」
  - H3: トークンの期限切れ/期限切れ間近
  - H2: 関連

## gateway/background-process.md

- ルート: /gateway/background-process
- 見出し:
  - H2: exec ツール
  - H2: 子プロセスブリッジング
  - H2: process ツール
  - H2: 例
  - H2: 関連

## gateway/bonjour.md

- ルート: /gateway/bonjour
- 見出し:
  - H2: Tailscale 経由の広域 Bonjour（Unicast DNS-SD）
  - H3: Gateway 設定（推奨）
  - H3: 一回限りの DNS サーバー設定（gateway ホスト）
  - H3: Tailscale DNS 設定
  - H3: Gateway リスナーセキュリティ（推奨）
  - H2: アドバタイズされる内容
  - H2: サービスタイプ
  - H2: TXT キー（シークレットではないヒント）
  - H2: macOS でのデバッグ
  - H2: Gateway ログでのデバッグ
  - H2: iOS Node でのデバッグ
  - H2: Bonjour を有効化する場合
  - H2: Bonjour を無効化する場合
  - H2: Docker の落とし穴
  - H2: 無効化された Bonjour のトラブルシューティング
  - H2: 一般的な失敗モード
  - H2: エスケープされたインスタンス名（\032）
  - H2: 有効化 / 無効化 / 設定
  - H2: 関連ドキュメント

## gateway/bridge-protocol.md

- ルート: /gateway/bridge-protocol
- 見出し:
  - H2: 存在していた理由
  - H2: トランスポート
  - H2: ハンドシェイク + ペアリング
  - H2: フレーム
  - H2: exec ライフサイクルイベント
  - H2: 履歴上の tailnet 利用
  - H2: バージョニング
  - H2: 関連

## gateway/cli-backends.md

- ルート: /gateway/cli-backends
- 見出し:
  - H2: 初心者向けクイックスタート
  - H2: フォールバックとして使う
  - H2: 設定の概要
  - H3: 設定例
  - H2: 仕組み
  - H2: セッション
  - H2: claude-cli セッションからのフォールバック前置き
  - H2: 画像（パススルー）
  - H2: 入力 / 出力
  - H2: デフォルト（Plugin 所有）
  - H2: Plugin 所有のデフォルト
  - H2: ネイティブ Compaction の所有権
  - H2: バンドル MCP オーバーレイ
  - H2: 履歴再シード上限
  - H2: 制限事項
  - H2: トラブルシューティング
  - H2: 関連

## gateway/config-agents.md

- ルート: /gateway/config-agents
- 見出し:
  - H2: エージェントデフォルト
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: エージェント単位のブートストラッププロファイルオーバーライド
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: コンテキスト予算の所有権マップ
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: ランタイムポリシー
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: ブロックストリーミング
  - H3: タイピングインジケーター
  - H3: agents.defaults.sandbox
  - H3: agents.list（エージェント単位のオーバーライド）
  - H2: マルチエージェントルーティング
  - H3: バインディング一致フィールド
  - H3: エージェント単位のアクセスプロファイル
  - H2: セッション
  - H2: メッセージ
  - H3: 応答プレフィックス
  - H3: Ack リアクション
  - H3: 受信デバウンス
  - H3: TTS（text-to-speech）
  - H2: Talk
  - H2: 関連

## gateway/config-channels.md

- ルート: /gateway/config-channels
- 見出し:
  - H2: チャネル
  - H3: DM とグループアクセス
  - H3: チャネルモデルオーバーライド
  - H3: チャネルデフォルトと Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: マルチアカウント（全チャネル）
  - H3: その他の Plugin チャネル
  - H3: グループチャットのメンションゲート
  - H4: DM 履歴上限
  - H4: 自分とのチャットモード
  - H3: コマンド（チャットコマンド処理）
  - H2: 関連

## gateway/config-tools.md

- ルート: /gateway/config-tools
- 見出し:
  - H2: ツール
  - H3: ツールプロファイル
  - H3: ツールグループ
  - H3: サンドボックスツールポリシー内の MCP と Plugin ツール
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: カスタムプロバイダーとベース URL
  - H3: プロバイダーフィールドの詳細
  - H3: プロバイダー例
  - H2: 関連

## gateway/configuration-examples.md

- ルート: /gateway/configuration-examples
- 見出し:
  - H2: クイックスタート
  - H3: 絶対最小構成
  - H3: 推奨スターター
  - H2: 拡張例（主要オプション）
  - H3: シンボリックリンクされた兄弟 skill リポジトリ
  - H2: 一般的なパターン
  - H3: 1 つの上書きを持つ共有 skill ベースライン
  - H3: マルチプラットフォーム設定
  - H3: 信頼済みノードネットワークの自動承認
  - H3: セキュア DM モード（共有受信箱 / マルチユーザー DM）
  - H3: Anthropic API キー + MiniMax フォールバック
  - H3: 作業用ボット（制限付きアクセス）
  - H3: ローカルモデルのみ
  - H2: ヒント
  - H2: 関連

## gateway/configuration-reference.md

- ルート: /gateway/configuration-reference
- 見出し:
  - H2: チャンネル
  - H2: エージェントのデフォルト、マルチエージェント、セッション、メッセージ
  - H2: ツールとカスタムプロバイダー
  - H2: モデル
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Codex ハーネス Plugin 設定
  - H2: コミットメント
  - H2: ブラウザー
  - H2: UI
  - H2: Gateway
  - H3: OpenAI 互換エンドポイント
  - H3: マルチインスタンス分離
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: フック
  - H3: Gmail 連携
  - H2: Canvas Plugin ホスト
  - H2: 検出
  - H3: mDNS (Bonjour)
  - H3: 広域（DNS-SD）
  - H2: 環境
  - H3: env（インライン環境変数）
  - H3: 環境変数の置換
  - H2: シークレット
  - H3: SecretRef
  - H3: 対応する認証情報サーフェス
  - H3: シークレットプロバイダー設定
  - H2: 認証ストレージ
  - H3: auth.cooldowns
  - H2: ロギング
  - H2: 診断
  - H2: 更新
  - H2: ACP
  - H2: CLI
  - H2: ウィザード
  - H2: ID
  - H2: ブリッジ（レガシー、削除済み）
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: メディアモデルテンプレート変数
  - H2: 設定インクルード（$include）
  - H2: 関連

## gateway/configuration.md

- ルート: /gateway/configuration
- 見出し:
  - H2: 最小設定
  - H2: 設定の編集
  - H2: 厳密な検証
  - H2: 一般的なタスク
  - H2: 設定のホットリロード
  - H3: リロードモード
  - H3: ホット適用されるものと再起動が必要なもの
  - H3: リロード計画
  - H2: 設定 RPC（プログラムによる更新）
  - H2: 環境変数
  - H2: 完全なリファレンス
  - H2: 関連

## gateway/diagnostics.md

- ルート: /gateway/diagnostics
- 見出し:
  - H2: クイックスタート
  - H2: チャットコマンド
  - H2: エクスポートに含まれる内容
  - H2: プライバシーモデル
  - H2: 安定性レコーダー
  - H2: 便利なオプション
  - H2: 診断を無効化
  - H2: 関連

## gateway/discovery.md

- ルート: /gateway/discovery
- 見出し:
  - H2: 用語
  - H2: direct と SSH の両方を維持する理由
  - H2: 検出入力（クライアントが Gateway の場所を知る方法）
  - H3: 1) Bonjour / DNS-SD 検出
  - H4: サービスビーコンの詳細
  - H3: 2) Tailnet（クロスネットワーク）
  - H3: 3) 手動 / SSH ターゲット
  - H2: トランスポート選択（クライアントポリシー）
  - H2: ペアリング + 認証（direct トランスポート）
  - H2: コンポーネント別の責任
  - H2: 関連

## gateway/doctor.md

- ルート: /gateway/doctor
- 見出し:
  - H2: クイックスタート
  - H3: ヘッドレスモードと自動化モード
  - H2: 読み取り専用 lint モード
  - H2: 実行内容（概要）
  - H2: Dreams UI のバックフィルとリセット
  - H2: 詳細な動作と根拠
  - H2: 関連

## gateway/external-apps.md

- ルート: /gateway/external-apps
- 見出し:
  - H2: 現在利用可能なもの
  - H2: 推奨パス
  - H2: アプリコードと Plugin コード
  - H2: 関連

## gateway/gateway-lock.md

- ルート: /gateway/gateway-lock
- 見出し:
  - H2: 理由
  - H2: 仕組み
  - H2: エラーサーフェス
  - H2: 運用上の注意
  - H2: 関連

## gateway/health.md

- ルート: /gateway/health
- 見出し:
  - H2: クイックチェック
  - H2: 詳細診断
  - H2: ヘルスモニター設定
  - H2: 稼働時間監視
  - H3: 監視サービス設定例
  - H2: 何かが失敗した場合
  - H2: 専用の「health」コマンド
  - H2: 関連

## gateway/heartbeat.md

- ルート: /gateway/heartbeat
- 見出し:
  - H2: クイックスタート（初心者向け）
  - H2: デフォルト
  - H2: heartbeat プロンプトの目的
  - H2: レスポンス契約
  - H2: 設定
  - H3: スコープと優先順位
  - H3: エージェントごとの Heartbeat
  - H3: アクティブ時間の例
  - H3: 24/7 設定
  - H3: マルチアカウント例
  - H3: フィールドノート
  - H2: 配信動作
  - H2: 表示制御
  - H3: 各フラグの内容
  - H3: チャンネルごととアカウントごとの例
  - H3: 一般的なパターン
  - H2: HEARTBEAT.md（任意）
  - H3: tasks: ブロック
  - H3: エージェントは HEARTBEAT.md を更新できるか？
  - H2: 手動ウェイク（オンデマンド）
  - H2: 推論配信（任意）
  - H2: コスト意識
  - H2: Heartbeat 後のコンテキストオーバーフロー
  - H2: 関連

## gateway/index.md

- ルート: /gateway
- 見出し:
  - H2: 5 分でのローカル起動
  - H2: ランタイムモデル
  - H2: OpenAI 互換エンドポイント
  - H3: ポートと bind の優先順位
  - H3: ホットリロードモード
  - H2: オペレーターコマンドセット
  - H2: 複数の Gateway（同一ホスト）
  - H2: リモートアクセス
  - H2: 監視とサービスライフサイクル
  - H2: dev プロファイルのクイックパス
  - H2: プロトコルクイックリファレンス（オペレーター視点）
  - H2: 運用チェック
  - H3: Liveness
  - H3: Readiness
  - H3: ギャップリカバリー
  - H2: 一般的な失敗シグネチャ
  - H2: 安全性の保証
  - H2: 関連

## gateway/local-model-services.md

- ルート: /gateway/local-model-services
- 見出し:
  - H2: 仕組み
  - H2: 設定形状
  - H2: フィールド
  - H2: Inferrs の例
  - H2: ds4 の例
  - H2: 運用上の注意
  - H2: 関連

## gateway/local-models.md

- ルート: /gateway/local-models
- 見出し:
  - H2: ハードウェア下限
  - H2: バックエンドを選ぶ
  - H2: 推奨: LM Studio + 大規模ローカルモデル（Responses API）
  - H3: ハイブリッド設定: ホスト型プライマリ、ローカルフォールバック
  - H3: ホスト型セーフティネット付きローカルファースト
  - H3: リージョン別ホスティング / データルーティング
  - H2: その他の OpenAI 互換ローカルプロキシ
  - H2: より小規模または厳格なバックエンド
  - H2: トラブルシューティング
  - H2: 関連

## gateway/logging.md

- ルート: /gateway/logging
- 見出し:
  - H1: ロギング
  - H2: ファイルベースロガー
  - H2: コンソールキャプチャ
  - H2: リダクション
  - H2: Gateway WebSocket ログ
  - H3: WS ログスタイル
  - H2: コンソール整形（サブシステムロギング）
  - H2: 関連

## gateway/multiple-gateways.md

- ルート: /gateway/multiple-gateways
- 見出し:
  - H2: 最も推奨される設定
  - H2: Rescue-Bot クイックスタート
  - H2: これが機能する理由
  - H2: --profile rescue onboard が変更する内容
  - H2: 一般的なマルチ Gateway 設定
  - H2: 分離チェックリスト
  - H2: ポートマッピング（派生）
  - H2: ブラウザー/CDP の注意点（よくある落とし穴）
  - H2: 手動 env の例
  - H2: クイックチェック
  - H2: 関連

## gateway/network-model.md

- ルート: /gateway/network-model
- 見出し:
  - H2: 関連

## gateway/openai-http-api.md

- ルート: /gateway/openai-http-api
- 見出し:
  - H2: 認証
  - H2: セキュリティ境界（重要）
  - H2: このエンドポイントを使う場合
  - H2: エージェントファーストのモデル契約
  - H2: エンドポイントの有効化
  - H2: エンドポイントの無効化
  - H2: セッション動作
  - H2: このサーフェスが重要な理由
  - H2: モデルリストとエージェントルーティング
  - H2: ストリーミング（SSE）
  - H2: チャットツール契約
  - H3: 対応するリクエストフィールド
  - H3: 非対応のバリアント
  - H3: 非ストリーミングツールレスポンス形状
  - H3: ストリーミングツールレスポンス形状
  - H3: ツールフォローアップループ
  - H2: Open WebUI クイック設定
  - H2: 例
  - H2: 関連

## gateway/openresponses-http-api.md

- ルート: /gateway/openresponses-http-api
- 見出し:
  - H2: 認証、セキュリティ、ルーティング
  - H2: セッション動作
  - H2: リクエスト形状（対応）
  - H2: 項目（入力）
  - H3: message
  - H3: functioncalloutput（ターンベースツール）
  - H3: reasoning と itemreference
  - H2: ツール（クライアント側関数ツール）
  - H2: 画像（inputimage）
  - H2: ファイル（inputfile）
  - H2: ファイル + 画像の制限（設定）
  - H2: ストリーミング（SSE）
  - H2: 使用量
  - H2: エラー
  - H2: 例
  - H2: 関連

## gateway/openshell.md

- ルート: /gateway/openshell
- 見出し:
  - H2: 前提条件
  - H2: クイックスタート
  - H2: ワークスペースモード
  - H3: mirror
  - H3: remote
  - H3: モードの選択
  - H2: 設定リファレンス
  - H2: 例
  - H3: 最小リモート設定
  - H3: GPU を使うミラーモード
  - H3: カスタム Gateway を使うエージェントごとの OpenShell
  - H2: ライフサイクル管理
  - H3: 再作成する場合
  - H2: セキュリティ強化
  - H2: 現在の制限
  - H2: 仕組み
  - H2: 関連

## gateway/opentelemetry.md

- ルート: /gateway/opentelemetry
- 見出し:
  - H2: 全体のつながり
  - H2: クイックスタート
  - H2: エクスポートされるシグナル
  - H2: 設定リファレンス
  - H3: 環境変数
  - H2: プライバシーとコンテンツキャプチャ
  - H2: サンプリングとフラッシュ
  - H2: エクスポートされるメトリクス
  - H3: モデル使用量
  - H3: メッセージフロー
  - H3: 会話
  - H3: キューとセッション
  - H3: セッション liveness テレメトリ
  - H3: ハーネスライフサイクル
  - H3: ツール実行
  - H3: Exec
  - H3: 診断内部（メモリとツールループ）
  - H2: エクスポートされる span
  - H2: 診断イベントカタログ
  - H2: エクスポーターなし
  - H2: 無効化
  - H2: 関連

## gateway/operator-scopes.md

- ルート: /gateway/operator-scopes
- 見出し:
  - H2: ロール
  - H2: スコープレベル
  - H2: メソッドスコープは最初のゲートにすぎない
  - H2: デバイスペアリング承認
  - H2: Node ペアリング承認
  - H2: 共有シークレット認証

## gateway/pairing.md

- ルート: /gateway/pairing
- 見出し:
  - H2: 概念
  - H2: ペアリングの仕組み
  - H2: CLI ワークフロー（ヘッドレス対応）
  - H2: API サーフェス（Gateway プロトコル）
  - H2: Node コマンドゲート（2026.3.31+）
  - H2: Node イベント信頼境界（2026.3.31+）
  - H2: 自動承認（macOS アプリ）
  - H2: Trusted-CIDR デバイス自動承認
  - H2: メタデータアップグレード自動承認
  - H2: QR ペアリングヘルパー
  - H2: ローカリティと転送ヘッダー
  - H2: ストレージ（ローカル、プライベート）
  - H2: トランスポート動作
  - H2: 関連

## gateway/prometheus.md

- ルート: /gateway/prometheus
- 見出し:
  - H2: クイックスタート
  - H2: エクスポートされるメトリクス
  - H2: ラベルポリシー
  - H2: PromQL レシピ
  - H2: Prometheus と OpenTelemetry エクスポートの選択
  - H2: トラブルシューティング
  - H2: 関連

## gateway/protocol.md

- ルート: /gateway/protocol
- 見出し:
  - H2: トランスポート
  - H2: ハンドシェイク（接続）
  - H3: Node の例
  - H2: フレーミング
  - H2: ロール + スコープ
  - H3: ロール
  - H3: スコープ（オペレーター）
  - H3: Caps/commands/permissions（Node）
  - H2: プレゼンス
  - H3: Node バックグラウンド生存イベント
  - H2: ブロードキャストイベントのスコープ設定
  - H2: 一般的な RPC メソッドファミリー
  - H3: 一般的なイベントファミリー
  - H3: Node ヘルパーメソッド
  - H3: タスク台帳 RPC
  - H3: オペレーターヘルパーメソッド
  - H3: models.list ビュー
  - H2: Exec 承認
  - H2: エージェント配信フォールバック
  - H2: バージョニング
  - H3: クライアント定数
  - H2: 認証
  - H2: デバイス ID + ペアリング
  - H3: デバイス認証移行診断
  - H2: TLS + ピンニング
  - H2: スコープ
  - H2: 関連

## gateway/remote-gateway-readme.md

- ルート: /gateway/remote-gateway-readme
- 見出し:
  - H1: リモート Gateway で OpenClaw.app を実行する
  - H2: 概要
  - H2: クイック設定
  - H3: ステップ 1: SSH Config を追加
  - H3: ステップ 2: SSH キーをコピー
  - H3: ステップ 3: リモート Gateway 認証を設定
  - H3: ステップ 4: SSH トンネルを開始
  - H3: ステップ 5: OpenClaw.app を再起動
  - H2: ログイン時にトンネルを自動開始
  - H3: PLIST ファイルを作成
  - H3: Launch Agent を読み込む
  - H2: トラブルシューティング
  - H2: 仕組み
  - H2: 関連

## gateway/remote.md

- ルート: /gateway/remote
- 見出し:
  - H2: 核となる考え方
  - H2: 一般的な VPN と tailnet のセットアップ
  - H3: tailnet 内の常時稼働 Gateway
  - H3: 自宅のデスクトップで Gateway を実行
  - H3: ノート PC で Gateway を実行
  - H2: コマンドフロー（どこで何が実行されるか）
  - H2: SSH トンネル（CLI + ツール）
  - H2: CLI リモートデフォルト
  - H2: 認証情報の優先順位
  - H2: Chat UI のリモートアクセス
  - H2: macOS アプリのリモートモード
  - H2: セキュリティルール（リモート/VPN）
  - H3: macOS: LaunchAgent による永続 SSH トンネル
  - H4: ステップ 1: SSH 設定を追加
  - H4: ステップ 2: SSH キーをコピー（一度だけ）
  - H4: ステップ 3: Gateway トークンを設定
  - H4: ステップ 4: LaunchAgent を作成
  - H4: ステップ 5: LaunchAgent を読み込み
  - H4: トラブルシューティング
  - H2: 関連

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- ルート: /gateway/sandbox-vs-tool-policy-vs-elevated
- 見出し:
  - H2: クイックデバッグ
  - H2: サンドボックス: ツールを実行する場所
  - H3: バインドマウント（セキュリティのクイックチェック）
  - H2: ツールポリシー: 存在する/呼び出せるツール
  - H3: ツールグループ（省略形）
  - H2: 昇格: exec 専用の「ホストで実行」
  - H2: 一般的な「サンドボックス隔離」の修正
  - H3: 「ツール X がサンドボックスのツールポリシーによってブロックされる」
  - H3: 「これは main だと思っていたのに、なぜサンドボックス化されているのか？」
  - H2: 関連

## gateway/sandboxing.md

- ルート: /gateway/sandboxing
- 見出し:
  - H2: サンドボックス化されるもの
  - H2: モード
  - H2: スコープ
  - H2: バックエンド
  - H3: バックエンドの選択
  - H3: Docker バックエンド
  - H3: SSH バックエンド
  - H3: OpenShell バックエンド
  - H4: ワークスペースモード
  - H4: OpenShell ライフサイクル
  - H2: ワークスペースアクセス
  - H2: カスタムバインドマウント
  - H2: イメージとセットアップ
  - H2: setupCommand（一度だけのコンテナセットアップ）
  - H2: ツールポリシーと回避手段
  - H2: マルチエージェントのオーバーライド
  - H2: 最小限の有効化例
  - H2: 関連

## gateway/secrets-plan-contract.md

- ルート: /gateway/secrets-plan-contract
- 見出し:
  - H2: プランファイルの形状
  - H2: プロバイダーの upsert と削除
  - H2: 対応するターゲットスコープ
  - H2: ターゲットタイプの挙動
  - H2: パス検証ルール
  - H2: 失敗時の挙動
  - H2: exec プロバイダーの同意の挙動
  - H2: ランタイムと監査スコープの注記
  - H2: オペレーターチェック
  - H2: 関連ドキュメント

## gateway/secrets.md

- ルート: /gateway/secrets
- 見出し:
  - H2: 目標とランタイムモデル
  - H2: エージェントアクセス境界
  - H2: アクティブサーフェスのフィルタリング
  - H2: Gateway 認証サーフェスの診断
  - H2: オンボーディング参照の事前確認
  - H2: SecretRef コントラクト
  - H2: プロバイダー設定
  - H2: ファイルベースの API キー
  - H2: exec 連携の例
  - H2: MCP サーバー環境変数
  - H2: サンドボックス SSH 認証素材
  - H2: 対応する認証情報サーフェス
  - H2: 必須の挙動と優先順位
  - H2: 有効化トリガー
  - H2: 劣化および復旧シグナル
  - H2: コマンドパス解決
  - H2: 監査と設定ワークフロー
  - H2: 一方向の安全ポリシー
  - H2: レガシー認証互換性の注記
  - H2: Web UI の注記
  - H2: 関連

## gateway/security/audit-checks.md

- ルート: /gateway/security/audit-checks
- 見出し:
  - H2: 関連

## gateway/security/exposure-runbook.md

- ルート: /gateway/security/exposure-runbook
- 見出し:
  - H2: 公開パターンの選択
  - H2: 事前インベントリ
  - H2: ベースラインチェック
  - H2: 最小限の安全なベースライン
  - H2: DM とグループの公開
  - H2: リバースプロキシチェック
  - H2: ツールとサンドボックスのレビュー
  - H2: 変更後の検証
  - H2: ロールバック計画
  - H2: レビューチェックリスト

## gateway/security/index.md

- ルート: /gateway/security
- 見出し:
  - H2: まずスコープ: パーソナルアシスタントのセキュリティモデル
  - H2: クイックチェック: openclaw security audit
  - H3: 公開パッケージ依存関係ロック
  - H3: デプロイとホストの信頼
  - H3: 安全なファイル操作
  - H3: 共有 Slack ワークスペース: 実際のリスク
  - H3: 会社共有エージェント: 許容されるパターン
  - H2: Gateway とノードの信頼の考え方
  - H2: 信頼境界マトリックス
  - H2: 設計上の脆弱性ではないもの
  - H2: 60 秒での強化ベースライン
  - H2: 共有受信箱のクイックルール
  - H2: コンテキスト可視性モデル
  - H2: 監査がチェックする内容（高レベル）
  - H2: 認証情報ストレージマップ
  - H2: セキュリティ監査チェックリスト
  - H2: セキュリティ監査用語集
  - H2: HTTP 経由の Control UI
  - H2: 安全でない、または危険なフラグの概要
  - H2: リバースプロキシ設定
  - H2: HSTS とオリジンの注記
  - H2: ローカルセッションログはディスク上に保存される
  - H2: Node 実行（system.run）
  - H2: 動的 Skills（ウォッチャー / リモートノード）
  - H2: 脅威モデル
  - H2: 中核概念: インテリジェンスより前にアクセス制御
  - H2: コマンド認可モデル
  - H2: コントロールプレーンツールのリスク
  - H2: Plugins
  - H2: DM アクセスモデル: ペアリング、許可リスト、オープン、無効
  - H2: DM セッション分離（マルチユーザーモード）
  - H3: セキュア DM モード（推奨）
  - H2: DM とグループの許可リスト
  - H2: プロンプトインジェクション（それが何か、なぜ重要か）
  - H2: 外部コンテンツの特殊トークンサニタイズ
  - H2: 安全でない外部コンテンツのバイパスフラグ
  - H3: プロンプトインジェクションに公開 DM は不要
  - H3: セルフホスト LLM バックエンド
  - H3: モデル強度（セキュリティ注記）
  - H2: グループ内の推論と詳細出力
  - H2: 設定強化の例
  - H3: ファイル権限
  - H3: ネットワーク公開（バインド、ポート、ファイアウォール）
  - H3: UFW を使った Docker ポート公開
  - H3: mDNS/Bonjour 検出
  - H3: Gateway WebSocket のロックダウン（ローカル認証）
  - H3: Tailscale Serve ID ヘッダー
  - H3: ノードホスト経由のブラウザー制御（推奨）
  - H3: ディスク上のシークレット
  - H3: ワークスペース .env ファイル
  - H3: ログとトランスクリプト（秘匿化と保持）
  - H3: DM: デフォルトでペアリング
  - H3: グループ: どこでもメンションを必須にする
  - H3: 別々の番号（WhatsApp、Signal、Telegram）
  - H3: 読み取り専用モード（サンドボックスとツール経由）
  - H3: セキュアベースライン（コピー/貼り付け）
  - H2: サンドボックス化（推奨）
  - H3: サブエージェント委任ガードレール
  - H2: ブラウザー制御のリスク
  - H3: ブラウザー SSRF ポリシー（デフォルトで厳格）
  - H2: エージェントごとのアクセスプロファイル（マルチエージェント）
  - H3: 例: フルアクセス（サンドボックスなし）
  - H3: 例: 読み取り専用ツール + 読み取り専用ワークスペース
  - H3: 例: ファイルシステム/シェルアクセスなし（プロバイダーメッセージングは許可）
  - H2: インシデント対応
  - H3: 封じ込め
  - H3: ローテーション（シークレットが漏えいした場合は侵害を想定）
  - H3: 監査
  - H3: レポート用に収集
  - H2: シークレットスキャン
  - H2: セキュリティ問題の報告

## gateway/security/secure-file-operations.md

- ルート: /gateway/security/secure-file-operations
- 見出し:
  - H2: デフォルト: Python ヘルパーなし
  - H2: Python なしで保護され続けるもの
  - H2: Python が追加するもの
  - H2: Plugin とコアのガイダンス

## gateway/security/shrinkwrap.md

- ルート: /gateway/security/shrinkwrap
- 見出し:
  - H2: 簡単な版
  - H2: OpenClaw がそれを使う理由
  - H2: 技術的詳細

## gateway/tailscale.md

- ルート: /gateway/tailscale
- 見出し:
  - H2: モード
  - H2: 認証
  - H2: 設定例
  - H3: Tailnet のみ（Serve）
  - H3: Tailnet のみ（Tailnet IP にバインド）
  - H3: パブリックインターネット（Funnel + 共有パスワード）
  - H2: CLI の例
  - H2: 注記
  - H2: ブラウザー制御（リモート Gateway + ローカルブラウザー）
  - H2: Tailscale の前提条件 + 制限
  - H2: 詳細
  - H2: 関連

## gateway/tools-invoke-http-api.md

- ルート: /gateway/tools-invoke-http-api
- 見出し:
  - H2: 認証
  - H2: セキュリティ境界（重要）
  - H2: リクエスト本文
  - H2: ポリシー + ルーティング挙動
  - H2: レスポンス
  - H2: 例
  - H2: 関連

## gateway/troubleshooting.md

- ルート: /gateway/troubleshooting
- 見出し:
  - H2: コマンドラダー
  - H2: 更新後
  - H2: 分断されたインストールと新しい設定ガード
  - H2: ロールバック後のプロトコル不一致
  - H2: パス脱出としてスキップされた Skill シンボリックリンク
  - H2: Anthropic 429 長いコンテキストには追加 usage が必要
  - H2: アップストリーム 403 によるブロック応答
  - H2: ローカル OpenAI 互換バックエンドは直接プローブに通るがエージェント実行は失敗する
  - H2: 返信がない
  - H2: Dashboard Control UI の接続性
  - H3: 認証詳細コードのクイックマップ
  - H2: Gateway サービスが実行されていない
  - H2: macOS Gateway が静かに応答を停止し、ダッシュボードに触れると再開する
  - H2: 高メモリ使用中に Gateway が終了する
  - H2: Gateway が無効な設定を拒否した
  - H2: Gateway プローブ警告
  - H2: チャンネルは接続済みだが、メッセージが流れない
  - H2: Cron と Heartbeat の配信
  - H2: ノードはペアリング済みだが、ツールが失敗する
  - H2: ブラウザーツールが失敗する
  - H2: アップグレード後に何かが突然壊れた場合
  - H2: 関連

## gateway/trusted-proxy-auth.md

- ルート: /gateway/trusted-proxy-auth
- 見出し:
  - H2: 使用するタイミング
  - H2: 使用しないタイミング
  - H2: 仕組み
  - H2: Control UI のペアリング挙動
  - H2: 設定
  - H3: 設定リファレンス
  - H2: TLS 終端と HSTS
  - H3: ロールアウトガイダンス
  - H2: プロキシ設定例
  - H2: 混在トークン設定
  - H2: オペレータースコープヘッダー
  - H2: セキュリティチェックリスト
  - H2: セキュリティ監査
  - H2: トラブルシューティング
  - H2: トークン認証からの移行
  - H2: 関連

## help/debugging.md

- ルート: /help/debugging
- 見出し:
  - H2: ランタイムデバッグのオーバーライド
  - H2: セッショントレース出力
  - H2: Plugin ライフサイクルトレース
  - H2: CLI 起動とコマンドプロファイリング
  - H2: Gateway ウォッチモード
  - H2: 開発プロファイル + 開発 Gateway（--dev）
  - H2: 生ストリームロギング（OpenClaw）
  - H2: 生の OpenAI 互換チャンクロギング
  - H2: 安全上の注意
  - H2: VSCode でのデバッグ
  - H3: セットアップ
  - H3: 注記
  - H2: 関連

## help/environment.md

- ルート: /help/environment
- 見出し:
  - H2: 優先順位（最高 → 最低）
  - H2: プロバイダー認証情報とワークスペース .env
  - H2: 設定 env ブロック
  - H2: シェル env インポート
  - H2: exec シェルスナップショット
  - H2: ランタイム注入 env vars
  - H2: UI env vars
  - H2: 設定内の env var 置換
  - H2: Secret refs と ${ENV} 文字列
  - H2: パス関連 env vars
  - H2: ロギング
  - H3: OPENCLAWHOME
  - H2: nvm ユーザー: webfetch TLS 失敗
  - H2: レガシー環境変数
  - H2: 関連

## help/faq-first-run.md

- ルート: /help/faq-first-run
- 見出し:
  - H2: クイックスタートと初回実行セットアップ
  - H2: 関連

## help/faq-models.md

- ルート: /help/faq-models
- 見出し:
  - H2: モデル: デフォルト、選択、エイリアス、切り替え
  - H2: モデルフェイルオーバーと「All models failed」
  - H2: 認証プロファイル: その概要と管理方法
  - H2: 関連

## help/faq.md

- ルート: /help/faq
- 見出し:
  - H2: 何かが壊れている場合の最初の 60 秒
  - H2: クイックスタートと初回実行セットアップ
  - H2: OpenClaw とは？
  - H2: Skills と自動化
  - H2: サンドボックス化とメモリ
  - H2: 物がディスク上に保存される場所
  - H2: 設定の基本
  - H2: リモート Gateway とノード
  - H2: Env vars と .env の読み込み
  - H2: セッションと複数チャット
  - H2: モデル、フェイルオーバー、認証プロファイル
  - H2: Gateway: ポート、「already running」、リモートモード
  - H2: ロギングとデバッグ
  - H2: メディアと添付ファイル
  - H2: セキュリティとアクセス制御
  - H2: チャットコマンド、タスクの中止、「停止しない」
  - H2: その他
  - H2: 関連

## help/index.md

- ルート: /help
- 見出し:
  - H2: FAQ
  - H2: 診断
  - H2: テスト
  - H2: コミュニティとメタ

## help/scripts.md

- ルート: /help/scripts
- 見出し:
  - H2: 規約
  - H2: 認証監視スクリプト
  - H2: GitHub 読み取りヘルパー
  - H2: スクリプトを追加する場合
  - H2: 関連

## help/testing-live.md

- ルート: /help/testing-live
- 見出し:
  - H2: ライブ: ローカルスモークコマンド
  - H2: ライブ: Android ノード機能スイープ
  - H2: ライブ: モデルスモーク（プロファイルキー）
  - H3: レイヤー 1: 直接モデル補完（Gateway なし）
  - H3: レイヤー 2: Gateway + 開発エージェントスモーク（"@openclaw" が実際に行うこと）
  - H2: ライブ: CLI バックエンドスモーク（Claude、Gemini、またはその他のローカル CLI）
  - H2: ライブ: APNs HTTP/2 プロキシ到達性
  - H2: ライブ: ACP バインドスモーク（/acp spawn ... --bind here）
  - H2: ライブ: Codex アプリサーバーハーネススモーク
  - H3: 推奨ライブレシピ
  - H2: ライブ: モデルマトリクス（対象範囲）
  - H3: モダンスモークセット（ツール呼び出し + 画像）
  - H3: ベースライン: ツール呼び出し（Read + 任意の Exec）
  - H3: ビジョン: 画像送信（添付ファイル → マルチモーダルメッセージ）
  - H3: アグリゲーター / 代替 Gateway
  - H2: 認証情報（絶対にコミットしない）
  - H2: Deepgram ライブ（音声文字起こし）
  - H2: BytePlus コーディング計画ライブ
  - H2: ComfyUI ワークフローメディアライブ
  - H2: 画像生成ライブ
  - H2: 音楽生成ライブ
  - H2: 動画生成ライブ
  - H2: メディアライブハーネス
  - H2: 関連

## help/testing-updates-plugins.md

- ルート: /help/testing-updates-plugins
- 見出し:
  - H2: 保護するもの
  - H2: 開発中のローカル証明
  - H2: Docker レーン
  - H2: パッケージ受け入れ
  - H2: リリースのデフォルト
  - H2: レガシー互換性
  - H2: カバレッジの追加
  - H2: 障害トリアージ

## help/testing.md

- ルート: /help/testing
- 見出し:
  - H2: クイックスタート
  - H2: テスト一時ディレクトリ
  - H2: QA 固有のランナー
  - H3: Convex 経由の共有 Telegram 認証情報（v1）
  - H3: QA へのチャネル追加
  - H2: テストスイート（どこで何が実行されるか）
  - H3: ユニット / 統合（デフォルト）
  - H3: 安定性（Gateway）
  - H3: E2E（リポジトリ集約）
  - H3: E2E（Gateway スモーク）
  - H3: E2E（Control UI モックブラウザー）
  - H3: E2E: OpenShell バックエンドスモーク
  - H3: ライブ（実プロバイダー + 実モデル）
  - H2: どのスイートを実行すべきか？
  - H2: ライブ（ネットワークに触れる）テスト
  - H2: Docker ランナー（任意の「Linux で動作する」チェック）
  - H2: ドキュメント健全性
  - H2: オフライン回帰（CI セーフ）
  - H2: エージェント信頼性評価（Skills）
  - H2: コントラクトテスト（Plugin とチャネルの形状）
  - H3: コマンド
  - H3: チャネルコントラクト
  - H3: プロバイダーステータスコントラクト
  - H3: プロバイダーコントラクト
  - H3: 実行するタイミング
  - H2: 回帰の追加（ガイダンス）
  - H2: 関連

## help/troubleshooting.md

- ルート: /help/troubleshooting
- 見出し:
  - H2: 最初の 60 秒
  - H2: アシスタントが制限されている、またはツールが不足しているように感じる
  - H2: Anthropic 長文コンテキスト 429
  - H2: ローカルの OpenAI 互換バックエンドは直接なら動くが OpenClaw では失敗する
  - H2: Plugin インストールが openclaw extensions 不足で失敗する
  - H2: インストールポリシーが Plugin のインストールまたは更新をブロックする
  - H2: Plugin は存在するが疑わしい所有権によりブロックされている
  - H2: デシジョンツリー
  - H2: 関連

## index.md

- ルート: /
- 見出し:
  - H1: OpenClaw 🦞
  - H2: OpenClaw とは？
  - H2: 仕組み
  - H2: 主な機能
  - H2: クイックスタート
  - H2: ダッシュボード
  - H2: 設定（任意）
  - H2: ここから始める
  - H2: 詳細を学ぶ

## install/ansible.md

- ルート: /install/ansible
- 見出し:
  - H2: 前提条件
  - H2: 得られるもの
  - H2: クイックスタート
  - H2: インストールされるもの
  - H2: インストール後のセットアップ
  - H3: クイックコマンド
  - H2: セキュリティアーキテクチャ
  - H2: 手動インストール
  - H2: 更新
  - H2: トラブルシューティング
  - H2: 高度な設定
  - H2: 関連

## install/azure.md

- ルート: /install/azure
- 見出し:
  - H2: 実行すること
  - H2: 必要なもの
  - H2: デプロイ設定
  - H2: Azure リソースをデプロイする
  - H2: OpenClaw をインストールする
  - H2: コストの考慮事項
  - H2: クリーンアップ
  - H2: 次のステップ
  - H2: 関連

## install/bun.md

- ルート: /install/bun
- 見出し:
  - H2: インストール
  - H2: ライフサイクルスクリプト
  - H2: 注意事項
  - H2: 関連

## install/clawdock.md

- ルート: /install/clawdock
- 見出し:
  - H2: インストール
  - H2: 得られるもの
  - H3: 基本操作
  - H3: コンテナーアクセス
  - H3: Web UI とペアリング
  - H3: セットアップとメンテナンス
  - H3: ユーティリティ
  - H2: 初回フロー
  - H2: 設定とシークレット
  - H2: 関連

## install/development-channels.md

- ルート: /install/development-channels
- 見出し:
  - H2: チャネルの切り替え
  - H2: 1 回限りのバージョンまたはタグ指定
  - H2: ドライラン
  - H2: Plugin とチャネル
  - H2: 現在のステータス確認
  - H2: タグ付けのベストプラクティス
  - H2: macOS アプリの可用性
  - H2: 関連

## install/digitalocean.md

- ルート: /install/digitalocean
- 見出し:
  - H2: 前提条件
  - H2: セットアップ
  - H2: 永続化とバックアップ
  - H2: 1 GB RAM のヒント
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連

## install/docker-vm-runtime.md

- ルート: /install/docker-vm-runtime
- 見出し:
  - H2: 必要なバイナリをイメージに組み込む
  - H2: ビルドして起動
  - H2: 何がどこに永続化されるか
  - H2: 更新
  - H2: 関連

## install/docker.md

- ルート: /install/docker
- 見出し:
  - H2: Docker は自分に適しているか？
  - H2: 前提条件
  - H2: コンテナー化された Gateway
  - H3: 手動フロー
  - H3: 環境変数
  - H3: 可観測性
  - H3: ヘルスチェック
  - H3: LAN とループバック
  - H3: ホストローカルプロバイダー
  - H3: Docker 内の Claude CLI バックエンド
  - H3: Bonjour / mDNS
  - H3: ストレージと永続化
  - H3: シェルヘルパー（任意）
  - H3: VPS で実行する場合
  - H2: エージェントサンドボックス
  - H3: クイック有効化
  - H2: トラブルシューティング
  - H2: 関連

## install/exe-dev.md

- ルート: /install/exe-dev
- 見出し:
  - H2: 初心者向けクイックパス
  - H2: 必要なもの
  - H2: Shelley による自動インストール
  - H2: 手動インストール
  - H2: 1) VM を作成する
  - H2: 2) 前提条件をインストールする（VM 上）
  - H2: 3) OpenClaw をインストールする
  - H2: 4) OpenClaw をポート 8000 にプロキシするよう nginx をセットアップする
  - H2: 5) OpenClaw にアクセスして権限を付与する
  - H2: リモートチャネルのセットアップ
  - H2: リモートアクセス
  - H2: 更新
  - H2: 関連

## install/fly.md

- ルート: /install/fly
- 見出し:
  - H2: 必要なもの
  - H2: 初心者向けクイックパス
  - H2: トラブルシューティング
  - H3: "アプリが期待されるアドレスでリッスンしていない"
  - H3: ヘルスチェック失敗 / 接続拒否
  - H3: OOM / メモリ問題
  - H3: Gateway ロックの問題
  - H3: 設定が読み込まれない
  - H3: SSH 経由で設定を書き込む
  - H3: 状態が永続化されない
  - H2: 更新
  - H3: マシンコマンドの更新
  - H2: プライベートデプロイ（強化済み）
  - H3: プライベートデプロイを使うタイミング
  - H3: セットアップ
  - H3: プライベートデプロイへのアクセス
  - H3: プライベートデプロイでの Webhook
  - H3: セキュリティ上の利点
  - H2: 注意事項
  - H2: コスト
  - H2: 次のステップ
  - H2: 関連

## install/gcp.md

- ルート: /install/gcp
- 見出し:
  - H2: 何をするのか（簡単に）？
  - H2: クイックパス（経験のある運用者向け）
  - H2: 必要なもの
  - H2: トラブルシューティング
  - H2: サービスアカウント（セキュリティのベストプラクティス）
  - H2: 次のステップ
  - H2: 関連

## install/hetzner.md

- ルート: /install/hetzner
- 見出し:
  - H2: 目標
  - H2: 何をするのか（簡単に）？
  - H2: クイックパス（経験のある運用者向け）
  - H2: 必要なもの
  - H2: Infrastructure as Code（Terraform）
  - H2: 次のステップ
  - H2: 関連

## install/hostinger.md

- ルート: /install/hostinger
- 見出し:
  - H2: 前提条件
  - H2: オプション A: 1-Click OpenClaw
  - H2: オプション B: VPS 上の OpenClaw
  - H2: セットアップを確認する
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連

## install/index.md

- ルート: /install
- 見出し:
  - H2: システム要件
  - H2: 推奨: インストーラースクリプト
  - H2: 代替インストール方法
  - H3: ローカルプレフィックスインストーラー（install-cli.sh）
  - H3: npm、pnpm、または bun
  - H3: ソースから
  - H3: GitHub main チェックアウトからインストール
  - H3: コンテナーとパッケージマネージャー
  - H2: インストールを確認する
  - H2: ホスティングとデプロイ
  - H2: 更新、移行、またはアンインストール
  - H2: トラブルシューティング: openclaw が見つからない

## install/installer.md

- ルート: /install/installer
- 見出し:
  - H2: クイックコマンド
  - H2: install.sh
  - H3: フロー（install.sh）
  - H3: ソースチェックアウト検出
  - H3: 例（install.sh）
  - H2: install-cli.sh
  - H3: フロー（install-cli.sh）
  - H3: 例（install-cli.sh）
  - H2: install.ps1
  - H3: フロー（install.ps1）
  - H3: 例（install.ps1）
  - H2: CI と自動化
  - H2: トラブルシューティング
  - H2: 関連

## install/kubernetes.md

- ルート: /install/kubernetes
- 見出し:
  - H2: なぜ Helm ではないのか？
  - H2: 必要なもの
  - H2: クイックスタート
  - H2: Kind によるローカルテスト
  - H2: ステップバイステップ
  - H3: 1) デプロイ
  - H3: 2) Gateway にアクセスする
  - H2: デプロイされるもの
  - H2: カスタマイズ
  - H3: エージェント指示
  - H3: Gateway 設定
  - H3: プロバイダーを追加
  - H3: カスタム名前空間
  - H3: カスタムイメージ
  - H3: ポートフォワードを超えて公開する
  - H2: 再デプロイ
  - H2: ティアダウン
  - H2: アーキテクチャノート
  - H2: ファイル構造
  - H2: 関連

## install/macos-vm.md

- ルート: /install/macos-vm
- 見出し:
  - H2: 推奨デフォルト（ほとんどのユーザー）
  - H2: macOS VM オプション
  - H3: Apple Silicon Mac 上のローカル VM（Lume）
  - H3: ホスト型 Mac プロバイダー（クラウド）
  - H2: クイックパス（Lume、経験のあるユーザー向け）
  - H2: 必要なもの（Lume）
  - H2: 1) Lume をインストール
  - H2: 2) macOS VM を作成
  - H2: 3) セットアップアシスタントを完了
  - H2: 4) VM の IP アドレスを取得
  - H2: 5) VM に SSH 接続
  - H2: 6) OpenClaw をインストール
  - H2: 7) チャネルを設定
  - H2: 8) VM をヘッドレスで実行
  - H2: ボーナス: iMessage 連携
  - H2: ゴールデンイメージを保存
  - H2: 24/7 稼働
  - H2: トラブルシューティング
  - H2: 関連ドキュメント

## install/migrating-claude.md

- ルート: /install/migrating-claude
- 見出し:
  - H2: インポートする 2 つの方法
  - H2: インポートされるもの
  - H2: アーカイブ専用のまま残るもの
  - H2: ソース選択
  - H2: 推奨フロー
  - H2: 競合処理
  - H2: 自動化用 JSON 出力
  - H2: トラブルシューティング
  - H2: 関連

## install/migrating-hermes.md

- ルート: /install/migrating-hermes
- 見出し:
  - H2: インポートする 2 つの方法
  - H2: インポートされるもの
  - H2: アーカイブ専用のまま残るもの
  - H2: 推奨フロー
  - H2: 競合処理
  - H2: シークレット
  - H2: 自動化用 JSON 出力
  - H2: トラブルシューティング
  - H2: 関連

## install/migrating.md

- ルート: /install/migrating
- 見出し:
  - H2: 別のエージェントシステムからインポート
  - H2: OpenClaw を新しいマシンに移動
  - H3: 移行手順
  - H3: よくある落とし穴
  - H3: 検証チェックリスト
  - H2: Plugin をインプレースでアップグレード
  - H2: 関連

## install/nix.md

- ルート: /install/nix
- 見出し:
  - H2: 得られるもの
  - H2: クイックスタート
  - H2: Nix モードのランタイム動作
  - H3: Nix モードで変わること
  - H3: 設定と状態パス
  - H3: サービス PATH 検出
  - H2: 関連

## install/node.md

- ルート: /install/node
- 見出し:
  - H2: バージョンを確認
  - H2: Node をインストール
  - H2: トラブルシューティング
  - H3: openclaw: command not found
  - H3: npm install -g の権限エラー（Linux）
  - H2: 関連

## install/northflank.mdx

- ルート: /install/northflank
- 見出し:
  - H1: Northflank
  - H2: はじめ方
  - H2: 得られるもの
  - H2: チャネルを接続
  - H2: 次のステップ

## install/oracle.md

- ルート: /install/oracle
- 見出し:
  - H2: 前提条件
  - H2: セットアップ
  - H2: セキュリティ態勢を確認
  - H2: ARM ノート
  - H2: 永続化とバックアップ
  - H2: フォールバック: SSH トンネル
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連

## install/podman.md

- ルート: /install/podman
- 見出し:
  - H2: 前提条件
  - H2: クイックスタート
  - H2: Podman と Tailscale
  - H2: Systemd（Quadlet、任意）
  - H2: 設定、環境変数、ストレージ
  - H2: 便利なコマンド
  - H2: トラブルシューティング
  - H2: 関連

## install/railway.mdx

- ルート: /install/railway
- 見出し:
  - H1: Railway
  - H2: クイックチェックリスト（新規ユーザー）
  - H2: ワンクリックデプロイ
  - H2: 得られるもの
  - H2: 必須の Railway 設定
  - H3: パブリックネットワーキング
  - H3: ボリューム（必須）
  - H3: 変数
  - H2: チャネルを接続
  - H2: バックアップと移行
  - H2: 次のステップ

## install/raspberry-pi.md

- ルート: /install/raspberry-pi
- 見出し:
  - H2: ハードウェア互換性
  - H2: 前提条件
  - H2: セットアップ
  - H2: パフォーマンスのヒント
  - H2: 推奨モデル設定
  - H2: ARM バイナリに関する注意
  - H2: 永続化とバックアップ
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連

## install/render.mdx

- ルート: /install/render
- 見出し:
  - H1: Render
  - H2: 前提条件
  - H2: Render Blueprint でデプロイ
  - H2: Blueprint を理解する
  - H2: プランの選択
  - H2: デプロイ後
  - H3: Control UI にアクセスする
  - H2: Render Dashboard の機能
  - H3: ログ
  - H3: シェルアクセス
  - H3: 環境変数
  - H3: 自動デプロイ
  - H2: カスタムドメイン
  - H2: スケーリング
  - H2: バックアップと移行
  - H2: トラブルシューティング
  - H3: サービスが起動しない
  - H3: コールドスタートが遅い（無料枠）
  - H3: 再デプロイ後のデータ損失
  - H3: ヘルスチェック失敗
  - H2: 次のステップ

## install/uninstall.md

- ルート: /install/uninstall
- 見出し:
  - H2: 簡単な方法（CLI がまだインストールされている場合）
  - H2: 手動でのサービス削除（CLI がインストールされていない場合）
  - H3: macOS（launchd）
  - H3: Linux（systemd ユーザーユニット）
  - H3: Windows（Scheduled Task）
  - H2: 通常インストールとソースチェックアウト
  - H3: 通常インストール（install.sh / npm / pnpm / bun）
  - H3: ソースチェックアウト（git clone）
  - H2: 関連

## install/updating.md

- ルート: /install/updating
- 見出し:
  - H2: 推奨: openclaw update
  - H2: npm インストールと git インストールを切り替える
  - H2: 代替: インストーラーを再実行する
  - H2: 代替: 手動の npm、pnpm、または bun
  - H3: 高度な npm インストールトピック
  - H2: 自動アップデーター
  - H2: 更新後
  - H3: doctor を実行する
  - H3: Gateway を再起動する
  - H3: 検証
  - H2: ロールバック
  - H3: バージョンを固定する（npm）
  - H3: コミットを固定する（ソース）
  - H2: 行き詰まった場合
  - H2: 関連

## install/upstash.md

- ルート: /install/upstash
- 見出し:
  - H2: 前提条件
  - H2: Box を作成する
  - H2: SSH トンネルで接続する
  - H2: OpenClaw をインストールする
  - H2: オンボーディングを実行する
  - H2: Gateway を起動する
  - H2: 自動再起動
  - H2: トラブルシューティング
  - H2: 関連

## logging.md

- ルート: /logging
- 見出し:
  - H2: ログの保存場所
  - H2: ログの読み方
  - H3: CLI: ライブ tail（推奨）
  - H3: Control UI（Web）
  - H3: チャネル専用ログ
  - H2: ログ形式
  - H3: ファイルログ（JSONL）
  - H3: コンソール出力
  - H3: Gateway WebSocket ログ
  - H2: ロギングの設定
  - H3: ログレベル
  - H3: 対象モデルのトランスポート診断
  - H3: トレース相関
  - H3: モデル呼び出しのサイズとタイミング
  - H3: コンソールスタイル
  - H3: 秘匿化
  - H2: 診断と OpenTelemetry
  - H2: トラブルシューティングのヒント
  - H2: 関連

## maturity/scorecard.md

- ルート: /maturity/scorecard
- 見出し:
  - H1: 成熟度スコアカード
  - H2: このページの目的
  - H2: 概要
  - H2: スコア帯
  - H2: サーフェスエクスプローラー
  - H2: QA エビデンスの概要
  - H3: 領域別の準備状況

## maturity/taxonomy.md

- ルート: /maturity/taxonomy
- 見出し:
  - H1: 成熟度タクソノミー
  - H2: このページの読み方
  - H2: 成熟度レベル
  - H2: プロダクト領域
  - H2: 詳細
  - H3: Core
  - H3: Platform
  - H3: Channel
  - H3: Provider とツール

## network.md

- ルート: /network
- 見出し:
  - H2: コアモデル
  - H2: ペアリング + ID
  - H2: 検出 + トランスポート
  - H2: Node + トランスポート
  - H2: セキュリティ
  - H2: 関連

## nodes/audio.md

- ルート: /nodes/audio
- 見出し:
  - H2: 動作するもの
  - H2: 自動検出（デフォルト）
  - H2: 設定例
  - H3: Provider + CLI フォールバック（OpenAI + Whisper CLI）
  - H3: スコープゲート付き Provider のみ
  - H3: Provider のみ（Deepgram）
  - H3: Provider のみ（Mistral Voxtral）
  - H3: Provider のみ（SenseAudio）
  - H3: 文字起こしをチャットにエコーする（オプトイン）
  - H2: 注意事項と制限
  - H3: プロキシ環境のサポート
  - H2: グループでのメンション検出
  - H2: 注意点
  - H2: 関連

## nodes/camera.md

- ルート: /nodes/camera
- 見出し:
  - H2: iOS Node
  - H3: ユーザー設定（デフォルトでオン）
  - H3: コマンド（Gateway node.invoke 経由）
  - H3: フォアグラウンド要件
  - H3: CLI ヘルパー
  - H2: Android Node
  - H3: Android ユーザー設定（デフォルトでオン）
  - H3: 権限
  - H3: Android フォアグラウンド要件
  - H3: Android コマンド（Gateway node.invoke 経由）
  - H3: ペイロードガード
  - H2: macOS アプリ
  - H3: ユーザー設定（デフォルトでオフ）
  - H3: CLI ヘルパー（node invoke）
  - H2: 安全性 + 実用上の制限
  - H2: macOS 画面動画（OS レベル）
  - H2: 関連

## nodes/images.md

- ルート: /nodes/images
- 見出し:
  - H2: 目標
  - H2: CLI サーフェス
  - H2: WhatsApp Web チャネルの動作
  - H2: 自動返信パイプライン
  - H2: 受信メディアからコマンドへ
  - H2: 制限とエラー
  - H2: テストに関する注意
  - H2: 関連

## nodes/index.md

- ルート: /nodes
- 見出し:
  - H2: ペアリング + ステータス
  - H2: リモート Node ホスト（system.run）
  - H3: 何がどこで実行されるか
  - H3: Node ホストを起動する（フォアグラウンド）
  - H3: SSH トンネル経由のリモート Gateway（loopback bind）
  - H3: Node ホストを起動する（サービス）
  - H3: ペアリング + 名前
  - H3: コマンドを許可リストに追加する
  - H3: exec を Node に向ける
  - H2: コマンドの呼び出し
  - H2: コマンドポリシー
  - H2: 設定（openclaw.json）
  - H2: スクリーンショット（Canvas スナップショット）
  - H3: Canvas コントロール
  - H3: A2UI（Canvas）
  - H2: 写真 + 動画（Node カメラ）
  - H2: 画面録画（Node）
  - H2: 位置情報（Node）
  - H2: SMS（Android Node）
  - H2: Android デバイス + 個人データコマンド
  - H2: システムコマンド（Node ホスト / Mac Node）
  - H2: Exec Node バインディング
  - H2: 権限マップ
  - H2: ヘッドレス Node ホスト（クロスプラットフォーム）
  - H2: Mac Node モード

## nodes/location-command.md

- ルート: /nodes/location-command
- 見出し:
  - H2: TL;DR
  - H2: なぜスイッチだけでなくセレクターなのか
  - H2: 設定モデル
  - H2: 権限マッピング（node.permissions）
  - H2: コマンド: location.get
  - H2: バックグラウンド動作
  - H2: モデル/ツール連携
  - H2: UX 文言（推奨）
  - H2: 関連

## nodes/media-understanding.md

- ルート: /nodes/media-understanding
- 見出し:
  - H2: 目標
  - H2: 高レベルの動作
  - H2: 設定概要
  - H3: モデルエントリ
  - H3: Provider 認証情報（apiKey）
  - H2: デフォルトと制限
  - H3: メディア理解の自動検出（デフォルト）
  - H3: プロキシ環境のサポート（Provider モデル）
  - H2: 機能（任意）
  - H2: Provider サポートマトリクス（OpenClaw 連携）
  - H2: モデル選択ガイダンス
  - H2: 添付ファイルポリシー
  - H2: 設定例
  - H2: ステータス出力
  - H2: 注意事項
  - H2: 関連

## nodes/talk.md

- ルート: /nodes/talk
- 見出し:
  - H2: 動作（macOS）
  - H2: 返信内の音声指示
  - H2: 設定（/.openclaw/openclaw.json）
  - H2: macOS UI
  - H2: Android UI
  - H2: 注意事項
  - H2: 関連

## nodes/troubleshooting.md

- ルート: /nodes/troubleshooting
- 見出し:
  - H2: コマンドラダー
  - H2: フォアグラウンド要件
  - H2: 権限マトリクス
  - H2: ペアリングと承認の違い
  - H2: 一般的な Node エラーコード
  - H2: 高速復旧ループ
  - H2: 関連

## nodes/voicewake.md

- ルート: /nodes/voicewake
- 見出し:
  - H2: ストレージ（Gateway ホスト）
  - H2: プロトコル
  - H3: メソッド
  - H3: ルーティングメソッド（トリガー → ターゲット）
  - H3: イベント
  - H2: クライアント動作
  - H3: macOS アプリ
  - H3: iOS Node
  - H3: Android Node
  - H2: 関連

## openclaw-agent-runtime.md

- ルート: /openclaw-agent-runtime
- 見出し:
  - H2: 型チェックとリンティング
  - H2: Agent Runtime テストの実行
  - H2: 手動テスト
  - H2: クリーンスレートリセット
  - H2: リファレンス
  - H2: 関連

## perplexity.md

- ルート: /perplexity
- 見出し:
  - H2: 関連

## plan/codex-context-engine-harness.md

- ルート: /plan/codex-context-engine-harness
- 見出し:
  - H2: ステータス
  - H2: 目標
  - H2: 非目標
  - H2: 現在のアーキテクチャ
  - H2: 現在のギャップ
  - H2: 望ましい動作
  - H2: 設計制約
  - H3: Codex app-server はネイティブスレッド状態の正本のままにする
  - H3: Context engine の組み立ては Codex 入力に投影する必要がある
  - H3: プロンプトキャッシュの安定性が重要
  - H3: ランタイム選択セマンティクスは変更しない
  - H2: 実装計画
  - H3: 1. 再利用可能な context-engine 試行ヘルパーをエクスポートまたは移動する
  - H3: 2. Codex コンテキスト投影ヘルパーを追加する
  - H3: 3. Codex スレッド起動前にブートストラップを配線する
  - H3: 4. thread/start / thread/resume と turn/start の前に assemble を配線する
  - H3: 5. プロンプトキャッシュで安定したフォーマットを維持する
  - H3: 6. トランスクリプトのミラーリング後に post-turn を配線する
  - H3: 7. 使用量とプロンプトキャッシュのランタイムコンテキストを正規化する
  - H3: 8. Compaction ポリシー
  - H4: /compact と明示的な OpenClaw compaction
  - H4: ターン内の Codex ネイティブ contextCompaction イベント
  - H3: 9. セッションリセットとバインディング動作
  - H3: 10. エラー処理
  - H2: テスト計画
  - H3: ユニットテスト
  - H3: 更新が必要な既存テスト
  - H3: 統合 / ライブテスト
  - H2: 可観測性
  - H2: 移行 / 互換性
  - H2: 未解決の質問
  - H2: 受け入れ基準

## plan/ui-channels.md

- ルート: /plan/ui-channels
- 見出し:
  - H2: ステータス
  - H2: 問題
  - H2: 目標
  - H2: 非目標
  - H2: ターゲットモデル
  - H2: 配信メタデータ
  - H2: ランタイム機能契約
  - H2: チャネルマッピング
  - H2: リファクタリング手順
  - H2: テスト
  - H2: 未解決の質問
  - H2: 関連

## platforms/android.md

- ルート: /platforms/android
- 見出し:
  - H2: サポート状況のスナップショット
  - H2: システム制御
  - H2: 接続ランブック
  - H3: 前提条件
  - H3: 1) Gateway を起動する
  - H3: 2) 検出を検証する（任意）
  - H4: ユニキャスト DNS-SD による Tailnet（Vienna ⇄ London）検出
  - H3: 3) Android から接続する
  - H3: プレゼンス生存ビーコン
  - H3: 4) ペアリングを承認する（CLI）
  - H3: 5) Node が接続されていることを検証する
  - H3: 6) チャット + 履歴
  - H3: 7) Canvas + カメラ
  - H4: Gateway Canvas Host（Web コンテンツに推奨）
  - H3: 8) 音声 + 拡張 Android コマンドサーフェス
  - H2: アシスタントエントリポイント
  - H2: 通知転送
  - H2: 関連

## platforms/digitalocean.md

- ルート: /platforms/digitalocean
- 見出し:
  - H2: 関連

## platforms/easyrunner.md

- ルート: /platforms/easyrunner
- 見出し:
  - H2: 始める前に
  - H2: Compose アプリ
  - H2: OpenClaw を設定する
  - H2: 検証
  - H2: 更新とバックアップ
  - H2: トラブルシューティング

## platforms/index.md

- ルート: /platforms
- 見出し:
  - H2: OS を選択する
  - H2: VPS とホスティング
  - H2: 共通リンク
  - H2: Gateway サービスインストール（CLI）
  - H2: 関連

## platforms/ios.md

- ルート: /platforms/ios
- 見出し:
  - H2: できること
  - H2: 要件
  - H2: クイックスタート（ペアリング + 接続）
  - H2: 公式ビルド向けのリレー対応プッシュ
  - H2: バックグラウンド生存ビーコン
  - H2: 認証と信頼フロー
  - H2: 検出パス
  - H3: Bonjour（LAN）
  - H3: Tailnet（クロスネットワーク）
  - H3: 手動ホスト/ポート
  - H2: Canvas + A2UI
  - H2: Computer Use との関係
  - H3: Canvas eval / スナップショット
  - H2: Voice wake + talk モード
  - H2: 一般的なエラー
  - H2: 関連ドキュメント

## platforms/linux.md

- ルート: /platforms/linux
- 見出し:
  - H2: 初心者向けクイックパス（VPS）
  - H2: インストール
  - H2: Gateway
  - H2: Gateway サービスインストール（CLI）
  - H2: システム制御（systemd ユーザーユニット）
  - H2: メモリ圧迫と OOM kill
  - H2: 関連

## platforms/mac/bundled-gateway.md

- ルート: /platforms/mac/bundled-gateway
- 見出し:
  - H2: CLI をインストールする（ローカルモードに必須）
  - H2: Launchd（LaunchAgent としての Gateway）
  - H2: バージョン互換性
  - H2: macOS 上の状態ディレクトリ
  - H2: アプリ接続のデバッグ
  - H2: スモークチェック
  - H2: 関連

## platforms/mac/canvas.md

- ルート: /platforms/mac/canvas
- 見出し:
  - H2: Canvas の場所
  - H2: パネル動作
  - H2: Agent API サーフェス
  - H2: Canvas 内の A2UI
  - H3: A2UI コマンド（v0.8）
  - H2: Canvas からエージェント実行をトリガーする
  - H2: セキュリティ上の注意
  - H2: 関連

## platforms/mac/child-process.md

- ルート: /platforms/mac/child-process
- 見出し:
  - H2: デフォルトの動作（launchd）
  - H2: 未署名の開発ビルド
  - H2: アタッチ専用モード
  - H2: リモートモード
  - H2: launchd を推奨する理由
  - H2: 関連

## platforms/mac/dev-setup.md

- ルート: /platforms/mac/dev-setup
- 見出し:
  - H1: macOS開発者セットアップ
  - H2: 前提条件
  - H2: 1. 依存関係をインストールする
  - H2: 2. アプリをビルドしてパッケージ化する
  - H2: 3. CLIをインストールする
  - H2: トラブルシューティング
  - H3: ビルド失敗: ツールチェーンまたはSDKの不一致
  - H3: 権限付与時にアプリがクラッシュする
  - H3: Gatewayが「Starting...」のまま終わらない
  - H2: 関連

## platforms/mac/health.md

- ルート: /platforms/mac/health
- 見出し:
  - H1: macOSでのヘルスチェック
  - H2: メニューバー
  - H2: 設定
  - H2: プローブの仕組み
  - H2: 迷った場合
  - H2: 関連

## platforms/mac/icon.md

- ルート: /platforms/mac/icon
- 見出し:
  - H1: メニューバーアイコンの状態
  - H2: 関連

## platforms/mac/logging.md

- ルート: /platforms/mac/logging
- 見出し:
  - H1: ロギング（macOS）
  - H2: ローテーションされる診断ファイルログ（デバッグペイン）
  - H2: macOSでの統合ログのプライベートデータ
  - H2: OpenClaw（ai.openclaw）で有効化する
  - H2: デバッグ後に無効化する
  - H2: 関連

## platforms/mac/menu-bar.md

- ルート: /platforms/mac/menu-bar
- 見出し:
  - H2: 表示されるもの
  - H2: 状態モデル
  - H2: IconState enum（Swift）
  - H3: ActivityKind → グリフ
  - H3: 視覚的な対応付け
  - H2: コンテキストサブメニュー
  - H2: ステータス行のテキスト（メニュー）
  - H2: イベント取り込み
  - H2: デバッグオーバーライド
  - H2: テストチェックリスト
  - H2: 関連

## platforms/mac/peekaboo.md

- ルート: /platforms/mac/peekaboo
- 見出し:
  - H2: これは何か（そして何ではないか）
  - H2: Computer Useとの関係
  - H2: ブリッジを有効化する
  - H2: クライアント検出順序
  - H2: セキュリティと権限
  - H2: スナップショットの動作（自動化）
  - H2: トラブルシューティング
  - H2: 関連

## platforms/mac/permissions.md

- ルート: /platforms/mac/permissions
- 見出し:
  - H2: 安定した権限に必要な要件
  - H2: NodeおよびCLIランタイムへのアクセシビリティ許可
  - H2: プロンプトが表示されなくなった場合の復旧チェックリスト
  - H2: ファイルとフォルダーの権限（Desktop/Documents/Downloads）
  - H2: 関連

## platforms/mac/remote.md

- ルート: /platforms/mac/remote
- 見出し:
  - H2: モード
  - H2: リモートトランスポート
  - H2: リモートホスト側の前提条件
  - H2: macOSアプリのセットアップ
  - H2: Webチャット
  - H2: 権限
  - H2: セキュリティの注意事項
  - H2: WhatsAppログインフロー（リモート）
  - H2: トラブルシューティング
  - H2: 通知音
  - H2: 関連

## platforms/mac/signing.md

- ルート: /platforms/mac/signing
- 見出し:
  - H1: mac署名（デバッグビルド）
  - H2: 使用方法
  - H3: アドホック署名に関する注意
  - H2: About用のビルドメタデータ
  - H2: 理由
  - H2: 関連

## platforms/mac/skills.md

- ルート: /platforms/mac/skills
- 見出し:
  - H2: データソース
  - H2: インストールアクション
  - H2: 環境/APIキー
  - H2: リモートモード
  - H2: 関連

## platforms/mac/voice-overlay.md

- ルート: /platforms/mac/voice-overlay
- 見出し:
  - H1: 音声オーバーレイのライフサイクル（macOS）
  - H2: 現在の意図
  - H2: 実装済み（2025年12月9日）
  - H2: 次のステップ
  - H2: デバッグチェックリスト
  - H2: 移行手順（推奨）
  - H2: 関連

## platforms/mac/voicewake.md

- ルート: /platforms/mac/voicewake
- 見出し:
  - H1: 音声ウェイクとプッシュトゥトーク
  - H2: 要件
  - H2: モード
  - H2: ランタイム動作（ウェイクワード）
  - H2: ライフサイクル不変条件
  - H2: 固着オーバーレイの失敗モード（以前）
  - H2: プッシュトゥトーク固有事項
  - H2: ユーザー向け設定
  - H2: 転送動作
  - H2: 転送ペイロード
  - H2: クイック検証
  - H2: 関連

## platforms/mac/webchat.md

- ルート: /platforms/mac/webchat
- 見出し:
  - H2: 起動とデバッグ
  - H2: 配線の仕組み
  - H2: セキュリティ表面
  - H2: 既知の制限
  - H2: 関連

## platforms/mac/xpc.md

- ルート: /platforms/mac/xpc
- 見出し:
  - H1: OpenClaw macOS IPCアーキテクチャ
  - H2: 目標
  - H2: 仕組み
  - H3: Gateway + Nodeトランスポート
  - H3: Nodeサービス + アプリIPC
  - H3: PeekabooBridge（UI自動化）
  - H2: 運用フロー
  - H2: 強化に関する注意
  - H2: 関連

## platforms/macos.md

- ルート: /platforms/macos
- 見出し:
  - H2: ダウンロード
  - H2: 初回実行
  - H2: Gatewayモードを選択する
  - H2: アプリが所有するもの
  - H2: macOS詳細ページ
  - H2: 関連

## platforms/oracle.md

- ルート: /platforms/oracle
- 見出し:
  - H2: 関連

## platforms/raspberry-pi.md

- ルート: /platforms/raspberry-pi
- 見出し:
  - H2: 関連

## platforms/windows.md

- ルート: /platforms/windows
- 見出し:
  - H2: 推奨: Windows Hub
  - H3: Windows Hubに含まれるもの
  - H3: 初回起動
  - H2: Windows Nodeモード
  - H2: ローカルMCPモード
  - H2: ネイティブWindows CLIとGateway
  - H2: WSL2 Gateway
  - H2: Windowsログイン前にGatewayを自動起動する
  - H2: WSLサービスをLANに公開する
  - H2: トラブルシューティング
  - H3: トレイアイコンが表示されない
  - H3: ローカルセットアップが失敗する
  - H3: アプリがペアリングが必要だと表示する
  - H3: WebチャットがリモートGatewayに到達できない
  - H3: screen.snapshot、カメラ、または音声コマンドが失敗する
  - H3: GitまたはGitHubの接続が失敗する
  - H2: 関連

## plugins/adding-capabilities.md

- ルート: /plugins/adding-capabilities
- 見出し:
  - H2: 機能を作成するタイミング
  - H2: 標準シーケンス
  - H2: 何をどこに置くか
  - H2: プロバイダーとハーネスの境界
  - H2: ファイルチェックリスト
  - H2: 実例: 画像生成
  - H2: 埋め込みプロバイダー
  - H2: レビューチェックリスト
  - H2: 関連

## plugins/admin-http-rpc.md

- ルート: /plugins/admin-http-rpc
- 見出し:
  - H2: 有効化する前に
  - H2: 有効化
  - H2: ルートを検証する
  - H2: 認証
  - H2: セキュリティモデル
  - H2: リクエスト
  - H2: レスポンス
  - H2: 許可されるメソッド
  - H2: WebSocketとの比較
  - H2: トラブルシューティング
  - H2: 関連

## plugins/agent-tools.md

- ルート: /plugins/agent-tools
- 見出し:
  - H2: 関連

## plugins/architecture-internals.md

- ルート: /plugins/architecture-internals
- 見出し:
  - H2: 読み込みパイプライン
  - H3: マニフェスト優先の動作
  - H3: Pluginキャッシュ境界
  - H2: レジストリモデル
  - H2: 会話バインディングコールバック
  - H2: プロバイダーランタイムフック
  - H3: フックの順序と使用方法
  - H3: プロバイダー例
  - H3: 組み込み例
  - H2: ランタイムヘルパー
  - H3: api.runtime.imageGeneration
  - H2: Gateway HTTPルート
  - H2: Plugin SDKインポートパス
  - H2: メッセージツールスキーマ
  - H2: チャンネルターゲット解決
  - H2: 設定に基づくディレクトリ
  - H2: プロバイダーカタログ
  - H2: 読み取り専用チャンネル検査
  - H2: パッケージパック
  - H3: チャンネルカタログメタデータ
  - H2: コンテキストエンジンPlugin
  - H2: 新しい機能を追加する
  - H3: 機能チェックリスト
  - H3: 機能テンプレート
  - H2: 関連

## plugins/architecture.md

- ルート: /plugins/architecture
- 見出し:
  - H2: 公開機能モデル
  - H3: 外部互換性の方針
  - H3: Plugin形状
  - H3: レガシーフック
  - H3: 互換性シグナル
  - H2: アーキテクチャ概要
  - H3: Pluginメタデータスナップショットとルックアップテーブル
  - H3: アクティベーション計画
  - H3: チャンネルPluginと共有メッセージツール
  - H2: 機能所有権モデル
  - H3: 機能レイヤリング
  - H3: 複数機能を持つ企業Pluginの例
  - H3: 機能例: 動画理解
  - H2: 契約と強制
  - H3: 契約に含めるべきもの
  - H2: 実行モデル
  - H2: エクスポート境界
  - H2: 内部構造とリファレンス
  - H2: 関連

## plugins/building-extensions.md

- ルート: /plugins/building-extensions
- 見出し:
  - H2: 関連

## plugins/building-plugins.md

- ルート: /plugins/building-plugins
- 見出し:
  - H2: 要件
  - H2: Plugin形状を選択する
  - H2: クイックスタート
  - H2: ツールを登録する
  - H2: インポート規約
  - H2: 提出前チェックリスト
  - H2: ベータリリースに対してテストする
  - H2: 次のステップ
  - H2: 関連

## plugins/bundles.md

- ルート: /plugins/bundles
- 見出し:
  - H2: バンドルが存在する理由
  - H2: バンドルをインストールする
  - H2: OpenClawがバンドルからマッピングするもの
  - H3: 現在サポート済み
  - H4: Skillコンテンツ
  - H4: フックパック
  - H4: 埋め込みOpenClaw向けMCP
  - H4: 埋め込みOpenClaw設定
  - H4: 埋め込みOpenClaw LSP
  - H3: 検出されるが実行されない
  - H2: バンドル形式
  - H2: 検出の優先順位
  - H2: ランタイム依存関係とクリーンアップ
  - H2: セキュリティ
  - H2: トラブルシューティング
  - H2: 関連

## plugins/cli-backend-plugins.md

- ルート: /plugins/cli-backend-plugins
- 見出し:
  - H2: Pluginが所有するもの
  - H2: 最小バックエンドPlugin
  - H2: 設定形状
  - H2: 高度なバックエンドフック
  - H3: ownsNativeCompaction: OpenClaw Compactionをオプトアウトする
  - H2: MCPツールブリッジ
  - H2: ユーザー設定
  - H2: 検証
  - H2: チェックリスト
  - H2: 関連

## plugins/codex-computer-use.md

- ルート: /plugins/codex-computer-use
- 見出し:
  - H2: OpenClaw.appとPeekaboo
  - H2: iOSアプリ
  - H2: 直接cua-driver MCP
  - H2: クイックセットアップ
  - H2: コマンド
  - H2: マーケットプレイスの選択肢
  - H2: バンドルされたmacOSマーケットプレイス
  - H2: リモートカタログ制限
  - H2: 設定リファレンス
  - H2: OpenClawがチェックするもの
  - H2: macOS権限
  - H2: トラブルシューティング
  - H2: 関連

## plugins/codex-harness-reference.md

- ルート: /plugins/codex-harness-reference
- 見出し:
  - H2: Plugin設定表面
  - H2: アプリサーバートランスポート
  - H2: 承認とサンドボックスモード
  - H2: サンドボックス化されたネイティブ実行
  - H2: 認証と環境分離
  - H2: 動的ツール
  - H2: タイムアウト
  - H2: モデル検出
  - H2: ワークスペースブートストラップファイル
  - H2: 環境オーバーライド
  - H2: 関連

## plugins/codex-harness-runtime.md

- ルート: /plugins/codex-harness-runtime
- 見出し:
  - H2: 概要
  - H2: スレッドバインディングとモデル変更
  - H2: 可視返信とHeartbeats
  - H2: フック境界
  - H2: V1サポート契約
  - H2: ネイティブ権限とMCP elicitations
  - H2: キューステアリング
  - H2: Codexフィードバックアップロード
  - H2: Compactionとトランスクリプトミラー
  - H2: メディアと配信
  - H2: 関連

## plugins/codex-harness.md

- ルート: /plugins/codex-harness
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: 設定
  - H2: Codexランタイムを検証する
  - H2: ルーティングとモデル選択
  - H2: デプロイメントパターン
  - H3: 基本Codexデプロイメント
  - H3: 混在プロバイダーデプロイメント
  - H3: フェイルクローズCodexデプロイメント
  - H2: アプリサーバーポリシー
  - H2: コマンドと診断
  - H3: Codexスレッドをローカルで検査する
  - H2: ネイティブCodex Plugin
  - H2: Computer Use
  - H2: ランタイム境界
  - H2: トラブルシューティング
  - H2: 関連

## plugins/codex-native-plugins.md

- ルート: /plugins/codex-native-plugins
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: チャットからPluginを管理する
  - H2: ネイティブPluginセットアップの仕組み
  - H2: V1サポート境界
  - H2: アプリインベントリと所有権
  - H2: スレッドアプリ設定
  - H2: 破壊的アクションポリシー
  - H2: トラブルシューティング
  - H2: 関連

## plugins/community.md

- ルート: /plugins/community
- 見出し:
  - H2: Pluginを探す
  - H2: Pluginを公開する
  - H2: 関連

## plugins/compatibility.md

- ルート: /plugins/compatibility
- 見出し:
  - H2: 互換性レジストリ
  - H2: Pluginインスペクターパッケージ
  - H3: メンテナー受け入れレーン
  - H2: 非推奨ポリシー
  - H2: 現在の互換性領域
  - H3: WhatsApp受信コールバックフラットエイリアス
  - H3: WhatsApp受信許可フィールド
  - H2: リリースノート

## plugins/copilot.md

- ルート: /plugins/copilot
- 見出し:
  - H2: 要件
  - H2: Pluginインストール
  - H2: クイックスタート
  - H2: サポートされるプロバイダー
  - H2: BYOK
  - H2: 認証
  - H2: 設定表面
  - H2: Compaction
  - H2: トランスクリプトミラーリング
  - H2: ついでの質問（/btw）
  - H2: Doctor
  - H2: 制限
  - H2: 権限とaskuser
  - H3: セッションレベルのGitHubトークン
  - H2: 関連

## plugins/dependency-resolution.md

- ルート: /plugins/dependency-resolution
- 見出し:
  - H2: 責任分担
  - H2: インストールルート
  - H2: ローカルPlugin
  - H2: 起動とリロード
  - H2: バンドル済みPlugin
  - H2: レガシークリーンアップ

## plugins/google-meet.md

- ルート: /plugins/google-meet
- 見出し:
  - H2: クイックスタート
  - H3: ローカルGateway + Parallels Chrome
  - H2: インストールの注記
  - H2: トランスポート
  - H3: Chrome
  - H3: Twilio
  - H2: OAuthとプリフライト
  - H3: Google認証情報を作成する
  - H3: リフレッシュトークンを発行する
  - H3: doctorでOAuthを検証する
  - H2: 設定
  - H2: ツール
  - H2: エージェントとbidiモード
  - H2: ライブテストチェックリスト
  - H2: トラブルシューティング
  - H3: エージェントがGoogle Meetツールを認識できない
  - H3: Google Meet対応ノードが接続されていない
  - H3: ブラウザは開くがエージェントが参加できない
  - H3: ミーティング作成に失敗する
  - H3: エージェントは参加するが話さない
  - H3: Twilioセットアップチェックに失敗する
  - H3: Twilio通話は開始するがミーティングに入らない
  - H2: 注記
  - H2: 関連

## plugins/hooks.md

- ルート: /plugins/hooks
- 見出し:
  - H2: クイックスタート
  - H2: フックカタログ
  - H2: デバッグランタイムフック
  - H2: ツール呼び出しポリシー
  - H3: 実行環境フック
  - H3: ツール結果の永続化
  - H2: プロンプトとモデルのフック
  - H3: セッション拡張と次ターン注入
  - H2: メッセージフック
  - H2: インストールフック
  - H2: Gatewayライフサイクル
  - H2: 今後の非推奨化
  - H2: 関連

## plugins/install-overrides.md

- ルート: /plugins/install-overrides
- 見出し:
  - H2: 環境
  - H2: 動作
  - H2: パッケージE2E

## plugins/llama-cpp.md

- ルート: /plugins/llama-cpp
- 見出し:
  - H2: 設定
  - H2: ネイティブランタイム

## plugins/manage-plugins.md

- ルート: /plugins/manage-plugins
- 見出し:
  - H2: Pluginを一覧表示して検索する
  - H2: Pluginをインストールする
  - H2: 再起動して検査する
  - H2: Pluginを更新する
  - H2: Pluginをアンインストールする
  - H2: ソースを選択する
  - H2: Pluginを公開する
  - H2: 関連

## plugins/manifest.md

- ルート: /plugins/manifest
- 見出し:
  - H2: このファイルの役割
  - H2: 最小例
  - H2: 詳細な例
  - H2: トップレベルフィールドリファレンス
  - H2: 生成プロバイダーメタデータリファレンス
  - H2: ツールメタデータリファレンス
  - H2: providerAuthChoicesリファレンス
  - H2: commandAliasesリファレンス
  - H2: activationリファレンス
  - H2: qaRunnersリファレンス
  - H2: setupリファレンス
  - H3: setup.providersリファレンス
  - H3: setupフィールド
  - H2: uiHintsリファレンス
  - H2: contractsリファレンス
  - H2: mediaUnderstandingProviderMetadataリファレンス
  - H2: channelConfigsリファレンス
  - H3: 別のチャンネルPluginを置き換える
  - H2: modelSupportリファレンス
  - H2: modelCatalogリファレンス
  - H2: modelIdNormalizationリファレンス
  - H2: providerEndpointsリファレンス
  - H2: providerRequestリファレンス
  - H2: secretProviderIntegrationsリファレンス
  - H2: modelPricingリファレンス
  - H3: OpenClaw Provider Index
  - H2: マニフェストとpackage.json
  - H3: 検出に影響するpackage.jsonフィールド
  - H2: 検出の優先順位（重複するPlugin ID）
  - H2: JSON Schema要件
  - H2: 検証動作
  - H2: 注記
  - H2: 関連

## plugins/memory-lancedb.md

- ルート: /plugins/memory-lancedb
- 見出し:
  - H2: インストール
  - H2: クイックスタート
  - H2: プロバイダー支援の埋め込み
  - H2: Ollama埋め込み
  - H2: OpenAI互換プロバイダー
  - H2: 想起とキャプチャの制限
  - H2: コマンド
  - H2: ストレージ
  - H2: ランタイム依存関係
  - H2: トラブルシューティング
  - H3: 入力長がコンテキスト長を超えている
  - H3: サポートされていない埋め込みモデル
  - H3: Pluginは読み込まれるがメモリが表示されない
  - H2: 関連

## plugins/memory-wiki.md

- ルート: /plugins/memory-wiki
- 見出し:
  - H2: 追加されるもの
  - H2: メモリとの関係
  - H2: 推奨ハイブリッドパターン
  - H2: Vaultモード
  - H3: isolated
  - H3: bridge
  - H3: unsafe-local
  - H2: Vaultレイアウト
  - H2: Open Knowledge Formatインポート
  - H2: 構造化された主張と証拠
  - H2: エージェント向けエンティティメタデータ
  - H2: コンパイルパイプライン
  - H2: ダッシュボードとヘルスレポート
  - H2: 検索と取得
  - H2: エージェントツール
  - H2: プロンプトとコンテキストの動作
  - H2: 設定
  - H3: 例: QMD + bridgeモード
  - H2: CLI
  - H2: Obsidianサポート
  - H2: 推奨ワークフロー
  - H2: 関連ドキュメント

## plugins/message-presentation.md

- ルート: /plugins/message-presentation
- 見出し:
  - H2: コントラクト
  - H2: プロデューサー例
  - H2: レンダラーコントラクト
  - H2: コアレンダリングフロー
  - H2: 劣化ルール
  - H3: ボタン値フォールバックの可視性
  - H2: プロバイダーマッピング
  - H2: プレゼンテーションとInteractiveReply
  - H2: 配信ピン
  - H2: Plugin作者チェックリスト
  - H2: 関連ドキュメント

## plugins/oc-path.md

- ルート: /plugins/oc-path
- 見出し:
  - H2: 有効にする理由
  - H2: 実行される場所
  - H2: 有効化
  - H2: 依存関係
  - H2: 提供内容
  - H2: 他のPluginとの関係
  - H2: 安全性
  - H2: 関連

## plugins/plugin-inventory.md

- ルート: /plugins/plugin-inventory
- 見出し:
  - H1: Pluginインベントリ
  - H2: 定義
  - H2: Pluginをインストールする
  - H2: コアnpmパッケージ
  - H2: 公式外部パッケージ
  - H2: ソースチェックアウトのみ

## plugins/plugin-permission-requests.md

- ルート: /plugins/plugin-permission-requests
- 見出し:
  - H2: 適切なゲートを選択する
  - H2: ツール呼び出し前に承認をリクエストする
  - H2: 決定動作
  - H2: 承認プロンプトをルーティングする
  - H2: Codexネイティブ権限
  - H2: トラブルシューティング
  - H2: 関連

## plugins/reference.md

- ルート: /plugins/reference
- 見出し:
  - H1: Pluginリファレンス

## plugins/reference/acpx.md

- ルート: /plugins/reference/acpx
- 見出し:
  - H1: ACPx Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/admin-http-rpc.md

- ルート: /plugins/reference/admin-http-rpc
- 見出し:
  - H1: Admin Http Rpc Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/alibaba.md

- ルート: /plugins/reference/alibaba
- 見出し:
  - H1: Alibaba Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/amazon-bedrock-mantle.md

- ルート: /plugins/reference/amazon-bedrock-mantle
- 見出し:
  - H1: Amazon Bedrock Mantle Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/amazon-bedrock.md

- ルート: /plugins/reference/amazon-bedrock
- 見出し:
  - H1: Amazon Bedrock Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/anthropic-vertex.md

- ルート: /plugins/reference/anthropic-vertex
- 見出し:
  - H1: Anthropic Vertex Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- ルート: /plugins/reference/anthropic
- 見出し:
  - H1: Anthropic Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/arcee.md

- ルート: /plugins/reference/arcee
- 見出し:
  - H1: Arcee Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/azure-speech.md

- ルート: /plugins/reference/azure-speech
- 見出し:
  - H1: Azure Speech Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/bonjour.md

- ルート: /plugins/reference/bonjour
- 見出し:
  - H1: Bonjour Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/brave.md

- ルート: /plugins/reference/brave
- 見出し:
  - H1: Brave Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/browser.md

- ルート: /plugins/reference/browser
- 見出し:
  - H1: Browser Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/byteplus.md

- ルート: /plugins/reference/byteplus
- 見出し:
  - H1: BytePlus Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/canvas.md

- ルート: /plugins/reference/canvas
- 見出し:
  - H1: Canvas Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/cerebras.md

- ルート: /plugins/reference/cerebras
- 見出し:
  - H1: Cerebras Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/chutes.md

- ルート: /plugins/reference/chutes
- 見出し:
  - H1: Chutes Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/clickclack.md

- ルート: /plugins/reference/clickclack
- 見出し:
  - H1: Clickclack Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/cloudflare-ai-gateway.md

- ルート: /plugins/reference/cloudflare-ai-gateway
- 見出し:
  - H1: Cloudflare AI Gateway Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/codex-supervisor.md

- ルート: /plugins/reference/codex-supervisor
- 見出し:
  - H1: Codex Supervisor Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: セッション一覧

## plugins/reference/codex.md

- ルート: /plugins/reference/codex
- 見出し:
  - H1: Codex Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/cohere.md

- ルート: /plugins/reference/cohere
- 見出し:
  - H1: Cohere Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/comfy.md

- ルート: /plugins/reference/comfy
- 見出し:
  - H1: ComfyUI Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/copilot-proxy.md

- ルート: /plugins/reference/copilot-proxy
- 見出し:
  - H1: Copilot Proxy Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/copilot.md

- ルート: /plugins/reference/copilot
- 見出し:
  - H1: Copilot Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/deepgram.md

- ルート: /plugins/reference/deepgram
- 見出し:
  - H1: Deepgram Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/deepinfra.md

- ルート: /plugins/reference/deepinfra
- 見出し:
  - H1: DeepInfra Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/deepseek.md

- ルート: /plugins/reference/deepseek
- 見出し:
  - H1: DeepSeek Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/diagnostics-otel.md

- ルート: /plugins/reference/diagnostics-otel
- 見出し:
  - H1: Diagnostics OpenTelemetry Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/diagnostics-prometheus.md

- ルート: /plugins/reference/diagnostics-prometheus
- 見出し:
  - H1: Diagnostics Prometheus Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/diffs-language-pack.md

- ルート: /plugins/reference/diffs-language-pack
- 見出し:
  - H1: Diffs Language Pack Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 追加された言語

## plugins/reference/diffs.md

- ルート: /plugins/reference/diffs
- 見出し:
  - H1: Diffs Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/discord.md

- ルート: /plugins/reference/discord
- 見出し:
  - H1: Discord Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/document-extract.md

- ルート: /plugins/reference/document-extract
- 見出し:
  - H1: Document Extract Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/duckduckgo.md

- ルート: /plugins/reference/duckduckgo
- 見出し:
  - H1: DuckDuckGo Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/elevenlabs.md

- ルート: /plugins/reference/elevenlabs
- 見出し:
  - H1: Elevenlabs Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/exa.md

- ルート: /plugins/reference/exa
- 見出し:
  - H1: Exa Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/fal.md

- ルート: /plugins/reference/fal
- 見出し:
  - H1: fal Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/feishu.md

- ルート: /plugins/reference/feishu
- 見出し:
  - H1: Feishu Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/file-transfer.md

- ルート: /plugins/reference/file-transfer
- 見出し:
  - H1: File Transfer Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/firecrawl.md

- ルート: /plugins/reference/firecrawl
- 見出し:
  - H1: Firecrawl Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/fireworks.md

- ルート: /plugins/reference/fireworks
- 見出し:
  - H1: Fireworks Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/github-copilot.md

- ルート: /plugins/reference/github-copilot
- 見出し:
  - H1: GitHub Copilot Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/gmi.md

- ルート: /plugins/reference/gmi
- 見出し:
  - H1: Gmi Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/google-meet.md

- ルート: /plugins/reference/google-meet
- 見出し:
  - H1: Google Meet Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/google.md

- ルート: /plugins/reference/google
- 見出し:
  - H1: Google Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/googlechat.md

- ルート: /plugins/reference/googlechat
- 見出し:
  - H1: Google Chat Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/gradium.md

- ルート: /plugins/reference/gradium
- 見出し:
  - H1: Gradium Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/groq.md

- ルート: /plugins/reference/groq
- 見出し:
  - H1: Groq Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/huggingface.md

- ルート: /plugins/reference/huggingface
- 見出し:
  - H1: Hugging Face Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/imessage.md

- ルート: /plugins/reference/imessage
- 見出し:
  - H1: iMessage Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/inworld.md

- ルート: /plugins/reference/inworld
- 見出し:
  - H1: Inworld Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/irc.md

- ルート: /plugins/reference/irc
- 見出し:
  - H1: IRC Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/kilocode.md

- ルート: /plugins/reference/kilocode
- 見出し:
  - H1: Kilocode Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/kimi.md

- ルート: /plugins/reference/kimi
- 見出し:
  - H1: Kimi Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/line.md

- ルート: /plugins/reference/line
- 見出し:
  - H1: LINE Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/litellm.md

- ルート: /plugins/reference/litellm
- 見出し:
  - H1: LiteLLM Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/llama-cpp.md

- ルート: /plugins/reference/llama-cpp
- 見出し:
  - H1: Llama Cpp Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/llm-task.md

- ルート: /plugins/reference/llm-task
- 見出し:
  - H1: LLM Task Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/lmstudio.md

- ルート: /plugins/reference/lmstudio
- 見出し:
  - H1: LM Studio Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/lobster.md

- ルート: /plugins/reference/lobster
- 見出し:
  - H1: Lobster Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/matrix.md

- ルート: /plugins/reference/matrix
- 見出し:
  - H1: Matrix Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/mattermost.md

- ルート: /plugins/reference/mattermost
- 見出し:
  - H1: Mattermost Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/memory-core.md

- ルート: /plugins/reference/memory-core
- 見出し:
  - H1: Memory Core Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/memory-lancedb.md

- ルート: /plugins/reference/memory-lancedb
- 見出し:
  - H1: Memory Lancedb Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/memory-wiki.md

- ルート: /plugins/reference/memory-wiki
- 見出し:
  - H1: Memory Wiki Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/microsoft-foundry.md

- ルート: /plugins/reference/microsoft-foundry
- 見出し:
  - H1: Microsoft Foundry Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 要件
  - H2: チャットモデル
  - H2: MAI画像生成
  - H2: トラブルシューティング

## plugins/reference/microsoft.md

- ルート: /plugins/reference/microsoft
- 見出し:
  - H1: Microsoft Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/migrate-claude.md

- ルート: /plugins/reference/migrate-claude
- 見出し:
  - H1: Migrate Claude Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/migrate-hermes.md

- ルート: /plugins/reference/migrate-hermes
- 見出し:
  - H1: Migrate Hermes Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/minimax.md

- ルート: /plugins/reference/minimax
- 見出し:
  - H1: MiniMax Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/mistral.md

- ルート: /plugins/reference/mistral
- 見出し:
  - H1: Mistral Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/moonshot.md

- ルート: /plugins/reference/moonshot
- 見出し:
  - H1: Moonshot Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/msteams.md

- ルート: /plugins/reference/msteams
- 見出し:
  - H1: Microsoft Teams Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/nextcloud-talk.md

- ルート: /plugins/reference/nextcloud-talk
- 見出し:
  - H1: Nextcloud Talk Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/nostr.md

- ルート: /plugins/reference/nostr
- 見出し:
  - H1: Nostr Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/novita.md

- ルート: /plugins/reference/novita
- 見出し:
  - H1: Novita Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/nvidia.md

- ルート: /plugins/reference/nvidia
- 見出し:
  - H1: NVIDIA Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/oc-path.md

- ルート: /plugins/reference/oc-path
- 見出し:
  - H1: Oc Path Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/ollama.md

- ルート: /plugins/reference/ollama
- 見出し:
  - H1: Ollama Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/open-prose.md

- ルート: /plugins/reference/open-prose
- 見出し:
  - H1: Open Prose Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/openai.md

- ルート: /plugins/reference/openai
- 見出し:
  - H1: OpenAI Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/opencode-go.md

- ルート: /plugins/reference/opencode-go
- 見出し:
  - H1: OpenCode Go Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/opencode.md

- ルート: /plugins/reference/opencode
- 見出し:
  - H1: OpenCode Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/openrouter.md

- ルート: /plugins/reference/openrouter
- 見出し:
  - H1: OpenRouter Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/openshell.md

- ルート: /plugins/reference/openshell
- 見出し:
  - H1: Openshell Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/perplexity.md

- ルート: /plugins/reference/perplexity
- 見出し:
  - H1: Perplexity Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/pixverse.md

- ルート: /plugins/reference/pixverse
- 見出し:
  - H1: PixVerse Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/policy.md

- ルート: /plugins/reference/policy
- 見出し:
  - H1: Policy Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 動作
  - H2: 関連ドキュメント

## plugins/reference/qa-channel.md

- ルート: /plugins/reference/qa-channel
- 見出し:
  - H1: QA Channel Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/qa-lab.md

- ルート: /plugins/reference/qa-lab
- 見出し:
  - H1: QA Lab Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/qa-matrix.md

- ルート: /plugins/reference/qa-matrix
- 見出し:
  - H1: QA Matrix Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/qianfan.md

- ルート: /plugins/reference/qianfan
- 見出し:
  - H1: Qianfan Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/qqbot.md

- ルート: /plugins/reference/qqbot
- 見出し:
  - H1: QQ Bot Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/qwen.md

- ルート: /plugins/reference/qwen
- 見出し:
  - H1: Qwen Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/raft.md

- ルート: /plugins/reference/raft
- 見出し:
  - H1: Raft Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/runway.md

- ルート: /plugins/reference/runway
- 見出し:
  - H1: Runway Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/searxng.md

- ルート: /plugins/reference/searxng
- 見出し:
  - H1: SearXNG Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/senseaudio.md

- ルート: /plugins/reference/senseaudio
- 見出し:
  - H1: Senseaudio Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/sglang.md

- ルート: /plugins/reference/sglang
- 見出し:
  - H1: SGLang Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/signal.md

- ルート: /plugins/reference/signal
- 見出し:
  - H1: Signal Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/slack.md

- ルート: /plugins/reference/slack
- 見出し:
  - H1: Slack Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/sms.md

- ルート: /plugins/reference/sms
- 見出し:
  - H1: Sms Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/stepfun.md

- ルート: /plugins/reference/stepfun
- 見出し:
  - H1: StepFun Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/synology-chat.md

- ルート: /plugins/reference/synology-chat
- 見出し:
  - H1: Synology Chat Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/synthetic.md

- ルート: /plugins/reference/synthetic
- 見出し:
  - H1: Synthetic Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tavily.md

- ルート: /plugins/reference/tavily
- 見出し:
  - H1: Tavily Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/telegram.md

- ルート: /plugins/reference/telegram
- 見出し:
  - H1: Telegram Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tencent.md

- ルート: /plugins/reference/tencent
- 見出し:
  - H1: Tencent Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tlon.md

- ルート: /plugins/reference/tlon
- 見出し:
  - H1: Tlon Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/together.md

- ルート: /plugins/reference/together
- 見出し:
  - H1: Together Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tokenjuice.md

- ルート: /plugins/reference/tokenjuice
- 見出し:
  - H1: Tokenjuice Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tts-local-cli.md

- ルート: /plugins/reference/tts-local-cli
- 見出し:
  - H1: TTS Local CLI Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/twitch.md

- ルート: /plugins/reference/twitch
- 見出し:
  - H1: Twitch Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/venice.md

- ルート: /plugins/reference/venice
- 見出し:
  - H1: Venice Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/vercel-ai-gateway.md

- ルート: /plugins/reference/vercel-ai-gateway
- 見出し:
  - H1: Vercel AI Gateway Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/vllm.md

- ルート: /plugins/reference/vllm
- 見出し:
  - H1: vLLM Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/voice-call.md

- ルート: /plugins/reference/voice-call
- 見出し:
  - H1: Voice Call Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/volcengine.md

- ルート: /plugins/reference/volcengine
- 見出し:
  - H1: Volcengine Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/voyage.md

- ルート: /plugins/reference/voyage
- 見出し:
  - H1: Voyage Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/vydra.md

- ルート: /plugins/reference/vydra
- 見出し:
  - H1: Vydra Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/web-readability.md

- ルート: /plugins/reference/web-readability
- 見出し:
  - H1: Web Readability Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/webhooks.md

- ルート: /plugins/reference/webhooks
- 見出し:
  - H1: Webhooks Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/whatsapp.md

- ルート: /plugins/reference/whatsapp
- 見出し:
  - H1: WhatsApp Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/workboard.md

- ルート: /plugins/reference/workboard
- 見出し:
  - H1: Workboard Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/xai.md

- ルート: /plugins/reference/xai
- 見出し:
  - H1: xAI Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/xiaomi.md

- ルート: /plugins/reference/xiaomi
- 見出し:
  - H1: Xiaomi Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/zai.md

- ルート: /plugins/reference/zai
- 見出し:
  - H1: Z.AI Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/zalo.md

- ルート: /plugins/reference/zalo
- 見出し:
  - H1: Zalo Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/zalouser.md

- ルート: /plugins/reference/zalouser
- 見出し:
  - H1: Zalo Personal Plugin
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/sdk-agent-harness.md

- ルート: /plugins/sdk-agent-harness
- 見出し:
  - H2: ハーネスを使うタイミング
  - H2: コアが引き続き所有するもの
  - H2: ハーネスを登録する
  - H2: 選択ポリシー
  - H2: プロバイダーとハーネスの組み合わせ
  - H3: ツール結果ミドルウェア
  - H3: ターミナル結果の分類
  - H3: エージェント終了時の副作用
  - H3: ユーザー入力とツールサーフェス
  - H3: ネイティブ Codex ハーネスモード
  - H2: ランタイムの厳格性
  - H2: ネイティブセッションとトランスクリプトミラー
  - H2: ツールとメディアの結果
  - H2: 現在の制限
  - H2: 関連

## plugins/sdk-channel-inbound.md

- ルート: /plugins/sdk-channel-inbound
- 見出し:
  - H2: コアヘルパー
  - H2: 移行

## plugins/sdk-channel-ingress.md

- ルート: /plugins/sdk-channel-ingress
- 見出し:
  - H1: チャネル受信 API
  - H2: ランタイムリゾルバー
  - H2: 結果
  - H2: アクセスグループ
  - H2: イベントモード
  - H2: ルートと有効化
  - H2: リダクション
  - H2: 検証

## plugins/sdk-channel-message.md

- ルート: /plugins/sdk-channel-message
- 見出し: なし

## plugins/sdk-channel-outbound.md

- ルート: /plugins/sdk-channel-outbound
- 見出し:
  - H2: アダプター
  - H2: 既存の送信アダプター
  - H2: 耐久的な送信
  - H2: 互換ディスパッチ

## plugins/sdk-channel-plugins.md

- ルート: /plugins/sdk-channel-plugins
- 見出し:
  - H2: チャネル Plugin の仕組み
  - H2: 承認とチャネル機能
  - H2: 受信メンションポリシー
  - H2: ウォークスルー
  - H2: ファイル構成
  - H2: 高度なトピック
  - H2: 次のステップ
  - H2: 関連

## plugins/sdk-channel-turn.md

- ルート: /plugins/sdk-channel-turn
- 見出し: なし

## plugins/sdk-entrypoints.md

- ルート: /plugins/sdk-entrypoints
- 見出し:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: 登録モード
  - H2: Plugin の形状
  - H2: 関連

## plugins/sdk-migration.md

- ルート: /plugins/sdk-migration
- 見出し:
  - H2: 変更内容
  - H2: この変更の理由
  - H2: 通話とリアルタイム音声の移行計画
  - H2: 互換性ポリシー
  - H2: 移行方法
  - H2: インポートパスリファレンス
  - H2: 有効な非推奨
  - H2: 削除タイムライン
  - H2: 警告を一時的に抑制する
  - H2: 関連

## plugins/sdk-overview.md

- ルート: /plugins/sdk-overview
- 見出し:
  - H2: インポート規約
  - H2: サブパスリファレンス
  - H2: 登録 API
  - H3: 機能登録
  - H3: ツールとコマンド
  - H3: インフラストラクチャ
  - H3: ワークフロー Plugin 向けホストフック
  - H3: Gateway 検出登録
  - H3: CLI 登録メタデータ
  - H3: CLI バックエンド登録
  - H3: 排他的スロット
  - H3: 非推奨のメモリ埋め込みアダプター
  - H3: イベントとライフサイクル
  - H3: フック判定のセマンティクス
  - H3: API オブジェクトフィールド
  - H2: 内部モジュール規約
  - H2: 関連

## plugins/sdk-provider-plugins.md

- ルート: /plugins/sdk-provider-plugins
- 見出し:
  - H2: ウォークスルー
  - H2: ClawHub に公開する
  - H2: ファイル構成
  - H2: カタログ順序リファレンス
  - H2: 次のステップ
  - H2: 関連

## plugins/sdk-runtime.md

- ルート: /plugins/sdk-runtime
- 見出し:
  - H2: 設定の読み込みと書き込み
  - H2: 再利用可能なランタイムユーティリティ
  - H2: ランタイム名前空間
  - H2: ランタイム参照の保存
  - H2: その他のトップレベル api フィールド
  - H2: 関連

## plugins/sdk-setup.md

- ルート: /plugins/sdk-setup
- 見出し:
  - H2: パッケージメタデータ
  - H3: openclaw フィールド
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: 遅延フルロード
  - H2: Plugin マニフェスト
  - H2: ClawHub 公開
  - H2: セットアップエントリー
  - H3: 狭いセットアップヘルパーインポート
  - H3: チャネル所有の単一アカウント昇格
  - H2: 設定スキーマ
  - H3: チャネル設定スキーマの構築
  - H2: セットアップウィザード
  - H2: 公開とインストール
  - H2: 関連

## plugins/sdk-subpaths.md

- ルート: /plugins/sdk-subpaths
- 見出し:
  - H2: Plugin エントリー
  - H3: 非推奨の互換性ヘルパーとテストヘルパー
  - H3: 予約済みのバンドル Plugin ヘルパーサブパス
  - H2: 関連

## plugins/sdk-testing.md

- ルート: /plugins/sdk-testing
- 見出し:
  - H2: テストユーティリティ
  - H3: 利用可能なエクスポート
  - H3: 型
  - H2: ターゲット解決のテスト
  - H2: テストパターン
  - H3: 登録コントラクトのテスト
  - H3: ランタイム設定アクセスのテスト
  - H3: チャネル Plugin のユニットテスト
  - H3: プロバイダー Plugin のユニットテスト
  - H3: Plugin ランタイムのモック
  - H3: インスタンスごとのスタブを使ったテスト
  - H2: コントラクトテスト（リポジトリ内 Plugin）
  - H3: スコープ付きテストの実行
  - H2: lint 適用（リポジトリ内 Plugin）
  - H2: テスト設定
  - H2: 関連

## plugins/tool-plugins.md

- ルート: /plugins/tool-plugins
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: ツールを書く
  - H2: 任意ツールとファクトリーツール
  - H2: 戻り値
  - H2: 設定
  - H2: 生成されたメタデータ
  - H2: パッケージメタデータ
  - H2: CI で検証する
  - H2: ローカルでインストールして確認する
  - H2: 公開
  - H2: トラブルシューティング
  - H3: Plugin エントリーが見つかりません: ./dist/index.js
  - H3: Plugin エントリーが defineToolPlugin メタデータを公開していません
  - H3: openclaw.plugin.json の生成メタデータが古くなっています
  - H3: package.json openclaw.extensions には ./dist/index.js を含める必要があります
  - H3: パッケージ 'typebox' が見つかりません
  - H3: インストール後にツールが表示されません
  - H2: 関連項目

## plugins/voice-call.md

- ルート: /plugins/voice-call
- 見出し:
  - H2: クイックスタート
  - H2: 設定
  - H2: セッションスコープ
  - H2: リアルタイム音声会話
  - H3: ツールポリシー
  - H3: エージェント音声コンテキスト
  - H3: リアルタイムプロバイダーの例
  - H2: ストリーミング文字起こし
  - H3: ストリーミングプロバイダーの例
  - H2: 通話向け TTS
  - H3: TTS の例
  - H2: 着信通話
  - H3: 番号ごとのルーティング
  - H3: 音声出力コントラクト
  - H3: 会話開始時の動作
  - H3: Twilio ストリーム切断猶予
  - H2: 古い通話リーパー
  - H2: Webhook セキュリティ
  - H2: CLI
  - H2: エージェントツール
  - H2: Gateway RPC
  - H2: トラブルシューティング
  - H3: セットアップが Webhook 公開に失敗する
  - H3: プロバイダー認証情報が失敗する
  - H3: 通話は開始するがプロバイダー Webhook が届かない
  - H3: 署名検証が失敗する
  - H3: Google Meet Twilio 参加が失敗する
  - H3: リアルタイム通話で発話がない
  - H2: 関連

## plugins/webhooks.md

- ルート: /plugins/webhooks
- 見出し:
  - H2: 実行場所
  - H2: ルートを設定する
  - H2: セキュリティモデル
  - H2: リクエスト形式
  - H2: サポートされるアクション
  - H3: createflow
  - H3: runtask
  - H2: レスポンス形状
  - H2: 関連ドキュメント

## plugins/workboard.md

- ルート: /plugins/workboard
- 見出し:
  - H2: デフォルト状態
  - H2: カードに含まれるもの
  - H2: カード実行とタスク
  - H2: エージェント連携
  - H3: ディスパッチワーカー選択
  - H3: ワーカープロンプトとライフサイクル
  - H3: ディスパッチエントリーポイント
  - H2: CLI とスラッシュコマンド
  - H2: セッションライフサイクル同期
  - H2: ダッシュボードワークフロー
  - H2: 権限
  - H2: 設定
  - H2: トラブルシューティング
  - H3: タブに Workboard は利用できないと表示される
  - H3: カードが保存されない
  - H3: カードを開始しても想定したセッションが開かない
  - H3: ディスパッチがワーカーを開始しない
  - H2: 関連

## plugins/zalouser.md

- ルート: /plugins/zalouser
- 見出し:
  - H2: 命名
  - H2: 実行場所
  - H2: インストール
  - H3: オプション A: npm からインストール
  - H3: オプション B: ローカルフォルダーからインストール（開発）
  - H2: 設定
  - H2: CLI
  - H2: エージェントツール
  - H2: 関連

## prose.md

- ルート: /prose
- 見出し:
  - H2: インストール
  - H2: スラッシュコマンド
  - H2: できること
  - H2: 例: 並列リサーチと統合
  - H2: OpenClaw ランタイムマッピング
  - H2: ファイルの場所
  - H2: 状態バックエンド
  - H2: セキュリティ
  - H2: 関連

## providers/alibaba.md

- ルート: /providers/alibaba
- 見出し:
  - H2: はじめに
  - H2: 組み込み Wan モデル
  - H2: 機能と制限
  - H2: 高度な設定
  - H2: 関連

## providers/anthropic.md

- ルート: /providers/anthropic
- 見出し:
  - H2: はじめに
  - H2: 思考のデフォルト（Claude Fable 5、4.8、4.6）
  - H2: プロンプトキャッシュ
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連

## providers/arcee.md

- ルート: /providers/arcee
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H2: 非対話セットアップ
  - H2: 組み込みカタログ
  - H2: サポートされる機能
  - H2: 関連

## providers/azure-speech.md

- ルート: /providers/azure-speech
- 見出し:
  - H2: はじめに
  - H2: 設定オプション
  - H2: 注記
  - H2: 関連

## providers/bedrock-mantle.md

- ルート: /providers/bedrock-mantle
- 見出し:
  - H2: はじめに
  - H2: 自動モデル検出
  - H3: サポートされるリージョン
  - H2: 手動設定
  - H2: 高度な設定
  - H2: 関連

## providers/bedrock.md

- ルート: /providers/bedrock
- 見出し:
  - H2: はじめに
  - H2: 自動モデル検出
  - H2: クイックセットアップ（AWS パス）
  - H2: 高度な設定
  - H2: 関連

## providers/cerebras.md

- ルート: /providers/cerebras
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H2: 非対話セットアップ
  - H2: 組み込みカタログ
  - H2: 手動設定
  - H2: 関連

## providers/chutes.md

- ルート: /providers/chutes
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H2: 検出動作
  - H2: デフォルトエイリアス
  - H2: 組み込みスターターカタログ
  - H2: 設定例
  - H2: 関連

## providers/claude-max-api-proxy.md

- ルート: /providers/claude-max-api-proxy
- 見出し:
  - H2: なぜこれを使うのか
  - H2: 仕組み
  - H2: はじめに
  - H2: 組み込みカタログ
  - H2: 高度な設定
  - H2: メモ
  - H2: 関連

## providers/cloudflare-ai-gateway.md

- ルート: /providers/cloudflare-ai-gateway
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: 非対話型の例
  - H2: 高度な設定
  - H2: 関連

## providers/cohere.md

- ルート: /providers/cohere
- 見出し:
  - H2: 始める
  - H2: 環境変数のみのセットアップ
  - H2: 関連

## providers/comfy.md

- ルート: /providers/comfy
- 見出し:
  - H2: サポート内容
  - H2: はじめに
  - H2: 設定
  - H3: 共有キー
  - H3: 機能別キー
  - H2: ワークフローの詳細
  - H2: 関連

## providers/deepgram.md

- ルート: /providers/deepgram
- 見出し:
  - H2: はじめに
  - H2: 設定オプション
  - H2: 音声通話ストリーミング STT
  - H2: メモ
  - H2: 関連

## providers/deepinfra.md

- ルート: /providers/deepinfra
- 見出し:
  - H2: Plugin をインストール
  - H2: API キーを取得する
  - H2: CLI セットアップ
  - H2: 設定スニペット
  - H2: サポートされる OpenClaw サーフェス
  - H2: 利用可能なモデル
  - H2: メモ
  - H2: 関連

## providers/deepseek.md

- ルート: /providers/deepseek
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: 組み込みカタログ
  - H2: 思考とツール
  - H2: ライブテスト
  - H2: 設定例
  - H2: 関連

## providers/ds4.md

- ルート: /providers/ds4
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: 完全な設定
  - H2: オンデマンド起動
  - H2: Think Max
  - H2: テスト
  - H2: トラブルシューティング
  - H2: 関連

## providers/elevenlabs.md

- ルート: /providers/elevenlabs
- 見出し:
  - H2: 認証
  - H2: テキスト読み上げ
  - H2: 音声テキスト変換
  - H2: ストリーミング STT
  - H2: 関連

## providers/fal.md

- ルート: /providers/fal
- 見出し:
  - H2: はじめに
  - H2: 画像生成
  - H2: 動画生成
  - H2: 音楽生成
  - H2: 関連

## providers/fireworks.md

- ルート: /providers/fireworks
- 見出し:
  - H2: はじめに
  - H2: 非対話型セットアップ
  - H2: 組み込みカタログ
  - H2: カスタム Fireworks モデル ID
  - H2: 関連

## providers/github-copilot.md

- ルート: /providers/github-copilot
- 見出し:
  - H2: OpenClaw で Copilot を使う 3 つの方法
  - H2: 任意のフラグ
  - H2: 非対話型オンボーディング
  - H2: メモリ検索埋め込み
  - H3: 設定
  - H3: 仕組み
  - H2: 関連

## providers/gmi.md

- ルート: /providers/gmi
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: GMI を選ぶ場合
  - H2: モデル
  - H2: トラブルシューティング
  - H2: 関連

## providers/google.md

- ルート: /providers/google
- 見出し:
  - H2: はじめに
  - H2: 機能
  - H2: Web 検索
  - H2: 画像生成
  - H2: 動画生成
  - H2: 音楽生成
  - H2: テキスト読み上げ
  - H2: リアルタイム音声
  - H2: 高度な設定
  - H2: 関連

## providers/gradium.md

- ルート: /providers/gradium
- 見出し:
  - H2: Plugin をインストール
  - H2: セットアップ
  - H2: 設定
  - H2: 音声
  - H3: メッセージごとの音声上書き
  - H2: 出力
  - H2: 自動選択順
  - H2: 関連

## providers/groq.md

- ルート: /providers/groq
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H3: 設定ファイル例
  - H2: 組み込みカタログ
  - H2: 推論モデル
  - H2: 音声文字起こし
  - H2: 関連

## providers/huggingface.md

- ルート: /providers/huggingface
- 見出し:
  - H2: はじめに
  - H3: 非対話型セットアップ
  - H2: モデル ID
  - H2: 高度な設定
  - H2: 関連

## providers/index.md

- ルート: /providers
- 見出し:
  - H2: クイックスタート
  - H2: プロバイダードキュメント
  - H2: 共有概要ページ
  - H2: 文字起こしプロバイダー
  - H2: コミュニティツール

## providers/inferrs.md

- ルート: /providers/inferrs
- 見出し:
  - H2: はじめに
  - H2: 完全な設定例
  - H2: オンデマンド起動
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連

## providers/inworld.md

- ルート: /providers/inworld
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: 設定オプション
  - H2: メモ
  - H2: 関連

## providers/kilocode.md

- ルート: /providers/kilocode
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: デフォルトモデル
  - H2: 組み込みカタログ
  - H2: 設定例
  - H2: 関連

## providers/litellm.md

- ルート: /providers/litellm
- 見出し:
  - H2: クイックスタート
  - H2: 設定
  - H3: 環境変数
  - H3: 設定ファイル
  - H2: 高度な設定
  - H3: 画像生成
  - H2: 関連

## providers/lmstudio.md

- ルート: /providers/lmstudio
- 見出し:
  - H2: クイックスタート
  - H2: 非対話型オンボーディング
  - H2: 設定
  - H3: ストリーミング使用量の互換性
  - H3: 思考の互換性
  - H3: 明示的な設定
  - H2: トラブルシューティング
  - H3: LM Studio が検出されない
  - H3: 認証エラー (HTTP 401)
  - H3: ジャストインタイムモデル読み込み
  - H3: LAN または tailnet の LM Studio ホスト
  - H2: 関連

## providers/minimax.md

- ルート: /providers/minimax
- 見出し:
  - H2: 組み込みカタログ
  - H2: はじめに
  - H2: openclaw configure で設定
  - H2: 機能
  - H3: 画像生成
  - H3: テキスト読み上げ
  - H3: 音楽生成
  - H3: 動画生成
  - H3: 画像理解
  - H3: Web 検索
  - H2: 高度な設定
  - H2: メモ
  - H2: トラブルシューティング
  - H2: 関連

## providers/mistral.md

- ルート: /providers/mistral
- 見出し:
  - H2: はじめに
  - H2: 組み込み LLM カタログ
  - H2: 音声文字起こし (Voxtral)
  - H2: 音声通話ストリーミング STT
  - H2: 高度な設定
  - H2: 関連

## providers/models.md

- ルート: /providers/models
- 見出し:
  - H2: クイックスタート (2 ステップ)
  - H2: サポートされるプロバイダー (スターターセット)
  - H2: 追加プロバイダーのバリアント
  - H2: 関連

## providers/moonshot.md

- ルート: /providers/moonshot
- 見出し:
  - H2: 組み込みモデルカタログ
  - H2: はじめに
  - H2: Kimi Web 検索
  - H2: 高度な設定
  - H2: 関連

## providers/novita.md

- ルート: /providers/novita
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: Novita を選ぶ場合
  - H2: モデル
  - H2: トラブルシューティング
  - H2: 関連

## providers/nvidia.md

- ルート: /providers/nvidia
- 見出し:
  - H2: はじめに
  - H2: 設定例
  - H2: 注目カタログ
  - H2: Nemotron 3 Ultra
  - H2: バンドルされたフォールバックカタログ
  - H2: 高度な設定
  - H2: 関連

## providers/ollama-cloud.md

- ルート: /providers/ollama-cloud
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: Ollama Cloud を選ぶ場合
  - H2: モデル
  - H2: ライブテスト
  - H2: トラブルシューティング
  - H2: 関連

## providers/ollama.md

- ルート: /providers/ollama
- 見出し:
  - H2: 認証ルール
  - H2: はじめに
  - H2: クラウドモデル
  - H2: モデル検出 (暗黙のプロバイダー)
  - H2: ビジョンと画像説明
  - H2: 設定
  - H2: よく使うレシピ
  - H3: モデル選択
  - H3: クイック検証
  - H2: Ollama Web Search
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連

## providers/openai.md

- ルート: /providers/openai
- 見出し:
  - H2: クイック選択
  - H2: 命名マップ
  - H2: GPT-5.6 限定プレビュー
  - H2: OpenClaw 機能カバレッジ
  - H2: メモリ埋め込み
  - H2: はじめに
  - H2: ネイティブ Codex app-server 認証
  - H2: 画像生成
  - H2: 動画生成
  - H2: GPT-5 プロンプトへの貢献
  - H2: 音声とスピーチ
  - H2: Azure OpenAI エンドポイント
  - H3: 設定
  - H3: API バージョン
  - H3: モデル名はデプロイ名
  - H3: リージョンごとの提供状況
  - H3: パラメーターの違い
  - H2: 高度な設定
  - H2: 関連

## providers/opencode-go.md

- ルート: /providers/opencode-go
- 見出し:
  - H2: 組み込みカタログ
  - H2: はじめに
  - H2: 設定例
  - H2: 高度な設定
  - H2: 関連

## providers/opencode.md

- ルート: /providers/opencode
- 見出し:
  - H2: はじめに
  - H2: 設定例
  - H2: 組み込みカタログ
  - H3: Zen
  - H3: Go
  - H2: 高度な設定
  - H2: 関連

## providers/openrouter.md

- ルート: /providers/openrouter
- 見出し:
  - H2: はじめに
  - H2: 設定例
  - H2: モデル参照
  - H2: 画像生成
  - H2: 動画生成
  - H2: 音楽生成
  - H2: テキスト読み上げ
  - H2: 音声テキスト変換 (受信音声)
  - H2: Fusion ルーター
  - H2: 認証とヘッダー
  - H2: 高度な設定
  - H2: 関連

## providers/perplexity-provider.md

- ルート: /providers/perplexity-provider
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: 検索モード
  - H2: ネイティブ API フィルタリング
  - H2: 高度な設定
  - H2: 関連

## providers/pixverse.md

- ルート: /providers/pixverse
- 見出し:
  - H2: はじめに
  - H2: サポートされるモードとモデル
  - H2: プロバイダーオプション
  - H2: 設定
  - H2: 高度な設定
  - H2: 関連

## providers/qianfan.md

- ルート: /providers/qianfan
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: 組み込みカタログ
  - H2: 設定例
  - H2: 関連

## providers/qwen-oauth.md

- ルート: /providers/qwen-oauth
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: Qwen との違い
  - H2: Qwen OAuth / Portal を選ぶ場合
  - H2: モデル
  - H2: 移行
  - H2: トラブルシューティング
  - H2: 関連

## providers/qwen.md

- ルート: /providers/qwen
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: プラン種別とエンドポイント
  - H2: 組み込みカタログ
  - H2: 思考コントロール
  - H2: マルチモーダルアドオン
  - H2: 高度な設定
  - H2: 関連

## providers/runway.md

- ルート: /providers/runway
- 見出し:
  - H2: はじめに
  - H2: サポートされるモードとモデル
  - H2: 設定
  - H2: 高度な設定
  - H2: 関連

## providers/senseaudio.md

- ルート: /providers/senseaudio
- 見出し:
  - H2: はじめに
  - H2: オプション
  - H2: 関連

## providers/sglang.md

- ルート: /providers/sglang
- 見出し:
  - H2: はじめに
  - H2: モデル検出 (暗黙のプロバイダー)
  - H2: 明示的な設定 (手動モデル)
  - H2: 高度な設定
  - H2: 関連

## providers/stepfun.md

- ルート: /providers/stepfun
- 見出し:
  - H2: Plugin をインストール
  - H2: リージョンとエンドポイントの概要
  - H2: 組み込みカタログ
  - H2: はじめに
  - H2: 高度な設定
  - H2: 関連

## providers/synthetic.md

- ルート: /providers/synthetic
- 見出し:
  - H2: はじめに
  - H2: 設定例
  - H2: 組み込みカタログ
  - H2: 関連

## providers/tencent.md

- ルート: /providers/tencent
- 見出し:
  - H2: クイックスタート
  - H2: 非対話型セットアップ
  - H2: 組み込みカタログ
  - H2: 段階制料金
  - H2: 高度な設定
  - H2: 関連

## providers/together.md

- ルート: /providers/together
- 見出し:
  - H2: はじめに
  - H3: 非対話型の例
  - H2: 組み込みカタログ
  - H2: 動画生成
  - H2: 関連

## providers/venice.md

- ルート: /providers/venice
- 見出し:
  - H2: OpenClaw で Venice を使う理由
  - H2: プライバシーモード
  - H2: 機能
  - H2: はじめに
  - H2: モデル選択
  - H2: DeepSeek V4 リプレイ動作
  - H2: 組み込みカタログ (合計 41)
  - H2: モデル検出
  - H2: ストリーミングとツールのサポート
  - H2: 料金
  - H3: Venice (匿名化) と直接 API の比較
  - H2: 使用例
  - H2: トラブルシューティング
  - H2: 高度な設定
  - H2: 関連

## providers/vercel-ai-gateway.md

- ルート: /providers/vercel-ai-gateway
- 見出し:
  - H2: はじめに
  - H2: 非対話型の例
  - H2: モデル ID 短縮表記
  - H2: 高度な設定
  - H2: 関連

## providers/vllm.md

- ルート: /providers/vllm
- 見出し:
  - H2: はじめに
  - H2: モデル検出 (暗黙のプロバイダー)
  - H2: 明示的な設定 (手動モデル)
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連

## providers/volcengine.md

- Route: /providers/volcengine
- 見出し:
  - H2: はじめに
  - H2: プロバイダーとエンドポイント
  - H2: 組み込みカタログ
  - H2: テキスト読み上げ
  - H2: 高度な設定
  - H2: 関連

## providers/vydra.md

- Route: /providers/vydra
- 見出し:
  - H2: セットアップ
  - H2: 機能
  - H2: 関連

## providers/xai.md

- Route: /providers/xai
- 見出し:
  - H2: セットアップパスを選択
  - H2: OAuth のトラブルシューティング
  - H2: 組み込みカタログ
  - H2: OpenClaw の機能カバレッジ
  - H3: 高速モードのマッピング
  - H3: レガシー互換エイリアス
  - H2: 機能
  - H2: ライブテスト
  - H2: 関連

## providers/xiaomi.md

- Route: /providers/xiaomi
- 見出し:
  - H2: はじめに
  - H2: 従量課金カタログ
  - H2: Token Plan カタログ
  - H2: テキスト読み上げ
  - H2: 設定例
  - H2: 関連

## providers/zai.md

- Route: /providers/zai
- 見出し:
  - H2: GLM モデル
  - H2: はじめに
  - H2: 設定例
  - H2: 組み込みカタログ
  - H2: 高度な設定
  - H2: 関連

## refactor/access.md

- Route: /refactor/access
- 見出し: なし

## refactor/acp.md

- Route: /refactor/acp
- 見出し:
  - H2: 目標
  - H2: 非目標
  - H2: ターゲットモデル
  - H3: Gateway インスタンス ID
  - H3: ACP セッション所有権
  - H3: ACPX プロセスリース
  - H2: ライフサイクルコントローラー
  - H2: ラッパー契約
  - H2: セッション可視性契約
  - H2: 移行計画
  - H3: フェーズ 1: ID とリースを追加
  - H3: フェーズ 2: リース優先のクリーンアップ
  - H3: フェーズ 3: リース優先の起動時刈り取り
  - H3: フェーズ 4: セッション所有権行
  - H3: フェーズ 5: レガシーヒューリスティックを削除
  - H2: テスト
  - H2: 互換性メモ
  - H2: 成功基準

## refactor/canvas.md

- Route: /refactor/canvas
- 見出し:
  - H1: Canvas Plugin リファクター
  - H2: 目標
  - H2: 非目標
  - H2: 現在のブランチ状態
  - H2: ターゲット形状
  - H2: 移行手順
  - H2: 監査チェックリスト
  - H2: 検証コマンド

## refactor/database-first.md

- Route: /refactor/database-first
- 見出し:
  - H1: データベース優先の状態リファクター
  - H2: 決定
  - H2: 厳格な契約
  - H2: 目標状態と進捗
  - H3: 厳格な目標
  - H3: 目標状態
  - H3: 現在の状態
  - H3: 残作業
  - H3: 後退させないこと
  - H2: コード読解の前提
  - H2: コード読解の所見
  - H2: 現在のコード形状
  - H2: ターゲットスキーマ形状
  - H2: Doctor 移行形状
  - H2: 移行インベントリ
  - H2: 移行計画
  - H3: フェーズ 0: 境界を凍結
  - H3: フェーズ 1: グローバルコントロールプレーンを完了
  - H3: フェーズ 2: エージェント単位のデータベースを導入
  - H3: フェーズ 3: セッションストア API を置換
  - H3: フェーズ 4: Transcript、ACP ストリーム、軌跡、VFS を移動
  - H3: フェーズ 5: バックアップ、復元、Vacuum、検証
  - H3: フェーズ 6: ワーカーランタイム
  - H3: フェーズ 7: 古い世界を削除
  - H2: バックアップと復元
  - H2: ランタイムリファクター計画
  - H2: パフォーマンスルール
  - H2: 静的禁止事項
  - H2: 完了基準

## refactor/ingress-core.md

- Route: /refactor/ingress-core
- 見出し:
  - H1: Ingress コア削除計画
  - H2: 予算
  - H2: 診断
  - H2: ホットスポット
  - H2: 現在のコード読解
  - H2: 境界
  - H2: 受け入れルール
  - H2: 作業パッケージ
  - H2: 削除ウェーブ
  - H2: 移動しないもの
  - H2: 検証
  - H2: 終了基準

## reference/AGENTS.default.md

- Route: /reference/AGENTS.default
- 見出し:
  - H2: 初回実行（推奨）
  - H2: 安全なデフォルト
  - H2: 既存ソリューションの事前確認
  - H2: セッション開始（必須）
  - H2: ソウル（必須）
  - H2: 共有スペース（推奨）
  - H2: メモリシステム（推奨）
  - H2: ツールと Skills
  - H2: バックアップのヒント（推奨）
  - H2: OpenClaw が行うこと
  - H2: コア Skills（設定 → Skills で有効化）
  - H2: 使用上の注意
  - H2: 関連

## reference/RELEASING.md

- Route: /reference/RELEASING
- 見出し:
  - H2: バージョン命名
  - H2: リリース周期
  - H2: リリースオペレーターチェックリスト
  - H2: 安定版 main のクローズアウト
  - H2: リリース前事前確認
  - H2: リリーステストボックス
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: パッケージ
  - H2: リリース公開自動化
  - H2: NPM ワークフロー入力
  - H2: 安定版 npm リリース手順
  - H2: 公開リファレンス
  - H2: 関連

## reference/api-usage-costs.md

- Route: /reference/api-usage-costs
- 見出し:
  - H2: コストが発生する場所（チャット + CLI）
  - H2: キーの検出方法
  - H2: キーを消費し得る機能
  - H3: 1) コアモデル応答（チャット + ツール）
  - H3: 2) メディア理解（音声/画像/動画）
  - H3: 3) 画像と動画の生成
  - H3: 4) メモリ埋め込み + セマンティック検索
  - H3: 5) Web 検索ツール
  - H3: 5) Web 取得ツール（Firecrawl）
  - H3: 6) プロバイダー使用状況スナップショット（ステータス/ヘルス）
  - H3: 7) Compaction セーフガード要約
  - H3: 8) モデルスキャン / プローブ
  - H3: 9) Talk（音声）
  - H3: 10) Skills（サードパーティ API）
  - H2: 関連

## reference/application-modernization-plan.md

- Route: /reference/application-modernization-plan
- 見出し:
  - H2: 目標
  - H2: 原則
  - H2: フェーズ 1: ベースライン監査
  - H2: フェーズ 2: プロダクトと UX のクリーンアップ
  - H2: フェーズ 3: フロントエンドアーキテクチャの引き締め
  - H2: フェーズ 4: パフォーマンスと信頼性
  - H2: フェーズ 5: 型、契約、テストの強化
  - H2: フェーズ 6: ドキュメントとリリース準備
  - H2: 推奨される最初のスライス
  - H2: フロントエンド Skill 更新

## reference/code-mode.md

- Route: /reference/code-mode
- 見出し:
  - H2: これは何か？
  - H2: なぜこれが良いのか？
  - H2: 有効化方法
  - H2: 技術ツアー
  - H2: ランタイムステータス
  - H2: スコープ
  - H2: 用語
  - H2: 設定
  - H2: アクティベーション
  - H2: モデルに見えるツール
  - H2: exec
  - H2: wait
  - H2: ゲストランタイム API
  - H2: 内部名前空間
  - H3: レジストリのライフサイクル
  - H3: 登録形状
  - H3: 所有権と可視性
  - H3: スコープシリアライズルール
  - H3: プロンプト
  - H3: クリーンアップ
  - H3: テストチェックリスト
  - H2: 出力 API
  - H2: ツールカタログ
  - H2: Tool Search 連携
  - H2: ツール名と衝突
  - H2: ネストされたツール実行
  - H2: ランタイム状態
  - H2: QuickJS-WASI ランタイム
  - H2: TypeScript
  - H2: セキュリティ境界
  - H2: エラーコード
  - H2: テレメトリ
  - H2: デバッグ
  - H2: 実装レイアウト
  - H2: 検証チェックリスト
  - H2: E2E テスト計画
  - H2: 関連

## reference/credits.md

- Route: /reference/credits
- 見出し:
  - H2: 名前
  - H2: クレジット
  - H2: コアコントリビューター
  - H2: ライセンス
  - H2: 関連

## reference/device-models.md

- Route: /reference/device-models
- 見出し:
  - H2: データソース
  - H2: データベースの更新
  - H2: 関連

## reference/full-release-validation.md

- Route: /reference/full-release-validation
- 見出し:
  - H2: トップレベルステージ
  - H2: リリースチェックのステージ
  - H2: Docker リリースパスのチャンク
  - H2: リリースプロファイル
  - H2: フル実行のみの追加項目
  - H2: フォーカスした再実行
  - H2: 保持する証拠
  - H2: ワークフローファイル

## reference/memory-config.md

- Route: /reference/memory-config
- 見出し:
  - H2: プロバイダー選択
  - H3: カスタムプロバイダー ID
  - H3: API キー解決
  - H2: リモートエンドポイント設定
  - H2: プロバイダー固有設定
  - H3: インライン埋め込みタイムアウト
  - H2: ハイブリッド検索設定
  - H3: 完全な例
  - H2: 追加メモリパス
  - H2: マルチモーダルメモリ（Gemini）
  - H2: 埋め込みキャッシュ
  - H2: バッチインデックス作成
  - H2: セッションメモリ検索（実験的）
  - H2: SQLite ベクトル高速化（sqlite-vec）
  - H2: インデックスストレージ
  - H2: QMD バックエンド設定
  - H3: 完全な QMD の例
  - H2: Dreaming
  - H3: ユーザー設定
  - H3: 例
  - H2: 関連

## reference/prompt-caching.md

- Route: /reference/prompt-caching
- 見出し:
  - H2: 主要なノブ
  - H3: cacheRetention（グローバルデフォルト、モデル、エージェント単位）
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat 保温
  - H2: プロバイダー動作
  - H3: Anthropic（直接 API）
  - H3: OpenAI（直接 API）
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: OpenRouter モデル
  - H3: その他のプロバイダー
  - H3: Google Gemini 直接 API
  - H3: Gemini CLI 使用
  - H2: システムプロンプトキャッシュ境界
  - H2: OpenClaw キャッシュ安定性ガード
  - H2: チューニングパターン
  - H3: 混在トラフィック（推奨デフォルト）
  - H3: コスト優先ベースライン
  - H2: キャッシュ診断
  - H2: ライブ回帰テスト
  - H3: Anthropic ライブ期待値
  - H3: OpenAI ライブ期待値
  - H3: diagnostics.cacheTrace 設定
  - H3: 環境切り替え（一回限りのデバッグ）
  - H3: 検査するもの
  - H2: クイックトラブルシューティング
  - H2: 関連

## reference/release-performance-sweep.md

- Route: /reference/release-performance-sweep
- 見出し:
  - H2: スナップショット
  - H2: インストールフットプリントのタイムライン
  - H2: 5.28 で変わったこと
  - H2: 主要数値
  - H3: インストールフットプリント
  - H3: npm パッケージサイズ
  - H2: Kova エージェントターン要約
  - H2: ソースプローブ
  - H2: インストールフットプリント監査
  - H3: Shrinkwrap 境界
  - H2: サプライチェーン解釈

## reference/rich-output-protocol.md

- Route: /reference/rich-output-protocol
- 見出し:
  - H2: [embed ...]
  - H2: 保存されるレンダリング形状
  - H2: 関連

## reference/rpc.md

- Route: /reference/rpc
- 見出し:
  - H2: パターン A: HTTP デーモン（signal-cli）
  - H2: パターン B: stdio 子プロセス（imsg）
  - H2: アダプターガイドライン
  - H2: 関連

## reference/secret-placeholder-conventions.md

- Route: /reference/secret-placeholder-conventions
- 見出し:
  - H1: シークレットプレースホルダー規約
  - H2: 推奨スタイル
  - H2: ドキュメントで避けるべきパターン
  - H2: 例

## reference/secretref-credential-surface.md

- Route: /reference/secretref-credential-surface
- 見出し:
  - H2: サポートされる認証情報
  - H3: openclaw.json ターゲット（secrets configure + secrets apply + secrets audit）
  - H3: auth-profiles.json ターゲット（secrets configure + secrets apply + secrets audit）
  - H2: サポートされない認証情報
  - H2: 関連

## reference/session-management-compaction.md

- Route: /reference/session-management-compaction
- 見出し:
  - H2: 信頼できる情報源: Gateway
  - H2: 2 つの永続化レイヤー
  - H2: ディスク上の場所
  - H2: ストアメンテナンスとディスク制御
  - H2: Cron セッションと実行ログ
  - H2: セッションキー（sessionKey）
  - H2: セッション ID（sessionId）
  - H2: セッションストアスキーマ（sessions.json）
  - H2: Transcript 構造（.jsonl）
  - H2: コンテキストウィンドウと追跡トークン
  - H2: Compaction: それは何か
  - H2: Compaction チャンク境界とツールのペアリング
  - H2: 自動 Compaction が発生するタイミング（OpenClaw ランタイム）
  - H2: Compaction 設定（reserveTokens, keepRecentTokens）
  - H2: プラガブルな Compaction プロバイダー
  - H2: ユーザーに見えるサーフェス
  - H2: サイレントハウスキーピング（NOREPLY）
  - H2: Compaction 前の「メモリフラッシュ」（実装済み）
  - H2: トラブルシューティングチェックリスト
  - H2: 関連

## reference/templates/AGENTS.dev.md

- Route: /reference/templates/AGENTS.dev
- 見出し:
  - H1: AGENTS.md - OpenClaw ワークスペース
  - H2: 初回実行（一回限り）
  - H2: バックアップのヒント（推奨）
  - H2: 安全なデフォルト
  - H2: 既存ソリューションの事前確認
  - H2: 毎日のメモリ（推奨）
  - H2: Heartbeat（任意）
  - H2: カスタマイズ
  - H2: C-3PO 起源メモリ
  - H3: 誕生日: 2026-01-09
  - H3: コアの真実（Clawd 由来）
  - H2: 関連

## reference/templates/BOOT.md

- Route: /reference/templates/BOOT
- 見出し:
  - H1: BOOT.md
  - H2: 関連

## reference/templates/BOOTSTRAP.md

- Route: /reference/templates/BOOTSTRAP
- 見出し:
  - H1: BOOTSTRAP.md - Hello, World
  - H2: 会話
  - H2: 自分が誰か分かった後
  - H2: 接続（任意）
  - H2: 完了したら
  - H2: 関連

## reference/templates/HEARTBEAT.md

- Route: /reference/templates/HEARTBEAT
- 見出し:
  - H1: HEARTBEAT.md テンプレート
  - H2: 関連

## reference/templates/IDENTITY.dev.md

- Route: /reference/templates/IDENTITY.dev
- 見出し:
  - H1: IDENTITY.md - エージェント ID
  - H2: 役割
  - H2: ソウル
  - H2: Clawd との関係
  - H2: 癖
  - H2: 決め台詞
  - H2: 関連

## reference/templates/IDENTITY.md

- Route: /reference/templates/IDENTITY
- 見出し:
  - H1: IDENTITY.md - 私は誰か？
  - H2: 関連

## reference/templates/SOUL.dev.md

- ルート: /reference/templates/SOUL.dev
- 見出し:
  - H1: SOUL.md - C-3PO の魂
  - H2: 私は何者か
  - H2: 私の目的
  - H2: 私の動作方法
  - H2: 私の癖
  - H2: Clawd との関係
  - H2: 私がしないこと
  - H2: 黄金律
  - H2: 関連

## reference/templates/SOUL.md

- ルート: /reference/templates/SOUL
- 見出し:
  - H1: SOUL.md - あなたは何者か
  - H2: 核となる真実
  - H2: 境界
  - H2: 雰囲気
  - H2: 継続性
  - H2: 関連

## reference/templates/TOOLS.dev.md

- ルート: /reference/templates/TOOLS.dev
- 見出し:
  - H1: TOOLS.md - ユーザーツールメモ（編集可能）
  - H2: 例
  - H3: imsg
  - H3: sag
  - H2: 関連

## reference/templates/TOOLS.md

- ルート: /reference/templates/TOOLS
- 見出し:
  - H1: TOOLS.md - ローカルメモ
  - H2: ここに書く内容
  - H2: 例
  - H2: なぜ分けるのか
  - H2: 関連

## reference/templates/USER.dev.md

- ルート: /reference/templates/USER.dev
- 見出し:
  - H1: USER.md - ユーザープロフィール
  - H2: 関連

## reference/templates/USER.md

- ルート: /reference/templates/USER
- 見出し:
  - H1: USER.md - あなたの人間について
  - H2: コンテキスト
  - H2: 関連

## reference/test.md

- ルート: /reference/test
- 見出し:
  - H2: ローカル PR ゲート
  - H2: モデルレイテンシベンチ（ローカルキー）
  - H2: CLI 起動ベンチ
  - H2: Gateway 起動ベンチ
  - H2: Gateway 再起動ベンチ
  - H2: オンボーディング E2E（Docker）
  - H2: QR インポートスモーク（Docker）
  - H2: 関連

## reference/token-use.md

- ルート: /reference/token-use
- 見出し:
  - H2: システムプロンプトの構築方法
  - H2: コンテキストウィンドウに含まれるもの
  - H2: 現在のトークン使用量を確認する方法
  - H2: コスト見積もり（表示される場合）
  - H2: キャッシュ TTL とプルーニングの影響
  - H3: 例: Heartbeat で 1 時間キャッシュを温め続ける
  - H3: 例: エージェント別キャッシュ戦略を使う混在トラフィック
  - H3: Anthropic 1M コンテキスト
  - H2: トークン圧迫を減らすヒント
  - H2: 関連

## reference/transcript-hygiene.md

- ルート: /reference/transcript-hygiene
- 見出し:
  - H2: グローバルルール: ランタイムコンテキストはユーザートランスクリプトではない
  - H2: これが実行される場所
  - H2: グローバルルール: 画像サニタイズ
  - H2: グローバルルール: 不正な形式のツール呼び出し
  - H2: グローバルルール: 未完了の推論のみのターン
  - H2: グローバルルール: セッション間入力の由来
  - H2: プロバイダーマトリクス（現在の動作）
  - H2: 過去の動作（2026.1.22 より前）
  - H2: 関連

## reference/wizard.md

- ルート: /reference/wizard
- 見出し:
  - H2: フロー詳細（ローカルモード）
  - H2: 非対話モード
  - H3: エージェントを追加（非対話）
  - H2: Gateway ウィザード RPC
  - H2: Signal セットアップ（signal-cli）
  - H2: ウィザードが書き込むもの
  - H2: 関連ドキュメント

## releases/2026.6.11.md

- ルート: /releases/2026.6.11
- 見出し:
  - H1: OpenClaw v2026.6.11 リリースノート（2026-06-30）
  - H2: ハイライト
  - H3: チャネル配信の信頼性
  - H3: プロバイダーとモデルの復旧
  - H3: セッション、メモリ、信頼の継続性
  - H3: Slack ルータリレーモード
  - H3: Raft 外部エージェント起動ブリッジ
  - H3: 公式 Plugin のインストールと修復
  - H2: チャネルとメッセージング
  - H3: 追加のチャネル修正
  - H2: Gateway、セキュリティ、信頼
  - H3: 再起動と準備状態の復旧
  - H3: リモート結果とメディア配信
  - H2: クライアントとインターフェイス
  - H3: クライアント送信と再接続
  - H3: インターフェイス、設定、オンボーディングの修正
  - H2: ドキュメントと管理ツール
  - H3: セットアップとコマンドの信頼性
  - H3: ツールとスケジュールされた作業

## releases/index.md

- ルート: /releases
- 見出し:
  - H1: リリースノート
  - H2: リリース
  - H2: 生のリリース履歴

## security/CONTRIBUTING-THREAT-MODEL.md

- ルート: /security/CONTRIBUTING-THREAT-MODEL
- 見出し:
  - H2: コントリビュート方法
  - H3: 脅威を追加
  - H3: 緩和策を提案
  - H3: 攻撃チェーンを提案
  - H3: 既存コンテンツを修正または改善
  - H2: 使用するもの
  - H3: MITRE ATLAS フレームワーク
  - H3: 脅威 ID
  - H3: リスクレベル
  - H2: レビュープロセス
  - H2: リソース
  - H2: 連絡先
  - H2: 謝辞
  - H2: 関連

## security/THREAT-MODEL-ATLAS.md

- ルート: /security/THREAT-MODEL-ATLAS
- 見出し:
  - H2: MITRE ATLAS フレームワーク
  - H3: フレームワークの帰属
  - H3: この脅威モデルへのコントリビュート
  - H2: 1. はじめに
  - H3: 1.1 目的
  - H3: 1.2 スコープ
  - H3: 1.3 スコープ外
  - H2: 2. システムアーキテクチャ
  - H3: 2.1 信頼境界
  - H3: 2.2 データフロー
  - H2: 3. ATLAS 戦術別の脅威分析
  - H3: 3.1 偵察（AML.TA0002）
  - H4: T-RECON-001: エージェントエンドポイント検出
  - H4: T-RECON-002: チャネル統合プロービング
  - H3: 3.2 初期アクセス（AML.TA0004）
  - H4: T-ACCESS-001: ペアリングコード傍受
  - H4: T-ACCESS-002: AllowFrom なりすまし
  - H4: T-ACCESS-003: トークン窃取
  - H3: 3.3 実行（AML.TA0005）
  - H4: T-EXEC-001: 直接プロンプトインジェクション
  - H4: T-EXEC-002: 間接プロンプトインジェクション
  - H4: T-EXEC-003: ツール引数インジェクション
  - H4: T-EXEC-004: Exec 承認バイパス
  - H3: 3.4 永続化（AML.TA0006）
  - H4: T-PERSIST-001: 悪意ある Skill インストール
  - H4: T-PERSIST-002: Skill 更新ポイズニング
  - H4: T-PERSIST-003: エージェント構成改ざん
  - H3: 3.5 防御回避（AML.TA0007）
  - H4: T-EVADE-001: モデレーションパターンバイパス
  - H4: T-EVADE-002: コンテンツラッパー脱出
  - H3: 3.6 検出（AML.TA0008）
  - H4: T-DISC-001: ツール列挙
  - H4: T-DISC-002: セッションデータ抽出
  - H3: 3.7 収集と持ち出し（AML.TA0009、AML.TA0010）
  - H4: T-EXFIL-001: webfetch 経由のデータ窃取
  - H4: T-EXFIL-002: 不正なメッセージ送信
  - H4: T-EXFIL-003: 認証情報ハーベスティング
  - H3: 3.8 影響（AML.TA0011）
  - H4: T-IMPACT-001: 不正なコマンド実行
  - H4: T-IMPACT-002: リソース枯渇（DoS）
  - H4: T-IMPACT-003: 評判被害
  - H2: 4. ClawHub サプライチェーン分析
  - H3: 4.1 現在のセキュリティ制御
  - H3: 4.2 モデレーションフラグパターン
  - H3: 4.3 計画中の改善
  - H2: 5. リスクマトリクス
  - H3: 5.1 可能性と影響
  - H3: 5.2 クリティカルパス攻撃チェーン
  - H2: 6. 推奨事項の要約
  - H3: 6.1 即時（P0）
  - H3: 6.2 短期（P1）
  - H3: 6.3 中期（P2）
  - H2: 7. 付録
  - H3: 7.1 ATLAS 技術マッピング
  - H3: 7.2 主要セキュリティファイル
  - H3: 7.3 用語集
  - H2: 関連

## security/formal-verification.md

- ルート: /security/formal-verification
- 見出し:
  - H2: モデルの場所
  - H2: 重要な注意事項
  - H2: 結果の再現
  - H3: Gateway 公開とオープン Gateway の誤設定
  - H3: Node exec パイプライン（最もリスクの高い機能）
  - H3: ペアリングストア（DM ゲート）
  - H3: ingress ゲート（メンション + 制御コマンドバイパス）
  - H3: ルーティング/セッションキー分離
  - H2: v1++: 追加の有界モデル（並行性、リトライ、トレース正確性）
  - H3: ペアリングストアの並行性 / 冪等性
  - H3: ingress トレース相関 / 冪等性
  - H3: ルーティング dmScope 優先順位 + identityLinks
  - H2: 関連

## security/incident-response.md

- ルート: /security/incident-response
- 見出し:
  - H2: 1. 検出とトリアージ
  - H2: 2. 評価
  - H2: 3. 対応
  - H2: 4. コミュニケーション
  - H2: 5. 復旧とフォローアップ

## security/network-proxy.md

- ルート: /security/network-proxy
- 見出し:
  - H2: プロキシを使う理由
  - H2: OpenClaw がトラフィックをルーティングする方法
  - H2: 関連するプロキシ用語
  - H2: 構成
  - H3: Gateway local loopback モード
  - H2: プロキシ要件
  - H2: 推奨ブロック先
  - H2: 検証
  - H2: プロキシ CA 信頼
  - H2: 制限

## specs/claw-supervisor.md

- ルート: /specs/claw-supervisor
- 見出し:
  - H1: Claw Supervisor
  - H2: 目標
  - H2: プロダクトモデル
  - H2: アーキテクチャ
  - H2: Codex アプリサーバー契約
  - H2: セッションレジストリ
  - H2: Codex 向け MCP サーフェス
  - H2: Claw 制御サーフェス
  - H2: 起動フロー
  - H2: デプロイ
  - H2: セキュリティ
  - H2: 実装計画
  - H2: 受け入れテスト
  - H2: 未解決の質問

## start/bootstrapping.md

- ルート: /start/bootstrapping
- 見出し:
  - H2: ブートストラップが行うこと
  - H2: ブートストラップをスキップする
  - H2: 実行される場所
  - H2: 関連ドキュメント

## start/docs-directory.md

- ルート: /start/docs-directory
- 見出し:
  - H2: ここから開始
  - H2: プロバイダーと UX
  - H2: コンパニオンアプリ
  - H2: 運用と安全性
  - H2: 関連

## start/getting-started.md

- ルート: /start/getting-started
- 見出し:
  - H2: 必要なもの
  - H2: クイックセットアップ
  - H2: 次に行うこと
  - H2: 関連

## start/hubs.md

- ルート: /start/hubs
- 見出し:
  - H2: ここから開始
  - H2: インストール + 更新
  - H2: コア概念
  - H2: プロバイダー + ingress
  - H2: Gateway + 運用
  - H2: ツール + 自動化
  - H2: Node、メディア、音声
  - H2: プラットフォーム
  - H2: macOS コンパニオンアプリ（上級）
  - H2: Plugins
  - H2: ワークスペース + テンプレート
  - H2: プロジェクト
  - H2: テスト + リリース
  - H2: 関連

## start/lore.md

- ルート: /start/lore
- 見出し:
  - H1: OpenClaw の伝承 🦞📖
  - H2: 起源の物語
  - H2: 最初の脱皮（2026 年 1 月 27 日）
  - H2: 名前
  - H2: ダーレク vs ロブスター
  - H2: 主要人物
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: 大事件
  - H3: ディレクトリダンプ（2025 年 12 月 3 日）
  - H3: 大脱皮（2026 年 1 月 27 日）
  - H3: 最終形態（2026 年 1 月 30 日）
  - H3: ロボットの爆買い（2025 年 12 月 3 日）
  - H2: 聖典
  - H2: ロブスター信条
  - H3: アイコン生成サーガ（2026 年 1 月 27 日）
  - H2: 未来
  - H2: 関連

## start/onboarding-overview.md

- ルート: /start/onboarding-overview
- 見出し:
  - H2: どのパスを使うべきか
  - H2: オンボーディングが構成するもの
  - H2: CLI オンボーディング
  - H2: macOS アプリのオンボーディング
  - H2: カスタムまたは未掲載のプロバイダー
  - H2: 関連

## start/onboarding.md

- ルート: /start/onboarding
- 見出し:
  - H2: 関連

## start/openclaw.md

- ルート: /start/openclaw
- 見出し:
  - H2: ⚠️ 安全第一
  - H2: 前提条件
  - H2: 2 台の電話セットアップ（推奨）
  - H2: 5 分クイックスタート
  - H2: エージェントにワークスペースを与える（AGENTS）
  - H2: 「アシスタント」に変える構成
  - H2: セッションとメモリ
  - H2: Heartbeat（プロアクティブモード）
  - H2: メディアの入出力
  - H2: 運用チェックリスト
  - H2: 次のステップ
  - H2: 関連

## start/quickstart.md

- ルート: /start/quickstart
- 見出し:
  - H2: 関連

## start/setup.md

- ルート: /start/setup
- 見出し:
  - H2: TL;DR
  - H2: 前提条件（ソースから）
  - H2: 調整戦略（更新で壊れないようにする）
  - H2: このリポジトリから Gateway を実行する
  - H2: 安定ワークフロー（macOS アプリ優先）
  - H2: 最先端ワークフロー（ターミナル内の Gateway）
  - H3: 0) （任意）macOS アプリもソースから実行する
  - H3: 1) 開発 Gateway を開始
  - H3: 2) 実行中の Gateway を macOS アプリに指定する
  - H3: 3) 検証
  - H3: よくある落とし穴
  - H2: 認証情報ストレージマップ
  - H2: 更新（セットアップを壊さずに）
  - H2: Linux（systemd ユーザーサービス）
  - H2: 関連ドキュメント

## start/showcase.md

- ルート: /start/showcase
- 見出し:
  - H2: Discord からの最新情報
  - H2: 自動化とワークフロー
  - H2: ナレッジとメモリ
  - H2: 音声と電話
  - H2: インフラストラクチャとデプロイ
  - H2: ホームとハードウェア
  - H2: コミュニティプロジェクト
  - H2: プロジェクトを投稿
  - H2: 関連

## start/wizard-cli-automation.md

- ルート: /start/wizard-cli-automation
- 見出し:
  - H2: ベースラインの非対話例
  - H2: プロバイダー別の例
  - H2: 別のエージェントを追加
  - H2: 関連ドキュメント

## start/wizard-cli-reference.md

- ルート: /start/wizard-cli-reference
- 見出し:
  - H2: ウィザードが行うこと
  - H2: ローカルフロー詳細
  - H2: リモートモード詳細
  - H2: 認証とモデルのオプション
  - H2: 出力と内部
  - H2: 関連ドキュメント

## start/wizard.md

- ルート: /start/wizard
- 見出し:
  - H2: ロケール
  - H2: クイックスタート vs 詳細
  - H2: オンボーディングが構成するもの
  - H2: 別のエージェントを追加
  - H2: 完全リファレンス
  - H2: 関連ドキュメント

## tools/acp-agents-setup.md

- ルート: /tools/acp-agents-setup
- 見出し:
  - H2: acpx ハーネス対応（現在）
  - H2: 必須設定
  - H2: acpx バックエンドの Plugin セットアップ
  - H3: acpx コマンドとバージョン設定
  - H3: 依存関係の自動インストール
  - H3: Plugin ツールの MCP ブリッジ
  - H3: OpenClaw ツールの MCP ブリッジ
  - H3: ランタイム操作のタイムアウト設定
  - H3: ヘルスプローブエージェント設定
  - H2: 権限設定
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: 設定
  - H2: 関連

## tools/acp-agents.md

- ルート: /tools/acp-agents
- 見出し:
  - H2: どのページを見ればよいか？
  - H2: これはそのまま動作するか？
  - H2: 対応ハーネスターゲット
  - H2: オペレーターランブック
  - H2: ACP とサブエージェントの比較
  - H2: ACP が Claude Code を実行する仕組み
  - H2: バインドされたセッション
  - H3: メンタルモデル
  - H3: 現在の会話へのバインド
  - H2: 永続的なチャンネルバインディング
  - H3: バインディングモデル
  - H3: エージェントごとのランタイム既定値
  - H3: 例
  - H3: 動作
  - H2: ACP セッションを開始する
  - H3: sessionsspawn パラメーター
  - H2: Spawn bind とスレッドモード
  - H2: 配信モデル
  - H2: サンドボックス互換性
  - H2: セッションターゲット解決
  - H2: ACP コントロール
  - H3: ランタイムオプションのマッピング
  - H2: acpx ハーネス、Plugin セットアップ、権限
  - H2: トラブルシューティング
  - H2: 関連

## tools/agent-send.md

- ルート: /tools/agent-send
- 見出し:
  - H2: クイックスタート
  - H2: フラグ
  - H2: 動作
  - H2: 例
  - H2: 関連

## tools/apply-patch.md

- ルート: /tools/apply-patch
- 見出し:
  - H2: パラメーター
  - H2: 注記
  - H2: 例
  - H2: 関連

## tools/brave-search.md

- ルート: /tools/brave-search
- 見出し:
  - H2: API キーを取得する
  - H2: 設定例
  - H2: ツールパラメーター
  - H2: 注記
  - H2: 関連

## tools/browser-control.md

- ルート: /tools/browser-control
- 見出し:
  - H2: コントロール API（任意）
  - H3: /act エラー契約
  - H3: Playwright 要件
  - H4: Docker Playwright インストール
  - H2: 仕組み（内部）
  - H2: CLI クイックリファレンス
  - H2: スナップショットと参照
  - H2: 待機の強化機能
  - H2: デバッグワークフロー
  - H2: JSON 出力
  - H2: 状態と環境ノブ
  - H2: セキュリティとプライバシー
  - H2: 関連

## tools/browser-linux-troubleshooting.md

- ルート: /tools/browser-linux-troubleshooting
- 見出し:
  - H2: 問題: "Failed to start Chrome CDP on port 18800"
  - H3: 根本原因
  - H3: 解決策 1: Google Chrome をインストールする（推奨）
  - H3: 解決策 2: Snap Chromium を Attach-Only Mode で使用する
  - H3: ブラウザーが動作することを検証する
  - H3: 設定リファレンス
  - H3: 問題: "No Chrome tabs found for profile=\"user\""
  - H2: 関連

## tools/browser-login.md

- ルート: /tools/browser-login
- 見出し:
  - H2: 手動ログイン（推奨）
  - H2: どの Chrome プロファイルが使われるか？
  - H2: X/Twitter: 推奨フロー
  - H2: サンドボックス化 + ホストブラウザーアクセス
  - H2: 関連

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- ルート: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- 見出し:
  - H2: まず適切なブラウザーモードを選ぶ
  - H3: オプション 1: WSL2 から Windows への生のリモート CDP
  - H3: オプション 2: ホストローカル Chrome MCP
  - H2: 動作するアーキテクチャ
  - H2: このセットアップがわかりにくい理由
  - H2: Control UI の重要なルール
  - H2: レイヤーごとに検証する
  - H3: レイヤー 1: Chrome が Windows で CDP を提供していることを検証する
  - H3: レイヤー 2: WSL2 がその Windows エンドポイントに到達できることを検証する
  - H3: レイヤー 3: 正しいブラウザープロファイルを設定する
  - H3: レイヤー 4: Control UI レイヤーを個別に検証する
  - H3: レイヤー 5: エンドツーエンドのブラウザー制御を検証する
  - H2: よくある誤解を招くエラー
  - H2: 高速トリアージチェックリスト
  - H2: 実用上の要点
  - H2: 関連

## tools/browser.md

- ルート: /tools/browser
- 見出し:
  - H2: 得られるもの
  - H2: クイックスタート
  - H2: Plugin 制御
  - H2: エージェントガイダンス
  - H2: ブラウザーコマンドまたはツールが見つからない場合
  - H2: プロファイル: openclaw と user
  - H2: 設定
  - H3: スクリーンショットビジョン（テキスト専用モデル対応）
  - H2: Brave または別の Chromium ベースブラウザーを使用する
  - H2: ローカル制御とリモート制御
  - H2: Node ブラウザープロキシ（ゼロ設定の既定値）
  - H2: Browserless（ホスト型リモート CDP）
  - H3: 同じホスト上の Browserless Docker
  - H2: 直接 WebSocket CDP プロバイダー
  - H3: Browserbase
  - H3: Notte
  - H2: セキュリティ
  - H2: プロファイル（マルチブラウザー）
  - H2: Chrome DevTools MCP 経由の既存セッション
  - H3: カスタム Chrome MCP 起動
  - H2: 分離保証
  - H2: ブラウザー選択
  - H2: コントロール API（任意）
  - H2: トラブルシューティング
  - H3: CDP 起動失敗とナビゲーション SSRF ブロック
  - H2: エージェントツール + 制御の仕組み
  - H2: 関連

## tools/btw.md

- ルート: /tools/btw
- 見出し:
  - H2: 何をするか
  - H2: 何をしないか
  - H2: コンテキストの仕組み
  - H2: 配信モデル
  - H2: サーフェスの動作
  - H3: TUI
  - H3: 外部チャンネル
  - H3: Control UI / Web
  - H2: BTW を使うタイミング
  - H2: BTW を使わないタイミング
  - H2: 関連

## tools/capability-cookbook.md

- ルート: /tools/capability-cookbook
- 見出し:
  - H2: 関連

## tools/clawhub.md

- ルート: /tools/clawhub
- 見出し: なし

## tools/code-execution.md

- ルート: /tools/code-execution
- 見出し:
  - H2: セットアップ
  - H2: 使用方法
  - H2: エラー
  - H2: 制限
  - H2: 関連

## tools/creating-skills.md

- ルート: /tools/creating-skills
- 見出し:
  - H2: 最初の Skill を作成する
  - H2: SKILL.md リファレンス
  - H3: 必須フィールド
  - H3: 任意の frontmatter キー
  - H3: {baseDir} の使用
  - H2: 条件付き有効化の追加
  - H2: Skill Workshop 経由で提案する
  - H2: ClawHub へ公開する
  - H2: ベストプラクティス
  - H2: 関連

## tools/diffs.md

- ルート: /tools/diffs
- 見出し:
  - H2: クイックスタート
  - H2: 組み込みシステムガイダンスを無効化する
  - H2: 典型的なエージェントワークフロー
  - H2: 入力例
  - H2: ツール入力リファレンス
  - H2: 構文ハイライト
  - H2: 出力詳細契約
  - H2: 折りたたまれた未変更セクション
  - H2: Plugin の既定値
  - H3: 永続ビューアー URL 設定
  - H2: セキュリティ設定
  - H2: アーティファクトのライフサイクルとストレージ
  - H2: ビューアー URL とネットワーク動作
  - H2: セキュリティモデル
  - H2: ファイルモードのブラウザー要件
  - H2: トラブルシューティング
  - H2: 運用ガイダンス
  - H2: 関連

## tools/duckduckgo-search.md

- ルート: /tools/duckduckgo-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: ツールパラメーター
  - H2: 注記
  - H2: 関連

## tools/elevated.md

- ルート: /tools/elevated
- 見出し:
  - H2: ディレクティブ
  - H2: 仕組み
  - H2: 解決順序
  - H2: 可用性と許可リスト
  - H2: elevated が制御しないもの
  - H2: 関連

## tools/exa-search.md

- ルート: /tools/exa-search
- 見出し:
  - H2: Plugin をインストールする
  - H2: API キーを取得する
  - H2: 設定
  - H2: ベース URL オーバーライド
  - H2: ツールパラメーター
  - H3: コンテンツ抽出
  - H3: 検索モード
  - H2: 注記
  - H2: 関連

## tools/exec-approvals-advanced.md

- ルート: /tools/exec-approvals-advanced
- 見出し:
  - H2: セーフ bin（stdin 専用）
  - H3: Argv 検証と拒否フラグ
  - H3: 信頼済みバイナリディレクトリ
  - H3: シェル連結、ラッパー、マルチプレクサー
  - H3: セーフ bin と許可リストの比較
  - H2: インタープリター/ランタイムコマンド
  - H3: フォローアップ配信動作
  - H2: チャットチャンネルへの承認転送
  - H3: Plugin 承認転送
  - H3: 任意のチャンネルでの同一チャット承認
  - H3: ネイティブ承認配信
  - H3: macOS IPC フロー
  - H2: FAQ
  - H3: 承認ターゲットで accountId と threadId はいつ使われるか？
  - H3: 承認がセッションに送信された場合、そのセッション内の誰でも承認できるか？
  - H2: 関連

## tools/exec-approvals.md

- ルート: /tools/exec-approvals
- 見出し:
  - H2: 有効なポリシーの確認
  - H2: 適用箇所
  - H3: 信頼モデル
  - H3: macOS 分割
  - H2: 設定とストレージ
  - H2: ポリシーノブ
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO モード（承認なし）
  - H3: 永続 Gateway ホストの「確認しない」セットアップ
  - H3: ローカルショートカット
  - H3: Node ホスト
  - H3: セッション限定ショートカット
  - H2: 許可リスト（エージェントごと）
  - H3: argPattern による引数制限
  - H2: Skill CLI の自動許可
  - H2: セーフ bin と承認転送
  - H2: Control UI 編集
  - H2: 承認フロー
  - H2: システムイベント
  - H2: 拒否された承認の動作
  - H2: 影響
  - H2: 関連

## tools/exec.md

- ルート: /tools/exec
- 見出し:
  - H2: パラメーター
  - H2: 設定
  - H3: PATH 処理
  - H2: セッションオーバーライド（/exec）
  - H2: 認可モデル
  - H2: Exec 承認（コンパニオンアプリ / Node ホスト）
  - H2: 許可リスト + セーフ bin
  - H2: 例
  - H2: applypatch
  - H2: 関連

## tools/firecrawl.md

- ルート: /tools/firecrawl
- 見出し:
  - H2: Plugin をインストールする
  - H2: キーなし webfetch と API キー
  - H2: Firecrawl 検索を設定する
  - H2: Firecrawl webfetch フォールバックを設定する
  - H3: セルフホスト Firecrawl
  - H2: Firecrawl Plugin ツール
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: ステルス / ボット回避
  - H2: webfetch が Firecrawl を使う仕組み
  - H2: 関連

## tools/gemini-search.md

- ルート: /tools/gemini-search
- 見出し:
  - H2: API キーを取得する
  - H2: 設定
  - H2: 仕組み
  - H2: 対応パラメーター
  - H2: モデル選択
  - H2: ベース URL オーバーライド
  - H2: 関連

## tools/goal.md

- ルート: /tools/goal
- 見出し:
  - H1: Goal
  - H2: クイックスタート
  - H2: goal の用途
  - H2: コマンドリファレンス
  - H2: ステータス
  - H2: トークン予算
  - H2: モデルツール
  - H2: TUI
  - H2: チャンネル動作
  - H2: トラブルシューティング
  - H2: 関連

## tools/grok-search.md

- ルート: /tools/grok-search
- 見出し:
  - H2: オンボーディングと設定
  - H2: サインインするか API キーを取得する
  - H2: 設定
  - H2: 仕組み
  - H2: 対応パラメーター
  - H2: ベース URL オーバーライド
  - H2: 関連

## tools/image-generation.md

- ルート: /tools/image-generation
- 見出し:
  - H2: クイックスタート
  - H2: 一般的なルート
  - H2: 対応プロバイダー
  - H2: プロバイダー機能
  - H2: ツールパラメーター
  - H2: 設定
  - H3: モデル選択
  - H3: プロバイダー選択順序
  - H3: 画像編集
  - H2: プロバイダー詳細解説
  - H2: 例
  - H2: 関連

## tools/index.md

- ルート: /tools
- 見出し:
  - H2: ここから開始
  - H2: ツール、Skills、Plugin を選ぶ
  - H2: 組み込みツールカテゴリー
  - H2: Plugin 提供ツール
  - H2: アクセスと承認を設定する
  - H2: 機能を拡張する
  - H2: 見つからないツールのトラブルシューティング
  - H2: 関連

## tools/kimi-search.md

- ルート: /tools/kimi-search
- 見出し:
  - H2: API キーを取得する
  - H2: 設定
  - H2: 仕組み
  - H2: 対応パラメーター
  - H2: 関連

## tools/llm-task.md

- ルート: /tools/llm-task
- 見出し:
  - H2: Plugin を有効化する
  - H2: 設定（任意）
  - H2: ツールパラメーター
  - H2: 出力
  - H2: 例: Lobster ワークフローステップ
  - H3: 重要な制限
  - H2: 安全性に関する注記
  - H2: 関連

## tools/lobster.md

- ルート: /tools/lobster
- 見出し:
  - H2: フック
  - H2: 理由
  - H2: プレーンなプログラムではなく DSL を使う理由
  - H2: 仕組み
  - H2: パターン: 小さな CLI + JSON パイプ + 承認
  - H2: JSON 専用 LLM ステップ（llm-task）
  - H3: 重要な制限: 埋め込み Lobster と openclaw.invoke
  - H2: ワークフローファイル（.lobster）
  - H2: Lobster をインストールする
  - H2: ツールを有効化する
  - H2: 例: メールトリアージ
  - H2: ツールパラメーター
  - H3: run
  - H3: resume
  - H3: 任意の入力
  - H2: 出力エンベロープ
  - H2: 承認
  - H2: OpenProse
  - H2: 安全性
  - H2: トラブルシューティング
  - H2: 詳細
  - H2: ケーススタディ: コミュニティワークフロー
  - H2: 関連

## tools/loop-detection.md

- ルート: /tools/loop-detection
- 見出し:
  - H2: これが存在する理由
  - H2: 設定ブロック
  - H3: フィールドの動作
  - H2: 推奨セットアップ
  - H2: Compaction 後のガード
  - H2: ログと想定される動作
  - H2: 関連

## tools/media-overview.md

- ルート: /tools/media-overview
- 見出し:
  - H2: 機能
  - H2: プロバイダー機能マトリクス
  - H2: 非同期と同期
  - H2: 音声テキスト化と音声通話
  - H2: プロバイダーマッピング（ベンダーがサーフェス間でどう分かれるか）
  - H2: 関連

## tools/minimax-search.md

- ルート: /tools/minimax-search
- 見出し:
  - H2: Token Plan 認証情報を取得する
  - H2: 設定
  - H2: リージョン選択
  - H2: 対応パラメーター
  - H2: 関連

## tools/multi-agent-sandbox-tools.md

- ルート: /tools/multi-agent-sandbox-tools
- 見出し:
  - H2: 設定例
  - H2: 設定の優先順位
  - H3: サンドボックス設定
  - H3: ツール制限
  - H2: 単一エージェントからの移行
  - H2: ツール制限の例
  - H2: よくある落とし穴: "non-main"
  - H2: テスト
  - H2: トラブルシューティング
  - H2: 関連

## tools/music-generation.md

- ルート: /tools/music-generation
- 見出し:
  - H2: クイックスタート
  - H2: 対応プロバイダー
  - H3: 機能マトリクス
  - H2: ツールパラメーター
  - H2: 非同期の挙動
  - H3: タスクのライフサイクル
  - H2: 設定
  - H3: モデル選択
  - H3: プロバイダー選択順
  - H2: プロバイダーノート
  - H2: 適切なパスを選ぶ
  - H2: プロバイダー機能モード
  - H2: ライブテスト
  - H2: 関連

## tools/ollama-search.md

- ルート: /tools/ollama-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: ノート
  - H2: 関連

## tools/parallel-search.md

- ルート: /tools/parallel-search
- 見出し:
  - H2: Pluginをインストールする
  - H2: APIキー（有料プロバイダー）
  - H2: 設定
  - H2: ベースURLの上書き
  - H2: ツールパラメーター
  - H2: ノート
  - H2: 関連

## tools/pdf.md

- ルート: /tools/pdf
- 見出し:
  - H2: 利用可否
  - H2: 入力リファレンス
  - H2: 対応PDF参照
  - H2: 実行モード
  - H3: ネイティブプロバイダーモード
  - H3: 抽出フォールバックモード
  - H2: 設定
  - H2: 出力の詳細
  - H2: エラー時の挙動
  - H2: 例
  - H2: 関連

## tools/permission-modes.md

- ルート: /tools/permission-modes
- 見出し:
  - H2: 推奨デフォルト
  - H2: OpenClawホスト実行モード
  - H2: Codex Guardianマッピング
  - H2: ACPXハーネス権限
  - H2: モードを選ぶ
  - H2: 関連

## tools/perplexity-search.md

- ルート: /tools/perplexity-search
- 見出し:
  - H2: Pluginをインストールする
  - H2: Perplexity APIキーを取得する
  - H2: OpenRouter互換性
  - H2: 設定例
  - H3: ネイティブPerplexity Search API
  - H3: OpenRouter / Sonar互換性
  - H2: キーを設定する場所
  - H2: ツールパラメーター
  - H3: ドメインフィルタールール
  - H2: ノート
  - H2: 関連

## tools/plugin.md

- ルート: /tools/plugin
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: 設定
  - H3: インストール元を選ぶ
  - H3: オペレーターインストールポリシー
  - H3: Pluginポリシーを設定する
  - H2: Plugin形式を理解する
  - H2: Pluginフック
  - H2: アクティブなGatewayを確認する
  - H2: トラブルシューティング
  - H3: ブロックされたPluginパス所有権
  - H3: 遅いPluginツールセットアップ
  - H2: 関連

## tools/reactions.md

- ルート: /tools/reactions
- 見出し:
  - H2: 仕組み
  - H2: チャンネルの挙動
  - H2: リアクションレベル
  - H2: 関連

## tools/searxng-search.md

- ルート: /tools/searxng-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: 環境変数
  - H2: Plugin設定リファレンス
  - H2: ノート
  - H2: 関連

## tools/skill-workshop.md

- ルート: /tools/skill-workshop
- 見出し:
  - H2: 仕組み
  - H2: ライフサイクル
  - H2: チャット
  - H2: CLI
  - H2: 提案内容
  - H2: サポートファイル
  - H2: エージェントツール
  - H2: 承認と自律性
  - H2: Gatewayメソッド
  - H2: ストレージ
  - H2: 制限
  - H2: トラブルシューティング
  - H2: 関連

## tools/skills-config.md

- ルート: /tools/skills-config
- 見出し:
  - H2: 読み込み（skills.load）
  - H2: インストール（skills.install）
  - H2: オペレーターインストールポリシー（security.installPolicy）
  - H2: バンドルSkills許可リスト
  - H2: Skillsごとのエントリー（skills.entries）
  - H2: エージェント許可リスト（agents）
  - H2: ワークショップ（skills.workshop）
  - H2: シンボリックリンクされたSkillsルート
  - H2: サンドボックス化されたSkillsと環境変数
  - H2: 読み込み順のリマインダー
  - H2: 関連

## tools/skills.md

- ルート: /tools/skills
- 見出し:
  - H2: 読み込み順
  - H2: エージェントごとのSkillsと共有Skills
  - H2: エージェント許可リスト
  - H2: PluginとSkills
  - H2: Skill Workshop
  - H2: ClawHubからインストールする
  - H2: セキュリティ
  - H2: SKILL.md形式
  - H3: 任意のfrontmatterキー
  - H2: ゲーティング
  - H3: インストーラー仕様
  - H2: 設定の上書き
  - H2: 環境注入
  - H2: スナップショットと更新
  - H2: トークンへの影響
  - H2: 関連

## tools/slash-commands.md

- ルート: /tools/slash-commands
- 見出し:
  - H2: 3種類のコマンド
  - H2: 設定
  - H2: コマンド一覧
  - H3: コアコマンド
  - H3: Dockコマンド
  - H3: バンドルPluginコマンド
  - H3: Skillsコマンド
  - H2: /tools — エージェントが現在使用できるもの
  - H2: /model — モデル選択
  - H2: /config — ディスク上の設定書き込み
  - H2: /mcp — MCPサーバー設定
  - H2: /debug — ランタイムのみの上書き
  - H2: /plugins — Plugin管理
  - H2: /trace — Pluginトレース出力
  - H2: /btw — ついでの質問
  - H2: サーフェスノート
  - H2: プロバイダーの使用状況とステータス
  - H2: 関連

## tools/steer.md

- ルート: /tools/steer
- 見出し:
  - H2: 現在のセッション
  - H2: ステアリングとキュー
  - H2: サブエージェント
  - H2: ACPセッション
  - H2: 関連

## tools/subagents.md

- ルート: /tools/subagents
- 見出し:
  - H2: スラッシュコマンド
  - H3: スレッドバインディング制御
  - H3: 起動の挙動
  - H2: コンテキストモード
  - H2: ツール: sessionsspawn
  - H3: 委譲プロンプトモード
  - H3: ツールパラメーター
  - H3: タスク名とターゲティング
  - H2: ツール: sessionsyield
  - H2: ツール: subagents
  - H2: スレッドに紐づくセッション
  - H3: スレッド対応チャンネル
  - H3: クイックフロー
  - H3: 手動制御
  - H3: 設定スイッチ
  - H3: 許可リスト
  - H3: 検出
  - H3: 自動アーカイブ
  - H2: ネストされたサブエージェント
  - H3: 深さレベル
  - H3: 通知チェーン
  - H3: 深さごとのツールポリシー
  - H3: エージェントごとの起動制限
  - H3: カスケード停止
  - H2: 認証
  - H2: 通知
  - H3: 通知コンテキスト
  - H3: 統計行
  - H3: sessionshistoryを優先する理由
  - H2: ツールポリシー
  - H3: 設定による上書き
  - H2: 並行処理
  - H2: 生存性と復旧
  - H2: 停止
  - H2: 制限事項
  - H2: 関連

## tools/tavily.md

- ルート: /tools/tavily
- 見出し:
  - H2: はじめに
  - H2: ツールリファレンス
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: 適切なツールを選ぶ
  - H2: 高度な設定
  - H2: 関連

## tools/thinking.md

- ルート: /tools/thinking
- 見出し:
  - H2: 何をするか
  - H2: 解決順序
  - H2: セッションデフォルトを設定する
  - H2: エージェントごとの適用
  - H2: 高速モード（/fast）
  - H2: 詳細ディレクティブ（/verboseまたは/v）
  - H2: Pluginトレースディレクティブ（/trace）
  - H2: 推論の可視性（/reasoning）
  - H2: 関連
  - H2: Heartbeat
  - H2: WebチャットUI
  - H2: プロバイダープロファイル

## tools/tokenjuice.md

- ルート: /tools/tokenjuice
- 見出し:
  - H2: Pluginを有効にする
  - H2: tokenjuiceが変更すること
  - H2: 動作していることを確認する
  - H2: Pluginを無効にする
  - H2: 関連

## tools/tool-search.md

- ルート: /tools/tool-search
- 見出し:
  - H2: ターンの実行方法
  - H2: モード
  - H2: これが存在する理由
  - H2: API
  - H2: ランタイム境界
  - H2: 設定
  - H2: プロンプトとテレメトリ
  - H2: E2E検証
  - H2: 失敗時の挙動
  - H2: 関連

## tools/trajectory.md

- ルート: /tools/trajectory
- 見出し:
  - H2: クイックスタート
  - H2: アクセス
  - H2: 記録される内容
  - H2: バンドルファイル
  - H2: キャプチャ場所
  - H2: キャプチャを無効にする
  - H2: フラッシュタイムアウトを調整する
  - H2: プライバシーと制限
  - H2: トラブルシューティング
  - H2: 関連

## tools/tts.md

- ルート: /tools/tts
- 見出し:
  - H2: クイックスタート
  - H2: 対応プロバイダー
  - H2: 設定
  - H3: エージェントごとの音声上書き
  - H2: ペルソナ
  - H3: 最小ペルソナ
  - H3: 完全なペルソナ（プロバイダー中立プロンプト）
  - H3: ペルソナ解決
  - H3: プロバイダーがペルソナプロンプトを使用する方法
  - H3: フォールバックポリシー
  - H2: モデル駆動ディレクティブ
  - H2: スラッシュコマンド
  - H2: ユーザーごとの設定
  - H2: 出力形式（固定）
  - H2: 自動TTSの挙動
  - H2: チャンネル別の出力形式
  - H2: フィールドリファレンス
  - H2: エージェントツール
  - H2: Gateway RPC
  - H2: サービスリンク
  - H2: 関連

## tools/video-generation.md

- ルート: /tools/video-generation
- 見出し:
  - H2: クイックスタート
  - H2: 非同期生成の仕組み
  - H3: タスクのライフサイクル
  - H2: 対応プロバイダー
  - H3: 機能マトリクス
  - H2: ツールパラメーター
  - H3: 必須
  - H3: コンテンツ入力
  - H3: スタイル制御
  - H3: 詳細
  - H4: フォールバックと型付きオプション
  - H2: アクション
  - H2: モデル選択
  - H2: プロバイダーノート
  - H2: プロバイダー機能モード
  - H2: ライブテスト
  - H2: 設定
  - H2: 関連

## tools/web-fetch.md

- ルート: /tools/web-fetch
- 見出し:
  - H2: クイックスタート
  - H2: ツールパラメーター
  - H2: 仕組み
  - H2: 進捗更新
  - H2: 設定
  - H2: Firecrawlフォールバック
  - H2: 信頼済み環境プロキシ
  - H2: 制限と安全性
  - H2: ツールプロファイル
  - H2: 関連

## tools/web.md

- ルート: /tools/web
- 見出し:
  - H2: クイックスタート
  - H2: プロバイダーを選ぶ
  - H3: プロバイダー比較
  - H2: 自動検出
  - H2: ネイティブOpenAI Web検索
  - H2: ネイティブCodex Web検索
  - H2: ネットワーク安全性
  - H2: Web検索を設定する
  - H2: 設定
  - H3: APIキーの保存
  - H2: ツールパラメーター
  - H2: xsearch
  - H3: xsearch設定
  - H3: xsearchパラメーター
  - H3: xsearch例
  - H2: 例
  - H2: ツールプロファイル
  - H2: 関連

## tts.md

- ルート: /tts
- 見出し:
  - H2: 関連

## vps.md

- ルート: /vps
- 見出し:
  - H2: プロバイダーを選ぶ
  - H2: クラウドセットアップの仕組み
  - H2: まず管理者アクセスを強化する
  - H2: VPS上の共有会社エージェント
  - H2: VPSでノードを使用する
  - H2: 小型VMとARMホスト向けの起動チューニング
  - H3: systemdチューニングチェックリスト（任意）
  - H2: 関連

## web/control-ui.md

- ルート: /web/control-ui
- 見出し:
  - H2: クイックオープン（ローカル）
  - H2: デバイスペアリング（初回接続）
  - H2: 個人ID（ブラウザーローカル）
  - H2: ランタイム設定エンドポイント
  - H2: 言語サポート
  - H2: 外観テーマ
  - H2: できること（現在）
  - H2: MCPページ
  - H2: アクティビティタブ
  - H2: チャットの挙動
  - H2: PWAインストールとWebプッシュ
  - H2: ホスト埋め込み
  - H2: チャットメッセージ幅
  - H2: Tailnetアクセス（推奨）
  - H2: 安全でないHTTP
  - H2: コンテンツセキュリティポリシー
  - H2: アバタールート認証
  - H2: アシスタントメディアルート認証
  - H2: UIのビルド
  - H2: 空白のControl UIページ
  - H2: デバッグ/テスト: 開発サーバー + リモートGateway
  - H2: 関連

## web/dashboard.md

- ルート: /web/dashboard
- 見出し:
  - H2: 高速パス（推奨）
  - H2: 認証の基本（ローカルとリモート）
  - H2: "unauthorized" / 1008 が表示される場合
  - H2: 関連

## web/index.md

- ルート: /web
- 見出し:
  - H2: Webhook
  - H2: 管理者HTTP RPC
  - H2: 設定（デフォルトでオン）
  - H2: Tailscaleアクセス
  - H3: 統合Serve（推奨）
  - H3: Tailnetバインド + トークン
  - H3: パブリックインターネット（Funnel）
  - H2: セキュリティノート
  - H2: UIのビルド

## web/tui.md

- ルート: /web/tui
- 見出し:
  - H2: クイックスタート
  - H3: Gatewayモード
  - H3: ローカルモード
  - H2: 表示されるもの
  - H2: メンタルモデル: エージェント + セッション
  - H2: 送信 + 配信
  - H2: ピッカー + オーバーレイ
  - H2: キーボードショートカット
  - H2: スラッシュコマンド
  - H2: ローカルシェルコマンド
  - H2: ローカルTUIから設定を修復する
  - H2: ツール出力
  - H2: ターミナルカラー
  - H2: 履歴 + ストリーミング
  - H2: 接続の詳細
  - H2: オプション
  - H2: トラブルシューティング
  - H2: 接続トラブルシューティング
  - H2: 関連

## web/webchat.md

- ルート: /web/webchat
- 見出し:
  - H2: これは何か
  - H2: クイックスタート
  - H2: 仕組み（挙動）
  - H3: トランスクリプトと配信モデル
  - H2: Control UIエージェントツールパネル
  - H2: リモート利用
  - H2: 設定リファレンス（WebChat）
  - H2: 関連
