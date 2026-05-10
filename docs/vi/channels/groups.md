---
read_when:
    - Thay đổi hành vi trò chuyện nhóm hoặc cơ chế kiểm soát bằng lượt nhắc
sidebarTitle: Groups
summary: Hành vi trò chuyện nhóm trên các bề mặt (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Nhóm
x-i18n:
    generated_at: "2026-05-10T19:21:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw xử lý cuộc trò chuyện nhóm nhất quán trên các bề mặt: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Giới thiệu cho người mới bắt đầu (2 phút)

OpenClaw "tồn tại" trên chính các tài khoản nhắn tin của bạn. Không có người dùng bot WhatsApp riêng. Nếu **bạn** ở trong một nhóm, OpenClaw có thể nhìn thấy nhóm đó và phản hồi tại đó.

Hành vi mặc định:

- Nhóm bị hạn chế (`groupPolicy: "allowlist"`).
- Phản hồi yêu cầu nhắc đến trừ khi bạn tắt rõ ràng cơ chế chặn theo nhắc đến.
- Các phản hồi cuối thông thường trong nhóm/kênh mặc định là riêng tư. Kết quả hiển thị trong phòng dùng công cụ `message`.

Nói cách khác: những người gửi trong allowlist có thể kích hoạt OpenClaw bằng cách nhắc đến nó.

<Note>
**Tóm tắt**

- **Quyền truy cập DM** được kiểm soát bởi `*.allowFrom`.
- **Quyền truy cập nhóm** được kiểm soát bởi `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **Kích hoạt phản hồi** được kiểm soát bởi cơ chế chặn theo nhắc đến (`requireMention`, `/activation`).

</Note>

Luồng nhanh (điều gì xảy ra với một tin nhắn nhóm):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Phản hồi hiển thị

Đối với phòng nhóm/kênh, OpenClaw mặc định dùng `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` ghi mặc định này vào cấu hình của các kênh đã cấu hình nhưng bỏ qua nó.
Điều đó có nghĩa là agent vẫn xử lý lượt và có thể cập nhật trạng thái bộ nhớ/phiên, nhưng câu trả lời cuối thông thường của nó không tự động được đăng lại vào phòng. Để nói một cách hiển thị, agent dùng `message(action=send)`.

Mặc định này phụ thuộc vào model/runtime gọi công cụ một cách đáng tin cậy. Nếu nhật ký hiển thị
văn bản assistant nhưng `didSendViaMessagingTool: false`, model đã trả lời
riêng tư thay vì gọi công cụ message. Đó không phải là lỗi gửi của
Discord/Slack/Telegram. Hãy dùng model gọi công cụ đáng tin cậy cho
các phiên nhóm/kênh, hoặc đặt
`messages.groupChat.visibleReplies: "automatic"` để khôi phục các phản hồi cuối hiển thị
theo kiểu cũ.

Nếu công cụ message không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ
quay về phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi.
`openclaw doctor` cảnh báo về sự không khớp này.

Đối với trò chuyện trực tiếp và mọi lượt nguồn khác, dùng `messages.visibleReplies: "message_tool"` để áp dụng cùng hành vi phản hồi hiển thị chỉ qua công cụ trên toàn cục. Harness cũng có thể chọn tùy chọn này làm mặc định khi chưa đặt; Codex harness làm vậy cho các cuộc trò chuyện trực tiếp ở chế độ Codex. `messages.groupChat.visibleReplies` vẫn là phần ghi đè cụ thể hơn cho phòng nhóm/kênh.

Điều này thay thế mẫu cũ là buộc model trả lời `NO_REPLY` cho hầu hết các lượt ở chế độ lurk. Trong chế độ chỉ qua công cụ, không làm gì hiển thị đơn giản nghĩa là không gọi công cụ message.

Chỉ báo đang nhập vẫn được gửi trong khi agent làm việc ở chế độ chỉ qua công cụ. Chế độ nhập nhóm mặc định được nâng từ "message" lên "instant" cho các lượt này vì có thể sẽ không bao giờ có văn bản tin nhắn assistant thông thường trước khi agent quyết định có gọi công cụ message hay không. Cấu hình chế độ nhập rõ ràng vẫn được ưu tiên.

Để khôi phục các phản hồi cuối tự động theo kiểu cũ cho phòng nhóm/kênh:

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
khi theo dõi tệp hoặc tải lại cấu hình bị tắt trong triển khai.

Để yêu cầu kết quả hiển thị đi qua công cụ message cho mọi cuộc trò chuyện nguồn:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Các lệnh slash gốc (Discord, Telegram và những bề mặt khác có hỗ trợ lệnh gốc) bỏ qua `visibleReplies: "message_tool"` và luôn trả lời hiển thị để UI lệnh gốc của kênh nhận được phản hồi như mong đợi. Điều này chỉ áp dụng cho các lượt lệnh gốc đã được xác thực; các lệnh `/...` được gõ dưới dạng văn bản và các lượt trò chuyện thông thường vẫn tuân theo mặc định nhóm đã cấu hình.

## Khả năng hiển thị ngữ cảnh và allowlist

Có hai cơ chế kiểm soát khác nhau liên quan đến an toàn nhóm:

- **Ủy quyền kích hoạt**: ai có thể kích hoạt agent (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist theo từng kênh).
- **Khả năng hiển thị ngữ cảnh**: ngữ cảnh bổ sung nào được đưa vào model (văn bản trả lời, trích dẫn, lịch sử thread, siêu dữ liệu chuyển tiếp).

Theo mặc định, OpenClaw ưu tiên hành vi trò chuyện thông thường và giữ ngữ cảnh gần như đúng như đã nhận. Điều này có nghĩa allowlist chủ yếu quyết định ai có thể kích hoạt hành động, không phải ranh giới biên tập phổ quát cho mọi đoạn trích dẫn hoặc lịch sử.

<AccordionGroup>
  <Accordion title="Hành vi hiện tại phụ thuộc vào từng kênh">
    - Một số kênh đã áp dụng lọc theo người gửi cho ngữ cảnh bổ sung trong các đường dẫn cụ thể (ví dụ gieo dữ liệu thread Slack, tra cứu trả lời/thread Matrix).
    - Các kênh khác vẫn truyền ngữ cảnh trích dẫn/trả lời/chuyển tiếp đúng như đã nhận.

  </Accordion>
  <Accordion title="Hướng gia cố (đã lên kế hoạch)">
    - `contextVisibility: "all"` (mặc định) giữ hành vi hiện tại là đúng như đã nhận.
    - `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung chỉ còn những người gửi trong allowlist.
    - `contextVisibility: "allowlist_quote"` là `allowlist` cộng thêm một ngoại lệ trích dẫn/trả lời rõ ràng.

    Cho đến khi mô hình gia cố này được triển khai nhất quán trên các kênh, hãy dự kiến sẽ có khác biệt theo từng bề mặt.

  </Accordion>
</AccordionGroup>

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                      | Cần đặt gì                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Cho phép tất cả nhóm nhưng chỉ trả lời khi có @mentions | `groups: { "*": { requireMention: true } }`                |
| Tắt tất cả phản hồi nhóm                     | `groupPolicy: "disabled"`                                  |
| Chỉ các nhóm cụ thể                          | `groups: { "<group-id>": { ... } }` (không có khóa `"*"` key)         |
| Chỉ bạn có thể kích hoạt trong nhóm          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Dùng lại một tập người gửi tin cậy trên nhiều kênh | `groupAllowFrom: ["accessGroup:operators"]`                |

Đối với allowlist người gửi có thể tái sử dụng, xem [Nhóm truy cập](/vi/channels/access-groups).

## Khóa phiên

- Phiên nhóm dùng khóa phiên `agent:<agentId>:<channel>:group:<id>` (phòng/kênh dùng `agent:<agentId>:<channel>:channel:<id>`).
- Chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào id nhóm để mỗi chủ đề có phiên riêng.
- Trò chuyện trực tiếp dùng phiên chính (hoặc theo từng người gửi nếu được cấu hình).
- Heartbeat được bỏ qua cho phiên nhóm.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Mẫu: DM cá nhân + nhóm công khai (một agent)

Có — cách này hoạt động tốt nếu lưu lượng "cá nhân" của bạn là **DM** và lưu lượng "công khai" của bạn là **nhóm**.

Lý do: trong chế độ một agent, DM thường đi vào khóa phiên **chính** (`agent:main:main`), trong khi nhóm luôn dùng khóa phiên **không phải chính** (`agent:main:<channel>:group:<id>`). Nếu bạn bật sandboxing với `mode: "non-main"`, các phiên nhóm đó chạy trong backend sandbox đã cấu hình, còn phiên DM chính của bạn vẫn ở trên host. Docker là backend mặc định nếu bạn không chọn backend nào.

Điều này cho bạn một "bộ não" agent (workspace + bộ nhớ dùng chung), nhưng hai tư thế thực thi:

- **DM**: đầy đủ công cụ (host)
- **Nhóm**: sandbox + công cụ bị hạn chế

<Note>
Nếu bạn cần workspace/persona thật sự tách biệt ("cá nhân" và "công khai" tuyệt đối không được trộn lẫn), hãy dùng agent thứ hai + binding. Xem [Định tuyến đa agent](/vi/concepts/multi-agent).
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
  <Tab title="Nhóm chỉ thấy một thư mục trong allowlist">
    Muốn "nhóm chỉ có thể thấy thư mục X" thay vì "không có quyền truy cập host"? Giữ `workspaceAccess: "none"` và chỉ mount các đường dẫn trong allowlist vào sandbox:

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

Kiểm soát cách tin nhắn nhóm/phòng được xử lý theo từng kênh:

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
| `"open"`      | Nhóm bỏ qua allowlist; cơ chế chặn theo nhắc đến vẫn áp dụng. |
| `"disabled"`  | Chặn hoàn toàn mọi tin nhắn nhóm.                            |
| `"allowlist"` | Chỉ cho phép nhóm/phòng khớp với allowlist đã cấu hình. |

<AccordionGroup>
  <Accordion title="Ghi chú theo từng kênh">
    - `groupPolicy` tách biệt với kiểm soát bằng đề cập (yêu cầu @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: dùng `groupAllowFrom` (dự phòng: `allowFrom` rõ ràng).
    - Signal: `groupAllowFrom` có thể khớp với id nhóm Signal gửi đến hoặc số điện thoại/UUID của người gửi.
    - Phê duyệt ghép đôi DM (mục lưu trữ `*-allowFrom`) chỉ áp dụng cho quyền truy cập DM; ủy quyền người gửi trong nhóm vẫn phải được khai báo rõ trong danh sách cho phép nhóm.
    - Discord: danh sách cho phép dùng `channels.discord.guilds.<id>.channels`.
    - Slack: danh sách cho phép dùng `channels.slack.channels`.
    - Matrix: danh sách cho phép dùng `channels.matrix.groups`. Ưu tiên ID phòng hoặc alias; tra cứu tên phòng đã tham gia là nỗ lực tốt nhất, và các tên không phân giải được sẽ bị bỏ qua khi chạy. Dùng `channels.matrix.groupAllowFrom` để hạn chế người gửi; danh sách cho phép `users` theo từng phòng cũng được hỗ trợ.
    - DM nhóm được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Danh sách cho phép Telegram có thể khớp với ID người dùng (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) hoặc tên người dùng (`"@alice"` hoặc `"alice"`); tiền tố không phân biệt chữ hoa chữ thường.
    - Mặc định là `groupPolicy: "allowlist"`; nếu danh sách cho phép nhóm của bạn trống, tin nhắn nhóm sẽ bị chặn.
    - An toàn khi chạy: khi một khối nhà cung cấp hoàn toàn bị thiếu (không có `channels.<provider>`), chính sách nhóm sẽ chuyển về chế độ đóng khi lỗi (thường là `allowlist`) thay vì kế thừa `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Mô hình tư duy nhanh (thứ tự đánh giá cho tin nhắn nhóm):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Danh sách cho phép nhóm">
    Danh sách cho phép nhóm (`*.groups`, `*.groupAllowFrom`, danh sách cho phép riêng theo kênh).
  </Step>
  <Step title="Kiểm soát bằng đề cập">
    Kiểm soát bằng đề cập (`requireMention`, `/activation`).
  </Step>
</Steps>

## Kiểm soát bằng đề cập (mặc định)

Tin nhắn nhóm yêu cầu một đề cập trừ khi được ghi đè theo từng nhóm. Mặc định nằm theo từng hệ thống con dưới `*.groups."*"`.

Trả lời một tin nhắn của bot được tính là đề cập ngầm định khi kênh hỗ trợ metadata trả lời. Trích dẫn một tin nhắn của bot cũng có thể được tính là đề cập ngầm định trên các kênh cung cấp metadata trích dẫn. Các trường hợp tích hợp hiện tại gồm Telegram, WhatsApp, Slack, Discord, Microsoft Teams và ZaloUser.

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
    - `mentionPatterns` là các mẫu regex an toàn, không phân biệt chữ hoa chữ thường; các mẫu không hợp lệ và dạng lặp lồng nhau không an toàn sẽ bị bỏ qua.
    - Các bề mặt cung cấp đề cập rõ ràng vẫn được chấp nhận; mẫu là cơ chế dự phòng.
    - Ghi đè theo từng agent: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều agent dùng chung một nhóm).
    - Kiểm soát bằng đề cập chỉ được thực thi khi có thể phát hiện đề cập (đề cập gốc hoặc đã cấu hình `mentionPatterns`).
    - Cho phép một nhóm hoặc người gửi không tắt kiểm soát bằng đề cập; đặt `requireMention` của nhóm đó thành `false` khi mọi tin nhắn đều nên kích hoạt.
    - Ngữ cảnh lời nhắc chat nhóm mang theo chỉ dẫn trả lời im lặng đã phân giải ở mỗi lượt; các tệp workspace không nên sao chép cơ chế `NO_REPLY`.
    - Các nhóm cho phép trả lời im lặng coi các lượt mô hình trống sạch hoặc chỉ có reasoning là im lặng, tương đương `NO_REPLY`. Chat trực tiếp chỉ làm tương tự khi trả lời im lặng trực tiếp được cho phép rõ ràng; nếu không, trả lời trống vẫn là lượt agent thất bại.
    - Mặc định Discord nằm trong `channels.discord.guilds."*"` (có thể ghi đè theo từng guild/kênh).
    - Ngữ cảnh lịch sử nhóm được bọc thống nhất trên các kênh. Nhóm bị kiểm soát bằng đề cập giữ các tin nhắn đã bỏ qua đang chờ xử lý; nhóm luôn bật cũng có thể giữ các tin nhắn phòng gần đây đã xử lý khi kênh hỗ trợ. Dùng `messages.groupChat.historyLimit` cho mặc định toàn cục và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) cho ghi đè. Đặt `0` để tắt.

  </Accordion>
</AccordionGroup>

## Hạn chế công cụ theo nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ hạn chế công cụ nào khả dụng **bên trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/từ chối công cụ cho toàn bộ nhóm.
- `toolsBySender`: ghi đè theo từng người gửi trong nhóm. Dùng tiền tố khóa rõ ràng: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, và ký tự đại diện `"*"`. Các khóa cũ không có tiền tố vẫn được chấp nhận và chỉ được khớp như `id:`.

Thứ tự phân giải (mục cụ thể nhất thắng):

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
Hạn chế công cụ theo nhóm/kênh được áp dụng thêm vào chính sách công cụ toàn cục/agent (từ chối vẫn thắng). Một số kênh dùng cách lồng khác cho phòng/kênh (ví dụ: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Danh sách cho phép nhóm

Khi `channels.whatsapp.groups`, `channels.telegram.groups`, hoặc `channels.imessage.groups` được cấu hình, các khóa đóng vai trò là danh sách cho phép nhóm. Dùng `"*"` để cho phép tất cả nhóm trong khi vẫn đặt hành vi đề cập mặc định.

<Warning>
Nhầm lẫn thường gặp: phê duyệt ghép đôi DM không giống với ủy quyền nhóm. Đối với các kênh hỗ trợ ghép đôi DM, kho ghép đôi chỉ mở khóa DM. Lệnh nhóm vẫn yêu cầu ủy quyền người gửi nhóm rõ ràng từ danh sách cho phép trong cấu hình như `groupAllowFrom` hoặc cơ chế dự phòng cấu hình đã được tài liệu hóa cho kênh đó.
</Warning>

Ý định thường gặp (sao chép/dán):

<Tabs>
  <Tab title="Tắt tất cả trả lời nhóm">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Chỉ cho phép các nhóm cụ thể (WhatsApp)">
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
  <Tab title="Cho phép tất cả nhóm nhưng yêu cầu đề cập">
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

## Activation (chỉ dành cho chủ sở hữu)

Chủ sở hữu nhóm có thể bật/tắt activation theo từng nhóm:

- `/activation mention`
- `/activation always`

Chủ sở hữu được xác định bởi `channels.whatsapp.allowFrom` (hoặc E.164 tự thân của bot khi chưa đặt). Gửi lệnh dưới dạng một tin nhắn độc lập. Các bề mặt khác hiện bỏ qua `/activation`.

## Trường ngữ cảnh

Payload gửi đến từ nhóm đặt:

- `ChatType=group`
- `GroupSubject` (nếu biết)
- `GroupMembers` (nếu biết)
- `WasMentioned` (kết quả kiểm soát bằng đề cập)
- Các chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

Lời nhắc hệ thống của agent bao gồm phần giới thiệu nhóm ở lượt đầu tiên của một phiên nhóm mới. Phần này nhắc mô hình trả lời như con người, tránh bảng Markdown, giảm thiểu dòng trống và theo khoảng cách chat thông thường, đồng thời tránh gõ chuỗi `\n` theo nghĩa đen. Tên nhóm và nhãn người tham gia lấy từ kênh được hiển thị dưới dạng metadata không đáng tin cậy trong khối fenced, không phải chỉ dẫn hệ thống nội tuyến.

## Chi tiết riêng của iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc đưa vào danh sách cho phép.
- Liệt kê chat: `imsg chats --limit 20`.
- Trả lời nhóm luôn quay lại cùng `chat_id`.

## Lời nhắc hệ thống WhatsApp

Xem [WhatsApp](/vi/channels/whatsapp#system-prompts) để biết quy tắc lời nhắc hệ thống WhatsApp chuẩn, bao gồm phân giải lời nhắc nhóm và trực tiếp, hành vi ký tự đại diện và ngữ nghĩa ghi đè tài khoản.

## Chi tiết riêng của WhatsApp

Xem [Tin nhắn nhóm](/vi/channels/group-messages) để biết hành vi chỉ dành cho WhatsApp (chèn lịch sử, chi tiết xử lý đề cập).

## Liên quan

- [Nhóm phát sóng](/vi/channels/broadcast-groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Tin nhắn nhóm](/vi/channels/group-messages)
- [Ghép đôi](/vi/channels/pairing)
