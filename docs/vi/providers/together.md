---
read_when:
    - Bạn muốn sử dụng Together AI với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập Together AI (xác thực + chọn mô hình)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:06:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) cung cấp quyền truy cập vào các mô hình mã nguồn mở hàng đầu, bao gồm Llama, DeepSeek, Kimi và nhiều mô hình khác thông qua một API thống nhất.

| Thuộc tính | Giá trị                       |
| ---------- | ----------------------------- |
| Nhà cung cấp | `together`                  |
| Xác thực   | `TOGETHER_API_KEY`            |
| API        | Tương thích OpenAI            |
| URL cơ sở  | `https://api.together.xyz/v1` |

## Bắt đầu

<Steps>
  <Step title="Get an API key">
    Tạo khóa API tại
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### Ví dụ không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Thiết lập sẵn onboarding đặt
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` làm mô hình mặc định.
</Note>

## Danh mục tích hợp sẵn

OpenClaw phát hành kèm danh mục Together được đóng gói này:

| Tham chiếu mô hình                                | Tên                          | Đầu vào          | Ngữ cảnh | Ghi chú              |
| -------------------------------------------------- | ---------------------------- | ---------------- | -------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | văn bản          | 131,072  | Mô hình mặc định     |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | văn bản, hình ảnh | 262,144 | Mô hình suy luận Kimi |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | văn bản          | 512,000  | Mô hình văn bản suy luận |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | văn bản          | 32,768   | Mô hình văn bản nhanh |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | văn bản          | 202,752  | Mô hình văn bản suy luận |

## Tạo video

Plugin `together` được đóng gói cũng đăng ký tính năng tạo video thông qua công cụ
`video_generate` dùng chung.

| Thuộc tính         | Giá trị                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| Mô hình video mặc định | `together/Wan-AI/Wan2.2-T2V-A14B`                                    |
| Chế độ             | văn bản thành video; chỉ tham chiếu một hình ảnh với `Wan-AI/Wan2.2-I2V-A14B` |
| Tham số được hỗ trợ | `aspectRatio`, `resolution`                                             |

Để dùng Together làm nhà cung cấp video mặc định:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số công cụ dùng chung,
lựa chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo
    `TOGETHER_API_KEY` khả dụng cho tiến trình đó (ví dụ: trong
    `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với
    các tiến trình Gateway do daemon quản lý. Sử dụng cấu hình `~/.openclaw/.env`
    hoặc `env.shellEnv` để đảm bảo khả dụng lâu dài.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Xác minh khóa của bạn hoạt động: `openclaw models list --provider together`
    - Nếu mô hình không xuất hiện, hãy xác nhận khóa API được đặt trong đúng
      môi trường cho tiến trình Gateway của bạn.
    - Tham chiếu mô hình dùng dạng `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Quy tắc nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Video generation" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ tạo video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm các thiết lập nhà cung cấp.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Bảng điều khiển Together AI, tài liệu API và giá.
  </Card>
</CardGroup>
