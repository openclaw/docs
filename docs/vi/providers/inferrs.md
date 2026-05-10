---
read_when:
    - Bạn muốn chạy OpenClaw với một máy chủ inferrs cục bộ
    - Bạn đang phục vụ Gemma hoặc một mô hình khác thông qua inferrs
    - Bạn cần các cờ tương thích OpenClaw chính xác cho inferrs
summary: Chạy OpenClaw thông qua inferrs (máy chủ cục bộ tương thích với OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-05-10T19:48:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) có thể phục vụ các mô hình cục bộ phía sau API `/v1` tương thích với OpenAI. OpenClaw hoạt động với `inferrs` thông qua đường dẫn `openai-completions` chung.

| Thuộc tính          | Giá trị                                                             |
| ------------------- | ------------------------------------------------------------------- |
| ID nhà cung cấp     | `inferrs` (tùy chỉnh; cấu hình trong `models.providers.inferrs`)    |
| Plugin              | không có — `inferrs` không phải Plugin nhà cung cấp đi kèm OpenClaw |
| Biến môi trường xác thực | Tùy chọn. Giá trị nào cũng hoạt động nếu máy chủ inferrs của bạn không có xác thực |
| API                 | tương thích với OpenAI (`openai-completions`)                       |
| URL cơ sở đề xuất   | `http://127.0.0.1:8080/v1` (hoặc nơi máy chủ inferrs của bạn chạy) |

<Note>
  `inferrs` hiện nên được xem là backend tự lưu trữ tùy chỉnh tương thích với OpenAI, không phải Plugin nhà cung cấp OpenClaw chuyên dụng. Bạn cấu hình nó thông qua `models.providers.inferrs` thay vì một cờ lựa chọn thiết lập ban đầu. Nếu bạn cần một Plugin đi kèm thực sự có tự động phát hiện, hãy xem [SGLang](/vi/providers/sglang) hoặc [vLLM](/vi/providers/vllm).
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
  <Step title="Xác minh máy chủ có thể truy cập được">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Thêm mục nhà cung cấp OpenClaw">
    Thêm một mục nhà cung cấp tường minh và trỏ mô hình mặc định của bạn tới mục đó. Xem ví dụ cấu hình đầy đủ bên dưới.
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

## Khởi động theo yêu cầu

Inferrs cũng có thể được OpenClaw khởi động chỉ khi một mô hình `inferrs/...` được
chọn. Thêm `localService` vào cùng mục nhà cung cấp:

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

`command` phải là đường dẫn tuyệt đối. Dùng `which inferrs` trên máy chủ Gateway và đặt
đường dẫn đó vào cấu hình. Để xem tham chiếu đầy đủ về các trường, hãy xem
[Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Vì sao requiresStringContent quan trọng">
    Một số tuyến Chat Completions của `inferrs` chỉ chấp nhận
    `messages[].content` dạng chuỗi, không chấp nhận mảng phần nội dung có cấu trúc.

    <Warning>
    Nếu các lượt chạy OpenClaw thất bại với lỗi như:

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

    OpenClaw sẽ làm phẳng các phần nội dung văn bản thuần thành chuỗi đơn giản trước khi gửi
    yêu cầu.

  </Accordion>

  <Accordion title="Lưu ý về Gemma và lược đồ công cụ">
    Một số tổ hợp `inferrs` + Gemma hiện tại chấp nhận các yêu cầu
    `/v1/chat/completions` trực tiếp nhỏ nhưng vẫn thất bại trên các lượt
    agent-runtime đầy đủ của OpenClaw.

    Nếu điều đó xảy ra, hãy thử cách này trước:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Cách đó vô hiệu hóa bề mặt lược đồ công cụ của OpenClaw cho mô hình và có thể giảm áp lực prompt
    lên các backend cục bộ nghiêm ngặt hơn.

    Nếu các yêu cầu trực tiếp rất nhỏ vẫn hoạt động nhưng các lượt agent OpenClaw bình thường tiếp tục
    gặp sự cố bên trong `inferrs`, vấn đề còn lại thường là hành vi của mô hình/máy chủ
    upstream thay vì lớp truyền tải của OpenClaw.

  </Accordion>

  <Accordion title="Kiểm thử smoke thủ công">
    Sau khi cấu hình, hãy kiểm thử cả hai lớp:

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

    Nếu lệnh đầu tiên hoạt động nhưng lệnh thứ hai thất bại, hãy kiểm tra phần xử lý sự cố bên dưới.

  </Accordion>

  <Accordion title="Hành vi kiểu proxy">
    `inferrs` được xử lý như một backend `/v1` kiểu proxy tương thích với OpenAI, không phải một
    endpoint OpenAI gốc.

    - Định hình yêu cầu chỉ dành cho OpenAI gốc không áp dụng ở đây
    - Không có `service_tier`, không có Responses `store`, không có gợi ý prompt-cache, và không có
      định hình payload tương thích với reasoning của OpenAI
    - Các header quy thuộc OpenClaw ẩn (`originator`, `version`, `User-Agent`)
      không được chèn trên các URL cơ sở `inferrs` tùy chỉnh

  </Accordion>
</AccordionGroup>

## Xử lý sự cố

<AccordionGroup>
  <Accordion title="curl /v1/models thất bại">
    `inferrs` không chạy, không thể truy cập, hoặc không được bind vào
    host/port mong đợi. Hãy đảm bảo máy chủ đã được khởi động và đang lắng nghe tại địa chỉ bạn
    đã cấu hình.
  </Accordion>

  <Accordion title="messages[].content mong đợi một chuỗi">
    Đặt `compat.requiresStringContent: true` trong mục mô hình. Xem phần
    `requiresStringContent` ở trên để biết chi tiết.
  </Accordion>

  <Accordion title="Các lệnh gọi /v1/chat/completions trực tiếp thành công nhưng openclaw infer model run thất bại">
    Hãy thử đặt `compat.supportsTools: false` để vô hiệu hóa bề mặt lược đồ công cụ.
    Xem lưu ý về lược đồ công cụ của Gemma ở trên.
  </Accordion>

  <Accordion title="inferrs vẫn gặp sự cố trên các lượt agent lớn hơn">
    Nếu OpenClaw không còn gặp lỗi lược đồ nhưng `inferrs` vẫn gặp sự cố trên các lượt
    agent lớn hơn, hãy xem đó là giới hạn upstream của `inferrs` hoặc của mô hình. Giảm
    áp lực prompt hoặc chuyển sang một backend hay mô hình cục bộ khác.
  </Accordion>
</AccordionGroup>

<Tip>
Để được trợ giúp chung, hãy xem [Xử lý sự cố](/vi/help/troubleshooting) và [FAQ](/vi/help/faq).
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Mô hình cục bộ" href="/vi/gateway/local-models" icon="server">
    Chạy OpenClaw với các máy chủ mô hình cục bộ.
  </Card>
  <Card title="Dịch vụ mô hình cục bộ" href="/vi/gateway/local-model-services" icon="play">
    Khởi động máy chủ mô hình cục bộ theo yêu cầu cho các nhà cung cấp đã cấu hình.
  </Card>
  <Card title="Xử lý sự cố Gateway" href="/vi/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Gỡ lỗi các backend cục bộ tương thích với OpenAI vượt qua probe nhưng thất bại khi chạy agent.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
