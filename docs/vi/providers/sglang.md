---
read_when:
    - Bạn muốn chạy OpenClaw với một máy chủ SGLang cục bộ
    - Bạn muốn có các điểm cuối /v1 tương thích với OpenAI cho các mô hình của riêng bạn
summary: Chạy OpenClaw với SGLang (máy chủ tự lưu trữ tương thích với OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-29T23:09:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 16
---

SGLang có thể phục vụ các mô hình mã nguồn mở thông qua API HTTP **tương thích OpenAI**.
OpenClaw có thể kết nối với SGLang bằng API `openai-completions`.

OpenClaw cũng có thể **tự động phát hiện** các mô hình có sẵn từ SGLang khi bạn chọn tham gia bằng `SGLANG_API_KEY` (giá trị bất kỳ đều hoạt động nếu máy chủ của bạn không bắt buộc xác thực) và bạn không định nghĩa mục `models.providers.sglang` rõ ràng.

OpenClaw xem `sglang` là một nhà cung cấp cục bộ tương thích OpenAI, hỗ trợ ghi nhận mức sử dụng dạng truyền phát, nên số lượng token trạng thái/ngữ cảnh có thể cập nhật từ phản hồi `stream_options.include_usage`.

## Bắt đầu

<Steps>
  <Step title="Khởi động SGLang">
    Khởi chạy SGLang với máy chủ tương thích OpenAI. URL cơ sở của bạn nên cung cấp các endpoint `/v1` (ví dụ `/v1/models`, `/v1/chat/completions`). SGLang thường chạy trên:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Đặt API key">
    Giá trị bất kỳ đều hoạt động nếu máy chủ của bạn không cấu hình xác thực:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Chạy onboarding hoặc đặt trực tiếp một mô hình">
    ```bash
    openclaw onboard
    ```

    Hoặc cấu hình mô hình thủ công:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Phát hiện mô hình (nhà cung cấp ngầm định)

Khi `SGLANG_API_KEY` được đặt (hoặc có hồ sơ xác thực) và bạn **không** định nghĩa `models.providers.sglang`, OpenClaw sẽ truy vấn:

- `GET http://127.0.0.1:30000/v1/models`

và chuyển các ID trả về thành các mục mô hình.

<Note>
Nếu bạn đặt `models.providers.sglang` rõ ràng, tự động phát hiện sẽ bị bỏ qua và bạn phải định nghĩa mô hình thủ công.
</Note>

## Cấu hình rõ ràng (mô hình thủ công)

Dùng cấu hình rõ ràng khi:

- SGLang chạy trên host/cổng khác.
- Bạn muốn ghim các giá trị `contextWindow`/`maxTokens`.
- Máy chủ của bạn yêu cầu API key thật (hoặc bạn muốn kiểm soát header).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Hành vi kiểu proxy">
    SGLang được xem là backend `/v1` tương thích OpenAI kiểu proxy, không phải endpoint OpenAI gốc.

    | Hành vi | SGLang |
    |----------|--------|
    | Định dạng yêu cầu chỉ dành cho OpenAI | Không áp dụng |
    | `service_tier`, Responses `store`, gợi ý prompt-cache | Không gửi |
    | Định dạng payload tương thích reasoning | Không áp dụng |
    | Header ghi nhận nguồn ẩn (`originator`, `version`, `User-Agent`) | Không được chèn trên URL cơ sở SGLang tùy chỉnh |

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    **Không truy cập được máy chủ**

    Xác minh máy chủ đang chạy và phản hồi:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Lỗi xác thực**

    Nếu yêu cầu thất bại với lỗi xác thực, hãy đặt `SGLANG_API_KEY` thật khớp với cấu hình máy chủ của bạn, hoặc cấu hình nhà cung cấp rõ ràng trong `models.providers.sglang`.

    <Tip>
    Nếu bạn chạy SGLang mà không xác thực, bất kỳ giá trị không rỗng nào cho `SGLANG_API_KEY` cũng đủ để chọn tham gia phát hiện mô hình.
    </Tip>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Schema cấu hình đầy đủ bao gồm các mục nhà cung cấp.
  </Card>
</CardGroup>
