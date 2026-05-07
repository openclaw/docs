---
read_when:
    - Bạn muốn cập nhật bản sao mã nguồn một cách an toàn
    - Bạn đang gỡ lỗi đầu ra hoặc các tùy chọn của `openclaw update`
    - Bạn cần hiểu hành vi viết tắt `--update`
summary: Tài liệu tham khảo CLI cho `openclaw update` (cập nhật nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-05-07T01:51:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw an toàn và chuyển đổi giữa các kênh ổn định/beta/dev.

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

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật qua trình quản lý gói có khởi động lại Gateway sẽ xác minh dịch vụ đã khởi động lại báo cáo phiên bản đã cập nhật như mong đợi trước khi lệnh thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; được lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu gói chỉ cho lần cập nhật này. Với các bản cài đặt qua gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (luồng channel/tag/target/restart) mà không ghi cấu hình, cài đặt, đồng bộ Plugin hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` mà máy có thể đọc, bao gồm
  `postUpdate.plugins.warnings` khi các Plugin được quản lý bị hỏng hoặc không thể tải cần
  sửa chữa sau khi cập nhật lõi thành công, và `postUpdate.plugins.integrityDrifts`
  khi phát hiện sai lệch hiện vật Plugin npm trong quá trình đồng bộ Plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1800 giây).
- `--yes`: bỏ qua các lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

`openclaw update` không có cờ `--verbose`. Dùng `--dry-run` để xem trước
các hành động channel/tag/install/restart dự kiến, `--json` để nhận kết quả
máy có thể đọc, và `openclaw update status --json` khi bạn chỉ cần thông tin về
kênh và khả dụng. Nếu bạn đang gỡ lỗi nhật ký Gateway quanh một lần cập nhật,
độ chi tiết trên console và cấp nhật ký tệp là riêng biệt: Gateway `--verbose` ảnh hưởng đến
đầu ra terminal/WebSocket, còn nhật ký tệp yêu cầu `logging.level: "debug"` hoặc
`"trace"` trong cấu hình. Xem [nhật ký Gateway](/vi/gateway/logging).

<Note>
Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các lần chạy `openclaw update` có thay đổi trạng thái bị tắt. Thay vào đó, hãy cập nhật nguồn Nix hoặc đầu vào flake cho bản cài đặt này; với nix-openclaw, dùng [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent. `openclaw update status` và `openclaw update --dry-run` vẫn chỉ đọc.
</Note>

<Warning>
Việc hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + thẻ/nhánh/SHA git (đối với checkout mã nguồn), cùng với tình trạng có bản cập nhật.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái mà máy có thể đọc.
- `--timeout <seconds>`: thời gian chờ cho các bước kiểm tra (mặc định là 3 giây).

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có checkout git, nó
sẽ đề nghị tạo một checkout.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho mỗi bước cập nhật (mặc định `1800`)

## Cách hoạt động

Khi bạn chuyển kênh một cách rõ ràng (`--channel ...`), OpenClaw cũng giữ cho
phương thức cài đặt được đồng bộ:

- `dev` → bảo đảm có một checkout git (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật nó, và cài đặt CLI toàn cục từ checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên dist-tag npm `beta`, nhưng quay về `latest` khi beta
  bị thiếu hoặc cũ hơn bản phát hành ổn định hiện tại.

OpenClaw chưa có kênh hỗ trợ LTS hoặc hằng tháng. Chúng tôi đang hướng tới
các dòng hỗ trợ hằng tháng, nhưng `--channel` hiện chỉ chấp nhận
`stable`, `beta`, và `dev`. Dùng `--tag <version-or-dist-tag>` cho một mục tiêu
một lần khi bạn cần một hiện vật gói cụ thể.

Trình tự động cập nhật lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI
bên ngoài trình xử lý yêu cầu Gateway đang chạy. Các bản cập nhật trình quản lý gói
`update.run` của mặt phẳng điều khiển buộc khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi gói,
vì tiến trình Gateway cũ vẫn có thể còn các đoạn trong bộ nhớ trỏ tới
những tệp đã bị gói mới xóa.

Với các bản cài đặt qua trình quản lý gói, `openclaw update` phân giải phiên bản
gói mục tiêu trước khi gọi trình quản lý gói. Các bản cài đặt npm toàn cục dùng một lần cài đặt theo giai đoạn:
OpenClaw cài gói mới vào một tiền tố npm tạm thời, xác minh
bảng kê `dist` đã đóng gói ở đó, rồi hoán đổi cây gói sạch đó vào
tiền tố toàn cục thực. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ Plugin, và
công việc khởi động lại sẽ không chạy từ cây đáng ngờ. Ngay cả khi phiên bản đã cài
đã khớp với mục tiêu, lệnh vẫn làm mới bản cài đặt gói toàn cục,
rồi chạy đồng bộ Plugin, làm mới hoàn tất lệnh lõi, và công việc khởi động lại. Điều này
giữ cho các sidecar đã đóng gói và bản ghi Plugin do kênh sở hữu đồng bộ với
bản dựng OpenClaw đã cài đặt, trong khi để các lần dựng lại hoàn tất lệnh Plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` rõ ràng.

Khi một dịch vụ Gateway được quản lý cục bộ đã được cài đặt và bật khởi động lại,
các bản cập nhật qua trình quản lý gói dừng dịch vụ đang chạy trước khi thay thế cây gói,
rồi làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ, và xác minh Gateway đã khởi động lại báo cáo phiên bản như mong đợi trước khi
báo thành công. Trên macOS, kiểm tra sau cập nhật cũng xác minh LaunchAgent
đã được tải/đang chạy cho hồ sơ đang hoạt động và cổng loopback đã cấu hình đang
khỏe. Nếu plist đã được cài đặt nhưng launchd không giám sát nó, OpenClaw
tự động bootstrap lại LaunchAgent, rồi chạy lại các kiểm tra
sẵn sàng về sức khỏe/phiên bản/kênh. Một bootstrap mới tải tác vụ RunAtLoad
trực tiếp, nên quá trình khôi phục cập nhật không ngay lập tức `kickstart -k` Gateway
vừa được sinh ra. Nếu Gateway vẫn không trở nên khỏe, lệnh thoát
khác 0 và in đường dẫn nhật ký khởi động lại cùng các hướng dẫn khởi động lại, cài đặt lại, và
rollback gói rõ ràng. Với `--no-restart`,
việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị dừng hoặc
khởi động lại, nên Gateway đang chạy có thể tiếp tục giữ mã cũ cho đến khi bạn khởi động lại
thủ công.

## Luồng checkout git

### Chọn kênh

- `stable`: checkout thẻ không beta mới nhất, rồi build và doctor.
- `beta`: ưu tiên thẻ `-beta` mới nhất, nhưng quay về thẻ ổn định mới nhất khi beta bị thiếu hoặc cũ hơn.
- `dev`: checkout `main`, rồi fetch và rebase.

### Các bước cập nhật

<Steps>
  <Step title="Xác minh worktree sạch">
    Yêu cầu không có thay đổi chưa commit.
  </Step>
  <Step title="Chuyển kênh">
    Chuyển sang kênh đã chọn (thẻ hoặc nhánh).
  </Step>
  <Step title="Fetch upstream">
    Chỉ dành cho dev.
  </Step>
  <Step title="Build tiền kiểm (chỉ dev)">
    Chạy build TypeScript trong một worktree tạm. Nếu tip thất bại, lùi lại tối đa 10 commit để tìm commit mới nhất có thể build. Đặt `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` để cũng chạy lint trong lần tiền kiểm này; lint chạy ở chế độ tuần tự bị ràng buộc vì máy chủ cập nhật của người dùng thường nhỏ hơn runner CI.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt phụ thuộc">
    Dùng trình quản lý gói của repo. Với checkout pnpm, trình cập nhật bootstrap `pnpm` theo nhu cầu (trước tiên qua `corepack`, rồi phương án dự phòng `npm install pnpm@10` tạm thời) thay vì chạy `npm run build` bên trong workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Build gateway và Control UI.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ Plugin">
    Đồng bộ Plugin với kênh đang hoạt động. Dev dùng Plugin đi kèm; stable và beta dùng npm. Cập nhật các bản cài Plugin được theo dõi.
  </Step>
</Steps>

Trên kênh cập nhật beta, các bản cài Plugin npm và ClawHub được theo dõi đi theo
dòng mặc định/latest sẽ thử bản phát hành Plugin `@beta` trước. Nếu Plugin không có
bản phát hành beta, OpenClaw quay về spec mặc định/latest đã ghi. Với Plugin
npm, OpenClaw cũng quay về khi gói beta tồn tại nhưng không vượt qua
xác thực cài đặt. Các phiên bản chính xác và thẻ rõ ràng không bị viết lại.

<Warning>
Nếu một bản cập nhật Plugin npm được ghim chính xác phân giải tới một hiện vật có integrity khác với bản ghi cài đặt đã lưu, `openclaw update` hủy bản cập nhật hiện vật Plugin đó thay vì cài đặt nó. Chỉ cài đặt lại hoặc cập nhật Plugin một cách rõ ràng sau khi xác minh rằng bạn tin tưởng hiện vật mới.
</Warning>

<Note>
Các lỗi đồng bộ Plugin sau cập nhật có phạm vi trong một Plugin được quản lý được báo cáo dưới dạng cảnh báo sau khi cập nhật lõi thành công. Kết quả JSON giữ `status: "ok"` cấp cao nhất của cập nhật và báo cáo `postUpdate.plugins.status: "warning"` kèm hướng dẫn `openclaw doctor --fix` và `openclaw plugins inspect <id> --runtime --json`. Các ngoại lệ trình cập nhật hoặc đồng bộ bất ngờ vẫn làm kết quả cập nhật thất bại. Sửa lỗi cài đặt hoặc cập nhật Plugin, rồi chạy lại `openclaw doctor --fix` hoặc `openclaw update`.

Khi Gateway đã cập nhật khởi động, việc tải Plugin chỉ xác minh: startup không chạy trình quản lý gói hoặc thay đổi cây phụ thuộc. Các lần khởi động lại `update.run` qua trình quản lý gói bỏ qua trì hoãn nhàn rỗi thông thường và cooldown khởi động lại sau khi cây gói đã được hoán đổi, nên tiến trình cũ không thể tiếp tục lazy-load các đoạn đã bị xóa.

Nếu bootstrap pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi dành riêng cho trình quản lý gói thay vì thử `npm run build` bên trong checkout.
</Note>

## Cú pháp rút gọn `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script khởi chạy).

## Liên quan

- `openclaw doctor` (đề nghị chạy cập nhật trước trên checkout git)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
