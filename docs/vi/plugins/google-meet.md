---
read_when:
    - Bạn muốn một tác tử OpenClaw tham gia cuộc gọi Google Meet
    - Bạn muốn một tác nhân OpenClaw tạo một cuộc gọi Google Meet mới
    - Bạn đang cấu hình Chrome, nút Chrome hoặc Twilio làm phương thức truyền tải Google Meet
summary: 'Plugin Google Meet: tham gia các URL Meet cụ thể qua Chrome hoặc Twilio với mặc định thoại thời gian thực'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-01T10:51:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9d0d195fc709e487ef1bf5603fdb32fade1b6a0a13aa9bed5110979490f92ff
    source_path: plugins/google-meet.md
    workflow: 16
---

Hỗ trợ người tham gia Google Meet cho OpenClaw — Plugin được thiết kế theo hướng tường minh:

- Chỉ tham gia một URL `https://meet.google.com/...` tường minh.
- Có thể tạo một không gian Meet mới thông qua Google Meet API, rồi tham gia
  URL được trả về.
- Giọng nói `realtime` là chế độ mặc định.
- Giọng nói thời gian thực có thể gọi lại vào toàn bộ tác nhân OpenClaw khi cần
  suy luận sâu hơn hoặc công cụ.
- Tác nhân chọn hành vi tham gia bằng `mode`: dùng `realtime` để nghe/nói đáp
  trực tiếp, hoặc `transcribe` để tham gia/điều khiển trình duyệt mà không có
  cầu nối giọng nói thời gian thực.
- Xác thực bắt đầu bằng OAuth Google cá nhân hoặc một hồ sơ Chrome đã đăng nhập.
- Không có thông báo đồng ý tự động.
- Backend âm thanh Chrome mặc định là `BlackHole 2ch`.
- Chrome có thể chạy cục bộ hoặc trên một máy chủ node đã ghép cặp.
- Twilio chấp nhận một số quay vào cùng PIN hoặc chuỗi DTMF tùy chọn.
- Lệnh CLI là `googlemeet`; `meet` được dành cho các quy trình hội nghị từ xa
  rộng hơn của tác nhân.

## Bắt đầu nhanh

Cài đặt các phụ thuộc âm thanh cục bộ và cấu hình một nhà cung cấp giọng nói
thời gian thực backend. OpenAI là mặc định; Google Gemini Live cũng hoạt động với
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` cài đặt thiết bị âm thanh ảo `BlackHole 2ch`. Trình cài đặt của
Homebrew yêu cầu khởi động lại trước khi macOS hiển thị thiết bị:

```bash
sudo reboot
```

Sau khi khởi động lại, xác minh cả hai phần:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Bật Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Kiểm tra thiết lập:

```bash
openclaw googlemeet setup
```

Đầu ra thiết lập được thiết kế để tác nhân có thể đọc và nhận biết chế độ. Nó
báo cáo hồ sơ Chrome, việc ghim node, và, đối với lượt tham gia Chrome thời gian
thực, cầu nối âm thanh BlackHole/SoX cùng các kiểm tra phần giới thiệu thời gian
thực bị trì hoãn. Với lượt tham gia chỉ quan sát, hãy kiểm tra cùng một transport
bằng `--mode transcribe`; chế độ đó bỏ qua các điều kiện tiên quyết về âm thanh
thời gian thực vì nó không nghe qua hoặc nói qua cầu nối:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Khi ủy quyền Twilio được cấu hình, thiết lập cũng báo cáo liệu Plugin
`voice-call`, thông tin xác thực Twilio, và việc phơi bày Webhook công khai đã
sẵn sàng hay chưa. Xem mọi kiểm tra `ok: false` là chặn đối với transport và chế
độ được kiểm tra trước khi yêu cầu tác nhân tham gia. Dùng
`openclaw googlemeet setup --json` cho script hoặc đầu ra máy đọc được. Dùng
`--transport chrome`, `--transport chrome-node`, hoặc `--transport twilio` để
kiểm tra trước một transport cụ thể trước khi tác nhân thử dùng nó.

Với Twilio, luôn kiểm tra trước transport một cách tường minh khi transport mặc
định là Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Điều đó phát hiện việc thiếu nối dây `voice-call`, thông tin xác thực Twilio, hoặc
Webhook không truy cập được trước khi tác nhân thử gọi vào cuộc họp.

Tham gia một cuộc họp:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Hoặc để tác nhân tham gia thông qua công cụ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Tạo một cuộc họp mới và tham gia:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Chỉ tạo URL mà không tham gia:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` có hai đường dẫn:

- Tạo bằng API: được dùng khi thông tin xác thực OAuth Google Meet đã được cấu
  hình. Đây là đường dẫn xác định nhất và không phụ thuộc vào trạng thái giao
  diện trình duyệt.
- Fallback trình duyệt: được dùng khi không có thông tin xác thực OAuth. OpenClaw
  dùng node Chrome đã ghim, mở `https://meet.google.com/new`, chờ Google chuyển
  hướng tới một URL mã cuộc họp thật, rồi trả về URL đó. Đường dẫn này yêu cầu hồ
  sơ Chrome OpenClaw trên node đã đăng nhập vào Google.
  Tự động hóa trình duyệt xử lý lời nhắc micro lần chạy đầu của Meet; lời nhắc
  đó không được xem là lỗi đăng nhập Google.
  Các luồng tham gia và tạo cũng cố gắng tái sử dụng một tab Meet hiện có trước
  khi mở tab mới. Việc khớp bỏ qua các chuỗi truy vấn URL vô hại như `authuser`,
  vì vậy lần thử lại của tác nhân nên tập trung vào cuộc họp đã mở thay vì tạo
  tab Chrome thứ hai.

Đầu ra lệnh/công cụ bao gồm trường `source` (`api` hoặc `browser`) để tác nhân có
thể giải thích đường dẫn nào đã được dùng. `create` tham gia cuộc họp mới theo
mặc định và trả về `joined: true` cùng phiên tham gia. Để chỉ tạo URL, dùng
`create --no-join` trên CLI hoặc truyền `"join": false` cho công cụ.

Hoặc nói với tác nhân: "Tạo một Google Meet, tham gia bằng giọng nói thời gian
thực, và gửi tôi liên kết." Tác nhân nên gọi `google_meet` với
`action: "create"` rồi chia sẻ `meetingUri` được trả về.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Với lượt tham gia chỉ quan sát/điều khiển trình duyệt, đặt `"mode": "transcribe"`.
Điều đó không khởi động cầu nối mô hình thời gian thực hai chiều, không yêu cầu
BlackHole hoặc SoX, và sẽ không nói đáp vào cuộc họp. Các lượt tham gia Chrome ở
chế độ này cũng tránh việc cấp quyền micro/camera của OpenClaw và tránh đường dẫn
**Use microphone** của Meet. Nếu Meet hiển thị màn hình chọn âm thanh, tự động
hóa sẽ thử đường dẫn không có micro và nếu không được thì báo cáo một hành động
thủ công thay vì mở micro cục bộ.

Trong các phiên thời gian thực, trạng thái `google_meet` bao gồm tình trạng trình
duyệt và cầu nối âm thanh như `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`,
dấu thời gian đầu vào/đầu ra gần nhất, bộ đếm byte, và trạng thái cầu nối đã
đóng. Nếu một lời nhắc trang Meet an toàn xuất hiện, tự động hóa trình duyệt xử
lý nó khi có thể. Lời nhắc đăng nhập, cho phép của chủ trì, và quyền trình
duyệt/HĐH được báo cáo là hành động thủ công kèm lý do và thông báo để tác nhân
chuyển tiếp. Các phiên Chrome được quản lý chỉ phát phần giới thiệu hoặc cụm từ
kiểm thử sau khi tình trạng trình duyệt báo cáo `inCall: true`; nếu không, trạng
thái báo cáo `speechReady: false` và lần thử nói bị chặn thay vì giả vờ rằng tác
nhân đã nói vào cuộc họp.

Chrome cục bộ tham gia thông qua hồ sơ trình duyệt OpenClaw đã đăng nhập. Chế độ
thời gian thực yêu cầu `BlackHole 2ch` cho đường dẫn micro/loa mà OpenClaw dùng.
Để có âm thanh hai chiều sạch, dùng các thiết bị ảo riêng biệt hoặc đồ thị kiểu
Loopback; một thiết bị BlackHole duy nhất là đủ cho kiểm thử khói ban đầu nhưng
có thể tạo tiếng vọng.

### Gateway cục bộ + Chrome Parallels

Bạn **không** cần một OpenClaw Gateway đầy đủ hoặc khóa API mô hình bên trong VM
macOS chỉ để VM sở hữu Chrome. Chạy Gateway và tác nhân cục bộ, rồi chạy một máy
chủ node trong VM. Bật Plugin đi kèm trên VM một lần để node quảng bá lệnh
Chrome:

Chạy ở đâu:

- Máy chủ Gateway: OpenClaw Gateway, không gian làm việc tác nhân, khóa model/API,
  nhà cung cấp thời gian thực, và cấu hình Plugin Google Meet.
- VM macOS Parallels: OpenClaw CLI/máy chủ node, Google Chrome, SoX, BlackHole 2ch,
  và một hồ sơ Chrome đã đăng nhập vào Google.
- Không cần trong VM: dịch vụ Gateway, cấu hình tác nhân, khóa OpenAI/GPT, hoặc
  thiết lập nhà cung cấp mô hình.

Cài đặt các phụ thuộc VM:

```bash
brew install blackhole-2ch sox
```

Khởi động lại VM sau khi cài BlackHole để macOS hiển thị `BlackHole 2ch`:

```bash
sudo reboot
```

Sau khi khởi động lại, xác minh VM có thể thấy thiết bị âm thanh và các lệnh SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Cài đặt hoặc cập nhật OpenClaw trong VM, rồi bật Plugin đi kèm ở đó:

```bash
openclaw plugins enable google-meet
```

Khởi động máy chủ node trong VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Nếu `<gateway-host>` là IP LAN và bạn không dùng TLS, node sẽ từ chối WebSocket
văn bản thuần trừ khi bạn chọn tham gia cho mạng riêng đáng tin cậy đó:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Dùng cùng biến môi trường khi cài đặt node làm LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` là môi trường tiến trình, không phải một
thiết lập `openclaw.json`. `openclaw node install` lưu nó trong môi trường
LaunchAgent khi nó hiện diện trên lệnh cài đặt.

Phê duyệt node từ máy chủ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Xác nhận Gateway thấy node và node quảng bá cả `googlemeet.chrome` lẫn năng lực
trình duyệt/`browser.proxy`:

```bash
openclaw nodes status
```

Định tuyến Meet qua node đó trên máy chủ Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Bây giờ tham gia bình thường từ máy chủ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

hoặc yêu cầu tác nhân dùng công cụ `google_meet` với `transport: "chrome-node"`.

Để kiểm thử khói bằng một lệnh, tạo hoặc tái sử dụng một phiên, nói một cụm từ đã
biết, và in tình trạng phiên:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Trong khi tham gia thời gian thực, tự động hóa trình duyệt OpenClaw điền tên
khách, bấm Join/Ask to join, và chấp nhận lựa chọn "Use microphone" lần chạy đầu
của Meet khi lời nhắc đó xuất hiện. Trong khi tham gia chỉ quan sát hoặc tạo cuộc
họp chỉ bằng trình duyệt, nó tiếp tục qua cùng lời nhắc mà không có micro khi lựa
chọn đó khả dụng. Nếu hồ sơ trình duyệt chưa đăng nhập, Meet đang chờ chủ trì cho
phép, Chrome cần quyền micro/camera cho lượt tham gia thời gian thực, hoặc Meet
bị kẹt ở một lời nhắc mà tự động hóa không thể xử lý, kết quả join/test-speech sẽ
báo cáo `manualActionRequired: true` với `manualActionReason` và
`manualActionMessage`. Tác nhân nên dừng thử lại lượt tham gia, báo cáo đúng
thông báo đó cùng `browserUrl`/`browserTitle` hiện tại, và chỉ thử lại sau khi
hành động thủ công trong trình duyệt đã hoàn tất.

Nếu `chromeNode.node` bị bỏ qua, OpenClaw chỉ tự động chọn khi đúng một node đã
kết nối quảng bá cả `googlemeet.chrome` và điều khiển trình duyệt. Nếu nhiều node
có năng lực đang được kết nối, hãy đặt `chromeNode.node` thành id node, tên hiển
thị, hoặc IP từ xa.

Các kiểm tra lỗi thường gặp:

- `Configured Google Meet node ... is not usable: offline`: Node được ghim đã được
  Gateway biết đến nhưng không khả dụng. Agent nên xem Node đó là
  trạng thái chẩn đoán, không phải một máy chủ Chrome có thể sử dụng, và báo cáo
  trở ngại thiết lập thay vì chuyển sang một transport khác trừ khi người dùng yêu cầu điều đó.
- `No connected Google Meet-capable node`: khởi động `openclaw node run` trong VM,
  phê duyệt ghép nối, và đảm bảo `openclaw plugins enable google-meet` cùng
  `openclaw plugins enable browser` đã được chạy trong VM. Đồng thời xác nhận
  máy chủ Gateway cho phép cả hai lệnh Node bằng
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: cài đặt `blackhole-2ch` trên máy chủ
  đang được kiểm tra và khởi động lại trước khi dùng âm thanh Chrome cục bộ.
- `BlackHole 2ch audio device not found on the node`: cài đặt `blackhole-2ch`
  trong VM và khởi động lại VM.
- Chrome mở nhưng không thể tham gia: đăng nhập vào hồ sơ trình duyệt bên trong VM, hoặc
  giữ `chrome.guestName` được đặt để tham gia với tư cách khách. Tự động tham gia với tư cách khách dùng tự động hóa trình duyệt OpenClaw thông qua proxy trình duyệt của Node; đảm bảo cấu hình trình duyệt của Node trỏ đến hồ sơ bạn muốn, ví dụ
  `browser.defaultProfile: "user"` hoặc một hồ sơ phiên hiện có có tên.
- Các tab Meet trùng lặp: giữ `chrome.reuseExistingTab: true` được bật. OpenClaw
  kích hoạt một tab hiện có cho cùng URL Meet trước khi mở tab mới, và
  việc tạo cuộc họp bằng trình duyệt sẽ dùng lại một tab `https://meet.google.com/new`
  đang thực hiện hoặc tab lời nhắc tài khoản Google trước khi mở tab khác.
- Không có âm thanh: trong Meet, định tuyến micrô/loa qua đường dẫn thiết bị âm thanh ảo
  mà OpenClaw sử dụng; dùng các thiết bị ảo riêng biệt hoặc định tuyến kiểu Loopback
  để có âm thanh song công sạch.

## Ghi chú cài đặt

Mặc định thời gian thực của Chrome dùng hai công cụ bên ngoài:

- `sox`: tiện ích âm thanh dòng lệnh. Plugin dùng các lệnh thiết bị CoreAudio
  rõ ràng cho cầu nối âm thanh PCM16 24 kHz mặc định.
- `blackhole-2ch`: trình điều khiển âm thanh ảo macOS. Nó tạo thiết bị âm thanh `BlackHole 2ch`
  để Chrome/Meet có thể định tuyến qua.

OpenClaw không đóng gói hoặc phân phối lại bất kỳ gói nào trong hai gói này. Tài liệu yêu cầu người dùng
cài đặt chúng như các phụ thuộc máy chủ thông qua Homebrew. SoX được cấp phép theo
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole là GPL-3.0. Nếu bạn xây dựng một
trình cài đặt hoặc thiết bị tích hợp đóng gói BlackHole cùng OpenClaw, hãy xem xét các
điều khoản cấp phép upstream của BlackHole hoặc lấy giấy phép riêng từ Existential Audio.

## Transport

### Chrome

Transport Chrome mở URL Meet thông qua điều khiển trình duyệt OpenClaw và tham gia
bằng hồ sơ trình duyệt OpenClaw đã đăng nhập. Trên macOS, Plugin kiểm tra
`BlackHole 2ch` trước khi khởi chạy. Nếu được cấu hình, nó cũng chạy một lệnh
kiểm tra tình trạng cầu nối âm thanh và lệnh khởi động trước khi mở Chrome. Dùng `chrome` khi
Chrome/âm thanh nằm trên máy chủ Gateway; dùng `chrome-node` khi Chrome/âm thanh nằm
trên một Node đã ghép nối, chẳng hạn như VM Parallels macOS. Với Chrome cục bộ, chọn
hồ sơ bằng `browser.defaultProfile`; `chrome.browserProfile` được truyền cho
máy chủ `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Định tuyến âm thanh micrô và loa của Chrome qua cầu nối âm thanh OpenClaw cục bộ.
Nếu `BlackHole 2ch` chưa được cài đặt, thao tác tham gia sẽ thất bại với lỗi thiết lập
thay vì âm thầm tham gia mà không có đường dẫn âm thanh.

### Twilio

Transport Twilio là một kế hoạch quay số nghiêm ngặt được ủy quyền cho Plugin Voice Call. Nó
không phân tích các trang Meet để tìm số điện thoại.

Dùng cách này khi không thể tham gia bằng Chrome hoặc bạn muốn một phương án dự phòng
quay số điện thoại. Google Meet phải hiển thị số quay vào và PIN cho
cuộc họp; OpenClaw không khám phá các thông tin đó từ trang Meet.

Bật Plugin Voice Call trên máy chủ Gateway, không phải trên Node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Cung cấp thông tin xác thực Twilio qua môi trường hoặc cấu hình. Môi trường giữ
bí mật ngoài `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Khởi động lại hoặc tải lại Gateway sau khi bật `voice-call`; các thay đổi cấu hình Plugin
không xuất hiện trong một tiến trình Gateway đang chạy cho đến khi nó tải lại.

Sau đó xác minh:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Khi ủy quyền Twilio được nối dây, `googlemeet setup` bao gồm các kiểm tra
`twilio-voice-call-plugin`, `twilio-voice-call-credentials`, và
`twilio-voice-call-webhook` thành công.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Dùng `--dtmf-sequence` khi cuộc họp cần một chuỗi tùy chỉnh:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth và kiểm tra trước

OAuth là tùy chọn để tạo liên kết Meet vì `googlemeet create` có thể chuyển sang
tự động hóa trình duyệt. Cấu hình OAuth khi bạn muốn tạo bằng API chính thức,
phân giải space, hoặc kiểm tra trước Meet Media API.

Quyền truy cập Google Meet API dùng OAuth người dùng: tạo một Google Cloud OAuth client,
yêu cầu các phạm vi cần thiết, ủy quyền một tài khoản Google, rồi lưu
refresh token thu được trong cấu hình Plugin Google Meet hoặc cung cấp các biến môi trường
`OPENCLAW_GOOGLE_MEET_*`.

OAuth không thay thế đường dẫn tham gia bằng Chrome. Các transport Chrome và Chrome-node
vẫn tham gia thông qua hồ sơ Chrome đã đăng nhập, BlackHole/SoX, và một Node đã kết nối
khi bạn dùng tham gia bằng trình duyệt. OAuth chỉ dành cho đường dẫn Google Meet API
chính thức: tạo meeting space, phân giải space, và chạy kiểm tra trước Meet Media API.

### Tạo thông tin xác thực Google

Trong Google Cloud Console:

1. Tạo hoặc chọn một dự án Google Cloud.
2. Bật **Google Meet REST API** cho dự án đó.
3. Cấu hình màn hình đồng ý OAuth.
   - **Internal** là đơn giản nhất cho một tổ chức Google Workspace.
   - **External** hoạt động cho thiết lập cá nhân/thử nghiệm; khi ứng dụng đang ở trạng thái Testing,
     hãy thêm từng tài khoản Google sẽ ủy quyền ứng dụng làm người dùng thử nghiệm.
4. Thêm các phạm vi OpenClaw yêu cầu:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Tạo OAuth client ID.
   - Loại ứng dụng: **Web application**.
   - URI chuyển hướng được ủy quyền:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Sao chép client ID và client secret.

`meetings.space.created` là bắt buộc bởi Google Meet `spaces.create`.
`meetings.space.readonly` cho phép OpenClaw phân giải URL/mã Meet thành space.
`meetings.conference.media.readonly` dành cho kiểm tra trước Meet Media API và công việc
media; Google có thể yêu cầu đăng ký Developer Preview để dùng Media API thực tế.
Nếu bạn chỉ cần tham gia Chrome dựa trên trình duyệt, hãy bỏ qua OAuth hoàn toàn.

### Tạo refresh token

Cấu hình `oauth.clientId` và tùy chọn `oauth.clientSecret`, hoặc truyền chúng dưới dạng
biến môi trường, rồi chạy:

```bash
openclaw googlemeet auth login --json
```

Lệnh in ra một khối cấu hình `oauth` có refresh token. Nó dùng PKCE,
callback localhost tại `http://localhost:8085/oauth2callback`, và luồng
sao chép/dán thủ công với `--manual`.

Ví dụ:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Dùng chế độ thủ công khi trình duyệt không thể truy cập callback cục bộ:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Đầu ra JSON bao gồm:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Lưu đối tượng `oauth` dưới cấu hình Plugin Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Ưu tiên biến môi trường khi bạn không muốn refresh token nằm trong cấu hình.
Nếu cả giá trị cấu hình và môi trường đều hiện diện, Plugin phân giải cấu hình
trước rồi mới dùng môi trường làm dự phòng.

Đồng ý OAuth bao gồm tạo Meet space, quyền đọc Meet space, và quyền đọc media
hội nghị Meet. Nếu bạn đã xác thực trước khi hỗ trợ tạo cuộc họp
tồn tại, hãy chạy lại `openclaw googlemeet auth login --json` để refresh
token có phạm vi `meetings.space.created`.

### Xác minh OAuth bằng doctor

Chạy OAuth doctor khi bạn muốn kiểm tra tình trạng nhanh, không lộ bí mật:

```bash
openclaw googlemeet doctor --oauth --json
```

Lệnh này không tải runtime Chrome hoặc yêu cầu Node Chrome đã kết nối. Nó
kiểm tra cấu hình OAuth tồn tại và refresh token có thể tạo access
token. Báo cáo JSON chỉ bao gồm các trường trạng thái như `ok`, `configured`,
`tokenSource`, `expiresAt`, và thông báo kiểm tra; nó không in access
token, refresh token, hoặc client secret.

Kết quả thường gặp:

| Kiểm tra             | Ý nghĩa                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Có `oauth.clientId` cộng với `oauth.refreshToken`, hoặc một access token đã lưu cache.  |
| `oauth-token`        | Access token đã lưu cache vẫn hợp lệ, hoặc refresh token đã tạo access token mới.       |
| `meet-spaces-get`    | Kiểm tra `--meeting` tùy chọn đã phân giải một Meet space hiện có.                      |
| `meet-spaces-create` | Kiểm tra `--create-space` tùy chọn đã tạo một Meet space mới.                           |

Để chứng minh việc bật Google Meet API và phạm vi `spaces.create`, hãy chạy thêm
kiểm tra tạo có tác dụng phụ:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tạo một URL Meet dùng một lần. Dùng nó khi bạn cần xác nhận
rằng dự án Google Cloud đã bật Meet API và tài khoản đã ủy quyền
có phạm vi `meetings.space.created`.

Để chứng minh quyền đọc cho một meeting space hiện có:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` và `resolve-space` chứng minh quyền đọc đối với một
space hiện có mà tài khoản Google đã ủy quyền có thể truy cập. Một lỗi `403` từ các kiểm tra này
thường có nghĩa là Google Meet REST API bị tắt, refresh token đã đồng ý
thiếu phạm vi bắt buộc, hoặc tài khoản Google không thể truy cập Meet
space đó. Lỗi refresh-token có nghĩa là chạy lại `openclaw googlemeet auth login
--json` và lưu khối `oauth` mới.

Không cần thông tin xác thực OAuth cho phương án dự phòng trình duyệt. Ở chế độ đó, xác thực Google
đến từ hồ sơ Chrome đã đăng nhập trên Node đã chọn, không phải từ
cấu hình OpenClaw.

Các biến môi trường này được chấp nhận làm dự phòng:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` hoặc `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` hoặc `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` hoặc `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` hoặc `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` hoặc
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` hoặc `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` hoặc `GOOGLE_MEET_PREVIEW_ACK`

Phân giải URL Meet, mã hoặc `spaces/{id}` thông qua `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Chạy kiểm tra trước khi xử lý media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Liệt kê hiện vật cuộc họp và dữ liệu tham dự sau khi Meet đã tạo bản ghi hội nghị:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Với `--meeting`, `artifacts` và `attendance` mặc định dùng bản ghi hội nghị mới nhất. Truyền `--all-conference-records` khi bạn muốn mọi bản ghi được giữ lại cho cuộc họp đó.

Tra cứu Calendar có thể phân giải URL cuộc họp từ Google Calendar trước khi đọc hiện vật Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` tìm trong lịch `primary` hôm nay để lấy sự kiện Calendar có liên kết Google Meet. Dùng `--event <query>` để tìm văn bản sự kiện khớp, và `--calendar <id>` cho lịch không phải lịch chính. Tra cứu Calendar yêu cầu đăng nhập OAuth mới có bao gồm phạm vi chỉ đọc sự kiện Calendar. `calendar-events` xem trước các sự kiện Meet khớp và đánh dấu sự kiện mà `latest`, `artifacts`, `attendance` hoặc `export` sẽ chọn.

Nếu bạn đã biết id bản ghi hội nghị, hãy truy cập trực tiếp:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Ghi báo cáo dễ đọc:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` trả về metadata bản ghi hội nghị cùng với metadata tài nguyên người tham gia, bản ghi âm, bản chép lời, mục bản chép lời có cấu trúc và ghi chú thông minh khi Google cung cấp cho cuộc họp. Dùng `--no-transcript-entries` để bỏ qua tra cứu mục đối với các cuộc họp lớn. `attendance` mở rộng người tham gia thành các hàng phiên người tham gia với thời điểm xuất hiện đầu/cuối, tổng thời lượng phiên, cờ đến muộn/rời sớm, và các tài nguyên người tham gia trùng lặp được gộp theo người dùng đã đăng nhập hoặc tên hiển thị. Truyền `--no-merge-duplicates` để giữ riêng các tài nguyên người tham gia thô, `--late-after-minutes` để tinh chỉnh phát hiện đến muộn, và `--early-before-minutes` để tinh chỉnh phát hiện rời sớm.

`export` ghi một thư mục chứa `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` và `manifest.json`. `manifest.json` ghi lại đầu vào đã chọn, tùy chọn xuất, bản ghi hội nghị, tệp đầu ra, số lượng, nguồn token, sự kiện Calendar khi được dùng, và mọi cảnh báo truy xuất một phần. Truyền `--zip` để cũng ghi một kho lưu trữ di động bên cạnh thư mục. Truyền `--include-doc-bodies` để xuất văn bản Google Docs của bản chép lời và ghi chú thông minh được liên kết thông qua Google Drive `files.export`; thao tác này yêu cầu đăng nhập OAuth mới có bao gồm phạm vi chỉ đọc Drive Meet. Khi không có `--include-doc-bodies`, bản xuất chỉ bao gồm metadata Meet và các mục bản chép lời có cấu trúc. Nếu Google trả về lỗi hiện vật một phần, chẳng hạn lỗi liệt kê ghi chú thông minh, mục bản chép lời hoặc nội dung tài liệu Drive, phần tóm tắt và manifest giữ cảnh báo thay vì làm hỏng toàn bộ bản xuất. Dùng `--dry-run` để lấy cùng dữ liệu hiện vật/tham dự và in JSON manifest mà không tạo thư mục hoặc ZIP. Điều này hữu ích trước khi ghi một bản xuất lớn hoặc khi một tác tử chỉ cần số lượng, bản ghi được chọn và cảnh báo.

Tác tử cũng có thể tạo cùng gói thông qua công cụ `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Đặt `"dryRun": true` để chỉ trả về manifest xuất và bỏ qua ghi tệp.

Chạy kiểm thử khói live có bảo vệ với một cuộc họp thật được giữ lại:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Môi trường kiểm thử khói live:

- `OPENCLAW_LIVE_TEST=1` bật kiểm thử live có bảo vệ.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` trỏ tới URL Meet, mã hoặc `spaces/{id}` được giữ lại.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` hoặc `GOOGLE_MEET_CLIENT_ID` cung cấp id ứng dụng khách OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` hoặc `GOOGLE_MEET_REFRESH_TOKEN` cung cấp refresh token.
- Tùy chọn: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` và
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` dùng cùng tên dự phòng không có tiền tố `OPENCLAW_`.

Kiểm thử khói live hiện vật/tham dự cơ bản cần `https://www.googleapis.com/auth/meetings.space.readonly` và `https://www.googleapis.com/auth/meetings.conference.media.readonly`. Tra cứu Calendar cần `https://www.googleapis.com/auth/calendar.events.readonly`. Xuất nội dung tài liệu Drive cần `https://www.googleapis.com/auth/drive.meet.readonly`.

Tạo một không gian Meet mới:

```bash
openclaw googlemeet create
```

Lệnh in `meeting uri` mới, nguồn và phiên tham gia. Với thông tin xác thực OAuth, lệnh dùng Google Meet API chính thức. Khi không có thông tin xác thực OAuth, lệnh dùng hồ sơ trình duyệt đã đăng nhập của node Chrome được ghim làm phương án dự phòng. Tác tử có thể dùng công cụ `google_meet` với `action: "create"` để tạo và tham gia trong một bước. Để chỉ tạo URL, truyền `"join": false`.

Ví dụ đầu ra JSON từ phương án dự phòng trình duyệt:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Nếu phương án dự phòng trình duyệt gặp chặn đăng nhập Google hoặc quyền Meet trước khi có thể tạo URL, phương thức Gateway trả về phản hồi thất bại và công cụ `google_meet` trả về chi tiết có cấu trúc thay vì chuỗi thuần:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Khi một tác tử thấy `manualActionRequired: true`, tác tử nên báo cáo `manualActionMessage` cùng với ngữ cảnh node/tab trình duyệt và ngừng mở tab Meet mới cho đến khi người vận hành hoàn tất bước trên trình duyệt.

Ví dụ đầu ra JSON từ thao tác tạo qua API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Theo mặc định, tạo Meet sẽ tham gia. Phương thức truyền tải Chrome hoặc Chrome-node vẫn cần hồ sơ Google Chrome đã đăng nhập để tham gia qua trình duyệt. Nếu hồ sơ đã đăng xuất, OpenClaw báo cáo `manualActionRequired: true` hoặc lỗi phương án dự phòng trình duyệt và yêu cầu người vận hành hoàn tất đăng nhập Google trước khi thử lại.

Chỉ đặt `preview.enrollmentAcknowledged: true` sau khi xác nhận dự án Cloud, chủ thể OAuth và người tham gia cuộc họp của bạn đã được ghi danh vào Google Workspace Developer Preview Program cho API media của Meet.

## Cấu hình

Đường dẫn realtime Chrome phổ biến chỉ cần bật plugin, BlackHole, SoX và khóa nhà cung cấp giọng nói realtime backend. OpenAI là mặc định; đặt `realtime.provider: "google"` để dùng Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Đặt cấu hình plugin trong `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Mặc định:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: id/tên/IP node tùy chọn cho `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: tên dùng trên màn hình khách Meet chưa đăng nhập
- `chrome.autoJoin: true`: điền tên khách và nhấp Join Now theo nỗ lực tốt nhất thông qua tự động hóa trình duyệt OpenClaw trên `chrome-node`
- `chrome.reuseExistingTab: true`: kích hoạt tab Meet hiện có thay vì mở các tab trùng lặp
- `chrome.waitForInCallMs: 20000`: chờ tab Meet báo đang trong cuộc gọi trước khi kích hoạt lời giới thiệu realtime
- `chrome.audioFormat: "pcm16-24khz"`: định dạng âm thanh cặp lệnh. Chỉ dùng `"g711-ulaw-8khz"` cho các cặp lệnh cũ/tùy chỉnh vẫn phát âm thanh điện thoại.
- `chrome.audioInputCommand`: lệnh SoX đọc từ CoreAudio `BlackHole 2ch` và ghi âm thanh ở `chrome.audioFormat`
- `chrome.audioOutputCommand`: lệnh SoX đọc âm thanh ở `chrome.audioFormat` và ghi vào CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: lệnh micro cục bộ tùy chọn ghi PCM mono little-endian 16-bit có dấu để phát hiện người nói chen vào trong khi phát lại trợ lý đang hoạt động. Hiện tính năng này áp dụng cho cầu nối cặp lệnh `chrome` do Gateway lưu trữ.
- `chrome.bargeInRmsThreshold: 650`: mức RMS được tính là người chen ngang trên `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: mức đỉnh được tính là người chen ngang trên `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: độ trễ tối thiểu giữa các lần xóa chen ngang của người dùng lặp lại
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: phản hồi nói ngắn gọn, với `openclaw_agent_consult` cho câu trả lời sâu hơn
- `realtime.introMessage`: kiểm tra sẵn sàng bằng lời nói ngắn khi cầu nối realtime kết nối; đặt thành `""` để tham gia im lặng
- `realtime.agentId`: id tác tử OpenClaw tùy chọn cho `openclaw_agent_consult`; mặc định là `main`

Ghi đè tùy chọn:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Cấu hình chỉ dùng Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` mặc định là `true`; với phương thức vận chuyển Twilio, nó ủy quyền cuộc gọi PSTN thực tế, DTMF và lời chào mở đầu cho Plugin Voice Call. Voice Call phát chuỗi DTMF trước khi mở luồng phương tiện thời gian thực, sau đó dùng văn bản giới thiệu đã lưu làm lời chào thời gian thực ban đầu. Nếu `voice-call` không được bật, Google Meet vẫn có thể xác thực và ghi lại kế hoạch quay số, nhưng không thể thực hiện cuộc gọi Twilio.

## Công cụ

Tác tử có thể dùng công cụ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Dùng `transport: "chrome"` khi Chrome chạy trên máy chủ Gateway. Dùng `transport: "chrome-node"` khi Chrome chạy trên một node đã ghép đôi, chẳng hạn như VM Parallels. Trong cả hai trường hợp, mô hình thời gian thực và `openclaw_agent_consult` chạy trên máy chủ Gateway, nên thông tin xác thực mô hình vẫn ở đó.

Dùng `action: "status"` để liệt kê các phiên đang hoạt động hoặc kiểm tra một ID phiên. Dùng `action: "speak"` với `sessionId` và `message` để khiến tác tử thời gian thực nói ngay lập tức. Dùng `action: "test_speech"` để tạo hoặc dùng lại phiên, kích hoạt một cụm từ đã biết và trả về tình trạng `inCall` khi máy chủ Chrome có thể báo cáo. `test_speech` luôn buộc `mode: "realtime"` và thất bại nếu được yêu cầu chạy trong `mode: "transcribe"` vì các phiên chỉ quan sát cố ý không thể phát lời nói. Kết quả `speechOutputVerified` của nó dựa trên việc byte đầu ra âm thanh thời gian thực tăng trong cuộc gọi kiểm thử này, nên một phiên được dùng lại có âm thanh cũ hơn không được tính là một lần kiểm tra nói thành công mới. Dùng `action: "leave"` để đánh dấu một phiên đã kết thúc.

`status` bao gồm tình trạng Chrome khi có:

- `inCall`: Chrome có vẻ đang ở trong cuộc gọi Meet
- `micMuted`: trạng thái micrô Meet theo best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: hồ sơ trình duyệt cần đăng nhập thủ công, được máy chủ Meet chấp nhận, cấp quyền hoặc sửa điều khiển trình duyệt trước khi lời nói có thể hoạt động
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: liệu lời nói Chrome được quản lý hiện có được phép hay không. `speechReady: false` nghĩa là OpenClaw không gửi cụm từ giới thiệu/kiểm thử vào cầu nối âm thanh.
- `providerConnected` / `realtimeReady`: trạng thái cầu nối thoại thời gian thực
- `lastInputAt` / `lastOutputAt`: âm thanh cuối cùng được thấy từ hoặc gửi đến cầu nối
- `lastSuppressedInputAt` / `suppressedInputBytes`: đầu vào loopback bị bỏ qua trong khi phát lại của trợ lý đang hoạt động

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Tham vấn tác tử thời gian thực

Chế độ Chrome thời gian thực được tối ưu hóa cho vòng lặp thoại trực tiếp. Nhà cung cấp thoại thời gian thực nghe âm thanh cuộc họp và nói qua cầu nối âm thanh đã cấu hình. Khi mô hình thời gian thực cần suy luận sâu hơn, thông tin hiện tại hoặc các công cụ OpenClaw thông thường, nó có thể gọi `openclaw_agent_consult`.

Công cụ tham vấn chạy tác tử OpenClaw thông thường ở hậu trường với ngữ cảnh bản chép lời cuộc họp gần đây và trả về một câu trả lời ngắn gọn để nói cho phiên thoại thời gian thực. Sau đó mô hình thoại có thể nói câu trả lời đó trở lại cuộc họp. Nó dùng cùng công cụ tham vấn thời gian thực dùng chung như Voice Call.

Theo mặc định, các tham vấn chạy với tác tử `main`. Đặt `realtime.agentId` khi một làn Meet cần tham vấn một không gian làm việc tác tử OpenClaw chuyên dụng, mặc định mô hình, chính sách công cụ, bộ nhớ và lịch sử phiên.

`realtime.toolPolicy` kiểm soát lần chạy tham vấn:

- `safe-read-only`: hiển thị công cụ tham vấn và giới hạn tác tử thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` và `memory_get`.
- `owner`: hiển thị công cụ tham vấn và cho phép tác tử thông thường dùng chính sách công cụ tác tử bình thường.
- `none`: không hiển thị công cụ tham vấn cho mô hình thoại thời gian thực.

Khóa phiên tham vấn được giới hạn theo từng phiên Meet, nên các lệnh gọi tham vấn tiếp theo có thể dùng lại ngữ cảnh tham vấn trước đó trong cùng cuộc họp.

Để buộc kiểm tra sẵn sàng bằng giọng nói sau khi Chrome đã tham gia hoàn toàn cuộc gọi:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Đối với smoke tham gia và nói đầy đủ:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Danh sách kiểm tra kiểm thử trực tiếp

Dùng trình tự này trước khi giao cuộc họp cho một tác tử không có người giám sát:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Trạng thái Chrome-node dự kiến:

- `googlemeet setup` đều xanh.
- `googlemeet setup` bao gồm `chrome-node-connected` khi Chrome-node là phương thức vận chuyển mặc định hoặc một node được ghim.
- `nodes status` hiển thị node đã chọn đang kết nối.
- Node đã chọn quảng bá cả `googlemeet.chrome` và `browser.proxy`.
- Thẻ Meet tham gia cuộc gọi và `test-speech` trả về tình trạng Chrome với `inCall: true`.

Đối với máy chủ Chrome từ xa như VM Parallels macOS, đây là kiểm tra an toàn ngắn nhất sau khi cập nhật Gateway hoặc VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Điều đó chứng minh Plugin Gateway đã được tải, node VM được kết nối bằng token hiện tại và cầu nối âm thanh Meet có sẵn trước khi tác tử mở một thẻ cuộc họp thật.

Đối với smoke Twilio, dùng một cuộc họp hiển thị chi tiết quay số điện thoại:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Trạng thái Twilio dự kiến:

- `googlemeet setup` bao gồm các kiểm tra xanh `twilio-voice-call-plugin`, `twilio-voice-call-credentials` và `twilio-voice-call-webhook`.
- `voicecall` có sẵn trong CLI sau khi Gateway tải lại.
- Phiên được trả về có `transport: "twilio"` và một `twilio.voiceCallId`.
- `openclaw logs --follow` hiển thị TwiML DTMF được phục vụ trước TwiML thời gian thực, sau đó là một cầu nối thời gian thực với lời chào ban đầu được xếp hàng.
- `googlemeet leave <sessionId>` gác máy cuộc gọi thoại được ủy quyền.

## Khắc phục sự cố

### Tác tử không thấy công cụ Google Meet

Xác nhận Plugin đã được bật trong cấu hình Gateway và tải lại Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Nếu bạn vừa chỉnh sửa `plugins.entries.google-meet`, hãy khởi động lại hoặc tải lại Gateway. Tác tử đang chạy chỉ thấy các công cụ Plugin được đăng ký bởi tiến trình Gateway hiện tại.

### Không có node hỗ trợ Google Meet nào được kết nối

Trên máy chủ node, chạy:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Trên máy chủ Gateway, phê duyệt node và xác minh lệnh:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node phải được kết nối và liệt kê `googlemeet.chrome` cùng với `browser.proxy`. Cấu hình Gateway phải cho phép các lệnh node đó:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Nếu `googlemeet setup` thất bại ở `chrome-node-connected` hoặc nhật ký Gateway báo cáo `gateway token mismatch`, hãy cài đặt lại hoặc khởi động lại node bằng token Gateway hiện tại. Đối với Gateway LAN, điều này thường nghĩa là:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Sau đó tải lại dịch vụ node và chạy lại:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Trình duyệt mở nhưng tác tử không thể tham gia

Chạy `googlemeet test-speech` và kiểm tra tình trạng Chrome được trả về. Nếu nó báo cáo `manualActionRequired: true`, hãy hiển thị `manualActionMessage` cho người vận hành và ngừng thử lại cho đến khi hành động trình duyệt hoàn tất.

Các hành động thủ công phổ biến:

- Đăng nhập vào hồ sơ Chrome.
- Chấp nhận khách từ tài khoản máy chủ Meet.
- Cấp quyền micrô/camera cho Chrome khi lời nhắc quyền gốc của Chrome xuất hiện.
- Đóng hoặc sửa hộp thoại quyền Meet bị kẹt.

Đừng báo cáo "chưa đăng nhập" chỉ vì Meet hiển thị "Bạn có muốn mọi người nghe thấy bạn trong cuộc họp không?" Đó là màn hình xen kẽ chọn âm thanh của Meet; OpenClaw nhấp **Sử dụng micrô** thông qua tự động hóa trình duyệt khi có sẵn và tiếp tục chờ trạng thái cuộc họp thật. Đối với dự phòng trình duyệt chỉ tạo, OpenClaw có thể nhấp **Tiếp tục không dùng micrô** vì việc tạo URL không cần đường dẫn âm thanh thời gian thực.

### Tạo cuộc họp thất bại

`googlemeet create` trước tiên dùng endpoint `spaces.create` của Google Meet API khi thông tin xác thực OAuth được cấu hình. Không có thông tin xác thực OAuth, nó chuyển sang dự phòng trình duyệt node Chrome đã ghim. Xác nhận:

- Đối với tạo qua API: `oauth.clientId` và `oauth.refreshToken` được cấu hình, hoặc các biến môi trường `OPENCLAW_GOOGLE_MEET_*` tương ứng có mặt.
- Đối với tạo qua API: token làm mới được phát hành sau khi hỗ trợ tạo được thêm. Token cũ hơn có thể thiếu phạm vi `meetings.space.created`; chạy lại `openclaw googlemeet auth login --json` và cập nhật cấu hình Plugin.
- Đối với dự phòng trình duyệt: `defaultTransport: "chrome-node"` và `chromeNode.node` trỏ đến một node đã kết nối có `browser.proxy` và `googlemeet.chrome`.
- Đối với dự phòng trình duyệt: hồ sơ Chrome OpenClaw trên node đó đã đăng nhập vào Google và có thể mở `https://meet.google.com/new`.
- Đối với dự phòng trình duyệt: các lần thử lại dùng lại một `https://meet.google.com/new` hiện có hoặc thẻ nhắc tài khoản Google trước khi mở thẻ mới. Nếu tác tử hết thời gian chờ, hãy thử lại lệnh gọi công cụ thay vì mở thủ công một thẻ Meet khác.
- Đối với dự phòng trình duyệt: nếu công cụ trả về `manualActionRequired: true`, hãy dùng `browser.nodeId`, `browser.targetId`, `browserUrl` và `manualActionMessage` được trả về để hướng dẫn người vận hành. Đừng thử lại trong vòng lặp cho đến khi hành động đó hoàn tất.
- Đối với dự phòng trình duyệt: nếu Meet hiển thị "Bạn có muốn mọi người nghe thấy bạn trong cuộc họp không?", hãy để thẻ mở. OpenClaw nên nhấp **Sử dụng micrô** hoặc, đối với dự phòng chỉ tạo, **Tiếp tục không dùng micrô** thông qua tự động hóa trình duyệt và tiếp tục chờ URL Meet được tạo. Nếu không thể, lỗi nên đề cập đến `meet-audio-choice-required`, không phải `google-login-required`.

### Tác tử tham gia nhưng không nói

Kiểm tra đường dẫn thời gian thực:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dùng `mode: "realtime"` cho nghe/phản hồi bằng giọng nói. `mode: "transcribe"` cố ý không khởi động cầu nối giọng nói song công thời gian thực. `googlemeet test-speech` luôn kiểm tra đường dẫn thời gian thực và báo cáo liệu các byte đầu ra của cầu nối có được quan sát cho lần gọi đó hay không. Nếu `speechOutputVerified` là false và `speechOutputTimedOut` là true, nhà cung cấp thời gian thực có thể đã chấp nhận phát ngôn nhưng OpenClaw không thấy byte đầu ra mới đi tới cầu nối âm thanh Chrome.

Cũng hãy xác minh:

- Khóa nhà cung cấp thời gian thực có sẵn trên máy chủ Gateway, chẳng hạn như
  `OPENAI_API_KEY` hoặc `GEMINI_API_KEY`.
- `BlackHole 2ch` hiển thị trên máy chủ Chrome.
- `sox` tồn tại trên máy chủ Chrome.
- Micro và loa Meet được định tuyến qua đường dẫn âm thanh ảo mà
  OpenClaw sử dụng.

`googlemeet doctor [session-id]` in phiên, node, trạng thái trong cuộc gọi,
lý do thao tác thủ công, kết nối nhà cung cấp thời gian thực, `realtimeReady`,
hoạt động đầu vào/đầu ra âm thanh, dấu thời gian âm thanh gần nhất, bộ đếm byte
và URL trình duyệt. Dùng `googlemeet status [session-id] --json` khi bạn cần JSON thô. Dùng
`googlemeet doctor --oauth` khi bạn cần xác minh làm mới OAuth Google Meet
mà không làm lộ token; thêm `--meeting` hoặc `--create-space` khi bạn cũng cần
bằng chứng Google Meet API.

Nếu một agent hết thời gian chờ và bạn thấy một tab Meet đã mở sẵn, hãy kiểm tra tab đó
mà không mở tab khác:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Thao tác công cụ tương đương là `recover_current_tab`. Nó tập trung và kiểm tra một
tab Meet hiện có cho phương thức truyền tải đã chọn. Với `chrome`, nó dùng điều khiển
trình duyệt cục bộ qua Gateway; với `chrome-node`, nó dùng node Chrome đã cấu hình.
Nó không mở tab mới hoặc tạo phiên mới; nó báo cáo yếu tố chặn hiện tại,
chẳng hạn như đăng nhập, cho phép vào, quyền hoặc trạng thái chọn âm thanh.
Lệnh CLI nói chuyện với Gateway đã cấu hình, nên Gateway phải đang chạy;
`chrome-node` cũng yêu cầu node Chrome đã kết nối.

### Kiểm tra thiết lập Twilio thất bại

`twilio-voice-call-plugin` thất bại khi `voice-call` không được cho phép hoặc chưa được bật.
Thêm nó vào `plugins.allow`, bật `plugins.entries.voice-call`, rồi tải lại
Gateway.

`twilio-voice-call-credentials` thất bại khi backend Twilio thiếu account
SID, auth token hoặc số gọi đi. Đặt các biến này trên máy chủ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` thất bại khi `voice-call` không có Webhook công khai
hoặc khi `publicUrl` trỏ tới loopback hoặc không gian mạng riêng.
Đặt `plugins.entries.voice-call.config.publicUrl` thành URL nhà cung cấp công khai hoặc
cấu hình một tunnel/Tailscale exposure cho `voice-call`.

URL loopback và URL riêng không hợp lệ cho callback của nhà mạng. Không dùng
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, hoặc `fd00::/8` làm `publicUrl`.

Cho một URL công khai ổn định:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

Cho phát triển cục bộ, hãy dùng tunnel hoặc Tailscale exposure thay vì URL máy chủ riêng:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Sau đó khởi động lại hoặc tải lại Gateway và chạy:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` mặc định chỉ kiểm tra trạng thái sẵn sàng. Để chạy thử cho một số cụ thể:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Chỉ thêm `--yes` khi bạn cố ý muốn thực hiện một cuộc gọi thông báo đi trực tiếp:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Cuộc gọi Twilio bắt đầu nhưng không bao giờ vào cuộc họp

Xác nhận sự kiện Meet có hiển thị chi tiết quay số vào bằng điện thoại. Truyền đúng số quay vào
và mã PIN hoặc một chuỗi DTMF tùy chỉnh:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Dùng `w` ở đầu hoặc dấu phẩy trong `--dtmf-sequence` nếu nhà cung cấp cần tạm dừng
trước khi nhập mã PIN.

Nếu cuộc gọi điện thoại được tạo nhưng danh sách người tham gia Meet không bao giờ hiển thị
người tham gia quay vào:

- Chạy `openclaw voicecall status --call-id <id>` và xác nhận cuộc gọi vẫn
  đang hoạt động.
- Chạy `openclaw voicecall tail` và kiểm tra rằng Webhook Twilio đang tới
  Gateway.
- Chạy `openclaw logs --follow` và tìm chuỗi Twilio Meet: Google
  Meet ủy quyền thao tác tham gia, Voice Call lưu TwiML DTMF trước kết nối,
  phục vụ TwiML ban đầu đó, sau đó phục vụ TwiML thời gian thực và khởi động cầu nối thời gian thực
  với `initialGreeting=queued`.
- Chạy lại `openclaw googlemeet setup --transport twilio`; kiểm tra thiết lập xanh là
  bắt buộc nhưng không chứng minh chuỗi mã PIN cuộc họp là đúng.
- Xác nhận số quay vào thuộc cùng lời mời Meet và cùng vùng với
  mã PIN.
- Tăng số lần tạm dừng ở đầu trong `--dtmf-sequence` nếu Meet trả lời chậm, ví dụ
  `wwww123456#`.
- Nếu người tham gia vào được nhưng bạn không nghe lời chào, hãy kiểm tra
  `openclaw logs --follow` để tìm TwiML thời gian thực, khởi động cầu nối thời gian thực và
  `initialGreeting=queued`. Lời chào được tạo từ thông điệp
  `voicecall.start` ban đầu sau khi cầu nối thời gian thực kết nối.

Nếu Webhook không tới, hãy gỡ lỗi Plugin Voice Call trước: nhà cung cấp phải
truy cập được `plugins.entries.voice-call.config.publicUrl` hoặc tunnel đã cấu hình.
Xem [Khắc phục sự cố cuộc gọi thoại](/vi/plugins/voice-call#troubleshooting).

## Ghi chú

API phương tiện chính thức của Google Meet thiên về nhận, nên việc nói vào một cuộc gọi Meet
vẫn cần một đường dẫn người tham gia. Plugin này giữ rõ ranh giới đó:
Chrome xử lý việc tham gia bằng trình duyệt và định tuyến âm thanh cục bộ; Twilio xử lý
việc tham gia bằng quay số điện thoại.

Chế độ thời gian thực của Chrome cần `BlackHole 2ch` cộng với một trong hai:

- `chrome.audioInputCommand` cộng với `chrome.audioOutputCommand`: OpenClaw sở hữu
  cầu nối mô hình thời gian thực và truyền âm thanh ở `chrome.audioFormat` giữa các
  lệnh đó và nhà cung cấp giọng nói thời gian thực đã chọn. Đường dẫn Chrome mặc định là
  PCM16 24 kHz; G.711 mu-law 8 kHz vẫn có sẵn cho các cặp lệnh cũ.
- `chrome.audioBridgeCommand`: một lệnh cầu nối bên ngoài sở hữu toàn bộ
  đường dẫn âm thanh cục bộ và phải thoát sau khi khởi động hoặc xác thực daemon của nó.

Để có âm thanh song công sạch, hãy định tuyến đầu ra Meet và micro Meet qua các
thiết bị ảo riêng biệt hoặc một đồ thị thiết bị ảo kiểu Loopback. Một thiết bị
BlackHole dùng chung duy nhất có thể dội âm những người tham gia khác trở lại cuộc gọi.

Với cầu nối Chrome dạng cặp lệnh, `chrome.bargeInInputCommand` có thể lắng nghe một
micro cục bộ riêng và xóa phần phát lại của trợ lý khi con người bắt đầu
nói. Điều này giữ lời nói của con người đi trước đầu ra của trợ lý ngay cả khi đầu vào
local loopback BlackHole dùng chung tạm thời bị chặn trong lúc trợ lý phát lại.
Giống như `chrome.audioInputCommand` và `chrome.audioOutputCommand`, đây là một
lệnh cục bộ do người vận hành cấu hình. Hãy dùng một đường dẫn lệnh tin cậy rõ ràng hoặc
danh sách đối số, và không trỏ nó tới các script từ vị trí không đáng tin cậy.

`googlemeet speak` kích hoạt cầu nối âm thanh thời gian thực đang hoạt động cho một phiên Chrome.
`googlemeet leave` dừng cầu nối đó. Với các phiên Twilio được ủy quyền
qua Plugin Voice Call, `leave` cũng gác máy cuộc gọi thoại bên dưới.

## Liên quan

- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
- [Chế độ nói](/vi/nodes/talk)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
