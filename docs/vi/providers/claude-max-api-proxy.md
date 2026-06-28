---
read_when:
    - Bạn muốn sử dụng gói đăng ký Claude Max với các công cụ tương thích với OpenAI
    - Bạn muốn một máy chủ API cục bộ đóng vai trò lớp bọc cho Claude Code CLI
    - Bạn muốn đánh giá quyền truy cập Anthropic dựa trên gói đăng ký so với dựa trên khóa API
summary: Proxy cộng đồng để cung cấp thông tin xác thực đăng ký Claude dưới dạng endpoint tương thích với OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-06-28T20:44:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** là một công cụ cộng đồng cung cấp subscription Claude Max/Pro của bạn dưới dạng endpoint API tương thích với OpenAI. Điều này cho phép bạn dùng subscription của mình với bất kỳ công cụ nào hỗ trợ định dạng API OpenAI.

<Warning>
Đường dẫn này chỉ dành cho khả năng tương thích kỹ thuật. Anthropic từng chặn một số cách sử dụng subscription
bên ngoài Claude Code trong quá khứ. Bạn phải tự quyết định có dùng
nó hay không và xác minh các quy tắc tính phí hiện tại của Anthropic trước khi dựa vào nó.

Tài liệu hỗ trợ hiện tại của Anthropic nói rằng `claude -p` là cách sử dụng Agent SDK/lập trình.
Bản cập nhật hỗ trợ ngày 15 tháng 6 năm 2026 của Anthropic đã tạm dừng kế hoạch credit Agent SDK
riêng đã công bố. Hiện tại, Claude Agent SDK, `claude -p`, và việc sử dụng ứng dụng bên thứ ba
vẫn lấy từ giới hạn sử dụng của subscription đã đăng nhập.

Trước khi dựa vào đường dẫn này, hãy kiểm tra [bài viết về gói Agent SDK
của Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
cùng với các bài viết hỗ trợ Claude Code cho tài khoản
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
hoặc
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## Vì sao dùng cách này?

| Cách tiếp cận             | Tuyến chi phí                                    | Phù hợp nhất cho                          |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | Trả tiền theo token qua Claude Console hoặc cloud | Ứng dụng production, tự động hóa dùng chung, lưu lượng lớn |
| Proxy subscription Claude | Quy tắc gói và credit của Claude Code / `claude -p` | Thử nghiệm cá nhân với công cụ tương thích |

Nếu bạn có subscription Claude Max hoặc Pro và muốn dùng nó với
các công cụ tương thích với OpenAI, proxy này có thể phù hợp với một số quy trình cá nhân. Đây không phải là
đường dẫn giá cố định không giới hạn. API key vẫn là đường dẫn chính sách và tính phí rõ ràng hơn cho
mục đích production.

## Cách hoạt động

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Proxy:

1. Chấp nhận yêu cầu theo định dạng OpenAI tại `http://localhost:3456/v1/chat/completions`
2. Chuyển đổi chúng thành lệnh Claude Code CLI
3. Trả về phản hồi theo định dạng OpenAI (hỗ trợ streaming)

## Bắt đầu

<Steps>
  <Step title="Cài đặt proxy">
    Yêu cầu Node.js 22+ và Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Khởi động máy chủ">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Kiểm thử proxy">
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
  <Step title="Cấu hình OpenClaw">
    Trỏ OpenClaw đến proxy như một endpoint tùy chỉnh tương thích với OpenAI:

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

## Catalog tích hợp

| ID model          | Ánh xạ tới      |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Ghi chú về kiểu proxy tương thích với OpenAI">
    Đường dẫn này dùng cùng tuyến kiểu proxy tương thích với OpenAI như các backend tùy chỉnh
    `/v1` khác:

    - Không áp dụng việc định hình yêu cầu chỉ dành riêng cho OpenAI gốc
    - Không có `service_tier`, không có Responses `store`, không có gợi ý prompt-cache, và không có
      định hình payload tương thích với reasoning của OpenAI
    - Các header ghi nhận nguồn ẩn của OpenClaw (`originator`, `version`, `User-Agent`)
      không được chèn vào URL proxy

  </Accordion>

  <Accordion title="Tự động khởi động trên macOS bằng LaunchAgent">
    Tạo một LaunchAgent để tự động chạy proxy:

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

- Đây là **công cụ cộng đồng**, không được Anthropic hoặc OpenClaw hỗ trợ chính thức
- Yêu cầu subscription Claude Max/Pro đang hoạt động với Claude Code CLI đã xác thực
- Kế thừa hành vi tính phí, usage-credit và rate-limit của Claude Code `claude -p`
- Proxy chạy cục bộ và không gửi dữ liệu đến bất kỳ máy chủ bên thứ ba nào
- Hỗ trợ đầy đủ phản hồi streaming

<Note>
Để tích hợp Anthropic gốc bằng Claude CLI hoặc API key, xem [Anthropic provider](/vi/providers/anthropic). Đối với subscription OpenAI/Codex, xem [OpenAI provider](/vi/providers/openai).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/vi/providers/anthropic" icon="bolt">
    Tích hợp OpenClaw gốc với Claude CLI hoặc API key.
  </Card>
  <Card title="OpenAI provider" href="/vi/providers/openai" icon="robot">
    Dành cho subscription OpenAI/Codex.
  </Card>
  <Card title="Chọn model" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả provider, model ref và hành vi failover.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tham chiếu cấu hình đầy đủ.
  </Card>
</CardGroup>
