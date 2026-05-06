---
read_when:
    - Bạn muốn cập nhật một bản sao mã nguồn đã lấy về một cách an toàn
    - Bạn đang gỡ lỗi đầu ra hoặc các tùy chọn của `openclaw update`
    - Bạn cần hiểu cách hoạt động của dạng viết tắt `--update`
summary: Tham chiếu CLI cho `openclaw update` (cập nhật nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-05-06T17:54:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn đã cài đặt bằng **npm/pnpm/bun** (cài đặt toàn cục, không có siêu dữ liệu git),
các bản cập nhật diễn ra qua luồng trình quản lý gói trong [Cập nhật](/vi/install/updating).

## Cách sử dụng

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Tùy chọn

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật bằng trình quản lý gói có khởi động lại Gateway sẽ xác minh rằng dịch vụ đã khởi động lại báo cáo phiên bản đã cập nhật như mong đợi trước khi lệnh thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; được lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu gói chỉ cho lần cập nhật này. Với các bản cài đặt bằng gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (luồng channel/tag/target/restart) mà không ghi cấu hình, cài đặt, đồng bộ Plugin hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` mà máy có thể đọc, bao gồm
  `postUpdate.plugins.warnings` khi các Plugin được quản lý bị hỏng hoặc không thể tải cần
  sửa chữa sau khi bản cập nhật lõi thành công, và `postUpdate.plugins.integrityDrifts`
  khi phát hiện drift tạo phẩm Plugin npm trong quá trình đồng bộ Plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1800 giây).
- `--yes`: bỏ qua lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

`openclaw update` không có cờ `--verbose`. Dùng `--dry-run` để xem trước
các hành động channel/tag/install/restart dự kiến, `--json` cho kết quả
mà máy có thể đọc, và `openclaw update status --json` khi bạn chỉ cần chi tiết
về kênh và tính khả dụng. Nếu bạn đang gỡ lỗi nhật ký Gateway quanh một lần cập nhật,
độ chi tiết console và mức ghi log tệp là riêng biệt: Gateway `--verbose` ảnh hưởng đến
đầu ra terminal/WebSocket, còn log tệp yêu cầu `logging.level: "debug"` hoặc
`"trace"` trong cấu hình. Xem [Ghi log Gateway](/vi/gateway/logging).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các lần chạy `openclaw update` có thay đổi trạng thái bị vô hiệu hóa. Thay vào đó, hãy cập nhật nguồn Nix hoặc đầu vào flake cho bản cài đặt này; với nix-openclaw, dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng ưu tiên agent. `openclaw update status` và `openclaw update --dry-run` vẫn chỉ đọc.
</Note>

<Warning>
Hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + tag/branch/SHA git (cho các checkout nguồn), cùng với tính khả dụng của bản cập nhật.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái mà máy có thể đọc.
- `--timeout <seconds>`: thời gian chờ cho các kiểm tra (mặc định là 3 giây).

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có git checkout, luồng này
đề nghị tạo một checkout.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho mỗi bước cập nhật (mặc định `1800`)

## Tác dụng

Khi bạn chuyển kênh rõ ràng (`--channel ...`), OpenClaw cũng giữ cho
phương thức cài đặt được căn chỉnh:

- `dev` → bảo đảm có git checkout (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật checkout đó, và cài đặt CLI toàn cục từ checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên dist-tag npm `beta`, nhưng quay về `latest` khi beta
  bị thiếu hoặc cũ hơn bản phát hành stable hiện tại.

Trình tự động cập nhật lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI
bên ngoài trình xử lý yêu cầu Gateway đang chạy. Các bản cập nhật bằng trình quản lý gói
`update.run` ở control-plane buộc một lần khởi động lại cập nhật không trì hoãn, không thời gian chờ sau khi thay gói,
vì tiến trình Gateway cũ vẫn có thể còn các chunk trong bộ nhớ trỏ tới
những tệp đã bị gói mới xóa.

Với các bản cài đặt bằng trình quản lý gói, `openclaw update` phân giải phiên bản
gói mục tiêu trước khi gọi trình quản lý gói. Các bản cài đặt npm toàn cục dùng cơ chế cài đặt theo giai đoạn:
OpenClaw cài gói mới vào một prefix npm tạm thời, xác minh
kho `dist` đã đóng gói ở đó, rồi hoán đổi cây gói sạch đó vào
prefix toàn cục thật. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ Plugin và
công việc khởi động lại sẽ không chạy từ cây đáng nghi. Ngay cả khi phiên bản đã cài
đã khớp với mục tiêu, lệnh vẫn làm mới bản cài đặt gói toàn cục,
sau đó chạy đồng bộ Plugin, làm mới hoàn tất lệnh lõi, và công việc khởi động lại. Điều này
giữ cho các sidecar đã đóng gói và bản ghi Plugin do kênh sở hữu được căn chỉnh với
bản dựng OpenClaw đã cài đặt, đồng thời để việc dựng lại hoàn tất lệnh Plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` rõ ràng.

Khi dịch vụ Gateway được quản lý cục bộ đã được cài đặt và bật khởi động lại,
các bản cập nhật bằng trình quản lý gói dừng dịch vụ đang chạy trước khi thay thế cây gói,
sau đó làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ, và xác minh Gateway đã khởi động lại báo cáo phiên bản mong đợi trước khi
báo thành công. Trên macOS, kiểm tra sau cập nhật cũng xác minh LaunchAgent
đã được tải/đang chạy cho hồ sơ đang hoạt động và cổng loopback đã cấu hình
khỏe mạnh. Nếu plist đã được cài đặt nhưng launchd không giám sát nó, OpenClaw
tự động bootstrap lại LaunchAgent, rồi chạy lại các kiểm tra
sẵn sàng về sức khỏe/phiên bản/kênh. Một bootstrap mới tải trực tiếp job RunAtLoad,
vì vậy quá trình phục hồi cập nhật không ngay lập tức `kickstart -k` Gateway mới
được sinh ra. Nếu Gateway vẫn không khỏe mạnh, lệnh thoát
khác 0 và in đường dẫn log khởi động lại cùng các hướng dẫn khởi động lại, cài đặt lại và
rollback gói rõ ràng. Với `--no-restart`,
việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị dừng hoặc
khởi động lại, nên Gateway đang chạy có thể tiếp tục dùng mã cũ cho đến khi bạn khởi động lại
thủ công.

## Luồng git checkout

### Chọn kênh

- `stable`: checkout tag không phải beta mới nhất, rồi build và doctor.
- `beta`: ưu tiên tag `-beta` mới nhất, nhưng quay về tag stable mới nhất khi beta bị thiếu hoặc cũ hơn.
- `dev`: checkout `main`, rồi fetch và rebase.

### Các bước cập nhật

<Steps>
  <Step title="Xác minh worktree sạch">
    Yêu cầu không có thay đổi chưa commit.
  </Step>
  <Step title="Chuyển kênh">
    Chuyển sang kênh đã chọn (tag hoặc branch).
  </Step>
  <Step title="Fetch upstream">
    Chỉ dev.
  </Step>
  <Step title="Build preflight (chỉ dev)">
    Chạy bản build TypeScript trong một worktree tạm. Nếu tip thất bại, lùi lại tối đa 10 commit để tìm commit mới nhất có thể build. Đặt `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` để cũng chạy lint trong preflight này; lint chạy ở chế độ tuần tự bị ràng buộc vì các máy chủ cập nhật của người dùng thường nhỏ hơn runner CI.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt phụ thuộc">
    Dùng trình quản lý gói của repo. Với các checkout pnpm, trình cập nhật bootstrap `pnpm` khi cần (trước tiên qua `corepack`, rồi fallback tạm thời `npm install pnpm@10`) thay vì chạy `npm run build` bên trong workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Build Gateway và Control UI.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ Plugin">
    Đồng bộ Plugin theo kênh đang hoạt động. Dev dùng Plugin được bundle; stable và beta dùng npm. Cập nhật các bản cài Plugin được theo dõi.
  </Step>
</Steps>

Trên kênh cập nhật beta, các bản cài Plugin npm và ClawHub được theo dõi đi theo
dòng default/latest sẽ thử bản phát hành Plugin `@beta` trước. Nếu Plugin không có
bản phát hành beta, OpenClaw quay về spec default/latest đã ghi. Với Plugin npm,
OpenClaw cũng quay về khi gói beta tồn tại nhưng không vượt qua xác thực cài đặt.
Các phiên bản chính xác và tag rõ ràng không bị viết lại.

<Warning>
Nếu một bản cập nhật Plugin npm được pin chính xác phân giải thành một tạo phẩm có integrity khác với bản ghi cài đặt đã lưu, `openclaw update` sẽ hủy bản cập nhật tạo phẩm Plugin đó thay vì cài đặt nó. Chỉ cài đặt lại hoặc cập nhật Plugin rõ ràng sau khi xác minh rằng bạn tin tưởng tạo phẩm mới.
</Warning>

<Note>
Các lỗi đồng bộ Plugin sau cập nhật được giới hạn trong một Plugin được quản lý sẽ được báo cáo dưới dạng cảnh báo sau khi bản cập nhật lõi thành công. Kết quả JSON giữ `status: "ok"` ở cấp cao nhất của bản cập nhật và báo cáo `postUpdate.plugins.status: "warning"` cùng hướng dẫn `openclaw doctor --fix` và `openclaw plugins inspect <id> --runtime --json`. Các ngoại lệ bất ngờ của trình cập nhật hoặc đồng bộ vẫn làm thất bại kết quả cập nhật. Sửa lỗi cài đặt hoặc cập nhật Plugin, rồi chạy lại `openclaw doctor --fix` hoặc `openclaw update`.

Khi Gateway đã cập nhật khởi động, việc tải Plugin chỉ là xác minh: startup không chạy trình quản lý gói hoặc thay đổi cây phụ thuộc. Các lần khởi động lại `update.run` bằng trình quản lý gói bỏ qua cơ chế trì hoãn khi nhàn rỗi thông thường và thời gian chờ khởi động lại sau khi cây gói đã được hoán đổi, nên tiến trình cũ không thể tiếp tục lazy-load các chunk đã bị xóa.

Nếu bootstrap pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi dành riêng cho trình quản lý gói thay vì thử `npm run build` bên trong checkout.
</Note>

## Viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script launcher).

## Liên quan

- `openclaw doctor` (đề nghị chạy update trước trên git checkout)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
