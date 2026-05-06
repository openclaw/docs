---
read_when:
    - Tìm tổng quan về các khả năng phương tiện của OpenClaw
    - Quyết định nhà cung cấp phương tiện nào cần cấu hình
    - Tìm hiểu cách hoạt động của quá trình tạo phương tiện không đồng bộ
sidebarTitle: Media overview
summary: Tổng quan về các khả năng về hình ảnh, video, âm nhạc, giọng nói và hiểu nội dung đa phương tiện
title: Tổng quan về đa phương tiện
x-i18n:
    generated_at: "2026-05-06T09:34:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201d01244fc6a587b730ae3033de5990b2f01f63e6e40339c738c95040e085b3
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw tạo hình ảnh, video và nhạc, hiểu phương tiện gửi đến
(hình ảnh, âm thanh, video), và đọc to câu trả lời bằng chuyển văn bản thành giọng nói. Tất cả
khả năng phương tiện đều do công cụ điều khiển: agent quyết định khi nào dùng chúng dựa trên
cuộc trò chuyện, và mỗi công cụ chỉ xuất hiện khi có ít nhất một
nhà cung cấp nền được cấu hình.

Giọng nói trực tiếp dùng hợp đồng phiên Talk thay vì đường dẫn công cụ phương tiện một lần.
Talk có ba chế độ: `realtime` gốc theo nhà cung cấp, `stt-tts` cục bộ hoặc truyền trực tuyến,
và `transcription` để chỉ quan sát việc thu giọng nói. Các chế độ đó
chia sẻ danh mục nhà cung cấp, bao sự kiện và ngữ nghĩa hủy với
điện thoại, cuộc họp, realtime trên trình duyệt và các máy khách push-to-talk gốc.

## Khả năng

<CardGroup cols={2}>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tạo và chỉnh sửa hình ảnh từ lời nhắc văn bản hoặc hình ảnh tham chiếu qua
    `image_generate`. Đồng bộ — hoàn tất ngay trong câu trả lời.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Văn bản thành video, hình ảnh thành video và video thành video qua `video_generate`.
    Bất đồng bộ — chạy trong nền và đăng kết quả khi sẵn sàng.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Tạo nhạc hoặc bản âm thanh qua `music_generate`. Bất đồng bộ trên các
    nhà cung cấp dùng chung; đường dẫn quy trình ComfyUI chạy đồng bộ.
  </Card>
  <Card title="Chuyển văn bản thành giọng nói" href="/vi/tools/tts" icon="microphone">
    Chuyển câu trả lời gửi đi thành âm thanh nói qua công cụ `tts` cùng
    cấu hình `messages.tts`. Đồng bộ.
  </Card>
  <Card title="Hiểu phương tiện" href="/vi/nodes/media-understanding" icon="eye">
    Tóm tắt hình ảnh, âm thanh và video gửi đến bằng các nhà cung cấp mô hình
    có khả năng thị giác và các Plugin chuyên hiểu phương tiện.
  </Card>
  <Card title="Chuyển giọng nói thành văn bản" href="/vi/nodes/audio" icon="ear-listen">
    Phiên âm tin nhắn thoại gửi đến qua STT theo lô hoặc các nhà cung cấp
    STT truyền trực tuyến Voice Call.
  </Card>
</CardGroup>

## Ma trận khả năng của nhà cung cấp

| Nhà cung cấp | Hình ảnh | Video | Nhạc | TTS | STT | Giọng nói realtime | Hiểu phương tiện |
| ----------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba     |       |   ✓   |       |     |     |                |                     |
| BytePlus    |       |   ✓   |       |     |     |                |                     |
| ComfyUI     |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra   |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram    |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs  |       |       |       |  ✓  |  ✓  |                |                     |
| fal         |   ✓   |   ✓   |       |     |     |                |                     |
| Google      |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium     |       |       |       |  ✓  |     |                |                     |
| CLI cục bộ  |       |       |       |  ✓  |     |                |                     |
| Microsoft   |       |       |       |  ✓  |     |                |                     |
| MiniMax     |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral     |       |       |       |     |  ✓  |                |                     |
| OpenAI      |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |     |                |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
Hiểu phương tiện sử dụng bất kỳ mô hình có khả năng thị giác hoặc âm thanh nào được đăng ký
trong cấu hình nhà cung cấp của bạn. Ma trận ở trên liệt kê các nhà cung cấp có hỗ trợ
hiểu phương tiện chuyên dụng; hầu hết nhà cung cấp LLM đa phương thức (Anthropic, Google,
OpenAI, v.v.) cũng có thể hiểu phương tiện gửi đến khi được cấu hình làm mô hình
trả lời đang hoạt động.
</Note>

## Bất đồng bộ so với đồng bộ

| Khả năng        | Chế độ       | Lý do                                                                                                  |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Hình ảnh        | Đồng bộ      | Phản hồi của nhà cung cấp trả về trong vài giây; hoàn tất ngay trong câu trả lời.                     |
| Chuyển văn bản thành giọng nói | Đồng bộ | Phản hồi của nhà cung cấp trả về trong vài giây; được đính kèm vào âm thanh trả lời.                  |
| Video           | Bất đồng bộ  | Xử lý của nhà cung cấp mất 30 giây đến vài phút; hàng đợi chậm có thể chạy đến hết thời gian chờ đã cấu hình. |
| Nhạc (dùng chung) | Bất đồng bộ | Cùng đặc tính xử lý của nhà cung cấp như video.                                                       |
| Nhạc (ComfyUI)  | Đồng bộ      | Quy trình cục bộ chạy ngay với máy chủ ComfyUI đã cấu hình.                                           |

Đối với công cụ bất đồng bộ, OpenClaw gửi yêu cầu đến nhà cung cấp, trả về id tác vụ
ngay lập tức và theo dõi công việc trong sổ cái tác vụ. Agent tiếp tục
phản hồi các tin nhắn khác trong khi công việc chạy. Khi nhà cung cấp hoàn tất,
OpenClaw đánh thức agent với các đường dẫn phương tiện đã tạo để agent có thể báo cho
người dùng và, khi chính sách phân phối nguồn yêu cầu, chuyển tiếp kết quả qua
công cụ tin nhắn. Với các tuyến nhóm/kênh chỉ dùng công cụ tin nhắn, OpenClaw coi
việc thiếu bằng chứng phân phối qua công cụ tin nhắn là một lần hoàn tất thất bại và gửi
phương tiện đã tạo dự phòng trực tiếp đến kênh gốc.

## Chuyển giọng nói thành văn bản và Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio và xAI đều có thể phiên âm
âm thanh gửi đến qua đường dẫn theo lô `tools.media.audio` khi được cấu hình.
Các Plugin kênh kiểm tra trước ghi chú thoại để chặn theo lượt nhắc đến hoặc phân tích
lệnh sẽ đánh dấu tệp đính kèm đã phiên âm trên ngữ cảnh gửi đến, để lượt
hiểu phương tiện dùng chung tái sử dụng bản phiên âm đó thay vì thực hiện lệnh gọi
STT thứ hai cho cùng âm thanh.

Deepgram, ElevenLabs, Mistral, OpenAI và xAI cũng đăng ký các nhà cung cấp
STT truyền trực tuyến Voice Call, để âm thanh điện thoại trực tiếp có thể được chuyển tiếp đến
nhà cung cấp đã chọn mà không cần chờ bản ghi hoàn tất.

Đối với cuộc trò chuyện trực tiếp với người dùng, ưu tiên [chế độ Talk](/vi/nodes/talk). Tệp đính kèm âm thanh theo lô
vẫn nằm trên đường dẫn phương tiện; realtime trên trình duyệt, push-to-talk gốc,
điện thoại và âm thanh cuộc họp nên dùng sự kiện Talk và các danh mục theo phạm vi phiên
do Gateway trả về.

## Ánh xạ nhà cung cấp (cách nhà cung cấp phân chia giữa các bề mặt)

<AccordionGroup>
  <Accordion title="Google">
    Các bề mặt hình ảnh, video, nhạc, TTS theo lô, giọng nói realtime phía backend và
    hiểu phương tiện.
  </Accordion>
  <Accordion title="OpenAI">
    Các bề mặt hình ảnh, video, TTS theo lô, STT theo lô, STT truyền trực tuyến Voice Call, giọng nói
    realtime phía backend và nhúng bộ nhớ.
  </Accordion>
  <Accordion title="DeepInfra">
    Các bề mặt định tuyến trò chuyện/mô hình, tạo/chỉnh sửa hình ảnh, văn bản thành video, TTS theo lô,
    STT theo lô, hiểu phương tiện hình ảnh và nhúng bộ nhớ.
    Các mô hình rerank/phân loại/phát hiện đối tượng gốc DeepInfra chưa được
    đăng ký cho đến khi OpenClaw có hợp đồng nhà cung cấp chuyên dụng cho các
    danh mục đó.
  </Accordion>
  <Accordion title="xAI">
    Hình ảnh, video, tìm kiếm, thực thi mã, TTS theo lô, STT theo lô và STT truyền trực tuyến Voice
    Call. Giọng nói xAI Realtime là một khả năng upstream nhưng
    chưa được đăng ký trong OpenClaw cho đến khi hợp đồng giọng nói realtime dùng chung có thể
    biểu diễn nó.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tạo hình ảnh](/vi/tools/image-generation)
- [Tạo video](/vi/tools/video-generation)
- [Tạo nhạc](/vi/tools/music-generation)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Hiểu phương tiện](/vi/nodes/media-understanding)
- [Nút âm thanh](/vi/nodes/audio)
- [Chế độ Talk](/vi/nodes/talk)
