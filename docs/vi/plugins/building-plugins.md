---
read_when:
    - Bạn muốn tạo một Plugin OpenClaw mới
    - Bạn cần hướng dẫn bắt đầu nhanh để phát triển plugin
    - Bạn đang thêm một kênh, nhà cung cấp, công cụ hoặc khả năng mới khác vào OpenClaw
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-05-07T13:21:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình,
giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu phương tiện, tạo
ảnh, tạo video, tìm nạp web, tìm kiếm web, công cụ agent, hoặc bất kỳ sự kết
hợp nào.

Bạn không cần thêm plugin của mình vào kho lưu trữ OpenClaw. Xuất bản lên
[ClawHub](/vi/tools/clawhub) và người dùng cài đặt bằng
`openclaw plugins install clawhub:<package-name>`. Thông số gói trần vẫn
cài đặt từ npm trong giai đoạn chuyển đổi khi ra mắt.

## Điều kiện tiên quyết

- Node >= 22 và một trình quản lý gói (npm hoặc pnpm)
- Quen thuộc với TypeScript (ESM)
- Với plugin trong kho: kho lưu trữ đã được clone và đã chạy `pnpm install`. Phát triển plugin từ
  checkout mã nguồn chỉ dùng pnpm vì OpenClaw tải các plugin đi kèm
  từ các gói workspace `extensions/*`.

## Loại plugin nào?

<CardGroup cols={3}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Kết nối OpenClaw với một nền tảng nhắn tin (Discord, IRC, v.v.)
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Thêm một nhà cung cấp mô hình (LLM, proxy hoặc endpoint tùy chỉnh)
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Ánh xạ một CLI AI cục bộ vào trình chạy dự phòng văn bản của OpenClaw
  </Card>
  <Card title="Plugin công cụ / hook" icon="wrench" href="/vi/plugins/hooks">
    Đăng ký công cụ agent, hook sự kiện hoặc dịch vụ - tiếp tục bên dưới
  </Card>
</CardGroup>

Với plugin kênh không được bảo đảm đã cài đặt khi quá trình onboarding/thiết lập
chạy, hãy dùng `createOptionalChannelSetupSurface(...)` từ
`openclaw/plugin-sdk/channel-setup`. Hàm này tạo một cặp adapter thiết lập + wizard
thông báo yêu cầu cài đặt và đóng an toàn khi ghi cấu hình thật
cho đến khi plugin được cài đặt.

## Bắt đầu nhanh: plugin công cụ

Hướng dẫn này tạo một plugin tối thiểu đăng ký một công cụ agent. Plugin kênh
và plugin nhà cung cấp có các hướng dẫn riêng được liên kết ở trên.

<Steps>
  <Step title="Tạo gói và manifest">
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

    Mỗi plugin cần một manifest, ngay cả khi không có cấu hình. Các công cụ được đăng ký khi chạy
    phải được liệt kê trong `contracts.tools` để OpenClaw có thể phát hiện plugin sở hữu
    mà không cần tải mọi runtime của plugin. Plugin cũng nên khai báo
    `activation.onStartup` một cách có chủ đích. Ví dụ này đặt giá trị đó là `true`. Xem
    [Manifest](/vi/plugins/manifest) để biết schema đầy đủ. Các đoạn mã xuất bản ClawHub chuẩn
    nằm trong `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Viết entry point">

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

    `definePluginEntry` dành cho plugin không phải kênh. Với kênh, dùng
    `defineChannelPluginEntry` - xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).
    Để biết đầy đủ tùy chọn entry point, xem [Entry Point](/vi/plugins/sdk-entrypoints).

  </Step>

  <Step title="Kiểm thử và xuất bản">

    **Plugin bên ngoài:** xác thực và xuất bản bằng ClawHub, rồi cài đặt:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Thông số gói trần như `@myorg/openclaw-my-plugin` cài đặt từ npm trong
    giai đoạn chuyển đổi khi ra mắt. Dùng `clawhub:` khi bạn muốn phân giải qua ClawHub.

    **Plugin trong kho:** đặt dưới cây workspace plugin đi kèm - sẽ được tự động phát hiện.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Khả năng của Plugin

Một plugin có thể đăng ký bất kỳ số lượng khả năng nào thông qua đối tượng `api`:

| Khả năng               | Phương thức đăng ký                              | Hướng dẫn chi tiết                                                              |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Suy luận văn bản (LLM) | `api.registerProvider(...)`                      | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)                            |
| Backend suy luận CLI   | `api.registerCliBackend(...)`                    | [Plugin backend CLI](/vi/plugins/cli-backend-plugins)                              |
| Kênh / nhắn tin        | `api.registerChannel(...)`                       | [Plugin kênh](/vi/plugins/sdk-channel-plugins)                                     |
| Giọng nói (TTS/STT)    | `api.registerSpeechProvider(...)`                | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Phiên âm thời gian thực | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Thoại thời gian thực   | `api.registerRealtimeVoiceProvider(...)`         | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Hiểu phương tiện       | `api.registerMediaUnderstandingProvider(...)`    | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo ảnh                | `api.registerImageGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo nhạc               | `api.registerMusicGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo video              | `api.registerVideoGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tìm nạp web            | `api.registerWebFetchProvider(...)`              | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tìm kiếm web           | `api.registerWebSearchProvider(...)`             | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware kết quả công cụ | `api.registerAgentToolResultMiddleware(...)` | [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api)                         |
| Công cụ agent          | `api.registerTool(...)`                          | Bên dưới                                                                        |
| Lệnh tùy chỉnh         | `api.registerCommand(...)`                       | [Entry Point](/vi/plugins/sdk-entrypoints)                                         |
| Hook Plugin            | `api.on(...)`                                    | [Hook Plugin](/vi/plugins/hooks)                                                   |
| Hook sự kiện nội bộ    | `api.registerHook(...)`                          | [Entry Point](/vi/plugins/sdk-entrypoints)                                         |
| Tuyến HTTP             | `api.registerHttpRoute(...)`                     | [Nội bộ](/vi/plugins/architecture-internals#gateway-http-routes)                   |
| Lệnh con CLI           | `api.registerCli(...)`                           | [Entry Point](/vi/plugins/sdk-entrypoints)                                         |

Để biết API đăng ký đầy đủ, xem [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api).

Plugin đi kèm có thể dùng `api.registerAgentToolResultMiddleware(...)` khi chúng
cần ghi lại kết quả công cụ bất đồng bộ trước khi mô hình nhìn thấy đầu ra. Khai báo các
runtime được nhắm tới trong `contracts.agentToolResultMiddleware`, ví dụ
`["pi", "codex"]`. Đây là một seam đáng tin cậy cho plugin đi kèm; plugin bên ngoài
nên ưu tiên các hook plugin OpenClaw thông thường trừ khi OpenClaw phát triển
một chính sách tin cậy rõ ràng cho khả năng này.

Nếu plugin của bạn đăng ký các phương thức RPC gateway tùy chỉnh, hãy giữ chúng trên một
tiền tố dành riêng cho plugin. Các namespace quản trị lõi (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn phân giải thành
`operator.admin`, ngay cả khi plugin yêu cầu một phạm vi hẹp hơn.

Ngữ nghĩa bảo vệ hook cần ghi nhớ:

- `before_tool_call`: `{ block: true }` là cuối cùng và dừng các handler có độ ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` được xử lý như không có quyết định.
- `before_tool_call`: `{ requireApproval: true }` tạm dừng thực thi agent và nhắc người dùng phê duyệt thông qua lớp phủ phê duyệt exec, nút Telegram, tương tác Discord hoặc lệnh `/approve` trên bất kỳ kênh nào.
- `before_install`: `{ block: true }` là cuối cùng và dừng các handler có độ ưu tiên thấp hơn.
- `before_install`: `{ block: false }` được xử lý như không có quyết định.
- `message_sending`: `{ cancel: true }` là cuối cùng và dừng các handler có độ ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` được xử lý như không có quyết định.
- `message_received`: ưu tiên trường được định kiểu `threadId` khi bạn cần định tuyến thread/chủ đề gửi đến. Giữ `metadata` cho các phần bổ sung dành riêng cho kênh.
- `message_sending`: ưu tiên các trường định tuyến được định kiểu `replyToId` / `threadId` hơn các khóa metadata dành riêng cho kênh.

Lệnh `/approve` xử lý cả phê duyệt exec và plugin với dự phòng có giới hạn: khi không tìm thấy id phê duyệt exec, OpenClaw thử lại cùng id đó qua phê duyệt plugin. Chuyển tiếp phê duyệt plugin có thể được cấu hình độc lập thông qua `approvals.plugin` trong cấu hình.

Nếu hệ thống phê duyệt tùy chỉnh cần phát hiện cùng trường hợp dự phòng có giới hạn đó,
hãy ưu tiên `isApprovalNotFoundError` từ `openclaw/plugin-sdk/error-runtime`
thay vì khớp chuỗi hết hạn phê duyệt theo cách thủ công.

Xem [Hook Plugin](/vi/plugins/hooks) để biết ví dụ và tham chiếu hook.

## Đăng ký công cụ agent

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

Mọi công cụ được đăng ký bằng `api.registerTool(...)` cũng phải được khai báo trong
manifest plugin:

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

OpenClaw ghi lại và lưu vào bộ nhớ đệm bộ mô tả đã được xác thực từ công cụ đã đăng ký,
vì vậy Plugin không cần sao chép `description` hoặc dữ liệu schema trong manifest. Hợp đồng
manifest chỉ khai báo quyền sở hữu và khả năng khám phá; việc thực thi vẫn gọi
phần triển khai công cụ đã đăng ký đang hoạt động.
Đặt `toolMetadata.<tool>.optional: true` cho các công cụ được đăng ký bằng
`api.registerTool(..., { optional: true })` để OpenClaw có thể tránh tải
runtime của Plugin đó cho đến khi công cụ được đưa rõ ràng vào allowlist.

Người dùng bật các công cụ tùy chọn trong cấu hình:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tên công cụ không được xung đột với công cụ lõi (các xung đột sẽ bị bỏ qua)
- Công cụ có đối tượng đăng ký không đúng định dạng, bao gồm thiếu `parameters`, sẽ bị bỏ qua và được báo cáo trong chẩn đoán Plugin thay vì làm hỏng các lần chạy agent
- Dùng `optional: true` cho các công cụ có tác dụng phụ hoặc yêu cầu thêm binary
- Người dùng có thể bật tất cả công cụ từ một Plugin bằng cách thêm id của Plugin vào `tools.allow`

## Đăng ký lệnh CLI

Plugin có thể thêm các nhóm lệnh gốc `openclaw` bằng `api.registerCli`. Cung cấp
`descriptors` cho mọi gốc lệnh cấp cao nhất để OpenClaw có thể hiển thị và định tuyến
lệnh mà không cần tải sẵn mọi runtime của Plugin.

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

Sau khi cài đặt, xác minh đăng ký runtime và thực thi lệnh:

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

Để xem tham chiếu subpath đầy đủ, hãy xem [Tổng quan SDK](/vi/plugins/sdk-overview).

Trong Plugin của bạn, dùng các tệp barrel cục bộ (`api.ts`, `runtime-api.ts`) cho
các import nội bộ - không bao giờ import chính Plugin của bạn thông qua đường dẫn SDK của nó.

Đối với Provider Plugin, giữ các helper dành riêng cho nhà cung cấp trong các
barrel ở gốc package đó trừ khi seam thật sự mang tính tổng quát. Các ví dụ được đóng gói hiện tại:

- Anthropic: các wrapper luồng Claude và helper `service_tier` / beta
- OpenAI: builder nhà cung cấp, helper mô hình mặc định, nhà cung cấp realtime
- OpenRouter: builder nhà cung cấp cùng helper onboarding/cấu hình

Nếu một helper chỉ hữu ích bên trong một package nhà cung cấp được đóng gói,
hãy giữ nó trên seam gốc package đó thay vì nâng nó vào `openclaw/plugin-sdk/*`.

Một số seam helper `openclaw/plugin-sdk/<bundled-id>` được tạo vẫn tồn tại để
bảo trì bundled Plugin khi chúng có theo dõi việc sử dụng của chủ sở hữu. Hãy xem đó là
các bề mặt dành riêng, không phải mẫu mặc định cho Plugin bên thứ ba mới.

## Danh sách kiểm tra trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Manifest **openclaw.plugin.json** có mặt và hợp lệ</Check>
<Check>Điểm vào dùng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Mọi import dùng đường dẫn `plugin-sdk/<subpath>` tập trung</Check>
<Check>Import nội bộ dùng module cục bộ, không tự import qua SDK</Check>
<Check>Kiểm thử đạt (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` đạt (Plugin trong repo)</Check>

## Kiểm thử bản phát hành beta

1. Theo dõi các thẻ phát hành GitHub trên [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) và đăng ký qua `Watch` > `Releases`. Thẻ beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể bật thông báo cho tài khoản X chính thức của OpenClaw [@openclaw](https://x.com/openclaw) để nhận thông báo phát hành.
2. Kiểm thử Plugin của bạn với thẻ beta ngay khi thẻ xuất hiện. Khoảng thời gian trước bản stable thường chỉ vài giờ.
3. Đăng trong luồng của Plugin của bạn trong kênh Discord `plugin-forum` sau khi kiểm thử, với `all good` hoặc nội dung bị hỏng. Nếu bạn chưa có luồng, hãy tạo một luồng.
4. Nếu có gì đó hỏng, hãy mở hoặc cập nhật issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Đặt liên kết issue trong luồng của bạn.
5. Mở PR vào `main` với tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn luồng Discord của bạn. Contributor không thể gắn nhãn PR, vì vậy tiêu đề là tín hiệu phía PR cho maintainer và tự động hóa. Blocker có PR sẽ được merge; blocker không có PR vẫn có thể được phát hành. Maintainer theo dõi các luồng này trong quá trình kiểm thử beta.
6. Im lặng nghĩa là xanh. Nếu bạn bỏ lỡ khoảng thời gian này, bản sửa của bạn có khả năng sẽ vào chu kỳ tiếp theo.

## Các bước tiếp theo

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng Plugin kênh nhắn tin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng Plugin nhà cung cấp mô hình
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Đăng ký backend CLI AI cục bộ
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/vi/plugins/sdk-overview">
    Tham chiếu import map và API đăng ký
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, tìm kiếm, subagent qua api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/vi/plugins/sdk-testing">
    Tiện ích và mẫu kiểm thử
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/vi/plugins/manifest">
    Tham chiếu schema manifest đầy đủ
  </Card>
</CardGroup>

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) - tìm hiểu sâu về kiến trúc nội bộ
- [Tổng quan SDK](/vi/plugins/sdk-overview) - tham chiếu Plugin SDK
- [Manifest](/vi/plugins/manifest) - định dạng manifest Plugin
- [Channel Plugin](/vi/plugins/sdk-channel-plugins) - xây dựng Plugin kênh
- [Provider Plugin](/vi/plugins/sdk-provider-plugins) - xây dựng Provider Plugin
