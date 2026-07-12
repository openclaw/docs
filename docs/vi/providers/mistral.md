---
read_when:
    - Bạn muốn sử dụng các mô hình Mistral trong OpenClaw
    - Bạn muốn tính năng chuyển lời nói thành văn bản theo thời gian thực của Voxtral cho Cuộc gọi thoại
    - Bạn cần quy trình thiết lập khóa API Mistral và các tham chiếu mô hình
summary: Sử dụng các mô hình Mistral và tính năng phiên âm Voxtral với OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T08:18:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Plugin `mistral` đi kèm đăng ký bốn hợp đồng: hoàn tất trò chuyện, nhận hiểu nội dung đa phương tiện (phiên âm hàng loạt bằng Voxtral), STT thời gian thực cho Voice Call (Voxtral Realtime) và embedding bộ nhớ (`mistral-embed`).

| Thuộc tính       | Giá trị                                      |
| ---------------- | -------------------------------------------- |
| ID nhà cung cấp  | `mistral`                                    |
| Plugin           | đi kèm, được bật theo mặc định               |
| Biến môi trường xác thực | `MISTRAL_API_KEY`                    |
| Cờ hướng dẫn thiết lập | `--auth-choice mistral-api-key`          |
| Cờ CLI trực tiếp | `--mistral-api-key <key>`                    |
| API              | tương thích với OpenAI (`openai-completions`) |
| URL cơ sở        | `https://api.mistral.ai/v1`                  |
| Mô hình mặc định | `mistral/mistral-large-latest`               |
| Mô hình embedding | `mistral-embed`                             |
| Voxtral hàng loạt | `voxtral-mini-latest` (phiên âm thanh)      |
| Voxtral thời gian thực | `voxtral-mini-transcribe-realtime-2602` |

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo khóa API trong [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Chạy quy trình hướng dẫn thiết lập">
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

| Tham chiếu mô hình              | Đầu vào     | Ngữ cảnh | Đầu ra tối đa | Ghi chú                                               |
| -------------------------------- | ----------- | ------- | ---------- | ----------------------------------------------------- |
| `mistral/mistral-large-latest`   | văn bản, hình ảnh | 262,144 | 16,384 | Mô hình mặc định                                      |
| `mistral/mistral-medium-2508`    | văn bản, hình ảnh | 262,144 | 8,192  | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`     | văn bản, hình ảnh | 262,144 | 8,192  | Mistral Medium 3.5; có thể điều chỉnh suy luận        |
| `mistral/mistral-small-latest`   | văn bản, hình ảnh | 262,144 | 16,384 | Mistral Small 4 mới nhất; có thể điều chỉnh `reasoning_effort` |
| `mistral/mistral-small-2603`     | văn bản, hình ảnh | 262,144 | 16,384 | Mistral Small 4 phiên bản cố định; có thể điều chỉnh `reasoning_effort` |
| `mistral/pixtral-large-latest`   | văn bản, hình ảnh | 128,000 | 32,768 | Pixtral                                               |
| `mistral/codestral-latest`       | văn bản     | 256,000 | 4,096      | Lập trình                                             |
| `mistral/devstral-medium-latest` | văn bản     | 262,144 | 32,768     | Devstral 2                                            |
| `mistral/magistral-small`        | văn bản     | 128,000 | 40,000     | Hỗ trợ suy luận                                       |

Xem hàng tương ứng trong danh mục tích hợp sẵn trước khi thay đổi cấu hình:

```bash
openclaw models list --all --provider mistral --plain
```

Kiểm thử nhanh một mô hình mà không cần khởi động Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Phiên âm thanh (Voxtral)

Dùng Voxtral để phiên âm thanh hàng loạt thông qua quy trình nhận hiểu nội dung đa phương tiện:

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
Đường dẫn phiên âm đa phương tiện sử dụng `/v1/audio/transcriptions`. Mô hình âm thanh mặc định cho Mistral là `voxtral-mini-latest`.
</Tip>

## STT truyền phát cho Voice Call

Plugin `mistral` đi kèm đăng ký Voxtral Realtime làm nhà cung cấp STT truyền phát cho Voice Call.

| Cài đặt       | Đường dẫn cấu hình                                                     | Mặc định                                |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| Khóa API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Dùng `MISTRAL_API_KEY` làm phương án dự phòng |
| Mô hình       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Mã hóa        | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Tần số lấy mẫu | `...mistral.sampleRate`                                               | `8000`                                  |
| Độ trễ mục tiêu | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

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
OpenClaw mặc định đặt STT thời gian thực của Mistral thành `pcm_mulaw` ở 8 kHz để Voice Call có thể chuyển tiếp trực tiếp các khung đa phương tiện của Twilio. Chỉ dùng `encoding: "pcm_s16le"` và `sampleRate` tương ứng nếu luồng đầu vào của bạn đã là PCM thô.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Suy luận có thể điều chỉnh">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` và `mistral/mistral-medium-3-5` hỗ trợ [suy luận có thể điều chỉnh](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) trên API Chat Completions thông qua `reasoning_effort` (`none` giảm thiểu phần suy nghĩ bổ sung trong đầu ra; `high` hiển thị đầy đủ dấu vết suy nghĩ trước câu trả lời cuối cùng).

    OpenClaw ánh xạ mức độ **suy nghĩ** của phiên sang API của Mistral:

    | Mức độ suy nghĩ của OpenClaw                                       | `reasoning_effort` của Mistral |
    | ------------------------------------------------------------------ | ------------------------------ |
    | **tắt** / **tối thiểu**                                            | `none`                         |
    | **thấp** / **trung bình** / **cao** / **rất cao** / **thích ứng** / **tối đa** | `high`              |

    <Warning>
    Tránh kết hợp chế độ suy luận của Medium 3.5 với `temperature: 0`; đã có báo cáo rằng API HTTP của Mistral từ chối tổ hợp `reasoning_effort="high"` và `temperature: 0` bằng phản hồi 400. Hãy để nhiệt độ không được đặt, hoặc tắt/đặt suy nghĩ ở mức tối thiểu để OpenClaw gửi `reasoning_effort: "none"` trước khi bạn đặt nhiệt độ thấp.
    </Warning>

    Ví dụ cấu hình theo phạm vi mô hình cho suy luận của Medium 3.5:

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
    Các mô hình khác trong danh mục Mistral tích hợp sẵn không sử dụng tham số này. Tiếp tục dùng các mô hình `magistral-*` khi bạn muốn hành vi ưu tiên suy luận nguyên bản của Mistral.
    </Note>

  </Accordion>

  <Accordion title="Embedding bộ nhớ">
    Mistral có thể cung cấp embedding bộ nhớ qua `/v1/embeddings` (mô hình mặc định: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Xác thực và URL cơ sở">
    - Xác thực Mistral sử dụng `MISTRAL_API_KEY` (tiêu đề Bearer).
    - URL cơ sở của nhà cung cấp mặc định là `https://api.mistral.ai/v1` và chấp nhận cấu trúc yêu cầu hoàn tất trò chuyện tiêu chuẩn tương thích với OpenAI.
    - Mô hình mặc định khi hướng dẫn thiết lập là `mistral/mistral-large-latest`.
    - Chỉ ghi đè URL cơ sở tại `models.providers.mistral.baseUrl` khi Mistral công bố rõ ràng một điểm cuối theo khu vực mà bạn cần.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Nhận hiểu nội dung đa phương tiện" href="/vi/nodes/media-understanding" icon="microphone">
    Thiết lập phiên âm thanh và lựa chọn nhà cung cấp.
  </Card>
</CardGroup>
