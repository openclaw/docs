---
read_when:
    - Bạn đang viết các bài kiểm thử cho một Plugin
    - Bạn cần các tiện ích kiểm thử từ Plugin SDK
    - Bạn muốn tìm hiểu các bài kiểm thử hợp đồng cho các Plugin đi kèm
sidebarTitle: Testing
summary: Tiện ích và mẫu hình kiểm thử cho các Plugin OpenClaw
title: Kiểm thử Plugin
x-i18n:
    generated_at: "2026-04-29T23:03:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Tham chiếu về tiện ích kiểm thử, mẫu và thực thi lint cho các plugin OpenClaw.

<Tip>
  **Đang tìm ví dụ kiểm thử?** Các hướng dẫn cách làm có ví dụ kiểm thử hoàn chỉnh:
  [Kiểm thử plugin kênh](/vi/plugins/sdk-channel-plugins#step-6-test) và
  [Kiểm thử plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Tiện ích kiểm thử

**Import mock Plugin API:** `openclaw/plugin-sdk/plugin-test-api`

**Import hợp đồng runtime tác nhân:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import hợp đồng kênh:** `openclaw/plugin-sdk/channel-contract-testing`

**Import helper kiểm thử kênh:** `openclaw/plugin-sdk/channel-test-helpers`

**Import kiểm thử đích kênh:** `openclaw/plugin-sdk/channel-target-testing`

**Import hợp đồng Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import kiểm thử runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import hợp đồng nhà cung cấp:** `openclaw/plugin-sdk/provider-test-contracts`

**Import mock HTTP nhà cung cấp:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import kiểm thử môi trường/mạng:** `openclaw/plugin-sdk/test-env`

**Import fixture chung:** `openclaw/plugin-sdk/test-fixtures`

**Import mock builtin Node:** `openclaw/plugin-sdk/test-node-mocks`

Ưu tiên các đường dẫn con tập trung bên dưới cho các kiểm thử plugin mới. Barrel rộng
`openclaw/plugin-sdk/testing` chỉ dành cho tương thích cũ.
Các rào chắn của repo từ chối import thực mới từ `plugin-sdk/testing` và
`plugin-sdk/test-utils`; các tên đó chỉ còn là bề mặt tương thích đã ngừng khuyến nghị
cho plugin bên ngoài và kiểm thử bản ghi tương thích.

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

| Mục xuất                                             | Mục đích                                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Xây dựng mock API Plugin tối thiểu cho kiểm thử đơn vị đăng ký trực tiếp. Nhập từ `plugin-sdk/plugin-test-api`                          |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture hợp đồng hồ sơ xác thực dùng chung cho bộ điều hợp runtime tác tử gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`        |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture hợp đồng chặn gửi trả lời dùng chung cho bộ điều hợp runtime tác tử gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`      |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture hợp đồng phân loại dự phòng dùng chung cho bộ điều hợp runtime tác tử gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`    |
| `createParameterFreeTool`                            | Xây dựng fixture schema công cụ động cho kiểm thử hợp đồng runtime gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`               |
| `expectChannelInboundContextContract`                | Xác nhận hình dạng ngữ cảnh đầu vào của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                              |
| `installChannelOutboundPayloadContractSuite`         | Cài đặt các trường hợp hợp đồng payload đầu ra của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                  |
| `createStartAccountContext`                          | Xây dựng ngữ cảnh vòng đời tài khoản kênh. Nhập từ `plugin-sdk/channel-test-helpers`                                                     |
| `installChannelActionsContractSuite`                 | Cài đặt các trường hợp hợp đồng hành động tin nhắn kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                |
| `installChannelSetupContractSuite`                   | Cài đặt các trường hợp hợp đồng thiết lập kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                         |
| `installChannelStatusContractSuite`                  | Cài đặt các trường hợp hợp đồng trạng thái kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                        |
| `expectDirectoryIds`                                 | Xác nhận id thư mục kênh từ một hàm liệt kê thư mục. Nhập từ `plugin-sdk/channel-test-helpers`                                          |
| `assertBundledChannelEntries`                        | Xác nhận các điểm vào kênh được đóng gói công khai hợp đồng dự kiến. Nhập từ `plugin-sdk/channel-test-helpers`                          |
| `formatEnvelopeTimestamp`                            | Định dạng dấu thời gian phong bì xác định. Nhập từ `plugin-sdk/channel-test-helpers`                                                     |
| `expectPairingReplyText`                             | Xác nhận văn bản phản hồi ghép đôi kênh và trích xuất mã của nó. Nhập từ `plugin-sdk/channel-test-helpers`                              |
| `describePluginRegistrationContract`                 | Cài đặt các kiểm tra hợp đồng đăng ký Plugin. Nhập từ `plugin-sdk/plugin-test-contracts`                                                 |
| `registerSingleProviderPlugin`                       | Đăng ký một Plugin nhà cung cấp trong kiểm thử khói bộ nạp. Nhập từ `plugin-sdk/plugin-test-runtime`                                    |
| `registerProviderPlugin`                             | Ghi lại mọi loại nhà cung cấp từ một Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                    |
| `registerProviderPlugins`                            | Ghi lại các đăng ký nhà cung cấp trên nhiều Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                             |
| `requireRegisteredProvider`                          | Xác nhận rằng một tập hợp nhà cung cấp chứa một id. Nhập từ `plugin-sdk/plugin-test-runtime`                                             |
| `createRuntimeEnv`                                   | Xây dựng môi trường runtime CLI/Plugin được mock. Nhập từ `plugin-sdk/plugin-test-runtime`                                               |
| `createPluginSetupWizardStatus`                      | Xây dựng helper trạng thái thiết lập cho Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime`                                          |
| `describeOpenAIProviderRuntimeContract`              | Cài đặt các kiểm tra hợp đồng runtime họ nhà cung cấp. Nhập từ `plugin-sdk/provider-test-contracts`                                     |
| `expectPassthroughReplayPolicy`                      | Xác nhận chính sách phát lại của nhà cung cấp chuyển tiếp công cụ và siêu dữ liệu do nhà cung cấp sở hữu. Nhập từ `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Chạy kiểm thử trực tiếp nhà cung cấp STT thời gian thực với fixture âm thanh dùng chung. Nhập từ `plugin-sdk/provider-test-contracts`    |
| `normalizeTranscriptForMatch`                        | Chuẩn hóa đầu ra bản chép lời trực tiếp trước các xác nhận mờ. Nhập từ `plugin-sdk/provider-test-contracts`                             |
| `expectExplicitVideoGenerationCapabilities`          | Xác nhận nhà cung cấp video khai báo rõ khả năng chế độ tạo. Nhập từ `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitMusicGenerationCapabilities`          | Xác nhận nhà cung cấp nhạc khai báo rõ khả năng tạo/chỉnh sửa. Nhập từ `plugin-sdk/provider-test-contracts`                             |
| `mockSuccessfulDashscopeVideoTask`                   | Cài đặt phản hồi tác vụ video tương thích DashScope thành công. Nhập từ `plugin-sdk/provider-test-contracts`                            |
| `getProviderHttpMocks`                               | Truy cập mock Vitest HTTP/xác thực nhà cung cấp có chọn tham gia. Nhập từ `plugin-sdk/provider-http-test-mocks`                         |
| `installProviderHttpMockCleanup`                     | Đặt lại mock HTTP/xác thực nhà cung cấp sau mỗi kiểm thử. Nhập từ `plugin-sdk/provider-http-test-mocks`                                 |
| `installCommonResolveTargetErrorCases`               | Các trường hợp kiểm thử dùng chung cho xử lý lỗi phân giải mục tiêu. Nhập từ `plugin-sdk/channel-target-testing`                        |
| `shouldAckReaction`                                  | Kiểm tra liệu một kênh có nên thêm phản ứng xác nhận hay không. Nhập từ `plugin-sdk/channel-feedback`                                   |
| `removeAckReactionAfterReply`                        | Xóa phản ứng xác nhận sau khi gửi phản hồi. Nhập từ `plugin-sdk/channel-feedback`                                                        |
| `createTestRegistry`                                 | Xây dựng fixture sổ đăng ký Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                |
| `createEmptyPluginRegistry`                          | Xây dựng fixture sổ đăng ký Plugin trống. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`               |
| `setActivePluginRegistry`                            | Cài đặt fixture sổ đăng ký cho kiểm thử runtime Plugin. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Ghi lại yêu cầu fetch JSON trong kiểm thử helper phương tiện. Nhập từ `plugin-sdk/test-env`                                             |
| `withServer`                                         | Chạy kiểm thử với máy chủ HTTP cục bộ dùng một lần. Nhập từ `plugin-sdk/test-env`                                                       |
| `createMockIncomingRequest`                          | Xây dựng đối tượng yêu cầu HTTP đến tối thiểu. Nhập từ `plugin-sdk/test-env`                                                            |
| `withFetchPreconnect`                                | Chạy kiểm thử fetch với hook tiền kết nối đã cài đặt. Nhập từ `plugin-sdk/test-env`                                                     |
| `withEnv` / `withEnvAsync`                           | Tạm thời vá biến môi trường. Nhập từ `plugin-sdk/test-env`                                                                              |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tạo fixture kiểm thử hệ thống tệp cô lập. Nhập từ `plugin-sdk/test-env`                                                                 |
| `createMockServerResponse`                           | Tạo mock phản hồi máy chủ HTTP tối thiểu. Nhập từ `plugin-sdk/test-env`                                                                 |
| `createCliRuntimeCapture`                            | Ghi lại đầu ra runtime CLI trong kiểm thử. Nhập từ `plugin-sdk/test-fixtures`                                                           |
| `importFreshModule`                                  | Nhập một module ESM với token truy vấn mới để bỏ qua bộ nhớ đệm module. Nhập từ `plugin-sdk/test-fixtures`                              |
| `bundledPluginRoot` / `bundledPluginFile`            | Phân giải đường dẫn fixture nguồn hoặc dist của Plugin được đóng gói. Nhập từ `plugin-sdk/test-fixtures`                                |
| `mockNodeBuiltinModule`                              | Cài đặt mock Vitest hẹp cho phần dựng sẵn của Node. Nhập từ `plugin-sdk/test-node-mocks`                                                |
| `createSandboxTestContext`                           | Xây dựng ngữ cảnh kiểm thử sandbox. Nhập từ `plugin-sdk/test-fixtures`                                                                  |
| `writeSkill`                                         | Ghi fixture skill. Nhập từ `plugin-sdk/test-fixtures`                                                                                   |
| `makeAgentAssistantMessage`                          | Xây dựng fixture tin nhắn bản ghi tác tử. Nhập từ `plugin-sdk/test-fixtures`                                                            |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Kiểm tra và đặt lại fixture sự kiện hệ thống. Nhập từ `plugin-sdk/test-fixtures`                                                        |
| `sanitizeTerminalText`                               | Làm sạch đầu ra terminal để xác nhận. Nhập từ `plugin-sdk/test-fixtures`                                                                |
| `countLines` / `hasBalancedFences`                   | Xác nhận hình dạng đầu ra chia đoạn. Nhập từ `plugin-sdk/test-fixtures`                                                                 |
| `runProviderCatalog`                                 | Thực thi hook danh mục nhà cung cấp với phụ thuộc kiểm thử                                                                              |
| `resolveProviderWizardOptions`                       | Phân giải lựa chọn trình hướng dẫn thiết lập nhà cung cấp trong kiểm thử hợp đồng                                                       |
| `resolveProviderModelPickerEntries`                  | Phân giải mục trình chọn mô hình nhà cung cấp trong kiểm thử hợp đồng                                                                   |
| `buildProviderPluginMethodChoice`                    | Xây dựng id lựa chọn trình hướng dẫn nhà cung cấp để xác nhận                                                                           |
| `setProviderWizardProvidersResolverForTest`          | Tiêm nhà cung cấp của trình hướng dẫn nhà cung cấp cho kiểm thử cô lập                                                                  |
| `createProviderUsageFetch`                           | Tạo các fixture truy xuất mức sử dụng của nhà cung cấp                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Đóng băng và khôi phục bộ hẹn giờ cho các kiểm thử nhạy cảm về thời gian. Nhập từ `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Tạo bộ nhắc trình hướng dẫn thiết lập được mô phỏng                                                                                                     |
| `createRuntimeTaskFlow`                              | Tạo trạng thái luồng tác vụ runtime biệt lập                                                                                                  |
| `typedCases`                                         | Giữ nguyên các kiểu literal cho kiểm thử điều khiển bằng bảng. Nhập từ `plugin-sdk/test-fixtures`                                                    |

Các bộ kiểm thử hợp đồng Plugin đi kèm cũng dùng các đường dẫn con kiểm thử SDK cho những helper chỉ dùng trong kiểm thử về registry, manifest, hiện vật công khai và fixture runtime. Các bộ kiểm thử chỉ dành cho lõi phụ thuộc vào kho kiểm kê OpenClaw đi kèm vẫn nằm trong `src/plugins/contracts`. Giữ các kiểm thử Plugin mới trên một đường dẫn con SDK tập trung đã được tài liệu hóa như `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures` thay vì nhập trực tiếp barrel tương thích `plugin-sdk/testing` quá rộng, các tệp `src/**` của repo, hoặc các cầu nối `test/helpers/*` của repo.

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

## Phân giải đích kiểm thử

Dùng `installCommonResolveTargetErrorCases` để thêm các trường hợp lỗi tiêu chuẩn cho phân giải đích kênh:

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

Các kiểm thử đơn vị truyền mock `api` viết tay vào `register(api)` không kiểm tra các cổng chấp nhận loader của OpenClaw. Thêm ít nhất một kiểm thử smoke dựa trên loader cho mỗi bề mặt đăng ký mà Plugin của bạn phụ thuộc vào, đặc biệt là hook và các năng lực độc quyền như bộ nhớ.

Loader thật sẽ làm đăng ký Plugin thất bại khi thiếu siêu dữ liệu bắt buộc hoặc khi Plugin gọi API năng lực mà nó không sở hữu. Ví dụ, `api.registerHook(...)` yêu cầu tên hook, và `api.registerMemoryCapability(...)` yêu cầu manifest Plugin hoặc entry đã xuất khai báo `kind: "memory"`.

### Kiểm thử quyền truy cập cấu hình runtime

Ưu tiên mock runtime Plugin dùng chung từ `openclaw/plugin-sdk/channel-test-helpers` khi kiểm thử các Plugin kênh đi kèm. Các mock đã lỗi thời `runtime.config.loadConfig()` và `runtime.config.writeConfigFile(...)` của nó mặc định sẽ ném lỗi để kiểm thử bắt được việc dùng mới các API tương thích. Chỉ ghi đè các mock đó khi kiểm thử đang bao phủ rõ ràng hành vi tương thích cũ.

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

### Kiểm thử đơn vị một Plugin nhà cung cấp

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

Với mã dùng `createPluginRuntimeStore`, hãy mock runtime trong kiểm thử:

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

### Kiểm thử bằng stub theo từng phiên bản

Ưu tiên stub theo từng phiên bản thay vì đột biến prototype:

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

- Plugin nào đăng ký nhà cung cấp nào
- Plugin nào đăng ký nhà cung cấp giọng nói nào
- Tính đúng đắn của hình dạng đăng ký
- Tuân thủ hợp đồng runtime

### Chạy kiểm thử theo phạm vi

Với một Plugin cụ thể:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Chỉ với kiểm thử hợp đồng:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Thực thi lint (Plugin trong repo)

Ba quy tắc được `pnpm check` thực thi cho các Plugin trong repo:

1. **Không nhập root nguyên khối** -- barrel root `openclaw/plugin-sdk` bị từ chối
2. **Không nhập trực tiếp `src/`** -- Plugin không được nhập trực tiếp `../../src/`
3. **Không tự nhập** -- Plugin không được nhập đường dẫn con `plugin-sdk/<name>` của chính nó

Plugin bên ngoài không chịu các quy tắc lint này, nhưng nên làm theo cùng các mẫu đó.

## Cấu hình kiểm thử

OpenClaw dùng Vitest với ngưỡng coverage V8. Với kiểm thử Plugin:

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
- [Plugin nhà cung cấp SDK](/vi/plugins/sdk-provider-plugins) -- hook Plugin nhà cung cấp
- [Xây dựng Plugin](/vi/plugins/building-plugins) -- hướng dẫn bắt đầu
