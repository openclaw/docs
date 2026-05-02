---
read_when:
    - Bạn muốn một tác tử OpenClaw tham gia cuộc gọi Google Meet
    - Bạn muốn một tác nhân OpenClaw tạo một cuộc gọi Google Meet mới
    - Bạn đang cấu hình Chrome, nút Chrome hoặc Twilio làm phương thức truyền tải cho Google Meet
summary: 'Plugin Google Meet: tham gia các URL Meet tường minh qua Chrome hoặc Twilio với các mặc định thoại thời gian thực'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T10:48:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Hỗ trợ người tham gia Google Meet cho OpenClaw — Plugin được thiết kế theo cách tường minh:

- Nó chỉ tham gia một URL `https://meet.google.com/...` tường minh.
- Nó có thể tạo một không gian Meet mới thông qua Google Meet API, rồi tham gia
  URL được trả về.
- Giọng nói `realtime` là chế độ mặc định.
- Giọng nói realtime có thể gọi ngược vào tác nhân OpenClaw đầy đủ khi cần suy
  luận sâu hơn hoặc cần công cụ.
- Tác nhân chọn hành vi tham gia bằng `mode`: dùng `realtime` để nghe/nói phản hồi
  trực tiếp, hoặc `transcribe` để tham gia/điều khiển trình duyệt mà không dùng
  cầu nối giọng nói realtime.
- Xác thực bắt đầu bằng Google OAuth cá nhân hoặc một hồ sơ Chrome đã đăng nhập.
- Không có thông báo đồng ý tự động.
- Backend âm thanh Chrome mặc định là `BlackHole 2ch`.
- Chrome có thể chạy cục bộ hoặc trên một node host đã ghép đôi.
- Twilio chấp nhận số gọi vào cùng PIN hoặc chuỗi DTMF tùy chọn; nó không thể
  gọi trực tiếp một URL Meet.
- Lệnh CLI là `googlemeet`; `meet` được dành riêng cho các quy trình hội nghị từ xa
  rộng hơn của tác nhân.

## Bắt đầu nhanh

Cài đặt các phụ thuộc âm thanh cục bộ và cấu hình một nhà cung cấp giọng nói
realtime backend. OpenAI là mặc định; Google Gemini Live cũng hoạt động với
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` cài đặt thiết bị âm thanh ảo `BlackHole 2ch`. Trình cài đặt của Homebrew
yêu cầu khởi động lại trước khi macOS hiển thị thiết bị:

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
báo cáo hồ sơ Chrome, ghim node, và, với các lượt tham gia Chrome realtime, cầu
nối âm thanh BlackHole/SoX cùng các kiểm tra phần giới thiệu realtime bị trì
hoãn. Với các lượt tham gia chỉ quan sát, kiểm tra cùng transport bằng
`--mode transcribe`; chế độ đó bỏ qua các điều kiện tiên quyết về âm thanh
realtime vì nó không nghe qua hoặc nói qua cầu nối:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Khi ủy quyền Twilio được cấu hình, thiết lập cũng báo cáo liệu Plugin
`voice-call`, thông tin xác thực Twilio, và phơi bày Webhook công khai đã sẵn
sàng hay chưa. Xem mọi kiểm tra `ok: false` là yếu tố chặn đối với transport và
chế độ được kiểm tra trước khi yêu cầu tác nhân tham gia. Dùng
`openclaw googlemeet setup --json` cho script hoặc đầu ra máy đọc được. Dùng
`--transport chrome`, `--transport chrome-node`, hoặc `--transport twilio` để
kiểm tra trước một transport cụ thể trước khi tác nhân thử dùng.

Với Twilio, luôn kiểm tra trước transport một cách tường minh khi transport mặc
định là Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Việc đó phát hiện thiếu kết nối `voice-call`, thông tin xác thực Twilio, hoặc
phơi bày Webhook không truy cập được trước khi tác nhân thử gọi vào cuộc họp.

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

Công cụ `google_meet` dành cho tác nhân vẫn khả dụng trên host không phải macOS
cho các luồng artifact, lịch, thiết lập, phiên âm, Twilio, và `chrome-node`. Các
hành động realtime Chrome cục bộ bị chặn ở đó vì đường dẫn âm thanh realtime
Chrome đi kèm hiện phụ thuộc vào `BlackHole 2ch` trên macOS. Trên Linux, dùng
`mode: "transcribe"`, gọi vào bằng Twilio, hoặc một host `chrome-node` macOS để
tham gia Chrome realtime.

Tạo một cuộc họp mới và tham gia:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Với các phòng được tạo bằng API, dùng Google Meet `SpaceConfig.accessType` khi
bạn muốn chính sách không cần xin vào phòng được tường minh thay vì kế thừa từ
mặc định của tài khoản Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` cho phép bất kỳ ai có URL Meet tham gia mà không cần xin vào. `TRUSTED`
cho phép người dùng đáng tin cậy của tổ chức host, người dùng bên ngoài được mời,
và người dùng gọi vào tham gia mà không cần xin vào. `RESTRICTED` giới hạn quyền
vào không cần xin cho người được mời. Các thiết lập này chỉ áp dụng cho đường dẫn
tạo bằng Google Meet API chính thức, vì vậy phải cấu hình thông tin xác thực
OAuth.

Nếu bạn đã xác thực Google Meet trước khi tùy chọn này có sẵn, hãy chạy lại
`openclaw googlemeet auth login --json` sau khi thêm phạm vi
`meetings.space.settings` vào màn hình đồng ý Google OAuth của bạn.

Chỉ tạo URL mà không tham gia:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` có hai đường dẫn:

- Tạo bằng API: được dùng khi thông tin xác thực Google Meet OAuth đã được cấu
  hình. Đây là đường dẫn xác định nhất và không phụ thuộc vào trạng thái UI trình
  duyệt.
- Dự phòng trình duyệt: được dùng khi không có thông tin xác thực OAuth. OpenClaw
  dùng node Chrome đã ghim, mở `https://meet.google.com/new`, chờ Google chuyển
  hướng đến một URL mã cuộc họp thật, rồi trả về URL đó. Đường dẫn này yêu cầu
  hồ sơ Chrome OpenClaw trên node đã đăng nhập Google.
  Tự động hóa trình duyệt xử lý lời nhắc microphone lần đầu của chính Meet; lời
  nhắc đó không được xem là lỗi đăng nhập Google.
  Các luồng tham gia và tạo cũng cố gắng tái sử dụng một tab Meet hiện có trước
  khi mở tab mới. Việc khớp bỏ qua các chuỗi truy vấn URL vô hại như `authuser`,
  nên lần thử lại của tác nhân sẽ tập trung vào cuộc họp đang mở thay vì tạo một
  tab Chrome thứ hai.

Đầu ra lệnh/công cụ bao gồm trường `source` (`api` hoặc `browser`) để tác nhân
có thể giải thích đường dẫn nào đã được dùng. `create` mặc định tham gia cuộc họp
mới và trả về `joined: true` cùng phiên tham gia. Để chỉ tạo URL, dùng
`create --no-join` trên CLI hoặc truyền `"join": false` cho công cụ.

Hoặc nói với tác nhân: "Tạo một Google Meet, tham gia bằng giọng nói realtime, và gửi
cho tôi liên kết." Tác nhân nên gọi `google_meet` với `action: "create"` rồi chia
sẻ `meetingUri` được trả về.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Với lượt tham gia chỉ quan sát/điều khiển trình duyệt, đặt `"mode": "transcribe"`.
Chế độ đó không khởi động cầu nối mô hình realtime song công, không yêu cầu
BlackHole hoặc SoX, và sẽ không nói phản hồi vào cuộc họp. Các lượt tham gia
Chrome ở chế độ này cũng tránh cấp quyền microphone/camera của OpenClaw và tránh
đường dẫn **Use microphone** của Meet. Nếu Meet hiển thị màn hình chọn âm thanh,
tự động hóa sẽ thử đường dẫn không dùng microphone và nếu không được thì báo cáo
một hành động thủ công thay vì mở microphone cục bộ. Ở chế độ transcribe, các
transport Chrome được quản lý cũng cài đặt một trình quan sát phụ đề Meet theo
khả năng tốt nhất. `googlemeet status --json` và `googlemeet doctor` hiển thị
`captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`,
`lastCaptionSpeaker`, `lastCaptionText`, và một phần đuôi `recentTranscript`
ngắn để người vận hành biết liệu trình duyệt đã tham gia cuộc gọi hay chưa và
liệu phụ đề Meet có tạo văn bản hay không.
Dùng `openclaw googlemeet test-listen <meet-url> --transport chrome-node` khi
bạn cần một phép dò có/không: nó tham gia ở chế độ transcribe, chờ phụ đề mới
hoặc chuyển động transcript mới, rồi trả về `listenVerified`, `listenTimedOut`,
các trường hành động thủ công, và tình trạng phụ đề mới nhất.

Trong các phiên realtime, trạng thái `google_meet` bao gồm tình trạng trình duyệt
và cầu nối âm thanh như `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, dấu thời gian đầu
vào/đầu ra gần nhất, bộ đếm byte, và trạng thái cầu nối đã đóng. Nếu một lời nhắc
trang Meet an toàn xuất hiện, tự động hóa trình duyệt sẽ xử lý khi có thể. Lời
nhắc đăng nhập, chấp nhận của host, và quyền trình duyệt/HĐH được báo cáo là
hành động thủ công với lý do và thông điệp để tác nhân chuyển tiếp. Các phiên
Chrome được quản lý chỉ phát phần giới thiệu hoặc cụm từ kiểm thử sau khi tình
trạng trình duyệt báo cáo `inCall: true`; nếu không, trạng thái báo cáo
`speechReady: false` và nỗ lực phát lời nói bị chặn thay vì giả vờ rằng tác nhân
đã nói vào cuộc họp.

Các lượt tham gia Chrome cục bộ đi qua hồ sơ trình duyệt OpenClaw đã đăng nhập.
Chế độ realtime yêu cầu `BlackHole 2ch` cho đường dẫn microphone/loa mà OpenClaw
sử dụng. Để có âm thanh song công sạch, dùng các thiết bị ảo riêng biệt hoặc một
đồ thị kiểu Loopback; một thiết bị BlackHole duy nhất là đủ cho lần smoke test
đầu tiên nhưng có thể tạo tiếng vọng.

### Gateway cục bộ + Parallels Chrome

Bạn **không** cần một OpenClaw Gateway đầy đủ hoặc khóa API mô hình bên trong VM
macOS chỉ để VM sở hữu Chrome. Chạy Gateway và tác nhân cục bộ, rồi chạy một node
host trong VM. Bật Plugin đi kèm trên VM một lần để node quảng bá lệnh Chrome:

Những gì chạy ở đâu:

- Host Gateway: OpenClaw Gateway, workspace tác nhân, khóa model/API, nhà cung
  cấp realtime, và cấu hình Plugin Google Meet.
- VM macOS Parallels: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch,
  và một hồ sơ Chrome đã đăng nhập Google.
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

Khởi động node host trong VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Nếu `<gateway-host>` là IP LAN và bạn không dùng TLS, node sẽ từ chối WebSocket
plaintext trừ khi bạn chọn cho phép mạng riêng đáng tin cậy đó:

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

Phê duyệt node từ host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Xác nhận Gateway thấy node và node quảng bá cả `googlemeet.chrome` lẫn capability
trình duyệt/`browser.proxy`:

```bash
openclaw nodes status
```

Định tuyến Meet qua node đó trên host Gateway:

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

Bây giờ tham gia bình thường từ host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

hoặc yêu cầu tác nhân dùng công cụ `google_meet` với `transport: "chrome-node"`.

Để smoke test bằng một lệnh nhằm tạo hoặc tái sử dụng một phiên, nói một cụm từ
đã biết, và in tình trạng phiên:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Trong khi tham gia thời gian thực, tự động hóa trình duyệt OpenClaw điền tên khách, nhấp vào
Tham gia/Yêu cầu tham gia, và chấp nhận lựa chọn "Use microphone" trong lần chạy đầu của Meet khi
lời nhắc đó xuất hiện. Trong khi tham gia chỉ quan sát hoặc tạo cuộc họp chỉ bằng trình duyệt, nó
tiếp tục qua cùng lời nhắc đó mà không dùng micrô khi lựa chọn đó có sẵn.
Nếu hồ sơ trình duyệt chưa đăng nhập, Meet đang chờ chủ trì chấp nhận,
Chrome cần quyền micrô/camera để tham gia thời gian thực, hoặc Meet bị kẹt
ở một lời nhắc mà tự động hóa không thể xử lý, kết quả join/test-speech sẽ báo cáo
`manualActionRequired: true` cùng với `manualActionReason` và
`manualActionMessage`. Agents nên ngừng thử tham gia lại, báo cáo đúng thông báo đó
kèm `browserUrl`/`browserTitle` hiện tại, và chỉ thử lại sau khi
thao tác thủ công trong trình duyệt đã hoàn tất.

Nếu bỏ qua `chromeNode.node`, OpenClaw chỉ tự động chọn khi đúng một
Node đã kết nối quảng bá cả `googlemeet.chrome` và điều khiển trình duyệt. Nếu
nhiều Node có khả năng được kết nối, hãy đặt `chromeNode.node` thành id Node,
tên hiển thị, hoặc IP từ xa.

Các kiểm tra lỗi thường gặp:

- `Configured Google Meet node ... is not usable: offline`: Node đã ghim được
  Gateway biết đến nhưng không khả dụng. Agents nên xem Node đó là
  trạng thái chẩn đoán, không phải Chrome host có thể dùng, và báo cáo yếu tố chặn
  thiết lập thay vì chuyển sang transport khác, trừ khi người dùng yêu cầu như vậy.
- `No connected Google Meet-capable node`: khởi động `openclaw node run` trong VM,
  chấp thuận ghép nối, và bảo đảm `openclaw plugins enable google-meet` và
  `openclaw plugins enable browser` đã được chạy trong VM. Đồng thời xác nhận
  Gateway host cho phép cả hai lệnh Node bằng
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: cài đặt `blackhole-2ch` trên host
  đang được kiểm tra và khởi động lại trước khi dùng âm thanh Chrome cục bộ.
- `BlackHole 2ch audio device not found on the node`: cài đặt `blackhole-2ch`
  trong VM và khởi động lại VM.
- Chrome mở nhưng không thể tham gia: đăng nhập vào hồ sơ trình duyệt bên trong VM, hoặc
  giữ `chrome.guestName` được đặt để tham gia với tư cách khách. Tự động tham gia với tư cách khách dùng
  tự động hóa trình duyệt OpenClaw qua proxy trình duyệt của Node; bảo đảm cấu hình
  trình duyệt của Node trỏ đến hồ sơ bạn muốn, ví dụ
  `browser.defaultProfile: "user"` hoặc một hồ sơ phiên hiện có có tên.
- Các tab Meet trùng lặp: giữ bật `chrome.reuseExistingTab: true`. OpenClaw
  kích hoạt tab hiện có cho cùng URL Meet trước khi mở tab mới, và
  việc tạo cuộc họp bằng trình duyệt tái sử dụng tab `https://meet.google.com/new`
  hoặc tab lời nhắc tài khoản Google đang xử lý trước khi mở tab khác.
- Không có âm thanh: trong Meet, định tuyến micrô/loa qua đường dẫn thiết bị âm thanh ảo
  mà OpenClaw dùng; dùng các thiết bị ảo riêng biệt hoặc định tuyến kiểu Loopback
  để có âm thanh song công sạch.

## Ghi chú cài đặt

Mặc định thời gian thực của Chrome dùng hai công cụ bên ngoài:

- `sox`: tiện ích âm thanh dòng lệnh. Plugin dùng các lệnh thiết bị CoreAudio
  tường minh cho cầu nối âm thanh PCM16 24 kHz mặc định.
- `blackhole-2ch`: trình điều khiển âm thanh ảo macOS. Nó tạo thiết bị âm thanh
  `BlackHole 2ch` mà Chrome/Meet có thể định tuyến qua.

OpenClaw không đóng gói hoặc phân phối lại bất kỳ gói nào trong hai gói này. Tài liệu yêu cầu người dùng
cài đặt chúng dưới dạng phụ thuộc host thông qua Homebrew. SoX được cấp phép theo
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole là GPL-3.0. Nếu bạn xây dựng
trình cài đặt hoặc appliance đóng gói BlackHole cùng OpenClaw, hãy xem lại các điều khoản
cấp phép thượng nguồn của BlackHole hoặc lấy giấy phép riêng từ Existential Audio.

## Transports

### Chrome

Chrome transport mở URL Meet thông qua điều khiển trình duyệt OpenClaw và tham gia
bằng hồ sơ trình duyệt OpenClaw đã đăng nhập. Trên macOS, Plugin kiểm tra
`BlackHole 2ch` trước khi khởi chạy. Nếu được cấu hình, nó cũng chạy lệnh
kiểm tra sức khỏe cầu nối âm thanh và lệnh khởi động trước khi mở Chrome. Dùng `chrome` khi
Chrome/âm thanh nằm trên Gateway host; dùng `chrome-node` khi Chrome/âm thanh nằm
trên một Node đã ghép nối, chẳng hạn VM Parallels macOS. Với Chrome cục bộ, chọn
hồ sơ bằng `browser.defaultProfile`; `chrome.browserProfile` được truyền cho
các host `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Định tuyến âm thanh micrô và loa Chrome qua cầu nối âm thanh OpenClaw cục bộ.
Nếu `BlackHole 2ch` chưa được cài đặt, thao tác tham gia thất bại với lỗi thiết lập
thay vì âm thầm tham gia mà không có đường dẫn âm thanh.

### Twilio

Twilio transport là một kế hoạch quay số nghiêm ngặt được ủy quyền cho Plugin Voice Call. Nó
không phân tích trang Meet để tìm số điện thoại.

Dùng cách này khi không thể tham gia bằng Chrome hoặc bạn muốn một phương án dự phòng
gọi điện vào. Google Meet phải cung cấp số gọi điện vào và PIN cho
cuộc họp; OpenClaw không phát hiện những thông tin đó từ trang Meet.

Bật Plugin Voice Call trên Gateway host, không phải trên Chrome Node:

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

Cung cấp thông tin xác thực Twilio thông qua môi trường hoặc cấu hình. Môi trường giúp
giữ bí mật khỏi `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Khởi động lại hoặc tải lại Gateway sau khi bật `voice-call`; các thay đổi cấu hình Plugin
không xuất hiện trong tiến trình Gateway đang chạy cho đến khi nó tải lại.

Sau đó xác minh:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Khi ủy quyền Twilio đã được nối dây, `googlemeet setup` bao gồm các kiểm tra
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

## OAuth và preflight

OAuth là tùy chọn khi tạo liên kết Meet vì `googlemeet create` có thể dùng
tự động hóa trình duyệt làm phương án dự phòng. Cấu hình OAuth khi bạn muốn tạo bằng API chính thức,
phân giải space, hoặc kiểm tra preflight Meet Media API.

Quyền truy cập Google Meet API dùng OAuth người dùng: tạo một Google Cloud OAuth client,
yêu cầu các scope cần thiết, cấp quyền cho một tài khoản Google, rồi lưu
refresh token thu được trong cấu hình Plugin Google Meet hoặc cung cấp các
biến môi trường `OPENCLAW_GOOGLE_MEET_*`.

OAuth không thay thế đường dẫn tham gia bằng Chrome. Chrome và Chrome-node transports
vẫn tham gia thông qua một hồ sơ Chrome đã đăng nhập, BlackHole/SoX, và một
Node đã kết nối khi bạn dùng tham gia bằng trình duyệt. OAuth chỉ dành cho đường dẫn
Google Meet API chính thức: tạo meeting spaces, phân giải spaces, và chạy các kiểm tra
preflight Meet Media API.

### Tạo thông tin xác thực Google

Trong Google Cloud Console:

1. Tạo hoặc chọn một Google Cloud project.
2. Bật **Google Meet REST API** cho project đó.
3. Cấu hình màn hình đồng ý OAuth.
   - **Internal** là đơn giản nhất cho một tổ chức Google Workspace.
   - **External** hoạt động cho thiết lập cá nhân/thử nghiệm; khi ứng dụng ở trạng thái Testing,
     hãy thêm từng tài khoản Google sẽ cấp quyền cho ứng dụng làm người dùng thử nghiệm.
4. Thêm các scope OpenClaw yêu cầu:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Tạo OAuth client ID.
   - Loại ứng dụng: **Web application**.
   - URI chuyển hướng được ủy quyền:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Sao chép client ID và client secret.

`meetings.space.created` là bắt buộc đối với Google Meet `spaces.create`.
`meetings.space.readonly` cho phép OpenClaw phân giải URL/mã Meet thành spaces.
`meetings.space.settings` cho phép OpenClaw truyền các thiết lập `SpaceConfig` như
`accessType` trong quá trình tạo phòng bằng API.
`meetings.conference.media.readonly` dành cho preflight Meet Media API và công việc
media; Google có thể yêu cầu đăng ký Developer Preview để sử dụng Media API thực tế.
Nếu bạn chỉ cần tham gia Chrome dựa trên trình duyệt, hãy bỏ qua OAuth hoàn toàn.

### Tạo refresh token

Cấu hình `oauth.clientId` và tùy chọn `oauth.clientSecret`, hoặc truyền chúng dưới dạng
biến môi trường, rồi chạy:

```bash
openclaw googlemeet auth login --json
```

Lệnh in ra một khối cấu hình `oauth` với refresh token. Nó dùng PKCE,
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
Nếu cả giá trị cấu hình và môi trường đều có mặt, Plugin phân giải cấu hình
trước rồi mới dùng môi trường làm dự phòng.

Sự đồng ý OAuth bao gồm tạo Meet space, quyền đọc Meet space, và quyền đọc
media hội nghị Meet. Nếu bạn đã xác thực trước khi có hỗ trợ tạo cuộc họp,
hãy chạy lại `openclaw googlemeet auth login --json` để refresh token có
scope `meetings.space.created`.

### Xác minh OAuth bằng doctor

Chạy OAuth doctor khi bạn muốn một kiểm tra sức khỏe nhanh, không lộ bí mật:

```bash
openclaw googlemeet doctor --oauth --json
```

Lệnh này không tải Chrome runtime hoặc yêu cầu Chrome Node đã kết nối. Nó
kiểm tra cấu hình OAuth tồn tại và refresh token có thể tạo access token.
Báo cáo JSON chỉ bao gồm các trường trạng thái như `ok`, `configured`,
`tokenSource`, `expiresAt`, và thông báo kiểm tra; nó không in access
token, refresh token, hoặc client secret.

Kết quả thường gặp:

| Kiểm tra             | Ý nghĩa                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Có `oauth.clientId` cộng với `oauth.refreshToken`, hoặc access token đã lưu cache.      |
| `oauth-token`        | Access token đã lưu cache vẫn hợp lệ, hoặc refresh token đã tạo access token mới.       |
| `meet-spaces-get`    | Kiểm tra tùy chọn `--meeting` đã phân giải một Meet space hiện có.                      |
| `meet-spaces-create` | Kiểm tra tùy chọn `--create-space` đã tạo một Meet space mới.                           |

Để chứng minh cả việc bật Google Meet API và scope `spaces.create`, hãy chạy
kiểm tra tạo có tác dụng phụ:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tạo một URL Meet dùng một lần. Dùng nó khi bạn cần xác nhận
rằng dự án Google Cloud đã bật Meet API và tài khoản được ủy quyền có phạm vi
`meetings.space.created`.

Để chứng minh quyền đọc cho một không gian họp hiện có:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` và `resolve-space` chứng minh quyền đọc với một
không gian hiện có mà tài khoản Google được ủy quyền có thể truy cập. Lỗi `403`
từ các kiểm tra này thường nghĩa là Google Meet REST API bị tắt, refresh token
đã đồng ý thiếu phạm vi bắt buộc, hoặc tài khoản Google không thể truy cập
không gian Meet đó. Lỗi refresh-token nghĩa là chạy lại `openclaw googlemeet auth login
--json` và lưu khối `oauth` mới.

Không cần thông tin xác thực OAuth cho phương án dự phòng trình duyệt. Ở chế độ
đó, xác thực Google đến từ hồ sơ Chrome đã đăng nhập trên node đã chọn, không
phải từ cấu hình OpenClaw.

Các biến môi trường này được chấp nhận làm phương án dự phòng:

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

Chạy kiểm tra trước trước khi làm việc với phương tiện:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Liệt kê hiện vật cuộc họp và điểm danh sau khi Meet đã tạo bản ghi hội nghị:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Với `--meeting`, `artifacts` và `attendance` dùng bản ghi hội nghị mới nhất theo
mặc định. Truyền `--all-conference-records` khi bạn muốn mọi bản ghi còn được
lưu giữ cho cuộc họp đó.

Tra cứu lịch có thể phân giải URL cuộc họp từ Google Calendar trước khi đọc
hiện vật Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` tìm kiếm lịch `primary` của hôm nay để tìm một sự kiện Calendar có
liên kết Google Meet. Dùng `--event <query>` để tìm kiếm văn bản sự kiện khớp, và
`--calendar <id>` cho lịch không phải lịch chính. Tra cứu lịch yêu cầu đăng nhập
OAuth mới có bao gồm phạm vi chỉ đọc sự kiện Calendar.
`calendar-events` xem trước các sự kiện Meet khớp và đánh dấu sự kiện mà
`latest`, `artifacts`, `attendance`, hoặc `export` sẽ chọn.

Nếu bạn đã biết id bản ghi hội nghị, hãy chỉ định trực tiếp:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Kết thúc một hội nghị đang hoạt động cho không gian do API tạo khi bạn muốn đóng
phòng sau cuộc gọi:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Lệnh này gọi Google Meet `spaces.endActiveConference` và yêu cầu OAuth với phạm vi
`meetings.space.created` cho một không gian mà tài khoản được ủy quyền có thể
quản lý. OpenClaw chấp nhận đầu vào là URL Meet, mã cuộc họp, hoặc `spaces/{id}`
và phân giải nó thành tài nguyên không gian API trước khi kết thúc hội nghị đang
hoạt động.
Nó tách biệt với `googlemeet leave`: `leave` dừng việc tham gia cục bộ/phiên của
OpenClaw, còn `end-active-conference` yêu cầu Google Meet kết thúc hội nghị đang
hoạt động cho không gian.

Ghi một báo cáo dễ đọc:

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

`artifacts` trả về siêu dữ liệu bản ghi hội nghị cùng siêu dữ liệu tài nguyên về
người tham gia, bản ghi, bản chép lời, mục bản chép lời có cấu trúc và ghi chú
thông minh khi Google cung cấp chúng cho cuộc họp. Dùng `--no-transcript-entries`
để bỏ qua tra cứu mục cho các cuộc họp lớn. `attendance` mở rộng người tham gia
thành các hàng phiên người tham gia với thời điểm thấy lần đầu/lần cuối, tổng
thời lượng phiên, cờ đến muộn/rời sớm, và các tài nguyên người tham gia trùng
lặp được hợp nhất theo người dùng đã đăng nhập hoặc tên hiển thị. Truyền
`--no-merge-duplicates` để giữ riêng các tài nguyên người tham gia thô,
`--late-after-minutes` để điều chỉnh phát hiện đến muộn, và
`--early-before-minutes` để điều chỉnh phát hiện rời sớm.

`export` ghi một thư mục chứa `summary.md`, `attendance.csv`, `transcript.md`,
`artifacts.json`, `attendance.json`, và `manifest.json`.
`manifest.json` ghi lại đầu vào đã chọn, tùy chọn xuất, bản ghi hội nghị, tệp đầu
ra, số lượng, nguồn token, sự kiện Calendar khi có dùng, và mọi cảnh báo truy
xuất một phần. Truyền `--zip` để cũng ghi một kho lưu trữ di động bên cạnh thư
mục. Truyền `--include-doc-bodies` để xuất văn bản Google Docs của bản chép lời
và ghi chú thông minh được liên kết thông qua Google Drive `files.export`; việc
này yêu cầu đăng nhập OAuth mới có bao gồm phạm vi chỉ đọc Drive Meet. Không có
`--include-doc-bodies`, các bản xuất chỉ bao gồm siêu dữ liệu Meet và các mục bản
chép lời có cấu trúc. Nếu Google trả về lỗi hiện vật một phần, chẳng hạn lỗi liệt
kê ghi chú thông minh, mục bản chép lời, hoặc thân tài liệu Drive, phần tóm tắt
và manifest giữ cảnh báo thay vì làm hỏng toàn bộ bản xuất.
Dùng `--dry-run` để lấy cùng dữ liệu hiện vật/điểm danh và in JSON manifest mà
không tạo thư mục hoặc ZIP. Điều đó hữu ích trước khi ghi một bản xuất lớn hoặc
khi một tác nhân chỉ cần số lượng, bản ghi đã chọn và cảnh báo.

Tác nhân cũng có thể tạo cùng gói thông qua công cụ `google_meet`:

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

Tác nhân cũng có thể tạo một phòng được API hỗ trợ với chính sách truy cập rõ ràng:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

Và chúng có thể kết thúc hội nghị đang hoạt động cho một phòng đã biết:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Để xác thực nghe trước, tác nhân nên dùng `test_listen` trước khi tuyên bố cuộc
họp hữu ích:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Chạy kiểm tra khói trực tiếp có bảo vệ với một cuộc họp thật còn được lưu giữ:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Chạy phép thăm dò trình duyệt nghe trước trực tiếp với một cuộc họp nơi có người
sẽ nói và phụ đề Meet khả dụng:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Môi trường kiểm tra khói trực tiếp:

- `OPENCLAW_LIVE_TEST=1` bật các kiểm thử trực tiếp có bảo vệ.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` trỏ đến URL Meet, mã, hoặc
  `spaces/{id}` còn được lưu giữ.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` hoặc `GOOGLE_MEET_CLIENT_ID` cung cấp id ứng
  dụng OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` hoặc `GOOGLE_MEET_REFRESH_TOKEN` cung cấp
  refresh token.
- Tùy chọn: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, và
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` dùng cùng tên dự phòng
  không có tiền tố `OPENCLAW_`.

Kiểm tra khói trực tiếp hiện vật/điểm danh cơ sở cần
`https://www.googleapis.com/auth/meetings.space.readonly` và
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Tra cứu
Calendar cần `https://www.googleapis.com/auth/calendar.events.readonly`. Xuất
thân tài liệu Drive cần
`https://www.googleapis.com/auth/drive.meet.readonly`.

Tạo một không gian Meet mới:

```bash
openclaw googlemeet create
```

Lệnh in ra `meeting uri` mới, nguồn và phiên tham gia. Với thông tin xác thực
OAuth, nó dùng Google Meet API chính thức. Không có thông tin xác thực OAuth, nó
dùng hồ sơ trình duyệt đã đăng nhập của node Chrome được ghim làm phương án dự
phòng. Tác nhân có thể dùng công cụ `google_meet` với `action: "create"` để tạo
và tham gia trong một bước. Để chỉ tạo URL, truyền `"join": false`.

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

Nếu phương án dự phòng trình duyệt gặp đăng nhập Google hoặc chặn quyền Meet
trước khi có thể tạo URL, phương thức Gateway trả về phản hồi thất bại và công
cụ `google_meet` trả về chi tiết có cấu trúc thay vì một chuỗi thuần:

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

Khi một tác nhân thấy `manualActionRequired: true`, nó nên báo cáo
`manualActionMessage` cùng ngữ cảnh node/tab trình duyệt và dừng mở tab Meet mới
cho đến khi người vận hành hoàn tất bước trên trình duyệt.

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

Tạo Meet sẽ tham gia theo mặc định. Phương thức vận chuyển Chrome hoặc Chrome-node
vẫn cần một hồ sơ Google Chrome đã đăng nhập để tham gia qua trình duyệt. Nếu hồ
sơ đã đăng xuất, OpenClaw báo cáo `manualActionRequired: true` hoặc lỗi phương án
dự phòng trình duyệt và yêu cầu người vận hành hoàn tất đăng nhập Google trước
khi thử lại.

Chỉ đặt `preview.enrollmentAcknowledged: true` sau khi xác nhận dự án Cloud,
OAuth principal, và người tham gia cuộc họp của bạn đã ghi danh vào Google
Workspace Developer Preview Program cho Meet media APIs.

## Cấu hình

Đường dẫn Chrome realtime phổ biến chỉ cần bật Plugin, BlackHole, SoX, và khóa
nhà cung cấp giọng nói realtime phía sau. OpenAI là mặc định; đặt
`realtime.provider: "google"` để dùng Google Gemini Live:

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
- `chrome.guestName: "OpenClaw Agent"`: tên được dùng trên màn hình khách Meet chưa đăng nhập
- `chrome.autoJoin: true`: cố gắng tự động điền tên khách và nhấp Join Now thông qua tự động hóa trình duyệt OpenClaw trên `chrome-node`
- `chrome.reuseExistingTab: true`: kích hoạt một thẻ Meet hiện có thay vì mở các thẻ trùng lặp
- `chrome.waitForInCallMs: 20000`: chờ thẻ Meet báo đang trong cuộc gọi trước khi kích hoạt lời giới thiệu realtime
- `chrome.audioFormat: "pcm16-24khz"`: định dạng âm thanh cặp lệnh. Chỉ dùng `"g711-ulaw-8khz"` cho các cặp lệnh cũ/tùy chỉnh vẫn phát âm thanh điện thoại.
- `chrome.audioInputCommand`: lệnh SoX đọc từ CoreAudio `BlackHole 2ch` và ghi âm thanh theo `chrome.audioFormat`
- `chrome.audioOutputCommand`: lệnh SoX đọc âm thanh theo `chrome.audioFormat` và ghi vào CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: lệnh micro cục bộ tùy chọn ghi PCM mono little-endian 16-bit có dấu để phát hiện người dùng chen lời trong khi phát âm thanh của trợ lý. Hiện tại mục này áp dụng cho cầu nối cặp lệnh `chrome` do Gateway lưu trữ.
- `chrome.bargeInRmsThreshold: 650`: mức RMS được tính là một lần ngắt lời của người dùng trên `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: mức đỉnh được tính là một lần ngắt lời của người dùng trên `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: độ trễ tối thiểu giữa các lần xóa ngắt lời lặp lại của người dùng
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: câu trả lời nói ngắn gọn, với `openclaw_agent_consult` cho câu trả lời sâu hơn
- `realtime.introMessage`: kiểm tra trạng thái sẵn sàng bằng lời nói ngắn khi cầu nối realtime kết nối; đặt thành `""` để tham gia im lặng
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

`voiceCall.enabled` mặc định là `true`; với transport Twilio, nó ủy quyền cuộc gọi PSTN thực tế, DTMF và lời chào mở đầu cho Plugin Voice Call. Voice Call phát chuỗi DTMF trước khi mở luồng phương tiện realtime, rồi dùng văn bản giới thiệu đã lưu làm lời chào realtime ban đầu. Nếu `voice-call` không được bật, Google Meet vẫn có thể xác thực và ghi lại kế hoạch quay số, nhưng không thể thực hiện cuộc gọi Twilio.

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

Dùng `transport: "chrome"` khi Chrome chạy trên máy chủ Gateway. Dùng `transport: "chrome-node"` khi Chrome chạy trên một Node đã ghép cặp, chẳng hạn như VM Parallels. Trong cả hai trường hợp, mô hình realtime và `openclaw_agent_consult` chạy trên máy chủ Gateway, vì vậy thông tin xác thực mô hình vẫn nằm ở đó.

Dùng `action: "status"` để liệt kê các phiên đang hoạt động hoặc kiểm tra một ID phiên. Dùng `action: "speak"` với `sessionId` và `message` để khiến agent realtime nói ngay lập tức. Dùng `action: "test_speech"` để tạo hoặc tái sử dụng phiên, kích hoạt một cụm từ đã biết, và trả về tình trạng `inCall` khi máy chủ Chrome có thể báo cáo. `test_speech` luôn buộc `mode: "realtime"` và thất bại nếu được yêu cầu chạy trong `mode: "transcribe"` vì các phiên chỉ quan sát cố ý không thể phát lời nói. Kết quả `speechOutputVerified` của nó dựa trên việc số byte đầu ra âm thanh realtime tăng trong lần gọi kiểm thử này, nên một phiên được tái sử dụng với âm thanh cũ hơn không được tính là kiểm tra lời nói thành công mới. Dùng `action: "leave"` để đánh dấu một phiên đã kết thúc.

`status` bao gồm tình trạng Chrome khi có sẵn:

- `inCall`: Chrome có vẻ đang ở trong cuộc gọi Meet
- `micMuted`: trạng thái micro Meet theo nỗ lực tốt nhất
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: hồ sơ trình duyệt cần đăng nhập thủ công, chủ phòng Meet cho phép vào, cấp quyền, hoặc sửa điều khiển trình duyệt trước khi lời nói có thể hoạt động
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: liệu lời nói Chrome được quản lý hiện có được phép hay không. `speechReady: false` nghĩa là OpenClaw chưa gửi cụm từ giới thiệu/kiểm thử vào cầu nối âm thanh.
- `providerConnected` / `realtimeReady`: trạng thái cầu nối giọng nói realtime
- `lastInputAt` / `lastOutputAt`: âm thanh cuối cùng được thấy từ hoặc gửi đến cầu nối
- `lastSuppressedInputAt` / `suppressedInputBytes`: đầu vào local loopback bị bỏ qua trong khi phát âm thanh của trợ lý

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Tham vấn agent realtime

Chế độ realtime của Chrome được tối ưu hóa cho vòng lặp giọng nói trực tiếp. Nhà cung cấp giọng nói realtime nghe âm thanh cuộc họp và nói qua cầu nối âm thanh đã cấu hình. Khi mô hình realtime cần suy luận sâu hơn, thông tin hiện tại, hoặc các công cụ OpenClaw thông thường, nó có thể gọi `openclaw_agent_consult`.

Công cụ tham vấn chạy agent OpenClaw thông thường ở hậu trường với ngữ cảnh bản ghi cuộc họp gần đây và trả về một câu trả lời nói ngắn gọn cho phiên giọng nói realtime. Sau đó mô hình giọng nói có thể nói câu trả lời đó trở lại cuộc họp. Nó dùng cùng công cụ tham vấn realtime dùng chung như Voice Call.

Theo mặc định, các lần tham vấn chạy với agent `main`. Đặt `realtime.agentId` khi một luồng Meet nên tham vấn một không gian làm việc agent OpenClaw chuyên dụng, mặc định mô hình, chính sách công cụ, bộ nhớ, và lịch sử phiên riêng.

`realtime.toolPolicy` kiểm soát lượt chạy tham vấn:

- `safe-read-only`: hiển thị công cụ tham vấn và giới hạn agent thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, và `memory_get`.
- `owner`: hiển thị công cụ tham vấn và cho phép agent thông thường dùng chính sách công cụ agent bình thường.
- `none`: không hiển thị công cụ tham vấn cho mô hình giọng nói realtime.

Khóa phiên tham vấn được giới hạn theo từng phiên Meet, vì vậy các lệnh gọi tham vấn tiếp theo có thể tái sử dụng ngữ cảnh tham vấn trước đó trong cùng cuộc họp.

Để buộc kiểm tra trạng thái sẵn sàng bằng lời nói sau khi Chrome đã tham gia đầy đủ cuộc gọi:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Cho smoke tham gia và nói đầy đủ:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Danh sách kiểm tra kiểm thử live

Dùng trình tự này trước khi giao cuộc họp cho một agent không có người giám sát:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Trạng thái Chrome-node mong đợi:

- `googlemeet setup` đều xanh.
- `googlemeet setup` bao gồm `chrome-node-connected` khi Chrome-node là transport mặc định hoặc một Node được ghim.
- `nodes status` hiển thị Node đã chọn đang kết nối.
- Node đã chọn quảng bá cả `googlemeet.chrome` và `browser.proxy`.
- Thẻ Meet tham gia cuộc gọi và `test-speech` trả về tình trạng Chrome với `inCall: true`.

Đối với một máy chủ Chrome từ xa như VM macOS Parallels, đây là kiểm tra an toàn ngắn nhất sau khi cập nhật Gateway hoặc VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Điều đó chứng minh Plugin Gateway đã được tải, Node VM được kết nối với token hiện tại, và cầu nối âm thanh Meet có sẵn trước khi một agent mở thẻ cuộc họp thật.

Đối với smoke Twilio, dùng một cuộc họp có thông tin quay số điện thoại vào:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Trạng thái Twilio mong đợi:

- `googlemeet setup` bao gồm các kiểm tra xanh `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, và `twilio-voice-call-webhook`.
- `voicecall` có sẵn trong CLI sau khi Gateway tải lại.
- Phiên được trả về có `transport: "twilio"` và một `twilio.voiceCallId`.
- `openclaw logs --follow` hiển thị DTMF TwiML được phục vụ trước TwiML realtime, rồi một cầu nối realtime với lời chào ban đầu đã được đưa vào hàng đợi.
- `googlemeet leave <sessionId>` ngắt cuộc gọi thoại đã ủy quyền.

## Khắc phục sự cố

### Agent không thấy công cụ Google Meet

Xác nhận Plugin đã được bật trong cấu hình Gateway và tải lại Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Nếu bạn vừa chỉnh sửa `plugins.entries.google-meet`, hãy khởi động lại hoặc tải lại Gateway. Agent đang chạy chỉ thấy các công cụ Plugin được đăng ký bởi tiến trình Gateway hiện tại.

Trên các máy chủ Gateway không phải macOS, công cụ hướng tới agent `google_meet` vẫn hiển thị, nhưng các hành động realtime Chrome cục bộ bị chặn trước khi chạm tới cầu nối âm thanh. Âm thanh realtime Chrome cục bộ hiện phụ thuộc vào `BlackHole 2ch` của macOS, vì vậy agent Linux nên dùng `mode: "transcribe"`, quay số vào Twilio, hoặc máy chủ `chrome-node` macOS thay vì đường dẫn realtime Chrome cục bộ mặc định.

### Không có Node hỗ trợ Google Meet nào được kết nối

Trên máy chủ Node, chạy:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Trên máy chủ Gateway, phê duyệt Node và xác minh các lệnh:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node phải được kết nối và liệt kê `googlemeet.chrome` cùng `browser.proxy`. Cấu hình Gateway phải cho phép các lệnh Node đó:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Nếu `googlemeet setup` thất bại ở `chrome-node-connected` hoặc nhật ký Gateway báo `gateway token mismatch`, hãy cài đặt lại hoặc khởi động lại Node với token Gateway hiện tại. Đối với Gateway LAN, điều này thường có nghĩa là:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Sau đó tải lại dịch vụ Node và chạy lại:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Trình duyệt mở nhưng agent không thể tham gia

Chạy `googlemeet test-listen` cho các lần tham gia chỉ quan sát hoặc `googlemeet test-speech` cho các lần tham gia realtime, rồi kiểm tra tình trạng Chrome được trả về. Nếu một trong hai phép dò báo `manualActionRequired: true`, hãy hiển thị `manualActionMessage` cho người vận hành và dừng thử lại cho đến khi hành động trên trình duyệt hoàn tất.

Các hành động thủ công thường gặp:

- Đăng nhập vào hồ sơ Chrome.
- Cho phép khách vào từ tài khoản chủ phòng Meet.
- Cấp quyền micro/camera Chrome khi lời nhắc quyền gốc của Chrome xuất hiện.
- Đóng hoặc sửa hộp thoại quyền Meet bị kẹt.

Không báo cáo là "chưa đăng nhập" chỉ vì Meet hiển thị "Bạn có muốn mọi người nghe thấy bạn trong cuộc họp không?" Đó là màn hình trung gian chọn âm thanh của Meet; OpenClaw nhấp **Sử dụng micrô** thông qua tự động hóa trình duyệt khi có sẵn và tiếp tục chờ trạng thái cuộc họp thực. Với phương án dự phòng trình duyệt chỉ để tạo, OpenClaw có thể nhấp **Tiếp tục không dùng micrô** vì việc tạo URL không cần đường dẫn âm thanh realtime.

### Tạo cuộc họp không thành công

`googlemeet create` trước tiên dùng endpoint `spaces.create` của Google Meet API khi thông tin xác thực OAuth được cấu hình. Khi không có thông tin xác thực OAuth, lệnh sẽ chuyển sang trình duyệt Chrome node đã ghim. Hãy xác nhận:

- Với tạo bằng API: `oauth.clientId` và `oauth.refreshToken` đã được cấu hình,
  hoặc có các biến môi trường `OPENCLAW_GOOGLE_MEET_*` khớp.
- Với tạo bằng API: refresh token được cấp sau khi hỗ trợ tạo được thêm vào. Token cũ hơn có thể thiếu scope `meetings.space.created`; chạy lại
  `openclaw googlemeet auth login --json` và cập nhật cấu hình plugin.
- Với phương án dự phòng bằng trình duyệt: `defaultTransport: "chrome-node"` và
  `chromeNode.node` trỏ đến một node đã kết nối có `browser.proxy` và
  `googlemeet.chrome`.
- Với phương án dự phòng bằng trình duyệt: hồ sơ Chrome của OpenClaw trên node đó đã đăng nhập
  vào Google và có thể mở `https://meet.google.com/new`.
- Với phương án dự phòng bằng trình duyệt: các lần thử lại tái sử dụng tab `https://meet.google.com/new`
  hiện có hoặc tab lời nhắc tài khoản Google trước khi mở tab mới. Nếu agent hết thời gian chờ,
  hãy thử lại lời gọi công cụ thay vì mở thủ công một tab Meet khác.
- Với phương án dự phòng bằng trình duyệt: nếu công cụ trả về `manualActionRequired: true`, hãy dùng
  `browser.nodeId`, `browser.targetId`, `browserUrl` và
  `manualActionMessage` được trả về để hướng dẫn người vận hành. Không thử lại trong vòng lặp cho đến khi
  hành động đó hoàn tất.
- Với phương án dự phòng bằng trình duyệt: nếu Meet hiển thị "Bạn có muốn mọi người nghe thấy bạn trong
  cuộc họp không?", hãy để tab mở. OpenClaw nên nhấp **Sử dụng micrô** hoặc, với
  phương án dự phòng chỉ để tạo, **Tiếp tục không dùng micrô** thông qua tự động hóa trình duyệt
  và tiếp tục chờ URL Meet được tạo. Nếu không thể, lỗi nên nhắc đến `meet-audio-choice-required`, không phải `google-login-required`.

### Agent tham gia nhưng không nói

Kiểm tra đường dẫn realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dùng `mode: "realtime"` cho nghe/nói phản hồi. `mode: "transcribe"` cố ý
không khởi động cầu nối giọng nói realtime song công. Để gỡ lỗi chỉ quan sát,
chạy `openclaw googlemeet status --json <session-id>` sau khi người tham gia nói
và kiểm tra `captioning`, `transcriptLines` và `lastCaptionText`. Nếu `inCall` là
true nhưng `transcriptLines` vẫn ở `0`, phụ đề Meet có thể bị tắt, chưa có ai
nói kể từ khi trình quan sát được cài đặt, UI Meet đã thay đổi, hoặc phụ đề trực tiếp
không khả dụng cho ngôn ngữ/tài khoản của cuộc họp.

`googlemeet test-speech` luôn kiểm tra đường dẫn realtime và báo cáo liệu
có quan sát được byte đầu ra cầu nối cho lần gọi đó hay không. Nếu `speechOutputVerified` là false và
`speechOutputTimedOut` là true, nhà cung cấp realtime có thể đã chấp nhận
câu nói nhưng OpenClaw không thấy byte đầu ra mới đến cầu nối âm thanh Chrome.

Cũng hãy xác minh:

- Khóa nhà cung cấp realtime có sẵn trên máy chủ Gateway, chẳng hạn như
  `OPENAI_API_KEY` hoặc `GEMINI_API_KEY`.
- `BlackHole 2ch` hiển thị trên máy chủ Chrome.
- `sox` tồn tại trên máy chủ Chrome.
- Micrô và loa Meet được định tuyến qua đường dẫn âm thanh ảo mà
  OpenClaw dùng.

`googlemeet doctor [session-id]` in phiên, node, trạng thái trong cuộc gọi,
lý do cần thao tác thủ công, kết nối nhà cung cấp realtime, `realtimeReady`, hoạt động
đầu vào/đầu ra âm thanh, dấu thời gian âm thanh gần nhất, bộ đếm byte và URL trình duyệt.
Dùng `googlemeet status [session-id] --json` khi bạn cần JSON thô. Dùng
`googlemeet doctor --oauth` khi bạn cần xác minh refresh Google Meet OAuth
mà không để lộ token; thêm `--meeting` hoặc `--create-space` khi bạn cũng cần
bằng chứng Google Meet API.

Nếu agent hết thời gian chờ và bạn thấy một tab Meet đã mở, hãy kiểm tra tab đó
mà không mở tab khác:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Hành động công cụ tương đương là `recover_current_tab`. Nó tập trung và kiểm tra một
tab Meet hiện có cho transport đã chọn. Với `chrome`, nó dùng điều khiển trình duyệt cục bộ
thông qua Gateway; với `chrome-node`, nó dùng Chrome node đã cấu hình. Nó không mở tab mới
hoặc tạo phiên mới; nó báo cáo điểm chặn hiện tại, chẳng hạn như đăng nhập, chấp nhận vào phòng,
quyền, hoặc trạng thái chọn âm thanh. Lệnh CLI nói chuyện với Gateway đã cấu hình, nên Gateway
phải đang chạy; `chrome-node` cũng yêu cầu Chrome node đã được kết nối.

### Kiểm tra thiết lập Twilio không thành công

`twilio-voice-call-plugin` thất bại khi `voice-call` không được cho phép hoặc chưa được bật.
Thêm nó vào `plugins.allow`, bật `plugins.entries.voice-call`, và tải lại
Gateway.

`twilio-voice-call-credentials` thất bại khi backend Twilio thiếu account
SID, auth token, hoặc số gọi đi. Đặt các giá trị này trên máy chủ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` thất bại khi `voice-call` không có webhook công khai
hoặc khi `publicUrl` trỏ đến local loopback hoặc không gian mạng riêng.
Đặt `plugins.entries.voice-call.config.publicUrl` thành URL nhà cung cấp công khai hoặc
cấu hình một tunnel/Tailscale exposure cho `voice-call`.

URL loopback và URL riêng không hợp lệ cho callback của nhà mạng. Không dùng
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, hoặc `fd00::/8` làm `publicUrl`.

Để có URL công khai ổn định:

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

Để phát triển cục bộ, hãy dùng tunnel hoặc Tailscale exposure thay vì URL
máy chủ riêng:

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

`voicecall smoke` mặc định chỉ kiểm tra mức sẵn sàng. Để chạy thử khô với một số cụ thể:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Chỉ thêm `--yes` khi bạn chủ ý muốn thực hiện một cuộc gọi thông báo đi trực tiếp:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Cuộc gọi Twilio bắt đầu nhưng không bao giờ vào cuộc họp

Xác nhận sự kiện Meet cung cấp chi tiết gọi điện vào. Truyền chính xác
số gọi vào và PIN hoặc một chuỗi DTMF tùy chỉnh:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Dùng `w` ở đầu hoặc dấu phẩy trong `--dtmf-sequence` nếu nhà cung cấp cần tạm dừng
trước khi nhập PIN.

Nếu cuộc gọi điện thoại được tạo nhưng danh sách người tham gia Meet không bao giờ hiển thị
người tham gia gọi vào:

- Chạy `openclaw googlemeet doctor <session-id>` để xác nhận ID cuộc gọi Twilio
  được ủy quyền, DTMF đã được đưa vào hàng đợi hay chưa, và lời chào mở đầu đã được yêu cầu hay chưa.
- Chạy `openclaw voicecall status --call-id <id>` và xác nhận cuộc gọi vẫn
  đang hoạt động.
- Chạy `openclaw voicecall tail` và kiểm tra các webhook Twilio có đang đến
  Gateway hay không.
- Chạy `openclaw logs --follow` và tìm chuỗi Twilio Meet: Google
  Meet ủy quyền việc tham gia, Voice Call bắt đầu nhánh điện thoại, Google Meet chờ
  `voiceCall.dtmfDelayMs`, gửi DTMF bằng `voicecall.dtmf`, chờ
  `voiceCall.postDtmfSpeechDelayMs`, rồi yêu cầu lời chào mở đầu bằng
  `voicecall.speak`.
- Chạy lại `openclaw googlemeet setup --transport twilio`; kiểm tra thiết lập xanh là
  bắt buộc nhưng không chứng minh chuỗi PIN cuộc họp là đúng.
- Xác nhận số gọi vào thuộc cùng lời mời Meet và khu vực với
  PIN.
- Tăng `voiceCall.dtmfDelayMs` nếu Meet trả lời chậm hoặc bản ghi cuộc gọi
  vẫn hiển thị lời nhắc yêu cầu PIN sau khi DTMF đã được gửi.
- Nếu người tham gia vào được nhưng bạn không nghe lời chào, hãy kiểm tra
  `openclaw logs --follow` để tìm yêu cầu `voicecall.speak` sau DTMF và
  phát TTS media-stream hoặc phương án dự phòng Twilio `<Say>`. Nếu bản ghi cuộc gọi
  vẫn chứa "nhập PIN cuộc họp", nhánh điện thoại chưa vào phòng Meet,
  vì vậy người tham gia cuộc họp sẽ không nghe thấy lời nói.

Nếu webhook không đến, hãy gỡ lỗi Plugin Voice Call trước: nhà cung cấp phải
truy cập được `plugins.entries.voice-call.config.publicUrl` hoặc tunnel đã cấu hình.
Xem [Khắc phục sự cố cuộc gọi thoại](/vi/plugins/voice-call#troubleshooting).

## Ghi chú

Google Meet's official media API is receive-oriented, so speaking into a Meet
call still needs a participant path. Plugin này giữ ranh giới đó hiển thị:
Chrome xử lý việc tham gia bằng trình duyệt và định tuyến âm thanh cục bộ; Twilio xử lý
việc tham gia gọi điện vào.

Chế độ realtime của Chrome cần `BlackHole 2ch` cộng với một trong các lựa chọn sau:

- `chrome.audioInputCommand` cộng với `chrome.audioOutputCommand`: OpenClaw sở hữu
  cầu nối mô hình realtime và dẫn âm thanh trong `chrome.audioFormat` giữa các
  lệnh đó và nhà cung cấp giọng nói realtime đã chọn. Đường dẫn Chrome mặc định là
  PCM16 24 kHz; G.711 mu-law 8 kHz vẫn khả dụng cho các cặp lệnh cũ.
- `chrome.audioBridgeCommand`: một lệnh cầu nối bên ngoài sở hữu toàn bộ
  đường dẫn âm thanh cục bộ và phải thoát sau khi khởi động hoặc xác thực daemon của nó.

Để có âm thanh song công sạch, hãy định tuyến đầu ra Meet và micrô Meet qua các
thiết bị ảo riêng biệt hoặc một đồ thị thiết bị ảo kiểu Loopback. Một thiết bị
BlackHole dùng chung duy nhất có thể vọng lại người tham gia khác vào cuộc gọi.

Với cầu nối Chrome dạng cặp lệnh, `chrome.bargeInInputCommand` có thể lắng nghe một
micrô cục bộ riêng và xóa phát lại của trợ lý khi con người bắt đầu
nói. Điều này giữ lời nói của con người đi trước đầu ra của trợ lý ngay cả khi đầu vào
local loopback BlackHole dùng chung tạm thời bị chặn trong lúc trợ lý phát lại.
Giống như `chrome.audioInputCommand` và `chrome.audioOutputCommand`, đây là một
lệnh cục bộ do người vận hành cấu hình. Dùng đường dẫn lệnh hoặc danh sách đối số tin cậy
rõ ràng, và không trỏ nó đến script từ các vị trí không đáng tin cậy.

`googlemeet speak` kích hoạt cầu nối âm thanh realtime đang hoạt động cho một phiên
Chrome. `googlemeet leave` dừng cầu nối đó. Với các phiên Twilio được ủy quyền
thông qua Plugin Voice Call, `leave` cũng ngắt cuộc gọi thoại bên dưới.
Dùng `googlemeet end-active-conference` khi bạn cũng muốn đóng hội nghị
Google Meet đang hoạt động cho một space do API quản lý.

## Liên quan

- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
- [Chế độ nói chuyện](/vi/nodes/talk)
- [Xây dựng plugin](/vi/plugins/building-plugins)
