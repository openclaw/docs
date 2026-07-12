---
read_when:
    - Bạn muốn chạy OpenClaw với máy chủ inferrs cục bộ
    - Bạn đang cung cấp Gemma hoặc một mô hình khác thông qua inferrs
    - Bạn cần các cờ tương thích OpenClaw chính xác cho inferrs
summary: Chạy OpenClaw thông qua inferrs (máy chủ cục bộ tương thích với OpenAI)
title: Suy luận
x-i18n:
    generated_at: "2026-07-12T08:16:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) phục vụ các mô hình cục bộ thông qua API `/v1` tương thích với OpenAI. OpenClaw giao tiếp với nó qua bộ điều hợp `openai-completions` dùng chung.

| Thuộc tính          | Giá trị                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| ID nhà cung cấp     | `inferrs` (tùy chỉnh; cấu hình trong `models.providers.inferrs`)        |
| Plugin              | không có — không phải Plugin nhà cung cấp đi kèm OpenClaw                |
| Biến môi trường xác thực | không bắt buộc; giá trị bất kỳ đều dùng được nếu máy chủ inferrs của bạn không có xác thực |
| API                 | tương thích với OpenAI (`openai-completions`)                            |
| URL cơ sở đề xuất   | `http://127.0.0.1:8080/v1` (hoặc địa chỉ mà máy chủ inferrs của bạn lắng nghe) |

<Note>
  `inferrs` là một phần phụ trợ tương thích với OpenAI, tự lưu trữ và tùy chỉnh, không phải Plugin nhà cung cấp chuyên biệt của OpenClaw: bạn cấu hình nó trong `models.providers.inferrs` thay vì chọn một tùy chọn xác thực trong quy trình thiết lập ban đầu. Để sử dụng Plugin đi kèm có tính năng tự động phát hiện, hãy xem [SGLang](/vi/providers/sglang) hoặc [vLLM](/vi/providers/vllm).
</Note>

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
  <Step title="Xác minh có thể truy cập máy chủ">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Thêm mục nhà cung cấp OpenClaw">
    Thêm một mục nhà cung cấp rõ ràng và trỏ mô hình mặc định của bạn đến mục đó. Xem ví dụ cấu hình bên dưới.
  </Step>
</Steps>

## Ví dụ cấu hình đầy đủ

Gemma 4 trên máy chủ `inferrs` cục bộ:

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

## Khởi động theo nhu cầu

OpenClaw chỉ có thể tự khởi động `inferrs` khi một mô hình `inferrs/...` được chọn. Thêm `localService` vào cùng mục nhà cung cấp:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
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

`command` phải là một đường dẫn tuyệt đối. Chạy `which inferrs` trên máy chủ Gateway và sử dụng đường dẫn đó. Tài liệu tham khảo đầy đủ về các trường: [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Vì sao requiresStringContent quan trọng">
    Một số tuyến Chat Completions của `inferrs` chỉ chấp nhận `messages[].content` dạng chuỗi, không chấp nhận mảng các phần nội dung có cấu trúc.

    <Warning>
    Nếu các lượt chạy OpenClaw thất bại với lỗi:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    hãy đặt `compat.requiresStringContent: true` trong mục mô hình. Khi đó, OpenClaw sẽ chuyển các phần nội dung chỉ chứa văn bản thành chuỗi thuần trước khi gửi yêu cầu.
    </Warning>

  </Accordion>

  <Accordion title="Lưu ý về Gemma và lược đồ công cụ">
    Một số tổ hợp `inferrs` + Gemma chấp nhận các yêu cầu trực tiếp nhỏ đến `/v1/chat/completions` nhưng thất bại ở các lượt chạy đầy đủ của môi trường thực thi tác nhân OpenClaw. Trước tiên, hãy thử tắt bề mặt lược đồ công cụ:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Cách này làm giảm áp lực lời nhắc lên các phần phụ trợ cục bộ nghiêm ngặt hơn. Nếu các yêu cầu trực tiếp rất nhỏ vẫn hoạt động nhưng các lượt tác nhân OpenClaw thông thường tiếp tục làm `inferrs` gặp sự cố, hãy xem đây là giới hạn của mô hình hoặc máy chủ thượng nguồn thay vì sự cố truyền tải của OpenClaw.

  </Accordion>

  <Accordion title="Kiểm thử nhanh thủ công">
    Kiểm thử cả hai lớp sau khi cấu hình:

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

    Nếu lệnh đầu tiên hoạt động nhưng lệnh thứ hai thất bại, hãy xem phần Khắc phục sự cố bên dưới.

  </Accordion>

  <Accordion title="Hành vi kiểu proxy">
    Vì `inferrs` sử dụng bộ điều hợp `openai-completions` dùng chung (không phải `openai-responses`), định dạng yêu cầu chỉ dành riêng cho OpenAI gốc sẽ không bao giờ được áp dụng: không gửi `service_tier`, không gửi `store` của Responses, không gửi gợi ý bộ nhớ đệm lời nhắc và không gửi định dạng tải trọng tương thích suy luận của OpenAI.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="curl /v1/models thất bại">
    `inferrs` chưa chạy, không thể truy cập hoặc không được liên kết với máy chủ/cổng mà bạn đã cấu hình. Hãy xác nhận máy chủ đã khởi động và đang lắng nghe tại địa chỉ đó.
  </Accordion>

  <Accordion title="messages[].content yêu cầu một chuỗi">
    Đặt `compat.requiresStringContent: true` trong mục mô hình (xem bên trên).
  </Accordion>

  <Accordion title="Các lệnh gọi trực tiếp /v1/chat/completions thành công nhưng openclaw infer model run thất bại">
    Đặt `compat.supportsTools: false` để tắt bề mặt lược đồ công cụ (xem lưu ý về Gemma bên trên).
  </Accordion>

  <Accordion title="inferrs vẫn gặp sự cố ở các lượt tác nhân lớn hơn">
    Nếu các lỗi lược đồ đã biến mất nhưng `inferrs` vẫn gặp sự cố ở các lượt tác nhân lớn hơn, hãy xem đây là giới hạn của `inferrs` hoặc mô hình thượng nguồn. Giảm áp lực lời nhắc hoặc chuyển sang phần phụ trợ/mô hình khác.
  </Accordion>
</AccordionGroup>

<Tip>
Để được trợ giúp chung, hãy xem [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Mô hình cục bộ" href="/vi/gateway/local-models" icon="server">
    Chạy OpenClaw với các máy chủ mô hình cục bộ.
  </Card>
  <Card title="Dịch vụ mô hình cục bộ" href="/vi/gateway/local-model-services" icon="play">
    Khởi động máy chủ mô hình cục bộ theo nhu cầu cho các nhà cung cấp đã cấu hình.
  </Card>
  <Card title="Khắc phục sự cố Gateway" href="/vi/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Gỡ lỗi các phần phụ trợ cục bộ tương thích với OpenAI vượt qua phép kiểm tra nhưng thất bại khi chạy tác nhân.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
