---
read_when:
    - Bạn muốn sử dụng các mô hình Mistral trong OpenClaw
    - Bạn muốn tính năng phiên âm theo thời gian thực của Voxtral cho Cuộc gọi thoại
    - Bạn cần hướng dẫn thiết lập khóa API Mistral và các tham chiếu mô hình
summary: Sử dụng các mô hình Mistral và tính năng phiên âm Voxtral với OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T09:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw bao gồm một Plugin Mistral được đóng gói kèm, đăng ký bốn hợp đồng: hoàn thiện trò chuyện, hiểu phương tiện (phiên âm hàng loạt Voxtral), STT thời gian thực cho Voice Call (Voxtral Realtime), và embedding bộ nhớ (`mistral-embed`).

| Thuộc tính        | Giá trị                                     |
| ---------------- | ------------------------------------------- |
| ID nhà cung cấp  | `mistral`                                   |
| Plugin           | được đóng gói kèm, `enabledByDefault: true` |
| Biến môi trường xác thực | `MISTRAL_API_KEY`                    |
| Cờ thiết lập ban đầu | `--auth-choice mistral-api-key`          |
| Cờ CLI trực tiếp | `--mistral-api-key <key>`                   |
| API              | tương thích OpenAI (`openai-completions`)   |
| URL cơ sở        | `https://api.mistral.ai/v1`                 |
| Mô hình mặc định | `mistral/mistral-large-latest`              |
| Mô hình embedding | `mistral-embed`                            |
| Voxtral hàng loạt | `voxtral-mini-latest` (phiên âm âm thanh)  |
| Voxtral thời gian thực | `voxtral-mini-transcribe-realtime-2602` |

## Bắt đầu

<Steps>
  <Step title="Get your API key">
    Tạo khóa API trong [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Hoặc truyền khóa trực tiếp:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Danh mục LLM tích hợp sẵn

OpenClaw hiện cung cấp danh mục Mistral được đóng gói kèm này:

| Tham chiếu mô hình              | Đầu vào     | Ngữ cảnh | Đầu ra tối đa | Ghi chú                                                          |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | văn bản, hình ảnh | 262,144 | 16,384     | Mô hình mặc định                                                 |
| `mistral/mistral-medium-2508`    | văn bản, hình ảnh | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | văn bản, hình ảnh | 128,000 | 16,384     | Mistral Small 4; suy luận có thể điều chỉnh qua API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | văn bản, hình ảnh | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | văn bản     | 256,000 | 4,096      | Lập trình                                                        |
| `mistral/devstral-medium-latest` | văn bản     | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | văn bản     | 128,000 | 40,000     | Có bật suy luận                                                  |

## Phiên âm âm thanh (Voxtral)

Dùng Voxtral để phiên âm âm thanh hàng loạt thông qua pipeline hiểu phương tiện.

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

Plugin `mistral` được đóng gói kèm đăng ký Voxtral Realtime làm nhà cung cấp STT phát trực tuyến cho Voice Call.

| Cài đặt       | Đường dẫn cấu hình                                                   | Mặc định                                |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Khóa API     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Dùng dự phòng `MISTRAL_API_KEY`         |
| Mô hình      | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Mã hóa       | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Tần số lấy mẫu | `...mistral.sampleRate`                                              | `8000`                                  |
| Độ trễ mục tiêu | `...mistral.targetStreamingDelayMs`                                 | `800`                                   |

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
OpenClaw mặc định STT thời gian thực của Mistral là `pcm_mulaw` ở 8 kHz để Voice Call có thể chuyển tiếp trực tiếp các khung phương tiện Twilio. Chỉ dùng `encoding: "pcm_s16le"` và `sampleRate` khớp nếu luồng upstream của bạn đã là PCM thô.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Adjustable reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` ánh xạ tới Mistral Small 4 và hỗ trợ [suy luận có thể điều chỉnh](https://docs.mistral.ai/capabilities/reasoning/adjustable) trên API Chat Completions qua `reasoning_effort` (`none` giảm thiểu suy nghĩ bổ sung trong đầu ra; `high` hiển thị đầy đủ các vết suy nghĩ trước câu trả lời cuối cùng).

    OpenClaw ánh xạ mức **thinking** của phiên sang API của Mistral:

    | Mức thinking của OpenClaw                     | `reasoning_effort` của Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Các mô hình khác trong danh mục Mistral được đóng gói kèm không dùng tham số này. Tiếp tục dùng các mô hình `magistral-*` khi bạn muốn hành vi ưu tiên suy luận gốc của Mistral.
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral có thể cung cấp embedding bộ nhớ qua `/v1/embeddings` (mô hình mặc định: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - Xác thực Mistral dùng `MISTRAL_API_KEY` (header Bearer).
    - URL cơ sở của nhà cung cấp mặc định là `https://api.mistral.ai/v1` và chấp nhận dạng yêu cầu chat-completions tiêu chuẩn tương thích OpenAI.
    - Mô hình mặc định khi thiết lập ban đầu là `mistral/mistral-large-latest`.
    - Chỉ ghi đè URL cơ sở trong `models.providers.mistral.baseUrl` khi Mistral công bố rõ ràng một endpoint khu vực mà bạn cần.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Media understanding" href="/vi/nodes/media-understanding" icon="microphone">
    Thiết lập phiên âm âm thanh và chọn nhà cung cấp.
  </Card>
</CardGroup>
