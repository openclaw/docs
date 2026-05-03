---
read_when:
    - Plugin インポートに適した plugin-sdk サブパスの選択
    - 同梱Pluginのサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDK サブパスカタログ: どのインポートがどこにあるかを領域別に整理'
title: Plugin SDK サブパス
x-i18n:
    generated_at: "2026-05-03T21:37:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK は `openclaw/plugin-sdk/` 配下の狭いサブパス群として公開されています。
  このページでは、よく使われるサブパスを目的別に分類して一覧化します。生成された
  200 以上のサブパスの完全な一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。
  予約済みのバンドル Plugin ヘルパーのサブパスもそこに表示されますが、ドキュメントページで明示的に昇格されていない限り、実装の詳細です。メンテナーは `pnpm plugins:boundary-report:summary` でアクティブな予約済みヘルパーサブパスを監査できます。未使用の予約済みヘルパーエクスポートは、休眠した互換性負債として公開 SDK に残るのではなく、CI レポートで失敗します。

  Plugin 作成ガイドについては、[Plugin SDK 概要](/ja-JP/plugins/sdk-overview)を参照してください。

  ## Plugin エントリ

  | サブパス                                  | 主要なエクスポート                                                                                                                                                           |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | レガシー Plugin テスト向けの広範な互換性バレル。新しい拡張テストでは、焦点を絞ったテスト用サブパスを優先してください                                                         |
  | `plugin-sdk/plugin-test-api`              | 直接的な Plugin 登録ユニットテスト向けの最小限の `OpenClawPluginApi` モックビルダー                                                                                         |
  | `plugin-sdk/agent-runtime-test-contracts` | 認証プロファイル、配信抑制、フォールバック分類、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト修復のためのネイティブ agent-runtime アダプター契約フィクスチャ |
  | `plugin-sdk/channel-test-helpers`         | チャネルアカウントライフサイクル、ディレクトリ、送信設定、ランタイムモック、フック、バンドルチャネルエントリ、エンベロープタイムスタンプ、ペアリング返信、汎用チャネル契約のテストヘルパー |
  | `plugin-sdk/channel-target-testing`       | 共有チャネルターゲット解決エラーケーステストスイート                                                                                                                        |
  | `plugin-sdk/plugin-test-contracts`        | Plugin 登録、パッケージマニフェスト、公開アーティファクト、ランタイム API、インポート副作用、直接インポート契約のヘルパー                                                   |
  | `plugin-sdk/plugin-test-runtime`          | テスト向けの Plugin ランタイム、レジストリ、プロバイダー登録、セットアップウィザード、ランタイム TaskFlow フィクスチャ                                                       |
  | `plugin-sdk/provider-test-contracts`      | プロバイダーランタイム、認証、検出、オンボーディング、カタログ、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索/取得、ウィザード契約のヘルパー        |
  | `plugin-sdk/provider-http-test-mocks`     | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けのオプトイン Vitest HTTP/認証モック                                                                               |
  | `plugin-sdk/test-env`                     | テスト環境、fetch/ネットワーク、使い捨て HTTP サーバー、受信リクエスト、ライブテスト、一時ファイルシステム、時刻制御フィクスチャ                                           |
  | `plugin-sdk/test-fixtures`                | 汎用 CLI、サンドボックス、Skills、エージェントメッセージ、システムイベント、モジュール再読み込み、バンドル Plugin パス、ターミナル、チャンク化、認証トークン、型付きケースのテストフィクスチャ |
  | `plugin-sdk/test-node-mocks`              | Vitest の `vi.mock("node:*")` ファクトリ内で使用する、焦点を絞った Node 組み込みモックヘルパー                                                                               |
  | `plugin-sdk/migration`                    | `createMigrationItem` などの移行プロバイダー項目ヘルパー、理由定数、項目ステータスマーカー、秘匿化ヘルパー、`summarizeMigrationItems`                                      |
  | `plugin-sdk/migration-runtime`            | `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`、`writeMigrationReport` などのランタイム移行ヘルパー                                                             |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマエクスポート（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、許可リストプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントのフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 狭いアカウント一覧/アカウントアクションヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有チャネル設定スキーマプリミティブ、および Zod と直接 JSON/TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | 保守対象のバンドル Plugin のみを対象とした、バンドル OpenClaw チャネル設定スキーマ |
    | `plugin-sdk/channel-config-schema-legacy` | バンドルチャネル設定スキーマ向けの非推奨互換性エイリアス |
    | `plugin-sdk/telegram-command-config` | バンドル契約フォールバック付きの Telegram カスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 狭いコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`、ドラフトストリームのライフサイクル/最終化ヘルパー |
    | `plugin-sdk/inbound-envelope` | 共有受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有受信記録・ディスパッチヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲット解析/照合ヘルパー |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みヘルパー |
    | `plugin-sdk/outbound-send-deps` | チャネルアダプター向けの軽量な送信依存関係検索 |
    | `plugin-sdk/outbound-runtime` | 送信配信、ID、送信デリゲート、セッション、フォーマット、ペイロード計画ヘルパー |
    | `plugin-sdk/poll-runtime` | 狭い poll 正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルとアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャネルステータススナップショット/要約ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 狭いチャネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャネル Plugin プリアンブルエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有直接 DM 認証/ガードヘルパー |
    | `plugin-sdk/discord` | 公開済み `@openclaw/discord@2026.3.13` と追跡対象オーナー互換性のための非推奨 Discord 互換性ファサード。新しい Plugin は汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/telegram-account` | 追跡対象オーナー互換性のための非推奨 Telegram アカウント解決互換性ファサード。新しい Plugin は注入されたランタイムヘルパーまたは汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/zalouser` | 送信者コマンド認可をまだインポートしている公開済み Lark/Zalo パッケージ向けの非推奨 Zalo Personal 互換性ファサード。新しい Plugin は `plugin-sdk/command-auth` を使用してください |
    | `plugin-sdk/interactive-runtime` | セマンティックメッセージ表示、配信、レガシーインタラクティブ返信ヘルパー。[メッセージ表示](/ja-JP/plugins/message-presentation)を参照してください |
    | `plugin-sdk/channel-inbound` | 受信デバウンス、メンション照合、メンションポリシーヘルパー、エンベロープヘルパー向けの互換性バレル |
    | `plugin-sdk/channel-inbound-debounce` | 狭い受信デバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広い受信ランタイムサーフェスを含まない、狭いメンションポリシー、メンションマーカー、メンションテキストヘルパー |
    | `plugin-sdk/channel-envelope` | 狭い受信エンベロープフォーマットヘルパー |
    | `plugin-sdk/channel-location` | チャネル位置コンテキストとフォーマットヘルパー |
    | `plugin-sdk/channel-logging` | 受信ドロップと入力中/ack 失敗向けのチャネルログヘルパー |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャネルメッセージアクションヘルパー、および Plugin 互換性のために保持されている非推奨ネイティブスキーマヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動のターゲット解決、スレッド ID 文字列化、ルートキーの重複排除/圧縮、解析済みターゲット型、ルート/ターゲット比較ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析ヘルパー。ルート比較の呼び出し元は `plugin-sdk/channel-route` を使用してください |
    | `plugin-sdk/channel-contract` | チャネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` などの狭いシークレット契約ヘルパー、およびシークレットターゲット型 |
  </Accordion>

  <Accordion title="プロバイダーサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムモデル準備のための、サポート対象 LM Studio プロバイダーファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーのデフォルト、モデル検出、リクエストヘッダー、読み込み済みモデルヘルパーのための、サポート対象 LM Studio ランタイムファサード |
    | `plugin-sdk/provider-setup` | 精選されたローカル/セルフホストプロバイダーのセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホストプロバイダー向けに特化したセットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト + watchdog 定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダーPlugin向けのランタイム API キー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キーオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 認証結果ビルダー |
    | `plugin-sdk/provider-auth-login` | プロバイダーPlugin向けの共有インタラクティブログインヘルパー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証環境変数検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、および `normalizeNativeXaiModelId` などのモデル ID 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-runtime` | コントラクトテスト向けのプロバイダーカタログ拡張ランタイムフックと Plugin プロバイダーレジストリシーム |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダー HTTP/エンドポイント機能ヘルパー、プロバイダー HTTP エラー、音声文字起こしマルチパートフォームヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの限定的な web-fetch 設定/選択コントラクトヘルパー |
    | `plugin-sdk/provider-web-fetch` | web-fetch プロバイダー登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 有効化配線を必要としないプロバイダー向けの限定的な web-search 設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、スコープ付き認証情報 setter/getter などの限定的な web-search 設定/認証情報コントラクトヘルパー |
    | `plugin-sdk/provider-web-search` | web-search プロバイダー登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini スキーマクリーンアップ + 診断、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI 互換性ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、および共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | ガード付き fetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルの singleton/map/cache ヘルパー |
    | `plugin-sdk/group-activation` | 限定的なグループ有効化モードとコマンド解析ヘルパー |
  </Accordion>

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、動的引数メニュー整形を含むコマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決と同一チャットアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットチャンネルエントリーポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より限定的なアダプター/Gateway シームを優先 |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + アカウントバインディングヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | exec/Plugin 承認ペイロードヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、および `formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 限定的な受信返信重複排除リセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広範な testing barrel を使わない限定的なチャンネルコントラクトテストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニュー整形、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットチャンネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文の正規化とコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | チャンネル/Plugin シークレットサーフェス向けの限定的なシークレットコントラクト収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレットコントラクト/設定解析向けの限定的な `coerceSecretRef` と SecretRef 型付けヘルパー |
    | `plugin-sdk/security-runtime` | 共有信頼、DM ゲート、外部コンテンツ、機密テキストの編集、定数時間シークレット比較、シークレット収集ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストとプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範な infra ランタイムサーフェスを使わない限定的な pinned-dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF ガード付き fetch、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパーと raw websocket/body 強制変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム/ロギング/バックアップ/プラグインインストールヘルパー |
    | `plugin-sdk/runtime-env` | 絞り込まれたランタイム環境、ロガー、タイムアウト、リトライ、バックオフヘルパー |
    | `plugin-sdk/browser-config` | 正規化されたプロファイル/デフォルト、CDP URL 解析、ブラウザー制御認証ヘルパー向けの対応ブラウザー設定ファサード |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネルランタイムコンテキストの登録および検索ヘルパー |
    | `plugin-sdk/matrix` | 古いサードパーティチャネルパッケージ向けの非推奨 Matrix 互換ファサード。新しいプラグインは `plugin-sdk/run-command` を直接インポートする必要があります |
    | `plugin-sdk/mattermost` | 古いサードパーティチャネルパッケージ向けの非推奨 Mattermost 互換ファサード。新しいプラグインは汎用 SDK サブパスを直接インポートする必要があります |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有プラグインコマンド/フック/http/インタラクティブヘルパー |
    | `plugin-sdk/hook-runtime` | 共有 Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` などの遅延ランタイムインポート/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI フォーマット、待機、バージョン、引数呼び出し、遅延コマンドグループヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアント、イベントループ準備済みクライアント開始ヘルパー、Gateway CLI RPC、Gateway プロトコルエラー、チャネルステータスパッチヘルパー |
    | `plugin-sdk/config-types` | `OpenClawConfig` やチャネル/プロバイダー設定型など、Plugin 設定形状向けの型専用設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject` などのランタイムプラグイン設定検索ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated` などのトランザクション設定変更ヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テストスナップショットセッターなどの現在プロセス設定スナップショットヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドルされた Telegram 契約サーフェスが利用できない場合でも使える、Telegram コマンド名/説明の正規化と重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広範なテキストランタイムバレルなしでのファイル参照自動リンク検出 |
    | `plugin-sdk/approval-runtime` | 実行/Plugin 承認ヘルパー、承認機能ビルダー、認証/プロファイルヘルパー、ネイティブルーティング/ランタイムヘルパー、構造化承認表示パスフォーマット |
    | `plugin-sdk/reply-runtime` | 共有インバウンド/返信ランタイムヘルパー、チャンク化、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 絞り込まれた返信ディスパッチ/確定と会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled` などの共有短時間ウィンドウ返信履歴ヘルパーとマーカー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 絞り込まれたテキスト/Markdown チャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアパス、セッションキー、更新日時、ストア変更ヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cron ストアパス/読み込み/保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャネル/アカウントステータス要約ヘルパー、ランタイム状態デフォルト、問題メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | スラッグ/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout/stderr 結果を返す時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLI パラメーターリーダー |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化済みペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正規の送信先フィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパー |
    | `plugin-sdk/logging-core` | サブシステムロガーと秘匿化ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードと変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` や `resolveAgentMaxConcurrent` などのモデル/セッション上書きヘルパー |
    | `plugin-sdk/talk-config-runtime` | Talk プロバイダー設定解決ヘルパー |
    | `plugin-sdk/json-store` | 小規模な JSON 状態読み取り/書き込みヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクバックアップ重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP ランタイム/セッションと返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時読み込みプラグイン向けの軽量 ACP バックエンド登録および返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動インポートなしの読み取り専用 ACP バインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 絞り込まれたエージェントランタイム設定スキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩やかな真偽値パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険な名前のマッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスブートストラップとペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャネル、ステータス、環境プロキシヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skill コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリ/ビルド/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的な信頼済み Plugin サーフェス: ハーネス型、Active Run の誘導/中止ヘルパー、OpenClaw ツールブリッジヘルパー、ランタイムプランのツールポリシーヘルパー、ターミナル結果分類、ツール進行状況のフォーマット/詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI エンドポイント検出ヘルパー |
    | `plugin-sdk/async-lock-runtime` | 小規模ランタイム状態ファイル向けのプロセスローカル非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 制限付き非同期タスク並行実行ヘルパー |
    | `plugin-sdk/dedupe-runtime` | メモリ内重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | アウトバウンド保留中配信ドレインヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルおよびメディアソースパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat イベントと可視性ヘルパー |
    | `plugin-sdk/number-runtime` | 数値強制変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | セキュアトークン/UUID ヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了待機ヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換シム。上記の絞り込まれたランタイムサブパスを使用してください |
    | `plugin-sdk/collection-runtime` | 小規模な制限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされた fetch、プロキシ、EnvHttpProxyAgent オプション、固定ルックアップヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ/ガード付き fetch インポートなしのディスパッチャー対応ランタイム fetch |
    | `plugin-sdk/response-limit-runtime` | 広範なメディアランタイムサーフェスなしの制限付きレスポンス本文リーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングやペアリングストアなしの現在会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広範な設定書き込み/メンテナンスインポートなしのセッションストアヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広範な設定/セキュリティインポートなしのコンテキスト可視性解決と補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/ロギングインポートなしの絞り込まれたプリミティブレコード/文字列強制変換および正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名と SCP ホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | リトライ設定とリトライランナーヘルパー |
    | `plugin-sdk/agent-runtime` | エージェントディレクトリ/ID/ワークスペースヘルパー |
    | `plugin-sdk/directory-runtime` | 設定に基づくディレクトリクエリ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有メディアの取得/変換/保存ヘルパー、ffprobe ベースの動画寸法プローブ、メディアペイロードビルダー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` などの限定的なメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、不足モデルメッセージング |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型と、プロバイダー向けの画像/音声ヘルパーエクスポート |
    | `plugin-sdk/text-runtime` | アシスタント表示テキストの除去、Markdown レンダリング/チャンク化/テーブルヘルパー、リダクションヘルパー、ディレクティブタグヘルパー、安全テキストユーティリティなどの共有テキスト/Markdown/ロギングヘルパー |
    | `plugin-sdk/text-chunking` | 送信テキストチャンク化ヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型と、プロバイダー向けのディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、音声ヘルパーエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型とレジストリヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型と画像アセット/データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、レジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリとルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | Webhook パス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有リモート/local メディア読み込みヘルパー |
    | `plugin-sdk/zod` | Plugin SDK コンシューマー向けに再エクスポートされた `zod` |
    | `plugin-sdk/testing` | レガシー Plugin テスト向けの広範な互換性バレル。新しい拡張テストでは、代わりに `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` などの焦点を絞った SDK サブパスをインポートする必要があります |
    | `plugin-sdk/plugin-test-api` | リポジトリのテストヘルパーブリッジをインポートせずに、直接の Plugin 登録ユニットテストを行うための最小限の `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト投影テスト向けのネイティブエージェントランタイムアダプター契約フィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション/セットアップ/ステータス契約、ディレクトリアサーション、アカウント起動ライフサイクル、送信設定スレッド化、ランタイムモック、ステータス問題、送信配信、フック登録向けのチャンネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャンネルテスト向けの共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/plugin-test-contracts` | Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、インポート副作用の契約ヘルパー |
    | `plugin-sdk/provider-test-contracts` | プロバイダーランタイム、認証、検出、オンボード、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索/取得、ストリーム契約ヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けのオプトイン Vitest HTTP/認証モック |
    | `plugin-sdk/test-fixtures` | 汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、スキルライター、エージェントメッセージ、システムイベント、モジュール再読み込み、バンドル Plugin パス、ターミナルテキスト、チャンク化、認証トークン、型付きケースフィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` ファクトリ内で使用するための焦点を絞った Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="メモリサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | マネージャー/設定/ファイル/CLI ヘルパー向けのバンドル memory-core ヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込み契約、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー |
    | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー |
    | `plugin-sdk/memory-core-host-events` | メモリホストイベントジャーナルヘルパー |
    | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホストコアランタイムヘルパー向けのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルヘルパー向けのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | メモリホストファイル/ランタイムヘルパー向けのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 Plugin 向けの共有管理 Markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | 検索マネージャーアクセス向けの Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | メモリホストステータスヘルパー向けのベンダー中立エイリアス |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーサブパス">
    現在、予約済みのバンドルヘルパー SDK サブパスはありません。所有者固有の
    ヘルパーは所有する Plugin パッケージ内にあり、再利用可能なホスト契約は
    `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime`
    などの汎用 SDK サブパスを使用します。
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
