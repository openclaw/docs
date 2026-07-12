---
read_when:
    - Bạn muốn chạy OpenClaw với antirez/ds4
    - Bạn muốn một backend DeepSeek V4 Flash cục bộ có hỗ trợ gọi công cụ
    - Bạn cần cấu hình OpenClaw cho ds4-server
summary: Chạy OpenClaw thông qua ds4, một máy chủ DeepSeek V4 Flash cục bộ tương thích với OpenAI
title: ds4
x-i18n:
    generated_at: "2026-07-12T08:15:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) phục vụ DeepSeek V4 Flash từ phần phụ trợ
Metal cục bộ với API `/v1` tương thích OpenAI. OpenClaw kết nối với ds4
thông qua họ nhà cung cấp `openai-completions` chung.

ds4 không phải là plugin nhà cung cấp đi kèm OpenClaw. Hãy cấu hình nó trong
`models.providers.ds4`, sau đó chọn `ds4/deepseek-v4-flash`.

| Thuộc tính       | Giá trị                                                   |
| ---------------- | --------------------------------------------------------- |
| ID nhà cung cấp  | `ds4`                                                     |
| Plugin           | không có (chỉ cấu hình)                                   |
| API              | Chat Completions tương thích OpenAI (`openai-completions`) |
| URL cơ sở        | `http://127.0.0.1:18000/v1` (đề xuất)                    |
| ID mô hình       | `deepseek-v4-flash`                                       |
| Lệnh gọi công cụ | `tools` / `tool_calls` theo kiểu OpenAI                   |
| Suy luận         | `thinking` và `reasoning_effort` theo kiểu DeepSeek       |

## Yêu cầu

- macOS có hỗ trợ Metal.
- Một bản checkout ds4 hoạt động được, có `ds4-server` và tệp GGUF DeepSeek V4 Flash.
- Đủ bộ nhớ cho ngữ cảnh bạn chọn; giá trị `--ctx` lớn hơn sẽ cấp phát nhiều
  bộ nhớ KV hơn khi máy chủ khởi động.

<Warning>
Các lượt chạy tác nhân OpenClaw bao gồm lược đồ công cụ và ngữ cảnh không gian làm việc. Một ngữ cảnh
nhỏ như `--ctx 4096` có thể vượt qua các kiểm thử curl trực tiếp nhưng thất bại khi chạy toàn bộ tác nhân với
`500 prompt exceeds context`. Hãy dùng ít nhất `--ctx 32768` cho các kiểm thử nhanh
tác nhân và công cụ. Chỉ dùng `--ctx 393216` khi có đủ bộ nhớ và để bật
Think Max của ds4.
</Warning>

## Bắt đầu nhanh

<Steps>
  <Step title="Khởi động ds4-server">
    Thay `<DS4_DIR>` bằng đường dẫn đến bản checkout ds4 của bạn.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Xác minh điểm cuối tương thích OpenAI">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Phản hồi phải bao gồm `deepseek-v4-flash`.

  </Step>
  <Step title="Thêm cấu hình nhà cung cấp OpenClaw">
    Thêm cấu hình từ [Cấu hình đầy đủ](#full-config), sau đó chạy kiểm tra mô hình
    một lần:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## Cấu hình đầy đủ

Dùng cấu hình này khi ds4 đã chạy trên `127.0.0.1:18000`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

Giữ `contextWindow` đồng bộ với `ds4-server --ctx`. Giữ `maxTokens` đồng bộ
với `--tokens`, trừ khi bạn chủ ý muốn OpenClaw yêu cầu đầu ra ngắn hơn
giá trị mặc định của máy chủ.

## Khởi động theo nhu cầu

OpenClaw có thể chỉ khởi động ds4 khi một mô hình `ds4/...` được chọn. Thêm
`localService` vào cùng mục nhà cung cấp:

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
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` phải là đường dẫn tuyệt đối đến tệp thực thi. Không sử dụng việc tra cứu
qua shell và mở rộng `~`. Xem [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services) để biết
mọi trường `localService`.

## Think Max

ds4 chỉ áp dụng Think Max khi cả hai điều kiện sau đều đúng:

- `ds4-server` khởi động với `--ctx 393216` hoặc cao hơn.
- Yêu cầu sử dụng `reasoning_effort: "max"` (hoặc trường mức suy luận tương đương của ds4).

Nếu chạy với ngữ cảnh lớn như vậy, hãy cập nhật cả cờ máy chủ và siêu dữ liệu mô hình
OpenClaw:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## Kiểm thử

Kiểm tra HTTP trực tiếp, bỏ qua OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Định tuyến mô hình OpenClaw (giống như kiểm tra trong phần Bắt đầu nhanh):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Kiểm thử nhanh toàn bộ tác nhân và lệnh gọi công cụ, với ngữ cảnh ít nhất là 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

Kết quả mong đợi:

- `executionTrace.winnerProvider` là `ds4`
- `executionTrace.winnerModel` là `deepseek-v4-flash`
- `toolSummary.calls` ít nhất là `1`
- `finalAssistantVisibleText` bắt đầu bằng `tool-ok`

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="curl /v1/models không thể kết nối">
    ds4 chưa chạy hoặc không được liên kết với máy chủ/cổng trong `baseUrl`. Hãy khởi động
    `ds4-server`, sau đó thử lại:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    `--ctx` được cấu hình quá nhỏ cho lượt chạy OpenClaw. Hãy tăng
    `ds4-server --ctx`, sau đó cập nhật `models.providers.ds4.models[].contextWindow`
    cho khớp. Các lượt chạy toàn bộ tác nhân có công cụ cần ngữ cảnh lớn hơn đáng kể so với
    một yêu cầu curl trực tiếp chỉ có một thông điệp.
  </Accordion>

  <Accordion title="Think Max không kích hoạt">
    ds4 chỉ sử dụng Think Max khi `--ctx` ít nhất là `393216` và yêu cầu
    chỉ định `reasoning_effort: "max"`. Ngữ cảnh nhỏ hơn sẽ chuyển về mức suy luận
    cao.
  </Accordion>

  <Accordion title="Yêu cầu đầu tiên chậm">
    ds4 có giai đoạn nạp Metal lần đầu và khởi động mô hình. Đặt
    `localService.readyTimeoutMs: 300000` khi OpenClaw khởi động máy chủ theo
    nhu cầu.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Dịch vụ mô hình cục bộ" href="/vi/gateway/local-model-services" icon="play">
    Khởi động máy chủ mô hình cục bộ theo nhu cầu trước các yêu cầu mô hình.
  </Card>
  <Card title="Mô hình cục bộ" href="/vi/gateway/local-models" icon="server">
    Chọn và vận hành các phần phụ trợ mô hình cục bộ.
  </Card>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cấu hình tham chiếu nhà cung cấp, xác thực và chuyển đổi dự phòng.
  </Card>
  <Card title="DeepSeek" href="/vi/providers/deepseek" icon="brain">
    Hành vi gốc của nhà cung cấp DeepSeek và các tùy chọn điều khiển suy luận.
  </Card>
</CardGroup>
