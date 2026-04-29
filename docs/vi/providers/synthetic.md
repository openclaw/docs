---
read_when:
    - Bạn muốn sử dụng Synthetic làm nhà cung cấp mô hình
    - Bạn cần thiết lập khóa API Synthetic hoặc URL cơ sở
summary: Sử dụng API tương thích với Anthropic của Synthetic trong OpenClaw
title: Tổng hợp
x-i18n:
    generated_at: "2026-04-29T23:09:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) cung cấp các điểm cuối tương thích với Anthropic.
OpenClaw đăng ký nó làm nhà cung cấp `synthetic` và sử dụng API Anthropic
Messages.

| Thuộc tính | Giá trị                               |
| ---------- | ------------------------------------- |
| Nhà cung cấp | `synthetic`                         |
| Xác thực   | `SYNTHETIC_API_KEY`                   |
| API        | Anthropic Messages                    |
| URL cơ sở  | `https://api.synthetic.new/anthropic` |

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Lấy `SYNTHETIC_API_KEY` từ tài khoản Synthetic của bạn, hoặc để trình hướng dẫn
    onboarding nhắc bạn nhập một khóa.
  </Step>
  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Xác minh mô hình mặc định">
    Sau khi onboarding, mô hình mặc định được đặt thành:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Ứng dụng khách Anthropic của OpenClaw tự động thêm `/v1` vào URL cơ sở, vì vậy hãy dùng
`https://api.synthetic.new/anthropic` (không phải `/anthropic/v1`). Nếu Synthetic
thay đổi URL cơ sở, hãy ghi đè `models.providers.synthetic.baseUrl`.
</Warning>

## Ví dụ cấu hình

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
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
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Danh mục tích hợp sẵn

Tất cả mô hình Synthetic dùng chi phí `0` (đầu vào/đầu ra/bộ nhớ đệm).

| ID mô hình                                             | Cửa sổ ngữ cảnh | Token tối đa | Suy luận | Đầu vào           |
| ------------------------------------------------------ | --------------- | ------------ | -------- | ----------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000         | 65,536       | không    | văn bản           |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000         | 8,192        | có       | văn bản           |
| `hf:zai-org/GLM-4.7`                                   | 198,000         | 128,000      | không    | văn bản           |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000         | 8,192        | không    | văn bản           |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000         | 8,192        | không    | văn bản           |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000         | 8,192        | không    | văn bản           |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000         | 8,192        | không    | văn bản           |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000         | 8,192        | không    | văn bản           |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000         | 8,192        | không    | văn bản           |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000         | 8,192        | không    | văn bản           |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000         | 8,192        | không    | văn bản           |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000         | 8,192        | có       | văn bản + hình ảnh |
| `hf:openai/gpt-oss-120b`                               | 128,000         | 8,192        | không    | văn bản           |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000         | 8,192        | không    | văn bản           |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000         | 8,192        | không    | văn bản           |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000         | 8,192        | không    | văn bản + hình ảnh |
| `hf:zai-org/GLM-4.5`                                   | 128,000         | 128,000      | không    | văn bản           |
| `hf:zai-org/GLM-4.6`                                   | 198,000         | 128,000      | không    | văn bản           |
| `hf:zai-org/GLM-5`                                     | 256,000         | 128,000      | có       | văn bản + hình ảnh |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000         | 8,192        | không    | văn bản           |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000         | 8,192        | có       | văn bản           |

<Tip>
Tham chiếu mô hình dùng dạng `synthetic/<modelId>`. Dùng
`openclaw models list --provider synthetic` để xem tất cả mô hình có sẵn trên
tài khoản của bạn.
</Tip>

<AccordionGroup>
  <Accordion title="Danh sách cho phép mô hình">
    Nếu bạn bật danh sách cho phép mô hình (`agents.defaults.models`), hãy thêm mọi
    mô hình Synthetic mà bạn dự định dùng. Các mô hình không có trong danh sách cho phép sẽ bị ẩn
    khỏi tác nhân.
  </Accordion>

  <Accordion title="Ghi đè URL cơ sở">
    Nếu Synthetic thay đổi điểm cuối API, hãy ghi đè URL cơ sở trong cấu hình của bạn:

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

    Hãy nhớ rằng OpenClaw tự động thêm `/v1`.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Quy tắc nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm cài đặt nhà cung cấp.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Bảng điều khiển Synthetic và tài liệu API.
  </Card>
</CardGroup>
