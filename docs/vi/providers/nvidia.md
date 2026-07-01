---
read_when:
    - Bạn muốn sử dụng các mô hình mở trong OpenClaw miễn phí
    - Bạn cần thiết lập NVIDIA_API_KEY
    - Bạn muốn sử dụng Nemotron 3 Ultra thông qua NVIDIA
summary: Sử dụng API tương thích với OpenAI của NVIDIA trong OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:27:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA cung cấp API tương thích với OpenAI tại `https://integrate.api.nvidia.com/v1` cho
các mô hình mở miễn phí. Xác thực bằng khóa API từ
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
đặt mặc định nhà cung cấp NVIDIA là Nemotron 3 Ultra, mô hình suy luận chủ động
550B tổng / 55B active của NVIDIA cho công việc tác nhân với ngữ cảnh dài.

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API của bạn">
    Tạo khóa API tại [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Xuất khóa và chạy onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Đặt mô hình NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Nếu bạn truyền `--nvidia-api-key` thay vì biến môi trường, giá trị sẽ được ghi vào lịch sử shell
và đầu ra `ps`. Ưu tiên biến môi trường `NVIDIA_API_KEY` khi
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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Danh mục nổi bật

Khi khóa API NVIDIA được cấu hình, các luồng thiết lập và chọn mô hình của OpenClaw
thử dùng danh mục mô hình nổi bật công khai của NVIDIA từ
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` và
lưu kết quả đã xếp hạng trong bộ nhớ đệm trong 24 giờ. Vì vậy, các mô hình nổi bật mới từ build.nvidia.com
sẽ xuất hiện trong các bề mặt thiết lập và chọn mô hình mà không cần chờ
bản phát hành OpenClaw. Khi nguồn cấp trực tiếp khả dụng, mô hình đầu tiên được trả về là
tùy chọn mặc định hiển thị trong quá trình thiết lập NVIDIA.

Quá trình fetch dùng chính sách máy chủ HTTPS cố định cho `assets.ngc.nvidia.com`. Nếu không có
khóa API NVIDIA nào được cấu hình, hoặc nếu danh mục công khai đó không khả dụng hoặc
sai định dạng, OpenClaw sẽ quay về danh mục được đóng gói kèm và mặc định được đóng gói kèm bên dưới.

## Nemotron 3 Ultra

Nemotron 3 Ultra là mô hình NVIDIA mặc định trong OpenClaw. Trang build của NVIDIA cho
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
liệt kê mô hình này là endpoint miễn phí khả dụng với đặc tả ngữ cảnh 1M token.
Danh mục được đóng gói kèm ghi nhận đầu ra tối đa 16.384 token để khớp với yêu cầu mẫu
tương thích OpenAI hiện tại của NVIDIA cho endpoint được lưu trữ.

Dùng Ultra cho mặc định NVIDIA có năng lực cao nhất. Giữ Super được chọn khi
bạn muốn tùy chọn Nemotron 3 nhỏ hơn, hoặc chọn một trong các mô hình bên thứ ba
được lưu trữ trong danh mục của NVIDIA khi ngữ cảnh, độ trễ hoặc hành vi của chúng phù hợp hơn.
Hàng Ultra được đóng gói kèm gửi `chat_template_kwargs.enable_thinking: false` và
`force_nonempty_content: true` theo mặc định để đầu ra trò chuyện thông thường nằm trong
câu trả lời hiển thị thay vì để lộ văn bản suy luận.

## Danh mục dự phòng được đóng gói kèm

| Tham chiếu mô hình                         | Tên                          | Ngữ cảnh  | Đầu ra tối đa | Ghi chú                            |
| ------------------------------------------ | ---------------------------- | --------- | ------------- | ---------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384        | Mặc định                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192         | Dự phòng nổi bật                   |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192         | Dự phòng nổi bật                   |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192         | Dự phòng nổi bật                   |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192         | Dự phòng nổi bật                   |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192         | Đã ngừng khuyến nghị, tương thích nâng cấp |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192         | Đã ngừng khuyến nghị, tương thích nâng cấp |

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Hành vi tự động bật">
    Nhà cung cấp tự động bật khi biến môi trường `NVIDIA_API_KEY` được đặt.
    Không cần cấu hình nhà cung cấp rõ ràng ngoài khóa.
  </Accordion>

  <Accordion title="Danh mục và giá">
    OpenClaw ưu tiên danh mục mô hình nổi bật công khai của NVIDIA khi xác thực NVIDIA được
    cấu hình và lưu vào bộ nhớ đệm trong 24 giờ. Danh mục dự phòng được đóng gói kèm là tĩnh
    và giữ các tham chiếu đã phát hành nhưng đã ngừng khuyến nghị để tương thích nâng cấp. Chi phí mặc định
    là `0` trong mã nguồn vì NVIDIA hiện cung cấp quyền truy cập API miễn phí cho các
    mô hình được liệt kê.
  </Accordion>

  <Accordion title="Endpoint tương thích OpenAI">
    NVIDIA dùng endpoint completions chuẩn `/v1`. Mọi công cụ tương thích OpenAI
    sẽ hoạt động ngay với URL cơ sở của NVIDIA.
  </Accordion>

  <Accordion title="Tham số suy luận Nemotron 3 Ultra">
    Yêu cầu mẫu Ultra của NVIDIA dùng `chat_template_kwargs.enable_thinking`
    và `reasoning_budget` cho đầu ra suy luận. Hàng Ultra được đóng gói kèm của OpenClaw
    tắt suy nghĩ theo mẫu theo mặc định cho mục đích trò chuyện thông thường. Nếu bạn cần
    chọn dùng đầu ra suy luận của NVIDIA hoặc buộc các trường yêu cầu đặc thù NVIDIA khác,
    hãy đặt tham số theo từng mô hình và giữ các ghi đè đặc thù nhà cung cấp trong phạm vi
    mô hình NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` là ghi đè thân yêu cầu tương thích OpenAI cuối cùng, vì vậy
    chỉ dùng nó cho các trường mà NVIDIA tài liệu hóa cho endpoint đã chọn.

  </Accordion>

  <Accordion title="Phản hồi chậm từ nhà cung cấp tùy chỉnh">
    Một số mô hình tùy chỉnh được lưu trữ trên NVIDIA có thể mất nhiều thời gian hơn bộ giám sát nhàn rỗi
    mặc định của mô hình trước khi chúng phát ra mảnh phản hồi đầu tiên. Với các mục nhà cung cấp NVIDIA
    tùy chỉnh, hãy tăng thời gian chờ của nhà cung cấp thay vì tăng toàn bộ thời gian chờ
    runtime tác nhân:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
Các mô hình NVIDIA hiện miễn phí để sử dụng. Kiểm tra
[build.nvidia.com](https://build.nvidia.com/) để biết tình trạng khả dụng mới nhất và
chi tiết giới hạn tốc độ.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho tác nhân, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
