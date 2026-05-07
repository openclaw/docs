---
read_when:
    - Thiết lập lần đầu từ con số không
    - Bạn muốn cách nhanh nhất để có một cuộc trò chuyện hoạt động
summary: Cài đặt OpenClaw và chạy cuộc trò chuyện đầu tiên của bạn chỉ trong vài phút.
title: Bắt đầu
x-i18n:
    generated_at: "2026-05-07T13:24:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

Cài đặt OpenClaw, chạy quy trình thiết lập ban đầu và trò chuyện với trợ lý AI của bạn — tất cả chỉ trong
khoảng 5 phút. Khi hoàn tất, bạn sẽ có một Gateway đang chạy, xác thực đã được cấu hình,
và một phiên trò chuyện hoạt động.

## Bạn cần có

- **Node.js** — khuyến nghị Node 24 (cũng hỗ trợ Node 22.16+)
- **Khóa API** từ một nhà cung cấp mô hình (Anthropic, OpenAI, Google, v.v.) — quy trình thiết lập ban đầu sẽ yêu cầu bạn nhập

<Tip>
Kiểm tra phiên bản Node của bạn bằng `node --version`.
**Người dùng Windows:** hỗ trợ cả Windows gốc và WSL2. WSL2 ổn định hơn
và được khuyến nghị để có trải nghiệm đầy đủ. Xem [Windows](/vi/platforms/windows).
Cần cài đặt Node? Xem [Thiết lập Node](/vi/install/node).
</Tip>

## Thiết lập nhanh

<Steps>
  <Step title="Cài đặt OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Quy trình tập lệnh cài đặt"
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
  <Step title="Chạy quy trình thiết lập ban đầu">
    ```bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn sẽ dẫn bạn qua việc chọn nhà cung cấp mô hình, đặt khóa API,
    và cấu hình Gateway. Quá trình này mất khoảng 2 phút.

    Xem [Thiết lập ban đầu (CLI)](/vi/start/wizard) để biết tài liệu tham khảo đầy đủ.

  </Step>
  <Step title="Xác minh Gateway đang chạy">
    ```bash
    openclaw gateway status
    ```

    Bạn sẽ thấy Gateway đang lắng nghe trên cổng 18789.

  </Step>
  <Step title="Mở bảng điều khiển">
    ```bash
    openclaw dashboard
    ```

    Lệnh này mở Control UI trong trình duyệt của bạn. Nếu trang tải được, mọi thứ đang hoạt động.

  </Step>
  <Step title="Gửi tin nhắn đầu tiên">
    Nhập một tin nhắn trong cuộc trò chuyện của Control UI và bạn sẽ nhận được phản hồi từ AI.

    Thay vào đó muốn trò chuyện từ điện thoại? Kênh nhanh nhất để thiết lập là
    [Telegram](/vi/channels/telegram) (chỉ cần mã thông báo bot). Xem [Kênh](/vi/channels)
    để biết tất cả tùy chọn.

  </Step>
</Steps>

<Accordion title="Nâng cao: gắn một bản dựng Control UI tùy chỉnh">
  Nếu bạn duy trì một bản dựng bảng điều khiển đã bản địa hóa hoặc tùy chỉnh, hãy trỏ
  `gateway.controlUi.root` đến một thư mục chứa các tài sản tĩnh đã dựng
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

Khởi động lại Gateway và mở lại bảng điều khiển:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Việc cần làm tiếp theo

<Columns>
  <Card title="Kết nối một kênh" href="/vi/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, và nhiều kênh khác.
  </Card>
  <Card title="Ghép nối và an toàn" href="/vi/channels/pairing" icon="shield">
    Kiểm soát ai có thể nhắn tin cho agent của bạn.
  </Card>
  <Card title="Cấu hình Gateway" href="/vi/gateway/configuration" icon="settings">
    Mô hình, công cụ, sandbox, và cài đặt nâng cao.
  </Card>
  <Card title="Duyệt công cụ" href="/vi/tools" icon="wrench">
    Trình duyệt, exec, tìm kiếm web, Skills, và Plugin.
  </Card>
</Columns>

<Accordion title="Nâng cao: biến môi trường">
  Nếu bạn chạy OpenClaw bằng tài khoản dịch vụ hoặc muốn dùng đường dẫn tùy chỉnh:

- `OPENCLAW_HOME` — thư mục chính để phân giải đường dẫn nội bộ
- `OPENCLAW_STATE_DIR` — ghi đè thư mục trạng thái
- `OPENCLAW_CONFIG_PATH` — ghi đè đường dẫn tệp cấu hình

Tài liệu tham khảo đầy đủ: [Biến môi trường](/vi/help/environment).
</Accordion>

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Tổng quan kênh](/vi/channels)
- [Thiết lập](/vi/start/setup)
