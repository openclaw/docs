---
read_when:
    - Bạn đang viết kiểm thử cho một plugin
    - Bạn cần các tiện ích kiểm thử từ SDK Plugin
    - Bạn muốn tìm hiểu về các kiểm thử hợp đồng dành cho Plugin đi kèm
sidebarTitle: Testing
summary: Các tiện ích và mẫu kiểm thử dành cho các plugin OpenClaw
title: Kiểm thử Plugin
x-i18n:
    generated_at: "2026-07-20T04:42:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9c6c050826dae3cd2c794d50b2dd95e20e6533d838161cce037742ee5fdf7e0e
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Tài liệu tham khảo về các tiện ích kiểm thử, mẫu và cơ chế thực thi lint cho các
plugin OpenClaw.

<Tip>
  **Đang tìm ví dụ kiểm thử?** Các hướng dẫn thực hành có kèm ví dụ kiểm thử hoàn chỉnh:
  [Kiểm thử plugin kênh](/vi/plugins/sdk-channel-plugins#step-6-test) và
  [Kiểm thử plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Tiện ích kiểm thử

Các đường dẫn con này là các điểm vào mã nguồn cục bộ trong repo dành cho kiểm thử
các plugin đi kèm của chính OpenClaw. Chúng không phải là các export `package.json` được phát hành cho
plugin bên thứ ba và có thể import Vitest hoặc các phần phụ thuộc kiểm thử khác chỉ có trong repo.

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
import { isLiveTestEnabled } from "openclaw/plugin-sdk/test-live";
import { createRequestCaptureJsonFetch } from "openclaw/plugin-sdk/test-media-understanding";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

Hãy sử dụng các đường dẫn con chuyên biệt này để kiểm thử plugin đi kèm. Barrel
`openclaw/plugin-sdk/testing` trước đây chỉ tồn tại cục bộ trong repo, bị loại khỏi các
gói được phát hành và đã bị xóa. Bí danh `openclaw/plugin-sdk/test-utils`
trước đây cũng bị xóa cùng với nó. `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) duy trì các kiểm thử tiện ích mở rộng trên
các đường dẫn con kiểm thử chuyên biệt nêu trên.

### Các export hiện có

| Nội dung xuất                                          | Mục đích                                                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Tạo API Plugin mô phỏng tối thiểu cho các kiểm thử đơn vị đăng ký trực tiếp. Nhập từ `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Fixture hợp đồng hồ sơ xác thực dùng chung cho các bộ điều hợp runtime agent gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Fixture hợp đồng chặn phân phối dùng chung cho các bộ điều hợp runtime agent gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Fixture hợp đồng phân loại phương án dự phòng dùng chung cho các bộ điều hợp runtime agent gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Tạo các fixture lược đồ công cụ động cho kiểm thử hợp đồng runtime gốc. Nhập từ `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Xác nhận cấu trúc ngữ cảnh đầu vào của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Cài đặt các trường hợp hợp đồng payload đầu ra của kênh. Nhập từ `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Tạo ngữ cảnh vòng đời tài khoản kênh. Nhập từ `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Cài đặt các trường hợp hợp đồng hành động tin nhắn kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Cài đặt các trường hợp hợp đồng thiết lập kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Cài đặt các trường hợp hợp đồng trạng thái kênh chung. Nhập từ `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Xác nhận các ID thư mục kênh từ một hàm liệt kê thư mục. Nhập từ `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Xác nhận các điểm vào của kênh đi kèm cung cấp hợp đồng công khai như mong đợi. Nhập từ `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Định dạng dấu thời gian phong bì theo cách xác định. Nhập từ `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Xác nhận văn bản phản hồi ghép đôi kênh và trích xuất mã của văn bản đó. Nhập từ `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Cài đặt các bước kiểm tra hợp đồng đăng ký Plugin. Nhập từ `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Đăng ký một Plugin nhà cung cấp trong các kiểm thử khói của trình tải. Nhập từ `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Thu thập tất cả loại nhà cung cấp từ một Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Thu thập các lượt đăng ký nhà cung cấp trên nhiều Plugin. Nhập từ `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Xác nhận rằng một tập hợp nhà cung cấp chứa một ID. Nhập từ `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Tạo môi trường runtime CLI/Plugin mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Tạo bề mặt runtime Plugin mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Tạo các trình trợ giúp trạng thái thiết lập cho Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Tạo trình nhắc của trình hướng dẫn thiết lập mô phỏng. Nhập từ `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Tạo trạng thái luồng tác vụ runtime biệt lập. Nhập từ `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Thực thi hook danh mục nhà cung cấp với các phần phụ thuộc kiểm thử. Nhập từ `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Phân giải các lựa chọn của trình hướng dẫn thiết lập nhà cung cấp trong kiểm thử hợp đồng. Nhập từ `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Phân giải các mục của bộ chọn mô hình nhà cung cấp trong kiểm thử hợp đồng. Nhập từ `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Tạo ID lựa chọn của trình hướng dẫn nhà cung cấp để xác nhận. Nhập từ `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Tiêm các nhà cung cấp của trình hướng dẫn nhà cung cấp cho kiểm thử biệt lập. Nhập từ `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Cài đặt các bước kiểm tra hợp đồng runtime của họ nhà cung cấp. Nhập từ `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Xác nhận các chính sách phát lại của nhà cung cấp được chuyển tiếp qua các công cụ và siêu dữ liệu do nhà cung cấp sở hữu. Nhập từ `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Chạy kiểm thử trực tiếp nhà cung cấp STT thời gian thực với các fixture âm thanh dùng chung. Nhập từ `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Chuẩn hóa đầu ra bản chép lời trực tiếp trước khi xác nhận gần đúng. Nhập từ `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Xác nhận các nhà cung cấp video khai báo rõ ràng khả năng chế độ tạo. Nhập từ `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Xác nhận các nhà cung cấp nhạc khai báo rõ ràng khả năng tạo/chỉnh sửa. Nhập từ `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Cài đặt phản hồi tác vụ video tương thích với DashScope thành công. Nhập từ `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Truy cập các mock Vitest HTTP/xác thực nhà cung cấp cần chủ động bật. Nhập từ `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Đặt lại các mock HTTP/xác thực nhà cung cấp sau mỗi kiểm thử. Nhập từ `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Các trường hợp kiểm thử dùng chung cho việc xử lý lỗi phân giải đích. Nhập từ `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Kiểm tra xem một kênh có nên thêm phản ứng xác nhận hay không. Nhập từ `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Xóa phản ứng xác nhận sau khi phân phối phản hồi. Nhập từ `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Tạo fixture registry Plugin kênh. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Tạo fixture registry Plugin trống. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Cài đặt fixture registry cho các kiểm thử runtime Plugin. Nhập từ `plugin-sdk/plugin-test-runtime` hoặc `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Thu thập các yêu cầu tìm nạp JSON trong kiểm thử trình trợ giúp phương tiện. Nhập từ `plugin-sdk/test-media-understanding`                                     |
| `isLiveTestEnabled`                                  | Kiểm soát các kiểm thử nhà cung cấp trực tiếp cần chủ động bật. Nhập từ `plugin-sdk/test-live`                                                                      |
| `collectProviderApiKeys`                             | Phát hiện thông tin xác thực cho các kiểm thử nhà cung cấp trực tiếp. Nhập từ `plugin-sdk/test-live-auth`                                                    |
| `parseProviderModelMap`                              | Phân tích các giá trị ghi đè mô hình kiểm thử trực tiếp nhạc/video. Nhập từ `plugin-sdk/test-media-generation`                                              |
| `withServer`                                         | Chạy kiểm thử dựa trên máy chủ HTTP cục bộ dùng một lần. Nhập từ `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Tạo đối tượng yêu cầu HTTP đến tối thiểu. Nhập từ `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Chạy kiểm thử tìm nạp với các hook kết nối trước đã được cài đặt. Nhập từ `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Tạm thời vá các biến môi trường. Nhập từ `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Tạo các fixture kiểm thử hệ thống tệp biệt lập. Nhập từ `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Tạo mock phản hồi máy chủ HTTP tối thiểu. Nhập từ `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Tạo các fixture tìm nạp mức sử dụng nhà cung cấp. Nhập từ `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Đóng băng và khôi phục bộ hẹn giờ cho các kiểm thử nhạy cảm với thời gian. Nhập từ `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Thu thập đầu ra runtime CLI trong các kiểm thử. Nhập từ `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Nhập mô-đun ESM bằng token truy vấn mới để bỏ qua bộ nhớ đệm mô-đun. Nhập từ `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Phân giải các đường dẫn fixture nguồn hoặc bản phân phối của Plugin đi kèm. Nhập từ `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Cài đặt các mock Vitest hẹp cho thành phần tích hợp sẵn của Node. Nhập từ `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Tạo ngữ cảnh kiểm thử hộp cát. Nhập từ `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Ghi các fixture Skills. Nhập từ `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Tạo các fixture tin nhắn bản chép lời agent. Nhập từ `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Kiểm tra và đặt lại các fixture sự kiện hệ thống. Nhập từ `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Làm sạch đầu ra thiết bị đầu cuối để xác nhận. Nhập từ `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Xác nhận cấu trúc đầu ra của quá trình phân đoạn. Nhập từ `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Giữ nguyên các kiểu literal cho các kiểm thử dựa trên bảng. Nhập từ `plugin-sdk/test-fixtures`                                                    |

Các bộ kiểm thử hợp đồng Plugin đi kèm cũng sử dụng các đường dẫn con kiểm thử SDK này cho
các trình trợ giúp fixture chỉ dành cho kiểm thử về registry, manifest, artifact công khai và runtime.
Các bộ kiểm thử chỉ dành cho lõi phụ thuộc vào danh mục OpenClaw đi kèm vẫn nằm trong
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

## Kiểm thử phân giải đích

Sử dụng `installCommonResolveTargetErrorCases` để thêm các trường hợp lỗi tiêu chuẩn cho
việc phân giải đích của kênh:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("phân giải đích my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logic phân giải đích của kênh
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Thêm các trường hợp kiểm thử dành riêng cho kênh
  it("nên phân giải các đích @username", () => {
    // ...
  });
});
```

## Mẫu kiểm thử

### Kiểm thử hợp đồng đăng ký

Các kiểm thử đơn vị truyền mock `api` viết thủ công vào `register(api)` không
thực thi các cổng chấp nhận của trình tải OpenClaw. Hãy thêm ít nhất một
kiểm thử khói dựa trên trình tải cho mỗi bề mặt đăng ký mà Plugin của bạn phụ thuộc vào, đặc biệt là
các hook và khả năng độc quyền như bộ nhớ.

Trình tải thực tế sẽ làm đăng ký Plugin thất bại khi thiếu siêu dữ liệu bắt buộc hoặc
Plugin gọi API khả năng mà nó không sở hữu. Ví dụ:
`api.registerHook(...)` yêu cầu tên hook, và
`api.registerMemoryCapability(...)` yêu cầu manifest Plugin hoặc mục nhập
được xuất phải khai báo `kind: "memory"`.

### Kiểm thử truy cập cấu hình runtime

Ưu tiên mock runtime Plugin dùng chung từ
`openclaw/plugin-sdk/plugin-test-runtime`. Các trình trợ giúp cấu hình runtime của nó mô hình hóa
API snapshot và API thay đổi hiện tại.

### Kiểm thử đơn vị Plugin kênh

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Plugin my-channel", () => {
  it("nên phân giải tài khoản từ cấu hình", () => {
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

  it("nên kiểm tra tài khoản mà không hiện thực hóa bí mật", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Không để lộ giá trị token
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Kiểm thử đơn vị Plugin nhà cung cấp

```typescript
import { describe, it, expect } from "vitest";

describe("Plugin my-provider", () => {
  it("nên phân giải các mô hình động", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... ngữ cảnh
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("nên trả về danh mục khi có khóa API", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... ngữ cảnh
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Giả lập runtime Plugin

Đối với mã sử dụng `createPluginRuntimeStore`, hãy giả lập runtime trong các kiểm thử:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "runtime kiểm thử chưa được đặt",
});

// Trong quá trình thiết lập kiểm thử
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... các mock khác
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... các namespace khác
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Sau các kiểm thử
store.clearRuntime();
```

### Kiểm thử bằng stub theo từng thực thể

Ưu tiên stub theo từng thực thể thay vì thay đổi prototype:

```typescript
// Nên dùng: stub theo từng thực thể
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Tránh: thay đổi prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Kiểm thử hợp đồng (Plugin trong kho mã)

Các Plugin đi kèm có kiểm thử hợp đồng xác minh quyền sở hữu đăng ký:

```bash
pnpm test src/plugins/contracts/
```

Các kiểm thử này xác nhận:

- Plugin nào đăng ký những nhà cung cấp nào
- Plugin nào đăng ký những nhà cung cấp giọng nói nào
- Tính đúng đắn của cấu trúc đăng ký
- Mức độ tuân thủ hợp đồng runtime

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

`scripts/run-additional-boundary-checks.mjs` chạy một tập hợp các bước kiểm tra ranh giới import
`lint:plugins:*` trong CI; mỗi bước cũng có thể được chạy độc lập trên máy cục bộ:

| Lệnh                                                        | Thực thi                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Các Plugin đi kèm không được import barrel gốc nguyên khối `openclaw/plugin-sdk`.              |
| `pnpm run lint:plugins:no-extension-src-imports`               | Các tệp phần mở rộng sản xuất không được import trực tiếp cây `src/**` của kho mã (`../../src/...`).  |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Các tệp kiểm thử phần mở rộng không được import các bí danh kiểm thử SDK đã bị loại bỏ hoặc những trình trợ giúp kiểm thử chỉ dành cho lõi khác. |

Các Plugin bên ngoài không chịu sự điều chỉnh của các quy tắc lint này, nhưng nên tuân theo
cùng các mẫu.

## Cấu hình kiểm thử

OpenClaw sử dụng Vitest 4 với báo cáo độ bao phủ V8 mang tính thông tin. Đối với kiểm thử Plugin:

```bash
# Chạy tất cả kiểm thử
pnpm test

# Chạy kiểm thử Plugin cụ thể
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Chạy với bộ lọc tên kiểm thử cụ thể
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Chạy với độ bao phủ
pnpm test:coverage
```

Nếu việc chạy cục bộ gây áp lực bộ nhớ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview) -- quy ước import
- [Plugin kênh SDK](/vi/plugins/sdk-channel-plugins) -- giao diện Plugin kênh
- [Plugin nhà cung cấp SDK](/vi/plugins/sdk-provider-plugins) -- hook Plugin nhà cung cấp
- [Xây dựng Plugin](/vi/plugins/building-plugins) -- hướng dẫn bắt đầu
