---
read_when:
    - Bạn muốn dùng tính năng tạo video PixVerse trong OpenClaw
    - Bạn cần thiết lập khóa API/biến môi trường PixVerse
    - Bạn muốn đặt PixVerse làm nhà cung cấp video mặc định
summary: Thiết lập tạo video PixVerse trong OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:05:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw cung cấp `pixverse` như một Plugin bên ngoài chính thức cho việc tạo video PixVerse được lưu trữ. Plugin đăng ký nhà cung cấp `pixverse` theo hợp đồng `videoGenerationProviders`.

| Thuộc tính          | Giá trị                                                              |
| ------------------ | -------------------------------------------------------------------- |
| ID nhà cung cấp     | `pixverse`                                                           |
| Gói Plugin          | `@openclaw/pixverse-provider`                                        |
| Biến môi trường xác thực | `PIXVERSE_API_KEY`                                                   |
| Cờ onboarding       | `--auth-choice pixverse-api-key`                                     |
| Cờ CLI trực tiếp    | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2 (gửi `video_id` kèm thăm dò kết quả) |
| Mô hình mặc định    | `pixverse/v6`                                                        |
| Vùng API mặc định   | Quốc tế                                                        |

## Bắt đầu

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Trình hướng dẫn hỏi có dùng endpoint Quốc tế
    (`https://app-api.pixverse.ai/openapi/v2`) hay endpoint CN
    (`https://app-api.pixverseai.cn/openapi/v2`) trước khi ghi `region` và
    `baseUrl` vào cấu hình nhà cung cấp.

  </Step>
  <Step title="Set PixVerse as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Generate a video">
    Yêu cầu agent tạo video. PixVerse sẽ được dùng tự động.
  </Step>
</Steps>

## Chế độ và mô hình được hỗ trợ

Nhà cung cấp phơi bày các mô hình tạo video của PixVerse thông qua công cụ video dùng chung của OpenClaw.

| Chế độ          | Mô hình              | Đầu vào tham chiếu      |
| -------------- | -------------------- | ----------------------- |
| Văn bản thành video | `v6` (mặc định), `c1` | Không có                    |
| Hình ảnh thành video | `v6` (mặc định), `c1` | 1 hình ảnh cục bộ hoặc từ xa |

Tham chiếu hình ảnh cục bộ được tải lên PixVerse trước yêu cầu hình ảnh thành video. URL hình ảnh từ xa được chuyển qua endpoint tải lên hình ảnh của PixVerse dưới dạng `image_url`.

| Tùy chọn        | Giá trị được hỗ trợ                                                        |
| --------------- | --------------------------------------------------------------------------- |
| Thời lượng      | 1-15 giây                                                                |
| Độ phân giải    | `360P`, `540P`, `720P`, `1080P`                                             |
| Tỷ lệ khung hình | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` cho văn bản thành video |
| Âm thanh được tạo | `audio: true`                                                               |

<Note>
Tạo mẫu hình ảnh PixVerse chưa được phơi bày qua `image_generate`. API đó được điều khiển bằng template-id, trong khi hợp đồng tạo hình ảnh dùng chung của OpenClaw hiện chưa có túi tùy chọn định kiểu riêng cho PixVerse.
</Note>

## Tùy chọn nhà cung cấp

Nhà cung cấp video chấp nhận các khóa tùy chọn riêng cho nhà cung cấp sau:

| Tùy chọn                             | Kiểu   | Tác dụng                         |
| ------------------------------------ | ------ | --------------------------------- |
| `seed`                               | number | Seed xác định khi được hỗ trợ |
| `negativePrompt` / `negative_prompt` | string | Prompt phủ định                  |
| `quality`                            | string | Chất lượng PixVerse như `720p`   |
| `motionMode` / `motion_mode`         | string | Chế độ chuyển động hình ảnh thành video |
| `cameraMovement` / `camera_movement` | string | Preset chuyển động camera PixVerse |
| `templateId` / `template_id`         | number | ID mẫu PixVerse đã kích hoạt     |

## Cấu hình

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="API region">
    OpenClaw mặc định dùng API PixVerse quốc tế. Đặt `models.providers.pixverse.region`
    thủ công khi khóa của bạn thuộc một vùng nền tảng PixVerse cụ thể, hoặc dùng
    `openclaw onboard --auth-choice pixverse-api-key` để chọn một vùng trong trình hướng dẫn thiết lập:

    | Giá trị vùng    | URL cơ sở API PixVerse                     |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Custom base URL">
    Chỉ đặt `models.providers.pixverse.baseUrl` khi định tuyến qua proxy tương thích đáng tin cậy.
    `baseUrl` được ưu tiên hơn `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Task polling">
    PixVerse trả về `video_id` từ yêu cầu tạo. OpenClaw thăm dò
    `/openapi/v2/video/result/{video_id}` cho đến khi tác vụ thành công, thất bại
    hoặc hết thời gian chờ.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Video generation" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi bất đồng bộ.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Thiết lập mặc định của agent, bao gồm mô hình tạo video.
  </Card>
</CardGroup>
