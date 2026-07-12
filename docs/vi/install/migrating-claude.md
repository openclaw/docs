---
read_when:
    - Bạn đang chuyển từ Claude Code hoặc Claude Desktop và muốn giữ lại các hướng dẫn, máy chủ MCP và Skills
    - Bạn cần hiểu những gì OpenClaw tự động nhập và những gì chỉ được lưu trữ trong kho lưu trữ.
summary: Di chuyển trạng thái cục bộ của Claude Code và Claude Desktop vào OpenClaw bằng quy trình nhập có bản xem trước
title: Di chuyển từ Claude
x-i18n:
    generated_at: "2026-07-12T08:03:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw nhập trạng thái Claude cục bộ thông qua trình cung cấp di chuyển Claude được tích hợp sẵn. Trình cung cấp xem trước từng mục trước khi thay đổi trạng thái, che thông tin bí mật trong kế hoạch và báo cáo, đồng thời tạo bản sao lưu đã được xác minh trước khi áp dụng.

<Note>
Việc nhập trong quá trình thiết lập ban đầu yêu cầu một bản thiết lập OpenClaw mới. Nếu bạn đã có trạng thái OpenClaw cục bộ, trước tiên hãy đặt lại cấu hình, thông tin xác thực, phiên và không gian làm việc; hoặc sử dụng trực tiếp `openclaw migrate` với `--overwrite` sau khi xem xét kế hoạch.
</Note>

## Hai cách nhập

<Tabs>
  <Tab title="Trình hướng dẫn thiết lập ban đầu">
    Trình hướng dẫn cung cấp tùy chọn Claude khi phát hiện trạng thái Claude cục bộ.

    ```bash
    openclaw onboard --flow import
    ```

    Hoặc chỉ định một nguồn cụ thể:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Sử dụng `openclaw migrate` cho các lần chạy theo tập lệnh hoặc có thể lặp lại. Xem [`openclaw migrate`](/vi/cli/migrate) để biết tài liệu tham khảo đầy đủ.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Thêm `--from <path>` để nhập một thư mục chính hoặc thư mục gốc dự án Claude Code cụ thể.

  </Tab>
</Tabs>

## Nội dung được nhập

<AccordionGroup>
  <Accordion title="Hướng dẫn và bộ nhớ">
    - Nội dung `CLAUDE.md` và `.claude/CLAUDE.md` của dự án được sao chép hoặc nối thêm vào `AGENTS.md` trong không gian làm việc của tác tử OpenClaw.
    - Nội dung `~/.claude/CLAUDE.md` của người dùng được nối thêm vào `USER.md` trong không gian làm việc.

  </Accordion>
  <Accordion title="Máy chủ MCP">
    Các định nghĩa máy chủ MCP được nhập từ `.mcp.json` của dự án, `~/.claude.json` của Claude Code và `claude_desktop_config.json` của Claude Desktop khi có.
  </Accordion>
  <Accordion title="Skills và lệnh">
    - Các Skills Claude có tệp `SKILL.md` được sao chép vào thư mục Skills trong không gian làm việc OpenClaw.
    - Các tệp Markdown lệnh Claude trong `.claude/commands/` hoặc `~/.claude/commands/` được chuyển đổi thành Skills OpenClaw với `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Nội dung chỉ được lưu trữ

Trình cung cấp sao chép các nội dung sau vào báo cáo di chuyển để xem xét thủ công, nhưng **không** tải chúng vào cấu hình OpenClaw đang hoạt động:

- Hook Claude
- Quyền Claude và danh sách cho phép công cụ phạm vi rộng
- Giá trị mặc định của môi trường Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Các tác tử con Claude trong `.claude/agents/` hoặc `~/.claude/agents/`
- Bộ nhớ đệm, kế hoạch và thư mục lịch sử dự án của Claude Code
- Tiện ích mở rộng Claude Desktop và thông tin xác thực được lưu trong hệ điều hành

OpenClaw từ chối tự động thực thi hook, tin cậy danh sách cho phép quyền hoặc giải mã trạng thái thông tin xác thực OAuth và Desktop không rõ cấu trúc. Sau khi xem xét kho lưu trữ, hãy di chuyển thủ công những nội dung bạn cần.

## Chọn nguồn

Nếu không có `--from`, OpenClaw kiểm tra thư mục chính Claude Code mặc định tại `~/.claude`, tệp trạng thái mẫu `~/.claude.json` của Claude Code và cấu hình MCP của Claude Desktop trên macOS.

Khi `--from` trỏ đến thư mục gốc dự án, OpenClaw chỉ nhập các tệp Claude của dự án đó, chẳng hạn như `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` và `.mcp.json`. Trong quá trình nhập từ thư mục gốc dự án, OpenClaw không đọc thư mục chính Claude toàn cục của bạn.

## Quy trình được khuyến nghị

<Steps>
  <Step title="Xem trước kế hoạch">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Kế hoạch liệt kê mọi nội dung sẽ thay đổi, bao gồm xung đột, các mục bị bỏ qua và các giá trị nhạy cảm đã được che trong các trường MCP `env` hoặc `headers` lồng nhau.

  </Step>
  <Step title="Áp dụng kèm bản sao lưu">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw tạo và xác minh bản sao lưu trước khi áp dụng.

  </Step>
  <Step title="Chạy doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/vi/gateway/doctor) kiểm tra các vấn đề về cấu hình hoặc trạng thái sau khi nhập.

  </Step>
  <Step title="Khởi động lại và xác minh">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Xác nhận Gateway hoạt động bình thường và các hướng dẫn, máy chủ MCP cùng Skills đã nhập được tải thành công.

  </Step>
</Steps>

## Xử lý xung đột

Thao tác áp dụng từ chối tiếp tục khi kế hoạch báo cáo xung đột (một tệp hoặc giá trị cấu hình đã tồn tại tại đích).

<Warning>
Chỉ chạy lại với `--overwrite` khi bạn chủ ý thay thế đích hiện có. Trình cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè vào thư mục báo cáo di chuyển.
</Warning>

Đối với bản cài đặt OpenClaw mới, xung đột hiếm khi xảy ra. Chúng thường xuất hiện khi bạn chạy lại quá trình nhập trên một bản thiết lập đã có chỉnh sửa của người dùng.

## Đầu ra JSON cho tự động hóa

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` là bắt buộc đối với `migrate apply` bên ngoài thiết bị đầu cuối tương tác; nếu không có cờ này, OpenClaw sẽ báo lỗi thay vì áp dụng, vì vậy tập lệnh và CI phải truyền `--yes` một cách rõ ràng. Trước tiên hãy xem trước bằng `--dry-run --json`, sau đó áp dụng bằng `--json --yes` khi kế hoạch đã phù hợp.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Trạng thái Claude nằm ngoài ~/.claude">
    Truyền `--from /actual/path` (CLI) hoặc `--import-source /actual/path` (thiết lập ban đầu).
  </Accordion>
  <Accordion title="Thiết lập ban đầu từ chối nhập vào một bản thiết lập hiện có">
    Việc nhập trong quá trình thiết lập ban đầu yêu cầu một bản thiết lập mới. Hãy đặt lại trạng thái và thực hiện lại quá trình thiết lập ban đầu, hoặc sử dụng trực tiếp `openclaw migrate apply claude`, lệnh này hỗ trợ `--overwrite` và khả năng kiểm soát bản sao lưu rõ ràng.
  </Accordion>
  <Accordion title="Máy chủ MCP từ Claude Desktop không được nhập">
    Claude Desktop đọc `claude_desktop_config.json` từ đường dẫn dành riêng cho từng nền tảng. Hãy trỏ `--from` đến thư mục chứa tệp đó nếu OpenClaw không tự động phát hiện được.
  </Accordion>
  <Accordion title="Lệnh Claude trở thành Skills với tính năng gọi mô hình bị vô hiệu hóa">
    Đây là hành vi theo thiết kế. Các lệnh Claude do người dùng kích hoạt, vì vậy OpenClaw nhập chúng dưới dạng Skills với `disable-model-invocation: true`. Chỉnh sửa frontmatter của từng Skill nếu bạn muốn tác tử tự động gọi chúng.
  </Accordion>
</AccordionGroup>

## Liên quan

- [`openclaw migrate`](/vi/cli/migrate): tài liệu tham khảo CLI đầy đủ, hợp đồng Plugin và các cấu trúc JSON.
- [Hướng dẫn di chuyển](/vi/install/migrating): tất cả các lộ trình di chuyển.
- [Di chuyển từ Hermes](/vi/install/migrating-hermes): lộ trình nhập liên hệ thống còn lại.
- [Thiết lập ban đầu](/vi/cli/onboard): quy trình trình hướng dẫn và các cờ không tương tác.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi di chuyển.
- [Không gian làm việc của tác tử](/vi/concepts/agent-workspace): nơi lưu trữ `AGENTS.md`, `USER.md` và Skills.
