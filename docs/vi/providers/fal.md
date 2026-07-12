---
read_when:
    - Bạn muốn sử dụng tính năng tạo hình ảnh của fal trong OpenClaw
    - Bạn cần quy trình xác thực `FAL_KEY`
    - Bạn muốn dùng các giá trị mặc định của fal cho image_generate, video_generate hoặc music_generate
summary: thiết lập tạo hình ảnh, video và âm nhạc bằng fal trong OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-12T08:17:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw cung cấp sẵn provider `fal` để tạo hình ảnh, video và âm nhạc
trên dịch vụ lưu trữ.

| Thuộc tính | Giá trị                                                                         |
| ---------- | ------------------------------------------------------------------------------- |
| Provider   | `fal`                                                                           |
| Xác thực   | `FAL_KEY` (chuẩn; `FAL_API_KEY` cũng hoạt động như phương án dự phòng)          |
| API        | Các endpoint mô hình fal (`https://fal.run`; tác vụ video dùng `https://queue.fal.run`) |
| URL cơ sở  | Ghi đè bằng `models.providers.fal.baseUrl`                                      |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Thiết lập không tương tác có thể truyền `--fal-api-key <key>` hoặc xuất `FAL_KEY`.
    Quá trình hướng dẫn ban đầu cũng đặt `fal/fal-ai/flux/dev` làm mô hình hình ảnh mặc định khi
    chưa có mô hình nào được cấu hình.

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

Provider tạo hình ảnh `fal` đi kèm mặc định sử dụng
`fal/fal-ai/flux/dev`.

| Khả năng              | Giá trị                                                            |
| --------------------- | ------------------------------------------------------------------ |
| Số hình ảnh tối đa    | 4 cho mỗi yêu cầu; Krea 2: 1 cho mỗi yêu cầu                       |
| Ghi đè kích thước     | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`    |
| Tỷ lệ khung hình      | Được hỗ trợ ở mọi nơi ngoại trừ chuyển hình ảnh thành hình ảnh bằng Flux |
| Độ phân giải          | `1K`, `2K`, `4K` (các giới hạn theo mô hình ở bên dưới)            |
| Định dạng đầu ra      | `png` (mặc định) hoặc `jpeg`; Krea 2 từ chối ghi đè `outputFormat` |

Các yêu cầu chỉnh sửa (hình ảnh tham chiếu qua tham số dùng chung `image` / `images`)
được định tuyến tới endpoint chỉnh sửa riêng của từng mô hình với giới hạn tham chiếu theo mô hình:

| Dòng mô hình                 | Tham chiếu mô hình sau `fal/`             | Endpoint chỉnh sửa | Số hình ảnh tham chiếu tối đa |
| --------------------------- | ----------------------------------------- | ------------------ | ----------------------------- |
| Flux và các mô hình fal khác | `fal-ai/flux/dev` (mặc định)              | `/image-to-image`  | 1                             |
| GPT Image                   | `openai/gpt-image-*`                      | `/edit`            | 10                            |
| Grok Imagine                | `xai/grok-imagine-image`                  | `/edit`            | 3                             |
| Nano Banana (cũ)            | `fal-ai/nano-banana`                      | `/edit`            | 3                             |
| Nano Banana 2               | `fal-ai/nano-banana-*`                    | `/edit`            | 14                            |
| Nano Banana 2 Lite          | `google/nano-banana-2-lite`               | `/edit`            | 14                            |
| Krea 2                      | `krea/v2/{medium,large}/text-to-image`    | không có (tham chiếu phong cách) | 10 tham chiếu phong cách |

<Warning>
Các yêu cầu chuyển hình ảnh thành hình ảnh bằng Flux **không** hỗ trợ ghi đè `aspectRatio`. Các yêu cầu chỉnh sửa GPT
Image và Nano Banana 2 sử dụng endpoint `/edit` của fal và chấp nhận
gợi ý tỷ lệ khung hình. Nano Banana 2 cũng chấp nhận thêm các tỷ lệ ngang/dọc đặc thù
như `4:1`, `1:4`, `8:1` và `1:8`; Krea 2 xác thực tập con
tỷ lệ khung hình nhỏ hơn của riêng mình. Grok Imagine có danh sách tỷ lệ riêng (bao gồm `2:1`,
`20:9`, `19.5:9` và các tỷ lệ đảo ngược) và chỉ chấp nhận độ phân giải `1K`/`2K`;
Nano Banana cũ và Nano Banana 2 Lite từ chối ghi đè `resolution`.
</Warning>

Các mô hình Krea 2 sử dụng lược đồ payload Krea gốc của fal. OpenClaw gửi
`aspect_ratio`, `creativity` và `image_style_references` thay cho
payload `image_size` / endpoint chỉnh sửa dùng chung mà Flux sử dụng. Các tham chiếu mô hình là:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Dùng Medium để tạo nhanh hơn các phong cách minh họa giàu biểu cảm, anime, hội họa và nghệ thuật.
Dùng Large để tạo chậm hơn các phong cách chân thực như ảnh, kết cấu thô, hạt phim và
hình ảnh chi tiết. Krea mặc định dùng `fal.creativity: "medium"`; các giá trị được hỗ trợ là
`raw`, `low`, `medium` và `high`.

Krea 2 cung cấp tỷ lệ khung hình, không phải `image_size`, trong lược đồ yêu cầu của fal. Nên ưu tiên
`aspectRatio`; OpenClaw ánh xạ `size` sang tỷ lệ khung hình Krea được hỗ trợ gần nhất
và từ chối `resolution` đối với Krea thay vì bỏ qua giá trị này.

Dùng `outputFormat: "png"` khi bạn muốn đầu ra PNG từ các mô hình fal có cung cấp
`output_format`. fal không khai báo cơ chế điều khiển nền trong suốt rõ ràng
trong OpenClaw, vì vậy `background: "transparent"` được báo cáo là một ghi đè bị bỏ qua
đối với các mô hình fal.
Các endpoint Krea 2 không cung cấp trường yêu cầu `output_format` thông qua fal, vì vậy
OpenClaw từ chối ghi đè `outputFormat` cho các yêu cầu Krea.

Để sử dụng Krea 2 Medium:

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

Provider tạo video `fal` đi kèm mặc định sử dụng
`fal/fal-ai/minimax/video-01-live`.

| Khả năng       | Giá trị                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| Chế độ         | Văn bản thành video, tham chiếu một hình ảnh, tham chiếu thành video bằng Seedance |
| Thời gian chạy | Quy trình gửi/trạng thái/kết quả dựa trên hàng đợi cho các tác vụ chạy lâu  |
| Thời gian chờ  | Mặc định 20 phút cho mỗi tác vụ; truy vấn trạng thái mỗi 5 giây             |

<AccordionGroup>
  <Accordion title="Các mô hình video có sẵn">
    **MiniMax (mặc định):**

    - `fal/fal-ai/minimax/video-01-live`

    **Tác nhân video HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling và Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    Các yêu cầu MiniMax Live và HeyGen chỉ gửi câu lệnh cùng một hình ảnh tham chiếu
    tùy chọn; các ghi đè khác không được chuyển tiếp. Các mô hình Seedance
    chấp nhận `aspectRatio`, `size`, `resolution`, thời lượng từ 4 đến 15 giây và
    tùy chọn bật/tắt âm thanh.

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

  <Accordion title="Ví dụ cấu hình tham chiếu thành video bằng Seedance 2.0">
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

    Chế độ tham chiếu thành video chấp nhận tối đa 9 hình ảnh, 3 video và 3 tham chiếu âm thanh
    thông qua các tham số dùng chung `images`, `videos` và `audioRefs` của `video_generate`,
    với tổng cộng tối đa 12 tệp tham chiếu. Tham chiếu âm thanh yêu cầu
    ít nhất một hình ảnh hoặc video tham chiếu trong cùng yêu cầu.

  </Accordion>

  <Accordion title="Ví dụ cấu hình tác nhân video HeyGen">
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

## Tạo âm nhạc

Plugin `fal` đi kèm cũng đăng ký một provider tạo âm nhạc cho
công cụ dùng chung `music_generate`.

| Khả năng          | Giá trị                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Mô hình mặc định  | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| Các mô hình       | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Thời lượng tối đa | 240 giây                                                                                                                 |
| Thời gian chạy    | Yêu cầu đồng bộ kết hợp tải xuống âm thanh đã tạo                                                                        |

Dùng fal làm provider âm nhạc mặc định:

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

`fal-ai/minimax-music/v2.6` hỗ trợ lời bài hát rõ ràng và chế độ không lời,
nhưng không hỗ trợ cả hai trong cùng một yêu cầu. ACE-Step và Stable Audio là các
endpoint chuyển câu lệnh thành âm thanh; chọn chúng bằng ghi đè `model` khi bạn muốn
sử dụng các dòng mô hình đó. ACE-Step từ chối lời bài hát rõ ràng; Stable Audio từ chối
cả lời bài hát lẫn chế độ không lời.

<Tip>
Các bảng và mục thu gọn ở trên đề cập đến những dòng mô hình mà provider fal
đi kèm xử lý đặc biệt. Vẫn có thể chọn các mã định danh endpoint hình ảnh fal khác
làm mô hình hình ảnh; chúng được xử lý giống Flux (payload `image_size` dùng chung, một
hình ảnh tham chiếu qua `/image-to-image`).
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Các tham số công cụ hình ảnh dùng chung và lựa chọn provider.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn provider.
  </Card>
  <Card title="Tạo âm nhạc" href="/vi/tools/music-generation" icon="music">
    Các tham số công cụ âm nhạc dùng chung và lựa chọn provider.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Các giá trị mặc định của tác nhân, bao gồm lựa chọn mô hình hình ảnh, video và âm nhạc.
  </Card>
</CardGroup>
