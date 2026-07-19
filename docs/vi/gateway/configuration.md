---
read_when:
    - Thiết lập OpenClaw lần đầu tiên
    - Tìm kiếm các mẫu cấu hình phổ biến
    - Điều hướng đến các phần cấu hình cụ thể
summary: 'Tổng quan về cấu hình: các tác vụ phổ biến, thiết lập nhanh và liên kết đến tài liệu tham khảo đầy đủ'
title: Cấu hình
x-i18n:
    generated_at: "2026-07-19T05:43:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0fa0f0cd54052ebb3a2aa4cd5600d7bdcb65a0a499a07d7e62496ee23464afdd
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw đọc cấu hình <Tooltip tip="JSON5 hỗ trợ chú thích và dấu phẩy ở cuối">**JSON5**</Tooltip> tùy chọn từ `~/.openclaw/openclaw.json`. Nếu tệp không tồn tại, OpenClaw sử dụng các giá trị mặc định an toàn.

Đường dẫn cấu hình đang hoạt động phải là một tệp thông thường. Các thao tác ghi do OpenClaw sở hữu sẽ thay thế tệp theo cách nguyên tử (đổi tên vào đường dẫn), vì vậy `openclaw.json` là liên kết tượng trưng sẽ bị thay thế đích thay vì ghi xuyên qua liên kết — tránh bố cục cấu hình dùng liên kết tượng trưng. Nếu lưu cấu hình bên ngoài thư mục trạng thái mặc định, hãy trỏ `OPENCLAW_CONFIG_PATH` trực tiếp đến tệp thực.

Các lý do phổ biến để thêm cấu hình:

- Kết nối các kênh và kiểm soát ai có thể nhắn tin cho bot
- Thiết lập mô hình, công cụ, môi trường cô lập hoặc tự động hóa (cron, hook)
- Điều chỉnh phiên, phương tiện, mạng hoặc giao diện người dùng

Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/configuration-reference) để biết mọi trường khả dụng.

Agent và quy trình tự động hóa nên dùng `config.schema.lookup` để xem tài liệu chính xác ở cấp trường
trước khi chỉnh sửa cấu hình. Dùng trang này để xem hướng dẫn theo tác vụ và
[Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) để xem sơ đồ trường
và các giá trị mặc định ở phạm vi rộng hơn.

<Tip>
**Mới làm quen với cấu hình?** Hãy bắt đầu bằng `openclaw onboard` để thiết lập tương tác hoặc xem hướng dẫn [Ví dụ cấu hình](/vi/gateway/configuration-examples) để có các cấu hình hoàn chỉnh có thể sao chép và dán.
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
  <Tab title="Giao diện điều khiển">
    Mở [http://127.0.0.1:18789](http://127.0.0.1:18789) và dùng thẻ **Cấu hình**.
    Giao diện điều khiển kết xuất biểu mẫu từ schema cấu hình trực tiếp, bao gồm siêu dữ liệu tài liệu
    `title` / `description` của trường cùng schema của plugin và kênh khi
    có sẵn, đồng thời cung cấp trình chỉnh sửa **JSON thô** làm phương án dự phòng. Đối với giao diện
    đi sâu vào chi tiết và các công cụ khác, Gateway cũng cung cấp `config.schema.lookup` để
    truy xuất một nút schema theo phạm vi đường dẫn cùng phần tóm tắt các nút con trực tiếp.
  </Tab>
  <Tab title="Chỉnh sửa trực tiếp">
    Chỉnh sửa trực tiếp `~/.openclaw/openclaw.json`. Gateway theo dõi tệp và tự động áp dụng thay đổi (xem [tải lại nóng](#config-hot-reload)).
  </Tab>
</Tabs>

## Xác thực nghiêm ngặt

<Warning>
OpenClaw chỉ chấp nhận các cấu hình khớp hoàn toàn với schema. Khóa không xác định, kiểu sai định dạng hoặc giá trị không hợp lệ khiến Gateway **từ chối khởi động**. Ngoại lệ duy nhất ở cấp gốc là `$schema` (chuỗi), để trình chỉnh sửa có thể đính kèm siêu dữ liệu JSON Schema.
</Warning>

`openclaw config schema` in ra JSON Schema chuẩn được Giao diện điều khiển
và quy trình xác thực sử dụng. `config.schema.lookup` truy xuất một nút theo phạm vi đường dẫn cùng
phần tóm tắt các nút con cho công cụ đi sâu vào chi tiết. Siêu dữ liệu tài liệu `title`/`description` của trường
được truyền qua các đối tượng lồng nhau, ký tự đại diện (`*`), phần tử mảng (`[]`) và các nhánh `anyOf`/
`oneOf`/`allOf`. Schema plugin và kênh trong thời gian chạy được hợp nhất khi
sổ đăng ký manifest được tải.

Khi xác thực thất bại:

- Gateway không khởi động
- Chỉ các lệnh chẩn đoán hoạt động (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Chạy `openclaw doctor` để xem chính xác các vấn đề
- Chạy `openclaw doctor --fix` (`--repair` là cùng một cờ; `--yes` bỏ qua lời nhắc) để áp dụng sửa chữa

Gateway lưu một bản sao đáng tin cậy gần nhất được xác nhận là tốt sau mỗi lần khởi động thành công,
nhưng quá trình khởi động và tải lại nóng không tự động khôi phục bản sao đó — chỉ `openclaw doctor --fix`
thực hiện việc này. Nếu `openclaw.json` không vượt qua xác thực (bao gồm xác thực cục bộ của plugin), Gateway
sẽ không khởi động hoặc bỏ qua lần tải lại, còn môi trường chạy hiện tại tiếp tục dùng
cấu hình được chấp nhận gần nhất. Bản ghi bị từ chối cũng được lưu thành `<path>.rejected.<timestamp>` để kiểm tra.
Gateway chặn các thao tác ghi có vẻ vô tình ghi đè — làm mất `gateway.mode`,
mất khối `meta` hoặc làm kích thước tệp giảm hơn một nửa — trừ khi thao tác ghi
cho phép rõ ràng các thay đổi phá hủy. Việc đưa cấu hình thành bản được xác nhận là tốt gần nhất sẽ bị bỏ qua khi
ứng viên chứa phần giữ chỗ cho bí mật đã được che như `***` hoặc `[redacted]`.

## Tác vụ phổ biến

<AccordionGroup>
  <Accordion title="Thiết lập kênh (WhatsApp, Telegram, Discord, v.v.)">
    Mỗi kênh có phần cấu hình riêng trong `channels.<provider>`. Xem trang dành riêng cho kênh để biết các bước thiết lập:

    - [Discord](/vi/channels/discord) - `channels.discord`
    - [Feishu](/vi/channels/feishu) - `channels.feishu`
    - [Google Chat](/vi/channels/googlechat) - `channels.googlechat`
    - [iMessage](/vi/channels/imessage) - `channels.imessage`
    - [Mattermost](/vi/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/vi/channels/msteams) - `channels.msteams`
    - [Signal](/vi/channels/signal) - `channels.signal`
    - [Slack](/vi/channels/slack) - `channels.slack`
    - [Telegram](/vi/channels/telegram) - `channels.telegram`
    - [WhatsApp](/vi/channels/whatsapp) - `channels.whatsapp`

    Tất cả các kênh dùng chung mẫu chính sách tin nhắn trực tiếp:

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
    Thiết lập mô hình chính và các mô hình dự phòng tùy chọn:

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

    - `agents.defaults.models` lưu bí danh và cài đặt riêng cho từng mô hình; việc thêm một mục không bao giờ hạn chế các giá trị ghi đè `/model` hoặc `--model`.
    - `agents.defaults.modelPolicy.allow` là danh sách cho phép rõ ràng dành cho giá trị ghi đè và bộ chọn mô hình. Trường này chấp nhận tham chiếu chính xác và ký tự đại diện `provider/*`; hãy bỏ qua trường này hoặc dùng `[]` để cho phép mọi mô hình.
    - Tham chiếu mô hình dùng định dạng `provider/model` (ví dụ: `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kiểm soát việc giảm kích thước hình ảnh trong bản ghi hội thoại/công cụ (mặc định `1200`); giá trị thấp hơn thường giảm mức sử dụng token thị giác trong các lượt chạy có nhiều ảnh chụp màn hình.
    - Xem [CLI mô hình](/vi/concepts/models) để chuyển đổi mô hình trong cuộc trò chuyện và [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) để tìm hiểu việc luân phiên xác thực và hành vi dự phòng.
    - Đối với nhà cung cấp tùy chỉnh/tự lưu trữ, xem [Nhà cung cấp tùy chỉnh](/vi/gateway/config-tools#custom-providers-and-base-urls) trong tài liệu tham chiếu.

  </Accordion>

  <Accordion title="Kiểm soát ai có thể nhắn tin cho bot">
    Quyền truy cập tin nhắn trực tiếp được kiểm soát theo từng kênh qua `dmPolicy` (mặc định `"pairing"`):

    - `"pairing"`: người gửi không xác định nhận mã ghép nối dùng một lần để phê duyệt
    - `"allowlist"`: chỉ người gửi trong `allowFrom` (hoặc kho danh sách cho phép đã ghép nối)
    - `"open"`: cho phép mọi tin nhắn trực tiếp đến (yêu cầu `allowFrom: ["*"]`)
    - `"disabled"`: bỏ qua mọi tin nhắn trực tiếp

    Đối với nhóm, dùng `groupPolicy` (`"allowlist" | "open" | "disabled"`) cùng `groupAllowFrom` hoặc danh sách cho phép dành riêng cho từng kênh.

    Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-channels#dm-and-group-access) để biết chi tiết theo từng kênh.

  </Accordion>

  <Accordion title="Thiết lập điều kiện đề cập trong trò chuyện nhóm">
    Tin nhắn nhóm mặc định **yêu cầu đề cập**. Cấu hình mẫu kích hoạt theo từng agent. Các phản hồi nhóm/kênh thông thường được đăng tự động; hãy chủ động chọn đường dẫn công cụ tin nhắn cho các phòng dùng chung nơi agent cần quyết định thời điểm phát biểu:

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

    - **Đề cập qua siêu dữ liệu**: @-mention nguyên bản (chạm để đề cập trên WhatsApp, @bot trên Telegram, v.v.)
    - **Mẫu văn bản**: các mẫu biểu thức chính quy an toàn trong `mentionPatterns`
    - **Phản hồi hiển thị**: `messages.visibleReplies` có thể yêu cầu gửi qua công cụ tin nhắn trên toàn hệ thống; `messages.groupChat.visibleReplies` ghi đè thiết lập đó cho nhóm/kênh.
    - Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-channels#group-chat-mention-gating) để biết các chế độ phản hồi hiển thị, giá trị ghi đè theo từng kênh và chế độ tự trò chuyện.

  </Accordion>

  <Accordion title="Hạn chế Skills theo từng agent">
    Dùng `agents.defaults.skills` làm đường cơ sở dùng chung, sau đó ghi đè cho các
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

    - Bỏ qua `agents.defaults.skills` để mặc định không hạn chế Skills.
    - Bỏ qua `agents.list[].skills` để kế thừa các giá trị mặc định.
    - Đặt `agents.list[].skills: []` để không dùng Skills nào.
    - Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config) và
      [Tài liệu tham chiếu cấu hình](/vi/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Điều chỉnh giám sát tình trạng kênh của Gateway">
    Kiểm soát mức độ quyết liệt khi Gateway khởi động lại các kênh có vẻ lỗi thời:

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

    - Các giá trị hiển thị là giá trị mặc định. Đặt `gateway.channelHealthCheckMinutes: 0` để vô hiệu hóa việc khởi động lại của trình giám sát tình trạng trên toàn hệ thống.
    - `channelStaleEventThresholdMinutes` phải lớn hơn hoặc bằng khoảng thời gian kiểm tra.
    - Dùng `channels.<provider>.healthMonitor.enabled` hoặc `channels.<provider>.accounts.<id>.healthMonitor.enabled` để vô hiệu hóa tính năng tự động khởi động lại cho một kênh hoặc tài khoản mà không vô hiệu hóa trình giám sát toàn cục.
    - Xem [Kiểm tra tình trạng](/vi/gateway/health) để gỡ lỗi vận hành và [tài liệu tham chiếu đầy đủ](/vi/gateway/configuration-reference#gateway) để biết tất cả các trường.

  </Accordion>

  <Accordion title="Điều chỉnh thời gian chờ bắt tay WebSocket của Gateway">
    Cho phép máy khách cục bộ có thêm thời gian để hoàn tất quá trình bắt tay WebSocket trước xác thực trên
    các máy chủ đang chịu tải hoặc có công suất thấp:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Mặc định là `15000` mili giây.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` vẫn được ưu tiên cho các giá trị ghi đè dùng một lần đối với dịch vụ hoặc shell.
    - Trước tiên, nên khắc phục tình trạng đình trệ khi khởi động/vòng lặp sự kiện; tùy chọn này dành cho các máy chủ hoạt động bình thường nhưng chậm trong quá trình khởi động nóng.

  </Accordion>

  <Accordion title="Cấu hình phiên và đặt lại">
    Các phiên kiểm soát tính liên tục và sự cô lập của cuộc trò chuyện:

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
    - `threadBindings`: giá trị mặc định toàn cục cho việc định tuyến phiên được liên kết với luồng. `/focus`, `/unfocus`, `/agents`, `/session idle` và `/session max-age` lần lượt liên kết, hủy liên kết, liệt kê và tinh chỉnh thiết lập này cho từng phiên (Discord liên kết các luồng, Telegram liên kết các chủ đề/cuộc trò chuyện).
    - Xem [Quản lý phiên](/vi/concepts/session) để biết về phạm vi, liên kết danh tính và chính sách gửi.
    - Xem [tài liệu tham khảo đầy đủ](/vi/gateway/config-agents#session) để biết tất cả các trường.

  </Accordion>

  <Accordion title="Bật môi trường cô lập">
    Chạy các phiên của tác nhân trong những môi trường cô lập riêng biệt:

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

    Trước tiên, hãy xây dựng image — từ bản checkout mã nguồn, chạy `scripts/sandbox-setup.sh`; hoặc nếu cài đặt từ npm, hãy xem lệnh `docker build` nội tuyến trong [Môi trường cô lập § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup).

    Xem [Môi trường cô lập](/vi/gateway/sandboxing) để đọc hướng dẫn đầy đủ và [tài liệu tham khảo đầy đủ](/vi/gateway/config-agents#agentsdefaultssandbox) để biết tất cả các tùy chọn.

  </Accordion>

  <Accordion title="Bật thông báo đẩy qua relay cho các bản dựng iOS chính thức">
    Thông báo đẩy qua relay cho các bản dựng công khai trên App Store sử dụng relay OpenClaw được lưu trữ: `https://ios-push-relay.openclaw.ai`.

    Việc triển khai relay tùy chỉnh yêu cầu một quy trình xây dựng/triển khai iOS riêng biệt có chủ đích, trong đó URL relay khớp với URL relay của Gateway. Nếu đang sử dụng bản dựng relay tùy chỉnh, hãy đặt cấu hình này trong Gateway:

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

    Lệnh CLI tương đương:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Tác dụng của cấu hình này:

    - Cho phép Gateway gửi `push.test`, tín hiệu đánh thức và tín hiệu đánh thức để kết nối lại thông qua relay bên ngoài.
    - Sử dụng quyền gửi theo phạm vi đăng ký do ứng dụng iOS đã ghép nối chuyển tiếp. Gateway không cần token relay áp dụng cho toàn bộ bản triển khai.
    - Ràng buộc mỗi đăng ký qua relay với danh tính Gateway mà ứng dụng iOS đã ghép nối, nhờ đó một Gateway khác không thể tái sử dụng đăng ký đã lưu.
    - Duy trì việc sử dụng APNs trực tiếp cho các bản dựng iOS cục bộ/thủ công. Việc gửi qua relay chỉ áp dụng cho các bản dựng được phân phối chính thức đã đăng ký thông qua relay.
    - Phải khớp với URL cơ sở của relay được tích hợp vào bản dựng iOS để lưu lượng đăng ký và gửi đến cùng một bản triển khai relay.

    Luồng toàn trình:

    1. Cài đặt ứng dụng iOS chính thức.
    2. Không bắt buộc: chỉ cấu hình `gateway.push.apns.relay.baseUrl` trên Gateway khi sử dụng một bản dựng relay tùy chỉnh riêng biệt có chủ đích.
    3. Ghép nối ứng dụng iOS với Gateway và cho phép cả phiên Node lẫn phiên của người vận hành kết nối.
    4. Ứng dụng iOS tìm nạp danh tính Gateway, đăng ký với relay bằng App Attest cùng biên nhận của ứng dụng, rồi công bố payload `push.apns.register` qua relay lên Gateway đã ghép nối.
    5. Gateway lưu mã định danh relay và quyền gửi, sau đó sử dụng chúng cho `push.test`, tín hiệu đánh thức và tín hiệu đánh thức để kết nối lại.

    Lưu ý vận hành:

    - Nếu chuyển ứng dụng iOS sang một Gateway khác, hãy kết nối lại ứng dụng để ứng dụng có thể công bố đăng ký relay mới được ràng buộc với Gateway đó.
    - Nếu phát hành một bản dựng iOS mới trỏ đến bản triển khai relay khác, ứng dụng sẽ làm mới đăng ký relay đã lưu vào bộ nhớ đệm thay vì tái sử dụng nguồn relay cũ.

    Lưu ý về khả năng tương thích:

    - `OPENCLAW_APNS_RELAY_BASE_URL` và `OPENCLAW_APNS_RELAY_TIMEOUT_MS` vẫn hoạt động dưới dạng các giá trị ghi đè tạm thời qua biến môi trường.
    - URL relay tùy chỉnh của Gateway phải khớp với URL cơ sở của relay được tích hợp vào bản dựng iOS; quy trình phát hành công khai trên App Store từ chối các giá trị ghi đè URL relay iOS tùy chỉnh.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` vẫn là một lối thoát dành riêng cho quá trình phát triển trên loopback; không lưu cố định URL relay HTTP trong cấu hình.

    Xem [Ứng dụng iOS](/vi/platforms/ios#relay-backed-push-for-official-builds) để biết luồng toàn trình và [Luồng xác thực và tin cậy](/vi/platforms/ios#authentication-and-trust-flow) để biết mô hình bảo mật của relay.

  </Accordion>

  <Accordion title="Thiết lập Heartbeat (kiểm tra định kỳ)">
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

    - `every`: chuỗi thời lượng (`30m`, `2h`). Đặt thành `0m` để tắt. Mặc định: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (ví dụ: `discord`, `matrix`, `telegram` hoặc `whatsapp`)
    - `directPolicy`: `allow` (mặc định) hoặc `block` cho các đích Heartbeat kiểu DM
    - Xem [Heartbeat](/vi/gateway/heartbeat) để đọc hướng dẫn đầy đủ.

  </Accordion>

  <Accordion title="Cấu hình tác vụ Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: xóa các phiên chạy cô lập đã hoàn tất khỏi các hàng phiên SQLite (mặc định là `24h`; đặt thành `false` để tắt).
    - Lịch sử chạy tự động giữ lại 2000 hàng trạng thái kết thúc mới nhất cho mỗi tác vụ; các hàng bị mất vẫn giữ khoảng thời gian dọn dẹp 24 giờ.
    - Xem [Tác vụ Cron](/vi/automation/cron-jobs) để biết tổng quan về tính năng và các ví dụ CLI.

  </Accordion>

  <Accordion title="Thiết lập Webhook (hook)">
    Bật các endpoint Webhook HTTP trên Gateway:

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

    Lưu ý bảo mật:
    - Coi toàn bộ nội dung payload hook/Webhook là đầu vào không đáng tin cậy.
    - Sử dụng một `hooks.token` chuyên dụng; không tái sử dụng các bí mật xác thực Gateway đang hoạt động (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Xác thực hook chỉ dùng header (`Authorization: Bearer ...` hoặc `x-openclaw-token`); token trong chuỗi truy vấn sẽ bị từ chối.
    - `hooks.path` không được là `/`; giữ điểm tiếp nhận Webhook trên một đường dẫn con chuyên dụng, chẳng hạn như `/hooks`.
    - Giữ các cờ bỏ qua nội dung không an toàn ở trạng thái tắt (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), trừ khi đang gỡ lỗi trong phạm vi được kiểm soát chặt chẽ.
    - Nếu bật `hooks.allowRequestSessionKey`, hãy đặt cả `hooks.allowedSessionKeyPrefixes` để giới hạn các khóa phiên do bên gọi lựa chọn.
    - Đối với các tác nhân được kích hoạt bằng hook, nên ưu tiên các tầng mô hình hiện đại, mạnh và chính sách công cụ nghiêm ngặt (ví dụ: chỉ cho phép nhắn tin, kết hợp với môi trường cô lập khi có thể).

    Xem [tài liệu tham khảo đầy đủ](/vi/gateway/configuration-reference#hooks) để biết tất cả các tùy chọn ánh xạ và cách tích hợp Gmail.

  </Accordion>

  <Accordion title="Cấu hình định tuyến đa tác nhân">
    Chạy nhiều tác nhân cô lập với các không gian làm việc và phiên riêng biệt:

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

    Xem [Đa tác nhân](/vi/concepts/multi-agent) và [tài liệu tham khảo đầy đủ](/vi/gateway/config-agents#multi-agent-routing) để biết các quy tắc liên kết và hồ sơ truy cập cho từng tác nhân.

  </Accordion>

  <Accordion title="Chia cấu hình thành nhiều tệp ($include)">
    Sử dụng `$include` để sắp xếp các cấu hình lớn:

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
    - **Mảng tệp**: hợp nhất sâu theo thứ tự (tệp sau được ưu tiên), với tối đa 10 cấp lồng nhau
    - **Khóa cùng cấp**: được hợp nhất sau các mục include (ghi đè các giá trị được include)
    - **Đường dẫn tương đối**: được phân giải tương đối so với tệp thực hiện include
    - **Định dạng đường dẫn**: đường dẫn include không được chứa byte null và phải ngắn hơn 4096 ký tự cả trước lẫn sau khi phân giải
    - **Thao tác ghi do OpenClaw thực hiện**: khi một thao tác ghi chỉ thay đổi một phần cấp cao nhất
      được hỗ trợ bởi một include tệp đơn như `plugins: { $include: "./plugins.json5" }`,
      OpenClaw cập nhật tệp được include đó và giữ nguyên `openclaw.json`
    - **Không hỗ trợ ghi xuyên qua**: các include ở gốc, mảng include và các include
      có giá trị ghi đè cùng cấp sẽ dừng an toàn đối với thao tác ghi do OpenClaw thực hiện thay vì
      làm phẳng cấu hình
    - **Giới hạn phạm vi**: các đường dẫn `$include` phải được phân giải bên trong thư mục chứa
      `openclaw.json`. Để chia sẻ một cây thư mục giữa nhiều máy hoặc người dùng, hãy đặt
      `OPENCLAW_INCLUDE_ROOTS` thành danh sách đường dẫn (`:` trên POSIX, `;` trên Windows) gồm
      các thư mục bổ sung mà mục include có thể tham chiếu. Các liên kết tượng trưng được phân giải
      và kiểm tra lại, vì vậy một đường dẫn có vị trí theo cú pháp bên trong thư mục cấu hình nhưng
      đích thực tế thoát khỏi mọi thư mục gốc được phép vẫn sẽ bị từ chối.
    - **Xử lý lỗi**: cung cấp lỗi rõ ràng cho tệp bị thiếu, lỗi phân tích cú pháp, include vòng tròn, định dạng đường dẫn không hợp lệ và độ dài quá mức

  </Accordion>
</AccordionGroup>

## Tải lại nóng cấu hình

Gateway theo dõi `~/.openclaw/openclaw.json` và tự động áp dụng các thay đổi — hầu hết cài đặt không cần khởi động lại thủ công.

Các chỉnh sửa tệp trực tiếp được coi là không đáng tin cậy cho đến khi vượt qua quá trình xác thực. Trình theo dõi chờ
các thao tác ghi tệp tạm thời/đổi tên của trình soạn thảo ổn định, đọc tệp cuối cùng và từ chối
các chỉnh sửa bên ngoài không hợp lệ mà không ghi lại `openclaw.json`. Các thao tác ghi cấu hình
do OpenClaw thực hiện sử dụng cùng một cổng kiểm tra schema trước khi ghi (xem [Xác thực nghiêm ngặt](#strict-validation)
để biết các quy tắc ghi đè/hoàn tác áp dụng cho mọi thao tác ghi).

Nếu thấy `config reload skipped (invalid config)` hoặc quá trình khởi động báo cáo `Invalid
config`, hãy kiểm tra cấu hình, chạy `openclaw config validate`, rồi chạy `openclaw
doctor --fix` để sửa chữa. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config)
để biết danh sách kiểm tra.

### Chế độ tải lại

| Chế độ                   | Hành vi                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (mặc định) | Áp dụng nóng ngay lập tức các thay đổi an toàn. Tự động khởi động lại đối với các thay đổi quan trọng.           |
| **`hot`**              | Chỉ áp dụng nóng các thay đổi an toàn. Ghi cảnh báo khi cần khởi động lại — bạn tự xử lý việc này. |
| **`restart`**          | Khởi động lại Gateway khi có bất kỳ thay đổi cấu hình nào, dù an toàn hay không.                                 |
| **`off`**              | Tắt tính năng theo dõi tệp. Các thay đổi có hiệu lực ở lần khởi động lại thủ công tiếp theo.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Nội dung nào được áp dụng nóng và nội dung nào cần khởi động lại

Hầu hết các trường được áp dụng nóng mà không gây gián đoạn; một số phần được áp dụng nóng chỉ khởi động lại
hệ thống con tương ứng (kênh, cron, heartbeat, trình giám sát tình trạng) thay vì toàn bộ Gateway. Trong
chế độ `hybrid`, các thay đổi yêu cầu khởi động lại Gateway được xử lý tự động.

| Danh mục            | Trường                                                                  | Cần khởi động lại Gateway?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Kênh            | `channels.*`, `web` (WhatsApp) — tất cả các kênh tích hợp sẵn và kênh Plugin       | Không (khởi động lại kênh đó)   |
| Tác tử và mô hình      | `agent`, `agents`, `models`, `routing`                                  | Không                           |
| Tự động hóa          | `hooks`, `cron`, `agent.heartbeat`                                      | Không (khởi động lại hệ thống con đó) |
| Phiên và tin nhắn | `session`, `messages`                                                   | Không                           |
| Công cụ và phương tiện       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Không                           |
| Cấu hình Plugin       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Không (tải lại môi trường chạy Plugin)  |
| Giao diện người dùng và mục khác           | `ui`, `logging`, `identity`, `bindings`                                 | Không                           |
| Máy chủ Gateway      | `gateway.*` (cổng, liên kết, xác thực, tailscale, TLS, HTTP, đẩy)              | **Có**                      |
| Hạ tầng      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Có**                      |

<Note>
`gateway.reload` và `gateway.remote` là các ngoại lệ trong `gateway.*` — việc thay đổi chúng **không** kích hoạt khởi động lại. Từng Plugin cũng có thể ghi đè bảng này: một Plugin đã tải có thể khai báo các tiền tố cấu hình kích hoạt khởi động lại riêng (ví dụ: Plugin Canvas đi kèm sẽ khởi động lại Gateway đối với `plugins.enabled`, `plugins.allow` và `plugins.deny`, chứ không chỉ `plugins.entries.canvas` của chính nó), vì vậy hành vi thực tế phụ thuộc vào các Plugin đang hoạt động.
</Note>

### Lập kế hoạch tải lại

Khi bạn chỉnh sửa một tệp nguồn được tham chiếu thông qua `$include`, OpenClaw lập kế hoạch
tải lại dựa trên bố cục do nguồn định nghĩa, không phải dạng xem phẳng trong bộ nhớ.
Điều này giúp các quyết định tải lại nóng (áp dụng nóng hay khởi động lại) luôn có thể dự đoán được ngay cả khi
một phần cấp cao nhất nằm trong một tệp được bao gồm riêng, chẳng hạn như
`plugins: { $include: "./plugins.json5" }`. Việc lập kế hoạch tải lại sẽ từ chối thực hiện nếu
bố cục nguồn không rõ ràng.

## RPC cấu hình (cập nhật theo chương trình)

Đối với công cụ ghi cấu hình qua API Gateway, nên ưu tiên luồng sau:

- `config.schema.lookup` để kiểm tra một cây con (nút lược đồ nông + phần tóm tắt
  các nút con)
- `config.get` để lấy ảnh chụp nhanh hiện tại cùng với `hash`
- `config.patch` để cập nhật một phần (bản vá hợp nhất JSON: các đối tượng được hợp nhất, `null`
  sẽ xóa, các mảng được thay thế khi xác nhận rõ ràng bằng `replacePaths` nếu
  có mục bị loại bỏ)
- `config.apply` chỉ khi bạn có ý định thay thế toàn bộ cấu hình
- `update.run` để tự cập nhật và khởi động lại rõ ràng; bao gồm `continuationMessage` khi phiên sau khi khởi động lại cần chạy thêm một lượt tiếp nối
- `update.status` để kiểm tra dấu hiệu khởi động lại do cập nhật gần nhất và xác minh phiên bản đang chạy sau khi khởi động lại

Các tác tử nên xem `config.schema.lookup` là điểm tra cứu đầu tiên để biết tài liệu và ràng buộc chính xác
ở cấp trường. Sử dụng [tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference)
khi cần bản đồ cấu hình rộng hơn, các giá trị mặc định hoặc liên kết đến tài liệu tham chiếu
dành riêng cho từng hệ thống con.

<Note>
Các thao tác ghi của mặt phẳng điều khiển (`config.apply`, `config.patch`, `update.run`)
bị giới hạn ở 30 yêu cầu mỗi 60 giây, theo từng phương thức, theo từng
`deviceId+clientIp`; xem [Giới hạn tốc độ](/gateway/security/rate-limiting). Các yêu cầu khởi động lại
được hợp nhất, sau đó áp dụng thời gian chờ 30 giây giữa các chu kỳ khởi động lại.
`update.status` chỉ cho phép đọc nhưng thuộc phạm vi quản trị viên vì dấu hiệu khởi động lại có thể
bao gồm phần tóm tắt các bước cập nhật và phần cuối đầu ra lệnh.
</Note>

Ví dụ về bản vá một phần:

```bash
openclaw gateway call config.get --params '{}'  # ghi lại payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Cả `config.apply` và `config.patch` đều chấp nhận `raw`, `baseHash`, `sessionKey`,
`note` và `restartDelayMs`. `baseHash` là bắt buộc đối với cả hai phương thức khi
tệp cấu hình đã tồn tại (lần ghi đầu tiên khi chưa có cấu hình sẽ bỏ qua bước kiểm tra).

`config.patch` cũng chấp nhận `replacePaths`, một mảng các đường dẫn cấu hình mà việc thay thế mảng
là có chủ đích. Nếu bản vá sẽ thay thế hoặc xóa một mảng hiện có
bằng mảng có ít mục hơn, Gateway sẽ từ chối thao tác ghi trừ khi đường dẫn chính xác đó xuất hiện
trong `replacePaths`; các mảng lồng nhau bên trong mục mảng sử dụng `[]`, chẳng hạn như
`agents.list[].skills`. Điều này ngăn các ảnh chụp nhanh `config.get` bị cắt ngắn
âm thầm ghi đè các mảng định tuyến hoặc danh sách cho phép. Sử dụng `config.apply` khi bạn
có ý định thay thế toàn bộ cấu hình.

## Biến môi trường

OpenClaw đọc các biến môi trường từ tiến trình cha cùng với:

- `.env` từ thư mục làm việc hiện tại (nếu có)
- `~/.openclaw/.env` (giá trị dự phòng toàn cục)

Không tệp nào ghi đè các biến môi trường hiện có. Bạn cũng có thể đặt các biến môi trường nội tuyến trong cấu hình:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Nhập môi trường shell (tùy chọn)">
  Nếu được bật và các khóa dự kiến chưa được đặt, OpenClaw sẽ chạy shell đăng nhập của bạn và chỉ nhập các khóa còn thiếu:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Biến môi trường tương đương: `OPENCLAW_LOAD_SHELL_ENV=1`. `timeoutMs` mặc định: `15000`.
</Accordion>

<Accordion title="Thay thế biến môi trường trong các giá trị cấu hình">
  Tham chiếu các biến môi trường trong bất kỳ giá trị chuỗi cấu hình nào bằng `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Quy tắc:

- Chỉ khớp các tên viết hoa: `[A-Z_][A-Z0-9_]*`
- Biến bị thiếu/rỗng sẽ gây lỗi khi tải
- Thoát bằng `$${VAR}` để tạo đầu ra dạng ký tự
- Hoạt động bên trong các tệp `$include`
- Thay thế nội tuyến: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Tham chiếu bí mật (môi trường, tệp, thực thi)">
  Đối với các trường hỗ trợ đối tượng SecretRef, bạn có thể sử dụng:

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

Chi tiết về SecretRef (bao gồm `secrets.providers` cho `env`/`file`/`exec`) có trong [Quản lý bí mật](/vi/gateway/secrets).
Các đường dẫn thông tin xác thực được hỗ trợ được liệt kê trong [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Accordion>

Xem [Môi trường](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên và các nguồn.

## Tài liệu tham chiếu đầy đủ

Để xem tài liệu tham chiếu đầy đủ theo từng trường, hãy xem **[Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference)**.

---

_Liên quan: [Ví dụ cấu hình](/vi/gateway/configuration-examples) · [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) · [Doctor](/vi/gateway/doctor)_

## Liên quan

- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
- [Cẩm nang vận hành Gateway](/vi/gateway)
