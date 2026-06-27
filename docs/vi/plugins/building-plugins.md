---
doc-schema-version: 1
read_when:
    - Bạn muốn tạo một Plugin OpenClaw mới
    - Bạn cần hướng dẫn bắt đầu nhanh để phát triển Plugin
    - Bạn đang chọn giữa tài liệu về kênh, nhà cung cấp, backend CLI, công cụ hoặc hook
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn chỉ trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-06-27T17:43:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin mở rộng OpenClaw mà không cần thay đổi lõi. Một plugin có thể thêm
kênh nhắn tin, nhà cung cấp mô hình, backend CLI cục bộ, công cụ agent, hook,
nhà cung cấp media, hoặc một năng lực khác do plugin sở hữu.

Bạn không cần thêm plugin bên ngoài vào kho lưu trữ OpenClaw. Hãy phát hành
gói lên [ClawHub](/vi/clawhub) và người dùng cài đặt bằng:

```bash
openclaw plugins install clawhub:<package-name>
```

Thông số gói trần vẫn cài đặt từ npm trong giai đoạn chuyển đổi ra mắt. Dùng
tiền tố `clawhub:` khi bạn muốn phân giải qua ClawHub.

## Yêu cầu

- Dùng Node 22.19 trở lên và một trình quản lý gói như `npm` hoặc `pnpm`.
- Quen thuộc với các mô-đun TypeScript ESM.
- Với công việc trên plugin đóng gói sẵn trong repo, hãy clone kho lưu trữ và chạy `pnpm install`.
  Phát triển plugin từ source-checkout chỉ dùng pnpm vì OpenClaw tải các plugin
  đóng gói sẵn từ các gói workspace `extensions/*`.

## Chọn dạng plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Kết nối OpenClaw với một nền tảng nhắn tin.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Thêm nhà cung cấp mô hình, media, tìm kiếm, fetch, giọng nói hoặc realtime.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Chạy một CLI AI cục bộ thông qua cơ chế dự phòng mô hình của OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/vi/plugins/tool-plugins">
    Đăng ký công cụ agent.
  </Card>
</CardGroup>

## Bắt đầu nhanh

Xây dựng một tool plugin tối thiểu bằng cách đăng ký một công cụ agent bắt buộc. Đây là
dạng plugin hữu ích ngắn nhất và thể hiện gói, manifest, entry point, cũng như
bằng chứng cục bộ.

<Steps>
  <Step title="Create package metadata">
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

    Plugin bên ngoài đã phát hành nên trỏ các mục runtime tới tệp JavaScript
    đã build. Xem [entry point SDK](/vi/plugins/sdk-entrypoints) để biết toàn bộ
    hợp đồng entry point.

    Mọi plugin đều cần manifest, kể cả khi không có cấu hình. Công cụ runtime
    phải xuất hiện trong `contracts.tools` để OpenClaw có thể phát hiện quyền sở hữu mà không
    tải sớm mọi runtime plugin. Đặt `activation.onStartup`
    một cách có chủ đích. Ví dụ này khởi động khi Gateway khởi động.

    Các bề mặt plugin được host tin cậy cũng được kiểm soát bằng manifest và yêu cầu
    bật rõ ràng đối với plugin đã cài đặt. Nếu một plugin đã cài đặt đăng ký
    `api.registerAgentToolResultMiddleware(...)`, hãy khai báo từng runtime đích trong
    `contracts.agentToolResultMiddleware`. Nếu plugin đó đăng ký
    `api.registerTrustedToolPolicy(...)`, hãy khai báo từng policy id trong
    `contracts.trustedToolPolicies`. Những khai báo này giữ cho quá trình
    kiểm tra lúc cài đặt và đăng ký runtime được căn chỉnh.

    Với mọi trường manifest, xem [Plugin manifest](/vi/plugins/manifest).

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Dùng `definePluginEntry` cho các plugin không phải kênh. Plugin kênh dùng
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Với plugin đã cài đặt hoặc plugin bên ngoài, hãy kiểm tra runtime đã tải:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Nếu plugin đăng ký một lệnh CLI, hãy chạy cả lệnh đó. Ví dụ,
    một lệnh demo nên có bằng chứng thực thi như
    `openclaw demo-plugin ping`.

    Với plugin đóng gói sẵn trong kho lưu trữ này, OpenClaw phát hiện các gói
    plugin source-checkout từ workspace `extensions/*`. Chạy bài kiểm thử nhắm mục tiêu
    gần nhất:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Xác thực gói trước khi phát hành:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Các snippet ClawHub chuẩn nằm trong `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Cài đặt gói đã phát hành thông qua ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Đăng ký công cụ

Công cụ có thể là bắt buộc hoặc tùy chọn. Công cụ bắt buộc luôn khả dụng khi
plugin được bật. Công cụ tùy chọn yêu cầu người dùng chọn tham gia.

```typescript
register(api) {
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
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Người dùng chọn tham gia bằng `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Công cụ tùy chọn kiểm soát việc một công cụ có được hiển thị cho mô hình hay không. Dùng
[yêu cầu quyền plugin](/vi/plugins/plugin-permission-requests) khi một công cụ
hoặc hook nên yêu cầu phê duyệt sau khi mô hình chọn nó và trước khi
hành động chạy.

Dùng công cụ tùy chọn cho tác dụng phụ, binary ít dùng, hoặc các năng lực
không nên được hiển thị theo mặc định. Tên công cụ không được xung đột với công cụ lõi;
các xung đột sẽ bị bỏ qua và được báo cáo trong chẩn đoán plugin. Các đăng ký
không hợp lệ, bao gồm mô tả công cụ không có `parameters`, cũng bị bỏ qua và
được báo cáo theo cùng cách. Công cụ đã đăng ký là các hàm có kiểu mà mô hình có thể gọi
sau khi vượt qua kiểm tra policy và allowlist.

Tool factory nhận một đối tượng ngữ cảnh do runtime cung cấp. Dùng `ctx.activeModel`
khi công cụ cần ghi log, hiển thị, hoặc thích ứng với mô hình đang hoạt động cho lượt
hiện tại. Đối tượng có thể bao gồm `provider`, `modelId`, và `modelRef`. Hãy xem nó như
metadata runtime mang tính thông tin, không phải ranh giới bảo mật chống lại operator
cục bộ, mã plugin đã cài đặt, hoặc runtime OpenClaw đã bị sửa đổi. Các công cụ cục bộ
nhạy cảm vẫn nên yêu cầu opt-in rõ ràng từ plugin hoặc operator và fail closed
khi metadata mô hình đang hoạt động bị thiếu hoặc không phù hợp.

Manifest khai báo quyền sở hữu và phát hiện; việc thực thi vẫn gọi implementation
công cụ đã đăng ký đang hoạt động. Giữ `toolMetadata.<tool>.optional: true`
căn chỉnh với `api.registerTool(..., { optional: true })` để OpenClaw có thể tránh
tải runtime plugin đó cho đến khi công cụ được allowlist rõ ràng.

## Quy ước import

Import từ các subpath SDK tập trung:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Không import từ root barrel đã ngừng khuyến nghị:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Trong gói plugin của bạn, dùng các tệp barrel cục bộ như `api.ts` và
`runtime-api.ts` cho import nội bộ. Không import chính plugin của bạn thông qua
một đường dẫn SDK. Helper dành riêng cho provider nên ở lại trong gói provider trừ khi
seam thực sự mang tính tổng quát.

Phương thức RPC Gateway tùy chỉnh là một entry point nâng cao. Giữ chúng trên một
tiền tố dành riêng cho plugin; các namespace quản trị lõi như `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, và `update.*` vẫn được dành riêng
và phân giải tới `operator.admin`. Cầu nối
`openclaw/plugin-sdk/gateway-method-runtime` được dành riêng cho các route HTTP plugin
khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Để xem toàn bộ bản đồ import, xem [tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Danh sách kiểm tra trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Manifest **openclaw.plugin.json** tồn tại và hợp lệ</Check>
<Check>Entry point dùng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Mọi import dùng đường dẫn `plugin-sdk/<subpath>` tập trung</Check>
<Check>Import nội bộ dùng mô-đun cục bộ, không tự import qua SDK</Check>
<Check>Kiểm thử đạt (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` đạt (plugin trong repo)</Check>

## Kiểm thử với bản phát hành beta

1. Theo dõi các thẻ phát hành GitHub trên [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) và đăng ký qua `Watch` > `Releases`. Thẻ beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể bật thông báo cho tài khoản X chính thức của OpenClaw [@openclaw](https://x.com/openclaw) để nhận thông báo phát hành.
2. Kiểm thử plugin của bạn với thẻ beta ngay khi thẻ xuất hiện. Khoảng thời gian trước bản ổn định thường chỉ vài giờ.
3. Đăng trong thread của plugin trong kênh Discord `plugin-forum` sau khi kiểm thử với `all good` hoặc nội dung bị lỗi. Nếu bạn chưa có thread, hãy tạo một thread.
4. Nếu có lỗi, mở hoặc cập nhật một issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Đặt liên kết issue trong thread của bạn.
5. Mở một PR tới `main` có tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn thread Discord của bạn. Contributor không thể gắn nhãn PR, nên tiêu đề là tín hiệu phía PR cho maintainer và tự động hóa. Blocker có PR sẽ được merge; blocker không có PR vẫn có thể được ship. Maintainer theo dõi các thread này trong quá trình kiểm thử beta.
6. Im lặng nghĩa là xanh. Nếu bạn bỏ lỡ cửa sổ này, bản sửa của bạn có khả năng sẽ vào chu kỳ tiếp theo.

## Bước tiếp theo

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng plugin kênh nhắn tin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng plugin nhà cung cấp mô hình
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Đăng ký backend CLI AI cục bộ
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/vi/plugins/sdk-overview">
    Bản đồ import và tài liệu tham chiếu API đăng ký
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, tìm kiếm, subagent qua api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/vi/plugins/sdk-testing">
    Tiện ích và mẫu kiểm thử
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/vi/plugins/manifest">
    Tài liệu tham chiếu đầy đủ về schema manifest
  </Card>
</CardGroup>

## Liên quan

- [Hook plugin](/vi/plugins/hooks)
- [Kiến trúc plugin](/vi/plugins/architecture)
