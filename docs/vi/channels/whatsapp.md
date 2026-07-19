---
read_when:
    - Xử lý hành vi của kênh WhatsApp/web hoặc định tuyến hộp thư đến
summary: Hỗ trợ kênh WhatsApp, kiểm soát truy cập, hành vi phân phối và vận hành
title: WhatsApp
x-i18n:
    generated_at: "2026-07-19T05:38:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b510a49741f823a05baea28453a2d4a12932a442172ff8323d0835d86da8897
    source_path: channels/whatsapp.md
    workflow: 16
---

Trạng thái: sẵn sàng cho môi trường production qua WhatsApp Web (Baileys). Gateway quản lý (các) phiên đã liên kết; không có kênh WhatsApp Twilio riêng biệt.

## Cài đặt

`openclaw onboard` và `openclaw channels add --channel whatsapp` nhắc cài đặt Plugin khi bạn chọn lần đầu; `openclaw channels login --channel whatsapp` cung cấp cùng luồng cài đặt nếu thiếu Plugin. Các bản checkout phát triển sử dụng đường dẫn Plugin cục bộ; bản cài đặt stable/beta trước tiên cài `@openclaw/whatsapp` từ ClawHub, rồi chuyển sang npm nếu không thành công. Runtime WhatsApp được phân phối bên ngoài gói npm OpenClaw lõi, vì vậy các phụ thuộc runtime của nó được giữ trong Plugin bên ngoài. Cài đặt thủ công:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Chỉ sử dụng gói npm thuần (`@openclaw/whatsapp`) cho phương án dự phòng qua registry; chỉ ghim phiên bản chính xác khi cần bản cài đặt có thể tái lập.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Chính sách DM mặc định là ghép nối đối với người gửi chưa xác định.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Quy trình chẩn đoán và khắc phục trên nhiều kênh.
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

    Chỉ có thể đăng nhập bằng QR. Trên máy chủ từ xa hoặc không có giao diện, hãy bảo đảm có cách đáng tin cậy để chuyển mã QR đang hoạt động đến điện thoại trước khi bắt đầu đăng nhập; mã QR hiển thị trong terminal, ảnh chụp màn hình hoặc tệp đính kèm trong cuộc trò chuyện có thể hết hạn trong quá trình truyền.

    Đối với một tài khoản cụ thể:

```bash
openclaw channels login --channel whatsapp --account work
```

    Để gắn thư mục xác thực hiện có hoặc tùy chỉnh trước khi đăng nhập:

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
Nên sử dụng một số WhatsApp riêng biệt (quy trình thiết lập và siêu dữ liệu được tối ưu hóa cho cách này), nhưng cấu hình dùng số cá nhân/tự trò chuyện vẫn được hỗ trợ đầy đủ.
</Note>

## Mô hình triển khai

<AccordionGroup>
  <Accordion title="Số riêng biệt (khuyến nghị)">
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
    Quy trình tích hợp ban đầu hỗ trợ chế độ số cá nhân và ghi cấu hình cơ sở phù hợp với tự trò chuyện: `dmPolicy: "allowlist"`, `allowFrom` bao gồm số của chính bạn, `selfChatMode: true`. Các biện pháp bảo vệ tự trò chuyện trong runtime dựa trên số của chính tài khoản đã liên kết cùng với `allowFrom`.
  </Accordion>
</AccordionGroup>

## Mô hình runtime

- Gateway quản lý socket WhatsApp và vòng lặp kết nối lại.
- Một watchdog theo dõi độc lập hai tín hiệu: hoạt động truyền tải WhatsApp Web thô và hoạt động tin nhắn ứng dụng. Một phiên yên lặng nhưng vẫn kết nối sẽ không được khởi động lại chỉ vì gần đây không nhận được tin nhắn; phiên chỉ buộc kết nối lại khi các khung truyền tải ngừng đến trong một khoảng thời gian nội bộ cố định (người dùng không thể cấu hình) hoặc tin nhắn ứng dụng không xuất hiện quá 4 lần thời gian chờ tin nhắn thông thường. Ngay sau khi kết nối lại một phiên vừa hoạt động gần đây, khoảng thời gian đầu tiên đó sử dụng thời gian chờ tin nhắn thông thường ngắn hơn thay vì khoảng thời gian gấp 4 lần. OpenClaw có thể tự động trả lời các tin nhắn ngoại tuyến mà Baileys chuyển đến sớm trong quá trình kết nối lại đó, trong giới hạn thời gian tồn tại của cơ chế loại bỏ trùng lặp theo ID tin nhắn đến; lần khởi động ban đầu vẫn giữ biện pháp bảo vệ ngắn đối với lịch sử cũ.
- Thời gian socket Baileys được quy định rõ ràng trong `web.whatsapp.*`: `keepAliveIntervalMs` (khoảng thời gian ping ứng dụng), `connectTimeoutMs` (thời gian chờ bắt tay khi mở), `defaultQueryTimeoutMs` (thời gian chờ truy vấn Baileys, cùng thời gian chờ gửi/trạng thái hiện diện đi và xác nhận đã đọc đến của OpenClaw).
- Hoạt động gửi đi yêu cầu trình lắng nghe WhatsApp đang hoạt động cho tài khoản đích; nếu không, thao tác gửi sẽ thất bại ngay.
- Khi token khớp với siêu dữ liệu người tham gia hiện tại, hoạt động gửi nhóm đính kèm siêu dữ liệu đề cập gốc cho các token `@+<digits>` và `@<digits>` (trong văn bản và chú thích nội dung đa phương tiện), bao gồm cả các nhóm dựa trên LID.
- Các cuộc trò chuyện trạng thái và phát sóng (`@status`, `@broadcast`) bị bỏ qua.
- Cuộc trò chuyện trực tiếp sử dụng quy tắc phiên DM (`session.dmScope`; giá trị mặc định `main` hợp nhất các DM vào phiên chính của tác nhân). Phiên nhóm được cô lập theo từng JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Kênh/Bản tin WhatsApp có thể là đích gửi đi rõ ràng thông qua JID `@newsletter` gốc của chúng, sử dụng siêu dữ liệu phiên kênh (`agent:<agentId>:whatsapp:channel:<jid>`) thay vì ngữ nghĩa DM.
- Phương thức truyền tải WhatsApp Web tuân theo các biến môi trường proxy tiêu chuẩn trên máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, cùng các biến thể viết thường). Ưu tiên cấu hình proxy cấp máy chủ thay vì cài đặt theo từng kênh.
- Khi bật `messages.removeAckAfterReply`, OpenClaw xóa phản ứng xác nhận sau khi gửi thành công một phản hồi hiển thị.

## Gọi người yêu cầu hiện tại bằng MeowCaller (thử nghiệm)

Plugin có thể cung cấp `whatsapp_call` trong các lượt tác nhân bắt nguồn từ WhatsApp. Tính năng này sử dụng [MeowCaller](https://github.com/purpshell/meowcaller) để thực hiện cuộc gọi thoại WhatsApp đến người yêu cầu hiện tại đã được ủy quyền và phát thông điệp TTS của OpenClaw sau khi họ trả lời. Công cụ không có tham số số đích, vì vậy prompt không thể chuyển hướng cuộc gọi. Bị tắt theo mặc định.

<Warning>
MeowCaller đang ở giai đoạn thử nghiệm, không có bản phát hành được gắn thẻ và sử dụng một phiên thiết bị liên kết whatsmeow được ghép nối riêng — không thể tái sử dụng thông tin xác thực Baileys của Plugin. Việc ghép nối sẽ thêm một thiết bị liên kết khác vào cùng tài khoản WhatsApp; hãy quét bằng danh tính mà OpenClaw sử dụng. Chế độ số cá nhân/tự trò chuyện không thể tự gọi chính nó; hãy sử dụng một số OpenClaw riêng biệt để gọi đến số cá nhân của bạn.
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

  <Step title="Cài đặt CLI MeowCaller đã được review">

    Bộ điều hợp yêu cầu tệp thực thi `meowcaller` trong `PATH` của máy chủ Gateway. Cho đến khi [PR MeowCaller số 7](https://github.com/purpshell/meowcaller/pull/7) được hợp nhất, hãy dựng nhánh đã được review:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Bảo đảm `$HOME/.local/bin` nằm trong `PATH` của dịch vụ Gateway. Bản sửa đổi này có các lệnh `pair` rõ ràng và `notify` chỉ gửi; `notify` không mở micrô, loa, thiết bị video hoặc tính năng ghi chẩn đoán. Không thay thế bằng lệnh `play` của CLI mẫu thượng nguồn.

  </Step>

  <Step title="Ghép nối thiết bị liên kết MeowCaller">

    Yêu cầu tác nhân WhatsApp kiểm tra thiết lập cuộc gọi (hành động trạng thái `whatsapp_call` báo cáo thư mục trạng thái dành riêng cho tài khoản và lệnh ghép nối). Đối với tài khoản mặc định:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Chạy lệnh này ở chế độ tương tác, quét mã QR từ **WhatsApp > Linked devices** và chờ `MeowCaller linked device ready`. Giữ kín `wa-voip.db` — đây là phiên MeowCaller. Các tài khoản không phải mặc định có đường dẫn kho lưu trữ riêng từ hành động trạng thái; trên Windows, hãy chạy lệnh PowerShell tương ứng.

  </Step>

  <Step title="Cấu hình TTS và gọi từ WhatsApp">

    Cấu hình một [nhà cung cấp TTS](/vi/tools/tts) có khả năng điện thoại, khởi động lại Gateway, sau đó gửi một yêu cầu như `Call me and say the build finished.` Công cụ phân giải người gửi từ ngữ cảnh đầu vào đáng tin cậy, tổng hợp một tệp WAV riêng tư tạm thời, chạy MeowCaller trong một khoảng thời gian gọi giới hạn và xóa tệp âm thanh sau đó. OpenClaw truyền rõ ràng kho lưu trữ của tài khoản, chờ trạng thái thoát bằng 0 sau khi trả lời/phát/gác máy và coi việc hết thời gian chờ hoặc trạng thái thoát khác 0 là một lệnh gọi công cụ thất bại.

  </Step>
</Steps>

Giới hạn: chỉ hỗ trợ cuộc gọi âm thanh đi một-một, không hỗ trợ số đích tùy ý, không dùng chung thông tin xác thực với kết nối trò chuyện, không tự gọi từ chế độ số cá nhân/tự trò chuyện, âm thanh tổng hợp được giới hạn ở 60 giây, không có biên nhận về khả năng nghe được ở phía thiết bị cầm tay ngoài việc MeowCaller hoàn tất trả lời/phát/gác máy, và OpenClaw dừng tiến trình đồng hành sau khoảng thời gian giới hạn 115-175 giây (bao gồm các giai đoạn kết nối, trả lời, phát và tắt của MeowCaller).

## Prompt phê duyệt

WhatsApp có thể hiển thị các prompt phê duyệt thực thi và Plugin dưới dạng phản ứng `👍`/`👎`, được kiểm soát bởi cấu hình chuyển tiếp phê duyệt cấp cao nhất:

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

`approvals.exec` và `approvals.plugin` hoạt động độc lập; việc bật WhatsApp làm kênh chỉ liên kết phương thức truyền tải và không gửi gì trừ khi nhóm phê duyệt tương ứng được bật và định tuyến đến đó. Chế độ phiên chỉ chuyển các phê duyệt bằng emoji gốc đối với các yêu cầu phê duyệt bắt nguồn từ WhatsApp. Chế độ đích sử dụng pipeline chuyển tiếp dùng chung cho các đích rõ ràng và không tạo hoạt động phân nhánh DM riêng đến người phê duyệt.

Phản ứng phê duyệt trên WhatsApp yêu cầu chỉ định rõ người phê duyệt trong `allowFrom` (hoặc `"*"`). `defaultTo` đặt đích tin nhắn mặc định thông thường, không phải danh sách người phê duyệt. Các lệnh `/approve` thủ công vẫn đi qua đường dẫn ủy quyền người gửi WhatsApp thông thường trước khi phân giải phê duyệt.

## Phản ứng cho câu hỏi

Đối với prompt `ask_user` có một câu hỏi không bí mật, chọn một đáp án và từ một đến bốn tùy chọn, WhatsApp hiển thị từ `1️⃣` đến `4️⃣` bên cạnh nhãn tùy chọn. Hãy phản ứng với prompt đã gửi bằng số tương ứng để trả lời. OpenClaw ánh xạ số đó tới tùy chọn chính tắc thông qua Gateway; các lần nhấn cũ hoặc trùng lặp sẽ bị bỏ qua. Prompt nhiều câu hỏi, chọn nhiều đáp án và văn bản tự do vẫn chỉ có thể trả lời bằng văn bản. Các quy tắc tiếp nhận DM/nhóm WhatsApp thông thường ủy quyền cho người gửi phản ứng.

## Hook Plugin và quyền riêng tư

Tin nhắn WhatsApp đến có thể chứa nội dung cá nhân, số điện thoại, mã định danh nhóm, tên người gửi và các trường tương quan phiên. WhatsApp không phát rộng payload hook `message_received` đầu vào đến các Plugin trừ khi bạn chủ động bật:

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

Giới hạn việc chủ động bật cho một tài khoản trong `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Chỉ bật tính năng này cho các Plugin mà bạn tin tưởng có thể xử lý nội dung và mã định danh WhatsApp đầu vào.

## Kiểm soát truy cập và kích hoạt

<Tabs>
  <Tab title="Chính sách DM">
    `channels.whatsapp.dmPolicy`:

    | Giá trị | Hành vi |
    | --- | --- |
    | `pairing` (mặc định) | Người gửi không xác định yêu cầu ghép nối; chủ sở hữu phê duyệt |
    | `allowlist` | Chỉ chấp nhận người gửi thuộc `allowFrom` |
    | `open` | Yêu cầu `allowFrom` phải bao gồm `"*"` |
    | `disabled` | Chặn tất cả DM |

    `allowFrom` chấp nhận các số theo định dạng E.164 (được chuẩn hóa nội bộ). Đây chỉ là danh sách kiểm soát quyền truy cập của người gửi DM — không kiểm soát các lượt gửi đi tường minh đến JID nhóm hoặc JID kênh `@newsletter`.

    Ghi đè cho nhiều tài khoản: `channels.whatsapp.accounts.<id>.dmPolicy` (và `.allowFrom`) được ưu tiên hơn các giá trị mặc định cấp kênh đối với tài khoản đó.

    Lưu ý về thời gian chạy:

    - các ghép nối được lưu bền trong kho danh sách cho phép của kênh và hợp nhất với `allowFrom` đã cấu hình
    - tự động hóa theo lịch và phương án dự phòng cho người nhận Heartbeat sử dụng các đích gửi tường minh hoặc `allowFrom` đã cấu hình; các phê duyệt ghép nối DM không mặc nhiên là người nhận cron/heartbeat
    - nếu không cấu hình danh sách cho phép, số tự thân đã liên kết được cho phép theo mặc định
    - OpenClaw không bao giờ tự động ghép nối các DM `fromMe` gửi đi (tin nhắn bạn tự gửi cho mình từ thiết bị đã liên kết)

  </Tab>

  <Tab title="Chính sách nhóm và danh sách cho phép">
    Quyền truy cập nhóm có hai lớp:

    1. **Danh sách cho phép thành viên nhóm** (`channels.whatsapp.groups`): nếu bỏ qua `groups`, mọi nhóm đều đủ điều kiện; nếu có, nó hoạt động như một danh sách cho phép nhóm (`"*"` chấp nhận tất cả).
    2. **Chính sách người gửi trong nhóm** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` bỏ qua danh sách cho phép người gửi, `allowlist` yêu cầu khớp với `groupAllowFrom` (hoặc `*`), `disabled` chặn toàn bộ tin đến từ nhóm.

    Nếu chưa đặt `groupAllowFrom`, việc kiểm tra người gửi sẽ dùng `allowFrom` làm phương án dự phòng khi có mục nhập. Danh sách cho phép người gửi được đánh giá trước khi kích hoạt bằng lượt đề cập/phản hồi.

    Nếu hoàn toàn không có khối `channels.whatsapp`, thời gian chạy sẽ dùng `groupPolicy: "allowlist"` làm phương án dự phòng (kèm nhật ký cảnh báo), ngay cả khi `channels.defaults.groupPolicy` được đặt thành giá trị khác.

    <Note>
    Việc phân giải tư cách thành viên nhóm có một cơ chế an toàn cho tài khoản đơn: nếu chỉ cấu hình một tài khoản WhatsApp và `accounts.<id>.groups` của tài khoản đó là một đối tượng rỗng tường minh (`{}`), giá trị này được coi là "chưa đặt" và sẽ dùng ánh xạ `channels.whatsapp.groups` gốc làm phương án dự phòng, thay vì âm thầm chặn mọi nhóm. Khi cấu hình từ 2 tài khoản trở lên, ánh xạ tài khoản rỗng tường minh vẫn giữ nguyên trạng thái rỗng và không dùng phương án dự phòng — điều này cho phép một tài khoản chủ ý vô hiệu hóa mọi nhóm mà không ảnh hưởng đến các tài khoản cùng cấp.
    </Note>

  </Tab>

  <Tab title="Lượt đề cập và /activation">
    Theo mặc định, phản hồi trong nhóm yêu cầu một lượt đề cập. Phát hiện lượt đề cập bao gồm:

    - các lượt đề cập WhatsApp tường minh đến danh tính bot
    - các mẫu biểu thức chính quy cho lượt đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, phương án dự phòng `messages.groupChat.mentionPatterns`)
    - bản chép lời ghi chú thoại đến cho các tin nhắn nhóm được ủy quyền
    - phát hiện phản hồi-bot ngầm định (người gửi phản hồi khớp với danh tính bot)

    Bảo mật: trích dẫn/phản hồi chỉ đáp ứng điều kiện lượt đề cập — **không** cấp quyền cho người gửi. Với `groupPolicy: "allowlist"`, người gửi không thuộc danh sách cho phép vẫn bị chặn ngay cả khi phản hồi tin nhắn của người dùng thuộc danh sách cho phép.

    Lệnh kích hoạt cấp phiên: `/activation mention` hoặc `/activation always`. Lệnh này cập nhật trạng thái phiên (không phải cấu hình toàn cục) và chỉ dành cho chủ sở hữu.

  </Tab>
</Tabs>

## Liên kết ACP đã cấu hình

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

Các cuộc trò chuyện trực tiếp khớp với số E.164; các nhóm khớp với JID nhóm WhatsApp. Danh sách cho phép nhóm, chính sách người gửi và điều kiện kích hoạt bằng lượt đề cập/kích hoạt được áp dụng trước khi OpenClaw bảo đảm phiên ACP đã liên kết tồn tại. Một liên kết khớp sẽ sở hữu tuyến — các nhóm phát sóng không phân tán lượt đó đến các phiên WhatsApp thông thường.

## Hành vi với số cá nhân và cuộc trò chuyện với chính mình

Khi số tự thân đã liên kết cũng có trong `allowFrom`, các biện pháp bảo vệ cuộc trò chuyện với chính mình sẽ được kích hoạt: bỏ qua biên nhận đã đọc cho các lượt trò chuyện với chính mình, bỏ qua hành vi tự động kích hoạt bằng JID lượt đề cập vốn sẽ thông báo cho chính bạn và mặc định gửi phản hồi đến `[{identity.name}]` (hoặc `[openclaw]`) khi chưa đặt `messages.responsePrefix`.

## Chuẩn hóa tin nhắn và ngữ cảnh

<AccordionGroup>
  <Accordion title="Phong bì tin đến và ngữ cảnh phản hồi">
    Tin nhắn đến được bao bọc trong phong bì tin đến dùng chung. Một phản hồi có trích dẫn sẽ nối thêm ngữ cảnh theo dạng sau:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Siêu dữ liệu phản hồi (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 của người gửi) được điền khi có. Nếu đích được trích dẫn là nội dung đa phương tiện có thể tải xuống, OpenClaw sẽ lưu nội dung đó thông qua kho đa phương tiện tin đến thông thường và cung cấp `MediaPath`/`MediaType` để tác tử có thể kiểm tra trực tiếp thay vì chỉ thấy `<media:image>`.

  </Accordion>

  <Accordion title="Phần giữ chỗ đa phương tiện và trích xuất vị trí/liên hệ">
    Tin nhắn chỉ chứa đa phương tiện được chuẩn hóa thành các phần giữ chỗ: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Ghi chú thoại nhóm được ủy quyền sẽ được chép lời trước khi áp dụng điều kiện lượt đề cập nếu phần nội dung chỉ là `<media:audio>`, nhờ đó việc nói lượt đề cập bot trong ghi chú thoại có thể kích hoạt phản hồi. Nếu bản chép lời vẫn không đề cập đến bot, nó sẽ được giữ trong lịch sử nhóm đang chờ thay vì phần giữ chỗ thô.

    Nội dung vị trí được hiển thị dưới dạng văn bản tọa độ ngắn gọn. Nhãn/nhận xét vị trí và chi tiết liên hệ/vCard được hiển thị dưới dạng siêu dữ liệu không đáng tin cậy trong khối có hàng rào, không phải văn bản lời nhắc nội tuyến.

  </Accordion>

  <Accordion title="Chèn lịch sử nhóm đang chờ">
    Các tin nhắn nhóm chưa được xử lý sẽ được lưu vào bộ đệm và chèn làm ngữ cảnh khi bot cuối cùng được kích hoạt.

    - giới hạn mặc định: `50`
    - cấu hình: `channels.whatsapp.historyLimit`, phương án dự phòng `messages.groupChat.historyLimit`
    - `0` vô hiệu hóa

    Dấu chèn: `[Chat messages since your last reply - for context]` và `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Biên nhận đã đọc">
    Được bật theo mặc định cho các tin nhắn đến được chấp nhận. Vô hiệu hóa trên toàn cục:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Ghi đè theo tài khoản: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Các lượt trò chuyện với chính mình bỏ qua biên nhận đã đọc ngay cả khi được bật trên toàn cục.

  </Accordion>
</AccordionGroup>

## Gửi, chia đoạn và đa phương tiện

<AccordionGroup>
  <Accordion title="Chia đoạn văn bản">
    - giới hạn đoạn mặc định: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` ưu tiên ranh giới đoạn văn (dòng trống), sau đó dùng phương án dự phòng chia đoạn an toàn theo độ dài

  </Accordion>

  <Accordion title="Hành vi đa phương tiện gửi đi">
    - hỗ trợ tải trọng hình ảnh, video, âm thanh (ghi chú thoại PTT) và tài liệu
    - âm thanh được gửi dưới dạng tải trọng Baileys `audio` với `ptt: true`, hiển thị dưới dạng ghi chú thoại nhấn-để-nói; `audioAsVoice` được giữ nguyên trên tải trọng phản hồi để đầu ra ghi chú thoại TTS luôn đi theo đường dẫn này bất kể định dạng nguồn của nhà cung cấp
    - âm thanh Ogg/Opus gốc được gửi dưới dạng `audio/ogg; codecs=opus`; mọi định dạng khác (bao gồm đầu ra MP3/WebM TTS của Microsoft Edge) được chuyển mã bằng `ffmpeg` thành Ogg/Opus đơn âm 48 kHz trước khi gửi PTT
    - `/tts latest` gửi phản hồi mới nhất của trợ lý dưới dạng một ghi chú thoại và ngăn gửi lặp lại cùng một phản hồi; `/tts chat on|off|default` kiểm soát TTS tự động cho cuộc trò chuyện hiện tại
    - bật `gifPlayback: true` khi gửi video sẽ cho phép phát GIF động
    - `forceDocument`/`asDocument` định tuyến hình ảnh, GIF và video gửi đi qua tải trọng tài liệu Baileys để tránh cơ chế nén đa phương tiện của WhatsApp, đồng thời giữ nguyên tên tệp và loại MIME đã phân giải
    - chú thích được áp dụng cho mục đa phương tiện đầu tiên trong phản hồi có nhiều mục đa phương tiện, ngoại trừ ghi chú thoại PTT: âm thanh được gửi trước mà không có chú thích, sau đó chú thích được gửi dưới dạng tin nhắn văn bản riêng (các ứng dụng WhatsApp không hiển thị chú thích ghi chú thoại một cách nhất quán)
    - nguồn đa phương tiện có thể là HTTP(S), `file://` hoặc một đường dẫn cục bộ

  </Accordion>

  <Accordion title="Giới hạn kích thước đa phương tiện và hành vi dự phòng">
    - giới hạn lưu tin đến và giới hạn gửi đi: `channels.whatsapp.mediaMaxMb` (mặc định `50`)
    - ghi đè theo tài khoản: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - hình ảnh được tự động tối ưu hóa (thay đổi kích thước/quét chất lượng) để phù hợp với giới hạn, trừ khi `forceDocument`/`asDocument` yêu cầu gửi dưới dạng tài liệu
    - khi gửi đa phương tiện thất bại, phương án dự phòng cho mục đầu tiên sẽ gửi cảnh báo bằng văn bản thay vì âm thầm bỏ phản hồi

  </Accordion>
</AccordionGroup>

## Trích dẫn phản hồi

`channels.whatsapp.replyToMode` kiểm soát việc trích dẫn phản hồi gốc (các phản hồi gửi đi hiển thị trích dẫn tin nhắn đến):

| Giá trị             | Hành vi                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (mặc định) | Không bao giờ trích dẫn; gửi dưới dạng tin nhắn thuần túy                           |
| `"first"`         | Chỉ trích dẫn đoạn phản hồi gửi đi đầu tiên                      |
| `"all"`           | Trích dẫn mọi đoạn phản hồi gửi đi                               |
| `"batched"`       | Trích dẫn các phản hồi theo lô trong hàng đợi; không trích dẫn các phản hồi tức thì |

Ghi đè theo tài khoản: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Mức độ phản ứng

`channels.whatsapp.reactionLevel` kiểm soát phạm vi tác tử sử dụng phản ứng emoji:

| Mức                 | Phản ứng xác nhận | Phản ứng do tác tử khởi tạo  |
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

`channels.whatsapp.ackReaction` gửi một phản ứng ngay lập tức khi nhận tin đến, được kiểm soát bởi `reactionLevel` (bị chặn khi `"off"`):

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // luôn luôn | lượt đề cập | không bao giờ
      },
    },
  },
}
```

Lưu ý: được gửi ngay sau khi tin đến được chấp nhận (trước phản hồi); nếu có `ackReaction` nhưng không có `emoji`, WhatsApp sử dụng emoji danh tính của tác tử được định tuyến và dùng "👀" làm phương án dự phòng (bỏ qua `ackReaction` hoặc đặt `emoji: ""` để không xác nhận); lỗi được ghi nhật ký nhưng không chặn việc gửi phản hồi; chế độ nhóm `mentions` chỉ phản ứng với các lượt được kích hoạt bằng lượt đề cập, trong khi kích hoạt nhóm `always` bỏ qua kiểm tra đó; WhatsApp chỉ sử dụng `channels.whatsapp.ackReaction` (`messages.ackReaction` cũ không áp dụng tại đây).

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

Ghi chú: `channels.whatsapp.ackReaction` vẫn kiểm soát điều kiện áp dụng cho tin nhắn trực tiếp và nhóm; trạng thái đang chờ sử dụng cùng emoji hiệu lực như các phản ứng xác nhận thông thường; WhatsApp có một vị trí phản ứng của bot cho mỗi tin nhắn, vì vậy các cập nhật vòng đời sẽ thay thế phản ứng hiện tại ngay tại chỗ; `messages.removeAckAfterReply: true` xóa phản ứng trạng thái cuối cùng sau khoảng giữ hoàn tất/lỗi đã cấu hình; các danh mục emoji của công cụ bao gồm `tool`, `coding`, `web`, `deploy`, `build` và `concierge`.

## Nhiều tài khoản và thông tin xác thực

<AccordionGroup>
  <Accordion title="Lựa chọn tài khoản và giá trị mặc định">
    ID tài khoản lấy từ `channels.whatsapp.accounts`. Tài khoản mặc định được chọn là `default` nếu có; nếu không, ID tài khoản được cấu hình đầu tiên (sắp xếp theo thứ tự bảng chữ cái) sẽ được chọn. ID tài khoản được chuẩn hóa nội bộ để tra cứu.
  </Accordion>

  <Accordion title="Đường dẫn thông tin xác thực và khả năng tương thích cũ">
    - đường dẫn xác thực hiện tại: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (bản sao lưu: `creds.json.bak`)
    - xác thực mặc định cũ trong `~/.openclaw/credentials/` vẫn được nhận diện/di chuyển cho các luồng tài khoản mặc định

  </Accordion>

  <Accordion title="Hành vi đăng xuất">
    `openclaw channels logout --channel whatsapp [--account <id>]` xóa trạng thái xác thực WhatsApp của tài khoản đó. Khi có thể kết nối đến Gateway, thao tác đăng xuất trước tiên sẽ dừng trình lắng nghe đang hoạt động của tài khoản đó, để phiên đã liên kết ngừng nhận tin nhắn trước lần khởi động lại tiếp theo. `openclaw channels remove --channel whatsapp` cũng dừng trình lắng nghe đang hoạt động trước khi vô hiệu hóa hoặc xóa cấu hình tài khoản.

    Trong các thư mục xác thực cũ, `oauth.json` được giữ lại trong khi các tệp xác thực Baileys bị xóa.

  </Accordion>
</AccordionGroup>

## Công cụ, hành động và thao tác ghi cấu hình

- Hỗ trợ công cụ của tác nhân bao gồm hành động phản ứng WhatsApp (`react`).
- Các cổng hành động: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (các hành động hiện có mặc định là `true`), `channels.whatsapp.actions.calls` (mặc định `false`, xem MeowCaller ở trên).
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

    Các tài khoản ít hoạt động có thể duy trì kết nối quá thời gian chờ tin nhắn thông thường; trình giám sát chỉ khởi động lại khi hoạt động truyền tải WhatsApp Web dừng, socket đóng hoặc hoạt động cấp ứng dụng tiếp tục im lặng vượt quá khoảng an toàn dài hơn (xem Mô hình runtime ở trên).

    Nếu nhật ký liên tục hiển thị `status=408 Request Time-out Connection was lost`, hãy điều chỉnh thời gian socket Baileys trong `web.whatsapp`. Trước tiên, hãy giảm `keepAliveIntervalMs` xuống dưới thời gian chờ không hoạt động của mạng và tăng `connectTimeoutMs` trên các kết nối chậm hoặc hay mất dữ liệu:

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

    Nếu vòng lặp vẫn tiếp diễn sau khi đã khắc phục kết nối máy chủ và thời gian, hãy sao lưu thư mục xác thực tài khoản rồi liên kết lại:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Nếu `~/.openclaw/logs/whatsapp-health.log` cho biết `Gateway inactive` nhưng cả `openclaw gateway status` và `openclaw channels status --probe` đều hiển thị trạng thái bình thường, hãy chạy `openclaw doctor`. Trên Linux, doctor cảnh báo về các mục crontab cũ gọi tập lệnh `~/.openclaw/bin/ensure-whatsapp.sh` đã ngừng sử dụng; hãy xóa các mục đó bằng `crontab -e` — cron có thể thiếu môi trường bus người dùng systemd và khiến tập lệnh cũ đó báo cáo sai tình trạng Gateway.

  </Accordion>

  <Accordion title="Đăng nhập bằng mã QR hết thời gian chờ khi qua proxy">
    Triệu chứng: `openclaw channels login --channel whatsapp` thất bại trước khi hiển thị mã QR có thể sử dụng, với `status=408 Request Time-out` hoặc lỗi ngắt kết nối socket TLS.

    Đăng nhập WhatsApp Web sử dụng môi trường proxy tiêu chuẩn của máy chủ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, các biến thể chữ thường, `NO_PROXY`). Hãy xác minh tiến trình Gateway kế thừa môi trường proxy và `NO_PROXY` không khớp với `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Không có trình lắng nghe đang hoạt động khi gửi">
    Lệnh gửi đi thất bại ngay lập tức khi không có trình lắng nghe Gateway đang hoạt động cho tài khoản đích. Hãy xác nhận Gateway đang chạy và tài khoản đã được liên kết.
  </Accordion>

  <Accordion title="Phản hồi xuất hiện trong bản ghi nhưng không có trong WhatsApp">
    Các hàng trong bản ghi lưu lại nội dung mà tác nhân đã tạo; việc gửi qua WhatsApp được kiểm tra riêng. OpenClaw chỉ coi phản hồi tự động là đã gửi sau khi Baileys trả về ID tin nhắn gửi đi cho ít nhất một lần gửi văn bản hoặc phương tiện hiển thị được.

    Các phản ứng xác nhận là biên nhận độc lập trước khi phản hồi — phản ứng thành công không chứng minh phản hồi văn bản/phương tiện sau đó đã được chấp nhận. Hãy kiểm tra nhật ký Gateway để tìm `auto-reply delivery failed` hoặc `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua ngoài dự kiến">
    Kiểm tra theo thứ tự sau: `groupPolicy`, `groupAllowFrom`/`allowFrom`, các mục trong danh sách cho phép `groups`, cổng đề cập (`requireMention` + các mẫu đề cập) và các khóa trùng lặp trong `openclaw.json` (các mục JSON5 phía sau ghi đè các mục phía trước — chỉ giữ một `groupPolicy` cho mỗi phạm vi).

    Nếu có `channels.whatsapp.groups`, WhatsApp vẫn có thể quan sát tin nhắn từ các nhóm khác, nhưng OpenClaw loại bỏ chúng trước khi định tuyến phiên. Thêm JID của nhóm vào `channels.whatsapp.groups`, hoặc thêm `groups["*"]` để cho phép tất cả các nhóm trong khi vẫn duy trì việc ủy quyền người gửi theo `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Cảnh báo runtime Bun">
    Gateway OpenClaw yêu cầu Node. Bun không cung cấp API `node:sqlite` mà kho trạng thái chuẩn sử dụng, và doctor di chuyển các dịch vụ Bun cũ sang Node.
  </Accordion>
</AccordionGroup>

## Lời nhắc hệ thống

WhatsApp hỗ trợ lời nhắc hệ thống theo kiểu Telegram cho nhóm và cuộc trò chuyện trực tiếp thông qua các ánh xạ `groups` và `direct`.

Quá trình phân giải tin nhắn nhóm: ánh xạ `groups` hiệu lực được xác định trước — nếu tài khoản có định nghĩa khóa `groups` riêng, khóa đó sẽ thay thế hoàn toàn ánh xạ `groups` gốc (không hợp nhất sâu). Sau đó, quá trình tra cứu lời nhắc chạy trên ánh xạ kết quả duy nhất đó:

1. **Lời nhắc dành riêng cho nhóm** (`groups["<groupId>"].systemPrompt`): được sử dụng khi mục nhóm tồn tại **và** khóa `systemPrompt` của mục đó được định nghĩa. Chuỗi rỗng (`""`) sẽ chặn ký tự đại diện và không áp dụng lời nhắc nào.
2. **Lời nhắc ký tự đại diện của nhóm** (`groups["*"].systemPrompt`): được sử dụng khi mục của nhóm cụ thể không tồn tại hoặc tồn tại nhưng không có khóa `systemPrompt`.

Quá trình phân giải tin nhắn trực tiếp tuân theo mẫu giống hệt với ánh xạ `direct` và `direct["*"]`.

<Note>
`dms` vẫn là vùng ghi đè lịch sử nhẹ cho từng tin nhắn trực tiếp (`dms.<id>.historyLimit`). Các ghi đè lời nhắc nằm trong `direct`.
</Note>

<Note>
Hành vi tài khoản thay thế cấu hình gốc này trong quá trình phân giải lời nhắc là một phép ghi đè nông đơn giản: mọi khóa `groups`/`direct` của tài khoản, kể cả đối tượng rỗng được chỉ định rõ ràng, đều thay thế ánh xạ gốc. Hành vi này khác với kiểm tra danh sách cho phép thành viên nhóm mô tả ở trên, vốn có cơ chế bảo vệ cho một tài khoản khi `groups: {}` vô tình bị để trống.
</Note>

**Khác biệt so với Telegram:** Telegram chặn `groups` gốc cho mọi tài khoản trong thiết lập nhiều tài khoản (kể cả tài khoản không có `groups` riêng) để ngăn bot nhận tin nhắn nhóm từ các nhóm mà bot không tham gia. WhatsApp không áp dụng cơ chế bảo vệ đó — `groups`/`direct` gốc được mọi tài khoản không có ghi đè riêng kế thừa, bất kể số lượng tài khoản. Trong thiết lập WhatsApp nhiều tài khoản, hãy định nghĩa rõ ràng toàn bộ ánh xạ trong từng tài khoản nếu muốn có lời nhắc riêng cho từng tài khoản.

Hành vi quan trọng:

- `channels.whatsapp.groups` vừa là ánh xạ cấu hình cho từng nhóm, vừa là danh sách cho phép nhóm ở cấp cuộc trò chuyện. Ở phạm vi gốc hoặc phạm vi tài khoản, `groups["*"]` có nghĩa là "tất cả các nhóm đều được cho phép" trong phạm vi đó.
- Chỉ thêm ký tự đại diện `systemPrompt` khi bạn đã muốn phạm vi đó cho phép tất cả các nhóm. Để chỉ giữ một tập hợp ID nhóm cố định đủ điều kiện, hãy lặp lại lời nhắc trong từng mục được cho phép rõ ràng thay vì sử dụng `groups["*"]`.
- Việc cho phép nhóm và ủy quyền người gửi là hai bước kiểm tra riêng biệt. `groups["*"]` mở rộng các nhóm được chuyển đến xử lý nhóm; tùy chọn này không ủy quyền cho mọi người gửi trong các nhóm đó — việc này vẫn do `groupPolicy`/`groupAllowFrom` kiểm soát.
- `channels.whatsapp.direct` không có tác dụng phụ tương đương đối với tin nhắn trực tiếp: `direct["*"]` chỉ cung cấp cấu hình mặc định sau khi tin nhắn trực tiếp đã được cho phép bởi `dmPolicy` cùng với `allowFrom` hoặc các quy tắc của kho ghép nối.

Ví dụ:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Chỉ sử dụng nếu tất cả các nhóm cần được cho phép ở phạm vi gốc.
        // Áp dụng cho mọi tài khoản không định nghĩa ánh xạ groups riêng.
        "*": { systemPrompt: "Lời nhắc mặc định cho tất cả các nhóm." },
      },
      direct: {
        // Áp dụng cho mọi tài khoản không định nghĩa ánh xạ direct riêng.
        "*": { systemPrompt: "Lời nhắc mặc định cho tất cả các cuộc trò chuyện trực tiếp." },
      },
      accounts: {
        work: {
          groups: {
            // Tài khoản này định nghĩa groups riêng, vì vậy groups gốc bị thay thế
            // hoàn toàn. Để giữ ký tự đại diện, cũng hãy định nghĩa rõ "*" tại đây.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Tập trung vào quản lý dự án.",
            },
            // Chỉ sử dụng nếu tất cả các nhóm cần được cho phép trong tài khoản này.
            "*": { systemPrompt: "Lời nhắc mặc định cho các nhóm công việc." },
          },
          direct: {
            // Tài khoản này định nghĩa ánh xạ direct riêng, vì vậy các mục direct gốc bị
            // thay thế hoàn toàn. Để giữ ký tự đại diện, cũng hãy định nghĩa rõ "*" tại đây.
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
| Gửi              | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Nhiều tài khoản  | `accounts.<id>.enabled`, `accounts.<id>.authDir` và các ghi đè khác cho từng tài khoản                              |
| Vận hành         | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Hành vi phiên    | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Lời nhắc         | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Nhóm](/vi/channels/groups)
- [Bảo mật](/vi/gateway/security)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Định tuyến đa tác tử](/vi/concepts/multi-agent)
- [Khắc phục sự cố](/vi/channels/troubleshooting)
