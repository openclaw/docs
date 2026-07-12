---
doc-schema-version: 1
read_when:
    - Bạn muốn tạo một plugin OpenClaw mới
    - Bạn cần hướng dẫn bắt đầu nhanh để phát triển plugin
    - Bạn đang chọn giữa tài liệu về kênh, nhà cung cấp, phần phụ trợ CLI, công cụ hoặc hook
sidebarTitle: Getting Started
summary: Tạo Plugin OpenClaw đầu tiên của bạn chỉ trong vài phút
title: Xây dựng Plugin
x-i18n:
    generated_at: "2026-07-12T08:05:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw mà không thay đổi phần lõi. Một Plugin có thể bổ sung kênh nhắn tin, nhà cung cấp mô hình, phần phụ trợ CLI cục bộ, công cụ tác nhân, hook, nhà cung cấp phương tiện hoặc một khả năng khác do Plugin sở hữu.

Bạn không cần thêm Plugin bên ngoài vào kho lưu trữ OpenClaw. Hãy phát hành gói lên [ClawHub](/clawhub), sau đó người dùng cài đặt bằng:

```bash
openclaw plugins install clawhub:<package-name>
```

Các đặc tả gói không có tiền tố vẫn được cài đặt từ npm trong giai đoạn chuyển đổi khi ra mắt. Sử dụng tiền tố `clawhub:` khi bạn muốn phân giải qua ClawHub.

## Yêu cầu

- Node 22.19+, Node 23.11+ hoặc Node 24+, cùng với `npm` hoặc `pnpm`.
- Các mô-đun TypeScript ESM.
- Đối với công việc trên Plugin đi kèm trong kho lưu trữ, hãy sao chép kho lưu trữ và chạy `pnpm install`.
  Việc phát triển Plugin từ bản mã nguồn đã lấy về chỉ hỗ trợ pnpm vì OpenClaw phát hiện các Plugin đi kèm từ những gói không gian làm việc `extensions/*`.

## Chọn kiểu Plugin

<CardGroup cols={2}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Kết nối OpenClaw với một nền tảng nhắn tin.
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Thêm nhà cung cấp mô hình, phương tiện, tìm kiếm, truy xuất, giọng nói hoặc thời gian thực.
  </Card>
  <Card title="Plugin phần phụ trợ CLI" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Chạy một CLI AI cục bộ thông qua cơ chế dự phòng mô hình của OpenClaw.
  </Card>
  <Card title="Plugin công cụ" icon="wrench" href="/vi/plugins/tool-plugins">
    Đăng ký các công cụ tác nhân.
  </Card>
</CardGroup>

## Bắt đầu nhanh

Xây dựng một Plugin công cụ tối giản bằng cách đăng ký một công cụ tác nhân bắt buộc. Đây là kiểu Plugin hữu ích ngắn gọn nhất và bao quát gói, tệp kê khai, điểm vào cũng như bước kiểm chứng cục bộ.

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

    Các Plugin bên ngoài đã phát hành nên trỏ các mục nhập thời gian chạy tới những tệp JavaScript đã dựng. Xem [Các điểm vào SDK](/vi/plugins/sdk-entrypoints) để biết đầy đủ hợp đồng điểm vào.

    Mọi Plugin đều cần tệp kê khai, kể cả khi không có cấu hình. Các công cụ thời gian chạy phải xuất hiện trong `contracts.tools` để OpenClaw có thể phát hiện quyền sở hữu mà không cần tải trước thời gian chạy của mọi Plugin. Hãy thiết lập `activation.onStartup` có chủ đích; ví dụ này tải khi Gateway khởi động.

    Các bề mặt Plugin được máy chủ tin cậy cũng chịu sự kiểm soát của tệp kê khai và yêu cầu khai báo rõ ràng đối với Plugin đã cài đặt: `api.registerAgentToolResultMiddleware(...)` cần từng thời gian chạy đích được liệt kê trong `contracts.agentToolResultMiddleware`, còn `api.registerTrustedToolPolicy(...)` cần từng mã định danh chính sách trong `contracts.trustedToolPolicies`. Những khai báo này giữ cho quá trình kiểm tra lúc cài đặt và đăng ký thời gian chạy nhất quán.

    Để biết mọi trường trong tệp kê khai, xem [Tệp kê khai Plugin](/vi/plugins/manifest).

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

    Sử dụng `definePluginEntry` cho các Plugin không phải Plugin kênh. Thay vào đó, Plugin kênh sử dụng `defineChannelPluginEntry` từ `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Kiểm thử thời gian chạy">
    Đối với Plugin đã cài đặt hoặc Plugin bên ngoài, hãy kiểm tra thời gian chạy đã tải:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Nếu Plugin đăng ký một lệnh CLI, hãy chạy cả lệnh đó và xác nhận đầu ra, chẳng hạn `openclaw demo-plugin ping`.

    Đối với Plugin đi kèm trong kho lưu trữ này, OpenClaw phát hiện các gói Plugin từ bản mã nguồn đã lấy về trong không gian làm việc `extensions/*`. Chạy phép kiểm thử có phạm vi gần nhất:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Kiểm thử cài đặt gói">
    Trước khi phát hành một Plugin đã sẵn sàng đóng gói, hãy kiểm thử đúng kiểu cài đặt mà người dùng sẽ nhận được. Trước tiên, thêm một bước dựng, trỏ các mục nhập thời gian chạy như `openclaw.extensions` tới JavaScript đã dựng, chẳng hạn `./dist/index.js`, và bảo đảm `npm pack` bao gồm đầu ra `dist/` đó. Các mục nhập mã nguồn TypeScript chỉ dành cho bản mã nguồn đã lấy về và các đường dẫn phát triển cục bộ.

    Sau đó đóng gói Plugin và cài đặt tệp tar bằng `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` sử dụng dự án npm riêng cho từng Plugin do OpenClaw quản lý, vì vậy nó phát hiện được các lỗi về phần phụ thuộc thời gian chạy mà việc kiểm thử từ bản mã nguồn đã lấy về có thể che giấu. Nó chứng minh cấu trúc gói và phần phụ thuộc, chứ không chứng minh trạng thái tin cậy chính thức được liên kết với danh mục. Các phần nhập thời gian chạy phải nằm trong `dependencies` hoặc `optionalDependencies`; những phần phụ thuộc chỉ nằm trong `devDependencies` sẽ không được cài đặt cho dự án thời gian chạy được quản lý.

    Không sử dụng bản cài đặt trực tiếp từ tệp lưu trữ hoặc đường dẫn làm bằng chứng cuối cùng cho hành vi Plugin chính thức hoặc có đặc quyền. Mã nguồn trực tiếp hữu ích cho việc gỡ lỗi cục bộ, nhưng không chứng minh cùng một đường dẫn phần phụ thuộc như các bản cài đặt từ npm hoặc ClawHub. Nếu Plugin của bạn dựa vào trạng thái Plugin chính thức được tin cậy, hãy thêm bằng chứng thứ hai thông qua bản cài đặt chính thức có danh mục hỗ trợ hoặc đường dẫn gói đã phát hành có ghi nhận độ tin cậy chính thức. Xem [Phân giải phần phụ thuộc Plugin](/vi/plugins/dependency-resolution) để biết chi tiết về thư mục gốc cài đặt và quyền sở hữu phần phụ thuộc.

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

Công cụ có thể là bắt buộc hoặc tùy chọn. Công cụ bắt buộc luôn khả dụng khi Plugin được bật. Công cụ tùy chọn cần người dùng chủ động đồng ý rõ ràng trước khi OpenClaw tải thời gian chạy của Plugin sở hữu công cụ đó.

Các hàm tạo công cụ nhận ngữ cảnh thời gian chạy đáng tin cậy, bao gồm `deliveryContext`, `nativeChannelId` cho cuộc hội thoại đang hoạt động trên nền tảng khi có sẵn và `requesterSenderId`.

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

Mọi công cụ được đăng ký bằng `api.registerTool(...)` cũng phải được khai báo trong tệp kê khai Plugin:

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

Người dùng chủ động bật bằng `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // hoặc ["my-plugin"] cho mọi công cụ từ một Plugin
}
```

Công cụ tùy chọn kiểm soát việc một công cụ có được hiển thị cho mô hình hay không. Sử dụng [yêu cầu quyền của Plugin](/vi/plugins/plugin-permission-requests) khi một công cụ hoặc hook cần yêu cầu phê duyệt sau khi mô hình chọn nó và trước khi hành động chạy.

Sử dụng công cụ tùy chọn cho các hiệu ứng phụ, tệp nhị phân ít dùng hoặc những khả năng không nên được hiển thị theo mặc định. Tên công cụ không được xung đột với tên công cụ lõi; các xung đột sẽ bị bỏ qua và được báo cáo trong chẩn đoán Plugin. Các đăng ký không hợp lệ cũng bị bỏ qua và báo cáo theo cùng cách: thiếu `name` không rỗng, `execute` không phải hàm hoặc bộ mô tả công cụ không có đối tượng `parameters`.

Các hàm tạo công cụ nhận một đối tượng ngữ cảnh do thời gian chạy cung cấp. Sử dụng `ctx.activeModel` khi công cụ cần ghi nhật ký, hiển thị hoặc thích ứng với mô hình đang hoạt động cho lượt hiện tại; đối tượng này có thể bao gồm `provider`, `modelId` và `modelRef`. Hãy coi đây là siêu dữ liệu thời gian chạy mang tính thông tin, không phải ranh giới bảo mật chống lại người vận hành cục bộ, mã Plugin đã cài đặt hoặc thời gian chạy OpenClaw đã bị sửa đổi. Các công cụ cục bộ nhạy cảm vẫn phải yêu cầu Plugin hoặc người vận hành chủ động bật rõ ràng và phải từ chối an toàn khi siêu dữ liệu mô hình đang hoạt động bị thiếu hoặc không phù hợp.

Tệp kê khai khai báo quyền sở hữu và khả năng phát hiện; việc thực thi vẫn gọi phần triển khai công cụ đã đăng ký đang hoạt động. Giữ `toolMetadata.<tool>.optional: true` nhất quán với `api.registerTool(..., { optional: true })` để OpenClaw có thể tránh tải thời gian chạy của Plugin đó cho đến khi công cụ được đưa rõ ràng vào danh sách cho phép.

## Quy ước nhập

Nhập từ các đường dẫn con SDK chuyên biệt:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Không nhập từ tệp tổng hợp gốc đã lỗi thời:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Trong gói Plugin của bạn, hãy sử dụng các tệp tổng hợp cục bộ như `api.ts` và `runtime-api.ts` cho các phần nhập nội bộ. Không nhập chính Plugin của bạn thông qua đường dẫn SDK. Các hàm hỗ trợ dành riêng cho nhà cung cấp nên nằm trong gói nhà cung cấp, trừ khi điểm nối thực sự mang tính tổng quát.

Các phương thức RPC tùy chỉnh của Gateway là một điểm vào nâng cao. Giữ chúng dưới tiền tố dành riêng cho Plugin; các không gian tên quản trị lõi như `config.*`, `exec.approvals.*`, `operator.admin.*`, `wizard.*` và `update.*` vẫn được dành riêng và phân giải thành `operator.admin`. Cầu nối `openclaw/plugin-sdk/gateway-method-runtime` được dành riêng cho các tuyến HTTP của Plugin khai báo `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Để xem bản đồ nhập đầy đủ, hãy xem [Tổng quan về SDK Plugin](/vi/plugins/sdk-overview).

## Danh sách kiểm tra trước khi gửi

<Check>**package.json** có siêu dữ liệu `openclaw` chính xác</Check>
<Check>Tệp kê khai **openclaw.plugin.json** hiện diện và hợp lệ</Check>
<Check>Điểm vào sử dụng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Mọi phần nhập đều sử dụng đường dẫn chuyên biệt `plugin-sdk/<subpath>`</Check>
<Check>Các phần nhập nội bộ sử dụng mô-đun cục bộ, không tự nhập qua SDK</Check>
<Check>Các phép kiểm thử đều đạt (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` đạt (đối với Plugin trong kho lưu trữ)</Check>

## Kiểm thử với các bản phát hành beta

1. Theo dõi các bản phát hành của [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Các thẻ beta có dạng `v2026.3.N-beta.1`. Bạn cũng có thể theo dõi [@openclaw](https://x.com/openclaw) trên X để nhận thông báo phát hành.
2. Kiểm thử plugin của bạn với thẻ beta ngay khi thẻ xuất hiện. Khoảng thời gian trước khi phát hành bản ổn định thường chỉ kéo dài vài giờ.
3. Sau khi kiểm thử, hãy đăng trong luồng của plugin thuộc kênh Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), với nội dung `all good` hoặc mô tả lỗi đã xảy ra. Tạo một luồng nếu bạn chưa có.
4. Nếu có lỗi, hãy mở hoặc cập nhật một vấn đề có tiêu đề `Beta blocker: <plugin-name> - <summary>` và áp dụng nhãn `beta-blocker`. Liên kết vấn đề đó trong luồng của bạn.
5. Mở một PR vào `main` với tiêu đề `fix(<plugin-id>): beta blocker - <summary>` và liên kết vấn đề trong cả PR lẫn luồng Discord của bạn. Người đóng góp không thể gắn nhãn cho PR, vì vậy tiêu đề là tín hiệu phía PR dành cho người bảo trì và quy trình tự động hóa. Các lỗi chặn có PR sẽ được hợp nhất; các lỗi chặn không có PR vẫn có thể được phát hành.
6. Không có phản hồi nghĩa là mọi thứ đều ổn. Nếu bỏ lỡ khoảng thời gian này, bản sửa lỗi của bạn thường sẽ được đưa vào chu kỳ tiếp theo.

## Các bước tiếp theo

<CardGroup cols={2}>
  <Card title="Plugin kênh" icon="messages-square" href="/vi/plugins/sdk-channel-plugins">
    Xây dựng plugin kênh nhắn tin
  </Card>
  <Card title="Plugin nhà cung cấp" icon="cpu" href="/vi/plugins/sdk-provider-plugins">
    Xây dựng plugin nhà cung cấp mô hình
  </Card>
  <Card title="Plugin phần phụ trợ CLI" icon="terminal" href="/vi/plugins/cli-backend-plugins">
    Đăng ký phần phụ trợ CLI AI cục bộ
  </Card>
  <Card title="Tổng quan SDK" icon="book-open" href="/vi/plugins/sdk-overview">
    Tài liệu tham chiếu về bản đồ nhập và API đăng ký
  </Card>
  <Card title="Trình trợ giúp thời gian chạy" icon="settings" href="/vi/plugins/sdk-runtime">
    TTS, tìm kiếm, tác tử phụ qua api.runtime
  </Card>
  <Card title="Kiểm thử" icon="test-tubes" href="/vi/plugins/sdk-testing">
    Tiện ích và mẫu kiểm thử
  </Card>
  <Card title="Tệp kê khai Plugin" icon="file-json" href="/vi/plugins/manifest">
    Tài liệu tham chiếu đầy đủ về lược đồ tệp kê khai
  </Card>
</CardGroup>

## Liên quan

- [Hook của Plugin](/vi/plugins/hooks)
- [Kiến trúc Plugin](/vi/plugins/architecture)
