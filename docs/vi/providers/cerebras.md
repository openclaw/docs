---
read_when:
    - Bạn muốn sử dụng Cerebras với OpenClaw
    - Bạn cần biến môi trường khóa API Cerebras hoặc lựa chọn xác thực CLI
summary: Thiết lập Cerebras (xác thực + chọn mô hình)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:01:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) cung cấp suy luận tốc độ cao tương thích OpenAI trên phần cứng suy luận tùy chỉnh. Plugin nhà cung cấp Cerebras bao gồm một danh mục tĩnh gồm bốn mô hình.

| Thuộc tính       | Giá trị                                  |
| --------------- | ---------------------------------------- |
| ID nhà cung cấp | `cerebras`                               |
| Plugin          | gói bên ngoài chính thức                 |
| Biến môi trường xác thực | `CEREBRAS_API_KEY`                       |
| Cờ onboarding   | `--auth-choice cerebras-api-key`         |
| Cờ CLI trực tiếp | `--cerebras-api-key <key>`               |
| API             | tương thích OpenAI (`openai-completions`) |
| URL cơ sở       | `https://api.cerebras.ai/v1`             |
| Mô hình mặc định | `cerebras/zai-glm-4.7`                   |

## Cài đặt Plugin

Cài đặt Plugin chính thức, rồi khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo khóa API trong [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Chạy onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Cờ trực tiếp
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Chỉ dùng môi trường
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Xác minh các mô hình có sẵn">
    ```bash
    openclaw models list --provider cerebras
    ```

    Danh sách phải bao gồm cả bốn mô hình tĩnh. Nếu `CEREBRAS_API_KEY` chưa được phân giải, `openclaw models status --json` báo cáo thông tin xác thực bị thiếu trong `auth.unusableProfiles`.

  </Step>
</Steps>

## Thiết lập không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Danh mục tích hợp sẵn

OpenClaw cung cấp một danh mục Cerebras tĩnh phản chiếu endpoint công khai tương thích OpenAI. Cả bốn mô hình đều dùng chung ngữ cảnh 128k và 8.192 token đầu ra tối đa.

| Tham chiếu mô hình                      | Tên                  | Suy luận | Ghi chú                                |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | có        | Mô hình mặc định; mô hình suy luận bản xem trước |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | có        | Mô hình suy luận sản xuất              |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | không     | Mô hình không suy luận bản xem trước   |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | không     | Mô hình sản xuất ưu tiên tốc độ        |

<Warning>
  Cerebras đánh dấu `zai-glm-4.7` và `qwen-3-235b-a22b-instruct-2507` là mô hình bản xem trước, còn `llama3.1-8b` cùng `qwen-3-235b-a22b-instruct-2507` được ghi trong tài liệu là sẽ ngừng hỗ trợ vào ngày 27 tháng 5 năm 2026. Hãy kiểm tra trang các mô hình được hỗ trợ của Cerebras trước khi dựa vào chúng cho khối lượng công việc sản xuất.
</Warning>

## Cấu hình thủ công

Plugin thường có nghĩa là bạn chỉ cần khóa API. Dùng cấu hình `models.providers.cerebras` rõ ràng khi bạn muốn ghi đè siêu dữ liệu mô hình hoặc chạy ở `mode: "merge"` với danh mục tĩnh:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
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
  Nếu Gateway chạy dưới dạng tiến trình nền (launchd, systemd, Docker), hãy đảm bảo `CEREBRAS_API_KEY` có sẵn cho tiến trình đó — ví dụ trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`. Một khóa chỉ được xuất trong shell tương tác sẽ không giúp ích cho dịch vụ được quản lý trừ khi biến môi trường được nhập riêng.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Chế độ suy nghĩ" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận cho hai mô hình Cerebras có khả năng suy luận.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Giá trị mặc định của agent và cấu hình mô hình.
  </Card>
  <Card title="Câu hỏi thường gặp về mô hình" href="/vi/help/faq-models" icon="circle-question">
    Hồ sơ xác thực, chuyển đổi mô hình và xử lý lỗi "no profile".
  </Card>
</CardGroup>
