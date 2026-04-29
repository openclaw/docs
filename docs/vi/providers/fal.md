---
read_when:
    - Bạn muốn sử dụng tính năng tạo hình ảnh bằng fal trong OpenClaw
    - Bạn cần luồng xác thực FAL_KEY
    - Bạn muốn các giá trị mặc định của fal cho image_generate hoặc video_generate
summary: Thiết lập tạo hình ảnh và video bằng fal trong OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-29T23:06:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw đi kèm nhà cung cấp `fal` tích hợp sẵn cho tính năng tạo hình ảnh và video được lưu trữ.

| Thuộc tính | Giá trị                                                               |
| ---------- | --------------------------------------------------------------------- |
| Nhà cung cấp | `fal`                                                               |
| Xác thực   | `FAL_KEY` (chuẩn; `FAL_API_KEY` cũng hoạt động như phương án dự phòng) |
| API        | điểm cuối mô hình fal                                                 |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Đặt mô hình hình ảnh mặc định">
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

Nhà cung cấp tạo hình ảnh `fal` tích hợp sẵn mặc định dùng
`fal/fal-ai/flux/dev`.

| Khả năng        | Giá trị                      |
| --------------- | ---------------------------- |
| Số hình tối đa  | 4 cho mỗi yêu cầu            |
| Chế độ chỉnh sửa | Đã bật, 1 hình ảnh tham chiếu |
| Ghi đè kích thước | Được hỗ trợ                |
| Tỷ lệ khung hình | Được hỗ trợ                 |
| Độ phân giải    | Được hỗ trợ                  |
| Định dạng đầu ra | `png` hoặc `jpeg`           |

<Warning>
Điểm cuối chỉnh sửa hình ảnh của fal **không** hỗ trợ ghi đè `aspectRatio`.
</Warning>

Dùng `outputFormat: "png"` khi bạn muốn đầu ra PNG. fal không khai báo cơ chế
điều khiển nền trong suốt rõ ràng trong OpenClaw, nên `background:
"transparent"` được báo cáo là ghi đè bị bỏ qua đối với các mô hình fal.

Để dùng fal làm nhà cung cấp hình ảnh mặc định:

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

Nhà cung cấp tạo video `fal` tích hợp sẵn mặc định dùng
`fal/fal-ai/minimax/video-01-live`.

| Khả năng | Giá trị                                                              |
| -------- | -------------------------------------------------------------------- |
| Chế độ   | Văn bản thành video, tham chiếu một hình ảnh, tham chiếu Seedance thành video |
| Thời gian chạy | Luồng gửi/trạng thái/kết quả dựa trên hàng đợi cho tác vụ chạy lâu |

<AccordionGroup>
  <Accordion title="Các mô hình video có sẵn">
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

  <Accordion title="Ví dụ cấu hình Seedance 2.0">
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

  <Accordion title="Ví dụ cấu hình tham chiếu thành video của Seedance 2.0">
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

    Tham chiếu thành video chấp nhận tối đa 9 hình ảnh, 3 video và 3 tham chiếu âm thanh
    thông qua các tham số `images`, `videos` và `audioRefs` dùng chung của `video_generate`,
    với tối đa 12 tệp tham chiếu tổng cộng.

  </Accordion>

  <Accordion title="Ví dụ cấu hình HeyGen video-agent">
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
có sẵn, bao gồm mọi mục mới được thêm gần đây.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Mặc định của tác tử, bao gồm lựa chọn mô hình hình ảnh và video.
  </Card>
</CardGroup>
