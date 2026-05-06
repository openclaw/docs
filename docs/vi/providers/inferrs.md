---
read_when:
    - Bạn muốn chạy OpenClaw với một máy chủ inferrs cục bộ
    - Bạn đang phục vụ Gemma hoặc một mô hình khác thông qua inferrs
    - Bạn cần các cờ tương thích OpenClaw chính xác cho inferrs
summary: Chạy OpenClaw thông qua inferrs (máy chủ cục bộ tương thích với OpenAI)
title: Suy luận
x-i18n:
    generated_at: "2026-05-06T09:27:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) có thể phục vụ các mô hình cục bộ phía sau API `/v1` tương thích với OpenAI. OpenClaw hoạt động với `inferrs` thông qua đường dẫn `openai-completions` chung.

| Thuộc tính         | Giá trị                                                            |
| ------------------ | ------------------------------------------------------------------ |
| ID nhà cung cấp    | `inferrs` (tùy chỉnh; cấu hình trong `models.providers.inferrs`)   |
| Plugin             | không có — `inferrs` không phải là Plugin nhà cung cấp được đóng gói kèm OpenClaw |
| Biến môi trường xác thực | Tùy chọn. Bất kỳ giá trị nào cũng hoạt động nếu máy chủ inferrs của bạn không có xác thực |
| API                | Tương thích với OpenAI (`openai-completions`)                      |
| URL cơ sở đề xuất  | `http://127.0.0.1:8080/v1` (hoặc nơi máy chủ inferrs của bạn đang chạy) |

<Note>
  Hiện tại, tốt nhất nên xem `inferrs` là một hậu tuyến tùy chỉnh, tự lưu trữ, tương thích với OpenAI, không phải một Plugin nhà cung cấp chuyên dụng của OpenClaw. Bạn cấu hình nó thông qua `models.providers.inferrs` thay vì một cờ lựa chọn khi thiết lập ban đầu. Nếu bạn cần một Plugin đóng gói kèm thực sự có khả năng tự động phát hiện, hãy xem [SGLang](/vi/providers/sglang) hoặc [vLLM](/vi/providers/vllm).
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
  <Step title="Thêm một mục nhà cung cấp OpenClaw">
    Thêm một mục nhà cung cấp rõ ràng và trỏ mô hình mặc định của bạn tới mục đó. Xem ví dụ cấu hình đầy đủ bên dưới.
  </Step>
</Steps>

## Ví dụ cấu hình đầy đủ

Ví dụ này sử dụng Gemma 4 trên một máy chủ `inferrs` cục bộ.

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

    OpenClaw sẽ làm phẳng các phần nội dung chỉ gồm văn bản thành chuỗi thuần trước khi gửi
    yêu cầu.

  </Accordion>

  <Accordion title="Lưu ý về Gemma và schema công cụ">
    Một số tổ hợp `inferrs` + Gemma hiện tại chấp nhận các yêu cầu
    `/v1/chat/completions` trực tiếp nhỏ nhưng vẫn thất bại trên các lượt đầy đủ của agent-runtime OpenClaw.

    Nếu điều đó xảy ra, hãy thử cách này trước:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Cách này tắt bề mặt schema công cụ của OpenClaw cho mô hình và có thể giảm áp lực prompt
    lên các hậu tuyến cục bộ nghiêm ngặt hơn.

    Nếu các yêu cầu trực tiếp rất nhỏ vẫn hoạt động nhưng các lượt agent OpenClaw bình thường tiếp tục
    gặp sự cố bên trong `inferrs`, vấn đề còn lại thường là hành vi của mô hình/máy chủ
    thượng nguồn chứ không phải tầng vận chuyển của OpenClaw.

  </Accordion>

  <Accordion title="Kiểm thử khói thủ công">
    Sau khi cấu hình, hãy kiểm thử cả hai tầng:

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

    Nếu lệnh đầu tiên hoạt động nhưng lệnh thứ hai thất bại, hãy xem phần khắc phục sự cố bên dưới.

  </Accordion>

  <Accordion title="Hành vi kiểu proxy">
    `inferrs` được xem là một hậu tuyến `/v1` kiểu proxy tương thích với OpenAI, không phải một
    điểm cuối OpenAI nguyên bản.

    - Định hình yêu cầu chỉ dành riêng cho OpenAI nguyên bản không áp dụng ở đây
    - Không có `service_tier`, không có Responses `store`, không có gợi ý bộ nhớ đệm prompt và không có
      định hình payload tương thích reasoning của OpenAI
    - Các header ghi nhận nguồn ẩn của OpenClaw (`originator`, `version`, `User-Agent`)
      không được chèn vào các URL cơ sở `inferrs` tùy chỉnh

  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="curl /v1/models thất bại">
    `inferrs` chưa chạy, không thể truy cập được hoặc không được bind tới
    host/port mong đợi. Hãy bảo đảm máy chủ đã được khởi động và đang lắng nghe trên địa chỉ bạn
    đã cấu hình.
  </Accordion>

  <Accordion title="messages[].content mong đợi một chuỗi">
    Đặt `compat.requiresStringContent: true` trong mục mô hình. Xem phần
    `requiresStringContent` ở trên để biết chi tiết.
  </Accordion>

  <Accordion title="Các lệnh gọi trực tiếp /v1/chat/completions thành công nhưng openclaw infer model run thất bại">
    Hãy thử đặt `compat.supportsTools: false` để tắt bề mặt schema công cụ.
    Xem lưu ý về schema công cụ Gemma ở trên.
  </Accordion>

  <Accordion title="inferrs vẫn gặp sự cố trên các lượt agent lớn hơn">
    Nếu OpenClaw không còn nhận lỗi schema nhưng `inferrs` vẫn gặp sự cố trên các lượt
    agent lớn hơn, hãy xem đó là một hạn chế thượng nguồn của `inferrs` hoặc mô hình. Giảm
    áp lực prompt hoặc chuyển sang một hậu tuyến hay mô hình cục bộ khác.
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
    Gỡ lỗi các hậu tuyến cục bộ tương thích với OpenAI vượt qua kiểm tra thăm dò nhưng thất bại khi chạy agent.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
