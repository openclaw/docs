---
read_when:
    - Bạn muốn sử dụng tính năng tạo video Alibaba Wan trong OpenClaw
    - Bạn cần thiết lập khóa API của Model Studio hoặc DashScope để tạo video
summary: Tạo video bằng Alibaba Model Studio Wan trong OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T09:25:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw cung cấp sẵn một Plugin `alibaba` đăng ký nhà cung cấp tạo video cho các mô hình Wan trên Alibaba Model Studio (tên quốc tế của DashScope). Plugin này được bật theo mặc định; bạn chỉ cần đặt API key.

| Thuộc tính        | Giá trị                                                                         |
| ----------------- | ------------------------------------------------------------------------------- |
| ID nhà cung cấp   | `alibaba`                                                                       |
| Plugin            | đi kèm, `enabledByDefault: true`                                                |
| Biến môi trường xác thực | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (khớp đầu tiên được dùng) |
| Cờ thiết lập ban đầu | `--auth-choice alibaba-model-studio-api-key`                                    |
| Cờ CLI trực tiếp  | `--alibaba-model-studio-api-key <key>`                                          |
| Mô hình mặc định  | `alibaba/wan2.6-t2v`                                                            |
| URL cơ sở mặc định | `https://dashscope-intl.aliyuncs.com`                                           |

## Bắt đầu

<Steps>
  <Step title="Set an API key">
    Dùng quy trình thiết lập ban đầu để lưu khóa cho nhà cung cấp `alibaba`:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Hoặc truyền khóa trực tiếp trong lúc cài đặt/thiết lập ban đầu:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Hoặc xuất bất kỳ biến môi trường nào được chấp nhận trước khi khởi động Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Set a default video model">
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
  <Step title="Verify the provider is configured">
    ```bash
    openclaw models list --provider alibaba
    ```

    Danh sách này phải bao gồm cả năm mô hình Wan đi kèm. Nếu `MODELSTUDIO_API_KEY` chưa được phân giải, `openclaw models status --json` sẽ báo thông tin xác thực còn thiếu trong `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba và [Plugin Qwen](/vi/providers/qwen) đều xác thực với DashScope và chấp nhận các biến môi trường chồng lắp. Dùng ID mô hình `alibaba/...` để điều khiển bề mặt video Wan chuyên dụng; dùng ID `qwen/...` khi bạn muốn bề mặt trò chuyện, embedding hoặc hiểu phương tiện của Qwen.
</Note>

## Các mô hình Wan tích hợp sẵn

| Tham chiếu mô hình        | Chế độ                    |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Văn bản thành video (mặc định) |
| `alibaba/wan2.6-i2v`       | Hình ảnh thành video      |
| `alibaba/wan2.6-r2v`       | Tham chiếu thành video    |
| `alibaba/wan2.6-r2v-flash` | Tham chiếu thành video (nhanh) |
| `alibaba/wan2.7-r2v`       | Tham chiếu thành video    |

## Khả năng và giới hạn

Nhà cung cấp đi kèm phản ánh các giới hạn của API video Wan của DashScope. Cả ba chế độ dùng chung giới hạn số video mỗi yêu cầu và giới hạn thời lượng; chỉ hình dạng đầu vào là khác nhau.

| Chế độ             | Số video đầu ra tối đa | Số ảnh đầu vào tối đa | Số video đầu vào tối đa | Thời lượng tối đa | Điều khiển được hỗ trợ                                  |
| ------------------ | ---------------------- | --------------------- | ----------------------- | ----------------- | ------------------------------------------------------- |
| Văn bản thành video | 1                      | không áp dụng         | không áp dụng           | 10 giây           | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Hình ảnh thành video | 1                     | 1                     | không áp dụng           | 10 giây           | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Tham chiếu thành video | 1                  | không áp dụng         | 4                       | 10 giây           | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Khi một yêu cầu bỏ qua `durationSeconds`, nhà cung cấp gửi giá trị mặc định được DashScope chấp nhận là **5 giây**. Đặt rõ `durationSeconds` trên [công cụ tạo video](/vi/tools/video-generation) để kéo dài tối đa đến 10 giây.

<Warning>
  Đầu vào hình ảnh và video tham chiếu phải là URL `http(s)` từ xa. Đường dẫn tệp cục bộ không được các chế độ tham chiếu của DashScope chấp nhận; hãy tải lên kho lưu trữ đối tượng trước hoặc dùng luồng [công cụ phương tiện](/vi/tools/media-overview) vốn đã tạo URL công khai.
</Warning>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Override the DashScope base URL">
    Nhà cung cấp mặc định dùng điểm cuối DashScope quốc tế. Để nhắm đến điểm cuối khu vực Trung Quốc, hãy đặt:

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

  <Accordion title="Auth env priority">
    OpenClaw phân giải API key Alibaba từ các biến môi trường theo thứ tự này, lấy giá trị khác rỗng đầu tiên:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Các mục `auth.profiles` đã cấu hình (đặt qua `openclaw models auth login`) ghi đè phân giải biến môi trường. Xem [hồ sơ xác thực trong FAQ về mô hình](/vi/help/faq-models#what-is-an-auth-profile) để biết cơ chế xoay vòng hồ sơ, thời gian chờ và ghi đè.

  </Accordion>

  <Accordion title="Relationship to the Qwen plugin">
    Cả hai Plugin đi kèm đều giao tiếp với DashScope và chấp nhận các API key chồng lắp. Dùng:

    - ID `alibaba/wan*.*` để điều khiển nhà cung cấp video Wan chuyên dụng được ghi lại trên trang này.
    - ID `qwen/*` cho trò chuyện, embedding và hiểu phương tiện của Qwen (xem [Qwen](/vi/providers/qwen)).

    Đặt `MODELSTUDIO_API_KEY` một lần sẽ xác thực cả hai Plugin vì danh sách biến môi trường xác thực cố ý chồng lắp; bạn không cần thiết lập từng Plugin riêng.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Video generation" href="/vi/tools/video-generation" icon="video">
    Tham số công cụ video dùng chung và lựa chọn nhà cung cấp.
  </Card>
  <Card title="Qwen" href="/vi/providers/qwen" icon="microchip">
    Thiết lập trò chuyện, embedding và hiểu phương tiện của Qwen trên cùng xác thực DashScope.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/config-agents#agent-defaults" icon="gear">
    Mặc định của tác nhân và cấu hình mô hình.
  </Card>
  <Card title="Models FAQ" href="/vi/help/faq-models" icon="circle-question">
    Hồ sơ xác thực, chuyển đổi mô hình và xử lý lỗi "không có hồ sơ".
  </Card>
</CardGroup>
