---
read_when:
    - Bạn đang viết kiểm thử cho một plugin
    - Bạn cần các tiện ích kiểm thử từ SDK Plugin
    - Bạn muốn tìm hiểu về các kiểm thử hợp đồng cho những plugin đi kèm
sidebarTitle: Testing
summary: Các tiện ích và mẫu kiểm thử dành cho Plugin OpenClaw
title: Kiểm thử Plugin
x-i18n:
    generated_at: "2026-07-16T14:50:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Tài liệu tham khảo về các tiện ích kiểm thử, mẫu và cơ chế thực thi quy tắc lint cho các
plugin OpenClaw.

<Tip>
  **Đang tìm ví dụ kiểm thử?** Các hướng dẫn thực hành có ví dụ kiểm thử hoàn chỉnh:
  [Kiểm thử plugin kênh](/vi/plugins/sdk-channel-plugins#step-6-test) và
  [Kiểm thử plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Tiện ích kiểm thử

Các đường dẫn con này là những điểm vào mã nguồn cục bộ trong kho lưu trữ dành cho các bài kiểm thử
plugin đi kèm của chính OpenClaw. Chúng không phải là các bản xuất `package.json` được phát hành dành cho
plugin bên thứ ba và có thể nhập Vitest hoặc các phần phụ thuộc kiểm thử khác chỉ có trong kho lưu trữ.

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

Sử dụng các đường dẫn con chuyên biệt này cho các bài kiểm thử plugin đi kèm. Barrel
`openclaw/plugin-sdk/testing` trước đây chỉ dùng cục bộ trong kho lưu trữ, bị loại khỏi các
gói được phát hành và đã bị xóa. Bí danh `openclaw/plugin-sdk/test-utils`
cũ vẫn chỉ dùng cục bộ trong kho lưu trữ; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) từ chối các lệnh nhập mới trong bài kiểm thử tiện ích mở rộng
đối với bí danh đó.

### Các bản xuất hiện có

| Bản xuất                                              | Mục đích                                                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Tạo bản mô phỏng API plugin tối thiểu cho các kiểm thử đơn vị đăng ký trực tiếp. Nhập từ `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture hợp đồng hồ sơ xác thực dùng chung cho các bộ điều hợp runtime tác nhân gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture hợp đồng chặn phân phối dùng chung cho các bộ điều hợp runtime tác nhân gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture hợp đồng phân loại phương án dự phòng dùng chung cho các bộ điều hợp runtime tác nhân gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Tạo các fixture lược đồ công cụ động cho kiểm thử hợp đồng runtime gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Xác nhận hình dạng ngữ cảnh đầu vào của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Cài đặt các trường hợp hợp đồng payload đầu ra của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Tạo các ngữ cảnh vòng đời tài khoản kênh. Nhập từ `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Cài đặt các trường hợp hợp đồng hành động tin nhắn kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Cài đặt các trường hợp hợp đồng thiết lập kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Cài đặt các trường hợp hợp đồng trạng thái kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Xác nhận các ID thư mục kênh từ một hàm liệt kê thư mục. Nhập từ `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Xác nhận các điểm vào của kênh được đóng gói cung cấp hợp đồng công khai dự kiến. Nhập từ `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Định dạng dấu thời gian phong bì theo cách xác định. Nhập từ `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Xác nhận văn bản phản hồi ghép nối kênh và trích xuất mã của văn bản đó. Nhập từ `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Cài đặt các bước kiểm tra hợp đồng đăng ký plugin. Nhập từ `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Đăng ký một plugin nhà cung cấp trong các kiểm thử khói của trình tải. Nhập từ `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Thu thập tất cả loại nhà cung cấp từ một plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Thu thập các lượt đăng ký nhà cung cấp trên nhiều plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Xác nhận một tập hợp nhà cung cấp có chứa một ID. Nhập từ `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Tạo môi trường runtime CLI/plugin mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Tạo bề mặt runtime plugin mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Tạo các trình trợ giúp trạng thái thiết lập cho plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Tạo trình nhắc của trình hướng dẫn thiết lập mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Tạo trạng thái luồng tác vụ runtime biệt lập. Nhập từ `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Thực thi hook danh mục nhà cung cấp với các phần phụ thuộc kiểm thử. Nhập từ `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Phân giải các lựa chọn của trình hướng dẫn thiết lập nhà cung cấp trong kiểm thử hợp đồng. Nhập từ `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Phân giải các mục của bộ chọn mô hình nhà cung cấp trong kiểm thử hợp đồng. Nhập từ `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Tạo các ID lựa chọn của trình hướng dẫn nhà cung cấp để xác nhận. Nhập từ `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Tiêm các nhà cung cấp của trình hướng dẫn nhà cung cấp cho kiểm thử biệt lập. Nhập từ `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Cài đặt các bước kiểm tra hợp đồng runtime của họ nhà cung cấp. Nhập từ `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Xác nhận các chính sách phát lại của nhà cung cấp được truyền qua các công cụ và siêu dữ liệu do nhà cung cấp sở hữu. Nhập từ `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Chạy kiểm thử trực tiếp nhà cung cấp STT thời gian thực với các fixture âm thanh dùng chung. Nhập từ `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Chuẩn hóa đầu ra bản chép lời trực tiếp trước khi xác nhận mờ. Nhập từ `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Xác nhận các nhà cung cấp video khai báo rõ ràng khả năng chế độ tạo. Nhập từ `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Xác nhận các nhà cung cấp nhạc khai báo rõ ràng khả năng tạo/chỉnh sửa. Nhập từ `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Cài đặt một phản hồi tác vụ video tương thích với DashScope thành công. Nhập từ `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Truy cập các bản mô phỏng Vitest HTTP/xác thực nhà cung cấp có cơ chế chọn tham gia. Nhập từ `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Đặt lại các bản mô phỏng HTTP/xác thực nhà cung cấp sau mỗi kiểm thử. Nhập từ `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Các trường hợp kiểm thử dùng chung cho việc xử lý lỗi phân giải đích. Nhập từ `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Kiểm tra xem kênh có nên thêm phản ứng xác nhận hay không. Nhập từ `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Xóa phản ứng xác nhận sau khi phân phối phản hồi. Nhập từ `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Tạo fixture sổ đăng ký plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Tạo fixture sổ đăng ký plugin trống. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Cài đặt fixture sổ đăng ký cho kiểm thử runtime plugin. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Thu thập các yêu cầu tìm nạp JSON trong kiểm thử trình trợ giúp phương tiện. Nhập từ `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Chạy kiểm thử với một máy chủ HTTP cục bộ dùng một lần. Nhập từ `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Tạo một đối tượng yêu cầu HTTP đến tối thiểu. Nhập từ `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Chạy kiểm thử tìm nạp với các hook kết nối trước đã được cài đặt. Nhập từ `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Tạm thời vá các biến môi trường. Nhập từ `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tạo các fixture kiểm thử hệ thống tệp biệt lập. Nhập từ `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Tạo bản mô phỏng phản hồi máy chủ HTTP tối thiểu. Nhập từ `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Tạo các fixture tìm nạp mức sử dụng nhà cung cấp. Nhập từ `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Đóng băng và khôi phục bộ hẹn giờ cho các kiểm thử nhạy cảm với thời gian. Nhập từ `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Thu thập đầu ra runtime CLI trong kiểm thử. Nhập từ `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Nhập một mô-đun ESM với token truy vấn mới để bỏ qua bộ nhớ đệm mô-đun. Nhập từ `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Phân giải các đường dẫn fixture nguồn hoặc bản phân phối của plugin được đóng gói. Nhập từ `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Cài đặt các bản mô phỏng Vitest hẹp cho thành phần tích hợp sẵn của Node. Nhập từ `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Tạo các ngữ cảnh kiểm thử hộp cát. Nhập từ `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Ghi các fixture kỹ năng. Nhập từ `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Tạo các fixture tin nhắn bản chép lời tác nhân. Nhập từ `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Kiểm tra và đặt lại các fixture sự kiện hệ thống. Nhập từ `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Làm sạch đầu ra thiết bị đầu cuối để xác nhận. Nhập từ `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Xác nhận hình dạng đầu ra phân đoạn. Nhập từ `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Giữ nguyên các kiểu literal cho kiểm thử dựa trên bảng. Nhập từ `plugin-sdk/test-fixtures`                                                    |

Các bộ kiểm thử hợp đồng plugin được đóng gói cũng sử dụng những đường dẫn con kiểm thử SDK này cho
các trình trợ giúp fixture sổ đăng ký, tệp kê khai, tạo phẩm công khai và runtime chỉ dành cho kiểm thử.
Các bộ kiểm thử chỉ dành cho lõi phụ thuộc vào kho OpenClaw được đóng gói vẫn nằm trong
`src/plugins/contracts`.

### Kiểu

Các đường dẫn con kiểm thử tập trung cũng tái xuất các kiểu hữu ích trong tệp kiểm thử:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Kiểm thử phân giải đích

Sử dụng `installCommonResolveTargetErrorCases` để thêm các trường hợp lỗi tiêu chuẩn cho
việc phân giải đích của kênh:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logic phân giải đích của kênh
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Thêm các trường hợp kiểm thử dành riêng cho kênh
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Mẫu kiểm thử

### Kiểm thử hợp đồng đăng ký

Các kiểm thử đơn vị truyền một đối tượng mô phỏng `api` được viết thủ công vào `register(api)` không
thực thi các cổng chấp nhận của trình nạp OpenClaw. Hãy thêm ít nhất một
kiểm thử nhanh dựa trên trình nạp cho mỗi bề mặt đăng ký mà plugin của bạn phụ thuộc vào, đặc biệt là
các hook và khả năng độc quyền như bộ nhớ.

Trình nạp thực tế sẽ khiến đăng ký plugin thất bại khi thiếu siêu dữ liệu bắt buộc hoặc
khi plugin gọi một API khả năng mà plugin đó không sở hữu. Ví dụ:
`api.registerHook(...)` yêu cầu tên hook, còn
`api.registerMemoryCapability(...)` yêu cầu manifest plugin hoặc điểm vào
được xuất phải khai báo `kind: "memory"`.

### Kiểm thử quyền truy cập cấu hình thời gian chạy

Ưu tiên đối tượng mô phỏng thời gian chạy plugin dùng chung từ `openclaw/plugin-sdk/plugin-test-runtime`.
Các đối tượng mô phỏng `runtime.config.loadConfig()` và `runtime.config.writeConfigFile(...)`
của nó mặc định sẽ ném lỗi để kiểm thử phát hiện việc sử dụng mới các API tương thích
đã lỗi thời. Chỉ ghi đè các đối tượng mô phỏng đó khi kiểm thử rõ ràng bao quát hành vi
tương thích cũ.

### Kiểm thử đơn vị plugin kênh

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
    // Không làm lộ giá trị token
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Kiểm thử đơn vị plugin nhà cung cấp

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... ngữ cảnh
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... ngữ cảnh
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mô phỏng thời gian chạy plugin

Đối với mã sử dụng `createPluginRuntimeStore`, hãy mô phỏng thời gian chạy trong kiểm thử:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// Trong phần thiết lập kiểm thử
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... các đối tượng mô phỏng khác
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... các không gian tên khác
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Sau các kiểm thử
store.clearRuntime();
```

### Kiểm thử bằng stub theo từng thực thể

Ưu tiên stub theo từng thực thể hơn việc thay đổi prototype:

```typescript
// Nên dùng: stub theo từng thực thể
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Tránh dùng: thay đổi prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Kiểm thử hợp đồng (plugin trong kho mã)

Các plugin được đóng gói có các kiểm thử hợp đồng để xác minh quyền sở hữu đăng ký:

```bash
pnpm test src/plugins/contracts/
```

Các kiểm thử này xác nhận:

- Plugin nào đăng ký nhà cung cấp nào
- Plugin nào đăng ký nhà cung cấp giọng nói nào
- Tính đúng đắn của cấu trúc đăng ký
- Tuân thủ hợp đồng thời gian chạy

### Chạy kiểm thử theo phạm vi

Đối với một plugin cụ thể:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Chỉ đối với kiểm thử hợp đồng:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Thực thi lint (plugin trong kho mã)

`scripts/run-additional-boundary-checks.mjs` chạy một tập hợp các bước kiểm tra ranh giới nhập
`lint:plugins:*` trong CI; mỗi bước cũng có thể được chạy độc lập trên máy cục bộ:

| Lệnh                                                           | Thực thi                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Các plugin được đóng gói không được nhập barrel gốc nguyên khối `openclaw/plugin-sdk`.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Các tệp tiện ích mở rộng dùng trong môi trường sản xuất không được nhập trực tiếp cây `src/**` của kho mã (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Các tệp kiểm thử tiện ích mở rộng không được nhập `plugin-sdk/test-utils` hoặc các trình trợ giúp kiểm thử khác chỉ dành cho lõi. |

Các plugin bên ngoài không phải tuân theo các quy tắc lint này, nhưng nên làm theo
cùng các mẫu.

## Cấu hình kiểm thử

OpenClaw sử dụng Vitest 4 với báo cáo độ bao phủ V8 mang tính thông tin. Đối với kiểm thử plugin:

```bash
# Chạy tất cả kiểm thử
pnpm test

# Chạy các kiểm thử plugin cụ thể
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Chạy với bộ lọc theo tên kiểm thử cụ thể
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Chạy với độ bao phủ
pnpm test:coverage
```

Nếu các lần chạy cục bộ gây áp lực bộ nhớ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Liên quan

- [Tổng quan về SDK](/vi/plugins/sdk-overview) -- quy ước nhập
- [Plugin kênh SDK](/vi/plugins/sdk-channel-plugins) -- giao diện plugin kênh
- [Plugin nhà cung cấp SDK](/vi/plugins/sdk-provider-plugins) -- các hook của plugin nhà cung cấp
- [Xây dựng Plugin](/vi/plugins/building-plugins) -- hướng dẫn bắt đầu
