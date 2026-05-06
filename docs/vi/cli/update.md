---
read_when:
    - Bạn muốn cập nhật một bản checkout mã nguồn một cách an toàn
    - Bạn đang gỡ lỗi đầu ra hoặc các tùy chọn của `openclaw update`
    - Bạn cần hiểu hành vi viết tắt của `--update`
summary: Tham chiếu CLI cho `openclaw update` (cập nhật nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-05-06T09:06:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn đã cài đặt qua **npm/pnpm/bun** (cài đặt toàn cục, không có siêu dữ liệu git), các bản cập nhật diễn ra theo luồng trình quản lý gói trong [Cập nhật](/vi/install/updating).

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

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật qua trình quản lý gói có khởi động lại Gateway sẽ xác minh rằng dịch vụ đã khởi động lại báo cáo đúng phiên bản đã cập nhật mong đợi trước khi lệnh thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; được lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè đích gói chỉ cho lần cập nhật này. Với các bản cài đặt dạng gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (luồng channel/tag/target/restart) mà không ghi cấu hình, cài đặt, đồng bộ plugin hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` có thể đọc bằng máy, bao gồm `postUpdate.plugins.warnings` khi các plugin được quản lý bị hỏng hoặc không thể tải cần sửa chữa sau khi cập nhật lõi thành công, và `postUpdate.plugins.integrityDrifts` khi phát hiện sai lệch artifact plugin npm trong quá trình đồng bộ plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1800 giây).
- `--yes`: bỏ qua các lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

`openclaw update` không có cờ `--verbose`. Dùng `--dry-run` để xem trước các hành động channel/tag/install/restart dự kiến, `--json` để nhận kết quả có thể đọc bằng máy, và `openclaw update status --json` khi bạn chỉ cần chi tiết về kênh và trạng thái sẵn có. Nếu bạn đang gỡ lỗi nhật ký Gateway quanh một lần cập nhật, độ chi tiết trên console và mức nhật ký tệp là riêng biệt: Gateway `--verbose` ảnh hưởng đến đầu ra terminal/WebSocket, còn nhật ký tệp yêu cầu `logging.level: "debug"` hoặc `"trace"` trong cấu hình. Xem [Ghi nhật ký Gateway](/vi/gateway/logging).

<Warning>
Hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + thẻ/nhánh/SHA git (đối với checkout từ mã nguồn), cùng trạng thái có bản cập nhật.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái có thể đọc bằng máy.
- `--timeout <seconds>`: thời gian chờ cho các kiểm tra (mặc định là 3 giây).

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có checkout git, nó sẽ đề nghị tạo một checkout.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho từng bước cập nhật (mặc định `1800`)

## Chức năng

Khi bạn chuyển kênh một cách tường minh (`--channel ...`), OpenClaw cũng giữ cho phương thức cài đặt đồng bộ:

- `dev` → bảo đảm có một checkout git (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`), cập nhật checkout đó, và cài đặt CLI toàn cục từ checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên dist-tag npm `beta`, nhưng quay lại `latest` khi beta bị thiếu hoặc cũ hơn bản phát hành stable hiện tại.

Trình tự động cập nhật lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI bên ngoài trình xử lý yêu cầu Gateway đang chạy. Các bản cập nhật qua trình quản lý gói `update.run` của mặt phẳng điều khiển buộc khởi động lại cập nhật không trì hoãn, không cooldown sau khi thay gói, vì tiến trình Gateway cũ có thể vẫn còn các phần trong bộ nhớ trỏ tới những tệp đã bị gói mới xóa.

Đối với các bản cài đặt qua trình quản lý gói, `openclaw update` phân giải phiên bản gói đích trước khi gọi trình quản lý gói. Các bản cài đặt toàn cục npm dùng cài đặt theo giai đoạn: OpenClaw cài gói mới vào một tiền tố npm tạm thời, xác minh inventory `dist` đã đóng gói ở đó, rồi hoán đổi cây gói sạch đó vào tiền tố toàn cục thật. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ plugin và công việc khởi động lại sẽ không chạy từ cây đáng ngờ. Ngay cả khi phiên bản đã cài đặt đã khớp với đích, lệnh vẫn làm mới bản cài đặt gói toàn cục, rồi chạy đồng bộ plugin, làm mới hoàn tất lệnh lõi và công việc khởi động lại. Điều này giữ cho các sidecar đã đóng gói và bản ghi plugin thuộc sở hữu kênh đồng bộ với bản dựng OpenClaw đã cài đặt, đồng thời để việc dựng lại hoàn tất lệnh plugin đầy đủ cho các lần chạy `openclaw completion --write-state` tường minh.

Khi một dịch vụ Gateway cục bộ được quản lý đã được cài đặt và tính năng khởi động lại được bật, các bản cập nhật qua trình quản lý gói sẽ dừng dịch vụ đang chạy trước khi thay thế cây gói, sau đó làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại dịch vụ, và xác minh Gateway đã khởi động lại báo cáo đúng phiên bản mong đợi trước khi báo cáo thành công. Trên macOS, kiểm tra sau cập nhật cũng xác minh LaunchAgent đã được tải/đang chạy cho hồ sơ hoạt động và cổng loopback đã cấu hình đang khỏe mạnh. Nếu plist đã được cài đặt nhưng launchd không giám sát nó, OpenClaw tự động bootstrap lại LaunchAgent, rồi chạy lại các kiểm tra sẵn sàng health/version/channel. Một bootstrap mới tải trực tiếp tác vụ RunAtLoad, nên quá trình khôi phục cập nhật không lập tức `kickstart -k` Gateway vừa được sinh ra. Nếu Gateway vẫn không trở nên khỏe mạnh, lệnh thoát với mã khác 0 và in đường dẫn nhật ký khởi động lại cùng các hướng dẫn khởi động lại, cài đặt lại và rollback gói tường minh. Với `--no-restart`, việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị dừng hoặc khởi động lại, nên Gateway đang chạy có thể tiếp tục dùng mã cũ cho đến khi bạn tự khởi động lại.

## Luồng checkout git

### Chọn kênh

- `stable`: checkout thẻ không phải beta mới nhất, rồi build và doctor.
- `beta`: ưu tiên thẻ `-beta` mới nhất, nhưng quay lại thẻ stable mới nhất khi beta bị thiếu hoặc cũ hơn.
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
  <Step title="Build preflight (chỉ dev)">
    Chạy bản dựng TypeScript trong một worktree tạm. Nếu tip thất bại, lùi tối đa 10 commit để tìm commit mới nhất có thể build. Đặt `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` để cũng chạy lint trong preflight này; lint chạy ở chế độ tuần tự bị giới hạn vì máy chủ cập nhật của người dùng thường nhỏ hơn runner CI.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt dependency">
    Dùng trình quản lý gói của repo. Với các checkout pnpm, trình cập nhật bootstrap `pnpm` theo nhu cầu (trước tiên qua `corepack`, rồi fallback tạm thời `npm install pnpm@10`) thay vì chạy `npm run build` bên trong workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Build gateway và Control UI.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ plugin">
    Đồng bộ plugin với kênh hoạt động. Dev dùng plugin được đóng gói sẵn; stable và beta dùng npm. Cập nhật các bản cài đặt plugin được theo dõi.
  </Step>
</Steps>

Trên kênh cập nhật beta, các bản cài đặt plugin npm và ClawHub được theo dõi theo dòng default/latest sẽ thử bản phát hành plugin `@beta` trước. Nếu plugin không có bản phát hành beta, OpenClaw quay lại spec default/latest đã ghi. Với plugin npm, OpenClaw cũng quay lại khi gói beta tồn tại nhưng không vượt qua xác thực cài đặt. Các phiên bản chính xác và thẻ tường minh không bị viết lại.

<Warning>
Nếu một bản cập nhật plugin npm được ghim chính xác phân giải tới một artifact có tính toàn vẹn khác với bản ghi cài đặt đã lưu, `openclaw update` sẽ hủy cập nhật artifact plugin đó thay vì cài đặt nó. Chỉ cài đặt lại hoặc cập nhật plugin một cách tường minh sau khi xác minh rằng bạn tin tưởng artifact mới.
</Warning>

<Note>
Các lỗi đồng bộ plugin sau cập nhật được giới hạn trong một plugin được quản lý sẽ được báo cáo dưới dạng cảnh báo sau khi cập nhật lõi thành công. Kết quả JSON giữ `status: "ok"` ở cấp cao nhất của cập nhật và báo cáo `postUpdate.plugins.status: "warning"` kèm hướng dẫn `openclaw doctor --fix` và `openclaw plugins inspect <id> --runtime --json`. Các ngoại lệ bất ngờ của trình cập nhật hoặc đồng bộ vẫn làm kết quả cập nhật thất bại. Sửa lỗi cài đặt hoặc cập nhật plugin, rồi chạy lại `openclaw doctor --fix` hoặc `openclaw update`.

Khi Gateway đã cập nhật khởi động, việc tải plugin chỉ là xác minh: startup không chạy trình quản lý gói hoặc thay đổi cây dependency. Các lần khởi động lại `update.run` qua trình quản lý gói bỏ qua cơ chế trì hoãn khi nhàn rỗi thông thường và cooldown khởi động lại sau khi cây gói đã được hoán đổi, để tiến trình cũ không thể tiếp tục tải lười các phần đã bị xóa.

Nếu bootstrap pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi dành riêng cho trình quản lý gói thay vì thử `npm run build` bên trong checkout.
</Note>

## Cách viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script launcher).

## Liên quan

- `openclaw doctor` (đề nghị chạy cập nhật trước trên các checkout git)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
