---
read_when:
    - Tìm phần tổng quan về các khả năng phương tiện của OpenClaw
    - Quyết định cấu hình nhà cung cấp phương tiện nào
    - Hiểu cách hoạt động của quy trình tạo nội dung đa phương tiện bất đồng bộ
sidebarTitle: Media overview
summary: Sơ lược về các năng lực hình ảnh, video, âm nhạc, giọng nói và hiểu nội dung đa phương tiện
title: Tổng quan về đa phương tiện
x-i18n:
    generated_at: "2026-06-27T18:16:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw tạo hình ảnh, video và nhạc, hiểu phương tiện đầu vào
(hình ảnh, âm thanh, video), và đọc to phản hồi bằng chuyển văn bản thành giọng nói. Tất cả
khả năng phương tiện đều do công cụ điều khiển: tác tử quyết định thời điểm dùng chúng dựa trên
cuộc trò chuyện, và mỗi công cụ chỉ xuất hiện khi có ít nhất một
nhà cung cấp nền được cấu hình.

Lời nói trực tiếp dùng hợp đồng phiên Talk thay vì đường dẫn công cụ phương tiện
một lần. Talk có ba chế độ: `realtime` gốc theo nhà cung cấp, `stt-tts`
cục bộ hoặc phát trực tuyến, và `transcription` để thu lời nói chỉ quan sát. Các chế độ đó
dùng chung danh mục nhà cung cấp, phong bì sự kiện và ngữ nghĩa hủy với
điện thoại, cuộc họp, thời gian thực trên trình duyệt và ứng dụng khách nhấn-để-nói gốc.

## Khả năng

<CardGroup cols={2}>
  <Card title="Tạo hình ảnh" href="/vi/tools/image-generation" icon="image">
    Tạo và chỉnh sửa hình ảnh từ lời nhắc văn bản hoặc hình ảnh tham chiếu qua
    `image_generate`. Bất đồng bộ trong phiên trò chuyện — chạy trong nền và
    đăng kết quả khi sẵn sàng.
  </Card>
  <Card title="Tạo video" href="/vi/tools/video-generation" icon="video">
    Văn bản sang video, hình ảnh sang video và video sang video qua `video_generate`.
    Bất đồng bộ — chạy trong nền và đăng kết quả khi sẵn sàng.
  </Card>
  <Card title="Tạo nhạc" href="/vi/tools/music-generation" icon="music">
    Tạo nhạc hoặc bản âm thanh qua `music_generate`. Bất đồng bộ trong các phiên trò chuyện
    trên vòng đời tác vụ tạo phương tiện dùng chung.
  </Card>
  <Card title="Chuyển văn bản thành giọng nói" href="/vi/tools/tts" icon="microphone">
    Chuyển phản hồi gửi đi thành âm thanh lời nói qua công cụ `tts` cộng với
    cấu hình `messages.tts`. Đồng bộ.
  </Card>
  <Card title="Hiểu phương tiện" href="/vi/nodes/media-understanding" icon="eye">
    Tóm tắt hình ảnh, âm thanh và video đầu vào bằng các nhà cung cấp mô hình
    có khả năng thị giác và các Plugin hiểu phương tiện chuyên dụng.
  </Card>
  <Card title="Chuyển giọng nói thành văn bản" href="/vi/nodes/audio" icon="ear-listen">
    Chép lại tin nhắn thoại đầu vào thông qua STT theo lô hoặc nhà cung cấp
    STT phát trực tuyến cho Cuộc gọi thoại.
  </Card>
</CardGroup>

## Ma trận khả năng của nhà cung cấp

| Nhà cung cấp       | Hình ảnh | Video | Nhạc | TTS | STT | Giọng nói thời gian thực | Hiểu phương tiện |
| ------------------ | :------: | :---: | :--: | :-: | :-: | :----------------------: | :--------------: |
| Alibaba            |          |   ✓   |      |     |     |                          |                  |
| BytePlus           |          |   ✓   |      |     |     |                          |                  |
| ComfyUI            |    ✓     |   ✓   |  ✓   |     |     |                          |                  |
| DeepInfra          |    ✓     |   ✓   |      |  ✓  |  ✓  |                          |        ✓         |
| Deepgram           |          |       |      |     |  ✓  |            ✓             |                  |
| ElevenLabs         |          |       |      |  ✓  |  ✓  |                          |                  |
| fal                |    ✓     |   ✓   |  ✓   |     |     |                          |                  |
| Google             |    ✓     |   ✓   |  ✓   |  ✓  |     |            ✓             |        ✓         |
| Gradium            |          |       |      |  ✓  |     |                          |                  |
| CLI cục bộ         |          |       |      |  ✓  |     |                          |                  |
| Microsoft          |          |       |      |  ✓  |     |                          |                  |
| Microsoft Foundry  |    ✓     |       |      |     |     |                          |                  |
| MiniMax            |    ✓     |   ✓   |  ✓   |  ✓  |     |                          |                  |
| Mistral            |          |       |      |     |  ✓  |                          |                  |
| OpenAI             |    ✓     |   ✓   |      |  ✓  |  ✓  |            ✓             |        ✓         |
| OpenRouter         |    ✓     |   ✓   |  ✓   |  ✓  |  ✓  |                          |        ✓         |
| Qwen               |          |   ✓   |      |     |     |                          |                  |
| Runway             |          |   ✓   |      |     |     |                          |                  |
| SenseAudio         |          |       |      |     |  ✓  |                          |                  |
| Together           |          |   ✓   |      |     |     |                          |                  |
| Vydra              |    ✓     |   ✓   |      |  ✓  |     |                          |                  |
| xAI                |    ✓     |   ✓   |      |  ✓  |  ✓  |                          |        ✓         |
| Xiaomi MiMo        |    ✓     |       |      |  ✓  |     |                          |        ✓         |

<Note>
Hiểu phương tiện dùng bất kỳ mô hình có khả năng thị giác hoặc âm thanh nào được đăng ký
trong cấu hình nhà cung cấp của bạn. Ma trận ở trên liệt kê các nhà cung cấp có hỗ trợ
hiểu phương tiện chuyên dụng; hầu hết nhà cung cấp LLM đa phương thức (Anthropic, Google,
OpenAI, v.v.) cũng có thể hiểu phương tiện đầu vào khi được cấu hình làm mô hình
phản hồi đang hoạt động.
</Note>

## Bất đồng bộ so với đồng bộ

| Khả năng                  | Chế độ       | Lý do                                                                                                |
| ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Hình ảnh                  | Bất đồng bộ  | Quá trình xử lý của nhà cung cấp có thể kéo dài hơn một lượt trò chuyện; tệp đính kèm được tạo dùng đường dẫn hoàn tất dùng chung. |
| Chuyển văn bản thành giọng nói | Đồng bộ      | Phản hồi của nhà cung cấp trả về trong vài giây; được đính kèm vào âm thanh phản hồi.                 |
| Video                     | Bất đồng bộ  | Quá trình xử lý của nhà cung cấp mất 30 giây đến vài phút; hàng đợi chậm có thể chạy đến thời gian chờ đã cấu hình. |
| Nhạc                      | Bất đồng bộ  | Có cùng đặc tính xử lý bởi nhà cung cấp như video.                                                    |

Đối với công cụ bất đồng bộ, OpenClaw gửi yêu cầu tới nhà cung cấp, trả về mã tác vụ
ngay lập tức, và theo dõi công việc trong sổ cái tác vụ. Tác tử tiếp tục
phản hồi các tin nhắn khác trong khi công việc chạy. Khi nhà cung cấp hoàn tất,
OpenClaw đánh thức tác tử với các đường dẫn phương tiện đã tạo để nó có thể báo cho
người dùng thông qua chế độ phản hồi hiển thị bình thường của phiên: tự động gửi phản hồi cuối
khi được cấu hình, hoặc `message(action="send")` khi phiên yêu cầu
công cụ tin nhắn. Nếu phiên yêu cầu không hoạt động hoặc lần đánh thức đang hoạt động của phiên
thất bại, và một số phương tiện đã tạo vẫn còn thiếu trong phản hồi hoàn tất,
OpenClaw gửi một dự phòng trực tiếp lũy đẳng chỉ với phần phương tiện bị thiếu. Phương tiện
đã được gửi bằng phản hồi hoàn tất sẽ không được đăng lại.

## Chuyển giọng nói thành văn bản và Cuộc gọi thoại

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio và xAI đều có thể chép lại
âm thanh đầu vào thông qua đường dẫn `tools.media.audio` theo lô khi được cấu hình.
Các Plugin kênh kiểm tra trước ghi chú thoại để chặn theo lượt nhắc hoặc
phân tích lệnh sẽ đánh dấu tệp đính kèm đã chép lại trên ngữ cảnh đầu vào, để lượt
hiểu phương tiện dùng chung tái sử dụng bản chép đó thay vì thực hiện cuộc gọi
STT thứ hai cho cùng âm thanh.

Deepgram, ElevenLabs, Mistral, OpenAI và xAI cũng đăng ký các nhà cung cấp
STT phát trực tuyến cho Cuộc gọi thoại, nên âm thanh điện thoại trực tiếp có thể được chuyển tiếp tới
nhà cung cấp đã chọn mà không cần chờ bản ghi hoàn chỉnh.

Đối với cuộc trò chuyện người dùng trực tiếp, hãy ưu tiên [chế độ Talk](/vi/nodes/talk). Tệp đính kèm âm thanh
theo lô vẫn nằm trên đường dẫn phương tiện; thời gian thực trên trình duyệt, nhấn-để-nói gốc,
điện thoại và âm thanh cuộc họp nên dùng sự kiện Talk và danh mục theo phạm vi phiên
do Gateway trả về.

## Ánh xạ nhà cung cấp (cách nhà cung cấp phân tách giữa các bề mặt)

<AccordionGroup>
  <Accordion title="Google">
    Các bề mặt hình ảnh, video, nhạc, TTS theo lô, giọng nói thời gian thực phía backend và
    hiểu phương tiện.
  </Accordion>
  <Accordion title="OpenAI">
    Các bề mặt hình ảnh, video, TTS theo lô, STT theo lô, STT phát trực tuyến cho Cuộc gọi thoại,
    giọng nói thời gian thực phía backend và nhúng bộ nhớ.
  </Accordion>
  <Accordion title="DeepInfra">
    Định tuyến trò chuyện/mô hình, tạo/chỉnh sửa hình ảnh, văn bản sang video, TTS theo lô,
    STT theo lô, hiểu phương tiện hình ảnh và các bề mặt nhúng bộ nhớ.
    Các mô hình xếp hạng lại/phân loại/phát hiện đối tượng gốc DeepInfra sẽ không
    được đăng ký cho đến khi OpenClaw có hợp đồng nhà cung cấp chuyên dụng cho các
    danh mục đó.
  </Accordion>
  <Accordion title="xAI">
    Hình ảnh, video, tìm kiếm, thực thi mã, TTS theo lô, STT theo lô và STT phát trực tuyến
    cho Cuộc gọi thoại. Giọng nói thời gian thực của xAI là một khả năng thượng nguồn nhưng
    chưa được đăng ký trong OpenClaw cho đến khi hợp đồng giọng nói thời gian thực dùng chung
    có thể biểu diễn nó.
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
