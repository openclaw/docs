---
read_when:
    - Plugin のインポートに適切な plugin-sdk サブパスを選択する
    - バンドル済みPluginのサブパスとヘルパー公開面の監査
summary: 'Plugin SDK サブパスカタログ: どの import がどこにあるかを領域別に整理'
title: Plugin SDK のサブパス
x-i18n:
    generated_at: "2026-05-10T19:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK は、`openclaw/plugin-sdk/` 配下の限定的な公開サブパス群として公開されます。このページでは、よく使われるサブパスを目的別に分類して一覧化しています。生成されたコンパイラーエントリーポイントのインベントリは `scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト用/内部用サブパスを差し引いた後の公開サブセットです。メンテナーは、`pnpm plugin-sdk:surface` で公開エクスポート数を、`pnpm plugins:boundary-report:summary` でアクティブな予約済みヘルパーサブパスを監査できます。未使用の予約済みヘルパーエクスポートは、休眠状態の互換性負債として公開 SDK に残るのではなく、CI レポートで失敗します。

Plugin 作成ガイドについては、[Plugin SDK の概要](/ja-JP/plugins/sdk-overview) を参照してください。

## Plugin エントリー

| サブパス                        | 主なエクスポート                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` などのマイグレーションプロバイダー項目ヘルパー、理由定数、項目ステータスマーカー、リダクションヘルパー、`summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`、`writeMigrationReport` などのランタイムマイグレーションヘルパー                                              |

### 非推奨の互換性ヘルパーとテストヘルパー

これらのサブパスは、古い Plugin と OpenClaw テストスイート向けにパッケージエクスポートとして残っていますが、新しいコードではこれらからのインポートを追加しないでください: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`, `testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`, `text-runtime`, `zod`。新しい Plugin コードでは、`zod` を `zod` から直接インポートしてください。`plugin-test-runtime` は、現在もアクティブな特化型テストヘルパーサブパスです。

### 非推奨の未使用公開サブパス

これらの公開サブパスは少なくとも 1 か月存在しており、現在はバンドル済み拡張の本番インポートがありません。互換性のために引き続きインポート可能ですが、新しい Plugin コードでは、特化され、現在も使われている SDK サブパスを代わりに使用してください: `agent-config-primitives`, `channel-config-schema-legacy`, `channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`, `command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`, `group-access`, `infra-runtime`, `matrix`, `mattermost`, `media-generation-runtime-shared`, `memory-core-engine-runtime`, `memory-core-host-multimodal`, `memory-core-host-query`, `music-generation-core`, `self-hosted-provider-setup`, `telegram-account`, `telegram-command-config`, `zalouser`。

### 非推奨の低頻度公開サブパス

現在、1 つまたは 2 つのバンドル済み Plugin 所有者のみが使用している公開サブパスも、新しい Plugin コードでは非推奨です。互換性のためにパッケージエクスポートとして残っていますが、新しいコードでは、アクティブに共有されている SDK シームまたは Plugin 所有のパッケージ API を優先してください。メンテナーは、正確なセットを `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で、現在の予算を `pnpm plugin-sdk:surface` で追跡します。

### 非推奨の広範なバレル

これらの広範な再エクスポートバレルは、OpenClaw ソースと互換性チェック向けに引き続きビルド可能ですが、新しいコードでは特化型 SDK サブパスを優先してください: `agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`, `compat`, `config-types`, `conversation-runtime`, `hook-runtime`, `infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime`, `text-runtime`。`channel-runtime`, `compat`, `config-types`, `infra-runtime`, `text-runtime` は後方互換性のためにのみパッケージエクスポートとして残っています。代わりに、特化型の channel/runtime サブパス、`config-contracts`, `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, `logging-core` を使用してください。

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマエクスポート（`OpenClawSchema`） |
    | `plugin-sdk/json-schema-runtime` | Plugin 所有スキーマ向けのキャッシュ済み JSON Schema 検証ヘルパー |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、許可リストプロンプト、セットアップ状態ビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 非推奨の互換性エイリアス。`plugin-sdk/setup-runtime` を使用してください |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 限定的なアカウントリスト/アカウントアクションヘルパー |
    | `plugin-sdk/access-groups` | アクセスグループ許可リスト解析と秘匿化済みグループ診断ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | レガシー返信パイプラインヘルパー。新しいチャンネル返信パイプラインコードでは、`plugin-sdk/channel-message` の `createChannelMessageReplyPipeline` と `resolveChannelMessageSourceReplyDeliveryMode` を使用してください。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有チャンネル設定スキーマプリミティブに加え、Zod と直接 JSON/TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | メンテナンス対象のバンドル済み Plugin 専用の、バンドル済み OpenClaw チャンネル設定スキーマ |
    | `plugin-sdk/channel-config-schema-legacy` | バンドル済みチャンネル設定スキーマ向けの非推奨互換性エイリアス |
    | `plugin-sdk/telegram-command-config` | バンドル済み契約フォールバック付きの Telegram カスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 限定的なコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 非推奨の低レベルチャンネル受信互換性ファサード。新しい受信パスでは `plugin-sdk/channel-ingress-runtime` を使用してください。 |
    | `plugin-sdk/channel-ingress-runtime` | 移行済みチャンネル受信パス向けの、実験的な高レベルチャンネル受信ランタイムリゾルバーとルートファクトビルダー。各 Plugin で有効な許可リスト、コマンド許可リスト、レガシープロジェクションを組み立てるよりも、こちらを優先してください。[チャンネル受信 API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。 |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`、およびレガシードラフトストリームライフサイクルヘルパー。新しいプレビュー確定コードでは `plugin-sdk/channel-message` を使用してください。 |
    | `plugin-sdk/channel-message` | `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`、durable-final ケイパビリティ導出、送信/受領/副作用ケイパビリティ向けのケイパビリティ証明ヘルパー、`MessageReceiveContext`、受信 ack ポリシー証明、`defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`、ライブプレビューおよびライブファイナライザーのケイパビリティ証明、永続リカバリー状態、`RenderedMessageBatch`、メッセージ受領型、受領 ID ヘルパーなどの、軽量なメッセージライフサイクル契約ヘルパー。[チャンネルメッセージ API](/ja-JP/plugins/sdk-channel-message) を参照してください。レガシー返信ディスパッチファサードは互換性専用として非推奨です。 |
    | `plugin-sdk/channel-message-runtime` | `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext` など、アウトバウンド配信を読み込む場合があるランタイム配信ヘルパー。非推奨の返信ディスパッチブリッジは、互換性ディスパッチャー専用として引き続きインポート可能です。ホットな Plugin ブートストラップファイルではなく、監視/送信ランタイムモジュールから使用してください。 |
    | `plugin-sdk/inbound-envelope` | 共有受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | レガシーの共有受信レコード/ディスパッチヘルパー、可視/最終ディスパッチ述語、および準備済みチャンネルディスパッチャー向けの非推奨 `deliverDurableInboundReplyPayload` 互換性。新しいチャンネル受信/ディスパッチコードでは、`plugin-sdk/channel-message-runtime` からランタイムライフサイクルヘルパーをインポートしてください。 |
    | `plugin-sdk/messaging-targets` | ターゲット解析/マッチングヘルパー |
    | `plugin-sdk/outbound-media` | 共有アウトバウンドメディア読み込みヘルパー |
    | `plugin-sdk/outbound-send-deps` | チャンネルアダプター向けの軽量アウトバウンド送信依存関係検索 |
    | `plugin-sdk/outbound-runtime` | アウトバウンド ID、送信デリゲート、セッション、フォーマット、ペイロード計画ヘルパー。`deliverOutboundPayloads` などの直接配信ヘルパーは非推奨の互換性基盤です。新しい送信パスでは `plugin-sdk/channel-message-runtime` を使用してください。 |
    | `plugin-sdk/poll-runtime` | 限定的なポーリング正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルとアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャンネル状態スナップショット/サマリーヘルパー |
    | `plugin-sdk/channel-config-primitives` | 限定的なチャンネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャンネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャンネル Plugin プリリュードエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有ダイレクト DM 認証/ガードヘルパー |
    | `plugin-sdk/discord` | 公開済み `@openclaw/discord@2026.3.13` と追跡対象オーナー互換性向けの非推奨 Discord 互換性ファサード。新しい Plugin では汎用チャンネル SDK サブパスを使用してください |
    | `plugin-sdk/telegram-account` | 追跡対象オーナー互換性向けの非推奨 Telegram アカウント解決互換性ファサード。新しい Plugin では注入されたランタイムヘルパーまたは汎用チャンネル SDK サブパスを使用してください |
    | `plugin-sdk/zalouser` | 送信者コマンド認可をまだインポートしている公開済み Lark/Zalo パッケージ向けの、非推奨 Zalo Personal 互換性ファサード。新しい Plugin では `plugin-sdk/command-auth` を使用してください |
    | `plugin-sdk/interactive-runtime` | セマンティックなメッセージ表示、配信、レガシーインタラクティブ返信ヘルパー。[メッセージ表示](/ja-JP/plugins/message-presentation) を参照してください |
    | `plugin-sdk/channel-inbound` | 受信デバウンス、メンションマッチング、メンションポリシーヘルパー、エンベロープヘルパー向けの互換性バレル |
    | `plugin-sdk/channel-inbound-debounce` | 限定的な受信デバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広い受信ランタイムサーフェスを含まない、限定的なメンションポリシー、メンションマーカー、メンションテキストヘルパー |
    | `plugin-sdk/channel-envelope` | 限定的な受信エンベロープフォーマットヘルパー |
    | `plugin-sdk/channel-location` | チャンネルロケーションコンテキストとフォーマットヘルパー |
    | `plugin-sdk/channel-logging` | 受信ドロップと入力中/ack 失敗向けのチャンネルログヘルパー |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャンネルメッセージアクションヘルパー、および Plugin 互換性のために保持された非推奨のネイティブスキーマヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動のターゲット解決、スレッド ID 文字列化、ルートキーの重複排除/圧縮、解析済みターゲット型、ルート/ターゲット比較ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析ヘルパー。ルート比較の呼び出し元は `plugin-sdk/channel-route` を使用してください |
    | `plugin-sdk/channel-contract` | チャンネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`、シークレットターゲット型などの限定的なシークレット契約ヘルパー |
  </Accordion>

  <Accordion title="プロバイダーのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムモデル準備向けのサポート対象 LM Studio プロバイダーファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーのデフォルト、モデル検出、リクエストヘッダー、読み込み済みモデルヘルパー向けのサポート対象 LM Studio ランタイムファサード |
    | `plugin-sdk/provider-setup` | 精選されたローカル/セルフホストプロバイダーセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換のセルフホストプロバイダーに特化したセットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト + ウォッチドッグ定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダーPlugin向けのランタイム API キー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キーオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 認証結果ビルダー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証環境変数ルックアップヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, 非推奨の `resolveOpenClawAgentDir` 互換エクスポート |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、共有モデル ID 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-runtime` | 契約テスト向けのプロバイダーカタログ拡張ランタイムフックとPluginプロバイダーレジストリシーム |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダー HTTP/エンドポイント機能ヘルパー、プロバイダー HTTP エラー、音声文字起こしマルチパートフォームヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの狭い web-fetch 設定/選択契約ヘルパー |
    | `plugin-sdk/provider-web-fetch` | Web-fetch プロバイダー登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 有効化の配線を必要としないプロバイダー向けの狭い web-search 設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, スコープ付き認証情報セッター/ゲッターなどの狭い web-search 設定/認証情報契約ヘルパー |
    | `plugin-sdk/provider-web-search` | Web-search プロバイダー登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini スキーマクリーンアップ + 診断 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | ガード付き fetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルのシングルトン/マップ/キャッシュヘルパー |
    | `plugin-sdk/group-activation` | 狭いグループ有効化モードとコマンド解析ヘルパー |
  </Accordion>

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 動的引数メニュー書式設定を含むコマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決と同一チャットのアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より狭いアダプター/Gateway シームを優先 |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + アカウントバインディングヘルパー |
    | `plugin-sdk/approval-reply-runtime` | Exec/Plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | Exec/Plugin 承認ペイロードヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、`formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 狭い受信返信重複排除リセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広範なテストバレルを使わない狭いチャネル契約テストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニュー書式設定、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットチャネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文の正規化とコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | チャネル/Pluginシークレットサーフェス向けの狭いシークレット契約収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレット契約/設定解析向けの狭い `coerceSecretRef` と SecretRef 型付けヘルパー |
    | `plugin-sdk/security-runtime` | create-only 書き込み、同期/非同期アトミックファイル置換、兄弟一時書き込み、クロスデバイス移動フォールバック、プライベートファイルストアヘルパー、シンボリックリンク親ガード、外部コンテンツ、機微テキストのリダクション、定数時間シークレット比較、シークレット収集ヘルパーを含む共有の信頼、DM ゲーティング、ルート境界付きファイル/パスヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストとプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範なインフラランタイムサーフェスを使わない狭い pinned-dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF ガード付き fetch、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパーと生 websocket/body 強制変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム、ロギング、バックアップ、Plugin インストールヘルパー |
    | `plugin-sdk/runtime-env` | 範囲を絞ったランタイム環境、ロガー、タイムアウト、リトライ、バックオフヘルパー |
    | `plugin-sdk/browser-config` | 正規化されたプロファイル/デフォルト、CDP URL 解析、ブラウザー制御認証ヘルパー向けのサポート対象ブラウザー設定ファサード |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネルのランタイムコンテキスト登録および検索ヘルパー |
    | `plugin-sdk/matrix` | 古いサードパーティチャネルパッケージ向けの非推奨 Matrix 互換ファサード。新しい plugins は `plugin-sdk/run-command` を直接インポートする必要がある |
    | `plugin-sdk/mattermost` | 古いサードパーティチャネルパッケージ向けの非推奨 Mattermost 互換ファサード。新しい plugins は汎用 SDK サブパスを直接インポートする必要がある |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有 Plugin コマンド/フック/http/インタラクティブヘルパー |
    | `plugin-sdk/hook-runtime` | 共有 Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` などの遅延ランタイムインポート/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI フォーマット、待機、バージョン、引数呼び出し、遅延コマンドグループヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアント、イベントループ準備済みクライアント開始ヘルパー、Gateway CLI RPC、Gateway プロトコルエラー、チャネルステータスパッチヘルパー |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` やチャネル/プロバイダー設定型などの Plugin 設定形状向けの、範囲を絞った型専用設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject` などのランタイム Plugin 設定検索ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated` などのトランザクション設定変更ヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テストスナップショットセッターなどの現在プロセス設定スナップショットヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドルされた Telegram 契約サーフェスが利用できない場合でも使える、Telegram コマンド名/説明の正規化と重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広範なテキストバレルを使わないファイル参照 autolink 検出 |
    | `plugin-sdk/approval-runtime` | 実行/Plugin 承認ヘルパー、承認ケイパビリティビルダー、認証/プロファイルヘルパー、ネイティブルーティング/ランタイムヘルパー、構造化承認表示パスのフォーマット |
    | `plugin-sdk/reply-runtime` | 共有受信/返信ランタイムヘルパー、チャンク化、ディスパッチ、heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 範囲を絞った返信ディスパッチ/確定および会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled` などの共有短期ウィンドウ返信履歴ヘルパーとマーカー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 範囲を絞ったテキスト/Markdown チャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアパス、セッションキー、更新日時、ストア変更ヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cron ストアのパス/読み込み/保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャネル/アカウントステータス要約ヘルパー、ランタイム状態デフォルト、課題メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | スラッグ/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout/stderr 結果を返す時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLI パラメーターリーダー |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化されたペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正規の送信先フィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパーとプライベートな安全一時ワークスペース |
    | `plugin-sdk/logging-core` | サブシステムロガーと秘匿化ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードと変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` や `resolveAgentMaxConcurrent` などのモデル/セッションオーバーライドヘルパー |
    | `plugin-sdk/talk-config-runtime` | Talk プロバイダー設定解決ヘルパー |
    | `plugin-sdk/json-store` | 小規模 JSON 状態の読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスク backed 重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP ランタイム/セッションおよび返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時に読み込まれる plugins 向けの軽量 ACP バックエンド登録および返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動インポートを伴わない読み取り専用 ACP バインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 範囲を絞ったエージェントランタイム設定スキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩い boolean パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険名マッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスブートストラップとペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャネル、ステータス、アンビエントプロキシヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skill コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドのレジストリ/ビルド/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的な信頼済み Plugin サーフェス: ハーネス型、アクティブ実行の誘導/中止ヘルパー、OpenClaw ツールブリッジヘルパー、ランタイム計画ツールポリシーヘルパー、ターミナル結果分類、ツール進捗フォーマット/詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | 非推奨の Z.AI プロバイダー所有エンドポイント検出ファサード。Z.AI Plugin 公開 API を使用する |
    | `plugin-sdk/async-lock-runtime` | 小規模ランタイム状態ファイル向けのプロセスローカル非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 上限付き非同期タスク並行実行ヘルパー |
    | `plugin-sdk/dedupe-runtime` | インメモリ重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | 送信保留配信のドレインヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルおよびメディアソースパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat のウェイク、イベント、可視性ヘルパー |
    | `plugin-sdk/number-runtime` | 数値強制変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | 安全なトークン/UUID ヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了待機ヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換シム。上記の焦点を絞ったランタイムサブパスを使用する |
    | `plugin-sdk/collection-runtime` | 小規模な上限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされた fetch、プロキシ、EnvHttpProxyAgent オプション、固定 lookup ヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ/guarded-fetch インポートを伴わない、ディスパッチャー対応ランタイム fetch |
    | `plugin-sdk/response-limit-runtime` | 広範なメディアランタイムサーフェスを使わない、上限付きレスポンス本文リーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングやペアリングストアを伴わない現在の会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広範な設定書き込み/メンテナンスインポートを伴わないセッションストアヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広範な設定/セキュリティインポートを伴わないコンテキスト可視性解決と補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/ロギングインポートを伴わない、範囲を絞ったプリミティブレコード/文字列の強制変換と正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名と SCP ホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | リトライ設定とリトライランナーヘルパー |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`、`resolveDefaultAgentDir`、非推奨の `resolveOpenClawAgentDir` 互換エクスポートを含む、エージェントディレクトリ/アイデンティティ/ワークスペースヘルパー |
    | `plugin-sdk/directory-runtime` | 設定に基づくディレクトリクエリ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有メディア取得/変換/保存ヘルパー、ffprobe ベースの動画サイズ検出、メディアペイロードビルダー |
    | `plugin-sdk/media-mime` | 狭い範囲の MIME 正規化、ファイル拡張子マッピング、MIME 検出、メディア種別ヘルパー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` などの狭い範囲のメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、欠落モデルのメッセージング |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型と、プロバイダー向けの画像/音声ヘルパーエクスポート |
    | `plugin-sdk/text-chunking` | テキストと Markdown のチャンク化/レンダリングヘルパー、Markdown テーブル変換、ディレクティブタグ削除、安全なテキストユーティリティ |
    | `plugin-sdk/text-chunking` | 送信テキストのチャンク化ヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型と、プロバイダー向けディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、音声ヘルパーエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型とレジストリヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型と、画像アセット/データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、レジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリとルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | 非推奨の互換エイリアス。`plugin-sdk/webhook-ingress` を使用してください |
    | `plugin-sdk/web-media` | 共有リモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | 非推奨の互換再エクスポート。`zod` は `zod` から直接インポートしてください |
    | `plugin-sdk/testing` | レガシー OpenClaw テスト用のリポジトリローカルな非推奨互換バレル。新しいリポジトリテストでは、代わりに `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env`、または `plugin-sdk/test-fixtures` などの対象を絞ったローカルテスト用サブパスをインポートしてください |
    | `plugin-sdk/plugin-test-api` | リポジトリのテストヘルパーブリッジをインポートせずに直接 Plugin 登録ユニットテストを行うための、リポジトリローカルな最小 `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト投影テスト用の、リポジトリローカルなネイティブエージェントランタイムアダプター契約フィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション/セットアップ/ステータス契約、ディレクトリアサーション、アカウント起動ライフサイクル、send-config スレッド化、ランタイムモック、ステータス問題、送信配信、フック登録のための、リポジトリローカルなチャンネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャンネルテスト用の、リポジトリローカルな共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/plugin-test-contracts` | リポジトリローカルな Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、インポート副作用契約ヘルパー |
    | `plugin-sdk/provider-test-contracts` | リポジトリローカルなプロバイダーランタイム、認証、検出、オンボード、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索/取得、ストリーム契約ヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けの、リポジトリローカルなオプトイン Vitest HTTP/認証モック |
    | `plugin-sdk/test-fixtures` | リポジトリローカルな汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、Skill ライター、エージェントメッセージ、システムイベント、モジュール再読み込み、同梱 Plugin パス、端末テキスト、チャンク化、認証トークン、型付きケースフィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest の `vi.mock("node:*")` ファクトリ内で使用するための、リポジトリローカルで対象を絞った Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="メモリのサブパス">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | マネージャー/設定/ファイル/CLI ヘルパー用の同梱 memory-core ヘルパー面 |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込み契約、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー |
    | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー |
    | `plugin-sdk/memory-core-host-events` | 非推奨の互換エイリアス。`plugin-sdk/memory-host-events` を使用してください |
    | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホストコアランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | 非推奨の互換エイリアス。`plugin-sdk/memory-core-host-runtime-files` を使用してください |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 Plugin 向けの共有マネージド Markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | 検索マネージャーアクセス用のアクティブメモリランタイムファサード |
    | `plugin-sdk/memory-host-status` | 非推奨の互換エイリアス。`plugin-sdk/memory-core-host-status` を使用してください |
  </Accordion>

  <Accordion title="予約済み同梱ヘルパーのサブパス">
    現在、予約済みの同梱ヘルパー SDK サブパスはありません。所有者固有の
    ヘルパーは所有元の Plugin パッケージ内に置かれ、再利用可能なホスト契約は
    `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime`
    などの汎用 SDK サブパスを使用します。
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
