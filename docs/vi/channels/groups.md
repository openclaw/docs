---
read_when:
    - Thay đổi hành vi trò chuyện nhóm hoặc cơ chế chặn theo lượt nhắc
    - Giới hạn phạm vi `mentionPatterns` cho các cuộc trò chuyện nhóm cụ thể
sidebarTitle: Groups
summary: Hành vi trò chuyện nhóm trên các bề mặt (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Nhóm
x-i18n:
    generated_at: "2026-06-27T17:10:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw xử lý trò chuyện nhóm nhất quán trên các bề mặt: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

Đối với các phòng luôn bật cần cung cấp ngữ cảnh yên lặng trừ khi agent gửi rõ ràng một tin nhắn hiển thị, xem [Sự kiện phòng nền](/vi/channels/ambient-room-events).

## Giới thiệu cho người mới bắt đầu (2 phút)

OpenClaw "sống" trên chính các tài khoản nhắn tin của bạn. Không có người dùng bot WhatsApp riêng biệt. Nếu **bạn** có mặt trong một nhóm, OpenClaw có thể thấy nhóm đó và phản hồi ở đó.

Hành vi mặc định:

- Nhóm bị hạn chế (`groupPolicy: "allowlist"`).
- Phản hồi yêu cầu được nhắc đến, trừ khi bạn tắt rõ ràng cổng nhắc đến.
- Phản hồi hiển thị trong nhóm/kênh dùng công cụ `message` theo mặc định.

Diễn giải: người gửi trong danh sách cho phép có thể kích hoạt OpenClaw bằng cách nhắc đến nó.

<Note>
**Tóm tắt**

- **Quyền truy cập DM** được kiểm soát bằng `*.allowFrom`.
- **Quyền truy cập nhóm** được kiểm soát bằng `*.groupPolicy` + danh sách cho phép (`*.groups`, `*.groupAllowFrom`).
- **Kích hoạt phản hồi** được kiểm soát bằng cổng nhắc đến (`requireMention`, `/activation`).

</Note>

Luồng nhanh (điều gì xảy ra với một tin nhắn nhóm):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Phản hồi hiển thị

Đối với các yêu cầu nhóm/kênh thông thường, OpenClaw mặc định dùng `messages.groupChat.visibleReplies: "automatic"`. Văn bản cuối cùng của assistant được đăng qua đường dẫn phản hồi hiển thị cũ, trừ khi bạn chọn để phòng chỉ xuất qua công cụ message.

Dùng `messages.groupChat.visibleReplies: "message_tool"` khi một phòng dùng chung nên để agent quyết định khi nào nói bằng cách gọi `message(action=send)`. Cách này hoạt động tốt nhất với các phòng nhóm được hỗ trợ bởi những model thế hệ mới nhất, đáng tin cậy với công cụ, chẳng hạn GPT 5.5. Nếu model bỏ lỡ công cụ đó và trả về văn bản cuối cùng có nội dung đáng kể, OpenClaw sẽ giữ văn bản cuối cùng đó ở chế độ riêng tư thay vì đăng vào phòng.

Dùng `"automatic"` cho các model yếu hơn hoặc runtime không hiểu đáng tin cậy cơ chế chỉ giao qua công cụ. Ở chế độ tự động, văn bản cuối cùng của assistant là đường dẫn phản hồi hiển thị nguồn, nên một model không thể gọi nhất quán `message(action=send)` vẫn có thể trả lời bình thường.

Ở chế độ tự động, các phản hồi cuối cùng dạng văn bản thông thường được đăng trực tiếp vào phòng. Nếu phản hồi hiển thị cần tệp, hình ảnh hoặc tệp đính kèm khác, agent vẫn có thể dùng `message(action=send)` cho tệp đính kèm đó thay vì cố ép nó qua phản hồi văn bản cuối cùng.

Nếu công cụ message không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ quay lại phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi.
`openclaw doctor` cảnh báo về sự không khớp này.

Đối với trò chuyện trực tiếp và mọi sự kiện nguồn khác, dùng `messages.visibleReplies: "message_tool"` để áp dụng cùng hành vi phản hồi hiển thị chỉ qua công cụ trên toàn cục. Các lượt trực tiếp WebChat nội bộ mặc định giao phản hồi cuối cùng tự động để Pi và Codex nhận cùng một hợp đồng phản hồi hiển thị. Đặt `messages.visibleReplies: "message_tool"` để cố ý yêu cầu `message(action=send)` cho đầu ra hiển thị. `messages.groupChat.visibleReplies` vẫn là ghi đè cụ thể hơn cho các phòng nhóm/kênh.

Điều này thay thế mẫu cũ buộc model trả lời `NO_REPLY` cho hầu hết các lượt ở chế độ theo dõi ngầm. Ở chế độ chỉ qua công cụ, prompt không định nghĩa hợp đồng `NO_REPLY`. Không làm gì hiển thị chỉ đơn giản là không gọi công cụ message.

Ràng buộc hội thoại do plugin sở hữu là ngoại lệ. Khi một plugin ràng buộc một thread và nhận lượt đến, phản hồi do plugin trả về là phản hồi ràng buộc hiển thị; nó không cần `message(action=send)`. Phản hồi đó là đầu ra runtime của plugin, không phải văn bản cuối cùng riêng tư của model.

Chỉ báo đang nhập vẫn được gửi cho các yêu cầu nhóm trực tiếp. Các sự kiện phòng nền luôn bật, khi được bật, vẫn nghiêm ngặt và yên lặng trừ khi agent gọi công cụ message.

Theo mặc định, các phiên chặn các bản tóm tắt công cụ/tiến trình dài dòng. Dùng `/verbose on`
để hiển thị các bản tóm tắt đó cho phiên hiện tại khi gỡ lỗi, và
`/verbose off` để quay lại hành vi chỉ phản hồi cuối cùng. Cùng trạng thái verbose
áp dụng trên trò chuyện trực tiếp, nhóm, kênh và chủ đề diễn đàn.

Để gửi trò chuyện nhóm luôn bật không được nhắc đến làm ngữ cảnh phòng yên lặng thay vì yêu cầu người dùng, dùng [Sự kiện phòng nền](/vi/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Mặc định là `unmentionedInbound: "user_request"`.

Tin nhắn được nhắc đến, lệnh, yêu cầu hủy và DM vẫn là yêu cầu người dùng.

Để yêu cầu đầu ra hiển thị đi qua công cụ message cho các yêu cầu nhóm/kênh:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Gateway tải nóng cấu hình `messages` sau khi tệp được lưu. Chỉ khởi động lại
khi việc theo dõi tệp hoặc tải lại cấu hình bị tắt trong triển khai.

Để yêu cầu đầu ra hiển thị đi qua công cụ message cho mọi cuộc trò chuyện nguồn:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Lệnh slash gốc (Discord, Telegram và các bề mặt khác có hỗ trợ lệnh gốc) bỏ qua `visibleReplies: "message_tool"` và luôn trả lời hiển thị để UI lệnh gốc của kênh nhận được phản hồi mong đợi. Điều này chỉ áp dụng cho các lượt lệnh gốc đã được xác thực; lệnh `/...` được gõ dạng văn bản và các lượt trò chuyện thông thường vẫn tuân theo mặc định nhóm đã cấu hình.

## Khả năng hiển thị ngữ cảnh và danh sách cho phép

Có hai cơ chế kiểm soát khác nhau trong an toàn nhóm:

- **Ủy quyền kích hoạt**: ai có thể kích hoạt agent (`groupPolicy`, `groups`, `groupAllowFrom`, danh sách cho phép theo kênh).
- **Khả năng hiển thị ngữ cảnh**: ngữ cảnh bổ sung nào được đưa vào model (văn bản trả lời, trích dẫn, lịch sử thread, siêu dữ liệu chuyển tiếp).

Theo mặc định, OpenClaw ưu tiên hành vi trò chuyện thông thường và giữ ngữ cảnh gần như đúng như đã nhận. Điều này nghĩa là danh sách cho phép chủ yếu quyết định ai có thể kích hoạt hành động, không phải một ranh giới biên tập phổ quát cho mọi đoạn trích dẫn hoặc lịch sử.

<AccordionGroup>
  <Accordion title="Hành vi hiện tại phụ thuộc vào từng kênh">
    - Một số kênh đã áp dụng lọc theo người gửi cho ngữ cảnh bổ sung trong các đường dẫn cụ thể (ví dụ gieo thread Slack, tra cứu trả lời/thread Matrix).
    - Các kênh khác vẫn chuyển tiếp ngữ cảnh trích dẫn/trả lời/chuyển tiếp đúng như đã nhận.

  </Accordion>
  <Accordion title="Hướng tăng cường bảo mật (đã lên kế hoạch)">
    - `contextVisibility: "all"` (mặc định) giữ hành vi hiện tại là đúng như đã nhận.
    - `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung theo người gửi trong danh sách cho phép.
    - `contextVisibility: "allowlist_quote"` là `allowlist` cộng thêm một ngoại lệ trích dẫn/trả lời rõ ràng.

    Cho đến khi mô hình tăng cường này được triển khai nhất quán trên các kênh, hãy dự kiến có khác biệt theo từng bề mặt.

  </Accordion>
</AccordionGroup>

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                      | Cần đặt                                                   |
| -------------------------------------------- | ---------------------------------------------------------- |
| Cho phép mọi nhóm nhưng chỉ trả lời khi @mention | `groups: { "*": { requireMention: true } }`                |
| Tắt mọi phản hồi nhóm                        | `groupPolicy: "disabled"`                                  |
| Chỉ các nhóm cụ thể                          | `groups: { "<group-id>": { ... } }` (không có khóa `"*"`)  |
| Chỉ bạn có thể kích hoạt trong nhóm          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Tái sử dụng một tập người gửi tin cậy trên nhiều kênh | `groupAllowFrom: ["accessGroup:operators"]`                |

Đối với danh sách cho phép người gửi có thể tái sử dụng, xem [Nhóm truy cập](/vi/channels/access-groups).

## Khóa phiên

- Phiên nhóm dùng khóa phiên `agent:<agentId>:<channel>:group:<id>` (phòng/kênh dùng `agent:<agentId>:<channel>:channel:<id>`).
- Chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào id nhóm để mỗi chủ đề có phiên riêng.
- Trò chuyện trực tiếp dùng phiên chính (hoặc theo từng người gửi nếu được cấu hình).
- Heartbeat bị bỏ qua đối với phiên nhóm.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Mẫu: DM cá nhân + nhóm công khai (một agent)

Có — cách này hoạt động tốt nếu lưu lượng "cá nhân" của bạn là **DM** và lưu lượng "công khai" của bạn là **nhóm**.

Lý do: ở chế độ một agent, DM thường đi vào khóa phiên **chính** (`agent:main:main`), trong khi nhóm luôn dùng khóa phiên **không chính** (`agent:main:<channel>:group:<id>`). Nếu bạn bật sandboxing với `mode: "non-main"`, các phiên nhóm đó chạy trong backend sandbox đã cấu hình, còn phiên DM chính của bạn vẫn ở trên host. Docker là backend mặc định nếu bạn không chọn backend nào.

Điều này mang lại cho bạn một "bộ não" agent (workspace + bộ nhớ dùng chung), nhưng hai tư thế thực thi:

- **DM**: đầy đủ công cụ (host)
- **Nhóm**: sandbox + công cụ bị hạn chế

<Note>
Nếu bạn cần workspace/persona thực sự tách biệt ("cá nhân" và "công khai" tuyệt đối không được trộn lẫn), hãy dùng agent thứ hai + ràng buộc. Xem [Định tuyến đa agent](/vi/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM trên host, nhóm trong sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Nhóm chỉ thấy một thư mục trong danh sách cho phép">
    Muốn "nhóm chỉ có thể thấy thư mục X" thay vì "không có quyền truy cập host"? Giữ `workspaceAccess: "none"` và chỉ mount các đường dẫn trong danh sách cho phép vào sandbox:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

Liên quan:

- Khóa cấu hình và mặc định: [Cấu hình Gateway](/vi/gateway/config-agents#agentsdefaultssandbox)
- Gỡ lỗi vì sao một công cụ bị chặn: [Sandbox so với Chính sách công cụ so với Nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
- Chi tiết bind mount: [Sandboxing](/vi/gateway/sandboxing#custom-bind-mounts)

## Nhãn hiển thị

- Nhãn UI dùng `displayName` khi có, được định dạng là `<channel>:<token>`.
- `#room` được dành riêng cho phòng/kênh; trò chuyện nhóm dùng `g-<slug>` (chữ thường, khoảng trắng -> `-`, giữ `#@+._-`).

## Chính sách nhóm

Kiểm soát cách xử lý tin nhắn nhóm/phòng theo từng kênh:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Chính sách    | Hành vi                                                      |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Nhóm bỏ qua danh sách cho phép; kiểm soát lượt nhắc đến vẫn áp dụng. |
| `"disabled"`  | Chặn hoàn toàn tất cả tin nhắn nhóm.                         |
| `"allowlist"` | Chỉ cho phép các nhóm/phòng khớp với danh sách cho phép đã cấu hình. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` tách biệt với kiểm soát lượt nhắc đến (yêu cầu @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: dùng `groupAllowFrom` (dự phòng: `allowFrom` tường minh).
    - Signal: `groupAllowFrom` có thể khớp với ID nhóm Signal gửi đến hoặc số điện thoại/UUID của người gửi.
    - Phê duyệt ghép cặp DM (các mục lưu trữ `*-allowFrom`) chỉ áp dụng cho quyền truy cập DM; việc cấp quyền cho người gửi trong nhóm vẫn phải tường minh trong danh sách cho phép của nhóm.
    - Discord: danh sách cho phép dùng `channels.discord.guilds.<id>.channels`.
    - Slack: danh sách cho phép dùng `channels.slack.channels`.
    - Matrix: danh sách cho phép dùng `channels.matrix.groups`. Nên dùng ID phòng hoặc bí danh; tra cứu tên phòng đã tham gia là nỗ lực tối đa, và các tên không phân giải được sẽ bị bỏ qua khi chạy. Dùng `channels.matrix.groupAllowFrom` để hạn chế người gửi; danh sách cho phép `users` theo từng phòng cũng được hỗ trợ.
    - DM nhóm được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Danh sách cho phép của Telegram có thể khớp với ID người dùng (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) hoặc tên người dùng (`"@alice"` hoặc `"alice"`); tiền tố không phân biệt chữ hoa/thường.
    - Mặc định là `groupPolicy: "allowlist"`; nếu danh sách cho phép nhóm của bạn trống, tin nhắn nhóm sẽ bị chặn.
    - An toàn khi chạy: khi thiếu hoàn toàn một khối nhà cung cấp (`channels.<provider>` không có), chính sách nhóm sẽ quay về chế độ đóng khi lỗi (thường là `allowlist`) thay vì kế thừa `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Mô hình tư duy nhanh (thứ tự đánh giá cho tin nhắn nhóm):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    Danh sách cho phép nhóm (`*.groups`, `*.groupAllowFrom`, danh sách cho phép riêng theo kênh).
  </Step>
  <Step title="Mention gating">
    Kiểm soát lượt nhắc đến (`requireMention`, `/activation`).
  </Step>
</Steps>

## Kiểm soát lượt nhắc đến (mặc định)

Tin nhắn nhóm yêu cầu một lượt nhắc đến trừ khi được ghi đè theo từng nhóm. Giá trị mặc định nằm theo từng hệ con dưới `*.groups."*"`.

Trả lời một tin nhắn bot được tính là lượt nhắc đến ngầm định khi kênh hỗ trợ siêu dữ liệu trả lời. Trích dẫn một tin nhắn bot cũng có thể được tính là lượt nhắc đến ngầm định trên các kênh cung cấp siêu dữ liệu trích dẫn. Các trường hợp tích hợp hiện tại gồm Telegram, WhatsApp, Slack, Discord, Microsoft Teams và ZaloUser.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## Phạm vi mẫu nhắc đến đã cấu hình

`mentionPatterns` đã cấu hình là các bộ kích hoạt dự phòng bằng regex. Dùng chúng khi nền tảng không cung cấp lượt nhắc đến bot gốc, hoặc khi bạn muốn văn bản thuần như `openclaw:` được tính là một lượt nhắc đến. Lượt nhắc đến gốc của nền tảng là riêng biệt: khi Discord, Slack, Telegram, Matrix hoặc kênh khác có thể chứng minh tin nhắn đã nhắc đến bot một cách tường minh, lượt nhắc đến gốc đó vẫn kích hoạt ngay cả khi các mẫu regex đã cấu hình bị từ chối.

Theo mặc định, các mẫu nhắc đến đã cấu hình áp dụng ở mọi nơi mà kênh chuyển thông tin nhà cung cấp và cuộc trò chuyện vào quá trình phát hiện lượt nhắc đến. Để tránh các mẫu rộng đánh thức tác nhân trong mọi nhóm, hãy giới hạn phạm vi theo từng kênh bằng `channels.<channel>.mentionPatterns`.

Dùng `mode: "deny"` khi các mẫu nhắc đến bằng regex nên tắt theo mặc định cho một kênh, rồi bật riêng từng phòng bằng `allowIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Dùng `mode: "allow"` mặc định (hoặc bỏ qua `mode`) khi các mẫu nhắc đến bằng regex nên áp dụng rộng, rồi tắt chúng trong các phòng ồn bằng `denyIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

Phân giải chính sách:

| Trường          | Tác dụng                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Các mẫu nhắc đến bằng regex được bật trừ khi ID cuộc trò chuyện nằm trong `denyIn`. Đây là mặc định.                 |
| `mode: "deny"`  | Các mẫu nhắc đến bằng regex bị tắt trừ khi ID cuộc trò chuyện nằm trong `allowIn`.                                   |
| `allowIn`       | Các ID cuộc trò chuyện nơi mẫu nhắc đến bằng regex được bật trong chế độ từ chối.                                    |
| `denyIn`        | Các ID cuộc trò chuyện nơi mẫu nhắc đến bằng regex bị tắt. `denyIn` thắng `allowIn` nếu cả hai cùng chứa một ID.     |

Chính sách regex theo phạm vi được hỗ trợ hiện nay:

| Kênh     | ID dùng trong `allowIn` / `denyIn`                              |
| -------- | --------------------------------------------------------------- |
| Discord  | ID kênh Discord.                                                |
| Matrix   | ID phòng Matrix.                                                |
| Slack    | ID kênh Slack.                                                  |
| Telegram | ID chat nhóm, hoặc `chatId:topic:threadId` cho chủ đề diễn đàn. |
| WhatsApp | ID cuộc trò chuyện WhatsApp như `123@g.us`.                     |

Cấu hình kênh cấp tài khoản có thể đặt cùng chính sách dưới `channels.<channel>.accounts.<accountId>.mentionPatterns` khi kênh đó hỗ trợ nhiều tài khoản. Chính sách tài khoản có độ ưu tiên cao hơn chính sách kênh cấp cao nhất cho tài khoản đó.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` là các mẫu regex an toàn, không phân biệt chữ hoa/thường; mẫu không hợp lệ và dạng lặp lồng nhau không an toàn sẽ bị bỏ qua.
    - Các bề mặt cung cấp lượt nhắc đến tường minh vẫn được cho qua; các mẫu regex đã cấu hình là dự phòng.
    - `channels.<channel>.mentionPatterns.mode: "deny"` tắt các mẫu nhắc đến đã cấu hình theo mặc định cho kênh đó; bật lại cho các cuộc trò chuyện được chọn bằng `allowIn`.
    - `channels.<channel>.mentionPatterns.denyIn` tắt các mẫu nhắc đến đã cấu hình cho ID cuộc trò chuyện cụ thể trong khi @mentions gốc của nền tảng vẫn được cho qua.
    - Ghi đè theo tác nhân: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều tác nhân dùng chung một nhóm).
    - Kiểm soát lượt nhắc đến chỉ được thực thi khi có thể phát hiện lượt nhắc đến (lượt nhắc đến gốc hoặc `mentionPatterns` đã được cấu hình).
    - Cho phép một nhóm hoặc người gửi không tắt kiểm soát lượt nhắc đến; đặt `requireMention` của nhóm đó thành `false` khi mọi tin nhắn đều nên kích hoạt.
    - Ngữ cảnh prompt chat nhóm tự động mang theo chỉ dẫn trả lời im lặng đã phân giải ở mỗi lượt; các tệp workspace không nên lặp lại cơ chế `NO_REPLY`.
    - Các nhóm cho phép trả lời im lặng tự động xem lượt mô hình trống sạch hoặc chỉ có lập luận là im lặng, tương đương `NO_REPLY`. Chat trực tiếp không bao giờ nhận hướng dẫn `NO_REPLY`, và các trả lời nhóm chỉ dùng công cụ tin nhắn vẫn giữ im lặng bằng cách không gọi `message(action=send)`.
    - Trò chuyện nhóm luôn bật ở nền dùng ngữ nghĩa yêu cầu của người dùng theo mặc định. Đặt `messages.groupChat.unmentionedInbound: "room_event"` để gửi nó dưới dạng ngữ cảnh yên lặng thay vào đó. Xem [Sự kiện phòng nền](/vi/channels/ambient-room-events) để biết ví dụ thiết lập.
    - Sự kiện phòng không được lưu dưới dạng yêu cầu người dùng giả, và văn bản trợ lý riêng tư từ sự kiện phòng không dùng công cụ tin nhắn không được phát lại trong lịch sử chat.
    - Mặc định của Discord nằm trong `channels.discord.guilds."*"` (có thể ghi đè theo từng guild/kênh).
    - Ngữ cảnh lịch sử nhóm được bọc đồng nhất trên các kênh. Nhóm có kiểm soát lượt nhắc đến giữ lại các tin nhắn bị bỏ qua đang chờ; nhóm luôn bật cũng có thể giữ lại các tin nhắn phòng đã xử lý gần đây khi kênh hỗ trợ. Dùng `messages.groupChat.historyLimit` cho mặc định toàn cục và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) cho ghi đè. Đặt `0` để tắt.

  </Accordion>
</AccordionGroup>

## Hạn chế công cụ theo nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ hạn chế công cụ nào khả dụng **bên trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/từ chối công cụ cho toàn bộ nhóm.
- `toolsBySender`: ghi đè theo từng người gửi trong nhóm. Dùng tiền tố khóa tường minh: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, và ký tự đại diện `"*"`. ID kênh dùng ID kênh OpenClaw chính tắc; bí danh như `teams` được chuẩn hóa thành `msteams`. Các khóa cũ không có tiền tố vẫn được chấp nhận và chỉ được khớp như `id:`.

Thứ tự phân giải (cụ thể nhất thắng):

<Steps>
  <Step title="Group toolsBySender">
    Khớp `toolsBySender` của nhóm/kênh.
  </Step>
  <Step title="Group tools">
    `tools` của nhóm/kênh.
  </Step>
  <Step title="Default toolsBySender">
    Khớp `toolsBySender` mặc định (`"*"`).
  </Step>
  <Step title="Default tools">
    `tools` mặc định (`"*"`).
  </Step>
</Steps>

Ví dụ (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
Hạn chế công cụ theo nhóm/kênh được áp dụng cùng với chính sách công cụ toàn cục/tác nhân (từ chối vẫn thắng). Một số kênh dùng cấu trúc lồng khác cho phòng/kênh (ví dụ: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Danh sách cho phép nhóm

Khi `channels.whatsapp.groups`, `channels.telegram.groups` hoặc `channels.imessage.groups` được cấu hình, các khóa đóng vai trò là danh sách cho phép nhóm. Dùng `"*"` để cho phép tất cả nhóm trong khi vẫn đặt hành vi nhắc đến mặc định.

<Warning>
Nhầm lẫn thường gặp: phê duyệt ghép đôi DM không giống với ủy quyền nhóm. Đối với các kênh hỗ trợ ghép đôi DM, kho ghép đôi chỉ mở khóa DM. Lệnh nhóm vẫn cần ủy quyền rõ ràng cho người gửi trong nhóm từ danh sách cho phép cấu hình như `groupAllowFrom` hoặc phương án dự phòng cấu hình đã được ghi tài liệu cho kênh đó.
</Warning>

Các mục đích thường gặp (sao chép/dán):

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Allow all groups but require mention">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Owner-only triggers (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Kích hoạt (chỉ dành cho chủ sở hữu)

Chủ sở hữu nhóm có thể bật/tắt kích hoạt theo từng nhóm:

- `/activation mention`
- `/activation always`

Chủ sở hữu được xác định bởi `channels.whatsapp.allowFrom` (hoặc E.164 tự thân của bot khi chưa đặt). Gửi lệnh dưới dạng một tin nhắn độc lập. Các bề mặt khác hiện bỏ qua `/activation`.

## Trường ngữ cảnh

Payload đầu vào của nhóm đặt:

- `ChatType=group`
- `GroupSubject` (nếu biết)
- `GroupMembers` (nếu biết)
- `WasMentioned` (kết quả cổng yêu cầu nhắc đến)
- Chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

System prompt của hệ thống tác nhân bao gồm phần giới thiệu nhóm ở lượt đầu tiên của một phiên nhóm mới. Nó nhắc mô hình phản hồi như con người, giảm thiểu dòng trống và tuân theo khoảng cách trò chuyện thông thường, đồng thời tránh gõ các chuỗi `\n` theo nghĩa đen. Các nhóm không phải Telegram cũng không khuyến khích bảng Markdown; hướng dẫn văn bản giàu định dạng của Telegram đến từ prompt kênh Telegram. Tên nhóm và nhãn người tham gia có nguồn từ kênh được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy trong khối mã, không phải hướng dẫn hệ thống nội tuyến.

## Chi tiết riêng của iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc đưa vào danh sách cho phép.
- Liệt kê cuộc trò chuyện: `imsg chats --limit 20`.
- Phản hồi nhóm luôn quay lại cùng `chat_id`.

## System prompt của WhatsApp

Xem [WhatsApp](/vi/channels/whatsapp#system-prompts) để biết các quy tắc system prompt WhatsApp chuẩn, bao gồm phân giải prompt nhóm và trực tiếp, hành vi ký tự đại diện và ngữ nghĩa ghi đè tài khoản.

## Chi tiết riêng của WhatsApp

Xem [Tin nhắn nhóm](/vi/channels/group-messages) để biết hành vi chỉ dành cho WhatsApp (chèn lịch sử, chi tiết xử lý nhắc đến).

## Liên quan

- [Nhóm phát sóng](/vi/channels/broadcast-groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Tin nhắn nhóm](/vi/channels/group-messages)
- [Ghép đôi](/vi/channels/pairing)
