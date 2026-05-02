---
read_when:
    - Bạn đang chuyển OpenClaw sang một máy tính xách tay hoặc máy chủ mới
    - Bạn đang chuyển từ một hệ thống tác nhân khác và muốn giữ nguyên trạng thái
    - Bạn đang nâng cấp một Plugin tại chỗ
summary: 'Trung tâm di chuyển: nhập xuyên hệ thống, di chuyển giữa các máy và nâng cấp Plugin'
title: Hướng dẫn di chuyển
x-i18n:
    generated_at: "2026-05-02T10:46:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw hỗ trợ ba lộ trình di chuyển: nhập từ một hệ thống agent khác, chuyển một bản cài đặt hiện có sang máy mới, và nâng cấp Plugin tại chỗ.

## Nhập từ một hệ thống agent khác

Dùng các nhà cung cấp di chuyển đi kèm để đưa hướng dẫn, máy chủ MCP, Skills, cấu hình mô hình và (tùy chọn) khóa API vào OpenClaw. Kế hoạch được xem trước trước khi có bất kỳ thay đổi nào, thông tin bí mật được che trong báo cáo, và thao tác áp dụng được hỗ trợ bằng bản sao lưu đã xác minh.

<CardGroup cols={2}>
  <Card title="Di chuyển từ Claude" href="/vi/install/migrating-claude" icon="brain">
    Nhập trạng thái Claude Code và Claude Desktop, bao gồm `CLAUDE.md`, máy chủ MCP, Skills và lệnh dự án.
  </Card>
  <Card title="Di chuyển từ Hermes" href="/vi/install/migrating-hermes" icon="feather">
    Nhập cấu hình Hermes, nhà cung cấp, máy chủ MCP, bộ nhớ, Skills và các khóa `.env` được hỗ trợ.
  </Card>
</CardGroup>

Điểm vào CLI là [`openclaw migrate`](/vi/cli/migrate). Quy trình thiết lập ban đầu cũng có thể đề xuất di chuyển khi phát hiện một nguồn đã biết (`openclaw onboard --flow import`).

## Chuyển OpenClaw sang máy mới

Sao chép **thư mục trạng thái** (`~/.openclaw/` theo mặc định) và **không gian làm việc** của bạn để giữ lại:

- **Cấu hình** — `openclaw.json` và toàn bộ cài đặt Gateway.
- **Xác thực** — `auth-profiles.json` theo từng agent (khóa API cùng OAuth), cộng với mọi trạng thái kênh hoặc nhà cung cấp trong `credentials/`.
- **Phiên** — lịch sử hội thoại và trạng thái agent.
- **Trạng thái kênh** — đăng nhập WhatsApp, phiên Telegram và các trạng thái tương tự.
- **Tệp trong không gian làm việc** — `MEMORY.md`, `USER.md`, Skills và prompt.

<Tip>
Chạy `openclaw status` trên máy cũ để xác nhận đường dẫn thư mục trạng thái của bạn. Hồ sơ tùy chỉnh dùng `~/.openclaw-<profile>/` hoặc một đường dẫn được đặt qua `OPENCLAW_STATE_DIR`.
</Tip>

### Các bước di chuyển

<Steps>
  <Step title="Dừng Gateway và sao lưu">
    Trên máy **cũ**, dừng Gateway để tệp không thay đổi trong lúc sao chép, rồi tạo bản lưu trữ:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Nếu bạn dùng nhiều hồ sơ (ví dụ `~/.openclaw-work`), hãy lưu trữ từng hồ sơ riêng.

  </Step>

  <Step title="Cài đặt OpenClaw trên máy mới">
    [Cài đặt](/vi/install) CLI (và Node nếu cần) trên máy mới. Không sao nếu quy trình thiết lập ban đầu tạo một `~/.openclaw/` mới. Bạn sẽ ghi đè nó ở bước tiếp theo.
  </Step>

  <Step title="Sao chép thư mục trạng thái và không gian làm việc">
    Chuyển bản lưu trữ qua `scp`, `rsync -a` hoặc ổ đĩa ngoài, rồi giải nén:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Đảm bảo các thư mục ẩn đã được bao gồm và quyền sở hữu tệp khớp với người dùng sẽ chạy Gateway.

  </Step>

  <Step title="Chạy doctor và xác minh">
    Trên máy mới, chạy [Doctor](/vi/gateway/doctor) để áp dụng các di chuyển cấu hình và sửa chữa dịch vụ:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Nếu Telegram hoặc Discord dùng phương án dự phòng biến môi trường mặc định (`TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN`), hãy xác minh tệp `.env` trong thư mục trạng thái đã di chuyển có chứa các khóa đó mà không in giá trị bí mật:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` cũng cảnh báo khi một tài khoản Telegram hoặc Discord mặc định đang bật không có token đã cấu hình và biến môi trường tương ứng không khả dụng với tiến trình doctor.

### Lỗi thường gặp

<AccordionGroup>
  <Accordion title="Không khớp hồ sơ hoặc thư mục trạng thái">
    Nếu Gateway cũ dùng `--profile` hoặc `OPENCLAW_STATE_DIR` còn Gateway mới thì không, các kênh sẽ có vẻ như đã đăng xuất và phiên sẽ trống. Khởi chạy Gateway với **cùng** hồ sơ hoặc thư mục trạng thái mà bạn đã di chuyển, rồi chạy lại `openclaw doctor`.
  </Accordion>

  <Accordion title="Chỉ sao chép openclaw.json">
    Chỉ riêng tệp cấu hình là chưa đủ. Hồ sơ xác thực mô hình nằm trong `agents/<agentId>/agent/auth-profiles.json`, còn trạng thái kênh và nhà cung cấp nằm trong `credentials/`. Luôn di chuyển **toàn bộ** thư mục trạng thái.
  </Accordion>

  <Accordion title="Quyền và quyền sở hữu">
    Nếu bạn sao chép với quyền root hoặc đổi người dùng, Gateway có thể không đọc được thông tin xác thực. Hãy đảm bảo thư mục trạng thái và không gian làm việc thuộc sở hữu của người dùng chạy Gateway.
  </Accordion>

  <Accordion title="Chế độ từ xa">
    Nếu UI của bạn trỏ tới một Gateway **từ xa**, máy chủ từ xa sở hữu phiên và không gian làm việc. Hãy di chuyển chính máy chủ Gateway, không phải laptop cục bộ của bạn. Xem [FAQ](/vi/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Thông tin bí mật trong bản sao lưu">
    Thư mục trạng thái chứa hồ sơ xác thực, thông tin xác thực kênh và trạng thái nhà cung cấp khác. Lưu trữ bản sao lưu dưới dạng mã hóa, tránh các kênh truyền không an toàn, và xoay vòng khóa nếu bạn nghi ngờ đã bị lộ.
  </Accordion>
</AccordionGroup>

### Danh sách kiểm tra xác minh

Trên máy mới, xác nhận:

- [ ] `openclaw status` cho thấy Gateway đang chạy.
- [ ] Các kênh vẫn được kết nối (không cần ghép nối lại).
- [ ] Bảng điều khiển mở được và hiển thị các phiên hiện có.
- [ ] Tệp trong không gian làm việc (bộ nhớ, cấu hình) hiện diện.

## Nâng cấp Plugin tại chỗ

Nâng cấp Plugin tại chỗ giữ nguyên cùng id Plugin và khóa cấu hình nhưng có thể chuyển trạng thái trên đĩa vào cấu trúc hiện tại. Hướng dẫn nâng cấp theo từng Plugin nằm cùng với các kênh của chúng:

- [Di chuyển Matrix](/vi/channels/matrix-migration): giới hạn khôi phục trạng thái mã hóa, hành vi chụp nhanh tự động và lệnh khôi phục thủ công.

## Liên quan

- [`openclaw migrate`](/vi/cli/migrate): tham chiếu CLI cho nhập liên hệ thống.
- [Tổng quan cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau di chuyển.
- [Gỡ cài đặt](/vi/install/uninstall): gỡ OpenClaw sạch sẽ.
