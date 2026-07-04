---
doc-schema-version: 1
read_when:
    - Bạn muốn tạo một Plugin OpenClaw mới
    - Bạn cần một hướng dẫn bắt đầu nhanh để phát triển plugin
    - Bạn đang chọn giữa tài liệu kênh, nhà cung cấp, backend CLI, công cụ hoặc hook
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn chỉ trong vài phút
title: Xây dựng các Plugin
x-i18n:
    generated_at: "2026-07-04T15:23:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin mở rộng OpenClaw mà không thay đổi phần lõi. Một Plugin có thể thêm kênh nhắn tin, nhà cung cấp mô hình, backend CLI cục bộ, công cụ agent, hook, nhà cung cấp phương tiện,
hoặc một năng lực khác do Plugin sở hữu.

Bạn không cần thêm Plugin bên ngoài vào kho lưu trữ OpenClaw. Hãy phát hành
gói lên [ClawHub](/vi/clawhub) và người dùng cài đặt bằng:

```bash
openclaw plugins install clawhub:<package-name>
```

Thông số gói trần vẫn cài đặt từ npm trong giai đoạn chuyển đổi ra mắt. Dùng
tiền tố `clawhub:` khi bạn muốn phân giải qua ClawHub.

## Yêu cầu

- Dùng Node 22.19+, Node 23.11+, hoặc Node 24+ và một trình quản lý gói như `npm` hoặc `pnpm`.
- Quen thuộc với các mô-đun TypeScript ESM.
- Với công việc trên Plugin đóng gói sẵn trong repo, hãy clone kho lưu trữ và chạy `pnpm install`.
  Phát triển Plugin từ source checkout chỉ dùng pnpm vì OpenClaw tải các Plugin
  đóng gói sẵn từ các gói workspace `extensions/*`.

## Chọn hình dạng Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Kết nối OpenClaw với một nền tảng nhắn tin.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Thêm một nhà cung cấp mô hình, phương tiện, tìm kiếm, fetch, giọng nói, hoặc realtime.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Chạy một CLI AI cục bộ thông qua cơ chế dự phòng mô hình của OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/vi/plugins/tool-plugins">
    Đăng ký công cụ agent.
  </Card>
</CardGroup>

## Khởi động nhanh

Xây dựng một Plugin công cụ tối thiểu bằng cách đăng ký một công cụ agent bắt buộc. Đây là
hình dạng Plugin hữu ích ngắn nhất và thể hiện gói, manifest, điểm vào, và
bằng chứng cục bộ.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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

    Plugin bên ngoài đã phát hành nên trỏ các mục nhập runtime tới các tệp JavaScript
    đã build. Xem [điểm vào SDK](/vi/plugins/sdk-entrypoints) để biết đầy đủ hợp đồng
    điểm vào.

    Mỗi Plugin cần một manifest, ngay cả khi không có cấu hình. Công cụ runtime
    phải xuất hiện trong `contracts.tools` để OpenClaw có thể phát hiện quyền sở hữu mà không
    cần tải sớm mọi runtime Plugin. Đặt `activation.onStartup`
    có chủ đích. Ví dụ này khởi động khi Gateway khởi động.

    Các bề mặt Plugin được host tin cậy cũng được kiểm soát bằng manifest và yêu cầu
    bật rõ ràng đối với Plugin đã cài đặt. Nếu một Plugin đã cài đặt đăng ký
    `api.registerAgentToolResultMiddleware(...)`, hãy khai báo từng runtime đích trong
    `contracts.agentToolResultMiddleware`. Nếu nó đăng ký
    `api.registerTrustedToolPolicy(...)`, hãy khai báo từng policy id trong
    `contracts.trustedToolPolicies`. Các khai báo này giữ cho việc kiểm tra lúc cài đặt
    và đăng ký runtime đồng bộ với nhau.

    Với mọi trường manifest, xem [manifest Plugin](/vi/plugins/manifest).

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

    Dùng `definePluginEntry` cho các Plugin không phải kênh. Plugin kênh dùng
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Với một Plugin đã cài đặt hoặc Plugin bên ngoài, hãy kiểm tra runtime đã tải:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Nếu Plugin đăng ký một lệnh CLI, hãy chạy cả lệnh đó. Ví dụ,
    một lệnh demo nên có bằng chứng thực thi như
    `openclaw demo-plugin ping`.

    Với một Plugin đóng gói sẵn trong kho lưu trữ này, OpenClaw phát hiện các
    gói Plugin từ source checkout trong workspace `extensions/*`. Chạy bài kiểm thử
    nhắm mục tiêu gần nhất:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    Trước khi phát hành một Plugin sẵn sàng đóng gói, hãy kiểm thử đúng hình dạng cài đặt
    mà người dùng sẽ nhận được. Trước tiên thêm bước build, trỏ các mục nhập runtime như
    `openclaw.extensions` tới JavaScript đã build như `./dist/index.js`, và đảm bảo
    `npm pack` bao gồm đầu ra `dist/` đó. Mục nhập mã nguồn TypeScript
    chỉ dành cho source checkout và đường dẫn phát triển cục bộ.

    Sau đó đóng gói Plugin và cài đặt tarball bằng `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` dùng dự án npm do OpenClaw quản lý cho từng Plugin, nên nó phát hiện
    các lỗi phụ thuộc runtime mà kiểm thử source checkout có thể che giấu. Nó chứng minh
    hình dạng gói và phụ thuộc, không phải độ tin cậy chính thức liên kết với catalog.
    Các import runtime phải nằm trong `dependencies` hoặc `optionalDependencies`;
    các phụ thuộc chỉ để trong `devDependencies` sẽ không được cài đặt cho
    dự án runtime được quản lý.

    Không dùng cài đặt archive/path thô làm bằng chứng cuối cùng cho hành vi Plugin
    chính thức hoặc đặc quyền. Mã nguồn thô hữu ích cho gỡ lỗi cục bộ, nhưng
    chúng không chứng minh cùng đường dẫn phụ thuộc như cài đặt npm hoặc ClawHub. Nếu
    Plugin của bạn dựa vào trạng thái Plugin chính thức đáng tin cậy, hãy thêm bằng chứng thứ hai
    thông qua một cài đặt chính thức dựa trên catalog hoặc một đường dẫn gói đã phát hành có
    ghi nhận độ tin cậy chính thức. Xem
    [phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution) để biết chi tiết về
    install-root và quyền sở hữu phụ thuộc.

  </Step>

  <Step title="Publish">
    Xác thực gói trước khi phát hành:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Các đoạn mẫu ClawHub chuẩn nằm trong `docs/snippets/plugin-publish/`.

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
Plugin được bật. Công cụ tùy chọn yêu cầu người dùng chọn tham gia.

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
manifest Plugin:

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
[yêu cầu quyền Plugin](/vi/plugins/plugin-permission-requests) khi một công cụ
hoặc hook nên yêu cầu phê duyệt sau khi mô hình chọn nó và trước khi
hành động chạy.

Dùng công cụ tùy chọn cho tác dụng phụ, binary ít phổ biến, hoặc năng lực
không nên được hiển thị theo mặc định. Tên công cụ không được xung đột với công cụ lõi;
xung đột sẽ bị bỏ qua và được báo cáo trong chẩn đoán Plugin. Các đăng ký
không đúng định dạng, bao gồm bộ mô tả công cụ không có `parameters`, sẽ bị bỏ qua và
được báo cáo theo cùng cách. Công cụ đã đăng ký là các hàm có kiểu mà mô hình có thể gọi
sau khi vượt qua kiểm tra chính sách và allowlist.

Factory công cụ nhận một đối tượng ngữ cảnh do runtime cung cấp. Dùng `ctx.activeModel`
khi một công cụ cần ghi log, hiển thị, hoặc thích ứng với mô hình đang hoạt động cho lượt
hiện tại. Đối tượng có thể bao gồm `provider`, `modelId`, và `modelRef`. Hãy xem nó là
metadata runtime mang tính thông tin, không phải ranh giới bảo mật chống lại operator
cục bộ, mã Plugin đã cài đặt, hoặc runtime OpenClaw đã sửa đổi. Công cụ cục bộ
nhạy cảm vẫn nên yêu cầu chọn tham gia rõ ràng từ Plugin hoặc operator và fail closed
khi metadata active-model bị thiếu hoặc không phù hợp.

Manifest khai báo quyền sở hữu và phát hiện; khi thực thi vẫn gọi phần triển khai
công cụ đã đăng ký trực tiếp. Giữ `toolMetadata.<tool>.optional: true`
đồng bộ với `api.registerTool(..., { optional: true })` để OpenClaw có thể tránh
tải runtime Plugin đó cho đến khi công cụ được đưa vào allowlist rõ ràng.

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

Trong gói Plugin của bạn, dùng các tệp barrel cục bộ như `api.ts` và
`runtime-api.ts` cho import nội bộ. Không import chính Plugin của bạn thông qua
đường dẫn SDK. Helper chuyên biệt cho nhà cung cấp nên ở lại trong gói nhà cung cấp trừ khi
đường nối thực sự có tính tổng quát.

Các phương thức RPC Gateway tùy chỉnh là một điểm vào nâng cao. Giữ chúng trên một
tiền tố riêng cho Plugin; các namespace quản trị lõi như `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, và `update.*` vẫn được dành riêng
và phân giải tới `operator.admin`. Cầu nối
`openclaw/plugin-sdk/gateway-method-runtime` được dành riêng cho các route HTTP của Plugin
khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Để xem đầy đủ bản đồ import, xem [tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Danh sách kiểm tra trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Manifest **openclaw.plugin.json** hiện diện và hợp lệ</Check>
<Check>Điểm vào dùng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Mọi import dùng đường dẫn `plugin-sdk/<subpath>` tập trung</Check>
<Check>Import nội bộ dùng mô-đun cục bộ, không tự import SDK</Check>
<Check>Kiểm thử pass (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pass (Plugin trong repo)</Check>

## Kiểm thử với bản phát hành beta

1. Theo dõi các thẻ phát hành GitHub trên [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) và đăng ký qua `Watch` > `Releases`. Thẻ beta có dạng như `v2026.3.N-beta.1`. Bạn cũng có thể bật thông báo cho tài khoản X chính thức của OpenClaw [@openclaw](https://x.com/openclaw) để nhận thông báo phát hành.
2. Kiểm thử plugin của bạn với thẻ beta ngay khi thẻ xuất hiện. Khoảng thời gian trước bản ổn định thường chỉ kéo dài vài giờ.
3. Đăng trong chuỗi thảo luận của plugin của bạn trong kênh Discord `plugin-forum` sau khi kiểm thử, với nội dung `all good` hoặc những gì bị lỗi. Nếu bạn chưa có chuỗi thảo luận, hãy tạo một chuỗi.
4. Nếu có lỗi, hãy mở hoặc cập nhật một issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Đặt liên kết issue vào chuỗi thảo luận của bạn.
5. Mở một PR tới `main` có tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn chuỗi Discord của bạn. Người đóng góp không thể gắn nhãn PR, vì vậy tiêu đề là tín hiệu phía PR dành cho người bảo trì và tự động hóa. Các lỗi chặn có PR sẽ được hợp nhất; các lỗi chặn không có PR vẫn có thể được phát hành. Người bảo trì theo dõi các chuỗi này trong quá trình kiểm thử beta.
6. Im lặng nghĩa là ổn. Nếu bạn bỏ lỡ khoảng thời gian này, bản sửa của bạn có khả năng sẽ được đưa vào chu kỳ tiếp theo.

## Bước tiếp theo

<CardGroup cols={2}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng plugin kênh nhắn tin
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng plugin nhà cung cấp mô hình
  </Card>
  <Card title="Plugin CLI Backend" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Đăng ký một backend CLI AI cục bộ
  </Card>
  <Card title="Tổng quan SDK" icon="book-open" href="/vi/plugins/sdk-overview">
    Tham chiếu API import map và đăng ký
  </Card>
  <Card title="Trợ giúp Runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, tìm kiếm, subagent qua api.runtime
  </Card>
  <Card title="Kiểm thử" icon="test-tubes" href="/vi/plugins/sdk-testing">
    Tiện ích và mẫu kiểm thử
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/vi/plugins/manifest">
    Tham chiếu lược đồ manifest đầy đủ
  </Card>
</CardGroup>

## Liên quan

- [Hook Plugin](/vi/plugins/hooks)
- [Kiến trúc plugin](/vi/plugins/architecture)
