---
read_when:
    - Bạn muốn sử dụng gói đăng ký Claude Max với các công cụ tương thích với OpenAI
    - Bạn muốn một máy chủ API cục bộ bao bọc Claude Code CLI
    - Bạn muốn đánh giá quyền truy cập Anthropic theo hình thức đăng ký so với theo khóa API
summary: Proxy cộng đồng để cung cấp thông tin xác thực đăng ký Claude dưới dạng điểm cuối tương thích với OpenAI
title: Máy chủ trung gian API Claude Max
x-i18n:
    generated_at: "2026-04-29T23:05:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** là một công cụ cộng đồng cung cấp gói đăng ký Claude Max/Pro của bạn dưới dạng điểm cuối API tương thích với OpenAI. Điều này cho phép bạn dùng gói đăng ký của mình với bất kỳ công cụ nào hỗ trợ định dạng OpenAI API.

<Warning>
Luồng này chỉ dành cho khả năng tương thích kỹ thuật. Trước đây Anthropic đã chặn một số cách dùng gói đăng ký
bên ngoài Claude Code. Bạn phải tự quyết định có sử dụng
nó hay không và xác minh các điều khoản hiện tại của Anthropic trước khi dựa vào nó.
</Warning>

## Vì sao dùng cách này?

| Cách tiếp cận           | Chi phí                                             | Phù hợp nhất cho                          |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API           | Trả theo token (~$15/M đầu vào, $75/M đầu ra cho Opus) | Ứng dụng production, lưu lượng cao         |
| Gói đăng ký Claude Max  | Cố định $200/tháng                                  | Sử dụng cá nhân, phát triển, sử dụng không giới hạn |

Nếu bạn có gói đăng ký Claude Max và muốn dùng nó với các công cụ tương thích với OpenAI, proxy này có thể giảm chi phí cho một số quy trình làm việc. API key vẫn là hướng chính sách rõ ràng hơn cho mục đích production.

## Cách hoạt động

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

Proxy:

1. Chấp nhận yêu cầu theo định dạng OpenAI tại `http://localhost:3456/v1/chat/completions`
2. Chuyển chúng thành các lệnh Claude Code CLI
3. Trả về phản hồi ở định dạng OpenAI (hỗ trợ streaming)

## Bắt đầu

<Steps>
  <Step title="Install the proxy">
    Yêu cầu Node.js 20+ và Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Start the server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Test the proxy">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configure OpenClaw">
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

## Danh mục tích hợp sẵn

| ID mô hình        | Ánh xạ tới      |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    Luồng này dùng cùng tuyến tương thích với OpenAI theo kiểu proxy như các backend
    `/v1` tùy chỉnh khác:

    - Không áp dụng định hình yêu cầu chỉ dành riêng cho OpenAI gốc
    - Không có `service_tier`, không có Responses `store`, không có gợi ý prompt-cache, và không có
      định hình payload tương thích reasoning của OpenAI
    - Các header ghi nhận ẩn của OpenClaw (`originator`, `version`, `User-Agent`)
      không được chèn vào URL proxy

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    Tạo LaunchAgent để chạy proxy tự động:

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

## Liên kết

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Vấn đề:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Ghi chú

- Đây là một **công cụ cộng đồng**, không được Anthropic hoặc OpenClaw hỗ trợ chính thức
- Yêu cầu gói đăng ký Claude Max/Pro đang hoạt động và Claude Code CLI đã xác thực
- Proxy chạy cục bộ và không gửi dữ liệu đến bất kỳ máy chủ bên thứ ba nào
- Phản hồi streaming được hỗ trợ đầy đủ

<Note>
Để tích hợp Anthropic gốc với Claude CLI hoặc API key, xem [Nhà cung cấp Anthropic](/vi/providers/anthropic). Đối với gói đăng ký OpenAI/Codex, xem [Nhà cung cấp OpenAI](/vi/providers/openai).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/vi/providers/anthropic" icon="bolt">
    Tích hợp OpenClaw gốc với Claude CLI hoặc API key.
  </Card>
  <Card title="OpenAI provider" href="/vi/providers/openai" icon="robot">
    Dành cho gói đăng ký OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Configuration" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ.
  </Card>
</CardGroup>
