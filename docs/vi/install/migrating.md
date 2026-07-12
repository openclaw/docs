---
read_when:
    - Bạn đang chuyển OpenClaw sang một máy tính xách tay hoặc máy chủ mới
    - Bạn đang chuyển từ một hệ thống tác tử khác sang và muốn giữ nguyên trạng thái
    - Bạn đang nâng cấp một plugin tại chỗ
summary: 'Trung tâm di chuyển: nhập dữ liệu giữa các hệ thống, chuyển đổi giữa các máy và nâng cấp plugin'
title: Hướng dẫn di chuyển
x-i18n:
    generated_at: "2026-07-12T08:03:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw hỗ trợ ba lộ trình di chuyển: nhập từ một hệ thống tác nhân khác, chuyển bản cài đặt hiện có sang máy mới và nâng cấp Plugin tại chỗ.

## Nhập từ một hệ thống tác nhân khác

Các trình cung cấp di chuyển đi kèm đưa hướng dẫn, máy chủ MCP, Skills, cấu hình mô hình và khóa API (nếu chọn tham gia) vào OpenClaw. Các kế hoạch được xem trước trước khi thực hiện bất kỳ thay đổi nào, bí mật được che trong báo cáo và thao tác áp dụng được bảo đảm bằng một bản sao lưu đã xác minh.

<CardGroup cols={2}>
  <Card title="Di chuyển từ Claude" href="/vi/install/migrating-claude" icon="brain">
    Nhập trạng thái Claude Code và Claude Desktop, bao gồm `CLAUDE.md`, máy chủ MCP, Skills và lệnh dự án.
  </Card>
  <Card title="Di chuyển từ Hermes" href="/vi/install/migrating-hermes" icon="feather">
    Nhập cấu hình, trình cung cấp, máy chủ MCP, bộ nhớ, Skills và các khóa `.env` được hỗ trợ của Hermes.
  </Card>
</CardGroup>

Điểm vào CLI là [`openclaw migrate`](/vi/cli/migrate). Quá trình thiết lập ban đầu cũng có thể đề xuất di chuyển khi phát hiện một nguồn đã biết (`openclaw onboard --flow import`).

## Chuyển OpenClaw sang máy mới

Sao chép **thư mục trạng thái** (`~/.openclaw/` theo mặc định) và **không gian làm việc** của bạn để bảo toàn:

- **Cấu hình** — `openclaw.json` và toàn bộ cài đặt Gateway.
- **Xác thực** — `auth-profiles.json` của từng tác nhân (khóa API cùng với OAuth), cộng với mọi trạng thái kênh hoặc trình cung cấp trong `credentials/`.
- **Phiên** — lịch sử hội thoại và trạng thái tác nhân.
- **Trạng thái kênh** — thông tin đăng nhập WhatsApp, phiên Telegram và các thông tin tương tự.
- **Tệp không gian làm việc** — `MEMORY.md`, `USER.md`, Skills và câu lệnh nhắc.

<Tip>
Chạy `openclaw status` trên máy cũ để xác nhận đường dẫn thư mục trạng thái. Hồ sơ tùy chỉnh sử dụng `~/.openclaw-<profile>/` hoặc đường dẫn được đặt qua `OPENCLAW_STATE_DIR`.
</Tip>

### Các bước di chuyển

<Steps>
  <Step title="Dừng Gateway và sao lưu">
    Trên máy **cũ**, hãy dừng Gateway để các tệp không thay đổi giữa lúc sao chép, sau đó tạo tệp lưu trữ:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Nếu bạn sử dụng nhiều hồ sơ (ví dụ `~/.openclaw-work`), hãy lưu trữ riêng từng hồ sơ.

  </Step>

  <Step title="Cài đặt OpenClaw trên máy mới">
    [Cài đặt](/vi/install) CLI (và Node nếu cần) trên máy mới. Không sao nếu quá trình thiết lập ban đầu tạo một `~/.openclaw/` mới — bạn sẽ ghi đè lên thư mục đó ở bước tiếp theo.
  </Step>

  <Step title="Sao chép thư mục trạng thái và không gian làm việc">
    Truyền tệp lưu trữ qua `scp`, `rsync -a` hoặc ổ đĩa ngoài, sau đó giải nén:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Xác nhận rằng các thư mục ẩn đã được bao gồm và quyền sở hữu tệp khớp với người dùng sẽ chạy Gateway.

  </Step>

  <Step title="Chạy Doctor và xác minh">
    Trên máy mới, hãy chạy [Doctor](/vi/gateway/doctor) để áp dụng các bản di chuyển cấu hình và sửa chữa dịch vụ:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Nếu Telegram hoặc Discord sử dụng phương án dự phòng từ môi trường mặc định (`TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN`), hãy xác minh rằng tệp `.env` trong thư mục trạng thái đã di chuyển chứa các khóa đó mà không in giá trị bí mật:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` cũng cảnh báo khi tài khoản Telegram hoặc Discord mặc định đang bật nhưng chưa được cấu hình mã thông báo và biến môi trường tương ứng không khả dụng cho tiến trình Doctor.

### Các lỗi thường gặp

<AccordionGroup>
  <Accordion title="Hồ sơ hoặc thư mục trạng thái không khớp">
    Nếu Gateway cũ sử dụng `--profile` hoặc `OPENCLAW_STATE_DIR` nhưng Gateway mới thì không, các kênh sẽ có vẻ như đã đăng xuất và các phiên sẽ trống. Khởi chạy Gateway với **cùng** hồ sơ hoặc thư mục trạng thái mà bạn đã di chuyển, sau đó chạy lại `openclaw doctor`.
  </Accordion>

  <Accordion title="Chỉ sao chép openclaw.json">
    Chỉ riêng tệp cấu hình là không đủ. Hồ sơ xác thực mô hình nằm trong `agents/<agentId>/agent/auth-profiles.json`, còn trạng thái kênh và trình cung cấp nằm trong `credentials/`. Luôn di chuyển **toàn bộ** thư mục trạng thái.
  </Accordion>

  <Accordion title="Quyền và quyền sở hữu">
    Nếu bạn đã sao chép bằng tài khoản root hoặc chuyển đổi người dùng, Gateway có thể không đọc được thông tin xác thực. Hãy bảo đảm thư mục trạng thái và không gian làm việc thuộc sở hữu của người dùng đang chạy Gateway.
  </Accordion>

  <Accordion title="Chế độ từ xa">
    Nếu giao diện người dùng của bạn trỏ đến một Gateway **từ xa**, máy chủ từ xa sẽ quản lý các phiên và không gian làm việc. Hãy di chuyển chính máy chủ Gateway, không phải máy tính xách tay cục bộ của bạn. Xem [Câu hỏi thường gặp](/vi/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Bí mật trong bản sao lưu">
    Thư mục trạng thái chứa hồ sơ xác thực, thông tin xác thực của kênh và trạng thái khác của trình cung cấp. Hãy lưu trữ bản sao lưu ở dạng mã hóa, tránh các kênh truyền không an toàn và thay mới khóa nếu bạn nghi ngờ thông tin đã bị lộ.
  </Accordion>
</AccordionGroup>

### Danh sách kiểm tra xác minh

Trên máy mới, hãy xác nhận:

- [ ] `openclaw status` cho biết Gateway đang chạy.
- [ ] Các kênh vẫn được kết nối (không cần ghép nối lại).
- [ ] Bảng điều khiển mở được và hiển thị các phiên hiện có.
- [ ] Các tệp không gian làm việc (bộ nhớ, cấu hình) hiện diện.

## Nâng cấp Plugin tại chỗ

Việc nâng cấp Plugin tại chỗ giữ nguyên id Plugin và các khóa cấu hình nhưng có thể chuyển trạng thái trên đĩa sang bố cục hiện tại. Hướng dẫn nâng cấp dành riêng cho từng Plugin nằm cùng với các kênh tương ứng:

- [Di chuyển Matrix](/vi/channels/matrix-migration): giới hạn khôi phục trạng thái đã mã hóa, hành vi tạo ảnh chụp nhanh tự động và các lệnh khôi phục thủ công.

## Liên quan

- [`openclaw migrate`](/vi/cli/migrate): tài liệu tham khảo CLI dành cho việc nhập giữa các hệ thống.
- [Tổng quan về cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi di chuyển.
- [Gỡ cài đặt](/vi/install/uninstall): gỡ bỏ OpenClaw một cách sạch sẽ.
