---
read_when:
    - Plugin import に適した plugin-sdk サブパスの選び方
    - バンドル済み Plugin のサブパスとヘルパーサーフェスの監査
summary: 'Plugin SDK サブパスカタログ: どの import がどこにあるか、領域別に整理したもの'
title: Plugin SDK サブパス
x-i18n:
    generated_at: "2026-04-25T18:19:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b143fcc177c4d0d03fbcb4058291c99a7bb9f1f7fd04cca3916a7dbb4c22fd14
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK は、`openclaw/plugin-sdk/` 配下の絞り込まれたサブパス群として公開されています。
  このページでは、よく使われるサブパスを目的別に分類して一覧化しています。生成された
  200 以上のサブパスを含む完全な一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。
  予約済みのバンドル Plugin ヘルパーサブパスもそこに記載されていますが、
  ドキュメントページで明示的に案内されていない限り、実装詳細です。

  Plugin の作成ガイドについては、[Plugin SDK overview](/ja-JP/plugins/sdk-overview) を参照してください。

  ## Plugin エントリ

  | サブパス                    | 主なエクスポート                                                                                                                       |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="チャネルのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマエクスポート（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー、許可リストプロンプト、セットアップステータスビルダー |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 複数アカウント設定/アクションゲートヘルパー、デフォルトアカウントのフォールバックヘルパー |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、アカウント ID 正規化ヘルパー |
    | `plugin-sdk/account-resolution` | アカウント参照 + デフォルトフォールバックヘルパー |
    | `plugin-sdk/account-helpers` | 絞り込まれたアカウント一覧/アカウントアクションヘルパー |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | チャネル設定スキーマ型 |
    | `plugin-sdk/telegram-command-config` | バンドル契約フォールバック付き Telegram カスタムコマンド正規化/検証ヘルパー |
    | `plugin-sdk/command-gating` | 絞り込まれたコマンド認可ゲートヘルパー |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、ドラフトストリームのライフサイクル/完了処理ヘルパー |
    | `plugin-sdk/inbound-envelope` | 共有受信ルート + エンベロープビルダーヘルパー |
    | `plugin-sdk/inbound-reply-dispatch` | 共有受信 record-and-dispatch ヘルパー |
    | `plugin-sdk/messaging-targets` | ターゲット解析/照合ヘルパー |
    | `plugin-sdk/outbound-media` | 共有送信メディア読み込みヘルパー |
    | `plugin-sdk/outbound-runtime` | 送信配信、ID、送信デリゲート、セッション、フォーマット、およびペイロード計画ヘルパー |
    | `plugin-sdk/poll-runtime` | 絞り込まれた poll 正規化ヘルパー |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルおよびアダプターヘルパー |
    | `plugin-sdk/agent-media-payload` | レガシーなエージェントメディアペイロードビルダー |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、ペアリング、および設定済みバインディングヘルパー |
    | `plugin-sdk/runtime-config-snapshot` | 実行時設定スナップショットヘルパー |
    | `plugin-sdk/runtime-group-policy` | 実行時グループポリシー解決ヘルパー |
    | `plugin-sdk/channel-status` | 共有チャネルステータスのスナップショット/サマリーヘルパー |
    | `plugin-sdk/channel-config-primitives` | 絞り込まれたチャネル設定スキーマプリミティブ |
    | `plugin-sdk/channel-config-writes` | チャネル設定書き込み認可ヘルパー |
    | `plugin-sdk/channel-plugin-common` | 共有チャネル Plugin プレリュードエクスポート |
    | `plugin-sdk/allowlist-config-edit` | 許可リスト設定の編集/読み取りヘルパー |
    | `plugin-sdk/group-access` | 共有グループアクセス判定ヘルパー |
    | `plugin-sdk/direct-dm` | 共有ダイレクト DM 認証/ガードヘルパー |
    | `plugin-sdk/interactive-runtime` | セマンティックメッセージ提示、配信、およびレガシー interactive reply ヘルパー。[Message Presentation](/ja-JP/plugins/message-presentation) を参照 |
    | `plugin-sdk/channel-inbound` | 受信デバウンス、メンション照合、メンションポリシーヘルパー、およびエンベロープヘルパー向けの互換バレル |
    | `plugin-sdk/channel-inbound-debounce` | 絞り込まれた受信デバウンスヘルパー |
    | `plugin-sdk/channel-mention-gating` | より広い受信実行時サーフェスを含まない、絞り込まれたメンションポリシーおよびメンションテキストヘルパー |
    | `plugin-sdk/channel-envelope` | 絞り込まれた受信エンベロープ整形ヘルパー |
    | `plugin-sdk/channel-location` | チャネル位置情報コンテキストおよび整形ヘルパー |
    | `plugin-sdk/channel-logging` | 受信ドロップおよび typing/ack 失敗向けのチャネルログヘルパー |
    | `plugin-sdk/channel-send-result` | 返信結果型 |
    | `plugin-sdk/channel-actions` | チャネルメッセージアクションヘルパー、および Plugin 互換性のために維持されている非推奨のネイティブスキーマヘルパー |
    | `plugin-sdk/channel-targets` | ターゲット解析/照合ヘルパー |
    | `plugin-sdk/channel-contract` | チャネル契約型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクション配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`、および secret target 型などの絞り込まれたシークレット契約ヘルパー |
  </Accordion>

  <Accordion title="Provider のサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホスト型 provider セットアップヘルパー |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホスト型 provider 向けの特化セットアップヘルパー |
    | `plugin-sdk/cli-backend` | CLI バックエンドデフォルト + watchdog 定数 |
    | `plugin-sdk/provider-auth-runtime` | provider Plugin 向けの実行時 API キー解決ヘルパー |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API キーのオンボーディング/プロファイル書き込みヘルパー |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth auth-result ビルダー |
    | `plugin-sdk/provider-auth-login` | provider Plugin 向けの共有インタラクティブログインヘルパー |
    | `plugin-sdk/provider-env-vars` | provider 認証 env var 参照ヘルパー |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共有リプレイポリシービルダー、provider エンドポイントヘルパー、および `normalizeNativeXaiModelId` などのモデル ID 正規化ヘルパー |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用 provider HTTP/エンドポイント機能ヘルパー、provider HTTP エラー、および音声文字起こし multipart form ヘルパー |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` などの絞り込まれた web-fetch 設定/選択契約ヘルパー |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider 登録/キャッシュヘルパー |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 有効化配線を必要としない provider 向けの絞り込まれた web-search 設定/認証情報ヘルパー |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、およびスコープ付き認証情報 setter/getter などの絞り込まれた web-search 設定/認証情報契約ヘルパー |
    | `plugin-sdk/provider-web-search` | web-search provider の登録/キャッシュ/実行時ヘルパー |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini スキーマクリーンアップ + 診断、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI 互換ヘルパー |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、および共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch、transport message transforms、書き込み可能な transport event streams などのネイティブ provider トランスポートヘルパー |
    | `plugin-sdk/provider-onboard` | オンボーディング設定パッチヘルパー |
    | `plugin-sdk/global-singleton` | プロセスローカル singleton/map/cache ヘルパー |
    | `plugin-sdk/group-activation` | 絞り込まれたグループアクティベーションモードおよびコマンド解析ヘルパー |
  </Accordion>

  <Accordion title="認証およびセキュリティのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、動的引数メニュー整形を含むコマンドレジストリヘルパー、送信者認可ヘルパー |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` や `buildHelpMessage` などのコマンド/ヘルプメッセージビルダー |
    | `plugin-sdk/approval-auth-runtime` | 承認者解決および同一チャットのアクション認証ヘルパー |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec 承認プロファイル/フィルターヘルパー |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ承認機能/配信アダプター |
    | `plugin-sdk/approval-gateway-runtime` | 共有承認 Gateway 解決ヘルパー |
    | `plugin-sdk/approval-handler-adapter-runtime` | 高頻度チャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
    | `plugin-sdk/approval-handler-runtime` | より広い承認ハンドラー実行時ヘルパー。より狭い adapter/gateway シームで十分な場合はそちらを優先してください |
    | `plugin-sdk/approval-native-runtime` | ネイティブ承認ターゲット + アカウントバインディングヘルパー |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 承認返信ペイロードヘルパー |
    | `plugin-sdk/approval-runtime` | exec/Plugin 承認ペイロードヘルパー、ネイティブ承認ルーティング/実行時ヘルパー、および `formatApprovalDisplayPath` などの構造化承認表示ヘルパー |
    | `plugin-sdk/reply-dedupe` | 絞り込まれた受信返信重複排除リセットヘルパー |
    | `plugin-sdk/channel-contract-testing` | 広い testing バレルを含まない、絞り込まれたチャネル契約テストヘルパー |
    | `plugin-sdk/command-auth-native` | ネイティブコマンド認証、動的引数メニュー整形、およびネイティブセッションターゲットヘルパー |
    | `plugin-sdk/command-detection` | 共有コマンド検出ヘルパー |
    | `plugin-sdk/command-primitives-runtime` | 高頻度チャネルパス向けの軽量コマンドテキスト述語 |
    | `plugin-sdk/command-surface` | コマンド本文の正規化およびコマンドサーフェスヘルパー |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | チャネル/Plugin シークレットサーフェス向けの絞り込まれた secret-contract 収集ヘルパー |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/設定解析向けの絞り込まれた `coerceSecretRef` および SecretRef 型ヘルパー |
    | `plugin-sdk/security-runtime` | 共有 trust、DM ゲーティング、外部コンテンツ、およびシークレット収集ヘルパー |
    | `plugin-sdk/ssrf-policy` | ホスト許可リストおよびプライベートネットワーク SSRF ポリシーヘルパー |
    | `plugin-sdk/ssrf-dispatcher` | 広い infra runtime サーフェスを含まない、絞り込まれた pinned-dispatcher ヘルパー |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF 保護付き fetch、および SSRF ポリシーヘルパー |
    | `plugin-sdk/secret-input` | シークレット入力解析ヘルパー |
    | `plugin-sdk/webhook-ingress` | Webhook リクエスト/ターゲットヘルパー |
    | `plugin-sdk/webhook-request-guards` | リクエストボディサイズ/タイムアウトヘルパー |
  </Accordion>

  <Accordion title="実行時およびストレージのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/runtime` | 広範な runtime/logging/backup/Plugin インストールヘルパー |
    | `plugin-sdk/runtime-env` | 絞り込まれた runtime env、ロガー、タイムアウト、再試行、およびバックオフヘルパー |
    | `plugin-sdk/channel-runtime-context` | 汎用チャネル runtime-context 登録および参照ヘルパー |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有 Plugin コマンド/フック/http/interactive ヘルパー |
    | `plugin-sdk/hook-runtime` | 共有 Webhook/内部フックパイプラインヘルパー |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` などの lazy runtime import/binding ヘルパー |
    | `plugin-sdk/process-runtime` | プロセス exec ヘルパー |
    | `plugin-sdk/cli-runtime` | CLI 整形、待機、バージョン、引数起動、および lazy コマンドグループヘルパー |
    | `plugin-sdk/gateway-runtime` | Gateway クライアントおよびチャネルステータスパッチヘルパー |
    | `plugin-sdk/config-runtime` | 設定の読み込み/書き込みヘルパーおよび Plugin 設定参照ヘルパー |
    | `plugin-sdk/telegram-command-config` | バンドルされた Telegram 契約サーフェスが利用できない場合でも、Telegram コマンド名/説明の正規化および重複/競合チェック |
    | `plugin-sdk/text-autolink-runtime` | 広い text-runtime バレルを含まないファイル参照 autolink 検出 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 承認ヘルパー、承認機能ビルダー、認証/プロファイルヘルパー、ネイティブルーティング/実行時ヘルパー、および構造化承認表示パス整形 |
    | `plugin-sdk/reply-runtime` | 共有受信/返信実行時ヘルパー、チャンク分割、ディスパッチ、Heartbeat、返信プランナー |
    | `plugin-sdk/reply-dispatch-runtime` | 絞り込まれた返信ディスパッチ/完了処理および会話ラベルヘルパー |
    | `plugin-sdk/reply-history` | `buildHistoryContext`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled` などの共有短時間ウィンドウ reply-history ヘルパー |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 絞り込まれたテキスト/Markdown チャンク分割ヘルパー |
    | `plugin-sdk/session-store-runtime` | セッションストアパス + updated-at ヘルパー |
    | `plugin-sdk/state-paths` | 状態/OAuth ディレクトリパスヘルパー |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` などのルート/セッションキー/アカウントバインディングヘルパー |
    | `plugin-sdk/status-helpers` | 共有チャネル/アカウントステータス要約ヘルパー、実行時状態デフォルト、および issue メタデータヘルパー |
    | `plugin-sdk/target-resolver-runtime` | 共有ターゲットリゾルバーヘルパー |
    | `plugin-sdk/string-normalization-runtime` | slug/文字列正規化ヘルパー |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout/stderr 結果を返す時間制限付きコマンドランナー |
    | `plugin-sdk/param-readers` | 共通ツール/CLI パラメータリーダー |
    | `plugin-sdk/tool-payload` | ツール結果オブジェクトから正規化ペイロードを抽出 |
    | `plugin-sdk/tool-send` | ツール引数から標準的な送信ターゲットフィールドを抽出 |
    | `plugin-sdk/temp-path` | 共有一時ダウンロードパスヘルパー |
    | `plugin-sdk/logging-core` | サブシステムロガーおよび秘匿化ヘルパー |
    | `plugin-sdk/markdown-table-runtime` | Markdown テーブルモードおよび変換ヘルパー |
    | `plugin-sdk/json-store` | 小規模 JSON 状態読み書きヘルパー |
    | `plugin-sdk/file-lock` | 再入可能 file-lock ヘルパー |
    | `plugin-sdk/persistent-dedupe` | ディスクバック dedupe キャッシュヘルパー |
    | `plugin-sdk/acp-runtime` | ACP 実行時/セッションおよび reply-dispatch ヘルパー |
    | `plugin-sdk/acp-binding-resolve-runtime` | ライフサイクル起動 import を含まない読み取り専用 ACP バインディング解決 |
    | `plugin-sdk/agent-config-primitives` | 絞り込まれたエージェント実行時 config-schema プリミティブ |
    | `plugin-sdk/boolean-param` | 緩やかな boolean パラメータリーダー |
    | `plugin-sdk/dangerous-name-runtime` | 危険名照合解決ヘルパー |
    | `plugin-sdk/device-bootstrap` | デバイス bootstrap およびペアリングトークンヘルパー |
    | `plugin-sdk/extension-shared` | 共有 passive-channel、ステータス、および ambient proxy ヘルパープリミティブ |
    | `plugin-sdk/models-provider-runtime` | `/models` コマンド/provider 返信ヘルパー |
    | `plugin-sdk/skill-commands-runtime` | Skills コマンド一覧ヘルパー |
    | `plugin-sdk/native-command-registry` | ネイティブコマンドレジストリの構築/シリアライズヘルパー |
    | `plugin-sdk/agent-harness` | 低レベルエージェントハーネス向けの実験的 trusted-plugin サーフェス: ハーネス型、active-run の steer/abort ヘルパー、OpenClaw ツールブリッジヘルパー、ツール進捗整形/詳細ヘルパー、および試行結果ユーティリティ |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI エンドポイント検出ヘルパー |
    | `plugin-sdk/infra-runtime` | システムイベント/Heartbeat ヘルパー |
    | `plugin-sdk/collection-runtime` | 小規模な上限付きキャッシュヘルパー |
    | `plugin-sdk/diagnostic-runtime` | 診断フラグおよびイベントヘルパー |
    | `plugin-sdk/error-runtime` | エラーグラフ、整形、共有エラー分類ヘルパー、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ラップ済み fetch、プロキシ、および pinned lookup ヘルパー |
    | `plugin-sdk/runtime-fetch` | プロキシ/guarded-fetch import を含まない dispatcher-aware runtime fetch |
    | `plugin-sdk/response-limit-runtime` | 広い media runtime サーフェスを含まない上限付きレスポンスボディリーダー |
    | `plugin-sdk/session-binding-runtime` | 設定済みバインディングルーティングやペアリングストアを含まない現在の会話バインディング状態 |
    | `plugin-sdk/session-store-runtime` | 広い設定書き込み/保守 import を含まないセッションストア読み取りヘルパー |
    | `plugin-sdk/context-visibility-runtime` | 広い設定/セキュリティ import を含まないコンテキスト可視性解決および補助コンテキストフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | Markdown/logging import を含まない、絞り込まれた primitive record/文字列 coercion および正規化ヘルパー |
    | `plugin-sdk/host-runtime` | ホスト名および SCP ホスト正規化ヘルパー |
    | `plugin-sdk/retry-runtime` | 再試行設定および再試行ランナーヘルパー |
    | `plugin-sdk/agent-runtime` | エージェント dir/ID/workspace ヘルパー |
    | `plugin-sdk/directory-runtime` | 設定バック directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="機能およびテストのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/media-runtime` | メディアペイロードビルダーを含む共有メディア fetch/transform/store ヘルパー |
    | `plugin-sdk/media-store` | `saveMediaBuffer` などの絞り込まれたメディアストアヘルパー |
    | `plugin-sdk/media-generation-runtime` | 共有メディア生成フェイルオーバーヘルパー、候補選択、および欠落モデルメッセージング |
    | `plugin-sdk/media-understanding` | メディア理解 provider 型、および provider 向け画像/音声ヘルパーエクスポート |
    | `plugin-sdk/text-runtime` | アシスタント可視テキスト除去、Markdown レンダリング/チャンク分割/テーブルヘルパー、秘匿化ヘルパー、directive-tag ヘルパー、安全テキストユーティリティなどの共有テキスト/Markdown/logging ヘルパー |
    | `plugin-sdk/text-chunking` | 送信テキストチャンク分割ヘルパー |
    | `plugin-sdk/speech` | 音声 provider 型、および provider 向け directive、レジストリ、検証、音声ヘルパーエクスポート |
    | `plugin-sdk/speech-core` | 共有音声 provider 型、レジストリ、directive、正規化、および音声ヘルパーエクスポート |
    | `plugin-sdk/realtime-transcription` | リアルタイム文字起こし provider 型、レジストリヘルパー、および共有 WebSocket セッションヘルパー |
    | `plugin-sdk/realtime-voice` | リアルタイム音声 provider 型およびレジストリヘルパー |
    | `plugin-sdk/image-generation` | 画像生成 provider 型 |
    | `plugin-sdk/image-generation-core` | 共有画像生成型、フェイルオーバー、認証、およびレジストリヘルパー |
    | `plugin-sdk/music-generation` | 音楽生成 provider/request/result 型 |
    | `plugin-sdk/music-generation-core` | 共有音楽生成型、フェイルオーバーヘルパー、provider 参照、および model-ref 解析 |
    | `plugin-sdk/video-generation` | 動画生成 provider/request/result 型 |
    | `plugin-sdk/video-generation-core` | 共有動画生成型、フェイルオーバーヘルパー、provider 参照、および model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook ターゲットレジストリおよびルートインストールヘルパー |
    | `plugin-sdk/webhook-path` | Webhook パス正規化ヘルパー |
    | `plugin-sdk/web-media` | 共有リモート/ローカルメディア読み込みヘルパー |
    | `plugin-sdk/zod` | Plugin SDK 利用者向けに再エクスポートされた `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="メモリのサブパス">
    | サブパス | 主なエクスポート |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI ヘルパー向けのバンドル済み memory-core ヘルパーサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | メモリインデックス/検索実行時ファサード |
    | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込み契約、レジストリアクセス、ローカル provider、および汎用 batch/remote ヘルパー |
    | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジンエクスポート |
    | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジンエクスポート |
    | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー |
    | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー |
    | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー |
    | `plugin-sdk/memory-core-host-events` | メモリホストイベントジャーナルヘルパー |
    | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー |
    | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI 実行時ヘルパー |
    | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコア実行時ヘルパー |
    | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/実行時ヘルパー |
    | `plugin-sdk/memory-host-core` | メモリホストコア実行時ヘルパー向けの vendor-neutral エイリアス |
    | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルヘルパー向けの vendor-neutral エイリアス |
    | `plugin-sdk/memory-host-files` | メモリホストファイル/実行時ヘルパー向けの vendor-neutral エイリアス |
    | `plugin-sdk/memory-host-markdown` | メモリ隣接 Plugin 向けの共有 managed-markdown ヘルパー |
    | `plugin-sdk/memory-host-search` | search-manager アクセス向けの Active Memory 実行時ファサード |
    | `plugin-sdk/memory-host-status` | メモリホストステータスヘルパー向けの vendor-neutral エイリアス |
    | `plugin-sdk/memory-lancedb` | バンドル済み memory-lancedb ヘルパーサーフェス |
  </Accordion>

  <Accordion title="予約済みバンドル helper サブパス">
    | ファミリー | 現在のサブパス | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | バンドル済み browser Plugin サポートヘルパー。`browser-profiles` は、正規化された `browser.tabCleanup` 形状向けに `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile`, `ResolvedBrowserTabCleanupConfig` をエクスポートします。`browser-support` は互換バレルのままです。 |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | バンドル済み Matrix ヘルパー/実行時サーフェス |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | バンドル済み LINE ヘルパー/実行時サーフェス |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | バンドル済み IRC ヘルパーサーフェス |
    | チャネル固有ヘルパー | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | バンドル済みチャネル互換/ヘルパーシーム |
    | 認証/Plugin 固有ヘルパー | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | バンドル済み機能/Plugin ヘルパーシーム。`plugin-sdk/github-copilot-token` は現在、`DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` をエクスポートします |
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK overview](/ja-JP/plugins/sdk-overview)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
