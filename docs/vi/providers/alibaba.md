---
read_when:
    - Bạn muốn sử dụng tính năng tạo video Alibaba Wan trong OpenClaw
    - Bạn cần thiết lập khóa API Model Studio hoặc DashScope để tạo video
summary: Tạo video bằng Alibaba Model Studio Wan trong OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T08:16:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Plugin `alibaba` được đóng gói sẵn đăng ký một nhà cung cấp tạo video cho các mô hình Wan trên Alibaba Model Studio (tên quốc tế của DashScope). Plugin này được bật theo mặc định; bạn chỉ cần khóa API.

| Thuộc tính             | Giá trị                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| ID nhà cung cấp        | `alibaba`                                                                       |
| Plugin                 | đóng gói sẵn, `enabledByDefault: true`                                          |
| Biến môi trường xác thực | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (giá trị khớp đầu tiên được dùng) |
| Cờ thiết lập ban đầu   | `--auth-choice alibaba-model-studio-api-key`                                    |
| Cờ CLI trực tiếp       | `--alibaba-model-studio-api-key <key>`                                          |
| Mô hình mặc định       | `alibaba/wan2.6-t2v`                                                            |
| URL cơ sở mặc định     | `https://dashscope-intl.aliyuncs.com`                                           |

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    Lưu khóa cho nhà cung cấp `alibaba` thông qua quy trình thiết lập ban đầu:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Hoặc truyền khóa trực tiếp:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Hoặc xuất một trong các biến môi trường được chấp nhận trước khi khởi động Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # hoặc DASHSCOPE_API_KEY=...
    # hoặc QWEN_API_KEY=...
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
  <Step title="Xác minh nhà cung cấp đã được cấu hình">
    ```bash
    openclaw models list --provider alibaba
    ```

    Danh sách bao gồm cả năm mô hình Wan được đóng gói sẵn. Nếu không thể phân giải `MODELSTUDIO_API_KEY`, `openclaw models status --json` sẽ báo thông tin xác thực bị thiếu trong `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba và [Plugin Qwen](/vi/providers/qwen) đều xác thực với DashScope và chấp nhận các biến môi trường trùng nhau. Hãy dùng ID mô hình `alibaba/...` cho giao diện video Wan chuyên dụng; dùng ID `qwen/...` cho trò chuyện, embedding hoặc hiểu nội dung đa phương tiện bằng Qwen.
</Note>

## Các mô hình Wan tích hợp sẵn

| Tham chiếu mô hình           | Chế độ                          |
| ---------------------------- | ------------------------------- |
| `alibaba/wan2.6-t2v`         | Văn bản thành video (mặc định)  |
| `alibaba/wan2.6-i2v`         | Hình ảnh thành video            |
| `alibaba/wan2.6-r2v`         | Nội dung tham chiếu thành video |
| `alibaba/wan2.6-r2v-flash`   | Nội dung tham chiếu thành video (nhanh) |
| `alibaba/wan2.7-r2v`         | Nội dung tham chiếu thành video |

## Khả năng và giới hạn

Cả ba chế độ có cùng giới hạn về số lượng video và thời lượng cho mỗi yêu cầu; chỉ cấu trúc đầu vào khác nhau.

| Chế độ                          | Số video đầu ra tối đa | Số hình ảnh đầu vào tối đa | Số video đầu vào tối đa | Thời lượng tối đa | Tùy chọn điều khiển được hỗ trợ                           |
| ------------------------------- | ---------------------- | -------------------------- | ----------------------- | ------------------ | --------------------------------------------------------- |
| Văn bản thành video             | 1                      | không áp dụng               | không áp dụng            | 10 giây            | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Hình ảnh thành video            | 1                      | 1                          | không áp dụng            | 10 giây            | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Nội dung tham chiếu thành video | 1                      | không áp dụng               | 4                       | 10 giây            | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Yêu cầu không chỉ định `durationSeconds` sẽ sử dụng giá trị mặc định được DashScope chấp nhận là **5 giây**. Hãy đặt `durationSeconds` rõ ràng trong [công cụ tạo video](/vi/tools/video-generation) để tăng thời lượng lên tối đa 10 giây.

<Warning>
  Đầu vào hình ảnh và video tham chiếu phải là URL `http(s)` từ xa; các chế độ tham chiếu của DashScope từ chối đường dẫn tệp cục bộ. Trước tiên, hãy tải nội dung lên kho lưu trữ đối tượng hoặc sử dụng quy trình của [công cụ đa phương tiện](/vi/tools/media-overview), vốn đã tạo URL công khai.
</Warning>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Ghi đè URL cơ sở của DashScope">
    Theo mặc định, nhà cung cấp sử dụng điểm cuối DashScope quốc tế. Để nhắm đến điểm cuối tại khu vực Trung Quốc:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Nhà cung cấp loại bỏ dấu gạch chéo ở cuối trước khi tạo URL tác vụ AIGC.

  </Accordion>

  <Accordion title="Mức ưu tiên của biến môi trường xác thực">
    OpenClaw phân giải khóa API Alibaba từ các biến môi trường theo thứ tự sau và sử dụng giá trị không rỗng đầu tiên:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Các mục `auth.profiles` đã cấu hình (được đặt qua `openclaw models auth login`) sẽ ghi đè việc phân giải biến môi trường. Xem [Hồ sơ xác thực trong phần câu hỏi thường gặp về mô hình](/vi/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) để biết cơ chế luân phiên hồ sơ, thời gian chờ và ghi đè.

  </Accordion>

  <Accordion title="Mối quan hệ với Plugin Qwen">
    Cả hai Plugin được đóng gói sẵn đều giao tiếp với DashScope và chấp nhận các khóa API trùng nhau. Hãy dùng:

    - ID `alibaba/wan*.*` cho nhà cung cấp video Wan chuyên dụng được trình bày trên trang này.
    - ID `qwen/*` cho trò chuyện, embedding và hiểu nội dung đa phương tiện bằng Qwen (xem [Qwen](/vi/providers/qwen)).

    Chỉ cần đặt `MODELSTUDIO_API_KEY` một lần để xác thực cả hai Plugin, vì danh sách biến môi trường xác thực được chủ ý thiết kế trùng nhau; không cần thiết lập ban đầu riêng cho từng Plugin.

  </Accordion>
</AccordionGroup>

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Các tham số dùng chung của công cụ video và cách chọn nhà cung cấp.
  </Card>
  <Card title="Qwen" href="/vi/providers/qwen" icon="microchip">
    Thiết lập trò chuyện, embedding và hiểu nội dung đa phương tiện bằng Qwen với cùng cơ chế xác thực DashScope.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Các giá trị mặc định của tác nhân và cấu hình mô hình.
  </Card>
  <Card title="Câu hỏi thường gặp về mô hình" href="/vi/help/faq-models" icon="circle-question">
    Hồ sơ xác thực, chuyển đổi mô hình và xử lý lỗi "không có hồ sơ".
  </Card>
</CardGroup>
