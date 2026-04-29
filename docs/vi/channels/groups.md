---
read_when:
    - Thay đổi hành vi trò chuyện nhóm hoặc cơ chế kiểm soát theo lượt nhắc đến
sidebarTitle: Groups
summary: Hành vi trò chuyện nhóm trên các bề mặt (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Nhóm
x-i18n:
    generated_at: "2026-04-29T22:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw xử lý trò chuyện nhóm nhất quán trên các bề mặt: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Giới thiệu cho người mới bắt đầu (2 phút)

OpenClaw "sống" trên chính các tài khoản nhắn tin của bạn. Không có người dùng bot WhatsApp riêng biệt. Nếu **bạn** ở trong một nhóm, OpenClaw có thể thấy nhóm đó và phản hồi ở đó.

Hành vi mặc định:

- Nhóm bị hạn chế (`groupPolicy: "allowlist"`).
- Phản hồi yêu cầu nhắc đến, trừ khi bạn tắt rõ ràng cơ chế chặn theo nhắc đến.
- Phản hồi cuối thông thường trong nhóm/kênh là riêng tư theo mặc định. Đầu ra hiển thị trong phòng dùng công cụ `message`.

Diễn giải: người gửi trong danh sách cho phép có thể kích hoạt OpenClaw bằng cách nhắc đến nó.

<Note>
**Tóm tắt ngắn**

- **Quyền truy cập DM** được kiểm soát bởi `*.allowFrom`.
- **Quyền truy cập nhóm** được kiểm soát bởi `*.groupPolicy` + danh sách cho phép (`*.groups`, `*.groupAllowFrom`).
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
Điều đó nghĩa là agent vẫn xử lý lượt và có thể cập nhật trạng thái bộ nhớ/phiên, nhưng câu trả lời cuối thông thường của nó không tự động được đăng lại vào phòng. Để nói hiển thị, agent dùng `message(action=send)`.

Đối với trò chuyện trực tiếp và mọi lượt nguồn khác, dùng `messages.visibleReplies: "message_tool"` để áp dụng cùng hành vi phản hồi hiển thị chỉ qua công cụ trên toàn cục. `messages.groupChat.visibleReplies` vẫn là ghi đè cụ thể hơn cho phòng nhóm/kênh.

Điều này thay thế mẫu cũ là buộc mô hình trả lời `NO_REPLY` cho hầu hết các lượt ở chế độ theo dõi. Trong chế độ chỉ dùng công cụ, không làm gì hiển thị đơn giản nghĩa là không gọi công cụ tin nhắn.

Chỉ báo đang nhập vẫn được gửi trong khi agent hoạt động ở chế độ chỉ dùng công cụ. Chế độ đang nhập mặc định của nhóm được nâng từ "message" lên "instant" cho các lượt này vì có thể sẽ không bao giờ có văn bản tin nhắn trợ lý thông thường trước khi agent quyết định có gọi công cụ tin nhắn hay không. Cấu hình chế độ đang nhập rõ ràng vẫn được ưu tiên.

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

Để yêu cầu đầu ra hiển thị phải đi qua công cụ tin nhắn cho mọi trò chuyện nguồn:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Lệnh slash gốc (Discord, Telegram và các bề mặt khác có hỗ trợ lệnh gốc) bỏ qua `visibleReplies: "message_tool"` và luôn phản hồi hiển thị để giao diện lệnh gốc của kênh nhận được phản hồi mong đợi. Điều này chỉ áp dụng cho các lượt lệnh gốc đã được xác thực; lệnh `/...` được gõ dưới dạng văn bản và các lượt trò chuyện thông thường vẫn tuân theo mặc định nhóm đã cấu hình.

## Khả năng hiển thị ngữ cảnh và danh sách cho phép

Có hai kiểm soát khác nhau liên quan đến an toàn nhóm:

- **Ủy quyền kích hoạt**: ai có thể kích hoạt agent (`groupPolicy`, `groups`, `groupAllowFrom`, danh sách cho phép theo kênh).
- **Khả năng hiển thị ngữ cảnh**: ngữ cảnh bổ sung nào được đưa vào mô hình (văn bản trả lời, trích dẫn, lịch sử luồng, siêu dữ liệu chuyển tiếp).

Theo mặc định, OpenClaw ưu tiên hành vi trò chuyện thông thường và giữ ngữ cảnh gần như đúng như nhận được. Điều này nghĩa là danh sách cho phép chủ yếu quyết định ai có thể kích hoạt hành động, không phải là ranh giới biên tập phổ quát cho mọi đoạn trích dẫn hoặc lịch sử.

<AccordionGroup>
  <Accordion title="Hành vi hiện tại phụ thuộc vào từng kênh">
    - Một số kênh đã áp dụng lọc theo người gửi cho ngữ cảnh bổ sung trong các đường dẫn cụ thể (ví dụ gieo ngữ cảnh luồng Slack, tra cứu trả lời/luồng Matrix).
    - Các kênh khác vẫn chuyển ngữ cảnh trích dẫn/trả lời/chuyển tiếp đúng như nhận được.

  </Accordion>
  <Accordion title="Hướng tăng cường bảo vệ (đã lên kế hoạch)">
    - `contextVisibility: "all"` (mặc định) giữ hành vi hiện tại là nhận sao dùng vậy.
    - `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung theo người gửi trong danh sách cho phép.
    - `contextVisibility: "allowlist_quote"` là `allowlist` cộng thêm một ngoại lệ trích dẫn/trả lời rõ ràng.

    Cho đến khi mô hình tăng cường bảo vệ này được triển khai nhất quán trên các kênh, hãy kỳ vọng có khác biệt theo từng bề mặt.

  </Accordion>
</AccordionGroup>

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                      | Cần đặt                                                   |
| -------------------------------------------- | ---------------------------------------------------------- |
| Cho phép mọi nhóm nhưng chỉ phản hồi khi @mention | `groups: { "*": { requireMention: true } }`                |
| Tắt mọi phản hồi nhóm                        | `groupPolicy: "disabled"`                                  |
| Chỉ các nhóm cụ thể                          | `groups: { "<group-id>": { ... } }` (không có khóa `"*"` key)         |
| Chỉ bạn có thể kích hoạt trong nhóm          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Khóa phiên

- Phiên nhóm dùng khóa phiên `agent:<agentId>:<channel>:group:<id>` (phòng/kênh dùng `agent:<agentId>:<channel>:channel:<id>`).
- Chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào id nhóm để mỗi chủ đề có phiên riêng.
- Trò chuyện trực tiếp dùng phiên chính (hoặc theo từng người gửi nếu được cấu hình).
- Heartbeat bị bỏ qua đối với phiên nhóm.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Mẫu: DM cá nhân + nhóm công khai (một agent)

Có, cách này hoạt động tốt nếu lưu lượng "cá nhân" của bạn là **DM** và lưu lượng "công khai" của bạn là **nhóm**.

Lý do: ở chế độ một agent, DM thường đi vào khóa phiên **chính** (`agent:main:main`), trong khi nhóm luôn dùng khóa phiên **không chính** (`agent:main:<channel>:group:<id>`). Nếu bạn bật sandboxing với `mode: "non-main"`, các phiên nhóm đó chạy trong backend sandbox đã cấu hình, còn phiên DM chính của bạn vẫn ở trên máy chủ. Docker là backend mặc định nếu bạn không chọn backend nào.

Điều này cho bạn một "bộ não" agent (workspace + bộ nhớ dùng chung), nhưng hai tư thế thực thi:

- **DM**: đầy đủ công cụ (máy chủ)
- **Nhóm**: sandbox + công cụ hạn chế

<Note>
Nếu bạn cần workspace/persona thật sự tách biệt ("cá nhân" và "công khai" tuyệt đối không được trộn lẫn), hãy dùng agent thứ hai + binding. Xem [Định tuyến đa agent](/vi/concepts/multi-agent).
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
  <Tab title="Nhóm chỉ thấy thư mục trong danh sách cho phép">
    Muốn "nhóm chỉ có thể thấy thư mục X" thay vì "không có quyền truy cập máy chủ"? Giữ `workspaceAccess: "none"` và chỉ mount các đường dẫn trong danh sách cho phép vào sandbox:

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
- Gỡ lỗi lý do một công cụ bị chặn: [Sandbox so với Chính sách công cụ so với Elevated](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
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
| `"open"`      | Nhóm bỏ qua danh sách cho phép; cơ chế chặn theo nhắc đến vẫn áp dụng. |
| `"disabled"`  | Chặn hoàn toàn mọi tin nhắn nhóm.                            |
| `"allowlist"` | Chỉ cho phép nhóm/phòng khớp với danh sách cho phép đã cấu hình. |

<AccordionGroup>
  <Accordion title="Ghi chú theo từng kênh">
    - `groupPolicy` tách biệt với cơ chế chặn theo nhắc đến (yêu cầu @mention).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: dùng `groupAllowFrom` (dự phòng: `allowFrom` rõ ràng).
    - Phê duyệt ghép cặp DM (mục lưu trữ `*-allowFrom`) chỉ áp dụng cho quyền truy cập DM; ủy quyền người gửi trong nhóm vẫn phải khai báo rõ trong danh sách cho phép nhóm.
    - Discord: danh sách cho phép dùng `channels.discord.guilds.<id>.channels`.
    - Slack: danh sách cho phép dùng `channels.slack.channels`.
    - Matrix: danh sách cho phép dùng `channels.matrix.groups`. Ưu tiên ID phòng hoặc alias; tra cứu tên phòng đã tham gia là nỗ lực tốt nhất, và tên không phân giải được sẽ bị bỏ qua khi chạy. Dùng `channels.matrix.groupAllowFrom` để hạn chế người gửi; danh sách cho phép `users` theo phòng cũng được hỗ trợ.
    - DM nhóm được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Danh sách cho phép Telegram có thể khớp ID người dùng (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) hoặc username (`"@alice"` hoặc `"alice"`); tiền tố không phân biệt chữ hoa chữ thường.
    - Mặc định là `groupPolicy: "allowlist"`; nếu danh sách cho phép nhóm của bạn trống, tin nhắn nhóm sẽ bị chặn.
    - An toàn khi chạy: khi khối provider hoàn toàn thiếu (`channels.<provider>` không có), chính sách nhóm rơi về chế độ fail-closed (thường là `allowlist`) thay vì kế thừa `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Mô hình tư duy nhanh (thứ tự đánh giá cho tin nhắn nhóm):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Danh sách cho phép nhóm">
    Danh sách cho phép nhóm (`*.groups`, `*.groupAllowFrom`, danh sách cho phép theo kênh).
  </Step>
  <Step title="Cơ chế chặn theo nhắc đến">
    Cơ chế chặn theo nhắc đến (`requireMention`, `/activation`).
  </Step>
</Steps>

## Cơ chế chặn theo nhắc đến (mặc định)

Tin nhắn nhóm yêu cầu nhắc đến, trừ khi được ghi đè theo từng nhóm. Giá trị mặc định nằm theo từng hệ thống con dưới `*.groups."*"`.

Trả lời một tin nhắn của bot được tính là một lượt nhắc đến ngầm định khi kênh hỗ trợ siêu dữ liệu trả lời. Trích dẫn một tin nhắn của bot cũng có thể được tính là lượt nhắc đến ngầm định trên các kênh cung cấp siêu dữ liệu trích dẫn. Các trường hợp tích hợp hiện tại bao gồm Telegram, WhatsApp, Slack, Discord, Microsoft Teams và ZaloUser.

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
  <Accordion title="Ghi chú về kiểm soát lượt nhắc đến">
    - `mentionPatterns` là các mẫu biểu thức chính quy an toàn, không phân biệt chữ hoa/thường; các mẫu không hợp lệ và các dạng lặp lồng nhau không an toàn sẽ bị bỏ qua.
    - Các bề mặt cung cấp lượt nhắc đến tường minh vẫn được chấp nhận; mẫu chỉ là phương án dự phòng.
    - Ghi đè theo từng tác nhân: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều tác nhân dùng chung một nhóm).
    - Kiểm soát lượt nhắc đến chỉ được thực thi khi có thể phát hiện lượt nhắc đến (lượt nhắc đến gốc hoặc `mentionPatterns` đã được cấu hình).
    - Ngữ cảnh lời nhắc cuộc trò chuyện nhóm mang theo chỉ dẫn trả lời im lặng đã phân giải ở mọi lượt; các tệp không gian làm việc không nên lặp lại cơ chế `NO_REPLY`.
    - Các nhóm cho phép trả lời im lặng xem lượt mô hình trống sạch hoặc chỉ có suy luận là im lặng, tương đương với `NO_REPLY`. Chat trực tiếp cũng làm như vậy chỉ khi trả lời im lặng trực tiếp được cho phép tường minh; nếu không, trả lời trống vẫn là lượt tác nhân thất bại.
    - Mặc định của Discord nằm trong `channels.discord.guilds."*"` (có thể ghi đè theo từng guild/kênh).
    - Ngữ cảnh lịch sử nhóm được bọc thống nhất trên các kênh và **chỉ gồm mục đang chờ xử lý** (các tin nhắn bị bỏ qua do kiểm soát lượt nhắc đến); dùng `messages.groupChat.historyLimit` cho mặc định toàn cục và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) cho ghi đè. Đặt `0` để tắt.

  </Accordion>
</AccordionGroup>

## Hạn chế công cụ theo nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ hạn chế những công cụ có sẵn **bên trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/từ chối công cụ cho toàn bộ nhóm.
- `toolsBySender`: ghi đè theo từng người gửi trong nhóm. Dùng tiền tố khóa tường minh: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, và ký tự đại diện `"*"`. Các khóa cũ không có tiền tố vẫn được chấp nhận và chỉ được khớp như `id:`.

Thứ tự phân giải (cụ thể nhất thắng):

<Steps>
  <Step title="toolsBySender của nhóm">
    `toolsBySender` của nhóm/kênh khớp.
  </Step>
  <Step title="tools của nhóm">
    `tools` của nhóm/kênh.
  </Step>
  <Step title="toolsBySender mặc định">
    `toolsBySender` mặc định (`"*"`) khớp.
  </Step>
  <Step title="tools mặc định">
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
Hạn chế công cụ theo nhóm/kênh được áp dụng thêm vào chính sách công cụ toàn cục/tác nhân (từ chối vẫn thắng). Một số kênh dùng cách lồng khác cho phòng/kênh (ví dụ: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Danh sách cho phép nhóm

Khi `channels.whatsapp.groups`, `channels.telegram.groups`, hoặc `channels.imessage.groups` được cấu hình, các khóa đóng vai trò là danh sách cho phép nhóm. Dùng `"*"` để cho phép tất cả nhóm trong khi vẫn đặt hành vi nhắc đến mặc định.

<Warning>
Nhầm lẫn phổ biến: phê duyệt ghép nối DM không giống với ủy quyền nhóm. Với các kênh hỗ trợ ghép nối DM, kho ghép nối chỉ mở khóa DM. Lệnh nhóm vẫn cần ủy quyền người gửi nhóm tường minh từ danh sách cho phép cấu hình như `groupAllowFrom` hoặc phương án cấu hình dự phòng đã được tài liệu hóa cho kênh đó.
</Warning>

Các mục đích phổ biến (sao chép/dán):

<Tabs>
  <Tab title="Tắt tất cả trả lời nhóm">
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
  <Tab title="Cho phép tất cả nhóm nhưng yêu cầu nhắc đến">
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
  <Tab title="Chỉ chủ sở hữu mới kích hoạt (WhatsApp)">
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
- `WasMentioned` (kết quả kiểm soát lượt nhắc đến)
- Chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

Ghi chú theo kênh:

- BlueBubbles có thể tùy chọn bổ sung thông tin người tham gia nhóm macOS chưa có tên từ cơ sở dữ liệu Danh bạ cục bộ trước khi điền `GroupMembers`. Tính năng này mặc định tắt và chỉ chạy sau khi kiểm soát nhóm thông thường đã đạt.

Lời nhắc hệ thống của tác nhân bao gồm phần giới thiệu nhóm ở lượt đầu tiên của một phiên nhóm mới. Nó nhắc mô hình trả lời như con người, tránh bảng Markdown, giảm thiểu dòng trống và tuân theo khoảng cách dòng trò chuyện thông thường, đồng thời tránh nhập các chuỗi `\n` theo nghĩa đen. Tên nhóm và nhãn người tham gia lấy từ kênh được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy trong khối rào, không phải chỉ dẫn hệ thống nội tuyến.

## Chi tiết riêng của iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc đưa vào danh sách cho phép.
- Liệt kê chat: `imsg chats --limit 20`.
- Trả lời nhóm luôn quay lại cùng `chat_id`.

## Lời nhắc hệ thống WhatsApp

Xem [WhatsApp](/vi/channels/whatsapp#system-prompts) để biết các quy tắc lời nhắc hệ thống WhatsApp chuẩn chính thức, bao gồm phân giải lời nhắc nhóm và trực tiếp, hành vi ký tự đại diện, và ngữ nghĩa ghi đè theo tài khoản.

## Chi tiết riêng của WhatsApp

Xem [Tin nhắn nhóm](/vi/channels/group-messages) để biết hành vi chỉ dành cho WhatsApp (chèn lịch sử, chi tiết xử lý lượt nhắc đến).

## Liên quan

- [Nhóm phát sóng](/vi/channels/broadcast-groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Tin nhắn nhóm](/vi/channels/group-messages)
- [Ghép nối](/vi/channels/pairing)
