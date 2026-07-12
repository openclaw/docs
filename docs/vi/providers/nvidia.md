---
read_when:
    - Bạn muốn sử dụng miễn phí các mô hình mở trong OpenClaw
    - Bạn cần thiết lập `NVIDIA_API_KEY`
    - Bạn muốn sử dụng Nemotron 3 Ultra thông qua NVIDIA
summary: Sử dụng API tương thích với OpenAI của NVIDIA trong OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T08:16:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA cung cấp miễn phí các mô hình mở thông qua API tương thích với OpenAI tại
`https://integrate.api.nvidia.com/v1`, được xác thực bằng khóa API từ
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
mặc định dùng Nemotron 3 Ultra cho nhà cung cấp NVIDIA, mô hình suy luận có tổng
550B tham số / 55B tham số hoạt động của NVIDIA dành cho tác vụ tác tử có ngữ cảnh dài.

## Bắt đầu

<Steps>
  <Step title="Lấy khóa API">
    Tạo khóa API tại [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Xuất khóa và chạy quy trình thiết lập ban đầu">
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

Để thiết lập không tương tác, hãy truyền trực tiếp khóa:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` lưu khóa vào lịch sử shell và đầu ra `ps`. Khi có thể, nên dùng
biến môi trường `NVIDIA_API_KEY`.
</Warning>

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

Khi khóa API NVIDIA được cấu hình, các luồng thiết lập và chọn mô hình sẽ tải
danh mục mô hình nổi bật công khai của NVIDIA từ
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` và
lưu kết quả vào bộ nhớ đệm trong 24 giờ (32 mục đầu tiên, được nhập dưới dạng
các hàng đầu vào văn bản miễn phí). Vì vậy, các mô hình nổi bật mới từ
build.nvidia.com sẽ xuất hiện trong các giao diện thiết lập và chọn mô hình mà
không cần chờ bản phát hành OpenClaw. Khi nguồn cấp dữ liệu trực tiếp khả dụng,
mô hình đầu tiên được trả về sẽ là tùy chọn được chọn sẵn trong quá trình thiết
lập NVIDIA.

Quá trình tải sử dụng chính sách máy chủ HTTPS cố định cho
`assets.ngc.nvidia.com`. Nếu không có khóa API NVIDIA được cấu hình, hoặc nếu
nguồn cấp dữ liệu không khả dụng hay không đúng định dạng, OpenClaw sẽ dùng danh
mục đi kèm và giá trị mặc định đi kèm bên dưới.

## Nemotron 3 Ultra

Nemotron 3 Ultra là mô hình NVIDIA mặc định trong OpenClaw. Trang build của NVIDIA
cho [`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
liệt kê mô hình này là điểm cuối miễn phí khả dụng với đặc tả ngữ cảnh 1 triệu token.

Hàng Ultra đi kèm gửi
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
theo mặc định để đầu ra trò chuyện thông thường nằm trong câu trả lời hiển thị
thay vì làm lộ văn bản suy luận.

Dùng Ultra để có tùy chọn NVIDIA mặc định với năng lực cao nhất. Giữ Super được
chọn khi bạn muốn tùy chọn Nemotron 3 nhỏ hơn, hoặc chọn một trong các mô hình
bên thứ ba được lưu trữ trong danh mục của NVIDIA khi ngữ cảnh, độ trễ hoặc hành
vi của chúng phù hợp hơn.

## Danh mục dự phòng đi kèm

Các hàng đi kèm có thể chọn là bản chụp danh mục mô hình nổi bật của NVIDIA. Các
hàng tương thích đã ngừng khuyến nghị vẫn có thể được phân giải bằng tham chiếu
chính xác nhưng không xuất hiện trong bộ chọn mô hình.

| Tham chiếu mô hình                        | Tên                   | Ngữ cảnh  | Đầu ra tối đa |
| ------------------------------------------ | --------------------- | --------- | ------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192        |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192        |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192        |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192        |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192        |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384       |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384       |

Danh mục tương thích đầy đủ cũng giữ lại các tham chiếu đã phát hành sau đây cho
các cấu hình hiện có: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` và
`nvidia/minimaxai/minimax-m2.7`. Chúng vẫn khả dụng qua tham chiếu chính xác
nhưng không bao giờ xuất hiện trong quy trình thiết lập ban đầu hoặc bộ chọn mô hình.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Hành vi tự động bật">
    Nhà cung cấp tự động được bật khi biến môi trường `NVIDIA_API_KEY` được đặt
    hoặc khi khóa đã được lưu trong quá trình thiết lập ban đầu. Ngoài khóa,
    không cần cấu hình nhà cung cấp rõ ràng nào khác.
  </Accordion>

  <Accordion title="Danh mục và giá">
    OpenClaw ưu tiên danh mục mô hình nổi bật công khai của NVIDIA khi thông tin
    xác thực NVIDIA được cấu hình và lưu danh mục này vào bộ nhớ đệm trong 24 giờ.
    Danh mục dự phòng đi kèm có thể chọn là bản chụp tĩnh của danh mục mô hình nổi
    bật của NVIDIA; các hàng tương thích theo tham chiếu chính xác đã ngừng khuyến
    nghị sẽ bị ẩn khỏi bộ chọn mô hình. Chi phí mặc định là `0` trong mã nguồn vì
    NVIDIA hiện cung cấp quyền truy cập API miễn phí cho các mô hình được liệt kê.
  </Accordion>

  <Accordion title="Điểm cuối tương thích với OpenAI">
    OpenClaw giao tiếp với NVIDIA bằng bộ điều hợp `openai-completions` qua tuyến
    hoàn thành trò chuyện `/v1` tiêu chuẩn. Mọi công cụ tương thích với OpenAI
    đều có thể hoạt động ngay với URL cơ sở của NVIDIA.
  </Accordion>

  <Accordion title="Tham số suy luận của Nemotron 3 Ultra">
    Yêu cầu mẫu Ultra của NVIDIA sử dụng `chat_template_kwargs.enable_thinking`
    và `reasoning_budget` cho đầu ra suy luận. Hàng Ultra đi kèm của OpenClaw
    mặc định tắt suy luận theo mẫu khi trò chuyện thông thường. Nếu cần bật đầu
    ra suy luận của NVIDIA hoặc buộc sử dụng các trường yêu cầu khác dành riêng
    cho NVIDIA, hãy đặt tham số theo từng mô hình và giới hạn các giá trị ghi đè
    dành riêng cho nhà cung cấp trong phạm vi mô hình NVIDIA:

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

    `params.chat_template_kwargs` được hợp nhất vào mọi `chat_template_kwargs`
    đã có trong yêu cầu thay vì thay thế toàn bộ đối tượng.
    `params.extra_body` là giá trị ghi đè cuối cùng cho phần thân yêu cầu tương
    thích với OpenAI và sẽ ghi đè các khóa tải trọng trùng nhau, vì vậy chỉ dùng
    nó cho các trường mà NVIDIA cung cấp tài liệu cho điểm cuối đã chọn.

  </Accordion>

  <Accordion title="Phản hồi chậm từ nhà cung cấp tùy chỉnh">
    Một số mô hình tùy chỉnh do NVIDIA lưu trữ có thể mất nhiều thời gian hơn
    khoảng 120 giây mặc định của bộ giám sát trạng thái chờ mô hình trước khi
    phát ra đoạn phản hồi đầu tiên. Đối với các mục nhà cung cấp NVIDIA tùy chỉnh,
    hãy tăng thời gian chờ của nhà cung cấp thay vì thời gian chờ của toàn bộ môi
    trường chạy tác tử; `timeoutSeconds` áp dụng cho các yêu cầu HTTP của nhà
    cung cấp và tăng ngưỡng của bộ giám sát trạng thái chờ/luồng cho nhà cung cấp đó:

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
Các mô hình NVIDIA hiện được sử dụng miễn phí. Hãy kiểm tra
[build.nvidia.com](https://build.nvidia.com/) để biết thông tin mới nhất về khả
dụng và giới hạn tốc độ.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ cho tác tử, mô hình và nhà cung cấp.
  </Card>
</CardGroup>
