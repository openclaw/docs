---
read_when:
    - Plugin のインポートに適した plugin-sdk サブパスの選択
    - バンドル済みPluginのサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDK サブパスカタログ: どのインポートがどこにあるかを領域別に整理'
title: Plugin SDK のサブパス
x-i18n:
    generated_at: "2026-05-06T05:14:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDKは、`openclaw/plugin-sdk/` 配下の狭いサブパス群として公開されています。
このページでは、目的別にグループ化した一般的に使われるサブパスを一覧にしています。生成された
200件以上のサブパスの完全なリストは `scripts/lib/plugin-sdk-entrypoints.json` にあります。
予約済みのバンドルPluginヘルパーのサブパスもそこに表示されますが、ドキュメントページで明示的に昇格されていない限り、実装の
詳細です。メンテナーは `pnpm plugins:boundary-report:summary` でアクティブな
予約済みヘルパーサブパスを監査できます。未使用の予約済みヘルパーエクスポートは、休眠状態の互換性負債として公開SDKに残るのではなく、
CIレポートで失敗します。

Plugin作成ガイドについては、[Plugin SDKの概要](/ja-JP/plugins/sdk-overview)を参照してください。

## Pluginエントリ

| サブパス                                  | 主なエクスポート                                                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | レガシーPluginテスト向けの広範な互換性バレル。新しい拡張テストでは、焦点を絞ったテスト用サブパスを優先してください                                                           |
| `plugin-sdk/plugin-test-api`              | 直接的なPlugin登録ユニットテスト向けの最小限の `OpenClawPluginApi` モックビルダー                                                                                            |
| `plugin-sdk/agent-runtime-test-contracts` | 認証プロファイル、配信抑制、フォールバック分類、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト修復向けのネイティブエージェントランタイムアダプター契約フィクスチャ |
| `plugin-sdk/channel-test-helpers`         | チャネルアカウントライフサイクル、ディレクトリ、送信設定、ランタイムモック、フック、バンドルチャネルエントリ、エンベロープタイムスタンプ、ペアリング返信、汎用チャネル契約テストヘルパー |
| `plugin-sdk/channel-target-testing`       | 共有チャネルターゲット解決エラーケーステストスイート                                                                                                                        |
| `plugin-sdk/plugin-test-contracts`        | Plugin登録、パッケージマニフェスト、公開アーティファクト、ランタイムAPI、インポート副作用、直接インポート契約ヘルパー                                                       |
| `plugin-sdk/plugin-test-runtime`          | テスト向けのPluginランタイム、レジストリ、プロバイダー登録、セットアップウィザード、ランタイムTaskFlowフィクスチャ                                                          |
| `plugin-sdk/provider-test-contracts`      | プロバイダーランタイム、認証、検出、オンボード、カタログ、メディア機能、リプレイポリシー、リアルタイムSTTライブ音声、Web検索/取得、ウィザード契約ヘルパー                   |
| `plugin-sdk/provider-http-test-mocks`     | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けのオプトインVitest HTTP/認証モック                                                                                 |
| `plugin-sdk/test-env`                     | テスト環境、fetch/ネットワーク、使い捨てHTTPサーバー、受信リクエスト、ライブテスト、一時ファイルシステム、時間制御フィクスチャ                                             |
| `plugin-sdk/test-fixtures`                | 汎用CLI、サンドボックス、skill、エージェントメッセージ、システムイベント、モジュールリロード、バンドルPluginパス、ターミナル、チャンク化、認証トークン、型付きケーステストフィクスチャ |
| `plugin-sdk/test-node-mocks`              | Vitest `vi.mock("node:*")` ファクトリ内で使うための、焦点を絞ったNode組み込みモックヘルパー                                                                                  |
| `plugin-sdk/migration`                    | `createMigrationItem` などの移行プロバイダー項目ヘルパー、理由定数、項目ステータスマーカー、編集ヘルパー、`summarizeMigrationItems`                                        |
| `plugin-sdk/migration-runtime`            | `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`、`writeMigrationReport` などのランタイム移行ヘルパー                                                             |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマエクスポート（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、許可リストプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 複数アカウント設定/アクションゲートヘルパー、デフォルトアカウントフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, アカウントID正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 限定的なアカウント一覧/アカウントアクションヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | レガシー返信パイプラインヘルパー。新しいチャネル返信パイプラインコードでは、`plugin-sdk/channel-message` の `createChannelMessageReplyPipeline` と `resolveChannelMessageSourceReplyDeliveryMode` を使用する必要があります。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有チャネル設定スキーマプリミティブ、および Zod と直接 JSON/TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | メンテナンスされている同梱Plugin専用の、同梱 OpenClaw チャネル設定スキーマ |
    | `plugin-sdk/channel-config-schema-legacy` | 同梱チャネル設定スキーマ用の非推奨互換エイリアス |
    | `plugin-sdk/telegram-command-config` | 同梱コントラクトフォールバック付きの Telegram カスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 限定的なコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, およびレガシー下書きストリームライフサイクルヘルパー。新しいプレビュー確定コードでは `plugin-sdk/channel-message` を使用する必要があります。 |
    | `plugin-sdk/channel-message` | `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode` などの軽量メッセージライフサイクルコントラクトヘルパー、互換ファサード、永続最終版機能の導出、送信/受領/副作用機能の機能証明ヘルパー、`MessageReceiveContext`、受信確認ポリシー証明、`defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`、ライブプレビューおよびライブファイナライザー機能証明、永続リカバリー状態、`RenderedMessageBatch`、メッセージ受領型、受領IDヘルパー。[チャネルメッセージ API](/ja-JP/plugins/sdk-channel-message) を参照してください。レガシー `createChannelTurnReplyPipeline` は互換ディスパッチャー専用としてのみ残っています。 |
    | `plugin-sdk/channel-message-runtime` | `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase`, `recordChannelMessageReplyDispatch` など、アウトバウンド配信を読み込む可能性があるランタイム配信ヘルパー。ホットなPluginブートストラップファイルではなく、監視/送信ランタイムモジュールから使用してください。 |
    | `plugin-sdk/inbound-envelope` | 共有インバウンドルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | レガシー共有インバウンド記録・ディスパッチヘルパー、表示/最終ディスパッチ述語、および準備済みチャネルディスパッチャー向けの非推奨 `deliverDurableInboundReplyPayload` 互換性。新しいチャネル受信/ディスパッチコードでは、`plugin-sdk/channel-message-runtime` からランタイムライフサイクルヘルパーをインポートする必要があります。 |
    | `plugin-sdk/messaging-targets` | ターゲット解析/マッチングヘルパー |
    | `plugin-sdk/outbound-media` | 共有アウトバウンドメディア読み込みヘルパー |
    | `plugin-sdk/outbound-send-deps` | チャネルアダプター向けの軽量アウトバウンド送信依存関係検索 |
    | `plugin-sdk/outbound-runtime` | アウトバウンド配信、ID、送信デリゲート、セッション、フォーマット、ペイロード計画ヘルパー |
    | `plugin-sdk/poll-runtime` | 限定的な投票正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングライフサイクルおよびアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャネルステータススナップショット/概要ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 限定的なチャネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャネルPluginプレリュードエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有ダイレクトDM認証/ガードヘルパー |
    | `plugin-sdk/discord` | 公開済み `@openclaw/discord@2026.3.13` と追跡対象オーナー互換性のための非推奨 Discord 互換ファサード。新しいPluginでは汎用チャネル SDK サブパスを使用する必要があります |
    | `plugin-sdk/telegram-account` | 追跡対象オーナー互換性のための非推奨 Telegram アカウント解決互換ファサード。新しいPluginでは、注入されたランタイムヘルパーまたは汎用チャネル SDK サブパスを使用する必要があります |
    | `plugin-sdk/zalouser` | 送信者コマンド認可をまだインポートしている公開済み Lark/Zalo パッケージ向けの、非推奨 Zalo Personal 互換ファサード。新しいPluginでは `plugin-sdk/command-auth` を使用する必要があります |
    | `plugin-sdk/interactive-runtime` | セマンティックメッセージ表示、配信、レガシー対話型返信ヘルパー。[メッセージ表示](/ja-JP/plugins/message-presentation) を参照してください |
    | `plugin-sdk/channel-inbound` | インバウンドデバウンス、メンションマッチング、メンションポリシーヘルパー、エンベロープヘルパーの互換バレル |
    | `plugin-sdk/channel-inbound-debounce` | 限定的なインバウンドデバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広範なインバウンドランタイムサーフェスを含まない、限定的なメンションポリシー、メンションマーカー、メンションテキストヘルパー |
    | `plugin-sdk/channel-envelope` | 限定的なインバウンドエンベロープフォーマットヘルパー |
    | `plugin-sdk/channel-location` | チャネル位置コンテキストおよびフォーマットヘルパー |
    | `plugin-sdk/channel-logging` | インバウンドドロップおよび入力中/確認失敗向けのチャネルロギングヘルパー |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャネルメッセージアクションヘルパー、およびPlugin互換性のために残された非推奨ネイティブスキーマヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動ターゲット解決、スレッドID文字列化、重複排除/コンパクトルートキー、解析済みターゲット型、ルート/ターゲット比較ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析ヘルパー。ルート比較の呼び出し元は `plugin-sdk/channel-route` を使用する必要があります |
    | `plugin-sdk/channel-contract` | チャネルコントラクト型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` などの限定的なシークレットコントラクトヘルパー、およびシークレットターゲット型 |
  </Accordion>

  <Accordion title="プロバイダーのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムモデル準備のための、サポート対象の LM Studio プロバイダーファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーのデフォルト、モデル検出、リクエストヘッダー、読み込み済みモデルヘルパーのための、サポート対象の LM Studio ランタイムファサード |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホストプロバイダーセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホストプロバイダーに特化したセットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト + ウォッチドッグ定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダー Plugin 向けのランタイム API キー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キーオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 認証結果ビルダー |
    | `plugin-sdk/provider-auth-login` | プロバイダー Plugin 向けの共有対話型ログインヘルパー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証環境変数検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、非推奨の `resolveOpenClawAgentDir` 互換エクスポート |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、`normalizeNativeXaiModelId` などのモデル ID 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-runtime` | 契約テスト向けのプロバイダーカタログ拡張ランタイムフックと Plugin プロバイダーレジストリの継ぎ目 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダー HTTP/エンドポイント機能ヘルパー、プロバイダー HTTP エラー、音声文字起こし用 multipart form ヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの限定的な Web フェッチ設定/選択契約ヘルパー |
    | `plugin-sdk/provider-web-fetch` | Web フェッチプロバイダーの登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 有効化配線を必要としないプロバイダー向けの限定的な Web 検索設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報 setter/getter などの限定的な Web 検索設定/認証情報契約ヘルパー |
    | `plugin-sdk/provider-web-search` | Web 検索プロバイダーの登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini スキーマのクリーンアップ + 診断、`resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI 互換ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | ガード付き fetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルのシングルトン/map/cache ヘルパー |
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
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットチャネルエントリーポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より限定的なアダプター/Gateway の継ぎ目を優先 |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + アカウントバインディングヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | exec/Plugin 承認ペイロードヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、`formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 限定的な受信返信重複排除リセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広範な testing バレルを使わない、限定的なチャネル契約テストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニュー整形、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットチャネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文の正規化とコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | チャネル/Plugin シークレットサーフェス向けの限定的なシークレット契約収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレット契約/設定解析向けの限定的な `coerceSecretRef` と SecretRef 型付けヘルパー |
    | `plugin-sdk/security-runtime` | 信頼、DM ゲート、作成専用書き込み、同期/非同期アトミックファイル置換、兄弟一時書き込み、クロスデバイス移動フォールバック、プライベートファイルストアヘルパー、シンボリックリンク親ガード、外部コンテンツ、機密テキストの墨消し、定数時間シークレット比較、シークレット収集ヘルパーを含む、共有のルート境界付きファイル/パスヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストとプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範なインフラランタイムサーフェスを使わない、限定的な pinned dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned dispatcher、SSRF ガード付き fetch、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパーと raw websocket/body 強制変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム、ロギング、バックアップ、Pluginインストールのヘルパー |
    | `plugin-sdk/runtime-env` | 狭い範囲のランタイム環境、ロガー、タイムアウト、再試行、バックオフのヘルパー |
    | `plugin-sdk/browser-config` | 正規化されたプロファイル/デフォルト、CDP URL解析、ブラウザー制御認証ヘルパー向けにサポートされるブラウザー設定ファサード |
    | `plugin-sdk/channel-runtime-context` | 汎用チャンネルランタイムコンテキストの登録および検索ヘルパー |
    | `plugin-sdk/matrix` | 古いサードパーティチャンネルパッケージ向けの非推奨Matrix互換ファサード。新しいPluginは`plugin-sdk/run-command`を直接インポートする必要があります |
    | `plugin-sdk/mattermost` | 古いサードパーティチャンネルパッケージ向けの非推奨Mattermost互換ファサード。新しいPluginは汎用SDKサブパスを直接インポートする必要があります |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有Pluginコマンド、フック、http、インタラクティブヘルパー |
    | `plugin-sdk/hook-runtime` | 共有Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface`などの遅延ランタイムインポート/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLIフォーマット、待機、バージョン、引数呼び出し、遅延コマンドグループヘルパー |
    | `plugin-sdk/gateway-runtime` | Gatewayクライアント、イベントループ準備済みクライアント開始ヘルパー、Gateway CLI RPC、Gatewayプロトコルエラー、チャンネルステータスパッチヘルパー |
    | `plugin-sdk/config-types` | `OpenClawConfig`やチャンネル/プロバイダー設定型など、Plugin設定形状向けの型専用設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject`などのランタイムPlugin設定検索ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated`などのトランザクション設定変更ヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テスト用スナップショットセッターなどの現在プロセス設定スナップショットヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドルされたTelegram契約サーフェスが利用できない場合でも使える、Telegramコマンド名/説明の正規化と重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広範なtext-runtimeバレルなしのファイル参照自動リンク検出 |
    | `plugin-sdk/approval-runtime` | exec/Plugin承認ヘルパー、承認機能ビルダー、認証/プロファイルヘルパー、ネイティブルーティング/ランタイムヘルパー、構造化承認表示パスのフォーマット |
    | `plugin-sdk/reply-runtime` | 共有インバウンド/返信ランタイムヘルパー、チャンク化、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い範囲の返信ディスパッチ/完了および会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled`などの共有短期返信履歴ヘルパーとマーカー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭い範囲のテキスト/Markdownチャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアパス、セッションキー、更新日時、ストア変更ヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cronストアのパス/読み込み/保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuthディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャンネル/アカウントステータス概要ヘルパー、ランタイム状態デフォルト、問題メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | スラッグ/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request風入力から文字列URLを抽出 |
    | `plugin-sdk/run-command` | 正規化されたstdout/stderr結果を持つ時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLIパラメーターリーダー |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化されたペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正準送信先フィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパーとプライベートな安全一時ワークスペース |
    | `plugin-sdk/logging-core` | サブシステムロガーと秘匿化ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdownテーブルモードおよび変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry`、`resolveAgentMaxConcurrent`などのモデル/セッション上書きヘルパー |
    | `plugin-sdk/talk-config-runtime` | Talkプロバイダー設定解決ヘルパー |
    | `plugin-sdk/json-store` | 小規模JSON状態読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスク裏付けの重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACPランタイム/セッションおよび返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時読み込みPlugin向けの軽量ACPバックエンド登録および返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動インポートなしの読み取り専用ACPバインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 狭い範囲のエージェントランタイム設定スキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩いbooleanパラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険な名前のマッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスブートストラップおよびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャンネル、ステータス、アンビエントプロキシのヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models`コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skillコマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリ/ビルド/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的な信頼済みPluginサーフェス: ハーネス型、アクティブ実行の誘導/中止ヘルパー、OpenClawツールブリッジヘルパー、ランタイムプランツールポリシーヘルパー、ターミナル結果分類、ツール進捗フォーマット/詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | Z.AIエンドポイント検出ヘルパー |
    | `plugin-sdk/async-lock-runtime` | 小規模ランタイム状態ファイル向けのプロセスローカル非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャンネルアクティビティテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 制限付き非同期タスク並行処理ヘルパー |
    | `plugin-sdk/dedupe-runtime` | メモリ内重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | 送信保留配信ドレインヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルおよびメディアソースパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeatイベントおよび可視性ヘルパー |
    | `plugin-sdk/number-runtime` | 数値強制変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | 安全なトークン/UUIDヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了待機ヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換shim。上記の焦点を絞ったランタイムサブパスを使用してください |
    | `plugin-sdk/collection-runtime` | 小規模な制限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされたfetch、プロキシ、EnvHttpProxyAgentオプション、固定lookupヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ/保護付きfetchインポートなしのディスパッチャー対応ランタイムfetch |
    | `plugin-sdk/response-limit-runtime` | 広範なメディアランタイムサーフェスなしの制限付きレスポンス本文リーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングやペアリングストアなしの現在の会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広範な設定書き込み/メンテナンスインポートなしのセッションストアヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広範な設定/セキュリティインポートなしのコンテキスト可視性解決および補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/ロギングインポートなしの狭い範囲のプリミティブレコード/文字列強制変換および正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名およびSCPホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | 再試行設定および再試行ランナーヘルパー |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`、`resolveDefaultAgentDir`、非推奨の`resolveOpenClawAgentDir`互換エクスポートを含む、エージェントディレクトリ/ID/ワークスペースヘルパー |
    | `plugin-sdk/directory-runtime` | 設定に基づくディレクトリクエリ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有メディア取得/変換/保存ヘルパー、ffprobe による動画サイズの検出、メディアペイロードビルダー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` などの限定的なメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、欠落モデルのメッセージング |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型と、プロバイダー向けの画像/音声ヘルパーエクスポート |
    | `plugin-sdk/text-runtime` | アシスタント可視テキストの除去、markdown レンダリング/チャンク化/テーブルヘルパー、リダクションヘルパー、ディレクティブタグヘルパー、安全なテキストユーティリティなどの共有テキスト/markdown/ロギングヘルパー |
    | `plugin-sdk/text-chunking` | 送信テキストチャンク化ヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型と、プロバイダー向けのディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーのエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、音声ヘルパーのエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型とレジストリヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型、画像アセット/data URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、レジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリとルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | Webhook パス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有リモート/local メディア読み込みヘルパー |
    | `plugin-sdk/zod` | Plugin SDK 利用者向けに再エクスポートされた `zod` |
    | `plugin-sdk/testing` | レガシー Plugin テスト向けの広範な互換 barrel。新しい extension テストでは、代わりに `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` などの焦点を絞った SDK サブパスをインポートする必要があります |
    | `plugin-sdk/plugin-test-api` | リポジトリのテストヘルパーブリッジをインポートせずに直接 Plugin 登録ユニットテストを行うための最小限の `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト投影のテスト向けネイティブ agent-runtime アダプター契約フィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション/セットアップ/ステータス契約、ディレクトリアサーション、アカウント起動ライフサイクル、send-config スレッド化、ランタイムモック、ステータス問題、送信配信、フック登録向けのチャネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャネルテスト向けの共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/plugin-test-contracts` | Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、インポート副作用契約ヘルパー |
    | `plugin-sdk/provider-test-contracts` | プロバイダーランタイム、認証、検出、オンボーディング、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索/取得、ストリーム契約ヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けのオプトイン Vitest HTTP/認証モック |
    | `plugin-sdk/test-fixtures` | 汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、skill ライター、agent-message、system-event、モジュール再読み込み、バンドル Plugin パス、terminal-text、チャンク化、auth-token、typed-case フィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest の `vi.mock("node:*")` ファクトリ内で使用する、焦点を絞った Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="Memory サブパス">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI ヘルパー向けにバンドルされた memory-core ヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンのエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込み契約、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンのエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンのエクスポート |
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
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 Plugin 向けの共有 managed-markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | search-manager アクセス用の Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | メモリホストステータスヘルパーのベンダー中立エイリアス |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーサブパス">
    現在、予約済みのバンドルヘルパー SDK サブパスはありません。所有者固有の
    ヘルパーは所有元の Plugin パッケージ内に置かれ、再利用可能なホスト契約は
    `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、
    `plugin-sdk/plugin-config-runtime` などの汎用 SDK サブパスを使用します。
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
