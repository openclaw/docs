---
read_when:
    - Thay đổi hành vi trò chuyện nhóm hoặc kiểm soát theo lượt nhắc đến
sidebarTitle: Groups
summary: Hành vi trò chuyện nhóm trên các bề mặt (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Nhóm
x-i18n:
    generated_at: "2026-05-11T20:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw xử lý trò chuyện nhóm nhất quán trên các bề mặt: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Giới thiệu cho người mới bắt đầu (2 phút)

OpenClaw "sống" trên chính các tài khoản nhắn tin của bạn. Không có người dùng bot WhatsApp riêng biệt. Nếu **bạn** ở trong một nhóm, OpenClaw có thể thấy nhóm đó và phản hồi tại đó.

Hành vi mặc định:

- Nhóm bị giới hạn (`groupPolicy: "allowlist"`).
- Câu trả lời yêu cầu có nhắc đến trừ khi bạn tắt rõ ràng cổng kiểm soát bằng nhắc đến.
- Câu trả lời cuối thông thường trong nhóm/kênh mặc định là riêng tư. Đầu ra hiển thị trong phòng dùng công cụ `message`.

Diễn giải: người gửi trong danh sách cho phép có thể kích hoạt OpenClaw bằng cách nhắc đến nó.

<Note>
**Tóm tắt nhanh**

- **Quyền truy cập DM** được kiểm soát bởi `*.allowFrom`.
- **Quyền truy cập nhóm** được kiểm soát bởi `*.groupPolicy` + danh sách cho phép (`*.groups`, `*.groupAllowFrom`).
- **Kích hoạt trả lời** được kiểm soát bởi cổng kiểm soát bằng nhắc đến (`requireMention`, `/activation`).

</Note>

Luồng nhanh (điều gì xảy ra với một tin nhắn nhóm):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Câu trả lời hiển thị

Đối với phòng nhóm/kênh, OpenClaw mặc định dùng `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` ghi mặc định này vào cấu hình kênh đã cấu hình nếu thiếu.
Điều đó nghĩa là agent vẫn xử lý lượt và có thể cập nhật trạng thái bộ nhớ/phiên, nhưng câu trả lời cuối thông thường của nó không tự động được đăng lại vào phòng. Để nói một cách hiển thị, agent dùng `message(action=send)`.

Mặc định này phụ thuộc vào model/runtime gọi công cụ một cách đáng tin cậy. Nếu nhật ký cho thấy
văn bản của assistant nhưng `didSendViaMessagingTool: false`, model đã trả lời
riêng tư thay vì gọi công cụ message. Đó không phải là lỗi gửi của
Discord/Slack/Telegram. Hãy dùng model đáng tin cậy về gọi công cụ cho
phiên nhóm/kênh, hoặc đặt
`messages.groupChat.visibleReplies: "automatic"` để khôi phục các câu trả lời cuối
hiển thị kiểu cũ.

Nếu công cụ message không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ
rơi về câu trả lời hiển thị tự động thay vì âm thầm chặn phản hồi.
`openclaw doctor` cảnh báo về sự không khớp này.

Đối với trò chuyện trực tiếp và mọi lượt nguồn khác, dùng `messages.visibleReplies: "message_tool"` để áp dụng cùng hành vi câu trả lời hiển thị chỉ qua công cụ trên toàn cục. Harness cũng có thể chọn đây làm mặc định khi chưa đặt; Codex harness làm vậy cho trò chuyện trực tiếp ở chế độ Codex. `messages.groupChat.visibleReplies` vẫn là ghi đè cụ thể hơn cho phòng nhóm/kênh.

Cơ chế này thay thế mẫu cũ là ép model trả lời `NO_REPLY` cho hầu hết các lượt ở chế độ lurk. Trong chế độ chỉ qua công cụ, không làm gì hiển thị đơn giản nghĩa là không gọi công cụ message.

Chỉ báo đang nhập vẫn được gửi trong khi agent làm việc ở chế độ chỉ qua công cụ. Chế độ đang nhập nhóm mặc định được nâng cấp từ "message" lên "instant" cho các lượt này vì có thể sẽ không bao giờ có văn bản tin nhắn assistant thông thường trước khi agent quyết định có gọi công cụ message hay không. Cấu hình chế độ đang nhập rõ ràng vẫn được ưu tiên.

Để khôi phục câu trả lời cuối tự động kiểu cũ cho phòng nhóm/kênh:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway tải nóng cấu hình `messages` sau khi tệp được lưu. Chỉ khởi động lại
khi việc theo dõi tệp hoặc tải lại cấu hình bị tắt trong triển khai.

Để yêu cầu đầu ra hiển thị đi qua công cụ message cho mọi trò chuyện nguồn:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Lệnh slash gốc (Discord, Telegram và các bề mặt khác có hỗ trợ lệnh gốc) bỏ qua `visibleReplies: "message_tool"` và luôn trả lời hiển thị để UI lệnh gốc của kênh nhận được phản hồi như mong đợi. Điều này chỉ áp dụng cho các lượt lệnh gốc đã được xác thực; lệnh `/...` được gõ dưới dạng văn bản và các lượt trò chuyện thông thường vẫn tuân theo mặc định nhóm đã cấu hình.

## Khả năng hiển thị ngữ cảnh và danh sách cho phép

Có hai cơ chế kiểm soát khác nhau liên quan đến an toàn nhóm:

- **Ủy quyền kích hoạt**: ai có thể kích hoạt agent (`groupPolicy`, `groups`, `groupAllowFrom`, danh sách cho phép riêng theo kênh).
- **Khả năng hiển thị ngữ cảnh**: ngữ cảnh bổ sung nào được đưa vào model (văn bản trả lời, trích dẫn, lịch sử luồng, siêu dữ liệu chuyển tiếp).

Theo mặc định, OpenClaw ưu tiên hành vi trò chuyện thông thường và giữ ngữ cảnh gần như đúng như nhận được. Điều này nghĩa là danh sách cho phép chủ yếu quyết định ai có thể kích hoạt hành động, không phải là ranh giới biên tập lại phổ quát cho mọi đoạn trích dẫn hoặc đoạn lịch sử.

<AccordionGroup>
  <Accordion title="Hành vi hiện tại phụ thuộc theo kênh">
    - Một số kênh đã áp dụng lọc theo người gửi cho ngữ cảnh bổ sung trong các đường cụ thể (ví dụ khởi tạo luồng Slack, tra cứu trả lời/luồng Matrix).
    - Các kênh khác vẫn truyền ngữ cảnh trích dẫn/trả lời/chuyển tiếp đúng như nhận được.

  </Accordion>
  <Accordion title="Hướng gia cố (đã lên kế hoạch)">
    - `contextVisibility: "all"` (mặc định) giữ hành vi như nhận được hiện tại.
    - `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung theo người gửi trong danh sách cho phép.
    - `contextVisibility: "allowlist_quote"` là `allowlist` cộng thêm một ngoại lệ trích dẫn/trả lời rõ ràng.

    Cho đến khi mô hình gia cố này được triển khai nhất quán trên các kênh, hãy dự kiến sẽ có khác biệt theo bề mặt.

  </Accordion>
</AccordionGroup>

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                      | Cần đặt                                                   |
| -------------------------------------------- | ---------------------------------------------------------- |
| Cho phép tất cả nhóm nhưng chỉ trả lời khi có @mentions | `groups: { "*": { requireMention: true } }`                |
| Tắt mọi câu trả lời nhóm                     | `groupPolicy: "disabled"`                                  |
| Chỉ các nhóm cụ thể                          | `groups: { "<group-id>": { ... } }` (không có khóa `"*"` ) |
| Chỉ bạn có thể kích hoạt trong nhóm          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Dùng lại một tập người gửi đáng tin cậy trên nhiều kênh | `groupAllowFrom: ["accessGroup:operators"]`                |

Để dùng danh sách cho phép người gửi có thể tái sử dụng, xem [Nhóm truy cập](/vi/channels/access-groups).

## Khóa phiên

- Phiên nhóm dùng khóa phiên `agent:<agentId>:<channel>:group:<id>` (phòng/kênh dùng `agent:<agentId>:<channel>:channel:<id>`).
- Chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào id nhóm để mỗi chủ đề có phiên riêng.
- Trò chuyện trực tiếp dùng phiên chính (hoặc theo từng người gửi nếu đã cấu hình).
- Heartbeat được bỏ qua cho phiên nhóm.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Mẫu: DM cá nhân + nhóm công khai (một agent)

Có — cách này hoạt động tốt nếu lưu lượng "cá nhân" của bạn là **DM** và lưu lượng "công khai" của bạn là **nhóm**.

Lý do: ở chế độ một agent, DM thường đi vào khóa phiên **chính** (`agent:main:main`), trong khi nhóm luôn dùng khóa phiên **không chính** (`agent:main:<channel>:group:<id>`). Nếu bạn bật sandbox với `mode: "non-main"`, các phiên nhóm đó chạy trong backend sandbox đã cấu hình trong khi phiên DM chính của bạn vẫn ở trên host. Docker là backend mặc định nếu bạn không chọn backend nào.

Điều này cho bạn một "bộ não" agent (không gian làm việc + bộ nhớ dùng chung), nhưng hai tư thế thực thi:

- **DM**: đầy đủ công cụ (host)
- **Nhóm**: sandbox + công cụ bị giới hạn

<Note>
Nếu bạn cần các không gian làm việc/persona thực sự tách biệt ("cá nhân" và "công khai" không bao giờ được trộn lẫn), hãy dùng agent thứ hai + binding. Xem [Định tuyến nhiều agent](/vi/concepts/multi-agent).
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
- Gỡ lỗi lý do công cụ bị chặn: [Sandbox so với Chính sách công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
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

| Chính sách   | Hành vi                                                      |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Nhóm bỏ qua danh sách cho phép; cổng kiểm soát bằng nhắc đến vẫn áp dụng. |
| `"disabled"`  | Chặn hoàn toàn mọi tin nhắn nhóm.                            |
| `"allowlist"` | Chỉ cho phép nhóm/phòng khớp với danh sách cho phép đã cấu hình. |

<AccordionGroup>
  <Accordion title="Ghi chú theo từng kênh">
    - `groupPolicy` tách biệt với kiểm soát bằng đề cập (yêu cầu @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: dùng `groupAllowFrom` (dự phòng: `allowFrom` tường minh).
    - Signal: `groupAllowFrom` có thể khớp với id nhóm Signal đầu vào hoặc số điện thoại/UUID của người gửi.
    - Phê duyệt ghép cặp DM (các mục lưu trữ `*-allowFrom`) chỉ áp dụng cho quyền truy cập DM; ủy quyền người gửi trong nhóm vẫn phải khai báo tường minh trong allowlist nhóm.
    - Discord: allowlist dùng `channels.discord.guilds.<id>.channels`.
    - Slack: allowlist dùng `channels.slack.channels`.
    - Matrix: allowlist dùng `channels.matrix.groups`. Ưu tiên ID phòng hoặc bí danh; tra cứu tên phòng đã tham gia là nỗ lực tốt nhất, và các tên không phân giải được sẽ bị bỏ qua khi chạy. Dùng `channels.matrix.groupAllowFrom` để giới hạn người gửi; allowlist `users` theo từng phòng cũng được hỗ trợ.
    - DM nhóm được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Allowlist Telegram có thể khớp với ID người dùng (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) hoặc tên người dùng (`"@alice"` hoặc `"alice"`); tiền tố không phân biệt chữ hoa chữ thường.
    - Mặc định là `groupPolicy: "allowlist"`; nếu allowlist nhóm của bạn trống, tin nhắn nhóm sẽ bị chặn.
    - An toàn khi chạy: khi thiếu hoàn toàn một khối nhà cung cấp (`channels.<provider>` không có), chính sách nhóm quay về chế độ đóng khi lỗi (thường là `allowlist`) thay vì kế thừa `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Mô hình tư duy nhanh (thứ tự đánh giá cho tin nhắn nhóm):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlist nhóm">
    Allowlist nhóm (`*.groups`, `*.groupAllowFrom`, allowlist theo kênh).
  </Step>
  <Step title="Kiểm soát bằng đề cập">
    Kiểm soát bằng đề cập (`requireMention`, `/activation`).
  </Step>
</Steps>

## Kiểm soát bằng đề cập (mặc định)

Tin nhắn nhóm yêu cầu có đề cập trừ khi được ghi đè theo từng nhóm. Giá trị mặc định nằm theo từng hệ con dưới `*.groups."*"`.

Trả lời một tin nhắn của bot được tính là đề cập ngầm định khi kênh hỗ trợ siêu dữ liệu trả lời. Trích dẫn một tin nhắn của bot cũng có thể được tính là đề cập ngầm định trên các kênh cung cấp siêu dữ liệu trích dẫn. Các trường hợp tích hợp hiện tại gồm Telegram, WhatsApp, Slack, Discord, Microsoft Teams và ZaloUser.

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

<AccordionGroup>
  <Accordion title="Ghi chú về kiểm soát bằng đề cập">
    - `mentionPatterns` là các mẫu regex an toàn, không phân biệt chữ hoa chữ thường; các mẫu không hợp lệ và các dạng lặp lồng nhau không an toàn sẽ bị bỏ qua.
    - Các bề mặt cung cấp đề cập tường minh vẫn được chấp nhận; mẫu là phương án dự phòng.
    - Ghi đè theo từng tác tử: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều tác tử dùng chung một nhóm).
    - Kiểm soát bằng đề cập chỉ được áp dụng khi có thể phát hiện đề cập (đề cập gốc hoặc `mentionPatterns` đã được cấu hình).
    - Việc đưa một nhóm hoặc người gửi vào allowlist không tắt kiểm soát bằng đề cập; đặt `requireMention` của nhóm đó thành `false` khi mọi tin nhắn đều nên kích hoạt.
    - Ngữ cảnh prompt chat nhóm mang theo chỉ dẫn trả lời im lặng đã phân giải ở mọi lượt; các tệp workspace không nên lặp lại cơ chế `NO_REPLY`.
    - Các nhóm cho phép trả lời im lặng coi những lượt mô hình trống sạch hoặc chỉ có reasoning là im lặng, tương đương với `NO_REPLY`. Chat trực tiếp chỉ làm tương tự khi trả lời im lặng trực tiếp được cho phép tường minh; nếu không, phản hồi trống vẫn là lượt tác tử thất bại.
    - Giá trị mặc định của Discord nằm trong `channels.discord.guilds."*"` (có thể ghi đè theo từng guild/kênh).
    - Ngữ cảnh lịch sử nhóm được bao bọc thống nhất trên các kênh. Nhóm được kiểm soát bằng đề cập giữ lại các tin nhắn đã bỏ qua đang chờ; nhóm luôn bật cũng có thể giữ lại các tin nhắn phòng đã xử lý gần đây khi kênh hỗ trợ. Dùng `messages.groupChat.historyLimit` cho mặc định toàn cục và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) cho ghi đè. Đặt `0` để tắt.

  </Accordion>
</AccordionGroup>

## Giới hạn công cụ theo nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ giới hạn công cụ nào khả dụng **bên trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/từ chối công cụ cho toàn bộ nhóm.
- `toolsBySender`: ghi đè theo từng người gửi trong nhóm. Dùng tiền tố khóa tường minh: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, và ký tự đại diện `"*"`. ID kênh dùng ID kênh OpenClaw chuẩn; các bí danh như `teams` được chuẩn hóa thành `msteams`. Các khóa cũ không có tiền tố vẫn được chấp nhận và chỉ được khớp như `id:`.

Thứ tự phân giải (cụ thể nhất thắng):

<Steps>
  <Step title="toolsBySender của nhóm">
    Khớp `toolsBySender` của nhóm/kênh.
  </Step>
  <Step title="Công cụ của nhóm">
    `tools` của nhóm/kênh.
  </Step>
  <Step title="toolsBySender mặc định">
    Khớp `toolsBySender` mặc định (`"*"`).
  </Step>
  <Step title="Công cụ mặc định">
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
Giới hạn công cụ theo nhóm/kênh được áp dụng bổ sung cho chính sách công cụ toàn cục/tác tử (deny vẫn thắng). Một số kênh dùng cách lồng khác nhau cho phòng/kênh (ví dụ: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist nhóm

Khi `channels.whatsapp.groups`, `channels.telegram.groups`, hoặc `channels.imessage.groups` được cấu hình, các khóa đóng vai trò là allowlist nhóm. Dùng `"*"` để cho phép mọi nhóm trong khi vẫn đặt hành vi đề cập mặc định.

<Warning>
Nhầm lẫn phổ biến: phê duyệt ghép cặp DM không giống với ủy quyền nhóm. Với các kênh hỗ trợ ghép cặp DM, kho ghép cặp chỉ mở khóa DM. Lệnh nhóm vẫn yêu cầu ủy quyền người gửi nhóm tường minh từ allowlist cấu hình như `groupAllowFrom` hoặc phương án dự phòng cấu hình đã được tài liệu hóa cho kênh đó.
</Warning>

Các ý định phổ biến (sao chép/dán):

<Tabs>
  <Tab title="Tắt mọi trả lời nhóm">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Chỉ cho phép nhóm cụ thể (WhatsApp)">
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
  <Tab title="Cho phép mọi nhóm nhưng yêu cầu đề cập">
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
  <Tab title="Kích hoạt chỉ dành cho chủ sở hữu (WhatsApp)">
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

## Kích hoạt (chỉ chủ sở hữu)

Chủ sở hữu nhóm có thể bật/tắt kích hoạt theo từng nhóm:

- `/activation mention`
- `/activation always`

Chủ sở hữu được xác định bởi `channels.whatsapp.allowFrom` (hoặc E.164 của chính bot khi chưa đặt). Gửi lệnh dưới dạng một tin nhắn độc lập. Các bề mặt khác hiện bỏ qua `/activation`.

## Trường ngữ cảnh

Payload đầu vào của nhóm đặt:

- `ChatType=group`
- `GroupSubject` (nếu biết)
- `GroupMembers` (nếu biết)
- `WasMentioned` (kết quả kiểm soát bằng đề cập)
- Chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

Prompt hệ thống tác tử bao gồm phần giới thiệu nhóm ở lượt đầu tiên của một phiên nhóm mới. Phần này nhắc mô hình phản hồi như con người, tránh bảng Markdown, giảm thiểu dòng trống và tuân theo khoảng cách chat bình thường, đồng thời tránh gõ chuỗi `\n` theo nghĩa đen. Tên nhóm và nhãn người tham gia lấy từ kênh được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy được rào bằng code fence, không phải chỉ dẫn hệ thống nội tuyến.

## Chi tiết riêng của iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc đưa vào allowlist.
- Liệt kê chat: `imsg chats --limit 20`.
- Trả lời nhóm luôn quay lại cùng `chat_id`.

## Prompt hệ thống WhatsApp

Xem [WhatsApp](/vi/channels/whatsapp#system-prompts) để biết các quy tắc prompt hệ thống WhatsApp chuẩn, bao gồm phân giải prompt nhóm và trực tiếp, hành vi ký tự đại diện, và ngữ nghĩa ghi đè tài khoản.

## Chi tiết riêng của WhatsApp

Xem [Tin nhắn nhóm](/vi/channels/group-messages) để biết hành vi chỉ dành cho WhatsApp (chèn lịch sử, chi tiết xử lý đề cập).

## Liên quan

- [Nhóm phát sóng](/vi/channels/broadcast-groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Tin nhắn nhóm](/vi/channels/group-messages)
- [Ghép cặp](/vi/channels/pairing)
