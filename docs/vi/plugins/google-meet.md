---
read_when:
    - Bạn muốn một tác tử OpenClaw tham gia một cuộc gọi Google Meet
    - Bạn muốn một tác tử OpenClaw tạo một cuộc gọi Google Meet mới
    - Bạn đang cấu hình Chrome, nút Chrome hoặc Twilio làm phương tiện truyền tải cho Google Meet
summary: 'Plugin Google Meet: tham gia các URL Meet được chỉ định rõ ràng qua Chrome hoặc Twilio với mặc định phản hồi bằng lời nói của tác nhân'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T07:05:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Hỗ trợ người tham gia Google Meet cho OpenClaw — Plugin được thiết kế theo hướng tường minh:

- Plugin chỉ tham gia một URL `https://meet.google.com/...` tường minh.
- Plugin có thể tạo một không gian Meet mới thông qua Google Meet API, rồi tham gia
  URL được trả về.
- `agent` là chế độ phản hồi mặc định: phiên âm thời gian thực lắng nghe, tác nhân
  OpenClaw đã cấu hình trả lời, và OpenClaw TTS thông thường phát giọng nói vào Meet.
- `bidi` vẫn có sẵn làm chế độ mô hình giọng nói thời gian thực trực tiếp dự phòng.
- Tác nhân chọn hành vi tham gia bằng `mode`: dùng `agent` để lắng nghe/phản hồi
  trực tiếp, `bidi` để dự phòng giọng nói thời gian thực trực tiếp, hoặc `transcribe`
  để tham gia/điều khiển trình duyệt mà không có cầu nối phản hồi.
- Xác thực bắt đầu bằng Google OAuth cá nhân hoặc một hồ sơ Chrome đã đăng nhập.
- Không có thông báo đồng ý tự động.
- Backend âm thanh Chrome mặc định là `BlackHole 2ch`.
- Chrome có thể chạy cục bộ hoặc trên một máy chủ node đã ghép đôi.
- Twilio chấp nhận số gọi vào kèm mã PIN hoặc chuỗi DTMF tùy chọn; Twilio
  không thể gọi trực tiếp một URL Meet.
- Lệnh CLI là `googlemeet`; `meet` được dành cho các quy trình hội nghị từ xa
  rộng hơn của tác nhân.

## Bắt đầu nhanh

Cài đặt các phụ thuộc âm thanh cục bộ và cấu hình một nhà cung cấp phiên âm
thời gian thực cùng với OpenClaw TTS thông thường. OpenAI là nhà cung cấp phiên âm
mặc định; Google Gemini Live cũng hoạt động như một phương án dự phòng giọng nói
`bidi` riêng với `realtime.voiceProvider: "google"`:

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

Đầu ra thiết lập được thiết kế để tác nhân có thể đọc và nhận biết chế độ. Nó báo
cáo hồ sơ Chrome, ghim node, và với các lượt tham gia Chrome thời gian thực, cầu
nối âm thanh BlackHole/SoX cùng các kiểm tra phần mở đầu thời gian thực có độ trễ.
Với lượt tham gia chỉ quan sát, hãy kiểm tra cùng một kênh vận chuyển bằng
`--mode transcribe`; chế độ đó bỏ qua các điều kiện tiên quyết về âm thanh thời
gian thực vì nó không lắng nghe qua hoặc phát giọng nói qua cầu nối:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Khi ủy quyền Twilio được cấu hình, thiết lập cũng báo cáo liệu Plugin
`voice-call`, thông tin xác thực Twilio và khả năng công khai Webhook đã sẵn sàng
hay chưa. Xem mọi kiểm tra `ok: false` là điểm chặn cho kênh vận chuyển và chế độ
được kiểm tra trước khi yêu cầu một tác nhân tham gia. Dùng
`openclaw googlemeet setup --json` cho script hoặc đầu ra máy đọc được. Dùng
`--transport chrome`, `--transport chrome-node`, hoặc `--transport twilio` để
kiểm tra trước một kênh vận chuyển cụ thể trước khi tác nhân thử dùng.

Với Twilio, luôn kiểm tra trước kênh vận chuyển một cách tường minh khi kênh vận
chuyển mặc định là Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Việc đó phát hiện thiếu kết nối `voice-call`, thiếu thông tin xác thực Twilio,
hoặc Webhook không truy cập được trước khi tác nhân cố gắng gọi vào cuộc họp.

Tham gia cuộc họp:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Hoặc để một tác nhân tham gia thông qua công cụ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Công cụ `google_meet` dành cho tác nhân vẫn có sẵn trên các máy chủ không phải
macOS cho các luồng tạo artifact, lịch, thiết lập, phiên âm, Twilio và
`chrome-node`. Các hành động phản hồi qua Chrome cục bộ bị chặn ở đó vì đường dẫn
âm thanh Chrome đi kèm hiện phụ thuộc vào `BlackHole 2ch` của macOS. Trên Linux,
hãy dùng `mode: "transcribe"`, gọi vào bằng Twilio, hoặc một máy chủ macOS
`chrome-node` để tham gia phản hồi qua Chrome.

Tạo một cuộc họp mới và tham gia:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Với các phòng được tạo bằng API, dùng Google Meet `SpaceConfig.accessType` khi
bạn muốn chính sách không cần gõ cửa của phòng được đặt tường minh thay vì kế thừa
từ mặc định của tài khoản Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` cho phép bất kỳ ai có URL Meet tham gia mà không cần gõ cửa. `TRUSTED` cho
phép người dùng tin cậy của tổ chức chủ trì, người dùng bên ngoài được mời, và
người dùng gọi vào tham gia mà không cần gõ cửa. `RESTRICTED` giới hạn quyền vào
không cần gõ cửa cho người được mời. Các thiết lập này chỉ áp dụng cho đường dẫn
tạo chính thức của Google Meet API, nên thông tin xác thực OAuth phải được cấu hình.

Nếu bạn đã xác thực Google Meet trước khi tùy chọn này có sẵn, hãy chạy lại
`openclaw googlemeet auth login --json` sau khi thêm phạm vi
`meetings.space.settings` vào màn hình đồng ý Google OAuth của bạn.

Chỉ tạo URL mà không tham gia:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` có hai đường dẫn:

- Tạo bằng API: được dùng khi thông tin xác thực Google Meet OAuth đã được cấu hình. Đây là
  đường dẫn xác định nhất và không phụ thuộc vào trạng thái giao diện trình duyệt.
- Dự phòng bằng trình duyệt: được dùng khi không có thông tin xác thực OAuth. OpenClaw dùng
  node Chrome đã ghim, mở `https://meet.google.com/new`, chờ Google chuyển hướng đến
  một URL mã cuộc họp thực, rồi trả về URL đó. Đường dẫn này yêu cầu hồ sơ Chrome
  OpenClaw trên node đã đăng nhập vào Google.
  Tự động hóa trình duyệt xử lý lời nhắc micro lần đầu của Meet; lời nhắc đó
  không được xem là lỗi đăng nhập Google.
  Các luồng tham gia và tạo cũng cố gắng tái sử dụng một tab Meet hiện có trước khi mở
  tab mới. Việc khớp bỏ qua các chuỗi truy vấn URL vô hại như `authuser`, nên một
  lần thử lại của tác nhân sẽ tập trung vào cuộc họp đã mở thay vì tạo một tab
  Chrome thứ hai.

Đầu ra lệnh/công cụ bao gồm trường `source` (`api` hoặc `browser`) để tác nhân
có thể giải thích đường dẫn nào đã được dùng. `create` mặc định tham gia cuộc họp
mới và trả về `joined: true` cùng phiên tham gia. Để chỉ tạo URL, dùng
`create --no-join` trên CLI hoặc truyền `"join": false` cho công cụ.

Hoặc bảo một tác nhân: "Tạo một Google Meet, tham gia bằng chế độ phản hồi của
tác nhân, và gửi tôi liên kết." Tác nhân nên gọi `google_meet` với
`action: "create"` rồi chia sẻ `meetingUri` được trả về.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Với lượt tham gia chỉ quan sát/điều khiển trình duyệt, đặt `"mode": "transcribe"`.
Điều đó không khởi động cầu nối giọng nói thời gian thực hai chiều, không yêu cầu
BlackHole hoặc SoX, và sẽ không phản hồi bằng giọng nói vào cuộc họp. Các lượt tham gia
Chrome ở chế độ này cũng tránh cấp quyền micro/camera của OpenClaw và tránh đường dẫn
**Use microphone** của Meet. Nếu Meet hiển thị màn hình chọn âm thanh xen giữa, tự động hóa
sẽ thử đường dẫn không dùng micro và nếu không được thì báo cáo một hành động thủ công thay vì mở
micro cục bộ. Trong chế độ transcribe, các kênh vận chuyển Chrome được quản lý cũng cài đặt
một trình quan sát phụ đề Meet theo nỗ lực tốt nhất. `googlemeet status --json` và
`googlemeet doctor` hiển thị `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
và một đuôi `recentTranscript` ngắn để người vận hành biết liệu trình duyệt
đã tham gia cuộc gọi hay chưa và liệu phụ đề Meet có đang tạo văn bản hay không.
Dùng `openclaw googlemeet test-listen <meet-url> --transport chrome-node` khi
bạn cần một phép thử có/không: lệnh tham gia ở chế độ transcribe, chờ phụ đề hoặc
phiên âm mới có chuyển động, rồi trả về `listenVerified`, `listenTimedOut`, các trường
hành động thủ công, và trạng thái phụ đề mới nhất.

Trong các phiên thời gian thực, trạng thái `google_meet` bao gồm sức khỏe trình duyệt và cầu nối
âm thanh như `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, dấu thời gian đầu vào/đầu ra
gần nhất, bộ đếm byte, và trạng thái cầu nối đã đóng. Nếu một lời nhắc trang Meet an toàn
xuất hiện, tự động hóa trình duyệt sẽ xử lý khi có thể. Đăng nhập, chấp nhận của chủ trì, và
lời nhắc quyền trình duyệt/HĐH được báo cáo dưới dạng hành động thủ công kèm lý do và
thông điệp để tác nhân truyền đạt lại. Các phiên Chrome được quản lý chỉ phát phần mở đầu hoặc
cụm thử nghiệm sau khi sức khỏe trình duyệt báo cáo `inCall: true`; nếu không, trạng thái báo cáo
`speechReady: false` và lần thử phát giọng nói bị chặn thay vì giả vờ rằng
tác nhân đã nói vào cuộc họp.

Các lượt tham gia Chrome cục bộ dùng hồ sơ trình duyệt OpenClaw đã đăng nhập. Chế độ thời gian thực
yêu cầu `BlackHole 2ch` cho đường dẫn micro/loa mà OpenClaw sử dụng. Để có âm thanh hai chiều
sạch, dùng các thiết bị ảo riêng biệt hoặc một đồ thị kiểu Loopback; một thiết bị BlackHole
duy nhất là đủ cho một smoke test đầu tiên nhưng có thể gây vọng âm.

### Gateway cục bộ + Chrome Parallels

Bạn **không** cần một OpenClaw Gateway đầy đủ hoặc khóa API mô hình bên trong máy ảo macOS
chỉ để máy ảo sở hữu Chrome. Chạy Gateway và tác nhân cục bộ, rồi chạy một
máy chủ node trong máy ảo. Bật Plugin đi kèm trên máy ảo một lần để node
quảng bá lệnh Chrome:

Chạy ở đâu:

- Máy chủ Gateway: OpenClaw Gateway, workspace tác nhân, khóa mô hình/API, nhà cung cấp thời gian thực,
  và cấu hình Plugin Google Meet.
- Máy ảo macOS Parallels: OpenClaw CLI/máy chủ node, Google Chrome, SoX, BlackHole 2ch,
  và một hồ sơ Chrome đã đăng nhập vào Google.
- Không cần trong máy ảo: dịch vụ Gateway, cấu hình tác nhân, khóa OpenAI/GPT, hoặc thiết lập
  nhà cung cấp mô hình.

Cài đặt các phụ thuộc trong máy ảo:

```bash
brew install blackhole-2ch sox
```

Khởi động lại máy ảo sau khi cài BlackHole để macOS hiển thị `BlackHole 2ch`:

```bash
sudo reboot
```

Sau khi khởi động lại, xác minh máy ảo có thể thấy thiết bị âm thanh và các lệnh SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Cài đặt hoặc cập nhật OpenClaw trong máy ảo, rồi bật Plugin đi kèm tại đó:

```bash
openclaw plugins enable google-meet
```

Khởi động máy chủ node trong máy ảo:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Nếu `<gateway-host>` là IP LAN và bạn không dùng TLS, node sẽ từ chối
WebSocket plaintext trừ khi bạn chọn tham gia cho mạng riêng đáng tin cậy đó:

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
khi biến này có mặt trên lệnh cài đặt.

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

Bây giờ tham gia bình thường từ máy chủ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

hoặc yêu cầu tác nhân dùng công cụ `google_meet` với `transport: "chrome-node"`.

Để chạy một smoke test bằng một lệnh, tạo hoặc tái sử dụng một phiên, phát một
cụm từ đã biết, và in trạng thái phiên:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Trong quá trình tham gia realtime, tự động hóa trình duyệt của OpenClaw điền tên khách, nhấp
Tham gia/Yêu cầu tham gia, và chấp nhận lựa chọn "Dùng micrô" trong lần chạy đầu của Meet khi
lời nhắc đó xuất hiện. Trong quá trình tham gia chỉ quan sát hoặc tạo cuộc họp chỉ bằng trình duyệt, nó
tiếp tục vượt qua cùng lời nhắc đó mà không dùng micrô khi lựa chọn đó có sẵn.
Nếu hồ sơ trình duyệt chưa đăng nhập, Meet đang chờ người tổ chức cho phép vào,
Chrome cần quyền micrô/camera cho lượt tham gia realtime, hoặc Meet bị kẹt
ở một lời nhắc mà tự động hóa không thể xử lý, kết quả join/test-speech sẽ báo cáo
`manualActionRequired: true` kèm `manualActionReason` và
`manualActionMessage`. Agents nên dừng thử lại việc tham gia, báo cáo chính xác
thông báo đó cùng với `browserUrl`/`browserTitle` hiện tại, và chỉ thử lại sau khi
thao tác thủ công trong trình duyệt đã hoàn tất.

Nếu bỏ qua `chromeNode.node`, OpenClaw chỉ tự động chọn khi đúng một
node đã kết nối quảng bá cả `googlemeet.chrome` và quyền điều khiển trình duyệt. Nếu
có nhiều node đủ khả năng đang kết nối, hãy đặt `chromeNode.node` thành id node,
tên hiển thị, hoặc IP từ xa.

Các bước kiểm tra lỗi thường gặp:

- `Configured Google Meet node ... is not usable: offline`: node được ghim đã
  được Gateway biết đến nhưng không khả dụng. Agents nên coi node đó là
  trạng thái chẩn đoán, không phải máy chủ Chrome có thể dùng, và báo cáo điểm chặn
  thiết lập thay vì chuyển sang một phương thức truyền tải khác trừ khi người dùng yêu cầu.
- `No connected Google Meet-capable node`: khởi động `openclaw node run` trong VM,
  phê duyệt ghép nối, và bảo đảm `openclaw plugins enable google-meet` cùng
  `openclaw plugins enable browser` đã được chạy trong VM. Đồng thời xác nhận
  máy chủ Gateway cho phép cả hai lệnh node bằng
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: cài đặt `blackhole-2ch` trên máy chủ
  đang được kiểm tra và khởi động lại trước khi dùng âm thanh Chrome cục bộ.
- `BlackHole 2ch audio device not found on the node`: cài đặt `blackhole-2ch`
  trong VM và khởi động lại VM.
- Chrome mở nhưng không thể tham gia: đăng nhập vào hồ sơ trình duyệt bên trong VM, hoặc
  giữ `chrome.guestName` được đặt cho lượt tham gia với tư cách khách. Tự động tham gia với tư cách khách dùng
  tự động hóa trình duyệt OpenClaw thông qua proxy trình duyệt của node; hãy bảo đảm cấu hình trình duyệt
  của node trỏ tới hồ sơ bạn muốn, ví dụ
  `browser.defaultProfile: "user"` hoặc một hồ sơ phiên hiện có được đặt tên.
- Các tab Meet trùng lặp: hãy để `chrome.reuseExistingTab: true` được bật. OpenClaw
  kích hoạt một tab hiện có cho cùng URL Meet trước khi mở tab mới, và
  việc tạo cuộc họp bằng trình duyệt sẽ dùng lại một tab `https://meet.google.com/new`
  hoặc tab lời nhắc tài khoản Google đang diễn ra trước khi mở tab khác.
- Không có âm thanh: trong Meet, định tuyến âm thanh micrô/loa qua đường dẫn thiết bị âm thanh ảo
  mà OpenClaw dùng; dùng các thiết bị ảo riêng biệt hoặc định tuyến kiểu Loopback
  để có âm thanh song công sạch.

## Ghi chú cài đặt

Mặc định talk-back của Chrome dùng hai công cụ bên ngoài:

- `sox`: tiện ích âm thanh dòng lệnh. Plugin dùng các lệnh thiết bị CoreAudio
  rõ ràng cho cầu nối âm thanh PCM16 24 kHz mặc định.
- `blackhole-2ch`: trình điều khiển âm thanh ảo macOS. Nó tạo thiết bị âm thanh `BlackHole 2ch`
  mà Chrome/Meet có thể định tuyến qua.

OpenClaw không đóng gói hoặc phân phối lại bất kỳ gói nào trong hai gói này. Tài liệu yêu cầu người dùng
cài đặt chúng dưới dạng phụ thuộc máy chủ qua Homebrew. SoX được cấp phép theo
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole là GPL-3.0. Nếu bạn xây dựng một
trình cài đặt hoặc appliance đóng gói BlackHole cùng OpenClaw, hãy xem xét các điều khoản cấp phép
upstream của BlackHole hoặc lấy giấy phép riêng từ Existential Audio.

## Phương thức truyền tải

### Chrome

Phương thức truyền tải Chrome mở URL Meet thông qua điều khiển trình duyệt OpenClaw và tham gia
bằng hồ sơ trình duyệt OpenClaw đã đăng nhập. Trên macOS, Plugin kiểm tra
`BlackHole 2ch` trước khi khởi chạy. Nếu đã cấu hình, nó cũng chạy một lệnh kiểm tra sức khỏe
cầu nối âm thanh và lệnh khởi động trước khi mở Chrome. Dùng `chrome` khi
Chrome/âm thanh nằm trên máy chủ Gateway; dùng `chrome-node` khi Chrome/âm thanh nằm
trên một node đã ghép nối, chẳng hạn VM Parallels macOS. Với Chrome cục bộ, chọn
hồ sơ bằng `browser.defaultProfile`; `chrome.browserProfile` được truyền cho
máy chủ `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Định tuyến âm thanh micrô và loa của Chrome qua cầu nối âm thanh OpenClaw cục bộ.
Nếu `BlackHole 2ch` chưa được cài đặt, lượt tham gia sẽ thất bại với lỗi thiết lập
thay vì âm thầm tham gia mà không có đường dẫn âm thanh.

### Twilio

Phương thức truyền tải Twilio là một kế hoạch quay số nghiêm ngặt được ủy quyền cho Plugin Voice Call. Nó
không phân tích trang Meet để lấy số điện thoại.

Dùng phương thức này khi không thể tham gia bằng Chrome hoặc khi bạn muốn phương án dự phòng
quay số điện thoại. Google Meet phải cung cấp số điện thoại quay vào và PIN cho
cuộc họp; OpenClaw không phát hiện các thông tin đó từ trang Meet.

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

Cung cấp thông tin xác thực Twilio qua môi trường hoặc cấu hình. Môi trường giữ
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
không xuất hiện trong một tiến trình Gateway đang chạy cho đến khi tiến trình đó tải lại.

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

## OAuth và kiểm tra trước

OAuth là tùy chọn để tạo liên kết Meet vì `googlemeet create` có thể dự phòng
sang tự động hóa trình duyệt. Cấu hình OAuth khi bạn muốn tạo bằng API chính thức,
phân giải space, hoặc kiểm tra trước bằng Meet Media API.

Quyền truy cập Google Meet API dùng OAuth người dùng: tạo một Google Cloud OAuth client,
yêu cầu các scope bắt buộc, ủy quyền một tài khoản Google, rồi lưu
refresh token thu được trong cấu hình Plugin Google Meet hoặc cung cấp các
biến môi trường `OPENCLAW_GOOGLE_MEET_*`.

OAuth không thay thế đường dẫn tham gia bằng Chrome. Các phương thức truyền tải Chrome và Chrome-node
vẫn tham gia qua một hồ sơ Chrome đã đăng nhập, BlackHole/SoX, và một node
đã kết nối khi bạn dùng cách tham gia bằng trình duyệt. OAuth chỉ dành cho đường dẫn
Google Meet API chính thức: tạo meeting spaces, phân giải spaces, và chạy các kiểm tra trước
Meet Media API.

### Tạo thông tin xác thực Google

Trong Google Cloud Console:

1. Tạo hoặc chọn một dự án Google Cloud.
2. Bật **Google Meet REST API** cho dự án đó.
3. Cấu hình màn hình đồng ý OAuth.
   - **Internal** là đơn giản nhất cho một tổ chức Google Workspace.
   - **External** hoạt động cho các thiết lập cá nhân/thử nghiệm; khi ứng dụng đang ở trạng thái Testing,
     hãy thêm từng tài khoản Google sẽ ủy quyền ứng dụng làm người dùng thử nghiệm.
4. Thêm các scope mà OpenClaw yêu cầu:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Tạo một OAuth client ID.
   - Loại ứng dụng: **Web application**.
   - URI chuyển hướng được ủy quyền:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Sao chép client ID và client secret.

`meetings.space.created` được Google Meet `spaces.create` yêu cầu.
`meetings.space.readonly` cho phép OpenClaw phân giải URL/mã Meet thành spaces.
`meetings.space.settings` cho phép OpenClaw truyền các thiết lập `SpaceConfig` như
`accessType` trong quá trình tạo phòng bằng API.
`meetings.conference.media.readonly` dành cho kiểm tra trước Meet Media API và công việc
media; Google có thể yêu cầu đăng ký Developer Preview để dùng Media API thực tế.
Nếu bạn chỉ cần tham gia bằng Chrome dựa trên trình duyệt, hãy bỏ qua OAuth hoàn toàn.

### Tạo refresh token

Cấu hình `oauth.clientId` và tùy chọn `oauth.clientSecret`, hoặc truyền chúng dưới dạng
biến môi trường, rồi chạy:

```bash
openclaw googlemeet auth login --json
```

Lệnh in một khối cấu hình `oauth` có refresh token. Nó dùng PKCE,
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

Đồng ý OAuth bao gồm tạo Meet space, quyền đọc Meet space, và quyền đọc media
hội nghị Meet. Nếu bạn đã xác thực trước khi hỗ trợ tạo cuộc họp
tồn tại, hãy chạy lại `openclaw googlemeet auth login --json` để refresh
token có scope `meetings.space.created`.

### Xác minh OAuth bằng doctor

Chạy OAuth doctor khi bạn muốn kiểm tra sức khỏe nhanh, không lộ bí mật:

```bash
openclaw googlemeet doctor --oauth --json
```

Lệnh này không tải runtime Chrome hoặc yêu cầu node Chrome đã kết nối. Nó
kiểm tra rằng cấu hình OAuth tồn tại và refresh token có thể tạo access
token. Báo cáo JSON chỉ bao gồm các trường trạng thái như `ok`, `configured`,
`tokenSource`, `expiresAt`, và thông báo kiểm tra; nó không in access
token, refresh token, hoặc client secret.

Kết quả thường gặp:

| Kiểm tra            | Ý nghĩa                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `oauth-config`       | Có `oauth.clientId` cùng `oauth.refreshToken`, hoặc token truy cập được lưu trong bộ nhớ đệm.                |
| `oauth-token`        | Token truy cập được lưu trong bộ nhớ đệm vẫn hợp lệ, hoặc token làm mới đã tạo token truy cập mới.           |
| `meet-spaces-get`    | Kiểm tra `--meeting` tùy chọn đã phân giải một không gian Meet hiện có.                                      |
| `meet-spaces-create` | Kiểm tra `--create-space` tùy chọn đã tạo một không gian Meet mới.                                          |

Để chứng minh cả việc bật Google Meet API và phạm vi `spaces.create`, hãy chạy
kiểm tra tạo có tác dụng phụ:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tạo một URL Meet dùng tạm. Dùng tùy chọn này khi bạn cần xác nhận
rằng dự án Google Cloud đã bật Meet API và tài khoản được cấp quyền có phạm vi
`meetings.space.created`.

Để chứng minh quyền đọc đối với một không gian cuộc họp hiện có:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` và `resolve-space` chứng minh quyền đọc đối với một
không gian hiện có mà tài khoản Google được cấp quyền có thể truy cập. Mã `403`
từ các kiểm tra này thường có nghĩa là Google Meet REST API bị tắt, token làm mới
đã đồng ý thiếu phạm vi bắt buộc, hoặc tài khoản Google không thể truy cập không
gian Meet đó. Lỗi token làm mới có nghĩa là hãy chạy lại `openclaw googlemeet auth login
--json` và lưu khối `oauth` mới.

Không cần thông tin xác thực OAuth cho phương án dự phòng bằng trình duyệt. Ở chế
độ đó, xác thực Google đến từ hồ sơ Chrome đã đăng nhập trên Node được chọn, không
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

Chạy kiểm tra trước khi làm việc với phương tiện:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Liệt kê hiện vật cuộc họp và điểm danh sau khi Meet đã tạo bản ghi hội nghị:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Với `--meeting`, `artifacts` và `attendance` mặc định dùng bản ghi hội nghị mới
nhất. Truyền `--all-conference-records` khi bạn muốn mọi bản ghi còn được giữ lại
cho cuộc họp đó.

Tra cứu Calendar có thể phân giải URL cuộc họp từ Google Calendar trước khi đọc
hiện vật Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` tìm trong lịch `primary` của hôm nay một sự kiện Calendar có liên kết
Google Meet. Dùng `--event <query>` để tìm văn bản sự kiện khớp, và
`--calendar <id>` cho lịch không phải lịch chính. Tra cứu Calendar yêu cầu đăng
nhập OAuth mới có bao gồm phạm vi chỉ đọc sự kiện Calendar.
`calendar-events` xem trước các sự kiện Meet khớp và đánh dấu sự kiện mà
`latest`, `artifacts`, `attendance`, hoặc `export` sẽ chọn.

Nếu bạn đã biết id bản ghi hội nghị, hãy định địa chỉ trực tiếp:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Kết thúc một hội nghị đang hoạt động cho không gian được tạo bằng API khi bạn
muốn đóng phòng sau cuộc gọi:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Lệnh này gọi Google Meet `spaces.endActiveConference` và yêu cầu OAuth với phạm vi
`meetings.space.created` cho một không gian mà tài khoản được cấp quyền có thể
quản lý. OpenClaw chấp nhận đầu vào là URL Meet, mã cuộc họp, hoặc `spaces/{id}`
và phân giải nó thành tài nguyên không gian API trước khi kết thúc hội nghị đang
hoạt động.
Lệnh này tách biệt với `googlemeet leave`: `leave` dừng việc tham gia cục bộ/phiên
của OpenClaw, còn `end-active-conference` yêu cầu Google Meet kết thúc hội nghị
đang hoạt động cho không gian.

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
người tham gia, bản ghi, bản chép lời, mục bản chép lời có cấu trúc, và ghi chú
thông minh khi Google cung cấp cho cuộc họp. Dùng `--no-transcript-entries` để bỏ
qua tra cứu mục cho các cuộc họp lớn. `attendance` mở rộng người tham gia thành
các hàng phiên người tham gia với thời điểm nhìn thấy lần đầu/cuối, tổng thời
lượng phiên, cờ đến muộn/rời sớm, và các tài nguyên người tham gia trùng lặp được
hợp nhất theo người dùng đã đăng nhập hoặc tên hiển thị. Truyền
`--no-merge-duplicates` để giữ riêng các tài nguyên người tham gia thô,
`--late-after-minutes` để tinh chỉnh phát hiện đến muộn, và
`--early-before-minutes` để tinh chỉnh phát hiện rời sớm.

`export` ghi một thư mục chứa `summary.md`, `attendance.csv`, `transcript.md`,
`artifacts.json`, `attendance.json`, và `manifest.json`. `manifest.json` ghi lại
đầu vào đã chọn, tùy chọn xuất, bản ghi hội nghị, tệp đầu ra, số lượng, nguồn
token, sự kiện Calendar khi có dùng, và mọi cảnh báo truy xuất một phần. Truyền
`--zip` để cũng ghi một kho lưu trữ di động bên cạnh thư mục. Truyền
`--include-doc-bodies` để xuất văn bản Google Docs của bản chép lời và ghi chú
thông minh được liên kết thông qua Google Drive `files.export`; thao tác này yêu
cầu đăng nhập OAuth mới có bao gồm phạm vi chỉ đọc Drive Meet. Nếu không có
`--include-doc-bodies`, các bản xuất chỉ bao gồm siêu dữ liệu Meet và các mục bản
chép lời có cấu trúc. Nếu Google trả về lỗi hiện vật một phần, chẳng hạn lỗi liệt
kê ghi chú thông minh, mục bản chép lời, hoặc nội dung tài liệu Drive, phần tóm
tắt và manifest giữ lại cảnh báo thay vì làm hỏng toàn bộ bản xuất.
Dùng `--dry-run` để lấy cùng dữ liệu hiện vật/điểm danh và in JSON manifest mà
không tạo thư mục hoặc ZIP. Điều đó hữu ích trước khi ghi một bản xuất lớn hoặc
khi một tác nhân chỉ cần số lượng, bản ghi đã chọn, và cảnh báo.

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

Đặt `"dryRun": true` để chỉ trả về manifest xuất và bỏ qua việc ghi tệp.

Tác nhân cũng có thể tạo một phòng được API hỗ trợ với chính sách truy cập rõ ràng:

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

Để xác thực nghe trước, tác nhân nên dùng `test_listen` trước khi khẳng định cuộc
họp là hữu ích:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Chạy kiểm tra live smoke được bảo vệ với một cuộc họp thật còn được giữ lại:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Chạy phép thăm dò trình duyệt live nghe trước với một cuộc họp nơi có người sẽ
nói và phụ đề Meet khả dụng:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Môi trường live smoke:

- `OPENCLAW_LIVE_TEST=1` bật các kiểm thử live được bảo vệ.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` trỏ tới một URL Meet, mã, hoặc
  `spaces/{id}` còn được giữ lại.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` hoặc `GOOGLE_MEET_CLIENT_ID` cung cấp id máy
  khách OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` hoặc `GOOGLE_MEET_REFRESH_TOKEN` cung cấp
  token làm mới.
- Tùy chọn: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, và
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` dùng cùng các tên dự phòng
  không có tiền tố `OPENCLAW_`.

Live smoke hiện vật/điểm danh cơ sở cần
`https://www.googleapis.com/auth/meetings.space.readonly` và
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Tra cứu
Calendar cần `https://www.googleapis.com/auth/calendar.events.readonly`. Xuất nội
dung tài liệu Drive cần
`https://www.googleapis.com/auth/drive.meet.readonly`.

Tạo một không gian Meet mới:

```bash
openclaw googlemeet create
```

Lệnh in `meeting uri`, nguồn, và phiên tham gia mới. Với thông tin xác thực OAuth,
lệnh dùng Google Meet API chính thức. Khi không có thông tin xác thực OAuth, lệnh
dùng hồ sơ trình duyệt đã đăng nhập của Node Chrome được ghim làm phương án dự
phòng. Tác nhân có thể dùng công cụ `google_meet` với `action: "create"` để tạo
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
trước khi có thể tạo URL, phương thức Gateway trả về phản hồi thất bại và công cụ
`google_meet` trả về chi tiết có cấu trúc thay vì chuỗi thuần:

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
`manualActionMessage` cùng ngữ cảnh Node/tab trình duyệt và ngừng mở tab Meet mới
cho đến khi người vận hành hoàn tất bước trình duyệt.

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

Việc tạo một Meet sẽ tham gia theo mặc định. Transport Chrome hoặc Chrome-node vẫn
cần một hồ sơ Google Chrome đã đăng nhập để tham gia qua trình duyệt. Nếu hồ sơ
đã đăng xuất, OpenClaw báo cáo `manualActionRequired: true` hoặc lỗi dự phòng
trình duyệt và yêu cầu người vận hành hoàn tất đăng nhập Google trước khi
thử lại.

Chỉ đặt `preview.enrollmentAcknowledged: true` sau khi xác nhận dự án Cloud,
OAuth principal và người tham gia cuộc họp của bạn đã được ghi danh vào Google
Workspace Developer Preview Program dành cho Meet media APIs.

## Cấu hình

Đường dẫn tác nhân Chrome chung chỉ cần bật plugin, BlackHole, SoX, khóa nhà
cung cấp phiên âm realtime và một nhà cung cấp TTS OpenClaw đã được cấu hình.
OpenAI là nhà cung cấp phiên âm mặc định; đặt `realtime.voiceProvider` thành
`"google"` và `realtime.model` để dùng Google Gemini Live cho chế độ `bidi`
mà không thay đổi nhà cung cấp phiên âm mặc định của chế độ tác nhân:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Đặt cấu hình plugin dưới `plugins.entries.google-meet.config`:

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
- `defaultMode: "agent"` (`"realtime"` chỉ được chấp nhận như bí danh tương thích
  cũ cho `"agent"`; các lệnh gọi công cụ mới nên dùng `"agent"`)
- `chromeNode.node`: id/tên/IP node tùy chọn cho `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: tên dùng trên màn hình khách Meet khi
  chưa đăng nhập
- `chrome.autoJoin: true`: điền tên khách và bấm Join Now theo kiểu cố gắng tối
  đa thông qua tự động hóa trình duyệt OpenClaw trên `chrome-node`
- `chrome.reuseExistingTab: true`: kích hoạt thẻ Meet hiện có thay vì mở trùng lặp
- `chrome.waitForInCallMs: 20000`: chờ thẻ Meet báo đang trong cuộc gọi trước
  khi kích hoạt lời giới thiệu phản hồi thoại
- `chrome.audioFormat: "pcm16-24khz"`: định dạng âm thanh cặp lệnh. Chỉ dùng
  `"g711-ulaw-8khz"` cho các cặp lệnh cũ/tùy chỉnh vẫn phát âm thanh điện thoại.
- `chrome.audioBufferBytes: 4096`: bộ đệm xử lý SoX cho các lệnh âm thanh cặp
  lệnh Chrome đã tạo. Giá trị này bằng một nửa bộ đệm mặc định 8192 byte của SoX,
  giảm độ trễ pipe mặc định trong khi vẫn còn khoảng trống để tăng lên trên các
  máy chủ bận. Các giá trị dưới mức tối thiểu của SoX được kẹp ở 17 byte.
- `chrome.audioInputCommand`: lệnh SoX đọc từ CoreAudio `BlackHole 2ch` và ghi
  âm thanh ở `chrome.audioFormat`
- `chrome.audioOutputCommand`: lệnh SoX đọc âm thanh ở `chrome.audioFormat` và
  ghi vào CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: lệnh micro cục bộ tùy chọn ghi PCM mono
  little-endian 16 bit có dấu để phát hiện người nói chen vào khi phát lại của
  trợ lý đang hoạt động. Hiện tại mục này áp dụng cho cầu cặp lệnh `chrome` do
  Gateway lưu trữ.
- `chrome.bargeInRmsThreshold: 650`: mức RMS được tính là một lần người chen
  vào trên `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: mức đỉnh được tính là một lần người chen
  vào trên `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: độ trễ tối thiểu giữa các lần xóa ngắt lời
  người lặp lại
- `mode: "agent"`: chế độ phản hồi thoại mặc định. Lời nói của người tham gia
  được phiên âm bởi nhà cung cấp phiên âm realtime đã cấu hình, gửi đến tác nhân
  OpenClaw đã cấu hình trong một phiên tác nhân con theo từng cuộc họp, rồi được
  đọc lại qua runtime TTS OpenClaw thông thường.
- `mode: "bidi"`: chế độ dự phòng mô hình realtime hai chiều trực tiếp. Nhà
  cung cấp giọng nói realtime trả lời lời nói của người tham gia trực tiếp và có
  thể gọi `openclaw_agent_consult` để có câu trả lời sâu hơn/dựa trên công cụ.
- `mode: "transcribe"`: chế độ chỉ quan sát, không có cầu phản hồi thoại.
- `realtime.provider: "openai"`: dự phòng tương thích được dùng khi các trường
  nhà cung cấp có phạm vi bên dưới chưa được đặt.
- `realtime.transcriptionProvider: "openai"`: id nhà cung cấp được chế độ
  `agent` dùng cho phiên âm realtime.
- `realtime.voiceProvider`: id nhà cung cấp được chế độ `bidi` dùng cho giọng
  nói realtime trực tiếp. Đặt thành `"google"` để dùng Gemini Live trong khi vẫn
  giữ phiên âm chế độ tác nhân trên OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: câu trả lời nói ngắn gọn, với
  `openclaw_agent_consult` cho các câu trả lời sâu hơn
- `realtime.introMessage`: lời kiểm tra sẵn sàng ngắn được nói khi cầu realtime
  kết nối; đặt thành `""` để tham gia im lặng
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
        voice: "Kore",
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
          voiceId: "pMsXgVXv3BLzUgSXRplE",
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
`messages.tts.providers.elevenlabs.voiceId`. Các câu trả lời của tác nhân cũng
có thể dùng chỉ thị `[[tts:voiceId=... model=eleven_v3]]` theo từng câu trả lời
khi bật ghi đè mô hình TTS, nhưng cấu hình là mặc định xác định cho các cuộc họp.
Khi tham gia, nhật ký nên hiển thị `transcriptionProvider=elevenlabs` và mỗi câu
trả lời được nói nên ghi `provider=elevenlabs model=eleven_v3 voice=<voiceId>`.

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
gọi PSTN thực tế, DTMF và lời chào giới thiệu cho plugin Voice Call. Voice Call
phát chuỗi DTMF trước khi mở luồng media realtime, sau đó dùng văn bản giới
thiệu đã lưu làm lời chào realtime ban đầu. Nếu `voice-call` không được bật,
Google Meet vẫn có thể xác thực và ghi lại kế hoạch quay số, nhưng không thể
thực hiện cuộc gọi Twilio.

## Công cụ

Các tác nhân có thể dùng công cụ `google_meet`:

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
VM Parallels. Trong cả hai trường hợp, các nhà cung cấp mô hình và
`openclaw_agent_consult` chạy trên máy chủ Gateway, nên thông tin xác thực mô
hình vẫn ở đó. Với `mode: "agent"` mặc định, nhà cung cấp phiên âm realtime xử
lý việc nghe, tác nhân OpenClaw đã cấu hình tạo câu trả lời và TTS OpenClaw
thông thường đọc câu trả lời vào Meet. Dùng `mode: "bidi"` khi bạn muốn mô hình
giọng nói realtime trả lời trực tiếp.
`mode: "realtime"` thô vẫn được chấp nhận như bí danh tương thích cũ cho
`mode: "agent"`, nhưng không còn được quảng bá trong schema công cụ tác nhân.
Nhật ký chế độ tác nhân bao gồm nhà cung cấp/mô hình phiên âm đã phân giải khi
khởi động cầu và nhà cung cấp TTS, mô hình, giọng nói, định dạng đầu ra và tốc
độ mẫu sau mỗi câu trả lời đã tổng hợp.

Dùng `action: "status"` để liệt kê các phiên đang hoạt động hoặc kiểm tra một
ID phiên. Dùng `action: "speak"` với `sessionId` và `message` để khiến tác nhân
realtime nói ngay. Dùng `action: "test_speech"` để tạo hoặc dùng lại phiên, kích
hoạt một cụm từ đã biết và trả về tình trạng `inCall` khi máy chủ Chrome có thể
báo cáo. `test_speech` luôn ép `mode: "agent"` và thất bại nếu được yêu cầu chạy
trong `mode: "transcribe"` vì các phiên chỉ quan sát cố ý không thể phát lời nói.
Kết quả `speechOutputVerified` của nó dựa trên số byte đầu ra âm thanh realtime
tăng trong lần gọi kiểm thử này, nên một phiên được dùng lại có âm thanh cũ hơn
không được tính là kiểm tra lời nói mới thành công. Dùng `action: "leave"` để
đánh dấu một phiên đã kết thúc.

`status` bao gồm tình trạng Chrome khi có sẵn:

- `inCall`: Chrome có vẻ đang ở trong cuộc gọi Meet
- `micMuted`: trạng thái micro Meet theo kiểu cố gắng tối đa
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: hồ sơ
  trình duyệt cần đăng nhập thủ công, được máy chủ Meet cho phép vào, cấp quyền
  hoặc sửa điều khiển trình duyệt trước khi lời nói có thể hoạt động
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: lời nói Chrome
  được quản lý hiện có được phép hay không. `speechReady: false` nghĩa là
  OpenClaw không gửi cụm từ giới thiệu/kiểm thử vào cầu âm thanh.
- `providerConnected` / `realtimeReady`: trạng thái cầu giọng nói realtime
- `lastInputAt` / `lastOutputAt`: âm thanh cuối cùng được thấy từ hoặc gửi đến cầu
- `audioOutputRouted` / `audioOutputDeviceLabel`: liệu đầu ra media của thẻ Meet
  có được định tuyến chủ động đến thiết bị BlackHole mà cầu dùng hay không
- `lastSuppressedInputAt` / `suppressedInputBytes`: đầu vào loopback bị bỏ qua
  khi phát lại của trợ lý đang hoạt động

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Các chế độ Agent và Bidi

Chế độ `agent` của Chrome được tối ưu cho hành vi "tác nhân của tôi đang ở trong
cuộc họp". Nhà cung cấp phiên âm realtime nghe âm thanh cuộc họp, bản ghi cuối
cùng của người tham gia được định tuyến qua tác nhân OpenClaw đã cấu hình, và
câu trả lời được nói qua runtime TTS OpenClaw thông thường. Đặt `mode: "bidi"`
khi bạn muốn mô hình giọng nói realtime trả lời trực tiếp.
Các đoạn bản ghi cuối gần nhau được hợp nhất trước khi tham vấn để một lượt nói
không tạo ra nhiều câu trả lời từng phần đã cũ. Đầu vào realtime cũng bị chặn
khi âm thanh trợ lý đã xếp hàng vẫn đang phát,
và các tiếng vọng bản ghi gần đây giống trợ lý bị bỏ qua trước khi tham vấn tác
nhân để loopback BlackHole không khiến tác nhân trả lời chính lời nói của nó.

| Chế độ  | Ai quyết định câu trả lời     | Đường dẫn đầu ra lời nói               | Dùng khi                                               |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Tác nhân OpenClaw đã cấu hình | Runtime TTS OpenClaw thông thường      | Bạn muốn hành vi "tác nhân của tôi đang ở trong cuộc họp" |
| `bidi`  | Mô hình giọng nói realtime    | Phản hồi âm thanh của nhà cung cấp giọng nói realtime | Bạn muốn vòng lặp giọng nói hội thoại có độ trễ thấp nhất |

Trong chế độ `bidi`, khi mô hình realtime cần suy luận sâu hơn, thông tin hiện
tại hoặc các công cụ OpenClaw thông thường, nó có thể gọi
`openclaw_agent_consult`.

Công cụ consult chạy tác nhân OpenClaw thông thường ở hậu trường với ngữ cảnh bản ghi cuộc họp gần đây và trả về một câu trả lời nói ngắn gọn. Ở chế độ `agent`, OpenClaw gửi câu trả lời đó trực tiếp đến môi trường chạy TTS; ở chế độ `bidi`, mô hình giọng nói thời gian thực có thể nói kết quả consult trở lại cuộc họp. Công cụ này dùng cùng cơ chế consult dùng chung như Voice Call.

Theo mặc định, các lượt consult chạy với tác nhân `main`. Đặt `realtime.agentId` khi một làn Meet cần consult một không gian làm việc tác nhân OpenClaw chuyên dụng, các mặc định mô hình, chính sách công cụ, bộ nhớ và lịch sử phiên.

Các lượt consult ở chế độ tác nhân dùng khóa phiên theo từng cuộc họp `agent:<id>:subagent:google-meet:<session>` để các câu hỏi tiếp theo giữ ngữ cảnh cuộc họp trong khi kế thừa chính sách tác nhân bình thường từ tác nhân đã cấu hình.

`realtime.toolPolicy` kiểm soát lượt chạy consult:

- `safe-read-only`: hiển thị công cụ consult và giới hạn tác nhân thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` và `memory_get`.
- `owner`: hiển thị công cụ consult và cho phép tác nhân thông thường dùng chính sách công cụ tác nhân bình thường.
- `none`: không hiển thị công cụ consult cho mô hình giọng nói thời gian thực.

Khóa phiên consult được giới hạn theo từng phiên Meet, nên các lời gọi consult tiếp theo có thể dùng lại ngữ cảnh consult trước đó trong cùng cuộc họp.

Để buộc kiểm tra trạng thái sẵn sàng bằng giọng nói sau khi Chrome đã tham gia đầy đủ cuộc gọi:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Đối với bài kiểm tra khói tham gia và nói đầy đủ:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Danh sách kiểm tra kiểm thử trực tiếp

Dùng trình tự này trước khi bàn giao cuộc họp cho một tác nhân không có người giám sát:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Trạng thái Chrome-node mong đợi:

- `googlemeet setup` đều xanh.
- `googlemeet setup` bao gồm `chrome-node-connected` khi Chrome-node là phương thức vận chuyển mặc định hoặc một node được ghim.
- `nodes status` hiển thị node đã chọn đang kết nối.
- Node đã chọn quảng bá cả `googlemeet.chrome` và `browser.proxy`.
- Thẻ Meet tham gia cuộc gọi và `test-speech` trả về tình trạng Chrome với `inCall: true`.

Đối với một máy chủ Chrome từ xa như máy ảo macOS Parallels, đây là kiểm tra an toàn ngắn nhất sau khi cập nhật Gateway hoặc máy ảo:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Điều đó chứng minh Plugin Gateway đã được tải, node máy ảo được kết nối bằng mã thông báo hiện tại, và cầu nối âm thanh Meet khả dụng trước khi một tác nhân mở thẻ cuộc họp thật.

Đối với một bài kiểm tra khói Twilio, hãy dùng một cuộc họp có hiển thị chi tiết quay số điện thoại:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Trạng thái Twilio mong đợi:

- `googlemeet setup` bao gồm các kiểm tra xanh `twilio-voice-call-plugin`, `twilio-voice-call-credentials` và `twilio-voice-call-webhook`.
- `voicecall` khả dụng trong CLI sau khi Gateway tải lại.
- Phiên trả về có `transport: "twilio"` và một `twilio.voiceCallId`.
- `openclaw logs --follow` hiển thị DTMF TwiML được phục vụ trước TwiML thời gian thực, sau đó là một cầu nối thời gian thực với lời chào ban đầu được xếp hàng.
- `googlemeet leave <sessionId>` ngắt cuộc gọi thoại được ủy nhiệm.

## Khắc phục sự cố

### Tác nhân không thấy công cụ Google Meet

Xác nhận Plugin được bật trong cấu hình Gateway và tải lại Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Nếu bạn vừa chỉnh sửa `plugins.entries.google-meet`, hãy khởi động lại hoặc tải lại Gateway. Tác nhân đang chạy chỉ thấy các công cụ Plugin do tiến trình Gateway hiện tại đăng ký.

Trên các máy chủ Gateway không phải macOS, công cụ hướng tới tác nhân `google_meet` vẫn hiển thị, nhưng các hành động phản hồi bằng Chrome cục bộ bị chặn trước khi chạm đến cầu nối âm thanh. Âm thanh phản hồi bằng Chrome cục bộ hiện phụ thuộc vào `BlackHole 2ch` trên macOS, nên tác nhân Linux nên dùng `mode: "transcribe"`, quay số vào bằng Twilio, hoặc một máy chủ `chrome-node` macOS thay vì đường dẫn tác nhân Chrome cục bộ mặc định.

### Không có node nào có khả năng Google Meet đang kết nối

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

Node phải đang kết nối và liệt kê `googlemeet.chrome` cộng với `browser.proxy`. Cấu hình Gateway phải cho phép các lệnh node đó:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Nếu `googlemeet setup` thất bại ở `chrome-node-connected` hoặc nhật ký Gateway báo `gateway token mismatch`, hãy cài đặt lại hoặc khởi động lại node bằng mã thông báo Gateway hiện tại. Đối với Gateway LAN, điều này thường có nghĩa là:

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

Chạy `googlemeet test-listen` cho các lượt tham gia chỉ quan sát hoặc `googlemeet test-speech` cho các lượt tham gia thời gian thực, rồi kiểm tra tình trạng Chrome được trả về. Nếu một trong hai phép thăm dò báo `manualActionRequired: true`, hãy hiển thị `manualActionMessage` cho người vận hành và dừng thử lại cho đến khi hành động trên trình duyệt hoàn tất.

Các hành động thủ công thường gặp:

- Đăng nhập vào hồ sơ Chrome.
- Chấp nhận khách từ tài khoản chủ Meet.
- Cấp quyền micrô/máy ảnh cho Chrome khi lời nhắc quyền gốc của Chrome xuất hiện.
- Đóng hoặc sửa một hộp thoại quyền Meet bị kẹt.

Đừng báo "chưa đăng nhập" chỉ vì Meet hiển thị "Do you want people to hear you in the meeting?" Đó là màn xen kẽ lựa chọn âm thanh của Meet; OpenClaw nhấp **Use microphone** thông qua tự động hóa trình duyệt khi khả dụng và tiếp tục chờ trạng thái cuộc họp thực. Đối với dự phòng trình duyệt chỉ tạo, OpenClaw có thể nhấp **Continue without microphone** vì việc tạo URL không cần đường dẫn âm thanh thời gian thực.

### Tạo cuộc họp thất bại

`googlemeet create` trước tiên dùng điểm cuối Google Meet API `spaces.create` khi thông tin xác thực OAuth được cấu hình. Không có thông tin xác thực OAuth thì nó chuyển sang dự phòng trình duyệt node Chrome đã ghim. Xác nhận:

- Đối với tạo bằng API: `oauth.clientId` và `oauth.refreshToken` được cấu hình, hoặc có các biến môi trường `OPENCLAW_GOOGLE_MEET_*` tương ứng.
- Đối với tạo bằng API: mã làm mới được cấp sau khi hỗ trợ tạo được thêm vào. Các mã cũ hơn có thể thiếu phạm vi `meetings.space.created`; chạy lại `openclaw googlemeet auth login --json` và cập nhật cấu hình Plugin.
- Đối với dự phòng trình duyệt: `defaultTransport: "chrome-node"` và `chromeNode.node` trỏ tới một node đang kết nối có `browser.proxy` và `googlemeet.chrome`.
- Đối với dự phòng trình duyệt: hồ sơ Chrome của OpenClaw trên node đó đã đăng nhập Google và có thể mở `https://meet.google.com/new`.
- Đối với dự phòng trình duyệt: các lần thử lại dùng lại một thẻ `https://meet.google.com/new` hoặc thẻ lời nhắc tài khoản Google hiện có trước khi mở thẻ mới. Nếu một tác nhân hết thời gian chờ, hãy thử lại lời gọi công cụ thay vì tự mở một thẻ Meet khác.
- Đối với dự phòng trình duyệt: nếu công cụ trả về `manualActionRequired: true`, hãy dùng `browser.nodeId`, `browser.targetId`, `browserUrl` và `manualActionMessage` được trả về để hướng dẫn người vận hành. Đừng thử lại trong vòng lặp cho đến khi hành động đó hoàn tất.
- Đối với dự phòng trình duyệt: nếu Meet hiển thị "Do you want people to hear you in the meeting?", hãy để thẻ mở. OpenClaw nên nhấp **Use microphone** hoặc, với dự phòng chỉ tạo, **Continue without microphone** thông qua tự động hóa trình duyệt và tiếp tục chờ URL Meet được tạo. Nếu không thể, lỗi nên đề cập `meet-audio-choice-required`, không phải `google-login-required`.

### Tác nhân tham gia nhưng không nói

Kiểm tra đường dẫn thời gian thực:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dùng `mode: "agent"` cho đường dẫn phản hồi bằng giọng nói STT -> tác nhân OpenClaw -> TTS bình thường, hoặc `mode: "bidi"` cho dự phòng giọng nói thời gian thực trực tiếp. `mode: "transcribe"` cố ý không khởi động cầu nối phản hồi bằng giọng nói. Để gỡ lỗi chỉ quan sát, chạy `openclaw googlemeet status --json <session-id>` sau khi người tham gia nói và kiểm tra `captioning`, `transcriptLines` và `lastCaptionText`. Nếu `inCall` là true nhưng `transcriptLines` vẫn ở `0`, phụ đề Meet có thể bị tắt, chưa có ai nói kể từ khi trình quan sát được cài đặt, giao diện Meet đã thay đổi, hoặc phụ đề trực tiếp không khả dụng cho ngôn ngữ/tài khoản cuộc họp.

`googlemeet test-speech` luôn kiểm tra đường dẫn thời gian thực và báo cáo liệu có quan sát thấy byte đầu ra cầu nối cho lượt gọi đó hay không. Nếu `speechOutputVerified` là false và `speechOutputTimedOut` là true, nhà cung cấp thời gian thực có thể đã chấp nhận câu nói nhưng OpenClaw không thấy byte đầu ra mới đến cầu nối âm thanh Chrome.

Cũng xác minh:

- Một khóa nhà cung cấp thời gian thực khả dụng trên máy chủ Gateway, chẳng hạn như `OPENAI_API_KEY` hoặc `GEMINI_API_KEY`.
- `BlackHole 2ch` hiển thị trên máy chủ Chrome.
- `sox` tồn tại trên máy chủ Chrome.
- Micrô và loa Meet được định tuyến qua đường dẫn âm thanh ảo mà OpenClaw dùng. `doctor` nên hiển thị `meet output routed: yes` cho các lượt tham gia Chrome cục bộ theo thời gian thực.

`googlemeet doctor [session-id]` in phiên, node, trạng thái trong cuộc gọi, lý do hành động thủ công, kết nối nhà cung cấp thời gian thực, `realtimeReady`, hoạt động đầu vào/đầu ra âm thanh, dấu thời gian âm thanh gần nhất, bộ đếm byte và URL trình duyệt. Dùng `googlemeet status [session-id] --json` khi bạn cần JSON thô. Dùng `googlemeet doctor --oauth` khi bạn cần xác minh làm mới OAuth Google Meet mà không lộ mã thông báo; thêm `--meeting` hoặc `--create-space` khi bạn cũng cần bằng chứng Google Meet API.

Nếu một tác nhân hết thời gian chờ và bạn thấy một thẻ Meet đã mở, hãy kiểm tra thẻ đó mà không mở thẻ khác:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Hành động công cụ tương đương là `recover_current_tab`. Nó tập trung và kiểm tra một thẻ Meet hiện có cho phương thức vận chuyển đã chọn. Với `chrome`, nó dùng điều khiển trình duyệt cục bộ thông qua Gateway; với `chrome-node`, nó dùng node Chrome đã cấu hình. Nó không mở thẻ mới hoặc tạo phiên mới; nó báo cáo điểm chặn hiện tại, chẳng hạn như đăng nhập, chấp nhận tham gia, quyền hoặc trạng thái lựa chọn âm thanh. Lệnh CLI giao tiếp với Gateway đã cấu hình, nên Gateway phải đang chạy; `chrome-node` cũng yêu cầu node Chrome đang kết nối.

### Kiểm tra thiết lập Twilio thất bại

`twilio-voice-call-plugin` thất bại khi `voice-call` không được phép hoặc chưa được bật. Thêm nó vào `plugins.allow`, bật `plugins.entries.voice-call` và tải lại Gateway.

`twilio-voice-call-credentials` thất bại khi backend Twilio thiếu SID tài khoản, mã thông báo xác thực hoặc số gọi đi. Đặt các biến này trên máy chủ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` thất bại khi `voice-call` không có khả năng hiển thị Webhook công khai, hoặc khi `publicUrl` trỏ tới local loopback hoặc không gian mạng riêng. Đặt `plugins.entries.voice-call.config.publicUrl` thành URL nhà cung cấp công khai hoặc cấu hình một đường hầm/khả năng hiển thị Tailscale cho `voice-call`.

URL loopback và URL riêng không hợp lệ cho callback của nhà mạng. Không dùng `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` hoặc `fd00::/8` làm `publicUrl`.

Đối với một URL công khai ổn định:

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

Để phát triển cục bộ, hãy dùng đường hầm hoặc phơi bày qua Tailscale thay vì URL
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

Theo mặc định, `voicecall smoke` chỉ kiểm tra mức độ sẵn sàng. Để chạy thử với một số cụ thể:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Chỉ thêm `--yes` khi bạn cố ý muốn thực hiện một cuộc gọi thông báo đi trực tiếp:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Cuộc gọi Twilio bắt đầu nhưng không bao giờ vào cuộc họp

Xác nhận sự kiện Meet có cung cấp thông tin quay số điện thoại vào. Truyền chính xác
số quay vào và PIN hoặc một chuỗi DTMF tùy chỉnh:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Dùng `w` ở đầu hoặc dấu phẩy trong `--dtmf-sequence` nếu nhà cung cấp cần tạm dừng
trước khi nhập PIN.

Nếu cuộc gọi điện thoại được tạo nhưng danh sách người tham gia Meet không bao giờ hiển thị
người tham gia quay số vào:

- Chạy `openclaw googlemeet doctor <session-id>` để xác nhận ID cuộc gọi Twilio
  được ủy quyền, DTMF đã được đưa vào hàng đợi hay chưa, và lời chào mở đầu có được yêu cầu hay không.
- Chạy `openclaw voicecall status --call-id <id>` và xác nhận cuộc gọi vẫn đang
  hoạt động.
- Chạy `openclaw voicecall tail` và kiểm tra rằng các Webhook Twilio đang đến
  Gateway.
- Chạy `openclaw logs --follow` và tìm chuỗi Twilio Meet: Google
  Meet ủy quyền thao tác tham gia, Voice Call bắt đầu nhánh điện thoại, Google Meet chờ
  `voiceCall.dtmfDelayMs`, gửi DTMF bằng `voicecall.dtmf`, chờ
  `voiceCall.postDtmfSpeechDelayMs`, rồi yêu cầu lời nói mở đầu bằng
  `voicecall.speak`.
- Chạy lại `openclaw googlemeet setup --transport twilio`; kiểm tra thiết lập màu xanh là
  bắt buộc nhưng không chứng minh chuỗi PIN cuộc họp là chính xác.
- Xác nhận số quay vào thuộc cùng lời mời Meet và cùng khu vực với
  PIN.
- Tăng `voiceCall.dtmfDelayMs` nếu Meet trả lời chậm hoặc bản chép lời cuộc gọi
  vẫn hiển thị lời nhắc yêu cầu PIN sau khi DTMF đã được gửi.
- Nếu người tham gia đã vào nhưng bạn không nghe thấy lời chào, hãy kiểm tra
  `openclaw logs --follow` để tìm yêu cầu `voicecall.speak` sau DTMF và
  phát lại TTS qua luồng phương tiện hoặc phương án dự phòng `<Say>` của Twilio. Nếu bản chép lời cuộc gọi
  vẫn chứa "enter the meeting PIN", nhánh điện thoại chưa tham gia
  phòng Meet, nên người tham gia cuộc họp sẽ không nghe thấy lời nói.

Nếu Webhook không đến, hãy gỡ lỗi Plugin Voice Call trước: nhà cung cấp phải
truy cập được `plugins.entries.voice-call.config.publicUrl` hoặc đường hầm đã cấu hình.
Xem [Khắc phục sự cố cuộc gọi thoại](/vi/plugins/voice-call#troubleshooting).

## Ghi chú

API phương tiện chính thức của Google Meet thiên về nhận, nên việc nói vào một cuộc gọi Meet
vẫn cần một đường tham gia. Plugin này giữ ranh giới đó rõ ràng:
Chrome xử lý tham gia bằng trình duyệt và định tuyến âm thanh cục bộ; Twilio xử lý
tham gia bằng quay số điện thoại vào.

Các chế độ nói phản hồi của Chrome cần `BlackHole 2ch` cộng với một trong hai:

- `chrome.audioInputCommand` cộng với `chrome.audioOutputCommand`: OpenClaw sở hữu
  cầu nối và truyền âm thanh theo `chrome.audioFormat` giữa các lệnh đó và
  nhà cung cấp đã chọn. Chế độ tác nhân dùng phiên âm thời gian thực cộng với TTS thông thường;
  chế độ bidi dùng nhà cung cấp giọng nói thời gian thực. Đường Chrome mặc định là PCM16 24 kHz
  với `chrome.audioBufferBytes: 4096`; G.711 mu-law 8 kHz vẫn
  có sẵn cho các cặp lệnh kế thừa.
- `chrome.audioBridgeCommand`: một lệnh cầu nối bên ngoài sở hữu toàn bộ đường
  âm thanh cục bộ và phải thoát sau khi khởi động hoặc xác thực daemon của nó. Điều này chỉ
  hợp lệ cho `bidi` vì chế độ `agent` cần quyền truy cập trực tiếp vào cặp lệnh cho TTS.

Khi một tác nhân gọi công cụ `google_meet` ở chế độ tác nhân, phiên tư vấn cuộc họp
rẽ nhánh bản chép lời hiện tại của bên gọi trước khi trả lời lời nói của người tham gia.
Phiên Meet vẫn tách riêng (`agent:<agentId>:subagent:google-meet:<sessionId>`)
nên các lượt theo dõi cuộc họp không trực tiếp thay đổi bản chép lời của bên gọi.

Để có âm thanh song công sạch, hãy định tuyến đầu ra Meet và micro Meet qua các
thiết bị ảo riêng biệt hoặc một đồ thị thiết bị ảo kiểu Loopback. Một thiết bị
BlackHole dùng chung duy nhất có thể dội âm người tham gia khác trở lại cuộc gọi.

Với cầu nối Chrome dạng cặp lệnh, `chrome.bargeInInputCommand` có thể lắng nghe một
micro cục bộ riêng biệt và xóa phần phát lại của trợ lý khi con người bắt đầu
nói. Điều này giữ lời nói của con người đi trước đầu ra của trợ lý ngay cả khi đầu vào
loopback BlackHole dùng chung tạm thời bị chặn trong lúc phát lại của trợ lý.
Giống như `chrome.audioInputCommand` và `chrome.audioOutputCommand`, đây là một
lệnh cục bộ do người vận hành cấu hình. Hãy dùng đường dẫn lệnh tin cậy rõ ràng hoặc
danh sách đối số, và không trỏ nó đến các script từ vị trí không đáng tin cậy.

`googlemeet speak` kích hoạt cầu nối âm thanh nói phản hồi đang hoạt động cho một phiên
Chrome. `googlemeet leave` dừng cầu nối đó. Đối với các phiên Twilio được ủy quyền
qua Plugin Voice Call, `leave` cũng gác máy cuộc gọi thoại bên dưới.
Dùng `googlemeet end-active-conference` khi bạn cũng muốn đóng hội nghị
Google Meet đang hoạt động cho một không gian do API quản lý.

## Liên quan

- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
- [Chế độ nói](/vi/nodes/talk)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
