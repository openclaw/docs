---
read_when:
    - Plugin のテストを作成している
    - Plugin SDK のテストユーティリティが必要です
    - バンドル済み Plugin の契約テストを理解したい
sidebarTitle: Testing
summary: OpenClaw Plugin のテストユーティリティとパターン
title: Plugin テスト
x-i18n:
    generated_at: "2026-06-28T07:42:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw
plugins 向けのテストユーティリティ、パターン、lint 強制のリファレンス。

<Tip>
  **テスト例を探していますか？** ハウツーガイドには、実例付きのテスト例が含まれています:
  [Channel plugin tests](/ja-JP/plugins/sdk-channel-plugins#step-6-test) と
  [Provider plugin tests](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

これらのテストヘルパーサブパスは、OpenClaw 自身の
バンドル済み plugin テスト向けのリポジトリローカルなソースエントリポイントです。サードパーティ plugin 向けのパッケージエクスポートではなく、
Vitest やその他のリポジトリ専用テスト依存関係を import する場合があります。

**Plugin API モック import:** `openclaw/plugin-sdk/plugin-test-api`

**エージェントランタイム契約 import:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel 契約 import:** `openclaw/plugin-sdk/channel-contract-testing`

**Channel テストヘルパー import:** `openclaw/plugin-sdk/channel-test-helpers`

**Channel ターゲットテスト import:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin 契約 import:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin ランタイムテスト import:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider 契約 import:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider HTTP モック import:** `openclaw/plugin-sdk/provider-http-test-mocks`

**環境/ネットワークテスト import:** `openclaw/plugin-sdk/test-env`

**汎用フィクスチャ import:** `openclaw/plugin-sdk/test-fixtures`

**Node 組み込みモック import:** `openclaw/plugin-sdk/test-node-mocks`

OpenClaw リポジトリ内では、新しいバンドル済み
plugin テストには、以下の対象を絞ったサブパスを優先してください。広範な
`openclaw/plugin-sdk/testing` バレルはレガシー互換性専用です。
リポジトリのガードレールは、`plugin-sdk/testing` と
`plugin-sdk/test-utils` からの新しい実 import を拒否します。これらの名前は、互換性レコードテスト向けの非推奨互換性サーフェスとしてのみ残ります。

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

### 利用可能なエクスポート

| エクスポート                                         | 目的                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 直接登録の単体テスト用に最小限のプラグイン API モックを構築します。`plugin-sdk/plugin-test-api` からインポートします                    |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ネイティブエージェントランタイムアダプター用の共有 auth-profile コントラクトフィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ネイティブエージェントランタイムアダプター用の共有配信抑制コントラクトフィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ネイティブエージェントランタイムアダプター用の共有フォールバック分類コントラクトフィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `createParameterFreeTool`                            | ネイティブランタイムコントラクトテスト用の動的ツールスキーマフィクスチャを構築します。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `expectChannelInboundContextContract`                | チャンネルのインバウンドコンテキスト形状を検証します。`plugin-sdk/channel-contract-testing` からインポートします                       |
| `installChannelOutboundPayloadContractSuite`         | チャンネルのアウトバウンドペイロードコントラクトケースをインストールします。`plugin-sdk/channel-contract-testing` からインポートします  |
| `createStartAccountContext`                          | チャンネルアカウントのライフサイクルコンテキストを構築します。`plugin-sdk/channel-test-helpers` からインポートします                   |
| `installChannelActionsContractSuite`                 | 汎用チャンネルメッセージアクションコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします       |
| `installChannelSetupContractSuite`                   | 汎用チャンネルセットアップコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします               |
| `installChannelStatusContractSuite`                  | 汎用チャンネルステータスコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                 |
| `expectDirectoryIds`                                 | ディレクトリ一覧関数からチャンネルディレクトリ ID を検証します。`plugin-sdk/channel-test-helpers` からインポートします                 |
| `assertBundledChannelEntries`                        | バンドル済みチャンネルエントリポイントが期待される公開コントラクトを公開していることを検証します。`plugin-sdk/channel-test-helpers` からインポートします |
| `formatEnvelopeTimestamp`                            | 決定的なエンベロープタイムスタンプをフォーマットします。`plugin-sdk/channel-test-helpers` からインポートします                        |
| `expectPairingReplyText`                             | チャンネルのペアリング返信テキストを検証し、そのコードを抽出します。`plugin-sdk/channel-test-helpers` からインポートします            |
| `describePluginRegistrationContract`                 | プラグイン登録コントラクトチェックをインストールします。`plugin-sdk/plugin-test-contracts` からインポートします                        |
| `registerSingleProviderPlugin`                       | ローダースモークテストで 1 つのプロバイダープラグインを登録します。`plugin-sdk/plugin-test-runtime` からインポートします              |
| `registerProviderPlugin`                             | 1 つのプラグインからすべてのプロバイダー種別をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                 |
| `registerProviderPlugins`                            | 複数のプラグインにまたがるプロバイダー登録をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                   |
| `requireRegisteredProvider`                          | プロバイダーコレクションに ID が含まれることを検証します。`plugin-sdk/plugin-test-runtime` からインポートします                       |
| `createRuntimeEnv`                                   | モックされた CLI/プラグインランタイム環境を構築します。`plugin-sdk/plugin-test-runtime` からインポートします                          |
| `createPluginRuntimeMock`                            | モックされたプラグインランタイムサーフェスを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                         |
| `createPluginSetupWizardStatus`                      | チャンネルプラグイン用のセットアップステータスヘルパーを構築します。`plugin-sdk/plugin-test-runtime` からインポートします             |
| `describeOpenAIProviderRuntimeContract`              | プロバイダーファミリーのランタイムコントラクトチェックをインストールします。`plugin-sdk/provider-test-contracts` からインポートします |
| `expectPassthroughReplayPolicy`                      | プロバイダー所有のツールとメタデータをプロバイダーリプレイポリシーがそのまま通すことを検証します。`plugin-sdk/provider-test-contracts` からインポートします |
| `runRealtimeSttLiveTest`                             | 共有音声フィクスチャを使ってライブリアルタイム STT プロバイダーテストを実行します。`plugin-sdk/provider-test-contracts` からインポートします |
| `normalizeTranscriptForMatch`                        | あいまい一致アサーションの前にライブ文字起こし出力を正規化します。`plugin-sdk/provider-test-contracts` からインポートします          |
| `expectExplicitVideoGenerationCapabilities`          | 動画プロバイダーが明示的な生成モード機能を宣言していることを検証します。`plugin-sdk/provider-test-contracts` からインポートします     |
| `expectExplicitMusicGenerationCapabilities`          | 音楽プロバイダーが明示的な生成/編集機能を宣言していることを検証します。`plugin-sdk/provider-test-contracts` からインポートします      |
| `mockSuccessfulDashscopeVideoTask`                   | 成功した DashScope 互換の動画タスクレスポンスをインストールします。`plugin-sdk/provider-test-contracts` からインポートします          |
| `getProviderHttpMocks`                               | オプトインのプロバイダー HTTP/auth Vitest モックにアクセスします。`plugin-sdk/provider-http-test-mocks` からインポートします          |
| `installProviderHttpMockCleanup`                     | 各テスト後にプロバイダー HTTP/auth モックをリセットします。`plugin-sdk/provider-http-test-mocks` からインポートします                 |
| `installCommonResolveTargetErrorCases`               | ターゲット解決エラー処理用の共有テストケース。`plugin-sdk/channel-target-testing` からインポートします                                |
| `shouldAckReaction`                                  | チャンネルが ack リアクションを追加すべきかを確認します。`plugin-sdk/channel-feedback` からインポートします                          |
| `removeAckReactionAfterReply`                        | 返信配信後に ack リアクションを削除します。`plugin-sdk/channel-feedback` からインポートします                                         |
| `createTestRegistry`                                 | チャンネルプラグインレジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします |
| `createEmptyPluginRegistry`                          | 空のプラグインレジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします |
| `setActivePluginRegistry`                            | プラグインランタイムテスト用のレジストリフィクスチャをインストールします。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします |
| `createRequestCaptureJsonFetch`                      | メディアヘルパーテストで JSON fetch リクエストをキャプチャします。`plugin-sdk/test-env` からインポートします                          |
| `withServer`                                         | 破棄可能なローカル HTTP サーバーに対してテストを実行します。`plugin-sdk/test-env` からインポートします                                |
| `createMockIncomingRequest`                          | 最小限の受信 HTTP リクエストオブジェクトを構築します。`plugin-sdk/test-env` からインポートします                                      |
| `withFetchPreconnect`                                | preconnect フックをインストールした状態で fetch テストを実行します。`plugin-sdk/test-env` からインポートします                        |
| `withEnv` / `withEnvAsync`                           | 環境変数を一時的にパッチします。`plugin-sdk/test-env` からインポートします                                                             |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 分離されたファイルシステムテストフィクスチャを作成します。`plugin-sdk/test-env` からインポートします                                  |
| `createMockServerResponse`                           | 最小限の HTTP サーバーレスポンスモックを作成します。`plugin-sdk/test-env` からインポートします                                        |
| `createCliRuntimeCapture`                            | テストで CLI ランタイム出力をキャプチャします。`plugin-sdk/test-fixtures` からインポートします                                        |
| `importFreshModule`                                  | モジュールキャッシュを迂回するために、新しいクエリトークン付きで ESM モジュールをインポートします。`plugin-sdk/test-fixtures` からインポートします |
| `bundledPluginRoot` / `bundledPluginFile`            | バンドル済みプラグインのソースまたは dist フィクスチャパスを解決します。`plugin-sdk/test-fixtures` からインポートします               |
| `mockNodeBuiltinModule`                              | 狭い範囲の Node 組み込み Vitest モックをインストールします。`plugin-sdk/test-node-mocks` からインポートします                         |
| `createSandboxTestContext`                           | サンドボックステストコンテキストを構築します。`plugin-sdk/test-fixtures` からインポートします                                         |
| `writeSkill`                                         | Skills フィクスチャを書き込みます。`plugin-sdk/test-fixtures` からインポートします                                                     |
| `makeAgentAssistantMessage`                          | エージェント文字起こしメッセージフィクスチャを構築します。`plugin-sdk/test-fixtures` からインポートします                             |
| `peekSystemEvents` / `resetSystemEventsForTest`      | システムイベントフィクスチャを検査およびリセットします。`plugin-sdk/test-fixtures` からインポートします                               |
| `sanitizeTerminalText`                               | アサーション用にターミナル出力をサニタイズします。`plugin-sdk/test-fixtures` からインポートします                                     |
| `countLines` / `hasBalancedFences`                   | チャンキング出力形状を検証します。`plugin-sdk/test-fixtures` からインポートします                                                     |
| `runProviderCatalog`                                 | テスト依存関係を使ってプロバイダーカタログフックを実行します                                                                           |
| `resolveProviderWizardOptions`                       | コントラクトテストでプロバイダーセットアップウィザードの選択肢を解決します                                                           |
| `resolveProviderModelPickerEntries`                  | コントラクトテストでプロバイダーモデルピッカーのエントリを解決します                                                                 |
| `buildProviderPluginMethodChoice`                    | アサーション用にプロバイダーウィザードの選択肢 ID を構築します                                                                         |
| `setProviderWizardProvidersResolverForTest`          | 分離されたテスト用に provider wizard providers を注入する                                                                                      |
| `createProviderUsageFetch`                           | provider usage fetch フィクスチャを構築する                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 時間依存のテスト用にタイマーを凍結し、復元する。`plugin-sdk/test-env` からインポートする                                                    |
| `createTestWizardPrompter`                           | モック化されたセットアップウィザード prompter を構築する                                                                                                     |
| `createRuntimeTaskFlow`                              | 分離されたランタイム TaskFlow 状態を作成する                                                                                                  |
| `typedCases`                                         | テーブル駆動テスト用にリテラル型を保持する。`plugin-sdk/test-fixtures` からインポートする                                                    |

バンドル Plugin のコントラクトスイートも、テスト専用の
registry、manifest、public-artifact、runtime fixture ヘルパー向けに SDK テスト用サブパスを使用します。バンドルされた OpenClaw インベントリに依存する core-only
スイートは `src/plugins/contracts` 配下に残します。
新しい拡張テストでは、広範な `plugin-sdk/testing` 互換 barrel、リポジトリの `src/**` ファイル、またはリポジトリの
`test/helpers/*` ブリッジを直接 import するのではなく、
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、
`plugin-sdk/test-env`、または `plugin-sdk/test-fixtures` など、文書化された焦点の絞られた SDK サブパスを使用してください。

### 型

焦点の絞られたテスト用サブパスは、テストファイルで役立つ型も再エクスポートします。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## テストターゲット解決

チャンネルターゲット解決の標準エラーケースを追加するには、
`installCommonResolveTargetErrorCases` を使用します。

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

手書きの `api` モックを `register(api)` に渡す単体テストでは、
OpenClaw のローダー受け入れゲートは実行されません。Plugin が依存する各登録サーフェス、特にフックや memory などの排他的ケイパビリティについて、少なくとも 1 つはローダーを使った smoke test を追加してください。

実際のローダーは、必須メタデータが欠けている場合、または Plugin が所有していないケイパビリティ API を呼び出した場合に Plugin 登録を失敗させます。たとえば、
`api.registerHook(...)` にはフック名が必要で、
`api.registerMemoryCapability(...)` には Plugin manifest またはエクスポートされた entry で
`kind: "memory"` を宣言する必要があります。

### runtime config access のテスト

`openclaw/plugin-sdk/plugin-test-runtime` の共有 Plugin runtime mock を優先してください。
非推奨の `runtime.config.loadConfig()` および `runtime.config.writeConfigFile(...)`
mock は、互換 API の新しい使用をテストで検出できるよう、デフォルトで throw します。これらの mock は、テストが明示的に legacy 互換動作を対象にしている場合にのみ override してください。

### チャンネル Plugin の単体テスト

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

### プロバイダー Plugin の単体テスト

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

### Plugin runtime のモック

`createPluginRuntimeStore` を使用するコードでは、テストで runtime を mock します。

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

### インスタンス単位の stub でテストする

prototype mutation より、インスタンス単位の stub を優先してください。

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## コントラクトテスト（リポジトリ内 Plugin）

バンドルされた Plugin には、登録 ownership を検証するコントラクトテストがあります。

```bash
pnpm test -- src/plugins/contracts/
```

これらのテストは次を検証します。

- どの Plugin がどのプロバイダーを登録するか
- どの Plugin がどの speech provider を登録するか
- 登録 shape の正しさ
- runtime contract compliance

### スコープ付きテストの実行

特定の Plugin の場合:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

コントラクトテストのみの場合:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## lint enforcement（リポジトリ内 Plugin）

リポジトリ内 Plugin には、`pnpm check` によって 3 つのルールが強制されます。

1. **モノリシックな root import 禁止** -- `openclaw/plugin-sdk` root barrel は拒否されます
2. **直接の `src/` import 禁止** -- Plugin は `../../src/` を直接 import できません
3. **self-import 禁止** -- Plugin は自身の `plugin-sdk/<name>` サブパスを import できません

外部 Plugin はこれらの lint ルールの対象ではありませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClaw は V8 coverage thresholds 付きの Vitest を使用します。Plugin テストの場合:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

ローカル実行で memory pressure が発生する場合:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 関連

- [SDK 概要](/ja-JP/plugins/sdk-overview) -- import 規約
- [SDK チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) -- チャンネル Plugin インターフェイス
- [SDK プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) -- プロバイダー Plugin フック
- [Plugin の構築](/ja-JP/plugins/building-plugins) -- はじめにガイド
