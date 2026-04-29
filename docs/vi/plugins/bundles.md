---
read_when:
    - Bạn muốn cài đặt một gói tương thích với Codex, Claude hoặc Cursor
    - Bạn cần hiểu cách OpenClaw ánh xạ nội dung gói vào các tính năng gốc
    - Bạn đang gỡ lỗi việc phát hiện gói hoặc các khả năng bị thiếu
summary: Cài đặt và sử dụng các gói Codex, Claude và Cursor dưới dạng Plugin OpenClaw
title: Các gói Plugin
x-i18n:
    generated_at: "2026-04-29T22:59:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d8dcd6eae5e740c27429454a7396332f1bd3b16c0a4e939321d047b5e2e4ff7
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw có thể cài đặt plugin từ ba hệ sinh thái bên ngoài: **Codex**, **Claude**,
và **Cursor**. Những nội dung này được gọi là **gói** — các gói nội dung và siêu dữ liệu mà
OpenClaw ánh xạ thành các tính năng gốc như Skills, hook và công cụ MCP.

<Info>
  Gói **không** giống với plugin OpenClaw gốc. Plugin gốc chạy
  trong tiến trình và có thể đăng ký bất kỳ capability nào. Gói là các gói nội dung có
  ánh xạ tính năng chọn lọc và ranh giới tin cậy hẹp hơn.
</Info>

## Vì sao có gói

Nhiều plugin hữu ích được phát hành theo định dạng Codex, Claude hoặc Cursor. Thay
vì yêu cầu tác giả viết lại chúng thành plugin OpenClaw gốc, OpenClaw
phát hiện các định dạng này và ánh xạ nội dung được hỗ trợ của chúng vào bộ tính năng
gốc. Điều này có nghĩa là bạn có thể cài đặt một gói lệnh Claude hoặc một gói Skills Codex
và dùng ngay.

## Cài đặt một gói

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
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

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Gói hiển thị dưới dạng `Format: bundle` với subtype là `codex`, `claude` hoặc `cursor`.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    Các tính năng đã ánh xạ (Skills, hook, công cụ MCP, mặc định LSP) sẽ có trong phiên tiếp theo.

  </Step>
</Steps>

## OpenClaw ánh xạ gì từ gói

Hiện nay không phải mọi tính năng của gói đều chạy trong OpenClaw. Dưới đây là những gì hoạt động và những gì
được phát hiện nhưng chưa được nối dây.

### Hiện đã hỗ trợ

| Tính năng     | Cách ánh xạ                                                                                 | Áp dụng cho    |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Nội dung Skills | Gốc Skills của gói được tải như Skills OpenClaw bình thường                                | Tất cả định dạng |
| Lệnh          | `commands/` và `.cursor/commands/` được xem là gốc Skills                                   | Claude, Cursor |
| Gói hook      | Bố cục kiểu OpenClaw `HOOK.md` + `handler.ts`                                               | Codex          |
| Công cụ MCP   | Cấu hình MCP của gói được hợp nhất vào cài đặt Pi nhúng; tải các máy chủ stdio và HTTP được hỗ trợ | Tất cả định dạng |
| Máy chủ LSP   | `.lsp.json` của Claude và `lspServers` khai báo trong manifest được hợp nhất vào mặc định LSP của Pi nhúng | Claude         |
| Cài đặt       | `settings.json` của Claude được nhập làm mặc định Pi nhúng                                  | Claude         |

#### Nội dung Skills

- gốc Skills của gói được tải như gốc Skills OpenClaw bình thường
- các gốc `commands` của Claude được xem là gốc Skills bổ sung
- các gốc `.cursor/commands` của Cursor được xem là gốc Skills bổ sung

Điều này có nghĩa là các tệp lệnh markdown của Claude hoạt động qua bộ tải Skills
OpenClaw bình thường. Markdown lệnh của Cursor hoạt động qua cùng đường dẫn.

#### Gói hook

- gốc hook của gói hoạt động **chỉ** khi chúng dùng bố cục gói hook
  OpenClaw bình thường. Hiện nay đây chủ yếu là trường hợp tương thích với Codex:
  - `HOOK.md`
  - `handler.ts` hoặc `handler.js`

#### MCP cho Pi

- các gói đã bật có thể đóng góp cấu hình máy chủ MCP
- OpenClaw hợp nhất cấu hình MCP của gói vào cài đặt Pi nhúng hiệu lực dưới dạng
  `mcpServers`
- OpenClaw hiển thị các công cụ MCP của gói được hỗ trợ trong lượt chạy tác tử Pi nhúng bằng cách
  khởi chạy máy chủ stdio hoặc kết nối tới máy chủ HTTP
- các hồ sơ công cụ `coding` và `messaging` mặc định bao gồm công cụ MCP của gói;
  dùng `tools.deny: ["bundle-mcp"]` để loại trừ cho một tác tử hoặc gateway
- cài đặt Pi cục bộ theo dự án vẫn áp dụng sau mặc định của gói, nên cài đặt
  workspace có thể ghi đè mục MCP của gói khi cần
- catalog công cụ MCP của gói được sắp xếp xác định trước khi đăng ký, nên
  thay đổi thứ tự `listTools()` từ thượng nguồn không làm xáo trộn các khối công cụ trong prompt-cache

##### Transport

Máy chủ MCP có thể dùng transport stdio hoặc HTTP:

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
- chỉ các lược đồ URL `http:` và `https:` được phép
- giá trị `headers` hỗ trợ nội suy `${ENV_VAR}`
- mục máy chủ có cả `command` và `url` sẽ bị từ chối
- thông tin xác thực URL (userinfo và tham số truy vấn) được biên tập khỏi
  mô tả công cụ và nhật ký
- `connectionTimeoutMs` ghi đè thời gian chờ kết nối mặc định 30 giây cho
  cả transport stdio và HTTP

##### Đặt tên công cụ

OpenClaw đăng ký công cụ MCP của gói bằng tên an toàn cho nhà cung cấp theo dạng
`serverName__toolName`. Ví dụ, một máy chủ có khóa `"vigil-harbor"` cung cấp công cụ
`memory_search` sẽ được đăng ký là `vigil-harbor__memory_search`.

- ký tự ngoài `A-Za-z0-9_-` được thay bằng `-`
- tiền tố máy chủ được giới hạn ở 30 ký tự
- tên công cụ đầy đủ được giới hạn ở 64 ký tự
- tên máy chủ rỗng dùng dự phòng `mcp`
- các tên đã làm sạch bị trùng được phân biệt bằng hậu tố số
- thứ tự công cụ cuối cùng được hiển thị là xác định theo tên an toàn để giữ các lượt Pi
  lặp lại ổn định với bộ nhớ đệm
- lọc hồ sơ xem tất cả công cụ từ một máy chủ MCP của gói là thuộc sở hữu plugin
  bởi `bundle-mcp`, nên allowlist và deny list của hồ sơ có thể bao gồm
  tên công cụ hiển thị riêng lẻ hoặc khóa plugin `bundle-mcp`

#### Cài đặt Pi nhúng

- `settings.json` của Claude được nhập làm cài đặt Pi nhúng mặc định khi
  gói được bật
- OpenClaw làm sạch các khóa ghi đè shell trước khi áp dụng

Các khóa đã làm sạch:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi nhúng

- các gói Claude đã bật có thể đóng góp cấu hình máy chủ LSP
- OpenClaw tải `.lsp.json` cùng mọi đường dẫn `lspServers` khai báo trong manifest
- cấu hình LSP của gói được hợp nhất vào mặc định LSP Pi nhúng hiệu lực
- hiện nay chỉ máy chủ LSP dựa trên stdio được hỗ trợ mới chạy được; các
  transport không được hỗ trợ vẫn hiển thị trong `openclaw plugins inspect <id>`

### Được phát hiện nhưng không thực thi

Các mục này được nhận diện và hiển thị trong chẩn đoán, nhưng OpenClaw không chạy chúng:

- `agents`, tự động hóa `hooks.json`, `outputStyles` của Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` của Cursor
- siêu dữ liệu inline/app của Codex ngoài báo cáo capability

## Định dạng gói

<AccordionGroup>
  <Accordion title="Codex bundles">
    Dấu hiệu: `.codex-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Gói Codex phù hợp nhất với OpenClaw khi chúng dùng gốc Skills và các thư mục
    gói hook kiểu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    Hai chế độ phát hiện:

    - **Dựa trên manifest:** `.claude-plugin/plugin.json`
    - **Không có manifest:** bố cục Claude mặc định (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Hành vi riêng của Claude:

    - `commands/` được xem là nội dung Skills
    - `settings.json` được nhập vào cài đặt Pi nhúng (các khóa ghi đè shell được làm sạch)
    - `.mcp.json` hiển thị các công cụ stdio được hỗ trợ cho Pi nhúng
    - `.lsp.json` cùng các đường dẫn `lspServers` khai báo trong manifest được tải vào mặc định LSP của Pi nhúng
    - `hooks/hooks.json` được phát hiện nhưng không thực thi
    - Đường dẫn thành phần tùy chỉnh trong manifest là bổ sung (chúng mở rộng mặc định, không thay thế mặc định)

  </Accordion>

  <Accordion title="Cursor bundles">
    Dấu hiệu: `.cursor-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` được xem là nội dung Skills
    - `.cursor/rules/`, `.cursor/agents/`, và `.cursor/hooks.json` chỉ được phát hiện

  </Accordion>
</AccordionGroup>

## Thứ tự ưu tiên phát hiện

OpenClaw kiểm tra định dạng plugin gốc trước:

1. `openclaw.plugin.json` hoặc `package.json` hợp lệ có `openclaw.extensions` — được xem là **plugin gốc**
2. Dấu hiệu gói (`.codex-plugin/`, `.claude-plugin/`, hoặc bố cục Claude/Cursor mặc định) — được xem là **gói**

Nếu một thư mục chứa cả hai, OpenClaw dùng đường dẫn gốc. Điều này ngăn
các gói hai định dạng bị cài đặt một phần dưới dạng gói.

## Phụ thuộc runtime và dọn dẹp

- Phụ thuộc runtime của plugin đóng gói được đưa kèm bên trong gói OpenClaw dưới
  `dist/*`. OpenClaw **không** chạy `npm install` khi khởi động cho các plugin
  đóng gói; pipeline phát hành chịu trách nhiệm đưa kèm payload phụ thuộc đóng gói
  hoàn chỉnh (xem quy tắc xác minh sau phát hành trong
  [Phát hành](/vi/reference/RELEASING)).

## Bảo mật

Gói có ranh giới tin cậy hẹp hơn plugin gốc:

- OpenClaw **không** tải module runtime tùy ý của gói trong tiến trình
- Đường dẫn Skills và gói hook phải nằm bên trong gốc plugin (được kiểm tra ranh giới)
- Tệp cài đặt được đọc với cùng các kiểm tra ranh giới
- Máy chủ MCP stdio được hỗ trợ có thể được khởi chạy làm tiến trình con

Điều này khiến gói an toàn hơn theo mặc định, nhưng bạn vẫn nên xem các gói
bên thứ ba là nội dung tin cậy đối với những tính năng mà chúng hiển thị.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    Chạy `openclaw plugins inspect <id>`. Nếu một capability được liệt kê nhưng được đánh dấu là
    chưa nối dây, đó là giới hạn sản phẩm — không phải cài đặt bị hỏng.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    Đảm bảo gói đã được bật và các tệp markdown nằm trong một gốc
    `commands/` hoặc `skills/` được phát hiện.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    Chỉ cài đặt Pi nhúng từ `settings.json` được hỗ trợ. OpenClaw không
    xem cài đặt gói là bản vá cấu hình thô.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` chỉ được phát hiện. Nếu bạn cần hook có thể chạy, hãy dùng
    bố cục gói hook OpenClaw hoặc phát hành một plugin gốc.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Cài đặt và cấu hình Plugin](/vi/tools/plugin)
- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo một plugin gốc
- [Manifest Plugin](/vi/plugins/manifest) — schema manifest gốc
