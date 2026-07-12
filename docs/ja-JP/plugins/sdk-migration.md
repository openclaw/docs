---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - OpenClaw 2026.4.25 より前に api.registerEmbeddedExtensionFactory を使用していた場合
    - Pluginを最新のPluginアーキテクチャに更新しています
    - 外部の OpenClaw Plugin を保守している場合
sidebarTitle: Migrate to SDK
summary: 従来の後方互換性レイヤーから最新のプラグイン SDK へ移行する
title: Plugin SDK の移行
x-i18n:
    generated_at: "2026-07-12T14:44:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 805fa6b1492cec8bb0e4967a6b6606c91016a43ec5a3eb7d048e83aa7721704e
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw は、広範な後方互換性レイヤーを、小さく目的を絞ったインポートで構成される最新の Plugin
アーキテクチャに置き換えました。お使いの Plugin がこの変更より前に作成されたものである場合、
このガイドに従って現在のコントラクトへ移行できます。

## 変更内容

以前は、2 つの制限の緩いインポートサーフェスにより、Plugin は単一のエントリポイントから
ほぼあらゆる機能にアクセスできました。

- **`openclaw/plugin-sdk/compat`** - 新しいアーキテクチャの構築中も
  古いフックベースの Plugin が動作するよう、多数のヘルパーを再エクスポートしていました。
- **`openclaw/plugin-sdk/infra-runtime`** - システムイベント、Heartbeat 状態、
  配信キュー、フェッチ／プロキシヘルパー、ファイルヘルパー、承認型、および無関係な
  ユーティリティが混在する広範なバレルでした。
- **`openclaw/plugin-sdk/config-runtime`** - 移行期間中、非推奨の直接読み込み／
  書き込みヘルパーを引き続き含んでいた広範な設定バレルでした。
- **`openclaw/extension-api`** - 組み込みエージェントランナーなど、ホスト側の
  ヘルパーへの直接アクセスを Plugin に提供するブリッジでした。
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` などの
  組み込みランナーイベントを監視していた、削除済みの組み込みランナー専用フックです。
  代わりにエージェントのツール結果ミドルウェアを使用してください
  （[組み込みツール結果拡張機能をミドルウェアへ移行する](#how-to-migrate)を参照）。

これらのサーフェスは**非推奨**です。現在も動作しますが、新しい Plugin では使用してはならず、
既存の Plugin も、次のメジャーリリースで削除される前に移行する必要があります。
`registerEmbeddedExtensionFactory` はすでに削除されており、従来の登録は読み込まれません。

<Warning>
  後方互換性レイヤーは、将来のメジャーリリースで削除されます。その時点でもこれらの
  サーフェスからインポートしている Plugin は動作しなくなります。
</Warning>

OpenClaw は、代替機能を導入するのと同じ変更で、文書化された Plugin の動作を削除したり、
解釈を変更したりすることはありません。コントラクトを破壊する変更では、最初に互換性アダプター、
診断、ドキュメント、および非推奨期間が提供されます。これは SDK インポート、マニフェストフィールド、
セットアップ API、フック、およびランタイム登録の動作に適用されます。

### 理由

- **起動が遅い** - 1 つのヘルパーをインポートするだけで、無関係な多数のモジュールが
  読み込まれていました。
- **循環依存** - 広範な再エクスポートにより、インポートサイクルが容易に
  発生していました。
- **不明確な API サーフェス** - 安定したエクスポートと内部用エクスポートを
  判別する方法がありませんでした。

現在、各 `openclaw/plugin-sdk/<subpath>` は、文書化されたコントラクトを持つ、小さく
自己完結したモジュールです。

バンドル済みチャンネル向けの従来のプロバイダー用簡易インターフェースも廃止されました。
チャンネル名を冠したヘルパーショートカットは、安定した Plugin コントラクトではなく、
プライベートなモノリポ用の簡易機能でした。代わりに、対象を絞った汎用 SDK サブパスを
使用してください。バンドル済み Plugin のワークスペース内では、プロバイダーが所有する
ヘルパーを、その Plugin 独自の `api.ts` または `runtime-api.ts` に保持してください。

- Anthropic は、Claude 固有のストリームヘルパーを独自の `api.ts` /
  `contract-api.ts` インターフェースに保持します。
- OpenAI は、プロバイダービルダー、デフォルトモデルヘルパー、およびリアルタイム
  プロバイダービルダーを独自の `api.ts` に保持します。
- OpenRouter は、プロバイダービルダーおよびオンボーディング／設定ヘルパーを独自の
  `api.ts` に保持します。

## 互換性ポリシー

外部 Plugin の互換性対応は、次の順序で進めます。

1. 新しいコントラクトを追加します。
2. 互換性アダプターを介して古い動作を維持します。
3. 古いパスと代替機能を明示する診断または警告を出力します。
4. テストで両方のパスを対象にします。
5. 非推奨化と移行パスを文書化します。
6. 告知済みの移行期間が終了した後（通常はメジャーリリース時）にのみ
   削除します。

マニフェストフィールドが引き続き受け付けられる場合は、ドキュメントと診断で別途案内されるまで
使用し続けてください。新しいコードでは文書化された代替機能を優先する必要がありますが、
通常のマイナーリリースで既存の Plugin が動作しなくなることはありません。

現在の移行キューは `pnpm plugins:boundary-report` で監査できます。

| フラグ                                                  | 効果                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（または `pnpm plugins:boundary-report:summary`） | 完全な詳細の代わりにコンパクトな件数を表示します。                             |
| `--json`                                                | 機械可読形式のレポートを出力します。                                           |
| `--owner <id>`                                          | 1 つの Plugin または互換性所有者に絞り込みます。                               |
| `--fail-on-cross-owner`                                 | 所有者をまたぐ予約済み SDK インポートがある場合、0 以外で終了します。          |
| `--fail-on-eligible-compat`                             | 非推奨の互換性レコードの `removeAfter` 日付が経過している場合、0 以外で終了します。 |
| `--fail-on-unclassified-unused-reserved`                | 未使用の予約済み SDK シムがある場合、0 以外で終了します。                      |

`pnpm plugins:boundary-report:ci` は、3 つすべての失敗フラグを指定して実行されます。
各互換性レコードには、曖昧な「次のメジャーリリース」ではなく、明示的な `removeAfter` 日付が
設定されています。レポートは非推奨レコードをその日付でグループ化し、ローカルのコード／
ドキュメント参照を数え、所有者をまたぐ予約済み SDK インポートを明示し、プライベートな
メモリホスト SDK ブリッジを要約します。予約済み SDK サブパスには、追跡対象となる所有者の
使用実績が必要です。未使用の予約済みエクスポートは公開 SDK から削除する必要があります。

## 移行方法

<Steps>
  <Step title="ランタイム設定の読み込み／書き込みヘルパーを移行する">
    バンドル済み Plugin は、`api.runtime.config.loadConfig()` および
    `api.runtime.config.writeConfigFile(...)` の直接呼び出しを停止する必要があります。
    アクティブな呼び出しパスにすでに渡されている設定を優先してください。現在のプロセスの
    スナップショットが必要な長寿命ハンドラーでは、`api.runtime.config.current()` を使用できます。
    長寿命のエージェントツールでは、設定の書き込み前に作成されたツールでも更新後の設定を
    参照できるよう、`execute` 内で `ctx.getRuntimeConfig()` を読み取る必要があります。

    設定の書き込みには、明示的な書き込み後ポリシーを指定したトランザクションヘルパーを使用します。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    変更に Gateway のクリーンな再起動が必要な場合は
    `afterWrite: { mode: "restart", reason: "..." }` を使用し、呼び出し元が後続処理を所有し、
    意図的に再読み込みプランナーを抑制する場合に限り
    `afterWrite: { mode: "none", reason: "..." }` を使用してください。ミューテーション結果には、
    テストとログ記録用の型付き `followUp` サマリーが含まれます。再起動の適用または
    スケジュールについては、引き続き Gateway が責任を持ちます。

    `loadConfig` と `writeConfigFile` は、外部 Plugin 向けの非推奨互換性ヘルパーとして残り、
    `runtime-config-load-write` 互換性コードによる警告を一度だけ出力します。バンドル済み Plugin と
    リポジトリのランタイムコードは、`pnpm check:deprecated-api-usage` および
    `pnpm check:no-runtime-action-load-config` によって保護されます。新しい本番 Plugin での
    使用は即座に失敗し、設定の直接書き込みも失敗します。また、Gateway サーバーメソッドは
    リクエストのランタイムスナップショットを使用し、ランタイムのチャンネル送信／アクション／
    クライアントヘルパーは境界から設定を受け取る必要があり、長寿命のランタイムモジュールでは
    暗黙的な `loadConfig()` 呼び出しは一切許可されません。

    新しい Plugin コードでは、広範な `openclaw/plugin-sdk/config-runtime` バレルを
    使用しないでください。用途に応じた対象の狭いサブパスを使用します。

    | 必要な機能 | インポート |
    | --- | --- |
    | `OpenClawConfig` などの設定型 | `openclaw/plugin-sdk/config-contracts` |
    | 読み込み済み設定のアサーションと Plugin エントリの設定検索 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 現在のランタイムスナップショットの読み取り | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定の書き込み | `openclaw/plugin-sdk/config-mutation` |
    | セッションストアヘルパー | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown テーブル設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | グループポリシーのランタイムヘルパー | `openclaw/plugin-sdk/runtime-group-policy` |
    | シークレット入力の解決 | `openclaw/plugin-sdk/secret-input-runtime` |
    | モデル／セッションのオーバーライド | `openclaw/plugin-sdk/model-session-runtime` |

    バンドル済み Plugin とそのテストは、インポートとモックが必要な動作のローカル範囲に
    留まるよう、この広範なバレルの使用をスキャナーで禁止されています。このバレルは外部との
    互換性のために引き続き存在しますが、新しいコードでは依存しないでください。

  </Step>

  <Step title="組み込みツール結果拡張機能をミドルウェアへ移行する">
    バンドル済み Plugin では、組み込みランナー専用の
    `api.registerEmbeddedExtensionFactory(...)` ツール結果ハンドラーを、
    ランタイムに依存しないミドルウェアへ置き換える必要があります。

    ```typescript
    // OpenClaw および Codex ランタイムの動的ツール
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    同時に Plugin マニフェストも更新します。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    インストール済み Plugin も、明示的に有効化され、対象となるすべてのランタイムが
    `contracts.agentToolResultMiddleware` で宣言されている場合、ツール結果ミドルウェアを
    登録できます。宣言されていないインストール済みミドルウェアの登録は拒否されます。

  </Step>

  <Step title="承認ネイティブハンドラーをケイパビリティファクトへ移行する">
    承認機能を持つチャンネル Plugin は、`approvalCapability.nativeRuntime` と共有の
    ランタイムコンテキストレジストリを通じて、ネイティブ承認動作を公開します。

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換えます。
    - 承認固有の認証／配信を、従来の `plugin.auth` /
      `plugin.approvals` の配線から `approvalCapability` へ移動します。
    - `ChannelPlugin.approvals` は公開チャンネル Plugin コントラクトから削除されました。
      配信／ネイティブ／レンダリングの各フィールドを `approvalCapability` へ移動します。
    - `plugin.auth` はチャンネルのログイン／ログアウトフロー専用として残ります。コアは
      そこにある承認認証フックを読み取らなくなりました。
    - チャンネル所有のランタイムオブジェクト（クライアント、トークン、Bolt アプリ）は、
      `openclaw/plugin-sdk/channel-runtime-context` を通じて登録します。
    - ネイティブ承認ハンドラーから Plugin 所有の再ルーティング通知を送信しないでください。
      実際の配信結果に基づく別経路へのルーティング通知は、コアが所有します。
    - `channelRuntime` を `createChannelManager(...)` に渡す場合は、実際の
      `createPluginRuntime().channel` サーフェスを指定してください。部分的なスタブは
      拒否されます。

    現在の承認ケイパビリティの構成については、[チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins)を
    参照してください。

  </Step>

  <Step title="Windows ラッパーのフォールバック動作を監査する">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、解決できない Windows の
    `.cmd`／`.bat` ラッパーは、`allowShellFallback: true` を明示的に渡さない限り、
    fail-closed するようになりました。

    ```typescript
    // 変更前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 変更後
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // シェルを介したフォールバックを意図的に受け入れる、信頼できる互換性呼び出し元でのみ
      // これを設定してください。
      allowShellFallback: true,
    });
    ```

    呼び出し元が意図的にシェルフォールバックへ依存していない場合は、
    `allowShellFallback` を設定せず、代わりにスローされたエラーを処理してください。

  </Step>

  <Step title="非推奨のインポートを検索する">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="目的を絞ったインポートに置き換える">
    古いサーフェスの各エクスポートは、それぞれ特定の最新インポートパスに対応します。

    ```typescript
    // 変更前（非推奨の後方互換性レイヤー）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 変更後（最新の目的別インポート）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    ホスト側のヘルパーでは、直接インポートする代わりに、注入されたPluginランタイムを使用します。

    ```typescript
    // 変更前（非推奨のextension-apiブリッジ）
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // 変更後（注入されたランタイム）
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    その他のレガシーブリッジヘルパーについても同じパターンを使用します。

    | 旧インポート | 最新の同等機能 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | セッションストアヘルパー | `api.runtime.agent.session.*` |

  </Step>

  <Step title="広範なinfra-runtimeインポートを置き換える">
    `openclaw/plugin-sdk/infra-runtime`は外部互換性のために引き続き存在しますが、
    新しいコードでは、実際に必要な目的別サーフェスをインポートしてください。

    | 用途 | インポート |
    | --- | --- |
    | システムイベントキューのヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeatのウェイク、イベント、可視性ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中の配信キューの排出 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャネルアクティビティのテレメトリ | `openclaw/plugin-sdk/channel-activity-runtime` |
    | インメモリおよび永続ストレージベースの重複排除キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル／メディアパスのヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | ディスパッチャー対応のfetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシおよび保護されたfetchのヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRFディスパッチャーポリシーの型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト／解決の型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認応答ペイロードおよびコマンドのヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラー整形ヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポート準備完了の待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全なトークンのヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 制限付き非同期タスク並行処理 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 証明可能な不変条件に対する必須値アサーション | `openclaw/plugin-sdk/expect-runtime` |
    | 数値への型変換 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカルの非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドルされたプラグインでは、スキャナーによって`infra-runtime`の使用が防止されるため、
    リポジトリ内のコードが広範なバレルインポートへ後戻りすることはありません。

  </Step>

  <Step title="チャネルルートヘルパーを移行する">
    新しいチャネルルートコードでは`openclaw/plugin-sdk/channel-route`を使用します。以前の
    ルートキー名および比較可能ターゲット名は、互換性エイリアスとして残されています。

    | 旧ヘルパー | 最新のヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    最新のルートヘルパーは、ネイティブ承認、返信抑制、受信時の重複排除、
    Cron配信、セッションルーティングのすべてで、`{ channel, to, accountId, threadId }`を
    一貫して正規化します。

    `ChannelMessagingAdapter.parseExplicitTarget`、パーサーベースの読み込み済みルートヘルパー
    （`parseExplicitTargetForLoadedChannel`、`resolveRouteTargetForLoadedChannel`）、
    または`plugin-sdk/channel-route`の`resolveChannelRouteTargetWithParser(...)`の
    新たな使用を追加しないでください。これらは非推奨であり、古いプラグインのためだけに残されています。
    新しいチャネルプラグインでは、ターゲットIDの正規化とディレクトリ未検出時のフォールバックに
    `messaging.targetResolver.resolveTarget(...)`を使用し、コアが早期にピア種別を必要とする場合は
    `messaging.inferTargetChatType(...)`を、プロバイダー固有のセッションおよびスレッドIDには
    `messaging.resolveOutboundSessionRoute(...)`を使用してください。

  </Step>

  <Step title="ビルドしてテストする">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## インポートパスのリファレンス

  <Accordion title="Common import path table">
  | インポートパス | 用途 | 主なエクスポート |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 標準 Plugin エントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルエントリの定義とビルダー向けのレガシーな包括的再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーのエントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | チャネルエントリに特化した定義とビルダー | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | セットアップ用トランスレーター、許可リストのプロンプト、セットアップ状態ビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時のランタイムヘルパー | `createSetupTranslator`、インポートセーフなセットアップパッチアダプター、検索注記ヘルパー、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | 非推奨のセットアップアダプターエイリアス | `plugin-sdk/setup-runtime` を使用 |
  | `plugin-sdk/setup-tools` | セットアップツールヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | マルチアカウントヘルパー | アカウント一覧、設定、アクションゲートのヘルパー |
  | `plugin-sdk/account-id` | アカウント ID ヘルパー | `DEFAULT_ACCOUNT_ID`、アカウント ID の正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索とデフォルトフォールバックのヘルパー |
  | `plugin-sdk/account-helpers` | 限定的なアカウントヘルパー | アカウント一覧とアカウントアクションのヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM ペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、送信元配信の接続 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリーと DM アクセスヘルパー | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャネル設定スキーマプリミティブと汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | バンドル済み設定スキーマ | OpenClaw が保守するバンドル済み Plugin のみ。新しい Plugin では Plugin ローカルのスキーマを定義する必要があります |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨のバンドル済み設定スキーマ | 互換性エイリアスのみ。保守対象のバンドル済み Plugin には `plugin-sdk/bundled-channel-config-schema` を使用 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンド設定ヘルパー | コマンド名の正規化、説明のトリミング、重複と競合の検証 |
  | `plugin-sdk/channel-policy` | グループ／DM ポリシーの解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/inbound-envelope` | 受信エンベロープヘルパー | 共有ルートとエンベロープビルダーのヘルパー |
  | `plugin-sdk/channel-inbound` | 受信処理ヘルパー | コンテキスト構築、書式設定、ルート、ランナー、準備済み返信のディスパッチ、ディスパッチ述語 |
  | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析インポートパス | 汎用ターゲット解析ヘルパーには `plugin-sdk/channel-targets`、ルート比較には `plugin-sdk/channel-route`、プロバイダー固有のターゲット解決には Plugin 所有の `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` を使用 |
  | `plugin-sdk/outbound-media` | 送信メディアヘルパー | 共有送信メディアの読み込み |
  | `plugin-sdk/outbound-send-deps` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/channel-outbound` | 送信メッセージのライフサイクルヘルパー | メッセージアダプター、受領確認、永続的な送信ヘルパー、ライブプレビュー／ストリーミングヘルパー、返信オプション、ライフサイクルヘルパー、送信元 ID、ペイロード計画 |
  | `plugin-sdk/channel-streaming` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/outbound-runtime` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーなメディアペイロードヘルパー | レガシーなフィールドレイアウト用のエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性シム | レガシーなチャネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続的な Plugin ストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム、ログ記録、バックアップ、Plugin インストールのヘルパー |
  | `plugin-sdk/runtime-env` | 限定的なランタイム環境ヘルパー | ロガー／ランタイム環境、タイムアウト、再試行、バックオフのヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有 Plugin ランタイムヘルパー | Plugin のコマンド、フック、HTTP、インタラクティブ機能のヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有 Webhook／内部フックパイプラインのヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有実行ヘルパー |
  | `plugin-sdk/cli-runtime` | CLI ランタイムヘルパー | コマンドの書式設定、待機、バージョンのヘルパー |
  | `plugin-sdk/gateway-runtime` | Gateway ヘルパー | Gateway クライアント、イベントループ準備済みの開始ヘルパー、通知対象 LAN ホストの解決、チャネル状態パッチヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換性シム | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` を優先 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンドヘルパー | バンドル済み Telegram コントラクトのサーフェスを利用できない場合の、フォールバックでも安定した Telegram コマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | 実行／Plugin 承認ペイロード、承認機能／プロファイルのヘルパー、ネイティブ承認ルーティング／ランタイムヘルパー、構造化された承認表示パスの書式設定 |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者の解決、同一チャット内アクションの認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブ実行承認のプロファイル／フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認機能／配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認 Gateway ヘルパー | 共有承認 Gateway リゾルバー |
  | `plugin-sdk/approval-reference-runtime` | 承認トランスポート参照 | コールバックに制限があるトランスポート向けの決定論的で永続的なロケーターヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットなチャネルエントリポイント向けの軽量なネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーのランタイムヘルパー。より限定的なアダプター／Gateway の境界で十分な場合は、そちらを優先 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認のターゲット／アカウントバインディングヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | 実行／Plugin 承認の返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャネルランタイムコンテキストヘルパー | 汎用チャネルランタイムコンテキストの登録／取得／監視ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有信頼、DM ゲート、ルート内に制限されたファイル／パス、外部コンテンツ、シークレット収集のヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRF ポリシーヘルパー | ホスト許可リストとプライベートネットワークポリシーのヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRF ランタイムヘルパー | 固定ディスパッチャー、保護されたフェッチ、SSRF ポリシーのヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat ヘルパー | Heartbeat のウェイク、イベント、可視性のヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | インメモリおよび永続ストレージ基盤の重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル／メディアパスのヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備状態ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | 実行承認ポリシーヘルパー | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 容量制限付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲートヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラーヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`、エラーグラフヘルパー、`PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | ラップされたフェッチ／プロキシヘルパー | `resolveFetch`、プロキシヘルパー、EnvHttpProxyAgent オプションヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 再試行ヘルパー | `RetryConfig`, `retryAsync`、ポリシーランナー |
  | `plugin-sdk/allow-from` | 許可リストの書式設定と入力マッピング | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲートとコマンドサーフェスのヘルパー | `resolveControlCommandGate`、送信者認可ヘルパー、動的引数メニューの書式設定を含むコマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンド状態／ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力の解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhook リクエストヘルパー | Webhook ターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook 本文ガードヘルパー | リクエスト本文の読み取り／制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | 受信ディスパッチ、Heartbeat、返信プランナー、チャンク分割 |
  | `plugin-sdk/reply-dispatch-runtime` | 限定的な返信ディスパッチヘルパー | 確定処理、プロバイダーディスパッチ、会話ラベルのヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `createChannelHistoryWindow`。`buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` などの非推奨マップヘルパー互換性エクスポート |
  | `plugin-sdk/reply-reference` | 返信参照の計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト／Markdown のチャンク分割ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | スコープ付きセッション行ヘルパー、ストアパスヘルパー、更新日時の読み取り |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態および OAuth ディレクトリのヘルパー |
  | `plugin-sdk/routing` | ルーティング／セッションキーヘルパー | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャネルステータスヘルパー | チャネル／アカウントのステータス概要ビルダー、ランタイム状態のデフォルト、問題メタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲット解決ヘルパー | 共有ターゲット解決ヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | スラッグ／文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエスト URL ヘルパー | リクエスト風の入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化された stdout／stderr を返す時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメータリーダー | 共通のツール／CLI パラメータリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化されたペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信情報抽出 | ツール引数から正規の送信先フィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーおよび秘匿化ヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdown テーブルヘルパー | Markdown テーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル／セルフホスト型プロバイダー設定ヘルパー | セルフホスト型プロバイダーの検出／設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホスト型プロバイダー向けの特化設定ヘルパー | 同じセルフホスト型プロバイダーの検出／設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイム API キー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダー API キー設定ヘルパー | API キーのオンボーディング／プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダー認証結果ヘルパー | 標準 OAuth 認証結果ビルダー |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択ヘルパー | 設定済みまたは自動のプロバイダー選択と生のプロバイダー設定のマージ |
  | `plugin-sdk/provider-env-vars` | プロバイダー環境変数ヘルパー | プロバイダー認証環境変数の検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル／リプレイヘルパー | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、モデル ID 正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログヘルパー | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダー HTTP ヘルパー | 音声文字起こし用マルチパートフォームヘルパーを含む、汎用プロバイダー HTTP／エンドポイント機能ヘルパー |
  | `plugin-sdk/provider-web-fetch` | プロバイダー Web フェッチヘルパー | Web フェッチプロバイダーの登録／キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダー Web 検索設定ヘルパー | Plugin 有効化の配線を必要としないプロバイダー向けの限定的な Web 検索設定／認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダー Web 検索コントラクトヘルパー | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター／ゲッターなどの限定的な Web 検索設定／認証情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダー Web 検索ヘルパー | Web 検索プロバイダーの登録／キャッシュ／ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール／スキーマ互換性ヘルパー | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek／Gemini／OpenAI のスキーマクリーンアップおよび診断 |
  | `plugin-sdk/provider-usage` | プロバイダー使用量ヘルパー | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`、その他のプロバイダー使用量ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、共有の Anthropic／Bedrock／DeepSeek V4／Google／Kilocode／Moonshot／OpenAI／OpenRouter／Z.A.I／MiniMax／Copilot ラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダー転送ヘルパー | ガード付きフェッチ、ツール結果テキスト抽出、転送メッセージ変換、書き込み可能な転送イベントストリームなどのネイティブプロバイダー転送ヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディアの取得／変換／保存ヘルパー、ffprobe を利用した動画サイズの調査、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像／動画／音楽生成向けの共有フェイルオーバーヘルパー、候補選択、モデル不足メッセージ |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダー型と、プロバイダー向け画像／音声ヘルパーのエクスポート |
  | `plugin-sdk/text-runtime` | 非推奨の広範なテキスト互換性エクスポート | `string-coerce-runtime`、`text-chunking`、`text-utility-runtime`、`logging-core` を使用 |
  | `plugin-sdk/text-chunking` | テキスト分割ヘルパー | 送信テキスト分割ヘルパー |
  | `plugin-sdk/speech` | 音声ヘルパー | 音声プロバイダー型、プロバイダー向けディレクティブ、レジストリ、検証ヘルパー、OpenAI 互換 TTS ビルダー |
  | `plugin-sdk/speech-core` | 共有音声コア | 音声プロバイダー型、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダー型、レジストリ／解決ヘルパー、ブリッジセッションヘルパー、共有エージェント応答キュー、実行中処理の音声制御、トランスクリプト／イベントの健全性、エコー抑制、相談質問の照合、強制相談の調整、ターンコンテキスト追跡、出力アクティビティ追跡、高速コンテキスト相談ヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成プロバイダー型、画像アセット／データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成の型、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成のプロバイダー／リクエスト／結果型 |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成の型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照の解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成のプロバイダー／リクエスト／結果型 |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成の型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照の解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ返信ヘルパー | インタラクティブ返信ペイロードの正規化／縮約 |
  | `plugin-sdk/channel-config-primitives` | チャネル設定プリミティブ | 限定的なチャネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャネル設定書き込みヘルパー | チャネル設定書き込みの認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャネルプレリュード | 共有チャネル Plugin プレリュードのエクスポート |
  | `plugin-sdk/channel-status` | チャネルステータスヘルパー | 共有チャネルステータスのスナップショット／概要ヘルパー |
  | `plugin-sdk/allowlist-config-edit` | 許可リスト設定ヘルパー | 許可リスト設定の編集／読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換性ファサード | `plugin-sdk/channel-inbound` を使用 |
  | `plugin-sdk/direct-dm-guard-policy` | ダイレクト DM ガードヘルパー | 暗号化前の限定的なガードポリシーヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張ヘルパー | パッシブチャネル／ステータスおよびアンビエントプロキシのヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhook ターゲットヘルパー | Webhook ターゲットレジストリおよびルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | 非推奨の Webhook パスエイリアス | `plugin-sdk/webhook-ingress` を使用 |
  | `plugin-sdk/web-media` | 共有 Web メディアヘルパー | リモート／ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | 非推奨の Zod 互換性再エクスポート | `zod` から `zod` を直接インポート |
  | `plugin-sdk/memory-core` | バンドル版メモリコアヘルパー | メモリマネージャー／設定／ファイル／CLI ヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス／検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-embedding-registry` | メモリ埋め込みレジストリ | 軽量なメモリ埋め込みプロバイダーレジストリヘルパー |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンのエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、レジストリアクセス、ローカルプロバイダー、汎用バッチ／リモートヘルパー。具体的なリモートプロバイダーは、それぞれの所有 Plugin に存在 |
  | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジン | メモリホスト QMD エンジンのエクスポート |
  | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジン | メモリホストストレージエンジンのエクスポート |
  | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー | メモリホストマルチモーダルヘルパー |
  | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー | メモリホストクエリヘルパー |
  | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー | メモリホストシークレットヘルパー |
  | `plugin-sdk/memory-core-host-events` | 非推奨のメモリイベントエイリアス | `plugin-sdk/memory-host-events` を使用 |
  | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー | メモリホストステータスヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイム | メモリホスト CLI ランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイム | メモリホストコアランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル／ランタイムヘルパー | メモリホストファイル／ランタイムヘルパー |
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | メモリホストコアランタイムヘルパーのベンダー中立なエイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | メモリホストイベントジャーナルヘルパーのベンダー中立なエイリアス |
  | `plugin-sdk/memory-host-files` | 非推奨のメモリファイル／ランタイムエイリアス | `plugin-sdk/memory-core-host-runtime-files` を使用 |
  | `plugin-sdk/memory-host-markdown` | 管理対象 Markdown ヘルパー | メモリ関連 Plugin 向けの共有管理対象 Markdown ヘルパー |
  | `plugin-sdk/memory-host-search` | アクティブメモリ検索ファサード | 遅延アクティブメモリ検索マネージャーランタイムファサード |
  | `plugin-sdk/memory-host-status` | 非推奨のメモリホストステータスエイリアス | `plugin-sdk/memory-core-host-status` を使用 |
  | `plugin-sdk/testing` | テストユーティリティ | リポジトリローカルの非推奨互換性バレル。`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` など、対象を絞ったリポジトリローカルのテストサブパスを使用 |
</Accordion>

  この表は共通の移行対象のみを示すものであり、SDK サーフェス全体ではありません。
  コンパイラーのエントリポイント一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあり、
  パッケージのエクスポートは公開サブセットから生成されます。

  予約されていたバンドル済み Plugin のヘルパー境界は、公開 SDK の
  エクスポートマップから廃止されました。ただし、公開済みの `@openclaw/discord`
  パッケージを引き続き直接インポートする外部 Plugin のために残されている、非推奨の
  `plugin-sdk/discord` シムなど、明示的に文書化された互換性ファサードは除きます。
  所有者固有のヘルパーは、その所有者の Plugin パッケージ内に配置されます。共有ホストの
  動作は、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、
  `plugin-sdk/plugin-config-runtime` などの汎用 SDK コントラクトを介して移動します。

  用途に合う最も限定的なインポートを使用してください。エクスポートが見つからない場合は、
  `src/plugin-sdk/` のソースを確認するか、どの汎用コントラクトがその機能を所有すべきかを
  メンテナーに確認してください。

  ## 現在非推奨の API

  Plugin SDK、プロバイダーコントラクト、ランタイムサーフェス、マニフェストにまたがる、
  より限定的な非推奨項目です。いずれも現在は引き続き動作しますが、将来のメジャーリリースで
  削除されます。各項目では、旧 API と正規の置き換え先を対応付けています。

  <AccordionGroup>
  <Accordion title="command-auth ヘルプビルダー -> command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**: シグネチャと
    エクスポートは同じで、より限定的なサブパスからインポートするだけです。`command-auth`
    は互換性スタブとしてこれらを再エクスポートします。

    ```typescript
    // 変更前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 変更後
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="メンションゲーティングヘルパー -> resolveInboundMentionDecision">
    **旧**: `openclaw/plugin-sdk/channel-inbound` または
    `openclaw/plugin-sdk/channel-mention-gating` の
    `resolveMentionGating(params)` および
    `resolveMentionGatingWithBypass(params)`。

    **新**: `resolveInboundMentionDecision({ facts, policy })`。2 つに
    分かれていた呼び出し形式を、1 つの判定オブジェクトに統合します。

    Discord、iMessage、Matrix、MS Teams、QQBot、Signal、
    Telegram、WhatsApp、Zalo で採用されています。Slack 固有の `app_mention`
    イベントモデルでは、このヘルパーを使用しません。

  </Accordion>

  <Accordion title="チャンネルランタイムシムとチャンネルアクションヘルパー">
    `openclaw/plugin-sdk/channel-runtime` は、古いチャンネル Plugin 向けの
    互換性シムです。新しいコードではインポートせず、ランタイムオブジェクトの
    登録には `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、
    生の「actions」チャンネルエクスポートとともに非推奨です。代わりに、セマンティックな
    `presentation` サーフェスを通じて機能を公開してください。チャンネル Plugin は、
    受け付ける生のアクション名ではなく、レンダリングする要素（カード、ボタン、選択項目）を
    宣言します。

  </Accordion>

  <Accordion title="Web 検索プロバイダーの tool() ヘルパー -> Plugin の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()`
    ファクトリー。

    **新**: プロバイダー Plugin に `createTool(...)` を直接実装します。
    OpenClaw では、ツールラッパーを登録するための SDK ヘルパーが不要になりました。

  </Accordion>

  <Accordion title="プレーンテキストのチャンネルエンベロープ -> BodyForAgent">
    **旧**: 受信チャンネルメッセージからフラットなプレーンテキストのプロンプトエンベロープを
    構築するための `api.runtime.channel.reply.formatInboundEnvelope(...)`
    （および受信メッセージオブジェクトの `channelEnvelope` フィールド）。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャンネル
    Plugin は、ルーティングメタデータ（スレッド、トピック、返信先、リアクション）を
    プロンプト文字列に連結するのではなく、型付きフィールドとして付加します。
    合成されたアシスタント向けエンベロープでは `formatAgentEnvelope(...)`
    ヘルパーが引き続きサポートされますが、受信プレーンテキストエンベロープは廃止予定です。

    影響範囲: `inbound_claim`、`message_received`、および旧エンベロープテキストを
    後処理していたカスタムチャンネル Plugin。

  </Accordion>

  <Accordion title="deactivate フック -> gateway_stop">
    **旧**: `api.on("deactivate", handler)`。

    **新**: `api.on("gateway_stop", handler)`。シャットダウン時のクリーンアップに
    関するコントラクトは同じで、変更されるのはフック名だけです。

    ```typescript
    // 変更前
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // 変更後
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` は非推奨の互換性エイリアスとして引き続き接続され、
    2026-08-16 より後に削除されます。

  </Accordion>

  <Accordion title="subagent_spawning フック -> コアのスレッドバインディング">
    **旧**: `threadBindingReady` または `deliveryOrigin` を返す
    `api.on("subagent_spawning", handler)`。

    **新**: チャンネルのセッションバインディングアダプターを介して、コアに
    `thread: true` のサブエージェントバインディングを準備させます。起動後の監視にのみ
    `api.on("subagent_spawned", handler)` を使用してください。

    ```typescript
    // 変更前
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // 変更後
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`、`PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult`、
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` は、外部 Plugin の
    移行期間中のみ非推奨の互換性サーフェスとして残り、2026-08-30 より後に削除されます。

  </Accordion>

  <Accordion title="プロバイダー検出型 -> プロバイダーカタログ型">
    4 つの検出型エイリアスは、現在ではカタログ時代の型を薄くラップするものです。

    | 旧エイリアス                | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    さらに、従来の静的な `ProviderCapabilities` 集約オブジェクトも対象です。
    プロバイダー Plugin は、静的オブジェクトではなく、`buildReplayPolicy`、
    `normalizeToolSchemas`、`wrapStreamFn` などの明示的なプロバイダーフックを
    使用してください。

  </Accordion>

  <Accordion title="思考ポリシーフック -> resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上の 3 つの個別フック）:
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 正規の `id`、任意の `label`、ランク付けされたレベルリストを含む
    `ProviderThinkingProfile` を返す、単一の `resolveThinkingProfile(ctx)`。
    OpenClaw は、保存されている古い値をプロファイルランクに基づいて自動的に
    ダウングレードします。

    コンテキストには、`provider`、`modelId`、任意のマージ済み `reasoning`、
    任意のマージ済みモデル `compat` 情報が含まれます。プロバイダー Plugin は、
    設定されたリクエストコントラクトが対応している場合にのみ、これらのカタログ情報を
    使用してモデル固有のプロファイルを公開できます。

    3 つではなく 1 つのフックを実装してください。従来のフックは非推奨期間中も
    引き続き動作しますが、プロファイルの結果とは合成されません。

  </Accordion>

  <Accordion title="外部認証プロバイダー -> contracts.externalAuthProviders">
    **旧**: Plugin マニフェストでプロバイダーを宣言せずに、外部認証フックを
    実装します。

    **新**: Plugin マニフェストで `contracts.externalAuthProviders` を宣言し、
    **かつ** `resolveExternalAuthProfiles(...)` を実装します。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="プロバイダー環境変数の参照 -> setup.providers[].envVars">
    **旧**のマニフェストフィールド:
    `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ環境変数の参照を、マニフェストの `setup.providers[].envVars` に
    反映します。これにより、セットアップとステータスの環境メタデータが 1 か所に統合され、
    環境変数を参照するだけのために Plugin ランタイムを起動する必要がなくなります。

    `providerAuthEnvVars` は、非推奨期間が終了するまで互換性アダプターを介して
    引き続きサポートされます。

  </Accordion>

  <Accordion title="メモリ Plugin の登録 -> registerMemoryCapability">
    **旧**: `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`
    の 3 つの個別呼び出し。

    **新**: メモリ状態 API での 1 回の呼び出し:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    スロットは同じで、登録呼び出しが 1 回になります。追加型のプロンプトおよびコーパス用
    ヘルパー（`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）は
    影響を受けません。

  </Accordion>

  <Accordion title="メモリ埋め込みプロバイダー API">
    **旧**: `api.registerMemoryEmbeddingProvider(...)` と
    `contracts.memoryEmbeddingProviders`。

    **新**: `api.registerEmbeddingProvider(...)` と
    `contracts.embeddingProviders`。

    汎用埋め込みプロバイダーコントラクトはメモリ以外でも再利用可能で、新しいプロバイダーで
    サポートされる方式です。既存のプロバイダーが移行する間、メモリ固有の登録 API は
    非推奨の互換性サーフェスとして引き続き接続されます。Plugin の検査では、バンドルされて
    いない使用箇所が互換性負債として報告されます。

  </Accordion>

  <Accordion title="サブエージェントセッションメッセージ型の名前変更">
    `src/plugins/runtime/types.ts` から引き続きエクスポートされる 2 つの
    従来の型エイリアス:

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は非推奨となり、代わりに
    `getSessionMessages` を使用します。シグネチャは同じで、旧メソッドは新メソッドを
    呼び出します。

  </Accordion>

  <Accordion title="削除されたセッションおよびトランスクリプトファイル API">
    SQLite セッション／トランスクリプトへの切り替えにより、アクティブな
    `sessions.json` ストア、JSONL トランスクリプトパス、セッションファイル一覧を
    公開していた Plugin 向け API は削除または非推奨になります。ランタイム Plugin は、
    アクティブなファイルを解決または変更する代わりに、セッション ID と SDK ランタイム
    ヘルパーを使用してください。

    | 移行対象のサーフェス | 置き換え先 |
    | ----------------- | ----------- |
    | 非推奨の `loadSessionStore(...)`、`updateSessionStore(...)`、`resolveSessionStoreEntry(...)` | `getSessionEntry(...)`、`listSessionEntries(...)`、および行レベルのセッション変更。 |
    | 非推奨の `resolveSessionFilePath(...)` | セッション ID（`sessionKey`、`sessionId`、SDK ランタイムターゲットヘルパー）と、現在のセッションを操作する Gateway メソッド。 |
    | 削除された `saveSessionStore(...)` | Gateway が所有するセッションランタイム API。Plugin コードは、アクティブなストアファイルへ書き込むのではなく、文書化されたランタイム／コンテキストヘルパーを通じてセッション状態を要求または変更する必要があります。 |
    | 削除された `resolveSessionTranscriptPathInDir(...)` および `resolveAndPersistSessionFile(...)` | セッション ID と、現在のセッションを操作する Gateway メソッド。 |
    | `readLatestAssistantTextFromSessionTranscript(...)` | 現在のランタイムコンテキストから公開される ID ベースのトランスクリプトリーダー。または、Plugin がトランスクリプト所有者のパス外にある場合は、Gateway の履歴／セッションメソッド。 |
    | `SessionTranscriptUpdate.sessionFile` | `agentId`、`sessionKey`、`sessionId` を持つ `SessionTranscriptUpdate.target`。 |
    | `sessionFiles` などのメモリ同期入力 | ホストが提供する ID ベースのトランスクリプト／セッションソース。ライブセッションのアクティブな JSONL ファイルをクロールしないでください。 |
    | アクティブなセッション向けの `transcriptPath` または `sessionFile` という名前のランタイムオプション | ストレージに依存しないセッション ID を保持する `sessionTarget`／ランタイムターゲットオブジェクト。 |

    レガシー JSONL トランスクリプトファイルは、インポート、アーカイブ、エクスポート、および
    サポート用アーティファクトとして引き続き有効です。アクティブなセッションの
    定常状態のランタイム契約ではなくなりました。

    `v2026.7.1-beta.5` でリリースされた公式 Plugin は、上記 4 つの
    非推奨ヘルパーをインポートしていました。`openclaw/plugin-sdk/session-store-runtime` は
    そのブリッジを 2026-10-12 まで正確に維持します。新しい Plugin は置き換え先を使用する必要があります。
    `resolveStorePath(...)` は引き続きサポートされる SDK ヘルパーであり、
    この非推奨化には含まれません。

    `openclaw plugins inspect --all --runtime` は、読み込みエラーまたは診断が
    これらの削除済みファイル API を引き続き参照している、バンドルされていない Plugin を報告します。
    `@openclaw/plugin-inspector` の勧告スイープでは、外部パッケージのスキャンでも
    ストア全体のセッションヘルパー、セッションファイルパスヘルパー、
    レガシーなトランスクリプトファイルターゲット、および低レベルの
    トランスクリプトヘルパーがリリース前に検出されるよう、バージョン `0.3.17` 以降を使用する必要があります。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow`（単数形）は、ライブのタスクフロー
    アクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、フローから子タスクを
    作成、更新、キャンセル、または実行する Plugin 向けに、管理対象 TaskFlow の変更
    ランタイムを維持します。Plugin が DTO ベースの読み取りのみを必要とする場合は、
    `runtime.tasks.flows` を使用してください。

    ```typescript
    // 変更前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 変更後
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    2026-07-26 以降に削除されます。

  </Accordion>

  <Accordion title="埋め込み拡張ファクトリ -> エージェントツール結果ミドルウェア">
    上記の[移行方法](#how-to-migrate)で説明しています。完全を期すためにここにも記載します。
    削除された埋め込みランナー専用の
    `api.registerEmbeddedExtensionFactory(...)` パスは、
    `contracts.agentToolResultMiddleware` に明示的なランタイムリストを持つ
    `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType エイリアス -> OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は、
    現在では `OpenClawConfig` の 1 行のエイリアスです。正規名を使用してください。

    ```typescript
    // 変更前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 変更後
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 配下のバンドルされたチャンネル／プロバイダー Plugin 内にある
拡張レベルの非推奨項目は、それぞれの `api.ts` および `runtime-api.ts`
バレル内で追跡されます。これらはサードパーティ Plugin の契約には影響せず、
ここには記載されません。バンドルされた Plugin のローカルバレルを直接使用している場合は、
アップグレード前にそのバレル内の非推奨コメントを確認してください。
</Note>

## Talk とリアルタイム音声の移行

リアルタイム音声、電話、会議、およびブラウザの Talk コードは、
`openclaw/plugin-sdk/realtime-voice` からエクスポートされる 1 つの Talk
セッションコントローラーを共有します。このコントローラーは、共通の Talk イベントエンベロープ、
アクティブターン状態、キャプチャ状態、出力音声状態、最近のイベント履歴、
および古いターンの拒否を所有します。プロバイダー Plugin はベンダー固有の
リアルタイムセッションを所有し、サーフェス Plugin はキャプチャ、再生、電話、
および会議固有の処理を所有します。

バンドルされたすべてのサーフェスは共有コントローラー上で動作します。対象は、ブラウザリレー、
管理対象ルームへのハンドオフ、音声通話リアルタイム、音声通話ストリーミング STT、Google
Meet リアルタイム、およびネイティブのプッシュトゥトークです。Gateway は `hello-ok.features.events` で、
1 つのライブ Talk イベントチャンネル `talk.event` を通知します。

低レベルのアダプターまたはテストフィクスチャを実装する場合を除き、新しいコードで
`createTalkEventSequencer(...)` を直接呼び出さないでください。共有コントローラーを使用することで、
ターン ID なしではターンスコープのイベントを送出できず、古い `turnEnd` /
`turnCancel` 呼び出しが新しいアクティブターンをクリアできず、出力音声の
ライフサイクルイベントが、電話、会議、ブラウザリレー、
管理対象ルームへのハンドオフ、およびネイティブ Talk クライアント間で一貫した状態に保たれます。

公開 API の形式:

```typescript
// Gateway が所有する Talk セッション API。
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// クライアントが所有するプロバイダーセッション API。
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

ブラウザが所有する WebRTC／プロバイダー WebSocket セッションでは `talk.client.create` を使用します。
これは、ブラウザがプロバイダーとのネゴシエーションおよびメディアトランスポートを所有し、
Gateway が認証情報、指示、およびツールポリシーを所有するためです。`talk.session.*` は、
Gateway リレーによるリアルタイム処理、Gateway リレーによる文字起こし、および管理対象ルームの
ネイティブ STT/TTS セッションに共通する、Gateway 管理サーフェスです。

`talk.provider` / `talk.providers` の横にリアルタイムセレクターを配置するレガシー設定は、
`openclaw doctor --fix` で修復する必要があります。ランタイム Talk は、音声／TTS
プロバイダー設定をリアルタイムプロバイダー設定として再解釈しません。

サポートされる `talk.session.create` の組み合わせは、意図的に少数に限定されています。

| モード            | トランスポート       | ブレイン           | 所有者              | 備考                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway を介してブリッジされる全二重のプロバイダー音声。ツール呼び出しは agent-consult ツールを経由します。           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | ストリーミング STT のみ。呼び出し元は入力音声を送信し、トランスクリプトイベントを受信します。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ネイティブ／クライアントルーム | クライアントがキャプチャ／再生を所有し、Gateway がターン状態を所有する、プッシュトゥトークおよびトランシーバー形式のルーム。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ネイティブ／クライアントルーム | Gateway ツールアクションを直接実行する、信頼されたファーストパーティサーフェス向けの管理者専用ルームモード。                  |

以前の `talk.realtime.*` / `talk.transcription.*` / `talk.handoff.*` ファミリー
（すべて削除済み）から移行する読者向けのメソッド対応表:

| 旧                              | 新                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` または `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

統一された制御用語も意図的に限定されています。

| メソッド                        | 適用対象                                                | 契約                                                                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`、`transcription/gateway-relay` | 同じ Gateway 接続が所有するプロバイダーセッションに、base64 PCM オーディオチャンクを追加します。                                                                                                                         |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room のユーザーターンを開始します。                                                                                                                                                                               |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 古いターンでないことを検証した後、アクティブなターンを終了します。                                                                                                                                                        |
| `talk.session.cancelTurn`       | Gateway が所有するすべてのセッション                   | ターンに対するアクティブなキャプチャ、プロバイダー、エージェント、TTS の処理をキャンセルします。                                                                                                                          |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | ユーザーターンを必ずしも終了せずに、アシスタントの音声出力を停止します。                                                                                                                                                  |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ブリッジによって公開された非同期処理が完了した後、プロバイダーのツール呼び出しを完了します。途中出力には `options.willContinue` を渡し、サポートされている場合は、アシスタントによる再応答を避けるために `options.suppressResponse` を渡します。 |
| `talk.session.steer`            | エージェントを基盤とする Talk セッション               | Talk セッションから解決されたアクティブな埋め込み実行に、音声による `status`、`steer`、`cancel`、または `followup` の制御を送信します。                                                                                     |
| `talk.session.close`            | すべての統合セッション                                  | リレーセッションを停止するか managed-room の状態を取り消してから、統合セッション ID を破棄します。                                                                                                                        |

これを機能させるために、コアへプロバイダーまたはプラットフォーム固有の特殊処理を導入しないでください。
コアは Talk セッションのセマンティクスを所有します。プロバイダー Plugin はベンダーセッションのセットアップを所有します。
音声通話と Google Meet は、電話／会議アダプターを所有します。ブラウザーとネイティブ
アプリは、デバイスのキャプチャ／再生 UX を所有します。

## 削除予定

| 時期                                        | 発生すること                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **現在**                                    | 非推奨のサーフェスは実行時に警告を出します。                                                                                               |
| **各互換性レコードの `removeAfter` 日付**   | 該当するサーフェスは削除可能になります。日付を過ぎると、`pnpm plugins:boundary-report --fail-on-eligible-compat` により CI が失敗します。    |
| **次のメジャーリリース**                    | まだ移行されていないサーフェスはすべて削除され、それらを使用している Plugin は動作しなくなります。                                          |

すべてのコア Plugin はすでに移行済みです。外部 Plugin は
次のメジャーリリースまでに移行してください。`pnpm plugins:boundary-report` を実行すると、Plugin が使用する
サーフェスについて、期限が最も近い互換性レコードを確認できます。

## 警告を一時的に抑制する

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な回避手段であり、恒久的な解決策ではありません。

## 関連項目

- [はじめに](/ja-JP/plugins/building-plugins) - 最初の Plugin を構築する
- [SDK の概要](/ja-JP/plugins/sdk-overview) - サブパスインポートの完全なリファレンス
- [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - チャンネル Plugin の構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダー Plugin の構築
- [Plugin の内部構造](/ja-JP/plugins/architecture) - アーキテクチャの詳細解説
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマのリファレンス
