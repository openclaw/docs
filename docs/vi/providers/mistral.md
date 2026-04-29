---
read_when:
    - Bạn muốn sử dụng các mô hình Mistral trong OpenClaw
    - Bạn muốn dùng phiên âm theo thời gian thực của Voxtral cho Cuộc gọi thoại
    - Bạn cần hướng dẫn thiết lập khóa API Mistral và tham chiếu mô hình
summary: Sử dụng các mô hình Mistral và tính năng phiên âm Voxtral với OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-29T23:07:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw hỗ trợ Mistral cho cả định tuyến mô hình văn bản/hình ảnh (`mistral/...`) và
phiên âm âm thanh qua Voxtral trong nhận hiểu phương tiện.
Mistral cũng có thể được dùng cho nhúng bộ nhớ (`memorySearch.provider = "mistral"`).

- Nhà cung cấp: `mistral`
- Xác thực: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API của bạn">
    Tạo khóa API trong [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Chạy thiết lập ban đầu">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Hoặc truyền khóa trực tiếp:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Đặt mô hình mặc định">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Xác minh mô hình khả dụng">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Danh mục LLM tích hợp sẵn

OpenClaw hiện đi kèm danh mục Mistral tích hợp này:

| Tham chiếu mô hình              | Đầu vào             | Ngữ cảnh | Đầu ra tối đa | Ghi chú                                                                  |
| -------------------------------- | ------------------- | -------- | ------------- | ------------------------------------------------------------------------ |
| `mistral/mistral-large-latest`   | văn bản, hình ảnh   | 262,144  | 16,384        | Mô hình mặc định                                                         |
| `mistral/mistral-medium-2508`    | văn bản, hình ảnh   | 262,144  | 8,192         | Mistral Medium 3.1                                                       |
| `mistral/mistral-small-latest`   | văn bản, hình ảnh   | 128,000  | 16,384        | Mistral Small 4; suy luận có thể điều chỉnh qua API `reasoning_effort`   |
| `mistral/pixtral-large-latest`   | văn bản, hình ảnh   | 128,000  | 32,768        | Pixtral                                                                  |
| `mistral/codestral-latest`       | văn bản             | 256,000  | 4,096         | Lập trình                                                                |
| `mistral/devstral-medium-latest` | văn bản             | 262,144  | 32,768        | Devstral 2                                                               |
| `mistral/magistral-small`        | văn bản             | 128,000  | 40,000        | Hỗ trợ suy luận                                                          |

## Phiên âm âm thanh (Voxtral)

Dùng Voxtral để phiên âm âm thanh theo lô thông qua quy trình nhận hiểu
phương tiện.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Đường dẫn phiên âm phương tiện dùng `/v1/audio/transcriptions`. Mô hình âm thanh mặc định cho Mistral là `voxtral-mini-latest`.
</Tip>

## STT phát trực tuyến cho Voice Call

Plugin `mistral` đi kèm đăng ký Voxtral Realtime làm nhà cung cấp STT
phát trực tuyến cho Voice Call.

| Thiết lập        | Đường dẫn cấu hình                                                   | Mặc định                                |
| ---------------- | -------------------------------------------------------------------- | --------------------------------------- |
| Khóa API         | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Dự phòng về `MISTRAL_API_KEY`           |
| Mô hình          | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602` |
| Mã hóa           | `...mistral.encoding`                                                | `pcm_mulaw`                             |
| Tốc độ lấy mẫu   | `...mistral.sampleRate`                                              | `8000`                                  |
| Độ trễ mục tiêu  | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw đặt STT thời gian thực của Mistral mặc định là `pcm_mulaw` ở 8 kHz để Voice Call
có thể chuyển tiếp trực tiếp các khung phương tiện Twilio. Chỉ dùng `encoding: "pcm_s16le"` và
`sampleRate` tương ứng nếu luồng thượng nguồn của bạn đã là PCM thô.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Suy luận có thể điều chỉnh (mistral-small-latest)">
    `mistral/mistral-small-latest` ánh xạ tới Mistral Small 4 và hỗ trợ [suy luận có thể điều chỉnh](https://docs.mistral.ai/capabilities/reasoning/adjustable) trên API Chat Completions qua `reasoning_effort` (`none` giảm thiểu phần suy nghĩ bổ sung trong đầu ra; `high` hiển thị đầy đủ dấu vết suy nghĩ trước câu trả lời cuối cùng).

    OpenClaw ánh xạ mức **suy nghĩ** của phiên vào API của Mistral:

    | Mức suy nghĩ của OpenClaw                                      | `reasoning_effort` của Mistral |
    | -------------------------------------------------------------- | ------------------------------ |
    | **off** / **minimal**                                          | `none`                         |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`                         |

    <Note>
    Các mô hình khác trong danh mục Mistral đi kèm không dùng tham số này. Tiếp tục dùng các mô hình `magistral-*` khi bạn muốn hành vi ưu tiên suy luận gốc của Mistral.
    </Note>

  </Accordion>

  <Accordion title="Nhúng bộ nhớ">
    Mistral có thể phục vụ nhúng bộ nhớ qua `/v1/embeddings` (mô hình mặc định: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Xác thực và URL cơ sở">
    - Xác thực Mistral dùng `MISTRAL_API_KEY`.
    - URL cơ sở của nhà cung cấp mặc định là `https://api.mistral.ai/v1`.
    - Mô hình thiết lập ban đầu mặc định là `mistral/mistral-large-latest`.
    - Z.AI dùng xác thực Bearer với khóa API của bạn.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Nhận hiểu phương tiện" href="/vi/nodes/media-understanding" icon="microphone">
    Thiết lập phiên âm âm thanh và chọn nhà cung cấp.
  </Card>
</CardGroup>
