---
read_when:
    - Plugin のテストを書いています
    - Plugin SDK のテストユーティリティが必要です
    - バンドルされた Plugin のコントラクトテストを理解したい場合
sidebarTitle: Testing
summary: OpenClaw Plugin向けのテストユーティリティとパターン
title: Plugin テスト
x-i18n:
    generated_at: "2026-04-30T05:28:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw
Plugin 向けのテストユーティリティ、パターン、lint 適用のリファレンス。

<Tip>
  **テスト例を探していますか？** ハウツーガイドには実践的なテスト例が含まれています:
  [Channel Plugin テスト](/ja-JP/plugins/sdk-channel-plugins#step-6-test) と
  [Provider Plugin テスト](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

**Plugin API モックのインポート:** `openclaw/plugin-sdk/plugin-test-api`

**Agent ランタイム契約のインポート:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel 契約のインポート:** `openclaw/plugin-sdk/channel-contract-testing`

**Channel テストヘルパーのインポート:** `openclaw/plugin-sdk/channel-test-helpers`

**Channel target テストのインポート:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin 契約のインポート:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin ランタイムテストのインポート:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider 契約のインポート:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider HTTP モックのインポート:** `openclaw/plugin-sdk/provider-http-test-mocks`

**環境/ネットワークテストのインポート:** `openclaw/plugin-sdk/test-env`

**汎用 fixture のインポート:** `openclaw/plugin-sdk/test-fixtures`

**Node 組み込みモックのインポート:** `openclaw/plugin-sdk/test-node-mocks`

新しい Plugin テストには、以下の絞り込まれたサブパスを優先してください。幅広い
`openclaw/plugin-sdk/testing` barrel はレガシー互換性専用です。
リポジトリのガードレールは、`plugin-sdk/testing` と
`plugin-sdk/test-utils` からの新しい実インポートを拒否します。これらの名前は、外部 Plugin と互換性記録テスト向けの非推奨の互換性サーフェスとしてのみ残っています。

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
| `createTestPluginApi`                                | 直接登録のユニットテスト用に、最小限の Plugin API モックを構築します。`plugin-sdk/plugin-test-api` からインポートします                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ネイティブエージェントランタイムアダプター用の共有 auth-profile コントラクトフィクスチャです。`plugin-sdk/agent-runtime-test-contracts` からインポートします            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ネイティブエージェントランタイムアダプター用の共有配信抑制コントラクトフィクスチャです。`plugin-sdk/agent-runtime-test-contracts` からインポートします    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ネイティブエージェントランタイムアダプター用の共有フォールバック分類コントラクトフィクスチャです。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `createParameterFreeTool`                            | ネイティブランタイムコントラクトテスト用に動的ツールスキーマフィクスチャを構築します。`plugin-sdk/agent-runtime-test-contracts` からインポートします              |
| `expectChannelInboundContextContract`                | チャンネル受信コンテキストの形状を検証します。`plugin-sdk/channel-contract-testing` からインポートします                                                  |
| `installChannelOutboundPayloadContractSuite`         | チャンネル送信ペイロードのコントラクトケースをインストールします。`plugin-sdk/channel-contract-testing` からインポートします                                       |
| `createStartAccountContext`                          | チャンネルアカウントのライフサイクルコンテキストを構築します。`plugin-sdk/channel-test-helpers` からインポートします                                                  |
| `installChannelActionsContractSuite`                 | 汎用チャンネルメッセージアクションのコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                     |
| `installChannelSetupContractSuite`                   | 汎用チャンネルセットアップのコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                              |
| `installChannelStatusContractSuite`                  | 汎用チャンネルステータスのコントラクトケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                             |
| `expectDirectoryIds`                                 | ディレクトリ一覧関数から得られるチャンネルディレクトリ ID を検証します。`plugin-sdk/channel-test-helpers` からインポートします                               |
| `assertBundledChannelEntries`                        | 同梱チャンネルエントリーポイントが想定される公開コントラクトを公開していることを検証します。`plugin-sdk/channel-test-helpers` からインポートします                    |
| `formatEnvelopeTimestamp`                            | 決定論的なエンベロープタイムスタンプをフォーマットします。`plugin-sdk/channel-test-helpers` からインポートします                                                  |
| `expectPairingReplyText`                             | チャンネルのペアリング返信テキストを検証し、そのコードを抽出します。`plugin-sdk/channel-test-helpers` からインポートします                                    |
| `describePluginRegistrationContract`                 | Plugin 登録コントラクトチェックをインストールします。`plugin-sdk/plugin-test-contracts` からインポートします                                              |
| `registerSingleProviderPlugin`                       | ローダーのスモークテストで 1 つのプロバイダー Plugin を登録します。`plugin-sdk/plugin-test-runtime` からインポートします                                         |
| `registerProviderPlugin`                             | 1 つの Plugin からすべてのプロバイダー種別をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                                                 |
| `registerProviderPlugins`                            | 複数の Plugin にまたがるプロバイダー登録をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                                     |
| `requireRegisteredProvider`                          | プロバイダーコレクションに ID が含まれていることを検証します。`plugin-sdk/plugin-test-runtime` からインポートします                                           |
| `createRuntimeEnv`                                   | モックされた CLI/Plugin ランタイム環境を構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                              |
| `createPluginSetupWizardStatus`                      | チャンネル Plugin 用のセットアップステータスヘルパーを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                             |
| `describeOpenAIProviderRuntimeContract`              | プロバイダーファミリーランタイムのコントラクトチェックをインストールします。`plugin-sdk/provider-test-contracts` からインポートします                                        |
| `expectPassthroughReplayPolicy`                      | プロバイダーのリプレイポリシーが、プロバイダー所有のツールとメタデータをそのまま通すことを検証します。`plugin-sdk/provider-test-contracts` からインポートします         |
| `runRealtimeSttLiveTest`                             | 共有音声フィクスチャを使用して、リアルタイム STT プロバイダーのライブテストを実行します。`plugin-sdk/provider-test-contracts` からインポートします                       |
| `normalizeTranscriptForMatch`                        | あいまい一致のアサーション前に、ライブ文字起こし出力を正規化します。`plugin-sdk/provider-test-contracts` からインポートします                               |
| `expectExplicitVideoGenerationCapabilities`          | 動画プロバイダーが明示的な生成モード機能を宣言していることを検証します。`plugin-sdk/provider-test-contracts` からインポートします                   |
| `expectExplicitMusicGenerationCapabilities`          | 音楽プロバイダーが明示的な生成/編集機能を宣言していることを検証します。`plugin-sdk/provider-test-contracts` からインポートします                   |
| `mockSuccessfulDashscopeVideoTask`                   | DashScope 互換の成功動画タスクレスポンスをインストールします。`plugin-sdk/provider-test-contracts` からインポートします                          |
| `getProviderHttpMocks`                               | オプトインのプロバイダー HTTP/auth Vitest モックにアクセスします。`plugin-sdk/provider-http-test-mocks` からインポートします                                         |
| `installProviderHttpMockCleanup`                     | 各テスト後にプロバイダー HTTP/auth モックをリセットします。`plugin-sdk/provider-http-test-mocks` からインポートします                                        |
| `installCommonResolveTargetErrorCases`               | ターゲット解決エラー処理の共有テストケースです。`plugin-sdk/channel-target-testing` からインポートします                                  |
| `shouldAckReaction`                                  | チャンネルが ack リアクションを追加すべきかを確認します。`plugin-sdk/channel-feedback` からインポートします                                            |
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
| `importFreshModule`                                  | モジュールキャッシュを回避するため、新しいクエリトークンで ESM モジュールをインポートします。`plugin-sdk/test-fixtures` からインポートします                             |
| `bundledPluginRoot` / `bundledPluginFile`            | 同梱 Plugin のソースまたは dist フィクスチャパスを解決します。`plugin-sdk/test-fixtures` からインポートします                                              |
| `mockNodeBuiltinModule`                              | 狭い範囲の Node 組み込み Vitest モックをインストールします。`plugin-sdk/test-node-mocks` からインポートします                                                       |
| `createSandboxTestContext`                           | サンドボックステストコンテキストを構築します。`plugin-sdk/test-fixtures` からインポートします                                                                      |
| `writeSkill`                                         | Skill フィクスチャを書き込みます。`plugin-sdk/test-fixtures` からインポートします                                                                             |
| `makeAgentAssistantMessage`                          | エージェント文字起こしメッセージフィクスチャを構築します。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | システムイベントフィクスチャを検査およびリセットします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `sanitizeTerminalText`                               | アサーション用にターミナル出力をサニタイズします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `countLines` / `hasBalancedFences`                   | チャンク化出力の形状を検証します。`plugin-sdk/test-fixtures` からインポートします                                                                     |
| `runProviderCatalog`                                 | テスト依存関係を使用してプロバイダーカタログフックを実行します                                                                                   |
| `resolveProviderWizardOptions`                       | コントラクトテストでプロバイダーセットアップウィザードの選択肢を解決します                                                                                  |
| `resolveProviderModelPickerEntries`                  | コントラクトテストでプロバイダーモデルピッカーのエントリーを解決します                                                                                  |
| `buildProviderPluginMethodChoice`                    | アサーション用にプロバイダーウィザードの選択 ID を構築します                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | 分離テスト用にプロバイダーウィザードのプロバイダーを注入します                                                                                      |
| `createProviderUsageFetch`                           | プロバイダー使用量取得フィクスチャを構築                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 時間依存のテスト用にタイマーを固定し、復元します。`plugin-sdk/test-env` からインポート                                                    |
| `createTestWizardPrompter`                           | モック化されたセットアップウィザードプロンプターを構築                                                                                                     |
| `createRuntimeTaskFlow`                              | 分離されたランタイムタスクフロー状態を作成                                                                                                  |
| `typedCases`                                         | テーブル駆動テスト用にリテラル型を保持します。`plugin-sdk/test-fixtures` からインポート                                                    |

バンドルされた Plugin のコントラクトスイートでも、テスト専用の
レジストリ、マニフェスト、公開アーティファクト、ランタイム fixture ヘルパーに SDK テスト用サブパスを使用します。バンドルされた OpenClaw インベントリに依存する core 専用
スイートは `src/plugins/contracts` 配下に残します。
新しい extension テストでは、広範な `plugin-sdk/testing` 互換バレル、repo の `src/**` ファイル、または repo の
`test/helpers/*` ブリッジを直接 import するのではなく、
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、
`plugin-sdk/test-env`、または `plugin-sdk/test-fixtures` のような、文書化された焦点を絞った SDK サブパスに置いてください。

### 型

焦点を絞ったテスト用サブパスは、テストファイルで役立つ型も再エクスポートします。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## テストターゲット解決

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

### 登録コントラクトのテスト

手書きの `api` mock を `register(api)` に渡すユニットテストでは、
OpenClaw のローダー受け入れゲートは検証されません。Plugin が依存する各登録サーフェスについて、特に hook や
memory のような排他的 capability については、ローダーに基づく smoke test を少なくとも 1 つ追加してください。

実際のローダーは、必須メタデータが欠けている場合や、
Plugin が所有していない capability API を呼び出した場合に Plugin 登録を失敗させます。たとえば、
`api.registerHook(...)` には hook 名が必要であり、
`api.registerMemoryCapability(...)` には Plugin マニフェストまたはエクスポートされた
entry が `kind: "memory"` を宣言している必要があります。

### ランタイム設定アクセスのテスト

バンドルされたチャネル Plugin をテストする場合は、`openclaw/plugin-sdk/channel-test-helpers` の共有 Plugin ランタイム mock を優先してください。
非推奨の `runtime.config.loadConfig()` と
`runtime.config.writeConfigFile(...)` の mock はデフォルトで throw するため、互換 API の新しい使用をテストで検出できます。これらの mock は、テストがレガシー互換動作を明示的に扱っている場合にのみ上書きしてください。

### チャネル Plugin のユニットテスト

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

### プロバイダー Plugin のユニットテスト

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

`createPluginRuntimeStore` を使用するコードでは、テスト内でランタイムを mock します。

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

### インスタンスごとの stub を使ったテスト

prototype mutation よりも、インスタンスごとの stub を優先してください。

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## コントラクトテスト（repo 内 Plugin）

バンドルされた Plugin には、登録の所有権を検証するコントラクトテストがあります。

```bash
pnpm test -- src/plugins/contracts/
```

これらのテストは次を検証します。

- どの Plugin がどのプロバイダーを登録するか
- どの Plugin がどの speech プロバイダーを登録するか
- 登録形状の正確性
- ランタイムコントラクトへの準拠

### スコープ指定テストの実行

特定の Plugin の場合:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

コントラクトテストのみの場合:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## lint 適用（repo 内 Plugin）

repo 内 Plugin には、`pnpm check` によって 3 つのルールが適用されます。

1. **モノリシックな root import 禁止** -- `openclaw/plugin-sdk` root barrel は拒否されます
2. **直接の `src/` import 禁止** -- Plugin は `../../src/` を直接 import できません
3. **self-import 禁止** -- Plugin は自身の `plugin-sdk/<name>` サブパスを import できません

外部 Plugin はこれらの lint ルールの対象ではありませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClaw は V8 coverage threshold 付きの Vitest を使用します。Plugin テストでは次を使います。

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

ローカル実行でメモリ負荷が発生する場合:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 関連

- [SDK 概要](/ja-JP/plugins/sdk-overview) -- import 規約
- [SDK チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) -- チャネル Plugin インターフェイス
- [SDK プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) -- プロバイダー Plugin hook
- [Plugin の構築](/ja-JP/plugins/building-plugins) -- はじめにガイド
