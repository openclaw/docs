---
read_when:
    - Bạn muốn sử dụng tính năng tạo video bằng Runway trong OpenClaw
    - Bạn cần thiết lập khóa API/biến môi trường của Runway
    - Bạn muốn đặt Runway làm nhà cung cấp video mặc định
summary: Thiết lập tạo video bằng Runway trong OpenClaw
title: Đường băng
x-i18n:
    generated_at: "2026-05-06T09:28:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw phát hành kèm một nhà cung cấp `runway` được đóng gói sẵn cho tạo video được lưu trữ. Plugin được bật theo mặc định và đăng ký nhà cung cấp `runway` với hợp đồng `videoGenerationProviders`.

| Thuộc tính      | Giá trị                                                           |
| --------------- | ----------------------------------------------------------------- |
| ID nhà cung cấp | `runway`                                                          |
| Plugin          | được đóng gói kèm, `enabledByDefault: true`                       |
| Biến môi trường xác thực | `RUNWAYML_API_SECRET` (chuẩn) hoặc `RUNWAY_API_KEY`       |
| Cờ onboarding   | `--auth-choice runway-api-key`                                    |
| Cờ CLI trực tiếp | `--runway-api-key <key>`                                         |
| API             | Tạo video dựa trên tác vụ của Runway (thăm dò `GET /v1/tasks/{id}`) |
| Mô hình mặc định | `runway/gen4.5`                                                  |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Đặt Runway làm nhà cung cấp video mặc định">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Tạo video">
    Yêu cầu agent tạo video. Runway sẽ được sử dụng tự động.
  </Step>
</Steps>

## Chế độ và mô hình được hỗ trợ

Nhà cung cấp này cung cấp bảy mô hình Runway được chia thành ba chế độ. Cùng một ID mô hình có thể phục vụ nhiều hơn một chế độ (ví dụ `gen4.5` hoạt động cho cả văn bản thành video và hình ảnh thành video).

| Chế độ          | Mô hình                                                                | Đầu vào tham chiếu     |
| --------------- | ---------------------------------------------------------------------- | ---------------------- |
| Văn bản thành video | `gen4.5` (mặc định), `veo3.1`, `veo3.1_fast`, `veo3`               | Không có               |
| Hình ảnh thành video | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 hình ảnh cục bộ hoặc từ xa |
| Video thành video | `gen4_aleph`                                                        | 1 video cục bộ hoặc từ xa |

Tham chiếu hình ảnh và video cục bộ được hỗ trợ qua URI dữ liệu.

| Tỷ lệ khung hình    | Giá trị được phép                           |
| ------------------- | ------------------------------------------- |
| Văn bản thành video | `16:9`, `9:16`                              |
| Chỉnh sửa hình ảnh và video | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Video thành video hiện yêu cầu `runway/gen4_aleph`. Các ID mô hình Runway khác sẽ từ chối đầu vào tham chiếu video.
</Warning>

<Note>
  Việc chọn một ID mô hình Runway từ sai cột sẽ tạo ra lỗi rõ ràng trước khi yêu cầu API rời khỏi OpenClaw. Nhà cung cấp xác thực `model` theo danh sách cho phép của chế độ (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) trong `extensions/runway/video-generation-provider.ts`.
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
    Biến nào cũng sẽ xác thực nhà cung cấp Runway.
  </Accordion>

  <Accordion title="Thăm dò tác vụ">
    Runway sử dụng API dựa trên tác vụ. Sau khi gửi yêu cầu tạo, OpenClaw
    thăm dò `GET /v1/tasks/{id}` cho đến khi video sẵn sàng. Không cần
    cấu hình bổ sung cho hành vi thăm dò.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ dùng chung, lựa chọn nhà cung cấp và hành vi bất đồng bộ.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Cài đặt mặc định của agent, bao gồm mô hình tạo video.
  </Card>
</CardGroup>
