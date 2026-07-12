---
read_when:
    - Chạy Gateway OpenClaw trong WSL2 trong khi Chrome nằm trên Windows
    - Gặp các lỗi trình duyệt/giao diện điều khiển trùng lặp trên WSL2 và Windows
    - Lựa chọn giữa Chrome MCP cục bộ trên máy chủ và CDP từ xa trực tiếp trong thiết lập tách máy chủ
summary: Khắc phục sự cố Gateway trên WSL2 và CDP từ xa của Chrome trên Windows theo từng lớp
title: Khắc phục sự cố WSL2 + Windows + Chrome CDP từ xa
x-i18n:
    generated_at: "2026-07-12T08:29:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Trong thiết lập tách máy chủ phổ biến, OpenClaw Gateway chạy bên trong WSL2, Chrome chạy
trên Windows và chức năng điều khiển trình duyệt phải vượt qua ranh giới WSL2/Windows. Nhiều
vấn đề độc lập có thể xuất hiện cùng lúc (xem
[issue #39369](https://github.com/openclaw/openclaw/issues/39369)): kết nối truyền tải
CDP, bảo mật nguồn gốc của giao diện điều khiển và token/ghép cặp đều có thể tự
phát sinh lỗi nhưng tạo ra các thông báo lỗi trông tương tự nhau. Hãy xử lý lần lượt
các lớp bên dưới thay vì đoán lớp nào bị lỗi.

## Trước tiên, hãy chọn đúng chế độ trình duyệt

### Tùy chọn 1: CDP từ xa trực tiếp từ WSL2 đến Windows

Sử dụng một hồ sơ trình duyệt từ xa trỏ từ WSL2 đến điểm cuối CDP của Chrome
trên Windows. Chọn tùy chọn này khi Gateway vẫn chạy bên trong WSL2, Chrome chạy trên
Windows và chức năng điều khiển trình duyệt cần vượt qua ranh giới WSL2/Windows.

### Tùy chọn 2: Chrome MCP cục bộ trên máy chủ

Chỉ sử dụng trình điều khiển `existing-session` (hồ sơ `user`) khi Gateway chạy
trên cùng máy chủ với Chrome, bạn muốn sử dụng trạng thái đăng nhập của trình duyệt cục bộ, bạn
không cần kết nối truyền tải trình duyệt giữa các máy chủ và không cần `responsebody`,
xuất PDF, chặn lượt tải xuống hoặc thao tác hàng loạt (các hồ sơ Chrome MCP không
hỗ trợ những chức năng này).

Đối với Gateway trên WSL2 + Chrome trên Windows, hãy sử dụng CDP từ xa trực tiếp. Chrome MCP
chỉ hoạt động cục bộ trên máy chủ, không phải cầu nối từ WSL2 đến Windows.

## Kiến trúc hoạt động

- WSL2 chạy Gateway tại `127.0.0.1:18789`
- Windows mở giao diện điều khiển trong trình duyệt thông thường tại `http://127.0.0.1:18789/`
- Chrome trên Windows cung cấp điểm cuối CDP tại cổng `9222`
- WSL2 có thể truy cập điểm cuối CDP trên Windows đó
- OpenClaw trỏ một hồ sơ trình duyệt đến địa chỉ có thể truy cập từ WSL2

## Quy tắc quan trọng đối với giao diện điều khiển

Khi mở giao diện người dùng từ Windows, hãy sử dụng localhost của Windows, trừ khi bạn có một
thiết lập HTTPS có chủ đích:

```text
http://127.0.0.1:18789/
```

Không mặc định sử dụng IP mạng LAN. HTTP thuần túy trên địa chỉ mạng LAN hoặc tailnet có thể
kích hoạt hành vi nguồn gốc không an toàn/xác thực thiết bị không liên quan đến bản thân CDP. Xem
[Giao diện điều khiển](/vi/web/control-ui).

## Xác thực theo từng lớp

Thực hiện từ trên xuống dưới; không bỏ qua lớp nào. Việc sửa một lớp vẫn có thể để lộ
một lỗi khác từ lớp bên dưới.

### Lớp 1: xác minh Chrome đang cung cấp CDP trên Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 trở lên bỏ qua các tùy chọn dòng lệnh gỡ lỗi từ xa đối với
thư mục dữ liệu Chrome mặc định. Hãy sử dụng một thư mục dữ liệu riêng, không phải mặc định như
minh họa ở trên. Xem
[thay đổi bảo mật về gỡ lỗi từ xa](https://developer.chrome.com/blog/remote-debugging-port)
của Chrome. Điều này không khiến hồ sơ Chrome thông thường đã đăng nhập có thể được điều khiển từ xa.

Trước tiên, từ Windows hãy xác minh chính Chrome:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Nếu thao tác này thất bại, hãy chẩn đoán các trình lắng nghe Windows bên dưới. OpenClaw chưa phải là
vấn đề ở bước này.

#### Chẩn đoán IPv4 và IPv6 trước khi thay đổi portproxy

Chromium cố gắng liên kết gỡ lỗi từ xa với `127.0.0.1` trước và chỉ chuyển sang
`[::1]` nếu việc liên kết IPv4 thất bại. Một quy tắc `v4tov4` cố định đang lắng nghe trên
`127.0.0.1:9222` có thể chiếm điểm cuối đó trước khi Chrome khởi động. Sau đó, Chrome
chuyển sang `[::1]:9222`, trong khi quy tắc cũ chuyển tiếp lưu lượng IPv4 ngược lại
chính trình lắng nghe của nó và trả về phản hồi trống.

Hãy kiểm tra các trình lắng nghe và quy tắc proxy thực tế từ Windows thay vì suy luận
chúng từ phiên bản Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Sử dụng `tasklist /fi "PID eq <PID>"` cho từng PID từ `netstat`.

- Nếu `chrome.exe` phản hồi trên `127.0.0.1`, hãy xóa mọi quy tắc portproxy cũng
  lắng nghe trên `127.0.0.1:9222`. Chỉ chuyển tiếp địa chỉ bộ điều hợp Windows mà WSL2
  có thể truy cập đến `127.0.0.1`.
- Nếu `chrome.exe` chỉ phản hồi trên `[::1]`, hãy trỏ trình lắng nghe mà WSL2 có thể truy cập đến
  `::1` bằng `v4tov6` thay vì chuyển tiếp đến một địa chỉ IPv4 không được sử dụng:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Hãy liên kết trình lắng nghe với địa chỉ bộ điều hợp mà WSL2 cần. Không cung cấp cổng CDP
trên `0.0.0.0`, địa chỉ mạng LAN hoặc địa chỉ tailnet: CDP cấp quyền điều khiển
phiên trình duyệt.

### Lớp 2: xác minh WSL2 có thể truy cập điểm cuối Windows đó

Từ WSL2, hãy kiểm tra chính xác địa chỉ bạn dự định sử dụng trong `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Kết quả hợp lệ:

- `/json/version` trả về JSON chứa siêu dữ liệu Browser / Protocol-Version
- `/json/list` trả về JSON (mảng trống cũng hợp lệ nếu không có trang nào đang mở)

Nếu thao tác này thất bại, Windows chưa cung cấp cổng cho WSL2, địa chỉ không
đúng từ phía WSL2 hoặc còn thiếu tường lửa/chuyển tiếp cổng/proxy. Hãy khắc phục
vấn đề đó trước khi thay đổi cấu hình OpenClaw.

### Lớp 3: cấu hình đúng hồ sơ trình duyệt

Trỏ OpenClaw đến địa chỉ có thể truy cập từ WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Lưu ý:

- sử dụng địa chỉ có thể truy cập từ WSL2, không phải địa chỉ chỉ hoạt động trên Windows
- giữ `attachOnly: true` cho các trình duyệt được quản lý bên ngoài
- `cdpUrl` có thể là `http://`, `https://`, `ws://` hoặc `wss://`
- sử dụng HTTP(S) khi bạn muốn OpenClaw khám phá `/json/version`
- chỉ sử dụng WS(S) khi nhà cung cấp trình duyệt cung cấp cho bạn URL socket DevTools
  trực tiếp
- kiểm tra cùng URL bằng `curl` trước khi kỳ vọng OpenClaw hoạt động thành công

### Lớp 4: xác minh riêng lớp giao diện điều khiển

Mở `http://127.0.0.1:18789/` từ Windows, sau đó xác minh:

- nguồn gốc của trang khớp với giá trị mà `gateway.controlUi.allowedOrigins` yêu cầu
- xác thực bằng token hoặc ghép cặp được cấu hình đúng
- bạn không chẩn đoán vấn đề xác thực của giao diện điều khiển như thể đó là vấn đề
  của trình duyệt

Trang hữu ích: [Giao diện điều khiển](/vi/web/control-ui).

### Lớp 5: xác minh chức năng điều khiển trình duyệt đầu cuối

Từ WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Kết quả hợp lệ:

- thẻ được mở trong Chrome trên Windows
- `browser tabs` trả về mục tiêu
- các thao tác tiếp theo (`snapshot`, `screenshot`, `navigate`) hoạt động từ cùng
  hồ sơ

## Các lỗi thường gây hiểu nhầm

| Thông báo                                                                               | Ý nghĩa                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `control-ui-insecure-auth`                                                              | vấn đề về nguồn gốc giao diện người dùng/ngữ cảnh bảo mật, không phải vấn đề kết nối truyền tải CDP                                                                                         |
| `token_missing`                                                                         | vấn đề về cấu hình xác thực                                                                                                                                                                |
| `pairing required`                                                                      | vấn đề về phê duyệt thiết bị                                                                                                                                                               |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 không thể truy cập `cdpUrl` đã cấu hình                                                                                                                                               |
| phản hồi CDP trống / `other side closed` qua portproxy                                   | trình lắng nghe Windows không khớp hoặc có vòng lặp tự trỏ; kiểm tra cả hai họ địa chỉ loopback và `netsh interface portproxy show all`                                                     |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | điểm cuối HTTP đã phản hồi nhưng không thể mở WebSocket DevTools                                                                                                                           |
| các giá trị ghi đè cũ về khung nhìn/chế độ tối/ngôn ngữ/ngoại tuyến sau một phiên từ xa | chạy `openclaw browser --browser-profile remote stop` để đóng phiên và giải phóng kết nối Playwright/CDP được lưu đệm mà không cần khởi động lại Gateway hoặc trình duyệt bên ngoài          |
| hết thời gian chờ quanh `remoteCdpTimeoutMs` (mặc định 1500ms)                           | thường vẫn là vấn đề khả năng truy cập CDP hoặc điểm cuối từ xa chậm/không thể truy cập                                                                                                    |
| `Playwright page enumeration timed out after 3000ms`                                    | CDP từ xa đã kết nối nhưng thao tác đọc thẻ cố định bị đình trệ; thời hạn là giá trị lớn hơn giữa `remoteCdpTimeoutMs` và `remoteCdpHandshakeTimeoutMs`                                      |
| `No Chrome tabs found for profile="user"`                                               | hồ sơ Chrome MCP cục bộ được chọn tại nơi không có thẻ cục bộ trên máy chủ                                                                                                                |

## Danh sách kiểm tra phân loại nhanh

1. Windows: địa chỉ nào trong `127.0.0.1` hoặc `[::1]` phản hồi trên `/json/version`, và
   trình lắng nghe đó có thuộc về `chrome.exe` không?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` có hoạt động không?
3. Cấu hình OpenClaw: `browser.profiles.<name>.cdpUrl` có sử dụng chính xác
   địa chỉ mà WSL2 có thể truy cập đó không?
4. Giao diện điều khiển: bạn có đang mở `http://127.0.0.1:18789/` thay vì IP mạng LAN không?
5. Bạn có đang cố sử dụng `existing-session` giữa WSL2 và Windows thay vì
   CDP từ xa trực tiếp không?

Trước tiên, hãy xác minh cục bộ điểm cuối Chrome trên Windows, sau đó xác minh cùng điểm cuối
từ WSL2 và chỉ sau đó mới chẩn đoán cấu hình OpenClaw hoặc xác thực giao diện điều khiển.

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Đăng nhập trình duyệt](/vi/tools/browser-login)
- [Khắc phục sự cố trình duyệt trên Linux](/vi/tools/browser-linux-troubleshooting)
