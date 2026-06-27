---
read_when:
    - Bạn muốn chạy OpenClaw với một máy chủ vLLM cục bộ
    - Bạn muốn các endpoint /v1 tương thích với OpenAI với các mô hình của riêng bạn
summary: Chạy OpenClaw với vLLM (máy chủ cục bộ tương thích OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:06:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM có thể phục vụ các mô hình mã nguồn mở (và một số mô hình tùy chỉnh) thông qua API HTTP **tương thích OpenAI**. OpenClaw kết nối với vLLM bằng API `openai-completions`.

OpenClaw cũng có thể **tự động phát hiện** các mô hình có sẵn từ vLLM khi bạn chọn bật bằng `VLLM_API_KEY` (giá trị bất kỳ đều dùng được nếu máy chủ của bạn không bắt buộc xác thực). Dùng `vllm/*` trong `agents.defaults.models` để giữ việc phát hiện luôn động khi bạn cũng cấu hình URL cơ sở vLLM tùy chỉnh.

OpenClaw xem `vllm` là một nhà cung cấp cục bộ tương thích OpenAI hỗ trợ
hạch toán mức sử dụng dạng truyền luồng, vì vậy số lượng token trạng thái/ngữ cảnh có thể cập nhật từ
phản hồi `stream_options.include_usage`.

| Thuộc tính       | Giá trị                                  |
| ---------------- | ---------------------------------------- |
| ID nhà cung cấp  | `vllm`                                   |
| API              | `openai-completions` (tương thích OpenAI) |
| Xác thực         | Biến môi trường `VLLM_API_KEY`           |
| URL cơ sở mặc định | `http://127.0.0.1:8000/v1`             |

## Bắt đầu

<Steps>
  <Step title="Khởi động vLLM với máy chủ tương thích OpenAI">
    URL cơ sở của bạn nên cung cấp các endpoint `/v1` (ví dụ: `/v1/models`, `/v1/chat/completions`). vLLM thường chạy tại:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Đặt biến môi trường khóa API">
    Giá trị bất kỳ đều dùng được nếu máy chủ của bạn không bắt buộc xác thực:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Chọn mô hình">
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
  <Step title="Xác minh mô hình có sẵn">
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
Nếu bạn đặt `models.providers.vllm` một cách tường minh, OpenClaw mặc định dùng các mô hình bạn đã khai báo. Thêm `"vllm/*": {}` vào `agents.defaults.models` khi bạn muốn OpenClaw truy vấn endpoint `/models` của nhà cung cấp đã cấu hình đó và bao gồm mọi mô hình vLLM được quảng bá.
</Note>

## Cấu hình tường minh (mô hình thủ công)

Dùng cấu hình tường minh khi:

- vLLM chạy trên host hoặc cổng khác
- Bạn muốn cố định các giá trị `contextWindow` hoặc `maxTokens`
- Máy chủ của bạn yêu cầu khóa API thật (hoặc bạn muốn kiểm soát header)
- Bạn kết nối tới endpoint vLLM local loopback, LAN, hoặc Tailscale đáng tin cậy

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
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

Để giữ nhà cung cấp này động mà không cần liệt kê thủ công từng mô hình, hãy thêm ký tự đại diện nhà cung cấp
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
  <Accordion title="Hành vi kiểu proxy">
    vLLM được xem là backend `/v1` tương thích OpenAI kiểu proxy, không phải endpoint
    OpenAI gốc. Điều này có nghĩa là:

    | Hành vi | Được áp dụng? |
    |----------|----------|
    | Định hình yêu cầu OpenAI gốc | Không |
    | `service_tier` | Không gửi |
    | Responses `store` | Không gửi |
    | Gợi ý prompt-cache | Không gửi |
    | Định hình payload tương thích reasoning của OpenAI | Không áp dụng |
    | Header quy thuộc OpenClaw ẩn | Không chèn trên URL cơ sở tùy chỉnh |

  </Accordion>

  <Accordion title="Điều khiển suy nghĩ Qwen">
    Với các mô hình Qwen được phục vụ qua vLLM, đặt
    `compat.thinkingFormat: "qwen-chat-template"` trên dòng mô hình của nhà cung cấp
    đã cấu hình khi máy chủ mong đợi kwargs chat-template của Qwen. Các mô hình
    được cấu hình theo cách này cung cấp hồ sơ `/think` nhị phân (`off`, `on`) vì
    suy nghĩ theo mẫu Qwen là một cờ yêu cầu bật/tắt, không phải thang mức nỗ lực
    kiểu OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw ánh xạ `/think off` thành:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Các mức suy nghĩ không phải `off` gửi `enable_thinking: true`. Nếu endpoint của bạn
    thay vào đó mong đợi các cờ cấp cao nhất kiểu DashScope, hãy dùng
    `compat.thinkingFormat: "qwen"` để gửi `enable_thinking` ở gốc yêu cầu.

  </Accordion>

  <Accordion title="Điều khiển suy nghĩ Nemotron 3">
    vLLM/Nemotron 3 có thể dùng kwargs chat-template để kiểm soát reasoning được
    trả về dưới dạng reasoning ẩn hay văn bản câu trả lời hiển thị. Khi một phiên OpenClaw
    dùng `vllm/nemotron-3-*` với suy nghĩ tắt, Plugin vLLM đi kèm gửi:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Để tùy chỉnh các giá trị này, đặt `chat_template_kwargs` dưới tham số mô hình.
    Nếu bạn cũng đặt `params.extra_body.chat_template_kwargs`, giá trị đó có
    quyền ưu tiên cuối cùng vì `extra_body` là phần ghi đè thân yêu cầu cuối cùng.

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

  <Accordion title="Lệnh gọi công cụ Qwen xuất hiện dưới dạng văn bản">
    Trước tiên hãy bảo đảm vLLM đã được khởi động với trình phân tích lệnh gọi công cụ và mẫu trò chuyện
    đúng cho mô hình. Ví dụ, vLLM ghi nhận `hermes` cho các mô hình Qwen2.5
    và `qwen3_xml` cho các mô hình Qwen3-Coder.

    Triệu chứng:

    - Skills hoặc công cụ không bao giờ chạy
    - trợ lý in JSON/XML thô như `{"name":"read","arguments":...}`
    - vLLM trả về mảng `tool_calls` rỗng khi OpenClaw gửi
      `tool_choice: "auto"`

    Một số tổ hợp Qwen/vLLM chỉ trả về lệnh gọi công cụ có cấu trúc khi
    yêu cầu dùng `tool_choice: "required"`. Với các mục mô hình đó, ép trường yêu cầu
    tương thích OpenAI bằng `params.extra_body`:

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

    Đây là biện pháp tương thích cần chọn bật. Nó khiến mọi lượt mô hình có
    công cụ đều yêu cầu một lệnh gọi công cụ, vì vậy chỉ dùng cho một mục mô hình cục bộ chuyên dụng
    nơi hành vi đó chấp nhận được. Không dùng nó làm mặc định toàn cục cho tất cả
    mô hình vLLM, và không dùng proxy tự động chuyển đổi tùy tiện
    văn bản trợ lý thành lệnh gọi công cụ có thể thực thi.

  </Accordion>

  <Accordion title="URL cơ sở tùy chỉnh">
    Nếu máy chủ vLLM của bạn chạy trên host hoặc cổng không mặc định, đặt `baseUrl` trong cấu hình nhà cung cấp tường minh:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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
  <Accordion title="Phản hồi đầu tiên chậm hoặc máy chủ từ xa hết thời gian chờ">
    Với các mô hình cục bộ lớn, host LAN từ xa, hoặc liên kết tailnet, hãy đặt
    thời gian chờ yêu cầu theo phạm vi nhà cung cấp:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` chỉ áp dụng cho các yêu cầu HTTP mô hình vLLM, bao gồm
    thiết lập kết nối, header phản hồi, truyền luồng phần thân, và tổng thời gian
    hủy guarded-fetch. Ưu tiên cách này trước khi tăng
    `agents.defaults.timeoutSeconds`, vốn kiểm soát toàn bộ lượt chạy agent.

  </Accordion>

  <Accordion title="Không thể truy cập máy chủ">
    Kiểm tra rằng máy chủ vLLM đang chạy và có thể truy cập:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Nếu bạn thấy lỗi kết nối, hãy xác minh host, cổng, và vLLM đã khởi động với chế độ máy chủ tương thích OpenAI.
    Với các endpoint local loopback, LAN, hoặc Tailscale tường minh, OpenClaw tin cậy
    origin `models.providers.vllm.baseUrl` được cấu hình chính xác cho các yêu cầu mô hình
    được bảo vệ. Các origin metadata/link-local vẫn bị chặn nếu không có
    lựa chọn bật tường minh. Chỉ đặt `models.providers.vllm.request.allowPrivateNetwork: true`
    khi yêu cầu vLLM phải truy cập một origin riêng tư khác, và đặt thành `false`
    để không chọn tin cậy origin chính xác.

  </Accordion>

  <Accordion title="Lỗi xác thực trên yêu cầu">
    Nếu yêu cầu thất bại vì lỗi xác thực, đặt `VLLM_API_KEY` thật khớp với cấu hình máy chủ của bạn, hoặc cấu hình nhà cung cấp tường minh dưới `models.providers.vllm`.

    <Tip>
    Nếu máy chủ vLLM của bạn không bắt buộc xác thực, mọi giá trị không rỗng cho `VLLM_API_KEY` đều dùng được làm tín hiệu chọn bật cho OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Không phát hiện mô hình nào">
    Tự động phát hiện yêu cầu `VLLM_API_KEY` phải được đặt. Nếu bạn đã định nghĩa `models.providers.vllm`, OpenClaw chỉ dùng các mô hình bạn đã khai báo trừ khi `agents.defaults.models` bao gồm `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Công cụ hiển thị dưới dạng văn bản thô">
    Nếu một mô hình Qwen in cú pháp công cụ JSON/XML thay vì thực thi một skill,
    hãy kiểm tra hướng dẫn Qwen trong phần Cấu hình nâng cao ở trên. Cách sửa thường dùng là:

    - khởi động vLLM với parser/template đúng cho mô hình đó
    - xác nhận id mô hình chính xác bằng `openclaw models list --provider vllm`
    - chỉ thêm phần ghi đè `params.extra_body.tool_choice: "required"`
      riêng cho từng mô hình nếu `tool_choice: "auto"` vẫn trả về lệnh gọi công cụ
      rỗng hoặc chỉ dạng văn bản

  </Accordion>
</AccordionGroup>

<Warning>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="OpenAI" href="/vi/providers/openai" icon="bolt">
    Nhà cung cấp OpenAI gốc và hành vi tuyến tương thích với OpenAI.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin đăng nhập.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các vấn đề thường gặp và cách giải quyết.
  </Card>
</CardGroup>
