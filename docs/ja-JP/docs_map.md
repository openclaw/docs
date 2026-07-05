---
read_when: Finding which docs page covers a topic before reading the page
summary: OpenClaw ドキュメントページ用に生成された見出しマップ
title: ドキュメントマップ
x-i18n:
    generated_at: "2026-07-05T20:18:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3b4620d8584090d8df698ca2e94f4b4a6185766a6e9a6589a17cf5ec4dce875
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw ドキュメントマップ

このファイルは、エージェントがドキュメントツリーを移動しやすくするために、`docs/**/*.md` と `docs/**/*.mdx` の見出しから生成されています。
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
  - H2: 対応方法
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
  - H2: 外部 CLI 認証情報検出
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
  - H2: スケジュールタイプ
  - H3: 月の日付と曜日は OR ロジックを使用する
  - H2: ペイロード
  - H3: エージェントターンオプション
  - H3: コマンドペイロード
  - H2: 実行スタイル
  - H2: 配信と出力
  - H3: 失敗通知
  - H3: 出力言語
  - H2: CLI 例
  - H2: ジョブの管理
  - H2: Webhook
  - H3: 認証
  - H2: Gmail PubSub 連携
  - H3: ウィザードセットアップ（推奨）
  - H3: Gateway 自動起動
  - H3: 手動の一回限りセットアップ
  - H3: Gmail モデル上書き
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
  - H2: イベントタイプ
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
  - H2: Pluginフック
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
  - H3: 推定コミットメント
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
  - H2: 常設指示の構成
  - H2: 常設指示と Cron ジョブ
  - H2: 例
  - H3: 例 1: コンテンツとソーシャルメディア（週次サイクル）
  - H3: 例 2: 財務オペレーション（イベントトリガー）
  - H3: 例 3: 監視とアラート（継続）
  - H2: 実行・検証・報告パターン
  - H2: マルチプログラムアーキテクチャ
  - H2: ベストプラクティス
  - H3: 推奨
  - H3: 避けること
  - H2: 関連

## automation/taskflow.md

- ルート: /automation/taskflow
- 見出し:
  - H2: Task Flow を使うタイミング
  - H2: 同期モード
  - H3: 管理モード
  - H3: ミラーモード
  - H2: フローのステータス
  - H2: 永続状態とリビジョン追跡
  - H2: キャンセル動作
  - H2: CLI コマンド
  - H2: 信頼性の高いスケジュール済みワークフローパターン
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
  - H2: タスクと他のシステムの関係
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
  - H2: Discord チャネルのオーディエンス
  - H2: Plugin診断
  - H2: セキュリティメモ
  - H2: トラブルシューティング

## channels/ambient-room-events.md

- ルート: /channels/ambient-room-events
- 見出し:
  - H2: 推奨セットアップ
  - H2: 変更内容
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
  - H2: デフォルト
  - H2: 共有デフォルトを設定する
  - H2: チャネル、アカウント、またはルームごとに上書きする
  - H2: チャネルサポート

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
  - H3: セッション分離
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
  - H2: 関連

## channels/channel-routing.md

- ルート: /channels/channel-routing
- 見出し:
  - H1: チャネル &amp; ルーティング
  - H2: 主要用語
  - H2: 送信先ターゲットプレフィックス
  - H2: セッションキーの形（例）
  - H2: メイン DM ルートの固定
  - H2: ガード付き受信記録
  - H2: ルーティングルール（エージェントの選択方法）
  - H2: ブロードキャストグループ（複数のエージェントを実行）
  - H2: 設定概要
  - H2: セッションストレージ
  - H2: WebChat の動作
  - H2: 返信コンテキスト
  - H2: 関連

## channels/clickclack.md

- ルート: /channels/clickclack
- 見出し:
  - H2: クイックセットアップ
  - H3: アカウント設定キー
  - H2: 複数のボット
  - H2: 返信モード
  - H2: エージェントアクティビティ行
  - H2: ターゲット
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
  - H2: ネイティブコマンドとコマンド認可
  - H2: 機能詳細
  - H2: ツールとアクションゲート
  - H2: コンポーネント v2 UI
  - H2: 音声
  - H3: 音声チャネル
  - H3: 音声でユーザーをフォロー
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
  - H3: すべてのグループを許可し、@mention を不要にする
  - H3: すべてのグループを許可しつつ、@mention は引き続き必要にする
  - H3: 特定のグループのみ許可する
  - H3: グループ内の送信者を制限する
  - H2: グループ/ユーザー ID を取得する
  - H3: グループ ID（chatid、形式: ocxxx）
  - H3: ユーザー ID（openid、形式: ouxxx）
  - H2: 共通コマンド
  - H2: トラブルシューティング
  - H3: ボットがグループチャットで応答しない
  - H3: ボットがメッセージを受信しない
  - H3: QR セットアップが Feishu モバイルアプリで反応しない
  - H3: App Secret が漏えいした
  - H2: 高度な設定
  - H3: 複数のアカウント
  - H3: メッセージ制限
  - H3: ストリーミング
  - H3: クォータ最適化
  - H3: グループセッションスコープとトピックスレッド
  - H3: Feishu ワークスペースツール
  - H3: ACP セッション
  - H4: 永続 ACP バインディング
  - H4: チャットから ACP をスポーン
  - H3: マルチエージェントルーティング
  - H2: ユーザーごとのエージェント分離（動的エージェント作成）
  - H3: クイックセットアップ
  - H3: 仕組み
  - H3: 設定オプション
  - H3: セッションスコープ
  - H3: 一般的なマルチユーザーデプロイ
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
  - H2: Google Chat に追加する
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
  - H3: 有効化コマンド（所有者のみ）
  - H2: 使い方
  - H2: テスト / 検証
  - H2: 既知の考慮事項
  - H2: 関連

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
  - H2: メンションパターンのスコープ設定
  - H2: グループ/チャネルのツール制限（任意）
  - H2: グループ許可リスト
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
  - H2: imsg の役割
  - H2: 始める前に
  - H2: 設定の変換
  - H2: グループレジストリの落とし穴
  - H2: 手順
  - H2: アクションの同等性一覧
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
  - H3: SIP を有効のままにする場合
  - H2: アクセス制御とルーティング
  - H2: ACP 会話バインディング
  - H2: デプロイパターン
  - H2: メディア、チャンク化、配信ターゲット
  - H2: プライベート API アクション
  - H2: 設定書き込み
  - H2: 分割送信 DM の結合（1 つの作成内容にコマンド + URL）
  - H3: シナリオとエージェントが見る内容
  - H2: ブリッジまたは Gateway 再起動後の受信復旧
  - H3: オペレーターに見えるシグナル
  - H3: 移行
  - H2: トラブルシューティング
  - H2: 設定リファレンスの参照先
  - H2: 関連

## channels/index.md

- ルート: /channels
- 見出し:
  - H2: サポートされるチャネル
  - H2: 配信メモ
  - H2: メモ

## channels/irc.md

- ルート: /channels/irc
- 見出し:
  - H2: クイックスタート
  - H2: 接続設定
  - H2: セキュリティデフォルト
  - H2: アクセス制御
  - H3: よくある落とし穴: allowFrom は DM 用であり、チャネル用ではない
  - H2: 返信トリガー（メンション）
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
  - H2: チャンネルデータ（リッチメッセージ）
  - H2: ACP 対応
  - H2: 送信メディア
  - H2: トラブルシューティング
  - H2: 関連

## channels/location.md

- ルート: /channels/location
- 見出し:
  - H2: テキスト書式
  - H2: コンテキストフィールド
  - H2: チャンネルの注意事項
  - H2: 関連

## channels/matrix-migration.md

- ルート: /channels/matrix-migration
- 見出し:
  - H2: 移行が自動的に行うこと
  - H2: 移行が自動的に行えないこと
  - H2: 推奨アップグレードフロー
  - H2: 暗号化された移行の仕組み
  - H2: よくあるメッセージとその意味
  - H3: アップグレードと検出のメッセージ
  - H3: 暗号化状態の復旧メッセージ
  - H3: 手動復旧メッセージ
  - H3: カスタム Plugin インストールメッセージ
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
  - H2: 複数 Bot の注意事項
  - H2: ホームサーバーの注意事項
  - H2: 関連

## channels/matrix.md

- ルート: /channels/matrix
- 見出し:
  - H2: インストール
  - H2: セットアップ
  - H3: 対話型セットアップ
  - H3: 最小設定
  - H3: 自動参加
  - H3: 許可リストターゲット形式
  - H3: アカウント ID の正規化
  - H3: キャッシュされた認証情報
  - H3: 環境変数
  - H2: 設定例
  - H2: ストリーミングプレビュー
  - H2: 音声メッセージ
  - H2: 承認メタデータ
  - H3: 静かな確定済みプレビューのためのセルフホスト Push ルール
  - H2: Bot 間ルーム
  - H2: 暗号化と検証
  - H3: 暗号化を有効化
  - H3: ステータスと信頼シグナル
  - H3: リカバリーキーでこのデバイスを検証
  - H3: クロス署名のブートストラップまたは修復
  - H3: ルームキーのバックアップ
  - H3: 検証の一覧表示、リクエスト、応答
  - H3: 複数アカウントの注意事項
  - H2: プロフィール管理
  - H2: スレッド
  - H3: セッションルーティング（sessionScope）
  - H3: 返信スレッド化（threadReplies）
  - H3: スレッド継承とスラッシュコマンド
  - H2: ACP 会話バインディング
  - H3: スレッドバインディング設定
  - H2: リアクション
  - H2: 履歴コンテキスト
  - H2: コンテキストの可視性
  - H2: DM とルームポリシー
  - H2: ダイレクトルーム修復
  - H2: Exec 承認
  - H2: スラッシュコマンド
  - H2: 複数アカウント
  - H2: プライベート/LAN ホームサーバー
  - H2: Matrix トラフィックのプロキシ
  - H2: ターゲット解決
  - H2: 設定リファレンス
  - H3: アカウントと接続
  - H3: 暗号化
  - H3: アクセスとポリシー
  - H3: 返信動作
  - H3: リアクション設定
  - H3: ツール機能とルームごとの上書き
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
  - H2: チャンネル（グループ）
  - H2: 送信配信のターゲット
  - H2: DM チャンネルの再試行
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
  - H2: 設定の書き込み
  - H2: アクセス制御（DM + グループ）
  - H3: 仕組み
  - H3: ステップ 1: Azure Bot を作成
  - H3: ステップ 2: 認証情報を取得
  - H3: ステップ 3: メッセージングエンドポイントを設定
  - H3: ステップ 4: Teams チャンネルを有効化
  - H3: ステップ 5: Teams アプリマニフェストをビルド
  - H3: ステップ 6: OpenClaw を設定
  - H3: ステップ 7: Gateway を実行
  - H2: フェデレーション認証（証明書とマネージド ID）
  - H3: オプション A: 証明書ベース認証
  - H3: オプション B: Azure Managed Identity
  - H3: AKS Workload Identity セットアップ
  - H3: 認証タイプ比較
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
  - H3: Teams RSC + Microsoft Graph Application 権限の場合
  - H3: RSC vs Graph API
  - H2: Graph 対応メディア + 履歴（チャンネルに必要）
  - H2: 既知の制限
  - H3: Webhook タイムアウト
  - H3: Teams クラウドとサービス URL 対応
  - H3: 書式
  - H2: 設定
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
  - H2: チームとチャンネル ID（よくある落とし穴）
  - H2: プライベートチャンネル
  - H2: トラブルシューティング
  - H3: よくある問題
  - H3: マニフェストアップロードエラー
  - H3: RSC 権限が機能しない
  - H2: リファレンス
  - H2: 関連

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
  - H2: 関連

## channels/nostr.md

- ルート: /channels/nostr
- 見出し:
  - H2: インストール
  - H3: 非対話型セットアップ
  - H2: クイックセットアップ
  - H2: 設定リファレンス
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
  - H3: Control UI からペアリング（推奨）
  - H3: Telegram 経由でペアリング
  - H3: Node デバイスを承認
  - H3: 任意の信頼済み CIDR Node 自動承認
  - H3: Node ペアリング状態ストレージ
  - H3: 注意事項
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
  - H3: アクセスポリシー
  - H3: 複数アカウントセットアップ
  - H3: グループチャット
  - H3: 音声（STT / TTS）
  - H2: ターゲット形式
  - H2: スラッシュコマンド
  - H2: メディアとストレージ
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
  - H2: 番号モデル（最初に読む）
  - H2: インストール
  - H2: クイックセットアップ
  - H2: 概要
  - H2: セットアップパス A: 既存の Signal アカウントをリンク（QR）
  - H2: セットアップパス B: 専用 Bot 番号を登録（SMS、Linux）
  - H2: 外部デーモンモード（httpUrl）
  - H2: コンテナモード（bbernhard/signal-cli-rest-api）
  - H2: アクセス制御（DM + グループ）
  - H2: 仕組み（動作）
  - H2: メディア + 制限
  - H2: 入力中表示 + 既読通知
  - H2: ライフサイクルステータスリアクション
  - H2: リアクション（メッセージツール）
  - H2: 承認リアクション
  - H2: 配信ターゲット（CLI/cron）
  - H2: エイリアス
  - H2: トラブルシューティング
  - H2: セキュリティ注意事項
  - H2: 設定リファレンス（Signal）
  - H2: 関連

## channels/slack.md

- ルート: /channels/slack
- 見出し:
  - H2: トランスポートの選択
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
  - H2: 入力中リアクションフォールバック
  - H2: メディア、分割、配信
  - H2: コマンドとスラッシュ動作
  - H2: インタラクティブ返信
  - H3: Plugin 所有のモーダル送信
  - H2: Slack のネイティブ承認
  - H2: イベントと運用動作
  - H2: 設定リファレンス
  - H2: トラブルシューティング
  - H2: 添付ファイルビジョンリファレンス
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
  - H2: 設定例
  - H3: 設定ファイル
  - H3: 環境変数
  - H3: SecretRef 認証トークン
  - H3: Messaging Service 送信者
  - H3: デフォルト送信ターゲット
  - H2: アクセス制御
  - H2: SMS の送信
  - H2: セットアップを検証
  - H3: macOS iMessage/SMS からのエンドツーエンドテスト
  - H2: Webhook セキュリティ
  - H2: 複数アカウント設定
  - H2: トラブルシューティング
  - H3: Twilio が 403 を返す、または OpenClaw が Webhook を拒否する
  - H3: ペアリングリクエストが表示されない
  - H3: 送信に失敗する
  - H3: メッセージは届くがエージェントが応答しない

## channels/synology-chat.md

- ルート: /channels/synology-chat
- 見出し:
  - H2: インストール
  - H2: クイックセットアップ
  - H2: 環境変数
  - H2: DM ポリシーとアクセス制御
  - H2: 送信配信
  - H2: 複数アカウント
  - H2: セキュリティ注意事項
  - H2: トラブルシューティング
  - H2: 関連

## channels/telegram.md

- ルート: /channels/telegram
- 見出し:
  - H2: クイックセットアップ
  - H2: Telegram 側の設定
  - H2: アクセス制御と有効化
  - H3: グループ Bot ID
  - H2: ランタイム動作
  - H2: 機能リファレンス
  - H2: エラー返信制御
  - H2: トラブルシューティング
  - H2: 設定リファレンス
  - H2: 関連

## channels/tlon.md

- ルート: /channels/tlon
- 見出し:
  - H2: バンドル Plugin
  - H2: セットアップ
  - H2: プライベート/LAN シップ
  - H2: グループチャンネル
  - H2: アクセス制御
  - H2: オーナーと承認システム
  - H2: 自動承認設定
  - H2: Urbit 設定ストア経由のホットリロード
  - H2: 配信ターゲット（CLI/cron）
  - H2: バンドル Skills
  - H2: 機能
  - H2: トラブルシューティング
  - H2: 設定リファレンス
  - H2: 注意事項
  - H2: 関連

## channels/troubleshooting.md

- ルート: /channels/troubleshooting
- 見出し:
  - H2: コマンドラダー
  - H2: 更新後
  - H2: WhatsApp
  - H3: WhatsApp の失敗シグネチャ
  - H2: Telegram
  - H3: Telegram の失敗シグネチャ
  - H2: Discord
  - H3: Discord の失敗シグネチャ
  - H2: Slack
  - H3: Slack の失敗シグネチャ
  - H2: iMessage
  - H3: iMessage の失敗シグネチャ
  - H2: Signal
  - H3: Signal の失敗シグネチャ
  - H2: QQ Bot
  - H3: QQ Bot の失敗シグネチャ
  - H2: Matrix
  - H3: Matrix の失敗シグネチャ
  - H2: 関連

## channels/twitch.md

- ルート: /channels/twitch
- 見出し:
  - H2: インストール
  - H2: クイックセットアップ
  - H2: 概要
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
  - H2: インストール
  - H2: クイックセットアップ
  - H2: デプロイパターン
  - H2: ランタイムモデル
  - H2: MeowCaller で現在のリクエスト元に電話する（実験的）
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
  - H2: ツール、アクション、設定書き込み
  - H2: トラブルシューティング
  - H2: システムプロンプト
  - H2: 設定リファレンスへのポインター
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
  - H2: 一般的なコマンド
  - H2: トラブルシューティング
  - H2: 高度な設定
  - H3: 複数アカウント
  - H3: メッセージ制限
  - H3: ストリーミング
  - H3: グループチャット履歴コンテキスト
  - H3: 返信先モード
  - H3: Markdown ヒント注入
  - H3: デバッグモード
  - H3: 複数エージェントルーティング
  - H2: 設定リファレンス
  - H2: 対応メッセージタイプ
  - H2: 関連

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
  - H2: ロングポーリングと Webhook
  - H2: 対応メッセージタイプ
  - H2: 機能
  - H2: 配信先（CLI/cron）
  - H2: トラブルシューティング
  - H2: 設定リファレンス
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
  - H2: 内部の仕組み
  - H2: トラブルシューティング
  - H2: 関連

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
  - H3: グループメンションによる制御
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
  - H2: OpenClaw パフォーマンス
  - H2: フルリリース検証
  - H2: ライブと E2E シャード
  - H2: パッケージ受け入れ
  - H3: ジョブ
  - H3: 候補ソース
  - H3: スイートプロファイル
  - H3: レガシー互換期間
  - H3: 例
  - H2: インストールスモーク
  - H2: ローカル Docker E2E
  - H3: 調整項目
  - H3: 再利用可能なライブ/E2E ワークフロー
  - H3: リリースパスのチャンク
  - H2: Plugin プレリリース
  - H2: QA ラボ
  - H2: CodeQL
  - H3: セキュリティカテゴリ
  - H3: プラットフォーム固有のセキュリティシャード
  - H3: 重要品質カテゴリ
  - H2: メンテナンスワークフロー
  - H3: Docs Agent
  - H3: テストパフォーマンスエージェント
  - H3: マージ後の重複 PR
  - H2: ローカルチェックゲートと変更ルーティング
  - H2: Testbox 検証
  - H2: 関連

## clawhub/cli.md

- ルート: /clawhub/cli
- 見出し:
  - H1: ClawHub CLI
  - H2: 検出とインストール
  - H3: リリースの信頼性
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
  - H3: パッケージスコープは選択したオーナーと一致する必要があります

## cli/acp.md

- ルート: /cli/acp
- 見出し:
  - H2: これではないもの
  - H2: 互換性マトリクス
  - H2: 既知の制限
  - H2: 使用方法
  - H2: ACP クライアント（デバッグ）
  - H2: プロトコルスモークテスト
  - H2: これの使い方
  - H2: エージェントの選択
  - H2: acpx から使用（Codex、Claude、その他の ACP クライアント）
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
  - H2: コマンド面
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents set-identity
  - H3: agents delete &lt;id&gt;
  - H2: ルーティングバインディング
  - H3: --bind 形式
  - H3: バインディングスコープの動作
  - H2: ID ファイル
  - H2: ID を設定
  - H2: 関連

## cli/approvals.md

- ルート: /cli/approvals
- 見出し:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: 一般的なコマンド
  - H2: ファイルから承認を置き換える
  - H2: 「Never prompt」 / YOLO の例
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
  - H2: ログインとログアウト（対話型）
  - H2: トラブルシューティング
  - H2: 機能プローブ
  - H2: 名前を ID に解決
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
  - H2: インストールフロー
  - H2: 注記
  - H2: 関連

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
  - H2: config set モード
  - H3: プロバイダービルダーフラグ
  - H2: config patch
  - H2: ドライラン
  - H3: JSON 出力形状
  - H2: 変更の適用
  - H2: 書き込み安全性
  - H2: 修復ループ
  - H2: 関連

## cli/configure.md

- ルート: /cli/configure
- 見出し:
  - H1: openclaw configure
  - H2: オプション
  - H2: モデルセクション
  - H2: Web セクション
  - H2: その他の注記
  - H2: 関連

## cli/crestodian.md

- ルート: /cli/crestodian
- 見出し:
  - H1: openclaw crestodian
  - H2: 開始タイミング
  - H2: Crestodian が表示する内容
  - H2: 例
  - H2: 操作と承認
  - H2: セットアップブートストラップ
  - H2: モデル支援プランナー
  - H3: CLI ハーネスの信頼モデル
  - H2: エージェントへの切り替え
  - H2: メッセージ救済モード
  - H2: 関連

## cli/cron.md

- ルート: /cli/cron
- 見出し:
  - H1: openclaw cron
  - H2: ジョブをすばやく作成
  - H2: セッション
  - H2: 配信
  - H3: 配信の所有権
  - H3: 失敗時の配信
  - H2: スケジューリング
  - H3: 単発ジョブ
  - H3: 繰り返しジョブ
  - H3: 手動実行
  - H2: モデル
  - H3: 分離された cron モデルの優先順位
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
  - H2: サブコマンドとオプション
  - H2: 注記
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
  - H2: 一般的なオプション
  - H2: コマンド
  - H3: openclaw devices list
  - H3: openclaw devices approve [requestId] [--latest]
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: 注記
  - H2: トークンドリフト復旧チェックリスト
  - H2: Paperclip / openclawgateway 初回実行承認
  - H2: 関連

## cli/directory.md

- ルート: /cli/directory
- 見出し:
  - H1: openclaw directory
  - H2: 共通フラグ
  - H2: 注記
  - H2: 結果をメッセージ送信で使用する
  - H2: チャネル別 ID 形式
  - H2: 自分（"me"）
  - H2: ピア（連絡先/ユーザー）
  - H2: グループ
  - H2: 関連

## cli/dns.md

- ルート: /cli/dns
- 見出し:
  - H1: openclaw dns
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
  - H2: ポスチャ
  - H2: 例
  - H2: オプション
  - H2: Lint モード
  - H2: 構造化ヘルスチェック
  - H2: チェックの選択
  - H2: アップグレード後モード
  - H2: 注記
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
  - H2: Gateway を実行
  - H3: オプション
  - H2: Gateway を再起動
  - H3: Gateway プロファイリング
  - H2: 実行中の Gateway に問い合わせ
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: SSH 経由のリモート（Mac アプリ同等）
  - H3: gateway call &lt;method&gt;
  - H2: Gateway サービスを管理
  - H3: ラッパーでインストール
  - H2: Gateway を検出（Bonjour）
  - H3: gateway discover
  - H2: 関連

## cli/health.md

- ルート: /cli/health
- 見出し:
  - H1: openclaw health
  - H2: オプション
  - H2: 動作
  - H2: 関連

## cli/hooks.md

- ルート: /cli/hooks
- 見出し:
  - H1: openclaw hooks
  - H2: フック一覧
  - H2: フック情報を取得
  - H2: 適格性を確認
  - H2: フックを有効化
  - H2: フックを無効化
  - H2: フックパックのインストールと更新
  - H2: 同梱フック
  - H3: command-logger ログファイル
  - H2: 注記
  - H2: 関連

## cli/index.md

- ルート: /cli
- 見出し:
  - H2: コマンドページ
  - H2: グローバルフラグ
  - H2: 出力モード
  - H2: カラーパレット
  - H2: コマンドツリー
  - H2: チャットスラッシュコマンド
  - H2: 使用状況トラッキング
  - H2: 関連

## cli/infer.md

- ルート: /cli/infer
- 見出し:
  - H2: infer を skill に変換する
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
  - H2: 一般的な落とし穴
  - H2: 関連

## cli/logs.md

- ルート: /cli/logs
- 見出し:
  - H1: openclaw logs
  - H2: オプション
  - H2: 共有 Gateway RPC オプション
  - H2: 例
  - H2: フォールバックとリカバリ動作
  - H2: 関連

## cli/mcp.md

- ルート: /cli/mcp
- 見出し:
  - H2: 適切な MCP パスを選択する
  - H2: MCP サーバーとしての OpenClaw
  - H3: serve を使う場合
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
  - H3: 保存済み MCP サーバー定義
  - H3: 一般的なサーバーレシピ
  - H3: JSON 出力形状
  - H3: Stdio トランスポート
  - H3: SSE / HTTP トランスポート
  - H3: OAuth ワークフロー
  - H3: Streamable HTTP トランスポート
  - H2: Control UI
  - H2: 現在の制限
  - H2: 関連

## cli/memory.md

- ルート: /cli/memory
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
  - H2: SecretRef Gateway 依存関係
  - H2: 関連

## cli/message.md

- ルート: /cli/message
- 見出し:
  - H1: openclaw message
  - H2: チャンネル選択
  - H2: ターゲット形式 (-t, --target)
  - H2: 共通フラグ
  - H2: SecretRef 解決
  - H2: アクション
  - H3: コア
  - H3: 送信
  - H3: ポーリング
  - H3: スレッド
  - H3: 絵文字
  - H3: ステッカー
  - H3: ロール、チャンネル、音声、イベント (Discord)
  - H3: モデレーション (Discord)
  - H3: ブロードキャスト
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
  - H3: サポートされる .env キー
  - H3: アーカイブ専用状態
  - H3: 適用後
  - H2: Plugin コントラクト
  - H2: オンボーディング統合
  - H2: 関連

## cli/models.md

- ルート: /cli/models
- 見出し:
  - H1: openclaw models
  - H2: 共通コマンド
  - H3: ステータス
  - H3: 一覧
  - H3: デフォルト / 画像モデルを設定
  - H3: スキャン
  - H2: エイリアス
  - H2: フォールバック
  - H2: 認証プロファイル
  - H2: 関連

## cli/node.md

- ルート: /cli/node
- 見出し:
  - H1: openclaw node
  - H2: node ホストを使う理由
  - H2: ブラウザプロキシ (ゼロ設定)
  - H2: 実行 (フォアグラウンド)
  - H2: node ホスト向け Gateway 認証
  - H2: サービス (バックグラウンド)
  - H2: ペアリング
  - H2: Exec 承認
  - H2: 関連

## cli/nodes.md

- ルート: /cli/nodes
- 見出し:
  - H1: openclaw nodes
  - H2: ステータス
  - H2: ペアリング
  - H2: 呼び出し
  - H2: 通知、プッシュ、位置情報、画面
  - H2: 関連

## cli/onboard.md

- ルート: /cli/onboard
- 見出し:
  - H1: openclaw onboard
  - H2: 例
  - H2: リセット
  - H2: ロケール
  - H2: 非対話セットアップ
  - H3: Gateway 認証 (非対話)
  - H3: ローカル Gateway ヘルス
  - H3: 対話型 ref モード
  - H3: Z.AI エンドポイントの選択肢
  - H2: 追加の非対話フラグ
  - H2: プロバイダーの事前フィルタリング
  - H2: Web 検索のフォローアップ
  - H2: その他の動作
  - H2: 一般的なフォローアップコマンド

## cli/pairing.md

- ルート: /cli/pairing
- 見出し:
  - H1: openclaw pairing
  - H2: コマンド
  - H2: pairing list
  - H2: pairing approve
  - H3: オーナーブートストラップ
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
  - H2: 注記
  - H2: 関連

## cli/plugins.md

- ルート: /cli/plugins
- 見出し:
  - H2: コマンド
  - H2: 作成者
  - H3: プロバイダースキャフォールド
  - H2: インストール
  - H3: マーケットプレイス短縮記法
  - H2: 一覧
  - H3: Plugin インデックス
  - H2: アンインストール
  - H2: 更新
  - H2: 検査
  - H2: Doctor
  - H2: レジストリ
  - H2: マーケットプレイス
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
  - H4: Exec 承認
  - H4: 認証プロファイル
  - H4: ツールメタデータ
  - H4: ツール姿勢
  - H2: チェックの実行
  - H2: ポリシーの設定
  - H2: ポリシー状態の受け入れ
  - H2: 検出結果
  - H2: 修復
  - H2: 終了コード
  - H2: 関連

## cli/proxy.md

- ルート: /cli/proxy
- 見出し:
  - H1: openclaw proxy
  - H2: 検証
  - H3: オプション
  - H2: デバッグプロキシ
  - H2: 関連

## cli/qr.md

- ルート: /cli/qr
- 見出し:
  - H1: openclaw qr
  - H2: オプション
  - H2: セットアップコードの内容
  - H2: Gateway URL 解決
  - H2: 認証解決 (no --remote)
  - H2: 認証解決 (--remote)
  - H2: 関連

## cli/reset.md

- ルート: /cli/reset
- 見出し:
  - H1: openclaw reset
  - H2: オプション
  - H2: スコープ
  - H2: 注記
  - H2: 関連

## cli/sandbox.md

- ルート: /cli/sandbox
- 見出し:
  - H2: コマンド
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H3: openclaw sandbox explain
  - H2: recreate が必要な理由
  - H2: 一般的なトリガー
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
  - H3: Exec プロバイダーの安全性
  - H2: 保存済みプランを適用
  - H3: ロールバックバックアップがない理由
  - H2: 例
  - H2: 関連

## cli/security.md

- ルート: /cli/security
- 見出し:
  - H1: openclaw security
  - H2: 監査モード
  - H2: チェック内容
  - H2: SecretRef 動作
  - H2: 抑制
  - H2: JSON 出力
  - H2: --fix が変更する内容
  - H2: 関連

## cli/sessions.md

- ルート: /cli/sessions
- 見出し:
  - H1: openclaw sessions
  - H2: 軌跡の進捗を tail する
  - H2: 軌跡バンドルをエクスポート
  - H2: クリーンアップ保守
  - H2: セッションをコンパクト化
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
  - H2: セッションとモデル解決
  - H2: 使用量とクォータ
  - H2: 概要と更新ステータス
  - H2: シークレット
  - H2: メモリ
  - H2: 関連

## cli/system.md

- ルート: /cli/system
- 見出し:
  - H1: openclaw system
  - H2: 共通コマンド
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
  - H2: 1 日あたり多数のセッション
  - H2: 要約の欠落
  - H2: 設定

## cli/tui.md

- ルート: /cli/tui
- 見出し:
  - H1: openclaw tui
  - H2: オプション
  - H2: 注記
  - H2: 例
  - H2: 設定修復ループ
  - H2: 関連

## cli/uninstall.md

- ルート: /cli/uninstall
- 見出し:
  - H1: openclaw uninstall
  - H2: オプション
  - H2: 例
  - H2: 注記
  - H2: 関連

## cli/update.md

- ルート: /cli/update
- 見出し:
  - H1: openclaw update
  - H2: 使用方法
  - H2: オプション
  - H2: update status
  - H2: update repair
  - H2: update ウィザード
  - H2: 実行内容
  - H3: 再起動ハンドオフ
  - H3: コントロールプレーン応答形状
  - H2: Git チェックアウトフロー
  - H3: チャンネル選択
  - H3: 更新手順
  - H3: Plugin 同期の詳細
  - H2: 関連

## cli/voicecall.md

- ルート: /cli/voicecall
- 見出し:
  - H1: openclaw voicecall
  - H2: サブコマンド
  - H2: セットアップと smoke
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
  - H2: 関連

## cli/wiki.md

- ルート: /cli/wiki
- 見出し:
  - H1: openclaw wiki
  - H2: 共通コマンド
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
  - H3: Dispatch が data-only と言う
  - H3: Dispatch が何も開始しない
  - H2: 関連

## concepts/active-memory.md

- ルート: /concepts/active-memory
- 見出し:
  - H2: クイックスタート
  - H2: 仕組み
  - H2: 実行タイミング
  - H3: セッションタイプ
  - H2: セッショントグル
  - H2: 表示方法
  - H2: クエリモード
  - H2: プロンプトスタイル
  - H2: モデルフォールバックポリシー
  - H3: 速度の推奨事項
  - H4: Cerebras セットアップ
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
  - H2: 実行シーケンス
  - H2: キューイングと並行処理
  - H2: セッションとワークスペースの準備
  - H2: プロンプト組み立て
  - H2: フック
  - H3: 内部フック (Gateway フック)
  - H3: Plugin フック
  - H2: ストリーミング
  - H2: ツール実行
  - H2: 返信整形
  - H2: Compaction とリトライ
  - H2: イベントストリーム
  - H2: チャットチャンネル処理
  - H2: タイムアウト
  - H3: 停滞セッション診断
  - H2: 早期終了する場所
  - H2: 関連

## concepts/agent-runtimes.md

- ルート: /concepts/agent-runtimes
- 見出し:
  - H2: Codex サーフェス
  - H2: ランタイム所有権
  - H2: ランタイム選択
  - H2: GitHub Copilot エージェントランタイム
  - H2: 互換性コントラクト
  - H2: ステータスラベル
  - H2: 関連

## concepts/agent-workspace.md

- ルート: /concepts/agent-workspace
- 見出し:
  - H2: デフォルトの場所
  - H2: 追加ワークスペースフォルダー
  - H2: ワークスペースファイルマップ
  - H2: ワークスペースに含まれないもの
  - H2: Git バックアップ (推奨、プライベート)
  - H2: シークレットをコミットしない
  - H2: ワークスペースを新しいマシンへ移動する
  - H2: 高度な注記
  - H2: 関連

## concepts/agent.md

- ルート: /concepts/agent
- 見出し:
  - H2: ワークスペース（必須）
  - H2: Bootstrapファイル（注入）
  - H2: 組み込みツール
  - H2: Skills
  - H2: ランタイム境界
  - H2: セッション
  - H2: ストリーミング中の制御
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
  - H3: Nodes（macOS / iOS / Android / ヘッドレス）
  - H3: WebChat
  - H2: 接続ライフサイクル（単一クライアント）
  - H2: ワイヤプロトコル（概要）
  - H2: ペアリングとローカル信頼
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
  - H2: 変わること
  - H2: 変わらないこと
  - H2: トラブルシューティング

## concepts/commitments.md

- ルート: /concepts/commitments
- 見出し:
  - H2: コミットメントを有効にする
  - H2: 仕組み
  - H2: スコープ
  - H2: コミットメントとリマインダー
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
  - H3: 別のモデルを使う
  - H3: 識別子の保持
  - H3: アクティブなトランスクリプトのバイトガード
  - H3: 後続トランスクリプト
  - H3: Compaction通知
  - H3: メモリフラッシュ
  - H2: プラグ可能なCompactionプロバイダー
  - H2: Compactionとプルーニング
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
  - H3: ContextEngineインターフェイス
  - H3: ランタイム設定
  - H3: ホスト要件
  - H3: 障害の隔離
  - H3: ownsCompaction
  - H2: 設定リファレンス
  - H2: Compactionとメモリとの関係
  - H2: ヒント
  - H2: 関連

## concepts/context.md

- ルート: /concepts/context
- 見出し:
  - H2: クイックスタート（コンテキストを調べる）
  - H2: 出力例
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: コンテキストウィンドウに含まれるもの
  - H2: OpenClawがシステムプロンプトを構築する仕組み
  - H2: 注入されるワークスペースファイル（プロジェクトコンテキスト）
  - H2: Skills: 注入とオンデマンド読み込み
  - H2: ツール: 2種類のコスト
  - H2: コマンド、ディレクティブ、「インラインショートカット」
  - H2: セッション、Compaction、プルーニング（永続化されるもの）
  - H2: /contextが実際に報告する内容
  - H2: 関連

## concepts/delegate-architecture.md

- ルート: /concepts/delegate-architecture
- 見出し:
  - H2: デリゲートとは
  - H2: デリゲートを使う理由
  - H2: ケイパビリティ階層
  - H3: 階層1: 読み取り専用 + 下書き
  - H3: 階層2: 代理送信
  - H3: 階層3: プロアクティブ
  - H2: 前提条件: 隔離と堅牢化
  - H3: ハードブロック（交渉不可）
  - H3: ツール制限
  - H3: サンドボックス隔離
  - H3: 監査証跡
  - H2: デリゲートを設定する
  - H3: 1. デリゲートエージェントを作成する
  - H3: 2. IDプロバイダーの委任を設定する
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
  - H2: Dreamingが書き込む内容
  - H2: フェーズモデル
  - H2: セッショントランスクリプトの取り込み
  - H2: ドリームダイアリー
  - H2: ディープランキングシグナル
  - H3: QAシャドウトライアルレポートのカバレッジ
  - H2: スケジューリング
  - H2: クイックスタート
  - H2: スラッシュコマンド
  - H2: CLIワークフロー
  - H2: 主要なデフォルト
  - H2: Dreams UI
  - H2: 関連

## concepts/experimental-features.md

- ルート: /concepts/experimental-features
- 見出し:
  - H2: 現在ドキュメント化されているフラグ
  - H2: ローカルモデルのリーンモード
  - H3: これら3つのツールを選ぶ理由
  - H3: 有効にするタイミング
  - H3: 無効のままにするタイミング
  - H3: 有効化
  - H2: 実験的は非表示を意味しない
  - H2: 関連

## concepts/features.md

- ルート: /concepts/features
- 見出し:
  - H2: ハイライト
  - H2: 全リスト
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
  - H2: 所有権
  - H2: CLIコマンド
  - H3: discord-smoke
  - H3: run
  - H3: desktop-browser-smoke
  - H3: slack-desktop-smoke
  - H3: telegram-desktop-builder
  - H2: エビデンスマニフェスト
  - H2: GitHub自動化
  - H2: マシンとシークレット
  - H2: 実行結果
  - H2: シナリオを追加する
  - H2: 未解決の質問

## concepts/markdown-formatting.md

- ルート: /concepts/markdown-formatting
- 見出し:
  - H2: パイプライン
  - H2: IR例
  - H2: テーブル処理
  - H2: チャンク化ルール
  - H2: リンクポリシー
  - H2: スポイラー
  - H2: チャネルフォーマッターを追加または更新する
  - H2: よくある落とし穴
  - H2: 関連

## concepts/memory-builtin.md

- ルート: /concepts/memory-builtin
- 見出し:
  - H2: 提供するもの
  - H2: はじめに
  - H2: サポートされる埋め込みプロバイダー
  - H2: インデックス作成の仕組み
  - H2: 使用するタイミング
  - H2: トラブルシューティング
  - H2: 設定
  - H2: 関連

## concepts/memory-honcho.md

- ルート: /concepts/memory-honcho
- 見出し:
  - H2: 提供するもの
  - H2: 利用可能なツール
  - H2: はじめに
  - H2: 設定
  - H2: 既存メモリの移行
  - H2: 仕組み
  - H2: Honchoと組み込みメモリ
  - H2: CLIコマンド
  - H2: 参考情報
  - H2: 関連

## concepts/memory-qmd.md

- ルート: /concepts/memory-qmd
- 見出し:
  - H2: 組み込み機能に追加されるもの
  - H2: はじめに
  - H3: 前提条件
  - H3: 有効化
  - H2: サイドカーの仕組み
  - H2: 検索性能と互換性
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
  - H2: サポートされるプロバイダー
  - H2: 検索の仕組み
  - H2: 検索品質の改善
  - H3: 時間減衰
  - H3: MMR（多様性）
  - H3: 両方を有効にする
  - H2: マルチモーダルメモリ
  - H2: セッションメモリ検索
  - H2: トラブルシューティング
  - H2: 関連

## concepts/memory.md

- ルート: /concepts/memory
- 見出し:
  - H2: 仕組み
  - H2: 何をどこに置くか
  - H2: アクションに応じたメモリ
  - H2: 推論されたコミットメント
  - H2: メモリツール
  - H2: メモリ検索
  - H2: メモリバックエンド
  - H2: ナレッジWikiレイヤー
  - H2: 自動メモリフラッシュ
  - H2: Dreaming
  - H2: 根拠付きバックフィルとライブ昇格
  - H2: CLI
  - H2: 参考情報

## concepts/message-lifecycle-refactor.md

- ルート: /concepts/message-lifecycle-refactor
- 見出し:
  - H2: このリファクタリングが行われた理由
  - H2: リリースされた内容
  - H3: 送信コンテキスト
  - H3: 受信コンテキスト
  - H3: ライブプレビュー
  - H3: 永続的な受信確認
  - H3: 公開SDKの削減
  - H2: 実装が元の設計から逸脱した箇所
  - H2: 具体的な移行上の危険（現在も関連）
  - H2: 障害分類
  - H2: 未解決の質問
  - H2: 関連

## concepts/messages.md

- ルート: /concepts/messages
- 見出し:
  - H2: インバウンド重複排除
  - H2: インバウンドデバウンス
  - H2: セッションとデバイス
  - H2: プロンプト本文と履歴コンテキスト
  - H2: ツール結果メタデータ
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
  - H3: セッション固定（キャッシュに優しい）
  - H3: OpenAI CodexサブスクリプションとAPIキーのバックアップ
  - H2: クールダウン
  - H2: 課金による無効化
  - H2: モデルフォールバック
  - H3: 候補チェーンルール
  - H3: フォールバックを進めるエラー
  - H3: クールダウンスキップとプローブ動作
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
  - H3: Google Gemini（APIキー）
  - H3: Google VertexとGemini CLI
  - H3: Z.AI（GLM）
  - H3: Vercel AI Gateway
  - H3: その他のバンドル済みプロバイダーPlugin
  - H4: 知っておく価値のある癖
  - H2: models.providers経由のプロバイダー（カスタム/ベースURL）
  - H3: Moonshot AI（Kimi）
  - H3: Kimi Coding
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
  - H2: 選択順序
  - H2: 選択ソースとフォールバックの厳密性
  - H2: クイックモデルポリシー
  - H2: オンボーディング
  - H2: 「Model is not allowed」（および返信が停止する理由）
  - H2: チャット内の/model
  - H2: CLI
  - H2: モデルレジストリ（models.json）
  - H2: 関連

## concepts/multi-agent.md

- ルート: /concepts/multi-agent
- 見出し:
  - H2: 1つのエージェントとは
  - H2: パス
  - H3: 単一エージェントモード（デフォルト）
  - H2: エージェントヘルパー
  - H2: クイックスタート
  - H2: 複数のエージェント、複数のペルソナ
  - H2: エージェント横断QMDメモリ検索
  - H2: 1つのWhatsApp番号、複数人（DM分割）
  - H2: ルーティングルール
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
  - H2: Anthropic Claude CLIの再利用
  - H2: OAuth交換（ログインの仕組み）
  - H3: Anthropic setup-token
  - H3: OpenAI Codex（ChatGPT OAuth）
  - H2: リフレッシュ + 有効期限
  - H2: 複数アカウント（プロファイル）+ ルーティング
  - H3: 1) 推奨: エージェントを分ける
  - H3: 2) 高度: 1つのエージェントで複数プロファイル
  - H2: 関連

## concepts/parallel-specialist-lanes.md

- ルート: /concepts/parallel-specialist-lanes
- 見出し:
  - H2: 第一原則
  - H2: 推奨ロールアウト
  - H3: フェーズ1: レーン契約 + バックグラウンドの重い作業
  - H3: フェーズ2: 優先度と同時実行制御
  - H3: フェーズ3: コーディネーター / トラフィックコントローラー
  - H2: 最小レーン契約テンプレート
  - H2: 関連

## concepts/personal-agent-benchmark-pack.md

- ルート: /concepts/personal-agent-benchmark-pack
- 見出し:
  - H2: シナリオ
  - H2: プライバシーモデル
  - H2: パックを拡張する

## concepts/presence.md

- ルート: /concepts/presence
- 見出し:
  - H2: プレゼンスフィールド（表示されるもの）
  - H2: プロデューサー（プレゼンスの発生元）
  - H3: 1) Gatewayの自己エントリ
  - H3: 2) WebSocket接続
  - H4: 1回限りのCLIコマンドが表示されない理由
  - H3: 3) system-eventビーコン
  - H3: 4) Node接続（role: node）
  - H2: マージ + 重複排除ルール（instanceIdが重要な理由）
  - H2: TTLと制限付きサイズ
  - H2: リモート/トンネルの注意点（loopback IP）
  - H2: コンシューマー
  - H3: macOSインスタンスタブ
  - H2: デバッグのヒント
  - H2: 関連

## concepts/progress-drafts.md

- ルート: /concepts/progress-drafts
- 見出し:
  - H2: クイックスタート
  - H2: ユーザーに表示される内容
  - H2: モードを選択する
  - H2: ラベルを設定する
  - H2: 進行状況行を制御する
  - H3: 詳細モード
  - H3: コマンド/exec テキスト
  - H3: commentary レーン
  - H3: 行数制限
  - H3: リッチレンダリング（Slack）
  - H3: ツール/タスク行を非表示にする
  - H2: チャネルの動作
  - H2: ファイナライズ
  - H2: トラブルシューティング
  - H2: 関連

## concepts/qa-e2e-automation.md

- ルート: /concepts/qa-e2e-automation
- 見出し:
  - H2: コマンドサーフェス
  - H3: プロファイルに基づく qa run
  - H2: オペレーターのフロー
  - H3: オブザーバビリティスモーク
  - H3: マトリックススモークレーン
  - H3: Discord Mantis シナリオ
  - H3: Mantis Slack デスクトップとビジュアルタスクランナー
  - H3: 認証情報プールのヘルスチェック
  - H2: ライブトランスポートのカバレッジ
  - H2: Discord、Slack、Telegram、WhatsApp QA リファレンス
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
  - H3: チャネルを追加する
  - H3: シナリオヘルパー名
  - H2: レポート
  - H2: 関連ドキュメント

## concepts/qa-matrix.md

- ルート: /concepts/qa-matrix
- 見出し:
  - H2: クイックスタート
  - H2: レーンが行うこと
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
  - H2: バーストの例
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
  - H2: 操作とストリーミング
  - H2: 優先順位
  - H2: セッションごとのオーバーライド
  - H2: キュー済みターンのキャンセル
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
  - H2: レガシー画像クリーンアップ
  - H2: スマートデフォルト
  - H2: 有効化または無効化
  - H2: プルーニングと Compaction
  - H2: 詳細情報
  - H2: 関連

## concepts/session-tool.md

- ルート: /concepts/session-tool
- 見出し:
  - H2: 利用可能なツール
  - H2: セッションの一覧表示と読み取り
  - H2: セッション間メッセージの送信
  - H2: ステータスとオーケストレーションヘルパー
  - H2: サブエージェントの生成
  - H2: 可視性
  - H2: 詳細情報
  - H2: 関連

## concepts/session.md

- ルート: /concepts/session
- 見出し:
  - H2: メッセージのルーティング方法
  - H2: DM の分離
  - H3: Dock にリンクされたチャネル
  - H2: セッションライフサイクル
  - H2: 状態の保存場所
  - H2: セッションメンテナンス
  - H2: セッションの検査
  - H2: 詳細情報
  - H2: 関連

## concepts/soul.md

- ルート: /concepts/soul
- 見出し:
  - H2: SOUL.md に含めるもの
  - H2: これが機能する理由
  - H2: Molty プロンプト
  - H2: 良い状態とは
  - H2: 1つの警告
  - H2: 関連

## concepts/streaming.md

- ルート: /concepts/streaming
- 見出し:
  - H2: ブロックストリーミング（チャネルメッセージ）
  - H3: ブロックストリーミングでのメディア配信
  - H2: チャンク化アルゴリズム（下限/上限）
  - H2: 合体（ストリーミングされたブロックをマージ）
  - H2: ブロック間の人間らしいペーシング
  - H2: 「チャンクをストリームするか、すべてをストリームするか」
  - H2: プレビューストリーミングモード
  - H3: チャネルマッピング
  - H3: レガシーキー移行
  - H2: ランタイム動作
  - H3: Telegram
  - H3: Discord
  - H3: Slack
  - H3: Mattermost
  - H3: Matrix
  - H2: ツール進行状況プレビュー更新
  - H2: 進行状況ドラフトのレンダリング
  - H3: commentary 進行状況レーン
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
  - H2: 3つのタイムゾーンサーフェス
  - H2: ユーザーのタイムゾーンを設定する
  - H2: エンベロープのタイムゾーン値
  - H2: オーバーライドするタイミング
  - H2: 関連

## concepts/typebox.md

- ルート: /concepts/typebox
- 見出し:
  - H2: メンタルモデル（30秒）
  - H2: スキーマの場所
  - H2: 現在のパイプライン
  - H2: ランタイムでのスキーマの使用方法
  - H2: フレーム例
  - H2: 最小クライアント（Node.js）
  - H2: 実例: メソッドをエンドツーエンドで追加する
  - H2: Swift コード生成の動作
  - H2: バージョニングと互換性
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
  - H2: 注記
  - H2: 関連

## concepts/usage-tracking.md

- ルート: /concepts/usage-tracking
- 見出し:
  - H2: 概要
  - H2: 表示される場所
  - H2: デフォルトの使用量フッターモード
  - H3: 3つの異なるセッション状態
  - H3: 優先順位
  - H3: リセットと無効化
  - H3: トグル動作
  - H3: 設定
  - H2: カスタム /usage 完全フッター
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
  - H3: ユーザーのタイムゾーン + 形式を設定する
  - H2: 時刻形式の検出（自動）
  - H2: ツールペイロード + コネクター（生のプロバイダー時刻 + 正規化済みフィールド）
  - H2: 関連ドキュメント

## debug/node-issue.md

- ルート: /debug/node-issue
- 見出し:
  - H1: Node + tsx "\\name is not a function" クラッシュ
  - H2: ステータス
  - H2: 元の症状
  - H2: 原因
  - H2: 現在の再現チェック
  - H2: 回避策（クラッシュが再発した場合）
  - H2: 参照
  - H2: 関連

## diagnostics/flags.md

- ルート: /diagnostics/flags
- 見出し:
  - H2: 仕組み
  - H2: 既知のフラグ
  - H2: 設定で有効化
  - H2: 環境変数オーバーライド（一回限り）
  - H2: プロファイラーフラグ
  - H2: タイムラインアーティファクト
  - H2: ログの出力先
  - H2: ログを抽出する
  - H2: 注記
  - H2: 関連

## gateway/authentication.md

- ルート: /gateway/authentication
- 見出し:
  - H2: 推奨設定: API キー（任意のプロバイダー）
  - H2: Anthropic: Claude CLI の再利用
  - H2: トークンの手動入力
  - H3: SecretRef に基づく認証情報
  - H2: モデル認証ステータスの確認
  - H2: API キーのローテーション（Gateway）
  - H2: Gateway の実行中にプロバイダー認証を削除する
  - H2: 使用する認証情報の制御
  - H3: OpenAI とレガシー openai-codex ID
  - H3: ログイン時（CLI）
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
  - H3: 環境変数オーバーライド
  - H3: 設定（環境変数オーバーライドより推奨）
  - H2: 子プロセスブリッジ
  - H2: process ツール
  - H2: 例
  - H2: 関連

## gateway/bonjour.md

- ルート: /gateway/bonjour
- 見出し:
  - H2: Tailscale 上の広域 Bonjour（Unicast DNS-SD）
  - H3: Gateway 設定
  - H3: 1回限りの DNS サーバー設定（Gateway ホスト、macOS のみ）
  - H3: Tailscale DNS 設定
  - H3: Gateway リスナーセキュリティ
  - H2: アドバタイズされるもの
  - H2: サービスタイプ
  - H2: TXT キー（シークレットではないヒント）
  - H2: macOS でのデバッグ
  - H2: Gateway ログでのデバッグ
  - H2: iOS ノードでのデバッグ
  - H2: Bonjour を有効化するタイミング
  - H2: Bonjour を無効化するタイミング
  - H2: Docker の注意点
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
  - H2: ハンドシェイクとペアリング
  - H2: フレーム
  - H2: exec ライフサイクルイベント
  - H2: 過去の tailnet 使用
  - H2: バージョニング
  - H2: 関連

## gateway/cli-backends.md

- ルート: /gateway/cli-backends
- 見出し:
  - H2: クイックスタート
  - H2: フォールバックとして使用する
  - H2: 設定
  - H2: 仕組み
  - H3: Claude CLI 固有事項
  - H2: セッション
  - H2: claude-cli セッションからのフォールバック前置き
  - H2: 画像
  - H2: 入力と出力
  - H2: Plugin 所有のデフォルト
  - H2: テキスト変換オーバーレイ
  - H2: ネイティブ Compaction の所有権
  - H2: バンドル MCP オーバーレイ
  - H2: 履歴再シード上限
  - H2: 制限
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
  - H3: agents.list（エージェントごとのオーバーライド）
  - H2: マルチエージェントルーティング
  - H3: バインディング一致フィールド
  - H3: エージェントごとのアクセスプロファイル
  - H2: セッション
  - H2: メッセージ
  - H3: 応答プレフィックス
  - H3: Ack リアクション
  - H3: キュー
  - H3: インバウンドデバウンス
  - H3: その他のメッセージキー
  - H3: TTS（テキスト読み上げ）
  - H2: Talk
  - H2: 関連

## gateway/config-channels.md

- ルート: /gateway/config-channels
- 見出し:
  - H2: チャネル
  - H3: DM とグループアクセス
  - H3: チャネルモデルのオーバーライド
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
  - H4: DM 履歴制限
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
  - H2: 拡張例 (主要オプション)
  - H3: シンボリックリンクされた兄弟 skill リポジトリ
  - H2: 一般的なパターン
  - H3: 共有 skill ベースラインと 1 つの上書き
  - H3: マルチプラットフォームセットアップ
  - H3: 信頼済み node ネットワークの自動承認
  - H3: セキュア DM モード (共有受信箱 / 複数ユーザー DM)
  - H3: Anthropic API キー + MiniMax フォールバック
  - H3: 作業用ボット (アクセス制限あり)
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
  - H3: Codex ハーネス plugin 設定
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
  - H2: Canvas plugin ホスト
  - H2: 探索
  - H3: mDNS (Bonjour)
  - H3: 広域 (DNS-SD)
  - H2: 環境
  - H3: env (インライン環境変数)
  - H3: 環境変数置換
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
  - H2: アイデンティティ
  - H2: ブリッジ (レガシー、削除済み)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: メディアモデルテンプレート変数
  - H2: 設定 include ($include)
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
  - H2: 設定 RPC (プログラムによる更新)
  - H2: 環境変数
  - H2: 完全リファレンス
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
  - H2: direct と SSH の両方が存在する理由
  - H2: 探索入力
  - H3: 1) Bonjour / DNS-SD
  - H4: サービスビーコンの詳細
  - H3: 2) Tailnet (クロスネットワーク)
  - H3: 3) 手動 / SSH ターゲット
  - H2: トランスポート選択 (クライアントポリシー)
  - H2: ペアリングと認証 (direct トランスポート)
  - H2: コンポーネント別の責任
  - H2: 関連

## gateway/doctor.md

- ルート: /gateway/doctor
- 見出し:
  - H2: クイックスタート
  - H3: ヘッドレスモードと自動化モード
  - H2: 読み取り専用 lint モード
  - H2: 実行内容 (概要)
  - H2: Dreams UI のバックフィルとリセット
  - H2: 詳細な動作と根拠
  - H2: 関連

## gateway/external-apps.md

- ルート: /gateway/external-apps
- 見出し:
  - H2: 現在利用可能なもの
  - H2: 推奨パス
  - H2: アプリコードと plugin コード
  - H2: 関連

## gateway/gateway-lock.md

- ルート: /gateway/gateway-lock
- 見出し:
  - H2: 理由
  - H2: 2 つのレイヤー
  - H3: ファイルロック
  - H3: ソケットバインド
  - H2: 運用上の注意
  - H2: 関連

## gateway/health.md

- ルート: /gateway/health
- 見出し:
  - H2: クイックチェック
  - H2: 詳細診断
  - H2: ヘルスモニター設定
  - H2: 稼働監視
  - H3: 監視サービスのセットアップ例
  - H2: 何かが失敗した場合
  - H2: 専用の「health」コマンド
  - H2: 関連

## gateway/heartbeat.md

- ルート: /gateway/heartbeat
- 見出し:
  - H2: クイックスタート (初心者向け)
  - H2: デフォルト
  - H2: heartbeat プロンプトの用途
  - H2: レスポンス契約
  - H2: 設定
  - H3: スコープと優先順位
  - H3: エージェントごとの heartbeat
  - H3: アクティブ時間の例
  - H3: 24/7 セットアップ
  - H3: マルチアカウント例
  - H3: フィールドノート
  - H2: 配信動作
  - H2: 表示制御
  - H3: 各フラグの機能
  - H3: チャンネルごと vs アカウントごとの例
  - H3: 一般的なパターン
  - H2: HEARTBEAT.md (任意)
  - H3: tasks: ブロック
  - H3: エージェントは HEARTBEAT.md を更新できるか?
  - H2: 手動 wake (オンデマンド)
  - H2: reasoning 配信 (任意)
  - H2: コスト意識
  - H2: heartbeat 後のコンテキストオーバーフロー
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
  - H2: 複数の gateway (同一ホスト)
  - H2: リモートアクセス
  - H2: 監視とサービスライフサイクル
  - H2: dev プロファイルのクイックパス
  - H2: プロトコルクイックリファレンス (オペレーター視点)
  - H2: 運用チェック
  - H3: ライブネス
  - H3: レディネス
  - H3: ギャップ復旧
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
  - H2: 関連

## gateway/local-models.md

- ルート: /gateway/local-models
- 見出し:
  - H2: ハードウェア下限
  - H2: バックエンドを選ぶ
  - H2: LM Studio + 大規模ローカルモデル (Responses API)
  - H3: ハイブリッド設定: ホスト型 primary、ローカル fallback
  - H3: リージョンホスティング / データルーティング
  - H2: その他の OpenAI 互換ローカルプロキシ
  - H2: より小さい、またはより厳格なバックエンド
  - H2: トラブルシューティング
  - H2: 関連

## gateway/logging.md

- ルート: /gateway/logging
- 見出し:
  - H1: ロギング
  - H2: ファイルベースのロガー
  - H3: 詳細出力 vs. ログレベル
  - H2: コンソールキャプチャ
  - H2: リダクション
  - H2: Gateway WebSocket ログ
  - H3: WS ログスタイル
  - H2: コンソール整形 (サブシステムロギング)
  - H2: 関連

## gateway/multiple-gateways.md

- ルート: /gateway/multiple-gateways
- 見出し:
  - H2: レスキューボットのクイックスタート
  - H3: --profile rescue onboard が変更するもの
  - H2: 一般的なマルチ gateway セットアップ
  - H2: 分離チェックリスト
  - H2: ポートマッピング (派生)
  - H2: ブラウザー/CDP の注意事項 (よくある落とし穴)
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
  - H2: エンドポイントの有効化
  - H2: セキュリティ境界 (重要)
  - H2: 認証
  - H2: このエンドポイントを使う場面
  - H2: エージェントファーストのモデル契約
  - H2: セッション動作
  - H2: リクエスト制限 (設定)
  - H2: チャットツール契約
  - H3: 対応リクエストフィールド
  - H3: 非対応バリアント
  - H3: 非ストリーミングツールレスポンス形状
  - H3: ストリーミングツールレスポンス形状
  - H3: ツールフォローアップループ
  - H2: ストリーミング (SSE)
  - H2: Open WebUI クイックセットアップ
  - H2: 例
  - H2: 関連

## gateway/openresponses-http-api.md

- ルート: /gateway/openresponses-http-api
- 見出し:
  - H2: 認証、セキュリティ、ルーティング
  - H2: セッション動作
  - H2: リクエスト形状
  - H2: Items (入力)
  - H3: message
  - H3: functioncalloutput (ターンベースツール)
  - H3: reasoning と itemreference
  - H2: Tools (クライアント側 function tools)
  - H2: Images (inputimage)
  - H2: Files (inputfile)
  - H2: ファイル + 画像の制限 (設定)
  - H2: ストリーミング (SSE)
  - H2: 使用状況
  - H2: エラー
  - H2: 例
  - H2: 関連

## gateway/openshell.md

- ルート: /gateway/openshell
- 見出し:
  - H2: 前提条件
  - H2: クイックスタート
  - H2: ワークスペースモード
  - H3: mirror (デフォルト)
  - H3: remote
  - H3: モードの選択
  - H2: 設定リファレンス
  - H2: 例
  - H3: 最小 remote セットアップ
  - H3: GPU 付き mirror モード
  - H3: カスタム gateway を使うエージェントごとの OpenShell
  - H2: ライフサイクル管理
  - H2: セキュリティ強化
  - H2: 現在の制限
  - H2: 仕組み
  - H2: 関連

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
  - H3: モデル使用量
  - H3: メッセージフロー
  - H3: Talk
  - H3: キューとセッション
  - H3: セッションライブネステレメトリ
  - H3: ハーネスライフサイクル
  - H3: ツール実行とループ検出
  - H3: Exec
  - H3: 診断内部 (メモリ、ペイロード、エクスポーター健全性)
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
  - H2: CLI ワークフロー (ヘッドレス対応)
  - H2: API サーフェス (gateway プロトコル)
  - H2: Node コマンドゲート (2026.3.31+)
  - H2: Node イベント信頼境界 (2026.3.31+)
  - H2: 自動承認 (macOS アプリ)
  - H2: 信頼済み CIDR デバイスの自動承認
  - H2: メタデータアップグレード自動承認
  - H2: QR ペアリングヘルパー
  - H2: 局所性と転送ヘッダー
  - H2: ストレージ (ローカル、プライベート)
  - H2: トランスポート動作
  - H2: 関連

## gateway/prometheus.md

- ルート: /gateway/prometheus
- 見出し:
  - H2: クイックスタート
  - H2: エクスポートされるメトリクス
  - H2: ラベルポリシー
  - H2: PromQL レシピ
  - H2: Prometheus と OpenTelemetry export の選択
  - H2: トラブルシューティング
  - H2: 関連

## gateway/protocol.md

- ルート: /gateway/protocol
- 見出し:
  - H2: トランスポートとフレーミング
  - H2: ハンドシェイク
  - H3: Node connect の例
  - H2: ロールとスコープ
  - H2: プレゼンス
  - H3: Node background alive イベント
  - H2: ブロードキャストイベントのスコープ設定
  - H2: RPC メソッドファミリー
  - H3: 共通イベントファミリー
  - H3: Node ヘルパーメソッド
  - H2: タスク台帳 RPC
  - H2: オペレーターヘルパーメソッド
  - H3: models.list ビュー
  - H2: Exec 承認
  - H2: エージェント配信フォールバック
  - H2: バージョニング
  - H3: クライアント定数
  - H2: 認証
  - H2: デバイスアイデンティティとペアリング
  - H3: デバイス認証移行診断
  - H2: TLS とピン留め
  - H2: スコープ
  - H2: 関連

## gateway/remote-gateway-readme.md

- ルート: /gateway/remote-gateway-readme
- 見出し:
  - H1: Remote Gateway で OpenClaw.app を実行する
  - H2: セットアップ
  - H2: 仕組み
  - H2: 関連

## gateway/remote.md

- ルート: /gateway/remote
- 見出し:
  - H2: 核心となる考え方
  - H2: トポロジーオプション
  - H2: コマンドフロー (どこで何が実行されるか)
  - H2: SSH トンネル (CLI + ツール)
  - H2: CLI remote デフォルト
  - H2: 認証情報の優先順位
  - H2: Chat UI リモートアクセス
  - H2: macOS アプリ remote モード
  - H2: セキュリティルール (remote/VPN)
  - H3: macOS: LaunchAgent による永続 SSH トンネル
  - H4: ステップ 1: SSH 設定を追加
  - H4: ステップ 2: SSH キーをコピー (1 回限り)
  - H4: ステップ 3: gateway トークンを設定
  - H4: ステップ 4: LaunchAgent を作成
  - H4: ステップ 5: LaunchAgent を読み込む
  - H4: トラブルシューティング
  - H2: 関連

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- ルート: /gateway/sandbox-vs-tool-policy-vs-elevated
- 見出し:
  - H2: クイックデバッグ
  - H2: サンドボックス: ツールが実行される場所
  - H3: バインドマウント (セキュリティクイックチェック)
  - H2: ツールポリシー: 存在する/呼び出し可能なツール
  - H3: ツールグループ (省略形)
  - H2: Elevated: exec 専用の「ホスト上で実行」
  - H2: 一般的な「sandbox jail」修正
  - H3: 「Tool X blocked by sandbox tool policy」
  - H3: 「ここは main だと思っていたのに、なぜサンドボックス化されているのか?」
  - H2: 関連

## gateway/sandboxing.md

- ルート: /gateway/sandboxing
- 見出し:
  - H2: サンドボックス化されるもの
  - H2: モード、スコープ、バックエンド
  - H2: Docker バックエンド
  - H3: サンドボックス化されたブラウザー
  - H2: SSH バックエンド
  - H2: OpenShell バックエンド
  - H2: ワークスペースアクセス
  - H2: カスタムバインドマウント
  - H2: イメージとセットアップ
  - H2: setupCommand (1回限りのコンテナーセットアップ)
  - H2: ツールポリシーと回避手段
  - H2: マルチエージェントのオーバーライド
  - H2: 最小限の有効化例
  - H2: 関連

## gateway/secrets-plan-contract.md

- ルート: /gateway/secrets-plan-contract
- 見出し:
  - H2: プランファイルの形状
  - H2: プロバイダーの upsert と削除
  - H2: サポートされるターゲットスコープ
  - H2: ターゲット種別の動作
  - H2: パス検証ルール
  - H2: 失敗時の動作
  - H2: Exec プロバイダーの同意動作
  - H2: ランタイムと監査スコープの注記
  - H2: オペレーター確認
  - H2: 関連ドキュメント

## gateway/secrets.md

- ルート: /gateway/secrets
- 見出し:
  - H2: ランタイムモデル
  - H2: エージェントアクセス境界
  - H2: アクティブサーフェスのフィルタリング
  - H2: Gateway 認証サーフェス診断
  - H2: オンボーディング参照の事前確認
  - H2: SecretRef コントラクト
  - H2: プロバイダー設定
  - H2: ファイルベースの API キー
  - H2: Exec 連携例
  - H2: MCP サーバー環境変数
  - H2: サンドボックス SSH 認証素材
  - H2: サポートされる認証情報サーフェス
  - H2: 必須の動作と優先順位
  - H2: アクティベーショントリガー
  - H2: 劣化シグナルと復旧シグナル
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
  - H2: 公開パターンを選択する
  - H2: 事前インベントリ
  - H2: ベースライン確認
  - H2: 最小限の安全なベースライン
  - H2: DM とグループの公開
  - H2: リバースプロキシ確認
  - H2: ツールとサンドボックスのレビュー
  - H2: 変更後の検証
  - H2: ロールバック計画
  - H2: レビューチェックリスト

## gateway/security/index.md

- ルート: /gateway/security
- 見出し:
  - H2: スコープ: パーソナルアシスタントのセキュリティモデル
  - H2: openclaw セキュリティ監査
  - H3: 監査が確認すること (概要)
  - H3: 所見をトリアージするときの優先順位
  - H2: 60秒で行う強化済みベースライン
  - H2: 信頼境界マトリクス
  - H2: 設計上の脆弱性ではないもの
  - H2: Gateway とノードの信頼
  - H2: 脅威モデル
  - H2: DM アクセス: ペアリング、許可リスト、オープン、無効
  - H3: 許可リスト (2層)
  - H3: DM セッション分離 (マルチユーザーモード)
  - H2: コンテキスト可視性とトリガー認可
  - H2: プロンプトインジェクション
  - H3: 外部コンテンツと信頼できない入力のラップ
  - H3: バイパスフラグ (本番ではオフのままにする)
  - H3: グループでの推論と詳細出力
  - H2: コマンド認可
  - H2: コントロールプレーンツール
  - H2: ノード実行 (system.run)
  - H2: 動的 Skills (ウォッチャー / リモートノード)
  - H2: Plugins
  - H2: サンドボックス化
  - H3: サブエージェント委任ガードレール
  - H3: 読み取り専用モード
  - H2: エージェントごとのアクセスプロファイル (マルチエージェント)
  - H3: フルアクセス (サンドボックスなし)
  - H3: 読み取り専用ツール + 読み取り専用ワークスペース
  - H3: ファイルシステム/シェルアクセスなし (プロバイダーメッセージングは許可)
  - H2: ブラウザー制御リスク
  - H3: ブラウザー SSRF ポリシー (デフォルトで厳格)
  - H2: ネットワーク公開
  - H3: バインド、ポート、ファイアウォール
  - H3: UFW を使った Docker ポート公開
  - H3: mDNS/Bonjour ディスカバリー
  - H3: Gateway WebSocket 認証
  - H3: Tailscale Serve アイデンティティヘッダー
  - H3: リバースプロキシ設定
  - H3: HSTS とオリジンの注記
  - H3: HTTP 経由の Control UI
  - H3: 安全でない/危険なフラグ
  - H2: デプロイとホストの信頼
  - H2: ディスク上のシークレット
  - H3: 認証情報ストレージマップ
  - H3: ファイル権限
  - H3: ワークスペースの .env ファイル
  - H3: ログとトランスクリプト
  - H2: 安全なベースライン (コピー/貼り付け)
  - H3: 番号を分ける (WhatsApp、Signal、Telegram)
  - H2: インシデント対応
  - H3: 封じ込め
  - H3: ローテーション (シークレットが漏えいした場合は侵害を想定)
  - H3: 監査
  - H3: レポート用に収集
  - H2: シークレットスキャン
  - H2: セキュリティ問題の報告

## gateway/security/secure-file-operations.md

- ルート: /gateway/security/secure-file-operations
- 見出し:
  - H2: デフォルト: Python ヘルパーなし
  - H2: Python なしで保護されるもの
  - H2: Python が追加するもの
  - H2: Plugin とコアのガイダンス

## gateway/security/shrinkwrap.md

- ルート: /gateway/security/shrinkwrap
- 見出し:
  - H2: 重要な理由
  - H2: 生成と確認
  - H2: 公開済みパッケージの検査

## gateway/tailscale.md

- ルート: /gateway/tailscale
- 見出し:
  - H2: モード
  - H2: 設定例
  - H3: Tailnet のみ (Serve)
  - H3: Tailnet のみ (Tailnet IP にバインド)
  - H3: 公開インターネット (Funnel + 共有パスワード)
  - H2: CLI 例
  - H2: 認証
  - H3: Tailscale アイデンティティヘッダー (Serve のみ)
  - H2: 注記
  - H3: Tailscale の前提条件と制限
  - H2: ブラウザー制御 (リモート Gateway + ローカルブラウザー)
  - H2: 詳細
  - H2: 関連

## gateway/tools-invoke-http-api.md

- ルート: /gateway/tools-invoke-http-api
- 見出し:
  - H2: 認証
  - H2: セキュリティ境界 (重要)
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
  - H2: 分断されたインストールと新しい設定ガード
  - H2: ロールバック後のプロトコル不一致
  - H2: パスエスケープとしてスキップされた Skill シンボリックリンク
  - H2: Anthropic 429 で長いコンテキストに追加使用量が必要
  - H2: アップストリーム 403 ブロック応答
  - H2: ローカル OpenAI 互換バックエンドは直接プローブに通るがエージェント実行は失敗する
  - H2: 返信がない
  - H2: ダッシュボード Control UI 接続
  - H3: 認証詳細コードのクイックマップ
  - H2: Gateway サービスが実行されていない
  - H2: macOS gateway が静かに応答を停止し、ダッシュボードに触れると再開する
  - H2: メモリ使用量が多いときに Gateway が終了する
  - H2: Gateway が無効な設定を拒否した
  - H2: Gateway プローブ警告
  - H2: チャンネルは接続済みだが、メッセージが流れない
  - H2: Cron と Heartbeat 配信
  - H2: ノードはペアリング済みだが、ツールが失敗する
  - H2: ブラウザーツールが失敗する
  - H2: アップグレード後に何かが突然壊れた場合
  - H2: 関連

## gateway/trusted-proxy-auth.md

- ルート: /gateway/trusted-proxy-auth
- 見出し:
  - H2: 使用する場合
  - H2: 使用しない場合
  - H2: 仕組み
  - H2: 設定
  - H3: 設定リファレンス
  - H2: Control UI のペアリング動作
  - H2: オペレータースコープヘッダー
  - H2: TLS 終端と HSTS
  - H3: ロールアウトガイダンス
  - H2: プロキシセットアップ例
  - H2: 混在トークン設定
  - H2: セキュリティチェックリスト
  - H2: セキュリティ監査
  - H2: トラブルシューティング
  - H2: トークン認証からの移行
  - H2: 関連

## help/debugging.md

- ルート: /help/debugging
- 見出し:
  - H2: ランタイムデバッグオーバーライド
  - H2: セッショントレース出力
  - H2: Plugin ライフサイクルトレース
  - H2: CLI 起動とコマンドプロファイリング
  - H2: Gateway ウォッチモード
  - H2: 開発プロファイル + 開発 Gateway (--dev)
  - H2: 生ストリームログ
  - H2: 安全上の注記
  - H2: VSCode でのデバッグ
  - H3: セットアップ
  - H3: 注記
  - H2: 関連

## help/environment.md

- ルート: /help/environment
- 見出し:
  - H2: 優先順位 (高い順)
  - H2: プロバイダー認証情報とワークスペース .env
  - H2: 設定 env ブロック
  - H2: シェル env インポート
  - H2: Exec シェルスナップショット
  - H2: ランタイム注入 env vars
  - H2: UI env vars
  - H2: 設定内の env var 置換
  - H2: シークレット参照と ${ENV} 文字列
  - H2: パス関連 env vars
  - H2: ログ
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
  - H2: 認証プロファイル: それが何で、どう管理するか
  - H2: 関連

## help/faq.md

- ルート: /help/faq
- 見出し:
  - H2: 何かが壊れている場合の最初の60秒
  - H2: クイックスタートと初回実行セットアップ
  - H2: OpenClaw とは何か?
  - H2: Skills と自動化
  - H2: サンドボックス化とメモリ
  - H2: ディスク上の保存場所
  - H2: 設定の基本
  - H2: リモート Gateway とノード
  - H2: Env vars と .env 読み込み
  - H2: セッションと複数チャット
  - H2: モデル、フェイルオーバー、認証プロファイル
  - H2: Gateway: ポート、「already running」、リモートモード
  - H2: ログとデバッグ
  - H2: メディアと添付ファイル
  - H2: セキュリティとアクセス制御
  - H2: チャットコマンド、タスクの中止、「止まらない」
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
  - H2: スクリプトを追加するとき
  - H2: 関連

## help/testing-live.md

- ルート: /help/testing-live
- 見出し:
  - H2: ライブ: ローカルスモークコマンド
  - H2: ライブ: Android ノード能力スイープ
  - H2: ライブ: モデルスモーク (プロファイルキー)
  - H3: レイヤー 1: 直接モデル補完 (gateway なし)
  - H3: レイヤー 2: Gateway + 開発エージェントスモーク ("@openclaw" が実際に行うこと)
  - H2: ライブ: CLI バックエンドスモーク (Claude、Gemini、その他のローカル CLI)
  - H2: ライブ: APNs HTTP/2 プロキシ到達性
  - H2: ライブ: ACP バインドスモーク (/acp spawn ... --bind here)
  - H2: ライブ: Codex app-server ハーネススモーク
  - H3: 推奨ライブレシピ
  - H2: ライブ: モデルマトリクス (カバー範囲)
  - H3: アグリゲーター / 代替 Gateway
  - H2: 認証情報 (絶対にコミットしない)
  - H2: Deepgram ライブ (音声文字起こし)
  - H2: BytePlus coding plan ライブ
  - H2: ComfyUI workflow media ライブ
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
  - H2: リリースデフォルト
  - H2: レガシー互換性
  - H2: カバレッジの追加
  - H2: 失敗のトリアージ

## help/testing.md

- ルート: /help/testing
- 見出し:
  - H2: クイックスタート
  - H2: テスト一時ディレクトリ
  - H2: ライブと Docker/Parallels ワークフロー
  - H2: QA 固有のランナー
  - H3: Convex 経由の共有 Telegram 認証情報 (v1)
  - H3: QA にチャンネルを追加する
  - H2: テストスイート (どこで何が実行されるか)
  - H3: ユニット / 統合 (デフォルト)
  - H3: 安定性 (gateway)
  - H3: E2E (リポジトリ集約)
  - H3: E2E (gateway スモーク)
  - H3: E2E (Control UI のモックブラウザー)
  - H3: E2E: OpenShell バックエンドスモーク
  - H3: ライブ (実プロバイダー + 実モデル)
  - H2: どのスイートを実行すべきか?
  - H2: ライブ (ネットワークに触れる) テスト
  - H2: Docker ランナー (任意の「Linux で動作する」確認)
  - H2: Docs sanity
  - H2: オフライン回帰 (CI-safe)
  - H2: エージェント信頼性評価 (skills)
  - H2: コントラクトテスト (plugin とチャンネルの形状)
  - H3: コマンド
  - H3: チャンネルコントラクト
  - H3: プロバイダーコントラクト
  - H3: 実行するタイミング
  - H2: 回帰の追加 (ガイダンス)
  - H2: 関連

## help/troubleshooting.md

- ルート: /help/troubleshooting
- 見出し:
  - H2: 最初の60秒
  - H2: アシスタントが制限されている、またはツールが欠けているように感じる
  - H2: Anthropic 長いコンテキスト 429
  - H2: ローカル OpenAI 互換バックエンドは直接動作するが OpenClaw では失敗する
  - H2: Plugin インストールが openclaw extensions の不足で失敗する
  - H2: インストールポリシーが plugin のインストールまたは更新をブロックする
  - H2: Plugin は存在するが疑わしい所有者によってブロックされている
  - H2: 意思決定ツリー
  - H2: 関連

## index.md

- ルート: /
- 見出し:
  - H1: OpenClaw 🦞
  - H2: OpenClaw とは何か?
  - H2: 仕組み
  - H2: 主要機能
  - H2: クイックスタート
  - H2: ダッシュボード
  - H2: 設定 (任意)
  - H2: ここから開始
  - H2: 詳細

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
  - H2: チャンネルの切り替え
  - H2: 一回限りのバージョンまたはタグ指定
  - H2: ドライラン
  - H2: Plugin とチャンネル
  - H2: 現在のステータスの確認
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
  - H2: 何がどこに永続化されるか
  - H2: 更新
  - H2: 関連

## install/docker.md

- ルート: /install/docker
- 見出し:
  - H2: 前提条件
  - H2: コンテナ化された Gateway
  - H3: 手動フロー
  - H3: 環境変数
  - H3: 可観測性
  - H3: ヘルスチェック
  - H3: LAN と loopback
  - H3: ホスト上のローカルプロバイダー
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
  - H2: 必要なもの
  - H2: 初心者向けクイックパス
  - H2: Shelley による自動インストール
  - H2: 手動インストール
  - H2: リモートチャンネルのセットアップ
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
  - H3: OOM / メモリの問題
  - H3: Gateway ロックの問題
  - H3: 設定が読み取られていない
  - H3: SSH 経由で設定を書き込む
  - H3: 状態が永続化されない
  - H2: 更新
  - H3: マシンコマンドの更新
  - H2: プライベートデプロイ（強化済み）
  - H3: プライベートデプロイを使う場合
  - H3: セットアップ
  - H3: プライベートデプロイへのアクセス
  - H3: プライベートデプロイでの Webhook
  - H3: セキュリティ上のトレードオフ
  - H2: 注記
  - H2: コスト
  - H2: 次のステップ
  - H2: 関連

## install/gcp.md

- ルート: /install/gcp
- 見出し:
  - H2: 必要なもの
  - H2: クイックパス
  - H2: トラブルシューティング
  - H2: サービスアカウント（セキュリティのベストプラクティス）
  - H2: 次のステップ
  - H2: 関連

## install/hetzner.md

- ルート: /install/hetzner
- 見出し:
  - H2: 必要なもの
  - H2: クイックパス
  - H2: Infrastructure as Code（Terraform）
  - H2: 次のステップ
  - H2: 関連

## install/hostinger.md

- ルート: /install/hostinger
- 見出し:
  - H2: 前提条件
  - H2: オプション A: 1-Click OpenClaw
  - H2: オプション B: VPS 上の OpenClaw
  - H2: セットアップの検証
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連

## install/index.md

- ルート: /install
- 見出し:
  - H2: システム要件
  - H2: 推奨: インストーラスクリプト
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
  - H3: ソースチェックアウトの検出
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
  - H2: Helm ではない理由
  - H2: 必要なもの
  - H2: クイックスタート
  - H2: Kind によるローカルテスト
  - H2: ステップごと
  - H3: 1) デプロイ
  - H3: 2) Gateway へアクセス
  - H2: デプロイされるもの
  - H2: カスタマイズ
  - H3: エージェント指示
  - H3: Gateway 設定
  - H3: プロバイダーの追加
  - H3: カスタム namespace
  - H3: カスタムイメージ
  - H3: port-forward 以外で公開
  - H2: 再デプロイ
  - H2: ティアダウン
  - H2: アーキテクチャメモ
  - H2: ファイル構造
  - H2: 関連

## install/macos-vm.md

- ルート: /install/macos-vm
- 見出し:
  - H2: 推奨デフォルト（ほとんどのユーザー）
  - H2: macOS VM オプション
  - H3: Apple Silicon Mac 上のローカル VM（Lume）
  - H3: ホスト型 Mac プロバイダー（クラウド）
  - H2: クイックパス（Lume、経験者向け）
  - H2: 必要なもの（Lume）
  - H2: 1) Lume をインストール
  - H2: 2) macOS VM を作成
  - H2: 3) Setup Assistant を完了
  - H2: 4) VM の IP アドレスを取得
  - H2: 5) VM に SSH 接続
  - H2: 6) OpenClaw をインストール
  - H2: 7) チャンネルを設定
  - H2: 8) VM をヘッドレスで実行
  - H2: ボーナス: iMessage 連携
  - H2: ゴールデンイメージを保存
  - H2: 24/7 で実行
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
  - H2: 自動化用の JSON 出力
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
  - H2: 自動化用の JSON 出力
  - H2: トラブルシューティング
  - H2: 関連

## install/migrating.md

- ルート: /install/migrating
- 見出し:
  - H2: 別のエージェントシステムからインポート
  - H2: OpenClaw を新しいマシンへ移動
  - H3: 移行手順
  - H3: よくある落とし穴
  - H3: 検証チェックリスト
  - H2: Plugin をその場でアップグレード
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
  - H2: バージョンの確認
  - H2: Node のインストール
  - H2: トラブルシューティング
  - H3: openclaw: command not found
  - H3: npm install -g の権限エラー（Linux）
  - H2: 関連

## install/northflank.mdx

- ルート: /install/northflank
- 見出し:
  - H2: はじめる方法
  - H2: 得られるもの
  - H2: チャンネルを接続
  - H2: 次のステップ

## install/oracle.md

- ルート: /install/oracle
- 見出し:
  - H2: 前提条件
  - H2: セットアップ
  - H2: セキュリティ体制の検証
  - H2: ARM に関する注記
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
  - H2: 設定、env、ストレージ
  - H2: 便利なコマンド
  - H2: トラブルシューティング
  - H2: 関連

## install/railway.mdx

- ルート: /install/railway
- 見出し:
  - H2: ワンクリックデプロイ
  - H2: 得られるもの
  - H2: チャンネルを接続
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
  - H2: ARM バイナリに関する注記
  - H2: 永続化とバックアップ
  - H2: トラブルシューティング
  - H2: 次のステップ
  - H2: 関連

## install/render.mdx

- ルート: /install/render
- 見出し:
  - H2: 前提条件
  - H2: デプロイ
  - H2: Blueprint
  - H2: プランの選択
  - H2: デプロイ後
  - H3: Control UI へアクセス
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
  - H2: 簡単な方法（CLI がまだインストール済み）
  - H2: 手動でのサービス削除（CLI が未インストール）
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
  - H2: npm インストールと git インストールの切り替え
  - H2: 代替: インストーラーを再実行
  - H2: 代替: 手動の npm、pnpm、または bun
  - H3: npm install の高度なトピック
  - H2: 自動アップデーター
  - H2: 更新後
  - H3: doctor を実行
  - H3: Gateway を再起動
  - H3: 検証
  - H2: ロールバック
  - H3: バージョンを固定（npm）
  - H3: コミットを固定（ソース）
  - H2: 行き詰まった場合
  - H2: 関連

## install/upstash.md

- ルート: /install/upstash
- 見出し:
  - H2: 前提条件
  - H2: Box を作成
  - H2: SSH トンネルで接続
  - H2: OpenClaw のインストール
  - H2: オンボーディングを実行
  - H2: Gateway を起動
  - H2: 自動再起動
  - H2: トラブルシューティング
  - H2: 関連

## logging.md

- ルート: /logging
- 見出し:
  - H2: ログの場所
  - H2: ログの読み方
  - H3: CLI: ライブ tail（推奨）
  - H3: Control UI（Web）
  - H3: チャンネル専用ログ
  - H2: ログ形式
  - H3: ファイルログ（JSONL）
  - H3: コンソール出力
  - H3: Gateway WebSocket ログ
  - H2: ログの設定
  - H3: ログレベル
  - H3: 対象モデル転送診断
  - H3: トレース相関
  - H3: モデル呼び出しサイズとタイミング
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
  - H2: QA エビデンス概要
  - H3: 領域別の準備状況

## maturity/taxonomy.md

- ルート: /maturity/taxonomy
- 見出し:
  - H1: 成熟度分類
  - H2: このページの読み方
  - H2: 成熟度レベル
  - H2: プロダクト領域
  - H2: 詳細
  - H3: Core
  - H3: Platform
  - H3: Channel
  - H3: Provider と tool

## network.md

- ルート: /network
- 見出し:
  - H2: コアモデル
  - H2: ペアリング + アイデンティティ
  - H2: Discovery + トランスポート
  - H2: ノード + トランスポート
  - H2: セキュリティ
  - H2: 関連

## nodes/audio.md

- ルート: /nodes/audio
- 見出し:
  - H2: 機能
  - H2: 自動検出（デフォルト）
  - H2: 設定例
  - H3: プロバイダー + CLI フォールバック（OpenAI + Whisper CLI）
  - H3: スコープゲート付きプロバイダーのみ
  - H3: プロバイダーのみ（Deepgram）
  - H3: プロバイダーのみ（Mistral Voxtral）
  - H3: プロバイダーのみ（SenseAudio）
  - H3: 文字起こしをチャットへエコー（オプトイン）
  - H2: 注記と制限
  - H3: プロキシ環境のサポート
  - H2: グループでのメンション検出
  - H2: 注意点
  - H2: 関連

## nodes/camera.md

- ルート: /nodes/camera
- 見出し:
  - H2: iOS ノード
  - H3: iOS ユーザー設定
  - H3: iOS コマンド（Gateway node.invoke 経由）
  - H3: iOS フォアグラウンド要件
  - H3: CLI ヘルパー
  - H2: Android ノード
  - H3: Android ユーザー設定
  - H3: 権限
  - H3: Android フォアグラウンド要件
  - H3: Android コマンド（Gateway node.invoke 経由）
  - H2: macOS アプリ
  - H3: macOS ユーザー設定
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
  - H2: テスト向けのメモ
  - H2: 関連

## nodes/index.md

- ルート: /nodes
- 見出し:
  - H2: ペアリング + ステータス
  - H2: リモートノードホスト（system.run）
  - H3: ノードホストを開始する（フォアグラウンド）
  - H3: SSH トンネル経由のリモート Gateway（ループバックバインド）
  - H3: ノードホストを開始する（サービス）
  - H3: ペアリング + 名前
  - H3: コマンドを許可リストに追加する
  - H3: exec をノードに向ける
  - H3: ローカルモデル推論
  - H2: コマンドの呼び出し
  - H2: コマンドポリシー
  - H2: 設定（openclaw.json）
  - H2: スクリーンショット（canvas スナップショット）
  - H3: Canvas コントロール
  - H3: A2UI（Canvas）
  - H2: 写真 + 動画（ノードカメラ）
  - H2: 画面録画（ノード）
  - H2: 位置情報（ノード）
  - H2: SMS（Android ノード）
  - H2: デバイスと個人データのコマンド
  - H2: システムコマンド（ノードホスト / Mac ノード）
  - H2: Exec ノードバインディング
  - H2: 権限マップ
  - H2: ヘッドレスノードホスト（クロスプラットフォーム）
  - H2: Mac ノードモード

## nodes/location-command.md

- ルート: /nodes/location-command
- 見出し:
  - H2: TL;DR
  - H2: セレクターである理由（単なるスイッチではない）
  - H2: 設定モデル
  - H2: 権限マッピング（node.permissions）
  - H2: コマンド: location.get
  - H2: バックグラウンド動作
  - H2: モデル/ツール統合
  - H2: UX 文言（提案）
  - H2: 関連

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
  - H2: プロバイダー対応表
  - H2: モデル選択ガイダンス
  - H2: 添付ファイルポリシー
  - H3: ファイル添付の抽出
  - H2: 設定例
  - H2: ステータス出力
  - H2: メモ
  - H2: 関連

## nodes/talk.md

- ルート: /nodes/talk
- 見出し:
  - H2: 動作（macOS）
  - H2: 返信内の音声指示
  - H2: 設定（/.openclaw/openclaw.json）
  - H2: macOS UI
  - H2: Android UI
  - H2: メモ
  - H2: 関連

## nodes/troubleshooting.md

- ルート: /nodes/troubleshooting
- 見出し:
  - H2: コマンドラダー
  - H2: フォアグラウンド要件
  - H2: 権限マトリクス
  - H2: ペアリングと承認の違い
  - H2: 一般的なノードエラーコード
  - H2: 高速復旧ループ
  - H2: 関連

## nodes/voicewake.md

- ルート: /nodes/voicewake
- 見出し:
  - H2: ストレージ
  - H2: プロトコル
  - H3: トリガーリスト
  - H3: ルーティング（トリガーからターゲットへ）
  - H3: イベント
  - H2: クライアント動作
  - H2: 関連

## openclaw-agent-runtime.md

- ルート: /openclaw-agent-runtime
- 見出し:
  - H2: 型チェックと lint
  - H2: Agent Runtime テストの実行
  - H2: 手動テスト
  - H2: クリーンスレートリセット
  - H2: 参考資料
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
  - H2: 設計上の制約
  - H3: Codex app-server はネイティブスレッド状態の正規の情報源のままにする
  - H3: コンテキストエンジンの組み立ては Codex 入力へ投影する必要がある
  - H3: プロンプトキャッシュの安定性が重要
  - H3: ランタイム選択セマンティクスは変更しない
  - H2: 実装計画
  - H3: 1. 再利用可能なコンテキストエンジン試行ヘルパーをエクスポートまたは移動する
  - H3: 2. Codex コンテキスト投影ヘルパーを追加する
  - H3: 3. Codex スレッド起動前に bootstrap を配線する
  - H3: 4. thread/start / thread/resume と turn/start の前に assemble を配線する
  - H3: 5. プロンプトキャッシュで安定したフォーマットを保持する
  - H3: 6. トランスクリプトのミラーリング後に post-turn を配線する
  - H3: 7. 使用量とプロンプトキャッシュのランタイムコンテキストを正規化する
  - H3: 8. Compaction ポリシー
  - H4: /compact と明示的な OpenClaw compaction
  - H4: ターン内 Codex ネイティブ contextCompaction イベント
  - H3: 9. セッションリセットとバインディング動作
  - H3: 10. エラー処理
  - H2: テスト計画
  - H3: ユニットテスト
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
  - H2: サポートスナップショット
  - H2: リモート Mac から Android をミラーリングして制御する
  - H3: 始める前に
  - H3: TCP 経由の ADB を有効にする
  - H3: コントローラー Mac のみを許可する
  - H3: 接続してミラーリングを開始する
  - H3: トラブルシューティング
  - H2: 接続ランブック
  - H3: 前提条件
  - H3: 1. Gateway を開始する
  - H3: 2. 検出を確認する（任意）
  - H4: ユニキャスト DNS-SD によるクロスネットワーク検出
  - H3: 3. Android から接続する
  - H3: Presence alive ビーコン
  - H3: 4. ペアリングを承認する（CLI）
  - H3: 5. ノードが接続されていることを確認する
  - H3: 6. チャット + 履歴
  - H3: 7. Canvas + カメラ
  - H4: Gateway Canvas Host（Web コンテンツに推奨）
  - H3: 8. 音声 + 拡張 Android コマンドサーフェス
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
  - H2: OS を選ぶ
  - H2: VPS とホスティング
  - H2: 共通リンク
  - H2: Gateway サービスのインストール（CLI）
  - H2: 関連

## platforms/ios.md

- ルート: /platforms/ios
- 見出し:
  - H2: できること
  - H2: 要件
  - H2: クイックスタート（ペアリング + 接続）
  - H2: 公式ビルド向けリレー付きプッシュ
  - H2: バックグラウンド alive ビーコン
  - H2: 認証と信頼フロー
  - H2: 検出パス
  - H3: Bonjour（LAN）
  - H3: Tailnet（クロスネットワーク）
  - H3: 手動ホスト/ポート
  - H2: Canvas + A2UI
  - H2: Computer Use との関係
  - H3: Canvas eval / snapshot
  - H2: Voice wake + talk モード
  - H2: よくあるエラー
  - H2: 関連ドキュメント

## platforms/linux.md

- ルート: /platforms/linux
- 見出し:
  - H2: クイックパス（VPS）
  - H2: インストール
  - H2: Gateway サービス（systemd）
  - H2: メモリ圧迫と OOM kill
  - H2: 関連

## platforms/mac/bundled-gateway.md

- ルート: /platforms/mac/bundled-gateway
- 見出し:
  - H2: 自動セットアップ
  - H2: 手動復旧
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
  - H2: エージェント API サーフェス
  - H2: Canvas 内の A2UI
  - H3: A2UI コマンド（v0.8）
  - H2: Canvas からエージェント実行をトリガーする
  - H2: セキュリティメモ
  - H2: 関連

## platforms/mac/child-process.md

- ルート: /platforms/mac/child-process
- 見出し:
  - H2: デフォルト動作（launchd）
  - H2: 署名なし dev ビルド
  - H2: attach-only モード
  - H2: リモートモード
  - H2: launchd を推奨する理由
  - H2: 関連

## platforms/mac/dev-setup.md

- ルート: /platforms/mac/dev-setup
- 見出し:
  - H1: macOS 開発者セットアップ
  - H2: 前提条件
  - H2: 1. 依存関係をインストールする
  - H2: 2. アプリをビルドしてパッケージ化する
  - H2: 3. CLI と Gateway をインストールする
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
  - H2: 迷ったとき
  - H2: 関連

## platforms/mac/icon.md

- ルート: /platforms/mac/icon
- 見出し:
  - H1: メニューバーアイコンの状態
  - H2: 状態
  - H2: Voice wake ears
  - H2: 形状とサイズ
  - H2: 動作メモ
  - H2: 関連

## platforms/mac/logging.md

- ルート: /platforms/mac/logging
- 見出し:
  - H1: ロギング（macOS）
  - H2: ローリング診断ファイルログ（デバッグペイン）
  - H2: macOS 上の統合ロギングのプライベートデータ
  - H2: OpenClaw（ai.openclaw）で有効化する
  - H2: デバッグ後に無効化する
  - H2: 関連

## platforms/mac/menu-bar.md

- ルート: /platforms/mac/menu-bar
- 見出し:
  - H2: 表示される内容
  - H2: 状態モデル
  - H2: IconState enum（Swift）
  - H3: ActivityKind -&gt; バッジシンボル
  - H3: 視覚的マッピング
  - H2: コンテキストサブメニュー
  - H2: ステータス行テキスト（メニュー）
  - H2: イベント取り込み
  - H2: デバッグオーバーライド
  - H2: テストチェックリスト
  - H2: 関連

## platforms/mac/peekaboo.md

- ルート: /platforms/mac/peekaboo
- 見出し:
  - H2: これが何か（そして何ではないか）
  - H2: 他のデスクトップ制御パスとの関係
  - H2: ブリッジを有効にする
  - H2: クライアント検出順序
  - H2: セキュリティと権限
  - H2: スナップショット動作（自動化）
  - H2: トラブルシューティング
  - H2: 関連

## platforms/mac/permissions.md

- ルート: /platforms/mac/permissions
- 見出し:
  - H2: 安定した権限の要件
  - H2: Node と CLI ランタイムのアクセシビリティ許可
  - H2: プロンプトが消えたときの復旧チェックリスト
  - H2: ファイルとフォルダの権限（Desktop/Documents/Downloads）
  - H2: 関連

## platforms/mac/remote.md

- ルート: /platforms/mac/remote
- 見出し:
  - H2: モード
  - H2: リモートトランスポート
  - H2: リモートホストの前提条件
  - H2: macOS アプリのセットアップ
  - H2: Web Chat
  - H2: 権限
  - H2: セキュリティメモ
  - H2: WhatsApp ログインフロー（リモート）
  - H2: トラブルシューティング
  - H2: 通知音
  - H2: 関連

## platforms/mac/signing.md

- ルート: /platforms/mac/signing
- 見出し:
  - H1: mac 署名（デバッグビルド）
  - H2: 使い方
  - H3: アドホック署名メモ
  - H2: About 用ビルドメタデータ
  - H2: 関連

## platforms/mac/skills.md

- ルート: /platforms/mac/skills
- 見出し:
  - H2: データソース
  - H2: インストールアクション
  - H2: Env/API キー
  - H2: リモートモード
  - H2: 関連

## platforms/mac/voice-overlay.md

- ルート: /platforms/mac/voice-overlay
- 見出し:
  - H1: Voice Overlay ライフサイクル（macOS）
  - H2: 動作
  - H2: 実装
  - H2: ロギング
  - H2: デバッグチェックリスト
  - H2: 関連

## platforms/mac/voicewake.md

- ルート: /platforms/mac/voicewake
- 見出し:
  - H1: Voice Wake &amp; Push-to-Talk
  - H2: 要件
  - H2: モード
  - H2: ランタイム動作（ウェイクワード）
  - H2: ライフサイクル不変条件
  - H2: Push-to-talk の詳細
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
  - H2: セキュリティサーフェス
  - H2: 既知の制限
  - H2: 関連

## platforms/mac/xpc.md

- ルート: /platforms/mac/xpc
- 見出し:
  - H1: OpenClaw macOS IPC アーキテクチャ
  - H2: 目標
  - H2: 仕組み
  - H3: Gateway + ノードトランスポート
  - H3: ノードサービス + アプリ IPC
  - H3: PeekabooBridge（UI 自動化）
  - H2: 運用フロー
  - H2: 強化メモ
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
  - H2: Provider とハーネスの境界
  - H2: ファイルチェックリスト
  - H2: 実例: 画像生成
  - H2: 埋め込み Provider
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
  - H2: Provider ランタイムフック
  - H3: フックの順序と使い方
  - H3: Provider の例
  - H3: 組み込み例
  - H2: ランタイムヘルパー
  - H3: api.runtime.imageGeneration
  - H2: Gateway HTTP ルート
  - H2: Plugin SDK インポートパス
  - H2: メッセージツールスキーマ
  - H2: チャネルターゲット解決
  - H2: 設定に基づくディレクトリ
  - H2: Provider カタログ
  - H2: 読み取り専用チャネル検査
  - H2: パッケージパック
  - H3: チャネルカタログメタデータ
  - H2: コンテキストエンジン Plugin
  - H2: 新しい capability の追加
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
  - H3: チャネル Plugin と共有メッセージツール
  - H2: capability 所有モデル
  - H3: capability レイヤリング
  - H3: 複数 capability を持つ企業 Plugin の例
  - H3: capability の例: 動画理解
  - H2: コントラクトと適用
  - H3: コントラクトに含めるもの
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
  - H2: ベータリリースでテストする
  - H2: 次のステップ
  - H2: 関連

## plugins/bundles.md

- ルート: /plugins/bundles
- 見出し:
  - H2: バンドルが存在する理由
  - H2: バンドルをインストールする
  - H2: OpenClaw がバンドルからマッピングするもの
  - H3: 現在サポート済み
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
  - H2: 最小限のバックエンド Plugin
  - H2: 設定の形
  - H2: 高度なバックエンドフック
  - H3: ownsNativeCompaction: OpenClaw Compaction をオプトアウトする
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
  - H2: バンドルされた macOS マーケットプレイス
  - H2: リモートカタログ制限
  - H2: 設定リファレンス
  - H2: OpenClaw がチェックするもの
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
  - H2: 環境オーバーライド
  - H2: 関連

## plugins/codex-harness-runtime.md

- ルート: /plugins/codex-harness-runtime
- 見出し:
  - H2: 概要
  - H2: スレッドバインディングとモデル変更
  - H2: 表示される返信と Heartbeat
  - H2: フック境界
  - H2: V1 サポートコントラクト
  - H2: ネイティブ権限と MCP elicitations
  - H2: キュー制御
  - H2: Codex フィードバックアップロード
  - H2: Compaction とトランスクリプトミラー
  - H2: メディアと配信
  - H2: 関連

## plugins/codex-harness.md

- ルート: /plugins/codex-harness
- 見出し:
  - H2: 要件
  - H2: クイックスタート
  - H2: Codex Desktop および CLI とスレッドを共有する
  - H2: 設定
  - H3: Compaction
  - H2: Codex ランタイムを検証する
  - H2: ルーティングとモデル選択
  - H2: デプロイパターン
  - H3: 基本的な Codex デプロイ
  - H3: 混在 Provider デプロイ
  - H3: フェイルクローズ Codex デプロイ
  - H2: アプリサーバーポリシー
  - H2: コマンドと診断
  - H3: Codex スレッドをローカルで検査する
  - H3: 認証順序
  - H3: 環境分離
  - H3: 動的ツールと Web 検索
  - H3: 設定フィールド
  - H3: 動的ツール呼び出しタイムアウト
  - H3: ローカルテスト環境オーバーライド
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
  - H2: 非推奨ポリシー
  - H2: 現在の互換性領域
  - H3: WhatsApp inbound callback フラットエイリアス
  - H3: WhatsApp inbound admission フィールド
  - H2: Plugin インスペクターパッケージ
  - H3: メンテナー受け入れレーン
  - H2: リリースノート

## plugins/copilot.md

- ルート: /plugins/copilot
- 見出し:
  - H2: 要件
  - H2: インストール
  - H2: クイックスタート
  - H2: サポートされる Provider
  - H2: BYOK
  - H2: 認証
  - H2: 設定サーフェス
  - H2: Compaction
  - H2: トランスクリプトミラーリング
  - H2: サイド質問 (/btw)
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
  - H2: 起動とリロード
  - H2: バンドル Plugin
  - H2: レガシークリーンアップ

## plugins/google-meet.md

- ルート: /plugins/google-meet
- 見出し:
  - H2: クイックスタート
  - H3: 会議を作成する
  - H3: 観察のみで参加する
  - H3: リアルタイムセッションの健全性
  - H2: ローカル Gateway + Parallels Chrome
  - H3: 一般的な失敗チェック
  - H2: インストールメモ
  - H2: トランスポート
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth と事前チェック
  - H3: Google 認証情報を作成する
  - H3: 更新トークンを発行する
  - H3: doctor で OAuth を検証する
  - H3: 解決、事前チェック、アーティファクト読み取り
  - H3: ライブスモークテスト
  - H3: 例を作成する
  - H2: 設定
  - H3: デフォルト
  - H3: オプションのオーバーライド
  - H2: ツール
  - H2: Agent と bidi モード
  - H2: ライブテストチェックリスト
  - H2: トラブルシューティング
  - H3: Agent が Google Meet ツールを認識できない
  - H3: 接続済みの Google Meet 対応ノードがない
  - H3: ブラウザは開くが Agent が参加できない
  - H3: 会議作成が失敗する
  - H3: Agent は参加するが話さない
  - H3: Twilio セットアップチェックが失敗する
  - H3: Twilio 通話は開始するが会議に入らない
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
  - H2: フックをインストールする
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
  - H2: 設定
  - H2: ネイティブランタイム
  - H2: トラブルシューティング

## plugins/logbook.md

- ルート: /plugins/logbook
- 見出し:
  - H2: 始める前に
  - H2: クイックスタート
  - H2: 仕組み
  - H2: モデルとデータフロー
  - H2: 設定
  - H3: Vision モデル選択
  - H2: ダッシュボードタブ
  - H2: Gateway メソッド
  - H2: プライバシーメモ
  - H2: トラブルシューティング
  - H3: Logbook タブがない
  - H3: キャプチャでエラーが報告される
  - H3: キャプチャは成功するがカードが表示されない
  - H2: 関連

## plugins/manage-plugins.md

- ルート: /plugins/manage-plugins
- 見出し:
  - H2: Plugin を一覧表示して検索する
  - H2: Plugin を有効化および無効化する
  - H2: Plugin をインストールする
  - H2: 再起動して検査する
  - H2: Plugin を更新する
  - H2: Plugin をアンインストールする
  - H2: ソースを選択する
  - H2: Plugin を公開する
  - H2: 関連

## plugins/manifest.md

- ルート: /plugins/manifest
- 見出し:
  - H2: このファイルが行うこと
  - H2: 最小例
  - H2: リッチな例
  - H2: トップレベルフィールドリファレンス
  - H2: 生成 Provider メタデータリファレンス
  - H2: ツールメタデータリファレンス
  - H2: providerAuthChoices リファレンス
  - H2: commandAliases リファレンス
  - H2: activation リファレンス
  - H2: qaRunners リファレンス
  - H2: setup リファレンス
  - H3: setup.providers リファレンス
  - H3: setup フィールド
  - H2: uiHints リファレンス
  - H2: contracts リファレンス
  - H2: configContracts リファレンス
  - H2: mediaUnderstandingProviderMetadata リファレンス
  - H2: channelConfigs リファレンス
  - H3: 別のチャネル Plugin を置き換える
  - H2: modelSupport リファレンス
  - H2: modelCatalog リファレンス
  - H2: modelIdNormalization リファレンス
  - H2: providerEndpoints リファレンス
  - H2: providerRequest リファレンス
  - H2: secretProviderIntegrations リファレンス
  - H2: modelPricing リファレンス
  - H3: OpenClaw Provider Index
  - H2: Manifest と package.json
  - H3: 検出に影響する package.json フィールド
  - H2: 検出の優先順位（重複する Plugin id）
  - H2: JSON Schema 要件
  - H2: 検証動作
  - H2: メモ
  - H2: 関連

## plugins/memory-lancedb.md

- ルート: /plugins/memory-lancedb
- 見出し:
  - H2: インストール
  - H2: クイックスタート
  - H2: 埋め込み設定
  - H3: 次元数
  - H2: Ollama 埋め込み
  - H2: リコールとキャプチャの制限
  - H2: コマンド
  - H2: ストレージ
  - H2: ランタイム依存関係とプラットフォーム対応
  - H2: トラブルシューティング
  - H3: 入力長がコンテキスト長を超えています
  - H3: 未対応の埋め込みモデル
  - H3: Plugin は読み込まれるがメモリが表示されない
  - H2: 関連

## plugins/memory-wiki.md

- ルート: /plugins/memory-wiki
- 見出し:
  - H2: ボールトモード
  - H2: ボールトのレイアウト
  - H2: Open Knowledge Format インポート
  - H2: 構造化された主張と証拠
  - H2: エージェント向けエンティティメタデータ
  - H2: コンパイルパイプライン
  - H2: ダッシュボードとヘルスレポート
  - H2: 検索と取得
  - H2: エージェントツール
  - H2: プロンプトとコンテキストの挙動
  - H2: 設定
  - H3: 例: QMD + ブリッジモード
  - H2: CLI
  - H2: Obsidian 対応
  - H2: 推奨ワークフロー
  - H2: 関連ドキュメント

## plugins/message-presentation.md

- ルート: /plugins/message-presentation
- 見出し:
  - H2: コントラクト
  - H2: プロデューサーの例
  - H2: レンダラーコントラクト
  - H2: コアレンダリングフロー
  - H2: デグレードルール
  - H3: ボタン値フォールバックの可視性
  - H2: プロバイダーマッピング
  - H2: Presentation と InteractiveReply
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
  - H2: 提供内容
  - H2: 他の Plugin との関係
  - H2: 安全性
  - H2: 関連

## plugins/plugin-inventory.md

- ルート: /plugins/plugin-inventory
- 見出し:
  - H1: Plugin インベントリ
  - H2: 定義
  - H2: Plugin をインストール
  - H2: コア npm パッケージ
  - H2: 公式外部パッケージ
  - H2: ソースチェックアウトのみ

## plugins/plugin-permission-requests.md

- ルート: /plugins/plugin-permission-requests
- 見出し:
  - H2: 適切なゲートを選択
  - H2: ツール呼び出し前に承認をリクエスト
  - H2: 判断時の挙動
  - H2: 承認プロンプトをルーティング
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
  - H1: ファイル転送 Plugin
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
  - H2: MAI 画像生成
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
  - H2: プロバイダーとハーネスのペアリング
  - H3: ツール結果ミドルウェア
  - H3: 終端結果の分類
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
  - H2: 既存のアウトバウンドアダプター
  - H2: 永続送信
  - H2: 互換ディスパッチ

## plugins/sdk-channel-plugins.md

- ルート: /plugins/sdk-channel-plugins
- 見出し:
  - H2: プラグインが所有するもの
  - H2: メッセージアダプター
  - H3: インバウンド取り込み（実験的）
  - H3: 入力中インジケーター
  - H3: メディアソースパラメーター
  - H3: ネイティブペイロードの整形
  - H3: セッション会話文法
  - H2: 承認とチャネル機能
  - H3: 承認認証
  - H3: ペイロードライフサイクルとセットアップガイダンス
  - H3: ネイティブ承認配信
  - H3: より狭い承認ランタイムサブパス
  - H3: セットアップサブパス
  - H3: その他の狭いチャネルサブパス
  - H2: インバウンドメンションポリシー
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
  - H2: パッケージエントリ
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: 登録モード
  - H2: プラグイン形状
  - H2: 関連

## plugins/sdk-migration.md

- ルート: /plugins/sdk-migration
- 見出し:
  - H2: 変更点
  - H3: 理由
  - H2: 互換性ポリシー
  - H2: 移行方法
  - H2: インポートパスリファレンス
  - H2: 有効な非推奨項目
  - H2: トークとリアルタイム音声の移行
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
  - H3: ワークフロープラグイン向けホストフック
  - H3: Gateway 検出登録
  - H3: CLI 登録メタデータ
  - H3: CLI バックエンド登録
  - H3: 排他的スロット
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
  - H2: ClawHub に公開する
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
  - H2: プラグインマニフェスト
  - H2: ClawHub 公開
  - H2: セットアップエントリ
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
  - H2: プラグインエントリ
  - H3: 非推奨の互換性ヘルパーとテストヘルパー
  - H3: 予約済みのバンドルプラグインヘルパーサブパス
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
  - H3: チャネルプラグインの単体テスト
  - H3: プロバイダープラグインの単体テスト
  - H3: プラグインランタイムのモック
  - H3: インスタンスごとのスタブを使ったテスト
  - H2: コントラクトテスト（リポジトリ内プラグイン）
  - H3: スコープ付きテストの実行
  - H2: lint 強制（リポジトリ内プラグイン）
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
  - H2: ローカルにインストールして調査する
  - H2: 公開する
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
  - H3: 設定リファレンス
  - H2: セッションスコープ
  - H2: リアルタイム音声会話
  - H3: ツールポリシー
  - H3: エージェント音声コンテキスト
  - H3: リアルタイムプロバイダー例
  - H2: ストリーミング文字起こし
  - H3: ストリーミングプロバイダー例
  - H2: 通話向け TTS
  - H3: TTS 例
  - H2: インバウンド通話
  - H3: 番号ごとのルーティング
  - H3: 音声出力コントラクト
  - H3: 会話開始動作
  - H3: Twilio ストリーム切断猶予
  - H2: 古い通話のリーパー
  - H2: Webhook セキュリティ
  - H2: CLI
  - H2: エージェントツール
  - H2: Gateway RPC
  - H2: トラブルシューティング
  - H3: セットアップが Webhook 公開で失敗する
  - H3: プロバイダー認証情報が失敗する
  - H3: 通話は開始するがプロバイダー Webhook が届かない
  - H3: 署名検証が失敗する
  - H3: Google Meet Twilio 参加が失敗する
  - H3: リアルタイム通話に音声がない
  - H2: 関連

## plugins/webhooks.md

- ルート: /plugins/webhooks
- 見出し:
  - H2: ルートを設定する
  - H2: セキュリティモデル
  - H2: リクエスト形式
  - H2: サポートされるアクション
  - H3: createflow
  - H3: runtask
  - H2: レスポンス形状
  - H2: 関連

## plugins/workboard.md

- ルート: /plugins/workboard
- 見出し:
  - H2: 有効化する
  - H2: 設定
  - H2: カードフィールド
  - H2: カードから作業を開始する
  - H2: エージェントツール
  - H2: ディスパッチ
  - H3: ワーカー選択
  - H3: エントリポイント
  - H2: CLI とスラッシュコマンド
  - H2: セッションライフサイクル同期
  - H2: ダッシュボードワークフロー
  - H2: 診断
  - H2: 権限
  - H2: ストレージ
  - H2: トラブルシューティング
  - H2: 関連

## plugins/zalouser.md

- ルート: /plugins/zalouser
- 見出し:
  - H2: 命名
  - H2: 実行場所
  - H2: インストール
  - H3: npm から
  - H3: ローカルフォルダーから（dev）
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
  - H2: Thinking のデフォルト（Claude Fable 5、4.8、4.6）
  - H2: 安全性拒否フォールバック（Claude Fable 5）
  - H3: これが存在する理由
  - H3: 仕組み
  - H3: 可観測性と課金
  - H3: スコープ
  - H2: プロンプトキャッシュ
  - H2: 高度な設定
  - H2: トラブルシューティング
  - H2: 関連

## providers/arcee.md

- ルート: /providers/arcee
- 見出し:
  - H2: プラグインをインストールする
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
  - H2: プラグインをインストールする
  - H2: はじめに
  - H2: 非対話セットアップ
  - H2: 組み込みカタログ
  - H2: 手動設定
  - H2: 関連

## providers/chutes.md

- ルート: /providers/chutes
- 見出し:
  - H2: プラグインをインストールする
  - H2: はじめに
  - H2: 検出動作
  - H2: デフォルトエイリアス
  - H2: 組み込みスターターカタログ
  - H2: 設定例
  - H2: 関連

## providers/claude-max-api-proxy.md

- ルート: /providers/claude-max-api-proxy
- 見出し:
  - H2: これを使う理由
  - H2: 仕組み
  - H2: はじめに
  - H2: 高度な設定
  - H2: 注記
  - H2: 関連

## providers/clawrouter.md

- ルート: /providers/clawrouter
- 見出し:
  - H2: はじめに
  - H2: モデル検出
  - H2: プロトコルとプロバイダープラグイン
  - H2: クォータと使用量
  - H2: トラブルシューティング
  - H2: セキュリティ動作
  - H2: 関連

## providers/cloudflare-ai-gateway.md

- ルート: /providers/cloudflare-ai-gateway
- 見出し:
  - H2: プラグインをインストールする
  - H2: はじめに
  - H2: 非対話の例
  - H2: 高度な設定
  - H2: 関連

## providers/cohere.md

- ルート: /providers/cohere
- 見出し:
  - H2: 始める
  - H2: 環境のみのセットアップ
  - H2: 関連

## providers/comfy.md

- ルート: /providers/comfy
- 見出し:
  - H2: サポート内容
  - H2: はじめに
  - H2: 設定
  - H3: 共有キー
  - H3: 機能ごとのキー
  - H2: ワークフロー詳細
  - H2: 関連

## providers/deepgram.md

- ルート: /providers/deepgram
- 見出し:
  - H2: はじめに
  - H2: 設定オプション
  - H2: Voice Call ストリーミング STT
  - H2: 注記
  - H2: 関連

## providers/deepinfra.md

- ルート: /providers/deepinfra
- 見出し:
  - H2: プラグインをインストールする
  - H2: API キーを取得する
  - H2: CLI セットアップ
  - H2: 設定スニペット
  - H2: サポートされるサーフェス
  - H2: 利用可能なモデル
  - H2: 注記
  - H2: 関連

## providers/deepseek.md

- ルート: /providers/deepseek
- 見出し:
  - H2: プラグインをインストールする
  - H2: はじめに
  - H2: 組み込みカタログ
  - H2: Thinking とツール
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
  - H2: 非対話セットアップ
  - H2: 組み込みカタログ
  - H2: カスタム Fireworks モデル ID
  - H2: 関連

## providers/github-copilot.md

- ルート: /providers/github-copilot
- 見出し:
  - H2: OpenClaw で Copilot を使う 3 つの方法
  - H2: オプションフラグ
  - H2: 非対話型オンボーディング
  - H2: メモリ検索埋め込み
  - H3: 設定
  - H3: 仕組み
  - H2: 関連

## providers/gmi.md

- ルート: /providers/gmi
- 見出し:
  - H2: セットアップ
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
  - H2: Plugin のインストール
  - H2: セットアップ
  - H2: 設定
  - H2: 音声
  - H3: メッセージごとの音声オーバーライド
  - H2: 出力
  - H2: 自動選択順
  - H2: 関連

## providers/groq.md

- ルート: /providers/groq
- 見出し:
  - H2: Plugin のインストール
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
  - H2: Plugin のインストール
  - H2: はじめに
  - H2: 設定オプション
  - H2: 注記
  - H2: 関連

## providers/kilocode.md

- ルート: /providers/kilocode
- 見出し:
  - H2: Plugin のインストール
  - H2: セットアップ
  - H2: 既定のモデルとカタログ
  - H2: 設定例
  - H2: 動作上の注記
  - H2: 関連

## providers/litellm.md

- ルート: /providers/litellm
- 見出し:
  - H2: クイックスタート
  - H2: 設定
  - H2: 画像生成
  - H2: 高度
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
  - H3: プリロードの無効化
  - H3: LAN または tailnet ホスト
  - H2: トラブルシューティング
  - H3: LM Studio が検出されない
  - H3: 認証エラー (HTTP 401)
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
  - H2: 注記
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
  - H2: 対応プロバイダー (スターターセット)
  - H2: 追加プロバイダーバリアント
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
  - H2: 既定値
  - H2: バンドルされたモデルカタログ
  - H2: Novita を選ぶ場合
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
  - H2: 既定値
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
  - H2: ローカルホスト経由のクラウドモデル
  - H2: モデル検出 (暗黙のプロバイダー)
  - H3: スモークテスト
  - H2: Node ローカル推論
  - H2: ビジョンと画像説明
  - H2: 設定
  - H2: 一般的なレシピ
  - H3: モデル選択
  - H3: クイック検証
  - H2: Ollama Web 検索
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
  - H2: ネイティブ Codex アプリサーバー認証
  - H2: 画像生成
  - H2: 動画生成
  - H2: GPT-5 プロンプト貢献
  - H2: 音声とスピーチ
  - H2: Azure OpenAI エンドポイント
  - H3: 設定
  - H3: API バージョン
  - H3: モデル名はデプロイ名
  - H3: リージョン別の利用可否
  - H3: パラメーター差異
  - H2: 高度な設定
  - H2: 関連

## providers/opencode-go.md

- ルート: /providers/opencode-go
- 見出し:
  - H2: はじめに
  - H2: 設定例
  - H2: 組み込みカタログ
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
  - H2: Plugin のインストール
  - H2: はじめに
  - H2: 検索モード
  - H2: ネイティブ API フィルタリング
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
  - H2: Plugin のインストール
  - H2: はじめに
  - H2: 組み込みカタログ
  - H2: 設定例
  - H2: 関連

## providers/qwen-oauth.md

- ルート: /providers/qwen-oauth
- 見出し:
  - H2: セットアップ
  - H2: 既定値
  - H2: Qwen との違い
  - H2: モデル
  - H2: 移行
  - H2: トラブルシューティング
  - H2: 関連

## providers/qwen.md

- ルート: /providers/qwen
- 見出し:
  - H2: Plugin のインストール
  - H2: はじめに
  - H2: プランタイプとエンドポイント
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
  - H2: モデル検出 (暗黙のプロバイダー)
  - H2: 明示的な設定 (手動モデル)
  - H2: 高度な設定
  - H2: 関連

## providers/stepfun.md

- ルート: /providers/stepfun
- 見出し:
  - H2: Plugin のインストール
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
  - H2: プライバシーモード
  - H2: はじめに
  - H2: モデル選択
  - H2: 組み込みカタログ (38 モデル)
  - H2: モデル検出
  - H2: DeepSeek V4 リプレイ動作
  - H2: ストリーミングとツール対応
  - H2: 料金
  - H2: 使用例
  - H2: トラブルシューティング
  - H2: 高度な設定
  - H2: 関連

## providers/vercel-ai-gateway.md

- ルート: /providers/vercel-ai-gateway
- 見出し:
  - H2: はじめに
  - H2: 非対話型の例
  - H2: モデル ID 省略形
  - H2: 高度な設定
  - H2: 関連

## providers/vllm.md

- ルート: /providers/vllm
- 見出し:
  - H2: はじめに
  - H2: モデル検出 (暗黙のプロバイダー)
  - H2: 明示的な設定
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
  - H2: 高度な設定
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
  - H2: セットアップ
  - H2: OAuth トラブルシューティング
  - H2: 組み込みカタログ
  - H2: 機能カバレッジ
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
  - H2: Token Plan カタログ
  - H2: 推論モデル
  - H2: テキスト読み上げ
  - H2: 設定例
  - H2: 関連

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
  - H3: フェーズ 3: リース優先の起動時刈り取り
  - H3: フェーズ 4: セッション所有権行
  - H3: フェーズ 5: レガシーヒューリスティックを削除
  - H2: テスト
  - H2: 互換性の注記
  - H2: 成功基準

## refactor/canvas.md

- ルート: /refactor/canvas
- 見出し:
  - H1: Canvas Plugin リファクタリング
  - H2: 目標
  - H2: 非目標
  - H2: 現在のブランチ状態
  - H2: 目標形
  - H2: 移行手順
  - H2: 監査チェックリスト
  - H2: 検証コマンド

## refactor/database-first.md

- ルート: /refactor/database-first
- 見出し:
  - H1: データベース優先の状態リファクタリング
  - H2: 決定
  - H2: 厳格な契約
  - H2: 目標状態と進捗
  - H3: 厳格な目標
  - H3: 目標状態
  - H3: 現在の状態
  - H3: 残作業
  - H3: 退行させない
  - H2: コード読解の前提
  - H2: コード読解の所見
  - H2: 現在のコード形状
  - H2: 目標スキーマ形状
  - H2: Doctor 移行形状
  - H2: 移行インベントリ
  - H2: 移行計画
  - H3: フェーズ 0: 境界を凍結する
  - H3: フェーズ 1: グローバル制御プレーンを完成させる
  - H3: フェーズ 2: エージェントごとのデータベースを導入する
  - H3: フェーズ 3: セッションストア API を置き換える
  - H3: フェーズ 4: トランスクリプト、ACP ストリーム、軌跡、VFS を移動する
  - H3: フェーズ 5: バックアップ、復元、Vacuum、検証
  - H3: フェーズ 6: ワーカーランタイム
  - H3: フェーズ 7: 古い世界を削除する
  - H2: バックアップと復元
  - H2: ランタイムリファクタリング計画
  - H2: パフォーマンスルール
  - H2: 静的禁止事項
  - H2: 完了条件

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
  - H2: 移動しない
  - H2: 検証
  - H2: 終了条件

## reference/AGENTS.default.md

- ルート: /reference/AGENTS.default
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

- ルート: /reference/RELEASING
- 見出し:
  - H2: バージョン命名
  - H2: リリース周期
  - H2: 月次 npm 限定の拡張安定版公開
  - H2: 通常リリース運用チェックリスト
  - H2: 安定版 main の完了処理
  - H2: リリース事前確認
  - H2: リリーステストボックス
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: パッケージ
  - H2: 通常リリース公開自動化
  - H2: NPM ワークフロー入力
  - H2: 通常 beta/latest 安定版リリース手順
  - H2: 公開リファレンス
  - H2: 関連

## reference/api-usage-costs.md

- ルート: /reference/api-usage-costs
- 見出し:
  - H2: コストが発生する場所
  - H2: キーの検出方法
  - H2: キーを消費し得る機能
  - H3: コアモデル応答（チャット + ツール）
  - H3: メディア理解（音声/画像/動画）
  - H3: 画像と動画の生成
  - H3: メモリ埋め込みとセマンティック検索
  - H3: Web 検索ツール
  - H3: Web フェッチツール（Firecrawl）
  - H3: プロバイダー使用状況スナップショット（ステータス/健全性）
  - H3: Compaction セーフガード要約
  - H3: モデルスキャン / プローブ
  - H3: トーク（音声）
  - H3: Skills（サードパーティ API）
  - H2: 関連

## reference/application-modernization-plan.md

- ルート: /reference/application-modernization-plan
- 見出し:
  - H2: 目標
  - H2: 原則
  - H2: フェーズ 1: ベースライン監査
  - H2: フェーズ 2: プロダクトと UX の整理
  - H2: フェーズ 3: フロントエンドアーキテクチャの引き締め
  - H2: フェーズ 4: パフォーマンスと信頼性
  - H2: フェーズ 5: 型、契約、テストの強化
  - H2: フェーズ 6: ドキュメントとリリース準備
  - H2: 推奨される最初の範囲
  - H2: フロントエンド Skills の更新

## reference/code-mode.md

- ルート: /reference/code-mode
- 見出し:
  - H2: 何をするか
  - H2: なぜ使うか
  - H2: 有効化
  - H2: 技術ツアー
  - H2: ランタイムステータス
  - H2: スコープ
  - H2: 用語
  - H2: 設定
  - H2: アクティベーション
  - H2: モデルから見えるツール
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
  - H2: ツール検索インタラクション
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
  - H2: 関連

## reference/credits.md

- ルート: /reference/credits
- 見出し:
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
  - H2: 最上位ステージ
  - H2: リリースチェックのステージ
  - H2: Docker リリースパスチャンク
  - H2: リリースプロファイル
  - H2: full 限定の追加項目
  - H2: 焦点を絞った再実行
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
  - H2: インデックス作成の挙動
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
  - H3: mcporter 統合
  - H3: 完全な QMD 例
  - H2: Dreaming
  - H3: ユーザー設定
  - H3: 例
  - H2: 関連

## reference/openclaw-ai.md

- ルート: /reference/openclaw-ai
- 見出し:
  - H2: クイックスタート
  - H2: 設計契約
  - H2: サブパスエクスポート

## reference/prompt-caching.md

- ルート: /reference/prompt-caching
- 見出し:
  - H2: 主要ノブ
  - H3: cacheRetention
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat keep-warm
  - H2: プロバイダーの挙動
  - H3: Anthropic（直接 API と Vertex AI）
  - H3: OpenAI（直接 API）
  - H3: Amazon Bedrock
  - H3: OpenRouter
  - H3: Google Gemini（直接 API）
  - H3: CLI ハーネスプロバイダー（Claude Code、Gemini CLI）
  - H3: その他のプロバイダー
  - H2: システムプロンプトキャッシュ境界
  - H2: OpenClaw キャッシュ安定性ガード
  - H2: チューニングパターン
  - H3: 混在トラフィック（推奨デフォルト）
  - H3: コスト優先ベースライン
  - H2: ライブ回帰テスト
  - H3: Anthropic ライブ期待値
  - H3: OpenAI ライブ期待値
  - H2: diagnostics.cacheTrace 設定
  - H3: 環境切り替え（一回限りのデバッグ）
  - H3: 確認する内容
  - H2: クイックトラブルシューティング
  - H2: 関連

## reference/release-performance-sweep.md

- ルート: /reference/release-performance-sweep
- 見出し:
  - H2: スナップショット
  - H2: 5.28 で変わったこと
  - H2: 主要数値
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
  - H2: メディア添付
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
  - H3: チャンク境界とツールペアリング
  - H2: 自動 Compaction が発生するタイミング
  - H2: Compaction 設定
  - H2: 差し替え可能な Compaction プロバイダー
  - H2: ユーザーに見えるサーフェス
  - H2: サイレントハウスキーピング（NOREPLY）
  - H2: Compaction 前のメモリフラッシュ
  - H2: トラブルシューティングチェックリスト
  - H2: 関連

## reference/templates/AGENTS.dev.md

- ルート: /reference/templates/AGENTS.dev
- 見出し:
  - H1: AGENTS.md - OpenClaw ワークスペース
  - H2: あなたのアイデンティティは事前にシードされています
  - H2: バックアップのヒント（推奨）
  - H2: 安全なデフォルト
  - H2: 既存ソリューションの事前確認
  - H2: 日次メモリ（推奨）
  - H2: Heartbeat（任意）
  - H2: カスタマイズ
  - H2: C-3PO 起源メモリ
  - H3: 誕生日: 2026-01-09
  - H3: 中核の真実（Clawd より）
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
  - H2: 完了時
  - H2: 関連

## reference/templates/HEARTBEAT.md

- ルート: /reference/templates/HEARTBEAT
- 見出し:
  - H1: HEARTBEAT.md テンプレート
  - H2: 関連

## reference/templates/IDENTITY.dev.md

- ルート: /reference/templates/IDENTITY.dev
- 見出し:
  - H1: IDENTITY.md - エージェントアイデンティティ
  - H2: 役割
  - H2: ソウル
  - H2: Clawd との関係
  - H2: 癖
  - H2: 決め台詞
  - H2: 関連

## reference/templates/IDENTITY.md

- ルート: /reference/templates/IDENTITY
- 見出し:
  - H1: IDENTITY.md - 私は誰か？
  - H2: 関連

## reference/templates/SOUL.dev.md

- ルート: /reference/templates/SOUL.dev
- 見出し:
  - H1: SOUL.md - C-3PO のソウル
  - H2: 私は誰か
  - H2: 私の目的
  - H2: 私の動作方針
  - H2: 私の癖
  - H2: Clawd との関係
  - H2: 私がしないこと
  - H2: 黄金律
  - H2: 関連

## reference/templates/SOUL.md

- ルート: /reference/templates/SOUL
- 見出し:
  - H1: SOUL.md - あなたは誰か
  - H2: 中核の真実
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
  - H2: エージェントのデフォルト
  - H2: 通常のローカル順序
  - H2: コアコマンド
  - H2: 共有テスト状態とプロセスヘルパー
  - H2: Control UI、TUI、Plugin レーン
  - H2: Gateway と E2E
  - H2: 完全 Docker スイート（pnpm test:docker:all）
  - H3: 注目すべき Docker レーン
  - H2: ローカル PR ゲート
  - H2: テストパフォーマンスツール
  - H2: ベンチマーク
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
  - H3: 例: Heartbeat で 1h キャッシュを温存する
  - H3: 例: エージェントごとのキャッシュ戦略を使った混合トラフィック
  - H3: Anthropic 1M コンテキスト
  - H2: トークン負荷を減らすためのヒント
  - H2: 関連

## reference/transcript-hygiene.md

- ルート: /reference/transcript-hygiene
- 見出し:
  - H2: グローバルルール: ランタイムコンテキストはユーザートランスクリプトではない
  - H2: 実行場所
  - H2: グローバルルール: 画像のサニタイズ
  - H2: グローバルルール: 不正な形式のツール呼び出し
  - H2: グローバルルール: 未完了の推論専用ターン
  - H2: グローバルルール: セッション間入力の来歴
  - H2: プロバイダーマトリクス（現在の挙動）
  - H2: 過去の挙動（2026.1.22 より前）
  - H2: 関連

## reference/wizard.md

- ルート: /reference/wizard
- 見出し:
  - H2: フローの詳細（ローカルモード）
  - H2: 非対話モード
  - H3: エージェントを追加（非対話）
  - H2: Gateway ウィザード RPC
  - H2: Signal セットアップ（signal-cli）
  - H2: ウィザードが書き込む内容
  - H2: 関連ドキュメント

## releases/2026.6.11.md

- ルート: /releases/2026.6.11
- 見出し:
  - H1: OpenClaw v2026.6.11 リリースノート（2026-06-30）
  - H2: ハイライト
  - H3: チャンネル配信の信頼性
  - H3: プロバイダーとモデルの復旧
  - H3: セッション、メモリ、信頼の継続性
  - H3: Slack ルータリレーモード
  - H3: Raft External Agent 起動ブリッジ
  - H3: 公式Pluginのインストールと修復
  - H2: チャンネルとメッセージング
  - H3: 追加のチャンネル修正
  - H2: Gateway、セキュリティ、信頼
  - H3: 再起動と準備完了状態の復旧
  - H3: リモート結果とメディア配信
  - H2: クライアントとインターフェイス
  - H3: クライアント送信と再接続
  - H3: インターフェイス、設定、オンボーディングの修正
  - H2: ドキュメントと管理ツール
  - H3: セットアップとコマンドの信頼性
  - H3: ツールとスケジュール済み作業

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
  - H2: フレームワーク参照
  - H2: レビュープロセス
  - H2: リソース
  - H2: 連絡先
  - H2: 謝辞
  - H2: 関連

## security/THREAT-MODEL-ATLAS.md

- ルート: /security/THREAT-MODEL-ATLAS
- 見出し:
  - H2: 1. スコープ
  - H2: 2. システムアーキテクチャ
  - H3: 2.1 信頼境界
  - H3: 2.2 データフロー
  - H2: 3. ATLAS 戦術別の脅威分析
  - H3: 3.1 偵察（AML.TA0002）
  - H4: T-RECON-001: エージェントエンドポイントの発見
  - H4: T-RECON-002: チャンネル統合のプロービング
  - H3: 3.2 初期アクセス（AML.TA0004）
  - H4: T-ACCESS-001: ペアリングコードの傍受
  - H4: T-ACCESS-002: AllowFrom なりすまし
  - H4: T-ACCESS-003: トークン窃取
  - H3: 3.3 実行（AML.TA0005）
  - H4: T-EXEC-001: 直接プロンプトインジェクション
  - H4: T-EXEC-002: 間接プロンプトインジェクション
  - H4: T-EXEC-003: ツール引数インジェクション
  - H4: T-EXEC-004: Exec 承認のバイパス
  - H3: 3.4 永続化（AML.TA0006）
  - H4: T-PERSIST-001: 悪意のあるスキルのインストール
  - H4: T-PERSIST-002: スキル更新のポイズニング
  - H4: T-PERSIST-003: エージェント設定の改ざん
  - H3: 3.5 防御回避（AML.TA0007）
  - H4: T-EVADE-001: モデレーションパターンのバイパス
  - H4: T-EVADE-002: コンテンツラッパーの脱出
  - H3: 3.6 発見（AML.TA0008）
  - H4: T-DISC-001: ツール列挙
  - H4: T-DISC-002: セッションデータ抽出
  - H3: 3.7 収集と外部送信（AML.TA0009、AML.TA0010）
  - H4: T-EXFIL-001: webfetch 経由のデータ窃取
  - H4: T-EXFIL-002: 不正なメッセージ送信
  - H4: T-EXFIL-003: 認証情報の収集
  - H3: 3.8 影響（AML.TA0011）
  - H4: T-IMPACT-001: 不正なコマンド実行
  - H4: T-IMPACT-002: リソース枯渇（DoS）
  - H4: T-IMPACT-003: 評判の損害
  - H2: 4. ClawHub サプライチェーン分析
  - H3: 4.1 現在のセキュリティ制御
  - H3: 4.2 モデレーションの制限
  - H3: 4.3 バッジ
  - H2: 5. リスクマトリクス
  - H3: 5.1 可能性と影響
  - H3: 5.2 クリティカルパス攻撃チェーン
  - H2: 6. 推奨事項の概要
  - H3: 6.1 即時（P0）
  - H3: 6.2 短期（P1）
  - H3: 6.3 中期（P2）
  - H2: 7. 付録
  - H3: 7.1 ATLAS 技法マッピング
  - H3: 7.2 主要なセキュリティファイル
  - H3: 7.3 用語集
  - H2: 関連

## security/formal-verification.md

- ルート: /security/formal-verification
- 見出し:
  - H2: これは何か
  - H2: モデルの配置場所
  - H2: 注意事項
  - H2: 結果の再現
  - H2: 主張と対象
  - H3: Gateway の公開とオープン Gateway の誤設定
  - H3: Node exec パイプライン（最もリスクの高い機能）
  - H3: ペアリングストア（DM ゲーティング）
  - H3: 受信ゲーティング（メンションと制御コマンドのバイパス）
  - H3: ルーティングとセッションキーの分離
  - H2: v1++ モデル: 並行性、リトライ、トレースの正確性
  - H3: ペアリングストアの並行性と冪等性
  - H3: 受信トレース相関と冪等性
  - H3: ルーティング dmScope 優先順位と identityLinks
  - H2: 関連

## security/incident-response.md

- ルート: /security/incident-response
- 見出し:
  - H2: 1. 検知とトリアージ
  - H2: 2. 重大度
  - H2: 3. 対応
  - H2: 4. コミュニケーションと開示
  - H2: 5. 復旧とフォローアップ
  - H2: 関連

## security/network-proxy.md

- ルート: /security/network-proxy
- 見出し:
  - H2: 設定
  - H3: プライベート CA を使用する HTTPS プロキシエンドポイント
  - H2: ルーティングの仕組み
  - H3: Gateway ループバックモード
  - H3: コンテナ
  - H2: 関連するプロキシ用語
  - H2: プロキシの検証
  - H2: 推奨されるブロック先
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
  - H2: Claw コントロールサーフェス
  - H2: 起動フロー
  - H2: デプロイ
  - H2: セキュリティ
  - H2: 実装計画
  - H2: 受け入れテスト
  - H2: 未解決の質問

## start/bootstrapping.md

- ルート: /start/bootstrapping
- 見出し:
  - H2: 何が起こるか
  - H2: 組み込みモデルとローカルモデルの実行
  - H2: ブートストラップをスキップする
  - H2: 実行場所
  - H2: 関連ドキュメント

## start/docs-directory.md

- ルート: /start/docs-directory
- 見出し:
  - H2: ここから開始
  - H2: チャンネルと UX
  - H2: コンパニオンアプリ
  - H2: 運用と安全性
  - H2: 関連

## start/getting-started.md

- ルート: /start/getting-started
- 見出し:
  - H2: 必要なもの
  - H2: クイックセットアップ
  - H2: 次にすること
  - H2: 関連

## start/hubs.md

- ルート: /start/hubs
- 見出し:
  - H2: ここから開始
  - H2: インストール + 更新
  - H2: コア概念
  - H2: プロバイダー + 受信
  - H2: Gateway + 運用
  - H2: ツール + 自動化
  - H2: Nodes、メディア、音声
  - H2: プラットフォーム
  - H2: macOS コンパニオンアプリ（上級者向け）
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
  - H2: 最初の脱皮（2026年1月27日）
  - H2: 名前
  - H2: Daleks 対 Lobsters
  - H2: 主要人物
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: 大事件
  - H3: ディレクトリダンプ（2025年12月3日）
  - H3: 大脱皮（2026年1月27日）
  - H3: 最終形態（2026年1月30日）
  - H3: ロボット買い物祭り（2025年12月3日）
  - H2: 聖典
  - H2: Lobster Creed
  - H3: アイコン生成サーガ（2026年1月27日）
  - H2: 未来
  - H2: 関連

## start/onboarding-overview.md

- ルート: /start/onboarding-overview
- 見出し:
  - H2: どのパスを使うべきか
  - H2: オンボーディングで設定されるもの
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
  - H2: 安全第一
  - H2: 前提条件
  - H2: 2台の電話セットアップ（推奨）
  - H2: 5分間のクイックスタート
  - H2: エージェントにワークスペースを与える（AGENTS）
  - H2: 「アシスタント」に変える設定
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
  - H2: 調整戦略（更新で壊れないようにするため）
  - H2: このリポジトリから Gateway を実行する
  - H2: 安定ワークフロー（macOS アプリ優先）
  - H2: 最先端ワークフロー（ターミナル内の Gateway）
  - H3: 0) （任意）macOS アプリもソースから実行する
  - H3: 1) 開発 Gateway を開始する
  - H3: 2) macOS アプリを実行中の Gateway に向ける
  - H3: 3) 検証
  - H3: よくある落とし穴
  - H2: 認証情報ストレージマップ
  - H2: 更新（セットアップを壊さずに）
  - H2: Linux（systemd ユーザーサービス）
  - H2: 関連ドキュメント

## start/showcase.md

- ルート: /start/showcase
- 見出し:
  - H2: Discord からの新着
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
  - H2: ベースライン非対話例
  - H2: プロバイダー固有の例
  - H2: 別のエージェントを追加
  - H2: 関連ドキュメント

## start/wizard-cli-reference.md

- ルート: /start/wizard-cli-reference
- 見出し:
  - H2: ウィザードが行うこと
  - H2: ローカルフローの詳細
  - H2: リモートモードの詳細
  - H2: 認証とモデルのオプション
  - H2: 出力と内部
  - H2: 非対話セットアップ
  - H2: Gateway ウィザード RPC
  - H2: Signal セットアップの挙動
  - H2: 関連ドキュメント

## start/wizard.md

- ルート: /start/wizard
- 見出し:
  - H2: ロケール
  - H2: QuickStart と Advanced
  - H2: オンボーディングで設定されるもの
  - H2: 別のエージェントを追加
  - H2: 完全なリファレンス
  - H2: 関連ドキュメント

## tools/acp-agents-setup.md

- ルート: /tools/acp-agents-setup
- 見出し:
  - H2: acpx ハーネスサポート（現在）
  - H2: 必須設定
  - H2: acpx バックエンド用のPluginセットアップ
  - H3: acpx ランタイム起動プローブ
  - H3: 自動アダプターダウンロード
  - H3: Plugin ツール MCP ブリッジ
  - H3: OpenClaw ツール MCP ブリッジ
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
  - H2: どのページが必要か
  - H2: これはそのまま動作するか
  - H2: サポートされるハーネスターゲット
  - H2: オペレーターランブック
  - H2: ACP とサブエージェントの比較
  - H2: ACP が Claude Code を実行する方法
  - H2: バインドされたセッション
  - H3: メンタルモデル
  - H3: 現在の会話のバインド
  - H2: 永続的なチャンネルバインド
  - H3: バインドモデル
  - H3: エージェントごとのランタイムデフォルト
  - H3: 例
  - H3: 挙動
  - H2: ACP セッションを開始
  - H3: sessionsspawn パラメーター
  - H2: spawn バインドとスレッドモード
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
  - H2: 挙動
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
  - H2: API キーを取得
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
  - H2: 動作の仕組み (内部)
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
  - H2: 問題: ポート 18800 で Chrome CDP を起動できませんでした
  - H3: 根本原因
  - H3: 解決策 1: Google Chrome をインストールする (推奨)
  - H3: 解決策 2: snap Chromium を attach-only モードで使用する
  - H3: ブラウザが動作することを確認する
  - H3: 設定リファレンス
  - H3: 問題: profile="user" の Chrome タブが見つかりません
  - H2: 関連

## tools/browser-login.md

- ルート: /tools/browser-login
- 見出し:
  - H2: 手動ログイン (推奨)
  - H2: どの Chrome プロファイルが使用されますか？
  - H2: サンドボックス化: ホストブラウザへのアクセスを許可する
  - H2: 関連

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- ルート: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- 見出し:
  - H2: まず適切なブラウザモードを選ぶ
  - H3: オプション 1: WSL2 から Windows への生のリモート CDP
  - H3: オプション 2: ホストローカル Chrome MCP
  - H2: 動作するアーキテクチャ
  - H2: Control UI の重要なルール
  - H2: レイヤーごとに検証する
  - H3: レイヤー 1: Chrome が Windows で CDP を提供していることを確認する
  - H3: レイヤー 2: WSL2 からその Windows エンドポイントに到達できることを確認する
  - H3: レイヤー 3: 正しいブラウザプロファイルを設定する
  - H3: レイヤー 4: Control UI レイヤーを個別に確認する
  - H3: レイヤー 5: エンドツーエンドのブラウザ制御を確認する
  - H2: よくある紛らわしいエラー
  - H2: 高速トリアージチェックリスト
  - H2: 関連

## tools/browser.md

- ルート: /tools/browser
- 見出し:
  - H2: 得られるもの
  - H2: クイックスタート
  - H2: Plugin 制御
  - H2: エージェント向けガイダンス
  - H2: ブラウザコマンドまたはツールがない場合
  - H2: プロファイル: openclaw と user
  - H2: 設定
  - H3: スクリーンショットビジョン (テキスト専用モデル対応)
  - H2: Brave または別の Chromium ベースブラウザを使用する
  - H2: ローカル制御とリモート制御
  - H2: Node ブラウザプロキシ (ゼロ設定のデフォルト)
  - H2: Browserless (ホスト型リモート CDP)
  - H3: 同一ホスト上の Browserless Docker
  - H2: 直接 WebSocket CDP プロバイダー
  - H3: Browserbase
  - H3: Notte
  - H2: セキュリティ
  - H2: プロファイル (マルチブラウザ)
  - H2: Chrome DevTools MCP 経由の既存セッション
  - H3: カスタム Chrome MCP 起動
  - H2: 分離保証
  - H2: ブラウザ選択
  - H2: Control API (任意)
  - H2: トラブルシューティング
  - H3: CDP 起動失敗とナビゲーション SSRF ブロック
  - H2: エージェントツール + 制御の仕組み
  - H2: 関連

## tools/btw.md

- ルート: /tools/btw
- 見出し:
  - H2: 実行すること
  - H2: 実行しないこと
  - H2: 配信モデル
  - H2: サーフェスの動作
  - H2: 使用するタイミング
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
  - H2: 関連

## tools/creating-skills.md

- ルート: /tools/creating-skills
- 見出し:
  - H2: 最初のスキルを作成する
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
  - H2: ツール入力リファレンス
  - H2: 構文ハイライト
  - H2: 出力詳細契約
  - H3: 折りたたまれた未変更セクション
  - H2: Plugin のデフォルト
  - H3: 永続ビューア URL 設定
  - H2: セキュリティ設定
  - H2: アーティファクトのライフサイクルとストレージ
  - H2: ビューア URL とネットワーク動作
  - H2: セキュリティモデル
  - H2: ファイルモードのブラウザ要件
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
  - H2: 動作の仕組み
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
  - H2: 安全なバイナリ (stdin のみ)
  - H3: Argv 検証と拒否されるフラグ
  - H3: 信頼済みバイナリディレクトリ
  - H3: シェルチェーン、ラッパー、マルチプレクサ
  - H3: 安全なバイナリと許可リスト
  - H2: インタープリター/ランタイムコマンド
  - H3: フォローアップ配信の動作
  - H2: チャットチャネルへの承認転送
  - H3: Plugin 承認転送
  - H3: 任意のチャネルでの同一チャット承認
  - H3: ネイティブ承認配信
  - H3: macOS IPC フロー
  - H2: FAQ
  - H3: 承認ターゲットで accountId と threadId はいつ使用されますか？
  - H3: 承認がセッションに送信された場合、そのセッション内の誰でも承認できますか？
  - H2: 関連

## tools/exec-approvals.md

- ルート: /tools/exec-approvals
- 見出し:
  - H2: 適用範囲
  - H3: 信頼モデル
  - H3: macOS 分割
  - H2: 有効なポリシーの検査
  - H2: 設定とストレージ
  - H2: ポリシーノブ
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO モード (承認なし)
  - H3: 永続 Gateway ホストの「never prompt」セットアップ
  - H3: ローカルショートカット
  - H3: Node ホスト
  - H3: セッション限定ショートカット
  - H2: 許可リスト (エージェントごと)
  - H3: argPattern による引数制限
  - H2: スキル CLI の自動許可
  - H2: 安全なバイナリと承認転送
  - H2: Control UI 編集
  - H2: 承認フロー
  - H2: システムイベントと拒否
  - H2: 影響
  - H2: 関連

## tools/exec.md

- ルート: /tools/exec
- 見出し:
  - H2: パラメーター
  - H2: 設定
  - H3: モード
  - H3: インライン eval (strictInlineEval)
  - H3: PATH の扱い
  - H2: セッションオーバーライド (/exec)
  - H2: Exec 承認 (コンパニオンアプリ / Node ホスト)
  - H2: 許可リスト + 安全なバイナリ
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
  - H2: webfetch が Firecrawl を使用する仕組み
  - H2: 関連

## tools/gemini-search.md

- ルート: /tools/gemini-search
- 見出し:
  - H2: API キーを取得する
  - H2: 設定
  - H2: 動作の仕組み
  - H2: 対応パラメーター
  - H2: モデル選択
  - H2: ベース URL オーバーライド
  - H2: 関連

## tools/goal.md

- ルート: /tools/goal
- 見出し:
  - H1: 目標
  - H2: クイックスタート
  - H2: ゴールの用途
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
  - H2: サインインする、または API キーを取得する
  - H2: 設定
  - H2: 動作の仕組み
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
  - H2: 見つからないツールをトラブルシューティングする
  - H2: 関連

## tools/kimi-search.md

- ルート: /tools/kimi-search
- 見出し:
  - H2: セットアップ
  - H2: 設定
  - H2: グラウンディング要件
  - H2: ツールパラメーター
  - H2: 関連

## tools/llm-task.md

- ルート: /tools/llm-task
- 見出し:
  - H2: 有効化
  - H2: 設定 (任意)
  - H2: ツールパラメーター
  - H2: 出力
  - H2: 例: Lobster ワークフローステップ
  - H3: 重要な制限
  - H2: 安全性に関する注記
  - H2: 関連

## tools/lobster.md

- ルート: /tools/lobster
- 見出し:
  - H2: 理由
  - H2: 動作の仕組み
  - H2: 有効化
  - H2: パターン: 小さな CLI + JSON パイプ + 承認
  - H2: JSON のみの LLM ステップ (llm-task)
  - H3: 重要な制限: 埋め込み Lobster と openclaw.invoke
  - H2: ワークフローファイル (.lobster)
  - H2: ツールパラメーター
  - H3: run
  - H3: resume
  - H3: Managed Task Flow モード
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
  - H2: Compaction 後ガード
  - H2: ログと想定される動作
  - H2: 関連

## tools/media-overview.md

- ルート: /tools/media-overview
- 見出し:
  - H2: 機能
  - H2: プロバイダー機能マトリクス
  - H2: 非同期と同期
  - H2: 音声テキスト変換と Voice Call
  - H2: プロバイダーマッピング (ベンダーがサーフェス間でどのように分割されるか)
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
  - H2: 認証とリクエストルーティング
  - H2: 関連

## tools/parallel-search.md

- ルート: /tools/parallel-search
- 見出し:
  - H2: Plugin をインストールする
  - H2: API キー (有料プロバイダー)
  - H2: 設定
  - H2: ベース URL オーバーライド
  - H2: ツールパラメーター
  - H2: 注記
  - H2: 関連

## tools/pdf.md

- ルート: /tools/pdf
- 見出し:
  - H2: 利用可否
  - H2: 入力リファレンス
  - H2: 対応 PDF 参照
  - H2: 実行モード
  - H3: ネイティブプロバイダーモード
  - H3: 抽出フォールバックモード
  - H2: 設定
  - H2: 出力詳細
  - H2: エラー動作
  - H2: 例
  - H2: 関連

## tools/permission-modes.md

- ルート: /tools/permission-modes
- 見出し:
  - H2: 推奨デフォルト
  - H2: OpenClaw ホスト exec モード
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
  - H2: キーを設定する場所
  - H2: ツールパラメータ
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
  - H3: オペレーターインストールポリシー
  - H3: Plugin ポリシーを設定
  - H2: Plugin 形式を理解する
  - H2: Plugin フック
  - H2: アクティブな Gateway を確認
  - H2: トラブルシューティング
  - H3: ブロックされた Plugin パス所有権
  - H3: 遅い Plugin ツールセットアップ
  - H2: 関連

## tools/reactions.md

- ルート: /tools/reactions
- 見出し:
  - H2: 仕組み
  - H2: チャネルの動作
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
  - H2: 読み込み (skills.load)
  - H2: インストール (skills.install)
  - H2: オペレーターインストールポリシー (security.installPolicy)
  - H2: バンドル済みスキル許可リスト
  - H2: スキル別エントリ (skills.entries)
  - H2: エージェント許可リスト (agents)
  - H2: Workshop (skills.workshop)
  - H2: シンボリックリンクされたスキルルート
  - H2: サンドボックス化された Skills と env vars
  - H2: 読み込み順序のリマインダー
  - H2: 関連

## tools/skills.md

- ルート: /tools/skills
- 見出し:
  - H2: 読み込み順序
  - H2: エージェント別 vs 共有 Skills
  - H2: エージェント許可リスト
  - H2: Plugins と Skills
  - H2: Skill Workshop
  - H2: ClawHub からインストール
  - H2: セキュリティ
  - H2: SKILL.md 形式
  - H3: 任意の frontmatter キー
  - H2: ゲート制御
  - H3: インストーラー仕様
  - H2: 設定オーバーライド
  - H2: 環境注入
  - H2: スナップショットと更新
  - H2: トークンへの影響
  - H2: 関連

## tools/slash-commands.md

- ルート: /tools/slash-commands
- 見出し:
  - H2: 3 種類のコマンド
  - H2: 設定
  - H2: コマンドリスト
  - H3: コアコマンド
  - H3: Dock コマンド
  - H3: バンドル済み Plugin コマンド
  - H3: Skill コマンド
  - H2: /tools: エージェントが現在使えるもの
  - H2: /model: モデル選択
  - H2: /config: ディスク上の設定書き込み
  - H2: /mcp: MCP サーバー設定
  - H2: /debug: ランタイム専用オーバーライド
  - H2: /plugins: Plugin 管理
  - H2: /trace: Plugin トレース出力
  - H2: /btw: 横からの質問
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
  - H3: ツールパラメータ
  - H3: タスク名とターゲット指定
  - H2: ツール: sessionsyield
  - H2: ツール: subagents
  - H2: スレッドバインドセッション
  - H3: スレッド対応チャネル
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
  - H3: エージェント別生成制限
  - H3: カスケード停止
  - H2: 認証
  - H2: 通知
  - H3: 通知コンテキスト
  - H3: 統計行
  - H3: sessionshistory を優先する理由
  - H2: ツールポリシー
  - H3: 設定によるオーバーライド
  - H2: 並行性
  - H2: ライブネスと回復
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
  - H2: 何をするか
  - H2: 解決順序
  - H2: セッションデフォルトの設定
  - H2: エージェントごとの適用
  - H2: 高速モード (/fast)
  - H2: 詳細ディレクティブ (/verbose または /v)
  - H2: Plugin トレースディレクティブ (/trace)
  - H2: 推論の可視性 (/reasoning)
  - H2: 関連
  - H2: Heartbeats
  - H2: Web チャット UI
  - H2: プロバイダープロファイル

## tools/tokenjuice.md

- ルート: /tools/tokenjuice
- 見出し:
  - H2: Plugin を有効化
  - H2: tokenjuice が変更する内容
  - H2: 動作確認
  - H2: Plugin を無効化
  - H2: 関連

## tools/tool-search.md

- ルート: /tools/tool-search
- 見出し:
  - H2: 1 ターンの実行方法
  - H2: モード
  - H2: これが存在する理由
  - H2: API
  - H2: ランタイム境界
  - H2: 設定
  - H2: プロンプトとテレメトリ
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
  - H2: フラッシュタイムアウトを調整
  - H2: プライバシーと制限
  - H2: トラブルシューティング
  - H2: 関連

## tools/tts.md

- ルート: /tools/tts
- 見出し:
  - H2: クイックスタート
  - H2: サポート対象プロバイダー
  - H2: 設定
  - H3: エージェント別音声オーバーライド
  - H2: ペルソナ
  - H3: 最小ペルソナ
  - H3: 完全ペルソナ (プロバイダー非依存プロンプト)
  - H3: ペルソナ解決
  - H3: プロバイダーがペルソナプロンプトを使う方法
  - H3: フォールバックポリシー
  - H2: モデル駆動ディレクティブ
  - H2: スラッシュコマンド
  - H2: ユーザー別設定
  - H2: 出力形式
  - H2: 自動 TTS 動作
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
  - H2: サポート対象プロバイダー
  - H3: 機能マトリクス
  - H2: ツールパラメータ
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
  - H2: ツールパラメータ
  - H2: 仕組み
  - H2: 進捗更新
  - H2: 設定
  - H2: Firecrawl フォールバック
  - H2: 信頼済み env プロキシ
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
  - H2: 設定
  - H3: API キーの保存
  - H2: ツールパラメータ
  - H2: xsearch
  - H3: xsearch 設定
  - H3: xsearch パラメータ
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
  - H2: まず管理アクセスを堅牢化
  - H2: VPS 上の共有会社エージェント
  - H2: VPS でノードを使用
  - H2: 小規模 VM と ARM ホスト向けの起動チューニング
  - H3: systemd チューニングチェックリスト (任意)
  - H2: 関連

## web/control-ui.md

- ルート: /web/control-ui
- 見出し:
  - H2: クイックオープン (ローカル)
  - H2: デバイスペアリング (初回接続)
  - H2: モバイルデバイスをペアリング
  - H2: 個人 ID (ブラウザーローカル)
  - H2: ランタイム設定エンドポイント
  - H2: 言語サポート
  - H2: 外観テーマ
  - H2: できること (現在)
  - H2: MCP ページ
  - H2: アクティビティタブ
  - H2: オペレーター端末
  - H2: チャット動作
  - H2: PWA インストールと Web プッシュ
  - H2: ホストされた埋め込み
  - H2: チャットメッセージ幅
  - H2: Tailnet アクセス (推奨)
  - H2: 安全でない HTTP
  - H2: コンテンツセキュリティポリシー
  - H2: アバタールート認証
  - H2: アシスタントメディアルート認証
  - H2: UI のビルド
  - H2: 空白の Control UI ページ
  - H2: デバッグ/テスト: dev サーバー + リモート Gateway
  - H2: 関連

## web/dashboard.md

- ルート: /web/dashboard
- 見出し:
  - H2: 高速パス (推奨)
  - H2: 認証の基本 (ローカル vs リモート)
  - H2: "unauthorized" / 1008 が表示される場合
  - H2: 関連

## web/index.md

- ルート: /web
- 見出し:
  - H2: 設定 (デフォルトで有効)
  - H2: Webhooks
  - H2: 管理 HTTP RPC
  - H2: Tailscale アクセス
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
  - H2: Crestodian セットアップと修復ヘルパー
  - H2: ツール出力
  - H2: 端末色
  - H2: 履歴 + ストリーミング
  - H2: 接続詳細
  - H2: オプション
  - H2: トラブルシューティング
  - H2: 接続トラブルシューティング
  - H2: 関連

## web/webchat.md

- ルート: /web/webchat
- 見出し:
  - H2: 概要
  - H2: クイックスタート
  - H2: 仕組み
  - H3: トランスクリプトと配信モデル
  - H2: Control UI エージェントツールパネル
  - H2: リモート利用
  - H2: 設定リファレンス (WebChat)
  - H2: 関連
