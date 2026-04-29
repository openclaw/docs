---
read_when:
    - Bạn đang chuyển từ Hermes và muốn giữ lại cấu hình mô hình, lời nhắc, bộ nhớ và Skills của mình
    - Bạn muốn biết OpenClaw tự động nhập những gì và những gì vẫn chỉ nằm trong kho lưu trữ
    - Bạn cần một lộ trình di chuyển sạch, có thể chạy bằng script (CI, máy tính xách tay mới, tự động hóa)
summary: Di chuyển từ Hermes sang OpenClaw bằng quy trình nhập có xem trước và có thể hoàn tác
title: Di chuyển từ Hermes
x-i18n:
    generated_at: "2026-04-29T22:53:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw nhập trạng thái Hermes thông qua một nhà cung cấp di chuyển được đóng gói kèm. Nhà cung cấp này xem trước mọi thứ trước khi thay đổi trạng thái, biên tập bí mật trong kế hoạch và báo cáo, đồng thời tạo một bản sao lưu đã xác minh trước khi áp dụng.

<Note>
Việc nhập yêu cầu một thiết lập OpenClaw mới. Nếu bạn đã có trạng thái OpenClaw cục bộ, trước tiên hãy đặt lại cấu hình, thông tin xác thực, phiên và không gian làm việc, hoặc dùng trực tiếp `openclaw migrate` với `--overwrite` sau khi xem xét kế hoạch.
</Note>

## Hai cách để nhập

<Tabs>
  <Tab title="Trình hướng dẫn thiết lập ban đầu">
    Cách nhanh nhất. Trình hướng dẫn phát hiện Hermes tại `~/.hermes` và hiển thị bản xem trước trước khi áp dụng.

    ```bash
    openclaw onboard --flow import
    ```

    Hoặc trỏ tới một nguồn cụ thể:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Dùng `openclaw migrate` cho các lần chạy theo script hoặc có thể lặp lại. Xem [`openclaw migrate`](/vi/cli/migrate) để biết tài liệu tham khảo đầy đủ.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Thêm `--from <path>` khi Hermes nằm ngoài `~/.hermes`.

  </Tab>
</Tabs>

## Những gì được nhập

<AccordionGroup>
  <Accordion title="Cấu hình mô hình">
    - Lựa chọn mô hình mặc định từ `config.yaml` của Hermes.
    - Các nhà cung cấp mô hình đã cấu hình và endpoint tùy chỉnh tương thích với OpenAI từ `providers` và `custom_providers`.

  </Accordion>
  <Accordion title="Máy chủ MCP">
    Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
  </Accordion>
  <Accordion title="Tệp không gian làm việc">
    - `SOUL.md` và `AGENTS.md` được sao chép vào không gian làm việc tác nhân OpenClaw.
    - `memories/MEMORY.md` và `memories/USER.md` được **nối thêm** vào các tệp bộ nhớ OpenClaw tương ứng thay vì ghi đè lên chúng.

  </Accordion>
  <Accordion title="Cấu hình bộ nhớ">
    Các mặc định cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw. Các nhà cung cấp bộ nhớ bên ngoài như Honcho được ghi nhận dưới dạng mục lưu trữ hoặc mục cần xem xét thủ công để bạn có thể di chuyển chúng một cách có chủ đích.
  </Accordion>
  <Accordion title="Skills">
    Skills có tệp `SKILL.md` dưới `skills/<name>/` được sao chép, cùng với các giá trị cấu hình riêng cho từng Skill từ `skills.config`.
  </Accordion>
  <Accordion title="Khóa API (chọn tham gia)">
    Đặt `--include-secrets` để nhập các khóa `.env` được hỗ trợ: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Nếu không có cờ này, bí mật sẽ không bao giờ được sao chép.
  </Accordion>
</AccordionGroup>

## Những gì chỉ được lưu trữ

Nhà cung cấp sao chép các mục này vào thư mục báo cáo di chuyển để xem xét thủ công, nhưng **không** nạp chúng vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw từ chối tự động thực thi hoặc tin cậy trạng thái này vì định dạng và giả định tin cậy có thể lệch nhau giữa các hệ thống. Hãy di chuyển thủ công những gì bạn cần sau khi xem xét bản lưu trữ.

## Quy trình được khuyến nghị

<Steps>
  <Step title="Xem trước kế hoạch">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Kế hoạch liệt kê mọi thứ sẽ thay đổi, bao gồm xung đột, mục bị bỏ qua và mọi mục nhạy cảm. Đầu ra kế hoạch biên tập các khóa lồng nhau trông giống bí mật.

  </Step>
  <Step title="Áp dụng kèm sao lưu">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw tạo và xác minh một bản sao lưu trước khi áp dụng. Nếu bạn cần nhập khóa API, hãy thêm `--include-secrets`.

  </Step>
  <Step title="Chạy doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/vi/gateway/doctor) áp dụng lại mọi di chuyển cấu hình đang chờ và kiểm tra các vấn đề được đưa vào trong quá trình nhập.

  </Step>
  <Step title="Khởi động lại và xác minh">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Xác nhận Gateway hoạt động ổn định và mô hình, bộ nhớ, cùng Skills đã nhập của bạn đã được nạp.

  </Step>
</Steps>

## Xử lý xung đột

Áp dụng sẽ từ chối tiếp tục khi kế hoạch báo cáo xung đột (một tệp hoặc giá trị cấu hình đã tồn tại tại đích).

<Warning>
Chỉ chạy lại với `--overwrite` khi việc thay thế đích hiện có là có chủ đích. Nhà cung cấp vẫn có thể ghi các bản sao lưu ở cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di chuyển.
</Warning>

Đối với bản cài đặt OpenClaw mới, xung đột là bất thường. Chúng thường xuất hiện khi bạn chạy lại quá trình nhập trên một thiết lập đã có chỉnh sửa của người dùng.

Nếu xung đột xuất hiện giữa quá trình áp dụng (ví dụ: một cuộc chạy đua ngoài dự kiến trên tệp cấu hình), Hermes đánh dấu các mục cấu hình phụ thuộc còn lại là `skipped` với lý do `blocked by earlier apply conflict` thay vì ghi chúng một phần. Báo cáo di chuyển ghi lại từng mục bị chặn để bạn có thể giải quyết xung đột gốc và chạy lại quá trình nhập.

## Bí mật

Bí mật không bao giờ được nhập theo mặc định.

- Trước tiên hãy chạy `openclaw migrate apply hermes --yes` để nhập trạng thái không phải bí mật.
- Nếu bạn cũng muốn sao chép các khóa `.env` được hỗ trợ sang, hãy chạy lại với `--include-secrets`.
- Đối với thông tin xác thực do SecretRef quản lý, hãy cấu hình nguồn SecretRef sau khi quá trình nhập hoàn tất.

## Đầu ra JSON cho tự động hóa

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Với `--json` và không có `--yes`, lệnh áp dụng in kế hoạch và không thay đổi trạng thái. Đây là chế độ an toàn nhất cho CI và script dùng chung.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Áp dụng từ chối do xung đột">
    Kiểm tra đầu ra kế hoạch. Mỗi xung đột xác định đường dẫn nguồn và đích hiện có. Quyết định cho từng mục nên bỏ qua, chỉnh sửa đích, hay chạy lại với `--overwrite`.
  </Accordion>
  <Accordion title="Hermes nằm ngoài ~/.hermes">
    Truyền `--from /actual/path` (CLI) hoặc `--import-source /actual/path` (thiết lập ban đầu).
  </Accordion>
  <Accordion title="Thiết lập ban đầu từ chối nhập trên một thiết lập hiện có">
    Nhập qua thiết lập ban đầu yêu cầu một thiết lập mới. Hãy đặt lại trạng thái và thiết lập lại từ đầu, hoặc dùng trực tiếp `openclaw migrate apply hermes`, lệnh này hỗ trợ `--overwrite` và kiểm soát sao lưu rõ ràng.
  </Accordion>
  <Accordion title="Khóa API không được nhập">
    Bắt buộc có `--include-secrets`, và chỉ các khóa được liệt kê ở trên mới được nhận diện. Các biến khác trong `.env` bị bỏ qua.
  </Accordion>
</AccordionGroup>

## Liên quan

- [`openclaw migrate`](/vi/cli/migrate): tài liệu tham khảo CLI đầy đủ, hợp đồng Plugin và hình dạng JSON.
- [Thiết lập ban đầu](/vi/cli/onboard): luồng trình hướng dẫn và các cờ không tương tác.
- [Di chuyển](/vi/install/migrating): di chuyển một bản cài đặt OpenClaw giữa các máy.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau di chuyển.
- [Không gian làm việc tác nhân](/vi/concepts/agent-workspace): nơi đặt `SOUL.md`, `AGENTS.md` và các tệp bộ nhớ.
