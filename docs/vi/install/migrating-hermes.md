---
read_when:
    - Bạn đang chuyển từ Hermes và muốn giữ lại cấu hình mô hình, lời nhắc, bộ nhớ và Skills của mình
    - Bạn muốn biết OpenClaw tự động nhập những gì và những gì chỉ lưu trong kho lưu trữ
    - Bạn cần một lộ trình di chuyển sạch, có script (CI, máy tính xách tay mới cài đặt, tự động hóa)
summary: Chuyển từ Hermes sang OpenClaw bằng thao tác nhập có xem trước và có thể đảo ngược
title: Di chuyển từ Hermes
x-i18n:
    generated_at: "2026-06-27T17:37:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw nhập trạng thái Hermes thông qua một nhà cung cấp di trú được đóng gói sẵn. Nhà cung cấp này xem trước mọi thứ trước khi thay đổi trạng thái, biên tập ẩn bí mật trong kế hoạch và báo cáo, đồng thời tạo một bản sao lưu đã xác minh trước khi áp dụng.

<Note>
Việc nhập yêu cầu một thiết lập OpenClaw mới. Nếu bạn đã có trạng thái OpenClaw cục bộ, hãy đặt lại cấu hình, thông tin xác thực, phiên và không gian làm việc trước, hoặc dùng trực tiếp `openclaw migrate` với `--overwrite` sau khi xem xét kế hoạch.
</Note>

## Hai cách để nhập

<Tabs>
  <Tab title="Trình hướng dẫn khởi tạo">
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
    Dùng `openclaw migrate` cho các lần chạy có kịch bản hoặc có thể lặp lại. Xem [`openclaw migrate`](/vi/cli/migrate) để biết tài liệu tham chiếu đầy đủ.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Thêm `--from <path>` khi Hermes nằm ngoài `~/.hermes`.

  </Tab>
</Tabs>

## Nội dung được nhập

<AccordionGroup>
  <Accordion title="Cấu hình mô hình">
    - Lựa chọn mô hình mặc định từ `config.yaml` của Hermes.
    - Các nhà cung cấp mô hình đã cấu hình và endpoint tùy chỉnh tương thích OpenAI từ `providers` và `custom_providers`.

  </Accordion>
  <Accordion title="Máy chủ MCP">
    Định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
  </Accordion>
  <Accordion title="Tệp không gian làm việc">
    - `SOUL.md` và `AGENTS.md` được sao chép vào không gian làm việc tác nhân OpenClaw.
    - `memories/MEMORY.md` và `memories/USER.md` được **nối thêm** vào các tệp bộ nhớ OpenClaw tương ứng thay vì ghi đè.

  </Accordion>
  <Accordion title="Cấu hình bộ nhớ">
    Các mặc định cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw. Các nhà cung cấp bộ nhớ bên ngoài như Honcho được ghi nhận dưới dạng mục lưu trữ hoặc cần xem xét thủ công để bạn có thể di chuyển chúng một cách có chủ ý.
  </Accordion>
  <Accordion title="Skills">
    Skills có tệp `SKILL.md` trong `skills/<name>/` được sao chép, cùng với các giá trị cấu hình theo từng skill từ `skills.config`.
  </Accordion>
  <Accordion title="Thông tin xác thực">
    `openclaw migrate` tương tác sẽ hỏi trước khi nhập thông tin xác thực, với lựa chọn có được chọn mặc định. Các mục nhập được chấp nhận bao gồm thông tin xác thực OAuth OpenCode OpenAI từ `auth.json` của OpenCode, các mục OpenCode và GitHub Copilot từ `auth.json` của OpenCode, và [các khóa `.env` được hỗ trợ](/vi/cli/migrate#supported-env-keys). Các mục OAuth trong `auth.json` của Hermes là trạng thái cũ và được hiển thị dưới dạng công việc xác thực lại thủ công/doctor thay vì được nhập vào xác thực đang hoạt động. Dùng `--include-secrets` để nhập thông tin xác thực bằng `openclaw migrate` không tương tác, `--no-auth-credentials` để bỏ qua, hoặc `--import-secrets` khi khởi tạo để nhập từ trình hướng dẫn khởi tạo.
  </Accordion>
</AccordionGroup>

## Nội dung chỉ lưu trữ

Nhà cung cấp sao chép các mục này vào thư mục báo cáo di trú để xem xét thủ công, nhưng **không** tải chúng vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw từ chối tự động thực thi hoặc tin cậy trạng thái này vì định dạng và giả định tin cậy có thể khác nhau giữa các hệ thống. Hãy di chuyển thủ công những gì bạn cần sau khi xem xét kho lưu trữ.

## Luồng được khuyến nghị

<Steps>
  <Step title="Xem trước kế hoạch">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Kế hoạch liệt kê mọi thứ sẽ thay đổi, bao gồm xung đột, mục bị bỏ qua và mọi mục nhạy cảm. Đầu ra kế hoạch biên tập ẩn các khóa lồng nhau trông giống bí mật.

  </Step>
  <Step title="Áp dụng với bản sao lưu">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw tạo và xác minh một bản sao lưu trước khi áp dụng. Ví dụ không tương tác này nhập trạng thái không phải bí mật. Chạy không có `--yes` để trả lời lời nhắc thông tin xác thực, hoặc thêm `--include-secrets` để bao gồm thông tin xác thực được hỗ trợ trong các lần chạy không cần giám sát.

  </Step>
  <Step title="Chạy doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/vi/gateway/doctor) áp dụng lại mọi di trú cấu hình đang chờ xử lý và kiểm tra các vấn đề phát sinh trong quá trình nhập.

  </Step>
  <Step title="Khởi động lại và xác minh">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Xác nhận Gateway hoạt động ổn định và mô hình, bộ nhớ, cùng Skills đã nhập của bạn đã được tải.

  </Step>
</Steps>

## Xử lý xung đột

Thao tác áp dụng từ chối tiếp tục khi kế hoạch báo cáo xung đột (một tệp hoặc giá trị cấu hình đã tồn tại tại đích).

<Warning>
Chỉ chạy lại với `--overwrite` khi việc thay thế đích hiện có là có chủ ý. Các nhà cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di trú.
</Warning>

Với một bản cài đặt OpenClaw mới, xung đột là không thường gặp. Chúng thường xuất hiện khi bạn chạy lại quá trình nhập trên một thiết lập đã có chỉnh sửa của người dùng.

Nếu xung đột xuất hiện giữa lúc áp dụng (ví dụ: một cuộc đua bất ngờ trên tệp cấu hình), Hermes đánh dấu các mục cấu hình phụ thuộc còn lại là `skipped` với lý do `blocked by earlier apply conflict` thay vì ghi chúng một phần. Báo cáo di trú ghi lại từng mục bị chặn để bạn có thể giải quyết xung đột ban đầu và chạy lại quá trình nhập.

## Bí mật

`openclaw migrate` tương tác hỏi liệu có nhập thông tin xác thực đã phát hiện hay không, với lựa chọn có được chọn mặc định.

- Chấp nhận lời nhắc sẽ nhập thông tin xác thực OAuth OpenCode OpenAI từ `auth.json` của OpenCode, các mục OpenCode và GitHub Copilot từ `auth.json` của OpenCode, và [các khóa `.env` được hỗ trợ](/vi/cli/migrate#supported-env-keys). Các mục OAuth trong `auth.json` của Hermes được báo cáo để xác thực lại OpenAI thủ công hoặc sửa chữa bằng doctor.
- Dùng `--no-auth-credentials` hoặc chọn không tại lời nhắc để chỉ nhập trạng thái không phải bí mật.
- Dùng `--include-secrets` khi chạy không cần giám sát với `--yes`.
- Dùng `--import-secrets` của khởi tạo khi nhập thông tin xác thực từ trình hướng dẫn khởi tạo.
- Với thông tin xác thực do SecretRef quản lý, hãy cấu hình nguồn SecretRef sau khi quá trình nhập hoàn tất.

## Đầu ra JSON cho tự động hóa

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Với `--json` và không có `--yes`, thao tác áp dụng in kế hoạch và không thay đổi trạng thái. Đây là chế độ an toàn nhất cho CI và các script dùng chung.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Áp dụng bị từ chối do xung đột">
    Kiểm tra đầu ra kế hoạch. Mỗi xung đột xác định đường dẫn nguồn và đích hiện có. Quyết định theo từng mục xem nên bỏ qua, chỉnh sửa đích, hay chạy lại với `--overwrite`.
  </Accordion>
  <Accordion title="Hermes nằm ngoài ~/.hermes">
    Truyền `--from /actual/path` (CLI) hoặc `--import-source /actual/path` (khởi tạo).
  </Accordion>
  <Accordion title="Khởi tạo từ chối nhập trên một thiết lập hiện có">
    Việc nhập khi khởi tạo yêu cầu một thiết lập mới. Hãy đặt lại trạng thái và khởi tạo lại, hoặc dùng trực tiếp `openclaw migrate apply hermes`, lệnh này hỗ trợ `--overwrite` và kiểm soát sao lưu tường minh.
  </Accordion>
  <Accordion title="Khóa API không được nhập">
    `openclaw migrate` tương tác chỉ nhập khóa API khi bạn chấp nhận lời nhắc thông tin xác thực. Các lần chạy `--yes` không tương tác yêu cầu `--include-secrets`; nhập khi khởi tạo yêu cầu `--import-secrets`. Chỉ [các khóa `.env` được hỗ trợ](/vi/cli/migrate#supported-env-keys) được nhận diện; các biến khác trong `.env` bị bỏ qua.
  </Accordion>
</AccordionGroup>

## Liên quan

- [`openclaw migrate`](/vi/cli/migrate): tài liệu tham chiếu CLI đầy đủ, hợp đồng Plugin và các hình dạng JSON.
- [Khởi tạo](/vi/cli/onboard): luồng trình hướng dẫn và các cờ không tương tác.
- [Di chuyển](/vi/install/migrating): chuyển một bản cài đặt OpenClaw giữa các máy.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau di trú.
- [Không gian làm việc tác nhân](/vi/concepts/agent-workspace): nơi chứa `SOUL.md`, `AGENTS.md` và các tệp bộ nhớ.
