---
read_when:
    - Bạn muốn OpenClaw chỉ khởi động máy chủ mô hình cục bộ khi mô hình của nó được chọn
    - Bạn chạy ds4, inferrs, vLLM, llama.cpp, MLX hoặc một máy chủ cục bộ khác tương thích với OpenAI
    - Bạn cần kiểm soát khởi động lạnh, trạng thái sẵn sàng và tắt khi nhàn rỗi cho các provider cục bộ
summary: Khởi động máy chủ mô hình cục bộ theo yêu cầu trước các yêu cầu mô hình OpenClaw
title: Dịch vụ mô hình cục bộ
x-i18n:
    generated_at: "2026-06-27T17:30:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` cho phép OpenClaw khởi động máy chủ mô hình cục bộ do provider sở hữu theo nhu cầu. Đây là cấu hình cấp provider: khi mô hình được chọn thuộc về provider đó, OpenClaw thăm dò dịch vụ, khởi động tiến trình nếu endpoint không hoạt động, chờ sẵn sàng, rồi gửi yêu cầu mô hình.

Dùng cho các máy chủ cục bộ tốn kém nếu phải chạy cả ngày, hoặc cho các thiết lập thủ công nơi chỉ cần chọn mô hình là đủ để khởi động backend.

## Cách hoạt động

1. Một yêu cầu mô hình được phân giải tới một provider đã cấu hình.
2. Nếu provider đó có `localService`, OpenClaw thăm dò `healthUrl`.
3. Nếu thăm dò thành công, OpenClaw dùng máy chủ hiện có.
4. Nếu thăm dò thất bại, OpenClaw khởi động `command` với `args`.
5. OpenClaw thăm dò trạng thái sẵn sàng cho đến khi `readyTimeoutMs` hết hạn.
6. Yêu cầu mô hình được gửi qua transport provider thông thường.
7. Nếu OpenClaw đã khởi động tiến trình và `idleStopMs` là số dương, tiến trình sẽ
   được dừng sau khi yêu cầu đang xử lý cuối cùng đã nhàn rỗi trong khoảng thời gian đó.

OpenClaw không cài đặt launchd, systemd, Docker, hay daemon cho việc này. Máy chủ là tiến trình con của tiến trình OpenClaw đầu tiên cần đến nó.

## Dạng cấu hình

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Trường

- `command`: đường dẫn tuyệt đối tới tệp thực thi. Không dùng tra cứu shell.
- `args`: đối số tiến trình. Không áp dụng mở rộng shell, pipe, globbing, hay quy tắc trích dẫn.
- `cwd`: thư mục làm việc tùy chọn cho tiến trình.
- `env`: biến môi trường tùy chọn được hợp nhất đè lên môi trường của tiến trình OpenClaw.
- `healthUrl`: URL kiểm tra sẵn sàng. Nếu bỏ qua, OpenClaw thêm `/models` vào
  `baseUrl`, nên `http://127.0.0.1:8000/v1` trở thành
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: hạn chót chờ sẵn sàng khi khởi động. Mặc định: `120000`.
- `idleStopMs`: độ trễ tắt khi nhàn rỗi cho các tiến trình do OpenClaw khởi động. `0` hoặc
  bỏ qua sẽ giữ tiến trình chạy cho đến khi OpenClaw thoát.

## Ví dụ Inferrs

Inferrs là backend `/v1` tùy chỉnh tương thích với OpenAI, nên cùng API dịch vụ cục bộ hoạt động với mục provider `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
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

Thay `command` bằng kết quả của `which inferrs` trên máy đang chạy OpenClaw.

## Ví dụ ds4

Để xem thiết lập đầy đủ, hướng dẫn định cỡ ngữ cảnh, và lệnh xác minh, hãy xem
[ds4](/vi/providers/ds4).

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

## Ghi chú vận hành

- Một tiến trình OpenClaw quản lý tiến trình con mà nó đã khởi động. Một tiến trình OpenClaw khác
  thấy cùng URL kiểm tra sức khỏe đã hoạt động sẽ tái sử dụng nó mà không nhận quản lý nó.
- Khởi động được tuần tự hóa theo lệnh provider và tập đối số, nên các yêu cầu đồng thời
  không sinh ra các máy chủ trùng lặp cho cùng cấu hình.
- Các phản hồi streaming đang hoạt động giữ một lease; tắt khi nhàn rỗi sẽ chờ cho đến khi
  việc xử lý thân phản hồi hoàn tất.
- Dùng `timeoutSeconds` trên các provider cục bộ chậm để các lần khởi động lạnh và quá trình sinh dài
  không chạm giới hạn thời gian yêu cầu mô hình mặc định.
- Dùng `healthUrl` rõ ràng nếu máy chủ của bạn công bố trạng thái sẵn sàng ở nơi khác
  ngoài `/v1/models`.

## Liên quan

<CardGroup cols={2}>
  <Card title="Mô hình cục bộ" href="/vi/gateway/local-models" icon="server">
    Thiết lập mô hình cục bộ, lựa chọn provider, và hướng dẫn an toàn.
  </Card>
  <Card title="Inferrs" href="/vi/providers/inferrs" icon="cpu">
    Chạy OpenClaw qua máy chủ cục bộ tương thích OpenAI của inferrs.
  </Card>
</CardGroup>
