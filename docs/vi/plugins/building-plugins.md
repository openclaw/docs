---
doc-schema-version: 1
read_when:
    - Bạn muốn tạo một plugin OpenClaw mới
    - Bạn cần hướng dẫn bắt đầu nhanh để phát triển plugin
    - Bạn đang chọn giữa tài liệu về kênh, nhà cung cấp, backend CLI, công cụ hoặc hook
sidebarTitle: Getting Started
summary: Tạo plugin OpenClaw đầu tiên của bạn chỉ trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-07-20T04:40:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b2dbf37b2b1c62dd0079ad1db5f8a09b1572b5a6fcc61ae798a7f053dcc1aff1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw mà không thay đổi phần lõi. Một plugin có thể thêm kênh
nhắn tin, nhà cung cấp mô hình, backend CLI cục bộ, công cụ tác tử, hook, nhà cung cấp
phương tiện hoặc một khả năng khác do plugin sở hữu.

Bạn không cần thêm plugin bên ngoài vào kho lưu trữ OpenClaw. Hãy phát hành
gói lên [ClawHub](/vi/clawhub), sau đó người dùng cài đặt bằng:

```bash
openclaw plugins install clawhub:<package-name>
```

Các đặc tả gói không có tiền tố vẫn được cài đặt từ npm trong giai đoạn chuyển đổi khi ra mắt. Sử dụng
tiền tố `clawhub:` khi bạn muốn phân giải qua ClawHub.

## Yêu cầu

- Node 22.22.3+, Node 24.15+ hoặc Node 25.9+, cùng với `npm` hoặc `pnpm`.
- Các mô-đun TypeScript ESM.
- Đối với công việc trên plugin đi kèm trong kho lưu trữ, hãy sao chép kho lưu trữ và chạy `pnpm install`.
  Việc phát triển plugin từ bản mã nguồn chỉ hỗ trợ pnpm vì OpenClaw phát hiện
  các plugin đi kèm từ những gói workspace `extensions/*`.

## Chọn dạng plugin

<CardGroup cols={2}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Kết nối OpenClaw với một nền tảng nhắn tin.
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Thêm nhà cung cấp mô hình, phương tiện, tìm kiếm, truy xuất, giọng nói hoặc thời gian thực.
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Chạy CLI AI cục bộ thông qua cơ chế dự phòng mô hình của OpenClaw.
  </Card>
  <Card title="Plugin công cụ" icon="wrench" href="/vi/plugins/tool-plugins">
    Đăng ký các công cụ tác tử.
  </Card>
</CardGroup>

## Bắt đầu nhanh

Xây dựng một plugin công cụ tối thiểu bằng cách đăng ký một công cụ tác tử bắt buộc. Đây là
dạng plugin hữu ích ngắn gọn nhất và bao quát gói, tệp kê khai, điểm vào và
bước kiểm chứng cục bộ.

<Steps>
  <Step title="Tạo siêu dữ liệu gói">
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

    Các plugin bên ngoài đã phát hành nên trỏ điểm vào thời gian chạy đến các tệp
    JavaScript đã dựng. Xem [Điểm vào SDK](/vi/plugins/sdk-entrypoints) để biết đầy đủ
    hợp đồng điểm vào.

    Mọi plugin đều cần tệp kê khai, ngay cả khi không có cấu hình. Các công cụ thời gian chạy phải
    xuất hiện trong `contracts.tools` để OpenClaw có thể phát hiện quyền sở hữu mà không
    phải nạp trước thời gian chạy của mọi plugin. Hãy thiết lập `activation.onStartup`
    một cách có chủ đích; ví dụ này nạp khi Gateway khởi động.

    Các bề mặt plugin được máy chủ tin cậy cũng bị kiểm soát bằng tệp kê khai và yêu cầu
    khai báo rõ ràng đối với plugin đã cài đặt: `api.registerAgentToolResultMiddleware(...)`
    cần từng thời gian chạy đích được liệt kê trong `contracts.agentToolResultMiddleware`,
    còn `api.registerTrustedToolPolicy(...)` cần từng mã định danh chính sách trong
    `contracts.trustedToolPolicies`. Các khai báo này giữ cho việc kiểm tra lúc cài đặt
    và đăng ký thời gian chạy đồng bộ với nhau.

    Để biết mọi trường trong tệp kê khai, hãy xem [Tệp kê khai plugin](/vi/plugins/manifest).

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
          outputSchema: Type.Object(
            { input: Type.String() },
            { additionalProperties: false },
          ),
          async execute(_id, params) {
            const details = { input: params.input };
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
              details,
            };
          },
        });
      },
    });
    ```

    Sử dụng `definePluginEntry` cho các plugin không phải plugin kênh. Plugin kênh sử dụng
    `defineChannelPluginEntry` từ `openclaw/plugin-sdk/core` thay thế.

  </Step>

  <Step title="Kiểm thử thời gian chạy">
    Đối với plugin đã cài đặt hoặc plugin bên ngoài, hãy kiểm tra thời gian chạy đã nạp:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Nếu plugin đăng ký một lệnh CLI, hãy chạy cả lệnh đó và xác nhận
    đầu ra, ví dụ `openclaw demo-plugin ping`.

    Đối với plugin đi kèm trong kho lưu trữ này, OpenClaw phát hiện các gói plugin
    từ bản mã nguồn trong workspace `extensions/*`. Chạy bài kiểm thử có phạm vi gần nhất:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Kiểm thử cài đặt gói">
    Trước khi phát hành một plugin sẵn sàng đóng gói, hãy kiểm thử đúng dạng cài đặt mà người dùng
    sẽ nhận được. Trước tiên, thêm một bước dựng, trỏ các điểm vào thời gian chạy như
    `openclaw.extensions` đến JavaScript đã dựng như `./dist/index.js`, đồng thời đảm bảo
    `npm pack` bao gồm đầu ra `dist/` đó. Điểm vào mã nguồn TypeScript
    chỉ dành cho bản mã nguồn và đường dẫn phát triển cục bộ.

    Sau đó đóng gói plugin và cài đặt tarball bằng `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` sử dụng dự án npm riêng cho từng plugin do OpenClaw quản lý, vì vậy nó phát hiện
    các lỗi phụ thuộc thời gian chạy mà kiểm thử từ bản mã nguồn có thể che khuất. Bước này chứng minh
    dạng gói và phụ thuộc, không chứng minh độ tin cậy chính thức được liên kết với danh mục.
    Các mục nhập thời gian chạy phải nằm trong `dependencies` hoặc `optionalDependencies`;
    các phụ thuộc chỉ còn trong `devDependencies` sẽ không được cài đặt cho
    dự án thời gian chạy được quản lý.

    Không sử dụng cài đặt trực tiếp từ tệp lưu trữ/đường dẫn làm bằng chứng cuối cùng cho hành vi
    plugin chính thức hoặc có đặc quyền. Mã nguồn trực tiếp hữu ích để gỡ lỗi cục bộ, nhưng
    không chứng minh cùng đường dẫn phụ thuộc như cài đặt qua npm hoặc ClawHub. Nếu
    plugin của bạn dựa vào trạng thái plugin chính thức đáng tin cậy, hãy thêm bước kiểm chứng thứ hai
    thông qua cài đặt chính thức dựa trên danh mục hoặc đường dẫn gói đã phát hành có
    ghi nhận độ tin cậy chính thức. Xem
    [Phân giải phụ thuộc plugin](/vi/plugins/dependency-resolution) để biết
    chi tiết về thư mục gốc cài đặt và quyền sở hữu phụ thuộc.

  </Step>

  <Step title="Phát hành">
    Xác thực gói trước khi phát hành:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Các đoạn mã gói ClawHub chuẩn nằm trong `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Cài đặt">
    Cài đặt gói đã phát hành thông qua ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Đăng ký công cụ

Công cụ có thể là bắt buộc hoặc tùy chọn. Công cụ bắt buộc luôn khả dụng khi
plugin được bật. Công cụ tùy chọn cần người dùng chủ động chọn dùng trước khi OpenClaw
nạp thời gian chạy của plugin sở hữu.

Các hàm tạo công cụ nhận ngữ cảnh thời gian chạy đáng tin cậy, bao gồm `deliveryContext`,
`nativeChannelId` cho cuộc hội thoại đang hoạt động trên nền tảng khi có sẵn, và
`requesterSenderId`.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      outputSchema: Type.Object(
        { pipeline: Type.String() },
        { additionalProperties: false },
      ),
      async execute(_id, params) {
        return {
          content: [{ type: "text", text: params.pipeline }],
          details: { pipeline: params.pipeline },
        };
      },
    },
    { optional: true },
  );
}
```

`outputSchema` là tùy chọn. Nó mô tả giá trị `details` có cấu trúc được
[Chế độ mã](/vi/tools/code-mode) và [Tìm kiếm công cụ](/vi/tools/tool-search) sử dụng. Các lệnh gọi
danh mục từ chối lược đồ không hợp lệ trước khi thực thi và xác thực giá trị cuối cùng sau
các hook công cụ. Bỏ qua trường này đối với công cụ không có kết quả JSON ổn định. Xem
[Plugin công cụ](/vi/plugins/tool-plugins#output-contracts) để biết đầy đủ hợp đồng.

Mọi công cụ được đăng ký bằng `api.registerTool(...)` cũng phải được khai báo trong
tệp kê khai plugin:

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

Người dùng chủ động chọn dùng qua `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Công cụ tùy chọn kiểm soát việc một công cụ có được cung cấp cho mô hình hay không. Sử dụng
[yêu cầu quyền plugin](/vi/plugins/plugin-permission-requests) khi một công cụ
hoặc hook cần yêu cầu phê duyệt sau khi mô hình chọn nó và trước khi
hành động chạy.

Sử dụng công cụ tùy chọn cho các hiệu ứng phụ, tệp nhị phân ít dùng hoặc khả năng
không nên được cung cấp theo mặc định. Tên công cụ không được xung đột với tên công cụ
lõi; xung đột sẽ bị bỏ qua và được báo cáo trong chẩn đoán plugin. Các lượt
đăng ký không đúng định dạng cũng bị bỏ qua và báo cáo theo cùng cách: thiếu
`name` không rỗng, `execute` không phải hàm hoặc bộ mô tả công cụ không có đối tượng `parameters`.

Các hàm tạo công cụ nhận một đối tượng ngữ cảnh do thời gian chạy cung cấp. Sử dụng `ctx.activeModel`
khi công cụ cần ghi nhật ký, hiển thị hoặc điều chỉnh theo mô hình đang hoạt động cho lượt
hiện tại; đối tượng này có thể bao gồm `provider`, `modelId` và `modelRef`. Hãy xem đây là
siêu dữ liệu thời gian chạy mang tính thông tin, không phải ranh giới bảo mật chống lại người vận hành
cục bộ, mã plugin đã cài đặt hoặc thời gian chạy OpenClaw đã sửa đổi. Các công cụ
cục bộ nhạy cảm vẫn nên yêu cầu plugin hoặc người vận hành chủ động cho phép một cách rõ ràng và
từ chối theo hướng an toàn khi siêu dữ liệu mô hình đang hoạt động bị thiếu hoặc không phù hợp.

Tệp kê khai khai báo quyền sở hữu và khả năng phát hiện; việc thực thi vẫn gọi
phần triển khai công cụ đang được đăng ký trực tiếp. Giữ `toolMetadata.<tool>.optional: true`
đồng bộ với `api.registerTool(..., { optional: true })` để OpenClaw có thể tránh
nạp thời gian chạy của plugin đó cho đến khi công cụ được đưa rõ ràng vào danh sách cho phép.

## Quy ước nhập

Nhập từ các đường dẫn con SDK chuyên biệt:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Trong gói plugin của bạn, sử dụng các tệp barrel cục bộ như `api.ts` và
`runtime-api.ts` cho các mục nhập nội bộ. Không nhập chính plugin của bạn thông qua
đường dẫn SDK. Các trình trợ giúp dành riêng cho nhà cung cấp nên nằm trong gói nhà cung cấp trừ khi
ranh giới đó thực sự dùng chung.

Các phương thức RPC Gateway tùy chỉnh là một điểm vào nâng cao. Giữ chúng trong
tiền tố dành riêng cho plugin; các không gian tên quản trị lõi như `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` và `update.*` vẫn được dành riêng
và phân giải thành `operator.admin`. Cầu nối
`openclaw/plugin-sdk/gateway-method-runtime` được dành riêng cho các tuyến HTTP của plugin
khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Để biết bản đồ nhập đầy đủ, hãy xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Danh sách kiểm tra trước khi gửi

<Check>**package.json** có siêu dữ liệu `openclaw` chính xác</Check>
<Check>Tệp kê khai **openclaw.plugin.json** hiện diện và hợp lệ</Check>
<Check>Điểm vào sử dụng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Mọi mục nhập đều sử dụng các đường dẫn `plugin-sdk/<subpath>` chuyên biệt</Check>
<Check>Các mục nhập nội bộ sử dụng mô-đun cục bộ, không tự nhập qua SDK</Check>
<Check>Các bài kiểm thử đạt (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` đạt (plugin trong kho lưu trữ)</Check>

## Kiểm thử với các bản phát hành beta

1. Theo dõi các bản phát hành của [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Các thẻ beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể theo dõi [@openclaw](https://x.com/openclaw) trên X để nhận thông báo phát hành.
2. Kiểm thử plugin của bạn với thẻ beta ngay khi thẻ xuất hiện. Khoảng thời gian trước khi phát hành bản ổn định thường chỉ kéo dài vài giờ.
3. Sau khi kiểm thử, hãy đăng trong luồng của plugin tại kênh Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), với `all good` hoặc nội dung đã gặp lỗi. Hãy tạo một luồng nếu bạn chưa có.
4. Nếu có lỗi, hãy mở hoặc cập nhật một issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Liên kết issue trong luồng của bạn.
5. Mở một PR đến `main` với tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn luồng Discord của bạn. Người đóng góp không thể gắn nhãn PR, vì vậy tiêu đề là tín hiệu phía PR dành cho các maintainer và quy trình tự động hóa. Các lỗi chặn có PR sẽ được hợp nhất; các lỗi chặn không có PR vẫn có thể được phát hành.
6. Im lặng nghĩa là mọi thứ đều ổn. Bỏ lỡ khoảng thời gian này thường có nghĩa là bản sửa lỗi của bạn sẽ được đưa vào chu kỳ tiếp theo.

## Các bước tiếp theo

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
  <Card title="Tổng quan về SDK" icon="book-open" href="/vi/plugins/sdk-overview">
    Tài liệu tham khảo về sơ đồ nhập và API đăng ký
  </Card>
  <Card title="Trình trợ giúp runtime" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, tìm kiếm, subagent qua api.runtime
  </Card>
  <Card title="Kiểm thử" icon="test-tubes" href="/vi/plugins/sdk-testing">
    Các tiện ích và mẫu kiểm thử
  </Card>
  <Card title="Manifest plugin" icon="file-json" href="/vi/plugins/manifest">
    Tài liệu tham khảo đầy đủ về lược đồ manifest
  </Card>
</CardGroup>

## Liên quan

- [Hook plugin](/vi/plugins/hooks)
- [Kiến trúc plugin](/vi/plugins/architecture)
