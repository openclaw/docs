---
read_when:
    - Bạn muốn chạy OpenClaw với máy chủ vLLM cục bộ
    - Bạn muốn các điểm cuối /v1 tương thích với OpenAI dành cho các mô hình của riêng mình
summary: Chạy OpenClaw với vLLM (máy chủ cục bộ tương thích với OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T08:18:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM phục vụ các mô hình mã nguồn mở (và một số mô hình tùy chỉnh) thông qua API HTTP **tương thích OpenAI**. OpenClaw kết nối bằng API `openai-completions` và có thể **tự động khám phá** các mô hình khi bạn chủ động bật bằng `VLLM_API_KEY`.

| Thuộc tính       | Giá trị                                    |
| ---------------- | ------------------------------------------ |
| ID nhà cung cấp  | `vllm`                                     |
| API              | `openai-completions` (tương thích OpenAI)  |
| Xác thực         | Biến môi trường `VLLM_API_KEY`             |
| URL cơ sở mặc định | `http://127.0.0.1:8000/v1`               |
| Mức sử dụng khi truyền phát | Được hỗ trợ (`stream_options.include_usage`) |

## Bắt đầu

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    URL cơ sở của bạn phải cung cấp các endpoint `/v1` (`/v1/models`, `/v1/chat/completions`). vLLM thường chạy tại:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Nếu máy chủ của bạn không bắt buộc xác thực, mọi giá trị không rỗng đều dùng được:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    Thay thế bằng một trong các ID mô hình vLLM của bạn:

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

<Tip>
Để thiết lập không tương tác (CI, viết tập lệnh), hãy truyền trực tiếp URL cơ sở, khóa và mô hình:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Khám phá mô hình (nhà cung cấp ngầm định)

Khi `VLLM_API_KEY` được đặt (hoặc tồn tại hồ sơ xác thực) và `models.providers.vllm` **chưa** được định nghĩa, OpenClaw truy vấn `GET http://127.0.0.1:8000/v1/models` rồi chuyển đổi các ID trả về thành các mục mô hình.

<Note>
Nếu bạn đặt `models.providers.vllm` một cách tường minh, OpenClaw chỉ sử dụng các mô hình bạn đã khai báo. Thêm `"vllm/*": {}` vào `agents.defaults.models` để OpenClaw cũng truy vấn endpoint `/models` của nhà cung cấp đã cấu hình đó và bao gồm tất cả mô hình vLLM được công bố.
</Note>

## Cấu hình tường minh

Hãy cấu hình tường minh khi vLLM chạy trên máy chủ hoặc cổng khác, bạn muốn cố định `contextWindow`/`maxTokens`, máy chủ yêu cầu khóa API thực hoặc bạn kết nối tới endpoint loopback, LAN hay Tailscale đáng tin cậy:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

Để giữ nhà cung cấp ở trạng thái động mà không liệt kê từng mô hình, hãy thêm ký tự đại diện vào danh mục mô hình hiển thị:

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
    vLLM được xử lý như một backend `/v1` kiểu proxy tương thích OpenAI, không phải endpoint OpenAI gốc:

    | Hành vi                                 | Có áp dụng không?                |
    | --------------------------------------- | -------------------------------- |
    | Định dạng yêu cầu OpenAI gốc            | Không                            |
    | `service_tier`                          | Không được gửi                   |
    | `store` của Responses                   | Không được gửi                   |
    | Gợi ý bộ nhớ đệm prompt                 | Không được gửi                   |
    | Định dạng tải trọng tương thích suy luận OpenAI | Không được áp dụng       |
    | Header ghi nhận OpenClaw ẩn             | Không được chèn vào URL cơ sở tùy chỉnh |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Với các mô hình Qwen, hãy đặt `compat.thinkingFormat: "qwen-chat-template"` trên hàng mô hình khi máy chủ yêu cầu các đối số từ khóa của mẫu trò chuyện Qwen. Các mô hình này cung cấp hồ sơ `/think` nhị phân (`off`, `on`) vì chế độ suy nghĩ của mẫu trò chuyện Qwen là cờ bật/tắt, không phải thang mức độ nỗ lực kiểu OpenAI.

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

    Các mức suy nghĩ khác `off` sẽ gửi `enable_thinking: true`. Nếu endpoint của bạn yêu cầu các cờ cấp cao nhất kiểu DashScope, hãy dùng `compat.thinkingFormat: "qwen"` để gửi `enable_thinking` tại gốc yêu cầu.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    Với các mô hình `vllm/nemotron-3-*` đã tắt chế độ suy nghĩ, Plugin đi kèm sẽ gửi:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Để tùy chỉnh các giá trị này, hãy đặt `chat_template_kwargs` trong tham số mô hình. Nếu bạn cũng đặt `params.extra_body.chat_template_kwargs`, giá trị đó sẽ được ưu tiên vì `extra_body` là phần ghi đè nội dung yêu cầu cuối cùng.

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
    Trước tiên, hãy xác nhận vLLM đã được khởi động với trình phân tích cú pháp lệnh gọi công cụ và mẫu trò chuyện phù hợp cho mô hình. Tài liệu vLLM chỉ định `hermes` cho các mô hình Qwen2.5 và `qwen3_xml` cho các mô hình Qwen3-Coder.

    Triệu chứng: Skills/công cụ không bao giờ chạy, trợ lý in JSON/XML thô như `{"name":"read","arguments":...}` hoặc vLLM trả về mảng `tool_calls` rỗng khi OpenClaw gửi `tool_choice: "auto"`.

    Một số tổ hợp Qwen/vLLM chỉ trả về lệnh gọi công cụ có cấu trúc khi yêu cầu sử dụng `tool_choice: "required"`. Buộc thiết lập này theo từng mô hình bằng `params.extra_body`:

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

    Thay ID mô hình bằng ID chính xác từ `openclaw models list --provider vllm`, hoặc áp dụng cùng phần ghi đè từ CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Đây là giải pháp thay thế phải chủ động bật: nó buộc mỗi lượt có công cụ phải thực hiện một lệnh gọi công cụ, vì vậy chỉ dùng cho một mục mô hình chuyên biệt khi hành vi đó có thể chấp nhận được. Không đặt nó làm mặc định chung cho mọi mô hình vLLM và không kết hợp nó với proxy chuyển đổi văn bản tùy ý của trợ lý thành các lệnh gọi công cụ có thể thực thi.

  </Accordion>

  <Accordion title="Custom base URL">
    Nếu máy chủ vLLM chạy trên máy chủ hoặc cổng không mặc định, hãy đặt `baseUrl` trong cấu hình nhà cung cấp tường minh:

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
  <Accordion title="Slow first response or remote server timeout">
    Với các mô hình cục bộ lớn, máy chủ LAN từ xa hoặc liên kết tailnet, hãy đặt thời gian chờ yêu cầu trong phạm vi nhà cung cấp:

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

    `timeoutSeconds` chỉ áp dụng cho các yêu cầu HTTP mô hình vLLM: thiết lập kết nối, header phản hồi, truyền phát nội dung và thao tác hủy tổng thể của cơ chế truy xuất được bảo vệ. Nó cũng nâng giới hạn bộ giám sát trạng thái nhàn rỗi/truyền phát của LLM cao hơn mức mặc định ngầm định khoảng 120 giây cho nhà cung cấp này. Nên dùng cách này thay vì tăng `agents.defaults.timeoutSeconds`, vốn kiểm soát toàn bộ lượt chạy của tác tử.

  </Accordion>

  <Accordion title="Server not reachable">
    Kiểm tra xem máy chủ vLLM có đang chạy và có thể truy cập được không:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Nếu bạn thấy lỗi kết nối, hãy xác minh máy chủ, cổng và việc vLLM đã khởi động ở chế độ máy chủ tương thích OpenAI. OpenClaw tin cậy chính xác nguồn gốc `models.providers.vllm.baseUrl` đã cấu hình cho các yêu cầu mô hình được bảo vệ trên endpoint loopback, LAN và Tailscale. Các nguồn gốc siêu dữ liệu/link-local vẫn bị chặn nếu không chủ động bật rõ ràng. Chỉ đặt `models.providers.vllm.request.allowPrivateNetwork: true` khi các yêu cầu vLLM phải truy cập một nguồn gốc riêng tư khác, hoặc đặt `false` để không sử dụng cơ chế tin cậy nguồn gốc chính xác.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Nếu yêu cầu thất bại do lỗi xác thực, hãy đặt `VLLM_API_KEY` thực khớp với cấu hình máy chủ hoặc cấu hình nhà cung cấp một cách tường minh trong `models.providers.vllm`.

    <Tip>
    Nếu máy chủ vLLM của bạn không bắt buộc xác thực, mọi giá trị không rỗng của `VLLM_API_KEY` đều có thể dùng làm tín hiệu chủ động bật cho OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    Tính năng tự động khám phá yêu cầu phải đặt `VLLM_API_KEY`. Nếu bạn đã định nghĩa `models.providers.vllm`, OpenClaw chỉ sử dụng các mô hình đã khai báo, trừ khi `agents.defaults.models` chứa `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Nếu một mô hình Qwen in cú pháp công cụ JSON/XML thay vì thực thi một Skill:

    - Khởi động vLLM với trình phân tích cú pháp/mẫu phù hợp cho mô hình đó.
    - Xác nhận ID mô hình chính xác bằng `openclaw models list --provider vllm`.
    - Chỉ thêm phần ghi đè `params.extra_body.tool_choice: "required"` chuyên biệt cho từng mô hình nếu `tool_choice: "auto"` vẫn trả về lệnh gọi công cụ rỗng hoặc chỉ có văn bản.

  </Accordion>
</AccordionGroup>

<Warning>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Warning>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="OpenAI" href="/vi/providers/openai" icon="bolt">
    Nhà cung cấp OpenAI gốc và hành vi định tuyến tương thích OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và cách giải quyết.
  </Card>
</CardGroup>
