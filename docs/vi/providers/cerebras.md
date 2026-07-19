---
read_when:
    - Bạn muốn sử dụng Cerebras với OpenClaw
    - Bạn cần biến môi trường chứa khóa API Cerebras hoặc lựa chọn xác thực CLI
summary: Thiết lập Cerebras (xác thực + lựa chọn mô hình)
title: Cerebras
x-i18n:
    generated_at: "2026-07-19T06:19:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 716eef83155ef80d9aa61bd55ed83e3e38ad22720ae055bce7eb9c2cbfb6cf41
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) cung cấp khả năng suy luận tốc độ cao tương thích với OpenAI trên phần cứng suy luận tùy chỉnh. Plugin cung cấp danh mục tĩnh gồm hai mô hình (không có tính năng khám phá trực tiếp).

| Thuộc tính       | Giá trị                                                   |
| --------------- | --------------------------------------------------------- |
| ID nhà cung cấp | `cerebras`                                                |
| Plugin          | gói bên ngoài chính thức (`@openclaw/cerebras-provider`) |
| Biến môi trường xác thực | `CEREBRAS_API_KEY`                                        |
| Cờ thiết lập ban đầu | `--auth-choice cerebras-api-key`                          |
| Cờ CLI trực tiếp | `--cerebras-api-key <key>`                                |
| API             | tương thích với OpenAI (`openai-completions`)                  |
| URL cơ sở       | `https://api.cerebras.ai/v1`                              |
| Mô hình mặc định | `cerebras/zai-glm-4.7`                                    |

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo khóa API trong [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    <CodeGroup>

```bash Thiết lập ban đầu
openclaw onboard --auth-choice cerebras-api-key
```

```bash Cờ trực tiếp
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Chỉ dùng biến môi trường
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Xác minh các mô hình khả dụng">
    ```bash
    openclaw models list --provider cerebras
    ```

    Liệt kê cả hai mô hình tĩnh. Nếu `CEREBRAS_API_KEY` chưa được phân giải, `openclaw models status --json` sẽ báo thông tin xác thực còn thiếu trong `auth.unusableProfiles`.

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

Cả hai mô hình đều có cửa sổ ngữ cảnh 128k và tối đa 8,192 token đầu ra.

| Tham chiếu mô hình      | Tên          | Suy luận | Ghi chú                                |
| ----------------------- | ------------ | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`  | Z.ai GLM 4.7 | có       | Mô hình mặc định; mô hình suy luận xem trước |
| `cerebras/gpt-oss-120b` | GPT OSS 120B | có       | Mô hình suy luận dùng trong môi trường sản xuất |

## Cấu hình thủ công

Hầu hết các thiết lập chỉ cần khóa API. Sử dụng cấu hình `models.providers.cerebras` rõ ràng để ghi đè siêu dữ liệu mô hình hoặc chạy ở chế độ `mode: "merge"` với danh mục tĩnh:

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
Nếu Gateway chạy dưới dạng daemon (launchd, systemd, Docker), hãy đảm bảo `CEREBRAS_API_KEY` khả dụng cho tiến trình đó — ví dụ trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`. Khóa chỉ được xuất trong shell tương tác sẽ không có tác dụng với dịch vụ được quản lý, trừ khi môi trường được nhập riêng.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cách chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Chế độ tư duy" href="/vi/tools/thinking" icon="brain">
    Các mức độ nỗ lực suy luận cho hai mô hình Cerebras hỗ trợ suy luận.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Giá trị mặc định của tác tử và cấu hình mô hình.
  </Card>
  <Card title="Câu hỏi thường gặp về mô hình" href="/vi/help/faq-models" icon="circle-question">
    Hồ sơ xác thực, chuyển đổi mô hình và xử lý lỗi "không có hồ sơ".
  </Card>
</CardGroup>
