---
read_when:
    - Plugin インポートに適した plugin-sdk サブパスの選択
    - バンドル済み Plugin のサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDK サブパスカタログ: どのインポートがどこにあるかを領域別にまとめたもの'
title: Plugin SDK サブパス
x-i18n:
    generated_at: "2026-07-04T10:27:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

プラグイン SDK は、`openclaw/plugin-sdk/` 配下の狭い公開サブパスのセットとして公開されています。このページでは、よく使われるサブパスを目的別にまとめています。生成されたコンパイラエントリポイントのインベントリは `scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に一覧されたリポジトリローカルのテスト用/内部用サブパスを差し引いた後の公開サブセットです。メンテナーは、公開エクスポート数を `pnpm plugin-sdk:surface` で、アクティブな予約済みヘルパーサブパスを `pnpm plugins:boundary-report:summary` で監査できます。未使用の予約済みヘルパーエクスポートは、休眠状態の互換性負債として公開 SDK に残るのではなく、CI レポートで失敗します。

プラグイン作成ガイドについては、[Plugin SDK 概要](/ja-JP/plugins/sdk-overview)を参照してください。

## Plugin エントリ

| サブパス                       | 主なエクスポート                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` などの移行プロバイダー項目ヘルパー、理由定数、項目ステータスマーカー、リダクションヘルパー、`summarizeMigrationItems`                           |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime`、`writeMigrationReport` などのランタイム移行ヘルパー                     |
| `plugin-sdk/health`            | バンドルされたヘルスコンシューマー向けの Doctor ヘルスチェック登録、検出、修復、選択、重大度、検出事項の型                                                           |

### 非推奨の互換性ヘルパーとテストヘルパー

非推奨のサブパスは古いプラグイン向けにエクスポートされたままですが、新しいコードでは以下の焦点を絞った SDK サブパスを使用してください。メンテナンスされている一覧は `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` です。CI は、そこからのバンドル済み本番インポートを拒否します。`compat`、`config-types`、`infra-runtime`、`text-runtime`、`zod` などの広範なバレルは互換性専用です。`zod` は `zod` から直接インポートしてください。

OpenClaw の Vitest ベースのテストヘルパーサブパスはリポジトリローカル専用であり、現在はパッケージエクスポートではありません: `agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks`、`testing`。

### 予約済みバンドル済みプラグインヘルパーサブパス

これらのサブパスは、一般的な SDK API ではなく、それぞれを所有するバンドル済みプラグイン向けの、プラグイン所有の互換性サーフェスです: `plugin-sdk/codex-mcp-projection` と `plugin-sdk/codex-native-task-runtime`。所有者をまたぐ拡張機能のインポートは、パッケージ契約のガードレールによってブロックされます。

<AccordionGroup>
  <Accordion title="Channel サブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` の Zod スキーマエクスポート (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin 所有スキーマ向けのキャッシュ済み JSON Schema 検証ヘルパー |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、セットアップトランスレーター、許可リストプロンプト、セットアップ状態ビルダー |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 非推奨の互換エイリアス。`plugin-sdk/setup-runtime` を使用してください |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 限定的なアカウントリスト/アカウントアクションヘルパー |
    | `plugin-sdk/access-groups` | アクセスグループ許可リストの解析と編集済みグループ診断ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有 Channel 設定スキーマプリミティブ、および Zod と直接 JSON/TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | 保守中のバンドル済み Plugin 専用の、バンドル済み OpenClaw Channel 設定スキーマ |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`。独自のテーブルをハードコードせずにエンベロープ接頭辞付きテキストを認識する必要がある Plugin 向けの、正規のバンドル済み/公式チャット Channel ID とフォーマッターラベル/エイリアス。 |
    | `plugin-sdk/channel-config-schema-legacy` | bundled-channel 設定スキーマの非推奨互換エイリアス |
    | `plugin-sdk/telegram-command-config` | バンドル契約フォールバック付きの Telegram カスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 限定的なコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 非推奨の低レベル Channel ingress 互換ファサード。新しい受信パスでは `plugin-sdk/channel-ingress-runtime` を使用してください。 |
    | `plugin-sdk/channel-ingress-runtime` | 移行済み Channel 受信パス向けの実験的な高レベル Channel ingress ランタイムリゾルバーとルートファクトビルダー。各 Plugin で有効な許可リスト、コマンド許可リスト、レガシープロジェクションを組み立てるより、これを優先してください。[Channel ingress API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。 |
    | `plugin-sdk/channel-lifecycle` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-outbound` | メッセージライフサイクル契約、および返信パイプラインオプション、受信証、ライブプレビュー/ストリーミング、ライフサイクルヘルパー、送信元アイデンティティ、ペイロード計画、永続送信、メッセージ送信コンテキストヘルパー。[Channel outbound API](/ja-JP/plugins/sdk-channel-outbound) を参照してください。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` の非推奨互換エイリアス、およびレガシー返信ディスパッチファサード。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` の非推奨互換エイリアス、およびレガシー返信ディスパッチファサード。 |
    | `plugin-sdk/inbound-envelope` | 共有インバウンドルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 非推奨の互換ファサード。インバウンドランナーとディスパッチ述語には `plugin-sdk/channel-inbound` を、メッセージ配信ヘルパーには `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析エイリアス。`plugin-sdk/channel-targets` を使用してください |
    | `plugin-sdk/outbound-media` | 共有アウトバウンドメディア読み込みとホスト済みメディア状態ヘルパー |
    | `plugin-sdk/outbound-send-deps` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/outbound-runtime` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/poll-runtime` | 限定的な poll 正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルとアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | ランタイム設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有 Channel 状態スナップショット/要約ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 限定的な Channel 設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | Channel 設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有 Channel Plugin プリリュードエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換ファサード。`plugin-sdk/channel-inbound` を使用してください。 |
    | `plugin-sdk/direct-dm-guard-policy` | 限定的な direct-DM 暗号化前ガードポリシーヘルパー |
    | `plugin-sdk/discord` | 公開済み `@openclaw/discord@2026.3.13` と追跡対象オーナー互換性のための、非推奨の Discord 互換ファサード。新しい Plugin は汎用 Channel SDK サブパスを使用してください |
    | `plugin-sdk/telegram-account` | 追跡対象オーナー互換性のための、非推奨の Telegram アカウント解決互換ファサード。新しい Plugin は注入されたランタイムヘルパーまたは汎用 Channel SDK サブパスを使用してください |
    | `plugin-sdk/zalouser` | 送信者コマンド認可をまだインポートしている公開済み Lark/Zalo パッケージ向けの、非推奨の Zalo Personal 互換ファサード。新しい Plugin は `plugin-sdk/command-auth` を使用してください |
    | `plugin-sdk/interactive-runtime` | セマンティックなメッセージ提示、配信、レガシーインタラクティブ返信ヘルパー。[Message Presentation](/ja-JP/plugins/message-presentation) を参照してください |
    | `plugin-sdk/channel-inbound` | イベント分類、コンテキスト構築、整形、ルート、デバウンス、メンション照合、メンションポリシー、インバウンドログ向けの共有インバウンドヘルパー |
    | `plugin-sdk/channel-inbound-debounce` | 限定的なインバウンドデバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広いインバウンドランタイムサーフェスを含まない、限定的なメンションポリシー、メンションマーカー、メンションテキストヘルパー |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 非推奨の互換ファサード。`plugin-sdk/channel-inbound` または `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-pairing-paths` | 非推奨の互換ファサード。`plugin-sdk/channel-pairing` を使用してください。 |
    | `plugin-sdk/channel-reply-options-runtime` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-streaming` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | Channel メッセージアクションヘルパー、および Plugin 互換性のために保持されている非推奨のネイティブスキーマヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動のターゲット解決、スレッド ID 文字列化、重複排除/コンパクトなルートキー、解析済みターゲット型、ルート/ターゲット比較ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析ヘルパー。ルート比較の呼び出し元は `plugin-sdk/channel-route` を使用してください |
    | `plugin-sdk/channel-contract` | Channel 契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`、シークレットターゲット型などの限定的なシークレット契約ヘルパー |
  </Accordion>

非推奨の Channel ヘルパーファミリーは、公開済み Plugin との
互換性のためにのみ引き続き利用できます。削除計画は次のとおりです。
外部 Plugin の移行期間中は保持し、リポジトリ/バンドル済み Plugin は
`channel-inbound` と `channel-outbound` 上に維持し、その後、次のメジャー
SDK クリーンアップで互換サブパスを削除します。これは、古い Channel
message/runtime、Channel streaming、direct-DM access、inbound helper
splinter、reply-options、pairing-path ファミリーに適用されます。

  <Accordion title="Provider subpaths">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムモデル準備用の、サポート対象 LM Studio プロバイダーファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーのデフォルト、モデル検出、リクエストヘッダー、読み込み済みモデルヘルパー用の、サポート対象 LM Studio ランタイムファサード |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型プロバイダーのセットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホスト型プロバイダー向けに絞ったセットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドのデフォルト + watchdog 定数 |
    | `plugin-sdk/provider-auth-runtime` | プロバイダーPlugin向けのランタイム API キー解決ヘルパー |
    | `plugin-sdk/provider-oauth-runtime` | 汎用プロバイダー OAuth コールバック型、コールバックページのレンダリング、PKCE/state ヘルパー、認可入力の解析、トークン有効期限ヘルパー、中断ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キーオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 認証結果ビルダー |
    | `plugin-sdk/provider-env-vars` | プロバイダー認証の環境変数検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex 認証インポートヘルパー、非推奨の `resolveOpenClawAgentDir` 互換エクスポート |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、共有モデル ID 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-live-runtime` | ガード付き `/models` 形式検出向けのライブプロバイダーモデルカタログヘルパー: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, モデル ID フィルタリング、TTL キャッシュ、静的フォールバック |
    | `plugin-sdk/provider-catalog-runtime` | プロバイダーカタログ拡張ランタイムフックと、契約テスト向けの Plugin プロバイダーレジストリ境界 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用プロバイダー HTTP/エンドポイント機能ヘルパー、プロバイダー HTTP エラー、音声文字起こしの multipart form ヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの、絞り込まれた web-fetch 設定/選択契約ヘルパー |
    | `plugin-sdk/provider-web-fetch` | web-fetch プロバイダーの登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 有効化の配線を必要としないプロバイダー向けの、絞り込まれた web-search 設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, スコープ付き認証情報 setter/getter などの、絞り込まれた web-search 設定/認証情報契約ヘルパー |
    | `plugin-sdk/provider-web-search` | web-search プロバイダーの登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, `listEmbeddingProviders(...)` を含む汎用埋め込みプロバイダー型と読み取りヘルパー。Plugin は `api.registerEmbeddingProvider(...)` を通じてプロバイダーを登録するため、マニフェスト所有権が強制される |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, DeepSeek/Gemini/OpenAI スキーマクリーンアップ + 診断 |
    | `plugin-sdk/provider-usage` | プロバイダー使用量スナップショット型、共有使用量取得ヘルパー、`fetchClaudeUsage` などのプロバイダー取得関数 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、プレーンテキストツール呼び出し互換、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, Anthropic/DeepSeek/OpenAI 互換ストリームユーティリティを含む公開共有プロバイダーストリームラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | ガード付き fetch、ツール結果テキスト抽出、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルの singleton/map/cache ヘルパー |
    | `plugin-sdk/group-activation` | 絞り込まれたグループ有効化モードとコマンド解析ヘルパー |
  </Accordion>

プロバイダー使用量スナップショットは通常、1 つ以上のクォータ `windows` を報告し、それぞれにラベル、使用率、任意のリセット時刻を含めます。リセット可能なクォータウィンドウではなく残高やアカウント状態テキストを公開するプロバイダーは、割合を作り上げるのではなく、空の `windows` 配列とともに `summary` を返すべきです。OpenClaw はその要約テキストをステータス出力に表示します。`error` は、使用量エンドポイントが失敗した場合、または利用可能な使用量データを返さなかった場合にのみ使用してください。

  <Accordion title="Auth and security subpaths">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 動的引数メニュー整形を含むコマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決と同一チャットアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より絞り込まれた adapter/gateway 境界を優先 |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット、アカウントバインディング、ルートゲート、転送フォールバック、ローカルネイティブ exec プロンプト抑制ヘルパー |
    | `plugin-sdk/approval-reaction-runtime` | ハードコードされた承認リアクションバインディング、リアクションプロンプトペイロード、リアクションターゲットストア、リアクションヒントテキストヘルパー、ローカルネイティブ exec プロンプト抑制の互換エクスポート |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | exec/Plugin 承認ペイロードヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、`formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 絞り込まれたインバウンド返信重複排除リセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広範な testing barrel を含まない、絞り込まれたチャネル契約テストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニュー整形、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットチャネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文の正規化とコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | プライベートチャネルと Web UI device-code ペアリング向けの遅延プロバイダー認証ログインフローヘルパー |
    | `plugin-sdk/channel-secret-runtime` | チャネル/Plugin シークレットサーフェス向けの、絞り込まれたシークレット契約収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレット契約/設定解析向けの、絞り込まれた `coerceSecretRef` と SecretRef 型付けヘルパー |
    | `plugin-sdk/secret-provider-integration` | 外部シークレットプロバイダープリセットを公開する Plugin 向けの、型専用 SecretRef プロバイダー統合マニフェストとプリセット契約 |
    | `plugin-sdk/security-runtime` | 共有 trust、DM ゲーティング、create-only 書き込みを含むルート境界付きファイル/パスヘルパー、sync/async アトミックファイル置換、sibling 一時書き込み、クロスデバイス移動フォールバック、プライベートファイルストアヘルパー、シンボリックリンク親ガード、外部コンテンツ、機密テキストの墨消し、定数時間シークレット比較、シークレット収集ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト allowlist とプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範な infra ランタイムサーフェスを含まない、絞り込まれた pinned-dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF ガード付き fetch、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパーと raw websocket/body 強制変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範なランタイム/ロギング/バックアップ/Pluginインストールヘルパー |
    | `plugin-sdk/runtime-env` | 狭いランタイム環境、ロガー、タイムアウト、リトライ、バックオフのヘルパー |
    | `plugin-sdk/browser-config` | 正規化済みプロファイル/デフォルト、CDP URL解析、ブラウザー制御認証ヘルパー向けのサポート済みブラウザー設定ファサード |
    | `plugin-sdk/agent-harness-task-runtime` | ホスト発行のタスクスコープを使用する、ハーネス支援エージェント向けの汎用タスクライフサイクルおよび完了配信ヘルパー |
    | `plugin-sdk/codex-mcp-projection` | ユーザーのMCPサーバー設定をCodexスレッド設定へ投影するための予約済みバンドルCodexヘルパー。サードパーティPlugin向けではありません |
    | `plugin-sdk/codex-native-task-runtime` | ネイティブタスクミラー/ランタイム配線のためのプライベートなバンドルCodexヘルパー。サードパーティPlugin向けではありません |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネルランタイムコンテキスト登録および検索ヘルパー |
    | `plugin-sdk/matrix` | 古いサードパーティチャネルパッケージ向けの非推奨Matrix互換性ファサード。新しいPluginは`plugin-sdk/run-command`を直接インポートするべきです |
    | `plugin-sdk/mattermost` | 古いサードパーティチャネルパッケージ向けの非推奨Mattermost互換性ファサード。新しいPluginは汎用SDKサブパスを直接インポートするべきです |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有Pluginコマンド/フック/http/対話型ヘルパー |
    | `plugin-sdk/hook-runtime` | 共有Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface`などの遅延ランタイムインポート/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLIのフォーマット、待機、バージョン、引数呼び出し、遅延コマンドグループのヘルパー |
    | `plugin-sdk/qa-live-transport-scenarios` | 共有ライブトランスポートQAシナリオID、ベースラインカバレッジヘルパー、シナリオ選択ヘルパー |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]`を宣言するPlugin HTTPルート向けの予約済みGatewayメソッドディスパッチヘルパー |
    | `plugin-sdk/gateway-runtime` | Gatewayクライアント、イベントループ準備済みクライアント起動ヘルパー、Gateway CLI RPC、Gatewayプロトコルエラー、アドバタイズ済みLANホスト解決、チャネルステータスパッチヘルパー |
    | `plugin-sdk/config-contracts` | `OpenClawConfig`などのPlugin設定形状およびチャネル/プロバイダー設定型向けの、型専用の集中設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject`などのランタイムPlugin設定検索ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated`などのトランザクション型設定変更ヘルパー |
    | `plugin-sdk/message-tool-delivery-hints` | 共有メッセージツール配信メタデータヒント文字列 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テストスナップショットセッターなどの現在のプロセス設定スナップショットヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドルTelegram契約サーフェスが利用できない場合でも使える、Telegramコマンド名/説明の正規化および重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広範なテキストバレルを使わないファイル参照自動リンク検出 |
    | `plugin-sdk/approval-reaction-runtime` | ハードコード済み承認リアクションバインディング、リアクションプロンプトペイロード、リアクションターゲットストア、リアクションヒントテキストヘルパー、ローカルネイティブ実行プロンプト抑制の互換性エクスポート |
    | `plugin-sdk/approval-runtime` | 実行/Plugin承認ヘルパー、承認機能ビルダー、認証/プロファイルヘルパー、ネイティブルーティング/ランタイムヘルパー、構造化された承認表示パスのフォーマット |
    | `plugin-sdk/reply-runtime` | 共有インバウンド/返信ランタイムヘルパー、チャンク化、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い返信ディスパッチ/完了処理および会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | 共有短時間ウィンドウ返信履歴ヘルパー。新しいメッセージターンコードは`createChannelHistoryWindow`を使用するべきです。低レベルのマップヘルパーは非推奨の互換性エクスポートとしてのみ残ります |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いテキスト/Markdownチャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションワークフローヘルパー（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、セッションIDによる範囲限定の最近のユーザー/アシスタントトランスクリプトテキスト読み取り、レガシーセッションストアパス/セッションキーヘルパー、更新日時読み取り、移行専用の全ストア/ファイルパス互換性ヘルパー |
    | `plugin-sdk/session-transcript-runtime` | トランスクリプトID、範囲付きターゲット/読み取り/書き込みヘルパー、更新公開、書き込みロック、トランスクリプトメモリヒットキー |
    | `plugin-sdk/sqlite-runtime` | ファーストパーティランタイム向けの集中SQLiteエージェントスキーマ、パス、トランザクションヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cronストアパス/読み込み/保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuthディレクトリパスヘルパー |
    | `plugin-sdk/plugin-state-runtime` | Plugin所有データベース向けの、PluginサイドカーSQLiteキー付き状態型と集中接続pragmaおよびWALメンテナンス設定 |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャネル/アカウントステータス概要ヘルパー、ランタイム状態デフォルト、Issueメタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | スラッグ/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request風の入力から文字列URLを抽出 |
    | `plugin-sdk/run-command` | 正規化済みstdout/stderr結果を持つ時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLIパラメーターリーダー |
    | `plugin-sdk/tool-plugin` | 単純な型付きエージェントツールPluginを定義し、マニフェスト生成用の静的メタデータを公開 |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化済みペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正規送信ターゲットフィールドを抽出 |
    | `plugin-sdk/sandbox` | fail-fast実行コマンド事前チェックを含む、サンドボックスバックエンド型およびSSH/OpenShellコマンドヘルパー |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパーおよびプライベートなセキュア一時ワークスペース |
    | `plugin-sdk/logging-core` | サブシステムロガーおよび墨消しヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdownテーブルモードおよび変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry`や`resolveAgentMaxConcurrent`などのモデル/セッションオーバーライドヘルパー |
    | `plugin-sdk/talk-config-runtime` | トークプロバイダー設定解決ヘルパー |
    | `plugin-sdk/json-store` | 小規模JSON状態読み取り/書き込みヘルパー |
    | `plugin-sdk/json-unsafe-integers` | 安全でない整数リテラルを文字列として保持するJSON解析ヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスク支援の重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACPランタイム/セッションおよび返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時に読み込まれるPlugin向けの軽量ACPバックエンド登録および返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動インポートを伴わない読み取り専用ACPバインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 狭いエージェントランタイム設定スキーマプリミティブ |
    | `plugin-sdk/boolean-param` | 緩い真偽値パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険名マッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスブートストラップおよびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャネル、ステータス、アンビエントプロキシヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models`コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skillコマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリ/ビルド/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的な信頼済みPluginサーフェス: ハーネス型、Active Run誘導/中止ヘルパー、OpenClawツールブリッジヘルパー、ランタイムプランツールポリシーヘルパー、ターミナル結果分類、ツール進捗フォーマット/詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | 非推奨のZ.AIプロバイダー所有エンドポイント検出ファサード。Z.AI Plugin公開APIを使用してください |
    | `plugin-sdk/async-lock-runtime` | 小規模ランタイム状態ファイル向けのプロセスローカル非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 境界付き非同期タスク並行実行ヘルパー |
    | `plugin-sdk/dedupe-runtime` | インメモリおよび永続化バックエンド付き重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | 送信保留配信ドレインヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルおよびメディアソースパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeatウェイク、イベント、可視性ヘルパー |
    | `plugin-sdk/number-runtime` | 数値強制変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | セキュアトークン/UUIDヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了待機ヘルパー |
    | `plugin-sdk/exec-approvals-runtime` | 広範なinfra-runtimeバレルを使わない実行承認ポリシーファイルヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換性シム。上記の集中ランタイムサブパスを使用してください |
    | `plugin-sdk/collection-runtime` | 小規模な境界付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップ済みfetch、プロキシ、EnvHttpProxyAgentオプション、固定lookupヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ/guarded-fetchインポートを伴わない、ディスパッチャー対応ランタイムfetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 広範なメディアランタイムサーフェスを使わないインライン画像データURLサニタイザーおよびシグネチャ嗅ぎ分けヘルパー |
    | `plugin-sdk/response-limit-runtime` | 広範なメディアランタイムサーフェスを使わない境界付きレスポンス本文リーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングまたはペアリングストアを伴わない現在の会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広範な設定書き込み/メンテナンスインポートを伴わないセッションストアヘルパー |
    | `plugin-sdk/sqlite-runtime` | データベースライフサイクル制御を伴わない、集中SQLiteエージェントスキーマ、パス、トランザクションヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広範な設定/セキュリティインポートを伴わないコンテキスト可視性解決および補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/ロギングインポートを伴わない、狭いプリミティブレコード/文字列強制変換および正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名およびSCPホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | リトライ設定およびリトライランナーヘルパー |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`、`resolveDefaultAgentDir`、非推奨の`resolveOpenClawAgentDir`互換性エクスポートを含む、エージェントディレクトリ/ID/ワークスペースヘルパー |
    | `plugin-sdk/directory-runtime` | 設定に基づくディレクトリクエリ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer`、非推奨の `fetchRemoteMedia` を含む共有メディア取得/変換/保存ヘルパー。URL を OpenClaw メディアにする必要がある場合は、バッファー読み取りより前に保存ヘルパーを優先 |
    | `plugin-sdk/media-mime` | 限定的な MIME 正規化、ファイル拡張子マッピング、MIME 検出、メディア種別ヘルパー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` や `saveMediaStream` などの限定的なメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、モデル欠落メッセージ |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型に加え、プロバイダー向けの画像/音声/構造化抽出ヘルパーエクスポート |
    | `plugin-sdk/text-chunking` | テキストと markdown のチャンク化/レンダリングヘルパー、markdown テーブル変換、ディレクティブタグ削除、安全なテキストユーティリティ |
    | `plugin-sdk/text-chunking` | 送信テキストチャンク化ヘルパー |
    | `plugin-sdk/speech` | 音声プロバイダー型に加え、プロバイダー向けディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーのエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、音声ヘルパーのエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-bootstrap-context` | 境界付き `IDENTITY.md`、`USER.md`、`SOUL.md` コンテキスト注入用のリアルタイムプロファイルブートストラップヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型、レジストリヘルパー、出力アクティビティ追跡を含む共有リアルタイム音声動作ヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型に加え、画像アセット/data URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、レジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/transcripts` | 共有文字起こしソースプロバイダー型、レジストリヘルパー、セッション記述子、発話メタデータ |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリとルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | 非推奨の互換エイリアス。`plugin-sdk/webhook-ingress` を使用 |
    | `plugin-sdk/web-media` | 共有リモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | 非推奨の互換再エクスポート。`zod` から直接 `zod` をインポート |
    | `plugin-sdk/testing` | レガシー OpenClaw テスト用のリポジトリローカルな非推奨互換バレル。新しいリポジトリテストでは、代わりに `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` など、対象を絞ったローカルテストサブパスをインポートする必要があります |
    | `plugin-sdk/plugin-test-api` | リポジトリのテストヘルパーブリッジをインポートせずに直接 Plugin 登録ユニットテストを行うための、リポジトリローカルの最小 `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト投影テスト用の、リポジトリローカルなネイティブエージェントランタイムアダプター契約フィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション/セットアップ/ステータス契約、ディレクトリアサーション、アカウント起動ライフサイクル、送信設定スレッディング、ランタイムモック、ステータス問題、送信配信、フック登録用の、リポジトリローカルなチャネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャネルテスト用の、リポジトリローカルな共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/plugin-test-contracts` | リポジトリローカルな Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、インポート副作用契約ヘルパー |
    | `plugin-sdk/provider-test-contracts` | リポジトリローカルなプロバイダーランタイム、認証、検出、オンボーディング、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索/取得、ストリーム契約ヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト用の、リポジトリローカルなオプトイン Vitest HTTP/認証モック |
    | `plugin-sdk/test-fixtures` | リポジトリローカルな汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、Skill ライター、エージェントメッセージ、システムイベント、モジュール再読み込み、バンドル Plugin パス、ターミナルテキスト、チャンク化、認証トークン、型付きケースフィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest の `vi.mock("node:*")` ファクトリ内で使用する、リポジトリローカルで対象を絞った Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="メモリのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | マネージャー/設定/ファイル/CLI ヘルパー用のバンドル memory-core ヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索ランタイムファサード |
    | `plugin-sdk/memory-core-host-embedding-registry` | 軽量メモリ埋め込みプロバイダーレジストリヘルパー |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込み契約、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。このサーフェスの `registerMemoryEmbeddingProvider` は非推奨です。新しいプロバイダーには汎用埋め込みプロバイダー API を使用してください。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー |
    | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー |
    | `plugin-sdk/memory-core-host-events` | 非推奨の互換エイリアス。`plugin-sdk/memory-host-events` を使用 |
    | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホストコアランタイムヘルパーのベンダーニュートラルなエイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルヘルパーのベンダーニュートラルなエイリアス |
    | `plugin-sdk/memory-host-files` | 非推奨の互換エイリアス。`plugin-sdk/memory-core-host-runtime-files` を使用 |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 Plugin 用の共有管理 markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | 検索マネージャーアクセス用の Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | 非推奨の互換エイリアス。`plugin-sdk/memory-core-host-status` を使用 |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーサブパス">
    予約済みバンドルヘルパー SDK サブパスは、バンドル Plugin コード向けの、対象を絞ったオーナー固有のサーフェスです。パッケージビルドとエイリアスが決定的に保たれるよう SDK インベントリで追跡されていますが、一般的な Plugin 作成 API ではありません。新しい再利用可能なホスト契約では、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK サブパスを使用する必要があります。

    | サブパス | オーナーと目的 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ユーザー MCP サーバー設定を Codex アプリサーバースレッド設定へ投影するための、バンドル Codex Plugin ヘルパー |
    | `plugin-sdk/codex-native-task-runtime` | Codex アプリサーバーのネイティブサブエージェントを OpenClaw タスク状態へミラーリングするための、バンドル Codex Plugin ヘルパー |

  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
