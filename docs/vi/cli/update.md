---
read_when:
    - Bạn muốn cập nhật một bản checkout mã nguồn một cách an toàn
    - Bạn đang gỡ lỗi đầu ra hoặc tùy chọn của `openclaw update`
    - Bạn cần hiểu cách hoạt động dạng viết tắt của `--update`
summary: Tài liệu tham khảo CLI cho `openclaw update` (cập nhật nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-05-03T21:29:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw an toàn và chuyển đổi giữa các kênh ổn định/beta/dev.

Nếu bạn đã cài đặt qua **npm/pnpm/bun** (cài đặt toàn cục, không có siêu dữ liệu git), các bản cập nhật diễn ra qua luồng trình quản lý gói trong [Cập nhật](/vi/install/updating).

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
- `--dry-run`: xem trước các hành động cập nhật dự kiến (luồng kênh/tag/mục tiêu/khởi động lại) mà không ghi cấu hình, cài đặt, đồng bộ Plugin hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` máy có thể đọc, bao gồm
  `postUpdate.plugins.integrityDrifts` khi phát hiện sai lệch artifact Plugin npm
  trong quá trình đồng bộ Plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1800s).
- `--yes`: bỏ qua lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

`openclaw update` không có cờ `--verbose`. Dùng `--dry-run` để xem trước
các hành động kênh/tag/cài đặt/khởi động lại đã lên kế hoạch, `--json` để nhận
kết quả máy có thể đọc, và `openclaw update status --json` khi bạn chỉ cần thông tin
về kênh và tính khả dụng. Nếu bạn đang gỡ lỗi nhật ký Gateway quanh một lần cập nhật,
độ chi tiết trên console và cấp độ nhật ký tệp là riêng biệt: Gateway `--verbose` ảnh hưởng
đến đầu ra terminal/WebSocket, còn nhật ký tệp yêu cầu `logging.level: "debug"` hoặc
`"trace"` trong cấu hình. Xem [Ghi nhật ký Gateway](/vi/gateway/logging).

<Warning>
Hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + tag/nhánh/SHA git (đối với checkout từ nguồn), cùng với tính khả dụng của bản cập nhật.

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
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có checkout git, luồng này
sẽ đề nghị tạo một checkout.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho mỗi bước cập nhật (mặc định `1800`)

## Lệnh này làm gì

Khi bạn chuyển kênh rõ ràng (`--channel ...`), OpenClaw cũng giữ phương thức
cài đặt được căn chỉnh:

- `dev` → đảm bảo có một checkout git (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật checkout đó và cài đặt CLI toàn cục từ checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên dist-tag npm `beta`, nhưng quay về `latest` khi beta
  bị thiếu hoặc cũ hơn bản phát hành ổn định hiện tại.

Trình tự động cập nhật lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI
bên ngoài trình xử lý yêu cầu Gateway đang chạy. Các bản cập nhật trình quản lý gói `update.run`
trên control-plane buộc một lần khởi động lại cập nhật không trì hoãn, không thời gian chờ sau khi thay gói,
vì tiến trình Gateway cũ có thể vẫn còn các phần trong bộ nhớ trỏ tới
các tệp đã bị gói mới xóa.

Đối với các bản cài đặt bằng trình quản lý gói, `openclaw update` phân giải phiên bản gói
mục tiêu trước khi gọi trình quản lý gói. Các bản cài đặt npm toàn cục dùng cơ chế cài đặt theo giai đoạn:
OpenClaw cài gói mới vào một tiền tố npm tạm thời, xác minh inventory `dist`
được đóng gói tại đó, rồi thay cây gói sạch đó vào tiền tố toàn cục thật.
Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ Plugin và công việc khởi động lại
sẽ không chạy từ cây đáng ngờ đó. Ngay cả khi phiên bản đã cài đặt đã
khớp với mục tiêu, lệnh vẫn làm mới bản cài đặt gói toàn cục,
sau đó chạy đồng bộ Plugin, làm mới hoàn tất lệnh lõi, và công việc khởi động lại. Điều này
giữ các sidecar đã đóng gói và bản ghi Plugin do kênh sở hữu được căn chỉnh với
bản dựng OpenClaw đã cài đặt, đồng thời để việc dựng lại hoàn tất lệnh Plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` rõ ràng.

Khi dịch vụ Gateway được quản lý cục bộ đã được cài đặt và khởi động lại được bật,
các bản cập nhật bằng trình quản lý gói sẽ dừng dịch vụ đang chạy trước khi thay thế cây gói,
sau đó làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ, và xác minh Gateway đã khởi động lại báo cáo phiên bản mong đợi trước khi
báo thành công. Trên macOS, kiểm tra sau cập nhật cũng xác minh LaunchAgent
đã được tải/đang chạy cho hồ sơ đang hoạt động và cổng loopback đã cấu hình đang
khỏe mạnh. Nếu plist đã được cài đặt nhưng launchd không giám sát nó, OpenClaw
tự động bootstrap lại LaunchAgent, rồi chạy lại các kiểm tra
sẵn sàng về sức khỏe/phiên bản/kênh. Một lần bootstrap mới tải trực tiếp job RunAtLoad,
vì vậy quá trình phục hồi cập nhật không lập tức `kickstart -k` Gateway
mới được sinh ra. Nếu Gateway vẫn không trở nên khỏe mạnh, lệnh thoát
khác không và in đường dẫn nhật ký khởi động lại cùng hướng dẫn khởi động lại, cài đặt lại và
rollback gói rõ ràng. Với `--no-restart`,
việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị dừng hoặc
khởi động lại, nên Gateway đang chạy có thể tiếp tục dùng mã cũ cho đến khi bạn khởi động lại
thủ công.

## Luồng checkout git

### Chọn kênh

- `stable`: checkout tag không phải beta mới nhất, rồi build và doctor.
- `beta`: ưu tiên tag `-beta` mới nhất, nhưng quay về tag ổn định mới nhất khi beta bị thiếu hoặc cũ hơn.
- `dev`: checkout `main`, rồi fetch và rebase.

### Các bước cập nhật

<Steps>
  <Step title="Xác minh worktree sạch">
    Yêu cầu không có thay đổi chưa commit.
  </Step>
  <Step title="Chuyển kênh">
    Chuyển sang kênh đã chọn (tag hoặc nhánh).
  </Step>
  <Step title="Fetch upstream">
    Chỉ dev.
  </Step>
  <Step title="Build preflight (chỉ dev)">
    Chạy lint và build TypeScript trong một worktree tạm. Nếu tip thất bại, lùi tối đa 10 commit để tìm bản build sạch mới nhất.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt phụ thuộc">
    Dùng trình quản lý gói của repo. Với các checkout pnpm, trình cập nhật bootstrap `pnpm` theo nhu cầu (qua `corepack` trước, rồi fallback `npm install pnpm@10` tạm thời) thay vì chạy `npm run build` bên trong một workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Build gateway và Control UI.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ Plugin">
    Đồng bộ Plugin với kênh đang hoạt động. Dev dùng Plugin đi kèm; stable và beta dùng npm. Cập nhật các bản cài đặt Plugin được theo dõi.
  </Step>
</Steps>

Trên kênh cập nhật beta, các bản cài đặt Plugin npm và ClawHub được theo dõi theo
dòng mặc định/latest sẽ thử bản phát hành Plugin `@beta` trước. Nếu Plugin không có
bản phát hành beta, OpenClaw quay về spec mặc định/latest đã ghi lại. Các
phiên bản chính xác và tag rõ ràng không bị viết lại.

<Warning>
Nếu một bản cập nhật Plugin npm được ghim chính xác phân giải thành một artifact có integrity khác với bản ghi cài đặt đã lưu, `openclaw update` sẽ hủy bản cập nhật artifact Plugin đó thay vì cài đặt nó. Chỉ cài đặt lại hoặc cập nhật Plugin một cách rõ ràng sau khi xác minh rằng bạn tin tưởng artifact mới.
</Warning>

<Note>
Lỗi đồng bộ Plugin sau cập nhật khiến kết quả cập nhật thất bại và dừng công việc khởi động lại tiếp theo. Sửa lỗi cài đặt hoặc cập nhật Plugin, rồi chạy lại `openclaw update`.

Khi Gateway đã cập nhật khởi động, việc tải Plugin chỉ xác minh: khởi động không chạy trình quản lý gói hoặc thay đổi cây phụ thuộc. Các lần khởi động lại `update.run` bằng trình quản lý gói bỏ qua cơ chế trì hoãn khi nhàn rỗi thông thường và thời gian chờ khởi động lại sau khi cây gói đã được thay, để tiến trình cũ không thể tiếp tục tải lười các phần đã bị xóa.

Nếu bootstrap pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi dành riêng cho trình quản lý gói thay vì thử `npm run build` bên trong checkout.
</Note>

## Viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script launcher).

## Liên quan

- `openclaw doctor` (đề nghị chạy cập nhật trước trên các checkout git)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
