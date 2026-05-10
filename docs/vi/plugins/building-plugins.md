---
read_when:
    - Bạn muốn tạo một Plugin OpenClaw mới
    - Bạn cần hướng dẫn bắt đầu nhanh để phát triển Plugin
    - Bạn đang thêm một kênh, nhà cung cấp, công cụ hoặc khả năng khác vào OpenClaw
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-05-10T19:41:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 320ea03395cd702e62831e3b6bb3e44443b4a00701f3e6d35d7c9e556e3bb258
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins mở rộng OpenClaw với các năng lực mới: kênh, nhà cung cấp mô hình,
giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu nội dung phương tiện, tạo hình ảnh,
tạo video, truy xuất web, tìm kiếm web, công cụ tác nhân, hoặc bất kỳ
sự kết hợp nào.

Bạn không cần thêm Plugin của mình vào kho lưu trữ OpenClaw. Hãy phát hành lên
[ClawHub](/vi/clawhub) và người dùng cài đặt bằng
`openclaw plugins install clawhub:<package-name>`. Các đặc tả gói trần vẫn
cài đặt từ npm trong giai đoạn chuyển đổi ra mắt.

## Điều kiện tiên quyết

- Node >= 22 và một trình quản lý gói (npm hoặc pnpm)
- Quen thuộc với TypeScript (ESM)
- Đối với Plugin trong kho: đã clone kho lưu trữ và chạy xong `pnpm install`. Phát triển Plugin
  từ checkout mã nguồn chỉ dùng pnpm vì OpenClaw tải các Plugin được đóng gói
  từ các gói workspace `extensions/*`.

## Loại Plugin nào?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Kết nối OpenClaw với một nền tảng nhắn tin (Discord, IRC, v.v.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Thêm một nhà cung cấp mô hình (LLM, proxy hoặc endpoint tùy chỉnh)
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Ánh xạ một CLI AI cục bộ vào trình chạy dự phòng văn bản của OpenClaw
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/vi/plugins/hooks">
    Đăng ký công cụ tác nhân, hook sự kiện hoặc dịch vụ - tiếp tục bên dưới
  </Card>
</CardGroup>

Đối với một Plugin kênh không được bảo đảm là đã cài đặt khi chạy onboarding/thiết lập,
hãy dùng `createOptionalChannelSetupSurface(...)` từ
`openclaw/plugin-sdk/channel-setup`. Hàm này tạo ra một cặp adapter thiết lập + wizard
thông báo yêu cầu cài đặt và đóng an toàn khi ghi cấu hình thật
cho đến khi Plugin được cài đặt.

## Bắt đầu nhanh: Plugin công cụ

Hướng dẫn này tạo một Plugin tối thiểu để đăng ký một công cụ tác nhân. Plugin kênh
và Plugin nhà cung cấp có các hướng dẫn riêng được liên kết ở trên.

<Steps>
  <Step title="Create the package and manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Mọi Plugin đều cần một manifest, ngay cả khi không có cấu hình. Các công cụ được đăng ký lúc chạy
    phải được liệt kê trong `contracts.tools` để OpenClaw có thể phát hiện Plugin sở hữu
    mà không cần tải mọi runtime Plugin. Plugin cũng nên khai báo
    `activation.onStartup` một cách có chủ đích. Ví dụ này đặt thành `true`. Xem
    [Manifest](/vi/plugins/manifest) để biết schema đầy đủ. Các đoạn mẫu phát hành ClawHub chuẩn
    nằm trong `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Write the entry point">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` dành cho Plugin không phải kênh. Đối với kênh, hãy dùng
    `defineChannelPluginEntry` - xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).
    Để biết đầy đủ tùy chọn entry point, xem [Entry point](/vi/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Plugin bên ngoài:** xác thực và phát hành bằng ClawHub, sau đó cài đặt:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Các đặc tả gói trần như `@myorg/openclaw-my-plugin` cài đặt từ npm trong
    giai đoạn chuyển đổi ra mắt. Dùng `clawhub:` khi bạn muốn phân giải qua ClawHub.

    **Plugin trong kho:** đặt dưới cây workspace Plugin được đóng gói - sẽ được tự động phát hiện.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Năng lực của Plugin

Một Plugin duy nhất có thể đăng ký bất kỳ số lượng năng lực nào thông qua đối tượng `api`:

| Năng lực               | Phương thức đăng ký                              | Hướng dẫn chi tiết                                                              |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Suy luận văn bản (LLM) | `api.registerProvider(...)`                      | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)                            |
| Backend suy luận CLI   | `api.registerCliBackend(...)`                    | [Plugin Backend CLI](/vi/plugins/cli-backend-plugins)                              |
| Kênh / nhắn tin        | `api.registerChannel(...)`                       | [Plugin kênh](/vi/plugins/sdk-channel-plugins)                                     |
| Giọng nói (TTS/STT)    | `api.registerSpeechProvider(...)`                | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Phiên âm thời gian thực | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Thoại thời gian thực   | `api.registerRealtimeVoiceProvider(...)`         | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Hiểu nội dung phương tiện | `api.registerMediaUnderstandingProvider(...)` | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo hình ảnh           | `api.registerImageGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo nhạc               | `api.registerMusicGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo video              | `api.registerVideoGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Truy xuất web          | `api.registerWebFetchProvider(...)`              | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tìm kiếm web           | `api.registerWebSearchProvider(...)`             | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware kết quả công cụ | `api.registerAgentToolResultMiddleware(...)` | [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api)                         |
| Công cụ tác nhân       | `api.registerTool(...)`                          | Bên dưới                                                                        |
| Lệnh tùy chỉnh         | `api.registerCommand(...)`                       | [Entry point](/vi/plugins/sdk-entrypoints)                                         |
| Hook Plugin            | `api.on(...)`                                    | [Hook Plugin](/vi/plugins/hooks)                                                   |
| Hook sự kiện nội bộ    | `api.registerHook(...)`                          | [Entry point](/vi/plugins/sdk-entrypoints)                                         |
| Tuyến HTTP             | `api.registerHttpRoute(...)`                     | [Nội bộ](/vi/plugins/architecture-internals#gateway-http-routes)                   |
| Lệnh con CLI           | `api.registerCli(...)`                           | [Entry point](/vi/plugins/sdk-entrypoints)                                         |

Để biết API đăng ký đầy đủ, xem [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api).

Plugin được đóng gói có thể dùng `api.registerAgentToolResultMiddleware(...)` khi chúng
cần ghi lại kết quả công cụ bất đồng bộ trước khi mô hình nhìn thấy đầu ra. Khai báo
các runtime mục tiêu trong `contracts.agentToolResultMiddleware`, ví dụ
`["pi", "codex"]`. Đây là một seam đáng tin cậy dành cho Plugin được đóng gói; các
Plugin bên ngoài nên ưu tiên hook Plugin OpenClaw thông thường trừ khi OpenClaw có thêm
chính sách tin cậy rõ ràng cho năng lực này.

Nếu Plugin của bạn đăng ký các phương thức RPC Gateway tùy chỉnh, hãy giữ chúng trên một
tiền tố riêng của Plugin. Các namespace quản trị lõi (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn phân giải thành
`operator.admin`, ngay cả khi một Plugin yêu cầu phạm vi hẹp hơn.

Các ngữ nghĩa bảo vệ hook cần ghi nhớ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` được xử lý như không có quyết định.
- `before_tool_call`: `{ requireApproval: true }` tạm dừng thực thi tác nhân và nhắc người dùng phê duyệt thông qua lớp phủ phê duyệt exec, nút Telegram, tương tác Discord, hoặc lệnh `/approve` trên bất kỳ kênh nào.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `before_install`: `{ block: false }` được xử lý như không có quyết định.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` được xử lý như không có quyết định.
- `message_received`: ưu tiên trường có kiểu `threadId` khi bạn cần định tuyến luồng/chủ đề đi vào. Giữ `metadata` cho các thông tin bổ sung riêng theo kênh.
- `message_sending`: ưu tiên các trường định tuyến có kiểu `replyToId` / `threadId` thay vì các khóa metadata riêng theo kênh.

Lệnh `/approve` xử lý cả phê duyệt exec và phê duyệt Plugin với dự phòng có giới hạn: khi không tìm thấy id phê duyệt exec, OpenClaw thử lại cùng id đó qua phê duyệt Plugin. Chuyển tiếp phê duyệt Plugin có thể được cấu hình độc lập thông qua `approvals.plugin` trong cấu hình.

Nếu hệ thống phê duyệt tùy chỉnh cần phát hiện cùng trường hợp dự phòng có giới hạn đó,
hãy ưu tiên `isApprovalNotFoundError` từ `openclaw/plugin-sdk/error-runtime`
thay vì tự khớp chuỗi hết hạn phê duyệt thủ công.

Xem [Hook Plugin](/vi/plugins/hooks) để biết ví dụ và tài liệu tham chiếu hook.

## Đăng ký công cụ tác nhân

Công cụ là các hàm có kiểu mà LLM có thể gọi. Chúng có thể là bắt buộc (luôn
có sẵn) hoặc tùy chọn (người dùng chọn tham gia):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Các factory công cụ nhận một đối tượng ngữ cảnh do runtime cung cấp. Dùng
`ctx.activeModel` khi một công cụ cần ghi log, hiển thị, hoặc thích ứng với mô
hình đang hoạt động cho lượt hiện tại. Đối tượng này có thể bao gồm `provider`,
`modelId`, và `modelRef`. Hãy xem nó là metadata runtime mang tính thông tin,
không phải là ranh giới bảo mật chống lại toán tử cục bộ, mã plugin đã cài đặt,
hoặc runtime OpenClaw đã bị sửa đổi. Với các công cụ cục bộ nhạy cảm, hãy giữ
cơ chế plugin hoặc toán tử chọn tham gia rõ ràng và đóng an toàn khi metadata mô
hình đang hoạt động bị thiếu hoặc không phù hợp.

Mọi công cụ được đăng ký bằng `api.registerTool(...)` cũng phải được khai báo
trong manifest plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw ghi nhận và lưu vào bộ nhớ đệm descriptor đã xác thực từ công cụ đã
đăng ký, nên plugin không lặp lại dữ liệu `description` hoặc schema trong
manifest. Hợp đồng manifest chỉ khai báo quyền sở hữu và khả năng khám phá; khi
thực thi vẫn gọi implementation công cụ đã đăng ký đang chạy.
Đặt `toolMetadata.<tool>.optional: true` cho các công cụ được đăng ký bằng
`api.registerTool(..., { optional: true })` để OpenClaw có thể tránh tải runtime
plugin đó cho đến khi công cụ được allowlist rõ ràng.

Người dùng bật các công cụ tùy chọn trong cấu hình:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tên công cụ không được xung đột với công cụ lõi (các xung đột sẽ bị bỏ qua)
- Công cụ có đối tượng đăng ký sai định dạng, bao gồm thiếu `parameters`, sẽ bị bỏ qua và được báo cáo trong chẩn đoán plugin thay vì làm hỏng các lần chạy agent
- Dùng `optional: true` cho các công cụ có hiệu ứng phụ hoặc yêu cầu binary bổ sung
- Người dùng có thể bật tất cả công cụ từ một plugin bằng cách thêm id plugin vào `tools.allow`

## Đăng ký lệnh CLI

Plugin có thể thêm các nhóm lệnh gốc `openclaw` bằng `api.registerCli`. Cung
cấp `descriptors` cho mọi gốc lệnh cấp cao nhất để OpenClaw có thể hiển thị và
định tuyến lệnh mà không cần tải sẵn mọi runtime plugin.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Sau khi cài đặt, hãy xác minh đăng ký runtime và thực thi lệnh:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Quy ước import

Luôn import từ các đường dẫn `openclaw/plugin-sdk/<subpath>` tập trung:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Để xem tham chiếu subpath đầy đủ, xem [Tổng quan SDK](/vi/plugins/sdk-overview).

Trong plugin của bạn, dùng các file barrel cục bộ (`api.ts`, `runtime-api.ts`)
cho import nội bộ - không bao giờ import chính plugin của bạn qua đường dẫn SDK
của nó.

Đối với plugin nhà cung cấp, hãy giữ các helper riêng cho nhà cung cấp trong
các barrel gốc package đó trừ khi seam thật sự mang tính chung. Các ví dụ được
bundled hiện tại:

- Anthropic: wrapper stream Claude và helper `service_tier` / beta
- OpenAI: builder nhà cung cấp, helper mô hình mặc định, nhà cung cấp realtime
- OpenRouter: builder nhà cung cấp cùng helper onboarding/cấu hình

Nếu một helper chỉ hữu ích bên trong một package nhà cung cấp bundled, hãy giữ
nó trên seam gốc package đó thay vì đưa nó vào `openclaw/plugin-sdk/*`.

Một số seam helper `openclaw/plugin-sdk/<bundled-id>` được tạo tự động vẫn tồn
tại để bảo trì bundled-plugin khi chúng theo dõi usage của owner. Hãy xem chúng
là các bề mặt được dành riêng, không phải mẫu mặc định cho plugin bên thứ ba
mới.

## Checklist trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Manifest **openclaw.plugin.json** hiện diện và hợp lệ</Check>
<Check>Entry point dùng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Mọi import dùng đường dẫn `plugin-sdk/<subpath>` tập trung</Check>
<Check>Import nội bộ dùng module cục bộ, không tự import qua SDK</Check>
<Check>Test đạt (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` đạt (plugin trong repo)</Check>

## Kiểm thử bản phát hành beta

1. Theo dõi các tag phát hành GitHub trên [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) và đăng ký qua `Watch` > `Releases`. Tag beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể bật thông báo cho tài khoản X chính thức của OpenClaw [@openclaw](https://x.com/openclaw) để nhận thông báo phát hành.
2. Kiểm thử plugin của bạn với tag beta ngay khi nó xuất hiện. Khoảng thời gian trước bản stable thường chỉ vài giờ.
3. Đăng trong thread plugin của bạn trong kênh Discord `plugin-forum` sau khi kiểm thử, với `all good` hoặc nội dung đã hỏng. Nếu bạn chưa có thread, hãy tạo một thread.
4. Nếu có gì đó hỏng, hãy mở hoặc cập nhật một issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Đặt liên kết issue trong thread của bạn.
5. Mở một PR tới `main` có tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn thread Discord của bạn. Contributor không thể gắn nhãn PR, nên tiêu đề là tín hiệu phía PR cho maintainer và tự động hóa. Blocker có PR sẽ được merge; blocker không có PR vẫn có thể được phát hành. Maintainer theo dõi các thread này trong thời gian kiểm thử beta.
6. Im lặng nghĩa là xanh. Nếu bạn bỏ lỡ khoảng thời gian này, bản sửa của bạn có khả năng sẽ vào chu kỳ tiếp theo.

## Bước tiếp theo

<CardGroup cols={2}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng một plugin kênh nhắn tin
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng một plugin nhà cung cấp mô hình
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Đăng ký một backend CLI AI cục bộ
  </Card>
  <Card title="Tổng quan SDK" icon="book-open" href="/vi/plugins/sdk-overview">
    Tham chiếu import map và API đăng ký
  </Card>
  <Card title="Helper runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, tìm kiếm, subagent qua api.runtime
  </Card>
  <Card title="Kiểm thử" icon="test-tubes" href="/vi/plugins/sdk-testing">
    Tiện ích và mẫu kiểm thử
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/vi/plugins/manifest">
    Tham chiếu schema manifest đầy đủ
  </Card>
</CardGroup>

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) - phân tích sâu kiến trúc nội bộ
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu Plugin SDK
- [Manifest](/vi/plugins/manifest) - định dạng manifest plugin
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) - xây dựng plugin kênh
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) - xây dựng plugin nhà cung cấp
