---
read_when:
    - Bạn muốn sử dụng Together AI với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập Together AI (xác thực + chọn mô hình)
title: Together AI
x-i18n:
    generated_at: "2026-04-29T23:09:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) cung cấp quyền truy cập vào các mô hình nguồn mở hàng đầu, bao gồm Llama, DeepSeek, Kimi, và nhiều mô hình khác thông qua một API hợp nhất.

| Thuộc tính | Giá trị                       |
| ---------- | ----------------------------- |
| Nhà cung cấp | `together`                  |
| Xác thực   | `TOGETHER_API_KEY`            |
| API        | Tương thích với OpenAI        |
| URL cơ sở  | `https://api.together.xyz/v1` |

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo khóa API tại
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Đặt mô hình mặc định">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
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
Preset onboarding đặt `together/moonshotai/Kimi-K2.5` làm mô hình mặc định.
</Note>

## Danh mục tích hợp sẵn

OpenClaw cung cấp danh mục Together đi kèm này:

| Tham chiếu mô hình                                         | Tên                                    | Đầu vào     | Ngữ cảnh   | Ghi chú                         |
| ---------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | ------------------------------- |
| `together/moonshotai/Kimi-K2.5`                            | Kimi K2.5                              | văn bản, hình ảnh | 262,144    | Mô hình mặc định; đã bật reasoning |
| `together/zai-org/GLM-4.7`                                 | GLM 4.7 Fp8                            | văn bản     | 202,752    | Mô hình văn bản đa dụng         |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         | Llama 3.3 70B Instruct Turbo           | văn bản     | 131,072    | Mô hình chỉ dẫn nhanh           |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`       | Llama 4 Scout 17B 16E Instruct         | văn bản, hình ảnh | 10,000,000 | Đa phương thức                  |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | văn bản, hình ảnh | 20,000,000 | Đa phương thức                  |
| `together/deepseek-ai/DeepSeek-V3.1`                       | DeepSeek V3.1                          | văn bản     | 131,072    | Mô hình văn bản đa dụng         |
| `together/deepseek-ai/DeepSeek-R1`                         | DeepSeek R1                            | văn bản     | 131,072    | Mô hình reasoning               |
| `together/moonshotai/Kimi-K2-Instruct-0905`                | Kimi K2-Instruct 0905                  | văn bản     | 262,144    | Mô hình văn bản Kimi phụ        |

## Tạo video

Plugin `together` đi kèm cũng đăng ký tính năng tạo video thông qua công cụ
`video_generate` dùng chung.

| Thuộc tính           | Giá trị                               |
| -------------------- | ------------------------------------- |
| Mô hình video mặc định | `together/Wan-AI/Wan2.2-T2V-A14B`   |
| Chế độ               | văn bản thành video, tham chiếu một hình ảnh |
| Tham số được hỗ trợ  | `aspectRatio`, `resolution`           |

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
cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Tip>

<AccordionGroup>
  <Accordion title="Ghi chú về môi trường">
    Nếu Gateway chạy như một daemon (launchd/systemd), hãy bảo đảm
    `TOGETHER_API_KEY` có sẵn cho tiến trình đó (ví dụ: trong
    `~/.openclaw/.env` hoặc qua `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với
    các tiến trình gateway do daemon quản lý. Dùng cấu hình `~/.openclaw/.env`
    hoặc `env.shellEnv` để bảo đảm khả dụng lâu dài.
    </Warning>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Xác minh khóa của bạn hoạt động: `openclaw models list --provider together`
    - Nếu mô hình không xuất hiện, hãy xác nhận khóa API được đặt trong đúng
      môi trường cho tiến trình Gateway của bạn.
    - Tham chiếu mô hình dùng dạng `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Quy tắc nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ tạo video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Schema cấu hình đầy đủ, bao gồm cài đặt nhà cung cấp.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Bảng điều khiển Together AI, tài liệu API và giá.
  </Card>
</CardGroup>
