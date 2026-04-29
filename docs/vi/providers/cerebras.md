---
read_when:
    - Bạn muốn sử dụng Cerebras với OpenClaw
    - Bạn cần biến môi trường khóa API Cerebras hoặc lựa chọn xác thực CLI
summary: Thiết lập Cerebras (xác thực + lựa chọn mô hình)
title: Cerebras
x-i18n:
    generated_at: "2026-04-29T23:05:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) cung cấp suy luận tốc độ cao tương thích OpenAI.

| Thuộc tính | Giá trị                       |
| ---------- | ----------------------------- |
| Nhà cung cấp | `cerebras`                   |
| Xác thực   | `CEREBRAS_API_KEY`            |
| API        | Tương thích OpenAI            |
| URL cơ sở  | `https://api.cerebras.ai/v1`  |

## Bắt đầu

<Steps>
  <Step title="Get an API key">
    Tạo API key trong [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Thiết lập không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Danh mục tích hợp

OpenClaw cung cấp một danh mục Cerebras tĩnh cho endpoint công khai tương thích OpenAI:

| Tham chiếu mô hình                        | Tên                  | Ghi chú                                |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Mô hình mặc định; mô hình suy luận bản xem trước |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Mô hình suy luận sản xuất              |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Mô hình không suy luận bản xem trước   |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Mô hình sản xuất tập trung vào tốc độ  |

<Warning>
Cerebras đánh dấu `zai-glm-4.7` và `qwen-3-235b-a22b-instruct-2507` là các mô hình bản xem trước, và `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` được tài liệu hóa là sẽ ngừng hỗ trợ vào ngày 27 tháng 5 năm 2026. Hãy kiểm tra trang các mô hình được hỗ trợ của Cerebras trước khi dựa vào chúng cho môi trường sản xuất.
</Warning>

## Cấu hình thủ công

Plugin đi kèm thường có nghĩa là bạn chỉ cần API key. Dùng cấu hình
`models.providers.cerebras` rõ ràng khi bạn muốn ghi đè siêu dữ liệu mô hình:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo `CEREBRAS_API_KEY`
khả dụng cho tiến trình đó, ví dụ trong `~/.openclaw/.env` hoặc thông qua
`env.shellEnv`.
</Note>
