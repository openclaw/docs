---
read_when:
    - Bạn muốn một tác nhân OpenClaw tham gia cuộc gọi Google Meet
    - Bạn muốn một tác tử OpenClaw tạo một cuộc gọi Google Meet mới
    - Bạn đang cấu hình Chrome, Chrome node hoặc Twilio làm phương thức truyền tải Google Meet
summary: 'Plugin Google Meet: tham gia các URL Meet được chỉ định rõ qua Chrome hoặc Twilio với mặc định thoại thời gian thực'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-30T09:37:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

Hỗ trợ người tham gia Google Meet cho OpenClaw — Plugin được thiết kế một cách tường minh:

- Chỉ tham gia một URL `https://meet.google.com/...` tường minh.
- Có thể tạo một không gian Meet mới thông qua Google Meet API, rồi tham gia URL
  được trả về.
- Giọng nói `realtime` là chế độ mặc định.
- Giọng nói realtime có thể gọi ngược vào toàn bộ agent OpenClaw khi cần suy luận
  sâu hơn hoặc cần công cụ.
- Agent chọn hành vi tham gia bằng `mode`: dùng `realtime` để nghe/nói phản hồi
  trực tiếp, hoặc `transcribe` để tham gia/điều khiển trình duyệt mà không có cầu nối
  giọng nói realtime.
- Xác thực bắt đầu dưới dạng Google OAuth cá nhân hoặc một hồ sơ Chrome đã đăng nhập.
- Không có thông báo đồng ý tự động.
- Backend âm thanh Chrome mặc định là `BlackHole 2ch`.
- Chrome có thể chạy cục bộ hoặc trên một node host đã ghép nối.
- Twilio chấp nhận số quay vào cùng PIN hoặc chuỗi DTMF tùy chọn.
- Lệnh CLI là `googlemeet`; `meet` được dành riêng cho các quy trình hội nghị từ xa
  rộng hơn của agent.

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

Đầu ra thiết lập được thiết kế để agent có thể đọc và nhận biết chế độ. Nó báo cáo
hồ sơ Chrome, ghim node, và, đối với các lượt tham gia Chrome realtime, cầu nối âm thanh
BlackHole/SoX cùng các kiểm tra phần giới thiệu realtime bị trì hoãn. Với các lượt tham gia
chỉ quan sát, kiểm tra cùng transport bằng `--mode transcribe`; chế độ đó bỏ qua các điều kiện tiên quyết
về âm thanh realtime vì nó không nghe qua hoặc nói qua cầu nối:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Khi ủy quyền Twilio được cấu hình, thiết lập cũng báo cáo Plugin
`voice-call` và thông tin xác thực Twilio đã sẵn sàng hay chưa. Xem mọi kiểm tra
`ok: false` là điểm chặn đối với transport và chế độ được kiểm tra trước khi yêu cầu agent
tham gia. Dùng `openclaw googlemeet setup --json` cho script hoặc đầu ra máy đọc được.
Dùng `--transport chrome`, `--transport chrome-node`, hoặc `--transport twilio`
để kiểm tra trước một transport cụ thể trước khi agent thử dùng.

Tham gia cuộc họp:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Hoặc để agent tham gia thông qua công cụ `google_meet`:

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

- Tạo qua API: được dùng khi thông tin xác thực Google Meet OAuth được cấu hình. Đây là
  đường dẫn xác định nhất và không phụ thuộc vào trạng thái UI của trình duyệt.
- Dự phòng bằng trình duyệt: được dùng khi không có thông tin xác thực OAuth. OpenClaw dùng
  node Chrome đã ghim, mở `https://meet.google.com/new`, chờ Google
  chuyển hướng đến URL mã cuộc họp thật, rồi trả về URL đó. Đường dẫn này yêu cầu
  hồ sơ Chrome OpenClaw trên node đã đăng nhập vào Google.
  Tự động hóa trình duyệt xử lý lời nhắc micrô lần chạy đầu của Meet; lời nhắc đó
  không được xem là lỗi đăng nhập Google.
  Các luồng tham gia và tạo cũng cố gắng tái sử dụng một thẻ Meet hiện có trước khi mở
  thẻ mới. Việc khớp bỏ qua các chuỗi truy vấn URL vô hại như `authuser`, nên một
  lần thử lại của agent sẽ tập trung vào cuộc họp đã mở thay vì tạo một thẻ
  Chrome thứ hai.

Đầu ra lệnh/công cụ bao gồm trường `source` (`api` hoặc `browser`) để agent
có thể giải thích đường dẫn nào đã được dùng. Theo mặc định, `create` tham gia cuộc họp mới và
trả về `joined: true` cùng phiên tham gia. Để chỉ tạo URL, dùng
`create --no-join` trên CLI hoặc truyền `"join": false` vào công cụ.

Hoặc nói với agent: "Tạo một Google Meet, tham gia bằng giọng nói realtime, và gửi
cho tôi liên kết." Agent nên gọi `google_meet` với `action: "create"` và
sau đó chia sẻ `meetingUri` được trả về.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Để tham gia chỉ quan sát/điều khiển trình duyệt, đặt `"mode": "transcribe"`. Chế độ đó
không khởi động cầu nối mô hình realtime hai chiều, không yêu cầu BlackHole hoặc SoX,
và sẽ không nói phản hồi vào cuộc họp. Các lượt tham gia Chrome ở chế độ này cũng tránh
cấp quyền micrô/máy ảnh của OpenClaw và tránh đường dẫn **Dùng
micrô** của Meet. Nếu Meet hiển thị màn hình trung gian chọn âm thanh, tự động hóa sẽ thử
đường dẫn không dùng micrô và nếu không được thì báo cáo một hành động thủ công thay vì mở
micrô cục bộ.

Trong các phiên realtime, trạng thái `google_meet` bao gồm tình trạng trình duyệt và cầu nối âm thanh
như `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, dấu thời gian đầu vào/đầu ra
gần nhất, bộ đếm byte, và trạng thái cầu nối đã đóng. Nếu một lời nhắc an toàn trên trang Meet
xuất hiện, tự động hóa trình duyệt sẽ xử lý khi có thể. Đăng nhập, chấp nhận của host, và
lời nhắc quyền trình duyệt/OS được báo cáo là hành động thủ công kèm lý do và
thông báo để agent chuyển tiếp. Các phiên Chrome được quản lý chỉ phát phần giới thiệu hoặc
cụm từ kiểm thử sau khi tình trạng trình duyệt báo cáo `inCall: true`; nếu không, trạng thái báo cáo
`speechReady: false` và lần thử nói bị chặn thay vì giả vờ rằng
agent đã nói vào cuộc họp.

Các lượt tham gia Chrome cục bộ dùng hồ sơ trình duyệt OpenClaw đã đăng nhập. Chế độ realtime
yêu cầu `BlackHole 2ch` cho đường dẫn micrô/loa mà OpenClaw dùng. Để có
âm thanh hai chiều sạch, hãy dùng các thiết bị ảo riêng biệt hoặc biểu đồ kiểu Loopback; một
thiết bị BlackHole duy nhất là đủ cho lần kiểm thử smoke đầu tiên nhưng có thể tạo tiếng vọng.

### Gateway cục bộ + Chrome Parallels

Bạn **không** cần một OpenClaw Gateway đầy đủ hoặc khóa API mô hình bên trong VM macOS
chỉ để VM sở hữu Chrome. Chạy Gateway và agent cục bộ, rồi chạy một
node host trong VM. Bật Plugin đi kèm trên VM một lần để node
quảng bá lệnh Chrome:

Nơi chạy từng thành phần:

- Gateway host: OpenClaw Gateway, workspace của agent, khóa mô hình/API, nhà cung cấp realtime,
  và cấu hình Plugin Google Meet.
- VM macOS Parallels: CLI/node host OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  và hồ sơ Chrome đã đăng nhập vào Google.
- Không cần trong VM: dịch vụ Gateway, cấu hình agent, khóa OpenAI/GPT, hoặc thiết lập
  nhà cung cấp mô hình.

Cài đặt các phụ thuộc của VM:

```bash
brew install blackhole-2ch sox
```

Khởi động lại VM sau khi cài đặt BlackHole để macOS hiển thị `BlackHole 2ch`:

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

Nếu `<gateway-host>` là IP LAN và bạn không dùng TLS, node sẽ từ chối
WebSocket plaintext trừ khi bạn chọn cho phép mạng riêng đáng tin cậy đó:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Dùng cùng biến môi trường khi cài đặt node dưới dạng LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` là môi trường tiến trình, không phải một
thiết lập `openclaw.json`. `openclaw node install` lưu nó trong môi trường
LaunchAgent khi nó có mặt trên lệnh cài đặt.

Phê duyệt node từ Gateway host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Xác nhận Gateway thấy node và node quảng bá cả `googlemeet.chrome`
lẫn capability trình duyệt/`browser.proxy`:

```bash
openclaw nodes status
```

Định tuyến Meet qua node đó trên Gateway host:

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

Bây giờ tham gia bình thường từ Gateway host:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

hoặc yêu cầu agent dùng công cụ `google_meet` với `transport: "chrome-node"`.

Để kiểm thử smoke bằng một lệnh, tạo hoặc tái sử dụng một phiên, nói một
cụm từ đã biết, và in tình trạng phiên:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Trong khi tham gia realtime, tự động hóa trình duyệt OpenClaw điền tên khách, bấm
Tham gia/Yêu cầu tham gia, và chấp nhận lựa chọn "Dùng micrô" lần chạy đầu của Meet khi
lời nhắc đó xuất hiện. Trong khi tham gia chỉ quan sát hoặc tạo cuộc họp chỉ bằng trình duyệt, nó
tiếp tục qua cùng lời nhắc mà không dùng micrô khi lựa chọn đó có sẵn.
Nếu hồ sơ trình duyệt chưa đăng nhập, Meet đang chờ host chấp nhận,
Chrome cần quyền micrô/máy ảnh cho một lượt tham gia realtime, hoặc Meet bị kẹt
ở một lời nhắc mà tự động hóa không thể xử lý, kết quả join/test-speech báo cáo
`manualActionRequired: true` kèm `manualActionReason` và
`manualActionMessage`. Agent nên ngừng thử tham gia lại, báo cáo chính xác
thông báo đó cùng `browserUrl`/`browserTitle` hiện tại, và chỉ thử lại sau khi
hành động trình duyệt thủ công đã hoàn tất.

Nếu bỏ qua `chromeNode.node`, OpenClaw chỉ tự động chọn khi đúng một
node đã kết nối quảng bá cả `googlemeet.chrome` và điều khiển trình duyệt. Nếu
có nhiều node có khả năng được kết nối, đặt `chromeNode.node` thành node id,
tên hiển thị, hoặc IP từ xa.

Các kiểm tra lỗi thường gặp:

- `Configured Google Meet node ... is not usable: offline`: node được ghim
  đã được Gateway biết đến nhưng không khả dụng. Agent nên xem node đó là
  trạng thái chẩn đoán, không phải một máy chủ Chrome có thể dùng, và báo cáo
  chướng ngại thiết lập thay vì quay về một transport khác trừ khi người dùng
  yêu cầu điều đó.
- `No connected Google Meet-capable node`: khởi động `openclaw node run` trong VM,
  phê duyệt ghép nối, và bảo đảm `openclaw plugins enable google-meet` cùng
  `openclaw plugins enable browser` đã được chạy trong VM. Cũng xác nhận máy chủ
  Gateway cho phép cả hai lệnh node bằng
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: cài đặt `blackhole-2ch` trên máy chủ
  đang được kiểm tra và khởi động lại trước khi dùng âm thanh Chrome cục bộ.
- `BlackHole 2ch audio device not found on the node`: cài đặt `blackhole-2ch`
  trong VM và khởi động lại VM.
- Chrome mở nhưng không thể tham gia: đăng nhập vào hồ sơ trình duyệt bên trong VM, hoặc
  giữ `chrome.guestName` được đặt để tham gia với tư cách khách. Tự động tham gia với tư cách khách dùng tự động hóa trình duyệt OpenClaw
  thông qua proxy trình duyệt node; hãy bảo đảm cấu hình trình duyệt node
  trỏ đến hồ sơ bạn muốn, ví dụ
  `browser.defaultProfile: "user"` hoặc một hồ sơ phiên hiện có đã đặt tên.
- Các thẻ Meet trùng lặp: để `chrome.reuseExistingTab: true` được bật. OpenClaw
  kích hoạt một thẻ hiện có cho cùng URL Meet trước khi mở thẻ mới, và
  việc tạo cuộc họp bằng trình duyệt tái sử dụng một thẻ `https://meet.google.com/new`
  đang diễn ra hoặc thẻ lời nhắc tài khoản Google trước khi mở thẻ khác.
- Không có âm thanh: trong Meet, định tuyến microphone/loa qua đường dẫn thiết bị âm thanh ảo
  mà OpenClaw dùng; dùng các thiết bị ảo riêng biệt hoặc định tuyến kiểu Loopback
  để có âm thanh song công sạch.

## Ghi chú cài đặt

Mặc định realtime của Chrome dùng hai công cụ bên ngoài:

- `sox`: tiện ích âm thanh dòng lệnh. Plugin dùng các lệnh thiết bị CoreAudio
  rõ ràng cho cầu nối âm thanh PCM16 24 kHz mặc định.
- `blackhole-2ch`: driver âm thanh ảo macOS. Nó tạo thiết bị âm thanh `BlackHole 2ch`
  mà Chrome/Meet có thể định tuyến qua.

OpenClaw không đóng gói hoặc phân phối lại bất kỳ gói nào trong hai gói này. Tài liệu yêu cầu người dùng
cài đặt chúng làm dependency của máy chủ thông qua Homebrew. SoX được cấp phép theo
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole là GPL-3.0. Nếu bạn xây dựng một
trình cài đặt hoặc thiết bị chuyên dụng đóng gói BlackHole cùng OpenClaw, hãy xem xét các
điều khoản cấp phép upstream của BlackHole hoặc xin giấy phép riêng từ Existential Audio.

## Transport

### Chrome

Transport Chrome mở URL Meet thông qua điều khiển trình duyệt OpenClaw và tham gia
bằng hồ sơ trình duyệt OpenClaw đã đăng nhập. Trên macOS, Plugin kiểm tra
`BlackHole 2ch` trước khi khởi chạy. Nếu được cấu hình, nó cũng chạy một lệnh
sức khỏe cầu nối âm thanh và lệnh khởi động trước khi mở Chrome. Dùng `chrome` khi
Chrome/âm thanh nằm trên máy chủ Gateway; dùng `chrome-node` khi Chrome/âm thanh nằm
trên một node đã ghép nối, chẳng hạn VM macOS Parallels. Với Chrome cục bộ, chọn
hồ sơ bằng `browser.defaultProfile`; `chrome.browserProfile` được truyền đến
máy chủ `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Định tuyến âm thanh microphone và loa Chrome qua cầu nối âm thanh OpenClaw cục bộ.
Nếu `BlackHole 2ch` chưa được cài đặt, thao tác tham gia thất bại với lỗi thiết lập
thay vì âm thầm tham gia mà không có đường dẫn âm thanh.

### Twilio

Transport Twilio là một dial plan nghiêm ngặt được ủy quyền cho Plugin Voice Call. Nó
không phân tích cú pháp các trang Meet để tìm số điện thoại.

Dùng cách này khi không thể tham gia bằng Chrome hoặc bạn muốn một phương án dự phòng
quay số điện thoại. Google Meet phải cung cấp số điện thoại quay vào và PIN cho
cuộc họp; OpenClaw không khám phá các thông tin đó từ trang Meet.

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

Cung cấp thông tin xác thực Twilio qua môi trường hoặc cấu hình. Môi trường giữ
secret khỏi `openclaw.json`:

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

## OAuth và preflight

OAuth là tùy chọn khi tạo liên kết Meet vì `googlemeet create` có thể quay về
tự động hóa trình duyệt. Cấu hình OAuth khi bạn muốn tạo qua API chính thức,
phân giải không gian, hoặc các kiểm tra preflight Meet Media API.

Truy cập Google Meet API dùng OAuth người dùng: tạo một OAuth client Google Cloud,
yêu cầu các scope bắt buộc, ủy quyền một tài khoản Google, rồi lưu
refresh token kết quả trong cấu hình Plugin Google Meet hoặc cung cấp các
biến môi trường `OPENCLAW_GOOGLE_MEET_*`.

OAuth không thay thế đường dẫn tham gia Chrome. Các transport Chrome và Chrome-node
vẫn tham gia qua một hồ sơ Chrome đã đăng nhập, BlackHole/SoX, và một node đã kết nối
khi bạn dùng tham gia bằng trình duyệt. OAuth chỉ dành cho đường dẫn Google
Meet API chính thức: tạo không gian cuộc họp, phân giải không gian, và chạy các kiểm tra preflight
Meet Media API.

### Tạo thông tin xác thực Google

Trong Google Cloud Console:

1. Tạo hoặc chọn một dự án Google Cloud.
2. Bật **Google Meet REST API** cho dự án đó.
3. Cấu hình màn hình đồng ý OAuth.
   - **Internal** là đơn giản nhất cho một tổ chức Google Workspace.
   - **External** hoạt động cho thiết lập cá nhân/thử nghiệm; khi ứng dụng đang trong Testing,
     thêm từng tài khoản Google sẽ ủy quyền ứng dụng làm người dùng thử nghiệm.
4. Thêm các scope OpenClaw yêu cầu:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Tạo một OAuth client ID.
   - Loại ứng dụng: **Web application**.
   - URI chuyển hướng được ủy quyền:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Sao chép client ID và client secret.

`meetings.space.created` được Google Meet `spaces.create` yêu cầu.
`meetings.space.readonly` cho phép OpenClaw phân giải URL/mã Meet thành không gian.
`meetings.conference.media.readonly` dành cho preflight Meet Media API và công việc media;
Google có thể yêu cầu đăng ký Developer Preview để thực sự dùng Media API.
Nếu bạn chỉ cần tham gia Chrome dựa trên trình duyệt, hãy bỏ qua OAuth hoàn toàn.

### Mint refresh token

Cấu hình `oauth.clientId` và tùy chọn `oauth.clientSecret`, hoặc truyền chúng dưới dạng
biến môi trường, rồi chạy:

```bash
openclaw googlemeet auth login --json
```

Lệnh in ra một khối cấu hình `oauth` có refresh token. Nó dùng PKCE,
callback localhost trên `http://localhost:8085/oauth2callback`, và một luồng
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
trước rồi mới fallback sang môi trường.

Sự đồng ý OAuth bao gồm tạo không gian Meet, quyền đọc không gian Meet, và quyền đọc media
hội nghị Meet. Nếu bạn đã xác thực trước khi hỗ trợ tạo cuộc họp
tồn tại, hãy chạy lại `openclaw googlemeet auth login --json` để refresh
token có scope `meetings.space.created`.

### Xác minh OAuth bằng doctor

Chạy doctor OAuth khi bạn muốn kiểm tra sức khỏe nhanh, không tiết lộ secret:

```bash
openclaw googlemeet doctor --oauth --json
```

Việc này không tải runtime Chrome hoặc yêu cầu một node Chrome đã kết nối. Nó
kiểm tra cấu hình OAuth tồn tại và refresh token có thể mint access
token. Báo cáo JSON chỉ bao gồm các trường trạng thái như `ok`, `configured`,
`tokenSource`, `expiresAt`, và thông báo kiểm tra; nó không in access
token, refresh token, hoặc client secret.

Kết quả thường gặp:

| Kiểm tra             | Ý nghĩa                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Có `oauth.clientId` cộng `oauth.refreshToken`, hoặc một access token đã lưu cache.       |
| `oauth-token`        | Access token đã lưu cache vẫn hợp lệ, hoặc refresh token đã mint một access token mới. |
| `meet-spaces-get`    | Kiểm tra `--meeting` tùy chọn đã phân giải một không gian Meet hiện có.                             |
| `meet-spaces-create` | Kiểm tra `--create-space` tùy chọn đã tạo một không gian Meet mới.                               |

Để chứng minh cả việc bật Google Meet API và scope `spaces.create`, hãy chạy
kiểm tra tạo có tác dụng phụ:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tạo một URL Meet dùng để bỏ đi. Dùng nó khi bạn cần xác nhận
rằng dự án Google Cloud đã bật Meet API và tài khoản đã được ủy quyền
có scope `meetings.space.created`.

Để chứng minh quyền đọc cho một không gian cuộc họp hiện có:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` và `resolve-space` chứng minh quyền đọc đối với một
không gian hiện có mà tài khoản Google đã ủy quyền có thể truy cập. Một lỗi `403` từ các kiểm tra này
thường có nghĩa là Google Meet REST API bị tắt, refresh token đã đồng ý
thiếu scope bắt buộc, hoặc tài khoản Google không thể truy cập không gian Meet đó. Lỗi refresh-token
có nghĩa là chạy lại `openclaw googlemeet auth login
--json` và lưu khối `oauth` mới.

Không cần thông tin xác thực OAuth cho fallback trình duyệt. Ở chế độ đó, xác thực Google
đến từ hồ sơ Chrome đã đăng nhập trên node đã chọn, không phải từ
cấu hình OpenClaw.

Các biến môi trường này được chấp nhận làm fallback:

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

Chạy kiểm tra trước khi xử lý phương tiện:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Liệt kê các tạo tác cuộc họp và điểm danh sau khi Meet đã tạo bản ghi hội nghị:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Với `--meeting`, `artifacts` và `attendance` mặc định dùng bản ghi hội nghị mới nhất. Truyền `--all-conference-records` khi bạn muốn mọi bản ghi còn được giữ lại cho cuộc họp đó.

Tra cứu Calendar có thể phân giải URL cuộc họp từ Google Calendar trước khi đọc các tạo tác Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` tìm kiếm lịch `primary` của hôm nay để tìm một sự kiện Calendar có liên kết Google Meet. Dùng `--event <query>` để tìm văn bản sự kiện khớp, và `--calendar <id>` cho lịch không phải lịch chính. Tra cứu Calendar yêu cầu đăng nhập OAuth mới có bao gồm phạm vi chỉ đọc sự kiện Calendar. `calendar-events` xem trước các sự kiện Meet khớp và đánh dấu sự kiện mà `latest`, `artifacts`, `attendance` hoặc `export` sẽ chọn.

Nếu bạn đã biết id bản ghi hội nghị, hãy trỏ trực tiếp đến nó:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts` trả về siêu dữ liệu bản ghi hội nghị cùng siêu dữ liệu tài nguyên người tham gia, bản ghi, bản chép lời, mục bản chép lời có cấu trúc và ghi chú thông minh khi Google cung cấp chúng cho cuộc họp. Dùng `--no-transcript-entries` để bỏ qua tra cứu mục cho các cuộc họp lớn. `attendance` mở rộng người tham gia thành các hàng phiên người tham gia với thời điểm thấy lần đầu/lần cuối, tổng thời lượng phiên, cờ đến muộn/rời sớm, và các tài nguyên người tham gia trùng lặp được hợp nhất theo người dùng đã đăng nhập hoặc tên hiển thị. Truyền `--no-merge-duplicates` để giữ riêng các tài nguyên người tham gia thô, `--late-after-minutes` để tinh chỉnh phát hiện đến muộn, và `--early-before-minutes` để tinh chỉnh phát hiện rời sớm.

`export` ghi một thư mục chứa `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` và `manifest.json`. `manifest.json` ghi lại đầu vào đã chọn, tùy chọn xuất, bản ghi hội nghị, tệp đầu ra, số lượng, nguồn token, sự kiện Calendar khi được dùng, và mọi cảnh báo truy xuất một phần. Truyền `--zip` để cũng ghi một kho lưu trữ có thể mang theo bên cạnh thư mục. Truyền `--include-doc-bodies` để xuất văn bản Google Docs của bản chép lời và ghi chú thông minh được liên kết thông qua Google Drive `files.export`; việc này yêu cầu đăng nhập OAuth mới có bao gồm phạm vi chỉ đọc Drive Meet. Không có `--include-doc-bodies`, các bản xuất chỉ bao gồm siêu dữ liệu Meet và các mục bản chép lời có cấu trúc. Nếu Google trả về lỗi tạo tác một phần, chẳng hạn lỗi liệt kê ghi chú thông minh, mục bản chép lời, hoặc phần thân tài liệu Drive, phần tóm tắt và manifest giữ cảnh báo thay vì làm hỏng toàn bộ bản xuất. Dùng `--dry-run` để tìm nạp cùng dữ liệu tạo tác/điểm danh và in JSON manifest mà không tạo thư mục hoặc ZIP. Điều đó hữu ích trước khi ghi một bản xuất lớn hoặc khi một agent chỉ cần số lượng, các bản ghi đã chọn và cảnh báo.

Agent cũng có thể tạo cùng gói này thông qua công cụ `google_meet`:

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

Chạy kiểm tra khói live được bảo vệ trên một cuộc họp thật còn được lưu giữ:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Môi trường kiểm tra khói live:

- `OPENCLAW_LIVE_TEST=1` bật các kiểm thử live được bảo vệ.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` trỏ đến một URL Meet, mã hoặc `spaces/{id}` còn được lưu giữ.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` hoặc `GOOGLE_MEET_CLIENT_ID` cung cấp id máy khách OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` hoặc `GOOGLE_MEET_REFRESH_TOKEN` cung cấp refresh token.
- Tùy chọn: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, và
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` dùng cùng tên dự phòng không có tiền tố `OPENCLAW_`.

Kiểm tra khói live tạo tác/điểm danh cơ bản cần `https://www.googleapis.com/auth/meetings.space.readonly` và `https://www.googleapis.com/auth/meetings.conference.media.readonly`. Tra cứu Calendar cần `https://www.googleapis.com/auth/calendar.events.readonly`. Xuất phần thân tài liệu Drive cần `https://www.googleapis.com/auth/drive.meet.readonly`.

Tạo một không gian Meet mới:

```bash
openclaw googlemeet create
```

Lệnh in `meeting uri`, nguồn và phiên tham gia mới. Với thông tin xác thực OAuth, lệnh dùng Google Meet API chính thức. Không có thông tin xác thực OAuth, lệnh dùng hồ sơ trình duyệt đã đăng nhập của Node Chrome được ghim làm phương án dự phòng. Agent có thể dùng công cụ `google_meet` với `action: "create"` để tạo và tham gia trong một bước. Để chỉ tạo URL, truyền `"join": false`.

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

Khi agent thấy `manualActionRequired: true`, agent nên báo cáo `manualActionMessage` cùng ngữ cảnh node/tab trình duyệt và dừng mở tab Meet mới cho đến khi người vận hành hoàn tất bước trên trình duyệt.

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

Tạo Meet sẽ tham gia theo mặc định. Truyền tải Chrome hoặc Chrome-node vẫn cần hồ sơ Google Chrome đã đăng nhập để tham gia qua trình duyệt. Nếu hồ sơ đã đăng xuất, OpenClaw báo cáo `manualActionRequired: true` hoặc lỗi dự phòng trình duyệt và yêu cầu người vận hành hoàn tất đăng nhập Google trước khi thử lại.

Chỉ đặt `preview.enrollmentAcknowledged: true` sau khi xác nhận dự án Cloud, principal OAuth và người tham gia cuộc họp của bạn đã được ghi danh vào Google Workspace Developer Preview Program cho Meet media APIs.

## Cấu hình

Đường dẫn realtime Chrome thông dụng chỉ cần bật Plugin, BlackHole, SoX và khóa nhà cung cấp giọng nói realtime backend. OpenAI là mặc định; đặt `realtime.provider: "google"` để dùng Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Đặt cấu hình Plugin trong `plugins.entries.google-meet.config`:

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
- `chrome.autoJoin: true`: điền tên khách và nhấp Join Now theo kiểu nỗ lực tối đa thông qua tự động hóa trình duyệt OpenClaw trên `chrome-node`
- `chrome.reuseExistingTab: true`: kích hoạt một tab Meet hiện có thay vì mở các tab trùng lặp
- `chrome.waitForInCallMs: 20000`: chờ tab Meet báo cáo đang trong cuộc gọi trước khi phần giới thiệu realtime được kích hoạt
- `chrome.audioFormat: "pcm16-24khz"`: định dạng âm thanh cặp lệnh. Chỉ dùng `"g711-ulaw-8khz"` cho các cặp lệnh cũ/tùy chỉnh vẫn phát âm thanh điện thoại.
- `chrome.audioInputCommand`: lệnh SoX đọc từ CoreAudio `BlackHole 2ch` và ghi âm thanh ở `chrome.audioFormat`
- `chrome.audioOutputCommand`: lệnh SoX đọc âm thanh ở `chrome.audioFormat` và ghi vào CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: phản hồi nói ngắn gọn, với `openclaw_agent_consult` cho câu trả lời sâu hơn
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

`voiceCall.enabled` mặc định là `true`; với truyền tải Twilio, nó ủy quyền cuộc gọi PSTN và DTMF thực tế cho Plugin Voice Call. Nếu `voice-call` không được bật, Google Meet vẫn có thể xác thực và ghi lại kế hoạch quay số, nhưng không thể thực hiện cuộc gọi Twilio.

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
`transport: "chrome-node"` khi Chrome chạy trên một node đã ghép đôi, chẳng hạn
VM Parallels. Trong cả hai trường hợp, mô hình realtime và `openclaw_agent_consult` chạy trên
máy chủ Gateway, nên thông tin xác thực mô hình vẫn ở đó.

Dùng `action: "status"` để liệt kê các phiên đang hoạt động hoặc kiểm tra một ID phiên. Dùng
`action: "speak"` với `sessionId` và `message` để khiến tác nhân realtime
nói ngay lập tức. Dùng `action: "test_speech"` để tạo hoặc tái sử dụng phiên,
kích hoạt một cụm từ đã biết, và trả về tình trạng `inCall` khi máy chủ Chrome có thể
báo cáo trạng thái đó. `test_speech` luôn buộc `mode: "realtime"` và thất bại nếu được yêu cầu
chạy trong `mode: "transcribe"` vì các phiên chỉ quan sát cố ý không thể
phát lời nói. Kết quả `speechOutputVerified` của nó dựa trên số byte đầu ra âm thanh realtime
tăng lên trong lệnh gọi kiểm thử này, nên một phiên được tái sử dụng có âm thanh cũ hơn
không được tính là một lần kiểm tra lời nói mới thành công. Dùng `action: "leave"` để đánh dấu
một phiên đã kết thúc.

`status` bao gồm tình trạng Chrome khi có sẵn:

- `inCall`: Chrome dường như đang ở trong cuộc gọi Meet
- `micMuted`: trạng thái micrô Meet theo nỗ lực tốt nhất
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: hồ sơ
  trình duyệt cần đăng nhập thủ công, được máy chủ Meet cho phép vào, cấp quyền, hoặc
  sửa điều khiển trình duyệt trước khi lời nói có thể hoạt động
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: liệu
  lời nói Chrome được quản lý hiện có được phép hay không. `speechReady: false` nghĩa là OpenClaw đã
  không gửi cụm từ giới thiệu/kiểm thử vào cầu nối âm thanh.
- `providerConnected` / `realtimeReady`: trạng thái cầu nối giọng nói realtime
- `lastInputAt` / `lastOutputAt`: âm thanh cuối cùng được thấy từ cầu nối hoặc gửi tới cầu nối

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Tham vấn tác nhân realtime

Chế độ Chrome realtime được tối ưu hóa cho một vòng lặp giọng nói trực tiếp. Nhà cung cấp giọng nói
realtime nghe âm thanh cuộc họp và nói qua cầu nối âm thanh đã cấu hình.
Khi mô hình realtime cần suy luận sâu hơn, thông tin hiện tại, hoặc các công cụ
OpenClaw thông thường, nó có thể gọi `openclaw_agent_consult`.

Công cụ tham vấn chạy tác nhân OpenClaw thông thường ở phía sau với ngữ cảnh
bản ghi cuộc họp gần đây và trả về một câu trả lời nói ngắn gọn cho phiên giọng nói
realtime. Sau đó mô hình giọng nói có thể nói câu trả lời đó trở lại cuộc họp.
Nó dùng cùng công cụ tham vấn realtime dùng chung như Voice Call.

Theo mặc định, các lần tham vấn chạy với tác nhân `main`. Đặt `realtime.agentId` khi một
làn Meet cần tham vấn một không gian làm việc tác nhân OpenClaw chuyên dụng, mặc định mô hình,
chính sách công cụ, bộ nhớ, và lịch sử phiên.

`realtime.toolPolicy` điều khiển lần chạy tham vấn:

- `safe-read-only`: hiển thị công cụ tham vấn và giới hạn tác nhân thông thường ở
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, và
  `memory_get`.
- `owner`: hiển thị công cụ tham vấn và cho phép tác nhân thông thường dùng
  chính sách công cụ tác nhân bình thường.
- `none`: không hiển thị công cụ tham vấn cho mô hình giọng nói realtime.

Khóa phiên tham vấn được giới hạn phạm vi theo từng phiên Meet, nên các lệnh gọi tham vấn tiếp theo
có thể tái sử dụng ngữ cảnh tham vấn trước đó trong cùng cuộc họp.

Để buộc kiểm tra trạng thái sẵn sàng bằng giọng nói sau khi Chrome đã tham gia hoàn toàn cuộc gọi:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Đối với smoke tham gia-và-nói đầy đủ:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Danh sách kiểm tra kiểm thử trực tiếp

Dùng chuỗi này trước khi giao một cuộc họp cho tác nhân không có người giám sát:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Trạng thái Chrome-node mong đợi:

- `googlemeet setup` đều xanh.
- `googlemeet setup` bao gồm `chrome-node-connected` khi Chrome-node là
  transport mặc định hoặc một node được ghim.
- `nodes status` cho thấy node đã chọn đang kết nối.
- Node đã chọn quảng bá cả `googlemeet.chrome` và `browser.proxy`.
- Thẻ Meet tham gia cuộc gọi và `test-speech` trả về tình trạng Chrome với
  `inCall: true`.

Đối với một máy chủ Chrome từ xa như VM macOS Parallels, đây là bước kiểm tra
an toàn ngắn nhất sau khi cập nhật Gateway hoặc VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Điều đó chứng minh Plugin Gateway đã được tải, node VM đang kết nối với
token hiện tại, và cầu nối âm thanh Meet sẵn sàng trước khi một tác nhân mở một
thẻ cuộc họp thật.

Đối với smoke Twilio, dùng một cuộc họp hiển thị chi tiết quay số bằng điện thoại:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Trạng thái Twilio mong đợi:

- `googlemeet setup` bao gồm các kiểm tra `twilio-voice-call-plugin` và
  `twilio-voice-call-credentials` màu xanh.
- `voicecall` có sẵn trong CLI sau khi Gateway tải lại.
- Phiên được trả về có `transport: "twilio"` và một `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` ngắt cuộc gọi thoại được ủy quyền.

## Khắc phục sự cố

### Tác nhân không thấy công cụ Google Meet

Xác nhận Plugin đã được bật trong cấu hình Gateway và tải lại Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Nếu bạn vừa chỉnh sửa `plugins.entries.google-meet`, hãy khởi động lại hoặc tải lại Gateway.
Tác nhân đang chạy chỉ thấy các công cụ Plugin được quy trình Gateway hiện tại
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

Node phải được kết nối và liệt kê `googlemeet.chrome` cùng với `browser.proxy`.
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

Nếu `googlemeet setup` thất bại ở `chrome-node-connected` hoặc nhật ký Gateway báo cáo
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
báo cáo `manualActionRequired: true`, hãy hiển thị `manualActionMessage` cho người vận hành
và dừng thử lại cho đến khi hành động trình duyệt hoàn tất.

Các hành động thủ công thường gặp:

- Đăng nhập vào hồ sơ Chrome.
- Cho phép khách vào từ tài khoản máy chủ Meet.
- Cấp quyền micrô/camera cho Chrome khi lời nhắc quyền gốc của Chrome
  xuất hiện.
- Đóng hoặc sửa một hộp thoại quyền Meet bị kẹt.

Không báo cáo "not signed in" chỉ vì Meet hiển thị "Do you want people to
hear you in the meeting?" Đó là màn hình trung gian lựa chọn âm thanh của Meet; OpenClaw
bấm **Use microphone** thông qua tự động hóa trình duyệt khi có sẵn và tiếp tục
chờ trạng thái cuộc họp thật. Đối với phương án dự phòng trình duyệt chỉ tạo, OpenClaw
có thể bấm **Continue without microphone** vì việc tạo URL không cần
đường dẫn âm thanh realtime.

### Tạo cuộc họp thất bại

`googlemeet create` trước tiên dùng endpoint `spaces.create` của Google Meet API
khi thông tin xác thực OAuth được cấu hình. Nếu không có thông tin xác thực OAuth, nó chuyển dự phòng
sang trình duyệt node Chrome đã ghim. Xác nhận:

- Đối với tạo qua API: `oauth.clientId` và `oauth.refreshToken` được cấu hình,
  hoặc các biến môi trường `OPENCLAW_GOOGLE_MEET_*` tương ứng hiện diện.
- Đối với tạo qua API: refresh token được tạo sau khi hỗ trợ tạo được
  thêm vào. Các token cũ hơn có thể thiếu phạm vi `meetings.space.created`; chạy lại
  `openclaw googlemeet auth login --json` và cập nhật cấu hình Plugin.
- Đối với phương án dự phòng trình duyệt: `defaultTransport: "chrome-node"` và
  `chromeNode.node` trỏ tới một node đang kết nối có `browser.proxy` và
  `googlemeet.chrome`.
- Đối với phương án dự phòng trình duyệt: hồ sơ OpenClaw Chrome trên node đó đã đăng nhập
  vào Google và có thể mở `https://meet.google.com/new`.
- Đối với phương án dự phòng trình duyệt: các lần thử lại tái sử dụng một thẻ `https://meet.google.com/new`
  hoặc lời nhắc tài khoản Google hiện có trước khi mở thẻ mới. Nếu một tác nhân hết thời gian,
  hãy thử lại lệnh gọi công cụ thay vì mở thủ công một thẻ Meet khác.
- Đối với phương án dự phòng trình duyệt: nếu công cụ trả về `manualActionRequired: true`, hãy dùng
  `browser.nodeId`, `browser.targetId`, `browserUrl`, và
  `manualActionMessage` được trả về để hướng dẫn người vận hành. Không thử lại trong vòng lặp cho đến khi
  hành động đó hoàn tất.
- Đối với phương án dự phòng trình duyệt: nếu Meet hiển thị "Do you want people to hear you in the
  meeting?", hãy để thẻ mở. OpenClaw nên bấm **Use microphone** hoặc, đối với
  phương án dự phòng chỉ tạo, **Continue without microphone** thông qua tự động hóa
  trình duyệt và tiếp tục chờ URL Meet được tạo. Nếu không thể, lỗi
  nên nhắc tới `meet-audio-choice-required`, không phải `google-login-required`.

### Tác nhân tham gia nhưng không nói

Kiểm tra đường dẫn realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dùng `mode: "realtime"` để nghe/phản hồi bằng lời nói. `mode: "transcribe"` cố ý
không khởi động cầu nối giọng nói realtime hai chiều. `googlemeet test-speech`
luôn kiểm tra đường dẫn realtime và báo cáo liệu byte đầu ra của cầu nối có được
quan sát cho lần gọi đó hay không. Nếu `speechOutputVerified` là false và
`speechOutputTimedOut` là true, nhà cung cấp realtime có thể đã chấp nhận
câu nói nhưng OpenClaw không thấy byte đầu ra mới tới cầu nối âm thanh
Chrome.

Cũng xác minh:

- Khóa nhà cung cấp realtime có sẵn trên máy chủ Gateway, chẳng hạn
  `OPENAI_API_KEY` hoặc `GEMINI_API_KEY`.
- `BlackHole 2ch` hiển thị trên máy chủ Chrome.
- `sox` tồn tại trên máy chủ Chrome.
- Micrô và loa Meet được định tuyến qua đường dẫn âm thanh ảo mà
  OpenClaw sử dụng.

`googlemeet doctor [session-id]` in ra phiên, node, trạng thái trong cuộc gọi,
lý do hành động thủ công, kết nối nhà cung cấp realtime, `realtimeReady`, hoạt động
đầu vào/đầu ra âm thanh, dấu thời gian âm thanh cuối cùng, bộ đếm byte, và URL trình duyệt.
Dùng `googlemeet status [session-id]` khi bạn cần JSON thô. Dùng
`googlemeet doctor --oauth` khi bạn cần xác minh làm mới OAuth của Google Meet
mà không để lộ token; thêm `--meeting` hoặc `--create-space` khi bạn cũng cần
bằng chứng Google Meet API.

Nếu một tác nhân hết thời gian và bạn thấy một thẻ Meet đã mở, hãy kiểm tra thẻ đó
mà không mở thẻ khác:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Hành động công cụ tương đương là `recover_current_tab`. Nó đưa tiêu điểm và kiểm tra một
thẻ Meet hiện có cho transport đã chọn. Với `chrome`, nó dùng điều khiển
trình duyệt cục bộ thông qua Gateway; với `chrome-node`, nó dùng node Chrome đã cấu hình.
Nó không mở thẻ mới hoặc tạo phiên mới; nó báo cáo yếu tố chặn
hiện tại, chẳng hạn đăng nhập, cho phép vào, quyền, hoặc trạng thái lựa chọn âm thanh.
Lệnh CLI nói chuyện với Gateway đã cấu hình, nên Gateway phải đang chạy;
`chrome-node` cũng yêu cầu node Chrome phải được kết nối.

### Kiểm tra thiết lập Twilio thất bại

`twilio-voice-call-plugin` không thành công khi `voice-call` không được cho phép hoặc chưa được bật.
Thêm nó vào `plugins.allow`, bật `plugins.entries.voice-call`, rồi tải lại
Gateway.

`twilio-voice-call-credentials` không thành công khi backend Twilio thiếu account
SID, auth token hoặc số gọi đi. Đặt các giá trị này trên máy chủ Gateway:

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

Theo mặc định, `voicecall smoke` chỉ kiểm tra trạng thái sẵn sàng. Để chạy thử khô với một số cụ thể:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Chỉ thêm `--yes` khi bạn cố ý muốn thực hiện một cuộc gọi thông báo đi trực tiếp:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Cuộc gọi Twilio bắt đầu nhưng không bao giờ vào cuộc họp

Xác nhận sự kiện Meet hiển thị thông tin quay số vào bằng điện thoại. Truyền đúng
số quay vào và PIN hoặc một chuỗi DTMF tùy chỉnh:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Dùng `w` ở đầu hoặc dấu phẩy trong `--dtmf-sequence` nếu nhà cung cấp cần tạm dừng
trước khi nhập PIN.

## Ghi chú

API phương tiện chính thức của Google Meet thiên về nhận, nên việc nói vào một
cuộc gọi Meet vẫn cần một đường dẫn người tham gia. Plugin này giữ ranh giới đó
rõ ràng: Chrome xử lý việc tham gia bằng trình duyệt và định tuyến âm thanh cục bộ; Twilio xử lý việc tham gia bằng cách quay số vào qua điện thoại.

Chế độ thời gian thực của Chrome cần `BlackHole 2ch` cùng với một trong hai tùy chọn:

- `chrome.audioInputCommand` cùng với `chrome.audioOutputCommand`: OpenClaw sở hữu
  cầu nối mô hình thời gian thực và truyền âm thanh ở `chrome.audioFormat` giữa các
  lệnh đó và nhà cung cấp giọng nói thời gian thực đã chọn. Đường dẫn Chrome mặc định là
  PCM16 24 kHz; G.711 mu-law 8 kHz vẫn có sẵn cho các cặp lệnh cũ.
- `chrome.audioBridgeCommand`: một lệnh cầu nối bên ngoài sở hữu toàn bộ đường dẫn
  âm thanh cục bộ và phải thoát sau khi khởi động hoặc xác thực daemon của nó.

Để có âm thanh song công sạch, hãy định tuyến đầu ra Meet và micrô Meet qua các
thiết bị ảo riêng biệt hoặc một đồ thị thiết bị ảo kiểu Loopback. Một thiết bị
BlackHole dùng chung duy nhất có thể dội âm thanh của người tham gia khác trở lại cuộc gọi.

`googlemeet speak` kích hoạt cầu nối âm thanh thời gian thực đang hoạt động cho một phiên Chrome. `googlemeet leave` dừng cầu nối đó. Với các phiên Twilio được ủy quyền
thông qua Plugin Voice Call, `leave` cũng ngắt cuộc gọi thoại bên dưới.

## Liên quan

- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
- [Chế độ trò chuyện](/vi/nodes/talk)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
