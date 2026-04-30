---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - OpenClaw 2026.4.25 より前に api.registerEmbeddedExtensionFactory を使用していました
    - Pluginを最新のPluginアーキテクチャに更新しています
    - 外部 OpenClaw Plugin を保守している
sidebarTitle: Migrate to SDK
summary: レガシーの後方互換性レイヤーから最新のPlugin SDKへ移行する
title: Plugin SDK の移行
x-i18n:
    generated_at: "2026-04-30T05:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw は、広範な後方互換レイヤーから、焦点を絞ったドキュメント化済みの import を備えたモダンな plugin アーキテクチャへ移行しました。plugin が新しいアーキテクチャ以前に作られている場合、このガイドが移行を支援します。

## 変更内容

古い plugin システムは、plugins が単一のエントリーポイントから必要なものを何でも import できる、2 つの広く開かれたサーフェスを提供していました。

- **`openclaw/plugin-sdk/compat`** — 数十のヘルパーを再エクスポートする単一の import です。これは、新しい plugin アーキテクチャの構築中に、古い hook ベースの plugins を動作させ続けるために導入されました。
- **`openclaw/plugin-sdk/infra-runtime`** — システムイベント、heartbeat 状態、配信キュー、fetch/proxy ヘルパー、ファイルヘルパー、承認型、関連しないユーティリティを混在させた、広範な runtime ヘルパー barrel です。
- **`openclaw/plugin-sdk/config-runtime`** — 移行期間中に非推奨の直接 load/write ヘルパーをまだ保持している、広範な config 互換 barrel です。
- **`openclaw/extension-api`** — embedded agent runner のようなホスト側ヘルパーへ plugins が直接アクセスできるようにしていたブリッジです。
- **`api.registerEmbeddedExtensionFactory(...)`** — `tool_result` などの embedded-runner イベントを監視できた、削除済みの Pi 専用 bundled extension hook です。

広範な import サーフェスは現在 **非推奨** です。runtime ではまだ動作しますが、新しい plugins は使用してはならず、既存の plugins は次のメジャーリリースで削除される前に移行する必要があります。Pi 専用 embedded extension factory 登録 API は削除されています。代わりに tool-result middleware を使用してください。

OpenClaw は、置き換えを導入するのと同じ変更で、ドキュメント化済みの plugin 振る舞いを削除したり再解釈したりしません。破壊的な契約変更は、まず互換アダプター、診断、docs、非推奨期間を経る必要があります。これは SDK imports、manifest fields、setup APIs、hooks、runtime registration behavior に適用されます。

<Warning>
  後方互換レイヤーは、将来のメジャーリリースで削除されます。
  これらのサーフェスからまだ import している plugins は、その時点で壊れます。
  Pi 専用 embedded extension factory registrations は、すでに読み込まれなくなっています。
</Warning>

## 変更理由

古いアプローチには問題がありました。

- **起動が遅い** — 1 つのヘルパーを import すると、関連しない数十のモジュールが読み込まれる
- **循環依存** — 広範な再エクスポートにより、import cycle を作りやすい
- **不明確な API サーフェス** — どの exports が安定版で、どれが内部用かを判別する方法がない

モダンな plugin SDK はこれを解決します。各 import path（`openclaw/plugin-sdk/\<subpath\>`）は、明確な目的とドキュメント化済みの契約を持つ、小さく自己完結したモジュールです。

bundled channels 向けの従来の provider convenience seams も廃止されています。
channel-branded helper seams は、安定した plugin 契約ではなく、private mono-repo shortcuts でした。代わりに、狭い generic SDK subpaths を使用してください。bundled plugin workspace 内では、provider-owned helpers をその plugin 自身の `api.ts` または `runtime-api.ts` に保持してください。

現在の bundled provider examples:

- Anthropic は Claude 固有の stream helpers を自身の `api.ts` / `contract-api.ts` seam に保持しています
- OpenAI は provider builders、default-model helpers、realtime provider builders を自身の `api.ts` に保持しています
- OpenRouter は provider builder と onboarding/config helpers を自身の `api.ts` に保持しています

## 互換性ポリシー

外部 plugins については、互換性作業は次の順序で進みます。

1. 新しい契約を追加する
2. 古い振る舞いを互換アダプター経由で接続したままにする
3. 古い path と置き換え先の名前を含む診断または警告を出す
4. 両方の path を tests でカバーする
5. 非推奨化と移行 path をドキュメント化する
6. 発表済みの移行期間後、通常はメジャーリリースでのみ削除する

maintainers は、現在の移行キューを `pnpm plugins:boundary-report` で監査できます。コンパクトな件数には `pnpm plugins:boundary-report:summary`、1 つの plugin または compatibility owner には `--owner <id>`、期限到来済みの compatibility records、cross-owner reserved SDK imports、または未使用の reserved SDK subpaths で CI gate を失敗させる必要がある場合は `pnpm plugins:boundary-report:ci` を使用してください。このレポートは、非推奨の compatibility records を削除日ごとにグループ化し、local code/docs references を数え、cross-owner reserved SDK imports を明らかにし、private memory-host SDK bridge を要約します。これにより、互換性クリーンアップは ad hoc searches に依存せず明示的に保たれます。Reserved SDK subpaths には、追跡された owner usage が必要です。未使用の reserved helper exports は public SDK から削除する必要があります。

manifest field がまだ受け入れられている場合、plugin authors は docs と diagnostics が別の指示を出すまで使い続けられます。新しい code ではドキュメント化済みの置き換えを優先すべきですが、既存の plugins が通常の minor releases で壊れるべきではありません。

## 移行方法

<Steps>
  <Step title="runtime config load/write helpers を移行する">
    Bundled plugins は、
    `api.runtime.config.loadConfig()` と
    `api.runtime.config.writeConfigFile(...)` を直接呼び出すのをやめる必要があります。active call path にすでに渡されている config を優先してください。current process snapshot が必要な long-lived handlers は `api.runtime.config.current()` を使用できます。long-lived agent tools は、config write の前に作成された tool でも refreshed runtime config を参照できるように、`execute` 内で tool context の `ctx.getRuntimeConfig()` を使用する必要があります。

    Config writes は transactional helpers を通し、after-write policy を選択する必要があります。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    呼び出し元が変更には clean gateway restart が必要だと分かっている場合は `afterWrite: { mode: "restart", reason: "..." }` を使用し、呼び出し元が follow-up を所有し、意図的に reload planner を抑制したい場合にのみ `afterWrite: { mode: "none", reason: "..." }` を使用してください。
    Mutation results には、tests と logging 用の typed `followUp` summary が含まれます。restart の適用またはスケジュールは引き続き gateway が責任を持ちます。
    `loadConfig` と `writeConfigFile` は、移行期間中の external plugins 向けに非推奨の compatibility helpers として残り、`runtime-config-load-write` compatibility code で一度だけ警告します。Bundled plugins と repo runtime code は、
    `pnpm check:deprecated-internal-config-api` と
    `pnpm check:no-runtime-action-load-config` の scanner guardrails によって保護されています。新しい production plugin usage は即座に失敗し、direct config writes は失敗し、gateway server methods は request runtime snapshot を使用する必要があり、runtime channel send/action/client helpers は boundary から config を受け取る必要があり、long-lived runtime modules で許可される ambient `loadConfig()` calls はゼロです。

    新しい plugin code では、広範な
    `openclaw/plugin-sdk/config-runtime` compatibility barrel の import も避けるべきです。作業に一致する狭い SDK subpath を使用してください。

    | 必要なもの | Import |
    | --- | --- |
    | `OpenClawConfig` などの Config types | `openclaw/plugin-sdk/config-types` |
    | Already-loaded config assertions と plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Current runtime snapshot reads | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config writes | `openclaw/plugin-sdk/config-mutation` |
    | Session store helpers | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime helpers | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled plugins とその tests は、広範な barrel に対して scanner-guarded されているため、imports と mocks は必要な振る舞いに対して local に保たれます。広範な barrel は外部互換性のためにまだ存在しますが、新しい code はそれに依存すべきではありません。

  </Step>

  <Step title="Pi tool-result extensions を middleware へ移行する">
    Bundled plugins は、Pi 専用の
    `api.registerEmbeddedExtensionFactory(...)` tool-result handlers を runtime-neutral middleware に置き換える必要があります。

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同時に plugin manifest を更新してください。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    External plugins は tool-result middleware を登録できません。model が見る前に high-trust tool output を書き換えられるためです。

  </Step>

  <Step title="approval-native handlers を capability facts へ移行する">
    Approval-capable channel plugins は、`approvalCapability.nativeRuntime` と共有 runtime-context registry を通じて native approval behavior を公開するようになりました。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を `approvalCapability.nativeRuntime` に置き換える
    - approval-specific auth/delivery を legacy `plugin.auth` / `plugin.approvals` wiring から `approvalCapability` へ移動する
    - `ChannelPlugin.approvals` は public channel-plugin contract から削除されています。delivery/native/render fields を `approvalCapability` へ移動してください
    - `plugin.auth` は channel login/logout flows 専用として残ります。そこにある approval auth hooks は core によってもう読み取られません
    - clients、tokens、Bolt apps などの channel-owned runtime objects は `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - native approval handlers から plugin-owned reroute notices を送信しないでください。core は現在、実際の delivery results から routed-elsewhere notices を所有しています
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、実際の `createPluginRuntime().channel` surface を提供してください。partial stubs は拒否されます。

    現在の approval capability layout については `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows wrapper fallback behavior を監査する">
    plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、未解決の Windows `.cmd`/`.bat` wrappers は、明示的に `allowShellFallback: true` を渡さない限り fail closed するようになりました。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    呼び出し元が shell fallback に意図的に依存していない場合は、`allowShellFallback` を設定せず、代わりに thrown error を処理してください。

  </Step>

  <Step title="非推奨 imports を見つける">
    plugin で、いずれかの非推奨サーフェスからの imports を検索してください。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="focused imports に置き換える">
    古いサーフェスの各 export は、特定のモダンな import path に対応します。

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    host-side helpers については、直接 import する代わりに injected plugin runtime を使用してください:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは、他のレガシーブリッジヘルパーにも適用されます。

    | 古いインポート | 新しい同等機能 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | セッションストアヘルパー | `api.runtime.agent.session.*` |

  </Step>

  <Step title="広範な infra-runtime インポートを置き換える">
    `openclaw/plugin-sdk/infra-runtime` は外部互換性のために引き続き存在しますが、新しいコードでは実際に必要な対象を絞ったヘルパーサーフェスをインポートする必要があります。

    | 必要なもの | インポート |
    | --- | --- |
    | システムイベントキューヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat イベントと可視性ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中配送キューのドレイン | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャンネルアクティビティのテレメトリー | `openclaw/plugin-sdk/channel-activity-runtime` |
    | インメモリ重複排除キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル/メディアパスヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | ディスパッチャー対応 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシおよびガード付き fetch ヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF ディスパッチャーポリシー型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト/解決型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認返信ペイロードとコマンドヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラーフォーマットヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポート準備完了待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | セキュアトークンヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 境界付き非同期タスク同時実行 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数値の強制変換 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカル非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドルされた plugins は `infra-runtime` に対してスキャナーでガードされているため、リポジトリコードが広範な barrel に戻ることはできません。

  </Step>

  <Step title="チャンネルルートヘルパーを移行する">
    新しいチャンネルルートコードでは `openclaw/plugin-sdk/channel-route` を使用する必要があります。
    古い route-key 名と comparable-target 名は移行期間中の互換エイリアスとして残りますが、新しい plugins では動作を直接説明するルート名を使用する必要があります。

    | 古いヘルパー | 新しいヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    新しいルートヘルパーは、ネイティブ承認、返信抑制、受信重複排除、cron 配送、セッションルーティング全体で `{ channel, to, accountId, threadId }` を一貫して正規化します。Plugin がカスタムターゲット文法を所有している場合は、`resolveChannelRouteTargetWithParser(...)` を使用して、そのパーサーを同じルートターゲット契約に適合させてください。

  </Step>

  <Step title="ビルドしてテストする">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## インポートパスリファレンス

  <Accordion title="一般的なインポートパス表">
  | インポートパス | 目的 | 主要なエクスポート |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規の plugin エントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルエントリ定義/ビルダー用のレガシー包括再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーエントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | チャネルエントリ定義とビルダーに特化 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | 許可リストプロンプト、セットアップステータスビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | インポート安全なセットアップパッチアダプター、検索メモヘルパー、`promptResolvedAllowFrom`, `splitSetupEntries`, 委譲セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | セットアップアダプターヘルパー | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | セットアップツール用ヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数アカウントヘルパー | アカウント一覧/設定/アクションゲートヘルパー |
  | `plugin-sdk/account-id` | アカウント ID ヘルパー | `DEFAULT_ACCOUNT_ID`, アカウント ID 正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索 + デフォルトフォールバックヘルパー |
  | `plugin-sdk/account-helpers` | 限定的なアカウントヘルパー | アカウント一覧/アカウントアクションヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM ペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、ソース配信の配線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリと DM アクセスヘルパー | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャネル設定スキーマプリミティブと汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | バンドル設定スキーマ | OpenClaw が保守するバンドル済み plugins のみ。新しい plugins は plugin ローカルのスキーマを定義する必要があります |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨のバンドル設定スキーマ | 互換性エイリアスのみ。保守対象のバンドル済み plugins には `plugin-sdk/bundled-channel-config-schema` を使用してください |
  | `plugin-sdk/telegram-command-config` | Telegram コマンド設定ヘルパー | コマンド名の正規化、説明のトリミング、重複/競合の検証 |
  | `plugin-sdk/channel-policy` | グループ/DM ポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | アカウントステータスとドラフトストリームライフサイクルヘルパー | `createAccountStatusSink`, ドラフトプレビュー確定ヘルパー |
  | `plugin-sdk/inbound-envelope` | 受信エンベロープヘルパー | 共有ルート + エンベロープビルダーヘルパー |
  | `plugin-sdk/inbound-reply-dispatch` | 受信返信ヘルパー | 共有記録およびディスパッチヘルパー |
  | `plugin-sdk/messaging-targets` | メッセージングターゲットの解析 | ターゲット解析/照合ヘルパー |
  | `plugin-sdk/outbound-media` | 送信メディアヘルパー | 共有送信メディア読み込み |
  | `plugin-sdk/outbound-send-deps` | 送信依存関係ヘルパー | 完全な送信ランタイムをインポートしない軽量な `resolveOutboundSendDep` 検索 |
  | `plugin-sdk/outbound-runtime` | 送信ランタイムヘルパー | 送信配信、ID/送信委譲、セッション、フォーマット、ペイロード計画ヘルパー |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーメディアペイロードヘルパー | レガシーフィールドレイアウト用のエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性シム | レガシーチャネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続的な plugin ストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム/ロギング/バックアップ/plugin インストールヘルパー |
  | `plugin-sdk/runtime-env` | 限定的なランタイム環境ヘルパー | ロガー/ランタイム環境、タイムアウト、リトライ、バックオフヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有 plugin ランタイムヘルパー | Plugin コマンド/フック/http/インタラクティブヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有 Webhook/内部フックパイプラインヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有 exec ヘルパー |
  | `plugin-sdk/cli-runtime` | CLI ランタイムヘルパー | コマンドフォーマット、待機、バージョンヘルパー |
  | `plugin-sdk/gateway-runtime` | Gateway ヘルパー | Gateway クライアント、イベントループ準備完了時の開始ヘルパー、チャネルステータスパッチヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換性シム | `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` を優先 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンドヘルパー | バンドルされた Telegram コントラクトサーフェスが利用できない場合のフォールバック安定な Telegram コマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | Exec/plugin 承認ペイロード、承認ケイパビリティ/プロファイルヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、構造化承認表示パスフォーマット |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者の解決、同一チャットアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブ exec 承認プロファイル/フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認ケイパビリティ/配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認 Gateway ヘルパー | 共有承認 Gateway 解決ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットチャネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より限定的なアダプター/Gateway シームを優先 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認ターゲット/アカウントバインディングヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | Exec/plugin 承認返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャネルランタイムコンテキストヘルパー | 汎用チャネルランタイムコンテキストの登録/取得/監視ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有の信頼、DM ゲーティング、外部コンテンツ、シークレット収集ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRF ポリシーヘルパー | ホスト許可リストとプライベートネットワークポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRF ランタイムヘルパー | 固定ディスパッチャー、保護付き fetch、SSRF ポリシーヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat ヘルパー | Heartbeat イベントと可視性ヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | インメモリ重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル/メディアパスヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 境界付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲーティングヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラーフォーマットヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`, エラーグラフヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップ済み fetch/proxy ヘルパー | `resolveFetch`, proxy ヘルパー、EnvHttpProxyAgent オプションヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | リトライヘルパー | `RetryConfig`, `retryAsync`, ポリシーランナー |
  | `plugin-sdk/allow-from` | 許可リストフォーマット | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 許可リスト入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲーティングとコマンドサーフェスヘルパー | `resolveControlCommandGate`, 送信者認可ヘルパー、動的引数メニューフォーマットを含むコマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンドステータス/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhook リクエストヘルパー | Webhook ターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook ボディガードヘルパー | リクエストボディ読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | 受信ディスパッチ、heartbeat、返信プランナー、チャンク化 |
  | `plugin-sdk/reply-dispatch-runtime` | 限定的な返信ディスパッチヘルパー | 確定、プロバイダーディスパッチ、会話ラベルヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 返信参照計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト/Markdown チャンク化ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | ストアパス + 更新日時ヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態と OAuth ディレクトリヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキーヘルパー | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャネルステータスヘルパー | チャネル/アカウントステータスサマリービルダー、ランタイム状態のデフォルト、問題メタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲットリゾルバーヘルパー | 共有ターゲットリゾルバーヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | スラッグ/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエスト URL ヘルパー | リクエスト風入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化された stdout/stderr を持つ時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 一般的なツール/CLI パラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化されたペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から正規の送信先フィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有の一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーとリダクションヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdown テーブルヘルパー | Markdown テーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホストプロバイダーセットアップヘルパー | セルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホストプロバイダーに特化したセットアップヘルパー | 同じセルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイム API キー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダー API キーセットアップヘルパー | API キーのオンボーディング/プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダー認証結果ヘルパー | 標準 OAuth 認証結果ビルダー |
  | `plugin-sdk/provider-auth-login` | プロバイダー対話型ログインヘルパー | 共有の対話型ログインヘルパー |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択ヘルパー | 設定済みまたは自動のプロバイダー選択と生のプロバイダー設定のマージ |
  | `plugin-sdk/provider-env-vars` | プロバイダー環境変数ヘルパー | プロバイダー認証環境変数検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル/リプレイヘルパー | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、モデル ID 正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログヘルパー | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダー HTTP ヘルパー | 汎用プロバイダー HTTP/エンドポイント機能ヘルパー。音声文字起こしの multipart フォームヘルパーを含む |
  | `plugin-sdk/provider-web-fetch` | プロバイダー Web フェッチヘルパー | Web フェッチプロバイダーの登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダー Web 検索設定ヘルパー | プラグイン有効化の配線を必要としないプロバイダー向けの限定的な Web 検索設定/認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダー Web 検索コントラクトヘルパー | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター/ゲッターなどの限定的な Web 検索設定/認証情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダー Web 検索ヘルパー | Web 検索プロバイダーの登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール/スキーマ互換ヘルパー | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini スキーマクリーンアップ + 診断、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI 互換ヘルパー |
  | `plugin-sdk/provider-usage` | プロバイダー使用量ヘルパー | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、その他のプロバイダー使用量ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ストリームラッパー型、および共有の Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダートランスポートヘルパー | ガード付き fetch、トランスポートメッセージ変換、書き込み可能なトランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディアの取得/変換/保存ヘルパー、ffprobe を使用した動画寸法の検出、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像/動画/音楽生成向けの共有フェイルオーバーヘルパー、候補選択、モデル不足メッセージ |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダー型と、プロバイダー向け画像/音声ヘルパーエクスポート |
  | `plugin-sdk/text-runtime` | 共有テキストヘルパー | アシスタントに表示されるテキストの除去、Markdown レンダリング/チャンク化/テーブルヘルパー、リダクションヘルパー、ディレクティブタグヘルパー、安全なテキストユーティリティ、関連するテキスト/ロギングヘルパー |
  | `plugin-sdk/text-chunking` | テキストチャンク化ヘルパー | 送信テキストチャンク化ヘルパー |
  | `plugin-sdk/speech` | 音声ヘルパー | 音声プロバイダー型と、プロバイダー向けディレクティブ、レジストリ、検証ヘルパー、OpenAI 互換 TTS ビルダー |
  | `plugin-sdk/speech-core` | 共有音声コア | 音声プロバイダー型、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダー型、レジストリ/解決ヘルパー、ブリッジセッションヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成プロバイダー型と、画像アセット/データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成型、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成プロバイダー/リクエスト/結果型 |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/interactive-runtime` | 対話型返信ヘルパー | 対話型返信ペイロードの正規化/削減 |
  | `plugin-sdk/channel-config-primitives` | チャンネル設定プリミティブ | 限定的なチャンネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャンネル設定書き込みヘルパー | チャンネル設定書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャンネルプレリュード | 共有チャンネルプラグインプレリュードエクスポート |
  | `plugin-sdk/channel-status` | チャンネル状態ヘルパー | 共有チャンネル状態スナップショット/要約ヘルパー |
  | `plugin-sdk/allowlist-config-edit` | 許可リスト設定ヘルパー | 許可リスト設定の編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm` | ダイレクト DM ヘルパー | 共有ダイレクト DM 認証/ガードヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張機能ヘルパー | パッシブチャンネル/状態とアンビエントプロキシのヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhook ターゲットヘルパー | Webhook ターゲットレジストリとルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | Webhook パスヘルパー | Webhook パス正規化ヘルパー |
  | `plugin-sdk/web-media` | 共有 Web メディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | Zod 再エクスポート | プラグイン SDK 利用者向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | バンドルされた memory-core ヘルパー | メモリマネージャー/設定/ファイル/CLI ヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス/検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンのエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。具体的なリモートプロバイダーはそれぞれを所有するプラグイン内に存在 |
  | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジン | メモリホスト QMD エンジンのエクスポート |
  | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジン | メモリホストストレージエンジンのエクスポート |
  | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー | メモリホストマルチモーダルヘルパー |
  | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー | メモリホストクエリヘルパー |
  | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー | メモリホストシークレットヘルパー |
  | `plugin-sdk/memory-core-host-events` | メモリホストイベントジャーナルヘルパー | メモリホストイベントジャーナルヘルパー |
  | `plugin-sdk/memory-core-host-status` | メモリホスト状態ヘルパー | メモリホスト状態ヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイム | メモリホスト CLI ランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイム | メモリホストコアランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー | メモリホストファイル/ランタイムヘルパー |
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | メモリホストコアランタイムヘルパーのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | メモリホストイベントジャーナルヘルパーのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-files` | メモリホストファイル/ランタイムエイリアス | メモリホストファイル/ランタイムヘルパーのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-markdown` | 管理対象 Markdown ヘルパー | メモリ隣接プラグイン向けの共有管理対象 Markdown ヘルパー |
  | `plugin-sdk/memory-host-search` | Active Memory 検索ファサード | 遅延 Active Memory 検索マネージャーランタイムファサード |
  | `plugin-sdk/memory-host-status` | メモリホスト状態エイリアス | メモリホスト状態ヘルパーのベンダー中立エイリアス |
  | `plugin-sdk/testing` | テストユーティリティ | レガシーの広範な互換性バレル。`plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures` などの特化したテストサブパスを優先 |
</Accordion>

この表は意図的に、完全な SDK サーフェスではなく、共通の移行サブセットにしています。200 件以上のエントリーポイントの完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json`
にあります。

予約済みの同梱 Plugin ヘルパーシームは、公開 SDK のエクスポートマップから廃止されました。ただし、公開済み
`@openclaw/discord@2026.3.13` パッケージ向けに保持されている非推奨の `plugin-sdk/discord` シムのような、明示的に文書化された互換ファサードは例外です。所有者固有のヘルパーは、所有元の Plugin パッケージ内に置かれます。共有ホスト動作は、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` のような汎用 SDK コントラクトを通すべきです。

作業に合う最も狭いインポートを使用してください。エクスポートが見つからない場合は、`src/plugin-sdk/` のソースを確認するか、どの汎用コントラクトがそれを所有すべきかメンテナーに確認してください。

## 有効な非推奨項目

Plugin SDK、プロバイダーコントラクト、ランタイムサーフェス、マニフェスト全体に適用される、より狭い非推奨項目です。いずれも現在はまだ動作しますが、将来のメジャーリリースで削除されます。各項目の下のエントリーは、古い API を正規の置き換え先に対応付けています。

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **新 (`openclaw/plugin-sdk/command-status`)**: 同じシグネチャ、同じ
    エクスポートです。より狭いサブパスからインポートするだけです。`command-auth`
    は互換スタブとしてそれらを再エクスポートします。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **旧**: `openclaw/plugin-sdk/channel-inbound` または
    `openclaw/plugin-sdk/channel-mention-gating` の
    `resolveInboundMentionRequirement({ facts, policy })` と
    `shouldDropInboundForMention(...)`。

    **新**: `resolveInboundMentionDecision({ facts, policy })`。2 つの呼び出しに分割する代わりに、
    単一の判断オブジェクトを返します。

    下流のチャネル Plugin（Slack、Discord、Matrix、MS Teams）はすでに
    切り替え済みです。

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` は古い
    チャネル Plugin 向けの互換シムです。新しいコードからはインポートせず、ランタイム
    オブジェクトの登録には `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、
    生の「actions」チャネルエクスポートとともに非推奨です。代わりに、意味的な
    `presentation` サーフェスを通じてケイパビリティを公開してください。つまり、チャネル Plugin は
    受け付ける生のアクション名ではなく、レンダリングするもの（カード、ボタン、セレクト）を
    宣言します。

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()`
    ファクトリ。

    **新**: プロバイダー Plugin に直接 `createTool(...)` を実装します。
    OpenClaw はツールラッパーを登録するための SDK ヘルパーをもう必要としません。

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **旧**: 受信チャネルメッセージからフラットなプレーンテキストのプロンプト
    エンベロープを構築する `formatInboundEnvelope(...)`（および
    `ChannelMessageForAgent.channelEnvelope`）。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャネル
    Plugin は、ルーティングメタデータ（スレッド、トピック、返信先、リアクション）を
    プロンプト文字列に連結する代わりに、型付きフィールドとして添付します。
    `formatAgentEnvelope(...)` ヘルパーは、合成されたアシスタント向け
    エンベロープでは引き続きサポートされていますが、受信プレーンテキストエンベロープは
    廃止へ向かっています。

    影響範囲: `inbound_claim`、`message_received`、および
    `channelEnvelope` テキストを後処理していたカスタム
    チャネル Plugin。

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    4 つの discovery 型エイリアスは、現在では
    catalog 時代の型に対する薄いラッパーです。

    | 古いエイリアス                 | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    加えて、従来の `ProviderCapabilities` 静的バッグも該当します。プロバイダー Plugin は
    静的オブジェクトではなく、`buildReplayPolicy`、
    `normalizeToolSchemas`、`wrapStreamFn` のような明示的なプロバイダーフックを
    使用すべきです。

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上の 3 つの個別フック）:
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 正規の `id`、任意の `label`、ランク付けされたレベル一覧を持つ
    `ProviderThinkingProfile` を返す単一の `resolveThinkingProfile(ctx)`。
    OpenClaw は、古く保存された値をプロファイルランクに基づいて自動的にダウングレードします。

    3 つではなく 1 つのフックを実装してください。従来のフックは非推奨期間中も
    動作し続けますが、プロファイル結果とは合成されません。

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **旧**: Plugin マニフェストでプロバイダーを宣言せずに
    `resolveExternalOAuthProfiles(...)` を実装すること。

    **新**: Plugin マニフェストで `contracts.externalAuthProviders` を宣言し、
    **かつ** `resolveExternalAuthProfiles(...)` を実装します。古い「auth
    fallback」経路はランタイムで警告を出し、削除される予定です。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **旧**マニフェストフィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **新**: 同じ環境変数検索をマニフェスト上の `setup.providers[].envVars` に
    ミラーします。これにより、セットアップ/ステータス用の環境メタデータが 1 か所に統合され、
    環境変数検索に答えるためだけに Plugin ランタイムを起動する必要がなくなります。

    `providerAuthEnvVars` は、非推奨期間が終了するまで互換アダプター経由で
    引き続きサポートされます。

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **旧**: 3 つの個別呼び出し —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **新**: memory-state API 上の 1 回の呼び出し —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    同じスロットを単一の登録呼び出しにまとめます。追加型のメモリヘルパー
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）は影響を受けません。

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    `src/plugins/runtime/types.ts` からまだエクスポートされている 2 つの従来型エイリアス:

    | 旧                           | 新                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は、
    `getSessionMessages` を優先するため非推奨です。同じシグネチャで、古いメソッドは
    新しいメソッドへ委譲します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow`（単数）はライブのタスクフローアクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、フローから子タスクを作成、更新、キャンセル、
    または実行する Plugin 向けに、管理対象 TaskFlow 変更ランタイムを保持します。
    Plugin が DTO ベースの読み取りだけを必要とする場合は `runtime.tasks.flows` を使用してください。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    上記の「移行方法 → Pi ツール結果拡張をミドルウェアへ移行する」で説明しています。
    完全性のためここにも含めます。削除された Pi 専用の
    `api.registerEmbeddedExtensionFactory(...)` 経路は、
    `contracts.agentToolResultMiddleware` の明示的なランタイム一覧を伴う
    `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は、
    現在 `OpenClawConfig` の 1 行エイリアスです。正規名を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 配下の同梱チャネル/プロバイダー Plugin 内の拡張レベルの非推奨項目は、
それぞれの `api.ts` と `runtime-api.ts` バレル内で追跡されています。
これらはサードパーティ Plugin コントラクトには影響せず、ここには掲載していません。
同梱 Plugin のローカルバレルを直接利用している場合は、アップグレード前に
そのバレル内の非推奨コメントを読んでください。
</Note>

## 削除タイムライン

| 時期                   | 起きること                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**                | 非推奨サーフェスはランタイム警告を出します                               |
| **次のメジャーリリース** | 非推奨サーフェスは削除され、それらをまだ使用している Plugin は失敗します |

すべてのコア Plugin はすでに移行済みです。外部 Plugin は
次のメジャーリリース前に移行してください。

## 警告を一時的に抑制する

移行作業中は、これらの環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な逃げ道であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初の Plugin を構築する
- [SDK 概要](/ja-JP/plugins/sdk-overview) — サブパスインポートの完全なリファレンス
- [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) — チャネル Plugin の構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) — プロバイダー Plugin の構築
- [Plugin 内部構造](/ja-JP/plugins/architecture) — アーキテクチャの詳細解説
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマリファレンス
