---
read_when:
    - Bạn muốn thực hiện một cuộc gọi thoại đi từ OpenClaw
    - Bạn đang cấu hình hoặc phát triển plugin cuộc gọi thoại
    - Bạn cần giọng nói theo thời gian thực hoặc phiên âm trực tuyến qua điện thoại.
sidebarTitle: Voice call
summary: Thực hiện cuộc gọi thoại đi và nhận cuộc gọi đến qua Twilio, Telnyx hoặc Plivo, với tùy chọn thoại thời gian thực và phiên âm trực tuyến
title: Plugin cuộc gọi thoại
x-i18n:
    generated_at: "2026-07-19T05:55:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ebadf26f53314f77154396b57323dcf1330c39e3bf5296630e4c11cabf42c209
    source_path: plugins/voice-call.md
    workflow: 16
---

Cuộc gọi thoại cho OpenClaw thông qua một plugin: thông báo gọi đi, hội thoại
nhiều lượt, thoại thời gian thực song công toàn phần, phiên âm trực tuyến và
cuộc gọi đến với các chính sách danh sách cho phép.

**Nhà cung cấp:** `mock` (phát triển, không dùng mạng), `plivo` (Voice API + chuyển tiếp XML +
nhận dạng giọng nói GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Plugin Voice Call chạy **bên trong tiến trình Gateway**. Nếu sử dụng
Gateway từ xa, hãy cài đặt và cấu hình plugin trên máy chạy
Gateway, sau đó khởi động lại Gateway để tải plugin.
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

    Sử dụng gói không kèm phiên bản để theo thẻ phát hành hiện tại. Chỉ ghim một
    phiên bản chính xác khi cần bản cài đặt có thể tái lập. Sau đó, hãy khởi động lại Gateway
    để plugin được tải.

  </Step>
  <Step title="Cấu hình nhà cung cấp và webhook">
    Đặt cấu hình trong `plugins.entries.voice-call.config` (xem
    [Cấu hình](#configuration) bên dưới). Tối thiểu gồm: `provider`, thông tin xác thực
    của nhà cung cấp, `fromNumber` và URL webhook có thể truy cập công khai.
  </Step>
  <Step title="Xác minh thiết lập">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Kiểm tra việc bật plugin, thông tin xác thực của nhà cung cấp, khả năng truy cập webhook và
    bảo đảm chỉ một chế độ âm thanh (`streaming` hoặc `realtime`) đang hoạt động.

  </Step>
  <Step title="Kiểm thử nhanh">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Theo mặc định, cả hai đều là lần chạy thử không thực thi. Thêm `--yes` để thực hiện một
    cuộc gọi thông báo ngắn:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Đối với Twilio, Telnyx và Plivo, quá trình thiết lập phải phân giải thành một **URL webhook công khai**.
Nếu `publicUrl`, URL đường hầm, URL Tailscale hoặc phương án dự phòng phục vụ
phân giải thành địa chỉ lặp hoặc không gian mạng riêng, quá trình thiết lập sẽ thất bại thay vì
khởi động một nhà cung cấp không thể nhận webhook từ nhà mạng.
</Warning>

## Cấu hình

Nếu `enabled: true` nhưng nhà cung cấp đã chọn thiếu thông tin xác thực, khi Gateway
khởi động, nhật ký sẽ ghi cảnh báo thiết lập chưa hoàn tất kèm các khóa bị thiếu và bỏ qua
việc khởi động môi trường chạy. Khi được sử dụng, các lệnh, lệnh gọi RPC và công cụ tác nhân vẫn trả về
chính xác cấu hình còn thiếu.

<Note>
Thông tin xác thực cuộc gọi thoại chấp nhận SecretRef. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` và `plugins.entries.voice-call.config.tts.providers.*.apiKey` được phân giải qua bề mặt SecretRef tiêu chuẩn; xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // hoặc "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // hoặc TWILIO_FROM_NUMBER cho Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // theo số điện thoại | theo cuộc gọi
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, tôi có thể giúp gì cho bạn?",
              responseSystemPrompt: "Bạn là chuyên gia ngắn gọn về thẻ bóng chày.",
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
            // khu vực: "ie1", // tùy chọn: us1 | ie1 | au1; mặc định là us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Khóa công khai webhook Telnyx từ Mission Control Portal
            // (Base64; cũng có thể đặt qua TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Máy chủ webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Bảo mật webhook (khuyến nghị cho đường hầm/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Công khai khả năng truy cập (chọn một)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // thông báo | hội thoại
          },

          streaming: { enabled: true /* Chỉ Twilio; xem Phiên âm trực tuyến */ },
          realtime: { enabled: false /* xem Hội thoại thoại thời gian thực */ },
        },
      },
    },
  },
}
```

### Tham chiếu cấu hình

Các khóa cấp cao nhất trong `plugins.entries.voice-call.config` không được hiển thị ở trên:

| Khóa                            | Mặc định     | Ghi chú                                                                                            |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Công tắc bật/tắt chính.                                                                            |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Xem [Cuộc gọi đến](#inbound-calls).             |
| `allowFrom`                     | `[]`         | Danh sách cho phép E.164 cho `inboundPolicy: "allowlist"`.                                         |
| `maxDurationSeconds`            | `300`        | Giới hạn cứng về thời lượng mỗi cuộc gọi, được thực thi bất kể trạng thái trả lời.                 |
| `staleCallReaperSeconds`        | `120`        | Xem [Trình thu hồi cuộc gọi cũ](#stale-call-reaper). `0` sẽ vô hiệu hóa tính năng này.            |
| `silenceTimeoutMs`              | `800`        | Phát hiện khoảng lặng cuối lời nói cho luồng cổ điển (không phải thời gian thực).                   |
| `transcriptTimeoutMs`           | `180000`     | Thời gian chờ tối đa cho bản phiên âm của người gọi trước khi bỏ lượt.                              |
| `ringTimeoutMs`                 | `30000`      | Thời gian chờ đổ chuông cho cuộc gọi đi.                                                            |
| `maxConcurrentCalls`            | `1`          | Các cuộc gọi đi vượt quá giới hạn này sẽ bị từ chối.                                                |
| `outbound.notifyHangupDelaySec` | `3`          | Số giây chờ sau TTS trước khi tự động ngắt máy ở chế độ thông báo.                                  |
| `skipSignatureVerification`     | `false`      | Chỉ dùng để kiểm thử cục bộ; tuyệt đối không bật trong môi trường sản xuất.                          |
| `store`                         | chưa đặt      | Ghi đè đường dẫn `$OPENCLAW_STATE_DIR/voice-calls` mặc định (thông thường là `~/.openclaw/voice-calls`). |
| `agentId`                       | `"main"`     | Tác nhân dùng để tạo phản hồi và lưu trữ phiên.                                                     |
| `responseModel`                 | chưa đặt      | Ghi đè mô hình mặc định cho phản hồi cổ điển (không phải thời gian thực).                           |
| `responseSystemPrompt`          | được tạo      | Lời nhắc hệ thống tùy chỉnh cho phản hồi cổ điển.                                                   |
| `responseTimeoutMs`             | `30000`      | Thời gian chờ để tạo phản hồi cổ điển (ms).                                                         |

Twilio mặc định sử dụng điểm cuối REST US1. Để xử lý cuộc gọi trong một Region
ngoài Hoa Kỳ được hỗ trợ, hãy đặt `twilio.region` thành `ie1` hoặc `au1` và sử dụng thông tin xác thực từ
Region đó. Xem
[hướng dẫn API REST ngoài Hoa Kỳ của Twilio](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Ghi chú về khả năng truy cập và bảo mật của nhà cung cấp">
    - Twilio, Telnyx và Plivo đều yêu cầu một URL webhook **có thể truy cập công khai**.
    - `mock` là nhà cung cấp phát triển cục bộ (không thực hiện lệnh gọi mạng).
    - Telnyx yêu cầu `telnyx.publicKey` (hoặc `TELNYX_PUBLIC_KEY`) trừ khi `skipSignatureVerification` là true.
    - `skipSignatureVerification` chỉ dùng để kiểm thử cục bộ.
    - Trên gói miễn phí của ngrok, hãy đặt `publicUrl` thành URL ngrok chính xác; việc xác minh chữ ký luôn được thực thi.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` cho phép webhook Twilio có chữ ký không hợp lệ **chỉ** khi `tunnel.provider="ngrok"` và `serve.bind` là địa chỉ lặp (tác nhân ngrok cục bộ). Chỉ dùng để phát triển cục bộ.
    - URL gói miễn phí của ngrok có thể thay đổi hoặc thêm trang trung gian; nếu `publicUrl` thay đổi, chữ ký Twilio sẽ không hợp lệ. Trong môi trường sản xuất: nên dùng miền ổn định hoặc Tailscale funnel.

  </Accordion>
  <Accordion title="Giới hạn kết nối truyền trực tuyến">
    - `streaming.preStartTimeoutMs` (mặc định `5000`) đóng các socket không bao giờ gửi khung `start` hợp lệ.
    - `streaming.maxPendingConnections` (mặc định `32`) giới hạn tổng số socket chưa xác thực trước khi bắt đầu.
    - `streaming.maxPendingConnectionsPerIp` (mặc định `4`) giới hạn số socket chưa xác thực trước khi bắt đầu cho mỗi địa chỉ IP nguồn.
    - `streaming.maxConnections` (mặc định `128`) giới hạn tất cả socket luồng phương tiện đang mở (đang chờ + đang hoạt động).

  </Accordion>
  <Accordion title="Di chuyển cấu hình cũ">
    Trình phân tích cấu hình tự động chuẩn hóa các khóa cũ này và ghi nhật ký
    cảnh báo nêu tên đường dẫn thay thế; lớp tương thích sẽ bị xóa trong một bản
    phát hành tương lai (`2026.6.0`), vì vậy hãy chạy `openclaw doctor --fix` để viết lại cấu hình
    đã lưu theo dạng chuẩn:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` đã bị xóa (ngữ cảnh thời gian thực hiện sử dụng lời nhắc tác nhân được tạo)

  </Accordion>
</AccordionGroup>

## Phạm vi phiên

Theo mặc định, Voice Call sử dụng `sessionScope: "per-phone"` để các cuộc gọi lặp lại từ
cùng một người gọi duy trì bộ nhớ hội thoại. Đặt `sessionScope: "per-call"` khi
mỗi cuộc gọi của nhà mạng cần bắt đầu với ngữ cảnh mới, chẳng hạn như các luồng lễ tân,
đặt chỗ, IVR hoặc cầu nối Google Meet, trong đó cùng một số điện thoại có thể
đại diện cho các cuộc họp khác nhau.

Voice Call lưu các khóa phiên được tạo trong không gian tên tác nhân đã cấu hình
(`agent:<agentId>:voice:*`). Các khóa tích hợp tường minh thô được phân giải vào
cùng không gian tên: khóa `agent:<configuredAgentId>:*` chuẩn sẽ giữ nguyên
chủ sở hữu đó và tuân theo bí danh `session.mainKey`/phạm vi toàn cục của lõi; đầu vào
`agent:*` ngoại lai hoặc sai định dạng được giới hạn phạm vi như một khóa bất định trong tác nhân
đã cấu hình; `global` và `unknown` vẫn là các giá trị canh gác toàn cục.

## Hội thoại thoại thời gian thực

`realtime` chọn một nhà cung cấp thoại thời gian thực song công toàn phần cho âm thanh cuộc gọi trực tiếp.
Nó tách biệt với `streaming`, vốn chỉ chuyển tiếp âm thanh đến các nhà cung cấp
phiên âm thời gian thực.

<Warning>
Không thể kết hợp `realtime.enabled` với `streaming.enabled`. Chỉ chọn một
chế độ âm thanh cho mỗi cuộc gọi.
</Warning>

Hành vi hiện tại của môi trường chạy:

- `realtime.enabled` được hỗ trợ cho Twilio và Telnyx.
- `realtime.provider` là tùy chọn. Nếu không được đặt, Voice Call sử dụng nhà cung cấp giọng nói thời gian thực được đăng ký đầu tiên.
- Các nhà cung cấp giọng nói thời gian thực đi kèm: Google Gemini Live (`google`) và OpenAI (`openai`), được đăng ký bởi các plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `realtime.providers.<providerId>`.
- Theo mặc định, Voice Call cung cấp công cụ thời gian thực dùng chung `openclaw_agent_consult`. Mô hình thời gian thực có thể gọi công cụ này khi người gọi yêu cầu suy luận sâu hơn, thông tin hiện tại hoặc các công cụ OpenClaw thông thường.
- `realtime.consultPolicy` có thể tùy chọn thêm hướng dẫn về thời điểm mô hình thời gian thực nên gọi `openclaw_agent_consult`.
- `realtime.agentContext.enabled` mặc định bị tắt. Khi được bật, Voice Call đưa danh tính agent có giới hạn và một tập tin không gian làm việc đã chọn vào hướng dẫn dành cho nhà cung cấp thời gian thực khi thiết lập phiên.
- `realtime.fastContext.enabled` mặc định bị tắt. Khi được bật, trước tiên Voice Call tìm kiếm câu hỏi tư vấn trong ngữ cảnh bộ nhớ/phiên đã lập chỉ mục và trả về các đoạn trích đó cho mô hình thời gian thực trong phạm vi `realtime.fastContext.timeoutMs`, rồi chỉ chuyển sang agent tư vấn đầy đủ nếu `realtime.fastContext.fallbackToConsult` là true.
- Nếu `realtime.provider` trỏ đến một nhà cung cấp chưa đăng ký hoặc hoàn toàn không có nhà cung cấp giọng nói thời gian thực nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua phương tiện thời gian thực thay vì làm hỏng toàn bộ plugin.
- `inboundPolicy` không được là `"disabled"` khi `realtime.enabled` là true; `validateProviderConfig` từ chối tổ hợp đó.
- Khóa phiên tư vấn tái sử dụng phiên cuộc gọi đã lưu khi có thể, sau đó chuyển sang `sessionScope` đã cấu hình (mặc định là `per-phone` hoặc `per-call` đối với các cuộc gọi cô lập).

### Chính sách công cụ

`realtime.toolPolicy` kiểm soát lượt chạy tư vấn:

| Chính sách           | Hành vi                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Cung cấp công cụ tư vấn và giới hạn agent thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` và `memory_get`. |
| `owner`          | Cung cấp công cụ tư vấn và cho phép agent thông thường sử dụng chính sách công cụ agent thông thường.                                                      |
| `none`           | Không cung cấp công cụ tư vấn. Các `realtime.tools` tùy chỉnh vẫn được chuyển tiếp đến nhà cung cấp thời gian thực.                               |

`realtime.consultPolicy` chỉ kiểm soát hướng dẫn dành cho mô hình thời gian thực:

| Chính sách        | Hướng dẫn                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Giữ lời nhắc mặc định và để nhà cung cấp quyết định thời điểm gọi công cụ tư vấn.              |
| `substantive` | Trực tiếp xử lý các thành phần hội thoại đơn giản và thực hiện tư vấn trước khi cung cấp dữ kiện, bộ nhớ, công cụ hoặc ngữ cảnh. |
| `always`      | Thực hiện tư vấn trước mọi câu trả lời có nội dung thực chất.                                                        |

### Ngữ cảnh giọng nói của agent

Bật `realtime.agentContext` khi cầu nối giọng nói cần có âm điệu giống như
agent OpenClaw đã cấu hình mà không phải trả chi phí cho một lượt đi-về tư vấn agent đầy đủ trong
các lượt thông thường. Tập ngữ cảnh được thêm một lần khi phiên thời gian thực
được tạo, vì vậy không làm tăng độ trễ trên mỗi lượt. Các lệnh gọi đến
`openclaw_agent_consult` vẫn chạy agent OpenClaw đầy đủ và nên được sử dụng
cho công việc bằng công cụ, thông tin hiện tại, tra cứu bộ nhớ hoặc trạng thái không gian làm việc.

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
    cho các cuộc gọi dài hơn, có thể kết nối lại. Sử dụng `silenceDurationMs`,
    `startSensitivity` và `endSensitivity` để tinh chỉnh khả năng luân phiên lượt nói nhanh hơn trên
    âm thanh điện thoại.

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
                instructions: "Nói ngắn gọn. Gọi openclaw_agent_consult trước khi sử dụng các công cụ chuyên sâu hơn.",
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
[nhà cung cấp OpenAI](/vi/providers/openai) để biết các tùy chọn giọng nói thời gian thực
dành riêng cho từng nhà cung cấp.

## Phiên âm trực tuyến

`streaming` kết nối Twilio Media Streams với một nhà cung cấp phiên âm thời gian thực.
Đường dẫn truyền phát cổ điển yêu cầu `provider: "twilio"`; cấu hình với
Telnyx, Plivo hoặc mock sẽ bị từ chối. Âm thanh trực tiếp của Telnyx sử dụng đường dẫn
`realtime.enabled` được xác thực riêng.

Hành vi thời gian chạy hiện tại:

- `streaming.provider` là tùy chọn. Nếu không được đặt, Voice Call sử dụng nhà cung cấp phiên âm thời gian thực được đăng ký đầu tiên.
- Các nhà cung cấp phiên âm thời gian thực đi kèm: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) và xAI (`xai`), được đăng ký bởi các plugin nhà cung cấp tương ứng.
- Cấu hình thô do nhà cung cấp sở hữu nằm trong `streaming.providers.<providerId>`.
- Sau khi Twilio gửi một thông báo `start` luồng đã được chấp nhận, Voice Call đăng ký luồng ngay lập tức, đưa phương tiện đến vào hàng đợi qua nhà cung cấp phiên âm trong khi nhà cung cấp kết nối và chỉ bắt đầu lời chào ban đầu sau khi phiên âm thời gian thực sẵn sàng.
- Nếu `streaming.provider` trỏ đến một nhà cung cấp chưa đăng ký hoặc không có nhà cung cấp nào được đăng ký, Voice Call ghi cảnh báo và bỏ qua việc truyền phát phương tiện thay vì làm hỏng toàn bộ plugin.

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
                    apiKey: "sk-...", // tùy chọn nếu OPENAI_API_KEY được đặt
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
    Giá trị mặc định: khóa API `streaming.providers.xai.apiKey` hoặc `XAI_API_KEY` (chuyển
    sang hồ sơ xác thực OAuth xAI nếu cả hai đều không được đặt); điểm cuối
    `wss://api.x.ai/v1/stt`; mã hóa `mulaw`; tốc độ lấy mẫu `8000`;
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
                    apiKey: "${XAI_API_KEY}", // tùy chọn nếu XAI_API_KEY được đặt
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

Voice Call sử dụng cấu hình `messages.tts` cốt lõi để truyền phát giọng nói trong
cuộc gọi. Bạn có thể ghi đè cấu hình này trong cấu hình plugin bằng **cùng một cấu trúc** —
cấu hình đó được hợp nhất sâu với `messages.tts`.

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
**Giọng nói Microsoft bị bỏ qua đối với các cuộc gọi thoại.** Tổng hợp giọng nói điện thoại yêu cầu
một nhà cung cấp triển khai đầu ra dành cho điện thoại; nhà cung cấp giọng nói
Microsoft không triển khai đầu ra này, vì vậy nhà cung cấp đó bị bỏ qua đối với các cuộc gọi và hệ thống sẽ thử
các nhà cung cấp khác trong chuỗi dự phòng.
</Warning>

Ghi chú về hành vi:

- Các khóa `tts.<provider>` cũ trong cấu hình plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) được `openclaw doctor --fix` sửa chữa; cấu hình đã cam kết nên sử dụng `tts.providers.<provider>`.
- TTS cốt lõi được sử dụng khi truyền phát phương tiện Twilio được bật; nếu không, cuộc gọi sẽ chuyển sang giọng nói gốc của nhà cung cấp.
- Nếu một luồng phương tiện Twilio đã hoạt động, Voice Call không chuyển sang `<Say>` của TwiML. Nếu TTS điện thoại không khả dụng trong trạng thái đó, yêu cầu phát lại sẽ thất bại thay vì kết hợp hai đường dẫn phát lại.
- Khi TTS điện thoại chuyển sang một nhà cung cấp phụ, Voice Call ghi cảnh báo kèm chuỗi nhà cung cấp (`from`, `to`, `attempts`) để gỡ lỗi.
- Khi thao tác ngắt lời hoặc kết thúc luồng của Twilio xóa hàng đợi TTS đang chờ, các yêu cầu phát lại trong hàng đợi sẽ được hoàn tất thay vì bị treo khiến người gọi phải chờ phát lại hoàn tất.

### Ví dụ về TTS

<Tabs>
  <Tab title="Chỉ TTS cốt lõi">
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
  inboundGreeting: "Xin chào! Tôi có thể giúp gì?",
}
```

<Warning>
`inboundPolicy: "allowlist"` là cơ chế kiểm tra ID người gọi có mức bảo đảm thấp. Plugin
chuẩn hóa giá trị `From` do nhà cung cấp cung cấp và so sánh giá trị đó với `allowFrom`.
Việc xác minh Webhook xác thực hoạt động gửi của nhà cung cấp và tính toàn vẹn của tải dữ liệu,
nhưng **không** chứng minh quyền sở hữu số người gọi PSTN/VoIP. Hãy coi
`allowFrom` là bộ lọc ID người gọi, không phải danh tính người gọi có độ tin cậy cao.
</Warning>

Phản hồi tự động sử dụng hệ thống tác nhân. Điều chỉnh bằng `responseModel`,
`responseSystemPrompt` và `responseTimeoutMs`.

### Định tuyến theo từng số

Sử dụng `numbers` khi một Plugin Cuộc gọi Thoại nhận cuộc gọi cho nhiều số điện thoại
và mỗi số cần hoạt động như một đường dây khác nhau. Ví dụ,
một số có thể sử dụng trợ lý cá nhân thân thiện, trong khi số khác sử dụng một
vai trò doanh nghiệp, tác nhân phản hồi khác và giọng TTS khác.

Các tuyến được chọn từ số `To` đã quay do nhà cung cấp cung cấp. Khóa phải
là số E.164. Khi có cuộc gọi đến, Cuộc gọi Thoại phân giải tuyến phù hợp
một lần, lưu tuyến đã khớp vào bản ghi cuộc gọi và tái sử dụng
cấu hình hiệu lực đó cho lời chào, luồng phản hồi tự động cổ điển, luồng
tham vấn thời gian thực và phát lại TTS. Nếu không có tuyến nào khớp, cấu hình
Cuộc gọi Thoại toàn cục sẽ được sử dụng. Cuộc gọi đi không sử dụng `numbers`; hãy truyền rõ
đích cuộc gọi đi, tin nhắn và phiên khi bắt đầu cuộc gọi.

Các phần ghi đè tuyến hiện được hỗ trợ:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Giá trị tuyến `tts` được hợp nhất sâu lên trên cấu hình `tts` của Cuộc gọi Thoại toàn cục, vì vậy
thông thường bạn chỉ cần ghi đè giọng của nhà cung cấp:

```json5
{
  inboundGreeting: "Xin chào từ đường dây chính.",
  responseSystemPrompt: "Bạn là trợ lý giọng nói mặc định.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards xin nghe, tôi có thể giúp gì?",
      responseSystemPrompt: "Bạn là chuyên gia ngắn gọn về thẻ bóng chày.",
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

Đối với phản hồi tự động, Cuộc gọi Thoại nối thêm một hợp đồng đầu ra lời nói nghiêm ngặt vào
lời nhắc hệ thống, yêu cầu phản hồi JSON `{"spoken":"..."}`. Cuộc gọi Thoại
trích xuất văn bản lời nói theo cách phòng vệ:

- Bỏ qua tải dữ liệu được đánh dấu là nội dung suy luận/lỗi.
- Phân tích JSON trực tiếp, JSON có hàng rào hoặc các khóa `"spoken"` nội dòng.
- Dùng văn bản thuần làm phương án dự phòng và loại bỏ các đoạn mở đầu có khả năng là nội dung lập kế hoạch/siêu thông tin.

Điều này giúp nội dung phát lời nói tập trung vào văn bản dành cho người gọi và tránh làm lộ
văn bản lập kế hoạch vào âm thanh.

### Hành vi khởi động cuộc hội thoại

Đối với cuộc gọi `conversation` đi, việc xử lý tin nhắn đầu tiên gắn với trạng thái
phát trực tiếp:

- Việc xóa hàng đợi khi người gọi chen lời và phản hồi tự động chỉ bị ngăn khi lời chào ban đầu đang được phát.
- Nếu phát ban đầu thất bại, cuộc gọi trở về `listening` và tin nhắn ban đầu vẫn nằm trong hàng đợi để thử lại.
- Việc phát ban đầu cho luồng Twilio bắt đầu khi luồng kết nối mà không có độ trễ bổ sung.
- Việc chen lời hủy phát đang hoạt động và xóa các mục TTS Twilio đã xếp hàng nhưng chưa phát. Các mục bị xóa được phân giải là đã bỏ qua, để logic phản hồi tiếp theo có thể tiếp tục mà không phải chờ âm thanh sẽ không bao giờ được phát.
- Cuộc hội thoại giọng nói thời gian thực sử dụng lượt mở đầu riêng của luồng thời gian thực. Cuộc gọi Thoại **không** đăng bản cập nhật TwiML `<Say>` cũ cho tin nhắn ban đầu đó, vì vậy các phiên `<Connect><Stream>` đi vẫn được gắn kết.

### Thời gian gia hạn khi luồng Twilio ngắt kết nối

Khi một luồng phương tiện Twilio ngắt kết nối, Cuộc gọi Thoại chờ **2000 ms** trước khi
tự động kết thúc cuộc gọi:

- Nếu luồng kết nối lại trong khoảng thời gian đó, việc tự động kết thúc sẽ bị hủy.
- Nếu không có luồng nào đăng ký lại sau thời gian gia hạn, cuộc gọi sẽ bị kết thúc để ngăn cuộc gọi đang hoạt động bị mắc kẹt.

## Trình thu hồi cuộc gọi cũ

Sử dụng `staleCallReaperSeconds` (mặc định **120**) để kết thúc các cuộc gọi không bao giờ
được trả lời và không bao giờ đạt trạng thái hội thoại trực tiếp, ví dụ các cuộc gọi
ở chế độ thông báo mà nhà cung cấp không bao giờ gửi Webhook kết thúc. Đặt thành `0` để
tắt.

Trình thu hồi chạy mỗi 30 giây và chỉ kết thúc các cuộc gọi không có
dấu thời gian `answeredAt` và chưa ở trạng thái kết thúc hoặc trực tiếp
(`speaking`/`listening`), vì vậy các cuộc hội thoại đã được trả lời sẽ không bao giờ bị trình hẹn giờ này thu hồi;
`maxDurationSeconds` (mặc định 300) là giới hạn riêng để kết thúc
các cuộc gọi đã được trả lời nhưng kéo dài quá lâu.

Đối với các luồng kiểu thông báo, nơi nhà mạng có thể chậm gửi Webhook
đổ chuông/trả lời, hãy tăng `staleCallReaperSeconds` cao hơn giá trị mặc định để các
cuộc gọi chậm nhưng bình thường không bị thu hồi sớm; `120`-`300` giây là một khoảng hợp lý
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

Khi proxy hoặc đường hầm nằm phía trước Gateway, Plugin tái tạo
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

- Tính năng **bảo vệ chống phát lại** Webhook được bật cho Twilio, Telnyx và Plivo. Các yêu cầu Webhook hợp lệ bị phát lại được xác nhận nhưng bỏ qua tác dụng phụ.
- Các lượt hội thoại Twilio bao gồm token theo từng lượt trong lệnh gọi lại `<Gather>`, vì vậy lệnh gọi lại lời nói cũ/bị phát lại không thể đáp ứng một lượt bản chép lời đang chờ mới hơn.
- Các yêu cầu Webhook chưa xác thực bị từ chối trước khi đọc phần thân nếu thiếu tiêu đề chữ ký bắt buộc của nhà cung cấp.
- Webhook voice-call sử dụng hồ sơ đọc phần thân trước xác thực dùng chung (phần thân tối đa 64 KB, thời gian chờ đọc 5 giây) cùng giới hạn số yêu cầu đang xử lý theo mỗi khóa (mặc định 8 yêu cầu đồng thời cho mỗi khóa) trước khi xác minh chữ ký.

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
openclaw voicecall call --to "+15555550123" --message "Xin chào từ OpenClaw"
openclaw voicecall start --to "+15555550123"   # bí danh của call
openclaw voicecall continue --call-id <id> --message "Có câu hỏi nào không?"
openclaw voicecall speak --call-id <id> --message "Vui lòng chờ một chút"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # tóm tắt độ trễ lượt từ nhật ký
openclaw voicecall expose --mode funnel
```

Khi Gateway đang chạy, các lệnh `voicecall` vận hành
ủy quyền cho runtime voice-call do Gateway sở hữu để CLI không liên kết với
máy chủ Webhook thứ hai. Nếu không thể truy cập Gateway, các lệnh sẽ dùng
runtime CLI độc lập làm phương án dự phòng.

`latency` đọc `calls.jsonl` từ đường dẫn lưu trữ voice-call mặc định. Sử dụng
`--file <path>` để trỏ đến nhật ký khác và `--last <n>` để giới hạn
phân tích ở N bản ghi gần nhất (mặc định 200). Đầu ra bao gồm giá trị nhỏ nhất/lớn nhất/trung bình,
p50 và p95 cho độ trễ lượt và thời gian chờ nghe.

## Công cụ tác nhân

Tên công cụ: `voice_call`.

| Hành động          | Đối số                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin voice-call đi kèm một kỹ năng tác nhân tương ứng.

## RPC Gateway

| Phương thức                 | Đối số                                                           | Ghi chú                                                                   |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Dùng cấu hình `toNumber` làm phương án dự phòng khi bỏ qua `to`.                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Giống `initiate` nhưng cũng chấp nhận `dtmfSequence` trước khi kết nối.           |
| `voicecall.continue`        | `callId`, `message`                                              | Chặn cho đến khi lượt xử lý hoàn tất; trả về bản chép lời.                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | Biến thể bất đồng bộ: trả về ngay một `operationId`.                      |
| `voicecall.continue.result` | `operationId`                                                    | Thăm dò một thao tác `voicecall.continue.start` đang chờ để lấy kết quả.      |
| `voicecall.speak`           | `callId`, `message`                                              | Phát lời nói mà không chờ; sử dụng cầu nối thời gian thực khi `realtime.enabled`. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | Bỏ qua `callId` để liệt kê tất cả cuộc gọi đang hoạt động.                                   |

`dtmfSequence` chỉ hợp lệ với `mode: "conversation"`; các cuộc gọi ở chế độ thông báo
nên sử dụng `voicecall.dtmf` sau khi cuộc gọi đã tồn tại nếu cần gửi các
chữ số sau khi kết nối.

## Khắc phục sự cố

### Thiết lập không thể công khai Webhook

Chạy thiết lập từ cùng môi trường chạy Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Đối với `twilio`, `telnyx` và `plivo`, `webhook-exposure` phải có trạng thái xanh. Một
`publicUrl` đã được cấu hình vẫn không hoạt động khi trỏ đến không gian mạng
cục bộ hoặc riêng tư, vì nhà mạng không thể gọi lại vào các địa chỉ đó.
Không sử dụng `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` hoặc các dải
NAT cấp nhà mạng khác làm `publicUrl`.

Các cuộc gọi đi ở chế độ thông báo của Twilio gửi trực tiếp TwiML `<Say>` ban đầu
trong yêu cầu tạo cuộc gọi, vì vậy thông báo thoại đầu tiên không phụ thuộc vào việc
Twilio tìm nạp TwiML của Webhook. Vẫn cần Webhook công khai cho các lệnh gọi lại
trạng thái, cuộc gọi hội thoại, DTMF trước khi kết nối, luồng thời gian thực và
điều khiển cuộc gọi sau khi kết nối.

Sử dụng một phương thức công khai:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // hoặc
          tunnel: { provider: "ngrok" },
          // hoặc
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

`voicecall smoke` là lần chạy thử trừ khi truyền `--yes`.

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
- Proxy chuyển tiếp yêu cầu nhưng loại bỏ hoặc viết lại các tiêu đề máy chủ/giao thức.
- Tường lửa hoặc DNS định tuyến tên máy chủ công khai đến nơi khác thay vì Gateway.
- Gateway đã được khởi động lại mà không bật Plugin Voice Call.

Khi có proxy ngược hoặc đường hầm phía trước Gateway, hãy đặt
`webhookSecurity.allowedHosts` thành tên máy chủ công khai hoặc sử dụng
`webhookSecurity.trustedProxyIPs` cho một địa chỉ proxy đã biết. Chỉ sử dụng
`webhookSecurity.trustForwardingHeaders` khi bạn kiểm soát
ranh giới proxy.

### Xác minh chữ ký không thành công

Chữ ký của nhà cung cấp được kiểm tra dựa trên URL công khai mà OpenClaw dựng lại
từ yêu cầu đến. Nếu chữ ký không hợp lệ:

- Xác nhận URL Webhook của nhà cung cấp khớp chính xác với `publicUrl`, bao gồm giao thức, máy chủ và đường dẫn.
- Đối với URL ngrok cấp miễn phí, hãy cập nhật `publicUrl` khi tên máy chủ đường hầm thay đổi.
- Đảm bảo proxy giữ nguyên các tiêu đề máy chủ và giao thức ban đầu hoặc cấu hình `webhookSecurity.allowedHosts`.
- Không bật `skipSignatureVerification` bên ngoài môi trường kiểm thử cục bộ.

### Không thể tham gia Google Meet qua Twilio

Google Meet sử dụng Plugin này để tham gia bằng số quay vào của Twilio. Trước tiên, hãy xác minh Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Sau đó xác minh cụ thể phương thức truyền tải Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Nếu Voice Call có trạng thái xanh nhưng người tham gia Meet không bao giờ vào được, hãy kiểm tra số
quay vào Meet, mã PIN và `--dtmf-sequence`. Cuộc gọi điện thoại có thể hoạt động bình thường
trong khi cuộc họp từ chối hoặc bỏ qua một chuỗi DTMF không chính xác.

Google Meet khởi tạo chặng điện thoại Twilio thông qua `voicecall.start` với một
chuỗi DTMF trước khi kết nối. Các chuỗi được tạo từ mã PIN bao gồm
`voiceCall.dtmfDelayMs` của Plugin Google Meet (mặc định **12000 ms**) làm các chữ số chờ
Twilio ở đầu, vì lời nhắc quay số vào Meet có thể đến muộn. Sau đó, Voice Call
chuyển hướng trở lại xử lý thời gian thực trước khi yêu cầu lời chào mở đầu.

Sử dụng `openclaw logs --follow` để xem dấu vết giai đoạn trực tiếp. Một lần tham gia Meet
qua Twilio bình thường ghi nhật ký theo thứ tự sau:

- Google Meet ủy quyền việc tham gia qua Twilio cho Voice Call.
- Voice Call lưu TwiML DTMF trước khi kết nối.
- TwiML ban đầu của Twilio được sử dụng và phục vụ trước khi xử lý thời gian thực.
- Voice Call phục vụ TwiML thời gian thực cho cuộc gọi Twilio.
- Google Meet yêu cầu lời nói mở đầu bằng `voicecall.speak` sau khoảng trễ hậu DTMF.

`openclaw voicecall tail` vẫn hiển thị các bản ghi cuộc gọi được lưu trữ lâu dài; hữu ích cho
trạng thái cuộc gọi và bản chép lời, nhưng không phải mọi chuyển tiếp Webhook/thời gian thực
đều xuất hiện ở đó.

### Cuộc gọi thời gian thực không có tiếng nói

Xác nhận chỉ bật một chế độ âm thanh: `realtime.enabled` và
`streaming.enabled` không thể đồng thời là true.

Đối với các cuộc gọi Twilio/Telnyx thời gian thực, hãy xác minh thêm:

- Một Plugin nhà cung cấp thời gian thực đã được tải và đăng ký.
- `realtime.provider` chưa được đặt hoặc chỉ định một nhà cung cấp đã đăng ký.
- Khóa API của nhà cung cấp khả dụng cho tiến trình Gateway.
- `openclaw logs --follow` hiển thị TwiML thời gian thực đã được phục vụ, cầu nối thời gian thực đã khởi động và lời chào ban đầu đã được đưa vào hàng đợi.

## Liên quan

- [Chế độ trò chuyện](/vi/nodes/talk)
- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Kích hoạt bằng giọng nói](/vi/nodes/voicewake)
