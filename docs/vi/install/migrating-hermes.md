---
read_when:
    - Bạn đang chuyển từ Hermes và muốn giữ lại cấu hình mô hình, các prompt, bộ nhớ và Skills của mình
    - Bạn muốn biết OpenClaw tự động nhập những gì và những gì chỉ được lưu trữ trong kho lưu trữ
    - Bạn cần một quy trình chuyển đổi rõ ràng, có thể thực hiện bằng tập lệnh (CI, máy tính xách tay mới, tự động hóa)
summary: Chuyển từ Hermes sang OpenClaw bằng quy trình nhập có thể xem trước và hoàn tác
title: Di chuyển từ Hermes
x-i18n:
    generated_at: "2026-07-12T08:00:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

Nhà cung cấp di chuyển Hermes đi kèm phát hiện trạng thái tại `~/.hermes`, xem trước mọi thay đổi trước khi áp dụng, che các bí mật trong kế hoạch và báo cáo, đồng thời ghi một bản sao lưu OpenClaw đã được xác minh trước khi tác động đến bất kỳ nội dung nào.

<Note>
Việc nhập yêu cầu một thiết lập OpenClaw mới. Nếu bạn đã có trạng thái OpenClaw cục bộ, trước tiên hãy đặt lại cấu hình, thông tin xác thực, phiên và không gian làm việc; hoặc sử dụng trực tiếp `openclaw migrate apply hermes` với `--overwrite` sau khi xem xét kế hoạch.
</Note>

## Hai cách nhập

<Tabs>
  <Tab title="Trình hướng dẫn thiết lập ban đầu">
    Phát hiện Hermes tại `~/.hermes` và hiển thị bản xem trước trước khi áp dụng.

    ```bash
    openclaw onboard --flow import
    ```

    Hoặc chỉ định một nguồn cụ thể:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Sử dụng `openclaw migrate` cho các lần chạy bằng tập lệnh hoặc có thể lặp lại. Xem [`openclaw migrate`](/vi/cli/migrate) để biết tài liệu tham khảo đầy đủ.

    ```bash
    openclaw migrate hermes --dry-run    # chỉ xem trước
    openclaw migrate apply hermes --yes  # áp dụng và bỏ qua bước xác nhận
    ```

    Thêm `--from <path>` khi Hermes nằm ngoài `~/.hermes`.

  </Tab>
</Tabs>

## Nội dung được nhập

<AccordionGroup>
  <Accordion title="Cấu hình mô hình">
    - Lựa chọn mô hình mặc định từ `config.yaml` của Hermes.
    - Các nhà cung cấp mô hình đã cấu hình và điểm cuối tùy chỉnh tương thích với OpenAI từ `providers` và `custom_providers`.

  </Accordion>
  <Accordion title="Máy chủ MCP">
    Các định nghĩa máy chủ MCP từ `mcp_servers` hoặc `mcp.servers`.
  </Accordion>
  <Accordion title="Tệp không gian làm việc">
    - `SOUL.md` và `AGENTS.md` được sao chép vào không gian làm việc của tác tử OpenClaw.
    - `memories/MEMORY.md` và `memories/USER.md` được **nối thêm** vào các tệp bộ nhớ OpenClaw tương ứng thay vì ghi đè chúng.

  </Accordion>
  <Accordion title="Cấu hình bộ nhớ">
    Các giá trị mặc định của cấu hình bộ nhớ dành cho bộ nhớ tệp OpenClaw. Các nhà cung cấp bộ nhớ bên ngoài như Honcho được ghi nhận dưới dạng mục lưu trữ hoặc mục cần xem xét thủ công để bạn có thể chủ động di chuyển chúng.
  </Accordion>
  <Accordion title="Skills">
    Các Skills có tệp `SKILL.md` trong `skills/<name>/` được sao chép cùng với các giá trị cấu hình riêng của từng Skills từ `skills.config`.
  </Accordion>
  <Accordion title="Thông tin xác thực">
    `openclaw migrate` ở chế độ tương tác sẽ hỏi trước khi nhập thông tin xác thực, với lựa chọn có được chọn theo mặc định. Khi chấp nhận, công cụ sẽ nhập các mục OpenCode OpenAI OAuth và GitHub Copilot từ `auth.json` của OpenCode, cùng với [các khóa `.env` của Hermes được hỗ trợ](/vi/cli/migrate#supported-env-keys). Các mục OAuth trong `auth.json` của chính Hermes là trạng thái cũ: chúng được hiển thị dưới dạng mục yêu cầu xác thực lại hoặc chạy doctor thủ công thay vì được nhập vào hệ thống xác thực đang hoạt động. Sử dụng `--include-secrets` để nhập thông tin xác thực trong lần chạy không tương tác, `--no-auth-credentials` để bỏ qua hoàn toàn việc nhập thông tin xác thực hoặc cờ `--import-secrets` của trình hướng dẫn thiết lập ban đầu.
  </Accordion>
</AccordionGroup>

## Nội dung chỉ được lưu trữ

Nhà cung cấp sao chép các nội dung sau vào thư mục báo cáo di chuyển để xem xét thủ công, nhưng **không** tải chúng vào cấu hình hoặc thông tin xác thực đang hoạt động của OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw từ chối tự động thực thi hoặc tin cậy trạng thái này vì định dạng và các giả định về độ tin cậy có thể khác nhau giữa các hệ thống. Sau khi xem xét bản lưu trữ, hãy di chuyển thủ công những nội dung bạn cần.

## Quy trình đề xuất

<Steps>
  <Step title="Xem trước kế hoạch">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Kế hoạch liệt kê mọi nội dung sẽ thay đổi, bao gồm xung đột, các mục bị bỏ qua và các mục nhạy cảm. Các khóa lồng nhau có vẻ chứa bí mật sẽ được che trong đầu ra.

  </Step>
  <Step title="Áp dụng kèm bản sao lưu">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw tạo và xác minh một bản sao lưu trước khi áp dụng. Ví dụ không tương tác này chỉ nhập trạng thái không bí mật. Chạy mà không có `--yes` để trả lời lời nhắc về thông tin xác thực theo cách tương tác hoặc thêm `--include-secrets` để bao gồm thông tin xác thực được hỗ trợ trong lần chạy không cần giám sát.

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

    Xác nhận Gateway đang hoạt động bình thường và mô hình, bộ nhớ cùng các Skills đã nhập được tải.

  </Step>
</Steps>

## Xử lý xung đột

Thao tác áp dụng từ chối tiếp tục khi kế hoạch báo cáo xung đột (một tệp hoặc giá trị cấu hình đã tồn tại tại đích).

<Warning>
Chỉ chạy lại với `--overwrite` khi bạn chủ ý thay thế đích hiện có. Nhà cung cấp vẫn có thể ghi các bản sao lưu ở cấp mục cho những tệp bị ghi đè vào thư mục báo cáo di chuyển.
</Warning>

Xung đột hiếm khi xảy ra trên bản cài đặt mới. Chúng thường xuất hiện khi bạn chạy lại quá trình nhập trên một thiết lập đã có chỉnh sửa của người dùng.

Nếu xung đột xuất hiện giữa chừng khi áp dụng (ví dụ: tình trạng tranh chấp không mong đợi trên tệp cấu hình), Hermes đánh dấu các mục cấu hình phụ thuộc còn lại là `skipped` với lý do `blocked by earlier apply conflict` thay vì ghi chúng một phần. Báo cáo di chuyển ghi lại từng mục bị chặn để bạn có thể giải quyết xung đột ban đầu và chạy lại quá trình nhập.

## Bí mật

`openclaw migrate` ở chế độ tương tác hỏi có nhập thông tin xác thực được phát hiện hay không, với lựa chọn có được chọn theo mặc định.

- Khi chấp nhận, công cụ sẽ nhập các mục OpenCode OpenAI OAuth và GitHub Copilot từ `auth.json` của OpenCode, cùng với [các khóa `.env` được hỗ trợ](/vi/cli/migrate#supported-env-keys). Thay vào đó, các mục OAuth trong `auth.json` của chính Hermes được báo cáo để xác thực lại OpenAI hoặc sửa chữa bằng doctor theo cách thủ công.
- Sử dụng `--no-auth-credentials` hoặc trả lời không tại lời nhắc để chỉ nhập trạng thái không bí mật.
- Sử dụng `--include-secrets` để nhập thông tin xác thực trong lần chạy `--yes` không cần giám sát.
- Sử dụng cờ `--import-secrets` của trình hướng dẫn thiết lập ban đầu để nhập thông tin xác thực từ trình hướng dẫn.

## Đầu ra JSON dành cho tự động hóa

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Với `--json` nhưng không có `--yes`, thao tác áp dụng sẽ in kế hoạch và không thay đổi trạng thái — đây là chế độ an toàn nhất cho CI và các tập lệnh dùng chung.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thao tác áp dụng từ chối do xung đột">
    Kiểm tra đầu ra của kế hoạch. Mỗi xung đột xác định đường dẫn nguồn và đích hiện có. Với từng mục, hãy quyết định bỏ qua, chỉnh sửa đích hoặc chạy lại với `--overwrite`.
  </Accordion>
  <Accordion title="Hermes nằm ngoài ~/.hermes">
    Truyền `--from /actual/path` (CLI) hoặc `--import-source /actual/path` (thiết lập ban đầu).
  </Accordion>
  <Accordion title="Thiết lập ban đầu từ chối nhập vào một thiết lập hiện có">
    Việc nhập trong quá trình thiết lập ban đầu yêu cầu một thiết lập mới. Hãy đặt lại trạng thái và thực hiện lại quá trình thiết lập ban đầu hoặc sử dụng trực tiếp `openclaw migrate apply hermes`, lệnh này hỗ trợ `--overwrite` và khả năng kiểm soát bản sao lưu rõ ràng.
  </Accordion>
  <Accordion title="Khóa API không được nhập">
    `openclaw migrate` ở chế độ tương tác chỉ nhập khóa API khi bạn chấp nhận lời nhắc về thông tin xác thực. Các lần chạy `--yes` không tương tác cần `--include-secrets`; việc nhập qua trình hướng dẫn thiết lập ban đầu cần `--import-secrets`. Chỉ [các khóa `.env` được hỗ trợ](/vi/cli/migrate#supported-env-keys) mới được nhận diện — các biến `.env` khác sẽ bị bỏ qua.
  </Accordion>
</AccordionGroup>

## Liên quan

- [`openclaw migrate`](/vi/cli/migrate): tài liệu tham khảo CLI đầy đủ, hợp đồng Plugin và các cấu trúc JSON.
- [Thiết lập ban đầu](/vi/cli/onboard): quy trình trình hướng dẫn và các cờ không tương tác.
- [Di chuyển](/vi/install/migrating): di chuyển một bản cài đặt OpenClaw giữa các máy.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi di chuyển.
- [Không gian làm việc của tác tử](/vi/concepts/agent-workspace): nơi lưu trữ `SOUL.md`, `AGENTS.md` và các tệp bộ nhớ.
