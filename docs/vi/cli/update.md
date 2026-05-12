---
read_when:
    - Bạn muốn cập nhật bản checkout mã nguồn một cách an toàn
    - Bạn đang gỡ lỗi đầu ra hoặc các tùy chọn của `openclaw update`
    - Bạn cần hiểu hành vi viết tắt của `--update`
summary: Tham chiếu CLI cho `openclaw update` (cập nhật nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-05-12T08:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93244af800aaa53c55a52f9593a7727910aa91acac9d1e34e89c39a95b133461
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn cài đặt qua **npm/pnpm/bun** (cài đặt global, không có metadata git),
các bản cập nhật sẽ diễn ra qua luồng trình quản lý gói trong [Cập nhật](/vi/install/updating).

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

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật bằng trình quản lý gói có khởi động lại Gateway sẽ xác minh dịch vụ đã khởi động lại báo cáo đúng phiên bản đã cập nhật mong đợi trước khi lệnh thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; được lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè đích gói chỉ cho lần cập nhật này. Với các bản cài đặt bằng gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (luồng channel/tag/target/restart) mà không ghi cấu hình, cài đặt, đồng bộ plugin hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` máy có thể đọc, bao gồm
  `postUpdate.plugins.warnings` khi các plugin được quản lý bị hỏng hoặc không thể tải cần
  sửa chữa sau khi cập nhật lõi thành công, chi tiết fallback plugin kênh beta
  khi một plugin không có bản phát hành beta, và `postUpdate.plugins.integrityDrifts`
  khi phát hiện drift artifact plugin npm trong quá trình đồng bộ plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1800s).
- `--yes`: bỏ qua lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

`openclaw update` không có cờ `--verbose`. Dùng `--dry-run` để xem trước
các hành động channel/tag/install/restart dự kiến, `--json` để nhận kết quả
máy có thể đọc, và `openclaw update status --json` khi bạn chỉ cần kênh và
chi tiết khả dụng. Nếu bạn đang gỡ lỗi nhật ký Gateway quanh một bản cập nhật,
độ chi tiết console và mức nhật ký tệp là riêng biệt: Gateway `--verbose` ảnh hưởng
đến đầu ra terminal/WebSocket, còn nhật ký tệp yêu cầu `logging.level: "debug"` hoặc
`"trace"` trong cấu hình. Xem [Ghi nhật ký Gateway](/vi/gateway/logging).

<Note>
Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các lần chạy `openclaw update` có thay đổi trạng thái bị vô hiệu hóa. Thay vào đó hãy cập nhật nguồn Nix hoặc đầu vào flake cho bản cài đặt này; với nix-openclaw, dùng [Khởi động nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent. `openclaw update status` và `openclaw update --dry-run` vẫn ở chế độ chỉ đọc.
</Note>

<Warning>
Hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + git tag/branch/SHA (với checkout từ nguồn), cùng với khả năng cập nhật.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái máy có thể đọc.
- `--timeout <seconds>`: thời gian chờ cho các kiểm tra (mặc định là 3s).

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có checkout git,
nó sẽ đề nghị tạo một checkout.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho từng bước cập nhật (mặc định `1800`)

## Chức năng

Khi bạn chuyển kênh rõ ràng (`--channel ...`), OpenClaw cũng giữ cho
phương thức cài đặt được căn chỉnh:

- `dev` → bảo đảm có checkout git (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật nó và cài đặt CLI global từ checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên npm dist-tag `beta`, nhưng fallback về `latest` khi beta
  thiếu hoặc cũ hơn bản phát hành stable hiện tại.

Trình tự động cập nhật lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI
bên ngoài trình xử lý yêu cầu Gateway đang chạy. Các bản cập nhật trình quản lý gói
`update.run` ở control-plane buộc khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi gói,
vì tiến trình Gateway cũ có thể vẫn có các chunk trong bộ nhớ trỏ tới
các tệp đã bị gói mới xóa.

Với các bản cài đặt bằng trình quản lý gói, `openclaw update` phân giải phiên bản
gói đích trước khi gọi trình quản lý gói. Các bản cài đặt global npm dùng cài đặt theo giai đoạn:
OpenClaw cài đặt gói mới vào một prefix npm tạm thời, xác minh
inventory `dist` đã đóng gói tại đó, rồi hoán đổi cây gói sạch đó vào
prefix global thật. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ plugin và
việc khởi động lại sẽ không chạy từ cây đáng nghi. Ngay cả khi phiên bản đã cài đặt
đã khớp với đích, lệnh vẫn làm mới bản cài đặt gói global,
sau đó chạy đồng bộ plugin, làm mới hoàn tất lệnh lõi và công việc khởi động lại. Điều này
giữ các sidecar đã đóng gói và bản ghi plugin do kênh sở hữu căn chỉnh với
bản dựng OpenClaw đã cài đặt, đồng thời để các lần dựng lại hoàn tất lệnh plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` rõ ràng.

Khi một dịch vụ Gateway được quản lý cục bộ đã được cài đặt và khởi động lại được bật,
các bản cập nhật bằng trình quản lý gói sẽ dừng dịch vụ đang chạy trước khi thay thế cây gói,
sau đó làm mới metadata dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ và xác minh Gateway đã khởi động lại báo cáo đúng phiên bản mong đợi trước khi
báo cáo thành công. Trên macOS, kiểm tra sau cập nhật cũng xác minh LaunchAgent
đã được tải/đang chạy cho hồ sơ đang hoạt động và cổng loopback đã cấu hình
khỏe mạnh. Nếu plist đã được cài đặt nhưng launchd không giám sát nó, OpenClaw
tự động bootstrap lại LaunchAgent, rồi chạy lại các kiểm tra
sức khỏe/phiên bản/kênh sẵn sàng. Một bootstrap mới tải job RunAtLoad
trực tiếp, nên phục hồi cập nhật không ngay lập tức `kickstart -k` Gateway
vừa được sinh ra. Nếu Gateway vẫn không trở nên khỏe mạnh, lệnh thoát
khác 0 và in đường dẫn nhật ký khởi động lại cùng hướng dẫn rõ ràng để khởi động lại, cài đặt lại và
rollback gói. Với `--no-restart`,
việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị dừng hoặc
khởi động lại, nên Gateway đang chạy có thể tiếp tục dùng mã cũ cho đến khi bạn khởi động lại
thủ công.

## Luồng checkout git

### Chọn kênh

- `stable`: checkout tag non-beta mới nhất, rồi build và doctor.
- `beta`: ưu tiên tag `-beta` mới nhất, nhưng fallback về tag stable mới nhất khi beta thiếu hoặc cũ hơn.
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
    Chỉ dành cho dev.
  </Step>
  <Step title="Build preflight (chỉ dev)">
    Chạy build TypeScript trong một worktree tạm. Nếu tip thất bại, lùi lại tối đa 10 commit để tìm commit mới nhất có thể build. Đặt `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` để cũng chạy lint trong preflight này; lint chạy ở chế độ serial giới hạn vì máy cập nhật của người dùng thường nhỏ hơn CI runner.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt dependency">
    Dùng trình quản lý gói của repo. Với checkout pnpm, trình cập nhật bootstrap `pnpm` khi cần (trước tiên qua `corepack`, rồi fallback tạm thời bằng `npm install pnpm@11`) thay vì chạy `npm run build` bên trong workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Build gateway và Control UI.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ plugin">
    Đồng bộ plugin với kênh đang hoạt động. Dev dùng plugin được đóng gói kèm; stable và beta dùng npm. Cập nhật các bản cài đặt plugin được theo dõi.
  </Step>
</Steps>

Trên kênh cập nhật beta, các bản cài đặt plugin npm và ClawHub được theo dõi đi theo
dòng default/latest sẽ thử bản phát hành plugin `@beta` trước. Nếu plugin không có
bản phát hành beta, OpenClaw fallback về spec default/latest đã ghi nhận và báo cáo
điều đó như một cảnh báo. Với plugin npm, OpenClaw cũng fallback khi gói beta
tồn tại nhưng không vượt qua xác thực cài đặt. Các cảnh báo fallback plugin này không
làm cập nhật lõi thất bại. Phiên bản chính xác và tag rõ ràng không bị
ghi lại.

<Warning>
Nếu một bản cập nhật plugin npm được ghim chính xác phân giải tới một artifact có integrity khác với bản ghi cài đặt đã lưu, `openclaw update` hủy bỏ bản cập nhật artifact plugin đó thay vì cài đặt nó. Chỉ cài đặt lại hoặc cập nhật plugin rõ ràng sau khi xác minh rằng bạn tin tưởng artifact mới.
</Warning>

<Note>
Các lỗi đồng bộ plugin sau cập nhật được giới hạn ở một plugin được quản lý và đường dẫn đồng bộ có thể đi vòng qua (ví dụ registry npm không thể truy cập cho một plugin không thiết yếu) được báo cáo dưới dạng cảnh báo sau khi cập nhật lõi thành công. Kết quả JSON giữ `status: "ok"` cấp cao nhất và báo cáo `postUpdate.plugins.status: "warning"` cùng hướng dẫn `openclaw doctor --fix` và `openclaw plugins inspect <id> --runtime --json`. Các ngoại lệ trình cập nhật hoặc đồng bộ ngoài dự kiến vẫn làm kết quả cập nhật thất bại. Sửa lỗi cài đặt hoặc cập nhật plugin, rồi chạy lại `openclaw doctor --fix` hoặc `openclaw update`.

Sau bước đồng bộ theo từng plugin, `openclaw update` chạy một lượt **hội tụ sau lõi** bắt buộc trước khi gateway được khởi động lại: nó sửa các payload plugin đã cấu hình bị thiếu, xác thực từng bản ghi cài đặt được theo dõi _đang hoạt động_ trên đĩa, và xác minh tĩnh rằng `package.json` của nó có thể parse được (và mọi `main` được khai báo rõ ràng đều tồn tại). Các lỗi từ lượt này — và snapshot cấu hình OpenClaw không hợp lệ — trả về `postUpdate.plugins.status: "error"` và chuyển `status` cập nhật cấp cao nhất thành `"error"`, nên `openclaw update` thoát khác 0 và gateway _không_ được khởi động lại với một tập plugin chưa xác minh. Lỗi bao gồm các dòng `postUpdate.plugins.warnings[].guidance` có cấu trúc trỏ tới `openclaw doctor --fix` và `openclaw plugins inspect <id> --runtime --json` để theo dõi tiếp. Các mục plugin bị tắt và bản ghi không phải là đích đồng bộ chính thức được liên kết nguồn tin cậy sẽ được bỏ qua ở đây, phản ánh chính sách `skipDisabledPlugins` dùng bởi kiểm tra payload bị thiếu, nên một bản ghi plugin bị tắt đã cũ không thể chặn một bản cập nhật hợp lệ khác.

Khi Gateway đã cập nhật khởi động, việc tải plugin chỉ là xác minh: startup không chạy trình quản lý gói hoặc thay đổi cây dependency. Các lần khởi động lại `update.run` bằng trình quản lý gói bỏ qua cơ chế trì hoãn khi idle bình thường và cooldown khởi động lại sau khi cây gói đã được hoán đổi, để tiến trình cũ không thể tiếp tục lazy-load các chunk đã bị xóa.

Nếu bootstrap pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi cụ thể cho trình quản lý gói thay vì thử `npm run build` bên trong checkout.
</Note>

## Viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script launcher).

## Liên quan

- `openclaw doctor` (đề nghị chạy update trước trên checkout git)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
