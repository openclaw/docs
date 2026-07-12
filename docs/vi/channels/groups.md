---
read_when:
    - Thay đổi hành vi trò chuyện nhóm hoặc cơ chế kiểm soát lượt đề cập
    - Giới hạn phạm vi mentionPatterns cho các cuộc trò chuyện nhóm cụ thể
sidebarTitle: Groups
summary: Hành vi trò chuyện nhóm trên các nền tảng (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Nhóm
x-i18n:
    generated_at: "2026-07-12T07:42:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw áp dụng cùng một bộ quy tắc nhóm trên tất cả các kênh hỗ trợ nhóm, bao gồm Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp và Zalo.

Đối với các phòng luôn bật cần cung cấp ngữ cảnh yên lặng trừ khi tác tử chủ động gửi một tin nhắn hiển thị, hãy xem [Sự kiện phòng nền](/vi/channels/ambient-room-events).

## Giới thiệu cho người mới bắt đầu (2 phút)

OpenClaw "hoạt động" trên chính các tài khoản nhắn tin của bạn. Không có người dùng bot WhatsApp riêng biệt: nếu **bạn** ở trong một nhóm, OpenClaw có thể thấy nhóm đó và phản hồi tại đó.

Hành vi mặc định:

- Các nhóm bị hạn chế (`groupPolicy: "allowlist"`); người gửi trong nhóm bị chặn cho đến khi được thêm vào danh sách cho phép.
- Phản hồi yêu cầu có lượt đề cập trừ khi bạn tắt cơ chế bắt buộc đề cập cho một nhóm.
- Văn bản phản hồi cuối cùng được tự động đăng vào phòng (`visibleReplies: "automatic"`).

Nói cách khác: người gửi trong danh sách cho phép có thể kích hoạt OpenClaw bằng cách đề cập đến nó.

<Note>
**Tóm tắt**

- **Quyền truy cập tin nhắn trực tiếp** được kiểm soát bởi `*.allowFrom`.
- **Quyền truy cập nhóm** được kiểm soát bởi `*.groupPolicy` + các danh sách cho phép (`*.groups`, `*.groupAllowFrom`).
- **Việc kích hoạt phản hồi** được kiểm soát bởi cơ chế bắt buộc đề cập (`requireMention`, `/activation`).

</Note>

Luồng nhanh (điều xảy ra với một tin nhắn nhóm):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Phản hồi hiển thị

Đối với các yêu cầu nhóm/kênh thông thường, OpenClaw mặc định sử dụng `messages.groupChat.visibleReplies: "automatic"`: văn bản cuối cùng của trợ lý được đăng vào phòng dưới dạng phản hồi hiển thị.

Sử dụng `messages.groupChat.visibleReplies: "message_tool"` khi một phòng dùng chung cần cho phép tác tử quyết định thời điểm lên tiếng bằng cách gọi `message(action=send)`. Cơ chế này hoạt động tốt nhất với các mô hình sử dụng công cụ đáng tin cậy (ví dụ GPT-5.6 Sol). Nếu mô hình không gọi công cụ và trả về văn bản cuối cùng có nội dung thực chất, OpenClaw sẽ giữ văn bản đó ở chế độ riêng tư thay vì đăng vào phòng.

Sử dụng `"automatic"` cho các mô hình hoặc môi trường chạy không tuân thủ đáng tin cậy cơ chế phân phối chỉ qua công cụ: văn bản cuối cùng thông thường được đăng trực tiếp vào phòng, và tác tử vẫn có thể gọi `message(action=send)` cho tệp, hình ảnh hoặc các tệp đính kèm khác không thể đi kèm văn bản cuối cùng.

Nếu công cụ tin nhắn không khả dụng theo chính sách công cụ đang hoạt động, OpenClaw sẽ chuyển về phản hồi hiển thị tự động thay vì âm thầm chặn phản hồi. `openclaw doctor` cảnh báo về sự không khớp này.

Đối với các cuộc trò chuyện trực tiếp và mọi sự kiện nguồn khác, `messages.visibleReplies: "message_tool"` áp dụng cùng hành vi chỉ qua công cụ trên toàn cục; `messages.groupChat.visibleReplies` vẫn là thiết lập ghi đè cụ thể hơn cho các phòng nhóm/kênh. Các lượt trò chuyện trực tiếp nội bộ trên WebChat mặc định tự động phân phối phản hồi cuối cùng để Pi và Codex nhận cùng một quy ước phản hồi hiển thị.

Chế độ chỉ qua công cụ thay thế cách cũ là buộc mô hình trả lời `NO_REPLY` cho phần lớn các lượt ở chế độ quan sát thụ động. Trong chế độ chỉ qua công cụ, lời nhắc không định nghĩa quy ước `NO_REPLY`; không thực hiện hành động hiển thị đơn giản có nghĩa là không gọi công cụ tin nhắn.

Các liên kết cuộc hội thoại do Plugin sở hữu là ngoại lệ. Sau khi Plugin liên kết một luồng và tiếp nhận lượt đến, phản hồi do Plugin trả về là phản hồi liên kết hiển thị; phản hồi đó không cần `message(action=send)`. Đây là đầu ra của môi trường chạy Plugin, không phải văn bản cuối cùng riêng tư của mô hình.

Chỉ báo đang nhập vẫn được gửi cho các yêu cầu nhóm trực tiếp. Khi được bật, các sự kiện phòng nền luôn bật vẫn tuân thủ nghiêm ngặt và giữ im lặng trừ khi tác tử gọi công cụ tin nhắn.

Theo mặc định, các phiên sẽ ẩn phần tóm tắt chi tiết về công cụ/tiến trình. Sử dụng `/verbose on` (hoặc `/verbose full`) để hiển thị chúng cho phiên hiện tại trong khi gỡ lỗi và `/verbose off` để quay lại hành vi chỉ hiển thị phản hồi cuối cùng. Trạng thái chi tiết được áp dụng riêng cho từng phiên và hoạt động giống nhau trong các cuộc trò chuyện trực tiếp, nhóm, kênh và chủ đề diễn đàn.

Để gửi nội dung trò chuyện nhóm luôn bật không có lượt đề cập dưới dạng ngữ cảnh phòng yên lặng thay vì yêu cầu của người dùng, hãy sử dụng [Sự kiện phòng nền](/vi/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Mặc định là `unmentionedInbound: "user_request"`. Tin nhắn có lượt đề cập, lệnh, yêu cầu hủy và tin nhắn trực tiếp vẫn là yêu cầu của người dùng.

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

Các lượt lệnh bỏ qua `visibleReplies: "message_tool"` và luôn phản hồi công khai: cả lệnh gạch chéo nguyên bản (Discord, Telegram và các giao diện khác hỗ trợ lệnh nguyên bản) lẫn lệnh văn bản `/...` đã được cấp quyền đều đăng phản hồi vào cuộc trò chuyện nguồn. Các lượt văn bản `/...` chưa được cấp quyền trong nhóm vẫn chỉ sử dụng công cụ tin nhắn; các lượt trò chuyện thông thường tuân theo giá trị mặc định đã cấu hình.

## Khả năng hiển thị ngữ cảnh và danh sách cho phép

Hai cơ chế kiểm soát khác nhau tham gia vào việc bảo đảm an toàn cho nhóm:

- **Ủy quyền kích hoạt**: ai có thể kích hoạt tác tử (`groupPolicy`, `groups`, `groupAllowFrom`, các danh sách cho phép dành riêng cho kênh).
- **Khả năng hiển thị ngữ cảnh**: ngữ cảnh bổ sung nào được đưa vào mô hình (văn bản phản hồi/trích dẫn, lịch sử luồng, siêu dữ liệu chuyển tiếp).

Theo mặc định, OpenClaw giữ nguyên ngữ cảnh như đã nhận: danh sách cho phép quyết định ai có thể kích hoạt hành động, chứ không quyết định mô hình thấy những đoạn trích dẫn hoặc lịch sử nào. Để lọc cả ngữ cảnh bổ sung, hãy đặt `contextVisibility`:

| Chế độ             | Hành vi                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `"all"` (mặc định) | Giữ nguyên ngữ cảnh bổ sung như đã nhận.                                                   |
| `"allowlist"`      | Chỉ đưa vào ngữ cảnh lịch sử/luồng/trích dẫn/chuyển tiếp từ người gửi trong danh sách cho phép. |
| `"allowlist_quote"` | Như `allowlist`, đồng thời giữ lại tin nhắn được trích dẫn/phản hồi rõ ràng từ bất kỳ người gửi nào. |

Đặt theo từng kênh (`channels.<channel>.contextVisibility`), từng tài khoản (`channels.<channel>.accounts.<accountId>.contextVisibility`) hoặc trên toàn cục (`channels.defaults.contextVisibility`). Các kênh truy xuất ngữ cảnh bổ sung (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) áp dụng chính sách khi tạo ngữ cảnh đầu vào; các tổ hợp chính sách không xác định sẽ từ chối theo hướng an toàn và bỏ qua ngữ cảnh.

![Luồng tin nhắn nhóm](/images/groups-flow.svg)

Nếu bạn muốn...

| Mục tiêu                                                    | Thiết lập cần dùng                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| Cho phép tất cả các nhóm nhưng chỉ phản hồi khi được @đề cập | `groups: { "*": { requireMention: true } }`                  |
| Tắt tất cả phản hồi nhóm                                    | `groupPolicy: "disabled"`                                    |
| Chỉ cho phép các nhóm cụ thể                                | `groups: { "<group-id>": { ... } }` (không có khóa `"*"`)    |
| Chỉ bạn có thể kích hoạt trong nhóm                         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`   |
| Dùng lại một tập hợp người gửi đáng tin cậy trên nhiều kênh | `groupAllowFrom: ["accessGroup:operators"]`                  |

Đối với danh sách cho phép người gửi có thể tái sử dụng, hãy xem [Nhóm truy cập](/vi/channels/access-groups).

## Khóa phiên

- Phiên nhóm sử dụng khóa phiên `agent:<agentId>:<channel>:group:<id>` (phòng/kênh sử dụng `agent:<agentId>:<channel>:channel:<id>`).
- Các chủ đề diễn đàn Telegram thêm `:topic:<threadId>` vào mã định danh nhóm để mỗi chủ đề có phiên riêng.
- Các cuộc trò chuyện trực tiếp sử dụng phiên chính (hoặc phiên riêng theo người gửi nếu `session.dmScope` được cấu hình).
- Heartbeat chạy trong phiên heartbeat đã cấu hình (mặc định: phiên chính của tác tử); các phiên nhóm không chạy heartbeat riêng.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Mẫu: tin nhắn trực tiếp cá nhân + nhóm công khai (một tác tử)

Có — cách này hoạt động tốt nếu lưu lượng "cá nhân" của bạn là **tin nhắn trực tiếp** và lưu lượng "công khai" là **nhóm**.

Lý do: trong chế độ một tác tử, tin nhắn trực tiếp thường được đưa vào khóa phiên **chính** (`agent:main:main`), trong khi các nhóm luôn sử dụng khóa phiên **không chính** (`agent:main:<channel>:group:<id>`). Nếu bạn bật hộp cát với `mode: "non-main"`, các phiên nhóm đó sẽ chạy trong phần phụ trợ hộp cát đã cấu hình, còn phiên tin nhắn trực tiếp chính của bạn vẫn chạy trên máy chủ. Docker là phần phụ trợ mặc định nếu bạn không chọn phần phụ trợ khác.

Điều này cung cấp cho bạn một "bộ não" tác tử (không gian làm việc + bộ nhớ dùng chung), nhưng có hai tư thế thực thi:

- **Tin nhắn trực tiếp**: đầy đủ công cụ (máy chủ)
- **Nhóm**: hộp cát + công cụ bị hạn chế

<Note>
Nếu bạn cần các không gian làm việc/chân dung thực sự tách biệt ("cá nhân" và "công khai" tuyệt đối không được trộn lẫn), hãy sử dụng tác tử thứ hai + các liên kết. Xem [Định tuyến đa tác tử](/vi/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Tin nhắn trực tiếp trên máy chủ, nhóm trong hộp cát">
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
- Gỡ lỗi lý do công cụ bị chặn: [Hộp cát so với chính sách công cụ so với quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
- Chi tiết về gắn kết liên kết: [Cơ chế hộp cát](/vi/gateway/sandboxing#custom-bind-mounts)

## Nhãn hiển thị

- Các nhãn giao diện người dùng sử dụng `displayName` khi có, được định dạng là `<channel>:<token>`.
- `#room` được dành riêng cho phòng/kênh; cuộc trò chuyện nhóm sử dụng `g-<slug>` (chữ thường, dấu cách -> `-`, giữ lại `#@+._-`). Các mã định danh không trong suốt quá dài được rút gọn thành một mã ổn định thay vì để lộ toàn bộ mã định tuyến trong giao diện người dùng.

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
      groupAllowFrom: ["123456789"], // mã định danh số của người dùng Telegram (quá trình thiết lập phân giải @username)
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

| Chính sách    | Hành vi                                                               |
| ------------- | --------------------------------------------------------------------- |
| `"open"`      | Các nhóm bỏ qua danh sách cho phép; cơ chế yêu cầu đề cập vẫn áp dụng. |
| `"disabled"`  | Chặn hoàn toàn mọi tin nhắn nhóm.                                     |
| `"allowlist"` | Chỉ cho phép các nhóm/phòng khớp với danh sách cho phép đã cấu hình.   |

<AccordionGroup>
  <Accordion title="Ghi chú theo từng kênh">
    - `groupPolicy` tách biệt với cơ chế yêu cầu đề cập (cơ chế này yêu cầu @đề cập).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: sử dụng `groupAllowFrom` (phương án dự phòng: `allowFrom` được chỉ định rõ).
    - Signal: `groupAllowFrom` có thể khớp với mã định danh nhóm Signal nhận vào hoặc số điện thoại/UUID của người gửi.
    - Việc phê duyệt ghép cặp tin nhắn trực tiếp (các mục lưu trữ `*-allowFrom`) chỉ áp dụng cho quyền truy cập tin nhắn trực tiếp; việc cấp quyền cho người gửi trong nhóm vẫn phải được chỉ định rõ qua danh sách cho phép của nhóm.
    - Discord: danh sách cho phép sử dụng `channels.discord.guilds.<id>.channels`.
    - Slack: danh sách cho phép sử dụng `channels.slack.channels`.
    - Matrix: danh sách cho phép sử dụng `channels.matrix.groups`. Sử dụng mã định danh phòng (`!room:server`) hoặc bí danh (`#alias:server`); các khóa tên phòng chỉ khớp khi đặt `channels.matrix.dangerouslyAllowNameMatching: true`, còn các mục không phân giải được sẽ bị bỏ qua khi chạy. Sử dụng `channels.matrix.groupAllowFrom` để hạn chế người gửi; danh sách cho phép `users` theo từng phòng cũng được hỗ trợ.
    - Tin nhắn trực tiếp theo nhóm được kiểm soát riêng (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: danh sách cho phép người gửi chỉ chấp nhận mã định danh người dùng dạng số (`"123456789"`; các tiền tố `telegram:`/`tg:` được loại bỏ mà không phân biệt chữ hoa chữ thường). Các mục `@username` không khớp khi chạy và sẽ ghi cảnh báo vào nhật ký; quá trình thiết lập phân giải `@username` thành mã định danh. Mã định danh cuộc trò chuyện âm phải nằm trong `channels.telegram.groups`, không phải danh sách cho phép người gửi.
    - Giá trị mặc định là `groupPolicy: "allowlist"`; nếu danh sách cho phép của nhóm trống, tin nhắn nhóm sẽ bị chặn.
    - An toàn khi chạy: khi hoàn toàn thiếu khối nhà cung cấp (`channels.<provider>` không tồn tại), chính sách nhóm sẽ đóng an toàn về `allowlist` thay vì kế thừa `channels.defaults.groupPolicy`, và Gateway ghi phương án dự phòng này vào nhật ký một lần cho mỗi tài khoản.

  </Accordion>
</AccordionGroup>

Mô hình tư duy nhanh (thứ tự đánh giá tin nhắn nhóm):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Danh sách cho phép của nhóm">
    Danh sách cho phép của nhóm (`*.groups`, `*.groupAllowFrom`, danh sách cho phép dành riêng cho kênh).
  </Step>
  <Step title="Cơ chế yêu cầu đề cập">
    Cơ chế yêu cầu đề cập (`requireMention`, `/activation`).
  </Step>
</Steps>

## Cơ chế yêu cầu đề cập (mặc định)

Tin nhắn nhóm yêu cầu một lượt đề cập, trừ khi được ghi đè theo từng nhóm. Các giá trị mặc định nằm trong từng hệ thống con tại `*.groups."*"`.

Việc trả lời tin nhắn của bot được tính là một lượt đề cập ngầm khi kênh cung cấp siêu dữ liệu trả lời; trích dẫn tin nhắn của bot cũng có thể được tính trên các kênh cung cấp siêu dữ liệu trích dẫn. Các trường hợp tích hợp sẵn hiện tại: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp và Zalo cá nhân.

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

## Giới hạn phạm vi các mẫu đề cập đã cấu hình

Các `mentionPatterns` đã cấu hình là những tác nhân kích hoạt dự phòng bằng biểu thức chính quy. Sử dụng chúng khi nền tảng không cung cấp lượt đề cập bot nguyên bản hoặc khi văn bản thuần túy như `openclaw:` cần được tính là một lượt đề cập. Lượt đề cập nguyên bản của nền tảng là cơ chế riêng biệt: khi Discord, Slack, Telegram, Matrix hoặc một kênh khác có thể xác nhận rằng tin nhắn đã đề cập rõ ràng đến bot, lượt đề cập nguyên bản đó vẫn kích hoạt ngay cả khi các mẫu biểu thức chính quy đã cấu hình bị từ chối.

Theo mặc định, các mẫu đề cập đã cấu hình áp dụng ở mọi nơi mà kênh chuyển thông tin về nhà cung cấp và cuộc trò chuyện vào quy trình phát hiện đề cập. Để ngăn các mẫu rộng đánh thức tác tử trong mọi nhóm, hãy giới hạn phạm vi theo từng kênh bằng `channels.<channel>.mentionPatterns`.

Sử dụng `mode: "deny"` khi các mẫu đề cập bằng biểu thức chính quy cần mặc định bị tắt cho một kênh, sau đó bật cho các phòng cụ thể bằng `allowIn`:

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

Sử dụng `mode: "allow"` mặc định (hoặc bỏ qua `mode`) khi các mẫu đề cập bằng biểu thức chính quy cần được áp dụng rộng rãi, sau đó tắt chúng trong các phòng nhiều nhiễu bằng `denyIn`:

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

| Trường          | Tác dụng                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Các mẫu đề cập bằng biểu thức chính quy được bật, trừ khi mã định danh cuộc trò chuyện nằm trong `denyIn`. Đây là chế độ mặc định.                           |
| `mode: "deny"`  | Các mẫu đề cập bằng biểu thức chính quy bị tắt, trừ khi mã định danh cuộc trò chuyện nằm trong `allowIn`.                                                    |
| `allowIn`       | Các mã định danh cuộc trò chuyện mà mẫu đề cập bằng biểu thức chính quy được bật trong chế độ từ chối.                                                      |
| `denyIn`        | Các mã định danh cuộc trò chuyện mà mẫu đề cập bằng biểu thức chính quy bị tắt. `denyIn` được ưu tiên hơn `allowIn` nếu cả hai đều chứa cùng một mã định danh. |

Chính sách biểu thức chính quy có giới hạn phạm vi hiện được hỗ trợ:

| Kênh     | Mã định danh dùng trong `allowIn` / `denyIn`                                  |
| -------- | ----------------------------------------------------------------------------- |
| Discord  | Mã định danh kênh Discord.                                                    |
| Matrix   | Mã định danh phòng Matrix.                                                    |
| Slack    | Mã định danh kênh Slack.                                                      |
| Telegram | Mã định danh cuộc trò chuyện nhóm hoặc `chatId:topic:threadId` cho chủ đề diễn đàn. |
| WhatsApp | Mã định danh cuộc trò chuyện WhatsApp, chẳng hạn như `123@g.us`.              |

Cấu hình kênh cấp tài khoản có thể đặt cùng chính sách tại `channels.<channel>.accounts.<accountId>.mentionPatterns` khi kênh đó hỗ trợ nhiều tài khoản. Chính sách tài khoản được ưu tiên hơn chính sách kênh cấp cao nhất đối với tài khoản đó.

<AccordionGroup>
  <Accordion title="Ghi chú về cơ chế yêu cầu đề cập">
    - `mentionPatterns` là các mẫu biểu thức chính quy an toàn, không phân biệt chữ hoa chữ thường; các mẫu không hợp lệ và dạng lặp lồng nhau không an toàn sẽ bị bỏ qua (kèm cảnh báo).
    - Thứ tự ưu tiên của mẫu: `agents.list[].groupChat.mentionPatterns` (hữu ích khi nhiều tác tử dùng chung một nhóm) ghi đè `messages.groupChat.mentionPatterns`; khi không mục nào được đặt, các mẫu được suy ra từ tên/biểu tượng cảm xúc nhận dạng của tác tử.
    - Cơ chế yêu cầu đề cập chỉ được thực thi khi có thể phát hiện lượt đề cập (có lượt đề cập nguyên bản hoặc đã cấu hình `mentionPatterns`).
    - Việc đưa một nhóm hoặc người gửi vào danh sách cho phép không vô hiệu hóa cơ chế yêu cầu đề cập; đặt `requireMention` của nhóm đó thành `false` khi mọi tin nhắn đều cần kích hoạt.
    - Ngữ cảnh lời nhắc tự động của cuộc trò chuyện nhóm mang theo chỉ dẫn trả lời im lặng đã phân giải trong mỗi lượt; các tệp không gian làm việc không nên lặp lại cơ chế `NO_REPLY`.
    - Các nhóm cho phép trả lời im lặng tự động xem những lượt mô hình trống hoàn toàn hoặc chỉ có phần suy luận là im lặng, tương đương với `NO_REPLY`. Các cuộc trò chuyện trực tiếp không bao giờ nhận hướng dẫn `NO_REPLY`, và các phản hồi nhóm chỉ dùng công cụ nhắn tin sẽ giữ im lặng bằng cách không gọi `message(action=send)`.
    - Trò chuyện nhóm nền luôn bật mặc định sử dụng ngữ nghĩa yêu cầu của người dùng. Đặt `messages.groupChat.unmentionedInbound: "room_event"` để gửi nội dung đó dưới dạng ngữ cảnh yên lặng. Xem [Sự kiện phòng nền](/vi/channels/ambient-room-events) để biết các ví dụ thiết lập.
    - Các sự kiện phòng không được lưu dưới dạng yêu cầu giả của người dùng, và văn bản riêng tư của trợ lý từ các sự kiện phòng không dùng công cụ nhắn tin sẽ không được phát lại dưới dạng lịch sử trò chuyện.
    - Các giá trị mặc định của Discord nằm trong `channels.discord.guilds."*"` (có thể ghi đè theo từng máy chủ/kênh).
    - Ngữ cảnh lịch sử nhóm được bao bọc thống nhất trên các kênh. Các nhóm yêu cầu đề cập giữ lại những tin nhắn bị bỏ qua đang chờ xử lý; các nhóm luôn bật cũng có thể giữ lại những tin nhắn phòng đã xử lý gần đây khi kênh hỗ trợ. Sử dụng `messages.groupChat.historyLimit` làm giá trị mặc định toàn cục và `channels.<channel>.historyLimit` (hoặc `channels.<channel>.accounts.*.historyLimit`) để ghi đè. Đặt `0` để vô hiệu hóa.

  </Accordion>
</AccordionGroup>

## Hạn chế công cụ theo nhóm/kênh (tùy chọn)

Một số cấu hình kênh hỗ trợ hạn chế những công cụ khả dụng **bên trong một nhóm/phòng/kênh cụ thể**.

- `tools`: cho phép/từ chối công cụ cho toàn bộ nhóm (`allow`, `alsoAllow`, `deny`; từ chối được ưu tiên).
- `toolsBySender`: các giá trị ghi đè theo từng người gửi trong nhóm. Sử dụng các tiền tố khóa rõ ràng: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` và ký tự đại diện `"*"`. Mã định danh kênh sử dụng mã định danh kênh OpenClaw chuẩn; các bí danh như `teams` được chuẩn hóa thành `msteams`. Các khóa cũ không có tiền tố vẫn được chấp nhận, chỉ được khớp như `id:` và sẽ ghi cảnh báo ngừng hỗ trợ vào nhật ký.

Thứ tự phân giải (mục cụ thể nhất được ưu tiên):

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
Các hạn chế công cụ theo nhóm/kênh được áp dụng cùng với chính sách công cụ toàn cục/của tác tử (từ chối vẫn được ưu tiên). Một số kênh sử dụng cấu trúc lồng khác cho phòng/kênh (ví dụ: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Danh sách cho phép của nhóm

Khi `channels.whatsapp.groups`, `channels.telegram.groups` hoặc `channels.imessage.groups` được cấu hình, các khóa đóng vai trò là danh sách cho phép của nhóm. Sử dụng `"*"` để cho phép tất cả nhóm trong khi vẫn đặt hành vi đề cập mặc định.

<Warning>
Nhầm lẫn thường gặp: phê duyệt ghép cặp DM không giống với việc cấp quyền cho nhóm. Đối với các kênh hỗ trợ ghép cặp DM, kho lưu trữ ghép cặp chỉ mở khóa DM. Các lệnh nhóm vẫn yêu cầu cấp quyền rõ ràng cho người gửi trong nhóm từ danh sách cho phép trong cấu hình như `groupAllowFrom` hoặc cơ chế dự phòng cấu hình được ghi trong tài liệu của kênh đó.
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

## Kích hoạt (chỉ dành cho chủ sở hữu)

Chủ sở hữu nhóm có thể chuyển đổi chế độ kích hoạt cho từng nhóm bằng một tin nhắn độc lập:

- `/activation mention`
- `/activation always`

`/activation` là lệnh cốt lõi bị giới hạn cho chủ sở hữu và chỉ áp dụng trong cuộc trò chuyện nhóm. Chủ sở hữu nghĩa là người gửi khớp với `allowFrom` / `commands.ownerAllowFrom` của kênh (khi không cấu hình danh sách cho phép, mã định danh của chính tài khoản được tính là chủ sở hữu). Chế độ đã lưu sẽ ghi đè `requireMention` của nhóm đó trên các kênh sử dụng chế độ này (Google Chat, QQBot, Telegram, WhatsApp), và phần giới thiệu trong lời nhắc hệ thống của nhóm phản ánh chế độ đang hoạt động ở mọi nơi.

## Các trường ngữ cảnh

Payload đến của nhóm đặt:

- `ChatType=group`
- `GroupSubject` (nếu biết)
- `GroupMembers` (nếu biết)
- `WasMentioned` (kết quả kiểm soát bằng đề cập)
- Các chủ đề diễn đàn Telegram cũng bao gồm `MessageThreadId` và `IsForum`.

Lời nhắc hệ thống của tác tử bao gồm phần giới thiệu về nhóm ở lượt đầu tiên của một phiên nhóm mới (và sau khi `/activation` thay đổi). Phần này nhắc mô hình phản hồi như con người, giảm thiểu các dòng trống và tuân theo khoảng cách thông thường trong trò chuyện, đồng thời tránh nhập các chuỗi `\n` theo nghĩa đen. Các nhóm không thuộc Telegram cũng được khuyến cáo không dùng bảng Markdown; hướng dẫn văn bản đa dạng thức của Telegram đến từ lời nhắc của kênh Telegram. Tên nhóm và nhãn người tham gia có nguồn từ kênh được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy trong khối có hàng rào, không phải dưới dạng chỉ dẫn hệ thống nội tuyến.

## Chi tiết riêng của iMessage

- Ưu tiên `chat_id:<id>` khi định tuyến hoặc thêm vào danh sách cho phép.
- Liệt kê các cuộc trò chuyện: `imsg chats --limit 20`.
- Phản hồi trong nhóm luôn được gửi lại đến cùng một `chat_id`.

## Lời nhắc hệ thống WhatsApp

Xem [WhatsApp](/vi/channels/whatsapp#system-prompts) để biết các quy tắc chuẩn về lời nhắc hệ thống WhatsApp, bao gồm cách phân giải lời nhắc nhóm và trực tiếp, hành vi ký tự đại diện và ngữ nghĩa ghi đè tài khoản.

## Chi tiết riêng của WhatsApp

Xem [Tin nhắn nhóm](/vi/channels/group-messages) để biết hành vi chỉ dành cho WhatsApp (chèn lịch sử, chi tiết xử lý đề cập).

## Liên quan

- [Nhóm phát sóng](/vi/channels/broadcast-groups)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Tin nhắn nhóm](/vi/channels/group-messages)
- [Ghép cặp](/vi/channels/pairing)
