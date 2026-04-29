---
read_when:
    - Bạn muốn tạo một Plugin mới cho OpenClaw
    - Bạn cần hướng dẫn bắt đầu nhanh để phát triển Plugin
    - Bạn đang thêm một kênh, nhà cung cấp, công cụ hoặc năng lực khác vào OpenClaw
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-04-29T22:58:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình,
giọng nói, phiên âm thời gian thực, thoại thời gian thực, hiểu nội dung media, tạo ảnh,
tạo video, tìm nạp web, tìm kiếm web, công cụ agent, hoặc bất kỳ
tổ hợp nào.

Bạn không cần thêm Plugin của mình vào kho lưu trữ OpenClaw. Xuất bản lên
[ClawHub](/vi/tools/clawhub) và người dùng cài đặt bằng
`openclaw plugins install <package-name>`. OpenClaw thử ClawHub trước và
tự động chuyển về npm cho các gói vẫn dùng phân phối qua npm.

## Điều kiện tiên quyết

- Node >= 22 và một trình quản lý gói (npm hoặc pnpm)
- Quen thuộc với TypeScript (ESM)
- Với Plugin trong repo: đã clone kho lưu trữ và chạy xong `pnpm install`

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

Với một Plugin kênh không được bảo đảm đã cài đặt khi quá trình onboarding/thiết lập
chạy, hãy dùng `createOptionalChannelSetupSurface(...)` từ
`openclaw/plugin-sdk/channel-setup`. Hàm này tạo một cặp adapter thiết lập + wizard
thông báo yêu cầu cài đặt và từ chối an toàn các thao tác ghi cấu hình thật
cho đến khi Plugin được cài đặt.

## Bắt đầu nhanh: Plugin công cụ

Hướng dẫn này tạo một Plugin tối thiểu đăng ký một công cụ agent. Plugin kênh
và Plugin nhà cung cấp có các hướng dẫn riêng được liên kết ở trên.

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

    Mỗi Plugin cần một manifest, ngay cả khi không có cấu hình, và mỗi Plugin nên
    khai báo `activation.onStartup` một cách có chủ đích. Các công cụ đăng ký lúc runtime cần
    import khi khởi động, nên ví dụ này đặt giá trị đó là `true`. Xem
    [Manifest](/vi/plugins/manifest) để biết schema đầy đủ. Các đoạn mẫu xuất bản ClawHub chính tắc
    nằm trong `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Viết điểm vào">

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

    `definePluginEntry` dành cho các Plugin không phải kênh. Với kênh, dùng
    `defineChannelPluginEntry` — xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).
    Để biết đầy đủ tùy chọn điểm vào, xem [Điểm vào](/vi/plugins/sdk-entrypoints).

  </Step>

  <Step title="Kiểm thử và xuất bản">

    **Plugin bên ngoài:** xác thực và xuất bản bằng ClawHub, rồi cài đặt:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw cũng kiểm tra ClawHub trước npm cho các đặc tả gói dạng trần như
    `@myorg/openclaw-my-plugin`; npm vẫn là phương án dự phòng cho các gói
    chưa di chuyển sang ClawHub.

    **Plugin trong repo:** đặt dưới cây workspace Plugin được đóng gói — sẽ được tự động phát hiện.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Khả năng của Plugin

Một Plugin duy nhất có thể đăng ký bất kỳ số lượng khả năng nào qua đối tượng `api`:

| Khả năng               | Phương thức đăng ký                               | Hướng dẫn chi tiết                                                             |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Suy luận văn bản (LLM) | `api.registerProvider(...)`                      | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)                            |
| Backend suy luận CLI   | `api.registerCliBackend(...)`                    | [Backend CLI](/vi/gateway/cli-backends)                                            |
| Kênh / nhắn tin        | `api.registerChannel(...)`                       | [Plugin kênh](/vi/plugins/sdk-channel-plugins)                                     |
| Giọng nói (TTS/STT)    | `api.registerSpeechProvider(...)`                | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Phiên âm thời gian thực | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Thoại thời gian thực   | `api.registerRealtimeVoiceProvider(...)`         | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Hiểu nội dung media    | `api.registerMediaUnderstandingProvider(...)`    | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo ảnh                | `api.registerImageGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo nhạc               | `api.registerMusicGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tạo video              | `api.registerVideoGenerationProvider(...)`       | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tìm nạp web            | `api.registerWebFetchProvider(...)`              | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tìm kiếm web           | `api.registerWebSearchProvider(...)`             | [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware kết quả công cụ | `api.registerAgentToolResultMiddleware(...)`     | [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api)                         |
| Công cụ agent          | `api.registerTool(...)`                          | Bên dưới                                                                        |
| Lệnh tùy chỉnh         | `api.registerCommand(...)`                       | [Điểm vào](/vi/plugins/sdk-entrypoints)                                            |
| Hook Plugin            | `api.on(...)`                                    | [Hook Plugin](/vi/plugins/hooks)                                                   |
| Hook sự kiện nội bộ    | `api.registerHook(...)`                          | [Điểm vào](/vi/plugins/sdk-entrypoints)                                            |
| Tuyến HTTP             | `api.registerHttpRoute(...)`                     | [Nội bộ](/vi/plugins/architecture-internals#gateway-http-routes)                   |
| Lệnh con CLI           | `api.registerCli(...)`                           | [Điểm vào](/vi/plugins/sdk-entrypoints)                                            |

Để biết đầy đủ registration API, xem [Tổng quan SDK](/vi/plugins/sdk-overview#registration-api).

Plugin được đóng gói có thể dùng `api.registerAgentToolResultMiddleware(...)` khi chúng
cần ghi lại kết quả công cụ bất đồng bộ trước khi mô hình thấy đầu ra. Khai báo
các runtime được nhắm tới trong `contracts.agentToolResultMiddleware`, ví dụ
`["pi", "codex"]`. Đây là một điểm nối đáng tin cậy dành cho Plugin được đóng gói; Plugin
bên ngoài nên ưu tiên các hook Plugin OpenClaw thông thường trừ khi OpenClaw có thêm
một chính sách tin cậy rõ ràng cho khả năng này.

Nếu Plugin của bạn đăng ký các phương thức RPC Gateway tùy chỉnh, hãy giữ chúng trên một
tiền tố riêng của Plugin. Các namespace quản trị lõi (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn phân giải thành
`operator.admin`, ngay cả khi một Plugin yêu cầu phạm vi hẹp hơn.

Ngữ nghĩa bảo vệ hook cần ghi nhớ:

- `before_tool_call`: `{ block: true }` là kết thúc và dừng các handler có mức ưu tiên thấp hơn.
- `before_tool_call`: `{ block: false }` được xem là không có quyết định.
- `before_tool_call`: `{ requireApproval: true }` tạm dừng thực thi agent và nhắc người dùng phê duyệt qua lớp phủ phê duyệt exec, các nút Telegram, tương tác Discord, hoặc lệnh `/approve` trên bất kỳ kênh nào.
- `before_install`: `{ block: true }` là kết thúc và dừng các handler có mức ưu tiên thấp hơn.
- `before_install`: `{ block: false }` được xem là không có quyết định.
- `message_sending`: `{ cancel: true }` là kết thúc và dừng các handler có mức ưu tiên thấp hơn.
- `message_sending`: `{ cancel: false }` được xem là không có quyết định.
- `message_received`: ưu tiên trường có kiểu `threadId` khi bạn cần định tuyến thread/chủ đề gửi đến. Giữ `metadata` cho phần bổ sung riêng theo kênh.
- `message_sending`: ưu tiên các trường định tuyến có kiểu `replyToId` / `threadId` thay cho các khóa metadata riêng theo kênh.

Lệnh `/approve` xử lý cả phê duyệt exec và phê duyệt Plugin với cơ chế dự phòng có giới hạn: khi không tìm thấy id phê duyệt exec, OpenClaw thử lại cùng id đó qua phê duyệt Plugin. Việc chuyển tiếp phê duyệt Plugin có thể được cấu hình độc lập qua `approvals.plugin` trong cấu hình.

Nếu phần kết nối phê duyệt tùy chỉnh cần phát hiện cùng trường hợp dự phòng có giới hạn đó,
hãy ưu tiên `isApprovalNotFoundError` từ `openclaw/plugin-sdk/error-runtime`
thay vì tự khớp chuỗi hết hạn phê duyệt thủ công.

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

Người dùng bật các công cụ tùy chọn trong cấu hình:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tên công cụ không được xung đột với công cụ lõi (xung đột sẽ bị bỏ qua)
- Các công cụ có đối tượng đăng ký không đúng định dạng, bao gồm thiếu `parameters`, sẽ bị bỏ qua và được báo cáo trong chẩn đoán Plugin thay vì làm hỏng các lần chạy agent
- Dùng `optional: true` cho các công cụ có tác dụng phụ hoặc yêu cầu thêm binary
- Người dùng có thể bật tất cả công cụ từ một Plugin bằng cách thêm id Plugin vào `tools.allow`

## Quy ước import

Luôn import từ các đường dẫn tập trung `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Để xem tham chiếu đầy đủ về đường dẫn con, hãy xem [Tổng quan SDK](/vi/plugins/sdk-overview).

Trong Plugin của bạn, hãy dùng các tệp barrel cục bộ (`api.ts`, `runtime-api.ts`) cho
các lệnh nhập nội bộ — tuyệt đối không nhập chính Plugin của bạn thông qua đường dẫn SDK của nó.

Đối với Plugin nhà cung cấp, hãy giữ các helper dành riêng cho nhà cung cấp trong các
barrel ở gốc gói đó, trừ khi seam thật sự mang tính chung. Các ví dụ tích hợp hiện tại:

- Anthropic: các wrapper luồng Claude và helper `service_tier` / beta
- OpenAI: builder nhà cung cấp, helper mô hình mặc định, nhà cung cấp thời gian thực
- OpenRouter: builder nhà cung cấp cùng helper hướng dẫn ban đầu/cấu hình

Nếu một helper chỉ hữu ích bên trong một gói nhà cung cấp tích hợp, hãy giữ nó trên
seam ở gốc gói đó thay vì đưa nó lên `openclaw/plugin-sdk/*`.

Một số seam helper `openclaw/plugin-sdk/<bundled-id>` được tạo vẫn còn tồn tại để
bảo trì Plugin tích hợp khi chúng có mức sử dụng của chủ sở hữu đã được theo dõi. Hãy xem chúng là
bề mặt dành riêng, không phải mẫu mặc định cho các Plugin bên thứ ba mới.

## Danh sách kiểm tra trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Manifest **openclaw.plugin.json** tồn tại và hợp lệ</Check>
<Check>Điểm vào dùng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Tất cả lệnh nhập dùng đường dẫn `plugin-sdk/<subpath>` tập trung</Check>
<Check>Lệnh nhập nội bộ dùng module cục bộ, không tự nhập qua SDK</Check>
<Check>Kiểm thử chạy thành công (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` chạy thành công (Plugin trong repo)</Check>

## Kiểm thử bản phát hành beta

1. Theo dõi các thẻ phát hành GitHub trên [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) và đăng ký qua `Watch` > `Releases`. Thẻ beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể bật thông báo cho tài khoản X chính thức của OpenClaw [@openclaw](https://x.com/openclaw) để nhận thông báo phát hành.
2. Kiểm thử Plugin của bạn với thẻ beta ngay khi thẻ xuất hiện. Khoảng thời gian trước bản ổn định thường chỉ kéo dài vài giờ.
3. Đăng trong luồng của Plugin của bạn ở kênh Discord `plugin-forum` sau khi kiểm thử, với nội dung `all good` hoặc phần bị hỏng. Nếu bạn chưa có luồng, hãy tạo một luồng.
4. Nếu có gì đó hỏng, hãy mở hoặc cập nhật một issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Đặt liên kết issue trong luồng của bạn.
5. Mở một PR tới `main` với tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn luồng Discord của bạn. Cộng tác viên không thể gắn nhãn PR, vì vậy tiêu đề là tín hiệu phía PR cho maintainer và tự động hóa. Các blocker có PR sẽ được hợp nhất; blocker không có PR vẫn có thể được phát hành. Maintainer theo dõi các luồng này trong quá trình kiểm thử beta.
6. Im lặng nghĩa là xanh. Nếu bạn bỏ lỡ khoảng thời gian này, bản sửa của bạn nhiều khả năng sẽ vào chu kỳ tiếp theo.

## Bước tiếp theo

<CardGroup cols={2}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng Plugin kênh nhắn tin
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng Plugin nhà cung cấp mô hình
  </Card>
  <Card title="Tổng quan SDK" icon="book-open" href="/vi/plugins/sdk-overview">
    Tham chiếu bản đồ nhập và API đăng ký
  </Card>
  <Card title="Helper runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, tìm kiếm, subagent qua api.runtime
  </Card>
  <Card title="Kiểm thử" icon="test-tubes" href="/vi/plugins/sdk-testing">
    Tiện ích và mẫu kiểm thử
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/vi/plugins/manifest">
    Tham chiếu đầy đủ về schema manifest
  </Card>
</CardGroup>

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — phân tích sâu kiến trúc nội bộ
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu SDK Plugin
- [Manifest](/vi/plugins/manifest) — định dạng manifest Plugin
- [Plugin kênh](/vi/plugins/sdk-channel-plugins) — xây dựng Plugin kênh
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) — xây dựng Plugin nhà cung cấp
