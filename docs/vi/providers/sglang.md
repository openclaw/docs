---
read_when:
    - Bạn muốn chạy OpenClaw với máy chủ SGLang cục bộ
    - Bạn muốn các điểm cuối /v1 tương thích với OpenAI bằng các mô hình của riêng bạn
summary: Chạy OpenClaw với SGLang (máy chủ tự lưu trữ tương thích với OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T09:28:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang phục vụ các mô hình open-weight thông qua API HTTP tương thích với OpenAI. OpenClaw kết nối với SGLang bằng họ provider `openai-completions` với khả năng tự động khám phá các mô hình có sẵn.

| Thuộc tính                | Giá trị                                                      |
| ------------------------- | ------------------------------------------------------------ |
| ID provider               | `sglang`                                                     |
| Plugin                    | bundled, `enabledByDefault: true`                            |
| Biến env xác thực         | `SGLANG_API_KEY` (bất kỳ giá trị không rỗng nào nếu máy chủ không có xác thực) |
| Cờ onboarding             | `--auth-choice sglang`                                       |
| API                       | Tương thích với OpenAI (`openai-completions`)                |
| URL cơ sở mặc định        | `http://127.0.0.1:30000/v1`                                  |
| Placeholder mô hình mặc định | `sglang/Qwen/Qwen3-8B`                                    |
| Sử dụng streaming         | Có (`supportsStreamingUsage: true`)                          |
| Giá                       | Được đánh dấu miễn phí bên ngoài (`modelPricing.external: false`) |

OpenClaw cũng **tự động khám phá** các mô hình có sẵn từ SGLang khi bạn chọn tham gia bằng `SGLANG_API_KEY` và không định nghĩa mục `models.providers.sglang` rõ ràng — xem [Khám phá mô hình (provider ngầm định)](#model-discovery-implicit-provider) bên dưới.

## Bắt đầu

<Steps>
  <Step title="Khởi động SGLang">
    Khởi chạy SGLang với một máy chủ tương thích với OpenAI. URL cơ sở của bạn nên cung cấp
    các endpoint `/v1` (ví dụ `/v1/models`, `/v1/chat/completions`). SGLang
    thường chạy tại:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Đặt API key">
    Bất kỳ giá trị nào cũng hoạt động nếu máy chủ của bạn chưa cấu hình xác thực:

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

## Khám phá mô hình (provider ngầm định)

Khi `SGLANG_API_KEY` được đặt (hoặc có hồ sơ xác thực tồn tại) và bạn **không**
định nghĩa `models.providers.sglang`, OpenClaw sẽ truy vấn:

- `GET http://127.0.0.1:30000/v1/models`

và chuyển đổi các ID được trả về thành các mục mô hình.

<Note>
Nếu bạn đặt `models.providers.sglang` rõ ràng, tự động khám phá sẽ bị bỏ qua và
bạn phải định nghĩa mô hình thủ công.
</Note>

## Cấu hình rõ ràng (mô hình thủ công)

Dùng cấu hình rõ ràng khi:

- SGLang chạy trên host/port khác.
- Bạn muốn cố định các giá trị `contextWindow`/`maxTokens`.
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
    SGLang được xử lý như một backend `/v1` kiểu proxy tương thích với OpenAI, không phải
    một endpoint OpenAI gốc.

    | Hành vi | SGLang |
    |----------|--------|
    | Định dạng yêu cầu chỉ dành cho OpenAI | Không áp dụng |
    | `service_tier`, Responses `store`, gợi ý prompt-cache | Không gửi |
    | Định dạng payload tương thích reasoning | Không áp dụng |
    | Header quy nguồn ẩn (`originator`, `version`, `User-Agent`) | Không được chèn trên các URL cơ sở SGLang tùy chỉnh |

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    **Không truy cập được máy chủ**

    Xác minh máy chủ đang chạy và phản hồi:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Lỗi xác thực**

    Nếu yêu cầu thất bại do lỗi xác thực, hãy đặt `SGLANG_API_KEY` thật khớp
    với cấu hình máy chủ của bạn, hoặc cấu hình provider rõ ràng trong
    `models.providers.sglang`.

    <Tip>
    Nếu bạn chạy SGLang không có xác thực, bất kỳ giá trị không rỗng nào cho
    `SGLANG_API_KEY` cũng đủ để chọn tham gia khám phá mô hình.
    </Tip>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Schema cấu hình đầy đủ, bao gồm các mục provider.
  </Card>
</CardGroup>
