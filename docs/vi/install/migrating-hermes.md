---
read_when:
    - Bạn đang chuyển từ Hermes và muốn giữ nguyên cấu hình mô hình, prompt, bộ nhớ và kỹ năng của mình
    - Bạn muốn biết những gì OpenClaw tự động nhập và những gì chỉ được lưu trữ trong kho lưu trữ
    - Bạn cần một quy trình di chuyển rõ ràng, có thể thực hiện bằng script (CI, máy tính xách tay mới, tự động hóa)
summary: Chuyển từ Hermes sang OpenClaw bằng quy trình nhập có thể xem trước và hoàn tác
title: Di chuyển từ Hermes
x-i18n:
    generated_at: "2026-07-19T05:50:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b75d8bb1c5d40693354a8902e35ade4239dc001705abeee04a004e2cbaaa94c
    source_path: install/migrating-hermes.md
    workflow: 16
---

Trình cung cấp di chuyển Hermes đi kèm tuân theo `HERMES_HOME` và hồ sơ Hermes đang hoạt động, với phương án dự phòng là `~/.hermes` trên macOS/Linux hoặc `%LOCALAPPDATA%\hermes` trên Windows. Trình này xem trước mọi thay đổi trước khi áp dụng, che giấu bí mật trong kế hoạch và báo cáo, đồng thời ghi một bản sao lưu OpenClaw đã được xác minh trước khi tác động đến bất kỳ thứ gì. Đường dẫn `--from` được chỉ định rõ luôn được ưu tiên.

<Note>
Quá trình nhập yêu cầu một thiết lập OpenClaw mới. Nếu đã có trạng thái OpenClaw cục bộ, trước tiên hãy đặt lại cấu hình, thông tin xác thực, phiên và không gian làm việc, hoặc sử dụng trực tiếp `openclaw migrate apply hermes` với `--overwrite` sau khi xem xét kế hoạch.
</Note>

## Hai cách nhập

<Tabs>
  <Tab title="Trình hướng dẫn thiết lập ban đầu">
    Phát hiện thư mục chính/hồ sơ Hermes đang hoạt động và hiển thị bản xem trước trước khi áp dụng.

    ```bash
    openclaw onboard --flow import
    ```

    Hoặc trỏ đến một nguồn cụ thể:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Sử dụng `openclaw migrate` cho các lần chạy theo tập lệnh hoặc có thể lặp lại. Xem [`openclaw migrate`](/vi/cli/migrate) để biết tài liệu tham khảo đầy đủ.

    ```bash
    openclaw migrate hermes --dry-run    # chỉ xem trước
    openclaw migrate apply hermes --yes  # áp dụng và bỏ qua bước xác nhận
    ```

    Thêm `--from <path>` để ghi đè việc phát hiện thư mục chính/hồ sơ Hermes.

  </Tab>
</Tabs>

## Nội dung được nhập

<AccordionGroup>
  <Accordion title="Cấu hình mô hình">
    - Lựa chọn mô hình mặc định từ Hermes `config.yaml`.
    - Các trình cung cấp mô hình đã cấu hình và điểm cuối tùy chỉnh từ `model`, `providers` và `custom_providers`, bao gồm các cơ chế truyền tải Hermes Chat Completions, Codex Responses và Anthropic Messages hiện tại.

  </Accordion>
  <Accordion title="Máy chủ MCP">
    Các định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`, bao gồm trạng thái vô hiệu hóa, thời gian chờ, hỗ trợ công cụ song song, phạm vi OAuth, các trường TLS tương thích và chính sách công cụ gốc/tài nguyên/lời nhắc. Các biến môi trường và tiêu đề nguyên dạng yêu cầu sự đồng ý nhập thông tin xác thực. Các thiết lập chỉ dành cho Hermes về vòng đời, lấy mẫu, gợi xuất, kiểm tra trước, duy trì kết nối, gói CA, khóa máy khách được bảo vệ bằng mật khẩu và máy khách OAuth đăng ký trước sẽ trở thành các mục cần xem xét thủ công thay vì cấu hình OpenClaw không hợp lệ.
  </Accordion>
  <Accordion title="Tệp không gian làm việc">
    - `SOUL.md` và `AGENTS.md` được sao chép vào không gian làm việc của tác tử OpenClaw.
    - `memories/MEMORY.md` và `memories/USER.md` được **nối thêm** vào các tệp bộ nhớ OpenClaw tương ứng thay vì ghi đè chúng.
    - Các bề mặt chỉ dành cho bộ nhớ hoạt động khác đi: trang bộ nhớ trong quy trình thiết lập ban đầu và trang nhập Bộ nhớ của Control UI sao chép hai tệp này vào `memory/imports/hermes/` để truy hồi có lập chỉ mục và giữ nguyên bộ nhớ hiện có trong không gian làm việc.

  </Accordion>
  <Accordion title="Cấu hình bộ nhớ">
    Các giá trị mặc định của cấu hình bộ nhớ cho bộ nhớ tệp OpenClaw. Các trình cung cấp bộ nhớ bên ngoài như Honcho được ghi nhận dưới dạng mục lưu trữ hoặc cần xem xét thủ công để bạn có thể chủ động di chuyển chúng.
  </Accordion>
  <Accordion title="Skills">
    Các Skills có tệp `SKILL.md` ở bất kỳ đâu trong `skills/` được phát hiện đệ quy, làm phẳng vào thư mục skill của không gian làm việc OpenClaw và sao chép cùng các tệp hỗ trợ. Các giá trị cấu hình riêng cho từng skill từ `skills.config` được giữ nguyên.
  </Accordion>
  <Accordion title="Thông tin xác thực">
    `openclaw migrate` tương tác sẽ hỏi trước khi nhập thông tin xác thực, với lựa chọn có được chọn mặc định. Các nội dung nhập được chấp nhận bao gồm các mục OAuth OpenAI Codex hiện tại của Hermes, các mục OpenAI OAuth và GitHub Copilot của OpenCode, cùng [các khóa Hermes `.env` được hỗ trợ](/vi/cli/migrate#supported-env-keys). Sử dụng `--include-secrets` để nhập không tương tác, `--no-auth-credentials` để bỏ qua thông tin xác thực hoặc cờ `--import-secrets` của quy trình thiết lập ban đầu. Sau khi nhập OAuth của Hermes, không để Hermes và OpenClaw tiếp tục sử dụng cùng một quyền cấp làm mới; hãy xác thực lại một bên trước khi chạy cả hai.
  </Accordion>
</AccordionGroup>

## Nội dung chỉ được lưu trữ

Trình cung cấp sao chép các nội dung sau vào thư mục báo cáo di chuyển để xem xét thủ công, nhưng **không** tải chúng vào cấu hình hoặc thông tin xác thực OpenClaw đang hoạt động:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `plans/`, `workspace/`, `skins/` và `kanban/`
- Các kho lưu trữ `pairing/` và `platforms/`, cùng trạng thái định tuyến Gateway/quy trình
- `state.db`, `hermes_state.db`, `projects.db`, `response_store.db`, `memory_store.db`, `verification_evidence.db`, `kanban.db` và `retaindb_queue.db`

OpenClaw từ chối tự động thực thi hoặc tin cậy trạng thái này vì định dạng và các giả định về độ tin cậy có thể khác biệt giữa các hệ thống. Hãy di chuyển thủ công những gì cần thiết sau khi xem xét bản lưu trữ.

## Luồng khuyến nghị

<Steps>
  <Step title="Xem trước kế hoạch">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Kế hoạch liệt kê mọi nội dung sẽ thay đổi, bao gồm xung đột, mục bị bỏ qua và mục nhạy cảm. Các khóa lồng nhau có vẻ chứa bí mật được che giấu trong đầu ra.

  </Step>
  <Step title="Áp dụng kèm bản sao lưu">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw tạo và xác minh bản sao lưu trước khi áp dụng. Ví dụ không tương tác này chỉ nhập trạng thái không chứa bí mật. Chạy không có `--yes` để trả lời lời nhắc về thông tin xác thực theo cách tương tác, hoặc thêm `--include-secrets` để đưa thông tin xác thực được hỗ trợ vào một lần chạy không cần giám sát.

  </Step>
  <Step title="Chạy doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/vi/gateway/doctor) áp dụng lại mọi quá trình di chuyển cấu hình đang chờ xử lý và kiểm tra các sự cố phát sinh trong quá trình nhập.

  </Step>
  <Step title="Khởi động lại và xác minh">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Xác nhận Gateway hoạt động bình thường và mô hình, bộ nhớ cùng các skill đã nhập được tải.

  </Step>
</Steps>

## Xử lý xung đột

Quá trình áp dụng từ chối tiếp tục khi kế hoạch báo cáo xung đột (một tệp hoặc giá trị cấu hình đã tồn tại tại đích).

<Warning>
Chỉ chạy lại với `--overwrite` khi việc thay thế đích hiện có là có chủ đích. Trình cung cấp vẫn có thể ghi bản sao lưu cấp mục cho các tệp bị ghi đè trong thư mục báo cáo di chuyển.
</Warning>

Xung đột hiếm khi xảy ra trên bản cài đặt mới. Chúng thường xuất hiện khi bạn chạy lại quá trình nhập trên một thiết lập đã có chỉnh sửa của người dùng.

Nếu xung đột xuất hiện giữa quá trình áp dụng (ví dụ: một điều kiện tranh chấp không mong đợi trên tệp cấu hình), mục đó được báo cáo là xung đột trong khi các tệp, skill, thông tin xác thực, bản lưu trữ và mục cấu hình độc lập vẫn tiếp tục. Hãy xử lý mục xung đột và chạy lại quá trình nhập; các lần nhập bộ nhớ giống hệt nhau có tính lũy đẳng.

## Bí mật

`openclaw migrate` tương tác hỏi có nhập thông tin xác thực được phát hiện hay không, với lựa chọn có được chọn mặc định.

- Chấp nhận sẽ nhập các mục OAuth OpenAI Codex hiện tại của Hermes, các mục OpenAI OAuth và GitHub Copilot của OpenCode, cùng [các khóa `.env` được hỗ trợ](/vi/cli/migrate#supported-env-keys).
- Sử dụng `--no-auth-credentials` hoặc trả lời không tại lời nhắc để chỉ nhập trạng thái không chứa bí mật.
- Sử dụng `--include-secrets` để nhập thông tin xác thực trong một lần chạy `--yes` không cần giám sát.
- Sử dụng cờ `--import-secrets` của trình hướng dẫn thiết lập ban đầu để nhập thông tin xác thực từ trình hướng dẫn.

## Đầu ra JSON cho tự động hóa

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Với `--json` và không có `--yes`, quá trình áp dụng sẽ in kế hoạch và không thay đổi trạng thái — đây là chế độ an toàn nhất cho Pipeline CI và các tập lệnh dùng chung.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Quá trình áp dụng từ chối vì xung đột">
    Kiểm tra đầu ra của kế hoạch. Mỗi xung đột xác định đường dẫn nguồn và đích hiện có. Với từng mục, hãy quyết định bỏ qua, chỉnh sửa đích hoặc chạy lại với `--overwrite`.
  </Accordion>
  <Accordion title="Hermes nằm ngoài ~/.hermes">
    Truyền `--from /actual/path` (CLI) hoặc `--import-source /actual/path` (quy trình thiết lập ban đầu).
  </Accordion>
  <Accordion title="Quy trình thiết lập ban đầu từ chối nhập vào thiết lập hiện có">
    Quá trình nhập trong thiết lập ban đầu yêu cầu một thiết lập mới. Hãy đặt lại trạng thái và thực hiện lại thiết lập ban đầu, hoặc sử dụng trực tiếp `openclaw migrate apply hermes`, vốn hỗ trợ `--overwrite` và quyền kiểm soát bản sao lưu rõ ràng.
  </Accordion>
  <Accordion title="Khóa API không được nhập">
    `openclaw migrate` tương tác chỉ nhập khóa API khi bạn chấp nhận lời nhắc về thông tin xác thực. Các lần chạy `--yes` không tương tác cần `--include-secrets`; quá trình nhập trong thiết lập ban đầu cần `--import-secrets`. Chỉ [các khóa `.env` được hỗ trợ](/vi/cli/migrate#supported-env-keys) được nhận diện — các biến `.env` khác bị bỏ qua.
  </Accordion>
</AccordionGroup>

## Liên quan

- [`openclaw migrate`](/vi/cli/migrate): tài liệu tham khảo CLI đầy đủ, hợp đồng Plugin và các cấu trúc JSON.
- [Thiết lập ban đầu](/vi/cli/onboard): luồng trình hướng dẫn và các cờ không tương tác.
- [Di chuyển](/vi/install/migrating): di chuyển một bản cài đặt OpenClaw giữa các máy.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi di chuyển.
- [Không gian làm việc của tác tử](/vi/concepts/agent-workspace): nơi lưu trữ `SOUL.md`, `AGENTS.md` và các tệp bộ nhớ.
