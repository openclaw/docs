---
read_when:
    - Bạn muốn thực hiện một cuộc gọi thoại đi từ OpenClaw
    - Bạn đang cấu hình hoặc phát triển Plugin cuộc gọi thoại
    - Bạn cần thoại thời gian thực hoặc phiên âm trực tuyến qua điện thoại.
sidebarTitle: Voice call
summary: Thực hiện cuộc gọi thoại đi và nhận cuộc gọi thoại đến qua Twilio, Telnyx hoặc Plivo, với tùy chọn thoại thời gian thực và phiên âm trực tuyến.
title: Plugin cuộc gọi thoại
x-i18n:
    generated_at: "2026-07-12T08:13:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Các cuộc gọi thoại cho OpenClaw thông qua Plugin: thông báo gọi đi, hội thoại
nhiều lượt, thoại thời gian thực song công toàn phần, phiên âm trực tuyến và
cuộc gọi đến với chính sách danh sách cho phép.

**Nhà cung cấp:** `mock` (phát triển, không dùng mạng), `plivo` (Voice API + chuyển tiếp XML +
nhập liệu bằng giọng nói GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Plugin Cuộc gọi thoại chạy **bên trong tiến trình Gateway**. Nếu bạn sử dụng
Gateway từ xa, hãy cài đặt và cấu hình Plugin trên máy đang chạy
Gateway, sau đó khởi động lại Gateway để nạp Plugin.
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

    Sử dụng gói không kèm phiên bản để theo thẻ phát hành hiện tại. Chỉ ghim một
    phiên bản chính xác khi bạn cần quy trình cài đặt có thể tái lập. Sau đó,
    khởi động lại Gateway để Plugin được nạp.

  </Step>
  <Step title="Configure provider and webhook">
    Đặt cấu hình trong `plugins.entries.voice-call.config` (xem
    [Cấu hình](#configuration) bên dưới). Tối thiểu cần có: `provider`, thông tin
    xác thực của nhà cung cấp, `fromNumber` và URL Webhook có thể truy cập công khai.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Kiểm tra trạng thái bật Plugin, thông tin xác thực của nhà cung cấp, khả năng
    truy cập Webhook và bảo đảm chỉ một chế độ âm thanh (`streaming` hoặc `realtime`) đang hoạt động.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Theo mặc định, cả hai đều chỉ chạy thử mà không thực hiện thao tác thật. Thêm `--yes` để thực hiện một cuộc gọi
    thông báo ngắn:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Đối với Twilio, Telnyx và Plivo, quá trình thiết lập phải phân giải thành một **URL Webhook công khai**.
Nếu `publicUrl`, URL đường hầm, URL Tailscale hoặc phương án dự phòng của máy chủ
phân giải thành local loopback hoặc không gian mạng riêng, quá trình thiết lập sẽ thất bại thay vì
khởi động một nhà cung cấp không thể nhận Webhook từ nhà mạng.
</Warning>

## Cấu hình

Nếu `enabled: true` nhưng nhà cung cấp đã chọn thiếu thông tin xác thực, quá trình khởi động
Gateway sẽ ghi cảnh báo thiết lập chưa hoàn tất kèm các khóa còn thiếu và bỏ qua
việc khởi động môi trường chạy. Các lệnh, lời gọi RPC và công cụ tác nhân vẫn trả về
chính xác cấu hình còn thiếu khi được sử dụng.

<Note>
Thông tin xác thực cuộc gọi thoại chấp nhận SecretRef. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` và `plugins.entries.voice-call.config.tts.providers.*.apiKey` được phân giải thông qua bề mặt SecretRef tiêu chuẩn; xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
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
            // region: "ie1", // optional: us1 | ie1 | au1; defaults to us1
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
          realtime: { enabled: false /* see Realtime voice conversations */ },
        },
      },
    },
  },
}
```

### Tham chiếu cấu hình

Các khóa cấp cao nhất trong `plugins.entries.voice-call.config` không được trình bày ở trên:

| Khóa                            | Mặc định     | Ghi chú                                                                                              |
| ------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Công tắc bật/tắt chính.                                                                              |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Xem [Cuộc gọi đến](#inbound-calls).                |
| `allowFrom`                     | `[]`         | Danh sách E.164 được phép cho `inboundPolicy: "allowlist"`.                                          |
| `maxDurationSeconds`            | `300`        | Giới hạn cứng về thời lượng mỗi cuộc gọi, được áp dụng bất kể trạng thái đã trả lời hay chưa.         |
| `staleCallReaperSeconds`        | `120`        | Xem [Trình dọn dẹp cuộc gọi cũ](#stale-call-reaper). `0` sẽ vô hiệu hóa tính năng này.                |
| `silenceTimeoutMs`              | `800`        | Phát hiện khoảng lặng cuối lời nói cho luồng cổ điển (không phải thời gian thực).                     |
| `transcriptTimeoutMs`           | `180000`     | Thời gian chờ tối đa cho bản phiên âm của người gọi trước khi từ bỏ một lượt.                         |
| `ringTimeoutMs`                 | `30000`      | Thời gian chờ đổ chuông cho cuộc gọi đi.                                                             |
| `maxConcurrentCalls`            | `1`          | Các cuộc gọi đi vượt quá giới hạn này sẽ bị từ chối.                                                 |
| `outbound.notifyHangupDelaySec` | `3`          | Số giây chờ sau TTS trước khi tự động ngắt máy ở chế độ thông báo.                                   |
| `skipSignatureVerification`     | `false`      | Chỉ dành cho kiểm thử cục bộ; tuyệt đối không bật trong môi trường sản xuất.                          |
| `store`                         | chưa đặt     | Ghi đè đường dẫn nhật ký cuộc gọi mặc định `~/.openclaw/voice-calls`.                                |
| `agentId`                       | `"main"`     | Tác nhân được dùng để tạo phản hồi và lưu trữ phiên.                                                 |
| `responseModel`                 | chưa đặt     | Ghi đè mô hình mặc định cho các phản hồi cổ điển (không phải thời gian thực).                         |
| `responseSystemPrompt`          | được tạo     | Lời nhắc hệ thống tùy chỉnh cho các phản hồi cổ điển.                                                |
| `responseTimeoutMs`             | `30000`      | Thời gian chờ để tạo phản hồi cổ điển (ms).                                                          |

Twilio mặc định sử dụng điểm cuối REST US1. Để xử lý cuộc gọi tại một Khu vực
ngoài Hoa Kỳ được hỗ trợ, hãy đặt `twilio.region` thành `ie1` hoặc `au1` và sử dụng thông tin xác thực từ
Khu vực đó. Xem
[hướng dẫn về REST API ngoài Hoa Kỳ của Twilio](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx và Plivo đều yêu cầu một URL Webhook **có thể truy cập công khai**.
    - `mock` là nhà cung cấp phát triển cục bộ (không thực hiện lời gọi mạng).
    - Telnyx yêu cầu `telnyx.publicKey` (hoặc `TELNYX_PUBLIC_KEY`), trừ khi `skipSignatureVerification` là true.
    - `skipSignatureVerification` chỉ dành cho kiểm thử cục bộ.
    - Ở gói miễn phí của ngrok, hãy đặt `publicUrl` thành URL ngrok chính xác; việc xác minh chữ ký luôn được thực thi.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` cho phép Webhook Twilio có chữ ký không hợp lệ **chỉ** khi `tunnel.provider="ngrok"` và `serve.bind` là local loopback (tác nhân ngrok cục bộ). Chỉ dành cho phát triển cục bộ.
    - URL gói miễn phí của ngrok có thể thay đổi hoặc thêm trang trung gian; nếu `publicUrl` bị thay đổi, chữ ký Twilio sẽ không hợp lệ. Với môi trường sản xuất: ưu tiên miền ổn định hoặc đường hầm Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` (mặc định `5000`) đóng các socket không bao giờ gửi khung `start` hợp lệ.
    - `streaming.maxPendingConnections` (mặc định `32`) giới hạn tổng số socket trước khi bắt đầu chưa được xác thực.
    - `streaming.maxPendingConnectionsPerIp` (mặc định `4`) giới hạn số socket trước khi bắt đầu chưa được xác thực trên mỗi IP nguồn.
    - `streaming.maxConnections` (mặc định `128`) giới hạn tất cả socket luồng phương tiện đang mở (đang chờ + đang hoạt động).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Quá trình phân tích cú pháp cấu hình tự động chuẩn hóa các khóa cũ này và ghi
    cảnh báo nêu rõ đường dẫn thay thế; lớp tương thích sẽ bị loại bỏ trong một bản
    phát hành tương lai (`2026.6.0`), vì vậy hãy chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu
    theo dạng chuẩn:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` đã bị loại bỏ (ngữ cảnh thời gian thực hiện sử dụng lời nhắc tác nhân được tạo)

  </Accordion>
</AccordionGroup>

## Phạm vi phiên

Theo mặc định, Cuộc gọi thoại sử dụng `sessionScope: "per-phone"` để các cuộc gọi lặp lại từ
cùng một người gọi duy trì bộ nhớ hội thoại. Đặt `sessionScope: "per-call"` khi
mỗi cuộc gọi của nhà mạng cần bắt đầu bằng ngữ cảnh mới, chẳng hạn như các luồng lễ tân,
đặt chỗ, IVR hoặc cầu nối Google Meet, nơi cùng một số điện thoại có thể
đại diện cho các cuộc họp khác nhau.

Cuộc gọi thoại lưu các khóa phiên được tạo trong không gian tên của tác nhân đã cấu hình
(`agent:<agentId>:voice:*`). Các khóa tích hợp tường minh thô được phân giải vào cùng
không gian tên: một khóa chuẩn `agent:<configuredAgentId>:*` giữ nguyên
chủ sở hữu đó và tuân theo bí danh phạm vi toàn cục/`session.mainKey` của lõi; đầu vào
`agent:*` ngoại lai hoặc không đúng định dạng được đặt phạm vi như một khóa bất định dưới tác nhân
đã cấu hình; `global` và `unknown` vẫn là các giá trị canh gác toàn cục.

## Hội thoại thoại thời gian thực

`realtime` chọn một nhà cung cấp thoại thời gian thực song công toàn phần cho âm thanh cuộc gọi trực tiếp.
Tùy chọn này tách biệt với `streaming`, vốn chỉ chuyển tiếp âm thanh đến các nhà cung cấp
phiên âm thời gian thực.

<Warning>
Không thể kết hợp `realtime.enabled` với `streaming.enabled`. Chỉ chọn một
chế độ âm thanh cho mỗi cuộc gọi.
</Warning>

Hành vi hiện tại của môi trường chạy:

- `realtime.enabled` được hỗ trợ cho Twilio và Telnyx.
- `realtime.provider` là tùy chọn. Nếu không được đặt, Cuộc gọi thoại sẽ sử dụng nhà cung cấp thoại thời gian thực được đăng ký đầu tiên.
- Các nhà cung cấp thoại thời gian thực đi kèm: Google Gemini Live (`google`) và OpenAI (`openai`), được đăng ký bởi các Plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `realtime.providers.<providerId>`.
- Theo mặc định, Cuộc gọi thoại cung cấp công cụ thời gian thực dùng chung `openclaw_agent_consult`. Mô hình thời gian thực có thể gọi công cụ này khi người gọi yêu cầu suy luận sâu hơn, thông tin hiện tại hoặc các công cụ OpenClaw thông thường.
- `realtime.consultPolicy` có thể tùy chọn bổ sung hướng dẫn về thời điểm mô hình thời gian thực nên gọi `openclaw_agent_consult`.
- `realtime.agentContext.enabled` mặc định tắt. Khi được bật, Cuộc gọi thoại sẽ chèn danh tính tác nhân có giới hạn và một gói ngữ cảnh gồm các tệp không gian làm việc đã chọn vào chỉ dẫn dành cho nhà cung cấp thời gian thực khi thiết lập phiên.
- `realtime.fastContext.enabled` mặc định tắt. Khi được bật, trước tiên Cuộc gọi thoại sẽ tìm kiếm ngữ cảnh bộ nhớ/phiên đã được lập chỉ mục cho câu hỏi tham vấn và trả các đoạn trích đó về mô hình thời gian thực trong khoảng `realtime.fastContext.timeoutMs`, sau đó chỉ chuyển sang tác nhân tham vấn đầy đủ nếu `realtime.fastContext.fallbackToConsult` là true.
- Nếu `realtime.provider` trỏ đến một nhà cung cấp chưa được đăng ký hoặc hoàn toàn không có nhà cung cấp thoại thời gian thực nào được đăng ký, Cuộc gọi thoại sẽ ghi cảnh báo và bỏ qua phương tiện thời gian thực thay vì làm hỏng toàn bộ Plugin.
- `inboundPolicy` không được là `"disabled"` khi `realtime.enabled` là true; `validateProviderConfig` sẽ từ chối tổ hợp đó.
- Khóa phiên tham vấn sẽ tái sử dụng phiên cuộc gọi đã lưu nếu có, sau đó chuyển sang `sessionScope` đã cấu hình (`per-phone` theo mặc định hoặc `per-call` cho các cuộc gọi độc lập).

### Chính sách công cụ

`realtime.toolPolicy` kiểm soát lượt chạy tham vấn:

| Chính sách       | Hành vi                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `safe-read-only` | Cung cấp công cụ tham vấn và giới hạn tác nhân thông thường ở các công cụ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` và `memory_get`.                  |
| `owner`          | Cung cấp công cụ tham vấn và cho phép tác nhân thông thường sử dụng chính sách công cụ tác nhân thông thường.                                                             |
| `none`           | Không cung cấp công cụ tham vấn. Các `realtime.tools` tùy chỉnh vẫn được chuyển tiếp đến nhà cung cấp thời gian thực.                                                     |

`realtime.consultPolicy` chỉ kiểm soát chỉ dẫn dành cho mô hình thời gian thực:

| Chính sách    | Hướng dẫn                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `auto`        | Giữ nguyên lời nhắc mặc định và để nhà cung cấp quyết định thời điểm gọi công cụ tham vấn.                               |
| `substantive` | Trả lời trực tiếp các câu nối hội thoại đơn giản và tham vấn trước khi xử lý dữ kiện, bộ nhớ, công cụ hoặc ngữ cảnh.      |
| `always`      | Tham vấn trước mọi câu trả lời có nội dung thực chất.                                                                    |

### Ngữ cảnh thoại của tác nhân

Bật `realtime.agentContext` khi cầu nối thoại cần có phong cách giống tác nhân
OpenClaw đã cấu hình mà không phải chịu chi phí cho một lượt khứ hồi tham vấn
tác nhân đầy đủ trong các lượt thông thường. Gói ngữ cảnh được thêm một lần khi
phiên thời gian thực được tạo, vì vậy không làm tăng độ trễ theo từng lượt. Các
lệnh gọi `openclaw_agent_consult` vẫn chạy tác nhân OpenClaw đầy đủ và nên được
dùng cho tác vụ công cụ, thông tin hiện tại, tra cứu bộ nhớ hoặc trạng thái
không gian làm việc.

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

### Ví dụ về nhà cung cấp thời gian thực

<Tabs>
  <Tab title="Google Gemini Live">
    Giá trị mặc định: khóa API từ `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    hoặc `GOOGLE_API_KEY`; mô hình `gemini-3.1-flash-live-preview`;
    giọng nói `Kore`. `sessionResumption` và `contextWindowCompression` mặc định được bật
    cho các cuộc gọi dài hơn và có thể kết nối lại. Sử dụng `silenceDurationMs`,
    `startSensitivity` và `endSensitivity` để tinh chỉnh việc luân phiên lượt nói nhanh hơn
    trên âm thanh điện thoại.

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
                    model: "gemini-3.1-flash-live-preview",
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

Xem [nhà cung cấp Google](/vi/providers/google) và
[nhà cung cấp OpenAI](/vi/providers/openai) để biết các tùy chọn thoại thời gian
thực dành riêng cho từng nhà cung cấp.

## Phiên âm trực tuyến

`streaming` chọn một nhà cung cấp phiên âm thời gian thực cho âm thanh cuộc gọi trực tiếp.

Hành vi thời gian chạy hiện tại:

- `streaming.provider` là tùy chọn. Nếu không được đặt, Cuộc gọi thoại sẽ sử dụng nhà cung cấp phiên âm thời gian thực được đăng ký đầu tiên.
- Các nhà cung cấp phiên âm thời gian thực đi kèm: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) và xAI (`xai`), được đăng ký bởi các Plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `streaming.providers.<providerId>`.
- Sau khi Twilio gửi thông báo `start` cho luồng đã được chấp nhận, Cuộc gọi thoại sẽ đăng ký luồng ngay lập tức, đưa phương tiện đầu vào vào hàng đợi qua nhà cung cấp phiên âm trong khi nhà cung cấp kết nối và chỉ bắt đầu lời chào ban đầu sau khi phiên âm thời gian thực sẵn sàng.
- Nếu `streaming.provider` trỏ đến một nhà cung cấp chưa được đăng ký hoặc không có nhà cung cấp nào được đăng ký, Cuộc gọi thoại sẽ ghi cảnh báo và bỏ qua truyền phát phương tiện thay vì làm hỏng toàn bộ Plugin.

### Ví dụ về nhà cung cấp truyền phát

<Tabs>
  <Tab title="OpenAI">
    Giá trị mặc định: khóa API `streaming.providers.openai.apiKey` hoặc
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
    Giá trị mặc định: khóa API `streaming.providers.xai.apiKey` hoặc `XAI_API_KEY` (sẽ
    chuyển sang hồ sơ xác thực OAuth của xAI nếu cả hai đều không được đặt); điểm cuối
    `wss://api.x.ai/v1/stt`; mã hóa `mulaw`; tần số lấy mẫu `8000`;
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

Cuộc gọi thoại sử dụng cấu hình lõi `messages.tts` để truyền phát giọng nói
trong các cuộc gọi. Bạn có thể ghi đè cấu hình này trong cấu hình Plugin bằng
**cùng một cấu trúc** — cấu hình đó sẽ được hợp nhất sâu với `messages.tts`.

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
**Giọng nói Microsoft bị bỏ qua đối với cuộc gọi thoại.** Tổng hợp giọng nói
điện thoại yêu cầu một nhà cung cấp triển khai đầu ra dành cho điện thoại; nhà
cung cấp giọng nói Microsoft không triển khai đầu ra này, vì vậy nhà cung cấp
đó bị bỏ qua đối với cuộc gọi và hệ thống sẽ thử các nhà cung cấp khác trong
chuỗi dự phòng.
</Warning>

Ghi chú về hành vi:

- Các khóa `tts.<provider>` cũ trong cấu hình Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) được sửa bởi `openclaw doctor --fix`; cấu hình đã cam kết nên sử dụng `tts.providers.<provider>`.
- TTS lõi được sử dụng khi truyền phát phương tiện Twilio được bật; nếu không, cuộc gọi sẽ chuyển sang giọng nói gốc của nhà cung cấp.
- Nếu một luồng phương tiện Twilio đã hoạt động, Cuộc gọi thoại sẽ không chuyển sang TwiML `<Say>`. Nếu TTS điện thoại không khả dụng trong trạng thái đó, yêu cầu phát lại sẽ thất bại thay vì trộn lẫn hai đường phát lại.
- Khi TTS điện thoại chuyển sang nhà cung cấp thứ cấp, Cuộc gọi thoại sẽ ghi cảnh báo kèm chuỗi nhà cung cấp (`from`, `to`, `attempts`) để gỡ lỗi.
- Khi thao tác ngắt lời hoặc việc đóng luồng của Twilio xóa hàng đợi TTS đang chờ, các yêu cầu phát lại trong hàng đợi sẽ được hoàn tất thay vì khiến bên gọi chờ vô thời hạn để phát lại hoàn tất.

### Ví dụ về TTS

<Tabs>
  <Tab title="Chỉ TTS lõi">
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
  <Tab title="Ghi đè bằng ElevenLabs (chỉ cuộc gọi)">
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

Chính sách cuộc gọi đến mặc định là `disabled`. Để bật cuộc gọi đến, hãy đặt:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` là cơ chế sàng lọc ID người gọi có mức đảm bảo thấp. Plugin
chuẩn hóa giá trị `From` do nhà cung cấp cung cấp rồi so sánh với `allowFrom`.
Việc xác minh Webhook xác thực hoạt động gửi từ nhà cung cấp và tính toàn vẹn của tải dữ liệu,
nhưng **không** chứng minh quyền sở hữu số người gọi PSTN/VoIP. Hãy coi
`allowFrom` là bộ lọc ID người gọi, không phải danh tính người gọi có độ tin cậy cao.
</Warning>

Phản hồi tự động sử dụng hệ thống tác tử. Điều chỉnh bằng `responseModel`,
`responseSystemPrompt` và `responseTimeoutMs`.

### Định tuyến theo từng số

Sử dụng `numbers` khi một Plugin Voice Call nhận cuộc gọi cho nhiều số điện thoại
và mỗi số cần hoạt động như một đường dây riêng. Ví dụ,
một số có thể sử dụng trợ lý cá nhân với phong cách thân thiện, còn số khác sử dụng một
hình tượng doanh nghiệp, một tác tử phản hồi khác và một giọng TTS khác.

Tuyến được chọn từ số `To` đã gọi do nhà cung cấp cung cấp. Các khóa phải
là số E.164. Khi có cuộc gọi đến, Voice Call phân giải tuyến phù hợp
một lần, lưu tuyến đã khớp vào bản ghi cuộc gọi và tái sử dụng
cấu hình hiệu lực đó cho lời chào, luồng phản hồi tự động cổ điển, luồng
tư vấn thời gian thực và phát lại TTS. Nếu không có tuyến nào khớp, cấu hình
Voice Call toàn cục sẽ được sử dụng. Cuộc gọi đi không sử dụng `numbers`; hãy truyền rõ
đích gọi đi, thông điệp và phiên khi bắt đầu cuộc gọi.

Các giá trị ghi đè tuyến hiện được hỗ trợ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Giá trị tuyến `tts` được hợp nhất sâu lên trên cấu hình `tts` Voice Call toàn cục, vì vậy
thông thường bạn chỉ cần ghi đè giọng của nhà cung cấp:

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

### Hợp đồng đầu ra lời nói

Đối với phản hồi tự động, Voice Call nối thêm một hợp đồng đầu ra lời nói nghiêm ngặt vào
lời nhắc hệ thống, yêu cầu phản hồi JSON `{"spoken":"..."}`. Voice Call
trích xuất văn bản lời nói theo cách phòng vệ:

- Bỏ qua tải dữ liệu được đánh dấu là nội dung lập luận/lỗi.
- Phân tích JSON trực tiếp, JSON có hàng rào mã hoặc khóa `"spoken"` nội tuyến.
- Chuyển sang văn bản thuần túy khi cần và loại bỏ các đoạn mở đầu có khả năng là nội dung lập kế hoạch/siêu thông tin.

Điều này giúp phần phát lời nói tập trung vào văn bản dành cho người gọi và tránh làm lộ
nội dung lập kế hoạch vào âm thanh.

### Hành vi khởi đầu cuộc hội thoại

Đối với cuộc gọi đi ở chế độ `conversation`, việc xử lý thông điệp đầu tiên gắn với trạng thái
phát trực tiếp:

- Việc xóa hàng đợi khi người gọi ngắt lời và phản hồi tự động chỉ bị tạm ngưng trong lúc lời chào ban đầu đang được phát.
- Nếu phát ban đầu thất bại, cuộc gọi trở về trạng thái `listening` và thông điệp ban đầu vẫn nằm trong hàng đợi để thử lại.
- Việc phát ban đầu cho luồng Twilio bắt đầu khi luồng kết nối mà không có độ trễ bổ sung.
- Khi người gọi ngắt lời, quá trình phát đang hoạt động sẽ bị hủy và các mục TTS Twilio đang xếp hàng nhưng chưa phát sẽ bị xóa. Các mục đã xóa được phân giải là bị bỏ qua, nhờ đó logic phản hồi tiếp theo có thể tiếp tục mà không phải chờ âm thanh sẽ không bao giờ được phát.
- Các cuộc hội thoại thoại thời gian thực sử dụng lượt mở đầu riêng của luồng thời gian thực. Voice Call **không** gửi bản cập nhật TwiML `<Say>` kiểu cũ cho thông điệp ban đầu đó, vì vậy các phiên `<Connect><Stream>` gọi đi vẫn được duy trì kết nối.

### Khoảng đệm khi luồng Twilio ngắt kết nối

Khi một luồng phương tiện Twilio ngắt kết nối, Voice Call chờ **2000 ms** trước khi
tự động kết thúc cuộc gọi:

- Nếu luồng kết nối lại trong khoảng thời gian đó, việc tự động kết thúc sẽ bị hủy.
- Nếu không có luồng nào đăng ký lại sau khoảng đệm, cuộc gọi sẽ kết thúc để tránh các cuộc gọi đang hoạt động bị treo.

## Bộ thu hồi cuộc gọi cũ

Sử dụng `staleCallReaperSeconds` (mặc định **120**) để kết thúc các cuộc gọi không bao giờ
được trả lời và không bao giờ đạt đến trạng thái hội thoại trực tiếp, ví dụ các cuộc gọi ở chế độ
thông báo mà nhà cung cấp không bao giờ gửi Webhook kết thúc. Đặt thành `0` để
tắt.

Bộ thu hồi chạy mỗi 30 giây và chỉ kết thúc các cuộc gọi không có dấu thời gian
`answeredAt`, đồng thời chưa ở trạng thái kết thúc hoặc trực tiếp
(`speaking`/`listening`), vì vậy các cuộc hội thoại đã được trả lời sẽ không bao giờ bị bộ hẹn giờ này
thu hồi; `maxDurationSeconds` (mặc định 300) là giới hạn riêng để
kết thúc các cuộc gọi đã được trả lời nhưng kéo dài quá lâu.

Đối với các luồng kiểu thông báo mà nhà mạng có thể chậm gửi Webhook
đổ chuông/trả lời, hãy tăng `staleCallReaperSeconds` cao hơn giá trị mặc định để các cuộc gọi
chậm nhưng bình thường không bị thu hồi sớm; `120`-`300` giây là khoảng hợp lý
cho môi trường sản xuất.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Bảo mật Webhook

Khi một proxy hoặc đường hầm nằm phía trước Gateway, Plugin sẽ tái tạo
URL công khai để xác minh chữ ký. Các tùy chọn này kiểm soát những
tiêu đề chuyển tiếp nào được tin cậy:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Danh sách cho phép các máy chủ từ tiêu đề chuyển tiếp.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Tin cậy tiêu đề chuyển tiếp mà không cần danh sách cho phép.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Chỉ tin cậy tiêu đề chuyển tiếp khi IP từ xa của yêu cầu khớp với danh sách.
</ParamField>

Các biện pháp bảo vệ bổ sung:

- Tính năng **chống phát lại** Webhook được bật cho Twilio, Telnyx và Plivo. Các yêu cầu Webhook hợp lệ bị phát lại sẽ được xác nhận nhưng bỏ qua mọi hiệu ứng phụ.
- Các lượt hội thoại Twilio bao gồm một mã thông báo cho từng lượt trong lệnh gọi lại `<Gather>`, vì vậy các lệnh gọi lại lời nói cũ/bị phát lại không thể đáp ứng một lượt bản chép lời mới hơn đang chờ.
- Các yêu cầu Webhook chưa được xác thực sẽ bị từ chối trước khi đọc phần thân nếu thiếu các tiêu đề chữ ký bắt buộc của nhà cung cấp.
- Webhook voice-call sử dụng hồ sơ đọc phần thân trước xác thực dùng chung (phần thân tối đa 64 KB, thời gian chờ đọc 5 giây), cộng với giới hạn yêu cầu đang xử lý theo từng khóa (mặc định 8 yêu cầu đồng thời cho mỗi khóa) trước khi xác minh chữ ký.

Ví dụ với máy chủ công khai ổn định:

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

Khi Gateway đang chạy, các lệnh vận hành `voicecall`
ủy quyền cho thời gian chạy voice-call do Gateway sở hữu để CLI không liên kết với
một máy chủ Webhook thứ hai. Nếu không thể kết nối đến Gateway, các lệnh sẽ chuyển sang
thời gian chạy CLI độc lập.

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ voice-call mặc định. Sử dụng
`--file <path>` để trỏ đến một nhật ký khác và `--last <n>` để giới hạn
phân tích ở N bản ghi cuối cùng (mặc định 200). Đầu ra bao gồm giá trị tối thiểu/tối đa/trung bình,
p50 và p95 cho độ trễ lượt và thời gian chờ nghe.

## Công cụ tác tử

Tên công cụ: `voice_call`.

| Hành động        | Đối số                                     |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin voice-call đi kèm một Skills tương ứng cho tác tử.

## RPC Gateway

| Phương thức                  | Đối số                                                           | Ghi chú                                                                                      |
| --------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Chuyển sang cấu hình `toNumber` khi bỏ qua `to`.                                              |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Giống `initiate` nhưng cũng chấp nhận `dtmfSequence` trước khi kết nối.                        |
| `voicecall.continue`        | `callId`, `message`                                              | Chặn cho đến khi lượt được phân giải; trả về bản chép lời.                                    |
| `voicecall.continue.start`  | `callId`, `message`                                              | Biến thể bất đồng bộ: trả về ngay một `operationId`.                                          |
| `voicecall.continue.result` | `operationId`                                                    | Thăm dò thao tác `voicecall.continue.start` đang chờ để lấy kết quả.                           |
| `voicecall.speak`           | `callId`, `message`                                              | Phát lời nói mà không chờ; sử dụng cầu nối thời gian thực khi `realtime.enabled`.              |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                                              |
| `voicecall.end`             | `callId`                                                         |                                                                                              |
| `voicecall.status`          | `callId?`                                                        | Bỏ qua `callId` để liệt kê tất cả cuộc gọi đang hoạt động.                                    |

`dtmfSequence` chỉ hợp lệ với `mode: "conversation"`; các cuộc gọi ở chế độ thông báo
nên sử dụng `voicecall.dtmf` sau khi cuộc gọi đã tồn tại nếu cần gửi các chữ số
sau khi kết nối.

## Khắc phục sự cố

### Thiết lập không thể công khai Webhook

Chạy thiết lập từ cùng môi trường chạy Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Đối với `twilio`, `telnyx` và `plivo`, `webhook-exposure` phải ở trạng thái xanh. Một
`publicUrl` đã cấu hình vẫn không hợp lệ khi trỏ đến không gian mạng cục bộ hoặc riêng tư,
vì nhà mạng không thể gọi lại vào các địa chỉ đó.
Không sử dụng `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` hoặc các dải NAT cấp nhà mạng
khác làm `publicUrl`.

Các cuộc gọi đi Twilio ở chế độ thông báo gửi TwiML `<Say>` ban đầu trực tiếp
trong yêu cầu tạo cuộc gọi, vì vậy thông điệp lời nói đầu tiên không phụ thuộc vào
việc Twilio tìm nạp TwiML từ Webhook. Webhook công khai vẫn bắt buộc cho các lệnh gọi lại
trạng thái, cuộc gọi hội thoại, DTMF trước kết nối, luồng thời gian thực và
điều khiển cuộc gọi sau kết nối.

Sử dụng một đường dẫn công khai:

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

`voicecall smoke` là một lần chạy thử, trừ khi bạn truyền `--yes`.

### Thông tin xác thực của nhà cung cấp không hợp lệ

Kiểm tra nhà cung cấp đã chọn và các trường thông tin xác thực bắt buộc:

- Twilio: `twilio.accountSid`, `twilio.authToken` và `fromNumber`, hoặc
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` và `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` và
  `fromNumber`, hoặc `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` và
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` và `fromNumber`, hoặc
  `PLIVO_AUTH_ID` và `PLIVO_AUTH_TOKEN`.

Thông tin xác thực phải tồn tại trên máy chủ Gateway. Việc chỉnh sửa hồ sơ shell cục bộ
không ảnh hưởng đến Gateway đang chạy cho đến khi Gateway khởi động lại hoặc tải lại
môi trường.

### Cuộc gọi bắt đầu nhưng Webhook của nhà cung cấp không đến

Xác nhận bảng điều khiển của nhà cung cấp trỏ đến chính xác URL Webhook công khai:

```text
https://voice.example.com/voice/webhook
```

Sau đó kiểm tra trạng thái thời gian chạy:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Các nguyên nhân thường gặp:

- `publicUrl` trỏ đến đường dẫn khác với `serve.path`.
- URL đường hầm đã thay đổi sau khi Gateway khởi động.
- Proxy chuyển tiếp yêu cầu nhưng loại bỏ hoặc ghi lại các tiêu đề máy chủ/giao thức.
- Tường lửa hoặc DNS định tuyến tên máy chủ công khai đến nơi khác thay vì Gateway.
- Gateway đã được khởi động lại mà không bật Plugin Voice Call.

Khi có proxy ngược hoặc đường hầm phía trước Gateway, hãy đặt
`webhookSecurity.allowedHosts` thành tên máy chủ công khai, hoặc dùng
`webhookSecurity.trustedProxyIPs` cho địa chỉ proxy đã biết. Chỉ dùng
`webhookSecurity.trustForwardingHeaders` khi ranh giới proxy
nằm dưới sự kiểm soát của bạn.

### Xác minh chữ ký thất bại

Chữ ký của nhà cung cấp được kiểm tra dựa trên URL công khai mà OpenClaw dựng lại
từ yêu cầu đến. Nếu xác minh chữ ký thất bại:

- Xác nhận URL Webhook của nhà cung cấp khớp chính xác với `publicUrl`, bao gồm giao thức, máy chủ và đường dẫn.
- Đối với URL ngrok gói miễn phí, hãy cập nhật `publicUrl` khi tên máy chủ của đường hầm thay đổi.
- Đảm bảo proxy giữ nguyên các tiêu đề máy chủ và giao thức ban đầu, hoặc cấu hình `webhookSecurity.allowedHosts`.
- Không bật `skipSignatureVerification` ngoài môi trường kiểm thử cục bộ.

### Tham gia Google Meet qua Twilio thất bại

Google Meet dùng Plugin này để tham gia bằng cách quay số qua Twilio. Trước tiên, hãy xác minh Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Sau đó xác minh rõ ràng phương thức truyền tải Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Nếu Voice Call hoạt động bình thường nhưng người tham gia Meet không bao giờ vào được, hãy kiểm tra số
quay vào Meet, mã PIN và `--dtmf-sequence`. Cuộc gọi điện thoại có thể hoạt động bình thường
trong khi cuộc họp từ chối hoặc bỏ qua chuỗi DTMF không chính xác.

Google Meet khởi động chặng điện thoại Twilio thông qua `voicecall.start` với
chuỗi DTMF trước khi kết nối. Các chuỗi được tạo từ mã PIN bao gồm
`voiceCall.dtmfDelayMs` của Plugin Google Meet (mặc định **12000 ms**) dưới dạng các chữ số chờ
Twilio ở đầu, vì lời nhắc quay số vào Meet có thể xuất hiện muộn. Sau đó, Voice Call
chuyển hướng trở lại xử lý thời gian thực trước khi yêu cầu lời chào mở đầu.

Dùng `openclaw logs --follow` để theo dõi trực tiếp các giai đoạn. Một lần tham gia Meet qua Twilio
thành công sẽ ghi nhật ký theo thứ tự sau:

- Google Meet ủy quyền việc tham gia qua Twilio cho Voice Call.
- Voice Call lưu TwiML DTMF trước khi kết nối.
- TwiML ban đầu của Twilio được xử lý và phân phối trước khi xử lý thời gian thực.
- Voice Call phân phối TwiML thời gian thực cho cuộc gọi Twilio.
- Google Meet yêu cầu phát lời giới thiệu bằng `voicecall.speak` sau khoảng trễ hậu DTMF.

`openclaw voicecall tail` vẫn hiển thị các bản ghi cuộc gọi được lưu trữ; hữu ích để xem
trạng thái cuộc gọi và bản chép lời, nhưng không phải mọi chuyển đổi Webhook/thời gian thực
đều xuất hiện ở đó.

### Cuộc gọi thời gian thực không có tiếng nói

Xác nhận chỉ bật một chế độ âm thanh: `realtime.enabled` và
`streaming.enabled` không thể cùng có giá trị true.

Đối với cuộc gọi Twilio/Telnyx thời gian thực, cũng cần xác minh:

- Một Plugin nhà cung cấp thời gian thực đã được tải và đăng ký.
- `realtime.provider` chưa được đặt hoặc chỉ định một nhà cung cấp đã đăng ký.
- Khóa API của nhà cung cấp khả dụng cho tiến trình Gateway.
- `openclaw logs --follow` cho thấy TwiML thời gian thực đã được phân phối, cầu nối thời gian thực đã khởi động và lời chào ban đầu đã được đưa vào hàng đợi.

## Liên quan

- [Chế độ trò chuyện](/vi/nodes/talk)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
