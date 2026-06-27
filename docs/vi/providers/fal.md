---
read_when:
    - Bạn muốn sử dụng tính năng tạo hình ảnh fal trong OpenClaw
    - Bạn cần luồng xác thực FAL_KEY
    - Bạn muốn các giá trị mặc định của fal cho image_generate, video_generate hoặc music_generate
summary: Thiết lập tạo hình ảnh, video và nhạc fal trong OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:03:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw cung cấp một provider `fal` được đóng gói sẵn để tạo hình ảnh, video và nhạc
được lưu trữ.

| Thuộc tính | Giá trị                                                       |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Xác thực | `FAL_KEY` (chuẩn; `FAL_API_KEY` cũng hoạt động như phương án dự phòng) |
| API      | endpoint mô hình fal                                          |

## Bắt đầu

<Steps>
  <Step title="Đặt API key">
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

Provider tạo hình ảnh `fal` được đóng gói sẵn mặc định là
`fal/fal-ai/flux/dev`.

| Khả năng       | Giá trị                                                             |
| -------------- | ------------------------------------------------------------------ |
| Số hình ảnh tối đa | 4 mỗi yêu cầu; Krea 2: 1 mỗi yêu cầu                           |
| Chế độ chỉnh sửa | Flux: 1 hình ảnh tham chiếu; GPT Image 2: 10; Nano Banana 2: 14 |
| Tham chiếu phong cách | Krea 2: tối đa 10 tham chiếu phong cách qua `image` / `images` |
| Ghi đè kích thước | Được hỗ trợ                                                    |
| Tỷ lệ khung hình | Được hỗ trợ cho tạo mới, Krea 2 và chỉnh sửa GPT Image 2/Nano Banana 2 |
| Độ phân giải   | Được hỗ trợ                                                        |
| Định dạng đầu ra | `png` hoặc `jpeg`                                                |

<Warning>
Các yêu cầu hình-ảnh-sang-hình-ảnh của Flux **không** hỗ trợ ghi đè
`aspectRatio`. Các yêu cầu chỉnh sửa GPT Image 2 và Nano Banana 2 dùng endpoint
`/edit` của fal và chấp nhận gợi ý tỷ lệ khung hình. Nano Banana 2 cũng chấp
nhận các tỷ lệ rộng/cao native bổ sung như `4:1`, `1:4`, `8:1` và `1:8`; Krea 2
xác thực tập con tỷ lệ khung hình nhỏ hơn của riêng nó.
</Warning>

Các mô hình Krea 2 dùng schema payload Krea native của fal. OpenClaw gửi
`aspect_ratio`, `creativity` và `image_style_references` thay vì payload
`image_size` / endpoint chỉnh sửa chung mà Flux dùng. Các tham chiếu mô hình là:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Dùng Medium để tạo minh họa biểu cảm, anime, tranh vẽ và phong cách nghệ thuật
nhanh hơn. Dùng Large cho hình ảnh photoreal chậm hơn, texture thô, hạt phim và
diện mạo chi tiết. Krea mặc định là `fal.creativity: "medium"`; các giá trị được
hỗ trợ là `raw`, `low`, `medium` và `high`.

Krea 2 hiển thị tỷ lệ khung hình, không phải `image_size`, trong schema yêu cầu
của fal. Ưu tiên `aspectRatio`; OpenClaw ánh xạ `size` tới tỷ lệ khung hình Krea
được hỗ trợ gần nhất và từ chối `resolution` cho Krea thay vì bỏ qua nó.

Dùng `outputFormat: "png"` khi bạn muốn đầu ra PNG từ các mô hình fal có
`output_format`. fal không khai báo điều khiển nền trong suốt rõ ràng trong
OpenClaw, nên `background: "transparent"` được báo cáo là một ghi đè bị bỏ qua
cho các mô hình fal.
Các endpoint Krea 2 không hiển thị trường yêu cầu `output_format` qua fal, nên
OpenClaw từ chối ghi đè `outputFormat` cho các yêu cầu Krea.

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

Để dùng Krea 2 Medium:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## Tạo video

Provider tạo video `fal` được đóng gói sẵn mặc định là
`fal/fal-ai/minimax/video-01-live`.

| Khả năng | Giá trị                                                            |
| ---------- | ------------------------------------------------------------------ |
| Chế độ      | Text-to-video, tham chiếu một hình ảnh, Seedance reference-to-video |
| Runtime    | Luồng gửi/trạng thái/kết quả dựa trên hàng đợi cho tác vụ chạy lâu |

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

  <Accordion title="Ví dụ cấu hình Seedance 2.0 reference-to-video">
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

    Reference-to-video chấp nhận tối đa 9 hình ảnh, 3 video và 3 tham chiếu âm thanh
    thông qua các tham số `images`, `videos` và `audioRefs` dùng chung của
    `video_generate`, với tổng cộng tối đa 12 tệp tham chiếu.

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

## Tạo nhạc

Plugin `fal` được đóng gói sẵn cũng đăng ký một provider tạo nhạc cho công cụ
`music_generate` dùng chung.

| Khả năng       | Giá trị                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Mô hình mặc định | `fal/fal-ai/minimax-music/v2.6`                                                                     |
| Mô hình        | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Runtime       | Yêu cầu đồng bộ cộng với tải xuống âm thanh đã tạo                                                      |

Dùng fal làm provider nhạc mặc định:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` hỗ trợ lời bài hát rõ ràng và chế độ nhạc không lời.
ACE-Step và Stable Audio là các endpoint prompt-to-audio; chọn chúng bằng ghi đè
`model` khi bạn muốn dùng các họ mô hình đó.

<Tip>
Dùng `openclaw models list --provider fal` để xem danh sách đầy đủ các mô hình
fal có sẵn, bao gồm mọi mục được thêm gần đây.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tham số công cụ hình ảnh dùng chung và lựa chọn provider.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn provider.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Tham số công cụ nhạc dùng chung và lựa chọn provider.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Mặc định của agent bao gồm lựa chọn mô hình hình ảnh, video và nhạc.
  </Card>
</CardGroup>
