---
read_when:
    - Plugin のインポートに適した plugin-sdk サブパスの選択
    - バンドル済みPluginのサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDK サブパスカタログ: どのインポートがどこにあるかを領域別にグループ化'
title: Plugin SDK サブパス
x-i18n:
    generated_at: "2026-07-05T11:39:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: feb618466479488b576a6942ad4a21061a20e57870a2151b1cdcb868db9b80bb
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK は `openclaw/plugin-sdk/` 配下の狭い公開サブパス群として公開されています。このページでは、よく使われるサブパスを目的別に分類して一覧化します。公開面は次の 3 つのファイルで定義されます。

- `scripts/lib/plugin-sdk-entrypoints.json`: ビルドがコンパイルする、保守されているエントリポイント一覧。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: リポジトリローカルのテスト用および内部用サブパス。パッケージの exports は、一覧からこのリストを除いたものです。
- `src/plugin-sdk/entrypoints.ts`: 非推奨サブパス、予約済みのバンドルヘルパー、サポート対象のバンドルファサード、Plugin 所有の公開面に関する分類メタデータ。

メンテナーは、公開 export 数を `pnpm plugin-sdk:surface` で監査し、アクティブな予約済みヘルパーサブパスを `pnpm plugins:boundary-report:summary` で監査します。未使用の予約済みヘルパー export は、休眠状態の互換性負債として公開 SDK に残るのではなく、CI レポートで失敗します。

Plugin 作成ガイドについては、[Plugin SDK の概要](/ja-JP/plugins/sdk-overview)を参照してください。

## Plugin エントリ

| サブパス                       | 主要な export                                                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` などのマイグレーションプロバイダー項目ヘルパー、理由定数、項目ステータスマーカー、秘匿化ヘルパー、`summarizeMigrationItems`                    |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime`, `writeMigrationReport` などのランタイムマイグレーションヘルパー          |
| `plugin-sdk/health`            | バンドルされたヘルス利用側向けの Doctor ヘルスチェックの登録、検出、修復、選択、重大度、検出事項の型                                                                  |
| `plugin-sdk/config-schema`     | 非推奨。ルート `openclaw.json` の Zod スキーマ（`OpenClawSchema`）。代わりに Plugin ローカルのスキーマを定義し、`plugin-sdk/json-schema-runtime` で検証してください   |

### 非推奨の互換性ヘルパーとテストヘルパー

非推奨サブパスは古い Plugin 向けに export されたままですが、新しいコードでは下記の焦点を絞った SDK サブパスを使うべきです。保守されているリストは `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` です。CI は、バンドルされた本番コードからこのリストへの import を拒否します。`plugin-sdk/compat`、`plugin-sdk/config-types`、`plugin-sdk/infra-runtime`、`plugin-sdk/text-runtime` などの広範なバレルは互換性専用であり、`plugin-sdk/zod` は互換性のための再 export です。`zod` から直接 `zod` を import してください。広範なドメインバレルである `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、`plugin-sdk/channel-runtime`、`plugin-sdk/cli-runtime`、`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime`、`plugin-sdk/security-runtime` も同様に非推奨であり、焦点を絞ったサブパスの使用が推奨されます。

OpenClawの Vitest を利用したテストヘルパーサブパスはリポジトリローカル専用であり、パッケージ export ではなくなりました: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`, `test-node-mocks`, `testing`。非公開のバンドルヘルパー公開面である `ssrf-runtime-internal` と `codex-native-task-runtime` もリポジトリローカル専用です。

### 予約済みバンドル Plugin ヘルパーサブパス

`plugin-sdk/codex-mcp-projection` は唯一の予約済みサブパスです。これはバンドルされた Codex Plugin 向けの Plugin 所有の互換性公開面であり、汎用 SDK API ではありません。所有者をまたぐ Plugin import はパッケージ契約のガードレールによってブロックされ、予約済みサブパスが import されなくなると CI は失敗します。`plugin-sdk/codex-native-task-runtime` はリポジトリローカル専用であり、パッケージ export ではありません。

`src/plugin-sdk/entrypoints.ts` は、サポート対象のバンドルファサードも追跡します。これは汎用契約に置き換えられるまで、対応するバンドル Plugin によって裏付けられる SDK エントリポイントです: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`, `plugin-sdk/matrix`, `plugin-sdk/mattermost`, `plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`, `plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`, `plugin-sdk/tts-runtime`, `plugin-sdk/zalouser`。これらのいくつかは新しいコードでは非推奨でもあります。下記の各行の注記を参照してください。

<AccordionGroup>
  <Accordion title="チャンネルサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/json-schema-runtime` | Plugin が所有するスキーマ向けのキャッシュ済み JSON Schema 検証ヘルパー |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` に加え、`DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、セットアップトランスレーター、許可リストプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 非推奨の互換エイリアス。`plugin-sdk/setup-runtime` を使用してください |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント設定/アクションゲートヘルパー、デフォルトアカウントフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント検索 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 限定的なアカウントリスト/アカウントアクションヘルパー |
    | `plugin-sdk/access-groups` | アクセスグループ許可リスト解析と、編集済みグループ診断ヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共有チャンネル設定スキーマプリミティブに加え、Zod と直接 JSON/TypeBox ビルダー |
    | `plugin-sdk/bundled-channel-config-schema` | メンテナンスされているバンドル Plugin 専用の、バンドル OpenClaw チャンネル設定スキーマ |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`。正準のバンドル/公式チャットチャンネル ID に加え、独自の表をハードコードせずにエンベローププレフィックス付きテキストを認識する必要がある Plugin 向けのフォーマッターラベル/エイリアス。 |
    | `plugin-sdk/channel-config-schema-legacy` | バンドルチャンネル設定スキーマ向けの非推奨互換エイリアス |
    | `plugin-sdk/telegram-command-config` | 非推奨の Telegram コマンド名/説明の正規化と重複/競合チェック。新しい Plugin コードでは Plugin ローカルのコマンド設定処理を使用してください |
    | `plugin-sdk/command-gating` | 限定的なコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 低レベルのチャンネル入力互換サーフェス。新しい受信パスでは `plugin-sdk/channel-ingress-runtime` を使用してください。 |
    | `plugin-sdk/channel-ingress-runtime` | 移行済みチャンネル受信パス向けの実験的な高レベルチャンネル入力ランタイムリゾルバーとルートファクトビルダー。各 Plugin で有効な許可リスト、コマンド許可リスト、レガシープロジェクションを組み立てるより、こちらを優先してください。[チャンネル入力 API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。 |
    | `plugin-sdk/channel-lifecycle` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-outbound` | メッセージライフサイクル契約に加え、返信パイプラインオプション、受信確認、ライブプレビュー/ストリーミング、ライフサイクルヘルパー、送信 ID、ペイロード計画、永続送信、メッセージ送信コンテキストヘルパー。[チャンネル送信 API](/ja-JP/plugins/sdk-channel-outbound) を参照してください。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` の非推奨互換エイリアスに加え、レガシー返信ディスパッチファサード。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` の非推奨互換エイリアスに加え、レガシー返信ディスパッチファサード。 |
    | `plugin-sdk/inbound-envelope` | 共有受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 非推奨の互換ファサード。受信ランナーとディスパッチ述語には `plugin-sdk/channel-inbound` を、メッセージ配信ヘルパーには `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析エイリアス。`plugin-sdk/channel-targets` を使用してください |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みとホスト済みメディア状態ヘルパー |
    | `plugin-sdk/outbound-send-deps` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/outbound-runtime` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/poll-runtime` | 限定的なポーリング正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルとアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | エージェントメディアペイロードのルートとローダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、設定済みバインディングヘルパー向けの非推奨の広範なバレル。`plugin-sdk/thread-bindings-runtime` や `plugin-sdk/session-binding-runtime` など、焦点を絞ったバインディングサブパスを優先してください |
    | `plugin-sdk/runtime-group-policy` | ランタイムグループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャンネルステータスのスナップショット/要約ヘルパー |
    | `plugin-sdk/channel-config-primitives` | 限定的なチャンネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャンネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャンネル Plugin プレリュードエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 非推奨のグループアクセス判定ヘルパー。`plugin-sdk/channel-ingress-runtime` の `resolveChannelMessageIngress` を使用してください |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換ファサード。`plugin-sdk/channel-inbound` を使用してください。 |
    | `plugin-sdk/direct-dm-guard-policy` | 限定的な direct-DM 暗号化前ガードポリシーヘルパー |
    | `plugin-sdk/discord` | 公開済み `@openclaw/discord@2026.3.13` と追跡対象オーナー互換性向けの非推奨 Discord 互換ファサード。新しい Plugin は汎用チャンネル SDK サブパスを使用してください |
    | `plugin-sdk/telegram-account` | 追跡対象オーナー互換性向けの非推奨 Telegram アカウント解決互換ファサード。新しい Plugin は注入されたランタイムヘルパーまたは汎用チャンネル SDK サブパスを使用してください |
    | `plugin-sdk/zalouser` | 送信者コマンド認可をまだインポートしている公開済み Lark/Zalo パッケージ向けの非推奨 Zalo Personal 互換ファサード。新しい Plugin は汎用チャンネル SDK サブパスを使用してください |
    | `plugin-sdk/interactive-runtime` | セマンティックメッセージプレゼンテーション、配信、レガシーインタラクティブ返信ヘルパー。[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください |
    | `plugin-sdk/channel-inbound` | イベント分類、コンテキスト構築、フォーマット、ルート、デバウンス、メンション照合、メンションポリシー、受信ログ向けの共有受信ヘルパー |
    | `plugin-sdk/channel-inbound-debounce` | 限定的な受信デバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広範な受信ランタイムサーフェスを含まない、限定的なメンションポリシー、メンションマーカー、メンションテキストヘルパー |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 非推奨の互換ファサード。`plugin-sdk/channel-inbound` または `plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-pairing-paths` | 非推奨の互換ファサード。`plugin-sdk/channel-pairing` を使用してください。 |
    | `plugin-sdk/channel-reply-options-runtime` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-streaming` | 非推奨の互換ファサード。`plugin-sdk/channel-outbound` を使用してください。 |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャンネルメッセージアクションヘルパーに加え、Plugin 互換性のために残されている非推奨ネイティブスキーマヘルパー |
    | `plugin-sdk/channel-route` | 共有ルート正規化、パーサー駆動のターゲット解決、スレッド ID 文字列化、重複排除/コンパクトなルートキー、解析済みターゲット型、ルート/ターゲット比較ヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析ヘルパー。ルート比較呼び出し元は `plugin-sdk/channel-route` を使用してください |
    | `plugin-sdk/channel-contract` | チャンネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
  </Accordion>

非推奨のチャンネルヘルパーファミリーは、公開済み Plugin との互換性のためにのみ引き続き利用できます。削除計画は次のとおりです。外部 Plugin の移行期間中は維持し、リポジトリ/バンドル Plugin は `channel-inbound` と `channel-outbound` に留め、その後次回のメジャー SDK クリーンアップで互換サブパスを削除します。これは、古いチャンネル message/runtime、チャンネル streaming、direct-DM access、受信ヘルパー分岐、reply-options、pairing-path ファミリーに適用されます。

  <Accordion title="Provider のサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | セットアップ、カタログ検出、ランタイムモデル準備用の、サポート対象 LM Studio Provider ファサード |
    | `plugin-sdk/lmstudio-runtime` | ローカルサーバーデフォルト、モデル検出、リクエストヘッダー、読み込み済みモデルヘルパー用の、サポート対象 LM Studio ランタイムファサード |
    | `plugin-sdk/provider-setup` | 選定済みのローカル/セルフホスト Provider セットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | 非推奨の OpenAI 互換セルフホストセットアップヘルパー。`plugin-sdk/provider-setup` または Plugin 所有のセットアップヘルパーを使用する |
    | `plugin-sdk/cli-backend` | CLI バックエンドデフォルト + ウォッチドッグ定数 |
    | `plugin-sdk/provider-auth-runtime` | Provider 認証ランタイムヘルパー: OAuth ループバックフロー、トークン交換、認証永続化、API キー解決 |
    | `plugin-sdk/provider-oauth-runtime` | 汎用 Provider OAuth コールバック型、コールバックページレンダリング、PKCE/state ヘルパー、認可入力の解析、トークン有効期限ヘルパー、中止ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キーオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 認証結果ビルダー |
    | `plugin-sdk/provider-env-vars` | Provider 認証環境変数検索ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 認証インポートヘルパー、非推奨の `resolveOpenClawAgentDir` 互換エクスポート |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、Provider エンドポイントヘルパー、共有モデル ID 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-live-runtime` | ガード付き `/models` 形式検出用のライブ Provider モデルカタログヘルパー: `buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、モデル ID フィルタリング、TTL キャッシュ、静的フォールバック |
    | `plugin-sdk/provider-catalog-runtime` | Provider カタログ拡張ランタイムフックと、コントラクトテスト用の Plugin Provider レジストリ接合部 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用 Provider HTTP/エンドポイント機能ヘルパー、Provider HTTP エラー、音声文字起こし multipart フォームヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの狭い Web フェッチ設定/選択コントラクトヘルパー |
    | `plugin-sdk/provider-web-fetch` | Web フェッチ Provider 登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 有効化配線を必要としない Provider 向けの、狭い Web 検索設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報 setter/getter などの狭い Web 検索設定/認証情報コントラクトヘルパー |
    | `plugin-sdk/provider-web-search` | Web 検索 Provider 登録/キャッシュ/ランタイムヘルパー |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)`、`listEmbeddingProviders(...)` を含む一般的な埋め込み Provider 型と読み取りヘルパー。Plugin は `api.registerEmbeddingProvider(...)` を通じて Provider を登録し、manifest 所有権が強制される |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek/Gemini/OpenAI スキーマクリーンアップ + 診断 |
    | `plugin-sdk/provider-usage` | Provider 使用状況スナップショット型、共有使用状況取得ヘルパー、`fetchClaudeUsage` などの Provider fetcher |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、プレーンテキストツール呼び出し互換、共有 Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI ラッパーヘルパー |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`、Anthropic/DeepSeek/OpenAI 互換ストリームユーティリティを含む、公開共有 Provider ストリームラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | ガード付き fetch、ツール結果テキスト抽出、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブ Provider トランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカルの singleton/map/cache ヘルパー |
    | `plugin-sdk/group-activation` | 狭いグループ有効化モードとコマンド解析ヘルパー |
  </Accordion>

Provider 使用状況スナップショットは通常、1 つ以上のクォータ `windows` を報告し、それぞれに
ラベル、使用率、任意のリセット時刻を含めます。リセット可能なクォータウィンドウではなく残高や
アカウント状態のテキストを公開する Provider は、割合を捏造するのではなく、空の `windows` 配列とともに
`summary` を返す必要があります。
OpenClaw はその概要テキストをステータス出力に表示します。`error` は、使用状況エンドポイントが失敗した場合、または
使用可能な使用状況データを返さなかった場合にのみ使用してください。

  <Accordion title="認証とセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | 非推奨の広範なコマンド認可サーフェス（`resolveControlCommandGate`、動的引数メニュー整形を含むコマンドレジストリヘルパー、送信者認可ヘルパー）。チャネル ingress/ランタイム認可またはコマンドステータスヘルパーを使用する |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決と同一チャットアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より狭いアダプター/Gateway 接合部を優先する |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット、アカウントバインディング、ルートゲート、転送フォールバック、ローカルネイティブ exec プロンプト抑制ヘルパー |
    | `plugin-sdk/approval-reaction-runtime` | ハードコードされた承認リアクションバインディング、リアクションプロンプトペイロード、リアクションターゲットストア、リアクションヒントテキストヘルパー、ローカルネイティブ exec プロンプト抑制用の互換エクスポート |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | exec/Plugin 承認ペイロードヘルパー、承認機能ビルダー、承認認証/プロファイルヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、`formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 非推奨の狭い受信返信重複排除リセットヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニュー整形、ネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | ホットチャネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文正規化とコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | プライベートチャネルと Web UI デバイスコードペアリング向けの遅延 Provider 認証ログインフローヘルパー |
    | `plugin-sdk/channel-secret-runtime` | 非推奨の広範なシークレットコントラクトサーフェス（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、シークレットターゲット型）。下記の焦点を絞ったサブパスを優先する |
    | `plugin-sdk/channel-secret-basic-runtime` | 非 TTS チャネル/Plugin シークレットサーフェス向けの狭いシークレットコントラクトエクスポート |
    | `plugin-sdk/channel-secret-tts-runtime` | 狭いネストされたチャネル TTS シークレット割り当てヘルパー |
    | `plugin-sdk/secret-ref-runtime` | シークレットコントラクト/設定解析用の狭い `coerceSecretRef` と SecretRef 型付けヘルパー |
    | `plugin-sdk/secret-provider-integration` | 外部シークレット Provider プリセットを公開する Plugin 向けの型のみの SecretRef Provider 統合 manifest とプリセットコントラクト |
    | `plugin-sdk/security-runtime` | 信頼、DM ゲーティング、作成専用書き込みを含むルート境界付きファイル/パスヘルパー、同期/非同期アトミックファイル置換、兄弟一時書き込み、クロスデバイス移動フォールバック、プライベートファイルストアヘルパー、シンボリックリンク親ガード、外部コンテンツ、機密テキスト編集、定数時間シークレット比較、シークレット収集ヘルパー用の非推奨の広範な barrel。焦点を絞った security/SSRF/secret サブパスを優先する |
    | `plugin-sdk/ssrf-policy` | ホスト allowlist とプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広範な infra ランタイムサーフェスを含まない、狭い固定 dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | 固定 dispatcher、SSRF ガード付き fetch、SSRF エラー、SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパーと raw websocket/body 強制変換 |
    | `plugin-sdk/webhook-request-guards` | リクエスト本文サイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="ランタイムとストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | ランタイム/ロギング/バックアップヘルパー、Plugin インストールパス警告、プロセスヘルパー |
    | `plugin-sdk/runtime-env` | 絞り込まれたランタイム環境、ロガー、タイムアウト、リトライ、バックオフヘルパー |
    | `plugin-sdk/browser-config` | 正規化されたプロファイル/デフォルト、CDP URL 解析、ブラウザー制御認証ヘルパー向けのサポート済みブラウザー設定ファサード |
    | `plugin-sdk/agent-harness-task-runtime` | ホスト発行のタスクスコープを使用するハーネス支援エージェント向けの汎用タスクライフサイクルと完了配信ヘルパー |
    | `plugin-sdk/codex-mcp-projection` | ユーザー MCP サーバー設定を Codex スレッド設定へ射影するための予約済みバンドル Codex ヘルパー。サードパーティ Plugin 用ではありません |
    | `plugin-sdk/codex-native-task-runtime` | ネイティブタスクのミラー/ランタイム配線向けのリポジトリローカルのバンドル Codex ヘルパー。パッケージエクスポートではありません |
    | `plugin-sdk/channel-runtime-context` | 汎用チャンネルランタイムコンテキストの登録と検索ヘルパー |
    | `plugin-sdk/matrix` | 古いサードパーティチャンネルパッケージ向けの非推奨 Matrix 互換ファサード。新しい Plugin は `plugin-sdk/run-command` を直接インポートしてください |
    | `plugin-sdk/mattermost` | 古いサードパーティチャンネルパッケージ向けの非推奨 Mattermost 互換ファサード。新しい Plugin は汎用 SDK サブパスを直接インポートしてください |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Plugin コマンド/フック/http/インタラクティブヘルパー向けの非推奨の広範なバレル。焦点を絞った Plugin ランタイムサブパスを優先してください |
    | `plugin-sdk/hook-runtime` | Webhook/内部フックパイプラインヘルパー向けの非推奨の広範なバレル。焦点を絞ったフック/Plugin ランタイムサブパスを優先してください |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` などの遅延ランタイムインポート/バインディングヘルパー |
    | `plugin-sdk/process-runtime` | プロセス実行ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI フォーマット、待機、バージョン、引数呼び出し、遅延コマンドグループヘルパー向けの非推奨の広範なバレル。焦点を絞った CLI/ランタイムサブパスを優先してください |
    | `plugin-sdk/qa-live-transport-scenarios` | 共有ライブトランスポート QA シナリオ ID、ベースラインカバレッジヘルパー、シナリオ選択ヘルパー |
    | `plugin-sdk/qa-runner-runtime` | CLI コマンドサーフェスを通じて Plugin QA シナリオを公開するサポート済みファサード |
    | `plugin-sdk/tts-runtime` | テキスト読み上げ設定スキーマとランタイムヘルパー向けのサポート済みファサード |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言する Plugin HTTP ルート向けの予約済み Gateway メソッドディスパッチヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアント、イベントループ準備済みクライアント開始ヘルパー、Gateway CLI RPC、Gateway プロトコルエラー、公開 LAN ホスト解決、チャンネルステータスパッチヘルパー |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` やチャンネル/プロバイダー設定型などの Plugin 設定形状向けの焦点を絞った型専用設定サーフェス |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`、`resolvePluginConfigObject`、`resolveLivePluginConfigObject` などのランタイム Plugin 設定検索ヘルパー |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`、`replaceConfigFile`、`logConfigUpdated` などのトランザクション設定変更ヘルパー |
    | `plugin-sdk/message-tool-delivery-hints` | 共有メッセージツール配信メタデータヒント文字列 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`、`getRuntimeConfigSnapshot`、テストスナップショットセッターなどの現在プロセス設定スナップショットヘルパー |
    | `plugin-sdk/text-autolink-runtime` | 広範なテキストバレルを使わないファイル参照オートリンク検出 |
    | `plugin-sdk/reply-runtime` | 共有受信/返信ランタイムヘルパー、チャンク化、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 絞り込まれた返信ディスパッチ/ファイナライズと会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | 共有短時間ウィンドウ返信履歴ヘルパー。新しいメッセージターンコードは `createChannelHistoryWindow` を使用してください。低レベルのマップヘルパーは非推奨の互換エクスポートとしてのみ残ります |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 絞り込まれたテキスト/Markdown チャンク化ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションワークフローヘルパー（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、セッション ID による範囲付き最近のユーザー/アシスタントのトランスクリプトテキスト読み取り、レガシーセッションストアパス/セッションキーヘルパー、更新日時読み取り、広範な設定書き込み/メンテナンスインポートを含まない移行専用のストア全体/ファイルパス互換ヘルパー |
    | `plugin-sdk/session-transcript-runtime` | トランスクリプト ID、スコープ付きターゲット/読み取り/書き込みヘルパー、更新公開、書き込みロック、トランスクリプトメモリヒットキー |
    | `plugin-sdk/sqlite-runtime` | データベースライフサイクル制御を含まない、ファーストパーティランタイム向けの焦点を絞った SQLite エージェントスキーマ、パス、トランザクションヘルパー |
    | `plugin-sdk/cron-store-runtime` | Cron ストアパス/読み込み/保存ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/plugin-state-runtime` | Plugin サイドカー SQLite キー付き状態型と、Plugin 所有データベース向けの集中接続 pragma および WAL メンテナンス設定 |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャンネル/アカウントステータス要約ヘルパー、ランタイム状態デフォルト、Issue メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | スラッグ/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout/stderr 結果を持つ時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLI パラメーターリーダー |
    | `plugin-sdk/tool-plugin` | 単純な型付きエージェントツール Plugin を定義し、マニフェスト生成用の静的メタデータを公開 |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化済みペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から正規送信ターゲットフィールドを抽出 |
    | `plugin-sdk/sandbox` | fail-fast 実行コマンドプリフライトを含む、サンドボックスバックエンド型と SSH/OpenShell コマンドヘルパー |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパーとプライベートな安全一時ワークスペース |
    | `plugin-sdk/logging-core` | サブシステムロガーと秘匿化ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードと変換ヘルパー |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` や `resolveAgentMaxConcurrent` などのモデル/セッション上書きヘルパー |
    | `plugin-sdk/talk-config-runtime` | Talk プロバイダー設定解決ヘルパー |
    | `plugin-sdk/json-store` | 小さな JSON 状態読み書きヘルパー |
    | `plugin-sdk/json-unsafe-integers` | 安全でない整数リテラルを文字列として保持する JSON 解析ヘルパー |
    | `plugin-sdk/file-lock` | 再入可能ファイルロックヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスク支援重複排除キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP ランタイム/セッションと返信ディスパッチヘルパー |
    | `plugin-sdk/acp-runtime-backend` | 起動時に読み込まれる Plugin 向けの軽量 ACP バックエンド登録と返信ディスパッチヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動インポートを伴わない読み取り専用 ACP バインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 非推奨のエージェントランタイム設定スキーマプリミティブ。保守されている Plugin 所有サーフェスからスキーマプリミティブをインポートしてください |
    | `plugin-sdk/boolean-param` | 緩いブール値パラメーターリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険な名前のマッチング解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイスブートストラップとペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有パッシブチャンネル、ステータス、アンビエントプロキシヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/プロバイダー返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skill コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリ/ビルド/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的な信頼済み Plugin サーフェス: ハーネス型、アクティブ実行の操縦/中止ヘルパー、OpenClaw ツールブリッジヘルパー、ランタイムプランツールポリシーヘルパー、ターミナル結果分類、ツール進行状況のフォーマット/詳細ヘルパー、試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | 非推奨の Z.AI プロバイダー所有エンドポイント検出ファサード。Z.AI Plugin の公開 API を使用してください |
    | `plugin-sdk/async-lock-runtime` | 小さなランタイム状態ファイル向けのプロセスローカル非同期ロックヘルパー |
    | `plugin-sdk/channel-activity-runtime` | チャンネルアクティビティテレメトリヘルパー |
    | `plugin-sdk/concurrency-runtime` | 制限付き非同期タスク同時実行ヘルパー |
    | `plugin-sdk/dedupe-runtime` | メモリ内および永続支援の重複排除キャッシュヘルパー |
    | `plugin-sdk/delivery-queue-runtime` | 送信保留配信ドレインヘルパー |
    | `plugin-sdk/file-access-runtime` | 安全なローカルファイルとメディアソースパスヘルパー |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat ウェイク、イベント、可視性ヘルパー |
    | `plugin-sdk/number-runtime` | 数値変換ヘルパー |
    | `plugin-sdk/secure-random-runtime` | 安全なトークン/UUID ヘルパー |
    | `plugin-sdk/system-event-runtime` | システムイベントキューヘルパー |
    | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了待機ヘルパー |
    | `plugin-sdk/exec-approvals-runtime` | 広範な infra-runtime バレルを使わない実行承認ポリシーファイルヘルパー |
    | `plugin-sdk/infra-runtime` | 非推奨の互換シム。上記の焦点を絞ったランタイムサブパスを使用してください |
    | `plugin-sdk/collection-runtime` | 小さな制限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグ、イベント、トレースコンテキストヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、フォーマット、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップ済み fetch、プロキシ、EnvHttpProxyAgent オプション、固定 lookup ヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ/ガード付き fetch インポートを伴わない、ディスパッチャー対応ランタイム fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 広範なメディアランタイムサーフェスを使わない、インライン画像データ URL サニタイザーとシグネチャ嗅ぎ分けヘルパー |
    | `plugin-sdk/response-limit-runtime` | 広範なメディアランタイムサーフェスを使わない、制限付きレスポンスボディリーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングやペアリングストアを伴わない現在の会話バインディング状態 |
    | `plugin-sdk/context-visibility-runtime` | 広範な設定/セキュリティインポートを伴わないコンテキスト可視性解決と補足コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/ロギングインポートを伴わない、絞り込まれたプリミティブレコード/文字列変換と正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名と SCP ホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | リトライ設定とリトライランナーヘルパー |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`、`resolveDefaultAgentDir`、非推奨の `resolveOpenClawAgentDir` 互換エクスポートを含む、エージェントディレクトリ/ID/ワークスペースヘルパー向けの非推奨の広範なバレル。焦点を絞ったエージェント/ランタイムサブパスを優先してください |
    | `plugin-sdk/directory-runtime` | 設定支援ディレクトリクエリ/重複排除 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能とテストのサブパス">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer`、非推奨の `fetchRemoteMedia` を含む非推奨の広範なメディアバレル。`plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media`、機能ランタイムサブパスを優先し、URL を OpenClaw メディアにする必要がある場合はバッファ読み取りよりストアヘルパーを優先する |
    | `plugin-sdk/media-mime` | 範囲を絞った MIME 正規化、ファイル拡張子マッピング、MIME 検出、メディア種別ヘルパー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` や `saveMediaStream` などの範囲を絞ったメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、モデル不足メッセージ |
    | `plugin-sdk/media-understanding` | メディア理解プロバイダー型、およびプロバイダー向けの画像/音声/構造化抽出ヘルパーエクスポート |
    | `plugin-sdk/text-chunking` | 送信テキストと markdown のチャンク化/レンダリングヘルパー、markdown テーブル変換、ディレクティブタグ除去、安全なテキストユーティリティ |
    | `plugin-sdk/speech` | 音声プロバイダー型、およびプロバイダー向けのディレクティブ、レジストリ、検証、OpenAI 互換 TTS ビルダー、音声ヘルパーエクスポート |
    | `plugin-sdk/speech-core` | 共有音声プロバイダー型、レジストリ、ディレクティブ、正規化、音声ヘルパーエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしプロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-bootstrap-context` | 範囲を制限した `IDENTITY.md`、`USER.md`、`SOUL.md` コンテキスト注入のためのリアルタイムプロファイルブートストラップヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声プロバイダー型、レジストリヘルパー、出力アクティビティ追跡を含む共有リアルタイム音声動作ヘルパー |
    | `plugin-sdk/image-generation` | 画像生成プロバイダー型、画像アセット/データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、レジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/music-generation-core` | 非推奨の共有音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析。Plugin 所有の音楽プロバイダーサーフェスを優先する |
    | `plugin-sdk/video-generation` | 動画生成プロバイダー/リクエスト/結果型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
    | `plugin-sdk/transcripts` | 共有トランスクリプトソースプロバイダー型、レジストリヘルパー、セッション記述子、発話メタデータ |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリとルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | 非推奨の互換エイリアス。`plugin-sdk/webhook-ingress` を使用する |
    | `plugin-sdk/web-media` | 共有リモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | 非推奨の互換再エクスポート。`zod` から直接 `zod` をインポートする |
    | `plugin-sdk/testing` | レガシー OpenClaw テスト向けのリポジトリローカルの非推奨互換バレル。新しいリポジトリテストでは、代わりに `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` など、焦点を絞ったローカルテストサブパスをインポートする |
    | `plugin-sdk/plugin-test-api` | リポジトリテストヘルパーブリッジをインポートせずに直接 Plugin 登録単体テストを行うための、リポジトリローカルの最小 `createTestPluginApi` ヘルパー |
    | `plugin-sdk/agent-runtime-test-contracts` | 認証、配信、フォールバック、ツールフック、プロンプトオーバーレイ、スキーマ、トランスクリプト投影テスト向けの、リポジトリローカルのネイティブエージェントランタイムアダプター契約フィクスチャ |
    | `plugin-sdk/channel-test-helpers` | 汎用アクション/セットアップ/ステータス契約、ディレクトリアサーション、アカウント起動ライフサイクル、送信設定スレッド化、ランタイムモック、ステータス問題、送信配信、フック登録のためのリポジトリローカルのチャンネル指向テストヘルパー |
    | `plugin-sdk/channel-target-testing` | チャンネルテスト向けのリポジトリローカル共有ターゲット解決エラーケーススイート |
    | `plugin-sdk/channel-contract-testing` | 広範なテストバレルを使わない、リポジトリローカルの範囲を絞ったチャンネル契約テストヘルパー |
    | `plugin-sdk/plugin-test-contracts` | リポジトリローカルの Plugin パッケージ、登録、公開アーティファクト、直接インポート、ランタイム API、インポート副作用契約ヘルパー |
    | `plugin-sdk/plugin-state-test-runtime` | リポジトリローカルの Plugin 状態ストア、ingress キュー、状態 DB テストヘルパー |
    | `plugin-sdk/provider-test-contracts` | リポジトリローカルのプロバイダーランタイム、認証、検出、オンボーディング、カタログ、ウィザード、メディア機能、リプレイポリシー、リアルタイム STT ライブ音声、Web 検索/取得、ストリーム契約ヘルパー |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` を実行するプロバイダーテスト向けの、リポジトリローカルのオプトイン Vitest HTTP/認証モック |
    | `plugin-sdk/reply-payload-testing` | 返信ペイロードフィクスチャにメタデータを添付するためのリポジトリローカルヘルパー |
    | `plugin-sdk/sqlite-runtime-testing` | ファーストパーティテスト向けのリポジトリローカル SQLite ライフサイクルヘルパー |
    | `plugin-sdk/test-fixtures` | リポジトリローカルの汎用 CLI ランタイムキャプチャ、サンドボックスコンテキスト、skill ライター、エージェントメッセージ、システムイベント、モジュール再読み込み、バンドル済み Plugin パス、端末テキスト、チャンク化、認証トークン、型付きケースフィクスチャ |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` ファクトリ内で使用するための、リポジトリローカルの焦点を絞った Node 組み込みモックヘルパー |
  </Accordion>

  <Accordion title="メモリサブパス">
    | サブパス | 主要なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | 非推奨の互換エイリアス。`plugin-sdk/memory-host-core` を使用する |
    | `plugin-sdk/memory-core-engine-runtime` | 非推奨のメモリインデックス/検索ランタイムファサード。ベンダー中立の memory-host サブパスを優先する |
    | `plugin-sdk/memory-core-host-embedding-registry` | 軽量なメモリ埋め込みプロバイダーレジストリヘルパー |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込み契約、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。このサーフェスの `registerMemoryEmbeddingProvider` は非推奨。新しいプロバイダーには汎用埋め込みプロバイダー API を使用する。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | 非推奨のメモリホストマルチモーダルヘルパー。ベンダー中立の memory-host サブパスを優先する |
    | `plugin-sdk/memory-core-host-query` | 非推奨のメモリホストクエリヘルパー。ベンダー中立の memory-host サブパスを優先する |
    | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー |
    | `plugin-sdk/memory-core-host-events` | 非推奨の互換エイリアス。`plugin-sdk/memory-host-events` を使用する |
    | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイムヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホストコアランタイムヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルヘルパーのベンダー中立エイリアス |
    | `plugin-sdk/memory-host-files` | 非推奨の互換エイリアス。`plugin-sdk/memory-core-host-runtime-files` を使用する |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 Plugin 向けの共有管理 markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | search-manager アクセス向けの Active Memory ランタイムファサード |
    | `plugin-sdk/memory-host-status` | 非推奨の互換エイリアス。`plugin-sdk/memory-core-host-status` を使用する |
  </Accordion>

  <Accordion title="予約済みバンドルヘルパーサブパス">
    予約済みバンドルヘルパー SDK サブパスは、バンドル済み Plugin コード向けの範囲を絞った所有者固有サーフェスです。パッケージビルドとエイリアス設定を決定的に保つため SDK インベントリで追跡されますが、一般的な Plugin 作成 API ではありません。新しい再利用可能なホスト契約では、`plugin-sdk/gateway-runtime`、`plugin-sdk/ssrf-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK サブパスを使用する必要があります。

    | サブパス | 所有者と目的 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ユーザー MCP サーバー設定を Codex app-server スレッド設定へ投影するための、バンドル済み Codex Plugin ヘルパー（予約済みパッケージエクスポート） |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server ネイティブサブエージェントを OpenClaw タスク状態へミラーリングするための、バンドル済み Codex Plugin ヘルパー（リポジトリローカルのみ、パッケージエクスポートではない） |

  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
