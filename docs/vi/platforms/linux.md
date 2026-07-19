---
read_when:
    - Tìm trạng thái của ứng dụng đồng hành trên Linux
    - Bật camera, vị trí hoặc thông báo trên máy chủ Node Linux
    - Lập kế hoạch phạm vi hỗ trợ nền tảng hoặc đóng góp
    - Gỡ lỗi tiến trình bị Linux OOM chấm dứt hoặc thoát với mã 137 trên VPS hoặc container
summary: Tình trạng hỗ trợ Linux và ứng dụng đồng hành
title: Ứng dụng Linux
x-i18n:
    generated_at: "2026-07-19T05:51:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea38a6a70596713074c0caf55512da76e4239672224c9a62c044ce25ef930c0f
    source_path: platforms/linux.md
    workflow: 16
---

Gateway được hỗ trợ đầy đủ trên Linux và yêu cầu Node. Bun vẫn có thể được dùng
làm trình cài đặt phần phụ thuộc hoặc trình chạy tập lệnh gói, nhưng không thể chạy OpenClaw
vì không cung cấp `node:sqlite`.

## Ứng dụng đồng hành trên máy tính

Ứng dụng đồng hành OpenClaw trên Linux là một ứng dụng máy tính Tauri dành cho Gateway cục bộ. Ứng dụng này:

- cài đặt CLI OpenClaw và môi trường chạy Node được quản lý khi chúng chưa có; bản dựng phát hành tự động cài đặt kênh ổn định, còn bản dựng phát triển sẽ hỏi chọn kênh trước
- kết nối với Gateway đang hoạt động bình thường trước khi thử thay đổi dịch vụ
- ủy quyền các thao tác cài đặt, khởi động, dừng và khởi động lại cho dịch vụ người dùng systemd do CLI quản lý
- phát hiện các Gateway Bonjour ở gần và mở Control UI của chúng từ điểm cuối dịch vụ đã phân giải
- mở Control UI do Gateway phục vụ bằng URL xác thực đã phân giải
- mở Control UI ở chế độ hướng dẫn thiết lập sau lần cài đặt đầu tiên, trong đó
  cung cấp tùy chọn nhập các bộ nhớ Claude Code, Codex hoặc Hermes đã phát hiện vào
  không gian làm việc của tác tử (tùy chọn nhập tương tự vẫn có sẵn về sau tại
  Settings → Import Memory)
- hiển thị Canvas do tác tử điều khiển và nội dung A2UI đi kèm cho máy chủ Node CLI cùng vị trí
- vẫn hoạt động trong khay hệ thống khi cửa sổ bị đóng

Các bản phát hành ổn định được dựng từ `main` cung cấp các gói `.deb` và AppImage dưới dạng tài nguyên trên
[bản phát hành GitHub](https://github.com/openclaw/openclaw/releases) cho thẻ tương ứng,
có tên `OpenClaw-<version>-amd64.deb` và `OpenClaw-<version>-amd64.AppImage`,
cùng với tệp tổng kiểm `SHA256SUMS.linux-app.txt` bên cạnh. Tải xuống
`.deb` và cài đặt bằng `sudo apt install ./OpenClaw-<version>-amd64.deb`,
hoặc đánh dấu AppImage là tệp thực thi rồi chạy trực tiếp. Môi trường chạy AppImage
cần FUSE 2 (`sudo apt install libfuse2`, hoặc `libfuse2t64` trên Ubuntu 24.04+);
nếu không có, hãy chạy AppImage với `APPIMAGE_EXTRACT_AND_RUN=1`.

Bạn cũng có thể dựng các gói tương tự từ một bản checkout mã nguồn:

```bash
cd apps/linux/src-tauri
pnpm dlx @tauri-apps/cli@2.11.4 build --bundles deb,appimage
```

Quy trình CI `Linux App` tải các gói tương tự lên dưới dạng
artifact `openclaw-linux-companion` cho các pull request có thay đổi ứng dụng và cho
các lần chạy thủ công. Xem `apps/linux/README.md` trong kho lưu trữ để biết các phần phụ thuộc
dựng Linux và các lệnh phát triển.

### Trò chuyện nhanh

Mở Trò chuyện nhanh bằng `Ctrl+Shift+Space` hoặc mục **Trò chuyện nhanh** trong khay. Chip tác tử
hiển thị ảnh đại diện, emoji hoặc chữ lồng đã cấu hình; chọn chip này để chuyển đổi tác tử.
Tin nhắn sử dụng phiên chính của tác tử đã chọn và tuân theo phạm vi phiên toàn cục.
Ứng dụng khách Rust gốc sở hữu một danh tính thiết bị Ed25519 lâu dài. Ứng dụng chỉ sử dụng
token hoặc mật khẩu dùng chung từ quá trình bàn giao của CLI để khởi tạo ghép nối, sau đó lưu trữ và
ưu tiên token thiết bị do Gateway cấp trong các lần kết nối sau. Danh tính và
token thiết bị nằm trong thư mục cấu hình ứng dụng, trong một tệp có chế độ `0600`; WebView của Trò chuyện
nhanh không nhận thông tin xác thực cũng như WebSocket.

Khi kết nối gốc không khả dụng, Trò chuyện nhanh hiển thị **Không thể kết nối
Gateway — đang thử lại** và vô hiệu hóa việc gửi cho đến khi kết nối lại. Một thiết bị từ xa
đã đến giai đoạn ghép nối sẽ hiển thị **Phê duyệt thiết bị này trong bảng điều khiển
(Nodes)**, kèm ID thiết bị ngắn khi Gateway cung cấp. Một
Gateway yêu cầu thông tin xác thực dùng chung nhưng chưa có sẽ hiển thị **Gateway yêu cầu
thông tin xác thực — hãy mở bảng điều khiển trên máy chủ Gateway**; trong trạng thái đó không có yêu cầu ghép nối nào
đang chờ phê duyệt. Hướng dẫn khắc phục do máy chủ cung cấp
sẽ thay thế các thông báo dự phòng này khi cụ thể hơn.
Đối với Gateway TLS, CLI cung cấp cho ứng dụng dấu vân tay SHA-256 của
chứng chỉ Gateway; ứng dụng khách gốc ghim chứng chỉ đó và báo cáo riêng lỗi **Xác minh độ tin cậy TLS của
Gateway không thành công — hãy kiểm tra dấu vân tay chứng chỉ**, tách biệt với thời gian ngừng hoạt động.
Các Gateway có bí mật dùng chung được cấu hình thông qua SecretRef sẽ bỏ qua bí mật đó trong
quá trình bàn giao của CLI. Các bản cài đặt đã ghép nối vẫn tiếp tục hoạt động nhờ token thiết bị
đã lưu, nhưng bản cài đặt mới không thể tạo yêu cầu ghép nối đang chờ khi dùng xác thực
bằng bí mật dùng chung nếu thiếu thông tin xác thực khởi tạo đó.
Việc đổi mã thiết lập và `bootstrapToken` cần giao diện sản phẩm chuyên dụng và vẫn là
hạng mục tiếp theo; Trò chuyện nhanh không thử thực hiện các luồng này.

Trên X11, hãy dùng biểu tượng bánh răng trong Trò chuyện nhanh để ghi nhận hoặc đặt lại phím tắt tùy chỉnh. Nút bật/tắt
**Phím tắt Trò chuyện nhanh** trong khay bật hoặc tắt phím tắt mà không vô hiệu hóa
mục **Trò chuyện nhanh** thông thường trong khay. Phím tắt toàn cục không khả dụng trên Wayland, vì vậy
các cài đặt phím tắt bị ẩn và mục trong khay vẫn là điểm truy cập.
Sau khi gửi thành công, Trò chuyện nhanh vẫn mở và truyền trực tiếp phản hồi
dạng văn bản thuần của tác tử đã chọn bên dưới trình soạn thảo. Nhấn `Esc` để đóng thanh và phản hồi;
`Ctrl+Enter` vẫn mở bảng điều khiển.

### Canvas

Canvas trên Linux sử dụng hai tiến trình phối hợp với nhau. `openclaw node run` vẫn là kết nối Node duy nhất tới Gateway; Plugin `linux-canvas` đi kèm chuyển tiếp các lệnh gọi `canvas.*` đến ứng dụng máy tính đang chạy qua một socket Unix chỉ dành cho người dùng. Ứng dụng sở hữu một cửa sổ WebView được mở theo yêu cầu, bao gồm trình kết xuất A2UI đi kèm và cầu nối hành động quay lại tác tử.

Plugin được bật theo mặc định. Plugin chỉ quảng bá Canvas khi socket ứng dụng máy tính tồn tại tại `$XDG_RUNTIME_DIR/openclaw-canvas.sock`, hoặc `/tmp/openclaw-canvas-$UID.sock` khi `XDG_RUNTIME_DIR` không khả dụng. Vô hiệu hóa bằng `plugins.entries.linux-canvas.enabled: false`. Trên máy chủ Linux không giao diện và không có ứng dụng máy tính, Canvas không được quảng bá.

Linux v1 sử dụng một cửa sổ Canvas. Có thể kết xuất các trang HTTP và HTTPS, nhưng hành động A2UI chỉ được chấp nhận từ trình kết xuất đi kèm.

## Phương án thay thế bằng CLI và SSH

CLI vẫn là lựa chọn đơn giản nhất cho máy chủ không giao diện, VPS hoặc Gateway từ xa:

1. Cài đặt Node 24.15+ (khuyến nghị), Node 22.22.3+ (LTS) hoặc Node 25.9+.
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Từ máy tính xách tay: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Mở `http://127.0.0.1:18789/` và xác thực bằng bí mật dùng chung đã cấu hình
   (token theo mặc định; mật khẩu nếu `gateway.auth.mode` là `"password"`).

Hướng dẫn máy chủ đầy đủ: [Máy chủ Linux](/vi/vps). Ví dụ VPS từng bước:
[exe.dev](/vi/install/exe-dev).

## Khả năng của Node

Plugin Node Linux đi kèm cung cấp cho CLI các khả năng thiết bị dịch vụ `openclaw node` mà không yêu cầu ứng dụng máy tính. Các lệnh chỉ được quảng bá tới Gateway khi khả năng tương ứng được bật và công cụ cục bộ bắt buộc tồn tại.

| Khả năng                              | Mặc định | Yêu cầu                                                           |
| --------------------------------------- | ------- | --------------------------------------------------------------------- |
| Thông báo trên màn hình (`system.notify`) | Bật      | `notify-send` từ libnotify và một phiên thông báo trên màn hình       |
| Ảnh và đoạn phim từ camera (`camera.*`)    | Tắt     | FFmpeg, quyền truy cập camera V4L2 và PulseAudio hoặc PipeWire cho âm thanh đoạn phim |
| Vị trí (`location.get`)               | Tắt     | GeoClue2 và bản demo `where-am-i` của nó                                    |

Cấu hình Plugin trong `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          notify: { enabled: true },
          camera: { enabled: true },
          location: { enabled: true },
        },
      },
    },
  },
}
```

Khởi động lại dịch vụ Node sau khi thay đổi các cài đặt này. Tính khả dụng được xác định một lần cho mỗi tiến trình và thông tin quảng bá Node được dựng lại khi khởi động lại.

Gateway phê duyệt riêng bề mặt lệnh và khả năng của Node, tách biệt với việc ghép nối thiết bị. Trong lần khởi động đầu tiên hoặc sau khi bật thêm khả năng, hãy phê duyệt bề mặt đang chờ:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Một Node có thể đã kết nối và ghép nối thiết bị trong khi `caps` và `commands` hiệu lực vẫn trống cho đến khi việc phê duyệt này hoàn tất.

Thiết bị camera phải có thể được đọc bởi người dùng dịch vụ, thường thông qua nhóm `video`. Các đoạn phim camera sử dụng nguồn PulseAudio hoặc PipeWire mặc định khi `includeAudio` là true; âm thanh micrô chỉ tồn tại dưới dạng rãnh âm thanh của đoạn phim đó, không phải một lệnh độc lập. Tính năng vị trí yêu cầu người dùng dịch vụ Node được chính sách GeoClue của máy chủ cho phép.

`camera.snap` và `camera.clip` cũng yêu cầu kích hoạt Gateway rõ ràng thông qua `gateway.nodes.allowCommands`. Xem [Chụp bằng camera](/vi/nodes/camera) và [Lệnh vị trí](/vi/nodes/location-command) để biết tải trọng, giới hạn và lỗi.

## Cài đặt

- [Bắt đầu](/vi/start/getting-started)
- [Cài đặt và cập nhật](/vi/install/updating)
- Tùy chọn: [Quy trình gói Bun](/vi/install/bun), [Nix](/vi/install/nix), [Docker](/vi/install/docker)

## Dịch vụ Gateway (systemd)

Cài đặt bằng một trong các lệnh sau:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # select "Gateway service" when prompted
```

Sửa chữa hoặc di chuyển một bản cài đặt hiện có:

```bash
openclaw doctor
```

`openclaw gateway install` kết xuất một unit **người dùng** systemd theo mặc định. Hướng dẫn đầy đủ
về dịch vụ, bao gồm biến thể unit cấp **hệ thống** dành cho máy chủ dùng chung hoặc
luôn bật, có trong [sổ tay vận hành Gateway](/vi/gateway#supervision-and-service-lifecycle).

Chỉ viết unit thủ công cho thiết lập tùy chỉnh. Ví dụ unit người dùng tối giản
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Các unit viết thủ công không kế thừa cơ chế định cỡ heap thích ứng mà `openclaw gateway install` ghi cho các dịch vụ Gateway được quản lý. Nên ưu tiên trình cài đặt được quản lý, hoặc đặt giới hạn heap rõ ràng trong trình giám sát tùy chỉnh sau khi tính đến dung lượng dự phòng cho bộ nhớ gốc.

Bật dịch vụ:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Áp lực bộ nhớ và việc hủy tiến trình do OOM

Trên Linux, kernel chọn một tiến trình làm nạn nhân OOM khi máy chủ, VM hoặc cgroup của container
hết bộ nhớ. Gateway không phù hợp làm nạn nhân vì nó quản lý các
phiên và kết nối kênh dài hạn, vì vậy OpenClaw ưu tiên để các tiến trình con
tạm thời bị hủy trước khi có thể.

Đối với các tiến trình con đủ điều kiện trên Linux, OpenClaw bọc lệnh trong một shim
`/bin/sh` ngắn, nâng `oom_score_adj` của chính tiến trình con lên `1000`, sau đó
`exec` lệnh thực. Thao tác này không cần đặc quyền: một tiến trình luôn có thể tăng
điểm OOM của chính nó.

Các bề mặt tiến trình con được áp dụng:

- Các tiến trình con của lệnh do trình giám sát quản lý
- Các tiến trình con shell PTY
- Các tiến trình con của máy chủ stdio MCP
- Các tiến trình trình duyệt/Chrome do OpenClaw khởi chạy (thông qua môi trường chạy tiến trình của SDK Plugin)

Trình bọc chỉ dành cho Linux và bị bỏ qua khi `/bin/sh` không khả dụng, hoặc khi
môi trường của tiến trình con đặt `OPENCLAW_CHILD_OOM_SCORE_ADJ` thành `0`, `false`, `no` hoặc
`off`.

Xác minh một tiến trình con:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Giá trị mong đợi cho các tiến trình con được áp dụng là `1000`; bản thân tiến trình Gateway
giữ điểm số bình thường (thường là `0`).

`OOMPolicy=continue` của unit systemd giữ cho dịch vụ Gateway tiếp tục hoạt động khi
một tiến trình con tạm thời bị OOM killer chọn, thay vì đánh dấu toàn bộ
unit là lỗi và khởi động lại tất cả các kênh; tiến trình con/phiên bị lỗi sẽ báo cáo
lỗi riêng.

Điều này không thay thế việc tinh chỉnh bộ nhớ thông thường. Nếu VPS hoặc container liên tục
hủy các tiến trình con, hãy tăng giới hạn bộ nhớ, giảm mức đồng thời hoặc thêm các
biện pháp kiểm soát tài nguyên mạnh hơn (`MemoryMax=` của systemd, giới hạn bộ nhớ container).

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Raspberry Pi](/vi/install/raspberry-pi)
- [Sổ tay vận hành Gateway](/vi/gateway)
- [Cấu hình Gateway](/vi/gateway/configuration)
