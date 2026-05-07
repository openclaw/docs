---
read_when:
    - Thiết lập OpenClaw lần đầu tiên
    - Đang tìm các mẫu cấu hình phổ biến
    - Điều hướng đến các phần cấu hình cụ thể
summary: 'Tổng quan về cấu hình: các tác vụ thường gặp, thiết lập nhanh và liên kết đến tài liệu tham chiếu đầy đủ'
title: Cấu hình
x-i18n:
    generated_at: "2026-05-07T13:17:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: b64a49882b8649280fc4f4e39bf025ccc1bdf6a813b7940a6d57ee857aea5a77
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw đọc cấu hình <Tooltip tip="JSON5 hỗ trợ chú thích và dấu phẩy cuối">**JSON5**</Tooltip> tùy chọn từ `~/.openclaw/openclaw.json`.
Đường dẫn cấu hình đang hoạt động phải là một tệp thông thường. Các bố cục `openclaw.json`
dạng liên kết tượng trưng không được hỗ trợ cho các thao tác ghi do OpenClaw sở hữu; một thao tác ghi nguyên tử có thể thay thế
đường dẫn thay vì giữ nguyên liên kết tượng trưng. Nếu bạn giữ cấu hình bên ngoài
thư mục trạng thái mặc định, hãy trỏ `OPENCLAW_CONFIG_PATH` trực tiếp đến tệp thật.

Nếu thiếu tệp này, OpenClaw dùng các giá trị mặc định an toàn. Các lý do phổ biến để thêm cấu hình:

- Kết nối các kênh và kiểm soát ai có thể nhắn tin cho bot
- Thiết lập mô hình, công cụ, sandboxing hoặc tự động hóa (cron, hook)
- Tinh chỉnh phiên, phương tiện, mạng hoặc UI

Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/configuration-reference) cho mọi trường có sẵn.

Agent và tự động hóa nên dùng `config.schema.lookup` để lấy tài liệu chính xác
ở cấp trường trước khi chỉnh sửa cấu hình. Dùng trang này cho hướng dẫn theo tác vụ và
[Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) cho bản đồ trường
rộng hơn và các giá trị mặc định.

<Tip>
**Bạn mới cấu hình lần đầu?** Bắt đầu với `openclaw onboard` để thiết lập tương tác, hoặc xem hướng dẫn [Ví dụ cấu hình](/vi/gateway/configuration-examples) để có các cấu hình hoàn chỉnh có thể sao chép và dán.
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
  <Tab title="CLI (một dòng lệnh)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Mở [http://127.0.0.1:18789](http://127.0.0.1:18789) và dùng tab **Cấu hình**.
    Control UI kết xuất biểu mẫu từ schema cấu hình đang chạy, bao gồm metadata tài liệu
    `title` / `description` của trường, cùng schema của plugin và kênh khi
    có sẵn, với trình chỉnh sửa **JSON thô** làm lối thoát. Đối với các UI
    đi sâu theo cấp và công cụ khác, gateway cũng cung cấp `config.schema.lookup` để
    lấy một node schema theo phạm vi đường dẫn cùng các tóm tắt con trực tiếp.
  </Tab>
  <Tab title="Chỉnh sửa trực tiếp">
    Chỉnh sửa trực tiếp `~/.openclaw/openclaw.json`. Gateway theo dõi tệp và tự động áp dụng thay đổi (xem [tải lại nóng](#config-hot-reload)).
  </Tab>
</Tabs>

## Xác thực nghiêm ngặt

<Warning>
OpenClaw chỉ chấp nhận các cấu hình khớp hoàn toàn với schema. Khóa không xác định, kiểu sai định dạng hoặc giá trị không hợp lệ khiến Gateway **từ chối khởi động**. Ngoại lệ duy nhất ở cấp gốc là `$schema` (chuỗi), để trình chỉnh sửa có thể gắn metadata JSON Schema.
</Warning>

`openclaw config schema` in JSON Schema chuẩn được Control UI
và quy trình xác thực dùng. `config.schema.lookup` lấy một node theo phạm vi đường dẫn cùng
các tóm tắt con cho công cụ đi sâu theo cấp. Metadata tài liệu `title`/`description` của trường
được truyền qua các đối tượng lồng nhau, wildcard (`*`), phần tử mảng (`[]`), và các nhánh `anyOf`/
`oneOf`/`allOf`. Schema plugin và kênh trong runtime được hợp nhất khi
manifest registry được tải.

Khi xác thực thất bại:

- Gateway không khởi động
- Chỉ các lệnh chẩn đoán hoạt động (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Chạy `openclaw doctor` để xem vấn đề chính xác
- Chạy `openclaw doctor --fix` (hoặc `--yes`) để áp dụng sửa chữa

Gateway giữ một bản sao last-known-good đáng tin cậy sau mỗi lần khởi động thành công,
nhưng quá trình khởi động và tải lại nóng không tự động khôi phục bản đó. Nếu `openclaw.json`
không vượt qua xác thực (bao gồm xác thực cục bộ của plugin), quá trình khởi động Gateway thất bại hoặc
lần tải lại bị bỏ qua và runtime hiện tại giữ cấu hình được chấp nhận gần nhất.
Chạy `openclaw doctor --fix` (hoặc `--yes`) để sửa cấu hình bị thêm tiền tố/bị ghi đè hoặc
khôi phục bản sao last-known-good. Việc quảng bá lên last-known-good bị bỏ qua khi một
ứng viên chứa placeholder bí mật đã được biên tập như `***`.

## Tác vụ phổ biến

<AccordionGroup>
  <Accordion title="Thiết lập một kênh (WhatsApp, Telegram, Discord, v.v.)">
    Mỗi kênh có phần cấu hình riêng dưới `channels.<provider>`. Xem trang kênh chuyên biệt để biết các bước thiết lập:

    - [WhatsApp](/vi/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/vi/channels/telegram) - `channels.telegram`
    - [Discord](/vi/channels/discord) - `channels.discord`
    - [Feishu](/vi/channels/feishu) - `channels.feishu`
    - [Google Chat](/vi/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/vi/channels/msteams) - `channels.msteams`
    - [Slack](/vi/channels/slack) - `channels.slack`
    - [Signal](/vi/channels/signal) - `channels.signal`
    - [iMessage](/vi/channels/imessage) - `channels.imessage`
    - [Mattermost](/vi/channels/mattermost) - `channels.mattermost`

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

  <Accordion title="Chọn và cấu hình mô hình">
    Đặt mô hình chính và các mô hình dự phòng tùy chọn:

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

    - `agents.defaults.models` định nghĩa danh mục mô hình và đóng vai trò allowlist cho `/model`.
    - Dùng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm mục allowlist mà không xóa các mô hình hiện có. Các thao tác thay thế thuần túy có thể xóa mục sẽ bị từ chối trừ khi bạn truyền `--replace`.
    - Tham chiếu mô hình dùng định dạng `provider/model` (ví dụ `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kiểm soát việc giảm kích thước hình ảnh transcript/công cụ (mặc định `1200`); giá trị thấp hơn thường giảm mức dùng vision-token trong các lượt chạy có nhiều ảnh chụp màn hình.
    - Xem [CLI mô hình](/vi/concepts/models) để chuyển đổi mô hình trong chat và [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) để biết hành vi xoay vòng xác thực và dự phòng.
    - Với nhà cung cấp tùy chỉnh/tự host, xem [Nhà cung cấp tùy chỉnh](/vi/gateway/config-tools#custom-providers-and-base-urls) trong tài liệu tham chiếu.

  </Accordion>

  <Accordion title="Kiểm soát ai có thể nhắn tin cho bot">
    Quyền truy cập DM được kiểm soát theo từng kênh qua `dmPolicy`:

    - `"pairing"` (mặc định): người gửi không xác định nhận mã ghép đôi dùng một lần để phê duyệt
    - `"allowlist"`: chỉ người gửi trong `allowFrom` (hoặc kho cho phép đã ghép đôi)
    - `"open"`: cho phép tất cả DM gửi vào (yêu cầu `allowFrom: ["*"]`)
    - `"disabled"`: bỏ qua tất cả DM

    Với nhóm, dùng `groupPolicy` + `groupAllowFrom` hoặc allowlist riêng theo kênh.

    Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-channels#dm-and-group-access) để biết chi tiết theo từng kênh.

  </Accordion>

  <Accordion title="Thiết lập cổng kiểm soát nhắc tên trong chat nhóm">
    Tin nhắn nhóm mặc định **yêu cầu nhắc tên**. Cấu hình mẫu kích hoạt theo từng agent, và giữ các trả lời phòng hiển thị trên đường dẫn message-tool mặc định trừ khi bạn chủ ý muốn dùng trả lời cuối tự động kiểu cũ:

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

    - **Nhắc tên bằng metadata**: @-mention gốc (nhấn để nhắc tên trong WhatsApp, Telegram @bot, v.v.)
    - **Mẫu văn bản**: mẫu regex an toàn trong `mentionPatterns`
    - **Trả lời hiển thị**: `messages.visibleReplies` có thể yêu cầu gửi bằng message-tool trên toàn cục; `messages.groupChat.visibleReplies` ghi đè điều đó cho nhóm/kênh.
    - Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-channels#group-chat-mention-gating) để biết các chế độ trả lời hiển thị, ghi đè theo kênh và chế độ tự chat.

  </Accordion>

  <Accordion title="Giới hạn skills theo từng agent">
    Dùng `agents.defaults.skills` làm baseline dùng chung, rồi ghi đè các
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

    - Bỏ qua `agents.defaults.skills` để mặc định không giới hạn skills.
    - Bỏ qua `agents.list[].skills` để kế thừa mặc định.
    - Đặt `agents.list[].skills: []` để không có skills.
    - Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config), và
      [Tài liệu tham chiếu cấu hình](/vi/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tinh chỉnh giám sát sức khỏe kênh gateway">
    Kiểm soát mức độ chủ động gateway khởi động lại các kênh có vẻ stale:

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
    - Dùng `channels.<provider>.healthMonitor.enabled` hoặc `channels.<provider>.accounts.<id>.healthMonitor.enabled` để tắt tự động khởi động lại cho một kênh hoặc tài khoản mà không tắt trình giám sát toàn cục.
    - Xem [Kiểm tra sức khỏe](/vi/gateway/health) để gỡ lỗi vận hành và [tài liệu tham chiếu đầy đủ](/vi/gateway/configuration-reference#gateway) cho tất cả trường.

  </Accordion>

  <Accordion title="Tinh chỉnh thời gian chờ bắt tay WebSocket của gateway">
    Cho client cục bộ thêm thời gian để hoàn tất bắt tay WebSocket trước xác thực trên
    các host đang tải cao hoặc công suất thấp:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Mặc định là `15000` mili giây.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` vẫn được ưu tiên cho các ghi đè dịch vụ hoặc shell dùng một lần.
    - Nên sửa tình trạng stall khi khởi động/event-loop trước; nút chỉnh này dành cho host khỏe mạnh nhưng chậm trong lúc khởi động nóng.

  </Accordion>

  <Accordion title="Cấu hình phiên và đặt lại">
    Phiên kiểm soát tính liên tục và cô lập của cuộc trò chuyện:

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
    - `threadBindings`: mặc định toàn cục cho định tuyến phiên gắn với luồng (Discord hỗ trợ `/focus`, `/unfocus`, `/agents`, `/session idle`, và `/session max-age`).
    - Xem [Quản lý phiên](/vi/concepts/session) để biết phạm vi, liên kết danh tính và chính sách gửi.
    - Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-agents#session) cho tất cả trường.

  </Accordion>

  <Accordion title="Bật sandboxing">
    Chạy các phiên agent trong runtime sandbox tách biệt:

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

    Trước tiên hãy build image - từ một source checkout, chạy `scripts/sandbox-setup.sh`, hoặc từ bản cài npm, xem lệnh `docker build` nội tuyến trong [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup).

    Xem [Sandboxing](/vi/gateway/sandboxing) để đọc hướng dẫn đầy đủ và [tham chiếu đầy đủ](/vi/gateway/config-agents#agentsdefaultssandbox) cho tất cả tùy chọn.

  </Accordion>

  <Accordion title="Bật push dựa trên relay cho các bản build iOS chính thức">
    Push dựa trên relay được cấu hình trong `openclaw.json`.

    Đặt mục này trong cấu hình gateway:

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

    Tương đương CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Việc này thực hiện:

    - Cho phép gateway gửi `push.test`, các nhắc đánh thức và đánh thức kết nối lại qua relay bên ngoài.
    - Dùng quyền gửi theo phạm vi đăng ký do ứng dụng iOS đã ghép đôi chuyển tiếp. Gateway không cần token relay trên toàn bộ deployment.
    - Ràng buộc từng đăng ký dựa trên relay với danh tính gateway mà ứng dụng iOS đã ghép đôi, nên gateway khác không thể tái sử dụng đăng ký đã lưu.
    - Giữ các bản build iOS cục bộ/thủ công dùng APNs trực tiếp. Gửi dựa trên relay chỉ áp dụng cho các bản build được phân phối chính thức đã đăng ký qua relay.
    - Phải khớp với URL cơ sở relay được nhúng trong bản build iOS chính thức/TestFlight, để lưu lượng đăng ký và gửi đi tới cùng một deployment relay.

    Luồng đầu cuối:

    1. Cài đặt một bản build iOS chính thức/TestFlight được biên dịch với cùng URL cơ sở relay.
    2. Cấu hình `gateway.push.apns.relay.baseUrl` trên gateway.
    3. Ghép đôi ứng dụng iOS với gateway và để cả phiên node lẫn phiên operator kết nối.
    4. Ứng dụng iOS lấy danh tính gateway, đăng ký với relay bằng App Attest cộng với biên nhận ứng dụng, rồi phát payload `push.apns.register` dựa trên relay tới gateway đã ghép đôi.
    5. Gateway lưu handle relay và quyền gửi, rồi dùng chúng cho `push.test`, các nhắc đánh thức và đánh thức kết nối lại.

    Ghi chú vận hành:

    - Nếu bạn chuyển ứng dụng iOS sang một gateway khác, hãy kết nối lại ứng dụng để ứng dụng có thể phát một đăng ký relay mới ràng buộc với gateway đó.
    - Nếu bạn phát hành một bản build iOS mới trỏ tới một deployment relay khác, ứng dụng sẽ làm mới đăng ký relay đã lưu trong bộ nhớ đệm thay vì tái sử dụng origin relay cũ.

    Ghi chú tương thích:

    - `OPENCLAW_APNS_RELAY_BASE_URL` và `OPENCLAW_APNS_RELAY_TIMEOUT_MS` vẫn hoạt động như các ghi đè env tạm thời.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` vẫn là lối thoát phát triển chỉ dành cho loopback; không lưu URL relay HTTP lâu dài trong cấu hình.

    Xem [Ứng dụng iOS](/vi/platforms/ios#relay-backed-push-for-official-builds) để biết luồng đầu cuối và [Luồng xác thực và tin cậy](/vi/platforms/ios#authentication-and-trust-flow) để biết mô hình bảo mật relay.

  </Accordion>

  <Accordion title="Thiết lập Heartbeat (check-in định kỳ)">
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

  <Accordion title="Cấu hình Cron jobs">
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

    - `sessionRetention`: dọn dẹp các phiên chạy tách biệt đã hoàn tất khỏi `sessions.json` (mặc định `24h`; đặt `false` để tắt).
    - `runLog`: dọn dẹp `cron/runs/<jobId>.jsonl` theo kích thước và số dòng được giữ lại.
    - Xem [Cron jobs](/vi/automation/cron-jobs) để biết tổng quan tính năng và ví dụ CLI.

  </Accordion>

  <Accordion title="Thiết lập Webhook (hooks)">
    Bật các endpoint HTTP Webhook trên Gateway:

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
    - Xem mọi nội dung payload hook/Webhook là dữ liệu đầu vào không đáng tin cậy.
    - Dùng một `hooks.token` chuyên dụng; không tái sử dụng token Gateway dùng chung.
    - Xác thực hook chỉ dùng header (`Authorization: Bearer ...` hoặc `x-openclaw-token`); token trong query string bị từ chối.
    - `hooks.path` không được là `/`; giữ ingress Webhook trên một subpath chuyên dụng như `/hooks`.
    - Giữ các cờ bỏ qua nội dung không an toàn ở trạng thái tắt (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) trừ khi đang gỡ lỗi trong phạm vi rất chặt.
    - Nếu bạn bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để giới hạn các session key do caller chọn.
    - Với các agent do hook điều khiển, ưu tiên các tier model hiện đại mạnh và chính sách tool nghiêm ngặt (ví dụ chỉ nhắn tin cộng với sandboxing khi có thể).

    Xem [tham chiếu đầy đủ](/vi/gateway/configuration-reference#hooks) cho tất cả tùy chọn mapping và tích hợp Gmail.

  </Accordion>

  <Accordion title="Cấu hình định tuyến đa agent">
    Chạy nhiều agent tách biệt với workspace và phiên riêng:

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

    Xem [Multi-Agent](/vi/concepts/multi-agent) và [tham chiếu đầy đủ](/vi/gateway/config-agents#multi-agent-routing) để biết quy tắc binding và hồ sơ truy cập theo từng agent.

  </Accordion>

  <Accordion title="Tách cấu hình thành nhiều tệp ($include)">
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

    - **Một tệp**: thay thế object chứa nó
    - **Mảng tệp**: deep-merge theo thứ tự (mục sau thắng)
    - **Khóa sibling**: được merge sau include (ghi đè các giá trị được include)
    - **Include lồng nhau**: hỗ trợ sâu tối đa 10 cấp
    - **Đường dẫn tương đối**: được resolve tương đối với tệp đang include
    - **Ghi do OpenClaw sở hữu**: khi một lần ghi chỉ thay đổi một section cấp cao nhất
      được backing bởi include một tệp như `plugins: { $include: "./plugins.json5" }`,
      OpenClaw cập nhật tệp được include đó và giữ nguyên `openclaw.json`
    - **Write-through không được hỗ trợ**: root include, mảng include và include
      có ghi đè sibling sẽ fail closed cho các lần ghi do OpenClaw sở hữu thay vì
      làm phẳng cấu hình
    - **Giam phạm vi**: đường dẫn `$include` phải resolve bên dưới thư mục chứa
      `openclaw.json`. Để chia sẻ một cây giữa nhiều máy hoặc người dùng, đặt
      `OPENCLAW_INCLUDE_ROOTS` thành danh sách đường dẫn (`:` trên POSIX, `;` trên Windows) gồm
      các thư mục bổ sung mà include có thể tham chiếu. Symlink được resolve
      và kiểm tra lại, nên một đường dẫn về mặt chữ nằm trong thư mục cấu hình nhưng
      đích thực của nó thoát khỏi mọi root được phép vẫn bị từ chối.
    - **Xử lý lỗi**: lỗi rõ ràng cho tệp bị thiếu, lỗi parse và include vòng

  </Accordion>
</AccordionGroup>

## Tải lại nóng cấu hình

Gateway theo dõi `~/.openclaw/openclaw.json` và tự động áp dụng thay đổi - hầu hết thiết lập không cần khởi động lại thủ công.

Các chỉnh sửa tệp trực tiếp được xem là không đáng tin cậy cho đến khi chúng vượt qua xác thực. Watcher chờ
các thao tác temp-write/rename của trình soạn thảo ổn định, đọc tệp cuối cùng, và từ chối
các chỉnh sửa bên ngoài không hợp lệ mà không ghi lại `openclaw.json`. Các lần ghi cấu hình
do OpenClaw sở hữu dùng cùng cổng schema trước khi ghi; các lần clobber phá hoại như
xóa `gateway.mode` hoặc thu nhỏ tệp hơn một nửa sẽ bị từ chối và
được lưu dưới dạng `.rejected.*` để kiểm tra.

Nếu bạn thấy `config reload skipped (invalid config)` hoặc khi khởi động báo `Invalid
config`, hãy kiểm tra cấu hình, chạy `openclaw config validate`, rồi chạy `openclaw
doctor --fix` để sửa chữa. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config)
để biết checklist.

### Chế độ tải lại

| Chế độ                | Hành vi                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (mặc định) | Áp dụng nóng ngay các thay đổi an toàn. Tự động khởi động lại cho các thay đổi quan trọng. |
| **`hot`**             | Chỉ áp dụng nóng các thay đổi an toàn. Ghi warning khi cần khởi động lại - bạn tự xử lý. |
| **`restart`**         | Khởi động lại Gateway khi có bất kỳ thay đổi cấu hình nào, an toàn hay không.            |
| **`off`**             | Tắt theo dõi tệp. Thay đổi có hiệu lực ở lần khởi động lại thủ công tiếp theo.           |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Những gì áp dụng nóng so với những gì cần khởi động lại

Hầu hết các trường áp dụng nóng mà không có thời gian gián đoạn. Ở chế độ `hybrid`, các thay đổi cần khởi động lại được xử lý tự động.

| Danh mục            | Trường                                                           | Cần khởi động lại? |
| ------------------- | ---------------------------------------------------------------- | ------------------ |
| Kênh                | `channels.*`, `web` (WhatsApp) - tất cả kênh tích hợp và Plugin | Không              |
| Agent & model       | `agent`, `agents`, `models`, `routing`                           | Không              |
| Tự động hóa         | `hooks`, `cron`, `agent.heartbeat`                               | Không              |
| Phiên & tin nhắn    | `session`, `messages`                                            | Không              |
| Tool & media        | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`             | Không              |
| UI & mục khác       | `ui`, `logging`, `identity`, `bindings`                          | Không              |
| Máy chủ Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)             | **Có**             |
| Hạ tầng             | `discovery`, `plugins`                                           | **Có**             |

<Note>
`gateway.reload` và `gateway.remote` là ngoại lệ - thay đổi chúng **không** kích hoạt khởi động lại.
</Note>

### Lập kế hoạch tải lại

Khi bạn chỉnh sửa một tệp nguồn được tham chiếu qua `$include`, OpenClaw lập kế hoạch
tải lại từ bố cục do nguồn định nghĩa, không phải dạng xem trong bộ nhớ đã được làm phẳng.
Điều đó giúp các quyết định hot-reload (hot-apply so với restart) dễ dự đoán ngay cả khi một
phần cấp cao duy nhất nằm trong tệp được include riêng, chẳng hạn như
`plugins: { $include: "./plugins.json5" }`. Việc lập kế hoạch tải lại sẽ thất bại đóng nếu
bố cục nguồn không rõ ràng.

## RPC cấu hình (cập nhật bằng chương trình)

Đối với công cụ ghi cấu hình qua API Gateway, hãy ưu tiên luồng này:

- `config.schema.lookup` để kiểm tra một cây con (nút schema nông + tóm tắt
  con)
- `config.get` để lấy snapshot hiện tại cùng với `hash`
- `config.patch` cho các cập nhật một phần (JSON merge patch: object được merge, `null`
  xóa, array thay thế)
- `config.apply` chỉ khi bạn định thay thế toàn bộ cấu hình
- `update.run` để tự cập nhật rõ ràng kèm restart; thêm `continuationMessage` khi phiên sau restart cần chạy một lượt tiếp theo
- `update.status` để kiểm tra sentinel restart cập nhật mới nhất và xác minh phiên bản đang chạy sau restart

Agent nên xem `config.schema.lookup` là điểm bắt đầu để có tài liệu và ràng buộc chính xác
ở cấp trường. Dùng [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
khi cần bản đồ cấu hình rộng hơn, giá trị mặc định, hoặc liên kết đến các tham chiếu hệ thống con
chuyên biệt.

<Note>
Các thao tác ghi control-plane (`config.apply`, `config.patch`, `update.run`) bị
giới hạn tốc độ ở mức 3 yêu cầu mỗi 60 giây cho mỗi `deviceId+clientIp`. Các yêu cầu
restart được gộp lại rồi áp dụng thời gian chờ 30 giây giữa các chu kỳ restart.
`update.status` là chỉ đọc nhưng thuộc phạm vi quản trị vì sentinel restart có thể
bao gồm tóm tắt bước cập nhật và phần cuối output lệnh.
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

OpenClaw đọc biến môi trường từ tiến trình cha, cộng thêm:

- `.env` từ thư mục làm việc hiện tại (nếu có)
- `~/.openclaw/.env` (dự phòng toàn cục)

Không tệp nào ghi đè các biến môi trường hiện có. Bạn cũng có thể đặt biến môi trường inline trong cấu hình:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Nhập env shell (tùy chọn)">
  Nếu được bật và các khóa mong đợi chưa được đặt, OpenClaw chạy login shell của bạn và chỉ nhập các khóa còn thiếu:

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
- Thay thế inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Chi tiết SecretRef (bao gồm `secrets.providers` cho `env`/`file`/`exec`) có trong [Quản lý bí mật](/vi/gateway/secrets).
Các đường dẫn thông tin xác thực được hỗ trợ được liệt kê trong [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Accordion>

Xem [Môi trường](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên và nguồn.

## Tham chiếu đầy đủ

Để xem tham chiếu đầy đủ theo từng trường, hãy xem **[Tham chiếu cấu hình](/vi/gateway/configuration-reference)**.

---

_Liên quan: [Ví dụ cấu hình](/vi/gateway/configuration-examples) · [Tham chiếu cấu hình](/vi/gateway/configuration-reference) · [Doctor](/vi/gateway/doctor)_

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
- [Runbook Gateway](/vi/gateway)
