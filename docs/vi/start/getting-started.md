---
read_when:
    - Thiết lập lần đầu từ con số không
    - Bạn muốn cách nhanh nhất để có một cuộc trò chuyện hoạt động
summary: Cài đặt OpenClaw và chạy cuộc trò chuyện đầu tiên của bạn chỉ trong vài phút.
title: Bắt đầu
x-i18n:
    generated_at: "2026-06-28T20:45:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

Cài đặt OpenClaw, chạy thiết lập ban đầu và trò chuyện với trợ lý AI của bạn — tất cả trong
khoảng 5 phút. Khi hoàn tất, bạn sẽ có Gateway đang chạy, xác thực đã cấu hình
và một phiên trò chuyện hoạt động.

## Bạn cần gì

- **Node.js** — khuyến nghị Node 24 (cũng hỗ trợ Node 22.19+)
- **Một khóa API** từ nhà cung cấp mô hình (Anthropic, OpenAI, Google, v.v.) — quy trình thiết lập ban đầu sẽ nhắc bạn nhập

<Tip>
Kiểm tra phiên bản Node của bạn bằng `node --version`.
**Người dùng Windows:** ứng dụng Windows Hub gốc là cách dễ nhất trên desktop. Trình cài đặt
PowerShell và các đường dẫn WSL2 Gateway cũng được hỗ trợ. Xem [Windows](/vi/platforms/windows).
Cần cài đặt Node? Xem [Thiết lập Node](/vi/install/node).
</Tip>

## Thiết lập nhanh

<Steps>
  <Step title="Install OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Các phương thức cài đặt khác (Docker, Nix, npm): [Cài đặt](/vi/install).
    </Note>

  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn sẽ dẫn bạn qua việc chọn nhà cung cấp mô hình, đặt khóa API
    và cấu hình Gateway. QuickStart thường chỉ mất vài phút, nhưng
    đăng nhập nhà cung cấp, ghép nối kênh, cài đặt daemon, tải xuống qua mạng, Skills
    hoặc Plugin tùy chọn có thể khiến toàn bộ quy trình thiết lập ban đầu mất nhiều thời gian hơn. Bạn có thể bỏ qua các bước
    tùy chọn và quay lại sau bằng `openclaw configure`.

    Xem [Thiết lập ban đầu (CLI)](/vi/start/wizard) để biết tài liệu tham khảo đầy đủ.

  </Step>
  <Step title="Verify the Gateway is running">
    ```bash
    openclaw gateway status
    ```

    Bạn sẽ thấy Gateway đang lắng nghe trên cổng 18789.

  </Step>
  <Step title="Open the dashboard">
    ```bash
    openclaw dashboard
    ```

    Lệnh này mở Control UI trong trình duyệt của bạn. Nếu giao diện tải lên, mọi thứ đang hoạt động.

  </Step>
  <Step title="Send your first message">
    Nhập một tin nhắn trong phần trò chuyện của Control UI và bạn sẽ nhận được phản hồi từ AI.

    Muốn trò chuyện từ điện thoại thay vào đó? Kênh thiết lập nhanh nhất là
    [Telegram](/vi/channels/telegram) (chỉ cần bot token). Xem [Kênh](/vi/channels)
    để biết tất cả tùy chọn.

  </Step>
</Steps>

<Accordion title="Advanced: mount a custom Control UI build">
  Nếu bạn duy trì một bản dựng dashboard đã bản địa hóa hoặc tùy chỉnh, hãy trỏ
  `gateway.controlUi.root` đến một thư mục chứa các tài nguyên tĩnh đã build
  và `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Sau đó đặt:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Khởi động lại Gateway và mở lại dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Việc cần làm tiếp theo

<Columns>
  <Card title="Connect a channel" href="/vi/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo và nhiều nền tảng khác.
  </Card>
  <Card title="Pairing and safety" href="/vi/channels/pairing" icon="shield">
    Kiểm soát ai có thể nhắn tin cho agent của bạn.
  </Card>
  <Card title="Configure the Gateway" href="/vi/gateway/configuration" icon="settings">
    Mô hình, công cụ, sandbox và cài đặt nâng cao.
  </Card>
  <Card title="Browse tools" href="/vi/tools" icon="wrench">
    Trình duyệt, exec, tìm kiếm web, Skills và Plugin.
  </Card>
</Columns>

<Accordion title="Advanced: environment variables">
  Nếu bạn chạy OpenClaw dưới dạng tài khoản dịch vụ hoặc muốn dùng đường dẫn tùy chỉnh:

- `OPENCLAW_HOME` — thư mục home để phân giải đường dẫn nội bộ
- `OPENCLAW_STATE_DIR` — ghi đè thư mục trạng thái
- `OPENCLAW_CONFIG_PATH` — ghi đè đường dẫn tệp cấu hình

Tài liệu tham khảo đầy đủ: [Biến môi trường](/vi/help/environment).
</Accordion>

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Tổng quan kênh](/vi/channels)
- [Thiết lập](/vi/start/setup)
