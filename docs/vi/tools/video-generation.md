---
read_when:
    - Tạo video thông qua tác tử
    - Cấu hình nhà cung cấp và mô hình tạo video
    - Tìm hiểu các tham số của công cụ video_generate
sidebarTitle: Video generation
summary: Tạo video qua video_generate từ văn bản, hình ảnh hoặc video tham chiếu trên 16 backend nhà cung cấp
title: Tạo video
x-i18n:
    generated_at: "2026-07-19T06:06:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ec1b1fb7054c1a4ce16b9d1aae910774175381233fa7b9b8fd7df32c22ba3f8
    source_path: tools/video-generation.md
    workflow: 16
---

Các agent OpenClaw tạo video từ câu lệnh văn bản, hình ảnh tham chiếu hoặc
video hiện có thông qua `video_generate`. Mười sáu backend nhà cung cấp được
hỗ trợ; agent tự động chọn backend phù hợp dựa trên cấu hình và
các khóa API hiện có.

<Note>
`video_generate` chỉ xuất hiện khi có ít nhất một nhà cung cấp tạo video
khả dụng. Nếu công cụ này không có trong các công cụ của agent, hãy đặt khóa API của nhà cung cấp hoặc
cấu hình `agents.defaults.videoGenerationModel`.
</Note>

`video_generate` có ba chế độ runtime, được xác định từ các đầu vào tham chiếu
trong lệnh gọi:

- `generate` - không có nội dung đa phương tiện tham chiếu (văn bản thành video).
- `imageToVideo` - một hoặc nhiều hình ảnh tham chiếu.
- `videoToVideo` - một hoặc nhiều video tham chiếu.

Các nhà cung cấp có thể hỗ trợ bất kỳ tập hợp con nào của những chế độ đó. Công cụ xác thực
chế độ đang hoạt động trước khi gửi và báo cáo các chế độ được hỗ trợ trong `action=list`.

## Bắt đầu nhanh

<Steps>
  <Step title="Cấu hình xác thực">
    Đặt khóa API cho bất kỳ nhà cung cấp nào được hỗ trợ:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Chọn mô hình mặc định (không bắt buộc)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Yêu cầu agent">
    > Tạo một video điện ảnh dài 5 giây về một chú tôm hùm thân thiện lướt sóng lúc hoàng hôn.

    Agent tự động gọi `video_generate`. Không cần đưa công cụ vào danh sách cho phép.

  </Step>
</Steps>

## Cách hoạt động của quá trình tạo bất đồng bộ

Quá trình tạo video diễn ra bất đồng bộ:

1. OpenClaw gửi yêu cầu đến nhà cung cấp và ngay lập tức trả về một mã tác vụ.
2. Nhà cung cấp xử lý tác vụ trong nền (thường từ 30 giây đến vài phút tùy thuộc vào nhà cung cấp và độ phân giải; các nhà cung cấp chậm sử dụng hàng đợi có thể chạy đến hết thời gian chờ đã cấu hình).
3. Khi video sẵn sàng, OpenClaw đánh thức cùng phiên bằng một sự kiện hoàn tất nội bộ.
4. Agent báo cáo video thông qua chế độ phản hồi hiển thị thông thường của phiên:
   phản hồi cuối tự động hoặc `message(action="send")` khi phiên yêu cầu
   công cụ nhắn tin. Nếu phiên của bên yêu cầu không hoạt động, hoặc việc đánh thức phiên thất bại và
   nội dung đa phương tiện đã tạo vẫn không có trong phản hồi hoàn tất, OpenClaw sẽ gửi
   một phương án dự phòng trực tiếp có tính lũy đẳng kèm nội dung đa phương tiện.

Trong khi một tác vụ đang được xử lý, các lệnh gọi `video_generate` trùng lặp trong cùng
phiên sẽ trả về trạng thái tác vụ hiện tại thay vì bắt đầu một
quá trình tạo khác. Sử dụng `action: "status"` để kiểm tra mà không kích hoạt
quá trình tạo mới, hoặc `openclaw tasks list` / `openclaw tasks show <lookup>` từ
CLI (xem [Tác vụ nền](/vi/automation/tasks)).

Bên ngoài các lần chạy agent có phiên hỗ trợ (ví dụ: gọi công cụ trực tiếp),
công cụ chuyển sang tạo nội tuyến và trả về đường dẫn nội dung đa phương tiện cuối cùng
trong cùng lượt.

Các tệp video được tạo sẽ được lưu trong kho lưu trữ nội dung đa phương tiện do OpenClaw quản lý khi
nhà cung cấp trả về dữ liệu byte. Giới hạn mặc định là 16MB (giới hạn nội dung đa phương tiện video
dùng chung); `agents.defaults.mediaMaxMb` tăng giới hạn này cho các bản kết xuất lớn hơn. Khi
nhà cung cấp cũng trả về URL đầu ra được lưu trữ, OpenClaw sẽ phân phối URL đó thay vì
làm tác vụ thất bại nếu quá trình lưu cục bộ từ chối một tệp quá lớn.

### Vòng đời tác vụ

| Trạng thái       | Ý nghĩa                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Tác vụ đã được tạo và đang chờ nhà cung cấp chấp nhận.                                                   |
| `running`   | Nhà cung cấp đang xử lý (thường từ 30 giây đến vài phút tùy thuộc vào nhà cung cấp và độ phân giải). |
| `succeeded` | Video đã sẵn sàng; agent được đánh thức và đăng video vào cuộc trò chuyện.                                         |
| `failed`    | Lỗi nhà cung cấp hoặc hết thời gian chờ; agent được đánh thức kèm thông tin chi tiết về lỗi.                                         |

Kiểm tra trạng thái từ CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Các nhà cung cấp được hỗ trợ

| Nhà cung cấp              | Mô hình mặc định                   | Văn bản | Tham chiếu hình ảnh                                            | Tham chiếu video                                       | Xác thực                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Có (URL từ xa)                                     | Có (URL từ xa)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (đi kèm)    | `seedance-1-0-pro-250528`       |  ✓   | Tối đa 2 hình ảnh (khung hình đầu + cuối)                  | -                                               | `BYTEPLUS_API_KEY`                       |
| Plugin BytePlus 1.5   | `seedance-1-5-pro-251215`       |  ✓   | Tối đa 2 hình ảnh (khung hình đầu + cuối thông qua vai trò)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Tối đa 9 hình ảnh tham chiếu                             | Tối đa 3 video                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 hình ảnh                                              | -                                               | `COMFY_API_KEY` hoặc `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 hình ảnh; tối đa 9 hình ảnh với Seedance chuyển tham chiếu thành video    | Tối đa 3 video với Seedance chuyển tham chiếu thành video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 hình ảnh                                              | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 hình ảnh                                              | -                                               | `MINIMAX_API_KEY` hoặc OAuth MiniMax       |
| OpenAI                | `sora-2`                        |  ✓   | 1 hình ảnh                                              | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Tối đa 4 hình ảnh (khung hình đầu/cuối hoặc hình ảnh tham chiếu)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Có (URL từ xa)                                     | Có (URL từ xa)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 hình ảnh                                              | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | Chỉ `Wan-AI/Wan2.2-I2V-A14B`                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 hình ảnh (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Classic: 1 khung hình đầu hoặc 7 hình ảnh tham chiếu; 1.5: 1 khung hình | Classic: 1 video                                | `XAI_API_KEY`                            |

Một số nhà cung cấp chấp nhận các biến môi trường khóa API bổ sung hoặc thay thế. Xem
các [trang về nhà cung cấp](#related) riêng lẻ để biết chi tiết.

Chạy `video_generate action=list` để kiểm tra các nhà cung cấp, mô hình và
chế độ runtime khả dụng trong lúc chạy.

### Ma trận khả năng

Hợp đồng chế độ tường minh được sử dụng bởi `video_generate`, các kiểm thử hợp đồng và
đợt quét trực tiếp dùng chung:

| Nhà cung cấp   | `generate` | `imageToVideo` | `videoToVideo` | Các luồng trực tiếp dùng chung hiện nay                                                                                                                 |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` vì nhà cung cấp này cần các URL video `http(s)` từ xa                              |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | Không có trong đợt quét dùng chung; phạm vi kiểm thử dành riêng cho quy trình nằm trong các kiểm thử Comfy                                                              |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; các lược đồ video DeepInfra gốc là chuyển văn bản thành video trong hợp đồng Plugin                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; chỉ có `videoToVideo` khi sử dụng Seedance chuyển tham chiếu thành video                                                  |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` dùng chung vì đợt quét Gemini/Veo dựa trên bộ đệm hiện tại không chấp nhận đầu vào đó |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` dùng chung vì đường dẫn tổ chức/đầu vào này hiện cần quyền chỉnh sửa video phía nhà cung cấp   |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bỏ qua `videoToVideo` vì nhà cung cấp này cần các URL video `http(s)` từ xa                              |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` chỉ chạy khi mô hình được chọn là `runway/gen4_aleph`                                     |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; bỏ qua `imageToVideo` dùng chung vì `veo3` đi kèm chỉ hỗ trợ văn bản và `kling` đi kèm yêu cầu URL hình ảnh từ xa           |
| xAI        |     ✓      |       ✓        |       ✓        | Classic hỗ trợ tất cả chế độ; Video 1.5 chỉ hỗ trợ chuyển hình ảnh thành video; đầu vào MP4 từ xa khiến `videoToVideo` không được đưa vào đợt quét dùng chung             |

## Tham số công cụ

### Bắt buộc

<ParamField path="prompt" type="string" required>
  Mô tả bằng văn bản về video cần tạo. Bắt buộc đối với `action: "generate"`.
</ParamField>

### Đầu vào nội dung

<ParamField path="image" type="string">Một hình ảnh tham chiếu (đường dẫn hoặc URL).</ParamField>
<ParamField path="images" type="string[]">Nhiều hình ảnh tham chiếu (tối đa 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Các gợi ý vai trò tùy chọn theo từng vị trí, tương ứng với danh sách hình ảnh đã kết hợp.
Các giá trị chuẩn: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Một video tham chiếu (đường dẫn hoặc URL).</ParamField>
<ParamField path="videos" type="string[]">Nhiều video tham chiếu (tối đa 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Các gợi ý vai trò tùy chọn theo từng vị trí, tương ứng với danh sách video đã kết hợp.
Giá trị chuẩn: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Một tệp âm thanh tham chiếu (đường dẫn hoặc URL). Dùng làm nhạc nền hoặc
tham chiếu giọng nói khi nhà cung cấp hỗ trợ đầu vào âm thanh.
</ParamField>
<ParamField path="audioRefs" type="string[]">Nhiều tệp âm thanh tham chiếu (tối đa 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Các gợi ý vai trò tùy chọn theo từng vị trí, tương ứng với danh sách âm thanh đã kết hợp.
Giá trị chuẩn: `reference_audio`.
</ParamField>

<Note>
Các gợi ý vai trò được chuyển nguyên trạng đến nhà cung cấp. Các giá trị chuẩn đến từ
hợp `VideoGenerationAssetRole`, nhưng nhà cung cấp có thể chấp nhận thêm
các chuỗi vai trò khác. Mảng `*Roles` không được có nhiều mục hơn
danh sách tham chiếu tương ứng; lỗi lệch một vị trí sẽ thất bại với thông báo lỗi rõ ràng.
Dùng chuỗi rỗng để bỏ trống một vị trí. Với xAI, đặt mọi vai trò hình ảnh thành
`reference_image` để dùng chế độ tạo `reference_images`; bỏ qua
vai trò hoặc dùng `first_frame` cho chế độ chuyển một hình ảnh thành video.
</Note>

### Điều khiển kiểu dáng

<ParamField path="aspectRatio" type="string">
  Gợi ý tỷ lệ khung hình như `1:1`, `16:9`, `9:16`, `adaptive` hoặc một giá trị dành riêng cho nhà cung cấp. OpenClaw chuẩn hóa hoặc bỏ qua các giá trị không được hỗ trợ tùy theo nhà cung cấp.
</ParamField>
<ParamField path="resolution" type="string">Gợi ý độ phân giải như `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` hoặc một giá trị dành riêng cho nhà cung cấp. OpenClaw chuẩn hóa hoặc bỏ qua các giá trị không được hỗ trợ tùy theo nhà cung cấp.</ParamField>
<ParamField path="durationSeconds" type="number">
  Thời lượng mục tiêu tính bằng giây (được làm tròn đến giá trị gần nhất mà nhà cung cấp hỗ trợ).
</ParamField>
<ParamField path="size" type="string">Gợi ý kích thước khi nhà cung cấp hỗ trợ.</ParamField>
<ParamField path="audio" type="boolean">
  Bật âm thanh được tạo trong đầu ra khi được hỗ trợ. Khác với `audioRef*` (đầu vào).
</ParamField>
<ParamField path="watermark" type="boolean">Bật hoặc tắt hình mờ của nhà cung cấp khi được hỗ trợ.</ParamField>

`adaptive` là một giá trị canh gác dành riêng cho nhà cung cấp: giá trị này được chuyển nguyên trạng đến
các nhà cung cấp khai báo `adaptive` trong khả năng của họ (ví dụ: BytePlus
Seedance dùng giá trị này để tự động phát hiện tỷ lệ từ kích thước
hình ảnh đầu vào). Các nhà cung cấp không khai báo giá trị này sẽ hiển thị giá trị qua
`details.ignoredOverrides` trong kết quả công cụ để việc loại bỏ có thể nhận biết được.

### Nâng cao

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` trả về tác vụ của phiên hiện tại; `"list"` kiểm tra các nhà cung cấp.
</ParamField>
<ParamField path="model" type="string">Ghi đè nhà cung cấp/mô hình (ví dụ: `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Gợi ý tên tệp đầu ra.</ParamField>
<ParamField path="timeoutMs" type="number">Thời gian chờ tùy chọn cho thao tác của nhà cung cấp, tính bằng mili giây. Khi bỏ qua, OpenClaw dùng `agents.defaults.videoGenerationModel.timeoutMs` nếu đã định cấu hình; nếu không, dùng giá trị mặc định của nhà cung cấp do tác giả plugin thiết lập khi có.</ParamField>
<ParamField path="providerOptions" type="object">
  Các tùy chọn dành riêng cho nhà cung cấp dưới dạng đối tượng JSON (ví dụ: `{"seed": 42, "draft": true}`).
  Những nhà cung cấp khai báo lược đồ có kiểu sẽ xác thực các khóa và kiểu; các khóa
  không xác định hoặc không khớp kiểu sẽ khiến ứng viên bị bỏ qua trong quá trình dự phòng. Các nhà cung cấp không có
  lược đồ được khai báo sẽ nhận nguyên trạng các tùy chọn. Chạy `video_generate action=list`
  để xem từng nhà cung cấp chấp nhận những gì.
</ParamField>

<Note>
Không phải mọi nhà cung cấp đều hỗ trợ tất cả tham số. OpenClaw chuẩn hóa thời lượng thành
giá trị gần nhất mà nhà cung cấp hỗ trợ và ánh xạ lại các gợi ý hình học đã chuyển đổi,
chẳng hạn từ kích thước sang tỷ lệ khung hình, khi nhà cung cấp dự phòng cung cấp một
bề mặt điều khiển khác. Các giá trị ghi đè thực sự không được hỗ trợ sẽ bị bỏ qua theo
nguyên tắc nỗ lực tối đa và được báo cáo dưới dạng cảnh báo trong kết quả công cụ. Các giới hạn cứng về khả năng
(chẳng hạn quá nhiều đầu vào tham chiếu) sẽ gây lỗi trước khi gửi. Kết quả công cụ
báo cáo các thiết lập đã áp dụng; `details.normalization` ghi lại mọi
chuyển đổi từ giá trị được yêu cầu sang giá trị được áp dụng.
</Note>

Các đầu vào tham chiếu xác định chế độ thời gian chạy:

- Không có phương tiện tham chiếu -> `generate`
- Có bất kỳ hình ảnh tham chiếu nào -> `imageToVideo`
- Có bất kỳ video tham chiếu nào -> `videoToVideo`
- Đầu vào âm thanh tham chiếu **không** thay đổi chế độ đã phân giải; chúng được áp dụng
  bổ sung trên chế độ do các tham chiếu hình ảnh/video lựa chọn và chỉ hoạt động
  với các nhà cung cấp khai báo `maxInputAudios`.

Kết hợp tham chiếu hình ảnh và video không phải là một bề mặt khả năng dùng chung ổn định.
Nên dùng một loại tham chiếu cho mỗi yêu cầu.

#### Dự phòng và các tùy chọn có kiểu

Một số bước kiểm tra khả năng được áp dụng tại lớp dự phòng thay vì ranh giới
công cụ, vì vậy một yêu cầu vượt quá giới hạn của nhà cung cấp chính vẫn có thể
chạy trên một nhà cung cấp dự phòng đủ khả năng:

- Ứng viên đang hoạt động không khai báo `maxInputAudios` (hoặc `0`) sẽ bị bỏ qua khi
  yêu cầu chứa tham chiếu âm thanh; ứng viên tiếp theo sẽ được thử. Cơ chế bảo vệ tương tự
  áp dụng cho số lượng tham chiếu hình ảnh và video so với
  `maxInputImages`/`maxInputVideos`.
- `maxDurationSeconds` của ứng viên đang hoạt động thấp hơn `durationSeconds` được yêu cầu
  và không có danh sách `supportedDurationSeconds` được khai báo -> bị bỏ qua.
- Yêu cầu chứa `providerOptions` và ứng viên đang hoạt động khai báo rõ ràng
  một lược đồ `providerOptions` có kiểu -> bị bỏ qua nếu các khóa được cung cấp
  không có trong lược đồ hoặc kiểu giá trị không khớp. Các nhà cung cấp không có
  lược đồ được khai báo sẽ nhận nguyên trạng các tùy chọn (truyền thẳng
  tương thích ngược). Nhà cung cấp có thể từ chối mọi tùy chọn của nhà cung cấp bằng cách
  khai báo một lược đồ rỗng (`capabilities.providerOptions: {}`), điều này
  dẫn đến việc bị bỏ qua tương tự như khi không khớp kiểu.

Lý do bỏ qua đầu tiên trong một yêu cầu được ghi nhật ký ở `warn` để người vận hành biết khi nào
nhà cung cấp chính của họ bị bỏ qua; các lần bỏ qua tiếp theo được ghi ở `debug` để
giữ im lặng cho các chuỗi dự phòng dài. Nếu mọi ứng viên đều bị bỏ qua,
lỗi tổng hợp sẽ bao gồm lý do bỏ qua của từng ứng viên.

## Hành động

| Hành động     | Chức năng                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Mặc định. Tạo video từ lời nhắc đã cho và các đầu vào tham chiếu tùy chọn.                             |
| `status`   | Kiểm tra trạng thái của tác vụ video đang xử lý cho phiên hiện tại mà không bắt đầu một lần tạo khác. |
| `list`     | Hiển thị các nhà cung cấp, mô hình hiện có và khả năng của chúng.                                                |

## Lựa chọn mô hình

OpenClaw phân giải mô hình theo thứ tự sau:

1. **Tham số công cụ `model`** - nếu tác nhân chỉ định một tham số trong lệnh gọi.
2. **`videoGenerationModel.primary`** từ cấu hình.
3. **`videoGenerationModel.fallbacks`** theo thứ tự.
4. **Tự động phát hiện** - các nhà cung cấp có thông tin xác thực hợp lệ, bắt đầu bằng
   nhà cung cấp mặc định hiện tại, sau đó là các nhà cung cấp còn lại theo thứ tự
   bảng chữ cái.

Nếu một nhà cung cấp thất bại, ứng viên tiếp theo sẽ tự động được thử. Nếu tất cả
ứng viên đều thất bại, lỗi sẽ bao gồm chi tiết từ từng lần thử.

Đặt `agents.defaults.mediaGenerationAutoProviderFallback: false` để chỉ dùng
các mục `model`, `primary` và `fallbacks` rõ ràng.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // tùy chọn ghi đè thời gian chờ yêu cầu của nhà cung cấp theo từng công cụ
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
  <Accordion title="BytePlus (đi kèm)">
    ID nhà cung cấp: `byteplus`.

    Các mô hình: `seedance-1-0-pro-250528` (mặc định),
    `seedance-1-5-pro-251215`.

    Dùng API `content[]` hợp nhất. Hỗ trợ tối đa 2 hình ảnh đầu vào
    (`first_frame` + `last_frame`). Truyền hình ảnh theo vị trí hoặc đặt rõ ràng
    `role` của từng hình ảnh.

    Các khóa `providerOptions` được hỗ trợ: `seed` (số), `draft` (boolean -
    buộc dùng 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="Plugin BytePlus Seedance 1.5">
    Yêu cầu plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (bên ngoài, không đi kèm). ID nhà cung cấp: `byteplus-seedance15`. Mô hình:
    `seedance-1-5-pro-251215`.

    Dùng API `content[]` hợp nhất. Hỗ trợ tối đa 2 hình ảnh đầu vào
    (`first_frame` + `last_frame`). Mọi đầu vào phải là URL `https://`
    từ xa. Đặt `role: "first_frame"` / `"last_frame"` trên từng hình ảnh hoặc
    truyền hình ảnh theo vị trí.

    `aspectRatio: "adaptive"` tự động phát hiện tỷ lệ từ hình ảnh đầu vào.
    `audio: true` ánh xạ tới `generate_audio`. `providerOptions.seed`
    (số) được chuyển tiếp.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Yêu cầu plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (bên ngoài, không đi kèm). ID nhà cung cấp: `byteplus-seedance2`. Các mô hình:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Dùng API `content[]` hợp nhất. Hỗ trợ tối đa 9 hình ảnh tham chiếu,
    3 video tham chiếu và 3 tệp âm thanh tham chiếu. Mọi đầu vào phải là URL
    `https://` từ xa. Đặt `role` trên từng nội dung - các giá trị được hỗ trợ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` tự động phát hiện tỷ lệ từ hình ảnh đầu vào.
    `audio: true` ánh xạ tới `generate_audio`. `providerOptions.seed`
    (số) được chuyển tiếp.

  </Accordion>
  <Accordion title="ComfyUI">
    Thực thi cục bộ hoặc trên đám mây theo quy trình làm việc. Hỗ trợ chuyển văn bản thành video và
    hình ảnh thành video thông qua đồ thị đã cấu hình.
  </Accordion>
  <Accordion title="fal">
    Sử dụng luồng dựa trên hàng đợi cho các tác vụ chạy dài. Theo mặc định, OpenClaw chờ tối đa 20
    phút trước khi coi một tác vụ hàng đợi fal đang xử lý là
    hết thời gian chờ. Hầu hết các mô hình video fal
    chấp nhận một tham chiếu hình ảnh duy nhất. Các mô hình chuyển tham chiếu thành video
    Seedance 2.0 chấp nhận tối đa 9 hình ảnh, 3 video và 3 tham chiếu âm thanh, với
    tổng cộng không quá 12 tệp tham chiếu.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Hỗ trợ một tham chiếu hình ảnh hoặc một tham chiếu video. Các yêu cầu tạo âm thanh
    bị bỏ qua kèm cảnh báo trên đường dẫn API Gemini vì API đó từ chối
    tham số `generateAudio` đối với tính năng tạo video Veo hiện tại.
  </Accordion>
  <Accordion title="MiniMax">
    Chỉ hỗ trợ một tham chiếu hình ảnh. MiniMax chấp nhận các độ phân giải `768P` và `1080P`;
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
    điểm cuối nội dung tác vụ được ghi trong tài liệu. Giá trị mặc định `google/veo-3.1-fast` đi kèm
    công bố thời lượng 4/6/8 giây, độ phân giải `720P`/`1080P` và
    tỷ lệ khung hình `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Dùng cùng phần phụ trợ DashScope như Alibaba. Đầu vào tham chiếu phải là URL
    `http(s)` từ xa; các tệp cục bộ bị từ chối ngay từ đầu.
  </Accordion>
  <Accordion title="Runway">
    Hỗ trợ tệp cục bộ thông qua URI dữ liệu. Chuyển video thành video yêu cầu
    `runway/gen4_aleph`. Các lần chạy chỉ dùng văn bản cung cấp tỷ lệ khung hình `16:9` và `9:16`.
  </Accordion>
  <Accordion title="Together">
    Chỉ hỗ trợ một tham chiếu hình ảnh.
  </Accordion>
  <Accordion title="Vydra">
    Sử dụng trực tiếp `https://www.vydra.ai/api/v1` để tránh các chuyển hướng
    làm mất thông tin xác thực. `veo3` được tích hợp chỉ để chuyển văn bản thành video; `kling` yêu cầu
    URL hình ảnh từ xa.
  </Accordion>
  <Accordion title="xAI">
    Mô hình `grok-imagine-video` mặc định hỗ trợ chuyển văn bản thành video, chuyển
    một hình ảnh khung hình đầu tiên thành video, tối đa 7 đầu vào `reference_image` thông qua
    `reference_images` của xAI và các luồng chỉnh sửa/mở rộng video từ xa. Theo mặc định, quá trình tạo
    dùng `480P`; thao tác chuyển một hình ảnh thành video kế thừa tỷ lệ nguồn khi
    bỏ qua `aspectRatio`. Chỉnh sửa/mở rộng video kế thừa kích thước hình học đầu vào và
    không chấp nhận giá trị ghi đè tỷ lệ khung hình hoặc độ phân giải. Thao tác mở rộng chấp nhận 2-10
    giây.

    `grok-imagine-video-1.5` chỉ hỗ trợ chuyển hình ảnh thành video: hãy cung cấp chính xác một hình ảnh.
    Mô hình này hỗ trợ 1-15 giây và `480P`, `720P` hoặc `1080P`, với giá trị mặc định là
    `480P`; bỏ qua `aspectRatio` để kế thừa tỷ lệ hình ảnh nguồn. Các mã định danh
    bản xem trước và bản 1.5 có ngày nhận cùng quy trình xác thực và được chuyển tiếp
    mà không thay đổi.

  </Accordion>
</AccordionGroup>

## Chế độ khả năng của nhà cung cấp

Hợp đồng tạo video dùng chung hỗ trợ các khả năng theo từng chế độ
thay vì chỉ các giới hạn tổng hợp dạng phẳng. Các triển khai nhà cung cấp mới
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

Các trường tổng hợp dạng phẳng như `maxInputImages` và `maxInputVideos`
**không** đủ để công bố khả năng hỗ trợ chế độ chuyển đổi. Nhà cung cấp nên
khai báo rõ ràng `generate`, `imageToVideo` và `videoToVideo` để các bài kiểm thử trực tiếp,
bài kiểm thử hợp đồng và công cụ `video_generate` dùng chung có thể xác thực
khả năng hỗ trợ chế độ một cách xác định.

Khi một mô hình trong một nhà cung cấp hỗ trợ đầu vào tham chiếu rộng hơn
các mô hình còn lại, hãy dùng `maxInputImagesByModel`, `maxInputVideosByModel` hoặc
`maxInputAudiosByModel` thay vì tăng giới hạn cho toàn bộ chế độ.

## Kiểm thử trực tiếp

Phạm vi kiểm thử trực tiếp tùy chọn cho các nhà cung cấp tích hợp dùng chung:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Trình bao bọc của kho mã:

```bash
pnpm test:live:media video
```

Theo mặc định, tệp kiểm thử trực tiếp này ưu tiên các biến môi trường đã xuất của nhà cung cấp hơn
các hồ sơ xác thực đã lưu và chạy một bài kiểm tra nhanh an toàn cho bản phát hành theo mặc định:

- `generate` cho mọi nhà cung cấp không phải FAL trong lượt kiểm tra.
- Lời nhắc lobster dài một giây.
- Giới hạn thao tác cho mỗi nhà cung cấp từ
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`).

FAL là tùy chọn vì độ trễ hàng đợi phía nhà cung cấp có thể chiếm phần lớn thời gian
phát hành:

```bash
pnpm test:live:media video --video-providers fal
```

Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các
chế độ chuyển đổi đã khai báo mà lượt kiểm tra dùng chung có thể thực hiện an toàn với nội dung đa phương tiện cục bộ:

- `imageToVideo` khi `capabilities.imageToVideo.enabled`.
- `videoToVideo` khi `capabilities.videoToVideo.enabled` và
  nhà cung cấp/mô hình chấp nhận đầu vào video cục bộ dựa trên bộ đệm trong lượt
  kiểm tra dùng chung.

Hiện tại, làn kiểm thử trực tiếp `videoToVideo` dùng chung chỉ bao phủ `runway` khi bạn
chọn `runway/gen4_aleph`.

## Cấu hình

Đặt mô hình tạo video mặc định trong cấu hình OpenClaw:

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
