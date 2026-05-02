---
read_when:
    - Bạn đang viết kiểm thử cho một Plugin
    - Bạn cần các tiện ích kiểm thử từ SDK Plugin
    - Bạn muốn tìm hiểu các kiểm thử hợp đồng cho các Plugin được đóng gói kèm
sidebarTitle: Testing
summary: Tiện ích và mẫu kiểm thử cho Plugin OpenClaw
title: Kiểm thử Plugin
x-i18n:
    generated_at: "2026-05-02T22:21:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Tài liệu tham chiếu về tiện ích kiểm thử, mẫu sử dụng và thực thi lint cho các Plugin của OpenClaw.

<Tip>
  **Bạn đang tìm ví dụ kiểm thử?** Các hướng dẫn cách làm có các ví dụ kiểm thử đã được trình bày:
  [Kiểm thử Plugin kênh](/vi/plugins/sdk-channel-plugins#step-6-test) và
  [Kiểm thử Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Tiện ích kiểm thử

**Nhập mô phỏng API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Nhập hợp đồng runtime tác nhân:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Nhập hợp đồng kênh:** `openclaw/plugin-sdk/channel-contract-testing`

**Nhập trình trợ giúp kiểm thử kênh:** `openclaw/plugin-sdk/channel-test-helpers`

**Nhập kiểm thử mục tiêu kênh:** `openclaw/plugin-sdk/channel-target-testing`

**Nhập hợp đồng Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Nhập kiểm thử runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Nhập hợp đồng nhà cung cấp:** `openclaw/plugin-sdk/provider-test-contracts`

**Nhập mô phỏng HTTP nhà cung cấp:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Nhập kiểm thử môi trường/mạng:** `openclaw/plugin-sdk/test-env`

**Nhập fixture chung:** `openclaw/plugin-sdk/test-fixtures`

**Nhập mô phỏng tích hợp sẵn của Node:** `openclaw/plugin-sdk/test-node-mocks`

Ưu tiên các subpath tập trung bên dưới cho các kiểm thử Plugin mới. Barrel rộng
`openclaw/plugin-sdk/testing` chỉ dành cho tương thích kế thừa.
Các rào chắn của repo từ chối những import thực mới từ `plugin-sdk/testing` và
`plugin-sdk/test-utils`; các tên đó chỉ còn là bề mặt tương thích không được khuyến nghị
cho các Plugin bên ngoài và kiểm thử bản ghi tương thích.

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

### Các export có sẵn

| Mục xuất                                             | Mục đích                                                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Tạo mô phỏng API Plugin tối thiểu cho kiểm thử đơn vị đăng ký trực tiếp. Nhập từ `plugin-sdk/plugin-test-api`                               |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture hợp đồng auth-profile dùng chung cho các bộ chuyển đổi runtime agent gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`         |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture hợp đồng chặn gửi dùng chung cho các bộ chuyển đổi runtime agent gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`             |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture hợp đồng phân loại fallback dùng chung cho các bộ chuyển đổi runtime agent gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`   |
| `createParameterFreeTool`                            | Tạo fixture schema công cụ động cho kiểm thử hợp đồng runtime gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                        |
| `expectChannelInboundContextContract`                | Kiểm tra hình dạng ngữ cảnh inbound của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Cài đặt các trường hợp hợp đồng payload outbound của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                    |
| `createStartAccountContext`                          | Tạo ngữ cảnh vòng đời tài khoản kênh. Nhập từ `plugin-sdk/channel-test-helpers`                                                             |
| `installChannelActionsContractSuite`                 | Cài đặt các trường hợp hợp đồng hành động tin nhắn kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                    |
| `installChannelSetupContractSuite`                   | Cài đặt các trường hợp hợp đồng thiết lập kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                             |
| `installChannelStatusContractSuite`                  | Cài đặt các trường hợp hợp đồng trạng thái kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                            |
| `expectDirectoryIds`                                 | Kiểm tra id thư mục kênh từ hàm liệt kê thư mục. Nhập từ `plugin-sdk/channel-test-helpers`                                                  |
| `assertBundledChannelEntries`                        | Kiểm tra các entrypoint kênh được đóng gói có công bố hợp đồng công khai mong đợi. Nhập từ `plugin-sdk/channel-test-helpers`                |
| `formatEnvelopeTimestamp`                            | Định dạng dấu thời gian envelope xác định được. Nhập từ `plugin-sdk/channel-test-helpers`                                                   |
| `expectPairingReplyText`                             | Kiểm tra văn bản trả lời ghép nối của kênh và trích xuất mã của nó. Nhập từ `plugin-sdk/channel-test-helpers`                              |
| `describePluginRegistrationContract`                 | Cài đặt kiểm tra hợp đồng đăng ký Plugin. Nhập từ `plugin-sdk/plugin-test-contracts`                                                        |
| `registerSingleProviderPlugin`                       | Đăng ký một Plugin provider trong kiểm thử khói loader. Nhập từ `plugin-sdk/plugin-test-runtime`                                            |
| `registerProviderPlugin`                             | Thu thập mọi loại provider từ một Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                          |
| `registerProviderPlugins`                            | Thu thập đăng ký provider trên nhiều Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                       |
| `requireRegisteredProvider`                          | Kiểm tra một tập hợp provider có chứa một id. Nhập từ `plugin-sdk/plugin-test-runtime`                                                      |
| `createRuntimeEnv`                                   | Tạo môi trường runtime CLI/Plugin được mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                                   |
| `createPluginSetupWizardStatus`                      | Tạo helper trạng thái thiết lập cho Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime`                                                   |
| `describeOpenAIProviderRuntimeContract`              | Cài đặt kiểm tra hợp đồng runtime cho họ provider. Nhập từ `plugin-sdk/provider-test-contracts`                                             |
| `expectPassthroughReplayPolicy`                      | Kiểm tra chính sách phát lại provider truyền qua các công cụ và metadata do provider sở hữu. Nhập từ `plugin-sdk/provider-test-contracts`   |
| `runRealtimeSttLiveTest`                             | Chạy kiểm thử trực tiếp provider STT thời gian thực với fixture âm thanh dùng chung. Nhập từ `plugin-sdk/provider-test-contracts`           |
| `normalizeTranscriptForMatch`                        | Chuẩn hóa đầu ra bản ghi trực tiếp trước các kiểm tra gần đúng. Nhập từ `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Kiểm tra các provider video khai báo năng lực chế độ tạo rõ ràng. Nhập từ `plugin-sdk/provider-test-contracts`                              |
| `expectExplicitMusicGenerationCapabilities`          | Kiểm tra các provider nhạc khai báo năng lực tạo/chỉnh sửa rõ ràng. Nhập từ `plugin-sdk/provider-test-contracts`                            |
| `mockSuccessfulDashscopeVideoTask`                   | Cài đặt phản hồi tác vụ video tương thích DashScope thành công. Nhập từ `plugin-sdk/provider-test-contracts`                                |
| `getProviderHttpMocks`                               | Truy cập mô phỏng Vitest HTTP/auth provider chọn tham gia. Nhập từ `plugin-sdk/provider-http-test-mocks`                                   |
| `installProviderHttpMockCleanup`                     | Đặt lại mô phỏng HTTP/auth provider sau mỗi kiểm thử. Nhập từ `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Các trường hợp kiểm thử dùng chung cho xử lý lỗi phân giải mục tiêu. Nhập từ `plugin-sdk/channel-target-testing`                           |
| `shouldAckReaction`                                  | Kiểm tra một kênh có nên thêm phản ứng xác nhận hay không. Nhập từ `plugin-sdk/channel-feedback`                                           |
| `removeAckReactionAfterReply`                        | Gỡ phản ứng xác nhận sau khi gửi trả lời. Nhập từ `plugin-sdk/channel-feedback`                                                             |
| `createTestRegistry`                                 | Tạo fixture registry Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                          |
| `createEmptyPluginRegistry`                          | Tạo fixture registry Plugin trống. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                         |
| `setActivePluginRegistry`                            | Cài đặt fixture registry cho kiểm thử runtime Plugin. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`       |
| `createRequestCaptureJsonFetch`                      | Thu thập yêu cầu fetch JSON trong kiểm thử helper media. Nhập từ `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Chạy kiểm thử trên máy chủ HTTP cục bộ dùng một lần. Nhập từ `plugin-sdk/test-env`                                                         |
| `createMockIncomingRequest`                          | Tạo đối tượng yêu cầu HTTP đến tối thiểu. Nhập từ `plugin-sdk/test-env`                                                                     |
| `withFetchPreconnect`                                | Chạy kiểm thử fetch với hook preconnect đã cài đặt. Nhập từ `plugin-sdk/test-env`                                                          |
| `withEnv` / `withEnvAsync`                           | Tạm thời vá biến môi trường. Nhập từ `plugin-sdk/test-env`                                                                                 |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tạo fixture kiểm thử hệ thống tệp cô lập. Nhập từ `plugin-sdk/test-env`                                                                    |
| `createMockServerResponse`                           | Tạo mô phỏng phản hồi máy chủ HTTP tối thiểu. Nhập từ `plugin-sdk/test-env`                                                                |
| `createCliRuntimeCapture`                            | Thu thập đầu ra runtime CLI trong kiểm thử. Nhập từ `plugin-sdk/test-fixtures`                                                             |
| `importFreshModule`                                  | Nhập mô-đun ESM với token truy vấn mới để bỏ qua bộ nhớ đệm mô-đun. Nhập từ `plugin-sdk/test-fixtures`                                    |
| `bundledPluginRoot` / `bundledPluginFile`            | Phân giải đường dẫn fixture nguồn hoặc dist của Plugin được đóng gói. Nhập từ `plugin-sdk/test-fixtures`                                  |
| `mockNodeBuiltinModule`                              | Cài đặt mô phỏng Vitest hẹp cho module tích hợp sẵn của Node. Nhập từ `plugin-sdk/test-node-mocks`                                        |
| `createSandboxTestContext`                           | Tạo ngữ cảnh kiểm thử sandbox. Nhập từ `plugin-sdk/test-fixtures`                                                                          |
| `writeSkill`                                         | Ghi fixture skill. Nhập từ `plugin-sdk/test-fixtures`                                                                                      |
| `makeAgentAssistantMessage`                          | Tạo fixture tin nhắn bản ghi agent. Nhập từ `plugin-sdk/test-fixtures`                                                                     |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Kiểm tra và đặt lại fixture sự kiện hệ thống. Nhập từ `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Làm sạch đầu ra terminal cho các kiểm tra. Nhập từ `plugin-sdk/test-fixtures`                                                              |
| `countLines` / `hasBalancedFences`                   | Kiểm tra hình dạng đầu ra chia đoạn. Nhập từ `plugin-sdk/test-fixtures`                                                                    |
| `runProviderCatalog`                                 | Thực thi hook danh mục provider với phụ thuộc kiểm thử                                                                                     |
| `resolveProviderWizardOptions`                       | Phân giải lựa chọn wizard thiết lập provider trong kiểm thử hợp đồng                                                                       |
| `resolveProviderModelPickerEntries`                  | Phân giải các mục bộ chọn mô hình provider trong kiểm thử hợp đồng                                                                         |
| `buildProviderPluginMethodChoice`                    | Tạo id lựa chọn wizard provider cho các kiểm tra                                                                                           |
| `setProviderWizardProvidersResolverForTest`          | Tiêm provider wizard provider cho kiểm thử cô lập                                                                                          |
| `createProviderUsageFetch`                           | Xây dựng fixture tìm nạp mức sử dụng của nhà cung cấp                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Đóng băng và khôi phục bộ hẹn giờ cho các bài kiểm thử nhạy cảm với thời gian. Nhập từ `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Xây dựng prompter trình hướng dẫn thiết lập được mô phỏng                                                                                                     |
| `createRuntimeTaskFlow`                              | Tạo trạng thái TaskFlow thời gian chạy biệt lập                                                                                                  |
| `typedCases`                                         | Giữ nguyên các kiểu literal cho bài kiểm thử theo bảng. Nhập từ `plugin-sdk/test-fixtures`                                                    |

Các bộ kiểm thử hợp đồng của Plugin đi kèm cũng sử dụng các đường dẫn con kiểm thử SDK cho những trình trợ giúp chỉ dùng trong kiểm thử về registry, manifest, public-artifact và fixture runtime. Các bộ kiểm thử chỉ dành cho lõi phụ thuộc vào inventory OpenClaw đi kèm vẫn nằm trong `src/plugins/contracts`.
Giữ các kiểm thử extension mới trên một đường dẫn con SDK tập trung đã được tài liệu hóa như `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures` thay vì nhập trực tiếp barrel tương thích rộng `plugin-sdk/testing`, các tệp `src/**` của repo, hoặc các cầu nối `test/helpers/*` của repo.

### Kiểu

Các đường dẫn con kiểm thử tập trung cũng tái xuất các kiểu hữu ích trong tệp kiểm thử:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Phân giải mục tiêu kiểm thử

Dùng `installCommonResolveTargetErrorCases` để thêm các trường hợp lỗi tiêu chuẩn cho việc phân giải mục tiêu kênh:

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

## Mẫu kiểm thử

### Kiểm thử hợp đồng đăng ký

Các kiểm thử đơn vị truyền một mock `api` viết tay vào `register(api)` không kiểm tra các cổng chấp nhận loader của OpenClaw. Thêm ít nhất một kiểm thử khói có loader hậu thuẫn cho mỗi bề mặt đăng ký mà Plugin của bạn phụ thuộc vào, đặc biệt là hook và các năng lực độc quyền như bộ nhớ.

Loader thật làm đăng ký Plugin thất bại khi thiếu metadata bắt buộc hoặc một Plugin gọi API năng lực mà nó không sở hữu. Ví dụ, `api.registerHook(...)` yêu cầu tên hook, và `api.registerMemoryCapability(...)` yêu cầu manifest Plugin hoặc entry được xuất khai báo `kind: "memory"`.

### Kiểm thử truy cập cấu hình runtime

Ưu tiên mock runtime Plugin dùng chung từ `openclaw/plugin-sdk/channel-test-helpers` khi kiểm thử các Plugin kênh đi kèm. Các mock `runtime.config.loadConfig()` và `runtime.config.writeConfigFile(...)` đã lỗi thời của nó mặc định sẽ ném lỗi để kiểm thử phát hiện việc sử dụng mới các API tương thích. Chỉ ghi đè các mock đó khi kiểm thử đang bao phủ rõ ràng hành vi tương thích legacy.

### Kiểm thử đơn vị một Plugin kênh

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

### Kiểm thử đơn vị một Plugin provider

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

### Mock runtime Plugin

Đối với mã dùng `createPluginRuntimeStore`, hãy mock runtime trong kiểm thử:

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

### Kiểm thử với stub theo từng thực thể

Ưu tiên stub theo từng thực thể hơn là sửa đổi prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Kiểm thử hợp đồng (Plugin trong repo)

Các Plugin đi kèm có kiểm thử hợp đồng xác minh quyền sở hữu đăng ký:

```bash
pnpm test -- src/plugins/contracts/
```

Các kiểm thử này xác nhận:

- Plugin nào đăng ký provider nào
- Plugin nào đăng ký provider giọng nói nào
- Tính đúng đắn của hình dạng đăng ký
- Tuân thủ hợp đồng runtime

### Chạy kiểm thử theo phạm vi

Cho một Plugin cụ thể:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Chỉ cho kiểm thử hợp đồng:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Thực thi lint (Plugin trong repo)

Ba quy tắc được `pnpm check` thực thi cho các Plugin trong repo:

1. **Không nhập root nguyên khối** -- barrel gốc `openclaw/plugin-sdk` bị từ chối
2. **Không nhập trực tiếp `src/`** -- Plugin không thể nhập trực tiếp `../../src/`
3. **Không tự nhập** -- Plugin không thể nhập đường dẫn con `plugin-sdk/<name>` của chính nó

Plugin bên ngoài không chịu các quy tắc lint này, nhưng nên làm theo cùng các mẫu.

## Cấu hình kiểm thử

OpenClaw sử dụng Vitest với ngưỡng coverage V8. Đối với kiểm thử Plugin:

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

Nếu các lần chạy cục bộ gây áp lực bộ nhớ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview) -- quy ước nhập
- [Plugin kênh SDK](/vi/plugins/sdk-channel-plugins) -- giao diện Plugin kênh
- [Plugin provider SDK](/vi/plugins/sdk-provider-plugins) -- hook Plugin provider
- [Xây dựng Plugin](/vi/plugins/building-plugins) -- hướng dẫn bắt đầu
