---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình mã nguồn mở thông qua LM Studio
    - Bạn muốn thiết lập và cấu hình LM Studio
summary: Chạy OpenClaw với LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T08:21:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio chạy các mô hình llama.cpp (GGUF) hoặc MLX cục bộ dưới dạng ứng dụng GUI hoặc daemon `llmster`
không giao diện. Để xem tài liệu cài đặt và sản phẩm, hãy truy cập [lmstudio.ai](https://lmstudio.ai/).

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt và khởi động máy chủ">
    Cài đặt LM Studio (máy tính để bàn) hoặc `llmster` (không giao diện), sau đó khởi động máy chủ:

    ```bash
    lms server start --port 1234
    ```

    Hoặc chạy daemon không giao diện:

    ```bash
    lms daemon up
    ```

    Nếu sử dụng ứng dụng máy tính để bàn, hãy bật JIT để tải mô hình mượt mà; xem
    [hướng dẫn JIT và TTL của LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Đặt khóa API nếu đã bật xác thực">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Nếu xác thực LM Studio bị tắt, hãy để trống khóa API trong quá trình thiết lập. Xem
    [Xác thực LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    ```bash
    openclaw onboard
    ```

    Chọn `LM Studio`, sau đó chọn một mô hình tại lời nhắc `Default model`.

  </Step>
</Steps>

Thay đổi mô hình mặc định sau:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Khóa mô hình LM Studio sử dụng định dạng `author/model-name` (ví dụ: `qwen/qwen3.5-9b`); tham chiếu mô hình OpenClaw
thêm nhà cung cấp ở đầu: `lmstudio/qwen/qwen3.5-9b`. Để tìm khóa chính xác của một mô hình, hãy chạy
lệnh bên dưới và xem trường `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Thiết lập ban đầu không tương tác

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Hoặc chỉ định rõ URL cơ sở, mô hình và khóa API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` nhận khóa mô hình do LM Studio trả về (ví dụ: `qwen/qwen3.5-9b`), không có
tiền tố nhà cung cấp `lmstudio/`. Truyền `--lmstudio-api-key` (hoặc đặt `LM_API_TOKEN`) cho các
máy chủ có xác thực; bỏ qua tùy chọn này đối với máy chủ không xác thực và OpenClaw sẽ lưu một dấu hiệu cục bộ không chứa bí mật.
`--custom-api-key` vẫn được chấp nhận để tương thích, nhưng nên dùng `--lmstudio-api-key`.

Thao tác này ghi `models.providers.lmstudio` và đặt mô hình mặc định thành `lmstudio/<custom-model-id>`.
Việc cung cấp khóa API cũng ghi hồ sơ xác thực `lmstudio:default`.

Quá trình thiết lập tương tác còn có thể nhắc nhập độ dài ngữ cảnh tải mong muốn và áp dụng giá trị đó cho
các mô hình được phát hiện mà nó lưu vào cấu hình.

## Cấu hình

### Khả năng tương thích với mức sử dụng khi phát trực tiếp

LM Studio không phải lúc nào cũng phát đối tượng `usage` theo định dạng OpenAI trong các phản hồi được phát trực tiếp. Thay vào đó, OpenClaw
khôi phục số lượng token từ siêu dữ liệu kiểu llama.cpp `timings.prompt_n` / `timings.predicted_n`.
Mọi điểm cuối tương thích với OpenAI được xác định là điểm cuối cục bộ (máy chủ local loopback) đều nhận cùng
cơ chế dự phòng này, bao gồm các phần phụ trợ cục bộ khác như vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
và text-generation-webui.

### Khả năng tương thích với suy luận

Khi quá trình khám phá `/api/v1/models` của LM Studio báo cáo các tùy chọn suy luận dành riêng cho mô hình, OpenClaw
hiển thị các giá trị `reasoning_effort` tương ứng (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) trong
siêu dữ liệu tương thích của mô hình. Một số bản dựng LM Studio công bố tùy chọn UI nhị phân (`allowed_options: ["off",
"on"]`) nhưng từ chối các giá trị nguyên văn đó trên `/v1/chat/completions`; OpenClaw chuẩn hóa
dạng nhị phân này thành thang sáu mức trước khi gửi yêu cầu, kể cả đối với cấu hình cũ đã lưu
vẫn có ánh xạ suy luận `off`/`on`.

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

### Tắt tải trước

LM Studio hỗ trợ tải mô hình đúng lúc (JIT), tức tải mô hình khi có yêu cầu đầu tiên. Theo mặc định, OpenClaw
tải trước mô hình thông qua điểm cuối tải gốc của LM Studio, điều này hữu ích khi JIT
bị tắt. Để LM Studio JIT, TTL khi không hoạt động và cơ chế tự động loại bỏ tự quản lý vòng đời mô hình,
hãy tắt bước tải trước của OpenClaw:

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

### Máy chủ LAN hoặc tailnet

Sử dụng địa chỉ có thể truy cập của máy chủ LM Studio, giữ nguyên `/v1` và bảo đảm LM Studio được liên kết
vượt ra ngoài loopback trên máy đó:

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

`lmstudio` tự động tin cậy điểm cuối đã cấu hình cho các yêu cầu mô hình, bao gồm các máy chủ loopback,
LAN và tailnet (ngoại trừ nguồn gốc siêu dữ liệu/liên kết cục bộ). Mọi mục nhập nhà cung cấp tùy chỉnh/cục bộ
tương thích với OpenAI đều nhận cùng mức tin cậy theo nguồn gốc chính xác. Các yêu cầu đến một máy chủ riêng tư
hoặc cổng khác vẫn yêu cầu `models.providers.<id>.request.allowPrivateNetwork: true`; đặt thành `false` để
từ chối mức tin cậy mặc định.

## Khắc phục sự cố

### Không phát hiện được LM Studio

Hãy bảo đảm LM Studio đang chạy:

```bash
lms server start --port 1234
```

Nếu xác thực được bật, hãy đặt cả `LM_API_TOKEN`. Xác minh rằng có thể truy cập API:

```bash
curl http://localhost:1234/api/v1/models
```

### Lỗi xác thực (HTTP 401)

- Kiểm tra xem `LM_API_TOKEN` có khớp với khóa được cấu hình trong LM Studio hay không.
- Xem [Xác thực LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Nếu máy chủ không yêu cầu xác thực, hãy để trống khóa trong quá trình thiết lập.

## Liên quan

- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Ollama](/vi/providers/ollama)
- [Mô hình cục bộ](/vi/gateway/local-models)
