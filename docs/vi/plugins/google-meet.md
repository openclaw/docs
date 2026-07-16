---
read_when:
    - Bạn muốn một tác nhân OpenClaw tham gia cuộc gọi Google Meet
    - Bạn muốn một tác tử OpenClaw tạo cuộc gọi Google Meet mới
    - Bạn đang cấu hình Chrome, Node Chrome hoặc Twilio làm phương thức truyền tải cho Google Meet
summary: 'Plugin Google Meet: tham gia các URL Meet được chỉ định qua Chrome hoặc Twilio với chế độ phản hồi bằng giọng nói mặc định của tác nhân'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-07-16T15:29:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

Plugin `google-meet` tham gia các URL Meet được chỉ định thay mặt cho một tác tử OpenClaw. Phạm vi của Plugin này được chủ ý giới hạn:

- Plugin chỉ tham gia các URL `https://meet.google.com/...`; tuyệt đối không tự gọi vào cuộc họp bằng số điện thoại mà Plugin tự phát hiện.
- `googlemeet create` có thể tạo URL Meet mới thông qua Google Meet API (hoặc phương án dự phòng bằng trình duyệt) và mặc định tham gia URL đó.
- Việc tham gia bằng Chrome sử dụng một hồ sơ Chrome đã đăng nhập, tùy chọn trên một Node đã ghép nối. Việc tham gia bằng Twilio gọi một số điện thoại kèm mã PIN/DTMF thông qua [Plugin cuộc gọi thoại](/vi/plugins/voice-call); phương thức này không thể gọi trực tiếp URL Meet.
- `mode: "agent"` (mặc định) chuyển lời nói của người tham gia thành văn bản bằng nhà cung cấp thời gian thực, chuyển văn bản đó đến tác tử OpenClaw đã cấu hình và đọc câu trả lời bằng TTS thông thường của OpenClaw. `mode: "bidi"` cho phép mô hình giọng nói thời gian thực trả lời trực tiếp. `mode: "transcribe"` tham gia ở chế độ chỉ quan sát, không phản hồi bằng giọng nói.
- Không có thông báo đồng ý tự động khi Plugin tham gia cuộc gọi.
- Lệnh CLI là `googlemeet`; `meet` được dành riêng cho các quy trình hội nghị từ xa rộng hơn của tác tử.

## Bắt đầu nhanh

Cài đặt các phần phụ thuộc âm thanh cục bộ, sau đó đặt khóa của nhà cung cấp thời gian thực. OpenAI là nhà cung cấp chuyển lời nói thành văn bản mặc định cho chế độ `agent`; Google Gemini Live có thể được dùng làm nhà cung cấp giọng nói cho chế độ `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# chỉ cần khi realtime.voiceProvider là "google" cho chế độ bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` cài đặt thiết bị âm thanh ảo `BlackHole 2ch` mà Chrome định tuyến qua. Trình cài đặt của Homebrew yêu cầu khởi động lại trước khi macOS hiển thị thiết bị:

```bash
sudo reboot
```

Sau khi khởi động lại, xác minh cả hai thành phần:

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

Kiểm tra thiết lập, sau đó tham gia:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Đầu ra `setup` có thể được tác tử đọc và nhận biết chế độ/phương thức truyền tải: đầu ra báo cáo hồ sơ Chrome, việc ghim Node và, đối với các phiên tham gia Chrome thời gian thực, cầu nối âm thanh BlackHole/SoX cùng bước kiểm tra phần giới thiệu bị trì hoãn. Các phiên tham gia chỉ quan sát bỏ qua điều kiện tiên quyết về thời gian thực:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Khi đã cấu hình ủy quyền Twilio, `setup` cũng báo cáo liệu `voice-call`, thông tin xác thực Twilio và khả năng công khai Webhook đã sẵn sàng hay chưa. Hãy xem mọi bước kiểm tra `ok: false` là yếu tố chặn đối với phương thức truyền tải/chế độ đó trước khi tác tử tham gia. Sử dụng `--json` để nhận đầu ra máy có thể đọc và `--transport chrome|chrome-node|twilio` để kiểm tra trước một phương thức truyền tải cụ thể:

```bash
openclaw googlemeet setup --transport twilio
```

Hoặc để tác tử tham gia thông qua công cụ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Trên các máy chủ Gateway không chạy macOS, `google_meet` vẫn hiển thị cho các thao tác tạo tác, lịch, thiết lập, chuyển lời nói thành văn bản, Twilio và `chrome-node`, nhưng khả năng phản hồi bằng giọng nói qua Chrome cục bộ (`transport: "chrome"` với `mode: "agent"` hoặc `"bidi"`) bị chặn trước khi đến cầu nối âm thanh, vì đường dẫn đó hiện phụ thuộc vào `BlackHole 2ch` của macOS. Thay vào đó, hãy sử dụng `mode: "transcribe"`, tính năng gọi vào bằng Twilio hoặc máy chủ `chrome-node` chạy macOS.

### Tạo cuộc họp

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` có hai đường dẫn, được báo cáo trong trường `source` của kết quả:

- **`api`**: được sử dụng khi đã cấu hình thông tin xác thực OAuth của Google Meet. Có tính xác định; không phụ thuộc vào trạng thái giao diện người dùng của trình duyệt.
- **`browser`**: được sử dụng khi không có thông tin xác thực OAuth. OpenClaw mở `https://meet.google.com/new` trên Node Chrome đã ghim và chờ Google chuyển hướng đến URL có mã cuộc họp thực; hồ sơ Chrome của OpenClaw trên Node đó phải được đăng nhập Google từ trước. Cả thao tác tham gia và tạo đều tái sử dụng thẻ Meet hiện có (hoặc thẻ lời nhắc `.../new` / tài khoản Google đang xử lý) trước khi mở thẻ mới; việc đối sánh thẻ bỏ qua các chuỗi truy vấn vô hại như `authuser`.

`create` mặc định tham gia và trả về `joined: true` cùng phiên tham gia. Truyền `--no-join` (CLI) hoặc `"join": false` (công cụ) để chỉ tạo URL.

Đối với các phòng được tạo bằng API, hãy đặt chính sách truy cập rõ ràng thay vì kế thừa giá trị mặc định của tài khoản Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Ai có thể tham gia mà không cần yêu cầu quyền vào                         |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Bất kỳ ai có URL Meet                                              |
| `TRUSTED`       | Người dùng đáng tin cậy thuộc tổ chức của chủ trì, người dùng bên ngoài được mời và người dùng gọi vào |
| `RESTRICTED`    | Chỉ người được mời                                                  |

Điều này chỉ áp dụng cho các phòng được tạo bằng API, vì vậy phải cấu hình OAuth. Nếu đã xác thực trước khi tùy chọn này tồn tại, hãy chạy lại `openclaw googlemeet auth login --json` sau khi thêm phạm vi `meetings.space.settings` vào màn hình đồng ý OAuth.

Nếu phương án dự phòng bằng trình duyệt gặp trang đăng nhập Google hoặc yếu tố chặn quyền Meet, công cụ trả về `manualActionRequired: true` cùng `manualActionReason`, `manualActionMessage` và `browser.nodeId`/`browser.targetId`/`browserUrl`. Hãy báo cáo thông báo đó và ngừng mở thẻ Meet mới cho đến khi người vận hành hoàn tất bước trong trình duyệt.

### Tham gia ở chế độ chỉ quan sát

Đặt `"mode": "transcribe"` để bỏ qua cầu nối thời gian thực song công (không yêu cầu BlackHole/SoX, không phản hồi bằng giọng nói). Các phiên tham gia Chrome ở chế độ chuyển lời nói thành văn bản cũng bỏ qua việc OpenClaw cấp quyền micrô/camera và luồng **Use microphone** của Meet; nếu Meet hiển thị màn hình trung gian chọn âm thanh, quá trình tự động hóa sẽ thử **Continue without microphone** trước. Các phương thức truyền tải Chrome được quản lý trong chế độ này cài đặt trình quan sát phụ đề Meet theo cơ chế nỗ lực tối đa. `googlemeet status --json` và `googlemeet doctor` báo cáo `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` và phần đuôi `recentTranscript`.

Để đọc bản chép lời phiên có giới hạn, hãy đọc chính xác thẻ Meet đang được theo dõi:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

Trình quan sát giữ tối đa 2.000 dòng phụ đề đã hoàn tất trên trang Meet. Văn bản đang hiển thị và tiếp tục được bổ sung vẫn nằm trong phần đuôi trạng thái tình trạng cho đến khi hàng phụ đề hoàn tất, vì vậy việc lưu `nextIndex` không thể bỏ sót phần văn bản được mở rộng sau đó; thao tác rời đi hoàn tất các hàng đang hiển thị trước khi tạo ảnh chụp nhanh. `droppedLines` báo cáo số dòng bị mất ở đầu khi vượt quá giới hạn. Bản chép lời của bốn phiên kết thúc gần đây nhất vẫn có thể đọc được cho đến khi Gateway khởi động lại. Các bản chép lời của phiên cũ hơn đã kết thúc trả về `evicted: true`. Đây được chủ ý thiết kế là bộ nhớ thời gian chạy, không phải nơi lưu trữ lịch sử cuộc họp lâu dài: việc khởi động lại Gateway, đóng thẻ trước khi tạo ảnh chụp nhanh hoặc vượt quá các giới hạn đã ghi trong tài liệu có thể làm mất phụ đề.

Để thực hiện phép thử nghe có/không:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Lệnh tham gia ở chế độ chuyển lời nói thành văn bản, chờ phụ đề/bản chép lời mới thay đổi và trả về `listenVerified`, `listenTimedOut`, các trường thao tác thủ công và tình trạng phụ đề hiện tại.

### Tình trạng phiên thời gian thực

Trong các phiên phản hồi bằng giọng nói, trạng thái `google_meet` báo cáo tình trạng Chrome/cầu nối âm thanh: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, dấu thời gian đầu vào/đầu ra gần nhất, bộ đếm byte và trạng thái cầu nối đã đóng. Các phiên Chrome được quản lý chỉ đọc phần giới thiệu/cụm từ thử nghiệm sau khi tình trạng báo cáo `inCall: true`; nếu không, `speechReady: false` và lần thử phát giọng nói sẽ bị chặn thay vì âm thầm không thực hiện gì.

Các phiên tham gia Chrome cục bộ sử dụng hồ sơ trình duyệt OpenClaw đã đăng nhập và cần `BlackHole 2ch` cho đường dẫn micrô/loa. Một thiết bị BlackHole duy nhất là đủ cho lần kiểm tra khói đầu tiên nhưng có thể gây tiếng vọng; hãy sử dụng các thiết bị ảo riêng biệt hoặc biểu đồ kiểu Loopback để có âm thanh song công rõ ràng.

## Gateway cục bộ + Chrome trên Parallels

Không cần Gateway đầy đủ hoặc khóa API mô hình bên trong máy ảo macOS chỉ để cung cấp Chrome cho máy ảo. Chạy Gateway và tác tử cục bộ; chạy máy chủ Node trong máy ảo.

| Nơi chạy             | Thành phần                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Máy chủ Gateway      | OpenClaw Gateway, không gian làm việc của tác tử, khóa mô hình/API, nhà cung cấp thời gian thực, cấu hình Plugin Google Meet |
| Máy ảo macOS Parallels | Máy chủ CLI/Node OpenClaw, Chrome, SoX, BlackHole 2ch, hồ sơ Chrome đã đăng nhập Google         |
| Không cần trong máy ảo | Dịch vụ Gateway, cấu hình tác tử, thiết lập nhà cung cấp mô hình                                |

Cài đặt các phần phụ thuộc trong máy ảo, khởi động lại và xác minh:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Bật Plugin trong máy ảo và khởi động máy chủ Node:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Nếu `<gateway-host>` là địa chỉ IP LAN không có TLS, hãy chủ động cho phép mạng riêng đáng tin cậy đó:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sử dụng cùng cờ khi cài đặt dưới dạng LaunchAgent (đây là môi trường tiến trình, được lưu trong môi trường LaunchAgent khi có mặt trong lệnh cài đặt, không phải thiết lập `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Phê duyệt Node từ máy chủ Gateway, sau đó xác nhận Node quảng bá cả `googlemeet.chrome` và khả năng trình duyệt/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Định tuyến Meet qua Node đó:

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

Bây giờ hãy tham gia theo cách thông thường từ máy chủ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Để thực hiện kiểm tra khói bằng một lệnh, tạo hoặc tái sử dụng phiên, đọc một cụm từ đã biết và in tình trạng phiên:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Trong quá trình tham gia thời gian thực, cơ chế tự động hóa trình duyệt điền tên khách, nhấp vào Join/Ask to join và chấp nhận lời nhắc "Use microphone" trong lần chạy đầu tiên của Meet khi lời nhắc xuất hiện (hoặc "Continue without microphone" khi tham gia ở chế độ chỉ quan sát và tạo cuộc họp chỉ bằng trình duyệt). Nếu hồ sơ đã đăng xuất, Meet đang chờ chủ trì cho phép vào, Chrome cần quyền micrô/camera hoặc Meet bị kẹt tại một lời nhắc chưa được xử lý, kết quả báo cáo `manualActionRequired: true` cùng `manualActionReason` và `manualActionMessage`. Hãy ngừng thử lại, báo cáo thông báo đó cùng `browserUrl`/`browserTitle`, và chỉ thử lại sau khi thao tác thủ công hoàn tất.

Nếu bỏ qua `chromeNode.node`, OpenClaw chỉ tự động chọn khi có đúng một node đã kết nối quảng bá cả `googlemeet.chrome` và khả năng điều khiển trình duyệt; hãy ghim `chromeNode.node` (ID node, tên hiển thị hoặc IP từ xa) khi có nhiều node đủ khả năng được kết nối.

### Các bước kiểm tra lỗi thường gặp

| Triệu chứng                                              | Cách khắc phục                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Node đã ghim được nhận diện nhưng không khả dụng. Hãy báo cáo yếu tố cản trở việc thiết lập; không được âm thầm chuyển sang một phương thức truyền tải khác trừ khi được yêu cầu.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Chạy `openclaw node run` trong máy ảo, phê duyệt ghép đôi, rồi chạy `openclaw plugins enable google-meet` và `openclaw plugins enable browser` tại đó. Xác nhận `gateway.nodes.allowCommands` bao gồm `googlemeet.chrome` và `browser.proxy`.                              |
| `BlackHole 2ch audio device not found`                   | Cài đặt `blackhole-2ch` trên máy chủ đang được kiểm tra và khởi động lại.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Cài đặt `blackhole-2ch` trong máy ảo và khởi động lại máy ảo.                                                                                                                                                                                                                |
| Chrome mở nhưng không thể tham gia                             | Đăng nhập vào hồ sơ trình duyệt trong máy ảo hoặc tiếp tục đặt `chrome.guestName`. Tính năng tự động tham gia của máy khách sử dụng khả năng tự động hóa trình duyệt OpenClaw thông qua proxy trình duyệt của node; trỏ `browser.defaultProfile` của node (hoặc một hồ sơ phiên hiện có có tên) đến hồ sơ bạn muốn. |
| Các thẻ Meet trùng lặp                                      | Giữ nguyên `chrome.reuseExistingTab: true`. OpenClaw kích hoạt thẻ hiện có cho cùng URL, đồng thời quá trình tạo sẽ tái sử dụng `.../new` đang diễn ra hoặc thẻ nhắc đăng nhập tài khoản Google trước khi mở thẻ khác.                                                                      |
| Không có âm thanh                                                 | Định tuyến micrô/loa Meet qua đường dẫn âm thanh ảo mà OpenClaw sử dụng; sử dụng các thiết bị ảo riêng biệt hoặc định tuyến kiểu Loopback để có âm thanh hai chiều rõ ràng.                                                                                                              |

## Ghi chú cài đặt

Cấu hình mặc định phản hồi bằng giọng nói của Chrome sử dụng hai công cụ bên ngoài mà OpenClaw không đóng gói hoặc phân phối lại; hãy cài đặt chúng làm phần phụ thuộc trên máy chủ thông qua Homebrew:

- `sox`: tiện ích âm thanh dòng lệnh. Plugin phát hành các lệnh thiết bị CoreAudio tường minh cho cầu nối âm thanh PCM16 24 kHz mặc định.
- `blackhole-2ch`: trình điều khiển âm thanh ảo macOS cung cấp thiết bị `BlackHole 2ch` để Chrome/Meet định tuyến qua.

SoX được cấp phép theo `LGPL-2.0-only AND GPL-2.0-only`; BlackHole theo GPL-3.0. Nếu bạn xây dựng trình cài đặt hoặc thiết bị tích hợp đóng gói BlackHole cùng OpenClaw, hãy xem xét giấy phép thượng nguồn của BlackHole hoặc xin giấy phép riêng từ Existential Audio.

## Phương thức truyền tải

| Phương thức truyền tải     | Sử dụng khi                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/âm thanh chạy trên máy chủ Gateway                                                        |
| `chrome-node` | Chrome/âm thanh chạy trên một node đã ghép đôi (ví dụ: máy ảo macOS Parallels)                        |
| `twilio`      | Phương án dự phòng quay số bằng điện thoại qua Plugin Voice Call khi không thể tham gia bằng Chrome |

### Chrome

Mở URL Meet thông qua khả năng điều khiển trình duyệt OpenClaw và tham gia bằng hồ sơ trình duyệt OpenClaw đã đăng nhập. Trên macOS, Plugin kiểm tra `BlackHole 2ch` trước khi khởi chạy và nếu được cấu hình, sẽ chạy lệnh kiểm tra tình trạng/khởi động cầu nối âm thanh trước khi mở Chrome. Với Chrome cục bộ, chọn hồ sơ bằng `browser.defaultProfile`; thay vào đó, `chrome.browserProfile` được truyền đến các máy chủ `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Âm thanh micrô/loa Chrome được định tuyến qua cầu nối âm thanh OpenClaw cục bộ. Nếu chưa cài đặt `BlackHole 2ch`, thao tác tham gia sẽ thất bại với lỗi thiết lập thay vì tham gia mà không có đường dẫn âm thanh.

### Twilio

Một kế hoạch quay số nghiêm ngặt được ủy quyền cho [Plugin cuộc gọi thoại](/vi/plugins/voice-call). Kế hoạch này không phân tích các trang Meet để tìm số điện thoại; Google Meet phải cung cấp số điện thoại quay vào và mã PIN cho cuộc họp.

Bật Voice Call trên máy chủ Gateway, không phải node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // hoặc đặt "twilio" nếu Twilio nên là mặc định
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
            instructions: "Tham gia Google Meet này với tư cách là tác tử OpenClaw. Hãy ngắn gọn.",
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

Cung cấp thông tin xác thực Twilio thông qua môi trường để giữ bí mật bên ngoài `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Thay vào đó, sử dụng `realtime.provider: "openai"` với `OPENAI_API_KEY` nếu OpenAI là nhà cung cấp giọng nói thời gian thực.

Khởi động lại hoặc tải lại Gateway sau khi bật `voice-call`; các thay đổi cấu hình Plugin không có hiệu lực cho đến khi tải lại. Xác minh:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Khi cơ chế ủy quyền Twilio được kết nối, `googlemeet setup` bao gồm các bước kiểm tra `twilio-voice-call-plugin`, `twilio-voice-call-credentials` và `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Sử dụng `--dtmf-sequence` cho một chuỗi tùy chỉnh, với `w` ở đầu hoặc dấu phẩy để tạm dừng trước mã PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth và kiểm tra trước

OAuth là tùy chọn khi tạo liên kết Meet vì `googlemeet create` có thể chuyển sang tự động hóa trình duyệt làm phương án dự phòng. Cấu hình OAuth để tạo bằng API chính thức, phân giải không gian hoặc kiểm tra trước Meet Media API. Việc tham gia bằng Chrome/Chrome-node không bao giờ phụ thuộc vào OAuth; trong mọi trường hợp, chúng sử dụng hồ sơ Chrome đã đăng nhập, BlackHole/SoX và (đối với `chrome-node`) một node đã kết nối.

### Tạo thông tin xác thực Google

Trong Google Cloud Console:

<Steps>
<Step title="Tạo hoặc chọn một dự án">
</Step>
<Step title="Bật Google Meet REST API">
</Step>
<Step title="Cấu hình màn hình đồng ý OAuth">
Internal là lựa chọn đơn giản nhất cho một tổ chức Google Workspace. External phù hợp với thiết lập cá nhân/thử nghiệm; trong khi ứng dụng ở trạng thái Testing, hãy thêm từng tài khoản Google sẽ cấp quyền cho ứng dụng làm người dùng thử nghiệm.
</Step>
<Step title="Thêm các phạm vi được yêu cầu">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (tra cứu Lịch)
- `https://www.googleapis.com/auth/drive.meet.readonly` (xuất nội dung tài liệu bản chép lời/ghi chú thông minh)

</Step>
<Step title="Tạo OAuth client ID">
Loại ứng dụng **Web application**. URI chuyển hướng được cấp phép:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Sao chép client ID và client secret">
</Step>
</Steps>

`meetings.space.created` là bắt buộc đối với `spaces.create`. `meetings.space.readonly` phân giải URL/mã Meet thành không gian. `meetings.space.settings` cho phép OpenClaw truyền các cài đặt `SpaceConfig`, chẳng hạn như `accessType`, trong quá trình tạo phòng bằng API. `meetings.conference.media.readonly` dành cho kiểm tra trước Meet Media API và xử lý nội dung đa phương tiện; Google có thể yêu cầu đăng ký Developer Preview để thực sự sử dụng Media API. `calendar.events.readonly` chỉ cần thiết cho việc tra cứu lịch `--today`/`--event`. `drive.meet.readonly` chỉ cần thiết để xuất `--include-doc-bodies`. Nếu bạn chỉ cần tham gia bằng Chrome dựa trên trình duyệt, hãy bỏ qua hoàn toàn OAuth.

### Tạo refresh token

Cấu hình `oauth.clientId` và tùy chọn `oauth.clientSecret` (hoặc truyền chúng dưới dạng biến môi trường), sau đó chạy:

```bash
openclaw googlemeet auth login --json
```

Lệnh này chạy luồng PKCE với callback localhost trên `http://localhost:8085/oauth2callback` và in một khối cấu hình `oauth` có refresh token. Thêm `--manual` để sử dụng luồng sao chép/dán khi trình duyệt không thể truy cập callback cục bộ:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Đầu ra JSON:

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

Lưu đối tượng `oauth` trong cấu hình Plugin:

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

Ưu tiên các biến môi trường khi bạn không muốn refresh token nằm trong cấu hình; cấu hình được phân giải trước, sau đó mới dùng môi trường làm phương án dự phòng. Nếu bạn đã xác thực trước khi có hỗ trợ tạo cuộc họp, tra cứu lịch hoặc xuất nội dung tài liệu, hãy chạy lại `openclaw googlemeet auth login --json` để refresh token bao phủ tập hợp phạm vi hiện tại.

### Xác minh OAuth bằng doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Lệnh này kiểm tra cấu hình OAuth có tồn tại và refresh token có thể tạo access token mà không tải runtime Chrome hoặc yêu cầu node đã kết nối. Báo cáo chỉ bao gồm các trường trạng thái (`ok`, `configured`, `tokenSource`, `expiresAt`, thông báo kiểm tra) và không bao giờ in access token, refresh token hoặc client secret.

| Kiểm tra                | Ý nghĩa                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | Có `oauth.clientId` cùng `oauth.refreshToken` hoặc có access token đã lưu vào bộ nhớ đệm |
| `oauth-token`        | Access token đã lưu vào bộ nhớ đệm vẫn hợp lệ hoặc refresh token đã tạo một token mới    |
| `meet-spaces-get`    | Bước kiểm tra `--meeting` tùy chọn đã phân giải một không gian Meet hiện có                       |
| `meet-spaces-create` | Bước kiểm tra `--create-space` tùy chọn đã tạo một không gian Meet mới                         |

Chứng minh Meet API đã được bật và phạm vi `spaces.create` bằng phép kiểm tra tạo có tác dụng phụ:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Chứng minh quyền đọc đối với một không gian hiện có:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Một `403` từ các phép kiểm tra này thường có nghĩa là Meet REST API đã bị tắt, refresh token thiếu phạm vi bắt buộc hoặc tài khoản Google không thể truy cập không gian đó. Lỗi refresh token có nghĩa là cần chạy lại `openclaw googlemeet auth login --json` và lưu khối `oauth` mới.

Phương án dự phòng bằng trình duyệt không cần OAuth; quá trình xác thực Google trong trường hợp đó đến từ hồ sơ Chrome đã đăng nhập trên node được chọn, không phải từ cấu hình OpenClaw.

Các biến môi trường sau được chấp nhận làm phương án dự phòng:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` hoặc `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` hoặc `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` hoặc `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` hoặc `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` hoặc `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` hoặc `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` hoặc `GOOGLE_MEET_PREVIEW_ACK`

### Phân giải, kiểm tra trước và đọc các tạo phẩm

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Sau khi Meet đã tạo các bản ghi hội nghị:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Với `--meeting`, `artifacts` và `attendance`, bản ghi hội nghị mới nhất được sử dụng theo mặc định; truyền `--all-conference-records` để xử lý mọi bản ghi được lưu giữ.

Tra cứu lịch phân giải URL cuộc họp từ Google Calendar trước khi đọc các tạo phẩm (yêu cầu refresh token bao gồm phạm vi chỉ đọc sự kiện Calendar):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` tìm kiếm trong lịch `primary` của hôm nay một sự kiện có liên kết Meet; `--event <query>` tìm kiếm văn bản sự kiện khớp; `--calendar <id>` nhắm đến một lịch không phải lịch chính. `calendar-events` xem trước các sự kiện khớp và đánh dấu sự kiện mà `latest`/`artifacts`/`attendance`/`export` sẽ chọn.

Nếu đã biết mã định danh bản ghi hội nghị, hãy chỉ định trực tiếp:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Đóng phòng đối với một không gian do API tạo:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Gọi `spaces.endActiveConference` và yêu cầu OAuth với phạm vi `meetings.space.created` cho một không gian mà tài khoản được ủy quyền có thể quản lý. Chấp nhận URL Meet, mã cuộc họp hoặc `spaces/{id}` và trước tiên phân giải giá trị đó thành tài nguyên không gian API. Thao tác này tách biệt với `googlemeet leave`: `leave` dừng sự tham gia cục bộ/phiên của OpenClaw; `end-active-conference` yêu cầu Google Meet kết thúc hội nghị đang hoạt động trong không gian.

Ghi báo cáo dễ đọc:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` trả về siêu dữ liệu bản ghi hội nghị cùng siêu dữ liệu tài nguyên của người tham gia, bản ghi âm, bản chép lời, mục bản chép lời có cấu trúc và ghi chú thông minh khi Google cung cấp chúng. `--no-transcript-entries` bỏ qua việc tra cứu mục đối với các cuộc họp lớn. `attendance` mở rộng người tham gia thành các hàng phiên người tham gia với thời điểm xuất hiện lần đầu/lần cuối, tổng thời lượng phiên, cờ đến muộn/rời sớm và các tài nguyên người tham gia trùng lặp được hợp nhất theo người dùng đã đăng nhập hoặc tên hiển thị; `--no-merge-duplicates` giữ riêng các tài nguyên thô, `--late-after-minutes`/`--early-before-minutes` điều chỉnh các ngưỡng.

`export` ghi một thư mục gồm `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` và `manifest.json`. `manifest.json` ghi lại đầu vào đã chọn, các tùy chọn xuất, bản ghi hội nghị, tệp đầu ra, số lượng, nguồn token, mọi sự kiện Calendar đã sử dụng và các cảnh báo truy xuất một phần. `--zip` cũng ghi một tệp lưu trữ có tính di động bên cạnh thư mục. `--include-doc-bodies` xuất văn bản Google Docs của bản chép lời/ghi chú thông minh được liên kết thông qua Drive `files.export` (yêu cầu phạm vi chỉ đọc Drive Meet); nếu không có phạm vi này, dữ liệu xuất chỉ bao gồm siêu dữ liệu Meet và các mục bản chép lời có cấu trúc. Khi truy xuất một tạo phẩm bị lỗi một phần (lỗi liệt kê ghi chú thông minh, mục bản chép lời hoặc nội dung tài liệu), cảnh báo được giữ lại trong phần tóm tắt/tệp kê khai thay vì làm toàn bộ quá trình xuất thất bại. `--dry-run` truy xuất cùng dữ liệu và in JSON của tệp kê khai mà không tạo thư mục hoặc tệp ZIP.

Các agent sử dụng cùng các thao tác thông qua công cụ `google_meet` (`export`, `create` với `accessType`, `end_active_conference`, `test_listen`); xem [Công cụ](#tool).

### Kiểm thử nhanh trực tiếp

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Biến                                                                                                                  | Mục đích                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Bật các kiểm thử trực tiếp có biện pháp bảo vệ                                             |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | URL Meet, mã hoặc `spaces/{id}` được lưu giữ                              |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | Mã định danh ứng dụng OAuth                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Refresh token                                                          |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Tùy chọn; các tên dự phòng tương tự không có tiền tố `OPENCLAW_` cũng hoạt động |

Kiểm thử nhanh cơ sở cho tạo phẩm/người tham dự cần `meetings.space.readonly` và `meetings.conference.media.readonly`. Tra cứu Calendar cần `calendar.events.readonly`. Xuất nội dung tài liệu Drive cần `drive.meet.readonly`.

### Ví dụ tạo

```bash
openclaw googlemeet create
```

In URI cuộc họp mới, nguồn và phiên tham gia. Khi có OAuth, lệnh sử dụng Meet API; nếu không, lệnh sử dụng hồ sơ đã đăng nhập của node Chrome được ghim. JSON của phương án dự phòng bằng trình duyệt:

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

Nếu phương án dự phòng bằng trình duyệt gặp trang đăng nhập Google hoặc trình chặn quyền Meet trước tiên, `google_meet` trả về thông tin chi tiết có cấu trúc thay vì chuỗi thuần túy:

```json
{
  "source": "browser",
  "error": "google-login-required: Đăng nhập Google trong hồ sơ trình duyệt OpenClaw, sau đó thử tạo lại cuộc họp.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Đăng nhập Google trong hồ sơ trình duyệt OpenClaw, sau đó thử tạo lại cuộc họp.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Đăng nhập - Tài khoản Google"
  }
}
```

JSON tạo bằng API:

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

Theo mặc định, quá trình tạo sẽ tham gia cuộc họp, nhưng Chrome/Chrome-node vẫn cần một hồ sơ Google đã đăng nhập để tham gia qua trình duyệt; nếu đã đăng xuất, OpenClaw báo cáo `manualActionRequired: true` hoặc lỗi phương án dự phòng bằng trình duyệt và yêu cầu người vận hành hoàn tất đăng nhập Google trước khi thử lại.

Chỉ đặt `preview.enrollmentAcknowledged: true` sau khi xác nhận dự án Cloud, danh tính OAuth và người tham gia cuộc họp đã được đăng ký trong Google Workspace Developer Preview Program dành cho Meet media APIs.

## Cấu hình

Đường dẫn agent Chrome thông thường chỉ cần bật plugin, BlackHole, SoX, khóa nhà cung cấp thời gian thực và một nhà cung cấp TTS OpenClaw đã được cấu hình:

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

### Mặc định

| Khóa                               | Mặc định                                  | Ghi chú                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"` được chấp nhận làm bí danh cũ cho `"agent"`; các bên gọi mới nên dùng `"agent"`                                                                                                                        |
| `chromeNode.node`                 | chưa đặt                                    | ID/tên/IP của Node cho `chrome-node`; bắt buộc khi có thể có nhiều hơn một Node đủ khả năng được kết nối                                                                                                                      |
| `chrome.launch`                   | `true`                                   | Khởi chạy Chrome để tham gia; chỉ đặt `false` khi sử dụng lại một phiên đã mở                                                                                                                                 |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Hiển thị trên màn hình khách Meet khi chưa đăng nhập                                                                                                                                                                         |
| `chrome.autoJoin`                 | `true`                                   | Cố gắng điền tên khách và nhấp vào Join Now trên `chrome-node`                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | Kích hoạt một tab Meet hiện có thay vì mở các tab trùng lặp                                                                                                                                                      |
| `chrome.waitForInCallMs`          | `20000`                                  | Chờ tab Meet báo đang trong cuộc gọi trước khi phát phần giới thiệu phản hồi bằng giọng nói                                                                                                                                          |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Định dạng âm thanh của cặp lệnh; `"g711-ulaw-8khz"` chỉ dành cho các cặp lệnh cũ/tùy chỉnh phát âm thanh điện thoại                                                                                                   |
| `chrome.audioBufferBytes`         | `4096`                                   | Bộ đệm xử lý SoX cho các lệnh âm thanh cặp lệnh được tạo (bằng một nửa bộ đệm mặc định 8192 byte của SoX, giúp giảm độ trễ đường ống); các giá trị được giới hạn ở mức tối thiểu 17 byte                                         |
| `chrome.audioInputCommand`        | lệnh SoX được tạo                    | Đọc từ CoreAudio `BlackHole 2ch`, ghi âm thanh ở định dạng `chrome.audioFormat`                                                                                                                                        |
| `chrome.audioOutputCommand`       | lệnh SoX được tạo                    | Đọc âm thanh ở định dạng `chrome.audioFormat`, ghi vào CoreAudio `BlackHole 2ch`                                                                                                                                          |
| `chrome.bargeInInputCommand`      | chưa đặt                                    | Lệnh micrô cục bộ tùy chọn ghi PCM đơn âm 16 bit little-endian có dấu để phát hiện người dùng xen ngang trong khi trợ lý phát âm thanh; áp dụng cho cầu nối cặp lệnh do Gateway lưu trữ                          |
| `chrome.bargeInRmsThreshold`      | `650`                                    | Mức RMS được tính là sự ngắt lời của con người                                                                                                                                                                           |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Mức đỉnh được tính là sự ngắt lời của con người                                                                                                                                                                          |
| `chrome.bargeInCooldownMs`        | `900`                                    | Độ trễ tối thiểu giữa các lần xóa ngắt lời liên tiếp                                                                                                                                                                |
| `mode` (theo từng yêu cầu)              | `"agent"`                                | Chế độ phản hồi bằng giọng nói; xem bảng [Chế độ tác tử và hai chiều](#agent-and-bidi-modes)                                                                                                                                       |
| `realtime.provider`               | `"openai"`                               | Phương án dự phòng tương thích được dùng khi các trường có phạm vi bên dưới chưa được đặt                                                                                                                                                |
| `realtime.transcriptionProvider`  | `"openai"`                               | ID nhà cung cấp được chế độ `agent` sử dụng để phiên âm theo thời gian thực                                                                                                                                                       |
| `realtime.voiceProvider`          | chưa đặt                                    | ID nhà cung cấp được chế độ `bidi` sử dụng cho giọng nói trực tiếp theo thời gian thực; đặt thành `"google"` để dùng Gemini Live trong khi vẫn giữ phiên âm ở chế độ tác tử trên OpenAI. Kết hợp với `realtime.model` để chọn mô hình Gemini Live cụ thể. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Xem [Chế độ tác tử và hai chiều](#agent-and-bidi-modes)                                                                                                                                                                 |
| `realtime.instructions`           | hướng dẫn trả lời ngắn gọn bằng lời nói          | Yêu cầu mô hình nói ngắn gọn và dùng `openclaw_agent_consult` cho các câu trả lời chuyên sâu hơn                                                                                                                              |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Được nói một lần khi cầu nối thời gian thực kết nối; đặt thành `""` để tham gia trong im lặng                                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | ID tác tử OpenClaw được dùng cho `openclaw_agent_consult`                                                                                                                                                               |
| `voiceCall.enabled`               | `true`                                   | Ủy quyền cuộc gọi PSTN Twilio, DTMF và lời chào giới thiệu cho Plugin Voice Call                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Khoảng chờ ban đầu trước khi phát chuỗi DTMF bắt nguồn từ mã PIN qua Twilio                                                                                                                                               |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Độ trễ trước khi yêu cầu lời chào giới thiệu theo thời gian thực sau khi Voice Call bắt đầu chặng Twilio                                                                                                                        |

`chrome.audioBridgeCommand` và `chrome.audioBridgeHealthCommand` cho phép một cầu nối bên ngoài sở hữu toàn bộ đường dẫn âm thanh cục bộ thay cho `chrome.audioInputCommand`/`chrome.audioOutputCommand`; xem [Ghi chú](#notes) để biết giới hạn về chế độ có thể sử dụng chúng.

Có một quá trình di chuyển `openclaw doctor --fix` cho cấu trúc `realtime.provider: "google"` cũ: quá trình này chuyển ý định đó sang `realtime.voiceProvider: "google"` cùng với `realtime.transcriptionProvider: "openai"` khi các trường này chưa được đặt.

### Ghi đè tùy chọn

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
    model: "gemini-3.1-flash-live-preview",
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

ElevenLabs cho cả việc nghe và nói ở chế độ tác tử:

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

Giọng nói Meet cố định đến từ `messages.tts.providers.elevenlabs.speakerVoiceId`. Các câu trả lời của tác tử cũng có thể sử dụng chỉ thị `[[tts:speakerVoiceId=... model=eleven_v3]]` theo từng câu trả lời khi bật ghi đè mô hình TTS, nhưng cấu hình là giá trị mặc định xác định cho các cuộc họp. Khi tham gia, nhật ký hiển thị `transcriptionProvider=elevenlabs`, và mỗi câu trả lời được nói sẽ ghi nhật ký `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

Với `voiceCall.enabled: true` (mặc định) và phương thức truyền tải Twilio, Voice Call phát chuỗi DTMF trước khi mở luồng phương tiện theo thời gian thực, sau đó sử dụng văn bản giới thiệu đã lưu làm lời chào theo thời gian thực ban đầu. Nếu `voice-call` chưa được bật, Google Meet vẫn có thể xác thực và ghi lại kế hoạch quay số nhưng không thể thực hiện cuộc gọi Twilio.

Để trống `voiceCall.gatewayUrl` để sử dụng runtime Gateway đáng tin cậy cục bộ, qua đó duy trì
tác nhân gọi trong toàn bộ lệnh gọi. URL Gateway đã cấu hình vẫn là một đích WebSocket tường minh và
không thể xác thực nguồn gốc plugin; các yêu cầu tham gia bằng tác nhân không mặc định sẽ đóng khi có lỗi thay vì âm thầm
sử dụng tác nhân khác. Chạy Google Meet và Voice Call trong cùng một tiến trình Gateway khi cần
định tuyến theo từng tác nhân.

## Công cụ

Các tác nhân sử dụng công cụ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Mục đích                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | Tham gia một URL Meet tường minh                                                                         |
| `create`                | Tạo một không gian (và mặc định tham gia); hỗ trợ `accessType`/`entryPointAccess`                    |
| `status`                | Liệt kê các phiên đang hoạt động hoặc kiểm tra một phiên bằng `sessionId`                                               |
| `setup_status`          | Chạy các kiểm tra giống như `googlemeet setup`                                                         |
| `resolve_space`         | Phân giải URL/mã/`spaces/{id}` thông qua `spaces.get`                                                 |
| `preflight`             | Xác thực các điều kiện tiên quyết về OAuth và phân giải cuộc họp                                                 |
| `latest`                | Tìm bản ghi hội nghị mới nhất cho một cuộc họp                                                   |
| `calendar_events`       | Xem trước các sự kiện Calendar có liên kết Meet                                                           |
| `artifacts`             | Liệt kê các bản ghi hội nghị và siêu dữ liệu người tham gia/bản ghi âm/bản chép lời/ghi chú thông minh                  |
| `attendance`            | Liệt kê người tham gia và các phiên của người tham gia                                                        |
| `export`                | Ghi gói hiện vật/điểm danh/bản chép lời/manifest; đặt `"dryRun": true` để chỉ ghi manifest |
| `recover_current_tab`   | Tập trung/kiểm tra một thẻ Meet hiện có mà không mở thẻ mới                                      |
| `transcript`            | Đọc bản chép lời phụ đề có giới hạn; `sinceIndex` tiếp tục từ `nextIndex` trước đó           |
| `leave`                 | Kết thúc một phiên (Chrome nhấp nút rời cuộc gọi; chỉ đóng các thẻ do nó mở; Twilio ngắt cuộc gọi)                  |
| `end_active_conference` | Kết thúc hội nghị Google Meet đang hoạt động cho một không gian do API quản lý                                    |
| `speak`                 | Yêu cầu tác nhân thời gian thực nói ngay lập tức, với `sessionId` và `message`                        |
| `test_speech`           | Tạo/tái sử dụng một phiên, kích hoạt một cụm từ đã biết, trả về tình trạng Chrome                              |
| `test_listen`           | Tạo/tái sử dụng một phiên chỉ quan sát, chờ phụ đề/bản chép lời thay đổi                        |

`test_speech` luôn bắt buộc `mode: "agent"` hoặc `"bidi"` và sẽ thất bại nếu được yêu cầu chạy trong `mode: "transcribe"`, vì các phiên chỉ quan sát không thể phát lời nói. Kết quả `speechOutputVerified` của nó dựa trên việc số byte đầu ra âm thanh thời gian thực tăng trong lệnh gọi đó, vì vậy một phiên được tái sử dụng có âm thanh cũ không được tính là một lần kiểm tra mới.

Đối với các phương thức truyền tải Chrome, `leave` giữ thẻ do người dùng sở hữu được tái sử dụng ở trạng thái mở sau khi nhấp nút rời cuộc gọi của Meet. Các thẻ do OpenClaw mở sẽ được đóng sau khi rời đi.

Sử dụng `transport: "chrome"` khi Chrome chạy trên máy chủ Gateway, và `transport: "chrome-node"` khi Chrome chạy trên một node đã ghép đôi. Trong cả hai trường hợp, các nhà cung cấp mô hình và `openclaw_agent_consult` đều chạy trên máy chủ Gateway, vì vậy thông tin xác thực mô hình vẫn được giữ tại đó. Nhật ký chế độ tác nhân bao gồm nhà cung cấp/mô hình phiên âm đã phân giải khi cầu nối khởi động và nhà cung cấp/mô hình/giọng nói/định dạng đầu ra/tần số lấy mẫu TTS sau mỗi phản hồi được tổng hợp. `mode: "realtime"` thô vẫn được chấp nhận làm bí danh tương thích cũ cho `mode: "agent"`, nhưng không còn được quảng bá trong enum `mode` của công cụ.

`create` với phòng được API hỗ trợ và chính sách truy cập tường minh:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Kết thúc hội nghị đang hoạt động của một phòng đã biết:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Xác thực bằng cách nghe trước khi tuyên bố một cuộc họp là hữu ích:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Nói theo yêu cầu:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

`status` bao gồm tình trạng Chrome khi có sẵn:

| Trường                                                                 | Ý nghĩa                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome dường như đang ở trong cuộc gọi Meet                                                                              |
| `micMuted`                                                            | Trạng thái micrô Meet theo khả năng xác định tốt nhất                                                                                      |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Hồ sơ trình duyệt cần đăng nhập thủ công, được máy chủ Meet chấp nhận, cấp quyền hoặc sửa chức năng điều khiển trình duyệt trước khi lời nói có thể hoạt động |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Liệu lời nói Chrome được quản lý hiện có được phép hay không; `speechReady: false` có nghĩa là OpenClaw không gửi cụm từ giới thiệu/kiểm tra   |
| `providerConnected` / `realtimeReady`                                 | Trạng thái cầu nối giọng nói thời gian thực                                                                                            |
| `lastInputAt` / `lastOutputAt`                                        | Âm thanh gần nhất được nhận từ/gửi đến cầu nối                                                                                |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Liệu đầu ra phương tiện của thẻ Meet có được chủ động định tuyến đến thiết bị BlackHole của cầu nối hay không                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Đầu vào vòng lặp được bỏ qua trong khi âm thanh phát lại của trợ lý đang hoạt động                                                              |

## Chế độ tác nhân và bidi

| Chế độ    | Ai quyết định câu trả lời        | Đường dẫn đầu ra lời nói                     | Sử dụng khi                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Tác nhân OpenClaw đã cấu hình | Runtime TTS OpenClaw thông thường            | Bạn muốn hành vi "tác nhân của tôi đang ở trong cuộc họp"        |
| `bidi`  | Mô hình giọng nói thời gian thực      | Phản hồi âm thanh của nhà cung cấp giọng nói thời gian thực | Bạn muốn vòng lặp hội thoại bằng giọng nói có độ trễ thấp nhất |

Chế độ `agent`: nhà cung cấp phiên âm thời gian thực nghe âm thanh cuộc họp, các bản chép lời cuối cùng của người tham gia được định tuyến qua tác nhân OpenClaw đã cấu hình và câu trả lời được phát bằng TTS OpenClaw thông thường. Các mảnh bản chép lời cuối cùng gần nhau được hợp nhất trước khi tham vấn để một lượt nói không tạo ra nhiều câu trả lời từng phần đã lỗi thời; đầu vào thời gian thực bị chặn trong khi âm thanh trợ lý đang xếp hàng vẫn phát, và các tiếng vọng bản chép lời gần đây giống lời trợ lý được bỏ qua trước khi tham vấn để vòng lặp BlackHole không khiến tác nhân trả lời chính lời nói của mình.

Chế độ `bidi`: mô hình giọng nói thời gian thực trả lời trực tiếp và có thể gọi `openclaw_agent_consult` để suy luận sâu hơn, lấy thông tin hiện tại hoặc sử dụng các công cụ OpenClaw thông thường. Công cụ tham vấn chạy ngầm tác nhân OpenClaw thông thường với ngữ cảnh bản chép lời cuộc họp gần đây và trả về câu trả lời ngắn gọn để phát thành lời; ở chế độ `agent`, OpenClaw gửi câu trả lời đó trực tiếp đến TTS, còn ở chế độ `bidi`, mô hình giọng nói thời gian thực có thể phát lại câu trả lời đó. Công cụ này sử dụng cùng cơ chế tham vấn dùng chung như Voice Call.

Theo mặc định, các lượt tham vấn chạy với tác nhân `main`; đặt `realtime.agentId` để trỏ một luồng Meet đến không gian làm việc tác nhân chuyên dụng, các giá trị mặc định của mô hình, chính sách công cụ, bộ nhớ và lịch sử phiên. Các lượt tham vấn ở chế độ tác nhân sử dụng khóa phiên `agent:<id>:subagent:google-meet:<session>` riêng cho từng cuộc họp để các câu hỏi tiếp theo duy trì ngữ cảnh cuộc họp đồng thời kế thừa chính sách tác nhân thông thường. Khi một tác nhân gọi `google_meet` ở chế độ tác nhân, phiên chuyên gia tư vấn phân nhánh bản chép lời hiện tại của bên gọi trước khi trả lời lời nói của người tham gia; phiên Meet vẫn tách biệt để các câu hỏi tiếp theo trong cuộc họp không trực tiếp thay đổi bản chép lời của bên gọi.

`realtime.toolPolicy` kiểm soát lượt chạy tham vấn:

| Chính sách           | Hành vi                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Cung cấp công cụ tham vấn; giới hạn tác nhân thông thường ở `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Cung cấp công cụ tham vấn; cho phép tác nhân thông thường sử dụng chính sách công cụ thông thường của mình                                                        |
| `none`           | Không cung cấp công cụ tham vấn cho mô hình giọng nói thời gian thực                                                                       |

Khóa phiên tham vấn được giới hạn theo từng phiên Meet, vì vậy các lệnh gọi tham vấn tiếp theo sẽ tái sử dụng ngữ cảnh tham vấn trước đó trong cùng cuộc họp.

Buộc kiểm tra khả năng sẵn sàng bằng lời nói sau khi Chrome đã tham gia hoàn toàn:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Kiểm tra nhanh toàn bộ quy trình tham gia và nói:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Danh sách kiểm tra thử nghiệm trực tiếp

Trước khi giao một cuộc họp cho tác nhân hoạt động không giám sát:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Trạng thái Chrome-node dự kiến:

- `googlemeet setup` đều hiển thị xanh và bao gồm `chrome-node-connected` khi Chrome-node là phương thức truyền tải mặc định hoặc một node được ghim.
- `nodes status` hiển thị node đã chọn đang kết nối và quảng bá cả `googlemeet.chrome` lẫn `browser.proxy`.
- Thẻ Meet tham gia và `test-speech` trả về tình trạng Chrome với `inCall: true`.

Đối với máy chủ Chrome từ xa, chẳng hạn máy ảo macOS Parallels, quy trình kiểm tra an toàn ngắn nhất sau khi cập nhật Gateway hoặc máy ảo là:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Điều đó chứng minh plugin Gateway đã được tải, node máy ảo đã kết nối bằng token hiện tại và cầu nối âm thanh Meet khả dụng trước khi tác nhân mở một thẻ cuộc họp thực.

Để kiểm tra nhanh Twilio, hãy sử dụng một cuộc họp cung cấp thông tin gọi vào bằng điện thoại:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Trạng thái Twilio dự kiến:

- `googlemeet setup` bao gồm các kiểm tra `twilio-voice-call-plugin`, `twilio-voice-call-credentials` và `twilio-voice-call-webhook` màu xanh.
- `voicecall` khả dụng trong CLI sau khi tải lại Gateway.
- Phiên được trả về có `transport: "twilio"` và một `twilio.voiceCallId`.
- `openclaw logs --follow` cho thấy TwiML DTMF được phục vụ trước TwiML thời gian thực, sau đó là một cầu nối thời gian thực với lời chào ban đầu được đưa vào hàng đợi.
- `googlemeet leave <sessionId>` ngắt cuộc gọi thoại được ủy quyền.

## Khắc phục sự cố

### Tác nhân không thấy công cụ Google Meet

Xác nhận plugin đã được bật và tải lại Gateway; tác nhân đang chạy chỉ thấy các công cụ plugin được tiến trình Gateway hiện tại đăng ký:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Trên các máy chủ Gateway không phải macOS, `google_meet` vẫn hiển thị, nhưng các thao tác phản hồi bằng giọng nói của Chrome cục bộ bị chặn trước khi đến cầu nối âm thanh. Hãy dùng `mode: "transcribe"`, quay số vào bằng Twilio hoặc máy chủ `chrome-node` chạy macOS thay cho đường dẫn tác nhân Chrome cục bộ mặc định.

### Không có Node hỗ trợ Google Meet nào được kết nối

Trên máy chủ Node:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Trên máy chủ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node phải được kết nối và liệt kê `googlemeet.chrome` cùng `browser.proxy`; cấu hình Gateway phải cho phép cả hai:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Nếu `googlemeet setup` không vượt qua `chrome-node-connected`, hoặc nhật ký Gateway báo `gateway token mismatch`, hãy cài đặt lại hoặc khởi động lại Node bằng token Gateway hiện tại:

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

### Trình duyệt mở nhưng tác nhân không thể tham gia

Chạy `googlemeet test-listen` để tham gia ở chế độ chỉ quan sát hoặc `googlemeet test-speech` để tham gia theo thời gian thực, sau đó kiểm tra trạng thái Chrome được trả về. Nếu một trong hai báo `manualActionRequired: true`, hãy hiển thị `manualActionMessage` cho người vận hành và ngừng thử lại cho đến khi thao tác trên trình duyệt hoàn tất.

Các thao tác thủ công thường gặp: đăng nhập vào hồ sơ Chrome; cho phép khách tham gia từ tài khoản chủ trì Meet; cấp quyền dùng micrô/camera cho Chrome khi lời nhắc gốc xuất hiện; đóng hoặc xử lý hộp thoại quyền Meet bị kẹt.

Không báo cáo "chưa đăng nhập" chỉ vì Meet hỏi "Do you want people to hear you in the meeting?"; đó là màn hình chuyển tiếp để chọn âm thanh của Meet. OpenClaw nhấp vào **Use microphone** thông qua tự động hóa trình duyệt khi có thể và tiếp tục chờ trạng thái cuộc họp thực sự; đối với phương án dự phòng bằng trình duyệt chỉ để tạo cuộc họp, hệ thống có thể nhấp vào **Continue without microphone**, vì việc tạo URL không cần đường dẫn âm thanh thời gian thực.

### Không thể tạo cuộc họp

`googlemeet create` sử dụng API Meet `spaces.create` khi OAuth được cấu hình, nếu không sẽ dùng trình duyệt Chrome trên Node được ghim. Hãy xác nhận:

- **Tạo qua API**: có `oauth.clientId` và `oauth.refreshToken` (hoặc các biến môi trường `OPENCLAW_GOOGLE_MEET_*` tương ứng), đồng thời refresh token được tạo sau khi tính năng hỗ trợ tạo cuộc họp được bổ sung; các token cũ hơn có thể thiếu `meetings.space.created`, vì vậy hãy chạy lại `openclaw googlemeet auth login --json`.
- **Phương án dự phòng bằng trình duyệt**: `defaultTransport: "chrome-node"` và `chromeNode.node` trỏ đến một Node đã kết nối có `browser.proxy` và `googlemeet.chrome`; hồ sơ Chrome của OpenClaw trên Node đó đã đăng nhập và có thể mở `https://meet.google.com/new`.
- **Thử lại phương án dự phòng bằng trình duyệt**: tái sử dụng tab `.../new` hiện có hoặc tab lời nhắc tài khoản Google trước khi mở tab mới; hãy thử lại lệnh gọi công cụ thay vì tự mở thêm một tab.
- **Thao tác thủ công**: nếu công cụ trả về `manualActionRequired: true`, hãy dùng `browser.nodeId`, `browser.targetId`, `browserUrl` và `manualActionMessage` để hướng dẫn người vận hành; không thử lại liên tục.
- **Màn hình chuyển tiếp để chọn âm thanh**: nếu Meet hiển thị "Do you want people to hear you in the meeting?", hãy để tab mở. OpenClaw sẽ nhấp vào **Use microphone** hoặc (chỉ khi tạo cuộc họp) **Continue without microphone** và tiếp tục chờ URL được tạo; nếu không thể thực hiện, lỗi phải đề cập đến `meet-audio-choice-required`, không phải `google-login-required`.

### Tác nhân tham gia nhưng không nói

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dùng `mode: "agent"` cho đường dẫn STT -> tác nhân OpenClaw -> TTS, và `mode: "bidi"` cho phương án thoại thời gian thực dự phòng trực tiếp. `mode: "transcribe"` chủ ý không khởi động cầu nối phản hồi bằng giọng nói. Để gỡ lỗi ở chế độ chỉ quan sát, hãy chạy `openclaw googlemeet status --json <session-id>` sau khi người tham gia nói và kiểm tra `captioning`, `transcriptLines`, `lastCaptionText`. Nếu `inCall` là true nhưng `transcriptLines` vẫn là `0`, phụ đề Meet có thể bị tắt, chưa có ai nói kể từ khi trình quan sát được cài đặt, giao diện Meet đã thay đổi hoặc phụ đề trực tiếp không khả dụng cho ngôn ngữ/tài khoản của cuộc họp.

`googlemeet test-speech` luôn kiểm tra đường dẫn thời gian thực và báo cáo liệu có quan sát được byte đầu ra của cầu nối trong lần gọi đó hay không. Nếu `speechOutputVerified` là false và `speechOutputTimedOut` là true, nhà cung cấp thời gian thực có thể đã chấp nhận lời nói nhưng OpenClaw không thấy byte đầu ra mới đến cầu nối âm thanh Chrome.

Ngoài ra, hãy xác minh: khóa của nhà cung cấp thời gian thực (`OPENAI_API_KEY` hoặc `GEMINI_API_KEY`) khả dụng trên máy chủ Gateway; `BlackHole 2ch` hiển thị trên máy chủ Chrome; `sox` tồn tại ở đó; micrô/loa Meet được định tuyến qua đường dẫn âm thanh ảo (`doctor` phải hiển thị `meet output routed: yes` đối với các phiên tham gia thời gian thực bằng Chrome cục bộ).

`googlemeet doctor [session-id]` in ra phiên, Node, trạng thái trong cuộc gọi, lý do cần thao tác thủ công, kết nối nhà cung cấp thời gian thực, `realtimeReady`, hoạt động đầu vào/đầu ra âm thanh, dấu thời gian âm thanh gần nhất, bộ đếm byte và URL trình duyệt. Dùng `googlemeet status [session-id] --json` để lấy JSON thô và `googlemeet doctor --oauth` (thêm `--meeting` hoặc `--create-space`) để xác minh việc làm mới OAuth mà không làm lộ token.

Nếu tác nhân hết thời gian chờ và một tab Meet đã mở, hãy kiểm tra tab đó mà không mở thêm tab khác:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Thao tác công cụ tương đương là `recover_current_tab`: thao tác này đưa một tab Meet hiện có ra trước và kiểm tra tab đó cho phương thức truyền tải đã chọn (điều khiển trình duyệt cục bộ đối với `chrome`, Node đã cấu hình đối với `chrome-node`) mà không mở tab hoặc phiên mới, đồng thời báo cáo trở ngại hiện tại (đăng nhập, phê duyệt tham gia, quyền, trạng thái chọn âm thanh). Lệnh CLI giao tiếp với Gateway đã cấu hình, Gateway này phải đang chạy; `chrome-node` cũng yêu cầu Node được kết nối.

### Kiểm tra thiết lập Twilio không thành công

`twilio-voice-call-plugin` không thành công khi `voice-call` không được cho phép hoặc chưa được bật: thêm nó vào `plugins.allow`, bật `plugins.entries.voice-call`, rồi tải lại Gateway.

`twilio-voice-call-credentials` không thành công khi phần phụ trợ Twilio thiếu SID tài khoản, token xác thực hoặc số gọi đi:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` không thành công khi `voice-call` không có Webhook công khai, hoặc `publicUrl` trỏ đến không gian mạng loopback/nội bộ. Không dùng `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` hoặc `fd00::/8` làm `publicUrl`; callback của nhà mạng không thể truy cập các địa chỉ đó. Đặt `plugins.entries.voice-call.config.publicUrl` thành một URL công khai hoặc cấu hình tunnel/Tailscale:

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

Để phát triển cục bộ, hãy dùng tunnel hoặc Tailscale thay cho URL máy chủ nội bộ:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // hoặc
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Khởi động lại hoặc tải lại Gateway, sau đó chạy:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

Theo mặc định, `voicecall smoke` chỉ kiểm tra trạng thái sẵn sàng. Chạy thử với một số cụ thể:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Chỉ thêm `--yes` khi chủ ý thực hiện một cuộc gọi đi thực tế:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Cuộc gọi Twilio bắt đầu nhưng không bao giờ vào cuộc họp

Xác nhận sự kiện Meet cung cấp thông tin quay số vào và truyền chính xác số quay vào cùng mã PIN hoặc một chuỗi DTMF tùy chỉnh:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Dùng `w` ở đầu hoặc dấu phẩy trong `--dtmf-sequence` để tạm dừng trước mã PIN.

Nếu cuộc gọi đã được tạo nhưng danh sách người tham gia Meet không bao giờ hiển thị người tham gia quay số vào:

- `openclaw googlemeet doctor <session-id>`: xác nhận ID cuộc gọi Twilio được ủy quyền, DTMF đã được đưa vào hàng đợi hay chưa và lời chào mở đầu có được yêu cầu hay không.
- `openclaw voicecall status --call-id <id>`: xác nhận cuộc gọi vẫn đang hoạt động.
- `openclaw voicecall tail`: xác nhận các Webhook Twilio đang đến Gateway.
- `openclaw logs --follow`: tìm chuỗi xử lý Twilio Meet: Google Meet ủy quyền việc tham gia, Voice Call lưu trữ và phục vụ TwiML DTMF trước khi kết nối, Voice Call phục vụ TwiML thời gian thực cho cuộc gọi Twilio, sau đó Google Meet yêu cầu phát lời mở đầu bằng `voicecall.speak`.
- Chạy lại `openclaw googlemeet setup --transport twilio`; kiểm tra thiết lập màu xanh là bắt buộc nhưng không chứng minh chuỗi PIN cuộc họp là chính xác.
- Xác nhận số quay vào thuộc cùng lời mời Meet và cùng khu vực với mã PIN.
- Tăng `voiceCall.dtmfDelayMs` từ giá trị mặc định 12 giây nếu Meet trả lời chậm hoặc bản chép lời cuộc gọi vẫn hiển thị lời nhắc nhập PIN sau khi DTMF trước kết nối đã được gửi.
- Nếu người tham gia đã vào nhưng bạn không nghe thấy lời chào, hãy kiểm tra `openclaw logs --follow` để tìm yêu cầu `voicecall.speak` sau DTMF và việc phát TTS qua luồng phương tiện hoặc phương án dự phòng `<Say>` của Twilio. Nếu bản chép lời vẫn hiển thị "enter the meeting PIN", nhánh điện thoại chưa tham gia phòng Meet, vì vậy người tham gia sẽ không nghe thấy lời nói.

Nếu Webhook không đến, trước tiên hãy gỡ lỗi Plugin Voice Call: nhà cung cấp phải truy cập được `plugins.entries.voice-call.config.publicUrl` hoặc tunnel đã cấu hình. Xem [Khắc phục sự cố cuộc gọi thoại](/vi/plugins/voice-call#troubleshooting).

## Ghi chú

API phương tiện chính thức của Google Meet chủ yếu dành cho việc nhận, vì vậy để nói trong cuộc gọi vẫn cần một đường dẫn người tham gia. Plugin này giữ ranh giới đó rõ ràng: Chrome xử lý việc tham gia qua trình duyệt và định tuyến âm thanh cục bộ; Twilio xử lý việc tham gia bằng cách quay số điện thoại vào.

Các chế độ phản hồi bằng giọng nói của Chrome cần `BlackHole 2ch` cùng một trong các thành phần sau:

- `chrome.audioInputCommand` cộng với `chrome.audioOutputCommand`: OpenClaw sở hữu cầu nối và truyền âm thanh trong `chrome.audioFormat` giữa các lệnh đó và nhà cung cấp đã chọn. Chế độ `agent` sử dụng phiên âm theo thời gian thực cùng TTS thông thường; chế độ `bidi` sử dụng nhà cung cấp giọng nói theo thời gian thực. Đường dẫn mặc định là PCM16 24 kHz với `chrome.audioBufferBytes: 4096`; G.711 mu-law 8 kHz vẫn khả dụng cho các cặp lệnh cũ.
- `chrome.audioBridgeCommand`: một lệnh cầu nối bên ngoài sở hữu toàn bộ đường dẫn âm thanh cục bộ và phải thoát sau khi khởi động hoặc xác thực daemon của nó. Chỉ hợp lệ với `bidi`, vì chế độ `agent` cần truy cập trực tiếp vào cặp lệnh cho TTS.

Với cầu nối Chrome dùng cặp lệnh, `chrome.bargeInInputCommand` có thể nghe một micrô cục bộ riêng biệt và xóa nội dung phát lại của trợ lý khi con người bắt đầu nói, giúp lời nói của con người được ưu tiên hơn đầu ra của trợ lý ngay cả khi đầu vào loopback BlackHole dùng chung tạm thời bị tắt trong lúc trợ lý phát âm thanh. Giống như `chrome.audioInputCommand`/`chrome.audioOutputCommand`, đây là một lệnh cục bộ do người vận hành cấu hình: hãy sử dụng đường dẫn lệnh tin cậy rõ ràng hoặc danh sách đối số, tuyệt đối không dùng tập lệnh từ vị trí không đáng tin cậy.

Để có âm thanh song công rõ ràng, hãy định tuyến đầu ra Meet và micrô Meet qua các thiết bị ảo riêng biệt hoặc một đồ thị thiết bị ảo kiểu Loopback; một thiết bị BlackHole dùng chung duy nhất có thể dội âm thanh của những người tham gia khác trở lại cuộc gọi.

`googlemeet speak` kích hoạt cầu nối âm thanh đàm thoại hai chiều đang hoạt động cho một phiên Chrome; `googlemeet leave` dừng cầu nối đó (và đối với các phiên Twilio được ủy quyền qua Voice Call, ngắt cuộc gọi nền). Sử dụng `googlemeet end-active-conference` để đồng thời đóng hội nghị Google Meet đang hoạt động cho một không gian do API quản lý.

## Liên quan

- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
- [Chế độ trò chuyện](/vi/nodes/talk)
- [Xây dựng plugin](/vi/plugins/building-plugins)
