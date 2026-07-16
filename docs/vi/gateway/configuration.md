---
read_when:
    - Thiết lập OpenClaw lần đầu tiên
    - Tìm kiếm các mẫu cấu hình phổ biến
    - Điều hướng đến các phần cấu hình cụ thể
summary: 'Tổng quan về cấu hình: các tác vụ phổ biến, thiết lập nhanh và liên kết đến tài liệu tham khảo đầy đủ'
title: Cấu hình
x-i18n:
    generated_at: "2026-07-16T14:25:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw đọc cấu hình <Tooltip tip="JSON5 hỗ trợ chú thích và dấu phẩy ở cuối">**JSON5**</Tooltip> tùy chọn từ `~/.openclaw/openclaw.json`. Nếu tệp không tồn tại, OpenClaw sử dụng các giá trị mặc định an toàn.

Đường dẫn cấu hình đang hoạt động phải là một tệp thông thường. Các thao tác ghi do OpenClaw thực hiện sẽ thay thế tệp theo cách nguyên tử (đổi tên vào đường dẫn), vì vậy nếu `openclaw.json` là liên kết tượng trưng thì đích của liên kết sẽ bị thay thế thay vì được ghi xuyên qua liên kết — tránh bố cục cấu hình dùng liên kết tượng trưng. Nếu lưu cấu hình ngoài thư mục trạng thái mặc định, hãy trỏ `OPENCLAW_CONFIG_PATH` trực tiếp đến tệp thực.

Các lý do phổ biến để thêm cấu hình:

- Kết nối các kênh và kiểm soát ai có thể nhắn tin cho bot
- Thiết lập mô hình, công cụ, cơ chế sandbox hoặc tự động hóa (cron, hook)
- Tinh chỉnh phiên, phương tiện, mạng hoặc giao diện người dùng

Xem [tài liệu tham khảo đầy đủ](/vi/gateway/configuration-reference) để biết mọi trường hiện có.

Các tác nhân và quy trình tự động hóa nên dùng `config.schema.lookup` để xem tài liệu chính xác ở cấp trường
trước khi chỉnh sửa cấu hình. Dùng trang này để xem hướng dẫn theo tác vụ và
[Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference) để xem bản đồ trường
cùng các giá trị mặc định ở phạm vi rộng hơn.

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
    openclaw onboard       # quy trình làm quen đầy đủ
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
    Mở [http://127.0.0.1:18789](http://127.0.0.1:18789) và dùng thẻ **Cấu hình**.
    Giao diện điều khiển hiển thị biểu mẫu từ lược đồ cấu hình đang hoạt động, bao gồm siêu dữ liệu tài liệu
    `title` / `description` của trường, cùng lược đồ Plugin và kênh khi
    có sẵn, đồng thời cung cấp trình chỉnh sửa **JSON thô** làm phương án dự phòng. Đối với
    giao diện đi sâu và các công cụ khác, Gateway cũng cung cấp `config.schema.lookup` để
    truy xuất một nút lược đồ theo phạm vi đường dẫn cùng phần tóm tắt các nút con trực tiếp.
  </Tab>
  <Tab title="Chỉnh sửa trực tiếp">
    Chỉnh sửa trực tiếp `~/.openclaw/openclaw.json`. Gateway theo dõi tệp và tự động áp dụng các thay đổi (xem [tải lại nóng](#config-hot-reload)).
  </Tab>
</Tabs>

## Xác thực nghiêm ngặt

<Warning>
OpenClaw chỉ chấp nhận các cấu hình khớp hoàn toàn với lược đồ. Khóa không xác định, kiểu sai định dạng hoặc giá trị không hợp lệ khiến Gateway **từ chối khởi động**. Ngoại lệ duy nhất ở cấp gốc là `$schema` (chuỗi), để trình chỉnh sửa có thể đính kèm siêu dữ liệu Lược đồ JSON.
</Warning>

`openclaw config schema` in ra Lược đồ JSON chuẩn tắc mà Giao diện điều khiển
và quy trình xác thực sử dụng. `config.schema.lookup` truy xuất một nút theo phạm vi đường dẫn cùng
phần tóm tắt các nút con cho công cụ đi sâu. Siêu dữ liệu tài liệu `title`/`description` của trường
được truyền qua các đối tượng lồng nhau, nhánh ký tự đại diện (`*`), phần tử mảng (`[]`) và các nhánh `anyOf`/
`oneOf`/`allOf`. Lược đồ Plugin và kênh khi chạy được hợp nhất khi
sổ đăng ký manifest được tải.

Khi xác thực thất bại:

- Gateway không khởi động
- Chỉ các lệnh chẩn đoán hoạt động (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Chạy `openclaw doctor` để xem chính xác các sự cố
- Chạy `openclaw doctor --fix` (`--repair` là cùng một cờ; `--yes` bỏ qua lời nhắc) để áp dụng sửa chữa

Gateway lưu một bản sao đáng tin cậy đã hoạt động tốt gần nhất sau mỗi lần khởi động thành công,
nhưng quá trình khởi động và tải lại nóng không tự động khôi phục bản sao này — chỉ `openclaw doctor --fix`
thực hiện việc đó. Nếu `openclaw.json` không vượt qua xác thực (bao gồm xác thực cục bộ của Plugin), quá trình
khởi động Gateway sẽ thất bại hoặc lần tải lại sẽ bị bỏ qua, còn môi trường chạy hiện tại tiếp tục dùng
cấu hình được chấp nhận gần nhất. Thao tác ghi bị từ chối cũng được lưu dưới dạng `<path>.rejected.<timestamp>` để kiểm tra.
Gateway chặn các thao tác ghi có vẻ vô tình ghi đè phá hủy — làm mất `gateway.mode`,
làm mất khối `meta` hoặc thu nhỏ tệp hơn một nửa — trừ khi thao tác ghi
cho phép rõ ràng các thay đổi có tính phá hủy. Việc nâng cấp thành bản hoạt động tốt gần nhất sẽ bị bỏ qua khi
cấu hình ứng viên chứa phần giữ chỗ bí mật đã được che như `***` hoặc `[redacted]`.

## Tác vụ phổ biến

<AccordionGroup>
  <Accordion title="Thiết lập một kênh (WhatsApp, Telegram, Discord, v.v.)">
    Mỗi kênh có phần cấu hình riêng bên dưới `channels.<provider>`. Xem trang dành riêng cho kênh để biết các bước thiết lập:

    - [Discord](/vi/channels/discord) — `channels.discord`
    - [Feishu](/vi/channels/feishu) — `channels.feishu`
    - [Google Chat](/vi/channels/googlechat) — `channels.googlechat`
    - [iMessage](/vi/channels/imessage) — `channels.imessage`
    - [Mattermost](/vi/channels/mattermost) — `channels.mattermost`
    - [Microsoft Teams](/vi/channels/msteams) — `channels.msteams`
    - [Signal](/vi/channels/signal) — `channels.signal`
    - [Slack](/vi/channels/slack) — `channels.slack`
    - [Telegram](/vi/channels/telegram) — `channels.telegram`
    - [WhatsApp](/vi/channels/whatsapp) — `channels.whatsapp`

    Tất cả các kênh đều dùng cùng một mẫu chính sách tin nhắn trực tiếp:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // ghép nối | danh sách cho phép | mở | vô hiệu hóa
          allowFrom: ["tg:123"], // chỉ dành cho danh sách cho phép/mở
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

    - `agents.defaults.models` xác định danh mục mô hình và đóng vai trò là danh sách cho phép cho `/model`; các mục `provider/*` lọc `/model`, `/models` và các trình chọn mô hình theo những nhà cung cấp đã chọn, trong khi vẫn sử dụng cơ chế khám phá mô hình động.
    - Dùng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm các mục vào danh sách cho phép mà không xóa các mô hình hiện có. Các thao tác thay thế thông thường có thể xóa mục sẽ bị từ chối, trừ khi bạn truyền `--replace`.
    - Tham chiếu mô hình dùng định dạng `provider/model` (ví dụ: `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kiểm soát việc giảm tỷ lệ hình ảnh trong bản chép lời/công cụ (mặc định `1200`); giá trị thấp hơn thường giảm mức sử dụng token thị giác trong các lượt chạy có nhiều ảnh chụp màn hình.
    - Xem [CLI mô hình](/vi/concepts/models) để chuyển đổi mô hình trong cuộc trò chuyện và [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) để biết hành vi luân chuyển xác thực và dự phòng.
    - Đối với nhà cung cấp tùy chỉnh/tự lưu trữ, hãy xem [Nhà cung cấp tùy chỉnh](/vi/gateway/config-tools#custom-providers-and-base-urls) trong tài liệu tham khảo.

  </Accordion>

  <Accordion title="Kiểm soát ai có thể nhắn tin cho bot">
    Quyền truy cập tin nhắn trực tiếp được kiểm soát theo từng kênh qua `dmPolicy` (mặc định `"pairing"`):

    - `"pairing"`: người gửi không xác định nhận mã ghép nối dùng một lần để phê duyệt
    - `"allowlist"`: chỉ người gửi trong `allowFrom` (hoặc kho lưu danh sách cho phép đã ghép nối)
    - `"open"`: cho phép tất cả tin nhắn trực tiếp đến (yêu cầu `allowFrom: ["*"]`)
    - `"disabled"`: bỏ qua tất cả tin nhắn trực tiếp

    Đối với nhóm, dùng `groupPolicy` (`"allowlist" | "open" | "disabled"`) cùng `groupAllowFrom` hoặc danh sách cho phép dành riêng cho kênh.

    Xem [tài liệu tham khảo đầy đủ](/vi/gateway/config-channels#dm-and-group-access) để biết chi tiết theo từng kênh.

  </Accordion>

  <Accordion title="Thiết lập cơ chế kiểm soát lượt đề cập trong trò chuyện nhóm">
    Theo mặc định, tin nhắn nhóm **yêu cầu đề cập**. Cấu hình mẫu kích hoạt theo từng tác nhân. Các phản hồi nhóm/kênh thông thường được đăng tự động; hãy chọn sử dụng đường dẫn công cụ tin nhắn cho các phòng dùng chung nơi tác nhân cần quyết định khi nào nên lên tiếng:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // đặt thành "message_tool" để yêu cầu gửi bằng công cụ tin nhắn ở mọi nơi
        groupChat: {
          visibleReplies: "message_tool", // chọn dùng; đầu ra hiển thị yêu cầu message(action=send)
          unmentionedInbound: "room_event", // trò chuyện nhóm luôn bật không đề cập là ngữ cảnh yên lặng
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

    - **Lượt đề cập trong siêu dữ liệu**: lượt @-đề cập gốc (WhatsApp chạm để đề cập, Telegram @bot, v.v.)
    - **Mẫu văn bản**: mẫu biểu thức chính quy an toàn trong `mentionPatterns`
    - **Phản hồi hiển thị**: `messages.visibleReplies` có thể yêu cầu gửi bằng công cụ tin nhắn trên toàn cục; `messages.groupChat.visibleReplies` ghi đè thiết lập đó cho nhóm/kênh.
    - Xem [tài liệu tham khảo đầy đủ](/vi/gateway/config-channels#group-chat-mention-gating) để biết các chế độ phản hồi hiển thị, thiết lập ghi đè theo kênh và chế độ tự trò chuyện.

  </Accordion>

  <Accordion title="Giới hạn Skills theo tác nhân">
    Dùng `agents.defaults.skills` làm đường cơ sở dùng chung, sau đó ghi đè cho các
    tác nhân cụ thể bằng `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // kế thừa github, weather
          { id: "docs", skills: ["docs-search"] }, // thay thế giá trị mặc định
          { id: "locked-down", skills: [] }, // không có skill
        ],
      },
    }
    ```

    - Bỏ qua `agents.defaults.skills` để mặc định không giới hạn Skills.
    - Bỏ qua `agents.list[].skills` để kế thừa các giá trị mặc định.
    - Đặt `agents.list[].skills: []` để không có Skills.
    - Xem [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config) và
      [Tài liệu tham khảo cấu hình](/vi/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tinh chỉnh giám sát tình trạng kênh của Gateway">
    Kiểm soát mức độ chủ động mà Gateway dùng để khởi động lại các kênh có vẻ không còn cập nhật:

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

    - Các giá trị hiển thị là giá trị mặc định. Đặt `gateway.channelHealthCheckMinutes: 0` để vô hiệu hóa việc khởi động lại do trình giám sát tình trạng trên toàn cục.
    - `channelStaleEventThresholdMinutes` phải lớn hơn hoặc bằng khoảng thời gian kiểm tra.
    - Dùng `channels.<provider>.healthMonitor.enabled` hoặc `channels.<provider>.accounts.<id>.healthMonitor.enabled` để vô hiệu hóa tự động khởi động lại cho một kênh hoặc tài khoản mà không vô hiệu hóa trình giám sát toàn cục.
    - Xem [Kiểm tra tình trạng](/vi/gateway/health) để gỡ lỗi vận hành và [tài liệu tham khảo đầy đủ](/vi/gateway/configuration-reference#gateway) để biết tất cả các trường.

  </Accordion>

  <Accordion title="Tinh chỉnh thời gian chờ bắt tay WebSocket của Gateway">
    Cho máy khách cục bộ thêm thời gian để hoàn tất quá trình bắt tay WebSocket trước xác thực trên
    các máy chủ đang chịu tải hoặc có công suất thấp:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Mặc định là `15000` mili giây.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` vẫn được ưu tiên cho các ghi đè dịch vụ hoặc shell dùng một lần.
    - Ưu tiên khắc phục tình trạng đình trệ khi khởi động/vòng lặp sự kiện trước; tùy chọn này dành cho các máy chủ hoạt động bình thường nhưng chậm trong quá trình khởi động nóng.

  </Accordion>

  <Accordion title="Cấu hình phiên và đặt lại">
    Các phiên kiểm soát tính liên tục và khả năng cô lập của cuộc hội thoại:

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
    - `threadBindings`: các giá trị mặc định toàn cục để định tuyến phiên liên kết với luồng. `/focus`, `/unfocus`, `/agents`, `/session idle` và `/session max-age` lần lượt liên kết, hủy liên kết, liệt kê và điều chỉnh cấu hình này cho từng phiên (Discord liên kết các luồng, Telegram liên kết các chủ đề/cuộc hội thoại).
    - Xem [Quản lý phiên](/vi/concepts/session) để biết về phạm vi, liên kết danh tính và chính sách gửi.
    - Xem [tài liệu tham khảo đầy đủ](/vi/gateway/config-agents#session) để biết tất cả các trường.

  </Accordion>

  <Accordion title="Bật chế độ hộp cát">
    Chạy các phiên tác nhân trong những môi trường chạy hộp cát biệt lập:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // tắt | không phải chính | tất cả
            scope: "agent",    // phiên | tác nhân | dùng chung
          },
        },
      },
    }
    ```

    Trước tiên, hãy dựng ảnh — từ bản kiểm xuất mã nguồn, chạy `scripts/sandbox-setup.sh`; hoặc nếu cài đặt từ npm, xem lệnh `docker build` nội tuyến trong [Hộp cát § Ảnh và thiết lập](/vi/gateway/sandboxing#images-and-setup).

    Xem [Hộp cát](/vi/gateway/sandboxing) để đọc hướng dẫn đầy đủ và [tài liệu tham khảo đầy đủ](/vi/gateway/config-agents#agentsdefaultssandbox) để biết tất cả tùy chọn.

  </Accordion>

  <Accordion title="Bật tính năng đẩy qua rơ-le cho các bản dựng iOS chính thức">
    Tính năng đẩy qua rơ-le cho các bản dựng công khai trên App Store sử dụng rơ-le OpenClaw được lưu trữ: `https://ios-push-relay.openclaw.ai`.

    Việc triển khai rơ-le tùy chỉnh yêu cầu một quy trình dựng/triển khai iOS riêng biệt có chủ đích, trong đó URL rơ-le khớp với URL rơ-le của Gateway. Nếu đang sử dụng bản dựng rơ-le tùy chỉnh, hãy đặt cấu hình sau trong Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Không bắt buộc. Mặc định: 10000
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

    Cấu hình này thực hiện các việc sau:

    - Cho phép Gateway gửi `push.test`, tín hiệu đánh thức và tín hiệu đánh thức để kết nối lại thông qua rơ-le bên ngoài.
    - Sử dụng quyền gửi theo phạm vi đăng ký do ứng dụng iOS đã ghép đôi chuyển tiếp. Gateway không cần mã thông báo rơ-le cho toàn bộ lượt triển khai.
    - Liên kết từng đăng ký qua rơ-le với danh tính Gateway mà ứng dụng iOS đã ghép đôi, để Gateway khác không thể sử dụng lại đăng ký đã lưu.
    - Duy trì APNs trực tiếp cho các bản dựng iOS cục bộ/thủ công. Việc gửi qua rơ-le chỉ áp dụng cho các bản dựng được phân phối chính thức đã đăng ký thông qua rơ-le.
    - Phải khớp với URL cơ sở của rơ-le được nhúng trong bản dựng iOS để lưu lượng đăng ký và gửi đi đến cùng một lượt triển khai rơ-le.

    Luồng đầu cuối:

    1. Cài đặt ứng dụng iOS chính thức.
    2. Không bắt buộc: chỉ cấu hình `gateway.push.apns.relay.baseUrl` trên Gateway khi sử dụng một bản dựng rơ-le tùy chỉnh riêng biệt có chủ đích.
    3. Ghép đôi ứng dụng iOS với Gateway và cho phép cả phiên Node lẫn phiên người vận hành kết nối.
    4. Ứng dụng iOS lấy danh tính Gateway, đăng ký với rơ-le bằng App Attest cùng biên lai ứng dụng, rồi phát hành tải trọng `push.apns.register` qua rơ-le lên Gateway đã ghép đôi.
    5. Gateway lưu mã định danh rơ-le và quyền gửi, sau đó sử dụng chúng cho `push.test`, tín hiệu đánh thức và tín hiệu đánh thức để kết nối lại.

    Ghi chú vận hành:

    - Nếu chuyển ứng dụng iOS sang một Gateway khác, hãy kết nối lại ứng dụng để ứng dụng có thể phát hành đăng ký rơ-le mới được liên kết với Gateway đó.
    - Nếu phát hành một bản dựng iOS mới trỏ đến một lượt triển khai rơ-le khác, ứng dụng sẽ làm mới đăng ký rơ-le được lưu vào bộ nhớ đệm thay vì sử dụng lại nguồn gốc rơ-le cũ.

    Ghi chú về khả năng tương thích:

    - `OPENCLAW_APNS_RELAY_BASE_URL` và `OPENCLAW_APNS_RELAY_TIMEOUT_MS` vẫn hoạt động dưới dạng các ghi đè biến môi trường tạm thời.
    - URL rơ-le Gateway tùy chỉnh phải khớp với URL cơ sở của rơ-le được nhúng trong bản dựng iOS; quy trình phát hành công khai trên App Store từ chối các ghi đè URL rơ-le iOS tùy chỉnh.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` vẫn là lối thoát chỉ dành cho vòng lặp cục bộ trong môi trường phát triển; không lưu cố định URL rơ-le HTTP trong cấu hình.

    Xem [Ứng dụng iOS](/vi/platforms/ios#relay-backed-push-for-official-builds) để biết luồng đầu cuối và [Luồng xác thực và tin cậy](/vi/platforms/ios#authentication-and-trust-flow) để biết mô hình bảo mật của rơ-le.

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
    - `directPolicy`: `allow` (mặc định) hoặc `block` cho các đích Heartbeat kiểu tin nhắn trực tiếp
    - Xem [Heartbeat](/vi/gateway/heartbeat) để đọc hướng dẫn đầy đủ.

  </Accordion>

  <Accordion title="Cấu hình tác vụ Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // mặc định; phân phối cron + thực thi lượt tác nhân cron biệt lập
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: xóa các phiên chạy biệt lập đã hoàn tất khỏi các hàng phiên SQLite (mặc định `24h`; đặt thành `false` để tắt).
    - Lịch sử chạy tự động giữ lại 2000 hàng trạng thái kết thúc mới nhất cho mỗi tác vụ; các hàng bị mất vẫn giữ khoảng thời gian dọn dẹp 24 giờ.
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

    Ghi chú bảo mật:
    - Coi toàn bộ nội dung tải trọng hook/Webhook là dữ liệu đầu vào không đáng tin cậy.
    - Sử dụng một `hooks.token` chuyên dụng; không sử dụng lại các bí mật xác thực Gateway đang hoạt động (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - Xác thực hook chỉ sử dụng tiêu đề (`Authorization: Bearer ...` hoặc `x-openclaw-token`); mã thông báo trong chuỗi truy vấn sẽ bị từ chối.
    - `hooks.path` không được là `/`; hãy đặt đầu vào Webhook trên một đường dẫn con chuyên dụng, chẳng hạn như `/hooks`.
    - Giữ các cờ bỏ qua nội dung không an toàn ở trạng thái tắt (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), trừ khi đang gỡ lỗi trong phạm vi được giới hạn chặt chẽ.
    - Nếu bật `hooks.allowRequestSessionKey`, hãy đặt cả `hooks.allowedSessionKeyPrefixes` để giới hạn các khóa phiên do bên gọi chọn.
    - Đối với các tác nhân được kích hoạt bằng hook, nên ưu tiên các cấp mô hình hiện đại mạnh và chính sách công cụ nghiêm ngặt (ví dụ: chỉ nhắn tin, kết hợp với hộp cát khi có thể).

    Xem [tài liệu tham khảo đầy đủ](/vi/gateway/configuration-reference#hooks) để biết tất cả tùy chọn ánh xạ và cách tích hợp Gmail.

  </Accordion>

  <Accordion title="Cấu hình định tuyến đa tác nhân">
    Chạy nhiều tác nhân biệt lập với các không gian làm việc và phiên riêng biệt:

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
    - **Mảng tệp**: hợp nhất sâu theo thứ tự (tệp sau được ưu tiên), tối đa 10 cấp lồng nhau
    - **Khóa cùng cấp**: được hợp nhất sau khi bao gồm (ghi đè các giá trị được bao gồm)
    - **Đường dẫn tương đối**: được phân giải tương đối so với tệp bao gồm
    - **Định dạng đường dẫn**: đường dẫn bao gồm không được chứa byte null và phải có độ dài nhỏ hơn 4096 ký tự nghiêm ngặt cả trước lẫn sau khi phân giải
    - **Thao tác ghi do OpenClaw sở hữu**: khi thao tác ghi chỉ thay đổi một phần cấp cao nhất
      được hỗ trợ bởi một lệnh bao gồm tệp đơn, chẳng hạn như `plugins: { $include: "./plugins.json5" }`,
      OpenClaw cập nhật tệp được bao gồm đó và giữ nguyên `openclaw.json`
    - **Không hỗ trợ ghi xuyên qua**: các lệnh bao gồm ở gốc, mảng lệnh bao gồm và lệnh bao gồm
      có ghi đè cùng cấp sẽ đóng an toàn đối với các thao tác ghi do OpenClaw sở hữu thay vì
      làm phẳng cấu hình
    - **Giới hạn phạm vi**: các đường dẫn `$include` phải được phân giải bên dưới thư mục chứa
      `openclaw.json`. Để dùng chung một cây thư mục giữa nhiều máy hoặc người dùng, hãy đặt
      `OPENCLAW_INCLUDE_ROOTS` thành một danh sách đường dẫn (`:` trên POSIX, `;` trên Windows) gồm
      các thư mục bổ sung mà lệnh bao gồm có thể tham chiếu. Các liên kết tượng trưng được phân giải
      và kiểm tra lại, vì vậy một đường dẫn về mặt từ vựng nằm trong thư mục cấu hình nhưng có
      đích thực thoát khỏi mọi gốc được phép vẫn sẽ bị từ chối.
    - **Xử lý lỗi**: thông báo lỗi rõ ràng đối với tệp bị thiếu, lỗi phân tích cú pháp, lệnh bao gồm vòng tròn, định dạng đường dẫn không hợp lệ và độ dài vượt mức

  </Accordion>
</AccordionGroup>

## Tải lại nóng cấu hình

Gateway theo dõi `~/.openclaw/openclaw.json` và tự động áp dụng các thay đổi — hầu hết cài đặt không cần khởi động lại thủ công.

Các chỉnh sửa trực tiếp vào tệp được coi là không đáng tin cậy cho đến khi vượt qua bước xác thực. Trình theo dõi chờ
cho đến khi hoạt động ghi tệp tạm/đổi tên của trình soạn thảo ổn định, đọc tệp cuối cùng và từ chối
các chỉnh sửa bên ngoài không hợp lệ mà không ghi lại `openclaw.json`. Các thao tác ghi cấu hình
do OpenClaw sở hữu sử dụng cùng cổng lược đồ trước khi ghi (xem [Xác thực nghiêm ngặt](#strict-validation)
để biết các quy tắc ghi đè/hoàn tác áp dụng cho mọi thao tác ghi).

Nếu thấy `config reload skipped (invalid config)` hoặc quá trình khởi động báo cáo `Invalid
config`, hãy kiểm tra cấu hình, chạy `openclaw config validate`, rồi chạy `openclaw
doctor --fix` để sửa chữa. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config)
để biết danh sách kiểm tra.

### Chế độ tải lại

| Chế độ                   | Hành vi                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (mặc định) | Áp dụng nóng ngay lập tức các thay đổi an toàn. Tự động khởi động lại đối với các thay đổi quan trọng.           |
| **`hot`**              | Chỉ áp dụng nóng các thay đổi an toàn. Ghi cảnh báo khi cần khởi động lại — bạn tự xử lý việc đó. |
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
| Máy chủ Gateway      | `gateway.*` (cổng, liên kết, xác thực, Tailscale, TLS, HTTP, đẩy)              | **Có**                      |
| Hạ tầng      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Có**                      |

<Note>
`gateway.reload` và `gateway.remote` là các ngoại lệ trong `gateway.*` — việc thay đổi chúng **không** kích hoạt khởi động lại. Từng Plugin cũng có thể ghi đè bảng này: một Plugin đã tải có thể khai báo các tiền tố cấu hình riêng kích hoạt khởi động lại (ví dụ: Plugin Canvas đi kèm khởi động lại Gateway đối với `plugins.enabled`, `plugins.allow` và `plugins.deny`, không chỉ `plugins.entries.canvas` của riêng nó), vì vậy hành vi thực tế phụ thuộc vào các Plugin đang hoạt động.
</Note>

### Lập kế hoạch tải lại

Khi bạn chỉnh sửa một tệp nguồn được tham chiếu thông qua `$include`, OpenClaw lập kế hoạch
tải lại từ bố cục do nguồn định nghĩa, không phải từ dạng xem phẳng trong bộ nhớ.
Điều này giúp các quyết định tải lại nóng (áp dụng nóng hay khởi động lại) luôn có thể dự đoán được, ngay cả khi
một phần cấp cao nhất nằm trong tệp được bao gồm riêng, chẳng hạn như
`plugins: { $include: "./plugins.json5" }`. Việc lập kế hoạch tải lại sẽ dừng theo hướng an toàn nếu
bố cục nguồn không rõ ràng.

## RPC cấu hình (cập nhật theo chương trình)

Đối với công cụ ghi cấu hình qua API của Gateway, ưu tiên quy trình sau:

- `config.schema.lookup` để kiểm tra một cây con (nút lược đồ nông + phần tóm tắt
  các nút con)
- `config.get` để lấy ảnh chụp nhanh hiện tại cùng `hash`
- `config.patch` cho các bản cập nhật một phần (bản vá hợp nhất JSON: đối tượng được hợp nhất, `null`
  sẽ xóa, mảng được thay thế khi được xác nhận rõ ràng bằng `replacePaths` nếu
  có mục sẽ bị xóa)
- `config.apply` chỉ khi bạn định thay thế toàn bộ cấu hình
- `update.run` để tự cập nhật rõ ràng rồi khởi động lại; bao gồm `continuationMessage` khi phiên sau khi khởi động lại cần chạy thêm một lượt tiếp theo
- `update.status` để kiểm tra chỉ dấu khởi động lại do cập nhật mới nhất và xác minh phiên bản đang chạy sau khi khởi động lại

Các tác tử nên xem `config.schema.lookup` là điểm dừng đầu tiên để tra cứu tài liệu và ràng buộc chính xác
ở cấp trường. Sử dụng [Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference)
khi cần bản đồ cấu hình rộng hơn, các giá trị mặc định hoặc liên kết đến tài liệu tham khảo riêng
của từng hệ thống con.

<Note>
Các thao tác ghi trên mặt phẳng điều khiển (`config.apply`, `config.patch`, `update.run`) bị
giới hạn ở 3 yêu cầu mỗi 60 giây cho mỗi `deviceId+clientIp`. Các yêu cầu khởi động lại
được gộp lại, sau đó áp dụng thời gian chờ 30 giây giữa các chu kỳ khởi động lại.
`update.status` là chỉ đọc nhưng chỉ dành cho quản trị viên vì chỉ dấu khởi động lại có thể
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
là có chủ đích. Nếu một bản vá sẽ thay thế hoặc xóa một mảng hiện có
bằng mảng có ít mục hơn, Gateway sẽ từ chối thao tác ghi trừ khi đường dẫn chính xác đó xuất hiện
trong `replacePaths`; các mảng lồng nhau bên dưới mục mảng sử dụng `[]`, chẳng hạn như
`agents.list[].skills`. Điều này ngăn các ảnh chụp nhanh `config.get` bị cắt ngắn
âm thầm ghi đè các mảng định tuyến hoặc danh sách cho phép. Sử dụng `config.apply` khi bạn
định thay thế toàn bộ cấu hình.

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

<Accordion title="Nhập biến môi trường shell (tùy chọn)">
  Nếu được bật và các khóa dự kiến chưa được đặt, OpenClaw chạy shell đăng nhập của bạn và chỉ nhập các khóa còn thiếu:

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
  Tham chiếu các biến môi trường trong bất kỳ giá trị chuỗi cấu hình nào bằng `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Quy tắc:

- Chỉ khớp tên viết hoa: `[A-Z_][A-Z0-9_]*`
- Biến bị thiếu/rỗng gây ra lỗi khi tải
- Thoát bằng `$${VAR}` để xuất giá trị nguyên văn
- Hoạt động bên trong các tệp `$include`
- Thay thế nội tuyến: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Tham chiếu bí mật (biến môi trường, tệp, thực thi)">
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

Thông tin chi tiết về SecretRef (bao gồm `secrets.providers` cho `env`/`file`/`exec`) nằm trong [Quản lý bí mật](/vi/gateway/secrets).
Các đường dẫn thông tin xác thực được hỗ trợ được liệt kê trong [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Accordion>

Xem [Môi trường](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên và các nguồn.

## Tài liệu tham khảo đầy đủ

Để xem tài liệu tham khảo đầy đủ cho từng trường, hãy xem **[Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference)**.

---

_Liên quan: [Ví dụ cấu hình](/vi/gateway/configuration-examples) · [Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference) · [Doctor](/vi/gateway/doctor)_

## Liên quan

- [Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
- [Sổ tay vận hành Gateway](/vi/gateway)
