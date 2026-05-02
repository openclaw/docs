---
read_when:
    - Plugin インポートに適した plugin-sdk サブパスの選択
    - バンドル済みPluginのサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDK サブパスカタログ: どのインポートがどこにあるかを領域別に分類'
title: Plugin SDK のサブパス
x-i18n:
    generated_at: "2026-05-02T21:04:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK は、`openclaw/plugin-sdk/` 配下の狭いサブパスのセットとして公開されています。
  このページでは、よく使われるサブパスを目的別に分類して一覧化します。生成された
  200 以上のサブパスの完全な一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。
  予約済みのバンドル Plugin ヘルパーサブパスもそこに表示されますが、ドキュメントページで明示的に公開対象として扱われていない限り、実装詳細です。メンテナーはアクティブな
  予約済みヘルパーサブパスを `pnpm plugins:boundary-report:summary` で監査できます。未使用の
  予約済みヘルパーエクスポートは、休眠状態の互換性負債として公開 SDK に残らず、CI レポートを失敗させます。

  Plugin 作成ガイドについては、[Plugin SDK 概要](/ja-JP/plugins/sdk-overview)を参照してください。

  ## Plugin エントリ

  | サブパス                                  | 主要エクスポート                                                                                                                                                              |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | レガシー Plugin テスト向けの広範な互換性バレル。新しい拡張機能テストでは、対象を絞ったテスト用サブパスを推奨                                                                 |
  | `plugin-sdk/plugin-test-api`              | 直接 Plugin 登録ユニットテスト向けの最小 `OpenClawPluginApi` モックビルダー                                                                                                  |
  | `plugin-sdk/agent-runtime-test-contracts` | 認証プロファイル、配信抑制、フォールバック分類、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト修復向けのネイティブ agent-runtime アダプター契約フィクスチャ |
  | `plugin-sdk/channel-test-helpers`         | チャネルアカウントライフサイクル、ディレクトリ、送信設定、ランタイムモック、フック、バンドルチャネルエントリ、エンベロープタイムスタンプ、ペアリング返信、汎用チャネル契約テストヘルパー |
  | `plugin-sdk/channel-target-testing`       | 共有チャネルターゲット解決エラーケーステストスイート                                                                                                                         |
  | `plugin-sdk/plugin-test-contracts`        | Plugin 登録、パッケージマニフェスト、公開アーティファクト、ランタイム API、インポート副作用、直接インポート契約ヘルパー                                                      |
  | `plugin-sdk/plugin-test-runtime`          | テスト向けの Plugin ランタイム、レジストリ、プロバイダー登録、セットアップウィザード、ランタイムタスクフローのフィクスチャ                                                   |
  | `plugin-sdk/provider-test-contracts`      | プロバイダーランタイム、認証、検出、オンボード、カタログ、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索/fetch、ウィザード契約ヘルパー                 |
  | `plugin-sdk/provider-http-test-mocks`     | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けのオプトイン Vitest HTTP/認証モック                                                                                |
  | `plugin-sdk/test-env`                     | テスト環境、fetch/ネットワーク、使い捨て HTTP サーバー、受信リクエスト、ライブテスト、一時ファイルシステム、時刻制御フィクスチャ                                             |
  | `plugin-sdk/test-fixtures`                | 汎用 CLI、サンドボックス、Skill、エージェントメッセージ、システムイベント、モジュール再読み込み、バンドル Plugin パス、ターミナル、チャンク化、認証トークン、型付きケースのテストフィクスチャ |
  | `plugin-sdk/test-node-mocks`              | Vitest の `vi.mock("node:*")` ファクトリ内で使う、対象を絞った Node 組み込みモックヘルパー                                                                                   |
  | `plugin-sdk/migration`                    | `createMigrationItem` などの移行プロバイダー項目ヘルパー、理由定数、項目ステータスマーカー、秘匿処理ヘルパー、`summarizeMigrationItems`                                     |
  | `plugin-sdk/migration-runtime`            | `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`、`writeMigrationReport` などのランタイム移行ヘルパー                                                             |

  <AccordionGroup>
  <Accordion title="チャネルサブパス">
    | サブパス | 主要エクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` の Zod スキーマエクスポート (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` に加えて、`DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、許可リストプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントのフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウントルックアップ + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 対象を絞ったアカウント一覧/アカウントアクションヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有チャネル設定スキーマプリミティブに加えて、Zod と直接 JSON/TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | 保守対象のバンドル Plugin 専用のバンドル OpenClaw チャネル設定スキーマ |
    | `plugin-sdk/channel-config-schema-legacy` | バンドルチャネル設定スキーマ向けの非推奨互換性エイリアス |
    | `plugin-sdk/telegram-command-config` | バンドル契約フォールバック付きの Telegram カスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 対象を絞ったコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`、ドラフトストリームのライフサイクル/確定ヘルパー |
    | `plugin-sdk/inbound-envelope` | 共有インバウンドルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有インバウンド記録/ディスパッチヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲット解析/照合ヘルパー |
    | `plugin-sdk/outbound-media` | 共有アウトバウンドメディア読み込みヘルパー |
    | `plugin-sdk/outbound-send-deps` | チャネルアダプター向けの軽量アウトバウンド送信依存関係ルックアップ |
    | `plugin-sdk/outbound-runtime` | アウトバウンド配信、ID、送信デリゲート、セッション、フォーマット、ペイロード計画ヘルパー |
    | `plugin-sdk/poll-runtime` | 対象を絞った poll 正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルとアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャネルステータススナップショット/概要ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 対象を絞ったチャネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャネル Plugin プレリュードエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有直接 DM 認証/ガードヘルパー |
    | `plugin-sdk/discord` | 公開済み `@openclaw/discord@2026.3.13` と追跡対象のオーナー互換性のための非推奨 Discord 互換ファサード。新しい Plugin は汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/telegram-account` | 追跡対象のオーナー互換性のための非推奨 Telegram アカウント解決互換ファサード。新しい Plugin は注入されたランタイムヘルパーまたは汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/zalouser` | 送信者コマンド認可をまだインポートしている公開済み Lark/Zalo パッケージ向けの非推奨 Zalo Personal 互換ファサード。新しい Plugin は `plugin-sdk/command-auth` を使用してください |
    | `plugin-sdk/interactive-runtime` | セマンティックメッセージ提示、配信、レガシーインタラクティブ返信ヘルパー。[メッセージ提示](/ja-JP/plugins/message-presentation)を参照してください |
    | `plugin-sdk/channel-inbound` | インバウンドデバウンス、メンション照合、メンションポリシーヘルパー、エンベロープヘルパー向けの互換性バレル |
    | `plugin-sdk/channel-inbound-debounce` | 対象を絞ったインバウンドデバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広範なインバウンドランタイムサーフェスを含まない、対象を絞ったメンションポリシー、メンションマーカー、メンションテキストヘルパー |
    | `plugin-sdk/channel-envelope` | 対象を絞ったインバウンドエンベロープフォーマットヘルパー |
    | `plugin-sdk/channel-location` | チャネルロケーションコンテキストとフォーマットヘルパー |
    | `plugin-sdk/channel-logging` | インバウンドドロップと入力中表示/ack 失敗向けのチャネルログヘルパー |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャネルメッセージアクションヘルパーに加えて、Plugin 互換性のために保持されている非推奨のネイティブスキーマヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動のターゲット解決、スレッド ID の文字列化、重複排除/圧縮済みルートキー、解析済みターゲット型、ルート/ターゲット比較ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析ヘルパー。ルート比較の呼び出し元は `plugin-sdk/channel-route` を使用してください |
    | `plugin-sdk/channel-contract` | チャネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、シークレットターゲット型などの対象を絞ったシークレット契約ヘルパー |
  </Accordion>

  <Accordion title="プロバイダーのサブパス">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムモデル準備のためのサポート対象 LM Studio プロバイダー・ファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーのデフォルト、モデル検出、リクエストヘッダー、読み込み済みモデルヘルパーのためのサポート対象 LM Studio ランタイム・ファサード |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型プロバイダーのセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換のセルフホスト型プロバイダーに特化したセットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト + ウォッチドッグ定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダー Plugin 向けのランタイム API キー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キー オンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 認証結果ビルダー |
    | `plugin-sdk/provider-auth-login` | プロバイダー Plugin 向けの共有対話型ログインヘルパー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証の環境変数検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、および `normalizeNativeXaiModelId` などのモデル ID 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-runtime` | コントラクトテスト向けのプロバイダーカタログ拡張ランタイムフックと Plugin プロバイダーレジストリの継ぎ目 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダー HTTP/エンドポイント機能ヘルパー、プロバイダー HTTP エラー、音声文字起こし用の multipart フォームヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの限定的な Web fetch 設定/選択コントラクトヘルパー |
    | `plugin-sdk/provider-web-fetch` | Web fetch プロバイダー登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 有効化配線を必要としないプロバイダー向けの限定的な Web 検索設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、スコープ付き認証情報の setter/getter などの限定的な Web 検索設定/認証情報コントラクトヘルパー |
    | `plugin-sdk/provider-web-search` | Web 検索プロバイダー登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini スキーマのクリーンアップ + 診断、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI 互換ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、および共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | ガード付き fetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルのシングルトン/マップ/キャッシュヘルパー |
    | `plugin-sdk/group-activation` | 限定的なグループ有効化モードとコマンド解析ヘルパー |
  </Accordion>

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、動的引数メニューの整形を含むコマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決と同一チャットのアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットなチャンネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より限定的なアダプター/Gateway の継ぎ目を優先 |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + アカウントバインディングヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | exec/Plugin 承認ペイロードヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、および `formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 限定的な受信返信重複排除リセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広範なテスト barrel を使わない限定的なチャンネルコントラクトテストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニュー整形、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットなチャンネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文の正規化とコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | チャンネル/Plugin シークレットサーフェス向けの限定的なシークレットコントラクト収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレットコントラクト/設定解析向けの限定的な `coerceSecretRef` と SecretRef 型付けヘルパー |
    | `plugin-sdk/security-runtime` | 共有の信頼、DM ゲート、外部コンテンツ、機密テキストのリダクション、定数時間シークレット比較、シークレット収集ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストとプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範なインフラランタイムサーフェスを使わない限定的な pinned-dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF ガード付き fetch、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパーと raw websocket/body 強制変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文のサイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム/ロギング/バックアップ/Pluginインストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭いランタイム環境、ロガー、タイムアウト、リトライ、バックオフヘルパー |
    | `plugin-sdk/browser-config` | 正規化されたプロファイル/デフォルト、CDP URL解析、ブラウザー制御認証ヘルパーのためのサポート済みブラウザー設定ファサード |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネルランタイムコンテキストの登録および検索ヘルパー |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有Pluginコマンド/フック/http/インタラクティブヘルパー |
    | `plugin-sdk/hook-runtime` | 共有Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface`などの遅延ランタイムインポート/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLIフォーマット、待機、バージョン、引数呼び出し、遅延コマンドグループヘルパー |
    | `plugin-sdk/gateway-runtime` | Gatewayクライアント、イベントループ準備済みクライアント起動ヘルパー、Gateway CLI RPC、Gatewayプロトコルエラー、チャネルステータスパッチヘルパー |
    | `plugin-sdk/config-types` | `OpenClawConfig`やチャネル/プロバイダー設定型など、Plugin設定形状のための型専用設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject`などのランタイムPlugin設定検索ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated`などのトランザクション設定変更ヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テストスナップショットセッターなどの現在プロセス設定スナップショットヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドル済みTelegram契約サーフェスが利用できない場合でも使える、Telegramコマンド名/説明の正規化と重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広範なtext-runtimeバレルを使わないファイル参照オートリンク検出 |
    | `plugin-sdk/approval-runtime` | 実行/Plugin承認ヘルパー、承認ケイパビリティビルダー、認証/プロファイルヘルパー、ネイティブルーティング/ランタイムヘルパー、構造化承認表示パスフォーマット |
    | `plugin-sdk/reply-runtime` | 共有受信/返信ランタイムヘルパー、チャンク分割、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い返信ディスパッチ/完了処理および会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled`などの共有短期ウィンドウ返信履歴ヘルパーとマーカー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いテキスト/Markdownチャンク分割ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアパス、セッションキー、更新日時、ストア変更ヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cronストアのパス/読み込み/保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuthディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャネル/アカウントステータス要約ヘルパー、ランタイム状態デフォルト、Issueメタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | スラッグ/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request風入力から文字列URLを抽出 |
    | `plugin-sdk/run-command` | 正規化されたstdout/stderr結果を返すタイムドコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLIパラメーターリーダー |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化済みペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正規の送信先フィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパー |
    | `plugin-sdk/logging-core` | サブシステムロガーとリダクションヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdownテーブルモードと変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry`や`resolveAgentMaxConcurrent`などのモデル/セッションオーバーライドヘルパー |
    | `plugin-sdk/talk-config-runtime` | Talkプロバイダー設定解決ヘルパー |
    | `plugin-sdk/json-store` | 小規模JSON状態の読み取り/書き込みヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスク backed 重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACPランタイム/セッションと返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時に読み込まれるPlugin向けの軽量ACPバックエンド登録および返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動インポートを使わない読み取り専用ACPバインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 狭いエージェントランタイム設定スキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩いブール値パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険名一致解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスブートストラップとペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャネル、ステータス、アンビエントプロキシヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models`コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skillコマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリ/ビルド/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的な信頼済みPluginサーフェス: ハーネス型、Active Run操作/中止ヘルパー、OpenClawツールブリッジヘルパー、ランタイムプランツールポリシーヘルパー、ターミナル結果分類、ツール進捗フォーマット/詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | Z.AIエンドポイント検出ヘルパー |
    | `plugin-sdk/async-lock-runtime` | 小さなランタイム状態ファイル向けのプロセスローカル非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 境界付き非同期タスク並行処理ヘルパー |
    | `plugin-sdk/dedupe-runtime` | インメモリ重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | 送信保留中デリバリーのドレインヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルおよびメディアソースパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeatイベントと可視性ヘルパー |
    | `plugin-sdk/number-runtime` | 数値強制変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | セキュアなトークン/UUIDヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備待機ヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換性シム。上記の焦点を絞ったランタイムサブパスを使用してください |
    | `plugin-sdk/collection-runtime` | 小規模な境界付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされたfetch、プロキシ、EnvHttpProxyAgentオプション、固定lookupヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ/guarded-fetchインポートを使わない、ディスパッチャー対応ランタイムfetch |
    | `plugin-sdk/response-limit-runtime` | 広範なメディアランタイムサーフェスを使わない、境界付きレスポンス本文リーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングやペアリングストアを使わない、現在の会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広範な設定書き込み/メンテナンスインポートを使わないセッションストアヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広範な設定/セキュリティインポートを使わないコンテキスト可視性解決と補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/ロギングインポートを使わない、狭いプリミティブレコード/文字列強制変換および正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名とSCPホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | リトライ設定とリトライランナーヘルパー |
    | `plugin-sdk/agent-runtime` | エージェントディレクトリ/ID/ワークスペースヘルパー |
    | `plugin-sdk/directory-runtime` | 設定ベースのディレクトリクエリ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有メディア取得/変換/保存ヘルパー、ffprobe に基づく動画寸法プローブ、メディアペイロードビルダー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` などの限定的なメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、モデル欠落メッセージ |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型と、プロバイダー向けの画像/音声ヘルパーエクスポート |
    | `plugin-sdk/text-runtime` | assistant-visible-text の除去、markdown レンダリング/チャンク化/テーブルヘルパー、リダクションヘルパー、ディレクティブタグヘルパー、安全なテキストユーティリティなどの共有テキスト/markdown/ロギングヘルパー |
    | `plugin-sdk/text-chunking` | 送信テキストチャンク化ヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型と、プロバイダー向けのディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーのエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、音声ヘルパーのエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型とレジストリヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型と、画像アセット/データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、レジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、model-ref 解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリとルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | Webhook パス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有リモート/local メディア読み込みヘルパー |
    | `plugin-sdk/zod` | plugin SDK 利用者向けに再エクスポートされた `zod` |
    | `plugin-sdk/testing` | レガシー plugin テスト向けの広範な互換性バレル。新しい extension テストでは、代わりに `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` などの焦点を絞った SDK サブパスをインポートする必要があります |
    | `plugin-sdk/plugin-test-api` | リポジトリのテストヘルパーブリッジをインポートせずに直接 plugin 登録ユニットテストを行うための最小限の `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト射影のテスト向けのネイティブエージェントランタイムアダプターコントラクトフィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション/セットアップ/ステータスコントラクト、ディレクトリアサーション、アカウント起動ライフサイクル、send-config スレッド処理、ランタイムモック、ステータス問題、送信配信、フック登録向けのチャネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャネルテスト向けの共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/plugin-test-contracts` | Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、インポート副作用のコントラクトヘルパー |
    | `plugin-sdk/provider-test-contracts` | プロバイダーランタイム、認証、検出、オンボーディング、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、web 検索/取得、ストリームのコントラクトヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けのオプトイン Vitest HTTP/認証モック |
    | `plugin-sdk/test-fixtures` | 汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、skill ライター、エージェントメッセージ、システムイベント、モジュール再読み込み、バンドル plugin パス、ターミナルテキスト、チャンク化、認証トークン、typed-case フィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest の `vi.mock("node:*")` ファクトリ内で使用する、焦点を絞った Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="メモリサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | マネージャー/設定/ファイル/CLI ヘルパー向けのバンドル memory-core ヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みコントラクト、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー |
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
    | `plugin-sdk/memory-host-core` | メモリホストコアランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | メモリホストファイル/ランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 plugin 向けの共有 managed-markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | search-manager アクセス向けの Active memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | メモリホストステータスヘルパーのベンダー中立エイリアス |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーサブパス">
    現在、予約済みバンドルヘルパー SDK サブパスはありません。所有者固有の
    ヘルパーは所有元の plugin パッケージ内に存在し、再利用可能なホストコントラクトは
    `plugin-sdk/gateway-runtime`、
    `plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK サブパスを使用します。
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [plugins の構築](/ja-JP/plugins/building-plugins)
