---
read_when:
    - Bạn muốn cài đặt một gói tương thích với Codex, Claude hoặc Cursor
    - Bạn cần hiểu cách OpenClaw ánh xạ nội dung gói vào các tính năng gốc
    - Bạn đang gỡ lỗi việc phát hiện gói hoặc các khả năng bị thiếu
summary: Cài đặt và sử dụng các gói Codex, Claude và Cursor làm plugin OpenClaw
title: Các gói Plugin
x-i18n:
    generated_at: "2026-07-12T08:09:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw có thể cài đặt các plugin từ ba hệ sinh thái bên ngoài: **Codex**, **Claude**
và **Cursor**. Chúng được gọi là **gói** — các gói nội dung và siêu dữ liệu mà
OpenClaw ánh xạ thành các tính năng gốc như Skills, hook và công cụ MCP.

<Info>
  Gói **không** giống với plugin OpenClaw gốc. Plugin gốc chạy
  trong cùng tiến trình và có thể đăng ký mọi khả năng. Gói là các gói nội dung có
  ánh xạ tính năng chọn lọc và ranh giới tin cậy hẹp hơn.
</Info>

## Lý do tồn tại của gói

Nhiều plugin hữu ích được phát hành theo định dạng Codex, Claude hoặc Cursor. Thay vì
yêu cầu tác giả viết lại chúng thành plugin OpenClaw gốc, OpenClaw
phát hiện các định dạng này và ánh xạ nội dung được hỗ trợ của chúng vào tập hợp tính năng
gốc. Bạn có thể cài đặt một gói lệnh Claude hoặc một gói Skills Codex và sử dụng
ngay lập tức.

## Cài đặt gói

<Steps>
  <Step title="Cài đặt từ thư mục, tệp lưu trữ hoặc marketplace">
    ```bash
    # Thư mục cục bộ
    openclaw plugins install ./my-bundle

    # Tệp lưu trữ
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` là đường dẫn/kho lưu trữ marketplace cục bộ hoặc nguồn git/GitHub.

  </Step>

  <Step title="Xác minh việc phát hiện">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Các gói hiển thị `Format: bundle` cùng với giá trị `Bundle format:` là `codex`,
    `claude` hoặc `cursor`.

  </Step>

  <Step title="Khởi động lại và sử dụng">
    ```bash
    openclaw gateway restart
    ```

    Các tính năng đã ánh xạ (Skills, hook, công cụ MCP, giá trị mặc định LSP) sẽ khả dụng trong phiên tiếp theo.

  </Step>
</Steps>

## Nội dung OpenClaw ánh xạ từ các gói

Hiện tại không phải mọi tính năng của gói đều chạy trong OpenClaw. Dưới đây là những gì hoạt động và những gì
được phát hiện nhưng chưa được kết nối.

### Hiện được hỗ trợ

| Tính năng      | Cách ánh xạ                                                                                       | Áp dụng cho            |
| ------------- | ------------------------------------------------------------------------------------------------- | ---------------------- |
| Nội dung Skills | Các thư mục gốc Skills của gói được tải như Skills OpenClaw thông thường                        | Tất cả định dạng       |
| Lệnh          | `commands/` và `.cursor/commands/` được xử lý như các thư mục gốc Skills                          | Claude, Cursor         |
| Gói hook      | Bố cục kiểu OpenClaw gồm `HOOK.md` + `handler.ts`                                                 | Codex                  |
| Công cụ MCP   | Cấu hình MCP của gói được hợp nhất vào cài đặt OpenClaw nhúng; tải các máy chủ stdio và HTTP được hỗ trợ | Tất cả định dạng |
| Máy chủ LSP   | `.lsp.json` của Claude và `lspServers` được khai báo trong tệp kê khai được hợp nhất vào giá trị mặc định LSP OpenClaw nhúng | Claude |
| Cài đặt       | `settings.json` của Claude được nhập làm giá trị mặc định OpenClaw nhúng                          | Claude                 |

#### Nội dung Skills

- Các thư mục gốc Skills của gói được tải như các thư mục gốc Skills OpenClaw thông thường.
- Các thư mục gốc `commands/` của Claude được xử lý như thư mục gốc Skills bổ sung.
- Các thư mục gốc `.cursor/commands/` của Cursor được xử lý như thư mục gốc Skills bổ sung.

Các tệp lệnh markdown của Claude và markdown lệnh của Cursor đều hoạt động thông qua
trình tải Skills OpenClaw thông thường.

#### Gói hook

Các thư mục gốc hook của gói **chỉ** hoạt động khi sử dụng bố cục gói hook
OpenClaw thông thường: `HOOK.md` cùng với `handler.ts` hoặc `handler.js`. Hiện tại, trường hợp này chủ yếu
tương thích với Codex.

#### MCP cho OpenClaw nhúng

- Các gói đã bật có thể cung cấp cấu hình máy chủ MCP.
- OpenClaw hợp nhất cấu hình MCP của gói vào cài đặt OpenClaw nhúng
  có hiệu lực dưới dạng `mcpServers`.
- OpenClaw cung cấp các công cụ MCP được hỗ trợ của gói trong lượt tác tử OpenClaw
  nhúng bằng cách khởi chạy máy chủ stdio hoặc kết nối với máy chủ HTTP.
- Các hồ sơ công cụ `coding` và `messaging` mặc định bao gồm công cụ MCP của gói;
  dùng `tools.deny: ["bundle-mcp"]` để vô hiệu hóa đối với một tác tử hoặc Gateway.
- Cài đặt tác tử nhúng cục bộ theo dự án vẫn được áp dụng sau các giá trị mặc định của gói, vì vậy
  cài đặt không gian làm việc có thể ghi đè các mục MCP của gói khi cần.
- Danh mục công cụ MCP của gói được sắp xếp theo cách xác định trước khi đăng ký, để
  các thay đổi thứ tự `listTools()` ở thượng nguồn không làm xáo trộn các khối công cụ trong bộ nhớ đệm lời nhắc.

##### Phương thức truyền tải

Máy chủ MCP có thể sử dụng phương thức truyền tải stdio hoặc HTTP.

**Stdio** khởi chạy một tiến trình con:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** kết nối với một máy chủ MCP đang chạy, mặc định dùng `sse` trừ khi
yêu cầu `streamable-http`:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` chấp nhận `"streamable-http"` hoặc `"sse"`; nếu bỏ qua thì mặc định là `sse`.
- `type: "http"` là cấu trúc hạ nguồn gốc CLI; dùng `transport: "streamable-http"` trong cấu hình OpenClaw. `openclaw mcp set` và `openclaw doctor --fix` chuẩn hóa bí danh phổ biến này.
- Chỉ cho phép lược đồ URL `http:` và `https:`.
- Các giá trị `headers` hỗ trợ nội suy `${ENV_VAR}`.
- Mục máy chủ có cả `command` và `url` sẽ bị từ chối.
- Thông tin xác thực trong URL (thông tin người dùng và tham số truy vấn) được che khỏi mô tả công cụ
  và nhật ký.
- `connectionTimeoutMs` ghi đè thời gian chờ kết nối mặc định 30 giây cho
  cả phương thức truyền tải stdio và HTTP. Thời gian chờ yêu cầu mặc định là 60 giây và
  có thể được ghi đè bằng `requestTimeoutMs`.

##### Đặt tên công cụ

OpenClaw đăng ký các công cụ MCP của gói bằng tên an toàn cho nhà cung cấp theo dạng
`serverName__toolName`. Ví dụ: một máy chủ có khóa `"vigil-harbor"` cung cấp công cụ
`memory_search` sẽ được đăng ký thành `vigil-harbor__memory_search`.

- Các ký tự ngoài `A-Za-z0-9_-` được thay bằng `-`.
- Các phân đoạn bắt đầu bằng ký tự không phải chữ cái sẽ được thêm tiền tố chữ cái, vì vậy các
  khóa máy chủ dạng số như `12306` trở thành tiền tố công cụ an toàn cho nhà cung cấp.
- Tiền tố máy chủ được giới hạn ở 30 ký tự.
- Tên công cụ đầy đủ được giới hạn ở 64 ký tự.
- Tên máy chủ trống sẽ dùng giá trị dự phòng `mcp`.
- Các tên đã làm sạch bị trùng được phân biệt bằng hậu tố số.
- Thứ tự công cụ được cung cấp cuối cùng được xác định theo tên an toàn, giúp các lượt
  tác tử nhúng lặp lại giữ ổn định bộ nhớ đệm.
- Bộ lọc hồ sơ coi mọi công cụ từ một máy chủ MCP của gói là
  thuộc sở hữu của plugin `bundle-mcp`, vì vậy danh sách cho phép/từ chối của hồ sơ có thể tham chiếu
  tên từng công cụ được cung cấp hoặc khóa plugin `bundle-mcp`.

#### Cài đặt OpenClaw nhúng

`settings.json` của Claude được nhập làm cài đặt OpenClaw nhúng mặc định khi
gói được bật. OpenClaw làm sạch các khóa ghi đè shell trước khi áp dụng:

- `shellPath`
- `shellCommandPrefix`

#### LSP OpenClaw nhúng

- Các gói Claude đã bật có thể cung cấp cấu hình máy chủ LSP.
- OpenClaw tải `.lsp.json` cùng với mọi đường dẫn `lspServers` được khai báo trong tệp kê khai.
- Cấu hình LSP của gói được hợp nhất vào các giá trị mặc định LSP OpenClaw nhúng
  có hiệu lực.
- Hiện chỉ các máy chủ LSP dựa trên stdio được hỗ trợ mới có thể chạy; các
  phương thức truyền tải không được hỗ trợ vẫn xuất hiện trong `openclaw plugins inspect <id>`.

### Được phát hiện nhưng không thực thi

Các thành phần sau được nhận dạng và hiển thị trong chẩn đoán, nhưng OpenClaw không chạy chúng:

- Tính năng tự động hóa `agents`, `hooks/hooks.json`, `outputStyles` của Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` của Cursor
- Siêu dữ liệu `.app.json` của Codex ngoài báo cáo khả năng

## Định dạng gói

<AccordionGroup>
  <Accordion title="Gói Codex">
    Dấu hiệu nhận biết: `.codex-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Gói Codex phù hợp nhất với OpenClaw khi sử dụng các thư mục gốc Skills và thư mục
    gói hook kiểu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Gói Claude">
    Hai chế độ phát hiện:

    - **Dựa trên tệp kê khai:** `.claude-plugin/plugin.json`
    - **Không có tệp kê khai:** bố cục Claude mặc định (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Hành vi dành riêng cho Claude:

    - `commands/` được xử lý như nội dung Skills
    - `settings.json` được nhập vào cài đặt OpenClaw nhúng (các khóa ghi đè shell được làm sạch)
    - `.mcp.json` cung cấp các công cụ stdio được hỗ trợ cho OpenClaw nhúng
    - `.lsp.json` cùng với các đường dẫn `lspServers` được khai báo trong tệp kê khai được tải vào giá trị mặc định LSP OpenClaw nhúng
    - `hooks/hooks.json` được phát hiện nhưng không thực thi
    - Các đường dẫn thành phần tùy chỉnh trong tệp kê khai có tính bổ sung; chúng mở rộng giá trị mặc định chứ không thay thế

  </Accordion>

  <Accordion title="Gói Cursor">
    Dấu hiệu nhận biết: `.cursor-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` được xử lý như nội dung Skills
    - `.cursor/rules/`, `.cursor/agents/` và `.cursor/hooks.json` chỉ được phát hiện

  </Accordion>
</AccordionGroup>

## Thứ tự ưu tiên phát hiện

OpenClaw kiểm tra định dạng plugin gốc trước:

1. `openclaw.plugin.json` hoặc `package.json` hợp lệ có `openclaw.extensions` — được xử lý như **plugin gốc**
2. Dấu hiệu nhận biết gói (`.codex-plugin/`, `.claude-plugin/` hoặc bố cục Claude/Cursor mặc định) — được xử lý như **gói**

Nếu một thư mục chứa cả hai, OpenClaw sử dụng đường dẫn gốc. Điều này ngăn
các gói có hai định dạng bị cài đặt một phần dưới dạng gói.

## Phụ thuộc thời gian chạy và dọn dẹp

- Các gói tương thích của bên thứ ba không được sửa chữa bằng `npm install` khi khởi động. Chúng
  nên được cài đặt thông qua `openclaw plugins install` và cung cấp mọi thứ
  cần thiết trong thư mục plugin đã cài đặt.
- Các plugin đi kèm do OpenClaw sở hữu hoặc được cung cấp ở dạng gọn nhẹ trong lõi hoặc
  có thể tải xuống thông qua trình cài đặt plugin. Khi khởi động, Gateway không bao giờ chạy
  trình quản lý gói cho chúng.
- `openclaw doctor --fix` xóa các bản ghi cài đặt plugin đi kèm cục bộ đã lỗi thời
  và có thể khôi phục các plugin có thể tải xuống bị thiếu trong chỉ mục plugin
  cục bộ khi cấu hình vẫn tham chiếu đến chúng.

## Bảo mật

Gói có ranh giới tin cậy hẹp hơn plugin gốc:

- OpenClaw **không** tải các mô-đun thời gian chạy tùy ý của gói trong cùng tiến trình.
- Đường dẫn Skills và gói hook phải nằm bên trong thư mục gốc plugin (được kiểm tra ranh giới).
- Các tệp cài đặt được đọc với cùng cơ chế kiểm tra ranh giới.
- Các máy chủ MCP stdio được hỗ trợ có thể được khởi chạy dưới dạng tiến trình con.

Điều này giúp các gói an toàn hơn theo mặc định, nhưng bạn vẫn nên coi các gói
bên thứ ba là nội dung đáng tin cậy đối với những tính năng mà chúng cung cấp.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Gói được phát hiện nhưng các khả năng không chạy">
    Chạy `openclaw plugins inspect <id>`. Nếu một khả năng được liệt kê nhưng được đánh dấu là
    chưa kết nối, đó là giới hạn của sản phẩm, không phải lỗi cài đặt.
  </Accordion>

  <Accordion title="Các tệp lệnh Claude không xuất hiện">
    Đảm bảo gói đã được bật và các tệp markdown nằm trong thư mục gốc
    `commands/` hoặc `skills/` được phát hiện.
  </Accordion>

  <Accordion title="Cài đặt Claude không được áp dụng">
    Chỉ hỗ trợ cài đặt OpenClaw nhúng từ `settings.json`. OpenClaw
    không xử lý cài đặt của gói như các bản vá cấu hình thô.
  </Accordion>

  <Accordion title="Hook Claude không thực thi">
    `hooks/hooks.json` chỉ được phát hiện. Nếu bạn cần hook có thể chạy, hãy dùng
    bố cục gói hook OpenClaw hoặc cung cấp plugin gốc.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Cài đặt và cấu hình plugin](/vi/tools/plugin)
- [Xây dựng plugin](/vi/plugins/building-plugins) — tạo plugin gốc
- [Tệp kê khai plugin](/vi/plugins/manifest) — lược đồ tệp kê khai gốc
