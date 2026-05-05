---
read_when:
    - Bạn muốn cài đặt một gói tương thích với Codex, Claude hoặc Cursor
    - Bạn cần hiểu cách OpenClaw ánh xạ nội dung gói thành các tính năng gốc.
    - Bạn đang gỡ lỗi việc phát hiện gói hoặc các năng lực bị thiếu
summary: Cài đặt và sử dụng các gói Codex, Claude và Cursor dưới dạng Plugin OpenClaw
title: Các gói Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw có thể cài đặt Plugin từ ba hệ sinh thái bên ngoài: **Codex**, **Claude**,
và **Cursor**. Chúng được gọi là **gói** — các gói nội dung và siêu dữ liệu mà
OpenClaw ánh xạ vào các tính năng gốc như Skills, móc nối và công cụ MCP.

<Info>
  Gói **không** giống với Plugin OpenClaw gốc. Plugin gốc chạy
  trong cùng tiến trình và có thể đăng ký bất kỳ năng lực nào. Gói là các gói nội dung có
  ánh xạ tính năng chọn lọc và ranh giới tin cậy hẹp hơn.
</Info>

## Vì sao có gói

Nhiều Plugin hữu ích được phát hành ở định dạng Codex, Claude hoặc Cursor. Thay vì
yêu cầu tác giả viết lại chúng thành Plugin OpenClaw gốc, OpenClaw
phát hiện các định dạng này và ánh xạ nội dung được hỗ trợ của chúng vào bộ tính năng
gốc. Điều này nghĩa là bạn có thể cài đặt một gói lệnh Claude hoặc một gói kỹ năng Codex
và dùng ngay.

## Cài đặt một gói

<Steps>
  <Step title="Cài đặt từ một thư mục, kho lưu trữ hoặc chợ Plugin">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Xác minh phát hiện">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Gói hiển thị là `Format: bundle` với kiểu con là `codex`, `claude` hoặc `cursor`.

  </Step>

  <Step title="Khởi động lại và sử dụng">
    ```bash
    openclaw gateway restart
    ```

    Các tính năng đã ánh xạ (Skills, móc nối, công cụ MCP, mặc định LSP) sẽ có sẵn trong phiên tiếp theo.

  </Step>
</Steps>

## OpenClaw ánh xạ gì từ các gói

Không phải mọi tính năng của gói đều chạy trong OpenClaw hiện nay. Đây là những gì hoạt động và những gì
được phát hiện nhưng chưa được nối dây.

### Hiện đã hỗ trợ

| Tính năng       | Cách ánh xạ                                                                                 | Áp dụng cho     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Nội dung Skills | Các gốc Skills của gói tải như Skills OpenClaw bình thường                                           | Mọi định dạng    |
| Lệnh      | `commands/` và `.cursor/commands/` được xem là các gốc Skills                                  | Claude, Cursor |
| Gói móc nối    | Bố cục kiểu OpenClaw `HOOK.md` + `handler.ts`                                             | Codex          |
| Công cụ MCP     | Cấu hình MCP của gói được hợp nhất vào cài đặt Pi nhúng; máy chủ stdio và HTTP được hỗ trợ sẽ được tải | Mọi định dạng    |
| Máy chủ LSP   | `.lsp.json` của Claude và `lspServers` khai báo trong manifest được hợp nhất vào mặc định LSP của Pi nhúng  | Claude         |
| Cài đặt      | `settings.json` của Claude được nhập làm mặc định Pi nhúng                                     | Claude         |

#### Nội dung Skills

- các gốc Skills của gói tải như các gốc Skills OpenClaw bình thường
- các gốc `commands` của Claude được xem là các gốc Skills bổ sung
- các gốc `.cursor/commands` của Cursor được xem là các gốc Skills bổ sung

Điều này nghĩa là các tệp lệnh markdown của Claude hoạt động thông qua trình tải Skills
bình thường của OpenClaw. Markdown lệnh của Cursor hoạt động qua cùng đường dẫn.

#### Gói móc nối

- các gốc móc nối của gói hoạt động **chỉ** khi chúng dùng bố cục gói móc nối
  OpenClaw bình thường. Hiện nay đây chủ yếu là trường hợp tương thích với Codex:
  - `HOOK.md`
  - `handler.ts` hoặc `handler.js`

#### MCP cho Pi

- các gói đã bật có thể đóng góp cấu hình máy chủ MCP
- OpenClaw hợp nhất cấu hình MCP của gói vào cài đặt Pi nhúng hiệu lực dưới dạng
  `mcpServers`
- OpenClaw hiển thị các công cụ MCP được hỗ trợ của gói trong lượt tác nhân Pi nhúng bằng cách
  khởi chạy máy chủ stdio hoặc kết nối tới máy chủ HTTP
- hồ sơ công cụ `coding` và `messaging` bao gồm công cụ MCP của gói theo
  mặc định; dùng `tools.deny: ["bundle-mcp"]` để từ chối cho một tác nhân hoặc gateway
- cài đặt Pi cục bộ theo dự án vẫn áp dụng sau mặc định của gói, nên cài đặt
  không gian làm việc có thể ghi đè các mục MCP của gói khi cần
- danh mục công cụ MCP của gói được sắp xếp xác định trước khi đăng ký, nên
  thay đổi thứ tự `listTools()` từ thượng nguồn không làm xáo trộn các khối công cụ trong bộ nhớ đệm lời nhắc

##### Phương thức truyền

Máy chủ MCP có thể dùng phương thức truyền stdio hoặc HTTP:

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

**HTTP** kết nối tới một máy chủ MCP đang chạy qua `sse` theo mặc định, hoặc `streamable-http` khi được yêu cầu:

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

- `transport` có thể được đặt thành `"streamable-http"` hoặc `"sse"`; khi bỏ qua, OpenClaw dùng `sse`
- `type: "http"` là dạng hạ nguồn gốc CLI; dùng `transport: "streamable-http"` trong cấu hình OpenClaw. `openclaw mcp set` và `openclaw doctor --fix` chuẩn hóa bí danh phổ biến.
- chỉ cho phép lược đồ URL `http:` và `https:`
- giá trị `headers` hỗ trợ nội suy `${ENV_VAR}`
- mục máy chủ có cả `command` và `url` sẽ bị từ chối
- thông tin xác thực trong URL (userinfo và tham số truy vấn) được biên tập khỏi phần
  mô tả công cụ và nhật ký
- `connectionTimeoutMs` ghi đè thời gian chờ kết nối mặc định 30 giây cho
  cả phương thức truyền stdio và HTTP

##### Đặt tên công cụ

OpenClaw đăng ký công cụ MCP của gói bằng tên an toàn cho nhà cung cấp ở dạng
`serverName__toolName`. Ví dụ, một máy chủ có khóa `"vigil-harbor"` hiển thị một
công cụ `memory_search` sẽ được đăng ký là `vigil-harbor__memory_search`.

- các ký tự ngoài `A-Za-z0-9_-` được thay bằng `-`
- tiền tố máy chủ bị giới hạn ở 30 ký tự
- tên công cụ đầy đủ bị giới hạn ở 64 ký tự
- tên máy chủ rỗng dùng dự phòng `mcp`
- tên đã làm sạch bị trùng được phân biệt bằng hậu tố số
- thứ tự công cụ hiển thị cuối cùng mang tính xác định theo tên an toàn để giữ các lượt Pi lặp lại
  ổn định với bộ nhớ đệm
- lọc hồ sơ xem mọi công cụ từ một máy chủ MCP của gói là thuộc sở hữu Plugin
  bởi `bundle-mcp`, nên danh sách cho phép và danh sách từ chối của hồ sơ có thể bao gồm
  tên công cụ hiển thị riêng lẻ hoặc khóa Plugin `bundle-mcp`

#### Cài đặt Pi nhúng

- `settings.json` của Claude được nhập làm cài đặt Pi nhúng mặc định khi
  gói được bật
- OpenClaw làm sạch các khóa ghi đè shell trước khi áp dụng chúng

Khóa đã làm sạch:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi nhúng

- các gói Claude đã bật có thể đóng góp cấu hình máy chủ LSP
- OpenClaw tải `.lsp.json` cùng mọi đường dẫn `lspServers` khai báo trong manifest
- cấu hình LSP của gói được hợp nhất vào mặc định LSP Pi nhúng hiệu lực
- hiện nay chỉ máy chủ LSP dựa trên stdio được hỗ trợ mới có thể chạy; các phương thức truyền
  không được hỗ trợ vẫn hiển thị trong `openclaw plugins inspect <id>`

### Đã phát hiện nhưng không thực thi

Những mục này được nhận diện và hiển thị trong chẩn đoán, nhưng OpenClaw không chạy chúng:

- `agents`, tự động hóa `hooks.json`, `outputStyles` của Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` của Cursor
- siêu dữ liệu nội tuyến/ứng dụng Codex ngoài báo cáo năng lực

## Định dạng gói

<AccordionGroup>
  <Accordion title="Gói Codex">
    Dấu hiệu: `.codex-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Gói Codex phù hợp với OpenClaw nhất khi chúng dùng các gốc Skills và thư mục
    gói móc nối kiểu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Gói Claude">
    Hai chế độ phát hiện:

    - **Dựa trên manifest:** `.claude-plugin/plugin.json`
    - **Không có manifest:** bố cục Claude mặc định (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Hành vi riêng của Claude:

    - `commands/` được xem là nội dung Skills
    - `settings.json` được nhập vào cài đặt Pi nhúng (các khóa ghi đè shell được làm sạch)
    - `.mcp.json` hiển thị các công cụ stdio được hỗ trợ cho Pi nhúng
    - `.lsp.json` cùng các đường dẫn `lspServers` khai báo trong manifest được tải vào mặc định LSP Pi nhúng
    - `hooks/hooks.json` được phát hiện nhưng không thực thi
    - Đường dẫn thành phần tùy chỉnh trong manifest là bổ sung (chúng mở rộng mặc định, không thay thế)

  </Accordion>

  <Accordion title="Gói Cursor">
    Dấu hiệu: `.cursor-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` được xem là nội dung Skills
    - `.cursor/rules/`, `.cursor/agents/` và `.cursor/hooks.json` chỉ được phát hiện

  </Accordion>
</AccordionGroup>

## Thứ tự ưu tiên phát hiện

OpenClaw kiểm tra định dạng Plugin gốc trước:

1. `openclaw.plugin.json` hoặc `package.json` hợp lệ có `openclaw.extensions` — được xem là **Plugin gốc**
2. Dấu hiệu gói (`.codex-plugin/`, `.claude-plugin/`, hoặc bố cục Claude/Cursor mặc định) — được xem là **gói**

Nếu một thư mục chứa cả hai, OpenClaw dùng đường dẫn gốc. Điều này ngăn
các gói hai định dạng bị cài đặt một phần dưới dạng gói.

## Phụ thuộc runtime và dọn dẹp

- Các gói tương thích bên thứ ba không nhận sửa chữa `npm install` khi khởi động. Chúng
  nên được cài đặt thông qua `openclaw plugins install` và cung cấp mọi thứ
  chúng cần trong thư mục Plugin đã cài đặt.
- Các Plugin đóng gói thuộc sở hữu OpenClaw hoặc được đưa kèm nhẹ trong lõi hoặc
  có thể tải xuống thông qua trình cài đặt Plugin. Gateway không bao giờ chạy
  trình quản lý gói cho chúng khi khởi động.
- `openclaw doctor --fix` xóa các thư mục phụ thuộc được staged kiểu cũ và có thể
  khôi phục các Plugin có thể tải xuống bị thiếu khỏi chỉ mục Plugin cục bộ khi
  cấu hình tham chiếu chúng.

## Bảo mật

Gói có ranh giới tin cậy hẹp hơn Plugin gốc:

- OpenClaw **không** tải các mô-đun runtime tùy ý của gói trong cùng tiến trình
- Đường dẫn Skills và gói móc nối phải nằm trong gốc Plugin (được kiểm tra ranh giới)
- Tệp cài đặt được đọc với cùng các kiểm tra ranh giới
- Máy chủ MCP stdio được hỗ trợ có thể được khởi chạy như tiến trình con

Điều này làm cho gói an toàn hơn theo mặc định, nhưng bạn vẫn nên xem các gói
bên thứ ba là nội dung tin cậy đối với những tính năng mà chúng hiển thị.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Gói được phát hiện nhưng năng lực không chạy">
    Chạy `openclaw plugins inspect <id>`. Nếu một năng lực được liệt kê nhưng được đánh dấu là
    chưa nối dây, đó là giới hạn của sản phẩm — không phải cài đặt bị hỏng.
  </Accordion>

  <Accordion title="Tệp lệnh Claude không xuất hiện">
    Đảm bảo gói đã được bật và các tệp markdown nằm trong một gốc
    `commands/` hoặc `skills/` được phát hiện.
  </Accordion>

  <Accordion title="Cài đặt Claude không áp dụng">
    Chỉ cài đặt Pi nhúng từ `settings.json` được hỗ trợ. OpenClaw không
    xem cài đặt của gói là bản vá cấu hình thô.
  </Accordion>

  <Accordion title="Móc nối Claude không thực thi">
    `hooks/hooks.json` chỉ được phát hiện. Nếu bạn cần móc nối có thể chạy, hãy dùng
    bố cục gói móc nối OpenClaw hoặc phát hành một Plugin gốc.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Cài đặt và cấu hình Plugin](/vi/tools/plugin)
- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo một Plugin gốc
- [Manifest Plugin](/vi/plugins/manifest) — lược đồ manifest gốc
