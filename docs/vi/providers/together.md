---
read_when:
    - Bạn muốn sử dụng Together AI với OpenClaw
    - Bạn cần biến môi trường chứa khóa API hoặc lựa chọn xác thực qua CLI
summary: Thiết lập Together AI (xác thực + lựa chọn mô hình)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T08:17:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) cung cấp quyền truy cập vào các mô hình mã nguồn mở hàng đầu,
bao gồm Llama, DeepSeek, Kimi và nhiều mô hình khác, thông qua một API hợp nhất.
OpenClaw tích hợp sẵn dịch vụ này dưới dạng nhà cung cấp `together`.

| Thuộc tính   | Giá trị                       |
| ------------ | ----------------------------- |
| Nhà cung cấp | `together`                    |
| Xác thực     | `TOGETHER_API_KEY`            |
| API          | Tương thích với OpenAI        |
| URL cơ sở    | `https://api.together.xyz/v1` |

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo khóa API tại
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Đặt mô hình mặc định">
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
Quy trình thiết lập ban đầu đặt `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`
làm mô hình mặc định.
</Note>

## Danh mục tích hợp sẵn

Chi phí được tính bằng USD trên mỗi triệu token.

| Tham chiếu mô hình                                  | Tên                          | Đầu vào       | Ngữ cảnh | Đầu ra tối đa | Chi phí (vào/ra) | Ghi chú                  |
| -------------------------------------------------- | ---------------------------- | ------------- | -------- | ------------- | ---------------- | ------------------------ |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | văn bản       | 131,072  | 8,192         | 0.88 / 0.88      | Mô hình mặc định         |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | văn bản, hình ảnh | 262,144 | 32,768        | 1.20 / 4.50      | Mô hình suy luận         |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | văn bản       | 512,000  | 8,192         | 2.10 / 4.40      | Mô hình suy luận         |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | văn bản       | 32,768   | 8,192         | 0.30 / 0.30      | Nhanh, không suy luận    |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | văn bản       | 202,752  | 8,192         | 1.40 / 4.40      | Mô hình suy luận         |

## Tạo video

Plugin `together` được tích hợp sẵn cũng đăng ký tính năng tạo video thông qua
công cụ dùng chung `video_generate`.

| Thuộc tính            | Giá trị                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Mô hình video mặc định | `Wan-AI/Wan2.2-T2V-A14B`                                                                             |
| Các mô hình khác      | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                               |
| Chế độ                | văn bản thành video; chỉ hỗ trợ hình ảnh thành video với `Wan-AI/Wan2.2-I2V-A14B` (một hình tham chiếu) |
| Thời lượng            | 1–10 giây                                                                                            |
| Tham số được hỗ trợ   | `size` (được phân tích theo dạng `<width>x<height>`); không đọc `aspectRatio`/`resolution`            |

Để sử dụng Together làm nhà cung cấp video mặc định:

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
Xem [Tạo video](/vi/tools/video-generation) để biết các tham số của công cụ dùng chung,
cách chọn nhà cung cấp và hành vi chuyển đổi dự phòng.
</Tip>

<AccordionGroup>
  <Accordion title="Lưu ý về môi trường">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy bảo đảm
    `TOGETHER_API_KEY` khả dụng cho tiến trình đó (ví dụ: trong
    `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với
    các tiến trình Gateway do daemon quản lý. Hãy sử dụng cấu hình
    `~/.openclaw/.env` hoặc `env.shellEnv` để duy trì tính khả dụng.
    </Warning>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Xác minh khóa của bạn hoạt động: `openclaw models list --provider together`
    - Nếu các mô hình không xuất hiện, hãy xác nhận khóa API được đặt trong đúng
      môi trường dành cho tiến trình Gateway của bạn.
    - Tham chiếu mô hình sử dụng dạng `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Quy tắc nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số của công cụ tạo video dùng chung và cách chọn nhà cung cấp.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm các thiết lập nhà cung cấp.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Bảng điều khiển, tài liệu API và bảng giá của Together AI.
  </Card>
</CardGroup>
