---
read_when:
    - Plugin のテストを書いています
    - Plugin SDK のテストユーティリティが必要です
    - バンドルされたPluginのコントラクトテストを理解したい
sidebarTitle: Testing
summary: OpenClaw Plugin 向けのテストユーティリティとパターン
title: Plugin テスト
x-i18n:
    generated_at: "2026-05-02T22:21:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin のテストユーティリティ、パターン、lint 適用に関するリファレンス。

<Tip>
  **テスト例を探していますか？** ハウツーガイドには、実際に動くテスト例が含まれています:
  [チャネル Plugin テスト](/ja-JP/plugins/sdk-channel-plugins#step-6-test) と
  [プロバイダー Plugin テスト](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

**Plugin API モックのインポート:** `openclaw/plugin-sdk/plugin-test-api`

**エージェントランタイムコントラクトのインポート:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**チャネルコントラクトのインポート:** `openclaw/plugin-sdk/channel-contract-testing`

**チャネルテストヘルパーのインポート:** `openclaw/plugin-sdk/channel-test-helpers`

**チャネルターゲットテストのインポート:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin コントラクトのインポート:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin ランタイムテストのインポート:** `openclaw/plugin-sdk/plugin-test-runtime`

**プロバイダーコントラクトのインポート:** `openclaw/plugin-sdk/provider-test-contracts`

**プロバイダー HTTP モックのインポート:** `openclaw/plugin-sdk/provider-http-test-mocks`

**環境/ネットワークテストのインポート:** `openclaw/plugin-sdk/test-env`

**汎用フィクスチャのインポート:** `openclaw/plugin-sdk/test-fixtures`

**Node 組み込みモックのインポート:** `openclaw/plugin-sdk/test-node-mocks`

新しい Plugin テストでは、以下の焦点を絞ったサブパスを推奨します。広範な
`openclaw/plugin-sdk/testing` バレルは、レガシー互換性専用です。
リポジトリのガードレールは、`plugin-sdk/testing` と
`plugin-sdk/test-utils` からの新しい実インポートを拒否します。これらの名前は、外部 Plugin と互換性記録テスト向けの非推奨互換性サーフェスとしてのみ残ります。

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
| `createTestPluginApi`                                | 直接登録のユニットテスト用に最小限の Plugin API モックを構築します。`plugin-sdk/plugin-test-api` からインポートします                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ネイティブエージェントランタイムアダプター用の共有認証プロファイル契約フィクスチャです。`plugin-sdk/agent-runtime-test-contracts` からインポートします            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ネイティブエージェントランタイムアダプター用の共有配信抑制契約フィクスチャです。`plugin-sdk/agent-runtime-test-contracts` からインポートします    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ネイティブエージェントランタイムアダプター用の共有フォールバック分類契約フィクスチャです。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `createParameterFreeTool`                            | ネイティブランタイム契約テスト用の動的ツールスキーマフィクスチャを構築します。`plugin-sdk/agent-runtime-test-contracts` からインポートします              |
| `expectChannelInboundContextContract`                | チャネル受信コンテキストの形状をアサートします。`plugin-sdk/channel-contract-testing` からインポートします                                                  |
| `installChannelOutboundPayloadContractSuite`         | チャネル送信ペイロード契約ケースをインストールします。`plugin-sdk/channel-contract-testing` からインポートします                                       |
| `createStartAccountContext`                          | チャネルアカウントライフサイクルコンテキストを構築します。`plugin-sdk/channel-test-helpers` からインポートします                                                  |
| `installChannelActionsContractSuite`                 | 汎用チャネルメッセージアクション契約ケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                     |
| `installChannelSetupContractSuite`                   | 汎用チャネルセットアップ契約ケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                              |
| `installChannelStatusContractSuite`                  | 汎用チャネルステータス契約ケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                             |
| `expectDirectoryIds`                                 | ディレクトリ一覧関数から得られるチャネルディレクトリ ID をアサートします。`plugin-sdk/channel-test-helpers` からインポートします                               |
| `assertBundledChannelEntries`                        | バンドル済みチャネルエントリポイントが期待される公開契約を公開していることをアサートします。`plugin-sdk/channel-test-helpers` からインポートします                    |
| `formatEnvelopeTimestamp`                            | 決定的なエンベロープタイムスタンプをフォーマットします。`plugin-sdk/channel-test-helpers` からインポートします                                                  |
| `expectPairingReplyText`                             | チャネルペアリング返信テキストをアサートし、そのコードを抽出します。`plugin-sdk/channel-test-helpers` からインポートします                                    |
| `describePluginRegistrationContract`                 | Plugin 登録契約チェックをインストールします。`plugin-sdk/plugin-test-contracts` からインポートします                                              |
| `registerSingleProviderPlugin`                       | ローダースモークテストで 1 つのプロバイダー Plugin を登録します。`plugin-sdk/plugin-test-runtime` からインポートします                                         |
| `registerProviderPlugin`                             | 1 つの Plugin からすべてのプロバイダー種別をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                                                 |
| `registerProviderPlugins`                            | 複数の Plugin にまたがるプロバイダー登録をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                                     |
| `requireRegisteredProvider`                          | プロバイダーコレクションに ID が含まれることをアサートします。`plugin-sdk/plugin-test-runtime` からインポートします                                           |
| `createRuntimeEnv`                                   | モック化された CLI/Plugin ランタイム環境を構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                              |
| `createPluginSetupWizardStatus`                      | チャネル Plugin 用のセットアップステータスヘルパーを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                             |
| `describeOpenAIProviderRuntimeContract`              | プロバイダーファミリーのランタイム契約チェックをインストールします。`plugin-sdk/provider-test-contracts` からインポートします                                        |
| `expectPassthroughReplayPolicy`                      | プロバイダーのリプレイポリシーがプロバイダー所有のツールとメタデータをそのまま通すことをアサートします。`plugin-sdk/provider-test-contracts` からインポートします         |
| `runRealtimeSttLiveTest`                             | 共有音声フィクスチャでライブのリアルタイム STT プロバイダーテストを実行します。`plugin-sdk/provider-test-contracts` からインポートします                       |
| `normalizeTranscriptForMatch`                        | ファジーアサーションの前にライブ文字起こし出力を正規化します。`plugin-sdk/provider-test-contracts` からインポートします                               |
| `expectExplicitVideoGenerationCapabilities`          | 動画プロバイダーが明示的な生成モード機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts` からインポートします                   |
| `expectExplicitMusicGenerationCapabilities`          | 音楽プロバイダーが明示的な生成/編集機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts` からインポートします                   |
| `mockSuccessfulDashscopeVideoTask`                   | 成功した DashScope 互換の動画タスクレスポンスをインストールします。`plugin-sdk/provider-test-contracts` からインポートします                          |
| `getProviderHttpMocks`                               | オプトインのプロバイダー HTTP/認証 Vitest モックにアクセスします。`plugin-sdk/provider-http-test-mocks` からインポートします                                         |
| `installProviderHttpMockCleanup`                     | 各テスト後にプロバイダー HTTP/認証モックをリセットします。`plugin-sdk/provider-http-test-mocks` からインポートします                                        |
| `installCommonResolveTargetErrorCases`               | ターゲット解決エラー処理の共有テストケースです。`plugin-sdk/channel-target-testing` からインポートします                                  |
| `shouldAckReaction`                                  | チャネルが確認リアクションを追加すべきかどうかを確認します。`plugin-sdk/channel-feedback` からインポートします                                            |
| `removeAckReactionAfterReply`                        | 返信配信後に確認リアクションを削除します。`plugin-sdk/channel-feedback` からインポートします                                                      |
| `createTestRegistry`                                 | チャネル Plugin レジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします               |
| `createEmptyPluginRegistry`                          | 空の Plugin レジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします                |
| `setActivePluginRegistry`                            | Plugin ランタイムテスト用のレジストリフィクスチャをインストールします。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします   |
| `createRequestCaptureJsonFetch`                      | メディアヘルパーテストで JSON fetch リクエストをキャプチャします。`plugin-sdk/test-env` からインポートします                                                     |
| `withServer`                                         | 破棄可能なローカル HTTP サーバーに対してテストを実行します。`plugin-sdk/test-env` からインポートします                                                      |
| `createMockIncomingRequest`                          | 最小限の受信 HTTP リクエストオブジェクトを構築します。`plugin-sdk/test-env` からインポートします                                                          |
| `withFetchPreconnect`                                | プリコネクトフックをインストールした状態で fetch テストを実行します。`plugin-sdk/test-env` からインポートします                                                       |
| `withEnv` / `withEnvAsync`                           | 環境変数を一時的にパッチします。`plugin-sdk/test-env` からインポートします                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 分離されたファイルシステムテストフィクスチャを作成します。`plugin-sdk/test-env` からインポートします                                                              |
| `createMockServerResponse`                           | 最小限の HTTP サーバーレスポンスモックを作成します。`plugin-sdk/test-env` からインポートします                                                            |
| `createCliRuntimeCapture`                            | テストで CLI ランタイム出力をキャプチャします。`plugin-sdk/test-fixtures` からインポートします                                                              |
| `importFreshModule`                                  | モジュールキャッシュをバイパスするため、新しいクエリトークンで ESM モジュールをインポートします。`plugin-sdk/test-fixtures` からインポートします                             |
| `bundledPluginRoot` / `bundledPluginFile`            | バンドル済み Plugin のソースまたは dist フィクスチャパスを解決します。`plugin-sdk/test-fixtures` からインポートします                                              |
| `mockNodeBuiltinModule`                              | 狭い範囲の Node 組み込み Vitest モックをインストールします。`plugin-sdk/test-node-mocks` からインポートします                                                       |
| `createSandboxTestContext`                           | サンドボックステストコンテキストを構築します。`plugin-sdk/test-fixtures` からインポートします                                                                      |
| `writeSkill`                                         | Skills フィクスチャを書き込みます。`plugin-sdk/test-fixtures` からインポートします                                                                             |
| `makeAgentAssistantMessage`                          | エージェントトランスクリプトメッセージフィクスチャを構築します。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | システムイベントフィクスチャを検査およびリセットします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `sanitizeTerminalText`                               | アサーション用にターミナル出力をサニタイズします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `countLines` / `hasBalancedFences`                   | チャンク化出力の形状をアサートします。`plugin-sdk/test-fixtures` からインポートします                                                                     |
| `runProviderCatalog`                                 | テスト依存関係を使ってプロバイダーカタログフックを実行します                                                                                   |
| `resolveProviderWizardOptions`                       | 契約テストでプロバイダーセットアップウィザードの選択肢を解決します                                                                                  |
| `resolveProviderModelPickerEntries`                  | 契約テストでプロバイダーモデルピッカーエントリを解決します                                                                                  |
| `buildProviderPluginMethodChoice`                    | アサーション用にプロバイダーウィザード選択 ID を構築します                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | 分離テスト用にプロバイダーウィザードプロバイダーを注入します                                                                                      |
| `createProviderUsageFetch`                           | プロバイダー使用状況取得フィクスチャを構築                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 時間依存のテスト用にタイマーを固定し、復元します。`plugin-sdk/test-env` からインポートします                                                    |
| `createTestWizardPrompter`                           | モック化されたセットアップウィザードプロンプターを構築                                                                                                     |
| `createRuntimeTaskFlow`                              | 分離されたランタイムのタスクフロー状態を作成                                                                                                  |
| `typedCases`                                         | テーブル駆動テスト用にリテラル型を保持します。`plugin-sdk/test-fixtures` からインポートします                                                    |

バンドル Plugin のコントラクトスイートでも、テスト専用の
registry、manifest、public-artifact、runtime fixture ヘルパー向けに SDK testing サブパスを使用します。バンドルされた OpenClaw インベントリに依存する core-only
スイートは `src/plugins/contracts` 配下に残します。
新しい拡張テストでは、広範な `plugin-sdk/testing` 互換 barrel、repo の `src/**` ファイル、または repo の
`test/helpers/*` ブリッジを直接インポートするのではなく、
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、
`plugin-sdk/test-env`、または `plugin-sdk/test-fixtures` など、ドキュメント化された焦点の絞られた SDK サブパスを使用してください。

### 型

焦点の絞られた testing サブパスは、テストファイルで役立つ型も再エクスポートします。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## テスト対象の解決

channel ターゲット解決に標準エラーケースを追加するには、
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

### registration コントラクトのテスト

手書きの `api` モックを `register(api)` に渡す単体テストでは、
OpenClaw の loader 受け入れゲートは実行されません。Plugin が依存する各 registration サーフェス、特に hook や memory などの排他的な capability について、loader-backed の smoke test を少なくとも 1 つ追加してください。

実際の loader は、必須メタデータが欠落している場合や、Plugin が所有していない capability API を呼び出した場合に Plugin registration を失敗させます。たとえば、
`api.registerHook(...)` には hook 名が必要であり、
`api.registerMemoryCapability(...)` には Plugin manifest またはエクスポートされた entry が
`kind: "memory"` を宣言している必要があります。

### runtime config アクセスのテスト

バンドルされた channel Plugin をテストする場合は、`openclaw/plugin-sdk/channel-test-helpers`
の共有 Plugin runtime モックを優先してください。非推奨の `runtime.config.loadConfig()` と
`runtime.config.writeConfigFile(...)` モックはデフォルトで throw するため、テストで互換 API の新しい使用を検出できます。これらのモックを上書きするのは、テストが legacy 互換動作を明示的に扱っている場合のみにしてください。

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

### インスタンスごとの stub を使ったテスト

prototype mutation よりもインスタンスごとの stub を優先してください。

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## コントラクトテスト（repo 内 Plugin）

バンドル Plugin には、registration ownership を検証するコントラクトテストがあります。

```bash
pnpm test -- src/plugins/contracts/
```

これらのテストは次を assert します。

- どの Plugin がどの provider を登録するか
- どの Plugin がどの speech provider を登録するか
- registration 形状の正しさ
- runtime コントラクトへの準拠

### scoped test の実行

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

## lint 適用（repo 内 Plugin）

repo 内 Plugin に対して、`pnpm check` により 3 つのルールが適用されます。

1. **monolithic root import なし** -- `openclaw/plugin-sdk` root barrel は拒否されます
2. **直接の `src/` import なし** -- Plugin は `../../src/` を直接 import できません
3. **self-import なし** -- Plugin は自身の `plugin-sdk/<name>` サブパスを import できません

外部 Plugin にはこれらの lint ルールは適用されませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClaw は V8 coverage しきい値付きで Vitest を使用します。Plugin テストの場合:

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

- [SDK の概要](/ja-JP/plugins/sdk-overview) -- import 規約
- [SDK channel Plugin](/ja-JP/plugins/sdk-channel-plugins) -- channel Plugin インターフェイス
- [SDK provider Plugin](/ja-JP/plugins/sdk-provider-plugins) -- provider Plugin hook
- [Plugin の構築](/ja-JP/plugins/building-plugins) -- はじめにガイド
