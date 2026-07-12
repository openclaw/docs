---
read_when:
    - Tìm hiểu tổng quan về các khả năng xử lý phương tiện của OpenClaw
    - Quyết định nhà cung cấp phương tiện cần cấu hình
    - Tìm hiểu cách hoạt động của quá trình tạo nội dung đa phương tiện bất đồng bộ
sidebarTitle: Media overview
summary: Tổng quan nhanh về các khả năng tạo hình ảnh, video, âm nhạc, giọng nói và hiểu nội dung đa phương tiện
title: Tổng quan về phương tiện truyền thông
x-i18n:
    generated_at: "2026-07-12T08:27:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw tạo hình ảnh, video và nhạc, hiểu phương tiện đầu vào
(hình ảnh, âm thanh, video) và đọc thành tiếng các phản hồi bằng công nghệ chuyển văn bản thành giọng nói. Mọi
khả năng phương tiện đều do công cụ điều khiển: tác tử quyết định thời điểm sử dụng dựa trên
cuộc hội thoại, và mỗi công cụ chỉ xuất hiện khi có ít nhất một nhà cung cấp hỗ trợ
được cấu hình.

Giọng nói trực tiếp sử dụng hợp đồng phiên Talk thay vì đường dẫn công cụ phương tiện dùng một lần.
Talk có ba chế độ: `realtime` gốc của nhà cung cấp, `stt-tts` cục bộ hoặc phát trực tuyến
và `transcription` để chỉ quan sát việc thu nhận giọng nói. Các chế độ này
dùng chung danh mục nhà cung cấp, phong bì sự kiện và ngữ nghĩa hủy với
điện thoại, cuộc họp, thời gian thực trên trình duyệt và các ứng dụng khách nhấn để nói gốc.

## Khả năng

<CardGroup cols={2}>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tạo và chỉnh sửa hình ảnh từ lời nhắc văn bản hoặc hình ảnh tham chiếu qua
    `image_generate`. Bất đồng bộ trong phiên trò chuyện — chạy trong nền và
    đăng kết quả khi sẵn sàng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Chuyển văn bản thành video, hình ảnh thành video và video thành video qua `video_generate`.
    Bất đồng bộ — chạy trong nền và đăng kết quả khi sẵn sàng.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Tạo nhạc hoặc bản âm thanh qua `music_generate`. Bất đồng bộ trong các phiên trò chuyện
    theo vòng đời tác vụ tạo phương tiện dùng chung.
  </Card>
  <Card title="Chuyển văn bản thành giọng nói" href="/vi/tools/tts" icon="microphone">
    Chuyển đổi phản hồi đầu ra thành âm thanh giọng nói qua công cụ `tts` cùng với
    cấu hình `messages.tts`. Đồng bộ.
  </Card>
  <Card title="Hiểu phương tiện" href="/vi/nodes/media-understanding" icon="eye">
    Tóm tắt hình ảnh, âm thanh và video đầu vào bằng các nhà cung cấp mô hình
    hỗ trợ thị giác và các plugin chuyên dụng để hiểu phương tiện.
  </Card>
  <Card title="Chuyển giọng nói thành văn bản" href="/vi/nodes/audio" icon="ear-listen">
    Phiên âm tin nhắn thoại đầu vào thông qua các nhà cung cấp STT theo lô hoặc
    STT phát trực tuyến cho Cuộc gọi thoại.
  </Card>
</CardGroup>

## Ma trận khả năng của nhà cung cấp

<Note>
Bảng này bao gồm các plugin chuyên dụng cho tạo phương tiện, TTS và STT. Nhiều
nhà cung cấp mô hình trò chuyện (Anthropic, Google, OpenAI và các nhà cung cấp khác) cũng hiểu
phương tiện đầu vào thông qua mô hình phản hồi của họ; xem danh sách đầy đủ các nhà cung cấp tại
[Hiểu phương tiện](/vi/nodes/media-understanding#provider-support-matrix).
</Note>

| Nhà cung cấp     | Hình ảnh | Video | Nhạc | TTS | STT | Giọng nói thời gian thực | Hiểu phương tiện |
| ----------------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba           |       |   ✓   |       |     |     |                |                     |
| Azure Speech      |       |       |       |  ✓  |     |                |                     |
| BytePlus          |       |   ✓   |       |     |     |                |                     |
| ComfyUI           |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Deepgram          |       |       |       |     |  ✓  |                |                     |
| DeepInfra         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| ElevenLabs        |       |       |       |  ✓  |  ✓  |                |                     |
| fal               |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Google            |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |       ✓        |          ✓          |
| Gradium           |       |       |       |  ✓  |     |                |                     |
| Inworld           |       |       |       |  ✓  |     |                |                     |
| LiteLLM           |   ✓   |       |       |     |     |                |                     |
| CLI cục bộ        |       |       |       |  ✓  |     |                |                     |
| Microsoft         |       |       |       |  ✓  |     |                |                     |
| Microsoft Foundry |   ✓   |       |       |     |     |                |                     |
| MiniMax           |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral           |       |       |       |     |  ✓  |                |                     |
| OpenAI            |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter        |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                |          ✓          |
| PixVerse          |       |   ✓   |       |     |     |                |                     |
| Qwen              |       |   ✓   |       |     |     |                |          ✓          |
| Runway            |       |   ✓   |       |     |     |                |                     |
| SenseAudio        |       |       |       |     |  ✓  |                |                     |
| Together          |       |   ✓   |       |     |     |                |                     |
| Volcengine        |       |       |       |  ✓  |     |                |                     |
| Vydra             |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI               |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo       |       |       |       |  ✓  |     |                |                     |

<Note>
**Giọng nói thời gian thực** ở đây có nghĩa là thời gian thực hai chiều gốc của nhà cung cấp (chế độ
`realtime` của Talk, ví dụ Gemini Live hoặc OpenAI Realtime API) — hiện chỉ Google
và OpenAI đăng ký khả năng này. Deepgram, ElevenLabs, Mistral, OpenAI và xAI
đăng ký riêng STT phát trực tuyến cho Cuộc gọi thoại (âm thanh một chiều thành văn bản); xem
[Chuyển giọng nói thành văn bản và Cuộc gọi thoại](#speech-to-text-and-voice-call) bên dưới.
Giọng nói thời gian thực của xAI là một khả năng từ thượng nguồn nhưng chưa được đăng ký trong
OpenClaw cho đến khi hợp đồng giọng nói thời gian thực dùng chung có thể biểu diễn khả năng đó.
</Note>

## Bất đồng bộ và đồng bộ

| Khả năng                 | Chế độ       | Lý do                                                                                                         |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------- |
| Hình ảnh                 | Bất đồng bộ  | Quá trình xử lý của nhà cung cấp có thể kéo dài hơn một lượt trò chuyện; tệp đính kèm được tạo sử dụng đường dẫn hoàn tất dùng chung. |
| Chuyển văn bản thành giọng nói | Đồng bộ | Phản hồi của nhà cung cấp trở về trong vài giây; được đính kèm vào âm thanh phản hồi.                         |
| Video                    | Bất đồng bộ  | Quá trình xử lý của nhà cung cấp mất từ 30 giây đến vài phút; hàng đợi chậm có thể chạy đến thời gian chờ đã cấu hình. |
| Nhạc                     | Bất đồng bộ  | Có cùng đặc tính xử lý của nhà cung cấp như video.                                                            |

Đối với công cụ bất đồng bộ, OpenClaw gửi yêu cầu đến nhà cung cấp, trả về ngay
mã tác vụ và theo dõi công việc trong sổ cái tác vụ. Tác tử tiếp tục
phản hồi các tin nhắn khác trong khi công việc đang chạy. Khi nhà cung cấp hoàn tất,
OpenClaw đánh thức tác tử với các đường dẫn phương tiện đã tạo để tác tử có thể thông báo cho
người dùng qua chế độ phản hồi hiển thị thông thường của phiên: tự động gửi phản hồi cuối cùng
khi được cấu hình, hoặc `message(action="send")` khi phiên yêu cầu
công cụ tin nhắn. Nếu phiên của bên yêu cầu không hoạt động hoặc lần đánh thức đang hoạt động
thất bại, và một số phương tiện đã tạo vẫn còn thiếu trong phản hồi hoàn tất,
OpenClaw gửi một phương án dự phòng trực tiếp có tính lũy đẳng chỉ chứa phương tiện còn thiếu. Phương tiện
đã được gửi qua phản hồi hoàn tất sẽ không được đăng lại.

## Chuyển giọng nói thành văn bản và Cuộc gọi thoại

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio và xAI đều có thể phiên âm âm thanh đầu vào thông qua đường dẫn theo lô
`tools.media.audio` khi được cấu hình. Các plugin kênh kiểm tra trước
ghi chú thoại để kiểm soát việc đề cập hoặc phân tích cú pháp lệnh sẽ đánh dấu tệp đính kèm đã phiên âm
trên ngữ cảnh đầu vào, nhờ đó lượt hiểu phương tiện dùng chung
tái sử dụng bản phiên âm đó thay vì thực hiện lệnh gọi STT thứ hai cho cùng
âm thanh.

Deepgram, ElevenLabs, Mistral, OpenAI và xAI cũng đăng ký các nhà cung cấp
STT phát trực tuyến cho Cuộc gọi thoại, nhờ đó âm thanh điện thoại trực tiếp có thể được chuyển tiếp đến nhà cung cấp
đã chọn mà không cần chờ bản ghi hoàn tất.

Đối với các cuộc hội thoại trực tiếp với người dùng, hãy ưu tiên [chế độ Talk](/vi/nodes/talk). Tệp đính kèm âm thanh
theo lô vẫn đi theo đường dẫn phương tiện; âm thanh thời gian thực trên trình duyệt, nhấn để nói gốc,
điện thoại và cuộc họp nên sử dụng các sự kiện Talk cùng danh mục theo phạm vi phiên
do Gateway trả về.

## Ánh xạ nhà cung cấp (cách các nhà cung cấp phân chia giữa các bề mặt)

<AccordionGroup>
  <Accordion title="Google">
    Các bề mặt hình ảnh, video, nhạc, TTS theo lô, STT theo lô, giọng nói thời gian thực ở phía máy chủ và
    hiểu phương tiện.
  </Accordion>
  <Accordion title="OpenAI">
    Các bề mặt hình ảnh, video, TTS theo lô, STT theo lô, STT phát trực tuyến cho Cuộc gọi thoại, giọng nói
    thời gian thực ở phía máy chủ và nhúng bộ nhớ.
  </Accordion>
  <Accordion title="DeepInfra">
    Các bề mặt định tuyến trò chuyện/mô hình, tạo/chỉnh sửa hình ảnh, chuyển văn bản thành video, TTS theo lô,
    STT theo lô, hiểu phương tiện hình ảnh và nhúng bộ nhớ.
    DeepInfra cũng cung cấp xếp hạng lại, phân loại, phát hiện đối tượng và
    các loại mô hình gốc khác; OpenClaw chưa có hợp đồng nhà cung cấp cho những
    danh mục đó, vì vậy plugin này không đăng ký chúng.
  </Accordion>
  <Accordion title="xAI">
    Hình ảnh, video, tìm kiếm, thực thi mã, TTS theo lô, STT theo lô và STT phát trực tuyến cho Cuộc gọi
    thoại. Giọng nói thời gian thực của xAI là một khả năng từ thượng nguồn nhưng
    chưa được đăng ký trong OpenClaw cho đến khi hợp đồng giọng nói thời gian thực dùng chung có thể
    biểu diễn khả năng đó.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tạo hình ảnh](/vi/tools/image-generation)
- [Tạo video](/vi/tools/video-generation)
- [Tạo nhạc](/vi/tools/music-generation)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Hiểu phương tiện](/vi/nodes/media-understanding)
- [Node âm thanh](/vi/nodes/audio)
- [Chế độ Talk](/vi/nodes/talk)
