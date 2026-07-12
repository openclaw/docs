---
read_when:
    - Tạo video thông qua tác tử
    - Cấu hình nhà cung cấp và mô hình tạo video
    - Tìm hiểu các tham số của công cụ video_generate
sidebarTitle: Video generation
summary: Tạo video qua video_generate từ văn bản, hình ảnh hoặc video tham chiếu trên 16 backend nhà cung cấp
title: Tạo video
x-i18n:
    generated_at: "2026-07-12T08:26:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

Các tác nhân OpenClaw tạo video từ câu lệnh văn bản, hình ảnh tham chiếu hoặc
video có sẵn thông qua `video_generate`. Hỗ trợ mười sáu phần phụ trợ của nhà
cung cấp; tác nhân tự động chọn phần phù hợp dựa trên cấu hình và các khóa API
hiện có.

<Note>
`video_generate` chỉ xuất hiện khi có ít nhất một nhà cung cấp tạo video khả
dụng. Nếu công cụ này không có trong các công cụ của tác nhân, hãy đặt khóa API
của nhà cung cấp hoặc cấu hình `agents.defaults.videoGenerationModel`.
</Note>

`video_generate` có ba chế độ thời gian chạy, được xác định từ các đầu vào tham
chiếu trong lệnh gọi:

- `generate` - không có phương tiện tham chiếu (văn bản thành video).
- `imageToVideo` - một hoặc nhiều hình ảnh tham chiếu.
- `videoToVideo` - một hoặc nhiều video tham chiếu.

Các nhà cung cấp có thể hỗ trợ bất kỳ tập hợp con nào của các chế độ đó. Công
cụ xác thực chế độ đang hoạt động trước khi gửi và báo cáo các chế độ được hỗ
trợ trong `action=list`.

## Bắt đầu nhanh

<Steps>
  <Step title="Cấu hình xác thực">
    Đặt khóa API cho bất kỳ nhà cung cấp được hỗ trợ nào:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Chọn mô hình mặc định (không bắt buộc)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Yêu cầu tác nhân">
    > Tạo một video điện ảnh dài 5 giây về một chú tôm hùm thân thiện lướt sóng lúc hoàng hôn.

    Tác nhân tự động gọi `video_generate`. Không cần đưa công cụ vào danh sách
    cho phép.

  </Step>
</Steps>

## Cách hoạt động của quá trình tạo bất đồng bộ

Quá trình tạo video diễn ra bất đồng bộ:

1. OpenClaw gửi yêu cầu đến nhà cung cấp và trả về mã tác vụ ngay lập tức.
2. Nhà cung cấp xử lý tác vụ trong nền (thường từ 30 giây đến vài phút tùy theo nhà cung cấp và độ phân giải; các nhà cung cấp chậm sử dụng hàng đợi có thể chạy đến hết thời gian chờ đã cấu hình).
3. Khi video sẵn sàng, OpenClaw đánh thức cùng phiên bằng một sự kiện hoàn tất nội bộ.
4. Tác nhân báo cáo video qua chế độ phản hồi hiển thị thông thường của phiên:
   phản hồi cuối tự động hoặc `message(action="send")` khi phiên yêu cầu
   công cụ nhắn tin. Nếu phiên của người yêu cầu không hoạt động, hoặc việc đánh
   thức phiên thất bại và phương tiện đã tạo vẫn thiếu trong phản hồi hoàn tất,
   OpenClaw sẽ gửi trực tiếp một phương án dự phòng có tính lũy đẳng kèm phương
   tiện.

Trong khi một tác vụ đang được xử lý, các lệnh gọi `video_generate` trùng lặp
trong cùng phiên sẽ trả về trạng thái tác vụ hiện tại thay vì bắt đầu một lần
tạo khác. Dùng `action: "status"` để kiểm tra mà không kích hoạt lần tạo mới,
hoặc dùng `openclaw tasks list` / `openclaw tasks show <lookup>` từ CLI (xem
[Tác vụ nền](/vi/automation/tasks)).

Ngoài các lần chạy tác nhân có phiên hỗ trợ (ví dụ: gọi công cụ trực tiếp),
công cụ sẽ chuyển sang tạo nội tuyến và trả về đường dẫn phương tiện cuối cùng
trong cùng lượt.

Các tệp video đã tạo được lưu trong kho phương tiện do OpenClaw quản lý khi nhà
cung cấp trả về dữ liệu byte. Giới hạn mặc định là 16MB (giới hạn phương tiện
video dùng chung); `agents.defaults.mediaMaxMb` nâng giới hạn này cho các bản
kết xuất lớn hơn. Khi nhà cung cấp cũng trả về URL đầu ra được lưu trữ,
OpenClaw sẽ phân phối URL đó thay vì để tác vụ thất bại nếu quá trình lưu cục bộ
từ chối một tệp quá kích thước.

### Vòng đời tác vụ

| Trạng thái  | Ý nghĩa                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| `queued`    | Tác vụ đã được tạo và đang chờ nhà cung cấp chấp nhận.                                                          |
| `running`   | Nhà cung cấp đang xử lý (thường từ 30 giây đến vài phút tùy theo nhà cung cấp và độ phân giải).                 |
| `succeeded` | Video đã sẵn sàng; tác nhân được đánh thức và đăng video vào cuộc trò chuyện.                                   |
| `failed`    | Lỗi nhà cung cấp hoặc hết thời gian chờ; tác nhân được đánh thức kèm chi tiết lỗi.                              |

Kiểm tra trạng thái từ CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Các nhà cung cấp được hỗ trợ

| Nhà cung cấp          | Mô hình mặc định                 | Văn bản | Tham chiếu hình ảnh                                  | Tham chiếu video                               | Xác thực                                 |
| --------------------- | ------------------------------- | :-----: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |    ✓    | Có (URL từ xa)                                       | Có (URL từ xa)                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |    ✓    | Tối đa 2 hình ảnh (chỉ mô hình I2V; khung đầu + cuối) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |    ✓    | Tối đa 2 hình ảnh (khung đầu + cuối thông qua vai trò) | -                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |    ✓    | Tối đa 9 hình ảnh tham chiếu                         | Tối đa 3 video                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |    ✓    | 1 hình ảnh                                           | -                                               | `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |    ✓    | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |    ✓    | 1 hình ảnh; tối đa 9 với Seedance tham chiếu thành video | Tối đa 3 video với Seedance tham chiếu thành video | `FAL_KEY`                            |
| Google                | `veo-3.1-fast-generate-preview` |    ✓    | 1 hình ảnh                                           | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |    ✓    | 1 hình ảnh                                           | -                                               | `MINIMAX_API_KEY` hoặc MiniMax OAuth     |
| OpenAI                | `sora-2`                        |    ✓    | 1 hình ảnh                                           | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |    ✓    | Tối đa 4 hình ảnh (khung đầu/cuối hoặc tham chiếu)   | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |    ✓    | Có (URL từ xa)                                       | Có (URL từ xa)                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |    ✓    | 1 hình ảnh                                           | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |    ✓    | Chỉ `Wan-AI/Wan2.2-I2V-A14B`                         | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |    ✓    | 1 hình ảnh (`kling`)                                 | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |    ✓    | Cổ điển: 1 khung đầu hoặc 7 tham chiếu; 1.5: 1 khung | Cổ điển: 1 video                                | `XAI_API_KEY`                            |

Một số nhà cung cấp chấp nhận thêm các biến môi trường khóa API hoặc các biến
thay thế. Xem từng [trang nhà cung cấp](#related) để biết chi tiết.

Chạy `video_generate action=list` để kiểm tra các nhà cung cấp, mô hình và chế
độ thời gian chạy hiện có tại thời điểm chạy.

### Ma trận khả năng

Hợp đồng chế độ tường minh được `video_generate`, các kiểm thử hợp đồng và đợt
kiểm tra trực tiếp dùng chung sử dụng:

| Nhà cung cấp | `generate` | `imageToVideo` | `videoToVideo` | Các luồng kiểm tra trực tiếp dùng chung hiện nay                                                                                         |
| ------------ | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` vì nhà cung cấp này cần URL video `http(s)` từ xa                                      |
| BytePlus     |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI      |     ✓      |       ✓        |       -        | Không có trong đợt kiểm tra dùng chung; phạm vi kiểm thử theo từng quy trình nằm trong các kiểm thử Comfy                               |
| DeepInfra    |     ✓      |       -        |       -        | `generate`; các lược đồ video gốc của DeepInfra là văn bản thành video trong hợp đồng Plugin                                             |
| fal          |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` chỉ khi dùng Seedance tham chiếu thành video                                                   |
| Google       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` dùng chung vì đợt kiểm tra Gemini/Veo dựa trên bộ đệm hiện tại không chấp nhận đầu vào đó |
| MiniMax      |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` dùng chung vì đường dẫn tổ chức/đầu vào này hiện cần quyền chỉnh sửa video từ nhà cung cấp |
| OpenRouter   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Qwen         |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` vì nhà cung cấp này cần URL video `http(s)` từ xa                                      |
| Runway       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` chỉ chạy khi mô hình được chọn là `runway/gen4_aleph`                                         |
| Together     |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Vydra        |     ✓      |       ✓        |       -        | `generate`; bỏ qua `imageToVideo` dùng chung vì `veo3` đi kèm chỉ hỗ trợ văn bản và `kling` đi kèm yêu cầu URL hình ảnh từ xa            |
| xAI          |     ✓      |       ✓        |       ✓        | Phiên bản Cổ điển hỗ trợ mọi chế độ; Video 1.5 chỉ hỗ trợ hình ảnh thành video; đầu vào MP4 từ xa khiến `videoToVideo` không nằm trong đợt kiểm tra dùng chung |

## Tham số công cụ

### Bắt buộc

<ParamField path="prompt" type="string" required>
  Nội dung văn bản mô tả video cần tạo. Bắt buộc đối với `action: "generate"`.
</ParamField>

### Đầu vào nội dung

<ParamField path="image" type="string">Một hình ảnh tham chiếu (đường dẫn hoặc URL).</ParamField>
<ParamField path="images" type="string[]">Nhiều hình ảnh tham chiếu (tối đa 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Gợi ý vai trò tùy chọn theo từng vị trí, tương ứng với danh sách hình ảnh kết hợp.
Các giá trị chuẩn: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Một video tham chiếu (đường dẫn hoặc URL).</ParamField>
<ParamField path="videos" type="string[]">Nhiều video tham chiếu (tối đa 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Gợi ý vai trò tùy chọn theo từng vị trí, tương ứng với danh sách video kết hợp.
Giá trị chuẩn: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Một âm thanh tham chiếu (đường dẫn hoặc URL). Dùng cho nhạc nền hoặc tham chiếu
giọng nói khi nhà cung cấp hỗ trợ đầu vào âm thanh.
</ParamField>
<ParamField path="audioRefs" type="string[]">Nhiều âm thanh tham chiếu (tối đa 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Gợi ý vai trò tùy chọn theo từng vị trí, tương ứng với danh sách âm thanh kết hợp.
Giá trị chuẩn: `reference_audio`.
</ParamField>

<Note>
Các gợi ý vai trò được chuyển nguyên trạng đến nhà cung cấp. Các giá trị chuẩn
đến từ kiểu hợp `VideoGenerationAssetRole`, nhưng nhà cung cấp có thể chấp nhận
thêm các chuỗi vai trò khác. Mảng `*Roles` không được có nhiều phần tử hơn danh
sách tham chiếu tương ứng; lỗi lệch một vị trí sẽ thất bại với thông báo rõ ràng.
Dùng chuỗi rỗng để bỏ đặt một vị trí. Với xAI, hãy đặt mọi vai trò hình ảnh thành
`reference_image` để dùng chế độ tạo `reference_images`; bỏ qua vai trò hoặc
dùng `first_frame` để chuyển một hình ảnh thành video.
</Note>

### Điều khiển phong cách

<ParamField path="aspectRatio" type="string">
  Gợi ý tỷ lệ khung hình như `1:1`, `16:9`, `9:16`, `adaptive` hoặc giá trị riêng của nhà cung cấp. OpenClaw chuẩn hóa hoặc bỏ qua các giá trị không được hỗ trợ tùy theo nhà cung cấp.
</ParamField>
<ParamField path="resolution" type="string">Gợi ý độ phân giải như `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` hoặc giá trị riêng của nhà cung cấp. OpenClaw chuẩn hóa hoặc bỏ qua các giá trị không được hỗ trợ tùy theo nhà cung cấp.</ParamField>
<ParamField path="durationSeconds" type="number">
  Thời lượng mục tiêu tính bằng giây (được làm tròn đến giá trị gần nhất mà nhà cung cấp hỗ trợ).
</ParamField>
<ParamField path="size" type="string">Gợi ý kích thước khi nhà cung cấp hỗ trợ.</ParamField>
<ParamField path="audio" type="boolean">
  Bật âm thanh được tạo trong đầu ra khi được hỗ trợ. Khác với `audioRef*` (đầu vào).
</ParamField>
<ParamField path="watermark" type="boolean">Bật hoặc tắt hình mờ của nhà cung cấp khi được hỗ trợ.</ParamField>

`adaptive` là một giá trị chỉ dấu riêng của nhà cung cấp: giá trị này được
chuyển nguyên trạng đến các nhà cung cấp khai báo `adaptive` trong khả năng
của họ (ví dụ: BytePlus Seedance dùng giá trị này để tự động phát hiện tỷ lệ
từ kích thước hình ảnh đầu vào). Các nhà cung cấp không khai báo giá trị này
sẽ hiển thị giá trị trong `details.ignoredOverrides` của kết quả công cụ để
việc loại bỏ có thể quan sát được.

### Nâng cao

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` trả về tác vụ hiện tại của phiên; `"list"` kiểm tra các nhà cung cấp.
</ParamField>
<ParamField path="model" type="string">Ghi đè nhà cung cấp/mô hình (ví dụ: `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Gợi ý tên tệp đầu ra.</ParamField>
<ParamField path="timeoutMs" type="number">Thời gian chờ tùy chọn cho thao tác của nhà cung cấp, tính bằng mili giây. Khi bỏ qua, OpenClaw dùng `agents.defaults.videoGenerationModel.timeoutMs` nếu đã cấu hình; nếu không, dùng giá trị mặc định do tác giả Plugin đặt cho nhà cung cấp nếu có.</ParamField>
<ParamField path="providerOptions" type="object">
  Các tùy chọn riêng của nhà cung cấp dưới dạng đối tượng JSON (ví dụ: `{"seed": 42, "draft": true}`).
  Các nhà cung cấp khai báo lược đồ có kiểu sẽ xác thực khóa và kiểu; khóa
  không xác định hoặc kiểu không khớp sẽ khiến ứng viên bị bỏ qua trong quá
  trình dự phòng. Các nhà cung cấp không khai báo lược đồ sẽ nhận nguyên trạng
  các tùy chọn. Chạy `video_generate action=list` để xem từng nhà cung cấp chấp nhận gì.
</ParamField>

<Note>
Không phải nhà cung cấp nào cũng hỗ trợ mọi tham số. OpenClaw chuẩn hóa thời
lượng thành giá trị gần nhất mà nhà cung cấp hỗ trợ và ánh xạ lại các gợi ý
hình học đã chuyển đổi, chẳng hạn từ kích thước sang tỷ lệ khung hình, khi
nhà cung cấp dự phòng cung cấp một giao diện điều khiển khác. Các giá trị ghi
đè thực sự không được hỗ trợ sẽ bị bỏ qua trên cơ sở nỗ lực tối đa và được
báo cáo dưới dạng cảnh báo trong kết quả công cụ. Các giới hạn cứng về khả
năng (chẳng hạn quá nhiều đầu vào tham chiếu) sẽ gây lỗi trước khi gửi.
Kết quả công cụ báo cáo các thiết lập đã áp dụng; `details.normalization`
ghi lại mọi chuyển đổi từ giá trị được yêu cầu sang giá trị được áp dụng.
</Note>

Các đầu vào tham chiếu chọn chế độ thời gian chạy:

- Không có phương tiện tham chiếu -> `generate`
- Có bất kỳ tham chiếu hình ảnh nào -> `imageToVideo`
- Có bất kỳ tham chiếu video nào -> `videoToVideo`
- Đầu vào âm thanh tham chiếu **không** thay đổi chế độ đã phân giải; chúng
  được áp dụng bổ sung lên chế độ do tham chiếu hình ảnh/video chọn và chỉ
  hoạt động với các nhà cung cấp khai báo `maxInputAudios`.

Kết hợp tham chiếu hình ảnh và video không phải là một bề mặt khả năng dùng
chung ổn định. Nên dùng một loại tham chiếu cho mỗi yêu cầu.

#### Dự phòng và tùy chọn có kiểu

Một số kiểm tra khả năng được áp dụng tại lớp dự phòng thay vì ranh giới
công cụ, vì vậy yêu cầu vượt quá giới hạn của nhà cung cấp chính vẫn có thể
chạy trên một nhà cung cấp dự phòng đủ khả năng:

- Ứng viên đang hoạt động không khai báo `maxInputAudios` (hoặc khai báo `0`)
  sẽ bị bỏ qua khi yêu cầu chứa tham chiếu âm thanh; ứng viên tiếp theo sẽ
  được thử. Cơ chế bảo vệ tương tự áp dụng cho số lượng tham chiếu hình ảnh
  và video theo `maxInputImages`/`maxInputVideos`.
- Ứng viên đang hoạt động có `maxDurationSeconds` thấp hơn `durationSeconds`
  được yêu cầu và không khai báo danh sách `supportedDurationSeconds` -> bị bỏ qua.
- Yêu cầu chứa `providerOptions` và ứng viên đang hoạt động khai báo rõ ràng
  lược đồ `providerOptions` có kiểu -> bị bỏ qua nếu các khóa được cung cấp
  không có trong lược đồ hoặc kiểu giá trị không khớp. Các nhà cung cấp không
  khai báo lược đồ sẽ nhận nguyên trạng các tùy chọn (chuyển tiếp tương thích
  ngược). Nhà cung cấp có thể từ chối tất cả tùy chọn của nhà cung cấp bằng
  cách khai báo lược đồ rỗng (`capabilities.providerOptions: {}`), việc này
  gây ra cùng kiểu bỏ qua như khi kiểu không khớp.

Lý do bỏ qua đầu tiên trong một yêu cầu được ghi nhật ký ở mức `warn` để
người vận hành biết khi nhà cung cấp chính của họ không được chọn; các lần
bỏ qua tiếp theo được ghi ở mức `debug` để chuỗi dự phòng dài không tạo quá
nhiều thông báo. Nếu mọi ứng viên đều bị bỏ qua, lỗi tổng hợp sẽ bao gồm lý
do bỏ qua của từng ứng viên.

## Hành động

| Hành động  | Chức năng                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| `generate` | Mặc định. Tạo video từ lời nhắc đã cho và các đầu vào tham chiếu tùy chọn.                                      |
| `status`   | Kiểm tra trạng thái của tác vụ video đang chạy cho phiên hiện tại mà không bắt đầu một lần tạo khác.           |
| `list`     | Hiển thị các nhà cung cấp, mô hình hiện có và khả năng của chúng.                                               |

## Lựa chọn mô hình

OpenClaw phân giải mô hình theo thứ tự sau:

1. **Tham số công cụ `model`** - nếu agent chỉ định một mô hình trong lệnh gọi.
2. **`videoGenerationModel.primary`** từ cấu hình.
3. **`videoGenerationModel.fallbacks`** theo thứ tự.
4. **Tự động phát hiện** - các nhà cung cấp có thông tin xác thực hợp lệ,
   bắt đầu từ nhà cung cấp mặc định hiện tại, sau đó là các nhà cung cấp còn
   lại theo thứ tự bảng chữ cái.

Nếu một nhà cung cấp thất bại, ứng viên tiếp theo sẽ tự động được thử. Nếu
tất cả ứng viên đều thất bại, lỗi sẽ bao gồm chi tiết từ mỗi lần thử.

Đặt `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ dùng
các mục `model`, `primary` và `fallbacks` được chỉ định rõ ràng.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // tùy chọn ghi đè thời gian chờ yêu cầu của nhà cung cấp cho từng công cụ
      },
    },
  },
}
```

## Ghi chú về nhà cung cấp

<AccordionGroup>
  <Accordion title="Alibaba">
    Dùng điểm cuối bất đồng bộ của DashScope / Model Studio. Hình ảnh và
    video tham chiếu phải là URL `http(s)` từ xa.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Mã định danh nhà cung cấp: `byteplus`.

    Các mô hình: `seedance-1-0-pro-250528` (mặc định),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Các mô hình T2V (`*-t2v-*`) không chấp nhận đầu vào hình ảnh; các mô hình
    I2V và mô hình `*-pro-*` tổng quát hỗ trợ một hình ảnh tham chiếu (khung
    hình đầu tiên). Truyền hình ảnh theo vị trí hoặc đặt `role: "first_frame"`.
    Mã định danh mô hình T2V được tự động chuyển sang biến thể I2V tương ứng
    khi có hình ảnh được cung cấp.

    Các khóa `providerOptions` được hỗ trợ: `seed` (số), `draft` (boolean -
    buộc dùng 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Yêu cầu Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (bên ngoài, không được đóng gói kèm). Mã định danh nhà cung cấp:
    `byteplus-seedance15`. Mô hình: `seedance-1-5-pro-251215`.

    Dùng API `content[]` hợp nhất. Hỗ trợ tối đa 2 hình ảnh đầu vào
    (`first_frame` + `last_frame`). Tất cả đầu vào phải là URL `https://`
    từ xa. Đặt `role: "first_frame"` / `"last_frame"` trên từng hình ảnh
    hoặc truyền hình ảnh theo vị trí.

    `aspectRatio: "adaptive"` tự động phát hiện tỷ lệ từ hình ảnh đầu vào.
    `audio: true` ánh xạ thành `generate_audio`. `providerOptions.seed`
    (số) được chuyển tiếp.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Yêu cầu Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (bên ngoài, không được đóng gói kèm). Mã định danh nhà cung cấp:
    `byteplus-seedance2`. Các mô hình:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Dùng API `content[]` hợp nhất. Hỗ trợ tối đa 9 hình ảnh tham chiếu,
    3 video tham chiếu và 3 âm thanh tham chiếu. Tất cả đầu vào phải là URL
    `https://` từ xa. Đặt `role` trên từng tài nguyên - các giá trị được hỗ trợ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` tự động phát hiện tỷ lệ từ hình ảnh đầu vào.
    `audio: true` ánh xạ thành `generate_audio`. `providerOptions.seed`
    (số) được chuyển tiếp.

  </Accordion>
  <Accordion title="ComfyUI">
    Thực thi cục bộ hoặc trên đám mây theo quy trình công việc. Hỗ trợ chuyển văn bản thành video và
    hình ảnh thành video thông qua đồ thị đã cấu hình.
  </Accordion>
  <Accordion title="fal">
    Sử dụng luồng có hàng đợi hỗ trợ cho các tác vụ chạy lâu. Theo mặc định, OpenClaw chờ tối đa 20
    phút trước khi coi một tác vụ hàng đợi fal đang xử lý là đã
    hết thời gian chờ. Hầu hết các mô hình video fal
    chấp nhận một tham chiếu hình ảnh duy nhất. Các mô hình chuyển tham chiếu thành video
    Seedance 2.0 chấp nhận tối đa 9 hình ảnh, 3 video và 3 tham chiếu âm thanh, với
    tổng cộng không quá 12 tệp tham chiếu.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Hỗ trợ một tham chiếu hình ảnh hoặc một tham chiếu video. Các yêu cầu tạo âm thanh bị
    bỏ qua kèm cảnh báo trên luồng API Gemini vì API đó từ chối
    tham số `generateAudio` đối với tính năng tạo video Veo hiện tại.
  </Accordion>
  <Accordion title="MiniMax">
    Chỉ hỗ trợ một tham chiếu hình ảnh. MiniMax chấp nhận độ phân giải `768P` và `1080P`;
    các yêu cầu như `720P` được chuẩn hóa thành giá trị được hỗ trợ
    gần nhất trước khi gửi.
  </Accordion>
  <Accordion title="OpenAI">
    Chỉ giá trị ghi đè `size` được chuyển tiếp. Các giá trị ghi đè kiểu khác
    (`aspectRatio`, `resolution`, `audio`, `watermark`) bị bỏ qua kèm
    cảnh báo.
  </Accordion>
  <Accordion title="OpenRouter">
    Sử dụng API `/videos` bất đồng bộ của OpenRouter. OpenClaw gửi
    tác vụ, thăm dò `polling_url` và tải xuống `unsigned_urls` hoặc
    điểm cuối nội dung tác vụ đã được ghi trong tài liệu. Giá trị mặc định `google/veo-3.1-fast`
    đi kèm công bố thời lượng 4/6/8 giây, độ phân giải `720P`/`1080P` và
    tỷ lệ khung hình `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Sử dụng cùng phần phụ trợ DashScope như Alibaba. Đầu vào tham chiếu phải là URL
    `http(s)` từ xa; các tệp cục bộ bị từ chối ngay từ đầu.
  </Accordion>
  <Accordion title="Runway">
    Hỗ trợ tệp cục bộ thông qua URI dữ liệu. Chuyển video thành video yêu cầu
    `runway/gen4_aleph`. Các lần chạy chỉ dùng văn bản cung cấp tỷ lệ khung hình
    `16:9` và `9:16`.
  </Accordion>
  <Accordion title="Together">
    Chỉ hỗ trợ một tham chiếu hình ảnh.
  </Accordion>
  <Accordion title="Vydra">
    Sử dụng trực tiếp `https://www.vydra.ai/api/v1` để tránh các chuyển hướng
    làm mất thông tin xác thực. `veo3` được đi kèm dưới dạng chỉ chuyển văn bản thành video; `kling` yêu cầu
    URL hình ảnh từ xa.
  </Accordion>
  <Accordion title="xAI">
    Mô hình mặc định `grok-imagine-video` hỗ trợ chuyển văn bản thành video, chuyển một
    hình ảnh khung hình đầu tiên thành video, tối đa 7 đầu vào `reference_image` thông qua
    `reference_images` của xAI, cùng các luồng chỉnh sửa/mở rộng video từ xa. Theo mặc định, quá trình tạo
    dùng `480P`; chế độ chuyển một hình ảnh thành video kế thừa tỷ lệ của nguồn khi
    bỏ qua `aspectRatio`. Chỉnh sửa/mở rộng video kế thừa kích thước hình học của đầu vào và
    không chấp nhận ghi đè tỷ lệ khung hình hoặc độ phân giải. Chế độ mở rộng chấp nhận 2–10
    giây.

    `grok-imagine-video-1.5` chỉ hỗ trợ chuyển hình ảnh thành video: hãy cung cấp chính xác một hình ảnh.
    Mô hình hỗ trợ 1–15 giây và `480P`, `720P` hoặc `1080P`, với giá trị mặc định là
    `480P`; bỏ qua `aspectRatio` để kế thừa tỷ lệ của hình ảnh nguồn. Các mã định danh bản xem trước
    và bản 1.5 có ngày tháng nhận cùng quy trình xác thực và được chuyển tiếp
    nguyên trạng.

  </Accordion>
</AccordionGroup>

## Các chế độ khả năng của nhà cung cấp

Hợp đồng tạo video dùng chung hỗ trợ các khả năng theo từng chế độ
thay vì chỉ các giới hạn tổng hợp phẳng. Các phần triển khai nhà cung cấp mới
nên ưu tiên các khối chế độ tường minh:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Các trường tổng hợp phẳng như `maxInputImages` và `maxInputVideos`
**không** đủ để công bố hỗ trợ chế độ chuyển đổi. Các nhà cung cấp nên
khai báo tường minh `generate`, `imageToVideo` và `videoToVideo` để các
kiểm thử trực tiếp, kiểm thử hợp đồng và công cụ `video_generate` dùng chung có thể xác thực
hỗ trợ chế độ theo cách xác định.

Khi một mô hình trong nhà cung cấp hỗ trợ đầu vào tham chiếu rộng hơn
các mô hình còn lại, hãy sử dụng `maxInputImagesByModel`, `maxInputVideosByModel` hoặc
`maxInputAudiosByModel` thay vì tăng giới hạn cho toàn bộ chế độ.

## Kiểm thử trực tiếp

Phạm vi kiểm thử trực tiếp có thể chọn tham gia cho các nhà cung cấp đi kèm dùng chung:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Trình bao bọc của kho mã:

```bash
pnpm test:live:media video
```

Theo mặc định, tệp kiểm thử trực tiếp này ưu tiên các biến môi trường của nhà cung cấp đã được xuất
trước các hồ sơ xác thực đã lưu và chạy một bài kiểm thử nhanh an toàn cho bản phát hành:

- `generate` cho mọi nhà cung cấp không phải FAL trong lượt kiểm thử.
- Lời nhắc về tôm hùm dài một giây.
- Giới hạn thời gian thao tác cho từng nhà cung cấp từ
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`).

FAL là tùy chọn tham gia vì độ trễ hàng đợi phía nhà cung cấp có thể chi phối thời gian
phát hành:

```bash
pnpm test:live:media video --video-providers fal
```

Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các
chế độ chuyển đổi đã khai báo mà lượt kiểm thử dùng chung có thể thực hiện an toàn với phương tiện cục bộ:

- `imageToVideo` khi `capabilities.imageToVideo.enabled`.
- `videoToVideo` khi `capabilities.videoToVideo.enabled` và
  nhà cung cấp/mô hình chấp nhận đầu vào video cục bộ được hỗ trợ bằng bộ đệm trong lượt
  kiểm thử dùng chung.

Hiện tại, luồng kiểm thử trực tiếp `videoToVideo` dùng chung chỉ bao phủ `runway` khi bạn
chọn `runway/gen4_aleph`.

## Cấu hình

Đặt mô hình tạo video mặc định trong cấu hình OpenClaw của bạn:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Hoặc thông qua CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Liên quan

- [Alibaba Model Studio](/vi/providers/alibaba)
- [Tác vụ nền](/vi/automation/tasks) - theo dõi tác vụ cho quá trình tạo video bất đồng bộ
- [BytePlus](/vi/concepts/model-providers#byteplus-international)
- [ComfyUI](/vi/providers/comfy)
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults)
- [fal](/vi/providers/fal)
- [Google (Gemini)](/vi/providers/google)
- [MiniMax](/vi/providers/minimax)
- [Mô hình](/vi/concepts/models)
- [OpenAI](/vi/providers/openai)
- [Qwen](/vi/providers/qwen)
- [Runway](/vi/providers/runway)
- [Together AI](/vi/providers/together)
- [Tổng quan về công cụ](/vi/tools)
- [Vydra](/vi/providers/vydra)
- [xAI](/vi/providers/xai)
