---
read_when:
    - Bạn muốn thực hiện cuộc gọi thoại đi từ OpenClaw
    - Bạn đang cấu hình hoặc phát triển Plugin cuộc gọi thoại
    - Bạn cần thoại thời gian thực hoặc phiên âm truyền trực tuyến qua điện thoại
sidebarTitle: Voice call
summary: Thực hiện cuộc gọi thoại đi và nhận cuộc gọi thoại đến qua Twilio, Telnyx hoặc Plivo, với tùy chọn thoại thời gian thực và chuyển giọng nói thành văn bản dạng phát trực tuyến
title: Plugin gọi thoại
x-i18n:
    generated_at: "2026-05-02T10:50:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

Cuộc gọi thoại cho OpenClaw thông qua một Plugin. Hỗ trợ thông báo đi,
hội thoại nhiều lượt, thoại thời gian thực song công toàn phần, phiên âm
trực tuyến, và cuộc gọi đến với chính sách danh sách cho phép.

**Nhà cung cấp hiện tại:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (phát triển/không có mạng).

<Note>
Plugin Voice Call chạy **bên trong tiến trình Gateway**. Nếu bạn dùng một
Gateway từ xa, hãy cài đặt và cấu hình Plugin trên máy đang chạy
Gateway, sau đó khởi động lại Gateway để tải Plugin.
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

    Nếu npm báo cáo gói do OpenClaw sở hữu là đã ngừng khuyến nghị sử dụng, phiên bản gói đó
    thuộc một luồng gói bên ngoài cũ hơn; hãy dùng bản dựng OpenClaw đã đóng gói hiện tại
    hoặc đường dẫn thư mục cục bộ cho đến khi một gói npm mới hơn được phát hành.

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
    việc bật Plugin, thông tin xác thực của nhà cung cấp, khả năng phơi bày Webhook, và việc
    chỉ có một chế độ âm thanh (`streaming` hoặc `realtime`) đang hoạt động. Dùng
    `--json` cho script.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Cả hai mặc định đều là chạy thử. Thêm `--yes` để thực sự thực hiện một cuộc gọi
    thông báo đi ngắn:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Với Twilio, Telnyx, và Plivo, thiết lập phải phân giải thành một **URL Webhook công khai**.
Nếu `publicUrl`, URL đường hầm, URL Tailscale, hoặc phương án dự phòng serve
phân giải thành loopback hoặc không gian mạng riêng, thiết lập sẽ thất bại thay vì
khởi động một nhà cung cấp không thể nhận Webhook từ nhà mạng.
</Warning>

## Cấu hình

Nếu `enabled: true` nhưng nhà cung cấp đã chọn thiếu thông tin xác thực,
quá trình khởi động Gateway sẽ ghi một cảnh báo thiết lập chưa hoàn tất với các khóa bị thiếu và
bỏ qua việc khởi động runtime. Các lệnh, lệnh gọi RPC, và công cụ agent vẫn
trả về đúng cấu hình nhà cung cấp còn thiếu khi được dùng.

<Note>
Thông tin xác thực voice-call chấp nhận SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, và `plugins.entries.voice-call.config.tts.providers.*.apiKey` được phân giải qua bề mặt SecretRef tiêu chuẩn; xem [bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
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
    - Twilio, Telnyx, và Plivo đều yêu cầu một URL Webhook **có thể truy cập công khai**.
    - `mock` là nhà cung cấp phát triển cục bộ (không gọi mạng).
    - Telnyx yêu cầu `telnyx.publicKey` (hoặc `TELNYX_PUBLIC_KEY`) trừ khi `skipSignatureVerification` là true.
    - `skipSignatureVerification` chỉ dành cho kiểm thử cục bộ.
    - Trên gói miễn phí của ngrok, đặt `publicUrl` thành URL ngrok chính xác; xác minh chữ ký luôn được thực thi.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` cho phép Webhook Twilio có chữ ký không hợp lệ **chỉ** khi `tunnel.provider="ngrok"` và `serve.bind` là loopback (agent cục bộ của ngrok). Chỉ dành cho phát triển cục bộ.
    - URL gói miễn phí của ngrok có thể thay đổi hoặc thêm hành vi trang trung gian; nếu `publicUrl` bị lệch, chữ ký Twilio sẽ thất bại. Sản xuất: ưu tiên miền ổn định hoặc funnel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` đóng các socket không bao giờ gửi khung `start` hợp lệ.
    - `streaming.maxPendingConnections` giới hạn tổng số socket trước khi bắt đầu chưa xác thực.
    - `streaming.maxPendingConnectionsPerIp` giới hạn số socket trước khi bắt đầu chưa xác thực cho mỗi IP nguồn.
    - `streaming.maxConnections` giới hạn tổng số socket luồng phương tiện đang mở (đang chờ + đang hoạt động).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Các cấu hình cũ dùng `provider: "log"`, `twilio.from`, hoặc các khóa OpenAI
    `streaming.*` cũ được viết lại bởi `openclaw doctor --fix`.
    Runtime dự phòng hiện vẫn chấp nhận các khóa voice-call cũ, nhưng
    đường dẫn viết lại là `openclaw doctor --fix` và shim tương thích chỉ là
    tạm thời.

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
mỗi cuộc gọi của nhà mạng nên bắt đầu với ngữ cảnh mới, ví dụ như lễ tân,
đặt lịch, IVR, hoặc luồng cầu nối Google Meet nơi cùng một số điện thoại có thể
đại diện cho các cuộc họp khác nhau.

## Hội thoại thoại thời gian thực

`realtime` chọn một nhà cung cấp thoại thời gian thực song công toàn phần cho âm thanh
cuộc gọi trực tiếp. Nó tách biệt với `streaming`, vốn chỉ chuyển tiếp âm thanh tới
các nhà cung cấp phiên âm thời gian thực.

<Warning>
Không thể kết hợp `realtime.enabled` với `streaming.enabled`. Chọn một
chế độ âm thanh cho mỗi cuộc gọi.
</Warning>

Hành vi runtime hiện tại:

- `realtime.enabled` được hỗ trợ cho Twilio Media Streams.
- `realtime.provider` là tùy chọn. Nếu không đặt, Voice Call dùng nhà cung cấp thoại thời gian thực đã đăng ký đầu tiên.
- Các nhà cung cấp thoại thời gian thực đi kèm: Google Gemini Live (`google`) và OpenAI (`openai`), được đăng ký bởi Plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `realtime.providers.<providerId>`.
- Voice Call mặc định phơi bày công cụ thời gian thực dùng chung `openclaw_agent_consult`. Mô hình thời gian thực có thể gọi công cụ này khi người gọi yêu cầu suy luận sâu hơn, thông tin hiện tại, hoặc các công cụ OpenClaw thông thường.
- `realtime.fastContext.enabled` mặc định tắt. Khi bật, trước tiên Voice Call tìm kiếm bộ nhớ/ngữ cảnh phiên đã lập chỉ mục cho câu hỏi tham vấn và trả các đoạn trích đó cho mô hình thời gian thực trong `realtime.fastContext.timeoutMs` trước khi chuyển dự phòng sang agent tham vấn đầy đủ chỉ khi `realtime.fastContext.fallbackToConsult` là true.
- Nếu `realtime.provider` trỏ tới một nhà cung cấp chưa đăng ký, hoặc không có nhà cung cấp thoại thời gian thực nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua phương tiện thời gian thực thay vì làm lỗi toàn bộ Plugin.
- Khóa phiên tham vấn tái sử dụng phiên cuộc gọi đã lưu khi có sẵn, sau đó chuyển dự phòng sang `sessionScope` đã cấu hình (`per-phone` theo mặc định, hoặc `per-call` cho cuộc gọi cô lập).

### Chính sách công cụ

`realtime.toolPolicy` kiểm soát lượt chạy tham vấn:

| Chính sách       | Hành vi                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Phơi bày công cụ tham vấn và giới hạn agent thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, và `memory_get`. |
| `owner`          | Phơi bày công cụ tham vấn và cho phép agent thông thường dùng chính sách công cụ agent bình thường.                                      |
| `none`           | Không phơi bày công cụ tham vấn. `realtime.tools` tùy chỉnh vẫn được truyền qua cho nhà cung cấp thời gian thực.                         |

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

Xem [nhà cung cấp Google](/vi/providers/google) và
[nhà cung cấp OpenAI](/vi/providers/openai) để biết các tùy chọn thoại thời gian thực
riêng theo nhà cung cấp.

## Phiên âm trực tuyến

`streaming` chọn một nhà cung cấp phiên âm thời gian thực cho âm thanh cuộc gọi trực tiếp.

Hành vi runtime hiện tại:

- `streaming.provider` là tùy chọn. Nếu không đặt, Voice Call dùng nhà cung cấp phiên âm thời gian thực đã đăng ký đầu tiên.
- Nhà cung cấp phiên âm thời gian thực đi kèm: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) và xAI (`xai`), được đăng ký bởi các Plugin nhà cung cấp của chúng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `streaming.providers.<providerId>`.
- Sau khi Twilio gửi thông báo `start` cho luồng đã được chấp nhận, Voice Call đăng ký luồng ngay lập tức, đưa media đầu vào vào hàng đợi qua nhà cung cấp phiên âm trong khi nhà cung cấp đang kết nối, và chỉ bắt đầu lời chào ban đầu sau khi phiên âm thời gian thực sẵn sàng.
- Nếu `streaming.provider` trỏ đến một nhà cung cấp chưa đăng ký, hoặc không có nhà cung cấp nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua phát trực tuyến media thay vì làm lỗi toàn bộ Plugin.

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
    endpoint `wss://api.x.ai/v1/stt`; mã hóa `mulaw`; tốc độ lấy mẫu `8000`;
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

Voice Call dùng cấu hình lõi `messages.tts` để phát trực tuyến
giọng nói trong cuộc gọi. Bạn có thể ghi đè cấu hình này trong cấu hình Plugin với
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
transport Microsoft hiện tại không cung cấp đầu ra PCM điện thoại.
</Warning>

Ghi chú hành vi:

- Các khóa `tts.<provider>` cũ trong cấu hình Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) được sửa bằng `openclaw doctor --fix`; cấu hình đã commit nên dùng `tts.providers.<provider>`.
- TTS lõi được dùng khi phát trực tuyến media Twilio được bật; nếu không, cuộc gọi sẽ quay về giọng nói gốc của nhà cung cấp.
- Nếu một luồng media Twilio đã hoạt động, Voice Call không quay về TwiML `<Say>`. Nếu TTS điện thoại không khả dụng ở trạng thái đó, yêu cầu phát sẽ lỗi thay vì trộn hai đường phát.
- Khi TTS điện thoại quay về một nhà cung cấp phụ, Voice Call ghi cảnh báo kèm chuỗi nhà cung cấp (`from`, `to`, `attempts`) để gỡ lỗi.
- Khi barge-in Twilio hoặc tháo dỡ luồng xóa hàng đợi TTS đang chờ, các yêu cầu phát trong hàng đợi được kết thúc thay vì treo người gọi đang chờ phát xong.

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
`inboundPolicy: "allowlist"` là lớp lọc ID người gọi có độ đảm bảo thấp. Plugin
chuẩn hóa giá trị `From` do nhà cung cấp cung cấp và so sánh với
`allowFrom`. Xác minh Webhook xác thực việc gửi từ nhà cung cấp và
tính toàn vẹn của payload, nhưng **không** chứng minh quyền sở hữu số người gọi
PSTN/VoIP. Hãy xem `allowFrom` là bộ lọc ID người gọi, không phải danh tính
người gọi mạnh.
</Warning>

Phản hồi tự động dùng hệ thống tác tử. Tinh chỉnh bằng `responseModel`,
`responseSystemPrompt` và `responseTimeoutMs`.

### Định tuyến theo số

Dùng `numbers` khi một Plugin Voice Call nhận cuộc gọi cho nhiều số điện thoại
và mỗi số nên hoạt động như một đường dây khác nhau. Ví dụ, một số
có thể dùng trợ lý cá nhân thân mật trong khi số khác dùng một persona doanh nghiệp,
một tác tử phản hồi khác và một giọng TTS khác.

Tuyến được chọn từ số `To` đã quay do nhà cung cấp cung cấp. Khóa phải là
số E.164. Khi có cuộc gọi đến, Voice Call phân giải tuyến khớp một lần,
lưu tuyến đã khớp vào bản ghi cuộc gọi, và dùng lại cấu hình hiệu dụng đó
cho lời chào, đường dẫn phản hồi tự động cổ điển, đường dẫn tham vấn thời gian thực và phát
TTS. Nếu không có tuyến nào khớp, cấu hình Voice Call toàn cục sẽ được dùng.
Cuộc gọi đi không dùng `numbers`; truyền rõ ràng đích gọi đi, thông báo và
phiên khi khởi tạo cuộc gọi.

Ghi đè tuyến hiện hỗ trợ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Giá trị tuyến `tts` được hợp nhất sâu trên cấu hình `tts` Voice Call toàn cục, vì vậy
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

### Hợp đồng đầu ra lời nói

Với phản hồi tự động, Voice Call thêm một hợp đồng đầu ra lời nói nghiêm ngặt vào
system prompt:

```text
{"spoken":"..."}
```

Voice Call trích xuất văn bản lời nói một cách phòng thủ:

- Bỏ qua payload được đánh dấu là nội dung reasoning/lỗi.
- Phân tích JSON trực tiếp, JSON trong khối fenced, hoặc khóa `"spoken"` nội tuyến.
- Quay về văn bản thuần và loại bỏ các đoạn mở đầu có khả năng là lập kế hoạch/meta.

Điều này giữ phần phát lời nói tập trung vào văn bản dành cho người gọi và tránh
rò rỉ văn bản lập kế hoạch vào âm thanh.

### Hành vi khởi động hội thoại

Với cuộc gọi `conversation` đi, xử lý thông báo đầu tiên gắn với trạng thái
phát trực tiếp:

- Việc xóa hàng đợi barge-in và phản hồi tự động chỉ bị chặn khi lời chào ban đầu đang được phát.
- Nếu phát ban đầu thất bại, cuộc gọi quay lại `listening` và thông báo ban đầu vẫn ở hàng đợi để thử lại.
- Phát ban đầu cho phát trực tuyến Twilio bắt đầu khi luồng kết nối mà không có độ trễ bổ sung.
- Barge-in hủy phát đang hoạt động và xóa các mục TTS Twilio đã xếp hàng nhưng chưa phát. Các mục đã xóa được phân giải là bị bỏ qua, nên logic phản hồi tiếp theo có thể tiếp tục mà không cần chờ âm thanh sẽ không bao giờ phát.
- Hội thoại thoại thời gian thực dùng lượt mở đầu riêng của luồng thời gian thực. Voice Call **không** đăng bản cập nhật TwiML `<Say>` cũ cho thông báo ban đầu đó, nên các phiên `<Connect><Stream>` gọi đi vẫn được gắn.

### Khoảng chờ ngắt kết nối luồng Twilio

Khi một luồng media Twilio ngắt kết nối, Voice Call chờ **2000 ms** trước khi
tự động kết thúc cuộc gọi:

- Nếu luồng kết nối lại trong khoảng thời gian đó, tự động kết thúc sẽ bị hủy.
- Nếu không có luồng nào đăng ký lại sau thời gian ân hạn, cuộc gọi sẽ kết thúc để ngăn cuộc gọi hoạt động bị kẹt.

## Bộ thu dọn cuộc gọi cũ

Dùng `staleCallReaperSeconds` để kết thúc các cuộc gọi không bao giờ nhận được Webhook
kết thúc (ví dụ, cuộc gọi chế độ thông báo không bao giờ hoàn tất). Mặc định
là `0` (tắt).

Khoảng khuyến nghị:

- **Sản xuất:** `120`–`300` giây cho các luồng kiểu thông báo.
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

Khi một proxy hoặc tunnel nằm trước Gateway, Plugin
tái dựng URL công khai để xác minh chữ ký. Các tùy chọn này
kiểm soát header chuyển tiếp nào được tin cậy:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Danh sách cho phép host từ header chuyển tiếp.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Tin cậy header chuyển tiếp mà không cần danh sách cho phép.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Chỉ tin cậy header chuyển tiếp khi IP từ xa của yêu cầu khớp danh sách.
</ParamField>

Các biện pháp bảo vệ bổ sung:

- **Bảo vệ phát lại** Webhook được bật cho Twilio và Plivo. Các yêu cầu Webhook hợp lệ bị phát lại được xác nhận nhưng bị bỏ qua về mặt hiệu ứng phụ.
- Các lượt hội thoại Twilio bao gồm token theo từng lượt trong callback `<Gather>`, nên callback lời nói cũ/bị phát lại không thể thỏa mãn một lượt bản chép lời mới hơn đang chờ.
- Các yêu cầu Webhook chưa xác thực bị từ chối trước khi đọc body khi thiếu header chữ ký bắt buộc của nhà cung cấp.
- Webhook voice-call dùng hồ sơ body tiền xác thực dùng chung (64 KB / 5 giây) cùng với giới hạn in-flight theo IP trước khi xác minh chữ ký.

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

Khi Gateway đã chạy, các lệnh vận hành `voicecall` ủy quyền
cho runtime voice-call do Gateway sở hữu để CLI không bind một máy chủ
Webhook thứ hai. Nếu không thể truy cập Gateway, các lệnh sẽ quay về
runtime CLI độc lập.

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ cuộc gọi thoại mặc định.
Dùng `--file <path>` để trỏ tới nhật ký khác và `--last <n>` để giới hạn
phân tích ở N bản ghi cuối cùng (mặc định 200). Đầu ra bao gồm p50/p90/p99
cho độ trễ lượt và thời gian chờ nghe.

## Công cụ agent

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

`dtmfSequence` chỉ hợp lệ với `mode: "conversation"`. Các cuộc gọi ở chế độ
thông báo nên dùng `voicecall.dtmf` sau khi cuộc gọi đã tồn tại nếu cần chữ số
sau khi kết nối.

## Khắc phục sự cố

### Thiết lập không đạt yêu cầu công khai Webhook

Chạy thiết lập từ cùng môi trường chạy Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Với `twilio`, `telnyx` và `plivo`, `webhook-exposure` phải có trạng thái xanh.
`publicUrl` đã cấu hình vẫn thất bại khi trỏ tới không gian mạng cục bộ hoặc
riêng tư, vì nhà mạng không thể gọi lại vào các địa chỉ đó. Không dùng
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` hoặc `fd00::/8` làm `publicUrl`.

Các cuộc gọi đi ở chế độ thông báo của Twilio gửi TwiML `<Say>` ban đầu trực tiếp
trong yêu cầu tạo cuộc gọi, vì vậy thông điệp được nói đầu tiên không phụ thuộc
vào việc Twilio lấy TwiML từ Webhook. Webhook công khai vẫn bắt buộc cho callback
trạng thái, cuộc gọi hội thoại, DTMF trước kết nối, luồng thời gian thực và điều
khiển cuộc gọi sau kết nối.

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

### Thông tin xác thực của nhà cung cấp thất bại

Kiểm tra nhà cung cấp đã chọn và các trường thông tin xác thực bắt buộc:

- Twilio: `twilio.accountSid`, `twilio.authToken` và `fromNumber`, hoặc
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` và `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` và
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` và `fromNumber`.

Thông tin xác thực phải tồn tại trên máy chủ Gateway. Việc chỉnh sửa hồ sơ shell
cục bộ không ảnh hưởng tới Gateway đang chạy cho tới khi Gateway khởi động lại
hoặc tải lại môi trường.

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
- URL tunnel đã thay đổi sau khi Gateway khởi động.
- Proxy chuyển tiếp yêu cầu nhưng loại bỏ hoặc ghi lại các header host/proto.
- Tường lửa hoặc DNS định tuyến hostname công khai tới nơi khác ngoài Gateway.
- Gateway đã được khởi động lại khi Plugin Voice Call chưa được bật.

Khi reverse proxy hoặc tunnel đứng trước Gateway, đặt
`webhookSecurity.allowedHosts` thành hostname công khai, hoặc dùng
`webhookSecurity.trustedProxyIPs` cho địa chỉ proxy đã biết. Chỉ dùng
`webhookSecurity.trustForwardingHeaders` khi ranh giới proxy nằm dưới quyền kiểm
soát của bạn.

### Xác minh chữ ký thất bại

Chữ ký của nhà cung cấp được kiểm tra với URL công khai mà OpenClaw tái dựng từ
yêu cầu đến. Nếu chữ ký thất bại:

- Xác nhận URL Webhook của nhà cung cấp khớp chính xác với `publicUrl`, bao gồm
  scheme, host và path.
- Với URL ngrok gói miễn phí, cập nhật `publicUrl` khi hostname tunnel thay đổi.
- Đảm bảo proxy giữ nguyên các header host và proto gốc, hoặc cấu hình
  `webhookSecurity.allowedHosts`.
- Không bật `skipSignatureVerification` ngoài kiểm thử cục bộ.

### Google Meet tham gia qua Twilio thất bại

Google Meet dùng Plugin này cho tham gia quay số vào qua Twilio. Trước tiên hãy xác minh Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Sau đó xác minh rõ transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Nếu Voice Call có trạng thái xanh nhưng người tham gia Meet không bao giờ tham gia, hãy kiểm tra số
quay vào Meet, PIN và `--dtmf-sequence`. Cuộc gọi điện thoại có thể hoạt động tốt trong khi
cuộc họp từ chối hoặc bỏ qua chuỗi DTMF không chính xác.

Google Meet truyền chuỗi DTMF của Meet và văn bản giới thiệu tới `voicecall.start`.
Với cuộc gọi Twilio, Voice Call phục vụ TwiML DTMF trước, chuyển hướng trở lại
Webhook, rồi mở luồng phương tiện thời gian thực để phần giới thiệu đã lưu được tạo
sau khi người tham gia qua điện thoại đã vào cuộc họp.

Dùng `openclaw logs --follow` cho trace giai đoạn trực tiếp. Một lần tham gia Twilio Meet
khỏe mạnh ghi nhật ký theo thứ tự này:

- Google Meet ủy quyền việc tham gia Twilio cho Voice Call.
- Voice Call lưu trữ TwiML DTMF trước kết nối.
- TwiML ban đầu của Twilio được tiêu thụ và phục vụ trước khi xử lý thời gian thực.
- Voice Call phục vụ TwiML thời gian thực cho cuộc gọi Twilio.
- Cầu nối thời gian thực bắt đầu với lời chào ban đầu được xếp hàng.

`openclaw voicecall tail` vẫn hiển thị các bản ghi cuộc gọi đã lưu; nó hữu ích cho
trạng thái cuộc gọi và bản ghi lời thoại, nhưng không phải mọi chuyển tiếp
Webhook/thời gian thực đều xuất hiện ở đó.

### Cuộc gọi thời gian thực không có lời nói

Xác nhận chỉ một chế độ âm thanh được bật. `realtime.enabled` và
`streaming.enabled` không thể cùng là true.

Với cuộc gọi Twilio thời gian thực, cũng hãy xác minh:

- Một Plugin nhà cung cấp thời gian thực đã được tải và đăng ký.
- `realtime.provider` chưa được đặt hoặc đặt tên một nhà cung cấp đã đăng ký.
- Khóa API của nhà cung cấp có sẵn cho tiến trình Gateway.
- `openclaw logs --follow` hiển thị TwiML thời gian thực đã được phục vụ, cầu nối
  thời gian thực đã bắt đầu và lời chào ban đầu đã được xếp hàng.

## Liên quan

- [Chế độ nói chuyện](/vi/nodes/talk)
- [Văn bản thành giọng nói](/vi/tools/tts)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
