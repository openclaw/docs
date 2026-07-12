---
read_when:
    - Bạn đang viết các bài kiểm thử cho một plugin
    - Bạn cần các tiện ích kiểm thử từ SDK Plugin
    - Bạn muốn tìm hiểu về các bài kiểm thử hợp đồng dành cho các Plugin đi kèm
sidebarTitle: Testing
summary: Các tiện ích và mẫu kiểm thử dành cho Plugin OpenClaw
title: Kiểm thử Plugin
x-i18n:
    generated_at: "2026-07-12T08:13:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Tài liệu tham khảo về các tiện ích kiểm thử, mẫu và quy tắc thực thi lint cho các
Plugin OpenClaw.

<Tip>
  **Bạn đang tìm ví dụ kiểm thử?** Các hướng dẫn thực hành có ví dụ kiểm thử hoàn chỉnh:
  [Kiểm thử Plugin kênh](/vi/plugins/sdk-channel-plugins#step-6-test) và
  [Kiểm thử Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Tiện ích kiểm thử

Các đường dẫn con này là những điểm vào mã nguồn cục bộ trong kho lưu trữ dành cho
các bài kiểm thử Plugin đi kèm của chính OpenClaw. Chúng không phải là các export
`package.json` được phát hành cho Plugin bên thứ ba và có thể nhập Vitest hoặc
các phần phụ thuộc kiểm thử khác chỉ có trong kho lưu trữ.

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

Ưu tiên các đường dẫn con chuyên biệt này cho bài kiểm thử Plugin đi kèm mới. Barrel
`openclaw/plugin-sdk/testing` tổng quát và bí danh `openclaw/plugin-sdk/test-utils`
chỉ dành cho khả năng tương thích cũ: `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) từ chối các lệnh nhập mới
của một trong hai đường dẫn này từ các tệp kiểm thử phần mở rộng, và cả hai chỉ
được giữ lại cho các bài kiểm thử ghi nhận khả năng tương thích.

### Các export có sẵn

| Thành phần xuất                                      | Mục đích                                                                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Tạo bản mô phỏng API Plugin tối thiểu cho các bài kiểm thử đơn vị đăng ký trực tiếp. Nhập từ `plugin-sdk/plugin-test-api`                                                  |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture hợp đồng hồ sơ xác thực dùng chung cho các bộ điều hợp môi trường chạy tác nhân gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                             |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture hợp đồng chặn gửi dùng chung cho các bộ điều hợp môi trường chạy tác nhân gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                                   |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture hợp đồng phân loại dự phòng dùng chung cho các bộ điều hợp môi trường chạy tác nhân gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                         |
| `createParameterFreeTool`                            | Tạo fixture lược đồ công cụ động cho các bài kiểm thử hợp đồng môi trường chạy gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`                                      |
| `expectChannelInboundContextContract`                | Xác nhận cấu trúc ngữ cảnh đầu vào của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                                                                 |
| `installChannelOutboundPayloadContractSuite`         | Cài đặt các trường hợp hợp đồng tải trọng đầu ra của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                                                   |
| `createStartAccountContext`                          | Tạo ngữ cảnh vòng đời tài khoản kênh. Nhập từ `plugin-sdk/channel-test-helpers`                                                                                            |
| `installChannelActionsContractSuite`                 | Cài đặt các trường hợp hợp đồng thao tác tin nhắn kênh dùng chung. Nhập từ `plugin-sdk/channel-test-helpers`                                                                |
| `installChannelSetupContractSuite`                   | Cài đặt các trường hợp hợp đồng thiết lập kênh dùng chung. Nhập từ `plugin-sdk/channel-test-helpers`                                                                       |
| `installChannelStatusContractSuite`                  | Cài đặt các trường hợp hợp đồng trạng thái kênh dùng chung. Nhập từ `plugin-sdk/channel-test-helpers`                                                                      |
| `expectDirectoryIds`                                 | Xác nhận các mã định danh thư mục kênh từ một hàm liệt kê thư mục. Nhập từ `plugin-sdk/channel-test-helpers`                                                               |
| `assertBundledChannelEntries`                        | Xác nhận các điểm vào của kênh đi kèm cung cấp hợp đồng công khai như mong đợi. Nhập từ `plugin-sdk/channel-test-helpers`                                                  |
| `formatEnvelopeTimestamp`                            | Định dạng dấu thời gian phong bì theo cách xác định. Nhập từ `plugin-sdk/channel-test-helpers`                                                                             |
| `expectPairingReplyText`                             | Xác nhận văn bản trả lời ghép nối kênh và trích xuất mã của văn bản đó. Nhập từ `plugin-sdk/channel-test-helpers`                                                          |
| `describePluginRegistrationContract`                 | Cài đặt các bước kiểm tra hợp đồng đăng ký Plugin. Nhập từ `plugin-sdk/plugin-test-contracts`                                                                              |
| `registerSingleProviderPlugin`                       | Đăng ký một Plugin nhà cung cấp trong các bài kiểm thử khói của trình tải. Nhập từ `plugin-sdk/plugin-test-runtime`                                                        |
| `registerProviderPlugin`                             | Thu thập tất cả loại nhà cung cấp từ một Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                                  |
| `registerProviderPlugins`                            | Thu thập các lượt đăng ký nhà cung cấp trên nhiều Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                         |
| `requireRegisteredProvider`                          | Xác nhận rằng một tập hợp nhà cung cấp chứa một mã định danh. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                     |
| `createRuntimeEnv`                                   | Tạo môi trường chạy CLI/Plugin được mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                                     |
| `createPluginRuntimeMock`                            | Tạo bề mặt môi trường chạy Plugin được mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                                  |
| `createPluginSetupWizardStatus`                      | Tạo các trình trợ giúp trạng thái thiết lập cho Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                      |
| `createTestWizardPrompter`                           | Tạo trình nhắc của trình hướng dẫn thiết lập được mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                       |
| `createRuntimeTaskFlow`                              | Tạo trạng thái luồng tác vụ môi trường chạy biệt lập. Nhập từ `plugin-sdk/plugin-test-runtime`                                                                             |
| `runProviderCatalog`                                 | Thực thi hook danh mục nhà cung cấp với các phần phụ thuộc kiểm thử. Nhập từ `plugin-sdk/plugin-test-runtime`                                                              |
| `resolveProviderWizardOptions`                       | Phân giải các lựa chọn của trình hướng dẫn thiết lập nhà cung cấp trong các bài kiểm thử hợp đồng. Nhập từ `plugin-sdk/plugin-test-runtime`                                |
| `resolveProviderModelPickerEntries`                  | Phân giải các mục của bộ chọn mô hình nhà cung cấp trong các bài kiểm thử hợp đồng. Nhập từ `plugin-sdk/plugin-test-runtime`                                               |
| `buildProviderPluginMethodChoice`                    | Tạo mã định danh lựa chọn của trình hướng dẫn nhà cung cấp để xác nhận. Nhập từ `plugin-sdk/plugin-test-runtime`                                                           |
| `setProviderWizardProvidersResolverForTest`          | Chèn các nhà cung cấp của trình hướng dẫn nhà cung cấp cho các bài kiểm thử biệt lập. Nhập từ `plugin-sdk/plugin-test-runtime`                                             |
| `describeOpenAIProviderRuntimeContract`              | Cài đặt các bước kiểm tra hợp đồng môi trường chạy của họ nhà cung cấp. Nhập từ `plugin-sdk/provider-test-contracts`                                                       |
| `expectPassthroughReplayPolicy`                      | Xác nhận các chính sách phát lại của nhà cung cấp chuyển nguyên trạng các công cụ và siêu dữ liệu do nhà cung cấp sở hữu. Nhập từ `plugin-sdk/provider-test-contracts`      |
| `runRealtimeSttLiveTest`                             | Chạy bài kiểm thử trực tiếp nhà cung cấp STT thời gian thực với các fixture âm thanh dùng chung. Nhập từ `plugin-sdk/provider-test-contracts`                               |
| `normalizeTranscriptForMatch`                        | Chuẩn hóa đầu ra bản chép lời trực tiếp trước khi thực hiện các phép xác nhận gần đúng. Nhập từ `plugin-sdk/provider-test-contracts`                                       |
| `expectExplicitVideoGenerationCapabilities`          | Xác nhận các nhà cung cấp video khai báo rõ ràng khả năng của chế độ tạo sinh. Nhập từ `plugin-sdk/provider-test-contracts`                                                |
| `expectExplicitMusicGenerationCapabilities`          | Xác nhận các nhà cung cấp nhạc khai báo rõ ràng khả năng tạo sinh/chỉnh sửa. Nhập từ `plugin-sdk/provider-test-contracts`                                                  |
| `mockSuccessfulDashscopeVideoTask`                   | Cài đặt phản hồi tác vụ video tương thích với DashScope thành công. Nhập từ `plugin-sdk/provider-test-contracts`                                                          |
| `getProviderHttpMocks`                               | Truy cập các bản mô phỏng Vitest HTTP/xác thực của nhà cung cấp theo cơ chế chủ động bật. Nhập từ `plugin-sdk/provider-http-test-mocks`                                    |
| `installProviderHttpMockCleanup`                     | Đặt lại các bản mô phỏng HTTP/xác thực của nhà cung cấp sau mỗi bài kiểm thử. Nhập từ `plugin-sdk/provider-http-test-mocks`                                                |
| `installCommonResolveTargetErrorCases`               | Các trường hợp kiểm thử dùng chung cho việc xử lý lỗi phân giải đích. Nhập từ `plugin-sdk/channel-target-testing`                                                         |
| `shouldAckReaction`                                  | Kiểm tra xem một kênh có nên thêm phản ứng xác nhận hay không. Nhập từ `plugin-sdk/channel-feedback`                                                                      |
| `removeAckReactionAfterReply`                        | Xóa phản ứng xác nhận sau khi gửi câu trả lời. Nhập từ `plugin-sdk/channel-feedback`                                                                                       |
| `createTestRegistry`                                 | Tạo fixture sổ đăng ký Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                                                        |
| `createEmptyPluginRegistry`                          | Tạo fixture sổ đăng ký Plugin trống. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                                                       |
| `setActivePluginRegistry`                            | Cài đặt fixture sổ đăng ký cho các bài kiểm thử môi trường chạy Plugin. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                    |
| `createRequestCaptureJsonFetch`                      | Thu thập các yêu cầu tìm nạp JSON trong các bài kiểm thử trình trợ giúp phương tiện. Nhập từ `plugin-sdk/test-env`                                                         |
| `withServer`                                         | Chạy các bài kiểm thử với một máy chủ HTTP cục bộ dùng một lần. Nhập từ `plugin-sdk/test-env`                                                                              |
| `createMockIncomingRequest`                          | Tạo đối tượng yêu cầu HTTP đến tối thiểu. Nhập từ `plugin-sdk/test-env`                                                                                                    |
| `withFetchPreconnect`                                | Chạy các bài kiểm thử tìm nạp khi đã cài đặt hook kết nối trước. Nhập từ `plugin-sdk/test-env`                                                                             |
| `withEnv` / `withEnvAsync`                           | Tạm thời sửa các biến môi trường. Nhập từ `plugin-sdk/test-env`                                                                                                           |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tạo các fixture kiểm thử hệ thống tệp biệt lập. Nhập từ `plugin-sdk/test-env`                                                                                              |
| `createMockServerResponse`                           | Tạo bản mô phỏng phản hồi máy chủ HTTP tối thiểu. Nhập từ `plugin-sdk/test-env`                                                                                            |
| `createProviderUsageFetch`                           | Tạo các fixture tìm nạp mức sử dụng của nhà cung cấp. Nhập từ `plugin-sdk/test-env`                                                                                        |
| `useFrozenTime` / `useRealTime`                      | Đóng băng và khôi phục bộ hẹn giờ cho các bài kiểm thử nhạy cảm với thời gian. Nhập từ `plugin-sdk/test-env`                                                               |
| `createCliRuntimeCapture`                            | Thu thập đầu ra môi trường chạy CLI trong các bài kiểm thử. Nhập từ `plugin-sdk/test-fixtures`                                                                             |
| `importFreshModule`                                  | Nhập một mô-đun ESM với mã truy vấn mới để bỏ qua bộ nhớ đệm mô-đun. Nhập từ `plugin-sdk/test-fixtures`                                                                    |
| `bundledPluginRoot` / `bundledPluginFile`            | Phân giải đường dẫn fixture mã nguồn hoặc bản phân phối của Plugin đi kèm. Nhập từ `plugin-sdk/test-fixtures`                                                              |
| `mockNodeBuiltinModule`                              | Cài đặt các bản mô phỏng Vitest có phạm vi hẹp cho mô-đun tích hợp sẵn của Node. Nhập từ `plugin-sdk/test-node-mocks`                                                      |
| `createSandboxTestContext`                           | Tạo các ngữ cảnh kiểm thử hộp cát. Nhập từ `plugin-sdk/test-fixtures`                                                                                                      |
| `writeSkill`                                         | Ghi các fixture của skill. Nhập từ `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Tạo các fixture thông báo bản ghi hội thoại của tác tử. Nhập từ `plugin-sdk/test-fixtures`                                                |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Kiểm tra và đặt lại các fixture sự kiện hệ thống. Nhập từ `plugin-sdk/test-fixtures`                                                       |
| `sanitizeTerminalText`                               | Làm sạch đầu ra terminal để dùng trong các phép xác nhận. Nhập từ `plugin-sdk/test-fixtures`                                               |
| `countLines` / `hasBalancedFences`                   | Xác nhận hình dạng đầu ra phân đoạn. Nhập từ `plugin-sdk/test-fixtures`                                                                    |
| `typedCases`                                         | Giữ nguyên các kiểu literal cho kiểm thử dựa trên bảng. Nhập từ `plugin-sdk/test-fixtures`                                                 |

Các bộ kiểm thử hợp đồng cho Plugin đi kèm cũng sử dụng các đường dẫn con kiểm thử SDK này cho các trình trợ giúp fixture dành riêng cho kiểm thử về registry, manifest, tạo phẩm công khai và runtime.
Thay vào đó, các bộ kiểm thử chỉ dành cho lõi phụ thuộc vào danh mục OpenClaw đi kèm vẫn nằm trong
`src/plugins/contracts`.

### Kiểu

Các đường dẫn con kiểm thử chuyên biệt cũng tái xuất các kiểu hữu ích trong tệp kiểm thử:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Phân giải đích kiểm thử

Sử dụng `installCommonResolveTargetErrorCases` để thêm các trường hợp lỗi tiêu chuẩn cho việc phân giải đích của kênh:

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

Các kiểm thử đơn vị truyền mô phỏng `api` viết thủ công vào `register(api)` không
thực thi các cổng chấp nhận của trình tải OpenClaw. Hãy thêm ít nhất một kiểm thử nhanh
dựa trên trình tải cho mỗi bề mặt đăng ký mà Plugin của bạn phụ thuộc, đặc biệt là
các hook và khả năng độc quyền như bộ nhớ.

Trình tải thực tế sẽ không đăng ký được Plugin khi thiếu siêu dữ liệu bắt buộc hoặc
Plugin gọi API khả năng mà nó không sở hữu. Ví dụ:
`api.registerHook(...)` yêu cầu tên hook, còn
`api.registerMemoryCapability(...)` yêu cầu manifest của Plugin hoặc mục nhập được xuất
khai báo `kind: "memory"`.

### Kiểm thử quyền truy cập cấu hình runtime

Ưu tiên mô phỏng runtime Plugin dùng chung từ `openclaw/plugin-sdk/plugin-test-runtime`.
Các mô phỏng `runtime.config.loadConfig()` và `runtime.config.writeConfigFile(...)`
của nó mặc định sẽ phát sinh lỗi để kiểm thử phát hiện việc sử dụng mới các API tương thích
đã lỗi thời. Chỉ ghi đè các mô phỏng đó khi kiểm thử rõ ràng bao phủ hành vi tương thích
cũ.

### Kiểm thử đơn vị Plugin kênh

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

### Kiểm thử đơn vị Plugin nhà cung cấp

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

### Mô phỏng runtime Plugin

Đối với mã sử dụng `createPluginRuntimeStore`, hãy mô phỏng runtime trong các kiểm thử:

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

### Kiểm thử bằng stub theo từng thực thể

Ưu tiên stub theo từng thực thể thay vì sửa đổi prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Kiểm thử hợp đồng (Plugin trong kho mã)

Các Plugin đi kèm có kiểm thử hợp đồng xác minh quyền sở hữu đăng ký:

```bash
pnpm test src/plugins/contracts/
```

Các kiểm thử này xác nhận:

- Plugin nào đăng ký nhà cung cấp nào
- Plugin nào đăng ký nhà cung cấp giọng nói nào
- Tính chính xác của cấu trúc đăng ký
- Tuân thủ hợp đồng runtime

### Chạy kiểm thử theo phạm vi

Đối với một Plugin cụ thể:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Chỉ đối với kiểm thử hợp đồng:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Thực thi lint (Plugin trong kho mã)

`scripts/run-additional-boundary-checks.mjs` chạy một tập hợp kiểm tra ranh giới nhập
`lint:plugins:*` trong CI; mỗi kiểm tra cũng có thể được chạy độc lập cục bộ:

| Lệnh                                                           | Thực thi                                                                                                                           |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Các Plugin đi kèm không được nhập barrel gốc nguyên khối `openclaw/plugin-sdk`.                                                     |
| `pnpm run lint:plugins:no-extension-src-imports`               | Các tệp tiện ích mở rộng dùng trong môi trường sản xuất không được nhập trực tiếp cây `src/**` của kho mã (`../../src/...`).       |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Các tệp kiểm thử tiện ích mở rộng không được nhập `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` hoặc trình trợ giúp kiểm thử chỉ dành cho lõi khác. |

Các Plugin bên ngoài không phải tuân theo các quy tắc lint này, nhưng nên làm theo
cùng các mẫu.

## Cấu hình kiểm thử

OpenClaw sử dụng Vitest 4 với báo cáo độ bao phủ V8 mang tính cung cấp thông tin. Đối với kiểm thử Plugin:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Nếu chạy cục bộ gây áp lực bộ nhớ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Liên quan

- [Tổng quan về SDK](/vi/plugins/sdk-overview) -- quy ước nhập
- [Plugin kênh SDK](/vi/plugins/sdk-channel-plugins) -- giao diện Plugin kênh
- [Plugin nhà cung cấp SDK](/vi/plugins/sdk-provider-plugins) -- các hook của Plugin nhà cung cấp
- [Xây dựng Plugin](/vi/plugins/building-plugins) -- hướng dẫn bắt đầu
