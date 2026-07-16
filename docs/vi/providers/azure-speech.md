---
read_when:
    - Bạn muốn sử dụng tính năng tổng hợp giọng nói Azure Speech cho các phản hồi gửi đi
    - Bạn cần đầu ra ghi chú thoại Ogg Opus gốc từ Azure Speech
summary: Chuyển văn bản thành giọng nói bằng Azure AI Speech cho các phản hồi của OpenClaw
title: Giọng nói Azure
x-i18n:
    generated_at: "2026-07-16T15:07:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech là nhà cung cấp chuyển văn bản thành giọng nói Azure AI Speech được tích hợp sẵn. OpenClaw
gọi trực tiếp API REST của Azure Speech bằng SSML, tổng hợp MP3 cho
các phản hồi tiêu chuẩn, Ogg/Opus gốc cho tin nhắn thoại và mulaw 8 kHz cho
các kênh điện thoại như Cuộc gọi thoại. Yêu cầu gửi định dạng đầu ra do nhà cung cấp sở hữu
qua tiêu đề `X-Microsoft-OutputFormat`.

| Chi tiết                | Giá trị                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID nhà cung cấp         | `azure-speech` (bí danh: `azure`)                                                              |
| Trang web               | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Tài liệu                | [Chuyển văn bản thành giọng nói qua Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Xác thực                | `AZURE_SPEECH_KEY` cùng với `AZURE_SPEECH_REGION`                                                                |
| Giọng nói mặc định      | `en-US-JennyNeural`                                                                                            |
| Tệp đầu ra mặc định     | `audio-24khz-48kbitrate-mono-mp3`                                                                                            |
| Tệp tin nhắn thoại mặc định | `ogg-24khz-16bit-mono-opus`                                                                                        |

## Bắt đầu

<Steps>
  <Step title="Tạo tài nguyên Azure Speech">
    Trong cổng thông tin Azure, hãy tạo một tài nguyên Speech. Sao chép **KEY 1** từ
    Resource Management > Keys and Endpoint và sao chép vị trí tài nguyên,
    chẳng hạn như `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Chọn Azure Speech trong messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Gửi tin nhắn">
    Gửi phản hồi qua bất kỳ kênh nào đã kết nối. OpenClaw tổng hợp âm thanh
    bằng Azure Speech và phân phối MP3 cho âm thanh tiêu chuẩn hoặc Ogg/Opus khi
    kênh yêu cầu tin nhắn thoại.
  </Step>
</Steps>

## Tùy chọn cấu hình

Tất cả tùy chọn nằm trong `messages.tts.providers["azure-speech"]`.

| Tùy chọn                | Mô tả                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `apiKey`      | Khóa tài nguyên Azure Speech. Dự phòng bằng `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` hoặc `SPEECH_KEY`. |
| `region`      | Khu vực tài nguyên Azure Speech. Dự phòng bằng `AZURE_SPEECH_REGION` hoặc `SPEECH_REGION`.             |
| `endpoint`      | Ghi đè điểm cuối Azure Speech tùy chọn. Dự phòng bằng `AZURE_SPEECH_ENDPOINT` đáng tin cậy.                  |
| `baseUrl`      | Ghi đè URL cơ sở Azure Speech tùy chọn.                                                                 |
| `voice`      | ShortName của giọng nói Azure (mặc định `en-US-JennyNeural`). Bí danh cũ: `voiceId`.           |
| `lang`      | Mã ngôn ngữ SSML (mặc định `en-US`).                                                        |
| `outputFormat`      | Định dạng đầu ra tệp âm thanh (mặc định `audio-24khz-48kbitrate-mono-mp3`).                                           |
| `voiceNoteOutputFormat`      | Định dạng đầu ra tin nhắn thoại (mặc định `ogg-24khz-16bit-mono-opus`).                                         |
| `timeoutMs`      | Ghi đè thời gian chờ yêu cầu, tính bằng mili giây. Dự phòng bằng `messages.tts.timeoutMs` toàn cục.          |

Nhà cung cấp được coi là đã cấu hình sau khi đặt `apiKey` cùng với một trong
`region`, `endpoint` hoặc `baseUrl`. Các biến môi trường chỉ được kiểm tra để dự phòng
cho những khóa cấu hình chưa được đặt. Các tệp `.env` trong không gian làm việc không thể đặt
`AZURE_SPEECH_ENDPOINT`; hãy sử dụng môi trường tiến trình, dotenv của môi trường chạy toàn cục
hoặc cấu hình tường minh để định tuyến điểm cuối.

## Ghi chú

<AccordionGroup>
  <Accordion title="Xác thực">
    Azure Speech sử dụng khóa tài nguyên Speech, không phải khóa Azure OpenAI. Khóa
    được gửi dưới dạng `Ocp-Apim-Subscription-Key`; OpenClaw suy ra
    `https://<region>.tts.speech.microsoft.com` từ `region` trừ khi bạn
    cung cấp `endpoint` hoặc `baseUrl`.
  </Accordion>
  <Accordion title="Tên giọng nói">
    Sử dụng giá trị `ShortName` của giọng nói Azure Speech, ví dụ
    `en-US-JennyNeural`. Nhà cung cấp tích hợp sẵn có thể liệt kê các giọng nói thông qua
    cùng tài nguyên Speech và lọc bỏ những giọng nói được đánh dấu là không còn được khuyến nghị, đã ngừng cung cấp
    hoặc bị vô hiệu hóa.
  </Accordion>
  <Accordion title="Đầu ra âm thanh">
    Azure chấp nhận các định dạng đầu ra như `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` và `riff-24khz-16bit-mono-pcm`. OpenClaw
    yêu cầu Ogg/Opus cho các đích `voice-note` để các kênh có thể gửi bong bóng thoại gốc
    mà không cần chuyển đổi thêm từ MP3, đồng thời bắt buộc
    `raw-8khz-8bit-mono-mulaw` cho các đích điện thoại.
  </Accordion>
  <Accordion title="Bí danh">
    `azure` được chấp nhận làm bí danh nhà cung cấp cho cấu hình hiện có, nhưng cấu hình
    mới nên sử dụng `azure-speech` để tránh nhầm lẫn với các nhà cung cấp mô hình
    Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chuyển văn bản thành giọng nói" href="/vi/tools/tts" icon="waveform-lines">
    Tổng quan về TTS, các nhà cung cấp và cấu hình `messages.tts`.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ, bao gồm các thiết lập `messages.tts`.
  </Card>
  <Card title="Nhà cung cấp" href="/vi/providers" icon="grid">
    Tất cả nhà cung cấp OpenClaw được tích hợp sẵn.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và các bước gỡ lỗi.
  </Card>
</CardGroup>
