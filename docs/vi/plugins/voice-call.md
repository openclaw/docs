---
read_when:
    - Bạn muốn thực hiện cuộc gọi thoại đi từ OpenClaw
    - Bạn đang cấu hình hoặc phát triển Plugin cuộc gọi thoại
    - Bạn cần thoại thời gian thực hoặc phiên âm phát trực tuyến qua điện thoại
sidebarTitle: Voice call
summary: Thực hiện cuộc gọi thoại đi và nhận cuộc gọi thoại đến qua Twilio, Telnyx hoặc Plivo, với tùy chọn thoại thời gian thực và phiên âm dạng luồng
title: Plugin cuộc gọi thoại
x-i18n:
    generated_at: "2026-05-01T10:51:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6334e5418e0fb530fc5d372ee1ada06ba987ce86bbf70746ee4ffe4c3ed4844e
    source_path: plugins/voice-call.md
    workflow: 16
---

Cuộc gọi thoại cho OpenClaw qua một plugin. Hỗ trợ thông báo gọi đi,
cuộc hội thoại nhiều lượt, thoại thời gian thực song công đầy đủ, phiên âm
trực tuyến, và cuộc gọi đến với chính sách danh sách cho phép.

**Nhà cung cấp hiện tại:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (phát triển/không có mạng).

<Note>
Plugin Voice Call chạy **bên trong tiến trình Gateway**. Nếu bạn dùng
Gateway từ xa, hãy cài đặt và cấu hình plugin trên máy đang chạy
Gateway, rồi khởi động lại Gateway để tải plugin.
</Note>

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt plugin">
    <Tabs>
      <Tab title="Từ npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Từ thư mục cục bộ (phát triển)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Nếu npm báo gói do OpenClaw sở hữu là đã ngừng hỗ trợ, phiên bản gói đó
    đến từ một tuyến gói bên ngoài cũ hơn; hãy dùng bản dựng OpenClaw đóng gói
    hiện tại hoặc đường dẫn thư mục cục bộ cho đến khi gói npm mới hơn được phát hành.

    Sau đó khởi động lại Gateway để plugin được tải.

  </Step>
  <Step title="Cấu hình nhà cung cấp và webhook">
    Đặt cấu hình trong `plugins.entries.voice-call.config` (xem
    [Cấu hình](#configuration) bên dưới để biết cấu trúc đầy đủ). Tối thiểu cần:
    `provider`, thông tin xác thực của nhà cung cấp, `fromNumber`, và URL webhook
    có thể truy cập công khai.
  </Step>
  <Step title="Xác minh thiết lập">
    ```bash
    openclaw voicecall setup
    ```

    Đầu ra mặc định dễ đọc trong nhật ký trò chuyện và terminal. Lệnh này kiểm tra
    plugin đã được bật, thông tin xác thực của nhà cung cấp, khả năng hiển thị webhook,
    và việc chỉ một chế độ âm thanh (`streaming` hoặc `realtime`) đang hoạt động.
    Dùng `--json` cho script.

  </Step>
  <Step title="Kiểm thử nhanh">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Cả hai mặc định là chạy thử không thực hiện thật. Thêm `--yes` để thực sự thực hiện
    một cuộc gọi thông báo đi ngắn:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Với Twilio, Telnyx và Plivo, quá trình thiết lập phải phân giải thành **URL webhook công khai**.
Nếu `publicUrl`, URL đường hầm, URL Tailscale, hoặc phương án dự phòng serve
phân giải thành local loopback hoặc không gian mạng riêng, thiết lập sẽ thất bại thay vì
khởi động một nhà cung cấp không thể nhận webhook từ nhà mạng.
</Warning>

## Cấu hình

Nếu `enabled: true` nhưng nhà cung cấp đã chọn thiếu thông tin xác thực,
quá trình khởi động Gateway sẽ ghi cảnh báo thiết lập chưa hoàn tất cùng các khóa bị thiếu và
bỏ qua việc khởi động runtime. Các lệnh, lệnh gọi RPC và công cụ agent vẫn
trả về đúng cấu hình nhà cung cấp còn thiếu khi được dùng.

<Note>
Thông tin xác thực voice-call chấp nhận SecretRef. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, và `plugins.entries.voice-call.config.tts.providers.*.apiKey` phân giải qua bề mặt SecretRef tiêu chuẩn; xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
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
  <Accordion title="Ghi chú về hiển thị và bảo mật của nhà cung cấp">
    - Twilio, Telnyx và Plivo đều yêu cầu URL webhook **có thể truy cập công khai**.
    - `mock` là nhà cung cấp phát triển cục bộ (không gọi mạng).
    - Telnyx yêu cầu `telnyx.publicKey` (hoặc `TELNYX_PUBLIC_KEY`) trừ khi `skipSignatureVerification` là true.
    - `skipSignatureVerification` chỉ dành cho kiểm thử cục bộ.
    - Trên gói miễn phí của ngrok, đặt `publicUrl` thành đúng URL ngrok; xác minh chữ ký luôn được thực thi.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` cho phép webhook Twilio có chữ ký không hợp lệ **chỉ** khi `tunnel.provider="ngrok"` và `serve.bind` là local loopback (agent cục bộ của ngrok). Chỉ dùng cho phát triển cục bộ.
    - URL gói miễn phí của ngrok có thể thay đổi hoặc thêm hành vi trang trung gian; nếu `publicUrl` lệch, chữ ký Twilio sẽ thất bại. Sản xuất: ưu tiên miền ổn định hoặc Tailscale funnel.

  </Accordion>
  <Accordion title="Giới hạn kết nối streaming">
    - `streaming.preStartTimeoutMs` đóng các socket không bao giờ gửi khung `start` hợp lệ.
    - `streaming.maxPendingConnections` giới hạn tổng số socket trước khi bắt đầu chưa xác thực.
    - `streaming.maxPendingConnectionsPerIp` giới hạn socket trước khi bắt đầu chưa xác thực trên mỗi IP nguồn.
    - `streaming.maxConnections` giới hạn tổng số socket luồng phương tiện đang mở (đang chờ + đang hoạt động).

  </Accordion>
  <Accordion title="Di chuyển cấu hình cũ">
    Các cấu hình cũ dùng `provider: "log"`, `twilio.from`, hoặc khóa OpenAI
    `streaming.*` cũ được viết lại bởi `openclaw doctor --fix`.
    Phương án dự phòng runtime hiện vẫn chấp nhận các khóa voice-call cũ,
    nhưng đường dẫn viết lại là `openclaw doctor --fix` và lớp tương thích là
    tạm thời.

    Các khóa streaming được tự động di chuyển:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Cuộc hội thoại thoại thời gian thực

`realtime` chọn một nhà cung cấp thoại thời gian thực song công đầy đủ cho âm thanh
cuộc gọi trực tiếp. Nó tách biệt với `streaming`, vốn chỉ chuyển tiếp âm thanh đến
các nhà cung cấp phiên âm thời gian thực.

<Warning>
`realtime.enabled` không thể kết hợp với `streaming.enabled`. Chọn một
chế độ âm thanh cho mỗi cuộc gọi.
</Warning>

Hành vi runtime hiện tại:

- `realtime.enabled` được hỗ trợ cho Twilio Media Streams.
- `realtime.provider` là tùy chọn. Nếu không đặt, Voice Call dùng nhà cung cấp thoại thời gian thực đã đăng ký đầu tiên.
- Các nhà cung cấp thoại thời gian thực đi kèm: Google Gemini Live (`google`) và OpenAI (`openai`), được đăng ký bởi plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `realtime.providers.<providerId>`.
- Voice Call mặc định cung cấp công cụ thời gian thực dùng chung `openclaw_agent_consult`. Mô hình thời gian thực có thể gọi công cụ này khi người gọi yêu cầu suy luận sâu hơn, thông tin hiện tại, hoặc các công cụ OpenClaw thông thường.
- `realtime.fastContext.enabled` mặc định tắt. Khi bật, Voice Call trước tiên tìm kiếm ngữ cảnh bộ nhớ/phiên đã được lập chỉ mục cho câu hỏi tư vấn và trả về các đoạn trích đó cho mô hình thời gian thực trong `realtime.fastContext.timeoutMs` trước khi dự phòng sang agent tư vấn đầy đủ chỉ khi `realtime.fastContext.fallbackToConsult` là true.
- Nếu `realtime.provider` trỏ đến một nhà cung cấp chưa đăng ký, hoặc hoàn toàn không có nhà cung cấp thoại thời gian thực nào được đăng ký, Voice Call sẽ ghi cảnh báo và bỏ qua phương tiện thời gian thực thay vì làm hỏng toàn bộ plugin.
- Khóa phiên tư vấn tái sử dụng phiên thoại hiện có khi có sẵn, rồi dự phòng về số điện thoại của người gọi/người nhận để các lệnh gọi tư vấn tiếp theo giữ ngữ cảnh trong cuộc gọi.

### Chính sách công cụ

`realtime.toolPolicy` điều khiển lượt chạy tư vấn:

| Chính sách       | Hành vi                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Cung cấp công cụ tư vấn và giới hạn agent thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, và `memory_get`. |
| `owner`          | Cung cấp công cụ tư vấn và để agent thông thường dùng chính sách công cụ agent bình thường.                                              |
| `none`           | Không cung cấp công cụ tư vấn. `realtime.tools` tùy chỉnh vẫn được chuyển tiếp đến nhà cung cấp thời gian thực.                           |

### Ví dụ về nhà cung cấp thời gian thực

<Tabs>
  <Tab title="Google Gemini Live">
    Mặc định: khóa API từ `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, hoặc `GOOGLE_GENERATIVE_AI_API_KEY`; mô hình
    `gemini-2.5-flash-native-audio-preview-12-2025`; giọng `Kore`.

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

Xem [Nhà cung cấp Google](/vi/providers/google) và
[Nhà cung cấp OpenAI](/vi/providers/openai) để biết các tùy chọn thoại thời gian thực
riêng theo nhà cung cấp.

## Phiên âm streaming

`streaming` chọn một nhà cung cấp phiên âm thời gian thực cho âm thanh cuộc gọi trực tiếp.

Hành vi runtime hiện tại:

- `streaming.provider` là tùy chọn. Nếu không đặt, Voice Call sẽ dùng nhà cung cấp phiên âm thời gian thực đã đăng ký đầu tiên.
- Các nhà cung cấp phiên âm thời gian thực đi kèm: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) và xAI (`xai`), được đăng ký bởi các provider plugin tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm dưới `streaming.providers.<providerId>`.
- Sau khi Twilio gửi thông báo `start` cho luồng đã được chấp nhận, Voice Call đăng ký luồng ngay lập tức, đưa phương tiện đầu vào vào hàng đợi qua nhà cung cấp phiên âm trong khi nhà cung cấp kết nối, và chỉ bắt đầu lời chào ban đầu sau khi phiên âm thời gian thực đã sẵn sàng.
- Nếu `streaming.provider` trỏ đến một nhà cung cấp chưa đăng ký, hoặc không có nhà cung cấp nào được đăng ký, Voice Call ghi nhật ký cảnh báo và bỏ qua phát trực tuyến phương tiện thay vì làm lỗi toàn bộ plugin.

### Ví dụ về nhà cung cấp phát trực tuyến

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
    endpoint `wss://api.x.ai/v1/stt`; mã hóa `mulaw`; tốc độ mẫu `8000`;
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

Voice Call sử dụng cấu hình `messages.tts` cốt lõi để phát trực tuyến
giọng nói trong cuộc gọi. Bạn có thể ghi đè cấu hình này dưới cấu hình plugin với
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

- Các khóa `tts.<provider>` cũ bên trong cấu hình plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) được sửa bởi `openclaw doctor --fix`; cấu hình đã commit nên dùng `tts.providers.<provider>`.
- Core TTS được dùng khi phát trực tuyến phương tiện Twilio được bật; nếu không, cuộc gọi sẽ quay về giọng nói gốc của nhà cung cấp.
- Nếu luồng phương tiện Twilio đã hoạt động, Voice Call không quay về TwiML `<Say>`. Nếu TTS điện thoại không khả dụng ở trạng thái đó, yêu cầu phát sẽ thất bại thay vì trộn hai đường phát.
- Khi TTS điện thoại quay về một nhà cung cấp phụ, Voice Call ghi nhật ký cảnh báo kèm chuỗi nhà cung cấp (`from`, `to`, `attempts`) để gỡ lỗi.
- Khi barge-in của Twilio hoặc quá trình tháo dỡ luồng xóa hàng đợi TTS đang chờ, các yêu cầu phát đã xếp hàng sẽ được hoàn tất thay vì treo người gọi đang chờ phát xong.

### Ví dụ về TTS

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

Chính sách cuộc gọi đến mặc định là `disabled`. Để bật cuộc gọi đến, đặt:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` là cơ chế lọc caller-ID có độ đảm bảo thấp. Plugin
chuẩn hóa giá trị `From` do nhà cung cấp cung cấp và so sánh với
`allowFrom`. Xác minh Webhook xác thực việc gửi từ nhà cung cấp và
tính toàn vẹn của payload, nhưng **không** chứng minh quyền sở hữu số gọi
PSTN/VoIP. Hãy coi `allowFrom` là lọc caller-ID, không phải danh tính người gọi
mạnh.
</Warning>

Phản hồi tự động dùng hệ thống tác nhân. Tinh chỉnh bằng `responseModel`,
`responseSystemPrompt` và `responseTimeoutMs`.

### Hợp đồng đầu ra nói

Đối với phản hồi tự động, Voice Call thêm một hợp đồng đầu ra nói nghiêm ngặt vào
system prompt:

```text
{"spoken":"..."}
```

Voice Call trích xuất văn bản lời nói theo cách phòng thủ:

- Bỏ qua payload được đánh dấu là nội dung reasoning/lỗi.
- Phân tích JSON trực tiếp, JSON trong fence, hoặc khóa `"spoken"` nội tuyến.
- Quay về văn bản thuần và xóa các đoạn mở đầu có khả năng là lập kế hoạch/meta.

Điều này giúp nội dung phát thành lời tập trung vào văn bản dành cho người gọi và tránh
rò rỉ văn bản lập kế hoạch vào âm thanh.

### Hành vi khởi động hội thoại

Đối với cuộc gọi `conversation` gọi ra, xử lý tin nhắn đầu tiên gắn với trạng thái
phát trực tiếp:

- Xóa hàng đợi barge-in và phản hồi tự động chỉ bị chặn khi lời chào ban đầu đang được nói chủ động.
- Nếu phát ban đầu thất bại, cuộc gọi quay về `listening` và tin nhắn ban đầu vẫn nằm trong hàng đợi để thử lại.
- Phát ban đầu cho Twilio streaming bắt đầu khi luồng kết nối mà không có độ trễ bổ sung.
- Barge-in hủy phát đang hoạt động và xóa các mục Twilio TTS đã xếp hàng nhưng chưa phát. Các mục bị xóa được resolve là đã bỏ qua, nên logic phản hồi tiếp theo có thể tiếp tục mà không phải chờ âm thanh sẽ không bao giờ phát.
- Hội thoại thoại thời gian thực dùng lượt mở đầu riêng của luồng thời gian thực. Voice Call **không** gửi bản cập nhật TwiML `<Say>` cũ cho tin nhắn ban đầu đó, nên các phiên gọi ra `<Connect><Stream>` vẫn được gắn.

### Khoảng chờ khi luồng Twilio ngắt kết nối

Khi luồng phương tiện Twilio ngắt kết nối, Voice Call chờ **2000 ms** trước khi
tự động kết thúc cuộc gọi:

- Nếu luồng kết nối lại trong khoảng thời gian đó, tự động kết thúc sẽ bị hủy.
- Nếu không có luồng nào đăng ký lại sau thời gian gia hạn, cuộc gọi sẽ được kết thúc để tránh các cuộc gọi hoạt động bị kẹt.

## Bộ dọn cuộc gọi cũ

Dùng `staleCallReaperSeconds` để kết thúc các cuộc gọi không bao giờ nhận được
webhook kết thúc (ví dụ: các cuộc gọi ở chế độ thông báo không bao giờ hoàn tất). Mặc định
là `0` (tắt).

Khoảng khuyến nghị:

- **Production:** `120`–`300` giây cho các luồng kiểu thông báo.
- Giữ giá trị này **cao hơn `maxDurationSeconds`** để cuộc gọi bình thường có thể kết thúc. Điểm bắt đầu tốt là `maxDurationSeconds + 30–60` giây.

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
tái dựng URL công khai để xác minh chữ ký. Các tùy chọn này
kiểm soát header chuyển tiếp nào được tin cậy:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Cho phép các host từ header chuyển tiếp.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Tin cậy header chuyển tiếp mà không cần allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Chỉ tin cậy header chuyển tiếp khi IP từ xa của yêu cầu khớp với danh sách.
</ParamField>

Biện pháp bảo vệ bổ sung:

- **Bảo vệ phát lại** Webhook được bật cho Twilio và Plivo. Các yêu cầu webhook hợp lệ bị phát lại sẽ được xác nhận nhưng bị bỏ qua về mặt hiệu ứng phụ.
- Các lượt hội thoại Twilio bao gồm token theo từng lượt trong callback `<Gather>`, nên callback lời nói cũ/bị phát lại không thể thỏa mãn một lượt bản chép lời đang chờ mới hơn.
- Các yêu cầu webhook chưa xác thực bị từ chối trước khi đọc body khi thiếu các header chữ ký bắt buộc của nhà cung cấp.
- Webhook voice-call dùng hồ sơ body tiền xác thực dùng chung (64 KB / 5 giây) cộng với giới hạn in-flight theo IP trước khi xác minh chữ ký.

Ví dụ với host công khai ổn định:

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

Khi Gateway đã chạy, các lệnh `voicecall` vận hành sẽ ủy quyền
cho runtime voice-call do Gateway sở hữu để CLI không bind một máy chủ
webhook thứ hai. Nếu không kết nối được Gateway, các lệnh sẽ quay về
runtime CLI độc lập.

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ voice-call mặc định.
Dùng `--file <path>` để trỏ đến một nhật ký khác và `--last <n>` để giới hạn
phân tích ở N bản ghi cuối cùng (mặc định 200). Đầu ra bao gồm p50/p90/p99
cho độ trễ lượt và thời gian chờ-nghe.

## Công cụ tác nhân

Tên công cụ: `voice_call`.

| Hành động       | Đối số                                    |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Repo này đi kèm tài liệu skill tương ứng tại `skills/voice-call/SKILL.md`.

## Gateway RPC

| Phương thức          | Đối số                                    |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` chỉ hợp lệ với `mode: "conversation"`. Các cuộc gọi chế độ thông báo
nên dùng `voicecall.dtmf` sau khi cuộc gọi tồn tại nếu cần các chữ số
sau khi kết nối.

## Khắc phục sự cố

### Thiết lập không thể expose webhook

Chạy thiết lập từ cùng môi trường chạy Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Đối với `twilio`, `telnyx` và `plivo`, `webhook-exposure` phải có trạng thái xanh. Một `publicUrl` đã cấu hình vẫn thất bại khi trỏ tới không gian mạng cục bộ hoặc riêng tư, vì nhà mạng không thể gọi ngược vào các địa chỉ đó. Không dùng `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` hoặc `fd00::/8` làm `publicUrl`.

Sử dụng một đường dẫn phơi bày công khai:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Sau khi thay đổi cấu hình, hãy khởi động lại hoặc tải lại Gateway, rồi chạy:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` là chạy thử khô trừ khi bạn truyền `--yes`.

### Thông tin xác thực của nhà cung cấp thất bại

Kiểm tra nhà cung cấp đã chọn và các trường thông tin xác thực bắt buộc:

- Twilio: `twilio.accountSid`, `twilio.authToken` và `fromNumber`, hoặc `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` và `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` và `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` và `fromNumber`.

Thông tin xác thực phải tồn tại trên máy chủ Gateway. Việc chỉnh sửa hồ sơ shell cục bộ không ảnh hưởng đến Gateway đang chạy cho đến khi Gateway khởi động lại hoặc tải lại môi trường của nó.

### Cuộc gọi bắt đầu nhưng Webhook của nhà cung cấp không đến

Xác nhận bảng điều khiển của nhà cung cấp trỏ tới đúng URL Webhook công khai:

```text
https://voice.example.com/voice/webhook
```

Sau đó kiểm tra trạng thái thời gian chạy:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Nguyên nhân thường gặp:

- `publicUrl` trỏ tới một đường dẫn khác với `serve.path`.
- URL đường hầm đã thay đổi sau khi Gateway khởi động.
- Proxy chuyển tiếp yêu cầu nhưng loại bỏ hoặc viết lại các header host/proto.
- Tường lửa hoặc DNS định tuyến hostname công khai tới nơi khác thay vì Gateway.
- Gateway đã được khởi động lại khi Voice Call Plugin chưa được bật.

Khi có reverse proxy hoặc đường hầm đứng trước Gateway, hãy đặt `webhookSecurity.allowedHosts` thành hostname công khai, hoặc dùng `webhookSecurity.trustedProxyIPs` cho một địa chỉ proxy đã biết. Chỉ dùng `webhookSecurity.trustForwardingHeaders` khi ranh giới proxy nằm dưới quyền kiểm soát của bạn.

### Xác minh chữ ký thất bại

Chữ ký của nhà cung cấp được kiểm tra dựa trên URL công khai mà OpenClaw dựng lại từ yêu cầu đến. Nếu chữ ký thất bại:

- Xác nhận URL Webhook của nhà cung cấp khớp chính xác với `publicUrl`, bao gồm scheme, host và path.
- Với URL ngrok bậc miễn phí, hãy cập nhật `publicUrl` khi hostname đường hầm thay đổi.
- Đảm bảo proxy giữ nguyên các header host và proto gốc, hoặc cấu hình `webhookSecurity.allowedHosts`.
- Không bật `skipSignatureVerification` bên ngoài kiểm thử cục bộ.

### Google Meet Twilio không tham gia được

Google Meet dùng Plugin này cho các lượt tham gia bằng gọi vào qua Twilio. Trước tiên hãy xác minh Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Sau đó xác minh rõ ràng transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Nếu Voice Call có trạng thái xanh nhưng người tham gia Meet không bao giờ tham gia, hãy kiểm tra số gọi vào Meet, PIN và `--dtmf-sequence`. Cuộc gọi điện thoại có thể vẫn hoạt động bình thường trong khi cuộc họp từ chối hoặc bỏ qua một chuỗi DTMF không chính xác.

Google Meet truyền chuỗi DTMF của Meet và văn bản giới thiệu tới `voicecall.start`. Đối với cuộc gọi Twilio, Voice Call phục vụ DTMF TwiML trước, chuyển hướng trở lại Webhook, rồi mở luồng phương tiện thời gian thực để phần giới thiệu đã lưu được tạo sau khi người tham gia qua điện thoại đã vào cuộc họp.

Dùng `openclaw logs --follow` để xem dấu vết giai đoạn trực tiếp. Một lượt tham gia Twilio Meet khỏe mạnh ghi log theo thứ tự này:

- Google Meet ủy quyền lượt tham gia Twilio cho Voice Call.
- Voice Call lưu TwiML DTMF trước kết nối.
- TwiML ban đầu của Twilio được tiêu thụ và phục vụ trước khi xử lý thời gian thực.
- Voice Call phục vụ TwiML thời gian thực cho cuộc gọi Twilio.
- Cầu nối thời gian thực bắt đầu với lời chào ban đầu được xếp hàng.

`openclaw voicecall tail` vẫn hiển thị các bản ghi cuộc gọi đã lưu; nó hữu ích cho trạng thái cuộc gọi và bản chép lời, nhưng không phải mọi chuyển đổi Webhook/thời gian thực đều xuất hiện ở đó.

### Cuộc gọi thời gian thực không có lời nói

Xác nhận chỉ bật một chế độ âm thanh. `realtime.enabled` và `streaming.enabled` không thể đồng thời là true.

Đối với cuộc gọi Twilio thời gian thực, cũng cần xác minh:

- Một Plugin nhà cung cấp thời gian thực đã được tải và đăng ký.
- `realtime.provider` chưa được đặt hoặc nêu tên một nhà cung cấp đã đăng ký.
- Khóa API của nhà cung cấp có sẵn cho tiến trình Gateway.
- `openclaw logs --follow` hiển thị TwiML thời gian thực đã được phục vụ, cầu nối thời gian thực đã bắt đầu và lời chào ban đầu đã được xếp hàng.

## Liên quan

- [Chế độ trò chuyện](/vi/nodes/talk)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
