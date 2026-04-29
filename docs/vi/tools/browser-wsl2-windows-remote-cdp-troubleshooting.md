---
read_when:
    - Chạy OpenClaw Gateway trong WSL2 trong khi Chrome chạy trên Windows
    - Gặp các lỗi trình duyệt/control-ui chồng chéo trên WSL2 và Windows
    - Quyết định giữa Chrome MCP cục bộ trên máy chủ và CDP từ xa trực tiếp trong các thiết lập tách máy chủ
summary: Khắc phục sự cố WSL2 Gateway + CDP từ xa của Chrome trên Windows theo từng lớp
title: Khắc phục sự cố WSL2 + Windows + Chrome CDP từ xa
x-i18n:
    generated_at: "2026-04-29T23:16:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Trong thiết lập tách máy chủ phổ biến, OpenClaw Gateway chạy bên trong WSL2, Chrome chạy trên Windows, và việc điều khiển trình duyệt phải đi qua ranh giới giữa WSL2 và Windows. Mẫu lỗi nhiều lớp từ [vấn đề #39369](https://github.com/openclaw/openclaw/issues/39369) nghĩa là nhiều sự cố độc lập có thể xuất hiện cùng lúc, khiến lớp sai trông như bị hỏng trước tiên.

## Chọn đúng chế độ trình duyệt trước

Bạn có hai mẫu hợp lệ:

### Tùy chọn 1: CDP từ xa thô từ WSL2 đến Windows

Dùng hồ sơ trình duyệt từ xa trỏ từ WSL2 đến một điểm cuối Chrome CDP trên Windows.

Chọn cách này khi:

- Gateway vẫn ở bên trong WSL2
- Chrome chạy trên Windows
- bạn cần điều khiển trình duyệt đi qua ranh giới WSL2/Windows

### Tùy chọn 2: Chrome MCP cục bộ trên máy chủ

Chỉ dùng `existing-session` / `user` khi chính Gateway chạy trên cùng máy chủ với Chrome.

Chọn cách này khi:

- OpenClaw và Chrome ở trên cùng một máy
- bạn muốn trạng thái trình duyệt cục bộ đã đăng nhập
- bạn không cần truyền tải trình duyệt xuyên máy chủ
- bạn không cần các tuyến nâng cao chỉ dành cho quản lý/CDP thô như `responsebody`, xuất
  PDF, chặn tải xuống, hoặc hành động hàng loạt

Với WSL2 Gateway + Windows Chrome, ưu tiên CDP từ xa thô. Chrome MCP là cục bộ trên máy chủ, không phải cầu nối từ WSL2 sang Windows.

## Kiến trúc hoạt động

Hình dạng tham chiếu:

- WSL2 chạy Gateway trên `127.0.0.1:18789`
- Windows mở Giao diện Điều khiển trong trình duyệt thông thường tại `http://127.0.0.1:18789/`
- Windows Chrome phơi bày một điểm cuối CDP trên cổng `9222`
- WSL2 có thể truy cập điểm cuối Windows CDP đó
- OpenClaw trỏ một hồ sơ trình duyệt đến địa chỉ có thể truy cập từ WSL2

## Vì sao thiết lập này dễ gây nhầm lẫn

Nhiều lỗi có thể chồng lên nhau:

- WSL2 không thể truy cập điểm cuối Windows CDP
- Giao diện Điều khiển được mở từ một nguồn gốc không an toàn
- `gateway.controlUi.allowedOrigins` không khớp với nguồn gốc của trang
- thiếu token hoặc ghép đôi
- hồ sơ trình duyệt trỏ đến sai địa chỉ

Vì vậy, sửa một lớp vẫn có thể để lại một lỗi khác hiển thị.

## Quy tắc quan trọng cho Giao diện Điều khiển

Khi UI được mở từ Windows, dùng localhost của Windows trừ khi bạn có thiết lập HTTPS có chủ đích.

Dùng:

`http://127.0.0.1:18789/`

Đừng mặc định dùng IP LAN cho Giao diện Điều khiển. HTTP thuần trên địa chỉ LAN hoặc tailnet có thể kích hoạt hành vi nguồn gốc không an toàn/xác thực thiết bị không liên quan đến chính CDP. Xem [Giao diện Điều khiển](/vi/web/control-ui).

## Xác thực theo từng lớp

Làm từ trên xuống dưới. Đừng nhảy bước.

### Lớp 1: Xác minh Chrome đang phục vụ CDP trên Windows

Khởi động Chrome trên Windows với gỡ lỗi từ xa được bật:

```powershell
chrome.exe --remote-debugging-port=9222
```

Từ Windows, xác minh chính Chrome trước:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Nếu bước này lỗi trên Windows, OpenClaw chưa phải vấn đề.

### Lớp 2: Xác minh WSL2 có thể truy cập điểm cuối Windows đó

Từ WSL2, kiểm tra đúng địa chỉ bạn định dùng trong `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Kết quả tốt:

- `/json/version` trả về JSON có siêu dữ liệu Browser / Protocol-Version
- `/json/list` trả về JSON (mảng rỗng cũng được nếu không có trang nào đang mở)

Nếu bước này lỗi:

- Windows chưa phơi bày cổng cho WSL2
- địa chỉ sai ở phía WSL2
- tường lửa / chuyển tiếp cổng / proxy cục bộ vẫn còn thiếu

Sửa việc đó trước khi chạm vào cấu hình OpenClaw.

### Lớp 3: Cấu hình đúng hồ sơ trình duyệt

Với CDP từ xa thô, trỏ OpenClaw đến địa chỉ có thể truy cập từ WSL2:

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

Ghi chú:

- dùng địa chỉ có thể truy cập từ WSL2, không phải địa chỉ chỉ hoạt động trên Windows
- giữ `attachOnly: true` cho các trình duyệt được quản lý bên ngoài
- `cdpUrl` có thể là `http://`, `https://`, `ws://`, hoặc `wss://`
- dùng HTTP(S) khi bạn muốn OpenClaw khám phá `/json/version`
- chỉ dùng WS(S) khi nhà cung cấp trình duyệt cung cấp cho bạn URL socket DevTools trực tiếp
- kiểm tra cùng URL đó bằng `curl` trước khi kỳ vọng OpenClaw thành công

### Lớp 4: Xác minh riêng lớp Giao diện Điều khiển

Mở UI từ Windows:

`http://127.0.0.1:18789/`

Sau đó xác minh:

- nguồn gốc trang khớp với điều mà `gateway.controlUi.allowedOrigins` mong đợi
- xác thực token hoặc ghép đôi được cấu hình đúng
- bạn không đang gỡ lỗi một vấn đề xác thực Giao diện Điều khiển như thể đó là vấn đề trình duyệt

Trang hữu ích:

- [Giao diện Điều khiển](/vi/web/control-ui)

### Lớp 5: Xác minh điều khiển trình duyệt đầu-cuối

Từ WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Kết quả tốt:

- tab mở trong Windows Chrome
- `openclaw browser tabs` trả về đích
- các hành động sau đó (`snapshot`, `screenshot`, `navigate`) hoạt động từ cùng hồ sơ

## Các lỗi dễ gây hiểu nhầm thường gặp

Xem mỗi thông báo như một manh mối theo lớp cụ thể:

- `control-ui-insecure-auth`
  - vấn đề nguồn gốc UI / ngữ cảnh an toàn, không phải vấn đề truyền tải CDP
- `token_missing`
  - vấn đề cấu hình xác thực
- `pairing required`
  - vấn đề phê duyệt thiết bị
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 không thể truy cập `cdpUrl` đã cấu hình
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - điểm cuối HTTP đã phản hồi, nhưng DevTools WebSocket vẫn không thể được mở
- ghi đè khung nhìn / chế độ tối / ngôn ngữ / ngoại tuyến cũ sau một phiên từ xa
  - chạy `openclaw browser stop --browser-profile remote`
  - thao tác này đóng phiên điều khiển đang hoạt động và giải phóng trạng thái mô phỏng Playwright/CDP mà không khởi động lại gateway hoặc trình duyệt bên ngoài
- `gateway timeout after 1500ms`
  - thường vẫn là khả năng truy cập CDP hoặc điểm cuối từ xa chậm/không truy cập được
- `No Chrome tabs found for profile="user"`
  - hồ sơ Chrome MCP cục bộ được chọn khi không có tab cục bộ trên máy chủ nào khả dụng

## Danh sách kiểm tra phân loại nhanh

1. Windows: `curl http://127.0.0.1:9222/json/version` có hoạt động không?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` có hoạt động không?
3. Cấu hình OpenClaw: `browser.profiles.<name>.cdpUrl` có dùng đúng địa chỉ có thể truy cập từ WSL2 đó không?
4. Giao diện Điều khiển: bạn có đang mở `http://127.0.0.1:18789/` thay vì IP LAN không?
5. Bạn có đang cố dùng `existing-session` xuyên WSL2 và Windows thay vì CDP từ xa thô không?

## Kết luận thực tế

Thiết lập này thường khả thi. Phần khó là truyền tải trình duyệt, bảo mật nguồn gốc Giao diện Điều khiển, và token/ghép đôi đều có thể lỗi độc lập trong khi trông giống nhau từ phía người dùng.

Khi nghi ngờ:

- xác minh cục bộ điểm cuối Windows Chrome trước
- xác minh cùng điểm cuối đó từ WSL2 sau
- chỉ sau đó mới gỡ lỗi cấu hình OpenClaw hoặc xác thực Giao diện Điều khiển

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Đăng nhập trình duyệt](/vi/tools/browser-login)
- [Khắc phục sự cố trình duyệt Linux](/vi/tools/browser-linux-troubleshooting)
