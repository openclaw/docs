---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình mã nguồn mở thông qua LM Studio
    - Bạn muốn thiết lập và cấu hình LM Studio
summary: Chạy OpenClaw với LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T15:45:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio chạy các mô hình llama.cpp (GGUF) hoặc MLX cục bộ, dưới dạng ứng dụng GUI hoặc daemon không giao diện `llmster`.
Để xem tài liệu cài đặt và sản phẩm, hãy truy cập [lmstudio.ai](https://lmstudio.ai/).

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt và khởi động máy chủ">
    Cài đặt LM Studio (máy tính để bàn) hoặc `llmster` (không giao diện), rồi khởi động máy chủ:

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
  <Step title="Đặt khóa API nếu xác thực được bật">
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

    Trong một quy trình thiết lập có hướng dẫn mới, trước tiên OpenClaw truy vấn `/api/v1/models` trên
    máy chủ LM Studio mặc định hoặc đã cấu hình. Một LLM hiện có được cung cấp thông qua
    cùng trình tự thiết lập CLI/macOS và được xác minh bằng một lần hoàn thành thực tế trước khi
    cấu hình của nó được lưu. Quá trình kiểm tra tự động không bao giờ tải xuống mô hình và
    bỏ qua các mục danh mục chỉ dành cho embedding.

  </Step>
</Steps>

Thay đổi mô hình mặc định sau:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Khóa mô hình LM Studio sử dụng định dạng `author/model-name` (ví dụ: `qwen/qwen3.5-9b`); tham chiếu mô hình OpenClaw
thêm nhà cung cấp vào đầu: `lmstudio/qwen/qwen3.5-9b`. Tìm khóa chính xác của một mô hình bằng cách chạy
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
tiền tố nhà cung cấp `lmstudio/`. Truyền `--lmstudio-api-key` (hoặc đặt `LM_API_TOKEN`) cho các máy chủ
có xác thực; bỏ qua đối số này đối với máy chủ không xác thực và OpenClaw sẽ lưu một dấu hiệu cục bộ không bí mật.
`--custom-api-key` vẫn được chấp nhận để đảm bảo khả năng tương thích, nhưng nên dùng `--lmstudio-api-key`.

Thao tác này ghi `models.providers.lmstudio` và đặt mô hình mặc định thành `lmstudio/<custom-model-id>`.
Việc cung cấp khóa API cũng ghi hồ sơ xác thực `lmstudio:default`.

Thiết lập tương tác cũng có thể nhắc nhập độ dài ngữ cảnh tải ưu tiên và áp dụng giá trị đó cho
các mô hình được phát hiện mà quy trình lưu vào cấu hình.

## Cấu hình

### Khả năng tương thích với mức sử dụng khi truyền phát

LM Studio không phải lúc nào cũng phát ra đối tượng `usage` theo định dạng OpenAI trong các phản hồi truyền phát. OpenClaw
thay vào đó khôi phục số lượng token từ siêu dữ liệu `timings.prompt_n` / `timings.predicted_n` kiểu llama.cpp.
Mọi điểm cuối tương thích với OpenAI được phân giải là điểm cuối cục bộ (máy chủ loopback) đều nhận cùng
cơ chế dự phòng này, bao gồm các backend cục bộ khác như vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
và text-generation-webui.

### Khả năng tương thích với suy luận

Khi quá trình khám phá `/api/v1/models` của LM Studio báo cáo các tùy chọn suy luận dành riêng cho mô hình, OpenClaw
hiển thị các giá trị `reasoning_effort` tương ứng (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) trong
siêu dữ liệu tương thích của mô hình. Một số bản dựng LM Studio hiển thị tùy chọn UI nhị phân (`allowed_options: ["off",
"on"]`) nhưng từ chối các giá trị chữ đó trên `/v1/chat/completions`; OpenClaw chuẩn hóa
dạng nhị phân này thành thang sáu mức trước khi gửi yêu cầu, bao gồm cả cấu hình cũ đã lưu
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

LM Studio hỗ trợ tải mô hình đúng lúc (JIT), tức tải mô hình trong yêu cầu đầu tiên. Theo mặc định, OpenClaw
tải trước các mô hình thông qua điểm cuối tải gốc của LM Studio, điều này hữu ích khi JIT
bị tắt. Để LM Studio JIT, TTL khi không hoạt động và hành vi tự động loại bỏ tự quản lý vòng đời mô hình,
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

Sử dụng địa chỉ có thể truy cập của máy chủ LM Studio, giữ nguyên `/v1` và bảo đảm LM Studio được liên kết vượt ra ngoài
loopback trên máy đó:

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

`lmstudio` tự động tin cậy điểm cuối đã cấu hình cho các yêu cầu mô hình, bao gồm máy chủ loopback,
LAN và tailnet (ngoại trừ nguồn gốc siêu dữ liệu/link-local). Mọi mục nhà cung cấp tương thích với OpenAI
tùy chỉnh/cục bộ đều nhận cùng mức tin cậy theo nguồn gốc chính xác. Yêu cầu đến máy chủ hoặc cổng riêng tư khác vẫn
cần `models.providers.<id>.request.allowPrivateNetwork: true`; đặt thành `false` để từ chối
mức tin cậy mặc định.

## Khắc phục sự cố

### Không phát hiện thấy LM Studio

Bảo đảm LM Studio đang chạy:

```bash
lms server start --port 1234
```

Nếu xác thực được bật, hãy đặt cả `LM_API_TOKEN`. Xác minh API có thể truy cập được:

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
