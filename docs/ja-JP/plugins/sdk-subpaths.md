---
read_when:
    - Plugin のインポートに適した plugin-sdk サブパスを選ぶ
    - バンドルされたPluginのサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDK サブパスカタログ: どの import がどこにあるかを領域別に整理'
title: Plugin SDK サブパス
x-i18n:
    generated_at: "2026-06-27T12:36:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK は、`openclaw/plugin-sdk/` 配下の限定された公開サブパス群として公開されています。このページでは、よく使われるサブパスを目的別にまとめています。生成されたコンパイラのエントリポイントインベントリは `scripts/lib/plugin-sdk-entrypoints.json` にあり、パッケージエクスポートは `scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト用/内部用サブパスを差し引いた公開サブセットです。メンテナーは、公開エクスポート数を `pnpm plugin-sdk:surface` で、アクティブな予約済みヘルパーサブパスを `pnpm plugins:boundary-report:summary` で監査できます。未使用の予約済みヘルパーエクスポートは、休眠状態の互換性負債として公開 SDK に残るのではなく、CI レポートで失敗します。

Plugin 作成ガイドについては、[Plugin SDK の概要](/ja-JP/plugins/sdk-overview)を参照してください。

## Plugin エントリ

| サブパス                       | 主なエクスポート                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` などの移行プロバイダーアイテムヘルパー、理由定数、アイテムステータスマーカー、リダクションヘルパー、および `summarizeMigrationItems`             |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`、`writeMigrationReport` などのランタイム移行ヘルパー                                                       |
| `plugin-sdk/health`            | バンドルされたヘルスコンシューマー向けの Doctor ヘルスチェック登録、検出、修復、選択、重大度、および検出事項の型                                                       |

### 非推奨の互換性ヘルパーとテストヘルパー

非推奨のサブパスは古い Plugin 向けに引き続きエクスポートされますが、新しいコードでは下記の焦点を絞った SDK サブパスを使用してください。メンテナンスされている一覧は `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` です。CI は、バンドルされた本番コードからこの一覧へのインポートを拒否します。`compat`、`config-types`、`infra-runtime`、`text-runtime`、`zod` などの広範なバレルは互換性専用です。`zod` は `zod` から直接インポートしてください。

OpenClaw の Vitest ベースのテストヘルパーサブパスはリポジトリローカル専用であり、現在はパッケージエクスポートではありません: `agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks`、`testing`。

### 予約済みのバンドル Plugin ヘルパーサブパス

これらのサブパスは、それを所有するバンドル Plugin 向けの Plugin 所有の互換性サーフェスであり、汎用 SDK API ではありません: `plugin-sdk/codex-mcp-projection` および `plugin-sdk/codex-native-task-runtime`。所有者をまたぐ拡張機能のインポートは、パッケージ契約のガードレールによってブロックされます。

<AccordionGroup>
  <Accordion title="チャネルサブパス">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマエクスポート（`OpenClawSchema`） |
    | `plugin-sdk/json-schema-runtime` | Plugin 所有スキーマ向けのキャッシュ済み JSON Schema 検証ヘルパー |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、セットアップトランスレーター、許可リストプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 非推奨の互換性エイリアス。`plugin-sdk/setup-runtime` を使用してください |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 限定的なアカウントリスト/アカウントアクションヘルパー |
    | `plugin-sdk/access-groups` | アクセスグループ許可リスト解析と編集済みグループ診断ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有チャネル設定スキーマプリミティブに加え、Zod と直接 JSON/TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | メンテナンス対象のバンドル Plugin 専用の、バンドル済み OpenClaw チャネル設定スキーマ |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。正規のバンドル/公式チャットチャネル ID に加え、自前のテーブルをハードコードせずにエンベローププレフィックス付きテキストを認識する必要がある Plugin 向けのフォーマッターラベル/エイリアス。 |
    | `plugin-sdk/channel-config-schema-legacy` | バンドルチャネル設定スキーマの非推奨互換性エイリアス |
    | `plugin-sdk/telegram-command-config` | バンドル契約フォールバック付きの Telegram カスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 限定的なコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 非推奨の低レベルチャネル受信互換性ファサード。新しい受信パスでは `plugin-sdk/channel-ingress-runtime` を使用してください。 |
    | `plugin-sdk/channel-ingress-runtime` | 移行済みチャネル受信パス向けの、実験的な高レベルチャネル受信ランタイムリゾルバーとルートファクトビルダー。各 Plugin で有効な許可リスト、コマンド許可リスト、レガシー投影を組み立てるよりも、こちらを優先してください。[チャネル受信 API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。 |
    | `plugin-sdk/channel-lifecycle` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-outbound` | メッセージライフサイクル契約に加え、返信パイプラインオプション、受領確認、ライブプレビュー/ストリーミング、ライフサイクルヘルパー、送信元アイデンティティ、ペイロード計画、永続送信、メッセージ送信コンテキストヘルパー。[チャネル送信 API](/ja-JP/plugins/sdk-channel-outbound) を参照してください。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` の非推奨互換性エイリアスに加え、レガシー返信ディスパッチファサード。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` の非推奨互換性エイリアスに加え、レガシー返信ディスパッチファサード。 |
    | `plugin-sdk/inbound-envelope` | 共有受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 非推奨の互換性ファサード。受信ランナーとディスパッチ述語には `plugin-sdk/channel-inbound` を、メッセージ配信ヘルパーには `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析エイリアス。`plugin-sdk/channel-targets` を使用してください |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みとホスト済みメディア状態ヘルパー |
    | `plugin-sdk/outbound-send-deps` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/outbound-runtime` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/poll-runtime` | 限定的なポーリング正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングライフサイクルとアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャネルステータススナップショット/要約ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 限定的なチャネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャネル Plugin プレリュードエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換性ファサード。`plugin-sdk/channel-inbound` を使用してください。 |
    | `plugin-sdk/direct-dm-guard-policy` | 限定的な direct-DM 暗号化前ガードポリシーヘルパー |
    | `plugin-sdk/discord` | 公開済み `@openclaw/discord@2026.3.13` と追跡対象の所有者互換性向けの非推奨 Discord 互換性ファサード。新しい Plugin では汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/telegram-account` | 追跡対象の所有者互換性向けの非推奨 Telegram アカウント解決互換性ファサード。新しい Plugin では注入されたランタイムヘルパーまたは汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/zalouser` | 送信者コマンド認可をまだインポートしている公開済み Lark/Zalo パッケージ向けの、非推奨 Zalo Personal 互換性ファサード。新しい Plugin では `plugin-sdk/command-auth` を使用してください |
    | `plugin-sdk/interactive-runtime` | セマンティックメッセージ表現、配信、レガシー対話型返信ヘルパー。[メッセージ表現](/ja-JP/plugins/message-presentation) を参照してください |
    | `plugin-sdk/channel-inbound` | イベント分類、コンテキスト構築、フォーマット、ルート、デバウンス、メンション一致、メンションポリシー、受信ログ向けの共有受信ヘルパー |
    | `plugin-sdk/channel-inbound-debounce` | 限定的な受信デバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広い受信ランタイムサーフェスを含まない、限定的なメンションポリシー、メンションマーカー、メンションテキストヘルパー |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 非推奨の互換性ファサード。`plugin-sdk/channel-inbound` または `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-pairing-paths` | 非推奨の互換性ファサード。`plugin-sdk/channel-pairing` を使用してください。 |
    | `plugin-sdk/channel-reply-options-runtime` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-streaming` | 非推奨の互換性ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャネルメッセージアクションヘルパーに加え、Plugin 互換性のために保持されている非推奨ネイティブスキーマヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動のターゲット解決、スレッド ID 文字列化、重複排除/コンパクトなルートキー、解析済みターゲット型、ルート/ターゲット比較ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析ヘルパー。ルート比較の呼び出し側は `plugin-sdk/channel-route` を使用してください |
    | `plugin-sdk/channel-contract` | チャネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、シークレットターゲット型などの限定的なシークレット契約ヘルパー |
  </Accordion>

非推奨のチャネルヘルパーファミリーは、公開済み Plugin
互換性のためにのみ引き続き利用できます。削除計画は次のとおりです。
外部 Plugin
移行期間中は維持し、リポジトリ/バンドル Plugin は `channel-inbound` と
`channel-outbound` 上に維持し、その後、次のメジャー
SDK クリーンアップで互換性サブパスを削除します。これは、古いチャネルメッセージ/ランタイム、チャネル
ストリーミング、direct-DM アクセス、受信ヘルパー分割、返信オプション、
およびペアリングパスファミリーに適用されます。

  <Accordion title="プロバイダーのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムのモデル準備のためにサポートされる LM Studio プロバイダーファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーのデフォルト、モデル検出、リクエストヘッダー、ロード済みモデルヘルパーのためにサポートされる LM Studio ランタイムファサード |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型プロバイダーセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホスト型プロバイダーに特化したセットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト + ウォッチドッグ定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダー Plugin 向けランタイム API キー解決ヘルパー |
    | `plugin-sdk/provider-oauth-runtime` | 汎用プロバイダー OAuth コールバック型、コールバックページレンダリング、PKCE/状態ヘルパー、認可入力の解析、トークン有効期限ヘルパー、中止ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キーオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 認証結果ビルダー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証環境変数検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 認証インポートヘルパー、非推奨の `resolveOpenClawAgentDir` 互換エクスポート |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、共有モデル ID 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-live-runtime` | ガード付き `/models` 形式の検出向けライブプロバイダーモデルカタログヘルパー: `buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、モデル ID フィルタリング、TTL キャッシュ、静的フォールバック |
    | `plugin-sdk/provider-catalog-runtime` | プロバイダーカタログ拡張ランタイムフックと、契約テスト用の Plugin プロバイダーレジストリシーム |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダー HTTP/エンドポイント機能ヘルパー、プロバイダー HTTP エラー、音声文字起こしマルチパートフォームヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの狭い web-fetch 設定/選択契約ヘルパー |
    | `plugin-sdk/provider-web-fetch` | web-fetch プロバイダー登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 有効化の配線を必要としないプロバイダー向けの狭い web-search 設定/資格情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き資格情報セッター/ゲッターなどの狭い web-search 設定/資格情報契約ヘルパー |
    | `plugin-sdk/provider-web-search` | web-search プロバイダー登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)`、`listEmbeddingProviders(...)` を含む汎用埋め込みプロバイダー型と読み取りヘルパー。Plugin は `api.registerEmbeddingProvider(...)` を通じてプロバイダーを登録するため、マニフェスト所有権が強制される |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek/Gemini/OpenAI スキーマクリーンアップ + 診断 |
    | `plugin-sdk/provider-usage` | プロバイダー使用量スナップショット型、共有使用量取得ヘルパー、`fetchClaudeUsage` などのプロバイダー取得関数 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、プレーンテキストツール呼び出し互換、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`、Anthropic/DeepSeek/OpenAI 互換ストリームユーティリティを含む公開共有プロバイダーストリームラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | ガード付き fetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルのシングルトン/マップ/キャッシュヘルパー |
    | `plugin-sdk/group-activation` | 狭いグループ有効化モードとコマンド解析ヘルパー |
  </Accordion>

プロバイダー使用量スナップショットは通常、1 つ以上のクォータ `windows` を報告し、それぞれに
ラベル、使用率、任意のリセット時刻が含まれます。リセット可能なクォータウィンドウではなく残高や
アカウント状態テキストを公開するプロバイダーは、割合を捏造するのではなく、空の `windows` 配列とともに
`summary` を返す必要があります。
OpenClaw はその概要テキストをステータス出力に表示します。`error` は、使用量エンドポイントが失敗した場合、または
利用可能な使用量データを返さなかった場合にのみ使用してください。

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、動的引数メニュー書式設定を含むコマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決と同一チャットアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より狭いアダプター/Gateway シームを優先 |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット、アカウントバインディング、ルートゲート、転送フォールバック、ローカルネイティブ exec プロンプト抑制ヘルパー |
    | `plugin-sdk/approval-reaction-runtime` | ハードコードされた承認リアクションバインディング、リアクションプロンプトペイロード、リアクションターゲットストア、ローカルネイティブ exec プロンプト抑制用の互換エクスポート |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | exec/Plugin 承認ペイロードヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、`formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 狭い受信返信重複排除リセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広範なテストバレルを使わない狭いチャネル契約テストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニュー書式設定、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットチャネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文正規化とコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | チャネル/Plugin シークレットサーフェス向けの狭いシークレット契約収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレット契約/設定解析向けの狭い `coerceSecretRef` と SecretRef 型付けヘルパー |
    | `plugin-sdk/secret-provider-integration` | 外部シークレットプロバイダープリセットを公開する Plugin 向けの型専用 SecretRef プロバイダー統合マニフェストとプリセット契約 |
    | `plugin-sdk/security-runtime` | 信頼、DM ゲーティング、作成専用書き込みを含むルート境界付きファイル/パスヘルパー、同期/非同期アトミックファイル置換、兄弟一時書き込み、クロスデバイス移動フォールバック、プライベートファイルストアヘルパー、シンボリックリンク親ガード、外部コンテンツ、機密テキスト秘匿、定数時間シークレット比較、シークレット収集ヘルパーの共有機能 |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストとプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範なインフラランタイムサーフェスを使わない狭い固定ディスパッチャーヘルパー |
    | `plugin-sdk/ssrf-runtime` | 固定ディスパッチャー、SSRF ガード付き fetch、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパーと raw websocket/body 強制変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム、ログ、バックアップ、Pluginインストールのヘルパー |
    | `plugin-sdk/runtime-env` | 狭い範囲のランタイム環境、ロガー、タイムアウト、リトライ、バックオフのヘルパー |
    | `plugin-sdk/browser-config` | 正規化されたプロファイル/デフォルト、CDP URL 解析、ブラウザ制御認証ヘルパー向けの対応ブラウザ設定ファサード |
    | `plugin-sdk/agent-harness-task-runtime` | ホスト発行のタスクスコープを使うハーネス backed エージェント向けの汎用タスクライフサイクルと完了配信ヘルパー |
    | `plugin-sdk/codex-mcp-projection` | ユーザー MCP サーバー設定を Codex スレッド設定へ投影するための予約済みバンドル Codex ヘルパー。サードパーティPlugin向けではない |
    | `plugin-sdk/codex-native-task-runtime` | ネイティブタスクのミラー/ランタイム配線用の非公開バンドル Codex ヘルパー。サードパーティPlugin向けではない |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネルランタイムコンテキストの登録と検索ヘルパー |
    | `plugin-sdk/matrix` | 古いサードパーティチャネルパッケージ向けの非推奨 Matrix 互換ファサード。新しいPluginは `plugin-sdk/run-command` を直接インポートするべき |
    | `plugin-sdk/mattermost` | 古いサードパーティチャネルパッケージ向けの非推奨 Mattermost 互換ファサード。新しいPluginは汎用 SDK サブパスを直接インポートするべき |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有Pluginコマンド/フック/http/インタラクティブヘルパー |
    | `plugin-sdk/hook-runtime` | 共有Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` などの遅延ランタイムインポート/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI フォーマット、待機、バージョン、引数呼び出し、遅延コマンドグループヘルパー |
    | `plugin-sdk/qa-live-transport-scenarios` | 共有ライブトランスポート QA シナリオ ID、ベースラインカバレッジヘルパー、シナリオ選択ヘルパー |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言するPlugin HTTP ルート向けの予約済み Gateway メソッドディスパッチヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアント、イベントループ準備済みクライアント開始ヘルパー、Gateway CLI RPC、Gateway プロトコルエラー、チャネルステータスパッチヘルパー |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` やチャネル/プロバイダー設定型などのPlugin設定形状向けに絞った型専用設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject` などのランタイムPlugin設定検索ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated` などのトランザクション設定変更ヘルパー |
    | `plugin-sdk/message-tool-delivery-hints` | 共有メッセージツール配信メタデータヒント文字列 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テストスナップショット setter などの現在プロセス設定スナップショットヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドル Telegram 契約サーフェスを利用できない場合でも使える、Telegram コマンド名/説明の正規化と重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広範な text barrel なしのファイル参照自動リンク検出 |
    | `plugin-sdk/approval-reaction-runtime` | ハードコードされた承認リアクションバインディング、リアクションプロンプトペイロード、リアクションターゲットストア、ローカルネイティブ exec プロンプト抑制用の互換エクスポート |
    | `plugin-sdk/approval-runtime` | Exec/Plugin承認ヘルパー、承認機能ビルダー、認証/プロファイルヘルパー、ネイティブルーティング/ランタイムヘルパー、構造化承認表示パスのフォーマット |
    | `plugin-sdk/reply-runtime` | 共有受信/返信ランタイムヘルパー、チャンク化、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い範囲の返信ディスパッチ/確定と会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | 共有短期ウィンドウ返信履歴ヘルパー。新しいメッセージターンコードは `createChannelHistoryWindow` を使うべき。低レベル map ヘルパーは非推奨の互換エクスポートのみとして残る |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭い範囲のテキスト/Markdown チャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションワークフローヘルパー（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、セッション ID による範囲限定の直近ユーザー/アシスタントトランスクリプトテキスト読み取り、レガシーセッションストアパス/セッションキーヘルパー、更新日時読み取り、移行専用のストア全体/ファイルパス互換ヘルパー |
    | `plugin-sdk/session-transcript-runtime` | トランスクリプト ID、スコープ付きターゲット/読み取り/書き込みヘルパー、更新公開、書き込みロック、トランスクリプトメモリヒットキー |
    | `plugin-sdk/sqlite-runtime` | ファーストパーティランタイム向けに絞った SQLite エージェントスキーマ、パス、トランザクションヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cron ストアパス/読み込み/保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/plugin-state-runtime` | Pluginサイドカー SQLite キー付き状態型、およびPlugin所有データベース向けの集中接続 pragma と WAL メンテナンス設定 |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャネル/アカウントステータス要約ヘルパー、ランタイム状態デフォルト、issue メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | slug/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout/stderr 結果を持つ時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLI パラメーターリーダー |
    | `plugin-sdk/tool-plugin` | 単純な型付きエージェントツールPluginを定義し、マニフェスト生成用の静的メタデータを公開 |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化ペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正準送信ターゲットフィールドを抽出 |
    | `plugin-sdk/sandbox` | Sandbox バックエンド型と SSH/OpenShell コマンドヘルパー。fail-fast exec コマンド事前チェックを含む |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパーと非公開の安全な一時ワークスペース |
    | `plugin-sdk/logging-core` | サブシステムロガーとリダクションヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードと変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` や `resolveAgentMaxConcurrent` などのモデル/セッション上書きヘルパー |
    | `plugin-sdk/talk-config-runtime` | Talk プロバイダー設定解決ヘルパー |
    | `plugin-sdk/json-store` | 小さな JSON 状態読み取り/書き込みヘルパー |
    | `plugin-sdk/json-unsafe-integers` | 安全でない整数リテラルを文字列として保持する JSON 解析ヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスク backed 重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP ランタイム/セッションと返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時読み込みPlugin向けの軽量 ACP バックエンド登録と返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動インポートなしの読み取り専用 ACP バインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 狭い範囲のエージェントランタイム設定スキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩い boolean パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険な名前のマッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスブートストラップとペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャネル、ステータス、環境プロキシヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skill コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリ/ビルド/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的な信頼済みPluginサーフェス: ハーネス型、アクティブ実行の誘導/中止ヘルパー、OpenClaw ツールブリッジヘルパー、ランタイムプランツールポリシーヘルパー、ターミナル結果分類、ツール進行状況フォーマット/詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | 非推奨の Z.AI プロバイダー所有エンドポイント検出ファサード。Z.AI Plugin公開 API を使う |
    | `plugin-sdk/async-lock-runtime` | 小さなランタイム状態ファイル向けのプロセスローカル非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 制限付き非同期タスク並行実行ヘルパー |
    | `plugin-sdk/dedupe-runtime` | メモリ内重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | 送信保留配信のドレインヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルとメディアソースパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat ウェイク、イベント、可視性ヘルパー |
    | `plugin-sdk/number-runtime` | 数値強制変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | 安全なトークン/UUID ヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了待機ヘルパー |
    | `plugin-sdk/exec-approvals-runtime` | 広範な infra-runtime barrel なしの Exec 承認ポリシーファイルヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換 shim。上記の焦点化されたランタイムサブパスを使う |
    | `plugin-sdk/collection-runtime` | 小さな制限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされた fetch、プロキシ、EnvHttpProxyAgent オプション、固定 lookup ヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ/guarded-fetch インポートなしのディスパッチャー対応ランタイム fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 広範なメディアランタイムサーフェスなしのインライン画像データ URL サニタイザーとシグネチャ sniffing ヘルパー |
    | `plugin-sdk/response-limit-runtime` | 広範なメディアランタイムサーフェスなしの制限付きレスポンスボディリーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングやペアリングストアなしの現在の会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広範な設定書き込み/メンテナンスインポートなしのセッションストアヘルパー |
    | `plugin-sdk/sqlite-runtime` | データベースライフサイクル制御なしの、焦点化された SQLite エージェントスキーマ、パス、トランザクションヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広範な設定/セキュリティインポートなしのコンテキスト可視性解決と補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | markdown/ログインポートなしの狭い範囲のプリミティブレコード/文字列強制変換と正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名と SCP ホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | リトライ設定とリトライランナーヘルパー |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`、`resolveDefaultAgentDir`、非推奨の `resolveOpenClawAgentDir` 互換エクスポートを含む、エージェントディレクトリ/ID/ワークスペースヘルパー |
    | `plugin-sdk/directory-runtime` | 設定 backed ディレクトリクエリ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer`、非推奨の `fetchRemoteMedia` を含む共有メディア取得/変換/保存ヘルパー。URL を OpenClaw メディアにする必要がある場合は、バッファ読み取りより先に保存ヘルパーを優先する |
    | `plugin-sdk/media-mime` | 狭い MIME 正規化、ファイル拡張子マッピング、MIME 検出、メディア種別ヘルパー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` や `saveMediaStream` などの狭いメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、モデル欠落メッセージ |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型と、プロバイダー向けの画像/音声/構造化抽出ヘルパーエクスポート |
    | `plugin-sdk/text-chunking` | テキストと Markdown のチャンク化/レンダリングヘルパー、Markdown テーブル変換、ディレクティブタグ除去、安全なテキストユーティリティ |
    | `plugin-sdk/text-chunking` | 送信テキストのチャンク化ヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型と、プロバイダー向けのディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、音声ヘルパーエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-bootstrap-context` | 境界付きの `IDENTITY.md`、`USER.md`、`SOUL.md` コンテキスト注入用リアルタイムプロファイルブートストラップヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型、レジストリヘルパー、出力アクティビティ追跡を含む共有リアルタイム音声動作ヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型と、画像アセット/データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、レジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/transcripts` | 共有トランスクリプトソースプロバイダー型、レジストリヘルパー、セッション記述子、発話メタデータ |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリとルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | 非推奨の互換エイリアス。`plugin-sdk/webhook-ingress` を使用する |
    | `plugin-sdk/web-media` | 共有リモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | 非推奨の互換再エクスポート。`zod` から `zod` を直接インポートする |
    | `plugin-sdk/testing` | レガシー OpenClaw テスト向けのリポジトリローカルな非推奨互換バレル。新しいリポジトリテストでは、代わりに `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` などの焦点を絞ったローカルテストサブパスをインポートする |
    | `plugin-sdk/plugin-test-api` | リポジトリテストヘルパーブリッジをインポートせずに直接 Plugin 登録ユニットテストを行うための、リポジトリローカルな最小 `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト投影テスト向けの、リポジトリローカルなネイティブエージェントランタイムアダプター契約フィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション/セットアップ/ステータス契約、ディレクトリアサーション、アカウント起動ライフサイクル、送信設定スレッド化、ランタイムモック、ステータス問題、送信配信、フック登録向けの、リポジトリローカルなチャンネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャンネルテスト向けの、リポジトリローカルな共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/plugin-test-contracts` | リポジトリローカルな Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、インポート副作用契約ヘルパー |
    | `plugin-sdk/provider-test-contracts` | リポジトリローカルなプロバイダーランタイム、認証、検出、オンボード、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索/取得、ストリーム契約ヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けの、リポジトリローカルなオプトイン Vitest HTTP/認証モック |
    | `plugin-sdk/test-fixtures` | リポジトリローカルな汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、Skill ライター、エージェントメッセージ、システムイベント、モジュール再読み込み、バンドル Plugin パス、端末テキスト、チャンク化、認証トークン、型付きケースフィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest の `vi.mock("node:*")` ファクトリ内で使うための、リポジトリローカルで焦点を絞った Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="メモリのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | マネージャー/設定/ファイル/CLI ヘルパー向けのバンドル memory-core ヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-embedding-registry` | 軽量メモリ埋め込みプロバイダーレジストリヘルパー |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込み契約、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。このサーフェスの `registerMemoryEmbeddingProvider` は非推奨です。新しいプロバイダーには汎用埋め込みプロバイダー API を使用してください。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー |
    | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー |
    | `plugin-sdk/memory-core-host-events` | 非推奨の互換エイリアス。`plugin-sdk/memory-host-events` を使用する |
    | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホストコアランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | 非推奨の互換エイリアス。`plugin-sdk/memory-core-host-runtime-files` を使用する |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 Plugin 向けの共有管理 Markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | 検索マネージャーアクセス用 Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | 非推奨の互換エイリアス。`plugin-sdk/memory-core-host-status` を使用する |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーのサブパス">
    予約済みバンドルヘルパー SDK サブパスは、バンドル Plugin コード向けの狭いオーナー固有サーフェスです。パッケージビルドとエイリアスが決定的なままになるよう SDK インベントリで追跡されますが、一般的な Plugin 作成 API ではありません。新しい再利用可能なホスト契約では、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK サブパスを使用してください。

    | サブパス | オーナーと目的 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ユーザーの MCP サーバー設定を Codex アプリサーバーのスレッド設定へ投影するための、バンドル Codex Plugin ヘルパー |
    | `plugin-sdk/codex-native-task-runtime` | Codex アプリサーバーのネイティブサブエージェントを OpenClaw タスク状態へミラーリングするための、バンドル Codex Plugin ヘルパー |

  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
