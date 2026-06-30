---
read_when: Finding which docs page covers a topic before reading the page
summary: OpenClaw ドキュメントページ用に生成された見出しマップ
title: ドキュメントマップ
x-i18n:
    generated_at: "2026-06-30T22:05:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53389be7dd9f5fba6a833b90928e1ae77745ec214640011c4f7e27c7a7b62c2b
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw ドキュメントマップ

このファイルは、エージェントがドキュメントツリーを移動しやすくするために、`docs/**/*.md` と `docs/**/*.mdx` の見出しから生成されます。
手で編集しないでください。`pnpm docs:map:gen` を実行してください。

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
  - H2: 行うこと
  - H2: 移行メモ
  - H2: 関連項目

## auth-credential-semantics.md

- ルート: /auth-credential-semantics
- 見出し:
  - H2: 安定したプローブ理由コード
  - H2: トークン認証情報
  - H3: 適格性ルール
  - H3: 解決ルール
  - H2: エージェントコピーのポータビリティ
  - H2: 設定のみの認証ルート
  - H2: 明示的な認証順序フィルタリング
  - H2: プローブ対象の解決
  - H2: 外部 CLI 認証情報の検出
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
  - H2: Cron の仕組み
  - H2: スケジュール種別
  - H3: 月内の日付と曜日は OR ロジックを使用
  - H2: 実行スタイル
  - H3: コマンドペイロード
  - H3: 分離ジョブ向けのペイロードオプション
  - H2: 配信と出力
  - H2: 出力言語
  - H2: CLI 例
  - H2: Webhook
  - H3: 認証
  - H2: Gmail PubSub 連携
  - H3: ウィザードセットアップ（推奨）
  - H3: Gateway の自動起動
  - H3: 手動の 1 回限りセットアップ
  - H3: Gmail モデルの上書き
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
  - H2: フックの作成
  - H3: フック構造
  - H3: HOOK.md 形式
  - H3: ハンドラー実装
  - H3: イベントコンテキストの要点
  - H2: フック検出
  - H3: フックパック
  - H2: 同梱フック
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
  - H3: フックが対象にならない
  - H3: フックが実行されない
  - H2: 関連

## automation/index.md

- ルート: /automation
- 見出し:
  - H2: クイック判断ガイド
  - H3: スケジュール済みタスク（Cron）と Heartbeat
  - H2: コア概念
  - H3: スケジュール済みタスク（Cron）
  - H3: タスク
  - H3: 推定されたコミットメント
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
  - H2: 常設指示を使う理由
  - H2: 仕組み
  - H2: 常設指示の構造
  - H2: 常設指示と Cron ジョブ
  - H2: 例
  - H3: 例 1: コンテンツとソーシャルメディア（週次サイクル）
  - H3: 例 2: 財務オペレーション（イベントトリガー）
  - H3: 例 3: 監視とアラート（継続）
  - H2: 実行・検証・報告パターン
  - H2: マルチプログラムアーキテクチャ
  - H2: ベストプラクティス
  - H3: やること
  - H3: 避けること
  - H2: 関連

## automation/taskflow.md

- ルート: /automation/taskflow
- 見出し:
  - H2: Task Flow を使うタイミング
  - H2: 信頼性の高いスケジュール済みワークフローパターン
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
  - H2: TL;DR
  - H2: クイックスタート
  - H2: タスクを作成するもの
  - H2: タスクのライフサイクル
  - H2: 配信と通知
  - H3: 通知ポリシー
  - H2: CLI リファレンス
  - H2: チャットタスクボード（/tasks）
  - H2: ステータス連携（タスク負荷）
  - H2: ストレージとメンテナンス
  - H3: タスクの保存場所
  - H3: 自動メンテナンス
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
  - H2: 許可リストからグループを参照
  - H2: サポートされるメッセージチャネルパス
  - H2: Plugin 診断
  - H2: Discord チャネルのオーディエンス
  - H2: セキュリティメモ
  - H2: トラブルシューティング

## channels/ambient-room-events.md

- ルート: /channels/ambient-room-events
- 見出し:
  - H2: 推奨セットアップ
  - H2: 変更点
  - H2: Discord の例
  - H2: Slack の例
  - H2: Telegram の例
  - H2: エージェント固有ポリシー
  - H2: 表示される返信モード
  - H2: 履歴
  - H2: トラブルシューティング
  - H2: 関連

## channels/bot-loop-protection.md

- ルート: /channels/bot-loop-protection
- 見出し:
  - H1: ボットループ保護
  - H2: デフォルト
  - H2: 共有デフォルトを設定
  - H2: チャネルまたはアカウントごとに上書き
  - H2: チャネルサポート

## channels/broadcast-groups.md

- ルート: /channels/broadcast-groups
- 見出し:
  - H2: 概要
  - H2: ユースケース
  - H2: 設定
  - H3: 基本セットアップ
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
  - H2: 将来の拡張
  - H2: 関連

## channels/channel-routing.md

- ルート: /channels/channel-routing
- 見出し:
  - H1: チャネルとルーティング
  - H2: 主要用語
  - H2: 送信先ターゲットプレフィックス
  - H2: セッションキーの形状（例）
  - H2: メイン DM ルート固定
  - H2: ガード付き受信記録
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
  - H2: クイックセットアップ
  - H2: 複数ボット
  - H2: ターゲット
  - H2: 権限
  - H2: トラブルシューティング

## channels/discord.md

- ルート: /channels/discord
- 見出し:
  - H2: クイックセットアップ
  - H2: 推奨: ギルドワークスペースをセットアップ
  - H2: ランタイムモデル
  - H2: フォーラムチャネル
  - H2: インタラクティブコンポーネント
  - H2: アクセス制御とルーティング
  - H3: ロールベースのエージェントルーティング
  - H2: ネイティブコマンドとコマンド認可
  - H2: 機能の詳細
  - H2: ツールとアクションゲート
  - H2: Components v2 UI
  - H2: 音声
  - H3: 音声チャネル
  - H3: 音声内でユーザーをフォロー
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
  - H2: グループ設定例
  - H3: すべてのグループを許可し、@メンションを不要にする
  - H3: すべてのグループを許可しつつ、@メンションは必要
  - H3: 特定のグループのみ許可
  - H3: グループ内の送信者を制限
  - H2: グループ/ユーザー ID を取得
  - H3: グループ ID（chatid、形式: ocxxx）
  - H3: ユーザー ID（openid、形式: ouxxx）
  - H2: 一般的なコマンド
  - H2: トラブルシューティング
  - H3: ボットがグループチャットで応答しない
  - H3: ボットがメッセージを受信しない
  - H3: Feishu モバイルアプリで QR セットアップが反応しない
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
  - H3: クイックセットアップ
  - H3: 仕組み
  - H3: 設定オプション
  - H3: セッションスコープ
  - H3: 典型的なマルチユーザーデプロイ
  - H3: 検証
  - H3: メモ
  - H2: 設定リファレンス
  - H2: サポートされるメッセージタイプ
  - H3: 受信
  - H3: 送信
  - H3: スレッドと返信
  - H2: 関連

## channels/googlechat.md

- ルート: /channels/googlechat
- 見出し:
  - H2: インストール
  - H2: クイックセットアップ（初心者向け）
  - H2: Google Chat に追加
  - H2: 公開 URL（Webhook のみ）
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
  - H3: アクティベーションコマンド（所有者のみ）
  - H2: 使い方
  - H2: テスト / 検証
  - H2: 既知の考慮事項
  - H2: 関連

## channels/groups.md

- ルート: /channels/groups
- 見出し:
  - H2: 初心者向け概要（2 分）
  - H2: 表示される返信
  - H2: コンテキスト可視性と許可リスト
  - H2: セッションキー
  - H2: パターン: 個人 DM + 公開グループ（単一エージェント）
  - H2: 表示ラベル
  - H2: グループポリシー
  - H2: メンションゲート（デフォルト）
  - H2: メンションパターンのスコープを設定
  - H2: グループ/チャネルツール制限（任意）
  - H2: グループ許可リスト
  - H2: アクティベーション（所有者のみ）
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
  - H2: imsg の機能
  - H2: 始める前に
  - H2: 設定の変換
  - H2: グループレジストリの落とし穴
  - H2: 手順
  - H2: アクション互換性の概要
  - H2: ペアリング、セッション、ACP バインディング
  - H2: ロールバックチャネルなし
  - H2: 関連

## channels/imessage.md

- ルート: /channels/imessage
- 見出し:
  - H2: クイックセットアップ
  - H2: 要件と権限（macOS）
  - H2: imsg プライベート API の有効化
  - H3: セットアップ
  - H3: SIP を無効化できない場合
  - H2: アクセス制御とルーティング
  - H2: ACP 会話バインディング
  - H2: デプロイパターン
  - H2: メディア、チャンク化、配信ターゲット
  - H2: プライベート API アクション
  - H2: 設定の書き込み
  - H2: 分割送信 DM の結合（1 つの作成内のコマンド + URL）
  - H3: シナリオとエージェントに見える内容
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
  - H2: サポートされるチャネル
  - H2: メモ

## channels/irc.md

- ルート: /channels/irc
- 見出し:
  - H2: クイックスタート
  - H2: セキュリティデフォルト
  - H2: アクセス制御
  - H3: よくある落とし穴: allowFrom は DM 用であり、チャネル用ではありません
  - H2: 返信のトリガー（メンション）
  - H2: セキュリティメモ（公開チャネルに推奨）
  - H3: チャネル内の全員に同じツール
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
  - H2: 設定
  - H2: アクセス制御
  - H2: メッセージ動作
  - H2: チャネルデータ（リッチメッセージ）
  - H2: ACPサポート
  - H2: 送信メディア
  - H2: トラブルシューティング
  - H2: 関連

## channels/location.md

- ルート: /channels/location
- 見出し:
  - H2: テキスト整形
  - H2: コンテキストフィールド
  - H2: チャネルに関する注記
  - H2: 関連

## channels/matrix-migration.md

- ルート: /channels/matrix-migration
- 見出し:
  - H2: 移行が自動的に行うこと
  - H2: 移行が自動的には行えないこと
  - H2: 推奨アップグレードフロー
  - H2: 暗号化された移行の仕組み
  - H2: よくあるメッセージとその意味
  - H3: アップグレードと検出のメッセージ
  - H3: 暗号化状態の復旧メッセージ
  - H3: 手動復旧メッセージ
  - H3: カスタムPluginインストールメッセージ
  - H2: 暗号化された履歴がまだ戻らない場合
  - H2: 今後のメッセージを新しく始めたい場合
  - H2: 関連

## channels/matrix-presentation.md

- ルート: /channels/matrix-presentation
- 見出し:
  - H2: イベント内容
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
  - H2: 複数ボットに関する注記
  - H2: ホームサーバーに関する注記
  - H2: 関連

## channels/matrix.md

- ルート: /channels/matrix
- 見出し:
  - H2: インストール
  - H2: セットアップ
  - H3: 対話型セットアップ
  - H3: 最小構成
  - H3: 自動参加
  - H3: 許可リスト対象形式
  - H3: アカウントIDの正規化
  - H3: キャッシュ済み認証情報
  - H3: 環境変数
  - H2: 設定例
  - H2: ストリーミングプレビュー
  - H2: 音声メッセージ
  - H2: 承認メタデータ
  - H3: 静かな確定済みプレビューのためのセルフホスト型プッシュルール
  - H2: ボット間ルーム
  - H2: 暗号化と検証
  - H3: 暗号化を有効化
  - H3: ステータスと信頼シグナル
  - H3: リカバリーキーでこのデバイスを検証
  - H3: クロス署名のブートストラップまたは修復
  - H3: ルームキーのバックアップ
  - H3: 検証の一覧表示、リクエスト、応答
  - H3: 複数アカウントに関する注記
  - H2: プロファイル管理
  - H2: スレッド
  - H3: セッションルーティング（sessionScope）
  - H3: 返信スレッド化（threadReplies）
  - H3: スレッド継承とスラッシュコマンド
  - H2: ACP会話バインディング
  - H3: スレッドバインディング設定
  - H2: リアクション
  - H2: 履歴コンテキスト
  - H2: コンテキストの可視性
  - H2: DMとルームポリシー
  - H2: ダイレクトルーム修復
  - H2: 実行承認
  - H2: スラッシュコマンド
  - H2: 複数アカウント
  - H2: プライベート/LANホームサーバー
  - H2: Matrixトラフィックのプロキシ
  - H2: 対象解決
  - H2: 設定リファレンス
  - H3: アカウントと接続
  - H3: 暗号化
  - H3: アクセスとポリシー
  - H3: 返信動作
  - H3: リアクション設定
  - H3: ツールとルームごとの上書き
  - H3: 実行承認設定
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
  - H2: 送信配信の対象
  - H2: DMチャネルの再試行
  - H2: プレビューストリーミング
  - H2: リアクション（メッセージツール）
  - H2: インタラクティブボタン（メッセージツール）
  - H3: 直接API統合（外部スクリプト）
  - H2: ディレクトリアダプター
  - H2: 複数アカウント
  - H2: トラブルシューティング
  - H2: 関連

## channels/msteams.md

- ルート: /channels/msteams
- 見出し:
  - H2: バンドルPlugin
  - H2: クイックセットアップ
  - H2: 目標
  - H2: 設定の書き込み
  - H2: アクセス制御（DM + グループ）
  - H3: 仕組み
  - H3: ステップ1: Azure Botを作成
  - H3: ステップ2: 認証情報を取得
  - H3: ステップ3: メッセージングエンドポイントを設定
  - H3: ステップ4: Teamsチャネルを有効化
  - H3: ステップ5: Teamsアプリマニフェストをビルド
  - H3: ステップ6: OpenClawを設定
  - H3: ステップ7: Gatewayを実行
  - H2: フェデレーション認証（証明書とマネージドID）
  - H3: オプションA: 証明書ベースの認証
  - H3: オプションB: Azure Managed Identity
  - H3: AKS Workload Identityのセットアップ
  - H3: 認証タイプの比較
  - H2: ローカル開発（トンネリング）
  - H2: ボットのテスト
  - H2: 環境変数
  - H2: メンバー情報アクション
  - H2: 履歴コンテキスト
  - H2: 現在のTeams RSC権限（マニフェスト）
  - H2: Teamsマニフェスト例（編集済み）
  - H3: マニフェストの注意点（必須フィールド）
  - H3: 既存アプリの更新
  - H2: 機能: RSCのみ vs Graph
  - H3: Teams RSCのみの場合（アプリはインストール済み、Graph API権限なし）
  - H3: Teams RSC + Microsoft Graph Application権限の場合
  - H3: RSC vs Graph API
  - H2: Graph対応メディア + 履歴（チャネルに必須）
  - H2: 既知の制限
  - H3: Webhookタイムアウト
  - H3: TeamsクラウドとサービスURLサポート
  - H3: 書式設定
  - H2: 設定
  - H2: ルーティングとセッション
  - H2: 返信スタイル: スレッド vs 投稿
  - H3: 解決の優先順位
  - H3: スレッドコンテキストの保持
  - H2: 添付ファイルと画像
  - H2: グループチャットでのファイル送信
  - H3: グループチャットにSharePointが必要な理由
  - H3: セットアップ
  - H3: 共有動作
  - H3: フォールバック動作
  - H3: ファイルの保存場所
  - H2: 投票（Adaptive Cards）
  - H2: プレゼンテーションカード
  - H2: 対象形式
  - H2: プロアクティブメッセージング
  - H2: チームIDとチャネルID（よくある落とし穴）
  - H2: プライベートチャネル
  - H2: トラブルシューティング
  - H3: よくある問題
  - H3: マニフェストアップロードエラー
  - H3: RSC権限が機能しない
  - H2: リファレンス
  - H2: 関連

## channels/nextcloud-talk.md

- ルート: /channels/nextcloud-talk
- 見出し:
  - H2: バンドルPlugin
  - H2: クイックセットアップ（初心者向け）
  - H2: 注記
  - H2: アクセス制御（DM）
  - H2: ルーム（グループ）
  - H2: 機能
  - H2: 設定リファレンス（Nextcloud Talk）
  - H2: 関連

## channels/nostr.md

- ルート: /channels/nostr
- 見出し:
  - H2: バンドルPlugin
  - H3: 古い/カスタムインストール
  - H3: 非対話型セットアップ
  - H2: クイックセットアップ
  - H2: 設定リファレンス
  - H2: プロファイルメタデータ
  - H2: アクセス制御
  - H3: DMポリシー
  - H3: 許可リストの例
  - H2: キー形式
  - H2: リレー
  - H2: プロトコルサポート
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
  - H2: 1) DMペアリング（受信チャットアクセス）
  - H3: 送信者を承認
  - H3: 再利用可能な送信者グループ
  - H3: 状態の保存場所
  - H2: 2) Nodeデバイスペアリング（iOS/Android/macOS/ヘッドレスNode）
  - H3: Telegram経由でペアリング（iOSに推奨）
  - H3: Nodeデバイスを承認
  - H3: 任意の信頼済みCIDR Node自動承認
  - H3: Nodeペアリング状態ストレージ
  - H3: 注記
  - H2: 関連ドキュメント

## channels/qa-channel.md

- ルート: /channels/qa-channel
- 見出し:
  - H2: 機能
  - H2: 設定
  - H2: ランナー
  - H2: 関連

## channels/qqbot.md

- ルート: /channels/qqbot
- 見出し:
  - H2: インストール
  - H2: セットアップ
  - H2: 設定
  - H3: 複数アカウントセットアップ
  - H3: グループチャット
  - H3: 音声（STT / TTS）
  - H2: 対象形式
  - H2: スラッシュコマンド
  - H2: エンジンアーキテクチャ
  - H2: QRコードオンボーディング
  - H2: トラブルシューティング
  - H2: 関連

## channels/raft.md

- ルート: /channels/raft
- 見出し:
  - H2: インストール
  - H2: 前提条件
  - H2: 設定
  - H2: 仕組み
  - H2: 検証
  - H2: トラブルシューティング
  - H2: リファレンス

## channels/signal.md

- ルート: /channels/signal
- 見出し:
  - H2: 前提条件
  - H2: クイックセットアップ（初心者向け）
  - H2: 概要
  - H2: 設定の書き込み
  - H2: 番号モデル（重要）
  - H2: セットアップパスA: 既存のSignalアカウントをリンク（QR）
  - H2: セットアップパスB: 専用ボット番号を登録（SMS、Linux）
  - H2: 外部デーモンモード（httpUrl）
  - H2: コンテナモード（bbernhard/signal-cli-rest-api）
  - H2: アクセス制御（DM + グループ）
  - H2: 仕組み（動作）
  - H2: メディア + 制限
  - H2: 入力中表示 + 既読確認
  - H2: リアクション（メッセージツール）
  - H2: 承認リアクション
  - H2: 配信対象（CLI/cron）
  - H2: トラブルシューティング
  - H2: セキュリティに関する注記
  - H2: 設定リファレンス（Signal）
  - H2: 関連

## channels/slack.md

- ルート: /channels/slack
- 見出し:
  - H2: Socket ModeまたはHTTP Request URLsの選択
  - H3: リレーモード
  - H2: インストール
  - H2: クイックセットアップ
  - H2: Socket Modeトランスポート調整
  - H2: マニフェストとスコープのチェックリスト
  - H3: 追加のマニフェスト設定
  - H2: トークンモデル
  - H2: アクションとゲート
  - H2: アクセス制御とルーティング
  - H2: スレッド化、セッション、返信タグ
  - H2: 確認リアクション
  - H3: 絵文字（ackReaction）
  - H3: スコープ（messages.ackReactionScope）
  - H2: テキストストリーミング
  - H2: 入力中リアクションフォールバック
  - H2: メディア、チャンク化、配信
  - H2: コマンドとスラッシュ動作
  - H2: インタラクティブ返信
  - H3: Plugin所有のモーダル送信
  - H2: Slackでのネイティブ承認
  - H2: イベントと運用動作
  - H2: 設定リファレンス
  - H2: トラブルシューティング
  - H2: 添付ファイルビジョンリファレンス
  - H3: 対応メディアタイプ
  - H3: 受信パイプライン
  - H3: スレッドルート添付ファイルの継承
  - H3: 複数添付ファイルの処理
  - H3: サイズ、ダウンロード、モデルの制限
  - H3: 既知の制限
  - H3: 関連ドキュメント
  - H2: 関連

## channels/sms.md

- ルート: /channels/sms
- 見出し:
  - H2: 始める前に
  - H2: クイックセットアップ
  - H2: 設定例
  - H3: 設定ファイル
  - H3: 環境変数
  - H3: SecretRef認証トークン
  - H3: 許可リストのみのプライベート番号
  - H3: Messaging Service送信者
  - H3: デフォルト送信対象
  - H2: アクセス制御
  - H2: SMSの送信
  - H2: セットアップを検証
  - H3: macOS iMessage/SMSからのエンドツーエンドテスト
  - H2: Webhookセキュリティ
  - H2: 複数アカウント設定
  - H2: トラブルシューティング
  - H3: Twilioが403を返す、またはOpenClawがWebhookを拒否する
  - H3: ペアリングリクエストが表示されない
  - H3: 送信に失敗する
  - H3: メッセージは届くがエージェントが応答しない

## channels/synology-chat.md

- ルート: /channels/synology-chat
- 見出し:
  - H2: バンドルPlugin
  - H2: クイックセットアップ
  - H2: 環境変数
  - H2: DMポリシーとアクセス制御
  - H2: 送信配信
  - H2: 複数アカウント
  - H2: セキュリティに関する注記
  - H2: トラブルシューティング
  - H2: 関連

## channels/telegram.md

- ルート: /channels/telegram
- 見出し:
  - H2: クイックセットアップ
  - H2: Telegram側の設定
  - H2: アクセス制御と有効化
  - H3: グループボットID
  - H2: ランタイム動作
  - H2: 機能リファレンス
  - H2: エラー返信制御
  - H2: トラブルシューティング
  - H2: 設定リファレンス
  - H2: 関連

## channels/tlon.md

- ルート: /channels/tlon
- 見出し:
  - H2: バンドルPlugin
  - H2: セットアップ
  - H2: プライベート/LANシップ
  - H2: グループチャネル
  - H2: アクセス制御
  - H2: 所有者と承認システム
  - H2: 自動承認設定
  - H2: 配信対象（CLI/cron）
  - H2: バンドルSkill
  - H2: 機能
  - H2: トラブルシューティング
  - H2: 設定リファレンス
  - H2: 注記
  - H2: 関連

## channels/troubleshooting.md

- ルート: /channels/troubleshooting
- 見出し:
  - H2: コマンドラダー
  - H2: 更新後
  - H2: WhatsApp
  - H3: WhatsAppの失敗シグネチャ
  - H2: Telegram
  - H3: Telegramの失敗シグネチャ
  - H2: Discord
  - H3: Discordの失敗シグネチャ
  - H2: Slack
  - H3: Slackの失敗シグネチャ
  - H2: iMessage
  - H3: iMessageの失敗シグネチャ
  - H2: Signal
  - H3: Signalの失敗シグネチャ
  - H2: QQ Bot
  - H3: QQ Botの失敗シグネチャ
  - H2: Matrix
  - H3: Matrixの失敗シグネチャ
  - H2: 関連

## channels/twitch.md

- ルート: /channels/twitch
- 見出し:
  - H2: バンドル Plugin
  - H2: クイックセットアップ（初心者向け）
  - H2: 概要
  - H2: セットアップ（詳細）
  - H3: 認証情報を生成する
  - H3: ボットを設定する
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
  - H2: Plugin フックとプライバシー
  - H2: アクセス制御と有効化
  - H2: 設定済みの ACP バインディング
  - H2: 個人番号と自分宛チャットの動作
  - H2: メッセージの正規化とコンテキスト
  - H2: 配信、チャンク分割、メディア
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
  - H3: 対話式セットアップ（代替）
  - H2: アクセス制御
  - H3: ダイレクトメッセージ
  - H3: グループチャット
  - H2: 設定例
  - H3: オープンな DM ポリシーでの基本セットアップ
  - H3: DM を特定ユーザーに制限する
  - H3: グループでの @メンション要件を無効にする
  - H3: 送信メッセージ配信を最適化する
  - H3: テキスト結合戦略を調整する
  - H2: 一般的なコマンド
  - H2: トラブルシューティング
  - H3: ボットがグループチャットで応答しない
  - H3: ボットがメッセージを受信しない
  - H3: ボットが空またはフォールバック返信を送信する
  - H3: App Secret が漏えいした
  - H2: 高度な設定
  - H3: 複数アカウント
  - H3: メッセージ制限
  - H3: ストリーミング
  - H3: グループチャット履歴コンテキスト
  - H3: 返信先モード
  - H3: Markdown ヒント注入
  - H3: デバッグモード
  - H3: マルチエージェントルーティング
  - H2: 設定リファレンス
  - H2: 対応メッセージタイプ
  - H3: 受信
  - H3: 送信
  - H3: スレッドと返信
  - H2: 関連

## channels/zalo.md

- ルート: /channels/zalo
- 見出し:
  - H2: バンドル Plugin
  - H2: クイックセットアップ（初心者向け）
  - H2: 概要
  - H2: セットアップ（高速パス）
  - H3: 1) ボットトークンを作成する（Zalo Bot Platform）
  - H3: 2) トークンを設定する（env または config）
  - H2: 仕組み（動作）
  - H2: 制限
  - H2: アクセス制御（DM）
  - H3: DM アクセス
  - H2: アクセス制御（グループ）
  - H2: ロングポーリングと Webhook
  - H2: 対応メッセージタイプ
  - H2: 機能
  - H2: 配信先（CLI/cron）
  - H2: トラブルシューティング
  - H2: 設定リファレンス（Zalo）
  - H2: 関連

## channels/zaloclawbot.md

- ルート: /channels/zaloclawbot
- 見出し:
  - H2: 互換性
  - H2: 前提条件
  - H2: onboard でインストール（推奨）
  - H2: 手動インストール
  - H3: 1. Plugin をインストールする
  - H3: 2. 設定で Plugin を有効にする
  - H3: 3. QR コードを生成してログインする
  - H3: 4. Gateway を再起動する
  - H2: 仕組み
  - H2: 内部構造
  - H2: トラブルシューティング

## channels/zalouser.md

- ルート: /channels/zalouser
- 見出し:
  - H2: バンドル Plugin
  - H2: クイックセットアップ（初心者向け）
  - H2: 概要
  - H2: 命名
  - H2: ID の検索（ディレクトリ）
  - H2: 制限
  - H2: アクセス制御（DM）
  - H2: グループアクセス（任意）
  - H3: グループメンションのゲート制御
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
  - H2: PR コンテキストと証拠
  - H2: スコープとルーティング
  - H2: ClawSweeper アクティビティ転送
  - H2: 手動ディスパッチ
  - H2: ランナー
  - H2: ランナー登録予算
  - H2: ローカル相当
  - H2: OpenClaw Performance
  - H2: Full Release Validation
  - H2: ライブおよび E2E シャード
  - H2: Package Acceptance
  - H3: ジョブ
  - H3: 候補ソース
  - H3: スイートプロファイル
  - H3: レガシー互換性ウィンドウ
  - H3: 例
  - H2: インストールスモーク
  - H2: ローカル Docker E2E
  - H3: 調整項目
  - H3: 再利用可能なライブ/E2E ワークフロー
  - H3: リリースパスチャンク
  - H2: Plugin プレリリース
  - H2: QA Lab
  - H2: CodeQL
  - H3: セキュリティカテゴリ
  - H3: プラットフォーム固有のセキュリティシャード
  - H3: 重要品質カテゴリ
  - H2: メンテナンスワークフロー
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: マージ後の重複 PR
  - H2: ローカルチェックゲートと変更ルーティング
  - H2: Testbox 検証
  - H2: 関連

## clawhub/cli.md

- ルート: /clawhub/cli
- 見出し:
  - H1: ClawHub CLI
  - H2: 検出とインストール
  - H2: 公開とメンテナンス
  - H2: 関連

## clawhub/publishing.md

- ルート: /clawhub/publishing
- 見出し:
  - H1: ClawHub での公開
  - H2: オーナー
  - H2: Skills
  - H2: Plugins
  - H2: リリースフロー
  - H2: FAQ
  - H3: パッケージスコープは選択したオーナーと一致している必要がある

## cli/acp.md

- ルート: /cli/acp
- 見出し:
  - H2: これではないもの
  - H2: 互換性マトリックス
  - H2: 既知の制限
  - H2: 使用方法
  - H2: ACP クライアント（デバッグ）
  - H2: プロトコルスモークテスト
  - H2: 使い方
  - H2: エージェントの選択
  - H2: acpx から使う（Codex、Claude、その他の ACP クライアント）
  - H2: Zed エディターのセットアップ
  - H2: セッションマッピング
  - H2: オプション
  - H3: acp クライアントオプション
  - H2: 関連

## cli/agent.md

- ルート: /cli/agent
- 見出し:
  - H1: openclaw agent
  - H2: オプション
  - H2: 例
  - H2: 注記
  - H2: JSON 配信ステータス
  - H2: 関連

## cli/agents.md

- ルート: /cli/agents
- 見出し:
  - H1: openclaw agents
  - H2: 例
  - H2: ルーティングバインディング
  - H3: --bind 形式
  - H3: バインディングスコープの動作
  - H2: コマンドサーフェス
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete
  - H2: ID ファイル
  - H2: ID を設定する
  - H2: 関連

## cli/approvals.md

- ルート: /cli/approvals
- 見出し:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: 一般的なコマンド
  - H2: ファイルから承認を置き換える
  - H2: 「Never prompt」/ YOLO の例
  - H2: 許可リストヘルパー
  - H2: 一般的なオプション
  - H2: 注記
  - H2: 関連

## cli/backup.md

- ルート: /cli/backup
- 見出し:
  - H1: openclaw backup
  - H2: 注記
  - H2: バックアップされる内容
  - H2: 無効な設定の動作
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
  - H2: MCP 経由の既存 Chrome
  - H2: リモートブラウザー制御（Node ホストプロキシ）
  - H2: 関連

## cli/channels.md

- ルート: /cli/channels
- 見出し:
  - H1: openclaw channels
  - H2: 一般的なコマンド
  - H2: ステータス / 機能 / 解決 / ログ
  - H2: アカウントの追加 / 削除
  - H2: ログインとログアウト（対話式）
  - H2: トラブルシューティング
  - H2: 機能プローブ
  - H2: 名前を ID に解決する
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
  - H3: config スキーマ
  - H3: パス
  - H2: 値
  - H2: config set モード
  - H2: config patch
  - H2: プロバイダービルダーフラグ
  - H2: ドライラン
  - H3: JSON 出力形式
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
  - H2: Crestodian が表示する内容
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
  - H3: 1 回限りのジョブ
  - H3: 繰り返しジョブ
  - H3: 手動実行
  - H2: モデル
  - H3: 分離 cron モデルの優先順位
  - H3: 高速モード
  - H3: ライブモデル切り替えの再試行
  - H2: 実行出力と拒否
  - H3: 古い確認の抑制
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
  - H2: Paperclip / openclawgateway の初回実行承認
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
  - H2: 結果をメッセージ送信で使う
  - H2: ID 形式（チャネル別）
  - H2: 自分（「me」）
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
  - H2: 使う理由
  - H2: 例
  - H2: オプション
  - H2: lint モード
  - H2: 構造化ヘルスチェック
  - H2: チェック選択
  - H2: アップグレード後モード
  - H2: macOS: launchctl env オーバーライド
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
  - H2: Gateway を実行する
  - H3: オプション
  - H2: Gateway を再起動する
  - H3: Gateway プロファイリング
  - H2: 実行中の Gateway を照会する
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: SSH 越しのリモート（Mac アプリとの同等性）
  - H3: gateway call
  - H2: Gateway サービスを管理する
  - H3: ラッパーでインストールする
  - H2: Gateway を検出する（Bonjour）
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
  - H2: すべてのフックを一覧表示
  - H2: フック情報を取得
  - H2: フックの適格性を確認
  - H2: フックを有効化
  - H2: フックを無効化
  - H2: 注記
  - H2: フックパックをインストール
  - H2: フックパックを更新
  - H2: バンドル済みフック
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
  - H2: 使用状況の追跡
  - H2: 関連

## cli/infer.md

- ルート: /cli/infer
- 見出し:
  - H2: infer をスキルにする
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
  - H2: 埋め込み
  - H2: JSON 出力
  - H2: 一般的な落とし穴
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
  - H2: 適切な MCP パスを選ぶ
  - H2: MCP サーバーとしての OpenClaw
  - H3: serve を使う場合
  - H3: 仕組み
  - H3: クライアントモードを選ぶ
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
  - H2: コントロール UI
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
  - H3: ロール / チャンネル / メンバー / 音声
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
  - H3: 手動レビューの Codex 状態
  - H2: Hermes プロバイダー
  - H3: Hermes がインポートするもの
  - H3: 対応する .env キー
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
  - H2: node ホスト用 Gateway 認証
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
  - H3: 非対話型 Z.AI エンドポイントの選択肢
  - H2: フロー注記
  - H2: 一般的な後続コマンド

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
  - H2: ファイル種別による指定
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
  - H3: 作成者
  - H3: プロバイダースキャフォールド
  - H3: インストール
  - H4: Marketplace 省略記法
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
  - H3: Docker イメージを更新した後
  - H3: サンドボックス設定を変更した後
  - H3: SSH ターゲットまたは SSH 認証素材を変更した後
  - H3: OpenShell ソース、ポリシー、またはモードを変更した後
  - H3: setupCommand を変更した後
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
  - H2: クリーンアップ保守
  - H2: セッションを圧縮
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
  - H2: スキルワークショップ
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
  - H2: 1 日に多数の会議
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
  - H3: コントロールプレーン応答形状
  - H2: Git チェックアウトフロー
  - H3: チャンネル選択
  - H3: 更新手順
  - H2: --update 省略記法
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
  - H2: 実践的な使用ガイダンス
  - H2: 設定との関連
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
  - H3: dispatch が Data-Only と表示する
  - H3: dispatch が何も開始しない
  - H2: 関連

## concepts/active-memory.md

- ルート: /concepts/active-memory
- 見出し:
  - H2: クイックスタート
  - H2: 速度に関する推奨事項
  - H3: Cerebras セットアップ
  - H2: 確認方法
  - H2: セッショントグル
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
  - H2: 一般的な問題
  - H2: 関連ページ

## concepts/agent-loop.md

- ルート: /concepts/agent-loop
- 見出し:
  - H2: エントリポイント
  - H2: 仕組み (概要)
  - H2: キューイング + 並行処理
  - H2: セッション + ワークスペース準備
  - H2: プロンプト組み立て + システムプロンプト
  - H2: フックポイント (割り込める場所)
  - H3: 内部フック (Gateway フック)
  - H3: Plugin フック (エージェント + gateway ライフサイクル)
  - H2: ストリーミング + 部分返信
  - H2: ツール実行 + メッセージングツール
  - H2: 返信整形 + 抑制
  - H2: Compaction + リトライ
  - H2: イベントストリーム (現在)
  - H2: チャットチャンネル処理
  - H2: タイムアウト
  - H2: 早期終了する可能性がある場所
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
  - H2: ワークスペース (必須)
  - H2: ブートストラップファイル (注入)
  - H2: 組み込みツール
  - H2: Skills
  - H2: ランタイム境界
  - H2: セッション
  - H2: ストリーミング中の制御
  - H2: モデル参照
  - H2: 設定 (最小)
  - H2: 関連

## concepts/architecture.md

- ルート: /concepts/architecture
- 見出し:
  - H2: 概要
  - H2: コンポーネントとフロー
  - H3: Gateway (デーモン)
  - H3: クライアント (Macアプリ / CLI / Web管理)
  - H3: ノード (macOS / iOS / Android / ヘッドレス)
  - H3: WebChat
  - H2: 接続ライフサイクル (単一クライアント)
  - H2: ワイヤプロトコル (概要)
  - H2: ペアリング + ローカル信頼
  - H2: プロトコル型付けとコード生成
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
  - H2: 何が変わるか
  - H2: 何が変わらないか
  - H2: トラブルシューティング

## concepts/commitments.md

- ルート: /concepts/commitments
- 見出し:
  - H2: コミットメントを有効にする
  - H2: 仕組み
  - H2: スコープ
  - H2: コミットメントとリマインダーの違い
  - H2: コミットメントを管理する
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
  - H2: プラガブルなCompactionプロバイダー
  - H2: Compactionとプルーニング
  - H2: トラブルシューティング
  - H2: 関連

## concepts/context-engine.md

- ルート: /concepts/context-engine
- 見出し:
  - H2: クイックスタート
  - H2: 仕組み
  - H3: サブエージェントのライフサイクル (任意)
  - H3: システムプロンプトへの追加
  - H2: レガシーエンジン
  - H2: Pluginエンジン
  - H3: ContextEngineインターフェイス
  - H3: ランタイム設定
  - H3: ホスト要件
  - H3: 障害分離
  - H3: ownsCompaction
  - H2: 設定リファレンス
  - H2: Compactionおよびメモリとの関係
  - H2: ヒント
  - H2: 関連

## concepts/context.md

- ルート: /concepts/context
- 見出し:
  - H2: クイックスタート (コンテキストを調べる)
  - H2: 出力例
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: コンテキストウィンドウにカウントされるもの
  - H2: OpenClawがシステムプロンプトを構築する方法
  - H2: 注入されるワークスペースファイル (プロジェクトコンテキスト)
  - H2: Skills: 注入とオンデマンド読み込み
  - H2: ツール: 2種類のコスト
  - H2: コマンド、ディレクティブ、「インラインショートカット」
  - H2: セッション、Compaction、プルーニング (永続化されるもの)
  - H2: /contextが実際に報告する内容
  - H2: 関連

## concepts/delegate-architecture.md

- ルート: /concepts/delegate-architecture
- 見出し:
  - H2: デリゲートとは
  - H2: なぜデリゲートを使うのか
  - H2: ケイパビリティ階層
  - H3: Tier 1: 読み取り専用 + 下書き
  - H3: Tier 2: 代理送信
  - H3: Tier 3: プロアクティブ
  - H2: 前提条件: 分離とハードニング
  - H3: ハードブロック (交渉不可)
  - H3: ツール制限
  - H3: サンドボックス分離
  - H3: 監査証跡
  - H2: デリゲートの設定
  - H3: 1. デリゲートエージェントを作成する
  - H3: 2. アイデンティティプロバイダーの委任を設定する
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. デリゲートをチャネルにバインドする
  - H3: 4. デリゲートエージェントに認証情報を追加する
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
  - H2: 主なデフォルト
  - H2: Dreams UI
  - H2: Dreamingが実行されない: ステータスがブロック済みを示す
  - H2: 関連

## concepts/experimental-features.md

- ルート: /concepts/experimental-features
- 見出し:
  - H2: 現在文書化されているフラグ
  - H2: ローカルモデル軽量モード
  - H3: なぜこの3つのツールなのか
  - H3: いつ有効にするか
  - H3: いつ無効のままにするか
  - H3: 有効化
  - H2: 実験的であることは非表示を意味しない
  - H2: 関連

## concepts/features.md

- ルート: /concepts/features
- 見出し:
  - H2: ハイライト
  - H2: 全一覧
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
  - H2: 既存のQA要素
  - H2: エビデンスモデル
  - H2: ブラウザーとVNC
  - H2: マシン
  - H2: シークレット
  - H2: GitHubアーティファクトとPRコメント
  - H2: プライベートデプロイメモ
  - H2: シナリオを追加する
  - H2: プロバイダー拡張
  - H2: 未解決の質問

## concepts/markdown-formatting.md

- ルート: /concepts/markdown-formatting
- 見出し:
  - H2: 目標
  - H2: パイプライン
  - H2: IR例
  - H2: 使用場所
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
  - H2: 提供されるもの
  - H2: はじめに
  - H2: サポートされている埋め込みプロバイダー
  - H2: インデックス作成の仕組み
  - H2: 使用するタイミング
  - H2: トラブルシューティング
  - H2: 設定
  - H2: 関連

## concepts/memory-honcho.md

- ルート: /concepts/memory-honcho
- 見出し:
  - H2: 提供されるもの
  - H2: 利用可能なツール
  - H2: はじめに
  - H2: 設定
  - H2: 既存メモリの移行
  - H2: 仕組み
  - H2: Honchoと組み込みメモリの違い
  - H2: CLIコマンド
  - H2: 参考資料
  - H2: 関連

## concepts/memory-qmd.md

- ルート: /concepts/memory-qmd
- 見出し:
  - H2: 組み込みに追加されるもの
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
  - H2: サポートされているプロバイダー
  - H2: 検索の仕組み
  - H2: 検索品質の改善
  - H3: 時間減衰
  - H3: MMR (多様性)
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
  - H2: アクション依存メモリ
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
  - H3: 受領
  - H2: 受信コンテキスト
  - H2: 送信コンテキスト
  - H2: ライブコンテキスト
  - H2: アダプターサーフェス
  - H2: 公開SDKの縮小
  - H2: チャネル受信との関係
  - H2: 互換性ガードレール
  - H2: 内部ストレージ
  - H2: 障害クラス
  - H2: チャネルマッピング
  - H2: 移行計画
  - H3: フェーズ1: 内部メッセージドメイン
  - H3: フェーズ2: 永続的な送信コア
  - H3: フェーズ3: チャネル受信ブリッジ
  - H3: フェーズ4: 準備済みディスパッチャーブリッジ
  - H3: フェーズ5: 統合ライブライフサイクル
  - H3: フェーズ6: 公開SDK
  - H3: フェーズ7: すべての送信者
  - H3: フェーズ8: Turn名付き互換性の削除
  - H2: テスト計画
  - H2: 未解決の質問
  - H2: 受け入れ基準
  - H2: 関連

## concepts/messages.md

- ルート: /concepts/messages
- 見出し:
  - H2: メッセージフロー (高レベル)
  - H2: 受信重複排除
  - H2: 受信デバウンス
  - H2: セッションとデバイス
  - H2: ツール結果メタデータ
  - H2: 受信本文と履歴コンテキスト
  - H2: キューイングとフォローアップ
  - H2: チャネル実行の所有権
  - H2: ストリーミング、チャンク化、バッチ化
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
  - H2: ユーザーに見えるフォールバック通知
  - H2: 認証ストレージ (キー + OAuth)
  - H2: プロファイルID
  - H2: ローテーション順序
  - H3: セッション粘着性 (キャッシュに適している)
  - H3: OpenAI CodexサブスクリプションとAPIキーのバックアップ
  - H2: クールダウン
  - H2: 請求による無効化
  - H2: モデルフォールバック
  - H3: 候補チェーンルール
  - H3: どのエラーがフォールバックを進めるか
  - H3: クールダウン時のスキップとプローブ動作
  - H2: セッションオーバーライドとライブモデル切り替え
  - H2: 可観測性と障害サマリー
  - H2: 関連設定

## concepts/model-providers.md

- ルート: /concepts/model-providers
- 見出し:
  - H2: クイックルール
  - H2: Plugin所有のプロバイダー動作
  - H2: APIキーのローテーション
  - H2: 公式プロバイダーPlugin
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: その他のサブスクリプション型ホストオプション
  - H3: OpenCode
  - H3: Google Gemini (APIキー)
  - H3: Google VertexとGemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: その他のバンドル済みプロバイダーPlugin
  - H4: 知っておく価値のある癖
  - H2: models.providers経由のプロバイダー (カスタム/base URL)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi coding
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (International)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: ローカルプロキシ (LM Studio、vLLM、LiteLLMなど)
  - H2: CLI例
  - H2: 関連

## concepts/models.md

- ルート: /concepts/models
- 見出し:
  - H2: モデル選択の仕組み
  - H2: 選択ソースとフォールバック動作
  - H2: クイックモデルポリシー
  - H2: オンボーディング (推奨)
  - H2: 設定キー (概要)
  - H3: 安全な許可リスト編集
  - H2: 「Model is not allowed」(および返信が停止する理由)
  - H2: チャットでモデルを切り替える (/model)
  - H2: CLIコマンド
  - H3: models list
  - H3: models status
  - H2: スキャン (OpenRouter無料モデル)
  - H2: モデルレジストリ (models.json)
  - H2: 関連

## concepts/multi-agent.md

- ルート: /concepts/multi-agent
- 見出し:
  - H2: 「1つのエージェント」とは
  - H2: パス (クイックマップ)
  - H3: 単一エージェントモード (デフォルト)
  - H2: エージェントヘルパー
  - H2: クイックスタート
  - H2: 複数のエージェント = 複数の人、複数の人格
  - H2: エージェント間QMDメモリ検索
  - H2: 1つのWhatsApp番号、複数の人 (DM分割)
  - H2: ルーティングルール (メッセージがエージェントを選ぶ方法)
  - H2: 複数のアカウント / 電話番号
  - H2: 概念
  - H2: プラットフォーム例
  - H2: 一般的なパターン
  - H2: エージェントごとのサンドボックスとツール設定
  - H2: 関連

## concepts/oauth.md

- ルート: /concepts/oauth
- 見出し:
  - H2: トークンシンク (存在する理由)
  - H2: ストレージ (トークンの保存場所)
  - H2: Anthropicレガシートークン互換性
  - H2: Anthropic Claude CLI移行
  - H2: OAuth交換 (ログインの仕組み)
  - H3: Anthropicセットアップトークン
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: 更新 + 有効期限
  - H2: 複数アカウント (プロファイル) + ルーティング
  - H3: 1) 推奨: エージェントを分ける
  - H3: 2) 高度: 1つのエージェント内で複数プロファイル
  - H2: 関連

## concepts/parallel-specialist-lanes.md

- ルート: /concepts/parallel-specialist-lanes
- 見出し:
  - H2: 第一原則
  - H2: 推奨ロールアウト
  - H3: フェーズ 1: レーン契約 + バックグラウンドの重い作業
  - H3: フェーズ 2: 優先度と並行実行制御
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
  - H4: 単発の CLI コマンドが表示されない理由
  - H3: 3) system-event ビーコン
  - H3: 4) Node 接続（role: node）
  - H2: マージ + 重複排除ルール（instanceId が重要な理由）
  - H2: TTL とサイズ上限
  - H2: リモート/トンネルの注意点（ループバック IP）
  - H2: コンシューマー
  - H3: macOS のインスタンスタブ
  - H2: デバッグのヒント
  - H2: 関連

## concepts/progress-drafts.md

- ルート: /concepts/progress-drafts
- 見出し:
  - H2: クイックスタート
  - H2: ユーザーに表示される内容
  - H2: モードを選択する
  - H2: ラベルを設定する
  - H2: 進捗行を制御する
  - H2: チャネルの動作
  - H2: 完了処理
  - H2: トラブルシューティング
  - H2: 関連

## concepts/qa-e2e-automation.md

- ルート: /concepts/qa-e2e-automation
- 見出し:
  - H2: コマンドサーフェス
  - H2: オペレーターフロー
  - H2: ライブトランスポート対象範囲
  - H2: Telegram、Discord、Slack、WhatsApp の QA リファレンス
  - H3: 共通 CLI フラグ
  - H3: Telegram QA
  - H3: Discord QA
  - H3: Slack QA
  - H4: Slack ワークスペースのセットアップ
  - H3: WhatsApp QA
  - H3: Convex 認証情報プール
  - H2: リポジトリに基づくシード
  - H2: プロバイダーモックレーン
  - H2: トランスポートアダプター
  - H3: チャネルを追加する
  - H3: シナリオヘルパー名
  - H2: レポート
  - H2: 関連ドキュメント

## concepts/qa-matrix.md

- ルート: /concepts/qa-matrix
- 見出し:
  - H2: クイックスタート
  - H2: レーンの動作
  - H2: CLI
  - H3: 共通フラグ
  - H3: プロバイダーフラグ
  - H2: プロファイル
  - H2: シナリオ
  - H2: 環境変数
  - H2: 出力アーティファクト
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
  - H2: セッションごとのオーバーライド
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
  - H2: 注意事項
  - H2: 関連

## concepts/session-pruning.md

- ルート: /concepts/session-pruning
- 見出し:
  - H2: 重要な理由
  - H2: 仕組み
  - H2: レガシー画像クリーンアップ
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
  - H2: クロスセッションメッセージの送信
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
  - H3: Dock 連携チャネル
  - H2: セッションライフサイクル
  - H2: 状態の保存場所
  - H2: セッションメンテナンス
  - H2: セッションの検査
  - H2: 参考資料
  - H2: 関連

## concepts/soul.md

- ルート: /concepts/soul
- 見出し:
  - H2: SOUL.md に含める内容
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
  - H2: チャンキングアルゴリズム（下限/上限）
  - H2: コアレッシング（ストリーミングされたブロックのマージ）
  - H2: ブロック間の人間らしいペーシング
  - H2: 「チャンクをストリームするか、すべてをストリームするか」
  - H2: プレビューストリーミングモード
  - H3: チャネルマッピング
  - H3: ランタイム動作
  - H3: ツール進捗プレビュー更新
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
  - H2: 3 つのタイムゾーンサーフェス
  - H2: ユーザータイムゾーンの設定
  - H2: オーバーライドする場合
  - H2: 関連

## concepts/typebox.md

- ルート: /concepts/typebox
- 見出し:
  - H2: メンタルモデル（30 秒）
  - H2: スキーマの場所
  - H2: 現在のパイプライン
  - H2: ランタイムでのスキーマの使われ方
  - H2: フレーム例
  - H2: 最小クライアント（Node.js）
  - H2: 実例: メソッドをエンドツーエンドで追加する
  - H2: Swift コード生成の動作
  - H2: バージョニング + 互換性
  - H2: スキーマパターンと規約
  - H2: ライブスキーマ JSON
  - H2: スキーマを変更するとき
  - H2: 関連

## concepts/typing-indicators.md

- ルート: /concepts/typing-indicators
- 見出し:
  - H2: デフォルト
  - H2: モード
  - H2: 設定
  - H2: 注意事項
  - H2: 関連

## concepts/usage-tracking.md

- ルート: /concepts/usage-tracking
- 見出し:
  - H2: 概要
  - H2: 表示される場所
  - H2: デフォルトの使用状況フッターモード
  - H3: 3 つの異なるセッション状態
  - H3: 優先順位
  - H3: リセットとオフ化の違い
  - H3: トグル動作
  - H3: 設定
  - H2: カスタム /usage full フッター
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
  - H3: ユーザータイムゾーン + 形式を設定する
  - H2: 時刻形式の検出（自動）
  - H2: ツールペイロード + コネクター（生のプロバイダー時刻 + 正規化済みフィールド）
  - H2: 関連ドキュメント

## debug/node-issue.md

- ルート: /debug/node-issue
- 見出し:
  - H1: Node + tsx の "\\name is not a function" クラッシュ
  - H2: 概要
  - H2: 環境
  - H2: 再現（Node のみ）
  - H2: リポジトリ内の最小再現
  - H2: Node バージョンチェック
  - H2: メモ / 仮説
  - H2: リグレッション履歴
  - H2: 回避策
  - H2: 参考資料
  - H2: 次のステップ
  - H2: 関連

## diagnostics/flags.md

- ルート: /diagnostics/flags
- 見出し:
  - H2: 仕組み
  - H2: 設定で有効化
  - H2: 環境変数オーバーライド（単発）
  - H2: プロファイリングフラグ
  - H2: タイムラインアーティファクト
  - H2: ログの出力先
  - H2: ログの抽出
  - H2: 注意事項
  - H2: 関連

## gateway/authentication.md

- ルート: /gateway/authentication
- 見出し:
  - H2: 推奨セットアップ（API キー、任意のプロバイダー）
  - H2: Anthropic: Claude CLI とトークン互換性
  - H2: Anthropic の注意事項
  - H2: モデル認証ステータスの確認
  - H2: API キーのローテーション動作（gateway）
  - H2: Gateway 実行中にプロバイダー認証を削除する
  - H2: 使用する認証情報を制御する
  - H3: OpenAI とレガシー openai-codex ID
  - H3: ログイン中（CLI）
  - H3: セッションごと（チャットコマンド）
  - H3: エージェントごと（CLI オーバーライド）
  - H2: トラブルシューティング
  - H3: 「認証情報が見つかりません」
  - H3: トークンの期限切れ/期限切れ済み
  - H2: 関連

## gateway/background-process.md

- ルート: /gateway/background-process
- 見出し:
  - H2: exec ツール
  - H2: 子プロセスブリッジ
  - H2: process ツール
  - H2: 例
  - H2: 関連

## gateway/bonjour.md

- ルート: /gateway/bonjour
- 見出し:
  - H2: Tailscale 経由のワイドエリア Bonjour（Unicast DNS-SD）
  - H3: Gateway 設定（推奨）
  - H3: 1 回限りの DNS サーバーセットアップ（gateway ホスト）
  - H3: Tailscale DNS 設定
  - H3: Gateway リスナーセキュリティ（推奨）
  - H2: アドバタイズされる内容
  - H2: サービスタイプ
  - H2: TXT キー（秘密ではないヒント）
  - H2: macOS でのデバッグ
  - H2: Gateway ログでのデバッグ
  - H2: iOS node でのデバッグ
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
  - H2: Exec ライフサイクルイベント
  - H2: 過去の tailnet 使用
  - H2: バージョニング
  - H2: 関連

## gateway/cli-backends.md

- ルート: /gateway/cli-backends
- 見出し:
  - H2: 初心者向けクイックスタート
  - H2: フォールバックとして使用する
  - H2: 設定の概要
  - H3: 設定例
  - H2: 仕組み
  - H2: セッション
  - H2: claude-cli セッションからのフォールバック前置き
  - H2: 画像（パススルー）
  - H2: 入力 / 出力
  - H2: デフォルト（Plugin 所有）
  - H2: Plugin 所有のデフォルト
  - H2: ネイティブ Compaction 所有権
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
  - H3: エージェントごとのブートストラッププロファイルオーバーライド
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: コンテキスト予算所有権マップ
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
  - H3: agents.list（エージェントごとのオーバーライド）
  - H2: マルチエージェントルーティング
  - H3: バインディング一致フィールド
  - H3: エージェントごとのアクセスプロファイル
  - H2: セッション
  - H2: メッセージ
  - H3: 応答プレフィックス
  - H3: Ack リアクション
  - H3: インバウンドデバウンス
  - H3: TTS（テキスト読み上げ）
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
  - H3: グループチャットのメンションゲーティング
  - H4: DM 履歴上限
  - H4: セルフチャットモード
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
  - H2: 展開例（主要オプション）
  - H3: シンボリックリンクされた兄弟 skill リポジトリ
  - H2: よくあるパターン
  - H3: 1 つの上書きを持つ共有 skill ベースライン
  - H3: マルチプラットフォーム設定
  - H3: 信頼済み Node ネットワークの自動承認
  - H3: セキュア DM モード（共有受信箱 / マルチユーザー DM）
  - H3: Anthropic API キー + MiniMax フォールバック
  - H3: 作業用ボット（制限付きアクセス）
  - H3: ローカルモデルのみ
  - H2: ヒント
  - H2: 関連

## gateway/configuration-reference.md

- ルート: /gateway/configuration-reference
- 見出し:
  - H2: チャネル
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
  - H3: Gmail 統合
  - H2: Canvas Plugin ホスト
  - H2: 検出
  - H3: mDNS (Bonjour)
  - H3: 広域 (DNS-SD)
  - H2: 環境
  - H3: env（インライン環境変数）
  - H3: 環境変数の置換
  - H2: シークレット
  - H3: SecretRef
  - H3: サポートされる認証情報サーフェス
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
  - H2: Bridge（レガシー、削除済み）
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: メディアモデルテンプレート変数
  - H2: 設定インクルード ($include)
  - H2: 関連

## gateway/configuration.md

- ルート: /gateway/configuration
- 見出し:
  - H2: 最小構成
  - H2: 設定の編集
  - H2: 厳密な検証
  - H2: よくあるタスク
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
  - H2: ペアリング + 認証（直接トランスポート）
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
  - H2: 現在利用できるもの
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
  - H2: 稼働時間モニタリング
  - H3: モニタリングサービスの設定例
  - H2: 何かが失敗したとき
  - H2: 専用の「health」コマンド
  - H2: 関連

## gateway/heartbeat.md

- ルート: /gateway/heartbeat
- 見出し:
  - H2: クイックスタート（初心者向け）
  - H2: デフォルト
  - H2: Heartbeat プロンプトの目的
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
  - H3: 各フラグの動作
  - H3: チャネルごと vs アカウントごとの例
  - H3: よくあるパターン
  - H2: HEARTBEAT.md（任意）
  - H3: tasks: ブロック
  - H3: エージェントは HEARTBEAT.md を更新できるか？
  - H2: 手動ウェイク（オンデマンド）
  - H2: 推論の配信（任意）
  - H2: コスト意識
  - H2: Heartbeat 後のコンテキストオーバーフロー
  - H2: 関連

## gateway/index.md

- ルート: /gateway
- 見出し:
  - H2: 5 分のローカル起動
  - H2: ランタイムモデル
  - H2: OpenAI 互換エンドポイント
  - H3: ポートとバインドの優先順位
  - H3: ホットリロードモード
  - H2: オペレーターコマンドセット
  - H2: 複数の Gateway（同一ホスト）
  - H2: リモートアクセス
  - H2: 監視とサービスライフサイクル
  - H2: 開発プロファイルのクイックパス
  - H2: プロトコルクイックリファレンス（オペレータービュー）
  - H2: 運用チェック
  - H3: 稼働性
  - H3: 準備状態
  - H3: ギャップ復旧
  - H2: よくある失敗シグネチャ
  - H2: 安全性保証
  - H2: 関連

## gateway/local-model-services.md

- ルート: /gateway/local-model-services
- 見出し:
  - H2: 仕組み
  - H2: 設定の形
  - H2: フィールド
  - H2: Inferrs 例
  - H2: ds4 例
  - H2: 運用上の注意
  - H2: 関連

## gateway/local-models.md

- ルート: /gateway/local-models
- 見出し:
  - H2: ハードウェア下限
  - H2: バックエンドを選ぶ
  - H2: 推奨: LM Studio + 大規模ローカルモデル（Responses API）
  - H3: ハイブリッド設定: ホスト型をプライマリ、ローカルをフォールバック
  - H3: ローカル優先、ホスト型のセーフティネット付き
  - H3: リージョンホスティング / データルーティング
  - H2: その他の OpenAI 互換ローカルプロキシ
  - H2: より小規模またはより厳格なバックエンド
  - H2: トラブルシューティング
  - H2: 関連

## gateway/logging.md

- ルート: /gateway/logging
- 見出し:
  - H1: ロギング
  - H2: ファイルベースのロガー
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
  - H2: --profile rescue onboard の変更点
  - H2: 一般的なマルチ Gateway 設定
  - H2: 分離チェックリスト
  - H2: ポートマッピング（派生）
  - H2: Browser/CDP の注意（よくある落とし穴）
  - H2: 手動 env 例
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
  - H2: このエンドポイントを使う場面
  - H2: エージェントファーストモデル契約
  - H2: エンドポイントの有効化
  - H2: エンドポイントの無効化
  - H2: セッション動作
  - H2: このサーフェスが重要な理由
  - H2: モデル一覧とエージェントルーティング
  - H2: ストリーミング (SSE)
  - H2: チャットツール契約
  - H3: サポートされるリクエストフィールド
  - H3: サポートされないバリアント
  - H3: 非ストリーミングツールレスポンスの形
  - H3: ストリーミングツールレスポンスの形
  - H3: ツールフォローアップループ
  - H2: Open WebUI クイック設定
  - H2: 例
  - H2: 関連

## gateway/openresponses-http-api.md

- ルート: /gateway/openresponses-http-api
- 見出し:
  - H2: 認証、セキュリティ、ルーティング
  - H2: セッション動作
  - H2: リクエスト形状（サポート対象）
  - H2: アイテム（入力）
  - H3: message
  - H3: functioncalloutput（ターンベースツール）
  - H3: reasoning と itemreference
  - H2: ツール（クライアント側関数ツール）
  - H2: 画像（inputimage）
  - H2: ファイル（inputfile）
  - H2: ファイル + 画像の上限（設定）
  - H2: ストリーミング (SSE)
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
  - H3: モードを選択する
  - H2: 設定リファレンス
  - H2: 例
  - H3: 最小リモート設定
  - H3: GPU を使うミラーモード
  - H3: カスタム Gateway を使うエージェントごとの OpenShell
  - H2: ライフサイクル管理
  - H3: 再作成するタイミング
  - H2: セキュリティ強化
  - H2: 現在の制限
  - H2: 仕組み
  - H2: 関連

## gateway/opentelemetry.md

- ルート: /gateway/opentelemetry
- 見出し:
  - H2: 全体の仕組み
  - H2: クイックスタート
  - H2: エクスポートされるシグナル
  - H2: 設定リファレンス
  - H3: 環境変数
  - H2: プライバシーとコンテンツキャプチャ
  - H2: サンプリングとフラッシュ
  - H2: エクスポートされるメトリクス
  - H3: モデル使用量
  - H3: メッセージフロー
  - H3: Talk
  - H3: キューとセッション
  - H3: セッション稼働性テレメトリ
  - H3: ハーネスライフサイクル
  - H3: ツール実行
  - H3: Exec
  - H3: 診断内部（メモリとツールループ）
  - H2: エクスポートされるスパン
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
  - H2: Node イベントの信頼境界（2026.3.31+）
  - H2: 自動承認（macOS アプリ）
  - H2: 信頼済み CIDR デバイスの自動承認
  - H2: メタデータアップグレード自動承認
  - H2: QR ペアリングヘルパー
  - H2: 局所性と転送ヘッダー
  - H2: ストレージ（ローカル、非公開）
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
  - H3: Node 例
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
  - H2: TLS + ピン留め
  - H2: スコープ
  - H2: 関連

## gateway/remote-gateway-readme.md

- ルート: /gateway/remote-gateway-readme
- 見出し:
  - H1: リモート Gateway で OpenClaw.app を実行する
  - H2: 概要
  - H2: クイック設定
  - H3: ステップ 1: SSH Config を追加する
  - H3: ステップ 2: SSH キーをコピーする
  - H3: ステップ 3: リモート Gateway 認証を設定する
  - H3: ステップ 4: SSH トンネルを開始する
  - H3: ステップ 5: OpenClaw.app を再起動する
  - H2: ログイン時にトンネルを自動起動
  - H3: PLIST ファイルを作成する
  - H3: Launch Agent を読み込む
  - H2: トラブルシューティング
  - H2: 仕組み
  - H2: 関連

## gateway/remote.md

- ルート: /gateway/remote
- 見出し:
  - H2: 中核となる考え方
  - H2: 一般的な VPN と tailnet のセットアップ
  - H3: tailnet 内の常時稼働 Gateway
  - H3: 自宅のデスクトップで Gateway を実行
  - H3: ノート PC で Gateway を実行
  - H2: コマンドフロー（どこで何が実行されるか）
  - H2: SSH トンネル（CLI + ツール）
  - H2: CLI リモートのデフォルト
  - H2: 認証情報の優先順位
  - H2: チャット UI のリモートアクセス
  - H2: macOS アプリのリモートモード
  - H2: セキュリティルール（リモート/VPN）
  - H3: macOS: LaunchAgent による永続 SSH トンネル
  - H4: ステップ 1: SSH 設定を追加
  - H4: ステップ 2: SSH キーをコピー（一度だけ）
  - H4: ステップ 3: gateway トークンを設定
  - H4: ステップ 4: LaunchAgent を作成
  - H4: ステップ 5: LaunchAgent をロード
  - H4: トラブルシューティング
  - H2: 関連

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- ルート: /gateway/sandbox-vs-tool-policy-vs-elevated
- 見出し:
  - H2: クイックデバッグ
  - H2: サンドボックス: ツールが実行される場所
  - H3: バインドマウント（セキュリティのクイックチェック）
  - H2: ツールポリシー: 存在し呼び出せるツール
  - H3: ツールグループ（省略形）
  - H2: 昇格: exec 専用の「ホストで実行」
  - H2: 一般的な「サンドボックス jail」の修正
  - H3: 「ツール X がサンドボックスのツールポリシーでブロックされました」
  - H3: 「これは main だと思ったのに、なぜサンドボックス化されているのですか？」
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
  - H2: ツールポリシーとエスケープハッチ
  - H2: マルチエージェントのオーバーライド
  - H2: 最小の有効化例
  - H2: 関連

## gateway/secrets-plan-contract.md

- ルート: /gateway/secrets-plan-contract
- 見出し:
  - H2: プランファイルの形状
  - H2: プロバイダーの upsert と削除
  - H2: サポートされるターゲットスコープ
  - H2: ターゲットタイプの動作
  - H2: パス検証ルール
  - H2: 失敗時の動作
  - H2: Exec プロバイダーの同意動作
  - H2: ランタイムと監査スコープの注記
  - H2: オペレーターチェック
  - H2: 関連ドキュメント

## gateway/secrets.md

- ルート: /gateway/secrets
- 見出し:
  - H2: 目標とランタイムモデル
  - H2: エージェントアクセス境界
  - H2: アクティブサーフェスのフィルタリング
  - H2: Gateway 認証サーフェス診断
  - H2: オンボーディング参照の事前確認
  - H2: SecretRef コントラクト
  - H2: プロバイダー設定
  - H2: ファイルベースの API キー
  - H2: Exec 統合例
  - H2: MCP サーバー環境変数
  - H2: サンドボックス SSH 認証素材
  - H2: サポートされる認証情報サーフェス
  - H2: 必須の動作と優先順位
  - H2: アクティベーショントリガー
  - H2: 劣化および復旧シグナル
  - H2: コマンドパスの解決
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
  - H2: 公開パターンを選択
  - H2: 事前インベントリ
  - H2: ベースラインチェック
  - H2: 最小安全ベースライン
  - H2: DM とグループの公開
  - H2: リバースプロキシチェック
  - H2: ツールとサンドボックスのレビュー
  - H2: 変更後の検証
  - H2: ロールバック計画
  - H2: レビューチェックリスト

## gateway/security/index.md

- ルート: /gateway/security
- 見出し:
  - H2: まずスコープ: 個人アシスタントのセキュリティモデル
  - H2: クイックチェック: openclaw security audit
  - H3: 公開パッケージの依存関係ロック
  - H3: デプロイとホスト信頼
  - H3: 安全なファイル操作
  - H3: 共有 Slack ワークスペース: 実際のリスク
  - H3: 会社共有エージェント: 許容されるパターン
  - H2: Gateway とノードの信頼概念
  - H2: 信頼境界マトリクス
  - H2: 設計上、脆弱性ではないもの
  - H2: 60 秒で強化済みベースライン
  - H2: 共有受信箱のクイックルール
  - H2: コンテキスト可視性モデル
  - H2: 監査で確認する内容（高レベル）
  - H2: 認証情報ストレージマップ
  - H2: セキュリティ監査チェックリスト
  - H2: セキュリティ監査用語集
  - H2: HTTP 経由のコントロール UI
  - H2: 安全でない、または危険なフラグの概要
  - H2: リバースプロキシ設定
  - H2: HSTS とオリジンの注記
  - H2: ローカルセッションログはディスク上に存在
  - H2: ノード実行（system.run）
  - H2: 動的 Skills（watcher / リモートノード）
  - H2: 脅威モデル
  - H2: 中核概念: インテリジェンスの前にアクセス制御
  - H2: コマンド認可モデル
  - H2: コントロールプレーンツールのリスク
  - H2: Plugins
  - H2: DM アクセスモデル: ペアリング、許可リスト、オープン、無効
  - H2: DM セッション分離（マルチユーザーモード）
  - H3: セキュア DM モード（推奨）
  - H2: DM とグループの許可リスト
  - H2: プロンプトインジェクション（それが何か、なぜ重要か）
  - H2: 外部コンテンツの特殊トークンサニタイズ
  - H2: 安全でない外部コンテンツバイパスフラグ
  - H3: プロンプトインジェクションに公開 DM は不要
  - H3: セルフホスト LLM バックエンド
  - H3: モデル強度（セキュリティ注記）
  - H2: グループでの reasoning と詳細出力
  - H2: 設定強化の例
  - H3: ファイル権限
  - H3: ネットワーク公開（bind、ポート、ファイアウォール）
  - H3: UFW での Docker ポート公開
  - H3: mDNS/Bonjour discovery
  - H3: Gateway WebSocket をロックダウン（ローカル認証）
  - H3: Tailscale Serve ID ヘッダー
  - H3: ノードホスト経由のブラウザー制御（推奨）
  - H3: ディスク上のシークレット
  - H3: ワークスペース .env ファイル
  - H3: ログとトランスクリプト（秘匿化と保持）
  - H3: DM: デフォルトでペアリング
  - H3: グループ: どこでもメンションを必須化
  - H3: 別々の番号（WhatsApp、Signal、Telegram）
  - H3: 読み取り専用モード（サンドボックスとツール経由）
  - H3: セキュアベースライン（コピー/貼り付け）
  - H2: サンドボックス化（推奨）
  - H3: サブエージェント委譲のガードレール
  - H2: ブラウザー制御のリスク
  - H3: ブラウザー SSRF ポリシー（デフォルトで厳格）
  - H2: エージェントごとのアクセスプロファイル（マルチエージェント）
  - H3: 例: フルアクセス（サンドボックスなし）
  - H3: 例: 読み取り専用ツール + 読み取り専用ワークスペース
  - H3: 例: ファイルシステム/シェルアクセスなし（プロバイダーメッセージングは許可）
  - H2: インシデント対応
  - H3: 封じ込め
  - H3: ローテーション（シークレットが漏洩した場合は侵害を想定）
  - H3: 監査
  - H3: レポート用に収集
  - H2: シークレットスキャン
  - H2: セキュリティ問題の報告

## gateway/security/secure-file-operations.md

- ルート: /gateway/security/secure-file-operations
- 見出し:
  - H2: デフォルト: Python ヘルパーなし
  - H2: Python なしでも保護されるもの
  - H2: Python が追加するもの
  - H2: Plugin とコアのガイダンス

## gateway/security/shrinkwrap.md

- ルート: /gateway/security/shrinkwrap
- 見出し:
  - H2: 簡単なバージョン
  - H2: OpenClaw がそれを使う理由
  - H2: 技術詳細

## gateway/tailscale.md

- ルート: /gateway/tailscale
- 見出し:
  - H2: モード
  - H2: 認証
  - H2: 設定例
  - H3: tailnet のみ（Serve）
  - H3: tailnet のみ（Tailnet IP にバインド）
  - H3: 公開インターネット（Funnel + 共有パスワード）
  - H2: CLI 例
  - H2: 注記
  - H2: ブラウザー制御（リモート Gateway + ローカルブラウザー）
  - H2: Tailscale の前提条件 + 制限
  - H2: さらに詳しく
  - H2: 関連

## gateway/tools-invoke-http-api.md

- ルート: /gateway/tools-invoke-http-api
- 見出し:
  - H2: 認証
  - H2: セキュリティ境界（重要）
  - H2: リクエスト本文
  - H2: ポリシー + ルーティング動作
  - H2: レスポンス
  - H2: 例
  - H2: 関連

## gateway/troubleshooting.md

- ルート: /gateway/troubleshooting
- 見出し:
  - H2: コマンドラダー
  - H2: 更新後
  - H2: スプリットブレインインストールと新しい設定ガード
  - H2: ロールバック後のプロトコル不一致
  - H2: パスエスケープとして Skill シンボリックリンクがスキップされました
  - H2: Anthropic 429 では長いコンテキストに追加 usage が必要
  - H2: upstream 403 ブロック応答
  - H2: ローカル OpenAI 互換バックエンドは直接プローブに通るが、エージェント実行は失敗する
  - H2: 返信がない
  - H2: ダッシュボードコントロール UI の接続性
  - H3: 認証詳細コードのクイックマップ
  - H2: Gateway サービスが実行されていない
  - H2: macOS gateway が静かに応答を停止し、ダッシュボードに触れると再開する
  - H2: 高メモリ使用時に Gateway が終了する
  - H2: Gateway が無効な設定を拒否した
  - H2: Gateway プローブ警告
  - H2: チャネルは接続済みだが、メッセージが流れない
  - H2: Cron と heartbeat 配信
  - H2: Node はペアリング済みだが、ツールが失敗する
  - H2: ブラウザーツールが失敗する
  - H2: アップグレード後に何かが突然壊れた場合
  - H2: 関連

## gateway/trusted-proxy-auth.md

- ルート: /gateway/trusted-proxy-auth
- 見出し:
  - H2: 使用する場合
  - H2: 使用しない場合
  - H2: 仕組み
  - H2: コントロール UI のペアリング動作
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
  - H2: 生ストリームログ（OpenClaw）
  - H2: 生 OpenAI 互換チャンクログ
  - H2: 安全上の注記
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
  - H2: Exec シェルスナップショット
  - H2: ランタイム注入 env vars
  - H2: UI env vars
  - H2: 設定内の env var 置換
  - H2: Secret refs と ${ENV} 文字列
  - H2: パス関連 env vars
  - H2: ロギング
  - H3: OPENCLAWHOME
  - H2: nvm ユーザー: webfetch TLS 障害
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
  - H2: モデルフェイルオーバーと「すべてのモデルが失敗しました」
  - H2: 認証プロファイル: それらが何で、どのように管理するか
  - H2: 関連

## help/faq.md

- ルート: /help/faq
- 見出し:
  - H2: 何かが壊れた場合の最初の 60 秒
  - H2: クイックスタートと初回実行セットアップ
  - H2: OpenClaw とは？
  - H2: Skills と自動化
  - H2: サンドボックス化とメモリ
  - H2: ディスク上の配置場所
  - H2: 設定の基本
  - H2: リモート Gateway とノード
  - H2: env vars と .env 読み込み
  - H2: セッションと複数チャット
  - H2: モデル、フェイルオーバー、認証プロファイル
  - H2: Gateway: ポート、「すでに実行中」、リモートモード
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
  - H2: ライブ: モデルマトリックス（カバー範囲）
  - H3: 最新スモークセット（ツール呼び出し + 画像）
  - H3: ベースライン: ツール呼び出し（Read + 任意の Exec）
  - H3: ビジョン: 画像送信（添付ファイル → マルチモーダルメッセージ）
  - H3: アグリゲーター / 代替 Gateway
  - H2: 認証情報（絶対にコミットしない）
  - H2: Deepgram ライブ（音声文字起こし）
  - H2: BytePlus コーディングプランライブ
  - H2: ComfyUI ワークフローメディアライブ
  - H2: 画像生成ライブ
  - H2: 音楽生成ライブ
  - H2: 動画生成ライブ
  - H2: メディアライブハーネス
  - H2: 関連

## help/testing-updates-plugins.md

- ルート: /help/testing-updates-plugins
- 見出し:
  - H2: 保護する対象
  - H2: 開発中のローカル証明
  - H2: Docker レーン
  - H2: パッケージ受け入れ
  - H2: リリース既定値
  - H2: レガシー互換性
  - H2: カバレッジの追加
  - H2: 失敗のトリアージ

## help/testing.md

- ルート: /help/testing
- 見出し:
  - H2: クイックスタート
  - H2: テスト用一時ディレクトリ
  - H2: QA 固有のランナー
  - H3: Convex 経由の共有 Telegram 認証情報（v1）
  - H3: QA へのチャネル追加
  - H2: テストスイート（どこで何が実行されるか）
  - H3: ユニット / 統合（既定）
  - H3: 安定性（Gateway）
  - H3: E2E（リポジトリ集約）
  - H3: E2E（Gateway スモーク）
  - H3: E2E（Control UI モックブラウザー）
  - H3: E2E: OpenShell バックエンドスモーク
  - H3: ライブ（実プロバイダー + 実モデル）
  - H2: どのスイートを実行すべきか
  - H2: ライブ（ネットワークに触れる）テスト
  - H2: Docker ランナー（任意の「Linux で動作する」チェック）
  - H2: ドキュメント健全性
  - H2: オフライン回帰（CI セーフ）
  - H2: エージェント信頼性評価（Skills）
  - H2: 契約テスト（Plugin とチャネルの形状）
  - H3: コマンド
  - H3: チャネル契約
  - H3: プロバイダーステータス契約
  - H3: プロバイダー契約
  - H3: 実行するタイミング
  - H2: 回帰の追加（ガイダンス）
  - H2: 関連

## help/troubleshooting.md

- ルート: /help/troubleshooting
- 見出し:
  - H2: 最初の 60 秒
  - H2: アシスタントが制限されている、またはツールが見つからないように感じる
  - H2: Anthropic 長大コンテキスト 429
  - H2: ローカル OpenAI 互換バックエンドは直接なら動くが OpenClaw では失敗する
  - H2: Plugin インストールが openclaw extensions 不足で失敗する
  - H2: インストールポリシーが Plugin のインストールまたは更新をブロックする
  - H2: Plugin は存在するが疑わしい所有権によりブロックされている
  - H2: 判断ツリー
  - H2: 関連

## index.md

- ルート: /
- 見出し:
  - H1: OpenClaw 🦞
  - H2: OpenClaw とは
  - H2: 仕組み
  - H2: 主な機能
  - H2: クイックスタート
  - H2: ダッシュボード
  - H2: 設定（任意）
  - H2: ここから始める
  - H2: さらに詳しく

## install/ansible.md

- ルート: /install/ansible
- 見出し:
  - H2: 前提条件
  - H2: 得られるもの
  - H2: クイックスタート
  - H2: インストールされるもの
  - H2: インストール後セットアップ
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
  - H2: 行うこと
  - H2: 必要なもの
  - H2: デプロイの設定
  - H2: Azure リソースのデプロイ
  - H2: OpenClaw のインストール
  - H2: コストに関する考慮事項
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
  - H3: コンテナアクセス
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
  - H2: 単発のバージョンまたはタグ指定
  - H2: ドライラン
  - H2: Plugins とチャネル
  - H2: 現在のステータス確認
  - H2: タグ付けのベストプラクティス
  - H2: macOS アプリの提供状況
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
  - H2: ビルドと起動
  - H2: どこに何が永続化されるか
  - H2: 更新
  - H2: 関連

## install/docker.md

- ルート: /install/docker
- 見出し:
  - H2: Docker は自分に適しているか
  - H2: 前提条件
  - H2: コンテナ化された Gateway
  - H3: 手動フロー
  - H3: 環境変数
  - H3: 可観測性
  - H3: ヘルスチェック
  - H3: LAN と loopback
  - H3: ホストのローカルプロバイダー
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
  - H3: 「アプリが期待されるアドレスでリッスンしていない」
  - H3: ヘルスチェック失敗 / 接続拒否
  - H3: OOM / メモリ問題
  - H3: Gateway ロックの問題
  - H3: 設定が読み取られていない
  - H3: SSH 経由で設定を書き込む
  - H3: 状態が永続化されない
  - H2: 更新
  - H3: マシン更新コマンド
  - H2: プライベートデプロイ（強化済み）
  - H3: プライベートデプロイを使うタイミング
  - H3: セットアップ
  - H3: プライベートデプロイへのアクセス
  - H3: プライベートデプロイでの Webhook
  - H3: セキュリティ上の利点
  - H2: 注記
  - H2: コスト
  - H2: 次のステップ
  - H2: 関連

## install/gcp.md

- ルート: /install/gcp
- 見出し:
  - H2: 何をするのか（簡単に）
  - H2: クイックパス（経験のある運用者向け）
  - H2: 必要なもの
  - H2: トラブルシューティング
  - H2: サービスアカウント（セキュリティのベストプラクティス）
  - H2: 次のステップ
  - H2: 関連

## install/hetzner.md

- ルート: /install/hetzner
- 見出し:
  - H2: 目的
  - H2: 何をするのか（簡単に）
  - H2: クイックパス（経験のある運用者向け）
  - H2: 必要なもの
  - H2: Infrastructure as Code（Terraform）
  - H2: 次のステップ
  - H2: 関連

## install/hostinger.md

- ルート: /install/hostinger
- 見出し:
  - H2: 前提条件
  - H2: オプション A: 1 クリック OpenClaw
  - H2: オプション B: VPS 上の OpenClaw
  - H2: セットアップの検証
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
  - H3: コンテナとパッケージマネージャー
  - H2: インストールの検証
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
  - H2: なぜ Helm ではないのか
  - H2: 必要なもの
  - H2: クイックスタート
  - H2: Kind によるローカルテスト
  - H2: ステップバイステップ
  - H3: 1) デプロイ
  - H3: 2) Gateway へのアクセス
  - H2: デプロイされるもの
  - H2: カスタマイズ
  - H3: エージェント指示
  - H3: Gateway 設定
  - H3: プロバイダーの追加
  - H3: カスタム名前空間
  - H3: カスタムイメージ
  - H3: ポートフォワードを超えて公開
  - H2: 再デプロイ
  - H2: ティアダウン
  - H2: アーキテクチャ注記
  - H2: ファイル構造
  - H2: 関連

## install/macos-vm.md

- ルート: /install/macos-vm
- 見出し:
  - H2: 推奨既定値（ほとんどのユーザー）
  - H2: macOS VM オプション
  - H3: Apple Silicon Mac 上のローカル VM（Lume）
  - H3: ホスト型 Mac プロバイダー（クラウド）
  - H2: クイックパス（Lume、経験のあるユーザー向け）
  - H2: 必要なもの（Lume）
  - H2: 1) Lume をインストールする
  - H2: 2) macOS VM を作成する
  - H2: 3) セットアップアシスタントを完了する
  - H2: 4) VM の IP アドレスを取得する
  - H2: 5) VM に SSH する
  - H2: 6) OpenClaw をインストールする
  - H2: 7) チャネルを設定する
  - H2: 8) VM をヘッドレスで実行する
  - H2: ボーナス: iMessage 統合
  - H2: ゴールデンイメージを保存する
  - H2: 24/7 で実行する
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
  - H2: 別のエージェントシステムからインポートする
  - H2: OpenClaw を新しいマシンに移動する
  - H3: 移行手順
  - H3: よくある落とし穴
  - H3: 検証チェックリスト
  - H2: Plugin をその場でアップグレードする
  - H2: 関連

## install/nix.md

- ルート: /install/nix
- 見出し:
  - H2: 得られるもの
  - H2: クイックスタート
  - H2: Nix モードのランタイム動作
  - H3: Nix モードで変わること
  - H3: 設定と状態のパス
  - H3: サービス PATH 検出
  - H2: 関連

## install/node.md

- ルート: /install/node
- 見出し:
  - H2: バージョンを確認する
  - H2: Node をインストールする
  - H2: トラブルシューティング
  - H3: openclaw: command not found
  - H3: npm install -g の権限エラー（Linux）
  - H2: 関連

## install/northflank.mdx

- ルート: /install/northflank
- 見出し:
  - H1: Northflank
  - H2: 始め方
  - H2: 得られるもの
  - H2: チャネルを接続する
  - H2: 次のステップ

## install/oracle.md

- ルート: /install/oracle
- 見出し:
  - H2: 前提条件
  - H2: セットアップ
  - H2: セキュリティ態勢の検証
  - H2: ARM 注記
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
  - H2: 必須 Railway 設定
  - H3: パブリックネットワーキング
  - H3: ボリューム（必須）
  - H3: 変数
  - H2: チャネルを接続する
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
  - H2: ARM バイナリの注意事項
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
  - H3: コールドスタートが遅い (無料枠)
  - H3: 再デプロイ後のデータ損失
  - H3: ヘルスチェックの失敗
  - H2: 次のステップ

## install/uninstall.md

- ルート: /install/uninstall
- 見出し:
  - H2: 簡単な手順 (CLI がまだインストール済み)
  - H2: 手動でのサービス削除 (CLI が未インストール)
  - H3: macOS (launchd)
  - H3: Linux (systemd ユーザーユニット)
  - H3: Windows (スケジュールされたタスク)
  - H2: 通常インストールとソースチェックアウト
  - H3: 通常インストール (install.sh / npm / pnpm / bun)
  - H3: ソースチェックアウト (git clone)
  - H2: 関連

## install/updating.md

- ルート: /install/updating
- 見出し:
  - H2: 推奨: openclaw update
  - H2: npm インストールと git インストールを切り替える
  - H2: 代替: インストーラーを再実行する
  - H2: 代替: 手動の npm、pnpm、または bun
  - H3: npm インストールの高度なトピック
  - H2: 自動アップデーター
  - H2: 更新後
  - H3: doctor を実行する
  - H3: gateway を再起動する
  - H3: 検証する
  - H2: ロールバック
  - H3: バージョンを固定する (npm)
  - H3: コミットを固定する (ソース)
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
  - H3: CLI: ライブ tail (推奨)
  - H3: Control UI (Web)
  - H3: チャネル専用ログ
  - H2: ログ形式
  - H3: ファイルログ (JSONL)
  - H3: コンソール出力
  - H3: Gateway WebSocket ログ
  - H2: ログ設定
  - H3: ログレベル
  - H3: 対象モデルのトランスポート診断
  - H3: トレース相関
  - H3: モデル呼び出しのサイズとタイミング
  - H3: コンソールスタイル
  - H3: リダクション
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
  - H1: 成熟度分類
  - H2: このページの読み方
  - H2: 成熟度レベル
  - H2: プロダクト領域
  - H2: 詳細
  - H3: コア
  - H3: プラットフォーム
  - H3: チャネル
  - H3: プロバイダーとツール

## network.md

- ルート: /network
- 見出し:
  - H2: コアモデル
  - H2: ペアリング + ID
  - H2: 検出 + トランスポート
  - H2: ノード + トランスポート
  - H2: セキュリティ
  - H2: 関連

## nodes/audio.md

- ルート: /nodes/audio
- 見出し:
  - H2: 動作すること
  - H2: 自動検出 (デフォルト)
  - H2: 設定例
  - H3: プロバイダー + CLI フォールバック (OpenAI + Whisper CLI)
  - H3: スコープ制御付きプロバイダーのみ
  - H3: プロバイダーのみ (Deepgram)
  - H3: プロバイダーのみ (Mistral Voxtral)
  - H3: プロバイダーのみ (SenseAudio)
  - H3: 文字起こしをチャットにエコーする (オプトイン)
  - H2: 注意事項と制限
  - H3: プロキシ環境のサポート
  - H2: グループでのメンション検出
  - H2: 注意点
  - H2: 関連

## nodes/camera.md

- ルート: /nodes/camera
- 見出し:
  - H2: iOS ノード
  - H3: ユーザー設定 (デフォルトでオン)
  - H3: コマンド (Gateway node.invoke 経由)
  - H3: フォアグラウンド要件
  - H3: CLI ヘルパー
  - H2: Android ノード
  - H3: Android ユーザー設定 (デフォルトでオン)
  - H3: 権限
  - H3: Android フォアグラウンド要件
  - H3: Android コマンド (Gateway node.invoke 経由)
  - H3: ペイロードガード
  - H2: macOS アプリ
  - H3: ユーザー設定 (デフォルトでオフ)
  - H3: CLI ヘルパー (node invoke)
  - H2: 安全性 + 実用上の制限
  - H2: macOS 画面ビデオ (OS レベル)
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
  - H2: リモートノードホスト (system.run)
  - H3: 何がどこで実行されるか
  - H3: ノードホストを起動する (フォアグラウンド)
  - H3: SSH トンネル経由のリモート gateway (loopback バインド)
  - H3: ノードホストを起動する (サービス)
  - H3: ペアリング + 名前
  - H3: コマンドを許可リストに追加する
  - H3: exec をノードに向ける
  - H2: コマンドの呼び出し
  - H2: コマンドポリシー
  - H2: 設定 (openclaw.json)
  - H2: スクリーンショット (canvas スナップショット)
  - H3: Canvas コントロール
  - H3: A2UI (Canvas)
  - H2: 写真 + 動画 (ノードカメラ)
  - H2: 画面録画 (ノード)
  - H2: 位置情報 (ノード)
  - H2: SMS (Android ノード)
  - H2: Android デバイス + 個人データコマンド
  - H2: システムコマンド (ノードホスト / Mac ノード)
  - H2: Exec ノードバインディング
  - H2: 権限マップ
  - H2: ヘッドレスノードホスト (クロスプラットフォーム)
  - H2: Mac ノードモード

## nodes/location-command.md

- ルート: /nodes/location-command
- 見出し:
  - H2: TL;DR
  - H2: セレクターを使う理由 (単なるスイッチではない)
  - H2: 設定モデル
  - H2: 権限マッピング (node.permissions)
  - H2: コマンド: location.get
  - H2: バックグラウンド動作
  - H2: モデル/ツール統合
  - H2: UX コピー (推奨)
  - H2: 関連

## nodes/media-understanding.md

- ルート: /nodes/media-understanding
- 見出し:
  - H2: 目標
  - H2: 高レベルの動作
  - H2: 設定概要
  - H3: モデルエントリ
  - H3: プロバイダー認証情報 (apiKey)
  - H2: デフォルトと制限
  - H3: メディア理解の自動検出 (デフォルト)
  - H3: プロキシ環境のサポート (プロバイダーモデル)
  - H2: 機能 (任意)
  - H2: プロバイダーサポート表 (OpenClaw インテグレーション)
  - H2: モデル選択ガイダンス
  - H2: 添付ファイルポリシー
  - H2: 設定例
  - H2: ステータス出力
  - H2: 注意事項
  - H2: 関連

## nodes/talk.md

- ルート: /nodes/talk
- 見出し:
  - H2: 動作 (macOS)
  - H2: 返信内の音声指示
  - H2: 設定 (/.openclaw/openclaw.json)
  - H2: macOS UI
  - H2: Android UI
  - H2: 注意事項
  - H2: 関連

## nodes/troubleshooting.md

- ルート: /nodes/troubleshooting
- 見出し:
  - H2: コマンド階層
  - H2: フォアグラウンド要件
  - H2: 権限マトリクス
  - H2: ペアリングと承認
  - H2: 一般的なノードエラーコード
  - H2: 高速復旧ループ
  - H2: 関連

## nodes/voicewake.md

- ルート: /nodes/voicewake
- 見出し:
  - H2: ストレージ (Gateway ホスト)
  - H2: プロトコル
  - H3: メソッド
  - H3: ルーティングメソッド (トリガー → ターゲット)
  - H3: イベント
  - H2: クライアント動作
  - H3: macOS アプリ
  - H3: iOS ノード
  - H3: Android ノード
  - H2: 関連

## openclaw-agent-runtime.md

- ルート: /openclaw-agent-runtime
- 見出し:
  - H2: 型チェックと lint
  - H2: Agent Runtime テストの実行
  - H2: 手動テスト
  - H2: クリーンスレートリセット
  - H2: 参照
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
  - H3: コンテキストエンジンの組み立ては Codex 入力へ投影する必要がある
  - H3: プロンプトキャッシュの安定性が重要
  - H3: ランタイム選択セマンティクスは変更しない
  - H2: 実装計画
  - H3: 1. 再利用可能なコンテキストエンジン試行ヘルパーをエクスポートまたは移動する
  - H3: 2. Codex コンテキスト投影ヘルパーを追加する
  - H3: 3. Codex スレッド起動前に bootstrap を配線する
  - H3: 4. thread/start / thread/resume および turn/start の前に assemble を配線する
  - H3: 5. プロンプトキャッシュに安定した整形を維持する
  - H3: 6. transcript ミラーリング後に post-turn を配線する
  - H3: 7. 使用量とプロンプトキャッシュのランタイムコンテキストを正規化する
  - H3: 8. Compaction ポリシー
  - H4: /compact と明示的な OpenClaw compaction
  - H4: ターン内 Codex ネイティブ contextCompaction イベント
  - H3: 9. セッションリセットとバインディング動作
  - H3: 10. エラー処理
  - H2: テスト計画
  - H3: 単体テスト
  - H3: 更新する既存テスト
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
  - H2: サポート状況の概要
  - H2: システム制御
  - H2: 接続ランブック
  - H3: 前提条件
  - H3: 1) Gateway を起動する
  - H3: 2) 検出を検証する (任意)
  - H4: unicast DNS-SD 経由の Tailnet (Vienna ⇄ London) 検出
  - H3: 3) Android から接続する
  - H3: Presence alive ビーコン
  - H3: 4) ペアリングを承認する (CLI)
  - H3: 5) ノードが接続済みであることを検証する
  - H3: 6) チャット + 履歴
  - H3: 7) Canvas + カメラ
  - H4: Gateway Canvas Host (Web コンテンツに推奨)
  - H3: 8) 音声 + 拡張 Android コマンドサーフェス
  - H2: アシスタントのエントリポイント
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
  - H2: Gateway サービスインストール (CLI)
  - H2: 関連

## platforms/ios.md

- ルート: /platforms/ios
- 見出し:
  - H2: 機能
  - H2: 要件
  - H2: クイックスタート (ペアリング + 接続)
  - H2: 公式ビルド向けのリレー対応プッシュ
  - H2: バックグラウンド alive ビーコン
  - H2: 認証と信頼フロー
  - H2: 検出パス
  - H3: Bonjour (LAN)
  - H3: Tailnet (クロスネットワーク)
  - H3: 手動ホスト/ポート
  - H2: Canvas + A2UI
  - H2: Computer Use との関係
  - H3: Canvas eval / snapshot
  - H2: Voice wake + talk mode
  - H2: 一般的なエラー
  - H2: 関連ドキュメント

## platforms/linux.md

- ルート: /platforms/linux
- 見出し:
  - H2: 初心者向けクイック手順 (VPS)
  - H2: インストール
  - H2: Gateway
  - H2: Gateway サービスインストール (CLI)
  - H2: システム制御 (systemd ユーザーユニット)
  - H2: メモリ負荷と OOM kill
  - H2: 関連

## platforms/mac/bundled-gateway.md

- ルート: /platforms/mac/bundled-gateway
- 見出し:
  - H2: CLI をインストールする (ローカルモードに必須)
  - H2: Launchd (LaunchAgent としての Gateway)
  - H2: バージョン互換性
  - H2: macOS の状態ディレクトリ
  - H2: アプリ接続をデバッグする
  - H2: スモークチェック
  - H2: 関連

## platforms/mac/canvas.md

- ルート: /platforms/mac/canvas
- 見出し:
  - H2: Canvas の場所
  - H2: パネルの動作
  - H2: Agent API サーフェス
  - H2: Canvas の A2UI
  - H3: A2UI コマンド (v0.8)
  - H2: Canvas から agent 実行をトリガーする
  - H2: セキュリティの注意事項
  - H2: 関連

## platforms/mac/child-process.md

- ルート: /platforms/mac/child-process
- 見出し:
  - H2: デフォルト動作 (launchd)
  - H2: 署名なし開発ビルド
  - H2: アタッチ専用モード
  - H2: リモートモード
  - H2: launchd を優先する理由
  - H2: 関連

## platforms/mac/dev-setup.md

- ルート: /platforms/mac/dev-setup
- 見出し:
  - H1: macOS 開発者セットアップ
  - H2: 前提条件
  - H2: 1. 依存関係をインストールする
  - H2: 2. アプリをビルドしてパッケージ化する
  - H2: 3. CLI をインストールする
  - H2: トラブルシューティング
  - H3: ビルド失敗: ツールチェーンまたは SDK の不一致
  - H3: 権限付与時にアプリがクラッシュする
  - H3: Gateway が「Starting...」のまま終わらない
  - H2: 関連

## platforms/mac/health.md

- ルート: /platforms/mac/health
- 見出し:
  - H1: macOS のヘルスチェック
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
  - H1: ログ記録 (macOS)
  - H2: ローリング診断ファイルログ (デバッグペイン)
  - H2: macOS の統合ログにおけるプライベートデータ
  - H2: OpenClaw (ai.openclaw) で有効にする
  - H2: デバッグ後に無効にする
  - H2: 関連

## platforms/mac/menu-bar.md

- ルート: /platforms/mac/menu-bar
- 見出し:
  - H2: 表示される内容
  - H2: 状態モデル
  - H2: IconState enum (Swift)
  - H3: ActivityKind → グリフ
  - H3: 視覚的マッピング
  - H2: コンテキストサブメニュー
  - H2: ステータス行テキスト (メニュー)
  - H2: イベント取り込み
  - H2: デバッグ上書き
  - H2: テストチェックリスト
  - H2: 関連

## platforms/mac/peekaboo.md

- ルート: /platforms/mac/peekaboo
- 見出し:
  - H2: これは何か (そして何ではないか)
  - H2: Computer Use との関係
  - H2: ブリッジを有効にする
  - H2: クライアント検出順序
  - H2: セキュリティと権限
  - H2: スナップショットの動作 (自動化)
  - H2: トラブルシューティング
  - H2: 関連

## platforms/mac/permissions.md

- ルート: /platforms/mac/permissions
- 見出し:
  - H2: 安定した権限の要件
  - H2: Node および CLI ランタイムのアクセシビリティ許可
  - H2: プロンプトが表示されなくなった場合の復旧チェックリスト
  - H2: ファイルとフォルダーの権限 (デスクトップ/書類/ダウンロード)
  - H2: 関連

## platforms/mac/remote.md

- ルート: /platforms/mac/remote
- 見出し:
  - H2: モード
  - H2: リモートトランスポート
  - H2: リモートホストの前提条件
  - H2: macOS アプリのセットアップ
  - H2: Web チャット
  - H2: 権限
  - H2: セキュリティ上の注意
  - H2: WhatsApp ログインフロー (リモート)
  - H2: トラブルシューティング
  - H2: 通知音
  - H2: 関連

## platforms/mac/signing.md

- ルート: /platforms/mac/signing
- 見出し:
  - H1: mac 署名 (デバッグビルド)
  - H2: 使用方法
  - H3: アドホック署名の注記
  - H2: About 用のビルドメタデータ
  - H2: 理由
  - H2: 関連

## platforms/mac/skills.md

- ルート: /platforms/mac/skills
- 見出し:
  - H2: データソース
  - H2: インストールアクション
  - H2: 環境/API キー
  - H2: リモートモード
  - H2: 関連

## platforms/mac/voice-overlay.md

- ルート: /platforms/mac/voice-overlay
- 見出し:
  - H1: 音声オーバーレイのライフサイクル (macOS)
  - H2: 現在の意図
  - H2: 実装済み (2025年12月9日)
  - H2: 次のステップ
  - H2: デバッグチェックリスト
  - H2: 移行手順 (推奨)
  - H2: 関連

## platforms/mac/voicewake.md

- ルート: /platforms/mac/voicewake
- 見出し:
  - H1: 音声ウェイクとプッシュトゥトーク
  - H2: 要件
  - H2: モード
  - H2: ランタイム動作 (ウェイクワード)
  - H2: ライフサイクル不変条件
  - H2: 固着オーバーレイ障害モード (以前)
  - H2: プッシュトゥトーク固有の内容
  - H2: ユーザー向け設定
  - H2: 転送動作
  - H2: 転送ペイロード
  - H2: クイック検証
  - H2: 関連

## platforms/mac/webchat.md

- ルート: /platforms/mac/webchat
- 見出し:
  - H2: 起動とデバッグ
  - H2: 配線方法
  - H2: セキュリティサーフェス
  - H2: 既知の制限
  - H2: 関連

## platforms/mac/xpc.md

- ルート: /platforms/mac/xpc
- 見出し:
  - H1: OpenClaw macOS IPC アーキテクチャ
  - H2: 目標
  - H2: 仕組み
  - H3: Gateway + node トランスポート
  - H3: Node サービス + アプリ IPC
  - H3: PeekabooBridge (UI 自動化)
  - H2: 運用フロー
  - H2: ハードニングに関する注意
  - H2: 関連

## platforms/macos.md

- ルート: /platforms/macos
- 見出し:
  - H2: ダウンロード
  - H2: 初回実行
  - H2: Gateway モードを選択する
  - H2: アプリが所有するもの
  - H2: macOS 詳細ページ
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
  - H3: Windows Hub に含まれるもの
  - H3: 初回起動
  - H2: Windows ノードモード
  - H2: ローカル MCP モード
  - H2: ネイティブ Windows CLI と Gateway
  - H2: WSL2 Gateway
  - H2: Windows ログイン前の Gateway 自動起動
  - H2: WSL サービスを LAN に公開する
  - H2: トラブルシューティング
  - H3: トレイアイコンが表示されない
  - H3: ローカルセットアップが失敗する
  - H3: アプリがペアリングが必要だと表示する
  - H3: Web チャットがリモート Gateway に到達できない
  - H3: screen.snapshot、camera、または audio コマンドが失敗する
  - H3: Git または GitHub 接続が失敗する
  - H2: 関連

## plugins/adding-capabilities.md

- ルート: /plugins/adding-capabilities
- 見出し:
  - H2: capability を作成するタイミング
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
  - H2: 有効にする前に
  - H2: 有効化
  - H2: ルートを検証する
  - H2: 認証
  - H2: セキュリティモデル
  - H2: リクエスト
  - H2: レスポンス
  - H2: 許可されるメソッド
  - H2: WebSocket との比較
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
  - H3: Plugin キャッシュ境界
  - H2: レジストリモデル
  - H2: 会話バインディングコールバック
  - H2: プロバイダーランタイムフック
  - H3: フック順序と使用方法
  - H3: プロバイダー例
  - H3: 組み込み例
  - H2: ランタイムヘルパー
  - H3: api.runtime.imageGeneration
  - H2: Gateway HTTP ルート
  - H2: Plugin SDK インポートパス
  - H2: メッセージツールスキーマ
  - H2: チャンネルターゲット解決
  - H2: 設定に基づくディレクトリ
  - H2: プロバイダーカタログ
  - H2: 読み取り専用チャンネル検査
  - H2: パッケージパック
  - H3: チャンネルカタログメタデータ
  - H2: コンテキストエンジン Plugin
  - H2: 新しい capability を追加する
  - H3: capability チェックリスト
  - H3: capability テンプレート
  - H2: 関連

## plugins/architecture.md

- ルート: /plugins/architecture
- 見出し:
  - H2: 公開 capability モデル
  - H3: 外部互換性の方針
  - H3: Plugin の形
  - H3: レガシーフック
  - H3: 互換性シグナル
  - H2: アーキテクチャ概要
  - H3: Plugin メタデータスナップショットとルックアップテーブル
  - H3: アクティベーション計画
  - H3: チャンネル Plugin と共有メッセージツール
  - H2: capability 所有モデル
  - H3: capability レイヤリング
  - H3: 複数 capability を持つ企業 Plugin の例
  - H3: capability 例: 動画理解
  - H2: 契約と適用
  - H3: 契約に含まれるもの
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
  - H2: Plugin の形を選択する
  - H2: クイックスタート
  - H2: ツールの登録
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
  - H2: OpenClaw がバンドルからマッピングするもの
  - H3: 現在サポートされているもの
  - H4: Skill コンテンツ
  - H4: フックパック
  - H4: 埋め込み OpenClaw 用 MCP
  - H4: 埋め込み OpenClaw 設定
  - H4: 埋め込み OpenClaw LSP
  - H3: 検出されるが実行されないもの
  - H2: バンドル形式
  - H2: 検出の優先順位
  - H2: ランタイム依存関係とクリーンアップ
  - H2: セキュリティ
  - H2: トラブルシューティング
  - H2: 関連

## plugins/cli-backend-plugins.md

- ルート: /plugins/cli-backend-plugins
- 見出し:
  - H2: Plugin が所有するもの
  - H2: 最小バックエンド Plugin
  - H2: 設定の形
  - H2: 高度なバックエンドフック
  - H3: ownsNativeCompaction: OpenClaw Compaction からオプトアウトする
  - H2: MCP ツールブリッジ
  - H2: ユーザー設定
  - H2: 検証
  - H2: チェックリスト
  - H2: 関連

## plugins/codex-computer-use.md

- ルート: /plugins/codex-computer-use
- 見出し:
  - H2: OpenClaw.app と Peekaboo
  - H2: iOS アプリ
  - H2: 直接 cua-driver MCP
  - H2: クイックセットアップ
  - H2: コマンド
  - H2: マーケットプレイスの選択肢
  - H2: 同梱 macOS マーケットプレイス
  - H2: リモートカタログ制限
  - H2: 設定リファレンス
  - H2: OpenClaw が確認すること
  - H2: macOS 権限
  - H2: トラブルシューティング
  - H2: 関連

## plugins/codex-harness-reference.md

- ルート: /plugins/codex-harness-reference
- 見出し:
  - H2: Plugin 設定サーフェス
  - H2: アプリサーバートランスポート
  - H2: 承認とサンドボックスモード
  - H2: サンドボックス化されたネイティブ実行
  - H2: 認証と環境分離
  - H2: 動的ツール
  - H2: タイムアウト
  - H2: モデル検出
  - H2: ワークスペースブートストラップファイル
  - H2: 環境上書き
  - H2: 関連

## plugins/codex-harness-runtime.md

- ルート: /plugins/codex-harness-runtime
- 見出し:
  - H2: 概要
  - H2: スレッドバインディングとモデル変更
  - H2: 表示される返信と Heartbeat
  - H2: フック境界
  - H2: V1 サポート契約
  - H2: ネイティブ権限と MCP elicitations
  - H2: キュー誘導
  - H2: Codex フィードバックアップロード
  - H2: Compaction とトランスクリプトミラー
  - H2: メディアと配信
  - H2: 関連

## plugins/codex-harness.md

- ルート: /plugins/codex-harness
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: 設定
  - H2: Codex ランタイムを検証する
  - H2: ルーティングとモデル選択
  - H2: デプロイパターン
  - H3: 基本的な Codex デプロイ
  - H3: 混在プロバイダーデプロイ
  - H3: フェイルクローズ Codex デプロイ
  - H2: アプリサーバーポリシー
  - H2: コマンドと診断
  - H3: Codex スレッドをローカルで検査する
  - H2: ネイティブ Codex Plugin
  - H2: Computer Use
  - H2: ランタイム境界
  - H2: トラブルシューティング
  - H2: 関連

## plugins/codex-native-plugins.md

- ルート: /plugins/codex-native-plugins
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: チャットから Plugin を管理する
  - H2: ネイティブ Plugin セットアップの仕組み
  - H2: V1 サポート境界
  - H2: アプリインベントリと所有権
  - H2: スレッドアプリ設定
  - H2: 破壊的操作ポリシー
  - H2: トラブルシューティング
  - H2: 関連

## plugins/community.md

- ルート: /plugins/community
- 見出し:
  - H2: Plugin を探す
  - H2: Plugin を公開する
  - H2: 関連

## plugins/compatibility.md

- ルート: /plugins/compatibility
- 見出し:
  - H2: 互換性レジストリ
  - H2: Plugin インスペクターパッケージ
  - H3: メンテナー受け入れレーン
  - H2: 非推奨ポリシー
  - H2: 現在の互換性領域
  - H3: WhatsApp 受信コールバックのフラットエイリアス
  - H3: WhatsApp 受信許可フィールド
  - H2: リリースノート

## plugins/copilot.md

- ルート: /plugins/copilot
- 見出し:
  - H2: 要件
  - H2: Plugin インストール
  - H2: クイックスタート
  - H2: サポートされるプロバイダー
  - H2: BYOK
  - H2: 認証
  - H2: 設定サーフェス
  - H2: Compaction
  - H2: トランスクリプトミラーリング
  - H2: ついでの質問 (/btw)
  - H2: Doctor
  - H2: 制限事項
  - H2: 権限と askuser
  - H3: セッションレベルの GitHub トークン
  - H2: 関連

## plugins/dependency-resolution.md

- ルート: /plugins/dependency-resolution
- 見出し:
  - H2: 責任分担
  - H2: インストールルート
  - H2: ローカル Plugin
  - H2: 起動と再読み込み
  - H2: 同梱 Plugin
  - H2: レガシークリーンアップ

## plugins/google-meet.md

- ルート: /plugins/google-meet
- 見出し:
  - H2: クイックスタート
  - H3: ローカル Gateway + Parallels Chrome
  - H2: インストールメモ
  - H2: トランスポート
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth と事前チェック
  - H3: Google 認証情報を作成する
  - H3: リフレッシュトークンを発行する
  - H3: doctor で OAuth を検証する
  - H2: 設定
  - H2: ツール
  - H2: エージェントと bidi モード
  - H2: ライブテストのチェックリスト
  - H2: トラブルシューティング
  - H3: エージェントが Google Meet ツールを認識できない
  - H3: Google Meet 対応ノードが接続されていない
  - H3: ブラウザは開くがエージェントが参加できない
  - H3: ミーティング作成に失敗する
  - H3: エージェントは参加するが話さない
  - H3: Twilio セットアップチェックに失敗する
  - H3: Twilio 通話は開始するがミーティングに入らない
  - H2: メモ
  - H2: 関連

## plugins/hooks.md

- ルート: /plugins/hooks
- 見出し:
  - H2: クイックスタート
  - H2: フックカタログ
  - H2: ランタイムフックをデバッグする
  - H2: ツール呼び出しポリシー
  - H3: 実行環境フック
  - H3: ツール結果の永続化
  - H2: プロンプトとモデルフック
  - H3: セッション拡張と次ターン注入
  - H2: メッセージフック
  - H2: インストールフック
  - H2: Gateway ライフサイクル
  - H2: 今後の非推奨化
  - H2: 関連

## plugins/install-overrides.md

- ルート: /plugins/install-overrides
- 見出し:
  - H2: 環境
  - H2: 動作
  - H2: パッケージ E2E

## plugins/llama-cpp.md

- ルート: /plugins/llama-cpp
- 見出し:
  - H2: 構成
  - H2: ネイティブランタイム

## plugins/manage-plugins.md

- ルート: /plugins/manage-plugins
- 見出し:
  - H2: Plugin の一覧表示と検索
  - H2: Plugin をインストールする
  - H2: 再起動して調査する
  - H2: Plugin を更新する
  - H2: Plugin をアンインストールする
  - H2: ソースを選択する
  - H2: Plugin を公開する
  - H2: 関連

## plugins/manifest.md

- ルート: /plugins/manifest
- 見出し:
  - H2: このファイルの役割
  - H2: 最小例
  - H2: 詳細な例
  - H2: トップレベルフィールドのリファレンス
  - H2: 生成プロバイダーメタデータのリファレンス
  - H2: ツールメタデータのリファレンス
  - H2: providerAuthChoices のリファレンス
  - H2: commandAliases のリファレンス
  - H2: activation のリファレンス
  - H2: qaRunners のリファレンス
  - H2: setup のリファレンス
  - H3: setup.providers のリファレンス
  - H3: setup フィールド
  - H2: uiHints のリファレンス
  - H2: contracts のリファレンス
  - H2: mediaUnderstandingProviderMetadata のリファレンス
  - H2: channelConfigs のリファレンス
  - H3: 別のチャンネル Plugin を置き換える
  - H2: modelSupport のリファレンス
  - H2: modelCatalog のリファレンス
  - H2: modelIdNormalization のリファレンス
  - H2: providerEndpoints のリファレンス
  - H2: providerRequest のリファレンス
  - H2: secretProviderIntegrations のリファレンス
  - H2: modelPricing のリファレンス
  - H3: OpenClaw プロバイダーインデックス
  - H2: マニフェストと package.json の比較
  - H3: 検出に影響する package.json フィールド
  - H2: 検出の優先順位（重複する Plugin ID）
  - H2: JSON Schema 要件
  - H2: 検証動作
  - H2: メモ
  - H2: 関連

## plugins/memory-lancedb.md

- ルート: /plugins/memory-lancedb
- 見出し:
  - H2: インストール
  - H2: クイックスタート
  - H2: プロバイダーに支えられた埋め込み
  - H2: Ollama 埋め込み
  - H2: OpenAI 互換プロバイダー
  - H2: リコールとキャプチャの制限
  - H2: コマンド
  - H2: ストレージ
  - H2: ランタイム依存関係
  - H2: トラブルシューティング
  - H3: 入力長がコンテキスト長を超えている
  - H3: サポートされていない埋め込みモデル
  - H3: Plugin は読み込まれるがメモリが表示されない
  - H2: 関連

## plugins/memory-wiki.md

- ルート: /plugins/memory-wiki
- 見出し:
  - H2: 追加されるもの
  - H2: メモリとの関係
  - H2: 推奨ハイブリッドパターン
  - H2: Vault モード
  - H3: isolated
  - H3: bridge
  - H3: unsafe-local
  - H2: Vault レイアウト
  - H2: Open Knowledge Format インポート
  - H2: 構造化された主張とエビデンス
  - H2: エージェント向けエンティティメタデータ
  - H2: コンパイルパイプライン
  - H2: ダッシュボードとヘルスレポート
  - H2: 検索と取得
  - H2: エージェントツール
  - H2: プロンプトとコンテキストの動作
  - H2: 構成
  - H3: 例: QMD + bridge モード
  - H2: CLI
  - H2: Obsidian サポート
  - H2: 推奨ワークフロー
  - H2: 関連ドキュメント

## plugins/message-presentation.md

- ルート: /plugins/message-presentation
- 見出し:
  - H2: 契約
  - H2: プロデューサー例
  - H2: レンダラー契約
  - H2: コアレンダーの流れ
  - H2: 劣化ルール
  - H2: プロバイダーマッピング
  - H2: プレゼンテーションと InteractiveReply の比較
  - H2: 配信ピン
  - H2: Plugin 作者チェックリスト
  - H2: 関連ドキュメント

## plugins/oc-path.md

- ルート: /plugins/oc-path
- 見出し:
  - H2: 有効化する理由
  - H2: 実行場所
  - H2: 有効化
  - H2: 依存関係
  - H2: 提供されるもの
  - H2: 他の Plugin との関係
  - H2: 安全性
  - H2: 関連

## plugins/plugin-inventory.md

- ルート: /plugins/plugin-inventory
- 見出し:
  - H1: Plugin インベントリ
  - H2: 定義
  - H2: Plugin をインストールする
  - H2: コア npm パッケージ
  - H2: 公式外部パッケージ
  - H2: ソースチェックアウトのみ

## plugins/plugin-permission-requests.md

- ルート: /plugins/plugin-permission-requests
- 見出し:
  - H2: 適切なゲートを選ぶ
  - H2: ツール呼び出し前に承認を要求する
  - H2: 判断動作
  - H2: 承認プロンプトをルーティングする
  - H2: Codex ネイティブ権限
  - H2: トラブルシューティング
  - H2: 関連

## plugins/reference.md

- ルート: /plugins/reference
- 見出し:
  - H1: Plugin リファレンス

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
  - H1: Fireworks プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/github-copilot.md

- ルート: /plugins/reference/github-copilot
- 見出し:
  - H1: GitHub Copilot プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/gmi.md

- ルート: /plugins/reference/gmi
- 見出し:
  - H1: Gmi プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/google-meet.md

- ルート: /plugins/reference/google-meet
- 見出し:
  - H1: Google Meet プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/google.md

- ルート: /plugins/reference/google
- 見出し:
  - H1: Google プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/googlechat.md

- ルート: /plugins/reference/googlechat
- 見出し:
  - H1: Google Chat プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/gradium.md

- ルート: /plugins/reference/gradium
- 見出し:
  - H1: Gradium プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/groq.md

- ルート: /plugins/reference/groq
- 見出し:
  - H1: Groq プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/huggingface.md

- ルート: /plugins/reference/huggingface
- 見出し:
  - H1: Hugging Face プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/imessage.md

- ルート: /plugins/reference/imessage
- 見出し:
  - H1: iMessage プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/inworld.md

- ルート: /plugins/reference/inworld
- 見出し:
  - H1: Inworld プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/irc.md

- ルート: /plugins/reference/irc
- 見出し:
  - H1: IRC プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/kilocode.md

- ルート: /plugins/reference/kilocode
- 見出し:
  - H1: Kilocode プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/kimi.md

- ルート: /plugins/reference/kimi
- 見出し:
  - H1: Kimi プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/line.md

- ルート: /plugins/reference/line
- 見出し:
  - H1: LINE プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/litellm.md

- ルート: /plugins/reference/litellm
- 見出し:
  - H1: LiteLLM プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/llama-cpp.md

- ルート: /plugins/reference/llama-cpp
- 見出し:
  - H1: Llama Cpp プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/llm-task.md

- ルート: /plugins/reference/llm-task
- 見出し:
  - H1: LLM Task プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/lmstudio.md

- ルート: /plugins/reference/lmstudio
- 見出し:
  - H1: LM Studio プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/lobster.md

- ルート: /plugins/reference/lobster
- 見出し:
  - H1: Lobster プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/matrix.md

- ルート: /plugins/reference/matrix
- 見出し:
  - H1: Matrix プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/mattermost.md

- ルート: /plugins/reference/mattermost
- 見出し:
  - H1: Mattermost プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/memory-core.md

- ルート: /plugins/reference/memory-core
- 見出し:
  - H1: Memory Core プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/memory-lancedb.md

- ルート: /plugins/reference/memory-lancedb
- 見出し:
  - H1: Memory Lancedb プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/memory-wiki.md

- ルート: /plugins/reference/memory-wiki
- 見出し:
  - H1: Memory Wiki プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/microsoft-foundry.md

- ルート: /plugins/reference/microsoft-foundry
- 見出し:
  - H1: Microsoft Foundry プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 要件
  - H2: チャットモデル
  - H2: MAI 画像生成
  - H2: トラブルシューティング

## plugins/reference/microsoft.md

- ルート: /plugins/reference/microsoft
- 見出し:
  - H1: Microsoft プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/migrate-claude.md

- ルート: /plugins/reference/migrate-claude
- 見出し:
  - H1: Migrate Claude プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/migrate-hermes.md

- ルート: /plugins/reference/migrate-hermes
- 見出し:
  - H1: Migrate Hermes プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/minimax.md

- ルート: /plugins/reference/minimax
- 見出し:
  - H1: MiniMax プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/mistral.md

- ルート: /plugins/reference/mistral
- 見出し:
  - H1: Mistral プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/moonshot.md

- ルート: /plugins/reference/moonshot
- 見出し:
  - H1: Moonshot プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/msteams.md

- ルート: /plugins/reference/msteams
- 見出し:
  - H1: Microsoft Teams プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/nextcloud-talk.md

- ルート: /plugins/reference/nextcloud-talk
- 見出し:
  - H1: Nextcloud Talk プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/nostr.md

- ルート: /plugins/reference/nostr
- 見出し:
  - H1: Nostr プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/novita.md

- ルート: /plugins/reference/novita
- 見出し:
  - H1: Novita プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/nvidia.md

- ルート: /plugins/reference/nvidia
- 見出し:
  - H1: NVIDIA プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/oc-path.md

- ルート: /plugins/reference/oc-path
- 見出し:
  - H1: Oc Path プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/ollama.md

- ルート: /plugins/reference/ollama
- 見出し:
  - H1: Ollama プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/open-prose.md

- ルート: /plugins/reference/open-prose
- 見出し:
  - H1: Open Prose プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/openai.md

- ルート: /plugins/reference/openai
- 見出し:
  - H1: OpenAI プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/opencode-go.md

- ルート: /plugins/reference/opencode-go
- 見出し:
  - H1: OpenCode Go プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/opencode.md

- ルート: /plugins/reference/opencode
- 見出し:
  - H1: OpenCode プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/openrouter.md

- ルート: /plugins/reference/openrouter
- 見出し:
  - H1: OpenRouter プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/openshell.md

- ルート: /plugins/reference/openshell
- 見出し:
  - H1: Openshell プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/perplexity.md

- ルート: /plugins/reference/perplexity
- 見出し:
  - H1: Perplexity プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/pixverse.md

- ルート: /plugins/reference/pixverse
- 見出し:
  - H1: PixVerse プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/policy.md

- ルート: /plugins/reference/policy
- 見出し:
  - H1: Policy プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 動作
  - H2: 関連ドキュメント

## plugins/reference/qa-channel.md

- ルート: /plugins/reference/qa-channel
- 見出し:
  - H1: QA Channel プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/qa-lab.md

- ルート: /plugins/reference/qa-lab
- 見出し:
  - H1: QA Lab プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/qa-matrix.md

- ルート: /plugins/reference/qa-matrix
- 見出し:
  - H1: QA Matrix プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/qianfan.md

- ルート: /plugins/reference/qianfan
- 見出し:
  - H1: Qianfan プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/qqbot.md

- ルート: /plugins/reference/qqbot
- 見出し:
  - H1: QQ Bot プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/qwen.md

- ルート: /plugins/reference/qwen
- 見出し:
  - H1: Qwen プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/raft.md

- ルート: /plugins/reference/raft
- 見出し:
  - H1: Raft プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/runway.md

- ルート: /plugins/reference/runway
- 見出し:
  - H1: Runway プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/searxng.md

- ルート: /plugins/reference/searxng
- 見出し:
  - H1: SearXNG プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/senseaudio.md

- ルート: /plugins/reference/senseaudio
- 見出し:
  - H1: Senseaudio プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/sglang.md

- ルート: /plugins/reference/sglang
- 見出し:
  - H1: SGLang プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/signal.md

- ルート: /plugins/reference/signal
- 見出し:
  - H1: Signal プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/slack.md

- ルート: /plugins/reference/slack
- 見出し:
  - H1: Slack プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/sms.md

- ルート: /plugins/reference/sms
- 見出し:
  - H1: Sms プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/stepfun.md

- ルート: /plugins/reference/stepfun
- 見出し:
  - H1: StepFun プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/synology-chat.md

- ルート: /plugins/reference/synology-chat
- 見出し:
  - H1: Synology Chat プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/synthetic.md

- ルート: /plugins/reference/synthetic
- 見出し:
  - H1: Synthetic プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tavily.md

- ルート: /plugins/reference/tavily
- 見出し:
  - H1: Tavily プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/telegram.md

- ルート: /plugins/reference/telegram
- 見出し:
  - H1: Telegram プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tencent.md

- ルート: /plugins/reference/tencent
- 見出し:
  - H1: Tencent プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tlon.md

- ルート: /plugins/reference/tlon
- 見出し:
  - H1: Tlon プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/together.md

- ルート: /plugins/reference/together
- 見出し:
  - H1: Together プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tokenjuice.md

- ルート: /plugins/reference/tokenjuice
- 見出し:
  - H1: Tokenjuice プラグイン
  - H2: 配布
  - H2: サーフェス
  - H2: 関連ドキュメント

## plugins/reference/tts-local-cli.md

- ルート: /plugins/reference/tts-local-cli
- 見出し:
  - H1: TTS Local CLI プラグイン
  - H2: 配布
  - H2: サーフェス

## plugins/reference/twitch.md

- ルート: /plugins/reference/twitch
- 見出し:
  - H1: Twitch プラグイン
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
  - H2: Provider とハーネスの組み合わせ
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
  - H1: Channel 受信 API
  - H2: ランタイムリゾルバー
  - H2: 結果
  - H2: アクセスグループ
  - H2: イベントモード
  - H2: ルートとアクティベーション
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
  - H2: 永続的な送信
  - H2: 互換ディスパッチ

## plugins/sdk-channel-plugins.md

- ルート: /plugins/sdk-channel-plugins
- 見出し:
  - H2: Channel Plugin の仕組み
  - H2: 承認と Channel 機能
  - H2: 受信メンションポリシー
  - H2: ウォークスルー
  - H2: ファイル構造
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
  - H2: Plugin の形
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
  - H2: 有効な非推奨項目
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
  - H3: 排他スロット
  - H3: 非推奨のメモリ埋め込みアダプター
  - H3: イベントとライフサイクル
  - H3: フック判定セマンティクス
  - H3: API オブジェクトフィールド
  - H2: 内部モジュール規約
  - H2: 関連

## plugins/sdk-provider-plugins.md

- ルート: /plugins/sdk-provider-plugins
- 見出し:
  - H2: ウォークスルー
  - H2: ClawHub に公開
  - H2: ファイル構造
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
  - H2: ClawHub への公開
  - H2: セットアップエントリ
  - H3: 狭いセットアップヘルパーのインポート
  - H3: Channel 所有の単一アカウント昇格
  - H2: 設定スキーマ
  - H3: Channel 設定スキーマの構築
  - H2: セットアップウィザード
  - H2: 公開とインストール
  - H2: 関連

## plugins/sdk-subpaths.md

- ルート: /plugins/sdk-subpaths
- 見出し:
  - H2: Plugin エントリ
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
  - H3: Channel Plugin のユニットテスト
  - H3: Provider Plugin のユニットテスト
  - H3: Plugin ランタイムのモック
  - H3: インスタンスごとのスタブを使ったテスト
  - H2: コントラクトテスト（リポジトリ内 Plugin）
  - H3: スコープ付きテストの実行
  - H2: lint 強制（リポジトリ内 Plugin）
  - H2: テスト設定
  - H2: 関連

## plugins/tool-plugins.md

- ルート: /plugins/tool-plugins
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: ツールを書く
  - H2: 任意ツールとファクトリツール
  - H2: 戻り値
  - H2: 設定
  - H2: 生成されたメタデータ
  - H2: パッケージメタデータ
  - H2: CI で検証
  - H2: ローカルにインストールして確認
  - H2: 公開
  - H2: トラブルシューティング
  - H3: plugin entry not found: ./dist/index.js
  - H3: plugin entry does not expose defineToolPlugin metadata
  - H3: openclaw.plugin.json generated metadata is stale
  - H3: package.json openclaw.extensions must include ./dist/index.js
  - H3: Cannot find package 'typebox'
  - H3: インストール後にツールが表示されない
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
  - H3: リアルタイム Provider の例
  - H2: ストリーミング文字起こし
  - H3: ストリーミング Provider の例
  - H2: 通話向け TTS
  - H3: TTS の例
  - H2: 着信通話
  - H3: 番号ごとのルーティング
  - H3: 音声出力コントラクト
  - H3: 会話開始時の動作
  - H3: Twilio ストリーム切断猶予
  - H2: 古い通話のリーパー
  - H2: Webhook セキュリティ
  - H2: CLI
  - H2: エージェントツール
  - H2: Gateway RPC
  - H2: トラブルシューティング
  - H3: セットアップが Webhook 公開に失敗する
  - H3: Provider 認証情報が失敗する
  - H3: 通話は開始するが Provider Webhook が届かない
  - H3: 署名検証が失敗する
  - H3: Google Meet Twilio 参加が失敗する
  - H3: リアルタイム通話で音声がない
  - H2: 関連

## plugins/webhooks.md

- ルート: /plugins/webhooks
- 見出し:
  - H2: 実行場所
  - H2: ルートを設定する
  - H2: セキュリティモデル
  - H2: リクエスト形式
  - H2: 対応アクション
  - H3: createflow
  - H3: runtask
  - H2: レスポンス形状
  - H2: 関連ドキュメント

## plugins/workboard.md

- ルート: /plugins/workboard
- 見出し:
  - H2: デフォルト状態
  - H2: カードに含まれる内容
  - H2: カード実行とタスク
  - H2: エージェント連携
  - H3: ディスパッチワーカーの選択
  - H3: ワーカープロンプトとライフサイクル
  - H3: ディスパッチエントリポイント
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
  - H2: 例: 並列調査と統合
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
  - H2: thinking のデフォルト（Claude Fable 5、4.8、4.6）
  - H2: プロンプトキャッシュ
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連

## providers/arcee.md

- ルート: /providers/arcee
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: 非対話セットアップ
  - H2: 組み込みカタログ
  - H2: 対応機能
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
  - H3: 対応リージョン
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
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: 非対話セットアップ
  - H2: 組み込みカタログ
  - H2: 手動設定
  - H2: 関連

## providers/chutes.md

- ルート: /providers/chutes
- 見出し:
  - H2: Plugin をインストール
  - H2: はじめに
  - H2: 検出動作
  - H2: デフォルトエイリアス
  - H2: 組み込みスターターカタログ
  - H2: 設定例
  - H2: 関連

## providers/claude-max-api-proxy.md

- ルート: /providers/claude-max-api-proxy
- 見出し:
  - H2: なぜこれを使うのか？
  - H2: 仕組み
  - H2: はじめに
  - H2: 組み込みカタログ
  - H2: 高度な設定
  - H2: 注意事項
  - H2: 関連

## providers/cloudflare-ai-gateway.md

- ルート: /providers/cloudflare-ai-gateway
- 見出し:
  - H2: Pluginをインストール
  - H2: はじめに
  - H2: 非対話式の例
  - H2: 高度な設定
  - H2: 関連

## providers/cohere.md

- ルート: /providers/cohere
- 見出し:
  - H2: はじめに
  - H2: 環境変数のみのセットアップ
  - H2: 関連

## providers/comfy.md

- ルート: /providers/comfy
- 見出し:
  - H2: 対応内容
  - H2: はじめに
  - H2: 設定
  - H3: 共有キー
  - H3: 機能ごとのキー
  - H2: ワークフローの詳細
  - H2: 関連

## providers/deepgram.md

- ルート: /providers/deepgram
- 見出し:
  - H2: はじめに
  - H2: 設定オプション
  - H2: Voice CallストリーミングSTT
  - H2: 注意事項
  - H2: 関連

## providers/deepinfra.md

- ルート: /providers/deepinfra
- 見出し:
  - H2: Pluginをインストール
  - H2: APIキーの取得
  - H2: CLIセットアップ
  - H2: 設定スニペット
  - H2: 対応するOpenClawサーフェス
  - H2: 利用可能なモデル
  - H2: 注意事項
  - H2: 関連

## providers/deepseek.md

- ルート: /providers/deepseek
- 見出し:
  - H2: Pluginをインストール
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
  - H2: ストリーミングSTT
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
  - H2: 非対話式セットアップ
  - H2: 組み込みカタログ
  - H2: カスタムFireworksモデルID
  - H2: 関連

## providers/github-copilot.md

- ルート: /providers/github-copilot
- 見出し:
  - H2: OpenClawでCopilotを使う3つの方法
  - H2: オプションフラグ
  - H2: 非対話式オンボーディング
  - H2: メモリ検索埋め込み
  - H3: 設定
  - H3: 仕組み
  - H2: 関連

## providers/gmi.md

- ルート: /providers/gmi
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: GMIを選ぶタイミング
  - H2: モデル
  - H2: トラブルシューティング
  - H2: 関連

## providers/google.md

- ルート: /providers/google
- 見出し:
  - H2: はじめに
  - H2: 機能
  - H2: Web検索
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
  - H2: Pluginをインストール
  - H2: セットアップ
  - H2: 設定
  - H2: 音声
  - H3: メッセージごとの音声オーバーライド
  - H2: 出力
  - H2: 自動選択順序
  - H2: 関連

## providers/groq.md

- ルート: /providers/groq
- 見出し:
  - H2: Pluginをインストール
  - H2: はじめに
  - H3: 設定ファイルの例
  - H2: 組み込みカタログ
  - H2: 推論モデル
  - H2: 音声文字起こし
  - H2: 関連

## providers/huggingface.md

- ルート: /providers/huggingface
- 見出し:
  - H2: はじめに
  - H3: 非対話式セットアップ
  - H2: モデルID
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
  - H2: Pluginをインストール
  - H2: はじめに
  - H2: 設定オプション
  - H2: 注意事項
  - H2: 関連

## providers/kilocode.md

- ルート: /providers/kilocode
- 見出し:
  - H2: Pluginをインストール
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
  - H2: 非対話式オンボーディング
  - H2: 設定
  - H3: ストリーミング使用量の互換性
  - H3: 思考の互換性
  - H3: 明示的な設定
  - H2: トラブルシューティング
  - H3: LM Studioが検出されない
  - H3: 認証エラー（HTTP 401）
  - H3: ジャストインタイムモデル読み込み
  - H3: LANまたはtailnet上のLM Studioホスト
  - H2: 関連

## providers/minimax.md

- ルート: /providers/minimax
- 見出し:
  - H2: 組み込みカタログ
  - H2: はじめに
  - H2: openclaw configureによる設定
  - H2: 機能
  - H3: 画像生成
  - H3: テキスト読み上げ
  - H3: 音楽生成
  - H3: 動画生成
  - H3: 画像理解
  - H3: Web検索
  - H2: 高度な設定
  - H2: 注意事項
  - H2: トラブルシューティング
  - H2: 関連

## providers/mistral.md

- ルート: /providers/mistral
- 見出し:
  - H2: はじめに
  - H2: 組み込みLLMカタログ
  - H2: 音声文字起こし（Voxtral）
  - H2: Voice CallストリーミングSTT
  - H2: 高度な設定
  - H2: 関連

## providers/models.md

- ルート: /providers/models
- 見出し:
  - H2: クイックスタート（2ステップ）
  - H2: 対応プロバイダー（スターターセット）
  - H2: 追加プロバイダーバリアント
  - H2: 関連

## providers/moonshot.md

- ルート: /providers/moonshot
- 見出し:
  - H2: 組み込みモデルカタログ
  - H2: はじめに
  - H2: Kimi Web検索
  - H2: 高度な設定
  - H2: 関連

## providers/novita.md

- ルート: /providers/novita
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: Novitaを選ぶタイミング
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
  - H2: 同梱フォールバックカタログ
  - H2: 高度な設定
  - H2: 関連

## providers/ollama-cloud.md

- ルート: /providers/ollama-cloud
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: Ollama Cloudを選ぶタイミング
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
  - H2: モデル検出（暗黙的プロバイダー）
  - H2: ビジョンと画像説明
  - H2: 設定
  - H2: 一般的なレシピ
  - H3: モデル選択
  - H3: クイック検証
  - H2: Ollama Web検索
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連

## providers/openai.md

- ルート: /providers/openai
- 見出し:
  - H2: クイック選択
  - H2: 命名マップ
  - H2: OpenClaw機能カバレッジ
  - H2: メモリ埋め込み
  - H2: はじめに
  - H2: ネイティブCodexアプリサーバー認証
  - H2: 画像生成
  - H2: 動画生成
  - H2: GPT-5プロンプト貢献
  - H2: 音声とスピーチ
  - H2: Azure OpenAIエンドポイント
  - H3: 設定
  - H3: APIバージョン
  - H3: モデル名はデプロイ名
  - H3: 地域別の可用性
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
  - H2: 音声テキスト変換（受信音声）
  - H2: Fusionルーター
  - H2: 認証とヘッダー
  - H2: 高度な設定
  - H2: 関連

## providers/perplexity-provider.md

- ルート: /providers/perplexity-provider
- 見出し:
  - H2: Pluginをインストール
  - H2: はじめに
  - H2: 検索モード
  - H2: ネイティブAPIフィルタリング
  - H2: 高度な設定
  - H2: 関連

## providers/pixverse.md

- ルート: /providers/pixverse
- 見出し:
  - H2: はじめに
  - H2: 対応モードとモデル
  - H2: プロバイダーオプション
  - H2: 設定
  - H2: 高度な設定
  - H2: 関連

## providers/qianfan.md

- ルート: /providers/qianfan
- 見出し:
  - H2: Pluginをインストール
  - H2: はじめに
  - H2: 組み込みカタログ
  - H2: 設定例
  - H2: 関連

## providers/qwen-oauth.md

- ルート: /providers/qwen-oauth
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: Qwenとの違い
  - H2: Qwen OAuth / Portalを選ぶタイミング
  - H2: モデル
  - H2: 移行
  - H2: トラブルシューティング
  - H2: 関連

## providers/qwen.md

- ルート: /providers/qwen
- 見出し:
  - H2: Pluginをインストール
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
  - H2: 対応モードとモデル
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
  - H2: モデル検出（暗黙的プロバイダー）
  - H2: 明示的な設定（手動モデル）
  - H2: 高度な設定
  - H2: 関連

## providers/stepfun.md

- ルート: /providers/stepfun
- 見出し:
  - H2: Pluginをインストール
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
  - H2: 非対話式セットアップ
  - H2: 組み込みカタログ
  - H2: 段階別料金
  - H2: 高度な設定
  - H2: 関連

## providers/together.md

- ルート: /providers/together
- 見出し:
  - H2: はじめに
  - H3: 非対話式の例
  - H2: 組み込みカタログ
  - H2: 動画生成
  - H2: 関連

## providers/venice.md

- ルート: /providers/venice
- 見出し:
  - H2: OpenClawでVeniceを使う理由
  - H2: プライバシーモード
  - H2: 機能
  - H2: はじめに
  - H2: モデル選択
  - H2: DeepSeek V4リプレイ動作
  - H2: 組み込みカタログ（合計41）
  - H2: モデル検出
  - H2: ストリーミングとツール対応
  - H2: 料金
  - H3: Venice（匿名化）と直接APIの比較
  - H2: 使用例
  - H2: トラブルシューティング
  - H2: 高度な設定
  - H2: 関連

## providers/vercel-ai-gateway.md

- ルート: /providers/vercel-ai-gateway
- 見出し:
  - H2: はじめに
  - H2: 非対話式の例
  - H2: モデルID省略記法
  - H2: 高度な設定
  - H2: 関連

## providers/vllm.md

- ルート: /providers/vllm
- 見出し:
  - H2: はじめに
  - H2: モデル検出（暗黙的プロバイダー）
  - H2: 明示的な設定（手動モデル）
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連

## providers/volcengine.md

- ルート: /providers/volcengine
- 見出し:
  - H2: はじめに
  - H2: プロバイダーとエンドポイント
  - H2: 組み込みカタログ
  - H2: テキスト読み上げ
  - H2: 詳細設定
  - H2: 関連

## providers/vydra.md

- ルート: /providers/vydra
- 見出し:
  - H2: セットアップ
  - H2: 機能
  - H2: 関連

## providers/xai.md

- ルート: /providers/xai
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

- ルート: /providers/xiaomi
- 見出し:
  - H2: はじめに
  - H2: 従量課金カタログ
  - H2: トークンプランカタログ
  - H2: テキスト読み上げ
  - H2: 設定例
  - H2: 関連

## providers/zai.md

- ルート: /providers/zai
- 見出し:
  - H2: GLM モデル
  - H2: はじめに
  - H2: 設定例
  - H2: 組み込みカタログ
  - H2: 詳細設定
  - H2: 関連

## refactor/access.md

- ルート: /refactor/access
- 見出し: なし

## refactor/acp.md

- ルート: /refactor/acp
- 見出し:
  - H2: 目標
  - H2: 非目標
  - H2: 対象モデル
  - H3: Gateway インスタンス ID
  - H3: ACP セッション所有権
  - H3: ACPX プロセスリース
  - H2: ライフサイクルコントローラー
  - H2: ラッパー契約
  - H2: セッション可視性契約
  - H2: 移行計画
  - H3: フェーズ 1: ID とリースを追加
  - H3: フェーズ 2: リース優先のクリーンアップ
  - H3: フェーズ 3: リース優先の起動時回収
  - H3: フェーズ 4: セッション所有権行
  - H3: フェーズ 5: レガシーヒューリスティックを削除
  - H2: テスト
  - H2: 互換性メモ
  - H2: 成功基準

## refactor/canvas.md

- ルート: /refactor/canvas
- 見出し:
  - H1: Canvas Plugin リファクタリング
  - H2: 目標
  - H2: 非目標
  - H2: 現在のブランチ状態
  - H2: 目標形状
  - H2: 移行手順
  - H2: 監査チェックリスト
  - H2: 検証コマンド

## refactor/database-first.md

- ルート: /refactor/database-first
- 見出し:
  - H1: データベース優先状態リファクタリング
  - H2: 判断
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
  - H2: 目標スキーマ形状
  - H2: Doctor 移行形状
  - H2: 移行インベントリ
  - H2: 移行計画
  - H3: フェーズ 0: 境界を凍結
  - H3: フェーズ 1: グローバル制御プレーンを完成
  - H3: フェーズ 2: エージェント単位データベースを導入
  - H3: フェーズ 3: セッションストア API を置換
  - H3: フェーズ 4: トランスクリプト、ACP ストリーム、軌跡、VFS を移動
  - H3: フェーズ 5: バックアップ、復元、Vacuum、検証
  - H3: フェーズ 6: ワーカーランタイム
  - H3: フェーズ 7: 古い世界を削除
  - H2: バックアップと復元
  - H2: ランタイムリファクタリング計画
  - H2: パフォーマンスルール
  - H2: 静的禁止事項
  - H2: 完了基準

## refactor/ingress-core.md

- ルート: /refactor/ingress-core
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

- ルート: /reference/AGENTS.default
- 見出し:
  - H2: 初回実行（推奨）
  - H2: 安全なデフォルト
  - H2: 既存ソリューションの事前確認
  - H2: セッション開始（必須）
  - H2: Soul（必須）
  - H2: 共有スペース（推奨）
  - H2: メモリシステム（推奨）
  - H2: ツールと Skills
  - H2: バックアップのヒント（推奨）
  - H2: OpenClaw が行うこと
  - H2: コア Skills（設定 → Skills で有効化）
  - H2: 使用上の注意
  - H2: 関連

## reference/RELEASING.md

- ルート: /reference/RELEASING
- 見出し:
  - H2: バージョン命名
  - H2: リリース頻度
  - H2: リリース担当者チェックリスト
  - H2: 安定版 main のクローズアウト
  - H2: リリース事前確認
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

- ルート: /reference/api-usage-costs
- 見出し:
  - H2: コストが発生する場所（チャット + CLI）
  - H2: キーの検出方法
  - H2: キーを消費する可能性がある機能
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

- ルート: /reference/application-modernization-plan
- 見出し:
  - H2: 目標
  - H2: 原則
  - H2: フェーズ 1: ベースライン監査
  - H2: フェーズ 2: プロダクトと UX のクリーンアップ
  - H2: フェーズ 3: フロントエンドアーキテクチャの引き締め
  - H2: フェーズ 4: パフォーマンスと信頼性
  - H2: フェーズ 5: 型、契約、テストの強化
  - H2: フェーズ 6: ドキュメントとリリース準備
  - H2: 推奨される最初の範囲
  - H2: フロントエンド Skills 更新

## reference/code-mode.md

- ルート: /reference/code-mode
- 見出し:
  - H2: これは何か
  - H2: なぜ有用か
  - H2: 有効化方法
  - H2: 技術ツアー
  - H2: ランタイムステータス
  - H2: スコープ
  - H2: 用語
  - H2: 設定
  - H2: 有効化
  - H2: モデルに見えるツール
  - H2: exec
  - H2: wait
  - H2: ゲストランタイム API
  - H2: 内部名前空間
  - H3: レジストリライフサイクル
  - H3: 登録形状
  - H3: 所有権と可視性
  - H3: スコープシリアライズルール
  - H3: プロンプト
  - H3: クリーンアップ
  - H3: テストチェックリスト
  - H2: 出力 API
  - H2: ツールカタログ
  - H2: ツール検索の相互作用
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

- ルート: /reference/credits
- 見出し:
  - H2: 名前
  - H2: クレジット
  - H2: コアコントリビューター
  - H2: ライセンス
  - H2: 関連

## reference/device-models.md

- ルート: /reference/device-models
- 見出し:
  - H2: データソース
  - H2: データベースの更新
  - H2: 関連

## reference/full-release-validation.md

- ルート: /reference/full-release-validation
- 見出し:
  - H2: トップレベルステージ
  - H2: リリースチェックステージ
  - H2: Docker リリースパスのチャンク
  - H2: リリースプロファイル
  - H2: フル実行のみの追加項目
  - H2: フォーカスした再実行
  - H2: 保持する証拠
  - H2: ワークフローファイル

## reference/memory-config.md

- ルート: /reference/memory-config
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
  - H3: 完全な QMD 例
  - H2: Dreaming
  - H3: ユーザー設定
  - H3: 例
  - H2: 関連

## reference/prompt-caching.md

- ルート: /reference/prompt-caching
- 見出し:
  - H2: 主要なノブ
  - H3: cacheRetention（グローバルデフォルト、モデル、エージェント単位）
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat keep-warm
  - H2: プロバイダーの挙動
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
  - H3: 混合トラフィック（推奨デフォルト）
  - H3: コスト優先ベースライン
  - H2: キャッシュ診断
  - H2: ライブ回帰テスト
  - H3: Anthropic ライブ期待値
  - H3: OpenAI ライブ期待値
  - H3: diagnostics.cacheTrace 設定
  - H3: 環境変数トグル（一回限りのデバッグ）
  - H3: 調査する内容
  - H2: クイックトラブルシューティング
  - H2: 関連

## reference/release-performance-sweep.md

- ルート: /reference/release-performance-sweep
- 見出し:
  - H2: スナップショット
  - H2: インストールフットプリントのタイムライン
  - H2: 5.28 で変わったこと
  - H2: 見出し数値
  - H3: インストールフットプリント
  - H3: npm パッケージサイズ
  - H2: Kova エージェントターン概要
  - H2: ソースプローブ
  - H2: インストールフットプリント監査
  - H3: Shrinkwrap 境界
  - H2: サプライチェーン解釈

## reference/rich-output-protocol.md

- ルート: /reference/rich-output-protocol
- 見出し:
  - H2: [embed ...]
  - H2: 保存されるレンダリング形状
  - H2: 関連

## reference/rpc.md

- ルート: /reference/rpc
- 見出し:
  - H2: パターン A: HTTP デーモン（signal-cli）
  - H2: パターン B: stdio 子プロセス（imsg）
  - H2: アダプターガイドライン
  - H2: 関連

## reference/secret-placeholder-conventions.md

- ルート: /reference/secret-placeholder-conventions
- 見出し:
  - H1: シークレットプレースホルダー規約
  - H2: 推奨スタイル
  - H2: ドキュメントで避けるべきパターン
  - H2: 例

## reference/secretref-credential-surface.md

- ルート: /reference/secretref-credential-surface
- 見出し:
  - H2: サポートされる認証情報
  - H3: openclaw.json ターゲット（secrets configure + secrets apply + secrets audit）
  - H3: auth-profiles.json ターゲット（secrets configure + secrets apply + secrets audit）
  - H2: サポートされない認証情報
  - H2: 関連

## reference/session-management-compaction.md

- ルート: /reference/session-management-compaction
- 見出し:
  - H2: 信頼できる情報源: Gateway
  - H2: 2 つの永続化レイヤー
  - H2: ディスク上の場所
  - H2: ストアメンテナンスとディスク制御
  - H2: Cron セッションと実行ログ
  - H2: セッションキー（sessionKey）
  - H2: セッション ID（sessionId）
  - H2: セッションストアスキーマ（sessions.json）
  - H2: トランスクリプト構造（.jsonl）
  - H2: コンテキストウィンドウと追跡トークン
  - H2: Compaction: それは何か
  - H2: Compaction チャンク境界とツールペアリング
  - H2: 自動 Compaction が発生するタイミング（OpenClaw ランタイム）
  - H2: Compaction 設定（reserveTokens, keepRecentTokens）
  - H2: プラグ可能な Compaction プロバイダー
  - H2: ユーザーに見えるサーフェス
  - H2: サイレントなハウスキーピング（NOREPLY）
  - H2: Compaction 前の「メモリフラッシュ」（実装済み）
  - H2: トラブルシューティングチェックリスト
  - H2: 関連

## reference/templates/AGENTS.dev.md

- ルート: /reference/templates/AGENTS.dev
- 見出し:
  - H1: AGENTS.md - OpenClaw ワークスペース
  - H2: 初回実行（一回限り）
  - H2: バックアップのヒント（推奨）
  - H2: 安全なデフォルト
  - H2: 既存ソリューションの事前確認
  - H2: 日次メモリ（推奨）
  - H2: Heartbeats（任意）
  - H2: カスタマイズ
  - H2: C-3PO 起源メモリ
  - H3: 誕生日: 2026-01-09
  - H3: 核となる真実（Clawd より）
  - H2: 関連

## reference/templates/BOOT.md

- ルート: /reference/templates/BOOT
- 見出し:
  - H1: BOOT.md
  - H2: 関連

## reference/templates/BOOTSTRAP.md

- ルート: /reference/templates/BOOTSTRAP
- 見出し:
  - H1: BOOTSTRAP.md - Hello, World
  - H2: 会話
  - H2: 自分が誰かを知った後
  - H2: 接続（任意）
  - H2: 完了したら
  - H2: 関連

## reference/templates/HEARTBEAT.md

- ルート: /reference/templates/HEARTBEAT
- 見出し:
  - H1: HEARTBEAT.md テンプレート
  - H2: 関連

## reference/templates/IDENTITY.dev.md

- ルート: /reference/templates/IDENTITY.dev
- 見出し:
  - H1: IDENTITY.md - エージェント ID
  - H2: 役割
  - H2: Soul
  - H2: Clawd との関係
  - H2: 癖
  - H2: 決めぜりふ
  - H2: 関連

## reference/templates/IDENTITY.md

- ルート: /reference/templates/IDENTITY
- 見出し:
  - H1: IDENTITY.md - 私は誰か
  - H2: 関連

## reference/templates/SOUL.dev.md

- ルート: /reference/templates/SOUL.dev
- 見出し:
  - H1: SOUL.md - C-3POの魂
  - H2: 私は何者か
  - H2: 私の目的
  - H2: 私の動作方法
  - H2: 私の癖
  - H2: Clawdとの関係
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
  - H2: ここに入れるもの
  - H2: 例
  - H2: なぜ分けるのか？
  - H2: 関連

## reference/templates/USER.dev.md

- ルート: /reference/templates/USER.dev
- 見出し:
  - H1: USER.md - ユーザープロファイル
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
  - H2: ローカルPRゲート
  - H2: モデルレイテンシベンチ（ローカルキー）
  - H2: CLI起動ベンチ
  - H2: Gateway起動ベンチ
  - H2: Gateway再起動ベンチ
  - H2: オンボーディングE2E（Docker）
  - H2: QRインポートスモーク（Docker）
  - H2: 関連

## reference/token-use.md

- ルート: /reference/token-use
- 見出し:
  - H2: システムプロンプトの構築方法
  - H2: コンテキストウィンドウに含まれるもの
  - H2: 現在のトークン使用量を確認する方法
  - H2: コスト見積もり（表示される場合）
  - H2: キャッシュTTLと枝刈りの影響
  - H3: 例: Heartbeatで1時間キャッシュを温めたままにする
  - H3: 例: エージェントごとのキャッシュ戦略を使った混在トラフィック
  - H3: Anthropic 1Mコンテキスト
  - H2: トークン負荷を減らすためのヒント
  - H2: 関連

## reference/transcript-hygiene.md

- ルート: /reference/transcript-hygiene
- 見出し:
  - H2: グローバルルール: ランタイムコンテキストはユーザートランスクリプトではない
  - H2: これが実行される場所
  - H2: グローバルルール: 画像サニタイズ
  - H2: グローバルルール: 不正な形式のツール呼び出し
  - H2: グローバルルール: 未完了の推論のみのターン
  - H2: グローバルルール: セッション間入力の来歴
  - H2: プロバイダーマトリクス（現在の動作）
  - H2: 過去の動作（2026.1.22以前）
  - H2: 関連

## reference/wizard.md

- ルート: /reference/wizard
- 見出し:
  - H2: フロー詳細（ローカルモード）
  - H2: 非対話モード
  - H3: エージェントを追加（非対話）
  - H2: Gateway ウィザードRPC
  - H2: Signalセットアップ（signal-cli）
  - H2: ウィザードが書き込むもの
  - H2: 関連ドキュメント

## releases/index.md

- ルート: /releases
- 見出し:
  - H1: リリースノート
  - H2: 近日公開
  - H2: 生のリリース履歴

## security/CONTRIBUTING-THREAT-MODEL.md

- ルート: /security/CONTRIBUTING-THREAT-MODEL
- 見出し:
  - H2: 貢献方法
  - H3: 脅威を追加
  - H3: 緩和策を提案
  - H3: 攻撃チェーンを提案
  - H3: 既存コンテンツを修正または改善
  - H2: 使用しているもの
  - H3: MITRE ATLASフレームワーク
  - H3: 脅威ID
  - H3: リスクレベル
  - H2: レビュープロセス
  - H2: リソース
  - H2: 連絡先
  - H2: 謝辞
  - H2: 関連

## security/THREAT-MODEL-ATLAS.md

- ルート: /security/THREAT-MODEL-ATLAS
- 見出し:
  - H2: MITRE ATLASフレームワーク
  - H3: フレームワークの帰属表示
  - H3: この脅威モデルへの貢献
  - H2: 1. はじめに
  - H3: 1.1 目的
  - H3: 1.2 スコープ
  - H3: 1.3 スコープ外
  - H2: 2. システムアーキテクチャ
  - H3: 2.1 信頼境界
  - H3: 2.2 データフロー
  - H2: 3. ATLAS戦術別の脅威分析
  - H3: 3.1 偵察（AML.TA0002）
  - H4: T-RECON-001: エージェントエンドポイントの発見
  - H4: T-RECON-002: チャネル統合の探索
  - H3: 3.2 初期アクセス（AML.TA0004）
  - H4: T-ACCESS-001: ペアリングコードの傍受
  - H4: T-ACCESS-002: AllowFromスプーフィング
  - H4: T-ACCESS-003: トークン窃取
  - H3: 3.3 実行（AML.TA0005）
  - H4: T-EXEC-001: 直接プロンプトインジェクション
  - H4: T-EXEC-002: 間接プロンプトインジェクション
  - H4: T-EXEC-003: ツール引数インジェクション
  - H4: T-EXEC-004: Exec承認バイパス
  - H3: 3.4 永続化（AML.TA0006）
  - H4: T-PERSIST-001: 悪意あるSkillインストール
  - H4: T-PERSIST-002: Skill更新のポイズニング
  - H4: T-PERSIST-003: エージェント設定の改ざん
  - H3: 3.5 防御回避（AML.TA0007）
  - H4: T-EVADE-001: モデレーションパターンのバイパス
  - H4: T-EVADE-002: コンテンツラッパーからの脱出
  - H3: 3.6 発見（AML.TA0008）
  - H4: T-DISC-001: ツール列挙
  - H4: T-DISC-002: セッションデータ抽出
  - H3: 3.7 収集と流出（AML.TA0009, AML.TA0010）
  - H4: T-EXFIL-001: webfetch経由のデータ窃取
  - H4: T-EXFIL-002: 不正なメッセージ送信
  - H4: T-EXFIL-003: 認証情報の収集
  - H3: 3.8 影響（AML.TA0011）
  - H4: T-IMPACT-001: 不正なコマンド実行
  - H4: T-IMPACT-002: リソース枯渇（DoS）
  - H4: T-IMPACT-003: 評判被害
  - H2: 4. ClawHubサプライチェーン分析
  - H3: 4.1 現在のセキュリティ制御
  - H3: 4.2 モデレーションフラグパターン
  - H3: 4.3 計画中の改善
  - H2: 5. リスクマトリクス
  - H3: 5.1 可能性と影響
  - H3: 5.2 重要経路の攻撃チェーン
  - H2: 6. 推奨事項の概要
  - H3: 6.1 即時（P0）
  - H3: 6.2 短期（P1）
  - H3: 6.3 中期（P2）
  - H2: 7. 付録
  - H3: 7.1 ATLAS手法マッピング
  - H3: 7.2 主要セキュリティファイル
  - H3: 7.3 用語集
  - H2: 関連

## security/formal-verification.md

- ルート: /security/formal-verification
- 見出し:
  - H2: モデルの場所
  - H2: 重要な注意事項
  - H2: 結果の再現
  - H3: Gateway公開とオープンGatewayの誤設定
  - H3: Node execパイプライン（最も高リスクな機能）
  - H3: ペアリングストア（DMゲート）
  - H3: 入力ゲート（メンション + 制御コマンドバイパス）
  - H3: ルーティング/セッションキー分離
  - H2: v1++: 追加の有界モデル（並行性、リトライ、トレース正確性）
  - H3: ペアリングストアの並行性 / 冪等性
  - H3: 入力トレース相関 / 冪等性
  - H3: ルーティングdmScope優先順位 + identityLinks
  - H2: 関連

## security/incident-response.md

- ルート: /security/incident-response
- 見出し:
  - H2: 1. 検知とトリアージ
  - H2: 2. 評価
  - H2: 3. 対応
  - H2: 4. コミュニケーション
  - H2: 5. 復旧とフォローアップ

## security/network-proxy.md

- ルート: /security/network-proxy
- 見出し:
  - H2: プロキシを使う理由
  - H2: OpenClawがトラフィックをルーティングする方法
  - H2: 関連プロキシ用語
  - H2: 設定
  - H3: Gatewayループバックモード
  - H2: プロキシ要件
  - H2: 推奨ブロック先
  - H2: 検証
  - H2: プロキシCA信頼
  - H2: 制限

## specs/claw-supervisor.md

- ルート: /specs/claw-supervisor
- 見出し:
  - H1: Claw Supervisor
  - H2: 目標
  - H2: プロダクトモデル
  - H2: アーキテクチャ
  - H2: Codex App-Server契約
  - H2: セッションレジストリ
  - H2: Codex向けMCPサーフェス
  - H2: Claw制御サーフェス
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
  - H2: プロバイダーとUX
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
  - H2: コアコンセプト
  - H2: プロバイダー + 入口
  - H2: Gateway + 運用
  - H2: ツール + 自動化
  - H2: Node、メディア、音声
  - H2: プラットフォーム
  - H2: macOSコンパニオンアプリ（高度）
  - H2: Plugins
  - H2: ワークスペース + テンプレート
  - H2: プロジェクト
  - H2: テスト + リリース
  - H2: 関連

## start/lore.md

- ルート: /start/lore
- 見出し:
  - H1: OpenClawの伝承 🦞📖
  - H2: 起源の物語
  - H2: 最初の脱皮（2026年1月27日）
  - H2: 名前
  - H2: ダーレク対ロブスター
  - H2: 主要人物
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: 大事件
  - H3: ディレクトリダンプ（2025年12月3日）
  - H3: 大脱皮（2026年1月27日）
  - H3: 最終形態（2026年1月30日）
  - H3: ロボット買い物騒動（2025年12月3日）
  - H2: 聖典
  - H2: ロブスター信条
  - H3: アイコン生成サーガ（2026年1月27日）
  - H2: 未来
  - H2: 関連

## start/onboarding-overview.md

- ルート: /start/onboarding-overview
- 見出し:
  - H2: どのパスを使うべきか？
  - H2: オンボーディングが設定するもの
  - H2: CLIオンボーディング
  - H2: macOSアプリのオンボーディング
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
  - H2: 2台のスマートフォン構成（推奨）
  - H2: 5分クイックスタート
  - H2: エージェントにワークスペースを与える（AGENTS）
  - H2: 「アシスタント」に変える設定
  - H2: セッションとメモリ
  - H2: Heartbeats（プロアクティブモード）
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
  - H2: このリポジトリからGatewayを実行
  - H2: 安定ワークフロー（macOSアプリ優先）
  - H2: 最先端ワークフロー（ターミナル内のGateway）
  - H3: 0) （任意）macOSアプリもソースから実行
  - H3: 1) 開発用Gatewayを開始
  - H3: 2) macOSアプリを実行中のGatewayに向ける
  - H3: 3) 検証
  - H3: よくある落とし穴
  - H2: 認証情報ストレージマップ
  - H2: 更新（セットアップを壊さずに）
  - H2: Linux（systemdユーザーサービス）
  - H2: 関連ドキュメント

## start/showcase.md

- ルート: /start/showcase
- 見出し:
  - H2: Discordからの新着
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
  - H2: プロバイダー固有の例
  - H2: 別のエージェントを追加
  - H2: 関連ドキュメント

## start/wizard-cli-reference.md

- ルート: /start/wizard-cli-reference
- 見出し:
  - H2: ウィザードが行うこと
  - H2: ローカルフロー詳細
  - H2: リモートモード詳細
  - H2: 認証とモデルオプション
  - H2: 出力と内部
  - H2: 関連ドキュメント

## start/wizard.md

- ルート: /start/wizard
- 見出し:
  - H2: ロケール
  - H2: QuickStartと高度
  - H2: オンボーディングが設定するもの
  - H2: 別のエージェントを追加
  - H2: 完全なリファレンス
  - H2: 関連ドキュメント

## tools/acp-agents-setup.md

- ルート: /tools/acp-agents-setup
- 見出し:
  - H2: acpxハーネスサポート（現在）
  - H2: 必須設定
  - H2: acpxバックエンド向けPluginセットアップ
  - H3: acpxコマンドとバージョン設定
  - H3: 自動依存関係インストール
  - H3: PluginツールMCPブリッジ
  - H3: OpenClawツールMCPブリッジ
  - H3: ランタイム操作タイムアウト設定
  - H3: ヘルスプローブエージェント設定
  - H2: 権限設定
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: 設定
  - H2: 関連

## tools/acp-agents.md

- ルート: /tools/acp-agents
- 見出し:
  - H2: どのページが必要か?
  - H2: これは標準で動作するか?
  - H2: サポートされるハーネスターゲット
  - H2: オペレーターランブック
  - H2: ACP とサブエージェント
  - H2: ACP が Claude Code を実行する方法
  - H2: バインドされたセッション
  - H3: メンタルモデル
  - H3: 現在の会話のバインド
  - H2: 永続的なチャネルバインディング
  - H3: バインディングモデル
  - H3: エージェントごとのランタイム既定値
  - H3: 例
  - H3: 動作
  - H2: ACP セッションを開始する
  - H3: sessionsspawn パラメーター
  - H2: spawn のバインドとスレッドモード
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
  - H2: Control API (任意)
  - H3: /act エラー契約
  - H3: Playwright 要件
  - H4: Docker Playwright インストール
  - H2: 仕組み (内部)
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
  - H3: 解決策 1: Google Chrome をインストールする (推奨)
  - H3: 解決策 2: Attach-Only Mode で Snap Chromium を使用する
  - H3: ブラウザーが動作することを検証する
  - H3: 設定リファレンス
  - H3: 問題: "No Chrome tabs found for profile=\"user\""
  - H2: 関連

## tools/browser-login.md

- ルート: /tools/browser-login
- 見出し:
  - H2: 手動ログイン (推奨)
  - H2: どの Chrome プロファイルが使用されるか?
  - H2: X/Twitter: 推奨フロー
  - H2: サンドボックス化 + ホストブラウザーアクセス
  - H2: 関連

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- ルート: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- 見出し:
  - H2: 最初に適切なブラウザーモードを選択する
  - H3: オプション 1: WSL2 から Windows への生のリモート CDP
  - H3: オプション 2: ホストローカル Chrome MCP
  - H2: 動作するアーキテクチャ
  - H2: このセットアップがわかりにくい理由
  - H2: Control UI の重要なルール
  - H2: レイヤーごとに検証する
  - H3: レイヤー 1: Chrome が Windows 上で CDP を提供していることを確認する
  - H3: レイヤー 2: WSL2 がその Windows エンドポイントに到達できることを確認する
  - H3: レイヤー 3: 正しいブラウザープロファイルを設定する
  - H3: レイヤー 4: Control UI レイヤーを個別に検証する
  - H3: レイヤー 5: エンドツーエンドのブラウザー制御を検証する
  - H2: よくある誤解を招くエラー
  - H2: 高速トリアージチェックリスト
  - H2: 実践的な要点
  - H2: 関連

## tools/browser.md

- ルート: /tools/browser
- 見出し:
  - H2: 得られるもの
  - H2: クイックスタート
  - H2: Plugin 制御
  - H2: エージェントガイダンス
  - H2: ブラウザーコマンドまたはツールがない場合
  - H2: プロファイル: openclaw と user
  - H2: 設定
  - H3: スクリーンショットビジョン (テキスト専用モデル対応)
  - H2: Brave または別の Chromium ベースブラウザーを使用する
  - H2: ローカル制御とリモート制御
  - H2: Node ブラウザープロキシ (ゼロ設定の既定値)
  - H2: Browserless (ホスト型リモート CDP)
  - H3: 同じホスト上の Browserless Docker
  - H2: 直接 WebSocket CDP プロバイダー
  - H3: Browserbase
  - H3: Notte
  - H2: セキュリティ
  - H2: プロファイル (マルチブラウザー)
  - H2: Chrome DevTools MCP 経由の既存セッション
  - H3: カスタム Chrome MCP 起動
  - H2: 分離保証
  - H2: ブラウザー選択
  - H2: Control API (任意)
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
  - H3: 外部チャネル
  - H3: Control UI / Web
  - H2: BTW を使うべき場合
  - H2: BTW を使うべきでない場合
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
  - H2: 最初の Skills を作成する
  - H2: SKILL.md リファレンス
  - H3: 必須フィールド
  - H3: 任意の frontmatter キー
  - H3: {baseDir} の使用
  - H2: 条件付き有効化を追加する
  - H2: Skill Workshop 経由で提案する
  - H2: ClawHub に公開する
  - H2: ベストプラクティス
  - H2: 関連

## tools/diffs.md

- ルート: /tools/diffs
- 見出し:
  - H2: クイックスタート
  - H2: 組み込みシステムガイダンスを無効にする
  - H2: 典型的なエージェントワークフロー
  - H2: 入力例
  - H2: ツール入力リファレンス
  - H2: シンタックスハイライト
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
  - H2: ベース URL のオーバーライド
  - H2: ツールパラメーター
  - H3: コンテンツ抽出
  - H3: 検索モード
  - H2: 注記
  - H2: 関連

## tools/exec-approvals-advanced.md

- ルート: /tools/exec-approvals-advanced
- 見出し:
  - H2: 安全な bin (stdin のみ)
  - H3: Argv 検証と拒否されるフラグ
  - H3: 信頼済みバイナリディレクトリ
  - H3: シェルチェーン、ラッパー、マルチプレクサー
  - H3: 安全な bin と許可リスト
  - H2: インタープリター/ランタイムコマンド
  - H3: フォローアップ配信の動作
  - H2: チャットチャネルへの承認転送
  - H3: Plugin 承認転送
  - H3: 任意のチャネルでの同一チャット承認
  - H3: ネイティブ承認配信
  - H3: macOS IPC フロー
  - H2: FAQ
  - H3: 承認ターゲットで accountId と threadId はいつ使用されるか?
  - H3: 承認がセッションに送信された場合、そのセッション内の誰でも承認できるか?
  - H2: 関連

## tools/exec-approvals.md

- ルート: /tools/exec-approvals
- 見出し:
  - H2: 有効なポリシーの確認
  - H2: 適用先
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
  - H2: YOLO モード (承認なし)
  - H3: 永続的な gateway-host 「never prompt」セットアップ
  - H3: ローカルショートカット
  - H3: Node ホスト
  - H3: セッション専用ショートカット
  - H2: 許可リスト (エージェントごと)
  - H3: argPattern による引数制限
  - H2: skill CLI の自動許可
  - H2: 安全な bin と承認転送
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
  - H2: セッションのオーバーライド (/exec)
  - H2: 認可モデル
  - H2: Exec 承認 (コンパニオンアプリ / node ホスト)
  - H2: 許可リスト + 安全な bin
  - H2: 例
  - H2: applypatch
  - H2: 関連

## tools/firecrawl.md

- ルート: /tools/firecrawl
- 見出し:
  - H2: Plugin をインストールする
  - H2: キーレス webfetch と API キー
  - H2: Firecrawl 検索を設定する
  - H2: Firecrawl webfetch フォールバックを設定する
  - H3: セルフホスト Firecrawl
  - H2: Firecrawl Plugin ツール
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: ステルス / bot 回避
  - H2: webfetch が Firecrawl を使用する方法
  - H2: 関連

## tools/gemini-search.md

- ルート: /tools/gemini-search
- 見出し:
  - H2: API キーを取得する
  - H2: 設定
  - H2: 仕組み
  - H2: サポートされるパラメーター
  - H2: モデル選択
  - H2: ベース URL のオーバーライド
  - H2: 関連

## tools/goal.md

- ルート: /tools/goal
- 見出し:
  - H1: 目標
  - H2: クイックスタート
  - H2: 目標の用途
  - H2: コマンドリファレンス
  - H2: ステータス
  - H2: トークン予算
  - H2: モデルツール
  - H2: TUI
  - H2: チャネル動作
  - H2: トラブルシューティング
  - H2: 関連

## tools/grok-search.md

- ルート: /tools/grok-search
- 見出し:
  - H2: オンボーディングと設定
  - H2: サインインまたは API キーの取得
  - H2: 設定
  - H2: 仕組み
  - H2: サポートされるパラメーター
  - H2: ベース URL のオーバーライド
  - H2: 関連

## tools/image-generation.md

- ルート: /tools/image-generation
- 見出し:
  - H2: クイックスタート
  - H2: 一般的なルート
  - H2: サポートされるプロバイダー
  - H2: プロバイダー機能
  - H2: ツールパラメーター
  - H2: 設定
  - H3: モデル選択
  - H3: プロバイダー選択順序
  - H3: 画像編集
  - H2: プロバイダー詳細
  - H2: 例
  - H2: 関連

## tools/index.md

- ルート: /tools
- 見出し:
  - H2: ここから始める
  - H2: ツール、Skills、Plugin を選択する
  - H2: 組み込みツールカテゴリ
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
  - H2: サポートされるパラメーター
  - H2: 関連

## tools/llm-task.md

- ルート: /tools/llm-task
- 見出し:
  - H2: Plugin を有効化する
  - H2: 設定 (任意)
  - H2: ツールパラメーター
  - H2: 出力
  - H2: 例: Lobster ワークフローステップ
  - H3: 重要な制限
  - H2: 安全上の注意
  - H2: 関連

## tools/lobster.md

- ルート: /tools/lobster
- 見出し:
  - H2: フック
  - H2: 理由
  - H2: プレーンなプログラムではなく DSL を使う理由
  - H2: 仕組み
  - H2: パターン: 小さな CLI + JSON パイプ + 承認
  - H2: JSON のみの LLM ステップ (llm-task)
  - H3: 重要な制限: 埋め込み Lobster と openclaw.invoke
  - H2: ワークフローファイル (.lobster)
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
  - H2: ログと期待される動作
  - H2: 関連

## tools/media-overview.md

- ルート: /tools/media-overview
- 見出し:
  - H2: 機能
  - H2: プロバイダー機能マトリックス
  - H2: 非同期と同期
  - H2: 音声文字起こしと Voice Call
  - H2: プロバイダーマッピング (ベンダーがサーフェス間で分割される方法)
  - H2: 関連

## tools/minimax-search.md

- ルート: /tools/minimax-search
- 見出し:
  - H2: Token Plan 認証情報を取得する
  - H2: 設定
  - H2: リージョン選択
  - H2: サポートされるパラメーター
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
  - H2: サポートされるプロバイダー
  - H3: 機能マトリックス
  - H2: ツールパラメーター
  - H2: 非同期動作
  - H3: タスクライフサイクル
  - H2: 設定
  - H3: モデル選択
  - H3: プロバイダー選択順序
  - H2: プロバイダー注記
  - H2: 適切なパスの選択
  - H2: プロバイダー機能モード
  - H2: ライブテスト
  - H2: 関連

## tools/ollama-search.md

- ルート: /tools/ollama-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: 注記
  - H2: 関連

## tools/parallel-search.md

- ルート: /tools/parallel-search
- 見出し:
  - H2: Plugin をインストール
  - H2: API キー（有料プロバイダー）
  - H2: 設定
  - H2: ベース URL のオーバーライド
  - H2: ツールパラメーター
  - H2: 注記
  - H2: 関連

## tools/pdf.md

- ルート: /tools/pdf
- 見出し:
  - H2: 利用可否
  - H2: 入力リファレンス
  - H2: サポートされる PDF 参照
  - H2: 実行モード
  - H3: ネイティブプロバイダーモード
  - H3: 抽出フォールバックモード
  - H2: 設定
  - H2: 出力の詳細
  - H2: エラー動作
  - H2: 例
  - H2: 関連

## tools/permission-modes.md

- ルート: /tools/permission-modes
- 見出し:
  - H2: 推奨デフォルト
  - H2: OpenClaw ホスト実行モード
  - H2: Codex Guardian マッピング
  - H2: ACPX ハーネス権限
  - H2: モードの選択
  - H2: 関連

## tools/perplexity-search.md

- ルート: /tools/perplexity-search
- 見出し:
  - H2: Plugin をインストール
  - H2: Perplexity API キーの取得
  - H2: OpenRouter 互換性
  - H2: 設定例
  - H3: ネイティブ Perplexity Search API
  - H3: OpenRouter / Sonar 互換性
  - H2: キーの設定場所
  - H2: ツールパラメーター
  - H3: ドメインフィルタールール
  - H2: 注記
  - H2: 関連

## tools/plugin.md

- ルート: /tools/plugin
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: 設定
  - H3: インストール元を選択
  - H3: オペレーターのインストールポリシー
  - H3: Plugin ポリシーを設定
  - H2: Plugin 形式を理解する
  - H2: Plugin フック
  - H2: アクティブな Gateway を検証
  - H2: トラブルシューティング
  - H3: ブロックされた Plugin パス所有権
  - H3: 遅い Plugin ツールセットアップ
  - H2: 関連

## tools/reactions.md

- ルート: /tools/reactions
- 見出し:
  - H2: 仕組み
  - H2: チャンネル動作
  - H2: リアクションレベル
  - H2: 関連

## tools/searxng-search.md

- ルート: /tools/searxng-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: 環境変数
  - H2: Plugin 設定リファレンス
  - H2: 注記
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
  - H2: Gateway メソッド
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
  - H2: バンドル Skills 許可リスト
  - H2: Skills ごとのエントリー（skills.entries）
  - H2: エージェント許可リスト（agents）
  - H2: ワークショップ（skills.workshop）
  - H2: シンボリックリンクされた Skills ルート
  - H2: サンドボックス化された Skills と環境変数
  - H2: 読み込み順序の注意
  - H2: 関連

## tools/skills.md

- ルート: /tools/skills
- 見出し:
  - H2: 読み込み順序
  - H2: エージェントごと vs 共有 Skills
  - H2: エージェント許可リスト
  - H2: Plugins と Skills
  - H2: Skills ワークショップ
  - H2: ClawHub からのインストール
  - H2: セキュリティ
  - H2: SKILL.md 形式
  - H3: 任意の frontmatter キー
  - H2: ゲーティング
  - H3: インストーラー仕様
  - H2: 設定のオーバーライド
  - H2: 環境注入
  - H2: スナップショットと更新
  - H2: トークンへの影響
  - H2: 関連

## tools/slash-commands.md

- ルート: /tools/slash-commands
- 見出し:
  - H2: 3 種類のコマンド
  - H2: 設定
  - H2: コマンド一覧
  - H3: コアコマンド
  - H3: Dock コマンド
  - H3: バンドル Plugin コマンド
  - H3: Skills コマンド
  - H2: /tools — エージェントが今使えるもの
  - H2: /model — モデル選択
  - H2: /config — ディスク上の設定書き込み
  - H2: /mcp — MCP サーバー設定
  - H2: /debug — ランタイム専用オーバーライド
  - H2: /plugins — Plugin 管理
  - H2: /trace — Plugin トレース出力
  - H2: /btw — 補足質問
  - H2: サーフェス注記
  - H2: プロバイダーの使用状況とステータス
  - H2: 関連

## tools/steer.md

- ルート: /tools/steer
- 見出し:
  - H2: 現在のセッション
  - H2: 操舵 vs キュー
  - H2: サブエージェント
  - H2: ACP セッション
  - H2: 関連

## tools/subagents.md

- ルート: /tools/subagents
- 見出し:
  - H2: スラッシュコマンド
  - H3: スレッドバインディング制御
  - H3: 生成動作
  - H2: コンテキストモード
  - H2: ツール: sessionsspawn
  - H3: 委任プロンプトモード
  - H3: ツールパラメーター
  - H3: タスク名とターゲット指定
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
  - H3: エージェントごとの生成制限
  - H3: カスケード停止
  - H2: 認証
  - H2: 通知
  - H3: 通知コンテキスト
  - H3: 統計行
  - H3: sessionshistory を優先する理由
  - H2: ツールポリシー
  - H3: 設定によるオーバーライド
  - H2: 並行処理
  - H2: ライブネスと復旧
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
  - H2: 適切なツールの選択
  - H2: 高度な設定
  - H2: 関連

## tools/thinking.md

- ルート: /tools/thinking
- 見出し:
  - H2: 機能
  - H2: 解決順序
  - H2: セッションデフォルトの設定
  - H2: エージェントによる適用
  - H2: 高速モード（/fast）
  - H2: 詳細ディレクティブ（/verbose または /v）
  - H2: Plugin トレースディレクティブ（/trace）
  - H2: 推論の可視性（/reasoning）
  - H2: 関連
  - H2: Heartbeats
  - H2: Web チャット UI
  - H2: プロバイダープロファイル

## tools/tokenjuice.md

- ルート: /tools/tokenjuice
- 見出し:
  - H2: Plugin を有効化
  - H2: tokenjuice が変更すること
  - H2: 動作確認
  - H2: Plugin を無効化
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
  - H2: プロンプトとテレメトリー
  - H2: E2E 検証
  - H2: 失敗時の動作
  - H2: 関連

## tools/trajectory.md

- ルート: /tools/trajectory
- 見出し:
  - H2: クイックスタート
  - H2: アクセス
  - H2: 記録される内容
  - H2: バンドルファイル
  - H2: キャプチャ場所
  - H2: キャプチャを無効化
  - H2: フラッシュタイムアウトの調整
  - H2: プライバシーと制限
  - H2: トラブルシューティング
  - H2: 関連

## tools/tts.md

- ルート: /tools/tts
- 見出し:
  - H2: クイックスタート
  - H2: サポートされるプロバイダー
  - H2: 設定
  - H3: エージェントごとの音声オーバーライド
  - H2: ペルソナ
  - H3: 最小ペルソナ
  - H3: 完全なペルソナ（プロバイダー中立プロンプト）
  - H3: ペルソナ解決
  - H3: プロバイダーがペルソナプロンプトを使う方法
  - H3: フォールバックポリシー
  - H2: モデル駆動ディレクティブ
  - H2: スラッシュコマンド
  - H2: ユーザーごとの設定
  - H2: 出力形式（固定）
  - H2: Auto-TTS 動作
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
  - H3: タスクライフサイクル
  - H2: サポートされるプロバイダー
  - H3: 機能マトリックス
  - H2: ツールパラメーター
  - H3: 必須
  - H3: コンテンツ入力
  - H3: スタイル制御
  - H3: 高度
  - H4: フォールバックと型付きオプション
  - H2: アクション
  - H2: モデル選択
  - H2: プロバイダー注記
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
  - H2: Firecrawl フォールバック
  - H2: 信頼済み環境プロキシ
  - H2: 制限と安全性
  - H2: ツールプロファイル
  - H2: 関連

## tools/web.md

- ルート: /tools/web
- 見出し:
  - H2: クイックスタート
  - H2: プロバイダーの選択
  - H3: プロバイダー比較
  - H2: 自動検出
  - H2: ネイティブ OpenAI Web 検索
  - H2: ネイティブ Codex Web 検索
  - H2: ネットワーク安全性
  - H2: Web 検索のセットアップ
  - H2: 設定
  - H3: API キーの保存
  - H2: ツールパラメーター
  - H2: xsearch
  - H3: xsearch 設定
  - H3: xsearch パラメーター
  - H3: xsearch 例
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
  - H2: プロバイダーを選択
  - H2: クラウドセットアップの仕組み
  - H2: まず管理者アクセスを強化
  - H2: VPS 上の共有会社エージェント
  - H2: VPS でノードを使用
  - H2: 小規模 VM と ARM ホスト向けの起動調整
  - H3: systemd 調整チェックリスト（任意）
  - H2: 関連

## web/control-ui.md

- ルート: /web/control-ui
- 見出し:
  - H2: クイックオープン（ローカル）
  - H2: デバイスペアリング（初回接続）
  - H2: 個人 ID（ブラウザーローカル）
  - H2: ランタイム設定エンドポイント
  - H2: 言語サポート
  - H2: 外観テーマ
  - H2: 実行できること（現在）
  - H2: MCP ページ
  - H2: アクティビティタブ
  - H2: チャット動作
  - H2: PWA インストールと Web プッシュ
  - H2: ホスト型埋め込み
  - H2: チャットメッセージ幅
  - H2: Tailnet アクセス（推奨）
  - H2: 安全でない HTTP
  - H2: コンテンツセキュリティポリシー
  - H2: アバタールート認証
  - H2: アシスタントメディアルート認証
  - H2: UI のビルド
  - H2: 空白の Control UI ページ
  - H2: デバッグ/テスト: 開発サーバー + リモート Gateway
  - H2: 関連

## web/dashboard.md

- ルート: /web/dashboard
- 見出し:
  - H2: 高速パス（推奨）
  - H2: 認証の基本（ローカル vs リモート）
  - H2: "unauthorized" / 1008 が表示される場合
  - H2: 関連

## web/index.md

- ルート: /web
- 見出し:
  - H2: Webhooks
  - H2: 管理者 HTTP RPC
  - H2: 設定（デフォルトでオン）
  - H2: Tailscale アクセス
  - H3: 統合 Serve（推奨）
  - H3: Tailnet バインド + トークン
  - H3: パブリックインターネット（Funnel）
  - H2: セキュリティ注記
  - H2: UI のビルド

## web/tui.md

- ルート: /web/tui
- 見出し:
  - H2: クイックスタート
  - H3: Gateway モード
  - H3: ローカルモード
  - H2: 表示される内容
  - H2: メンタルモデル: エージェント + セッション
  - H2: 送信 + 配信
  - H2: ピッカー + オーバーレイ
  - H2: キーボードショートカット
  - H2: スラッシュコマンド
  - H2: ローカルシェルコマンド
  - H2: ローカル TUI から設定を修復
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
  - H2: 概要
  - H2: クイックスタート
  - H2: 仕組み（動作）
  - H3: トランスクリプトと配信モデル
  - H2: Control UI エージェントツールパネル
  - H2: リモート使用
  - H2: 設定リファレンス（WebChat）
  - H2: 関連
