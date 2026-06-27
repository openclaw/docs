---
read_when:
    - Plugin のテストを書いています
    - Plugin SDK のテストユーティリティが必要です
    - バンドルされたPluginのコントラクトテストを理解したい
sidebarTitle: Testing
summary: OpenClaw Plugin のテストユーティリティとパターン
title: Plugin テスト
x-i18n:
    generated_at: "2026-06-27T12:36:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw
Plugin のテストユーティリティ、パターン、lint 強制のリファレンス。

<Tip>
  **テスト例を探していますか?** ハウツーガイドには実際に動くテスト例が含まれています:
  [Channel Plugin のテスト](/ja-JP/plugins/sdk-channel-plugins#step-6-test) と
  [Provider Plugin のテスト](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

これらのテストヘルパーのサブパスは、OpenClaw 自身の
バンドル済み Plugin テスト向けのリポジトリローカルなソースエントリポイントです。これらはサードパーティ Plugin 向けのパッケージエクスポートではなく、
Vitest やその他のリポジトリ専用テスト依存関係をインポートする場合があります。

**Plugin API モックのインポート:** `openclaw/plugin-sdk/plugin-test-api`

**エージェントランタイム契約のインポート:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel 契約のインポート:** `openclaw/plugin-sdk/channel-contract-testing`

**Channel テストヘルパーのインポート:** `openclaw/plugin-sdk/channel-test-helpers`

**Channel ターゲットテストのインポート:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin 契約のインポート:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin ランタイムテストのインポート:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider 契約のインポート:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider HTTP モックのインポート:** `openclaw/plugin-sdk/provider-http-test-mocks`

**環境/ネットワークテストのインポート:** `openclaw/plugin-sdk/test-env`

**汎用フィクスチャのインポート:** `openclaw/plugin-sdk/test-fixtures`

**Node ビルトインモックのインポート:** `openclaw/plugin-sdk/test-node-mocks`

OpenClaw リポジトリ内では、新しいバンドル済み
Plugin テストには、以下の焦点を絞ったサブパスを優先してください。広範な
`openclaw/plugin-sdk/testing` バレルはレガシー互換性専用です。
リポジトリのガードレールは、`plugin-sdk/testing` と
`plugin-sdk/test-utils` からの新しい実インポートを拒否します。これらの名前は、互換性記録テスト向けの非推奨の互換性サーフェスとしてのみ残されています。

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

| エクスポート                                         | 目的                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                                | 直接登録のユニットテスト用に最小限の Plugin API モックを構築する。`plugin-sdk/plugin-test-api` からインポート                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ネイティブエージェントランタイムアダプター向けの共有認証プロファイル契約フィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポート |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ネイティブエージェントランタイムアダプター向けの共有配信抑制契約フィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポート     |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ネイティブエージェントランタイムアダプター向けの共有フォールバック分類契約フィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポート |
| `createParameterFreeTool`                            | ネイティブランタイム契約テスト用に動的ツールスキーマフィクスチャを構築する。`plugin-sdk/agent-runtime-test-contracts` からインポート       |
| `expectChannelInboundContextContract`                | チャンネルのインバウンドコンテキスト形状をアサートする。`plugin-sdk/channel-contract-testing` からインポート                               |
| `installChannelOutboundPayloadContractSuite`         | チャンネルのアウトバウンドペイロード契約ケースをインストールする。`plugin-sdk/channel-contract-testing` からインポート                     |
| `createStartAccountContext`                          | チャンネルアカウントのライフサイクルコンテキストを構築する。`plugin-sdk/channel-test-helpers` からインポート                               |
| `installChannelActionsContractSuite`                 | 汎用チャンネルメッセージアクション契約ケースをインストールする。`plugin-sdk/channel-test-helpers` からインポート                           |
| `installChannelSetupContractSuite`                   | 汎用チャンネルセットアップ契約ケースをインストールする。`plugin-sdk/channel-test-helpers` からインポート                                   |
| `installChannelStatusContractSuite`                  | 汎用チャンネルステータス契約ケースをインストールする。`plugin-sdk/channel-test-helpers` からインポート                                     |
| `expectDirectoryIds`                                 | ディレクトリ一覧関数から得たチャンネルディレクトリ ID をアサートする。`plugin-sdk/channel-test-helpers` からインポート                     |
| `assertBundledChannelEntries`                        | バンドル済みチャンネルエントリポイントが期待される公開契約を公開していることをアサートする。`plugin-sdk/channel-test-helpers` からインポート |
| `formatEnvelopeTimestamp`                            | 決定論的なエンベロープタイムスタンプをフォーマットする。`plugin-sdk/channel-test-helpers` からインポート                                  |
| `expectPairingReplyText`                             | チャンネルペアリング返信テキストをアサートし、そのコードを抽出する。`plugin-sdk/channel-test-helpers` からインポート                      |
| `describePluginRegistrationContract`                 | Plugin 登録契約チェックをインストールする。`plugin-sdk/plugin-test-contracts` からインポート                                               |
| `registerSingleProviderPlugin`                       | ローダースモークテストで 1 つのプロバイダー Plugin を登録する。`plugin-sdk/plugin-test-runtime` からインポート                             |
| `registerProviderPlugin`                             | 1 つの Plugin からすべてのプロバイダー種別をキャプチャする。`plugin-sdk/plugin-test-runtime` からインポート                                |
| `registerProviderPlugins`                            | 複数の Plugin にまたがるプロバイダー登録をキャプチャする。`plugin-sdk/plugin-test-runtime` からインポート                                  |
| `requireRegisteredProvider`                          | プロバイダーコレクションに ID が含まれることをアサートする。`plugin-sdk/plugin-test-runtime` からインポート                                |
| `createRuntimeEnv`                                   | モック化された CLI/Plugin ランタイム環境を構築する。`plugin-sdk/plugin-test-runtime` からインポート                                        |
| `createPluginSetupWizardStatus`                      | チャンネル Plugin 用のセットアップステータスヘルパーを構築する。`plugin-sdk/plugin-test-runtime` からインポート                            |
| `describeOpenAIProviderRuntimeContract`              | プロバイダーファミリーのランタイム契約チェックをインストールする。`plugin-sdk/provider-test-contracts` からインポート                      |
| `expectPassthroughReplayPolicy`                      | プロバイダーのリプレイポリシーがプロバイダー所有のツールとメタデータをそのまま通すことをアサートする。`plugin-sdk/provider-test-contracts` からインポート |
| `runRealtimeSttLiveTest`                             | 共有音声フィクスチャを使ってライブのリアルタイム STT プロバイダーテストを実行する。`plugin-sdk/provider-test-contracts` からインポート     |
| `normalizeTranscriptForMatch`                        | ファジーアサーションの前にライブトランスクリプト出力を正規化する。`plugin-sdk/provider-test-contracts` からインポート                     |
| `expectExplicitVideoGenerationCapabilities`          | 動画プロバイダーが明示的な生成モード機能を宣言していることをアサートする。`plugin-sdk/provider-test-contracts` からインポート              |
| `expectExplicitMusicGenerationCapabilities`          | 音楽プロバイダーが明示的な生成/編集機能を宣言していることをアサートする。`plugin-sdk/provider-test-contracts` からインポート               |
| `mockSuccessfulDashscopeVideoTask`                   | 成功した DashScope 互換動画タスクレスポンスをインストールする。`plugin-sdk/provider-test-contracts` からインポート                         |
| `getProviderHttpMocks`                               | オプトインのプロバイダー HTTP/認証 Vitest モックにアクセスする。`plugin-sdk/provider-http-test-mocks` からインポート                       |
| `installProviderHttpMockCleanup`                     | 各テスト後にプロバイダー HTTP/認証モックをリセットする。`plugin-sdk/provider-http-test-mocks` からインポート                              |
| `installCommonResolveTargetErrorCases`               | ターゲット解決エラー処理向けの共有テストケース。`plugin-sdk/channel-target-testing` からインポート                                        |
| `shouldAckReaction`                                  | チャンネルが ack リアクションを追加すべきかどうかを確認する。`plugin-sdk/channel-feedback` からインポート                                 |
| `removeAckReactionAfterReply`                        | 返信配信後に ack リアクションを削除する。`plugin-sdk/channel-feedback` からインポート                                                     |
| `createTestRegistry`                                 | チャンネル Plugin レジストリフィクスチャを構築する。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポート |
| `createEmptyPluginRegistry`                          | 空の Plugin レジストリフィクスチャを構築する。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポート     |
| `setActivePluginRegistry`                            | Plugin ランタイムテスト用にレジストリフィクスチャをインストールする。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポート |
| `createRequestCaptureJsonFetch`                      | メディアヘルパーテストで JSON fetch リクエストをキャプチャする。`plugin-sdk/test-env` からインポート                                      |
| `withServer`                                         | 使い捨てのローカル HTTP サーバーに対してテストを実行する。`plugin-sdk/test-env` からインポート                                            |
| `createMockIncomingRequest`                          | 最小限の受信 HTTP リクエストオブジェクトを構築する。`plugin-sdk/test-env` からインポート                                                  |
| `withFetchPreconnect`                                | preconnect フックをインストールした状態で fetch テストを実行する。`plugin-sdk/test-env` からインポート                                    |
| `withEnv` / `withEnvAsync`                           | 環境変数を一時的にパッチする。`plugin-sdk/test-env` からインポート                                                                         |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 分離されたファイルシステムテストフィクスチャを作成する。`plugin-sdk/test-env` からインポート                                              |
| `createMockServerResponse`                           | 最小限の HTTP サーバーレスポンスモックを作成する。`plugin-sdk/test-env` からインポート                                                    |
| `createCliRuntimeCapture`                            | テストで CLI ランタイム出力をキャプチャする。`plugin-sdk/test-fixtures` からインポート                                                    |
| `importFreshModule`                                  | モジュールキャッシュをバイパスするため、新しいクエリトークン付きで ESM モジュールをインポートする。`plugin-sdk/test-fixtures` からインポート |
| `bundledPluginRoot` / `bundledPluginFile`            | バンドル済み Plugin のソースまたは dist フィクスチャパスを解決する。`plugin-sdk/test-fixtures` からインポート                              |
| `mockNodeBuiltinModule`                              | 範囲を絞った Node 組み込み Vitest モックをインストールする。`plugin-sdk/test-node-mocks` からインポート                                   |
| `createSandboxTestContext`                           | サンドボックステストコンテキストを構築する。`plugin-sdk/test-fixtures` からインポート                                                      |
| `writeSkill`                                         | Skills フィクスチャを書き込む。`plugin-sdk/test-fixtures` からインポート                                                                   |
| `makeAgentAssistantMessage`                          | エージェントトランスクリプトメッセージフィクスチャを構築する。`plugin-sdk/test-fixtures` からインポート                                    |
| `peekSystemEvents` / `resetSystemEventsForTest`      | システムイベントフィクスチャを検査およびリセットする。`plugin-sdk/test-fixtures` からインポート                                           |
| `sanitizeTerminalText`                               | アサーション用にターミナル出力をサニタイズする。`plugin-sdk/test-fixtures` からインポート                                                  |
| `countLines` / `hasBalancedFences`                   | チャンク化出力の形状をアサートする。`plugin-sdk/test-fixtures` からインポート                                                             |
| `runProviderCatalog`                                 | テスト依存関係を使ってプロバイダーカタログフックを実行する                                                                                 |
| `resolveProviderWizardOptions`                       | 契約テストでプロバイダーセットアップウィザードの選択肢を解決する                                                                           |
| `resolveProviderModelPickerEntries`                  | 契約テストでプロバイダーモデルピッカーのエントリを解決する                                                                                 |
| `buildProviderPluginMethodChoice`                    | アサーション用にプロバイダーウィザード選択 ID を構築する                                                                                   |
| `setProviderWizardProvidersResolverForTest`          | 分離テスト用にプロバイダーウィザードのプロバイダーを注入する                                                                               |
| `createProviderUsageFetch`                           | プロバイダー使用量取得のフィクスチャを構築する                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 時間依存のテスト用にタイマーを固定し、復元する。`plugin-sdk/test-env` からインポートする                                                    |
| `createTestWizardPrompter`                           | モックされたセットアップウィザードのプロンプターを構築する                                                                                                     |
| `createRuntimeTaskFlow`                              | 分離されたランタイム TaskFlow 状態を作成する                                                                                                  |
| `typedCases`                                         | テーブル駆動テスト用にリテラル型を保持する。`plugin-sdk/test-fixtures` からインポートする                                                    |

バンドル済みプラグインの契約スイートも、テスト専用の
registry、manifest、public-artifact、runtime fixture ヘルパー向けに SDK テスト用サブパスを使用します。バンドル済み OpenClaw インベントリに依存する core-only
スイートは `src/plugins/contracts` 配下に置きます。
新しい拡張テストは、広範な `plugin-sdk/testing` 互換 barrel、リポジトリの `src/**` ファイル、リポジトリの
`test/helpers/*` ブリッジを直接インポートするのではなく、
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、
`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` など、文書化された焦点の絞られた SDK サブパスに置いてください。

### 型

焦点の絞られたテスト用サブパスは、テストファイルで有用な型も再エクスポートします。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## テスト対象解決

チャネルターゲット解決の標準エラーケースを追加するには、
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

### 登録契約のテスト

手書きの `api` モックを `register(api)` に渡すユニットテストは、
OpenClaw のローダー受け入れゲートを実行しません。プラグインが依存する各登録サーフェスについて、特に hooks や memory などの排他的 capability については、少なくとも 1 つローダーに基づく smoke test を追加してください。

実際のローダーは、必須メタデータが欠けている場合や、プラグインが所有していない capability API を呼び出した場合にプラグイン登録を失敗させます。たとえば、
`api.registerHook(...)` には hook 名が必要で、
`api.registerMemoryCapability(...)` にはプラグイン manifest またはエクスポートされた entry が `kind: "memory"` を宣言している必要があります。

### ランタイム設定アクセスのテスト

バンドル済みチャネルプラグインをテストする場合は、`openclaw/plugin-sdk/channel-test-helpers`
の共有プラグインランタイムモックを優先してください。その非推奨の `runtime.config.loadConfig()` と
`runtime.config.writeConfigFile(...)` モックはデフォルトで throw するため、テストで互換 API の新規使用を検出できます。これらのモックを上書きするのは、テストが明示的にレガシー互換動作を対象にしている場合だけにしてください。

### チャネルプラグインのユニットテスト

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

### プロバイダープラグインのユニットテスト

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

### プラグインランタイムのモック

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

prototype mutation よりも、インスタンスごとのスタブを優先してください。

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契約テスト（リポジトリ内プラグイン）

バンドル済みプラグインには、登録所有権を検証する契約テストがあります。

```bash
pnpm test -- src/plugins/contracts/
```

これらのテストでは次を検証します。

- どのプラグインがどのプロバイダーを登録するか
- どのプラグインがどの音声プロバイダーを登録するか
- 登録形状の正しさ
- ランタイム契約への準拠

### スコープ付きテストの実行

特定のプラグインの場合:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

契約テストのみの場合:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint enforcement（リポジトリ内プラグイン）

リポジトリ内プラグインに対して、`pnpm check` により 3 つのルールが強制されます。

1. **モノリシックなルートインポート禁止** -- `openclaw/plugin-sdk` ルート barrel は拒否されます
2. **直接の `src/` インポート禁止** -- プラグインは `../../src/` を直接インポートできません
3. **自己インポート禁止** -- プラグインは自身の `plugin-sdk/<name>` サブパスをインポートできません

外部プラグインはこれらの lint ルールの対象ではありませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClaw は V8 coverage thresholds とともに Vitest を使用します。プラグインテストの場合:

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

ローカル実行でメモリ圧迫が発生する場合:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 関連

- [SDK 概要](/ja-JP/plugins/sdk-overview) -- インポート規約
- [SDK チャネルプラグイン](/ja-JP/plugins/sdk-channel-plugins) -- チャネルプラグインインターフェース
- [SDK プロバイダープラグイン](/ja-JP/plugins/sdk-provider-plugins) -- プロバイダープラグイン hooks
- [プラグインの構築](/ja-JP/plugins/building-plugins) -- はじめにガイド
