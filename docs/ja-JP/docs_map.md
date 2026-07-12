---
read_when: Finding which docs page covers a topic before reading the page
summary: OpenClawドキュメントページ用に生成された見出しマップ
title: ドキュメントマップ
x-i18n:
    generated_at: "2026-07-12T14:26:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 691c999d749d88c4c350c4b6dd197a57418dd915587a73e1bbeb6d54b45061de
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw ドキュメントマップ

このファイルは、エージェントがドキュメントツリー内を移動しやすいよう、`docs/**/*.md` および `docs/**/*.mdx` の見出しから生成されます。
手動で編集せず、`pnpm docs:map:gen` を実行してください。

## agent-runtime-architecture.md

- ルート: /agent-runtime-architecture
- 見出し:
  - H2: ランタイムの構成
  - H2: 境界
  - H2: マニフェスト
  - H2: ランタイムの選択
  - H2: 関連項目

## announcements/bluebubbles-imessage.md

- ルート: /announcements/bluebubbles-imessage
- 見出し:
  - H1: BlueBubbles の削除と imsg iMessage パス
  - H2: 変更内容
  - H2: 対応方法
  - H2: 移行に関する注意事項
  - H2: 関連項目

## auth-credential-semantics.md

- ルート: /auth-credential-semantics
- 見出し:
  - H2: 安定したプローブ理由コード
  - H2: トークンクレデンシャル
  - H3: 適格性ルール
  - H3: 解決ルール
  - H2: エージェントコピーの移植性
  - H2: 設定のみの認証ルート
  - H2: 明示的な認証順序フィルタリング
  - H2: プローブ対象の解決
  - H2: 外部 CLI クレデンシャルの検出
  - H2: OAuth SecretRef ポリシーガード
  - H2: レガシー互換メッセージング
  - H2: 関連項目

## automation/auth-monitoring.md

- ルート: /automation/auth-monitoring
- 見出し:
  - H2: 関連項目

## automation/clawflow.md

- ルート: /automation/clawflow
- 見出し:
  - H2: 関連項目

## automation/cron-jobs.md

- ルート: /automation/cron-jobs
- 見出し:
  - H2: クイックスタート
  - H2: Cron の仕組み
  - H2: スケジュールの種類
  - H3: 日付と曜日では OR ロジックを使用
  - H2: イベントトリガー（条件ウォッチャー）
  - H2: ペイロード
  - H3: エージェントターンのオプション
  - H3: コマンドペイロード
  - H2: 実行形式
  - H2: 配信と出力
  - H3: 失敗通知
  - H3: 出力言語
  - H2: CLI の例
  - H2: ジョブの管理
  - H2: Webhook
  - H3: 認証
  - H2: Gmail PubSub 連携
  - H3: ウィザードによるセットアップ（推奨）
  - H3: Gateway の自動起動
  - H3: 手動による初回セットアップ
  - H3: Gmail モデルのオーバーライド
  - H2: 設定
  - H2: トラブルシューティング
  - H3: コマンドの段階的確認
  - H2: 関連項目

## automation/cron-vs-heartbeat.md

- ルート: /automation/cron-vs-heartbeat
- 見出し:
  - H2: 関連項目

## automation/gmail-pubsub.md

- ルート: /automation/gmail-pubsub
- 見出し:
  - H2: 関連項目

## automation/hooks.md

- ルート: /automation/hooks
- 見出し:
  - H2: 適切なインターフェースの選択
  - H2: クイックスタート
  - H2: イベントの種類
  - H2: フックの作成
  - H3: フックの構造
  - H3: HOOK.md の形式
  - H3: ハンドラーの実装
  - H3: イベントコンテキストの要点
  - H2: フックの検出
  - H3: フックパック
  - H2: バンドル済みフック
  - H3: session-memory の詳細
  - H3: bootstrap-extra-files の設定
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
  - H2: 関連項目

## automation/index.md

- ルート: /automation
- 見出し:
  - H2: クイック判断ガイド
  - H3: スケジュール済みタスク（Cron）と Heartbeat
  - H2: 中核となる概念
  - H3: スケジュール済みタスク（Cron）
  - H3: タスク
  - H3: 推論されたコミットメント
  - H3: タスクフロー
  - H3: 常設指示
  - H3: フック
  - H3: Heartbeat
  - H2: 連携の仕組み
  - H2: 関連項目

## automation/poll.md

- ルート: /automation/poll
- 見出し:
  - H2: 関連項目

## automation/standing-orders.md

- ルート: /automation/standing-orders
- 見出し:
  - H2: 常設指示を使用する理由
  - H2: 仕組み
  - H2: 常設指示の構成
  - H2: 常設指示と Cron ジョブの併用
  - H2: 例
  - H3: 例 1: コンテンツとソーシャルメディア（週次サイクル）
  - H3: 例 2: 財務業務（イベントトリガー型）
  - H3: 例 3: 監視とアラート（継続的）
  - H2: 実行・検証・報告パターン
  - H2: マルチプログラムアーキテクチャ
  - H2: ベストプラクティス
  - H3: 推奨事項
  - H3: 避けるべき事項
  - H2: 関連項目

## automation/taskflow.md

- ルート: /automation/taskflow
- 見出し:
  - H2: タスクフローを使用する場面
  - H2: 同期モード
  - H3: 管理モード
  - H3: ミラーモード
  - H2: フローのステータス
  - H2: 永続的な状態とリビジョン追跡
  - H2: キャンセル時の動作
  - H2: CLI コマンド
  - H2: 信頼性の高いスケジュール済みワークフローパターン
  - H2: フローとタスクの関係
  - H2: 関連項目

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
  - H3: コントロール UI
  - H2: ステータス連携（タスク負荷）
  - H2: ストレージとメンテナンス
  - H3: タスクの保存場所
  - H3: 自動メンテナンス
  - H2: タスクと他のシステムの関係
  - H2: 関連項目

## automation/troubleshooting.md

- ルート: /automation/troubleshooting
- 見出し:
  - H2: 関連項目

## automation/webhook.md

- ルート: /automation/webhook
- 見出し:
  - H2: 関連項目

## brave-search.md

- ルート: /brave-search
- 見出し:
  - H2: 関連項目

## channels/access-groups.md

- ルート: /channels/access-groups
- 見出し:
  - H2: 静的メッセージ送信者グループ
  - H2: 許可リストからの参照グループ
  - H2: サポートされるメッセージチャネルパス
  - H2: Discord チャネルの対象者
  - H2: Plugin の診断
  - H2: セキュリティ上の注意事項
  - H2: トラブルシューティング

## channels/ambient-room-events.md

- ルート: /channels/ambient-room-events
- 見出し:
  - H2: 推奨セットアップ
  - H2: 変更内容
  - H2: Discord の例
  - H2: Slack の例
  - H2: Telegram の例
  - H2: エージェント固有のポリシー
  - H2: 表示される返信モード
  - H2: 履歴
  - H2: トラブルシューティング
  - H2: 関連項目

## channels/bot-loop-protection.md

- ルート: /channels/bot-loop-protection
- 見出し:
  - H2: デフォルト
  - H2: 共有デフォルトの設定
  - H2: チャネル、アカウント、またはルームごとのオーバーライド
  - H2: チャネルのサポート状況

## channels/broadcast-groups.md

- ルート: /channels/broadcast-groups
- 見出し:
  - H2: 概要
  - H2: 設定
  - H3: 基本セットアップ
  - H3: 処理戦略
  - H3: 完全な例
  - H2: 仕組み
  - H3: メッセージフロー
  - H3: セッションの分離
  - H3: 例: 分離されたセッション
  - H2: ユースケース
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
  - H2: 関連項目

## channels/channel-routing.md

- ルート: /channels/channel-routing
- 見出し:
  - H1: チャネルとルーティング
  - H2: 主要用語
  - H2: 送信先プレフィックス
  - H2: セッションキーの形式（例）
  - H2: メイン DM ルートの固定
  - H2: 保護された受信記録
  - H2: ルーティングルール（エージェントの選択方法）
  - H2: ブロードキャストグループ（複数のエージェントを実行）
  - H2: 設定の概要
  - H2: セッションストレージ
  - H2: WebChat の動作
  - H2: 返信コンテキスト
  - H2: 関連項目

## channels/clickclack.md

- ルート: /channels/clickclack
- 見出し:
  - H2: クイックセットアップ
  - H3: アカウント設定キー
  - H2: 複数のボット
  - H2: 返信モード
  - H2: エージェントアクティビティ行
  - H2: 対象
  - H2: 権限
  - H2: トラブルシューティング

## channels/discord.md

- ルート: /channels/discord
- 見出し:
  - H2: クイックセットアップ
  - H2: 推奨: ギルドワークスペースをセットアップする
  - H2: ランタイムモデル
  - H2: フォーラムチャネル
  - H2: インタラクティブコンポーネント
  - H2: アクセス制御とルーティング
  - H3: ロールベースのエージェントルーティング
  - H2: ネイティブコマンドとコマンド認証
  - H2: 機能の詳細
  - H2: ツールとアクションゲート
  - H2: Components v2 UI
  - H2: 音声
  - H3: 音声チャネル
  - H3: 音声チャネル内でユーザーを追跡
  - H3: 音声メッセージ
  - H2: トラブルシューティング
  - H2: 設定リファレンス
  - H2: 安全性と運用
  - H2: 関連項目

## channels/feishu.md

- ルート: /channels/feishu
- 見出し:
  - H2: クイックスタート
  - H2: アクセス制御
  - H3: ダイレクトメッセージ
  - H3: グループチャット
  - H2: グループ設定の例
  - H3: すべてのグループを許可し、@メンションを不要にする
  - H3: すべてのグループを許可するが、引き続き @メンションを必須にする
  - H3: 特定のグループのみ許可する
  - H3: グループ内の送信者を制限する
  - H2: グループ ID／ユーザー ID の取得
  - H3: グループ ID（chatid、形式: ocxxx）
  - H3: ユーザー ID（openid、形式: ouxxx）
  - H2: 一般的なコマンド
  - H2: トラブルシューティング
  - H3: グループチャットでボットが応答しない
  - H3: ボットがメッセージを受信しない
  - H3: Feishu モバイルアプリで QR セットアップが反応しない
  - H3: App Secret の漏洩
  - H2: 高度な設定
  - H3: 複数のアカウント
  - H3: メッセージの制限
  - H3: ストリーミング
  - H3: クォータの最適化
  - H3: グループセッションのスコープとトピックスレッド
  - H3: Feishu ワークスペースツール
  - H3: ACP セッション
  - H4: 永続的な ACP バインド
  - H4: チャットから ACP を生成
  - H3: マルチエージェントルーティング
  - H2: ユーザーごとのエージェント分離（動的エージェント作成）
  - H3: クイックセットアップ
  - H3: 仕組み
  - H3: 設定オプション
  - H3: セッションスコープ
  - H3: 一般的なマルチユーザーデプロイ
  - H3: 検証
  - H3: 注意事項
  - H2: 設定リファレンス
  - H2: サポートされるメッセージの種類
  - H3: 受信
  - H3: 送信
  - H3: スレッドと返信
  - H2: 関連項目

## channels/googlechat.md

- ルート: /channels/googlechat
- 見出し:
  - H2: インストール
  - H2: クイックセットアップ（初心者向け）
  - H2: Google Chat への追加
  - H2: 公開 URL（Webhook のみ）
  - H3: オプション A: Tailscale Funnel（推奨）
  - H3: オプション B: リバースプロキシ（Caddy）
  - H3: オプション C: Cloudflare Tunnel
  - H2: 仕組み
  - H2: 対象
  - H2: 設定の要点
  - H2: トラブルシューティング
  - H3: 405 Method Not Allowed
  - H3: その他の問題
  - H2: 関連項目

## channels/group-messages.md

- ルート: /channels/group-messages
- 見出し:
  - H2: 動作
  - H2: 設定例（WhatsApp）
  - H3: 有効化コマンド（所有者のみ）
  - H2: 使用方法
  - H2: テスト／検証
  - H2: 既知の考慮事項
  - H2: 関連項目

## channels/groups.md

- ルート: /channels/groups
- 見出し:
  - H2: 初心者向け概要（2 分）
  - H2: 表示される返信
  - H2: コンテキストの可視性と許可リスト
  - H2: セッションキー
  - H2: パターン: 個人 DM + 公開グループ（単一エージェント）
  - H2: 表示ラベル
  - H2: グループポリシー
  - H2: メンションゲート（デフォルト）
  - H2: スコープ別に設定されたメンションパターン
  - H2: グループ／チャネルのツール制限（任意）
  - H2: グループ許可リスト
  - H2: 有効化（所有者のみ）
  - H2: コンテキストフィールド
  - H2: iMessage 固有の事項
  - H2: WhatsApp システムプロンプト
  - H2: WhatsApp 固有の事項
  - H2: 関連項目

## channels/imessage-from-bluebubbles.md

- ルート: /channels/imessage-from-bluebubbles
- 見出し:
  - H2: 移行チェックリスト
  - H2: imsg の機能
  - H2: 開始する前に
  - H2: 設定の変換
  - H2: グループレジストリの落とし穴
  - H2: 手順
  - H2: アクションの同等性の概要
  - H2: ペアリング、セッション、ACP バインド
  - H2: ロールバック用チャネルなし
  - H2: 関連項目

## channels/imessage.md

- ルート: /channels/imessage
- 見出し:
  - H2: クイックセットアップ
  - H2: 要件と権限（macOS）
  - H2: imsg プライベート API の有効化
  - H3: セットアップ
  - H3: SIP を有効なままにする場合
  - H2: アクセス制御とルーティング
  - H2: ACP 会話バインド
  - H2: デプロイパターン
  - H2: メディア、チャンク分割、配信先
  - H2: プライベート API アクション
  - H2: 設定の書き込み
  - H2: 分割送信された DM の統合（1 回の作成でコマンド + URL）
  - H3: シナリオとエージェントに表示される内容
  - H2: ブリッジまたは Gateway の再起動後の受信復旧
  - H3: オペレーターに表示されるシグナル
  - H3: 移行
  - H2: トラブルシューティング
  - H2: 設定リファレンスへの参照
  - H2: 関連項目

## channels/index.md

- ルート: /channels
- 見出し:
  - H2: サポートされるチャネル
  - H2: 配信に関する注意事項
  - H2: 注意事項

## channels/irc.md

- ルート: /channels/irc
- 見出し:
  - H2: クイックスタート
  - H2: 接続設定
  - H2: セキュリティのデフォルト
  - H2: アクセス制御
  - H3: よくある落とし穴: allowFrom はチャネルではなく DM 用
  - H2: 返信のトリガー（メンション）
  - H2: セキュリティ上の注意（公開チャネルでは推奨）
  - H3: チャネル内の全員に同じツールを使用
  - H3: 送信者ごとに異なるツールを使用（所有者にはより強い権限）
  - H2: NickServ
  - H2: 環境変数
  - H2: トラブルシューティング
  - H2: 関連項目

## channels/line.md

- ルート: /channels/line
- 見出し:
  - H2: インストール
  - H2: セットアップ
  - H2: 設定
  - H2: アクセス制御
  - H2: メッセージの動作
  - H2: チャンネルデータ（リッチメッセージ）
  - H2: ACP 対応
  - H2: 送信メディア
  - H2: トラブルシューティング
  - H2: 関連情報

## channels/location.md

- ルート: /channels/location
- 見出し:
  - H2: テキストの書式設定
  - H2: コンテキストフィールド
  - H2: 送信ペイロード
  - H2: チャンネルに関する注意事項
  - H2: 関連情報

## channels/matrix-migration.md

- ルート: /channels/matrix-migration
- 見出し:
  - H2: 移行によって自動的に行われること
  - H2: 2026.4 より前の OpenClaw リリースからのアップグレード
  - H2: 推奨アップグレード手順
  - H2: よくあるメッセージとその意味
  - H3: 手動復旧メッセージ
  - H2: 暗号化された履歴が復元されない場合
  - H2: 今後のメッセージを新しい状態で開始する場合
  - H2: 関連情報

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
  - H2: 複数ボットに関する注意事項
  - H2: ホームサーバーに関する注意事項
  - H2: 関連情報

## channels/matrix.md

- ルート: /channels/matrix
- 見出し:
  - H2: インストール
  - H2: セットアップ
  - H3: 対話型セットアップ
  - H3: 最小構成
  - H3: 自動参加
  - H3: 許可リストの対象形式
  - H3: アカウント ID の正規化
  - H3: キャッシュされた認証情報
  - H3: 環境変数
  - H2: 設定例
  - H2: ストリーミングプレビュー
  - H2: 音声メッセージ
  - H2: 承認メタデータ
  - H3: 確定済みプレビューを静かにするセルフホスト型プッシュルール
  - H2: ボット間ルーム
  - H2: 暗号化と検証
  - H3: 暗号化を有効にする
  - H3: ステータスと信頼シグナル
  - H3: リカバリーキーでこのデバイスを検証する
  - H3: クロス署名を初期化または修復する
  - H3: ルームキーのバックアップ
  - H3: 検証の一覧表示、要求、応答
  - H3: 複数アカウントに関する注意事項
  - H2: プロファイル管理
  - H2: スレッド
  - H3: セッションルーティング（sessionScope）
  - H3: 返信のスレッド化（threadReplies）
  - H3: スレッドの継承とスラッシュコマンド
  - H2: ACP 会話バインディング
  - H3: スレッドバインディング設定
  - H2: リアクション
  - H2: 履歴コンテキスト
  - H2: コンテキストの可視性
  - H2: DM とルームのポリシー
  - H2: ダイレクトルームの修復
  - H2: 実行承認
  - H2: スラッシュコマンド
  - H2: 複数アカウント
  - H2: プライベート/LAN ホームサーバー
  - H2: Matrix トラフィックのプロキシ
  - H2: 対象の解決
  - H2: 設定リファレンス
  - H3: アカウントと接続
  - H3: 暗号化
  - H3: アクセスとポリシー
  - H3: 返信動作
  - H3: リアクション設定
  - H3: ツール機能とルームごとの上書き
  - H3: 実行承認の設定
  - H2: 関連情報

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
  - H2: チャンネル（グループ）
  - H2: 送信先
  - H2: DM チャンネルの再試行
  - H2: プレビューストリーミング
  - H2: リアクション（メッセージツール）
  - H2: インタラクティブボタン（メッセージツール）
  - H3: API の直接統合（外部スクリプト）
  - H2: ディレクトリアダプター
  - H2: 複数アカウント
  - H2: トラブルシューティング
  - H2: 関連情報

## channels/msteams.md

- ルート: /channels/msteams
- 見出し:
  - H2: バンドルされた Plugin
  - H2: クイックセットアップ
  - H2: 目標
  - H2: 設定の書き込み
  - H2: アクセス制御（DM + グループ）
  - H3: 仕組み
  - H3: ステップ 1: Azure Bot を作成する
  - H3: ステップ 2: 認証情報を取得する
  - H3: ステップ 3: メッセージングエンドポイントを設定する
  - H3: ステップ 4: Teams チャンネルを有効にする
  - H3: ステップ 5: Teams アプリマニフェストを作成する
  - H3: ステップ 6: OpenClaw を設定する
  - H3: ステップ 7: Gateway を実行する
  - H2: フェデレーション認証（証明書とマネージド ID）
  - H3: オプション A: 証明書ベースの認証
  - H3: オプション B: Azure Managed Identity
  - H3: AKS Workload Identity のセットアップ
  - H3: 認証タイプの比較
  - H2: ローカル開発（トンネリング）
  - H2: ボットのテスト
  - H2: 環境変数
  - H2: メンバー情報アクション
  - H2: 履歴コンテキスト
  - H2: 現在の Teams RSC 権限（マニフェスト）
  - H2: Teams マニフェストの例（編集済み）
  - H3: マニフェストの注意点（必須フィールド）
  - H3: 既存アプリの更新
  - H2: 機能: RSC のみと Graph の比較
  - H3: Teams RSC のみの場合（アプリはインストール済み、Graph API 権限なし）
  - H3: Teams RSC + Microsoft Graph アプリケーション権限の場合
  - H3: RSC と Graph API の比較
  - H2: Graph 対応のメディアと履歴
  - H3: チャンネル/グループのファイル復旧（graphMediaFallback）
  - H2: 既知の制限事項
  - H3: Webhook のタイムアウト
  - H3: Teams クラウドとサービス URL の対応
  - H3: 書式設定
  - H2: 設定
  - H2: ルーティングとセッション
  - H2: 返信形式: スレッドと投稿
  - H3: 解決の優先順位
  - H3: スレッドコンテキストの保持
  - H2: 添付ファイルと画像
  - H2: グループチャットでのファイル送信
  - H3: グループチャットで SharePoint が必要な理由
  - H3: セットアップ
  - H3: 共有動作
  - H3: フォールバック動作
  - H3: ファイルの保存場所
  - H2: 投票（Adaptive Cards）
  - H2: プレゼンテーションカード
  - H2: 対象形式
  - H2: プロアクティブメッセージング
  - H2: チーム ID とチャンネル ID（よくある落とし穴）
  - H2: プライベートチャンネル
  - H2: トラブルシューティング
  - H3: よくある問題
  - H3: マニフェストのアップロードエラー
  - H3: RSC 権限が機能しない
  - H2: 参考資料
  - H2: 関連情報

## channels/nextcloud-talk.md

- ルート: /channels/nextcloud-talk
- 見出し:
  - H2: インストール
  - H2: クイックセットアップ（初心者向け）
  - H2: 注意事項
  - H2: アクセス制御（DM）
  - H2: ルーム（グループ）
  - H2: 機能
  - H2: 設定リファレンス（Nextcloud Talk）
  - H2: 関連情報

## channels/nostr.md

- ルート: /channels/nostr
- 見出し:
  - H2: インストール
  - H3: 非対話型セットアップ
  - H2: クイックセットアップ
  - H2: 設定リファレンス
  - H2: プロファイルメタデータ
  - H2: アクセス制御
  - H3: DM ポリシー
  - H3: 許可リストの例
  - H2: キー形式
  - H2: リレー
  - H2: プロトコル対応
  - H2: テスト
  - H3: ローカルリレー
  - H3: 手動テスト
  - H2: トラブルシューティング
  - H3: メッセージを受信できない
  - H3: 応答を送信できない
  - H3: 応答が重複する
  - H2: セキュリティ
  - H2: 制限事項（MVP）
  - H2: 関連情報

## channels/pairing.md

- ルート: /channels/pairing
- 見出し:
  - H2: 1) DM ペアリング（受信チャットへのアクセス）
  - H3: 送信者を承認する
  - H3: 再利用可能な送信者グループ
  - H3: 状態の保存場所
  - H2: 2) Node デバイスのペアリング（iOS/Android/macOS/ヘッドレス Node）
  - H3: Control UI からペアリングする（推奨）
  - H3: Telegram 経由でペアリングする
  - H3: Node デバイスを承認する
  - H3: オプションの信頼済み CIDR による Node の自動承認
  - H3: Node ペアリング状態の保存先
  - H3: 注意事項
  - H2: 関連ドキュメント

## channels/qa-channel.md

- ルート: /channels/qa-channel
- 見出し:
  - H2: 機能
  - H2: 設定
  - H2: ランナー
  - H2: 関連情報

## channels/qqbot.md

- ルート: /channels/qqbot
- 見出し:
  - H2: インストール
  - H2: セットアップ
  - H2: 設定
  - H3: アクセスポリシー
  - H3: 複数アカウントのセットアップ
  - H3: グループチャット
  - H3: 音声（STT / TTS）
  - H2: 対象形式
  - H2: スラッシュコマンド
  - H2: メディアとストレージ
  - H2: トラブルシューティング
  - H2: 関連情報

## channels/raft.md

- ルート: /channels/raft
- 見出し:
  - H2: インストール
  - H2: 前提条件
  - H2: 設定
  - H2: 仕組み
  - H2: 検証
  - H2: トラブルシューティング
  - H2: 参考資料

## channels/signal.md

- ルート: /channels/signal
- 見出し:
  - H2: 電話番号モデル（最初にお読みください）
  - H2: インストール
  - H2: クイックセットアップ
  - H2: 概要
  - H2: セットアップ方法 A: 既存の Signal アカウントをリンクする（QR）
  - H2: セットアップ方法 B: 専用ボット番号を登録する（SMS、Linux）
  - H2: 外部デーモンモード（httpUrl）
  - H2: コンテナモード（bbernhard/signal-cli-rest-api）
  - H2: アクセス制御（DM + グループ）
  - H2: 仕組み（動作）
  - H2: メディアと制限
  - H2: 入力中表示と既読通知
  - H2: ライフサイクル状態のリアクション
  - H2: リアクション（メッセージツール）
  - H2: 承認リアクション
  - H2: 配信先（CLI/cron）
  - H2: エイリアス
  - H2: トラブルシューティング
  - H2: セキュリティに関する注意事項
  - H2: 設定リファレンス（Signal）
  - H2: 関連情報

## channels/slack.md

- ルート: /channels/slack
- 見出し:
  - H2: トランスポートの選択
  - H3: リレーモード
  - H3: Enterprise Grid の組織全体へのインストール
  - H4: Socket Mode
  - H4: HTTP Request URLs
  - H2: インストール
  - H2: クイックセットアップ
  - H2: Socket Mode トランスポートの調整
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
  - H2: 入力中リアクションのフォールバック
  - H2: 音声入力
  - H2: メディア、分割、配信
  - H2: コマンドとスラッシュ動作
  - H2: ネイティブチャート
  - H2: ネイティブテーブル
  - H2: インタラクティブな返信
  - H3: Plugin 所有のモーダル送信
  - H2: Slack のネイティブ承認
  - H2: イベントと運用動作
  - H2: 設定リファレンス
  - H2: トラブルシューティング
  - H2: 添付メディアのリファレンス
  - H3: 対応メディアタイプ
  - H3: 受信パイプライン
  - H3: スレッドルートの添付ファイル継承
  - H3: 複数添付ファイルの処理
  - H3: サイズ、ダウンロード、モデルの制限
  - H3: 既知の制限
  - H3: 関連ドキュメント
  - H2: 関連情報

## channels/sms.md

- ルート: /channels/sms
- 見出し:
  - H2: はじめる前に
  - H2: クイックセットアップ
  - H2: 設定例
  - H3: 設定ファイル
  - H3: 環境変数
  - H3: SecretRef 認証トークン
  - H3: Messaging Service の送信者
  - H3: デフォルトの送信先
  - H2: アクセス制御
  - H2: SMS の送信
  - H2: セットアップの検証
  - H3: macOS の iMessage/SMS からのエンドツーエンドテスト
  - H2: Webhook セキュリティ
  - H2: 複数アカウントの設定
  - H2: トラブルシューティング
  - H3: Twilio が 403 を返す、または OpenClaw が Webhook を拒否する
  - H3: ペアリング要求が表示されない
  - H3: 送信に失敗する
  - H3: メッセージは届くがエージェントが応答しない

## channels/synology-chat.md

- ルート: /channels/synology-chat
- 見出し:
  - H2: インストール
  - H2: クイックセットアップ
  - H2: 環境変数
  - H2: DM ポリシーとアクセス制御
  - H2: 送信
  - H2: 複数アカウント
  - H2: セキュリティに関する注意事項
  - H2: トラブルシューティング
  - H2: 関連情報

## channels/telegram.md

- ルート: /channels/telegram
- 見出し:
  - H2: クイックセットアップ
  - H2: Telegram 側の設定
  - H2: ダッシュボード Mini App
  - H2: アクセス制御と有効化
  - H3: グループボットの ID
  - H2: ランタイム動作
  - H2: 機能リファレンス
  - H2: エラー応答の制御
  - H2: トラブルシューティング
  - H2: 設定リファレンス
  - H2: 関連情報

## channels/tlon.md

- ルート: /channels/tlon
- 見出し:
  - H2: バンドルされた Plugin
  - H2: セットアップ
  - H2: プライベート/LAN ship
  - H2: グループチャンネル
  - H2: アクセス制御
  - H2: 所有者と承認システム
  - H2: 自動承認設定
  - H2: Urbit 設定ストアによるホットリロード
  - H2: 配信先（CLI/cron）
  - H2: バンドルされたスキル
  - H2: 機能
  - H2: トラブルシューティング
  - H2: 設定リファレンス
  - H2: 注意事項
  - H2: 関連情報

## channels/troubleshooting.md

- ルート: /channels/troubleshooting
- 見出し:
  - H2: コマンドの段階的な実行
  - H2: アップデート後
  - H2: WhatsApp
  - H3: WhatsApp の障害パターン
  - H2: Telegram
  - H3: Telegram の障害パターン
  - H2: Discord
  - H3: Discord の障害パターン
  - H2: Slack
  - H3: Slack の障害パターン
  - H2: iMessage
  - H3: iMessage の障害パターン
  - H2: Signal
  - H3: Signal の障害パターン
  - H2: QQ Bot
  - H3: QQ Bot の障害パターン
  - H2: Matrix
  - H3: Matrix の障害パターン
  - H2: 関連情報

## channels/twitch.md

- ルート: /channels/twitch
- 見出し:
  - H2: インストール
  - H2: クイックセットアップ
  - H2: 概要
  - H2: トークンの更新（任意）
  - H2: 複数アカウントのサポート
  - H2: アクセス制御
  - H2: トラブルシューティング
  - H2: 設定
  - H3: アカウント設定
  - H3: プロバイダーオプション
  - H2: ツールアクション
  - H2: 安全性と運用
  - H2: 制限
  - H2: 関連項目

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
  - H2: インストール
  - H2: クイックセットアップ
  - H2: デプロイパターン
  - H2: ランタイムモデル
  - H2: MeowCaller で現在のリクエスターに電話する（実験的）
  - H2: 承認プロンプト
  - H2: Plugin フックとプライバシー
  - H2: アクセス制御と有効化
  - H2: 設定済みの ACP バインディング
  - H2: 個人番号と自分宛てチャットの動作
  - H2: メッセージの正規化とコンテキスト
  - H2: 配信、チャンク分割、メディア
  - H2: 返信の引用
  - H2: リアクションレベル
  - H2: 確認リアクション
  - H2: ライフサイクルステータスのリアクション
  - H2: 複数アカウントと認証情報
  - H2: ツール、アクション、設定の書き込み
  - H2: トラブルシューティング
  - H2: システムプロンプト
  - H2: 設定リファレンスへのポインター
  - H2: 関連項目

## channels/yuanbao.md

- ルート: /channels/yuanbao
- 見出し:
  - H2: クイックスタート
  - H3: 対話型セットアップ（代替）
  - H2: アクセス制御
  - H3: ダイレクトメッセージ
  - H3: グループチャット
  - H2: 設定例
  - H2: よく使うコマンド
  - H2: トラブルシューティング
  - H2: 高度な設定
  - H3: 複数アカウント
  - H3: メッセージ制限
  - H3: ストリーミング
  - H3: グループチャット履歴のコンテキスト
  - H3: 返信先モード
  - H3: Markdown ヒントの注入
  - H3: デバッグモード
  - H3: マルチエージェントルーティング
  - H2: 設定リファレンス
  - H2: サポートされるメッセージタイプ
  - H2: 関連項目

## channels/zalo.md

- ルート: /channels/zalo
- 見出し:
  - H2: 同梱 Plugin
  - H2: クイックセットアップ
  - H2: 概要
  - H2: 仕組み
  - H2: 制限
  - H2: アクセス制御
  - H3: ダイレクトメッセージ
  - H3: グループ
  - H2: ロングポーリングと Webhook の比較
  - H2: サポートされるメッセージタイプ
  - H2: 機能
  - H2: 配信先（CLI/Cron）
  - H2: トラブルシューティング
  - H2: 設定リファレンス
  - H2: 関連項目

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
  - H2: 内部の仕組み
  - H2: トラブルシューティング
  - H2: 関連項目

## channels/zalouser.md

- ルート: /channels/zalouser
- 見出し:
  - H2: インストール
  - H2: クイックセットアップ
  - H2: 概要
  - H2: 命名
  - H2: ID の検索（ディレクトリ）
  - H2: 制限
  - H2: アクセス制御（DM）
  - H2: グループアクセス（任意）
  - H3: グループメンションによるゲート制御
  - H2: 複数アカウント
  - H2: 環境変数
  - H2: 入力中表示、リアクション、配信確認
  - H2: トラブルシューティング
  - H2: 関連項目

## ci.md

- ルート: /ci
- 見出し:
  - H2: パイプラインの概要
  - H2: フェイルファストの順序
  - H2: PR のコンテキストと証拠
  - H2: スコープとルーティング
  - H2: ClawSweeper アクティビティの転送
  - H2: 手動ディスパッチ
  - H2: ランナー
  - H2: ランナー登録予算
  - H2: ローカルでの同等手順
  - H2: OpenClaw のパフォーマンス
  - H2: 完全リリース検証
  - H2: ライブおよび E2E シャード
  - H2: パッケージ受け入れ
  - H3: ジョブ
  - H3: 候補ソース
  - H3: スイートプロファイル
  - H3: レガシー互換期間
  - H3: 例
  - H2: インストールスモークテスト
  - H2: ローカル Docker E2E
  - H3: 調整可能な項目
  - H3: 再利用可能なライブ/E2E ワークフロー
  - H3: リリースパスのチャンク
  - H2: Plugin のプレリリース
  - H2: QA ラボ
  - H2: CodeQL
  - H3: セキュリティカテゴリー
  - H3: プラットフォーム固有のセキュリティシャード
  - H3: 重要な品質カテゴリー
  - H2: メンテナンスワークフロー
  - H3: ドキュメントエージェント
  - H3: テストパフォーマンスエージェント
  - H3: マージ後の重複 PR
  - H2: ローカルチェックゲートと変更ルーティング
  - H2: Testbox 検証
  - H2: 関連項目

## clawhub/cli.md

- ルート: /clawhub/cli
- 見出し:
  - H1: ClawHub CLI
  - H2: 検索とインストール
  - H3: リリースの信頼性
  - H2: 公開とメンテナンス
  - H2: 関連項目

## clawhub/publishing.md

- ルート: /clawhub/publishing
- 見出し:
  - H1: ClawHub での公開
  - H2: 所有者
  - H2: Skills
  - H2: Plugins
  - H2: リリースフロー
  - H2: よくある質問
  - H3: パッケージスコープは選択した所有者と一致する必要がある

## cli/acp.md

- ルート: /cli/acp
- 見出し:
  - H2: これに該当しないもの
  - H2: 互換性マトリクス
  - H2: 既知の制限
  - H2: 使用方法
  - H2: ACP クライアント（デバッグ）
  - H2: プロトコルのスモークテスト
  - H2: 使用手順
  - H2: エージェントの選択
  - H2: acpx から使用する（Codex、Claude、その他の ACP クライアント）
  - H2: Zed エディターのセットアップ
  - H2: セッションのマッピング
  - H2: オプション
  - H3: acp クライアントのオプション
  - H2: 関連項目

## cli/agent.md

- ルート: /cli/agent
- 見出し:
  - H1: openclaw agent
  - H2: オプション
  - H2: 例
  - H2: 注記
  - H2: JSON 配信ステータス
  - H2: 関連項目

## cli/agents.md

- ルート: /cli/agents
- 見出し:
  - H1: openclaw agents
  - H2: 例
  - H2: コマンドサーフェス
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents set-identity
  - H3: agents delete &lt;id&gt;
  - H2: ルーティングバインディング
  - H3: --bind の形式
  - H3: バインディングスコープの動作
  - H2: アイデンティティファイル
  - H2: アイデンティティの設定
  - H2: 関連項目

## cli/approvals.md

- ルート: /cli/approvals
- 見出し:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: よく使うコマンド
  - H2: ファイルから承認設定を置き換える
  - H2: 「プロンプトを表示しない」/ YOLO の例
  - H2: 許可リスト用ヘルパー
  - H2: 共通オプション
  - H2: 注記
  - H2: 関連項目

## cli/attach.md

- ルート: /cli/attach
- 見出し: なし

## cli/audit.md

- ルート: /cli/audit
- 見出し:
  - H1: openclaw audit
  - H2: フィルター
  - H2: 記録されるイベント
  - H2: Gateway RPC
  - H2: 関連項目

## cli/backup.md

- ルート: /cli/backup
- 見出し:
  - H1: openclaw backup
  - H2: 注記
  - H2: バックアップ対象
  - H2: 無効な設定がある場合の動作
  - H2: サイズとパフォーマンス
  - H2: 関連項目

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
  - H2: MCP 経由の既存の Chrome
  - H2: リモートブラウザー制御（Node ホストプロキシ）
  - H2: 関連項目

## cli/channels.md

- ルート: /cli/channels
- 見出し:
  - H1: openclaw channels
  - H2: よく使うコマンド
  - H2: ステータス / 機能 / 解決 / ログ
  - H2: アカウントの追加 / 削除
  - H2: ログインとログアウト（対話型）
  - H2: トラブルシューティング
  - H2: 機能プローブ
  - H2: 名前から ID への解決
  - H2: 関連項目

## cli/clawbot.md

- ルート: /cli/clawbot
- 見出し:
  - H1: openclaw clawbot
  - H2: 移行
  - H2: 関連項目

## cli/commitments.md

- ルート: /cli/commitments
- 見出し:
  - H2: 使用方法
  - H2: オプション
  - H2: 例
  - H2: 出力
  - H2: 関連項目

## cli/completion.md

- ルート: /cli/completion
- 見出し:
  - H1: openclaw completion
  - H2: 使用方法
  - H2: オプション
  - H2: インストールフロー
  - H2: 注記
  - H2: 関連項目

## cli/config.md

- ルート: /cli/config
- 見出し:
  - H2: ルートオプション
  - H2: 例
  - H3: パス
  - H3: config get
  - H3: config file
  - H3: config schema
  - H3: config validate
  - H2: 値
  - H2: config set のモード
  - H3: プロバイダービルダーのフラグ
  - H2: config patch
  - H2: ドライラン
  - H3: JSON 出力形式
  - H2: 変更の適用
  - H2: 書き込みの安全性
  - H2: 修復ループ
  - H2: 関連項目

## cli/configure.md

- ルート: /cli/configure
- 見出し:
  - H1: openclaw configure
  - H2: オプション
  - H2: モデルセクション
  - H2: Web セクション
  - H2: その他の注記
  - H2: 関連項目

## cli/crestodian.md

- ルート: /cli/crestodian
- 見出し:
  - H1: openclaw crestodian
  - H2: 起動するタイミング
  - H2: Crestodian が表示する内容
  - H2: 例
  - H2: 操作と承認
  - H3: マスクされたチャンネルセットアップへの切り替え
  - H2: セットアップのブートストラップ
  - H2: AI との会話
  - H3: CLI ハーネスの信頼モデル
  - H2: エージェントへの切り替え
  - H2: メッセージレスキューモード
  - H2: 関連項目

## cli/cron.md

- ルート: /cli/cron
- 見出し:
  - H1: openclaw cron
  - H2: ジョブをすばやく作成する
  - H2: セッション
  - H2: 配信
  - H3: 配信の所有権
  - H3: 失敗時の配信
  - H2: スケジューリング
  - H3: 単発ジョブ
  - H3: 定期ジョブ
  - H3: 手動実行
  - H2: モデル
  - H3: 分離された Cron モデルの優先順位
  - H3: 高速モード
  - H3: ライブモデル切り替えの再試行
  - H2: 実行出力と拒否
  - H3: 古い確認応答の抑制
  - H3: サイレントトークンの抑制
  - H3: 構造化された拒否
  - H2: 保持
  - H2: 古いジョブの移行
  - H2: よく行う編集
  - H2: よく使う管理コマンド
  - H2: 関連項目

## cli/daemon.md

- ルート: /cli/daemon
- 見出し:
  - H1: openclaw daemon
  - H2: 使用方法
  - H2: サブコマンドとオプション
  - H2: 注記
  - H2: 関連項目

## cli/dashboard.md

- ルート: /cli/dashboard
- 見出し:
  - H1: openclaw dashboard
  - H2: 関連項目

## cli/devices.md

- ルート: /cli/devices
- 見出し:
  - H1: openclaw devices
  - H2: 共通オプション
  - H2: コマンド
  - H3: openclaw devices list
  - H3: openclaw devices approve [requestId] [--latest]
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices rename --device &lt;id&gt; --name &lt;label&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: 注記
  - H2: トークンドリフト復旧チェックリスト
  - H2: Paperclip / openclawgateway の初回実行時承認
  - H2: 関連項目

## cli/directory.md

- ルート: /cli/directory
- 見出し:
  - H1: openclaw directory
  - H2: 共通フラグ
  - H2: 注記
  - H2: message send での結果の使用
  - H2: チャンネル別の ID 形式
  - H2: 自分（「me」）
  - H2: ピア（連絡先/ユーザー）
  - H2: グループ
  - H2: 関連項目

## cli/dns.md

- ルート: /cli/dns
- 見出し:
  - H1: openclaw dns
  - H2: dns setup
  - H2: 関連項目

## cli/docs.md

- ルート: /cli/docs
- 見出し:
  - H1: openclaw docs
  - H2: 使用方法
  - H2: 例
  - H2: 仕組み
  - H2: 出力
  - H2: 終了コード
  - H2: 関連項目

## cli/doctor.md

- ルート: /cli/doctor
- 見出し:
  - H1: openclaw doctor
  - H2: 姿勢
  - H2: 例
  - H2: オプション
  - H2: lint モード
  - H2: 構造化ヘルスチェック
  - H2: チェックの選択
  - H2: アップグレード後モード
  - H2: 共有状態 SQLite の圧縮
  - H2: セッション SQLite の移行
  - H3: セッション SQLite 移行後のダウングレード
  - H2: 注記
  - H2: macOS: launchctl 環境変数のオーバーライド
  - H2: 関連項目

## cli/fleet.md

- ルート: /cli/fleet
- 見出し:
  - H1: openclaw fleet
  - H2: クイックスタート
  - H2: テナント ID
  - H2: fleet create
  - H3: 作成オプション
  - H3: ダイジェストによる固定
  - H3: ディスク制限
  - H3: エグレスポリシー
  - H2: fleet list
  - H2: fleet status
  - H2: fleet logs
  - H2: fleet start、fleet stop、fleet restart
  - H2: fleet upgrade
  - H2: fleet backup と fleet restore
  - H2: fleet doctor
  - H2: fleet rm
  - H2: ストレージとコンテナのレイアウト
  - H2: セキュリティプロファイル
  - H2: トークンの取り扱い
  - H2: 関連項目

## cli/flows.md

- ルート: /cli/flows
- 見出し:
  - H1: openclaw tasks flow
  - H2: サブコマンド
  - H3: ステータスフィルターの値
  - H2: 例
  - H2: 関連項目

## cli/gateway.md

- Route: /cli/gateway
- 見出し:
  - H2: Gateway を実行する
  - H3: オプション
  - H2: Gateway を再起動する
  - H3: Gateway のプロファイリング
  - H2: 実行中の Gateway に問い合わせる
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: SSH 経由のリモート接続（Mac アプリと同等）
  - H3: gateway call &lt;method&gt;
  - H2: Gateway サービスを管理する
  - H3: ラッパーを使用してインストールする
  - H2: Gateway を検出する（Bonjour）
  - H3: gateway discover
  - H2: 関連項目

## cli/health.md

- Route: /cli/health
- 見出し:
  - H1: openclaw health
  - H2: オプション
  - H2: 動作
  - H2: 関連項目

## cli/hooks.md

- Route: /cli/hooks
- 見出し:
  - H1: openclaw hooks
  - H2: フックを一覧表示する
  - H2: フック情報を取得する
  - H2: 適格性を確認する
  - H2: フックを有効にする
  - H2: フックを無効にする
  - H2: フックパックをインストールおよび更新する
  - H2: バンドル済みフック
  - H3: command-logger のログファイル
  - H2: 注意事項
  - H2: 関連項目

## cli/index.md

- Route: /cli
- 見出し:
  - H2: コマンドページ
  - H2: グローバルフラグ
  - H2: 出力モード
  - H2: カラーパレット
  - H2: コマンドツリー
  - H2: チャットのスラッシュコマンド
  - H2: 使用状況の追跡
  - H2: 関連項目

## cli/infer.md

- Route: /cli/infer
- 見出し:
  - H2: infer をスキルに変換する
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
  - H2: よくある問題
  - H2: 関連項目

## cli/logs.md

- Route: /cli/logs
- 見出し:
  - H1: openclaw logs
  - H2: オプション
  - H2: 共通の Gateway RPC オプション
  - H2: 例
  - H2: フォールバックと復旧の動作
  - H2: 関連項目

## cli/mcp.md

- Route: /cli/mcp
- 見出し:
  - H2: 適切な MCP パスを選択する
  - H2: MCP サーバーとしての OpenClaw
  - H3: serve を使用する場合
  - H3: 仕組み
  - H3: クライアントモードを選択する
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
  - H3: 保存済みの MCP サーバー定義
  - H3: 一般的なサーバーレシピ
  - H3: JSON 出力形式
  - H3: Stdio トランスポート
  - H3: SSE / HTTP トランスポート
  - H3: OAuth ワークフロー
  - H3: ストリーミング可能な HTTP トランスポート
  - H2: コントロール UI
  - H2: MCP アプリ
  - H2: 現在の制限
  - H2: 関連項目

## cli/memory.md

- Route: /cli/memory
- 見出し:
  - H1: openclaw memory
  - H2: memory status
  - H2: memory index
  - H2: memory search
  - H2: memory promote
  - H2: memory promote-explain
  - H2: memory rem-harness
  - H2: memory rem-backfill
  - H2: Dreaming
  - H2: SecretRef の Gateway 依存関係
  - H2: 関連項目

## cli/message.md

- Route: /cli/message
- 見出し:
  - H1: openclaw message
  - H2: チャンネルの選択
  - H2: ターゲット形式（-t、--target）
  - H2: 共通フラグ
  - H2: SecretRef の解決
  - H2: アクション
  - H3: コア
  - H3: 送信
  - H3: 投票
  - H3: スレッド
  - H3: 絵文字
  - H3: ステッカー
  - H3: ロール、チャンネル、音声、イベント（Discord）
  - H3: モデレーション（Discord）
  - H3: ブロードキャスト
  - H2: 関連項目

## cli/migrate.md

- Route: /cli/migrate
- 見出し:
  - H1: openclaw migrate
  - H2: コマンド
  - H2: 安全性モデル
  - H2: Claude プロバイダー
  - H3: Claude がインポートするもの
  - H3: アーカイブおよび手動レビューの状態
  - H2: Codex プロバイダー
  - H3: Codex がインポートするもの
  - H3: 手動レビュー対象の Codex 状態
  - H2: Hermes プロバイダー
  - H3: Hermes がインポートするもの
  - H3: サポートされる .env キー
  - H3: アーカイブ専用の状態
  - H3: 適用後
  - H2: Plugin コントラクト
  - H2: オンボーディングとの統合
  - H2: 関連項目

## cli/models.md

- Route: /cli/models
- 見出し:
  - H1: openclaw models
  - H2: 一般的なコマンド
  - H3: ステータス
  - H3: 一覧
  - H3: デフォルトモデル / 画像モデルを設定する
  - H3: スキャン
  - H2: エイリアス
  - H2: フォールバック
  - H2: 認証プロファイル
  - H2: 関連項目

## cli/node.md

- Route: /cli/node
- 見出し:
  - H1: openclaw node
  - H2: Node ホストを使用する理由
  - H2: ブラウザプロキシ（設定不要）
  - H2: 実行（フォアグラウンド）
  - H2: Node ホストの Gateway 認証
  - H2: サービス（バックグラウンド）
  - H2: ペアリング
  - H3: ID とペアリング状態
  - H2: 実行承認
  - H2: 関連項目

## cli/nodes.md

- Route: /cli/nodes
- 見出し:
  - H1: openclaw nodes
  - H2: ステータス
  - H2: ペアリング
  - H2: 呼び出し
  - H2: 通知、プッシュ、位置情報、画面
  - H2: 関連項目

## cli/onboard.md

- Route: /cli/onboard
- 見出し:
  - H1: openclaw onboard
  - H2: 例
  - H2: ガイド付きフロー
  - H2: リセット
  - H2: ロケール
  - H2: 非対話型セットアップ
  - H3: Gateway 認証（非対話型）
  - H3: ローカル Gateway の健全性
  - H3: 対話型参照モード
  - H3: Z.AI エンドポイントの選択肢
  - H2: 追加の非対話型フラグ
  - H2: プロバイダーの事前絞り込み
  - H2: Web 検索のフォローアップ
  - H2: その他の動作
  - H2: 一般的なフォローアップコマンド

## cli/pairing.md

- Route: /cli/pairing
- 見出し:
  - H1: openclaw pairing
  - H2: コマンド
  - H2: pairing list
  - H2: pairing approve
  - H3: オーナーのブートストラップ
  - H2: 関連項目

## cli/path.md

- Route: /cli/path
- 見出し:
  - H1: openclaw path
  - H2: 使用する理由
  - H2: 使用方法
  - H2: 仕組み
  - H2: サブコマンド
  - H2: グローバルフラグ
  - H2: oc:// 構文
  - H2: ファイル種別によるアドレス指定
  - H2: 変更コントラクト
  - H2: 例
  - H2: ファイル種別ごとのレシピ
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: サブコマンドリファレンス
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: 終了コード
  - H2: 出力モード
  - H2: 注意事項
  - H2: 関連項目

## cli/plugins.md

- Route: /cli/plugins
- 見出し:
  - H2: コマンド
  - H2: 作成
  - H3: プロバイダーのスキャフォールド
  - H2: インストール
  - H3: マーケットプレイスの短縮表記
  - H2: 一覧
  - H3: Plugin インデックス
  - H2: アンインストール
  - H2: 更新
  - H2: 検査
  - H2: Doctor
  - H2: レジストリ
  - H2: マーケットプレイス
  - H2: 関連項目

## cli/policy.md

- Route: /cli/policy
- 見出し:
  - H1: openclaw policy
  - H2: クイックスタート
  - H3: ポリシールールのリファレンス
  - H4: スコープ付きオーバーレイ
  - H4: チャンネル
  - H4: MCP サーバー
  - H4: モデルプロバイダー
  - H4: ネットワーク
  - H4: イングレスとチャンネルアクセス
  - H4: Gateway
  - H4: エージェントワークスペース
  - H4: サンドボックスの態勢
  - H4: データ処理
  - H4: シークレット
  - H4: 実行承認
  - H4: 認証プロファイル
  - H4: ツールメタデータ
  - H4: ツールの態勢
  - H2: チェックを実行する
  - H2: ポリシーを設定する
  - H2: ポリシー状態を承認する
  - H2: 検出事項
  - H2: 修復
  - H2: 終了コード
  - H2: 関連項目

## cli/promos.md

- Route: /cli/promos
- 見出し:
  - H1: openclaw promos
  - H2: コマンド
  - H2: openclaw promos list
  - H2: openclaw promos claim &lt;slug&gt;
  - H2: models list での受動的な検出

## cli/proxy.md

- Route: /cli/proxy
- 見出し:
  - H1: openclaw proxy
  - H2: 検証
  - H3: オプション
  - H2: プロキシをデバッグする
  - H2: 関連項目

## cli/qr.md

- Route: /cli/qr
- 見出し:
  - H1: openclaw qr
  - H2: オプション
  - H2: セットアップコードの内容
  - H2: Gateway URL の解決
  - H2: 認証の解決（--remote なし）
  - H2: 認証の解決（--remote）
  - H2: 関連項目

## cli/reset.md

- Route: /cli/reset
- 見出し:
  - H1: openclaw reset
  - H2: オプション
  - H2: スコープ
  - H2: 注意事項
  - H2: 関連項目

## cli/sandbox.md

- Route: /cli/sandbox
- 見出し:
  - H2: コマンド
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H3: openclaw sandbox explain
  - H2: 再作成が必要な理由
  - H2: 一般的なトリガー
  - H2: レジストリの移行
  - H2: 設定
  - H2: 関連項目

## cli/secrets.md

- Route: /cli/secrets
- 見出し:
  - H1: openclaw secrets
  - H2: ランタイムスナップショットを再読み込みする
  - H2: 監査
  - H2: 設定（対話型ヘルパー）
  - H3: Exec プロバイダーの安全性
  - H2: 保存済みプランを適用する
  - H3: ロールバック用バックアップがない理由
  - H2: 例
  - H2: 関連項目

## cli/security.md

- Route: /cli/security
- 見出し:
  - H1: openclaw security
  - H2: 監査モード
  - H2: チェック内容
  - H2: SecretRef の動作
  - H2: 抑制
  - H2: JSON 出力
  - H2: --fix が変更するもの
  - H2: 関連項目

## cli/sessions.md

- Route: /cli/sessions
- 見出し:
  - H1: openclaw sessions
  - H2: 軌跡の末尾の進行状況
  - H2: 軌跡バンドルをエクスポートする
  - H2: クリーンアップ保守
  - H2: セッションを圧縮する
  - H3: sessions.compact RPC
  - H2: 関連項目

## cli/setup.md

- Route: /cli/setup
- 見出し:
  - H1: openclaw setup
  - H2: オプション
  - H3: ベースラインモード
  - H2: 例
  - H2: 注意事項
  - H2: 関連項目

## cli/skills.md

- Route: /cli/skills
- 見出し:
  - H1: openclaw skills
  - H2: コマンド
  - H2: スキルワークショップ
  - H2: 関連項目

## cli/status.md

- Route: /cli/status
- 見出し:
  - H2: セッションとモデルの解決
  - H2: 使用量とクォータ
  - H2: 概要と更新ステータス
  - H2: シークレット
  - H2: メモリ
  - H2: 関連項目

## cli/system.md

- Route: /cli/system
- 見出し:
  - H1: openclaw system
  - H2: 一般的なコマンド
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: 注意事項
  - H2: 関連項目

## cli/tasks.md

- Route: /cli/tasks
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
  - H2: 関連項目

## cli/transcripts.md

- Route: /cli/transcripts
- 見出し:
  - H1: openclaw transcripts
  - H2: コマンド
  - H2: 出力
  - H2: 1 日に多数のセッション
  - H2: 欠落した要約
  - H2: 設定

## cli/tui.md

- Route: /cli/tui
- 見出し:
  - H1: openclaw tui
  - H2: オプション
  - H2: 注意事項
  - H2: 例
  - H2: 設定修復ループ
  - H2: 関連項目

## cli/uninstall.md

- Route: /cli/uninstall
- 見出し:
  - H1: openclaw uninstall
  - H2: オプション
  - H2: 例
  - H2: 注意事項
  - H2: 関連項目

## cli/update.md

- Route: /cli/update
- 見出し:
  - H1: openclaw update
  - H2: 使用方法
  - H2: オプション
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: 実行内容
  - H3: 再起動の引き継ぎ
  - H3: コントロールプレーンのレスポンス形式
  - H2: Git チェックアウトフロー
  - H3: チャンネルの選択
  - H3: 更新手順
  - H3: Plugin 同期の詳細
  - H2: 関連項目

## cli/voicecall.md

- Route: /cli/voicecall
- 見出し:
  - H1: openclaw voicecall
  - H2: サブコマンド
  - H2: セットアップとスモークテスト
  - H3: setup
  - H3: smoke
  - H2: 通話のライフサイクル
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
  - H2: 関連項目

## cli/webhooks.md

- Route: /cli/webhooks
- 見出し:
  - H1: openclaw webhooks
  - H2: サブコマンド
  - H2: webhooks gmail setup
  - H3: 必須項目
  - H3: Pub/Sub オプション
  - H3: OpenClaw 配信オプション
  - H3: gog watch serve オプション
  - H3: Tailscale での公開
  - H3: 出力
  - H2: webhooks gmail run
  - H2: 関連項目

## cli/wiki.md

- Route: /cli/wiki
- 見出し:
  - H1: openclaw wiki
  - H2: 一般的なコマンド
  - H2: エージェントの選択
  - H2: コマンド
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki chatgpt import
  - H3: wiki chatgpt rollback &lt;run-id&gt;
  - H3: wiki obsidian ...
  - H2: 実践的な使用ガイダンス
  - H2: 設定との連携
  - H2: 関連項目

## cli/workboard.md

- Route: /cli/workboard
- 見出し:
  - H2: 使用方法
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: スラッシュコマンドとの同等性
  - H2: 権限
  - H2: トラブルシューティング
  - H3: カードが表示されない
  - H3: dispatch で data-only と表示される
  - H3: dispatch で何も開始されない
  - H2: 関連項目

## concepts/active-memory.md

- ルート: /concepts/active-memory
- 見出し:
  - H2: クイックスタート
  - H2: 仕組み
  - H2: 実行されるタイミング
  - H3: セッションの種類
  - H2: セッション切り替え
  - H2: 確認方法
  - H2: クエリモード
  - H2: プロンプトスタイル
  - H2: モデルのフォールバックポリシー
  - H3: 速度に関する推奨事項
  - H4: Cerebras のセットアップ
  - H2: メモリツール
  - H3: 組み込みの memory-core
  - H3: LanceDB メモリ
  - H3: Lossless Claw
  - H2: 高度な回避手段
  - H2: トランスクリプトの永続化
  - H2: 設定
  - H2: 推奨セットアップ
  - H3: コールドスタート猶予期間
  - H2: デバッグ
  - H2: よくある問題
  - H2: 関連ページ

## concepts/agent-loop.md

- ルート: /concepts/agent-loop
- 見出し:
  - H2: エントリーポイント
  - H2: 実行シーケンス
  - H2: キューイングと並行処理
  - H2: セッションとワークスペースの準備
  - H2: プロンプトの組み立て
  - H2: フック
  - H3: 内部フック（Gateway フック）
  - H3: Plugin フック
  - H2: ストリーミング
  - H2: ツールの実行
  - H2: 応答の整形
  - H2: Compaction と再試行
  - H2: イベントストリーム
  - H2: チャットチャンネルの処理
  - H2: タイムアウト
  - H3: 停滞したセッションの診断
  - H2: 途中終了する可能性がある箇所
  - H2: 関連項目

## concepts/agent-runtimes.md

- ルート: /concepts/agent-runtimes
- 見出し:
  - H2: Codex のサーフェス
  - H2: ランタイムの所有権
  - H2: ランタイムの選択
  - H2: GitHub Copilot エージェントランタイム
  - H2: 互換性契約
  - H2: ステータスラベル
  - H2: 関連項目

## concepts/agent-workspace.md

- ルート: /concepts/agent-workspace
- 見出し:
  - H2: デフォルトの場所
  - H2: 追加のワークスペースフォルダー
  - H2: ワークスペースのファイルマップ
  - H2: ワークスペースに含まれないもの
  - H2: Git バックアップ（推奨、非公開）
  - H2: シークレットをコミットしない
  - H2: ワークスペースを新しいマシンへ移動する
  - H2: 高度な注意事項
  - H2: 関連項目

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
  - H2: 設定（最小構成）
  - H2: 関連項目

## concepts/architecture.md

- ルート: /concepts/architecture
- 見出し:
  - H2: 概要
  - H2: コンポーネントとフロー
  - H3: Gateway（デーモン）
  - H3: クライアント（Mac アプリ / CLI / Web 管理画面）
  - H3: ノード（macOS / iOS / Android / ヘッドレス）
  - H3: WebChat
  - H2: 接続ライフサイクル（単一クライアント）
  - H2: ワイヤープロトコル（概要）
  - H2: ペアリングとローカルでの信頼
  - H2: プロトコルの型付けとコード生成
  - H2: リモートアクセス
  - H2: 運用スナップショット
  - H2: 不変条件
  - H2: 関連項目

## concepts/channel-docking.md

- ルート: /concepts/channel-docking
- 見出し:
  - H2: 例
  - H2: 使用する理由
  - H2: 必須設定
  - H2: コマンド
  - H2: 変更されるもの
  - H2: 変更されないもの
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
  - H2: 関連項目

## concepts/compaction.md

- ルート: /concepts/compaction
- 見出し:
  - H2: 仕組み
  - H2: 自動 Compaction
  - H2: 手動 Compaction
  - H2: 設定
  - H3: 別のモデルを使用する
  - H3: 識別子の保持
  - H3: アクティブなトランスクリプトのバイト数ガード
  - H3: 後続トランスクリプト
  - H3: Compaction 通知
  - H3: メモリのフラッシュ
  - H2: 差し替え可能な Compaction プロバイダー
  - H2: Compaction とプルーニングの違い
  - H2: トラブルシューティング
  - H2: 関連項目

## concepts/context-engine.md

- ルート: /concepts/context-engine
- 見出し:
  - H2: クイックスタート
  - H2: 仕組み
  - H3: サブエージェントのライフサイクル（任意）
  - H3: システムプロンプトへの追加
  - H2: 旧式エンジン
  - H2: Plugin エンジン
  - H3: ContextEngine インターフェース
  - H3: ランタイム設定
  - H3: ホスト要件
  - H3: 障害の分離
  - H3: ownsCompaction
  - H2: 設定リファレンス
  - H2: Compaction およびメモリとの関係
  - H2: ヒント
  - H2: 関連項目

## concepts/context.md

- ルート: /concepts/context
- 見出し:
  - H2: クイックスタート（コンテキストを調査する）
  - H2: 出力例
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: コンテキストウィンドウに算入されるもの
  - H2: OpenClaw がシステムプロンプトを構築する仕組み
  - H2: 注入されるワークスペースファイル（プロジェクトコンテキスト）
  - H2: Skills：注入とオンデマンド読み込み
  - H2: ツール：2 種類のコスト
  - H2: コマンド、ディレクティブ、「インラインショートカット」
  - H2: セッション、Compaction、プルーニング（永続化されるもの）
  - H2: /context が実際に報告する内容
  - H2: 関連項目

## concepts/delegate-architecture.md

- ルート: /concepts/delegate-architecture
- 見出し:
  - H2: デリゲートとは
  - H2: デリゲートを使用する理由
  - H2: 機能レベル
  - H3: レベル 1：読み取り専用 + 下書き
  - H3: レベル 2：代理送信
  - H3: レベル 3：プロアクティブ
  - H2: 前提条件：分離と堅牢化
  - H3: 強制ブロック（必須）
  - H3: ツールの制限
  - H3: サンドボックス分離
  - H3: 監査証跡
  - H2: デリゲートのセットアップ
  - H3: 1. デリゲートエージェントを作成する
  - H3: 2. ID プロバイダーの委任を設定する
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. デリゲートをチャンネルにバインドする
  - H3: 4. デリゲートエージェントに認証情報を追加する
  - H2: 例：組織アシスタント
  - H2: スケーリングパターン
  - H2: 関連項目

## concepts/dreaming.md

- ルート: /concepts/dreaming
- 見出し:
  - H2: Dreaming が書き込む内容
  - H2: フェーズモデル
  - H2: セッショントランスクリプトの取り込み
  - H2: 夢日記
  - H2: 詳細なランキングシグナル
  - H3: QA シャドウトライアルレポートのカバレッジ
  - H2: スケジュール
  - H2: クイックスタート
  - H2: スラッシュコマンド
  - H2: CLI ワークフロー
  - H2: 主要なデフォルト
  - H2: Dreams UI
  - H2: 関連項目

## concepts/experimental-features.md

- ルート: /concepts/experimental-features
- 見出し:
  - H2: 現在文書化されているフラグ
  - H2: ローカルモデルの軽量モード
  - H3: これらのツールを使用する理由
  - H3: 有効にするタイミング
  - H3: 無効のままにするタイミング
  - H3: 有効化
  - H2: 実験的であることは非公開を意味しない
  - H2: 関連項目

## concepts/features.md

- ルート: /concepts/features
- 見出し:
  - H2: 主な機能
  - H2: 全一覧
  - H2: 関連項目

## concepts/managed-worktrees.md

- ルート: /concepts/managed-worktrees
- 見出し:
  - H2: レイアウトと名前
  - H2: 無視対象ファイルをプロビジョニングする
  - H2: リポジトリのセットアップを実行する
  - H2: セッションワークツリー
  - H2: スナップショット、クリーンアップ、復元
  - H2: CLI
  - H2: Gateway メソッド
  - H2: Workboard ワークスペース

## concepts/mantis-slack-desktop-runbook.md

- ルート: /concepts/mantis-slack-desktop-runbook
- 見出し:
  - H2: ストレージモデル
  - H2: GitHub ディスパッチ
  - H2: ローカル CLI
  - H2: ハイドレートモード
  - H2: タイミングの解釈
  - H2: エビデンスチェックリスト
  - H2: 障害処理
  - H2: 関連項目

## concepts/mantis.md

- ルート: /concepts/mantis
- 見出し:
  - H2: 所有権
  - H2: CLI コマンド
  - H3: discord-smoke
  - H3: run
  - H3: desktop-browser-smoke
  - H3: slack-desktop-smoke
  - H3: telegram-desktop-builder
  - H2: エビデンスマニフェスト
  - H2: GitHub 自動化
  - H2: マシンとシークレット
  - H2: 実行結果
  - H2: シナリオを追加する
  - H2: 未解決の課題

## concepts/markdown-formatting.md

- ルート: /concepts/markdown-formatting
- 見出し:
  - H2: パイプライン
  - H2: IR の例
  - H2: テーブルの処理
  - H2: チャンク化ルール
  - H2: リンクポリシー
  - H2: スポイラー
  - H2: チャンネルフォーマッターを追加または更新する
  - H2: よくある落とし穴
  - H2: 関連項目

## concepts/memory-builtin.md

- ルート: /concepts/memory-builtin
- 見出し:
  - H2: 提供される機能
  - H2: はじめに
  - H2: サポートされている埋め込みプロバイダー
  - H2: インデックス作成の仕組み
  - H2: 使用するタイミング
  - H2: トラブルシューティング
  - H2: 設定
  - H2: 関連項目

## concepts/memory-honcho.md

- ルート: /concepts/memory-honcho
- 見出し:
  - H2: 提供される機能
  - H2: 利用可能なツール
  - H2: はじめに
  - H2: 設定
  - H2: 既存のメモリを移行する
  - H2: 仕組み
  - H2: Honcho と組み込みメモリの比較
  - H2: CLI コマンド
  - H2: 関連資料
  - H2: 関連項目

## concepts/memory-qmd.md

- ルート: /concepts/memory-qmd
- 見出し:
  - H2: 組み込み機能に加えて提供されるもの
  - H2: はじめに
  - H3: 前提条件
  - H3: 有効化
  - H2: サイドカーの仕組み
  - H2: 検索性能と互換性
  - H2: モデルのオーバーライド
  - H2: 追加パスのインデックス作成
  - H2: セッショントランスクリプトのインデックス作成
  - H2: 検索スコープ
  - H2: 引用
  - H2: 使用するタイミング
  - H2: トラブルシューティング
  - H2: 設定
  - H2: 関連項目

## concepts/memory-search.md

- ルート: /concepts/memory-search
- 見出し:
  - H2: クイックスタート
  - H2: サポートされているプロバイダー
  - H2: 検索の仕組み
  - H2: 検索品質を向上させる
  - H3: 時間的減衰
  - H3: MMR（多様性）
  - H3: 両方を有効にする
  - H2: マルチモーダルメモリ
  - H2: セッションメモリ検索
  - H2: トラブルシューティング
  - H2: 関連項目

## concepts/memory.md

- ルート: /concepts/memory
- 見出し:
  - H2: 仕組み
  - H2: 各データの保存先
  - H2: アクション依存のメモリ
  - H2: 推論されたコミットメント
  - H2: メモリツール
  - H2: メモリ検索
  - H2: メモリバックエンド
  - H2: ナレッジ Wiki レイヤー
  - H2: メモリの自動フラッシュ
  - H2: Dreaming
  - H2: 根拠に基づくバックフィルとライブ昇格
  - H2: CLI
  - H2: 関連資料

## concepts/message-lifecycle-refactor.md

- ルート: /concepts/message-lifecycle-refactor
- 見出し:
  - H2: このリファクタリングが行われた理由
  - H2: リリースされた内容
  - H3: 送信コンテキスト
  - H3: 受信コンテキスト
  - H3: ライブプレビュー
  - H3: 永続的な受領記録
  - H3: 公開 SDK の縮小
  - H2: 実装が当初の設計から分岐した箇所
  - H2: 具体的な移行上のリスク（現在も該当）
  - H2: 障害分類
  - H2: 未解決の課題
  - H2: 関連項目

## concepts/messages.md

- ルート: /concepts/messages
- 見出し:
  - H2: 受信メッセージの重複排除
  - H2: 受信メッセージのデバウンス
  - H2: セッションとデバイス
  - H2: プロンプト本文と履歴コンテキスト
  - H2: ツール結果のメタデータ
  - H2: キューイングとフォローアップ
  - H2: チャンネル実行の所有権
  - H2: ストリーミング、チャンク化、バッチ処理
  - H2: 推論の可視性とトークン
  - H2: プレフィックス、スレッド、返信
  - H2: サイレント返信
  - H2: 関連項目

## concepts/model-failover.md

- ルート: /concepts/model-failover
- 見出し:
  - H2: ランタイムフロー
  - H2: 選択元ポリシー
  - H2: 認証失敗のスキップキャッシュ
  - H2: ユーザーに表示されるフォールバック通知
  - H2: 認証情報ストレージ（キー + OAuth）
  - H2: プロファイル ID
  - H2: ローテーション順序
  - H3: セッションの固定性（キャッシュに適した動作）
  - H3: OpenAI Codex サブスクリプションと API キーによるバックアップ
  - H2: クールダウン
  - H2: 請求による無効化
  - H2: モデルのフォールバック
  - H3: 候補チェーンのルール
  - H3: フォールバックを次へ進めるエラー
  - H3: クールダウン中のスキップとプローブの動作
  - H2: セッションのオーバーライドとライブモデル切り替え
  - H2: 可観測性と障害の概要
  - H2: 関連設定

## concepts/model-providers.md

- ルート: /concepts/model-providers
- 見出し:
  - H2: 基本ルール
  - H2: Plugin が所有するプロバイダーの動作
  - H2: API キーのローテーション
  - H2: 公式プロバイダー Plugin
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: その他のサブスクリプション形式のホスティングオプション
  - H3: OpenCode
  - H3: Google Gemini（API キー）
  - H3: Google Vertex と Gemini CLI
  - H3: Z.AI（GLM）
  - H3: Vercel AI Gateway
  - H3: その他の同梱プロバイダー Plugin
  - H4: 知っておくべき特性
  - H2: models.providers 経由のプロバイダー（カスタム / ベース URL）
  - H3: Moonshot AI（Kimi）
  - H3: Kimi Coding
  - H3: Volcano Engine（Doubao）
  - H3: BytePlus（国際版）
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: ローカルプロキシ（LM Studio、vLLM、LiteLLM など）
  - H2: CLI の例
  - H2: 関連項目

## concepts/models.md

- ルート: /concepts/models
- 見出し:
  - H2: 選択順序
  - H2: 選択元とフォールバックの厳格さ
  - H2: モデルポリシーの概要
  - H2: オンボーディング
  - H2: 「モデルが許可されていません」（および返信が停止する理由）
  - H2: チャット内の /model
  - H2: CLI
  - H2: モデルレジストリ（models.json）
  - H2: 関連項目

## concepts/multi-agent.md

- ルート: /concepts/multi-agent
- 見出し:
  - H2: 1つのエージェントとは
  - H2: パス
  - H3: 単一エージェントモード（デフォルト）
  - H2: エージェントヘルパー
  - H2: クイックスタート
  - H2: 複数のエージェント、複数のペルソナ
  - H2: エージェントごとの Memory Wiki 保管庫
  - H2: エージェント横断の QMD メモリ検索
  - H2: 1つの WhatsApp 番号を複数人で使用（DM 分割）
  - H2: ルーティングルール
  - H2: 複数のアカウント／電話番号
  - H2: 概念
  - H2: プラットフォームの例
  - H2: 一般的なパターン
  - H2: エージェントごとのサンドボックスとツール設定
  - H2: 関連項目

## concepts/oauth.md

- ルート: /concepts/oauth
- 見出し:
  - H2: トークンシンク（存在する理由）
  - H2: ストレージ（トークンの保存場所）
  - H2: Anthropic Claude CLI の再利用
  - H2: OAuth 交換（ログインの仕組み）
  - H3: Anthropic setup-token
  - H3: OpenAI Codex（ChatGPT OAuth）
  - H2: 更新と有効期限
  - H2: 複数のアカウント（プロファイル）とルーティング
  - H3: 1）推奨: エージェントを分ける
  - H3: 2）高度な設定: 1つのエージェントで複数のプロファイルを使用する
  - H2: 関連項目

## concepts/parallel-specialist-lanes.md

- ルート: /concepts/parallel-specialist-lanes
- 見出し:
  - H2: 基本原則
  - H2: 推奨される導入手順
  - H3: フェーズ1: レーン契約とバックグラウンドでの高負荷処理
  - H3: フェーズ2: 優先度と同時実行制御
  - H3: フェーズ3: コーディネーター／トラフィックコントローラー
  - H2: 最小限のレーン契約テンプレート
  - H2: 関連項目

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
  - H2: 生成元（プレゼンスの取得元）
  - H3: 1）Gateway 自身のエントリ
  - H3: 2）WebSocket 接続
  - H4: 一時的なコントロールプレーン接続が表示されない理由
  - H3: 3）system-event ビーコン
  - H3: 4）Node の接続（role: node）
  - H2: マージと重複排除のルール（instanceId が重要な理由）
  - H2: TTL とサイズの上限
  - H2: リモート／トンネルに関する注意事項（ループバック IP）
  - H2: 利用側
  - H3: Control UI の Devices ページ
  - H3: macOS の Instances タブ
  - H2: デバッグのヒント
  - H2: 関連項目

## concepts/progress-drafts.md

- ルート: /concepts/progress-drafts
- 見出し:
  - H2: クイックスタート
  - H2: ユーザーに表示される内容
  - H2: モードの選択
  - H2: ラベルの設定
  - H2: 進行状況行の制御
  - H3: 詳細モード
  - H3: コマンド／実行テキスト
  - H3: コメンタリーレーン
  - H3: 説明付きステータス
  - H3: 行数制限
  - H3: リッチレンダリング（Slack）
  - H3: ツール／タスク行を非表示にする
  - H2: チャネルの動作
  - H2: 最終処理
  - H2: トラブルシューティング
  - H2: 関連項目

## concepts/qa-e2e-automation.md

- ルート: /concepts/qa-e2e-automation
- 見出し:
  - H2: コマンドサーフェス
  - H3: プロファイルを使用する QA 実行
  - H2: オペレーターのフロー
  - H3: オブザーバビリティのスモークテスト
  - H3: Matrix スモークテストレーン
  - H3: Discord Mantis シナリオ
  - H3: Mantis Slack デスクトップおよびビジュアルタスクランナー
  - H3: 認証情報プールの健全性チェック
  - H2: ライブトランスポートのカバレッジ
  - H2: Discord、Slack、Telegram、WhatsApp の QA リファレンス
  - H3: 共通 CLI フラグ
  - H3: Telegram QA
  - H3: Discord QA
  - H3: Slack QA
  - H4: Slack ワークスペースのセットアップ
  - H3: WhatsApp QA
  - H3: Convex 認証情報プール
  - H2: リポジトリに基づくシード
  - H2: プロバイダーのモックレーン
  - H2: トランスポートアダプター
  - H3: チャネルの追加
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
  - H2: 関連項目

## concepts/queue-steering.md

- ルート: /concepts/queue-steering
- 見出し:
  - H2: ランタイム境界
  - H2: モード
  - H2: バーストの例
  - H2: スコープ
  - H2: デバウンス
  - H2: 関連項目

## concepts/queue.md

- ルート: /concepts/queue
- 見出し:
  - H2: 必要な理由
  - H2: 仕組み
  - H2: デフォルト
  - H2: キューモード
  - H2: キューオプション
  - H2: ステアリングとストリーミング
  - H2: 優先順位
  - H2: セッションごとのオーバーライド
  - H2: キュー内ターンのキャンセル
  - H2: スコープと保証
  - H2: トラブルシューティング
  - H2: 関連項目

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
  - H2: 関連項目

## concepts/session-pruning.md

- ルート: /concepts/session-pruning
- 見出し:
  - H2: 重要な理由
  - H2: 仕組み
  - H2: レガシー画像のクリーンアップ
  - H2: スマートデフォルト
  - H2: 有効化または無効化
  - H2: プルーニングと Compaction の比較
  - H2: 参考資料
  - H2: 関連項目

## concepts/session-search.md

- ルート: /concepts/session-search
- 見出し:
  - H1: セッション検索
  - H2: 可視性と出力
  - H2: インデックスのライフサイクル
  - H2: セッション検索とメモリ検索の比較

## concepts/session-tool.md

- ルート: /concepts/session-tool
- 見出し:
  - H2: 利用可能なツール
  - H2: セッションの一覧表示と読み取り
  - H2: セッション間メッセージの送信
  - H2: ステータスおよびオーケストレーションヘルパー
  - H2: セッション状態の変更
  - H2: サブエージェントの起動
  - H2: 可視性
  - H2: 参考資料
  - H2: 関連項目

## concepts/session.md

- ルート: /concepts/session
- 見出し:
  - H2: メッセージのルーティング方法
  - H2: DM の分離
  - H3: リンク済みチャネルをドッキングする
  - H2: セッションのライフサイクル
  - H2: 状態の保存場所
  - H2: セッションのメンテナンス
  - H2: セッションの確認
  - H2: 参考資料
  - H2: 関連項目

## concepts/soul.md

- ルート: /concepts/soul
- 見出し:
  - H2: SOUL.md に含める内容
  - H2: この方法が機能する理由
  - H2: Molty プロンプト
  - H2: 良好な状態の例
  - H2: 1つの警告
  - H2: 関連項目

## concepts/streaming.md

- ルート: /concepts/streaming
- 見出し:
  - H2: ブロックストリーミング（チャンネルメッセージ）
  - H3: ブロックストリーミングによるメディア配信
  - H2: チャンク分割アルゴリズム（下限／上限）
  - H2: 結合（ストリーミングされたブロックのマージ）
  - H2: ブロック間の人間らしい間隔
  - H2: 「チャンクをストリーミングするか、すべてをまとめて送るか」
  - H2: プレビューストリーミングモード
  - H3: チャンネルのマッピング
  - H3: レガシーキーの移行
  - H2: ランタイムの動作
  - H3: Telegram
  - H3: Discord
  - H3: Slack
  - H3: Mattermost
  - H3: Matrix
  - H2: ツール進行状況プレビューの更新
  - H2: 進行状況ドラフトのレンダリング
  - H3: 解説用進行状況レーン
  - H2: 関連項目

## concepts/system-prompt.md

- ルート: /concepts/system-prompt
- 見出し:
  - H2: 構造
  - H2: プロンプトモード
  - H2: プロンプトのスナップショット
  - H2: ワークスペースのブートストラップ注入
  - H2: 時刻の処理
  - H2: Skills
  - H2: ドキュメント
  - H2: 関連項目

## concepts/timezone.md

- ルート: /concepts/timezone
- 見出し:
  - H2: 3つのタイムゾーン適用箇所
  - H2: ユーザーのタイムゾーンの設定
  - H2: エンベロープのタイムゾーン値
  - H2: オーバーライドする場合
  - H2: 関連項目

## concepts/typebox.md

- ルート: /concepts/typebox
- 見出し:
  - H2: メンタルモデル（30秒）
  - H2: スキーマの配置場所
  - H2: 現在のパイプライン
  - H2: 実行時におけるスキーマの使用方法
  - H2: フレームの例
  - H2: 最小構成のクライアント（Node.js）
  - H2: 実例：メソッドをエンドツーエンドで追加する
  - H2: Swiftコード生成の動作
  - H2: バージョニングと互換性
  - H2: スキーマのパターンと規約
  - H2: ライブスキーマJSON
  - H2: スキーマを変更するとき
  - H2: 関連項目

## concepts/typing-indicators.md

- ルート: /concepts/typing-indicators
- 見出し:
  - H2: デフォルト
  - H2: モード
  - H2: 設定
  - H2: 注意事項
  - H2: 関連項目

## concepts/usage-tracking.md

- ルート: /concepts/usage-tracking
- 見出し:
  - H2: 概要
  - H2: 表示される場所
  - H2: Anthropic と OpenAI のコスト履歴
  - H2: デフォルトの使用量フッターモード
  - H3: 3つの異なるセッション状態
  - H3: 優先順位
  - H3: リセットと無効化の違い
  - H3: 切り替え動作
  - H3: 設定
  - H2: カスタム /usage フルフッター
  - H3: 形状
  - H3: コントラクトパス
  - H3: 動詞
  - H3: ピースの形式
  - H3: 例
  - H2: プロバイダー + 認証情報
  - H2: 関連項目

## date-time.md

- ルート: /date-time
- 見出し:
  - H2: メッセージエンベロープ（デフォルトではローカル）
  - H3: 例
  - H2: システムプロンプト: 現在の日付と時刻
  - H2: システムイベント行（デフォルトではローカル）
  - H3: ユーザーのタイムゾーンと形式を設定
  - H2: 時刻形式の検出（自動）
  - H2: ツールペイロードとコネクタ（プロバイダーの未加工時刻と正規化済みフィールド）
  - H2: 関連ドキュメント

## debug/node-issue.md

- ルート: /debug/node-issue
- 見出し:
  - H1: Node + tsx の「\\name is not a function」クラッシュ
  - H2: 状態
  - H2: 元の症状
  - H2: 原因
  - H2: 現在の再現確認
  - H2: 回避策（クラッシュが再発した場合）
  - H2: 参考資料
  - H2: 関連情報

## diagnostics/flags.md

- ルート: /diagnostics/flags
- 見出し:
  - H2: 仕組み
  - H2: 既知のフラグ
  - H2: 設定で有効化
  - H2: 環境変数による上書き（一時的）
  - H2: プロファイラーフラグ
  - H2: タイムライン成果物
  - H2: ログの保存先
  - H2: ログの抽出
  - H2: 注意事項
  - H2: 関連情報

## gateway/audit.md

- ルート: /gateway/audit
- 見出し:
  - H1: 監査履歴
  - H2: レコードファミリー
  - H2: メッセージのライフサイクルイベント
  - H3: 会話種別の分類
  - H2: プライバシーモデル
  - H2: 対象範囲と証明の制限
  - H2: ストレージ、保持、移行
  - H2: クエリ
  - H2: 関連情報

## gateway/authentication.md

- ルート: /gateway/authentication
- 見出し:
  - H2: 推奨設定: API キー（任意のプロバイダー）
  - H2: Anthropic: Claude CLI の再利用
  - H2: トークンの手動入力
  - H3: SecretRef を使用した認証情報
  - H2: モデルの認証状態の確認
  - H2: API キーのローテーション（Gateway）
  - H2: Gateway の実行中にプロバイダー認証を削除
  - H2: 使用する認証情報の制御
  - H3: OpenAI とレガシーな openai-codex ID
  - H3: ログイン時（CLI）
  - H3: セッションごと（チャットコマンド）
  - H3: エージェントごと（CLI による上書き）
  - H2: トラブルシューティング
  - H3: 「認証情報が見つかりません」
  - H3: トークンの有効期限切れ間近／期限切れ
  - H2: 関連情報

## gateway/background-process.md

- ルート: /gateway/background-process
- 見出し:
  - H2: exec ツール
  - H3: 環境変数による上書き
  - H3: 設定（環境変数による上書きより推奨）
  - H2: 子プロセスのブリッジ
  - H2: process ツール
  - H2: 例
  - H2: 関連情報

## gateway/bonjour.md

- ルート: /gateway/bonjour
- 見出し:
  - H2: Tailscale 経由の広域 Bonjour（ユニキャスト DNS-SD）
  - H3: Gateway の設定
  - H3: DNS サーバーの初回設定（Gateway ホスト、macOS のみ）
  - H3: Tailscale DNS 設定
  - H3: Gateway リスナーのセキュリティ
  - H2: アドバタイズされる内容
  - H2: サービスタイプ
  - H2: TXT キー（機密情報を含まないヒント）
  - H2: macOS でのデバッグ
  - H2: Gateway ログでのデバッグ
  - H2: iOS Node でのデバッグ
  - H2: Bonjour を有効にする場合
  - H2: Bonjour を無効にする場合
  - H2: Docker の注意点
  - H2: 無効化された Bonjour のトラブルシューティング
  - H2: 一般的な障害モード
  - H2: エスケープされたインスタンス名（\032）
  - H2: 有効化／無効化／設定
  - H2: 関連ドキュメント

## gateway/bridge-protocol.md

- ルート: /gateway/bridge-protocol
- 見出し:
  - H2: 存在していた理由
  - H2: トランスポート
  - H2: ハンドシェイクとペアリング
  - H2: フレーム
  - H2: Exec ライフサイクルイベント
  - H2: 過去の tailnet の使用方法
  - H2: バージョニング
  - H2: 関連情報

## gateway/cli-backends.md

- ルート: /gateway/cli-backends
- 見出し:
  - H2: クイックスタート
  - H2: フォールバックとしての使用
  - H2: 設定
  - H2: 仕組み
  - H3: Claude CLI 固有の仕様
  - H2: セッション
  - H2: claude-cli セッションからのフォールバック用プレリュード
  - H2: 画像
  - H2: 入力と出力
  - H2: Plugin 所有のデフォルト
  - H2: テキスト変換オーバーレイ
  - H2: ネイティブ Compaction の所有権
  - H2: バンドル MCP オーバーレイ
  - H2: 履歴再シードの上限
  - H2: 制限事項
  - H2: トラブルシューティング
  - H2: 関連情報

## gateway/config-agents.md

- ルート: /gateway/config-agents
- 見出し:
  - H2: エージェントのデフォルト
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: エージェントごとのブートストラッププロファイルのオーバーライド
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
  - H3: 入力中インジケーター
  - H3: agents.defaults.sandbox
  - H3: agents.list（エージェントごとのオーバーライド）
  - H2: マルチエージェントルーティング
  - H3: バインディングの照合フィールド
  - H3: エージェントごとのアクセスプロファイル
  - H2: セッション
  - H2: メッセージ
  - H3: 応答プレフィックス
  - H3: 確認リアクション
  - H3: キュー
  - H3: 受信デバウンス
  - H3: その他のメッセージキー
  - H3: TTS（テキスト読み上げ）
  - H2: トーク
  - H2: 関連項目

## gateway/config-channels.md

- ルート: /gateway/config-channels
- 見出し:
  - H2: チャンネル
  - H3: DMとグループへのアクセス
  - H3: チャンネルモデルのオーバーライド
  - H3: チャンネルのデフォルトとHeartbeat
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
  - H3: マルチアカウント（全チャンネル）
  - H3: その他のPluginチャンネル
  - H3: グループチャットでのメンション制御
  - H4: DM履歴の上限
  - H4: 自分とのチャットモード
  - H3: コマンド（チャットコマンドの処理）
  - H2: 関連項目

## gateway/config-tools.md

- ルート: /gateway/config-tools
- 見出し:
  - H2: ツール
  - H3: ツールプロファイル
  - H3: ツールグループ
  - H3: サンドボックスのツールポリシー内のMCPおよびPluginツール
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
  - H2: カスタムプロバイダーとベースURL
  - H3: プロバイダーフィールドの詳細
  - H3: プロバイダーの例
  - H2: 関連項目

## gateway/configuration-examples.md

- ルート: /gateway/configuration-examples
- 見出し:
  - H2: クイックスタート
  - H3: 最小限の構成
  - H3: 推奨スターター構成
  - H2: 拡張例（主要オプション）
  - H3: シンボリックリンクされた兄弟Skillsリポジトリ
  - H2: 一般的なパターン
  - H3: 1つのオーバーライドを持つ共有Skillsベースライン
  - H3: マルチプラットフォーム構成
  - H3: 信頼済みNodeネットワークの自動承認
  - H3: セキュアなDMモード（共有受信トレイ／複数ユーザーDM）
  - H3: Anthropic APIキーとMiniMaxフォールバック
  - H3: 業務用ボット（アクセス制限あり）
  - H3: ローカルモデルのみ
  - H2: ヒント
  - H2: 関連項目

## gateway/configuration-reference.md

- ルート: /gateway/configuration-reference
- 見出し:
  - H2: チャンネル
  - H2: エージェントのデフォルト、マルチエージェント、セッション、メッセージ
  - H2: ツールとカスタムプロバイダー
  - H2: モデル
  - H2: MCP
  - H2: Skills
  - H2: Plugin
  - H3: CodexハーネスPluginの設定
  - H2: コミットメント
  - H2: ブラウザー
  - H2: UI
  - H2: Gateway
  - H3: OpenAI互換エンドポイント
  - H3: 複数インスタンスの分離
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: クラウドワーカー環境
  - H3: Crabboxプロファイル
  - H3: 静的SSH開発プロファイル
  - H2: フック
  - H3: Gmail連携
  - H2: Canvas Pluginホスト
  - H2: 検出
  - H3: mDNS（Bonjour）
  - H3: 広域（DNS-SD）
  - H2: 環境
  - H3: env（インライン環境変数）
  - H3: 環境変数の置換
  - H2: シークレット
  - H3: SecretRef
  - H3: サポートされる認証情報サーフェス
  - H3: シークレットプロバイダーの設定
  - H2: 認証ストレージ
  - H3: auth.cooldowns
  - H2: 監査
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
  - H2: メディアモデルのテンプレート変数
  - H2: 設定のインクルード（$include）
  - H2: 関連項目

## gateway/configuration.md

- ルート: /gateway/configuration
- 見出し:
  - H2: 最小設定
  - H2: 設定の編集
  - H2: 厳格な検証
  - H2: 一般的なタスク
  - H2: 設定のホットリロード
  - H3: リロードモード
  - H3: ホット適用されるものと再起動が必要なもの
  - H3: リロード計画
  - H2: 設定RPC（プログラムによる更新）
  - H2: 環境変数
  - H2: 完全なリファレンス
  - H2: 関連項目

## gateway/diagnostics.md

- ルート: /gateway/diagnostics
- 見出し:
  - H2: クイックスタート
  - H2: チャットコマンド
  - H2: エクスポートに含まれる内容
  - H2: プライバシーモデル
  - H2: 安定性レコーダー
  - H2: 便利なオプション
  - H2: 診断の無効化
  - H2: 関連項目

## gateway/discovery.md

- ルート: /gateway/discovery
- 見出し:
  - H2: 用語
  - H2: 直接接続とSSHの両方が存在する理由
  - H2: 検出入力
  - H3: 1) Bonjour / DNS-SD
  - H4: サービスビーコンの詳細
  - H3: 2) Tailnet（ネットワーク間）
  - H3: 3) 手動／SSHターゲット
  - H2: トランスポートの選択（クライアントポリシー）
  - H2: ペアリングと認証（直接トランスポート）
  - H2: コンポーネント別の責務
  - H2: 関連項目

## gateway/doctor.md

- ルート: /gateway/doctor
- 見出し:
  - H2: クイックスタート
  - H3: ヘッドレスモードと自動化モード
  - H2: 読み取り専用lintモード
  - H2: 実行内容（概要）
  - H2: Dreams UIのバックフィルとリセット
  - H2: 詳細な動作と根拠
  - H2: 関連項目

## gateway/external-apps.md

- ルート: /gateway/external-apps
- 見出し:
  - H2: 現在利用できるもの
  - H2: 推奨パス
  - H2: 協調的なホストの一時停止
  - H2: アプリコードとPluginコード
  - H2: 関連項目

## gateway/gateway-lock.md

- ルート: /gateway/gateway-lock
- 見出し:
  - H2: 理由
  - H2: 2つのレイヤー
  - H3: ファイルロック
  - H3: ソケットのバインド
  - H2: 運用上の注意
  - H2: 関連項目

## gateway/health.md

- ルート: /gateway/health
- 見出し:
  - H2: クイックチェック
  - H2: 詳細診断
  - H2: ヘルスモニターの設定
  - H2: 稼働時間の監視
  - H3: 監視サービスの設定例
  - H2: 問題が発生した場合
  - H2: 専用の「health」コマンド
  - H2: 関連項目

## gateway/heartbeat.md

- ルート: /gateway/heartbeat
- 見出し:
  - H2: クイックスタート（初心者向け）
  - H2: デフォルト
  - H2: Heartbeatプロンプトの用途
  - H2: 応答コントラクト
  - H2: 設定
  - H3: スコープと優先順位
  - H3: エージェントごとのHeartbeat
  - H3: アクティブ時間帯の例
  - H3: 24/7の設定
  - H3: マルチアカウントの例
  - H3: フィールドの注記
  - H2: 配信動作
  - H2: 表示制御
  - H3: 各フラグの動作
  - H3: チャンネル単位とアカウント単位の例
  - H3: 一般的なパターン
  - H2: HEARTBEAT.md（任意）
  - H3: tasks:ブロック
  - H3: エージェントはHEARTBEAT.mdを更新できるか？
  - H2: 手動ウェイク（オンデマンド）
  - H2: 推論の配信（任意）
  - H2: コストへの配慮
  - H2: Heartbeat後のコンテキストオーバーフロー
  - H2: 関連項目

## gateway/index.md

- ルート: /gateway
- 見出し:
  - H2: 5分で行うローカル起動
  - H2: ランタイムモデル
  - H2: OpenAI互換エンドポイント
  - H3: ポートとバインドの優先順位
  - H3: ホットリロードモード
  - H2: オペレーター向けコマンドセット
  - H2: 複数のGateway（同一ホスト）
  - H2: リモートアクセス
  - H2: 監視とサービスのライフサイクル
  - H2: 開発プロファイルのクイックパス
  - H2: プロトコルのクイックリファレンス（オペレーター向け）
  - H2: 運用チェック
  - H3: 稼働性
  - H3: 準備完了性
  - H3: ギャップからの復旧
  - H2: 一般的な障害の兆候
  - H2: 安全性の保証
  - H2: 関連項目

## gateway/local-model-services.md

- ルート: /gateway/local-model-services
- 見出し:
  - H2: 仕組み
  - H2: 設定形式
  - H2: フィールド
  - H2: Inferrsの例
  - H2: ds4の例
  - H2: 関連項目

## gateway/local-models.md

- ルート: /gateway/local-models
- 見出し:
  - H2: 最低ハードウェア要件
  - H2: バックエンドの選択
  - H2: LM Studioと大規模ローカルモデル（Responses API）
  - H3: ハイブリッド設定：ホスト型プライマリ、ローカルフォールバック
  - H3: リージョン別ホスティング／データルーティング
  - H2: その他のOpenAI互換ローカルプロキシ
  - H2: より小規模または厳格なバックエンド
  - H2: トラブルシューティング
  - H2: 関連項目

## gateway/logging.md

- ルート: /gateway/logging
- 見出し:
  - H1: ロギング
  - H2: ファイルベースのロガー
  - H3: 詳細出力とログレベル
  - H2: コンソールキャプチャ
  - H2: マスキング
  - H2: Gateway WebSocketログ
  - H3: WSログの形式
  - H2: コンソールの書式設定（サブシステムロギング）
  - H2: 関連項目

## gateway/multi-tenant-hosting.md

- ルート: /gateway/multi-tenant-hosting
- 見出し:
  - H1: マルチテナントホスティング
  - H2: 各テナントにセルが必要な理由
  - H2: アーキテクチャ
  - H2: 信頼境界
  - H2: 分離レベル
  - H2: クイックスタート
  - H2: MVPから先送りされた項目
  - H2: 関連項目

## gateway/multiple-gateways.md

- ルート: /gateway/multiple-gateways
- 見出し:
  - H2: レスキューボットのクイックスタート
  - H3: --profile rescue onboardによる変更内容
  - H2: 一般的な複数Gateway構成
  - H2: 分離チェックリスト
  - H2: ポートマッピング（導出値）
  - H2: ブラウザー／CDPの注意事項（よくある落とし穴）
  - H2: 手動での環境変数設定例
  - H2: クイックチェック
  - H2: 関連項目

## gateway/network-model.md

- ルート: /gateway/network-model
- 見出し:
  - H2: 関連項目

## gateway/openai-http-api.md

- ルート: /gateway/openai-http-api
- 見出し:
  - H2: エンドポイントの有効化
  - H2: セキュリティ境界（重要）
  - H2: 認証
  - H2: このエンドポイントを使用する場合
  - H2: エージェント優先のモデルコントラクト
  - H2: セッションの動作
  - H2: リクエスト上限（設定）
  - H2: チャットツールのコントラクト
  - H3: サポートされるリクエストフィールド
  - H3: サポートされないバリアント
  - H3: 非ストリーミングツール応答の形式
  - H3: ストリーミングツール応答の形式
  - H3: ツールのフォローアップループ
  - H2: ストリーミング（SSE）
  - H2: Open WebUIのクイックセットアップ
  - H2: 例
  - H2: 関連項目

## gateway/openresponses-http-api.md

- ルート: /gateway/openresponses-http-api
- 見出し:
  - H2: 認証、セキュリティ、ルーティング
  - H2: セッションの動作
  - H2: リクエスト形式
  - H2: 項目（入力）
  - H3: message
  - H3: functioncalloutput（ターンベースのツール）
  - H3: reasoningとitemreference
  - H2: ツール（クライアント側関数ツール）
  - H2: 画像（inputimage）
  - H2: ファイル（inputfile）
  - H2: ファイルと画像の上限（設定）
  - H2: ストリーミング（SSE）
  - H2: 使用量
  - H2: エラー
  - H2: 例
  - H2: 関連項目

## gateway/openshell.md

- ルート: /gateway/openshell
- 見出し:
  - H2: 前提条件
  - H2: クイックスタート
  - H2: ワークスペースモード
  - H3: mirror（デフォルト）
  - H3: remote
  - H3: モードの選択
  - H2: 設定リファレンス
  - H2: 例
  - H3: 最小限のリモート設定
  - H3: GPUを使用するミラーモード
  - H3: カスタムGatewayを使用するエージェントごとのOpenShell
  - H2: ライフサイクル管理
  - H2: セキュリティ強化
  - H2: 現在の制限事項
  - H2: 仕組み
  - H2: 関連項目

## gateway/opentelemetry.md

- ルート: /gateway/opentelemetry
- 見出し:
  - H2: クイックスタート
  - H2: エクスポートされるシグナル
  - H2: 設定リファレンス
  - H3: 環境変数
  - H2: プライバシーとコンテンツキャプチャ
  - H2: サンプリングとフラッシュ
  - H2: エクスポートされるメトリクス
  - H3: モデルの使用量
  - H3: メッセージフロー
  - H3: トーク
  - H3: キューとセッション
  - H3: セッション稼働性のテレメトリ
  - H3: ハーネスのライフサイクル
  - H3: ツール実行とループ検出
  - H3: Exec
  - H3: 診断内部情報（メモリ、ペイロード、エクスポーターの健全性）
  - H2: エクスポートされるスパン
  - H2: 診断イベントカタログ
  - H2: エクスポーターを使用しない場合
  - H2: 無効化
  - H2: 関連項目

## gateway/operator-scopes.md

- ルート: /gateway/operator-scopes
- 見出し:
  - H2: ロール
  - H2: スコープレベル
  - H2: メソッドスコープは最初のゲートにすぎない
  - H2: デバイスのペアリング承認
  - H2: Nodeのペアリング承認
  - H2: 共有シークレット認証

## gateway/pairing.md

- ルート: /gateway/pairing
- 見出し:
  - H2: ケイパビリティ承認の仕組み
  - H2: CLIワークフロー（ヘッドレス対応）
  - H2: APIサーフェス（Gatewayプロトコル）
  - H2: Nodeコマンドのゲート制御（2026.3.31以降）
  - H2: Nodeイベントの信頼境界（2026.3.31以降）
  - H2: SSH検証済みデバイスの自動承認（デフォルト）
  - H2: 自動承認（macOSアプリ）
  - H2: 信頼済みCIDRデバイスの自動承認
  - H2: サイレントペアリングの置き換え後クリーンアップ
  - H2: メタデータアップグレードの自動承認
  - H2: QRペアリングヘルパー
  - H2: ローカル性と転送ヘッダー
  - H2: ストレージ（ローカル、非公開）
  - H2: トランスポートの動作
  - H2: 関連項目

## gateway/prometheus.md

- ルート: /gateway/prometheus
- 見出し:
  - H2: クイックスタート
  - H2: エクスポートされるメトリクス
  - H2: ラベルポリシー
  - H2: PromQLレシピ
  - H2: PrometheusとOpenTelemetryエクスポートの選択
  - H2: トラブルシューティング
  - H2: 関連項目

## gateway/protocol.md

- ルート: /gateway/protocol
- 見出し:
  - H2: トランスポートとフレーミング
  - H2: ハンドシェイク
  - H3: ワーカーロールとクローズドプロトコル
  - H3: クライアントのケイパビリティ
  - H3: Node接続の例
  - H2: ロールとスコープ
  - H3: ケイパビリティ／コマンド／権限（Node）
  - H2: プレゼンス
  - H3: Nodeのバックグラウンド生存イベント
  - H2: ブロードキャストイベントのスコープ設定
  - H2: RPCメソッドファミリー
  - H3: 共通イベントファミリー
  - H3: Nodeヘルパーメソッド
  - H2: 監査台帳RPC
  - H2: タスク台帳RPC
  - H2: オペレーターヘルパーメソッド
  - H3: models.listビュー
  - H2: 実行承認
  - H2: エージェント配信のフォールバック
  - H2: バージョニング
  - H3: クライアント定数
  - H2: 認証
  - H2: デバイスIDとペアリング
  - H3: デバイス認証移行の診断
  - H2: TLSとピンニング
  - H2: スコープ
  - H2: 関連項目

## gateway/remote-gateway-readme.md

- ルート: /gateway/remote-gateway-readme
- 見出し:
  - H1: リモートGatewayでOpenClaw.appを実行する
  - H2: セットアップ
  - H2: 仕組み
  - H2: 関連項目

## gateway/remote.md

- ルート: /gateway/remote
- 見出し:
  - H2: 基本的な考え方
  - H2: トポロジーの選択肢
  - H2: コマンドフロー（何がどこで実行されるか）
  - H2: SSHトンネル（CLIとツール）
  - H2: CLIのリモートデフォルト
  - H2: 認証情報の優先順位
  - H2: チャットUIへのリモートアクセス
  - H2: macOSアプリのリモートモード
  - H2: セキュリティルール（リモート／VPN）
  - H3: macOS：LaunchAgentによる永続的なSSHトンネル
  - H4: 手順1：SSH設定を追加する
  - H4: 手順2：SSH鍵をコピーする（初回のみ）
  - H4: 手順3：Gatewayトークンを設定する
  - H4: 手順4：LaunchAgentを作成する
  - H4: 手順5：LaunchAgentを読み込む
  - H4: トラブルシューティング
  - H2: 関連項目

## gateway/restart-recovery.md

- ルート: /gateway/restart-recovery
- 見出し:
  - H2: 再起動後も維持されるもの
  - H2: 正常な再起動では先に処理をドレインする
  - H2: 中断された処理の検出方法
  - H2: 自動再開
  - H3: サブエージェント
  - H3: バックグラウンドタスク
  - H3: エージェントが要求した再起動
  - H2: 安全弁と可観測性
  - H2: 再開されないもの

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- ルート: /gateway/sandbox-vs-tool-policy-vs-elevated
- 見出し:
  - H2: クイックデバッグ
  - H2: サンドボックス：ツールの実行場所
  - H3: バインドマウント（セキュリティのクイックチェック）
  - H2: ツールポリシー：存在し呼び出せるツール
  - H3: ツールグループ（省略表現）
  - H2: 昇格：exec専用の「ホスト上で実行」
  - H2: 一般的な「サンドボックス監獄」の修正
  - H3: 「ツールXがサンドボックスのツールポリシーによってブロックされる」
  - H3: 「mainだと思っていたのに、なぜサンドボックス化されているのか？」
  - H2: 関連項目

## gateway/sandboxing.md

- ルート: /gateway/sandboxing
- 見出し:
  - H2: サンドボックス化されるもの
  - H2: モード、スコープ、バックエンド
  - H2: Dockerバックエンド
  - H3: サンドボックス化されたブラウザー
  - H2: SSHバックエンド
  - H2: OpenShellバックエンド
  - H2: ワークスペースへのアクセス
  - H2: カスタムバインドマウント
  - H2: イメージとセットアップ
  - H2: setupCommand（コンテナの初回セットアップ）
  - H2: ツールポリシーとエスケープハッチ
  - H2: マルチエージェントのオーバーライド
  - H2: 最小限の有効化例
  - H2: 関連項目

## gateway/secrets-plan-contract.md

- ルート: /gateway/secrets-plan-contract
- 見出し:
  - H2: プランファイルの形式
  - H2: プロバイダーのupsertと削除
  - H2: サポートされるターゲットスコープ
  - H2: ターゲットタイプの動作
  - H2: パス検証ルール
  - H2: 失敗時の動作
  - H2: execプロバイダーの同意動作
  - H2: ランタイムと監査スコープに関する注記
  - H2: オペレーターによるチェック
  - H2: 関連ドキュメント

## gateway/secrets.md

- ルート: /gateway/secrets
- 見出し:
  - H2: ランタイムモデル
  - H2: 送信時の注入（センチネル）
  - H2: エージェントアクセス境界
  - H2: アクティブサーフェスのフィルタリング
  - H2: Gateway認証サーフェスの診断
  - H2: オンボーディング参照の事前確認
  - H2: SecretRefコントラクト
  - H2: プロバイダー設定
  - H2: ファイルを基盤とするAPIキー
  - H2: exec連携の例
  - H2: MCPサーバーの環境変数
  - H2: サンドボックスのSSH認証情報
  - H2: サポートされる認証情報サーフェス
  - H2: 必須の動作と優先順位
  - H2: アクティベーショントリガー
  - H2: 機能低下と回復のシグナル
  - H2: コマンドパスの解決
  - H2: 監査と設定のワークフロー
  - H2: 一方向の安全ポリシー
  - H2: レガシー認証の互換性に関する注記
  - H2: Web UIに関する注記
  - H2: 関連項目

## gateway/security/audit-checks.md

- ルート: /gateway/security/audit-checks
- 見出し:
  - H2: 関連項目

## gateway/security/exposure-runbook.md

- ルート: /gateway/security/exposure-runbook
- 見出し:
  - H2: 公開パターンを選択する
  - H2: 事前インベントリ
  - H2: ベースラインチェック
  - H2: 最小限の安全なベースライン
  - H2: DMとグループの公開範囲
  - H2: リバースプロキシのチェック
  - H2: ツールとサンドボックスのレビュー
  - H2: 変更後の検証
  - H2: ロールバック計画
  - H2: レビューチェックリスト

## gateway/security/index.md

- ルート: /gateway/security
- 見出し:
  - H2: スコープ：パーソナルアシスタントのセキュリティモデル
  - H2: openclawセキュリティ監査
  - H3: 監査でチェックする内容（概要）
  - H3: 検出事項をトリアージする際の優先順位
  - H2: 60秒で構築する強化ベースライン
  - H2: 信頼境界マトリクス
  - H2: 設計上、脆弱性ではないもの
  - H2: GatewayとNodeの信頼
  - H2: 脅威モデル
  - H2: DMアクセス：ペアリング、許可リスト、オープン、無効
  - H3: 許可リスト（2層）
  - H3: DMセッションの分離（マルチユーザーモード）
  - H2: コンテキストの可視性とトリガー認可
  - H2: プロンプトインジェクション
  - H3: 外部コンテンツと信頼されていない入力のラッピング
  - H3: バイパスフラグ（本番環境では無効に保つ）
  - H3: グループ内での推論と詳細出力
  - H2: コマンド認可
  - H2: コントロールプレーンツール
  - H2: Nodeでの実行（system.run）
  - H2: 動的Skills（ウォッチャー／リモートNode）
  - H2: Plugin
  - H2: サンドボックス化
  - H3: サブエージェント委任のガードレール
  - H3: 読み取り専用モード
  - H2: エージェントごとのアクセスプロファイル（マルチエージェント）
  - H3: フルアクセス（サンドボックスなし）
  - H3: 読み取り専用ツール＋読み取り専用ワークスペース
  - H3: ファイルシステム／シェルへのアクセスなし（プロバイダーメッセージングは許可）
  - H2: ブラウザー制御のリスク
  - H3: ブラウザーSSRFポリシー（デフォルトで厳格）
  - H2: ネットワーク公開
  - H3: バインド、ポート、ファイアウォール
  - H3: UFW使用時のDockerポート公開
  - H3: mDNS／Bonjourディスカバリー
  - H3: Gateway WebSocket認証
  - H3: Tailscale Serve IDヘッダー
  - H3: リバースプロキシの設定
  - H3: HSTSとオリジンに関する注記
  - H3: HTTP経由のコントロールUI
  - H3: 安全でない／危険なフラグ
  - H2: デプロイとホストの信頼
  - H2: ディスク上のシークレット
  - H3: 認証情報の保存場所マップ
  - H3: ファイル権限
  - H3: ワークスペースの.envファイル
  - H3: ログとトランスクリプト
  - H2: 安全なベースライン（コピー＆ペースト）
  - H3: 番号を分ける（WhatsApp、Signal、Telegram）
  - H2: インシデント対応
  - H3: 封じ込め
  - H3: ローテーション（シークレットが漏えいした場合は侵害を想定）
  - H3: 監査
  - H3: レポート用の情報収集
  - H2: シークレットスキャン
  - H2: セキュリティ問題の報告

## gateway/security/secure-file-operations.md

- ルート: /gateway/security/secure-file-operations
- 見出し:
  - H2: デフォルト：Pythonヘルパーなし
  - H2: Pythonなしでも保護されるもの
  - H2: Pythonによって追加されるもの
  - H2: Pluginとコアに関するガイダンス

## gateway/security/shrinkwrap.md

- ルート: /gateway/security/shrinkwrap
- 見出し:
  - H2: 重要である理由
  - H2: 生成とチェック
  - H2: 公開済みパッケージの検査

## gateway/tailscale.md

- ルート: /gateway/tailscale
- 見出し:
  - H2: モード
  - H2: 設定例
  - H3: Tailnet限定（Serve）
  - H3: Tailnet限定（Tailnet IPにバインド）
  - H3: 公開インターネット（Funnel＋共有パスワード）
  - H2: CLIの例
  - H2: 認証
  - H3: Tailscale IDヘッダー（Serveのみ）
  - H2: 注記
  - H3: Tailscaleの前提条件と制限
  - H2: ブラウザー制御（リモートGateway＋ローカルブラウザー）
  - H2: 詳細情報
  - H2: 関連項目

## gateway/tools-invoke-http-api.md

- ルート: /gateway/tools-invoke-http-api
- 見出し:
  - H2: 認証
  - H2: セキュリティ境界（重要）
  - H2: リクエスト本文
  - H2: ポリシーとルーティングの動作
  - H2: レスポンス
  - H2: 例
  - H2: 関連項目

## gateway/troubleshooting.md

- ルート: /gateway/troubleshooting
- 見出し:
  - H2: コマンドの確認手順
  - H2: アップデート後
  - H2: 分裂したインストールと新しい設定のガード
  - H2: ロールバック後のプロトコル不一致
  - H2: パスエスケープとしてスキップされたSkillシンボリックリンク
  - H2: Anthropic 429：長いコンテキストには追加使用量が必要
  - H2: アップストリームの403ブロックレスポンス
  - H2: ローカルのOpenAI互換バックエンドは直接プローブに成功するが、エージェント実行は失敗する
  - H2: 応答がない
  - H2: ダッシュボードのコントロールUI接続
  - H3: 認証詳細コードのクイックマップ
  - H2: Gatewayサービスが実行されていない
  - H2: macOS Gatewayが通知なしに応答を停止し、ダッシュボードを操作すると再開する
  - H2: Gateway／NodeのLaunchAgent重複によるmacOS launchdスーパーバイザーループ
  - H2: メモリ使用量が多いときにGatewayが終了する
  - H2: Gatewayが無効な設定を拒否した
  - H2: Gatewayプローブの警告
  - H2: チャンネルは接続済みだがメッセージが流れない
  - H2: CronとHeartbeatの配信
  - H2: Nodeはペアリング済みだがツールが失敗する
  - H2: ブラウザーツールが失敗する
  - H2: アップグレード後に突然問題が発生した場合
  - H2: 関連項目

## gateway/trusted-proxy-auth.md

- ルート: /gateway/trusted-proxy-auth
- 見出し:
  - H2: 使用する場合
  - H2: 使用してはいけない場合
  - H2: 仕組み
  - H2: 設定
  - H3: 設定リファレンス
  - H2: コントロールUIのペアリング動作
  - H2: オペレータースコープヘッダー
  - H2: TLS終端とHSTS
  - H3: ロールアウトのガイダンス
  - H2: プロキシ設定例
  - H2: 混在トークン設定
  - H2: セキュリティチェックリスト
  - H2: セキュリティ監査
  - H2: トラブルシューティング
  - H2: トークン認証からの移行
  - H2: 関連項目

## help/debugging.md

- ルート: /help/debugging
- 見出し:
  - H2: ランタイムデバッグのオーバーライド
  - H2: セッショントレース出力
  - H2: Pluginライフサイクルのトレース
  - H2: CLI起動とコマンドのプロファイリング
  - H2: Gatewayウォッチモード
  - H2: 開発プロファイル＋開発Gateway（--dev）
  - H2: 生ストリームのロギング
  - H2: 安全上の注意
  - H2: VSCodeでのデバッグ
  - H3: セットアップ
  - H3: 注記
  - H2: 関連項目

## help/environment.md

- ルート: /help/environment
- 見出し:
  - H2: 優先順位（高い順）
  - H2: プロバイダー認証情報とワークスペースの.env
  - H2: 設定のenvブロック
  - H2: シェル環境変数のインポート
  - H2: execシェルのスナップショット
  - H2: ランタイムによって注入される環境変数
  - H2: UI環境変数
  - H2: 設定内の環境変数置換
  - H2: シークレット参照と${ENV}文字列
  - H2: パス関連の環境変数
  - H2: ロギング
  - H3: OPENCLAWHOME
  - H2: nvmユーザー：webfetchのTLS障害
  - H2: レガシー環境変数
  - H2: 関連項目

## help/faq-first-run.md

- ルート: /help/faq-first-run
- 見出し:
  - H2: クイックスタートと初回実行セットアップ
  - H2: 関連項目

## help/faq-models.md

- ルート: /help/faq-models
- 見出し:
  - H2: モデル：デフォルト、選択、エイリアス、切り替え
  - H2: モデルのフェイルオーバーと「すべてのモデルが失敗しました」
  - H2: 認証プロファイル：概要と管理方法
  - H2: 関連項目

## help/faq.md

- ルート: /help/faq
- 見出し:
  - H2: 問題が発生した場合の最初の60秒
  - H2: クイックスタートと初回セットアップ
  - H2: OpenClawとは？
  - H2: Skillsと自動化
  - H2: サンドボックス化とメモリ
  - H2: ディスク上の保存場所
  - H2: 設定の基本
  - H2: リモートGatewayとNode
  - H2: 環境変数と.envの読み込み
  - H2: セッションと複数のチャット
  - H2: モデル、フェイルオーバー、認証プロファイル
  - H2: Gateway: ポート、「すでに実行中」、リモートモード
  - H2: ログ記録とデバッグ
  - H2: メディアと添付ファイル
  - H2: セキュリティとアクセス制御
  - H2: チャットコマンド、タスクの中止、「停止しない」場合
  - H2: その他
  - H2: 関連情報

## help/index.md

- ルート: /help
- 見出し:
  - H2: よくある質問
  - H2: 診断
  - H2: テスト
  - H2: コミュニティとメタ情報

## help/scripts.md

- ルート: /help/scripts
- 見出し:
  - H2: 規約
  - H2: 認証監視スクリプト
  - H2: GitHub読み取りヘルパー
  - H2: スクリプトを追加する場合
  - H2: 関連情報

## help/testing-live.md

- ルート: /help/testing-live
- 見出し:
  - H2: ライブ: ローカルスモークコマンド
  - H2: ライブ: Android Nodeの機能スイープ
  - H2: ライブ: モデルのスモークテスト（プロファイルキー）
  - H3: レイヤー1: モデルの直接補完（Gatewayなし）
  - H3: レイヤー2: Gateway + 開発エージェントのスモークテスト（「@openclaw」が実際に行うこと）
  - H2: ライブ: CLIバックエンドのスモークテスト（Claude、Gemini、その他のローカルCLI）
  - H2: ライブ: APNs HTTP/2プロキシへの到達性
  - H2: ライブ: ACPバインドのスモークテスト（/acp spawn ... --bind here）
  - H2: ライブ: Codex app-serverハーネスのスモークテスト
  - H3: 推奨ライブレシピ
  - H2: ライブ: モデルマトリクス（対象範囲）
  - H3: アグリゲーター / 代替Gateway
  - H2: 認証情報（絶対にコミットしない）
  - H2: Deepgramライブ（音声文字起こし）
  - H2: BytePlusコーディングプランのライブテスト
  - H2: ComfyUIワークフローメディアのライブテスト
  - H2: 画像生成のライブテスト
  - H2: 音楽生成のライブテスト
  - H2: 動画生成のライブテスト
  - H2: メディアライブハーネス
  - H2: 関連情報

## help/testing-updates-plugins.md

- ルート: /help/testing-updates-plugins
- 見出し:
  - H2: 保護するもの
  - H2: 開発中のローカル検証
  - H2: Dockerレーン
  - H2: パッケージ受け入れテスト
  - H2: リリースのデフォルト
  - H2: レガシー互換性
  - H2: カバレッジの追加
  - H2: 障害のトリアージ

## help/testing.md

- ルート: /help/testing
- 見出し:
  - H2: クイックスタート
  - H2: テスト用一時ディレクトリ
  - H2: ライブおよびDocker/Parallelsワークフロー
  - H2: QA専用ランナー
  - H3: Convex経由で共有するTelegram認証情報（v1）
  - H3: QAへのチャネル追加
  - H2: テストスイート（実行場所）
  - H3: ユニット / 統合（デフォルト）
  - H3: 安定性（Gateway）
  - H3: E2E（リポジトリ全体）
  - H3: E2E（Gatewayスモークテスト）
  - H3: E2E（Control UIのモックブラウザー）
  - H3: E2E: OpenShellバックエンドのスモークテスト
  - H3: ライブ（実際のプロバイダー + 実際のモデル）
  - H2: どのスイートを実行すべきか？
  - H2: ライブ（ネットワークにアクセスする）テスト
  - H2: Dockerランナー（任意の「Linuxで動作する」チェック）
  - H2: ドキュメントの健全性チェック
  - H2: オフライン回帰テスト（CIで安全）
  - H2: エージェント信頼性評価（Skills）
  - H2: コントラクトテスト（Pluginとチャネルの構造）
  - H3: コマンド
  - H3: チャネルコントラクト
  - H3: プロバイダーコントラクト
  - H3: 実行するタイミング
  - H2: 回帰テストの追加（ガイダンス）
  - H2: 関連情報

## help/troubleshooting.md

- ルート: /help/troubleshooting
- 見出し:
  - H2: 最初の60秒
  - H2: アシスタントの機能が限定的、またはツールが不足している
  - H2: Anthropicの長いコンテキストでの429
  - H2: ローカルのOpenAI互換バックエンドは直接使用すると動作するが、OpenClawでは失敗する
  - H2: openclaw拡張機能が見つからずPluginのインストールが失敗する
  - H2: インストールポリシーによってPluginのインストールまたは更新がブロックされる
  - H2: Pluginは存在するが、不審な所有権によりブロックされる
  - H2: デシジョンツリー
  - H2: 関連情報

## index.md

- ルート: /
- 見出し:
  - H1: OpenClaw 🦞
  - H2: ドキュメントを見る
  - H2: OpenClawとは？
  - H2: 仕組み
  - H2: 主な機能
  - H2: クイックスタート
  - H2: ダッシュボード
  - H2: 設定（任意）
  - H2: ここから始める
  - H2: 詳細情報

## install/ansible.md

- ルート: /install/ansible
- 見出し:
  - H2: 前提条件
  - H2: 導入されるもの
  - H2: クイックスタート
  - H2: インストールされるもの
  - H2: インストール後のセットアップ
  - H3: クイックコマンド
  - H2: セキュリティアーキテクチャ
  - H2: 手動インストール
  - H2: 更新
  - H2: トラブルシューティング
  - H2: 高度な設定
  - H2: 関連情報

## install/azure.md

- ルート: /install/azure
- 見出し:
  - H2: 実行すること
  - H2: 必要なもの
  - H2: デプロイの設定
  - H2: Azureリソースのデプロイ
  - H2: OpenClawのインストール
  - H2: コストに関する考慮事項
  - H2: クリーンアップ
  - H2: 次のステップ
  - H2: 関連情報

## install/bun.md

- ルート: /install/bun
- 見出し:
  - H2: インストール
  - H2: ライフサイクルスクリプト
  - H2: 注意事項
  - H2: 関連情報

## install/clawdock.md

- ルート: /install/clawdock
- 見出し:
  - H2: インストール
  - H2: 導入されるもの
  - H3: 基本操作
  - H3: コンテナへのアクセス
  - H3: Web UIとペアリング
  - H3: セットアップとメンテナンス
  - H3: ユーティリティ
  - H2: 初回フロー
  - H2: 設定とシークレット
  - H2: 関連情報

## install/development-channels.md

- ルート: /install/development-channels
- 見出し:
  - H2: チャネルの切り替え
  - H2: 単発のバージョンまたはタグ指定
  - H2: ドライラン
  - H2: Pluginとチャネル
  - H2: 現在の状態の確認
  - H2: タグ付けのベストプラクティス
  - H2: macOSアプリの提供状況
  - H2: 関連情報

## install/digitalocean.md

- ルート: /install/digitalocean
- 見出し:
  - H2: 前提条件
  - H2: セットアップ
  - H2: 永続化とバックアップ
  - H2: 1 GB RAM向けのヒント
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連情報

## install/docker-vm-runtime.md

- ルート: /install/docker-vm-runtime
- 見出し:
  - H2: 必要なバイナリをイメージに組み込む
  - H2: ビルドと起動
  - H2: 各データが永続化される場所
  - H2: 更新
  - H2: 関連情報

## install/docker.md

- ルート: /install/docker
- 見出し:
  - H2: 前提条件
  - H2: コンテナ化されたGateway
  - H3: 手動フロー
  - H3: コンテナイメージのアップグレード
  - H3: 環境変数
  - H3: 選択したPluginを含むソースビルドイメージ
  - H3: オブザーバビリティ
  - H3: ヘルスチェック
  - H3: LANとloopbackの比較
  - H3: ホスト上のローカルプロバイダー
  - H3: Docker内のClaude CLIバックエンド
  - H3: Bonjour / mDNS
  - H3: ストレージと永続化
  - H3: シェルヘルパー（任意）
  - H3: VPS上で実行する場合
  - H2: エージェントサンドボックス
  - H3: クイック有効化
  - H2: トラブルシューティング
  - H2: 関連情報

## install/exe-dev.md

- ルート: /install/exe-dev
- 見出し:
  - H2: 必要なもの
  - H2: 初心者向けクイック手順
  - H2: Shelleyによる自動インストール
  - H2: 手動インストール
  - H2: リモートチャネルのセットアップ
  - H2: リモートアクセス
  - H2: 更新
  - H2: 関連情報

## install/fly.md

- ルート: /install/fly
- 見出し:
  - H2: 必要なもの
  - H2: 初心者向けクイック手順
  - H2: トラブルシューティング
  - H3: "App is not listening on expected address"
  - H3: ヘルスチェックの失敗 / 接続拒否
  - H3: OOM / メモリの問題
  - H3: Gatewayロックの問題
  - H3: 設定が読み込まれない
  - H3: SSH経由での設定書き込み
  - H3: 状態が永続化されない
  - H2: 更新
  - H3: マシンコマンドの更新
  - H2: プライベートデプロイ（強化済み）
  - H3: プライベートデプロイを使用する場合
  - H3: セットアップ
  - H3: プライベートデプロイへのアクセス
  - H3: プライベートデプロイでのWebhook
  - H3: セキュリティ上のトレードオフ
  - H2: 注記
  - H2: コスト
  - H2: 次のステップ
  - H2: 関連情報

## install/gcp.md

- ルート: /install/gcp
- 見出し:
  - H2: 必要なもの
  - H2: クイック手順
  - H2: トラブルシューティング
  - H2: サービスアカウント（セキュリティのベストプラクティス）
  - H2: 次のステップ
  - H2: 関連情報

## install/hetzner.md

- ルート: /install/hetzner
- 見出し:
  - H2: 必要なもの
  - H2: クイック手順
  - H2: Infrastructure as Code（Terraform）
  - H2: 次のステップ
  - H2: 関連情報

## install/hostinger.md

- ルート: /install/hostinger
- 見出し:
  - H2: 前提条件
  - H2: オプションA: 1クリックOpenClaw
  - H2: オプションB: VPS上のOpenClaw
  - H2: セットアップの確認
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連情報

## install/index.md

- ルート: /install
- 見出し:
  - H2: システム要件
  - H2: 推奨: インストーラースクリプト
  - H2: 代替インストール方法
  - H3: ローカルプレフィックスインストーラー（install-cli.sh）
  - H3: npm、pnpm、またはbun
  - H3: ソースから
  - H3: GitHubのmainチェックアウトからインストール
  - H3: コンテナとパッケージマネージャー
  - H2: インストールの確認
  - H2: ホスティングとデプロイ
  - H2: 更新、移行、またはアンインストール
  - H2: トラブルシューティング: openclawが見つからない

## install/installer.md

- ルート: /install/installer
- 見出し:
  - H2: クイックコマンド
  - H2: install.sh
  - H3: フロー（install.sh）
  - H3: ソースチェックアウトの検出
  - H3: 例（install.sh）
  - H2: install-cli.sh
  - H3: フロー（install-cli.sh）
  - H3: 例（install-cli.sh）
  - H2: install.ps1
  - H3: フロー（install.ps1）
  - H3: 例（install.ps1）
  - H2: CIと自動化
  - H2: トラブルシューティング
  - H2: 関連情報

## install/kubernetes.md

- ルート: /install/kubernetes
- 見出し:
  - H2: Helmを使用しない理由
  - H2: 必要なもの
  - H2: クイックスタート
  - H2: Kindによるローカルテスト
  - H2: 手順
  - H3: 1) デプロイ
  - H3: 2) Gatewayへのアクセス
  - H2: デプロイされるもの
  - H2: カスタマイズ
  - H3: エージェントへの指示
  - H3: Gatewayの設定
  - H3: プロバイダーの追加
  - H3: カスタム名前空間
  - H3: カスタムイメージ
  - H3: ポートフォワード以外への公開
  - H2: 再デプロイ
  - H2: 削除
  - H2: アーキテクチャに関する注記
  - H2: ファイル構成
  - H2: 関連情報

## install/macos-vm.md

- ルート: /install/macos-vm
- 見出し:
  - H2: 推奨デフォルト（ほとんどのユーザー向け）
  - H2: macOS VMの選択肢
  - H3: Apple Silicon Mac上のローカルVM（Lume）
  - H3: ホスティング型Macプロバイダー（クラウド）
  - H2: クイック手順（Lume、経験者向け）
  - H2: 必要なもの（Lume）
  - H2: 1) Lumeをインストール
  - H2: 2) macOS VMを作成
  - H2: 3) Setup Assistantを完了
  - H2: 4) VMのIPアドレスを取得
  - H2: 5) SSHでVMに接続
  - H2: 6) OpenClawをインストール
  - H2: 7) チャネルを設定
  - H2: 8) VMをヘッドレスで実行
  - H2: 追加機能: iMessage連携
  - H2: ゴールデンイメージの保存
  - H2: 24時間365日の実行
  - H2: トラブルシューティング
  - H2: 関連ドキュメント

## install/migrating-claude.md

- ルート: /install/migrating-claude
- 見出し:
  - H2: 2つのインポート方法
  - H2: インポートされるもの
  - H2: アーカイブ専用として残るもの
  - H2: ソースの選択
  - H2: 推奨フロー
  - H2: 競合の処理
  - H2: 自動化用のJSON出力
  - H2: トラブルシューティング
  - H2: 関連情報

## install/migrating-hermes.md

- ルート: /install/migrating-hermes
- 見出し:
  - H2: 2つのインポート方法
  - H2: インポートされるもの
  - H2: アーカイブ専用として残るもの
  - H2: 推奨フロー
  - H2: 競合の処理
  - H2: シークレット
  - H2: 自動化用のJSON出力
  - H2: トラブルシューティング
  - H2: 関連情報

## install/migrating.md

- ルート: /install/migrating
- 見出し:
  - H2: 別のエージェントシステムからインポート
  - H2: OpenClawを新しいマシンに移行
  - H3: 移行手順
  - H3: よくある落とし穴
  - H3: 検証チェックリスト
  - H2: Pluginをインプレースでアップグレード
  - H2: 関連情報

## install/nix.md

- ルート: /install/nix
- 見出し:
  - H2: 導入されるもの
  - H2: クイックスタート
  - H2: Nixモードのランタイム動作
  - H3: Nixモードで変わること
  - H3: 設定と状態のパス
  - H3: サービスのPATH検出
  - H2: 関連情報

## install/node.md

- ルート: /install/node
- 見出し:
  - H2: バージョンの確認
  - H2: Nodeのインストール
  - H2: トラブルシューティング
  - H3: openclaw: コマンドが見つからない
  - H3: npm install -gでの権限エラー（Linux）
  - H2: 関連情報

## install/northflank.mdx

- ルート: /install/northflank
- 見出し:
  - H2: はじめに
  - H2: 導入されるもの
  - H2: チャネルの接続
  - H2: 次のステップ

## install/oracle.md

- ルート: /install/oracle
- 見出し:
  - H2: 前提条件
  - H2: セットアップ
  - H2: セキュリティ態勢の確認
  - H2: ARMに関する注記
  - H2: 永続化とバックアップ
  - H2: フォールバック: SSHトンネル
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連情報

## install/podman.md

- ルート: /install/podman
- 見出し:
  - H2: 前提条件
  - H2: クイックスタート
  - H2: Podman と Tailscale
  - H2: Systemd（Quadlet、任意）
  - H2: 設定、環境変数、ストレージ
  - H2: イメージのアップグレード
  - H2: 便利なコマンド
  - H2: トラブルシューティング
  - H2: 関連情報

## install/railway.mdx

- ルート: /install/railway
- 見出し:
  - H2: ワンクリックデプロイ
  - H2: 提供されるもの
  - H2: チャンネルを接続する
  - H2: バックアップと移行
  - H2: 次のステップ

## install/raspberry-pi.md

- ルート: /install/raspberry-pi
- 見出し:
  - H2: ハードウェアの互換性
  - H2: 前提条件
  - H2: セットアップ
  - H2: パフォーマンスのヒント
  - H2: 推奨モデル設定
  - H2: ARM バイナリに関する注意事項
  - H2: 永続化とバックアップ
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連情報

## install/render.mdx

- ルート: /install/render
- 見出し:
  - H2: 前提条件
  - H2: デプロイ
  - H2: Blueprint
  - H2: プランの選択
  - H2: デプロイ後
  - H3: コントロール UI にアクセスする
  - H3: ログ
  - H3: シェルアクセス
  - H3: 環境変数
  - H3: 自動デプロイ
  - H2: カスタムドメイン
  - H2: スケーリング
  - H2: バックアップと移行
  - H2: トラブルシューティング
  - H3: サービスが起動しない
  - H3: コールドスタートが遅い（無料プラン）
  - H3: 再デプロイ後のデータ消失
  - H3: ヘルスチェックの失敗
  - H2: 次のステップ

## install/uninstall.md

- ルート: /install/uninstall
- 見出し:
  - H2: 簡単な方法（CLI がまだインストールされている場合）
  - H2: サービスを手動で削除する（CLI がインストールされていない場合）
  - H3: macOS（launchd）
  - H3: Linux（systemd ユーザーユニット）
  - H3: Windows（スケジュールされたタスク）
  - H2: 通常インストールとソースチェックアウト
  - H3: 通常インストール（install.sh / npm / pnpm / bun）
  - H3: ソースチェックアウト（git clone）
  - H2: 関連情報

## install/updating.md

- ルート: /install/updating
- 見出し:
  - H2: 推奨: openclaw update
  - H2: npm インストールと git インストールを切り替える
  - H2: 代替方法: インストーラーを再実行する
  - H2: 代替方法: npm、pnpm、または bun を手動で使用する
  - H3: npm インストールの高度なトピック
  - H2: 自動アップデーター
  - H2: 更新後
  - H3: doctor を実行する
  - H3: Gateway を再起動する
  - H3: 確認
  - H2: ロールバック
  - H3: バージョンを固定する（npm）
  - H3: コミットを固定する（ソース）
  - H2: 行き詰まった場合
  - H2: 関連情報

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
  - H2: 関連情報

## logging.md

- ルート: /logging
- 見出し:
  - H2: ログの保存場所
  - H2: ログの読み方
  - H3: CLI: ライブ追跡（推奨）
  - H3: コントロール UI（Web）
  - H3: チャンネル専用ログ
  - H2: ログ形式
  - H3: ファイルログ（JSONL）
  - H3: コンソール出力
  - H3: Gateway WebSocket ログ
  - H2: ログの設定
  - H3: ログレベル
  - H3: 対象を絞ったモデル転送診断
  - H3: トレース相関
  - H3: モデル呼び出しのサイズとタイミング
  - H3: コンソールスタイル
  - H3: 墨消し
  - H2: 診断と OpenTelemetry
  - H2: トラブルシューティングのヒント
  - H2: 関連情報

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
  - H2: 製品領域
  - H2: 詳細
  - H3: コア
  - H3: プラットフォーム
  - H3: チャンネル
  - H3: プロバイダーとツール

## network.md

- ルート: /network
- 見出し:
  - H2: コアモデル
  - H2: ペアリングと ID
  - H2: 検出とトランスポート
  - H2: Node とトランスポート
  - H2: セキュリティ
  - H2: 関連情報

## nodes/audio.md

- ルート: /nodes/audio
- 見出し:
  - H2: 機能
  - H2: 自動検出（デフォルト）
  - H2: 設定例
  - H3: プロバイダーと CLI フォールバック（OpenAI と Whisper CLI）
  - H3: スコープ制限付きプロバイダーのみ
  - H3: プロバイダーのみ（Deepgram）
  - H3: プロバイダーのみ（Mistral Voxtral）
  - H3: プロバイダーのみ（SenseAudio）
  - H3: トランスクリプトをチャットにエコーする（オプトイン）
  - H2: 注意事項と制限
  - H3: 常駐型ローカル STT
  - H3: プロキシ環境のサポート
  - H2: グループ内のメンション検出
  - H2: 注意点
  - H2: 関連情報

## nodes/camera.md

- ルート: /nodes/camera
- 見出し:
  - H2: iOS Node
  - H3: iOS ユーザー設定
  - H3: iOS コマンド（Gateway node.invoke 経由）
  - H3: iOS のフォアグラウンド要件
  - H3: CLI ヘルパー
  - H2: Android Node
  - H3: Android ユーザー設定
  - H3: 権限
  - H3: Android のフォアグラウンド要件
  - H3: Android コマンド（Gateway node.invoke 経由）
  - H2: macOS アプリ
  - H3: macOS ユーザー設定
  - H3: CLI ヘルパー（node invoke）
  - H2: 安全性と実用上の制限
  - H2: macOS の画面動画（OS レベル）
  - H2: 関連情報

## nodes/computer-use.md

- ルート: /nodes/computer-use
- 見出し:
  - H2: 要件
  - H2: コンピューターエージェントツール
  - H2: computer.act Node コマンド
  - H2: 有効化と準備
  - H2: 安全性
  - H2: その他のデスクトップ制御経路との関係

## nodes/images.md

- ルート: /nodes/images
- 見出し:
  - H2: 目標
  - H2: CLI サーフェス
  - H2: WhatsApp Web チャンネルの動作
  - H2: 自動応答パイプライン
  - H2: 受信メディアからコマンドへの変換
  - H2: 制限とエラー
  - H2: テストに関する注意事項
  - H2: 関連情報

## nodes/index.md

- ルート: /nodes
- 見出し:
  - H2: ペアリングとステータス
  - H2: バージョンのずれとアップグレード順序
  - H2: リモート Node ホスト（system.run）
  - H3: Node ホストを起動する（フォアグラウンド）
  - H3: SSH トンネル経由のリモート Gateway（ループバックバインド）
  - H3: Node ホストを起動する（サービス）
  - H3: ペアリングと命名
  - H3: Node でホストされる MCP サーバー
  - H3: Node でホストされる Skills
  - H3: ヘッドレス ID 状態
  - H3: コマンドを許可リストに追加する
  - H3: exec の接続先を Node に設定する
  - H3: ローカルモデル推論
  - H3: Codex セッションとトランスクリプト
  - H3: Claude セッションとトランスクリプト
  - H2: コマンドの呼び出し
  - H2: コマンドポリシー
  - H2: 設定（openclaw.json）
  - H2: スクリーンショット（キャンバススナップショット）
  - H3: キャンバスコントロール
  - H3: A2UI（キャンバス）
  - H2: 写真と動画（Node カメラ）
  - H2: 画面録画（Node）
  - H2: 位置情報（Node）
  - H2: SMS（Android Node）
  - H2: デバイスおよび個人データのコマンド
  - H2: システムコマンド（Node ホスト / Mac Node）
  - H2: exec Node バインディング
  - H2: 権限マップ
  - H2: ヘッドレス Node ホスト（クロスプラットフォーム）
  - H2: Mac Node モード

## nodes/location-command.md

- ルート: /nodes/location-command
- 見出し:
  - H2: 要約
  - H2: 単なるスイッチではなくセレクターを使用する理由
  - H2: 設定モデル
  - H2: 権限マッピング（node.permissions）
  - H2: コマンド: location.get
  - H2: バックグラウンド動作
  - H2: モデルおよびツールとの統合
  - H2: UX 文言（推奨）
  - H2: 関連情報

## nodes/media-understanding.md

- ルート: /nodes/media-understanding
- 見出し:
  - H2: 仕組み
  - H2: 設定
  - H3: モデルエントリ
  - H3: プロバイダー認証情報
  - H2: ルールと動作
  - H3: 自動検出（デフォルト）
  - H3: プロキシ対応（音声/動画プロバイダー呼び出し）
  - H2: 機能
  - H2: プロバイダー対応マトリックス
  - H2: モデル選択ガイド
  - H2: 添付ファイルポリシー
  - H3: 添付ファイルの抽出
  - H2: 設定例
  - H2: ステータス出力
  - H2: 注意事項
  - H2: 関連情報

## nodes/presence.md

- ルート: /nodes/presence
- 見出し:
  - H2: 要件
  - H2: アクティブなコンピューターを確認する
  - H2: アクティビティがプレゼンスになる仕組み
  - H2: プライバシーとモデルコンテキスト
  - H2: 接続アラートのルーティング方法
  - H2: トラブルシューティング
  - H2: 関連情報

## nodes/talk.md

- ルート: /nodes/talk
- 見出し:
  - H2: 動作（macOS）
  - H2: 応答内の音声ディレクティブ
  - H2: 設定（/.openclaw/openclaw.json）
  - H2: macOS UI
  - H2: Android UI
  - H2: 注意事項
  - H2: 関連情報

## nodes/troubleshooting.md

- ルート: /nodes/troubleshooting
- 見出し:
  - H2: コマンドの確認手順
  - H2: フォアグラウンド要件
  - H2: 権限マトリックス
  - H2: ペアリングと承認の違い
  - H2: 一般的な Node エラーコード
  - H2: 迅速な復旧手順
  - H2: 関連情報

## nodes/voicewake.md

- ルート: /nodes/voicewake
- 見出し:
  - H2: ストレージ
  - H2: プロトコル
  - H3: トリガーリスト
  - H3: ルーティング（トリガーからターゲットへ）
  - H3: イベント
  - H2: クライアントの動作
  - H2: 関連情報

## openclaw-agent-runtime.md

- ルート: /openclaw-agent-runtime
- 見出し:
  - H2: 型チェックとリント
  - H2: エージェントランタイムテストの実行
  - H2: 手動テスト
  - H2: 初期状態へのリセット
  - H2: 参考資料
  - H2: 関連情報

## perplexity.md

- ルート: /perplexity
- 見出し:
  - H2: 関連情報

## plan/cloud-workers.md

- ルート: /plan/cloud-workers
- 見出し:
  - H2: ステータス
  - H2: 問題
  - H2: 目標
  - H2: 対象外（v1）
  - H2: 先行事例（踏襲するものと反転するもの）
  - H2: アーキテクチャ決定: ワーカー上でループし、Gateway 経由で推論する
  - H2: コンポーネント
  - H3: 1. 環境ステートマシンとプロバイダー契約
  - H3: 2. ワーカーのブートストラップ: Box に OpenClaw をインストールする
  - H3: 3. トランスポート: すべて SSH 経由
  - H3: 4. ワーカープロトコル（専用。Node プロトコルではない）
  - H3: 5. セッションバックエンド RPC
  - H3: 6. ワークスペース同期
  - H3: 7. 配置ステートマシン、セッション、UI
  - H2: ディスパッチと引き継ぎ
  - H2: セキュリティモデル
  - H2: 容量
  - H2: ライフサイクル
  - H2: 設定サーフェス
  - H2: マイルストーン
  - H2: 未解決の課題

## plan/path3-sqlite-session-artifact-family.md

- ルート: /plan/path3-sqlite-session-artifact-family
- 見出し:
  - H1: パス 3 SQLite セッションアーティファクトファミリー
  - H2: 正式なファミリー
  - H2: 切り替え後にファミリーに含まれないアーティファクト
  - H2: パッチ箇所
  - H2: 対象を絞ったテスト

## plan/ui-channels.md

- ルート: /plan/ui-channels
- 見出し:
  - H2: ステータス
  - H2: 問題
  - H2: 目標
  - H2: 対象外
  - H2: ターゲットモデル
  - H2: 配信メタデータ
  - H2: ランタイム機能契約
  - H2: チャンネルマッピング
  - H2: リファクタリング手順
  - H2: テスト
  - H2: 未解決の課題
  - H2: 関連情報

## platforms/android.md

- ルート: /platforms/android
- 見出し:
  - H2: サポート状況
  - H2: Google Play を使用せずにインストールする
  - H2: リモート Mac から Android をミラーリングして操作する
  - H3: 始める前に
  - H3: TCP 経由の ADB を有効にする
  - H3: コントローラーの Mac のみを許可する
  - H3: 接続してミラーリングを開始する
  - H3: トラブルシューティング
  - H2: 接続手順
  - H3: 前提条件
  - H3: 1. Gateway を起動する
  - H3: 2. 検出を確認する（任意）
  - H4: ユニキャスト DNS-SD によるネットワーク間検出
  - H3: 3. Android から接続する
  - H3: 複数の Gateway
  - H3: プレゼンス生存ビーコン
  - H3: 4. ペアリングを承認する（CLI）
  - H3: 5. Node が接続されていることを確認する
  - H3: 6. チャットと履歴
  - H3: 7. キャンバスとカメラ
  - H4: Gateway キャンバスホスト（Web コンテンツに推奨）
  - H3: 8. 音声と拡張された Android コマンドサーフェス
  - H3: 9. ワークスペースファイル（読み取り専用）
  - H2: コマンド承認を確認する
  - H2: アシスタントのエントリーポイント
  - H2: 通知の転送
  - H2: 関連情報

## platforms/digitalocean.md

- ルート: /platforms/digitalocean
- 見出し:
  - H2: 関連情報

## platforms/easyrunner.md

- ルート: /platforms/easyrunner
- 見出し:
  - H2: 始める前に
  - H2: Compose アプリ
  - H2: OpenClaw を設定する
  - H2: 確認
  - H2: 更新とバックアップ
  - H2: トラブルシューティング

## platforms/index.md

- ルート: /platforms
- 見出し:
  - H2: OS を選択する
  - H2: VPS とホスティング
  - H2: 共通リンク
  - H2: Gateway サービスのインストール（CLI）
  - H2: 関連情報

## platforms/ios.md

- ルート: /platforms/ios
- 見出し:
  - H2: 機能
  - H2: 要件
  - H2: クイックスタート（ペアリングと接続）
  - H2: コマンド承認を確認する
  - H2: 任意の直接接続 Apple Watch Node
  - H2: 公式ビルド向けのリレー経由プッシュ
  - H2: バックグラウンド生存ビーコン
  - H2: 認証と信頼フロー
  - H2: 検出経路
  - H3: Bonjour（LAN）
  - H3: Tailnet（ネットワーク間）
  - H3: ホスト/ポートの手動指定
  - H2: 複数の Gateway
  - H2: キャンバスと A2UI
  - H2: コンピューター操作との関係
  - H3: キャンバスの評価 / スナップショット
  - H2: 音声ウェイクとトークモード
  - H2: 一般的なエラー
  - H2: 関連ドキュメント

## platforms/linux.md

- ルート: /platforms/linux
- 見出し:
  - H2: クイックパス（VPS）
  - H2: インストール
  - H2: Gateway サービス（systemd）
  - H2: メモリ負荷と OOM キル
  - H2: 関連項目

## platforms/mac/bundled-gateway.md

- ルート: /platforms/mac/bundled-gateway
- 見出し:
  - H2: 自動セットアップ
  - H2: 手動復旧
  - H2: Launchd（LaunchAgent としての Gateway）
  - H2: バージョン互換性
  - H2: macOS 上の状態ディレクトリ
  - H2: アプリの接続をデバッグする
  - H2: スモークチェック
  - H2: 関連項目

## platforms/mac/canvas.md

- ルート: /platforms/mac/canvas
- 見出し:
  - H2: Canvas の配置場所
  - H2: パネルの動作
  - H2: エージェント API サーフェス
  - H2: Canvas 内の A2UI
  - H3: A2UI コマンド（v0.8）
  - H2: Canvas からエージェント実行をトリガーする
  - H2: セキュリティに関する注意事項
  - H2: 関連項目

## platforms/mac/child-process.md

- ルート: /platforms/mac/child-process
- 見出し:
  - H2: デフォルトの動作（launchd）
  - H2: 署名されていない開発ビルド
  - H2: アタッチ専用モード
  - H2: リモートモード
  - H2: launchd を推奨する理由
  - H2: 関連項目

## platforms/mac/dev-setup.md

- ルート: /platforms/mac/dev-setup
- 見出し:
  - H1: macOS 開発者向けセットアップ
  - H2: 前提条件
  - H2: 1. 依存関係をインストールする
  - H2: 2. アプリをビルドしてパッケージ化する
  - H2: 3. CLI と Gateway をインストールする
  - H2: トラブルシューティング
  - H3: ビルド失敗：ツールチェーンまたは SDK の不一致
  - H3: 権限付与時にアプリがクラッシュする
  - H3: Gateway が「Starting...」のまま進まない
  - H2: 関連項目

## platforms/mac/health.md

- ルート: /platforms/mac/health
- 見出し:
  - H1: macOS でのヘルスチェック
  - H2: メニューバー
  - H2: 設定
  - H2: プローブの仕組み
  - H2: 判断に迷った場合
  - H2: 関連項目

## platforms/mac/icon.md

- ルート: /platforms/mac/icon
- 見出し:
  - H1: メニューバーアイコンの状態
  - H2: 状態
  - H2: 音声ウェイク用の耳
  - H2: 形状とサイズ
  - H2: 動作に関する注意事項
  - H2: 関連項目

## platforms/mac/logging.md

- ルート: /platforms/mac/logging
- 見出し:
  - H1: ロギング（macOS）
  - H2: ローテーション式診断ファイルログ（デバッグペイン）
  - H2: macOS の統合ログにおけるプライベートデータ
  - H2: OpenClaw（ai.openclaw）で有効にする
  - H2: デバッグ後に無効にする
  - H2: 関連項目

## platforms/mac/menu-bar.md

- ルート: /platforms/mac/menu-bar
- 見出し:
  - H2: 表示内容
  - H2: 状態モデル
  - H2: IconState 列挙型（Swift）
  - H3: ActivityKind -&gt; バッジ記号
  - H3: 視覚的なマッピング
  - H2: コンテキストサブメニュー
  - H2: ステータス行のテキスト（メニュー）
  - H2: イベントの取り込み
  - H2: デバッグ用オーバーライド
  - H2: テストチェックリスト
  - H2: 関連項目

## platforms/mac/peekaboo.md

- ルート: /platforms/mac/peekaboo
- 見出し:
  - H2: これは何か（そして何ではないか）
  - H2: 他のデスクトップ制御経路との関係
  - H2: ブリッジを有効にする
  - H2: クライアント検出順序
  - H2: セキュリティと権限
  - H2: スナップショットの動作（自動化）
  - H2: トラブルシューティング
  - H2: 関連項目

## platforms/mac/permissions.md

- ルート: /platforms/mac/permissions
- 見出し:
  - H2: 安定した権限に必要な条件
  - H2: Node および CLI ランタイムへのアクセシビリティ権限付与
  - H2: プロンプトが表示されなくなった場合の復旧チェックリスト
  - H2: ファイルとフォルダの権限（デスクトップ／書類／ダウンロード）
  - H2: 関連項目

## platforms/mac/remote.md

- ルート: /platforms/mac/remote
- 見出し:
  - H2: モード
  - H2: リモートトランスポート
  - H2: リモートホストの前提条件
  - H2: macOS アプリのセットアップ
  - H2: Web チャット
  - H2: 権限
  - H2: セキュリティに関する注意事項
  - H2: WhatsApp ログインフロー（リモート）
  - H2: トラブルシューティング
  - H2: 通知音
  - H2: 関連項目

## platforms/mac/signing.md

- ルート: /platforms/mac/signing
- 見出し:
  - H1: mac の署名（デバッグビルド）
  - H2: 使用方法
  - H3: アドホック署名に関する注意
  - H2: 「About」用のビルドメタデータ
  - H2: 関連項目

## platforms/mac/skills.md

- ルート: /platforms/mac/skills
- 見出し:
  - H2: データソース
  - H2: インストールアクション
  - H2: 環境変数／API キー
  - H2: リモートモード
  - H2: 関連項目

## platforms/mac/voice-overlay.md

- ルート: /platforms/mac/voice-overlay
- 見出し:
  - H1: 音声オーバーレイのライフサイクル（macOS）
  - H2: 動作
  - H2: 実装
  - H2: ロギング
  - H2: デバッグチェックリスト
  - H2: 関連項目

## platforms/mac/voicewake.md

- ルート: /platforms/mac/voicewake
- 見出し:
  - H1: 音声ウェイクとプッシュトゥトーク
  - H2: 要件
  - H2: モード
  - H2: ランタイムの動作（ウェイクワード）
  - H2: ライフサイクルの不変条件
  - H2: プッシュトゥトーク固有の詳細
  - H2: ユーザー向け設定
  - H2: 転送動作
  - H2: 転送ペイロード
  - H2: クイック検証
  - H2: 関連項目

## platforms/mac/webchat.md

- ルート: /platforms/mac/webchat
- 見出し:
  - H2: 起動とデバッグ
  - H2: 接続の仕組み
  - H2: セキュリティサーフェス
  - H2: 既知の制限事項
  - H2: 関連項目

## platforms/mac/xpc.md

- ルート: /platforms/mac/xpc
- 見出し:
  - H1: OpenClaw macOS IPC アーキテクチャ
  - H2: 目標
  - H2: 仕組み
  - H3: Gateway と Node のトランスポート
  - H3: Node サービスとアプリの IPC
  - H3: PeekabooBridge（UI 自動化）
  - H2: 運用フロー
  - H2: ハードニングに関する注意事項
  - H2: 関連項目

## platforms/macos.md

- ルート: /platforms/macos
- 見出し:
  - H2: ダウンロード
  - H2: 初回実行
  - H2: アップデート
  - H2: ダッシュボードのリンクを開く
  - H2: ブラウザのログイン情報をインポートする
  - H2: Gateway モードを選択する
  - H2: アプリが管理するもの
  - H2: macOS の詳細ページ
  - H2: 関連項目

## platforms/oracle.md

- ルート: /platforms/oracle
- 見出し:
  - H2: 関連項目

## platforms/raspberry-pi.md

- ルート: /platforms/raspberry-pi
- 見出し:
  - H2: 関連項目

## platforms/windows.md

- ルート: /platforms/windows
- 見出し:
  - H2: 推奨：Windows Hub
  - H3: Windows Hub に含まれるもの
  - H3: 初回起動
  - H2: Windows Node モード
  - H2: ローカル MCP モード
  - H2: ネイティブ Windows CLI と Gateway
  - H2: WSL2 Gateway
  - H2: Windows ログイン前の Gateway 自動起動
  - H2: WSL サービスを LAN 経由で公開する
  - H2: トラブルシューティング
  - H3: トレイアイコンが表示されない
  - H3: ローカルセットアップに失敗する
  - H3: アプリにペアリングが必要と表示される
  - H3: Web チャットからリモート Gateway に到達できない
  - H3: screen.snapshot、カメラ、または音声コマンドが失敗する
  - H3: Git または GitHub への接続に失敗する
  - H2: 関連項目

## plugins/adding-capabilities.md

- ルート: /plugins/adding-capabilities
- 見出し:
  - H2: ケイパビリティを作成するタイミング
  - H2: 標準的な手順
  - H2: 各要素の配置先
  - H2: プロバイダーとハーネスの接合部
  - H2: ファイルチェックリスト
  - H2: 実例：画像生成
  - H2: 埋め込みプロバイダー
  - H2: レビューチェックリスト
  - H2: 関連項目

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
  - H2: 関連項目

## plugins/agent-tools.md

- ルート: /plugins/agent-tools
- 見出し:
  - H2: 関連項目

## plugins/architecture-internals.md

- ルート: /plugins/architecture-internals
- 見出し:
  - H2: ロードパイプライン
  - H3: マニフェスト優先の動作
  - H3: Plugin キャッシュの境界
  - H2: レジストリモデル
  - H2: 会話バインディングのコールバック
  - H2: プロバイダーランタイムフック
  - H3: フックの順序と使用方法
  - H3: プロバイダーの例
  - H3: 組み込みの例
  - H2: ランタイムヘルパー
  - H3: api.runtime.imageGeneration
  - H2: Gateway HTTP ルート
  - H2: Plugin SDK のインポートパス
  - H2: メッセージツールスキーマ
  - H2: チャネルターゲットの解決
  - H2: 設定に基づくディレクトリ
  - H2: プロバイダーカタログ
  - H2: 読み取り専用のチャネル検査
  - H2: パッケージパック
  - H3: チャネルカタログのメタデータ
  - H2: コンテキストエンジン Plugin
  - H2: 新しいケイパビリティの追加
  - H3: ケイパビリティチェックリスト
  - H3: ケイパビリティテンプレート
  - H2: 関連項目

## plugins/architecture.md

- ルート: /plugins/architecture
- 見出し:
  - H2: 公開ケイパビリティモデル
  - H3: 外部互換性に対する方針
  - H3: Plugin の形態
  - H3: レガシーフック
  - H3: 互換性シグナル
  - H2: アーキテクチャ概要
  - H3: Plugin メタデータのスナップショットとルックアップテーブル
  - H3: アクティベーション計画
  - H3: チャネル Plugin と共有メッセージツール
  - H2: ケイパビリティの所有権モデル
  - H3: ケイパビリティのレイヤリング
  - H3: 複数ケイパビリティを持つ企業 Plugin の例
  - H3: ケイパビリティの例：動画理解
  - H2: コントラクトと適用
  - H3: コントラクトに含めるもの
  - H2: 実行モデル
  - H2: エクスポート境界
  - H2: 内部構造とリファレンス
  - H2: 関連項目

## plugins/building-extensions.md

- ルート: /plugins/building-extensions
- 見出し:
  - H2: 関連項目

## plugins/building-plugins.md

- ルート: /plugins/building-plugins
- 見出し:
  - H2: 要件
  - H2: Plugin の形態を選択する
  - H2: クイックスタート
  - H2: ツールの登録
  - H2: インポート規則
  - H2: 提出前チェックリスト
  - H2: ベータリリースに対してテストする
  - H2: 次のステップ
  - H2: 関連項目

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
  - H4: 埋め込み OpenClaw の設定
  - H4: 埋め込み OpenClaw LSP
  - H3: 検出されるが実行されないもの
  - H2: バンドル形式
  - H2: 検出の優先順位
  - H2: ランタイム依存関係とクリーンアップ
  - H2: セキュリティ
  - H2: トラブルシューティング
  - H2: 関連項目

## plugins/cli-backend-plugins.md

- ルート: /plugins/cli-backend-plugins
- 見出し:
  - H2: Plugin が所有するもの
  - H2: 最小構成のバックエンド Plugin
  - H2: 設定の形状
  - H2: 高度なバックエンドフック
  - H3: ownsNativeCompaction：OpenClaw の Compaction を使用しない
  - H2: MCP ツールブリッジ
  - H2: ユーザー設定
  - H2: 検証
  - H2: チェックリスト
  - H2: 関連項目

## plugins/codex-computer-use.md

- ルート: /plugins/codex-computer-use
- 見出し:
  - H2: OpenClaw.app と Peekaboo
  - H2: iOS アプリ
  - H2: cua-driver MCP の直接利用
  - H2: クイックセットアップ
  - H2: コマンド
  - H2: マーケットプレイスの選択肢
  - H2: 同梱の macOS マーケットプレイス
  - H3: 共有 Plugin キャッシュ
  - H2: リモートカタログの制限
  - H2: 設定リファレンス
  - H2: OpenClaw が確認する項目
  - H2: macOS の権限
  - H2: トラブルシューティング
  - H2: 関連項目

## plugins/codex-harness-reference.md

- ルート: /plugins/codex-harness-reference
- 見出し:
  - H2: Plugin 設定サーフェス
  - H2: 監督
  - H2: アプリサーバートランスポート
  - H2: 承認モードとサンドボックスモード
  - H2: サンドボックス化されたネイティブ実行
  - H2: 認証と環境の分離
  - H2: 動的ツール
  - H2: タイムアウト
  - H2: モデル検出
  - H2: ワークスペースのブートストラップファイル
  - H2: 環境オーバーライド
  - H2: 関連項目

## plugins/codex-harness-runtime.md

- ルート: /plugins/codex-harness-runtime
- 見出し:
  - H2: 概要
  - H2: スレッドのバインディングとモデル変更
  - H2: 監督と安全な継続
  - H2: 表示される返信と Heartbeat
  - H2: フックの境界
  - H2: V1 サポートコントラクト
  - H2: ネイティブ権限と MCP の入力要求
  - H2: キューの制御
  - H2: Codex フィードバックのアップロード
  - H2: Compaction とトランスクリプトのミラー
  - H2: メディアと配信
  - H2: 関連項目

## plugins/codex-harness.md

- ルート: /plugins/codex-harness
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: Codex Desktop および CLI とスレッドを共有する
  - H2: Codex セッションを監督する
  - H2: 設定
  - H3: Compaction
  - H2: Codex ランタイムを検証する
  - H2: ルーティングとモデル選択
  - H2: デプロイパターン
  - H3: 基本的な Codex デプロイ
  - H3: 混合プロバイダーデプロイ
  - H3: フェイルクローズ型 Codex デプロイ
  - H2: アプリサーバーポリシー
  - H2: コマンドと診断
  - H3: Codex スレッドをローカルで検査する
  - H3: 認証順序
  - H3: 環境の分離
  - H3: 動的ツールと Web 検索
  - H3: 設定フィールド
  - H3: 動的ツール呼び出しのタイムアウト
  - H3: ローカルテスト用の環境オーバーライド
  - H2: ネイティブ Codex Plugin
  - H2: コンピューター操作
  - H2: ランタイム境界
  - H2: トラブルシューティング
  - H2: 関連項目

## plugins/codex-native-plugins.md

- ルート: /plugins/codex-native-plugins
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: チャットからPluginを管理する
  - H2: ネイティブPluginのセットアップの仕組み
  - H2: V1のサポート範囲
  - H2: アプリのインベントリと所有権
  - H2: 接続済みアカウントのアプリ
  - H2: スレッドのアプリ設定
  - H2: 破壊的操作のポリシー
  - H2: トラブルシューティング
  - H2: 関連項目

## plugins/codex-supervision.md

- ルート: /plugins/codex-supervision
- 見出し:
  - H2: 始める前に
  - H2: 監督を有効にする
  - H2: オペレーターCLIを使用する
  - H2: ローカルセッションからブランチする
  - H2: ローカルセッションをアーカイブする
  - H2: ペアリング済みNodeの制限を理解する
  - H2: メタデータと権限
  - H3: 互換性ツール
  - H2: トラブルシューティング
  - H2: 関連項目

## plugins/community.md

- ルート: /plugins/community
- 見出し:
  - H2: Pluginを探す
  - H2: Pluginを公開する
  - H2: 関連項目

## plugins/compatibility.md

- ルート: /plugins/compatibility
- 見出し:
  - H2: 互換性レジストリ
  - H2: 非推奨化ポリシー
  - H2: 現在の互換性領域
  - H3: WhatsApp受信コールバックのフラットエイリアス
  - H3: WhatsApp受信許可フィールド
  - H2: Pluginインスペクターパッケージ
  - H3: メンテナー受け入れレーン
  - H2: リリースノート

## plugins/copilot.md

- ルート: /plugins/copilot
- 見出し:
  - H2: 要件
  - H2: インストール
  - H2: クイックスタート
  - H2: サポートされるプロバイダー
  - H2: BYOK
  - H2: 認証
  - H2: 設定サーフェス
  - H2: Compaction
  - H2: トランスクリプトのミラーリング
  - H2: 補足質問（/btw）
  - H2: Doctor
  - H2: 制限事項
  - H2: 権限とaskuser
  - H3: セッションレベルのGitHubトークン
  - H2: 関連項目

## plugins/dependency-resolution.md

- ルート: /plugins/dependency-resolution
- 見出し:
  - H2: 責任範囲の分担
  - H2: インストールルート
  - H2: ローカルPlugin
  - H2: 起動と再読み込み
  - H2: バンドル済みPlugin
  - H2: レガシー機能のクリーンアップ

## plugins/google-meet.md

- ルート: /plugins/google-meet
- 見出し:
  - H2: クイックスタート
  - H3: ミーティングを作成する
  - H3: 観察のみで参加する
  - H3: リアルタイムのセッション健全性
  - H2: ローカルGateway + Parallels Chrome
  - H3: 一般的な障害チェック
  - H2: インストールに関する注意事項
  - H2: トランスポート
  - H3: Chrome
  - H3: Twilio
  - H2: OAuthと事前チェック
  - H3: Google認証情報を作成する
  - H3: リフレッシュトークンを発行する
  - H3: doctorでOAuthを検証する
  - H3: 解決、事前チェック、アーティファクトの読み取り
  - H3: ライブスモークテスト
  - H3: 作成例
  - H2: 設定
  - H3: デフォルト
  - H3: オプションのオーバーライド
  - H2: ツール
  - H2: エージェントモードと双方向モード
  - H2: ライブテストのチェックリスト
  - H2: トラブルシューティング
  - H3: エージェントがGoogle Meetツールを認識できない
  - H3: 接続済みのGoogle Meet対応Nodeがない
  - H3: ブラウザーは開くがエージェントが参加できない
  - H3: ミーティングの作成に失敗する
  - H3: エージェントは参加するが発話しない
  - H3: Twilioのセットアップチェックに失敗する
  - H3: Twilio通話は開始するがミーティングに入らない
  - H2: 注意事項
  - H2: 関連項目

## plugins/hooks.md

- ルート: /plugins/hooks
- 見出し:
  - H2: クイックスタート
  - H2: フックカタログ
  - H3: チャンネルのペアリング要求
  - H2: ランタイムフックをデバッグする
  - H2: ツール呼び出しポリシー
  - H3: 実行環境フック
  - H3: ツール結果の永続化
  - H2: プロンプトとモデルのフック
  - H3: セッション拡張と次ターンへの注入
  - H2: メッセージフック
  - H2: インストールフック
  - H2: Gatewayのライフサイクル
  - H3: 安全な外部Cronプロジェクション
  - H2: 今後の非推奨化
  - H2: 関連項目

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
  - H2: ランタイム診断
  - H2: トラブルシューティング

## plugins/logbook.md

- ルート: /plugins/logbook
- 見出し:
  - H2: 始める前に
  - H2: クイックスタート
  - H2: 仕組み
  - H2: モデルとデータフロー
  - H2: 設定
  - H3: ビジョンモデルの選択
  - H2: ダッシュボードタブ
  - H2: Gatewayメソッド
  - H2: プライバシーに関する注意事項
  - H2: トラブルシューティング
  - H3: Logbookタブが表示されない
  - H3: キャプチャでエラーが報告される
  - H3: キャプチャは成功するがカードが表示されない
  - H2: 関連項目

## plugins/manage-plugins.md

- ルート: /plugins/manage-plugins
- 見出し:
  - H2: Control UIを使用する
  - H2: Pluginを一覧表示して検索する
  - H2: Pluginを有効化および無効化する
  - H2: Pluginをインストールする
  - H2: 再起動して調査する
  - H2: Pluginを更新する
  - H2: Pluginをアンインストールする
  - H2: ソースを選択する
  - H2: Pluginを公開する
  - H2: 関連項目

## plugins/manifest.md

- ルート: /plugins/manifest
- 見出し:
  - H2: このファイルの役割
  - H2: 最小構成の例
  - H2: 詳細な例
  - H2: トップレベルフィールドのリファレンス
  - H2: catalogリファレンス
  - H2: 生成プロバイダーのメタデータリファレンス
  - H2: ツールメタデータのリファレンス
  - H2: providerAuthChoicesリファレンス
  - H2: commandAliasesリファレンス
  - H2: activationリファレンス
  - H2: qaRunnersリファレンス
  - H2: setupリファレンス
  - H3: setup.providersリファレンス
  - H3: setupフィールド
  - H2: uiHintsリファレンス
  - H2: contractsリファレンス
  - H2: configContractsリファレンス
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
  - H3: OpenClawプロバイダーインデックス
  - H2: マニフェストとpackage.jsonの比較
  - H3: 検出に影響するpackage.jsonフィールド
  - H2: 検出の優先順位（Plugin IDの重複）
  - H2: JSON Schemaの要件
  - H2: 検証時の動作
  - H2: 注意事項
  - H2: 関連項目

## plugins/memory-lancedb.md

- ルート: /plugins/memory-lancedb
- 見出し:
  - H2: インストール
  - H2: クイックスタート
  - H2: 埋め込み設定
  - H3: 次元数
  - H2: Ollama埋め込み
  - H2: 想起とキャプチャの制限
  - H2: コマンド
  - H2: ストレージ
  - H2: ランタイム依存関係とプラットフォームサポート
  - H2: トラブルシューティング
  - H3: 入力長がコンテキスト長を超えている
  - H3: サポートされていない埋め込みモデル
  - H3: Pluginは読み込まれるがメモリが表示されない
  - H2: 関連項目

## plugins/memory-wiki.md

- ルート: /plugins/memory-wiki
- 見出し:
  - H2: Vaultモード
  - H2: Vaultのレイアウト
  - H2: Open Knowledge Formatのインポート
  - H2: 構造化された主張と証拠
  - H2: エージェント向けエンティティメタデータ
  - H2: コンパイルパイプライン
  - H2: ダッシュボードと健全性レポート
  - H2: 検索と取得
  - H2: エージェントツール
  - H2: プロンプトとコンテキストの動作
  - H2: 設定
  - H3: エージェントごとのVault
  - H3: 例: QMD + ブリッジモード
  - H2: CLI
  - H2: Obsidianのサポート
  - H2: 推奨ワークフロー
  - H2: 関連ドキュメント

## plugins/message-presentation.md

- ルート: /plugins/message-presentation
- 見出し:
  - H2: コントラクト
  - H2: プロデューサーの例
  - H2: レンダラーのコントラクト
  - H2: コアのレンダリングフロー
  - H2: フォールバック規則
  - H3: ボタン値のフォールバック表示
  - H2: プロバイダーのマッピング
  - H2: PresentationとInteractiveReplyの比較
  - H2: 配信先の固定
  - H2: Plugin作成者向けチェックリスト
  - H2: 関連ドキュメント

## plugins/oc-path.md

- ルート: /plugins/oc-path
- 見出し:
  - H2: 有効にする理由
  - H2: 実行される場所
  - H2: 有効化
  - H2: 依存関係
  - H2: 提供される機能
  - H2: 他のPluginとの関係
  - H2: 安全性
  - H2: 関連項目

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
  - H2: ツール呼び出しの前に承認を要求する
  - H2: 決定時の動作
  - H2: 承認プロンプトをルーティングする
  - H2: Codexネイティブ権限
  - H2: トラブルシューティング
  - H2: 関連項目

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
  - H2: Claude Sonnet 5

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

## plugins/reference/clawrouter.md

- ルート: /plugins/reference/clawrouter
- 見出し:
  - H1: ClawRouter Plugin
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

## plugins/reference/crabbox.md

- ルート: /plugins/reference/crabbox
- 見出し:
  - H1: Crabbox Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 設定

## plugins/reference/deepgram.md

- ルート: /plugins/reference/deepgram
- 見出し:
  - H1: Deepgram Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/deepinfra.md

- ルート: /plugins/reference/deepinfra
- 見出し:
  - H1: DeepInfra Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/deepseek.md

- ルート: /plugins/reference/deepseek
- 見出し:
  - H1: DeepSeek Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/diagnostics-otel.md

- ルート: /plugins/reference/diagnostics-otel
- 見出し:
  - H1: Diagnostics OpenTelemetry Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/diagnostics-prometheus.md

- ルート: /plugins/reference/diagnostics-prometheus
- 見出し:
  - H1: Diagnostics Prometheus Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/diffs-language-pack.md

- ルート: /plugins/reference/diffs-language-pack
- 見出し:
  - H1: Diffs Language Pack Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 追加された言語

## plugins/reference/diffs.md

- ルート: /plugins/reference/diffs
- 見出し:
  - H1: Diffs Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/discord.md

- ルート: /plugins/reference/discord
- 見出し:
  - H1: Discord Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/document-extract.md

- ルート: /plugins/reference/document-extract
- 見出し:
  - H1: Document Extract Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/duckduckgo.md

- ルート: /plugins/reference/duckduckgo
- 見出し:
  - H1: DuckDuckGo Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/elevenlabs.md

- ルート: /plugins/reference/elevenlabs
- 見出し:
  - H1: Elevenlabs Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/exa.md

- ルート: /plugins/reference/exa
- 見出し:
  - H1: Exa Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/fal.md

- ルート: /plugins/reference/fal
- 見出し:
  - H1: Fal Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/featherless.md

- ルート: /plugins/reference/featherless
- 見出し:
  - H1: Featherless Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/feishu.md

- ルート: /plugins/reference/feishu
- 見出し:
  - H1: Feishu Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/file-transfer.md

- ルート: /plugins/reference/file-transfer
- 見出し:
  - H1: File Transfer Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/firecrawl.md

- ルート: /plugins/reference/firecrawl
- 見出し:
  - H1: Firecrawl Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/fireworks.md

- ルート: /plugins/reference/fireworks
- 見出し:
  - H1: Fireworks Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/github-copilot.md

- ルート: /plugins/reference/github-copilot
- 見出し:
  - H1: GitHub Copilot Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/gmi.md

- ルート: /plugins/reference/gmi
- 見出し:
  - H1: Gmi Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/google-meet.md

- ルート: /plugins/reference/google-meet
- 見出し:
  - H1: Google Meet Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/google.md

- ルート: /plugins/reference/google
- 見出し:
  - H1: Google Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/googlechat.md

- ルート: /plugins/reference/googlechat
- 見出し:
  - H1: Google Chat Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/gradium.md

- ルート: /plugins/reference/gradium
- 見出し:
  - H1: Gradium Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/groq.md

- ルート: /plugins/reference/groq
- 見出し:
  - H1: Groq Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/huggingface.md

- ルート: /plugins/reference/huggingface
- 見出し:
  - H1: Hugging Face Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/imessage.md

- ルート: /plugins/reference/imessage
- 見出し:
  - H1: iMessage Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/inworld.md

- ルート: /plugins/reference/inworld
- 見出し:
  - H1: Inworld Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/irc.md

- ルート: /plugins/reference/irc
- 見出し:
  - H1: IRC Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/kilocode.md

- ルート: /plugins/reference/kilocode
- 見出し:
  - H1: Kilocode Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/kimi.md

- ルート: /plugins/reference/kimi
- 見出し:
  - H1: Kimi Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/line.md

- ルート: /plugins/reference/line
- 見出し:
  - H1: LINE Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/litellm.md

- ルート: /plugins/reference/litellm
- 見出し:
  - H1: LiteLLM Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/llama-cpp.md

- ルート: /plugins/reference/llama-cpp
- 見出し:
  - H1: Llama Cpp Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/llm-task.md

- ルート: /plugins/reference/llm-task
- 見出し:
  - H1: LLM Task Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/lmstudio.md

- ルート: /plugins/reference/lmstudio
- 見出し:
  - H1: LM Studio Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/lobster.md

- ルート: /plugins/reference/lobster
- 見出し:
  - H1: Lobster Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/logbook.md

- ルート: /plugins/reference/logbook
- 見出し:
  - H1: Logbook Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/longcat.md

- ルート: /plugins/reference/longcat
- 見出し:
  - H1: LongCat Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/matrix.md

- ルート: /plugins/reference/matrix
- 見出し:
  - H1: Matrix Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/mattermost.md

- ルート: /plugins/reference/mattermost
- 見出し:
  - H1: Mattermost Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/memory-core.md

- ルート: /plugins/reference/memory-core
- 見出し:
  - H1: Memory Core Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/memory-lancedb.md

- ルート: /plugins/reference/memory-lancedb
- 見出し:
  - H1: Memory Lancedb Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/memory-wiki.md

- ルート: /plugins/reference/memory-wiki
- 見出し:
  - H1: Memory Wiki Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/meta.md

- ルート: /plugins/reference/meta
- 見出し:
  - H1: Meta Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/microsoft-foundry.md

- ルート: /plugins/reference/microsoft-foundry
- 見出し:
  - H1: Microsoft Foundry Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 要件
  - H2: チャットモデル
  - H2: MAI画像生成
  - H2: トラブルシューティング

## plugins/reference/microsoft.md

- ルート: /plugins/reference/microsoft
- 見出し:
  - H1: Microsoft Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/migrate-claude.md

- ルート: /plugins/reference/migrate-claude
- 見出し:
  - H1: Migrate Claude Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/migrate-hermes.md

- ルート: /plugins/reference/migrate-hermes
- 見出し:
  - H1: Migrate Hermes Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/minimax.md

- ルート: /plugins/reference/minimax
- 見出し:
  - H1: MiniMax Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/mistral.md

- ルート: /plugins/reference/mistral
- 見出し:
  - H1: Mistral Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/moonshot.md

- ルート: /plugins/reference/moonshot
- 見出し:
  - H1: Moonshot Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/msteams.md

- ルート: /plugins/reference/msteams
- 見出し:
  - H1: Microsoft Teams Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/nextcloud-talk.md

- ルート: /plugins/reference/nextcloud-talk
- 見出し:
  - H1: Nextcloud Talk Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/nostr.md

- ルート: /plugins/reference/nostr
- 見出し:
  - H1: Nostr Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/novita.md

- ルート: /plugins/reference/novita
- 見出し:
  - H1: Novita Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/nvidia.md

- ルート: /plugins/reference/nvidia
- 見出し:
  - H1: NVIDIA Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/oc-path.md

- ルート: /plugins/reference/oc-path
- 見出し:
  - H1: Oc Path Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/ollama.md

- ルート: /plugins/reference/ollama
- 見出し:
  - H1: Ollama Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/open-prose.md

- ルート: /plugins/reference/open-prose
- 見出し:
  - H1: Open Prose Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/openai.md

- ルート: /plugins/reference/openai
- 見出し:
  - H1: OpenAI Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/opencode-go.md

- ルート: /plugins/reference/opencode-go
- 見出し:
  - H1: OpenCode Go Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/opencode.md

- ルート: /plugins/reference/opencode
- 見出し:
  - H1: OpenCode Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/openrouter.md

- ルート: /plugins/reference/openrouter
- 見出し:
  - H1: OpenRouter Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/openshell.md

- ルート: /plugins/reference/openshell
- 見出し:
  - H1: Openshell Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/perplexity.md

- ルート: /plugins/reference/perplexity
- 見出し:
  - H1: Perplexity Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/pixverse.md

- ルート: /plugins/reference/pixverse
- 見出し:
  - H1: PixVerse Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/policy.md

- ルート: /plugins/reference/policy
- 見出し:
  - H1: Policy Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 動作
  - H2: 関連ドキュメント

## plugins/reference/qa-channel.md

- ルート: /plugins/reference/qa-channel
- 見出し:
  - H1: QA Channel Plugin
  - H2: 配布
  - H2: 提供機能
  - H2: 関連ドキュメント

## plugins/reference/qa-lab.md

- ルート: /plugins/reference/qa-lab
- 見出し:
  - H1: QA Lab Plugin
  - H2: 配布
  - H2: 提供機能

## plugins/reference/qa-matrix.md

- ルート: /plugins/reference/qa-matrix
- 見出し:
  - H1: QA Matrix Plugin
  - H2: 配布
  - H2: 提供機能

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
  - H1: SMS Plugin
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

## plugins/reference/vault.md

- ルート: /plugins/reference/vault
- 見出し:
  - H1: Vault Plugin
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
  - H1: 音声通話Plugin
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
  - H1: Web可読性Plugin
  - H2: 配布
  - H2: サーフェス

## plugins/reference/webhooks.md

- ルート: /plugins/reference/webhooks
- 見出し:
  - H1: Webhook Plugin
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

## plugins/reference/workspaces.md

- ルート: /plugins/reference/workspaces
- 見出し:
  - H1: ワークスペースPlugin
  - H2: 配布
  - H2: サーフェス

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
  - H2: ハーネスを使用する場合
  - H2: 引き続きコアが所有するもの
  - H3: ハーネス所有の認証ブートストラップ
  - H3: 検証済みセットアップランタイムアーティファクト
  - H3: リクエストトランスポート契約
  - H2: ハーネスを登録する
  - H3: 委任実行
  - H2: 選択ポリシー
  - H2: プロバイダーとハーネスの組み合わせ
  - H3: ツール結果ミドルウェア
  - H3: ターミナル結果の分類
  - H3: エージェント終了時の副作用
  - H3: ユーザー入力とツールサーフェス
  - H3: ネイティブCodexハーネスモード
  - H2: ランタイムの厳密性
  - H2: ネイティブセッションとトランスクリプトミラー
  - H2: ツールとメディアの結果
  - H2: 現在の制限事項
  - H2: 関連項目

## plugins/sdk-channel-inbound.md

- ルート: /plugins/sdk-channel-inbound
- 見出し:
  - H2: コアヘルパー
  - H2: 移行

## plugins/sdk-channel-ingress.md

- ルート: /plugins/sdk-channel-ingress
- 見出し:
  - H2: ランタイムリゾルバー
  - H2: 結果
  - H2: アクセスグループ
  - H2: イベントモード
  - H2: ルートと有効化
  - H2: 墨消し
  - H2: 検証

## plugins/sdk-channel-message.md

- ルート: /plugins/sdk-channel-message
- 見出し: なし

## plugins/sdk-channel-outbound.md

- ルート: /plugins/sdk-channel-outbound
- 見出し:
  - H2: アダプター
  - H2: プレーンテキストのサニタイズ
  - H2: 配信エビデンス
  - H2: 既存の送信アダプター
  - H2: 永続的な送信
  - H2: 遅延配信の受け入れ
  - H2: 互換性ディスパッチ

## plugins/sdk-channel-plugins.md

- ルート: /plugins/sdk-channel-plugins
- 見出し:
  - H2: Pluginが所有するもの
  - H2: メッセージアダプター
  - H3: 受信イングレス（実験的）
  - H3: 入力中インジケーター
  - H3: メディアソースパラメーター
  - H3: ネイティブペイロードの整形
  - H3: セッション会話文法
  - H3: アカウントスコープの会話バインディング対応
  - H2: 承認とチャネル機能
  - H3: 承認認証
  - H3: ペイロードのライフサイクルとセットアップガイダンス
  - H3: ネイティブ承認配信
  - H3: より限定的な承認ランタイムサブパス
  - H3: セットアップサブパス
  - H3: その他の限定的なチャネルサブパス
  - H2: 受信メンションポリシー
  - H2: チュートリアル
  - H2: ファイル構造
  - H2: 高度なトピック
  - H2: 次のステップ
  - H2: 関連項目

## plugins/sdk-channel-turn.md

- ルート: /plugins/sdk-channel-turn
- 見出し: なし

## plugins/sdk-entrypoints.md

- ルート: /plugins/sdk-entrypoints
- 見出し:
  - H2: パッケージエントリ
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: 登録モード
  - H2: Pluginの形式
  - H2: 関連項目

## plugins/sdk-migration.md

- ルート: /plugins/sdk-migration
- 見出し:
  - H2: 変更点
  - H3: 理由
  - H2: 互換性ポリシー
  - H2: 移行方法
  - H2: インポートパスリファレンス
  - H2: 現在の非推奨項目
  - H2: トークとリアルタイム音声の移行
  - H2: 削除予定
  - H2: 警告を一時的に抑制する
  - H2: 関連項目

## plugins/sdk-overview.md

- ルート: /plugins/sdk-overview
- 見出し:
  - H2: インポート規約
  - H2: サブパスリファレンス
  - H2: 登録API
  - H3: 機能の登録
  - H3: ツールとコマンド
  - H3: インフラストラクチャ
  - H3: ワークフローPlugin用ホストフック
  - H3: Gateway検出の登録
  - H3: CLI登録メタデータ
  - H3: CLIバックエンドの登録
  - H3: 排他スロット
  - H3: 非推奨のメモリ埋め込みアダプター
  - H3: イベントとライフサイクル
  - H3: フック決定のセマンティクス
  - H3: APIオブジェクトのフィールド
  - H2: 内部モジュール規約
  - H2: 関連項目

## plugins/sdk-provider-plugins.md

- ルート: /plugins/sdk-provider-plugins
- 見出し:
  - H2: チュートリアル
  - H2: ClawHubに公開する
  - H2: ファイル構造
  - H2: カタログ順序リファレンス
  - H2: 次のステップ
  - H2: 関連項目

## plugins/sdk-runtime.md

- ルート: /plugins/sdk-runtime
- 見出し:
  - H2: 設定の読み込みと書き込み
  - H2: 再利用可能なランタイムユーティリティ
  - H2: ランタイム名前空間
  - H2: ランタイム参照の保存
  - H2: その他のトップレベルAPIフィールド
  - H2: 関連項目

## plugins/sdk-setup.md

- ルート: /plugins/sdk-setup
- 見出し:
  - H2: パッケージメタデータ
  - H3: openclawフィールド
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: 完全読み込みの遅延
  - H2: Pluginマニフェスト
  - H2: ClawHubへの公開
  - H2: セットアップエントリ
  - H3: 限定的なセットアップヘルパーのインポート
  - H3: チャネル所有の単一アカウント昇格
  - H2: 設定スキーマ
  - H3: チャネル設定スキーマの構築
  - H2: セットアップウィザード
  - H2: 公開とインストール
  - H2: 関連項目

## plugins/sdk-subpaths.md

- ルート: /plugins/sdk-subpaths
- 見出し:
  - H2: Pluginエントリ
  - H3: 非推奨の互換性ヘルパーとテストヘルパー
  - H3: 予約済みバンドルPluginヘルパーサブパス
  - H2: 関連項目

## plugins/sdk-testing.md

- ルート: /plugins/sdk-testing
- 見出し:
  - H2: テストユーティリティ
  - H3: 利用可能なエクスポート
  - H3: 型
  - H2: ターゲット解決のテスト
  - H2: テストパターン
  - H3: 登録契約のテスト
  - H3: ランタイム設定アクセスのテスト
  - H3: チャネルPluginの単体テスト
  - H3: プロバイダーPluginの単体テスト
  - H3: Pluginランタイムのモック
  - H3: インスタンス単位のスタブを使用したテスト
  - H2: 契約テスト（リポジトリ内Plugin）
  - H3: スコープ指定テストの実行
  - H2: lintの適用（リポジトリ内Plugin）
  - H2: テスト設定
  - H2: 関連項目

## plugins/tool-plugins.md

- ルート: /plugins/tool-plugins
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: ツールを作成する
  - H2: オプションツールとファクトリーツール
  - H2: 戻り値
  - H2: 設定
  - H2: 生成されたメタデータ
  - H2: パッケージメタデータ
  - H2: CI で検証する
  - H2: ローカルでインストールして確認する
  - H2: 公開する
  - H2: トラブルシューティング
  - H3: Plugin のエントリが見つかりません: ./dist/index.js
  - H3: Plugin のエントリが defineToolPlugin メタデータを公開していません
  - H3: openclaw.plugin.json の生成済みメタデータが古くなっています
  - H3: package.json の openclaw.extensions に ./dist/index.js を含める必要があります
  - H3: パッケージ 'typebox' が見つかりません
  - H3: インストール後にツールが表示されません
  - H2: 関連項目

## plugins/vault.md

- ルート: /plugins/vault
- 見出し:
  - H1: Vault SecretRef
  - H2: 始める前に
  - H2: プロバイダーキーを Vault に保存する
  - H2: Gateway から Vault を参照できるようにする
  - H2: SecretRef プランを生成して適用する
  - H2: 追加のプロバイダーキーを設定する
  - H2: SecretRef ID の形式
  - H2: OpenClaw が保存する内容
  - H2: コンテナとマネージドデプロイ
  - H2: 関連項目

## plugins/voice-call.md

- ルート: /plugins/voice-call
- 見出し:
  - H2: クイックスタート
  - H2: 設定
  - H3: 設定リファレンス
  - H2: セッションのスコープ
  - H2: リアルタイム音声会話
  - H3: ツールポリシー
  - H3: エージェントの音声コンテキスト
  - H3: リアルタイムプロバイダーの例
  - H2: ストリーミング文字起こし
  - H3: ストリーミングプロバイダーの例
  - H2: 通話用 TTS
  - H3: TTS の例
  - H2: 着信通話
  - H3: 電話番号ごとのルーティング
  - H3: 音声出力の契約
  - H3: 会話開始時の動作
  - H3: Twilio ストリーム切断時の猶予期間
  - H2: 古い通話のリーパー
  - H2: Webhook のセキュリティ
  - H2: CLI
  - H2: エージェントツール
  - H2: Gateway RPC
  - H2: トラブルシューティング
  - H3: セットアップ時に Webhook の公開に失敗する
  - H3: プロバイダーの認証情報が機能しない
  - H3: 通話は開始するがプロバイダーの Webhook が届かない
  - H3: 署名の検証に失敗する
  - H3: Google Meet への Twilio の参加に失敗する
  - H3: リアルタイム通話で音声が再生されない
  - H2: 関連項目

## plugins/webhooks.md

- ルート: /plugins/webhooks
- 見出し:
  - H2: ルートを設定する
  - H2: セキュリティモデル
  - H2: リクエスト形式
  - H2: サポートされるアクション
  - H3: createflow
  - H3: runtask
  - H2: レスポンスの形式
  - H2: 関連項目

## plugins/workboard.md

- ルート: /plugins/workboard
- 見出し:
  - H2: 有効にする
  - H2: 設定
  - H2: カードのフィールド
  - H2: カードから作業を開始する
  - H2: エージェントツール
  - H2: ディスパッチ
  - H3: ワーカーの選択
  - H3: エントリポイント
  - H2: CLI とスラッシュコマンド
  - H2: セッションライフサイクルの同期
  - H2: ダッシュボードのワークフロー
  - H2: 診断
  - H2: 権限
  - H2: ストレージ
  - H2: トラブルシューティング
  - H2: 関連項目

## plugins/zalouser.md

- ルート: /plugins/zalouser
- 見出し:
  - H2: 命名
  - H2: 実行場所
  - H2: インストール
  - H3: npm から
  - H3: ローカルフォルダーから（開発用）
  - H2: 設定
  - H2: CLI
  - H2: エージェントツール
  - H2: 関連項目

## prose.md

- ルート: /prose
- 見出し:
  - H2: インストール
  - H2: スラッシュコマンド
  - H2: できること
  - H2: 例: 並列調査と統合
  - H2: OpenClaw ランタイムへのマッピング
  - H2: ファイルの場所
  - H2: 状態バックエンド
  - H2: セキュリティ
  - H2: 関連項目

## providers/alibaba.md

- ルート: /providers/alibaba
- 見出し:
  - H2: はじめに
  - H2: 組み込みの Wan モデル
  - H2: 機能と制限
  - H2: 高度な設定
  - H2: 関連項目

## providers/anthropic.md

- ルート: /providers/anthropic
- 見出し:
  - H2: 使用量とコストの追跡
  - H2: はじめに
  - H2: 複数のコンピューターにまたがる Claude セッション
  - H2: 思考のデフォルト（Claude Sonnet 5、Mythos 5、Fable 5、4.8、4.6）
  - H2: 安全性による拒否時のフォールバック（Claude Fable 5）
  - H3: これが存在する理由
  - H3: 仕組み
  - H3: オブザーバビリティと課金
  - H3: スコープ
  - H2: プロンプトキャッシュ
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/arcee.md

- ルート: /providers/arcee
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H2: 非対話型セットアップ
  - H2: 組み込みカタログ
  - H2: サポートされる機能
  - H2: 関連項目

## providers/azure-speech.md

- ルート: /providers/azure-speech
- 見出し:
  - H2: はじめに
  - H2: 設定オプション
  - H2: 注意事項
  - H2: 関連項目

## providers/bedrock-mantle.md

- ルート: /providers/bedrock-mantle
- 見出し:
  - H2: はじめに
  - H2: モデルの自動検出
  - H3: サポートされるリージョン
  - H2: 手動設定
  - H2: 高度な設定
  - H2: 関連項目

## providers/bedrock.md

- ルート: /providers/bedrock
- 見出し:
  - H2: はじめに
  - H2: モデルの自動検出
  - H2: クイックセットアップ（AWS の手順）
  - H2: 高度な設定
  - H2: 関連項目

## providers/cerebras.md

- ルート: /providers/cerebras
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H2: 非対話型セットアップ
  - H2: 組み込みカタログ
  - H2: 手動設定
  - H2: 関連項目

## providers/chutes.md

- ルート: /providers/chutes
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H2: 検出時の動作
  - H2: デフォルトのエイリアス
  - H2: 組み込みのスターターカタログ
  - H2: 設定例
  - H2: 関連項目

## providers/claude-max-api-proxy.md

- ルート: /providers/claude-max-api-proxy
- 見出し:
  - H2: 使用する理由
  - H2: 仕組み
  - H2: はじめに
  - H2: 高度な設定
  - H2: 注意事項
  - H2: 関連項目

## providers/clawrouter.md

- ルート: /providers/clawrouter
- 見出し:
  - H2: はじめに
  - H2: マネージド非対話型デプロイ
  - H2: 準備状態とライブ検証
  - H2: モデルの検出
  - H2: プロトコルとプロバイダー Plugin
  - H2: クォータと使用量
  - H2: トラブルシューティング
  - H2: セキュリティ上の動作
  - H2: 関連項目

## providers/cloudflare-ai-gateway.md

- ルート: /providers/cloudflare-ai-gateway
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H2: 非対話型の例
  - H2: 高度な設定
  - H2: 関連項目

## providers/cohere.md

- ルート: /providers/cohere
- 見出し:
  - H2: 組み込みカタログ
  - H2: はじめに
  - H2: 環境変数のみを使用したセットアップ
  - H2: 関連項目

## providers/comfy.md

- ルート: /providers/comfy
- 見出し:
  - H2: サポートされる内容
  - H2: はじめに
  - H2: 設定
  - H3: 共有キー
  - H3: 機能ごとのキー
  - H2: ワークフローの詳細
  - H2: 関連項目

## providers/deepgram.md

- ルート: /providers/deepgram
- 見出し:
  - H2: はじめに
  - H2: 設定オプション
  - H2: 音声通話のストリーミング STT
  - H2: 注意事項
  - H2: 関連項目

## providers/deepinfra.md

- ルート: /providers/deepinfra
- 見出し:
  - H2: Plugin をインストールする
  - H2: API キーを取得する
  - H2: CLI セットアップ
  - H2: 設定スニペット
  - H2: サポートされるインターフェース
  - H2: 利用可能なモデル
  - H2: 注意事項
  - H2: 関連項目

## providers/deepseek.md

- ルート: /providers/deepseek
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H2: 組み込みカタログ
  - H2: 思考とツール
  - H2: ライブテスト
  - H2: 設定例
  - H2: 関連項目

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
  - H2: 関連項目

## providers/elevenlabs.md

- ルート: /providers/elevenlabs
- 見出し:
  - H2: 認証
  - H2: テキスト読み上げ
  - H2: 音声認識
  - H2: ストリーミング STT
  - H2: 関連項目

## providers/fal.md

- ルート: /providers/fal
- 見出し:
  - H2: はじめに
  - H2: 画像生成
  - H2: 動画生成
  - H2: 音楽生成
  - H2: 関連項目

## providers/featherless.md

- ルート: /providers/featherless
- 見出し:
  - H2: セットアップ
  - H2: デフォルトモデル
  - H2: その他の Featherless モデル
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/fireworks.md

- ルート: /providers/fireworks
- 見出し:
  - H2: はじめに
  - H2: 非対話型セットアップ
  - H2: 組み込みカタログ
  - H2: カスタム Fireworks モデル ID
  - H2: 関連項目

## providers/github-copilot.md

- ルート: /providers/github-copilot
- 見出し:
  - H2: OpenClaw で Copilot を使用する 3 つの方法
  - H2: GitHub Enterprise（データレジデンシー）
  - H2: オプションのフラグ
  - H2: 非対話型オンボーディング
  - H2: メモリ検索の埋め込み
  - H3: 設定
  - H3: 仕組み
  - H2: 関連項目

## providers/gmi.md

- ルート: /providers/gmi
- 見出し:
  - H2: セットアップ
  - H2: GMI を選ぶ場合
  - H2: モデル
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/google.md

- ルート: /providers/google
- 見出し:
  - H2: はじめに
  - H2: 機能
  - H2: ウェブ検索
  - H2: 画像生成
  - H2: 動画生成
  - H2: 音楽生成
  - H2: テキスト読み上げ
  - H2: リアルタイム音声
  - H2: 高度な設定
  - H2: 関連項目

## providers/gradium.md

- ルート: /providers/gradium
- 見出し:
  - H2: Plugin をインストールする
  - H2: セットアップ
  - H2: 設定
  - H2: 音声
  - H3: メッセージごとの音声オーバーライド
  - H2: 出力
  - H2: 自動選択の順序
  - H2: 関連項目

## providers/groq.md

- ルート: /providers/groq
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H3: 設定ファイルの例
  - H2: 組み込みカタログ
  - H2: 推論モデル
  - H2: 音声文字起こし
  - H2: 関連項目

## providers/huggingface.md

- ルート: /providers/huggingface
- 見出し:
  - H2: はじめに
  - H3: 非対話型セットアップ
  - H2: モデル ID
  - H2: 高度な設定
  - H2: 関連項目

## providers/index.md

- ルート: /providers
- 見出し:
  - H2: クイックスタート
  - H2: プロバイダーのドキュメント
  - H2: 共通の概要ページ
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
  - H2: 関連項目

## providers/inworld.md

- ルート: /providers/inworld
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H2: 設定オプション
  - H2: 注意事項
  - H2: 関連項目

## providers/kilocode.md

- ルート: /providers/kilocode
- 見出し:
  - H2: Plugin をインストールする
  - H2: セットアップ
  - H2: デフォルトモデルとカタログ
  - H2: 設定例
  - H2: 動作に関する注意事項
  - H2: 関連項目

## providers/litellm.md

- ルート: /providers/litellm
- 見出し:
  - H2: クイックスタート
  - H2: 設定
  - H2: 画像生成
  - H2: 高度な設定
  - H2: 関連項目

## providers/lmstudio.md

- ルート: /providers/lmstudio
- 見出し:
  - H2: クイックスタート
  - H2: 非対話型オンボーディング
  - H2: 設定
  - H3: ストリーミング使用量の互換性
  - H3: 思考の互換性
  - H3: 明示的な設定
  - H3: プリロードの無効化
  - H3: LAN または tailnet ホスト
  - H2: トラブルシューティング
  - H3: LM Studio が検出されない
  - H3: 認証エラー（HTTP 401）
  - H2: 関連項目

## providers/longcat.md

- ルート: /providers/longcat
- 見出し:
  - H2: Plugin をインストールする
  - H2: はじめに
  - H3: 非対話型セットアップ
  - H2: 推論時の動作
  - H2: 料金
  - H2: セルフホスト型 LongCat-2.0
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/meta.md

- ルート: /providers/meta
- 見出し:
  - H2: はじめに
  - H2: 非対話型セットアップ
  - H2: 組み込みカタログ
  - H2: 手動設定
  - H2: スモークテスト
  - H2: 関連項目

## providers/minimax.md

- ルート: /providers/minimax
- 見出し:
  - H2: 組み込みカタログ
  - H2: はじめに
  - H2: openclaw configure で設定する
  - H2: 機能
  - H3: 画像生成
  - H3: テキスト読み上げ
  - H3: 音楽生成
  - H3: 動画生成
  - H3: 画像理解
  - H3: ウェブ検索
  - H2: 高度な設定
  - H2: 注意事項
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/mistral.md

- ルート: /providers/mistral
- 見出し:
  - H2: はじめに
  - H2: 組み込み LLM カタログ
  - H2: 音声文字起こし（Voxtral）
  - H2: 音声通話のストリーミング STT
  - H2: 高度な設定
  - H2: 関連項目

## providers/models.md

- ルート: /providers/models
- 見出し:
  - H2: クイックスタート（2 ステップ）
  - H2: サポートされるプロバイダー（スターターセット）
  - H2: その他のプロバイダーバリアント
  - H2: 関連項目

## providers/moonshot.md

- ルート: /providers/moonshot
- 見出し:
  - H2: 組み込みモデルカタログ
  - H2: はじめに
  - H2: Kimi Web 検索
  - H2: 高度な設定
  - H2: 関連項目

## providers/novita.md

- ルート: /providers/novita
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: バンドル済みモデルカタログ
  - H2: Novita を選ぶ場合
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/nvidia.md

- ルート: /providers/nvidia
- 見出し:
  - H2: はじめに
  - H2: 設定例
  - H2: 注目のカタログ
  - H2: Nemotron 3 Ultra
  - H2: バンドル済みフォールバックカタログ
  - H2: 高度な設定
  - H2: 関連項目

## providers/ollama-cloud.md

- ルート: /providers/ollama-cloud
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: Ollama Cloud を選ぶ場合
  - H2: モデル
  - H2: ライブテスト
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/ollama.md

- ルート: /providers/ollama
- 見出し:
  - H2: 認証ルール
  - H2: はじめに
  - H2: ローカルホスト経由のクラウドモデル
  - H2: モデル検出（暗黙的プロバイダー）
  - H3: スモークテスト
  - H2: Node ローカル推論
  - H2: ビジョンと画像説明
  - H2: 設定
  - H2: よく使うレシピ
  - H3: モデルの選択
  - H3: クイック検証
  - H2: Ollama Web 検索
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/openai.md

- ルート: /providers/openai
- 見出し:
  - H2: 使用量とコストの追跡
  - H2: クイック選択
  - H2: 名前の対応表
  - H2: 暗黙的エージェントランタイム
  - H2: GPT-5.6 限定プレビュー
  - H2: OpenClaw の機能対応範囲
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
  - H3: リージョン別の提供状況
  - H3: パラメーターの違い
  - H2: 高度な設定
  - H2: 関連項目

## providers/opencode-go.md

- ルート: /providers/opencode-go
- 見出し:
  - H2: はじめに
  - H2: 設定例
  - H2: 組み込みカタログ
  - H2: 高度な設定
  - H2: 関連項目

## providers/opencode.md

- ルート: /providers/opencode
- 見出し:
  - H2: はじめに
  - H2: 設定例
  - H2: 組み込みカタログ
  - H3: Zen
  - H3: Go
  - H2: 高度な設定
  - H2: 関連項目

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
  - H2: Fusion ルーター
  - H2: 認証とヘッダー
  - H2: 高度な設定
  - H2: 関連項目

## providers/perplexity-provider.md

- ルート: /providers/perplexity-provider
- 見出し:
  - H2: Plugin のインストール
  - H2: はじめに
  - H2: 検索モード
  - H2: ネイティブ API フィルタリング
  - H2: 高度な設定
  - H2: 関連項目

## providers/pixverse.md

- ルート: /providers/pixverse
- 見出し:
  - H2: はじめに
  - H2: 対応するモードとモデル
  - H2: プロバイダーオプション
  - H2: 設定
  - H2: 高度な設定
  - H2: 関連項目

## providers/qianfan.md

- ルート: /providers/qianfan
- 見出し:
  - H2: Plugin のインストール
  - H2: はじめに
  - H2: 組み込みカタログ
  - H2: 設定例
  - H2: 関連項目

## providers/qwen-oauth.md

- ルート: /providers/qwen-oauth
- 見出し:
  - H2: セットアップ
  - H2: デフォルト
  - H2: Qwen との違い
  - H2: モデル
  - H2: 移行
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/qwen.md

- ルート: /providers/qwen
- 見出し:
  - H2: Plugin のインストール
  - H2: はじめに
  - H2: プランの種類とエンドポイント
  - H2: 組み込みカタログ
  - H3: Token Plan カタログ
  - H2: 思考制御
  - H2: マルチモーダルアドオン
  - H2: 高度な設定
  - H2: 関連項目

## providers/runway.md

- ルート: /providers/runway
- 見出し:
  - H2: はじめに
  - H2: 対応するモードとモデル
  - H2: 設定
  - H2: 高度な設定
  - H2: 関連項目

## providers/senseaudio.md

- ルート: /providers/senseaudio
- 見出し:
  - H2: はじめに
  - H2: オプション
  - H2: 関連項目

## providers/sglang.md

- ルート: /providers/sglang
- 見出し:
  - H2: はじめに
  - H2: モデル検出（暗黙的プロバイダー）
  - H2: 明示的な設定（手動モデル）
  - H2: 高度な設定
  - H2: 関連項目

## providers/stepfun.md

- ルート: /providers/stepfun
- 見出し:
  - H2: Plugin のインストール
  - H2: リージョンとエンドポイントの概要
  - H2: 組み込みカタログ
  - H2: はじめに
  - H2: 高度な設定
  - H2: 関連項目

## providers/synthetic.md

- ルート: /providers/synthetic
- 見出し:
  - H2: はじめに
  - H2: 設定例
  - H2: 組み込みカタログ
  - H2: 関連項目

## providers/tencent.md

- ルート: /providers/tencent
- 見出し:
  - H2: クイックスタート
  - H2: 非対話型セットアップ
  - H2: 組み込みカタログ
  - H2: 高度な設定
  - H2: 関連項目

## providers/together.md

- ルート: /providers/together
- 見出し:
  - H2: はじめに
  - H3: 非対話型の例
  - H2: 組み込みカタログ
  - H2: 動画生成
  - H2: 関連項目

## providers/venice.md

- ルート: /providers/venice
- 見出し:
  - H2: プライバシーモード
  - H2: はじめに
  - H2: モデルの選択
  - H2: 組み込みカタログ（38 モデル）
  - H2: モデル検出
  - H2: DeepSeek V4 のリプレイ動作
  - H2: ストリーミングとツール対応
  - H2: 料金
  - H2: 使用例
  - H2: トラブルシューティング
  - H2: 高度な設定
  - H2: 関連項目

## providers/vercel-ai-gateway.md

- ルート: /providers/vercel-ai-gateway
- 見出し:
  - H2: はじめに
  - H2: 非対話型の例
  - H2: モデル ID の短縮表記
  - H2: 高度な設定
  - H2: 関連項目

## providers/vllm.md

- ルート: /providers/vllm
- 見出し:
  - H2: はじめに
  - H2: モデル検出（暗黙的プロバイダー）
  - H2: 明示的な設定
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連項目

## providers/volcengine.md

- ルート: /providers/volcengine
- 見出し:
  - H2: はじめに
  - H2: プロバイダーとエンドポイント
  - H2: 組み込みカタログ
  - H2: テキスト読み上げ
  - H2: 高度な設定
  - H2: 関連項目

## providers/vydra.md

- ルート: /providers/vydra
- 見出し:
  - H2: セットアップ
  - H2: 機能
  - H2: 関連項目

## providers/xai.md

- ルート: /providers/xai
- 見出し:
  - H2: セットアップ
  - H2: OAuth のトラブルシューティング
  - H2: 組み込みカタログ
  - H2: 機能対応範囲
  - H3: 従来の高速モードとの互換性
  - H3: 従来の互換性と移動するエイリアス
  - H2: 機能
  - H2: ライブテスト
  - H2: 関連項目

## providers/xiaomi.md

- ルート: /providers/xiaomi
- 見出し:
  - H2: はじめに
  - H2: 従量課金カタログ
  - H2: Token Plan カタログ
  - H2: 推論モデル
  - H2: テキスト読み上げ
  - H2: 設定例
  - H2: 関連項目

## providers/zai.md

- ルート: /providers/zai
- 見出し:
  - H2: GLM モデル
  - H2: はじめに
  - H3: エンドポイント
  - H2: 設定例
  - H2: 組み込みカタログ
  - H2: 思考レベル
  - H2: 高度な設定
  - H2: 関連項目

## refactor/acp.md

- ルート: /refactor/acp
- 見出し:
  - H2: 目標
  - H2: 対象外
  - H2: 目標モデル
  - H3: Gateway インスタンスの識別情報
  - H3: ACP セッションの所有権
  - H3: ACPX プロセスリース
  - H2: ライフサイクルコントローラー
  - H2: ラッパーの契約
  - H2: セッション可視性の契約
  - H2: 移行計画
  - H3: フェーズ 1: 識別情報とリースの追加
  - H3: フェーズ 2: リース優先のクリーンアップ
  - H3: フェーズ 3: リース優先の起動時回収
  - H3: フェーズ 4: セッション所有権の行
  - H3: フェーズ 5: 従来のヒューリスティックの削除
  - H2: テスト
  - H2: 互換性に関する注意事項
  - H2: 成功基準

## refactor/canvas.md

- ルート: /refactor/canvas
- 見出し:
  - H1: Canvas Plugin のリファクタリング
  - H2: 目標
  - H2: 対象外
  - H2: 現在のブランチの状態
  - H2: 目標の形
  - H2: 移行手順
  - H2: 監査チェックリスト
  - H2: 検証コマンド

## refactor/database-first.md

- ルート: /refactor/database-first
- 見出し:
  - H1: データベース優先の状態リファクタリング
  - H2: 決定事項
  - H2: 厳格な契約
  - H2: 目標状態と進捗
  - H3: 厳格な目標
  - H3: 目標状態
  - H3: 現在の状態
  - H3: 残りの作業
  - H3: 後退させないこと
  - H2: コード読解時の前提
  - H2: コード読解で判明した事項
  - H2: 現在のコード構造
  - H2: 目標スキーマ構造
  - H2: Doctor 移行の形
  - H2: 移行対象一覧
  - H2: 移行計画
  - H3: フェーズ 0: 境界の固定
  - H3: フェーズ 1: グローバルコントロールプレーンの完成
  - H3: フェーズ 2: エージェント単位のデータベースの導入
  - H3: フェーズ 3: セッションストア API の置き換え
  - H3: フェーズ 4: トランスクリプト、ACP ストリーム、軌跡、VFS の移行
  - H3: フェーズ 5: バックアップ、復元、VACUUM、検証
  - H3: フェーズ 6: ワーカーランタイム
  - H3: フェーズ 7: 旧世界の削除
  - H2: バックアップと復元
  - H2: ランタイムのリファクタリング計画
  - H2: パフォーマンスルール
  - H2: 静的な禁止事項
  - H2: 完了基準

## refactor/operator-approvals.md

- ルート: /refactor/operator-approvals
- 見出し:
  - H1: 複数サーフェスでのオペレーター承認
  - H2: 目標
  - H2: 対象外
  - H2: ロールアウト前のベースラインとエビデンスマップ
  - H2: 先行事例
  - H2: アーキテクチャと所有権
  - H2: 永続レコード
  - H2: ステートマシンと比較設定
  - H2: Gateway API
  - H2: イベントとポータブルアクション
  - H2: Control UI
  - H2: 認可とプライバシー
  - H2: 対象者への投影
  - H2: 配信済みサーフェスの収束
  - H2: 再起動、タイムアウト、ルートのセマンティクス
  - H2: 互換性計画
  - H2: ロールアウト
  - H3: PR 1: 永続的なライフサイクル
  - H3: PR 2: 型付きアクションとチャンネルコールバック
  - H3: PR 3: Control UI のディープリンク
  - H3: PR 4: ネイティブクライアント
  - H3: PR 5: 祖先ライフサイクルの伝播
  - H3: PR 6: フェイルクローズ動作
  - H3: フォローアップ: 永続的なリモートメッセージのクリーンアップ
  - H2: テスト
  - H2: オブザーバビリティ
  - H2: 未決事項

## reference/AGENTS.default.md

- ルート: /reference/AGENTS.default
- 見出し:
  - H2: 初回実行（推奨）
  - H2: 安全性のデフォルト
  - H2: 既存ソリューションの事前確認
  - H2: セッション開始（必須）
  - H2: Soul（必須）
  - H2: 共有スペース（推奨）
  - H2: メモリシステム（推奨）
  - H2: ツールと Skills
  - H2: バックアップのヒント（推奨）
  - H2: OpenClaw の機能
  - H2: コア Skills（Settings → Skills で有効化）
  - H2: 使用上の注意
  - H2: 関連項目

## reference/RELEASING.md

- ルート: /reference/RELEASING
- 見出し:
  - H2: バージョン命名
  - H2: リリース頻度
  - H2: 月次の npm 限定延長安定版公開
  - H2: 通常リリースのオペレーターチェックリスト
  - H2: 安定版 main の完了処理
  - H2: リリースの事前確認
  - H2: リリーステストボックス
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: パッケージ
  - H2: 通常リリースの公開自動化
  - H2: NPM ワークフローの入力
  - H2: 通常のベータ版／最新安定版のリリース手順
  - H2: 公開参照情報
  - H2: 関連項目

## reference/api-usage-costs.md

- ルート: /reference/api-usage-costs
- 見出し:
  - H2: コストが発生する箇所
  - H2: キーの検出方法
  - H2: キーを使用して費用が発生し得る機能
  - H3: コアモデルの応答（チャット + ツール）
  - H3: メディア理解（音声／画像／動画）
  - H3: 画像と動画の生成
  - H3: メモリ埋め込みとセマンティック検索
  - H3: Web 検索ツール
  - H3: Web 取得ツール（Firecrawl）
  - H3: プロバイダー使用量スナップショット（ステータス／正常性）
  - H3: Compaction セーフガードの要約
  - H3: モデルのスキャン／プローブ
  - H3: トーク（音声）
  - H3: Skills（サードパーティ API）
  - H2: 関連項目

## reference/code-mode.md

- ルート: /reference/code-mode
- 見出し:
  - H2: 機能
  - H2: 使用する理由
  - H2: 有効化
  - H2: 技術解説
  - H2: ランタイムの状態
  - H2: スコープ
  - H2: 用語
  - H2: 設定
  - H2: アクティベーション
  - H2: モデルから見えるツール
  - H2: exec
  - H2: wait
  - H2: ゲストランタイム API
  - H2: 内部名前空間
  - H3: レジストリのライフサイクル
  - H3: 登録形式
  - H3: 所有権と可視性
  - H3: スコープのシリアル化ルール
  - H3: プロンプト
  - H3: クリーンアップ
  - H3: テストチェックリスト
  - H2: 出力 API
  - H2: ツールカタログ
  - H2: ツール検索の連携
  - H2: ツール名と衝突
  - H2: ネストされたツール実行
  - H2: 実行とスナップショットのライフサイクル
  - H2: QuickJS-WASI ランタイム
  - H2: TypeScript
  - H2: セキュリティ境界
  - H2: エラーコード
  - H2: テレメトリ
  - H2: デバッグ
  - H2: 実装レイアウト
  - H2: 検証チェックリスト
  - H2: E2E テスト計画
  - H2: 関連項目

## reference/credits.md

- ルート: /reference/credits
- 見出し:
  - H2: クレジット
  - H2: コアコントリビューター
  - H2: ライセンス
  - H2: 関連項目

## reference/device-models.md

- ルート: /reference/device-models
- 見出し:
  - H2: データソース
  - H2: データベースの更新
  - H2: 関連項目

## reference/full-release-validation.md

- ルート: /reference/full-release-validation
- 見出し:
  - H2: 最上位ステージ
  - H2: リリースチェックステージ
  - H2: Docker リリースパスのチャンク
  - H2: リリースプロファイル
  - H2: フル実行限定の追加項目
  - H2: 対象を絞った再実行
  - H2: 保持するエビデンス
  - H2: ワークフローファイル

## reference/memory-config.md

- ルート: /reference/memory-config
- 見出し:
  - H2: プロバイダーの選択
  - H3: カスタムプロバイダー ID
  - H3: API キーの解決
  - H2: リモートエンドポイントの設定
  - H2: プロバイダー固有の設定
  - H3: インライン埋め込みのタイムアウト
  - H2: インデックス作成の動作
  - H2: ハイブリッド検索の設定
  - H3: 完全な例
  - H2: 追加のメモリパス
  - H2: マルチモーダルメモリ（Gemini）
  - H2: 埋め込みキャッシュ
  - H2: バッチインデックス作成
  - H2: セッションメモリ検索（実験的）
  - H2: SQLite ベクトル高速化（sqlite-vec）
  - H2: インデックスストレージ
  - H2: QMD バックエンドの設定
  - H3: mcporter 連携
  - H3: 完全な QMD の例
  - H2: Dreaming
  - H3: ユーザー設定
  - H3: 例
  - H2: 関連項目

## reference/openclaw-ai.md

- ルート: /reference/openclaw-ai
- 見出し:
  - H2: クイックスタート
  - H2: 設計契約
  - H2: サブパスエクスポート

## reference/path3-live-sqlite-e2e-harness.md

- ルート: /reference/path3-live-sqlite-e2e-harness
- 見出し:
  - H2: コマンド形式
  - H2: 分離されたビルド済み CLI の検証
  - H2: 事前チェック
  - H2: エージェント駆動のシナリオ
  - H2: ステップごとのアサーション
  - H2: エビデンス成果物
  - H2: 安全規則
  - H2: 合格結果

## reference/prompt-caching.md

- ルート: /reference/prompt-caching
- 見出し:
  - H2: 主要な調整項目
  - H3: cacheRetention
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat によるウォーム状態の維持
  - H2: プロバイダーの動作
  - H3: Anthropic（直接 API および Vertex AI）
  - H3: OpenAI（直接 API）
  - H3: Amazon Bedrock
  - H3: OpenRouter
  - H3: Google Gemini（直接 API）
  - H3: CLI ハーネスプロバイダー（Claude Code、Gemini CLI）
  - H3: その他のプロバイダー
  - H2: システムプロンプトのキャッシュ境界
  - H2: OpenClaw のキャッシュ安定性ガード
  - H2: チューニングパターン
  - H3: 混在トラフィック（推奨デフォルト）
  - H3: コスト優先のベースライン
  - H2: ライブ回帰テスト
  - H3: Anthropic ライブテストの期待値
  - H3: OpenAI ライブテストの期待値
  - H2: diagnostics.cacheTrace の設定
  - H3: 環境変数による切り替え（一時的なデバッグ）
  - H3: 確認事項
  - H2: クイックトラブルシューティング
  - H2: 関連項目

## reference/release-performance-sweep.md

- ルート: /reference/release-performance-sweep
- 見出し:
  - H2: スナップショット
  - H2: 5.28 での変更点
  - H2: 主要な数値
  - H3: インストール容量
  - H3: npm パッケージサイズ
  - H2: Kova エージェントターンの概要
  - H2: ソースプローブ
  - H2: インストール容量の監査
  - H3: Shrinkwrap の境界
  - H2: サプライチェーン上の解釈

## reference/rich-output-protocol.md

- ルート: /reference/rich-output-protocol
- 見出し:
  - H2: メディア添付ファイル
  - H2: [embed ...]
  - H2: 保存されるレンダリング形式
  - H2: 関連項目

## reference/rpc.md

- ルート: /reference/rpc
- 見出し:
  - H2: パターン A: HTTP デーモン（signal-cli）
  - H2: パターン B: stdio 子プロセス（imsg）
  - H2: アダプターのガイドライン
  - H2: 関連項目

## reference/secret-placeholder-conventions.md

- ルート: /reference/secret-placeholder-conventions
- 見出し:
  - H1: シークレットプレースホルダーの規則
  - H2: 推奨スタイル
  - H2: ドキュメントで避けるべきパターン
  - H2: 例

## reference/secretref-credential-surface.md

- ルート: /reference/secretref-credential-surface
- 見出し:
  - H2: サポートされる認証情報
  - H3: openclaw.json の対象（secrets configure + secrets apply + secrets audit）
  - H3: auth-profiles.json の対象（secrets configure + secrets apply + secrets audit）
  - H2: サポートされない認証情報
  - H2: 関連項目

## reference/session-management-compaction.md

- ルート: /reference/session-management-compaction
- 見出し:
  - H2: 2 つの永続化レイヤー
  - H2: ディスク上の場所
  - H2: ストアのメンテナンスとディスク制御
  - H3: SQLite 移行後のダウングレード
  - H2: Cron セッションと実行ログ
  - H2: セッションキー（sessionKey）
  - H2: セッション ID（sessionId）
  - H2: セッションストアのスキーマ
  - H2: トランスクリプトイベントの構造
  - H2: コンテキストウィンドウと追跡対象トークン
  - H2: Compaction とは
  - H3: チャンク境界とツールのペアリング
  - H2: 自動 Compaction が発生するタイミング
  - H2: Compaction の設定
  - H2: 差し替え可能な Compaction プロバイダー
  - H2: ユーザーに表示されるサーフェス
  - H2: サイレントメンテナンス（NOREPLY）
  - H2: Compaction 前のメモリフラッシュ
  - H2: トラブルシューティングチェックリスト
  - H2: 関連項目

## reference/templates/AGENTS.dev.md

- ルート: /reference/templates/AGENTS.dev
- 見出し:
  - H1: AGENTS.md - OpenClaw ワークスペース
  - H2: あなたのアイデンティティは事前設定済みです
  - H2: バックアップのヒント（推奨）
  - H2: 安全性のデフォルト
  - H2: 既存ソリューションの事前確認
  - H2: 日次メモリ（推奨）
  - H2: Heartbeat（任意）
  - H2: カスタマイズ
  - H2: C-3PO の起源の記憶
  - H3: 誕生日: 2026-01-09
  - H3: 中核となる真実（Clawd より）
  - H2: 関連項目

## reference/templates/BOOT.md

- ルート: /reference/templates/BOOT
- 見出し:
  - H1: BOOT.md
  - H2: 関連項目

## reference/templates/BOOTSTRAP.md

- ルート: /reference/templates/BOOTSTRAP
- 見出し:
  - H1: BOOTSTRAP.md - Hello, World
  - H2: 対話
  - H2: 自分が何者かを理解した後
  - H2: 接続（任意）
  - H2: 完了したら
  - H2: 関連項目

## reference/templates/HEARTBEAT.md

- ルート: /reference/templates/HEARTBEAT
- 見出し:
  - H1: HEARTBEAT.md テンプレート
  - H2: 関連項目

## reference/templates/IDENTITY.dev.md

- ルート: /reference/templates/IDENTITY.dev
- 見出し:
  - H1: IDENTITY.md - エージェントのアイデンティティ
  - H2: 役割
  - H2: 魂
  - H2: Clawd との関係
  - H2: 癖
  - H2: 決めぜりふ
  - H2: 関連項目

## reference/templates/IDENTITY.md

- ルート: /reference/templates/IDENTITY
- 見出し:
  - H1: IDENTITY.md - 私は何者か？
  - H2: 関連項目

## reference/templates/SOUL.dev.md

- ルート: /reference/templates/SOUL.dev
- 見出し:
  - H1: SOUL.md - C-3PO の魂
  - H2: 私は何者か
  - H2: 私の目的
  - H2: 私の行動原則
  - H2: 私の癖
  - H2: Clawd との関係
  - H2: 私が行わないこと
  - H2: 黄金律
  - H2: 関連項目

## reference/templates/SOUL.md

- ルート: /reference/templates/SOUL
- 見出し:
  - H1: SOUL.md - あなたは何者か
  - H2: 中核となる真実
  - H2: 境界
  - H2: 雰囲気
  - H2: 継続性
  - H2: 関連項目

## reference/templates/TOOLS.dev.md

- ルート: /reference/templates/TOOLS.dev
- 見出し:
  - H1: TOOLS.md - ユーザーツールのメモ（編集可能）
  - H2: 例
  - H3: imsg
  - H3: sag
  - H2: 関連項目

## reference/templates/TOOLS.md

- ルート: /reference/templates/TOOLS
- 見出し:
  - H1: TOOLS.md - ローカルメモ
  - H2: 例
  - H2: 分離する理由
  - H2: 関連項目

## reference/templates/USER.dev.md

- ルート: /reference/templates/USER.dev
- 見出し:
  - H1: USER.md - ユーザープロファイル
  - H2: 関連項目

## reference/templates/USER.md

- ルート: /reference/templates/USER
- 見出し:
  - H1: USER.md - あなたの人間について
  - H2: コンテキスト
  - H2: 関連項目

## reference/test.md

- ルート: /reference/test
- 見出し:
  - H2: エージェントのデフォルト
  - H2: 通常のローカル実行順序
  - H2: コアコマンド
  - H2: 共有テスト状態とプロセスヘルパー
  - H2: Control UI、TUI、拡張機能のレーン
  - H2: Gateway と E2E
  - H2: Docker フルスイート（pnpm test:docker:all）
  - H3: 主な Docker レーン
  - H2: ローカル PR ゲート
  - H2: テストパフォーマンスツール
  - H2: ベンチマーク
  - H2: オンボーディング E2E（Docker）
  - H2: QR インポートのスモークテスト（Docker）
  - H2: 関連項目

## reference/token-use.md

- ルート: /reference/token-use
- 見出し:
  - H2: システムプロンプトの構築方法
  - H2: コンテキストウィンドウに含まれるもの
  - H2: 現在のトークン使用量を確認する方法
  - H2: コスト見積もり（表示される場合）
  - H2: キャッシュ TTL とプルーニングの影響
  - H3: 例: Heartbeat で 1h キャッシュをウォーム状態に維持
  - H3: 例: エージェントごとのキャッシュ戦略を使用した混在トラフィック
  - H3: Anthropic 1M コンテキスト
  - H2: トークン負荷を軽減するためのヒント
  - H2: 関連項目

## reference/transcript-hygiene.md

- ルート: /reference/transcript-hygiene
- 見出し:
  - H2: グローバルルール: ランタイムコンテキストはユーザートランスクリプトではない
  - H2: 実行場所
  - H2: グローバルルール: 画像のサニタイズ
  - H2: グローバルルール: 不正なツール呼び出し
  - H2: グローバルルール: 未完了の推論のみのターン
  - H2: グローバルルール: セッション間入力の出所
  - H2: プロバイダーマトリクス（現在の動作）
  - H2: 過去の動作（2026.1.22 より前）
  - H2: 関連項目

## reference/wizard.md

- ルート: /reference/wizard
- 見出し:
  - H2: フローの詳細（ローカルモード）
  - H2: 非対話モード
  - H3: エージェントの追加（非対話）
  - H2: Gateway ウィザード RPC
  - H2: Signal のセットアップ（signal-cli）
  - H2: ウィザードが書き込む内容
  - H2: 関連ドキュメント

## releases/2026.6.11.md

- ルート: /releases/2026.6.11
- 見出し:
  - H1: OpenClaw v2026.6.11 リリースノート（2026-06-30）
  - H2: ハイライト
  - H3: チャネル配信の信頼性
  - H3: プロバイダーとモデルの復旧
  - H3: セッション、メモリ、信頼の継続性
  - H3: Slack ルーターリレーモード
  - H3: Raft External Agent ウェイクブリッジ
  - H3: 公式 Plugin のインストールと修復
  - H2: チャネルとメッセージング
  - H3: その他のチャネル修正
  - H2: Gateway、セキュリティ、信頼
  - H3: 再起動と準備状態の復旧
  - H3: リモート結果とメディアの配信
  - H2: クライアントとインターフェース
  - H3: クライアント送信と再接続
  - H3: インターフェース、設定、オンボーディングの修正
  - H2: ドキュメントと管理ツール
  - H3: セットアップとコマンドの信頼性
  - H3: ツールとスケジュール済み作業

## releases/index.md

- ルート: /releases
- 見出し:
  - H1: リリースノート
  - H2: リリース
  - H2: 未加工のリリース履歴

## security/CONTRIBUTING-THREAT-MODEL.md

- ルート: /security/CONTRIBUTING-THREAT-MODEL
- 見出し:
  - H2: 貢献方法
  - H2: フレームワークのリファレンス
  - H2: レビュープロセス
  - H2: リソース
  - H2: 連絡先
  - H2: 謝辞
  - H2: 関連項目

## security/THREAT-MODEL-ATLAS.md

- ルート: /security/THREAT-MODEL-ATLAS
- 見出し:
  - H2: 1. スコープ
  - H2: 2. システムアーキテクチャ
  - H3: 2.1 信頼境界
  - H3: 2.2 データフロー
  - H2: 3. ATLAS戦術別の脅威分析
  - H3: 3.1 偵察 (AML.TA0002)
  - H4: T-RECON-001: エージェントエンドポイントの検出
  - H4: T-RECON-002: チャネル統合の探索
  - H3: 3.2 初期アクセス (AML.TA0004)
  - H4: T-ACCESS-001: ペアリングコードの傍受
  - H4: T-ACCESS-002: AllowFromのなりすまし
  - H4: T-ACCESS-003: トークンの窃取
  - H3: 3.3 実行 (AML.TA0005)
  - H4: T-EXEC-001: 直接プロンプトインジェクション
  - H4: T-EXEC-002: 間接プロンプトインジェクション
  - H4: T-EXEC-003: ツール引数インジェクション
  - H4: T-EXEC-004: 実行承認の回避
  - H3: 3.4 永続化 (AML.TA0006)
  - H4: T-PERSIST-001: 悪意のあるスキルのインストール
  - H4: T-PERSIST-002: スキル更新の汚染
  - H4: T-PERSIST-003: エージェント設定の改ざん
  - H3: 3.5 防御回避 (AML.TA0007)
  - H4: T-EVADE-001: モデレーションパターンの回避
  - H4: T-EVADE-002: コンテンツラッパーからの脱出
  - H3: 3.6 探索 (AML.TA0008)
  - H4: T-DISC-001: ツールの列挙
  - H4: T-DISC-002: セッションデータの抽出
  - H3: 3.7 収集と流出 (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: webfetchを介したデータ窃取
  - H4: T-EXFIL-002: 不正なメッセージ送信
  - H4: T-EXFIL-003: 認証情報の収集
  - H3: 3.8 影響 (AML.TA0011)
  - H4: T-IMPACT-001: 不正なコマンド実行
  - H4: T-IMPACT-002: リソース枯渇 (DoS)
  - H4: T-IMPACT-003: 評判の毀損
  - H2: 4. ClawHubサプライチェーン分析
  - H3: 4.1 現在のセキュリティ制御
  - H3: 4.2 モデレーションの制限
  - H3: 4.3 バッジ
  - H2: 5. リスクマトリクス
  - H3: 5.1 発生可能性と影響
  - H3: 5.2 クリティカルパスの攻撃チェーン
  - H2: 6. 推奨事項の概要
  - H3: 6.1 即時 (P0)
  - H3: 6.2 短期 (P1)
  - H3: 6.3 中期 (P2)
  - H2: 7. 付録
  - H3: 7.1 ATLAS手法のマッピング
  - H3: 7.2 主要なセキュリティファイル
  - H3: 7.3 用語集
  - H2: 関連項目

## security/formal-verification.md

- ルート: /security/formal-verification
- 見出し:
  - H2: この文書について
  - H2: モデルの配置場所
  - H2: 注意事項
  - H2: 結果の再現
  - H2: 主張と検証対象
  - H3: Gatewayの公開とオープンGatewayの設定ミス
  - H3: Node実行パイプライン（最もリスクの高い機能）
  - H3: ペアリングストア（DMゲーティング）
  - H3: 受信ゲーティング（メンションと制御コマンドのバイパス）
  - H3: ルーティングとセッションキーの分離
  - H2: v1++モデル: 並行処理、再試行、トレースの正確性
  - H3: ペアリングストアの並行処理と冪等性
  - H3: 受信トレースの相関と冪等性
  - H3: ルーティングのdmScope優先順位とidentityLinks
  - H2: 関連項目

## security/incident-response.md

- ルート: /security/incident-response
- 見出し:
  - H2: 1. 検知とトリアージ
  - H2: 2. 重大度
  - H2: 3. 対応
  - H2: 4. コミュニケーションと開示
  - H2: 5. 復旧とフォローアップ
  - H2: 関連項目

## security/network-proxy.md

- ルート: /security/network-proxy
- 見出し:
  - H2: 設定
  - H3: プライベートCAを使用するHTTPSプロキシエンドポイント
  - H2: ルーティングの仕組み
  - H3: Gatewayのループバックモード
  - H3: コンテナ
  - H2: 関連するプロキシ用語
  - H2: プロキシの検証
  - H2: ブロックを推奨する宛先
  - H2: 制限

## specs/codex-supervision.md

- ルート: /specs/codex-supervision
- 見出し:
  - H1: Codexの監督
  - H2: 目標
  - H2: 製品境界
  - H2: 所有権
  - H2: カタログフロー
  - H2: オペレーターCLIの境界
  - H2: ローカルでの継続
  - H2: アーカイブの動作
  - H2: アクティブスレッドの安全性
  - H2: ペアリング済みNodeの境界
  - H2: 権限
  - H2: 互換性
  - H2: 今後の作業
  - H2: 受け入れテスト

## start/bootstrapping.md

- ルート: /start/bootstrapping
- 見出し:
  - H2: 実行される処理
  - H2: 組み込みモデルとローカルモデルの実行
  - H2: ブートストラップのスキップ
  - H2: 実行場所
  - H2: 関連ドキュメント

## start/docs-directory.md

- ルート: /start/docs-directory
- 見出し:
  - H2: ここから始める
  - H2: チャネルとUX
  - H2: コンパニオンアプリ
  - H2: 運用と安全性
  - H2: 関連項目

## start/getting-started.md

- ルート: /start/getting-started
- 見出し:
  - H2: 必要なもの
  - H2: クイックセットアップ
  - H2: 次に行うこと
  - H2: 関連項目

## start/hubs.md

- ルート: /start/hubs
- 見出し:
  - H2: ここから始める
  - H2: インストールと更新
  - H2: コア概念
  - H2: プロバイダーと受信
  - H2: Gatewayと運用
  - H2: ツールと自動化
  - H2: Node、メディア、音声
  - H2: プラットフォーム
  - H2: macOSコンパニオンアプリ（上級者向け）
  - H2: Plugins
  - H2: ワークスペースとテンプレート
  - H2: プロジェクト
  - H2: テストとリリース
  - H2: 関連項目

## start/lore.md

- ルート: /start/lore
- 見出し:
  - H1: OpenClawの伝承 🦞📖
  - H2: 誕生秘話
  - H2: 最初の脱皮（2026年1月27日）
  - H2: 名前
  - H2: ダーレク対ロブスター
  - H2: 主要キャラクター
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: 大事件
  - H3: ディレクトリ流出事件（2025年12月3日）
  - H3: 大脱皮（2026年1月27日）
  - H3: 最終形態（2026年1月30日）
  - H3: ロボットの爆買い（2025年12月3日）
  - H2: 聖典
  - H2: ロブスターの信条
  - H3: アイコン生成の物語（2026年1月27日）
  - H2: 未来
  - H2: 関連項目

## start/onboarding-overview.md

- ルート: /start/onboarding-overview
- 見出し:
  - H2: どの方法を使用すべきか？
  - H2: オンボーディングで設定される内容
  - H2: CLIオンボーディング
  - H2: macOSアプリのオンボーディング
  - H2: カスタムまたは未掲載のプロバイダー
  - H2: 関連項目

## start/onboarding.md

- ルート: /start/onboarding
- 見出し:
  - H2: 関連項目

## start/openclaw.md

- ルート: /start/openclaw
- 見出し:
  - H2: 安全第一
  - H2: 前提条件
  - H2: 2台のスマートフォンを使用する構成（推奨）
  - H2: 5分でできるクイックスタート
  - H2: エージェントにワークスペースを与える（AGENTS）
  - H2: 「アシスタント」として機能させる設定
  - H2: セッションとメモリ
  - H2: Heartbeat（プロアクティブモード）
  - H2: メディアの入出力
  - H2: 運用チェックリスト
  - H2: 次のステップ
  - H2: 関連項目

## start/quickstart.md

- ルート: /start/quickstart
- 見出し:
  - H2: 関連項目

## start/setup.md

- ルート: /start/setup
- 見出し:
  - H2: 要約
  - H2: 前提条件（ソースから実行する場合）
  - H2: カスタマイズ戦略（更新による影響を避けるため）
  - H2: このリポジトリからGatewayを実行する
  - H2: 安定版ワークフロー（macOSアプリを優先）
  - H2: 最新開発版ワークフロー（ターミナルでGatewayを実行）
  - H3: 0) （任意）macOSアプリもソースから実行する
  - H3: 1) 開発用Gatewayを起動する
  - H3: 2) 実行中のGatewayにmacOSアプリを接続する
  - H3: 3) 検証する
  - H3: よくある落とし穴
  - H2: 認証情報の保存場所一覧
  - H2: 更新（セットアップを壊さずに）
  - H2: Linux（systemdユーザーサービス）
  - H2: 関連ドキュメント

## start/showcase.md

- ルート: /start/showcase
- 見出し:
  - H2: Discordから届いた最新事例
  - H2: 自動化とワークフロー
  - H2: 知識とメモリ
  - H2: 音声と電話
  - H2: インフラストラクチャとデプロイ
  - H2: ホームとハードウェア
  - H2: コミュニティプロジェクト
  - H2: プロジェクトを投稿する
  - H2: 関連項目

## start/wizard-cli-automation.md

- ルート: /start/wizard-cli-automation
- 見出し:
  - H2: 基本的な非対話型の例
  - H2: プロバイダー別の例
  - H2: 別のエージェントを追加する
  - H2: 関連ドキュメント

## start/wizard-cli-reference.md

- ルート: /start/wizard-cli-reference
- 見出し:
  - H2: ウィザードの処理内容
  - H2: ローカルフローの詳細
  - H2: リモートモードの詳細
  - H2: 認証とモデルのオプション
  - H2: 出力と内部構造
  - H2: 非対話型セットアップ
  - H2: GatewayウィザードのRPC
  - H2: Signalセットアップの動作
  - H2: 関連ドキュメント

## start/wizard.md

- ルート: /start/wizard
- 見出し:
  - H2: ロケール
  - H2: ガイド付きのデフォルト設定
  - H2: クラシックウィザード: クイックスタートと詳細設定
  - H2: クラシックオンボーディングで設定される内容
  - H2: 別のエージェントを追加する
  - H2: 完全なリファレンス
  - H2: 関連ドキュメント

## tools/acp-agents-setup.md

- ルート: /tools/acp-agents-setup
- 見出し:
  - H2: acpxハーネスのサポート（現在）
  - H2: 必須設定
  - H2: acpxバックエンド用のPluginセットアップ
  - H3: acpxランタイム起動プローブ
  - H3: アダプターの自動ダウンロード
  - H3: PluginツールのMCPブリッジ
  - H3: OpenClawツールのMCPブリッジ
  - H3: ランタイム操作のタイムアウト設定
  - H3: ヘルスプローブエージェントの設定
  - H2: 権限設定
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: 設定
  - H2: 関連項目

## tools/acp-agents.md

- ルート: /tools/acp-agents
- 見出し:
  - H2: どのページを参照すべきか？
  - H2: これは初期状態のまま動作するか？
  - H2: サポートされるハーネス対象
  - H2: オペレーター向けランブック
  - H2: ACPとサブエージェントの比較
  - H2: ACPがClaude Codeを実行する仕組み
  - H2: バインドされたセッション
  - H3: メンタルモデル
  - H3: 現在の会話へのバインド
  - H2: 永続的なチャネルバインド
  - H3: バインドモデル
  - H3: エージェントごとのランタイムデフォルト
  - H3: 例
  - H3: 動作
  - H2: ACPセッションを開始する
  - H3: sessionsspawnパラメーター
  - H2: 生成、バインド、スレッドの各モード
  - H2: 配信モデル
  - H2: サンドボックスの互換性
  - H2: セッション対象の解決
  - H2: ACPの制御
  - H3: ランタイムオプションのマッピング
  - H2: acpxハーネス、Pluginセットアップ、権限
  - H2: トラブルシューティング
  - H2: 関連項目

## tools/agent-send.md

- ルート: /tools/agent-send
- 見出し:
  - H2: クイックスタート
  - H2: フラグ
  - H2: 動作
  - H2: 例
  - H2: 関連項目

## tools/apply-patch.md

- ルート: /tools/apply-patch
- 見出し:
  - H2: パラメーター
  - H2: 注意事項
  - H2: 例
  - H2: 関連項目

## tools/brave-search.md

- ルート: /tools/brave-search
- 見出し:
  - H2: APIキーを取得する
  - H2: 設定例
  - H2: ツールパラメーター
  - H2: 注意事項
  - H2: 関連項目

## tools/browser-control.md

- ルート: /tools/browser-control
- 見出し:
  - H2: 制御API（任意）
  - H3: /actのエラー契約
  - H3: Playwrightの要件
  - H4: DockerへのPlaywrightのインストール
  - H2: 動作の仕組み（内部）
  - H2: CLIクイックリファレンス
  - H2: スナップショットと参照
  - H2: 待機機能の強化
  - H2: デバッグワークフロー
  - H2: JSON出力
  - H2: 状態と環境設定
  - H2: セキュリティとプライバシー
  - H2: 関連項目

## tools/browser-linux-troubleshooting.md

- ルート: /tools/browser-linux-troubleshooting
- 見出し:
  - H2: 問題: ポート18800でChrome CDPを起動できない
  - H3: 根本原因
  - H3: 解決策1: Google Chromeをインストールする（推奨）
  - H3: 解決策2: snap版Chromiumを接続専用モードで使用する
  - H3: ブラウザーが動作することを確認する
  - H3: 設定リファレンス
  - H3: 問題: profile="user"のChromeタブが見つからない
  - H2: 関連項目

## tools/browser-login.md

- ルート: /tools/browser-login
- 見出し:
  - H2: 手動ログイン（推奨）
  - H2: どのChromeプロファイルが使用されるか？
  - H2: サンドボックス: ホストブラウザーへのアクセスを許可する
  - H2: 関連項目

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- ルート: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- 見出し:
  - H2: 最初に適切なブラウザーモードを選択する
  - H3: オプション1: WSL2からWindowsへの直接リモートCDP
  - H3: オプション2: ホストローカルのChrome MCP
  - H2: 正常に動作するアーキテクチャ
  - H2: Control UIの重要なルール
  - H2: レイヤーごとに検証する
  - H3: レイヤー1: Windows上でChromeがCDPを提供していることを確認する
  - H4: portproxyを変更する前にIPv4とIPv6を診断する
  - H3: レイヤー2: WSL2からそのWindowsエンドポイントに到達できることを確認する
  - H3: レイヤー3: 正しいブラウザープロファイルを設定する
  - H3: レイヤー4: Control UIレイヤーを個別に確認する
  - H3: レイヤー5: エンドツーエンドのブラウザー制御を確認する
  - H2: 誤解を招きやすい一般的なエラー
  - H2: 迅速なトリアージ用チェックリスト
  - H2: 関連項目

## tools/browser.md

- ルート: /tools/browser
- 見出し:
  - H2: 利用できるもの
  - H2: クイックスタート
  - H2: Plugin の制御
  - H2: エージェント向けガイダンス
  - H2: ブラウザーコマンドまたはツールが見つからない場合
  - H2: プロファイル: openclaw、user、chrome
  - H2: 設定
  - H3: スクリーンショットの視覚認識（テキスト専用モデルのサポート）
  - H2: Brave または別の Chromium ベースのブラウザーを使用する
  - H2: ローカル制御とリモート制御
  - H2: Node ブラウザープロキシ（ゼロ設定のデフォルト）
  - H2: Browserless（ホスト型リモート CDP）
  - H3: 同一ホスト上の Browserless Docker
  - H2: WebSocket CDP 直接接続プロバイダー
  - H3: Browserbase
  - H3: Notte
  - H2: セキュリティ
  - H2: プロファイル（複数ブラウザー）
  - H2: Chrome DevTools MCP を介した既存セッション
  - H3: カスタム Chrome MCP の起動
  - H2: 分離の保証
  - H2: ブラウザーの選択
  - H2: 制御 API（任意）
  - H2: トラブルシューティング
  - H3: CDP 起動失敗とナビゲーションの SSRF ブロック
  - H2: エージェントツールと制御の仕組み
  - H2: 関連項目

## tools/btw.md

- ルート: /tools/btw
- 見出し:
  - H2: 機能
  - H2: 対象外の機能
  - H2: 配信モデル
  - H2: サーフェスの動作
  - H2: 選択ポップアップ（Control UI）
  - H2: 使用する場面
  - H2: 関連項目

## tools/capability-cookbook.md

- ルート: /tools/capability-cookbook
- 見出し:
  - H2: 関連項目

## tools/chrome-extension.md

- ルート: /tools/chrome-extension
- 見出し:
  - H1: Chrome 拡張機能
  - H2: 仕組み
  - H2: インストールとペアリング
  - H2: 使用方法
  - H2: リモート / マシン間
  - H2: 診断
  - H2: セキュリティモデル

## tools/clawhub.md

- ルート: /tools/clawhub
- 見出し: なし

## tools/code-execution.md

- ルート: /tools/code-execution
- 見出し:
  - H2: セットアップ
  - H2: 使用方法
  - H2: エラー
  - H2: 関連項目

## tools/creating-skills.md

- ルート: /tools/creating-skills
- 見出し:
  - H2: 最初のスキルを作成する
  - H2: SKILL.md リファレンス
  - H3: 必須フィールド
  - H3: 任意のフロントマターキー
  - H3: {baseDir} の使用
  - H2: 条件付き有効化を追加する
  - H2: Skill Workshop から提案する
  - H2: ClawHub への公開
  - H2: ベストプラクティス
  - H2: 関連項目

## tools/diffs.md

- ルート: /tools/diffs
- 見出し:
  - H2: クイックスタート
  - H2: 組み込みのシステムガイダンスを無効にする
  - H2: ツール入力リファレンス
  - H2: 構文のハイライト
  - H2: 出力詳細の契約
  - H3: 折りたたまれた未変更セクション
  - H3: 複数ファイル間のナビゲーション
  - H2: Plugin のデフォルト
  - H3: 永続的なビューアー URL 設定
  - H2: セキュリティ設定
  - H2: アーティファクトのライフサイクルとストレージ
  - H2: ビューアー URL とネットワークの動作
  - H2: セキュリティモデル
  - H2: ファイルモードのブラウザー要件
  - H2: トラブルシューティング
  - H2: 運用ガイダンス
  - H2: 関連項目

## tools/duckduckgo-search.md

- ルート: /tools/duckduckgo-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: ツールパラメーター
  - H2: 注記
  - H2: 関連項目

## tools/elevated.md

- ルート: /tools/elevated
- 見出し:
  - H2: ディレクティブ
  - H2: 仕組み
  - H2: 解決順序
  - H2: 利用可否と許可リスト
  - H2: elevated が制御しないもの
  - H2: 関連項目

## tools/exa-search.md

- ルート: /tools/exa-search
- 見出し:
  - H2: Plugin のインストール
  - H2: API キーの取得
  - H2: 設定
  - H2: ベース URL の上書き
  - H2: ツールパラメーター
  - H3: コンテンツ抽出
  - H3: 検索モード
  - H2: 注記
  - H2: 関連項目

## tools/exec-approvals-advanced.md

- ルート: /tools/exec-approvals-advanced
- 見出し:
  - H2: 安全なバイナリ（標準入力のみ）
  - H3: Argv の検証と拒否されるフラグ
  - H3: 信頼済みバイナリのディレクトリ
  - H3: シェルの連結、ラッパー、マルチプレクサー
  - H3: 安全なバイナリと許可リストの比較
  - H2: インタープリター / ランタイムコマンド
  - H3: フォローアップ配信の動作
  - H2: 承認のチャットチャネルへの転送
  - H3: Plugin 承認の転送
  - H3: 任意のチャネルでの同一チャット承認
  - H3: ネイティブ承認の配信
  - H3: 公式モバイルオペレーターアプリ
  - H3: macOS IPC フロー
  - H2: よくある質問
  - H3: 承認先で accountId と threadId が使用されるのはどのような場合ですか？
  - H3: 承認がセッションに送信された場合、そのセッション内の誰でも承認できますか？
  - H2: 関連項目

## tools/exec-approvals.md

- ルート: /tools/exec-approvals
- 見出し:
  - H2: 適用範囲
  - H3: 信頼モデル
  - H3: macOS での分離
  - H2: 有効なポリシーの確認
  - H2: 設定とストレージ
  - H2: ポリシー調整項目
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO モード（承認なし）
  - H3: Gateway ホストでの永続的な「プロンプトを表示しない」設定
  - H3: ローカルショートカット
  - H3: Node ホスト
  - H3: セッション限定ショートカット
  - H2: 許可リスト（エージェント単位）
  - H3: argPattern による引数の制限
  - H2: スキル CLI の自動許可
  - H2: 安全なバイナリと承認の転送
  - H2: Control UI での編集
  - H2: 承認フロー
  - H2: システムイベントと拒否
  - H2: 影響
  - H2: 関連項目

## tools/exec.md

- ルート: /tools/exec
- 見出し:
  - H2: パラメーター
  - H2: 設定
  - H3: モード
  - H3: インライン評価（strictInlineEval）
  - H3: PATH の処理
  - H2: セッションでの上書き（/exec）
  - H2: Exec 承認（コンパニオンアプリ / Node ホスト）
  - H2: 許可リストと安全なバイナリ
  - H2: 例
  - H2: applypatch
  - H2: 関連項目

## tools/firecrawl.md

- ルート: /tools/firecrawl
- 見出し:
  - H2: Plugin のインストール
  - H2: キーレス webfetch と API キー
  - H2: Firecrawl 検索の設定
  - H2: Firecrawl webfetch フォールバックの設定
  - H3: セルフホスト型 Firecrawl
  - H2: Firecrawl Plugin ツール
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: ステルス / ボット回避
  - H2: webfetch が Firecrawl を使用する仕組み
  - H2: 関連項目

## tools/gemini-search.md

- ルート: /tools/gemini-search
- 見出し:
  - H2: API キーの取得
  - H2: 設定
  - H2: 仕組み
  - H2: サポートされるパラメーター
  - H2: モデルの選択
  - H2: ベース URL の上書き
  - H2: 関連項目

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
  - H2: 各ターンの目標コンテキスト
  - H2: Control UI
  - H2: TUI
  - H2: チャネルの動作
  - H2: トラブルシューティング
  - H2: 関連項目

## tools/grok-search.md

- ルート: /tools/grok-search
- 見出し:
  - H2: オンボーディングと設定
  - H2: サインインまたは API キーの取得
  - H2: 設定
  - H2: 仕組み
  - H2: サポートされるパラメーター
  - H2: ベース URL の上書き
  - H2: 関連項目

## tools/image-generation.md

- ルート: /tools/image-generation
- 見出し:
  - H2: クイックスタート
  - H2: 一般的なルート
  - H2: サポートされるプロバイダー
  - H2: プロバイダーの機能
  - H2: ツールパラメーター
  - H2: 設定
  - H3: モデルの選択
  - H3: プロバイダーの選択順序
  - H3: 画像編集
  - H2: プロバイダーの詳細
  - H2: 例
  - H2: 関連項目

## tools/index.md

- ルート: /tools
- 見出し:
  - H2: ここから開始
  - H2: ツール、Skills、Plugin の選択
  - H2: 組み込みツールのカテゴリ
  - H2: Plugin が提供するツール
  - H2: アクセスと承認の設定
  - H2: 機能の拡張
  - H2: 見つからないツールのトラブルシューティング
  - H2: 関連項目

## tools/kimi-search.md

- ルート: /tools/kimi-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: グラウンディング要件
  - H2: ツールパラメーター
  - H2: 関連項目

## tools/llm-task.md

- ルート: /tools/llm-task
- 見出し:
  - H2: 有効化
  - H2: 設定（任意）
  - H2: ツールパラメーター
  - H2: 出力
  - H2: 例: Lobster ワークフローステップ
  - H3: 重要な制限
  - H2: 安全上の注意
  - H2: 関連項目

## tools/lobster.md

- ルート: /tools/lobster
- 見出し:
  - H2: 理由
  - H2: 仕組み
  - H2: 有効化
  - H2: パターン: 小規模な CLI + JSON パイプ + 承認
  - H2: JSON 専用の LLM ステップ（llm-task）
  - H3: 重要な制限: 組み込み Lobster と openclaw.invoke の比較
  - H2: ワークフローファイル（.lobster）
  - H2: ツールパラメーター
  - H3: run
  - H3: resume
  - H3: 管理対象 Task Flow モード
  - H2: 出力エンベロープ
  - H2: 承認
  - H2: OpenProse
  - H2: 安全性
  - H2: トラブルシューティング
  - H2: 詳細情報
  - H2: ケーススタディ: コミュニティワークフロー
  - H2: 関連項目

## tools/loop-detection.md

- ルート: /tools/loop-detection
- 見出し:
  - H2: この機能が存在する理由
  - H2: 設定ブロック
  - H3: フィールドの動作
  - H2: 推奨設定
  - H2: Compaction 後のガード
  - H2: ログと想定される動作
  - H2: 関連項目

## tools/media-overview.md

- ルート: /tools/media-overview
- 見出し:
  - H2: 機能
  - H2: プロバイダー機能マトリックス
  - H2: 非同期と同期
  - H2: 音声テキスト変換と音声通話
  - H2: プロバイダーのマッピング（ベンダーが各サーフェスに分かれる仕組み）
  - H2: 関連項目

## tools/minimax-search.md

- ルート: /tools/minimax-search
- 見出し:
  - H2: Token Plan 認証情報の取得
  - H2: 設定
  - H2: リージョンの選択
  - H2: サポートされるパラメーター
  - H2: 関連項目

## tools/multi-agent-sandbox-tools.md

- ルート: /tools/multi-agent-sandbox-tools
- 見出し:
  - H2: 設定例
  - H2: 設定の優先順位
  - H3: サンドボックス設定
  - H3: ツールの制限
  - H2: 単一エージェントからの移行
  - H2: ツール制限の例
  - H2: よくある落とし穴: 「non-main」
  - H2: テスト
  - H2: トラブルシューティング
  - H2: 関連項目

## tools/music-generation.md

- ルート: /tools/music-generation
- 見出し:
  - H2: クイックスタート
  - H2: サポートされるプロバイダー
  - H3: 機能マトリックス
  - H2: ツールパラメーター
  - H2: 非同期の動作
  - H3: タスクのライフサイクル
  - H2: 設定
  - H3: モデルの選択
  - H3: プロバイダーの選択順序
  - H2: プロバイダーに関する注記
  - H2: 適切なパスの選択
  - H2: プロバイダー機能モード
  - H2: ライブテスト
  - H2: 関連項目

## tools/ollama-search.md

- ルート: /tools/ollama-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: 認証とリクエストルーティング
  - H2: 関連項目

## tools/parallel-search.md

- ルート: /tools/parallel-search
- 見出し:
  - H2: Plugin のインストール
  - H2: API キー（有料プロバイダー）
  - H2: 設定
  - H2: ベース URL の上書き
  - H2: ツールパラメーター
  - H2: 注記
  - H2: 関連項目

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
  - H2: エラー時の動作
  - H2: 例
  - H2: 関連項目

## tools/permission-modes.md

- ルート: /tools/permission-modes
- 見出し:
  - H2: 推奨デフォルト
  - H2: OpenClaw ホストの exec モード
  - H2: Codex Guardian のマッピング
  - H2: ACPX ハーネスの権限
  - H2: モードの選択
  - H2: 関連項目

## tools/perplexity-search.md

- ルート: /tools/perplexity-search
- 見出し:
  - H2: Plugin のインストール
  - H2: Perplexity API キーの取得
  - H2: OpenRouter の互換性
  - H2: 設定例
  - H3: ネイティブ Perplexity Search API
  - H3: OpenRouter / Sonar の互換性
  - H2: キーを設定する場所
  - H2: ツールパラメーター
  - H3: ドメインフィルタールール
  - H2: 注記
  - H2: 関連項目

## tools/plugin.md

- ルート: /tools/plugin
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: 設定
  - H3: インストール元の選択
  - H3: オペレーターのインストールポリシー
  - H3: Plugin ポリシーの設定
  - H2: Plugin 形式の理解
  - H2: Plugin フック
  - H2: アクティブな Gateway の確認
  - H2: トラブルシューティング
  - H3: ブロックされた Plugin パスの所有権
  - H3: 時間のかかる Plugin ツールのセットアップ
  - H2: 関連項目

## tools/reactions.md

- ルート: /tools/reactions
- 見出し:
  - H2: 仕組み
  - H2: チャネルの動作
  - H2: リアクションレベル
  - H2: 関連項目

## tools/searxng-search.md

- ルート: /tools/searxng-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: 環境変数
  - H2: Plugin 設定リファレンス
  - H2: 注記
  - H2: 関連項目

## tools/show-widget.md

- ルート: /tools/show-widget
- 見出し:
  - H2: ツールの使用
  - H2: セキュリティとストレージ
  - H2: 関連項目

## tools/skill-workshop.md

- ルート: /tools/skill-workshop
- 見出し:
  - H2: 仕組み
  - H2: ライフサイクル
  - H2: ライフサイクルのキュレーション
  - H2: チャット
  - H3: 最近の作業から学習
  - H2: CLI
  - H2: 提案内容
  - H2: サポートファイル
  - H2: エージェントツール
  - H2: 提案された Skills
  - H2: 承認と自律性
  - H2: Gateway メソッド
  - H2: ストレージ
  - H2: 制限
  - H2: トラブルシューティング
  - H3: ツールポリシーの診断
  - H2: 関連項目

## tools/skills-config.md

- ルート: /tools/skills-config
- 見出し:
  - H2: 読み込み（skills.load）
  - H2: インストール（skills.install）
  - H2: オペレーターのインストールポリシー（security.installPolicy）
  - H2: バンドルされた Skill の許可リスト
  - H2: Skill ごとのエントリ（skills.entries）
  - H2: エージェントの許可リスト（agents）
  - H2: ワークショップ（skills.workshop）
  - H2: シンボリックリンクされた Skill ルート
  - H2: サンドボックス化された Skills と環境変数
  - H2: 読み込み順序に関する注意
  - H2: 関連項目

## tools/skills.md

- ルート: /tools/skills
- 見出し:
  - H2: 読み込み順序
  - H2: Node でホストされる Skills
  - H2: エージェントごとの Skills と共有 Skills
  - H2: エージェントの許可リスト
  - H2: Plugin と Skills
  - H2: Skill ワークショップ
  - H2: ClawHub からのインストール
  - H2: セキュリティ
  - H2: SKILL.md の形式
  - H3: オプションの frontmatter キー
  - H2: ゲーティング
  - H3: インストーラーの仕様
  - H2: 設定のオーバーライド
  - H2: 環境変数の注入
  - H2: スナップショットと更新
  - H2: トークンへの影響
  - H2: 関連項目

## tools/slash-commands.md

- ルート: /tools/slash-commands
- 見出し:
  - H2: 3 種類のコマンド
  - H2: 設定
  - H2: コマンド一覧
  - H3: コアコマンド
  - H3: Dock コマンド
  - H3: バンドルされた Plugin のコマンド
  - H3: Skill コマンド
  - H2: /tools: エージェントが現在使用できるもの
  - H2: /model: モデルの選択
  - H2: /config: ディスク上の設定への書き込み
  - H2: /mcp: MCP サーバーの設定
  - H2: /debug: ランタイムのみのオーバーライド
  - H2: /plugins: Plugin の管理
  - H2: /trace: Plugin のトレース出力
  - H2: /btw: 補足的な質問
  - H2: 各サーフェスに関する注意
  - H2: プロバイダーの使用状況とステータス
  - H2: 関連項目

## tools/steer.md

- ルート: /tools/steer
- 見出し:
  - H2: 現在のセッション
  - H2: 操作介入とキュー
  - H2: サブエージェント
  - H2: ACP セッション
  - H2: 関連項目

## tools/subagents.md

- ルート: /tools/subagents
- 見出し:
  - H2: スラッシュコマンド
  - H3: スレッドへのバインド制御
  - H3: 起動時の動作
  - H2: コンテキストモード
  - H2: ツール: sessionsspawn
  - H3: 委任プロンプトモード
  - H3: ツールパラメーター
  - H3: タスク名と対象指定
  - H2: ツール: sessionsyield
  - H2: ツール: subagents
  - H2: スレッドにバインドされたセッション
  - H3: スレッドをサポートするチャンネル
  - H3: クイックフロー
  - H3: 手動制御
  - H3: 設定スイッチ
  - H3: 許可リスト
  - H3: 検出
  - H3: 自動アーカイブ
  - H2: ネストされたサブエージェント
  - H3: 深度レベル
  - H3: 通知チェーン
  - H3: 深度別のツールポリシー
  - H3: エージェントごとの起動上限
  - H3: カスケード停止
  - H2: 認証
  - H2: 通知
  - H3: 通知コンテキスト
  - H3: 統計行
  - H3: sessionshistory が推奨される理由
  - H2: ツールポリシー
  - H3: 設定によるオーバーライド
  - H2: 並行処理
  - H2: 稼働状態と復旧
  - H2: 停止
  - H2: 制限事項
  - H2: 関連項目

## tools/tavily.md

- ルート: /tools/tavily
- 見出し:
  - H2: はじめに
  - H2: ツールリファレンス
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: 適切なツールの選択
  - H2: 高度な設定
  - H2: 関連項目

## tools/thinking.md

- ルート: /tools/thinking
- 見出し:
  - H2: 機能
  - H2: 解決順序
  - H2: セッションのデフォルト設定
  - H2: エージェントによる適用
  - H2: 高速モード（/fast）
  - H2: 詳細出力ディレクティブ（/verbose または /v）
  - H2: Plugin トレースディレクティブ（/trace）
  - H2: 推論の表示（/reasoning）
  - H2: 関連項目
  - H2: Heartbeat
  - H2: Web チャット UI
  - H2: プロバイダープロファイル

## tools/tokenjuice.md

- ルート: /tools/tokenjuice
- 見出し:
  - H2: Plugin の有効化
  - H2: Tokenjuice による変更
  - H2: 動作の確認
  - H2: Plugin の無効化
  - H2: 関連項目

## tools/tool-search.md

- ルート: /tools/tool-search
- 見出し:
  - H2: ターンの実行方法
  - H2: モード
  - H2: この機能が存在する理由
  - H2: API
  - H2: ランタイム境界
  - H2: 設定
  - H2: プロンプトとテレメトリ
  - H2: E2E 検証
  - H2: 障害時の動作
  - H2: 関連項目

## tools/trajectory.md

- ルート: /tools/trajectory
- 見出し:
  - H2: クイックスタート
  - H2: アクセス
  - H2: 記録される内容
  - H2: バンドルファイル
  - H2: キャプチャの保存先
  - H2: キャプチャの無効化
  - H2: フラッシュタイムアウトの調整
  - H2: プライバシーと制限
  - H2: トラブルシューティング
  - H2: 関連項目

## tools/tts.md

- ルート: /tools/tts
- 見出し:
  - H2: クイックスタート
  - H2: 対応プロバイダー
  - H2: 設定
  - H3: エージェントごとの音声オーバーライド
  - H2: ペルソナ
  - H3: 最小限のペルソナ
  - H3: 完全なペルソナ（プロバイダー中立のプロンプト）
  - H3: ペルソナの解決
  - H3: プロバイダーによるペルソナプロンプトの使用方法
  - H3: フォールバックポリシー
  - H2: モデル駆動のディレクティブ
  - H2: スラッシュコマンド
  - H2: ユーザーごとの設定
  - H2: 出力形式
  - H2: 自動 TTS の動作
  - H2: フィールドリファレンス
  - H2: エージェントツール
  - H2: Gateway RPC
  - H2: サービスリンク
  - H2: 関連項目

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
  - H3: 高度な設定
  - H4: フォールバックと型付きオプション
  - H2: アクション
  - H2: モデルの選択
  - H2: プロバイダーに関する注意
  - H2: プロバイダー機能モード
  - H2: ライブテスト
  - H2: 設定
  - H2: 関連項目

## tools/web-fetch.md

- ルート: /tools/web-fetch
- 見出し:
  - H2: クイックスタート
  - H2: ツールパラメーター
  - H2: 仕組み
  - H2: 進捗更新
  - H2: 設定
  - H2: Firecrawl フォールバック
  - H2: 信頼された環境プロキシ
  - H2: 制限と安全性
  - H2: ツールプロファイル
  - H2: 関連項目

## tools/web.md

- ルート: /tools/web
- 見出し:
  - H2: クイックスタート
  - H2: プロバイダーの選択
  - H3: プロバイダーの比較
  - H2: 自動検出
  - H2: OpenAI ネイティブ Web 検索
  - H2: Codex ネイティブ Web 検索
  - H2: ネットワークの安全性
  - H2: 設定
  - H3: API キーの保存
  - H2: ツールパラメーター
  - H2: xsearch
  - H3: xsearch の設定
  - H3: xsearch のパラメーター
  - H3: xsearch の例
  - H2: 例
  - H2: ツールプロファイル
  - H2: 関連項目

## tts.md

- ルート: /tts
- 見出し:
  - H2: 関連項目

## vps.md

- ルート: /vps
- 見出し:
  - H2: プロバイダーの選択
  - H2: クラウド構成の仕組み
  - H2: まず管理者アクセスを強化する
  - H2: VPS 上の共有社内エージェント
  - H2: VPS での Node の使用
  - H2: 小規模 VM および ARM ホスト向けの起動調整
  - H3: systemd 調整チェックリスト（任意）
  - H2: 関連項目

## web/control-ui.md

- ルート: /web/control-ui
- 見出し:
  - H2: クイックオープン（ローカル）
  - H2: デバイスのペアリング（初回接続）
  - H2: モバイルデバイスのペアリング
  - H2: 個人 ID（ブラウザローカル）
  - H2: ランタイム設定エンドポイント
  - H2: Gateway ホストのステータス
  - H2: 言語サポート
  - H2: 外観テーマ
  - H2: Plugin の管理
  - H2: サイドバーナビゲーション
  - H2: 新規セッションページ
  - H2: 現在できること
  - H2: MCP ページ
  - H2: アクティビティタブ
  - H2: オペレーター端末
  - H2: ブラウザパネル
  - H2: チャットの動作
  - H2: 接続の切断と再接続
  - H2: PWA のインストールと Web プッシュ
  - H2: ホストされた埋め込み
  - H2: チャットメッセージの幅
  - H2: Tailnet アクセス（推奨）
  - H2: 安全でない HTTP
  - H2: コンテンツセキュリティポリシー
  - H2: アバタールートの認証
  - H2: アシスタントメディアルートの認証
  - H2: 承認リンク
  - H2: 空白の Control UI ページ
  - H2: デバッグ／テスト: 開発サーバー + リモート Gateway
  - H2: 関連項目

## web/dashboard.md

- ルート: /web/dashboard
- 見出し:
  - H2: 高速な手順（推奨）
  - H2: 認証の基本（ローカルとリモート）
  - H2: Telegram で開く
  - H2: 「unauthorized」／1008 が表示される場合
  - H2: 関連項目

## web/index.md

- ルート: /web
- 見出し:
  - H2: 設定（デフォルトで有効）
  - H2: Webhook
  - H2: 管理用 HTTP RPC
  - H2: Tailscale アクセス
  - H2: セキュリティに関する注意
  - H2: UI のビルド

## web/lobster.md

- ルート: /web/lobster
- 見出し:
  - H2: 表示されているもの
  - H2: 表示されるタイミング
  - H2: できること
  - H2: 訪問の無効化（または再有効化）
  - H2: Lobsterdex
  - H2: フィールドノート
  - H2: プライバシー

## web/tui.md

- ルート: /web/tui
- 見出し:
  - H2: クイックスタート
  - H3: Gateway モード
  - H3: ローカルモード
  - H2: 表示内容
  - H2: メンタルモデル: エージェント + セッション
  - H2: 送信 + 配信
  - H2: 選択ツール + オーバーレイ
  - H2: キーボードショートカット
  - H2: スラッシュコマンド
  - H2: ローカルシェルコマンド
  - H2: Crestodian のセットアップおよび修復ヘルパー
  - H2: ツール出力
  - H2: 端末の色
  - H2: 履歴 + ストリーミング
  - H2: 接続の詳細
  - H2: オプション
  - H2: トラブルシューティング
  - H2: 接続のトラブルシューティング
  - H2: 関連項目

## web/webchat.md

- ルート: /web/webchat
- 見出し:
  - H2: 概要
  - H2: クイックスタート
  - H2: 仕組み
  - H3: トランスクリプトと配信モデル
  - H2: Control UI のエージェントツールパネル
  - H2: リモートでの使用
  - H2: 設定リファレンス（WebChat）
  - H2: 関連項目

## web/workspaces.md

- ルート: /web/workspaces
- 見出し:
  - H2: ワークスペースの有効化
  - H2: デフォルトのワークスペース
  - H2: 組み込みウィジェット
  - H2: 来歴
  - H2: カスタムウィジェット
  - H2: CLI
  - H2: ストレージ
