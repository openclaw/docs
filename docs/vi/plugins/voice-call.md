---
read_when:
    - Bạn muốn thực hiện một cuộc gọi thoại đi từ OpenClaw
    - Bạn đang cấu hình hoặc phát triển Plugin voice-call
    - Bạn cần thoại thời gian thực hoặc chuyển giọng nói thành văn bản dạng truyền phát trên hệ thống điện thoại
sidebarTitle: Voice call
summary: Thực hiện cuộc gọi thoại đi và nhận cuộc gọi thoại đến qua Twilio, Telnyx hoặc Plivo, với tùy chọn thoại thời gian thực và phiên âm dạng luồng
title: Plugin cuộc gọi thoại
x-i18n:
    generated_at: "2026-05-02T22:21:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

Gọi thoại cho OpenClaw qua một Plugin. Hỗ trợ thông báo đi,
cuộc hội thoại nhiều lượt, thoại thời gian thực song công toàn phần, phiên âm
dạng truyền phát, và cuộc gọi đến với chính sách danh sách cho phép.

**Nhà cung cấp hiện tại:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (phát triển/không có mạng).

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

    Dùng gói không kèm phiên bản để theo thẻ phát hành chính thức hiện tại. Chỉ ghim
    một phiên bản chính xác khi bạn cần bản cài đặt có thể tái lập.

    Sau đó khởi động lại Gateway để Plugin được tải.

  </Step>
  <Step title="Configure provider and webhook">
    Đặt cấu hình trong `plugins.entries.voice-call.config` (xem
    [Cấu hình](#configuration) bên dưới để biết cấu trúc đầy đủ). Tối thiểu cần:
    `provider`, thông tin xác thực của nhà cung cấp, `fromNumber`, và một URL Webhook
    có thể truy cập công khai.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Đầu ra mặc định dễ đọc trong nhật ký trò chuyện và terminal. Lệnh này kiểm tra
    trạng thái bật Plugin, thông tin xác thực của nhà cung cấp, khả năng truy cập Webhook,
    và việc chỉ có một chế độ âm thanh (`streaming` hoặc `realtime`) đang hoạt động. Dùng
    `--json` cho script.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Theo mặc định, cả hai đều là chạy thử khô. Thêm `--yes` để thực sự thực hiện một
    cuộc gọi thông báo đi ngắn:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Với Twilio, Telnyx và Plivo, quá trình thiết lập phải phân giải thành một **URL Webhook công khai**.
Nếu `publicUrl`, URL tunnel, URL Tailscale, hoặc phương án dự phòng serve
phân giải thành loopback hoặc không gian mạng riêng, thiết lập sẽ thất bại thay vì
khởi động một nhà cung cấp không thể nhận Webhook từ nhà mạng.
</Warning>

## Cấu hình

Nếu `enabled: true` nhưng nhà cung cấp đã chọn thiếu thông tin xác thực,
quá trình khởi động Gateway sẽ ghi cảnh báo thiết lập chưa hoàn tất cùng các khóa bị thiếu và
bỏ qua việc khởi động runtime. Các lệnh, lệnh gọi RPC và công cụ agent vẫn
trả về chính xác cấu hình nhà cung cấp còn thiếu khi được dùng.

<Note>
Thông tin xác thực voice-call chấp nhận SecretRef. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, và `plugins.entries.voice-call.config.tts.providers.*.apiKey` được phân giải qua bề mặt SecretRef tiêu chuẩn; xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

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
    - URL gói miễn phí của Ngrok có thể thay đổi hoặc thêm hành vi trang trung gian; nếu `publicUrl` bị lệch, chữ ký Twilio sẽ thất bại. Sản xuất: ưu tiên miền ổn định hoặc Tailscale funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` đóng các socket không bao giờ gửi frame `start` hợp lệ.
    - `streaming.maxPendingConnections` giới hạn tổng số socket trước khởi động chưa xác thực.
    - `streaming.maxPendingConnectionsPerIp` giới hạn socket trước khởi động chưa xác thực theo từng IP nguồn.
    - `streaming.maxConnections` giới hạn tổng số socket luồng phương tiện đang mở (đang chờ + đang hoạt động).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Các cấu hình cũ dùng `provider: "log"`, `twilio.from`, hoặc khóa OpenAI
    `streaming.*` cũ được viết lại bởi `openclaw doctor --fix`.
    Phương án dự phòng runtime hiện vẫn chấp nhận các khóa voice-call cũ, nhưng
    đường dẫn viết lại là `openclaw doctor --fix` và lớp tương thích
    chỉ là tạm thời.

    Các khóa streaming được tự động di chuyển:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Phạm vi phiên

Theo mặc định, Voice Call dùng `sessionScope: "per-phone"` để các cuộc gọi lặp lại từ
cùng một người gọi giữ lại bộ nhớ hội thoại. Đặt `sessionScope: "per-call"` khi
mỗi cuộc gọi của nhà mạng nên bắt đầu với ngữ cảnh mới, ví dụ các luồng lễ tân,
đặt lịch, IVR, hoặc cầu nối Google Meet, nơi cùng một số điện thoại có thể
đại diện cho các cuộc họp khác nhau.

## Cuộc hội thoại thoại thời gian thực

`realtime` chọn một nhà cung cấp thoại thời gian thực song công toàn phần cho âm thanh
cuộc gọi trực tiếp. Nó tách biệt với `streaming`, vốn chỉ chuyển tiếp âm thanh đến
các nhà cung cấp phiên âm thời gian thực.

<Warning>
Không thể kết hợp `realtime.enabled` với `streaming.enabled`. Chọn một
chế độ âm thanh cho mỗi cuộc gọi.
</Warning>

Hành vi runtime hiện tại:

- `realtime.enabled` được hỗ trợ cho Twilio Media Streams.
- `realtime.provider` là tùy chọn. Nếu chưa đặt, Voice Call dùng nhà cung cấp thoại thời gian thực đã đăng ký đầu tiên.
- Các nhà cung cấp thoại thời gian thực đi kèm: Google Gemini Live (`google`) và OpenAI (`openai`), được đăng ký bởi Plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `realtime.providers.<providerId>`.
- Voice Call mặc định cung cấp công cụ thời gian thực dùng chung `openclaw_agent_consult`. Mô hình thời gian thực có thể gọi công cụ này khi người gọi yêu cầu suy luận sâu hơn, thông tin hiện tại, hoặc các công cụ OpenClaw thông thường.
- `realtime.fastContext.enabled` mặc định tắt. Khi được bật, Voice Call trước tiên tìm kiếm bộ nhớ đã lập chỉ mục/ngữ cảnh phiên cho câu hỏi tham vấn và trả các đoạn trích đó về mô hình thời gian thực trong `realtime.fastContext.timeoutMs` trước khi chỉ dự phòng sang agent tham vấn đầy đủ nếu `realtime.fastContext.fallbackToConsult` là true.
- Nếu `realtime.provider` trỏ tới một nhà cung cấp chưa đăng ký, hoặc không có nhà cung cấp thoại thời gian thực nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua phương tiện thời gian thực thay vì làm hỏng toàn bộ Plugin.
- Khóa phiên tham vấn tái sử dụng phiên cuộc gọi đã lưu khi có, rồi dự phòng về `sessionScope` đã cấu hình (`per-phone` theo mặc định, hoặc `per-call` cho cuộc gọi cô lập).

### Chính sách công cụ

`realtime.toolPolicy` điều khiển lượt chạy tham vấn:

| Chính sách       | Hành vi                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Cung cấp công cụ tham vấn và giới hạn agent thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, và `memory_get`. |
| `owner`          | Cung cấp công cụ tham vấn và cho phép agent thông thường dùng chính sách công cụ agent bình thường.                                      |
| `none`           | Không cung cấp công cụ tham vấn. `realtime.tools` tùy chỉnh vẫn được chuyển tiếp đến nhà cung cấp thời gian thực.                        |

### Ví dụ nhà cung cấp thời gian thực

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
riêng cho từng nhà cung cấp.

## Phiên âm dạng truyền phát

`streaming` chọn một nhà cung cấp phiên âm thời gian thực cho âm thanh cuộc gọi trực tiếp.

Hành vi runtime hiện tại:

- `streaming.provider` là tùy chọn. Nếu không đặt, Voice Call dùng nhà cung cấp phiên âm thời gian thực đã đăng ký đầu tiên.
- Các nhà cung cấp phiên âm thời gian thực đi kèm: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) và xAI (`xai`), được đăng ký bởi các plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm dưới `streaming.providers.<providerId>`.
- Sau khi Twilio gửi thông báo `start` cho luồng đã được chấp nhận, Voice Call đăng ký luồng ngay lập tức, đưa media đầu vào vào hàng đợi qua nhà cung cấp phiên âm trong khi nhà cung cấp đang kết nối, và chỉ bắt đầu lời chào ban đầu sau khi phiên âm thời gian thực đã sẵn sàng.
- Nếu `streaming.provider` trỏ đến một nhà cung cấp chưa đăng ký, hoặc không có nhà cung cấp nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua media streaming thay vì làm hỏng toàn bộ plugin.

### Ví dụ về nhà cung cấp streaming

<Tabs>
  <Tab title="OpenAI">
    Mặc định: khóa API `streaming.providers.openai.apiKey` hoặc
    `OPENAI_API_KEY`; model `gpt-4o-transcribe`; `silenceDurationMs: 800`;
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
    endpoint `wss://api.x.ai/v1/stt`; encoding `mulaw`; sample rate `8000`;
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

Voice Call dùng cấu hình `messages.tts` lõi cho lời nói streaming
trên cuộc gọi. Bạn có thể ghi đè cấu hình này trong cấu hình plugin với
**cùng cấu trúc** — cấu hình đó được deep-merge với `messages.tts`.

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

Ghi chú hành vi:

- Các khóa `tts.<provider>` cũ trong cấu hình plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) được sửa bởi `openclaw doctor --fix`; cấu hình đã commit nên dùng `tts.providers.<provider>`.
- TTS lõi được dùng khi Twilio media streaming được bật; nếu không, cuộc gọi sẽ quay về dùng giọng nói gốc của nhà cung cấp.
- Nếu một Twilio media stream đã hoạt động, Voice Call không quay về TwiML `<Say>`. Nếu TTS điện thoại không khả dụng ở trạng thái đó, yêu cầu phát sẽ thất bại thay vì trộn hai đường phát.
- Khi TTS điện thoại quay về một nhà cung cấp phụ, Voice Call ghi cảnh báo kèm chuỗi nhà cung cấp (`from`, `to`, `attempts`) để gỡ lỗi.
- Khi Twilio barge-in hoặc việc tháo dỡ luồng xóa hàng đợi TTS đang chờ, các yêu cầu phát trong hàng đợi được hoàn tất thay vì treo người gọi đang chờ phát xong.

### Ví dụ TTS

<Tabs>
  <Tab title="Chỉ TTS lõi">
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
  <Tab title="Ghi đè model OpenAI (deep-merge)">
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
`inboundPolicy: "allowlist"` là bước lọc caller-ID mức đảm bảo thấp. Plugin
chuẩn hóa giá trị `From` do nhà cung cấp cung cấp và so sánh giá trị đó với
`allowFrom`. Việc xác minh Webhook xác thực quá trình gửi của nhà cung cấp và
tính toàn vẹn của payload, nhưng **không** chứng minh quyền sở hữu số người gọi
PSTN/VoIP. Hãy xem `allowFrom` là lọc caller-ID, không phải định danh người gọi
mạnh.
</Warning>

Tự động phản hồi dùng hệ thống agent. Tinh chỉnh bằng `responseModel`,
`responseSystemPrompt` và `responseTimeoutMs`.

### Định tuyến theo từng số

Dùng `numbers` khi một plugin Voice Call nhận cuộc gọi cho nhiều số điện thoại
và mỗi số nên hoạt động như một đường dây khác nhau. Ví dụ, một số có thể dùng
trợ lý cá nhân thân mật trong khi số khác dùng persona doanh nghiệp, một agent
phản hồi khác và một giọng TTS khác.

Các route được chọn từ số `To` đã quay do nhà cung cấp cung cấp. Khóa phải là
số E.164. Khi cuộc gọi đến, Voice Call phân giải route khớp một lần, lưu route
đã khớp trên bản ghi cuộc gọi, và tái sử dụng cấu hình hiệu lực đó cho lời chào,
đường dẫn tự động phản hồi cổ điển, đường dẫn consult thời gian thực, và phát
TTS. Nếu không có route nào khớp, cấu hình Voice Call toàn cục được dùng.
Cuộc gọi đi không dùng `numbers`; hãy truyền mục tiêu gọi đi, tin nhắn và
session một cách tường minh khi khởi tạo cuộc gọi.

Ghi đè route hiện hỗ trợ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Giá trị route `tts` deep-merge lên trên cấu hình `tts` Voice Call toàn cục, vì vậy
thường bạn chỉ cần ghi đè giọng của nhà cung cấp:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Hợp đồng đầu ra nói

Với tự động phản hồi, Voice Call thêm một hợp đồng đầu ra nói nghiêm ngặt vào
system prompt:

```text
{"spoken":"..."}
```

Voice Call trích xuất văn bản lời nói một cách phòng vệ:

- Bỏ qua payload được đánh dấu là nội dung reasoning/error.
- Phân tích JSON trực tiếp, JSON trong fence, hoặc khóa `"spoken"` nội tuyến.
- Quay về văn bản thuần và xóa các đoạn mở đầu có vẻ là lập kế hoạch/meta.

Điều này giúp phần phát lời nói tập trung vào văn bản hướng đến người gọi và tránh
rò rỉ văn bản lập kế hoạch vào âm thanh.

### Hành vi khởi động cuộc trò chuyện

Đối với cuộc gọi `conversation` đi, xử lý tin nhắn đầu tiên gắn với trạng thái
phát trực tiếp:

- Xóa hàng đợi do barge-in và tự động phản hồi chỉ bị chặn trong khi lời chào ban đầu đang được nói.
- Nếu phát ban đầu thất bại, cuộc gọi quay lại `listening` và tin nhắn ban đầu vẫn ở hàng đợi để thử lại.
- Phát ban đầu cho Twilio streaming bắt đầu khi luồng kết nối mà không có độ trễ bổ sung.
- Barge-in hủy phát đang hoạt động và xóa các mục Twilio TTS đã xếp hàng nhưng chưa phát. Các mục đã xóa được resolve là đã bỏ qua, nên logic phản hồi tiếp theo có thể tiếp tục mà không chờ âm thanh sẽ không bao giờ phát.
- Cuộc trò chuyện thoại thời gian thực dùng lượt mở đầu riêng của luồng thời gian thực. Voice Call **không** đăng một cập nhật TwiML `<Say>` cũ cho tin nhắn ban đầu đó, nên các session `<Connect><Stream>` đi vẫn được gắn kết.

### Thời gian gia hạn khi Twilio stream ngắt kết nối

Khi một Twilio media stream ngắt kết nối, Voice Call chờ **2000 ms** trước khi
tự động kết thúc cuộc gọi:

- Nếu luồng kết nối lại trong khoảng thời gian đó, tự động kết thúc sẽ bị hủy.
- Nếu không có luồng nào đăng ký lại sau thời gian gia hạn, cuộc gọi được kết thúc để ngăn các cuộc gọi đang hoạt động bị kẹt.

## Bộ dọn cuộc gọi cũ

Dùng `staleCallReaperSeconds` để kết thúc các cuộc gọi không bao giờ nhận được
Webhook kết thúc (ví dụ, cuộc gọi ở chế độ thông báo không bao giờ hoàn tất). Mặc định
là `0` (tắt).

Khoảng khuyến nghị:

- **Production:** `120`–`300` giây cho luồng kiểu thông báo.
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

Khi một proxy hoặc tunnel nằm phía trước Gateway, plugin
tái dựng URL công khai để xác minh chữ ký. Các tùy chọn này
kiểm soát những header chuyển tiếp nào được tin cậy:

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

- **Bảo vệ chống phát lại** Webhook được bật cho Twilio và Plivo. Các yêu cầu Webhook hợp lệ bị phát lại được xác nhận nhưng bị bỏ qua tác dụng phụ.
- Các lượt hội thoại Twilio bao gồm token theo từng lượt trong callback `<Gather>`, nên callback lời nói cũ/bị phát lại không thể thỏa mãn một lượt transcript mới hơn đang chờ.
- Các yêu cầu Webhook chưa xác thực bị từ chối trước khi đọc body khi thiếu các header chữ ký bắt buộc của nhà cung cấp.
- Webhook voice-call dùng cấu hình body pre-auth dùng chung (64 KB / 5 giây) cộng với giới hạn in-flight theo từng IP trước khi xác minh chữ ký.

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

Khi Gateway đã chạy, các lệnh `voicecall` vận hành sẽ ủy quyền
cho runtime voice-call do Gateway sở hữu để CLI không bind một
máy chủ Webhook thứ hai. Nếu không truy cập được Gateway nào, các lệnh sẽ quay về
runtime CLI độc lập.

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ cuộc gọi thoại mặc định.
Dùng `--file <path>` để trỏ tới nhật ký khác và `--last <n>` để giới hạn
phân tích ở N bản ghi cuối cùng (mặc định 200). Đầu ra bao gồm p50/p90/p99
cho độ trễ lượt và thời gian chờ nghe.

## Công cụ tác nhân

Tên công cụ: `voice_call`.

| Hành động       | Đối số                                     |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Repo này cung cấp tài liệu skill tương ứng tại `skills/voice-call/SKILL.md`.

## Gateway RPC

| Phương thức          | Đối số                                     |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` chỉ hợp lệ với `mode: "conversation"`. Các cuộc gọi chế độ thông báo
nên dùng `voicecall.dtmf` sau khi cuộc gọi tồn tại nếu chúng cần các chữ số
sau khi kết nối.

## Khắc phục sự cố

### Thiết lập không thể công khai Webhook

Chạy thiết lập từ cùng môi trường chạy Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Đối với `twilio`, `telnyx` và `plivo`, `webhook-exposure` phải có màu xanh. Một
`publicUrl` đã cấu hình vẫn không đạt khi nó trỏ tới không gian mạng cục bộ hoặc riêng tư,
vì nhà mạng không thể gọi ngược vào các địa chỉ đó. Không dùng
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` hoặc `fd00::/8` làm `publicUrl`.

Các cuộc gọi đi ở chế độ thông báo của Twilio gửi TwiML `<Say>` ban đầu trực tiếp trong
yêu cầu tạo cuộc gọi, nên thông điệp được nói đầu tiên không phụ thuộc vào việc Twilio
lấy TwiML Webhook. Webhook công khai vẫn bắt buộc cho callback trạng thái,
cuộc gọi hội thoại, DTMF trước khi kết nối, luồng thời gian thực và điều khiển cuộc gọi
sau khi kết nối.

Dùng một đường dẫn công khai:

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

Sau khi thay đổi cấu hình, khởi động lại hoặc tải lại Gateway, rồi chạy:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` là chạy thử khô trừ khi bạn truyền `--yes`.

### Thông tin xác thực của nhà cung cấp không đạt

Kiểm tra nhà cung cấp đã chọn và các trường thông tin xác thực bắt buộc:

- Twilio: `twilio.accountSid`, `twilio.authToken` và `fromNumber`, hoặc
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` và `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` và
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` và `fromNumber`.

Thông tin xác thực phải tồn tại trên máy chủ Gateway. Việc chỉnh sửa hồ sơ shell cục bộ
không ảnh hưởng đến Gateway đang chạy cho đến khi nó khởi động lại hoặc tải lại
môi trường.

### Cuộc gọi bắt đầu nhưng Webhook của nhà cung cấp không đến

Xác nhận bảng điều khiển của nhà cung cấp trỏ tới đúng URL Webhook công khai:

```text
https://voice.example.com/voice/webhook
```

Sau đó kiểm tra trạng thái runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Nguyên nhân thường gặp:

- `publicUrl` trỏ tới đường dẫn khác với `serve.path`.
- URL đường hầm đã thay đổi sau khi Gateway khởi động.
- Proxy chuyển tiếp yêu cầu nhưng loại bỏ hoặc ghi lại header host/proto.
- Tường lửa hoặc DNS định tuyến tên máy chủ công khai tới nơi khác thay vì Gateway.
- Gateway đã được khởi động lại mà chưa bật Plugin Voice Call.

Khi reverse proxy hoặc đường hầm nằm trước Gateway, đặt
`webhookSecurity.allowedHosts` thành tên máy chủ công khai, hoặc dùng
`webhookSecurity.trustedProxyIPs` cho một địa chỉ proxy đã biết. Chỉ dùng
`webhookSecurity.trustForwardingHeaders` khi ranh giới proxy nằm trong
quyền kiểm soát của bạn.

### Xác minh chữ ký không đạt

Chữ ký của nhà cung cấp được kiểm tra dựa trên URL công khai mà OpenClaw dựng lại
từ yêu cầu đến. Nếu chữ ký không đạt:

- Xác nhận URL Webhook của nhà cung cấp khớp chính xác với `publicUrl`, bao gồm
  scheme, host và path.
- Với URL ngrok tầng miễn phí, cập nhật `publicUrl` khi tên máy chủ đường hầm thay đổi.
- Đảm bảo proxy giữ nguyên header host và proto gốc, hoặc cấu hình
  `webhookSecurity.allowedHosts`.
- Không bật `skipSignatureVerification` ngoài kiểm thử cục bộ.

### Google Meet tham gia qua Twilio không đạt

Google Meet dùng Plugin này cho lượt tham gia quay số vào qua Twilio. Trước tiên xác minh Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Sau đó xác minh rõ ràng transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Nếu Voice Call xanh nhưng người tham gia Meet không bao giờ tham gia, hãy kiểm tra số
quay vào Meet, PIN và `--dtmf-sequence`. Cuộc gọi điện thoại có thể vẫn ổn trong khi
cuộc họp từ chối hoặc bỏ qua chuỗi DTMF không đúng.

Google Meet truyền chuỗi DTMF của Meet và văn bản giới thiệu tới `voicecall.start`.
Đối với cuộc gọi Twilio, Voice Call phục vụ TwiML DTMF trước, chuyển hướng lại về
Webhook, rồi mở luồng phương tiện thời gian thực để phần giới thiệu đã lưu được tạo
sau khi người tham gia qua điện thoại đã vào cuộc họp.

Dùng `openclaw logs --follow` cho dấu vết giai đoạn trực tiếp. Một lượt tham gia Twilio Meet
khỏe mạnh ghi nhật ký theo thứ tự này:

- Google Meet ủy quyền lượt tham gia Twilio cho Voice Call.
- Voice Call lưu TwiML DTMF trước khi kết nối.
- TwiML ban đầu của Twilio được dùng và phục vụ trước khi xử lý thời gian thực.
- Voice Call phục vụ TwiML thời gian thực cho cuộc gọi Twilio.
- Cầu nối thời gian thực khởi động với lời chào ban đầu đã được xếp hàng.

`openclaw voicecall tail` vẫn hiển thị các bản ghi cuộc gọi đã lưu; nó hữu ích cho
trạng thái cuộc gọi và bản ghi lời thoại, nhưng không phải mọi chuyển tiếp Webhook/thời gian thực
đều xuất hiện ở đó.

### Cuộc gọi thời gian thực không có lời nói

Xác nhận chỉ bật một chế độ âm thanh. `realtime.enabled` và
`streaming.enabled` không thể cùng là true.

Đối với cuộc gọi Twilio thời gian thực, cũng xác minh:

- Một Plugin nhà cung cấp thời gian thực đã được tải và đăng ký.
- `realtime.provider` chưa được đặt hoặc đặt tên một nhà cung cấp đã đăng ký.
- Khóa API của nhà cung cấp có sẵn cho tiến trình Gateway.
- `openclaw logs --follow` cho thấy TwiML thời gian thực đã được phục vụ, cầu nối thời gian thực
  đã khởi động và lời chào ban đầu đã được xếp hàng.

## Liên quan

- [Chế độ trò chuyện](/vi/nodes/talk)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
