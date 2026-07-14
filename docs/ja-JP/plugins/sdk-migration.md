---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - OpenClaw 2026.4.25 より前に api.registerEmbeddedExtensionFactory を使用していた場合
    - Plugin を最新の Plugin アーキテクチャに更新しています
    - 外部の OpenClaw Plugin を保守している場合
sidebarTitle: Migrate to SDK
summary: 従来の後方互換性レイヤーから最新の Plugin SDK へ移行する
title: Plugin SDK の移行
x-i18n:
    generated_at: "2026-07-14T13:54:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 7afd1c39e33f90c19e3e75824abb81074d0699ff0e49bb1d9d577d4e3a3e91bf
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw は、広範な後方互換性レイヤーを、小さく目的を絞ったインポートで構成される最新のプラグイン
アーキテクチャに置き換えました。プラグインがこの変更より前に作成されたものである場合、
このガイドに従って現在のコントラクトへ移行できます。

## 変更点

以前は、2 つの広範なインポートサーフェスにより、プラグインは単一の
エントリーポイントからほぼすべてにアクセスできました。

- **`openclaw/plugin-sdk/compat`** - 新しいアーキテクチャの構築中も
  古いフックベースのプラグインが動作し続けるよう、多数のヘルパーを再エクスポートしていました。
- **`openclaw/plugin-sdk/infra-runtime`** - システムイベント、
  Heartbeat の状態、配信キュー、フェッチ／プロキシヘルパー、ファイルヘルパー、
  承認型、および無関係なユーティリティを混在させた広範なバレルでした。
- **`openclaw/plugin-sdk/config-runtime`** - 移行期間中、非推奨の
  直接読み込み／書き込みヘルパーを引き続き含んでいた広範な設定バレルでした。
- **`openclaw/extension-api`** - 組み込みエージェントランナーなどの
  ホスト側ヘルパーへプラグインから直接アクセスできるようにするブリッジでした。
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` などの
  組み込みランナーイベントを監視していた、削除済みの組み込みランナー専用
  フックでした。代わりにエージェントのツール結果ミドルウェアを使用してください
  （[組み込みツール結果拡張機能をミドルウェアへ移行する](#how-to-migrate)を参照）。

これらのサーフェスは**非推奨**です。現在も動作しますが、新しいプラグインでは
使用してはならず、既存のプラグインも、次のメジャーリリースで削除される前に
移行する必要があります。`registerEmbeddedExtensionFactory` はすでに削除されており、
従来の登録は読み込まれなくなりました。

<Warning>
  後方互換性レイヤーは、将来のメジャーリリースで削除されます。
  これらのサーフェスから引き続きインポートしているプラグインは、その時点で動作しなくなります。
</Warning>

OpenClaw は、代替機能を導入するのと同じ変更で、文書化済みのプラグイン動作を
削除したり再解釈したりすることはありません。破壊的なコントラクト変更では、
まず互換性アダプター、診断、ドキュメント、および非推奨期間を設けます。
これは SDK インポート、マニフェストフィールド、セットアップ API、フック、およびランタイムの
登録動作に適用されます。

### 理由

- **起動の遅延** - 1 つのヘルパーをインポートするだけで、無関係な多数のモジュールが読み込まれていました。
- **循環依存** - 広範な再エクスポートにより、インポートサイクルが
  容易に発生していました。
- **不明瞭な API サーフェス** - 安定したエクスポートと内部用エクスポートを区別できませんでした。

各 `openclaw/plugin-sdk/<subpath>` は、文書化されたコントラクトを持つ、
小さく自己完結したモジュールになりました。

バンドル済みチャンネル向けの従来のプロバイダー用便利サーフェスも廃止されました。
チャンネル名を冠したヘルパーショートカットは、非公開のモノレポ用機能であり、
安定したプラグインコントラクトではありませんでした。代わりに、対象を絞った汎用 SDK サブパスを使用してください。
バンドル済みプラグインのワークスペース内では、プロバイダー所有のヘルパーをそのプラグイン自身の
`api.ts` または `runtime-api.ts` に配置してください。

- Anthropic は、Claude 固有のストリームヘルパーを独自の `api.ts` /
  `contract-api.ts` サーフェスに保持します。
- OpenAI は、プロバイダービルダー、デフォルトモデルヘルパー、およびリアルタイムプロバイダー
  ビルダーを独自の `api.ts` に保持します。
- OpenRouter は、プロバイダービルダーとオンボーディング／設定ヘルパーを独自の
  `api.ts` に保持します。

## 互換性ポリシー

外部プラグインの互換性対応は、次の順序で行われます。

1. 新しいコントラクトを追加する。
2. 互換性アダプターを介して古い動作を維持する。
3. 古いパスと代替パスを明記した診断または警告を出力する。
4. テストで両方のパスを網羅する。
5. 非推奨化と移行パスを文書化する。
6. 告知済みの移行期間が終了した後（通常はメジャー
   リリース時）にのみ削除する。

マニフェストフィールドが引き続き受け入れられている場合は、ドキュメントと
診断で別途指示されるまで使用し続けてください。新しいコードでは文書化された代替機能を優先し、
通常のマイナーリリースで既存のプラグインが動作しなくなることは避ける必要があります。

`pnpm plugins:boundary-report` を使用して、現在の移行キューを監査します。

| フラグ                                                    | 効果                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（または `pnpm plugins:boundary-report:summary`） | 完全な詳細ではなく、簡潔な件数を表示します。                                         |
| `--json`                                                | 機械可読レポートを出力します。                                                       |
| `--owner <id>`                                          | 1 つのプラグインまたは互換性所有者に絞り込みます。                                   |
| `--fail-on-cross-owner`                                 | 所有者をまたぐ予約済み SDK インポートがある場合、0 以外で終了します。                             |
| `--fail-on-eligible-compat`                             | 非推奨の互換性レコードの `removeAfter` 日付を過ぎている場合、0 以外で終了します。 |
| `--fail-on-unclassified-unused-reserved`                | 未使用の予約済み SDK shim がある場合、0 以外で終了します。                                    |

`pnpm plugins:boundary-report:ci` は、3 つすべての失敗フラグを有効にして実行されます。
各互換性レコードには、曖昧な「次のメジャーリリース」ではなく、明示的な
`removeAfter` 日付があります。レポートは非推奨レコードをその日付ごとにグループ化し、
ローカルのコード／ドキュメント参照を集計し、所有者をまたぐ予約済み SDK インポートを明示し、
非公開のメモリーホスト SDK ブリッジを要約します。予約済み SDK サブパスには、
追跡される所有者側の使用箇所が必要です。未使用の予約済みエクスポートは公開
SDK から削除する必要があります。

## 移行方法

<Steps>
  <Step title="ランタイム設定の読み込み／書き込みヘルパーを移行する">
    バンドル済みプラグインでは、`api.runtime.config.loadConfig()` と
    `api.runtime.config.writeConfigFile(...)` の直接呼び出しを停止する必要があります。
    アクティブな呼び出しパスへすでに渡されている設定を優先してください。
    現在のプロセススナップショットが必要な長寿命ハンドラーでは、
    `api.runtime.config.current()` を使用できます。長寿命のエージェントツールでは、
    `execute` 内で `ctx.getRuntimeConfig()` を読み取る必要があります。
    これにより、設定書き込み前に作成されたツールでも、更新後の設定を参照できます。

    設定の書き込みには、書き込み後のポリシーを明示したトランザクションヘルパーを使用します。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    変更で Gateway のクリーンな再起動が必要な場合は `afterWrite: { mode: "restart", reason: "..." }` を使用し、
    呼び出し元が後続処理を所有し、意図的に再読み込みプランナーを抑制する場合にのみ
    `afterWrite: { mode: "none", reason: "..." }` を使用してください。
    ミューテーション結果には、テストとログ記録に使用できる型付きの
    `followUp` 要約が含まれます。再起動の適用または
    スケジュール設定は、引き続き Gateway が担当します。

    `loadConfig` と `writeConfigFile` は、外部プラグイン向けの
    非推奨互換性ヘルパーとして残され、`runtime-config-load-write` 互換性コードを伴う
    警告を一度だけ出力します。バンドル済みプラグインとリポジトリの
    ランタイムコードは、`pnpm check:deprecated-api-usage` と
    `pnpm check:no-runtime-action-load-config` によって保護されています。新しい本番プラグインでの使用は
    即座に失敗し、設定の直接書き込みも失敗します。Gateway サーバーメソッドは
    リクエストのランタイムスナップショットを使用する必要があり、ランタイムのチャンネル送信／アクション／クライアントヘルパーは
    境界から設定を受け取る必要があります。また、長寿命のランタイムモジュールでは、
    アンビエントな `loadConfig()` 呼び出しは一切許可されません。

    新しいプラグインコードでは、広範な `openclaw/plugin-sdk/config-runtime`
    バレルを避ける必要があります。用途に合った対象を絞ったサブパスを使用してください。

    | 必要な機能 | インポート |
    | --- | --- |
    | `OpenClawConfig` などの設定型 | `openclaw/plugin-sdk/config-contracts` |
    | 読み込み済み設定のアサーション、プラグインエントリーの設定検索、および設定のマージ | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 現在のランタイムスナップショットの読み取り | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定の書き込み | `openclaw/plugin-sdk/config-mutation` |
    | セッションストアヘルパー | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown テーブル設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | グループポリシーのランタイムヘルパー | `openclaw/plugin-sdk/runtime-group-policy` |
    | シークレット入力の解決 | `openclaw/plugin-sdk/secret-input-runtime` |
    | モデル／セッションのオーバーライド | `openclaw/plugin-sdk/model-session-runtime` |

    バンドル済みプラグインとそのテストは、広範なバレルを使用しないようスキャナーで
    保護されています。これにより、インポートとモックが必要な動作の範囲内に保たれます。
    このバレルは外部互換性のために引き続き存在しますが、新しいコードでは
    依存しないでください。

  </Step>

  <Step title="組み込みツール結果拡張機能をミドルウェアへ移行する">
    バンドル済みプラグインでは、組み込みランナー専用の
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

    同時にプラグインマニフェストも更新します。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    インストール済みプラグインでも、明示的に有効化され、対象となるすべてのランタイムが
    `contracts.agentToolResultMiddleware` で宣言されている場合は、
    ツール結果ミドルウェアを登録できます。宣言されていないインストール済みミドルウェアの
    登録は拒否されます。

  </Step>

  <Step title="ネイティブ承認ハンドラーをケイパビリティファクトへ移行する">
    承認に対応したチャンネルプラグインは、`approvalCapability.nativeRuntime` と
    共有ランタイムコンテキストレジストリを通じてネイティブ承認動作を公開します。

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換えます。
    - 承認固有の認証／配信を、従来の `plugin.auth` /
      `plugin.approvals` の結線から `approvalCapability` へ移します。
    - `ChannelPlugin.approvals` は公開
      チャンネルプラグインコントラクトから削除されました。配信／ネイティブ／レンダリングのフィールドを
      `approvalCapability` へ移してください。
    - `plugin.auth` はチャンネルのログイン／ログアウトフロー専用として残ります。
      コアは承認認証フックをそこから読み取らなくなりました。
    - チャンネル所有のランタイムオブジェクト（クライアント、トークン、Bolt アプリ）を
      `openclaw/plugin-sdk/channel-runtime-context` を通じて登録します。
    - ネイティブ承認ハンドラーから、プラグイン所有の再ルーティング通知を送信しないでください。
      実際の配信結果に基づく別経路へのルーティング通知は、コアが所有します。
    - `channelRuntime` を `createChannelManager(...)` に渡す場合は、
      実際の `createPluginRuntime().channel` サーフェスを指定してください。部分的なスタブは
      拒否されます。

    現在の承認ケイパビリティの構成については、[チャンネルプラグイン](/ja-JP/plugins/sdk-channel-plugins)を参照してください。

  </Step>

  <Step title="Windows ラッパーのフォールバック動作を監査する">
    プラグインで `openclaw/plugin-sdk/windows-spawn` を使用している場合、解決できない Windows の
    `.cmd`/`.bat` ラッパーは、`allowShellFallback: true` を明示的に渡さない限り、
    フェイルクローズするようになりました。

    ```typescript
    // 変更前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 変更後
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // シェルを介したフォールバックを意図的に許容する、信頼済みの互換性呼び出し元にのみ
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

  <Step title="対象を絞ったインポートへ置き換える">
    古いサーフェスの各エクスポートは、それぞれ特定の最新インポートパスに対応します。

    ```typescript
    // 変更前（非推奨の後方互換性レイヤー）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 変更後（対象を絞った最新のインポート）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    ホスト側ヘルパーについては、直接インポートする代わりに
    注入されたプラグインランタイムを使用してください。

    ```typescript
    // 変更前（非推奨の extension-api ブリッジ）
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // 変更後（注入されたランタイム）
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    その他のレガシーブリッジヘルパーにも同じパターンを適用します。

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

  <Step title="広範な infra-runtime インポートを置き換える">
    `openclaw/plugin-sdk/infra-runtime` は外部との互換性のために引き続き存在しますが、
    新しいコードでは実際に必要な対象を絞ったサーフェスをインポートしてください。

    | 用途 | インポート |
    | --- | --- |
    | システムイベントキューのヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat のウェイク、イベント、可視性ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中の配信キューのドレイン | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャネルアクティビティのテレメトリ | `openclaw/plugin-sdk/channel-activity-runtime` |
    | メモリ内および永続ストレージベースの重複排除キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル／メディアパスのヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | ディスパッチャー対応の fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシおよび保護付き fetch のヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF ディスパッチャーポリシーの型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト／解決の型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認応答ペイロードおよびコマンドのヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラー書式設定ヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポートの準備完了待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | セキュアトークンのヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 上限付き非同期タスク並行処理 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 証明可能な不変条件に対する必須値アサーション | `openclaw/plugin-sdk/expect-runtime` |
    | 数値への型強制 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカルの非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドルされたプラグインでは、スキャナーによって `infra-runtime` の使用が防止されるため、
    リポジトリ内のコードが広範なバレルへ後戻りすることはありません。

  </Step>

  <Step title="チャネルルートヘルパーを移行する">
    新しいチャネルルートコードでは `openclaw/plugin-sdk/channel-route` を使用します。以前の
    ルートキー名と比較可能ターゲット名は、互換性エイリアスとして残されています。

    | 旧ヘルパー | 最新ヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    最新のルートヘルパーは、ネイティブ承認、返信抑制、受信重複排除、
    Cron 配信、セッションルーティングの全体で `{ channel, to, accountId, threadId }` を
    一貫して正規化します。

    `ChannelMessagingAdapter.parseExplicitTarget`、パーサーベースの読み込み済みルートヘルパー
    （`parseExplicitTargetForLoadedChannel`、`resolveRouteTargetForLoadedChannel`）、または
    `plugin-sdk/channel-route` の `resolveChannelRouteTargetWithParser(...)` の新しい使用箇所を追加しないでください。
    これらは非推奨であり、古いプラグインのためだけに残されています。新しいチャネル
    プラグインでは、ターゲット ID の正規化とディレクトリ未検出時のフォールバックに
    `messaging.targetResolver.resolveTarget(...)`、コアでピア種別を早期に取得する必要がある場合に
    `messaging.inferTargetChatType(...)`、プロバイダー固有のセッションおよびスレッド ID に
    `messaging.resolveOutboundSessionRoute(...)` を使用してください。

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
  | インポートパス | 目的 | 主なエクスポート |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規のPluginエントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルエントリの定義とビルダー向けの従来の包括的な再エクスポート | `defineChannelPluginEntry`、`createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーのエントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | チャネルエントリに特化した定義とビルダー | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`createChannelConfigUiHints` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | セットアップ用トランスレーター、許可リストのプロンプト、セットアップ状態ビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時のランタイムヘルパー | `createSetupTranslator`、インポートセーフなセットアップパッチアダプター、検索注記ヘルパー、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | 非推奨のセットアップアダプターエイリアス | `plugin-sdk/setup-runtime` を使用 |
  | `plugin-sdk/setup-tools` | セットアップツール用ヘルパー | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数アカウント用ヘルパー | アカウント一覧、設定、アクションゲート用ヘルパー |
  | `plugin-sdk/account-id` | アカウントID用ヘルパー | `DEFAULT_ACCOUNT_ID`、アカウントIDの正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索とデフォルトフォールバック用ヘルパー |
  | `plugin-sdk/account-helpers` | 限定的なアカウント用ヘルパー | アカウント一覧、アカウントアクション用ヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、および `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DMペアリングの基本要素 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、送信元配信の接続 | `createChannelReplyPipeline`、`resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリーとDMアクセスヘルパー | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャネル設定スキーマの基本要素と汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | バンドル済み設定スキーマ | OpenClawが保守するバンドル済みpluginsのみ。新しいpluginsはpluginローカルのスキーマを定義する必要がある |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨のバンドル済み設定スキーマ | 互換性エイリアスのみ。保守対象のバンドル済みpluginsには `plugin-sdk/bundled-channel-config-schema` を使用 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンド設定ヘルパー | コマンド名の正規化、説明のトリミング、重複・競合の検証 |
  | `plugin-sdk/channel-policy` | グループ・DMポリシーの解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/inbound-envelope` | 受信エンベロープヘルパー | 共有ルートとエンベロープビルダー用ヘルパー |
  | `plugin-sdk/channel-inbound` | 受信処理ヘルパー | コンテキスト構築、書式設定、ルート、ランナー、準備済み返信のディスパッチ、ディスパッチ述語 |
  | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析インポートパス | 汎用ターゲット解析ヘルパーには `plugin-sdk/channel-targets`、ルート比較には `plugin-sdk/channel-route`、プロバイダー固有のターゲット解決にはplugin所有の `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` を使用 |
  | `plugin-sdk/outbound-media` | 送信メディアヘルパー | 共有送信メディア読み込み |
  | `plugin-sdk/outbound-send-deps` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/channel-outbound` | 送信メッセージのライフサイクルヘルパー | メッセージアダプター、受領情報、永続的送信ヘルパー、ライブプレビュー・ストリーミングヘルパー、返信オプション、ライフサイクルヘルパー、送信元ID、ペイロード計画 |
  | `plugin-sdk/channel-streaming` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/outbound-runtime` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプター用ヘルパー |
  | `plugin-sdk/agent-media-payload` | 従来のメディアペイロードヘルパー | 従来のフィールドレイアウト向けエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性シム | 従来のチャネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続Pluginストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム、ロギング、バックアップ、pluginインストール用ヘルパー |
  | `plugin-sdk/runtime-env` | 限定的なランタイム環境ヘルパー | ロガー・ランタイム環境、タイムアウト、再試行、バックオフ用ヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有Pluginランタイムヘルパー | Pluginコマンド、フック、HTTP、対話用ヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有Webhook・内部フックパイプライン用ヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeMethodBinder`、`createLazyRuntimeNamedExport`、`createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有実行ヘルパー |
  | `plugin-sdk/cli-runtime` | CLIランタイムヘルパー | コマンドの書式設定、待機、バージョン用ヘルパー |
  | `plugin-sdk/gateway-runtime` | Gatewayヘルパー | Gatewayクライアント、イベントループ準備完了後の開始ヘルパー、公開LANホストの解決、チャネル状態パッチ用ヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換性シム | `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot`、`config-mutation` を推奨 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンドヘルパー | バンドル済みTelegram契約サーフェスを利用できない場合の、フォールバック時にも安定するTelegramコマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | 実行・plugin承認ペイロード、承認機能・プロファイル用ヘルパー、ネイティブ承認ルーティング・ランタイム用ヘルパー、構造化された承認表示パスの書式設定 |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者の解決、同一チャットのアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブ実行承認のプロファイル・フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認機能・配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認Gatewayヘルパー | 共有承認Gatewayリゾルバー |
  | `plugin-sdk/approval-reference-runtime` | 承認トランスポート参照 | トランスポート制限付きコールバック向けの決定論的な永続ロケーターヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットなチャネルエントリポイント向けの軽量なネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーのランタイムヘルパー。より限定的なアダプター・Gatewayの接点で十分な場合はそちらを推奨 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認のターゲット・アカウントバインディング用ヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | 実行・plugin承認返信ペイロード用ヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャネルランタイムコンテキストヘルパー | 汎用チャネルランタイムコンテキストの登録・取得・監視用ヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有の信頼判定、DMゲーティング、ルート境界付きファイル・パス、外部コンテンツ、シークレット収集用ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRFポリシーヘルパー | ホスト許可リストとプライベートネットワークポリシー用ヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRFランタイムヘルパー | 固定ディスパッチャー、保護付きフェッチ、SSRFポリシー用ヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`（キー指定の置換を含む）、`peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeatヘルパー | Heartbeatのウェイク、イベント、可視性用ヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | メモリ内および永続ストレージ対応の重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル・メディアパス用ヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備完了ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | 実行承認ポリシーヘルパー | `loadExecApprovals`、`resolveExecApprovalsFromFile`、`ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 上限付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲーティングヘルパー | `isDiagnosticFlagEnabled`、`isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラーヘルパー | `formatUncaughtError`、`isApprovalNotFoundError`、エラーグラフ用ヘルパー、`PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | ラップ済みフェッチ・プロキシヘルパー | `resolveFetch`、プロキシ用ヘルパー、EnvHttpProxyAgentオプション用ヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`、`normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 再試行ヘルパー | `RetryConfig`、`retryAsync`、ポリシーランナー |
  | `plugin-sdk/allow-from` | 許可リストの書式設定と入力マッピング | `formatAllowFromLowercase`、`mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲーティングとコマンドサーフェス用ヘルパー | `resolveControlCommandGate`、送信者認可用ヘルパー、動的引数メニューの書式設定を含むコマンドレジストリ用ヘルパー |
  | `plugin-sdk/command-status` | コマンド状態・ヘルプレンダラー | `buildCommandsMessage`、`buildCommandsMessagePaginated`、`buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力の解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhookリクエストヘルパー | Webhookターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook本文ガードヘルパー | リクエスト本文の読み取り・制限用ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | 受信ディスパッチ、Heartbeat、返信プランナー、チャンク分割 |
  | `plugin-sdk/reply-dispatch-runtime` | 限定的な返信ディスパッチヘルパー | 完了処理、プロバイダーディスパッチ、会話ラベル用ヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `createChannelHistoryWindow`。`buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled` などの非推奨のマップヘルパー互換性エクスポート |
  | `plugin-sdk/reply-reference` | 返信参照の計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト・Markdownチャンク分割ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | スコープ付きセッション行用ヘルパー、ストアパス用ヘルパー、更新日時の読み取り |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態ディレクトリとOAuthディレクトリ用ヘルパー |
  | `plugin-sdk/routing` | ルーティング・セッションキーヘルパー | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャネル状態ヘルパー | チャネル・アカウント状態の要約ビルダー、ランタイム状態のデフォルト、問題メタデータ用ヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲットリゾルバーヘルパー | 共有ターゲットリゾルバーヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | スラッグ・文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエストURLヘルパー | リクエスト形式の入力から文字列URLを抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化されたstdout・stderrを備えた時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 共通ツール・CLIパラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロードの抽出 | ツール結果オブジェクトから正規化済みペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信情報の抽出 | ツール引数から正規の送信ターゲットフィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有一時ダウンロードパス用ヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーと秘匿化ヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdownテーブルヘルパー | Markdownテーブルモード用ヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信型 | 返信ペイロード型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル・セルフホスト型プロバイダーのセットアップヘルパー | セルフホスト型プロバイダーの検出・設定用ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換のセルフホスト型プロバイダーに特化したセットアップヘルパー | 同じセルフホスト型プロバイダーの検出・設定用ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイムAPIキー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダーAPIキーセットアップヘルパー | APIキーのオンボーディング・プロファイル書き込み用ヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダー認証結果ヘルパー | 標準OAuth認証結果ビルダー |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択ヘルパー | 設定済みまたは自動のプロバイダー選択と未加工プロバイダー設定のマージ |
  | `plugin-sdk/provider-env-vars` | プロバイダー環境変数ヘルパー | プロバイダー認証環境変数の検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル／リプレイヘルパー | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、モデル ID 正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログヘルパー | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーのオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダー HTTP ヘルパー | 音声文字起こし用マルチパートフォームヘルパーを含む、汎用プロバイダー HTTP／エンドポイント機能ヘルパー |
  | `plugin-sdk/provider-web-fetch` | プロバイダー Web 取得ヘルパー | Web 取得プロバイダーの登録／キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダー Web 検索設定ヘルパー | Plugin 有効化の配線を必要としないプロバイダー向けの限定的な Web 検索設定／認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダー Web 検索コントラクトヘルパー | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報セッター／ゲッターなどの限定的な Web 検索設定／認証情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダー Web 検索ヘルパー | Web 検索プロバイダーの登録／キャッシュ／ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール／スキーマ互換ヘルパー | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek／Gemini／OpenAI のスキーマクリーンアップおよび診断 |
  | `plugin-sdk/provider-usage` | プロバイダー使用量ヘルパー | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`、その他のプロバイダー使用量ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパー型、共有 Anthropic／Bedrock／DeepSeek V4／Google／Kilocode／Moonshot／OpenAI／OpenRouter／Z.A.I／MiniMax／Copilot ラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダー転送ヘルパー | ガード付き取得、ツール結果テキスト抽出、転送メッセージ変換、書き込み可能な転送イベントストリームなどのネイティブプロバイダー転送ヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディアの取得／変換／保存ヘルパー、ffprobe を利用した動画サイズ検出、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像／動画／音楽生成向けの共有フェイルオーバーヘルパー、候補選択、モデル欠落時のメッセージ |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダー型、およびプロバイダー向け画像／音声ヘルパーのエクスポート |
  | `plugin-sdk/text-runtime` | 非推奨の広範なテキスト互換エクスポート | `string-coerce-runtime`、`text-chunking`、`text-utility-runtime`、`logging-core` を使用 |
  | `plugin-sdk/text-chunking` | テキスト分割ヘルパー | 送信テキストおよびオフセットを保持する範囲分割ヘルパー |
  | `plugin-sdk/speech` | 音声合成ヘルパー | 音声合成プロバイダー型、プロバイダー向けディレクティブ／レジストリ／検証ヘルパー、OpenAI 互換 TTS ビルダー |
  | `plugin-sdk/speech-core` | 共有音声合成コア | 音声合成プロバイダー型、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダー型、レジストリヘルパー、共有 WebSocket セッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダー型、レジストリ／解決ヘルパー、ブリッジセッションヘルパー、共有エージェント応答キュー、実行中の音声制御、トランスクリプト／イベントの健全性、エコー抑制、相談質問の照合、強制相談の調整、ターンコンテキスト追跡、出力アクティビティ追跡、高速コンテキスト相談ヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成プロバイダー型、画像アセット／データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成の型、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成プロバイダー／リクエスト／結果の型 |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成の型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照の解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成プロバイダー／リクエスト／結果の型 |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成の型、フェイルオーバーヘルパー、プロバイダー検索、モデル参照の解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ返信ヘルパー | インタラクティブ返信ペイロードの正規化／簡約 |
  | `plugin-sdk/channel-config-primitives` | チャンネル設定プリミティブ | 限定的なチャンネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャンネル設定書き込みヘルパー | チャンネル設定の書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャンネルプレリュード | 共有チャンネル Plugin プレリュードのエクスポート |
  | `plugin-sdk/channel-status` | チャンネルステータスヘルパー | 共有チャンネルステータスのスナップショット／概要ヘルパー |
  | `plugin-sdk/allowlist-config-edit` | 許可リスト設定ヘルパー | 許可リスト設定の編集／読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 非推奨の互換ファサード | `plugin-sdk/channel-inbound` を使用 |
  | `plugin-sdk/direct-dm-guard-policy` | ダイレクト DM ガードヘルパー | 暗号化前の限定的なガードポリシーヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張ヘルパー | パッシブチャンネル／ステータスおよびアンビエントプロキシのヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhook ターゲットヘルパー | Webhook ターゲットレジストリおよびルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | 非推奨の Webhook パスエイリアス | `plugin-sdk/webhook-ingress` を使用 |
  | `plugin-sdk/web-media` | 共有 Web メディアヘルパー | リモート／ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | 非推奨の Zod 互換再エクスポート | `zod` から `zod` を直接インポート |
  | `plugin-sdk/memory-core` | バンドル済みメモリコアヘルパー | メモリマネージャー／設定／ファイル／CLI ヘルパーのサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス／検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-embedding-registry` | メモリ埋め込みレジストリ | 軽量なメモリ埋め込みプロバイダーレジストリヘルパー |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンのエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、レジストリアクセス、ローカルプロバイダー、汎用バッチ／リモートヘルパー。具体的なリモートプロバイダーは、それぞれを所有する Plugin に配置 |
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
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | メモリホストコアランタイムヘルパーのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | メモリホストイベントジャーナルヘルパーのベンダー中立エイリアス |
  | `plugin-sdk/memory-host-files` | 非推奨のメモリファイル／ランタイムエイリアス | `plugin-sdk/memory-core-host-runtime-files` を使用 |
  | `plugin-sdk/memory-host-markdown` | 管理対象 Markdown ヘルパー | メモリ関連 Plugin 向けの共有管理対象 Markdown ヘルパー |
  | `plugin-sdk/memory-host-search` | Active Memory 検索ファサード | 遅延読み込み式 Active Memory 検索マネージャーランタイムファサード |
  | `plugin-sdk/memory-host-status` | 非推奨のメモリホストステータスエイリアス | `plugin-sdk/memory-core-host-status` を使用 |
  | `plugin-sdk/testing` | テストユーティリティ | リポジトリローカルの非推奨互換バレル。`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` など、用途を限定したリポジトリローカルのテストサブパスを使用 |
</Accordion>

  この表は共通の移行対象サブセットであり、SDK サーフェス全体ではありません。
  コンパイラーのエントリポイント一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。
  パッケージのエクスポートは公開サブセットから生成されます。

  予約済みのバンドル Plugin 用ヘルパー境界は、公開 SDK の
  エクスポートマップから廃止されました。ただし、公開済みの
  `@openclaw/discord` パッケージを引き続き直接インポートする外部 Plugin のために
  維持されている、非推奨の `plugin-sdk/discord` シムなど、明示的に文書化された
  互換性ファサードは除きます。所有者固有のヘルパーは、所有する Plugin パッケージ内に置かれます。
  共有ホストの動作は、`plugin-sdk/gateway-runtime`、
  `plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの
  汎用 SDK コントラクトを介して移動します。

  用途に合う最も限定的なインポートを使用してください。エクスポートが見つからない場合は、
  `src/plugin-sdk/` のソースを確認するか、どの汎用
  コントラクトがそれを所有すべきかをメンテナーに問い合わせてください。

  ## 有効な非推奨項目

  Plugin SDK、プロバイダーコントラクト、ランタイム
  サーフェス、マニフェストにわたる、より限定的な非推奨項目です。いずれも現在は引き続き動作しますが、将来の
  メジャーリリースで削除されます。各項目では、旧 API とその標準的な代替を対応付けています。

  <AccordionGroup>
  <Accordion title="command-auth ヘルプビルダー -> command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**: シグネチャも
    エクスポートも同じです。より限定的なサブパスからインポートする点だけが異なります。`command-auth` は
    これらを互換スタブとして再エクスポートします。

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
    `resolveMentionGating(params)` と
    `resolveMentionGatingWithBypass(params)`。

    **新**: `resolveInboundMentionDecision({ facts, policy })`。分割された 2 つの呼び出し形式ではなく、
    1 つの判定オブジェクトを使用します。

    Discord、iMessage、Matrix、MS Teams、QQBot、Signal、
    Telegram、WhatsApp、Zalo で採用されています。Slack 独自の `app_mention` イベントモデルでは、
    このヘルパーを使用しません。

  </Accordion>

  <Accordion title="チャンネルランタイムシムとチャンネルアクションヘルパー">
    `openclaw/plugin-sdk/channel-runtime` は、古い
    チャンネル Plugin 向けの互換性シムです。新しいコードからインポートしないでください。ランタイム
    オブジェクトの登録には `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、
    生の「actions」チャンネルエクスポートとともに非推奨です。代わりに、意味的な
    `presentation` サーフェスを介して機能を公開してください。チャンネル Plugin は、
    受け入れる生のアクション名ではなく、レンダリングするもの（カード、ボタン、選択肢）を
    宣言します。

  </Accordion>

  <Accordion title="Web 検索プロバイダーの tool() ヘルパー -> Plugin の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()` ファクトリー。

    **新**: プロバイダー Plugin に `createTool(...)` を直接実装します。
    OpenClaw では、ツールラッパーを登録するための SDK ヘルパーが不要になりました。

  </Accordion>

  <Accordion title="プレーンテキストのチャンネルエンベロープ -> BodyForAgent">
    **旧**: 受信チャンネルメッセージからフラットな
    プレーンテキストプロンプトエンベロープを構築するための `api.runtime.channel.reply.formatInboundEnvelope(...)`
    （および受信メッセージオブジェクトの
    `channelEnvelope` フィールド）。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャンネル
    Plugin は、ルーティングメタデータ（スレッド、トピック、返信先、リアクション）を
    プロンプト文字列に連結するのではなく、型付きフィールドとして添付します。
    `formatAgentEnvelope(...)` ヘルパーは、合成された
    アシスタント向けエンベロープでは引き続きサポートされますが、受信プレーンテキストエンベロープは
    廃止予定です。

    影響を受ける領域: `inbound_claim`、`message_received`、および旧エンベロープテキストを
    後処理していたすべてのカスタム
    チャンネル Plugin。

  </Accordion>

  <Accordion title="deactivate フック -> gateway_stop">
    **旧**: `api.on("deactivate", handler)`。

    **新**: `api.on("gateway_stop", handler)`。シャットダウン時のクリーンアップ
    コントラクトは同じで、フック名のみが変わります。

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

    `deactivate` は、2026-08-16 より後に削除されるまで、
    非推奨の互換性エイリアスとして引き続き接続されています。

  </Accordion>

  <Accordion title="subagent_spawning フック -> コアスレッドバインディング">
    **旧**: `threadBindingReady` または `deliveryOrigin` を返す
    `api.on("subagent_spawning", handler)`。

    **新**: チャンネルセッションバインディングアダプターを介して、コアが
    `thread: true` サブエージェントバインディングを準備するようにします。
    `api.on("subagent_spawned", handler)` は、起動後の監視にのみ使用してください。

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
    `PluginHookSubagentSpawningResult`、`SubagentLifecycleHookRunner.runSubagentSpawning(...)` は、
    外部 Plugin の移行中に限り非推奨の互換性サーフェスとして残り、
    2026-08-30 より後に削除されます。

  </Accordion>

  <Accordion title="プロバイダー検出型 -> プロバイダーカタログ型">
    4 つの検出型エイリアスは、現在ではカタログ時代の
    型に対する薄いラッパーです。

    | 旧エイリアス                 | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    さらに、従来の静的バッグ `ProviderCapabilities` があります。プロバイダー Plugin は、
    静的オブジェクトではなく、`buildReplayPolicy`、
    `normalizeToolSchemas`、`wrapStreamFn` などの
    明示的なプロバイダーフックを使用してください。

  </Accordion>

  <Accordion title="思考ポリシーフック -> resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上の 3 つの個別フック）:
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 標準の `id`、任意の `label`、
    およびランク付けされたレベル一覧を含む
    `ProviderThinkingProfile` を返す単一の `resolveThinkingProfile(ctx)`。
    OpenClaw は、保存済みの古い値をプロファイルランクに基づいて自動的にダウングレードします。

    コンテキストには、`provider`、`modelId`、任意のマージ済み `reasoning`、
    および任意のマージ済みモデル `compat` の情報が含まれます。プロバイダー Plugin は、
    設定されたリクエストコントラクトが対応している場合にのみ、これらのカタログ情報を使用して
    モデル固有のプロファイルを公開できます。

    3 つではなく 1 つのフックを実装してください。従来のフックは
    非推奨期間中も引き続き動作しますが、プロファイル結果とは合成されません。

  </Accordion>

  <Accordion title="外部認証プロバイダー -> contracts.externalAuthProviders">
    **旧**: Plugin マニフェストでプロバイダーを宣言せずに、
    外部認証フックを実装します。

    **新**: Plugin マニフェストで `contracts.externalAuthProviders` を宣言
    **し、かつ** `resolveExternalAuthProfiles(...)` を実装します。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="プロバイダー環境変数検索 -> setup.providers[].envVars">
    **旧**マニフェストフィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ環境変数検索をマニフェストの `setup.providers[].envVars` に
    反映します。これにより、セットアップとステータスの環境メタデータが 1 か所に統合され、
    環境変数検索に応答するだけのために Plugin ランタイムを起動する必要がなくなります。

    `providerAuthEnvVars` は、非推奨期間が終了するまで
    互換性アダプターを通じて引き続きサポートされます。

  </Accordion>

  <Accordion title="メモリ Plugin 登録 -> registerMemoryCapability">
    **旧**: 3 つの個別呼び出し — `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新**: メモリ状態 API での 1 回の呼び出し —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    スロットは同じで、登録呼び出しは 1 回です。追加のプロンプトおよびコーパスヘルパー
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）には
    影響しません。

  </Accordion>

  <Accordion title="メモリ埋め込みプロバイダー API">
    **旧**: `api.registerMemoryEmbeddingProvider(...)` と
    `contracts.memoryEmbeddingProviders`。

    **新**: `api.registerEmbeddingProvider(...)` と
    `contracts.embeddingProviders`。

    汎用埋め込みプロバイダーコントラクトはメモリ以外でも再利用可能であり、
    新しいプロバイダーでサポートされる方法です。既存プロバイダーの
    移行中は、メモリ固有の登録 API が非推奨の互換性機能として
    引き続き接続されます。Plugin の検査では、非バンドルでの使用が互換性
    負債として報告されます。

  </Accordion>

  <Accordion title="生のチャンネル送信結果 -> OutboundDeliveryResult">
    **旧**: `ChannelSendRawResult` を通じて `{ ok, messageId, error }` を返し、
    `createRawChannelSendResultAdapter(...)` で正規化します。

    **新**: `OutboundDeliveryResult` フィールドを返し、
    `createAttachedChannelResultAdapter(...)` でチャンネルを付加します。送信失敗時は、
    エラー文字列を返すのではなく例外をスローする必要があります。生の結果型は、次の
    Plugin SDK メジャーリリースまで引き続き利用できます。

  </Accordion>

  <Accordion title="サブエージェントセッションメッセージ型の名称変更">
    `src/plugins/runtime/types.ts` から引き続きエクスポートされる 2 つの従来型エイリアス:

    | 旧                           | 新                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は、
    `getSessionMessages` を優先するため非推奨です。シグネチャは同じで、旧メソッドは
    新しいメソッドを呼び出します。

  </Accordion>

  <Accordion title="削除されたセッションおよびトランスクリプトファイル API">
    SQLite セッション／トランスクリプトへの移行により、アクティブな
    `sessions.json` ストア、JSONL トランスクリプトパス、またはセッションファイル一覧を
    公開していた Plugin 向け API が削除または非推奨になります。ランタイム Plugin は、
    アクティブなファイルを解決または変更するのではなく、セッション ID と SDK ランタイム
    ヘルパーを使用してください。

    | 移行対象サーフェス | 代替 |
    | ----------------- | ----------- |
    | 非推奨の `loadSessionStore(...)`、`updateSessionStore(...)`、`resolveSessionStoreEntry(...)` | `getSessionEntry(...)`、`listSessionEntries(...)`、および行単位のセッション変更。 |
    | 非推奨の `resolveSessionFilePath(...)` | セッション ID（`sessionKey`、`sessionId`、SDK ランタイムターゲットヘルパー）と、現在のセッションを操作する Gateway メソッド。 |
    | 削除された `saveSessionStore(...)` | Gateway が所有するセッションランタイム API。Plugin コードは、アクティブなストアファイルを書き込むのではなく、文書化されたランタイム／コンテキストヘルパーを介してセッション状態を要求または変更してください。 |
    | 削除された `resolveSessionTranscriptPathInDir(...)` と `resolveAndPersistSessionFile(...)` | セッション ID と、現在のセッションを操作する Gateway メソッド。 |
    | `readLatestAssistantTextFromSessionTranscript(...)` | 現在のランタイムコンテキストによって公開される ID ベースのトランスクリプトリーダー。または、Plugin がトランスクリプト所有者のパス外にある場合は Gateway の履歴／セッションメソッド。 |
    | `SessionTranscriptUpdate.sessionFile` | `agentId`、`sessionKey`、`sessionId` を使用する `SessionTranscriptUpdate.target`。 |
    | `sessionFiles` などのメモリ同期入力 | ホストが提供する ID ベースのトランスクリプト／セッションソース。ライブセッションについてアクティブな JSONL ファイルを巡回しないでください。 |
    | アクティブなセッション向けに `transcriptPath` または `sessionFile` と命名されたランタイムオプション | ストレージに依存しないセッション ID を保持する `sessionTarget`／ランタイムターゲットオブジェクト。 |

    従来の JSONL トランスクリプトファイルは、インポート、アーカイブ、エクスポート、サポート用の
    成果物として引き続き有効です。アクティブなセッションにおける定常状態のランタイムコントラクトでは
    なくなりました。

    `v2026.7.1-beta.5` とともにリリースされた公式Pluginは、上記の非推奨ヘルパー4つをインポートしていました。`openclaw/plugin-sdk/session-store-runtime` は、そのブリッジを2026-10-12まで厳密に維持します。新しいPluginでは代替機能を使用する必要があります。
    `resolveStorePath(...)` は引き続きサポート対象のSDKヘルパーであり、
    この非推奨化には含まれません。

    `openclaw plugins inspect --all --runtime` は、読み込みエラーまたは診断で、削除されたこれらのファイルAPIが引き続き参照されている非バンドルPluginを報告します。
    外部パッケージのスキャンでも、ストア全体のセッションヘルパー、
    セッションファイルパスヘルパー、レガシートランスクリプトファイルのターゲット、および低レベルの
    トランスクリプトヘルパーがリリース前に検出されるよう、`@openclaw/plugin-inspector` の勧告スイープではバージョン `0.3.17` 以降を使用する必要があります。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow`（単数形）は、ライブのタスクフロー
    アクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、フローから子タスクを作成、更新、キャンセル、または実行するPlugin向けに、
    管理対象TaskFlowの変更ランタイムを維持します。PluginでDTOベースの
    読み取りのみが必要な場合は、`runtime.tasks.flows` を使用してください。

    ```typescript
    // 変更前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 変更後
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    2026-07-26以降に削除されます。

  </Accordion>

  <Accordion title="埋め込み拡張ファクトリ -> エージェントのツール結果ミドルウェア">
    上記の[移行方法](#how-to-migrate)で説明しています。完全を期すため、ここにも記載します。
    削除された埋め込みランナー専用の
    `api.registerEmbeddedExtensionFactory(...)` パスは、
    `contracts.agentToolResultMiddleware` 内の明示的なランタイムリストを使用する
    `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaTypeエイリアス -> OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は現在、
    `OpenClawConfig` に対する1行のエイリアスです。正規の名前を使用してください。

    ```typescript
    // 変更前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 変更後
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
拡張レベルの非推奨化（`extensions/` 配下のバンドルされたチャンネル／プロバイダーPlugin内）は、それぞれの `api.ts` および `runtime-api.ts`
バレル内で追跡されます。これらはサードパーティPluginの契約には影響せず、
ここには記載していません。バンドルされたPluginのローカルバレルを直接使用する場合は、
アップグレード前にそのバレル内の非推奨化コメントを確認してください。
</Note>

## Talkとリアルタイム音声の移行

リアルタイム音声、電話、会議、およびブラウザのTalkコードは、`openclaw/plugin-sdk/realtime-voice` からエクスポートされる1つのTalk
セッションコントローラーを共有します。このコントローラーは、
共通のTalkイベントエンベロープ、アクティブなターンの状態、キャプチャ状態、出力音声の状態、
最近のイベント履歴、および古いターンの拒否を管理します。
プロバイダーPluginはベンダー固有のリアルタイムセッションを管理し、サーフェスPluginは
キャプチャ、再生、電話、および会議固有の処理を管理します。

バンドルされたすべてのサーフェスは共有コントローラー上で動作します。対象は、ブラウザリレー、
管理対象ルームのハンドオフ、音声通話のリアルタイム処理、音声通話のストリーミングSTT、Google
Meetのリアルタイム処理、およびネイティブのプッシュトゥトークです。Gatewayは `hello-ok.features.events` で、
1つのライブTalkイベントチャンネル `talk.event` を通知します。

低レベルのアダプターまたはテストフィクスチャを実装する場合を除き、新しいコードから
`createTalkEventSequencer(...)` を直接呼び出さないでください。共有コントローラーを使用することで、
ターンIDなしでターンスコープのイベントが送出されることを防ぎ、古い `turnEnd` /
`turnCancel` 呼び出しによって新しいアクティブなターンがクリアされることを防止し、出力音声の
ライフサイクルイベントを、電話、会議、ブラウザリレー、
管理対象ルームのハンドオフ、およびネイティブTalkクライアント間で一貫させます。

公開APIの形式は次のとおりです。

```typescript
// Gatewayが所有するTalkセッションAPI。
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

// クライアントが所有するプロバイダーセッションAPI。
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

ブラウザが所有するWebRTC／プロバイダーWebSocketセッションでは `talk.client.create` を使用します。
これは、ブラウザがプロバイダーとのネゴシエーションとメディア転送を管理し、
Gatewayが認証情報、指示、およびツールポリシーを管理するためです。`talk.session.*` は、
Gatewayリレーのリアルタイム処理、Gatewayリレーの文字起こし、および管理対象ルームのネイティブSTT/TTSセッション向けの、
Gatewayが管理する共通サーフェスです。

`talk.provider` / `talk.providers` の横にリアルタイムセレクターを配置するレガシー設定は、
`openclaw doctor --fix` を使用して修復する必要があります。ランタイムのTalkは、
音声／TTSプロバイダー設定をリアルタイムプロバイダー設定として再解釈しません。

サポートされる `talk.session.create` の組み合わせは、意図的に少数に限定されています。

| モード            | トランスポート       | ブレイン           | 所有者              | 備考                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gatewayを介してブリッジされる全二重プロバイダー音声。ツール呼び出しはエージェントコンサルトツールを経由します。           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | ストリーミングSTTのみ。呼び出し元は入力音声を送信し、トランスクリプトイベントを受信します。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ネイティブ／クライアントルーム | クライアントがキャプチャ／再生を管理し、Gatewayがターン状態を管理するプッシュトゥトークおよびトランシーバー形式のルーム。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ネイティブ／クライアントルーム | Gatewayのツールアクションを直接実行する、信頼されたファーストパーティサーフェス向けの管理者専用ルームモード。                  |

旧 `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` ファミリー（すべて削除済み）から移行する読者向けのメソッド対応表：

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

統一された制御語彙も、意図的に狭く定義されています。

| メソッド                          | 適用対象                                              | 契約                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`、`transcription/gateway-relay` | 同じGateway接続が所有するプロバイダーセッションに、base64 PCM音声チャンクを追加します。                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 管理対象ルームのユーザーターンを開始します。                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 古いターンの検証後に、アクティブなターンを終了します。                                                                                                                                                                          |
| `talk.session.cancelTurn`       | Gatewayが所有するすべてのセッション                              | ターンのアクティブなキャプチャ／プロバイダー／エージェント／TTS処理をキャンセルします。                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | ユーザーターンを必ずしも終了せずに、アシスタントの音声出力を停止します。                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | ブリッジによって公開される非同期完了処理の後に、プロバイダーのツール呼び出しを完了します。中間出力には `options.willContinue` を渡し、サポートされている場合は別のアシスタント応答を回避するために `options.suppressResponse` を渡します。 |
| `talk.session.steer`            | エージェントを利用するTalkセッション                              | Talkセッションから解決されたアクティブな埋め込み実行に、音声による `status`、`steer`、`cancel`、または `followup` 制御を送信します。                                                                                                 |
| `talk.session.close`            | 統一されたすべてのセッション                                    | リレーセッションを停止するか、管理対象ルームの状態を取り消してから、統一セッションIDを破棄します。                                                                                                                                     |

これを実現するために、コアへプロバイダーまたはプラットフォーム固有の処理を導入しないでください。
コアはTalkセッションのセマンティクスを管理します。プロバイダーPluginはベンダーセッションのセットアップを管理します。
音声通話とGoogle Meetは、電話／会議アダプターを管理します。ブラウザおよびネイティブ
アプリは、デバイスのキャプチャ／再生UXを管理します。

## 削除スケジュール

| 時期                                        | 発生すること                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **現在**                                     | 非推奨のサーフェスは実行時に警告を出します。                                                                                             |
| **各互換性レコードの `removeAfter` 日付** | その特定のサーフェスは削除対象になります。日付を過ぎると `pnpm plugins:boundary-report --fail-on-eligible-compat` が CI を失敗させます。 |
| **次のメジャーリリース**                      | まだ移行されていないサーフェスはすべて削除され、それらを引き続き使用しているプラグインは動作しなくなります。                                                       |

すべてのコアプラグインはすでに移行済みです。外部プラグインは、
次のメジャーリリースまでに移行する必要があります。`pnpm plugins:boundary-report` を実行すると、
プラグインが使用するサーフェスについて、期限が近い互換性レコードを確認できます。

## 警告を一時的に抑制する

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な回避手段であり、恒久的な解決策ではありません。

## 関連項目

- [はじめに](/ja-JP/plugins/building-plugins) - 最初のプラグインを構築する
- [SDK の概要](/ja-JP/plugins/sdk-overview) - サブパスインポートの完全なリファレンス
- [チャンネルプラグイン](/ja-JP/plugins/sdk-channel-plugins) - チャンネルプラグインの構築
- [プロバイダープラグイン](/ja-JP/plugins/sdk-provider-plugins) - プロバイダープラグインの構築
- [プラグインの内部構造](/ja-JP/plugins/architecture) - アーキテクチャの詳細解説
- [プラグインマニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマのリファレンス
