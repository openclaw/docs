---
read_when:
    - Thiết lập lần đầu từ con số không
    - Bạn muốn cách nhanh nhất để có một cuộc trò chuyện hoạt động
summary: Cài đặt OpenClaw và chạy cuộc trò chuyện đầu tiên của bạn chỉ trong vài phút.
title: Bắt đầu
x-i18n:
    generated_at: "2026-06-27T18:12:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

Cài đặt OpenClaw, chạy thiết lập ban đầu và trò chuyện với trợ lý AI của bạn — tất cả trong
khoảng 5 phút. Khi hoàn tất, bạn sẽ có một Gateway đang chạy, xác thực đã cấu hình,
và một phiên trò chuyện hoạt động.

## Bạn cần gì

- **Node.js** — khuyến nghị Node 24 (cũng hỗ trợ Node 22.19+)
- **Một khóa API** từ nhà cung cấp mô hình (Anthropic, OpenAI, Google, v.v.) — quá trình thiết lập ban đầu sẽ nhắc bạn nhập

<Tip>
Kiểm tra phiên bản Node của bạn bằng `node --version`.
**Người dùng Windows:** ứng dụng Hub gốc cho Windows là đường dẫn desktop dễ nhất. Trình cài đặt
PowerShell và các đường dẫn WSL2 Gateway cũng được hỗ trợ. Xem [Windows](/vi/platforms/windows).
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
  <Step title="Chạy thiết lập ban đầu">
    ```bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn sẽ dẫn bạn qua việc chọn nhà cung cấp mô hình, đặt khóa API,
    và cấu hình Gateway. Quá trình này mất khoảng 2 phút.

    Xem [Thiết lập ban đầu (CLI)](/vi/start/wizard) để biết tài liệu tham chiếu đầy đủ.

  </Step>
  <Step title="Xác minh Gateway đang chạy">
    ```bash
    openclaw gateway status
    ```

    Bạn sẽ thấy Gateway đang lắng nghe trên cổng 18789.

  </Step>
  <Step title="Mở dashboard">
    ```bash
    openclaw dashboard
    ```

    Thao tác này mở Control UI trong trình duyệt của bạn. Nếu giao diện tải được, mọi thứ đang hoạt động.

  </Step>
  <Step title="Gửi tin nhắn đầu tiên của bạn">
    Nhập một tin nhắn trong phần trò chuyện của Control UI và bạn sẽ nhận được phản hồi từ AI.

    Muốn trò chuyện từ điện thoại thay vì vậy? Kênh nhanh nhất để thiết lập là
    [Telegram](/vi/channels/telegram) (chỉ cần token bot). Xem [Kênh](/vi/channels)
    để biết tất cả tùy chọn.

  </Step>
</Steps>

<Accordion title="Nâng cao: gắn một bản dựng Control UI tùy chỉnh">
  Nếu bạn duy trì một bản dựng dashboard đã bản địa hóa hoặc tùy chỉnh, hãy trỏ
  `gateway.controlUi.root` tới một thư mục chứa các tài nguyên tĩnh đã dựng
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

Khởi động lại gateway và mở lại dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Làm gì tiếp theo

<Columns>
  <Card title="Kết nối một kênh" href="/vi/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, và nhiều hơn nữa.
  </Card>
  <Card title="Ghép nối và an toàn" href="/vi/channels/pairing" icon="shield">
    Kiểm soát ai có thể nhắn tin cho agent của bạn.
  </Card>
  <Card title="Cấu hình Gateway" href="/vi/gateway/configuration" icon="settings">
    Mô hình, công cụ, sandbox và cài đặt nâng cao.
  </Card>
  <Card title="Duyệt công cụ" href="/vi/tools" icon="wrench">
    Trình duyệt, exec, tìm kiếm web, Skills và Plugin.
  </Card>
</Columns>

<Accordion title="Nâng cao: biến môi trường">
  Nếu bạn chạy OpenClaw bằng tài khoản dịch vụ hoặc muốn đường dẫn tùy chỉnh:

- `OPENCLAW_HOME` — thư mục home để phân giải đường dẫn nội bộ
- `OPENCLAW_STATE_DIR` — ghi đè thư mục trạng thái
- `OPENCLAW_CONFIG_PATH` — ghi đè đường dẫn tệp cấu hình

Tài liệu tham chiếu đầy đủ: [Biến môi trường](/vi/help/environment).
</Accordion>

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Tổng quan kênh](/vi/channels)
- [Thiết lập](/vi/start/setup)
