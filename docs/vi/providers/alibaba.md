---
read_when:
    - Bạn muốn sử dụng tính năng tạo video của Alibaba Wan trong OpenClaw
    - Bạn cần thiết lập khóa API của Model Studio hoặc DashScope để tạo video
summary: Tạo video bằng Alibaba Model Studio Wan trong OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-29T23:04:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw đi kèm một nhà cung cấp tạo video `alibaba` cho các mô hình Wan trên
Alibaba Model Studio / DashScope.

- Nhà cung cấp: `alibaba`
- Xác thực ưu tiên: `MODELSTUDIO_API_KEY`
- Cũng chấp nhận: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: Tạo video bất đồng bộ DashScope / Model Studio

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Đặt mô hình video mặc định">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Xác minh nhà cung cấp khả dụng">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Bất kỳ khóa xác thực được chấp nhận nào (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) đều hoạt động. Lựa chọn thiết lập ban đầu `qwen-standard-api-key` cấu hình thông tin xác thực DashScope dùng chung.
</Note>

## Các mô hình Wan tích hợp sẵn

Nhà cung cấp `alibaba` đi kèm hiện đăng ký:

| Tham chiếu mô hình         | Chế độ                    |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Văn bản sang video        |
| `alibaba/wan2.6-i2v`       | Hình ảnh sang video       |
| `alibaba/wan2.6-r2v`       | Tham chiếu sang video     |
| `alibaba/wan2.6-r2v-flash` | Tham chiếu sang video (nhanh) |
| `alibaba/wan2.7-r2v`       | Tham chiếu sang video     |

## Giới hạn hiện tại

| Tham số               | Giới hạn                                                  |
| --------------------- | --------------------------------------------------------- |
| Video đầu ra          | Tối đa **1** mỗi yêu cầu                                  |
| Hình ảnh đầu vào      | Tối đa **1**                                              |
| Video đầu vào         | Tối đa **4**                                              |
| Thời lượng            | Tối đa **10 giây**                                        |
| Điều khiển được hỗ trợ | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Hình ảnh/video tham chiếu | Chỉ URL `http(s)` từ xa                                |

<Warning>
Chế độ hình ảnh/video tham chiếu hiện yêu cầu **URL http(s) từ xa**. Đường dẫn tệp cục bộ không được hỗ trợ cho đầu vào tham chiếu.
</Warning>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Quan hệ với Qwen">
    Nhà cung cấp `qwen` đi kèm cũng sử dụng các endpoint DashScope do Alibaba lưu trữ để
    tạo video Wan. Dùng:

    - `qwen/...` khi bạn muốn bề mặt nhà cung cấp Qwen chuẩn
    - `alibaba/...` khi bạn muốn bề mặt video Wan trực tiếp do nhà cung cấp sở hữu

    Xem [tài liệu nhà cung cấp Qwen](/vi/providers/qwen) để biết thêm chi tiết.

  </Accordion>

  <Accordion title="Thứ tự ưu tiên khóa xác thực">
    OpenClaw kiểm tra khóa xác thực theo thứ tự này:

    1. `MODELSTUDIO_API_KEY` (ưu tiên)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Bất kỳ khóa nào trong số này cũng sẽ xác thực nhà cung cấp `alibaba`.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Qwen" href="/vi/providers/qwen" icon="microchip">
    Thiết lập nhà cung cấp Qwen và tích hợp DashScope.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Mặc định của agent và cấu hình mô hình.
  </Card>
</CardGroup>
