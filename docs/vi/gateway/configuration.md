---
read_when:
    - Thiết lập OpenClaw lần đầu tiên
    - Đang tìm các mẫu cấu hình phổ biến
    - Điều hướng đến các phần cấu hình cụ thể
summary: 'Tổng quan cấu hình: các tác vụ phổ biến, thiết lập nhanh và liên kết đến tài liệu tham khảo đầy đủ'
title: Cấu hình
x-i18n:
    generated_at: "2026-06-27T17:28:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw đọc cấu hình <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> tùy chọn từ `~/.openclaw/openclaw.json`.
Đường dẫn cấu hình đang hoạt động phải là một tệp thông thường. Bố cục
`openclaw.json` dạng liên kết tượng trưng không được hỗ trợ cho các thao tác ghi
do OpenClaw sở hữu; thao tác ghi nguyên tử có thể thay thế đường dẫn thay vì giữ
nguyên liên kết tượng trưng. Nếu bạn giữ cấu hình bên ngoài thư mục trạng thái
mặc định, hãy trỏ `OPENCLAW_CONFIG_PATH` trực tiếp đến tệp thật.

Nếu thiếu tệp này, OpenClaw dùng các giá trị mặc định an toàn. Các lý do phổ biến để thêm cấu hình:

- Kết nối các kênh và kiểm soát ai có thể nhắn tin cho bot
- Đặt mô hình, công cụ, cô lập sandbox, hoặc tự động hóa (cron, hook)
- Tinh chỉnh phiên, phương tiện, mạng, hoặc UI

Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/configuration-reference) để biết mọi trường có sẵn.

Agent và tự động hóa nên dùng `config.schema.lookup` để xem tài liệu chính xác
ở cấp trường trước khi chỉnh sửa cấu hình. Dùng trang này cho hướng dẫn theo
tác vụ và [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) cho
bản đồ trường rộng hơn cùng các giá trị mặc định.

<Tip>
**Mới làm quen với cấu hình?** Bắt đầu với `openclaw onboard` để thiết lập tương tác, hoặc xem hướng dẫn [Ví dụ cấu hình](/vi/gateway/configuration-examples) để có các cấu hình hoàn chỉnh có thể sao chép và dán.
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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Mở [http://127.0.0.1:18789](http://127.0.0.1:18789) và dùng tab **Cấu hình**.
    Giao diện điều khiển kết xuất một biểu mẫu từ schema cấu hình trực tiếp, bao gồm siêu dữ liệu tài liệu
    `title` / `description` của trường, cùng schema Plugin và kênh khi
    có sẵn, với trình chỉnh sửa **JSON thô** như một lối thoát. Đối với các UI
    đi sâu chi tiết và công cụ khác, Gateway cũng cung cấp `config.schema.lookup` để
    lấy một nút schema theo phạm vi đường dẫn cùng phần tóm tắt các con trực tiếp.
  </Tab>
  <Tab title="Direct edit">
    Chỉnh sửa trực tiếp `~/.openclaw/openclaw.json`. Gateway theo dõi tệp và tự động áp dụng thay đổi (xem [tải lại nóng](#config-hot-reload)).
  </Tab>
</Tabs>

## Xác thực nghiêm ngặt

<Warning>
OpenClaw chỉ chấp nhận các cấu hình khớp hoàn toàn với schema. Khóa không xác định, kiểu sai định dạng, hoặc giá trị không hợp lệ khiến Gateway **từ chối khởi động**. Ngoại lệ duy nhất ở cấp gốc là `$schema` (chuỗi), để trình chỉnh sửa có thể gắn siêu dữ liệu JSON Schema.
</Warning>

`openclaw config schema` in JSON Schema chuẩn được Giao diện điều khiển
và quy trình xác thực sử dụng. `config.schema.lookup` lấy một nút theo phạm vi đường dẫn
cùng phần tóm tắt con cho công cụ đi sâu chi tiết. Siêu dữ liệu tài liệu `title`/`description`
của trường được truyền qua các đối tượng lồng nhau, nhánh ký tự đại diện (`*`), mục mảng (`[]`), và các nhánh `anyOf`/
`oneOf`/`allOf`. Schema Plugin và kênh lúc chạy được hợp nhất khi
sổ đăng ký manifest đã được tải.

Khi xác thực thất bại:

- Gateway không khởi động
- Chỉ các lệnh chẩn đoán hoạt động (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Chạy `openclaw doctor` để xem các vấn đề chính xác
- Chạy `openclaw doctor --fix` (hoặc `--yes`) để áp dụng sửa chữa

Gateway giữ một bản sao đáng tin cậy đã biết là tốt gần nhất sau mỗi lần khởi động thành công,
nhưng khởi động và tải lại nóng không tự động khôi phục bản đó. Nếu `openclaw.json`
không vượt qua xác thực (bao gồm xác thực cục bộ của Plugin), Gateway khởi động thất bại hoặc
lần tải lại bị bỏ qua và runtime hiện tại giữ cấu hình được chấp nhận gần nhất.
Chạy `openclaw doctor --fix` (hoặc `--yes`) để sửa cấu hình bị thêm tiền tố/bị ghi đè hoặc
khôi phục bản sao đã biết là tốt gần nhất. Việc thăng cấp thành bản đã biết là tốt gần nhất bị bỏ qua khi
ứng viên chứa placeholder bí mật đã bị biên tập lại như `***`.

## Tác vụ phổ biến

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
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

    Tất cả kênh dùng chung mẫu chính sách DM:

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

  <Accordion title="Choose and configure models">
    Đặt mô hình chính và các phương án dự phòng tùy chọn:

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

    - `agents.defaults.models` xác định danh mục mô hình và đóng vai trò là danh sách cho phép cho `/model`; các mục `provider/*` lọc `/model`, `/models` và bộ chọn mô hình theo các nhà cung cấp đã chọn trong khi vẫn dùng cơ chế phát hiện mô hình động.
    - Dùng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm mục vào danh sách cho phép mà không xóa các mô hình hiện có. Các thao tác thay thế thuần túy có thể xóa mục sẽ bị từ chối trừ khi bạn truyền `--replace`.
    - Tham chiếu mô hình dùng định dạng `provider/model` (ví dụ `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kiểm soát việc thu nhỏ hình ảnh trong bản ghi/tool (mặc định `1200`); giá trị thấp hơn thường giảm mức dùng token thị giác trong các lần chạy có nhiều ảnh chụp màn hình.
    - Xem [CLI mô hình](/vi/concepts/models) để chuyển đổi mô hình trong trò chuyện và [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) để biết về xoay vòng xác thực và hành vi dự phòng.
    - Với nhà cung cấp tùy chỉnh/tự lưu trữ, xem [Nhà cung cấp tùy chỉnh](/vi/gateway/config-tools#custom-providers-and-base-urls) trong tài liệu tham chiếu.

  </Accordion>

  <Accordion title="Kiểm soát ai có thể nhắn tin cho bot">
    Quyền truy cập DM được kiểm soát theo từng kênh qua `dmPolicy`:

    - `"pairing"` (mặc định): người gửi chưa biết sẽ nhận mã ghép nối một lần để phê duyệt
    - `"allowlist"`: chỉ người gửi trong `allowFrom` (hoặc kho cho phép đã ghép nối)
    - `"open"`: cho phép tất cả DM đến (yêu cầu `allowFrom: ["*"]`)
    - `"disabled"`: bỏ qua tất cả DM

    Với nhóm, dùng `groupPolicy` + `groupAllowFrom` hoặc danh sách cho phép riêng theo kênh.

    Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-channels#dm-and-group-access) để biết chi tiết theo từng kênh.

  </Accordion>

  <Accordion title="Thiết lập cổng nhắc tên trong trò chuyện nhóm">
    Tin nhắn nhóm mặc định **yêu cầu nhắc tên**. Cấu hình mẫu kích hoạt theo từng agent. Các phản hồi nhóm/kênh thông thường được đăng tự động; hãy chọn dùng đường dẫn message-tool cho phòng dùng chung nơi agent nên quyết định khi nào cần lên tiếng:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **Nhắc tên bằng siêu dữ liệu**: @-mention gốc (WhatsApp chạm để nhắc tên, Telegram @bot, v.v.)
    - **Mẫu văn bản**: mẫu regex an toàn trong `mentionPatterns`
    - **Phản hồi hiển thị**: `messages.visibleReplies` có thể yêu cầu gửi qua message-tool trên toàn cục; `messages.groupChat.visibleReplies` ghi đè cấu hình đó cho nhóm/kênh.
    - Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-channels#group-chat-mention-gating) để biết các chế độ phản hồi hiển thị, ghi đè theo kênh và chế độ tự trò chuyện.

  </Accordion>

  <Accordion title="Giới hạn Skills theo từng agent">
    Dùng `agents.defaults.skills` làm đường cơ sở dùng chung, rồi ghi đè các
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
    - Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config), và
      [Tài liệu tham chiếu cấu hình](/vi/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Điều chỉnh giám sát sức khỏe kênh Gateway">
    Kiểm soát mức độ quyết liệt mà Gateway dùng để khởi động lại các kênh có vẻ bị cũ:

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

    - Đặt `gateway.channelHealthCheckMinutes: 0` để tắt khởi động lại bằng trình giám sát sức khỏe trên toàn cục.
    - `channelStaleEventThresholdMinutes` nên lớn hơn hoặc bằng khoảng thời gian kiểm tra.
    - Dùng `channels.<provider>.healthMonitor.enabled` hoặc `channels.<provider>.accounts.<id>.healthMonitor.enabled` để tắt tự động khởi động lại cho một kênh hoặc tài khoản mà không tắt trình giám sát toàn cục.
    - Xem [Kiểm tra sức khỏe](/vi/gateway/health) để gỡ lỗi vận hành và [tài liệu tham chiếu đầy đủ](/vi/gateway/configuration-reference#gateway) cho tất cả trường.

  </Accordion>

  <Accordion title="Điều chỉnh thời gian chờ bắt tay WebSocket của Gateway">
    Cho client cục bộ thêm thời gian để hoàn tất bắt tay WebSocket trước xác thực trên
    máy chủ đang tải nặng hoặc công suất thấp:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Mặc định là `15000` mili giây.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` vẫn được ưu tiên cho các ghi đè dịch vụ hoặc shell dùng một lần.
    - Ưu tiên khắc phục tình trạng khởi động/vòng lặp sự kiện bị khựng trước; núm điều chỉnh này dành cho các máy chủ khỏe nhưng chậm trong giai đoạn khởi động nóng.

  </Accordion>

  <Accordion title="Cấu hình phiên và đặt lại">
    Phiên kiểm soát tính liên tục và cách ly của cuộc trò chuyện:

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
    - Xem [tham chiếu đầy đủ](/vi/gateway/config-agents#session) để biết tất cả trường.

  </Accordion>

  <Accordion title="Bật sandboxing">
    Chạy phiên agent trong runtime sandbox cô lập:

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

    Trước tiên hãy dựng image - từ checkout mã nguồn, chạy `scripts/sandbox-setup.sh`, hoặc từ bản cài npm, xem lệnh `docker build` nội tuyến trong [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup).

    Xem [Sandboxing](/vi/gateway/sandboxing) để đọc hướng dẫn đầy đủ và [tham chiếu đầy đủ](/vi/gateway/config-agents#agentsdefaultssandbox) để biết tất cả tùy chọn.

  </Accordion>

  <Accordion title="Bật push dựa trên relay cho bản dựng iOS chính thức">
    Push dựa trên relay cho các bản dựng App Store/TestFlight công khai dùng relay OpenClaw được lưu trữ: `https://ios-push-relay.openclaw.ai`.

    Triển khai relay tùy chỉnh cần một đường dẫn dựng/triển khai iOS riêng có chủ đích, trong đó URL relay khớp với URL relay của gateway. Nếu bạn đang dùng bản dựng relay tùy chỉnh, hãy đặt mục này trong cấu hình gateway:

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

    Cấu hình này làm gì:

    - Cho phép gateway gửi `push.test`, tín hiệu đánh thức và đánh thức kết nối lại qua relay bên ngoài.
    - Dùng quyền gửi theo phạm vi đăng ký do ứng dụng iOS đã ghép đôi chuyển tiếp. Gateway không cần token relay áp dụng cho toàn bộ triển khai.
    - Gắn mỗi đăng ký dựa trên relay với danh tính gateway mà ứng dụng iOS đã ghép đôi, để gateway khác không thể dùng lại đăng ký đã lưu.
    - Giữ các bản dựng iOS cục bộ/thủ công trên APNs trực tiếp. Gửi dựa trên relay chỉ áp dụng cho các bản dựng phân phối chính thức đã đăng ký qua relay.
    - Phải khớp với URL cơ sở relay được nhúng trong bản dựng iOS, để lưu lượng đăng ký và gửi đi tới cùng một triển khai relay.

    Luồng đầu cuối:

    1. Cài đặt bản dựng iOS chính thức/TestFlight.
    2. Tùy chọn: chỉ cấu hình `gateway.push.apns.relay.baseUrl` trên gateway khi dùng một bản dựng relay tùy chỉnh riêng có chủ đích.
    3. Ghép đôi ứng dụng iOS với gateway và để cả phiên node lẫn phiên operator kết nối.
    4. Ứng dụng iOS lấy danh tính gateway, đăng ký với relay bằng App Attest cùng biên nhận ứng dụng, rồi công bố payload `push.apns.register` dựa trên relay tới gateway đã ghép đôi.
    5. Gateway lưu handle relay và quyền gửi, rồi dùng chúng cho `push.test`, tín hiệu đánh thức và đánh thức kết nối lại.

    Ghi chú vận hành:

    - Nếu bạn chuyển ứng dụng iOS sang một gateway khác, hãy kết nối lại ứng dụng để ứng dụng có thể công bố một đăng ký relay mới gắn với gateway đó.
    - Nếu bạn phát hành bản dựng iOS mới trỏ tới một triển khai relay khác, ứng dụng sẽ làm mới đăng ký relay đã lưu trong bộ nhớ đệm thay vì dùng lại origin relay cũ.

    Ghi chú tương thích:

    - `OPENCLAW_APNS_RELAY_BASE_URL` và `OPENCLAW_APNS_RELAY_TIMEOUT_MS` vẫn hoạt động dưới dạng override env tạm thời.
    - URL relay gateway tùy chỉnh phải khớp với URL cơ sở relay được nhúng trong bản dựng iOS. Lane phát hành App Store công khai từ chối override URL relay iOS tùy chỉnh.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` vẫn là lối thoát phát triển chỉ dành cho loopback; không lưu URL relay HTTP bền vững trong cấu hình.

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
    - `directPolicy`: `allow` (mặc định) hoặc `block` cho mục tiêu heartbeat kiểu DM
    - Xem [Heartbeat](/vi/gateway/heartbeat) để đọc hướng dẫn đầy đủ.

  </Accordion>

  <Accordion title="Cấu hình công việc Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: dọn các phiên chạy cô lập đã hoàn tất khỏi `sessions.json` (mặc định `24h`; đặt `false` để tắt).
    - `runLog`: dọn các hàng lịch sử chạy cron được giữ lại theo từng công việc. `maxBytes` vẫn được chấp nhận cho nhật ký chạy cũ dựa trên tệp.
    - Xem [Công việc Cron](/vi/automation/cron-jobs) để biết tổng quan tính năng và ví dụ CLI.

  </Accordion>

  <Accordion title="Thiết lập webhooks (hooks)">
    Bật endpoint HTTP webhook trên Gateway:

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
    - Xem mọi nội dung payload hook/webhook là dữ liệu đầu vào không đáng tin cậy.
    - Dùng `hooks.token` chuyên dụng; không dùng lại bí mật xác thực Gateway đang hoạt động (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Xác thực hook chỉ qua header (`Authorization: Bearer ...` hoặc `x-openclaw-token`); token trong query string bị từ chối.
    - `hooks.path` không thể là `/`; hãy giữ ingress webhook trên một đường dẫn con chuyên dụng như `/hooks`.
    - Giữ các cờ bỏ qua nội dung không an toàn ở trạng thái tắt (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) trừ khi đang gỡ lỗi trong phạm vi rất chặt.
    - Nếu bạn bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để giới hạn khóa phiên do bên gọi chọn.
    - Với agent được kích hoạt bởi hook, ưu tiên các tầng mô hình hiện đại mạnh và chính sách công cụ nghiêm ngặt (ví dụ chỉ nhắn tin, cộng thêm sandboxing khi có thể).

    Xem [tham chiếu đầy đủ](/vi/gateway/configuration-reference#hooks) để biết tất cả tùy chọn ánh xạ và tích hợp Gmail.

  </Accordion>

  <Accordion title="Cấu hình định tuyến đa agent">
    Chạy nhiều agent cô lập với workspace và phiên riêng:

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

    Xem [Đa agent](/vi/concepts/multi-agent) và [tham chiếu đầy đủ](/vi/gateway/config-agents#multi-agent-routing) để biết quy tắc binding và hồ sơ truy cập theo từng agent.

  </Accordion>

  <Accordion title="Tách cấu hình thành nhiều tệp ($include)">
    Dùng `$include` để tổ chức cấu hình lớn:

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
    - **Mảng tệp**: được deep-merge theo thứ tự (mục sau thắng)
    - **Khóa cùng cấp**: được hợp nhất sau include (override giá trị đã include)
    - **Include lồng nhau**: hỗ trợ sâu tới 10 cấp
    - **Đường dẫn tương đối**: được phân giải tương đối với tệp đang include
    - **Định dạng đường dẫn**: đường dẫn include không được chứa byte null và phải ngắn hơn nghiêm ngặt 4096 ký tự trước và sau khi phân giải
    - **Ghi do OpenClaw sở hữu**: khi một thao tác ghi chỉ thay đổi một phần cấp cao nhất
      được hỗ trợ bởi include một tệp như `plugins: { $include: "./plugins.json5" }`,
      OpenClaw cập nhật tệp đã include đó và giữ nguyên `openclaw.json`
    - **Ghi xuyên không được hỗ trợ**: include ở root, mảng include, và include
      có override cùng cấp sẽ fail closed đối với thao tác ghi do OpenClaw sở hữu thay vì
      làm phẳng cấu hình
    - **Giới hạn phạm vi**: đường dẫn `$include` phải phân giải bên dưới thư mục chứa
      `openclaw.json`. Để chia sẻ một cây giữa nhiều máy hoặc người dùng, đặt
      `OPENCLAW_INCLUDE_ROOTS` thành danh sách đường dẫn (`:` trên POSIX, `;` trên Windows) của
      các thư mục bổ sung mà include có thể tham chiếu. Symlink được phân giải
      và kiểm tra lại, vì vậy một đường dẫn về mặt từ vựng nằm trong thư mục cấu hình nhưng
      đích thực của nó thoát khỏi mọi root được phép vẫn bị từ chối.
    - **Xử lý lỗi**: lỗi rõ ràng cho tệp bị thiếu, lỗi parse, include vòng, định dạng đường dẫn không hợp lệ và độ dài vượt mức

  </Accordion>
</AccordionGroup>

## Tải lại nóng cấu hình

Gateway theo dõi `~/.openclaw/openclaw.json` và tự động áp dụng thay đổi - không cần khởi động lại thủ công cho hầu hết cài đặt.

Chỉnh sửa tệp trực tiếp được xem là không đáng tin cậy cho đến khi vượt qua xác thực. Watcher chờ
các thao tác ghi tạm/đổi tên từ editor lắng xuống, đọc tệp cuối cùng, và từ chối
chỉnh sửa bên ngoài không hợp lệ mà không ghi lại `openclaw.json`. Các thao tác ghi cấu hình
do OpenClaw sở hữu dùng cùng cổng schema trước khi ghi; các thao tác ghi đè phá hoại như
xóa `gateway.mode` hoặc thu nhỏ tệp hơn một nửa bị từ chối và
lưu thành `.rejected.*` để kiểm tra.

Nếu bạn thấy `config reload skipped (invalid config)` hoặc khi khởi động báo `Invalid
config`, hãy kiểm tra cấu hình, chạy `openclaw config validate`, rồi chạy `openclaw
doctor --fix` để sửa. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config)
để biết checklist.

### Chế độ tải lại

| Chế độ                 | Hành vi                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (mặc định) | Áp dụng nóng các thay đổi an toàn ngay lập tức. Tự động khởi động lại với thay đổi quan trọng. |
| **`hot`**              | Chỉ áp dụng nóng các thay đổi an toàn. Ghi cảnh báo khi cần khởi động lại - bạn tự xử lý. |
| **`restart`**          | Khởi động lại Gateway khi có bất kỳ thay đổi cấu hình nào, an toàn hay không.           |
| **`off`**              | Tắt theo dõi tệp. Thay đổi có hiệu lực ở lần khởi động lại thủ công tiếp theo.          |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Những gì áp dụng nóng so với những gì cần khởi động lại

Hầu hết trường áp dụng nóng mà không có downtime. Trong chế độ `hybrid`, các thay đổi cần khởi động lại được xử lý tự động.

| Danh mục            | Trường                                                            | Cần khởi động lại? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Kênh                | `channels.*`, `web` (WhatsApp) - tất cả kênh tích hợp sẵn và kênh plugin | Không              |
| Tác nhân & mô hình  | `agent`, `agents`, `models`, `routing`                            | Không              |
| Tự động hóa         | `hooks`, `cron`, `agent.heartbeat`                                | Không              |
| Phiên & tin nhắn    | `session`, `messages`                                             | Không              |
| Công cụ & phương tiện | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | Không              |
| UI & mục khác       | `ui`, `logging`, `identity`, `bindings`                           | Không              |
| Máy chủ Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Có**         |
| Hạ tầng             | `discovery`, `plugins`                                            | **Có**         |

<Note>
`gateway.reload` và `gateway.remote` là ngoại lệ - việc thay đổi chúng **không** kích hoạt khởi động lại.
</Note>

### Lập kế hoạch tải lại

Khi bạn chỉnh sửa một tệp nguồn được tham chiếu qua `$include`, OpenClaw lập kế hoạch
tải lại từ bố cục do nguồn khai báo, không phải dạng xem trong bộ nhớ đã được làm phẳng.
Điều đó giúp các quyết định tải lại nóng (áp dụng nóng so với khởi động lại) dễ dự đoán
ngay cả khi một mục cấp cao nhất nằm trong tệp được bao gồm riêng, chẳng hạn như
`plugins: { $include: "./plugins.json5" }`. Việc lập kế hoạch tải lại sẽ đóng an toàn nếu
bố cục nguồn không rõ ràng.

## Config RPC (cập nhật bằng chương trình)

Đối với công cụ ghi cấu hình qua API Gateway, hãy ưu tiên luồng này:

- `config.schema.lookup` để kiểm tra một cây con (nút schema nông + tóm tắt
  con)
- `config.get` để lấy ảnh chụp hiện tại cùng với `hash`
- `config.patch` cho các cập nhật từng phần (JSON merge patch: đối tượng được hợp nhất, `null`
  xóa, mảng thay thế khi được xác nhận rõ ràng bằng `replacePaths` nếu
  các mục sẽ bị xóa)
- `config.apply` chỉ khi bạn định thay thế toàn bộ cấu hình
- `update.run` để tự cập nhật rõ ràng kèm khởi động lại; bao gồm `continuationMessage` khi phiên sau khởi động lại cần chạy thêm một lượt tiếp theo
- `update.status` để kiểm tra sentinel khởi động lại cập nhật mới nhất và xác minh phiên bản đang chạy sau khi khởi động lại

Tác nhân nên xem `config.schema.lookup` là điểm dừng đầu tiên cho tài liệu và ràng buộc
chính xác ở cấp trường. Dùng [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
khi cần bản đồ cấu hình rộng hơn, giá trị mặc định hoặc liên kết đến các tham chiếu
hệ thống con chuyên biệt.

<Note>
Các thao tác ghi control-plane (`config.apply`, `config.patch`, `update.run`) bị
giới hạn tốc độ ở mức 3 yêu cầu mỗi 60 giây cho mỗi `deviceId+clientIp`. Yêu cầu
khởi động lại được gộp lại rồi áp dụng thời gian chờ 30 giây giữa các chu kỳ khởi động lại.
`update.status` chỉ đọc nhưng thuộc phạm vi quản trị vì sentinel khởi động lại có thể
bao gồm tóm tắt bước cập nhật và phần đuôi đầu ra lệnh.
</Note>

Ví dụ bản vá từng phần:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Cả `config.apply` và `config.patch` đều chấp nhận `raw`, `baseHash`, `sessionKey`,
`note` và `restartDelayMs`. `baseHash` là bắt buộc cho cả hai phương thức khi một
cấu hình đã tồn tại.

`config.patch` cũng chấp nhận `replacePaths`, một mảng các đường dẫn cấu hình mà việc
thay thế mảng là có chủ ý. Nếu một bản vá sẽ thay thế hoặc xóa một mảng hiện có
bằng ít mục hơn, Gateway sẽ từ chối ghi trừ khi đường dẫn chính xác đó xuất hiện
trong `replacePaths`; các mảng lồng bên dưới mục mảng dùng `[]`, chẳng hạn như
`agents.list[].skills`. Điều này ngăn các ảnh chụp `config.get` bị cắt ngắn
ghi đè âm thầm lên các mảng định tuyến hoặc danh sách cho phép. Dùng `config.apply` khi bạn
định thay thế toàn bộ cấu hình.

## Biến môi trường

OpenClaw đọc biến môi trường từ tiến trình cha cộng với:

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

<Accordion title="Nhập env của shell (tùy chọn)">
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
- Biến thiếu/rỗng sẽ gây lỗi lúc tải
- Thoát bằng `$${VAR}` để xuất nguyên văn
- Hoạt động bên trong các tệp `$include`
- Thay thế nội tuyến: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Tham chiếu bí mật (env, file, exec)">
  Đối với các trường hỗ trợ đối tượng SecretRef, bạn có thể dùng:

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

Để xem tham chiếu đầy đủ theo từng trường, hãy xem **[Tham chiếu cấu hình](/vi/gateway/configuration-reference)**.

---

_Liên quan: [Ví dụ cấu hình](/vi/gateway/configuration-examples) · [Tham chiếu cấu hình](/vi/gateway/configuration-reference) · [Doctor](/vi/gateway/doctor)_

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
- [Runbook Gateway](/vi/gateway)
