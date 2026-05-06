---
read_when:
    - Bạn muốn thực hiện một cuộc gọi thoại đi từ OpenClaw
    - Bạn đang cấu hình hoặc phát triển Plugin voice-call
    - Bạn cần thoại thời gian thực hoặc phiên âm truyền phát trên hệ thống điện thoại
sidebarTitle: Voice call
summary: Thực hiện cuộc gọi thoại đi và nhận cuộc gọi thoại đến qua Twilio, Telnyx hoặc Plivo, với tùy chọn giọng nói thời gian thực và chuyển lời nói thành văn bản dạng phát trực tuyến
title: Plugin cuộc gọi thoại
x-i18n:
    generated_at: "2026-05-06T09:25:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba168696481ef0cc3c55ac8fd8be4382cb36889a12ed6d881fe6b29a2b0a54c
    source_path: plugins/voice-call.md
    workflow: 16
---

Cuộc gọi thoại cho OpenClaw thông qua một plugin. Hỗ trợ thông báo đi,
cuộc hội thoại nhiều lượt, giọng nói thời gian thực song công toàn phần, bản chép lời
truyền phát, và cuộc gọi đến với chính sách danh sách cho phép.

**Nhà cung cấp hiện tại:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/không dùng mạng).

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
      <Tab title="Từ thư mục cục bộ (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Dùng gói không kèm phiên bản để theo thẻ phát hành chính thức hiện tại. Chỉ ghim
    một phiên bản chính xác khi bạn cần cài đặt có thể tái lập.

    Sau đó khởi động lại Gateway để plugin được tải.

  </Step>
  <Step title="Cấu hình nhà cung cấp và webhook">
    Đặt cấu hình trong `plugins.entries.voice-call.config` (xem
    [Cấu hình](#configuration) bên dưới để biết đầy đủ cấu trúc). Tối thiểu cần:
    `provider`, thông tin xác thực của nhà cung cấp, `fromNumber`, và một URL webhook
    có thể truy cập công khai.
  </Step>
  <Step title="Xác minh thiết lập">
    ```bash
    openclaw voicecall setup
    ```

    Đầu ra mặc định dễ đọc trong nhật ký trò chuyện và terminal. Lệnh này kiểm tra
    việc bật plugin, thông tin xác thực của nhà cung cấp, khả năng phơi bày webhook, và đảm bảo
    chỉ một chế độ âm thanh (`streaming` hoặc `realtime`) đang hoạt động. Dùng
    `--json` cho script.

  </Step>
  <Step title="Kiểm thử smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Cả hai mặc định đều là chạy thử không thực hiện thật. Thêm `--yes` để thực sự đặt một cuộc gọi
    thông báo đi ngắn:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Với Twilio, Telnyx, và Plivo, thiết lập phải phân giải thành một **URL webhook công khai**.
Nếu `publicUrl`, URL đường hầm, URL Tailscale, hoặc phương án dự phòng serve
phân giải về loopback hoặc không gian mạng riêng, thiết lập sẽ thất bại thay vì
khởi động một nhà cung cấp không thể nhận webhook của nhà mạng.
</Warning>

## Cấu hình

Nếu `enabled: true` nhưng nhà cung cấp đã chọn thiếu thông tin xác thực,
Gateway khi khởi động sẽ ghi cảnh báo thiết lập chưa hoàn tất với các khóa còn thiếu và
bỏ qua việc khởi động runtime. Các lệnh, lệnh gọi RPC, và công cụ agent vẫn
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
  <Accordion title="Ghi chú về phơi bày và bảo mật nhà cung cấp">
    - Twilio, Telnyx, và Plivo đều yêu cầu URL webhook **có thể truy cập công khai**.
    - `mock` là nhà cung cấp dev cục bộ (không có lệnh gọi mạng).
    - Telnyx yêu cầu `telnyx.publicKey` (hoặc `TELNYX_PUBLIC_KEY`) trừ khi `skipSignatureVerification` là true.
    - `skipSignatureVerification` chỉ dành cho kiểm thử cục bộ.
    - Trên gói miễn phí của ngrok, đặt `publicUrl` thành đúng URL ngrok; xác minh chữ ký luôn được thực thi.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` cho phép webhook Twilio có chữ ký không hợp lệ **chỉ** khi `tunnel.provider="ngrok"` và `serve.bind` là loopback (agent cục bộ của ngrok). Chỉ dành cho dev cục bộ.
    - URL gói miễn phí của Ngrok có thể thay đổi hoặc thêm hành vi trang trung gian; nếu `publicUrl` lệch, chữ ký Twilio sẽ thất bại. Production: ưu tiên miền ổn định hoặc Tailscale funnel.

  </Accordion>
  <Accordion title="Giới hạn kết nối streaming">
    - `streaming.preStartTimeoutMs` đóng các socket không bao giờ gửi frame `start` hợp lệ.
    - `streaming.maxPendingConnections` giới hạn tổng số socket trước khởi động chưa xác thực.
    - `streaming.maxPendingConnectionsPerIp` giới hạn số socket trước khởi động chưa xác thực trên mỗi IP nguồn.
    - `streaming.maxConnections` giới hạn tổng số socket luồng media đang mở (pending + active).

  </Accordion>
  <Accordion title="Di trú cấu hình cũ">
    Các cấu hình cũ dùng `provider: "log"`, `twilio.from`, hoặc khóa OpenAI
    `streaming.*` cũ được viết lại bởi `openclaw doctor --fix`.
    Dự phòng runtime hiện vẫn chấp nhận các khóa voice-call cũ, nhưng
    đường dẫn viết lại là `openclaw doctor --fix` và lớp tương thích
    chỉ là tạm thời.

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
mỗi cuộc gọi của nhà mạng nên bắt đầu với ngữ cảnh mới, ví dụ luồng lễ tân,
đặt lịch, IVR, hoặc cầu nối Google Meet nơi cùng một số điện thoại có thể
đại diện cho các cuộc họp khác nhau.

## Cuộc hội thoại giọng nói thời gian thực

`realtime` chọn một nhà cung cấp giọng nói thời gian thực song công toàn phần cho âm thanh
cuộc gọi trực tiếp. Nó tách biệt với `streaming`, vốn chỉ chuyển tiếp âm thanh đến
các nhà cung cấp chép lời thời gian thực.

<Warning>
`realtime.enabled` không thể kết hợp với `streaming.enabled`. Chọn một
chế độ âm thanh cho mỗi cuộc gọi.
</Warning>

Hành vi runtime hiện tại:

- `realtime.enabled` được hỗ trợ cho Twilio Media Streams.
- `realtime.provider` là tùy chọn. Nếu không đặt, Voice Call dùng nhà cung cấp giọng nói thời gian thực đã đăng ký đầu tiên.
- Nhà cung cấp giọng nói thời gian thực được đóng gói kèm: Google Gemini Live (`google`) và OpenAI (`openai`), được đăng ký bởi các plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `realtime.providers.<providerId>`.
- Voice Call mặc định phơi bày công cụ thời gian thực dùng chung `openclaw_agent_consult`. Mô hình thời gian thực có thể gọi công cụ này khi người gọi yêu cầu lập luận sâu hơn, thông tin hiện tại, hoặc các công cụ OpenClaw thông thường.
- `realtime.consultPolicy` có thể thêm hướng dẫn về thời điểm mô hình thời gian thực nên gọi `openclaw_agent_consult`.
- `realtime.agentContext.enabled` mặc định tắt. Khi bật, Voice Call chèn danh tính agent có giới hạn, phần ghi đè system prompt, và capsule tệp workspace đã chọn vào hướng dẫn của nhà cung cấp thời gian thực khi thiết lập phiên.
- `realtime.fastContext.enabled` mặc định tắt. Khi bật, Voice Call trước tiên tìm kiếm bộ nhớ/ngữ cảnh phiên đã lập chỉ mục cho câu hỏi consult và trả về các đoạn trích đó cho mô hình thời gian thực trong vòng `realtime.fastContext.timeoutMs` trước khi dự phòng về agent consult đầy đủ chỉ khi `realtime.fastContext.fallbackToConsult` là true.
- Nếu `realtime.provider` trỏ đến một nhà cung cấp chưa đăng ký, hoặc hoàn toàn không có nhà cung cấp giọng nói thời gian thực nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua media thời gian thực thay vì làm thất bại toàn bộ plugin.
- Khóa phiên consult tái sử dụng phiên cuộc gọi đã lưu khi có, rồi dự phòng về `sessionScope` đã cấu hình (`per-phone` theo mặc định, hoặc `per-call` cho các cuộc gọi cô lập).

### Chính sách công cụ

`realtime.toolPolicy` kiểm soát lần chạy consult:

| Chính sách      | Hành vi                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Phơi bày công cụ consult và giới hạn agent thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, và `memory_get`. |
| `owner`          | Phơi bày công cụ consult và cho phép agent thông thường dùng chính sách công cụ agent bình thường.                                           |
| `none`           | Không phơi bày công cụ consult. `realtime.tools` tùy chỉnh vẫn được chuyển tiếp đến nhà cung cấp thời gian thực.                              |

`realtime.consultPolicy` chỉ kiểm soát hướng dẫn của mô hình thời gian thực:

| Chính sách    | Hướng dẫn                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Giữ prompt mặc định và để nhà cung cấp quyết định khi nào gọi công cụ consult.                  |
| `substantive` | Trả lời trực tiếp phần nối hội thoại đơn giản và consult trước khi nêu sự kiện, bộ nhớ, công cụ, hoặc ngữ cảnh. |
| `always`      | Consult trước mọi câu trả lời có nội dung thực chất.                                            |

### Ngữ cảnh giọng nói của agent

Bật `realtime.agentContext` khi cầu nối giọng nói cần nghe giống như
agent OpenClaw đã cấu hình mà không phải trả chi phí một vòng agent-consult đầy đủ trên
các lượt thông thường. Capsule ngữ cảnh được thêm một lần khi phiên thời gian thực được
tạo, nên không thêm độ trễ theo từng lượt. Các lệnh gọi đến
`openclaw_agent_consult` vẫn chạy agent OpenClaw đầy đủ và nên được dùng
cho công việc công cụ, thông tin hiện tại, tra cứu bộ nhớ, hoặc trạng thái workspace.

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
              includeSystemPrompt: true,
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

### Ví dụ về nhà cung cấp thời gian thực

<Tabs>
  <Tab title="Google Gemini Live">
    Mặc định: khóa API từ `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, hoặc `GOOGLE_GENERATIVE_AI_API_KEY`; mô hình
    `gemini-2.5-flash-native-audio-preview-12-2025`; giọng nói `Kore`.
    `sessionResumption` và `contextWindowCompression` mặc định bật cho các cuộc gọi dài hơn,
    có thể kết nối lại. Dùng `silenceDurationMs`, `startSensitivity`, và
    `endSensitivity` để tinh chỉnh lượt hội thoại nhanh hơn trên âm thanh điện thoại.

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
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
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

Xem [nhà cung cấp Google](/vi/providers/google) và
[nhà cung cấp OpenAI](/vi/providers/openai) để biết các tùy chọn giọng nói thời gian thực
theo từng nhà cung cấp.

## Phiên âm phát trực tuyến

`streaming` chọn một nhà cung cấp phiên âm thời gian thực cho âm thanh cuộc gọi trực tiếp.

Hành vi runtime hiện tại:

- `streaming.provider` là tùy chọn. Nếu chưa đặt, Voice Call dùng nhà cung cấp phiên âm thời gian thực đã đăng ký đầu tiên.
- Các nhà cung cấp phiên âm thời gian thực đi kèm: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), và xAI (`xai`), được đăng ký bởi các Plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `streaming.providers.<providerId>`.
- Sau khi Twilio gửi thông báo `start` cho một luồng đã được chấp nhận, Voice Call đăng ký luồng ngay lập tức, đưa media đầu vào vào hàng đợi qua nhà cung cấp phiên âm trong khi nhà cung cấp kết nối, và chỉ bắt đầu lời chào ban đầu sau khi phiên âm thời gian thực đã sẵn sàng.
- Nếu `streaming.provider` trỏ tới một nhà cung cấp chưa đăng ký, hoặc không có nhà cung cấp nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua phát trực tuyến media thay vì làm hỏng toàn bộ Plugin.

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

Voice Call dùng cấu hình lõi `messages.tts` để phát trực tuyến
lời nói trong cuộc gọi. Bạn có thể ghi đè cấu hình này trong cấu hình Plugin với
**cùng hình dạng** — cấu hình đó được hợp nhất sâu với `messages.tts`.

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
**Giọng nói Microsoft bị bỏ qua đối với cuộc gọi thoại.** Âm thanh điện thoại cần PCM;
transport Microsoft hiện tại không cung cấp đầu ra PCM cho điện thoại.
</Warning>

Ghi chú hành vi:

- Các khóa `tts.<provider>` cũ trong cấu hình Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) được sửa bởi `openclaw doctor --fix`; cấu hình đã commit nên dùng `tts.providers.<provider>`.
- TTS lõi được dùng khi phát trực tuyến media Twilio được bật; nếu không, cuộc gọi sẽ quay về dùng giọng nói gốc của nhà cung cấp.
- Nếu một luồng media Twilio đã hoạt động, Voice Call không quay về dùng TwiML `<Say>`. Nếu TTS điện thoại không khả dụng ở trạng thái đó, yêu cầu phát lại sẽ thất bại thay vì trộn hai đường phát lại.
- Khi TTS điện thoại quay về dùng một nhà cung cấp phụ, Voice Call ghi cảnh báo với chuỗi nhà cung cấp (`from`, `to`, `attempts`) để gỡ lỗi.
- Khi barge-in Twilio hoặc quá trình tháo luồng xóa hàng đợi TTS đang chờ, các yêu cầu phát lại trong hàng đợi sẽ được giải quyết thay vì treo người gọi đang chờ hoàn tất phát lại.

### Ví dụ TTS

<Tabs>
  <Tab title="Core TTS only">
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
  <Tab title="Override to ElevenLabs (calls only)">
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
  <Tab title="OpenAI model override (deep-merge)">
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
`inboundPolicy: "allowlist"` là lớp kiểm tra ID người gọi có độ bảo đảm thấp. Plugin
chuẩn hóa giá trị `From` do nhà cung cấp cung cấp và so sánh giá trị đó với
`allowFrom`. Xác minh Webhook xác thực việc nhà cung cấp phân phối và
tính toàn vẹn của payload, nhưng **không** chứng minh quyền sở hữu số người gọi
PSTN/VoIP. Hãy xem `allowFrom` là lọc ID người gọi, không phải danh tính
người gọi mạnh.
</Warning>

Phản hồi tự động dùng hệ thống agent. Tinh chỉnh bằng `responseModel`,
`responseSystemPrompt`, và `responseTimeoutMs`.

### Định tuyến theo từng số

Dùng `numbers` khi một Plugin Voice Call nhận cuộc gọi cho nhiều số điện thoại
và mỗi số nên hoạt động như một đường dây khác nhau. Ví dụ, một
số có thể dùng trợ lý cá nhân thân mật trong khi số khác dùng một persona
doanh nghiệp, một agent phản hồi khác, và một giọng TTS khác.

Các tuyến được chọn từ số `To` đã quay do nhà cung cấp cung cấp. Khóa phải là
số E.164. Khi một cuộc gọi đến, Voice Call phân giải tuyến khớp một lần,
lưu tuyến đã khớp vào bản ghi cuộc gọi, và tái sử dụng cấu hình hiệu lực đó
cho lời chào, đường dẫn phản hồi tự động cổ điển, đường dẫn tham vấn thời gian thực, và
phát lại TTS. Nếu không có tuyến nào khớp, cấu hình Voice Call toàn cục được dùng.
Cuộc gọi đi không dùng `numbers`; hãy truyền rõ ràng đích cuộc gọi đi, thông điệp, và
phiên khi khởi tạo cuộc gọi.

Ghi đè tuyến hiện hỗ trợ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Giá trị tuyến `tts` được hợp nhất sâu lên trên cấu hình Voice Call `tts` toàn cục, nên
thường bạn chỉ cần ghi đè giọng nói của nhà cung cấp:

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

Đối với phản hồi tự động, Voice Call nối thêm một hợp đồng đầu ra lời nói nghiêm ngặt vào
system prompt:

```text
{"spoken":"..."}
```

Voice Call trích xuất văn bản lời nói một cách phòng vệ:

- Bỏ qua các payload được đánh dấu là nội dung suy luận/lỗi.
- Phân tích JSON trực tiếp, JSON trong khối rào, hoặc khóa `"spoken"` nội tuyến.
- Quay về văn bản thuần và xóa các đoạn mở đầu có khả năng là lập kế hoạch/meta.

Điều này giữ phát lại lời nói tập trung vào văn bản dành cho người gọi và tránh
rò rỉ văn bản lập kế hoạch vào âm thanh.

### Hành vi khởi động cuộc hội thoại

Đối với cuộc gọi `conversation` đi, cách xử lý thông điệp đầu tiên gắn với trạng thái
phát lại trực tiếp:

- Việc xóa hàng đợi barge-in và phản hồi tự động chỉ bị chặn trong khi lời chào ban đầu đang được nói.
- Nếu phát lại ban đầu thất bại, cuộc gọi quay về `listening` và thông điệp ban đầu vẫn được xếp hàng để thử lại.
- Phát lại ban đầu cho phát trực tuyến Twilio bắt đầu khi luồng kết nối mà không có độ trễ bổ sung.
- Barge-in hủy phát lại đang hoạt động và xóa các mục Twilio TTS đã xếp hàng nhưng chưa phát. Các mục đã xóa được giải quyết là đã bỏ qua, nên logic phản hồi tiếp theo có thể tiếp tục mà không chờ âm thanh sẽ không bao giờ phát.
- Cuộc hội thoại thoại thời gian thực dùng lượt mở đầu riêng của luồng thời gian thực. Voice Call **không** đăng bản cập nhật TwiML `<Say>` cũ cho thông điệp ban đầu đó, nên các phiên `<Connect><Stream>` đi vẫn được gắn kết.

### Thời gian gia hạn khi luồng Twilio ngắt kết nối

Khi một luồng media Twilio ngắt kết nối, Voice Call chờ **2000 ms** trước khi
tự động kết thúc cuộc gọi:

- Nếu luồng kết nối lại trong khoảng thời gian đó, tự động kết thúc sẽ bị hủy.
- Nếu không có luồng nào đăng ký lại sau thời gian gia hạn, cuộc gọi sẽ được kết thúc để tránh cuộc gọi hoạt động bị kẹt.

## Bộ dọn cuộc gọi cũ

Dùng `staleCallReaperSeconds` để kết thúc các cuộc gọi không bao giờ nhận được
Webhook kết thúc (ví dụ: các cuộc gọi chế độ thông báo không bao giờ hoàn tất). Giá trị mặc định
là `0` (tắt).

Khoảng giá trị khuyến nghị:

- **Sản xuất:** `120`–`300` giây cho các luồng kiểu thông báo.
- Giữ giá trị này **cao hơn `maxDurationSeconds`** để các lệnh gọi bình thường có thể hoàn tất. Điểm khởi đầu phù hợp là `maxDurationSeconds + 30–60` giây.

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
tái tạo URL công khai để xác minh chữ ký. Các tùy chọn này
kiểm soát những header được chuyển tiếp nào được tin cậy:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Danh sách cho phép các host từ header chuyển tiếp.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Tin cậy header được chuyển tiếp mà không cần danh sách cho phép.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Chỉ tin cậy header được chuyển tiếp khi IP từ xa của yêu cầu khớp với danh sách.
</ParamField>

Các biện pháp bảo vệ bổ sung:

- **Bảo vệ chống phát lại Webhook** được bật cho Twilio và Plivo. Các yêu cầu webhook hợp lệ bị phát lại sẽ được xác nhận nhưng bị bỏ qua đối với tác dụng phụ.
- Các lượt hội thoại Twilio bao gồm một token theo từng lượt trong callback `<Gather>`, nên callback lời nói cũ/bị phát lại không thể đáp ứng một lượt bản chép lời đang chờ mới hơn.
- Các yêu cầu webhook chưa xác thực bị từ chối trước khi đọc body khi thiếu các header chữ ký bắt buộc của nhà cung cấp.
- Webhook voice-call dùng hồ sơ body tiền xác thực dùng chung (64 KB / 5 giây) cộng với giới hạn in-flight theo từng IP trước khi xác minh chữ ký.

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

Khi Gateway đã chạy, các lệnh vận hành `voicecall` sẽ ủy quyền
cho runtime voice-call do Gateway sở hữu để CLI không bind một
máy chủ webhook thứ hai. Nếu không thể kết nối tới Gateway, các lệnh sẽ fallback sang
runtime CLI độc lập.

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ voice-call mặc định.
Dùng `--file <path>` để trỏ tới một log khác và `--last <n>` để giới hạn
phân tích ở N bản ghi cuối cùng (mặc định 200). Kết quả bao gồm p50/p90/p99
cho độ trễ lượt và thời gian chờ nghe.

## Công cụ agent

Tên công cụ: `voice_call`.

| Hành động       | Đối số                                    |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Repo này phát hành tài liệu skill tương ứng tại `skills/voice-call/SKILL.md`.

## RPC Gateway

| Phương thức          | Đối số                                    |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` chỉ hợp lệ với `mode: "conversation"`. Các cuộc gọi chế độ notify
nên dùng `voicecall.dtmf` sau khi cuộc gọi tồn tại nếu cần các chữ số sau khi kết nối.

## Khắc phục sự cố

### Thiết lập không thể công khai webhook

Chạy thiết lập từ cùng môi trường chạy Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Với `twilio`, `telnyx` và `plivo`, `webhook-exposure` phải có trạng thái xanh. Một
`publicUrl` đã cấu hình vẫn sẽ lỗi khi trỏ tới không gian mạng cục bộ hoặc riêng tư,
vì nhà mạng không thể gọi ngược vào các địa chỉ đó. Không dùng
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, hoặc `fd00::/8` làm `publicUrl`.

Các cuộc gọi outbound chế độ notify của Twilio gửi TwiML `<Say>` ban đầu trực tiếp trong
yêu cầu tạo cuộc gọi, nên thông điệp được nói đầu tiên không phụ thuộc vào việc Twilio
fetch TwiML webhook. Webhook công khai vẫn bắt buộc cho callback trạng thái,
cuộc gọi hội thoại, DTMF trước kết nối, luồng realtime và điều khiển cuộc gọi
sau kết nối.

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

### Thông tin xác thực nhà cung cấp bị lỗi

Kiểm tra nhà cung cấp đã chọn và các trường thông tin xác thực bắt buộc:

- Twilio: `twilio.accountSid`, `twilio.authToken` và `fromNumber`, hoặc
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` và `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` và
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` và `fromNumber`.

Thông tin xác thực phải tồn tại trên host Gateway. Chỉnh sửa hồ sơ shell cục bộ
không ảnh hưởng tới Gateway đang chạy cho đến khi nó khởi động lại hoặc tải lại
môi trường.

### Cuộc gọi khởi động nhưng webhook của nhà cung cấp không đến

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
- Proxy chuyển tiếp yêu cầu nhưng loại bỏ hoặc ghi lại header host/proto.
- Firewall hoặc DNS định tuyến hostname công khai tới nơi khác ngoài Gateway.
- Gateway đã được khởi động lại khi chưa bật plugin Voice Call.

Khi một reverse proxy hoặc tunnel nằm phía trước Gateway, đặt
`webhookSecurity.allowedHosts` thành hostname công khai, hoặc dùng
`webhookSecurity.trustedProxyIPs` cho địa chỉ proxy đã biết. Chỉ dùng
`webhookSecurity.trustForwardingHeaders` khi ranh giới proxy nằm dưới
quyền kiểm soát của bạn.

### Xác minh chữ ký không thành công

Chữ ký của nhà cung cấp được kiểm tra dựa trên URL công khai mà OpenClaw tái tạo
từ yêu cầu đến. Nếu chữ ký lỗi:

- Xác nhận URL webhook của nhà cung cấp khớp chính xác với `publicUrl`, bao gồm
  scheme, host và path.
- Với URL ngrok tầng miễn phí, cập nhật `publicUrl` khi hostname tunnel thay đổi.
- Đảm bảo proxy giữ nguyên header host và proto gốc, hoặc cấu hình
  `webhookSecurity.allowedHosts`.
- Không bật `skipSignatureVerification` ngoài kiểm thử cục bộ.

### Google Meet tham gia Twilio không thành công

Google Meet dùng plugin này cho tham gia dial-in Twilio. Trước tiên xác minh Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Sau đó xác minh rõ ràng transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Nếu Voice Call có trạng thái xanh nhưng người tham gia Meet không bao giờ vào, hãy kiểm tra
số dial-in Meet, PIN và `--dtmf-sequence`. Cuộc gọi điện thoại có thể bình thường trong khi
cuộc họp từ chối hoặc bỏ qua một chuỗi DTMF không chính xác.

Google Meet khởi động nhánh điện thoại Twilio thông qua `voicecall.start` với một
chuỗi DTMF trước kết nối. Các chuỗi lấy từ PIN bao gồm
`voiceCall.dtmfDelayMs` của plugin Google Meet dưới dạng các chữ số chờ Twilio đứng đầu. Mặc định là 12 giây
vì prompt dial-in của Meet có thể đến muộn. Voice Call sau đó chuyển hướng trở lại
xử lý realtime trước khi lời chào mở đầu được yêu cầu.

Dùng `openclaw logs --follow` cho trace giai đoạn trực tiếp. Một lần tham gia Twilio Meet
khỏe mạnh ghi log theo thứ tự này:

- Google Meet ủy quyền lượt tham gia Twilio cho Voice Call.
- Voice Call lưu TwiML DTMF trước kết nối.
- TwiML ban đầu của Twilio được tiêu thụ và phục vụ trước xử lý realtime.
- Voice Call phục vụ TwiML realtime cho cuộc gọi Twilio.
- Google Meet yêu cầu lời nói mở đầu bằng `voicecall.speak` sau độ trễ hậu DTMF.

`openclaw voicecall tail` vẫn hiển thị các bản ghi cuộc gọi đã lưu; nó hữu ích cho
trạng thái cuộc gọi và bản chép lời, nhưng không phải mọi chuyển tiếp webhook/realtime đều xuất hiện
ở đó.

### Cuộc gọi realtime không có lời nói

Xác nhận chỉ bật một chế độ âm thanh. `realtime.enabled` và
`streaming.enabled` không thể cùng là true.

Với các cuộc gọi Twilio realtime, cũng xác minh:

- Một plugin nhà cung cấp realtime đã được tải và đăng ký.
- `realtime.provider` chưa đặt hoặc đặt tên một nhà cung cấp đã đăng ký.
- Khóa API của nhà cung cấp có sẵn cho tiến trình Gateway.
- `openclaw logs --follow` hiển thị TwiML realtime đã được phục vụ, bridge realtime
  đã khởi động và lời chào ban đầu đã được xếp hàng.

## Liên quan

- [Chế độ trò chuyện](/vi/nodes/talk)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
