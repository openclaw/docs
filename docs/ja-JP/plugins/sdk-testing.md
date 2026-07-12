---
read_when:
    - Plugin のテストを作成しています
    - Plugin SDK のテストユーティリティが必要です
    - バンドルされたプラグインのコントラクトテストについて理解したい場合
sidebarTitle: Testing
summary: OpenClaw Plugin向けのテストユーティリティとパターン
title: Plugin のテスト
x-i18n:
    generated_at: "2026-07-12T14:43:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin向けのテストユーティリティ、パターン、lint適用に関するリファレンスです。

<Tip>
  **テスト例をお探しですか？** ハウツーガイドには、実際のテスト例が含まれています：
  [チャネルPluginのテスト](/ja-JP/plugins/sdk-channel-plugins#step-6-test)と
  [プロバイダーPluginのテスト](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

これらのサブパスは、OpenClaw独自のバンドル済みPluginテスト向けの、リポジトリローカルなソースエントリポイントです。サードパーティーPlugin向けに公開される`package.json`のエクスポートではなく、Vitestやその他のリポジトリ専用テスト依存関係をインポートする場合があります。

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

新しいバンドル済みPluginのテストでは、これらの用途が限定されたサブパスを優先してください。広範な`openclaw/plugin-sdk/testing`バレルと`openclaw/plugin-sdk/test-utils`エイリアスは、レガシー互換性専用です。`pnpm run lint:plugins:no-extension-test-core-imports`
（`scripts/check-no-extension-test-core-imports.ts`）は、拡張機能のテストファイルからこれらを新たにインポートすることを拒否します。また、どちらも互換性記録テストのためだけに維持されています。

### 利用可能なエクスポート

| エクスポート                                         | 目的                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 直接登録ユニットテスト用の最小限のPlugin APIモックを構築します。`plugin-sdk/plugin-test-api`からインポートします                         |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ネイティブエージェントランタイムアダプター用の共有認証プロファイル契約フィクスチャです。`plugin-sdk/agent-runtime-test-contracts`からインポートします |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ネイティブエージェントランタイムアダプター用の共有配信抑制契約フィクスチャです。`plugin-sdk/agent-runtime-test-contracts`からインポートします |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ネイティブエージェントランタイムアダプター用の共有フォールバック分類契約フィクスチャです。`plugin-sdk/agent-runtime-test-contracts`からインポートします |
| `createParameterFreeTool`                            | ネイティブランタイム契約テスト用の動的ツールスキーマフィクスチャを構築します。`plugin-sdk/agent-runtime-test-contracts`からインポートします |
| `expectChannelInboundContextContract`                | チャンネル受信コンテキストの形式をアサートします。`plugin-sdk/channel-contract-testing`からインポートします                              |
| `installChannelOutboundPayloadContractSuite`         | チャンネル送信ペイロードの契約テストケースをインストールします。`plugin-sdk/channel-contract-testing`からインポートします                 |
| `createStartAccountContext`                          | チャンネルアカウントのライフサイクルコンテキストを構築します。`plugin-sdk/channel-test-helpers`からインポートします                       |
| `installChannelActionsContractSuite`                 | 汎用チャンネルメッセージアクションの契約テストケースをインストールします。`plugin-sdk/channel-test-helpers`からインポートします           |
| `installChannelSetupContractSuite`                   | 汎用チャンネルセットアップの契約テストケースをインストールします。`plugin-sdk/channel-test-helpers`からインポートします                   |
| `installChannelStatusContractSuite`                  | 汎用チャンネルステータスの契約テストケースをインストールします。`plugin-sdk/channel-test-helpers`からインポートします                     |
| `expectDirectoryIds`                                 | ディレクトリ一覧関数から取得したチャンネルディレクトリIDをアサートします。`plugin-sdk/channel-test-helpers`からインポートします            |
| `assertBundledChannelEntries`                        | バンドルされたチャンネルのエントリポイントが期待される公開契約を公開していることをアサートします。`plugin-sdk/channel-test-helpers`からインポートします |
| `formatEnvelopeTimestamp`                            | 決定論的なエンベロープのタイムスタンプを整形します。`plugin-sdk/channel-test-helpers`からインポートします                                 |
| `expectPairingReplyText`                             | チャンネルのペアリング返信テキストをアサートし、そのコードを抽出します。`plugin-sdk/channel-test-helpers`からインポートします             |
| `describePluginRegistrationContract`                 | Plugin登録契約のチェックをインストールします。`plugin-sdk/plugin-test-contracts`からインポートします                                    |
| `registerSingleProviderPlugin`                       | ローダーのスモークテストで1つのプロバイダーPluginを登録します。`plugin-sdk/plugin-test-runtime`からインポートします                       |
| `registerProviderPlugin`                             | 1つのPluginからすべてのプロバイダー種別を取得します。`plugin-sdk/plugin-test-runtime`からインポートします                                |
| `registerProviderPlugins`                            | 複数のPluginにわたるプロバイダー登録を取得します。`plugin-sdk/plugin-test-runtime`からインポートします                                   |
| `requireRegisteredProvider`                          | プロバイダーコレクションにIDが含まれていることをアサートします。`plugin-sdk/plugin-test-runtime`からインポートします                      |
| `createRuntimeEnv`                                   | モック化されたCLI／Pluginランタイム環境を構築します。`plugin-sdk/plugin-test-runtime`からインポートします                                |
| `createPluginRuntimeMock`                            | モック化されたPluginランタイムサーフェスを構築します。`plugin-sdk/plugin-test-runtime`からインポートします                               |
| `createPluginSetupWizardStatus`                      | チャンネルPlugin用のセットアップステータスヘルパーを構築します。`plugin-sdk/plugin-test-runtime`からインポートします                     |
| `createTestWizardPrompter`                           | モック化されたセットアップウィザードのプロンプターを構築します。`plugin-sdk/plugin-test-runtime`からインポートします                     |
| `createRuntimeTaskFlow`                              | 分離されたランタイムTaskFlow状態を作成します。`plugin-sdk/plugin-test-runtime`からインポートします                                       |
| `runProviderCatalog`                                 | テスト依存関係を使用してプロバイダーカタログフックを実行します。`plugin-sdk/plugin-test-runtime`からインポートします                      |
| `resolveProviderWizardOptions`                       | 契約テストでプロバイダーセットアップウィザードの選択肢を解決します。`plugin-sdk/plugin-test-runtime`からインポートします                  |
| `resolveProviderModelPickerEntries`                  | 契約テストでプロバイダーモデルピッカーのエントリを解決します。`plugin-sdk/plugin-test-runtime`からインポートします                        |
| `buildProviderPluginMethodChoice`                    | アサーション用のプロバイダーウィザード選択肢IDを構築します。`plugin-sdk/plugin-test-runtime`からインポートします                          |
| `setProviderWizardProvidersResolverForTest`          | 分離テスト用にプロバイダーウィザードのプロバイダーを注入します。`plugin-sdk/plugin-test-runtime`からインポートします                      |
| `describeOpenAIProviderRuntimeContract`              | プロバイダーファミリーのランタイム契約チェックをインストールします。`plugin-sdk/provider-test-contracts`からインポートします              |
| `expectPassthroughReplayPolicy`                      | プロバイダーのリプレイポリシーが、プロバイダー所有のツールとメタデータをそのまま通過させることをアサートします。`plugin-sdk/provider-test-contracts`からインポートします |
| `runRealtimeSttLiveTest`                             | 共有音声フィクスチャを使用してリアルタイムSTTプロバイダーのライブテストを実行します。`plugin-sdk/provider-test-contracts`からインポートします |
| `normalizeTranscriptForMatch`                        | あいまいアサーションの前にライブ文字起こし出力を正規化します。`plugin-sdk/provider-test-contracts`からインポートします                   |
| `expectExplicitVideoGenerationCapabilities`          | 動画プロバイダーが明示的な生成モード機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts`からインポートします      |
| `expectExplicitMusicGenerationCapabilities`          | 音楽プロバイダーが明示的な生成／編集機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts`からインポートします      |
| `mockSuccessfulDashscopeVideoTask`                   | 成功するDashScope互換の動画タスクレスポンスをインストールします。`plugin-sdk/provider-test-contracts`からインポートします                 |
| `getProviderHttpMocks`                               | オプトインのプロバイダーHTTP／認証Vitestモックにアクセスします。`plugin-sdk/provider-http-test-mocks`からインポートします                |
| `installProviderHttpMockCleanup`                     | 各テスト後にプロバイダーHTTP／認証モックをリセットします。`plugin-sdk/provider-http-test-mocks`からインポートします                      |
| `installCommonResolveTargetErrorCases`               | ターゲット解決のエラー処理用の共有テストケースです。`plugin-sdk/channel-target-testing`からインポートします                              |
| `shouldAckReaction`                                  | チャンネルが確認リアクションを追加すべきか確認します。`plugin-sdk/channel-feedback`からインポートします                                 |
| `removeAckReactionAfterReply`                        | 返信配信後に確認リアクションを削除します。`plugin-sdk/channel-feedback`からインポートします                                             |
| `createTestRegistry`                                 | チャンネルPluginレジストリのフィクスチャを構築します。`plugin-sdk/plugin-test-runtime`または`plugin-sdk/channel-test-helpers`からインポートします |
| `createEmptyPluginRegistry`                          | 空のPluginレジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime`または`plugin-sdk/channel-test-helpers`からインポートします |
| `setActivePluginRegistry`                            | Pluginランタイムテスト用のレジストリフィクスチャをインストールします。`plugin-sdk/plugin-test-runtime`または`plugin-sdk/channel-test-helpers`からインポートします |
| `createRequestCaptureJsonFetch`                      | メディアヘルパーテストでJSONフェッチリクエストを取得します。`plugin-sdk/test-env`からインポートします                                   |
| `withServer`                                         | 使い捨てのローカルHTTPサーバーに対してテストを実行します。`plugin-sdk/test-env`からインポートします                                     |
| `createMockIncomingRequest`                          | 最小限の受信HTTPリクエストオブジェクトを構築します。`plugin-sdk/test-env`からインポートします                                           |
| `withFetchPreconnect`                                | 事前接続フックをインストールした状態でフェッチテストを実行します。`plugin-sdk/test-env`からインポートします                             |
| `withEnv` / `withEnvAsync`                           | 環境変数を一時的に変更します。`plugin-sdk/test-env`からインポートします                                                                 |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 分離されたファイルシステムテストフィクスチャを作成します。`plugin-sdk/test-env`からインポートします                                     |
| `createMockServerResponse`                           | 最小限のHTTPサーバーレスポンスモックを作成します。`plugin-sdk/test-env`からインポートします                                             |
| `createProviderUsageFetch`                           | プロバイダー使用量フェッチのフィクスチャを構築します。`plugin-sdk/test-env`からインポートします                                        |
| `useFrozenTime` / `useRealTime`                      | 時間依存テスト用にタイマーを固定および復元します。`plugin-sdk/test-env`からインポートします                                             |
| `createCliRuntimeCapture`                            | テストでCLIランタイム出力を取得します。`plugin-sdk/test-fixtures`からインポートします                                                   |
| `importFreshModule`                                  | モジュールキャッシュを回避するため、新しいクエリトークンを付けてESMモジュールをインポートします。`plugin-sdk/test-fixtures`からインポートします |
| `bundledPluginRoot` / `bundledPluginFile`            | バンドルされたPluginのソースまたはdistフィクスチャのパスを解決します。`plugin-sdk/test-fixtures`からインポートします                     |
| `mockNodeBuiltinModule`                              | 対象を限定したNode組み込みVitestモックをインストールします。`plugin-sdk/test-node-mocks`からインポートします                            |
| `createSandboxTestContext`                           | サンドボックステストコンテキストを構築します。`plugin-sdk/test-fixtures`からインポートします                                            |
| `writeSkill`                                         | skill フィクスチャを書き込みます。`plugin-sdk/test-fixtures` からインポートします                                                                             |
| `makeAgentAssistantMessage`                          | エージェントのトランスクリプトメッセージ用フィクスチャを構築します。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | システムイベントのフィクスチャを検査およびリセットします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `sanitizeTerminalText`                               | アサーション用にターミナル出力をサニタイズします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `countLines` / `hasBalancedFences`                   | チャンク分割出力の形状を検証します。`plugin-sdk/test-fixtures` からインポートします                                                                     |
| `typedCases`                                         | テーブル駆動テスト用にリテラル型を保持します。`plugin-sdk/test-fixtures` からインポートします                                                    |

バンドル Plugin のコントラクトスイートでも、テスト専用のレジストリ、マニフェスト、公開アーティファクト、ランタイムフィクスチャの各ヘルパーとして、これらの SDK テスト用サブパスを使用します。
バンドルされた OpenClaw インベントリに依存するコア専用スイートは、代わりに
`src/plugins/contracts` 配下に置きます。

### 型

対象を絞ったテスト用サブパスでは、テストファイルで役立つ型も再エクスポートされます。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## テスト対象の解決

チャンネルターゲット解決の標準エラーケースを追加するには、`installCommonResolveTargetErrorCases` を使用します。

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channelのターゲット解決", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // チャンネルのターゲット解決ロジック
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // チャンネル固有のテストケースを追加
  it("@usernameターゲットを解決する", () => {
    // ...
  });
});
```

## テストパターン

### 登録コントラクトのテスト

手書きの `api` モックを `register(api)` に渡す単体テストでは、
OpenClaw のローダー受け入れゲートは検証されません。Plugin が依存する各登録サーフェスに対し、ローダーを使用したスモークテストを少なくとも 1 つ追加してください。特に、フックやメモリなどの排他的な機能では重要です。

必須メタデータがない場合や、Plugin が所有していない機能 API を呼び出した場合、実際のローダーでは Plugin の登録が失敗します。たとえば、
`api.registerHook(...)` にはフック名が必要であり、
`api.registerMemoryCapability(...)` には、Plugin マニフェストまたはエクスポートされたエントリで `kind: "memory"` を宣言する必要があります。

### ランタイム設定アクセスのテスト

`openclaw/plugin-sdk/plugin-test-runtime` の共有 Plugin ランタイムモックを優先してください。
その `runtime.config.loadConfig()` および `runtime.config.writeConfigFile(...)`
モックはデフォルトで例外をスローするため、非推奨の互換性 API が新たに使用された場合にテストで検出できます。テストがレガシー互換動作を明示的に検証する場合にのみ、これらのモックをオーバーライドしてください。

### チャンネル Plugin の単体テスト

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel Plugin", () => {
  it("設定からアカウントを解決する", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("シークレットを実体化せずにアカウントを検査する", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // トークン値は公開しない
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### プロバイダー Plugin の単体テスト

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider Plugin", () => {
  it("動的モデルを解決する", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... コンテキスト
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("APIキーが利用可能な場合にカタログを返す", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... コンテキスト
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin ランタイムのモック

`createPluginRuntimeStore` を使用するコードでは、テスト内でランタイムをモックします。

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "テストランタイムが設定されていません",
});

// テストのセットアップ内
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... その他のモック
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... その他の名前空間
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// テスト後
store.clearRuntime();
```

### インスタンスごとのスタブを使用したテスト

プロトタイプの変更より、インスタンスごとのスタブを優先してください。

```typescript
// 推奨: インスタンスごとのスタブ
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 非推奨: プロトタイプの変更
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## コントラクトテスト（リポジトリ内 Plugin）

バンドル Plugin には、登録の所有権を検証するコントラクトテストがあります。

```bash
pnpm test src/plugins/contracts/
```

これらのテストでは、以下を検証します。

- 各プロバイダーを登録する Plugin
- 各音声プロバイダーを登録する Plugin
- 登録形式の正しさ
- ランタイムコントラクトへの準拠

### 範囲を限定したテストの実行

特定の Plugin の場合:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

コントラクトテストのみの場合:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## lint の強制（リポジトリ内 Plugin）

`scripts/run-additional-boundary-checks.mjs` は CI で一連の `lint:plugins:*`
インポート境界チェックを実行します。各チェックはローカルでも個別に実行できます。

| コマンド                                                       | 強制する内容                                                                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | バンドル Plugin は、モノリシックな `openclaw/plugin-sdk` ルートバレルをインポートできません。                               |
| `pnpm run lint:plugins:no-extension-src-imports`               | 本番用拡張機能ファイルは、リポジトリの `src/**` ツリーを直接インポートできません（`../../src/...`）。                       |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | 拡張機能のテストファイルは、`openclaw/plugin-sdk/testing`、`plugin-sdk/test-utils`、その他のコア専用テストヘルパーをインポートできません。 |

外部 Plugin はこれらの lint ルールの対象ではありませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClaw は、参考情報として V8 カバレッジをレポートする Vitest 4 を使用します。Plugin テストの場合:

```bash
# すべてのテストを実行
pnpm test

# 特定のPluginテストを実行
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# 特定のテスト名フィルターで実行
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# カバレッジ付きで実行
pnpm test:coverage
```

ローカル実行でメモリ負荷が高くなる場合:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 関連項目

- [SDK の概要](/ja-JP/plugins/sdk-overview) -- インポート規約
- [SDK チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) -- チャンネル Plugin インターフェース
- [SDK プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) -- プロバイダー Plugin フック
- [Plugin の構築](/ja-JP/plugins/building-plugins) -- はじめにガイド
