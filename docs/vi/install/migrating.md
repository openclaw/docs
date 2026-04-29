---
read_when:
    - Bạn đang chuyển OpenClaw sang một máy tính xách tay hoặc máy chủ mới
    - Bạn đang chuyển từ một hệ thống tác nhân khác và muốn giữ trạng thái
    - Bạn đang nâng cấp một Plugin tại chỗ
summary: 'Trung tâm di chuyển: nhập dữ liệu liên hệ thống, di chuyển từ máy này sang máy khác và nâng cấp Plugin'
title: Hướng dẫn chuyển đổi
x-i18n:
    generated_at: "2026-04-29T22:53:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw hỗ trợ ba lộ trình di chuyển: nhập từ một hệ thống agent khác, chuyển một bản cài đặt hiện có sang máy mới, và nâng cấp Plugin tại chỗ.

## Nhập từ hệ thống agent khác

Dùng các nhà cung cấp di chuyển được tích hợp sẵn để đưa hướng dẫn, máy chủ MCP, Skills, cấu hình mô hình, và khóa API (tùy chọn) vào OpenClaw. Các kế hoạch được xem trước trước khi có bất kỳ thay đổi nào, bí mật được che trong báo cáo, và thao tác áp dụng được bảo vệ bằng một bản sao lưu đã xác minh.

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/vi/install/migrating-claude" icon="brain">
    Nhập trạng thái Claude Code và Claude Desktop, bao gồm `CLAUDE.md`, máy chủ MCP, Skills, và lệnh dự án.
  </Card>
  <Card title="Migrating from Hermes" href="/vi/install/migrating-hermes" icon="feather">
    Nhập cấu hình Hermes, nhà cung cấp, máy chủ MCP, bộ nhớ, Skills, và các khóa `.env` được hỗ trợ.
  </Card>
</CardGroup>

Điểm vào CLI là [`openclaw migrate`](/vi/cli/migrate). Quy trình thiết lập ban đầu cũng có thể đề xuất di chuyển khi phát hiện một nguồn đã biết (`openclaw onboard --flow import`).

## Chuyển OpenClaw sang máy mới

Sao chép **thư mục trạng thái** (`~/.openclaw/` theo mặc định) và **workspace** của bạn để giữ lại:

- **Cấu hình** — `openclaw.json` và mọi thiết lập Gateway.
- **Xác thực** — `auth-profiles.json` theo từng agent (khóa API cộng với OAuth), cùng mọi trạng thái kênh hoặc nhà cung cấp trong `credentials/`.
- **Phiên** — lịch sử hội thoại và trạng thái agent.
- **Trạng thái kênh** — đăng nhập WhatsApp, phiên Telegram, và các trạng thái tương tự.
- **Tệp workspace** — `MEMORY.md`, `USER.md`, Skills, và prompt.

<Tip>
Chạy `openclaw status` trên máy cũ để xác nhận đường dẫn thư mục trạng thái của bạn. Hồ sơ tùy chỉnh dùng `~/.openclaw-<profile>/` hoặc một đường dẫn được đặt qua `OPENCLAW_STATE_DIR`.
</Tip>

### Các bước di chuyển

<Steps>
  <Step title="Stop the gateway and back up">
    Trên máy **cũ**, dừng Gateway để tệp không thay đổi giữa lúc sao chép, rồi lưu trữ:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Nếu bạn dùng nhiều hồ sơ (ví dụ `~/.openclaw-work`), hãy lưu trữ từng hồ sơ riêng.

  </Step>

  <Step title="Install OpenClaw on the new machine">
    [Cài đặt](/vi/install) CLI (và Node nếu cần) trên máy mới. Không sao nếu quy trình thiết lập ban đầu tạo một `~/.openclaw/` mới. Bạn sẽ ghi đè thư mục đó ở bước tiếp theo.
  </Step>

  <Step title="Copy state directory and workspace">
    Chuyển tệp lưu trữ qua `scp`, `rsync -a`, hoặc ổ đĩa ngoài, rồi giải nén:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Đảm bảo các thư mục ẩn đã được đưa vào và quyền sở hữu tệp khớp với người dùng sẽ chạy Gateway.

  </Step>

  <Step title="Run doctor and verify">
    Trên máy mới, chạy [Doctor](/vi/gateway/doctor) để áp dụng di chuyển cấu hình và sửa chữa dịch vụ:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### Lỗi thường gặp

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    Nếu Gateway cũ dùng `--profile` hoặc `OPENCLAW_STATE_DIR` còn Gateway mới thì không, các kênh sẽ trông như đã đăng xuất và phiên sẽ trống. Khởi chạy Gateway với **cùng** hồ sơ hoặc thư mục trạng thái bạn đã di chuyển, rồi chạy lại `openclaw doctor`.
  </Accordion>

  <Accordion title="Copying only openclaw.json">
    Chỉ riêng tệp cấu hình là chưa đủ. Hồ sơ xác thực mô hình nằm trong `agents/<agentId>/agent/auth-profiles.json`, còn trạng thái kênh và nhà cung cấp nằm trong `credentials/`. Luôn di chuyển **toàn bộ** thư mục trạng thái.
  </Accordion>

  <Accordion title="Permissions and ownership">
    Nếu bạn sao chép bằng root hoặc đổi người dùng, Gateway có thể không đọc được thông tin xác thực. Đảm bảo thư mục trạng thái và workspace thuộc sở hữu của người dùng chạy Gateway.
  </Accordion>

  <Accordion title="Remote mode">
    Nếu UI của bạn trỏ tới một Gateway **từ xa**, máy chủ từ xa sở hữu các phiên và workspace. Hãy di chuyển chính máy chủ Gateway, không phải laptop cục bộ của bạn. Xem [Câu hỏi thường gặp](/vi/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets in backups">
    Thư mục trạng thái chứa hồ sơ xác thực, thông tin xác thực kênh, và trạng thái nhà cung cấp khác. Hãy lưu bản sao lưu ở dạng mã hóa, tránh các kênh truyền không an toàn, và xoay vòng khóa nếu bạn nghi ngờ bị lộ.
  </Accordion>
</AccordionGroup>

### Danh sách kiểm tra xác minh

Trên máy mới, xác nhận:

- [ ] `openclaw status` hiển thị Gateway đang chạy.
- [ ] Các kênh vẫn được kết nối (không cần ghép đôi lại).
- [ ] Bảng điều khiển mở được và hiển thị các phiên hiện có.
- [ ] Các tệp workspace (bộ nhớ, cấu hình) có mặt.

## Nâng cấp Plugin tại chỗ

Nâng cấp Plugin tại chỗ giữ nguyên cùng id Plugin và khóa cấu hình, nhưng có thể chuyển trạng thái trên đĩa sang bố cục hiện tại. Hướng dẫn nâng cấp riêng cho từng Plugin nằm cùng với kênh của chúng:

- [Di chuyển Matrix](/vi/channels/matrix-migration): giới hạn khôi phục trạng thái đã mã hóa, hành vi snapshot tự động, và lệnh khôi phục thủ công.

## Liên quan

- [`openclaw migrate`](/vi/cli/migrate): tham chiếu CLI cho thao tác nhập giữa các hệ thống.
- [Tổng quan cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau di chuyển.
- [Gỡ cài đặt](/vi/install/uninstall): gỡ OpenClaw một cách sạch sẽ.
