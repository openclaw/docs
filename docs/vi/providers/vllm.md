---
read_when:
    - Bạn muốn chạy OpenClaw với một máy chủ vLLM cục bộ
    - Bạn muốn các điểm cuối /v1 tương thích với OpenAI cho các mô hình của riêng bạn
summary: Chạy OpenClaw với vLLM (máy chủ cục bộ tương thích với OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:33:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM có thể phục vụ các mô hình mã nguồn mở (và một số mô hình tùy chỉnh) qua API HTTP **tương thích OpenAI**. OpenClaw kết nối với vLLM bằng API `openai-completions`.

OpenClaw cũng có thể **tự động phát hiện** các mô hình có sẵn từ vLLM khi bạn chọn tham gia bằng `VLLM_API_KEY` (giá trị bất kỳ đều dùng được nếu máy chủ của bạn không bắt buộc xác thực). Dùng `vllm/*` trong `agents.defaults.models` để giữ khả năng phát hiện động khi bạn cũng cấu hình URL cơ sở vLLM tùy chỉnh.

OpenClaw xem `vllm` là nhà cung cấp cục bộ tương thích OpenAI hỗ trợ
tính toán mức dùng theo luồng, nên số lượng token trạng thái/ngữ cảnh có thể cập nhật từ
phản hồi `stream_options.include_usage`.

| Thuộc tính       | Giá trị                                  |
| ---------------- | ---------------------------------------- |
| ID nhà cung cấp  | `vllm`                                   |
| API              | `openai-completions` (tương thích OpenAI) |
| Xác thực         | biến môi trường `VLLM_API_KEY`           |
| URL cơ sở mặc định | `http://127.0.0.1:8000/v1`             |

## Bắt đầu

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    URL cơ sở của bạn nên cung cấp các endpoint `/v1` (ví dụ: `/v1/models`, `/v1/chat/completions`). vLLM thường chạy tại:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Giá trị bất kỳ đều dùng được nếu máy chủ của bạn không bắt buộc xác thực:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    Thay bằng một trong các ID mô hình vLLM của bạn:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Phát hiện mô hình (nhà cung cấp ngầm định)

Khi `VLLM_API_KEY` được đặt (hoặc có hồ sơ xác thực) và bạn **không** định nghĩa `models.providers.vllm`, OpenClaw truy vấn:

```
GET http://127.0.0.1:8000/v1/models
```

và chuyển đổi các ID được trả về thành mục mô hình.

<Note>
Nếu bạn đặt `models.providers.vllm` rõ ràng, theo mặc định OpenClaw dùng các mô hình bạn đã khai báo. Thêm `"vllm/*": {}` vào `agents.defaults.models` khi bạn muốn OpenClaw truy vấn endpoint `/models` của nhà cung cấp đã cấu hình đó và bao gồm tất cả mô hình vLLM được quảng bá.
</Note>

## Cấu hình rõ ràng (mô hình thủ công)

Dùng cấu hình rõ ràng khi:

- vLLM chạy trên máy chủ hoặc cổng khác
- Bạn muốn cố định giá trị `contextWindow` hoặc `maxTokens`
- Máy chủ của bạn yêu cầu khóa API thật (hoặc bạn muốn kiểm soát header)
- Bạn kết nối tới endpoint vLLM local loopback, LAN hoặc Tailscale đáng tin cậy

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Để giữ nhà cung cấp này ở trạng thái động mà không cần liệt kê thủ công từng mô hình, hãy thêm ký tự đại diện nhà cung cấp
vào danh mục mô hình hiển thị:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    vLLM được xem là backend `/v1` tương thích OpenAI kiểu proxy, không phải endpoint
    OpenAI gốc. Điều này có nghĩa là:

    | Hành vi | Được áp dụng? |
    |----------|----------|
    | Định dạng yêu cầu OpenAI gốc | Không |
    | `service_tier` | Không gửi |
    | Responses `store` | Không gửi |
    | Gợi ý prompt-cache | Không gửi |
    | Định dạng payload tương thích reasoning của OpenAI | Không áp dụng |
    | Header ghi nhận OpenClaw ẩn | Không chèn trên URL cơ sở tùy chỉnh |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Với các mô hình Qwen được phục vụ qua vLLM, hãy đặt
    `params.qwenThinkingFormat: "chat-template"` trên mục mô hình khi
    máy chủ mong đợi kwargs chat-template của Qwen. OpenClaw ánh xạ `/think off` thành:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Các mức suy nghĩ không phải `off` gửi `enable_thinking: true`. Nếu endpoint của bạn
    thay vào đó mong đợi cờ cấp cao nhất kiểu DashScope, hãy dùng
    `params.qwenThinkingFormat: "top-level"` để gửi `enable_thinking` tại gốc
    yêu cầu. `params.qwen_thinking_format` dạng snake-case cũng được chấp nhận.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 có thể dùng kwargs chat-template để kiểm soát việc reasoning được
    trả về dưới dạng reasoning ẩn hay văn bản câu trả lời hiển thị. Khi một phiên OpenClaw
    dùng `vllm/nemotron-3-*` với thinking tắt, Plugin vLLM đi kèm gửi:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Để tùy chỉnh các giá trị này, hãy đặt `chat_template_kwargs` trong tham số của mô hình.
    Nếu bạn cũng đặt `params.extra_body.chat_template_kwargs`, giá trị đó có
    độ ưu tiên cuối cùng vì `extra_body` là phần ghi đè body yêu cầu cuối cùng.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen tool calls appear as text">
    Trước tiên hãy đảm bảo vLLM đã được khởi động với trình phân tích tool-call và chat
    template đúng cho mô hình. Ví dụ, tài liệu vLLM nêu `hermes` cho các mô hình Qwen2.5
    và `qwen3_xml` cho các mô hình Qwen3-Coder.

    Triệu chứng:

    - skills hoặc công cụ không bao giờ chạy
    - trợ lý in JSON/XML thô như `{"name":"read","arguments":...}`
    - vLLM trả về mảng `tool_calls` rỗng khi OpenClaw gửi
      `tool_choice: "auto"`

    Một số tổ hợp Qwen/vLLM chỉ trả về lệnh gọi công cụ có cấu trúc khi
    yêu cầu dùng `tool_choice: "required"`. Với các mục mô hình đó, hãy buộc
    trường yêu cầu tương thích OpenAI bằng `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Thay `Qwen-Qwen2.5-Coder-32B-Instruct` bằng id chính xác được trả về bởi:

    ```bash
    openclaw models list --provider vllm
    ```

    Bạn có thể áp dụng cùng phần ghi đè từ CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Đây là giải pháp tương thích cần chọn tham gia. Nó khiến mọi lượt mô hình có
    công cụ đều yêu cầu một lệnh gọi công cụ, vì vậy chỉ dùng cho một mục mô hình cục bộ chuyên dụng
    khi hành vi đó chấp nhận được. Không dùng nó làm mặc định toàn cục cho tất cả
    mô hình vLLM, và không dùng proxy mù quáng chuyển đổi văn bản trợ lý tùy ý
    thành lệnh gọi công cụ có thể thực thi.

  </Accordion>

  <Accordion title="Custom base URL">
    Nếu máy chủ vLLM của bạn chạy trên máy chủ hoặc cổng không mặc định, hãy đặt `baseUrl` trong cấu hình nhà cung cấp rõ ràng:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Slow first response or remote server timeout">
    Với các mô hình cục bộ lớn, máy chủ LAN từ xa hoặc liên kết tailnet, hãy đặt
    thời gian chờ yêu cầu theo phạm vi nhà cung cấp:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` chỉ áp dụng cho các yêu cầu HTTP mô hình vLLM, bao gồm
    thiết lập kết nối, header phản hồi, truyền body theo luồng và tổng thời gian
    hủy guarded-fetch. Nên dùng tùy chọn này trước khi tăng
    `agents.defaults.timeoutSeconds`, vốn kiểm soát toàn bộ lượt chạy của agent.

  </Accordion>

  <Accordion title="Server not reachable">
    Kiểm tra xem máy chủ vLLM có đang chạy và truy cập được không:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Nếu bạn thấy lỗi kết nối, hãy xác minh máy chủ, cổng và việc vLLM đã được khởi động với chế độ máy chủ tương thích OpenAI.
    Với các endpoint local loopback, LAN hoặc Tailscale rõ ràng, cũng đặt
    `models.providers.vllm.request.allowPrivateNetwork: true`; yêu cầu của nhà cung cấp
    chặn URL mạng riêng theo mặc định trừ khi nhà cung cấp được tin cậy rõ ràng.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Nếu yêu cầu thất bại với lỗi xác thực, hãy đặt `VLLM_API_KEY` thật khớp với cấu hình máy chủ của bạn, hoặc cấu hình nhà cung cấp rõ ràng trong `models.providers.vllm`.

    <Tip>
    Nếu máy chủ vLLM của bạn không bắt buộc xác thực, bất kỳ giá trị không rỗng nào cho `VLLM_API_KEY` cũng hoạt động như tín hiệu chọn tham gia cho OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    Tự động phát hiện yêu cầu phải đặt `VLLM_API_KEY`. Nếu bạn đã định nghĩa `models.providers.vllm`, OpenClaw chỉ dùng các mô hình bạn đã khai báo trừ khi `agents.defaults.models` bao gồm `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Nếu mô hình Qwen in cú pháp công cụ JSON/XML thay vì thực thi một skill,
    hãy xem hướng dẫn Qwen trong phần Cấu hình nâng cao ở trên. Cách sửa thường dùng là:

    - khởi động vLLM với trình phân tích/template đúng cho mô hình đó
    - xác nhận id mô hình chính xác bằng `openclaw models list --provider vllm`
    - thêm phần ghi đè `params.extra_body.tool_choice: "required"` riêng cho từng mô hình
      chỉ khi `tool_choice: "auto"` vẫn trả về lệnh gọi công cụ rỗng hoặc chỉ dạng văn bản

  </Accordion>
</AccordionGroup>

<Warning>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="OpenAI" href="/vi/providers/openai" icon="bolt">
    Nhà cung cấp OpenAI gốc và hành vi tuyến tương thích OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin đăng nhập.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Các vấn đề thường gặp và cách giải quyết.
  </Card>
</CardGroup>
