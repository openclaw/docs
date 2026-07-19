---
read_when:
    - Bạn muốn sử dụng Synthetic làm nhà cung cấp mô hình
    - Bạn cần thiết lập khóa API hoặc URL cơ sở của Synthetic
summary: Sử dụng API tương thích với Anthropic của Synthetic trong OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-07-19T05:58:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f6cc89a7b837f57555d176ce78e62a39095d4ef0765c96b6b7b93ffebd7388
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) cung cấp các điểm cuối tương thích với Anthropic.
OpenClaw tích hợp sẵn dịch vụ này dưới dạng nhà cung cấp `synthetic` và sử dụng API
Anthropic Messages.

| Thuộc tính   | Giá trị                               |
| ------------ | ------------------------------------- |
| Nhà cung cấp | `synthetic`                    |
| Xác thực     | `SYNTHETIC_API_KEY`                    |
| API          | Anthropic Messages                    |
| URL cơ sở    | `https://api.synthetic.new/anthropic`                    |

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Lấy `SYNTHETIC_API_KEY` từ tài khoản Synthetic của bạn hoặc để quy trình thiết lập ban đầu
    nhắc bạn nhập khóa.
  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Xác minh mô hình mặc định">
    Quy trình thiết lập ban đầu đặt mô hình mặc định thành:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M3
    ```
  </Step>
</Steps>

<Warning>
Ứng dụng khách Anthropic của OpenClaw tự động nối thêm `/v1` vào URL cơ sở, vì vậy hãy dùng
`https://api.synthetic.new/anthropic` (không phải `/anthropic/v1`). Nếu Synthetic
thay đổi URL cơ sở, hãy ghi đè `models.providers.synthetic.baseUrl`.
</Warning>

## Ví dụ cấu hình

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M3",
            name: "MiniMax M3",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Danh mục tích hợp sẵn

Tất cả mô hình Synthetic đều có chi phí `0` (đầu vào/đầu ra/bộ nhớ đệm). Xem
[danh sách mô hình hiện tại](https://dev.synthetic.new/docs/api/models) của Synthetic để biết tình trạng cung cấp dịch vụ.

| ID mô hình                                          | Cửa sổ ngữ cảnh | Số token tối đa | Suy luận | Đầu vào       |
| --------------------------------------------------- | --------------- | --------------- | ------- | ------------- |
| `hf:MiniMaxAI/MiniMax-M3`                                  | 262,144         | 65,536          | có      | văn bản + ảnh |
| `hf:moonshotai/Kimi-K2.7-Code`                                  | 262,144         | 8,192           | có      | văn bản + ảnh |
| `hf:nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4`                                  | 262,144         | 8,192           | có      | văn bản       |
| `hf:openai/gpt-oss-120b`                                  | 131,072         | 8,192           | có      | văn bản       |
| `hf:Qwen/Qwen3.6-27B`                                  | 262,144         | 81,920          | có      | văn bản + ảnh |
| `hf:zai-org/GLM-4.7-Flash`                                  | 196,608         | 131,072         | có      | văn bản       |
| `hf:zai-org/GLM-5.2`                                  | 524,288         | 131,072         | có      | văn bản       |

<Tip>
Tham chiếu mô hình có dạng `synthetic/<modelId>`. Dùng
`openclaw models list --provider synthetic` để xem tất cả mô hình có sẵn cho
tài khoản của bạn.
</Tip>

<AccordionGroup>
  <Accordion title="Danh sách mô hình được phép">
    Nếu bật danh sách mô hình được phép (`agents.defaults.modelPolicy.allow`), hãy thêm mọi
    mô hình Synthetic mà bạn dự định sử dụng. Các mô hình không có trong danh sách được phép sẽ bị ẩn
    khỏi tác nhân.
  </Accordion>

  <Accordion title="Ghi đè URL cơ sở">
    Nếu Synthetic thay đổi điểm cuối API, hãy ghi đè URL cơ sở:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw vẫn tự động nối thêm `/v1`.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Quy tắc của nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm các thiết lập nhà cung cấp.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Bảng điều khiển Synthetic và tài liệu API.
  </Card>
</CardGroup>
