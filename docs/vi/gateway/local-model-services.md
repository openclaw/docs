---
read_when:
    - Bạn muốn OpenClaw chỉ khởi động máy chủ mô hình cục bộ khi nhà cung cấp mô hình hoặc embedding của máy chủ đó được chọn
    - Bạn chạy ds4, inferrs, vLLM, llama.cpp, MLX hoặc một máy chủ cục bộ khác tương thích với OpenAI
    - Bạn cần kiểm soát quá trình khởi động nguội, trạng thái sẵn sàng và việc tắt khi không hoạt động đối với các nhà cung cấp cục bộ
summary: Khởi động các máy chủ mô hình cục bộ theo yêu cầu trước khi OpenClaw gửi yêu cầu mô hình và embedding
title: Dịch vụ mô hình cục bộ
x-i18n:
    generated_at: "2026-07-12T07:56:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` khởi động máy chủ mô hình cục bộ do nhà cung cấp quản lý khi cần. Khi một yêu cầu mô hình hoặc embedding chọn nhà cung cấp đó, OpenClaw thăm dò điểm cuối kiểm tra tình trạng, khởi động tiến trình nếu máy chủ không hoạt động, chờ đến khi sẵn sàng rồi gửi yêu cầu. Hãy dùng tính năng này để tránh phải duy trì các máy chủ cục bộ tốn nhiều tài nguyên hoạt động cả ngày.

## Cách hoạt động

1. Một yêu cầu mô hình hoặc embedding được phân giải tới nhà cung cấp đã cấu hình.
2. Nếu nhà cung cấp đó có `localService`, OpenClaw sẽ thăm dò `healthUrl`.
3. Nếu thăm dò thành công, OpenClaw sử dụng máy chủ đang chạy.
4. Nếu thăm dò thất bại, OpenClaw khởi chạy `command` với `args`.
5. OpenClaw thăm dò định kỳ điểm cuối kiểm tra tình trạng cho đến khi `readyTimeoutMs` hết hạn.
6. Yêu cầu đi qua cơ chế vận chuyển mô hình hoặc embedding thông thường.
7. Nếu OpenClaw đã khởi động tiến trình và `idleStopMs` được đặt, OpenClaw sẽ dừng tiến trình sau khi yêu cầu đang xử lý cuối cùng đã ở trạng thái nhàn rỗi trong khoảng thời gian đó.

OpenClaw không cài đặt launchd, systemd, Docker hay bất kỳ daemon nào cho việc này. Máy chủ chỉ là một tiến trình con thông thường của tiến trình OpenClaw đầu tiên cần đến nó.

Quá trình khởi động được tuần tự hóa theo từng nhà cung cấp đã cấu hình và từng tập hợp lệnh/đối số/biến môi trường, vì vậy các yêu cầu trò chuyện và embedding đồng thời dành cho cùng một dịch vụ sẽ không khởi chạy các máy chủ trùng lặp. Mỗi yêu cầu giữ phiên thuê riêng cho đến khi hoàn tất xử lý phản hồi, vì vậy quá trình tắt khi nhàn rỗi sẽ chờ mọi yêu cầu mô hình và embedding đang xử lý. Các bí danh nhà cung cấp đã cấu hình vẫn độc lập: hai bí danh có thể trỏ đến các máy chủ GPU khác nhau mà không bị gộp vào cùng một mã định danh bộ điều hợp Ollama, LM Studio hoặc tương thích với OpenAI.

Nếu một tiến trình OpenClaw khác đã có máy chủ hoạt động ổn định tại cùng `healthUrl`, tiến trình này sẽ tái sử dụng máy chủ đó mà không tiếp quản quyền quản lý (mỗi tiến trình chỉ quản lý tiến trình con do chính nó khởi động). Nhật ký khởi động và thoát bao gồm phần cuối đầu ra của tiến trình con có giới hạn và đã che dữ liệu nhạy cảm, cùng thông tin thời gian và chi tiết thoát; các giá trị môi trường đã cấu hình tuyệt đối không được xuất ra.

## Cấu trúc cấu hình

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

Đặt `timeoutSeconds` trong mục nhà cung cấp (không phải trong `localService`) để quá trình khởi động nguội chậm và quá trình tạo nội dung kéo dài không chạm ngưỡng hết thời gian chờ mặc định của yêu cầu mô hình. Hãy đặt `healthUrl` rõ ràng bất cứ khi nào máy chủ cung cấp trạng thái sẵn sàng tại vị trí khác với `/models` trên URL cơ sở.

## Các trường

| Trường           | Bắt buộc | Mô tả                                                                                                                                       |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | có       | Đường dẫn tuyệt đối đến tệp thực thi. Không tra cứu trong PATH của shell.                                                                    |
| `args`           | không    | Các đối số của tiến trình. Không hỗ trợ mở rộng shell, đường ống, ký tự đại diện hoặc dấu trích dẫn.                                         |
| `cwd`            | không    | Thư mục làm việc của tiến trình.                                                                                                             |
| `env`            | không    | Các biến môi trường được hợp nhất và ghi đè lên môi trường của tiến trình OpenClaw.                                                         |
| `healthUrl`      | không    | URL kiểm tra trạng thái sẵn sàng. Mặc định là `baseUrl` được nối thêm `/models` (`http://127.0.0.1:8000/v1` trở thành `http://127.0.0.1:8000/v1/models`). |
| `readyTimeoutMs` | không    | Thời hạn chờ trạng thái sẵn sàng khi khởi động. Mặc định: `120000`.                                                                          |
| `idleStopMs`     | không    | Độ trễ trước khi tắt do nhàn rỗi đối với tiến trình do OpenClaw khởi động. `0` hoặc bỏ qua trường này sẽ giữ tiến trình hoạt động cho đến khi OpenClaw thoát. |

## Ví dụ về Inferrs

Inferrs là một phần phụ trợ `/v1` tùy chỉnh tương thích với OpenAI, vì vậy cùng API `localService` có thể hoạt động với một mục nhà cung cấp `inferrs`:

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
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

Thay `command` bằng kết quả của `which inferrs` trên máy chạy OpenClaw. Thiết lập inferrs đầy đủ: [Inferrs](/vi/providers/inferrs).

## Ví dụ về ds4

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

Các lệnh thiết lập đầy đủ, định cỡ ngữ cảnh và xác minh: [ds4](/vi/providers/ds4).

## Liên quan

<CardGroup cols={2}>
  <Card title="Mô hình cục bộ" href="/vi/gateway/local-models" icon="server">
    Cách thiết lập mô hình cục bộ, lựa chọn nhà cung cấp và hướng dẫn an toàn.
  </Card>
  <Card title="Inferrs" href="/vi/providers/inferrs" icon="cpu">
    Chạy OpenClaw thông qua máy chủ cục bộ inferrs tương thích với OpenAI.
  </Card>
</CardGroup>
