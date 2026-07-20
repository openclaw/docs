---
read_when:
    - Thiết lập OpenClaw lần đầu tiên
    - Tìm kiếm các mẫu cấu hình phổ biến
    - Điều hướng đến các phần cấu hình cụ thể
summary: 'Tổng quan về cấu hình: các tác vụ phổ biến, thiết lập nhanh và liên kết đến tài liệu tham khảo đầy đủ'
title: Cấu hình
x-i18n:
    generated_at: "2026-07-20T04:25:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d48a4ebb9a8ca212917ce4fe12a0670a44bf1030657bd1334343a91eef8ff742
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw đọc cấu hình <Tooltip tip="JSON5 hỗ trợ chú thích và dấu phẩy ở cuối">**JSON5**</Tooltip> tùy chọn từ `~/.openclaw/openclaw.json`. Nếu tệp không tồn tại, OpenClaw sử dụng các giá trị mặc định an toàn.

Đường dẫn cấu hình đang hoạt động phải là một tệp thông thường. Các thao tác ghi do OpenClaw thực hiện sẽ thay thế tệp theo cách nguyên tử (đổi tên vào đường dẫn), vì vậy với `openclaw.json` là liên kết tượng trưng, đích của liên kết sẽ bị thay thế thay vì được ghi xuyên qua liên kết — tránh bố cục cấu hình dùng liên kết tượng trưng. Nếu lưu cấu hình bên ngoài thư mục trạng thái mặc định, hãy trỏ `OPENCLAW_CONFIG_PATH` trực tiếp đến tệp thực.

Các lý do phổ biến để thêm cấu hình:

- Kết nối các kênh và kiểm soát ai có thể nhắn tin cho bot
- Thiết lập mô hình, công cụ, cơ chế sandbox hoặc tự động hóa (cron, hook)
- Tinh chỉnh phiên, nội dung đa phương tiện, mạng hoặc giao diện người dùng

Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/configuration-reference) để biết mọi trường khả dụng.

Agent và quy trình tự động hóa nên dùng `config.schema.lookup` để xem tài liệu chính xác
ở cấp trường trước khi chỉnh sửa cấu hình. Dùng trang này để xem hướng dẫn theo tác vụ và
[Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) để xem bản đồ trường
và các giá trị mặc định đầy đủ hơn.

<Tip>
**Mới làm quen với cấu hình?** Hãy bắt đầu với `openclaw onboard` để thiết lập tương tác hoặc xem hướng dẫn [Ví dụ cấu hình](/vi/gateway/configuration-examples) để có các cấu hình hoàn chỉnh có thể sao chép và dán.
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
    openclaw onboard       # quy trình hướng dẫn ban đầu đầy đủ
    openclaw configure     # trình hướng dẫn cấu hình
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
    Mở [http://127.0.0.1:18789](http://127.0.0.1:18789) và dùng thẻ **Config**.
    Giao diện điều khiển kết xuất biểu mẫu từ lược đồ cấu hình trực tiếp, bao gồm siêu dữ liệu tài liệu
    `title` / `description` của trường cùng với lược đồ Plugin và kênh khi
    có sẵn, đồng thời cung cấp trình soạn thảo **Raw JSON** như một lối thoát. Đối với các
    giao diện đi sâu vào chi tiết và công cụ khác, Gateway cũng cung cấp `config.schema.lookup` để
    truy xuất một nút lược đồ theo phạm vi đường dẫn cùng phần tóm tắt các nút con trực tiếp.
  </Tab>
  <Tab title="Chỉnh sửa trực tiếp">
    Chỉnh sửa trực tiếp `~/.openclaw/openclaw.json`. Gateway theo dõi tệp và tự động áp dụng các thay đổi (xem [tải lại nóng](#config-hot-reload)).
  </Tab>
</Tabs>

## Xác thực nghiêm ngặt

<Warning>
OpenClaw chỉ chấp nhận các cấu hình hoàn toàn khớp với lược đồ. Khóa không xác định, kiểu dữ liệu sai định dạng hoặc giá trị không hợp lệ sẽ khiến Gateway **từ chối khởi động**. Ngoại lệ duy nhất ở cấp gốc là `$schema` (chuỗi), để trình soạn thảo có thể đính kèm siêu dữ liệu JSON Schema.
</Warning>

`openclaw config schema` in ra JSON Schema chuẩn tắc mà giao diện điều khiển
và quy trình xác thực sử dụng. `config.schema.lookup` truy xuất một nút theo phạm vi đường dẫn cùng
phần tóm tắt các nút con cho công cụ đi sâu vào chi tiết. Siêu dữ liệu tài liệu `title`/`description` của trường
được truyền qua các đối tượng lồng nhau, ký tự đại diện (`*`), phần tử mảng (`[]`) và các nhánh `anyOf`/
`oneOf`/`allOf`. Lược đồ Plugin và kênh khi chạy được hợp nhất khi
sổ đăng ký manifest được tải.

Khi xác thực thất bại:

- Gateway không khởi động
- Chỉ các lệnh chẩn đoán hoạt động (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Chạy `openclaw doctor` để xem chính xác các vấn đề
- Chạy `openclaw doctor --fix` (`--repair` là cùng một cờ; `--yes` bỏ qua lời nhắc) để áp dụng sửa chữa

Gateway lưu một bản sao đáng tin cậy gần nhất được xác nhận là tốt sau mỗi lần khởi động thành công,
nhưng quá trình khởi động và tải lại nóng không tự động khôi phục bản sao này — chỉ `openclaw doctor --fix`
thực hiện việc đó. Nếu `openclaw.json` không vượt qua xác thực (bao gồm xác thực cục bộ của Plugin), quá trình
khởi động Gateway sẽ thất bại hoặc lần tải lại sẽ bị bỏ qua, còn môi trường chạy hiện tại tiếp tục dùng
cấu hình được chấp nhận gần nhất. Thao tác ghi bị từ chối cũng được lưu thành `<path>.rejected.<timestamp>` để kiểm tra.
Gateway chặn các thao tác ghi có vẻ vô tình ghi đè dữ liệu — làm mất `gateway.mode`,
làm mất khối `meta` hoặc thu nhỏ tệp quá một nửa — trừ khi thao tác ghi
cho phép rõ ràng các thay đổi phá hủy dữ liệu. Việc thăng cấp thành bản gần nhất được xác nhận là tốt sẽ bị bỏ qua khi
ứng viên chứa phần giữ chỗ bí mật đã được che như `***` hoặc `[redacted]`.

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

    Tất cả các kênh đều dùng chung mẫu chính sách tin nhắn trực tiếp:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // chỉ dành cho allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Chọn và cấu hình mô hình">
    Thiết lập mô hình chính và các phương án dự phòng tùy chọn:

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

    - `agents.defaults.models` lưu bí danh và thiết lập theo từng mô hình; việc thêm một mục không bao giờ hạn chế các giá trị ghi đè `/model` hoặc `--model`.
    - `agents.defaults.modelPolicy.allow` là danh sách cho phép rõ ràng dành cho các giá trị ghi đè và trình chọn mô hình. Trường này chấp nhận tham chiếu chính xác và ký tự đại diện `provider/*`; bỏ qua trường này hoặc dùng `[]` để cho phép mọi mô hình.
    - Tham chiếu mô hình dùng định dạng `provider/model` (ví dụ: `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kiểm soát việc giảm kích thước hình ảnh trong bản chép lời/công cụ (mặc định `1200`); giá trị thấp hơn thường giảm mức sử dụng token thị giác trong các lượt chạy có nhiều ảnh chụp màn hình.
    - Xem [CLI mô hình](/vi/concepts/models) để chuyển đổi mô hình trong cuộc trò chuyện và [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) để biết hành vi luân phiên xác thực và dự phòng.
    - Đối với nhà cung cấp tùy chỉnh/tự lưu trữ, xem [Nhà cung cấp tùy chỉnh](/vi/gateway/config-tools#custom-providers-and-base-urls) trong tài liệu tham chiếu.

  </Accordion>

  <Accordion title="Kiểm soát ai có thể nhắn tin cho bot">
    Quyền truy cập tin nhắn trực tiếp được kiểm soát theo từng kênh qua `dmPolicy` (mặc định `"pairing"`):

    - `"pairing"`: người gửi không xác định nhận mã ghép nối dùng một lần để phê duyệt
    - `"allowlist"`: chỉ người gửi trong `allowFrom` (hoặc kho cho phép đã ghép nối)
    - `"open"`: cho phép tất cả tin nhắn trực tiếp đến (yêu cầu `allowFrom: ["*"]`)
    - `"disabled"`: bỏ qua tất cả tin nhắn trực tiếp

    Đối với nhóm, dùng `groupPolicy` (`"allowlist" | "open" | "disabled"`) cùng với `groupAllowFrom` hoặc danh sách cho phép dành riêng cho kênh.

    Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-channels#dm-and-group-access) để biết chi tiết theo từng kênh.

  </Accordion>

  <Accordion title="Thiết lập điều kiện đề cập trong trò chuyện nhóm">
    Tin nhắn nhóm mặc định **yêu cầu đề cập**. Cấu hình mẫu kích hoạt theo từng agent. Phản hồi nhóm/kênh thông thường được đăng tự động; hãy chủ động chọn đường dẫn công cụ tin nhắn cho các phòng dùng chung nơi agent cần quyết định thời điểm lên tiếng:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // đặt thành "message_tool" để yêu cầu gửi bằng công cụ tin nhắn ở mọi nơi
        groupChat: {
          visibleReplies: "message_tool", // chủ động bật; đầu ra hiển thị yêu cầu message(action=send)
          unmentionedInbound: "room_event", // trò chuyện nhóm luôn bật nhưng không đề cập chỉ là ngữ cảnh thụ động
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

    - **Đề cập qua siêu dữ liệu**: @-mention gốc (nhấn để đề cập trên WhatsApp, @bot trên Telegram, v.v.)
    - **Mẫu văn bản**: mẫu biểu thức chính quy an toàn trong `mentionPatterns`
    - **Phản hồi hiển thị**: `messages.visibleReplies` có thể yêu cầu gửi bằng công cụ tin nhắn trên toàn cục; `messages.groupChat.visibleReplies` ghi đè thiết lập đó cho nhóm/kênh.
    - Xem [tài liệu tham chiếu đầy đủ](/vi/gateway/config-channels#group-chat-mention-gating) để biết các chế độ phản hồi hiển thị, giá trị ghi đè theo kênh và chế độ tự trò chuyện.

  </Accordion>

  <Accordion title="Giới hạn Skills theo từng agent">
    Dùng `agents.defaults.skills` làm đường cơ sở dùng chung, sau đó ghi đè các
    agent cụ thể bằng `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // kế thừa github, weather
          { id: "docs", skills: ["docs-search"] }, // thay thế giá trị mặc định
          { id: "locked-down", skills: [] }, // không có Skills
        ],
      },
    }
    ```

    - Bỏ qua `agents.defaults.skills` để mặc định không giới hạn Skills.
    - Bỏ qua `agents.list[].skills` để kế thừa các giá trị mặc định.
    - Đặt `agents.list[].skills: []` để không có Skills.
    - Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config) và
      [Tài liệu tham chiếu cấu hình](/vi/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Cấu hình giám sát tình trạng theo từng kênh">
    Tắt hoặc bật tự động khởi động lại theo tình trạng cho một kênh hoặc tài khoản:

    ```json5
    {
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

    - Dùng `channels.<provider>.healthMonitor.enabled` hoặc `channels.<provider>.accounts.<id>.healthMonitor.enabled` để kiểm soát tự động khởi động lại cho một kênh hoặc tài khoản.
    - Xem [Kiểm tra tình trạng](/vi/gateway/health) để gỡ lỗi vận hành và [tài liệu tham chiếu đầy đủ](/vi/gateway/configuration-reference#gateway) để biết tất cả các trường.

  </Accordion>

  <Accordion title="Cấu hình phiên và đặt lại">
    Phiên kiểm soát tính liên tục và sự cô lập của cuộc trò chuyện:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // khuyến nghị cho nhiều người dùng
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
    - `threadBindings`: các giá trị mặc định toàn cục để định tuyến phiên gắn với luồng. `/focus`, `/unfocus`, `/agents`, `/session idle` và `/session max-age` lần lượt gắn, bỏ gắn, liệt kê và tinh chỉnh thiết lập này theo từng phiên (Discord gắn các luồng, Telegram gắn các chủ đề/cuộc trò chuyện).
    - Xem [Quản lý phiên](/vi/concepts/session) để biết về phạm vi, liên kết danh tính và chính sách gửi.
    - Xem [tài liệu tham khảo đầy đủ](/vi/gateway/config-agents#session) để biết tất cả các trường.

  </Accordion>

  <Accordion title="Bật sandbox">
    Chạy các phiên tác tử trong những môi trường runtime sandbox tách biệt:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // tắt | không phải chính | tất cả
            scope: "agent",    // phiên | tác tử | dùng chung
          },
        },
      },
    }
    ```

    Trước tiên hãy dựng image — từ một bản checkout mã nguồn, chạy `scripts/sandbox-setup.sh`; hoặc nếu cài đặt từ npm, xem lệnh `docker build` nội tuyến trong [Sandbox § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup).

    Xem [Sandbox](/vi/gateway/sandboxing) để biết hướng dẫn đầy đủ và [tài liệu tham khảo đầy đủ](/vi/gateway/config-agents#agentsdefaultssandbox) để biết tất cả các tùy chọn.

  </Accordion>

  <Accordion title="Bật tính năng đẩy qua relay cho các bản dựng iOS chính thức">
    Tính năng đẩy qua relay cho các bản dựng App Store công khai sử dụng relay OpenClaw được lưu trữ: `https://ios-push-relay.openclaw.ai`.

    Các triển khai relay tùy chỉnh yêu cầu một quy trình dựng/triển khai iOS riêng biệt có chủ đích, trong đó URL relay khớp với URL relay của Gateway. Nếu đang sử dụng bản dựng relay tùy chỉnh, hãy đặt cấu hình sau trong Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Tùy chọn. Mặc định: 10000
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
    - Sử dụng quyền gửi theo phạm vi đăng ký do ứng dụng iOS đã ghép đôi chuyển tiếp. Gateway không cần token relay dùng cho toàn bộ triển khai.
    - Gắn mỗi đăng ký qua relay với danh tính Gateway mà ứng dụng iOS đã ghép đôi, để Gateway khác không thể tái sử dụng đăng ký đã lưu.
    - Giữ các bản dựng iOS cục bộ/thủ công sử dụng APNs trực tiếp. Hoạt động gửi qua relay chỉ áp dụng cho các bản dựng được phân phối chính thức đã đăng ký thông qua relay.
    - Phải khớp với URL cơ sở của relay được nhúng trong bản dựng iOS, để lưu lượng đăng ký và gửi đến cùng một triển khai relay.

    Luồng đầu cuối:

    1. Cài đặt ứng dụng iOS chính thức.
    2. Tùy chọn: chỉ cấu hình `gateway.push.apns.relay.baseUrl` trên Gateway khi sử dụng một bản dựng relay tùy chỉnh riêng biệt có chủ đích.
    3. Ghép đôi ứng dụng iOS với Gateway và cho phép cả phiên Node lẫn phiên người vận hành kết nối.
    4. Ứng dụng iOS truy xuất danh tính Gateway, đăng ký với relay bằng App Attest cùng biên lai ứng dụng, sau đó gửi tải trọng `push.apns.register` qua relay đến Gateway đã ghép đôi.
    5. Gateway lưu mã xử lý relay và quyền gửi, sau đó sử dụng chúng cho `push.test`, tín hiệu đánh thức và tín hiệu đánh thức để kết nối lại.

    Lưu ý vận hành:

    - Nếu chuyển ứng dụng iOS sang một Gateway khác, hãy kết nối lại ứng dụng để ứng dụng có thể gửi đăng ký relay mới được gắn với Gateway đó.
    - Nếu phát hành bản dựng iOS mới trỏ đến một triển khai relay khác, ứng dụng sẽ làm mới đăng ký relay đã lưu trong bộ nhớ đệm thay vì tái sử dụng nguồn relay cũ.

    Lưu ý về khả năng tương thích:

    - `OPENCLAW_APNS_RELAY_BASE_URL` và `OPENCLAW_APNS_RELAY_TIMEOUT_MS` vẫn hoạt động dưới dạng các giá trị ghi đè tạm thời bằng biến môi trường.
    - URL relay tùy chỉnh của Gateway phải khớp với URL cơ sở của relay được nhúng trong bản dựng iOS; luồng phát hành App Store công khai từ chối các giá trị ghi đè URL relay iOS tùy chỉnh.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` vẫn là lối thoát phát triển chỉ dành cho loopback; không lưu cố định URL relay HTTP trong cấu hình.

    Xem [Ứng dụng iOS](/vi/platforms/ios#relay-backed-push-for-official-builds) để biết luồng đầu cuối và [Luồng xác thực và tin cậy](/vi/platforms/ios#authentication-and-trust-flow) để biết mô hình bảo mật của relay.

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

    - `every`: chuỗi thời lượng (`30m`, `2h`). Đặt `0m` để tắt. Mặc định: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (ví dụ: `discord`, `matrix`, `telegram` hoặc `whatsapp`)
    - `directPolicy`: `allow` (mặc định) hoặc `block` cho các đích Heartbeat kiểu tin nhắn trực tiếp
    - Xem [Heartbeat](/vi/gateway/heartbeat) để biết hướng dẫn đầy đủ.

  </Accordion>

  <Accordion title="Cấu hình tác vụ Cron">
    ```json5
    {
      cron: {
        enabled: true,
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: xóa các phiên chạy tách biệt đã hoàn tất khỏi các hàng phiên SQLite (mặc định `24h`; đặt `false` để tắt).
    - Lịch sử chạy tự động giữ lại 2000 hàng trạng thái kết thúc mới nhất cho mỗi tác vụ; các hàng bị mất vẫn giữ thời hạn dọn dẹp 24 giờ.
    - Xem [Tác vụ Cron](/vi/automation/cron-jobs) để biết tổng quan tính năng và các ví dụ CLI.

  </Accordion>

  <Accordion title="Thiết lập Webhook (hook)">
    Bật các điểm cuối Webhook HTTP trên Gateway:

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
    - Xem toàn bộ nội dung tải trọng hook/Webhook là dữ liệu đầu vào không đáng tin cậy.
    - Sử dụng một `hooks.token` chuyên dụng; không tái sử dụng các bí mật xác thực Gateway đang hoạt động (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Xác thực hook chỉ sử dụng header (`Authorization: Bearer ...` hoặc `x-openclaw-token`); token trong chuỗi truy vấn sẽ bị từ chối.
    - `hooks.path` không thể là `/`; hãy đặt điểm tiếp nhận Webhook trên một đường dẫn con chuyên dụng như `/hooks`.
    - Giữ các cờ bỏ qua kiểm tra nội dung không an toàn ở trạng thái tắt (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), trừ khi đang gỡ lỗi trong phạm vi được kiểm soát chặt chẽ.
    - Nếu bật `hooks.allowRequestSessionKey`, hãy đồng thời đặt `hooks.allowedSessionKeyPrefixes` để giới hạn các khóa phiên do bên gọi chọn.
    - Đối với các tác tử được kích hoạt bằng hook, nên ưu tiên các cấp mô hình hiện đại, mạnh mẽ cùng chính sách công cụ nghiêm ngặt (ví dụ: chỉ nhắn tin, kết hợp sandbox khi có thể).

    Xem [tài liệu tham khảo đầy đủ](/vi/gateway/configuration-reference#hooks) để biết tất cả các tùy chọn ánh xạ và tích hợp Gmail.

  </Accordion>

  <Accordion title="Cấu hình định tuyến đa tác tử">
    Chạy nhiều tác tử tách biệt với các không gian làm việc và phiên riêng:

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

    Xem [Đa tác tử](/vi/concepts/multi-agent) và [tài liệu tham khảo đầy đủ](/vi/gateway/config-agents#multi-agent-routing) để biết các quy tắc gắn kết và hồ sơ truy cập theo từng tác tử.

  </Accordion>

  <Accordion title="Chia cấu hình thành nhiều tệp ($include)">
    Sử dụng `$include` để tổ chức các cấu hình lớn:

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
    - **Khóa cùng cấp**: được hợp nhất sau các tệp được bao gồm (ghi đè các giá trị được bao gồm)
    - **Đường dẫn tương đối**: được phân giải tương đối so với tệp bao gồm chúng
    - **Định dạng đường dẫn**: đường dẫn bao gồm không được chứa byte null và phải ngắn hơn nghiêm ngặt 4096 ký tự cả trước và sau khi phân giải
    - **Thao tác ghi do OpenClaw thực hiện**: khi một thao tác ghi chỉ thay đổi một phần cấp cao nhất
      được cung cấp bởi một tệp bao gồm duy nhất như `plugins: { $include: "./plugins.json5" }`,
      OpenClaw cập nhật tệp được bao gồm đó và giữ nguyên `openclaw.json`
    - **Không hỗ trợ ghi xuyên qua**: các tệp bao gồm ở gốc, mảng tệp bao gồm và các tệp bao gồm
      có giá trị ghi đè cùng cấp sẽ bị từ chối an toàn đối với thao tác ghi do OpenClaw thực hiện thay vì
      làm phẳng cấu hình
    - **Giới hạn phạm vi**: các đường dẫn `$include` phải được phân giải bên trong thư mục chứa
      `openclaw.json`. Để chia sẻ một cây thư mục giữa các máy hoặc người dùng, hãy đặt
      `OPENCLAW_INCLUDE_ROOTS` thành danh sách đường dẫn (`:` trên POSIX, `;` trên Windows) gồm
      các thư mục bổ sung mà tệp bao gồm có thể tham chiếu. Các liên kết tượng trưng được phân giải
      và kiểm tra lại, vì vậy một đường dẫn về mặt từ vựng nằm trong thư mục cấu hình nhưng có
      đích thực nằm ngoài mọi gốc được phép vẫn sẽ bị từ chối.
    - **Xử lý lỗi**: cung cấp lỗi rõ ràng cho tệp bị thiếu, lỗi phân tích cú pháp, vòng lặp tệp bao gồm, định dạng đường dẫn không hợp lệ và độ dài vượt quá giới hạn

  </Accordion>
</AccordionGroup>

## Tải lại nóng cấu hình

Gateway theo dõi `~/.openclaw/openclaw.json` và tự động áp dụng các thay đổi — hầu hết cài đặt không cần khởi động lại thủ công.

Các chỉnh sửa trực tiếp vào tệp được xem là không đáng tin cậy cho đến khi vượt qua bước xác thực. Trình theo dõi chờ
hoạt động ghi tệp tạm/đổi tên của trình soạn thảo ổn định, đọc tệp cuối cùng và từ chối
các chỉnh sửa bên ngoài không hợp lệ mà không ghi lại `openclaw.json`. Các thao tác ghi cấu hình
do OpenClaw thực hiện sử dụng cùng một cổng kiểm tra schema trước khi ghi (xem [Xác thực nghiêm ngặt](#strict-validation)
để biết các quy tắc ghi đè/hoàn tác áp dụng cho mọi thao tác ghi).

Nếu thấy `config reload skipped (invalid config)` hoặc quá trình khởi động báo cáo `Invalid
config`, hãy kiểm tra cấu hình, chạy `openclaw config validate`, sau đó chạy `openclaw
doctor --fix` để sửa chữa. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config)
để biết danh sách kiểm tra.

### Chế độ tải lại

| Chế độ                   | Hành vi                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (mặc định) | Áp dụng nóng ngay lập tức các thay đổi an toàn. Tự động khởi động lại đối với các thay đổi quan trọng.           |
| **`hot`**              | Chỉ áp dụng nóng các thay đổi an toàn. Ghi cảnh báo khi cần khởi động lại — bạn phải tự xử lý. |
| **`restart`**          | Khởi động lại Gateway khi có bất kỳ thay đổi cấu hình nào, dù an toàn hay không.                                 |
| **`off`**              | Tắt theo dõi tệp. Các thay đổi có hiệu lực vào lần khởi động lại thủ công tiếp theo.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Nội dung nào được áp dụng nóng và nội dung nào cần khởi động lại

Hầu hết các trường được áp dụng nóng mà không có thời gian ngừng hoạt động; một số phần được áp dụng nóng chỉ khởi động lại
hệ thống con tương ứng (kênh, cron, heartbeat, trình giám sát tình trạng) thay vì toàn bộ Gateway. Trong
chế độ `hybrid`, các thay đổi yêu cầu khởi động lại Gateway được xử lý tự động.

| Danh mục            | Trường                                                                  | Cần khởi động lại Gateway?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Kênh            | `channels.*`, `web` (WhatsApp) - tất cả các kênh tích hợp sẵn và kênh Plugin       | Không (khởi động lại kênh đó)   |
| Tác tử & mô hình      | `agent`, `agents`, `models`, `routing`                                  | Không                           |
| Tự động hóa          | `hooks`, `cron`, `agent.heartbeat`                                      | Không (khởi động lại hệ thống con đó) |
| Phiên & tin nhắn | `session`, `messages`                                                   | Không                           |
| Công cụ & phương tiện       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | Không                           |
| Cấu hình Plugin       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | Không (tải lại runtime Plugin)  |
| Giao diện người dùng & mục khác           | `ui`, `logging`, `identity`, `bindings`                                 | Không                           |
| Máy chủ Gateway      | `gateway.*` (cổng, liên kết, xác thực, tailscale, TLS, HTTP, đẩy)              | **Có**                      |
| Hạ tầng      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Có**                      |

<Note>
`gateway.reload` và `gateway.remote` là các ngoại lệ trong `gateway.*` - việc thay đổi chúng **không** kích hoạt khởi động lại. Các Plugin riêng lẻ cũng có thể ghi đè bảng này: một Plugin đã tải có thể khai báo các tiền tố cấu hình kích hoạt khởi động lại của riêng mình (ví dụ: Plugin Canvas đi kèm khởi động lại Gateway cho `plugins.enabled`, `plugins.allow` và `plugins.deny`, không chỉ cho `plugins.entries.canvas` của chính nó), vì vậy hành vi thực tế phụ thuộc vào những Plugin đang hoạt động.
</Note>

### Lập kế hoạch tải lại

Khi bạn chỉnh sửa một tệp nguồn được tham chiếu thông qua `$include`, OpenClaw lập kế hoạch
tải lại dựa trên bố cục do nguồn định nghĩa, không phải dạng xem phẳng trong bộ nhớ.
Điều này giúp các quyết định tải lại nóng (áp dụng nóng hay khởi động lại) có thể dự đoán được ngay cả khi
một phần cấp cao nhất duy nhất nằm trong tệp được bao gồm riêng, chẳng hạn như
`plugins: { $include: "./plugins.json5" }`. Việc lập kế hoạch tải lại sẽ từ chối an toàn nếu
bố cục nguồn không rõ ràng.

## RPC cấu hình (cập nhật theo chương trình)

Đối với công cụ ghi cấu hình qua API Gateway, ưu tiên luồng này:

- `config.schema.lookup` để kiểm tra một cây con (nút lược đồ nông + phần tóm tắt
  các nút con)
- `config.get` để lấy ảnh chụp nhanh hiện tại cùng với `hash`
- `config.patch` cho các cập nhật một phần (bản vá hợp nhất JSON: các đối tượng được hợp nhất, `null`
  sẽ xóa, các mảng được thay thế khi xác nhận rõ ràng bằng `replacePaths` nếu
  các mục sẽ bị xóa)
- `config.apply` chỉ khi bạn có ý định thay thế toàn bộ cấu hình
- `update.run` để tự cập nhật và khởi động lại rõ ràng; bao gồm `continuationMessage` khi phiên sau khi khởi động lại cần chạy thêm một lượt tiếp theo
- `update.status` để kiểm tra dấu hiệu khởi động lại do cập nhật gần nhất và xác minh phiên bản đang chạy sau khi khởi động lại

Các tác tử nên xem `config.schema.lookup` là điểm dừng đầu tiên để biết tài liệu và ràng buộc chính xác
ở cấp trường. Sử dụng [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
khi cần bản đồ cấu hình rộng hơn, các giá trị mặc định hoặc liên kết đến tài liệu tham chiếu
dành riêng cho hệ thống con.

<Note>
Các thao tác ghi của mặt phẳng điều khiển (`config.apply`, `config.patch`, `update.run`)
bị giới hạn ở 30 yêu cầu mỗi 60 giây, theo từng phương thức, theo từng
`deviceId+clientIp`; xem [Giới hạn tốc độ](/vi/gateway/security/rate-limiting). Các yêu cầu khởi động lại
được hợp nhất rồi áp dụng thời gian chờ 30 giây giữa các chu kỳ khởi động lại.
`update.status` chỉ đọc nhưng thuộc phạm vi quản trị viên vì dấu hiệu khởi động lại có thể
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
là có chủ ý. Nếu một bản vá sẽ thay thế hoặc xóa một mảng hiện có
bằng mảng có ít mục hơn, Gateway sẽ từ chối thao tác ghi trừ khi chính xác đường dẫn đó xuất hiện
trong `replacePaths`; các mảng lồng bên dưới mục mảng sử dụng `[]`, chẳng hạn như
`agents.list[].skills`. Điều này ngăn các ảnh chụp nhanh `config.get` bị cắt ngắn
âm thầm ghi đè các mảng định tuyến hoặc danh sách cho phép. Sử dụng `config.apply` khi bạn
có ý định thay thế toàn bộ cấu hình.

## Biến môi trường

OpenClaw đọc các biến môi trường từ tiến trình cha cùng với:

- `.env` từ thư mục làm việc hiện tại (nếu có)
- `~/.openclaw/.env` (phương án dự phòng toàn cục)

Cả hai tệp đều không ghi đè các biến môi trường hiện có. Bạn cũng có thể đặt biến môi trường nội tuyến trong cấu hình:

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
- Biến bị thiếu/trống sẽ gây lỗi khi tải
- Thoát bằng `$${VAR}` để xuất nguyên văn
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

## Tham chiếu đầy đủ

Để xem tài liệu tham chiếu đầy đủ theo từng trường, hãy xem **[Tham chiếu cấu hình](/vi/gateway/configuration-reference)**.

---

_Liên quan: [Ví dụ cấu hình](/vi/gateway/configuration-examples) · [Tham chiếu cấu hình](/vi/gateway/configuration-reference) · [Doctor](/vi/gateway/doctor)_

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
- [Sổ tay vận hành Gateway](/vi/gateway)
