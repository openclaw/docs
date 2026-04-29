---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình mã nguồn mở thông qua LM Studio
    - Bạn muốn thiết lập và cấu hình LM Studio
summary: Chạy OpenClaw với LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-29T23:07:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio là một ứng dụng thân thiện nhưng mạnh mẽ để chạy các mô hình open-weight trên phần cứng của riêng bạn. Ứng dụng này cho phép bạn chạy các mô hình llama.cpp (GGUF) hoặc MLX (Apple Silicon). Có sẵn dưới dạng gói GUI hoặc daemon không giao diện (`llmster`). Để xem tài liệu sản phẩm và thiết lập, hãy xem [lmstudio.ai](https://lmstudio.ai/).

## Bắt đầu nhanh

1. Cài đặt LM Studio (desktop) hoặc `llmster` (không giao diện), rồi khởi động máy chủ cục bộ:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Khởi động máy chủ

Đảm bảo bạn khởi động ứng dụng desktop hoặc chạy daemon bằng lệnh sau:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Nếu bạn đang dùng ứng dụng, hãy đảm bảo đã bật JIT để có trải nghiệm mượt mà. Tìm hiểu thêm trong [hướng dẫn JIT và TTL của LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

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

Khóa mô hình LM Studio có định dạng `author/model-name` (ví dụ: `qwen/qwen3.5-9b`). Tham chiếu mô hình OpenClaw
thêm tên nhà cung cấp ở đầu: `lmstudio/qwen/qwen3.5-9b`. Bạn có thể tìm khóa chính xác cho
một mô hình bằng cách chạy `curl http://localhost:1234/api/v1/models` và xem trường `key`.

## Onboarding không tương tác

Dùng onboarding không tương tác khi bạn muốn viết script thiết lập (CI, cấp phát, bootstrap từ xa):

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

`--custom-model-id` nhận khóa mô hình như LM Studio trả về (ví dụ: `qwen/qwen3.5-9b`), không có
tiền tố nhà cung cấp `lmstudio/`.

Với máy chủ LM Studio có xác thực, hãy truyền `--lmstudio-api-key` hoặc đặt `LM_API_TOKEN`.
Với máy chủ LM Studio không xác thực, hãy bỏ qua khóa; OpenClaw lưu một dấu mốc cục bộ không bí mật.

`--custom-api-key` vẫn được hỗ trợ để tương thích, nhưng `--lmstudio-api-key` được ưu tiên cho LM Studio.

Thao tác này ghi `models.providers.lmstudio` và đặt mô hình mặc định thành
`lmstudio/<custom-model-id>`. Khi bạn cung cấp khóa API, quá trình thiết lập cũng ghi hồ sơ xác thực
`lmstudio:default`.

Thiết lập tương tác có thể nhắc nhập độ dài ngữ cảnh tải ưu tiên tùy chọn và áp dụng giá trị đó cho các mô hình LM Studio đã phát hiện mà nó lưu vào cấu hình.
Cấu hình Plugin LM Studio tin cậy endpoint LM Studio đã cấu hình cho các yêu cầu mô hình, bao gồm loopback, máy chủ LAN và tailnet. Bạn có thể tắt bằng cách đặt `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Cấu hình

### Khả năng tương thích mức sử dụng khi streaming

LM Studio tương thích với mức sử dụng khi streaming. Khi nó không phát ra đối tượng
`usage` theo dạng OpenAI, OpenClaw khôi phục số lượng token từ siêu dữ liệu kiểu llama.cpp
`timings.prompt_n` / `timings.predicted_n` thay vào đó.

Hành vi mức sử dụng khi streaming tương tự áp dụng cho các backend cục bộ tương thích OpenAI sau:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Khả năng tương thích suy nghĩ

Khi quá trình phát hiện `/api/v1/models` của LM Studio báo cáo các tùy chọn reasoning
riêng theo mô hình, OpenClaw giữ nguyên các giá trị gốc đó trong siêu dữ liệu tương thích của mô hình. Với
các mô hình thinking nhị phân quảng bá `allowed_options: ["off", "on"]`,
OpenClaw ánh xạ thinking bị tắt thành `off` và các mức `/think` được bật thành `on`
thay vì gửi các giá trị chỉ dành cho OpenAI như `low` hoặc `medium`.

### Cấu hình tường minh

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

Đảm bảo LM Studio đang chạy. Nếu xác thực được bật, hãy đặt cả `LM_API_TOKEN`:

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

- Kiểm tra rằng `LM_API_TOKEN` khớp với khóa đã cấu hình trong LM Studio.
- Để biết chi tiết thiết lập xác thực LM Studio, hãy xem [Xác thực LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Nếu máy chủ của bạn không yêu cầu xác thực, hãy để trống khóa trong quá trình thiết lập.

### Tải mô hình just-in-time

LM Studio hỗ trợ tải mô hình just-in-time (JIT), trong đó mô hình được tải khi có yêu cầu đầu tiên. Hãy đảm bảo bạn đã bật tính năng này để tránh lỗi 'Model not loaded'.

### Máy chủ LM Studio trên LAN hoặc tailnet

Dùng địa chỉ có thể truy cập của máy chủ LM Studio, giữ `/v1`, và đảm bảo LM Studio được bind vượt ngoài loopback trên máy đó:

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

Khác với các nhà cung cấp tương thích OpenAI chung, `lmstudio` tự động tin cậy endpoint cục bộ/riêng tư đã cấu hình cho các yêu cầu mô hình được bảo vệ. Các ID nhà cung cấp loopback tùy chỉnh như `localhost` hoặc `127.0.0.1` cũng được tin cậy tự động; với ID nhà cung cấp tùy chỉnh trên LAN, tailnet hoặc DNS riêng tư, hãy đặt tường minh `models.providers.<id>.request.allowPrivateNetwork: true`.

## Liên quan

- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Ollama](/vi/providers/ollama)
- [Mô hình cục bộ](/vi/gateway/local-models)
