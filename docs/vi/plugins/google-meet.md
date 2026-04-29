---
read_when:
    - Bạn muốn một tác nhân OpenClaw tham gia cuộc gọi Google Meet
    - Bạn muốn một tác nhân OpenClaw tạo một cuộc gọi Google Meet mới
    - Bạn đang cấu hình Chrome, nút Chrome hoặc Twilio làm phương thức truyền tải Google Meet
summary: 'Plugin Google Meet: tham gia các URL Meet rõ ràng qua Chrome hoặc Twilio với các mặc định thoại thời gian thực'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-29T23:00:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 09779496b4aad3c854937dfeb69966372dd1a61eaafcf9da06831fa4bad8f34d
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet hỗ trợ người tham gia cho OpenClaw — Plugin được thiết kế rõ ràng có chủ đích:

- Nó chỉ tham gia một URL `https://meet.google.com/...` rõ ràng.
- Nó có thể tạo một không gian Meet mới thông qua Google Meet API, rồi tham gia
  URL được trả về.
- Giọng nói thời gian thực là chế độ mặc định.
- Giọng nói thời gian thực có thể gọi ngược vào toàn bộ tác tử OpenClaw khi cần
  suy luận sâu hơn hoặc công cụ.
- Tác tử chọn hành vi tham gia bằng `mode`: dùng `realtime` để nghe/nói lại trực
  tiếp, hoặc `transcribe` để tham gia/điều khiển trình duyệt mà không có cầu nối
  giọng nói thời gian thực.
- Xác thực bắt đầu bằng Google OAuth cá nhân hoặc một hồ sơ Chrome đã đăng nhập.
- Không có thông báo đồng ý tự động.
- Backend âm thanh Chrome mặc định là `BlackHole 2ch`.
- Chrome có thể chạy cục bộ hoặc trên một máy chủ node đã ghép nối.
- Twilio chấp nhận một số quay vào cùng PIN hoặc chuỗi DTMF tùy chọn.
- Lệnh CLI là `googlemeet`; `meet` được dành cho các quy trình hội nghị từ xa
  rộng hơn của tác tử.

## Bắt đầu nhanh

Cài đặt các phụ thuộc âm thanh cục bộ và cấu hình một nhà cung cấp giọng nói
thời gian thực ở backend. OpenAI là mặc định; Google Gemini Live cũng hoạt động
với `realtime.provider: "google"`:

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

Đầu ra thiết lập được thiết kế để tác tử đọc được và nhận biết chế độ. Nó báo
cáo hồ sơ Chrome, việc ghim node, và, đối với lượt tham gia Chrome thời gian
thực, cầu nối âm thanh BlackHole/SoX cùng các kiểm tra phần giới thiệu thời gian
thực bị trì hoãn. Đối với lượt tham gia chỉ quan sát, kiểm tra cùng transport
bằng `--mode transcribe`; chế độ đó bỏ qua các điều kiện tiên quyết về âm thanh
thời gian thực vì nó không nghe qua hoặc nói qua cầu nối:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Khi cấu hình ủy quyền Twilio, thiết lập cũng báo cáo liệu Plugin `voice-call` và
thông tin xác thực Twilio đã sẵn sàng hay chưa. Xem mọi kiểm tra `ok: false` là
một điểm chặn cho transport và chế độ đang được kiểm tra trước khi yêu cầu tác
tử tham gia. Dùng `openclaw googlemeet setup --json` cho script hoặc đầu ra máy
đọc được. Dùng `--transport chrome`, `--transport chrome-node`, hoặc `--transport twilio`
để kiểm tra trước một transport cụ thể trước khi tác tử thử dùng nó.

Tham gia cuộc họp:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Hoặc để tác tử tham gia thông qua công cụ `google_meet`:

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

- Tạo bằng API: được dùng khi thông tin xác thực Google Meet OAuth đã được cấu
  hình. Đây là đường dẫn xác định nhất và không phụ thuộc vào trạng thái giao
  diện trình duyệt.
- Dự phòng bằng trình duyệt: được dùng khi không có thông tin xác thực OAuth.
  OpenClaw dùng node Chrome đã ghim, mở `https://meet.google.com/new`, chờ Google
  chuyển hướng đến một URL mã cuộc họp thật, rồi trả về URL đó. Đường dẫn này
  yêu cầu hồ sơ Chrome OpenClaw trên node đã đăng nhập vào Google.
  Tự động hóa trình duyệt xử lý lời nhắc micrô lần chạy đầu của riêng Meet; lời
  nhắc đó không được xem là lỗi đăng nhập Google.
  Các luồng tham gia và tạo cũng cố gắng tái sử dụng một tab Meet hiện có trước
  khi mở tab mới. Việc khớp bỏ qua các chuỗi truy vấn URL vô hại như `authuser`,
  nên lần thử lại của tác tử nên tập trung vào cuộc họp đã mở thay vì tạo tab
  Chrome thứ hai.

Đầu ra lệnh/công cụ bao gồm trường `source` (`api` hoặc `browser`) để tác tử có
thể giải thích đường dẫn nào đã được dùng. `create` tham gia cuộc họp mới theo
mặc định và trả về `joined: true` cùng phiên tham gia. Để chỉ phát hành URL, dùng
`create --no-join` trên CLI hoặc truyền `"join": false` vào công cụ.

Hoặc nói với tác tử: "Tạo một Google Meet, tham gia bằng giọng nói thời gian
thực, và gửi cho tôi liên kết." Tác tử nên gọi `google_meet` với
`action: "create"` rồi chia sẻ `meetingUri` được trả về.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Đối với lượt tham gia chỉ quan sát/điều khiển trình duyệt, đặt `"mode": "transcribe"`.
Việc đó không khởi động cầu nối mô hình thời gian thực song công, không yêu cầu
BlackHole hoặc SoX, và sẽ không nói lại vào cuộc họp. Lượt tham gia Chrome ở chế
độ này cũng tránh cấp quyền micrô/máy ảnh của OpenClaw và tránh đường dẫn **Use
microphone** của Meet. Nếu Meet hiển thị màn hình xen kẽ chọn âm thanh, tự động
hóa sẽ thử đường dẫn không dùng micrô và nếu không được thì báo một hành động thủ
công thay vì mở micrô cục bộ.

Trong các phiên thời gian thực, trạng thái `google_meet` bao gồm tình trạng
trình duyệt và cầu nối âm thanh như `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`,
dấu thời gian đầu vào/đầu ra gần nhất, bộ đếm byte, và trạng thái cầu nối đã
đóng. Nếu một lời nhắc trang Meet an toàn xuất hiện, tự động hóa trình duyệt sẽ
xử lý khi có thể. Lời nhắc đăng nhập, cho phép từ chủ trì, và quyền trình
duyệt/OS được báo cáo là hành động thủ công kèm lý do và thông điệp để tác tử
chuyển tiếp.

Lượt tham gia Chrome cục bộ đi qua hồ sơ trình duyệt OpenClaw đã đăng nhập. Chế
độ thời gian thực yêu cầu `BlackHole 2ch` cho đường dẫn micrô/loa mà OpenClaw
dùng. Để có âm thanh song công sạch, dùng các thiết bị ảo riêng biệt hoặc một đồ
thị kiểu Loopback; một thiết bị BlackHole duy nhất là đủ cho kiểm thử khói đầu
tiên nhưng có thể tạo tiếng vọng.

### Gateway cục bộ + Parallels Chrome

Bạn **không** cần một OpenClaw Gateway đầy đủ hoặc khóa API mô hình bên trong VM
macOS chỉ để VM sở hữu Chrome. Chạy Gateway và tác tử cục bộ, rồi chạy một máy
chủ node trong VM. Bật Plugin đi kèm trên VM một lần để node quảng bá lệnh
Chrome:

Thứ chạy ở từng nơi:

- Máy chủ Gateway: OpenClaw Gateway, workspace của tác tử, khóa model/API, nhà
  cung cấp thời gian thực, và cấu hình Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/máy chủ node, Google Chrome, SoX, BlackHole 2ch,
  và hồ sơ Chrome đã đăng nhập vào Google.
- Không cần trong VM: dịch vụ Gateway, cấu hình tác tử, khóa OpenAI/GPT, hoặc
  thiết lập nhà cung cấp mô hình.

Cài đặt các phụ thuộc của VM:

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
plaintext trừ khi bạn chủ động bật cho mạng riêng đáng tin cậy đó:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Dùng cùng biến môi trường khi cài node làm LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` là môi trường của tiến trình, không phải
một thiết lập `openclaw.json`. `openclaw node install` lưu nó trong môi trường
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

hoặc yêu cầu tác tử dùng công cụ `google_meet` với `transport: "chrome-node"`.

Đối với kiểm thử khói một lệnh để tạo hoặc tái sử dụng phiên, nói một cụm từ đã
biết, và in tình trạng phiên:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Trong khi tham gia thời gian thực, tự động hóa trình duyệt OpenClaw điền tên
khách, nhấp Join/Ask to join, và chấp nhận lựa chọn "Use microphone" lần chạy
đầu của Meet khi lời nhắc đó xuất hiện. Trong khi tham gia chỉ quan sát hoặc tạo
cuộc họp chỉ bằng trình duyệt, nó tiếp tục qua cùng lời nhắc mà không dùng micrô
khi lựa chọn đó có sẵn. Nếu hồ sơ trình duyệt chưa đăng nhập, Meet đang chờ chủ
trì cho phép, Chrome cần quyền micrô/máy ảnh cho lượt tham gia thời gian thực,
hoặc Meet bị kẹt ở một lời nhắc mà tự động hóa không thể xử lý, kết quả
join/test-speech báo cáo `manualActionRequired: true` với `manualActionReason` và
`manualActionMessage`. Tác tử nên ngừng thử tham gia lại, báo cáo đúng thông điệp
đó cộng với `browserUrl`/`browserTitle` hiện tại, và chỉ thử lại sau khi hành động
thủ công trong trình duyệt hoàn tất.

Nếu bỏ qua `chromeNode.node`, OpenClaw chỉ tự động chọn khi đúng một node đã kết
nối quảng bá cả `googlemeet.chrome` lẫn điều khiển trình duyệt. Nếu nhiều node có
năng lực được kết nối, đặt `chromeNode.node` thành id node, tên hiển thị, hoặc IP
từ xa.

Các kiểm tra lỗi thường gặp:

- `Configured Google Meet node ... is not usable: offline`: node đã ghim được
  Gateway biết đến nhưng không khả dụng. Tác tử nên xem node đó là trạng thái
  chẩn đoán, không phải máy chủ Chrome có thể dùng, và báo cáo điểm chặn thiết
  lập thay vì dự phòng sang transport khác trừ khi người dùng yêu cầu như vậy.
- `No connected Google Meet-capable node`: khởi động `openclaw node run` trong VM,
  phê duyệt ghép nối, và bảo đảm `openclaw plugins enable google-meet` cùng
  `openclaw plugins enable browser` đã được chạy trong VM. Đồng thời xác nhận máy
  chủ Gateway cho phép cả hai lệnh node bằng
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: cài `blackhole-2ch` trên máy chủ đang
  được kiểm tra và khởi động lại trước khi dùng âm thanh Chrome cục bộ.
- `BlackHole 2ch audio device not found on the node`: cài `blackhole-2ch`
  trong VM và khởi động lại VM.
- Chrome mở nhưng không thể tham gia: đăng nhập vào hồ sơ trình duyệt bên trong
  VM, hoặc giữ `chrome.guestName` được đặt cho tham gia với tư cách khách. Tự
  động tham gia với tư cách khách dùng tự động hóa trình duyệt OpenClaw thông qua
  proxy trình duyệt node; hãy bảo đảm cấu hình trình duyệt node trỏ đến hồ sơ bạn
  muốn, ví dụ `browser.defaultProfile: "user"` hoặc một hồ sơ phiên hiện có có tên.
- Tab Meet trùng lặp: giữ `chrome.reuseExistingTab: true` được bật. OpenClaw kích
  hoạt một tab hiện có cho cùng URL Meet trước khi mở tab mới, và việc tạo cuộc
  họp bằng trình duyệt tái sử dụng một tab `https://meet.google.com/new` đang
  diễn ra hoặc tab lời nhắc tài khoản Google trước khi mở tab khác.
- Không có âm thanh: trong Meet, định tuyến micrô/loa qua đường dẫn thiết bị âm
  thanh ảo mà OpenClaw dùng; dùng các thiết bị ảo riêng biệt hoặc định tuyến kiểu
  Loopback để có âm thanh song công sạch.

## Ghi chú cài đặt

Mặc định realtime của Chrome sử dụng hai công cụ bên ngoài:

- `sox`: tiện ích âm thanh dòng lệnh. Plugin sử dụng các lệnh thiết bị CoreAudio
  rõ ràng cho cầu nối âm thanh PCM16 24 kHz mặc định.
- `blackhole-2ch`: trình điều khiển âm thanh ảo của macOS. Nó tạo thiết bị âm thanh `BlackHole 2ch`
  mà Chrome/Meet có thể định tuyến qua.

OpenClaw không đóng gói hoặc phân phối lại bất kỳ gói nào trong hai gói này. Tài liệu yêu cầu người dùng
cài đặt chúng như các phụ thuộc của máy chủ thông qua Homebrew. SoX được cấp phép theo
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole là GPL-3.0. Nếu bạn xây dựng một
trình cài đặt hoặc thiết bị đóng gói BlackHole cùng với OpenClaw, hãy xem xét các
điều khoản cấp phép upstream của BlackHole hoặc lấy giấy phép riêng từ Existential Audio.

## Phương thức truyền

### Chrome

Phương thức truyền Chrome mở URL Meet thông qua điều khiển trình duyệt OpenClaw và tham gia
bằng hồ sơ trình duyệt OpenClaw đã đăng nhập. Trên macOS, Plugin kiểm tra
`BlackHole 2ch` trước khi khởi chạy. Nếu được cấu hình, nó cũng chạy một lệnh
kiểm tra sức khỏe cầu nối âm thanh và lệnh khởi động trước khi mở Chrome. Dùng `chrome` khi
Chrome/âm thanh chạy trên máy chủ Gateway; dùng `chrome-node` khi Chrome/âm thanh chạy
trên một node đã ghép nối, chẳng hạn như VM macOS Parallels. Với Chrome cục bộ, chọn
hồ sơ bằng `browser.defaultProfile`; `chrome.browserProfile` được truyền đến
máy chủ `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Định tuyến âm thanh micro và loa của Chrome qua cầu nối âm thanh OpenClaw cục bộ.
Nếu chưa cài đặt `BlackHole 2ch`, thao tác tham gia sẽ thất bại với lỗi thiết lập
thay vì âm thầm tham gia mà không có đường dẫn âm thanh.

### Twilio

Phương thức truyền Twilio là một kế hoạch quay số nghiêm ngặt được ủy quyền cho Plugin Voice Call. Nó
không phân tích trang Meet để tìm số điện thoại.

Dùng cách này khi không thể tham gia bằng Chrome hoặc khi bạn muốn một phương án dự phòng
quay số điện thoại. Google Meet phải cung cấp số điện thoại quay vào và mã PIN cho
cuộc họp; OpenClaw không tự phát hiện các thông tin đó từ trang Meet.

Bật Plugin Voice Call trên máy chủ Gateway, không phải trên node Chrome:

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

Cung cấp thông tin đăng nhập Twilio qua môi trường hoặc cấu hình. Môi trường giúp
giữ bí mật không nằm trong `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Khởi động lại hoặc tải lại Gateway sau khi bật `voice-call`; các thay đổi cấu hình Plugin
không xuất hiện trong một tiến trình Gateway đang chạy cho đến khi tiến trình đó tải lại.

Sau đó xác minh:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Khi ủy quyền Twilio được nối đúng, `googlemeet setup` bao gồm các kiểm tra
`twilio-voice-call-plugin` và `twilio-voice-call-credentials` thành công.

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

OAuth là tùy chọn khi tạo liên kết Meet vì `googlemeet create` có thể dự phòng
sang tự động hóa trình duyệt. Cấu hình OAuth khi bạn muốn tạo bằng API chính thức,
phân giải không gian, hoặc kiểm tra trước Meet Media API.

Quyền truy cập Google Meet API sử dụng OAuth người dùng: tạo một ứng dụng khách OAuth Google Cloud,
yêu cầu các phạm vi cần thiết, ủy quyền một tài khoản Google, sau đó lưu
refresh token thu được trong cấu hình Plugin Google Meet hoặc cung cấp các
biến môi trường `OPENCLAW_GOOGLE_MEET_*`.

OAuth không thay thế đường dẫn tham gia bằng Chrome. Các phương thức truyền Chrome và Chrome-node
vẫn tham gia thông qua một hồ sơ Chrome đã đăng nhập, BlackHole/SoX và một
node đã kết nối khi bạn dùng tham gia bằng trình duyệt. OAuth chỉ dành cho đường dẫn Google
Meet API chính thức: tạo không gian cuộc họp, phân giải không gian và chạy các kiểm tra trước
Meet Media API.

### Tạo thông tin đăng nhập Google

Trong Google Cloud Console:

1. Tạo hoặc chọn một dự án Google Cloud.
2. Bật **Google Meet REST API** cho dự án đó.
3. Cấu hình màn hình đồng ý OAuth.
   - **Internal** là đơn giản nhất cho một tổ chức Google Workspace.
   - **External** phù hợp với thiết lập cá nhân/thử nghiệm; khi ứng dụng đang ở Testing,
     hãy thêm từng tài khoản Google sẽ ủy quyền ứng dụng làm người dùng thử nghiệm.
4. Thêm các phạm vi mà OpenClaw yêu cầu:
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

`meetings.space.created` là bắt buộc với Google Meet `spaces.create`.
`meetings.space.readonly` cho phép OpenClaw phân giải URL/mã Meet thành không gian.
`meetings.conference.media.readonly` dành cho kiểm tra trước Meet Media API và công việc
media; Google có thể yêu cầu đăng ký Developer Preview để thật sự dùng Media API.
Nếu bạn chỉ cần tham gia Chrome dựa trên trình duyệt, hãy bỏ qua OAuth hoàn toàn.

### Tạo refresh token

Cấu hình `oauth.clientId` và tùy chọn `oauth.clientSecret`, hoặc truyền chúng dưới dạng
biến môi trường, rồi chạy:

```bash
openclaw googlemeet auth login --json
```

Lệnh in ra một khối cấu hình `oauth` có refresh token. Nó sử dụng PKCE,
callback localhost tại `http://localhost:8085/oauth2callback`, và một quy trình
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

Lưu đối tượng `oauth` trong cấu hình Plugin Google Meet:

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
Nếu cả giá trị cấu hình và môi trường đều có mặt, Plugin sẽ phân giải cấu hình
trước rồi mới đến dự phòng môi trường.

Đồng ý OAuth bao gồm tạo không gian Meet, quyền đọc không gian Meet và quyền đọc
media hội nghị Meet. Nếu bạn đã xác thực trước khi hỗ trợ tạo cuộc họp
tồn tại, hãy chạy lại `openclaw googlemeet auth login --json` để refresh
token có phạm vi `meetings.space.created`.

### Xác minh OAuth bằng doctor

Chạy OAuth doctor khi bạn muốn kiểm tra sức khỏe nhanh, không tiết lộ bí mật:

```bash
openclaw googlemeet doctor --oauth --json
```

Việc này không tải runtime Chrome hoặc yêu cầu node Chrome đã kết nối. Nó
kiểm tra rằng cấu hình OAuth tồn tại và refresh token có thể tạo access
token. Báo cáo JSON chỉ bao gồm các trường trạng thái như `ok`, `configured`,
`tokenSource`, `expiresAt`, và thông báo kiểm tra; nó không in access
token, refresh token hoặc client secret.

Các kết quả thường gặp:

| Kiểm tra             | Ý nghĩa                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Có `oauth.clientId` cộng với `oauth.refreshToken`, hoặc access token đã lưu trong bộ nhớ đệm. |
| `oauth-token`        | Access token đã lưu trong bộ nhớ đệm vẫn còn hợp lệ, hoặc refresh token đã tạo access token mới. |
| `meet-spaces-get`    | Kiểm tra `--meeting` tùy chọn đã phân giải một không gian Meet hiện có.                  |
| `meet-spaces-create` | Kiểm tra `--create-space` tùy chọn đã tạo một không gian Meet mới.                      |

Để chứng minh cả việc bật Google Meet API và phạm vi `spaces.create`, hãy chạy
kiểm tra tạo có tác dụng phụ:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tạo một URL Meet dùng một lần. Dùng nó khi bạn cần xác nhận
rằng dự án Google Cloud đã bật Meet API và tài khoản đã ủy quyền
có phạm vi `meetings.space.created`.

Để chứng minh quyền đọc cho một không gian cuộc họp hiện có:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` và `resolve-space` chứng minh quyền đọc đối với một không gian
hiện có mà tài khoản Google đã ủy quyền có thể truy cập. `403` từ các kiểm tra này
thường có nghĩa là Google Meet REST API bị tắt, refresh token đã đồng ý
thiếu phạm vi bắt buộc, hoặc tài khoản Google không thể truy cập không gian Meet đó.
Lỗi refresh-token có nghĩa là hãy chạy lại `openclaw googlemeet auth login
--json` và lưu khối `oauth` mới.

Không cần thông tin đăng nhập OAuth cho dự phòng trình duyệt. Trong chế độ đó, xác thực Google
đến từ hồ sơ Chrome đã đăng nhập trên node đã chọn, không phải từ
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

Phân giải một URL Meet, mã, hoặc `spaces/{id}` thông qua `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Chạy kiểm tra trước trước khi làm việc với media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Liệt kê tạo phẩm cuộc họp và điểm danh sau khi Meet đã tạo bản ghi hội nghị:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Với `--meeting`, `artifacts` và `attendance` dùng bản ghi hội nghị mới nhất
theo mặc định. Truyền `--all-conference-records` khi bạn muốn mọi bản ghi được lưu giữ
cho cuộc họp đó.

Tra cứu lịch có thể phân giải URL cuộc họp từ Google Calendar trước khi đọc
tạo phẩm Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` tìm kiếm trong lịch `primary` của hôm nay một sự kiện Calendar có liên kết Google Meet. Dùng `--event <query>` để tìm văn bản sự kiện khớp, và `--calendar <id>` cho lịch không phải lịch chính. Tra cứu Calendar yêu cầu đăng nhập OAuth mới có bao gồm phạm vi chỉ đọc sự kiện Calendar.
`calendar-events` xem trước các sự kiện Meet khớp và đánh dấu sự kiện mà `latest`, `artifacts`, `attendance`, hoặc `export` sẽ chọn.

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

`artifacts` trả về siêu dữ liệu bản ghi hội nghị cùng với siêu dữ liệu tài nguyên người tham gia, bản ghi, bản chép lời, mục bản chép lời có cấu trúc và ghi chú thông minh khi Google cung cấp cho cuộc họp. Dùng `--no-transcript-entries` để bỏ qua tra cứu mục cho các cuộc họp lớn. `attendance` mở rộng người tham gia thành các hàng phiên tham gia với thời điểm được thấy lần đầu/lần cuối, tổng thời lượng phiên, cờ đến muộn/rời sớm, và các tài nguyên người tham gia trùng lặp được hợp nhất theo người dùng đã đăng nhập hoặc tên hiển thị. Truyền `--no-merge-duplicates` để giữ riêng các tài nguyên người tham gia thô, `--late-after-minutes` để tinh chỉnh phát hiện đến muộn, và `--early-before-minutes` để tinh chỉnh phát hiện rời sớm.

`export` ghi một thư mục chứa `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json`, và `manifest.json`.
`manifest.json` ghi lại đầu vào đã chọn, tùy chọn xuất, bản ghi hội nghị, tệp đầu ra, số lượng, nguồn token, sự kiện Calendar khi được dùng, và mọi cảnh báo truy xuất một phần. Truyền `--zip` để cũng ghi một kho lưu trữ di động bên cạnh thư mục. Truyền `--include-doc-bodies` để xuất văn bản Google Docs của bản chép lời và ghi chú thông minh được liên kết thông qua Google Drive `files.export`; việc này yêu cầu đăng nhập OAuth mới có bao gồm phạm vi chỉ đọc Drive Meet. Nếu không có `--include-doc-bodies`, bản xuất chỉ bao gồm siêu dữ liệu Meet và các mục bản chép lời có cấu trúc. Nếu Google trả về lỗi hiện vật một phần, chẳng hạn lỗi liệt kê ghi chú thông minh, mục bản chép lời, hoặc nội dung tài liệu Drive, phần tóm tắt và manifest sẽ giữ cảnh báo thay vì làm hỏng toàn bộ bản xuất.
Dùng `--dry-run` để lấy cùng dữ liệu hiện vật/tham dự và in JSON manifest mà không tạo thư mục hoặc ZIP. Điều này hữu ích trước khi ghi một bản xuất lớn hoặc khi một agent chỉ cần số lượng, bản ghi đã chọn và cảnh báo.

Agent cũng có thể tạo cùng gói thông qua công cụ `google_meet`:

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

Chạy kiểm thử smoke trực tiếp có bảo vệ với một cuộc họp thật còn được lưu giữ:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Môi trường smoke trực tiếp:

- `OPENCLAW_LIVE_TEST=1` bật kiểm thử trực tiếp có bảo vệ.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` trỏ tới một URL, mã, hoặc `spaces/{id}` Meet còn được lưu giữ.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` hoặc `GOOGLE_MEET_CLIENT_ID` cung cấp id ứng dụng khách OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` hoặc `GOOGLE_MEET_REFRESH_TOKEN` cung cấp refresh token.
- Tùy chọn: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, và
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` dùng cùng các tên dự phòng
  không có tiền tố `OPENCLAW_`.

Smoke trực tiếp hiện vật/tham dự cơ sở cần
`https://www.googleapis.com/auth/meetings.space.readonly` và
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Tra cứu Calendar cần `https://www.googleapis.com/auth/calendar.events.readonly`. Xuất nội dung tài liệu Drive cần
`https://www.googleapis.com/auth/drive.meet.readonly`.

Tạo một không gian Meet mới:

```bash
openclaw googlemeet create
```

Lệnh in `meeting uri` mới, nguồn và phiên tham gia. Với thông tin xác thực OAuth, lệnh dùng Google Meet API chính thức. Không có thông tin xác thực OAuth, lệnh dùng hồ sơ trình duyệt đã đăng nhập của Node Chrome đã ghim làm dự phòng. Agent có thể dùng công cụ `google_meet` với `action: "create"` để tạo và tham gia trong một bước. Để chỉ tạo URL, truyền `"join": false`.

Ví dụ đầu ra JSON từ dự phòng trình duyệt:

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

Nếu dự phòng trình duyệt gặp đăng nhập Google hoặc chặn quyền Meet trước khi có thể tạo URL, phương thức Gateway trả về phản hồi thất bại và công cụ `google_meet` trả về chi tiết có cấu trúc thay vì chuỗi thuần:

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

Khi agent thấy `manualActionRequired: true`, agent nên báo cáo `manualActionMessage` cùng với ngữ cảnh Node/tab trình duyệt và ngừng mở tab Meet mới cho đến khi người vận hành hoàn tất bước trong trình duyệt.

Ví dụ đầu ra JSON từ tạo bằng API:

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

Tạo một Meet sẽ tham gia theo mặc định. Vận chuyển Chrome hoặc Chrome-node vẫn cần một hồ sơ Google Chrome đã đăng nhập để tham gia thông qua trình duyệt. Nếu hồ sơ đã đăng xuất, OpenClaw báo cáo `manualActionRequired: true` hoặc lỗi dự phòng trình duyệt và yêu cầu người vận hành hoàn tất đăng nhập Google trước khi thử lại.

Chỉ đặt `preview.enrollmentAcknowledged: true` sau khi xác nhận dự án Cloud, chủ thể OAuth và người tham gia cuộc họp của bạn đã được ghi danh vào Google Workspace Developer Preview Program cho Meet media APIs.

## Cấu hình

Đường dẫn Chrome thời gian thực phổ biến chỉ cần bật Plugin, BlackHole, SoX và khóa nhà cung cấp giọng nói thời gian thực backend. OpenAI là mặc định; đặt `realtime.provider: "google"` để dùng Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Đặt cấu hình Plugin dưới `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: id/tên/IP Node tùy chọn cho `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: tên dùng trên màn hình khách Meet đã đăng xuất
- `chrome.autoJoin: true`: điền tên khách và bấm Join Now theo nỗ lực tối đa thông qua tự động hóa trình duyệt OpenClaw trên `chrome-node`
- `chrome.reuseExistingTab: true`: kích hoạt tab Meet hiện có thay vì mở trùng lặp
- `chrome.waitForInCallMs: 20000`: chờ tab Meet báo đang trong cuộc gọi trước khi phần giới thiệu thời gian thực được kích hoạt
- `chrome.audioFormat: "pcm16-24khz"`: định dạng âm thanh cặp lệnh. Chỉ dùng `"g711-ulaw-8khz"` cho các cặp lệnh cũ/tùy chỉnh vẫn phát âm thanh điện thoại.
- `chrome.audioInputCommand`: lệnh SoX đọc từ CoreAudio `BlackHole 2ch` và ghi âm thanh ở `chrome.audioFormat`
- `chrome.audioOutputCommand`: lệnh SoX đọc âm thanh ở `chrome.audioFormat` và ghi vào CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: phản hồi nói ngắn gọn, với `openclaw_agent_consult` cho câu trả lời sâu hơn
- `realtime.introMessage`: kiểm tra sẵn sàng được nói ngắn khi cầu nối thời gian thực kết nối; đặt thành `""` để tham gia im lặng
- `realtime.agentId`: id agent OpenClaw tùy chọn cho `openclaw_agent_consult`; mặc định là `main`

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

Cấu hình chỉ dành cho Twilio:

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

`voiceCall.enabled` mặc định là `true`; với vận chuyển Twilio, nó ủy quyền cuộc gọi PSTN thực tế và DTMF cho Plugin Voice Call. Nếu `voice-call` chưa được bật, Google Meet vẫn có thể xác thực và ghi lại kế hoạch gọi, nhưng không thể thực hiện cuộc gọi Twilio.

## Công cụ

Agent có thể dùng công cụ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Dùng `transport: "chrome"` khi Chrome chạy trên máy chủ Gateway. Dùng
`transport: "chrome-node"` khi Chrome chạy trên một Node đã ghép đôi, chẳng hạn VM Parallels. Trong cả hai trường hợp, mô hình thời gian thực và `openclaw_agent_consult` chạy trên máy chủ Gateway, nên thông tin xác thực mô hình vẫn ở đó.

Dùng `action: "status"` để liệt kê các phiên đang hoạt động hoặc kiểm tra một ID phiên. Dùng `action: "speak"` với `sessionId` và `message` để khiến agent thời gian thực nói ngay lập tức. Dùng `action: "test_speech"` để tạo hoặc dùng lại phiên, kích hoạt một cụm từ đã biết và trả về tình trạng `inCall` khi máy chủ Chrome có thể báo cáo. `test_speech` luôn buộc `mode: "realtime"` và thất bại nếu được yêu cầu chạy ở `mode: "transcribe"` vì các phiên chỉ quan sát cố ý không thể phát lời nói. Kết quả `speechOutputVerified` dựa trên việc số byte đầu ra âm thanh thời gian thực tăng trong cuộc gọi kiểm thử này, nên một phiên được dùng lại với âm thanh cũ hơn không được tính là kiểm tra lời nói thành công mới. Dùng `action: "leave"` để đánh dấu một phiên đã kết thúc.

`status` bao gồm tình trạng Chrome khi có sẵn:

- `inCall`: Chrome có vẻ đang ở trong cuộc gọi Meet
- `micMuted`: trạng thái microphone Meet theo nỗ lực tối đa
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: hồ sơ trình duyệt cần đăng nhập thủ công, được chủ trì Meet cho vào, cấp quyền, hoặc sửa điều khiển trình duyệt trước khi lời nói có thể hoạt động
- `providerConnected` / `realtimeReady`: trạng thái cầu nối giọng nói thời gian thực
- `lastInputAt` / `lastOutputAt`: âm thanh cuối cùng được thấy từ hoặc gửi tới cầu nối

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Tư vấn tác nhân thời gian thực

Chế độ thời gian thực của Chrome được tối ưu hóa cho vòng lặp giọng nói trực tiếp. Nhà cung cấp giọng nói thời gian thực
nghe âm thanh cuộc họp và phát qua cầu nối âm thanh đã cấu hình.
Khi mô hình thời gian thực cần suy luận sâu hơn, thông tin hiện tại hoặc các công cụ
OpenClaw thông thường, nó có thể gọi `openclaw_agent_consult`.

Công cụ tư vấn chạy tác nhân OpenClaw thông thường ở hậu trường với ngữ cảnh
bản chép lời cuộc họp gần đây và trả về một câu trả lời nói ngắn gọn cho phiên
giọng nói thời gian thực. Sau đó, mô hình giọng nói có thể nói câu trả lời đó trở lại cuộc họp.
Nó dùng cùng công cụ tư vấn thời gian thực dùng chung như Voice Call.

Theo mặc định, các lần tư vấn chạy với tác nhân `main`. Đặt `realtime.agentId` khi một
luồng Meet nên tư vấn một không gian làm việc tác nhân OpenClaw chuyên dụng, giá trị mặc định của mô hình,
chính sách công cụ, bộ nhớ và lịch sử phiên.

`realtime.toolPolicy` điều khiển lượt chạy tư vấn:

- `safe-read-only`: cung cấp công cụ tư vấn và giới hạn tác nhân thông thường ở
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` và
  `memory_get`.
- `owner`: cung cấp công cụ tư vấn và cho phép tác nhân thông thường dùng chính sách công cụ
  tác nhân bình thường.
- `none`: không cung cấp công cụ tư vấn cho mô hình giọng nói thời gian thực.

Khóa phiên tư vấn được giới hạn theo từng phiên Meet, vì vậy các lệnh gọi tư vấn tiếp theo
có thể dùng lại ngữ cảnh tư vấn trước đó trong cùng cuộc họp.

Để buộc kiểm tra sẵn sàng bằng lời sau khi Chrome đã tham gia cuộc gọi đầy đủ:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Đối với kiểm thử khói tham gia-và-nói đầy đủ:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Danh sách kiểm tra kiểm thử trực tiếp

Dùng chuỗi này trước khi bàn giao cuộc họp cho một tác nhân không có người giám sát:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Trạng thái Chrome-node dự kiến:

- `googlemeet setup` toàn bộ đều xanh.
- `googlemeet setup` bao gồm `chrome-node-connected` khi Chrome-node là
  phương thức truyền mặc định hoặc một node được ghim.
- `nodes status` hiển thị node đã chọn đang kết nối.
- Node đã chọn quảng bá cả `googlemeet.chrome` và `browser.proxy`.
- Thẻ Meet tham gia cuộc gọi và `test-speech` trả về tình trạng Chrome với
  `inCall: true`.

Đối với máy chủ Chrome từ xa như máy ảo Parallels macOS, đây là bước kiểm tra an toàn
ngắn nhất sau khi cập nhật Gateway hoặc máy ảo:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Điều đó chứng minh Plugin Gateway đã được tải, node máy ảo đang kết nối với
token hiện tại, và cầu nối âm thanh Meet sẵn sàng trước khi tác nhân mở một
thẻ cuộc họp thật.

Đối với kiểm thử khói Twilio, dùng một cuộc họp có chi tiết quay số điện thoại:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Trạng thái Twilio dự kiến:

- `googlemeet setup` bao gồm các kiểm tra xanh `twilio-voice-call-plugin` và
  `twilio-voice-call-credentials`.
- `voicecall` có sẵn trong CLI sau khi tải lại Gateway.
- Phiên trả về có `transport: "twilio"` và một `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` ngắt cuộc gọi thoại được ủy quyền.

## Khắc phục sự cố

### Tác nhân không thấy công cụ Google Meet

Xác nhận Plugin đã được bật trong cấu hình Gateway và tải lại Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Nếu bạn vừa chỉnh sửa `plugins.entries.google-meet`, hãy khởi động lại hoặc tải lại Gateway.
Tác nhân đang chạy chỉ thấy các công cụ Plugin đã được tiến trình Gateway hiện tại
đăng ký.

### Không có node có khả năng Google Meet đang kết nối

Trên máy chủ node, chạy:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Trên máy chủ Gateway, phê duyệt node và xác minh các lệnh:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node phải đang kết nối và liệt kê `googlemeet.chrome` cùng với `browser.proxy`.
Cấu hình Gateway phải cho phép các lệnh node đó:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Nếu `googlemeet setup` thất bại ở `chrome-node-connected` hoặc nhật ký Gateway báo
`gateway token mismatch`, hãy cài đặt lại hoặc khởi động lại node với token Gateway
hiện tại. Đối với Gateway LAN, điều này thường có nghĩa là:

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

### Trình duyệt mở nhưng tác nhân không thể tham gia

Chạy `googlemeet test-speech` và kiểm tra tình trạng Chrome được trả về. Nếu nó
báo `manualActionRequired: true`, hãy hiển thị `manualActionMessage` cho người vận hành
và dừng thử lại cho đến khi hành động trong trình duyệt hoàn tất.

Các hành động thủ công phổ biến:

- Đăng nhập vào hồ sơ Chrome.
- Chấp nhận khách từ tài khoản chủ trì Meet.
- Cấp quyền micro/camera cho Chrome khi lời nhắc quyền gốc của Chrome xuất hiện.
- Đóng hoặc sửa hộp thoại quyền Meet bị kẹt.

Không báo cáo "not signed in" chỉ vì Meet hiển thị "Do you want people to
hear you in the meeting?" Đó là màn xen giữa chọn âm thanh của Meet; OpenClaw
nhấp **Use microphone** bằng tự động hóa trình duyệt khi có sẵn và tiếp tục
chờ trạng thái cuộc họp thật. Đối với phương án dự phòng trình duyệt chỉ tạo, OpenClaw
có thể nhấp **Continue without microphone** vì việc tạo URL không cần
đường dẫn âm thanh thời gian thực.

### Tạo cuộc họp thất bại

`googlemeet create` trước tiên dùng endpoint Google Meet API `spaces.create`
khi thông tin xác thực OAuth đã được cấu hình. Không có thông tin xác thực OAuth, nó sẽ dùng phương án dự phòng
trình duyệt Chrome node đã ghim. Xác nhận:

- Đối với tạo bằng API: `oauth.clientId` và `oauth.refreshToken` đã được cấu hình,
  hoặc có các biến môi trường `OPENCLAW_GOOGLE_MEET_*` tương ứng.
- Đối với tạo bằng API: refresh token đã được tạo sau khi hỗ trợ tạo
  được thêm vào. Token cũ hơn có thể thiếu phạm vi `meetings.space.created`; chạy lại
  `openclaw googlemeet auth login --json` và cập nhật cấu hình Plugin.
- Đối với phương án dự phòng trình duyệt: `defaultTransport: "chrome-node"` và
  `chromeNode.node` trỏ đến một node đang kết nối có `browser.proxy` và
  `googlemeet.chrome`.
- Đối với phương án dự phòng trình duyệt: hồ sơ Chrome OpenClaw trên node đó đã đăng nhập
  vào Google và có thể mở `https://meet.google.com/new`.
- Đối với phương án dự phòng trình duyệt: các lần thử lại dùng lại một thẻ `https://meet.google.com/new`
  hiện có hoặc thẻ lời nhắc tài khoản Google trước khi mở thẻ mới. Nếu tác nhân hết thời gian chờ,
  hãy thử lại lệnh gọi công cụ thay vì tự mở một thẻ Meet khác.
- Đối với phương án dự phòng trình duyệt: nếu công cụ trả về `manualActionRequired: true`, hãy dùng
  `browser.nodeId`, `browser.targetId`, `browserUrl` và
  `manualActionMessage` được trả về để hướng dẫn người vận hành. Không thử lại theo vòng lặp cho đến khi
  hành động đó hoàn tất.
- Đối với phương án dự phòng trình duyệt: nếu Meet hiển thị "Do you want people to hear you in the
  meeting?", hãy để thẻ mở. OpenClaw nên nhấp **Use microphone** hoặc, đối với
  phương án dự phòng chỉ tạo, **Continue without microphone** thông qua tự động hóa trình duyệt
  và tiếp tục chờ URL Meet được tạo. Nếu không thể, lỗi nên nhắc đến `meet-audio-choice-required`, không phải `google-login-required`.

### Tác nhân tham gia nhưng không nói

Kiểm tra đường dẫn thời gian thực:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dùng `mode: "realtime"` để nghe/phản hồi bằng lời. `mode: "transcribe"` cố ý
không khởi động cầu nối giọng nói thời gian thực hai chiều. `googlemeet test-speech`
luôn kiểm tra đường dẫn thời gian thực và báo cáo liệu các byte đầu ra cầu nối có được
quan sát thấy cho lần gọi đó hay không. Nếu `speechOutputVerified` là false và
`speechOutputTimedOut` là true, nhà cung cấp thời gian thực có thể đã chấp nhận
câu nói nhưng OpenClaw không thấy byte đầu ra mới đến cầu nối âm thanh Chrome.

Cũng xác minh:

- Khóa nhà cung cấp thời gian thực có sẵn trên máy chủ Gateway, chẳng hạn như
  `OPENAI_API_KEY` hoặc `GEMINI_API_KEY`.
- `BlackHole 2ch` hiển thị trên máy chủ Chrome.
- `sox` tồn tại trên máy chủ Chrome.
- Micro và loa Meet được định tuyến qua đường dẫn âm thanh ảo mà
  OpenClaw dùng.

`googlemeet doctor [session-id]` in phiên, node, trạng thái trong cuộc gọi,
lý do cần hành động thủ công, kết nối nhà cung cấp thời gian thực, `realtimeReady`, hoạt động
đầu vào/đầu ra âm thanh, dấu thời gian âm thanh gần nhất, bộ đếm byte và URL trình duyệt.
Dùng `googlemeet status [session-id]` khi bạn cần JSON thô. Dùng
`googlemeet doctor --oauth` khi bạn cần xác minh refresh Google Meet OAuth
mà không để lộ token; thêm `--meeting` hoặc `--create-space` khi bạn cũng cần
bằng chứng Google Meet API.

Nếu tác nhân hết thời gian chờ và bạn có thể thấy một thẻ Meet đã mở, hãy kiểm tra thẻ đó
mà không mở thẻ khác:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Hành động công cụ tương đương là `recover_current_tab`. Nó tập trung và kiểm tra một
thẻ Meet hiện có cho phương thức truyền đã chọn. Với `chrome`, nó dùng điều khiển
trình duyệt cục bộ thông qua Gateway; với `chrome-node`, nó dùng Chrome node đã cấu hình.
Nó không mở thẻ mới hoặc tạo phiên mới; nó báo cáo trở ngại
hiện tại, chẳng hạn như đăng nhập, chấp nhận tham gia, quyền hoặc trạng thái chọn âm thanh.
Lệnh CLI nói chuyện với Gateway đã cấu hình, vì vậy Gateway phải đang chạy;
`chrome-node` cũng yêu cầu Chrome node đang kết nối.

### Kiểm tra thiết lập Twilio thất bại

`twilio-voice-call-plugin` thất bại khi `voice-call` không được cho phép hoặc chưa được bật.
Thêm nó vào `plugins.allow`, bật `plugins.entries.voice-call` và tải lại
Gateway.

`twilio-voice-call-credentials` thất bại khi backend Twilio thiếu account
SID, auth token hoặc số gọi đi. Đặt các biến này trên máy chủ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Sau đó khởi động lại hoặc tải lại Gateway và chạy:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` mặc định chỉ kiểm tra mức sẵn sàng. Để chạy thử với một số cụ thể:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Chỉ thêm `--yes` khi bạn cố ý muốn đặt một cuộc gọi thông báo đi trực tiếp:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Cuộc gọi Twilio bắt đầu nhưng không bao giờ vào cuộc họp

Xác nhận sự kiện Meet cung cấp chi tiết quay số điện thoại. Truyền đúng số quay vào
và PIN hoặc một chuỗi DTMF tùy chỉnh:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Dùng `w` ở đầu hoặc dấu phẩy trong `--dtmf-sequence` nếu nhà cung cấp cần tạm dừng
trước khi nhập PIN.

## Ghi chú

API phương tiện chính thức của Google Meet thiên về nhận, nên việc nói vào cuộc gọi Meet
vẫn cần một đường dẫn người tham gia. Plugin này giữ ranh giới đó rõ ràng:
Chrome xử lý việc tham gia bằng trình duyệt và định tuyến âm thanh cục bộ; Twilio xử lý
việc tham gia bằng quay số điện thoại.

Chế độ thời gian thực của Chrome cần `BlackHole 2ch` cộng với một trong hai:

- `chrome.audioInputCommand` cộng với `chrome.audioOutputCommand`: OpenClaw sở hữu cầu nối mô hình thời gian thực và truyền âm thanh ở `chrome.audioFormat` giữa các lệnh đó và nhà cung cấp giọng nói thời gian thực đã chọn. Đường dẫn Chrome mặc định là PCM16 24 kHz; G.711 mu-law 8 kHz vẫn khả dụng cho các cặp lệnh cũ.
- `chrome.audioBridgeCommand`: một lệnh cầu nối bên ngoài sở hữu toàn bộ đường dẫn âm thanh cục bộ và phải thoát sau khi khởi động hoặc xác thực daemon của nó.

Để có âm thanh song công rõ ràng, hãy định tuyến đầu ra Meet và micrô Meet qua các thiết bị ảo riêng biệt hoặc một đồ thị thiết bị ảo kiểu Loopback. Một thiết bị BlackHole dùng chung duy nhất có thể dội âm người tham gia khác trở lại cuộc gọi.

`googlemeet speak` kích hoạt cầu nối âm thanh thời gian thực đang hoạt động cho một phiên Chrome. `googlemeet leave` dừng cầu nối đó. Với các phiên Twilio được ủy quyền thông qua Plugin cuộc gọi thoại, `leave` cũng ngắt cuộc gọi thoại bên dưới.

## Liên quan

- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
- [Chế độ trò chuyện](/vi/nodes/talk)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
