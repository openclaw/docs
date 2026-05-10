---
read_when:
    - Bạn muốn sử dụng các mô hình Mistral trong OpenClaw
    - Bạn muốn phiên âm thời gian thực bằng Voxtral cho cuộc gọi thoại
    - Bạn cần hướng dẫn thiết lập khóa API Mistral và tham chiếu mô hình
summary: Sử dụng mô hình Mistral và tính năng phiên âm Voxtral với OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-10T19:49:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw bao gồm một Plugin Mistral được đóng gói sẵn, đăng ký bốn hợp đồng: hoàn tất trò chuyện, hiểu phương tiện (phiên âm hàng loạt Voxtral), STT thời gian thực cho Cuộc gọi thoại (Voxtral Realtime), và embedding bộ nhớ (`mistral-embed`).

| Thuộc tính        | Giá trị                                     |
| ----------------- | ------------------------------------------- |
| ID nhà cung cấp   | `mistral`                                   |
| Plugin            | được đóng gói sẵn, `enabledByDefault: true` |
| Biến môi trường xác thực | `MISTRAL_API_KEY`                    |
| Cờ onboarding     | `--auth-choice mistral-api-key`             |
| Cờ CLI trực tiếp  | `--mistral-api-key <key>`                   |
| API               | tương thích OpenAI (`openai-completions`)   |
| URL cơ sở         | `https://api.mistral.ai/v1`                 |
| Mô hình mặc định  | `mistral/mistral-large-latest`              |
| Mô hình embedding | `mistral-embed`                             |
| Voxtral hàng loạt | `voxtral-mini-latest` (phiên âm âm thanh)   |
| Voxtral thời gian thực | `voxtral-mini-transcribe-realtime-2602` |

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API của bạn">
    Tạo khóa API trong [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Chạy onboarding">
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
  <Step title="Xác minh mô hình có sẵn">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Danh mục LLM tích hợp

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
là mô hình Medium kết hợp hiện tại trong danh mục được đóng gói sẵn: 128B trọng số dense,
đầu vào văn bản và hình ảnh, ngữ cảnh 256K, gọi hàm, đầu ra có cấu trúc, lập trình,
và reasoning có thể điều chỉnh thông qua Chat Completions API. Dùng
`mistral/mistral-medium-3-5` khi bạn muốn mô hình tác nhân/lập trình hợp nhất mới hơn của Mistral
thay vì mặc định `mistral/mistral-large-latest`.

OpenClaw hiện phát hành danh mục Mistral được đóng gói sẵn này:

| Tham chiếu mô hình              | Đầu vào     | Ngữ cảnh | Đầu ra tối đa | Ghi chú                                                          |
| -------------------------------- | ----------- | -------- | ------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | văn bản, hình ảnh | 262,144 | 16,384     | Mô hình mặc định                                                 |
| `mistral/mistral-medium-2508`    | văn bản, hình ảnh | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | văn bản, hình ảnh | 262,144 | 8,192      | Mistral Medium 3.5; reasoning có thể điều chỉnh                  |
| `mistral/mistral-small-latest`   | văn bản, hình ảnh | 128,000 | 16,384     | Mistral Small 4; reasoning có thể điều chỉnh qua API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | văn bản, hình ảnh | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | văn bản     | 256,000 | 4,096       | Lập trình                                                        |
| `mistral/devstral-medium-latest` | văn bản     | 262,144 | 32,768      | Devstral 2                                                       |
| `mistral/magistral-small`        | văn bản     | 128,000 | 40,000      | Có bật reasoning                                                 |

Sau khi onboarding, hãy smoke-test Medium 3.5 mà không khởi động Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

Để duyệt hàng trong danh mục được đóng gói sẵn trước khi thay đổi cấu hình:

```bash
openclaw models list --all --provider mistral --plain
```

## Phiên âm âm thanh (Voxtral)

Dùng Voxtral để phiên âm âm thanh hàng loạt thông qua
pipeline hiểu phương tiện.

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

## STT phát trực tuyến cho Cuộc gọi thoại

Plugin `mistral` được đóng gói sẵn đăng ký Voxtral Realtime làm nhà cung cấp STT
phát trực tuyến cho Cuộc gọi thoại.

| Cài đặt      | Đường dẫn cấu hình                                                    | Mặc định                                |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Khóa API     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Dự phòng về `MISTRAL_API_KEY`           |
| Mô hình      | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Mã hóa       | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Tốc độ lấy mẫu | `...mistral.sampleRate`                                              | `8000`                                  |
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
OpenClaw đặt mặc định STT thời gian thực của Mistral thành `pcm_mulaw` ở 8 kHz để Cuộc gọi thoại
có thể chuyển tiếp trực tiếp các khung phương tiện Twilio. Chỉ dùng `encoding: "pcm_s16le"` và
`sampleRate` tương ứng nếu luồng upstream của bạn đã là PCM thô.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Reasoning có thể điều chỉnh">
    `mistral/mistral-small-latest` (Mistral Small 4) và `mistral/mistral-medium-3-5` hỗ trợ [reasoning có thể điều chỉnh](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) trên Chat Completions API qua `reasoning_effort` (`none` giảm thiểu phần suy nghĩ bổ sung trong đầu ra; `high` hiển thị đầy đủ dấu vết suy nghĩ trước câu trả lời cuối cùng). Mistral khuyến nghị `reasoning_effort="high"` cho các trường hợp dùng tác nhân và mã của Medium 3.5.

    OpenClaw ánh xạ mức **thinking** của phiên sang API của Mistral:

    | Mức thinking của OpenClaw                         | `reasoning_effort` của Mistral |
    | ------------------------------------------------ | ------------------------------ |
    | **off** / **minimal**                            | `none`                         |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    Không kết hợp chế độ reasoning của Medium 3.5 với `temperature: 0`. Mistral
    HTTP API từ chối `reasoning_effort="high"` cộng với `temperature: 0` bằng phản hồi 400.
    Hãy để trống temperature để Mistral dùng mặc định của nó, hoặc làm theo
    [cài đặt khuyến nghị cho Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    và dùng `temperature: 0.7` cho reasoning cao. Đối với câu trả lời trực tiếp
    mang tính xác định, hãy tắt thinking/đặt minimal để OpenClaw gửi
    `reasoning_effort: "none"` trước khi bạn hạ temperature.
    </Warning>

    Ví dụ cấu hình theo phạm vi mô hình cho reasoning của Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Các mô hình danh mục Mistral được đóng gói sẵn khác không dùng tham số này. Tiếp tục dùng các mô hình `magistral-*` khi bạn muốn hành vi ưu tiên reasoning gốc của Mistral.
    </Note>

  </Accordion>

  <Accordion title="Embedding bộ nhớ">
    Mistral có thể phục vụ embedding bộ nhớ qua `/v1/embeddings` (mô hình mặc định: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Xác thực và URL cơ sở">
    - Xác thực Mistral dùng `MISTRAL_API_KEY` (header Bearer).
    - URL cơ sở của nhà cung cấp mặc định là `https://api.mistral.ai/v1` và chấp nhận dạng yêu cầu chat-completions tiêu chuẩn tương thích OpenAI.
    - Mô hình onboarding mặc định là `mistral/mistral-large-latest`.
    - Chỉ ghi đè URL cơ sở tại `models.providers.mistral.baseUrl` khi Mistral công bố rõ ràng một endpoint khu vực mà bạn cần.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Hiểu phương tiện" href="/vi/nodes/media-understanding" icon="microphone">
    Thiết lập phiên âm âm thanh và chọn nhà cung cấp.
  </Card>
</CardGroup>
