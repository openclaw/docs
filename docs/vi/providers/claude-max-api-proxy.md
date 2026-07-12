---
read_when:
    - Bạn muốn sử dụng gói đăng ký Claude Max với các công cụ tương thích với OpenAI
    - Bạn muốn một máy chủ API cục bộ bao bọc Claude Code CLI
    - Bạn muốn đánh giá quyền truy cập Anthropic dựa trên gói đăng ký so với dựa trên khóa API
summary: Proxy cộng đồng để cung cấp thông tin xác thực gói đăng ký Claude dưới dạng điểm cuối tương thích với OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-07-12T08:19:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** là một gói npm do cộng đồng phát triển (không phải Plugin OpenClaw), giúp
cung cấp gói đăng ký Claude Max/Pro dưới dạng điểm cuối API tương thích với OpenAI, nhờ đó
bạn có thể trỏ bất kỳ công cụ tương thích với OpenAI nào đến gói đăng ký của mình thay vì dùng
khóa API Anthropic.

<Warning>
Chỉ tương thích về mặt kỹ thuật, không phải phương thức được chính thức chấp thuận. Trước đây, Anthropic đã
chặn một số trường hợp sử dụng gói đăng ký bên ngoài Claude Code; hãy xác minh
các quy tắc thanh toán hiện hành của Anthropic trước khi dựa vào phương thức này.

Tài liệu Claude Code của Anthropic mô tả `claude -p` là cách sử dụng Agent SDK/lập trình.
Theo bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026 của Anthropic, Claude Agent SDK,
`claude -p` và việc sử dụng ứng dụng bên thứ ba đều dùng hạn mức sử dụng của
gói đăng ký đã đăng nhập (kế hoạch tín dụng Agent SDK riêng được công bố trước đó hiện
đang tạm dừng). Xem [bài viết về gói Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
của Anthropic, các bài viết về gói [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
và [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
cùng [nhà cung cấp Anthropic](/vi/providers/anthropic) để biết ghi chú riêng của OpenClaw
về việc thanh toán Claude CLI.
</Warning>

## Tại sao nên sử dụng

| Phương thức                | Cách tính chi phí                                  | Phù hợp nhất                                      |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Khóa API Anthropic         | Trả phí theo từng token qua Claude Console         | Ứng dụng sản xuất, tự động hóa dùng chung, lưu lượng lớn |
| Proxy gói đăng ký Claude   | Quy tắc về gói và tín dụng của Claude Code / `claude -p` | Thử nghiệm cá nhân với các công cụ tương thích |

Proxy này cho phép gói đăng ký Claude Max hoặc Pro hoạt động với các công cụ
tương thích với OpenAI. Đây không phải phương thức trả phí cố định không giới hạn — nó
kế thừa hạn mức sử dụng của Claude Code. Khóa API vẫn là phương thức thanh toán
rõ ràng hơn cho mục đích sử dụng trong môi trường sản xuất.

## Cách hoạt động

```text
Ứng dụng của bạn -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (định dạng OpenAI)              (chuyển đổi định dạng)              (sử dụng thông tin đăng nhập của bạn)
```

Proxy khởi chạy Claude Code CLI dưới dạng tiến trình con cho mỗi yêu cầu, chuyển đổi
yêu cầu trò chuyện theo định dạng OpenAI thành lời nhắc CLI, rồi truyền phát (hoặc trả về)
phản hồi theo định dạng OpenAI.

## Bắt đầu

<Steps>
  <Step title="Cài đặt proxy">
    Yêu cầu Node.js 20+ và Claude Code CLI đã được xác thực.

    ```bash
    npm install -g claude-max-api-proxy

    # Xác minh Claude CLI đã được xác thực
    claude --version
    claude auth login   # nếu chưa được xác thực
    ```

  </Step>
  <Step title="Khởi động máy chủ">
    ```bash
    claude-max-api
    # Máy chủ chạy tại http://localhost:3456
    ```
  </Step>
  <Step title="Kiểm thử proxy">
    ```bash
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Cấu hình OpenClaw">
    Trỏ OpenClaw đến proxy dưới dạng điểm cuối tùy chỉnh tương thích với OpenAI:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

<Note>
Các mã mô hình bên dưới thuộc danh mục riêng của proxy, không phải tham chiếu
mô hình Anthropic của OpenClaw. Mỗi mã ánh xạ đến một bí danh mô hình của Claude Code CLI (`opus`, `sonnet`,
`haiku`), vì vậy mô hình nền tảng sẽ thay đổi mỗi khi Anthropic cập nhật
bí danh đó trong CLI. Hãy kiểm tra README hiện tại của proxy trước khi dựa vào một
ánh xạ cụ thể.
</Note>

| Mã mô hình         | Bí danh CLI | Ánh xạ hiện tại |
| ----------------- | --------- | --------------- |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Ghi chú về khả năng tương thích với OpenAI theo kiểu proxy">
    Phương thức này sử dụng tuyến `/v1` tùy chỉnh tương thích với OpenAI dùng chung của OpenClaw, cùng
    đường dẫn như mọi hệ thống phụ trợ tương thích với OpenAI tự lưu trữ khác:

    - Không áp dụng việc định hình yêu cầu chỉ dành riêng cho OpenAI gốc.
    - `/fast` và `service_tier` chỉ áp dụng cho lưu lượng truy cập trực tiếp đến `api.anthropic.com`;
      các tuyến proxy giữ nguyên `service_tier` (xem
      [chế độ nhanh của nhà cung cấp Anthropic](/vi/providers/anthropic#advanced-configuration)).
    - Không định hình tải trọng cho Responses `store`, gợi ý bộ nhớ đệm lời nhắc hoặc khả năng tương thích
      suy luận của OpenAI.
    - Các tiêu đề ghi nhận nguồn OpenAI/Codex của OpenClaw (`originator`, `version`,
      `User-Agent`) chỉ được gửi trên lưu lượng OAuth gốc đến `api.openai.com`, không
      được gửi đến các đích `OPENAI_BASE_URL` tùy chỉnh như proxy này.

  </Accordion>

  <Accordion title="Tự động khởi động trên macOS bằng LaunchAgent">
    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Ghi chú

- Kế thừa cơ chế thanh toán, tín dụng sử dụng và giới hạn tốc độ của `claude -p` trong Claude Code.
- Chỉ liên kết với `127.0.0.1`; không gửi dữ liệu đến bất kỳ máy chủ bên thứ ba nào ngoài lệnh gọi của chính CLI đến Anthropic.
- Hỗ trợ phản hồi truyền phát.
- Lỗi xác thực không được kiểm tra khi khởi động và chỉ xuất hiện khi một yêu cầu trò chuyện thực sự chạy; nếu CLI chưa được xác thực, yêu cầu đầu tiên sẽ thất bại thay vì máy chủ từ chối khởi động.

<Note>
Để tích hợp Anthropic gốc bằng Claude CLI hoặc khóa API, hãy xem [nhà cung cấp Anthropic](/vi/providers/anthropic). Đối với các gói đăng ký OpenAI/Codex, hãy xem [nhà cung cấp OpenAI](/vi/providers/openai).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp Anthropic" href="/vi/providers/anthropic" icon="bolt">
    Tích hợp OpenClaw gốc với Claude CLI hoặc khóa API.
  </Card>
  <Card title="Nhà cung cấp OpenAI" href="/vi/providers/openai" icon="robot">
    Dành cho các gói đăng ký OpenAI/Codex.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ.
  </Card>
</CardGroup>
