---
read_when:
    - Thay đổi hành vi trò chuyện nhóm hoặc cơ chế kiểm soát nhắc đến
sidebarTitle: Groups
summary: Hành vi trò chuyện nhóm trên các nền tảng (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Nhóm
x-i18n:
    generated_at: "2026-04-30T16:27:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw xử lý nhất quán các cuộc trò chuyện nhóm trên mọi bề mặt: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Giới thiệu cho người mới bắt đầu (2 phút)

OpenClaw "sống" trên chính các tài khoản nhắn tin của bạn. Không có người dùng bot WhatsApp riêng biệt. Nếu **bạn** có mặt trong một nhóm, OpenClaw có thể thấy nhóm đó và phản hồi ở đó.

Hành vi mặc định:

- Các nhóm bị giới hạn (`groupPolicy: "allowlist"`).
- Phản hồi yêu cầu có lượt nhắc đến, trừ khi bạn tắt rõ ràng cơ chế chặn theo lượt nhắc.
- Các phản hồi cuối thông thường trong nhóm/kênh mặc định là riêng tư. Đầu ra hiển thị trong phòng dùng công cụ `message`.

Diễn giải: những người gửi trong allowlist có thể kích hoạt OpenClaw bằng cách nhắc đến nó.

<Note>
**Tóm tắt**

- **Quyền truy cập DM** được kiểm soát bởi `*.allowFrom`.
- **Quyền truy cập nhóm** được kiểm soát bởi `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **Kích hoạt phản hồi** được kiểm soát bởi cơ chế chặn theo lượt nhắc (`requireMention`, `/activation`).

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
Điều đó nghĩa là tác nhân vẫn xử lý lượt và có thể cập nhật trạng thái bộ nhớ/phiên, nhưng câu trả lời cuối thông thường của nó không tự động được đăng lại vào phòng. Để nói một cách hiển thị, tác nhân dùng `message(action=send)`.

Đối với trò chuyện trực tiếp và bất kỳ lượt nguồn nào khác, dùng `messages.visibleReplies: "message_tool"` để áp dụng cùng hành vi chỉ phản hồi hiển thị bằng công cụ trên toàn cục. `messages.groupChat.visibleReplies` vẫn là ghi đè cụ thể hơn cho phòng nhóm/kênh.

Điều này thay thế mẫu cũ là buộc mô hình trả lời `NO_REPLY` cho hầu hết các lượt ở chế độ theo dõi ngầm. Trong chế độ chỉ dùng công cụ, không làm gì hiển thị đơn giản nghĩa là không gọi công cụ message.

Chỉ báo đang nhập vẫn được gửi trong khi tác nhân hoạt động ở chế độ chỉ dùng công cụ. Chế độ đang nhập mặc định cho nhóm được nâng từ "message" lên "instant" cho các lượt này vì có thể sẽ không bao giờ có văn bản tin nhắn trợ lý thông thường trước khi tác nhân quyết định có gọi công cụ message hay không. Cấu hình chế độ đang nhập rõ ràng vẫn được ưu tiên.

Để khôi phục phản hồi cuối tự động kiểu cũ cho phòng nhóm/kênh:

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
khi tính năng theo dõi tệp hoặc tải lại cấu hình bị tắt trong triển khai.

Để yêu cầu đầu ra hiển thị phải đi qua công cụ message cho mọi cuộc trò chuyện nguồn:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Các lệnh slash gốc (Discord, Telegram và các bề mặt khác có hỗ trợ lệnh gốc) bỏ qua `visibleReplies: "message_tool"` và luôn phản hồi hiển thị để giao diện lệnh gốc của kênh nhận được phản hồi như mong đợi. Điều này chỉ áp dụng cho các lượt lệnh gốc đã được xác thực; các lệnh `/...` được nhập dưới dạng văn bản và các lượt trò chuyện thông thường vẫn tuân theo mặc định nhóm đã cấu hình.

## Khả năng hiển thị ngữ cảnh và allowlist

Có hai kiểm soát khác nhau liên quan đến an toàn nhóm:

- **Ủy quyền kích hoạt**: ai có thể kích hoạt tác nhân (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist theo kênh).
- **Khả năng hiển thị ngữ cảnh**: ngữ cảnh bổ sung nào được đưa vào mô hình (văn bản trả lời, trích dẫn, lịch sử luồng, siêu dữ liệu chuyển tiếp).

Theo mặc định, OpenClaw ưu tiên hành vi trò chuyện thông thường và giữ ngữ cảnh gần như đúng như đã nhận. Điều này nghĩa là allowlist chủ yếu quyết định ai có thể kích hoạt hành động, chứ không phải là ranh giới biên tập lại phổ quát cho mọi đoạn trích dẫn hoặc đoạn lịch sử.

<AccordionGroup>
  <Accordion title="Hành vi hiện tại phụ thuộc vào từng kênh">
    - Một số kênh đã áp dụng lọc theo người gửi cho ngữ cảnh bổ sung trong các đường dẫn cụ thể (ví dụ gieo ngữ cảnh luồng Slack, tra cứu trả lời/luồng Matrix).
    - Các kênh khác vẫn truyền ngữ cảnh trích dẫn/trả lời/chuyển tiếp đúng như đã nhận.

  </Accordion>
  <Accordion title="Hướng gia cố (đã lên kế hoạch)">
    - `contextVisibility: "all"` (mặc định) giữ hành vi hiện tại là đúng như đã nhận.
    - `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung theo người gửi trong allowlist.
    - `contextVisibility: "allowlist_quote"` là `allowlist` cộng thêm một ngoại lệ trích dẫn/trả lời rõ ràng.

    Cho đến khi mô hình gia cố này được triển khai nhất quán trên các kênh, hãy dự kiến có khác biệt theo bề mặt.

  </Accordion>
</AccordionGroup>

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                      | Cần đặt                                                   |
| -------------------------------------------- | ---------------------------------------------------------- |
| Cho phép tất cả nhóm nhưng chỉ phản hồi khi có @mentions | `groups: { "*": { requireMention: true } }`                |
| Tắt mọi phản hồi nhóm                        | `groupPolicy: "disabled"`                                  |
| Chỉ các nhóm cụ thể                          | `groups: { "<group-id>": { ... } }` (không có khóa `"*"`) |
| Chỉ bạn có thể kích hoạt trong nhóm          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Khóa phiên

- Phiên nhóm dùng khóa phiên `agent:<agentId>:<channel>:group:<id>` (phòng/kênh dùng `agent:<agentId>:<channel>:channel:<id>`).
- Chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào id nhóm để mỗi chủ đề có phiên riêng.
- Trò chuyện trực tiếp dùng phiên chính (hoặc theo từng người gửi nếu được cấu hình).
- Heartbeat bị bỏ qua cho phiên nhóm.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Mẫu: DM cá nhân + nhóm công khai (một tác nhân)

Có — cách này hoạt động tốt nếu lưu lượng "cá nhân" của bạn là **DM** và lưu lượng "công khai" của bạn là **nhóm**.

Lý do: ở chế độ một tác nhân, DM thường đi vào khóa phiên **chính** (`agent:main:main`), trong khi nhóm luôn dùng khóa phiên **không phải chính** (`agent:main:<channel>:group:<id>`). Nếu bạn bật sandbox với `mode: "non-main"`, các phiên nhóm đó chạy trong backend sandbox đã cấu hình, còn phiên DM chính của bạn vẫn ở trên máy chủ. Docker là backend mặc định nếu bạn không chọn backend nào.

Điều này cho bạn một "bộ não" tác nhân (không gian làm việc + bộ nhớ dùng chung), nhưng hai tư thế thực thi:

- **DM**: đầy đủ công cụ (máy chủ)
- **Nhóm**: sandbox + công cụ bị giới hạn

<Note>
Nếu bạn cần không gian làm việc/chân dung thực sự tách biệt ("cá nhân" và "công khai" tuyệt đối không được trộn lẫn), hãy dùng tác nhân thứ hai + liên kết. Xem [Định tuyến đa tác nhân](/vi/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM trên máy chủ, nhóm trong sandbox">
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
    Muốn "nhóm chỉ có thể thấy thư mục X" thay vì "không có quyền truy cập máy chủ"? Giữ `workspaceAccess: "none"` và chỉ gắn các đường dẫn trong allowlist vào sandbox:

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
- Gỡ lỗi vì sao một công cụ bị chặn: [Sandbox so với chính sách công cụ so với quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
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
| `"open"`      | Nhóm bỏ qua allowlist; cơ chế chặn theo lượt nhắc vẫn áp dụng. |
| `"disabled"`  | Chặn hoàn toàn mọi tin nhắn nhóm.                            |
| `"allowlist"` | Chỉ cho phép nhóm/phòng khớp với allowlist đã cấu hình.      |

<AccordionGroup>
  <Accordion title="Ghi chú theo kênh">
    - `groupPolicy` tách biệt với cơ chế chặn theo lượt nhắc (yêu cầu @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: dùng `groupAllowFrom` (dự phòng: `allowFrom` rõ ràng).
    - Signal: `groupAllowFrom` có thể khớp với id nhóm Signal đến hoặc số điện thoại/UUID của người gửi.
    - Phê duyệt ghép đôi DM (mục lưu trữ `*-allowFrom`) chỉ áp dụng cho quyền truy cập DM; ủy quyền người gửi trong nhóm vẫn phải rõ ràng theo allowlist nhóm.
    - Discord: allowlist dùng `channels.discord.guilds.<id>.channels`.
    - Slack: allowlist dùng `channels.slack.channels`.
    - Matrix: allowlist dùng `channels.matrix.groups`. Ưu tiên ID phòng hoặc bí danh; tra cứu tên phòng đã tham gia là nỗ lực tốt nhất, và các tên không phân giải được sẽ bị bỏ qua khi chạy. Dùng `channels.matrix.groupAllowFrom` để giới hạn người gửi; allowlist `users` theo từng phòng cũng được hỗ trợ.
    - DM nhóm được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Allowlist Telegram có thể khớp với ID người dùng (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) hoặc tên người dùng (`"@alice"` hoặc `"alice"`); tiền tố không phân biệt chữ hoa chữ thường.
    - Mặc định là `groupPolicy: "allowlist"`; nếu allowlist nhóm của bạn trống, tin nhắn nhóm sẽ bị chặn.
    - An toàn khi chạy: khi một khối nhà cung cấp hoàn toàn thiếu (`channels.<provider>` không có), chính sách nhóm rơi về chế độ fail-closed (thường là `allowlist`) thay vì kế thừa `channels.defaults.groupPolicy`.

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
  <Step title="Cơ chế chặn theo lượt nhắc">
    Cơ chế chặn theo lượt nhắc (`requireMention`, `/activation`).
  </Step>
</Steps>

## Cơ chế chặn theo lượt nhắc (mặc định)

Tin nhắn nhóm yêu cầu có lượt nhắc, trừ khi được ghi đè theo từng nhóm. Mặc định nằm theo từng hệ con dưới `*.groups."*"`.

Trả lời một tin nhắn của bot được tính là một lần nhắc đến ngầm định khi kênh hỗ trợ siêu dữ liệu trả lời. Trích dẫn một tin nhắn của bot cũng có thể được tính là một lần nhắc đến ngầm định trên các kênh cung cấp siêu dữ liệu trích dẫn. Các trường hợp tích hợp hiện tại bao gồm Telegram, WhatsApp, Slack, Discord, Microsoft Teams, và ZaloUser.

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
  <Accordion title="Mention gating notes">
    - `mentionPatterns` là các mẫu regex an toàn không phân biệt chữ hoa chữ thường; các mẫu không hợp lệ và dạng lặp lồng nhau không an toàn sẽ bị bỏ qua.
    - Các bề mặt cung cấp lượt nhắc đến tường minh vẫn được cho qua; mẫu chỉ là phương án dự phòng.
    - Ghi đè theo từng agent: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều agent dùng chung một nhóm).
    - Chặn theo lượt nhắc đến chỉ được thực thi khi có thể phát hiện lượt nhắc đến (lượt nhắc đến gốc hoặc `mentionPatterns` được cấu hình).
    - Cho phép một nhóm hoặc người gửi không tắt chặn theo lượt nhắc đến; đặt `requireMention` của nhóm đó thành `false` khi mọi tin nhắn đều nên kích hoạt.
    - Ngữ cảnh lời nhắc trò chuyện nhóm mang chỉ dẫn trả lời im lặng đã được phân giải ở mọi lượt; các tệp workspace không nên sao chép cơ chế `NO_REPLY`.
    - Các nhóm cho phép trả lời im lặng coi các lượt mô hình trống sạch hoặc chỉ có lập luận là im lặng, tương đương với `NO_REPLY`. Trò chuyện trực tiếp cũng làm như vậy chỉ khi trả lời im lặng trực tiếp được cho phép tường minh; nếu không, trả lời trống vẫn là lượt agent thất bại.
    - Mặc định của Discord nằm trong `channels.discord.guilds."*"` (có thể ghi đè theo từng guild/kênh).
    - Ngữ cảnh lịch sử nhóm được bọc đồng nhất trên các kênh và chỉ dành cho trạng thái **pending-only** (các tin nhắn bị bỏ qua do chặn theo lượt nhắc đến); dùng `messages.groupChat.historyLimit` cho mặc định toàn cục và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) cho các ghi đè. Đặt `0` để tắt.

  </Accordion>
</AccordionGroup>

## Hạn chế công cụ theo nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ hạn chế những công cụ có sẵn **bên trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/từ chối công cụ cho toàn bộ nhóm.
- `toolsBySender`: ghi đè theo từng người gửi trong nhóm. Dùng tiền tố khóa tường minh: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, và ký tự đại diện `"*"`. Các khóa cũ không có tiền tố vẫn được chấp nhận và chỉ được khớp như `id:`.

Thứ tự phân giải (mục cụ thể nhất thắng):

<Steps>
  <Step title="Group toolsBySender">
    `toolsBySender` của nhóm/kênh khớp.
  </Step>
  <Step title="Group tools">
    `tools` của nhóm/kênh.
  </Step>
  <Step title="Default toolsBySender">
    `toolsBySender` mặc định (`"*"`) khớp.
  </Step>
  <Step title="Default tools">
    `tools` mặc định (`"*"`)
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
Hạn chế công cụ theo nhóm/kênh được áp dụng cùng với chính sách công cụ toàn cục/agent (từ chối vẫn thắng). Một số kênh dùng cấu trúc lồng khác nhau cho phòng/kênh (ví dụ: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Danh sách cho phép nhóm

Khi `channels.whatsapp.groups`, `channels.telegram.groups`, hoặc `channels.imessage.groups` được cấu hình, các khóa đóng vai trò là danh sách cho phép nhóm. Dùng `"*"` để cho phép tất cả nhóm trong khi vẫn đặt hành vi nhắc đến mặc định.

<Warning>
Nhầm lẫn phổ biến: phê duyệt ghép đôi DM không giống với ủy quyền nhóm. Với các kênh hỗ trợ ghép đôi DM, kho ghép đôi chỉ mở khóa DM. Lệnh nhóm vẫn yêu cầu ủy quyền người gửi nhóm tường minh từ danh sách cho phép cấu hình như `groupAllowFrom` hoặc phương án dự phòng cấu hình đã được tài liệu hóa cho kênh đó.
</Warning>

Ý định thường gặp (sao chép/dán):

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

## Kích hoạt (chỉ chủ sở hữu)

Chủ sở hữu nhóm có thể bật/tắt kích hoạt theo từng nhóm:

- `/activation mention`
- `/activation always`

Chủ sở hữu được xác định bởi `channels.whatsapp.allowFrom` (hoặc E.164 của chính bot khi chưa đặt). Gửi lệnh dưới dạng một tin nhắn độc lập. Các bề mặt khác hiện bỏ qua `/activation`.

## Trường ngữ cảnh

Payload đến của nhóm đặt:

- `ChatType=group`
- `GroupSubject` (nếu biết)
- `GroupMembers` (nếu biết)
- `WasMentioned` (kết quả chặn theo lượt nhắc đến)
- Chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

Ghi chú theo kênh:

- BlueBubbles có thể tùy chọn làm giàu thông tin người tham gia nhóm macOS chưa có tên từ cơ sở dữ liệu Danh bạ cục bộ trước khi điền `GroupMembers`. Tùy chọn này tắt theo mặc định và chỉ chạy sau khi cơ chế chặn nhóm bình thường đã cho qua.

Lời nhắc hệ thống của agent bao gồm phần giới thiệu nhóm ở lượt đầu tiên của một phiên nhóm mới. Nó nhắc mô hình trả lời như con người, tránh bảng Markdown, giảm thiểu dòng trống và tuân theo khoảng cách trò chuyện thông thường, đồng thời tránh gõ chuỗi `\n` theo nghĩa đen. Tên nhóm và nhãn người tham gia có nguồn từ kênh được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy trong khối fenced, không phải chỉ dẫn hệ thống nội tuyến.

## Chi tiết riêng của iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc đưa vào danh sách cho phép.
- Liệt kê cuộc trò chuyện: `imsg chats --limit 20`.
- Trả lời nhóm luôn quay lại cùng một `chat_id`.

## Lời nhắc hệ thống của WhatsApp

Xem [WhatsApp](/vi/channels/whatsapp#system-prompts) để biết các quy tắc lời nhắc hệ thống WhatsApp chuẩn, bao gồm phân giải lời nhắc nhóm và trực tiếp, hành vi ký tự đại diện, và ngữ nghĩa ghi đè tài khoản.

## Chi tiết riêng của WhatsApp

Xem [Tin nhắn nhóm](/vi/channels/group-messages) để biết hành vi chỉ dành cho WhatsApp (chèn lịch sử, chi tiết xử lý lượt nhắc đến).

## Liên quan

- [Nhóm phát sóng](/vi/channels/broadcast-groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Tin nhắn nhóm](/vi/channels/group-messages)
- [Ghép đôi](/vi/channels/pairing)
