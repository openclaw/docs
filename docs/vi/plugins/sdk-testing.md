---
read_when:
    - Bạn đang viết kiểm thử cho một Plugin
    - Bạn cần các tiện ích kiểm thử từ SDK Plugin
    - Bạn muốn hiểu các kiểm thử hợp đồng cho các Plugin đi kèm
sidebarTitle: Testing
summary: Tiện ích và mẫu kiểm thử cho các Plugin OpenClaw
title: Kiểm thử Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Tài liệu tham khảo về tiện ích kiểm thử, mẫu áp dụng và thực thi lint cho các Plugin của OpenClaw.

<Tip>
  **Bạn đang tìm ví dụ kiểm thử?** Các hướng dẫn cách làm có ví dụ kiểm thử đã thực hiện:
  [Kiểm thử Plugin kênh](/vi/plugins/sdk-channel-plugins#step-6-test) và
  [Kiểm thử Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Tiện ích kiểm thử

Các đường dẫn con trợ giúp kiểm thử này là điểm vào mã nguồn cục bộ của repo cho các kiểm thử Plugin đi kèm của riêng OpenClaw. Chúng không phải là các export gói dành cho Plugin bên thứ ba.

**Lệnh nhập giả lập API Plugin:** `openclaw/plugin-sdk/plugin-test-api`

**Lệnh nhập hợp đồng runtime tác nhân:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Lệnh nhập hợp đồng kênh:** `openclaw/plugin-sdk/channel-contract-testing`

**Lệnh nhập trợ giúp kiểm thử kênh:** `openclaw/plugin-sdk/channel-test-helpers`

**Lệnh nhập kiểm thử đích kênh:** `openclaw/plugin-sdk/channel-target-testing`

**Lệnh nhập hợp đồng Plugin:** `openclaw/plugin-sdk/plugin-test-contracts`

**Lệnh nhập kiểm thử runtime Plugin:** `openclaw/plugin-sdk/plugin-test-runtime`

**Lệnh nhập hợp đồng nhà cung cấp:** `openclaw/plugin-sdk/provider-test-contracts`

**Lệnh nhập giả lập HTTP nhà cung cấp:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Lệnh nhập kiểm thử môi trường/mạng:** `openclaw/plugin-sdk/test-env`

**Lệnh nhập fixture chung:** `openclaw/plugin-sdk/test-fixtures`

**Lệnh nhập giả lập module tích hợp sẵn của Node:** `openclaw/plugin-sdk/test-node-mocks`

Ưu tiên các đường dẫn con tập trung bên dưới cho kiểm thử Plugin mới. Barrel rộng
`openclaw/plugin-sdk/testing` chỉ dành cho tương thích cũ.
Các rào chắn của repo từ chối import thực mới từ `plugin-sdk/testing` và
`plugin-sdk/test-utils`; các tên đó chỉ còn là bề mặt tương thích không khuyến nghị
cho kiểm thử bản ghi tương thích.

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

| Mục xuất                                             | Mục đích                                                                                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Xây dựng giả lập API Plugin tối thiểu cho các kiểm thử đơn vị đăng ký trực tiếp. Nhập từ `plugin-sdk/plugin-test-api`                                                |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Bộ cố định hợp đồng hồ sơ xác thực dùng chung cho các bộ điều hợp môi trường chạy tác nhân native. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                  |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Bộ cố định hợp đồng chặn gửi phản hồi dùng chung cho các bộ điều hợp môi trường chạy tác nhân native. Nhập từ `plugin-sdk/agent-runtime-test-contracts`               |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Bộ cố định hợp đồng phân loại dự phòng dùng chung cho các bộ điều hợp môi trường chạy tác nhân native. Nhập từ `plugin-sdk/agent-runtime-test-contracts`              |
| `createParameterFreeTool`                            | Xây dựng các bộ cố định lược đồ công cụ động cho kiểm thử hợp đồng môi trường chạy native. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                          |
| `expectChannelInboundContextContract`                | Khẳng định hình dạng ngữ cảnh đầu vào của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                                                         |
| `installChannelOutboundPayloadContractSuite`         | Cài đặt các trường hợp hợp đồng tải trọng đầu ra của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                                              |
| `createStartAccountContext`                          | Xây dựng ngữ cảnh vòng đời tài khoản kênh. Nhập từ `plugin-sdk/channel-test-helpers`                                                                                  |
| `installChannelActionsContractSuite`                 | Cài đặt các trường hợp hợp đồng hành động thông điệp kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                                           |
| `installChannelSetupContractSuite`                   | Cài đặt các trường hợp hợp đồng thiết lập kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                                                       |
| `installChannelStatusContractSuite`                  | Cài đặt các trường hợp hợp đồng trạng thái kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                                                      |
| `expectDirectoryIds`                                 | Khẳng định các mã định danh thư mục kênh từ một hàm liệt kê thư mục. Nhập từ `plugin-sdk/channel-test-helpers`                                                       |
| `assertBundledChannelEntries`                        | Khẳng định các điểm vào kênh đi kèm bộc lộ hợp đồng công khai mong đợi. Nhập từ `plugin-sdk/channel-test-helpers`                                                    |
| `formatEnvelopeTimestamp`                            | Định dạng dấu thời gian phong bì có tính xác định. Nhập từ `plugin-sdk/channel-test-helpers`                                                                          |
| `expectPairingReplyText`                             | Khẳng định văn bản phản hồi ghép đôi của kênh và trích xuất mã của nó. Nhập từ `plugin-sdk/channel-test-helpers`                                                     |
| `describePluginRegistrationContract`                 | Cài đặt các kiểm tra hợp đồng đăng ký Plugin. Nhập từ `plugin-sdk/plugin-test-contracts`                                                                              |
| `registerSingleProviderPlugin`                       | Đăng ký một Plugin nhà cung cấp trong các kiểm thử khói của bộ nạp. Nhập từ `plugin-sdk/plugin-test-runtime`                                                         |
| `registerProviderPlugin`                             | Ghi lại mọi loại nhà cung cấp từ một Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                                 |
| `registerProviderPlugins`                            | Ghi lại các lượt đăng ký nhà cung cấp trên nhiều Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                     |
| `requireRegisteredProvider`                          | Khẳng định rằng một tập hợp nhà cung cấp chứa một mã định danh. Nhập từ `plugin-sdk/plugin-test-runtime`                                                              |
| `createRuntimeEnv`                                   | Xây dựng môi trường chạy CLI/Plugin được giả lập. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                            |
| `createPluginSetupWizardStatus`                      | Xây dựng các trình trợ giúp trạng thái thiết lập cho Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime`                                                           |
| `describeOpenAIProviderRuntimeContract`              | Cài đặt các kiểm tra hợp đồng môi trường chạy theo họ nhà cung cấp. Nhập từ `plugin-sdk/provider-test-contracts`                                                      |
| `expectPassthroughReplayPolicy`                      | Khẳng định các chính sách phát lại của nhà cung cấp chuyển tiếp nguyên trạng các công cụ và siêu dữ liệu do nhà cung cấp sở hữu. Nhập từ `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Chạy kiểm thử trực tiếp nhà cung cấp STT thời gian thực với các bộ cố định âm thanh dùng chung. Nhập từ `plugin-sdk/provider-test-contracts`                          |
| `normalizeTranscriptForMatch`                        | Chuẩn hóa đầu ra bản ghi trực tiếp trước các khẳng định mờ. Nhập từ `plugin-sdk/provider-test-contracts`                                                              |
| `expectExplicitVideoGenerationCapabilities`          | Khẳng định các nhà cung cấp video khai báo rõ ràng năng lực chế độ tạo sinh. Nhập từ `plugin-sdk/provider-test-contracts`                                             |
| `expectExplicitMusicGenerationCapabilities`          | Khẳng định các nhà cung cấp nhạc khai báo rõ ràng năng lực tạo sinh/chỉnh sửa. Nhập từ `plugin-sdk/provider-test-contracts`                                           |
| `mockSuccessfulDashscopeVideoTask`                   | Cài đặt phản hồi tác vụ video tương thích DashScope thành công. Nhập từ `plugin-sdk/provider-test-contracts`                                                          |
| `getProviderHttpMocks`                               | Truy cập các giả lập HTTP/xác thực Vitest của nhà cung cấp theo lựa chọn tham gia. Nhập từ `plugin-sdk/provider-http-test-mocks`                                      |
| `installProviderHttpMockCleanup`                     | Đặt lại các giả lập HTTP/xác thực của nhà cung cấp sau mỗi kiểm thử. Nhập từ `plugin-sdk/provider-http-test-mocks`                                                   |
| `installCommonResolveTargetErrorCases`               | Các trường hợp kiểm thử dùng chung cho xử lý lỗi phân giải đích. Nhập từ `plugin-sdk/channel-target-testing`                                                          |
| `shouldAckReaction`                                  | Kiểm tra liệu một kênh có nên thêm phản ứng xác nhận hay không. Nhập từ `plugin-sdk/channel-feedback`                                                                 |
| `removeAckReactionAfterReply`                        | Gỡ phản ứng xác nhận sau khi gửi phản hồi. Nhập từ `plugin-sdk/channel-feedback`                                                                                      |
| `createTestRegistry`                                 | Xây dựng bộ cố định sổ đăng ký Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                                          |
| `createEmptyPluginRegistry`                          | Xây dựng bộ cố định sổ đăng ký Plugin rỗng. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                                          |
| `setActivePluginRegistry`                            | Cài đặt bộ cố định sổ đăng ký cho kiểm thử môi trường chạy Plugin. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                   |
| `createRequestCaptureJsonFetch`                      | Ghi lại các yêu cầu tìm nạp JSON trong kiểm thử trình trợ giúp phương tiện. Nhập từ `plugin-sdk/test-env`                                                            |
| `withServer`                                         | Chạy kiểm thử với một máy chủ HTTP cục bộ dùng một lần. Nhập từ `plugin-sdk/test-env`                                                                                 |
| `createMockIncomingRequest`                          | Xây dựng một đối tượng yêu cầu HTTP đến tối thiểu. Nhập từ `plugin-sdk/test-env`                                                                                      |
| `withFetchPreconnect`                                | Chạy kiểm thử tìm nạp với các điểm móc kết nối trước đã được cài đặt. Nhập từ `plugin-sdk/test-env`                                                                  |
| `withEnv` / `withEnvAsync`                           | Vá tạm thời các biến môi trường. Nhập từ `plugin-sdk/test-env`                                                                                                        |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tạo các bộ cố định kiểm thử hệ thống tệp biệt lập. Nhập từ `plugin-sdk/test-env`                                                                                      |
| `createMockServerResponse`                           | Tạo giả lập phản hồi máy chủ HTTP tối thiểu. Nhập từ `plugin-sdk/test-env`                                                                                            |
| `createCliRuntimeCapture`                            | Ghi lại đầu ra môi trường chạy CLI trong kiểm thử. Nhập từ `plugin-sdk/test-fixtures`                                                                                 |
| `importFreshModule`                                  | Nhập một mô-đun ESM với mã truy vấn mới để bỏ qua bộ nhớ đệm mô-đun. Nhập từ `plugin-sdk/test-fixtures`                                                              |
| `bundledPluginRoot` / `bundledPluginFile`            | Phân giải đường dẫn bộ cố định nguồn hoặc bản phân phối của Plugin đi kèm. Nhập từ `plugin-sdk/test-fixtures`                                                        |
| `mockNodeBuiltinModule`                              | Cài đặt các giả lập Vitest hẹp cho mô-đun tích hợp sẵn của Node. Nhập từ `plugin-sdk/test-node-mocks`                                                                |
| `createSandboxTestContext`                           | Xây dựng ngữ cảnh kiểm thử hộp cát. Nhập từ `plugin-sdk/test-fixtures`                                                                                                |
| `writeSkill`                                         | Ghi các bộ cố định kỹ năng. Nhập từ `plugin-sdk/test-fixtures`                                                                                                        |
| `makeAgentAssistantMessage`                          | Xây dựng các bộ cố định thông điệp bản ghi tác nhân. Nhập từ `plugin-sdk/test-fixtures`                                                                               |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Kiểm tra và đặt lại các bộ cố định sự kiện hệ thống. Nhập từ `plugin-sdk/test-fixtures`                                                                               |
| `sanitizeTerminalText`                               | Làm sạch đầu ra thiết bị đầu cuối cho các khẳng định. Nhập từ `plugin-sdk/test-fixtures`                                                                              |
| `countLines` / `hasBalancedFences`                   | Khẳng định hình dạng đầu ra chia khúc. Nhập từ `plugin-sdk/test-fixtures`                                                                                             |
| `runProviderCatalog`                                 | Thực thi một điểm móc danh mục nhà cung cấp với các phụ thuộc kiểm thử                                                                                                |
| `resolveProviderWizardOptions`                       | Phân giải các lựa chọn trình hướng dẫn thiết lập nhà cung cấp trong kiểm thử hợp đồng                                                                                 |
| `resolveProviderModelPickerEntries`                  | Phân giải các mục bộ chọn mô hình của nhà cung cấp trong kiểm thử hợp đồng                                                                                            |
| `buildProviderPluginMethodChoice`                    | Xây dựng mã định danh lựa chọn trình hướng dẫn nhà cung cấp cho các khẳng định                                                                                        |
| `setProviderWizardProvidersResolverForTest`          | Tiêm bộ phân giải nhà cung cấp của trình hướng dẫn nhà cung cấp cho kiểm thử biệt lập                                                                                 |
| `createProviderUsageFetch`                           | Xây dựng fixture tìm nạp mức sử dụng provider                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Đóng băng và khôi phục bộ hẹn giờ cho các bài kiểm thử nhạy cảm với thời gian. Import từ `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Xây dựng prompter trình hướng dẫn thiết lập dạng mock                                                                                                     |
| `createRuntimeTaskFlow`                              | Tạo trạng thái task-flow thời gian chạy được cô lập                                                                                                  |
| `typedCases`                                         | Giữ nguyên literal type cho các bài kiểm thử theo bảng. Import từ `plugin-sdk/test-fixtures`                                                    |

Các bộ kiểm thử hợp đồng Plugin đi kèm cũng dùng các đường dẫn con kiểm thử SDK cho các helper chỉ dùng trong kiểm thử về registry, manifest, public-artifact và fixture thời gian chạy. Các bộ kiểm thử chỉ dành cho lõi phụ thuộc vào inventory OpenClaw đi kèm vẫn nằm trong `src/plugins/contracts`. Giữ các kiểm thử extension mới trên một đường dẫn con SDK tập trung đã được ghi tài liệu, chẳng hạn như `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env`, hoặc `plugin-sdk/test-fixtures`, thay vì nhập trực tiếp barrel tương thích rộng `plugin-sdk/testing`, các tệp `src/**` của repo, hoặc các cầu nối `test/helpers/*` của repo.

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

## Phân giải mục tiêu kiểm thử

Dùng `installCommonResolveTargetErrorCases` để thêm các trường hợp lỗi chuẩn cho việc phân giải mục tiêu kênh:

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

Các kiểm thử đơn vị truyền một mock `api` viết tay vào `register(api)` không thực thi các cổng chấp nhận của trình nạp OpenClaw. Hãy thêm ít nhất một kiểm thử khói dựa trên trình nạp cho từng bề mặt đăng ký mà Plugin của bạn phụ thuộc, đặc biệt là hook và các capability độc quyền như bộ nhớ.

Trình nạp thật làm đăng ký Plugin thất bại khi thiếu metadata bắt buộc hoặc khi một Plugin gọi API capability mà nó không sở hữu. Ví dụ, `api.registerHook(...)` yêu cầu tên hook, và `api.registerMemoryCapability(...)` yêu cầu manifest Plugin hoặc entry đã xuất khai báo `kind: "memory"`.

### Kiểm thử truy cập cấu hình thời gian chạy

Ưu tiên mock thời gian chạy Plugin dùng chung từ `openclaw/plugin-sdk/channel-test-helpers` khi kiểm thử các Plugin kênh đi kèm. Các mock `runtime.config.loadConfig()` và `runtime.config.writeConfigFile(...)` đã ngừng khuyến nghị của nó mặc định sẽ ném lỗi để kiểm thử bắt được việc sử dụng mới các API tương thích. Chỉ ghi đè các mock đó khi kiểm thử đang bao phủ rõ ràng hành vi tương thích cũ.

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

### Mock thời gian chạy Plugin

Với mã dùng `createPluginRuntimeStore`, hãy mock thời gian chạy trong kiểm thử:

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

### Kiểm thử với stub theo từng instance

Ưu tiên stub theo từng instance thay vì chỉnh sửa prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Kiểm thử hợp đồng (Plugin trong repo)

Các Plugin đi kèm có kiểm thử hợp đồng để xác minh quyền sở hữu đăng ký:

```bash
pnpm test -- src/plugins/contracts/
```

Các kiểm thử này xác nhận:

- Plugin nào đăng ký nhà cung cấp nào
- Plugin nào đăng ký nhà cung cấp giọng nói nào
- Tính đúng đắn của hình dạng đăng ký
- Tuân thủ hợp đồng thời gian chạy

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

1. **Không nhập root nguyên khối** -- barrel root `openclaw/plugin-sdk` bị từ chối
2. **Không nhập trực tiếp `src/`** -- Plugin không được nhập trực tiếp `../../src/`
3. **Không tự nhập** -- Plugin không được nhập đường dẫn con `plugin-sdk/<name>` của chính nó

Plugin bên ngoài không chịu các quy tắc lint này, nhưng nên làm theo cùng các mẫu.

## Cấu hình kiểm thử

OpenClaw dùng Vitest với ngưỡng coverage V8. Đối với kiểm thử Plugin:

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

Nếu chạy cục bộ gây áp lực bộ nhớ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview) -- quy ước nhập
- [Plugin kênh SDK](/vi/plugins/sdk-channel-plugins) -- giao diện Plugin kênh
- [Plugin nhà cung cấp SDK](/vi/plugins/sdk-provider-plugins) -- hook Plugin nhà cung cấp
- [Xây dựng Plugin](/vi/plugins/building-plugins) -- hướng dẫn bắt đầu
