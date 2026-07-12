---
read_when:
    - Bạn muốn sử dụng Cerebras với OpenClaw
    - Bạn cần biến môi trường chứa khóa API Cerebras hoặc tùy chọn xác thực qua CLI
summary: Thiết lập Cerebras (xác thực + lựa chọn mô hình)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T08:17:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) cung cấp khả năng suy luận tốc độ cao tương thích với OpenAI trên phần cứng suy luận tùy chỉnh. Plugin đi kèm danh mục tĩnh gồm bốn mô hình (không có tính năng khám phá trực tiếp).

| Thuộc tính             | Giá trị                                                   |
| ---------------------- | --------------------------------------------------------- |
| ID nhà cung cấp        | `cerebras`                                                |
| Plugin                 | gói bên ngoài chính thức (`@openclaw/cerebras-provider`)  |
| Biến môi trường xác thực | `CEREBRAS_API_KEY`                                      |
| Cờ thiết lập ban đầu   | `--auth-choice cerebras-api-key`                          |
| Cờ CLI trực tiếp       | `--cerebras-api-key <key>`                                |
| API                    | tương thích với OpenAI (`openai-completions`)             |
| URL cơ sở              | `https://api.cerebras.ai/v1`                              |
| Mô hình mặc định       | `cerebras/zai-glm-4.7`                                    |

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo khóa API trong [Bảng điều khiển Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Chạy thiết lập ban đầu">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Xác minh các mô hình khả dụng">
    ```bash
    openclaw models list --provider cerebras
    ```

    Liệt kê cả bốn mô hình tĩnh. Nếu không thể phân giải `CEREBRAS_API_KEY`, `openclaw models status --json` sẽ báo thông tin xác thực bị thiếu trong `auth.unusableProfiles`.

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

Cả bốn mô hình đều có cửa sổ ngữ cảnh 128k và tối đa 8.192 token đầu ra.

| Tham chiếu mô hình                         | Tên                  | Suy luận | Ghi chú                                      |
| ------------------------------------------ | -------------------- | -------- | -------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | có       | Mô hình mặc định; mô hình suy luận xem trước |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | có       | Mô hình suy luận dùng trong môi trường thực tế |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | không    | Mô hình không suy luận ở chế độ xem trước    |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | không    | Mô hình dùng trong môi trường thực tế, tập trung vào tốc độ |

<Warning>
Cerebras đánh dấu `zai-glm-4.7` và `qwen-3-235b-a22b-instruct-2507` là các mô hình xem trước; tài liệu cũng cho biết `llama3.1-8b` cùng `qwen-3-235b-a22b-instruct-2507` sẽ ngừng hỗ trợ vào ngày 27 tháng 5 năm 2026. Hãy kiểm tra [trang các mô hình được hỗ trợ](https://inference-docs.cerebras.ai/models/overview) của Cerebras trước khi sử dụng chúng cho khối lượng công việc trong môi trường thực tế.
</Warning>

## Cấu hình thủ công

Hầu hết các thiết lập chỉ cần khóa API. Sử dụng cấu hình `models.providers.cerebras` rõ ràng để ghi đè siêu dữ liệu mô hình hoặc chạy ở `mode: "merge"` với danh mục tĩnh:

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
Nếu Gateway chạy dưới dạng tiến trình nền (launchd, systemd, Docker), hãy bảo đảm `CEREBRAS_API_KEY` khả dụng cho tiến trình đó — chẳng hạn trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`. Khóa chỉ được xuất trong shell tương tác sẽ không có tác dụng với dịch vụ được quản lý, trừ khi môi trường được nhập riêng.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Lựa chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Chế độ tư duy" href="/vi/tools/thinking" icon="brain">
    Các mức độ nỗ lực suy luận cho hai mô hình Cerebras có khả năng suy luận.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Giá trị mặc định của tác tử và cấu hình mô hình.
  </Card>
  <Card title="Câu hỏi thường gặp về mô hình" href="/vi/help/faq-models" icon="circle-question">
    Hồ sơ xác thực, chuyển đổi mô hình và khắc phục lỗi "không có hồ sơ".
  </Card>
</CardGroup>
