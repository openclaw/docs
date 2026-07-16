---
read_when:
    - Xử lý hành vi của kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi gửi tin và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T14:06:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho môi trường production qua WhatsApp Web (Baileys). Gateway sở hữu (các) phiên đã liên kết; không có kênh Twilio WhatsApp riêng biệt.

## Cài đặt

`openclaw onboard` và `openclaw channels add --channel whatsapp` nhắc cài đặt plugin trong lần đầu bạn chọn; `openclaw channels login --channel whatsapp` cung cấp cùng quy trình cài đặt nếu thiếu plugin. Các bản checkout dành cho phát triển sử dụng đường dẫn plugin cục bộ; bản cài đặt stable/beta trước tiên cài `@openclaw/whatsapp` từ ClawHub, rồi chuyển sang npm nếu không thành công. Runtime WhatsApp được phân phối bên ngoài gói npm OpenClaw lõi, vì vậy các phần phụ thuộc runtime của nó được giữ cùng plugin bên ngoài. Cài đặt thủ công:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Chỉ sử dụng gói npm thuần (`@openclaw/whatsapp`) cho phương án dự phòng qua registry; chỉ ghim một phiên bản chính xác khi cần bản cài đặt có thể tái lập.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép nối đối với người gửi không xác định.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Các quy trình chẩn đoán và sửa chữa trên nhiều kênh.
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

  <Step title="Liên kết WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Đăng nhập chỉ hỗ trợ QR. Trên máy chủ từ xa hoặc không có giao diện, hãy chuẩn bị một phương thức đáng tin cậy để chuyển mã QR đang hoạt động đến điện thoại trước khi bắt đầu đăng nhập; mã QR hiển thị trong terminal, ảnh chụp màn hình hoặc tệp đính kèm trong cuộc trò chuyện có thể hết hạn trong quá trình truyền.

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

    Yêu cầu ghép nối hết hạn sau 1 giờ; số yêu cầu đang chờ được giới hạn ở 3 cho mỗi tài khoản.

  </Step>
</Steps>

<Note>
Nên sử dụng một số WhatsApp riêng biệt (quy trình thiết lập và siêu dữ liệu được tối ưu hóa cho cách này), nhưng các thiết lập dùng số cá nhân/tự trò chuyện vẫn được hỗ trợ đầy đủ.
</Note>

## Mô hình triển khai

<AccordionGroup>
  <Accordion title="Số chuyên dụng (khuyến nghị)">
    - danh tính WhatsApp riêng biệt cho OpenClaw
    - danh sách cho phép DM và ranh giới định tuyến rõ ràng hơn
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
    Quy trình làm quen hỗ trợ chế độ số cá nhân và ghi cấu hình cơ sở phù hợp với tự trò chuyện: `dmPolicy: "allowlist"`, `allowFrom` bao gồm số của chính bạn, `selfChatMode: true`. Các biện pháp bảo vệ tự trò chuyện trong runtime dựa trên số của chính tài khoản đã liên kết cùng với `allowFrom`.
  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway sở hữu socket WhatsApp và vòng lặp kết nối lại.
- Một watchdog theo dõi độc lập hai tín hiệu: hoạt động truyền tải WhatsApp Web thô và hoạt động tin nhắn ứng dụng. Một phiên yên lặng nhưng vẫn kết nối sẽ không bị khởi động lại chỉ vì gần đây không có tin nhắn nào đến; phiên chỉ buộc kết nối lại khi các khung truyền tải ngừng đến trong một khoảng thời gian nội bộ cố định (người dùng không thể cấu hình) hoặc tin nhắn ứng dụng im lặng quá 4x thời gian chờ tin nhắn thông thường. Ngay sau khi kết nối lại một phiên vừa hoạt động gần đây, khoảng thời gian đầu tiên đó sử dụng thời gian chờ tin nhắn thông thường ngắn hơn thay vì khoảng 4x. OpenClaw có thể tự động trả lời các tin nhắn ngoại tuyến mà Baileys chuyển đến sớm trong lần kết nối lại đó, trong giới hạn thời gian tồn tại chống trùng lặp ID tin nhắn đến; lần khởi động ban đầu vẫn duy trì cơ chế bảo vệ ngắn đối với lịch sử cũ.
- Thời gian socket Baileys được xác định rõ trong `web.whatsapp.*`: `keepAliveIntervalMs` (khoảng thời gian ping ứng dụng), `connectTimeoutMs` (thời gian chờ bắt tay khi mở), `defaultQueryTimeoutMs` (thời gian chờ truy vấn Baileys, cùng thời gian chờ gửi/trạng thái hiện diện đi và biên nhận đã đọc đến của OpenClaw).
- Việc gửi đi yêu cầu một trình lắng nghe WhatsApp đang hoạt động cho tài khoản đích; nếu không, thao tác gửi sẽ thất bại ngay lập tức.
- Tin nhắn gửi đến nhóm sẽ đính kèm siêu dữ liệu đề cập nguyên bản cho các token `@+<digits>` và `@<digits>` (trong văn bản và chú thích phương tiện) khi token khớp với siêu dữ liệu người tham gia hiện tại, bao gồm cả các nhóm dựa trên LID.
- Các cuộc trò chuyện trạng thái và phát sóng (`@status`, `@broadcast`) bị bỏ qua.
- Các cuộc trò chuyện trực tiếp sử dụng quy tắc phiên DM (`session.dmScope`; mặc định `main` gộp các DM vào phiên chính của tác tử). Các phiên nhóm được tách biệt theo từng JID (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters có thể là đích gửi đi tường minh thông qua JID `@newsletter` nguyên bản của chúng, sử dụng siêu dữ liệu phiên kênh (`agent:<agentId>:whatsapp:channel:<jid>`) thay vì ngữ nghĩa DM.
- Giao thức truyền tải WhatsApp Web tuân theo các biến môi trường proxy tiêu chuẩn trên máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, cùng các biến thể chữ thường). Ưu tiên cấu hình proxy ở cấp máy chủ hơn cài đặt theo từng kênh.
- Khi bật `messages.removeAckAfterReply`, OpenClaw xóa phản ứng xác nhận sau khi chuyển thành công một câu trả lời hiển thị được.

## Gọi người yêu cầu hiện tại bằng MeowCaller (thử nghiệm)

Plugin có thể cung cấp `whatsapp_call` trong các lượt tác tử bắt nguồn từ WhatsApp. Plugin sử dụng [MeowCaller](https://github.com/purpshell/meowcaller) để thực hiện cuộc gọi thoại WhatsApp đến người yêu cầu được ủy quyền hiện tại và phát tin nhắn TTS của OpenClaw sau khi họ trả lời. Công cụ không có tham số số đích, vì vậy prompt không thể chuyển hướng cuộc gọi. Mặc định bị tắt.

<Warning>
MeowCaller đang ở giai đoạn thử nghiệm, không có bản phát hành được gắn thẻ và sử dụng một phiên thiết bị liên kết whatsmeow được ghép nối riêng — nó không thể tái sử dụng thông tin xác thực Baileys của plugin. Việc ghép nối sẽ thêm một thiết bị liên kết khác vào cùng tài khoản WhatsApp; hãy quét bằng danh tính mà OpenClaw sử dụng. Chế độ số cá nhân/tự trò chuyện không thể tự gọi chính nó; hãy sử dụng một số OpenClaw chuyên dụng để gọi số cá nhân của bạn.
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

    Khi không có hoặc là `false`, OpenClaw không cung cấp công cụ `whatsapp_call`.

  </Step>

  <Step title="Cài đặt MeowCaller CLI đã được đánh giá">

    Bộ điều hợp yêu cầu một tệp thực thi `meowcaller` trong `PATH` của máy chủ Gateway. Cho đến khi [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) được hợp nhất, hãy build nhánh đã được đánh giá:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Đảm bảo `$HOME/.local/bin` nằm trong `PATH` của dịch vụ Gateway. Bản sửa đổi này có các lệnh `pair` tường minh và `notify` chỉ gửi; `notify` không mở micrô, loa, thiết bị video hay chức năng thu thập chẩn đoán nào. Không thay thế bằng lệnh `play` của CLI mẫu thượng nguồn.

  </Step>

  <Step title="Ghép nối thiết bị liên kết MeowCaller">

    Yêu cầu tác tử WhatsApp kiểm tra thiết lập cuộc gọi (hành động trạng thái `whatsapp_call` báo cáo thư mục trạng thái dành riêng cho tài khoản và lệnh ghép nối). Đối với tài khoản mặc định:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Chạy lệnh này ở chế độ tương tác, quét mã QR từ **WhatsApp > Linked devices** và chờ `MeowCaller linked device ready`. Giữ kín `wa-voip.db` — đây là phiên MeowCaller. Các tài khoản không mặc định nhận đường dẫn kho lưu trữ riêng từ hành động trạng thái; trên Windows, hãy chạy lệnh PowerShell tương ứng.

  </Step>

  <Step title="Cấu hình TTS và gọi từ WhatsApp">

    Cấu hình một [nhà cung cấp TTS](/vi/tools/tts) hỗ trợ điện thoại, khởi động lại Gateway, sau đó gửi một yêu cầu chẳng hạn như `Call me and say the build finished.` Công cụ phân giải người gửi từ ngữ cảnh đầu vào đáng tin cậy, tổng hợp một tệp WAV tạm thời và riêng tư, chạy MeowCaller trong một khoảng thời gian gọi có giới hạn, rồi xóa tệp âm thanh sau đó. OpenClaw truyền tường minh kho lưu trữ của tài khoản, chờ trạng thái thoát bằng không sau khi trả lời/phát/gác máy và coi trường hợp hết thời gian chờ hoặc thoát với mã khác không là một lệnh gọi công cụ thất bại.

  </Step>
</Steps>

Giới hạn: chỉ hỗ trợ cuộc gọi âm thanh đi một-một, không cho phép số đích tùy ý, không chia sẻ xác thực với kết nối trò chuyện, không thể tự gọi từ chế độ số cá nhân/tự trò chuyện, âm thanh tổng hợp được giới hạn ở 60 giây, không có biên nhận về khả năng nghe được ở phía thiết bị cầm tay ngoài việc MeowCaller hoàn tất trả lời/phát/gác máy, và OpenClaw dừng tiến trình đồng hành sau khoảng thời gian giới hạn 115-175 giây (bao gồm các giai đoạn kết nối, trả lời, phát và tắt của MeowCaller).

## Lời nhắc phê duyệt

WhatsApp có thể hiển thị lời nhắc phê duyệt thực thi và plugin dưới dạng phản ứng `👍`/`👎`, được kiểm soát bởi cấu hình chuyển tiếp phê duyệt cấp cao nhất:

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

`approvals.exec` và `approvals.plugin` hoạt động độc lập; việc bật WhatsApp làm kênh chỉ liên kết giao thức truyền tải và không gửi gì trừ khi nhóm phê duyệt tương ứng được bật và định tuyến đến đó. Chế độ phiên chỉ chuyển các phê duyệt bằng emoji nguyên bản cho những yêu cầu phê duyệt bắt nguồn từ WhatsApp. Chế độ đích sử dụng quy trình chuyển tiếp dùng chung cho các đích tường minh và không tạo cơ chế phân phối DM riêng đến nhiều người phê duyệt.

Phản ứng phê duyệt WhatsApp yêu cầu chỉ định rõ người phê duyệt trong `allowFrom` (hoặc `"*"`). `defaultTo` đặt các đích tin nhắn mặc định thông thường, không phải danh sách người phê duyệt. Các lệnh `/approve` thủ công vẫn phải đi qua quy trình ủy quyền người gửi WhatsApp thông thường trước khi phân giải phê duyệt.

## Hook plugin và quyền riêng tư

Tin nhắn WhatsApp đến có thể chứa nội dung cá nhân, số điện thoại, mã định danh nhóm, tên người gửi và các trường tương quan phiên. WhatsApp không phát rộng payload hook `message_received` đến các plugin trừ khi bạn chủ động bật:

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

Giới hạn việc bật này cho một tài khoản trong `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Chỉ bật tính năng này cho các plugin mà bạn tin tưởng giao nội dung và mã định danh WhatsApp đến.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy`:

    | Giá trị | Hành vi |
    | --- | --- |
    | `pairing` (mặc định) | Người gửi không xác định yêu cầu ghép nối; chủ sở hữu phê duyệt |
    | `allowlist` | Chỉ chấp nhận người gửi `allowFrom` |
    | `open` | Yêu cầu `allowFrom` chứa `"*"` |
    | `disabled` | Chặn tất cả DM |

    `allowFrom` chấp nhận các số theo định dạng E.164 (được chuẩn hóa nội bộ). Đây chỉ là danh sách kiểm soát truy cập người gửi DM — nó không kiểm soát các lần gửi đi tường minh đến JID nhóm hoặc JID kênh `@newsletter`.

    Ghi đè cho nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `.allowFrom`) được ưu tiên hơn các giá trị mặc định cấp kênh cho tài khoản đó.

    Ghi chú về runtime:

    - các ghép nối được lưu bền vững trong kho cho phép của kênh và hợp nhất với `allowFrom` đã cấu hình
    - tự động hóa theo lịch và cơ chế dự phòng người nhận Heartbeat sử dụng các đích phân phối tường minh hoặc `allowFrom` đã cấu hình; các phê duyệt ghép nối DM không ngầm trở thành người nhận cron/Heartbeat
    - nếu không cấu hình danh sách cho phép, số tự thân đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép nối các DM `fromMe` gửi đi (tin nhắn bạn tự gửi cho mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm và danh sách cho phép">
    Quyền truy cập nhóm có hai lớp:

    1. **Danh sách cho phép thành viên nhóm** (`channels.whatsapp.groups`): nếu bỏ qua `groups`, mọi nhóm đều đủ điều kiện; nếu có, giá trị này hoạt động như danh sách cho phép nhóm (`"*"` cho phép tất cả).
    2. **Chính sách người gửi trong nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` bỏ qua danh sách cho phép người gửi, `allowlist` yêu cầu khớp với `groupAllowFrom` (hoặc `*`), `disabled` chặn toàn bộ tin nhắn đến từ nhóm.

    Nếu chưa đặt `groupAllowFrom`, việc kiểm tra người gửi sẽ dự phòng sang `allowFrom` khi mục này có phần tử. Danh sách cho phép người gửi được đánh giá trước khi kích hoạt bằng lượt đề cập/phản hồi.

    Nếu hoàn toàn không có khối `channels.whatsapp`, runtime sẽ dự phòng sang `groupPolicy: "allowlist"` (kèm nhật ký cảnh báo), ngay cả khi `channels.defaults.groupPolicy` được đặt thành giá trị khác.

    <Note>
    Việc phân giải tư cách thành viên nhóm có một lớp bảo vệ cho trường hợp một tài khoản: nếu chỉ cấu hình một tài khoản WhatsApp và `accounts.<id>.groups` của tài khoản đó là một đối tượng rỗng tường minh (`{}`), giá trị này được coi là "chưa đặt" và dự phòng sang ánh xạ `channels.whatsapp.groups` gốc, thay vì âm thầm chặn mọi nhóm. Khi cấu hình từ 2 tài khoản trở lên, ánh xạ tài khoản rỗng tường minh vẫn giữ nguyên trạng thái rỗng và không dự phòng — điều này cho phép một tài khoản chủ ý vô hiệu hóa mọi nhóm mà không ảnh hưởng đến các tài khoản ngang hàng.
    </Note>

  </Tab>

  <Tab title="Lượt đề cập và /activation">
    Theo mặc định, phản hồi trong nhóm yêu cầu một lượt đề cập. Cơ chế phát hiện lượt đề cập bao gồm:

    - lượt đề cập WhatsApp tường minh đến danh tính bot
    - các mẫu biểu thức chính quy cho lượt đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - bản chép lời ghi chú thoại đến cho các tin nhắn nhóm đã được cấp quyền
    - cơ chế ngầm phát hiện phản hồi đến bot (người gửi phản hồi khớp với danh tính bot)

    Bảo mật: trích dẫn/phản hồi chỉ đáp ứng điều kiện lượt đề cập — thao tác này **không** cấp quyền cho người gửi. Với `groupPolicy: "allowlist"`, người gửi không có trong danh sách cho phép vẫn bị chặn ngay cả khi phản hồi tin nhắn của một người dùng có trong danh sách cho phép.

    Lệnh kích hoạt cấp phiên: `/activation mention` hoặc `/activation always`. Lệnh này cập nhật trạng thái phiên (không phải cấu hình toàn cục) và chỉ chủ sở hữu mới được phép thực hiện.

  </Tab>
</Tabs>

## Các liên kết ACP đã cấu hình

WhatsApp hỗ trợ các liên kết ACP bền vững thông qua `bindings[]` cấp cao nhất:

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

Các cuộc trò chuyện trực tiếp khớp với số E.164; các nhóm khớp với JID nhóm WhatsApp. Danh sách cho phép nhóm, chính sách người gửi và điều kiện kích hoạt bằng lượt đề cập/lệnh kích hoạt được áp dụng trước khi OpenClaw bảo đảm phiên ACP được liên kết tồn tại. Một liên kết khớp sẽ sở hữu tuyến — các nhóm phát rộng không phân nhánh lượt đó đến các phiên WhatsApp thông thường.

## Hành vi với số cá nhân và cuộc trò chuyện với chính mình

Khi số tự thân đã liên kết cũng xuất hiện trong `allowFrom`, các biện pháp bảo vệ cho cuộc trò chuyện với chính mình sẽ được kích hoạt: bỏ qua biên nhận đã đọc cho các lượt trò chuyện với chính mình, bỏ qua hành vi tự động kích hoạt bằng JID lượt đề cập vốn sẽ ping chính bạn và mặc định gửi phản hồi đến `[{identity.name}]` (hoặc `[openclaw]`) khi chưa đặt `messages.responsePrefix`.

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Phong bì tin nhắn đến và ngữ cảnh phản hồi">
    Tin nhắn đến được bao bọc trong phong bì tin nhắn đến dùng chung. Một phản hồi có trích dẫn sẽ nối thêm ngữ cảnh theo dạng sau:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Siêu dữ liệu phản hồi (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi) được điền khi có sẵn. Nếu đích được trích dẫn là nội dung đa phương tiện có thể tải xuống, OpenClaw sẽ lưu nội dung đó thông qua kho đa phương tiện đến thông thường và cung cấp `MediaPath`/`MediaType` để tác nhân có thể kiểm tra trực tiếp thay vì chỉ thấy `<media:image>`.

  </Accordion>

  <Accordion title="Phần giữ chỗ đa phương tiện và trích xuất vị trí/liên hệ">
    Các tin nhắn chỉ có nội dung đa phương tiện được chuẩn hóa thành phần giữ chỗ: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Ghi chú thoại nhóm đã được cấp quyền được chép lời trước khi áp dụng điều kiện lượt đề cập nếu phần thân chỉ là `<media:audio>`, vì vậy việc nói lời đề cập đến bot trong ghi chú thoại có thể kích hoạt phản hồi. Nếu bản chép lời vẫn không đề cập đến bot, nội dung này sẽ được giữ trong lịch sử nhóm đang chờ thay vì phần giữ chỗ thô.

    Phần thân vị trí được hiển thị dưới dạng văn bản tọa độ ngắn gọn. Nhãn/nhận xét vị trí và thông tin liên hệ/vCard được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy có hàng rào, không phải văn bản prompt nội tuyến.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Các tin nhắn nhóm chưa được xử lý được lưu vào bộ đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`, dự phòng `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Dấu chèn: `[Chat messages since your last reply - for context]` và `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Được bật theo mặc định cho các tin nhắn đến đã được chấp nhận. Vô hiệu hóa toàn cục:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Ghi đè theo tài khoản: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Các lượt trò chuyện với chính mình bỏ qua biên nhận đã đọc ngay cả khi tính năng này được bật toàn cục.

  </Accordion>
</AccordionGroup>

## Phân phối, chia đoạn và đa phương tiện

<AccordionGroup>
  <Accordion title="Chia đoạn văn bản">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó dự phòng sang cách chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi đa phương tiện gửi đi">
    - hỗ trợ tải trọng hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - âm thanh được gửi dưới dạng tải trọng Baileys `audio` với `ptt: true`, hiển thị dưới dạng ghi chú thoại nhấn để nói; `audioAsVoice` được giữ nguyên trên tải trọng phản hồi để đầu ra ghi chú thoại TTS tiếp tục đi theo đường dẫn này bất kể định dạng nguồn của nhà cung cấp
    - âm thanh Ogg/Opus nguyên bản được gửi dưới dạng `audio/ogg; codecs=opus`; mọi định dạng khác (bao gồm đầu ra MP3/WebM của Microsoft Edge TTS) được chuyển mã bằng `ffmpeg` sang Ogg/Opus đơn âm 48 kHz trước khi phân phối PTT
    - `/tts latest` gửi phản hồi mới nhất của trợ lý dưới dạng một ghi chú thoại và ngăn gửi lặp lại cùng một phản hồi; `/tts chat on|off|default` kiểm soát TTS tự động cho cuộc trò chuyện hiện tại
    - `gifPlayback: true` trên video gửi đi cho phép phát GIF động
    - `forceDocument`/`asDocument` định tuyến hình ảnh, GIF và video gửi đi thông qua tải trọng tài liệu Baileys để tránh cơ chế nén đa phương tiện của WhatsApp, đồng thời giữ nguyên tên tệp và loại MIME đã phân giải
    - chú thích áp dụng cho mục đa phương tiện đầu tiên trong phản hồi có nhiều nội dung đa phương tiện, ngoại trừ ghi chú thoại PTT: âm thanh được gửi trước mà không có chú thích, sau đó chú thích được gửi dưới dạng tin nhắn văn bản riêng (các ứng dụng khách WhatsApp không hiển thị chú thích ghi chú thoại một cách nhất quán)
    - nguồn đa phương tiện có thể là HTTP(S), `file://` hoặc đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước đa phương tiện và hành vi dự phòng">
    - giới hạn lưu nội dung đến và giới hạn gửi nội dung đi: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo tài khoản: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (thay đổi kích thước/quét chất lượng) để phù hợp với giới hạn, trừ khi `forceDocument`/`asDocument` yêu cầu phân phối dưới dạng tài liệu
    - khi gửi đa phương tiện thất bại, cơ chế dự phòng cho mục đầu tiên sẽ gửi cảnh báo bằng văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn phản hồi

`channels.whatsapp.replyToMode` kiểm soát việc trích dẫn phản hồi nguyên bản (phản hồi gửi đi hiển thị trích dẫn tin nhắn đến):

| Giá trị             | Hành vi                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (mặc định) | Không bao giờ trích dẫn; gửi dưới dạng tin nhắn thuần túy                           |
| `"first"`         | Chỉ trích dẫn đoạn phản hồi gửi đi đầu tiên                      |
| `"all"`           | Trích dẫn mọi đoạn phản hồi gửi đi                               |
| `"batched"`       | Trích dẫn các phản hồi theo lô trong hàng đợi; không trích dẫn các phản hồi tức thời |

Ghi đè theo tài khoản: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Mức độ phản ứng

`channels.whatsapp.reactionLevel` kiểm soát phạm vi tác nhân sử dụng phản ứng emoji:

| Mức độ                 | Phản ứng xác nhận | Phản ứng do tác nhân khởi tạo  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | Không            | Không                         |
| `"ack"`               | Có           | Không                         |
| `"minimal"` (mặc định) | Có           | Có, hướng dẫn thận trọng |
| `"extensive"`         | Có           | Có, hướng dẫn khuyến khích   |

Ghi đè theo tài khoản: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Phản ứng xác nhận

`channels.whatsapp.ackReaction` gửi một phản ứng ngay lập tức khi nhận tin nhắn đến, chịu sự kiểm soát của `reactionLevel` (bị chặn khi `"off"`):

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

Lưu ý: được gửi ngay sau khi tin nhắn đến được chấp nhận (trước phản hồi); nếu có `ackReaction` nhưng không có `emoji`, WhatsApp sử dụng emoji danh tính của tác nhân được định tuyến và dự phòng thành "👀" (bỏ qua `ackReaction` hoặc đặt `emoji: ""` để không xác nhận); lỗi được ghi nhật ký nhưng không chặn việc phân phối phản hồi; chế độ nhóm `mentions` chỉ phản ứng với các lượt được kích hoạt bằng lượt đề cập, trong khi kích hoạt nhóm `always` bỏ qua bước kiểm tra đó; WhatsApp chỉ sử dụng `channels.whatsapp.ackReaction` (`messages.ackReaction` cũ không áp dụng tại đây).

## Phản ứng trạng thái vòng đời

Đặt `messages.statusReactions.enabled: true` để WhatsApp thay thế phản ứng xác nhận trong một lượt thay vì giữ lại emoji biên nhận tĩnh, luân chuyển qua các trạng thái như đang xếp hàng, đang suy nghĩ, hoạt động công cụ, Compaction, hoàn tất và lỗi:

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

Lưu ý: `channels.whatsapp.ackReaction` vẫn kiểm soát điều kiện áp dụng cho tin nhắn trực tiếp và nhóm; trạng thái đang xếp hàng sử dụng cùng emoji hiệu lực như phản ứng xác nhận thuần túy; WhatsApp có một vị trí phản ứng bot cho mỗi tin nhắn, vì vậy các cập nhật vòng đời thay thế phản ứng hiện tại ngay tại chỗ; `messages.removeAckAfterReply: true` xóa phản ứng trạng thái cuối cùng sau thời gian giữ hoàn tất/lỗi đã cấu hình; các danh mục emoji công cụ bao gồm `tool`, `coding`, `web`, `deploy`, `build` và `concierge`.

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Lựa chọn tài khoản và giá trị mặc định">
    ID tài khoản được lấy từ `channels.whatsapp.accounts`. Tài khoản mặc định được chọn là `default` nếu có; nếu không, ID tài khoản được cấu hình đầu tiên (sắp xếp theo thứ tự bảng chữ cái) sẽ được chọn. ID tài khoản được chuẩn hóa nội bộ để tra cứu.
  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và khả năng tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (bản sao lưu: `creds.json.bak`)
    - xác thực mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp của tài khoản đó. Khi có thể kết nối với Gateway, thao tác đăng xuất trước tiên sẽ dừng trình lắng nghe đang hoạt động của tài khoản đó, để phiên đã liên kết ngừng nhận tin nhắn trước lần khởi động lại tiếp theo. `openclaw channels remove --channel whatsapp` cũng dừng trình lắng nghe đang hoạt động trước khi vô hiệu hóa hoặc xóa cấu hình tài khoản.

    Trong các thư mục xác thực cũ, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và thao tác ghi cấu hình

- Công cụ của tác nhân hỗ trợ hành động phản ứng trên WhatsApp (`react`).
- Các cổng kiểm soát hành động: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (các hành động hiện có mặc định là `true`), `channels.whatsapp.actions.calls` (mặc định `false`, xem MeowCaller ở trên).
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

    Các tài khoản ít hoạt động có thể duy trì kết nối quá thời gian chờ tin nhắn thông thường; trình giám sát chỉ khởi động lại khi hoạt động truyền tải của WhatsApp Web dừng, socket đóng hoặc hoạt động ở cấp ứng dụng không xuất hiện trong khoảng thời gian dài hơn của cửa sổ an toàn (xem Mô hình thời gian chạy ở trên).

    Nếu nhật ký liên tục hiển thị `status=408 Request Time-out Connection was lost`, hãy điều chỉnh thời gian socket của Baileys trong `web.whatsapp`. Trước tiên, hãy giảm `keepAliveIntervalMs` xuống thấp hơn thời gian chờ khi không hoạt động của mạng và tăng `connectTimeoutMs` trên các kết nối chậm hoặc mất gói:

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

    Nếu vòng lặp vẫn tiếp diễn sau khi đã khắc phục kết nối máy chủ và thông số thời gian, hãy sao lưu thư mục xác thực của tài khoản rồi liên kết lại:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Nếu `~/.openclaw/logs/whatsapp-health.log` báo `Gateway inactive` nhưng cả `openclaw gateway status` và `openclaw channels status --probe` đều cho thấy trạng thái bình thường, hãy chạy `openclaw doctor`. Trên Linux, doctor cảnh báo về các mục crontab cũ gọi tập lệnh `~/.openclaw/bin/ensure-whatsapp.sh` đã ngừng sử dụng; hãy xóa các mục đó bằng `crontab -e` — cron có thể thiếu môi trường bus người dùng của systemd, khiến tập lệnh cũ đó báo sai tình trạng của Gateway.

  </Accordion>

  <Accordion title="Đăng nhập bằng mã QR hết thời gian chờ khi qua proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR có thể sử dụng, kèm theo `status=408 Request Time-out` hoặc lỗi ngắt kết nối socket TLS.

    Đăng nhập WhatsApp Web sử dụng môi trường proxy tiêu chuẩn của máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến thể chữ thường, `NO_PROXY`). Hãy xác minh rằng tiến trình Gateway kế thừa môi trường proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có trình lắng nghe đang hoạt động khi gửi">
    Thao tác gửi đi sẽ thất bại ngay khi không có trình lắng nghe Gateway đang hoạt động cho tài khoản đích. Hãy xác nhận Gateway đang chạy và tài khoản đã được liên kết.
  </Accordion>

  <Accordion title="Phản hồi xuất hiện trong bản ghi nhưng không có trên WhatsApp">
    Các hàng trong bản ghi lưu lại nội dung do tác nhân tạo ra; việc gửi qua WhatsApp được kiểm tra riêng. OpenClaw chỉ coi một phản hồi tự động là đã gửi sau khi Baileys trả về ID tin nhắn gửi đi cho ít nhất một lần gửi văn bản hoặc nội dung đa phương tiện hiển thị được.

    Phản ứng xác nhận là biên nhận độc lập trước phản hồi — phản ứng thành công không chứng minh rằng phản hồi văn bản/nội dung đa phương tiện sau đó đã được chấp nhận. Kiểm tra nhật ký Gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự sau: `groupPolicy`, `groupAllowFrom`/`allowFrom`, các mục trong danh sách cho phép `groups`, kiểm soát lượt đề cập (`requireMention` + các mẫu đề cập) và các khóa trùng lặp trong `openclaw.json` (các mục xuất hiện sau trong JSON5 ghi đè các mục trước — chỉ giữ một `groupPolicy` cho mỗi phạm vi).

    Nếu có `channels.whatsapp.groups`, WhatsApp vẫn có thể quan sát tin nhắn từ các nhóm khác, nhưng OpenClaw loại bỏ chúng trước khi định tuyến phiên. Thêm JID nhóm vào `channels.whatsapp.groups`, hoặc thêm `groups["*"]` để cho phép tất cả các nhóm trong khi vẫn kiểm soát quyền của người gửi bằng `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Cảnh báo thời gian chạy Bun">
    Các Gateway OpenClaw yêu cầu Node. Bun không cung cấp API `node:sqlite` mà kho trạng thái chính tắc sử dụng, và doctor di chuyển các dịch vụ Bun cũ sang Node.
  </Accordion>
</AccordionGroup>

## Lời nhắc hệ thống

WhatsApp hỗ trợ lời nhắc hệ thống kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp thông qua các ánh xạ `groups` và `direct`.

Cách phân giải cho tin nhắn nhóm: trước tiên xác định ánh xạ `groups` có hiệu lực — nếu tài khoản có định nghĩa khóa `groups` riêng, khóa đó sẽ thay thế hoàn toàn ánh xạ `groups` gốc (không hợp nhất sâu). Sau đó, việc tra cứu lời nhắc được thực hiện trên duy nhất ánh xạ kết quả đó:

1. **Lời nhắc dành riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được sử dụng khi mục nhập nhóm tồn tại **và** khóa `systemPrompt` của mục đó được định nghĩa. Chuỗi rỗng (`""`) sẽ chặn ký tự đại diện và không áp dụng lời nhắc nào.
2. **Lời nhắc ký tự đại diện cho nhóm** (`groups["*"].systemPrompt`): được sử dụng khi không có mục nhập cho nhóm cụ thể hoặc mục đó tồn tại nhưng không có khóa `systemPrompt`.

Cách phân giải cho tin nhắn trực tiếp tuân theo mẫu giống hệt với ánh xạ `direct` và `direct["*"]`.

<Note>
`dms` vẫn là vùng ghi đè lịch sử gọn nhẹ cho từng tin nhắn trực tiếp (`dms.<id>.historyLimit`). Các ghi đè lời nhắc nằm trong `direct`.
</Note>

<Note>
Hành vi tài khoản thay thế cấu hình gốc này khi phân giải lời nhắc là một ghi đè nông đơn giản: bất kỳ khóa `groups`/`direct` nào của tài khoản, kể cả một đối tượng rỗng được khai báo rõ ràng, đều thay thế ánh xạ gốc. Hành vi này khác với phép kiểm tra danh sách cho phép thành viên nhóm được mô tả ở trên, vốn có cơ chế an toàn cho một tài khoản duy nhất khi `groups: {}` vô tình bị để trống.
</Note>

**Khác biệt so với Telegram:** Telegram chặn `groups` gốc cho mọi tài khoản trong cấu hình nhiều tài khoản (kể cả những tài khoản không có `groups` riêng) để ngăn bot nhận tin nhắn từ các nhóm mà bot không thuộc về. WhatsApp không áp dụng cơ chế bảo vệ đó — `groups`/`direct` gốc được mọi tài khoản không có ghi đè riêng kế thừa, bất kể số lượng tài khoản. Trong cấu hình WhatsApp nhiều tài khoản, hãy định nghĩa rõ ràng toàn bộ ánh xạ trong từng tài khoản nếu muốn có lời nhắc riêng cho từng tài khoản.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là ánh xạ cấu hình cho từng nhóm vừa là danh sách cho phép nhóm ở cấp cuộc trò chuyện. Ở phạm vi gốc hoặc tài khoản, `groups["*"]` có nghĩa là "cho phép tất cả các nhóm" trong phạm vi đó.
- Chỉ thêm ký tự đại diện `systemPrompt` khi đã muốn phạm vi đó cho phép tất cả các nhóm. Để chỉ cho phép một tập hợp ID nhóm cố định, hãy lặp lại lời nhắc trong từng mục được đưa rõ ràng vào danh sách cho phép thay vì sử dụng `groups["*"]`.
- Việc cho phép nhóm và cấp quyền cho người gửi là hai phép kiểm tra riêng biệt. `groups["*"]` mở rộng những nhóm được chuyển đến xử lý nhóm; nó không cấp quyền cho mọi người gửi trong các nhóm đó — quyền này vẫn do `groupPolicy`/`groupAllowFrom` kiểm soát.
- `channels.whatsapp.direct` không có tác dụng phụ tương đương đối với tin nhắn trực tiếp: `direct["*"]` chỉ cung cấp cấu hình mặc định sau khi tin nhắn trực tiếp đã được cho phép bởi `dmPolicy` cùng với `allowFrom` hoặc các quy tắc của kho ghép nối.

Ví dụ:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Chỉ sử dụng nếu tất cả các nhóm đều nên được cho phép ở phạm vi gốc.
        // Áp dụng cho tất cả tài khoản không định nghĩa ánh xạ groups riêng.
        "*": { systemPrompt: "Lời nhắc mặc định cho tất cả các nhóm." },
      },
      direct: {
        // Áp dụng cho tất cả tài khoản không định nghĩa ánh xạ direct riêng.
        "*": { systemPrompt: "Lời nhắc mặc định cho tất cả các cuộc trò chuyện trực tiếp." },
      },
      accounts: {
        work: {
          groups: {
            // Tài khoản này định nghĩa groups riêng, vì vậy groups gốc được thay thế
            // hoàn toàn. Để giữ ký tự đại diện, cũng định nghĩa rõ ràng "*" tại đây.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Tập trung vào quản lý dự án.",
            },
            // Chỉ sử dụng nếu tất cả các nhóm đều nên được cho phép trong tài khoản này.
            "*": { systemPrompt: "Lời nhắc mặc định cho các nhóm công việc." },
          },
          direct: {
            // Tài khoản này định nghĩa ánh xạ direct riêng, vì vậy các mục direct gốc
            // được thay thế hoàn toàn. Để giữ ký tự đại diện, cũng định nghĩa rõ ràng "*" tại đây.
            "+15551234567": { systemPrompt: "Lời nhắc cho một cuộc trò chuyện trực tiếp công việc cụ thể." },
            "*": { systemPrompt: "Lời nhắc mặc định cho các cuộc trò chuyện trực tiếp công việc." },
          },
        },
      },
    },
  },
}
```

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - WhatsApp](/vi/gateway/config-channels#whatsapp)

| Khu vực          | Trường                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Truy cập         | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Phân phối        | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Nhiều tài khoản  | `accounts.<id>.enabled`, `accounts.<id>.authDir` và các ghi đè khác cho từng tài khoản                              |
| Vận hành         | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Hành vi phiên    | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Lời nhắc         | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Bảo mật](/vi/gateway/security)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Khắc phục sự cố](/vi/channels/troubleshooting)
