---
read_when:
    - Tìm kiếm thông tin tổng quan về các khả năng đa phương tiện của OpenClaw
    - Quyết định nhà cung cấp phương tiện nào cần cấu hình
    - Tìm hiểu cách hoạt động của việc tạo nội dung đa phương tiện bất đồng bộ
sidebarTitle: Media overview
summary: Tổng quan về các khả năng xử lý hình ảnh, video, âm nhạc, giọng nói và hiểu nội dung đa phương tiện
title: Tổng quan về đa phương tiện
x-i18n:
    generated_at: "2026-04-29T23:19:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw tạo hình ảnh, video và nhạc, hiểu phương tiện đến
(hình ảnh, âm thanh, video), và đọc to câu trả lời bằng chuyển văn bản thành giọng nói. Tất cả
năng lực phương tiện đều được điều khiển bằng công cụ: agent quyết định khi nào dùng chúng dựa
trên cuộc trò chuyện, và mỗi công cụ chỉ xuất hiện khi có ít nhất một
nhà cung cấp nền được cấu hình.

## Năng lực

<CardGroup cols={2}>
  <Card title="Image generation" href="/vi/tools/image-generation" icon="image">
    Tạo và chỉnh sửa hình ảnh từ lời nhắc văn bản hoặc hình ảnh tham chiếu qua
    `image_generate`. Đồng bộ — hoàn tất nội tuyến cùng câu trả lời.
  </Card>
  <Card title="Video generation" href="/vi/tools/video-generation" icon="video">
    Văn bản sang video, hình ảnh sang video và video sang video qua `video_generate`.
    Bất đồng bộ — chạy trong nền và đăng kết quả khi sẵn sàng.
  </Card>
  <Card title="Music generation" href="/vi/tools/music-generation" icon="music">
    Tạo nhạc hoặc bản âm thanh qua `music_generate`. Bất đồng bộ trên các nhà cung cấp
    dùng chung; đường dẫn quy trình ComfyUI chạy đồng bộ.
  </Card>
  <Card title="Text-to-speech" href="/vi/tools/tts" icon="microphone">
    Chuyển câu trả lời gửi đi thành âm thanh nói qua công cụ `tts` cộng với
    cấu hình `messages.tts`. Đồng bộ.
  </Card>
  <Card title="Media understanding" href="/vi/nodes/media-understanding" icon="eye">
    Tóm tắt hình ảnh, âm thanh và video đến bằng các nhà cung cấp mô hình
    có khả năng thị giác và các plugin hiểu phương tiện chuyên dụng.
  </Card>
  <Card title="Speech-to-text" href="/vi/nodes/audio" icon="ear-listen">
    Chép lời tin nhắn thoại đến thông qua các nhà cung cấp STT theo lô hoặc
    STT truyền phát Cuộc gọi thoại.
  </Card>
</CardGroup>

## Ma trận năng lực của nhà cung cấp

| Nhà cung cấp | Hình ảnh | Video | Nhạc | TTS | STT | Giọng nói thời gian thực | Hiểu phương tiện |
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
| Local CLI   |       |       |       |  ✓  |     |                |                     |
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
Hiểu phương tiện dùng bất kỳ mô hình có khả năng thị giác hoặc âm thanh nào được đăng ký
trong cấu hình nhà cung cấp của bạn. Ma trận trên liệt kê các nhà cung cấp có hỗ trợ
hiểu phương tiện chuyên dụng; hầu hết nhà cung cấp LLM đa phương thức (Anthropic, Google,
OpenAI, v.v.) cũng có thể hiểu phương tiện đến khi được cấu hình làm mô hình
trả lời đang hoạt động.
</Note>

## Bất đồng bộ so với đồng bộ

| Năng lực | Chế độ | Lý do |
| --------------- | ------------ | ------------------------------------------------------------------ |
| Hình ảnh | Đồng bộ | Phản hồi của nhà cung cấp trả về trong vài giây; hoàn tất nội tuyến cùng câu trả lời. |
| Chuyển văn bản thành giọng nói | Đồng bộ | Phản hồi của nhà cung cấp trả về trong vài giây; được đính kèm vào âm thanh câu trả lời. |
| Video | Bất đồng bộ | Quá trình xử lý của nhà cung cấp mất 30 giây đến vài phút. |
| Nhạc (dùng chung) | Bất đồng bộ | Cùng đặc tính xử lý phía nhà cung cấp như video. |
| Nhạc (ComfyUI) | Đồng bộ | Quy trình cục bộ chạy nội tuyến với máy chủ ComfyUI đã cấu hình. |

Đối với công cụ bất đồng bộ, OpenClaw gửi yêu cầu đến nhà cung cấp, trả về mã tác vụ
ngay lập tức và theo dõi công việc trong sổ cái tác vụ. Agent tiếp tục
phản hồi các tin nhắn khác trong khi công việc chạy. Khi nhà cung cấp hoàn tất,
OpenClaw đánh thức agent để có thể đăng phương tiện đã hoàn thành trở lại
kênh ban đầu.

## Chuyển giọng nói thành văn bản và Cuộc gọi thoại

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio và xAI đều có thể chép lời
âm thanh đến thông qua đường dẫn `tools.media.audio` theo lô khi được cấu hình.
Các plugin kênh kiểm tra trước một ghi chú thoại để cổng nhắc đến hoặc phân tích
lệnh sẽ đánh dấu tệp đính kèm đã chép lời trên ngữ cảnh đến, để lượt
hiểu phương tiện dùng chung tái sử dụng bản chép lời đó thay vì thực hiện cuộc gọi
STT thứ hai cho cùng âm thanh.

Deepgram, ElevenLabs, Mistral, OpenAI và xAI cũng đăng ký các nhà cung cấp
STT truyền phát Cuộc gọi thoại, để âm thanh điện thoại trực tiếp có thể được chuyển tiếp đến
nhà cung cấp đã chọn mà không cần chờ bản ghi hoàn tất.

## Ánh xạ nhà cung cấp (cách nhà cung cấp phân chia giữa các bề mặt)

<AccordionGroup>
  <Accordion title="Google">
    Các bề mặt hình ảnh, video, nhạc, TTS theo lô, giọng nói thời gian thực phía backend và
    hiểu phương tiện.
  </Accordion>
  <Accordion title="OpenAI">
    Các bề mặt hình ảnh, video, TTS theo lô, STT theo lô, STT truyền phát Cuộc gọi thoại, giọng nói
    thời gian thực phía backend và nhúng bộ nhớ.
  </Accordion>
  <Accordion title="DeepInfra">
    Các bề mặt định tuyến trò chuyện/mô hình, tạo/chỉnh sửa hình ảnh, văn bản sang video, TTS theo lô,
    STT theo lô, hiểu phương tiện hình ảnh và nhúng bộ nhớ.
    Các mô hình xếp hạng lại/phân loại/phát hiện đối tượng gốc DeepInfra không được
    đăng ký cho đến khi OpenClaw có hợp đồng nhà cung cấp chuyên dụng cho các
    danh mục đó.
  </Accordion>
  <Accordion title="xAI">
    Hình ảnh, video, tìm kiếm, thực thi mã, TTS theo lô, STT theo lô và STT truyền phát
    Cuộc gọi thoại. Giọng nói thời gian thực xAI là một năng lực phía upstream nhưng
    chưa được đăng ký trong OpenClaw cho đến khi hợp đồng giọng nói thời gian thực dùng chung có thể
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
