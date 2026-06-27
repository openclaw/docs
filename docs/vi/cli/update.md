---
read_when:
    - Bạn muốn cập nhật một bản checkout mã nguồn một cách an toàn
    - Bạn đang gỡ lỗi đầu ra hoặc các tùy chọn của `openclaw update`
    - Bạn cần hiểu hành vi viết tắt `--update`
summary: Tham chiếu CLI cho `openclaw update` (cập nhật mã nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-06-27T17:21:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw một cách an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn đã cài đặt qua **npm/pnpm/bun** (cài đặt global, không có siêu dữ liệu git),
việc cập nhật diễn ra qua luồng trình quản lý gói trong [Cập nhật](/vi/install/updating).

## Cách sử dụng

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Tùy chọn

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật qua trình quản lý gói có khởi động lại Gateway sẽ xác minh rằng dịch vụ đã khởi động lại báo cáo đúng phiên bản đã cập nhật như mong đợi trước khi lệnh thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; được lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu gói chỉ cho lần cập nhật này. Với các bản cài đặt bằng gói, `main` ánh xạ tới `github:openclaw/openclaw#main`; các đặc tả nguồn GitHub/git được đóng gói vào một tarball tạm thời trước khi cài đặt npm global theo giai đoạn.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (luồng channel/tag/target/restart) mà không ghi cấu hình, cài đặt, đồng bộ Plugin hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` để máy đọc được, bao gồm
  `postUpdate.plugins.warnings` khi các Plugin được quản lý bị hỏng hoặc không thể tải cần
  sửa chữa sau khi cập nhật lõi thành công, chi tiết fallback Plugin của kênh beta
  khi một Plugin không có bản phát hành beta, và `postUpdate.plugins.integrityDrifts`
  khi phát hiện sai lệch hiện vật Plugin npm trong quá trình đồng bộ Plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1800 giây).
- `--yes`: bỏ qua lời nhắc xác nhận (ví dụ xác nhận hạ cấp).
- `--acknowledge-clawhub-risk`: sau khi xem lại cảnh báo độ tin cậy của ClawHub cộng đồng,
  cho phép đồng bộ Plugin sau cập nhật tiếp tục mà không cần lời nhắc tương tác.
  Nếu không có tùy chọn này, các bản phát hành Plugin ClawHub cộng đồng có rủi ro sẽ bị bỏ qua và
  giữ nguyên khi OpenClaw không thể nhắc. Các gói ClawHub chính thức và
  nguồn Plugin OpenClaw đi kèm bỏ qua lời nhắc độ tin cậy bản phát hành này.

`openclaw update` không có cờ `--verbose`. Dùng `--dry-run` để xem trước
các hành động channel/tag/install/restart dự kiến, `--json` để lấy kết quả
máy đọc được, và `openclaw update status --json` khi bạn chỉ cần chi tiết kênh và
khả dụng. Nếu bạn đang gỡ lỗi log Gateway quanh một lần cập nhật,
độ chi tiết console và cấp độ log tệp là riêng biệt: Gateway `--verbose` ảnh hưởng
đến đầu ra terminal/WebSocket, còn log tệp yêu cầu `logging.level: "debug"` hoặc
`"trace"` trong cấu hình. Xem [log Gateway](/vi/gateway/logging).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các lần chạy `openclaw update` có thay đổi trạng thái bị vô hiệu hóa. Thay vào đó, hãy cập nhật nguồn Nix hoặc đầu vào flake cho bản cài đặt này; với nix-openclaw, dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent. `openclaw update status` và `openclaw update --dry-run` vẫn chỉ đọc.
</Note>

<Warning>
Việc hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + thẻ/nhánh/SHA git (đối với checkout từ nguồn), cùng khả dụng cập nhật.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái để máy đọc được.
- `--timeout <seconds>`: thời gian chờ cho các kiểm tra (mặc định là 3 giây).

## `update repair`

Chạy lại bước hoàn tất cập nhật sau khi gói lõi đã thay đổi nhưng công việc
sửa chữa sau đó không hoàn tất sạch sẽ. Đây là đường dẫn khôi phục được hỗ trợ khi
`openclaw update` đã cài đặt gói lõi mới nhưng đồng bộ Plugin sau lõi,
siêu dữ liệu Plugin npm được quản lý, làm mới registry, hoặc sửa chữa doctor vẫn cần
hội tụ.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Tùy chọn:

- `--channel <stable|beta|dev>`: lưu kênh cập nhật trước khi sửa chữa và
  chạy hội tụ Plugin theo kênh đó.
- `--json`: in JSON hoàn tất để máy đọc được.
- `--timeout <seconds>`: thời gian chờ cho các bước sửa chữa (mặc định `1800`).
- `--yes`: bỏ qua lời nhắc xác nhận.
- `--acknowledge-clawhub-risk`: sau khi xem lại cảnh báo độ tin cậy của ClawHub cộng đồng,
  cho phép hội tụ Plugin trong lúc sửa chữa tiếp tục mà không cần
  lời nhắc tương tác. Các gói ClawHub chính thức và nguồn Plugin OpenClaw đi kèm
  bỏ qua lời nhắc độ tin cậy bản phát hành này.
- `--no-restart`: được chấp nhận để tương đồng với lệnh update; repair không bao giờ khởi động lại
  Gateway.

`openclaw update repair` chạy `openclaw doctor --fix`, tải lại cấu hình và
bản ghi cài đặt đã sửa, đồng bộ các Plugin được theo dõi cho kênh cập nhật đang hoạt động,
cập nhật các bản cài đặt Plugin npm được quản lý, sửa các payload Plugin đã cấu hình bị thiếu,
làm mới registry Plugin, và ghi siêu dữ liệu bản ghi cài đặt đã hội tụ.
Nó không cài đặt gói lõi mới và không khởi động lại Gateway.

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có checkout git, nó
đề nghị tạo một checkout.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho từng bước cập nhật (mặc định `1800`)

## Lệnh này làm gì

Khi bạn chuyển kênh một cách rõ ràng (`--channel ...`), OpenClaw cũng giữ cho
phương thức cài đặt được đồng bộ:

- `dev` → bảo đảm có một checkout git (mặc định: `~/openclaw`, hoặc `$OPENCLAW_HOME/openclaw` khi
  `OPENCLAW_HOME` được đặt; ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật nó, và cài đặt CLI global từ checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên dist-tag npm `beta`, nhưng fallback về `latest` khi beta
  bị thiếu hoặc cũ hơn bản phát hành stable hiện tại.

Trình tự cập nhật lõi tự động của Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI
bên ngoài trình xử lý yêu cầu Gateway đang chạy. Các bản cập nhật qua trình quản lý gói của control plane `update.run`
và các bản cập nhật checkout git có giám sát cũng dùng một
bàn giao dịch vụ được quản lý thay vì thay thế cây gói hoặc dựng lại
`dist/` bên trong tiến trình Gateway đang chạy. Gateway khởi động một helper tách rời,
thoát, và helper chạy đường dẫn CLI `openclaw update --yes --json` bình thường
từ bên ngoài cây tiến trình Gateway. Nếu bàn giao đó không khả dụng,
`update.run` trả về phản hồi có cấu trúc cùng lệnh shell an toàn để chạy
thủ công.

Đối với bản cài đặt qua trình quản lý gói, `openclaw update` phân giải phiên bản gói
mục tiêu trước khi gọi trình quản lý gói. Cài đặt npm global dùng quy trình cài đặt theo giai đoạn:
OpenClaw cài gói mới vào một prefix npm tạm thời, xác minh
bảng kê `dist` đã đóng gói ở đó, rồi hoán đổi cây gói sạch đó vào
prefix global thật. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ Plugin, và
công việc khởi động lại sẽ không chạy từ cây đáng ngờ. Ngay cả khi phiên bản đã cài đặt
đã khớp với mục tiêu, lệnh vẫn làm mới bản cài đặt gói global,
sau đó chạy đồng bộ Plugin, làm mới hoàn thành lệnh lõi, và công việc khởi động lại. Điều này
giữ các sidecar đã đóng gói và bản ghi Plugin do kênh sở hữu đồng bộ với bản dựng
OpenClaw đã cài đặt, trong khi để các lần dựng lại hoàn thành lệnh Plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` rõ ràng.

Khi dịch vụ Gateway được quản lý cục bộ đã được cài đặt và khởi động lại được bật,
các bản cập nhật qua trình quản lý gói và checkout git dừng dịch vụ đang chạy trước khi
thay thế cây gói hoặc thay đổi đầu ra checkout/build. Trình cập nhật
sau đó làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ, và xác minh Gateway đã khởi động lại trước khi báo cáo
`Gateway: restarted and verified.`. Các bản cập nhật qua trình quản lý gói còn xác minh
Gateway đã khởi động lại báo cáo phiên bản gói mong đợi; các bản cập nhật checkout git
xác minh tình trạng Gateway và mức sẵn sàng dịch vụ sau khi dựng lại. Trên macOS,
kiểm tra sau cập nhật cũng xác minh LaunchAgent đã được tải/đang chạy cho hồ sơ
đang hoạt động và cổng loopback đã cấu hình hoạt động tốt. Nếu plist đã được cài đặt
nhưng launchd không giám sát nó, OpenClaw tự động bootstrap lại LaunchAgent,
sau đó chạy lại các kiểm tra tình trạng/phiên bản/kênh sẵn sàng. Một lần bootstrap mới
tải trực tiếp job RunAtLoad, nên khôi phục cập nhật không
`kickstart -k` ngay Gateway vừa được sinh ra. Nếu Gateway vẫn không
trở nên khỏe mạnh, lệnh thoát khác không và in đường dẫn log khởi động lại
cùng hướng dẫn khởi động lại, cài đặt lại, và rollback gói rõ ràng. Nếu không thể
khởi động lại, lệnh in `Gateway: restart skipped (...)` hoặc
`Gateway: restart failed: ...` với gợi ý thủ công `openclaw gateway restart`.
Với `--no-restart`, việc thay thế gói hoặc dựng lại git vẫn chạy nhưng
dịch vụ được quản lý không bị dừng hoặc khởi động lại, nên Gateway đang chạy có thể tiếp tục dùng
mã cũ cho đến khi bạn khởi động lại thủ công.

### Dạng phản hồi control plane

Khi `update.run` được gọi qua control plane của Gateway trên một
bản cài đặt qua trình quản lý gói hoặc checkout git có giám sát, trình xử lý báo cáo
việc khởi tạo bàn giao riêng biệt với lần cập nhật CLI tiếp tục sau khi
Gateway thoát:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, và
  `handoff.status: "started"` nghĩa là Gateway đã tạo bàn giao dịch vụ được quản lý
  và lên lịch tự khởi động lại để helper tách rời có thể chạy
  `openclaw update --yes --json` bên ngoài tiến trình dịch vụ đang chạy.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, và
  `handoff.status: "unavailable"` nghĩa là OpenClaw không tìm thấy ranh giới dịch vụ
  giám sát và danh tính dịch vụ bền vững để bàn giao an toàn. Ví dụ,
  bàn giao systemd yêu cầu danh tính unit OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`), không chỉ các dấu hiệu tiến trình systemd xung quanh. Phản hồi
  bao gồm `handoff.command`, lệnh shell để chạy từ bên ngoài
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` nghĩa là
  Gateway đã cố tạo bàn giao nhưng không thể sinh helper tách rời.

Payload `sentinel` vẫn được ghi trước khi Gateway thoát, và bàn giao CLI
cập nhật cùng sentinel khởi động lại sau khi các kiểm tra tình trạng khởi động lại dịch vụ
hoàn tất. Trong lúc bàn giao, sentinel có thể mang
`stats.reason: "restart-health-pending"` mà không có continuation thành công; Gateway đã
khởi động lại tiếp tục polling nó và chỉ kích hoạt continuation sau khi CLI
đã xác minh tình trạng dịch vụ và ghi lại sentinel với kết quả `ok`
cuối cùng. `openclaw status` và `openclaw status --all` hiển thị một hàng `Update restart`
khi sentinel đó đang chờ hoặc thất bại, và `update.status` làm mới rồi
trả về sentinel mới nhất.

## Luồng checkout git

### Chọn kênh

- `stable`: checkout thẻ non-beta mới nhất, rồi build và doctor.
- `beta`: ưu tiên thẻ `-beta` mới nhất, nhưng fallback về thẻ stable mới nhất khi beta bị thiếu hoặc cũ hơn.
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
    Chạy build TypeScript trong một worktree tạm. Nếu tip thất bại, lùi lại tối đa 10 commit để tìm commit mới nhất có thể build. Đặt `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` để cũng chạy lint trong bước preflight này; lint chạy ở chế độ tuần tự bị giới hạn vì các máy chủ cập nhật của người dùng thường nhỏ hơn CI runner.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt phụ thuộc">
    Sử dụng trình quản lý gói của repo. Với các checkout pnpm, trình cập nhật bootstrap `pnpm` khi cần (trước tiên qua `corepack`, sau đó fallback tạm thời bằng `npm install pnpm@11`) thay vì chạy `npm run build` bên trong workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Build Gateway và Control UI.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ Plugin">
    Đồng bộ Plugin với kênh đang hoạt động. Dev dùng Plugin đi kèm; stable và beta dùng npm. Cập nhật các bản cài Plugin đang được theo dõi.
  </Step>
</Steps>

Trên kênh cập nhật beta, các bản cài Plugin npm và ClawHub đang được theo dõi
theo nhánh mặc định/latest sẽ thử bản phát hành Plugin `@beta` trước. Nếu Plugin không có
bản phát hành beta, OpenClaw fallback về spec mặc định/latest đã ghi lại và báo cáo
điều đó dưới dạng cảnh báo. Với Plugin npm, OpenClaw cũng fallback khi package beta
tồn tại nhưng không vượt qua xác thực cài đặt. Các cảnh báo fallback Plugin này
không làm bản cập nhật lõi thất bại. Phiên bản chính xác và tag tường minh sẽ không
bị viết lại.

<Warning>
Nếu một bản cập nhật Plugin npm được pin chính xác phân giải thành artifact có integrity khác với bản ghi cài đặt đã lưu, `openclaw update` sẽ hủy bản cập nhật artifact Plugin đó thay vì cài đặt nó. Chỉ cài đặt lại hoặc cập nhật Plugin một cách tường minh sau khi xác minh rằng bạn tin tưởng artifact mới.
</Warning>

<Note>
Các lỗi đồng bộ Plugin sau cập nhật được giới hạn trong một Plugin được quản lý và đường dẫn đồng bộ có thể đi vòng qua (ví dụ: registry npm không truy cập được cho một Plugin không thiết yếu) sẽ được báo cáo dưới dạng cảnh báo sau khi cập nhật lõi thành công. Kết quả JSON giữ `status: "ok"` ở cấp cao nhất và báo cáo `postUpdate.plugins.status: "warning"` cùng hướng dẫn `openclaw update repair` và `openclaw plugins inspect <id> --runtime --json`. Các ngoại lệ không mong đợi từ trình cập nhật hoặc đồng bộ vẫn làm kết quả cập nhật thất bại. Sửa lỗi cài đặt hoặc cập nhật Plugin, rồi chạy lại `openclaw update repair`.

Sau bước đồng bộ theo từng Plugin, `openclaw update` chạy một lượt **hội tụ sau lõi** bắt buộc trước khi Gateway được khởi động lại: nó sửa các payload Plugin đã cấu hình bị thiếu, xác thực từng bản ghi cài đặt đang được theo dõi và _đang hoạt động_ trên đĩa, đồng thời xác minh tĩnh rằng `package.json` của nó có thể parse được (và mọi `main` được khai báo tường minh đều tồn tại). Lỗi từ lượt này — và snapshot cấu hình OpenClaw không hợp lệ — trả về `postUpdate.plugins.status: "error"` và chuyển `status` cập nhật cấp cao nhất thành `"error"`, vì vậy `openclaw update` thoát khác 0 và Gateway _không_ được khởi động lại với một tập Plugin chưa được xác minh. Lỗi bao gồm các dòng `postUpdate.plugins.warnings[].guidance` có cấu trúc trỏ tới `openclaw update repair` và `openclaw plugins inspect <id> --runtime --json` để theo dõi tiếp. Các mục Plugin bị tắt và bản ghi không phải là mục tiêu đồng bộ chính thức được liên kết với nguồn đáng tin cậy sẽ bị bỏ qua tại đây, phản ánh chính sách `skipDisabledPlugins` được dùng bởi kiểm tra payload bị thiếu, vì vậy một bản ghi Plugin bị tắt đã cũ không thể chặn một bản cập nhật hợp lệ khác.

Khi Gateway đã cập nhật khởi động, việc tải Plugin chỉ xác minh: startup không
chạy trình quản lý gói hoặc thay đổi cây phụ thuộc. Các lần khởi động lại
`update.run` của trình quản lý gói được chuyển cho đường dẫn dịch vụ do CLI quản lý, vì vậy việc hoán đổi package diễn ra
bên ngoài tiến trình Gateway cũ và các kiểm tra sức khỏe dịch vụ quyết định liệu
bản cập nhật có thể được báo cáo là hoàn tất hay không.

Nếu bootstrap pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi riêng cho trình quản lý gói thay vì thử `npm run build` bên trong checkout.
</Note>

## Cách viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script launcher).

## Liên quan

- `openclaw doctor` (đề nghị chạy cập nhật trước trên các checkout git)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
