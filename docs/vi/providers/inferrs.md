---
read_when:
    - Bạn muốn chạy OpenClaw với một máy chủ inferrs cục bộ
    - Bạn đang cung cấp Gemma hoặc một mô hình khác thông qua inferrs
    - Bạn cần các cờ tương thích OpenClaw chính xác cho inferrs
summary: Chạy OpenClaw thông qua inferrs (máy chủ cục bộ tương thích với OpenAI)
title: Suy luận
x-i18n:
    generated_at: "2026-04-29T23:07:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) có thể phục vụ các mô hình cục bộ phía sau API `/v1` tương thích với OpenAI. OpenClaw hoạt động với `inferrs` thông qua đường dẫn `openai-completions` chung.

`inferrs` hiện nên được xem là backend tương thích với OpenAI tự lưu trữ tùy chỉnh, chứ không phải Plugin nhà cung cấp OpenClaw chuyên dụng.

## Bắt đầu

<Steps>
  <Step title="Khởi động inferrs với một mô hình">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Xác minh máy chủ có thể truy cập được">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Thêm một mục nhà cung cấp OpenClaw">
    Thêm một mục nhà cung cấp rõ ràng và trỏ mô hình mặc định của bạn đến mục đó. Xem ví dụ cấu hình đầy đủ bên dưới.
  </Step>
</Steps>

## Ví dụ cấu hình đầy đủ

Ví dụ này dùng Gemma 4 trên một máy chủ `inferrs` cục bộ.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Vì sao requiresStringContent quan trọng">
    Một số tuyến Chat Completions của `inferrs` chỉ chấp nhận
    `messages[].content` dạng chuỗi, không phải mảng phần nội dung có cấu trúc.

    <Warning>
    Nếu các lần chạy OpenClaw thất bại với lỗi như:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    hãy đặt `compat.requiresStringContent: true` trong mục mô hình của bạn.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw sẽ làm phẳng các phần nội dung thuần văn bản thành chuỗi thông thường trước khi gửi yêu cầu.

  </Accordion>

  <Accordion title="Lưu ý về Gemma và tool-schema">
    Một số kết hợp `inferrs` + Gemma hiện tại chấp nhận các yêu cầu
    `/v1/chat/completions` trực tiếp nhỏ nhưng vẫn thất bại trong các lượt
    agent-runtime đầy đủ của OpenClaw.

    Nếu điều đó xảy ra, trước tiên hãy thử:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Cấu hình đó tắt bề mặt lược đồ công cụ của OpenClaw cho mô hình và có thể giảm áp lực prompt lên các backend cục bộ nghiêm ngặt hơn.

    Nếu các yêu cầu trực tiếp rất nhỏ vẫn hoạt động nhưng các lượt agent OpenClaw thông thường tiếp tục
    sập bên trong `inferrs`, vấn đề còn lại thường là hành vi của mô hình/máy chủ upstream
    hơn là lớp truyền tải của OpenClaw.

  </Accordion>

  <Accordion title="Kiểm thử smoke thủ công">
    Sau khi cấu hình xong, hãy kiểm thử cả hai lớp:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Nếu lệnh đầu tiên hoạt động nhưng lệnh thứ hai thất bại, hãy kiểm tra phần khắc phục sự cố bên dưới.

  </Accordion>

  <Accordion title="Hành vi kiểu proxy">
    `inferrs` được xem là backend `/v1` tương thích với OpenAI theo kiểu proxy, không phải endpoint OpenAI gốc.

    - Định hình yêu cầu chỉ dành cho OpenAI gốc không áp dụng ở đây
    - Không có `service_tier`, không có Responses `store`, không có gợi ý prompt-cache, và không có định hình payload tương thích reasoning của OpenAI
    - Các header ghi công OpenClaw ẩn (`originator`, `version`, `User-Agent`) không được chèn vào các URL cơ sở `inferrs` tùy chỉnh

  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="curl /v1/models thất bại">
    `inferrs` không chạy, không thể truy cập, hoặc không được bind vào host/port mong đợi. Hãy bảo đảm máy chủ đã được khởi động và đang lắng nghe trên địa chỉ bạn đã cấu hình.
  </Accordion>

  <Accordion title="messages[].content mong đợi một chuỗi">
    Đặt `compat.requiresStringContent: true` trong mục mô hình. Xem phần
    `requiresStringContent` ở trên để biết chi tiết.
  </Accordion>

  <Accordion title="Các lệnh gọi /v1/chat/completions trực tiếp thành công nhưng openclaw infer model run thất bại">
    Thử đặt `compat.supportsTools: false` để tắt bề mặt lược đồ công cụ.
    Xem lưu ý về tool-schema của Gemma ở trên.
  </Accordion>

  <Accordion title="inferrs vẫn sập trên các lượt agent lớn hơn">
    Nếu OpenClaw không còn gặp lỗi lược đồ nhưng `inferrs` vẫn sập trên các lượt
    agent lớn hơn, hãy xem đây là giới hạn của `inferrs` upstream hoặc mô hình. Giảm
    áp lực prompt hoặc chuyển sang một backend cục bộ hoặc mô hình khác.
  </Accordion>
</AccordionGroup>

<Tip>
Để được trợ giúp chung, xem [Khắc phục sự cố](/vi/help/troubleshooting) và [FAQ](/vi/help/faq).
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Mô hình cục bộ" href="/vi/gateway/local-models" icon="server">
    Chạy OpenClaw với các máy chủ mô hình cục bộ.
  </Card>
  <Card title="Khắc phục sự cố Gateway" href="/vi/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Gỡ lỗi các backend cục bộ tương thích với OpenAI vượt qua probe nhưng thất bại khi chạy agent.
  </Card>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình, và hành vi failover.
  </Card>
</CardGroup>
