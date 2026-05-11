---
read_when:
    - Bạn muốn sử dụng tính năng tạo hình ảnh của fal trong OpenClaw
    - Bạn cần luồng xác thực `FAL_KEY`
    - Bạn muốn các giá trị mặc định của fal cho image_generate hoặc video_generate
summary: thiết lập tạo hình ảnh và video bằng fal trong OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:34:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw đi kèm một provider `fal` tích hợp sẵn cho tạo hình ảnh và video được lưu trữ.

| Thuộc tính | Giá trị                                                       |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Xác thực     | `FAL_KEY` (chuẩn; `FAL_API_KEY` cũng hoạt động làm phương án dự phòng) |
| API      | endpoint mô hình fal                                           |

## Bắt đầu

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Set a default image model">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Tạo hình ảnh

Provider tạo hình ảnh `fal` tích hợp sẵn mặc định dùng
`fal/fal-ai/flux/dev`.

| Khả năng     | Giá trị                                                       |
| -------------- | ----------------------------------------------------------- |
| Số hình ảnh tối đa     | 4 mỗi yêu cầu                                               |
| Chế độ chỉnh sửa      | Flux: 1 hình ảnh tham chiếu; GPT Image 2: 10; Nano Banana 2: 14 |
| Ghi đè kích thước | Được hỗ trợ                                                   |
| Tỷ lệ khung hình   | Được hỗ trợ cho tạo mới và chỉnh sửa GPT Image 2/Nano Banana 2   |
| Độ phân giải     | Được hỗ trợ                                                   |
| Định dạng đầu ra  | `png` hoặc `jpeg`                                             |

<Warning>
Yêu cầu chuyển hình ảnh thành hình ảnh của Flux **không** hỗ trợ ghi đè `aspectRatio`. Yêu cầu chỉnh sửa GPT
Image 2 và Nano Banana 2 dùng endpoint `/edit` của fal và chấp nhận
gợi ý tỷ lệ khung hình.
</Warning>

Dùng `outputFormat: "png"` khi bạn muốn đầu ra PNG. fal không khai báo cơ chế
điều khiển nền trong suốt rõ ràng trong OpenClaw, nên `background:
"transparent"` được báo cáo là một ghi đè bị bỏ qua đối với các mô hình fal.

Để dùng fal làm provider hình ảnh mặc định:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Tạo video

Provider tạo video `fal` tích hợp sẵn mặc định dùng
`fal/fal-ai/minimax/video-01-live`.

| Khả năng | Giá trị                                                              |
| ---------- | ------------------------------------------------------------------ |
| Chế độ      | Văn bản thành video, tham chiếu một hình ảnh, tham chiếu Seedance thành video |
| Runtime    | Luồng gửi/trạng thái/kết quả dựa trên hàng đợi cho các tác vụ chạy lâu       |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Seedance 2.0 reference-to-video config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Chuyển tham chiếu thành video chấp nhận tối đa 9 hình ảnh, 3 video và 3 tham chiếu âm thanh
    thông qua các tham số `video_generate` dùng chung là `images`, `videos` và `audioRefs`,
    với tổng cộng tối đa 12 tệp tham chiếu.

  </Accordion>

  <Accordion title="HeyGen video-agent config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
Dùng `openclaw models list --provider fal` để xem danh sách đầy đủ các mô hình fal
hiện có, bao gồm mọi mục mới được thêm gần đây.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Image generation" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và lựa chọn provider.
  </Card>
  <Card title="Video generation" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn provider.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Mặc định của agent, bao gồm lựa chọn mô hình hình ảnh và video.
  </Card>
</CardGroup>
