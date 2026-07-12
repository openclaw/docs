---
read_when:
    - Bạn muốn sử dụng tính năng tạo video Runway trong OpenClaw
    - Bạn cần thiết lập khóa API/biến môi trường của Runway
    - Bạn muốn đặt Runway làm nhà cung cấp video mặc định
summary: Thiết lập tạo video bằng Runway trong OpenClaw
title: Đường băng
x-i18n:
    generated_at: "2026-07-12T08:17:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw cung cấp sẵn provider `runway` đi kèm để tạo video trên dịch vụ lưu trữ, được bật theo mặc định và đăng ký theo hợp đồng `videoGenerationProviders`.

| Thuộc tính                  | Giá trị                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| ID provider                 | `runway`                                                                 |
| Plugin                      | đi kèm, `enabledByDefault: true`                                         |
| Biến môi trường xác thực    | `RUNWAYML_API_SECRET` (chuẩn) hoặc `RUNWAY_API_KEY`                      |
| Cờ thiết lập ban đầu        | `--auth-choice runway-api-key`                                           |
| Cờ CLI trực tiếp            | `--runway-api-key <key>`                                                 |
| API                         | Tạo video dựa trên tác vụ của Runway (thăm dò `GET /v1/tasks/{id}`)      |
| Mô hình mặc định            | `runway/gen4.5`                                                          |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Đặt Runway làm provider video mặc định">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Tạo video">
    Yêu cầu tác nhân tạo video. Runway sẽ tự động được sử dụng.
  </Step>
</Steps>

## Chế độ và mô hình được hỗ trợ

Provider cung cấp bảy mô hình Runway được chia thành ba chế độ. Cùng một ID mô hình có thể phục vụ nhiều chế độ (ví dụ: `gen4.5` hoạt động cho cả chuyển văn bản thành video và chuyển hình ảnh thành video).

| Chế độ                       | Mô hình                                                                 | Đầu vào tham chiếu                |
| ---------------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| Chuyển văn bản thành video   | `gen4.5` (mặc định), `veo3.1`, `veo3.1_fast`, `veo3`                   | Không có                          |
| Chuyển hình ảnh thành video  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 hình ảnh cục bộ hoặc từ xa      |
| Chuyển video thành video     | `gen4_aleph`                                                            | 1 video cục bộ hoặc từ xa         |

Hỗ trợ tham chiếu hình ảnh và video cục bộ thông qua URI dữ liệu.

| Tỷ lệ khung hình               | Giá trị được phép                            |
| ------------------------------ | -------------------------------------------- |
| Chuyển văn bản thành video     | `16:9`, `9:16`                               |
| Chỉnh sửa hình ảnh và video    | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Chuyển video thành video hiện yêu cầu `runway/gen4_aleph`. Các ID mô hình Runway khác từ chối đầu vào tham chiếu video.
</Warning>

<Note>
  Việc chọn ID mô hình Runway từ sai cột sẽ tạo ra lỗi rõ ràng trước khi yêu cầu API rời khỏi OpenClaw. Provider xác thực `model` theo danh sách cho phép của chế độ (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) trong `extensions/runway/video-generation-provider.ts`.
</Note>

## Cấu hình

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Bí danh biến môi trường">
    OpenClaw nhận diện cả `RUNWAYML_API_SECRET` (chuẩn) và `RUNWAY_API_KEY`.
    Một trong hai biến đều có thể xác thực provider Runway.
  </Accordion>

  <Accordion title="Thăm dò tác vụ">
    Runway sử dụng API dựa trên tác vụ. Sau khi gửi yêu cầu tạo video, OpenClaw
    thăm dò `GET /v1/tasks/{id}` cho đến khi video sẵn sàng. Không cần
    cấu hình bổ sung cho hành vi thăm dò.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ dùng chung, lựa chọn provider và hành vi bất đồng bộ.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Cài đặt mặc định của tác nhân, bao gồm mô hình tạo video.
  </Card>
</CardGroup>
