---
read_when:
    - Bạn muốn dùng tổng hợp giọng nói Azure Speech cho các phản hồi gửi đi
    - Bạn cần đầu ra ghi chú thoại Ogg Opus gốc từ Azure Speech
summary: Chuyển văn bản thành giọng nói bằng Azure AI Speech cho phản hồi của OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:01:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech là nhà cung cấp chuyển văn bản thành giọng nói của Azure AI Speech. Trong OpenClaw, mặc định nó
tổng hợp âm thanh phản hồi gửi đi dưới dạng MP3, Ogg/Opus gốc cho ghi chú thoại,
và âm thanh mulaw 8 kHz cho các kênh điện thoại như Cuộc gọi thoại.

OpenClaw sử dụng trực tiếp Azure Speech REST API với SSML và gửi
định dạng đầu ra do nhà cung cấp sở hữu thông qua `X-Microsoft-OutputFormat`.

| Chi tiết                | Giá trị                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Trang web               | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Tài liệu                | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Xác thực                | `AZURE_SPEECH_KEY` cộng với `AZURE_SPEECH_REGION`                                                              |
| Giọng mặc định          | `en-US-JennyNeural`                                                                                            |
| Đầu ra tệp mặc định     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Tệp ghi chú thoại mặc định | `ogg-24khz-16bit-mono-opus`                                                                                 |

## Bắt đầu

<Steps>
  <Step title="Create an Azure Speech resource">
    Trong Azure portal, tạo một tài nguyên Speech. Sao chép **KEY 1** từ
    Resource Management > Keys and Endpoint, và sao chép vị trí tài nguyên
    chẳng hạn như `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Select Azure Speech in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    Gửi phản hồi qua bất kỳ kênh đã kết nối nào. OpenClaw tổng hợp âm thanh
    bằng Azure Speech và gửi MP3 cho âm thanh tiêu chuẩn, hoặc Ogg/Opus khi
    kênh cần một ghi chú thoại.
  </Step>
</Steps>

## Tùy chọn cấu hình

| Tùy chọn                | Đường dẫn                                                   | Mô tả                                                                                                 |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Khóa tài nguyên Azure Speech. Dự phòng về `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, hoặc `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Vùng tài nguyên Azure Speech. Dự phòng về `AZURE_SPEECH_REGION` hoặc `SPEECH_REGION`.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Ghi đè endpoint/base URL Azure Speech tùy chọn.                                                       |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Ghi đè base URL Azure Speech tùy chọn.                                                                |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | Azure voice ShortName (mặc định `en-US-JennyNeural`). Bí danh cũ: `voice`.                            |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Mã ngôn ngữ SSML (mặc định `en-US`).                                                                  |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Định dạng đầu ra tệp âm thanh (mặc định `audio-24khz-48kbitrate-mono-mp3`).                           |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Định dạng đầu ra ghi chú thoại (mặc định `ogg-24khz-16bit-mono-opus`).                                |

## Ghi chú

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech sử dụng khóa tài nguyên Speech, không phải khóa Azure OpenAI. Khóa
    được gửi dưới dạng `Ocp-Apim-Subscription-Key`; OpenClaw suy ra
    `https://<region>.tts.speech.microsoft.com` từ `region` trừ khi bạn
    cung cấp `endpoint` hoặc `baseUrl`.
  </Accordion>
  <Accordion title="Voice names">
    Sử dụng giá trị `ShortName` của giọng Azure Speech, ví dụ
    `en-US-JennyNeural`. Nhà cung cấp được đóng gói có thể liệt kê các giọng thông qua
    cùng tài nguyên Speech và lọc các giọng được đánh dấu là không còn khuyến nghị hoặc đã ngừng dùng.
  </Accordion>
  <Accordion title="Audio outputs">
    Azure chấp nhận các định dạng đầu ra như `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus`, và `riff-24khz-16bit-mono-pcm`. OpenClaw
    yêu cầu Ogg/Opus cho mục tiêu `voice-note` để các kênh có thể gửi bong bóng
    thoại gốc mà không cần chuyển đổi MP3 bổ sung.
  </Accordion>
  <Accordion title="Alias">
    `azure` được chấp nhận làm bí danh nhà cung cấp cho các PR và cấu hình người dùng hiện có,
    nhưng cấu hình mới nên dùng `azure-speech` để tránh nhầm lẫn với các nhà cung cấp
    mô hình Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/vi/tools/tts" icon="waveform-lines">
    Tổng quan TTS, nhà cung cấp, và cấu hình `messages.tts`.
  </Card>
  <Card title="Configuration" href="/vi/gateway/configuration" icon="gear">
    Tham chiếu cấu hình đầy đủ, bao gồm cài đặt `messages.tts`.
  </Card>
  <Card title="Providers" href="/vi/providers" icon="grid">
    Tất cả nhà cung cấp OpenClaw được đóng gói.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và bước gỡ lỗi.
  </Card>
</CardGroup>
