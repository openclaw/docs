---
read_when:
    - Bạn muốn sử dụng các mô hình mở trong OpenClaw miễn phí
    - Bạn cần thiết lập NVIDIA_API_KEY
summary: Sử dụng API tương thích với OpenAI của NVIDIA trong OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-29T23:07:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA cung cấp API tương thích với OpenAI tại `https://integrate.api.nvidia.com/v1` cho
các mô hình mở miễn phí. Xác thực bằng khóa API từ
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Bắt đầu

<Steps>
  <Step title="Nhận khóa API của bạn">
    Tạo khóa API tại [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Xuất khóa và chạy onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Đặt một mô hình NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Nếu bạn truyền `--nvidia-api-key` thay vì biến môi trường, giá trị sẽ nằm trong lịch sử
shell và đầu ra `ps`. Nên dùng biến môi trường `NVIDIA_API_KEY` khi
có thể.
</Warning>

Để thiết lập không tương tác, bạn cũng có thể truyền khóa trực tiếp:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Ví dụ cấu hình

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Danh mục tích hợp sẵn

| Tham chiếu mô hình                        | Tên                          | Ngữ cảnh | Đầu ra tối đa |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Hành vi tự động bật">
    Nhà cung cấp tự động bật khi biến môi trường `NVIDIA_API_KEY` được đặt.
    Không cần cấu hình nhà cung cấp rõ ràng ngoài khóa.
  </Accordion>

  <Accordion title="Danh mục và giá">
    Danh mục đi kèm là tĩnh. Chi phí mặc định là `0` trong mã nguồn vì NVIDIA
    hiện cung cấp quyền truy cập API miễn phí cho các mô hình được liệt kê.
  </Accordion>

  <Accordion title="Điểm cuối tương thích với OpenAI">
    NVIDIA sử dụng điểm cuối completions `/v1` tiêu chuẩn. Mọi công cụ tương thích với OpenAI
    sẽ hoạt động ngay với URL cơ sở của NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Các mô hình NVIDIA hiện đang được sử dụng miễn phí. Kiểm tra
[build.nvidia.com](https://build.nvidia.com/) để biết tình trạng khả dụng mới nhất và
chi tiết về giới hạn tốc độ.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho tác nhân, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
