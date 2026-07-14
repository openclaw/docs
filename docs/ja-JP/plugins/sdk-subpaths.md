---
read_when:
    - Plugin のインポートに適した plugin-sdk サブパスの選択
    - バンドルされた Plugin のサブパスとヘルパーサーフェスの監査
summary: Plugin SDK サブパスカタログ：各インポートの配置場所（領域別）
title: Plugin SDK サブパス
x-i18n:
    generated_at: "2026-07-14T13:54:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c457526891ba2adcce0d11f86e3efe4ab39c36c4bb3c0d4f08decc6e021d821d
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK は、`openclaw/plugin-sdk/` 配下にある限定的な公開サブパスのセットとして公開されています。このページでは、よく使用されるサブパスを目的別に分類して掲載します。このサーフェスは、次の 3 つのファイルで定義されます。

- `scripts/lib/plugin-sdk-entrypoints.json`: ビルドによってコンパイルされる、メンテナンス対象のエントリポイント一覧。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: リポジトリ内専用のテスト用および内部用サブパス。パッケージのエクスポートは、一覧からこのリストを除いたものです。
- `src/plugin-sdk/entrypoints.ts`: 非推奨サブパス、予約済みのバンドルヘルパー、サポート対象のバンドルファサード、および Plugin が所有する公開サーフェスの分類メタデータ。

メンテナーは、`pnpm plugin-sdk:surface` で公開エクスポート数を、`pnpm plugins:boundary-report:summary` で使用中の予約済みヘルパーサブパスを監査します。未使用の予約済みヘルパーエクスポートは、休眠状態の互換性負債として公開 SDK に残るのではなく、CI レポートを失敗させます。

Plugin 作成ガイドについては、[Plugin SDK の概要](/ja-JP/plugins/sdk-overview)を参照してください。

## Plugin エントリ

| サブパス                       | 主なエクスポート                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | `createMigrationItem` などの移行プロバイダー項目ヘルパー、理由定数、項目ステータスマーカー、秘匿化ヘルパー、および `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime`、`writeMigrationReport` などのランタイム移行ヘルパー                                             |
| `plugin-sdk/health`            | バンドルされたヘルス情報利用側向けの Doctor ヘルスチェック登録、検出、修復、選択、重大度、および検出結果の型                                                                                |
| `plugin-sdk/config-schema`     | 非推奨。ルートの `openclaw.json` Zod スキーマ（`OpenClawSchema`）。代わりに Plugin ローカルのスキーマを定義し、`plugin-sdk/json-schema-runtime` で検証してください                                                  |

### 非推奨の互換性ヘルパーとテストヘルパー

古い Plugin 向けに非推奨サブパスは引き続きエクスポートされますが、新しいコードでは以下の用途別 SDK サブパスを使用してください。メンテナンス対象のリストは `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` です。CI は、バンドルされた本番コードからこのリストに含まれるサブパスをインポートすることを拒否します。`plugin-sdk/compat`、`plugin-sdk/config-types`、`plugin-sdk/infra-runtime`、`plugin-sdk/text-runtime` などの広範なバレルは互換性専用であり、`plugin-sdk/zod` は互換性のための再エクスポートです。`zod` は `zod` から直接インポートしてください。広範なドメインバレルである `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、`plugin-sdk/channel-runtime`、`plugin-sdk/cli-runtime`、`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime`、`plugin-sdk/security-runtime` も同様に、用途別サブパスを優先するため非推奨です。

OpenClaw の Vitest ベースのテストヘルパーサブパスはリポジトリ内専用であり、パッケージからはエクスポートされなくなりました: `agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-state-test-runtime`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`reply-payload-testing`、`sqlite-runtime-testing`、`test-env`、`test-fixtures`、`test-node-mocks`、`testing`。非公開のバンドルヘルパーサーフェス `ssrf-runtime-internal` と `codex-native-task-runtime` もリポジトリ内専用です。

### 予約済みのバンドル Plugin ヘルパーサブパス

`plugin-sdk/codex-mcp-projection` は唯一の予約済みサブパスです。これはバンドルされた Codex Plugin が所有する互換性サーフェスであり、汎用 SDK API ではありません。所有者をまたぐ Plugin 間のインポートはパッケージ契約のガードレールによってブロックされ、予約済みサブパスがインポートされなくなると CI は失敗します。`plugin-sdk/codex-native-task-runtime` はリポジトリ内専用であり、パッケージからはエクスポートされません。

`src/plugin-sdk/entrypoints.ts` は、汎用的な契約に置き換えられるまでバンドルされた Plugin によって支えられる SDK エントリポイントである、サポート対象のバンドルファサードも追跡します: `plugin-sdk/discord`、`plugin-sdk/lmstudio`、`plugin-sdk/lmstudio-runtime`、`plugin-sdk/matrix`、`plugin-sdk/mattermost`、`plugin-sdk/memory-core-engine-runtime`、`plugin-sdk/provider-zai-endpoint`、`plugin-sdk/qa-runner-runtime`、`plugin-sdk/telegram-account`、`plugin-sdk/tts-runtime`、`plugin-sdk/zalouser`。このうちいくつかは新しいコードでは非推奨でもあります。以下の各行の注記を参照してください。

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Plugin が所有するスキーマ向けの、キャッシュされた JSON Schema 検証ヘルパー |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、セットアップ翻訳機能、許可リストプロンプト、セットアップ状態ビルダー |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 非推奨の互換性エイリアス。`plugin-sdk/setup-runtime` を使用してください |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 複数アカウントの設定／アクションゲートヘルパー、デフォルトアカウントのフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索およびデフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 限定的なアカウント一覧／アカウントアクションヘルパー |
    | `plugin-sdk/access-groups` | アクセスグループ許可リストの解析および秘匿化されたグループ診断ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有チャネル設定スキーマプリミティブ、および Zod と直接的な JSON／TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | メンテナンス対象のバンドル Plugin 専用の、OpenClaw にバンドルされたチャネル設定スキーマ |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。標準のバンドル済み／公式チャットチャネル ID、および独自テーブルをハードコードせずにエンベロープ接頭辞付きテキストを認識する必要がある Plugin 向けのフォーマッターラベル／エイリアス。 |
    | `plugin-sdk/channel-config-schema-legacy` | バンドルチャネル設定スキーマ向けの非推奨の互換性エイリアス |
    | `plugin-sdk/telegram-command-config` | 非推奨の Telegram コマンド名／説明の正規化および重複／競合チェック。新しい Plugin コードでは Plugin ローカルのコマンド設定処理を使用してください |
    | `plugin-sdk/command-gating` | 限定的なコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 低レベルのチャネル受信互換性サーフェス。新しい受信パスでは `plugin-sdk/channel-ingress-runtime` を使用してください。 |
    | `plugin-sdk/channel-ingress-runtime` | 移行済みチャネル受信パス向けの、実験的な高レベルチャネル受信ランタイムリゾルバーおよびルート情報ビルダー。各 Plugin で有効な許可リスト、コマンド許可リスト、レガシープロジェクションを組み立てるより、こちらを優先してください。[チャネル受信 API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。 |
    | `plugin-sdk/channel-lifecycle` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-outbound` | メッセージライフサイクル契約、および返信パイプラインオプション、受領通知、ライブプレビュー／ストリーミング、ライフサイクルヘルパー、送信 ID、ペイロード計画、永続的な送信、メッセージ送信コンテキストヘルパー。[チャネル送信 API](/ja-JP/plugins/sdk-channel-outbound) を参照してください。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 向けの非推奨の互換性エイリアス、およびレガシー返信ディスパッチファサード。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 向けの非推奨の互換性エイリアス、およびレガシー返信ディスパッチファサード。 |
    | `plugin-sdk/inbound-envelope` | 共有受信ルートおよびエンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 非推奨の互換性ファサード。受信ランナーとディスパッチ述語には `plugin-sdk/channel-inbound` を、メッセージ配信ヘルパーには `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析エイリアス。`plugin-sdk/channel-targets` を使用してください |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みおよびホスト型メディア状態ヘルパー |
    | `plugin-sdk/outbound-send-deps` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/outbound-runtime` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/poll-runtime` | 限定的な投票正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルおよびアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | エージェントメディアペイロードのルートおよびローダー |
    | `plugin-sdk/conversation-runtime` | 会話／スレッドバインディング、ペアリング、設定済みバインディングのヘルパーをまとめた非推奨の広範なバレル。`plugin-sdk/thread-bindings-runtime` や `plugin-sdk/session-binding-runtime` など、対象を絞ったバインディングサブパスを優先してください |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャネル状態スナップショット／概要ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 限定的なチャネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャネル Plugin の前置きエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定の編集／読み取りヘルパー |
    | `plugin-sdk/group-access` | 非推奨のグループアクセス判定ヘルパー。`plugin-sdk/channel-ingress-runtime` の `resolveChannelMessageIngress` を使用してください |
    | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 非推奨の互換性ファサード。`plugin-sdk/channel-inbound` を使用してください。 |
    | `plugin-sdk/direct-dm-guard-policy` | 限定的なダイレクト DM の暗号化前ガードポリシーヘルパー |
    | `plugin-sdk/discord` | 公開済みの `@openclaw/discord@2026.3.13` および追跡対象の所有者互換性向けの、非推奨の Discord 互換性ファサード。新しい Plugin では汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/telegram-account` | 追跡対象の所有者互換性向けの、非推奨の Telegram アカウント解決互換性ファサード。新しい Plugin では注入されたランタイムヘルパーまたは汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/zalouser` | 送信者コマンド認可を引き続きインポートしている公開済み Lark／Zalo パッケージ向けの、非推奨の Zalo Personal 互換性ファサード。新しい Plugin では汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/interactive-runtime` | セマンティックなメッセージの表示、配信、およびレガシーな対話型返信ヘルパー。[メッセージ表示](/ja-JP/plugins/message-presentation) を参照してください |
    | `plugin-sdk/channel-inbound` | イベント分類、コンテキスト構築、書式設定、ルート、デバウンス、メンション照合、メンションポリシー、受信ログ向けの共有受信ヘルパー |
    | `plugin-sdk/channel-inbound-debounce` | 限定的な受信デバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広範な受信ランタイムサーフェスを含まない、限定的なメンションポリシー、メンションマーカー、メンションテキストヘルパー |
    | `plugin-sdk/channel-envelope`、`plugin-sdk/channel-inbound-roots`、`plugin-sdk/channel-location`、`plugin-sdk/channel-logging` | 非推奨の互換性ファサード。`plugin-sdk/channel-inbound` または `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-pairing-paths` | 非推奨の互換性ファサード。`plugin-sdk/channel-pairing` を使用してください。 |
    | `plugin-sdk/channel-reply-options-runtime` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-streaming` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-send-result` | 返信結果の型 |
    | `plugin-sdk/channel-actions` | チャネルメッセージアクションヘルパー、および Plugin 互換性のために維持されている非推奨のネイティブスキーマヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動のターゲット解決、スレッド ID の文字列化、重複排除済み／コンパクトなルートキー、解析済みターゲット型、およびルート／ターゲット比較ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析ヘルパー。ルート比較の呼び出し元では `plugin-sdk/channel-route` を使用してください |
    | `plugin-sdk/channel-contract` | チャネル契約の型 |
    | `plugin-sdk/channel-feedback` | フィードバック／リアクションの接続 |
  </Accordion>

非推奨のチャンネルヘルパーファミリーは、公開済み Plugin との互換性のためにのみ引き続き利用できます。削除計画は次のとおりです。外部 Plugin の移行期間中はこれらを維持し、リポジトリ内およびバンドル済み Plugin では `channel-inbound` と `channel-outbound` を使用し、次回のメジャー SDK クリーンアップで互換性サブパスを削除します。これは、旧チャンネルメッセージ／ランタイム、チャンネルストリーミング、ダイレクト DM アクセス、分岐した受信ヘルパー、返信オプション、ペアリングパスの各ファミリーに適用されます。

  <Accordion title="プロバイダーのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムモデル準備に対応する LM Studio プロバイダーファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーのデフォルト、モデル検出、リクエストヘッダー、ロード済みモデル用ヘルパーに対応する LM Studio ランタイムファサード |
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
    | `plugin-sdk/provider-catalog-live-runtime` | 保護された `/models` 形式の検出向けライブプロバイダーモデルカタログヘルパー：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、モデル ID フィルタリング、TTL キャッシュ、静的フォールバック |
    | `plugin-sdk/provider-catalog-runtime` | プロバイダーカタログ拡張ランタイムフックと、コントラクトテスト向け Plugin プロバイダーレジストリの接続点 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダー HTTP／エンドポイント機能ヘルパー、プロバイダー HTTP エラー、音声文字起こし用マルチパートフォームヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの限定的なウェブ取得設定／選択コントラクトヘルパー |
    | `plugin-sdk/provider-web-fetch` | ウェブ取得プロバイダーの登録／キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin の有効化配線を必要としないプロバイダー向けの限定的なウェブ検索設定／認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター／ゲッターなどの限定的なウェブ検索設定／認証情報コントラクトヘルパー |
    | `plugin-sdk/provider-web-search` | ウェブ検索プロバイダーの登録／キャッシュ／ランタイムヘルパー |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)`、`listEmbeddingProviders(...)` を含む汎用埋め込みプロバイダー型および読み取りヘルパー。マニフェストの所有権が強制されるよう、Plugin は `api.registerEmbeddingProvider(...)` を介してプロバイダーを登録します |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek／Gemini／OpenAI スキーマのクリーンアップと診断 |
    | `plugin-sdk/provider-usage` | プロバイダー使用量スナップショット型、共有使用量取得ヘルパー、`fetchClaudeUsage` などのプロバイダー取得関数 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、プレーンテキストのツール呼び出し互換機能、共有 Anthropic／Google／Kilocode／MiniMax／Moonshot／OpenAI／OpenRouter／Z.AI ラッパーヘルパー |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`、Anthropic／DeepSeek／OpenAI 互換ストリームユーティリティを含む公開共有プロバイダーストリームラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | 保護された取得、ツール結果テキストの抽出、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルのシングルトン／マップ／キャッシュヘルパー |
    | `plugin-sdk/group-activation` | 限定的なグループ有効化モードおよびコマンド解析ヘルパー |
  </Accordion>

プロバイダー使用量スナップショットは通常、1 つ以上のクォータ `windows` を報告し、それぞれに
ラベル、使用率、任意のリセット時刻が含まれます。リセット可能なクォータ期間ではなく、残高または
アカウント状態のテキストを公開するプロバイダーは、割合を捏造せず、空の `windows` 配列を持つ
`summary` を返す必要があります。
OpenClaw はその要約テキストをステータス出力に表示します。使用量エンドポイントが失敗した場合、または
利用可能な使用量データが返されなかった場合にのみ `error` を使用してください。

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | 非推奨の広範なコマンド認可サーフェス（`resolveControlCommandGate`、動的引数メニューの書式設定を含むコマンドレジストリヘルパー、送信者認可ヘルパー）。チャネルの受信／ランタイム認可またはコマンドステータスヘルパーを使用してください |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド／ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者の解決および同一チャット内アクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ実行承認プロファイル／フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能／配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway リゾルバー |
    | `plugin-sdk/approval-reference-runtime` | トランスポート制限のある承認コールバック向けの決定論的な永続ロケーターヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットチャネルエントリーポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。より限定的なアダプター／Gateway の接続点で十分な場合は、そちらを優先してください |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット、アカウントバインディング、ルートゲート、転送フォールバック、ローカルネイティブ実行プロンプト抑制ヘルパー |
    | `plugin-sdk/approval-reaction-runtime` | ハードコードされた承認リアクションバインディング、リアクションプロンプトペイロード、リアクションターゲットストア、リアクションヒントテキストヘルパー、ローカルネイティブ実行プロンプト抑制用の互換エクスポート |
    | `plugin-sdk/approval-reply-runtime` | 実行／Plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | 実行／Plugin 承認ペイロードヘルパー、承認機能ビルダー、承認認証／プロファイルヘルパー、ネイティブ承認ルーティング／ランタイムヘルパー、`formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 非推奨の限定的な受信返信重複排除リセットヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニューの書式設定、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットチャネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文の正規化およびコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | プライベートチャネルおよび Web UI のデバイスコードペアリング向け遅延プロバイダー認証ログインフローヘルパー |
    | `plugin-sdk/channel-secret-runtime` | 非推奨の広範なシークレットコントラクトサーフェス（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、シークレットターゲット型）。以下の目的別サブパスを優先してください |
    | `plugin-sdk/channel-secret-basic-runtime` | TTS 以外のチャネル／Plugin シークレットサーフェス向けの限定的なシークレットコントラクトエクスポートおよびターゲットレジストリビルダー |
    | `plugin-sdk/channel-secret-tts-runtime` | 限定的なネストされたチャネル TTS シークレット割り当てヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレットコントラクト／設定解析向けの限定的な SecretRef 型付け、解決、プランターゲットパス検索 |
    | `plugin-sdk/secret-provider-integration` | 外部シークレットプロバイダープリセットを公開する Plugin 向けの型専用 SecretRef プロバイダー統合マニフェストおよびプリセットコントラクト |
    | `plugin-sdk/security-runtime` | 信頼、DM ゲーティング、作成専用書き込みを含むルート範囲限定ファイル／パスヘルパー、同期／非同期アトミックファイル置換、同階層への一時書き込み、デバイス間移動フォールバック、プライベートファイルストアヘルパー、シンボリックリンク親ガード、外部コンテンツ、機密テキスト編集、定時間シークレット比較、シークレット収集ヘルパーを含む非推奨の広範なバレル。目的別のセキュリティ／SSRF／シークレットサブパスを優先してください |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストおよびプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範なインフラランタイムサーフェスを含まない限定的な固定ディスパッチャーヘルパー |
    | `plugin-sdk/ssrf-runtime` | 固定ディスパッチャー、SSRF 保護された取得、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト／ターゲットヘルパーおよび生の WebSocket／本文の型変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文のサイズ／タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | ランタイム、ロギング、バックアップのヘルパー、Plugin のインストールパスに関する警告、プロセスヘルパー |
    | `plugin-sdk/runtime-env` | ランタイム環境、ロガー、タイムアウト、再試行、バックオフに特化したヘルパー |
    | `plugin-sdk/browser-config` | 正規化されたプロファイルとデフォルト、CDP URL の解析、ブラウザー制御認証ヘルパー向けにサポートされるブラウザー設定ファサード |
    | `plugin-sdk/agent-harness-task-runtime` | ホストが発行したタスクスコープを使用する、ハーネスベースのエージェント向けの汎用タスクライフサイクルおよび完了通知ヘルパー |
    | `plugin-sdk/codex-mcp-projection` | ユーザーの MCP サーバー設定を Codex スレッド設定へ投影するための、予約済み同梱 Codex ヘルパー。サードパーティ Plugin 向けではありません |
    | `plugin-sdk/codex-native-task-runtime` | ネイティブタスクのミラーリングとランタイム配線向けの、リポジトリローカルな同梱 Codex ヘルパー。パッケージのエクスポートではありません |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネルランタイムコンテキストの登録および検索ヘルパー |
    | `plugin-sdk/matrix` | 古いサードパーティチャネルパッケージ向けの非推奨 Matrix 互換ファサード。新しい Plugin は `plugin-sdk/run-command` を直接インポートする必要があります |
    | `plugin-sdk/mattermost` | 古いサードパーティチャネルパッケージ向けの非推奨 Mattermost 互換ファサード。新しい Plugin は汎用 SDK サブパスを直接インポートする必要があります |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Plugin のコマンド、フック、HTTP、対話型ヘルパー向けの非推奨の包括的バレル。用途を絞った Plugin ランタイムサブパスを推奨します |
    | `plugin-sdk/hook-runtime` | Webhook および内部フックパイプラインヘルパー向けの非推奨の包括的バレル。用途を絞ったフックおよび Plugin ランタイムサブパスを推奨します |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` などのランタイム遅延インポートおよびバインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI の書式設定、待機、バージョン、引数による呼び出し、コマンドグループの遅延読み込み向けの非推奨の包括的バレル。用途を絞った CLI およびランタイムサブパスを推奨します |
    | `plugin-sdk/qa-live-transport-scenarios` | 共有ライブトランスポート QA シナリオ ID、ベースラインカバレッジヘルパー、シナリオ選択ヘルパー |
    | `plugin-sdk/qa-runner-runtime` | CLI コマンドサーフェスを通じて Plugin QA シナリオを公開する、サポート対象のファサード |
    | `plugin-sdk/tts-runtime` | テキスト読み上げ設定スキーマおよびランタイムヘルパー向けの、サポート対象のファサード |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言する Plugin HTTP ルート向けの、予約済み Gateway メソッドディスパッチヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアント、イベントループ準備完了後のクライアント起動ヘルパー、Gateway CLI RPC、Gateway プロトコルエラー、通知された LAN ホストの解決、チャネルステータスのパッチヘルパー |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` などの Plugin 設定形式およびチャネル／プロバイダー設定型向けの、型専用に絞った設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `mergeDeep`、`requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject` などのランタイム Plugin 設定ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated` などのトランザクション対応設定変更ヘルパー |
    | `plugin-sdk/message-tool-delivery-hints` | 共有メッセージツール配信メタデータのヒント文字列 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テスト用スナップショットセッターなどの現在のプロセス設定スナップショットヘルパー |
    | `plugin-sdk/text-autolink-runtime` | 包括的なテキストバレルを使用しないファイル参照の自動リンク検出 |
    | `plugin-sdk/reply-runtime` | 共有の受信／返信ランタイムヘルパー、チャンク分割、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 返信のディスパッチ／完了処理および会話ラベルに特化したヘルパー |
    | `plugin-sdk/reply-history` | 共有の短時間返信履歴ヘルパー。新しいメッセージターンのコードでは `createChannelHistoryWindow` を使用する必要があります。低レベルのマップヘルパーは、非推奨の互換エクスポートとしてのみ残されています |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | テキスト／Markdown のチャンク分割に特化したヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションワークフローヘルパー（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、修復／ライフサイクルヘルパー（`deleteSessionEntry`、`cleanupSessionLifecycleArtifacts`、`resolveSessionStoreBackupPaths`）、移行期の `sessionFile` 値向けマーカーヘルパー、セッション ID に基づく直近のユーザー／アシスタントのトランスクリプトテキストの上限付き読み取り、セッションストアパス／セッションキーヘルパー、更新日時の読み取り。包括的な設定書き込み／メンテナンスのインポートは含みません |
    | `plugin-sdk/session-transcript-runtime` | トランスクリプト ID、スコープ付きターゲット／読み取り／書き込みヘルパー、可視メッセージエントリの投影、更新の発行、書き込みロック、トランスクリプトメモリのヒットキー |
    | `plugin-sdk/sqlite-runtime` | データベースのライフサイクル制御を含まない、ファーストパーティランタイム向けの SQLite エージェントスキーマ、パス、トランザクションに特化したヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cron ストアのパス／読み込み／保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態／OAuth ディレクトリのパスヘルパー |
    | `plugin-sdk/plugin-state-runtime` | Plugin サイドカー SQLite のキー付き状態型と、Plugin 所有データベース向けに一元化された接続 pragma および WAL メンテナンス設定 |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` などのルート／セッションキー／アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャネル／アカウントステータスの要約ヘルパー、ランタイム状態のデフォルト、問題メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | スラッグ／文字列の正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch／request 形式の入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout／stderr 結果を返す時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール／CLI パラメーターリーダー |
    | `plugin-sdk/tool-plugin` | 単純な型付きエージェントツール Plugin を定義し、マニフェスト生成向けの静的メタデータを公開 |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化されたペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正規の送信先フィールドを抽出 |
    | `plugin-sdk/sandbox` | サンドボックスバックエンド型および SSH／OpenShell コマンドヘルパー。即時失敗する実行コマンドの事前検証を含みます |
    | `plugin-sdk/temp-path` | 共有の一時ダウンロードパスヘルパーおよび非公開の安全な一時ワークスペース |
    | `plugin-sdk/logging-core` | サブシステムロガーおよび秘匿化ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードおよび変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry`、`resolveAgentMaxConcurrent` などのモデル／セッションオーバーライドヘルパー |
    | `plugin-sdk/talk-config-runtime` | Talk プロバイダー設定の解決ヘルパー |
    | `plugin-sdk/json-store` | 小規模な JSON 状態の読み取り／書き込みヘルパー |
    | `plugin-sdk/json-unsafe-integers` | 安全でない整数リテラルを文字列として保持する JSON 解析ヘルパー |
    | `plugin-sdk/file-lock` | 再入可能なファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクベースの重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP ランタイム／セッションおよび返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時に読み込まれる Plugin 向けの軽量 ACP バックエンド登録および返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動のインポートを伴わない読み取り専用 ACP バインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 非推奨のエージェントランタイム設定スキーマプリミティブ。スキーマプリミティブは、メンテナンスされている Plugin 所有のサーフェスからインポートしてください |
    | `plugin-sdk/boolean-param` | 緩やかな真偽値パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険な名前の一致判定解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` を含む、デバイスのブートストラップおよびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有のパッシブチャネル、ステータス、アンビエントプロキシのヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド／プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skill コマンドの一覧表示ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドのレジストリ／構築／シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルのエージェントハーネス向け実験的な信頼済み Plugin サーフェス：ハーネス型、実行中ランの方向修正／中止ヘルパー、OpenClaw ツールブリッジヘルパー、ランタイムプランのツールポリシーヘルパー、ターミナル結果の分類、ツール進捗の書式設定／詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | 非推奨の Z.AI プロバイダー所有エンドポイント検出ファサード。Z.AI Plugin の公開 API を使用してください |
    | `plugin-sdk/async-lock-runtime` | 小規模なランタイム状態ファイル向けのプロセスローカルな非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティのテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 上限付き非同期タスク並行実行ヘルパー |
    | `plugin-sdk/dedupe-runtime` | インメモリおよび永続ストレージベースの重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | 送信保留中の配信を排出するヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルおよびメディアソースのパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat のウェイク、イベント、可視性ヘルパー |
    | `plugin-sdk/expect-runtime` | 証明可能なランタイム不変条件向けの必須値アサーションヘルパー |
    | `plugin-sdk/number-runtime` | 数値型強制変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | 安全なトークン／UUID ヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了の待機ヘルパー |
    | `plugin-sdk/exec-approvals-runtime` | 包括的なインフラランタイムバレルを使用しない実行承認ポリシーファイルヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換シム。上記の用途を絞ったランタイムサブパスを使用してください |
    | `plugin-sdk/collection-runtime` | 小規模な上限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、書式設定、共有エラー分類ヘルパー、`PlatformMessageNotDispatchedError`、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされた fetch、プロキシ、EnvHttpProxyAgent オプション、固定ルックアップヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ／保護付き fetch のインポートを伴わない、ディスパッチャー対応ランタイム fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 包括的なメディアランタイムサーフェスを使用しない、インライン画像データ URL のサニタイズおよびシグネチャ判別ヘルパー |
    | `plugin-sdk/response-limit-runtime` | 包括的なメディアランタイムサーフェスを使用しない、上限付きレスポンス本文リーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングやペアリングストアを伴わない、現在の会話バインディング状態 |
    | `plugin-sdk/context-visibility-runtime` | 包括的な設定／セキュリティのインポートを伴わない、コンテキスト可視性の解決および補足コンテキストのフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown／ロギングのインポートを伴わない、プリミティブなレコード／文字列の型強制変換および正規化に特化したヘルパー |
    | `plugin-sdk/html-entity-runtime` | 包括的なテキストユーティリティを使用しない、セミコロン終端 HTML5 エンティティの単一パスデコード |
    | `plugin-sdk/text-utility-runtime` | 5 種類のエンティティによる HTML エスケープを含む、低レベルのテキストおよびパスヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名および SCP ホストの正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | 再試行設定および再試行ランナーヘルパー |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`、`resolveDefaultAgentDir`、非推奨の互換エクスポート `resolveOpenClawAgentDir` を含む、エージェントディレクトリ／ID／ワークスペースヘルパー向けの非推奨の包括的バレル。用途を絞ったエージェント／ランタイムサブパスを推奨します |
    | `plugin-sdk/directory-runtime` | 設定に基づくディレクトリの照会／重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer`、および非推奨の `fetchRemoteMedia` を含む、非推奨の広範なメディアバレル。`plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media`、および機能ランタイムのサブパスを優先し、URL を OpenClaw メディアに変換する場合は、バッファー読み取りよりもストアヘルパーを優先してください |
    | `plugin-sdk/media-mime` | 限定的な MIME 正規化、ファイル拡張子のマッピング、MIME 検出、およびメディア種別ヘルパー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` や `saveMediaStream` などの限定的なメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、およびモデル欠落時のメッセージ |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型、およびプロバイダー向けの画像、音声、構造化抽出ヘルパーのエクスポート |
    | `plugin-sdk/text-chunking` | 送信テキストおよびオフセットを維持する範囲チャンク分割、Markdown のチャンク分割／レンダリングヘルパー、引用符を考慮した HTML タグのトークン化、Markdown テーブル変換、ディレクティブタグの除去、および安全なテキストユーティリティ |
    | `plugin-sdk/speech` | 音声プロバイダー型、およびプロバイダー向けのディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーのエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、および音声ヘルパーのエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、および共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-bootstrap-context` | 制限された `IDENTITY.md`、`USER.md`、および `SOUL.md` のコンテキスト注入用リアルタイムプロファイル初期化ヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型、レジストリヘルパー、および出力アクティビティ追跡を含む共有リアルタイム音声動作ヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型、画像アセット／データ URL ヘルパー、および OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、およびレジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成のプロバイダー／リクエスト／結果の型 |
    | `plugin-sdk/music-generation-core` | 非推奨の共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、およびモデル参照の解析。Plugin が所有する音楽プロバイダーのサーフェスを優先してください |
    | `plugin-sdk/video-generation` | 動画生成のプロバイダー／リクエスト／結果の型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、およびモデル参照の解析 |
    | `plugin-sdk/transcripts` | 共有トランスクリプトソースプロバイダー型、レジストリヘルパー、セッション記述子、および発話メタデータ |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリおよびルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | 非推奨の互換性エイリアス。`plugin-sdk/webhook-ingress` を使用してください |
    | `plugin-sdk/web-media` | 共有リモート／ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | 非推奨の互換性再エクスポート。`zod` を `zod` から直接インポートしてください |
    | `plugin-sdk/testing` | 従来の OpenClaw テスト向けの、リポジトリローカルな非推奨互換性バレル。新しいリポジトリテストでは、代わりに `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` など、目的を限定したローカルテストサブパスをインポートしてください |
    | `plugin-sdk/plugin-test-api` | リポジトリのテストヘルパーブリッジをインポートせずに直接 Plugin 登録の単体テストを行うための、リポジトリローカルな最小限の `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、およびトランスクリプト投影テスト向けの、リポジトリローカルなネイティブエージェントランタイムアダプター契約フィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション／セットアップ／ステータス契約、ディレクトリのアサーション、アカウント起動ライフサイクル、送信設定のスレッド処理、ランタイムモック、ステータスの問題、送信配信、およびフック登録向けの、リポジトリローカルなチャンネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャンネルテスト向けの、リポジトリローカルな共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/channel-contract-testing` | 広範なテストバレルを使用しない、リポジトリローカルな限定的チャンネル契約テストヘルパー |
    | `plugin-sdk/plugin-test-contracts` | リポジトリローカルな Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、およびインポートの副作用に関する契約ヘルパー |
    | `plugin-sdk/plugin-state-test-runtime` | リポジトリローカルな Plugin 状態ストア、受信キュー、および状態 DB のテストヘルパー |
    | `plugin-sdk/provider-test-contracts` | リポジトリローカルなプロバイダーランタイム、認証、検出、オンボーディング、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索／取得、およびストリーム契約ヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けの、リポジトリローカルなオプトイン Vitest HTTP／認証モック |
    | `plugin-sdk/reply-payload-testing` | 応答ペイロードフィクスチャにメタデータを付加するためのリポジトリローカルヘルパー |
    | `plugin-sdk/sqlite-runtime-testing` | ファーストパーティテスト向けのリポジトリローカルな SQLite ライフサイクルヘルパー |
    | `plugin-sdk/test-fixtures` | リポジトリローカルな汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、スキルライター、エージェントメッセージ、システムイベント、モジュール再読み込み、同梱 Plugin パス、端末テキスト、チャンク分割、認証トークン、および型付きケースのフィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest の `vi.mock("node:*")` ファクトリ内で使用する、リポジトリローカルな目的を限定した Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="メモリのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | 非推奨の互換性エイリアス。`plugin-sdk/memory-host-core` を使用してください |
    | `plugin-sdk/memory-core-engine-runtime` | 非推奨のメモリインデックス／検索ランタイムファサード。ベンダー中立なメモリホストのサブパスを優先してください |
    | `plugin-sdk/memory-core-host-embedding-registry` | 軽量なメモリ埋め込みプロバイダーレジストリヘルパー |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンのエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込み契約、レジストリアクセス、ローカルプロバイダー、および汎用バッチ／リモートヘルパー。このサーフェスの `registerMemoryEmbeddingProvider` は非推奨です。新しいプロバイダーには汎用埋め込みプロバイダー API を使用してください。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンのエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンのエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | 非推奨のメモリホストマルチモーダルヘルパー。ベンダー中立なメモリホストのサブパスを優先してください |
    | `plugin-sdk/memory-core-host-query` | 非推奨のメモリホストクエリヘルパー。ベンダー中立なメモリホストのサブパスを優先してください |
    | `plugin-sdk/memory-core-host-secret` | メモリホストのシークレットヘルパー |
    | `plugin-sdk/memory-core-host-events` | 非推奨の互換性エイリアス。`plugin-sdk/memory-host-events` を使用してください |
    | `plugin-sdk/memory-core-host-status` | メモリホストのステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホストの CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホストのコアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホストのファイル／ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホストのコアランタイムヘルパーに対するベンダー中立なエイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストのイベントジャーナルヘルパーに対するベンダー中立なエイリアス |
    | `plugin-sdk/memory-host-files` | 非推奨の互換性エイリアス。`plugin-sdk/memory-core-host-runtime-files` を使用してください |
    | `plugin-sdk/memory-host-markdown` | メモリ関連 Plugin 向けの共有マネージド Markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | 検索マネージャーにアクセスするための Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | 非推奨の互換性エイリアス。`plugin-sdk/memory-core-host-status` を使用してください |
  </Accordion>

  <Accordion title="予約済み同梱ヘルパーのサブパス">
    予約済み同梱ヘルパーの SDK サブパスは、同梱 Plugin コード向けの、所有者固有で目的を限定したサーフェスです。パッケージのビルドとエイリアス設定を決定論的に保つため SDK インベントリで追跡されますが、一般的な Plugin 作成 API ではありません。新しい再利用可能なホスト契約では、`plugin-sdk/gateway-runtime`、`plugin-sdk/ssrf-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK サブパスを使用してください。

    | サブパス | 所有者と目的 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ユーザーの MCP サーバー設定を Codex app-server のスレッド設定へ投影するための同梱 Codex Plugin ヘルパー（予約済みパッケージエクスポート） |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server のネイティブサブエージェントを OpenClaw のタスク状態へミラーリングするための同梱 Codex Plugin ヘルパー（リポジトリローカルのみ、パッケージエクスポートではありません） |

  </Accordion>
</AccordionGroup>

## 関連項目

- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
