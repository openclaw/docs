---
read_when:
    - Tạo video thông qua tác tử
    - Cấu hình nhà cung cấp và mô hình tạo video
    - Tìm hiểu các tham số của công cụ video_generate
sidebarTitle: Video generation
summary: Tạo video qua video_generate từ các tham chiếu văn bản, hình ảnh hoặc video trên 16 phần phụ trợ của nhà cung cấp
title: Tạo video
x-i18n:
    generated_at: "2026-05-05T06:19:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: a86a820cc9f27baf4b17954d7ded7c2b7ff9eb456e7e75c3b2e7a7653cd675fd
    source_path: tools/video-generation.md
    workflow: 16
---

Các agent OpenClaw có thể tạo video từ prompt văn bản, ảnh tham chiếu hoặc
video hiện có. Mười sáu backend nhà cung cấp được hỗ trợ, mỗi backend có
các tùy chọn mô hình, chế độ đầu vào và bộ tính năng khác nhau. Agent tự động chọn
nhà cung cấp phù hợp dựa trên cấu hình của bạn và các khóa API hiện có.

<Note>
Công cụ `video_generate` chỉ xuất hiện khi có ít nhất một nhà cung cấp
tạo video khả dụng. Nếu bạn không thấy công cụ này trong các công cụ của agent,
hãy đặt khóa API của nhà cung cấp hoặc cấu hình `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw xem tạo video là ba chế độ runtime:

- `generate` — yêu cầu chuyển văn bản thành video không có phương tiện tham chiếu.
- `imageToVideo` — yêu cầu bao gồm một hoặc nhiều ảnh tham chiếu.
- `videoToVideo` — yêu cầu bao gồm một hoặc nhiều video tham chiếu.

Nhà cung cấp có thể hỗ trợ bất kỳ tập con nào của các chế độ đó. Công cụ xác thực
chế độ đang hoạt động trước khi gửi và báo cáo các chế độ được hỗ trợ trong `action=list`.

## Bắt đầu nhanh

<Steps>
  <Step title="Configure auth">
    Đặt khóa API cho bất kỳ nhà cung cấp nào được hỗ trợ:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > Tạo một video điện ảnh dài 5 giây về một chú tôm hùm thân thiện đang lướt sóng lúc hoàng hôn.

    Agent tự động gọi `video_generate`. Không cần đưa công cụ vào danh sách cho phép.

  </Step>
</Steps>

## Cách hoạt động của quá trình tạo bất đồng bộ

Tạo video là bất đồng bộ. Khi agent gọi `video_generate` trong một
phiên:

1. OpenClaw gửi yêu cầu đến nhà cung cấp và trả về ngay một id tác vụ.
2. Nhà cung cấp xử lý công việc trong nền (thường từ 30 giây đến vài phút tùy thuộc vào nhà cung cấp và độ phân giải; các nhà cung cấp chậm dựa trên hàng đợi có thể chạy đến hết thời gian chờ đã cấu hình).
3. Khi video sẵn sàng, OpenClaw đánh thức cùng phiên đó bằng một sự kiện hoàn tất nội bộ.
4. Agent thông báo cho người dùng và đính kèm video đã hoàn tất. Trong các cuộc trò chuyện nhóm/kênh
   sử dụng phương thức gửi hiển thị chỉ qua công cụ tin nhắn, agent chuyển tiếp
   kết quả qua công cụ tin nhắn thay vì để OpenClaw đăng trực tiếp.

Trong khi một công việc đang chạy, các lệnh gọi `video_generate` trùng lặp trong cùng
phiên sẽ trả về trạng thái tác vụ hiện tại thay vì bắt đầu một lần tạo khác.
Dùng `openclaw tasks list` hoặc `openclaw tasks show <taskId>` để
kiểm tra tiến trình từ CLI.

Bên ngoài các lần chạy agent có phiên hỗ trợ (ví dụ: gọi công cụ trực tiếp),
công cụ chuyển sang tạo nội tuyến và trả về đường dẫn phương tiện cuối cùng
trong cùng lượt.

Các tệp video đã tạo được lưu trong bộ lưu trữ phương tiện do OpenClaw quản lý khi
nhà cung cấp trả về byte. Giới hạn lưu video đã tạo mặc định tuân theo
giới hạn phương tiện video, và `agents.defaults.mediaMaxMb` nâng giới hạn đó cho
các bản dựng lớn hơn. Khi nhà cung cấp cũng trả về URL đầu ra được lưu trữ, OpenClaw
có thể gửi URL đó thay vì làm tác vụ thất bại nếu việc lưu cục bộ
từ chối một tệp quá lớn.

### Vòng đời tác vụ

| Trạng thái  | Ý nghĩa                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Tác vụ đã được tạo, đang chờ nhà cung cấp chấp nhận.                                                   |
| `running`   | Nhà cung cấp đang xử lý (thường từ 30 giây đến vài phút tùy thuộc vào nhà cung cấp và độ phân giải). |
| `succeeded` | Video đã sẵn sàng; agent thức dậy và đăng video vào cuộc trò chuyện.                                         |
| `failed`    | Lỗi nhà cung cấp hoặc hết thời gian chờ; agent thức dậy với chi tiết lỗi.                                         |

Kiểm tra trạng thái từ CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Nếu một tác vụ video đã ở trạng thái `queued` hoặc `running` cho phiên hiện tại,
`video_generate` trả về trạng thái tác vụ hiện có thay vì bắt đầu một tác vụ mới.
Dùng `action: "status"` để kiểm tra rõ ràng mà không kích hoạt một lần tạo mới.

## Nhà cung cấp được hỗ trợ

| Nhà cung cấp          | Mô hình mặc định                | Văn bản | Tham chiếu ảnh                                      | Tham chiếu video                              | Xác thực                                  |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Có (URL từ xa)                                      | Có (URL từ xa)                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Tối đa 2 ảnh (chỉ mô hình I2V; khung hình đầu + cuối) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Tối đa 2 ảnh (khung hình đầu + cuối qua vai trò)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Tối đa 9 ảnh tham chiếu                             | Tối đa 3 video                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 ảnh                                              | —                                               | `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 ảnh; tối đa 9 với Seedance chuyển tham chiếu thành video    | Tối đa 3 video với Seedance chuyển tham chiếu thành video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 ảnh                                              | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 ảnh                                              | —                                               | `MINIMAX_API_KEY` hoặc MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 ảnh                                              | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Tối đa 4 ảnh (khung hình đầu/cuối hoặc tham chiếu)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Có (URL từ xa)                                     | Có (URL từ xa)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 ảnh                                              | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 ảnh                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 ảnh (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 ảnh khung hình đầu tiên hoặc tối đa 7 `reference_image`    | 1 video                                         | `XAI_API_KEY`                            |

Một số nhà cung cấp chấp nhận thêm hoặc thay thế các biến môi trường khóa API. Xem
từng [trang nhà cung cấp](#related) để biết chi tiết.

Chạy `video_generate action=list` để kiểm tra các nhà cung cấp, mô hình và
chế độ runtime khả dụng tại runtime.

### Ma trận khả năng

Hợp đồng chế độ tường minh được sử dụng bởi `video_generate`, kiểm thử hợp đồng và
lượt quét trực tiếp dùng chung:

| Nhà cung cấp | `generate` | `imageToVideo` | `videoToVideo` | Các làn trực tiếp dùng chung hiện nay                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` vì nhà cung cấp này cần URL video `http(s)` từ xa                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Không nằm trong lượt quét dùng chung; phạm vi kiểm thử theo workflow nằm cùng các kiểm thử Comfy                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; các schema video DeepInfra gốc là chuyển văn bản thành video trong hợp đồng đi kèm                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` chỉ khi dùng Seedance chuyển tham chiếu thành video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` dùng chung vì lượt quét Gemini/Veo hiện tại dựa trên buffer không chấp nhận đầu vào đó  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` dùng chung vì đường dẫn tổ chức/đầu vào này hiện cần quyền truy cập inpaint/remix phía nhà cung cấp |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` vì nhà cung cấp này cần URL video `http(s)` từ xa                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` chỉ chạy khi mô hình đã chọn là `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; bỏ qua `imageToVideo` dùng chung vì `veo3` đi kèm chỉ hỗ trợ văn bản và `kling` đi kèm yêu cầu URL ảnh từ xa            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` vì nhà cung cấp này hiện cần URL MP4 từ xa                                |

## Tham số công cụ

### Bắt buộc

<ParamField path="prompt" type="string" required>
  Mô tả văn bản của video cần tạo. Bắt buộc cho `action: "generate"`.
</ParamField>

### Đầu vào nội dung

<ParamField path="image" type="string">Một hình ảnh tham chiếu duy nhất (đường dẫn hoặc URL).</ParamField>
<ParamField path="images" type="string[]">Nhiều hình ảnh tham chiếu (tối đa 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Gợi ý vai trò tùy chọn theo từng vị trí, song song với danh sách hình ảnh kết hợp.
Giá trị chuẩn: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Một video tham chiếu duy nhất (đường dẫn hoặc URL).</ParamField>
<ParamField path="videos" type="string[]">Nhiều video tham chiếu (tối đa 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Gợi ý vai trò tùy chọn theo từng vị trí, song song với danh sách video kết hợp.
Giá trị chuẩn: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Một âm thanh tham chiếu duy nhất (đường dẫn hoặc URL). Được dùng cho nhạc nền hoặc tham chiếu
giọng nói khi nhà cung cấp hỗ trợ đầu vào âm thanh.
</ParamField>
<ParamField path="audioRefs" type="string[]">Nhiều âm thanh tham chiếu (tối đa 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Gợi ý vai trò tùy chọn theo từng vị trí, song song với danh sách âm thanh kết hợp.
Giá trị chuẩn: `reference_audio`.
</ParamField>

<Note>
Gợi ý vai trò được chuyển tiếp nguyên trạng đến nhà cung cấp. Giá trị chuẩn đến từ
union `VideoGenerationAssetRole`, nhưng nhà cung cấp có thể chấp nhận thêm
các chuỗi vai trò khác. Mảng `*Roles` không được có nhiều mục hơn
danh sách tham chiếu tương ứng; lỗi lệch một vị trí sẽ thất bại với lỗi rõ ràng.
Dùng chuỗi rỗng để bỏ đặt một vị trí. Với xAI, đặt mọi vai trò hình ảnh thành
`reference_image` để dùng chế độ tạo `reference_images`; bỏ qua
vai trò hoặc dùng `first_frame` cho chuyển hình ảnh thành video với một hình ảnh.
</Note>

### Điều khiển kiểu

<ParamField path="aspectRatio" type="string">
  Gợi ý tỷ lệ khung hình như `1:1`, `16:9`, `9:16`, `adaptive`, hoặc một giá trị riêng của nhà cung cấp. OpenClaw chuẩn hóa hoặc bỏ qua các giá trị không được hỗ trợ theo từng nhà cung cấp.
</ParamField>
<ParamField path="resolution" type="string">Gợi ý độ phân giải như `480P`, `720P`, `768P`, `1080P`, `4K`, hoặc một giá trị riêng của nhà cung cấp. OpenClaw chuẩn hóa hoặc bỏ qua các giá trị không được hỗ trợ theo từng nhà cung cấp.</ParamField>
<ParamField path="durationSeconds" type="number">
  Thời lượng mục tiêu tính bằng giây (được làm tròn đến giá trị gần nhất mà nhà cung cấp hỗ trợ).
</ParamField>
<ParamField path="size" type="string">Gợi ý kích thước khi nhà cung cấp hỗ trợ.</ParamField>
<ParamField path="audio" type="boolean">
  Bật âm thanh được tạo trong đầu ra khi được hỗ trợ. Khác với `audioRef*` (đầu vào).
</ParamField>
<ParamField path="watermark" type="boolean">Bật/tắt watermark của nhà cung cấp khi được hỗ trợ.</ParamField>

`adaptive` là một sentinel riêng của nhà cung cấp: nó được chuyển tiếp nguyên trạng đến
các nhà cung cấp khai báo `adaptive` trong capability của họ (ví dụ BytePlus
Seedance dùng nó để tự động phát hiện tỷ lệ từ kích thước hình ảnh
đầu vào). Các nhà cung cấp không khai báo nó sẽ hiển thị giá trị qua
`details.ignoredOverrides` trong kết quả công cụ để việc bị bỏ qua được thấy rõ.

### Nâng cao

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` trả về tác vụ phiên hiện tại; `"list"` kiểm tra các nhà cung cấp.
</ParamField>
<ParamField path="model" type="string">Ghi đè nhà cung cấp/mô hình (ví dụ `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Gợi ý tên tệp đầu ra.</ParamField>
<ParamField path="timeoutMs" type="number">Thời gian chờ tùy chọn cho thao tác của nhà cung cấp, tính bằng mili giây.</ParamField>
<ParamField path="providerOptions" type="object">
  Tùy chọn riêng của nhà cung cấp dưới dạng đối tượng JSON (ví dụ `{"seed": 42, "draft": true}`).
  Nhà cung cấp khai báo schema có kiểu sẽ xác thực khóa và kiểu; khóa không xác định
  hoặc không khớp sẽ bỏ qua ứng viên trong quá trình fallback. Nhà cung cấp không có
  schema đã khai báo sẽ nhận các tùy chọn nguyên trạng. Chạy `video_generate action=list`
  để xem mỗi nhà cung cấp chấp nhận gì.
</ParamField>

<Note>
Không phải nhà cung cấp nào cũng hỗ trợ mọi tham số. OpenClaw chuẩn hóa thời lượng về
giá trị gần nhất được nhà cung cấp hỗ trợ, và ánh xạ lại các gợi ý hình học đã dịch
như kích thước sang tỷ lệ khung hình khi một nhà cung cấp fallback cung cấp một
bề mặt điều khiển khác. Các ghi đè thật sự không được hỗ trợ được bỏ qua trên cơ sở
nỗ lực tối đa và được báo cáo dưới dạng cảnh báo trong kết quả công cụ. Giới hạn capability cứng
(chẳng hạn như quá nhiều đầu vào tham chiếu) thất bại trước khi gửi. Kết quả công cụ
báo cáo các thiết lập đã áp dụng; `details.normalization` ghi lại mọi
bản dịch từ yêu cầu sang áp dụng.
</Note>

Đầu vào tham chiếu chọn chế độ runtime:

- Không có media tham chiếu → `generate`
- Bất kỳ tham chiếu hình ảnh nào → `imageToVideo`
- Bất kỳ tham chiếu video nào → `videoToVideo`
- Đầu vào âm thanh tham chiếu **không** thay đổi chế độ đã phân giải; chúng áp dụng
  lên trên bất kỳ chế độ nào mà tham chiếu hình ảnh/video chọn, và chỉ hoạt động
  với các nhà cung cấp khai báo `maxInputAudios`.

Trộn tham chiếu hình ảnh và video không phải là một bề mặt capability dùng chung ổn định.
Nên dùng một loại tham chiếu cho mỗi yêu cầu.

#### Fallback và tùy chọn có kiểu

Một số kiểm tra capability được áp dụng ở lớp fallback thay vì
ranh giới công cụ, nên một yêu cầu vượt quá giới hạn của nhà cung cấp chính vẫn có thể
chạy trên một fallback có đủ khả năng:

- Ứng viên đang hoạt động không khai báo `maxInputAudios` (hoặc `0`) sẽ bị bỏ qua khi
  yêu cầu chứa tham chiếu âm thanh; ứng viên tiếp theo được thử.
- `maxDurationSeconds` của ứng viên đang hoạt động thấp hơn `durationSeconds` được yêu cầu
  mà không có danh sách `supportedDurationSeconds` đã khai báo → bị bỏ qua.
- Yêu cầu chứa `providerOptions` và ứng viên đang hoạt động khai báo rõ ràng
  schema `providerOptions` có kiểu → bị bỏ qua nếu các khóa được cung cấp
  không nằm trong schema hoặc kiểu giá trị không khớp. Nhà cung cấp không có
  schema đã khai báo sẽ nhận tùy chọn nguyên trạng (chuyển tiếp
  tương thích ngược). Một nhà cung cấp có thể chọn không nhận mọi tùy chọn nhà cung cấp bằng cách
  khai báo schema rỗng (`capabilities.providerOptions: {}`), điều này
  gây ra cùng hành vi bỏ qua như lỗi không khớp kiểu.

Lý do bỏ qua đầu tiên trong một yêu cầu được ghi ở mức `warn` để người vận hành thấy khi
nhà cung cấp chính của họ bị bỏ qua; các lần bỏ qua tiếp theo được ghi ở mức `debug` để
giữ các chuỗi fallback dài yên tĩnh. Nếu mọi ứng viên đều bị bỏ qua, lỗi
tổng hợp sẽ bao gồm lý do bỏ qua cho từng ứng viên.

## Hành động

| Hành động  | Chức năng                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Mặc định. Tạo video từ prompt đã cho và các đầu vào tham chiếu tùy chọn.                                |
| `status`   | Kiểm tra trạng thái của tác vụ video đang chạy cho phiên hiện tại mà không bắt đầu một lần tạo khác.    |
| `list`     | Hiển thị các nhà cung cấp, mô hình có sẵn và capability của chúng.                                      |

## Chọn mô hình

OpenClaw phân giải mô hình theo thứ tự này:

1. **Tham số công cụ `model`** — nếu agent chỉ định một giá trị trong lệnh gọi.
2. **`videoGenerationModel.primary`** từ cấu hình.
3. **`videoGenerationModel.fallbacks`** theo thứ tự.
4. **Tự động phát hiện** — các nhà cung cấp có xác thực hợp lệ, bắt đầu với
   nhà cung cấp mặc định hiện tại, rồi các nhà cung cấp còn lại theo thứ tự
   bảng chữ cái.

Nếu một nhà cung cấp thất bại, ứng viên tiếp theo được thử tự động. Nếu tất cả
ứng viên thất bại, lỗi sẽ bao gồm chi tiết từ từng lần thử.

Đặt `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ dùng
các mục `model`, `primary`, và `fallbacks` rõ ràng.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Ghi chú nhà cung cấp

<AccordionGroup>
  <Accordion title="Alibaba">
    Dùng endpoint bất đồng bộ DashScope / Model Studio. Hình ảnh và
    video tham chiếu phải là URL `http(s)` từ xa.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID nhà cung cấp: `byteplus`.

    Mô hình: `seedance-1-0-pro-250528` (mặc định),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Mô hình T2V (`*-t2v-*`) không chấp nhận đầu vào hình ảnh; mô hình I2V và
    mô hình `*-pro-*` tổng quát hỗ trợ một hình ảnh tham chiếu duy nhất (khung
    đầu tiên). Truyền hình ảnh theo vị trí hoặc đặt `role: "first_frame"`.
    ID mô hình T2V được tự động chuyển sang biến thể I2V tương ứng
    khi có hình ảnh được cung cấp.

    Khóa `providerOptions` được hỗ trợ: `seed` (số), `draft` (boolean —
    buộc 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Yêu cầu Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID nhà cung cấp: `byteplus-seedance15`. Mô hình:
    `seedance-1-5-pro-251215`.

    Dùng API `content[]` hợp nhất. Hỗ trợ tối đa 2 hình ảnh đầu vào
    (`first_frame` + `last_frame`). Tất cả đầu vào phải là URL `https://`
    từ xa. Đặt `role: "first_frame"` / `"last_frame"` trên từng hình ảnh, hoặc
    truyền hình ảnh theo vị trí.

    `aspectRatio: "adaptive"` tự động phát hiện tỷ lệ từ hình ảnh đầu vào.
    `audio: true` ánh xạ sang `generate_audio`. `providerOptions.seed`
    (số) được chuyển tiếp.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Yêu cầu Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID nhà cung cấp: `byteplus-seedance2`. Mô hình:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Dùng API `content[]` hợp nhất. Hỗ trợ tối đa 9 hình ảnh tham chiếu,
    3 video tham chiếu, và 3 âm thanh tham chiếu. Tất cả đầu vào phải là URL
    `https://` từ xa. Đặt `role` trên từng asset — các giá trị được hỗ trợ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` tự động phát hiện tỷ lệ từ hình ảnh đầu vào.
    `audio: true` ánh xạ sang `generate_audio`. `providerOptions.seed`
    (số) được chuyển tiếp.

  </Accordion>
  <Accordion title="ComfyUI">
    Thực thi cục bộ hoặc trên đám mây dựa trên workflow. Hỗ trợ text-to-video và
    image-to-video thông qua graph đã cấu hình.
  </Accordion>
  <Accordion title="fal">
    Sử dụng luồng dựa trên hàng đợi cho các tác vụ chạy lâu. Theo mặc định,
    OpenClaw chờ tối đa 20 phút trước khi xem một tác vụ hàng đợi fal đang xử lý
    là đã hết thời gian chờ. Hầu hết mô hình video của fal
    chấp nhận một tham chiếu hình ảnh duy nhất. Các mô hình reference-to-video
    Seedance 2.0 chấp nhận tối đa 9 hình ảnh, 3 video và 3 tham chiếu âm thanh,
    với tổng cộng tối đa 12 tệp tham chiếu.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Hỗ trợ một tham chiếu hình ảnh hoặc một tham chiếu video. Các yêu cầu tạo âm thanh
    bị bỏ qua kèm cảnh báo trên đường dẫn Gemini API vì API đó từ chối
    tham số `generateAudio` cho quá trình tạo video Veo hiện tại.
  </Accordion>
  <Accordion title="MiniMax">
    Chỉ hỗ trợ một tham chiếu hình ảnh. MiniMax chấp nhận độ phân giải `768P` và `1080P`;
    các yêu cầu như `720P` được chuẩn hóa thành giá trị được hỗ trợ gần nhất
    trước khi gửi.
  </Accordion>
  <Accordion title="OpenAI">
    Chỉ chuyển tiếp ghi đè `size`. Các ghi đè kiểu khác
    (`aspectRatio`, `resolution`, `audio`, `watermark`) bị bỏ qua kèm
    cảnh báo.
  </Accordion>
  <Accordion title="OpenRouter">
    Sử dụng API `/videos` bất đồng bộ của OpenRouter. OpenClaw gửi
    tác vụ, thăm dò `polling_url` và tải xuống `unsigned_urls` hoặc endpoint nội dung tác vụ
    đã được tài liệu hóa. Mặc định `google/veo-3.1-fast` được đóng gói
    công bố thời lượng 4/6/8 giây, độ phân giải `720P`/`1080P` và
    tỷ lệ khung hình `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Cùng backend DashScope như Alibaba. Đầu vào tham chiếu phải là URL
    `http(s)` từ xa; tệp cục bộ bị từ chối ngay từ đầu.
  </Accordion>
  <Accordion title="Runway">
    Hỗ trợ tệp cục bộ qua data URI. Video-to-video yêu cầu
    `runway/gen4_aleph`. Các lần chạy chỉ có văn bản cung cấp tỷ lệ khung hình
    `16:9` và `9:16`.
  </Accordion>
  <Accordion title="Together">
    Chỉ hỗ trợ một tham chiếu hình ảnh.
  </Accordion>
  <Accordion title="Vydra">
    Sử dụng trực tiếp `https://www.vydra.ai/api/v1` để tránh các chuyển hướng
    làm mất xác thực. `veo3` chỉ được đóng gói dưới dạng text-to-video; `kling` yêu cầu
    URL hình ảnh từ xa.
  </Accordion>
  <Accordion title="xAI">
    Hỗ trợ text-to-video, image-to-video với một hình ảnh khung đầu tiên, tối đa 7
    đầu vào `reference_image` thông qua xAI `reference_images`, và các luồng
    chỉnh sửa/mở rộng video từ xa.
  </Accordion>
</AccordionGroup>

## Các chế độ khả năng của nhà cung cấp

Hợp đồng tạo video dùng chung hỗ trợ các khả năng theo chế độ
thay vì chỉ các giới hạn tổng hợp phẳng. Các triển khai nhà cung cấp mới
nên ưu tiên các khối chế độ rõ ràng:

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
**không** đủ để công bố hỗ trợ chế độ biến đổi. Nhà cung cấp nên
khai báo rõ ràng `generate`, `imageToVideo` và `videoToVideo` để các kiểm thử live,
kiểm thử hợp đồng và công cụ dùng chung `video_generate` có thể xác thực
hỗ trợ chế độ một cách tất định.

Khi một mô hình trong một nhà cung cấp có hỗ trợ đầu vào tham chiếu rộng hơn
phần còn lại, hãy dùng `maxInputImagesByModel`, `maxInputVideosByModel` hoặc
`maxInputAudiosByModel` thay vì nâng giới hạn trên toàn chế độ.

## Kiểm thử live

Phạm vi kiểm thử live tùy chọn cho các nhà cung cấp được đóng gói dùng chung:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper của repo:

```bash
pnpm test:live:media video
```

Tệp live này tải các biến môi trường nhà cung cấp còn thiếu từ `~/.profile`, mặc định ưu tiên
API key live/env hơn các hồ sơ xác thực đã lưu, và mặc định chạy một
smoke an toàn cho bản phát hành:

- `generate` cho mọi nhà cung cấp không phải FAL trong lượt quét.
- Prompt tôm hùm một giây.
- Giới hạn thao tác theo từng nhà cung cấp từ
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`).

FAL là tùy chọn vì độ trễ hàng đợi phía nhà cung cấp có thể chiếm phần lớn
thời gian phát hành:

```bash
pnpm test:live:media video --video-providers fal
```

Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các chế độ
biến đổi đã khai báo mà lượt quét dùng chung có thể thực thi an toàn với phương tiện cục bộ:

- `imageToVideo` khi `capabilities.imageToVideo.enabled`.
- `videoToVideo` khi `capabilities.videoToVideo.enabled` và
  nhà cung cấp/mô hình chấp nhận đầu vào video cục bộ dựa trên buffer trong lượt quét
  dùng chung.

Hiện tại lane live `videoToVideo` dùng chung chỉ bao phủ `runway` khi bạn
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

Hoặc qua CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Liên quan

- [Alibaba Model Studio](/vi/providers/alibaba)
- [Tác vụ nền](/vi/automation/tasks) — theo dõi tác vụ cho quá trình tạo video bất đồng bộ
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
