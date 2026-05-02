---
read_when:
    - Bạn muốn tạo một Plugin OpenClaw mới
    - Bạn cần một hướng dẫn bắt đầu nhanh để phát triển Plugin
    - Bạn đang thêm một kênh, nhà cung cấp, công cụ hoặc khả năng mới khác vào OpenClaw
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-05-02T10:46:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình,
giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu nội dung đa phương tiện, tạo hình ảnh, tạo
video, tải web, tìm kiếm web, công cụ tác tử hoặc bất kỳ
sự kết hợp nào.

Bạn không cần thêm plugin của mình vào kho lưu trữ OpenClaw. Xuất bản lên
[ClawHub](/vi/tools/clawhub) và người dùng cài đặt bằng
`openclaw plugins install <package-name>`. OpenClaw thử ClawHub trước và
tự động chuyển về npm cho các gói vẫn dùng phân phối qua npm.

## Điều kiện tiên quyết

- Node >= 22 và một trình quản lý gói (npm hoặc pnpm)
- Quen thuộc với TypeScript (ESM)
- Với plugin trong kho lưu trữ: đã clone kho lưu trữ và chạy xong `pnpm install`. Phát triển plugin
  từ checkout mã nguồn chỉ dùng pnpm vì OpenClaw tải các plugin được đóng gói sẵn
  từ các gói workspace `extensions/*`.

## Loại plugin nào?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Kết nối OpenClaw với một nền tảng nhắn tin (Discord, IRC, v.v.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Thêm một nhà cung cấp mô hình (LLM, proxy hoặc endpoint tùy chỉnh)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/vi/plugins/hooks">
    Đăng ký công cụ tác tử, hook sự kiện hoặc dịch vụ — tiếp tục bên dưới
  </Card>
</CardGroup>

Với một plugin kênh không được bảo đảm sẽ được cài đặt khi chạy onboarding/thiết lập,
hãy dùng `createOptionalChannelSetupSurface(...)` từ
`openclaw/plugin-sdk/channel-setup`. Nó tạo ra một cặp adapter thiết lập + wizard
quảng bá yêu cầu cài đặt và đóng an toàn khi ghi cấu hình thật
cho đến khi plugin được cài đặt.

## Bắt đầu nhanh: plugin công cụ

Hướng dẫn này tạo một plugin tối thiểu đăng ký một công cụ tác tử. Plugin kênh
và nhà cung cấp có các hướng dẫn riêng được liên kết ở trên.

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

    Mỗi plugin cần có manifest, ngay cả khi không có cấu hình. Các công cụ được đăng ký lúc chạy
    phải được liệt kê trong `contracts.tools` để OpenClaw có thể khám phá plugin sở hữu
    mà không cần tải mọi runtime plugin. Plugin cũng nên khai báo
    `activation.onStartup` một cách có chủ ý. Ví dụ này đặt giá trị đó là `true`. Xem
    [Manifest](/vi/plugins/manifest) để biết schema đầy đủ. Các đoạn mẫu xuất bản ClawHub chuẩn
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

    `definePluginEntry` dành cho các plugin không phải kênh. Với kênh, dùng
    `defineChannelPluginEntry` — xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).
    Để biết đầy đủ các tùy chọn điểm vào, xem [Điểm vào](/vi/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Plugin bên ngoài:** xác thực và xuất bản bằng ClawHub, rồi cài đặt:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw cũng kiểm tra ClawHub trước npm cho các đặc tả gói trần như
    `@myorg/openclaw-my-plugin`; npm vẫn là phương án dự phòng cho các gói
    chưa di chuyển sang ClawHub.

    **Plugin trong kho lưu trữ:** đặt dưới cây workspace plugin được đóng gói sẵn — sẽ được tự động khám phá.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Khả năng của plugin

Một plugin có thể đăng ký bất kỳ số lượng khả năng nào thông qua đối tượng `api`:

| Khả năng               | Phương thức đăng ký                              | Hướng dẫn chi tiết                                                              |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Suy luận văn bản (LLM) | `api.registerProvider(...)`                      | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)                            |
| Backend suy luận CLI   | `api.registerCliBackend(...)`                    | [Backend CLI](/vi/gateway/cli-backends)                                            |
| Kênh / nhắn tin        | `api.registerChannel(...)`                       | [Plugin kênh](/vi/plugins/sdk-channel-plugins)                                     |
| Giọng nói (TTS/STT)    | `api.registerSpeechProvider(...)`                | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Phiên âm thời gian thực | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Thoại thời gian thực   | `api.registerRealtimeVoiceProvider(...)`         | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Hiểu nội dung đa phương tiện | `api.registerMediaUnderstandingProvider(...)`    | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo hình ảnh           | `api.registerImageGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo nhạc               | `api.registerMusicGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo video              | `api.registerVideoGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tải web                | `api.registerWebFetchProvider(...)`              | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tìm kiếm web           | `api.registerWebSearchProvider(...)`             | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware kết quả công cụ | `api.registerAgentToolResultMiddleware(...)`     | [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api)                         |
| Công cụ tác tử         | `api.registerTool(...)`                          | Bên dưới                                                                        |
| Lệnh tùy chỉnh         | `api.registerCommand(...)`                       | [Điểm vào](/vi/plugins/sdk-entrypoints)                                            |
| Hook plugin            | `api.on(...)`                                    | [Hook plugin](/vi/plugins/hooks)                                                   |
| Hook sự kiện nội bộ    | `api.registerHook(...)`                          | [Điểm vào](/vi/plugins/sdk-entrypoints)                                            |
| Tuyến HTTP             | `api.registerHttpRoute(...)`                     | [Nội bộ](/vi/plugins/architecture-internals#gateway-http-routes)                   |
| Lệnh con CLI           | `api.registerCli(...)`                           | [Điểm vào](/vi/plugins/sdk-entrypoints)                                            |

Để biết API đăng ký đầy đủ, xem [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api).

Plugin được đóng gói sẵn có thể dùng `api.registerAgentToolResultMiddleware(...)` khi chúng
cần viết lại kết quả công cụ bất đồng bộ trước khi mô hình thấy đầu ra. Khai báo các
runtime được nhắm đến trong `contracts.agentToolResultMiddleware`, ví dụ
`["pi", "codex"]`. Đây là một seam plugin được đóng gói sẵn đáng tin cậy; plugin
bên ngoài nên ưu tiên các hook plugin OpenClaw thông thường trừ khi OpenClaw phát triển
một chính sách tin cậy rõ ràng cho khả năng này.

Nếu plugin của bạn đăng ký các phương thức RPC gateway tùy chỉnh, hãy giữ chúng trên một
tiền tố riêng cho plugin. Các namespace quản trị lõi (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn phân giải thành
`operator.admin`, ngay cả khi một plugin yêu cầu phạm vi hẹp hơn.

Ngữ nghĩa guard của hook cần ghi nhớ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` được xem là không có quyết định.
- `before_tool_call`: `{ requireApproval: true }` tạm dừng thực thi tác tử và nhắc người dùng phê duyệt qua overlay phê duyệt exec, nút Telegram, tương tác Discord hoặc lệnh `/approve` trên bất kỳ kênh nào.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `before_install`: `{ block: false }` được xem là không có quyết định.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler có độ ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` được xem là không có quyết định.
- `message_received`: ưu tiên trường được định kiểu `threadId` khi bạn cần định tuyến thread/chủ đề đi vào. Giữ `metadata` cho các phần bổ sung riêng theo kênh.
- `message_sending`: ưu tiên các trường định tuyến được định kiểu `replyToId` / `threadId` hơn các khóa metadata riêng theo kênh.

Lệnh `/approve` xử lý cả phê duyệt exec và plugin với fallback có giới hạn: khi không tìm thấy id phê duyệt exec, OpenClaw thử lại cùng id đó qua phê duyệt plugin. Việc chuyển tiếp phê duyệt plugin có thể được cấu hình độc lập qua `approvals.plugin` trong cấu hình.

Nếu phần nối dây phê duyệt tùy chỉnh cần phát hiện cùng trường hợp fallback có giới hạn đó,
hãy ưu tiên `isApprovalNotFoundError` từ `openclaw/plugin-sdk/error-runtime`
thay vì tự khớp chuỗi hết hạn phê duyệt theo cách thủ công.

Xem [Hook plugin](/vi/plugins/hooks) để biết ví dụ và tài liệu tham chiếu hook.

## Đăng ký công cụ tác tử

Công cụ là các hàm được định kiểu mà LLM có thể gọi. Chúng có thể là bắt buộc (luôn
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

Mọi công cụ được đăng ký bằng `api.registerTool(...)` cũng phải được khai báo trong
manifest plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Người dùng bật công cụ tùy chọn trong cấu hình:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tên công cụ không được xung đột với các công cụ lõi (các xung đột sẽ bị bỏ qua)
- Các công cụ có đối tượng đăng ký sai định dạng, bao gồm thiếu `parameters`, sẽ bị bỏ qua và được báo cáo trong chẩn đoán Plugin thay vì làm hỏng các lần chạy tác tử
- Dùng `optional: true` cho các công cụ có tác dụng phụ hoặc yêu cầu thêm tệp nhị phân
- Người dùng có thể bật tất cả công cụ từ một Plugin bằng cách thêm id Plugin vào `tools.allow`

## Đăng ký lệnh CLI

Plugin có thể thêm các nhóm lệnh `openclaw` gốc bằng `api.registerCli`. Cung cấp
`descriptors` cho mọi gốc lệnh cấp cao nhất để OpenClaw có thể hiển thị và định tuyến
lệnh mà không cần tải trước mọi runtime Plugin.

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

Để xem tham chiếu đầy đủ về subpath, xem [Tổng quan SDK](/vi/plugins/sdk-overview).

Trong Plugin của bạn, dùng các tệp barrel cục bộ (`api.ts`, `runtime-api.ts`) cho
import nội bộ — không bao giờ import chính Plugin của bạn thông qua đường dẫn SDK của nó.

Đối với Plugin nhà cung cấp, giữ các trình trợ giúp dành riêng cho nhà cung cấp trong các
barrel ở gốc gói đó, trừ khi điểm nối đó thực sự dùng chung. Các ví dụ được đóng gói hiện tại:

- Anthropic: các wrapper luồng Claude và trình trợ giúp `service_tier` / beta
- OpenAI: trình dựng nhà cung cấp, trình trợ giúp mô hình mặc định, nhà cung cấp thời gian thực
- OpenRouter: trình dựng nhà cung cấp cùng trình trợ giúp onboarding/cấu hình

Nếu một trình trợ giúp chỉ hữu ích bên trong một gói nhà cung cấp được đóng gói, hãy giữ nó trên
điểm nối ở gốc gói đó thay vì đưa nó vào `openclaw/plugin-sdk/*`.

Một số điểm nối trợ giúp `openclaw/plugin-sdk/<bundled-id>` được tạo vẫn tồn tại cho
việc bảo trì bundled-plugin khi chúng có theo dõi việc sử dụng của chủ sở hữu. Hãy xem đó là
các bề mặt dành riêng, không phải mẫu mặc định cho Plugin bên thứ ba mới.

## Danh sách kiểm tra trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Manifest **openclaw.plugin.json** có mặt và hợp lệ</Check>
<Check>Điểm vào dùng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Tất cả import dùng các đường dẫn `plugin-sdk/<subpath>` tập trung</Check>
<Check>Import nội bộ dùng mô-đun cục bộ, không tự import SDK</Check>
<Check>Kiểm thử đạt (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` đạt (Plugin trong repo)</Check>

## Kiểm thử bản phát hành beta

1. Theo dõi các thẻ phát hành GitHub trên [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) và đăng ký qua `Watch` > `Releases`. Thẻ beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể bật thông báo cho tài khoản X chính thức của OpenClaw [@openclaw](https://x.com/openclaw) để nhận thông báo phát hành.
2. Kiểm thử Plugin của bạn với thẻ beta ngay khi thẻ xuất hiện. Khoảng thời gian trước bản ổn định thường chỉ vài giờ.
3. Đăng trong luồng của Plugin của bạn trong kênh Discord `plugin-forum` sau khi kiểm thử, với `all good` hoặc nội dung bị lỗi. Nếu bạn chưa có luồng, hãy tạo một luồng.
4. Nếu có lỗi, mở hoặc cập nhật một issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Đặt liên kết issue trong luồng của bạn.
5. Mở một PR vào `main` có tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn luồng Discord của bạn. Người đóng góp không thể gắn nhãn PR, vì vậy tiêu đề là tín hiệu phía PR cho maintainer và tự động hóa. Các blocker có PR sẽ được merge; blocker không có PR vẫn có thể được phát hành. Maintainer theo dõi các luồng này trong quá trình kiểm thử beta.
6. Im lặng nghĩa là xanh. Nếu bạn bỏ lỡ khoảng thời gian này, bản sửa của bạn có thể sẽ được đưa vào chu kỳ tiếp theo.

## Bước tiếp theo

<CardGroup cols={2}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng Plugin kênh nhắn tin
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng Plugin nhà cung cấp mô hình
  </Card>
  <Card title="Tổng quan SDK" icon="book-open" href="/vi/plugins/sdk-overview">
    Tham chiếu API bản đồ import và đăng ký
  </Card>
  <Card title="Trình trợ giúp runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, tìm kiếm, tác tử phụ qua api.runtime
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
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) — xây dựng Plugin kênh
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) — xây dựng Plugin nhà cung cấp
