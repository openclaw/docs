---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình mã nguồn mở thông qua LM Studio
    - Bạn muốn thiết lập và cấu hình LM Studio
summary: Chạy OpenClaw với LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-06-27T18:04:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio là một ứng dụng thân thiện nhưng mạnh mẽ để chạy các mô hình open-weight trên phần cứng của riêng bạn. Ứng dụng này cho phép bạn chạy các mô hình llama.cpp (GGUF) hoặc MLX (Apple Silicon). Có sẵn dưới dạng gói GUI hoặc daemon headless (`llmster`). Để xem tài liệu sản phẩm và thiết lập, hãy xem [lmstudio.ai](https://lmstudio.ai/).

## Bắt đầu nhanh

1. Cài đặt LM Studio (desktop) hoặc `llmster` (headless), rồi khởi động máy chủ cục bộ:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Khởi động máy chủ

Hãy chắc chắn bạn đã khởi động ứng dụng desktop hoặc chạy daemon bằng lệnh sau:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Nếu bạn đang dùng ứng dụng, hãy chắc chắn đã bật JIT để có trải nghiệm mượt mà. Tìm hiểu thêm trong [hướng dẫn JIT và TTL của LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Nếu xác thực LM Studio được bật, hãy đặt `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Nếu xác thực LM Studio bị tắt, bạn có thể để trống khóa API trong quá trình thiết lập OpenClaw tương tác.

Để biết chi tiết thiết lập xác thực LM Studio, hãy xem [Xác thực LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Chạy onboarding và chọn `LM Studio`:

```bash
openclaw onboard
```

5. Trong onboarding, dùng lời nhắc `Default model` để chọn mô hình LM Studio của bạn.

Bạn cũng có thể đặt hoặc thay đổi sau:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Khóa mô hình LM Studio dùng định dạng `author/model-name` (ví dụ: `qwen/qwen3.5-9b`). Tham chiếu mô hình OpenClaw thêm tên nhà cung cấp ở đầu: `lmstudio/qwen/qwen3.5-9b`. Bạn có thể tìm khóa chính xác của một mô hình bằng cách chạy `curl http://localhost:1234/api/v1/models` và xem trường `key`.

## Onboarding không tương tác

Dùng onboarding không tương tác khi bạn muốn viết script thiết lập (CI, provisioning, bootstrap từ xa):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Hoặc chỉ định URL cơ sở, mô hình và khóa API tùy chọn:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` nhận khóa mô hình do LM Studio trả về (ví dụ: `qwen/qwen3.5-9b`), không có tiền tố nhà cung cấp `lmstudio/`.

Với các máy chủ LM Studio có xác thực, truyền `--lmstudio-api-key` hoặc đặt `LM_API_TOKEN`.
Với các máy chủ LM Studio không xác thực, bỏ qua khóa; OpenClaw lưu một dấu mốc cục bộ không bí mật.

`--custom-api-key` vẫn được hỗ trợ để tương thích, nhưng `--lmstudio-api-key` được ưu tiên cho LM Studio.

Thao tác này ghi `models.providers.lmstudio` và đặt mô hình mặc định thành `lmstudio/<custom-model-id>`. Khi bạn cung cấp khóa API, quá trình thiết lập cũng ghi hồ sơ xác thực `lmstudio:default`.

Thiết lập tương tác có thể nhắc nhập độ dài ngữ cảnh tải ưu tiên tùy chọn và áp dụng giá trị đó cho các mô hình LM Studio đã phát hiện được lưu vào cấu hình.
Cấu hình Plugin LM Studio tin cậy endpoint LM Studio đã cấu hình cho các yêu cầu mô hình, bao gồm loopback, LAN và máy chủ tailnet. Nguồn metadata/link-local vẫn yêu cầu chọn tham gia rõ ràng. Bạn có thể chọn không tham gia bằng cách đặt `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Cấu hình

### Tương thích usage streaming

LM Studio tương thích với usage streaming. Khi không phát ra đối tượng `usage` có dạng OpenAI, OpenClaw khôi phục số lượng token từ metadata kiểu llama.cpp `timings.prompt_n` / `timings.predicted_n` thay thế.

Hành vi usage streaming tương tự áp dụng cho các backend cục bộ tương thích OpenAI sau:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Tương thích thinking

Khi khám phá `/api/v1/models` của LM Studio báo cáo các tùy chọn reasoning theo từng mô hình, OpenClaw hiển thị các giá trị `reasoning_effort` tương thích OpenAI tương ứng trong metadata tương thích mô hình. Các bản dựng LM Studio hiện tại có thể quảng bá tùy chọn UI nhị phân như `allowed_options: ["off", "on"]` nhưng từ chối các giá trị đó trên `/v1/chat/completions`; OpenClaw chuẩn hóa dạng khám phá nhị phân đó thành `none`, `minimal`, `low`, `medium`, `high` và `xhigh` trước khi gửi yêu cầu. Cấu hình LM Studio cũ đã lưu có chứa bản đồ reasoning `off`/`on` cũng được chuẩn hóa theo cùng cách khi catalog được tải.

### Cấu hình rõ ràng

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
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

## Khắc phục sự cố

### Không phát hiện được LM Studio

Hãy chắc chắn LM Studio đang chạy. Nếu xác thực được bật, cũng đặt `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Xác minh API có thể truy cập được:

```bash
curl http://localhost:1234/api/v1/models
```

### Lỗi xác thực (HTTP 401)

Nếu thiết lập báo HTTP 401, hãy xác minh khóa API của bạn:

- Kiểm tra rằng `LM_API_TOKEN` khớp với khóa được cấu hình trong LM Studio.
- Để biết chi tiết thiết lập xác thực LM Studio, hãy xem [Xác thực LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Nếu máy chủ của bạn không yêu cầu xác thực, hãy để trống khóa trong quá trình thiết lập.

### Tải mô hình just-in-time

LM Studio hỗ trợ tải mô hình just-in-time (JIT), trong đó mô hình được tải ở yêu cầu đầu tiên. OpenClaw mặc định tải trước mô hình thông qua endpoint tải gốc của LM Studio, điều này hữu ích khi JIT bị tắt. Để để JIT, TTL nhàn rỗi và hành vi tự động loại bỏ của LM Studio sở hữu vòng đời mô hình, hãy tắt bước tải trước của OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### Máy chủ LM Studio trên LAN hoặc tailnet

Dùng địa chỉ có thể truy cập của máy chủ LM Studio, giữ `/v1`, và chắc chắn LM Studio được bind ngoài loopback trên máy đó:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

`lmstudio` tự động tin cậy endpoint cục bộ/riêng tư đã cấu hình cho các yêu cầu mô hình được bảo vệ. Các mục nhà cung cấp tùy chỉnh/cục bộ tương thích OpenAI cũng tin cậy đúng nguồn `baseUrl` đã cấu hình của chúng, ngoại trừ nguồn metadata/link-local; các yêu cầu tới cổng hoặc đích riêng tư khác vẫn yêu cầu `models.providers.<id>.request.allowPrivateNetwork: true`. Đặt `models.providers.<id>.request.allowPrivateNetwork: false` để chọn không tin cậy theo đúng nguồn.

## Liên quan

- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Ollama](/vi/providers/ollama)
- [Mô hình cục bộ](/vi/gateway/local-models)
