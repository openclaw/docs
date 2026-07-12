---
read_when:
    - Thiết lập lần đầu từ đầu
    - Bạn muốn cách nhanh nhất để có một cuộc trò chuyện hoạt động được
summary: Cài đặt OpenClaw và bắt đầu cuộc trò chuyện đầu tiên chỉ trong vài phút.
title: Bắt đầu sử dụng
x-i18n:
    generated_at: "2026-07-12T08:23:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Cài đặt OpenClaw, chạy quy trình thiết lập ban đầu và trò chuyện với trợ lý AI của bạn trong khoảng 5
phút. Khi hoàn tất, bạn sẽ có một Gateway đang chạy, phương thức xác thực đã được cấu hình và một
phiên trò chuyện hoạt động.

## Những gì bạn cần

- **Node.js 22.19+, 23.11+ hoặc 24+** (24 là phiên bản mặc định được khuyến nghị)
- **Khóa API** từ một nhà cung cấp mô hình (Anthropic, OpenAI, Google, v.v.) — quy trình thiết lập ban đầu sẽ yêu cầu bạn nhập khóa

<Tip>
Kiểm tra phiên bản Node bằng `node --version`.
**Người dùng Windows:** ứng dụng Windows Hub gốc là lựa chọn dễ nhất trên máy tính. Trình cài đặt
PowerShell và các phương thức chạy Gateway qua WSL2 cũng được hỗ trợ. Xem [Windows](/vi/platforms/windows).
Bạn cần cài đặt Node? Xem [Thiết lập Node](/vi/install/node).
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
  alt="Quy trình của tập lệnh cài đặt"
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

    Trình hướng dẫn sẽ giúp bạn chọn nhà cung cấp mô hình, thiết lập khóa API
    và cấu hình Gateway. QuickStart thường chỉ mất vài phút, nhưng
    việc đăng nhập vào nhà cung cấp, ghép nối kênh, cài đặt daemon, tải xuống qua mạng, thiết lập Skills
    hoặc các Plugin tùy chọn có thể khiến toàn bộ quy trình thiết lập ban đầu mất nhiều thời gian hơn. Hãy bỏ qua các
    bước tùy chọn và quay lại sau bằng `openclaw configure`.

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

    Lệnh này mở giao diện điều khiển trong trình duyệt. Nếu giao diện tải được thì mọi thứ đang hoạt động.

  </Step>
  <Step title="Gửi tin nhắn đầu tiên">
    Nhập một tin nhắn trong phần trò chuyện của giao diện điều khiển và bạn sẽ nhận được phản hồi từ AI.

    Bạn muốn trò chuyện bằng điện thoại? Kênh thiết lập nhanh nhất là
    [Telegram](/vi/channels/telegram) (chỉ cần mã thông báo bot). Xem [Các kênh](/vi/channels)
    để biết tất cả tùy chọn.

  </Step>
</Steps>

<Accordion title="Nâng cao: gắn một bản dựng giao diện điều khiển tùy chỉnh">
  Nếu bạn duy trì một bản dựng bảng điều khiển đã được bản địa hóa hoặc tùy chỉnh, hãy đặt
  `gateway.controlUi.root` trỏ đến thư mục chứa các tài nguyên tĩnh đã dựng
  và tệp `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Sao chép các tệp tĩnh đã dựng của bạn vào thư mục đó.
```

Sau đó thiết lập:

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
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo và nhiều nền tảng khác.
  </Card>
  <Card title="Ghép nối và an toàn" href="/vi/channels/pairing" icon="shield">
    Kiểm soát những người có thể nhắn tin cho tác nhân của bạn.
  </Card>
  <Card title="Cấu hình Gateway" href="/vi/gateway/configuration" icon="settings">
    Mô hình, công cụ, môi trường cô lập và các thiết lập nâng cao.
  </Card>
  <Card title="Khám phá công cụ" href="/vi/tools" icon="wrench">
    Trình duyệt, thực thi lệnh, tìm kiếm web, Skills và các Plugin.
  </Card>
</Columns>

<Accordion title="Nâng cao: biến môi trường">
  Nếu bạn chạy OpenClaw bằng tài khoản dịch vụ hoặc muốn sử dụng các đường dẫn tùy chỉnh:

- `OPENCLAW_HOME` — thư mục chính để phân giải đường dẫn nội bộ
- `OPENCLAW_STATE_DIR` — ghi đè thư mục trạng thái
- `OPENCLAW_CONFIG_PATH` — ghi đè đường dẫn tệp cấu hình

Tài liệu tham khảo đầy đủ: [Biến môi trường](/vi/help/environment).
</Accordion>

## Nội dung liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Tổng quan về các kênh](/vi/channels)
- [Thiết lập](/vi/start/setup)
