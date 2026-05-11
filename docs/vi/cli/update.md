---
read_when:
    - Bạn muốn cập nhật một bản checkout mã nguồn một cách an toàn
    - Bạn đang gỡ lỗi đầu ra hoặc tùy chọn của `openclaw update`
    - Bạn cần hiểu hành vi viết tắt `--update`
summary: Tham chiếu CLI cho `openclaw update` (cập nhật nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-05-11T20:27:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn đã cài đặt qua **npm/pnpm/bun** (cài đặt toàn cục, không có siêu dữ liệu git),
việc cập nhật diễn ra qua luồng trình quản lý gói trong [Cập nhật](/vi/install/updating).

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

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật qua trình quản lý gói có khởi động lại Gateway sẽ xác minh dịch vụ đã khởi động lại báo cáo đúng phiên bản đã cập nhật như mong đợi trước khi lệnh thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; được lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu gói chỉ cho lần cập nhật này. Với các bản cài đặt bằng gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (luồng channel/tag/target/restart) mà không ghi cấu hình, cài đặt, đồng bộ plugin, hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` mà máy có thể đọc, bao gồm
  `postUpdate.plugins.warnings` khi các plugin được quản lý bị hỏng hoặc không thể tải cần
  sửa chữa sau khi bản cập nhật lõi thành công, chi tiết dự phòng plugin ở kênh beta
  khi một plugin không có bản phát hành beta, và `postUpdate.plugins.integrityDrifts`
  khi phát hiện sai lệch hiện vật plugin npm trong quá trình đồng bộ plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1800 giây).
- `--yes`: bỏ qua lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

`openclaw update` không có cờ `--verbose`. Dùng `--dry-run` để xem trước
các hành động channel/tag/install/restart dự kiến, `--json` cho kết quả
mà máy có thể đọc, và `openclaw update status --json` khi bạn chỉ cần chi tiết
về kênh và tính khả dụng. Nếu bạn đang gỡ lỗi nhật ký Gateway quanh một lần cập nhật,
độ chi tiết trên console và cấp độ nhật ký tệp là riêng biệt: Gateway `--verbose` ảnh hưởng
đầu ra terminal/WebSocket, còn nhật ký tệp yêu cầu `logging.level: "debug"` hoặc
`"trace"` trong cấu hình. Xem [ghi nhật ký Gateway](/vi/gateway/logging).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các lần chạy `openclaw update` có thay đổi trạng thái sẽ bị vô hiệu hóa. Thay vào đó hãy cập nhật nguồn Nix hoặc đầu vào flake cho bản cài đặt này; với nix-openclaw, dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent. `openclaw update status` và `openclaw update --dry-run` vẫn chỉ đọc.
</Note>

<Warning>
Hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + git tag/branch/SHA (đối với bản checkout từ nguồn), cùng với tính khả dụng của bản cập nhật.

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
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có git checkout, nó
sẽ đề nghị tạo một bản checkout.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho từng bước cập nhật (mặc định `1800`)

## Cơ chế hoạt động

Khi bạn chuyển kênh một cách rõ ràng (`--channel ...`), OpenClaw cũng giữ cho
phương thức cài đặt được căn chỉnh:

- `dev` → đảm bảo có một git checkout (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật nó, và cài đặt CLI toàn cục từ bản checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên npm dist-tag `beta`, nhưng dự phòng về `latest` khi beta
  bị thiếu hoặc cũ hơn bản phát hành stable hiện tại.

Bộ tự động cập nhật lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI
bên ngoài trình xử lý yêu cầu Gateway đang chạy. Các bản cập nhật qua trình quản lý gói
`update.run` của mặt phẳng điều khiển buộc khởi động lại cập nhật không trì hoãn, không thời gian chờ sau khi hoán đổi gói,
vì tiến trình Gateway cũ có thể vẫn còn các đoạn trong bộ nhớ trỏ tới
các tệp đã bị gói mới xóa.

Đối với các bản cài đặt qua trình quản lý gói, `openclaw update` phân giải phiên bản
gói mục tiêu trước khi gọi trình quản lý gói. Các bản cài đặt npm toàn cục dùng quy trình cài đặt theo giai đoạn:
OpenClaw cài đặt gói mới vào một prefix npm tạm thời, xác minh
danh mục `dist` được đóng gói ở đó, rồi hoán đổi cây gói sạch đó vào
prefix toàn cục thật. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ plugin, và
công việc khởi động lại sẽ không chạy từ cây đáng ngờ đó. Ngay cả khi phiên bản đã cài đặt
đã khớp với mục tiêu, lệnh vẫn làm mới bản cài đặt gói toàn cục,
sau đó chạy đồng bộ plugin, làm mới hoàn tất lệnh lõi, và công việc khởi động lại. Điều này
giữ các sidecar được đóng gói và bản ghi plugin do kênh sở hữu đồng bộ với
bản dựng OpenClaw đã cài đặt, trong khi để việc dựng lại hoàn tất lệnh plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` rõ ràng.

Khi một dịch vụ Gateway được quản lý cục bộ đã được cài đặt và tính năng khởi động lại được bật,
các bản cập nhật qua trình quản lý gói dừng dịch vụ đang chạy trước khi thay thế cây gói,
sau đó làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ, và xác minh Gateway đã khởi động lại báo cáo phiên bản mong đợi trước khi
báo cáo thành công. Trên macOS, kiểm tra sau cập nhật cũng xác minh LaunchAgent
đã được tải/đang chạy cho hồ sơ đang hoạt động và cổng loopback đã cấu hình
khỏe mạnh. Nếu plist đã được cài đặt nhưng launchd không giám sát nó, OpenClaw
tự động bootstrap lại LaunchAgent, rồi chạy lại
các kiểm tra sẵn sàng về sức khỏe/phiên bản/kênh. Một lần bootstrap mới tải job RunAtLoad
trực tiếp, vì vậy quá trình khôi phục cập nhật không lập tức `kickstart -k` Gateway
vừa được sinh ra. Nếu Gateway vẫn không trở nên khỏe mạnh, lệnh thoát
khác 0 và in đường dẫn nhật ký khởi động lại cùng hướng dẫn khởi động lại, cài đặt lại, và
rollback gói một cách rõ ràng. Với `--no-restart`,
việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị dừng hoặc
khởi động lại, vì vậy Gateway đang chạy có thể giữ mã cũ cho đến khi bạn khởi động lại
thủ công.

## Luồng git checkout

### Chọn kênh

- `stable`: checkout tag không phải beta mới nhất, sau đó build và doctor.
- `beta`: ưu tiên tag `-beta` mới nhất, nhưng dự phòng về tag stable mới nhất khi beta bị thiếu hoặc cũ hơn.
- `dev`: checkout `main`, sau đó fetch và rebase.

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
    Chạy bản build TypeScript trong một worktree tạm. Nếu tip thất bại, lùi tối đa 10 commit để tìm commit mới nhất có thể build. Đặt `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` để cũng chạy lint trong preflight này; lint chạy ở chế độ serial hạn chế vì máy chủ cập nhật của người dùng thường nhỏ hơn runner CI.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt phụ thuộc">
    Dùng trình quản lý gói của repo. Với các bản checkout pnpm, trình cập nhật bootstrap `pnpm` theo nhu cầu (trước tiên qua `corepack`, sau đó dự phòng bằng `npm install pnpm@11` tạm thời) thay vì chạy `npm run build` bên trong workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Build gateway và Control UI.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ plugin">
    Đồng bộ plugin với kênh đang hoạt động. Dev dùng plugin đi kèm; stable và beta dùng npm. Cập nhật các bản cài đặt plugin đang được theo dõi.
  </Step>
</Steps>

Trên kênh cập nhật beta, các bản cài đặt plugin npm và ClawHub được theo dõi theo
dòng default/latest sẽ thử bản phát hành plugin `@beta` trước. Nếu plugin không có
bản phát hành beta, OpenClaw dự phòng về spec default/latest đã ghi lại và báo cáo
điều đó như một cảnh báo. Với plugin npm, OpenClaw cũng dự phòng khi gói beta
tồn tại nhưng không vượt qua xác thực cài đặt. Những cảnh báo dự phòng plugin này
không làm bản cập nhật lõi thất bại. Các phiên bản chính xác và tag rõ ràng không bị
ghi lại.

<Warning>
Nếu một bản cập nhật plugin npm được ghim chính xác phân giải tới một hiện vật có tính toàn vẹn khác với bản ghi cài đặt đã lưu, `openclaw update` hủy bản cập nhật hiện vật plugin đó thay vì cài đặt nó. Chỉ cài đặt lại hoặc cập nhật plugin một cách rõ ràng sau khi xác minh rằng bạn tin tưởng hiện vật mới.
</Warning>

<Note>
Các lỗi đồng bộ plugin sau cập nhật được giới hạn trong một plugin được quản lý sẽ được báo cáo dưới dạng cảnh báo sau khi bản cập nhật lõi thành công. Kết quả JSON giữ `status: "ok"` cấp cao nhất của bản cập nhật và báo cáo `postUpdate.plugins.status: "warning"` cùng hướng dẫn `openclaw doctor --fix` và `openclaw plugins inspect <id> --runtime --json`. Các ngoại lệ bất ngờ của trình cập nhật hoặc đồng bộ vẫn làm kết quả cập nhật thất bại. Sửa lỗi cài đặt hoặc cập nhật plugin, rồi chạy lại `openclaw doctor --fix` hoặc `openclaw update`.

Khi Gateway đã cập nhật khởi động, việc tải plugin chỉ là xác minh: lúc khởi động không chạy trình quản lý gói hoặc thay đổi cây phụ thuộc. Các lần khởi động lại `update.run` qua trình quản lý gói bỏ qua trì hoãn khi rảnh thông thường và thời gian chờ khởi động lại sau khi cây gói đã được hoán đổi, vì vậy tiến trình cũ không thể tiếp tục lazy-load các đoạn đã bị xóa.

Nếu bootstrap pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi riêng cho trình quản lý gói thay vì thử `npm run build` bên trong bản checkout.
</Note>

## Lối tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script launcher).

## Liên quan

- `openclaw doctor` (đề nghị chạy cập nhật trước trên các bản git checkout)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
