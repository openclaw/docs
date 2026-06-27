---
read_when:
    - Bạn muốn cài đặt một gói tương thích với Codex, Claude hoặc Cursor
    - Bạn cần hiểu cách OpenClaw ánh xạ nội dung gói vào các tính năng gốc
    - Bạn đang gỡ lỗi việc phát hiện gói bundle hoặc các khả năng bị thiếu
summary: Cài đặt và sử dụng các gói Codex, Claude và Cursor dưới dạng Plugin OpenClaw
title: Gói Plugin
x-i18n:
    generated_at: "2026-06-27T17:43:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw có thể cài đặt plugin từ ba hệ sinh thái bên ngoài: **Codex**, **Claude**,
và **Cursor**. Chúng được gọi là **bundle** — các gói nội dung và siêu dữ liệu mà
OpenClaw ánh xạ thành các tính năng gốc như Skills, hook và công cụ MCP.

<Info>
  Bundle **không** giống plugin OpenClaw gốc. Plugin gốc chạy
  trong tiến trình và có thể đăng ký bất kỳ năng lực nào. Bundle là các gói nội dung có
  ánh xạ tính năng chọn lọc và ranh giới tin cậy hẹp hơn.
</Info>

## Vì sao bundle tồn tại

Nhiều plugin hữu ích được phát hành theo định dạng Codex, Claude hoặc Cursor. Thay vì
yêu cầu tác giả viết lại chúng thành plugin OpenClaw gốc, OpenClaw
phát hiện các định dạng này và ánh xạ nội dung được hỗ trợ của chúng vào bộ tính năng
gốc. Điều này có nghĩa là bạn có thể cài đặt một gói lệnh Claude hoặc một bundle Skills Codex
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

  <Step title="Xác minh phát hiện">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundle hiển thị là `Format: bundle` với kiểu con là `codex`, `claude` hoặc `cursor`.

  </Step>

  <Step title="Khởi động lại và sử dụng">
    ```bash
    openclaw gateway restart
    ```

    Các tính năng được ánh xạ (Skills, hook, công cụ MCP, mặc định LSP) sẽ có sẵn trong phiên tiếp theo.

  </Step>
</Steps>

## OpenClaw ánh xạ gì từ bundle

Không phải mọi tính năng bundle đều chạy trong OpenClaw hiện nay. Dưới đây là những gì hoạt động và những gì
được phát hiện nhưng chưa được kết nối.

### Hiện đã hỗ trợ

| Tính năng       | Cách ánh xạ                                                                                       | Áp dụng cho     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Nội dung Skills | Gốc Skills của bundle tải như Skills OpenClaw bình thường                                                 | Mọi định dạng    |
| Lệnh      | `commands/` và `.cursor/commands/` được xử lý như gốc Skills                                        | Claude, Cursor |
| Gói hook    | Bố cục `HOOK.md` + `handler.ts` kiểu OpenClaw                                                   | Codex          |
| Công cụ MCP     | Cấu hình MCP của bundle được hợp nhất vào cài đặt OpenClaw nhúng; các máy chủ stdio và HTTP được hỗ trợ sẽ được tải | Mọi định dạng    |
| Máy chủ LSP   | `.lsp.json` của Claude và `lspServers` khai báo trong manifest được hợp nhất vào mặc định LSP OpenClaw nhúng  | Claude         |
| Cài đặt      | `settings.json` của Claude được nhập làm mặc định OpenClaw nhúng                                     | Claude         |

#### Nội dung Skills

- gốc Skills của bundle tải như gốc Skills OpenClaw bình thường
- gốc `commands` của Claude được xử lý như gốc Skills bổ sung
- gốc `.cursor/commands` của Cursor được xử lý như gốc Skills bổ sung

Điều này có nghĩa là các tệp lệnh markdown của Claude hoạt động thông qua trình tải Skills
OpenClaw bình thường. Markdown lệnh của Cursor hoạt động qua cùng đường dẫn đó.

#### Gói hook

- gốc hook của bundle hoạt động **chỉ** khi chúng dùng bố cục gói hook
  OpenClaw bình thường. Hiện nay đây chủ yếu là trường hợp tương thích với Codex:
  - `HOOK.md`
  - `handler.ts` hoặc `handler.js`

#### MCP cho OpenClaw nhúng

- bundle đã bật có thể đóng góp cấu hình máy chủ MCP
- OpenClaw hợp nhất cấu hình MCP của bundle vào cài đặt OpenClaw nhúng hiệu lực dưới dạng
  `mcpServers`
- OpenClaw hiển thị các công cụ MCP bundle được hỗ trợ trong các lượt agent OpenClaw nhúng bằng cách
  khởi chạy máy chủ stdio hoặc kết nối tới máy chủ HTTP
- hồ sơ công cụ `coding` và `messaging` bao gồm công cụ MCP bundle theo
  mặc định; dùng `tools.deny: ["bundle-mcp"]` để loại trừ cho một agent hoặc Gateway
- cài đặt agent nhúng cục bộ theo dự án vẫn áp dụng sau mặc định bundle, nên cài đặt
  workspace có thể ghi đè mục MCP bundle khi cần
- danh mục công cụ MCP bundle được sắp xếp xác định trước khi đăng ký, nên
  thay đổi thứ tự `listTools()` từ upstream không làm xáo trộn các khối công cụ trong prompt-cache

##### Giao thức truyền tải

Máy chủ MCP có thể dùng giao thức truyền tải stdio hoặc HTTP:

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
- `type: "http"` là dạng downstream gốc của CLI; dùng `transport: "streamable-http"` trong cấu hình OpenClaw. `openclaw mcp set` và `openclaw doctor --fix` chuẩn hóa alias phổ biến này.
- chỉ cho phép lược đồ URL `http:` và `https:`
- giá trị `headers` hỗ trợ nội suy `${ENV_VAR}`
- mục máy chủ có cả `command` và `url` sẽ bị từ chối
- thông tin xác thực URL (userinfo và tham số truy vấn) được biên tập khỏi
  mô tả công cụ và nhật ký
- `connectionTimeoutMs` ghi đè thời gian chờ kết nối mặc định 30 giây cho
  cả giao thức truyền tải stdio và HTTP

##### Đặt tên công cụ

OpenClaw đăng ký công cụ MCP bundle với tên an toàn cho nhà cung cấp theo dạng
`serverName__toolName`. Ví dụ: một máy chủ có khóa `"vigil-harbor"` hiển thị
công cụ `memory_search` sẽ được đăng ký là `vigil-harbor__memory_search`.

- ký tự ngoài `A-Za-z0-9_-` được thay bằng `-`
- các đoạn có thể bắt đầu bằng ký tự không phải chữ cái sẽ nhận tiền tố chữ cái, nên khóa
  máy chủ dạng số như `12306` trở thành tiền tố công cụ an toàn cho nhà cung cấp
- tiền tố máy chủ bị giới hạn ở 30 ký tự
- tên công cụ đầy đủ bị giới hạn ở 64 ký tự
- tên máy chủ trống sẽ dùng dự phòng `mcp`
- các tên đã làm sạch bị trùng được phân biệt bằng hậu tố số
- thứ tự công cụ hiển thị cuối cùng xác định theo tên an toàn để giữ cho các lượt embedded-agent
  lặp lại ổn định bộ nhớ đệm
- lọc hồ sơ xem mọi công cụ từ một máy chủ MCP bundle là do plugin
  `bundle-mcp` sở hữu, nên danh sách cho phép và danh sách từ chối của hồ sơ có thể bao gồm
  tên công cụ hiển thị riêng lẻ hoặc khóa plugin `bundle-mcp`

#### Cài đặt OpenClaw nhúng

- `settings.json` của Claude được nhập làm cài đặt OpenClaw nhúng mặc định khi
  bundle được bật
- OpenClaw làm sạch khóa ghi đè shell trước khi áp dụng chúng

Khóa đã làm sạch:

- `shellPath`
- `shellCommandPrefix`

#### LSP OpenClaw nhúng

- bundle Claude đã bật có thể đóng góp cấu hình máy chủ LSP
- OpenClaw tải `.lsp.json` cùng mọi đường dẫn `lspServers` khai báo trong manifest
- cấu hình LSP của bundle được hợp nhất vào mặc định LSP OpenClaw nhúng hiệu lực
- hiện nay chỉ máy chủ LSP được stdio hậu thuẫn và được hỗ trợ là có thể chạy; giao thức truyền tải
  không được hỗ trợ vẫn hiển thị trong `openclaw plugins inspect <id>`

### Được phát hiện nhưng không thực thi

Các mục này được nhận diện và hiển thị trong chẩn đoán, nhưng OpenClaw không chạy chúng:

- `agents`, tự động hóa `hooks.json`, `outputStyles` của Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` của Cursor
- siêu dữ liệu inline/app của Codex ngoài báo cáo năng lực

## Định dạng bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marker: `.codex-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundle Codex phù hợp nhất với OpenClaw khi chúng dùng gốc Skills và thư mục
    gói hook kiểu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Hai chế độ phát hiện:

    - **Dựa trên manifest:** `.claude-plugin/plugin.json`
    - **Không có manifest:** bố cục Claude mặc định (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Hành vi riêng của Claude:

    - `commands/` được xử lý như nội dung Skills
    - `settings.json` được nhập vào cài đặt OpenClaw nhúng (khóa ghi đè shell được làm sạch)
    - `.mcp.json` hiển thị công cụ stdio được hỗ trợ cho OpenClaw nhúng
    - `.lsp.json` cùng các đường dẫn `lspServers` khai báo trong manifest tải vào mặc định LSP OpenClaw nhúng
    - `hooks/hooks.json` được phát hiện nhưng không thực thi
    - Đường dẫn thành phần tùy chỉnh trong manifest là cộng thêm (chúng mở rộng mặc định, không thay thế)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marker: `.cursor-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` được xử lý như nội dung Skills
    - `.cursor/rules/`, `.cursor/agents/`, và `.cursor/hooks.json` chỉ được phát hiện

  </Accordion>
</AccordionGroup>

## Thứ tự ưu tiên phát hiện

OpenClaw kiểm tra định dạng plugin gốc trước:

1. `openclaw.plugin.json` hoặc `package.json` hợp lệ có `openclaw.extensions` — được xử lý như **plugin gốc**
2. Marker bundle (`.codex-plugin/`, `.claude-plugin/`, hoặc bố cục Claude/Cursor mặc định) — được xử lý như **bundle**

Nếu một thư mục chứa cả hai, OpenClaw dùng đường dẫn gốc. Điều này ngăn
các gói hai định dạng bị cài đặt một phần dưới dạng bundle.

## Phụ thuộc runtime và dọn dẹp

- Bundle tương thích của bên thứ ba không được sửa chữa `npm install` khi khởi động. Chúng
  nên được cài đặt qua `openclaw plugins install` và đi kèm mọi thứ
  chúng cần trong thư mục plugin đã cài đặt.
- Plugin bundle do OpenClaw sở hữu hoặc được phát hành gọn nhẹ trong core, hoặc
  có thể tải xuống qua trình cài đặt plugin. Khi khởi động, Gateway không bao giờ chạy
  trình quản lý gói cho chúng.
- `openclaw doctor --fix` xóa các thư mục phụ thuộc staged cũ và có thể
  khôi phục plugin có thể tải xuống bị thiếu khỏi chỉ mục plugin cục bộ khi
  cấu hình tham chiếu tới chúng.

## Bảo mật

Bundle có ranh giới tin cậy hẹp hơn plugin gốc:

- OpenClaw **không** tải mô-đun runtime bundle tùy ý trong tiến trình
- Đường dẫn Skills và gói hook phải ở trong gốc plugin (được kiểm tra ranh giới)
- Tệp cài đặt được đọc với cùng các kiểm tra ranh giới
- Máy chủ MCP stdio được hỗ trợ có thể được khởi chạy dưới dạng tiến trình con

Điều này khiến bundle an toàn hơn theo mặc định, nhưng bạn vẫn nên xem bundle
bên thứ ba là nội dung đáng tin cậy đối với các tính năng mà chúng hiển thị.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bundle được phát hiện nhưng năng lực không chạy">
    Chạy `openclaw plugins inspect <id>`. Nếu một năng lực được liệt kê nhưng được đánh dấu là
    chưa được kết nối, đó là giới hạn sản phẩm — không phải cài đặt bị lỗi.
  </Accordion>

  <Accordion title="Tệp lệnh Claude không xuất hiện">
    Hãy đảm bảo bundle được bật và các tệp markdown nằm trong gốc
    `commands/` hoặc `skills/` được phát hiện.
  </Accordion>

  <Accordion title="Cài đặt Claude không áp dụng">
    Chỉ hỗ trợ cài đặt OpenClaw nhúng từ `settings.json`. OpenClaw không
    xử lý cài đặt bundle như bản vá cấu hình thô.
  </Accordion>

  <Accordion title="Hook Claude không thực thi">
    `hooks/hooks.json` chỉ được phát hiện. Nếu bạn cần hook có thể chạy, hãy dùng
    bố cục gói hook OpenClaw hoặc phát hành một plugin gốc.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Cài đặt và cấu hình plugin](/vi/tools/plugin)
- [Xây dựng plugin](/vi/plugins/building-plugins) — tạo một plugin gốc
- [Manifest plugin](/vi/plugins/manifest) — schema manifest gốc
