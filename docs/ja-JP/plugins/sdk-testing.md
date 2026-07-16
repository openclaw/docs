---
read_when:
    - Plugin のテストを作成しています
    - Plugin SDK のテストユーティリティが必要です
    - バンドルされたプラグインのコントラクトテストについて理解したい場合
sidebarTitle: Testing
summary: OpenClaw Pluginのテストユーティリティとパターン
title: Plugin のテスト
x-i18n:
    generated_at: "2026-07-16T12:10:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin のテストユーティリティ、パターン、lint 適用に関するリファレンスです。

<Tip>
  **テスト例をお探しですか？** ハウツーガイドには、具体的なテスト例が含まれています：
  [チャンネル Plugin のテスト](/ja-JP/plugins/sdk-channel-plugins#step-6-test)と
  [プロバイダー Plugin のテスト](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

これらのサブパスは、OpenClaw 独自の同梱 Plugin テスト用のリポジトリローカルなソースエントリポイントです。サードパーティ製
Plugin 向けの公開済み `package.json` エクスポートではなく、
Vitest やその他のリポジトリ専用テスト依存関係をインポートする場合があります。

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

同梱 Plugin のテストには、これらの用途別サブパスを使用してください。以前の
`openclaw/plugin-sdk/testing` バレルはリポジトリローカルであり、配布パッケージから
除外されていたため、削除されました。従来の `openclaw/plugin-sdk/test-utils`
エイリアスは引き続きリポジトリローカルです。`pnpm run lint:plugins:no-extension-test-core-imports`
（`scripts/check-no-extension-test-core-imports.ts`）は、そのエイリアスを新たにインポートする
拡張機能テストを拒否します。

### 利用可能なエクスポート

| エクスポート                                               | 目的                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 直接登録ユニットテスト用の最小限のPlugin APIモックを構築します。`plugin-sdk/plugin-test-api` からインポートします                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | ネイティブエージェントランタイムアダプター用の共有認証プロファイル契約フィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポートします            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | ネイティブエージェントランタイムアダプター用の共有配信抑制契約フィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポートします    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | ネイティブエージェントランタイムアダプター用の共有フォールバック分類契約フィクスチャ。`plugin-sdk/agent-runtime-test-contracts` からインポートします |
| `createParameterFreeTool`                            | ネイティブランタイム契約テスト用の動的ツールスキーマフィクスチャを構築します。`plugin-sdk/agent-runtime-test-contracts` からインポートします              |
| `expectChannelInboundContextContract`                | チャネル受信コンテキストの形状をアサートします。`plugin-sdk/channel-contract-testing` からインポートします                                                  |
| `installChannelOutboundPayloadContractSuite`         | チャネル送信ペイロード契約ケースをインストールします。`plugin-sdk/channel-contract-testing` からインポートします                                       |
| `createStartAccountContext`                          | チャネルアカウントのライフサイクルコンテキストを構築します。`plugin-sdk/channel-test-helpers` からインポートします                                                  |
| `installChannelActionsContractSuite`                 | 汎用チャネルメッセージアクション契約ケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                     |
| `installChannelSetupContractSuite`                   | 汎用チャネルセットアップ契約ケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                              |
| `installChannelStatusContractSuite`                  | 汎用チャネルステータス契約ケースをインストールします。`plugin-sdk/channel-test-helpers` からインポートします                                             |
| `expectDirectoryIds`                                 | ディレクトリ一覧関数から得られるチャネルディレクトリIDをアサートします。`plugin-sdk/channel-test-helpers` からインポートします                               |
| `assertBundledChannelEntries`                        | バンドルされたチャネルエントリポイントが期待される公開契約を公開していることをアサートします。`plugin-sdk/channel-test-helpers` からインポートします                    |
| `formatEnvelopeTimestamp`                            | 決定論的なエンベロープタイムスタンプをフォーマットします。`plugin-sdk/channel-test-helpers` からインポートします                                                  |
| `expectPairingReplyText`                             | チャネルのペアリング応答テキストをアサートし、そのコードを抽出します。`plugin-sdk/channel-test-helpers` からインポートします                                    |
| `describePluginRegistrationContract`                 | Plugin登録契約チェックをインストールします。`plugin-sdk/plugin-test-contracts` からインポートします                                              |
| `registerSingleProviderPlugin`                       | ローダーのスモークテストで1つのプロバイダーPluginを登録します。`plugin-sdk/plugin-test-runtime` からインポートします                                         |
| `registerProviderPlugin`                             | 1つのPluginからすべてのプロバイダー種別をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                                                 |
| `registerProviderPlugins`                            | 複数のPluginにわたるプロバイダー登録をキャプチャします。`plugin-sdk/plugin-test-runtime` からインポートします                                     |
| `requireRegisteredProvider`                          | プロバイダーコレクションにIDが含まれていることをアサートします。`plugin-sdk/plugin-test-runtime` からインポートします                                           |
| `createRuntimeEnv`                                   | モック化されたCLI/Pluginランタイム環境を構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                              |
| `createPluginRuntimeMock`                            | モック化されたPluginランタイムサーフェスを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                                      |
| `createPluginSetupWizardStatus`                      | チャネルPlugin用のセットアップステータスヘルパーを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                             |
| `createTestWizardPrompter`                           | モック化されたセットアップウィザードのプロンプターを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                                       |
| `createRuntimeTaskFlow`                              | 分離されたランタイムTaskFlow状態を作成します。`plugin-sdk/plugin-test-runtime` からインポートします                                                    |
| `runProviderCatalog`                                 | テスト依存関係を使用してプロバイダーカタログフックを実行します。`plugin-sdk/plugin-test-runtime` からインポートします                                     |
| `resolveProviderWizardOptions`                       | 契約テストでプロバイダーセットアップウィザードの選択肢を解決します。`plugin-sdk/plugin-test-runtime` からインポートします                                    |
| `resolveProviderModelPickerEntries`                  | 契約テストでプロバイダーモデル選択項目を解決します。`plugin-sdk/plugin-test-runtime` からインポートします                                    |
| `buildProviderPluginMethodChoice`                    | アサーション用のプロバイダーウィザード選択肢IDを構築します。`plugin-sdk/plugin-test-runtime` からインポートします                                            |
| `setProviderWizardProvidersResolverForTest`          | 分離テスト用にプロバイダーウィザードのプロバイダーを注入します。`plugin-sdk/plugin-test-runtime` からインポートします                                        |
| `describeOpenAIProviderRuntimeContract`              | プロバイダーファミリーのランタイム契約チェックをインストールします。`plugin-sdk/provider-test-contracts` からインポートします                                        |
| `expectPassthroughReplayPolicy`                      | プロバイダーのリプレイポリシーが、プロバイダー所有のツールとメタデータをそのまま通過することをアサートします。`plugin-sdk/provider-test-contracts` からインポートします         |
| `runRealtimeSttLiveTest`                             | 共有音声フィクスチャを使用して、リアルタイムSTTプロバイダーのライブテストを実行します。`plugin-sdk/provider-test-contracts` からインポートします                       |
| `normalizeTranscriptForMatch`                        | あいまいアサーションの前にライブ文字起こし出力を正規化します。`plugin-sdk/provider-test-contracts` からインポートします                               |
| `expectExplicitVideoGenerationCapabilities`          | 動画プロバイダーが明示的な生成モード機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts` からインポートします                   |
| `expectExplicitMusicGenerationCapabilities`          | 音楽プロバイダーが明示的な生成・編集機能を宣言していることをアサートします。`plugin-sdk/provider-test-contracts` からインポートします                   |
| `mockSuccessfulDashscopeVideoTask`                   | 成功するDashScope互換の動画タスク応答をインストールします。`plugin-sdk/provider-test-contracts` からインポートします                          |
| `getProviderHttpMocks`                               | オプトインのプロバイダーHTTP/認証Vitestモックにアクセスします。`plugin-sdk/provider-http-test-mocks` からインポートします                                         |
| `installProviderHttpMockCleanup`                     | 各テスト後にプロバイダーHTTP/認証モックをリセットします。`plugin-sdk/provider-http-test-mocks` からインポートします                                        |
| `installCommonResolveTargetErrorCases`               | ターゲット解決のエラー処理用共有テストケース。`plugin-sdk/channel-target-testing` からインポートします                                  |
| `shouldAckReaction`                                  | チャネルが確認リアクションを追加すべきかを確認します。`plugin-sdk/channel-feedback` からインポートします                                            |
| `removeAckReactionAfterReply`                        | 応答の配信後に確認リアクションを削除します。`plugin-sdk/channel-feedback` からインポートします                                                      |
| `createTestRegistry`                                 | チャネルPluginレジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします               |
| `createEmptyPluginRegistry`                          | 空のPluginレジストリフィクスチャを構築します。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします                |
| `setActivePluginRegistry`                            | Pluginランタイムテスト用のレジストリフィクスチャをインストールします。`plugin-sdk/plugin-test-runtime` または `plugin-sdk/channel-test-helpers` からインポートします   |
| `createRequestCaptureJsonFetch`                      | メディアヘルパーテストでJSONフェッチリクエストをキャプチャします。`plugin-sdk/test-env` からインポートします                                                     |
| `withServer`                                         | 使い捨てのローカルHTTPサーバーに対してテストを実行します。`plugin-sdk/test-env` からインポートします                                                      |
| `createMockIncomingRequest`                          | 最小限の受信HTTPリクエストオブジェクトを構築します。`plugin-sdk/test-env` からインポートします                                                          |
| `withFetchPreconnect`                                | プリコネクトフックをインストールした状態でフェッチテストを実行します。`plugin-sdk/test-env` からインポートします                                                       |
| `withEnv` / `withEnvAsync`                           | 環境変数を一時的にパッチします。`plugin-sdk/test-env` からインポートします                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 分離されたファイルシステムテストフィクスチャを作成します。`plugin-sdk/test-env` からインポートします                                                              |
| `createMockServerResponse`                           | 最小限のHTTPサーバー応答モックを作成します。`plugin-sdk/test-env` からインポートします                                                            |
| `createProviderUsageFetch`                           | プロバイダー使用量フェッチフィクスチャを構築します。`plugin-sdk/test-env` からインポートします                                                                   |
| `useFrozenTime` / `useRealTime`                      | 時間依存テスト用にタイマーを固定および復元します。`plugin-sdk/test-env` からインポートします                                                    |
| `createCliRuntimeCapture`                            | テストでCLIランタイム出力をキャプチャします。`plugin-sdk/test-fixtures` からインポートします                                                              |
| `importFreshModule`                                  | モジュールキャッシュを回避するため、新しいクエリトークンを使用してESMモジュールをインポートします。`plugin-sdk/test-fixtures` からインポートします                             |
| `bundledPluginRoot` / `bundledPluginFile`            | バンドルされたPluginのソースまたはdistフィクスチャパスを解決します。`plugin-sdk/test-fixtures` からインポートします                                              |
| `mockNodeBuiltinModule`                              | 対象を絞ったNode組み込みVitestモックをインストールします。`plugin-sdk/test-node-mocks` からインポートします                                                       |
| `createSandboxTestContext`                           | サンドボックステストコンテキストを構築します。`plugin-sdk/test-fixtures` からインポートします                                                                      |
| `writeSkill`                                         | Skillsフィクスチャを書き込みます。`plugin-sdk/test-fixtures` からインポートします                                                                             |
| `makeAgentAssistantMessage`                          | エージェント文字起こしメッセージフィクスチャを構築します。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | システムイベントフィクスチャを検査およびリセットします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `sanitizeTerminalText`                               | アサーション用にターミナル出力をサニタイズします。`plugin-sdk/test-fixtures` からインポートします                                                          |
| `countLines` / `hasBalancedFences`                   | チャンク分割出力の形状をアサートします。`plugin-sdk/test-fixtures` からインポートします                                                                     |
| `typedCases`                                         | テーブル駆動テスト用にリテラル型を保持します。`plugin-sdk/test-fixtures` からインポートします                                                    |

バンドルされたPluginの契約スイートでも、テスト専用のレジストリ、マニフェスト、公開アーティファクト、およびランタイムフィクスチャのヘルパーとして、これらのSDKテスト用サブパスを使用します。
バンドルされたOpenClawインベントリに依存するコア専用スイートは、代わりに
`src/plugins/contracts` 配下に維持されます。

### 型

重点的なテスト用サブパスでは、テストファイルで役立つ型も再エクスポートされます。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## テストでのターゲット解決

チャンネルのターゲット解決に標準的なエラーケースを追加するには、`installCommonResolveTargetErrorCases` を使用します。

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // チャンネルのターゲット解決ロジック
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

手書きの `api` モックを `register(api)` に渡す単体テストでは、OpenClaw のローダー受け入れゲートは実行されません。Plugin が依存する各登録サーフェスについて、ローダーを使用するスモークテストを少なくとも1つ追加してください。特に、フックやメモリなどの排他的機能が対象です。

実際のローダーでは、必須メタデータが欠けている場合や、Plugin が所有していない機能 API を呼び出した場合、Plugin の登録に失敗します。たとえば、`api.registerHook(...)` にはフック名が必要であり、`api.registerMemoryCapability(...)` では、Plugin マニフェストまたはエクスポートされたエントリで `kind: "memory"` を宣言する必要があります。

### ランタイム設定アクセスのテスト

`openclaw/plugin-sdk/plugin-test-runtime` の共有 Plugin ランタイムモックを推奨します。その `runtime.config.loadConfig()` および `runtime.config.writeConfigFile(...)` モックはデフォルトで例外をスローするため、非推奨の互換性 API が新たに使用された場合にテストで検出できます。テストでレガシー互換動作を明示的に扱う場合に限り、これらのモックをオーバーライドしてください。

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
    // トークン値は公開されない
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

### Plugin ランタイムのモック

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

## コントラクトテスト（リポジトリ内 Plugin）

バンドルされた Plugin には、登録の所有権を検証するコントラクトテストがあります。

```bash
pnpm test src/plugins/contracts/
```

これらのテストでは、次の項目を検証します。

- どの Plugin がどのプロバイダーを登録するか
- どの Plugin がどの音声プロバイダーを登録するか
- 登録形式の正確性
- ランタイムコントラクトへの準拠

### スコープを限定したテストの実行

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

## lint の適用（リポジトリ内 Plugin）

`scripts/run-additional-boundary-checks.mjs` は、CI で一連の `lint:plugins:*` インポート境界チェックを実行します。各チェックはローカルでも個別に実行できます。

| コマンド                                                       | 適用内容                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | バンドルされた Plugin は、モノリシックな `openclaw/plugin-sdk` ルートバレルをインポートできません。             |
| `pnpm run lint:plugins:no-extension-src-imports`               | 本番用の拡張機能ファイルは、リポジトリの `src/**` ツリーを直接インポートできません（`../../src/...`）。 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | 拡張機能のテストファイルは、`plugin-sdk/test-utils` やその他のコア専用テストヘルパーをインポートできません。 |

外部 Plugin はこれらの lint ルールの対象ではありませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClaw は、情報提供を目的とした V8 カバレッジレポートを備えた Vitest 4 を使用します。Plugin のテストでは次のコマンドを使用します。

```bash
# すべてのテストを実行
pnpm test

# 特定の Plugin のテストを実行
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

- [SDK の概要](/ja-JP/plugins/sdk-overview) -- インポート規則
- [SDK チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) -- チャンネル Plugin インターフェース
- [SDK プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) -- プロバイダー Plugin フック
- [Plugin の構築](/ja-JP/plugins/building-plugins) -- はじめにガイド
