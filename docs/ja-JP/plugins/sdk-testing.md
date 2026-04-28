---
read_when:
    - Plugin のテストを書いている場合
    - Plugin SDK のテストユーティリティが必要な場合
    - bundled Plugin の契約テストを理解したい場合
sidebarTitle: Testing
summary: OpenClaw Plugins のテストユーティリティとパターン
title: Plugin テスト
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:12:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

OpenClaw
Plugins のテストユーティリティ、パターン、lint 強制に関するリファレンスです。

<Tip>
  **テスト例をお探しですか？** ハウツーガイドには実際のテスト例があります:
  [Channel plugin tests](/ja-JP/plugins/sdk-channel-plugins#step-6-test) と
  [Provider plugin tests](/ja-JP/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

**インポート:** `openclaw/plugin-sdk/testing`

testing subpath は、Plugin 作者向けに絞られたヘルパー群をエクスポートします。

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### 利用可能なエクスポート

| エクスポート                           | 目的                                                |
| -------------------------------------- | --------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | ターゲット解決エラー処理用の共有テストケース        |
| `shouldAckReaction`                    | チャネルが ack リアクションを追加すべきかを確認する |
| `removeAckReactionAfterReply`          | 返信配信後に ack リアクションを削除する             |

### 型

testing subpath は、テストファイルで有用な型も再エクスポートします。

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
  OpenClawConfig,
  PluginRuntime,
  RuntimeEnv,
  MockFn,
} from "openclaw/plugin-sdk/testing";
```

## ターゲット解決のテスト

チャネルターゲット解決用の標準エラーケースを追加するには
`installCommonResolveTargetErrorCases` を使ってください。

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // あなたのチャネルのターゲット解決ロジック
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // チャネル固有のテストケースを追加
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## テストパターン

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
    // token 値は露出しない
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

`createPluginRuntimeStore` を使うコードでは、テストでランタイムをモックしてください。

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// テストセットアップ内
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// テスト後
store.clearRuntime();
```

### インスタンスごとのスタブでテストする

prototype の変更より、インスタンスごとのスタブを優先してください。

```typescript
// 推奨: インスタンスごとのスタブ
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 避けるべき: prototype の変更
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契約テスト（リポジトリ内 Plugins）

bundled Plugins には、登録所有権を検証する契約テストがあります。

```bash
pnpm test -- src/plugins/contracts/
```

これらのテストは次を検証します。

- どの Plugin がどの provider を登録するか
- どの Plugin がどの speech provider を登録するか
- 登録形状の正しさ
- ランタイム契約への準拠

### スコープ付きテストの実行

特定の Plugin に対して:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

契約テストだけを実行するには:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint 強制（リポジトリ内 Plugins）

リポジトリ内 Plugins に対して、`pnpm check` では 3 つのルールが強制されます。

1. **巨大なルートインポート禁止** -- `openclaw/plugin-sdk` ルート barrel は拒否される
2. **直接 `src/` インポート禁止** -- Plugin は `../../src/` を直接 import できない
3. **自己インポート禁止** -- Plugin は自分自身の `plugin-sdk/<name>` subpath を import できない

外部 Plugin はこれらの lint ルールの対象ではありませんが、同じパターンに従うことを推奨します。

## テスト設定

OpenClaw は Vitest を V8 coverage threshold とともに使います。Plugin テストでは:

```bash
# すべてのテストを実行
pnpm test

# 特定の Plugin テストを実行
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# 特定のテスト名フィルター付きで実行
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# coverage 付きで実行
pnpm test:coverage
```

ローカル実行でメモリ圧迫が起きる場合:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 関連

- [SDK Overview](/ja-JP/plugins/sdk-overview) -- インポート規約
- [SDK Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) -- チャネル Plugin インターフェース
- [SDK Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) -- プロバイダー Plugin フック
- [Building Plugins](/ja-JP/plugins/building-plugins) -- はじめにガイド
