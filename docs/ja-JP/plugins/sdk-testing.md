---
read_when:
    - Plugin のテストを作成しています
    - Plugin SDK のテストユーティリティが必要です
    - バンドルされたPluginの契約テストについて理解したい場合
sidebarTitle: Testing
summary: OpenClaw Plugin向けのテストユーティリティとパターン
title: Plugin のテスト
x-i18n:
    generated_at: "2026-07-11T22:32:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin向けのテストユーティリティ、パターン、lint適用に関するリファレンスです。

<Tip>
  **テスト例をお探しですか？** ハウツーガイドには、実際のテスト例が含まれています：
  [チャンネルPluginのテスト](/ja-JP/plugins/sdk-channel-plugins#step-6-test)と
  [プロバイダーPluginのテスト](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

これらのサブパスは、OpenClaw独自のバンドル済みPluginテスト向けの、リポジトリローカルなソースエントリポイントです。サードパーティPlugin向けに公開された`package.json`のエクスポートではなく、Vitestやその他のリポジトリ専用テスト依存関係をインポートする場合があります。

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

新しいバンドル済みPluginのテストでは、これらの目的別サブパスを優先してください。広範な`openclaw/plugin-sdk/testing`バレルと`openclaw/plugin-sdk/test-utils`エイリアスは、レガシー互換性専用です。`pnpm run lint:plugins:no-extension-test-core-imports`（`scripts/check-no-extension-test-core-imports.ts`）は、拡張機能のテストファイルからこれらのいずれかを新たにインポートすることを拒否し、どちらも互換性記録テストのためだけに残されています。

### 利用可能なエクスポート

| エクスポート                                         | 目的                                                                                                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 直接登録のユニットテスト用に最小限のPlugin APIモックを構築します。`plugin-sdk/plugin-test-api`からインポートします                                            |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ネイティブエージェントランタイムアダプター用の共有認証プロファイル契約フィクスチャ。`plugin-sdk/agent-runtime-test-contracts`からインポートします              |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ネイティブエージェントランタイムアダプター用の共有配信抑制契約フィクスチャ。`plugin-sdk/agent-runtime-test-contracts`からインポートします                      |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ネイティブエージェントランタイムアダプター用の共有フォールバック分類契約フィクスチャ。`plugin-sdk/agent-runtime-test-contracts`からインポートします            |
| `createParameterFreeTool`                            | ネイティブランタイム契約テスト用の動的ツールスキーマフィクスチャを構築します。`plugin-sdk/agent-runtime-test-contracts`からインポートします                    |
| `expectChannelInboundContextContract`                | チャネルの受信コンテキストの形状をアサートします。`plugin-sdk/channel-contract-testing`からインポートします                                                    |
| `installChannelOutboundPayloadContractSuite`         | チャネルの送信ペイロード契約ケースを導入します。`plugin-sdk/channel-contract-testing`からインポートします                                                      |
| `createStartAccountContext`                          | チャネルアカウントのライフサイクルコンテキストを構築します。`plugin-sdk/channel-test-helpers`からインポートします                                              |
| `installChannelActionsContractSuite`                 | 汎用チャネルメッセージアクションの契約ケースを導入します。`plugin-sdk/channel-test-helpers`からインポートします                                                |
| `installChannelSetupContractSuite`                   | 汎用チャネルセットアップの契約ケースを導入します。`plugin-sdk/channel-test-helpers`からインポートします                                                        |
| `installChannelStatusContractSuite`                  | 汎用チャネルステータスの契約ケースを導入します。`plugin-sdk/channel-test-helpers`からインポートします                                                          |
| `expectDirectoryIds`                                 | ディレクトリ一覧関数から取得したチャネルディレクトリIDをアサートします。`plugin-sdk/channel-test-helpers`からインポートします                                   |
| `assertBundledChannelEntries`                        | バンドルされたチャネルのエントリーポイントが期待される公開契約を公開していることをアサートします。`plugin-sdk/channel-test-helpers`からインポートします        |
| `formatEnvelopeTimestamp`                            | 決定論的なエンベロープのタイムスタンプを書式設定します。`plugin-sdk/channel-test-helpers`からインポートします                                                  |
| `expectPairingReplyText`                             | チャネルのペアリング返信テキストをアサートし、そのコードを抽出します。`plugin-sdk/channel-test-helpers`からインポートします                                    |
| `describePluginRegistrationContract`                 | Plugin登録契約のチェックを導入します。`plugin-sdk/plugin-test-contracts`からインポートします                                                                    |
| `registerSingleProviderPlugin`                       | ローダーのスモークテストで1つのプロバイダーPluginを登録します。`plugin-sdk/plugin-test-runtime`からインポートします                                            |
| `registerProviderPlugin`                             | 1つのPluginからすべてのプロバイダー種別をキャプチャします。`plugin-sdk/plugin-test-runtime`からインポートします                                                |
| `registerProviderPlugins`                            | 複数のPluginにわたるプロバイダー登録をキャプチャします。`plugin-sdk/plugin-test-runtime`からインポートします                                                   |
| `requireRegisteredProvider`                          | プロバイダーコレクションに指定のIDが含まれていることをアサートします。`plugin-sdk/plugin-test-runtime`からインポートします                                     |
| `createRuntimeEnv`                                   | モック化されたCLI/Pluginランタイム環境を構築します。`plugin-sdk/plugin-test-runtime`からインポートします                                                       |
| `createPluginRuntimeMock`                            | モック化されたPluginランタイムサーフェスを構築します。`plugin-sdk/plugin-test-runtime`からインポートします                                                     |
| `createPluginSetupWizardStatus`                      | チャネルPlugin用のセットアップステータスヘルパーを構築します。`plugin-sdk/plugin-test-runtime`からインポートします                                             |
| `createTestWizardPrompter`                           | モック化されたセットアップウィザードのプロンプターを構築します。`plugin-sdk/plugin-test-runtime`からインポートします                                          |
| `createRuntimeTaskFlow`                              | 分離されたランタイムTaskFlow状態を作成します。`plugin-sdk/plugin-test-runtime`からインポートします                                                             |
| `runProviderCatalog`                                 | テスト依存関係を使用してプロバイダーカタログフックを実行します。`plugin-sdk/plugin-test-runtime`からインポートします                                           |
| `resolveProviderWizardOptions`                       | 契約テストでプロバイダーセットアップウィザードの選択肢を解決します。`plugin-sdk/plugin-test-runtime`からインポートします                                       |
| `resolveProviderModelPickerEntries`                  | 契約テストでプロバイダーのモデル選択項目を解決します。`plugin-sdk/plugin-test-runtime`からインポートします                                                     |
| `buildProviderPluginMethodChoice`                    | アサーション用にプロバイダーウィザードの選択肢IDを構築します。`plugin-sdk/plugin-test-runtime`からインポートします                                             |
| `setProviderWizardProvidersResolverForTest`          | 分離テスト用にプロバイダーウィザードのプロバイダーを注入します。`plugin-sdk/plugin-test-runtime`からインポートします                                           |
| `describeOpenAIProviderRuntimeContract`              | プロバイダーファミリーのランタイム契約チェックを導入します。`plugin-sdk/provider-test-contracts`からインポートします                                           |
| `expectPassthroughReplayPolicy`                      | プロバイダーのリプレイポリシーが、プロバイダー所有のツールとメタデータをそのまま通過させることをアサートします。`plugin-sdk/provider-test-contracts`からインポートします |
| `runRealtimeSttLiveTest`                             | 共有音声フィクスチャを使用してリアルタイムSTTプロバイダーのライブテストを実行します。`plugin-sdk/provider-test-contracts`からインポートします                   |
| `normalizeTranscriptForMatch`                        | あいまいアサーションの前にライブ文字起こし出力を正規化します。`plugin-sdk/provider-test-contracts`からインポートします                                        |
| `expectExplicitVideoGenerationCapabilities`          | 動画プロバイダーが明示的な生成モード機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts`からインポートします                            |
| `expectExplicitMusicGenerationCapabilities`          | 音楽プロバイダーが明示的な生成/編集機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts`からインポートします                             |
| `mockSuccessfulDashscopeVideoTask`                   | 成功するDashScope互換の動画タスクレスポンスを導入します。`plugin-sdk/provider-test-contracts`からインポートします                                              |
| `getProviderHttpMocks`                               | オプトインのプロバイダーHTTP/認証Vitestモックにアクセスします。`plugin-sdk/provider-http-test-mocks`からインポートします                                       |
| `installProviderHttpMockCleanup`                     | 各テスト後にプロバイダーHTTP/認証モックをリセットします。`plugin-sdk/provider-http-test-mocks`からインポートします                                             |
| `installCommonResolveTargetErrorCases`               | ターゲット解決のエラー処理用の共有テストケース。`plugin-sdk/channel-target-testing`からインポートします                                                        |
| `shouldAckReaction`                                  | チャネルが確認リアクションを追加すべきかを確認します。`plugin-sdk/channel-feedback`からインポートします                                                        |
| `removeAckReactionAfterReply`                        | 返信の配信後に確認リアクションを削除します。`plugin-sdk/channel-feedback`からインポートします                                                                  |
| `createTestRegistry`                                 | チャネルPluginレジストリのフィクスチャを構築します。`plugin-sdk/plugin-test-runtime`または`plugin-sdk/channel-test-helpers`からインポートします                 |
| `createEmptyPluginRegistry`                          | 空のPluginレジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime`または`plugin-sdk/channel-test-helpers`からインポートします                       |
| `setActivePluginRegistry`                            | Pluginランタイムテスト用のレジストリフィクスチャを導入します。`plugin-sdk/plugin-test-runtime`または`plugin-sdk/channel-test-helpers`からインポートします      |
| `createRequestCaptureJsonFetch`                      | メディアヘルパーテストでJSON fetchリクエストをキャプチャします。`plugin-sdk/test-env`からインポートします                                                      |
| `withServer`                                         | 使い捨てのローカルHTTPサーバーに対してテストを実行します。`plugin-sdk/test-env`からインポートします                                                            |
| `createMockIncomingRequest`                          | 最小限の受信HTTPリクエストオブジェクトを構築します。`plugin-sdk/test-env`からインポートします                                                                  |
| `withFetchPreconnect`                                | preconnectフックを導入した状態でfetchテストを実行します。`plugin-sdk/test-env`からインポートします                                                             |
| `withEnv` / `withEnvAsync`                           | 環境変数を一時的に変更します。`plugin-sdk/test-env`からインポートします                                                                                        |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 分離されたファイルシステムテストフィクスチャを作成します。`plugin-sdk/test-env`からインポートします                                                            |
| `createMockServerResponse`                           | 最小限のHTTPサーバーレスポンスモックを作成します。`plugin-sdk/test-env`からインポートします                                                                    |
| `createProviderUsageFetch`                           | プロバイダー使用量のfetchフィクスチャを構築します。`plugin-sdk/test-env`からインポートします                                                                   |
| `useFrozenTime` / `useRealTime`                      | 時間依存テスト用にタイマーを固定し、元に戻します。`plugin-sdk/test-env`からインポートします                                                                    |
| `createCliRuntimeCapture`                            | テストでCLIランタイム出力をキャプチャします。`plugin-sdk/test-fixtures`からインポートします                                                                    |
| `importFreshModule`                                  | モジュールキャッシュを回避するため、新しいクエリトークンを使用してESMモジュールをインポートします。`plugin-sdk/test-fixtures`からインポートします             |
| `bundledPluginRoot` / `bundledPluginFile`            | バンドルされたPluginのソースまたはdistフィクスチャのパスを解決します。`plugin-sdk/test-fixtures`からインポートします                                           |
| `mockNodeBuiltinModule`                              | 対象を限定したNode組み込みVitestモックを導入します。`plugin-sdk/test-node-mocks`からインポートします                                                           |
| `createSandboxTestContext`                           | サンドボックステストコンテキストを構築します。`plugin-sdk/test-fixtures`からインポートします                                                                   |
| `writeSkill`                                         | Skills のフィクスチャを書き込みます。`plugin-sdk/test-fixtures` からインポートします                                                                             |
| `makeAgentAssistantMessage`                          | エージェントのトランスクリプトメッセージ用フィクスチャを作成します。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | システムイベントのフィクスチャを検査し、リセットします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `sanitizeTerminalText`                               | アサーション用にターミナル出力をサニタイズします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `countLines` / `hasBalancedFences`                   | チャンク分割出力の形式を検証します。`plugin-sdk/test-fixtures` からインポートします                                                                     |
| `typedCases`                                         | テーブル駆動テスト用にリテラル型を保持します。`plugin-sdk/test-fixtures` からインポートします                                                    |

バンドル済みPluginのコントラクトスイートでも、テスト専用のレジストリ、マニフェスト、公開アーティファクト、ランタイムフィクスチャのヘルパーとして、これらのSDKテスト用サブパスを使用します。
一方、バンドル済みOpenClawインベントリに依存するコア専用スイートは、引き続き
`src/plugins/contracts` に配置します。

### 型

特定用途向けのテスト用サブパスでは、テストファイルで役立つ型も再エクスポートされます。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## テスト対象の解決

チャンネルの対象解決に標準的なエラーケースを追加するには、`installCommonResolveTargetErrorCases` を使用します。

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // チャンネル固有の対象解決ロジック
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // チャンネル固有のテストケースを追加
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## テストパターン

### 登録コントラクトのテスト

手書きの `api` モックを `register(api)` に渡すユニットテストでは、OpenClawのローダー受け入れゲートを検証できません。Pluginが依存する各登録サーフェスに対して、ローダー経由のスモークテストを少なくとも1つ追加してください。特に、フックやメモリなどの排他的な機能では重要です。

必要なメタデータが欠けている場合や、Pluginが所有していない機能APIを呼び出した場合、実際のローダーではPluginの登録に失敗します。たとえば、
`api.registerHook(...)` にはフック名が必要であり、
`api.registerMemoryCapability(...)` には、Pluginマニフェストまたはエクスポートされたエントリで `kind: "memory"` を宣言する必要があります。

### ランタイム設定アクセスのテスト

`openclaw/plugin-sdk/plugin-test-runtime` の共有Pluginランタイムモックを推奨します。
その `runtime.config.loadConfig()` および `runtime.config.writeConfigFile(...)`
のモックはデフォルトで例外をスローするため、非推奨の互換性APIが新たに使用されるとテストで検出できます。テストがレガシー互換動作を明示的に検証する場合にのみ、これらのモックをオーバーライドしてください。

### チャンネルPluginのユニットテスト

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
    // トークン値は公開されない
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### プロバイダーPluginのユニットテスト

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... コンテキスト
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... コンテキスト
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Pluginランタイムのモック

`createPluginRuntimeStore` を使用するコードでは、テスト内でランタイムをモックします。

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
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

### インスタンス単位のスタブを使用したテスト

プロトタイプの変更よりも、インスタンス単位のスタブを推奨します。

```typescript
// 推奨: インスタンス単位のスタブ
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 非推奨: プロトタイプの変更
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## コントラクトテスト（リポジトリ内Plugin）

バンドル済みPluginには、登録の所有権を検証するコントラクトテストがあります。

```bash
pnpm test src/plugins/contracts/
```

これらのテストでは、次の項目を検証します。

- どのPluginがどのプロバイダーを登録するか
- どのPluginがどの音声プロバイダーを登録するか
- 登録形式の正しさ
- ランタイムコントラクトへの準拠

### スコープを限定したテストの実行

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

## lintによる適用（リポジトリ内Plugin）

`scripts/run-additional-boundary-checks.mjs` は、CIで一連の `lint:plugins:*`
インポート境界チェックを実行します。各チェックはローカルでも単独で実行できます。

| コマンド                                                       | 適用内容                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | バンドル済みPluginは、モノリシックな `openclaw/plugin-sdk` ルートバレルをインポートできません。                              |
| `pnpm run lint:plugins:no-extension-src-imports`               | 本番用拡張ファイルは、リポジトリの `src/**` ツリーを直接インポートできません（`../../src/...`）。                            |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | 拡張のテストファイルは、`openclaw/plugin-sdk/testing`、`plugin-sdk/test-utils`、その他のコア専用テストヘルパーをインポートできません。 |

外部Pluginにはこれらのlintルールは適用されませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClawは、参考情報としてV8カバレッジを報告するVitest 4を使用します。Pluginのテストでは、次のコマンドを使用します。

```bash
# すべてのテストを実行
pnpm test

# 特定のPluginテストを実行
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# 特定のテスト名フィルターを指定して実行
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# カバレッジ付きで実行
pnpm test:coverage
```

ローカル実行によってメモリ負荷が高くなる場合:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 関連項目

- [SDKの概要](/ja-JP/plugins/sdk-overview) -- インポート規約
- [SDKチャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins) -- チャンネルPluginインターフェース
- [SDKプロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) -- プロバイダーPluginフック
- [Pluginの構築](/ja-JP/plugins/building-plugins) -- はじめにガイド
