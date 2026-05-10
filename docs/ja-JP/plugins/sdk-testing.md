---
read_when:
    - Pluginのテストを書いている場合
    - Plugin SDK のテストユーティリティが必要です
    - バンドルされたプラグインの契約テストを理解したい
sidebarTitle: Testing
summary: OpenClaw Plugin 向けのテストユーティリティとパターン
title: Plugin テスト
x-i18n:
    generated_at: "2026-05-10T19:48:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw
Plugin のテストユーティリティ、パターン、lint 適用に関するリファレンス。

<Tip>
  **テスト例を探していますか？** How-to ガイドには実践的なテスト例が含まれています:
  [Channel Plugin テスト](/ja-JP/plugins/sdk-channel-plugins#step-6-test) と
  [Provider Plugin テスト](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

これらのテストヘルパーのサブパスは、OpenClaw 自身の
バンドル済み Plugin テスト用のリポジトリローカルなソースエントリポイントです。サードパーティ Plugin 向けのパッケージエクスポートではありません。

**Plugin API モックの import:** `openclaw/plugin-sdk/plugin-test-api`

**エージェントランタイム契約の import:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel 契約の import:** `openclaw/plugin-sdk/channel-contract-testing`

**Channel テストヘルパーの import:** `openclaw/plugin-sdk/channel-test-helpers`

**Channel ターゲットテストの import:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin 契約の import:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin ランタイムテストの import:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider 契約の import:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider HTTP モックの import:** `openclaw/plugin-sdk/provider-http-test-mocks`

**環境/ネットワークテストの import:** `openclaw/plugin-sdk/test-env`

**汎用フィクスチャの import:** `openclaw/plugin-sdk/test-fixtures`

**Node 組み込みモックの import:** `openclaw/plugin-sdk/test-node-mocks`

新しい Plugin テストには、以下の絞り込まれたサブパスを優先してください。広範な
`openclaw/plugin-sdk/testing` バレルはレガシー互換性専用です。
リポジトリのガードレールは、`plugin-sdk/testing` と
`plugin-sdk/test-utils` からの新しい実 import を拒否します。これらの名前は、互換性記録テスト用の非推奨互換性サーフェスとしてのみ残っています。

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

| エクスポート                                               | 目的                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 直接登録の単体テスト用に最小限の Plugin API モックを構築します。`plugin-sdk/plugin-test-api` からインポートします                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ネイティブエージェントランタイムアダプター用の共有認証プロファイルコントラクトフィクスチャです。`plugin-sdk/agent-runtime-test-contracts` からインポートします            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ネイティブエージェントランタイムアダプター用の共有配信抑制コントラクトフィクスチャです。`plugin-sdk/agent-runtime-test-contracts` からインポートします    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ネイティブエージェントランタイムアダプター用の共有フォールバック分類コントラクトフィクスチャです。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `createParameterFreeTool`                            | ネイティブランタイムコントラクトテスト用の動的ツールスキーマフィクスチャを構築します。`plugin-sdk/agent-runtime-test-contracts` からインポートします              |
| `expectChannelInboundContextContract`                | チャンネルのインバウンドコンテキスト形状をアサートします。`plugin-sdk/channel-contract-testing` からインポートします                                                  |
| `installChannelOutboundPayloadContractSuite`         | チャンネルのアウトバウンドペイロードコントラクトケースをインストールします。`plugin-sdk/channel-contract-testing` からインポートします                                       |
| `createStartAccountContext`                          | チャンネルアカウントのライフサイクルコンテキストを構築します。`plugin-sdk/channel-test-helpers` からインポートします                                                  |
| `installChannelActionsContractSuite`                 | 汎用チャンネルメッセージアクションコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                     |
| `installChannelSetupContractSuite`                   | 汎用チャンネルセットアップコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                              |
| `installChannelStatusContractSuite`                  | 汎用チャンネルステータスコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                             |
| `expectDirectoryIds`                                 | ディレクトリ一覧関数からのチャンネルディレクトリ ID をアサートします。`plugin-sdk/channel-test-helpers` からインポートします                               |
| `assertBundledChannelEntries`                        | バンドル済みチャンネルエントリーポイントが期待される公開コントラクトを公開していることをアサートします。`plugin-sdk/channel-test-helpers` からインポートします                    |
| `formatEnvelopeTimestamp`                            | 決定論的なエンベロープタイムスタンプをフォーマットします。`plugin-sdk/channel-test-helpers` からインポートします                                                  |
| `expectPairingReplyText`                             | チャンネルペアリングの返信テキストをアサートし、そのコードを抽出します。`plugin-sdk/channel-test-helpers` からインポートします                                    |
| `describePluginRegistrationContract`                 | Plugin 登録コントラクトチェックをインストールします。`plugin-sdk/plugin-test-contracts` からインポートします                                              |
| `registerSingleProviderPlugin`                       | ローダースモークテストで 1 つのプロバイダー Plugin を登録します。`plugin-sdk/plugin-test-runtime` からインポートします                                         |
| `registerProviderPlugin`                             | 1 つの Plugin からすべてのプロバイダー種別をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                                                 |
| `registerProviderPlugins`                            | 複数の Plugin にまたがるプロバイダー登録をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                                     |
| `requireRegisteredProvider`                          | プロバイダーコレクションに ID が含まれることをアサートします。`plugin-sdk/plugin-test-runtime` からインポートします                                           |
| `createRuntimeEnv`                                   | モックされた CLI/Plugin ランタイム環境を構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                              |
| `createPluginSetupWizardStatus`                      | チャンネル Plugin 用のセットアップステータスヘルパーを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                             |
| `describeOpenAIProviderRuntimeContract`              | プロバイダーファミリーのランタイムコントラクトチェックをインストールします。`plugin-sdk/provider-test-contracts` からインポートします                                        |
| `expectPassthroughReplayPolicy`                      | プロバイダーのリプレイポリシーがプロバイダー所有のツールとメタデータをそのまま通すことをアサートします。`plugin-sdk/provider-test-contracts` からインポートします         |
| `runRealtimeSttLiveTest`                             | 共有音声フィクスチャを使ってライブリアルタイム STT プロバイダーテストを実行します。`plugin-sdk/provider-test-contracts` からインポートします                       |
| `normalizeTranscriptForMatch`                        | ファジーアサーションの前にライブトランスクリプト出力を正規化します。`plugin-sdk/provider-test-contracts` からインポートします                               |
| `expectExplicitVideoGenerationCapabilities`          | 動画プロバイダーが明示的な生成モード機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts` からインポートします                   |
| `expectExplicitMusicGenerationCapabilities`          | 音楽プロバイダーが明示的な生成/編集機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts` からインポートします                   |
| `mockSuccessfulDashscopeVideoTask`                   | 成功した DashScope 互換の動画タスクレスポンスをインストールします。`plugin-sdk/provider-test-contracts` からインポートします                          |
| `getProviderHttpMocks`                               | オプトインのプロバイダー HTTP/認証 Vitest モックにアクセスします。`plugin-sdk/provider-http-test-mocks` からインポートします                                         |
| `installProviderHttpMockCleanup`                     | 各テスト後にプロバイダー HTTP/認証モックをリセットします。`plugin-sdk/provider-http-test-mocks` からインポートします                                        |
| `installCommonResolveTargetErrorCases`               | ターゲット解決エラー処理用の共有テストケースです。`plugin-sdk/channel-target-testing` からインポートします                                  |
| `shouldAckReaction`                                  | チャンネルが ack リアクションを追加すべきかどうかを確認します。`plugin-sdk/channel-feedback` からインポートします                                            |
| `removeAckReactionAfterReply`                        | 返信配信後に ack リアクションを削除します。`plugin-sdk/channel-feedback` からインポートします                                                      |
| `createTestRegistry`                                 | チャンネル Plugin レジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします               |
| `createEmptyPluginRegistry`                          | 空の Plugin レジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします                |
| `setActivePluginRegistry`                            | Plugin ランタイムテスト用のレジストリフィクスチャをインストールします。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします   |
| `createRequestCaptureJsonFetch`                      | メディアヘルパーテストで JSON fetch リクエストをキャプチャします。`plugin-sdk/test-env` からインポートします                                                     |
| `withServer`                                         | 破棄可能なローカル HTTP サーバーに対してテストを実行します。`plugin-sdk/test-env` からインポートします                                                      |
| `createMockIncomingRequest`                          | 最小限の受信 HTTP リクエストオブジェクトを構築します。`plugin-sdk/test-env` からインポートします                                                          |
| `withFetchPreconnect`                                | preconnect フックをインストールした状態で fetch テストを実行します。`plugin-sdk/test-env` からインポートします                                                       |
| `withEnv` / `withEnvAsync`                           | 環境変数を一時的にパッチします。`plugin-sdk/test-env` からインポートします                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 分離されたファイルシステムテストフィクスチャを作成します。`plugin-sdk/test-env` からインポートします                                                              |
| `createMockServerResponse`                           | 最小限の HTTP サーバーレスポンスモックを作成します。`plugin-sdk/test-env` からインポートします                                                            |
| `createCliRuntimeCapture`                            | テストで CLI ランタイム出力をキャプチャします。`plugin-sdk/test-fixtures` からインポートします                                                              |
| `importFreshModule`                                  | モジュールキャッシュをバイパスするために、新しいクエリトークン付きで ESM モジュールをインポートします。`plugin-sdk/test-fixtures` からインポートします                             |
| `bundledPluginRoot` / `bundledPluginFile`            | バンドル済み Plugin のソースまたは dist フィクスチャパスを解決します。`plugin-sdk/test-fixtures` からインポートします                                              |
| `mockNodeBuiltinModule`                              | 範囲を絞った Node 組み込み Vitest モックをインストールします。`plugin-sdk/test-node-mocks` からインポートします                                                       |
| `createSandboxTestContext`                           | サンドボックステストコンテキストを構築します。`plugin-sdk/test-fixtures` からインポートします                                                                      |
| `writeSkill`                                         | Skills フィクスチャを書き込みます。`plugin-sdk/test-fixtures` からインポートします                                                                             |
| `makeAgentAssistantMessage`                          | エージェントトランスクリプトメッセージフィクスチャを構築します。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | システムイベントフィクスチャを検査してリセットします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `sanitizeTerminalText`                               | アサーション用にターミナル出力をサニタイズします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `countLines` / `hasBalancedFences`                   | チャンク化出力の形状をアサートします。`plugin-sdk/test-fixtures` からインポートします                                                                     |
| `runProviderCatalog`                                 | テスト依存関係を使ってプロバイダーカタログフックを実行します                                                                                   |
| `resolveProviderWizardOptions`                       | コントラクトテストでプロバイダーセットアップウィザードの選択肢を解決します                                                                                  |
| `resolveProviderModelPickerEntries`                  | コントラクトテストでプロバイダーモデルピッカーエントリーを解決します                                                                                  |
| `buildProviderPluginMethodChoice`                    | アサーション用にプロバイダーウィザード選択 ID を構築します                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | 分離テスト用にプロバイダーウィザードのプロバイダーを注入します                                                                                      |
| `createProviderUsageFetch`                           | プロバイダー使用量取得のフィクスチャを構築する                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 時間依存のテスト用にタイマーを固定し、復元する。`plugin-sdk/test-env` からインポートする                                                    |
| `createTestWizardPrompter`                           | モック化されたセットアップウィザードプロンプターを構築する                                                                                                     |
| `createRuntimeTaskFlow`                              | 分離されたランタイムタスクフロー状態を作成する                                                                                                  |
| `typedCases`                                         | テーブル駆動テスト用にリテラル型を保持する。`plugin-sdk/test-fixtures` からインポートする                                                    |

バンドル Plugin のコントラクトスイートも、テスト専用の registry、manifest、public-artifact、runtime fixture ヘルパー用に SDK testing サブパスを使用します。バンドルされた OpenClaw inventory に依存する core-only スイートは `src/plugins/contracts` 配下に置きます。新しい extension テストは、広範な `plugin-sdk/testing` 互換 barrel、リポジトリの `src/**` ファイル、またはリポジトリの `test/helpers/*` ブリッジを直接 import するのではなく、`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` など、文書化された焦点の絞られた SDK サブパスに置いてください。

### 型

焦点の絞られた testing サブパスは、テストファイルで有用な型も再エクスポートします。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## testing target 解決

channel target 解決の標準エラーケースを追加するには、`installCommonResolveTargetErrorCases` を使用します。

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

## testing パターン

### registration contract のテスト

手書きの `api` モックを `register(api)` に渡す単体テストでは、OpenClaw の loader acceptance gate は実行されません。Plugin が依存する各 registration surface について、特に hooks と memory などの exclusive capabilities について、少なくとも 1 つは loader-backed smoke test を追加してください。

実際の loader は、必須 metadata が欠落している場合、または Plugin が所有していない capability API を呼び出した場合に、Plugin registration を失敗させます。たとえば、`api.registerHook(...)` には hook name が必要であり、`api.registerMemoryCapability(...)` には Plugin manifest またはエクスポートされた entry が `kind: "memory"` を宣言している必要があります。

### runtime config access のテスト

バンドルされた channel Plugin をテストするときは、`openclaw/plugin-sdk/channel-test-helpers` の共有 Plugin runtime mock を優先してください。非推奨の `runtime.config.loadConfig()` と `runtime.config.writeConfigFile(...)` のモックはデフォルトで throw するため、互換 API の新規使用をテストで検出できます。これらのモックを override するのは、そのテストが legacy compatibility behavior を明示的に扱う場合のみにしてください。

### channel Plugin の単体テスト

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

### provider Plugin の単体テスト

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

`createPluginRuntimeStore` を使用するコードでは、テスト内で runtime をモックします。

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

### per-instance stub でのテスト

prototype mutation よりも per-instance stub を優先してください。

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## コントラクトテスト（リポジトリ内 Plugin）

バンドル Plugin には、registration ownership を検証するコントラクトテストがあります。

```bash
pnpm test -- src/plugins/contracts/
```

これらのテストでは次を検証します。

- どの Plugin がどの provider を登録するか
- どの Plugin がどの speech provider を登録するか
- registration shape の正しさ
- runtime contract compliance

### スコープ指定テストの実行

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

1. **monolithic root import なし** -- `openclaw/plugin-sdk` root barrel は拒否されます
2. **直接の `src/` import なし** -- Plugin は `../../src/` を直接 import できません
3. **self-import なし** -- Plugin は自分自身の `plugin-sdk/<name>` サブパスを import できません

外部 Plugin はこれらの lint ルールの対象ではありませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClaw は V8 coverage threshold を持つ Vitest を使用します。Plugin テストの場合:

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
- [SDK Channel Plugin](/ja-JP/plugins/sdk-channel-plugins) -- channel Plugin interface
- [SDK Provider Plugin](/ja-JP/plugins/sdk-provider-plugins) -- provider Plugin hooks
- [Plugin の構築](/ja-JP/plugins/building-plugins) -- はじめにガイド
