---
read_when:
    - Bạn muốn thực hiện cuộc gọi thoại đi từ OpenClaw
    - Bạn đang cấu hình hoặc phát triển plugin gọi thoại
    - Bạn cần giọng nói thời gian thực hoặc phiên âm phát trực tuyến trên điện thoại
sidebarTitle: Voice call
summary: Thực hiện cuộc gọi thoại đi và nhận cuộc gọi thoại đến qua Twilio, Telnyx hoặc Plivo, với tùy chọn thoại thời gian thực và phiên âm trực tuyến
title: Plugin gọi thoại
x-i18n:
    generated_at: "2026-06-27T17:59:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

Gọi thoại cho OpenClaw qua một Plugin. Hỗ trợ thông báo gọi ra,
hội thoại nhiều lượt, thoại thời gian thực song công toàn phần, phiên âm
trực tuyến, và cuộc gọi đến với chính sách danh sách cho phép.

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

    Dùng gói trần để theo thẻ phát hành chính thức hiện tại. Chỉ ghim
    phiên bản chính xác khi bạn cần một bản cài đặt có thể tái lập.

    Sau đó khởi động lại Gateway để Plugin được tải.

  </Step>
  <Step title="Configure provider and webhook">
    Đặt cấu hình trong `plugins.entries.voice-call.config` (xem
    [Cấu hình](#configuration) bên dưới để biết đầy đủ cấu trúc). Tối thiểu cần:
    `provider`, thông tin xác thực của nhà cung cấp, `fromNumber`, và một URL
    Webhook có thể truy cập công khai.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Đầu ra mặc định dễ đọc trong nhật ký chat và terminal. Lệnh này kiểm tra
    việc bật Plugin, thông tin xác thực của nhà cung cấp, khả năng truy cập Webhook,
    và bảo đảm chỉ một chế độ âm thanh (`streaming` hoặc `realtime`) đang hoạt động.
    Dùng `--json` cho script.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Cả hai mặc định là chạy thử khô. Thêm `--yes` để thực sự thực hiện một
    cuộc gọi thông báo ngắn ra ngoài:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Với Twilio, Telnyx, và Plivo, quá trình thiết lập phải phân giải thành một **URL Webhook công khai**.
Nếu `publicUrl`, URL đường hầm, URL Tailscale, hoặc phương án dự phòng serve
phân giải thành loopback hoặc không gian mạng riêng, thiết lập sẽ thất bại thay vì
khởi động một nhà cung cấp không thể nhận Webhook từ nhà mạng.
</Warning>

## Cấu hình

Nếu `enabled: true` nhưng nhà cung cấp đã chọn thiếu thông tin xác thực,
Gateway startup sẽ ghi cảnh báo thiết lập chưa hoàn tất cùng các khóa bị thiếu và
bỏ qua việc khởi động runtime. Các lệnh, lệnh gọi RPC, và công cụ agent vẫn
trả về chính xác cấu hình nhà cung cấp còn thiếu khi được dùng.

<Note>
Thông tin xác thực voice-call chấp nhận SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, và `plugins.entries.voice-call.config.tts.providers.*.apiKey` phân giải qua bề mặt SecretRef tiêu chuẩn; xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
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
                  openai: { speakerVoice: "alloy" },
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
    - `mock` là nhà cung cấp phát triển cục bộ (không có lệnh gọi mạng).
    - Telnyx yêu cầu `telnyx.publicKey` (hoặc `TELNYX_PUBLIC_KEY`) trừ khi `skipSignatureVerification` là true.
    - `skipSignatureVerification` chỉ dành cho kiểm thử cục bộ.
    - Trên gói miễn phí của ngrok, đặt `publicUrl` thành đúng URL ngrok; việc xác minh chữ ký luôn được thực thi.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` cho phép Webhook Twilio có chữ ký không hợp lệ **chỉ** khi `tunnel.provider="ngrok"` và `serve.bind` là loopback (agent cục bộ của ngrok). Chỉ dùng cho phát triển cục bộ.
    - URL gói miễn phí của ngrok có thể thay đổi hoặc thêm hành vi trang trung gian; nếu `publicUrl` lệch, chữ ký Twilio sẽ thất bại. Sản xuất: ưu tiên miền ổn định hoặc Tailscale funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` đóng các socket không bao giờ gửi frame `start` hợp lệ.
    - `streaming.maxPendingConnections` giới hạn tổng số socket trước khi start chưa xác thực.
    - `streaming.maxPendingConnectionsPerIp` giới hạn số socket trước khi start chưa xác thực theo từng IP nguồn.
    - `streaming.maxConnections` giới hạn tổng số socket media stream đang mở (đang chờ + đang hoạt động).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Cấu hình cũ dùng `provider: "log"`, `twilio.from`, hoặc các khóa OpenAI
    `streaming.*` kế thừa được viết lại bởi `openclaw doctor --fix`.
    Runtime fallback hiện vẫn chấp nhận các khóa voice-call cũ, nhưng
    đường dẫn viết lại là `openclaw doctor --fix` và shim tương thích chỉ là
    tạm thời.

    Các khóa streaming được tự động di trú:

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
mỗi cuộc gọi qua nhà mạng nên bắt đầu với ngữ cảnh mới, ví dụ luồng tiếp tân,
đặt lịch, IVR, hoặc cầu nối Google Meet nơi cùng một số điện thoại có thể
đại diện cho các cuộc họp khác nhau.

Voice Call lưu các khóa phiên được tạo dưới namespace agent đã cấu hình
(`agent:<agentId>:voice:*`) để bộ nhớ cuộc gọi vẫn tồn tại sau khi Gateway chuẩn hóa
khóa phiên sau các lần khởi động lại. Các khóa tích hợp tường minh dạng thô dùng cùng
namespace agent. Khóa chuẩn `agent:<configuredAgentId>:*` giữ nguyên chủ sở hữu đó,
và các bí danh chính của nó tôn trọng `session.mainKey` của core và phạm vi toàn cục.
Đầu vào `agent:*` ngoại lai hoặc sai định dạng được đặt phạm vi như một khóa mờ dưới agent đã cấu hình;
`global` và `unknown` vẫn là sentinel toàn cục. Gateway startup nâng cấp các khóa thô cũ
trong kho mặc định hoặc kho có mẫu `{agentId}` khi đường dẫn chứng minh được một
chủ sở hữu. Trong kho tùy chỉnh cố định, các hàng kế thừa mơ hồ được giữ nguyên vì
chúng không chứa đủ thông tin để chọn chủ sở hữu; các cuộc gọi mới dùng
lịch sử chuẩn có phạm vi theo agent.

## Hội thoại thoại thời gian thực

`realtime` chọn một nhà cung cấp thoại thời gian thực song công toàn phần cho âm thanh
cuộc gọi trực tiếp. Nó tách biệt với `streaming`, vốn chỉ chuyển tiếp âm thanh đến
các nhà cung cấp phiên âm thời gian thực.

<Warning>
`realtime.enabled` không thể kết hợp với `streaming.enabled`. Chọn một
chế độ âm thanh cho mỗi cuộc gọi.
</Warning>

Hành vi runtime hiện tại:

- `realtime.enabled` được hỗ trợ cho Twilio Media Streams.
- `realtime.provider` là tùy chọn. Nếu không đặt, Voice Call dùng nhà cung cấp thoại thời gian thực đã đăng ký đầu tiên.
- Nhà cung cấp thoại thời gian thực được đóng gói: Google Gemini Live (`google`) và OpenAI (`openai`), do các Plugin nhà cung cấp tương ứng đăng ký.
- Cấu hình thô thuộc sở hữu nhà cung cấp nằm dưới `realtime.providers.<providerId>`.
- Voice Call mặc định phơi bày công cụ thời gian thực dùng chung `openclaw_agent_consult`. Mô hình thời gian thực có thể gọi nó khi người gọi yêu cầu suy luận sâu hơn, thông tin hiện tại, hoặc các công cụ OpenClaw thông thường.
- `realtime.consultPolicy` tùy chọn thêm hướng dẫn về thời điểm mô hình thời gian thực nên gọi `openclaw_agent_consult`.
- `realtime.agentContext.enabled` mặc định tắt. Khi bật, Voice Call chèn danh tính agent có giới hạn và capsule tệp workspace đã chọn vào hướng dẫn của nhà cung cấp thời gian thực trong lúc thiết lập phiên.
- `realtime.fastContext.enabled` mặc định tắt. Khi bật, Voice Call trước tiên tìm trong bộ nhớ/ngữ cảnh phiên đã được lập chỉ mục cho câu hỏi consult và trả các đoạn trích đó cho mô hình thời gian thực trong `realtime.fastContext.timeoutMs` trước khi rơi về agent consult đầy đủ chỉ khi `realtime.fastContext.fallbackToConsult` là true.
- Nếu `realtime.provider` trỏ đến một nhà cung cấp chưa đăng ký, hoặc hoàn toàn không có nhà cung cấp thoại thời gian thực nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua media thời gian thực thay vì làm hỏng toàn bộ Plugin.
- Khóa phiên consult tái sử dụng phiên cuộc gọi đã lưu khi có, rồi rơi về `sessionScope` đã cấu hình (`per-phone` theo mặc định, hoặc `per-call` cho các cuộc gọi tách biệt).

### Chính sách công cụ

`realtime.toolPolicy` kiểm soát lượt chạy consult:

| Chính sách       | Hành vi                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Phơi bày công cụ consult và giới hạn agent thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, và `memory_get`. |
| `owner`          | Phơi bày công cụ consult và cho phép agent thông thường dùng chính sách công cụ agent bình thường.                                      |
| `none`           | Không phơi bày công cụ consult. `realtime.tools` tùy chỉnh vẫn được chuyển tiếp đến nhà cung cấp thời gian thực.                         |

`realtime.consultPolicy` chỉ kiểm soát hướng dẫn cho mô hình thời gian thực:

| Chính sách    | Hướng dẫn                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Giữ prompt mặc định và để nhà cung cấp quyết định khi nào gọi công cụ consult.                  |
| `substantive` | Trả lời trực tiếp phần nối hội thoại đơn giản và consult trước các sự kiện, bộ nhớ, công cụ, hoặc ngữ cảnh. |
| `always`      | Consult trước mọi câu trả lời có nội dung đáng kể.                                              |

### Ngữ cảnh giọng nói của agent

Bật `realtime.agentContext` khi cầu nối giọng nói cần nghe giống tác tử OpenClaw đã cấu hình mà không phải trả chi phí một lượt khứ hồi tham vấn tác tử đầy đủ trong các lượt thông thường. Capsule ngữ cảnh được thêm một lần khi phiên realtime được tạo, nên không làm tăng độ trễ theo từng lượt. Các lệnh gọi tới `openclaw_agent_consult` vẫn chạy tác tử OpenClaw đầy đủ và nên được dùng cho công việc công cụ, thông tin hiện tại, tra cứu bộ nhớ, hoặc trạng thái workspace.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Ví dụ nhà cung cấp realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Mặc định: khóa API từ `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, hoặc `GOOGLE_GENERATIVE_AI_API_KEY`; mô hình
    `gemini-2.5-flash-native-audio-preview-12-2025`; giọng `Kore`.
    `sessionResumption` và `contextWindowCompression` được bật mặc định cho các cuộc gọi dài hơn,
    có thể kết nối lại. Dùng `silenceDurationMs`, `startSensitivity`, và
    `endSensitivity` để tinh chỉnh chuyển lượt nhanh hơn trên âm thanh điện thoại.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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
[Nhà cung cấp OpenAI](/vi/providers/openai) để biết các tùy chọn giọng nói realtime
riêng theo nhà cung cấp.

## Phiên âm streaming

`streaming` chọn một nhà cung cấp phiên âm realtime cho âm thanh cuộc gọi trực tiếp.

Hành vi runtime hiện tại:

- `streaming.provider` là tùy chọn. Nếu chưa đặt, Voice Call dùng nhà cung cấp phiên âm realtime đã đăng ký đầu tiên.
- Các nhà cung cấp phiên âm realtime đi kèm: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), và xAI (`xai`), được đăng ký bởi các plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm dưới `streaming.providers.<providerId>`.
- Sau khi Twilio gửi thông báo `start` của luồng đã được chấp nhận, Voice Call đăng ký luồng ngay lập tức, đưa media đến vào hàng đợi qua nhà cung cấp phiên âm trong khi nhà cung cấp kết nối, và chỉ bắt đầu lời chào ban đầu sau khi phiên âm realtime đã sẵn sàng.
- Nếu `streaming.provider` trỏ tới một nhà cung cấp chưa đăng ký, hoặc không có nhà cung cấp nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua media streaming thay vì làm hỏng toàn bộ plugin.

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
    endpoint `wss://api.x.ai/v1/stt`; mã hóa `mulaw`; tần số lấy mẫu `8000`;
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

Voice Call dùng cấu hình `messages.tts` lõi cho giọng nói streaming
trên cuộc gọi. Bạn có thể ghi đè cấu hình đó dưới cấu hình plugin với
**cùng cấu trúc** — cấu hình này được deep-merge với `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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

- Các khóa `tts.<provider>` legacy bên trong cấu hình plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) được `openclaw doctor --fix` sửa; cấu hình đã commit nên dùng `tts.providers.<provider>`.
- Core TTS được dùng khi media streaming của Twilio được bật; nếu không, cuộc gọi quay về giọng nói gốc của nhà cung cấp.
- Nếu một media stream Twilio đã hoạt động, Voice Call không quay về TwiML `<Say>`. Nếu telephony TTS không khả dụng trong trạng thái đó, yêu cầu phát lại sẽ thất bại thay vì trộn hai đường phát lại.
- Khi telephony TTS quay về một nhà cung cấp phụ, Voice Call ghi cảnh báo với chuỗi nhà cung cấp (`from`, `to`, `attempts`) để gỡ lỗi.
- Khi barge-in của Twilio hoặc teardown luồng xóa hàng đợi TTS đang chờ, các yêu cầu phát lại trong hàng đợi được hoàn tất thay vì khiến người gọi bị treo khi chờ hoàn tất phát lại.

### Ví dụ TTS

<Tabs>
  <Tab title="Chỉ Core TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="Ghi đè mô hình OpenAI (deep-merge)">
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
                speakerVoice: "marin",
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
`inboundPolicy: "allowlist"` là một lớp lọc caller-ID có độ bảo đảm thấp. Plugin
chuẩn hóa giá trị `From` do nhà cung cấp cung cấp và so sánh với
`allowFrom`. Xác minh Webhook xác thực việc phân phối của nhà cung cấp và
tính toàn vẹn của payload, nhưng **không** chứng minh quyền sở hữu số
người gọi PSTN/VoIP. Hãy xem `allowFrom` là lọc caller-ID, không phải danh tính
người gọi mạnh.
</Warning>

Phản hồi tự động dùng hệ thống tác tử. Tinh chỉnh bằng `responseModel`,
`responseSystemPrompt`, và `responseTimeoutMs`.

### Định tuyến theo số

Dùng `numbers` khi một plugin Voice Call nhận cuộc gọi cho nhiều số điện thoại
và mỗi số cần hoạt động như một đường dây khác nhau. Ví dụ, một số
có thể dùng trợ lý cá nhân thân mật trong khi số khác dùng persona doanh nghiệp,
một tác tử phản hồi khác, và một giọng TTS khác.

Tuyến được chọn từ số `To` đã gọi do nhà cung cấp cung cấp. Khóa phải là
số E.164. Khi cuộc gọi đến, Voice Call phân giải tuyến khớp một lần,
lưu tuyến đã khớp trên bản ghi cuộc gọi, và tái sử dụng cấu hình hiệu lực đó
cho lời chào, đường phản hồi tự động cổ điển, đường tham vấn realtime, và phát lại TTS.
Nếu không có tuyến nào khớp, cấu hình Voice Call toàn cục được dùng.
Cuộc gọi đi không dùng `numbers`; truyền rõ đích đi, thông điệp, và
phiên khi khởi tạo cuộc gọi.

Các ghi đè tuyến hiện hỗ trợ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Giá trị tuyến `tts` được deep-merge lên trên cấu hình `tts` Voice Call toàn cục, nên
thường bạn chỉ cần ghi đè giọng nhà cung cấp:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Hợp đồng đầu ra giọng nói

Đối với phản hồi tự động, Voice Call nối thêm một hợp đồng đầu ra giọng nói nghiêm ngặt vào
system prompt:

```text
{"spoken":"..."}
```

Voice Call trích xuất văn bản lời nói theo cách phòng thủ:

- Bỏ qua payload được đánh dấu là nội dung reasoning/lỗi.
- Phân tích JSON trực tiếp, JSON trong fence, hoặc khóa `"spoken"` nội tuyến.
- Quay về văn bản thuần và xóa các đoạn mở đầu có khả năng là planning/meta.

Điều này giữ phần phát lại lời nói tập trung vào văn bản dành cho người gọi và tránh
rò rỉ văn bản planning vào âm thanh.

### Hành vi khởi động cuộc trò chuyện

Đối với cuộc gọi `conversation` đi, xử lý thông điệp đầu tiên gắn với trạng thái
phát lại trực tiếp:

- Chỉ tắt xóa hàng đợi barge-in và phản hồi tự động khi lời chào ban đầu đang được phát.
- Nếu phát lại ban đầu thất bại, cuộc gọi quay về `listening` và thông điệp ban đầu vẫn ở hàng đợi để thử lại.
- Phát lại ban đầu cho Twilio streaming bắt đầu khi luồng kết nối mà không có độ trễ bổ sung.
- Barge-in hủy phát lại đang hoạt động và xóa các mục Twilio TTS đã xếp hàng nhưng chưa phát. Các mục đã xóa được resolve là bị bỏ qua, nên logic phản hồi tiếp theo có thể tiếp tục mà không phải chờ âm thanh sẽ không bao giờ phát.
- Các cuộc trò chuyện giọng nói realtime dùng lượt mở đầu riêng của luồng realtime. Voice Call **không** đăng một bản cập nhật TwiML `<Say>` legacy cho thông điệp ban đầu đó, nên các phiên `<Connect><Stream>` đi vẫn được gắn kết.

### Thời gian gia hạn khi luồng Twilio ngắt kết nối

Khi một luồng media Twilio bị ngắt kết nối, Voice Call chờ **2000 ms** trước khi
tự động kết thúc cuộc gọi:

- Nếu luồng kết nối lại trong khoảng thời gian đó, việc tự động kết thúc sẽ bị hủy.
- Nếu không có luồng nào đăng ký lại sau thời gian gia hạn, cuộc gọi sẽ được kết thúc để tránh các cuộc gọi đang hoạt động bị kẹt.

## Bộ dọn cuộc gọi cũ

Dùng `staleCallReaperSeconds` để kết thúc các cuộc gọi không bao giờ nhận được
webhook kết thúc (ví dụ: các cuộc gọi ở chế độ thông báo không bao giờ hoàn tất).
Mặc định là `0` (đã tắt).

Khoảng giá trị khuyến nghị:

- **Sản xuất:** `120`–`300` giây cho các luồng kiểu thông báo.
- Giữ giá trị này **cao hơn `maxDurationSeconds`** để các cuộc gọi bình thường có thể hoàn tất. Điểm khởi đầu tốt là `maxDurationSeconds + 30–60` giây.

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

Khi một proxy hoặc tunnel nằm trước Gateway, Plugin sẽ tái tạo URL công khai để
xác minh chữ ký. Các tùy chọn này kiểm soát những header chuyển tiếp nào được tin cậy:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Danh sách cho phép các host từ header chuyển tiếp.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Tin cậy header chuyển tiếp mà không cần danh sách cho phép.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Chỉ tin cậy header chuyển tiếp khi IP từ xa của yêu cầu khớp với danh sách.
</ParamField>

Các biện pháp bảo vệ bổ sung:

- **Bảo vệ phát lại** Webhook được bật cho Twilio và Plivo. Các yêu cầu webhook hợp lệ bị phát lại sẽ được xác nhận nhưng bị bỏ qua đối với tác dụng phụ.
- Các lượt hội thoại Twilio bao gồm token theo từng lượt trong callback `<Gather>`, vì vậy callback giọng nói cũ/bị phát lại không thể đáp ứng một lượt bản ghi đang chờ mới hơn.
- Các yêu cầu webhook chưa xác thực bị từ chối trước khi đọc body khi thiếu header chữ ký bắt buộc của nhà cung cấp.
- Webhook voice-call dùng cấu hình body tiền xác thực dùng chung (64 KB / 5 giây) cộng với giới hạn in-flight theo từng IP trước khi xác minh chữ ký.

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

Khi Gateway đã chạy, các lệnh vận hành `voicecall` sẽ ủy quyền cho runtime
voice-call do Gateway sở hữu để CLI không bind một máy chủ webhook thứ hai.
Nếu không thể kết nối tới Gateway, các lệnh sẽ dự phòng sang runtime CLI độc lập.

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ voice-call mặc định.
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

Plugin voice-call đi kèm một skill agent tương ứng.

## RPC Gateway

| Phương thức          | Đối số                                     |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` chỉ hợp lệ với `mode: "conversation"`. Các cuộc gọi ở chế độ
thông báo nên dùng `voicecall.dtmf` sau khi cuộc gọi tồn tại nếu cần gửi chữ số
sau khi kết nối.

## Khắc phục sự cố

### Thiết lập không thể expose webhook

Chạy thiết lập từ cùng môi trường chạy Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Với `twilio`, `telnyx` và `plivo`, `webhook-exposure` phải có trạng thái xanh.
`publicUrl` đã cấu hình vẫn thất bại khi trỏ tới không gian mạng cục bộ hoặc
riêng tư, vì nhà mạng không thể gọi lại vào các địa chỉ đó. Không dùng
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, hoặc `fd00::/8` làm `publicUrl`.

Các cuộc gọi đi ở chế độ thông báo của Twilio gửi TwiML `<Say>` ban đầu trực tiếp trong
yêu cầu tạo cuộc gọi, nên thông điệp được nói đầu tiên không phụ thuộc vào việc Twilio
lấy TwiML webhook. Webhook công khai vẫn bắt buộc cho callback trạng thái,
cuộc gọi hội thoại, DTMF trước kết nối, luồng thời gian thực và điều khiển cuộc gọi
sau kết nối.

Dùng một đường dẫn expose công khai:

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

### Thông tin xác thực nhà cung cấp thất bại

Kiểm tra nhà cung cấp đã chọn và các trường thông tin xác thực bắt buộc:

- Twilio: `twilio.accountSid`, `twilio.authToken` và `fromNumber`, hoặc
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` và `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` và
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` và `fromNumber`.

Thông tin xác thực phải tồn tại trên host Gateway. Việc chỉnh sửa profile shell cục bộ
không ảnh hưởng đến Gateway đang chạy cho đến khi nó khởi động lại hoặc tải lại
môi trường.

### Cuộc gọi bắt đầu nhưng webhook của nhà cung cấp không đến

Xác nhận console của nhà cung cấp trỏ tới đúng URL webhook công khai:

```text
https://voice.example.com/voice/webhook
```

Sau đó kiểm tra trạng thái runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Nguyên nhân phổ biến:

- `publicUrl` trỏ tới đường dẫn khác với `serve.path`.
- URL tunnel đã thay đổi sau khi Gateway khởi động.
- Proxy chuyển tiếp yêu cầu nhưng loại bỏ hoặc viết lại header host/proto.
- Tường lửa hoặc DNS định tuyến hostname công khai tới nơi khác ngoài Gateway.
- Gateway được khởi động lại mà không bật Plugin Voice Call.

Khi reverse proxy hoặc tunnel nằm trước Gateway, đặt
`webhookSecurity.allowedHosts` thành hostname công khai, hoặc dùng
`webhookSecurity.trustedProxyIPs` cho địa chỉ proxy đã biết. Chỉ dùng
`webhookSecurity.trustForwardingHeaders` khi ranh giới proxy nằm trong quyền kiểm soát
của bạn.

### Xác minh chữ ký thất bại

Chữ ký của nhà cung cấp được kiểm tra với URL công khai mà OpenClaw tái tạo
từ yêu cầu đến. Nếu chữ ký thất bại:

- Xác nhận URL webhook của nhà cung cấp khớp chính xác với `publicUrl`, bao gồm
  scheme, host và path.
- Với URL ngrok bậc miễn phí, cập nhật `publicUrl` khi hostname tunnel thay đổi.
- Đảm bảo proxy giữ nguyên header host và proto gốc, hoặc cấu hình
  `webhookSecurity.allowedHosts`.
- Không bật `skipSignatureVerification` bên ngoài kiểm thử cục bộ.

### Google Meet Twilio không tham gia được

Google Meet dùng Plugin này cho lượt tham gia quay số vào qua Twilio. Trước tiên xác minh Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Sau đó xác minh rõ ràng transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Nếu Voice Call xanh nhưng người tham gia Meet không bao giờ tham gia, hãy kiểm tra
số quay vào Meet, PIN và `--dtmf-sequence`. Cuộc gọi điện thoại có thể khỏe mạnh trong khi
cuộc họp từ chối hoặc bỏ qua chuỗi DTMF không chính xác.

Google Meet khởi động nhánh cuộc gọi Twilio thông qua `voicecall.start` với một
chuỗi DTMF trước kết nối. Các chuỗi bắt nguồn từ PIN bao gồm
`voiceCall.dtmfDelayMs` của Plugin Google Meet dưới dạng chữ số chờ Twilio ở đầu.
Mặc định là 12 giây vì lời nhắc quay vào Meet có thể đến muộn. Sau đó Voice Call
chuyển hướng trở lại xử lý thời gian thực trước khi lời chào mở đầu được yêu cầu.

Dùng `openclaw logs --follow` để theo dõi pha trực tiếp. Một lượt tham gia Twilio Meet
khỏe mạnh ghi nhật ký theo thứ tự này:

- Google Meet ủy quyền lượt tham gia Twilio cho Voice Call.
- Voice Call lưu TwiML DTMF trước kết nối.
- TwiML ban đầu của Twilio được tiêu thụ và phục vụ trước khi xử lý thời gian thực.
- Voice Call phục vụ TwiML thời gian thực cho cuộc gọi Twilio.
- Google Meet yêu cầu lời nói mở đầu bằng `voicecall.speak` sau độ trễ hậu DTMF.

`openclaw voicecall tail` vẫn hiển thị các bản ghi cuộc gọi đã lưu; nó hữu ích cho
trạng thái cuộc gọi và bản ghi lời nói, nhưng không phải mọi chuyển tiếp webhook/thời gian thực
đều xuất hiện ở đó.

### Cuộc gọi thời gian thực không có tiếng nói

Xác nhận chỉ bật một chế độ âm thanh. `realtime.enabled` và
`streaming.enabled` không thể cùng là true.

Với các cuộc gọi Twilio thời gian thực, cũng xác minh:

- Một Plugin nhà cung cấp thời gian thực đã được tải và đăng ký.
- `realtime.provider` chưa được đặt hoặc đặt tên một nhà cung cấp đã đăng ký.
- Khóa API của nhà cung cấp có sẵn cho tiến trình Gateway.
- `openclaw logs --follow` hiển thị TwiML thời gian thực được phục vụ, bridge thời gian thực
  đã khởi động và lời chào ban đầu đã được đưa vào hàng đợi.

## Liên quan

- [Chế độ trò chuyện](/vi/nodes/talk)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
