---
read_when:
    - Thay đổi hành vi trò chuyện nhóm hoặc cơ chế kiểm soát lượt đề cập
    - Giới hạn phạm vi mentionPatterns cho các cuộc trò chuyện nhóm cụ thể
sidebarTitle: Groups
summary: Hành vi trò chuyện nhóm trên các nền tảng (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Nhóm
x-i18n:
    generated_at: "2026-07-19T05:36:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f493f5737c147c097c666f1f13fb612232be6dc1ace51e910d437b02e960ec52
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw áp dụng cùng các quy tắc nhóm trên mọi kênh hỗ trợ nhóm, bao gồm Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp và Zalo.

Đối với các phòng luôn bật cần cung cấp ngữ cảnh yên lặng trừ khi tác nhân chủ động gửi tin nhắn hiển thị, hãy xem [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events).

## Giới thiệu cho người mới bắt đầu (2 phút)

OpenClaw "hoạt động" trên chính các tài khoản nhắn tin của bạn. Không có người dùng bot WhatsApp riêng: nếu **bạn** ở trong một nhóm, OpenClaw có thể thấy nhóm đó và phản hồi tại đó.

Hành vi mặc định:

- Các nhóm bị hạn chế (`groupPolicy: "allowlist"`); người gửi trong nhóm bị chặn cho đến khi được đưa vào danh sách cho phép.
- Phản hồi yêu cầu lượt đề cập trừ khi bạn tắt cơ chế kiểm soát bằng lượt đề cập cho một nhóm.
- Nội dung phản hồi cuối cùng tự động được đăng vào phòng (`visibleReplies: "automatic"`).

Nói cách khác: người gửi trong danh sách cho phép có thể kích hoạt OpenClaw bằng cách đề cập đến nó.

<Note>
**Tóm tắt**

- **Quyền truy cập DM** được kiểm soát bởi `*.allowFrom`.
- **Quyền truy cập nhóm** được kiểm soát bởi `*.groupPolicy` + các danh sách cho phép (`*.groups`, `*.groupAllowFrom`).
- **Kích hoạt phản hồi** được kiểm soát bởi cơ chế kiểm soát bằng lượt đề cập (`requireMention`, `/activation`).

</Note>

Luồng nhanh (điều xảy ra với một tin nhắn nhóm):

```text
groupPolicy? disabled -> loại bỏ
groupPolicy? allowlist -> nhóm được phép? không -> loại bỏ
requireMention? có -> được đề cập? không -> chỉ lưu làm ngữ cảnh
lượt đề cập/phản hồi/lệnh/DM -> yêu cầu của người dùng
trò chuyện nhóm luôn bật -> yêu cầu của người dùng hoặc sự kiện phòng khi được cấu hình
```

## Phản hồi hiển thị

Đối với các yêu cầu nhóm/kênh thông thường, OpenClaw mặc định dùng `messages.groupChat.visibleReplies: "automatic"`: nội dung cuối cùng của trợ lý được đăng vào phòng dưới dạng phản hồi hiển thị.

Sử dụng `messages.groupChat.visibleReplies: "message_tool"` khi một phòng dùng chung cần cho phép tác nhân quyết định thời điểm lên tiếng bằng cách gọi `message(action=send)`. Cách này hoạt động tốt nhất với các mô hình sử dụng công cụ đáng tin cậy (ví dụ: GPT-5.6 Sol). Nếu mô hình bỏ lỡ công cụ và trả về nội dung cuối cùng có ý nghĩa, OpenClaw giữ nội dung đó ở chế độ riêng tư thay vì đăng vào phòng.

Sử dụng `"automatic"` cho các mô hình hoặc runtime không tuân thủ đáng tin cậy cơ chế phân phối chỉ qua công cụ: nội dung cuối cùng dạng văn bản thông thường được đăng trực tiếp vào phòng và tác nhân vẫn có thể gọi `message(action=send)` cho tệp, hình ảnh hoặc tệp đính kèm khác không thể gửi cùng nội dung cuối cùng.

Nếu công cụ tin nhắn không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw chuyển về phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi. `openclaw doctor` cảnh báo về sự không khớp này.

Đối với cuộc trò chuyện trực tiếp và mọi sự kiện nguồn khác, `messages.visibleReplies: "message_tool"` áp dụng cùng hành vi chỉ qua công cụ trên toàn cục; `messages.groupChat.visibleReplies` vẫn là tùy chọn ghi đè cụ thể hơn cho các phòng nhóm/kênh. Các lượt trực tiếp trong WebChat nội bộ mặc định phân phối phản hồi cuối cùng tự động để Pi và Codex nhận được cùng một hợp đồng phản hồi hiển thị.

Chế độ chỉ qua công cụ thay thế mẫu cũ buộc mô hình phải trả lời `NO_REPLY` cho hầu hết các lượt ở chế độ im lặng theo dõi. Trong chế độ chỉ qua công cụ, lời nhắc không định nghĩa hợp đồng `NO_REPLY`; không thực hiện hành động hiển thị đơn giản là không gọi công cụ tin nhắn.

Các liên kết cuộc trò chuyện do plugin sở hữu là trường hợp ngoại lệ. Sau khi một plugin liên kết luồng và tiếp nhận lượt đến, phản hồi do plugin trả về là phản hồi liên kết hiển thị; phản hồi đó không cần `message(action=send)`. Đây là đầu ra của runtime plugin, không phải nội dung cuối cùng riêng tư của mô hình.

Chỉ báo đang nhập vẫn được gửi cho các yêu cầu nhóm trực tiếp. Khi được bật, các sự kiện phòng xung quanh luôn bật vẫn duy trì nghiêm ngặt và yên lặng trừ khi tác nhân gọi công cụ tin nhắn.

Theo mặc định, các phiên sẽ ẩn bản tóm tắt dài dòng về công cụ/tiến trình. Sử dụng `/verbose on` (hoặc `/verbose full`) để hiển thị chúng cho phiên hiện tại trong khi gỡ lỗi và `/verbose off` để quay lại hành vi chỉ hiển thị phản hồi cuối cùng. Trạng thái chi tiết được lưu theo từng phiên và hoạt động giống nhau trong cuộc trò chuyện trực tiếp, nhóm, kênh và chủ đề diễn đàn.

Để gửi trò chuyện nhóm luôn bật không có lượt đề cập dưới dạng ngữ cảnh phòng yên lặng thay vì yêu cầu của người dùng, hãy sử dụng [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Giá trị mặc định là `unmentionedInbound: "user_request"`. Tin nhắn có lượt đề cập, lệnh, yêu cầu hủy và DM vẫn là yêu cầu của người dùng.

Để yêu cầu đầu ra hiển thị phải đi qua công cụ tin nhắn đối với các yêu cầu nhóm/kênh:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Để yêu cầu điều này cho mọi cuộc trò chuyện nguồn:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Gateway tiếp nhận các thay đổi cấu hình `messages` mà không cần khởi động lại sau khi tệp được lưu. Chỉ khởi động lại khi tính năng tải lại cấu hình bị tắt (`gateway.reload.mode: "off"`).

Các lượt lệnh bỏ qua `visibleReplies: "message_tool"` và luôn phản hồi theo cách hiển thị: cả lệnh gạch chéo gốc (Discord, Telegram và các bề mặt khác hỗ trợ lệnh gốc) lẫn lệnh văn bản `/...` đã được cấp quyền đều đăng phản hồi vào cuộc trò chuyện nguồn. Các lượt văn bản `/...` chưa được cấp quyền trong nhóm vẫn chỉ sử dụng công cụ tin nhắn; các lượt trò chuyện thông thường tuân theo giá trị mặc định đã cấu hình.

## Khả năng hiển thị ngữ cảnh và danh sách cho phép

Có hai cơ chế kiểm soát khác nhau liên quan đến an toàn nhóm:

- **Ủy quyền kích hoạt**: ai có thể kích hoạt tác nhân (`groupPolicy`, `groups`, `groupAllowFrom`, các danh sách cho phép dành riêng cho từng kênh).
- **Khả năng hiển thị ngữ cảnh**: ngữ cảnh bổ sung nào được đưa vào mô hình (nội dung phản hồi/trích dẫn, lịch sử luồng, siêu dữ liệu chuyển tiếp).

Theo mặc định, OpenClaw giữ nguyên ngữ cảnh như khi nhận được: danh sách cho phép quyết định ai có thể kích hoạt hành động, không quyết định mô hình nhìn thấy các đoạn trích dẫn hoặc lịch sử nào. Để lọc cả ngữ cảnh bổ sung, hãy đặt `contextVisibility`:

| Chế độ                | Hành vi                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (mặc định)   | Giữ nguyên ngữ cảnh bổ sung như khi nhận được.                                           |
| `"allowlist"`       | Chỉ đưa ngữ cảnh lịch sử/luồng/trích dẫn/chuyển tiếp từ người gửi trong danh sách cho phép vào mô hình.     |
| `"allowlist_quote"` | `allowlist`, đồng thời giữ tin nhắn được trích dẫn/phản hồi rõ ràng từ bất kỳ người gửi nào. |

Đặt theo từng kênh (`channels.<channel>.contextVisibility`), từng tài khoản (`channels.<channel>.accounts.<accountId>.contextVisibility`) hoặc trên toàn cục (`channels.defaults.contextVisibility`). Các kênh truy xuất ngữ cảnh bổ sung (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) áp dụng chính sách khi xây dựng ngữ cảnh đến; các tổ hợp chính sách không xác định sẽ đóng an toàn và bỏ qua ngữ cảnh.

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                         | Giá trị cần đặt                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Cho phép tất cả nhóm nhưng chỉ phản hồi khi có @lượt đề cập | `groups: { "*": { requireMention: true } }`                |
| Tắt tất cả phản hồi nhóm                    | `groupPolicy: "disabled"`                                  |
| Chỉ các nhóm cụ thể                         | `groups: { "<group-id>": { ... } }` (không có khóa `"*"`)         |
| Chỉ bạn có thể kích hoạt trong nhóm               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Tái sử dụng một tập người gửi đáng tin cậy trên nhiều kênh | `groupAllowFrom: ["accessGroup:operators"]`                |

Đối với các danh sách người gửi cho phép có thể tái sử dụng, hãy xem [Nhóm truy cập](/vi/channels/access-groups).

## Khóa phiên

- Phiên nhóm sử dụng các khóa phiên `agent:<agentId>:<channel>:group:<id>` (phòng/kênh sử dụng `agent:<agentId>:<channel>:channel:<id>`).
- Các chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào mã định danh nhóm để mỗi chủ đề có phiên riêng.
- Cuộc trò chuyện trực tiếp sử dụng phiên chính (hoặc phiên theo từng người gửi nếu `session.dmScope` được cấu hình).
- Heartbeat chạy trong phiên heartbeat đã cấu hình (mặc định: phiên chính của tác nhân); các phiên nhóm không chạy heartbeat riêng.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Mẫu: DM cá nhân + nhóm công khai (một tác nhân)

Có — cách này hoạt động tốt nếu lưu lượng "cá nhân" của bạn là **DM** và lưu lượng "công khai" là **nhóm**.

Lý do: trong chế độ một tác nhân, DM thường được chuyển vào khóa phiên **chính** (`agent:main:main`), trong khi nhóm luôn sử dụng các khóa phiên **không phải chính** (`agent:main:<channel>:group:<id>`). Nếu bạn bật sandbox bằng `mode: "non-main"`, các phiên nhóm đó chạy trong backend sandbox đã cấu hình, còn phiên DM chính của bạn vẫn chạy trên máy chủ. Docker là backend mặc định nếu bạn không chọn backend khác.

Cách này cung cấp cho bạn một "bộ não" tác nhân (không gian làm việc + bộ nhớ dùng chung), nhưng có hai chế độ thực thi:

- **DM**: đầy đủ công cụ (máy chủ)
- **Nhóm**: sandbox + công cụ bị hạn chế

<Note>
Nếu bạn cần các không gian làm việc/chân dung thực sự tách biệt ("cá nhân" và "công khai" tuyệt đối không được trộn lẫn), hãy sử dụng tác nhân thứ hai + liên kết. Xem [Định tuyến đa tác nhân](/vi/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM trên máy chủ, nhóm trong sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // nhóm/kênh không phải chính -> chạy trong sandbox
            scope: "session", // cách ly mạnh nhất (một vùng chứa cho mỗi nhóm/kênh)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Nếu allow không rỗng, mọi thứ khác đều bị chặn (deny vẫn được ưu tiên).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Nhóm chỉ thấy một thư mục trong danh sách cho phép">
    Bạn muốn "nhóm chỉ có thể thấy thư mục X" thay vì "không có quyền truy cập máy chủ"? Giữ `workspaceAccess: "none"` và chỉ gắn các đường dẫn trong danh sách cho phép vào sandbox:

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

- Khóa cấu hình và giá trị mặc định: [Cấu hình Gateway](/vi/gateway/config-agents#agentsdefaultssandbox)
- Gỡ lỗi lý do công cụ bị chặn: [Sandbox so với Chính sách công cụ so với Nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
- Chi tiết về gắn kết liên kết: [Sandbox](/vi/gateway/sandboxing#custom-bind-mounts)

## Nhãn hiển thị

- Nhãn giao diện người dùng sử dụng `displayName` khi có sẵn, được định dạng là `<channel>:<token>`.
- `#room` được dành riêng cho phòng/kênh; cuộc trò chuyện nhóm sử dụng `g-<slug>` (chữ thường, khoảng trắng -> `-`, giữ nguyên `#@+._-`). Các mã định danh mờ quá dài được rút gọn thành một token ổn định thay vì làm lộ toàn bộ mã định danh tuyến trong giao diện người dùng.

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
      groupAllowFrom: ["123456789"], // ID người dùng Telegram dạng số (quá trình thiết lập phân giải @username)
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
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
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

| Chính sách        | Hành vi                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Các nhóm bỏ qua danh sách cho phép; cơ chế yêu cầu đề cập vẫn được áp dụng.      |
| `"disabled"`  | Chặn hoàn toàn mọi tin nhắn nhóm.                           |
| `"allowlist"` | Chỉ cho phép các nhóm/phòng khớp với danh sách cho phép đã cấu hình. |

<AccordionGroup>
  <Accordion title="Ghi chú theo từng kênh">
    - `groupPolicy` tách biệt với cơ chế yêu cầu đề cập (vốn yêu cầu @đề cập).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: sử dụng `groupAllowFrom` (dự phòng: `allowFrom` tường minh).
    - Signal: `groupAllowFrom` có thể khớp với ID nhóm Signal nhận vào hoặc số điện thoại/UUID của người gửi.
    - Phê duyệt ghép cặp tin nhắn trực tiếp (các mục trong kho `*-allowFrom`) chỉ áp dụng cho quyền truy cập tin nhắn trực tiếp; việc cấp quyền cho người gửi trong nhóm vẫn phải được khai báo tường minh trong danh sách cho phép của nhóm.
    - Discord: danh sách cho phép sử dụng `channels.discord.guilds.<id>.channels`.
    - Slack: danh sách cho phép sử dụng `channels.slack.channels`.
    - Matrix: danh sách cho phép sử dụng `channels.matrix.groups`. Sử dụng ID phòng (`!room:server`) hoặc bí danh (`#alias:server`); các khóa tên phòng chỉ khớp khi có `channels.matrix.dangerouslyAllowNameMatching: true`, còn các mục không phân giải được sẽ bị bỏ qua trong thời gian chạy. Sử dụng `channels.matrix.groupAllowFrom` để giới hạn người gửi; danh sách cho phép `users` theo từng phòng cũng được hỗ trợ.
    - Tin nhắn trực tiếp theo nhóm được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: danh sách cho phép người gửi chỉ chấp nhận ID người dùng dạng số (`"123456789"`; các tiền tố `telegram:`/`tg:` được loại bỏ mà không phân biệt chữ hoa chữ thường). Các mục `@username` không khớp trong thời gian chạy và sẽ ghi cảnh báo vào nhật ký; quá trình thiết lập phân giải `@username` thành ID. ID cuộc trò chuyện âm phải nằm trong `channels.telegram.groups`, không phải trong danh sách cho phép người gửi.
    - Mặc định là `groupPolicy: "allowlist"`; nếu danh sách cho phép của nhóm trống, tin nhắn nhóm sẽ bị chặn.
    - An toàn trong thời gian chạy: khi hoàn toàn thiếu một khối nhà cung cấp (không có `channels.<provider>`), chính sách nhóm sẽ đóng an toàn về `allowlist` thay vì kế thừa `channels.defaults.groupPolicy`, và Gateway ghi lại phương án dự phòng một lần cho mỗi tài khoản.

  </Accordion>
</AccordionGroup>

Mô hình tư duy nhanh (thứ tự đánh giá tin nhắn nhóm):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Danh sách cho phép của nhóm">
    Danh sách cho phép của nhóm (`*.groups`, `*.groupAllowFrom`, danh sách cho phép riêng của kênh).
  </Step>
  <Step title="Cơ chế yêu cầu đề cập">
    Cơ chế yêu cầu đề cập (`requireMention`, `/activation`).
  </Step>
</Steps>

## Cơ chế yêu cầu đề cập (mặc định)

Tin nhắn nhóm yêu cầu một lượt đề cập, trừ khi được ghi đè theo từng nhóm. Các giá trị mặc định nằm trong từng hệ thống con tại `*.groups."*"`.

Các dấu hiệu đề cập ngầm được hỗ trợ tùy theo từng kênh:

| Dấu hiệu                  | Trình tạo tích hợp sẵn hiện tại                       |
| --------------------- | ------------------------------------------------ |
| Trả lời bot      | Discord, Microsoft Teams, QQBot, Slack, Telegram |
| Trích dẫn bot      | WhatsApp, Zalo cá nhân                          |
| Bot tham gia luồng | Mattermost, Slack, Tlon                          |

Mỗi dấu hiệu được bật theo mặc định khi kênh tạo ra dấu hiệu đó. Đặt cờ `implicitMentions` tương ứng thành `false` để ngăn dấu hiệu đó bỏ qua cơ chế yêu cầu đề cập; các lượt đề cập tường minh gốc vẫn không bị ảnh hưởng. Cờ không có tác dụng đối với các kênh không tạo ra dấu hiệu đó.

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

## Xác định phạm vi cho mẫu đề cập đã cấu hình

Các `mentionPatterns` đã cấu hình là điều kiện kích hoạt dự phòng bằng biểu thức chính quy. Sử dụng chúng khi
nền tảng không cung cấp lượt đề cập bot gốc hoặc khi muốn văn bản thuần túy như
`openclaw:` được tính là một lượt đề cập. Các lượt đề cập gốc của nền tảng là riêng biệt:
khi Discord, Slack, Telegram, Matrix, Signal hoặc một kênh khác có thể xác nhận tin nhắn
đã đề cập tường minh đến bot, lượt đề cập gốc đó vẫn kích hoạt ngay cả khi
các mẫu biểu thức chính quy đã cấu hình bị từ chối.

Theo mặc định, các mẫu đề cập đã cấu hình được áp dụng ở mọi nơi mà kênh chuyển thông tin về nhà cung cấp và cuộc hội thoại vào quá trình phát hiện đề cập. Để ngăn các mẫu rộng đánh thức tác nhân trong mọi nhóm, hãy xác định phạm vi của chúng theo từng kênh bằng `channels.<channel>.mentionPatterns`.

Sử dụng `mode: "deny"` khi các mẫu đề cập bằng biểu thức chính quy cần được tắt theo mặc định cho một kênh, sau đó bật cho từng phòng cụ thể bằng `allowIn`:

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

Sử dụng giá trị mặc định `mode: "allow"` (hoặc bỏ qua `mode`) khi các mẫu đề cập bằng biểu thức chính quy cần được áp dụng rộng rãi, sau đó tắt chúng trong các phòng nhiều nhiễu bằng `denyIn`:

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

| Trường           | Tác dụng                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Các mẫu đề cập bằng biểu thức chính quy được bật, trừ khi ID cuộc hội thoại nằm trong `denyIn`. Đây là giá trị mặc định.                    |
| `mode: "deny"`  | Các mẫu đề cập bằng biểu thức chính quy bị tắt, trừ khi ID cuộc hội thoại nằm trong `allowIn`.                                       |
| `allowIn`       | Các ID cuộc hội thoại mà mẫu đề cập bằng biểu thức chính quy được bật trong chế độ từ chối.                                               |
| `denyIn`        | Các ID cuộc hội thoại mà mẫu đề cập bằng biểu thức chính quy bị tắt. `denyIn` được ưu tiên hơn `allowIn` nếu cả hai cùng chứa một ID. |

Chính sách biểu thức chính quy có phạm vi hiện được hỗ trợ:

| Kênh  | Các ID được sử dụng trong `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | ID kênh Discord.                                         |
| Matrix   | ID phòng Matrix.                                             |
| Slack    | ID kênh Slack.                                           |
| Telegram | ID cuộc trò chuyện nhóm hoặc `chatId:topic:threadId` cho các chủ đề diễn đàn. |
| WhatsApp | ID cuộc hội thoại WhatsApp như `123@g.us`.                |

Cấu hình kênh cấp tài khoản có thể đặt cùng chính sách trong `channels.<channel>.accounts.<accountId>.mentionPatterns` khi kênh đó hỗ trợ nhiều tài khoản. Chính sách tài khoản được ưu tiên hơn chính sách kênh cấp cao nhất đối với tài khoản đó.

<AccordionGroup>
  <Accordion title="Ghi chú về cơ chế yêu cầu đề cập">
    - `mentionPatterns` là các mẫu biểu thức chính quy an toàn, không phân biệt chữ hoa chữ thường; các mẫu không hợp lệ và dạng lặp lồng nhau không an toàn sẽ bị bỏ qua (kèm cảnh báo).
    - Thứ tự ưu tiên của mẫu: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều tác nhân dùng chung một nhóm) ghi đè `messages.groupChat.mentionPatterns`; khi không có giá trị nào được đặt, các mẫu được suy ra từ tên/biểu tượng cảm xúc trong danh tính của tác nhân.
    - Cơ chế yêu cầu đề cập chỉ được thực thi khi có thể phát hiện lượt đề cập (có lượt đề cập gốc hoặc đã cấu hình `mentionPatterns`).
    - Việc đưa một nhóm hoặc người gửi vào danh sách cho phép không vô hiệu hóa cơ chế yêu cầu đề cập; đặt `requireMention` của nhóm đó thành `false` khi mọi tin nhắn đều cần kích hoạt.
    - Ngữ cảnh lời nhắc trò chuyện nhóm tự động mang theo chỉ thị trả lời im lặng đã phân giải ở mỗi lượt; các tệp trong không gian làm việc không nên lặp lại cơ chế `NO_REPLY`.
    - Các nhóm cho phép trả lời im lặng tự động coi các lượt mô hình hoàn toàn trống hoặc chỉ có lập luận là im lặng, tương đương với `NO_REPLY`. Các cuộc trò chuyện trực tiếp không bao giờ nhận hướng dẫn `NO_REPLY`, và các câu trả lời nhóm chỉ dùng công cụ nhắn tin vẫn giữ im lặng bằng cách không gọi `message(action=send)`.
    - Nội dung trò chuyện nền luôn bật trong nhóm mặc định sử dụng ngữ nghĩa yêu cầu của người dùng. Thay vào đó, đặt `messages.groupChat.unmentionedInbound: "room_event"` để gửi nội dung đó dưới dạng ngữ cảnh im lặng. Xem [Sự kiện phòng nền](/vi/channels/ambient-room-events) để biết các ví dụ thiết lập.
    - Sự kiện phòng không được lưu dưới dạng yêu cầu giả của người dùng, và văn bản riêng tư của trợ lý từ các sự kiện phòng không dùng công cụ nhắn tin không được phát lại dưới dạng lịch sử trò chuyện.
    - Các giá trị mặc định của Discord nằm trong `channels.discord.guilds."*"` (có thể ghi đè theo từng máy chủ/kênh).
    - Ngữ cảnh lịch sử nhóm được bao bọc thống nhất trên các kênh. Các nhóm có cơ chế yêu cầu đề cập giữ lại những tin nhắn đã bỏ qua đang chờ xử lý; các nhóm luôn bật cũng có thể giữ lại những tin nhắn phòng đã xử lý gần đây khi kênh hỗ trợ. Sử dụng `messages.groupChat.historyLimit` làm giá trị mặc định toàn cục và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) để ghi đè. Đặt `0` để vô hiệu hóa.

  </Accordion>
</AccordionGroup>

## Hạn chế công cụ theo nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ giới hạn những công cụ khả dụng **bên trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/từ chối công cụ cho toàn bộ nhóm (`allow`, `alsoAllow`, `deny`; từ chối được ưu tiên).
- `toolsBySender`: ghi đè theo từng người gửi trong nhóm. Sử dụng tiền tố khóa tường minh: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` và ký tự đại diện `"*"`. ID kênh sử dụng ID kênh OpenClaw chuẩn; các bí danh như `teams` được chuẩn hóa thành `msteams`. Các khóa cũ không có tiền tố vẫn được chấp nhận, chỉ được khớp dưới dạng `id:` và sẽ ghi cảnh báo ngừng hỗ trợ vào nhật ký.

Thứ tự phân giải (cụ thể nhất được ưu tiên):

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
Các hạn chế công cụ của nhóm/kênh được áp dụng bổ sung cho chính sách công cụ toàn cục/của tác tử (từ chối vẫn được ưu tiên). Một số kênh sử dụng cấu trúc lồng khác cho phòng/kênh (ví dụ: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Danh sách cho phép của nhóm

Khi cấu hình `channels.whatsapp.groups`, `channels.telegram.groups` hoặc `channels.imessage.groups`, các khóa sẽ đóng vai trò là danh sách cho phép của nhóm. Sử dụng `"*"` để cho phép tất cả các nhóm nhưng vẫn thiết lập hành vi đề cập mặc định.

<Warning>
Điểm thường gây nhầm lẫn: phê duyệt ghép đôi tin nhắn trực tiếp không giống với cấp quyền cho nhóm. Đối với các kênh hỗ trợ ghép đôi tin nhắn trực tiếp, kho ghép đôi chỉ mở khóa tin nhắn trực tiếp. Các lệnh trong nhóm vẫn yêu cầu cấp quyền rõ ràng cho người gửi trong nhóm từ các danh sách cho phép trong cấu hình như `groupAllowFrom` hoặc cấu hình dự phòng được ghi lại cho kênh đó.
</Warning>

Các mục đích phổ biến (sao chép/dán):

<Tabs>
  <Tab title="Tắt tất cả phản hồi trong nhóm">
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
  <Tab title="Cho phép tất cả các nhóm nhưng yêu cầu đề cập">
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
  <Tab title="Chỉ chủ sở hữu mới có thể kích hoạt (WhatsApp)">
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

Chủ sở hữu nhóm có thể bật/tắt kích hoạt theo từng nhóm bằng một tin nhắn độc lập:

- `/activation mention`
- `/activation always`

`/activation` là lệnh cốt lõi chỉ dành cho chủ sở hữu và chỉ áp dụng trong cuộc trò chuyện nhóm. Chủ sở hữu nghĩa là người gửi khớp với `commands.ownerAllowFrom`; danh sách `allowFrom` của kênh chỉ kiểm soát quyền truy cập thông thường vào kênh và lệnh. Chế độ được lưu sẽ ghi đè `requireMention` của nhóm đó trên các kênh có tham chiếu đến chế độ này (Google Chat, QQBot, Telegram, WhatsApp), và phần mở đầu của lời nhắc hệ thống nhóm phản ánh chế độ đang hoạt động ở mọi nơi.

## Các trường ngữ cảnh

Payload đến từ nhóm thiết lập:

- `ChatType=group`
- `GroupSubject` (nếu biết)
- `GroupMembers` (nếu biết)
- `WasMentioned` (kết quả kiểm soát bằng đề cập)
- Các chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

Lời nhắc hệ thống của tác tử bao gồm phần mở đầu về nhóm trong lượt đầu tiên của một phiên nhóm mới (và sau khi `/activation` thay đổi). Phần này nhắc mô hình phản hồi như con người, giảm thiểu các dòng trống và tuân theo khoảng cách trò chuyện thông thường, đồng thời tránh nhập các chuỗi `\n` theo nghĩa đen. Các kênh có chế độ bảng được khai báo không bảo toàn bảng gốc hoặc bảng thô cũng không khuyến khích sử dụng bảng Markdown. Tên nhóm và nhãn người tham gia có nguồn từ kênh được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy có hàng rào, không phải chỉ dẫn hệ thống nội tuyến.

## Chi tiết riêng của iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc đưa vào danh sách cho phép.
- Liệt kê các cuộc trò chuyện: `imsg chats --limit 20`.
- Phản hồi trong nhóm luôn được gửi lại đến cùng `chat_id`.

## Lời nhắc hệ thống WhatsApp

Xem [WhatsApp](/vi/channels/whatsapp#system-prompts) để biết các quy tắc chuẩn cho lời nhắc hệ thống WhatsApp, bao gồm phân giải lời nhắc nhóm và trực tiếp, hành vi ký tự đại diện và ngữ nghĩa ghi đè tài khoản.

## Chi tiết riêng của WhatsApp

Xem [Tin nhắn nhóm](/vi/channels/group-messages) để biết hành vi chỉ dành cho WhatsApp (chèn lịch sử, chi tiết xử lý đề cập).

## Liên quan

- [Nhóm phát tin](/vi/channels/broadcast-groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Tin nhắn nhóm](/vi/channels/group-messages)
- [Ghép đôi](/vi/channels/pairing)
