---
read_when:
    - Bạn muốn một agent OpenClaw tham gia cuộc gọi Google Meet
    - Bạn muốn một tác tử OpenClaw tạo một cuộc gọi Google Meet mới
    - Bạn đang cấu hình Chrome, Chrome node hoặc Twilio làm phương thức vận chuyển Google Meet
summary: 'Plugin Google Meet: tham gia các URL Meet được chỉ định rõ qua Chrome hoặc Twilio với mặc định phản hồi thoại của tác nhân'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-06-27T17:46:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Hỗ trợ người tham gia Google Meet cho OpenClaw — Plugin được thiết kế theo hướng tường minh:

- Plugin chỉ tham gia một URL `https://meet.google.com/...` tường minh.
- Plugin có thể tạo một không gian Meet mới qua Google Meet API, rồi tham gia URL
  được trả về.
- `agent` là chế độ phản hồi mặc định: phiên âm thời gian thực lắng nghe, agent
  OpenClaw đã cấu hình trả lời, và TTS OpenClaw thông thường phát vào Meet.
- `bidi` vẫn có sẵn làm chế độ dự phòng cho mô hình giọng nói thời gian thực trực tiếp.
- Agent chọn hành vi tham gia bằng `mode`: dùng `agent` để lắng nghe/phản hồi trực tiếp,
  `bidi` làm dự phòng giọng nói thời gian thực trực tiếp, hoặc `transcribe`
  để tham gia/điều khiển trình duyệt mà không dùng cầu phản hồi.
- Xác thực bắt đầu bằng Google OAuth cá nhân hoặc một hồ sơ Chrome đã đăng nhập sẵn.
- Không có thông báo đồng ý tự động.
- Backend âm thanh Chrome mặc định là `BlackHole 2ch`.
- Chrome có thể chạy cục bộ hoặc trên một máy chủ node đã ghép cặp.
- Twilio chấp nhận một số gọi vào cùng mã PIN hoặc chuỗi DTMF tùy chọn; Twilio
  không thể gọi trực tiếp một URL Meet.
- Lệnh CLI là `googlemeet`; `meet` được dành cho các quy trình hội nghị từ xa
  rộng hơn của agent.

## Bắt đầu nhanh

Cài đặt các phụ thuộc âm thanh cục bộ và cấu hình một nhà cung cấp phiên âm
thời gian thực cùng TTS OpenClaw thông thường. OpenAI là nhà cung cấp phiên âm
mặc định; Google Gemini Live cũng hoạt động như một dự phòng giọng nói `bidi`
riêng với `realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
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

Đầu ra thiết lập được thiết kế để agent đọc được và nhận biết chế độ. Nó báo cáo hồ sơ Chrome,
ghim node, và, với các lượt tham gia Chrome thời gian thực, cầu âm thanh BlackHole/SoX
cùng các kiểm tra phần giới thiệu thời gian thực bị trì hoãn. Với lượt tham gia chỉ quan sát,
hãy kiểm tra cùng phương thức truyền bằng `--mode transcribe`; chế độ đó bỏ qua các điều kiện tiên quyết
về âm thanh thời gian thực vì nó không lắng nghe qua hoặc phát qua cầu:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Khi đã cấu hình ủy quyền Twilio, thiết lập cũng báo cáo liệu Plugin
`voice-call`, thông tin đăng nhập Twilio, và khả năng hiển thị Webhook công khai đã sẵn sàng hay chưa.
Xem mọi kiểm tra `ok: false` là một điểm chặn đối với phương thức truyền và chế độ được kiểm tra
trước khi yêu cầu agent tham gia. Dùng `openclaw googlemeet setup --json` cho
script hoặc đầu ra máy đọc được. Dùng `--transport chrome`,
`--transport chrome-node`, hoặc `--transport twilio` để kiểm tra trước một
phương thức truyền cụ thể trước khi agent thử dùng.

Với Twilio, luôn kiểm tra trước phương thức truyền một cách tường minh khi phương thức truyền mặc định
là Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Việc đó phát hiện thiếu kết nối `voice-call`, thông tin đăng nhập Twilio, hoặc
khả năng hiển thị Webhook không truy cập được trước khi agent thử gọi vào cuộc họp.

Tham gia một cuộc họp:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Hoặc để agent tham gia qua công cụ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Công cụ `google_meet` dành cho agent vẫn có sẵn trên các máy chủ không phải macOS cho
các luồng artifact, lịch, thiết lập, phiên âm, Twilio, và `chrome-node`. Các hành động
phản hồi bằng Chrome cục bộ bị chặn tại đó vì đường dẫn âm thanh Chrome đi kèm
hiện phụ thuộc vào `BlackHole 2ch` trên macOS. Trên Linux, dùng `mode: "transcribe"`,
gọi vào bằng Twilio, hoặc một máy chủ macOS `chrome-node` để tham gia phản hồi bằng Chrome.

Tạo một cuộc họp mới và tham gia:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Với phòng được tạo bằng API, dùng Google Meet `SpaceConfig.accessType` khi bạn muốn
chính sách không cần gõ cửa của phòng được đặt tường minh thay vì kế thừa từ mặc định
của tài khoản Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` cho phép bất kỳ ai có URL Meet tham gia mà không cần gõ cửa. `TRUSTED` cho phép
người dùng đáng tin cậy của tổ chức chủ trì, người dùng bên ngoài được mời, và người dùng gọi vào
tham gia mà không cần gõ cửa. `RESTRICTED` giới hạn quyền vào không cần gõ cửa cho người được mời.
Các thiết lập này chỉ áp dụng cho đường dẫn tạo chính thức của Google Meet API, vì vậy
thông tin đăng nhập OAuth phải được cấu hình.

Nếu bạn đã xác thực Google Meet trước khi tùy chọn này có sẵn, hãy chạy lại
`openclaw googlemeet auth login --json` sau khi thêm phạm vi
`meetings.space.settings` vào màn hình đồng ý Google OAuth của bạn.

Chỉ tạo URL mà không tham gia:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` có hai đường dẫn:

- Tạo bằng API: dùng khi thông tin đăng nhập Google Meet OAuth đã được cấu hình. Đây là
  đường dẫn xác định nhất và không phụ thuộc vào trạng thái giao diện trình duyệt.
- Dự phòng bằng trình duyệt: dùng khi không có thông tin đăng nhập OAuth. OpenClaw dùng
  node Chrome đã ghim, mở `https://meet.google.com/new`, chờ Google
  chuyển hướng tới một URL mã cuộc họp thật, rồi trả về URL đó. Đường dẫn này yêu cầu
  hồ sơ Chrome OpenClaw trên node đã đăng nhập Google sẵn.
  Tự động hóa trình duyệt xử lý lời nhắc microphone lần chạy đầu của chính Meet; lời nhắc đó
  không được xem là lỗi đăng nhập Google.
  Các luồng tham gia và tạo cũng cố gắng tái sử dụng một tab Meet hiện có trước khi mở
  tab mới. Việc khớp bỏ qua các chuỗi truy vấn URL vô hại như `authuser`, nên một
  lần thử lại của agent nên đưa cuộc họp đã mở sẵn lên tiêu điểm thay vì tạo tab Chrome thứ hai.

Đầu ra lệnh/công cụ bao gồm trường `source` (`api` hoặc `browser`) để agent
có thể giải thích đường dẫn nào đã được dùng. `create` mặc định tham gia cuộc họp mới và
trả về `joined: true` cùng phiên tham gia. Để chỉ tạo URL, dùng
`create --no-join` trên CLI hoặc truyền `"join": false` cho công cụ.

Hoặc nói với agent: "Tạo một Google Meet, tham gia bằng chế độ phản hồi agent,
và gửi cho tôi liên kết." Agent nên gọi `google_meet` với
`action: "create"` rồi chia sẻ `meetingUri` được trả về.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Với lượt tham gia chỉ quan sát/điều khiển trình duyệt, đặt `"mode": "transcribe"`. Việc đó
không khởi động cầu giọng nói thời gian thực song công, không yêu cầu BlackHole hoặc SoX,
và sẽ không phản hồi bằng giọng nói vào cuộc họp. Các lượt tham gia Chrome ở chế độ này cũng tránh
cấp quyền microphone/camera của OpenClaw và tránh đường dẫn **Use
microphone** của Meet. Nếu Meet hiển thị màn hình trung gian chọn âm thanh, tự động hóa sẽ thử
đường dẫn không dùng microphone và nếu không được thì báo một hành động thủ công thay vì mở
microphone cục bộ. Ở chế độ transcribe, các phương thức truyền Chrome được quản lý cũng cài đặt
một trình quan sát phụ đề Meet theo nỗ lực tốt nhất. `googlemeet status --json` và
`googlemeet doctor` hiển thị `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
và một phần đuôi `recentTranscript` ngắn để người vận hành biết liệu trình duyệt
đã tham gia cuộc gọi hay chưa và phụ đề Meet có đang tạo văn bản hay không.
Dùng `openclaw googlemeet test-listen <meet-url> --transport chrome-node` khi
bạn cần một phép thử có/không: nó tham gia ở chế độ transcribe, chờ phụ đề mới hoặc
chuyển động phiên âm, và trả về `listenVerified`, `listenTimedOut`, các trường hành động
thủ công, và tình trạng phụ đề mới nhất.

Trong các phiên thời gian thực, trạng thái `google_meet` bao gồm tình trạng trình duyệt và cầu âm thanh
như `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, dấu thời gian đầu vào/đầu ra gần nhất,
bộ đếm byte, và trạng thái đóng của cầu. Nếu một lời nhắc an toàn của trang Meet
xuất hiện, tự động hóa trình duyệt sẽ xử lý khi có thể. Đăng nhập, phê duyệt của chủ trì, và
lời nhắc quyền trình duyệt/OS được báo cáo là hành động thủ công với lý do và
thông báo để agent chuyển tiếp. Các phiên Chrome được quản lý chỉ phát phần giới thiệu hoặc
cụm từ kiểm tra sau khi tình trạng trình duyệt báo `inCall: true`; nếu không, trạng thái báo
`speechReady: false` và lần thử phát giọng nói bị chặn thay vì giả vờ rằng
agent đã nói vào cuộc họp.

Các lượt tham gia Chrome cục bộ đi qua hồ sơ trình duyệt OpenClaw đã đăng nhập. Chế độ thời gian thực
yêu cầu `BlackHole 2ch` cho đường dẫn microphone/loa mà OpenClaw dùng. Để có
âm thanh song công sạch, hãy dùng các thiết bị ảo riêng biệt hoặc một đồ thị kiểu Loopback; một
thiết bị BlackHole duy nhất là đủ cho lần kiểm thử nhanh đầu tiên nhưng có thể gây vọng.

### Gateway cục bộ + Chrome Parallels

Bạn **không** cần một Gateway OpenClaw đầy đủ hoặc khóa API mô hình bên trong VM macOS
chỉ để VM sở hữu Chrome. Chạy Gateway và agent cục bộ, rồi chạy một
máy chủ node trong VM. Bật Plugin đi kèm trên VM một lần để node
quảng bá lệnh Chrome:

Thành phần chạy ở đâu:

- Máy chủ Gateway: Gateway OpenClaw, workspace agent, khóa mô hình/API, nhà cung cấp thời gian thực,
  và cấu hình Plugin Google Meet.
- VM macOS Parallels: CLI/máy chủ node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  và một hồ sơ Chrome đã đăng nhập Google.
- Không cần trong VM: dịch vụ Gateway, cấu hình agent, khóa OpenAI/GPT, hoặc thiết lập
  nhà cung cấp mô hình.

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

Cài đặt hoặc cập nhật OpenClaw trong VM, rồi bật Plugin đi kèm tại đó:

```bash
openclaw plugins enable google-meet
```

Khởi động máy chủ node trong VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Nếu `<gateway-host>` là IP LAN và bạn không dùng TLS, node sẽ từ chối
WebSocket dạng văn bản thuần trừ khi bạn chọn cho phép mạng riêng đáng tin cậy đó:

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
thiết lập `openclaw.json`. `openclaw node install` lưu nó trong môi trường LaunchAgent
khi nó xuất hiện trên lệnh cài đặt.

Phê duyệt node từ máy chủ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Xác nhận Gateway thấy node và node quảng bá cả `googlemeet.chrome`
lẫn năng lực trình duyệt/`browser.proxy`:

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

Giờ tham gia bình thường từ máy chủ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

hoặc yêu cầu agent dùng công cụ `google_meet` với `transport: "chrome-node"`.

Để kiểm thử nhanh bằng một lệnh nhằm tạo hoặc tái sử dụng một phiên, phát một
cụm từ đã biết, và in tình trạng phiên:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Trong quá trình tham gia realtime, tự động hóa trình duyệt OpenClaw điền tên khách, nhấp
Tham gia/Yêu cầu tham gia, và chấp nhận lựa chọn "Use microphone" trong lần chạy đầu của Meet khi
lời nhắc đó xuất hiện. Trong quá trình tham gia chỉ quan sát hoặc tạo cuộc họp chỉ bằng trình duyệt, nó
tiếp tục qua cùng lời nhắc đó mà không dùng micrô khi lựa chọn đó có sẵn.
Nếu hồ sơ trình duyệt chưa đăng nhập, Meet đang chờ chủ phòng chấp nhận,
Chrome cần quyền micrô/camera cho một lần tham gia realtime, hoặc Meet bị kẹt
ở một lời nhắc mà tự động hóa không thể xử lý, kết quả join/test-speech báo cáo
`manualActionRequired: true` với `manualActionReason` và
`manualActionMessage`. Tác tử nên dừng thử lại thao tác tham gia, báo cáo đúng
thông báo đó cùng với `browserUrl`/`browserTitle` hiện tại, và chỉ thử lại sau khi
thao tác thủ công trên trình duyệt đã hoàn tất.

Nếu bỏ qua `chromeNode.node`, OpenClaw chỉ tự động chọn khi đúng một
node đã kết nối quảng bá cả `googlemeet.chrome` và điều khiển trình duyệt. Nếu
có nhiều node đủ khả năng đang kết nối, hãy đặt `chromeNode.node` thành id node,
tên hiển thị, hoặc IP từ xa.

Các kiểm tra lỗi thường gặp:

- `Configured Google Meet node ... is not usable: offline`: node được ghim
  đã được Gateway biết đến nhưng không khả dụng. Tác tử nên xem node đó là
  trạng thái chẩn đoán, không phải máy chủ Chrome có thể dùng, và báo cáo chướng ngại thiết lập
  thay vì quay lui sang một phương thức vận chuyển khác trừ khi người dùng yêu cầu điều đó.
- `No connected Google Meet-capable node`: khởi động `openclaw node run` trong VM,
  phê duyệt ghép nối, và bảo đảm `openclaw plugins enable google-meet` và
  `openclaw plugins enable browser` đã được chạy trong VM. Đồng thời xác nhận
  máy chủ Gateway cho phép cả hai lệnh node với
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: cài đặt `blackhole-2ch` trên máy chủ
  đang được kiểm tra và khởi động lại trước khi dùng âm thanh Chrome cục bộ.
- `BlackHole 2ch audio device not found on the node`: cài đặt `blackhole-2ch`
  trong VM và khởi động lại VM.
- Chrome mở nhưng không thể tham gia: đăng nhập vào hồ sơ trình duyệt bên trong VM, hoặc
  giữ `chrome.guestName` được đặt cho tham gia với tư cách khách. Tự động tham gia với tư cách khách dùng
  tự động hóa trình duyệt OpenClaw thông qua proxy trình duyệt của node; hãy bảo đảm cấu hình trình duyệt
  của node trỏ tới hồ sơ bạn muốn, ví dụ
  `browser.defaultProfile: "user"` hoặc một hồ sơ phiên hiện có có tên.
- Tab Meet trùng lặp: giữ bật `chrome.reuseExistingTab: true`. OpenClaw
  kích hoạt tab hiện có cho cùng URL Meet trước khi mở tab mới, và
  việc tạo cuộc họp bằng trình duyệt tái sử dụng một tab `https://meet.google.com/new`
  hoặc tab lời nhắc tài khoản Google đang diễn ra trước khi mở tab khác.
- Không có âm thanh: trong Meet, định tuyến micrô/loa qua đường dẫn thiết bị âm thanh ảo
  được OpenClaw dùng; dùng các thiết bị ảo riêng biệt hoặc định tuyến kiểu Loopback
  để có âm thanh song công sạch.

## Ghi chú cài đặt

Mặc định phản hồi giọng nói của Chrome dùng hai công cụ bên ngoài:

- `sox`: tiện ích âm thanh dòng lệnh. Plugin dùng các lệnh thiết bị CoreAudio
  tường minh cho cầu nối âm thanh PCM16 24 kHz mặc định.
- `blackhole-2ch`: trình điều khiển âm thanh ảo của macOS. Nó tạo thiết bị âm thanh `BlackHole 2ch`
  mà Chrome/Meet có thể định tuyến qua.

OpenClaw không đóng gói hoặc phân phối lại gói nào trong hai gói này. Tài liệu yêu cầu người dùng
cài đặt chúng làm phụ thuộc máy chủ thông qua Homebrew. SoX được cấp phép theo
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole là GPL-3.0. Nếu bạn xây dựng một
trình cài đặt hoặc appliance đóng gói BlackHole cùng OpenClaw, hãy xem xét các điều khoản cấp phép
upstream của BlackHole hoặc lấy giấy phép riêng từ Existential Audio.

## Phương thức vận chuyển

### Chrome

Phương thức vận chuyển Chrome mở URL Meet thông qua điều khiển trình duyệt OpenClaw và tham gia
bằng hồ sơ trình duyệt OpenClaw đã đăng nhập. Trên macOS, Plugin kiểm tra
`BlackHole 2ch` trước khi khởi chạy. Nếu được cấu hình, nó cũng chạy một lệnh
kiểm tra sức khỏe cầu nối âm thanh và lệnh khởi động trước khi mở Chrome. Dùng `chrome` khi
Chrome/âm thanh nằm trên máy chủ Gateway; dùng `chrome-node` khi Chrome/âm thanh nằm
trên node đã ghép nối, chẳng hạn VM macOS Parallels. Với Chrome cục bộ, chọn
hồ sơ bằng `browser.defaultProfile`; `chrome.browserProfile` được truyền tới
máy chủ `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Định tuyến âm thanh micrô và loa Chrome qua cầu nối âm thanh OpenClaw cục bộ.
Nếu chưa cài đặt `BlackHole 2ch`, thao tác tham gia thất bại với lỗi thiết lập
thay vì âm thầm tham gia mà không có đường dẫn âm thanh.

### Twilio

Phương thức vận chuyển Twilio là một kế hoạch quay số nghiêm ngặt được ủy quyền cho Plugin Voice Call. Nó
không phân tích cú pháp các trang Meet để tìm số điện thoại.

Dùng phương thức này khi không có khả năng tham gia bằng Chrome hoặc bạn muốn một
phương án quay số điện thoại dự phòng. Google Meet phải hiển thị số gọi vào và PIN cho
cuộc họp; OpenClaw không tự phát hiện chúng từ trang Meet.

Bật Plugin Voice Call trên máy chủ Gateway, không phải trên node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Cung cấp thông tin xác thực Twilio thông qua môi trường hoặc cấu hình. Môi trường giữ
bí mật nằm ngoài `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Thay vào đó, dùng `realtime.provider: "openai"` với Plugin nhà cung cấp OpenAI và
`OPENAI_API_KEY` nếu đó là nhà cung cấp giọng nói realtime của bạn.

Khởi động lại hoặc tải lại Gateway sau khi bật `voice-call`; các thay đổi cấu hình Plugin
không xuất hiện trong tiến trình Gateway đang chạy cho tới khi nó tải lại.

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

OAuth là tùy chọn để tạo liên kết Meet vì `googlemeet create` có thể quay lui
sang tự động hóa trình duyệt. Cấu hình OAuth khi bạn muốn tạo bằng API chính thức,
phân giải không gian, hoặc kiểm tra preflight Meet Media API.

Quyền truy cập Google Meet API dùng OAuth người dùng: tạo một Google Cloud OAuth client,
yêu cầu các scope bắt buộc, ủy quyền một tài khoản Google, rồi lưu
refresh token thu được trong cấu hình Plugin Google Meet hoặc cung cấp các
biến môi trường `OPENCLAW_GOOGLE_MEET_*`.

OAuth không thay thế đường tham gia Chrome. Các phương thức vận chuyển Chrome và Chrome-node
vẫn tham gia thông qua một hồ sơ Chrome đã đăng nhập, BlackHole/SoX, và một node đã kết nối
khi bạn dùng tham gia bằng trình duyệt. OAuth chỉ dành cho đường Google Meet API
chính thức: tạo không gian cuộc họp, phân giải không gian, và chạy kiểm tra preflight
Meet Media API.

### Tạo thông tin xác thực Google

Trong Google Cloud Console:

1. Tạo hoặc chọn một dự án Google Cloud.
2. Bật **Google Meet REST API** cho dự án đó.
3. Cấu hình màn hình đồng ý OAuth.
   - **Internal** là đơn giản nhất cho một tổ chức Google Workspace.
   - **External** hoạt động cho thiết lập cá nhân/thử nghiệm; khi ứng dụng ở chế độ Testing,
     hãy thêm từng tài khoản Google sẽ ủy quyền ứng dụng làm người dùng thử nghiệm.
4. Thêm các scope mà OpenClaw yêu cầu:
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

`meetings.space.created` là bắt buộc bởi Google Meet `spaces.create`.
`meetings.space.readonly` cho phép OpenClaw phân giải URL/mã Meet thành không gian.
`meetings.space.settings` cho phép OpenClaw truyền các cài đặt `SpaceConfig` như
`accessType` trong quá trình tạo phòng bằng API.
`meetings.conference.media.readonly` dành cho preflight Meet Media API và công việc media;
Google có thể yêu cầu đăng ký Developer Preview để thực sự dùng Media API.
Nếu bạn chỉ cần tham gia Chrome dựa trên trình duyệt, hãy bỏ qua OAuth hoàn toàn.

### Mint refresh token

Cấu hình `oauth.clientId` và tùy chọn `oauth.clientSecret`, hoặc truyền chúng dưới dạng
biến môi trường, rồi chạy:

```bash
openclaw googlemeet auth login --json
```

Lệnh in một khối cấu hình `oauth` với refresh token. Nó dùng PKCE,
callback localhost tại `http://localhost:8085/oauth2callback`, và một luồng
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
Nếu có cả giá trị cấu hình và môi trường, Plugin phân giải cấu hình
trước rồi mới quay lui sang môi trường.

Đồng ý OAuth bao gồm tạo không gian Meet, quyền đọc không gian Meet, và quyền đọc media
hội nghị Meet. Nếu bạn đã xác thực trước khi hỗ trợ tạo cuộc họp
tồn tại, hãy chạy lại `openclaw googlemeet auth login --json` để refresh
token có scope `meetings.space.created`.

### Xác minh OAuth bằng doctor

Chạy doctor OAuth khi bạn muốn kiểm tra sức khỏe nhanh, không lộ bí mật:

```bash
openclaw googlemeet doctor --oauth --json
```

Lệnh này không tải runtime Chrome hoặc yêu cầu node Chrome đã kết nối. Nó
kiểm tra rằng cấu hình OAuth tồn tại và refresh token có thể tạo access
token. Báo cáo JSON chỉ bao gồm các trường trạng thái như `ok`, `configured`,
`tokenSource`, `expiresAt`, và thông báo kiểm tra; nó không in access
token, refresh token, hoặc client secret.

Kết quả thường gặp:

| Kiểm tra             | Ý nghĩa                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Có `oauth.clientId` cộng với `oauth.refreshToken`, hoặc một mã truy cập đã lưu đệm.     |
| `oauth-token`        | Mã truy cập đã lưu đệm vẫn còn hợp lệ, hoặc mã làm mới đã tạo một mã truy cập mới.      |
| `meet-spaces-get`    | Kiểm tra `--meeting` tùy chọn đã phân giải một không gian Meet hiện có.                 |
| `meet-spaces-create` | Kiểm tra `--create-space` tùy chọn đã tạo một không gian Meet mới.                      |

Để chứng minh việc bật Google Meet API và phạm vi `spaces.create`, hãy chạy
kiểm tra tạo có tác dụng phụ:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tạo một URL Meet dùng tạm. Dùng tùy chọn này khi bạn cần xác nhận
rằng dự án Google Cloud đã bật Meet API và tài khoản được ủy quyền có phạm vi
`meetings.space.created`.

Để chứng minh quyền đọc cho một không gian cuộc họp hiện có:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` và `resolve-space` chứng minh quyền đọc đối với một
không gian hiện có mà tài khoản Google được ủy quyền có thể truy cập. Lỗi `403`
từ các kiểm tra này thường có nghĩa là Google Meet REST API bị tắt, mã làm mới
đã đồng ý thiếu phạm vi bắt buộc, hoặc tài khoản Google không thể truy cập không
gian Meet đó. Lỗi mã làm mới nghĩa là hãy chạy lại `openclaw googlemeet auth login
--json` và lưu khối `oauth` mới.

Không cần thông tin xác thực OAuth cho phương án dự phòng bằng trình duyệt. Ở
chế độ đó, xác thực Google đến từ hồ sơ Chrome đã đăng nhập trên node được chọn,
không phải từ cấu hình OpenClaw.

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

Chạy kiểm tra trước khi làm việc với phương tiện:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Liệt kê tạo tác cuộc họp và điểm danh sau khi Meet đã tạo bản ghi hội nghị:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Với `--meeting`, `artifacts` và `attendance` mặc định dùng bản ghi hội nghị mới
nhất. Truyền `--all-conference-records` khi bạn muốn mọi bản ghi còn được lưu giữ
cho cuộc họp đó.

Tra cứu Calendar có thể phân giải URL cuộc họp từ Google Calendar trước khi đọc
tạo tác Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` tìm kiếm lịch `primary` của hôm nay để tìm một sự kiện Calendar có
liên kết Google Meet. Dùng `--event <query>` để tìm kiếm văn bản sự kiện khớp, và
`--calendar <id>` cho lịch không phải lịch chính. Tra cứu Calendar yêu cầu đăng
nhập OAuth mới có bao gồm phạm vi chỉ đọc sự kiện Calendar.
`calendar-events` xem trước các sự kiện Meet khớp và đánh dấu sự kiện mà
`latest`, `artifacts`, `attendance`, hoặc `export` sẽ chọn.

Nếu bạn đã biết id bản ghi hội nghị, hãy tham chiếu trực tiếp:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Kết thúc một hội nghị đang hoạt động cho một không gian được tạo bằng API khi
bạn muốn đóng phòng sau cuộc gọi:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Lệnh này gọi Google Meet `spaces.endActiveConference` và yêu cầu OAuth với phạm
vi `meetings.space.created` cho một không gian mà tài khoản được ủy quyền có thể
quản lý. OpenClaw chấp nhận URL Meet, mã cuộc họp, hoặc đầu vào `spaces/{id}` và
phân giải nó thành tài nguyên không gian API trước khi kết thúc hội nghị đang
hoạt động.
Lệnh này tách biệt với `googlemeet leave`: `leave` dừng sự tham gia cục bộ/phiên
của OpenClaw, còn `end-active-conference` yêu cầu Google Meet kết thúc hội nghị
đang hoạt động cho không gian đó.

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

`artifacts` trả về siêu dữ liệu bản ghi hội nghị cùng với siêu dữ liệu tài
nguyên người tham gia, bản ghi, bản chép lời, mục bản chép lời có cấu trúc và
ghi chú thông minh khi Google cung cấp cho cuộc họp. Dùng
`--no-transcript-entries` để bỏ qua tra cứu mục cho các cuộc họp lớn.
`attendance` mở rộng người tham gia thành các hàng phiên người tham gia với thời
điểm thấy lần đầu/lần cuối, tổng thời lượng phiên, cờ đến muộn/rời sớm, và các
tài nguyên người tham gia trùng lặp được hợp nhất theo người dùng đã đăng nhập
hoặc tên hiển thị. Truyền `--no-merge-duplicates` để giữ riêng các tài nguyên
người tham gia thô, `--late-after-minutes` để điều chỉnh phát hiện đến muộn, và
`--early-before-minutes` để điều chỉnh phát hiện rời sớm.

`export` ghi một thư mục chứa `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, và `manifest.json`.
`manifest.json` ghi lại đầu vào đã chọn, tùy chọn xuất, bản ghi hội nghị, tệp
đầu ra, số lượng, nguồn mã thông báo, sự kiện Calendar khi có dùng, và mọi cảnh
báo truy xuất một phần. Truyền `--zip` để cũng ghi một kho lưu trữ di động bên
cạnh thư mục. Truyền `--include-doc-bodies` để xuất văn bản Google Docs của bản
chép lời được liên kết và ghi chú thông minh thông qua Google Drive
`files.export`; việc này yêu cầu đăng nhập OAuth mới có bao gồm phạm vi chỉ đọc
Drive Meet. Không có `--include-doc-bodies`, bản xuất chỉ bao gồm siêu dữ liệu
Meet và các mục bản chép lời có cấu trúc. Nếu Google trả về lỗi tạo tác một phần,
chẳng hạn như lỗi liệt kê ghi chú thông minh, mục bản chép lời, hoặc phần thân
tài liệu Drive, phần tóm tắt và manifest sẽ giữ cảnh báo thay vì làm hỏng toàn
bộ bản xuất.
Dùng `--dry-run` để lấy cùng dữ liệu tạo tác/điểm danh và in JSON manifest mà
không tạo thư mục hoặc ZIP. Điều đó hữu ích trước khi ghi một bản xuất lớn hoặc
khi một agent chỉ cần số lượng, bản ghi đã chọn, và cảnh báo.

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

Đặt `"dryRun": true` để chỉ trả về manifest xuất và bỏ qua việc ghi tệp.

Agent cũng có thể tạo một phòng được API hỗ trợ với chính sách truy cập rõ ràng:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
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

Để xác thực nghe trước, agent nên dùng `test_listen` trước khi khẳng định cuộc
họp là hữu ích:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Chạy live smoke được bảo vệ đối với một cuộc họp thật còn được lưu giữ:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Chạy probe trình duyệt nghe trước trực tiếp đối với một cuộc họp nơi sẽ có người
nói và có phụ đề Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Môi trường live smoke:

- `OPENCLAW_LIVE_TEST=1` bật các kiểm thử live được bảo vệ.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` trỏ tới một URL Meet, mã, hoặc
  `spaces/{id}` còn được lưu giữ.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` hoặc `GOOGLE_MEET_CLIENT_ID` cung cấp id ứng
  dụng khách OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` hoặc `GOOGLE_MEET_REFRESH_TOKEN` cung cấp
  mã làm mới.
- Tùy chọn: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, và
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` dùng cùng tên dự phòng không có
  tiền tố `OPENCLAW_`.

Live smoke tạo tác/điểm danh cơ sở cần
`https://www.googleapis.com/auth/meetings.space.readonly` và
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Tra cứu
Calendar cần `https://www.googleapis.com/auth/calendar.events.readonly`. Xuất
phần thân tài liệu Drive cần
`https://www.googleapis.com/auth/drive.meet.readonly`.

Tạo một không gian Meet mới:

```bash
openclaw googlemeet create
```

Lệnh in ra `meeting uri`, nguồn và phiên tham gia mới. Với thông tin xác thực
OAuth, lệnh dùng Google Meet API chính thức. Không có thông tin xác thực OAuth,
lệnh dùng hồ sơ trình duyệt đã đăng nhập của node Chrome được ghim làm phương án
dự phòng. Agent có thể dùng công cụ `google_meet` với `action: "create"` để tạo
và tham gia trong một bước. Để chỉ tạo URL, truyền `"join": false`.

Ví dụ đầu ra JSON từ phương án dự phòng bằng trình duyệt:

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

Nếu phương án dự phòng bằng trình duyệt gặp chặn đăng nhập Google hoặc quyền Meet
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

Khi một agent thấy `manualActionRequired: true`, nó nên báo cáo
`manualActionMessage` cùng với ngữ cảnh node/tab trình duyệt và dừng mở các tab
Meet mới cho đến khi người vận hành hoàn tất bước trên trình duyệt.

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

Theo mặc định, việc tạo Meet sẽ tham gia cuộc họp. Transport Chrome hoặc Chrome-node vẫn
cần một hồ sơ Google Chrome đã đăng nhập để tham gia qua trình duyệt. Nếu hồ sơ
đã đăng xuất, OpenClaw báo cáo `manualActionRequired: true` hoặc một lỗi dự
phòng của trình duyệt và yêu cầu người vận hành hoàn tất đăng nhập Google trước
khi thử lại.

Chỉ đặt `preview.enrollmentAcknowledged: true` sau khi xác nhận dự án Cloud,
OAuth principal và người tham gia cuộc họp của bạn đã được đăng ký vào Google
Workspace Developer Preview Program cho Meet media APIs.

## Cấu hình

Đường dẫn tác nhân Chrome chung chỉ cần bật Plugin, BlackHole, SoX, một khóa nhà
cung cấp phiên âm thời gian thực và một nhà cung cấp TTS OpenClaw đã được cấu hình.
OpenAI là nhà cung cấp phiên âm mặc định; đặt `realtime.voiceProvider` thành
`"google"` và `realtime.model` để dùng Google Gemini Live cho chế độ `bidi`
mà không thay đổi nhà cung cấp phiên âm mặc định của chế độ tác nhân:

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
- `defaultMode: "agent"` (`"realtime"` chỉ được chấp nhận như một bí danh tương
  thích kế thừa cho `"agent"`; các lệnh gọi công cụ mới nên dùng `"agent"`)
- `chromeNode.node`: id/tên/IP node tùy chọn cho `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: tên dùng trên màn hình khách Meet khi
  chưa đăng nhập
- `chrome.autoJoin: true`: nỗ lực tốt nhất để điền tên khách và bấm Join Now
  qua tự động hóa trình duyệt OpenClaw trên `chrome-node`
- `chrome.reuseExistingTab: true`: kích hoạt một thẻ Meet hiện có thay vì mở
  các bản trùng lặp
- `chrome.waitForInCallMs: 20000`: chờ thẻ Meet báo cáo đang trong cuộc gọi
  trước khi kích hoạt lời giới thiệu phản hồi bằng giọng nói
- `chrome.audioFormat: "pcm16-24khz"`: định dạng âm thanh cặp lệnh. Chỉ dùng
  `"g711-ulaw-8khz"` cho các cặp lệnh kế thừa/tùy chỉnh vẫn phát âm thanh điện
  thoại.
- `chrome.audioBufferBytes: 4096`: bộ đệm xử lý SoX cho các lệnh âm thanh cặp
  lệnh Chrome được tạo. Giá trị này bằng một nửa bộ đệm mặc định 8192 byte của
  SoX, giảm độ trễ ống dẫn mặc định trong khi vẫn còn khoảng để tăng trên các
  máy chủ bận. Các giá trị thấp hơn mức tối thiểu của SoX được kẹp về 17 byte.
- `chrome.audioInputCommand`: lệnh SoX đọc từ CoreAudio `BlackHole 2ch` và ghi
  âm thanh theo `chrome.audioFormat`
- `chrome.audioOutputCommand`: lệnh SoX đọc âm thanh theo `chrome.audioFormat`
  và ghi vào CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: lệnh micro cục bộ tùy chọn ghi PCM mono
  little-endian 16 bit có dấu để phát hiện người dùng chen ngang khi phát lại
  của trợ lý đang hoạt động. Hiện tại điều này áp dụng cho cầu nối cặp lệnh
  `chrome` do Gateway lưu trữ.
- `chrome.bargeInRmsThreshold: 650`: mức RMS được tính là người dùng chen ngang
  trên `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: mức đỉnh được tính là người dùng chen
  ngang trên `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: độ trễ tối thiểu giữa các lần xóa chen ngang
  lặp lại của người dùng
- `mode: "agent"`: chế độ phản hồi bằng giọng nói mặc định. Lời nói của người
  tham gia được nhà cung cấp phiên âm thời gian thực đã cấu hình phiên âm, gửi
  đến tác nhân OpenClaw đã cấu hình trong một phiên tác nhân phụ theo từng cuộc
  họp, rồi được nói lại qua runtime TTS OpenClaw thông thường.
- `mode: "bidi"`: chế độ mô hình thời gian thực hai chiều trực tiếp dự phòng.
  Nhà cung cấp giọng nói thời gian thực trả lời trực tiếp lời nói của người
  tham gia và có thể gọi `openclaw_agent_consult` để có câu trả lời sâu hơn/dựa
  trên công cụ.
- `mode: "transcribe"`: chế độ chỉ quan sát, không có cầu nối phản hồi bằng giọng nói.
- `realtime.provider: "openai"`: dự phòng tương thích được dùng khi các trường
  nhà cung cấp có phạm vi bên dưới chưa được đặt.
- `realtime.transcriptionProvider: "openai"`: id nhà cung cấp được chế độ
  `agent` dùng cho phiên âm thời gian thực.
- `realtime.voiceProvider`: id nhà cung cấp được chế độ `bidi` dùng cho giọng
  nói thời gian thực trực tiếp. Đặt giá trị này thành `"google"` để dùng Gemini
  Live trong khi giữ phiên âm chế độ tác nhân trên OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: câu trả lời nói ngắn gọn, với
  `openclaw_agent_consult` cho câu trả lời sâu hơn
- `realtime.introMessage`: kiểm tra sẵn sàng bằng lời nói ngắn khi cầu nối thời
  gian thực kết nối; đặt thành `""` để tham gia im lặng
- `realtime.agentId`: id tác nhân OpenClaw tùy chọn cho
  `openclaw_agent_consult`; mặc định là `main`

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
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs cho cả nghe và nói ở chế độ tác nhân:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

Giọng nói Meet bền vững đến từ
`messages.tts.providers.elevenlabs.speakerVoiceId`. Câu trả lời của tác nhân
cũng có thể dùng chỉ thị theo từng câu trả lời
`[[tts:speakerVoiceId=... model=eleven_v3]]` khi ghi đè mô hình TTS được bật,
nhưng cấu hình là mặc định xác định cho các cuộc họp. Khi tham gia, nhật ký nên
hiển thị `transcriptionProvider=elevenlabs` và mỗi câu trả lời được nói nên ghi
`provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Cấu hình chỉ Twilio:

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

`voiceCall.enabled` mặc định là `true`; với transport Twilio, nó ủy quyền cuộc
gọi PSTN thực tế, DTMF và lời chào giới thiệu cho Plugin Voice Call. Voice Call
phát chuỗi DTMF trước khi mở luồng phương tiện thời gian thực, rồi dùng văn bản
giới thiệu đã lưu làm lời chào thời gian thực ban đầu. Nếu `voice-call` chưa
được bật, Google Meet vẫn có thể xác thực và ghi lại kế hoạch quay số, nhưng
không thể thực hiện cuộc gọi Twilio.

## Công cụ

Tác nhân có thể dùng công cụ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Dùng `transport: "chrome"` khi Chrome chạy trên máy chủ Gateway. Dùng
`transport: "chrome-node"` khi Chrome chạy trên một node đã ghép đôi, chẳng hạn
một VM Parallels. Trong cả hai trường hợp, các nhà cung cấp mô hình và
`openclaw_agent_consult` chạy trên máy chủ Gateway, nên thông tin xác thực mô
hình vẫn ở đó. Với `mode: "agent"` mặc định, nhà cung cấp phiên âm thời gian
thực xử lý phần nghe, tác nhân OpenClaw đã cấu hình tạo câu trả lời, và TTS
OpenClaw thông thường nói câu đó vào Meet. Dùng `mode: "bidi"` khi bạn muốn mô
hình giọng nói thời gian thực trả lời trực tiếp. `mode: "realtime"` thô vẫn
được chấp nhận như một bí danh tương thích kế thừa cho `mode: "agent"`, nhưng
không còn được quảng bá trong schema công cụ tác nhân. Nhật ký chế độ tác nhân
bao gồm nhà cung cấp/mô hình phiên âm đã phân giải khi khởi động cầu nối và nhà
cung cấp TTS, mô hình, giọng nói, định dạng đầu ra và tốc độ mẫu sau mỗi câu
trả lời được tổng hợp.

Dùng `action: "status"` để liệt kê các phiên hoạt động hoặc kiểm tra một ID
phiên. Dùng `action: "speak"` với `sessionId` và `message` để yêu cầu tác nhân
thời gian thực nói ngay lập tức. Dùng `action: "test_speech"` để tạo hoặc tái sử
dụng phiên, kích hoạt một cụm từ đã biết, và trả về tình trạng `inCall` khi máy
chủ Chrome có thể báo cáo. `test_speech` luôn ép buộc `mode: "agent"` và thất
bại nếu được yêu cầu chạy trong `mode: "transcribe"` vì các phiên chỉ quan sát
cố ý không thể phát lời nói. Kết quả `speechOutputVerified` của nó dựa trên số
byte đầu ra âm thanh thời gian thực tăng lên trong lệnh gọi kiểm thử này, nên
một phiên được tái sử dụng với âm thanh cũ hơn không được tính là kiểm tra lời
nói thành công mới. Dùng `action: "leave"` để đánh dấu một phiên đã kết thúc.

`status` bao gồm tình trạng Chrome khi có sẵn:

- `inCall`: Chrome có vẻ đang ở trong cuộc gọi Meet
- `micMuted`: trạng thái micro Meet theo nỗ lực tốt nhất
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: hồ sơ
  trình duyệt cần đăng nhập thủ công, được máy chủ Meet chấp nhận, cấp quyền,
  hoặc sửa điều khiển trình duyệt trước khi lời nói có thể hoạt động
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: liệu lời nói
  Chrome được quản lý hiện có được phép hay không. `speechReady: false` nghĩa là
  OpenClaw không gửi cụm từ giới thiệu/kiểm thử vào cầu nối âm thanh.
- `providerConnected` / `realtimeReady`: trạng thái cầu nối giọng nói thời gian thực
- `lastInputAt` / `lastOutputAt`: âm thanh cuối cùng được thấy từ hoặc gửi đến cầu nối
- `audioOutputRouted` / `audioOutputDeviceLabel`: liệu đầu ra phương tiện của
  thẻ Meet có được chủ động định tuyến đến thiết bị BlackHole mà cầu nối sử
  dụng hay không
- `lastSuppressedInputAt` / `suppressedInputBytes`: đầu vào loopback bị bỏ qua
  khi phát lại của trợ lý đang hoạt động

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Chế độ tác nhân và bidi

Chế độ Chrome `agent` được tối ưu cho hành vi "tác nhân của tôi đang ở trong
cuộc họp". Nhà cung cấp phiên âm thời gian thực nghe âm thanh cuộc họp, bản
phiên âm cuối của người tham gia được định tuyến qua tác nhân OpenClaw đã cấu
hình, và câu trả lời được nói qua runtime TTS OpenClaw thông thường. Đặt
`mode: "bidi"` khi bạn muốn mô hình giọng nói thời gian thực trả lời trực tiếp.
Các đoạn bản phiên âm cuối gần nhau được hợp nhất trước khi tham vấn để một lượt
nói không tạo ra nhiều câu trả lời từng phần đã cũ. Đầu vào thời gian thực cũng
bị chặn khi âm thanh trợ lý trong hàng đợi vẫn đang phát, và các tiếng vọng bản
phiên âm gần đây giống trợ lý bị bỏ qua trước khi tham vấn tác nhân để loopback
BlackHole không khiến tác nhân trả lời chính lời nói của nó.

| Chế độ  | Ai quyết định câu trả lời     | Đường dẫn đầu ra lời nói               | Dùng khi                                               |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Tác nhân OpenClaw đã cấu hình | Runtime TTS OpenClaw thông thường      | Bạn muốn hành vi "tác nhân của tôi đang ở trong cuộc họp" |
| `bidi`  | Mô hình giọng nói thời gian thực | Phản hồi âm thanh của nhà cung cấp giọng nói thời gian thực | Bạn muốn vòng lặp giọng nói hội thoại có độ trễ thấp nhất |

Ở chế độ `bidi`, khi mô hình thời gian thực cần lập luận sâu hơn, thông tin
hiện tại, hoặc các công cụ OpenClaw thông thường, nó có thể gọi
`openclaw_agent_consult`.

Công cụ consult chạy agent OpenClaw thông thường ở hậu trường với ngữ cảnh
bản chép lời cuộc họp gần đây và trả về một câu trả lời nói ngắn gọn. Ở chế độ `agent`,
OpenClaw gửi trực tiếp câu trả lời đó đến runtime TTS; ở chế độ `bidi`, mô hình
giọng nói realtime có thể nói kết quả consult trở lại cuộc họp. Nó dùng cùng
cơ chế consult dùng chung như Voice Call.

Theo mặc định, các consult chạy với agent `main`. Đặt `realtime.agentId` khi một
làn Meet cần consult một workspace agent OpenClaw chuyên dụng, giá trị mặc định
của mô hình, chính sách công cụ, bộ nhớ và lịch sử phiên.

Consult ở chế độ agent dùng khóa phiên theo từng cuộc họp `agent:<id>:subagent:google-meet:<session>`
để các câu hỏi tiếp theo giữ ngữ cảnh cuộc họp trong khi kế thừa chính sách
agent thông thường từ agent đã cấu hình.

`realtime.toolPolicy` kiểm soát lần chạy consult:

- `safe-read-only`: hiển thị công cụ consult và giới hạn agent thông thường ở
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, và
  `memory_get`.
- `owner`: hiển thị công cụ consult và cho phép agent thông thường dùng chính sách
  công cụ agent bình thường.
- `none`: không hiển thị công cụ consult cho mô hình giọng nói realtime.

Khóa phiên consult được giới hạn theo từng phiên Meet, nên các lệnh gọi consult
tiếp theo có thể tái sử dụng ngữ cảnh consult trước đó trong cùng cuộc họp.

Để buộc kiểm tra trạng thái sẵn sàng bằng giọng nói sau khi Chrome đã tham gia hoàn toàn cuộc gọi:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Cho smoke join-and-speak đầy đủ:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Danh sách kiểm tra kiểm thử live

Dùng chuỗi này trước khi giao cuộc họp cho một agent không có người giám sát:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Trạng thái Chrome-node kỳ vọng:

- `googlemeet setup` toàn bộ màu xanh.
- `googlemeet setup` bao gồm `chrome-node-connected` khi Chrome-node là transport
  mặc định hoặc một node được ghim.
- `nodes status` hiển thị node đã chọn đang kết nối.
- Node đã chọn quảng bá cả `googlemeet.chrome` và `browser.proxy`.
- Tab Meet tham gia cuộc gọi và `test-speech` trả về tình trạng Chrome với
  `inCall: true`.

Với máy chủ Chrome từ xa như VM macOS Parallels, đây là kiểm tra an toàn ngắn nhất
sau khi cập nhật Gateway hoặc VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Điều đó chứng minh Plugin Gateway đã được tải, node VM được kết nối bằng token
hiện tại, và cầu nối âm thanh Meet có sẵn trước khi agent mở một tab cuộc họp thật.

Với smoke Twilio, dùng một cuộc họp có thông tin gọi vào bằng điện thoại:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Trạng thái Twilio kỳ vọng:

- `googlemeet setup` bao gồm các kiểm tra xanh `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials`, và `twilio-voice-call-webhook`.
- `voicecall` có sẵn trong CLI sau khi tải lại Gateway.
- Phiên trả về có `transport: "twilio"` và một `twilio.voiceCallId`.
- `openclaw logs --follow` hiển thị DTMF TwiML được phục vụ trước realtime TwiML, rồi một
  cầu nối realtime với lời chào ban đầu đã được xếp hàng.
- `googlemeet leave <sessionId>` ngắt cuộc gọi thoại đã ủy quyền.

## Khắc phục sự cố

### Agent không thấy công cụ Google Meet

Xác nhận Plugin được bật trong cấu hình Gateway và tải lại Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Nếu bạn vừa chỉnh sửa `plugins.entries.google-meet`, hãy khởi động lại hoặc tải lại Gateway.
Agent đang chạy chỉ thấy các công cụ Plugin được đăng ký bởi tiến trình Gateway
hiện tại.

Trên các máy chủ Gateway không phải macOS, công cụ dành cho agent `google_meet` vẫn hiển thị,
nhưng các hành động nói lại qua Chrome cục bộ bị chặn trước khi chạm tới cầu nối âm thanh.
Âm thanh nói lại Chrome cục bộ hiện phụ thuộc vào `BlackHole 2ch` trên macOS, nên
agent Linux nên dùng `mode: "transcribe"`, gọi vào bằng Twilio, hoặc một máy chủ
`chrome-node` macOS thay vì đường dẫn agent Chrome cục bộ mặc định.

### Không có node hỗ trợ Google Meet đang kết nối

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

Node phải được kết nối và liệt kê `googlemeet.chrome` cùng `browser.proxy`.
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
`gateway token mismatch`, hãy cài đặt lại hoặc khởi động lại node bằng token Gateway
hiện tại. Với Gateway LAN, điều này thường có nghĩa là:

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

### Trình duyệt mở nhưng agent không thể tham gia

Chạy `googlemeet test-listen` cho các lượt tham gia chỉ quan sát hoặc `googlemeet test-speech`
cho các lượt tham gia realtime, rồi kiểm tra tình trạng Chrome được trả về. Nếu một trong hai probe
báo `manualActionRequired: true`, hiển thị `manualActionMessage` cho người vận hành
và dừng thử lại cho đến khi hành động trên trình duyệt hoàn tất.

Các hành động thủ công thường gặp:

- Đăng nhập vào hồ sơ Chrome.
- Chấp nhận khách từ tài khoản chủ Meet.
- Cấp quyền microphone/camera cho Chrome khi lời nhắc quyền gốc của Chrome xuất hiện.
- Đóng hoặc sửa một hộp thoại quyền Meet bị kẹt.

Đừng báo "not signed in" chỉ vì Meet hiển thị "Do you want people to
hear you in the meeting?" Đó là màn trung gian chọn âm thanh của Meet; OpenClaw
nhấp **Use microphone** bằng tự động hóa trình duyệt khi có thể và tiếp tục
chờ trạng thái cuộc họp thật. Với phương án dự phòng trình duyệt chỉ để tạo, OpenClaw
có thể nhấp **Continue without microphone** vì việc tạo URL không cần
đường dẫn âm thanh realtime.

### Tạo cuộc họp thất bại

`googlemeet create` trước tiên dùng endpoint Google Meet API `spaces.create`
khi thông tin xác thực OAuth được cấu hình. Nếu không có thông tin xác thực OAuth,
nó dùng dự phòng trình duyệt node Chrome đã ghim. Xác nhận:

- Với tạo qua API: `oauth.clientId` và `oauth.refreshToken` đã được cấu hình,
  hoặc có các biến môi trường `OPENCLAW_GOOGLE_MEET_*` khớp.
- Với tạo qua API: refresh token được tạo sau khi hỗ trợ tạo đã được thêm.
  Token cũ hơn có thể thiếu scope `meetings.space.created`; chạy lại
  `openclaw googlemeet auth login --json` và cập nhật cấu hình Plugin.
- Với dự phòng trình duyệt: `defaultTransport: "chrome-node"` và
  `chromeNode.node` trỏ tới một node đang kết nối có `browser.proxy` và
  `googlemeet.chrome`.
- Với dự phòng trình duyệt: hồ sơ OpenClaw Chrome trên node đó đã đăng nhập
  Google và có thể mở `https://meet.google.com/new`.
- Với dự phòng trình duyệt: các lần thử lại tái sử dụng một tab `https://meet.google.com/new`
  hiện có hoặc tab lời nhắc tài khoản Google trước khi mở tab mới. Nếu agent hết thời gian,
  thử lại lệnh gọi công cụ thay vì tự mở một tab Meet khác.
- Với dự phòng trình duyệt: nếu công cụ trả về `manualActionRequired: true`, dùng
  `browser.nodeId`, `browser.targetId`, `browserUrl`, và
  `manualActionMessage` được trả về để hướng dẫn người vận hành. Không thử lại trong vòng lặp cho đến khi
  hành động đó hoàn tất.
- Với dự phòng trình duyệt: nếu Meet hiển thị "Do you want people to hear you in the
  meeting?", hãy để tab mở. OpenClaw nên nhấp **Use microphone** hoặc, với
  dự phòng chỉ để tạo, **Continue without microphone** bằng tự động hóa trình duyệt
  và tiếp tục chờ URL Meet được tạo. Nếu không thể, lỗi nên nhắc tới
  `meet-audio-choice-required`, không phải `google-login-required`.

### Agent tham gia nhưng không nói

Kiểm tra đường dẫn realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dùng `mode: "agent"` cho đường dẫn nói lại STT -> agent OpenClaw -> TTS thông thường,
hoặc `mode: "bidi"` cho dự phòng giọng nói realtime trực tiếp. `mode: "transcribe"`
cố ý không khởi động cầu nối nói lại. Để gỡ lỗi chỉ quan sát,
chạy `openclaw googlemeet status --json <session-id>` sau khi người tham gia nói
và kiểm tra `captioning`, `transcriptLines`, và `lastCaptionText`. Nếu `inCall` là
true nhưng `transcriptLines` vẫn ở `0`, phụ đề Meet có thể bị tắt, chưa ai
nói kể từ khi observer được cài, UI Meet đã thay đổi, hoặc phụ đề live
không có sẵn cho ngôn ngữ/tài khoản cuộc họp.

`googlemeet test-speech` luôn kiểm tra đường dẫn realtime và báo liệu
các byte đầu ra cầu nối có được quan sát cho lần gọi đó hay không. Nếu `speechOutputVerified` là false và
`speechOutputTimedOut` là true, provider realtime có thể đã chấp nhận
câu nói nhưng OpenClaw không thấy byte đầu ra mới tới cầu nối âm thanh Chrome.

Cũng xác minh:

- Có khóa provider realtime trên máy chủ Gateway, chẳng hạn như
  `OPENAI_API_KEY` hoặc `GEMINI_API_KEY`.
- `BlackHole 2ch` hiển thị trên máy chủ Chrome.
- `sox` tồn tại trên máy chủ Chrome.
- Microphone và loa Meet được định tuyến qua đường dẫn âm thanh ảo mà
  OpenClaw dùng. `doctor` nên hiển thị `meet output routed: yes` cho các lượt tham gia realtime Chrome cục bộ.

`googlemeet doctor [session-id]` in phiên, node, trạng thái trong cuộc gọi,
lý do hành động thủ công, kết nối provider realtime, `realtimeReady`, hoạt động
đầu vào/đầu ra âm thanh, dấu thời gian âm thanh cuối cùng, bộ đếm byte, và URL trình duyệt.
Dùng `googlemeet status [session-id] --json` khi bạn cần JSON thô. Dùng
`googlemeet doctor --oauth` khi bạn cần xác minh refresh OAuth Google Meet
mà không lộ token; thêm `--meeting` hoặc `--create-space` khi bạn cũng cần
bằng chứng Google Meet API.

Nếu agent hết thời gian và bạn thấy một tab Meet đã mở, hãy kiểm tra tab đó
mà không mở tab khác:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Hành động công cụ tương đương là `recover_current_tab`. Nó focus và kiểm tra một
tab Meet hiện có cho transport đã chọn. Với `chrome`, nó dùng điều khiển
trình duyệt cục bộ qua Gateway; với `chrome-node`, nó dùng node Chrome đã cấu hình.
Nó không mở tab mới hoặc tạo phiên mới; nó báo blocker hiện tại,
chẳng hạn như trạng thái đăng nhập, chấp nhận, quyền, hoặc chọn âm thanh.
Lệnh CLI nói chuyện với Gateway đã cấu hình, nên Gateway phải đang chạy;
`chrome-node` cũng yêu cầu node Chrome phải được kết nối.

### Kiểm tra thiết lập Twilio thất bại

`twilio-voice-call-plugin` thất bại khi `voice-call` không được cho phép hoặc không được bật.
Thêm nó vào `plugins.allow`, bật `plugins.entries.voice-call`, và tải lại
Gateway.

`twilio-voice-call-credentials` thất bại khi backend Twilio thiếu account
SID, auth token, hoặc số gọi đi. Đặt những giá trị này trên máy chủ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` thất bại khi `voice-call` không có phơi bày Webhook
công khai, hoặc khi `publicUrl` trỏ tới loopback hoặc không gian mạng riêng.
Đặt `plugins.entries.voice-call.config.publicUrl` thành URL provider công khai hoặc
cấu hình một tunnel/điểm phơi bày Tailscale cho `voice-call`.

URL loopback và riêng tư không hợp lệ cho callback của nhà mạng. Không dùng
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

Để phát triển cục bộ, hãy dùng tunnel hoặc phơi bày qua Tailscale thay vì URL
máy chủ riêng tư:

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

Theo mặc định, `voicecall smoke` chỉ kiểm tra trạng thái sẵn sàng. Để chạy thử
với một số cụ thể:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Chỉ thêm `--yes` khi bạn chủ ý muốn thực hiện một cuộc gọi thông báo đi trực
tiếp:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Cuộc gọi Twilio bắt đầu nhưng không bao giờ vào cuộc họp

Xác nhận sự kiện Meet hiển thị chi tiết gọi vào bằng điện thoại. Truyền đúng số
gọi vào và mã PIN hoặc một chuỗi DTMF tùy chỉnh:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Dùng `w` ở đầu hoặc dấu phẩy trong `--dtmf-sequence` nếu nhà cung cấp cần tạm
dừng trước khi nhập mã PIN.

Nếu cuộc gọi điện thoại được tạo nhưng danh sách người tham gia Meet không bao
giờ hiển thị người tham gia gọi vào:

- Chạy `openclaw googlemeet doctor <session-id>` để xác nhận ID cuộc gọi Twilio
  được ủy quyền, DTMF đã được đưa vào hàng đợi hay chưa, và lời chào mở đầu đã
  được yêu cầu hay chưa.
- Chạy `openclaw voicecall status --call-id <id>` và xác nhận cuộc gọi vẫn đang
  hoạt động.
- Chạy `openclaw voicecall tail` và kiểm tra rằng Webhook Twilio đang đến
  Gateway.
- Chạy `openclaw logs --follow` và tìm chuỗi Twilio Meet: Google Meet ủy quyền
  thao tác tham gia, Voice Call lưu và phục vụ TwiML DTMF trước khi kết nối,
  Voice Call phục vụ TwiML thời gian thực cho cuộc gọi Twilio, rồi Google Meet
  yêu cầu lời nói mở đầu bằng `voicecall.speak`.
- Chạy lại `openclaw googlemeet setup --transport twilio`; kiểm tra thiết lập
  màu xanh là bắt buộc nhưng không chứng minh chuỗi mã PIN cuộc họp là đúng.
- Xác nhận số gọi vào thuộc cùng lời mời Meet và cùng khu vực với mã PIN.
- Tăng `voiceCall.dtmfDelayMs` so với mặc định 12 giây nếu Meet trả lời chậm hoặc
  bản ghi cuộc gọi vẫn hiển thị lời nhắc yêu cầu mã PIN sau khi DTMF trước kết
  nối đã được gửi.
- Nếu người tham gia vào được nhưng bạn không nghe thấy lời chào, hãy kiểm tra
  `openclaw logs --follow` để tìm yêu cầu `voicecall.speak` sau DTMF và phần phát
  TTS qua media-stream hoặc phương án dự phòng Twilio `<Say>`. Nếu bản ghi cuộc
  gọi vẫn chứa "enter the meeting PIN", nhánh điện thoại chưa vào phòng Meet, vì
  vậy người tham gia cuộc họp sẽ không nghe thấy lời nói.

Nếu Webhook không đến, hãy gỡ lỗi Plugin Voice Call trước: nhà cung cấp phải truy
cập được `plugins.entries.voice-call.config.publicUrl` hoặc tunnel đã cấu hình.
Xem [Khắc phục sự cố cuộc gọi thoại](/vi/plugins/voice-call#troubleshooting).

## Ghi chú

API phương tiện chính thức của Google Meet thiên về nhận, nên việc nói vào cuộc
gọi Meet vẫn cần một đường tham gia. Plugin này giữ ranh giới đó rõ ràng: Chrome
xử lý việc tham gia bằng trình duyệt và định tuyến âm thanh cục bộ; Twilio xử lý
việc tham gia bằng gọi điện thoại vào.

Các chế độ phản hồi bằng giọng nói của Chrome cần `BlackHole 2ch` cùng với một
trong hai tùy chọn:

- `chrome.audioInputCommand` cùng với `chrome.audioOutputCommand`: OpenClaw sở
  hữu cầu nối và truyền âm thanh ở `chrome.audioFormat` giữa các lệnh đó và nhà
  cung cấp đã chọn. Chế độ agent dùng phiên âm thời gian thực cùng với TTS thông
  thường; chế độ bidi dùng nhà cung cấp giọng nói thời gian thực. Đường Chrome
  mặc định là PCM16 24 kHz với `chrome.audioBufferBytes: 4096`; G.711 mu-law
  8 kHz vẫn có sẵn cho các cặp lệnh cũ.
- `chrome.audioBridgeCommand`: một lệnh cầu nối bên ngoài sở hữu toàn bộ đường âm
  thanh cục bộ và phải thoát sau khi khởi động hoặc xác thực daemon của nó. Tùy
  chọn này chỉ hợp lệ cho `bidi` vì chế độ `agent` cần quyền truy cập trực tiếp
  vào cặp lệnh cho TTS.

Khi một agent gọi công cụ `google_meet` trong chế độ agent, phiên tư vấn cuộc họp
fork bản ghi hội thoại hiện tại của bên gọi trước khi trả lời lời nói của người
tham gia. Phiên Meet vẫn tách riêng (`agent:<agentId>:subagent:google-meet:<sessionId>`)
để các follow-up của cuộc họp không trực tiếp thay đổi bản ghi hội thoại của bên
gọi.

Để có âm thanh song công sạch, hãy định tuyến đầu ra Meet và micro Meet qua các
thiết bị ảo riêng biệt hoặc một đồ thị thiết bị ảo kiểu Loopback. Một thiết bị
BlackHole dùng chung duy nhất có thể vọng âm của người tham gia khác trở lại
cuộc gọi.

Với cầu nối Chrome theo cặp lệnh, `chrome.bargeInInputCommand` có thể lắng nghe
một micro cục bộ riêng biệt và xóa phần phát lại của trợ lý khi người dùng bắt
đầu nói. Điều này giữ lời nói của con người đi trước đầu ra của trợ lý ngay cả
khi đầu vào loopback BlackHole dùng chung bị tạm thời tắt trong lúc phát lại của
trợ lý. Giống như `chrome.audioInputCommand` và `chrome.audioOutputCommand`, đây
là một lệnh cục bộ do người vận hành cấu hình. Hãy dùng một đường dẫn lệnh hoặc
danh sách đối số đáng tin cậy rõ ràng, và không trỏ nó đến các script từ những vị
trí không đáng tin cậy.

`googlemeet speak` kích hoạt cầu nối âm thanh phản hồi bằng giọng nói đang hoạt
động cho một phiên Chrome. `googlemeet leave` dừng cầu nối đó. Đối với các phiên
Twilio được ủy quyền qua Plugin Voice Call, `leave` cũng gác cuộc gọi thoại bên
dưới. Dùng `googlemeet end-active-conference` khi bạn cũng muốn đóng hội nghị
Google Meet đang hoạt động cho một không gian do API quản lý.

## Liên quan

- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
- [Chế độ nói](/vi/nodes/talk)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
