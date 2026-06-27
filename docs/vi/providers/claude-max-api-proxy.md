---
read_when:
    - Bạn muốn sử dụng gói đăng ký Claude Max với các công cụ tương thích với OpenAI
    - Bạn muốn có một máy chủ API cục bộ đóng vai trò lớp bọc cho Claude Code CLI
    - Bạn muốn đánh giá quyền truy cập Anthropic dựa trên gói đăng ký so với dựa trên khóa API
summary: Proxy cộng đồng để cung cấp thông tin đăng nhập gói đăng ký Claude dưới dạng một endpoint tương thích với OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-06-27T18:02:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** là một công cụ cộng đồng cung cấp đăng ký Claude Max/Pro của bạn dưới dạng endpoint API tương thích với OpenAI. Điều này cho phép bạn dùng đăng ký của mình với bất kỳ công cụ nào hỗ trợ định dạng OpenAI API.

<Warning>
Đường dẫn này chỉ dành cho khả năng tương thích kỹ thuật. Trước đây Anthropic đã chặn một số cách dùng đăng ký bên ngoài Claude Code. Bạn phải tự quyết định có dùng nó hay không và xác minh các quy tắc tính phí hiện tại của Anthropic trước khi dựa vào nó.

Tài liệu hỗ trợ hiện tại của Anthropic nói rằng `claude -p` là cách dùng Agent SDK/lập trình. Từ ngày 15 tháng 6 năm 2026, cách dùng `claude -p` theo gói đăng ký sẽ dùng khoản tín dụng Agent SDK hằng tháng riêng trước, sau đó dùng tín dụng sử dụng theo mức giá API tiêu chuẩn nếu tín dụng sử dụng được bật.
</Warning>

## Tại sao dùng cách này?

| Cách tiếp cận             | Lộ trình chi phí                                | Phù hợp nhất cho                            |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | Trả theo token qua Claude Console hoặc đám mây  | Ứng dụng production, tự động hóa dùng chung, khối lượng lớn |
| Proxy đăng ký Claude      | Quy tắc gói và tín dụng của Claude Code / `claude -p` | Thử nghiệm cá nhân với các công cụ tương thích |

Nếu bạn có đăng ký Claude Max hoặc Pro và muốn dùng đăng ký đó với các công cụ tương thích với OpenAI, proxy này có thể phù hợp với một số quy trình làm việc cá nhân. Đây không phải là đường dẫn giá cố định không giới hạn. API key vẫn là đường dẫn chính sách và tính phí rõ ràng hơn cho mục đích production.

## Cách hoạt động

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Proxy:

1. Chấp nhận yêu cầu định dạng OpenAI tại `http://localhost:3456/v1/chat/completions`
2. Chuyển đổi chúng thành lệnh Claude Code CLI
3. Trả về phản hồi ở định dạng OpenAI (có hỗ trợ streaming)

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
    Trỏ OpenClaw tới proxy dưới dạng endpoint tùy chỉnh tương thích với OpenAI:

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

## Catalog tích hợp sẵn

| ID mô hình        | Ánh xạ tới      |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Ghi chú tương thích OpenAI kiểu proxy">
    Đường dẫn này dùng cùng tuyến tương thích OpenAI kiểu proxy như các backend `/v1` tùy chỉnh khác:

    - Không áp dụng định hình yêu cầu chỉ dành riêng cho OpenAI gốc
    - Không có `service_tier`, không có Responses `store`, không có gợi ý prompt-cache, và không có định hình payload tương thích suy luận của OpenAI
    - Các header ghi nhận nguồn ẩn của OpenClaw (`originator`, `version`, `User-Agent`) không được chèn vào URL proxy

  </Accordion>

  <Accordion title="Tự động khởi động trên macOS bằng LaunchAgent">
    Tạo LaunchAgent để tự động chạy proxy:

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
- Yêu cầu đăng ký Claude Max/Pro đang hoạt động với Claude Code CLI đã xác thực
- Kế thừa hành vi tính phí, tín dụng sử dụng và giới hạn tốc độ của Claude Code `claude -p`
- Proxy chạy cục bộ và không gửi dữ liệu tới bất kỳ máy chủ bên thứ ba nào
- Phản hồi streaming được hỗ trợ đầy đủ

<Note>
Để tích hợp Anthropic gốc với Claude CLI hoặc API key, xem [nhà cung cấp Anthropic](/vi/providers/anthropic). Với đăng ký OpenAI/Codex, xem [nhà cung cấp OpenAI](/vi/providers/openai).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp Anthropic" href="/vi/providers/anthropic" icon="bolt">
    Tích hợp OpenClaw gốc với Claude CLI hoặc API key.
  </Card>
  <Card title="Nhà cung cấp OpenAI" href="/vi/providers/openai" icon="robot">
    Dành cho đăng ký OpenAI/Codex.
  </Card>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ.
  </Card>
</CardGroup>
