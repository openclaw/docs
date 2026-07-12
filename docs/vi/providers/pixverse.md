---
read_when:
    - Bạn muốn sử dụng tính năng tạo video của PixVerse trong OpenClaw
    - Bạn cần thiết lập khóa API/biến môi trường của PixVerse
    - Bạn muốn đặt PixVerse làm nhà cung cấp video mặc định
summary: Thiết lập tạo video bằng PixVerse trong OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T08:19:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw cung cấp `pixverse` dưới dạng plugin bên ngoài chính thức để tạo video PixVerse trên dịch vụ lưu trữ. Plugin đăng ký nhà cung cấp `pixverse` theo hợp đồng `videoGenerationProviders`.

| Thuộc tính             | Giá trị                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| ID nhà cung cấp        | `pixverse`                                                                   |
| Gói plugin             | `@openclaw/pixverse-provider`                                                |
| Biến môi trường xác thực | `PIXVERSE_API_KEY`                                                         |
| Cờ thiết lập ban đầu   | `--auth-choice pixverse-api-key`                                             |
| Cờ CLI trực tiếp       | `--pixverse-api-key <key>`                                                   |
| API                    | PixVerse Platform API v2 (gửi `video_id` rồi thăm dò kết quả)                |
| Mô hình mặc định       | `pixverse/v6`                                                                |
| Khu vực API mặc định   | Quốc tế                                                                      |

## Bắt đầu

<Steps>
  <Step title="Cài đặt plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Đặt khóa API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Trình hướng dẫn yêu cầu chọn điểm cuối Quốc tế hoặc CN (xem phần Khu vực API
    bên dưới) trước khi ghi `region` và `baseUrl` vào cấu hình nhà cung cấp.
    Các lần chạy không tương tác (khóa từ `--pixverse-api-key` hoặc `PIXVERSE_API_KEY`)
    mặc định sử dụng Quốc tế.

    Quá trình thiết lập ban đầu cũng đặt `agents.defaults.videoGenerationModel.primary`
    thành `pixverse/v6` khi chưa cấu hình mô hình video mặc định.

  </Step>
  <Step title="Chuyển nhà cung cấp video mặc định hiện có (không bắt buộc)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Tạo video">
    Yêu cầu tác nhân tạo video. PixVerse sẽ tự động được sử dụng.
  </Step>
</Steps>

## Chế độ và mô hình được hỗ trợ

Nhà cung cấp cung cấp các mô hình tạo nội dung của PixVerse thông qua công cụ video dùng chung của OpenClaw.

| Chế độ            | Mô hình              | Đầu vào tham chiếu             |
| ----------------- | -------------------- | ------------------------------ |
| Văn bản thành video | `v6` (mặc định), `c1` | Không có                     |
| Hình ảnh thành video | `v6` (mặc định), `c1` | 1 hình ảnh cục bộ hoặc từ xa |

Hình ảnh tham chiếu cục bộ được tải lên PixVerse trước yêu cầu chuyển hình ảnh thành video. URL hình ảnh từ xa được chuyển qua điểm cuối tải ảnh lên của PixVerse dưới dạng `image_url`.

| Tùy chọn          | Giá trị được hỗ trợ                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Thời lượng        | 1–15 giây (mặc định 5)                                                                                                                      |
| Độ phân giải      | `360P`, `540P`, `720P`, `1080P` (mặc định `540P`; yêu cầu `480P` được ánh xạ thành `540P`)                                                  |
| Tỷ lệ khung hình  | `16:9` (mặc định), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; chỉ áp dụng cho văn bản thành video, hình ảnh thành video theo ảnh nguồn |
| Âm thanh được tạo | `audio: true`                                                                                                                               |

<Note>
Tính năng tạo mẫu hình ảnh PixVerse chưa được cung cấp qua `image_generate`. API đó hoạt động dựa trên ID mẫu, trong khi hợp đồng tạo hình ảnh dùng chung của OpenClaw hiện chưa có tập hợp tùy chọn được định kiểu dành riêng cho PixVerse.
</Note>

## Tùy chọn nhà cung cấp

Nhà cung cấp video chấp nhận các khóa không bắt buộc dành riêng cho nhà cung cấp sau:

| Tùy chọn                             | Kiểu   | Tác dụng                                                |
| ------------------------------------ | ------ | ------------------------------------------------------- |
| `seed`                               | số     | Giá trị hạt giống xác định, từ 0 đến 2147483647         |
| `negativePrompt` / `negative_prompt` | chuỗi  | Câu lệnh phủ định                                       |
| `quality`                            | chuỗi  | Chất lượng PixVerse, chẳng hạn như `720p`               |
| `motionMode` / `motion_mode`         | chuỗi  | Chế độ chuyển động từ hình ảnh thành video (mặc định `normal`) |
| `cameraMovement` / `camera_movement` | chuỗi  | Thiết lập sẵn chuyển động máy quay của PixVerse         |
| `templateId` / `template_id`         | số     | ID mẫu PixVerse đã kích hoạt                            |

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
  <Accordion title="Khu vực API">
    | Giá trị khu vực  | URL cơ sở API PixVerse                       |
    | ---------------- | -------------------------------------------- |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`     |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`   |

    Đặt thủ công `models.providers.pixverse.region` khi khóa của bạn thuộc một
    khu vực nền tảng PixVerse cụ thể, hoặc chạy
    `openclaw onboard --auth-choice pixverse-api-key` để chọn khu vực trong
    trình hướng dẫn thiết lập:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" hoặc "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL cơ sở tùy chỉnh">
    Chỉ đặt `models.providers.pixverse.baseUrl` khi định tuyến qua proxy tương thích và đáng tin cậy.
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

  <Accordion title="Thăm dò tác vụ">
    PixVerse trả về `video_id` từ yêu cầu tạo video. OpenClaw thăm dò
    `/openapi/v2/video/result/{video_id}` mỗi 5 giây cho đến khi tác vụ
    thành công, thất bại hoặc hết thời gian chờ (mặc định 5 phút; ghi đè bằng
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi bất đồng bộ.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Các thiết lập mặc định của tác nhân, bao gồm mô hình tạo video.
  </Card>
</CardGroup>
