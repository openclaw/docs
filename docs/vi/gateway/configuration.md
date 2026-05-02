---
read_when:
    - Thiết lập OpenClaw lần đầu tiên
    - Đang tìm kiếm các mẫu cấu hình phổ biến
    - Điều hướng đến các phần cấu hình cụ thể
summary: 'Tổng quan cấu hình: các tác vụ thường gặp, thiết lập nhanh và liên kết đến tài liệu tham khảo đầy đủ'
title: Cấu hình
x-i18n:
    generated_at: "2026-05-02T10:41:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw đọc một cấu hình <Tooltip tip="JSON5 hỗ trợ chú thích và dấu phẩy cuối">**JSON5**</Tooltip> tùy chọn từ `~/.openclaw/openclaw.json`.
Đường dẫn cấu hình đang hoạt động phải là một tệp thông thường. Các bố cục `openclaw.json`
dùng symlink không được hỗ trợ cho các thao tác ghi do OpenClaw sở hữu; thao tác ghi nguyên tử có thể thay thế
đường dẫn thay vì giữ nguyên symlink. Nếu bạn giữ cấu hình bên ngoài thư mục trạng thái
mặc định, hãy trỏ `OPENCLAW_CONFIG_PATH` trực tiếp tới tệp thật.

Nếu tệp bị thiếu, OpenClaw dùng các giá trị mặc định an toàn. Các lý do phổ biến để thêm cấu hình:

- Kết nối các kênh và kiểm soát ai có thể nhắn tin cho bot
- Thiết lập model, công cụ, sandboxing hoặc tự động hóa (cron, hook)
- Tinh chỉnh session, media, mạng hoặc UI

Xem [tham chiếu đầy đủ](/vi/gateway/configuration-reference) để biết mọi trường có sẵn.

Agent và tự động hóa nên dùng `config.schema.lookup` để có tài liệu chính xác
theo từng trường trước khi chỉnh sửa cấu hình. Dùng trang này để xem hướng dẫn theo tác vụ và
[Tham chiếu cấu hình](/vi/gateway/configuration-reference) để xem bản đồ trường và giá trị mặc định
rộng hơn.

<Tip>
**Mới làm quen với cấu hình?** Bắt đầu với `openclaw onboard` để thiết lập tương tác, hoặc xem hướng dẫn [Ví dụ cấu hình](/vi/gateway/configuration-examples) để có các cấu hình hoàn chỉnh có thể sao chép-dán.
</Tip>

## Cấu hình tối thiểu

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Chỉnh sửa cấu hình

<Tabs>
  <Tab title="Trình hướng dẫn tương tác">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (lệnh một dòng)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Mở [http://127.0.0.1:18789](http://127.0.0.1:18789) và dùng tab **Cấu hình**.
    Control UI hiển thị một biểu mẫu từ schema cấu hình trực tiếp, bao gồm metadata tài liệu
    `title` / `description` của trường cùng schema của Plugin và kênh khi
    có sẵn, với trình chỉnh sửa **JSON thô** làm lối thoát. Đối với các UI
    đào sâu và công cụ khác, Gateway cũng cung cấp `config.schema.lookup` để
    lấy một nút schema theo phạm vi đường dẫn cùng các tóm tắt con trực tiếp.
  </Tab>
  <Tab title="Chỉnh sửa trực tiếp">
    Chỉnh sửa trực tiếp `~/.openclaw/openclaw.json`. Gateway theo dõi tệp và tự động áp dụng thay đổi (xem [tải lại nóng](#config-hot-reload)).
  </Tab>
</Tabs>

## Xác thực nghiêm ngặt

<Warning>
OpenClaw chỉ chấp nhận các cấu hình khớp hoàn toàn với schema. Khóa không xác định, kiểu sai định dạng hoặc giá trị không hợp lệ sẽ khiến Gateway **từ chối khởi động**. Ngoại lệ duy nhất ở cấp gốc là `$schema` (chuỗi), để trình chỉnh sửa có thể đính kèm metadata JSON Schema.
</Warning>

`openclaw config schema` in ra JSON Schema chuẩn được Control UI
và quy trình xác thực sử dụng. `config.schema.lookup` lấy một nút theo phạm vi
đường dẫn cùng các tóm tắt con cho công cụ đào sâu. Metadata tài liệu
`title`/`description` của trường được truyền qua các đối tượng lồng nhau, wildcard (`*`), mục mảng (`[]`) và các nhánh `anyOf`/
`oneOf`/`allOf`. Schema Plugin và kênh trong runtime được hợp nhất vào khi
registry manifest được tải.

Khi xác thực thất bại:

- Gateway không khởi động
- Chỉ các lệnh chẩn đoán hoạt động (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Chạy `openclaw doctor` để xem vấn đề chính xác
- Chạy `openclaw doctor --fix` (hoặc `--yes`) để áp dụng sửa chữa

Gateway giữ một bản sao đáng tin cậy đã biết là tốt gần nhất sau mỗi lần khởi động thành công.
Nếu `openclaw.json` sau đó không vượt qua xác thực (hoặc làm mất `gateway.mode`, thu nhỏ
đột ngột, hoặc bị chèn thừa một dòng log ở đầu), OpenClaw giữ lại tệp hỏng
dưới dạng `.clobbered.*`, khôi phục bản sao đã biết là tốt gần nhất và ghi log lý do
khôi phục. Lượt agent tiếp theo cũng nhận cảnh báo sự kiện hệ thống để agent chính
không mù quáng ghi lại cấu hình đã được khôi phục. Việc thăng cấp thành bản đã biết là tốt gần nhất
bị bỏ qua khi một ứng viên chứa placeholder bí mật đã bị che như `***`.
Khi mọi vấn đề xác thực đều nằm trong phạm vi `plugins.entries.<id>...`, OpenClaw
không thực hiện khôi phục toàn bộ tệp. Nó giữ cấu hình hiện tại hoạt động và
hiển thị lỗi cục bộ của Plugin để một schema Plugin hoặc lỗi không khớp phiên bản host
không thể rollback các thiết lập người dùng không liên quan.

## Tác vụ phổ biến

<AccordionGroup>
  <Accordion title="Thiết lập một kênh (WhatsApp, Telegram, Discord, v.v.)">
    Mỗi kênh có phần cấu hình riêng dưới `channels.<provider>`. Xem trang kênh chuyên biệt để biết các bước thiết lập:

    - [WhatsApp](/vi/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/vi/channels/telegram) — `channels.telegram`
    - [Discord](/vi/channels/discord) — `channels.discord`
    - [Feishu](/vi/channels/feishu) — `channels.feishu`
    - [Google Chat](/vi/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/vi/channels/msteams) — `channels.msteams`
    - [Slack](/vi/channels/slack) — `channels.slack`
    - [Signal](/vi/channels/signal) — `channels.signal`
    - [iMessage](/vi/channels/imessage) — `channels.imessage`
    - [Mattermost](/vi/channels/mattermost) — `channels.mattermost`

    Tất cả kênh dùng chung cùng mẫu chính sách DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Chọn và cấu hình model">
    Thiết lập model chính và các fallback tùy chọn:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` định nghĩa catalog model và đóng vai trò allowlist cho `/model`.
    - Dùng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm mục allowlist mà không xóa các model hiện có. Các thao tác thay thế thông thường có thể xóa mục sẽ bị từ chối trừ khi bạn truyền `--replace`.
    - Tham chiếu model dùng định dạng `provider/model` (ví dụ `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kiểm soát việc giảm kích thước ảnh transcript/công cụ (mặc định `1200`); giá trị thấp hơn thường giảm mức dùng vision-token trong các lần chạy nhiều ảnh chụp màn hình.
    - Xem [CLI model](/vi/concepts/models) để chuyển model trong chat và [Chuyển dự phòng model](/vi/concepts/model-failover) để biết hành vi xoay vòng xác thực và fallback.
    - Đối với provider tùy chỉnh/tự host, xem [Provider tùy chỉnh](/vi/gateway/config-tools#custom-providers-and-base-urls) trong tham chiếu.

  </Accordion>

  <Accordion title="Kiểm soát ai có thể nhắn tin cho bot">
    Quyền truy cập DM được kiểm soát theo từng kênh qua `dmPolicy`:

    - `"pairing"` (mặc định): người gửi không xác định nhận mã ghép đôi một lần để phê duyệt
    - `"allowlist"`: chỉ người gửi trong `allowFrom` (hoặc kho cho phép đã ghép đôi)
    - `"open"`: cho phép tất cả DM đến (yêu cầu `allowFrom: ["*"]`)
    - `"disabled"`: bỏ qua mọi DM

    Đối với nhóm, dùng `groupPolicy` + `groupAllowFrom` hoặc allowlist riêng theo kênh.

    Xem [tham chiếu đầy đủ](/vi/gateway/config-channels#dm-and-group-access) để biết chi tiết theo từng kênh.

  </Accordion>

  <Accordion title="Thiết lập kiểm soát mention trong chat nhóm">
    Tin nhắn nhóm mặc định **yêu cầu mention**. Cấu hình mẫu kích hoạt theo từng agent và giữ các câu trả lời hiển thị trong phòng trên đường dẫn công cụ tin nhắn mặc định, trừ khi bạn cố ý muốn câu trả lời cuối tự động kiểu cũ:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Mention metadata**: @-mention gốc (WhatsApp chạm để mention, Telegram @bot, v.v.)
    - **Mẫu văn bản**: mẫu regex an toàn trong `mentionPatterns`
    - **Câu trả lời hiển thị**: `messages.visibleReplies` có thể yêu cầu gửi bằng công cụ tin nhắn trên toàn cục; `messages.groupChat.visibleReplies` ghi đè điều đó cho nhóm/kênh.
    - Xem [tham chiếu đầy đủ](/vi/gateway/config-channels#group-chat-mention-gating) để biết các chế độ trả lời hiển thị, ghi đè theo kênh và chế độ self-chat.

  </Accordion>

  <Accordion title="Giới hạn Skills theo agent">
    Dùng `agents.defaults.skills` cho baseline dùng chung, rồi ghi đè các
    agent cụ thể bằng `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Bỏ qua `agents.defaults.skills` để mặc định không giới hạn Skills.
    - Bỏ qua `agents.list[].skills` để kế thừa mặc định.
    - Đặt `agents.list[].skills: []` để không có Skills.
    - Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config) và
      [Tham chiếu cấu hình](/vi/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tinh chỉnh giám sát sức khỏe kênh của Gateway">
    Kiểm soát mức độ chủ động Gateway khởi động lại các kênh có vẻ bị cũ:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Đặt `gateway.channelHealthCheckMinutes: 0` để tắt khởi động lại do health-monitor trên toàn cục.
    - `channelStaleEventThresholdMinutes` nên lớn hơn hoặc bằng khoảng thời gian kiểm tra.
    - Dùng `channels.<provider>.healthMonitor.enabled` hoặc `channels.<provider>.accounts.<id>.healthMonitor.enabled` để tắt tự động khởi động lại cho một kênh hoặc tài khoản mà không tắt monitor toàn cục.
    - Xem [Kiểm tra sức khỏe](/vi/gateway/health) để gỡ lỗi vận hành và [tham chiếu đầy đủ](/vi/gateway/configuration-reference#gateway) cho tất cả trường.

  </Accordion>

  <Accordion title="Tinh chỉnh thời gian chờ bắt tay WebSocket của Gateway">
    Cho client cục bộ thêm thời gian để hoàn tất bắt tay WebSocket tiền xác thực trên
    host đang tải nặng hoặc công suất thấp:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Mặc định là `15000` mili giây.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` vẫn được ưu tiên cho ghi đè dịch vụ hoặc shell một lần.
    - Nên sửa lỗi khởi động/event-loop bị khựng trước; nút chỉnh này dành cho host khỏe nhưng chậm trong lúc warmup.

  </Accordion>

  <Accordion title="Cấu hình session và reset">
    Session kiểm soát tính liên tục và cô lập của hội thoại:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (dùng chung) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: giá trị mặc định toàn cục cho định tuyến phiên gắn với luồng (Discord hỗ trợ `/focus`, `/unfocus`, `/agents`, `/session idle`, và `/session max-age`).
    - Xem [Quản lý phiên](/vi/concepts/session) để biết về phạm vi, liên kết danh tính và chính sách gửi.
    - Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-agents#session) để biết tất cả các trường.

  </Accordion>

  <Accordion title="Enable sandboxing">
    Chạy phiên tác nhân trong các runtime sandbox biệt lập:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Xây dựng image trước — từ một source checkout, chạy `scripts/sandbox-setup.sh`, hoặc từ bản cài đặt npm, xem lệnh `docker build` nội tuyến trong [Sandboxing § Images and setup](/vi/gateway/sandboxing#images-and-setup).

    Xem [Sandboxing](/vi/gateway/sandboxing) để đọc hướng dẫn đầy đủ và [tài liệu tham chiếu đầy đủ](/vi/gateway/config-agents#agentsdefaultssandbox) để biết tất cả tùy chọn.

  </Accordion>

  <Accordion title="Enable relay-backed push for official iOS builds">
    Push dựa trên relay được cấu hình trong `openclaw.json`.

    Đặt nội dung này trong cấu hình gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Tương đương trong CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Điều này thực hiện:

    - Cho phép gateway gửi `push.test`, các tín hiệu đánh thức, và các lần đánh thức kết nối lại thông qua relay bên ngoài.
    - Sử dụng quyền gửi có phạm vi đăng ký do ứng dụng iOS đã ghép đôi chuyển tiếp. Gateway không cần token relay dùng cho toàn bộ triển khai.
    - Gắn mỗi đăng ký dựa trên relay với danh tính gateway mà ứng dụng iOS đã ghép đôi, để gateway khác không thể dùng lại đăng ký đã lưu.
    - Giữ các bản dựng iOS cục bộ/thủ công dùng APNs trực tiếp. Gửi dựa trên relay chỉ áp dụng cho các bản dựng phân phối chính thức đã đăng ký qua relay.
    - Phải khớp với URL cơ sở relay được nhúng vào bản dựng iOS chính thức/TestFlight, để lưu lượng đăng ký và gửi đi tới cùng một triển khai relay.

    Luồng đầu cuối:

    1. Cài đặt một bản dựng iOS chính thức/TestFlight đã được biên dịch với cùng URL cơ sở relay.
    2. Cấu hình `gateway.push.apns.relay.baseUrl` trên gateway.
    3. Ghép đôi ứng dụng iOS với gateway và để cả phiên node lẫn phiên operator kết nối.
    4. Ứng dụng iOS lấy danh tính gateway, đăng ký với relay bằng App Attest cùng biên nhận ứng dụng, rồi xuất bản payload `push.apns.register` dựa trên relay tới gateway đã ghép đôi.
    5. Gateway lưu handle relay và quyền gửi, rồi dùng chúng cho `push.test`, các tín hiệu đánh thức, và các lần đánh thức kết nối lại.

    Ghi chú vận hành:

    - Nếu bạn chuyển ứng dụng iOS sang gateway khác, hãy kết nối lại ứng dụng để ứng dụng có thể xuất bản một đăng ký relay mới được gắn với gateway đó.
    - Nếu bạn phát hành bản dựng iOS mới trỏ tới một triển khai relay khác, ứng dụng sẽ làm mới đăng ký relay đã lưu trong bộ nhớ đệm thay vì dùng lại nguồn relay cũ.

    Ghi chú tương thích:

    - `OPENCLAW_APNS_RELAY_BASE_URL` và `OPENCLAW_APNS_RELAY_TIMEOUT_MS` vẫn hoạt động dưới dạng ghi đè env tạm thời.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` vẫn là lối thoát phát triển chỉ dành cho loopback; không lưu URL relay HTTP bền vững trong cấu hình.

    Xem [Ứng dụng iOS](/vi/platforms/ios#relay-backed-push-for-official-builds) để biết luồng đầu cuối và [Luồng xác thực và tin cậy](/vi/platforms/ios#authentication-and-trust-flow) để biết mô hình bảo mật relay.

  </Accordion>

  <Accordion title="Set up heartbeat (periodic check-ins)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: chuỗi thời lượng (`30m`, `2h`). Đặt `0m` để tắt.
    - `target`: `last` | `none` | `<channel-id>` (ví dụ `discord`, `matrix`, `telegram`, hoặc `whatsapp`)
    - `directPolicy`: `allow` (mặc định) hoặc `block` cho các mục tiêu Heartbeat kiểu DM
    - Xem [Heartbeat](/vi/gateway/heartbeat) để đọc hướng dẫn đầy đủ.

  </Accordion>

  <Accordion title="Configure cron jobs">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: dọn các phiên chạy biệt lập đã hoàn tất khỏi `sessions.json` (mặc định `24h`; đặt `false` để tắt).
    - `runLog`: dọn `cron/runs/<jobId>.jsonl` theo kích thước và số dòng giữ lại.
    - Xem [Tác vụ Cron](/vi/automation/cron-jobs) để biết tổng quan tính năng và ví dụ CLI.

  </Accordion>

  <Accordion title="Set up webhooks (hooks)">
    Bật endpoint HTTP Webhook trên Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Ghi chú bảo mật:
    - Xem mọi nội dung payload hook/webhook là đầu vào không đáng tin cậy.
    - Dùng `hooks.token` chuyên dụng; không dùng lại token Gateway dùng chung.
    - Xác thực hook chỉ dùng header (`Authorization: Bearer ...` hoặc `x-openclaw-token`); token trong chuỗi truy vấn bị từ chối.
    - `hooks.path` không thể là `/`; giữ ingress webhook trên một đường dẫn con chuyên dụng như `/hooks`.
    - Giữ các cờ bỏ qua nội dung không an toàn ở trạng thái tắt (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) trừ khi đang gỡ lỗi trong phạm vi rất chặt.
    - Nếu bạn bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để giới hạn các khóa phiên do caller chọn.
    - Với các tác nhân được điều khiển bằng hook, ưu tiên các tầng mô hình hiện đại mạnh và chính sách công cụ nghiêm ngặt (ví dụ chỉ nhắn tin cộng với sandboxing khi có thể).

    Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/configuration-reference#hooks) để biết tất cả tùy chọn ánh xạ và tích hợp Gmail.

  </Accordion>

  <Accordion title="Configure multi-agent routing">
    Chạy nhiều tác nhân biệt lập với workspace và phiên riêng:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Xem [Multi-Agent](/vi/concepts/multi-agent) và [tài liệu tham chiếu đầy đủ](/vi/gateway/config-agents#multi-agent-routing) để biết quy tắc binding và hồ sơ truy cập theo từng tác nhân.

  </Accordion>

  <Accordion title="Split config into multiple files ($include)">
    Dùng `$include` để tổ chức các cấu hình lớn:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Một tệp**: thay thế đối tượng chứa nó
    - **Mảng tệp**: được deep-merge theo thứ tự (mục sau thắng)
    - **Khóa cùng cấp**: được merge sau include (ghi đè giá trị đã include)
    - **Include lồng nhau**: hỗ trợ tối đa 10 cấp sâu
    - **Đường dẫn tương đối**: được phân giải tương đối với tệp đang include
    - **Ghi do OpenClaw sở hữu**: khi một lần ghi chỉ thay đổi một mục cấp cao nhất
      được hỗ trợ bởi include một tệp như `plugins: { $include: "./plugins.json5" }`,
      OpenClaw cập nhật tệp đã include đó và giữ nguyên `openclaw.json`
    - **Không hỗ trợ ghi xuyên qua**: include ở root, mảng include, và include
      có ghi đè cùng cấp sẽ fail-closed đối với các lần ghi do OpenClaw sở hữu thay vì
      làm phẳng cấu hình
    - **Giới hạn phạm vi**: đường dẫn `$include` phải phân giải nằm dưới thư mục chứa
      `openclaw.json`. Để chia sẻ một cây giữa các máy hoặc người dùng, đặt
      `OPENCLAW_INCLUDE_ROOTS` thành danh sách đường dẫn (`:` trên POSIX, `;` trên Windows) của
      các thư mục bổ sung mà include có thể tham chiếu. Symlink được phân giải
      và kiểm tra lại, nên một đường dẫn về mặt từ vựng nằm trong thư mục cấu hình nhưng
      đích thực của nó thoát khỏi mọi root được cho phép vẫn bị từ chối.
    - **Xử lý lỗi**: lỗi rõ ràng cho tệp bị thiếu, lỗi phân tích cú pháp, và include vòng tròn

  </Accordion>
</AccordionGroup>

## Tải lại cấu hình nóng

Gateway theo dõi `~/.openclaw/openclaw.json` và tự động áp dụng thay đổi — hầu hết cài đặt không cần khởi động lại thủ công.

Các chỉnh sửa tệp trực tiếp được xem là không đáng tin cậy cho đến khi chúng vượt qua xác thực. Watcher chờ
các lần ghi tạm/đổi tên của trình chỉnh sửa ổn định, đọc tệp cuối cùng, và từ chối
các chỉnh sửa bên ngoài không hợp lệ bằng cách khôi phục cấu hình tốt gần nhất. Các lần ghi cấu hình do OpenClaw sở hữu
dùng cùng cổng schema trước khi ghi; các clobber phá hoại như
xóa `gateway.mode` hoặc thu nhỏ tệp hơn một nửa bị từ chối
và được lưu dưới dạng `.rejected.*` để kiểm tra.

Lỗi xác thực cục bộ của Plugin là ngoại lệ: nếu tất cả vấn đề đều nằm dưới
`plugins.entries.<id>...`, quá trình tải lại giữ cấu hình hiện tại và báo cáo vấn đề
Plugin thay vì khôi phục `.last-good`.

Nếu bạn thấy `Config auto-restored from last-known-good` hoặc
`config reload restored last-known-good config` trong log, hãy kiểm tra tệp
`.clobbered.*` tương ứng nằm cạnh `openclaw.json`, sửa payload bị từ chối, rồi chạy
`openclaw config validate`. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-restored-last-known-good-config)
để biết danh sách kiểm tra khôi phục.

### Chế độ tải lại

| Chế độ                | Hành vi                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (mặc định) | Áp dụng nóng ngay các thay đổi an toàn. Tự động khởi động lại với các thay đổi quan trọng. |
| **`hot`**             | Chỉ áp dụng nóng các thay đổi an toàn. Ghi log cảnh báo khi cần khởi động lại — bạn tự xử lý. |
| **`restart`**         | Khởi động lại Gateway khi có bất kỳ thay đổi cấu hình nào, an toàn hay không.           |
| **`off`**             | Tắt theo dõi tệp. Thay đổi có hiệu lực ở lần khởi động lại thủ công tiếp theo.          |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Nội dung nào áp dụng nóng so với nội dung nào cần khởi động lại

Hầu hết trường được áp dụng nóng mà không có thời gian ngừng hoạt động. Ở chế độ `hybrid`, các thay đổi yêu cầu khởi động lại được xử lý tự động.

| Danh mục            | Trường                                                            | Cần khởi động lại? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kênh            | `channels.*`, `web` (WhatsApp) — tất cả kênh tích hợp sẵn và kênh Plugin | Không              |
| Tác nhân và mô hình      | `agent`, `agents`, `models`, `routing`                            | Không              |
| Tự động hóa          | `hooks`, `cron`, `agent.heartbeat`                                | Không              |
| Phiên và tin nhắn | `session`, `messages`                                             | Không              |
| Công cụ và phương tiện       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Không              |
| UI và mục khác           | `ui`, `logging`, `identity`, `bindings`                           | Không              |
| Máy chủ Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Có**         |
| Hạ tầng      | `discovery`, `canvasHost`, `plugins`                              | **Có**         |

<Note>
`gateway.reload` và `gateway.remote` là ngoại lệ — việc thay đổi chúng **không** kích hoạt khởi động lại.
</Note>

### Lập kế hoạch tải lại

Khi bạn chỉnh sửa một tệp nguồn được tham chiếu qua `$include`, OpenClaw lập kế hoạch
tải lại từ bố cục do nguồn định nghĩa, không phải chế độ xem trong bộ nhớ đã được làm phẳng.
Điều đó giúp các quyết định tải lại nóng (áp dụng nóng so với khởi động lại) có thể dự đoán được ngay cả khi một
mục cấp cao duy nhất nằm trong tệp được bao gồm riêng của nó, chẳng hạn như
`plugins: { $include: "./plugins.json5" }`. Lập kế hoạch tải lại sẽ thất bại theo hướng đóng nếu
bố cục nguồn không rõ ràng.

## Config RPC (cập nhật bằng chương trình)

Đối với công cụ ghi cấu hình qua API Gateway, ưu tiên luồng này:

- `config.schema.lookup` để kiểm tra một cây con (nút schema nông + tóm tắt
  con)
- `config.get` để lấy snapshot hiện tại cùng với `hash`
- `config.patch` cho cập nhật một phần (JSON merge patch: object được hợp nhất, `null`
  xóa, mảng thay thế)
- `config.apply` chỉ khi bạn định thay thế toàn bộ cấu hình
- `update.run` để tự cập nhật rõ ràng kèm khởi động lại
- `update.status` để kiểm tra sentinel khởi động lại cập nhật mới nhất và xác minh phiên bản đang chạy sau khi khởi động lại

Các tác nhân nên xem `config.schema.lookup` là điểm dừng đầu tiên để lấy tài liệu và ràng buộc
chính xác ở cấp trường. Dùng [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
khi họ cần bản đồ cấu hình rộng hơn, giá trị mặc định, hoặc liên kết đến các tham chiếu
hệ thống con chuyên biệt.

<Note>
Các thao tác ghi control-plane (`config.apply`, `config.patch`, `update.run`) bị
giới hạn tốc độ ở mức 3 yêu cầu mỗi 60 giây cho mỗi `deviceId+clientIp`. Các yêu cầu
khởi động lại sẽ được gộp lại rồi áp dụng thời gian hồi 30 giây giữa các chu kỳ khởi động lại.
`update.status` chỉ đọc nhưng thuộc phạm vi admin vì sentinel khởi động lại có thể
bao gồm tóm tắt bước cập nhật và phần cuối đầu ra lệnh.
</Note>

Ví dụ patch một phần:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Cả `config.apply` và `config.patch` đều chấp nhận `raw`, `baseHash`, `sessionKey`,
`note`, và `restartDelayMs`. `baseHash` là bắt buộc cho cả hai phương thức khi một
cấu hình đã tồn tại.

## Biến môi trường

OpenClaw đọc biến môi trường từ tiến trình cha cùng với:

- `.env` từ thư mục làm việc hiện tại (nếu có)
- `~/.openclaw/.env` (dự phòng toàn cục)

Không tệp nào ghi đè các biến môi trường hiện có. Bạn cũng có thể đặt biến môi trường nội tuyến trong cấu hình:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Nhập env shell (tùy chọn)">
  Nếu được bật và các khóa mong đợi chưa được đặt, OpenClaw chạy shell đăng nhập của bạn và chỉ nhập các khóa còn thiếu:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Biến môi trường tương đương: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Thay thế biến môi trường trong giá trị cấu hình">
  Tham chiếu biến môi trường trong bất kỳ giá trị chuỗi cấu hình nào bằng `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Quy tắc:

- Chỉ khớp tên viết hoa: `[A-Z_][A-Z0-9_]*`
- Biến thiếu/rỗng sẽ gây lỗi khi tải
- Escape bằng `$${VAR}` để xuất literal
- Hoạt động bên trong các tệp `$include`
- Thay thế nội tuyến: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Tham chiếu bí mật (env, file, exec)">
  Đối với các trường hỗ trợ object SecretRef, bạn có thể dùng:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Chi tiết SecretRef (bao gồm `secrets.providers` cho `env`/`file`/`exec`) nằm trong [Quản lý bí mật](/vi/gateway/secrets).
Các đường dẫn thông tin xác thực được hỗ trợ được liệt kê trong [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Accordion>

Xem [Môi trường](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên và nguồn.

## Tham chiếu đầy đủ

Để xem tham chiếu đầy đủ theo từng trường, xem **[Tham chiếu cấu hình](/vi/gateway/configuration-reference)**.

---

_Liên quan: [Ví dụ cấu hình](/vi/gateway/configuration-examples) · [Tham chiếu cấu hình](/vi/gateway/configuration-reference) · [Doctor](/vi/gateway/doctor)_

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
- [Runbook Gateway](/vi/gateway)
