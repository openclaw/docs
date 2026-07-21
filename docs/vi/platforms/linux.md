---
read_when:
    - Đang tìm trạng thái của ứng dụng đồng hành trên Linux
    - Bật camera, vị trí hoặc thông báo trên máy chủ Node Linux
    - Lập kế hoạch phạm vi hỗ trợ nền tảng hoặc đóng góp
    - Gỡ lỗi tiến trình bị Linux OOM kết thúc hoặc thoát với mã 137 trên VPS hoặc container
summary: Trạng thái hỗ trợ Linux + ứng dụng đồng hành
title: Ứng dụng Linux
x-i18n:
    generated_at: "2026-07-21T13:25:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 04ba8d88dda953a3168a98ae0fa47812dcebeb29e12325620d76cb401496676c
    source_path: platforms/linux.md
    workflow: 16
---

Gateway được hỗ trợ đầy đủ trên Linux và yêu cầu Node. Bun vẫn có thể được dùng
làm trình cài đặt phần phụ thuộc hoặc trình chạy script gói, nhưng không thể chạy OpenClaw
vì không cung cấp `node:sqlite`.

## Ứng dụng đồng hành trên máy tính

Ứng dụng đồng hành OpenClaw cho Linux là một ứng dụng Tauri trên máy tính dành cho Gateway cục bộ. Ứng dụng này:

- cài đặt OpenClaw CLI và môi trường chạy Node được quản lý khi chúng còn thiếu; bản dựng phát hành tự động cài đặt kênh ổn định, còn bản dựng phát triển sẽ hỏi kênh trước
- kết nối với một Gateway đang hoạt động bình thường trước khi thử thay đổi dịch vụ
- ủy quyền các thao tác cài đặt, khởi động, dừng và khởi động lại cho dịch vụ người dùng systemd do CLI quản lý
- phát hiện các Gateway Bonjour ở gần và mở từng Control UI trong một cửa sổ theo phạm vi tuyến, nhờ đó nhiều
  bảng điều khiển Gateway có thể duy trì kết nối và được sử dụng đồng thời
- mở Control UI do Gateway phục vụ bằng URL xác thực đã phân giải
- mở Control UI ở chế độ thiết lập ban đầu sau lần cài đặt đầu tiên, trong đó
  cung cấp tùy chọn nhập các bộ nhớ Claude Code, Codex hoặc Hermes được phát hiện vào
  không gian làm việc của agent (tùy chọn nhập tương tự vẫn có sẵn sau đó tại
  Settings → Import Memory)
- hiển thị Canvas do agent điều khiển và nội dung A2UI đi kèm cho máy chủ node CLI cùng vị trí
- tiếp tục hoạt động trong khay hệ thống khi cửa sổ bị đóng

Các bản phát hành ổn định được dựng từ `main` cung cấp các gói `.deb` và AppImage dưới dạng tài nguyên trong
[bản phát hành GitHub](https://github.com/openclaw/openclaw/releases) dành cho thẻ,
có tên `OpenClaw-<version>-amd64.deb` và `OpenClaw-<version>-amd64.AppImage`,
cùng một tệp tổng kiểm `SHA256SUMS.linux-app.txt` bên cạnh. Hãy tải xuống
`.deb` và cài đặt bằng `sudo apt install ./OpenClaw-<version>-amd64.deb`,
hoặc đánh dấu AppImage là tệp thực thi rồi chạy trực tiếp. Môi trường chạy AppImage
cần FUSE 2 (`sudo apt install libfuse2`, hoặc `libfuse2t64` trên Ubuntu 24.04+);
nếu không có, hãy chạy AppImage bằng `APPIMAGE_EXTRACT_AND_RUN=1`.

Bạn cũng có thể dựng các gói tương tự từ một bản checkout mã nguồn:

```bash
cd apps/linux/src-tauri
pnpm dlx @tauri-apps/cli@2.11.4 build --bundles deb,appimage
```

Quy trình CI `Linux App` tải các gói tương tự lên dưới dạng
tạo tác `openclaw-linux-companion` cho các pull request có thay đổi ứng dụng và cho
các lượt chạy thủ công. Xem `apps/linux/README.md` trong kho lưu trữ để biết các phần phụ thuộc
dùng để dựng trên Linux và các lệnh phát triển.

### Trò chuyện nhanh

Mở Trò chuyện nhanh bằng `Ctrl+Shift+Space` hoặc mục **Trò chuyện nhanh** trong khay hệ thống. Chip agent
hiển thị ảnh đại diện, emoji hoặc chữ lồng đã cấu hình; chọn chip để chuyển đổi agent.
Tin nhắn sử dụng phiên chính của agent đã chọn và tuân theo phạm vi phiên toàn cục.
Ứng dụng khách Rust gốc sở hữu một danh tính thiết bị Ed25519 lâu dài. Ứng dụng chỉ dùng
token hoặc mật khẩu dùng chung từ phần chuyển giao của CLI để khởi tạo quá trình ghép nối, sau đó lưu trữ và
ưu tiên token thiết bị do Gateway cấp trong các lần kết nối sau. Danh tính và
token thiết bị nằm trong thư mục cấu hình ứng dụng, trong một tệp có chế độ `0600`; WebView của Trò chuyện
nhanh không nhận được thông tin xác thực cũng như WebSocket.

Khi kết nối gốc không khả dụng, Trò chuyện nhanh hiển thị **Không thể kết nối
Gateway — đang thử lại** và vô hiệu hóa thao tác gửi cho đến khi kết nối lại. Một thiết bị từ xa
đã đến giai đoạn ghép nối sẽ hiển thị **Phê duyệt thiết bị này trong bảng điều khiển
(Nodes)**, kèm ID thiết bị ngắn nếu Gateway cung cấp. Một
Gateway yêu cầu thông tin xác thực dùng chung còn thiếu sẽ hiển thị **Gateway yêu cầu
thông tin xác thực — hãy mở bảng điều khiển trên máy chủ Gateway**; không có yêu cầu ghép nối nào
đang chờ phê duyệt trong trạng thái đó. Hướng dẫn khắc phục do máy chủ cung cấp
sẽ thay thế các thông báo dự phòng này khi hướng dẫn đó cụ thể hơn.
Đối với Gateway dùng TLS, CLI chuyển cho ứng dụng dấu vân tay SHA-256
của chứng chỉ Gateway; ứng dụng khách gốc ghim chứng chỉ đó và báo cáo **Xác thực độ tin cậy TLS của Gateway
không thành công — hãy kiểm tra dấu vân tay chứng chỉ** riêng biệt với tình trạng ngừng hoạt động.
Các Gateway có khóa bí mật dùng chung được cấu hình thông qua SecretRef sẽ bỏ qua khóa đó trong
phần chuyển giao của CLI. Các bản cài đặt đã ghép nối vẫn tiếp tục hoạt động thông qua token thiết bị
đã lưu, nhưng bản cài đặt mới không thể tạo yêu cầu ghép nối đang chờ xử lý khi dùng xác thực
bằng khóa bí mật dùng chung nếu không có thông tin xác thực khởi tạo đó.
Việc đổi mã thiết lập và `bootstrapToken` cần giao diện sản phẩm chuyên biệt và vẫn là
phần việc tiếp theo; Trò chuyện nhanh không thử thực hiện các luồng này.

Trên X11, dùng biểu tượng bánh răng trong Trò chuyện nhanh để ghi lại hoặc đặt lại phím tắt tùy chỉnh. Nút chuyển
**Phím tắt Trò chuyện nhanh** trong khay hệ thống bật hoặc tắt phím tắt mà không vô hiệu hóa
mục **Trò chuyện nhanh** thông thường trong khay. Phím tắt toàn cục không khả dụng trên Wayland, vì vậy
các cài đặt phím tắt bị ẩn và mục trong khay vẫn là điểm truy cập.
Sau khi tin nhắn được chấp nhận gửi, Trò chuyện nhanh vẫn mở và truyền trực tiếp phản hồi
văn bản thuần của agent đã chọn bên dưới trình soạn thảo. Nhấn `Esc` để đóng thanh này và phản hồi;
`Ctrl+Enter` vẫn mở bảng điều khiển.

### Canvas

Canvas trên Linux sử dụng hai tiến trình phối hợp với nhau. `openclaw node run` vẫn là kết nối node Gateway duy nhất; Plugin `linux-canvas` đi kèm chuyển tiếp các lệnh gọi `canvas.*` đến ứng dụng máy tính đang chạy qua một socket Unix chỉ dành cho người dùng. Ứng dụng sở hữu một cửa sổ WebView được mở theo nhu cầu, bao gồm trình kết xuất A2UI đi kèm và cầu nối hành động trở lại agent.

Plugin được bật theo mặc định. Plugin chỉ quảng bá Canvas khi socket của ứng dụng máy tính tồn tại tại `$XDG_RUNTIME_DIR/openclaw-canvas.sock`, hoặc `/tmp/openclaw-canvas-$UID.sock` khi `XDG_RUNTIME_DIR` không khả dụng. Vô hiệu hóa Plugin bằng `plugins.entries.linux-canvas.enabled: false`. Trên máy chủ Linux không giao diện và không có ứng dụng máy tính, Canvas không được quảng bá.

Linux v1 sử dụng một cửa sổ Canvas. Có thể kết xuất các trang HTTP và HTTPS, nhưng hành động A2UI chỉ được chấp nhận từ trình kết xuất đi kèm.

## Phương án thay thế bằng CLI và SSH

CLI vẫn là lựa chọn đơn giản nhất cho máy chủ không giao diện, VPS hoặc Gateway từ xa:

1. Cài đặt Node 24.15+ (khuyến nghị), Node 22.22.3+ (LTS) hoặc Node 25.9+.
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Từ máy tính xách tay của bạn: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Mở `http://127.0.0.1:18789/` và xác thực bằng khóa bí mật dùng chung đã cấu hình
   (token theo mặc định; mật khẩu nếu `gateway.auth.mode` là `"password"`).

Hướng dẫn máy chủ đầy đủ: [Máy chủ Linux](/vi/vps). Ví dụ VPS từng bước:
[exe.dev](/vi/install/exe-dev).

## Khả năng của Node

Plugin Node dành cho Linux đi kèm cung cấp cho dịch vụ CLI `openclaw node` các khả năng thiết bị mà không yêu cầu ứng dụng máy tính. Các lệnh chỉ được quảng bá đến Gateway khi khả năng tương ứng đã bật và công cụ cục bộ bắt buộc tồn tại.

| Khả năng                              | Mặc định | Yêu cầu                                                           |
| --------------------------------------- | ------- | --------------------------------------------------------------------- |
| Thông báo trên máy tính (`system.notify`) | Bật      | `notify-send` từ libnotify và một phiên thông báo trên máy tính       |
| Ảnh và đoạn phim từ camera (`camera.*`)    | Tắt     | FFmpeg, quyền truy cập camera V4L2 và PulseAudio hoặc PipeWire cho âm thanh của đoạn phim |
| Vị trí (`location.get`)               | Tắt     | GeoClue2 và bản minh họa `where-am-i` của nó                                    |

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

Khởi động lại dịch vụ node sau khi thay đổi các cài đặt này. Tính khả dụng được xác định một lần cho mỗi tiến trình và nội dung quảng bá node được dựng lại khi khởi động lại.

Gateway phê duyệt riêng bề mặt lệnh và khả năng của node, tách biệt với việc ghép nối thiết bị. Trong lần khởi động đầu tiên hoặc sau khi bật thêm khả năng, hãy phê duyệt bề mặt đang chờ xử lý:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Một node có thể đã kết nối và ghép nối thiết bị trong khi `caps` và `commands` hiệu dụng vẫn trống cho đến khi quá trình phê duyệt này hoàn tất.

Người dùng dịch vụ phải có quyền đọc thiết bị camera, thường thông qua nhóm `video`. Đoạn phim từ camera sử dụng nguồn PulseAudio hoặc PipeWire mặc định khi `includeAudio` là true; âm thanh micrô chỉ tồn tại dưới dạng bản âm thanh của đoạn phim đó, không phải một lệnh độc lập. Tính năng vị trí yêu cầu người dùng dịch vụ node được chính sách GeoClue của máy chủ cho phép.

`camera.snap` và `camera.clip` cũng yêu cầu bật quyền rõ ràng trên Gateway thông qua `gateway.nodes.allowCommands`. Xem [Ghi hình từ camera](/vi/nodes/camera) và [Lệnh vị trí](/vi/nodes/location-command) để biết tải trọng, giới hạn và lỗi.

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

`openclaw gateway install` kết xuất một đơn vị **người dùng** systemd theo mặc định. Hướng dẫn đầy đủ về
dịch vụ, bao gồm biến thể đơn vị cấp **hệ thống** dành cho máy chủ dùng chung hoặc
luôn bật, có trong [cẩm nang vận hành Gateway](/vi/gateway#supervision-and-service-lifecycle).

Chỉ tự viết đơn vị cho một thiết lập tùy chỉnh. Ví dụ đơn vị người dùng tối thiểu
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

Các đơn vị viết thủ công không kế thừa cơ chế định cỡ heap thích ứng mà `openclaw gateway install` ghi cho các dịch vụ Gateway được quản lý. Nên dùng trình cài đặt được quản lý hoặc đặt giới hạn heap rõ ràng trong trình giám sát tùy chỉnh sau khi đã tính đến khoảng trống cho bộ nhớ gốc.

Bật đơn vị:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Áp lực bộ nhớ và việc chấm dứt do OOM

Trên Linux, kernel chọn một tiến trình làm nạn nhân OOM khi máy chủ, VM hoặc cgroup vùng chứa
hết bộ nhớ. Gateway không phù hợp để làm nạn nhân vì nó sở hữu các
phiên và kết nối kênh tồn tại lâu dài, nên OpenClaw ưu tiên để các tiến trình con
tạm thời bị chấm dứt trước khi có thể.

Đối với các tiến trình con đủ điều kiện trên Linux, OpenClaw bọc lệnh trong một shim
`/bin/sh` ngắn để tăng `oom_score_adj` của chính tiến trình con lên `1000`, rồi
`exec` lệnh thực. Thao tác này không cần đặc quyền: một tiến trình luôn có thể tăng
điểm OOM của chính nó.

Các bề mặt tiến trình con được áp dụng:

- Tiến trình con của lệnh do trình giám sát quản lý
- Tiến trình con của shell PTY
- Tiến trình con của máy chủ MCP stdio
- Các tiến trình trình duyệt/Chrome do OpenClaw khởi chạy (thông qua môi trường chạy tiến trình của SDK Plugin)

Trình bọc chỉ dành cho Linux và bị bỏ qua khi `/bin/sh` không khả dụng hoặc khi
môi trường của tiến trình con đặt `OPENCLAW_CHILD_OOM_SCORE_ADJ` thành `0`, `false`, `no` hoặc
`off`.

Xác minh một tiến trình con:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Giá trị dự kiến cho các tiến trình con được áp dụng là `1000`; bản thân tiến trình Gateway
giữ nguyên điểm số thông thường (thường là `0`).

`OOMPolicy=continue` của đơn vị systemd duy trì hoạt động của dịch vụ Gateway khi
một tiến trình con tạm thời bị trình chấm dứt OOM chọn, thay vì đánh dấu toàn bộ
đơn vị là thất bại và khởi động lại tất cả các kênh; tiến trình con/phiên bị lỗi sẽ báo cáo
lỗi của chính nó.

Cơ chế này không thay thế việc điều chỉnh bộ nhớ thông thường. Nếu VPS hoặc vùng chứa liên tục
chấm dứt các tiến trình con, hãy tăng giới hạn bộ nhớ, giảm mức đồng thời hoặc thêm các
biện pháp kiểm soát tài nguyên mạnh hơn (`MemoryMax=` của systemd, giới hạn bộ nhớ vùng chứa).

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Raspberry Pi](/vi/install/raspberry-pi)
- [Cẩm nang vận hành Gateway](/vi/gateway)
- [Cấu hình Gateway](/vi/gateway/configuration)
