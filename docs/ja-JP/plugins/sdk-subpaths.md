---
read_when:
    - Plugin のインポートに適した plugin-sdk サブパスの選択
    - バンドルされたPluginのサブパスとヘルパーサーフェスの監査
summary: Plugin SDK サブパスカタログ：各インポートの配置場所を領域別に分類
title: Plugin SDK サブパス
x-i18n:
    generated_at: "2026-07-16T12:01:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK は、`openclaw/plugin-sdk/` 配下の限定された公開サブパス群として提供されます。このページでは、よく使用されるサブパスを目的別に分類して掲載します。このサーフェスは、次の 3 つのファイルで定義されます。

- `scripts/lib/plugin-sdk-entrypoints.json`: ビルドでコンパイルされる、保守対象のエントリポイント一覧。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: リポジトリ内限定のテスト用および内部用サブパス。パッケージのエクスポートは、このリストを一覧から除いたものです。
- `src/plugin-sdk/entrypoints.ts`: 非推奨のサブパス、予約済みのバンドル版ヘルパー、サポート対象のバンドル版ファサード、および Plugin 所有の公開サーフェスの分類メタデータ。

メンテナーは、`pnpm plugin-sdk:surface` で公開エクスポート数を、`pnpm plugins:boundary-report:summary` で使用中の予約済みヘルパーサブパスを監査します。未使用の予約済みヘルパーエクスポートは、休眠状態の互換性負債として公開 SDK に残るのではなく、CI レポートを失敗させます。

Plugin 作成ガイドについては、[Plugin SDK の概要](/ja-JP/plugins/sdk-overview)を参照してください。

## Plugin エントリ

| サブパス                       | 主なエクスポート                                                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | `createMigrationItem` などの移行プロバイダー項目ヘルパー、理由定数、項目ステータスマーカー、秘匿化ヘルパー、および `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime`、`writeMigrationReport` などのランタイム移行ヘルパー                                             |
| `plugin-sdk/health`            | バンドル版ヘルス機能の利用側向けの Doctor ヘルスチェック登録、検出、修復、選択、重大度、および検出結果の型                                                                                |
| `plugin-sdk/config-schema`     | 非推奨。ルートの `openclaw.json` Zod スキーマ（`OpenClawSchema`）。代わりに Plugin ローカルのスキーマを定義し、`plugin-sdk/json-schema-runtime` で検証してください                                                  |

### 非推奨の互換性ヘルパーとテストヘルパー

古い Plugin のために非推奨のサブパスは引き続きエクスポートされますが、新しいコードでは以下の用途別 SDK サブパスを使用してください。保守対象のリストは `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` です。CI は、バンドル版の本番コードからこのリストをインポートすると失敗します。`plugin-sdk/compat`、`plugin-sdk/config-types`、`plugin-sdk/infra-runtime`、`plugin-sdk/text-runtime` などの包括的なバレルは互換性維持のみを目的としており、`plugin-sdk/zod` は互換性のための再エクスポートです。`zod` は `zod` から直接インポートしてください。包括的なドメインバレルである `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、`plugin-sdk/channel-runtime`、`plugin-sdk/cli-runtime`、`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime`、`plugin-sdk/security-runtime` も同様に、用途別サブパスを優先するため非推奨です。

OpenClaw の Vitest ベースのテストヘルパーサブパスはリポジトリ内限定となり、パッケージからはエクスポートされなくなりました：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-state-test-runtime`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`reply-payload-testing`、`sqlite-runtime-testing`、`test-env`、`test-fixtures`、`test-node-mocks`、`testing`。非公開のバンドル版ヘルパーサーフェスである `ssrf-runtime-internal` と `codex-native-task-runtime` もリポジトリ内限定です。

### 予約済みのバンドル版 Plugin ヘルパーサブパス

`plugin-sdk/codex-mcp-projection` は唯一の予約済みサブパスです。これはバンドル版 Codex Plugin 用の Plugin 所有の互換性サーフェスであり、汎用 SDK API ではありません。所有者をまたぐ Plugin のインポートはパッケージ契約のガードレールによってブロックされ、予約済みサブパスがインポートされなくなると CI が失敗します。`plugin-sdk/codex-native-task-runtime` はリポジトリ内限定であり、パッケージからはエクスポートされません。

`src/plugin-sdk/entrypoints.ts` は、汎用契約に置き換えられるまで各バンドル版 Plugin によって実装される SDK エントリポイントである、サポート対象のバンドル版ファサードも追跡します：`plugin-sdk/discord`、`plugin-sdk/lmstudio`、`plugin-sdk/lmstudio-runtime`、`plugin-sdk/matrix`、`plugin-sdk/mattermost`、`plugin-sdk/memory-core-engine-runtime`、`plugin-sdk/provider-zai-endpoint`、`plugin-sdk/qa-runner-runtime`、`plugin-sdk/telegram-account`、`plugin-sdk/tts-runtime`、`plugin-sdk/zalouser`。これらの一部は、新しいコードでの使用も非推奨です。以下の各行の注記を参照してください。

  <AccordionGroup>
  <Accordion title="チャンネルのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Plugin 所有スキーマ向けのキャッシュ済み JSON Schema 検証ヘルパー |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、セットアップトランスレーター、許可リストプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 非推奨の互換性エイリアス。`plugin-sdk/setup-runtime` を使用してください |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 複数アカウントの設定およびアクションゲート用ヘルパー、デフォルトアカウントへのフォールバック用ヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索およびデフォルトへのフォールバック用ヘルパー |
    | `plugin-sdk/account-helpers` | 限定的なアカウント一覧およびアカウントアクション用ヘルパー |
    | `plugin-sdk/access-groups` | アクセスグループ許可リストの解析および秘匿化されたグループ診断用ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有チャンネル設定スキーマプリミティブ、および Zod と直接的な JSON/TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | メンテナンス対象のバンドル済み Plugin 専用の、OpenClaw にバンドルされたチャンネル設定スキーマ |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。エンベロープ接頭辞付きテキストを独自テーブルへのハードコードなしで認識する必要がある Plugin 向けの、正規のバンドル済み／公式チャットチャンネル ID とフォーマッターラベル／エイリアス。 |
    | `plugin-sdk/channel-config-schema-legacy` | バンドル済みチャンネル設定スキーマ向けの非推奨の互換性エイリアス |
    | `plugin-sdk/telegram-command-config` | 非推奨の Telegram コマンド名／説明の正規化、および重複／競合チェック。新しい Plugin コードでは Plugin ローカルのコマンド設定処理を使用してください |
    | `plugin-sdk/command-gating` | 限定的なコマンド認可ゲート用ヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | 移行済みチャンネル受信パス向けの、実験的な高レベルチャンネル受信ランタイムリゾルバーおよびルート情報ビルダー。各 Plugin で有効な許可リスト、コマンド許可リスト、レガシープロジェクションを組み立てるよりも、こちらを優先してください。[チャンネル受信 API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。 |
    | `plugin-sdk/channel-lifecycle` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-outbound` | メッセージライフサイクル契約に加え、返信パイプラインオプション、受領確認、ライブプレビュー／ストリーミング、ライフサイクルヘルパー、送信元 ID、ペイロード計画、永続的な送信、メッセージ送信コンテキスト用ヘルパー。[チャンネル送信 API](/ja-JP/plugins/sdk-channel-outbound) を参照してください。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 向けの非推奨の互換性エイリアス。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 向けの非推奨の互換性エイリアス。 |
    | `plugin-sdk/inbound-envelope` | 共有受信ルートおよびエンベロープビルダー用ヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 非推奨の互換性ファサード。受信ランナーとディスパッチ述語には `plugin-sdk/channel-inbound` を、メッセージ配信ヘルパーには `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析エイリアス。`plugin-sdk/channel-targets` を使用してください |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みおよびホスト型メディア状態用ヘルパー |
    | `plugin-sdk/outbound-send-deps` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/outbound-runtime` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/poll-runtime` | 限定的な投票正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルおよびアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | エージェントメディアペイロードのルートおよびローダー |
    | `plugin-sdk/conversation-runtime` | 会話／スレッドのバインディング、ペアリング、設定済みバインディング用ヘルパーを含む非推奨の広範なバレル。`plugin-sdk/thread-bindings-runtime` や `plugin-sdk/session-binding-runtime` など、対象を絞ったバインディングサブパスを優先してください |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決用ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャンネルステータスのスナップショット／要約用ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 限定的なチャンネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャンネル設定書き込み認可用ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャンネル Plugin プレリュードのエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定の編集／読み取り用ヘルパー |
    | `plugin-sdk/group-access` | 非推奨のグループアクセス判定用ヘルパー。`plugin-sdk/channel-ingress-runtime` の `resolveChannelMessageIngress` を使用してください |
    | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 非推奨の互換性ファサード。`plugin-sdk/channel-inbound` を使用してください。 |
    | `plugin-sdk/direct-dm-guard-policy` | 限定的なダイレクト DM の暗号化前ガードポリシー用ヘルパー |
    | `plugin-sdk/discord` | 公開済みの `@openclaw/discord@2026.3.13` および追跡対象の所有者互換性向けの、非推奨の Discord 互換性ファサード。新しい Plugin では汎用チャンネル SDK サブパスを使用してください |
    | `plugin-sdk/telegram-account` | 追跡対象の所有者互換性向けの、非推奨の Telegram アカウント解決互換性ファサード。新しい Plugin では注入されたランタイムヘルパーまたは汎用チャンネル SDK サブパスを使用してください |
    | `plugin-sdk/zalouser` | 送信者コマンド認可を引き続きインポートする公開済み Lark/Zalo パッケージ向けの、非推奨の Zalo Personal 互換性ファサード。新しい Plugin では汎用チャンネル SDK サブパスを使用してください |
    | `plugin-sdk/interactive-runtime` | 意味論に基づくメッセージのプレゼンテーション、配信、およびレガシーな対話型返信用ヘルパー。[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください |
    | `plugin-sdk/channel-inbound` | イベント分類、コンテキスト構築、フォーマット、ルート、デバウンス、メンション照合、メンションポリシー、受信ログ向けの共有受信ヘルパー |
    | `plugin-sdk/channel-inbound-debounce` | 限定的な受信デバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | 広範な受信ランタイムサーフェスを含まない、限定的なメンションポリシー、メンションマーカー、メンションテキスト用ヘルパー |
    | `plugin-sdk/channel-envelope`、`plugin-sdk/channel-inbound-roots`、`plugin-sdk/channel-location`、`plugin-sdk/channel-logging` | 非推奨の互換性ファサード。`plugin-sdk/channel-inbound` または `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-pairing-paths` | 非推奨の互換性ファサード。`plugin-sdk/channel-pairing` を使用してください。 |
    | `plugin-sdk/channel-reply-options-runtime` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-streaming` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-send-result` | 返信結果の型 |
    | `plugin-sdk/channel-actions` | チャンネルメッセージアクション用ヘルパー、および Plugin 互換性のために維持されている非推奨のネイティブスキーマ用ヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動のターゲット解決、スレッド ID の文字列化、重複排除／圧縮ルートキー、解析済みターゲット型、ルート／ターゲット比較用ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析用ヘルパー。ルート比較の呼び出し元では `plugin-sdk/channel-route` を使用してください |
    | `plugin-sdk/channel-contract` | チャンネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック／リアクションの配線 |
  </Accordion>

非推奨のチャンネルヘルパーファミリーは、公開済み Plugin との互換性のためにのみ引き続き利用できます。削除計画は次のとおりです。外部 Plugin の移行期間中はこれらを維持し、リポジトリ内およびバンドル済みの Plugin では `channel-inbound` と `channel-outbound` を使用し続け、その後、次回のメジャー SDK クリーンアップで互換性サブパスを削除します。これは、旧チャンネルメッセージ／ランタイム、チャンネルストリーミング、ダイレクト DM アクセス、細分化された受信ヘルパー、返信オプション、ペアリングパスの各ファミリーに適用されます。

  <Accordion title="プロバイダーのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムモデル準備のためにサポートされる LM Studio プロバイダーファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーのデフォルト、モデル検出、リクエストヘッダー、ロード済みモデル用ヘルパーのためにサポートされる LM Studio ランタイムファサード |
    | `plugin-sdk/provider-setup` | 厳選されたローカル／セルフホスト型プロバイダーのセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | 非推奨の OpenAI 互換セルフホスト型セットアップヘルパー。`plugin-sdk/provider-setup` または Plugin が所有するセットアップヘルパーを使用してください |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト値とウォッチドッグ定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダー認証ランタイムヘルパー：OAuth ループバックフロー、トークン交換、認証の永続化、API キーの解決 |
    | `plugin-sdk/provider-oauth-runtime` | 汎用プロバイダー OAuth コールバック型、コールバックページのレンダリング、PKCE／state ヘルパー、認可入力の解析、トークン有効期限ヘルパー、中止ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キーのオンボーディング／プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 認証結果ビルダー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証環境変数の検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 認証インポートヘルパー、非推奨の `resolveOpenClawAgentDir` 互換エクスポート |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、共有モデル ID 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-live-runtime` | ガード付きの `/models` 形式の検出に使用するライブプロバイダーモデルカタログヘルパー：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、モデル ID フィルタリング、TTL キャッシュ、静的フォールバック |
    | `plugin-sdk/provider-catalog-runtime` | プロバイダーカタログ拡張ランタイムフックと、コントラクトテスト用の Plugin プロバイダーレジストリ境界 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダー HTTP／エンドポイント機能ヘルパー、プロバイダー HTTP エラー、音声文字起こし用マルチパートフォームヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの限定的な Web フェッチ設定／選択コントラクトヘルパー |
    | `plugin-sdk/provider-web-fetch` | Web フェッチプロバイダーの登録／キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin の有効化配線を必要としないプロバイダー向けの限定的な Web 検索設定／認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター／ゲッターなどの限定的な Web 検索設定／認証情報コントラクトヘルパー |
    | `plugin-sdk/provider-web-search` | Web 検索プロバイダーの登録／キャッシュ／ランタイムヘルパー |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)`、`listEmbeddingProviders(...)` を含む汎用埋め込みプロバイダー型および読み取りヘルパー。マニフェストの所有権を強制するため、Plugin は `api.registerEmbeddingProvider(...)` を通じてプロバイダーを登録します |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek／Gemini／OpenAI スキーマのクリーンアップと診断 |
    | `plugin-sdk/provider-usage` | プロバイダー使用量スナップショット型、共有使用量取得ヘルパー、`fetchClaudeUsage` などのプロバイダーフェッチャー |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、プレーンテキストのツール呼び出し互換機能、共有 Anthropic／Google／Kilocode／MiniMax／Moonshot／OpenAI／OpenRouter／Z.AI ラッパーヘルパー |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`、Anthropic／DeepSeek／OpenAI 互換ストリームユーティリティを含む、公開共有プロバイダーストリームラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | ガード付きフェッチ、ツール結果のテキスト抽出、転送メッセージ変換、書き込み可能な転送イベントストリームなどのネイティブプロバイダー転送ヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルのシングルトン／マップ／キャッシュヘルパー |
    | `plugin-sdk/group-activation` | 限定的なグループ有効化モードおよびコマンド解析ヘルパー |
  </Accordion>

プロバイダー使用量スナップショットは通常、1 つ以上のクォータ `windows` を報告し、それぞれに
ラベル、使用率、任意のリセット時刻が含まれます。リセット可能なクォータ期間ではなく、残高や
アカウント状態のテキストを公開するプロバイダーは、割合を捏造せず、
空の `windows` 配列を含む `summary` を返す必要があります。
OpenClaw はステータス出力にその概要テキストを表示します。`error` は、
使用量エンドポイントが失敗した場合、または利用可能な使用量データを返さなかった場合にのみ使用してください。

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | 非推奨の広範なコマンド認可サーフェス（`resolveControlCommandGate`、動的引数メニューの書式設定を含むコマンドレジストリヘルパー、送信者認可ヘルパー）。チャネル受信／ランタイム認可またはコマンド状態ヘルパーを使用してください |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド／ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者の解決および同一チャット内アクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ実行承認プロファイル／フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能／配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway リゾルバー |
    | `plugin-sdk/approval-reference-runtime` | 転送制限のある承認コールバック用の決定論的な永続ロケーターヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | 高頻度のチャネルエントリポイント向け軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。限定的なアダプター／Gateway 境界で十分な場合は、そちらを優先してください |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認のターゲット、アカウントバインディング、ルートゲート、転送フォールバック、ローカルのネイティブ実行プロンプト抑制ヘルパー |
    | `plugin-sdk/approval-reaction-runtime` | ハードコードされた承認リアクションバインディング、リアクションプロンプトペイロード、リアクションターゲットストア、リアクションヒントテキストヘルパー、ローカルのネイティブ実行プロンプト抑制用互換エクスポート |
    | `plugin-sdk/approval-reply-runtime` | 実行／Plugin 承認応答ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | 実行／Plugin 承認ペイロードヘルパー、承認機能ビルダー、承認認証／プロファイルヘルパー、ネイティブ承認ルーティング／ランタイムヘルパー、`formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 非推奨の限定的な受信応答重複排除リセットヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニューの書式設定、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | 高頻度のチャネルパス向け軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文の正規化およびコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | プライベートチャネルおよび Web UI のデバイスコードペアリング向け遅延プロバイダー認証ログインフローヘルパー |
    | `plugin-sdk/channel-secret-runtime` | 非推奨の広範なシークレットコントラクトサーフェス（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、シークレットターゲット型）。以下の対象を絞ったサブパスを優先してください |
    | `plugin-sdk/channel-secret-basic-runtime` | TTS 以外のチャネル／Plugin シークレットサーフェス向けの限定的なシークレットコントラクトエクスポートおよびターゲットレジストリビルダー |
    | `plugin-sdk/channel-secret-tts-runtime` | 限定的なネストされたチャネル TTS シークレット割り当てヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレットコントラクト／設定解析向けの限定的な SecretRef の型付け、解決、プランターゲットパス検索 |
    | `plugin-sdk/secret-provider-integration` | 外部シークレットプロバイダープリセットを公開する Plugin 向けの型のみの SecretRef プロバイダー統合マニフェストおよびプリセットコントラクト |
    | `plugin-sdk/security-runtime` | 信頼、DM ゲーティング、作成専用書き込み、同期／非同期のアトミックファイル置換、同階層への一時書き込み、デバイス間移動フォールバック、プライベートファイルストアヘルパー、シンボリックリンク親ガード、外部コンテンツ、機密テキストの秘匿化、定数時間シークレット比較、シークレット収集ヘルパーを含むルート境界内のファイル／パスヘルパーの非推奨の広範なバレル。対象を絞ったセキュリティ／SSRF／シークレットのサブパスを優先してください |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストおよびプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範なインフラランタイムサーフェスを含まない、限定的な固定ディスパッチャーヘルパー |
    | `plugin-sdk/ssrf-runtime` | 固定ディスパッチャー、SSRF ガード付きフェッチ、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト／ターゲットヘルパーおよび生の WebSocket／本文の型変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文のサイズ／タイムアウトヘルパー、および追跡対象の確認応答後処理用 `runDetachedWebhookWork` |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | ランタイム、ロギング、バックアップのヘルパー、Plugin のインストールパスに関する警告、プロセスヘルパー |
    | `plugin-sdk/runtime-env` | 限定的なランタイム環境、ロガー、タイムアウト、再試行、バックオフのヘルパー |
    | `plugin-sdk/browser-config` | 正規化されたプロファイルとデフォルト、CDP URL の解析、ブラウザー制御認証ヘルパーに対応するブラウザー設定ファサード |
    | `plugin-sdk/agent-harness-task-runtime` | ホストが発行したタスクスコープを使用する、ハーネスベースのエージェント向け汎用タスクライフサイクルおよび完了通知ヘルパー |
    | `plugin-sdk/codex-mcp-projection` | ユーザーの MCP サーバー設定を Codex スレッド設定に投影するための予約済みバンドル Codex ヘルパー。サードパーティ Plugin 向けではありません |
    | `plugin-sdk/codex-native-task-runtime` | ネイティブタスクのミラーリングとランタイム接続のためのリポジトリローカルなバンドル Codex ヘルパー。パッケージのエクスポートではありません |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネルランタイムコンテキストの登録および検索ヘルパー |
    | `plugin-sdk/matrix` | 古いサードパーティ製チャネルパッケージ向けの非推奨 Matrix 互換ファサード。新しい Plugin は `plugin-sdk/run-command` を直接インポートしてください |
    | `plugin-sdk/mattermost` | 古いサードパーティ製チャネルパッケージ向けの非推奨 Mattermost 互換ファサード。新しい Plugin は汎用 SDK サブパスを直接インポートしてください |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Plugin のコマンド、フック、HTTP、対話ヘルパー用の非推奨の包括的バレル。用途を限定した Plugin ランタイムのサブパスを推奨します |
    | `plugin-sdk/hook-runtime` | Webhook および内部フックパイプラインヘルパー用の非推奨の包括的バレル。用途を限定したフックおよび Plugin ランタイムのサブパスを推奨します |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` などの遅延ランタイムインポートおよびバインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/node-host` | Node ホストでの実行可能ファイル解決および PTY 再開ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI の書式設定、待機、バージョン、引数呼び出し、遅延コマンドグループのヘルパー用の非推奨の包括的バレル。用途を限定した CLI およびランタイムのサブパスを推奨します |
    | `plugin-sdk/qa-runner-runtime` | CLI コマンドサーフェスを通じて Plugin の QA シナリオを公開する対応済みファサード |
    | `plugin-sdk/tts-runtime` | テキスト読み上げの設定スキーマおよびランタイムヘルパー用の対応済みファサード |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言する Plugin HTTP ルート用の予約済み Gateway メソッドディスパッチヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアント、イベントループ準備完了時のクライアント起動ヘルパー、Gateway CLI RPC、Gateway プロトコルエラー、通知された LAN ホストの解決、チャネルステータスのパッチヘルパー |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` やチャネル／プロバイダー設定型など、Plugin 設定形状向けの用途を限定した型専用設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `mergeDeep`、`requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject` などのランタイム Plugin 設定ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated` などのトランザクション対応設定変更ヘルパー |
    | `plugin-sdk/message-tool-delivery-hints` | 共有メッセージツール配信メタデータのヒント文字列 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テスト用スナップショットセッターなど、現在のプロセス設定スナップショットのヘルパー |
    | `plugin-sdk/text-autolink-runtime` | 包括的なテキストバレルを使用しないファイル参照の自動リンク検出 |
    | `plugin-sdk/reply-runtime` | 共有の受信／返信ランタイムヘルパー、チャンク分割、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 用途を限定した返信のディスパッチ／完了処理および会話ラベルのヘルパー |
    | `plugin-sdk/reply-history` | 共有の短期間返信履歴ヘルパー。新しいメッセージターンのコードでは `createChannelHistoryWindow` を使用してください。低レベルのマップヘルパーは非推奨の互換エクスポートとしてのみ残されています |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 用途を限定したテキスト／Markdown チャンク分割ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションワークフローヘルパー（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、修復／ライフサイクルヘルパー（`deleteSessionEntry`、`cleanupSessionLifecycleArtifacts`、`resolveSessionStoreBackupPaths`）、移行中の `sessionFile` 値用マーカーヘルパー、セッション ID に基づく直近のユーザー／アシスタントのトランスクリプトテキストの上限付き読み取り、セッションストアパス／セッションキーヘルパー、更新日時の読み取り。包括的な設定書き込み／メンテナンスのインポートは含みません |
    | `plugin-sdk/session-transcript-runtime` | トランスクリプト ID、スコープ付きの対象／読み取り／書き込みヘルパー、表示可能なメッセージエントリの投影、更新の公開、書き込みロック、トランスクリプトメモリのヒットキー |
    | `plugin-sdk/sqlite-runtime` | データベースのライフサイクル制御を含まない、ファーストパーティランタイム向けの用途を限定した SQLite エージェントスキーマ、パス、トランザクションヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cron ストアのパス／読み込み／保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態／OAuth ディレクトリのパスヘルパー |
    | `plugin-sdk/plugin-state-runtime` | Plugin サイドカー SQLite のキー付き状態型に加え、Plugin 所有データベース向けの一元化された接続 pragma、検証済み WAL メンテナンス、アトミックな STRICT スキーマ移行ヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` などのルート／セッションキー／アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有のチャネル／アカウントステータス概要ヘルパー、ランタイム状態のデフォルト、問題メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有の対象解決ヘルパー |
    | `plugin-sdk/string-normalization-runtime` | スラッグ／文字列の正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch／request のような入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout／stderr 結果を返す時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通のツール／CLI パラメータリーダー |
    | `plugin-sdk/tool-plugin` | 単純な型付きエージェントツール Plugin を定義し、マニフェスト生成用の静的メタデータを公開 |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化されたペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正規の送信対象フィールドを抽出 |
    | `plugin-sdk/sandbox` | サンドボックスバックエンド型、およびフェイルファストな実行コマンドの事前チェックを含む SSH／OpenShell コマンドヘルパー |
    | `plugin-sdk/temp-path` | 共有の一時ダウンロードパスヘルパーおよび非公開の安全な一時ワークスペース |
    | `plugin-sdk/logging-core` | サブシステムロガーおよび秘匿化ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードおよび変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry`、`resolveAgentMaxConcurrent` などのモデル／セッション上書きヘルパー |
    | `plugin-sdk/talk-config-runtime` | Talk プロバイダー設定解決ヘルパー |
    | `plugin-sdk/json-store` | 小規模な JSON 状態の読み取り／書き込みヘルパー |
    | `plugin-sdk/json-unsafe-integers` | 安全でない整数リテラルを文字列として保持する JSON 解析ヘルパー |
    | `plugin-sdk/file-lock` | 再入可能なファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクベースの重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP ランタイム／セッションおよび返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時に読み込まれる Plugin 向けの軽量 ACP バックエンド登録および返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動のインポートを伴わない読み取り専用 ACP バインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 非推奨のエージェントランタイム設定スキーマプリミティブ。スキーマプリミティブはメンテナンスされている Plugin 所有のサーフェスからインポートしてください |
    | `plugin-sdk/boolean-param` | 柔軟なブール値パラメータリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険な名前の照合解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` を含むデバイスのブートストラップおよびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有のパッシブチャネル、ステータス、アンビエントプロキシのヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド／プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skill コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドのレジストリ／構築／シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルのエージェントハーネス向け実験的な信頼済み Plugin サーフェス：ハーネス型、アクティブ実行の誘導／中止ヘルパー、OpenClaw ツールブリッジヘルパー、ランタイム計画のツールポリシーヘルパー、ターミナル結果の分類、ツール進捗の書式設定／詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | 非推奨の Z.AI プロバイダー所有エンドポイント検出ファサード。Z.AI Plugin の公開 API を使用してください |
    | `plugin-sdk/async-lock-runtime` | 小規模なランタイム状態ファイル向けのプロセスローカル非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティのテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 上限付き非同期タスク並行処理ヘルパー |
    | `plugin-sdk/dedupe-runtime` | インメモリおよび永続バックエンド型の重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | 送信保留中の配信を排出するヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルおよびメディアソースのパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat のウェイク、イベント、可視性ヘルパー |
    | `plugin-sdk/expect-runtime` | 証明可能なランタイム不変条件向けの必須値アサーションヘルパー |
    | `plugin-sdk/number-runtime` | 数値強制変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | 安全なトークン／UUID ヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了の待機ヘルパー |
    | `plugin-sdk/exec-approvals-runtime` | 包括的なインフラランタイムバレルを使用しない実行承認ポリシーファイルのヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換シム。上記の用途を限定したランタイムサブパスを使用してください |
    | `plugin-sdk/collection-runtime` | 小規模な上限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストのヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、書式設定、共有エラー分類ヘルパー、`PlatformMessageNotDispatchedError`、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされた fetch、プロキシ、EnvHttpProxyAgent オプション、固定されたルックアップのヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ／保護付き fetch をインポートしない、ディスパッチャー対応のランタイム fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 包括的なメディアランタイムサーフェスを使用しない、インライン画像データ URL のサニタイザーおよびシグネチャ検出ヘルパー |
    | `plugin-sdk/response-limit-runtime` | 包括的なメディアランタイムサーフェスを使用しない、バイト数、アイドル時間、期限に上限を設けたレスポンス本文リーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングのルーティングやペアリングストアを伴わない、現在の会話バインディング状態 |
    | `plugin-sdk/context-visibility-runtime` | 包括的な設定／セキュリティのインポートを伴わない、コンテキスト可視性の解決および補足コンテキストのフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown／ロギングのインポートを伴わない、用途を限定したプリミティブなレコード／文字列の強制変換および正規化ヘルパー |
    | `plugin-sdk/html-entity-runtime` | 包括的なテキストユーティリティを使用しない、単一パスでのセミコロン終端 HTML5 エンティティデコード |
    | `plugin-sdk/text-utility-runtime` | 5 種類のエンティティによる HTML エスケープを含む、低レベルのテキストおよびパスヘルパー |
    | `plugin-sdk/widget-html` | 自己完結型 HTML ウィジェット向けの完全なドキュメント検出、サイズ検証、ツール入力エラー |
    | `plugin-sdk/host-runtime` | ホスト名および SCP ホストの正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | 再試行設定および再試行ランナーヘルパー |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`、`resolveDefaultAgentDir`、非推奨の互換エクスポート `resolveOpenClawAgentDir` を含む、エージェントディレクトリ／ID／ワークスペースヘルパー用の非推奨の包括的バレル。用途を限定したエージェント／ランタイムサブパスを推奨します |
    | `plugin-sdk/directory-runtime` | 設定に基づくディレクトリの照会／重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能およびテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer`、および非推奨の `fetchRemoteMedia` を含む非推奨の広範なメディアバレル。`plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media`、および機能ランタイムのサブパスを推奨。また、URL を OpenClaw メディアに変換する場合は、バッファーを読み取る前にストアヘルパーを使用することを推奨 |
    | `plugin-sdk/media-mime` | MIME の正規化、ファイル拡張子のマッピング、MIME の検出、およびメディア種別ヘルパーに限定されたサーフェス |
    | `plugin-sdk/media-store` | `saveMediaBuffer` や `saveMediaStream` などのメディアストアヘルパーに限定されたサーフェス |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、およびモデルが見つからない場合のメッセージ |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型、およびプロバイダー向けの画像、音声、構造化抽出ヘルパーのエクスポート |
    | `plugin-sdk/text-chunking` | 送信テキストおよびオフセットを保持する範囲分割、Markdown の分割およびレンダリングヘルパー、引用符を考慮した HTML タグのトークン化、Markdown テーブル変換、ディレクティブタグの除去、および安全なテキストユーティリティ |
    | `plugin-sdk/speech` | 音声プロバイダー型、およびプロバイダー向けのディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーのエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、および音声ヘルパーのエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、および共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-bootstrap-context` | 制限付きの `IDENTITY.md`、`USER.md`、および `SOUL.md` コンテキスト注入用のリアルタイムプロファイル初期化ヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型、レジストリヘルパー、および出力アクティビティの追跡を含む共有リアルタイム音声動作ヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型、画像アセットおよびデータ URL ヘルパー、ならびに OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、およびレジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成のプロバイダー、リクエスト、結果の型 |
    | `plugin-sdk/music-generation-core` | 非推奨の共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、およびモデル参照の解析。Plugin が所有する音楽プロバイダーのサーフェスを推奨 |
    | `plugin-sdk/video-generation` | 動画生成のプロバイダー、リクエスト、結果の型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、およびモデル参照の解析 |
    | `plugin-sdk/transcripts` | 共有トランスクリプトソースプロバイダー型、レジストリヘルパー、セッション記述子、および発話メタデータ |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリおよびルート導入ヘルパー |
    | `plugin-sdk/webhook-path` | 非推奨の互換性エイリアス。`plugin-sdk/webhook-ingress` を使用 |
    | `plugin-sdk/web-media` | 共有リモート／ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | 非推奨の互換性再エクスポート。`zod` から `zod` を直接インポート |
    | `plugin-sdk/plugin-test-api` | リポジトリのテストヘルパーブリッジをインポートせずに、Plugin の直接登録ユニットテストを行うためのリポジトリローカルな最小限の `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、およびトランスクリプト投影のテスト用のリポジトリローカルなネイティブエージェントランタイムアダプター契約フィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション、セットアップ、ステータスの契約、ディレクトリのアサーション、アカウント起動ライフサイクル、送信設定の引き回し、ランタイムモック、ステータスの問題、送信配信、およびフック登録用のリポジトリローカルなチャンネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャンネルテスト用のリポジトリローカルな共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/channel-contract-testing` | 広範なテスト用バレルを使用しない、リポジトリローカルな限定的チャンネル契約テストヘルパー |
    | `plugin-sdk/plugin-test-contracts` | リポジトリローカルな Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、およびインポート副作用の契約ヘルパー |
    | `plugin-sdk/plugin-state-test-runtime` | リポジトリローカルな Plugin 状態ストア、受信キュー、および状態 DB のテストヘルパー |
    | `plugin-sdk/provider-test-contracts` | リポジトリローカルなプロバイダーランタイム、認証、検出、オンボーディング、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、ウェブ検索／取得、およびストリーム契約のヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト用の、リポジトリローカルでオプトイン式の Vitest HTTP／認証モック |
    | `plugin-sdk/reply-payload-testing` | 返信ペイロードフィクスチャにメタデータを付加するためのリポジトリローカルなヘルパー |
    | `plugin-sdk/sqlite-runtime-testing` | ファーストパーティテスト用のリポジトリローカルな SQLite ライフサイクルヘルパー |
    | `plugin-sdk/test-fixtures` | リポジトリローカルな汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、スキルライター、エージェントメッセージ、システムイベント、モジュール再読み込み、同梱 Plugin パス、ターミナルテキスト、分割、認証トークン、および型付きケースのフィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest の `vi.mock("node:*")` ファクトリー内で使用する、リポジトリローカルで限定的な Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="メモリのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | 非推奨の互換性エイリアス。`plugin-sdk/memory-host-core` を使用 |
    | `plugin-sdk/memory-core-engine-runtime` | 非推奨のメモリインデックス／検索ランタイムファサード。ベンダー非依存のメモリホストサブパスを推奨 |
    | `plugin-sdk/memory-core-host-embedding-registry` | 軽量なメモリ埋め込みプロバイダーレジストリヘルパー |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンのエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホストの埋め込み契約、レジストリアクセス、ローカルプロバイダー、および汎用バッチ／リモートヘルパー。このサーフェスの `registerMemoryEmbeddingProvider` は非推奨。新しいプロバイダーには汎用埋め込みプロバイダー API を使用。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンのエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンのエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | 非推奨のメモリホストマルチモーダルヘルパー。ベンダー非依存のメモリホストサブパスを推奨 |
    | `plugin-sdk/memory-core-host-query` | 非推奨のメモリホストクエリヘルパー。ベンダー非依存のメモリホストサブパスを推奨 |
    | `plugin-sdk/memory-core-host-secret` | メモリホストのシークレットヘルパー |
    | `plugin-sdk/memory-core-host-events` | 非推奨の互換性エイリアス。`plugin-sdk/memory-host-events` を使用 |
    | `plugin-sdk/memory-core-host-status` | メモリホストのステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホストの CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホストのコアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホストのファイル／ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホストのコアランタイムヘルパーに対するベンダー非依存のエイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストのイベントジャーナルヘルパーに対するベンダー非依存のエイリアス |
    | `plugin-sdk/memory-host-files` | 非推奨の互換性エイリアス。`plugin-sdk/memory-core-host-runtime-files` を使用 |
    | `plugin-sdk/memory-host-markdown` | メモリ関連 Plugin 用の共有管理対象 Markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | 検索マネージャーへアクセスするための Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | 非推奨の互換性エイリアス。`plugin-sdk/memory-core-host-status` を使用 |
  </Accordion>

  <Accordion title="予約済み同梱ヘルパーのサブパス">
    予約済みの同梱ヘルパー SDK サブパスは、同梱 Plugin コード向けの、
    所有者固有の限定的なサーフェスです。パッケージのビルドと
    エイリアス処理の決定性を維持するため SDK インベントリで追跡されますが、
    一般的な Plugin 作成 API ではありません。再利用可能な新しいホスト契約には、
    `plugin-sdk/gateway-runtime`、`plugin-sdk/ssrf-runtime`、
    `plugin-sdk/plugin-config-runtime` などの汎用 SDK サブパスを使用する必要があります。

    | サブパス | 所有者と目的 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ユーザーの MCP サーバー設定を Codex アプリサーバーのスレッド設定に投影するための同梱 Codex Plugin ヘルパー（予約済みパッケージエクスポート） |
    | `plugin-sdk/codex-native-task-runtime` | Codex アプリサーバーのネイティブサブエージェントを OpenClaw のタスク状態にミラーリングするための同梱 Codex Plugin ヘルパー（リポジトリローカルのみ。パッケージエクスポートではない） |

  </Accordion>
</AccordionGroup>

## 関連項目

- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
