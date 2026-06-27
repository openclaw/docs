---
read_when:
    - Bạn muốn chạy OpenClaw với antirez/ds4
    - Bạn muốn một backend DeepSeek V4 Flash cục bộ có hỗ trợ gọi công cụ
    - Bạn cần cấu hình OpenClaw cho ds4-server
summary: Chạy OpenClaw thông qua ds4, một máy chủ cục bộ tương thích với OpenAI cho DeepSeek V4 Flash
title: ds4
x-i18n:
    generated_at: "2026-06-27T18:02:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) phục vụ DeepSeek V4 Flash từ backend
Metal cục bộ với API `/v1` tương thích với OpenAI. OpenClaw kết nối tới ds4
thông qua họ nhà cung cấp `openai-completions` chung.

ds4 không phải là Plugin nhà cung cấp đi kèm của OpenClaw. Cấu hình nó trong
`models.providers.ds4`, rồi chọn `ds4/deepseek-v4-flash`.

- ID nhà cung cấp: `ds4`
- Plugin: không có
- API: Chat Completions tương thích với OpenAI (`openai-completions`)
- URL cơ sở đề xuất: `http://127.0.0.1:18000/v1`
- ID mô hình: `deepseek-v4-flash`
- Lệnh gọi công cụ: được hỗ trợ thông qua `tools` và `tool_calls` kiểu OpenAI
- Suy luận: `thinking` và `reasoning_effort` kiểu DeepSeek

## Yêu cầu

- macOS có hỗ trợ Metal.
- Một checkout ds4 hoạt động với `ds4-server` và tệp GGUF DeepSeek V4 Flash.
- Đủ bộ nhớ cho ngữ cảnh bạn chọn. Giá trị `--ctx` lớn hơn sẽ cấp phát nhiều
  bộ nhớ KV hơn khi máy chủ khởi động.

<Warning>
Lượt agent của OpenClaw bao gồm schema công cụ và ngữ cảnh workspace. Một ngữ cảnh nhỏ
như `--ctx 4096` có thể vượt qua kiểm thử curl trực tiếp nhưng thất bại khi chạy agent đầy đủ với
`500 prompt exceeds context`. Hãy dùng ít nhất `--ctx 32768` cho các kiểm thử khói agent và công cụ.
Chỉ dùng `--ctx 393216` khi bạn có đủ bộ nhớ và muốn hành vi ds4
Think Max.
</Warning>

## Khởi động nhanh

<Steps>
  <Step title="Start ds4-server">
    Thay `<DS4_DIR>` bằng đường dẫn checkout ds4 của bạn.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Phản hồi phải bao gồm `deepseek-v4-flash`.

  </Step>
  <Step title="Add the OpenClaw provider config">
    Thêm cấu hình từ [Cấu hình đầy đủ](#full-config), rồi chạy kiểm tra mô hình một lần:

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

Giữ `contextWindow` khớp với giá trị `ds4-server --ctx`. Giữ `maxTokens`
khớp với `--tokens` trừ khi bạn cố ý muốn OpenClaw yêu cầu đầu ra ít hơn
mặc định của máy chủ.

## Khởi động theo yêu cầu

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

`command` phải là đường dẫn thực thi tuyệt đối. Không dùng tra cứu shell và mở rộng `~`.
Xem [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services) để biết mọi trường
`localService`.

## Think Max

ds4 chỉ áp dụng Think Max khi cả hai điều kiện đều đúng:

- `ds4-server` khởi động với `--ctx 393216` trở lên.
- Yêu cầu dùng `reasoning_effort: "max"` hoặc trường effort tương đương của ds4.

Nếu bạn chạy ngữ cảnh lớn đó, hãy cập nhật cả cờ máy chủ và metadata mô hình OpenClaw:

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

Bắt đầu bằng kiểm tra HTTP trực tiếp:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Sau đó kiểm thử định tuyến mô hình OpenClaw:

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Để kiểm thử khói đầy đủ cho agent và lệnh gọi công cụ, hãy dùng ngữ cảnh ít nhất 32768:

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
  <Accordion title="curl /v1/models cannot connect">
    ds4 chưa chạy hoặc chưa được bind tới host và cổng trong `baseUrl`. Khởi động
    `ds4-server`, rồi thử lại:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    `--ctx` đã cấu hình quá nhỏ cho lượt OpenClaw. Tăng
    `ds4-server --ctx`, rồi cập nhật `models.providers.ds4.models[].contextWindow`
    cho khớp. Các lượt agent đầy đủ có công cụ cần nhiều ngữ cảnh hơn đáng kể so với
    một yêu cầu curl trực tiếp chỉ có một tin nhắn.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 chỉ dùng Think Max khi `--ctx` ít nhất là `393216` và yêu cầu
    đòi hỏi `reasoning_effort: "max"`. Ngữ cảnh nhỏ hơn sẽ quay về suy luận cao.
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 có giai đoạn cư trú Metal lạnh và làm nóng mô hình. Dùng
    `localService.readyTimeoutMs: 300000` khi OpenClaw khởi động máy chủ theo yêu cầu.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Local model services" href="/vi/gateway/local-model-services" icon="play">
    Khởi động máy chủ mô hình cục bộ theo yêu cầu trước các yêu cầu mô hình.
  </Card>
  <Card title="Local models" href="/vi/gateway/local-models" icon="server">
    Chọn và vận hành các backend mô hình cục bộ.
  </Card>
  <Card title="Model providers" href="/vi/concepts/model-providers" icon="layers">
    Cấu hình tham chiếu nhà cung cấp, xác thực và chuyển đổi dự phòng.
  </Card>
  <Card title="DeepSeek" href="/vi/providers/deepseek" icon="brain">
    Hành vi nhà cung cấp DeepSeek gốc và các điều khiển thinking.
  </Card>
</CardGroup>
