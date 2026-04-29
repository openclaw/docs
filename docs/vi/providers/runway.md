---
read_when:
    - Bạn muốn sử dụng tính năng tạo video của Runway trong OpenClaw
    - Bạn cần thiết lập khóa API/biến môi trường của Runway
    - Bạn muốn đặt Runway làm nhà cung cấp video mặc định
summary: Thiết lập tạo video Runway trong OpenClaw
title: Đường băng
x-i18n:
    generated_at: "2026-04-29T23:09:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw cung cấp sẵn provider `runway` cho tạo video được lưu trữ.

| Thuộc tính  | Giá trị                                                           |
| ----------- | ----------------------------------------------------------------- |
| Id provider | `runway`                                                          |
| Xác thực    | `RUNWAYML_API_SECRET` (chuẩn) hoặc `RUNWAY_API_KEY`               |
| API         | Tạo video dựa trên tác vụ của Runway (thăm dò `GET /v1/tasks/{id}`) |

## Bắt đầu

<Steps>
  <Step title="Thiết lập khóa API">
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
    Yêu cầu agent tạo video. Runway sẽ tự động được sử dụng.
  </Step>
</Steps>

## Chế độ được hỗ trợ

| Chế độ        | Model              | Đầu vào tham chiếu           |
| ------------- | ------------------ | ---------------------------- |
| Văn bản sang video | `gen4.5` (mặc định) | Không có                   |
| Hình ảnh sang video | `gen4.5`           | 1 hình ảnh cục bộ hoặc từ xa |
| Video sang video | `gen4_aleph`       | 1 video cục bộ hoặc từ xa    |

<Note>
Tham chiếu hình ảnh và video cục bộ được hỗ trợ qua URI dữ liệu. Các lần chạy chỉ dùng văn bản
hiện cung cấp tỷ lệ khung hình `16:9` và `9:16`.
</Note>

<Warning>
Video sang video hiện yêu cầu cụ thể `runway/gen4_aleph`.
</Warning>

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
    Một trong hai biến đều sẽ xác thực provider Runway.
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
    Tham số công cụ dùng chung, lựa chọn provider, và hành vi bất đồng bộ.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Thiết lập mặc định của agent, bao gồm model tạo video.
  </Card>
</CardGroup>
