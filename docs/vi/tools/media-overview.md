---
read_when:
    - Tìm tổng quan về các khả năng xử lý phương tiện của OpenClaw
    - Quyết định nhà cung cấp phương tiện nào cần cấu hình
    - Tìm hiểu cách hoạt động của quá trình tạo nội dung đa phương tiện bất đồng bộ
sidebarTitle: Media overview
summary: Tổng quan về các khả năng hình ảnh, video, âm nhạc, giọng nói và hiểu nội dung đa phương tiện
title: Tổng quan về nội dung đa phương tiện
x-i18n:
    generated_at: "2026-05-05T01:51:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd6b93fd79897001d24f3ba5a5c8cb9bd17281116fad17262a6389214db7059
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw tạo hình ảnh, video và nhạc, hiểu nội dung đa phương tiện nhận vào
(hình ảnh, âm thanh, video), và đọc to câu trả lời bằng chuyển văn bản thành giọng nói. Tất cả
khả năng về nội dung đa phương tiện đều được điều khiển bằng công cụ: tác nhân quyết định khi nào dùng chúng dựa
trên cuộc trò chuyện, và mỗi công cụ chỉ xuất hiện khi có ít nhất một
nhà cung cấp hỗ trợ được cấu hình.

## Khả năng

<CardGroup cols={2}>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tạo và chỉnh sửa hình ảnh từ prompt văn bản hoặc hình ảnh tham chiếu qua
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
    Chuyển câu trả lời gửi ra thành âm thanh lời nói qua công cụ `tts` cùng
    cấu hình `messages.tts`. Đồng bộ.
  </Card>
  <Card title="Hiểu nội dung đa phương tiện" href="/vi/nodes/media-understanding" icon="eye">
    Tóm tắt hình ảnh, âm thanh và video nhận vào bằng các nhà cung cấp mô hình
    có khả năng thị giác và các Plugin chuyên dụng để hiểu nội dung đa phương tiện.
  </Card>
  <Card title="Chuyển lời nói thành văn bản" href="/vi/nodes/audio" icon="ear-listen">
    Phiên âm tin nhắn thoại nhận vào thông qua nhà cung cấp STT theo lô hoặc
    STT truyền phát cho Cuộc gọi thoại.
  </Card>
</CardGroup>

## Ma trận khả năng của nhà cung cấp

| Nhà cung cấp | Hình ảnh | Video | Nhạc | TTS | STT | Giọng nói thời gian thực | Hiểu nội dung đa phương tiện |
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
Hiểu nội dung đa phương tiện dùng bất kỳ mô hình có khả năng thị giác hoặc âm thanh nào được đăng ký
trong cấu hình nhà cung cấp của bạn. Ma trận ở trên liệt kê các nhà cung cấp có hỗ trợ
hiểu nội dung đa phương tiện chuyên dụng; hầu hết nhà cung cấp LLM đa phương thức (Anthropic, Google,
OpenAI, v.v.) cũng có thể hiểu nội dung đa phương tiện nhận vào khi được cấu hình làm
mô hình trả lời đang hoạt động.
</Note>

## Bất đồng bộ so với đồng bộ

| Khả năng      | Chế độ         | Lý do                                                                |
| --------------- | ------------ | ------------------------------------------------------------------ |
| Hình ảnh           | Đồng bộ  | Phản hồi của nhà cung cấp trả về trong vài giây; hoàn tất ngay trong câu trả lời. |
| Chuyển văn bản thành giọng nói  | Đồng bộ  | Phản hồi của nhà cung cấp trả về trong vài giây; được đính kèm vào âm thanh câu trả lời. |
| Video           | Bất đồng bộ | Quá trình xử lý của nhà cung cấp mất từ 30 giây đến vài phút.                 |
| Nhạc (dùng chung)  | Bất đồng bộ | Có cùng đặc điểm xử lý phía nhà cung cấp như video.                  |
| Nhạc (ComfyUI) | Đồng bộ  | Quy trình cục bộ chạy ngay với máy chủ ComfyUI đã cấu hình.  |

Đối với công cụ bất đồng bộ, OpenClaw gửi yêu cầu đến nhà cung cấp, trả về id tác vụ
ngay lập tức, và theo dõi công việc trong sổ cái tác vụ. Tác nhân tiếp tục
phản hồi các tin nhắn khác trong khi công việc chạy. Khi nhà cung cấp hoàn tất,
OpenClaw đánh thức tác nhân với các đường dẫn nội dung đa phương tiện đã tạo để nó có thể báo cho
người dùng và, khi chính sách phân phối nguồn yêu cầu, chuyển tiếp kết quả qua
công cụ nhắn tin.

## Chuyển lời nói thành văn bản và Cuộc gọi thoại

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio và xAI đều có thể phiên âm
âm thanh nhận vào qua đường dẫn `tools.media.audio` theo lô khi được cấu hình.
Các Plugin kênh kiểm tra trước ghi chú thoại để gác cổng lượt nhắc đến hoặc phân tích cú pháp
lệnh sẽ đánh dấu tệp đính kèm đã phiên âm trên ngữ cảnh nhận vào, để lượt
hiểu nội dung đa phương tiện dùng chung tái sử dụng bản phiên âm đó thay vì thực hiện lệnh gọi
STT thứ hai cho cùng âm thanh.

Deepgram, ElevenLabs, Mistral, OpenAI và xAI cũng đăng ký các nhà cung cấp
STT truyền phát cho Cuộc gọi thoại, để âm thanh điện thoại trực tiếp có thể được chuyển tiếp đến
nhà cung cấp đã chọn mà không cần chờ bản ghi hoàn tất.

## Ánh xạ nhà cung cấp (cách các nhà cung cấp tách theo bề mặt)

<AccordionGroup>
  <Accordion title="Google">
    Các bề mặt hình ảnh, video, nhạc, TTS theo lô, giọng nói thời gian thực ở backend và
    hiểu nội dung đa phương tiện.
  </Accordion>
  <Accordion title="OpenAI">
    Các bề mặt hình ảnh, video, TTS theo lô, STT theo lô, STT truyền phát cho Cuộc gọi thoại, giọng nói
    thời gian thực ở backend và embedding bộ nhớ.
  </Accordion>
  <Accordion title="DeepInfra">
    Các bề mặt định tuyến chat/mô hình, tạo/chỉnh sửa hình ảnh, văn bản thành video, TTS theo lô,
    STT theo lô, hiểu nội dung hình ảnh và embedding bộ nhớ.
    Các mô hình rerank/phân loại/phát hiện đối tượng gốc của DeepInfra chưa được
    đăng ký cho đến khi OpenClaw có hợp đồng nhà cung cấp chuyên dụng cho các
    danh mục đó.
  </Accordion>
  <Accordion title="xAI">
    Hình ảnh, video, tìm kiếm, thực thi mã, TTS theo lô, STT theo lô và STT truyền phát cho Cuộc gọi
    thoại. Giọng nói thời gian thực của xAI là một khả năng thượng nguồn nhưng
    chưa được đăng ký trong OpenClaw cho đến khi hợp đồng giọng nói thời gian thực dùng chung có thể
    biểu diễn nó.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tạo hình ảnh](/vi/tools/image-generation)
- [Tạo video](/vi/tools/video-generation)
- [Tạo nhạc](/vi/tools/music-generation)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding)
- [Nút âm thanh](/vi/nodes/audio)
