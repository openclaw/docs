---
read_when:
    - Plugin インポートに適した plugin-sdk サブパスの選択
    - バンドルされたPluginのサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDK サブパスカタログ: どのインポートがどこにあるかを領域別に整理'
title: Plugin SDK のサブパス
x-i18n:
    generated_at: "2026-07-01T20:11:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK は、`openclaw/plugin-sdk/` 配下の狭い公開サブパスのセットとして公開されます。このページでは、よく使われるサブパスを目的別に分類して一覧化します。生成されたコンパイラエントリポイントのインベントリは `scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト用/内部用サブパスを差し引いた後の公開サブセットです。メンテナーは、公開エクスポート数を `pnpm plugin-sdk:surface` で、アクティブな予約済みヘルパーサブパスを `pnpm plugins:boundary-report:summary` で監査できます。未使用の予約済みヘルパーエクスポートは、休眠状態の互換性負債として公開 SDK に残るのではなく、CI レポートで失敗します。

Plugin 作成ガイドについては、[Plugin SDK 概要](/ja-JP/plugins/sdk-overview)を参照してください。

## Plugin エントリ

| サブパス                       | 主なエクスポート                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` などのマイグレーションプロバイダー項目ヘルパー、理由定数、項目ステータスマーカー、墨消しヘルパー、`summarizeMigrationItems`                     |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`、`writeMigrationReport` などのランタイムマイグレーションヘルパー                                          |
| `plugin-sdk/health`            | バンドルされたヘルスコンシューマー向けの Doctor ヘルスチェック登録、検出、修復、選択、重大度、検出事項型                                                              |

### 非推奨の互換性ヘルパーとテストヘルパー

非推奨のサブパスは古い Plugin 向けにエクスポートされたままですが、新しいコードでは以下の焦点を絞った SDK サブパスを使用する必要があります。保守されている一覧は `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` です。CI はそこからのバンドル本番インポートを拒否します。`compat`、`config-types`、`infra-runtime`、`text-runtime`、`zod` などの広範なバレルは互換性専用です。`zod` は `zod` から直接インポートしてください。

OpenClaw の Vitest ベースのテストヘルパーサブパスはリポジトリローカル専用であり、現在はパッケージエクスポートではありません: `agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks`、`testing`。

### 予約済みのバンドル Plugin ヘルパーサブパス

これらのサブパスは、汎用 SDK API ではなく、それを所有するバンドル Plugin のための Plugin 所有の互換性サーフェスです: `plugin-sdk/codex-mcp-projection` と `plugin-sdk/codex-native-task-runtime`。所有者をまたぐ拡張機能インポートは、パッケージ契約のガードレールによってブロックされます。

<AccordionGroup>
  <Accordion title="チャネルサブパス">
    | サブパス | 主要エクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマエクスポート (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin 所有スキーマ向けのキャッシュ付き JSON Schema 検証ヘルパー |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、加えて `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、セットアップトランスレーター、許可リストプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 非推奨の互換エイリアス。`plugin-sdk/setup-runtime` を使用してください |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 狭いアカウントリスト/アカウントアクションヘルパー |
    | `plugin-sdk/access-groups` | アクセスグループ許可リスト解析と墨消し済みグループ診断ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有チャネル設定スキーマプリミティブと、Zod および直接 JSON/TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | 保守対象のバンドル済み Plugin 専用の、バンドル済み OpenClaw チャネル設定スキーマ |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。バンドル済み/公式チャットチャネル ID の正規値と、自前の表をハードコードせずにエンベロープ接頭辞付きテキストを認識する必要がある Plugin 向けのフォーマッターラベル/エイリアス。 |
    | `plugin-sdk/channel-config-schema-legacy` | バンドル済みチャネル設定スキーマ向けの非推奨互換エイリアス |
    | `plugin-sdk/telegram-command-config` | バンドル契約フォールバック付きの Telegram カスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 狭いコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 非推奨の低レベルチャネル受信互換ファサード。新しい受信パスは `plugin-sdk/channel-ingress-runtime` を使用してください。 |
    | `plugin-sdk/channel-ingress-runtime` | 移行済みチャネル受信パス向けの実験的な高レベルチャネル受信ランタイムリゾルバーとルートファクトビルダー。各 Plugin で有効な許可リスト、コマンド許可リスト、レガシープロジェクションを組み立てるよりも、こちらを優先してください。[チャネル受信 API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。 |
    | `plugin-sdk/channel-lifecycle` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-outbound` | メッセージライフサイクル契約に加えて、返信パイプラインオプション、受領、ライブプレビュー/ストリーミング、ライフサイクルヘルパー、送信元 ID、ペイロード計画、永続送信、メッセージ送信コンテキストヘルパー。[チャネル送信 API](/ja-JP/plugins/sdk-channel-outbound) を参照してください。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 向けの非推奨互換エイリアスとレガシー返信ディスパッチファサード。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 向けの非推奨互換エイリアスとレガシー返信ディスパッチファサード。 |
    | `plugin-sdk/inbound-envelope` | 共有受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 非推奨の互換ファサード。受信ランナーとディスパッチ述語には `plugin-sdk/channel-inbound` を、メッセージ配信ヘルパーには `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析エイリアス。`plugin-sdk/channel-targets` を使用してください |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みとホスト済みメディア状態ヘルパー |
    | `plugin-sdk/outbound-send-deps` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/outbound-runtime` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/poll-runtime` | 狭い投票正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルとアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャネルステータススナップショット/要約ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 狭いチャネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャネル Plugin プレリュードエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換ファサード。`plugin-sdk/channel-inbound` を使用してください。 |
    | `plugin-sdk/direct-dm-guard-policy` | 狭い直接 DM 暗号化前ガードポリシーヘルパー |
    | `plugin-sdk/discord` | 公開済み `@openclaw/discord@2026.3.13` と追跡対象オーナー互換性向けの非推奨 Discord 互換ファサード。新しい Plugin は汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/telegram-account` | 追跡対象オーナー互換性向けの非推奨 Telegram アカウント解決互換ファサード。新しい Plugin は注入されたランタイムヘルパーまたは汎用チャネル SDK サブパスを使用してください |
    | `plugin-sdk/zalouser` | 送信者コマンド認可をまだインポートしている公開済み Lark/Zalo パッケージ向けの非推奨 Zalo Personal 互換ファサード。新しい Plugin は `plugin-sdk/command-auth` を使用してください |
    | `plugin-sdk/interactive-runtime` | セマンティックメッセージプレゼンテーション、配信、レガシー対話型返信ヘルパー。[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください |
    | `plugin-sdk/channel-inbound` | イベント分類、コンテキスト構築、フォーマット、ルート、デバウンス、メンション照合、メンションポリシー、受信ログ向けの共有受信ヘルパー |
    | `plugin-sdk/channel-inbound-debounce` | 狭い受信デバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | 広い受信ランタイムサーフェスを含まない、狭いメンションポリシー、メンションマーカー、メンションテキストヘルパー |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 非推奨の互換ファサード。`plugin-sdk/channel-inbound` または `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-pairing-paths` | 非推奨の互換ファサード。`plugin-sdk/channel-pairing` を使用してください。 |
    | `plugin-sdk/channel-reply-options-runtime` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-streaming` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャネルメッセージアクションヘルパーと、Plugin 互換性のために保持されている非推奨のネイティブスキーマヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動ターゲット解決、スレッド ID 文字列化、重複排除/コンパクトルートキー、解析済みターゲット型、ルート/ターゲット比較ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析ヘルパー。ルート比較の呼び出し元は `plugin-sdk/channel-route` を使用してください |
    | `plugin-sdk/channel-contract` | チャネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、シークレットターゲット型などの狭いシークレット契約ヘルパー |
  </Accordion>

非推奨のチャネルヘルパーファミリーは、公開済み Plugin との互換性のためにのみ利用可能なままです。削除計画は次のとおりです。外部 Plugin 移行期間中は維持し、リポジトリ/バンドル済み Plugin は `channel-inbound` と `channel-outbound` に維持し、その後次のメジャー SDK クリーンアップで互換サブパスを削除します。これは、古いチャネルメッセージ/ランタイム、チャネルストリーミング、直接 DM アクセス、受信ヘルパー分岐、返信オプション、ペアリングパスの各ファミリーに適用されます。

  <Accordion title="プロバイダーのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムモデル準備のためにサポートされる LM Studio プロバイダーファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーのデフォルト、モデル検出、リクエストヘッダー、読み込み済みモデルヘルパーのためにサポートされる LM Studio ランタイムファサード |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型プロバイダーセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換のセルフホスト型プロバイダーセットアップに特化したヘルパー |
    | `plugin-sdk/cli-backend` | CLIバックエンドのデフォルト + ウォッチドッグ定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダープラグイン向けのランタイム APIキー解決ヘルパー |
    | `plugin-sdk/provider-oauth-runtime` | 汎用プロバイダー OAuth コールバック型、コールバックページレンダリング、PKCE/状態ヘルパー、認可入力解析、トークン有効期限ヘルパー、中止ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの APIキーオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 認証結果ビルダー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証の環境変数検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 認証インポートヘルパー、非推奨の `resolveOpenClawAgentDir` 互換エクスポート |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、共有モデルID正規化ヘルパー |
    | `plugin-sdk/provider-catalog-live-runtime` | 保護された `/models` 形式の検出向けライブプロバイダーモデルカタログヘルパー: `buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、モデルIDフィルタリング、TTLキャッシュ、静的フォールバック |
    | `plugin-sdk/provider-catalog-runtime` | プロバイダーカタログ拡張ランタイムフックと、コントラクトテスト向けプラグインプロバイダーレジストリ境界 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダー HTTP/エンドポイント機能ヘルパー、プロバイダー HTTP エラー、音声文字起こしの multipart フォームヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの狭い web-fetch 設定/選択コントラクトヘルパー |
    | `plugin-sdk/provider-web-fetch` | Web-fetch プロバイダー登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | プラグイン有効化配線を必要としないプロバイダー向けの狭い web-search 設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター/ゲッターなどの狭い web-search 設定/認証情報コントラクトヘルパー |
    | `plugin-sdk/provider-web-search` | Web-search プロバイダー登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)`、`listEmbeddingProviders(...)` などを含む汎用埋め込みプロバイダー型と読み取りヘルパー。プラグインは `api.registerEmbeddingProvider(...)` を通じてプロバイダーを登録するため、マニフェストの所有権が強制されます |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek/Gemini/OpenAI スキーマクリーンアップ + 診断 |
    | `plugin-sdk/provider-usage` | プロバイダー使用量スナップショット型、共有使用量取得ヘルパー、`fetchClaudeUsage` などのプロバイダーフェッチャー |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、プレーンテキストツール呼び出し互換、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`、Anthropic/DeepSeek/OpenAI互換ストリームユーティリティを含む公開共有プロバイダーストリームラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | 保護付き fetch、ツール結果テキスト抽出、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルのシングルトン/マップ/キャッシュヘルパー |
    | `plugin-sdk/group-activation` | 狭いグループアクティベーションモードとコマンド解析ヘルパー |
  </Accordion>

プロバイダー使用量スナップショットは通常、1つ以上のクォータ `windows` を報告します。それぞれにラベル、使用率、任意のリセット時刻が含まれます。リセット可能なクォータウィンドウではなく、残高やアカウント状態のテキストを公開するプロバイダーは、割合を捏造するのではなく、空の `windows` 配列を持つ `summary` を返すべきです。OpenClaw はそのサマリーテキストをステータス出力に表示します。`error` は、使用量エンドポイントが失敗した場合、または利用可能な使用量データを返さなかった場合にのみ使用してください。

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、動的引数メニュー整形を含むコマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決と同一チャットアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より狭いアダプター/Gateway 境界を優先してください |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット、アカウントバインディング、ルートゲート、転送フォールバック、ローカルネイティブ exec プロンプト抑制ヘルパー |
    | `plugin-sdk/approval-reaction-runtime` | ハードコードされた承認リアクションバインディング、リアクションプロンプトペイロード、リアクションターゲットストア、ローカルネイティブ exec プロンプト抑制の互換エクスポート |
    | `plugin-sdk/approval-reply-runtime` | Exec/プラグイン承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | Exec/プラグイン承認ペイロードヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、`formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 狭い受信返信重複排除リセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広範なテストバレルを使わない狭いチャネルコントラクトテストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニュー整形、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットチャネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文正規化とコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | プライベートチャネルと Web UI デバイスコードペアリング向けの遅延プロバイダー認証ログインフローヘルパー |
    | `plugin-sdk/channel-secret-runtime` | チャネル/プラグインシークレットサーフェス向けの狭いシークレットコントラクト収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレットコントラクト/設定解析向けの狭い `coerceSecretRef` と SecretRef 型付けヘルパー |
    | `plugin-sdk/secret-provider-integration` | 外部シークレットプロバイダープリセットを公開するプラグイン向けの型専用 SecretRef プロバイダー統合マニフェストとプリセットコントラクト |
    | `plugin-sdk/security-runtime` | 信頼、DM ゲート、作成専用書き込みを含むルート境界付きファイル/パスヘルパー、同期/非同期アトミックファイル置換、兄弟一時書き込み、クロスデバイス移動フォールバック、プライベートファイルストアヘルパー、シンボリックリンク親ガード、外部コンテンツ、機微テキストの編集、定数時間シークレット比較、シークレット収集ヘルパーの共有ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストとプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範なインフラランタイムサーフェスを使わない狭い固定ディスパッチャーヘルパー |
    | `plugin-sdk/ssrf-runtime` | 固定ディスパッチャー、SSRF保護付き fetch、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパーと raw websocket/body 強制変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主要エクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム/ロギング/バックアップ/Plugin インストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭いランタイム env、ロガー、タイムアウト、リトライ、バックオフヘルパー |
    | `plugin-sdk/browser-config` | 正規化されたプロファイル/デフォルト、CDP URL 解析、ブラウザー制御認証ヘルパー用のサポート対象ブラウザー設定ファサード |
    | `plugin-sdk/agent-harness-task-runtime` | ホスト発行のタスクスコープを使用するハーネス支援エージェント向けの汎用タスクライフサイクルおよび完了配信ヘルパー |
    | `plugin-sdk/codex-mcp-projection` | ユーザーの MCP サーバー設定を Codex スレッド設定へ投影するための予約済みバンドル Codex ヘルパー。サードパーティ Plugin 用ではありません |
    | `plugin-sdk/codex-native-task-runtime` | ネイティブタスクミラー/ランタイム配線用のプライベートなバンドル Codex ヘルパー。サードパーティ Plugin 用ではありません |
    | `plugin-sdk/channel-runtime-context` | 汎用チャンネルランタイムコンテキストの登録および検索ヘルパー |
    | `plugin-sdk/matrix` | 古いサードパーティチャンネルパッケージ向けの非推奨 Matrix 互換ファサード。新しい Plugin は `plugin-sdk/run-command` を直接インポートしてください |
    | `plugin-sdk/mattermost` | 古いサードパーティチャンネルパッケージ向けの非推奨 Mattermost 互換ファサード。新しい Plugin は汎用 SDK サブパスを直接インポートしてください |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有 Plugin コマンド/フック/http/インタラクティブヘルパー |
    | `plugin-sdk/hook-runtime` | 共有 Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` などの遅延ランタイムインポート/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス exec ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI フォーマット、待機、バージョン、引数呼び出し、遅延コマンドグループヘルパー |
    | `plugin-sdk/qa-live-transport-scenarios` | 共有ライブトランスポート QA シナリオ ID、ベースラインカバレッジヘルパー、シナリオ選択ヘルパー |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言する Plugin HTTP ルート向けの予約済み Gateway メソッドディスパッチヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアント、イベントループ準備済みクライアント開始ヘルパー、Gateway CLI RPC、Gateway プロトコルエラー、広告された LAN ホスト解決、チャンネルステータスパッチヘルパー |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` やチャンネル/プロバイダー設定型などの Plugin 設定形状向けの、型専用に絞った設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject` などのランタイム Plugin 設定検索ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated` などのトランザクション型設定変更ヘルパー |
    | `plugin-sdk/message-tool-delivery-hints` | 共有メッセージツール配信メタデータヒント文字列 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テストスナップショットセッターなどの現在プロセス設定スナップショットヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドルされた Telegram 契約サーフェスが利用できない場合でも使える、Telegram コマンド名/説明の正規化と重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広範な text バレルを使わないファイル参照自動リンク検出 |
    | `plugin-sdk/approval-reaction-runtime` | ハードコードされた承認リアクションバインディング、リアクションプロンプトペイロード、リアクションターゲットストア、ローカルネイティブ exec プロンプト抑制用の互換エクスポート |
    | `plugin-sdk/approval-runtime` | Exec/Plugin 承認ヘルパー、承認機能ビルダー、認証/プロファイルヘルパー、ネイティブルーティング/ランタイムヘルパー、構造化承認表示パスフォーマット |
    | `plugin-sdk/reply-runtime` | 共有インバウンド/返信ランタイムヘルパー、チャンク化、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い返信ディスパッチ/完了処理と会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | 共有短時間ウィンドウ返信履歴ヘルパー。新しいメッセージターンコードは `createChannelHistoryWindow` を使用してください。低レベルのマップヘルパーは非推奨の互換エクスポートとしてのみ残ります |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いテキスト/Markdown チャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションワークフローヘルパー（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、セッション ID による制限付きの最近のユーザー/アシスタント転写テキスト読み取り、レガシーセッションストアパス/セッションキーヘルパー、更新日時読み取り、移行時のみのストア全体/ファイルパス互換ヘルパー |
    | `plugin-sdk/session-transcript-runtime` | 転写 ID、スコープ付きターゲット/読み取り/書き込みヘルパー、更新公開、書き込みロック、転写メモリヒットキー |
    | `plugin-sdk/sqlite-runtime` | ファーストパーティランタイム向けの、絞り込まれた SQLite エージェントスキーマ、パス、トランザクションヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cron ストアのパス/読み込み/保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/plugin-state-runtime` | Plugin サイドカー SQLite キー付き状態型に加え、Plugin 所有データベース向けの集中接続 pragma と WAL メンテナンス設定 |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャンネル/アカウントステータス概要ヘルパー、ランタイム状態デフォルト、Issue メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | スラッグ/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout/stderr 結果を返すタイムアウト付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLI パラメーターリーダー |
    | `plugin-sdk/tool-plugin` | シンプルな型付きエージェントツール Plugin を定義し、マニフェスト生成用の静的メタデータを公開 |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化されたペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から標準の送信先フィールドを抽出 |
    | `plugin-sdk/sandbox` | サンドボックスバックエンド型と SSH/OpenShell コマンドヘルパー。フェイルファスト exec コマンド事前チェックを含む |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパーとプライベートな安全一時ワークスペース |
    | `plugin-sdk/logging-core` | サブシステムロガーとリダクションヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードと変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` や `resolveAgentMaxConcurrent` などのモデル/セッション上書きヘルパー |
    | `plugin-sdk/talk-config-runtime` | Talk プロバイダー設定解決ヘルパー |
    | `plugin-sdk/json-store` | 小さな JSON 状態読み取り/書き込みヘルパー |
    | `plugin-sdk/json-unsafe-integers` | 安全でない整数リテラルを文字列として保持する JSON 解析ヘルパー |
    | `plugin-sdk/file-lock` | 再入可能なファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスク支援の重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP ランタイム/セッションおよび返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時読み込み Plugin 向けの軽量 ACP バックエンド登録および返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動インポートを伴わない読み取り専用 ACP バインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 狭いエージェントランタイム設定スキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩い真偽値パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険な名前のマッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスブートストラップとペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャンネル、ステータス、アンビエントプロキシヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skill コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリ/ビルド/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的な信頼済み Plugin サーフェス: ハーネス型、アクティブ実行の誘導/中止ヘルパー、OpenClaw ツールブリッジヘルパー、ランタイムプランツールポリシーヘルパー、終端結果分類、ツール進捗フォーマット/詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | 非推奨の Z.AI プロバイダー所有エンドポイント検出ファサード。Z.AI Plugin 公開 API を使用してください |
    | `plugin-sdk/async-lock-runtime` | 小さなランタイム状態ファイル向けのプロセスローカル非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャンネルアクティビティテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 制限付き非同期タスク同時実行ヘルパー |
    | `plugin-sdk/dedupe-runtime` | メモリ内重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | アウトバウンド保留配信ドレインヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルおよびメディアソースパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat ウェイク、イベント、可視性ヘルパー |
    | `plugin-sdk/number-runtime` | 数値強制変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | 安全なトークン/UUID ヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了待機ヘルパー |
    | `plugin-sdk/exec-approvals-runtime` | 広範な infra-runtime バレルを使わない exec 承認ポリシーファイルヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換 shim。上記の絞り込まれたランタイムサブパスを使用してください |
    | `plugin-sdk/collection-runtime` | 小さな制限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップされた fetch、プロキシ、EnvHttpProxyAgent オプション、固定ルックアップヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ/ガード付き fetch インポートを伴わない、ディスパッチャー対応ランタイム fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 広範なメディアランタイムサーフェスを使わない、インライン画像データ URL サニタイザーと署名スニッフィングヘルパー |
    | `plugin-sdk/response-limit-runtime` | 広範なメディアランタイムサーフェスを使わない、制限付きレスポンス本文リーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングやペアリングストアを伴わない、現在の会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広範な設定書き込み/メンテナンスインポートを伴わないセッションストアヘルパー |
    | `plugin-sdk/sqlite-runtime` | データベースライフサイクル制御を伴わない、絞り込まれた SQLite エージェントスキーマ、パス、トランザクションヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広範な設定/セキュリティインポートを伴わない、コンテキスト可視性解決と補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/ロギングインポートを伴わない、狭いプリミティブレコード/文字列強制変換と正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名と SCP ホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | リトライ設定とリトライランナーヘルパー |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`、`resolveDefaultAgentDir`、非推奨の `resolveOpenClawAgentDir` 互換エクスポートを含む、エージェントディレクトリ/ID/ワークスペースヘルパー |
    | `plugin-sdk/directory-runtime` | 設定支援のディレクトリクエリ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer`、非推奨の `fetchRemoteMedia` を含む共有メディア取得/変換/保存ヘルパー。URL を OpenClaw メディアにする必要がある場合は、バッファ読み取りより先に保存ヘルパーを優先してください |
    | `plugin-sdk/media-mime` | MIME の正規化、ファイル拡張子マッピング、MIME 検出、メディア種別ヘルパー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` や `saveMediaStream` などの限定的なメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、モデル欠落メッセージ |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型と、プロバイダー向けの画像/音声/構造化抽出ヘルパーのエクスポート |
    | `plugin-sdk/text-chunking` | テキストと Markdown のチャンク化/レンダリングヘルパー、Markdown テーブル変換、ディレクティブタグ除去、安全なテキストユーティリティ |
    | `plugin-sdk/text-chunking` | 送信テキストのチャンク化ヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型と、プロバイダー向けディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーのエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、音声ヘルパーのエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-bootstrap-context` | 境界付きの `IDENTITY.md`、`USER.md`、`SOUL.md` コンテキスト注入用リアルタイムプロファイルブートストラップヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型、レジストリヘルパー、出力アクティビティ追跡を含む共有リアルタイム音声動作ヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型と、画像アセット/データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、レジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/transcripts` | 共有文字起こしソースプロバイダー型、レジストリヘルパー、セッション記述子、発話メタデータ |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリとルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | 非推奨の互換エイリアス。`plugin-sdk/webhook-ingress` を使用してください |
    | `plugin-sdk/web-media` | 共有リモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | 非推奨の互換再エクスポート。`zod` から `zod` を直接インポートしてください |
    | `plugin-sdk/testing` | レガシー OpenClaw テスト向けのリポジトリローカルの非推奨互換バレル。新しいリポジトリテストでは、代わりに `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` など、焦点を絞ったローカルテスト用サブパスをインポートしてください |
    | `plugin-sdk/plugin-test-api` | リポジトリのテストヘルパーブリッジをインポートせずに直接 Plugin 登録ユニットテストを行うための、リポジトリローカルの最小 `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、文字起こし投影テスト向けの、リポジトリローカルのネイティブエージェントランタイムアダプター契約フィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション/セットアップ/ステータス契約、ディレクトリアサーション、アカウント起動ライフサイクル、送信設定スレッド化、ランタイムモック、ステータス問題、送信配信、フック登録向けの、リポジトリローカルのチャネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャネルテスト向けのリポジトリローカル共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/plugin-test-contracts` | リポジトリローカルの Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、インポート副作用契約ヘルパー |
    | `plugin-sdk/provider-test-contracts` | リポジトリローカルのプロバイダーランタイム、認証、検出、オンボード、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索/取得、ストリーム契約ヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けの、リポジトリローカルのオプトイン Vitest HTTP/認証モック |
    | `plugin-sdk/test-fixtures` | リポジトリローカルの汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、スキルライター、エージェントメッセージ、システムイベント、モジュール再読み込み、バンドル済み Plugin パス、端末テキスト、チャンク化、認証トークン、型付きケースフィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` ファクトリ内で使用する、リポジトリローカルの焦点を絞った Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="メモリのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | マネージャー/設定/ファイル/CLI ヘルパー向けのバンドル済み memory-core ヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-embedding-registry` | 軽量メモリ埋め込みプロバイダーレジストリヘルパー |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンのエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込み契約、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。このサーフェス上の `registerMemoryEmbeddingProvider` は非推奨です。新しいプロバイダーでは汎用埋め込みプロバイダー API を使用してください。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンのエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンのエクスポート |
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
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 Plugin 向けの共有管理 Markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | 検索マネージャーアクセス向けの Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | 非推奨の互換エイリアス。`plugin-sdk/memory-core-host-status` を使用してください |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーのサブパス">
    予約済みのバンドルヘルパー SDK サブパスは、バンドル済み Plugin コード向けの限定的な所有者固有サーフェスです。これらは SDK インベントリで追跡されるため、パッケージビルドとエイリアス化は決定的に保たれますが、一般的な Plugin 作成 API ではありません。新しい再利用可能なホスト契約には、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK サブパスを使用してください。

    | サブパス | 所有者と目的 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ユーザーの MCP サーバー設定を Codex app-server スレッド設定に投影するための、バンドル済み Codex Plugin ヘルパー |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server ネイティブサブエージェントを OpenClaw タスク状態にミラーリングするための、バンドル済み Codex Plugin ヘルパー |

  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
