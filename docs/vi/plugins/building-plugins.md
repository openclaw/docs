---
read_when:
    - Bạn muốn tạo một Plugin OpenClaw mới
    - Bạn cần hướng dẫn bắt đầu nhanh để phát triển Plugin
    - Bạn đang thêm một kênh, nhà cung cấp, công cụ hoặc khả năng mới khác vào OpenClaw
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-05-02T20:46:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình,
giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu phương tiện, tạo
ảnh, tạo video, web fetch, web search, công cụ agent, hoặc bất kỳ tổ hợp nào.

Bạn không cần thêm Plugin của mình vào kho OpenClaw. Xuất bản lên
[ClawHub](/vi/tools/clawhub) và người dùng cài đặt bằng
`openclaw plugins install clawhub:<package-name>`. Các thông số gói trần vẫn
cài đặt từ npm trong giai đoạn chuyển đổi khởi chạy.

## Điều kiện tiên quyết

- Node >= 22 và một trình quản lý gói (npm hoặc pnpm)
- Quen thuộc với TypeScript (ESM)
- Với Plugin trong repo: đã clone kho và chạy xong `pnpm install`. Phát triển
  Plugin từ source checkout chỉ hỗ trợ pnpm vì OpenClaw tải các Plugin đi kèm
  từ các gói workspace `extensions/*`.

## Loại Plugin nào?

<CardGroup cols={3}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Kết nối OpenClaw với một nền tảng nhắn tin (Discord, IRC, v.v.)
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Thêm một nhà cung cấp mô hình (LLM, proxy, hoặc endpoint tùy chỉnh)
  </Card>
  <Card title="Plugin công cụ / hook" icon="wrench" href="/vi/plugins/hooks">
    Đăng ký công cụ agent, hook sự kiện, hoặc dịch vụ — tiếp tục bên dưới
  </Card>
</CardGroup>

Đối với một Plugin kênh không được bảo đảm đã cài đặt khi quy trình
onboarding/thiết lập chạy, hãy dùng `createOptionalChannelSetupSurface(...)` từ
`openclaw/plugin-sdk/channel-setup`. Hàm này tạo một cặp adapter thiết lập +
wizard, thông báo yêu cầu cài đặt và từ chối an toàn các thao tác ghi cấu hình
thật cho đến khi Plugin được cài đặt.

## Bắt đầu nhanh: Plugin công cụ

Hướng dẫn này tạo một Plugin tối thiểu để đăng ký một công cụ agent. Plugin
kênh và Plugin nhà cung cấp có các hướng dẫn riêng được liên kết ở trên.

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

    Mỗi Plugin cần một manifest, ngay cả khi không có cấu hình. Các công cụ
    được đăng ký lúc chạy phải được liệt kê trong `contracts.tools` để OpenClaw
    có thể khám phá Plugin sở hữu mà không cần tải mọi runtime Plugin. Plugin
    cũng nên khai báo `activation.onStartup` một cách có chủ ý. Ví dụ này đặt
    giá trị đó là `true`. Xem [Manifest](/vi/plugins/manifest) để biết schema đầy
    đủ. Các đoạn trích xuất bản ClawHub chuẩn nằm trong
    `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` dành cho Plugin không phải kênh. Với kênh, hãy dùng
    `defineChannelPluginEntry` — xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).
    Để biết đầy đủ tùy chọn entry point, xem [Entry Points](/vi/plugins/sdk-entrypoints).

  </Step>

  <Step title="Kiểm thử và xuất bản">

    **Plugin bên ngoài:** xác thực và xuất bản bằng ClawHub, rồi cài đặt:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Các thông số gói trần như `@myorg/openclaw-my-plugin` cài đặt từ npm trong
    giai đoạn chuyển đổi khởi chạy. Dùng `clawhub:` khi bạn muốn phân giải qua ClawHub.

    **Plugin trong repo:** đặt dưới cây workspace Plugin đi kèm — sẽ được tự động khám phá.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Khả năng của Plugin

Một Plugin có thể đăng ký bất kỳ số lượng khả năng nào thông qua đối tượng `api`:

| Khả năng               | Phương thức đăng ký                              | Hướng dẫn chi tiết                                                            |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Suy luận văn bản (LLM) | `api.registerProvider(...)`                      | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)                          |
| Backend suy luận CLI   | `api.registerCliBackend(...)`                    | [Backend CLI](/vi/gateway/cli-backends)                                          |
| Kênh / nhắn tin        | `api.registerChannel(...)`                       | [Plugin kênh](/vi/plugins/sdk-channel-plugins)                                   |
| Giọng nói (TTS/STT)    | `api.registerSpeechProvider(...)`                | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Phiên âm thời gian thực | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Thoại thời gian thực   | `api.registerRealtimeVoiceProvider(...)`         | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Hiểu phương tiện       | `api.registerMediaUnderstandingProvider(...)`    | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo ảnh                | `api.registerImageGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo nhạc               | `api.registerMusicGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo video              | `api.registerVideoGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware kết quả công cụ | `api.registerAgentToolResultMiddleware(...)`     | [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api)                        |
| Công cụ agent          | `api.registerTool(...)`                          | Bên dưới                                                                      |
| Lệnh tùy chỉnh         | `api.registerCommand(...)`                       | [Entry Points](/vi/plugins/sdk-entrypoints)                                      |
| Hook Plugin            | `api.on(...)`                                    | [Hook Plugin](/vi/plugins/hooks)                                                 |
| Hook sự kiện nội bộ    | `api.registerHook(...)`                          | [Entry Points](/vi/plugins/sdk-entrypoints)                                      |
| Route HTTP             | `api.registerHttpRoute(...)`                     | [Nội bộ](/vi/plugins/architecture-internals#gateway-http-routes)                 |
| Lệnh con CLI           | `api.registerCli(...)`                           | [Entry Points](/vi/plugins/sdk-entrypoints)                                      |

Để biết API đăng ký đầy đủ, xem [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api).

Plugin đi kèm có thể dùng `api.registerAgentToolResultMiddleware(...)` khi chúng
cần viết lại bất đồng bộ kết quả công cụ trước khi mô hình thấy đầu ra. Khai báo
các runtime được nhắm mục tiêu trong `contracts.agentToolResultMiddleware`, ví dụ
`["pi", "codex"]`. Đây là một điểm mở rộng đáng tin cậy dành cho Plugin đi kèm;
Plugin bên ngoài nên ưu tiên các hook Plugin OpenClaw thông thường, trừ khi
OpenClaw phát triển một chính sách tin cậy rõ ràng cho khả năng này.

Nếu Plugin của bạn đăng ký các phương thức RPC gateway tùy chỉnh, hãy giữ chúng
trên một tiền tố riêng của Plugin. Các namespace quản trị lõi (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được giữ riêng và luôn phân giải
thành `operator.admin`, ngay cả khi một Plugin yêu cầu phạm vi hẹp hơn.

Các ngữ nghĩa bảo vệ hook cần ghi nhớ:

- `before_tool_call`: `{ block: true }` là quyết định cuối cùng và dừng các handler có độ ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` được xem như không có quyết định.
- `before_tool_call`: `{ requireApproval: true }` tạm dừng thực thi agent và nhắc người dùng phê duyệt qua lớp phủ phê duyệt exec, nút Telegram, tương tác Discord, hoặc lệnh `/approve` trên bất kỳ kênh nào.
- `before_install`: `{ block: true }` là quyết định cuối cùng và dừng các handler có độ ưu tiên thấp hơn.
- `before_install`: `{ block: false }` được xem như không có quyết định.
- `message_sending`: `{ cancel: true }` là quyết định cuối cùng và dừng các handler có độ ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` được xem như không có quyết định.
- `message_received`: ưu tiên trường có kiểu `threadId` khi bạn cần định tuyến thread/chủ đề đến. Giữ `metadata` cho các phần bổ sung riêng theo kênh.
- `message_sending`: ưu tiên các trường định tuyến có kiểu `replyToId` / `threadId` hơn các khóa metadata riêng theo kênh.

Lệnh `/approve` xử lý cả phê duyệt exec và Plugin với cơ chế dự phòng có giới hạn: khi không tìm thấy id phê duyệt exec, OpenClaw thử lại cùng id đó qua phê duyệt Plugin. Có thể cấu hình độc lập việc chuyển tiếp phê duyệt Plugin qua `approvals.plugin` trong cấu hình.

Nếu hệ thống phê duyệt tùy chỉnh cần phát hiện cùng trường hợp dự phòng có giới
hạn đó, hãy ưu tiên `isApprovalNotFoundError` từ
`openclaw/plugin-sdk/error-runtime` thay vì tự khớp chuỗi hết hạn phê duyệt.

Xem [Hook Plugin](/vi/plugins/hooks) để biết ví dụ và tham chiếu hook.

## Đăng ký công cụ agent

Công cụ là các hàm có kiểu mà LLM có thể gọi. Chúng có thể là bắt buộc (luôn
khả dụng) hoặc tùy chọn (người dùng chọn tham gia):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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

Mọi công cụ được đăng ký bằng `api.registerTool(...)` cũng phải được khai báo
trong manifest Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw thu thập và lưu cache descriptor đã xác thực từ công cụ đã đăng ký, vì
vậy Plugin không lặp lại `description` hoặc dữ liệu schema trong manifest.
Contract manifest chỉ khai báo quyền sở hữu và khả năng khám phá; việc thực thi
vẫn gọi implementation công cụ đã đăng ký đang hoạt động.

Người dùng bật công cụ tùy chọn trong cấu hình:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tên công cụ không được xung đột với các công cụ lõi (các xung đột sẽ bị bỏ qua)
- Các công cụ có đối tượng đăng ký sai định dạng, bao gồm thiếu `parameters`, sẽ bị bỏ qua và được báo cáo trong chẩn đoán Plugin thay vì làm hỏng các lần chạy agent
- Dùng `optional: true` cho các công cụ có tác dụng phụ hoặc yêu cầu thêm binary
- Người dùng có thể bật tất cả công cụ từ một Plugin bằng cách thêm id Plugin vào `tools.allow`

## Đăng ký lệnh CLI

Plugin có thể thêm các nhóm lệnh `openclaw` gốc bằng `api.registerCli`. Cung cấp
`descriptors` cho mọi gốc lệnh cấp cao nhất để OpenClaw có thể hiển thị và định tuyến
lệnh mà không cần tải sẵn mọi runtime Plugin.

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

Để xem tham chiếu subpath đầy đủ, hãy xem [Tổng quan SDK](/vi/plugins/sdk-overview).

Trong Plugin của bạn, dùng các tệp barrel cục bộ (`api.ts`, `runtime-api.ts`) cho
import nội bộ — không bao giờ import chính Plugin của bạn thông qua đường dẫn SDK của nó.

Đối với Plugin nhà cung cấp, hãy giữ các helper dành riêng cho nhà cung cấp trong các
barrel gốc package đó trừ khi seam thật sự mang tính chung. Các ví dụ bundled hiện tại:

- Anthropic: wrapper luồng Claude và helper `service_tier` / beta
- OpenAI: builder nhà cung cấp, helper model mặc định, nhà cung cấp realtime
- OpenRouter: builder nhà cung cấp cùng helper onboarding/cấu hình

Nếu một helper chỉ hữu ích bên trong một package nhà cung cấp bundled, hãy giữ nó trên
seam gốc package đó thay vì đưa nó vào `openclaw/plugin-sdk/*`.

Một số seam helper `openclaw/plugin-sdk/<bundled-id>` được tạo vẫn tồn tại cho
bảo trì bundled-Plugin khi chúng có theo dõi việc sử dụng của owner. Hãy xem chúng là
bề mặt được dành riêng, không phải mẫu mặc định cho Plugin bên thứ ba mới.

## Checklist trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Manifest **openclaw.plugin.json** hiện diện và hợp lệ</Check>
<Check>Entry point dùng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Tất cả import dùng đường dẫn `plugin-sdk/<subpath>` tập trung</Check>
<Check>Import nội bộ dùng module cục bộ, không tự import qua SDK</Check>
<Check>Test pass (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pass (Plugin trong repo)</Check>

## Kiểm thử bản phát hành beta

1. Theo dõi các tag phát hành GitHub trên [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) và đăng ký qua `Watch` > `Releases`. Tag beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể bật thông báo cho tài khoản X chính thức của OpenClaw [@openclaw](https://x.com/openclaw) để nhận thông báo phát hành.
2. Kiểm thử Plugin của bạn với tag beta ngay khi nó xuất hiện. Khoảng thời gian trước bản stable thường chỉ vài giờ.
3. Đăng trong thread của Plugin của bạn ở kênh Discord `plugin-forum` sau khi kiểm thử, với `all good` hoặc nội dung đã bị hỏng. Nếu bạn chưa có thread, hãy tạo một thread.
4. Nếu có thứ gì đó bị hỏng, hãy mở hoặc cập nhật một issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Đặt liên kết issue trong thread của bạn.
5. Mở một PR tới `main` có tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn thread Discord của bạn. Contributor không thể gắn nhãn PR, nên tiêu đề là tín hiệu phía PR cho maintainer và tự động hóa. Blocker có PR sẽ được merge; blocker không có PR có thể vẫn được phát hành. Maintainer theo dõi các thread này trong khi kiểm thử beta.
6. Im lặng nghĩa là xanh. Nếu bạn bỏ lỡ khoảng thời gian này, bản sửa của bạn nhiều khả năng sẽ vào chu kỳ tiếp theo.

## Bước tiếp theo

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng Plugin kênh nhắn tin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng Plugin nhà cung cấp model
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

- [Kiến trúc Plugin](/vi/plugins/architecture) — phân tích sâu kiến trúc nội bộ
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu SDK Plugin
- [Manifest](/vi/plugins/manifest) — định dạng manifest Plugin
- [Channel Plugins](/vi/plugins/sdk-channel-plugins) — xây dựng Plugin kênh
- [Provider Plugins](/vi/plugins/sdk-provider-plugins) — xây dựng Plugin nhà cung cấp
