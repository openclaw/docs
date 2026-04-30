---
read_when:
    - Bạn muốn cài đặt một gói tương thích với Codex, Claude hoặc Cursor
    - Bạn cần hiểu cách OpenClaw ánh xạ nội dung gói sang các tính năng gốc
    - Bạn đang gỡ lỗi việc phát hiện bundle hoặc các khả năng bị thiếu
summary: Cài đặt và sử dụng các gói Codex, Claude và Cursor dưới dạng Plugin OpenClaw
title: Các gói Plugin
x-i18n:
    generated_at: "2026-04-30T00:06:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw có thể cài đặt Plugin từ ba hệ sinh thái bên ngoài: **Codex**, **Claude**,
và **Cursor**. Chúng được gọi là **bundle** — các gói nội dung và siêu dữ liệu mà
OpenClaw ánh xạ thành những tính năng gốc như skills, hook và công cụ MCP.

<Info>
  Bundle **không** giống Plugin OpenClaw gốc. Plugin gốc chạy
  trong tiến trình và có thể đăng ký bất kỳ capability nào. Bundle là các gói nội dung với
  ánh xạ tính năng có chọn lọc và ranh giới tin cậy hẹp hơn.
</Info>

## Vì sao bundle tồn tại

Nhiều Plugin hữu ích được phát hành ở định dạng Codex, Claude hoặc Cursor. Thay vì
yêu cầu tác giả viết lại chúng thành Plugin OpenClaw gốc, OpenClaw
phát hiện các định dạng này và ánh xạ nội dung được hỗ trợ của chúng vào bộ tính năng
gốc. Điều này nghĩa là bạn có thể cài đặt một gói lệnh Claude hoặc một bundle skill Codex
và dùng ngay lập tức.

## Cài đặt bundle

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

    Bundle hiển thị là `Format: bundle` với một kiểu con là `codex`, `claude`, hoặc `cursor`.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    Các tính năng đã ánh xạ (skills, hook, công cụ MCP, mặc định LSP) sẽ khả dụng trong phiên tiếp theo.

  </Step>
</Steps>

## OpenClaw ánh xạ những gì từ bundle

Không phải mọi tính năng của bundle hiện đều chạy trong OpenClaw. Dưới đây là những gì hoạt động và những gì
được phát hiện nhưng chưa được nối dây.

### Hiện đã hỗ trợ

| Tính năng       | Cách ánh xạ                                                                                 | Áp dụng cho     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Nội dung skill | Gốc skill của bundle tải như skill OpenClaw bình thường                                           | Mọi định dạng    |
| Lệnh      | `commands/` và `.cursor/commands/` được xử lý như gốc skill                                  | Claude, Cursor |
| Gói hook    | Bố cục kiểu OpenClaw `HOOK.md` + `handler.ts`                                             | Codex          |
| Công cụ MCP     | Cấu hình MCP của bundle được hợp nhất vào cài đặt Pi nhúng; máy chủ stdio và HTTP được hỗ trợ sẽ được tải | Mọi định dạng    |
| Máy chủ LSP   | Claude `.lsp.json` và `lspServers` khai báo trong manifest được hợp nhất vào mặc định LSP của Pi nhúng  | Claude         |
| Cài đặt      | Claude `settings.json` được nhập làm mặc định Pi nhúng                                     | Claude         |

#### Nội dung skill

- gốc skill của bundle tải như gốc skill OpenClaw bình thường
- gốc `commands` của Claude được xử lý như gốc skill bổ sung
- gốc `.cursor/commands` của Cursor được xử lý như gốc skill bổ sung

Điều này nghĩa là các tệp lệnh markdown của Claude hoạt động thông qua bộ tải skill
OpenClaw bình thường. Markdown lệnh của Cursor hoạt động qua cùng đường dẫn.

#### Gói hook

- gốc hook của bundle hoạt động **chỉ** khi chúng dùng bố cục gói hook
  OpenClaw bình thường. Hiện nay đây chủ yếu là trường hợp tương thích với Codex:
  - `HOOK.md`
  - `handler.ts` hoặc `handler.js`

#### MCP cho Pi

- các bundle đã bật có thể đóng góp cấu hình máy chủ MCP
- OpenClaw hợp nhất cấu hình MCP của bundle vào cài đặt Pi nhúng hiệu lực dưới dạng
  `mcpServers`
- OpenClaw cung cấp các công cụ MCP bundle được hỗ trợ trong lượt chạy tác nhân Pi nhúng bằng cách
  khởi chạy máy chủ stdio hoặc kết nối tới máy chủ HTTP
- các hồ sơ công cụ `coding` và `messaging` mặc định bao gồm công cụ MCP bundle; dùng `tools.deny: ["bundle-mcp"]` để chọn không dùng cho một tác nhân hoặc gateway
- cài đặt Pi cục bộ theo dự án vẫn áp dụng sau mặc định bundle, nên cài đặt
  workspace có thể ghi đè mục MCP của bundle khi cần
- danh mục công cụ MCP của bundle được sắp xếp xác định trước khi đăng ký, để
  thay đổi thứ tự `listTools()` từ upstream không làm xáo trộn các khối công cụ prompt-cache

##### Giao thức vận chuyển

Máy chủ MCP có thể dùng giao thức vận chuyển stdio hoặc HTTP:

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
- `type: "http"` là dạng downstream gốc CLI; dùng `transport: "streamable-http"` trong cấu hình OpenClaw. `openclaw mcp set` và `openclaw doctor --fix` chuẩn hóa alias phổ biến này.
- chỉ cho phép lược đồ URL `http:` và `https:`
- giá trị `headers` hỗ trợ nội suy `${ENV_VAR}`
- mục máy chủ có cả `command` và `url` sẽ bị từ chối
- thông tin xác thực URL (userinfo và tham số truy vấn) được biên tập khỏi mô tả
  công cụ và nhật ký
- `connectionTimeoutMs` ghi đè thời gian chờ kết nối mặc định 30 giây cho
  cả giao thức vận chuyển stdio và HTTP

##### Đặt tên công cụ

OpenClaw đăng ký công cụ MCP bundle với tên an toàn cho provider theo dạng
`serverName__toolName`. Ví dụ, một máy chủ có khóa `"vigil-harbor"` cung cấp công cụ
`memory_search` sẽ được đăng ký là `vigil-harbor__memory_search`.

- ký tự ngoài `A-Za-z0-9_-` được thay bằng `-`
- tiền tố máy chủ được giới hạn ở 30 ký tự
- tên công cụ đầy đủ được giới hạn ở 64 ký tự
- tên máy chủ rỗng sẽ dùng dự phòng `mcp`
- các tên đã làm sạch bị trùng được phân biệt bằng hậu tố số
- thứ tự công cụ cuối cùng được cung cấp là xác định theo tên an toàn để giữ cho các lượt Pi
  lặp lại ổn định cache
- lọc hồ sơ xử lý mọi công cụ từ một máy chủ MCP bundle là thuộc sở hữu Plugin
  bởi `bundle-mcp`, nên allowlist và danh sách deny của hồ sơ có thể bao gồm
  tên công cụ được cung cấp riêng lẻ hoặc khóa Plugin `bundle-mcp`

#### Cài đặt Pi nhúng

- Claude `settings.json` được nhập làm cài đặt Pi nhúng mặc định khi
  bundle được bật
- OpenClaw làm sạch khóa ghi đè shell trước khi áp dụng chúng

Các khóa đã làm sạch:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi nhúng

- các bundle Claude đã bật có thể đóng góp cấu hình máy chủ LSP
- OpenClaw tải `.lsp.json` cộng với mọi đường dẫn `lspServers` khai báo trong manifest
- cấu hình LSP của bundle được hợp nhất vào mặc định LSP của Pi nhúng hiệu lực
- hiện chỉ các máy chủ LSP dựa trên stdio được hỗ trợ mới có thể chạy; các
  giao thức vận chuyển chưa được hỗ trợ vẫn hiển thị trong `openclaw plugins inspect <id>`

### Được phát hiện nhưng không thực thi

Những mục này được nhận diện và hiển thị trong chẩn đoán, nhưng OpenClaw không chạy chúng:

- Claude `agents`, tự động hóa `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- siêu dữ liệu inline/app của Codex ngoài báo cáo capability

## Định dạng bundle

<AccordionGroup>
  <Accordion title="Codex bundles">
    Dấu hiệu: `.codex-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundle Codex phù hợp nhất với OpenClaw khi chúng dùng gốc skill và thư mục
    gói hook kiểu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    Hai chế độ phát hiện:

    - **Dựa trên manifest:** `.claude-plugin/plugin.json`
    - **Không có manifest:** bố cục Claude mặc định (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Hành vi riêng của Claude:

    - `commands/` được xử lý như nội dung skill
    - `settings.json` được nhập vào cài đặt Pi nhúng (khóa ghi đè shell được làm sạch)
    - `.mcp.json` cung cấp công cụ stdio được hỗ trợ cho Pi nhúng
    - `.lsp.json` cộng với đường dẫn `lspServers` khai báo trong manifest được tải vào mặc định LSP của Pi nhúng
    - `hooks/hooks.json` được phát hiện nhưng không thực thi
    - Đường dẫn thành phần tùy chỉnh trong manifest là bổ sung (chúng mở rộng mặc định, không thay thế)

  </Accordion>

  <Accordion title="Cursor bundles">
    Dấu hiệu: `.cursor-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` được xử lý như nội dung skill
    - `.cursor/rules/`, `.cursor/agents/`, và `.cursor/hooks.json` chỉ được phát hiện

  </Accordion>
</AccordionGroup>

## Thứ tự ưu tiên phát hiện

OpenClaw kiểm tra định dạng Plugin gốc trước:

1. `openclaw.plugin.json` hoặc `package.json` hợp lệ có `openclaw.extensions` — được xử lý như **Plugin gốc**
2. Dấu hiệu bundle (`.codex-plugin/`, `.claude-plugin/`, hoặc bố cục Claude/Cursor mặc định) — được xử lý như **bundle**

Nếu một thư mục chứa cả hai, OpenClaw dùng đường dẫn gốc. Điều này ngăn
các gói hai định dạng bị cài đặt một phần dưới dạng bundle.

## Phụ thuộc runtime và dọn dẹp

- Bundle tương thích của bên thứ ba không nhận sửa chữa `npm install` khi khởi động. Chúng
  nên được cài đặt thông qua `openclaw plugins install` và đóng gói mọi thứ
  chúng cần trong thư mục Plugin đã cài đặt.
- Plugin bundle đóng gói thuộc sở hữu OpenClaw có một ngoại lệ hẹp: khi một Plugin như vậy
  được bật, quá trình khởi động Gateway có thể sửa các phụ thuộc runtime đã khai báo bị thiếu
  trước khi import. Người vận hành có thể kiểm tra hoặc sửa giai đoạn đó bằng
  `openclaw plugins deps`.
- Pipeline phát hành vẫn chịu trách nhiệm đóng gói payload phụ thuộc bundle
  đầy đủ khi có thể (xem quy tắc xác minh sau khi phát hành trong
  [Phát hành](/vi/reference/RELEASING)).

## Bảo mật

Bundle có ranh giới tin cậy hẹp hơn Plugin gốc:

- OpenClaw **không** tải module runtime tùy ý của bundle trong tiến trình
- Skills và đường dẫn gói hook phải nằm bên trong gốc Plugin (được kiểm tra ranh giới)
- Tệp cài đặt được đọc với cùng kiểm tra ranh giới
- Máy chủ MCP stdio được hỗ trợ có thể được khởi chạy như tiến trình con

Điều này làm cho bundle an toàn hơn theo mặc định, nhưng bạn vẫn nên coi bundle
bên thứ ba là nội dung đáng tin cậy đối với các tính năng mà chúng cung cấp.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    Chạy `openclaw plugins inspect <id>`. Nếu một capability được liệt kê nhưng được đánh dấu là
    chưa được nối dây, đó là giới hạn sản phẩm — không phải cài đặt bị hỏng.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    Hãy đảm bảo bundle đã được bật và các tệp markdown nằm bên trong gốc
    `commands/` hoặc `skills/` được phát hiện.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    Chỉ hỗ trợ cài đặt Pi nhúng từ `settings.json`. OpenClaw không
    xử lý cài đặt bundle như các bản vá cấu hình thô.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` chỉ được phát hiện. Nếu bạn cần hook có thể chạy, hãy dùng
    bố cục gói hook OpenClaw hoặc đóng gói một Plugin gốc.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Cài đặt và cấu hình Plugin](/vi/tools/plugin)
- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo một Plugin gốc
- [Manifest Plugin](/vi/plugins/manifest) — lược đồ manifest gốc
