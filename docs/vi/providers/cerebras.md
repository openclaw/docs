---
read_when:
    - Bạn muốn sử dụng Cerebras với OpenClaw
    - Bạn cần biến môi trường khóa API Cerebras hoặc lựa chọn xác thực CLI
summary: Thiết lập Cerebras (xác thực + chọn mô hình)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T09:26:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) cung cấp suy luận tốc độ cao tương thích OpenAI trên phần cứng suy luận tùy chỉnh. OpenClaw bao gồm một Plugin nhà cung cấp Cerebras được đóng gói kèm với danh mục tĩnh gồm bốn mô hình.

| Thuộc tính      | Giá trị                                  |
| --------------- | ---------------------------------------- |
| ID nhà cung cấp | `cerebras`                               |
| Plugin          | được đóng gói kèm, `enabledByDefault: true` |
| Biến env xác thực | `CEREBRAS_API_KEY`                     |
| Cờ thiết lập ban đầu | `--auth-choice cerebras-api-key`    |
| Cờ CLI trực tiếp | `--cerebras-api-key <key>`              |
| API             | tương thích OpenAI (`openai-completions`) |
| URL cơ sở       | `https://api.cerebras.ai/v1`             |
| Mô hình mặc định | `cerebras/zai-glm-4.7`                  |

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo một khóa API trong [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Chạy thiết lập ban đầu">
    <CodeGroup>

```bash Thiết lập ban đầu
openclaw onboard --auth-choice cerebras-api-key
```

```bash Cờ trực tiếp
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Chỉ env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Xác minh các mô hình có sẵn">
    ```bash
    openclaw models list --provider cerebras
    ```

    Danh sách phải bao gồm cả bốn mô hình được đóng gói kèm. Nếu `CEREBRAS_API_KEY` chưa được phân giải, `openclaw models status --json` sẽ báo cáo thông tin xác thực bị thiếu trong `auth.unusableProfiles`.

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

OpenClaw đi kèm một danh mục Cerebras tĩnh phản ánh endpoint công khai tương thích OpenAI. Cả bốn mô hình đều dùng chung ngữ cảnh 128k và 8.192 token đầu ra tối đa.

| Tham chiếu mô hình                       | Tên                  | Suy luận | Ghi chú                                |
| ----------------------------------------- | -------------------- | -------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | có       | Mô hình mặc định; mô hình suy luận bản xem trước |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | có       | Mô hình suy luận dùng cho production   |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | không    | Mô hình không suy luận bản xem trước   |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | không    | Mô hình production tập trung vào tốc độ |

<Warning>
  Cerebras đánh dấu `zai-glm-4.7` và `qwen-3-235b-a22b-instruct-2507` là mô hình bản xem trước, còn `llama3.1-8b` cùng `qwen-3-235b-a22b-instruct-2507` được ghi trong tài liệu là sẽ ngừng hỗ trợ vào ngày 27 tháng 5 năm 2026. Hãy kiểm tra trang các mô hình được hỗ trợ của Cerebras trước khi dựa vào chúng cho khối lượng công việc production.
</Warning>

## Cấu hình thủ công

Plugin được đóng gói kèm thường có nghĩa là bạn chỉ cần khóa API. Hãy dùng cấu hình `models.providers.cerebras` rõ ràng khi bạn muốn ghi đè metadata mô hình hoặc chạy trong `mode: "merge"` trên danh mục tĩnh:

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
  Nếu Gateway chạy dưới dạng daemon (launchd, systemd, Docker), hãy đảm bảo `CEREBRAS_API_KEY` có sẵn cho tiến trình đó — ví dụ trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`. Một khóa chỉ nằm trong `~/.profile` sẽ không giúp ích cho dịch vụ được quản lý trừ khi env được nhập riêng.
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
    Mặc định của agent và cấu hình mô hình.
  </Card>
  <Card title="Câu hỏi thường gặp về mô hình" href="/vi/help/faq-models" icon="circle-question">
    Hồ sơ xác thực, chuyển đổi mô hình và xử lý lỗi "no profile".
  </Card>
</CardGroup>
