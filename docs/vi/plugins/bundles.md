---
read_when:
    - Bạn muốn cài đặt một gói tương thích với Codex, Claude hoặc Cursor
    - Bạn cần hiểu cách OpenClaw ánh xạ nội dung gói vào các tính năng gốc
    - Bạn đang gỡ lỗi việc phát hiện gói tích hợp hoặc các năng lực bị thiếu
summary: Cài đặt và sử dụng các gói Codex, Claude và Cursor dưới dạng Plugin của OpenClaw
title: Các gói Plugin
x-i18n:
    generated_at: "2026-05-10T19:41:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw có thể cài đặt Plugin từ ba hệ sinh thái bên ngoài: **Codex**, **Claude**,
và **Cursor**. Chúng được gọi là **bundle** — các gói nội dung và siêu dữ liệu mà
OpenClaw ánh xạ vào các tính năng gốc như Skills, hook và công cụ MCP.

<Info>
  Bundle **không** giống Plugin gốc của OpenClaw. Plugin gốc chạy
  trong tiến trình và có thể đăng ký bất kỳ capability nào. Bundle là các gói nội dung với
  ánh xạ tính năng có chọn lọc và ranh giới tin cậy hẹp hơn.
</Info>

## Vì sao bundle tồn tại

Nhiều Plugin hữu ích được phát hành theo định dạng Codex, Claude hoặc Cursor. Thay vì
yêu cầu tác giả viết lại chúng thành Plugin gốc của OpenClaw, OpenClaw
phát hiện các định dạng này và ánh xạ nội dung được hỗ trợ của chúng vào bộ tính năng
gốc. Điều này nghĩa là bạn có thể cài đặt một gói lệnh Claude hoặc một bundle Skills Codex
và dùng ngay lập tức.

## Cài đặt một bundle

<Steps>
  <Step title="Cài đặt từ thư mục, tệp lưu trữ hoặc marketplace">
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

  <Step title="Xác minh việc phát hiện">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundle hiển thị là `Format: bundle` với subtype là `codex`, `claude` hoặc `cursor`.

  </Step>

  <Step title="Khởi động lại và sử dụng">
    ```bash
    openclaw gateway restart
    ```

    Các tính năng đã ánh xạ (Skills, hook, công cụ MCP, mặc định LSP) sẽ có trong phiên tiếp theo.

  </Step>
</Steps>

## OpenClaw ánh xạ gì từ bundle

Không phải mọi tính năng của bundle hiện đều chạy trong OpenClaw. Đây là những gì hoạt động và những gì
được phát hiện nhưng chưa được nối dây.

### Hiện được hỗ trợ

| Tính năng     | Cách ánh xạ                                                                                 | Áp dụng cho    |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Nội dung Skills | Gốc Skills của bundle được tải như Skills OpenClaw bình thường                              | Mọi định dạng  |
| Lệnh          | `commands/` và `.cursor/commands/` được xử lý như gốc Skills                                | Claude, Cursor |
| Gói hook      | Bố cục kiểu OpenClaw `HOOK.md` + `handler.ts`                                               | Codex          |
| Công cụ MCP   | Cấu hình MCP của bundle được hợp nhất vào cài đặt Pi nhúng; các server stdio và HTTP được hỗ trợ sẽ được tải | Mọi định dạng  |
| Server LSP    | `.lsp.json` của Claude và `lspServers` được khai báo trong manifest được hợp nhất vào mặc định LSP Pi nhúng | Claude         |
| Cài đặt       | `settings.json` của Claude được nhập làm mặc định Pi nhúng                                  | Claude         |

#### Nội dung Skills

- gốc Skills của bundle được tải như gốc Skills OpenClaw bình thường
- gốc `commands` của Claude được xử lý như gốc Skills bổ sung
- gốc `.cursor/commands` của Cursor được xử lý như gốc Skills bổ sung

Điều này nghĩa là các tệp lệnh markdown của Claude hoạt động thông qua bộ tải Skills
OpenClaw bình thường. Markdown lệnh Cursor hoạt động qua cùng đường dẫn.

#### Gói hook

- gốc hook của bundle hoạt động **chỉ** khi chúng dùng bố cục gói hook
  OpenClaw bình thường. Hiện nay đây chủ yếu là trường hợp tương thích với Codex:
  - `HOOK.md`
  - `handler.ts` hoặc `handler.js`

#### MCP cho Pi

- bundle đã bật có thể đóng góp cấu hình server MCP
- OpenClaw hợp nhất cấu hình MCP của bundle vào cài đặt Pi nhúng hiệu lực dưới dạng
  `mcpServers`
- OpenClaw phơi bày các công cụ MCP bundle được hỗ trợ trong lượt tác nhân Pi nhúng bằng cách
  khởi chạy server stdio hoặc kết nối tới server HTTP
- hồ sơ công cụ `coding` và `messaging` mặc định bao gồm công cụ MCP bundle; dùng `tools.deny: ["bundle-mcp"]` để từ chối cho một tác nhân hoặc Gateway
- cài đặt Pi cục bộ theo dự án vẫn áp dụng sau mặc định bundle, nên cài đặt
  workspace có thể ghi đè mục MCP bundle khi cần
- danh mục công cụ MCP bundle được sắp xếp xác định trước khi đăng ký, nên
  thay đổi thứ tự `listTools()` upstream không làm xáo trộn các khối công cụ prompt-cache

##### Transport

Server MCP có thể dùng transport stdio hoặc HTTP:

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

**HTTP** kết nối tới một server MCP đang chạy qua `sse` theo mặc định, hoặc `streamable-http` khi được yêu cầu:

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
- `type: "http"` là dạng downstream gốc CLI; dùng `transport: "streamable-http"` trong cấu hình OpenClaw. `openclaw mcp set` và `openclaw doctor --fix` chuẩn hóa alias phổ biến.
- chỉ cho phép scheme URL `http:` và `https:`
- giá trị `headers` hỗ trợ nội suy `${ENV_VAR}`
- mục server có cả `command` và `url` sẽ bị từ chối
- thông tin xác thực trong URL (userinfo và tham số truy vấn) được biên tập khỏi mô tả
  công cụ và log
- `connectionTimeoutMs` ghi đè thời gian chờ kết nối mặc định 30 giây cho
  cả transport stdio và HTTP

##### Đặt tên công cụ

OpenClaw đăng ký công cụ MCP bundle với tên an toàn cho provider theo dạng
`serverName__toolName`. Ví dụ, một server có khóa `"vigil-harbor"` phơi bày công cụ
`memory_search` sẽ được đăng ký là `vigil-harbor__memory_search`.

- ký tự nằm ngoài `A-Za-z0-9_-` được thay bằng `-`
- các đoạn bắt đầu bằng ký tự không phải chữ cái sẽ nhận tiền tố chữ cái, nên khóa
  server dạng số như `12306` trở thành tiền tố công cụ an toàn cho provider
- tiền tố server bị giới hạn ở 30 ký tự
- tên công cụ đầy đủ bị giới hạn ở 64 ký tự
- tên server rỗng fallback về `mcp`
- các tên đã chuẩn hóa bị trùng được phân biệt bằng hậu tố số
- thứ tự công cụ cuối cùng được phơi bày là xác định theo tên an toàn để giữ cho các lượt Pi
  lặp lại ổn định cache
- lọc hồ sơ xem mọi công cụ từ một server MCP bundle là do Plugin sở hữu
  bởi `bundle-mcp`, nên allowlist và deny list của hồ sơ có thể bao gồm
  tên công cụ được phơi bày riêng lẻ hoặc khóa Plugin `bundle-mcp`

#### Cài đặt Pi nhúng

- `settings.json` của Claude được nhập làm cài đặt Pi nhúng mặc định khi
  bundle được bật
- OpenClaw làm sạch các khóa ghi đè shell trước khi áp dụng chúng

Khóa đã làm sạch:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi nhúng

- bundle Claude đã bật có thể đóng góp cấu hình server LSP
- OpenClaw tải `.lsp.json` cùng bất kỳ đường dẫn `lspServers` nào được khai báo trong manifest
- cấu hình LSP bundle được hợp nhất vào mặc định LSP Pi nhúng hiệu lực
- hiện nay chỉ các server LSP dựa trên stdio được hỗ trợ mới có thể chạy; transport
  không được hỗ trợ vẫn hiển thị trong `openclaw plugins inspect <id>`

### Được phát hiện nhưng không được thực thi

Các mục này được nhận diện và hiển thị trong chẩn đoán, nhưng OpenClaw không chạy chúng:

- `agents`, tự động hóa `hooks.json`, `outputStyles` của Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` của Cursor
- siêu dữ liệu inline/app của Codex ngoài báo cáo capability

## Định dạng bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marker: `.codex-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundle Codex phù hợp với OpenClaw nhất khi chúng dùng gốc Skills và thư mục
    gói hook kiểu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Hai chế độ phát hiện:

    - **Dựa trên manifest:** `.claude-plugin/plugin.json`
    - **Không có manifest:** bố cục Claude mặc định (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Hành vi riêng của Claude:

    - `commands/` được xử lý như nội dung Skills
    - `settings.json` được nhập vào cài đặt Pi nhúng (các khóa ghi đè shell được làm sạch)
    - `.mcp.json` phơi bày các công cụ stdio được hỗ trợ cho Pi nhúng
    - `.lsp.json` cùng các đường dẫn `lspServers` được khai báo trong manifest được tải vào mặc định LSP Pi nhúng
    - `hooks/hooks.json` được phát hiện nhưng không được thực thi
    - Đường dẫn thành phần tùy chỉnh trong manifest là bổ sung (chúng mở rộng mặc định, không thay thế chúng)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marker: `.cursor-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` được xử lý như nội dung Skills
    - `.cursor/rules/`, `.cursor/agents/`, và `.cursor/hooks.json` chỉ được phát hiện

  </Accordion>
</AccordionGroup>

## Thứ tự ưu tiên phát hiện

OpenClaw kiểm tra định dạng Plugin gốc trước:

1. `openclaw.plugin.json` hoặc `package.json` hợp lệ với `openclaw.extensions` — được xử lý như **Plugin gốc**
2. Marker bundle (`.codex-plugin/`, `.claude-plugin/`, hoặc bố cục Claude/Cursor mặc định) — được xử lý như **bundle**

Nếu một thư mục chứa cả hai, OpenClaw dùng đường dẫn gốc. Điều này ngăn
các gói hai định dạng bị cài đặt một phần như bundle.

## Phụ thuộc runtime và dọn dẹp

- Bundle tương thích của bên thứ ba không nhận sửa chữa `npm install` khi khởi động. Chúng
  nên được cài đặt qua `openclaw plugins install` và đóng gói mọi thứ
  chúng cần trong thư mục Plugin đã cài đặt.
- Plugin bundle do OpenClaw sở hữu hoặc được đóng gói nhẹ trong core hoặc
  có thể tải xuống qua trình cài đặt Plugin. Khởi động Gateway không bao giờ chạy
  trình quản lý gói cho chúng.
- `openclaw doctor --fix` xóa các thư mục phụ thuộc staged cũ và có thể
  khôi phục các Plugin có thể tải xuống bị thiếu khỏi chỉ mục Plugin cục bộ khi
  cấu hình tham chiếu đến chúng.

## Bảo mật

Bundle có ranh giới tin cậy hẹp hơn Plugin gốc:

- OpenClaw **không** tải các module runtime bundle tùy ý trong tiến trình
- Đường dẫn Skills và gói hook phải nằm trong gốc Plugin (được kiểm tra ranh giới)
- Tệp cài đặt được đọc với cùng các kiểm tra ranh giới
- Server MCP stdio được hỗ trợ có thể được khởi chạy như subprocess

Điều này khiến bundle an toàn hơn theo mặc định, nhưng bạn vẫn nên xem bundle
bên thứ ba là nội dung đáng tin cậy đối với các tính năng mà chúng phơi bày.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bundle được phát hiện nhưng capability không chạy">
    Chạy `openclaw plugins inspect <id>`. Nếu một capability được liệt kê nhưng được đánh dấu là
    chưa nối dây, đó là giới hạn sản phẩm — không phải cài đặt bị hỏng.
  </Accordion>

  <Accordion title="Tệp lệnh Claude không xuất hiện">
    Đảm bảo bundle đã được bật và các tệp markdown nằm trong gốc
    `commands/` hoặc `skills/` được phát hiện.
  </Accordion>

  <Accordion title="Cài đặt Claude không áp dụng">
    Chỉ hỗ trợ cài đặt Pi nhúng từ `settings.json`. OpenClaw không
    xử lý cài đặt bundle như các bản vá cấu hình thô.
  </Accordion>

  <Accordion title="Hook Claude không thực thi">
    `hooks/hooks.json` chỉ được phát hiện. Nếu bạn cần hook có thể chạy, hãy dùng
    bố cục gói hook OpenClaw hoặc phát hành một Plugin gốc.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Cài đặt và cấu hình Plugin](/vi/tools/plugin)
- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo một Plugin gốc
- [Manifest Plugin](/vi/plugins/manifest) — schema manifest gốc
