---
doc-schema-version: 1
read_when:
    - Bạn muốn tạo một plugin OpenClaw mới
    - Bạn cần hướng dẫn bắt đầu nhanh để phát triển plugin
    - Bạn đang lựa chọn giữa tài liệu về kênh, nhà cung cấp, backend CLI, công cụ hoặc hook
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn chỉ trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-07-16T15:27:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin mở rộng OpenClaw mà không thay đổi phần lõi. Một plugin có thể thêm kênh
nhắn tin, nhà cung cấp mô hình, backend CLI cục bộ, công cụ tác nhân, hook, nhà cung cấp
phương tiện hoặc một khả năng khác do plugin sở hữu.

Bạn không cần thêm plugin bên ngoài vào kho lưu trữ OpenClaw. Hãy phát hành
gói lên [ClawHub](/clawhub), sau đó người dùng cài đặt bằng:

```bash
openclaw plugins install clawhub:<package-name>
```

Các đặc tả gói không có tiền tố vẫn được cài đặt từ npm trong giai đoạn chuyển đổi ra mắt. Sử dụng
tiền tố `clawhub:` khi bạn muốn phân giải qua ClawHub.

## Yêu cầu

- Node 22.22.3+, Node 24.15+ hoặc Node 25.9+, cùng `npm` hoặc `pnpm`.
- Các mô-đun TypeScript ESM.
- Đối với công việc trên plugin đi kèm trong kho lưu trữ, hãy sao chép kho lưu trữ và chạy `pnpm install`.
  Việc phát triển plugin từ bản mã nguồn chỉ hỗ trợ pnpm vì OpenClaw phát hiện
  các plugin đi kèm từ các gói không gian làm việc `extensions/*`.

## Chọn hình thức plugin

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
    Đăng ký các công cụ tác nhân.
  </Card>
</CardGroup>

## Bắt đầu nhanh

Xây dựng một plugin công cụ tối giản bằng cách đăng ký một công cụ tác nhân bắt buộc. Đây là
hình thức plugin hữu dụng ngắn gọn nhất và bao quát gói, tệp kê khai, điểm vào cũng như
bằng chứng cục bộ.

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

    Các plugin bên ngoài đã phát hành nên trỏ các mục nhập thời gian chạy đến những tệp JavaScript
    đã dựng. Xem [Điểm vào SDK](/vi/plugins/sdk-entrypoints) để biết đầy đủ hợp đồng
    điểm vào.

    Mọi plugin đều cần tệp kê khai, ngay cả khi không có cấu hình. Các công cụ thời gian chạy phải
    xuất hiện trong `contracts.tools` để OpenClaw có thể phát hiện quyền sở hữu mà không
    phải chủ động tải mọi thời gian chạy plugin. Hãy đặt `activation.onStartup`
    có chủ đích; ví dụ này tải khi Gateway khởi động.

    Các bề mặt plugin được máy chủ tin cậy cũng được kiểm soát bằng tệp kê khai và yêu cầu khai báo
    rõ ràng đối với plugin đã cài đặt: `api.registerAgentToolResultMiddleware(...)`
    cần từng thời gian chạy đích được liệt kê trong `contracts.agentToolResultMiddleware`,
    còn `api.registerTrustedToolPolicy(...)` cần từng mã định danh chính sách trong
    `contracts.trustedToolPolicies`. Những khai báo này giữ cho việc kiểm tra lúc cài đặt
    và đăng ký thời gian chạy đồng bộ với nhau.

    Để biết mọi trường trong tệp kê khai, xem [Tệp kê khai plugin](/vi/plugins/manifest).

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

    Sử dụng `definePluginEntry` cho các plugin không phải plugin kênh. Plugin kênh sử dụng
    `defineChannelPluginEntry` từ `openclaw/plugin-sdk/core` để thay thế.

  </Step>

  <Step title="Kiểm thử thời gian chạy">
    Đối với plugin đã cài đặt hoặc plugin bên ngoài, hãy kiểm tra thời gian chạy đã tải:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Nếu plugin đăng ký một lệnh CLI, hãy chạy cả lệnh đó và xác nhận
    đầu ra, chẳng hạn `openclaw demo-plugin ping`.

    Đối với plugin đi kèm trong kho lưu trữ này, OpenClaw phát hiện các gói plugin
    từ bản mã nguồn trong không gian làm việc `extensions/*`. Chạy bài kiểm thử đích
    gần nhất:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Kiểm thử cài đặt gói">
    Trước khi phát hành một plugin sẵn sàng đóng gói, hãy kiểm thử đúng hình thức cài đặt mà người dùng
    sẽ nhận được. Trước tiên, thêm một bước dựng, trỏ các mục nhập thời gian chạy như
    `openclaw.extensions` đến JavaScript đã dựng như `./dist/index.js`, đồng thời bảo đảm
    `npm pack` bao gồm đầu ra `dist/` đó. Các mục nhập mã nguồn TypeScript
    chỉ dành cho bản mã nguồn và đường dẫn phát triển cục bộ.

    Sau đó đóng gói plugin và cài đặt tệp tar bằng `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` sử dụng dự án npm theo từng plugin do OpenClaw quản lý, vì vậy nó phát hiện
    các lỗi phụ thuộc thời gian chạy mà kiểm thử từ bản mã nguồn có thể che khuất. Nó chứng minh
    hình thức gói và phụ thuộc, không phải mức tin cậy chính thức được liên kết với danh mục.
    Các nội dung nhập thời gian chạy phải nằm trong `dependencies` hoặc `optionalDependencies`;
    các phụ thuộc chỉ còn trong `devDependencies` sẽ không được cài đặt cho
    dự án thời gian chạy được quản lý.

    Không sử dụng cài đặt đường dẫn/kho lưu trữ thô làm bằng chứng cuối cùng cho hành vi plugin
    chính thức hoặc có đặc quyền. Mã nguồn thô hữu ích cho việc gỡ lỗi cục bộ, nhưng
    không chứng minh cùng một đường dẫn phụ thuộc như cài đặt qua npm hoặc ClawHub. Nếu
    plugin của bạn dựa vào trạng thái plugin chính thức được tin cậy, hãy thêm bằng chứng thứ hai
    thông qua cài đặt chính thức dựa trên danh mục hoặc đường dẫn gói đã phát hành có
    ghi nhận mức tin cậy chính thức. Xem
    [Phân giải phụ thuộc plugin](/vi/plugins/dependency-resolution) để biết chi tiết về
    gốc cài đặt và quyền sở hữu phụ thuộc.

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
plugin được bật. Công cụ tùy chọn cần người dùng chủ động chọn tham gia trước khi OpenClaw
tải thời gian chạy của plugin sở hữu.

Các hàm tạo công cụ nhận ngữ cảnh thời gian chạy đáng tin cậy, bao gồm `deliveryContext`,
`nativeChannelId` cho cuộc hội thoại đang hoạt động trên nền tảng khi có, và
`requesterSenderId`.

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

Người dùng chủ động chọn tham gia bằng `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // hoặc ["my-plugin"] cho mọi công cụ từ một plugin
}
```

Công cụ tùy chọn kiểm soát việc một công cụ có được cung cấp cho mô hình hay không. Sử dụng
[yêu cầu quyền plugin](/vi/plugins/plugin-permission-requests) khi một công cụ
hoặc hook cần yêu cầu phê duyệt sau khi mô hình chọn nó và trước khi
hành động chạy.

Sử dụng công cụ tùy chọn cho các hiệu ứng phụ, tệp nhị phân không phổ biến hoặc khả năng
không nên được cung cấp theo mặc định. Tên công cụ không được xung đột với tên công cụ
lõi; các xung đột bị bỏ qua và được báo cáo trong chẩn đoán plugin. Các đăng ký
sai định dạng cũng bị bỏ qua và báo cáo theo cách tương tự: thiếu
`name` không rỗng, `execute` không phải hàm hoặc bộ mô tả công cụ không có đối tượng `parameters`.

Các hàm tạo công cụ nhận một đối tượng ngữ cảnh do thời gian chạy cung cấp. Sử dụng `ctx.activeModel`
khi công cụ cần ghi nhật ký, hiển thị hoặc thích ứng với mô hình đang hoạt động cho lượt
hiện tại; đối tượng này có thể bao gồm `provider`, `modelId` và `modelRef`. Hãy xem nó là
siêu dữ liệu thời gian chạy mang tính thông tin, không phải ranh giới bảo mật trước người vận hành
cục bộ, mã plugin đã cài đặt hoặc thời gian chạy OpenClaw đã sửa đổi. Các công cụ cục bộ
nhạy cảm vẫn phải yêu cầu plugin hoặc người vận hành chủ động chọn tham gia rõ ràng và
từ chối an toàn khi siêu dữ liệu mô hình đang hoạt động bị thiếu hoặc không phù hợp.

Tệp kê khai khai báo quyền sở hữu và cơ chế phát hiện; quá trình thực thi vẫn gọi phần triển khai
công cụ trực tiếp đã đăng ký. Giữ `toolMetadata.<tool>.optional: true`
đồng bộ với `api.registerTool(..., { optional: true })` để OpenClaw có thể tránh
tải thời gian chạy plugin đó cho đến khi công cụ được đưa rõ ràng vào danh sách cho phép.

## Quy ước nhập

Nhập từ các đường dẫn con SDK chuyên biệt:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Không nhập từ barrel gốc đã lỗi thời:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Trong gói plugin của bạn, hãy sử dụng các tệp barrel cục bộ như `api.ts` và
`runtime-api.ts` cho nội dung nhập nội bộ. Không nhập chính plugin của bạn thông qua
đường dẫn SDK. Các trình trợ giúp dành riêng cho nhà cung cấp nên nằm trong gói nhà cung cấp trừ khi
điểm nối thực sự mang tính tổng quát.

Các phương thức RPC Gateway tùy chỉnh là một điểm vào nâng cao. Giữ chúng dưới một
tiền tố dành riêng cho plugin; các không gian tên quản trị lõi như `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` và `update.*` vẫn được dành riêng
và phân giải thành `operator.admin`. Cầu nối
`openclaw/plugin-sdk/gateway-method-runtime` được dành riêng cho các tuyến HTTP của plugin
khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Để xem đầy đủ bản đồ nhập, hãy xem [Tổng quan SDK Plugin](/vi/plugins/sdk-overview).

## Danh sách kiểm tra trước khi gửi

<Check>**package.json** có siêu dữ liệu `openclaw` chính xác</Check>
<Check>Tệp kê khai **openclaw.plugin.json** tồn tại và hợp lệ</Check>
<Check>Điểm vào sử dụng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Mọi nội dung nhập đều sử dụng đường dẫn `plugin-sdk/<subpath>` chuyên biệt</Check>
<Check>Nội dung nhập nội bộ sử dụng mô-đun cục bộ, không tự nhập qua SDK</Check>
<Check>Các bài kiểm thử đều vượt qua (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` vượt qua (plugin trong kho lưu trữ)</Check>

## Kiểm thử với các bản phát hành beta

1. Theo dõi các bản phát hành của [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Các thẻ beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể theo dõi [@openclaw](https://x.com/openclaw) trên X để nhận thông báo phát hành.
2. Kiểm thử plugin của bạn với thẻ beta ngay khi thẻ xuất hiện. Khoảng thời gian trước bản ổn định thường chỉ kéo dài vài giờ.
3. Sau khi kiểm thử, hãy đăng trong luồng của plugin tại kênh Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), kèm theo `all good` hoặc nội dung đã gặp lỗi. Hãy tạo một luồng nếu bạn chưa có.
4. Nếu có lỗi xảy ra, hãy mở hoặc cập nhật một issue có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Liên kết issue trong luồng của bạn.
5. Mở một PR đến `main` với tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết issue trong cả PR lẫn luồng Discord của bạn. Người đóng góp không thể gắn nhãn cho PR, vì vậy tiêu đề là tín hiệu phía PR dành cho người bảo trì và quy trình tự động hóa. Các lỗi chặn có PR sẽ được hợp nhất; các lỗi chặn không có PR vẫn có thể được phát hành.
6. Không có phản hồi nghĩa là mọi thứ đều ổn. Bỏ lỡ khoảng thời gian này thường đồng nghĩa với việc bản sửa lỗi của bạn sẽ được đưa vào chu kỳ tiếp theo.

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
  <Card title="Tổng quan SDK" icon="book-open" href="/vi/plugins/sdk-overview">
    Tham chiếu bản đồ nhập và API đăng ký
  </Card>
  <Card title="Trình trợ giúp thời gian chạy" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, tìm kiếm, tác tử phụ qua api.runtime
  </Card>
  <Card title="Kiểm thử" icon="test-tubes" href="/vi/plugins/sdk-testing">
    Tiện ích và mẫu kiểm thử
  </Card>
  <Card title="Tệp kê khai plugin" icon="file-json" href="/vi/plugins/manifest">
    Tham chiếu đầy đủ về lược đồ tệp kê khai
  </Card>
</CardGroup>

## Liên quan

- [Hook plugin](/vi/plugins/hooks)
- [Kiến trúc plugin](/vi/plugins/architecture)
