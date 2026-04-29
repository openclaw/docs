---
read_when:
    - Bạn đang chuyển từ Claude Code hoặc Claude Desktop và muốn giữ lại các hướng dẫn, máy chủ MCP và Skills
    - Bạn cần hiểu những gì OpenClaw tự động nhập và những gì vẫn chỉ nằm trong kho lưu trữ
summary: Di chuyển trạng thái cục bộ của Claude Code và Claude Desktop vào OpenClaw bằng thao tác nhập có xem trước
title: Di chuyển từ Claude
x-i18n:
    generated_at: "2026-04-29T22:52:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw nhập trạng thái Claude cục bộ thông qua nhà cung cấp di chuyển Claude được đóng gói kèm. Nhà cung cấp xem trước mọi mục trước khi thay đổi trạng thái, che giấu bí mật trong kế hoạch và báo cáo, đồng thời tạo bản sao lưu đã xác minh trước khi áp dụng.

<Note>
Việc nhập trong quá trình thiết lập ban đầu yêu cầu một bản thiết lập OpenClaw mới. Nếu bạn đã có trạng thái OpenClaw cục bộ, hãy đặt lại cấu hình, thông tin xác thực, phiên và workspace trước, hoặc dùng trực tiếp `openclaw migrate` với `--overwrite` sau khi xem lại kế hoạch.
</Note>

## Hai cách để nhập

<Tabs>
  <Tab title="Trình hướng dẫn thiết lập ban đầu">
    Trình hướng dẫn sẽ đề xuất Claude khi phát hiện trạng thái Claude cục bộ.

    ```bash
    openclaw onboard --flow import
    ```

    Hoặc trỏ đến một nguồn cụ thể:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Dùng `openclaw migrate` cho các lần chạy bằng script hoặc có thể lặp lại. Xem [`openclaw migrate`](/vi/cli/migrate) để biết tài liệu tham khảo đầy đủ.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Thêm `--from <path>` để nhập một thư mục chính Claude Code hoặc thư mục gốc dự án cụ thể.

  </Tab>
</Tabs>

## Những gì được nhập

<AccordionGroup>
  <Accordion title="Hướng dẫn và bộ nhớ">
    - Nội dung `CLAUDE.md` của dự án và `.claude/CLAUDE.md` được sao chép hoặc nối thêm vào workspace tác nhân OpenClaw `AGENTS.md`.
    - Nội dung `~/.claude/CLAUDE.md` của người dùng được nối thêm vào workspace `USER.md`.

  </Accordion>
  <Accordion title="Máy chủ MCP">
    Định nghĩa máy chủ MCP được nhập từ `.mcp.json` của dự án, Claude Code `~/.claude.json` và Claude Desktop `claude_desktop_config.json` khi có.
  </Accordion>
  <Accordion title="Skills và lệnh">
    - Claude Skills có tệp `SKILL.md` được sao chép vào thư mục Skills trong workspace OpenClaw.
    - Các tệp Markdown lệnh Claude trong `.claude/commands/` hoặc `~/.claude/commands/` được chuyển đổi thành OpenClaw Skills với `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Những gì chỉ lưu trữ

Nhà cung cấp sao chép các mục này vào báo cáo di chuyển để xem xét thủ công, nhưng **không** tải chúng vào cấu hình OpenClaw đang hoạt động:

- Hook Claude
- Quyền Claude và danh sách cho phép công cụ phạm vi rộng
- Giá trị mặc định môi trường Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Tác nhân phụ Claude trong `.claude/agents/` hoặc `~/.claude/agents/`
- Bộ nhớ đệm, kế hoạch và thư mục lịch sử dự án của Claude Code
- Tiện ích mở rộng Claude Desktop và thông tin xác thực lưu trong hệ điều hành

OpenClaw từ chối tự động thực thi hook, tin cậy danh sách cho phép quyền, hoặc giải mã trạng thái OAuth mờ và thông tin xác thực Desktop. Hãy chuyển thủ công những gì bạn cần sau khi xem lại kho lưu trữ.

## Chọn nguồn

Nếu không có `--from`, OpenClaw kiểm tra thư mục chính Claude Code mặc định tại `~/.claude`, tệp trạng thái Claude Code mẫu `~/.claude.json`, và cấu hình MCP của Claude Desktop trên macOS.

Khi `--from` trỏ đến thư mục gốc dự án, OpenClaw chỉ nhập các tệp Claude của dự án đó như `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` và `.mcp.json`. Nó không đọc thư mục chính Claude toàn cục của bạn trong quá trình nhập từ thư mục gốc dự án.

## Quy trình khuyến nghị

<Steps>
  <Step title="Xem trước kế hoạch">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Kế hoạch liệt kê mọi thứ sẽ thay đổi, bao gồm xung đột, mục bị bỏ qua và các giá trị nhạy cảm đã được che giấu khỏi các trường MCP `env` hoặc `headers` lồng nhau.

  </Step>
  <Step title="Áp dụng với bản sao lưu">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw tạo và xác minh một bản sao lưu trước khi áp dụng.

  </Step>
  <Step title="Chạy doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/vi/gateway/doctor) kiểm tra các vấn đề cấu hình hoặc trạng thái sau khi nhập.

  </Step>
  <Step title="Khởi động lại và xác minh">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Xác nhận Gateway khỏe mạnh và các hướng dẫn, máy chủ MCP, cùng Skills đã nhập của bạn đã được tải.

  </Step>
</Steps>

## Xử lý xung đột

Thao tác áp dụng từ chối tiếp tục khi kế hoạch báo cáo xung đột (một tệp hoặc giá trị cấu hình đã tồn tại tại đích).

<Warning>
Chỉ chạy lại với `--overwrite` khi bạn chủ ý thay thế đích hiện có. Nhà cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di chuyển.
</Warning>

Với một bản cài đặt OpenClaw mới, xung đột hiếm khi xảy ra. Chúng thường xuất hiện khi bạn chạy lại thao tác nhập trên một bản thiết lập đã có chỉnh sửa của người dùng.

## Đầu ra JSON cho tự động hóa

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Với `--json` và không có `--yes`, thao tác áp dụng in kế hoạch và không thay đổi trạng thái. Đây là chế độ an toàn nhất cho CI và script dùng chung.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Trạng thái Claude nằm ngoài ~/.claude">
    Truyền `--from /actual/path` (CLI) hoặc `--import-source /actual/path` (thiết lập ban đầu).
  </Accordion>
  <Accordion title="Thiết lập ban đầu từ chối nhập trên bản thiết lập hiện có">
    Việc nhập trong quá trình thiết lập ban đầu yêu cầu một bản thiết lập mới. Hãy đặt lại trạng thái và thiết lập lại, hoặc dùng trực tiếp `openclaw migrate apply claude`, lệnh này hỗ trợ `--overwrite` và kiểm soát bản sao lưu rõ ràng.
  </Accordion>
  <Accordion title="Máy chủ MCP từ Claude Desktop không được nhập">
    Claude Desktop đọc `claude_desktop_config.json` từ một đường dẫn riêng theo nền tảng. Trỏ `--from` đến thư mục của tệp đó nếu OpenClaw không tự động phát hiện.
  </Accordion>
  <Accordion title="Lệnh Claude trở thành Skills với lời gọi mô hình bị tắt">
    Đây là thiết kế chủ đích. Lệnh Claude do người dùng kích hoạt, vì vậy OpenClaw nhập chúng dưới dạng Skills với `disable-model-invocation: true`. Chỉnh sửa frontmatter của từng Skill nếu bạn muốn tác nhân tự động gọi chúng.
  </Accordion>
</AccordionGroup>

## Liên quan

- [`openclaw migrate`](/vi/cli/migrate): tài liệu tham khảo CLI đầy đủ, hợp đồng Plugin và hình dạng JSON.
- [Hướng dẫn di chuyển](/vi/install/migrating): tất cả đường dẫn di chuyển.
- [Di chuyển từ Hermes](/vi/install/migrating-hermes): đường dẫn nhập liên hệ thống còn lại.
- [Thiết lập ban đầu](/vi/cli/onboard): luồng trình hướng dẫn và cờ không tương tác.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau di chuyển.
- [Workspace tác nhân](/vi/concepts/agent-workspace): nơi chứa `AGENTS.md`, `USER.md` và Skills.
