---
read_when:
    - Bạn muốn thực hiện cuộc gọi thoại đi từ OpenClaw
    - Bạn đang cấu hình hoặc phát triển Plugin cuộc gọi thoại
    - Bạn cần thoại thời gian thực hoặc phiên âm truyền trực tuyến trên hệ thống điện thoại
sidebarTitle: Voice call
summary: Thực hiện cuộc gọi thoại đi và nhận cuộc gọi thoại đến qua Twilio, Telnyx hoặc Plivo, với tùy chọn thoại thời gian thực và chuyển lời nói thành văn bản theo luồng
title: Plugin cuộc gọi thoại
x-i18n:
    generated_at: "2026-04-29T23:04:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Cuộc gọi thoại cho OpenClaw thông qua một Plugin. Hỗ trợ thông báo đi,
hội thoại nhiều lượt, giọng nói realtime song công toàn phần, bản chép lời
streaming và cuộc gọi đến với chính sách allowlist.

**Nhà cung cấp hiện tại:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (phát triển/không dùng mạng).

<Note>
Plugin Voice Call chạy **bên trong tiến trình Gateway**. Nếu bạn dùng
Gateway từ xa, hãy cài đặt và cấu hình Plugin trên máy đang chạy
Gateway, rồi khởi động lại Gateway để tải Plugin.
</Note>

## Bắt đầu nhanh

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Nếu npm báo cáo gói thuộc sở hữu của OpenClaw là deprecated, phiên bản gói đó
    đến từ một chuỗi gói bên ngoài cũ hơn; hãy dùng bản dựng OpenClaw được đóng gói
    hiện tại hoặc đường dẫn thư mục cục bộ cho đến khi một gói npm mới hơn được phát hành.

    Sau đó khởi động lại Gateway để Plugin được tải.

  </Step>
  <Step title="Configure provider and webhook">
    Đặt cấu hình trong `plugins.entries.voice-call.config` (xem
    [Cấu hình](#configuration) bên dưới để biết đầy đủ cấu trúc). Tối thiểu cần:
    `provider`, thông tin xác thực của nhà cung cấp, `fromNumber` và một URL Webhook
    có thể truy cập công khai.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Đầu ra mặc định dễ đọc trong nhật ký chat và terminal. Lệnh này kiểm tra
    việc bật Plugin, thông tin xác thực của nhà cung cấp, mức độ lộ diện Webhook và rằng
    chỉ một chế độ âm thanh (`streaming` hoặc `realtime`) đang hoạt động. Dùng
    `--json` cho script.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Cả hai mặc định đều là chạy thử. Thêm `--yes` để thực sự thực hiện một
    cuộc gọi thông báo đi ngắn:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Với Twilio, Telnyx và Plivo, quá trình thiết lập phải phân giải thành một **URL Webhook công khai**.
Nếu `publicUrl`, URL tunnel, URL Tailscale hoặc phương án dự phòng serve
phân giải thành loopback hoặc vùng mạng riêng, thiết lập sẽ thất bại thay vì
khởi động một nhà cung cấp không thể nhận Webhook từ nhà mạng.
</Warning>

## Cấu hình

Nếu `enabled: true` nhưng nhà cung cấp đã chọn thiếu thông tin xác thực,
Gateway sẽ ghi cảnh báo thiết lập chưa hoàn tất khi khởi động, kèm các khóa bị thiếu và
bỏ qua việc khởi động runtime. Các lệnh, lệnh gọi RPC và công cụ agent vẫn
trả về chính xác cấu hình nhà cung cấp còn thiếu khi được dùng.

<Note>
Thông tin xác thực voice-call chấp nhận SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` và `plugins.entries.voice-call.config.tts.providers.*.apiKey` được phân giải qua bề mặt SecretRef tiêu chuẩn; xem [bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx và Plivo đều yêu cầu một URL Webhook **có thể truy cập công khai**.
    - `mock` là nhà cung cấp phát triển cục bộ (không có lệnh gọi mạng).
    - Telnyx yêu cầu `telnyx.publicKey` (hoặc `TELNYX_PUBLIC_KEY`) trừ khi `skipSignatureVerification` là true.
    - `skipSignatureVerification` chỉ dành cho kiểm thử cục bộ.
    - Trên gói miễn phí của ngrok, đặt `publicUrl` thành đúng URL ngrok; xác minh chữ ký luôn được thực thi.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` cho phép Webhook Twilio có chữ ký không hợp lệ **chỉ** khi `tunnel.provider="ngrok"` và `serve.bind` là loopback (agent cục bộ của ngrok). Chỉ dùng cho phát triển cục bộ.
    - URL gói miễn phí của ngrok có thể thay đổi hoặc thêm hành vi chuyển tiếp; nếu `publicUrl` bị lệch, chữ ký Twilio sẽ thất bại. Sản xuất: ưu tiên một miền ổn định hoặc Tailscale funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` đóng các socket không bao giờ gửi frame `start` hợp lệ.
    - `streaming.maxPendingConnections` giới hạn tổng số socket trước khi start chưa xác thực.
    - `streaming.maxPendingConnectionsPerIp` giới hạn socket trước khi start chưa xác thực trên mỗi IP nguồn.
    - `streaming.maxConnections` giới hạn tổng số socket media stream đang mở (đang chờ + đang hoạt động).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Cấu hình cũ dùng `provider: "log"`, `twilio.from`, hoặc các khóa OpenAI
    `streaming.*` cũ sẽ được viết lại bởi `openclaw doctor --fix`.
    Runtime fallback hiện vẫn chấp nhận các khóa voice-call cũ, nhưng
    đường dẫn viết lại là `openclaw doctor --fix` và lớp tương thích này
    chỉ là tạm thời.

    Các khóa streaming được tự động di chuyển:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Hội thoại thoại realtime

`realtime` chọn nhà cung cấp giọng nói realtime song công toàn phần cho âm thanh
cuộc gọi trực tiếp. Nó tách biệt với `streaming`, vốn chỉ chuyển tiếp âm thanh đến
các nhà cung cấp chép lời realtime.

<Warning>
`realtime.enabled` không thể kết hợp với `streaming.enabled`. Chọn một
chế độ âm thanh cho mỗi cuộc gọi.
</Warning>

Hành vi runtime hiện tại:

- `realtime.enabled` được hỗ trợ cho Twilio Media Streams.
- `realtime.provider` là tùy chọn. Nếu không đặt, Voice Call dùng nhà cung cấp giọng nói realtime đã đăng ký đầu tiên.
- Nhà cung cấp giọng nói realtime đi kèm: Google Gemini Live (`google`) và OpenAI (`openai`), được đăng ký bởi các Plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `realtime.providers.<providerId>`.
- Voice Call mặc định cung cấp công cụ realtime dùng chung `openclaw_agent_consult`. Mô hình realtime có thể gọi công cụ này khi người gọi yêu cầu suy luận sâu hơn, thông tin hiện tại hoặc công cụ OpenClaw thông thường.
- Nếu `realtime.provider` trỏ đến một nhà cung cấp chưa đăng ký, hoặc không có nhà cung cấp giọng nói realtime nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua media realtime thay vì làm toàn bộ Plugin thất bại.
- Khóa phiên consult tái sử dụng phiên thoại hiện có khi có sẵn, rồi dự phòng sang số điện thoại người gọi/người nhận để các lần gọi consult tiếp theo giữ ngữ cảnh trong cuộc gọi.

### Chính sách công cụ

`realtime.toolPolicy` kiểm soát lượt chạy consult:

| Chính sách       | Hành vi                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Cung cấp công cụ consult và giới hạn agent thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` và `memory_get`. |
| `owner`          | Cung cấp công cụ consult và để agent thông thường dùng chính sách công cụ agent bình thường.                                             |
| `none`           | Không cung cấp công cụ consult. `realtime.tools` tùy chỉnh vẫn được truyền qua cho nhà cung cấp realtime.                                |

### Ví dụ nhà cung cấp realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Mặc định: khóa API từ `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, hoặc `GOOGLE_GENERATIVE_AI_API_KEY`; mô hình
    `gemini-2.5-flash-native-audio-preview-12-2025`; giọng nói `Kore`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Xem [nhà cung cấp Google](/vi/providers/google) và
[nhà cung cấp OpenAI](/vi/providers/openai) để biết các tùy chọn giọng nói realtime
dành riêng cho nhà cung cấp.

## Chép lời streaming

`streaming` chọn một nhà cung cấp chép lời realtime cho âm thanh cuộc gọi trực tiếp.

Hành vi runtime hiện tại:

- `streaming.provider` là tùy chọn. Nếu không đặt, Voice Call dùng nhà cung cấp chép lời realtime đã đăng ký đầu tiên.
- Nhà cung cấp chép lời realtime đi kèm: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) và xAI (`xai`), được đăng ký bởi các Plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `streaming.providers.<providerId>`.
- Nếu `streaming.provider` trỏ đến một nhà cung cấp chưa đăng ký, hoặc không có nhà cung cấp nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua media streaming thay vì làm toàn bộ Plugin thất bại.

### Ví dụ nhà cung cấp streaming

<Tabs>
  <Tab title="OpenAI">
    Mặc định: khóa API `streaming.providers.openai.apiKey` hoặc
    `OPENAI_API_KEY`; mô hình `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    Mặc định: khóa API `streaming.providers.xai.apiKey` hoặc `XAI_API_KEY`;
    điểm cuối `wss://api.x.ai/v1/stt`; mã hóa `mulaw`; tốc độ mẫu `8000`;
    `endpointingMs: 800`; `interimResults: true`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## TTS cho cuộc gọi

Voice Call dùng cấu hình lõi `messages.tts` cho giọng nói phát trực tuyến
trong cuộc gọi. Bạn có thể ghi đè cấu hình này trong cấu hình plugin với
**cùng cấu trúc** — cấu hình này được hợp nhất sâu với `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft speech bị bỏ qua cho cuộc gọi thoại.** Âm thanh điện thoại cần PCM;
transport Microsoft hiện tại không cung cấp đầu ra PCM cho điện thoại.
</Warning>

Ghi chú về hành vi:

- Các khóa `tts.<provider>` cũ trong cấu hình plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) được sửa bởi `openclaw doctor --fix`; cấu hình đã commit nên dùng `tts.providers.<provider>`.
- Core TTS được dùng khi bật phát trực tuyến media Twilio; nếu không, cuộc gọi sẽ quay về dùng giọng nói gốc của nhà cung cấp.
- Nếu một stream media Twilio đã hoạt động, Voice Call không quay về TwiML `<Say>`. Nếu TTS điện thoại không khả dụng trong trạng thái đó, yêu cầu phát sẽ thất bại thay vì trộn hai đường phát.
- Khi TTS điện thoại quay về một nhà cung cấp phụ, Voice Call ghi log cảnh báo với chuỗi nhà cung cấp (`from`, `to`, `attempts`) để gỡ lỗi.
- Khi barge-in Twilio hoặc teardown stream xóa hàng đợi TTS đang chờ, các yêu cầu phát đã xếp hàng sẽ được hoàn tất thay vì khiến người gọi chờ mãi đến khi phát xong.

### Ví dụ TTS

<Tabs>
  <Tab title="Chỉ Core TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Ghi đè sang ElevenLabs (chỉ cuộc gọi)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Ghi đè mô hình OpenAI (hợp nhất sâu)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## Cuộc gọi đến

Chính sách gọi đến mặc định là `disabled`. Để bật cuộc gọi đến, đặt:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` là một lớp lọc ID người gọi có độ đảm bảo thấp. Plugin
chuẩn hóa giá trị `From` do nhà cung cấp gửi và so sánh với
`allowFrom`. Xác minh Webhook xác thực việc gửi từ nhà cung cấp và
tính toàn vẹn của payload, nhưng **không** chứng minh quyền sở hữu
số người gọi PSTN/VoIP. Hãy xem `allowFrom` là lọc ID người gọi, không phải
danh tính người gọi mạnh.
</Warning>

Phản hồi tự động dùng hệ thống agent. Tinh chỉnh bằng `responseModel`,
`responseSystemPrompt`, và `responseTimeoutMs`.

### Hợp đồng đầu ra giọng nói

Đối với phản hồi tự động, Voice Call nối thêm một hợp đồng đầu ra giọng nói nghiêm ngặt vào
system prompt:

```text
{"spoken":"..."}
```

Voice Call trích xuất văn bản giọng nói theo cách phòng thủ:

- Bỏ qua payload được đánh dấu là nội dung reasoning/lỗi.
- Phân tích JSON trực tiếp, JSON trong fenced block, hoặc các khóa `"spoken"` nội tuyến.
- Quay về văn bản thuần và loại bỏ các đoạn mở đầu có khả năng là lập kế hoạch/meta.

Điều này giữ phần phát giọng nói tập trung vào văn bản dành cho người gọi và tránh
rò rỉ văn bản lập kế hoạch vào âm thanh.

### Hành vi khởi động cuộc trò chuyện

Đối với cuộc gọi `conversation` đi, cách xử lý tin nhắn đầu tiên gắn với trạng thái
phát trực tiếp:

- Xóa hàng đợi barge-in và phản hồi tự động chỉ bị chặn khi lời chào ban đầu đang được nói.
- Nếu lần phát ban đầu thất bại, cuộc gọi quay về `listening` và tin nhắn ban đầu vẫn nằm trong hàng đợi để thử lại.
- Lần phát ban đầu cho Twilio streaming bắt đầu khi stream kết nối mà không có độ trễ bổ sung.
- Barge-in hủy phát đang hoạt động và xóa các mục Twilio TTS đã xếp hàng nhưng chưa phát. Các mục bị xóa được resolve là đã bỏ qua, để logic phản hồi tiếp theo có thể tiếp tục mà không phải chờ âm thanh sẽ không bao giờ phát.
- Các cuộc trò chuyện thoại realtime dùng lượt mở đầu riêng của realtime stream. Voice Call **không** gửi bản cập nhật TwiML `<Say>` cũ cho tin nhắn ban đầu đó, nên các phiên `<Connect><Stream>` gọi đi vẫn được gắn kết.

### Khoảng chờ ngắt kết nối stream Twilio

Khi một stream media Twilio ngắt kết nối, Voice Call chờ **2000 ms** trước khi
tự động kết thúc cuộc gọi:

- Nếu stream kết nối lại trong khoảng thời gian đó, tự động kết thúc sẽ bị hủy.
- Nếu không có stream nào đăng ký lại sau khoảng chờ, cuộc gọi sẽ được kết thúc để tránh các cuộc gọi hoạt động bị kẹt.

## Bộ dọn cuộc gọi cũ

Dùng `staleCallReaperSeconds` để kết thúc các cuộc gọi không bao giờ nhận được Webhook
kết thúc (ví dụ: cuộc gọi chế độ thông báo không bao giờ hoàn tất). Mặc định
là `0` (tắt).

Khoảng khuyến nghị:

- **Production:** `120`–`300` giây cho luồng kiểu thông báo.
- Giữ giá trị này **cao hơn `maxDurationSeconds`** để cuộc gọi bình thường có thể hoàn tất. Điểm bắt đầu tốt là `maxDurationSeconds + 30–60` giây.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Bảo mật Webhook

Khi proxy hoặc tunnel nằm trước Gateway, plugin
tái tạo URL công khai để xác minh chữ ký. Các tùy chọn này
kiểm soát header chuyển tiếp nào được tin cậy:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Danh sách cho phép các host từ header chuyển tiếp.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Tin cậy header chuyển tiếp mà không cần danh sách cho phép.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Chỉ tin cậy header chuyển tiếp khi IP từ xa của yêu cầu khớp danh sách.
</ParamField>

Các biện pháp bảo vệ bổ sung:

- **Bảo vệ chống phát lại** Webhook được bật cho Twilio và Plivo. Các yêu cầu Webhook hợp lệ bị phát lại sẽ được xác nhận nhưng bỏ qua tác dụng phụ.
- Các lượt hội thoại Twilio bao gồm một token theo từng lượt trong callback `<Gather>`, nên callback lời nói cũ/bị phát lại không thể thỏa mãn một lượt transcript đang chờ mới hơn.
- Các yêu cầu Webhook chưa xác thực bị từ chối trước khi đọc body khi thiếu header chữ ký bắt buộc của nhà cung cấp.
- Webhook voice-call dùng hồ sơ body pre-auth dùng chung (64 KB / 5 giây) cộng với giới hạn in-flight theo từng IP trước khi xác minh chữ ký.

Ví dụ với một host công khai ổn định:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ voice-call mặc định.
Dùng `--file <path>` để trỏ tới log khác và `--last <n>` để giới hạn
phân tích trong N bản ghi cuối (mặc định 200). Đầu ra bao gồm p50/p90/p99
cho độ trễ lượt và thời gian chờ nghe.

## Công cụ agent

Tên công cụ: `voice_call`.

| Hành động        | Đối số                    |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Repo này cung cấp tài liệu skill tương ứng tại `skills/voice-call/SKILL.md`.

## Gateway RPC

| Phương thức          | Đối số                    |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Liên quan

- [Chế độ Talk](/vi/nodes/talk)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
