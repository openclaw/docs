---
read_when:
    - Thay đổi hành vi trò chuyện nhóm hoặc cơ chế kiểm soát lượt đề cập
    - Giới hạn phạm vi mentionPatterns cho các cuộc trò chuyện nhóm cụ thể
sidebarTitle: Groups
summary: Hành vi trò chuyện nhóm trên các nền tảng (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Nhóm
x-i18n:
    generated_at: "2026-07-16T14:50:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw áp dụng cùng một bộ quy tắc nhóm trên mọi kênh hỗ trợ nhóm, bao gồm Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp và Zalo.

Đối với các phòng luôn hoạt động, vốn chỉ nên cung cấp ngữ cảnh một cách thầm lặng trừ khi tác nhân gửi rõ ràng một tin nhắn hiển thị, hãy xem [Sự kiện phòng nền](/vi/channels/ambient-room-events).

## Giới thiệu cho người mới bắt đầu (2 phút)

OpenClaw "hoạt động" trên chính các tài khoản nhắn tin của bạn. Không có người dùng bot WhatsApp riêng biệt: nếu **bạn** có mặt trong một nhóm, OpenClaw có thể thấy nhóm đó và phản hồi tại đó.

Hành vi mặc định:

- Các nhóm bị hạn chế (`groupPolicy: "allowlist"`); người gửi trong nhóm bị chặn cho đến khi được thêm vào danh sách cho phép.
- Phản hồi yêu cầu một lượt đề cập, trừ khi bạn tắt cơ chế kiểm soát bằng lượt đề cập cho một nhóm.
- Văn bản phản hồi cuối cùng được tự động đăng vào phòng (`visibleReplies: "automatic"`).

Nói cách khác: người gửi trong danh sách cho phép có thể kích hoạt OpenClaw bằng cách đề cập đến nó.

<Note>
**Tóm tắt**

- **Quyền truy cập tin nhắn trực tiếp** được kiểm soát bởi `*.allowFrom`.
- **Quyền truy cập nhóm** được kiểm soát bởi `*.groupPolicy` + các danh sách cho phép (`*.groups`, `*.groupAllowFrom`).
- **Kích hoạt phản hồi** được kiểm soát bằng cơ chế kiểm soát lượt đề cập (`requireMention`, `/activation`).

</Note>

Luồng nhanh (điều xảy ra với một tin nhắn nhóm):

```text
groupPolicy? disabled -> loại bỏ
groupPolicy? allowlist -> nhóm được phép? không -> loại bỏ
requireMention? có -> đã được đề cập? không -> chỉ lưu làm ngữ cảnh
đề cập/phản hồi/lệnh/tin nhắn trực tiếp -> yêu cầu của người dùng
trò chuyện trong nhóm luôn hoạt động -> yêu cầu của người dùng hoặc sự kiện phòng khi được cấu hình
```

## Phản hồi hiển thị

Đối với các yêu cầu nhóm/kênh thông thường, OpenClaw mặc định sử dụng `messages.groupChat.visibleReplies: "automatic"`: văn bản cuối cùng của trợ lý được đăng vào phòng dưới dạng phản hồi hiển thị.

Sử dụng `messages.groupChat.visibleReplies: "message_tool"` khi một phòng dùng chung nên để tác nhân quyết định thời điểm lên tiếng bằng cách gọi `message(action=send)`. Cách này hoạt động tốt nhất với các mô hình sử dụng công cụ đáng tin cậy (ví dụ: GPT-5.6 Sol). Nếu mô hình bỏ qua công cụ và trả về văn bản cuối cùng có nội dung đáng kể, OpenClaw sẽ giữ văn bản đó ở chế độ riêng tư thay vì đăng vào phòng.

Sử dụng `"automatic"` cho các mô hình hoặc môi trường thực thi không tuân thủ một cách đáng tin cậy cơ chế phân phối chỉ qua công cụ: văn bản cuối cùng thông thường được đăng trực tiếp vào phòng, đồng thời tác nhân vẫn có thể gọi `message(action=send)` cho tệp, hình ảnh hoặc các tệp đính kèm khác không thể đi kèm văn bản cuối cùng.

Nếu công cụ nhắn tin không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ chuyển sang phản hồi hiển thị tự động thay vì âm thầm ngăn phản hồi. `openclaw doctor` cảnh báo về sự không khớp này.

Đối với các cuộc trò chuyện trực tiếp và mọi sự kiện nguồn khác, `messages.visibleReplies: "message_tool"` áp dụng cùng hành vi chỉ qua công cụ trên toàn cục; `messages.groupChat.visibleReplies` vẫn là giá trị ghi đè cụ thể hơn cho các phòng nhóm/kênh. Theo mặc định, các lượt trò chuyện trực tiếp nội bộ trên WebChat sử dụng cơ chế phân phối phản hồi cuối cùng tự động để Pi và Codex nhận cùng một hợp đồng phản hồi hiển thị.

Chế độ chỉ qua công cụ thay thế mẫu cũ vốn buộc mô hình trả lời `NO_REPLY` cho hầu hết các lượt ở chế độ theo dõi thụ động. Trong chế độ chỉ qua công cụ, lời nhắc không định nghĩa hợp đồng `NO_REPLY`; không thực hiện hành động hiển thị nào đơn giản có nghĩa là không gọi công cụ nhắn tin.

Các liên kết hội thoại do Plugin sở hữu là ngoại lệ. Sau khi một Plugin liên kết một luồng và tiếp nhận lượt đến, phản hồi mà Plugin trả về chính là phản hồi liên kết hiển thị; phản hồi đó không cần `message(action=send)`. Đây là đầu ra của môi trường thực thi Plugin, không phải văn bản cuối cùng riêng tư của mô hình.

Chỉ báo đang nhập vẫn được gửi cho các yêu cầu trực tiếp trong nhóm. Khi được bật, các sự kiện phòng nền luôn hoạt động vẫn tuân thủ nghiêm ngặt chế độ im lặng, trừ khi tác nhân gọi công cụ nhắn tin.

Theo mặc định, các phiên sẽ ẩn phần tóm tắt chi tiết về công cụ/tiến trình. Sử dụng `/verbose on` (hoặc `/verbose full`) để hiển thị chúng trong phiên hiện tại khi gỡ lỗi và `/verbose off` để trở lại hành vi chỉ hiển thị phản hồi cuối cùng. Trạng thái chi tiết được áp dụng theo từng phiên và hoạt động giống nhau trong các cuộc trò chuyện trực tiếp, nhóm, kênh và chủ đề diễn đàn.

Để gửi nội dung trò chuyện không có lượt đề cập trong nhóm luôn hoạt động dưới dạng ngữ cảnh phòng thầm lặng thay vì yêu cầu của người dùng, hãy sử dụng [Sự kiện phòng nền](/vi/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Giá trị mặc định là `unmentionedInbound: "user_request"`. Tin nhắn có lượt đề cập, lệnh, yêu cầu hủy và tin nhắn trực tiếp vẫn là yêu cầu của người dùng.

Để yêu cầu đầu ra hiển thị phải đi qua công cụ nhắn tin đối với các yêu cầu nhóm/kênh:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Để áp dụng yêu cầu này cho mọi cuộc trò chuyện nguồn:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Gateway tiếp nhận các thay đổi cấu hình `messages` mà không cần khởi động lại sau khi tệp được lưu. Chỉ khởi động lại khi tính năng tải lại cấu hình bị tắt (`gateway.reload.mode: "off"`).

Các lượt lệnh bỏ qua `visibleReplies: "message_tool"` và luôn phản hồi theo cách hiển thị: cả lệnh gạch chéo gốc (Discord, Telegram và các nền tảng khác có hỗ trợ lệnh gốc) lẫn lệnh văn bản `/...` đã được cấp quyền đều đăng phản hồi vào cuộc trò chuyện nguồn. Các lượt văn bản `/...` không được cấp quyền trong nhóm vẫn chỉ qua công cụ nhắn tin; các lượt trò chuyện thông thường tuân theo giá trị mặc định đã cấu hình.

## Khả năng hiển thị ngữ cảnh và danh sách cho phép

Có hai cơ chế kiểm soát khác nhau liên quan đến an toàn nhóm:

- **Quyền kích hoạt**: ai có thể kích hoạt tác nhân (`groupPolicy`, `groups`, `groupAllowFrom`, các danh sách cho phép dành riêng cho từng kênh).
- **Khả năng hiển thị ngữ cảnh**: ngữ cảnh bổ sung nào được đưa vào mô hình (văn bản phản hồi/trích dẫn, lịch sử luồng, siêu dữ liệu chuyển tiếp).

Theo mặc định, OpenClaw giữ nguyên ngữ cảnh như khi nhận được: danh sách cho phép quyết định ai có thể kích hoạt hành động, chứ không quyết định mô hình sẽ thấy những đoạn trích dẫn hoặc lịch sử nào. Để lọc cả ngữ cảnh bổ sung, hãy đặt `contextVisibility`:

| Chế độ                | Hành vi                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (mặc định)   | Giữ nguyên ngữ cảnh bổ sung như khi nhận được.                                           |
| `"allowlist"`       | Chỉ đưa vào ngữ cảnh lịch sử/luồng/trích dẫn/chuyển tiếp từ những người gửi trong danh sách cho phép.     |
| `"allowlist_quote"` | `allowlist`, đồng thời giữ lại tin nhắn được trích dẫn/phản hồi rõ ràng từ bất kỳ người gửi nào. |

Đặt theo từng kênh (`channels.<channel>.contextVisibility`), từng tài khoản (`channels.<channel>.accounts.<accountId>.contextVisibility`) hoặc trên toàn cục (`channels.defaults.contextVisibility`). Các kênh truy xuất ngữ cảnh bổ sung (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) áp dụng chính sách này khi xây dựng ngữ cảnh đầu vào; các tổ hợp chính sách không xác định sẽ đóng an toàn và bỏ qua ngữ cảnh.

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                         | Giá trị cần đặt                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Cho phép mọi nhóm nhưng chỉ phản hồi khi được @đề cập | `groups: { "*": { requireMention: true } }`                |
| Tắt mọi phản hồi nhóm                    | `groupPolicy: "disabled"`                                  |
| Chỉ các nhóm cụ thể                         | `groups: { "<group-id>": { ... } }` (không có khóa `"*"`)         |
| Chỉ bạn có thể kích hoạt trong nhóm               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Dùng lại một tập hợp người gửi đáng tin cậy trên nhiều kênh | `groupAllowFrom: ["accessGroup:operators"]`                |

Đối với danh sách người gửi được phép có thể dùng lại, hãy xem [Nhóm truy cập](/vi/channels/access-groups).

## Khóa phiên

- Các phiên nhóm sử dụng khóa phiên `agent:<agentId>:<channel>:group:<id>` (phòng/kênh sử dụng `agent:<agentId>:<channel>:channel:<id>`).
- Các chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào mã định danh nhóm để mỗi chủ đề có phiên riêng.
- Các cuộc trò chuyện trực tiếp sử dụng phiên chính (hoặc phiên riêng cho từng người gửi nếu `session.dmScope` được cấu hình).
- Heartbeat chạy trong phiên Heartbeat đã cấu hình (mặc định: phiên chính của tác nhân); các phiên nhóm không chạy Heartbeat riêng.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Mẫu: tin nhắn trực tiếp cá nhân + nhóm công khai (một tác nhân)

Có — cách này hoạt động tốt nếu lưu lượng "cá nhân" của bạn là **tin nhắn trực tiếp** và lưu lượng "công khai" là **nhóm**.

Lý do: trong chế độ một tác nhân, tin nhắn trực tiếp thường được chuyển đến khóa phiên **chính** (`agent:main:main`), còn nhóm luôn sử dụng các khóa phiên **không phải chính** (`agent:main:<channel>:group:<id>`). Nếu bạn bật chế độ hộp cát bằng `mode: "non-main"`, các phiên nhóm đó sẽ chạy trong phần phụ trợ hộp cát đã cấu hình, còn phiên tin nhắn trực tiếp chính của bạn vẫn chạy trên máy chủ. Docker là phần phụ trợ mặc định nếu bạn không chọn phần phụ trợ khác.

Điều này cung cấp cho bạn một "bộ não" tác nhân (không gian làm việc + bộ nhớ dùng chung), nhưng với hai chế độ thực thi:

- **Tin nhắn trực tiếp**: đầy đủ công cụ (máy chủ)
- **Nhóm**: hộp cát + công cụ bị hạn chế

<Note>
Nếu bạn cần các không gian làm việc/chân dung thực sự tách biệt ("cá nhân" và "công khai" tuyệt đối không được trộn lẫn), hãy sử dụng tác nhân thứ hai + các liên kết. Xem [Định tuyến đa tác nhân](/vi/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Tin nhắn trực tiếp trên máy chủ, nhóm trong hộp cát">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // nhóm/kênh không phải chính -> chạy trong hộp cát
            scope: "session", // cách ly mạnh nhất (mỗi nhóm/kênh một vùng chứa)
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
    Bạn muốn "nhóm chỉ có thể thấy thư mục X" thay vì "không có quyền truy cập máy chủ"? Giữ `workspaceAccess: "none"` và chỉ gắn các đường dẫn trong danh sách cho phép vào hộp cát:

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
- Gỡ lỗi nguyên nhân công cụ bị chặn: [Hộp cát so với Chính sách công cụ so với Quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
- Chi tiết về điểm gắn kết: [Chế độ hộp cát](/vi/gateway/sandboxing#custom-bind-mounts)

## Nhãn hiển thị

- Nhãn giao diện người dùng sử dụng `displayName` khi có sẵn, được định dạng là `<channel>:<token>`.
- `#room` được dành riêng cho phòng/kênh; cuộc trò chuyện nhóm sử dụng `g-<slug>` (chữ thường, khoảng trắng -> `-`, giữ nguyên `#@+._-`). Các mã định danh mờ rất dài được rút gọn thành một mã thông báo ổn định thay vì làm lộ toàn bộ mã định danh tuyến trong giao diện người dùng.

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
      groupAllowFrom: ["123456789"], // id người dùng Telegram dạng số (quá trình thiết lập phân giải @username)
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
    - `groupPolicy` độc lập với cơ chế yêu cầu đề cập (yêu cầu @đề cập).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: sử dụng `groupAllowFrom` (dự phòng: `allowFrom` rõ ràng).
    - Signal: `groupAllowFrom` có thể khớp với id nhóm Signal đầu vào hoặc số điện thoại/UUID của người gửi.
    - Phê duyệt ghép cặp tin nhắn trực tiếp (các mục trong kho lưu trữ `*-allowFrom`) chỉ áp dụng cho quyền truy cập tin nhắn trực tiếp; việc cấp quyền cho người gửi trong nhóm vẫn phải được chỉ định rõ trong danh sách cho phép của nhóm.
    - Discord: danh sách cho phép sử dụng `channels.discord.guilds.<id>.channels`.
    - Slack: danh sách cho phép sử dụng `channels.slack.channels`.
    - Matrix: danh sách cho phép sử dụng `channels.matrix.groups`. Sử dụng ID phòng (`!room:server`) hoặc bí danh (`#alias:server`); khóa tên phòng chỉ khớp khi có `channels.matrix.dangerouslyAllowNameMatching: true`, còn các mục không phân giải được sẽ bị bỏ qua khi chạy. Sử dụng `channels.matrix.groupAllowFrom` để hạn chế người gửi; danh sách cho phép `users` theo từng phòng cũng được hỗ trợ.
    - Tin nhắn trực tiếp theo nhóm được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: danh sách người gửi được phép chỉ chấp nhận ID người dùng dạng số (`"123456789"`; các tiền tố `telegram:`/`tg:` được loại bỏ mà không phân biệt chữ hoa chữ thường). Các mục `@username` không khớp khi chạy và sẽ ghi cảnh báo vào nhật ký; quá trình thiết lập phân giải `@username` thành ID. ID cuộc trò chuyện âm phải nằm trong `channels.telegram.groups`, không phải trong danh sách người gửi được phép.
    - Giá trị mặc định là `groupPolicy: "allowlist"`; nếu danh sách nhóm được phép trống, tin nhắn nhóm sẽ bị chặn.
    - An toàn khi chạy: khi hoàn toàn thiếu khối nhà cung cấp (không có `channels.<provider>`), chính sách nhóm sẽ đóng an toàn về `allowlist` thay vì kế thừa `channels.defaults.groupPolicy`, và Gateway chỉ ghi phương án dự phòng vào nhật ký một lần cho mỗi tài khoản.

  </Accordion>
</AccordionGroup>

Mô hình tư duy nhanh (thứ tự đánh giá tin nhắn nhóm):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Danh sách nhóm được phép">
    Danh sách nhóm được phép (`*.groups`, `*.groupAllowFrom`, danh sách cho phép dành riêng cho kênh).
  </Step>
  <Step title="Cơ chế yêu cầu đề cập">
    Cơ chế yêu cầu đề cập (`requireMention`, `/activation`).
  </Step>
</Steps>

## Cơ chế yêu cầu đề cập (mặc định)

Tin nhắn nhóm yêu cầu một lượt đề cập, trừ khi được ghi đè theo từng nhóm. Các giá trị mặc định nằm trong từng hệ thống con tại `*.groups."*"`.

Việc trả lời tin nhắn của bot được tính là một lượt đề cập ngầm định khi kênh cung cấp siêu dữ liệu trả lời; trích dẫn tin nhắn của bot cũng có thể được tính trên các kênh cung cấp siêu dữ liệu trích dẫn. Các trường hợp tích hợp sẵn hiện tại: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp và Zalo cá nhân.

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

## Giới hạn phạm vi mẫu đề cập đã cấu hình

Các `mentionPatterns` đã cấu hình là tác nhân kích hoạt dự phòng bằng biểu thức chính quy. Sử dụng chúng khi
nền tảng không cung cấp lượt đề cập bot gốc, hoặc khi bạn muốn văn bản thuần túy như
`openclaw:` được tính là một lượt đề cập. Lượt đề cập gốc của nền tảng được xử lý riêng:
khi Discord, Slack, Telegram, Matrix, Signal hoặc một kênh khác có thể xác minh rằng tin nhắn
đã đề cập rõ ràng đến bot, lượt đề cập gốc đó vẫn kích hoạt ngay cả khi
các mẫu biểu thức chính quy đã cấu hình bị từ chối.

Theo mặc định, các mẫu đề cập đã cấu hình được áp dụng ở mọi nơi mà kênh truyền thông tin về nhà cung cấp và cuộc trò chuyện vào cơ chế phát hiện đề cập. Để ngăn các mẫu rộng đánh thức tác nhân trong mọi nhóm, hãy giới hạn phạm vi của chúng theo từng kênh bằng `channels.<channel>.mentionPatterns`.

Sử dụng `mode: "deny"` khi các mẫu đề cập bằng biểu thức chính quy cần được tắt theo mặc định cho một kênh, sau đó bật riêng cho các phòng cụ thể bằng `allowIn`:

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

Cách phân giải chính sách:

| Trường           | Tác dụng                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Các mẫu đề cập bằng biểu thức chính quy được bật, trừ khi ID cuộc trò chuyện nằm trong `denyIn`. Đây là giá trị mặc định.                    |
| `mode: "deny"`  | Các mẫu đề cập bằng biểu thức chính quy bị tắt, trừ khi ID cuộc trò chuyện nằm trong `allowIn`.                                       |
| `allowIn`       | Các ID cuộc trò chuyện mà tại đó mẫu đề cập bằng biểu thức chính quy được bật trong chế độ từ chối.                                               |
| `denyIn`        | Các ID cuộc trò chuyện mà tại đó mẫu đề cập bằng biểu thức chính quy bị tắt. `denyIn` được ưu tiên hơn `allowIn` nếu cả hai đều chứa cùng một ID. |

Chính sách biểu thức chính quy có phạm vi hiện được hỗ trợ:

| Kênh  | Các ID được sử dụng trong `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | ID kênh Discord.                                         |
| Matrix   | ID phòng Matrix.                                             |
| Slack    | ID kênh Slack.                                           |
| Telegram | ID cuộc trò chuyện nhóm, hoặc `chatId:topic:threadId` cho các chủ đề diễn đàn. |
| WhatsApp | ID cuộc trò chuyện WhatsApp, chẳng hạn như `123@g.us`.                |

Cấu hình kênh cấp tài khoản có thể đặt cùng chính sách tại `channels.<channel>.accounts.<accountId>.mentionPatterns` khi kênh đó hỗ trợ nhiều tài khoản. Chính sách tài khoản được ưu tiên hơn chính sách kênh cấp cao nhất đối với tài khoản đó.

<AccordionGroup>
  <Accordion title="Ghi chú về cơ chế yêu cầu đề cập">
    - `mentionPatterns` là các mẫu biểu thức chính quy an toàn, không phân biệt chữ hoa chữ thường; các mẫu không hợp lệ và dạng lặp lồng nhau không an toàn sẽ bị bỏ qua (kèm cảnh báo).
    - Thứ tự ưu tiên mẫu: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều tác nhân dùng chung một nhóm) ghi đè `messages.groupChat.mentionPatterns`; khi không có giá trị nào được đặt, các mẫu được suy ra từ tên/emoji nhận dạng của tác nhân.
    - Cơ chế yêu cầu đề cập chỉ được thực thi khi có thể phát hiện lượt đề cập (đã cấu hình lượt đề cập gốc hoặc `mentionPatterns`).
    - Việc đưa một nhóm hoặc người gửi vào danh sách cho phép không vô hiệu hóa cơ chế yêu cầu đề cập; đặt `requireMention` của nhóm đó thành `false` khi mọi tin nhắn đều cần kích hoạt.
    - Ngữ cảnh lời nhắc trò chuyện nhóm tự động mang theo chỉ dẫn trả lời im lặng đã phân giải trong mỗi lượt; các tệp không gian làm việc không nên sao chép cơ chế `NO_REPLY`.
    - Các nhóm cho phép tự động trả lời im lặng sẽ coi những lượt mô hình hoàn toàn trống hoặc chỉ có phần suy luận là im lặng, tương đương với `NO_REPLY`. Các cuộc trò chuyện trực tiếp không bao giờ nhận chỉ dẫn `NO_REPLY`, còn các lượt trả lời nhóm chỉ dùng công cụ nhắn tin sẽ giữ im lặng bằng cách không gọi `message(action=send)`.
    - Hoạt động trò chuyện nhóm nền luôn bật mặc định sử dụng ngữ nghĩa yêu cầu của người dùng. Đặt `messages.groupChat.unmentionedInbound: "room_event"` để gửi hoạt động đó dưới dạng ngữ cảnh im lặng. Xem [Sự kiện phòng nền](/vi/channels/ambient-room-events) để biết các ví dụ thiết lập.
    - Các sự kiện phòng không được lưu dưới dạng yêu cầu giả của người dùng, và văn bản riêng tư của trợ lý từ các sự kiện phòng không dùng công cụ nhắn tin sẽ không được phát lại dưới dạng lịch sử trò chuyện.
    - Các giá trị mặc định của Discord nằm trong `channels.discord.guilds."*"` (có thể ghi đè theo từng máy chủ/kênh).
    - Ngữ cảnh lịch sử nhóm được bao bọc thống nhất trên các kênh. Các nhóm yêu cầu đề cập giữ lại những tin nhắn đang chờ đã bị bỏ qua; các nhóm luôn bật cũng có thể giữ lại những tin nhắn phòng đã xử lý gần đây khi kênh hỗ trợ. Sử dụng `messages.groupChat.historyLimit` cho giá trị mặc định toàn cục và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) để ghi đè. Đặt `0` để vô hiệu hóa.

  </Accordion>
</AccordionGroup>

## Hạn chế công cụ theo nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ hạn chế những công cụ khả dụng **bên trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/từ chối công cụ cho toàn bộ nhóm (`allow`, `alsoAllow`, `deny`; từ chối được ưu tiên).
- `toolsBySender`: ghi đè theo từng người gửi trong nhóm. Sử dụng các tiền tố khóa rõ ràng: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` và ký tự đại diện `"*"`. ID kênh sử dụng ID kênh OpenClaw chuẩn; các bí danh như `teams` được chuẩn hóa thành `msteams`. Các khóa cũ không có tiền tố vẫn được chấp nhận, chỉ được khớp dưới dạng `id:`, đồng thời ghi cảnh báo ngừng hỗ trợ vào nhật ký.

Thứ tự phân giải (mục cụ thể nhất được ưu tiên):

<Steps>
  <Step title="toolsBySender của nhóm">
    Kết quả khớp `toolsBySender` của nhóm/kênh.
  </Step>
  <Step title="Công cụ của nhóm">
    `tools` của nhóm/kênh.
  </Step>
  <Step title="toolsBySender mặc định">
    Kết quả khớp `toolsBySender` mặc định (`"*"`).
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
Các hạn chế công cụ cho nhóm/kênh được áp dụng bổ sung cho chính sách công cụ toàn cục/tác nhân (quy tắc từ chối vẫn được ưu tiên). Một số kênh sử dụng cấu trúc lồng nhau khác nhau cho phòng/kênh (ví dụ: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Danh sách cho phép nhóm

Khi cấu hình `channels.whatsapp.groups`, `channels.telegram.groups` hoặc `channels.imessage.groups`, các khóa đóng vai trò là danh sách cho phép nhóm. Dùng `"*"` để cho phép tất cả các nhóm trong khi vẫn thiết lập hành vi đề cập mặc định.

<Warning>
Nhầm lẫn thường gặp: phê duyệt ghép nối DM không giống với việc cấp quyền cho nhóm. Đối với các kênh hỗ trợ ghép nối DM, kho ghép nối chỉ mở khóa DM. Các lệnh nhóm vẫn yêu cầu cấp quyền rõ ràng cho người gửi trong nhóm từ các danh sách cho phép trong cấu hình, chẳng hạn như `groupAllowFrom`, hoặc phương án dự phòng cấu hình được ghi lại cho kênh đó.
</Warning>

Các mục đích thường gặp (sao chép/dán):

<Tabs>
  <Tab title="Tắt tất cả phản hồi nhóm">
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

Chủ sở hữu nhóm có thể chuyển đổi trạng thái kích hoạt cho từng nhóm bằng một tin nhắn độc lập:

- `/activation mention`
- `/activation always`

`/activation` là lệnh cốt lõi có kiểm soát theo chủ sở hữu và chỉ áp dụng trong cuộc trò chuyện nhóm. Chủ sở hữu nghĩa là người gửi khớp với `commands.ownerAllowFrom`; danh sách `allowFrom` của kênh chỉ kiểm soát quyền truy cập kênh thông thường và quyền truy cập lệnh. Chế độ đã lưu ghi đè `requireMention` của nhóm đó trên các kênh có sử dụng chế độ này (Google Chat, QQBot, Telegram, WhatsApp), và phần mở đầu lời nhắc hệ thống của nhóm phản ánh chế độ đang hoạt động ở mọi nơi.

## Trường ngữ cảnh

Các tải trọng đến từ nhóm thiết lập:

- `ChatType=group`
- `GroupSubject` (nếu biết)
- `GroupMembers` (nếu biết)
- `WasMentioned` (kết quả kiểm soát theo đề cập)
- Các chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

Lời nhắc hệ thống của tác nhân bao gồm phần mở đầu về nhóm trong lượt đầu tiên của một phiên nhóm mới (và sau khi `/activation` thay đổi). Phần này nhắc mô hình phản hồi như con người, giảm thiểu dòng trống và tuân theo khoảng cách trò chuyện thông thường, đồng thời tránh nhập các chuỗi `\n` theo nghĩa đen. Các kênh có chế độ bảng được khai báo không bảo toàn bảng gốc hoặc bảng thô cũng không khuyến khích sử dụng bảng Markdown. Tên nhóm và nhãn người tham gia lấy từ kênh được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy trong khối có hàng rào, chứ không phải chỉ dẫn hệ thống nội tuyến.

## Chi tiết dành riêng cho iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc đưa vào danh sách cho phép.
- Liệt kê cuộc trò chuyện: `imsg chats --limit 20`.
- Phản hồi nhóm luôn được gửi trở lại cùng `chat_id`.

## Lời nhắc hệ thống WhatsApp

Xem [WhatsApp](/vi/channels/whatsapp#system-prompts) để biết các quy tắc chuẩn cho lời nhắc hệ thống WhatsApp, bao gồm cách phân giải lời nhắc nhóm và trực tiếp, hành vi ký tự đại diện và ngữ nghĩa ghi đè tài khoản.

## Chi tiết dành riêng cho WhatsApp

Xem [Tin nhắn nhóm](/vi/channels/group-messages) để biết hành vi chỉ dành cho WhatsApp (chèn lịch sử, chi tiết xử lý đề cập).

## Liên quan

- [Nhóm phát sóng](/vi/channels/broadcast-groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Tin nhắn nhóm](/vi/channels/group-messages)
- [Ghép nối](/vi/channels/pairing)
