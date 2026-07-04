---
doc-schema-version: 1
read_when:
    - Bạn muốn tạo một Plugin OpenClaw mới
    - Bạn cần hướng dẫn bắt đầu nhanh để phát triển Plugin
    - Bạn đang chọn giữa tài liệu về kênh, nhà cung cấp, backend CLI, công cụ hoặc hook
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-07-04T10:47:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin mở rộng OpenClaw mà không thay đổi phần lõi. Một plugin có thể thêm kênh nhắn tin, nhà cung cấp mô hình, backend CLI cục bộ, công cụ agent, hook, nhà cung cấp media, hoặc một khả năng khác do plugin sở hữu.

Bạn không cần thêm plugin bên ngoài vào kho OpenClaw. Hãy phát hành package lên [ClawHub](/vi/clawhub) và người dùng cài đặt bằng:

```bash
openclaw plugins install clawhub:<package-name>
```

Đặc tả package trần vẫn cài đặt từ npm trong giai đoạn chuyển đổi khi ra mắt. Dùng tiền tố `clawhub:` khi bạn muốn phân giải qua ClawHub.

## Yêu cầu

- Dùng Node 22.19+, Node 23.11+, hoặc Node 24+ và một trình quản lý package như `npm` hoặc `pnpm`.
- Quen thuộc với các module TypeScript ESM.
- Với công việc trên plugin bundled trong repo, hãy clone kho và chạy `pnpm install`.
  Phát triển plugin từ source-checkout chỉ dùng pnpm vì OpenClaw tải các plugin bundled
  từ package workspace `extensions/*`.

## Chọn hình dạng plugin

<CardGroup cols={2}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Kết nối OpenClaw với một nền tảng nhắn tin.
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Thêm nhà cung cấp mô hình, media, tìm kiếm, fetch, giọng nói, hoặc realtime.
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Chạy CLI AI cục bộ thông qua fallback mô hình OpenClaw.
  </Card>
  <Card title="Plugin công cụ" icon="wrench" href="/vi/plugins/tool-plugins">
    Đăng ký công cụ agent.
  </Card>
</CardGroup>

## Khởi động nhanh

Xây dựng một plugin công cụ tối thiểu bằng cách đăng ký một công cụ agent bắt buộc. Đây là
hình dạng plugin hữu ích ngắn nhất và thể hiện package, manifest, entry point, và
bằng chứng cục bộ.

<Steps>
  <Step title="Tạo metadata package">
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

    Plugin bên ngoài đã phát hành nên trỏ các mục runtime tới các tệp JavaScript
    đã build. Xem [entry point SDK](/vi/plugins/sdk-entrypoints) để biết toàn bộ hợp đồng
    entry point.

    Mọi plugin đều cần manifest, kể cả khi không có config. Công cụ runtime
    phải xuất hiện trong `contracts.tools` để OpenClaw có thể phát hiện quyền sở hữu mà không
    tải trước mọi runtime plugin. Đặt `activation.onStartup`
    một cách có chủ ý. Ví dụ này khởi động khi Gateway khởi động.

    Các bề mặt plugin được host tin cậy cũng được kiểm soát bằng manifest và yêu cầu
    bật rõ ràng đối với plugin đã cài đặt. Nếu một plugin đã cài đặt đăng ký
    `api.registerAgentToolResultMiddleware(...)`, hãy khai báo từng runtime đích trong
    `contracts.agentToolResultMiddleware`. Nếu nó đăng ký
    `api.registerTrustedToolPolicy(...)`, hãy khai báo từng id chính sách trong
    `contracts.trustedToolPolicies`. Các khai báo này giữ cho việc kiểm tra khi cài đặt
    và đăng ký runtime đồng bộ với nhau.

    Với mọi trường manifest, xem [manifest Plugin](/vi/plugins/manifest).

  </Step>

  <Step title="Đăng ký công cụ">
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

    Dùng `definePluginEntry` cho plugin không phải kênh. Plugin kênh dùng
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Kiểm thử runtime">
    Với plugin đã cài đặt hoặc plugin bên ngoài, kiểm tra runtime đã tải:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Nếu plugin đăng ký một lệnh CLI, hãy chạy cả lệnh đó. Ví dụ,
    một lệnh demo nên có bằng chứng thực thi như
    `openclaw demo-plugin ping`.

    Với plugin bundled trong kho này, OpenClaw phát hiện các package plugin
    source-checkout từ workspace `extensions/*`. Chạy bài kiểm thử nhắm mục tiêu gần nhất:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Phát hành">
    Xác thực package trước khi phát hành:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Các snippet ClawHub chuẩn nằm trong `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Cài đặt">
    Cài đặt package đã phát hành qua ClawHub:

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

Công cụ tùy chọn kiểm soát việc một công cụ có được đưa ra cho mô hình hay không. Dùng
[yêu cầu quyền plugin](/vi/plugins/plugin-permission-requests) khi một công cụ
hoặc hook nên yêu cầu phê duyệt sau khi mô hình chọn nó và trước khi
hành động chạy.

Dùng công cụ tùy chọn cho tác dụng phụ, binary bất thường, hoặc khả năng
không nên được đưa ra mặc định. Tên công cụ không được xung đột với công cụ lõi;
xung đột sẽ bị bỏ qua và được báo cáo trong chẩn đoán plugin. Các đăng ký
không đúng định dạng, bao gồm mô tả công cụ không có `parameters`, bị bỏ qua và
được báo cáo theo cùng cách. Công cụ đã đăng ký là các hàm có kiểu mà mô hình có thể gọi
sau khi vượt qua kiểm tra chính sách và allowlist.

Factory công cụ nhận một đối tượng context do runtime cung cấp. Dùng `ctx.activeModel`
khi một công cụ cần ghi log, hiển thị, hoặc thích ứng với mô hình đang hoạt động cho
turn hiện tại. Đối tượng có thể bao gồm `provider`, `modelId`, và `modelRef`. Hãy xem nó là
metadata runtime mang tính thông tin, không phải ranh giới bảo mật chống lại
operator cục bộ, mã plugin đã cài đặt, hoặc runtime OpenClaw đã bị sửa đổi. Công cụ cục bộ
nhạy cảm vẫn nên yêu cầu chọn tham gia rõ ràng từ plugin hoặc operator và fail closed
khi metadata active-model bị thiếu hoặc không phù hợp.

Manifest khai báo quyền sở hữu và khám phá; việc thực thi vẫn gọi implementation
công cụ đã đăng ký trực tiếp. Giữ `toolMetadata.<tool>.optional: true`
đồng bộ với `api.registerTool(..., { optional: true })` để OpenClaw có thể tránh
tải runtime plugin đó cho đến khi công cụ được allowlist rõ ràng.

## Quy ước import

Import từ các subpath SDK tập trung:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Không import từ root barrel đã ngừng dùng:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Trong package plugin của bạn, dùng các tệp barrel cục bộ như `api.ts` và
`runtime-api.ts` cho import nội bộ. Không import chính plugin của bạn qua
đường dẫn SDK. Helper dành riêng cho nhà cung cấp nên ở lại trong package nhà cung cấp trừ khi
seam thực sự mang tính chung.

Các phương thức RPC Gateway tùy chỉnh là entry point nâng cao. Giữ chúng trên một
tiền tố dành riêng cho plugin; các namespace quản trị lõi như `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, và `update.*` vẫn được dành riêng
và phân giải thành `operator.admin`. Bridge
`openclaw/plugin-sdk/gateway-method-runtime` được dành riêng cho route HTTP plugin
khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Để xem toàn bộ bản đồ import, xem [tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Checklist trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Manifest **openclaw.plugin.json** hiện diện và hợp lệ</Check>
<Check>Entry point dùng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Mọi import dùng đường dẫn `plugin-sdk/<subpath>` tập trung</Check>
<Check>Import nội bộ dùng module cục bộ, không tự import qua SDK</Check>
<Check>Kiểm thử vượt qua (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` vượt qua (plugin trong repo)</Check>

## Kiểm thử với bản phát hành beta

1. Theo dõi tag phát hành GitHub trên [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) và đăng ký qua `Watch` > `Releases`. Tag beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể bật thông báo cho tài khoản X chính thức của OpenClaw [@openclaw](https://x.com/openclaw) để nhận thông báo phát hành.
2. Kiểm thử plugin của bạn với tag beta ngay khi nó xuất hiện. Khoảng thời gian trước bản stable thường chỉ vài giờ.
3. Đăng trong thread của plugin của bạn trong kênh Discord `plugin-forum` sau khi kiểm thử với `all good` hoặc nội dung bị lỗi. Nếu bạn chưa có thread, hãy tạo một thread.
4. Nếu có gì đó bị lỗi, mở hoặc cập nhật issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng label `beta-blocker`. Đặt liên kết issue trong thread của bạn.
5. Mở PR tới `main` có tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn thread Discord của bạn. Contributor không thể gắn label cho PR, nên tiêu đề là tín hiệu phía PR cho maintainer và automation. Blocker có PR sẽ được merge; blocker không có PR vẫn có thể được phát hành. Maintainer theo dõi các thread này trong quá trình kiểm thử beta.
6. Im lặng nghĩa là xanh. Nếu bạn bỏ lỡ khoảng thời gian này, bản sửa của bạn nhiều khả năng sẽ vào chu kỳ tiếp theo.

## Bước tiếp theo

<CardGroup cols={2}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng plugin kênh nhắn tin
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng plugin nhà cung cấp mô hình
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Đăng ký backend CLI AI cục bộ
  </Card>
  <Card title="Tổng quan SDK" icon="book-open" href="/vi/plugins/sdk-overview">
    Bản đồ import và tham chiếu API đăng ký
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

- [Hook Plugin](/vi/plugins/hooks)
- [Kiến trúc Plugin](/vi/plugins/architecture)
