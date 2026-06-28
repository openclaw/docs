---
read_when:
    - Bạn đang viết kiểm thử cho một Plugin
    - Bạn cần các tiện ích kiểm thử từ SDK của plugin
    - Bạn muốn hiểu về các kiểm thử hợp đồng cho các Plugin đi kèm
sidebarTitle: Testing
summary: Các tiện ích và mẫu kiểm thử cho Plugin OpenClaw
title: Kiểm thử Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Tài liệu tham khảo về tiện ích kiểm thử, mẫu sử dụng và thực thi lint cho các Plugin OpenClaw.

<Tip>
  **Bạn đang tìm ví dụ kiểm thử?** Các hướng dẫn thực hành có ví dụ kiểm thử hoàn chỉnh:
  [Kiểm thử Plugin kênh](/vi/plugins/sdk-channel-plugins#step-6-test) và
  [Kiểm thử Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Tiện ích kiểm thử

Các đường dẫn con của trình trợ giúp kiểm thử này là các điểm vào mã nguồn cục bộ trong repo cho kiểm thử Plugin tích hợp sẵn của OpenClaw. Chúng không phải là các export gói dành cho Plugin bên thứ ba, và có thể import Vitest hoặc các phụ thuộc kiểm thử chỉ dùng trong repo.

**Import mock API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Import hợp đồng runtime agent:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import hợp đồng kênh:** `openclaw/plugin-sdk/channel-contract-testing`

**Import trình trợ giúp kiểm thử kênh:** `openclaw/plugin-sdk/channel-test-helpers`

**Import kiểm thử đích kênh:** `openclaw/plugin-sdk/channel-target-testing`

**Import hợp đồng Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import kiểm thử runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import hợp đồng nhà cung cấp:** `openclaw/plugin-sdk/provider-test-contracts`

**Import mock HTTP nhà cung cấp:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import kiểm thử môi trường/mạng:** `openclaw/plugin-sdk/test-env`

**Import fixture chung:** `openclaw/plugin-sdk/test-fixtures`

**Import mock tích hợp sẵn của Node:** `openclaw/plugin-sdk/test-node-mocks`

Bên trong repo OpenClaw, hãy ưu tiên các đường dẫn con tập trung bên dưới cho kiểm thử Plugin tích hợp sẵn mới. Điểm xuất tổng hợp rộng `openclaw/plugin-sdk/testing` chỉ dành cho tương thích kế thừa.
Các rào chắn của repo từ chối import thực mới từ `plugin-sdk/testing` và `plugin-sdk/test-utils`; các tên đó chỉ còn là bề mặt tương thích đã ngừng khuyến nghị cho kiểm thử bản ghi tương thích.

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

| Nội dung xuất                                        | Mục đích                                                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Tạo mock API plugin tối thiểu cho các kiểm thử đơn vị đăng ký trực tiếp. Nhập từ `plugin-sdk/plugin-test-api`                                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture hợp đồng hồ sơ xác thực dùng chung cho các bộ điều hợp runtime tác tử gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                      |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture hợp đồng chặn gửi phản hồi dùng chung cho các bộ điều hợp runtime tác tử gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                   |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture hợp đồng phân loại fallback dùng chung cho các bộ điều hợp runtime tác tử gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                  |
| `createParameterFreeTool`                            | Tạo fixture lược đồ công cụ động cho kiểm thử hợp đồng runtime gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                                    |
| `expectChannelInboundContextContract`                | Xác nhận hình dạng ngữ cảnh đầu vào của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                                               |
| `installChannelOutboundPayloadContractSuite`         | Cài đặt các trường hợp hợp đồng payload đầu ra của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                                    |
| `createStartAccountContext`                          | Tạo ngữ cảnh vòng đời tài khoản kênh. Nhập từ `plugin-sdk/channel-test-helpers`                                                                           |
| `installChannelActionsContractSuite`                 | Cài đặt các trường hợp hợp đồng hành động tin nhắn kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelSetupContractSuite`                   | Cài đặt các trường hợp hợp đồng thiết lập kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                                           |
| `installChannelStatusContractSuite`                  | Cài đặt các trường hợp hợp đồng trạng thái kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                                          |
| `expectDirectoryIds`                                 | Xác nhận id thư mục kênh từ một hàm liệt kê thư mục. Nhập từ `plugin-sdk/channel-test-helpers`                                                            |
| `assertBundledChannelEntries`                        | Xác nhận các điểm vào kênh được đóng gói công khai hợp đồng công khai kỳ vọng. Nhập từ `plugin-sdk/channel-test-helpers`                                  |
| `formatEnvelopeTimestamp`                            | Định dạng dấu thời gian envelope xác định. Nhập từ `plugin-sdk/channel-test-helpers`                                                                       |
| `expectPairingReplyText`                             | Xác nhận văn bản phản hồi ghép đôi kênh và trích xuất mã của nó. Nhập từ `plugin-sdk/channel-test-helpers`                                                |
| `describePluginRegistrationContract`                 | Cài đặt các kiểm tra hợp đồng đăng ký plugin. Nhập từ `plugin-sdk/plugin-test-contracts`                                                                  |
| `registerSingleProviderPlugin`                       | Đăng ký một plugin nhà cung cấp trong các kiểm thử smoke của loader. Nhập từ `plugin-sdk/plugin-test-runtime`                                             |
| `registerProviderPlugin`                             | Ghi lại mọi loại nhà cung cấp từ một plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                      |
| `registerProviderPlugins`                            | Ghi lại các đăng ký nhà cung cấp trên nhiều plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                              |
| `requireRegisteredProvider`                          | Xác nhận một tập hợp nhà cung cấp chứa một id. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                    |
| `createRuntimeEnv`                                   | Tạo môi trường runtime CLI/plugin được mock. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                     |
| `createPluginRuntimeMock`                            | Tạo bề mặt runtime plugin được mock. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                              |
| `createPluginSetupWizardStatus`                      | Tạo helper trạng thái thiết lập cho plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                 |
| `describeOpenAIProviderRuntimeContract`              | Cài đặt các kiểm tra hợp đồng runtime họ nhà cung cấp. Nhập từ `plugin-sdk/provider-test-contracts`                                                       |
| `expectPassthroughReplayPolicy`                      | Xác nhận chính sách phát lại của nhà cung cấp truyền qua các công cụ và metadata do nhà cung cấp sở hữu. Nhập từ `plugin-sdk/provider-test-contracts`     |
| `runRealtimeSttLiveTest`                             | Chạy kiểm thử live nhà cung cấp STT thời gian thực với fixture âm thanh dùng chung. Nhập từ `plugin-sdk/provider-test-contracts`                           |
| `normalizeTranscriptForMatch`                        | Chuẩn hóa đầu ra bản ghi live trước các xác nhận mờ. Nhập từ `plugin-sdk/provider-test-contracts`                                                         |
| `expectExplicitVideoGenerationCapabilities`          | Xác nhận nhà cung cấp video khai báo rõ các năng lực chế độ tạo. Nhập từ `plugin-sdk/provider-test-contracts`                                              |
| `expectExplicitMusicGenerationCapabilities`          | Xác nhận nhà cung cấp nhạc khai báo rõ các năng lực tạo/chỉnh sửa. Nhập từ `plugin-sdk/provider-test-contracts`                                           |
| `mockSuccessfulDashscopeVideoTask`                   | Cài đặt phản hồi tác vụ video tương thích DashScope thành công. Nhập từ `plugin-sdk/provider-test-contracts`                                              |
| `getProviderHttpMocks`                               | Truy cập các mock HTTP/xác thực Vitest của nhà cung cấp theo cơ chế chọn tham gia. Nhập từ `plugin-sdk/provider-http-test-mocks`                          |
| `installProviderHttpMockCleanup`                     | Đặt lại các mock HTTP/xác thực của nhà cung cấp sau mỗi kiểm thử. Nhập từ `plugin-sdk/provider-http-test-mocks`                                           |
| `installCommonResolveTargetErrorCases`               | Các trường hợp kiểm thử dùng chung cho xử lý lỗi phân giải mục tiêu. Nhập từ `plugin-sdk/channel-target-testing`                                          |
| `shouldAckReaction`                                  | Kiểm tra liệu một kênh có nên thêm phản ứng xác nhận hay không. Nhập từ `plugin-sdk/channel-feedback`                                                     |
| `removeAckReactionAfterReply`                        | Xóa phản ứng xác nhận sau khi gửi phản hồi. Nhập từ `plugin-sdk/channel-feedback`                                                                          |
| `createTestRegistry`                                 | Tạo fixture registry plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                                        |
| `createEmptyPluginRegistry`                          | Tạo fixture registry plugin rỗng. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                                        |
| `setActivePluginRegistry`                            | Cài đặt fixture registry cho kiểm thử runtime plugin. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                     |
| `createRequestCaptureJsonFetch`                      | Ghi lại các yêu cầu fetch JSON trong kiểm thử helper media. Nhập từ `plugin-sdk/test-env`                                                                 |
| `withServer`                                         | Chạy kiểm thử với một máy chủ HTTP cục bộ dùng một lần. Nhập từ `plugin-sdk/test-env`                                                                     |
| `createMockIncomingRequest`                          | Tạo đối tượng yêu cầu HTTP đầu vào tối thiểu. Nhập từ `plugin-sdk/test-env`                                                                                |
| `withFetchPreconnect`                                | Chạy kiểm thử fetch với hook preconnect đã cài đặt. Nhập từ `plugin-sdk/test-env`                                                                         |
| `withEnv` / `withEnvAsync`                           | Tạm thời vá các biến môi trường. Nhập từ `plugin-sdk/test-env`                                                                                            |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tạo fixture kiểm thử hệ thống tệp cô lập. Nhập từ `plugin-sdk/test-env`                                                                                   |
| `createMockServerResponse`                           | Tạo mock phản hồi máy chủ HTTP tối thiểu. Nhập từ `plugin-sdk/test-env`                                                                                   |
| `createCliRuntimeCapture`                            | Ghi lại đầu ra runtime CLI trong kiểm thử. Nhập từ `plugin-sdk/test-fixtures`                                                                             |
| `importFreshModule`                                  | Nhập một module ESM với token truy vấn mới để bỏ qua cache module. Nhập từ `plugin-sdk/test-fixtures`                                                     |
| `bundledPluginRoot` / `bundledPluginFile`            | Phân giải đường dẫn fixture nguồn hoặc dist của plugin được đóng gói. Nhập từ `plugin-sdk/test-fixtures`                                                  |
| `mockNodeBuiltinModule`                              | Cài đặt các mock Vitest hẹp cho module tích hợp sẵn của Node. Nhập từ `plugin-sdk/test-node-mocks`                                                        |
| `createSandboxTestContext`                           | Tạo ngữ cảnh kiểm thử sandbox. Nhập từ `plugin-sdk/test-fixtures`                                                                                         |
| `writeSkill`                                         | Ghi fixture skill. Nhập từ `plugin-sdk/test-fixtures`                                                                                                     |
| `makeAgentAssistantMessage`                          | Tạo fixture tin nhắn bản ghi tác tử. Nhập từ `plugin-sdk/test-fixtures`                                                                                   |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Kiểm tra và đặt lại fixture sự kiện hệ thống. Nhập từ `plugin-sdk/test-fixtures`                                                                          |
| `sanitizeTerminalText`                               | Làm sạch đầu ra terminal cho các xác nhận. Nhập từ `plugin-sdk/test-fixtures`                                                                             |
| `countLines` / `hasBalancedFences`                   | Xác nhận hình dạng đầu ra chia khúc. Nhập từ `plugin-sdk/test-fixtures`                                                                                   |
| `runProviderCatalog`                                 | Thực thi hook danh mục nhà cung cấp với các phụ thuộc kiểm thử                                                                                            |
| `resolveProviderWizardOptions`                       | Phân giải các lựa chọn wizard thiết lập nhà cung cấp trong kiểm thử hợp đồng                                                                              |
| `resolveProviderModelPickerEntries`                  | Phân giải các mục bộ chọn mô hình nhà cung cấp trong kiểm thử hợp đồng                                                                                    |
| `buildProviderPluginMethodChoice`                    | Tạo id lựa chọn wizard nhà cung cấp cho các xác nhận                                                                                                      |
| `setProviderWizardProvidersResolverForTest`          | Chèn các provider của trình hướng dẫn provider cho kiểm thử cô lập                                                                        |
| `createProviderUsageFetch`                           | Tạo các fixture fetch mức sử dụng provider                                                                                                |
| `useFrozenTime` / `useRealTime`                      | Đóng băng và khôi phục bộ hẹn giờ cho các kiểm thử nhạy cảm với thời gian. Import từ `plugin-sdk/test-env`                               |
| `createTestWizardPrompter`                           | Tạo prompter trình hướng dẫn thiết lập được mock                                                                                          |
| `createRuntimeTaskFlow`                              | Tạo trạng thái task-flow thời gian chạy cô lập                                                                                            |
| `typedCases`                                         | Giữ nguyên các kiểu literal cho kiểm thử theo bảng. Import từ `plugin-sdk/test-fixtures`                                                  |

Các bộ kiểm thử hợp đồng plugin đóng gói kèm cũng sử dụng các đường dẫn con kiểm thử SDK cho các helper chỉ dùng trong kiểm thử về registry, manifest, public-artifact và runtime fixture. Các bộ kiểm thử chỉ dành cho core phụ thuộc vào inventory OpenClaw đóng gói kèm vẫn nằm trong `src/plugins/contracts`.
Hãy đặt các kiểm thử extension mới trên một đường dẫn con SDK tập trung đã được tài liệu hóa, chẳng hạn như
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures`, thay vì import trực tiếp barrel tương thích rộng
`plugin-sdk/testing`, các tệp `src/**` của repo, hoặc các cầu nối
`test/helpers/*` của repo.

### Kiểu

Các đường dẫn con kiểm thử tập trung cũng re-export các kiểu hữu ích trong tệp kiểm thử:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Phân giải mục tiêu kiểm thử

Dùng `installCommonResolveTargetErrorCases` để thêm các trường hợp lỗi chuẩn cho
phân giải mục tiêu kênh:

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

Các kiểm thử đơn vị truyền một mock `api` viết tay vào `register(api)` không thực thi
các cổng chấp nhận loader của OpenClaw. Hãy thêm ít nhất một kiểm thử smoke có loader hậu thuẫn
cho từng bề mặt đăng ký mà plugin của bạn phụ thuộc vào, đặc biệt là hook và
các capability độc quyền như memory.

Loader thật sẽ làm đăng ký plugin thất bại khi thiếu metadata bắt buộc hoặc khi
plugin gọi một API capability mà nó không sở hữu. Ví dụ,
`api.registerHook(...)` yêu cầu tên hook, và
`api.registerMemoryCapability(...)` yêu cầu manifest plugin hoặc entry được export
khai báo `kind: "memory"`.

### Kiểm thử quyền truy cập cấu hình runtime

Ưu tiên mock runtime plugin dùng chung từ `openclaw/plugin-sdk/plugin-test-runtime`.
Các mock `runtime.config.loadConfig()` và `runtime.config.writeConfigFile(...)`
đã deprecated của nó mặc định sẽ throw để kiểm thử phát hiện việc sử dụng mới các API tương thích. Chỉ override
các mock đó khi kiểm thử đang bao phủ rõ ràng hành vi tương thích legacy.

### Kiểm thử đơn vị một plugin kênh

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

### Kiểm thử đơn vị một plugin provider

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

### Mock runtime plugin

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

### Kiểm thử bằng stub theo từng instance

Ưu tiên stub theo từng instance thay vì sửa đổi prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Kiểm thử hợp đồng (plugin trong repo)

Các plugin đóng gói kèm có kiểm thử hợp đồng xác minh quyền sở hữu đăng ký:

```bash
pnpm test -- src/plugins/contracts/
```

Các kiểm thử này xác nhận:

- Plugin nào đăng ký provider nào
- Plugin nào đăng ký provider speech nào
- Độ đúng của hình dạng đăng ký
- Tuân thủ hợp đồng runtime

### Chạy kiểm thử theo phạm vi

Đối với một plugin cụ thể:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Chỉ đối với kiểm thử hợp đồng:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Thực thi lint (plugin trong repo)

Ba quy tắc được `pnpm check` thực thi cho các plugin trong repo:

1. **Không import root nguyên khối** -- barrel root `openclaw/plugin-sdk` bị từ chối
2. **Không import trực tiếp `src/`** -- plugin không được import trực tiếp `../../src/`
3. **Không self-import** -- plugin không được import đường dẫn con `plugin-sdk/<name>` của chính nó

Plugin bên ngoài không chịu các quy tắc lint này, nhưng nên làm theo cùng
các mẫu này.

## Cấu hình kiểm thử

OpenClaw dùng Vitest với ngưỡng coverage V8. Đối với kiểm thử plugin:

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

- [Tổng quan SDK](/vi/plugins/sdk-overview) -- quy ước import
- [Plugin kênh SDK](/vi/plugins/sdk-channel-plugins) -- giao diện plugin kênh
- [Plugin provider SDK](/vi/plugins/sdk-provider-plugins) -- hook plugin provider
- [Xây dựng Plugin](/vi/plugins/building-plugins) -- hướng dẫn bắt đầu
