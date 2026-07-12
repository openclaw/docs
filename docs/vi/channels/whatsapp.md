---
read_when:
    - Xử lý hành vi của kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, cách thức phân phối và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-07-12T07:41:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho môi trường production thông qua WhatsApp Web (Baileys). Gateway quản lý (các) phiên đã liên kết; không có kênh Twilio WhatsApp riêng biệt.

## Cài đặt

`openclaw onboard` và `openclaw channels add --channel whatsapp` sẽ nhắc cài đặt Plugin vào lần đầu bạn chọn kênh này; `openclaw channels login --channel whatsapp` cung cấp cùng quy trình cài đặt nếu thiếu Plugin. Các bản checkout dành cho phát triển sử dụng đường dẫn Plugin cục bộ; bản cài đặt stable/beta trước tiên cài `@openclaw/whatsapp` từ ClawHub, sau đó chuyển sang npm nếu không thành công. Runtime WhatsApp được phân phối bên ngoài gói npm OpenClaw cốt lõi, vì vậy các phần phụ thuộc runtime của nó nằm cùng Plugin bên ngoài. Cài đặt thủ công:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Chỉ sử dụng gói npm thuần (`@openclaw/whatsapp`) cho phương án dự phòng qua registry; chỉ ghim một phiên bản chính xác khi cần bản cài đặt có thể tái lập.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách tin nhắn trực tiếp mặc định đối với người gửi không xác định là ghép nối.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Các quy trình chẩn đoán và khắc phục trên nhiều kênh.
  </Card>
  <Card title="Cấu hình Gateway" icon="settings" href="/vi/gateway/configuration">
    Các mẫu và ví dụ cấu hình kênh đầy đủ.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Steps>
  <Step title="Cấu hình chính sách truy cập">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Liên kết WhatsApp (mã QR)">

```bash
openclaw channels login --channel whatsapp
```

    Việc đăng nhập chỉ sử dụng mã QR. Trên máy chủ từ xa hoặc không có giao diện, hãy chuẩn bị một phương thức đáng tin cậy để chuyển mã QR đang hoạt động đến điện thoại trước khi bắt đầu đăng nhập; mã QR hiển thị trong terminal, ảnh chụp màn hình hoặc tệp đính kèm trong cuộc trò chuyện có thể hết hạn trong quá trình truyền.

    Đối với một tài khoản cụ thể:

```bash
openclaw channels login --channel whatsapp --account work
```

    Để gắn một thư mục xác thực hiện có hoặc tùy chỉnh trước khi đăng nhập:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Khởi động Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Phê duyệt yêu cầu ghép nối đầu tiên (chế độ ghép nối)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Yêu cầu ghép nối hết hạn sau 1 giờ; mỗi tài khoản chỉ được có tối đa 3 yêu cầu đang chờ.

  </Step>
</Steps>

<Note>
Nên sử dụng một số WhatsApp riêng biệt (quy trình thiết lập và siêu dữ liệu được tối ưu hóa cho trường hợp này), nhưng việc sử dụng số cá nhân hoặc tự trò chuyện vẫn được hỗ trợ đầy đủ.
</Note>

## Mô hình triển khai

<AccordionGroup>
  <Accordion title="Số chuyên dụng (khuyến nghị)">
    - danh tính WhatsApp riêng biệt cho OpenClaw
    - danh sách cho phép tin nhắn trực tiếp và ranh giới định tuyến rõ ràng hơn
    - giảm khả năng nhầm lẫn khi tự trò chuyện

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Phương án dự phòng dùng số cá nhân">
    Quy trình tiếp nhận ban đầu hỗ trợ chế độ số cá nhân và ghi cấu hình cơ sở phù hợp với việc tự trò chuyện: `dmPolicy: "allowlist"`, `allowFrom` bao gồm số của chính bạn, `selfChatMode: true`. Các biện pháp bảo vệ khi tự trò chuyện trong runtime dựa trên số của chính tài khoản đã liên kết cùng với `allowFrom`.
  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway quản lý socket WhatsApp và vòng lặp kết nối lại.
- Một watchdog theo dõi độc lập hai tín hiệu: hoạt động truyền tải WhatsApp Web thô và hoạt động tin nhắn ứng dụng. Một phiên yên lặng nhưng vẫn kết nối sẽ không bị khởi động lại chỉ vì gần đây không có tin nhắn; hệ thống chỉ buộc kết nối lại khi các khung truyền tải ngừng đến trong một khoảng thời gian nội bộ cố định (người dùng không thể cấu hình) hoặc tin nhắn ứng dụng im lặng quá 4 lần thời gian chờ tin nhắn thông thường. Ngay sau khi kết nối lại một phiên vừa hoạt động gần đây, khoảng thời gian đầu tiên đó sử dụng thời gian chờ tin nhắn thông thường ngắn hơn thay vì khoảng thời gian gấp 4 lần. OpenClaw có thể tự động trả lời các tin nhắn ngoại tuyến mà Baileys chuyển đến sớm trong lần kết nối lại đó, trong giới hạn thời gian tồn tại của cơ chế loại bỏ trùng lặp theo ID tin nhắn đến; lần khởi động ban đầu vẫn áp dụng biện pháp bảo vệ ngắn đối với lịch sử cũ.
- Thời gian của socket Baileys được xác định rõ trong `web.whatsapp.*`: `keepAliveIntervalMs` (khoảng thời gian ping ứng dụng), `connectTimeoutMs` (thời gian chờ bắt tay mở kết nối), `defaultQueryTimeoutMs` (thời gian chờ truy vấn Baileys, cùng thời gian chờ gửi đi/trạng thái hiện diện của OpenClaw và biên nhận đã đọc của tin nhắn đến).
- Hoạt động gửi đi yêu cầu trình lắng nghe WhatsApp đang hoạt động cho tài khoản đích; nếu không, thao tác gửi sẽ thất bại ngay.
- Tin nhắn gửi đến nhóm đính kèm siêu dữ liệu đề cập gốc cho các token `@+<digits>` và `@<digits>` (trong văn bản và chú thích phương tiện) khi token khớp với siêu dữ liệu người tham gia hiện tại, bao gồm cả các nhóm dựa trên LID.
- Các cuộc trò chuyện trạng thái và phát sóng (`@status`, `@broadcast`) bị bỏ qua.
- Các cuộc trò chuyện trực tiếp sử dụng quy tắc phiên tin nhắn trực tiếp (`session.dmScope`; giá trị mặc định `main` hợp nhất các tin nhắn trực tiếp vào phiên chính của tác tử). Phiên nhóm được tách biệt theo từng JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Kênh/Bản tin WhatsApp có thể là đích gửi đi được chỉ định rõ ràng thông qua JID `@newsletter` gốc của chúng, sử dụng siêu dữ liệu phiên kênh (`agent:<agentId>:whatsapp:channel:<jid>`) thay vì ngữ nghĩa tin nhắn trực tiếp.
- Hoạt động truyền tải WhatsApp Web tuân theo các biến môi trường proxy tiêu chuẩn trên máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` và các biến thể chữ thường). Nên ưu tiên cấu hình proxy ở cấp máy chủ thay vì cài đặt riêng cho từng kênh.
- Khi bật `messages.removeAckAfterReply`, OpenClaw sẽ xóa phản ứng xác nhận sau khi gửi thành công một câu trả lời hiển thị.

## Gọi người yêu cầu hiện tại bằng MeowCaller (thử nghiệm)

Plugin có thể cung cấp `whatsapp_call` trong các lượt tác tử bắt nguồn từ WhatsApp. Công cụ này sử dụng [MeowCaller](https://github.com/purpshell/meowcaller) để thực hiện cuộc gọi thoại WhatsApp đến người yêu cầu hiện tại đã được ủy quyền và phát thông điệp TTS của OpenClaw sau khi họ trả lời. Công cụ không có tham số số đích, vì vậy lời nhắc không thể chuyển hướng cuộc gọi. Mặc định bị tắt.

<Warning>
MeowCaller đang ở trạng thái thử nghiệm, không có bản phát hành được gắn thẻ và sử dụng một phiên thiết bị liên kết whatsmeow được ghép nối riêng — không thể tái sử dụng thông tin xác thực Baileys của Plugin. Việc ghép nối sẽ thêm một thiết bị liên kết khác vào cùng tài khoản WhatsApp; hãy quét bằng danh tính mà OpenClaw sử dụng. Chế độ số cá nhân hoặc tự trò chuyện không thể tự gọi chính nó; hãy sử dụng một số OpenClaw chuyên dụng để gọi đến số cá nhân của bạn.
</Warning>

<Steps>
  <Step title="Bật cuộc gọi thử nghiệm">

    Thêm `actions.calls: true` vào cấu hình kênh WhatsApp và khởi động lại Gateway:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Khi không có hoặc có giá trị `false`, OpenClaw không cung cấp công cụ `whatsapp_call`.

  </Step>

  <Step title="Cài đặt CLI MeowCaller đã được kiểm duyệt">

    Bộ điều hợp yêu cầu tệp thực thi `meowcaller` nằm trong `PATH` của máy chủ Gateway. Cho đến khi [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) được hợp nhất, hãy xây dựng nhánh đã được kiểm duyệt:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Đảm bảo `$HOME/.local/bin` nằm trong `PATH` của dịch vụ Gateway. Bản sửa đổi này có các lệnh `pair` và `notify` chỉ gửi được xác định rõ ràng; `notify` không mở micrô, loa, thiết bị video hoặc tính năng thu thập dữ liệu chẩn đoán. Không thay thế bằng lệnh `play` của CLI ví dụ từ dự án nguồn.

  </Step>

  <Step title="Ghép nối thiết bị liên kết MeowCaller">

    Yêu cầu tác tử WhatsApp kiểm tra thiết lập cuộc gọi (hành động trạng thái của `whatsapp_call` báo cáo thư mục trạng thái dành riêng cho tài khoản và lệnh ghép nối). Đối với tài khoản mặc định:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Chạy lệnh này theo cách tương tác, quét mã QR từ **WhatsApp > Linked devices** và chờ thông báo `MeowCaller linked device ready`. Giữ riêng tư `wa-voip.db` — đây là phiên MeowCaller. Các tài khoản không mặc định nhận đường dẫn kho lưu trữ riêng từ hành động trạng thái; trên Windows, hãy chạy lệnh PowerShell tương ứng.

  </Step>

  <Step title="Cấu hình TTS và gọi từ WhatsApp">

    Cấu hình một [nhà cung cấp TTS](/vi/tools/tts) hỗ trợ điện thoại, khởi động lại Gateway, sau đó gửi yêu cầu như `Gọi cho tôi và nói rằng bản dựng đã hoàn tất.` Công cụ xác định người gửi từ ngữ cảnh tin nhắn đến đáng tin cậy, tổng hợp một tệp WAV riêng tư tạm thời, chạy MeowCaller trong khoảng thời gian cuộc gọi có giới hạn và xóa tệp âm thanh sau đó. OpenClaw truyền rõ ràng kho lưu trữ của tài khoản, chờ trạng thái thoát bằng 0 sau khi trả lời/phát âm thanh/ngắt cuộc gọi và coi việc hết thời gian chờ hoặc trạng thái thoát khác 0 là một lần gọi công cụ thất bại.

  </Step>
</Steps>

Giới hạn: chỉ hỗ trợ cuộc gọi âm thanh gửi đi một-một, không hỗ trợ số đích tùy ý, không dùng chung dữ liệu xác thực với kết nối trò chuyện, không tự gọi từ chế độ số cá nhân hoặc tự trò chuyện, âm thanh tổng hợp bị giới hạn ở 60 giây, không có biên nhận về khả năng nghe được ở phía thiết bị ngoài trạng thái hoàn tất trả lời/phát âm thanh/ngắt cuộc gọi của MeowCaller và OpenClaw dừng tiến trình đồng hành sau khoảng thời gian giới hạn từ 115 đến 175 giây (bao gồm các giai đoạn kết nối, trả lời, phát âm thanh và tắt của MeowCaller).

## Lời nhắc phê duyệt

WhatsApp có thể hiển thị lời nhắc phê duyệt thực thi và Plugin dưới dạng phản ứng `👍`/`👎`, được kiểm soát bởi cấu hình chuyển tiếp phê duyệt cấp cao nhất:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` và `approvals.plugin` hoạt động độc lập; việc bật WhatsApp làm kênh chỉ liên kết phương thức truyền tải và không gửi gì trừ khi nhóm phê duyệt tương ứng được bật và định tuyến đến đó. Chế độ phiên chỉ cung cấp phê duyệt bằng emoji gốc cho các yêu cầu phê duyệt bắt nguồn từ WhatsApp. Chế độ đích sử dụng quy trình chuyển tiếp dùng chung cho các đích được chỉ định rõ ràng và không tạo thêm hoạt động phân tán đến tin nhắn trực tiếp của người phê duyệt.

Phản ứng phê duyệt trên WhatsApp yêu cầu người phê duyệt được chỉ định rõ ràng trong `allowFrom` (hoặc `"*"`). `defaultTo` thiết lập đích tin nhắn mặc định thông thường, không phải danh sách người phê duyệt. Các lệnh `/approve` thủ công vẫn đi qua quy trình ủy quyền người gửi WhatsApp thông thường trước khi xử lý phê duyệt.

## Hook Plugin và quyền riêng tư

Tin nhắn WhatsApp đến có thể chứa nội dung cá nhân, số điện thoại, mã định danh nhóm, tên người gửi và các trường tương quan phiên. WhatsApp không phát tán tải trọng hook `message_received` của tin nhắn đến cho các Plugin trừ khi bạn chủ động bật:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Giới hạn việc bật tính năng này cho một tài khoản bằng `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Chỉ bật tùy chọn này cho các Plugin mà bạn tin tưởng có thể truy cập nội dung và mã định danh WhatsApp đến.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách tin nhắn trực tiếp">
    `channels.whatsapp.dmPolicy`:

    | Giá trị | Hành vi |
    | --- | --- |
    | `pairing` (mặc định) | Người gửi không xác định yêu cầu ghép nối; chủ sở hữu phê duyệt |
    | `allowlist` | Chỉ chấp nhận người gửi trong `allowFrom` |
    | `open` | Yêu cầu `allowFrom` bao gồm `"*"` |
    | `disabled` | Chặn tất cả tin nhắn trực tiếp |

    `allowFrom` chấp nhận các số theo định dạng E.164 (được chuẩn hóa nội bộ). Đây chỉ là danh sách kiểm soát truy cập dành cho người gửi tin nhắn trực tiếp — không kiểm soát các thao tác gửi đi được chỉ định rõ ràng đến JID nhóm hoặc JID kênh `@newsletter`.

    Ghi đè cho nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `.allowFrom`) được ưu tiên hơn các giá trị mặc định cấp kênh đối với tài khoản đó.

    Lưu ý về runtime:

    - các ghép nối được lưu bền vững trong kho cho phép của kênh và được hợp nhất với `allowFrom` đã cấu hình
    - tác vụ tự động theo lịch và cơ chế dự phòng người nhận Heartbeat sử dụng đích gửi rõ ràng hoặc `allowFrom` đã cấu hình; các phê duyệt ghép nối tin nhắn trực tiếp không mặc nhiên trở thành người nhận Cron/Heartbeat
    - nếu không cấu hình danh sách cho phép, số của chính tài khoản đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép nối các tin nhắn trực tiếp `fromMe` gửi đi (tin nhắn bạn tự gửi từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm và danh sách cho phép">
    Quyền truy cập nhóm có hai lớp:

    1. **Danh sách cho phép thành viên nhóm** (`channels.whatsapp.groups`): nếu bỏ qua `groups`, tất cả nhóm đều đủ điều kiện; nếu có, nó hoạt động như một danh sách cho phép nhóm (`"*"` cho phép tất cả).
    2. **Chính sách người gửi trong nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` bỏ qua danh sách cho phép người gửi, `allowlist` yêu cầu khớp với `groupAllowFrom` (hoặc `*`), còn `disabled` chặn toàn bộ tin nhắn nhóm gửi đến.

    Nếu chưa đặt `groupAllowFrom`, việc kiểm tra người gửi sẽ dùng `allowFrom` làm phương án dự phòng khi trường này có mục nhập. Danh sách cho phép người gửi được đánh giá trước khi kích hoạt bằng lượt đề cập/phản hồi.

    Nếu hoàn toàn không có khối `channels.whatsapp`, khi chạy hệ thống sẽ dùng `groupPolicy: "allowlist"` làm phương án dự phòng (kèm nhật ký cảnh báo), ngay cả khi `channels.defaults.groupPolicy` được đặt thành giá trị khác.

    <Note>
    Cơ chế phân giải tư cách thành viên nhóm có một lớp bảo vệ cho trường hợp chỉ có một tài khoản: nếu chỉ cấu hình một tài khoản WhatsApp và `accounts.<id>.groups` của tài khoản đó là một đối tượng rỗng tường minh (`{}`), giá trị này được coi là "chưa đặt" và sẽ dùng ánh xạ `channels.whatsapp.groups` ở cấp gốc làm phương án dự phòng, thay vì âm thầm chặn mọi nhóm. Khi cấu hình từ 2 tài khoản trở lên, ánh xạ tài khoản rỗng tường minh vẫn giữ nguyên trạng thái rỗng và không dùng phương án dự phòng — nhờ đó một tài khoản có thể chủ ý vô hiệu hóa toàn bộ nhóm mà không ảnh hưởng đến các tài khoản cùng cấp.
    </Note>

  </Tab>

  <Tab title="Lượt đề cập và /activation">
    Theo mặc định, phản hồi trong nhóm yêu cầu có lượt đề cập. Việc phát hiện lượt đề cập bao gồm:

    - lượt đề cập WhatsApp tường minh đến danh tính của bot
    - các mẫu biểu thức chính quy cho lượt đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dùng `messages.groupChat.mentionPatterns` làm phương án dự phòng)
    - bản chép lời ghi chú thoại gửi đến đối với tin nhắn nhóm đã được cho phép
    - phát hiện phản hồi ngầm đến bot (người gửi phản hồi khớp với danh tính bot)

    Bảo mật: trích dẫn/phản hồi chỉ đáp ứng điều kiện lượt đề cập — thao tác này **không** cấp quyền cho người gửi. Với `groupPolicy: "allowlist"`, người gửi không nằm trong danh sách cho phép vẫn bị chặn ngay cả khi phản hồi tin nhắn của một người dùng nằm trong danh sách cho phép.

    Lệnh kích hoạt cấp phiên: `/activation mention` hoặc `/activation always`. Lệnh này cập nhật trạng thái phiên (không phải cấu hình toàn cục) và chỉ chủ sở hữu mới được phép sử dụng.

  </Tab>
</Tabs>

## Liên kết ACP đã cấu hình

WhatsApp hỗ trợ liên kết ACP bền vững thông qua `bindings[]` cấp cao nhất:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

Cuộc trò chuyện trực tiếp khớp với số E.164; nhóm khớp với JID nhóm WhatsApp. Danh sách cho phép nhóm, chính sách người gửi và điều kiện kích hoạt bằng lượt đề cập/lệnh kích hoạt được áp dụng trước khi OpenClaw bảo đảm phiên ACP đã liên kết tồn tại. Một liên kết khớp sẽ sở hữu tuyến đó — nhóm phát sóng không phân phối lượt này đến các phiên WhatsApp thông thường.

## Hành vi với số cá nhân và cuộc trò chuyện với chính mình

Khi số của chính tài khoản đã liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ cho cuộc trò chuyện với chính mình sẽ được kích hoạt: bỏ qua xác nhận đã đọc cho các lượt trò chuyện với chính mình, bỏ qua hành vi tự động kích hoạt bằng JID được đề cập vốn sẽ thông báo đến chính bạn, và mặc định thêm tiền tố `[{identity.name}]` (hoặc `[openclaw]`) vào phản hồi khi chưa đặt `messages.responsePrefix`.

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Phong bì đầu vào và ngữ cảnh phản hồi">
    Tin nhắn đến được bao bọc trong phong bì đầu vào dùng chung. Một phản hồi có trích dẫn sẽ nối thêm ngữ cảnh theo dạng sau:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Siêu dữ liệu phản hồi (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi) được điền khi có sẵn. Nếu đích được trích dẫn là phương tiện có thể tải xuống, OpenClaw lưu phương tiện đó thông qua kho phương tiện đầu vào thông thường và cung cấp `MediaPath`/`MediaType` để tác nhân có thể kiểm tra trực tiếp thay vì chỉ thấy `<media:image>`.

  </Accordion>

  <Accordion title="Phần giữ chỗ phương tiện và trích xuất vị trí/liên hệ">
    Tin nhắn chỉ chứa phương tiện được chuẩn hóa thành phần giữ chỗ: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Ghi chú thoại nhóm đã được cho phép sẽ được chép lời trước bước kiểm tra lượt đề cập khi nội dung chỉ là `<media:audio>`, do đó việc đọc lượt đề cập bot trong ghi chú thoại có thể kích hoạt phản hồi. Nếu bản chép lời vẫn không đề cập đến bot, nó sẽ được giữ trong lịch sử nhóm đang chờ thay vì phần giữ chỗ thô.

    Nội dung vị trí được hiển thị dưới dạng văn bản tọa độ ngắn gọn. Nhãn/nhận xét vị trí và chi tiết liên hệ/vCard được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy có hàng rào, không phải văn bản lời nhắc nội tuyến.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Các tin nhắn nhóm chưa được xử lý sẽ được lưu vào bộ đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`, dùng `messages.groupChat.historyLimit` làm phương án dự phòng
    - `0` vô hiệu hóa

    Dấu mốc chèn: `[Chat messages since your last reply - for context]` và `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Xác nhận đã đọc">
    Được bật theo mặc định cho các tin nhắn đến đã được chấp nhận. Vô hiệu hóa toàn cục:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Ghi đè theo từng tài khoản: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Các lượt trò chuyện với chính mình bỏ qua xác nhận đã đọc ngay cả khi tính năng này được bật toàn cục.

  </Accordion>
</AccordionGroup>

## Gửi, chia đoạn và phương tiện

<AccordionGroup>
  <Accordion title="Chia đoạn văn bản">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó dùng phương án dự phòng là chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi phương tiện gửi đi">
    - hỗ trợ dữ liệu hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - âm thanh được gửi dưới dạng dữ liệu `audio` của Baileys với `ptt: true`, hiển thị như một ghi chú thoại nhấn-để-nói; `audioAsVoice` được giữ nguyên trong dữ liệu phản hồi để đầu ra ghi chú thoại TTS luôn đi theo luồng này bất kể định dạng nguồn của nhà cung cấp
    - âm thanh Ogg/Opus nguyên bản được gửi dưới dạng `audio/ogg; codecs=opus`; mọi định dạng khác (bao gồm đầu ra MP3/WebM của Microsoft Edge TTS) được chuyển mã bằng `ffmpeg` thành Ogg/Opus đơn kênh 48 kHz trước khi gửi qua PTT
    - `/tts latest` gửi phản hồi mới nhất của trợ lý dưới dạng một ghi chú thoại và ngăn gửi lặp lại cho cùng phản hồi; `/tts chat on|off|default` điều khiển TTS tự động cho cuộc trò chuyện hiện tại
    - `gifPlayback: true` khi gửi video sẽ bật phát GIF động
    - `forceDocument`/`asDocument` định tuyến hình ảnh, GIF và video gửi đi qua dữ liệu tài liệu của Baileys để tránh cơ chế nén phương tiện của WhatsApp, đồng thời giữ nguyên tên tệp và loại MIME đã phân giải
    - chú thích được áp dụng cho mục phương tiện đầu tiên trong phản hồi có nhiều phương tiện, ngoại trừ ghi chú thoại PTT: âm thanh được gửi trước mà không có chú thích, sau đó chú thích được gửi dưới dạng tin nhắn văn bản riêng biệt (các ứng dụng WhatsApp không hiển thị chú thích ghi chú thoại một cách nhất quán)
    - nguồn phương tiện có thể là HTTP(S), `file://` hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước phương tiện và hành vi dự phòng">
    - giới hạn lưu đầu vào và giới hạn gửi đầu ra: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo từng tài khoản: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - hình ảnh tự động được tối ưu hóa (thay đổi kích thước/quét chất lượng) để vừa với giới hạn, trừ khi `forceDocument`/`asDocument` yêu cầu gửi dưới dạng tài liệu
    - khi gửi phương tiện thất bại, phương án dự phòng cho mục đầu tiên sẽ gửi cảnh báo bằng văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn khi phản hồi

`channels.whatsapp.replyToMode` điều khiển việc trích dẫn phản hồi nguyên bản (phản hồi gửi đi hiển thị phần trích dẫn tin nhắn đến):

| Giá trị           | Hành vi                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `"off"` (mặc định) | Không bao giờ trích dẫn; gửi dưới dạng tin nhắn thuần túy              |
| `"first"`         | Chỉ trích dẫn đoạn phản hồi gửi đi đầu tiên                            |
| `"all"`           | Trích dẫn mọi đoạn phản hồi gửi đi                                     |
| `"batched"`       | Trích dẫn các phản hồi theo lô trong hàng đợi; không trích dẫn phản hồi tức thì |

Ghi đè theo từng tài khoản: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Mức độ phản ứng

`channels.whatsapp.reactionLevel` kiểm soát phạm vi tác nhân sử dụng phản ứng biểu tượng cảm xúc:

| Mức độ                | Phản ứng xác nhận | Phản ứng do tác nhân khởi tạo         |
| --------------------- | ----------------- | ------------------------------------- |
| `"off"`               | Không             | Không                                 |
| `"ack"`               | Có                | Không                                 |
| `"minimal"` (mặc định) | Có                | Có, theo hướng dẫn thận trọng         |
| `"extensive"`         | Có                | Có, theo hướng dẫn khuyến khích       |

Ghi đè theo từng tài khoản: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Phản ứng xác nhận

`channels.whatsapp.ackReaction` gửi phản ứng ngay khi nhận được tin nhắn đến, chịu sự kiểm soát của `reactionLevel` (bị chặn khi là `"off"`):

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Lưu ý: được gửi ngay sau khi tin nhắn đến được chấp nhận (trước phản hồi); nếu có `ackReaction` nhưng không có `emoji`, WhatsApp sẽ sử dụng biểu tượng cảm xúc nhận diện của tác nhân được định tuyến và dùng "👀" làm phương án dự phòng (bỏ qua `ackReaction` hoặc đặt `emoji: ""` để không xác nhận); lỗi được ghi nhật ký nhưng không chặn việc gửi phản hồi; chế độ nhóm `mentions` chỉ phản ứng với các lượt được kích hoạt bằng lượt đề cập, trong khi kích hoạt nhóm `always` bỏ qua bước kiểm tra đó; WhatsApp chỉ sử dụng `channels.whatsapp.ackReaction` (`messages.ackReaction` cũ không áp dụng tại đây).

## Phản ứng trạng thái vòng đời

Đặt `messages.statusReactions.enabled: true` để WhatsApp thay thế phản ứng xác nhận trong suốt một lượt thay vì giữ nguyên một biểu tượng cảm xúc biên nhận tĩnh, luân chuyển qua các trạng thái như đang xếp hàng, đang suy nghĩ, hoạt động công cụ, Compaction, hoàn tất và lỗi:

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Lưu ý: `channels.whatsapp.ackReaction` vẫn kiểm soát điều kiện áp dụng cho tin nhắn trực tiếp và nhóm; trạng thái đang xếp hàng sử dụng cùng biểu tượng cảm xúc có hiệu lực như phản ứng xác nhận thông thường; WhatsApp có một vị trí phản ứng của bot cho mỗi tin nhắn, vì vậy các cập nhật vòng đời sẽ thay thế phản ứng hiện tại ngay tại chỗ; `messages.removeAckAfterReply: true` xóa phản ứng trạng thái cuối cùng sau khoảng giữ hoàn tất/lỗi đã cấu hình; các danh mục biểu tượng cảm xúc của công cụ bao gồm `tool`, `coding`, `web`, `deploy`, `build` và `concierge`.

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Lựa chọn tài khoản và giá trị mặc định">
    Mã định danh tài khoản đến từ `channels.whatsapp.accounts`. Việc chọn tài khoản mặc định sử dụng `default` nếu có; nếu không, sử dụng mã định danh tài khoản được cấu hình đầu tiên (sắp xếp theo thứ tự bảng chữ cái). Mã định danh tài khoản được chuẩn hóa nội bộ để tra cứu.
  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và khả năng tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (bản sao lưu: `creds.json.bak`)
    - thông tin xác thực mặc định kiểu cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp của tài khoản đó. Khi có thể kết nối tới Gateway, thao tác đăng xuất trước tiên sẽ dừng trình lắng nghe đang hoạt động của tài khoản đó, nhờ vậy phiên đã liên kết ngừng nhận tin nhắn trước lần khởi động lại tiếp theo. `openclaw channels remove --channel whatsapp` cũng dừng trình lắng nghe đang hoạt động trước khi vô hiệu hóa hoặc xóa cấu hình tài khoản.

    Trong các thư mục xác thực kiểu cũ, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và thao tác ghi cấu hình

- Công cụ của tác tử hỗ trợ hành động bày tỏ cảm xúc trên WhatsApp (`react`).
- Cổng kiểm soát hành động: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (các hành động hiện có mặc định là `true`), `channels.whatsapp.actions.calls` (mặc định là `false`, xem MeowCaller ở trên).
- Thao tác ghi cấu hình do kênh khởi tạo được bật theo mặc định; vô hiệu hóa qua `channels.whatsapp.configWrites: false`.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Chưa liên kết (cần mã QR)">
    Triệu chứng: trạng thái kênh báo chưa liên kết.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Đã liên kết nhưng bị ngắt kết nối / vòng lặp kết nối lại">
    Triệu chứng: tài khoản đã liên kết liên tục bị ngắt kết nối hoặc thử kết nối lại.

    Các tài khoản ít hoạt động có thể duy trì kết nối lâu hơn thời gian chờ tin nhắn thông thường; trình giám sát chỉ khởi động lại khi hoạt động truyền tải của WhatsApp Web dừng, socket đóng hoặc hoạt động ở cấp ứng dụng không có tín hiệu trong khoảng thời gian an toàn dài hơn (xem Mô hình thời gian chạy ở trên).

    Nếu nhật ký liên tục hiển thị `status=408 Request Time-out Connection was lost`, hãy điều chỉnh thời gian socket của Baileys trong `web.whatsapp`. Trước tiên, hãy giảm `keepAliveIntervalMs` xuống dưới thời gian chờ khi không hoạt động của mạng và tăng `connectTimeoutMs` trên các kết nối chậm hoặc hay mất gói:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Cách khắc phục:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Nếu vòng lặp vẫn tiếp diễn sau khi đã khắc phục kết nối của máy chủ và cấu hình thời gian, hãy sao lưu thư mục xác thực của tài khoản rồi liên kết lại:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Nếu `~/.openclaw/logs/whatsapp-health.log` báo `Gateway inactive` nhưng cả `openclaw gateway status` và `openclaw channels status --probe` đều cho thấy trạng thái bình thường, hãy chạy `openclaw doctor`. Trên Linux, doctor cảnh báo về các mục crontab kiểu cũ gọi tập lệnh `~/.openclaw/bin/ensure-whatsapp.sh` đã ngừng sử dụng; hãy xóa các mục đó bằng `crontab -e` — Cron có thể không có môi trường bus người dùng của systemd, khiến tập lệnh cũ đó báo sai tình trạng của Gateway.

  </Accordion>

  <Accordion title="Đăng nhập bằng mã QR hết thời gian chờ khi qua proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR có thể sử dụng, kèm theo `status=408 Request Time-out` hoặc socket TLS bị ngắt kết nối.

    Đăng nhập WhatsApp Web sử dụng môi trường proxy tiêu chuẩn của máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến thể viết thường, `NO_PROXY`). Hãy xác minh rằng tiến trình Gateway kế thừa các biến môi trường proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có trình lắng nghe đang hoạt động khi gửi">
    Thao tác gửi đi thất bại ngay lập tức khi không có trình lắng nghe Gateway đang hoạt động cho tài khoản đích. Hãy xác nhận Gateway đang chạy và tài khoản đã được liên kết.
  </Accordion>

  <Accordion title="Phản hồi xuất hiện trong bản ghi nhưng không có trên WhatsApp">
    Các hàng trong bản ghi lưu lại nội dung do tác tử tạo ra; việc phân phối qua WhatsApp được kiểm tra riêng. OpenClaw chỉ coi một phản hồi tự động là đã gửi sau khi Baileys trả về mã định danh tin nhắn gửi đi cho ít nhất một lần gửi văn bản hoặc nội dung đa phương tiện hiển thị được.

    Phản ứng xác nhận là biên nhận độc lập trước phản hồi — một phản ứng thành công không chứng minh rằng phản hồi văn bản/nội dung đa phương tiện sau đó đã được chấp nhận. Hãy kiểm tra nhật ký Gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Hãy kiểm tra theo thứ tự sau: `groupPolicy`, `groupAllowFrom`/`allowFrom`, các mục trong danh sách cho phép `groups`, cổng kiểm soát lượt đề cập (`requireMention` + mẫu đề cập) và các khóa trùng lặp trong `openclaw.json` (các mục xuất hiện sau trong JSON5 sẽ ghi đè các mục trước — chỉ giữ một `groupPolicy` cho mỗi phạm vi).

    Nếu có `channels.whatsapp.groups`, WhatsApp vẫn có thể quan sát tin nhắn từ các nhóm khác, nhưng OpenClaw sẽ loại bỏ chúng trước khi định tuyến phiên. Hãy thêm JID của nhóm vào `channels.whatsapp.groups` hoặc thêm `groups["*"]` để chấp nhận tất cả các nhóm trong khi vẫn duy trì việc ủy quyền người gửi thông qua `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Cảnh báo thời gian chạy Bun">
    Thời gian chạy Gateway của WhatsApp nên sử dụng Node. Bun được đánh dấu là không tương thích với hoạt động ổn định của Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Lời nhắc hệ thống

WhatsApp hỗ trợ lời nhắc hệ thống kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp thông qua các ánh xạ `groups` và `direct`.

Cách phân giải cho tin nhắn nhóm: trước tiên xác định ánh xạ `groups` có hiệu lực — nếu tài khoản tự định nghĩa khóa `groups`, khóa này sẽ thay thế hoàn toàn ánh xạ `groups` gốc (không hợp nhất sâu). Sau đó, việc tra cứu lời nhắc được thực hiện trên duy nhất ánh xạ kết quả đó:

1. **Lời nhắc dành riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được sử dụng khi mục nhập nhóm tồn tại **và** khóa `systemPrompt` của mục đó được định nghĩa. Chuỗi rỗng (`""`) sẽ chặn ký tự đại diện và không áp dụng lời nhắc nào.
2. **Lời nhắc ký tự đại diện cho nhóm** (`groups["*"].systemPrompt`): được sử dụng khi không có mục nhập dành riêng cho nhóm hoặc mục đó tồn tại nhưng không có khóa `systemPrompt`.

Cách phân giải cho tin nhắn trực tiếp tuân theo mẫu hoàn toàn tương tự với ánh xạ `direct` và `direct["*"]`.

<Note>
`dms` vẫn là vùng ghi đè lịch sử gọn nhẹ cho từng tin nhắn trực tiếp (`dms.<id>.historyLimit`). Các ghi đè lời nhắc nằm trong `direct`.
</Note>

<Note>
Hành vi tài khoản thay thế cấu hình gốc khi phân giải lời nhắc là một phép ghi đè nông đơn giản: bất kỳ khóa `groups`/`direct` nào của tài khoản, kể cả một đối tượng rỗng được khai báo rõ ràng, đều thay thế ánh xạ gốc. Hành vi này khác với việc kiểm tra danh sách cho phép tư cách thành viên nhóm được mô tả ở trên, vốn có một cơ chế bảo vệ cho cấu hình một tài khoản khi vô tình đặt `groups: {}`.
</Note>

**Khác biệt so với Telegram:** Telegram chặn `groups` gốc cho mọi tài khoản trong thiết lập nhiều tài khoản (kể cả các tài khoản không có `groups` riêng) để ngăn bot nhận tin nhắn nhóm từ những nhóm mà bot không tham gia. WhatsApp không áp dụng cơ chế bảo vệ đó — `groups`/`direct` gốc được mọi tài khoản không có ghi đè riêng kế thừa, bất kể số lượng tài khoản. Trong thiết lập WhatsApp nhiều tài khoản, hãy định nghĩa rõ ràng ánh xạ đầy đủ trong từng tài khoản nếu bạn muốn có lời nhắc riêng cho từng tài khoản.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là ánh xạ cấu hình cho từng nhóm, vừa là danh sách cho phép nhóm ở cấp cuộc trò chuyện. Ở phạm vi gốc hoặc phạm vi tài khoản, `groups["*"]` có nghĩa là "tất cả các nhóm đều được chấp nhận" trong phạm vi đó.
- Chỉ thêm `systemPrompt` dạng ký tự đại diện khi bạn thực sự muốn phạm vi đó chấp nhận tất cả các nhóm. Để chỉ cho phép một tập hợp ID nhóm cố định, hãy lặp lại lời nhắc trên từng mục được cho phép rõ ràng thay vì sử dụng `groups["*"]`.
- Việc chấp nhận nhóm và ủy quyền người gửi là hai bước kiểm tra riêng biệt. `groups["*"]` mở rộng những nhóm được chuyển tới quy trình xử lý nhóm; nó không ủy quyền cho mọi người gửi trong các nhóm đó — việc này vẫn do `groupPolicy`/`groupAllowFrom` kiểm soát.
- `channels.whatsapp.direct` không có tác dụng phụ tương đương đối với tin nhắn trực tiếp: `direct["*"]` chỉ cung cấp cấu hình mặc định sau khi một tin nhắn trực tiếp đã được `dmPolicy` cùng với `allowFrom` hoặc các quy tắc của kho ghép đôi chấp nhận.

Ví dụ:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - WhatsApp](/vi/gateway/config-channels#whatsapp)

| Khu vực             | Trường                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Truy cập           | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Phân phối         | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Nhiều tài khoản    | `accounts.<id>.enabled`, `accounts.<id>.authDir` và các ghi đè khác theo tài khoản                              |
| Vận hành       | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Hành vi phiên | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Lời nhắc          | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Liên quan

- [Ghép đôi](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Bảo mật](/vi/gateway/security)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Định tuyến nhiều tác tử](/vi/concepts/multi-agent)
- [Khắc phục sự cố](/vi/channels/troubleshooting)
