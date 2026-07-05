---
read_when:
    - Plugin のテストを作成している
    - Plugin SDK のテストユーティリティが必要です
    - バンドルされたプラグインのコントラクトテストを理解したい
sidebarTitle: Testing
summary: OpenClaw Plugin のテストユーティリティとパターン
title: Plugin テスト
x-i18n:
    generated_at: "2026-07-05T11:36:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9837eae92abfc6e7e7ebc5802ddc7bf2f452140f34adca266c5c069fb927ffb9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin のテストユーティリティ、パターン、lint 強制のリファレンス。

<Tip>
  **テスト例を探していますか?** ハウツーガイドには実際に動くテスト例が含まれています:
  [Channel Plugin テスト](/ja-JP/plugins/sdk-channel-plugins#step-6-test) と
  [Provider Plugin テスト](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

これらのサブパスは、OpenClaw 独自の同梱 Plugin テスト向けのリポジトリローカルなソースエントリポイントです。サードパーティー Plugin 向けに公開される `package.json` export ではなく、Vitest やその他のリポジトリ専用テスト依存関係を import する場合があります。

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

新しい同梱 Plugin テストでは、これらの焦点を絞ったサブパスを優先してください。広範な `openclaw/plugin-sdk/testing` バレルと `openclaw/plugin-sdk/test-utils` エイリアスは、レガシー互換性のためだけのものです: `pnpm run lint:plugins:no-extension-test-core-imports` (`scripts/check-no-extension-test-core-imports.ts`) は、extension テストファイルからそのいずれかを新たに import することを拒否し、どちらも互換性記録テストのためにのみ残されています。

### 利用可能な export

| Export                                               | 目的                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 直接登録の単体テスト用に最小限のプラグイン API モックを構築します。`plugin-sdk/plugin-test-api` からインポートします                    |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ネイティブエージェントランタイムアダプター用の共有認証プロファイルコントラクトフィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ネイティブエージェントランタイムアダプター用の共有配信抑制コントラクトフィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ネイティブエージェントランタイムアダプター用の共有フォールバック分類コントラクトフィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `createParameterFreeTool`                            | ネイティブランタイムコントラクトテスト用の動的ツールスキーマフィクスチャを構築します。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `expectChannelInboundContextContract`                | チャンネル受信コンテキストの形状をアサートします。`plugin-sdk/channel-contract-testing` からインポートします                           |
| `installChannelOutboundPayloadContractSuite`         | チャンネル送信ペイロードのコントラクトケースをインストールします。`plugin-sdk/channel-contract-testing` からインポートします            |
| `createStartAccountContext`                          | チャンネルアカウントのライフサイクルコンテキストを構築します。`plugin-sdk/channel-test-helpers` からインポートします                    |
| `installChannelActionsContractSuite`                 | 汎用チャンネルメッセージアクションのコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします      |
| `installChannelSetupContractSuite`                   | 汎用チャンネルセットアップのコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします              |
| `installChannelStatusContractSuite`                  | 汎用チャンネルステータスのコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                |
| `expectDirectoryIds`                                 | ディレクトリリスト関数からのチャンネルディレクトリ ID をアサートします。`plugin-sdk/channel-test-helpers` からインポートします          |
| `assertBundledChannelEntries`                        | バンドル済みチャンネルエントリポイントが期待される公開コントラクトを公開していることをアサートします。`plugin-sdk/channel-test-helpers` からインポートします |
| `formatEnvelopeTimestamp`                            | 決定的なエンベロープタイムスタンプをフォーマットします。`plugin-sdk/channel-test-helpers` からインポートします                         |
| `expectPairingReplyText`                             | チャンネルペアリング返信テキストをアサートし、そのコードを抽出します。`plugin-sdk/channel-test-helpers` からインポートします            |
| `describePluginRegistrationContract`                 | プラグイン登録コントラクトのチェックをインストールします。`plugin-sdk/plugin-test-contracts` からインポートします                       |
| `registerSingleProviderPlugin`                       | ローダースモークテストで 1 つのプロバイダープラグインを登録します。`plugin-sdk/plugin-test-runtime` からインポートします                |
| `registerProviderPlugin`                             | 1 つのプラグインからすべてのプロバイダー種別をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                  |
| `registerProviderPlugins`                            | 複数のプラグインにまたがるプロバイダー登録をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                    |
| `requireRegisteredProvider`                          | プロバイダーコレクションに ID が含まれることをアサートします。`plugin-sdk/plugin-test-runtime` からインポートします                    |
| `createRuntimeEnv`                                   | モック化された CLI/プラグインランタイム環境を構築します。`plugin-sdk/plugin-test-runtime` からインポートします                         |
| `createPluginRuntimeMock`                            | モック化されたプラグインランタイムサーフェスを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                         |
| `createPluginSetupWizardStatus`                      | チャンネルプラグイン用のセットアップステータスヘルパーを構築します。`plugin-sdk/plugin-test-runtime` からインポートします              |
| `createTestWizardPrompter`                           | モック化されたセットアップウィザードプロンプターを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                    |
| `createRuntimeTaskFlow`                              | 分離されたランタイムタスクフロー状態を作成します。`plugin-sdk/plugin-test-runtime` からインポートします                                |
| `runProviderCatalog`                                 | テスト依存関係を使用してプロバイダーカタログフックを実行します。`plugin-sdk/plugin-test-runtime` からインポートします                  |
| `resolveProviderWizardOptions`                       | コントラクトテストでプロバイダーセットアップウィザードの選択肢を解決します。`plugin-sdk/plugin-test-runtime` からインポートします      |
| `resolveProviderModelPickerEntries`                  | コントラクトテストでプロバイダーモデルピッカーのエントリを解決します。`plugin-sdk/plugin-test-runtime` からインポートします            |
| `buildProviderPluginMethodChoice`                    | アサーション用のプロバイダーウィザード選択 ID を構築します。`plugin-sdk/plugin-test-runtime` からインポートします                      |
| `setProviderWizardProvidersResolverForTest`          | 分離テスト用にプロバイダーウィザードのプロバイダーを注入します。`plugin-sdk/plugin-test-runtime` からインポートします                  |
| `describeOpenAIProviderRuntimeContract`              | プロバイダーファミリーランタイムコントラクトのチェックをインストールします。`plugin-sdk/provider-test-contracts` からインポートします  |
| `expectPassthroughReplayPolicy`                      | プロバイダー所有のツールとメタデータをプロバイダーリプレイポリシーがパススルーすることをアサートします。`plugin-sdk/provider-test-contracts` からインポートします |
| `runRealtimeSttLiveTest`                             | 共有音声フィクスチャを使用してライブリアルタイム STT プロバイダーテストを実行します。`plugin-sdk/provider-test-contracts` からインポートします |
| `normalizeTranscriptForMatch`                        | あいまいアサーションの前にライブ文字起こし出力を正規化します。`plugin-sdk/provider-test-contracts` からインポートします                |
| `expectExplicitVideoGenerationCapabilities`          | 動画プロバイダーが明示的な生成モード機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts` からインポートします  |
| `expectExplicitMusicGenerationCapabilities`          | 音楽プロバイダーが明示的な生成/編集機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts` からインポートします   |
| `mockSuccessfulDashscopeVideoTask`                   | 成功した DashScope 互換の動画タスクレスポンスをインストールします。`plugin-sdk/provider-test-contracts` からインポートします           |
| `getProviderHttpMocks`                               | オプトインのプロバイダー HTTP/認証 Vitest モックにアクセスします。`plugin-sdk/provider-http-test-mocks` からインポートします           |
| `installProviderHttpMockCleanup`                     | 各テスト後にプロバイダー HTTP/認証モックをリセットします。`plugin-sdk/provider-http-test-mocks` からインポートします                   |
| `installCommonResolveTargetErrorCases`               | ターゲット解決エラー処理用の共有テストケース。`plugin-sdk/channel-target-testing` からインポートします                                 |
| `shouldAckReaction`                                  | チャンネルが ack リアクションを追加すべきかを確認します。`plugin-sdk/channel-feedback` からインポートします                            |
| `removeAckReactionAfterReply`                        | 返信配信後に ack リアクションを削除します。`plugin-sdk/channel-feedback` からインポートします                                           |
| `createTestRegistry`                                 | チャンネルプラグインレジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします |
| `createEmptyPluginRegistry`                          | 空のプラグインレジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします |
| `setActivePluginRegistry`                            | プラグインランタイムテスト用のレジストリフィクスチャをインストールします。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします |
| `createRequestCaptureJsonFetch`                      | メディアヘルパーテストで JSON fetch リクエストをキャプチャします。`plugin-sdk/test-env` からインポートします                           |
| `withServer`                                         | 使い捨てのローカル HTTP サーバーに対してテストを実行します。`plugin-sdk/test-env` からインポートします                                 |
| `createMockIncomingRequest`                          | 最小限の受信 HTTP リクエストオブジェクトを構築します。`plugin-sdk/test-env` からインポートします                                        |
| `withFetchPreconnect`                                | preconnect フックをインストールした状態で fetch テストを実行します。`plugin-sdk/test-env` からインポートします                         |
| `withEnv` / `withEnvAsync`                           | 環境変数を一時的にパッチします。`plugin-sdk/test-env` からインポートします                                                              |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 分離されたファイルシステムテストフィクスチャを作成します。`plugin-sdk/test-env` からインポートします                                    |
| `createMockServerResponse`                           | 最小限の HTTP サーバーレスポンスモックを作成します。`plugin-sdk/test-env` からインポートします                                          |
| `createProviderUsageFetch`                           | プロバイダー使用量 fetch フィクスチャを構築します。`plugin-sdk/test-env` からインポートします                                           |
| `useFrozenTime` / `useRealTime`                      | 時間依存テスト用にタイマーを凍結および復元します。`plugin-sdk/test-env` からインポートします                                           |
| `createCliRuntimeCapture`                            | テストで CLI ランタイム出力をキャプチャします。`plugin-sdk/test-fixtures` からインポートします                                          |
| `importFreshModule`                                  | モジュールキャッシュを回避するために、新しいクエリトークン付きで ESM モジュールをインポートします。`plugin-sdk/test-fixtures` からインポートします |
| `bundledPluginRoot` / `bundledPluginFile`            | バンドル済みプラグインのソースまたは dist フィクスチャパスを解決します。`plugin-sdk/test-fixtures` からインポートします                |
| `mockNodeBuiltinModule`                              | 狭い範囲の Node 組み込み Vitest モックをインストールします。`plugin-sdk/test-node-mocks` からインポートします                          |
| `createSandboxTestContext`                           | サンドボックステストコンテキストを構築します。`plugin-sdk/test-fixtures` からインポートします                                           |
| `writeSkill`                                         | skill フィクスチャを書き込みます。`plugin-sdk/test-fixtures` からインポートします                                                                             |
| `makeAgentAssistantMessage`                          | エージェントトランスクリプトメッセージのフィクスチャを構築します。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | システムイベントフィクスチャを検査してリセットします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `sanitizeTerminalText`                               | アサーション用にターミナル出力をサニタイズします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `countLines` / `hasBalancedFences`                   | チャンク化出力の形状をアサートします。`plugin-sdk/test-fixtures` からインポートします                                                                     |
| `typedCases`                                         | テーブル駆動テスト用にリテラル型を保持します。`plugin-sdk/test-fixtures` からインポートします                                                    |

バンドルPluginのコントラクトスイートも、テスト専用のレジストリ、マニフェスト、公開アーティファクト、ランタイムフィクスチャヘルパーに、これらの SDK テスト用サブパスを使用します。
バンドルされた OpenClaw インベントリに依存するコア専用スイートは、代わりに
`src/plugins/contracts` 配下に置かれます。

### 型

対象を絞ったテスト用サブパスは、テストファイルで有用な型も再エクスポートします。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## テスト対象の解決

`installCommonResolveTargetErrorCases` を使用して、チャンネルターゲット解決の標準エラーケースを追加します。

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## テストパターン

### 登録コントラクトのテスト

手書きの `api` モックを `register(api)` に渡す単体テストでは、OpenClaw のローダー受け入れゲートを実行できません。Plugin が依存する各登録サーフェスについて、特にフックやメモリのような排他的ケイパビリティでは、少なくとも 1 つのローダー経由のスモークテストを追加してください。

実際のローダーは、必要なメタデータが欠けている場合や、Plugin が所有していないケイパビリティ API を呼び出した場合に Plugin 登録を失敗させます。たとえば、
`api.registerHook(...)` にはフック名が必要であり、
`api.registerMemoryCapability(...)` には Plugin マニフェストまたはエクスポートされたエントリで `kind: "memory"` を宣言する必要があります。

### ランタイム設定アクセスのテスト

`openclaw/plugin-sdk/plugin-test-runtime` の共有 Plugin ランタイムモックを優先してください。
その `runtime.config.loadConfig()` と `runtime.config.writeConfigFile(...)`
モックはデフォルトで例外を投げるため、非推奨の互換 API の新たな使用をテストで検出できます。テストがレガシー互換動作を明示的に扱う場合にのみ、これらのモックをオーバーライドしてください。

### チャンネルPluginの単体テスト

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
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

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### プロバイダーPluginの単体テスト

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin ランタイムのモック

`createPluginRuntimeStore` を使用するコードでは、テストでランタイムをモックします。

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### インスタンスごとのスタブを使ったテスト

プロトタイプ変更よりも、インスタンスごとのスタブを優先してください。

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## コントラクトテスト（リポジトリ内Plugin）

バンドルPluginには、登録の所有権を検証するコントラクトテストがあります。

```bash
pnpm test src/plugins/contracts/
```

これらのテストは次を検証します。

- どのPluginがどのプロバイダーを登録するか
- どのPluginがどの音声プロバイダーを登録するか
- 登録形状の正しさ
- ランタイムコントラクトへの準拠

### スコープ付きテストの実行

特定のPluginの場合:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

コントラクトテストのみの場合:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## lint の強制（リポジトリ内Plugin）

`scripts/run-additional-boundary-checks.mjs` は CI で一連の `lint:plugins:*`
インポート境界チェックを実行します。それぞれローカルで単独実行することもできます。

| コマンド                                                       | 強制内容                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | バンドルPluginは、モノリシックな `openclaw/plugin-sdk` ルートバレルをインポートできません。                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | 本番 extension ファイルは、リポジトリの `src/**` ツリーを直接インポートできません（`../../src/...`）。                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Extension テストファイルは、`openclaw/plugin-sdk/testing`、`plugin-sdk/test-utils`、その他のコア専用テストヘルパーをインポートできません。 |

外部Pluginはこれらの lint ルールの対象ではありませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClaw は V8 カバレッジしきい値付きの Vitest 4 を使用します。Plugin テストの場合:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

ローカル実行でメモリ負荷が発生する場合:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 関連

- [SDK の概要](/ja-JP/plugins/sdk-overview) -- インポート規約
- [SDK チャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins) -- チャンネルPluginインターフェイス
- [SDK プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) -- プロバイダーPluginフック
- [Plugin の構築](/ja-JP/plugins/building-plugins) -- はじめにガイド
