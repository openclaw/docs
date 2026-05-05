---
read_when:
    - Bạn muốn cập nhật một bản checkout mã nguồn một cách an toàn
    - Bạn đang gỡ lỗi đầu ra hoặc tùy chọn của `openclaw update`
    - Bạn cần hiểu cách hoạt động của cú pháp viết tắt `--update`
summary: Tài liệu tham khảo CLI cho `openclaw update` (cập nhật mã nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-05-05T01:45:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn đã cài đặt qua **npm/pnpm/bun** (cài đặt toàn cục, không có siêu dữ liệu git),
quá trình cập nhật diễn ra qua luồng trình quản lý gói trong [Cập nhật](/vi/install/updating).

## Cách dùng

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

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật qua trình quản lý gói có khởi động lại Gateway sẽ xác minh rằng dịch vụ đã khởi động lại báo cáo đúng phiên bản đã cập nhật dự kiến trước khi lệnh thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; được lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu gói chỉ cho lần cập nhật này. Với các bản cài đặt gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (luồng channel/tag/target/restart) mà không ghi cấu hình, cài đặt, đồng bộ Plugin, hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` cho máy đọc được, bao gồm
  `postUpdate.plugins.integrityDrifts` khi phát hiện lệch tạo tác Plugin npm
  trong quá trình đồng bộ Plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1800 giây).
- `--yes`: bỏ qua lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

`openclaw update` không có cờ `--verbose`. Dùng `--dry-run` để xem trước
các hành động channel/tag/install/restart dự kiến, `--json` để nhận kết quả
cho máy đọc được, và `openclaw update status --json` khi bạn chỉ cần thông tin
về kênh và tính khả dụng. Nếu bạn đang gỡ lỗi nhật ký Gateway quanh một lần cập nhật,
độ chi tiết trên console và cấp độ nhật ký tệp là riêng biệt: Gateway `--verbose` ảnh hưởng
tới đầu ra terminal/WebSocket, trong khi nhật ký tệp yêu cầu `logging.level: "debug"` hoặc
`"trace"` trong cấu hình. Xem [ghi nhật ký Gateway](/vi/gateway/logging).

<Warning>
Hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + thẻ/nhánh/SHA git (đối với checkout từ mã nguồn), cùng tính khả dụng của bản cập nhật.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái cho máy đọc được.
- `--timeout <seconds>`: thời gian chờ cho các bước kiểm tra (mặc định là 3 giây).

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có checkout git, luồng này
sẽ đề nghị tạo một checkout.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho mỗi bước cập nhật (mặc định `1800`)

## Lệnh này làm gì

Khi bạn chuyển kênh một cách rõ ràng (`--channel ...`), OpenClaw cũng giữ cho
phương thức cài đặt được đồng bộ:

- `dev` → đảm bảo có checkout git (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật checkout đó, và cài đặt CLI toàn cục từ checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên dist-tag npm `beta`, nhưng quay lại `latest` khi beta
  bị thiếu hoặc cũ hơn bản phát hành stable hiện tại.

Trình tự cập nhật tự động của lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI
bên ngoài trình xử lý yêu cầu Gateway đang chạy. Các bản cập nhật qua trình quản lý gói `update.run`
của mặt phẳng điều khiển buộc một lần khởi động lại cập nhật không trì hoãn, không có thời gian chờ hồi,
sau khi hoán đổi gói, vì tiến trình Gateway cũ vẫn có thể có các đoạn trong bộ nhớ trỏ tới
các tệp đã bị gói mới xóa.

Với các bản cài đặt qua trình quản lý gói, `openclaw update` phân giải phiên bản gói
mục tiêu trước khi gọi trình quản lý gói. Các bản cài đặt npm toàn cục dùng cài đặt theo giai đoạn:
OpenClaw cài gói mới vào một tiền tố npm tạm thời, xác minh
kiểm kê `dist` đã đóng gói ở đó, rồi hoán đổi cây gói sạch đó vào
tiền tố toàn cục thật. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ Plugin, và
công việc khởi động lại sẽ không chạy từ cây đáng nghi đó. Ngay cả khi phiên bản đã cài đặt
đã khớp với mục tiêu, lệnh vẫn làm mới bản cài đặt gói toàn cục,
sau đó chạy đồng bộ Plugin, làm mới hoàn thành lệnh lõi, và công việc khởi động lại. Điều này
giữ cho các sidecar đã đóng gói và bản ghi Plugin do kênh sở hữu được đồng bộ với
bản build OpenClaw đã cài đặt, đồng thời để các lần dựng lại hoàn thành lệnh Plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` rõ ràng.

Khi dịch vụ Gateway được quản lý cục bộ đã được cài đặt và khởi động lại được bật,
các bản cập nhật qua trình quản lý gói sẽ dừng dịch vụ đang chạy trước khi thay thế cây gói,
sau đó làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ, và xác minh Gateway đã khởi động lại báo cáo đúng phiên bản dự kiến trước khi
báo cáo thành công. Trên macOS, bước kiểm tra sau cập nhật cũng xác minh LaunchAgent
đã được tải/đang chạy cho hồ sơ hoạt động và cổng local loopback đã cấu hình
khỏe mạnh. Nếu plist đã được cài đặt nhưng launchd không giám sát nó, OpenClaw
tự động bootstrap lại LaunchAgent, rồi chạy lại các bước kiểm tra
sẵn sàng về sức khỏe/phiên bản/kênh. Một lần bootstrap mới tải trực tiếp job RunAtLoad,
vì vậy quá trình khôi phục cập nhật không lập tức `kickstart -k` Gateway
vừa được sinh ra. Nếu Gateway vẫn không trở nên khỏe mạnh, lệnh thoát
khác không và in đường dẫn nhật ký khởi động lại cùng các hướng dẫn rõ ràng về khởi động lại, cài đặt lại, và
rollback gói. Với `--no-restart`,
việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị dừng hoặc
khởi động lại, vì vậy Gateway đang chạy có thể tiếp tục dùng mã cũ cho đến khi bạn khởi động lại
thủ công.

## Luồng checkout git

### Chọn kênh

- `stable`: checkout thẻ không phải beta mới nhất, rồi build và chạy doctor.
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
    Chạy lint và build TypeScript trong một worktree tạm. Nếu tip thất bại, lùi lại tối đa 10 commit để tìm bản build sạch mới nhất.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt phụ thuộc">
    Dùng trình quản lý gói của repo. Với các checkout pnpm, trình cập nhật bootstrap `pnpm` theo nhu cầu (qua `corepack` trước, rồi fallback tạm thời `npm install pnpm@10`) thay vì chạy `npm run build` bên trong một workspace pnpm.
  </Step>
  <Step title="Build giao diện điều khiển">
    Build gateway và giao diện điều khiển.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy làm bước kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ Plugin">
    Đồng bộ Plugin với kênh đang hoạt động. Dev dùng các Plugin đi kèm; stable và beta dùng npm. Cập nhật các bản cài đặt Plugin được theo dõi.
  </Step>
</Steps>

Trên kênh cập nhật beta, các bản cài đặt Plugin npm và ClawHub được theo dõi đi theo
dòng default/latest sẽ thử bản phát hành Plugin `@beta` trước. Nếu Plugin không có
bản phát hành beta, OpenClaw quay lại spec default/latest đã ghi nhận. Với các Plugin
npm, OpenClaw cũng quay lại khi gói beta tồn tại nhưng không vượt qua
xác thực cài đặt. Các phiên bản chính xác và thẻ rõ ràng không bị viết lại.

<Warning>
Nếu một bản cập nhật Plugin npm được ghim chính xác phân giải thành một tạo tác có tính toàn vẹn khác với bản ghi cài đặt đã lưu, `openclaw update` hủy bản cập nhật tạo tác Plugin đó thay vì cài đặt nó. Chỉ cài đặt lại hoặc cập nhật Plugin một cách rõ ràng sau khi xác minh rằng bạn tin tưởng tạo tác mới.
</Warning>

<Note>
Lỗi đồng bộ Plugin sau cập nhật làm kết quả cập nhật thất bại và dừng công việc khởi động lại tiếp theo. Sửa lỗi cài đặt hoặc cập nhật Plugin, rồi chạy lại `openclaw update`.

Khi Gateway đã cập nhật khởi động, việc tải Plugin chỉ là xác minh: khởi động không chạy trình quản lý gói hoặc thay đổi cây phụ thuộc. Các lần khởi động lại `update.run` qua trình quản lý gói bỏ qua cơ chế trì hoãn lúc nhàn rỗi thông thường và thời gian chờ hồi khởi động lại sau khi cây gói đã được hoán đổi, để tiến trình cũ không thể tiếp tục lazy-load các đoạn đã bị xóa.

Nếu bootstrap pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi dành riêng cho trình quản lý gói thay vì thử `npm run build` bên trong checkout.
</Note>

## Cách viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script launcher).

## Liên quan

- `openclaw doctor` (đề nghị chạy cập nhật trước trên các checkout git)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
