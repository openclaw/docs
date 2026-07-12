---
read_when:
    - Bạn muốn chạy OpenClaw với máy chủ SGLang cục bộ
    - Bạn muốn các endpoint `/v1` tương thích với OpenAI cho các mô hình của riêng mình
summary: Chạy OpenClaw với SGLang (máy chủ tự lưu trữ tương thích với OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T08:19:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang phục vụ các mô hình trọng số mở qua API HTTP tương thích với OpenAI. OpenClaw kết nối với SGLang bằng họ nhà cung cấp `openai-completions`, đồng thời tự động khám phá các mô hình khả dụng.

| Thuộc tính                  | Giá trị                                                        |
| -------------------------- | -------------------------------------------------------------- |
| ID nhà cung cấp            | `sglang`                                                       |
| Plugin                     | đi kèm, `enabledByDefault: true`                               |
| Biến môi trường xác thực   | `SGLANG_API_KEY` (giá trị bất kỳ không rỗng nếu máy chủ không yêu cầu xác thực) |
| Cờ thiết lập ban đầu       | `--auth-choice sglang`                                         |
| API                        | Tương thích với OpenAI (`openai-completions`)                  |
| URL cơ sở mặc định         | `http://127.0.0.1:30000/v1`                                    |
| Mẫu giữ chỗ mô hình mặc định | `sglang/Qwen/Qwen3-8B`                                       |
| Mức sử dụng khi truyền phát | Có (`supportsStreamingUsage: true`)                           |
| Định giá                   | Được đánh dấu miễn phí bên ngoài (`modelPricing.external: false`) |

OpenClaw cũng **tự động khám phá** các mô hình khả dụng từ SGLang khi bạn chọn tham gia bằng `SGLANG_API_KEY`. Hãy dùng `sglang/*` trong `agents.defaults.models` để duy trì khả năng khám phá động khi bạn cũng cấu hình URL cơ sở SGLang tùy chỉnh. Xem phần [Khám phá mô hình (nhà cung cấp ngầm định)](#model-discovery-implicit-provider) bên dưới.

## Bắt đầu

<Steps>
  <Step title="Khởi động SGLang">
    Khởi chạy SGLang với máy chủ tương thích với OpenAI. URL cơ sở của bạn phải cung cấp
    các điểm cuối `/v1` (ví dụ: `/v1/models`, `/v1/chat/completions`). SGLang
    thường chạy tại:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Đặt khóa API">
    Có thể dùng bất kỳ giá trị nào nếu máy chủ của bạn không được cấu hình xác thực:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Chạy thiết lập ban đầu hoặc đặt trực tiếp một mô hình">
    ```bash
    openclaw onboard
    ```

    Hoặc cấu hình mô hình theo cách thủ công:

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

## Khám phá mô hình (nhà cung cấp ngầm định)

Khi `SGLANG_API_KEY` được đặt (hoặc có hồ sơ xác thực) và bạn **không**
định nghĩa `models.providers.sglang`, OpenClaw truy vấn:

- `GET http://127.0.0.1:30000/v1/models`

và chuyển đổi các ID được trả về thành các mục mô hình.

<Note>
Nếu bạn đặt `models.providers.sglang` một cách tường minh, theo mặc định OpenClaw sẽ dùng
các mô hình do bạn khai báo. Thêm `"sglang/*": {}` vào `agents.defaults.models` khi bạn
muốn OpenClaw truy vấn điểm cuối `/models` của nhà cung cấp đã cấu hình đó và đưa vào
tất cả các mô hình SGLang được công bố.
</Note>

## Cấu hình tường minh (mô hình thủ công)

Sử dụng cấu hình tường minh khi:

- SGLang chạy trên máy chủ/cổng khác.
- Bạn muốn cố định các giá trị `contextWindow`/`maxTokens`.
- Máy chủ của bạn yêu cầu khóa API thực (hoặc bạn muốn kiểm soát các tiêu đề).

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
            name: "Mô hình SGLang cục bộ",
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
    SGLang được xử lý như một phần phụ trợ `/v1` kiểu proxy tương thích với OpenAI, không phải
    điểm cuối OpenAI gốc.

    | Hành vi | SGLang |
    |----------|--------|
    | Định hình yêu cầu chỉ dành cho OpenAI | Không áp dụng |
    | `service_tier`, `store` của Responses, gợi ý bộ nhớ đệm lời nhắc | Không gửi |
    | Định hình tải trọng tương thích với khả năng suy luận | Không áp dụng |
    | Các tiêu đề quy kết ẩn (`originator`, `version`, `User-Agent`) | Không chèn vào URL cơ sở SGLang tùy chỉnh |

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    **Không thể kết nối với máy chủ**

    Xác minh máy chủ đang chạy và phản hồi:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Lỗi xác thực**

    Nếu yêu cầu thất bại do lỗi xác thực, hãy đặt `SGLANG_API_KEY` thực khớp với
    cấu hình máy chủ của bạn hoặc cấu hình tường minh nhà cung cấp trong
    `models.providers.sglang`.

    <Tip>
    Nếu bạn chạy SGLang mà không có xác thực, bất kỳ giá trị không rỗng nào cho
    `SGLANG_API_KEY` cũng đủ để chọn tham gia khám phá mô hình.
    </Tip>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tài liệu tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm các mục nhà cung cấp.
  </Card>
</CardGroup>
